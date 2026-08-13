# 選手経歴イベント

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `EVENT_DRAFT_JOIN_LINES`

- 出典: `src/data.js`
- コード内コメント: イベントセリフ定数群（旧 ui-common.js の EVENT_QUOTES から分解 / 2026-04-19） / pickQuote / getTraitQuote / getDraftQuote 等から参照
- 本数: 79

### standard.normal[]

- `EVENT_DRAFT_JOIN_LINES.standard.normal[1]`: よろしくお願いします。精一杯頑張ります
- `EVENT_DRAFT_JOIN_LINES.standard.normal[2]`: 選んでくださって、ありがとうございます
- `EVENT_DRAFT_JOIN_LINES.standard.normal[3]`: 期待に応えられるよう、頑張ります

### standard.bold[]

- `EVENT_DRAFT_JOIN_LINES.standard.bold[1]`: てっぺんを獲りに来ました。ついてきてください
- `EVENT_DRAFT_JOIN_LINES.standard.bold[2]`: この団体で、必ずチャンピオンになります
- `EVENT_DRAFT_JOIN_LINES.standard.bold[3]`: 期待なんて軽く超えてみせる。見ててください

### standard.quiet[]

- `EVENT_DRAFT_JOIN_LINES.standard.quiet[1]`: …よろしくお願いします
- `EVENT_DRAFT_JOIN_LINES.standard.quiet[2]`: ………（深々と一礼）
- `EVENT_DRAFT_JOIN_LINES.standard.quiet[3]`: ……全力でやります

### standard.earnest[]

- `EVENT_DRAFT_JOIN_LINES.standard.earnest[1]`: 選んでくださって、ありがとうございます！ 精一杯頑張ります！
- `EVENT_DRAFT_JOIN_LINES.standard.earnest[2]`: 地道にコツコツ…努力で応えます
- `EVENT_DRAFT_JOIN_LINES.standard.earnest[3]`: 応援してくれる方々のためにも、頑張ります

### standard.emotional[]

- `EVENT_DRAFT_JOIN_LINES.standard.emotional[1]`: うぅっ…この日を、ずっと夢見ていました…！
- `EVENT_DRAFT_JOIN_LINES.standard.emotional[2]`: 嬉しいです…！ 頑張ります…！ 絶対に…！
- `EVENT_DRAFT_JOIN_LINES.standard.emotional[3]`: ずっと…ずっと待ってました…！ 全力で、頑張ります…！

### standard.easygoing[]

- `EVENT_DRAFT_JOIN_LINES.standard.easygoing[1]`: いやー、やっとだね。よろしく〜
- `EVENT_DRAFT_JOIN_LINES.standard.easygoing[2]`: えへへ、よろしくお願いしまーす
- `EVENT_DRAFT_JOIN_LINES.standard.easygoing[3]`: みんなと楽しくやりたいな。よろしくね

### standard.shy[]

- `EVENT_DRAFT_JOIN_LINES.standard.shy[1]`: あ、あの…よ、よろしくお願いします…！
- `EVENT_DRAFT_JOIN_LINES.standard.shy[2]`: う、うぅ…が、頑張ります…！
- `EVENT_DRAFT_JOIN_LINES.standard.shy[3]`: …っ、よ、よろしくお願いします…

### ojousama.normal[]

- `EVENT_DRAFT_JOIN_LINES.ojousama.normal[1]`: よろしくお願いしますわ。精一杯努めますの
- `EVENT_DRAFT_JOIN_LINES.ojousama.normal[2]`: お選びいただき、光栄ですわ

### ojousama.bold[]

- `EVENT_DRAFT_JOIN_LINES.ojousama.bold[1]`: チャンピオンになるために参りましたわ。ご期待くださいませ
- `EVENT_DRAFT_JOIN_LINES.ojousama.bold[2]`: 頂点に立ちますわよ。当然ですの

### ojousama.quiet[]

- `EVENT_DRAFT_JOIN_LINES.ojousama.quiet[1]`: …よ、よろしくお願いいたしますわ

### ojousama.earnest[]

- `EVENT_DRAFT_JOIN_LINES.ojousama.earnest[1]`: お選びいただき、光栄ですわ。精一杯努めますの
- `EVENT_DRAFT_JOIN_LINES.ojousama.earnest[2]`: 期待に応えられるよう、全力を尽くしますわ

### ojousama.emotional[]

- `EVENT_DRAFT_JOIN_LINES.ojousama.emotional[1]`: うぅっ…夢のようですわ…！ 精一杯頑張りますの…！

### ojousama.easygoing[]

- `EVENT_DRAFT_JOIN_LINES.ojousama.easygoing[1]`: ふふ、よろしくお願いしますわぁ
- `EVENT_DRAFT_JOIN_LINES.ojousama.easygoing[2]`: お仲間入りですわね。よろしくですの

### ojousama.shy[]

- `EVENT_DRAFT_JOIN_LINES.ojousama.shy[1]`: あ、あの…よ、よろしくお願いいたしますわ…

### polite.normal[]

- `EVENT_DRAFT_JOIN_LINES.polite.normal[1]`: 本日はよろしくお願いいたします
- `EVENT_DRAFT_JOIN_LINES.polite.normal[2]`: お選びいただき、ありがとうございます

### polite.bold[]

- `EVENT_DRAFT_JOIN_LINES.polite.bold[1]`: てっぺんを獲るために参りました。全力を尽くします
- `EVENT_DRAFT_JOIN_LINES.polite.bold[2]`: チャンピオンに、必ずなります

### polite.quiet[]

- `EVENT_DRAFT_JOIN_LINES.polite.quiet[1]`: …よろしくお願いいたします

### polite.earnest[]

- `EVENT_DRAFT_JOIN_LINES.polite.earnest[1]`: お選びいただき、ありがとうございます。精一杯頑張ります
- `EVENT_DRAFT_JOIN_LINES.polite.earnest[2]`: ご期待に応えられるよう、努力いたします

### polite.emotional[]

- `EVENT_DRAFT_JOIN_LINES.polite.emotional[1]`: う、うぅ…っ…ずっと、夢でした…！ 頑張ります…！

### polite.easygoing[]

- `EVENT_DRAFT_JOIN_LINES.polite.easygoing[1]`: よろしくお願いしますね〜 楽しみです

### polite.shy[]

- `EVENT_DRAFT_JOIN_LINES.polite.shy[1]`: あ、あの…よ、よろしくお願いいたします…

### delinquent.normal[]

- `EVENT_DRAFT_JOIN_LINES.delinquent.normal[1]`: よろしくな。暴れさせてもらうぜ
- `EVENT_DRAFT_JOIN_LINES.delinquent.normal[2]`: まぁ、期待しててくれよ

### delinquent.bold[]

- `EVENT_DRAFT_JOIN_LINES.delinquent.bold[1]`: 暴れまくってやるぜ。覚悟しとけよ
- `EVENT_DRAFT_JOIN_LINES.delinquent.bold[2]`: チャンピオン獲ってやるからな、見とけ

### delinquent.quiet[]

- `EVENT_DRAFT_JOIN_LINES.delinquent.quiet[1]`: …よろしく

### delinquent.earnest[]

- `EVENT_DRAFT_JOIN_LINES.delinquent.earnest[1]`: 選んでくれてありがとな！ コツコツ頑張るからよ

### delinquent.emotional[]

- `EVENT_DRAFT_JOIN_LINES.delinquent.emotional[1]`: うおっ…！ やった…！ ずっとこの日を待ってた…！

### delinquent.easygoing[]

- `EVENT_DRAFT_JOIN_LINES.delinquent.easygoing[1]`: よっ、よろしくな！ 楽しくやろうぜ

### delinquent.shy[]

- `EVENT_DRAFT_JOIN_LINES.delinquent.shy[1]`: …よ、よろしく…が、頑張る…

### cool.normal[]

- `EVENT_DRAFT_JOIN_LINES.cool.normal[1]`: ……よろしく
- `EVENT_DRAFT_JOIN_LINES.cool.normal[2]`: ……全力でやる

### cool.bold[]

- `EVENT_DRAFT_JOIN_LINES.cool.bold[1]`: ……てっぺんを獲る。それだけだ
- `EVENT_DRAFT_JOIN_LINES.cool.bold[2]`: ……結果で示す

### cool.quiet[]

- `EVENT_DRAFT_JOIN_LINES.cool.quiet[1]`: ……よろしく
- `EVENT_DRAFT_JOIN_LINES.cool.quiet[2]`: ……始めよう

### cool.earnest[]

- `EVENT_DRAFT_JOIN_LINES.cool.earnest[1]`: ……応える。努力で

### cool.emotional[]

- `EVENT_DRAFT_JOIN_LINES.cool.emotional[1]`: ……っ…この日を、待っていた

### cool.easygoing[]

- `EVENT_DRAFT_JOIN_LINES.cool.easygoing[1]`: …うん、よろしく

### cool.shy[]

- `EVENT_DRAFT_JOIN_LINES.cool.shy[1]`: ……よ、よろしく…

### seductive.normal[]

- `EVENT_DRAFT_JOIN_LINES.seductive.normal[1]`: よろしくね。期待に応えてあげる
- `EVENT_DRAFT_JOIN_LINES.seductive.normal[2]`: ふふ、選んでくれてありがとう

### seductive.bold[]

- `EVENT_DRAFT_JOIN_LINES.seductive.bold[1]`: チャンピオン、獲りに来たの。覚悟してて
- `EVENT_DRAFT_JOIN_LINES.seductive.bold[2]`: この団体、私が盛り上げてあげる

### seductive.quiet[]

- `EVENT_DRAFT_JOIN_LINES.seductive.quiet[1]`: ……よろしく

### seductive.earnest[]

- `EVENT_DRAFT_JOIN_LINES.seductive.earnest[1]`: 選んでくれてありがとう。期待に応えるわ

### seductive.emotional[]

- `EVENT_DRAFT_JOIN_LINES.seductive.emotional[1]`: …っ…夢みたい。精一杯頑張るわ…

### seductive.easygoing[]

- `EVENT_DRAFT_JOIN_LINES.seductive.easygoing[1]`: ふふ、よろしくね。楽しくやりましょ

### seductive.shy[]

- `EVENT_DRAFT_JOIN_LINES.seductive.shy[1]`: …あ、あの…よ、よろしくね…

### composed.normal[]

- `EVENT_DRAFT_JOIN_LINES.composed.normal[1]`: …よろしく。精一杯やるよ
- `EVENT_DRAFT_JOIN_LINES.composed.normal[2]`: …選んでくれてありがとう

### composed.bold[]

- `EVENT_DRAFT_JOIN_LINES.composed.bold[1]`: …てっぺんを獲りに来た。よろしく
- `EVENT_DRAFT_JOIN_LINES.composed.bold[2]`: …期待には応える。見ていて

### composed.quiet[]

- `EVENT_DRAFT_JOIN_LINES.composed.quiet[1]`: …よろしく。精一杯やる

### composed.earnest[]

- `EVENT_DRAFT_JOIN_LINES.composed.earnest[1]`: …選んでくれてありがとう。コツコツ頑張るよ

### composed.emotional[]

- `EVENT_DRAFT_JOIN_LINES.composed.emotional[1]`: …っ…ずっと、この日を待ってた。頑張るよ

### composed.easygoing[]

- `EVENT_DRAFT_JOIN_LINES.composed.easygoing[1]`: …よろしく。楽しくやろうね

### composed.shy[]

- `EVENT_DRAFT_JOIN_LINES.composed.shy[1]`: …よ、よろしくお願いします

## `EVENT_DRAFT_INTEREST_LINES`

- 出典: `src/data.js`
- 本数: 61

- `EVENT_DRAFT_INTEREST_LINES.cool.normal[1]`: …よろしく。精一杯やる
- `EVENT_DRAFT_INTEREST_LINES.cool.normal[2]`: …選んでくれるなら、全力で応える
- `EVENT_DRAFT_INTEREST_LINES.cool.bold[1]`: …闘わせてくれ。結果で語る
- `EVENT_DRAFT_INTEREST_LINES.cool.quiet[1]`: …戦わせてくれるなら、応える
- `EVENT_DRAFT_INTEREST_LINES.cool.shy[1]`: …私で良ければ。…頑張る
- `EVENT_DRAFT_INTEREST_LINES.cool.easygoing[1]`: …楽しくやろう。それでいい
- `EVENT_DRAFT_INTEREST_LINES.cool.easygoing[2]`: …退屈な試合はしない。約束する
- `EVENT_DRAFT_INTEREST_LINES.cool.earnest[1]`: …地道に積む。それが私のやり方だ
- `EVENT_DRAFT_INTEREST_LINES.cool.earnest[2]`: …誰より練習する。見ていてくれ
- `EVENT_DRAFT_INTEREST_LINES.cool.emotional[1]`: …選んでくれたら、全力で応える
- `EVENT_DRAFT_INTEREST_LINES.polite.normal[1]`: よろしくお願いいたします。精一杯務めます
- `EVENT_DRAFT_INTEREST_LINES.polite.normal[2]`: 選んでいただけましたら、全力で頑張ります
- `EVENT_DRAFT_INTEREST_LINES.polite.bold[1]`: 頂点を獲ります。それ以外に興味はありません
- `EVENT_DRAFT_INTEREST_LINES.polite.bold[2]`: 選んでいただけたら、決して後悔はさせません
- `EVENT_DRAFT_INTEREST_LINES.polite.quiet[1]`: …選んでいただけたら、精一杯やらせていただきます
- `EVENT_DRAFT_INTEREST_LINES.polite.shy[1]`: あ、あの…わたしなどでよろしければ…せ、精一杯務めます…
- `EVENT_DRAFT_INTEREST_LINES.polite.easygoing[1]`: えへへ、一緒に楽しくやりましょう
- `EVENT_DRAFT_INTEREST_LINES.polite.easygoing[2]`: 退屈なプロレスはしないって約束します
- `EVENT_DRAFT_INTEREST_LINES.polite.earnest[1]`: 地道に努力するのが取り柄です。信じていただけますか
- `EVENT_DRAFT_INTEREST_LINES.polite.emotional[1]`: 選んでいただけましたら…わたし、全力で…全力で頑張ります…！
- `EVENT_DRAFT_INTEREST_LINES.standard.normal[1]`: よろしくお願いします。精一杯やります
- `EVENT_DRAFT_INTEREST_LINES.standard.normal[2]`: 選んでいただけたら、全力で頑張ります
- `EVENT_DRAFT_INTEREST_LINES.standard.bold[1]`: てっぺんを獲る。それ以外に興味はない
- `EVENT_DRAFT_INTEREST_LINES.standard.bold[2]`: 私を選んでくれるなら、絶対に後悔はさせない！
- `EVENT_DRAFT_INTEREST_LINES.standard.quiet[1]`: ………よろしくお願いします
- `EVENT_DRAFT_INTEREST_LINES.standard.shy[1]`: あ、あの…私なんかで良ければ…が、頑張ります…
- `EVENT_DRAFT_INTEREST_LINES.standard.easygoing[1]`: えへへ、一緒に楽しくやりましょうよ！
- `EVENT_DRAFT_INTEREST_LINES.standard.easygoing[2]`: 退屈なプロレスはしないって約束するよ！
- `EVENT_DRAFT_INTEREST_LINES.standard.earnest[1]`: 地道にコツコツ…それが私のやり方です。信じてもらえますか？
- `EVENT_DRAFT_INTEREST_LINES.standard.earnest[2]`: 誰よりも練習します。見ていてください
- `EVENT_DRAFT_INTEREST_LINES.standard.emotional[1]`: 選んでくれたら…全力で…全力で頑張ります…！
- `EVENT_DRAFT_INTEREST_LINES.ojousama.normal[1]`: お選びいただけるなら、精一杯努めますわ
- `EVENT_DRAFT_INTEREST_LINES.ojousama.bold[1]`: 頂点に立つために参りますわ。覚悟はよろしくて？
- `EVENT_DRAFT_INTEREST_LINES.ojousama.quiet[1]`: ………よろしくお願いいたしますわ
- `EVENT_DRAFT_INTEREST_LINES.ojousama.shy[1]`: あ、あの…わたくしでよろしければ…が、頑張りますわ…
- `EVENT_DRAFT_INTEREST_LINES.ojousama.easygoing[1]`: うふふ、ご一緒に楽しくやりましょうよ
- `EVENT_DRAFT_INTEREST_LINES.ojousama.easygoing[2]`: 退屈なプロレスはしないと約束いたしますわ
- `EVENT_DRAFT_INTEREST_LINES.ojousama.earnest[1]`: コツコツ積み重ねるのが信条ですの。見ていてくださいませ
- `EVENT_DRAFT_INTEREST_LINES.ojousama.emotional[1]`: 選んでいただけたら…わたくし、全力で…全力で頑張りますわ…！
- `EVENT_DRAFT_INTEREST_LINES.delinquent.normal[1]`: 選んでくれるなら、全力で暴れるぜ
- `EVENT_DRAFT_INTEREST_LINES.delinquent.bold[1]`: 選ぶなら覚悟しろよ。手加減なんかしねえからな
- `EVENT_DRAFT_INTEREST_LINES.delinquent.quiet[1]`: ………よろしく。頼む
- `EVENT_DRAFT_INTEREST_LINES.delinquent.shy[1]`: あ、あの…あたしなんかで良ければ…が、頑張るんで…
- `EVENT_DRAFT_INTEREST_LINES.delinquent.easygoing[1]`: 楽しくやろうぜ！退屈なのは嫌いだからな！
- `EVENT_DRAFT_INTEREST_LINES.delinquent.earnest[1]`: 地道にコツコツ…それがあたしのやり方だ。信じてくれるか？
- `EVENT_DRAFT_INTEREST_LINES.delinquent.earnest[2]`: 誰よりも練習する。見ててくれ
- `EVENT_DRAFT_INTEREST_LINES.delinquent.emotional[1]`: 選んでくれたら…全力で…全力でやる…！
- `EVENT_DRAFT_INTEREST_LINES.seductive.normal[1]`: 選んでくれるなら…期待に応えるわよ
- `EVENT_DRAFT_INTEREST_LINES.seductive.bold[1]`: 私を選んで。後悔はさせないわ
- `EVENT_DRAFT_INTEREST_LINES.seductive.quiet[1]`: ………よろしく、ね
- `EVENT_DRAFT_INTEREST_LINES.seductive.shy[1]`: あ、あの…私で良ければ…が、頑張るから…
- `EVENT_DRAFT_INTEREST_LINES.seductive.easygoing[1]`: 一緒に楽しい団体を作りましょう？
- `EVENT_DRAFT_INTEREST_LINES.seductive.earnest[1]`: 地道に頑張るタイプよ。見ていてくれる？
- `EVENT_DRAFT_INTEREST_LINES.seductive.emotional[1]`: 選んでくれたら…全力で…全力でやるから…！
- `EVENT_DRAFT_INTEREST_LINES.composed.normal[1]`: …選んでくれるなら、応えるよ
- `EVENT_DRAFT_INTEREST_LINES.composed.bold[1]`: …てっぺんを獲りに来た。それだけ
- `EVENT_DRAFT_INTEREST_LINES.composed.quiet[1]`: ……よろしく
- `EVENT_DRAFT_INTEREST_LINES.composed.shy[1]`: …私で良ければ、だけど。…頑張るよ
- `EVENT_DRAFT_INTEREST_LINES.composed.easygoing[1]`: …楽しくやろう。退屈にはさせないよ
- `EVENT_DRAFT_INTEREST_LINES.composed.earnest[1]`: …コツコツやるタイプだ。見ていてくれれば
- `EVENT_DRAFT_INTEREST_LINES.composed.emotional[1]`: …っ…選んでくれたら、全力で応える

## `EVENT_INJURY_LINES`

- 出典: `src/data.js`
- 本数: 76

### standard.normal[]

- `EVENT_INJURY_LINES.standard.normal[1]`: うぅ…痛い…。でも、すぐ戻ります
- `EVENT_INJURY_LINES.standard.normal[2]`: しばらくお休みをいただきます
- `EVENT_INJURY_LINES.standard.normal[3]`: ごめんなさい…体が言うことを聞かなくて

### standard.bold[]

- `EVENT_INJURY_LINES.standard.bold[1]`: くっ…こんなところで止められるか！
- `EVENT_INJURY_LINES.standard.bold[2]`: この程度、問題じゃない
- `EVENT_INJURY_LINES.standard.bold[3]`: 早く戻る。絶対に遅れを取るもんか

### standard.quiet[]

- `EVENT_INJURY_LINES.standard.quiet[2]`: …（静かに頭を下げる）
- `EVENT_INJURY_LINES.standard.quiet[3]`: …ごめん

### standard.earnest[]

- `EVENT_INJURY_LINES.standard.earnest[1]`: ご期待に応えられず、すみません…
- `EVENT_INJURY_LINES.standard.earnest[2]`: 必ず万全の状態で戻ってきます
- `EVENT_INJURY_LINES.standard.earnest[3]`: 応援してくれるみんなに、申し訳ない…

### standard.emotional[]

- `EVENT_INJURY_LINES.standard.emotional[1]`: くぅっ…痛い…！ でも、絶対戻ります…！
- `EVENT_INJURY_LINES.standard.emotional[2]`: うぅ…こんなの悔しい…！
- `EVENT_INJURY_LINES.standard.emotional[3]`: 悔しい…！ 絶対に、絶対に戻る…！

### standard.easygoing[]

- `EVENT_INJURY_LINES.standard.easygoing[1]`: やっちゃったー。ちょっと休むね
- `EVENT_INJURY_LINES.standard.easygoing[2]`: えへへ…ごめん、ちょっと休むよ
- `EVENT_INJURY_LINES.standard.easygoing[3]`: まぁ、こういう時もあるよね。すぐ戻るから

### standard.shy[]

- `EVENT_INJURY_LINES.standard.shy[1]`: ご、ごめんなさい…ちょっと休みます…
- `EVENT_INJURY_LINES.standard.shy[2]`: う、うぅ…痛いです…
- `EVENT_INJURY_LINES.standard.shy[3]`: す、すみません…ご迷惑を…

### ojousama.normal[]

- `EVENT_INJURY_LINES.ojousama.normal[1]`: このくらい、たいしたことございませんわ
- `EVENT_INJURY_LINES.ojousama.normal[2]`: 少しだけ休ませてくださいまし

### ojousama.bold[]

- `EVENT_INJURY_LINES.ojousama.bold[1]`: このくらい何でもありませんわ。すぐ戻りますの
- `EVENT_INJURY_LINES.ojousama.bold[2]`: 私を止めるには足りませんわよ

### ojousama.quiet[]

- `EVENT_INJURY_LINES.ojousama.quiet[1]`: …ご迷惑を、おかけしますわ

### ojousama.earnest[]

- `EVENT_INJURY_LINES.ojousama.earnest[1]`: ご期待に添えず、申し訳ありませんわ
- `EVENT_INJURY_LINES.ojousama.earnest[2]`: 必ず、強くなって戻ってまいりますの

### ojousama.emotional[]

- `EVENT_INJURY_LINES.ojousama.emotional[1]`: 悔しいですわ…！ 必ず戻りますの…！

### ojousama.easygoing[]

- `EVENT_INJURY_LINES.ojousama.easygoing[1]`: あらあら…少し休みますわね

### ojousama.shy[]

- `EVENT_INJURY_LINES.ojousama.shy[1]`: ご、ごめんなさいませ…少しだけ、休ませてくださいまし…

### polite.normal[]

- `EVENT_INJURY_LINES.polite.normal[1]`: ご迷惑をおかけします…しばらく休みます
- `EVENT_INJURY_LINES.polite.normal[2]`: すみません…万全の状態で戻ってきます

### polite.bold[]

- `EVENT_INJURY_LINES.polite.bold[1]`: ご心配なく。必ず戻ってきます
- `EVENT_INJURY_LINES.polite.bold[2]`: この程度で止まる気はありません

### polite.quiet[]

- `EVENT_INJURY_LINES.polite.quiet[1]`: …ご迷惑を、おかけします

### polite.earnest[]

- `EVENT_INJURY_LINES.polite.earnest[1]`: ご期待に応えられず、申し訳ありません
- `EVENT_INJURY_LINES.polite.earnest[2]`: 必ず強くなって戻ってまいります

### polite.emotional[]

- `EVENT_INJURY_LINES.polite.emotional[1]`: …っ、悔しいです…でも、必ず戻ります…！

### polite.easygoing[]

- `EVENT_INJURY_LINES.polite.easygoing[1]`: あ、ちょっと休みますね〜 すぐ戻ります

### polite.shy[]

- `EVENT_INJURY_LINES.polite.shy[1]`: す、すみません…少しだけ休ませてください…

### delinquent.normal[]

- `EVENT_INJURY_LINES.delinquent.normal[1]`: ちっ…やっちまったか
- `EVENT_INJURY_LINES.delinquent.normal[2]`: こんなんで休むの、カッコ悪いな

### delinquent.bold[]

- `EVENT_INJURY_LINES.delinquent.bold[1]`: ちくしょう…！ ぜってぇ戻ってくるからな！
- `EVENT_INJURY_LINES.delinquent.bold[2]`: こんなんで終わってたまるかよ

### delinquent.quiet[]

- `EVENT_INJURY_LINES.delinquent.quiet[1]`: …ちっ

### delinquent.earnest[]

- `EVENT_INJURY_LINES.delinquent.earnest[1]`: 応援してくれてる奴らに、顔向けできねえ…

### delinquent.emotional[]

- `EVENT_INJURY_LINES.delinquent.emotional[1]`: ちくしょう…！ うっ…！ 絶対に戻るぞ…！

### delinquent.easygoing[]

- `EVENT_INJURY_LINES.delinquent.easygoing[1]`: やっちまったぜ〜 まぁすぐ戻るわ

### delinquent.shy[]

- `EVENT_INJURY_LINES.delinquent.shy[1]`: …ご、ごめん…ちょっと休む…

### cool.normal[]

- `EVENT_INJURY_LINES.cool.normal[1]`: ……すぐ戻る
- `EVENT_INJURY_LINES.cool.normal[2]`: ……心配はいらない

### cool.bold[]

- `EVENT_INJURY_LINES.cool.bold[1]`: ……この程度で止まらない
- `EVENT_INJURY_LINES.cool.bold[2]`: ……戻る。それだけだ

### cool.quiet[]

- `EVENT_INJURY_LINES.cool.quiet[2]`: ……すぐ戻る

### cool.earnest[]

- `EVENT_INJURY_LINES.cool.earnest[1]`: ……申し訳ない。必ず戻る

### cool.emotional[]

- `EVENT_INJURY_LINES.cool.emotional[1]`: ……っ…くそ。必ず戻る

### cool.easygoing[]

- `EVENT_INJURY_LINES.cool.easygoing[1]`: …ちょっと休む。すぐ戻るよ

### cool.shy[]

- `EVENT_INJURY_LINES.cool.shy[1]`: ……ご、ごめん…

### seductive.normal[]

- `EVENT_INJURY_LINES.seductive.normal[1]`: …ちょっとだけ、休ませてね
- `EVENT_INJURY_LINES.seductive.normal[2]`: すぐに戻るわ。待っててくれる？

### seductive.bold[]

- `EVENT_INJURY_LINES.seductive.bold[1]`: こんなことで止まると思ってる？ 甘いわ
- `EVENT_INJURY_LINES.seductive.bold[2]`: すぐ戻るわ。覚悟してなさい

### seductive.quiet[]

- `EVENT_INJURY_LINES.seductive.quiet[1]`: ……待っててね

### seductive.earnest[]

- `EVENT_INJURY_LINES.seductive.earnest[1]`: 応援してくれてる人に申し訳ないわ…必ず戻る

### seductive.emotional[]

- `EVENT_INJURY_LINES.seductive.emotional[1]`: …っ…悔しい…必ず戻ってやる…

### seductive.easygoing[]

- `EVENT_INJURY_LINES.seductive.easygoing[1]`: ちょっと休憩ね？ すぐ戻るから寂しがらないで

### seductive.shy[]

- `EVENT_INJURY_LINES.seductive.shy[1]`: …ご、ごめんね…少しだけ…休ませて…

### composed.normal[]

- `EVENT_INJURY_LINES.composed.normal[1]`: …少し休むよ。すぐ戻る
- `EVENT_INJURY_LINES.composed.normal[2]`: …大したことじゃないから、安心して

### composed.bold[]

- `EVENT_INJURY_LINES.composed.bold[1]`: …私の代わりは、そう簡単には見つからないよ
- `EVENT_INJURY_LINES.composed.bold[2]`: …問題ない。少し休めば治る

### composed.quiet[]

- `EVENT_INJURY_LINES.composed.quiet[1]`: …戻る。待ってて

### composed.earnest[]

- `EVENT_INJURY_LINES.composed.earnest[1]`: …応援に応えられなくて、ごめん。必ず戻るよ

### composed.emotional[]

- `EVENT_INJURY_LINES.composed.emotional[1]`: …っ…悔しい。でも、必ず戻る

### composed.easygoing[]

- `EVENT_INJURY_LINES.composed.easygoing[1]`: …ま、すぐ戻るよ。心配しないで

### composed.shy[]

- `EVENT_INJURY_LINES.composed.shy[1]`: …す、すみません。少し休みます

## `EVENT_TITLE_WIN_LINES`

- 出典: `src/data.js`
- 本数: 62

### cool.normal[]

- `EVENT_TITLE_WIN_LINES.cool.normal[1]`: …獲った。チャンピオンだ
- `EVENT_TITLE_WIN_LINES.cool.normal[2]`: …このベルトは手放さない

### cool.bold[]

- `EVENT_TITLE_WIN_LINES.cool.bold[1]`: …当然だ。この座は私のためにある

### cool.quiet[]

- `EVENT_TITLE_WIN_LINES.cool.quiet[1]`: …ようやくだ。この座は渡さない

### cool.shy[]

- `EVENT_TITLE_WIN_LINES.cool.shy[1]`: …私が、チャンピオン。…実感がない

### cool.easygoing[]

- `EVENT_TITLE_WIN_LINES.cool.easygoing[1]`: …新チャンピオンだ。ここからもっと盛り上げる
- `EVENT_TITLE_WIN_LINES.cool.easygoing[2]`: …ベルトを獲った。…悪くない気分だ

### cool.earnest[]

- `EVENT_TITLE_WIN_LINES.cool.earnest[1]`: …積み重ねてきて、よかった。本当に
- `EVENT_TITLE_WIN_LINES.cool.earnest[2]`: …諦めなくてよかった。このベルトは努力の結晶だ

### cool.emotional[]

- `EVENT_TITLE_WIN_LINES.cool.emotional[1]`: …っ…チャンピオン。…嬉しい。…泣きそうだ

### polite.normal[]

- `EVENT_TITLE_WIN_LINES.polite.normal[1]`: やりました…！チャンピオンになれました…！夢のようです
- `EVENT_TITLE_WIN_LINES.polite.normal[2]`: このベルト、絶対に手放しません。応援ありがとうございます

### polite.bold[]

- `EVENT_TITLE_WIN_LINES.polite.bold[1]`: 頂点に立ちました。でもまだ足りません…もっと上へ
- `EVENT_TITLE_WIN_LINES.polite.bold[2]`: この炎は消えません。このベルトで、もっと熱い闘いを

### polite.quiet[]

- `EVENT_TITLE_WIN_LINES.polite.quiet[1]`: …ありがとうございます…（涙をこらえている）

### polite.shy[]

- `EVENT_TITLE_WIN_LINES.polite.shy[1]`: え…わ、わたしが…チャンピオン、ですか…？ 夢のようです…

### polite.easygoing[]

- `EVENT_TITLE_WIN_LINES.polite.easygoing[1]`: 新チャンピオン誕生です。これからもっと盛り上げます
- `EVENT_TITLE_WIN_LINES.polite.easygoing[2]`: ベルト獲っちゃいました。最高です

### polite.earnest[]

- `EVENT_TITLE_WIN_LINES.polite.earnest[1]`: 積み重ねが報われました…本当に、ありがとうございます

### polite.emotional[]

- `EVENT_TITLE_WIN_LINES.polite.emotional[1]`: ああ…！チャンピオンです…！嬉しい…涙が…！

### standard.normal[]

- `EVENT_TITLE_WIN_LINES.standard.normal[1]`: やった…！チャンピオンになれた…！夢みたい！
- `EVENT_TITLE_WIN_LINES.standard.normal[2]`: このベルト、絶対に手放しません！
- `EVENT_TITLE_WIN_LINES.standard.normal[3]`: 最高の気分です！応援ありがとうございます！

### standard.bold[]

- `EVENT_TITLE_WIN_LINES.standard.bold[1]`: てっぺんに立った。でもまだ足りない…もっと上へ
- `EVENT_TITLE_WIN_LINES.standard.bold[2]`: この炎は消えない。ベルトを懸けて、もっと熱い闘いを！

### standard.quiet[]

- `EVENT_TITLE_WIN_LINES.standard.quiet[1]`: ………（ベルトを抱きしめている）

### standard.shy[]

- `EVENT_TITLE_WIN_LINES.standard.shy[1]`: え…わ、私が…チャンピオン…？ 夢みたい…

### standard.easygoing[]

- `EVENT_TITLE_WIN_LINES.standard.easygoing[1]`: 新チャンピオン誕生！みんな、これからもっと盛り上がるよ！
- `EVENT_TITLE_WIN_LINES.standard.easygoing[2]`: ベルト獲っちゃった！最高！

### standard.earnest[]

- `EVENT_TITLE_WIN_LINES.standard.earnest[1]`: コツコツ積み重ねてきて…よかった。本当に、よかった…！
- `EVENT_TITLE_WIN_LINES.standard.earnest[2]`: 諦めなくてよかった…このベルト、努力の結晶です

### standard.emotional[]

- `EVENT_TITLE_WIN_LINES.standard.emotional[1]`: うわああ…！チャンピオン…！嬉しい…泣いちゃう…！

### ojousama.normal[]

- `EVENT_TITLE_WIN_LINES.ojousama.normal[1]`: ……ベルトが、こんなに重いなんて。……確かに、この手で掴んだのね

### ojousama.bold[]

- `EVENT_TITLE_WIN_LINES.ojousama.bold[1]`: 頂点に立ちましたわ。でもここからが本当の闘いですの

### ojousama.quiet[]

- `EVENT_TITLE_WIN_LINES.ojousama.quiet[1]`: ………（ベルトを胸に抱いて、目を閉じている）

### ojousama.shy[]

- `EVENT_TITLE_WIN_LINES.ojousama.shy[1]`: え…わ、わたくしが…チャンピオン…？ 夢のようですわ…

### ojousama.easygoing[]

- `EVENT_TITLE_WIN_LINES.ojousama.easygoing[1]`: 新チャンピオン誕生ですわ。ここからもっと盛り上げますの
- `EVENT_TITLE_WIN_LINES.ojousama.easygoing[2]`: ベルト、獲ってしまいましたわ。最高の気分ですの

### ojousama.earnest[]

- `EVENT_TITLE_WIN_LINES.ojousama.earnest[1]`: 努力が報われましたわ…！このベルト、大切にしますの

### ojousama.emotional[]

- `EVENT_TITLE_WIN_LINES.ojousama.emotional[1]`: ああ…！チャンピオン…！嬉しい…涙が出ますわ…！

### delinquent.normal[]

- `EVENT_TITLE_WIN_LINES.delinquent.normal[1]`: やったぜ！チャンピオンだ！最高！

### delinquent.bold[]

- `EVENT_TITLE_WIN_LINES.delinquent.bold[1]`: やっと獲ったぜ！次は誰が来ても負けねえ！

### delinquent.quiet[]

- `EVENT_TITLE_WIN_LINES.delinquent.quiet[1]`: ………（ベルトを握りしめたまま、動かない）

### delinquent.shy[]

- `EVENT_TITLE_WIN_LINES.delinquent.shy[1]`: え…あ、あたしが…チャンピオン…？ 嘘みたいだ…

### delinquent.easygoing[]

- `EVENT_TITLE_WIN_LINES.delinquent.easygoing[1]`: チャンピオンだぜー！最高だろ！

### delinquent.earnest[]

- `EVENT_TITLE_WIN_LINES.delinquent.earnest[1]`: コツコツ積み重ねてきて…よかった。ほんとに、よかった…！
- `EVENT_TITLE_WIN_LINES.delinquent.earnest[2]`: 諦めなくてよかった…このベルトは、努力の塊だ

### delinquent.emotional[]

- `EVENT_TITLE_WIN_LINES.delinquent.emotional[1]`: うわあ…！チャンピオンだ…！嬉しい…泣きそうだ…！

### seductive.normal[]

- `EVENT_TITLE_WIN_LINES.seductive.normal[1]`: チャンピオン…最高の気分ね

### seductive.bold[]

- `EVENT_TITLE_WIN_LINES.seductive.bold[1]`: これが始まりよ。このベルトで時代を作る

### seductive.quiet[]

- `EVENT_TITLE_WIN_LINES.seductive.quiet[1]`: ………（ベルトに頬を寄せている）

### seductive.shy[]

- `EVENT_TITLE_WIN_LINES.seductive.shy[1]`: え…私が…チャンピオン…？ 夢みたい…

### seductive.easygoing[]

- `EVENT_TITLE_WIN_LINES.seductive.easygoing[1]`: ベルトが似合うのは私だけでしょ？ ふふ

### seductive.earnest[]

- `EVENT_TITLE_WIN_LINES.seductive.earnest[1]`: 積み重ねてきて…よかった。このベルト、大切にするわ

### seductive.emotional[]

- `EVENT_TITLE_WIN_LINES.seductive.emotional[1]`: ああ…っ…チャンピオン…。嬉しい…だめ、泣いちゃう…

### composed.normal[]

- `EVENT_TITLE_WIN_LINES.composed.normal[1]`: …チャンピオンか。…悪くないね

### composed.bold[]

- `EVENT_TITLE_WIN_LINES.composed.bold[1]`: …頂点。…でもまだ先がある

### composed.quiet[]

- `EVENT_TITLE_WIN_LINES.composed.quiet[1]`: ……（静かにベルトを見つめている）

### composed.shy[]

- `EVENT_TITLE_WIN_LINES.composed.shy[1]`: …私が、チャンピオンか。…まだ、実感がないな

### composed.easygoing[]

- `EVENT_TITLE_WIN_LINES.composed.easygoing[1]`: …チャンピオンだ。…いい気分だね

### composed.earnest[]

- `EVENT_TITLE_WIN_LINES.composed.earnest[1]`: …積み重ねてきたものが、ここに。…大切にする

### composed.emotional[]

- `EVENT_TITLE_WIN_LINES.composed.emotional[1]`: …っ…チャンピオン。…嬉しい

## `EVENT_TITLE_DEFENSE_LINES`

- 出典: `src/data.js`
- 本数: 61

- `EVENT_TITLE_DEFENSE_LINES.cool.normal[1]`: …防衛。…だが、まだ足りない
- `EVENT_TITLE_DEFENSE_LINES.cool.normal[2]`: …守るたびに、このベルトの重さがわかる
- `EVENT_TITLE_DEFENSE_LINES.cool.bold[1]`: …格が違う。それだけのことだ
- `EVENT_TITLE_DEFENSE_LINES.cool.quiet[1]`: …次も勝つ。それだけだ
- `EVENT_TITLE_DEFENSE_LINES.cool.shy[1]`: …守れた。…よかった
- `EVENT_TITLE_DEFENSE_LINES.cool.easygoing[1]`: …チャンピオンは私だ。また守り切った
- `EVENT_TITLE_DEFENSE_LINES.cool.easygoing[2]`: …いい試合だった。また挑んでくればいい
- `EVENT_TITLE_DEFENSE_LINES.cool.earnest[1]`: …防衛できた。だが満足はしない。もっと強くなる
- `EVENT_TITLE_DEFENSE_LINES.cool.earnest[2]`: …日々の積み重ねが、結果になった
- `EVENT_TITLE_DEFENSE_LINES.cool.emotional[1]`: …っ…守れた。…次も守る
- `EVENT_TITLE_DEFENSE_LINES.polite.normal[1]`: 防衛できました…ほっとしています。でも、もっと強くならないと
- `EVENT_TITLE_DEFENSE_LINES.polite.normal[2]`: このベルトの重さ、守るたびに感じます
- `EVENT_TITLE_DEFENSE_LINES.polite.bold[1]`: まだ誰にもこの座はお譲りできません。もっと来てください
- `EVENT_TITLE_DEFENSE_LINES.polite.bold[2]`: 防衛は通過点です。私が目指すのは、もっと先
- `EVENT_TITLE_DEFENSE_LINES.polite.quiet[1]`: …守れました。次も、頑張ります
- `EVENT_TITLE_DEFENSE_LINES.polite.shy[1]`: よ、よかった…守れました…（ほっとしている）
- `EVENT_TITLE_DEFENSE_LINES.polite.easygoing[1]`: チャンピオンは私です。また守り切りました
- `EVENT_TITLE_DEFENSE_LINES.polite.easygoing[2]`: いい試合でした。また挑戦してきてくださいね
- `EVENT_TITLE_DEFENSE_LINES.polite.earnest[1]`: 防衛できました。でも、まだまだ精進いたします
- `EVENT_TITLE_DEFENSE_LINES.polite.emotional[1]`: 守れました…！嬉しい…！次も絶対に守ります…！
- `EVENT_TITLE_DEFENSE_LINES.standard.normal[1]`: 防衛成功…！ほっとした…。でも、もっと強くならないと。
- `EVENT_TITLE_DEFENSE_LINES.standard.normal[2]`: このベルトの重さ、守るたびに感じます。
- `EVENT_TITLE_DEFENSE_LINES.standard.bold[1]`: まだ誰にもこの座は譲れない。もっと来い！
- `EVENT_TITLE_DEFENSE_LINES.standard.bold[2]`: 防衛は通過点。私が目指すのはもっと先だ
- `EVENT_TITLE_DEFENSE_LINES.standard.quiet[1]`: ………（静かにベルトを見つめている）
- `EVENT_TITLE_DEFENSE_LINES.standard.shy[1]`: よ、よかった…守れた…（ほっとしている）
- `EVENT_TITLE_DEFENSE_LINES.standard.easygoing[1]`: チャンピオンは私！また守り切っちゃいました！
- `EVENT_TITLE_DEFENSE_LINES.standard.easygoing[2]`: いい試合だった！また挑戦してきてね！
- `EVENT_TITLE_DEFENSE_LINES.standard.earnest[1]`: 防衛できた…！でも満足しない。もっと強くなります
- `EVENT_TITLE_DEFENSE_LINES.standard.earnest[2]`: 日々の積み重ねが結果に出てくれた
- `EVENT_TITLE_DEFENSE_LINES.standard.emotional[1]`: 守れた…！嬉しい…！次も絶対守る…！
- `EVENT_TITLE_DEFENSE_LINES.ojousama.normal[1]`: 防衛いたしましたわ。この座、まだまだ譲りませんの
- `EVENT_TITLE_DEFENSE_LINES.ojousama.bold[1]`: まだ誰にもお譲りしませんわ。もっと上を目指しますの
- `EVENT_TITLE_DEFENSE_LINES.ojousama.quiet[1]`: ………（ベルトの汚れを、指先でそっと拭っている）
- `EVENT_TITLE_DEFENSE_LINES.ojousama.shy[1]`: よ、よかった…守れましたわ…（胸に手をあてて）
- `EVENT_TITLE_DEFENSE_LINES.ojousama.easygoing[1]`: チャンピオンはわたくしですの。また守り切りましたわ
- `EVENT_TITLE_DEFENSE_LINES.ojousama.easygoing[2]`: よい試合でしたわ。またいつでも挑んでらして
- `EVENT_TITLE_DEFENSE_LINES.ojousama.earnest[1]`: 防衛できましたわ。でもまだ満足はしませんの
- `EVENT_TITLE_DEFENSE_LINES.ojousama.emotional[1]`: 守れましたわ…！嬉しい…！次も絶対に守りますの…！
- `EVENT_TITLE_DEFENSE_LINES.delinquent.normal[1]`: 防衛だ！まだまだ渡さねーぞ！
- `EVENT_TITLE_DEFENSE_LINES.delinquent.bold[1]`: まだまだ負けるわけねーだろ！かかってこい！
- `EVENT_TITLE_DEFENSE_LINES.delinquent.quiet[1]`: ………（ベルトを肩に掛けたまま、黙っている）
- `EVENT_TITLE_DEFENSE_LINES.delinquent.shy[1]`: よ、よかった…守れた…（大きく息を吐いて）
- `EVENT_TITLE_DEFENSE_LINES.delinquent.easygoing[1]`: まだまだ渡さねーよ！最高！
- `EVENT_TITLE_DEFENSE_LINES.delinquent.earnest[1]`: 防衛できた…！でも満足はしねえ。もっと強くなる
- `EVENT_TITLE_DEFENSE_LINES.delinquent.earnest[2]`: 日々の積み重ねが、ちゃんと結果になった
- `EVENT_TITLE_DEFENSE_LINES.delinquent.emotional[1]`: 守れた…！嬉しい…！次も絶対守ってやる…！
- `EVENT_TITLE_DEFENSE_LINES.seductive.normal[1]`: 防衛成功…。このベルト、まだ返す気はないわ
- `EVENT_TITLE_DEFENSE_LINES.seductive.bold[1]`: まだ誰も私を超えられないわね。当然でしょう
- `EVENT_TITLE_DEFENSE_LINES.seductive.quiet[1]`: ………（ベルトを撫でながら、目を細めている）
- `EVENT_TITLE_DEFENSE_LINES.seductive.shy[1]`: よ、よかった…守れた…（力が抜けたように）
- `EVENT_TITLE_DEFENSE_LINES.seductive.easygoing[1]`: 防衛って地味に見える？ ふふ、そんなことないでしょ？
- `EVENT_TITLE_DEFENSE_LINES.seductive.earnest[1]`: 防衛できたわ…でも満足しない。もっと強くなる
- `EVENT_TITLE_DEFENSE_LINES.seductive.emotional[1]`: 守れた…っ…嬉しい…。次も、絶対に守るから…
- `EVENT_TITLE_DEFENSE_LINES.composed.normal[1]`: …防衛か。…まだ渡すつもりはないよ
- `EVENT_TITLE_DEFENSE_LINES.composed.bold[1]`: …まだ渡さない。…当然だね
- `EVENT_TITLE_DEFENSE_LINES.composed.quiet[1]`: ……守った。…それだけ
- `EVENT_TITLE_DEFENSE_LINES.composed.shy[1]`: …守れた。…ほっとしたよ
- `EVENT_TITLE_DEFENSE_LINES.composed.easygoing[1]`: …防衛。…まあ、こんなもんかな
- `EVENT_TITLE_DEFENSE_LINES.composed.earnest[1]`: …防衛できた。…でもまだ満足はしない
- `EVENT_TITLE_DEFENSE_LINES.composed.emotional[1]`: …っ…守れた。…よかった

## `EVENT_TITLE_CHALLENGE_LOSS_LINES`

- 出典: `src/data.js`
- 本数: 61

- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.normal[1]`: …悔しい。だが、糧にはなった。次だ
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.normal[2]`: …実力が足りなかった。強くなって戻る
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.bold[1]`: …次はない。次で、終わらせる
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.quiet[1]`: …次で終わらせる
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.shy[1]`: …すまない。…でも、諦めない
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.easygoing[1]`: …今日は負けた。次はもっといい試合をする
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.easygoing[2]`: …俯いていたら、応援してくれた人に失礼だ
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.earnest[1]`: …足りなかった。練習し直して、また挑む
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.earnest[2]`: …悔しい。だが、ここで腐るわけにはいかない
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.cool.emotional[1]`: …っ…悔しい。…諦めはしない
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.normal[1]`: 悔しいです…。でも、いい経験になりました。次こそは
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.normal[2]`: まだ実力が足りませんでした…もっと強くなって帰ってきます
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.bold[1]`: こんな結果、認められません…！もう一度やらせてください
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.bold[2]`: …今日は認めます。でも、この借りは必ずお返しします
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.quiet[1]`: …悔しいです。でも、もう一度挑戦します
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.shy[1]`: …申し訳ありません…でも…諦めたくないんです…
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.easygoing[1]`: 今日は負けちゃいましたけど…次はもっといい試合をします
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.easygoing[2]`: 悔しいですけど、下を向いてたら応援してくれる人に失礼ですもんね
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.earnest[1]`: 実力が足りませんでした。もっと精進いたします
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.polite.emotional[1]`: 悔しい…！悔しいです…！でも…絶対に諦めません…！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.normal[1]`: 悔しい…。でも、いい経験になりました。次こそは…！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.normal[2]`: まだ実力が足りなかった…。もっと強くなって帰ってきます。
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.bold[1]`: くっ…！こんなの認めない！もう一回やらせてくれ！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.bold[2]`: …今日は認める。でもこの借りは必ず返す
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.quiet[1]`: ………（唇を噛んでいる）
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.shy[1]`: …ごめんなさい…でも…諦めたくない…です…
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.easygoing[1]`: 今日は負けちゃったけど…次はもっといい試合するから！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.easygoing[2]`: 悔しいけど、下向いてたら応援してくれる人に失礼だもんね
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.earnest[1]`: …足りなかった。もっと練習して、必ずもう一度挑戦します
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.earnest[2]`: 悔しい…でもここで腐っちゃだめだ
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.standard.emotional[1]`: 悔しい…！悔しい…！でも…絶対諦めない…！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.ojousama.normal[1]`: 悔しゅうございますわ…でも、次こそは…
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.ojousama.bold[1]`: ……これで終わりかしら。もう一度、場を用意していただける？
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.ojousama.quiet[1]`: ………（拳を握ったまま、顔を上げない）
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.ojousama.shy[1]`: …ごめんなさい…でも…諦めたくありませんの…
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.ojousama.easygoing[1]`: 今日は負けてしまいましたけれど…次はもっとよい試合をしますわ
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.ojousama.easygoing[2]`: 悔しいですけれど、俯いていては応援してくださる方に失礼ですもの
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.ojousama.earnest[1]`: 実力が足りませんでしたわ…もっと精進いたしますの
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.ojousama.emotional[1]`: 悔しい…！悔しいですわ…！でも…絶対に諦めませんの…！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.delinquent.normal[1]`: くそっ…次は絶対勝つ…！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.delinquent.bold[1]`: こんなの認めねえ！もう一回だ！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.delinquent.quiet[1]`: ………（マットを一度だけ、拳で叩いた）
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.delinquent.shy[1]`: …ごめん…でも…諦めたくねえんだ…
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.delinquent.easygoing[1]`: くそー！悔しい！でも次やってやるからな！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.delinquent.earnest[1]`: …足りなかった。もっと練習して、必ずもう一度挑む
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.delinquent.earnest[2]`: 悔しい…けど、ここで腐ったら終わりだ
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.delinquent.emotional[1]`: 悔しい…！悔しいんだよ…！でも…絶対諦めねえ…！
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.seductive.normal[1]`: 悔しいわ…でも、次こそはね
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.seductive.bold[1]`: …今日は認めるわ。でもこの借り、必ず返す
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.seductive.quiet[1]`: ………（乱れた髪をかき上げて、笑おうとして失敗する）
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.seductive.shy[1]`: …ごめんなさい…でも…諦めたくないの…
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.seductive.easygoing[1]`: 今日は負けちゃったわね。次はもっと輝くから見ていて
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.seductive.earnest[1]`: 足りなかったわ…でも、もう一度挑戦する
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.seductive.emotional[1]`: 悔しい…っ…悔しい…。でも…絶対に、諦めない…
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.composed.normal[1]`: …届かなかったか。…次だね
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.composed.bold[1]`: …認める。…でもこの借りは返す
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.composed.quiet[1]`: ……足りなかった
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.composed.shy[1]`: …ごめんね。…でも、諦めるつもりはないよ
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.composed.easygoing[1]`: …負けちゃったか。…まあ次があるよ
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.composed.earnest[1]`: …足りなかった。…もっと積み重ねるよ
- `EVENT_TITLE_CHALLENGE_LOSS_LINES.composed.emotional[1]`: …っ…悔しい。…でも、諦めない

## `EVENT_TITLE_LOSS_LINES`

- 出典: `src/data.js`
- 本数: 61

- `EVENT_TITLE_LOSS_LINES.cool.normal[1]`: …失った。だが、ここで戦い続ける
- `EVENT_TITLE_LOSS_LINES.cool.normal[2]`: …悔しい。チャンピオンとして、もっとやれたはずだ
- `EVENT_TITLE_LOSS_LINES.cool.bold[1]`: ……次は、容赦しない
- `EVENT_TITLE_LOSS_LINES.cool.quiet[1]`: …認めよう。だが、終わりではない
- `EVENT_TITLE_LOSS_LINES.cool.shy[1]`: …すまない。…守れなかった
- `EVENT_TITLE_LOSS_LINES.cool.easygoing[1]`: …負けた。だが、応援してくれる人がいる限り立ち上がる
- `EVENT_TITLE_LOSS_LINES.cool.easygoing[2]`: …ベルトのない自分は想像できなかった。でも、私は私だ
- `EVENT_TITLE_LOSS_LINES.cool.earnest[1]`: …努力が足りなかった。一からやり直す
- `EVENT_TITLE_LOSS_LINES.cool.earnest[2]`: …ベルトは手放した。だが、ここで終わりではない
- `EVENT_TITLE_LOSS_LINES.cool.emotional[1]`: …っ…ベルトが。…でも、諦めない
- `EVENT_TITLE_LOSS_LINES.polite.normal[1]`: ベルトを失ってしまいました…。でも、この団体で戦い続けます
- `EVENT_TITLE_LOSS_LINES.polite.normal[2]`: …悔しいです。チャンピオンとして、もっとやれたはずなのに
- `EVENT_TITLE_LOSS_LINES.polite.bold[1]`: 嘘です…！私のベルトが…！絶対に取り返します
- `EVENT_TITLE_LOSS_LINES.polite.bold[2]`: ベルトを失いました…でも、この悔しさが次の炎になります
- `EVENT_TITLE_LOSS_LINES.polite.quiet[1]`: …申し訳ございません。でも…もう一度…
- `EVENT_TITLE_LOSS_LINES.polite.shy[1]`: …申し訳ありません…ベルト…守れませんでした…
- `EVENT_TITLE_LOSS_LINES.polite.easygoing[1]`: 負けちゃいました…でもファンが応援してくれる限り、立ち上がります
- `EVENT_TITLE_LOSS_LINES.polite.easygoing[2]`: …ベルトのない自分なんて想像できませんでした。でも、私は私ですから
- `EVENT_TITLE_LOSS_LINES.polite.earnest[1]`: 努力が足りませんでした。一から出直します
- `EVENT_TITLE_LOSS_LINES.polite.emotional[1]`: 嘘…嘘です…ベルトが…！でも…でも諦めません…！
- `EVENT_TITLE_LOSS_LINES.standard.normal[1]`: ベルトを失ってしまった…。でも、この団体で戦い続けます。
- `EVENT_TITLE_LOSS_LINES.standard.normal[2]`: …悔しい。チャンピオンとしてもっとやれたはずなのに。
- `EVENT_TITLE_LOSS_LINES.standard.bold[1]`: 嘘だろ…！私のベルトが…！絶対に取り返す！
- `EVENT_TITLE_LOSS_LINES.standard.bold[2]`: ベルトを失った…でもこの悔しさが次の炎になる
- `EVENT_TITLE_LOSS_LINES.standard.quiet[1]`: ……今は…一人にしてください
- `EVENT_TITLE_LOSS_LINES.standard.shy[1]`: …ごめんなさい…ベルト…守れなかった…
- `EVENT_TITLE_LOSS_LINES.standard.easygoing[1]`: 負けちゃった…でもファンが応援してくれる限り、立ち上がるよ
- `EVENT_TITLE_LOSS_LINES.standard.easygoing[2]`: …ベルトがない自分なんて想像できなかった。でも、私は私だから
- `EVENT_TITLE_LOSS_LINES.standard.earnest[1]`: …努力が足りなかったんだ。もう一度、一からやり直します
- `EVENT_TITLE_LOSS_LINES.standard.earnest[2]`: ベルトを手放してしまった…でもここで終わりじゃない
- `EVENT_TITLE_LOSS_LINES.standard.emotional[1]`: 嘘…嘘だよ…ベルトが…！でも…でも諦めない…！
- `EVENT_TITLE_LOSS_LINES.ojousama.normal[1]`: ベルトを失いましたわ…でも、ここで終わりではありませんの
- `EVENT_TITLE_LOSS_LINES.ojousama.bold[1]`: 認めませんわ…！必ず取り返しますの！
- `EVENT_TITLE_LOSS_LINES.ojousama.quiet[1]`: ……今は…一人にしてくださいまし
- `EVENT_TITLE_LOSS_LINES.ojousama.shy[1]`: …ごめんなさい…ベルト…守れませんでしたわ…
- `EVENT_TITLE_LOSS_LINES.ojousama.easygoing[1]`: 負けてしまいましたわ…でも応援してくださる方がいる限り、立ち上がりますの
- `EVENT_TITLE_LOSS_LINES.ojousama.easygoing[2]`: …ベルトのないわたくしなんて想像もできませんでしたわ。でも、わたくしはわたくしですもの
- `EVENT_TITLE_LOSS_LINES.ojousama.earnest[1]`: 実力が足りませんでしたわ。一から出直しますの
- `EVENT_TITLE_LOSS_LINES.ojousama.emotional[1]`: 嘘…嘘ですわ…ベルトが…！でも…でも諦めませんの…！
- `EVENT_TITLE_LOSS_LINES.delinquent.normal[1]`: くそ…ベルト取られた…でも終わりじゃねえ
- `EVENT_TITLE_LOSS_LINES.delinquent.bold[1]`: こんなの認めねえ！絶対取り返す！
- `EVENT_TITLE_LOSS_LINES.delinquent.quiet[1]`: ……今は…一人にしてくれ
- `EVENT_TITLE_LOSS_LINES.delinquent.shy[1]`: …ごめん…ベルト…守れなかった…
- `EVENT_TITLE_LOSS_LINES.delinquent.easygoing[1]`: くそー！でもまだ終わってねえから！
- `EVENT_TITLE_LOSS_LINES.delinquent.earnest[1]`: …努力が足りなかった。もう一度、一からやり直す
- `EVENT_TITLE_LOSS_LINES.delinquent.earnest[2]`: ベルトは手放した…けど、ここで終わりじゃねえ
- `EVENT_TITLE_LOSS_LINES.delinquent.emotional[1]`: 嘘だ…嘘だろ…ベルトが…！でも…でも諦めねえ…！
- `EVENT_TITLE_LOSS_LINES.seductive.normal[1]`: ベルトがない景色なんて…でも、ここで終わらないわ
- `EVENT_TITLE_LOSS_LINES.seductive.bold[1]`: …覚えておきなさい。すぐに返してもらうわ
- `EVENT_TITLE_LOSS_LINES.seductive.quiet[1]`: ……今は…一人に、して
- `EVENT_TITLE_LOSS_LINES.seductive.shy[1]`: …ごめんなさい…ベルト…守れなかったの…
- `EVENT_TITLE_LOSS_LINES.seductive.easygoing[1]`: 負けちゃったわね…でも私は私。立ち上がるわ
- `EVENT_TITLE_LOSS_LINES.seductive.earnest[1]`: 足りなかった…でも、ここで終わりにはしないわ
- `EVENT_TITLE_LOSS_LINES.seductive.emotional[1]`: 嘘…っ…ベルトが…。でも…でも、諦めない…
- `EVENT_TITLE_LOSS_LINES.composed.normal[1]`: …失ったか。…でも終わりじゃない
- `EVENT_TITLE_LOSS_LINES.composed.bold[1]`: …取り返す。…覚えておいて
- `EVENT_TITLE_LOSS_LINES.composed.quiet[1]`: ……（静かにベルトを見送っている）
- `EVENT_TITLE_LOSS_LINES.composed.shy[1]`: …ごめんね。…守れなかったよ
- `EVENT_TITLE_LOSS_LINES.composed.easygoing[1]`: …ベルトがない景色か。…まあ、立ち上がるよ
- `EVENT_TITLE_LOSS_LINES.composed.earnest[1]`: …足りなかった。…一からやり直そう
- `EVENT_TITLE_LOSS_LINES.composed.emotional[1]`: …っ…ベルトが…。…取り戻す

## `EVENT_RELEASE_LINES`

- 出典: `src/data.js`
- 本数: 76

### standard.normal[]

- `EVENT_RELEASE_LINES.standard.normal[1]`: そう…ですか。ここでの思い出、忘れません
- `EVENT_RELEASE_LINES.standard.normal[2]`: お世話になりました…
- `EVENT_RELEASE_LINES.standard.normal[3]`: 悔しいです…でも、ありがとうございました

### standard.bold[]

- `EVENT_RELEASE_LINES.standard.bold[1]`: わかった。どこかで強くなって戻る
- `EVENT_RELEASE_LINES.standard.bold[2]`: 悔しいけど…次の場所で証明してみせる
- `EVENT_RELEASE_LINES.standard.bold[3]`: ここで終わるつもりはない。絶対に這い上がる

### standard.quiet[]

- `EVENT_RELEASE_LINES.standard.quiet[1]`: ……（深く一礼）
- `EVENT_RELEASE_LINES.standard.quiet[3]`: …お世話になりました

### standard.earnest[]

- `EVENT_RELEASE_LINES.standard.earnest[1]`: 応援してくれた皆様に、顔向けできません…でも、次で頑張ります
- `EVENT_RELEASE_LINES.standard.earnest[2]`: ここでの学び、どこに行っても忘れません
- `EVENT_RELEASE_LINES.standard.earnest[3]`: 結果を残せなくて、すみません。必ず、どこかで

### standard.emotional[]

- `EVENT_RELEASE_LINES.standard.emotional[1]`: うぅっ…ここでの日々、忘れません…！
- `EVENT_RELEASE_LINES.standard.emotional[2]`: くぅ…ありがとうございました…！ 絶対忘れません…！
- `EVENT_RELEASE_LINES.standard.emotional[3]`: 悔しい…でも、ありがとう…！ 絶対に戻ってくる…！

### standard.easygoing[]

- `EVENT_RELEASE_LINES.standard.easygoing[1]`: まぁ、こういう時もあるよね。みんな、元気でね！
- `EVENT_RELEASE_LINES.standard.easygoing[2]`: えへへ、ここでの日々は楽しかったよ。ありがとう
- `EVENT_RELEASE_LINES.standard.easygoing[3]`: 縁がなかったってことだね。まぁ、お元気で〜

### standard.shy[]

- `EVENT_RELEASE_LINES.standard.shy[1]`: ご、ごめんなさい…役に立てなくて…
- `EVENT_RELEASE_LINES.standard.shy[2]`: す、すみません…ありがとうございました…
- `EVENT_RELEASE_LINES.standard.shy[3]`: …お、お世話になりました…

### ojousama.normal[]

- `EVENT_RELEASE_LINES.ojousama.normal[1]`: お世話になりましたわ。感謝しておりますの
- `EVENT_RELEASE_LINES.ojousama.normal[2]`: この団体での日々、忘れませんわ

### ojousama.bold[]

- `EVENT_RELEASE_LINES.ojousama.bold[1]`: 悔しいですが…次の場所で必ず証明いたしますわ
- `EVENT_RELEASE_LINES.ojousama.bold[2]`: これで終わりではありませんわよ

### ojousama.quiet[]

- `EVENT_RELEASE_LINES.ojousama.quiet[1]`: …お世話になりましたわ

### ojousama.earnest[]

- `EVENT_RELEASE_LINES.ojousama.earnest[1]`: 応援くださった皆様に、申し訳ありませんわ…必ず次で

### ojousama.emotional[]

- `EVENT_RELEASE_LINES.ojousama.emotional[1]`: うぅっ…お世話になりましたわ…！ 忘れませんの…！

### ojousama.easygoing[]

- `EVENT_RELEASE_LINES.ojousama.easygoing[1]`: ふふ、こういうこともありますわね。ごきげんよう

### ojousama.shy[]

- `EVENT_RELEASE_LINES.ojousama.shy[1]`: ご、ごめんなさいませ…役に立てず…

### polite.normal[]

- `EVENT_RELEASE_LINES.polite.normal[1]`: お世話になりました。本当にありがとうございました
- `EVENT_RELEASE_LINES.polite.normal[2]`: 短い間でしたが、ありがとうございました

### polite.bold[]

- `EVENT_RELEASE_LINES.polite.bold[1]`: 悔しいです…次の場所で、必ず証明してみせます
- `EVENT_RELEASE_LINES.polite.bold[2]`: このままでは終わりません。どこかで必ず

### polite.quiet[]

- `EVENT_RELEASE_LINES.polite.quiet[1]`: …お世話になりました

### polite.earnest[]

- `EVENT_RELEASE_LINES.polite.earnest[1]`: 応援してくださった皆様に、申し訳ありません
- `EVENT_RELEASE_LINES.polite.earnest[2]`: ここでの学び、決して忘れません

### polite.emotional[]

- `EVENT_RELEASE_LINES.polite.emotional[1]`: うぅ…っ、ありがとうございました…！ 忘れません…！

### polite.easygoing[]

- `EVENT_RELEASE_LINES.polite.easygoing[1]`: あはは、ご縁がなかったですね〜 ありがとうございました

### polite.shy[]

- `EVENT_RELEASE_LINES.polite.shy[1]`: ご、ごめんなさい…お、お世話になりました…

### delinquent.normal[]

- `EVENT_RELEASE_LINES.delinquent.normal[1]`: そうか…まぁ、縁がなかったってことだろ
- `EVENT_RELEASE_LINES.delinquent.normal[2]`: 世話になったな。どっかで見てろよ

### delinquent.bold[]

- `EVENT_RELEASE_LINES.delinquent.bold[1]`: ちくしょう…見とけよ、絶対に戻ってくるからな
- `EVENT_RELEASE_LINES.delinquent.bold[2]`: 悔しいぜ…次の場所でぶっちぎってやる

### delinquent.quiet[]

- `EVENT_RELEASE_LINES.delinquent.quiet[1]`: …ちっ…(背を向けて出ていく)

### delinquent.earnest[]

- `EVENT_RELEASE_LINES.delinquent.earnest[1]`: 応援してくれた奴らに申し訳ねえ…でも、次で絶対にやってやる

### delinquent.emotional[]

- `EVENT_RELEASE_LINES.delinquent.emotional[1]`: ちくしょう…！ うっ…ありがとな…！

### delinquent.easygoing[]

- `EVENT_RELEASE_LINES.delinquent.easygoing[1]`: まぁ、こんなもんか。元気でやれよ〜

### delinquent.shy[]

- `EVENT_RELEASE_LINES.delinquent.shy[1]`: …ご、ごめん…世話になった…

### cool.normal[]

- `EVENT_RELEASE_LINES.cool.normal[1]`: ……そうか。お世話になった
- `EVENT_RELEASE_LINES.cool.normal[2]`: ……ここでの経験は、忘れない

### cool.bold[]

- `EVENT_RELEASE_LINES.cool.bold[1]`: ……戻ってくる。必ずだ
- `EVENT_RELEASE_LINES.cool.bold[2]`: ……次の場所で、見返してやる

### cool.quiet[]

- `EVENT_RELEASE_LINES.cool.quiet[1]`: ……（静かに立ち去る）
- `EVENT_RELEASE_LINES.cool.quiet[2]`: ……ありがとう

### cool.earnest[]

- `EVENT_RELEASE_LINES.cool.earnest[1]`: ……応援してくれた者たちに、申し訳ない

### cool.emotional[]

- `EVENT_RELEASE_LINES.cool.emotional[1]`: ……っ…ありがとう。忘れない

### cool.easygoing[]

- `EVENT_RELEASE_LINES.cool.easygoing[1]`: …まぁ、こんなもんだ。ありがとう

### cool.shy[]

- `EVENT_RELEASE_LINES.cool.shy[1]`: ……ご、ごめん…ありがとう

### seductive.normal[]

- `EVENT_RELEASE_LINES.seductive.normal[1]`: ここでの思い出、大切にするわ
- `EVENT_RELEASE_LINES.seductive.normal[2]`: お世話になりました。また、どこかで

### seductive.bold[]

- `EVENT_RELEASE_LINES.seductive.bold[1]`: 悔しいわ…でも、いつか必ず戻ってくる
- `EVENT_RELEASE_LINES.seductive.bold[2]`: この借り、いつか返しに来るから

### seductive.quiet[]

- `EVENT_RELEASE_LINES.seductive.quiet[1]`: …お世話になりました（ふっと目を伏せて）

### seductive.earnest[]

- `EVENT_RELEASE_LINES.seductive.earnest[1]`: 応援してくれた人たちに、申し訳ないわ…必ず見返す

### seductive.emotional[]

- `EVENT_RELEASE_LINES.seductive.emotional[1]`: …っ…ありがとう…忘れないわ…

### seductive.easygoing[]

- `EVENT_RELEASE_LINES.seductive.easygoing[1]`: ふふ、縁がなかったみたいね。お元気で

### seductive.shy[]

- `EVENT_RELEASE_LINES.seductive.shy[1]`: …ご、ごめんね…お世話になりました…

### composed.normal[]

- `EVENT_RELEASE_LINES.composed.normal[1]`: …そうか。お世話になったね
- `EVENT_RELEASE_LINES.composed.normal[2]`: …短い間だったけど、ありがとう

### composed.bold[]

- `EVENT_RELEASE_LINES.composed.bold[1]`: …悔しいね。でも、必ず戻ってくる
- `EVENT_RELEASE_LINES.composed.bold[2]`: …これで終わりじゃない。次で証明する

### composed.quiet[]

- `EVENT_RELEASE_LINES.composed.quiet[1]`: …ありがとう。世話になった

### composed.earnest[]

- `EVENT_RELEASE_LINES.composed.earnest[1]`: …応援してくれた人たちに、申し訳ない。次で必ず

### composed.emotional[]

- `EVENT_RELEASE_LINES.composed.emotional[1]`: …っ…ありがとう。忘れないよ

### composed.easygoing[]

- `EVENT_RELEASE_LINES.composed.easygoing[1]`: …ま、縁がなかったってことだね。元気で

### composed.shy[]

- `EVENT_RELEASE_LINES.composed.shy[1]`: …す、すみません。お世話になりました

## `EVENT_FA_SIGNING_LINES`

- 出典: `src/data.js`
- 本数: 61

- `EVENT_FA_SIGNING_LINES.cool.normal[1]`: …よろしく。力になる
- `EVENT_FA_SIGNING_LINES.cool.normal[2]`: …新しい環境か。悪くない。やる
- `EVENT_FA_SIGNING_LINES.cool.bold[1]`: …戦わせてくれ。結果は出す
- `EVENT_FA_SIGNING_LINES.cool.quiet[1]`: …やる。見ていてくれ
- `EVENT_FA_SIGNING_LINES.cool.shy[1]`: …よろしく。…頑張る
- `EVENT_FA_SIGNING_LINES.cool.easygoing[1]`: …新天地か。暴れさせてもらう
- `EVENT_FA_SIGNING_LINES.cool.easygoing[2]`: …ここなら好きにやれそうだ。悪くない
- `EVENT_FA_SIGNING_LINES.cool.earnest[1]`: …感謝する。毎日練習して、期待には応える
- `EVENT_FA_SIGNING_LINES.cool.earnest[2]`: …この恩は忘れない。ここで戦い続ける
- `EVENT_FA_SIGNING_LINES.cool.emotional[1]`: …っ…感謝する。…全力でやる
- `EVENT_FA_SIGNING_LINES.polite.normal[1]`: よろしくお願いいたします。お力になれるよう頑張ります
- `EVENT_FA_SIGNING_LINES.polite.normal[2]`: 新しい環境ですね…悪くありません。頑張ります
- `EVENT_FA_SIGNING_LINES.polite.bold[1]`: 頂点を獲るために来ました。おわかりですよね
- `EVENT_FA_SIGNING_LINES.polite.bold[2]`: 新しい闘いの場ですね…！燃えてきました
- `EVENT_FA_SIGNING_LINES.polite.quiet[1]`: …お世話になります。精一杯やらせていただきます
- `EVENT_FA_SIGNING_LINES.polite.shy[1]`: あ、あの…よろしくお願いいたします…精一杯やります…
- `EVENT_FA_SIGNING_LINES.polite.easygoing[1]`: やっほー、新天地です！暴れまくりますよ
- `EVENT_FA_SIGNING_LINES.polite.easygoing[2]`: ここなら好き放題やれそうです。楽しみ
- `EVENT_FA_SIGNING_LINES.polite.earnest[1]`: ありがとうございます。期待にお応えいたします
- `EVENT_FA_SIGNING_LINES.polite.emotional[1]`: ありがとうございます…！嬉しいです…！全力で頑張ります…！
- `EVENT_FA_SIGNING_LINES.standard.normal[1]`: よろしくお願いします。力になれるよう頑張ります
- `EVENT_FA_SIGNING_LINES.standard.normal[2]`: 新しい環境…悪くないですね。頑張ります
- `EVENT_FA_SIGNING_LINES.standard.bold[1]`: てっぺんを獲るために来た。わかってるよな？
- `EVENT_FA_SIGNING_LINES.standard.bold[2]`: 新しい闘いの場…！燃えてきた！
- `EVENT_FA_SIGNING_LINES.standard.quiet[1]`: …よろしくお願いします
- `EVENT_FA_SIGNING_LINES.standard.shy[1]`: あ、あの…よろしくお願いします…頑張ります…
- `EVENT_FA_SIGNING_LINES.standard.easygoing[1]`: やっほー！新天地だ！暴れまくるよ！
- `EVENT_FA_SIGNING_LINES.standard.easygoing[2]`: ここなら好き放題やれそう！楽しみ！
- `EVENT_FA_SIGNING_LINES.standard.earnest[1]`: ありがとうございます…毎日練習して、絶対に期待に応えます！
- `EVENT_FA_SIGNING_LINES.standard.earnest[2]`: この恩は忘れません。ずっとこの団体で戦います
- `EVENT_FA_SIGNING_LINES.standard.emotional[1]`: ありがとうございます…！嬉しい…！全力で頑張ります…！
- `EVENT_FA_SIGNING_LINES.ojousama.normal[1]`: よろしくお願いいたしますわ。お力になりますの
- `EVENT_FA_SIGNING_LINES.ojousama.bold[1]`: 頂点を獲るために参りましたわ。ご期待くださいませ
- `EVENT_FA_SIGNING_LINES.ojousama.quiet[1]`: …お世話になりますわ
- `EVENT_FA_SIGNING_LINES.ojousama.shy[1]`: あ、あの…よろしくお願いいたしますわ…頑張りますの…
- `EVENT_FA_SIGNING_LINES.ojousama.easygoing[1]`: ごきげんよう。新天地ですわ、暴れさせていただきますの
- `EVENT_FA_SIGNING_LINES.ojousama.easygoing[2]`: ここなら好きにやれそうですわね。楽しみですの
- `EVENT_FA_SIGNING_LINES.ojousama.earnest[1]`: ありがとうございますわ。ご期待に応えてみせますの
- `EVENT_FA_SIGNING_LINES.ojousama.emotional[1]`: ありがとうございますわ…！嬉しい…！全力で頑張りますの…！
- `EVENT_FA_SIGNING_LINES.delinquent.normal[1]`: よろしくな。暴れさせてもらうぜ
- `EVENT_FA_SIGNING_LINES.delinquent.bold[1]`: やってやるぜ！暴れまくるからな！
- `EVENT_FA_SIGNING_LINES.delinquent.quiet[1]`: …よろしく、頼む
- `EVENT_FA_SIGNING_LINES.delinquent.shy[1]`: あ、あの…よろしくっす…頑張るんで…
- `EVENT_FA_SIGNING_LINES.delinquent.easygoing[1]`: よっしゃー！新天地だ！暴れるぞ！
- `EVENT_FA_SIGNING_LINES.delinquent.earnest[1]`: ありがとう…毎日練習して、絶対に期待に応える
- `EVENT_FA_SIGNING_LINES.delinquent.earnest[2]`: この恩は忘れねえ。ずっとここで戦うから
- `EVENT_FA_SIGNING_LINES.delinquent.emotional[1]`: ありがとう…！嬉しい…！全力でやる…！
- `EVENT_FA_SIGNING_LINES.seductive.normal[1]`: よろしくね。力になるわ
- `EVENT_FA_SIGNING_LINES.seductive.bold[1]`: てっぺん獲りに来たの。一緒に頂点に立ちましょう
- `EVENT_FA_SIGNING_LINES.seductive.quiet[1]`: …よろしく、ね
- `EVENT_FA_SIGNING_LINES.seductive.shy[1]`: あ、あの…よろしく…頑張るから…
- `EVENT_FA_SIGNING_LINES.seductive.easygoing[1]`: 新しい場所ね。楽しみだわ。よろしく
- `EVENT_FA_SIGNING_LINES.seductive.earnest[1]`: ありがとう。期待に応えるわ
- `EVENT_FA_SIGNING_LINES.seductive.emotional[1]`: ありがとう…っ…嬉しい…。全力で、やるから…
- `EVENT_FA_SIGNING_LINES.composed.normal[1]`: …よろしく。力になるよ
- `EVENT_FA_SIGNING_LINES.composed.bold[1]`: …てっぺんを獲りに来た。よろしく
- `EVENT_FA_SIGNING_LINES.composed.quiet[1]`: ……よろしく
- `EVENT_FA_SIGNING_LINES.composed.shy[1]`: …よろしくね。…頑張るよ
- `EVENT_FA_SIGNING_LINES.composed.easygoing[1]`: …新天地か。…楽しみだね
- `EVENT_FA_SIGNING_LINES.composed.earnest[1]`: …期待に応えるよ。…コツコツやる
- `EVENT_FA_SIGNING_LINES.composed.emotional[1]`: …っ…ありがとう。全力でやる

## `EVENT_FA_SIGNING_GENERIC_LINES`

- 出典: `src/data.js`
- 本数: 3

- `EVENT_FA_SIGNING_GENERIC_LINES[1]`: この団体で新しいスタートです。よろしくお願いします！
- `EVENT_FA_SIGNING_GENERIC_LINES[2]`: 契約ありがとうございます！全力で戦います！
- `EVENT_FA_SIGNING_GENERIC_LINES[3]`: 新しい仲間ができて嬉しいです。頑張ります！

## `EVENT_FA_WELCOME_LINES`

- 出典: `src/data.js`
- 本数: 61

- `EVENT_FA_WELCOME_LINES.cool.normal[1]`: …よろしく。やる
- `EVENT_FA_WELCOME_LINES.cool.normal[2]`: …力になれるよう、精一杯やる
- `EVENT_FA_WELCOME_LINES.cool.bold[1]`: …見ていろ。格の違いを証明する
- `EVENT_FA_WELCOME_LINES.cool.quiet[1]`: …やるべきことをやる
- `EVENT_FA_WELCOME_LINES.cool.shy[1]`: …よろしく。…精一杯やる
- `EVENT_FA_WELCOME_LINES.cool.easygoing[1]`: …今日から仲間だ。よろしく
- `EVENT_FA_WELCOME_LINES.cool.easygoing[2]`: …みんなで楽しくやろう
- `EVENT_FA_WELCOME_LINES.cool.earnest[1]`: …毎日コツコツやる。見ていてくれ
- `EVENT_FA_WELCOME_LINES.cool.earnest[2]`: …この団体のために、全てを捧げる
- `EVENT_FA_WELCOME_LINES.cool.emotional[1]`: …っ…よろしく。…頑張る
- `EVENT_FA_WELCOME_LINES.polite.normal[1]`: よろしくお願いいたします。頑張ります
- `EVENT_FA_WELCOME_LINES.polite.normal[2]`: お力になれるよう、精一杯務めます
- `EVENT_FA_WELCOME_LINES.polite.bold[1]`: 頂点まで一直線です。邪魔はさせません
- `EVENT_FA_WELCOME_LINES.polite.bold[2]`: 燃えてきました…！早く試合がしたいです
- `EVENT_FA_WELCOME_LINES.polite.quiet[1]`: …精一杯、頑張らせていただきます
- `EVENT_FA_WELCOME_LINES.polite.shy[1]`: よ、よろしくお願いいたします…が、頑張ります…！
- `EVENT_FA_WELCOME_LINES.polite.easygoing[1]`: わーい、今日から仲間です！よろしくお願いします
- `EVENT_FA_WELCOME_LINES.polite.easygoing[2]`: みんなで楽しくやりましょう
- `EVENT_FA_WELCOME_LINES.polite.earnest[1]`: 毎日精進いたします。見ていてください
- `EVENT_FA_WELCOME_LINES.polite.emotional[1]`: 嬉しいです…！よろしくお願いします…！頑張ります…！
- `EVENT_FA_WELCOME_LINES.standard.normal[1]`: よろしくお願いします。頑張ります
- `EVENT_FA_WELCOME_LINES.standard.normal[2]`: 力になれるよう、精一杯やります
- `EVENT_FA_WELCOME_LINES.standard.bold[1]`: 頂点まで一直線だ。邪魔はさせない
- `EVENT_FA_WELCOME_LINES.standard.bold[2]`: 燃えてきた…！早く試合がしたい！
- `EVENT_FA_WELCOME_LINES.standard.quiet[1]`: …よろしくお願いします
- `EVENT_FA_WELCOME_LINES.standard.shy[1]`: よ、よろしくお願いします…が、頑張ります…！
- `EVENT_FA_WELCOME_LINES.standard.easygoing[1]`: わーい！今日から仲間だ！よろしく！
- `EVENT_FA_WELCOME_LINES.standard.easygoing[2]`: みんなで楽しくやりましょー！
- `EVENT_FA_WELCOME_LINES.standard.earnest[1]`: 毎日コツコツ、頑張ります！見ていてください！
- `EVENT_FA_WELCOME_LINES.standard.earnest[2]`: この団体のために…全てを捧げます
- `EVENT_FA_WELCOME_LINES.standard.emotional[1]`: 嬉しい…！よろしくお願いします…！頑張ります…！
- `EVENT_FA_WELCOME_LINES.ojousama.normal[1]`: よろしくお願いいたしますわ。精一杯務めますの
- `EVENT_FA_WELCOME_LINES.ojousama.bold[1]`: 頂点を目指しますわ。ご期待くださいませ
- `EVENT_FA_WELCOME_LINES.ojousama.quiet[1]`: …よろしく。お世話になりますわ
- `EVENT_FA_WELCOME_LINES.ojousama.shy[1]`: よ、よろしくお願いいたしますわ…が、頑張りますの…！
- `EVENT_FA_WELCOME_LINES.ojousama.easygoing[1]`: まあ、今日から仲間ですわね。よろしくお願いしますの
- `EVENT_FA_WELCOME_LINES.ojousama.easygoing[2]`: 皆様、楽しくやりましょうね
- `EVENT_FA_WELCOME_LINES.ojousama.earnest[1]`: コツコツ頑張りますわ。見ていてくださいませ
- `EVENT_FA_WELCOME_LINES.ojousama.emotional[1]`: 嬉しい…！よろしくお願いいたしますわ…！頑張りますの…！
- `EVENT_FA_WELCOME_LINES.delinquent.normal[1]`: よろしくな！ガンガンやるぜ
- `EVENT_FA_WELCOME_LINES.delinquent.bold[1]`: 大暴れするぞー！覚悟しとけ！
- `EVENT_FA_WELCOME_LINES.delinquent.quiet[1]`: …よろしく。世話になる
- `EVENT_FA_WELCOME_LINES.delinquent.shy[1]`: よ、よろしくっす…が、頑張るんで…！
- `EVENT_FA_WELCOME_LINES.delinquent.easygoing[1]`: よっしゃー！楽しくやろうぜ！
- `EVENT_FA_WELCOME_LINES.delinquent.earnest[1]`: 毎日コツコツ頑張る！見ててくれ！
- `EVENT_FA_WELCOME_LINES.delinquent.earnest[2]`: この団体のために…全部捧げる
- `EVENT_FA_WELCOME_LINES.delinquent.emotional[1]`: 嬉しい…！よろしく頼む…！頑張るから…！
- `EVENT_FA_WELCOME_LINES.seductive.normal[1]`: よろしくね。精一杯やるわ
- `EVENT_FA_WELCOME_LINES.seductive.bold[1]`: 頂点まで一直線よ。見ていてね
- `EVENT_FA_WELCOME_LINES.seductive.quiet[1]`: …よろしく。仲良くしましょ
- `EVENT_FA_WELCOME_LINES.seductive.shy[1]`: よ、よろしくね…が、頑張るから…
- `EVENT_FA_WELCOME_LINES.seductive.easygoing[1]`: よろしくね。楽しくやりましょう
- `EVENT_FA_WELCOME_LINES.seductive.earnest[1]`: 毎日頑張るわ。見ていてね
- `EVENT_FA_WELCOME_LINES.seductive.emotional[1]`: 嬉しい…っ…よろしくね…。頑張るから…
- `EVENT_FA_WELCOME_LINES.composed.normal[1]`: …よろしく。精一杯やるよ
- `EVENT_FA_WELCOME_LINES.composed.bold[1]`: …頂点まで。…見ていて
- `EVENT_FA_WELCOME_LINES.composed.quiet[1]`: ……やるべきことをやる
- `EVENT_FA_WELCOME_LINES.composed.shy[1]`: …よろしくね。…頑張ってみるよ
- `EVENT_FA_WELCOME_LINES.composed.easygoing[1]`: …よろしくね。楽しくやろう
- `EVENT_FA_WELCOME_LINES.composed.earnest[1]`: …コツコツやる。見ていてくれれば
- `EVENT_FA_WELCOME_LINES.composed.emotional[1]`: …っ…嬉しい。よろしく

## `EVENT_FA_WELCOME_GENERIC_LINES`

- 出典: `src/data.js`
- 本数: 3

- `EVENT_FA_WELCOME_GENERIC_LINES[1]`: よろしくお願いします！頑張ります！
- `EVENT_FA_WELCOME_GENERIC_LINES[2]`: 精一杯やります！応援してください！
- `EVENT_FA_WELCOME_GENERIC_LINES[3]`: 新しい仲間として、全力で頑張ります！

## `EVENT_RENTAL_GREETING_LINES`

- 出典: `src/data.js`
- 本数: 61

- `EVENT_RENTAL_GREETING_LINES.cool.normal[1]`: …レンタルだが、手は抜かない。よろしく
- `EVENT_RENTAL_GREETING_LINES.cool.normal[2]`: …短い間だ。よろしく
- `EVENT_RENTAL_GREETING_LINES.cool.bold[1]`: …手は抜かない。見ていろ
- `EVENT_RENTAL_GREETING_LINES.cool.quiet[1]`: …やるべきことはやる
- `EVENT_RENTAL_GREETING_LINES.cool.shy[1]`: …短い間だが。…よろしく
- `EVENT_RENTAL_GREETING_LINES.cool.easygoing[1]`: …お邪魔する。短い間だが、暴れさせてもらう
- `EVENT_RENTAL_GREETING_LINES.cool.easygoing[2]`: …一時的だからこそ、思い切りやる
- `EVENT_RENTAL_GREETING_LINES.cool.earnest[1]`: …短い期間だが、精一杯やる
- `EVENT_RENTAL_GREETING_LINES.cool.earnest[2]`: …限られた時間でも成長したい。よろしく
- `EVENT_RENTAL_GREETING_LINES.cool.emotional[1]`: …っ…よろしく。短い間だが、全力で
- `EVENT_RENTAL_GREETING_LINES.polite.normal[1]`: レンタルですが、手は抜きません。よろしくお願いいたします
- `EVENT_RENTAL_GREETING_LINES.polite.normal[2]`: 短い間ですが、よろしくお願いいたします
- `EVENT_RENTAL_GREETING_LINES.polite.bold[1]`: レンタルだからと侮らないでください。全試合全力です
- `EVENT_RENTAL_GREETING_LINES.polite.bold[2]`: よその団体でも闘志は変わりません。燃えてきました
- `EVENT_RENTAL_GREETING_LINES.polite.quiet[1]`: …短い間ですが、精一杯務めさせていただきます
- `EVENT_RENTAL_GREETING_LINES.polite.shy[1]`: あ、あの…短い間ではございますが…よろしくお願いいたします…
- `EVENT_RENTAL_GREETING_LINES.polite.easygoing[1]`: おじゃましまーす！短い間ですけど暴れますよ
- `EVENT_RENTAL_GREETING_LINES.polite.easygoing[2]`: 一時的だからこそ、思い切り好き放題やりますね
- `EVENT_RENTAL_GREETING_LINES.polite.earnest[1]`: 短い間ですが、精一杯務めさせていただきます
- `EVENT_RENTAL_GREETING_LINES.polite.emotional[1]`: よろしくお願いします…！短い間ですが…全力で…！
- `EVENT_RENTAL_GREETING_LINES.standard.normal[1]`: レンタルですが、手は抜きませんので。よろしく
- `EVENT_RENTAL_GREETING_LINES.standard.normal[2]`: 短い間ですがよろしくお願いします
- `EVENT_RENTAL_GREETING_LINES.standard.bold[1]`: レンタルだからって舐めるなよ！全試合全力だ！
- `EVENT_RENTAL_GREETING_LINES.standard.bold[2]`: よその団体でも闘志は変わらない！燃えるぞ！
- `EVENT_RENTAL_GREETING_LINES.standard.quiet[1]`: …短い間ですが、よろしくお願いします
- `EVENT_RENTAL_GREETING_LINES.standard.shy[1]`: あ、あの…短い間ですけど…よろしくお願いします…
- `EVENT_RENTAL_GREETING_LINES.standard.easygoing[1]`: おじゃましまーす！短い間だけど暴れるよー！
- `EVENT_RENTAL_GREETING_LINES.standard.easygoing[2]`: 一時的だからこそ思い切り好き放題やるね！
- `EVENT_RENTAL_GREETING_LINES.standard.earnest[1]`: 短い期間ですが、精一杯やらせていただきます！
- `EVENT_RENTAL_GREETING_LINES.standard.earnest[2]`: 限られた時間でも成長したい。よろしくお願いします
- `EVENT_RENTAL_GREETING_LINES.standard.emotional[1]`: よろしくお願いします…！短い間だけど…全力で…！
- `EVENT_RENTAL_GREETING_LINES.ojousama.normal[1]`: 短い間ですが、よろしくお願いいたしますわ
- `EVENT_RENTAL_GREETING_LINES.ojousama.bold[1]`: レンタルでも手は抜きませんわよ！
- `EVENT_RENTAL_GREETING_LINES.ojousama.quiet[1]`: …短い間ですが、よろしくお願いいたしますわ
- `EVENT_RENTAL_GREETING_LINES.ojousama.shy[1]`: あ、あの…短い間ですけれど…よろしくお願いいたしますわ…
- `EVENT_RENTAL_GREETING_LINES.ojousama.easygoing[1]`: お邪魔いたしますわ。短い間ですけれど、暴れさせていただきますの
- `EVENT_RENTAL_GREETING_LINES.ojousama.easygoing[2]`: 一時のご縁ですもの、思い切りやらせていただきますわ
- `EVENT_RENTAL_GREETING_LINES.ojousama.earnest[1]`: 短い間ですが、精一杯お務めいたしますわ
- `EVENT_RENTAL_GREETING_LINES.ojousama.emotional[1]`: よろしくお願いいたしますわ…！短い間ですけれど…全力で…！
- `EVENT_RENTAL_GREETING_LINES.delinquent.normal[1]`: よろしくな。手は抜かねーから
- `EVENT_RENTAL_GREETING_LINES.delinquent.bold[1]`: レンタル？ 関係ねえ！暴れるぞ！
- `EVENT_RENTAL_GREETING_LINES.delinquent.quiet[1]`: …短い間だけど、よろしく頼む
- `EVENT_RENTAL_GREETING_LINES.delinquent.shy[1]`: あ、あの…短い間っすけど…よろしくお願いします…
- `EVENT_RENTAL_GREETING_LINES.delinquent.easygoing[1]`: おじゃまー！暴れさせてもらうぜ！
- `EVENT_RENTAL_GREETING_LINES.delinquent.earnest[1]`: 短い期間だけど、精一杯やらせてもらう！
- `EVENT_RENTAL_GREETING_LINES.delinquent.earnest[2]`: 限られた時間でも成長してえ。よろしく頼む
- `EVENT_RENTAL_GREETING_LINES.delinquent.emotional[1]`: よろしく頼む…！短い間だけど…全力でやる…！
- `EVENT_RENTAL_GREETING_LINES.seductive.normal[1]`: 短い間だけど、よろしくね
- `EVENT_RENTAL_GREETING_LINES.seductive.bold[1]`: レンタルでも全力よ。見ていてね
- `EVENT_RENTAL_GREETING_LINES.seductive.quiet[1]`: …短い間だけど、よろしくね
- `EVENT_RENTAL_GREETING_LINES.seductive.shy[1]`: あ、あの…短い間だけど…よろしく、ね…
- `EVENT_RENTAL_GREETING_LINES.seductive.easygoing[1]`: お邪魔するわね。短い間だけど楽しみましょう
- `EVENT_RENTAL_GREETING_LINES.seductive.earnest[1]`: 短い間だけど、精一杯やるわ
- `EVENT_RENTAL_GREETING_LINES.seductive.emotional[1]`: よろしくね…っ…短い間だけど…全力で、やるから…
- `EVENT_RENTAL_GREETING_LINES.composed.normal[1]`: …短い間だけど、手は抜かないよ
- `EVENT_RENTAL_GREETING_LINES.composed.bold[1]`: …レンタルでも全力。当然だね
- `EVENT_RENTAL_GREETING_LINES.composed.quiet[1]`: ……短い間だけど、よろしく
- `EVENT_RENTAL_GREETING_LINES.composed.shy[1]`: …短い間だけど…よろしくね。頑張るよ
- `EVENT_RENTAL_GREETING_LINES.composed.easygoing[1]`: …おじゃまします。楽しくやろう
- `EVENT_RENTAL_GREETING_LINES.composed.earnest[1]`: …短い間でも精一杯やる。よろしく
- `EVENT_RENTAL_GREETING_LINES.composed.emotional[1]`: …っ…短い間だけど、全力で

## `EVENT_RENTAL_GREETING_GENERIC_LINES`

- 出典: `src/data.js`
- 本数: 3

- `EVENT_RENTAL_GREETING_GENERIC_LINES[1]`: 短い間ですが、よろしくお願いします！
- `EVENT_RENTAL_GREETING_GENERIC_LINES[2]`: お邪魔します。力になれたら嬉しいです！
- `EVENT_RENTAL_GREETING_GENERIC_LINES[3]`: レンタルでも全力です。よろしくお願いします！

## `EVENT_LINES_BY_KEY`

- 出典: `src/data.js`
- コード内コメント: 動的アクセス用ルックアップ（pickQuote/getTraitQuote の引数 category→定数） / コーチ雇用/解雇/PPV称賛は E-8 Phase A/B で pickCoachVoiceQuote() 経由(voiceKey別)に移行済み。 / このマップには含まれない（coach-lines.js の COACH_VOICE_HIRE/FIRE/PRAISE_LINES を参照）。
- 本数: 1065

### draftJoin.standard.normal[]

- `EVENT_LINES_BY_KEY.draftJoin.standard.normal[1]`: よろしくお願いします。精一杯頑張ります
- `EVENT_LINES_BY_KEY.draftJoin.standard.normal[2]`: 選んでくださって、ありがとうございます
- `EVENT_LINES_BY_KEY.draftJoin.standard.normal[3]`: 期待に応えられるよう、頑張ります

### draftJoin.standard.bold[]

- `EVENT_LINES_BY_KEY.draftJoin.standard.bold[1]`: てっぺんを獲りに来ました。ついてきてください
- `EVENT_LINES_BY_KEY.draftJoin.standard.bold[2]`: この団体で、必ずチャンピオンになります
- `EVENT_LINES_BY_KEY.draftJoin.standard.bold[3]`: 期待なんて軽く超えてみせる。見ててください

### draftJoin.standard.quiet[]

- `EVENT_LINES_BY_KEY.draftJoin.standard.quiet[1]`: …よろしくお願いします
- `EVENT_LINES_BY_KEY.draftJoin.standard.quiet[2]`: ………（深々と一礼）
- `EVENT_LINES_BY_KEY.draftJoin.standard.quiet[3]`: ……全力でやります

### draftJoin.standard.earnest[]

- `EVENT_LINES_BY_KEY.draftJoin.standard.earnest[1]`: 選んでくださって、ありがとうございます！ 精一杯頑張ります！
- `EVENT_LINES_BY_KEY.draftJoin.standard.earnest[2]`: 地道にコツコツ…努力で応えます
- `EVENT_LINES_BY_KEY.draftJoin.standard.earnest[3]`: 応援してくれる方々のためにも、頑張ります

### draftJoin.standard.emotional[]

- `EVENT_LINES_BY_KEY.draftJoin.standard.emotional[1]`: うぅっ…この日を、ずっと夢見ていました…！
- `EVENT_LINES_BY_KEY.draftJoin.standard.emotional[2]`: 嬉しいです…！ 頑張ります…！ 絶対に…！
- `EVENT_LINES_BY_KEY.draftJoin.standard.emotional[3]`: ずっと…ずっと待ってました…！ 全力で、頑張ります…！

### draftJoin.standard.easygoing[]

- `EVENT_LINES_BY_KEY.draftJoin.standard.easygoing[1]`: いやー、やっとだね。よろしく〜
- `EVENT_LINES_BY_KEY.draftJoin.standard.easygoing[2]`: えへへ、よろしくお願いしまーす
- `EVENT_LINES_BY_KEY.draftJoin.standard.easygoing[3]`: みんなと楽しくやりたいな。よろしくね

### draftJoin.standard.shy[]

- `EVENT_LINES_BY_KEY.draftJoin.standard.shy[1]`: あ、あの…よ、よろしくお願いします…！
- `EVENT_LINES_BY_KEY.draftJoin.standard.shy[2]`: う、うぅ…が、頑張ります…！
- `EVENT_LINES_BY_KEY.draftJoin.standard.shy[3]`: …っ、よ、よろしくお願いします…

### draftJoin.ojousama.normal[]

- `EVENT_LINES_BY_KEY.draftJoin.ojousama.normal[1]`: よろしくお願いしますわ。精一杯努めますの
- `EVENT_LINES_BY_KEY.draftJoin.ojousama.normal[2]`: お選びいただき、光栄ですわ

### draftJoin.ojousama.bold[]

- `EVENT_LINES_BY_KEY.draftJoin.ojousama.bold[1]`: チャンピオンになるために参りましたわ。ご期待くださいませ
- `EVENT_LINES_BY_KEY.draftJoin.ojousama.bold[2]`: 頂点に立ちますわよ。当然ですの

### draftJoin.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.draftJoin.ojousama.quiet[1]`: …よ、よろしくお願いいたしますわ

### draftJoin.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.draftJoin.ojousama.earnest[1]`: お選びいただき、光栄ですわ。精一杯努めますの
- `EVENT_LINES_BY_KEY.draftJoin.ojousama.earnest[2]`: 期待に応えられるよう、全力を尽くしますわ

### draftJoin.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.draftJoin.ojousama.emotional[1]`: うぅっ…夢のようですわ…！ 精一杯頑張りますの…！

### draftJoin.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.draftJoin.ojousama.easygoing[1]`: ふふ、よろしくお願いしますわぁ
- `EVENT_LINES_BY_KEY.draftJoin.ojousama.easygoing[2]`: お仲間入りですわね。よろしくですの

### draftJoin.ojousama.shy[]

- `EVENT_LINES_BY_KEY.draftJoin.ojousama.shy[1]`: あ、あの…よ、よろしくお願いいたしますわ…

### draftJoin.polite.normal[]

- `EVENT_LINES_BY_KEY.draftJoin.polite.normal[1]`: 本日はよろしくお願いいたします
- `EVENT_LINES_BY_KEY.draftJoin.polite.normal[2]`: お選びいただき、ありがとうございます

### draftJoin.polite.bold[]

- `EVENT_LINES_BY_KEY.draftJoin.polite.bold[1]`: てっぺんを獲るために参りました。全力を尽くします
- `EVENT_LINES_BY_KEY.draftJoin.polite.bold[2]`: チャンピオンに、必ずなります

### draftJoin.polite.quiet[]

- `EVENT_LINES_BY_KEY.draftJoin.polite.quiet[1]`: …よろしくお願いいたします

### draftJoin.polite.earnest[]

- `EVENT_LINES_BY_KEY.draftJoin.polite.earnest[1]`: お選びいただき、ありがとうございます。精一杯頑張ります
- `EVENT_LINES_BY_KEY.draftJoin.polite.earnest[2]`: ご期待に応えられるよう、努力いたします

### draftJoin.polite.emotional[]

- `EVENT_LINES_BY_KEY.draftJoin.polite.emotional[1]`: う、うぅ…っ…ずっと、夢でした…！ 頑張ります…！

### draftJoin.polite.easygoing[]

- `EVENT_LINES_BY_KEY.draftJoin.polite.easygoing[1]`: よろしくお願いしますね〜 楽しみです

### draftJoin.polite.shy[]

- `EVENT_LINES_BY_KEY.draftJoin.polite.shy[1]`: あ、あの…よ、よろしくお願いいたします…

### draftJoin.delinquent.normal[]

- `EVENT_LINES_BY_KEY.draftJoin.delinquent.normal[1]`: よろしくな。暴れさせてもらうぜ
- `EVENT_LINES_BY_KEY.draftJoin.delinquent.normal[2]`: まぁ、期待しててくれよ

### draftJoin.delinquent.bold[]

- `EVENT_LINES_BY_KEY.draftJoin.delinquent.bold[1]`: 暴れまくってやるぜ。覚悟しとけよ
- `EVENT_LINES_BY_KEY.draftJoin.delinquent.bold[2]`: チャンピオン獲ってやるからな、見とけ

### draftJoin.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.draftJoin.delinquent.quiet[1]`: …よろしく

### draftJoin.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.draftJoin.delinquent.earnest[1]`: 選んでくれてありがとな！ コツコツ頑張るからよ

### draftJoin.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.draftJoin.delinquent.emotional[1]`: うおっ…！ やった…！ ずっとこの日を待ってた…！

### draftJoin.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.draftJoin.delinquent.easygoing[1]`: よっ、よろしくな！ 楽しくやろうぜ

### draftJoin.delinquent.shy[]

- `EVENT_LINES_BY_KEY.draftJoin.delinquent.shy[1]`: …よ、よろしく…が、頑張る…

### draftJoin.cool.normal[]

- `EVENT_LINES_BY_KEY.draftJoin.cool.normal[1]`: ……よろしく
- `EVENT_LINES_BY_KEY.draftJoin.cool.normal[2]`: ……全力でやる

### draftJoin.cool.bold[]

- `EVENT_LINES_BY_KEY.draftJoin.cool.bold[1]`: ……てっぺんを獲る。それだけだ
- `EVENT_LINES_BY_KEY.draftJoin.cool.bold[2]`: ……結果で示す

### draftJoin.cool.quiet[]

- `EVENT_LINES_BY_KEY.draftJoin.cool.quiet[1]`: ……よろしく
- `EVENT_LINES_BY_KEY.draftJoin.cool.quiet[2]`: ……始めよう

### draftJoin.cool.earnest[]

- `EVENT_LINES_BY_KEY.draftJoin.cool.earnest[1]`: ……応える。努力で

### draftJoin.cool.emotional[]

- `EVENT_LINES_BY_KEY.draftJoin.cool.emotional[1]`: ……っ…この日を、待っていた

### draftJoin.cool.easygoing[]

- `EVENT_LINES_BY_KEY.draftJoin.cool.easygoing[1]`: …うん、よろしく

### draftJoin.cool.shy[]

- `EVENT_LINES_BY_KEY.draftJoin.cool.shy[1]`: ……よ、よろしく…

### draftJoin.seductive.normal[]

- `EVENT_LINES_BY_KEY.draftJoin.seductive.normal[1]`: よろしくね。期待に応えてあげる
- `EVENT_LINES_BY_KEY.draftJoin.seductive.normal[2]`: ふふ、選んでくれてありがとう

### draftJoin.seductive.bold[]

- `EVENT_LINES_BY_KEY.draftJoin.seductive.bold[1]`: チャンピオン、獲りに来たの。覚悟してて
- `EVENT_LINES_BY_KEY.draftJoin.seductive.bold[2]`: この団体、私が盛り上げてあげる

### draftJoin.seductive.quiet[]

- `EVENT_LINES_BY_KEY.draftJoin.seductive.quiet[1]`: ……よろしく

### draftJoin.seductive.earnest[]

- `EVENT_LINES_BY_KEY.draftJoin.seductive.earnest[1]`: 選んでくれてありがとう。期待に応えるわ

### draftJoin.seductive.emotional[]

- `EVENT_LINES_BY_KEY.draftJoin.seductive.emotional[1]`: …っ…夢みたい。精一杯頑張るわ…

### draftJoin.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.draftJoin.seductive.easygoing[1]`: ふふ、よろしくね。楽しくやりましょ

### draftJoin.seductive.shy[]

- `EVENT_LINES_BY_KEY.draftJoin.seductive.shy[1]`: …あ、あの…よ、よろしくね…

### draftJoin.composed.normal[]

- `EVENT_LINES_BY_KEY.draftJoin.composed.normal[1]`: …よろしく。精一杯やるよ
- `EVENT_LINES_BY_KEY.draftJoin.composed.normal[2]`: …選んでくれてありがとう

### draftJoin.composed.bold[]

- `EVENT_LINES_BY_KEY.draftJoin.composed.bold[1]`: …てっぺんを獲りに来た。よろしく
- `EVENT_LINES_BY_KEY.draftJoin.composed.bold[2]`: …期待には応える。見ていて

### draftJoin.composed.quiet[]

- `EVENT_LINES_BY_KEY.draftJoin.composed.quiet[1]`: …よろしく。精一杯やる

### draftJoin.composed.earnest[]

- `EVENT_LINES_BY_KEY.draftJoin.composed.earnest[1]`: …選んでくれてありがとう。コツコツ頑張るよ

### draftJoin.composed.emotional[]

- `EVENT_LINES_BY_KEY.draftJoin.composed.emotional[1]`: …っ…ずっと、この日を待ってた。頑張るよ

### draftJoin.composed.easygoing[]

- `EVENT_LINES_BY_KEY.draftJoin.composed.easygoing[1]`: …よろしく。楽しくやろうね

### draftJoin.composed.shy[]

- `EVENT_LINES_BY_KEY.draftJoin.composed.shy[1]`: …よ、よろしくお願いします

### draftInterest.cool.normal[]

- `EVENT_LINES_BY_KEY.draftInterest.cool.normal[1]`: …よろしく。精一杯やる
- `EVENT_LINES_BY_KEY.draftInterest.cool.normal[2]`: …選んでくれるなら、全力で応える

### draftInterest.cool.bold[]

- `EVENT_LINES_BY_KEY.draftInterest.cool.bold[1]`: …闘わせてくれ。結果で語る

### draftInterest.cool.quiet[]

- `EVENT_LINES_BY_KEY.draftInterest.cool.quiet[1]`: …戦わせてくれるなら、応える

### draftInterest.cool.shy[]

- `EVENT_LINES_BY_KEY.draftInterest.cool.shy[1]`: …私で良ければ。…頑張る

### draftInterest.cool.easygoing[]

- `EVENT_LINES_BY_KEY.draftInterest.cool.easygoing[1]`: …楽しくやろう。それでいい
- `EVENT_LINES_BY_KEY.draftInterest.cool.easygoing[2]`: …退屈な試合はしない。約束する

### draftInterest.cool.earnest[]

- `EVENT_LINES_BY_KEY.draftInterest.cool.earnest[1]`: …地道に積む。それが私のやり方だ
- `EVENT_LINES_BY_KEY.draftInterest.cool.earnest[2]`: …誰より練習する。見ていてくれ

### draftInterest.cool.emotional[]

- `EVENT_LINES_BY_KEY.draftInterest.cool.emotional[1]`: …選んでくれたら、全力で応える

### draftInterest.polite.normal[]

- `EVENT_LINES_BY_KEY.draftInterest.polite.normal[1]`: よろしくお願いいたします。精一杯務めます
- `EVENT_LINES_BY_KEY.draftInterest.polite.normal[2]`: 選んでいただけましたら、全力で頑張ります

### draftInterest.polite.bold[]

- `EVENT_LINES_BY_KEY.draftInterest.polite.bold[1]`: 頂点を獲ります。それ以外に興味はありません
- `EVENT_LINES_BY_KEY.draftInterest.polite.bold[2]`: 選んでいただけたら、決して後悔はさせません

### draftInterest.polite.quiet[]

- `EVENT_LINES_BY_KEY.draftInterest.polite.quiet[1]`: …選んでいただけたら、精一杯やらせていただきます

### draftInterest.polite.shy[]

- `EVENT_LINES_BY_KEY.draftInterest.polite.shy[1]`: あ、あの…わたしなどでよろしければ…せ、精一杯務めます…

### draftInterest.polite.easygoing[]

- `EVENT_LINES_BY_KEY.draftInterest.polite.easygoing[1]`: えへへ、一緒に楽しくやりましょう
- `EVENT_LINES_BY_KEY.draftInterest.polite.easygoing[2]`: 退屈なプロレスはしないって約束します

### draftInterest.polite.earnest[]

- `EVENT_LINES_BY_KEY.draftInterest.polite.earnest[1]`: 地道に努力するのが取り柄です。信じていただけますか

### draftInterest.polite.emotional[]

- `EVENT_LINES_BY_KEY.draftInterest.polite.emotional[1]`: 選んでいただけましたら…わたし、全力で…全力で頑張ります…！

### draftInterest.standard.normal[]

- `EVENT_LINES_BY_KEY.draftInterest.standard.normal[1]`: よろしくお願いします。精一杯やります
- `EVENT_LINES_BY_KEY.draftInterest.standard.normal[2]`: 選んでいただけたら、全力で頑張ります

### draftInterest.standard.bold[]

- `EVENT_LINES_BY_KEY.draftInterest.standard.bold[1]`: てっぺんを獲る。それ以外に興味はない
- `EVENT_LINES_BY_KEY.draftInterest.standard.bold[2]`: 私を選んでくれるなら、絶対に後悔はさせない！

### draftInterest.standard.quiet[]

- `EVENT_LINES_BY_KEY.draftInterest.standard.quiet[1]`: ………よろしくお願いします

### draftInterest.standard.shy[]

- `EVENT_LINES_BY_KEY.draftInterest.standard.shy[1]`: あ、あの…私なんかで良ければ…が、頑張ります…

### draftInterest.standard.easygoing[]

- `EVENT_LINES_BY_KEY.draftInterest.standard.easygoing[1]`: えへへ、一緒に楽しくやりましょうよ！
- `EVENT_LINES_BY_KEY.draftInterest.standard.easygoing[2]`: 退屈なプロレスはしないって約束するよ！

### draftInterest.standard.earnest[]

- `EVENT_LINES_BY_KEY.draftInterest.standard.earnest[1]`: 地道にコツコツ…それが私のやり方です。信じてもらえますか？
- `EVENT_LINES_BY_KEY.draftInterest.standard.earnest[2]`: 誰よりも練習します。見ていてください

### draftInterest.standard.emotional[]

- `EVENT_LINES_BY_KEY.draftInterest.standard.emotional[1]`: 選んでくれたら…全力で…全力で頑張ります…！

### draftInterest.ojousama.normal[]

- `EVENT_LINES_BY_KEY.draftInterest.ojousama.normal[1]`: お選びいただけるなら、精一杯努めますわ

### draftInterest.ojousama.bold[]

- `EVENT_LINES_BY_KEY.draftInterest.ojousama.bold[1]`: 頂点に立つために参りますわ。覚悟はよろしくて？

### draftInterest.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.draftInterest.ojousama.quiet[1]`: ………よろしくお願いいたしますわ

### draftInterest.ojousama.shy[]

- `EVENT_LINES_BY_KEY.draftInterest.ojousama.shy[1]`: あ、あの…わたくしでよろしければ…が、頑張りますわ…

### draftInterest.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.draftInterest.ojousama.easygoing[1]`: うふふ、ご一緒に楽しくやりましょうよ
- `EVENT_LINES_BY_KEY.draftInterest.ojousama.easygoing[2]`: 退屈なプロレスはしないと約束いたしますわ

### draftInterest.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.draftInterest.ojousama.earnest[1]`: コツコツ積み重ねるのが信条ですの。見ていてくださいませ

### draftInterest.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.draftInterest.ojousama.emotional[1]`: 選んでいただけたら…わたくし、全力で…全力で頑張りますわ…！

### draftInterest.delinquent.normal[]

- `EVENT_LINES_BY_KEY.draftInterest.delinquent.normal[1]`: 選んでくれるなら、全力で暴れるぜ

### draftInterest.delinquent.bold[]

- `EVENT_LINES_BY_KEY.draftInterest.delinquent.bold[1]`: 選ぶなら覚悟しろよ。手加減なんかしねえからな

### draftInterest.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.draftInterest.delinquent.quiet[1]`: ………よろしく。頼む

### draftInterest.delinquent.shy[]

- `EVENT_LINES_BY_KEY.draftInterest.delinquent.shy[1]`: あ、あの…あたしなんかで良ければ…が、頑張るんで…

### draftInterest.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.draftInterest.delinquent.easygoing[1]`: 楽しくやろうぜ！退屈なのは嫌いだからな！

### draftInterest.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.draftInterest.delinquent.earnest[1]`: 地道にコツコツ…それがあたしのやり方だ。信じてくれるか？
- `EVENT_LINES_BY_KEY.draftInterest.delinquent.earnest[2]`: 誰よりも練習する。見ててくれ

### draftInterest.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.draftInterest.delinquent.emotional[1]`: 選んでくれたら…全力で…全力でやる…！

### draftInterest.seductive.normal[]

- `EVENT_LINES_BY_KEY.draftInterest.seductive.normal[1]`: 選んでくれるなら…期待に応えるわよ

### draftInterest.seductive.bold[]

- `EVENT_LINES_BY_KEY.draftInterest.seductive.bold[1]`: 私を選んで。後悔はさせないわ

### draftInterest.seductive.quiet[]

- `EVENT_LINES_BY_KEY.draftInterest.seductive.quiet[1]`: ………よろしく、ね

### draftInterest.seductive.shy[]

- `EVENT_LINES_BY_KEY.draftInterest.seductive.shy[1]`: あ、あの…私で良ければ…が、頑張るから…

### draftInterest.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.draftInterest.seductive.easygoing[1]`: 一緒に楽しい団体を作りましょう？

### draftInterest.seductive.earnest[]

- `EVENT_LINES_BY_KEY.draftInterest.seductive.earnest[1]`: 地道に頑張るタイプよ。見ていてくれる？

### draftInterest.seductive.emotional[]

- `EVENT_LINES_BY_KEY.draftInterest.seductive.emotional[1]`: 選んでくれたら…全力で…全力でやるから…！

### draftInterest.composed.normal[]

- `EVENT_LINES_BY_KEY.draftInterest.composed.normal[1]`: …選んでくれるなら、応えるよ

### draftInterest.composed.bold[]

- `EVENT_LINES_BY_KEY.draftInterest.composed.bold[1]`: …てっぺんを獲りに来た。それだけ

### draftInterest.composed.quiet[]

- `EVENT_LINES_BY_KEY.draftInterest.composed.quiet[1]`: ……よろしく

### draftInterest.composed.shy[]

- `EVENT_LINES_BY_KEY.draftInterest.composed.shy[1]`: …私で良ければ、だけど。…頑張るよ

### draftInterest.composed.easygoing[]

- `EVENT_LINES_BY_KEY.draftInterest.composed.easygoing[1]`: …楽しくやろう。退屈にはさせないよ

### draftInterest.composed.earnest[]

- `EVENT_LINES_BY_KEY.draftInterest.composed.earnest[1]`: …コツコツやるタイプだ。見ていてくれれば

### draftInterest.composed.emotional[]

- `EVENT_LINES_BY_KEY.draftInterest.composed.emotional[1]`: …っ…選んでくれたら、全力で応える

### injury.standard.normal[]

- `EVENT_LINES_BY_KEY.injury.standard.normal[1]`: うぅ…痛い…。でも、すぐ戻ります
- `EVENT_LINES_BY_KEY.injury.standard.normal[2]`: しばらくお休みをいただきます
- `EVENT_LINES_BY_KEY.injury.standard.normal[3]`: ごめんなさい…体が言うことを聞かなくて

### injury.standard.bold[]

- `EVENT_LINES_BY_KEY.injury.standard.bold[1]`: くっ…こんなところで止められるか！
- `EVENT_LINES_BY_KEY.injury.standard.bold[2]`: この程度、問題じゃない
- `EVENT_LINES_BY_KEY.injury.standard.bold[3]`: 早く戻る。絶対に遅れを取るもんか

### injury.standard.quiet[]

- `EVENT_LINES_BY_KEY.injury.standard.quiet[2]`: …（静かに頭を下げる）
- `EVENT_LINES_BY_KEY.injury.standard.quiet[3]`: …ごめん

### injury.standard.earnest[]

- `EVENT_LINES_BY_KEY.injury.standard.earnest[1]`: ご期待に応えられず、すみません…
- `EVENT_LINES_BY_KEY.injury.standard.earnest[2]`: 必ず万全の状態で戻ってきます
- `EVENT_LINES_BY_KEY.injury.standard.earnest[3]`: 応援してくれるみんなに、申し訳ない…

### injury.standard.emotional[]

- `EVENT_LINES_BY_KEY.injury.standard.emotional[1]`: くぅっ…痛い…！ でも、絶対戻ります…！
- `EVENT_LINES_BY_KEY.injury.standard.emotional[2]`: うぅ…こんなの悔しい…！
- `EVENT_LINES_BY_KEY.injury.standard.emotional[3]`: 悔しい…！ 絶対に、絶対に戻る…！

### injury.standard.easygoing[]

- `EVENT_LINES_BY_KEY.injury.standard.easygoing[1]`: やっちゃったー。ちょっと休むね
- `EVENT_LINES_BY_KEY.injury.standard.easygoing[2]`: えへへ…ごめん、ちょっと休むよ
- `EVENT_LINES_BY_KEY.injury.standard.easygoing[3]`: まぁ、こういう時もあるよね。すぐ戻るから

### injury.standard.shy[]

- `EVENT_LINES_BY_KEY.injury.standard.shy[1]`: ご、ごめんなさい…ちょっと休みます…
- `EVENT_LINES_BY_KEY.injury.standard.shy[2]`: う、うぅ…痛いです…
- `EVENT_LINES_BY_KEY.injury.standard.shy[3]`: す、すみません…ご迷惑を…

### injury.ojousama.normal[]

- `EVENT_LINES_BY_KEY.injury.ojousama.normal[1]`: このくらい、たいしたことございませんわ
- `EVENT_LINES_BY_KEY.injury.ojousama.normal[2]`: 少しだけ休ませてくださいまし

### injury.ojousama.bold[]

- `EVENT_LINES_BY_KEY.injury.ojousama.bold[1]`: このくらい何でもありませんわ。すぐ戻りますの
- `EVENT_LINES_BY_KEY.injury.ojousama.bold[2]`: 私を止めるには足りませんわよ

### injury.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.injury.ojousama.quiet[1]`: …ご迷惑を、おかけしますわ

### injury.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.injury.ojousama.earnest[1]`: ご期待に添えず、申し訳ありませんわ
- `EVENT_LINES_BY_KEY.injury.ojousama.earnest[2]`: 必ず、強くなって戻ってまいりますの

### injury.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.injury.ojousama.emotional[1]`: 悔しいですわ…！ 必ず戻りますの…！

### injury.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.injury.ojousama.easygoing[1]`: あらあら…少し休みますわね

### injury.ojousama.shy[]

- `EVENT_LINES_BY_KEY.injury.ojousama.shy[1]`: ご、ごめんなさいませ…少しだけ、休ませてくださいまし…

### injury.polite.normal[]

- `EVENT_LINES_BY_KEY.injury.polite.normal[1]`: ご迷惑をおかけします…しばらく休みます
- `EVENT_LINES_BY_KEY.injury.polite.normal[2]`: すみません…万全の状態で戻ってきます

### injury.polite.bold[]

- `EVENT_LINES_BY_KEY.injury.polite.bold[1]`: ご心配なく。必ず戻ってきます
- `EVENT_LINES_BY_KEY.injury.polite.bold[2]`: この程度で止まる気はありません

### injury.polite.quiet[]

- `EVENT_LINES_BY_KEY.injury.polite.quiet[1]`: …ご迷惑を、おかけします

### injury.polite.earnest[]

- `EVENT_LINES_BY_KEY.injury.polite.earnest[1]`: ご期待に応えられず、申し訳ありません
- `EVENT_LINES_BY_KEY.injury.polite.earnest[2]`: 必ず強くなって戻ってまいります

### injury.polite.emotional[]

- `EVENT_LINES_BY_KEY.injury.polite.emotional[1]`: …っ、悔しいです…でも、必ず戻ります…！

### injury.polite.easygoing[]

- `EVENT_LINES_BY_KEY.injury.polite.easygoing[1]`: あ、ちょっと休みますね〜 すぐ戻ります

### injury.polite.shy[]

- `EVENT_LINES_BY_KEY.injury.polite.shy[1]`: す、すみません…少しだけ休ませてください…

### injury.delinquent.normal[]

- `EVENT_LINES_BY_KEY.injury.delinquent.normal[1]`: ちっ…やっちまったか
- `EVENT_LINES_BY_KEY.injury.delinquent.normal[2]`: こんなんで休むの、カッコ悪いな

### injury.delinquent.bold[]

- `EVENT_LINES_BY_KEY.injury.delinquent.bold[1]`: ちくしょう…！ ぜってぇ戻ってくるからな！
- `EVENT_LINES_BY_KEY.injury.delinquent.bold[2]`: こんなんで終わってたまるかよ

### injury.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.injury.delinquent.quiet[1]`: …ちっ

### injury.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.injury.delinquent.earnest[1]`: 応援してくれてる奴らに、顔向けできねえ…

### injury.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.injury.delinquent.emotional[1]`: ちくしょう…！ うっ…！ 絶対に戻るぞ…！

### injury.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.injury.delinquent.easygoing[1]`: やっちまったぜ〜 まぁすぐ戻るわ

### injury.delinquent.shy[]

- `EVENT_LINES_BY_KEY.injury.delinquent.shy[1]`: …ご、ごめん…ちょっと休む…

### injury.cool.normal[]

- `EVENT_LINES_BY_KEY.injury.cool.normal[1]`: ……すぐ戻る
- `EVENT_LINES_BY_KEY.injury.cool.normal[2]`: ……心配はいらない

### injury.cool.bold[]

- `EVENT_LINES_BY_KEY.injury.cool.bold[1]`: ……この程度で止まらない
- `EVENT_LINES_BY_KEY.injury.cool.bold[2]`: ……戻る。それだけだ

### injury.cool.quiet[]

- `EVENT_LINES_BY_KEY.injury.cool.quiet[2]`: ……すぐ戻る

### injury.cool.earnest[]

- `EVENT_LINES_BY_KEY.injury.cool.earnest[1]`: ……申し訳ない。必ず戻る

### injury.cool.emotional[]

- `EVENT_LINES_BY_KEY.injury.cool.emotional[1]`: ……っ…くそ。必ず戻る

### injury.cool.easygoing[]

- `EVENT_LINES_BY_KEY.injury.cool.easygoing[1]`: …ちょっと休む。すぐ戻るよ

### injury.cool.shy[]

- `EVENT_LINES_BY_KEY.injury.cool.shy[1]`: ……ご、ごめん…

### injury.seductive.normal[]

- `EVENT_LINES_BY_KEY.injury.seductive.normal[1]`: …ちょっとだけ、休ませてね
- `EVENT_LINES_BY_KEY.injury.seductive.normal[2]`: すぐに戻るわ。待っててくれる？

### injury.seductive.bold[]

- `EVENT_LINES_BY_KEY.injury.seductive.bold[1]`: こんなことで止まると思ってる？ 甘いわ
- `EVENT_LINES_BY_KEY.injury.seductive.bold[2]`: すぐ戻るわ。覚悟してなさい

### injury.seductive.quiet[]

- `EVENT_LINES_BY_KEY.injury.seductive.quiet[1]`: ……待っててね

### injury.seductive.earnest[]

- `EVENT_LINES_BY_KEY.injury.seductive.earnest[1]`: 応援してくれてる人に申し訳ないわ…必ず戻る

### injury.seductive.emotional[]

- `EVENT_LINES_BY_KEY.injury.seductive.emotional[1]`: …っ…悔しい…必ず戻ってやる…

### injury.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.injury.seductive.easygoing[1]`: ちょっと休憩ね？ すぐ戻るから寂しがらないで

### injury.seductive.shy[]

- `EVENT_LINES_BY_KEY.injury.seductive.shy[1]`: …ご、ごめんね…少しだけ…休ませて…

### injury.composed.normal[]

- `EVENT_LINES_BY_KEY.injury.composed.normal[1]`: …少し休むよ。すぐ戻る
- `EVENT_LINES_BY_KEY.injury.composed.normal[2]`: …大したことじゃないから、安心して

### injury.composed.bold[]

- `EVENT_LINES_BY_KEY.injury.composed.bold[1]`: …私の代わりは、そう簡単には見つからないよ
- `EVENT_LINES_BY_KEY.injury.composed.bold[2]`: …問題ない。少し休めば治る

### injury.composed.quiet[]

- `EVENT_LINES_BY_KEY.injury.composed.quiet[1]`: …戻る。待ってて

### injury.composed.earnest[]

- `EVENT_LINES_BY_KEY.injury.composed.earnest[1]`: …応援に応えられなくて、ごめん。必ず戻るよ

### injury.composed.emotional[]

- `EVENT_LINES_BY_KEY.injury.composed.emotional[1]`: …っ…悔しい。でも、必ず戻る

### injury.composed.easygoing[]

- `EVENT_LINES_BY_KEY.injury.composed.easygoing[1]`: …ま、すぐ戻るよ。心配しないで

### injury.composed.shy[]

- `EVENT_LINES_BY_KEY.injury.composed.shy[1]`: …す、すみません。少し休みます

### titleWin.cool.normal[]

- `EVENT_LINES_BY_KEY.titleWin.cool.normal[1]`: …獲った。チャンピオンだ
- `EVENT_LINES_BY_KEY.titleWin.cool.normal[2]`: …このベルトは手放さない

### titleWin.cool.bold[]

- `EVENT_LINES_BY_KEY.titleWin.cool.bold[1]`: …当然だ。この座は私のためにある

### titleWin.cool.quiet[]

- `EVENT_LINES_BY_KEY.titleWin.cool.quiet[1]`: …ようやくだ。この座は渡さない

### titleWin.cool.shy[]

- `EVENT_LINES_BY_KEY.titleWin.cool.shy[1]`: …私が、チャンピオン。…実感がない

### titleWin.cool.easygoing[]

- `EVENT_LINES_BY_KEY.titleWin.cool.easygoing[1]`: …新チャンピオンだ。ここからもっと盛り上げる
- `EVENT_LINES_BY_KEY.titleWin.cool.easygoing[2]`: …ベルトを獲った。…悪くない気分だ

### titleWin.cool.earnest[]

- `EVENT_LINES_BY_KEY.titleWin.cool.earnest[1]`: …積み重ねてきて、よかった。本当に
- `EVENT_LINES_BY_KEY.titleWin.cool.earnest[2]`: …諦めなくてよかった。このベルトは努力の結晶だ

### titleWin.cool.emotional[]

- `EVENT_LINES_BY_KEY.titleWin.cool.emotional[1]`: …っ…チャンピオン。…嬉しい。…泣きそうだ

### titleWin.polite.normal[]

- `EVENT_LINES_BY_KEY.titleWin.polite.normal[1]`: やりました…！チャンピオンになれました…！夢のようです
- `EVENT_LINES_BY_KEY.titleWin.polite.normal[2]`: このベルト、絶対に手放しません。応援ありがとうございます

### titleWin.polite.bold[]

- `EVENT_LINES_BY_KEY.titleWin.polite.bold[1]`: 頂点に立ちました。でもまだ足りません…もっと上へ
- `EVENT_LINES_BY_KEY.titleWin.polite.bold[2]`: この炎は消えません。このベルトで、もっと熱い闘いを

### titleWin.polite.quiet[]

- `EVENT_LINES_BY_KEY.titleWin.polite.quiet[1]`: …ありがとうございます…（涙をこらえている）

### titleWin.polite.shy[]

- `EVENT_LINES_BY_KEY.titleWin.polite.shy[1]`: え…わ、わたしが…チャンピオン、ですか…？ 夢のようです…

### titleWin.polite.easygoing[]

- `EVENT_LINES_BY_KEY.titleWin.polite.easygoing[1]`: 新チャンピオン誕生です。これからもっと盛り上げます
- `EVENT_LINES_BY_KEY.titleWin.polite.easygoing[2]`: ベルト獲っちゃいました。最高です

### titleWin.polite.earnest[]

- `EVENT_LINES_BY_KEY.titleWin.polite.earnest[1]`: 積み重ねが報われました…本当に、ありがとうございます

### titleWin.polite.emotional[]

- `EVENT_LINES_BY_KEY.titleWin.polite.emotional[1]`: ああ…！チャンピオンです…！嬉しい…涙が…！

### titleWin.standard.normal[]

- `EVENT_LINES_BY_KEY.titleWin.standard.normal[1]`: やった…！チャンピオンになれた…！夢みたい！
- `EVENT_LINES_BY_KEY.titleWin.standard.normal[2]`: このベルト、絶対に手放しません！
- `EVENT_LINES_BY_KEY.titleWin.standard.normal[3]`: 最高の気分です！応援ありがとうございます！

### titleWin.standard.bold[]

- `EVENT_LINES_BY_KEY.titleWin.standard.bold[1]`: てっぺんに立った。でもまだ足りない…もっと上へ
- `EVENT_LINES_BY_KEY.titleWin.standard.bold[2]`: この炎は消えない。ベルトを懸けて、もっと熱い闘いを！

### titleWin.standard.quiet[]

- `EVENT_LINES_BY_KEY.titleWin.standard.quiet[1]`: ………（ベルトを抱きしめている）

### titleWin.standard.shy[]

- `EVENT_LINES_BY_KEY.titleWin.standard.shy[1]`: え…わ、私が…チャンピオン…？ 夢みたい…

### titleWin.standard.easygoing[]

- `EVENT_LINES_BY_KEY.titleWin.standard.easygoing[1]`: 新チャンピオン誕生！みんな、これからもっと盛り上がるよ！
- `EVENT_LINES_BY_KEY.titleWin.standard.easygoing[2]`: ベルト獲っちゃった！最高！

### titleWin.standard.earnest[]

- `EVENT_LINES_BY_KEY.titleWin.standard.earnest[1]`: コツコツ積み重ねてきて…よかった。本当に、よかった…！
- `EVENT_LINES_BY_KEY.titleWin.standard.earnest[2]`: 諦めなくてよかった…このベルト、努力の結晶です

### titleWin.standard.emotional[]

- `EVENT_LINES_BY_KEY.titleWin.standard.emotional[1]`: うわああ…！チャンピオン…！嬉しい…泣いちゃう…！

### titleWin.ojousama.normal[]

- `EVENT_LINES_BY_KEY.titleWin.ojousama.normal[1]`: ……ベルトが、こんなに重いなんて。……確かに、この手で掴んだのね

### titleWin.ojousama.bold[]

- `EVENT_LINES_BY_KEY.titleWin.ojousama.bold[1]`: 頂点に立ちましたわ。でもここからが本当の闘いですの

### titleWin.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.titleWin.ojousama.quiet[1]`: ………（ベルトを胸に抱いて、目を閉じている）

### titleWin.ojousama.shy[]

- `EVENT_LINES_BY_KEY.titleWin.ojousama.shy[1]`: え…わ、わたくしが…チャンピオン…？ 夢のようですわ…

### titleWin.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.titleWin.ojousama.easygoing[1]`: 新チャンピオン誕生ですわ。ここからもっと盛り上げますの
- `EVENT_LINES_BY_KEY.titleWin.ojousama.easygoing[2]`: ベルト、獲ってしまいましたわ。最高の気分ですの

### titleWin.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.titleWin.ojousama.earnest[1]`: 努力が報われましたわ…！このベルト、大切にしますの

### titleWin.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.titleWin.ojousama.emotional[1]`: ああ…！チャンピオン…！嬉しい…涙が出ますわ…！

### titleWin.delinquent.normal[]

- `EVENT_LINES_BY_KEY.titleWin.delinquent.normal[1]`: やったぜ！チャンピオンだ！最高！

### titleWin.delinquent.bold[]

- `EVENT_LINES_BY_KEY.titleWin.delinquent.bold[1]`: やっと獲ったぜ！次は誰が来ても負けねえ！

### titleWin.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.titleWin.delinquent.quiet[1]`: ………（ベルトを握りしめたまま、動かない）

### titleWin.delinquent.shy[]

- `EVENT_LINES_BY_KEY.titleWin.delinquent.shy[1]`: え…あ、あたしが…チャンピオン…？ 嘘みたいだ…

### titleWin.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.titleWin.delinquent.easygoing[1]`: チャンピオンだぜー！最高だろ！

### titleWin.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.titleWin.delinquent.earnest[1]`: コツコツ積み重ねてきて…よかった。ほんとに、よかった…！
- `EVENT_LINES_BY_KEY.titleWin.delinquent.earnest[2]`: 諦めなくてよかった…このベルトは、努力の塊だ

### titleWin.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.titleWin.delinquent.emotional[1]`: うわあ…！チャンピオンだ…！嬉しい…泣きそうだ…！

### titleWin.seductive.normal[]

- `EVENT_LINES_BY_KEY.titleWin.seductive.normal[1]`: チャンピオン…最高の気分ね

### titleWin.seductive.bold[]

- `EVENT_LINES_BY_KEY.titleWin.seductive.bold[1]`: これが始まりよ。このベルトで時代を作る

### titleWin.seductive.quiet[]

- `EVENT_LINES_BY_KEY.titleWin.seductive.quiet[1]`: ………（ベルトに頬を寄せている）

### titleWin.seductive.shy[]

- `EVENT_LINES_BY_KEY.titleWin.seductive.shy[1]`: え…私が…チャンピオン…？ 夢みたい…

### titleWin.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.titleWin.seductive.easygoing[1]`: ベルトが似合うのは私だけでしょ？ ふふ

### titleWin.seductive.earnest[]

- `EVENT_LINES_BY_KEY.titleWin.seductive.earnest[1]`: 積み重ねてきて…よかった。このベルト、大切にするわ

### titleWin.seductive.emotional[]

- `EVENT_LINES_BY_KEY.titleWin.seductive.emotional[1]`: ああ…っ…チャンピオン…。嬉しい…だめ、泣いちゃう…

### titleWin.composed.normal[]

- `EVENT_LINES_BY_KEY.titleWin.composed.normal[1]`: …チャンピオンか。…悪くないね

### titleWin.composed.bold[]

- `EVENT_LINES_BY_KEY.titleWin.composed.bold[1]`: …頂点。…でもまだ先がある

### titleWin.composed.quiet[]

- `EVENT_LINES_BY_KEY.titleWin.composed.quiet[1]`: ……（静かにベルトを見つめている）

### titleWin.composed.shy[]

- `EVENT_LINES_BY_KEY.titleWin.composed.shy[1]`: …私が、チャンピオンか。…まだ、実感がないな

### titleWin.composed.easygoing[]

- `EVENT_LINES_BY_KEY.titleWin.composed.easygoing[1]`: …チャンピオンだ。…いい気分だね

### titleWin.composed.earnest[]

- `EVENT_LINES_BY_KEY.titleWin.composed.earnest[1]`: …積み重ねてきたものが、ここに。…大切にする

### titleWin.composed.emotional[]

- `EVENT_LINES_BY_KEY.titleWin.composed.emotional[1]`: …っ…チャンピオン。…嬉しい

### titleDefense.cool.normal[]

- `EVENT_LINES_BY_KEY.titleDefense.cool.normal[1]`: …防衛。…だが、まだ足りない
- `EVENT_LINES_BY_KEY.titleDefense.cool.normal[2]`: …守るたびに、このベルトの重さがわかる

### titleDefense.cool.bold[]

- `EVENT_LINES_BY_KEY.titleDefense.cool.bold[1]`: …格が違う。それだけのことだ

### titleDefense.cool.quiet[]

- `EVENT_LINES_BY_KEY.titleDefense.cool.quiet[1]`: …次も勝つ。それだけだ

### titleDefense.cool.shy[]

- `EVENT_LINES_BY_KEY.titleDefense.cool.shy[1]`: …守れた。…よかった

### titleDefense.cool.easygoing[]

- `EVENT_LINES_BY_KEY.titleDefense.cool.easygoing[1]`: …チャンピオンは私だ。また守り切った
- `EVENT_LINES_BY_KEY.titleDefense.cool.easygoing[2]`: …いい試合だった。また挑んでくればいい

### titleDefense.cool.earnest[]

- `EVENT_LINES_BY_KEY.titleDefense.cool.earnest[1]`: …防衛できた。だが満足はしない。もっと強くなる
- `EVENT_LINES_BY_KEY.titleDefense.cool.earnest[2]`: …日々の積み重ねが、結果になった

### titleDefense.cool.emotional[]

- `EVENT_LINES_BY_KEY.titleDefense.cool.emotional[1]`: …っ…守れた。…次も守る

### titleDefense.polite.normal[]

- `EVENT_LINES_BY_KEY.titleDefense.polite.normal[1]`: 防衛できました…ほっとしています。でも、もっと強くならないと
- `EVENT_LINES_BY_KEY.titleDefense.polite.normal[2]`: このベルトの重さ、守るたびに感じます

### titleDefense.polite.bold[]

- `EVENT_LINES_BY_KEY.titleDefense.polite.bold[1]`: まだ誰にもこの座はお譲りできません。もっと来てください
- `EVENT_LINES_BY_KEY.titleDefense.polite.bold[2]`: 防衛は通過点です。私が目指すのは、もっと先

### titleDefense.polite.quiet[]

- `EVENT_LINES_BY_KEY.titleDefense.polite.quiet[1]`: …守れました。次も、頑張ります

### titleDefense.polite.shy[]

- `EVENT_LINES_BY_KEY.titleDefense.polite.shy[1]`: よ、よかった…守れました…（ほっとしている）

### titleDefense.polite.easygoing[]

- `EVENT_LINES_BY_KEY.titleDefense.polite.easygoing[1]`: チャンピオンは私です。また守り切りました
- `EVENT_LINES_BY_KEY.titleDefense.polite.easygoing[2]`: いい試合でした。また挑戦してきてくださいね

### titleDefense.polite.earnest[]

- `EVENT_LINES_BY_KEY.titleDefense.polite.earnest[1]`: 防衛できました。でも、まだまだ精進いたします

### titleDefense.polite.emotional[]

- `EVENT_LINES_BY_KEY.titleDefense.polite.emotional[1]`: 守れました…！嬉しい…！次も絶対に守ります…！

### titleDefense.standard.normal[]

- `EVENT_LINES_BY_KEY.titleDefense.standard.normal[1]`: 防衛成功…！ほっとした…。でも、もっと強くならないと。
- `EVENT_LINES_BY_KEY.titleDefense.standard.normal[2]`: このベルトの重さ、守るたびに感じます。

### titleDefense.standard.bold[]

- `EVENT_LINES_BY_KEY.titleDefense.standard.bold[1]`: まだ誰にもこの座は譲れない。もっと来い！
- `EVENT_LINES_BY_KEY.titleDefense.standard.bold[2]`: 防衛は通過点。私が目指すのはもっと先だ

### titleDefense.standard.quiet[]

- `EVENT_LINES_BY_KEY.titleDefense.standard.quiet[1]`: ………（静かにベルトを見つめている）

### titleDefense.standard.shy[]

- `EVENT_LINES_BY_KEY.titleDefense.standard.shy[1]`: よ、よかった…守れた…（ほっとしている）

### titleDefense.standard.easygoing[]

- `EVENT_LINES_BY_KEY.titleDefense.standard.easygoing[1]`: チャンピオンは私！また守り切っちゃいました！
- `EVENT_LINES_BY_KEY.titleDefense.standard.easygoing[2]`: いい試合だった！また挑戦してきてね！

### titleDefense.standard.earnest[]

- `EVENT_LINES_BY_KEY.titleDefense.standard.earnest[1]`: 防衛できた…！でも満足しない。もっと強くなります
- `EVENT_LINES_BY_KEY.titleDefense.standard.earnest[2]`: 日々の積み重ねが結果に出てくれた

### titleDefense.standard.emotional[]

- `EVENT_LINES_BY_KEY.titleDefense.standard.emotional[1]`: 守れた…！嬉しい…！次も絶対守る…！

### titleDefense.ojousama.normal[]

- `EVENT_LINES_BY_KEY.titleDefense.ojousama.normal[1]`: 防衛いたしましたわ。この座、まだまだ譲りませんの

### titleDefense.ojousama.bold[]

- `EVENT_LINES_BY_KEY.titleDefense.ojousama.bold[1]`: まだ誰にもお譲りしませんわ。もっと上を目指しますの

### titleDefense.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.titleDefense.ojousama.quiet[1]`: ………（ベルトの汚れを、指先でそっと拭っている）

### titleDefense.ojousama.shy[]

- `EVENT_LINES_BY_KEY.titleDefense.ojousama.shy[1]`: よ、よかった…守れましたわ…（胸に手をあてて）

### titleDefense.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.titleDefense.ojousama.easygoing[1]`: チャンピオンはわたくしですの。また守り切りましたわ
- `EVENT_LINES_BY_KEY.titleDefense.ojousama.easygoing[2]`: よい試合でしたわ。またいつでも挑んでらして

### titleDefense.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.titleDefense.ojousama.earnest[1]`: 防衛できましたわ。でもまだ満足はしませんの

### titleDefense.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.titleDefense.ojousama.emotional[1]`: 守れましたわ…！嬉しい…！次も絶対に守りますの…！

### titleDefense.delinquent.normal[]

- `EVENT_LINES_BY_KEY.titleDefense.delinquent.normal[1]`: 防衛だ！まだまだ渡さねーぞ！

### titleDefense.delinquent.bold[]

- `EVENT_LINES_BY_KEY.titleDefense.delinquent.bold[1]`: まだまだ負けるわけねーだろ！かかってこい！

### titleDefense.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.titleDefense.delinquent.quiet[1]`: ………（ベルトを肩に掛けたまま、黙っている）

### titleDefense.delinquent.shy[]

- `EVENT_LINES_BY_KEY.titleDefense.delinquent.shy[1]`: よ、よかった…守れた…（大きく息を吐いて）

### titleDefense.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.titleDefense.delinquent.easygoing[1]`: まだまだ渡さねーよ！最高！

### titleDefense.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.titleDefense.delinquent.earnest[1]`: 防衛できた…！でも満足はしねえ。もっと強くなる
- `EVENT_LINES_BY_KEY.titleDefense.delinquent.earnest[2]`: 日々の積み重ねが、ちゃんと結果になった

### titleDefense.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.titleDefense.delinquent.emotional[1]`: 守れた…！嬉しい…！次も絶対守ってやる…！

### titleDefense.seductive.normal[]

- `EVENT_LINES_BY_KEY.titleDefense.seductive.normal[1]`: 防衛成功…。このベルト、まだ返す気はないわ

### titleDefense.seductive.bold[]

- `EVENT_LINES_BY_KEY.titleDefense.seductive.bold[1]`: まだ誰も私を超えられないわね。当然でしょう

### titleDefense.seductive.quiet[]

- `EVENT_LINES_BY_KEY.titleDefense.seductive.quiet[1]`: ………（ベルトを撫でながら、目を細めている）

### titleDefense.seductive.shy[]

- `EVENT_LINES_BY_KEY.titleDefense.seductive.shy[1]`: よ、よかった…守れた…（力が抜けたように）

### titleDefense.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.titleDefense.seductive.easygoing[1]`: 防衛って地味に見える？ ふふ、そんなことないでしょ？

### titleDefense.seductive.earnest[]

- `EVENT_LINES_BY_KEY.titleDefense.seductive.earnest[1]`: 防衛できたわ…でも満足しない。もっと強くなる

### titleDefense.seductive.emotional[]

- `EVENT_LINES_BY_KEY.titleDefense.seductive.emotional[1]`: 守れた…っ…嬉しい…。次も、絶対に守るから…

### titleDefense.composed.normal[]

- `EVENT_LINES_BY_KEY.titleDefense.composed.normal[1]`: …防衛か。…まだ渡すつもりはないよ

### titleDefense.composed.bold[]

- `EVENT_LINES_BY_KEY.titleDefense.composed.bold[1]`: …まだ渡さない。…当然だね

### titleDefense.composed.quiet[]

- `EVENT_LINES_BY_KEY.titleDefense.composed.quiet[1]`: ……守った。…それだけ

### titleDefense.composed.shy[]

- `EVENT_LINES_BY_KEY.titleDefense.composed.shy[1]`: …守れた。…ほっとしたよ

### titleDefense.composed.easygoing[]

- `EVENT_LINES_BY_KEY.titleDefense.composed.easygoing[1]`: …防衛。…まあ、こんなもんかな

### titleDefense.composed.earnest[]

- `EVENT_LINES_BY_KEY.titleDefense.composed.earnest[1]`: …防衛できた。…でもまだ満足はしない

### titleDefense.composed.emotional[]

- `EVENT_LINES_BY_KEY.titleDefense.composed.emotional[1]`: …っ…守れた。…よかった

### titleChallengeLoss.cool.normal[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.normal[1]`: …悔しい。だが、糧にはなった。次だ
- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.normal[2]`: …実力が足りなかった。強くなって戻る

### titleChallengeLoss.cool.bold[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.bold[1]`: …次はない。次で、終わらせる

### titleChallengeLoss.cool.quiet[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.quiet[1]`: …次で終わらせる

### titleChallengeLoss.cool.shy[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.shy[1]`: …すまない。…でも、諦めない

### titleChallengeLoss.cool.easygoing[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.easygoing[1]`: …今日は負けた。次はもっといい試合をする
- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.easygoing[2]`: …俯いていたら、応援してくれた人に失礼だ

### titleChallengeLoss.cool.earnest[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.earnest[1]`: …足りなかった。練習し直して、また挑む
- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.earnest[2]`: …悔しい。だが、ここで腐るわけにはいかない

### titleChallengeLoss.cool.emotional[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.cool.emotional[1]`: …っ…悔しい。…諦めはしない

### titleChallengeLoss.polite.normal[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.normal[1]`: 悔しいです…。でも、いい経験になりました。次こそは
- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.normal[2]`: まだ実力が足りませんでした…もっと強くなって帰ってきます

### titleChallengeLoss.polite.bold[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.bold[1]`: こんな結果、認められません…！もう一度やらせてください
- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.bold[2]`: …今日は認めます。でも、この借りは必ずお返しします

### titleChallengeLoss.polite.quiet[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.quiet[1]`: …悔しいです。でも、もう一度挑戦します

### titleChallengeLoss.polite.shy[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.shy[1]`: …申し訳ありません…でも…諦めたくないんです…

### titleChallengeLoss.polite.easygoing[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.easygoing[1]`: 今日は負けちゃいましたけど…次はもっといい試合をします
- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.easygoing[2]`: 悔しいですけど、下を向いてたら応援してくれる人に失礼ですもんね

### titleChallengeLoss.polite.earnest[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.earnest[1]`: 実力が足りませんでした。もっと精進いたします

### titleChallengeLoss.polite.emotional[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.polite.emotional[1]`: 悔しい…！悔しいです…！でも…絶対に諦めません…！

### titleChallengeLoss.standard.normal[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.normal[1]`: 悔しい…。でも、いい経験になりました。次こそは…！
- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.normal[2]`: まだ実力が足りなかった…。もっと強くなって帰ってきます。

### titleChallengeLoss.standard.bold[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.bold[1]`: くっ…！こんなの認めない！もう一回やらせてくれ！
- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.bold[2]`: …今日は認める。でもこの借りは必ず返す

### titleChallengeLoss.standard.quiet[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.quiet[1]`: ………（唇を噛んでいる）

### titleChallengeLoss.standard.shy[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.shy[1]`: …ごめんなさい…でも…諦めたくない…です…

### titleChallengeLoss.standard.easygoing[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.easygoing[1]`: 今日は負けちゃったけど…次はもっといい試合するから！
- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.easygoing[2]`: 悔しいけど、下向いてたら応援してくれる人に失礼だもんね

### titleChallengeLoss.standard.earnest[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.earnest[1]`: …足りなかった。もっと練習して、必ずもう一度挑戦します
- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.earnest[2]`: 悔しい…でもここで腐っちゃだめだ

### titleChallengeLoss.standard.emotional[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.standard.emotional[1]`: 悔しい…！悔しい…！でも…絶対諦めない…！

### titleChallengeLoss.ojousama.normal[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.ojousama.normal[1]`: 悔しゅうございますわ…でも、次こそは…

### titleChallengeLoss.ojousama.bold[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.ojousama.bold[1]`: ……これで終わりかしら。もう一度、場を用意していただける？

### titleChallengeLoss.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.ojousama.quiet[1]`: ………（拳を握ったまま、顔を上げない）

### titleChallengeLoss.ojousama.shy[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.ojousama.shy[1]`: …ごめんなさい…でも…諦めたくありませんの…

### titleChallengeLoss.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.ojousama.easygoing[1]`: 今日は負けてしまいましたけれど…次はもっとよい試合をしますわ
- `EVENT_LINES_BY_KEY.titleChallengeLoss.ojousama.easygoing[2]`: 悔しいですけれど、俯いていては応援してくださる方に失礼ですもの

### titleChallengeLoss.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.ojousama.earnest[1]`: 実力が足りませんでしたわ…もっと精進いたしますの

### titleChallengeLoss.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.ojousama.emotional[1]`: 悔しい…！悔しいですわ…！でも…絶対に諦めませんの…！

### titleChallengeLoss.delinquent.normal[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.delinquent.normal[1]`: くそっ…次は絶対勝つ…！

### titleChallengeLoss.delinquent.bold[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.delinquent.bold[1]`: こんなの認めねえ！もう一回だ！

### titleChallengeLoss.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.delinquent.quiet[1]`: ………（マットを一度だけ、拳で叩いた）

### titleChallengeLoss.delinquent.shy[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.delinquent.shy[1]`: …ごめん…でも…諦めたくねえんだ…

### titleChallengeLoss.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.delinquent.easygoing[1]`: くそー！悔しい！でも次やってやるからな！

### titleChallengeLoss.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.delinquent.earnest[1]`: …足りなかった。もっと練習して、必ずもう一度挑む
- `EVENT_LINES_BY_KEY.titleChallengeLoss.delinquent.earnest[2]`: 悔しい…けど、ここで腐ったら終わりだ

### titleChallengeLoss.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.delinquent.emotional[1]`: 悔しい…！悔しいんだよ…！でも…絶対諦めねえ…！

### titleChallengeLoss.seductive.normal[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.seductive.normal[1]`: 悔しいわ…でも、次こそはね

### titleChallengeLoss.seductive.bold[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.seductive.bold[1]`: …今日は認めるわ。でもこの借り、必ず返す

### titleChallengeLoss.seductive.quiet[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.seductive.quiet[1]`: ………（乱れた髪をかき上げて、笑おうとして失敗する）

### titleChallengeLoss.seductive.shy[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.seductive.shy[1]`: …ごめんなさい…でも…諦めたくないの…

### titleChallengeLoss.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.seductive.easygoing[1]`: 今日は負けちゃったわね。次はもっと輝くから見ていて

### titleChallengeLoss.seductive.earnest[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.seductive.earnest[1]`: 足りなかったわ…でも、もう一度挑戦する

### titleChallengeLoss.seductive.emotional[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.seductive.emotional[1]`: 悔しい…っ…悔しい…。でも…絶対に、諦めない…

### titleChallengeLoss.composed.normal[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.composed.normal[1]`: …届かなかったか。…次だね

### titleChallengeLoss.composed.bold[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.composed.bold[1]`: …認める。…でもこの借りは返す

### titleChallengeLoss.composed.quiet[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.composed.quiet[1]`: ……足りなかった

### titleChallengeLoss.composed.shy[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.composed.shy[1]`: …ごめんね。…でも、諦めるつもりはないよ

### titleChallengeLoss.composed.easygoing[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.composed.easygoing[1]`: …負けちゃったか。…まあ次があるよ

### titleChallengeLoss.composed.earnest[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.composed.earnest[1]`: …足りなかった。…もっと積み重ねるよ

### titleChallengeLoss.composed.emotional[]

- `EVENT_LINES_BY_KEY.titleChallengeLoss.composed.emotional[1]`: …っ…悔しい。…でも、諦めない

### titleLoss.cool.normal[]

- `EVENT_LINES_BY_KEY.titleLoss.cool.normal[1]`: …失った。だが、ここで戦い続ける
- `EVENT_LINES_BY_KEY.titleLoss.cool.normal[2]`: …悔しい。チャンピオンとして、もっとやれたはずだ

### titleLoss.cool.bold[]

- `EVENT_LINES_BY_KEY.titleLoss.cool.bold[1]`: ……次は、容赦しない

### titleLoss.cool.quiet[]

- `EVENT_LINES_BY_KEY.titleLoss.cool.quiet[1]`: …認めよう。だが、終わりではない

### titleLoss.cool.shy[]

- `EVENT_LINES_BY_KEY.titleLoss.cool.shy[1]`: …すまない。…守れなかった

### titleLoss.cool.easygoing[]

- `EVENT_LINES_BY_KEY.titleLoss.cool.easygoing[1]`: …負けた。だが、応援してくれる人がいる限り立ち上がる
- `EVENT_LINES_BY_KEY.titleLoss.cool.easygoing[2]`: …ベルトのない自分は想像できなかった。でも、私は私だ

### titleLoss.cool.earnest[]

- `EVENT_LINES_BY_KEY.titleLoss.cool.earnest[1]`: …努力が足りなかった。一からやり直す
- `EVENT_LINES_BY_KEY.titleLoss.cool.earnest[2]`: …ベルトは手放した。だが、ここで終わりではない

### titleLoss.cool.emotional[]

- `EVENT_LINES_BY_KEY.titleLoss.cool.emotional[1]`: …っ…ベルトが。…でも、諦めない

### titleLoss.polite.normal[]

- `EVENT_LINES_BY_KEY.titleLoss.polite.normal[1]`: ベルトを失ってしまいました…。でも、この団体で戦い続けます
- `EVENT_LINES_BY_KEY.titleLoss.polite.normal[2]`: …悔しいです。チャンピオンとして、もっとやれたはずなのに

### titleLoss.polite.bold[]

- `EVENT_LINES_BY_KEY.titleLoss.polite.bold[1]`: 嘘です…！私のベルトが…！絶対に取り返します
- `EVENT_LINES_BY_KEY.titleLoss.polite.bold[2]`: ベルトを失いました…でも、この悔しさが次の炎になります

### titleLoss.polite.quiet[]

- `EVENT_LINES_BY_KEY.titleLoss.polite.quiet[1]`: …申し訳ございません。でも…もう一度…

### titleLoss.polite.shy[]

- `EVENT_LINES_BY_KEY.titleLoss.polite.shy[1]`: …申し訳ありません…ベルト…守れませんでした…

### titleLoss.polite.easygoing[]

- `EVENT_LINES_BY_KEY.titleLoss.polite.easygoing[1]`: 負けちゃいました…でもファンが応援してくれる限り、立ち上がります
- `EVENT_LINES_BY_KEY.titleLoss.polite.easygoing[2]`: …ベルトのない自分なんて想像できませんでした。でも、私は私ですから

### titleLoss.polite.earnest[]

- `EVENT_LINES_BY_KEY.titleLoss.polite.earnest[1]`: 努力が足りませんでした。一から出直します

### titleLoss.polite.emotional[]

- `EVENT_LINES_BY_KEY.titleLoss.polite.emotional[1]`: 嘘…嘘です…ベルトが…！でも…でも諦めません…！

### titleLoss.standard.normal[]

- `EVENT_LINES_BY_KEY.titleLoss.standard.normal[1]`: ベルトを失ってしまった…。でも、この団体で戦い続けます。
- `EVENT_LINES_BY_KEY.titleLoss.standard.normal[2]`: …悔しい。チャンピオンとしてもっとやれたはずなのに。

### titleLoss.standard.bold[]

- `EVENT_LINES_BY_KEY.titleLoss.standard.bold[1]`: 嘘だろ…！私のベルトが…！絶対に取り返す！
- `EVENT_LINES_BY_KEY.titleLoss.standard.bold[2]`: ベルトを失った…でもこの悔しさが次の炎になる

### titleLoss.standard.quiet[]

- `EVENT_LINES_BY_KEY.titleLoss.standard.quiet[1]`: ……今は…一人にしてください

### titleLoss.standard.shy[]

- `EVENT_LINES_BY_KEY.titleLoss.standard.shy[1]`: …ごめんなさい…ベルト…守れなかった…

### titleLoss.standard.easygoing[]

- `EVENT_LINES_BY_KEY.titleLoss.standard.easygoing[1]`: 負けちゃった…でもファンが応援してくれる限り、立ち上がるよ
- `EVENT_LINES_BY_KEY.titleLoss.standard.easygoing[2]`: …ベルトがない自分なんて想像できなかった。でも、私は私だから

### titleLoss.standard.earnest[]

- `EVENT_LINES_BY_KEY.titleLoss.standard.earnest[1]`: …努力が足りなかったんだ。もう一度、一からやり直します
- `EVENT_LINES_BY_KEY.titleLoss.standard.earnest[2]`: ベルトを手放してしまった…でもここで終わりじゃない

### titleLoss.standard.emotional[]

- `EVENT_LINES_BY_KEY.titleLoss.standard.emotional[1]`: 嘘…嘘だよ…ベルトが…！でも…でも諦めない…！

### titleLoss.ojousama.normal[]

- `EVENT_LINES_BY_KEY.titleLoss.ojousama.normal[1]`: ベルトを失いましたわ…でも、ここで終わりではありませんの

### titleLoss.ojousama.bold[]

- `EVENT_LINES_BY_KEY.titleLoss.ojousama.bold[1]`: 認めませんわ…！必ず取り返しますの！

### titleLoss.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.titleLoss.ojousama.quiet[1]`: ……今は…一人にしてくださいまし

### titleLoss.ojousama.shy[]

- `EVENT_LINES_BY_KEY.titleLoss.ojousama.shy[1]`: …ごめんなさい…ベルト…守れませんでしたわ…

### titleLoss.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.titleLoss.ojousama.easygoing[1]`: 負けてしまいましたわ…でも応援してくださる方がいる限り、立ち上がりますの
- `EVENT_LINES_BY_KEY.titleLoss.ojousama.easygoing[2]`: …ベルトのないわたくしなんて想像もできませんでしたわ。でも、わたくしはわたくしですもの

### titleLoss.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.titleLoss.ojousama.earnest[1]`: 実力が足りませんでしたわ。一から出直しますの

### titleLoss.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.titleLoss.ojousama.emotional[1]`: 嘘…嘘ですわ…ベルトが…！でも…でも諦めませんの…！

### titleLoss.delinquent.normal[]

- `EVENT_LINES_BY_KEY.titleLoss.delinquent.normal[1]`: くそ…ベルト取られた…でも終わりじゃねえ

### titleLoss.delinquent.bold[]

- `EVENT_LINES_BY_KEY.titleLoss.delinquent.bold[1]`: こんなの認めねえ！絶対取り返す！

### titleLoss.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.titleLoss.delinquent.quiet[1]`: ……今は…一人にしてくれ

### titleLoss.delinquent.shy[]

- `EVENT_LINES_BY_KEY.titleLoss.delinquent.shy[1]`: …ごめん…ベルト…守れなかった…

### titleLoss.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.titleLoss.delinquent.easygoing[1]`: くそー！でもまだ終わってねえから！

### titleLoss.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.titleLoss.delinquent.earnest[1]`: …努力が足りなかった。もう一度、一からやり直す
- `EVENT_LINES_BY_KEY.titleLoss.delinquent.earnest[2]`: ベルトは手放した…けど、ここで終わりじゃねえ

### titleLoss.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.titleLoss.delinquent.emotional[1]`: 嘘だ…嘘だろ…ベルトが…！でも…でも諦めねえ…！

### titleLoss.seductive.normal[]

- `EVENT_LINES_BY_KEY.titleLoss.seductive.normal[1]`: ベルトがない景色なんて…でも、ここで終わらないわ

### titleLoss.seductive.bold[]

- `EVENT_LINES_BY_KEY.titleLoss.seductive.bold[1]`: …覚えておきなさい。すぐに返してもらうわ

### titleLoss.seductive.quiet[]

- `EVENT_LINES_BY_KEY.titleLoss.seductive.quiet[1]`: ……今は…一人に、して

### titleLoss.seductive.shy[]

- `EVENT_LINES_BY_KEY.titleLoss.seductive.shy[1]`: …ごめんなさい…ベルト…守れなかったの…

### titleLoss.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.titleLoss.seductive.easygoing[1]`: 負けちゃったわね…でも私は私。立ち上がるわ

### titleLoss.seductive.earnest[]

- `EVENT_LINES_BY_KEY.titleLoss.seductive.earnest[1]`: 足りなかった…でも、ここで終わりにはしないわ

### titleLoss.seductive.emotional[]

- `EVENT_LINES_BY_KEY.titleLoss.seductive.emotional[1]`: 嘘…っ…ベルトが…。でも…でも、諦めない…

### titleLoss.composed.normal[]

- `EVENT_LINES_BY_KEY.titleLoss.composed.normal[1]`: …失ったか。…でも終わりじゃない

### titleLoss.composed.bold[]

- `EVENT_LINES_BY_KEY.titleLoss.composed.bold[1]`: …取り返す。…覚えておいて

### titleLoss.composed.quiet[]

- `EVENT_LINES_BY_KEY.titleLoss.composed.quiet[1]`: ……（静かにベルトを見送っている）

### titleLoss.composed.shy[]

- `EVENT_LINES_BY_KEY.titleLoss.composed.shy[1]`: …ごめんね。…守れなかったよ

### titleLoss.composed.easygoing[]

- `EVENT_LINES_BY_KEY.titleLoss.composed.easygoing[1]`: …ベルトがない景色か。…まあ、立ち上がるよ

### titleLoss.composed.earnest[]

- `EVENT_LINES_BY_KEY.titleLoss.composed.earnest[1]`: …足りなかった。…一からやり直そう

### titleLoss.composed.emotional[]

- `EVENT_LINES_BY_KEY.titleLoss.composed.emotional[1]`: …っ…ベルトが…。…取り戻す

### release.standard.normal[]

- `EVENT_LINES_BY_KEY.release.standard.normal[1]`: そう…ですか。ここでの思い出、忘れません
- `EVENT_LINES_BY_KEY.release.standard.normal[2]`: お世話になりました…
- `EVENT_LINES_BY_KEY.release.standard.normal[3]`: 悔しいです…でも、ありがとうございました

### release.standard.bold[]

- `EVENT_LINES_BY_KEY.release.standard.bold[1]`: わかった。どこかで強くなって戻る
- `EVENT_LINES_BY_KEY.release.standard.bold[2]`: 悔しいけど…次の場所で証明してみせる
- `EVENT_LINES_BY_KEY.release.standard.bold[3]`: ここで終わるつもりはない。絶対に這い上がる

### release.standard.quiet[]

- `EVENT_LINES_BY_KEY.release.standard.quiet[1]`: ……（深く一礼）
- `EVENT_LINES_BY_KEY.release.standard.quiet[3]`: …お世話になりました

### release.standard.earnest[]

- `EVENT_LINES_BY_KEY.release.standard.earnest[1]`: 応援してくれた皆様に、顔向けできません…でも、次で頑張ります
- `EVENT_LINES_BY_KEY.release.standard.earnest[2]`: ここでの学び、どこに行っても忘れません
- `EVENT_LINES_BY_KEY.release.standard.earnest[3]`: 結果を残せなくて、すみません。必ず、どこかで

### release.standard.emotional[]

- `EVENT_LINES_BY_KEY.release.standard.emotional[1]`: うぅっ…ここでの日々、忘れません…！
- `EVENT_LINES_BY_KEY.release.standard.emotional[2]`: くぅ…ありがとうございました…！ 絶対忘れません…！
- `EVENT_LINES_BY_KEY.release.standard.emotional[3]`: 悔しい…でも、ありがとう…！ 絶対に戻ってくる…！

### release.standard.easygoing[]

- `EVENT_LINES_BY_KEY.release.standard.easygoing[1]`: まぁ、こういう時もあるよね。みんな、元気でね！
- `EVENT_LINES_BY_KEY.release.standard.easygoing[2]`: えへへ、ここでの日々は楽しかったよ。ありがとう
- `EVENT_LINES_BY_KEY.release.standard.easygoing[3]`: 縁がなかったってことだね。まぁ、お元気で〜

### release.standard.shy[]

- `EVENT_LINES_BY_KEY.release.standard.shy[1]`: ご、ごめんなさい…役に立てなくて…
- `EVENT_LINES_BY_KEY.release.standard.shy[2]`: す、すみません…ありがとうございました…
- `EVENT_LINES_BY_KEY.release.standard.shy[3]`: …お、お世話になりました…

### release.ojousama.normal[]

- `EVENT_LINES_BY_KEY.release.ojousama.normal[1]`: お世話になりましたわ。感謝しておりますの
- `EVENT_LINES_BY_KEY.release.ojousama.normal[2]`: この団体での日々、忘れませんわ

### release.ojousama.bold[]

- `EVENT_LINES_BY_KEY.release.ojousama.bold[1]`: 悔しいですが…次の場所で必ず証明いたしますわ
- `EVENT_LINES_BY_KEY.release.ojousama.bold[2]`: これで終わりではありませんわよ

### release.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.release.ojousama.quiet[1]`: …お世話になりましたわ

### release.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.release.ojousama.earnest[1]`: 応援くださった皆様に、申し訳ありませんわ…必ず次で

### release.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.release.ojousama.emotional[1]`: うぅっ…お世話になりましたわ…！ 忘れませんの…！

### release.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.release.ojousama.easygoing[1]`: ふふ、こういうこともありますわね。ごきげんよう

### release.ojousama.shy[]

- `EVENT_LINES_BY_KEY.release.ojousama.shy[1]`: ご、ごめんなさいませ…役に立てず…

### release.polite.normal[]

- `EVENT_LINES_BY_KEY.release.polite.normal[1]`: お世話になりました。本当にありがとうございました
- `EVENT_LINES_BY_KEY.release.polite.normal[2]`: 短い間でしたが、ありがとうございました

### release.polite.bold[]

- `EVENT_LINES_BY_KEY.release.polite.bold[1]`: 悔しいです…次の場所で、必ず証明してみせます
- `EVENT_LINES_BY_KEY.release.polite.bold[2]`: このままでは終わりません。どこかで必ず

### release.polite.quiet[]

- `EVENT_LINES_BY_KEY.release.polite.quiet[1]`: …お世話になりました

### release.polite.earnest[]

- `EVENT_LINES_BY_KEY.release.polite.earnest[1]`: 応援してくださった皆様に、申し訳ありません
- `EVENT_LINES_BY_KEY.release.polite.earnest[2]`: ここでの学び、決して忘れません

### release.polite.emotional[]

- `EVENT_LINES_BY_KEY.release.polite.emotional[1]`: うぅ…っ、ありがとうございました…！ 忘れません…！

### release.polite.easygoing[]

- `EVENT_LINES_BY_KEY.release.polite.easygoing[1]`: あはは、ご縁がなかったですね〜 ありがとうございました

### release.polite.shy[]

- `EVENT_LINES_BY_KEY.release.polite.shy[1]`: ご、ごめんなさい…お、お世話になりました…

### release.delinquent.normal[]

- `EVENT_LINES_BY_KEY.release.delinquent.normal[1]`: そうか…まぁ、縁がなかったってことだろ
- `EVENT_LINES_BY_KEY.release.delinquent.normal[2]`: 世話になったな。どっかで見てろよ

### release.delinquent.bold[]

- `EVENT_LINES_BY_KEY.release.delinquent.bold[1]`: ちくしょう…見とけよ、絶対に戻ってくるからな
- `EVENT_LINES_BY_KEY.release.delinquent.bold[2]`: 悔しいぜ…次の場所でぶっちぎってやる

### release.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.release.delinquent.quiet[1]`: …ちっ…(背を向けて出ていく)

### release.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.release.delinquent.earnest[1]`: 応援してくれた奴らに申し訳ねえ…でも、次で絶対にやってやる

### release.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.release.delinquent.emotional[1]`: ちくしょう…！ うっ…ありがとな…！

### release.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.release.delinquent.easygoing[1]`: まぁ、こんなもんか。元気でやれよ〜

### release.delinquent.shy[]

- `EVENT_LINES_BY_KEY.release.delinquent.shy[1]`: …ご、ごめん…世話になった…

### release.cool.normal[]

- `EVENT_LINES_BY_KEY.release.cool.normal[1]`: ……そうか。お世話になった
- `EVENT_LINES_BY_KEY.release.cool.normal[2]`: ……ここでの経験は、忘れない

### release.cool.bold[]

- `EVENT_LINES_BY_KEY.release.cool.bold[1]`: ……戻ってくる。必ずだ
- `EVENT_LINES_BY_KEY.release.cool.bold[2]`: ……次の場所で、見返してやる

### release.cool.quiet[]

- `EVENT_LINES_BY_KEY.release.cool.quiet[1]`: ……（静かに立ち去る）
- `EVENT_LINES_BY_KEY.release.cool.quiet[2]`: ……ありがとう

### release.cool.earnest[]

- `EVENT_LINES_BY_KEY.release.cool.earnest[1]`: ……応援してくれた者たちに、申し訳ない

### release.cool.emotional[]

- `EVENT_LINES_BY_KEY.release.cool.emotional[1]`: ……っ…ありがとう。忘れない

### release.cool.easygoing[]

- `EVENT_LINES_BY_KEY.release.cool.easygoing[1]`: …まぁ、こんなもんだ。ありがとう

### release.cool.shy[]

- `EVENT_LINES_BY_KEY.release.cool.shy[1]`: ……ご、ごめん…ありがとう

### release.seductive.normal[]

- `EVENT_LINES_BY_KEY.release.seductive.normal[1]`: ここでの思い出、大切にするわ
- `EVENT_LINES_BY_KEY.release.seductive.normal[2]`: お世話になりました。また、どこかで

### release.seductive.bold[]

- `EVENT_LINES_BY_KEY.release.seductive.bold[1]`: 悔しいわ…でも、いつか必ず戻ってくる
- `EVENT_LINES_BY_KEY.release.seductive.bold[2]`: この借り、いつか返しに来るから

### release.seductive.quiet[]

- `EVENT_LINES_BY_KEY.release.seductive.quiet[1]`: …お世話になりました（ふっと目を伏せて）

### release.seductive.earnest[]

- `EVENT_LINES_BY_KEY.release.seductive.earnest[1]`: 応援してくれた人たちに、申し訳ないわ…必ず見返す

### release.seductive.emotional[]

- `EVENT_LINES_BY_KEY.release.seductive.emotional[1]`: …っ…ありがとう…忘れないわ…

### release.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.release.seductive.easygoing[1]`: ふふ、縁がなかったみたいね。お元気で

### release.seductive.shy[]

- `EVENT_LINES_BY_KEY.release.seductive.shy[1]`: …ご、ごめんね…お世話になりました…

### release.composed.normal[]

- `EVENT_LINES_BY_KEY.release.composed.normal[1]`: …そうか。お世話になったね
- `EVENT_LINES_BY_KEY.release.composed.normal[2]`: …短い間だったけど、ありがとう

### release.composed.bold[]

- `EVENT_LINES_BY_KEY.release.composed.bold[1]`: …悔しいね。でも、必ず戻ってくる
- `EVENT_LINES_BY_KEY.release.composed.bold[2]`: …これで終わりじゃない。次で証明する

### release.composed.quiet[]

- `EVENT_LINES_BY_KEY.release.composed.quiet[1]`: …ありがとう。世話になった

### release.composed.earnest[]

- `EVENT_LINES_BY_KEY.release.composed.earnest[1]`: …応援してくれた人たちに、申し訳ない。次で必ず

### release.composed.emotional[]

- `EVENT_LINES_BY_KEY.release.composed.emotional[1]`: …っ…ありがとう。忘れないよ

### release.composed.easygoing[]

- `EVENT_LINES_BY_KEY.release.composed.easygoing[1]`: …ま、縁がなかったってことだね。元気で

### release.composed.shy[]

- `EVENT_LINES_BY_KEY.release.composed.shy[1]`: …す、すみません。お世話になりました

### faSigning.cool.normal[]

- `EVENT_LINES_BY_KEY.faSigning.cool.normal[1]`: …よろしく。力になる
- `EVENT_LINES_BY_KEY.faSigning.cool.normal[2]`: …新しい環境か。悪くない。やる

### faSigning.cool.bold[]

- `EVENT_LINES_BY_KEY.faSigning.cool.bold[1]`: …戦わせてくれ。結果は出す

### faSigning.cool.quiet[]

- `EVENT_LINES_BY_KEY.faSigning.cool.quiet[1]`: …やる。見ていてくれ

### faSigning.cool.shy[]

- `EVENT_LINES_BY_KEY.faSigning.cool.shy[1]`: …よろしく。…頑張る

### faSigning.cool.easygoing[]

- `EVENT_LINES_BY_KEY.faSigning.cool.easygoing[1]`: …新天地か。暴れさせてもらう
- `EVENT_LINES_BY_KEY.faSigning.cool.easygoing[2]`: …ここなら好きにやれそうだ。悪くない

### faSigning.cool.earnest[]

- `EVENT_LINES_BY_KEY.faSigning.cool.earnest[1]`: …感謝する。毎日練習して、期待には応える
- `EVENT_LINES_BY_KEY.faSigning.cool.earnest[2]`: …この恩は忘れない。ここで戦い続ける

### faSigning.cool.emotional[]

- `EVENT_LINES_BY_KEY.faSigning.cool.emotional[1]`: …っ…感謝する。…全力でやる

### faSigning.polite.normal[]

- `EVENT_LINES_BY_KEY.faSigning.polite.normal[1]`: よろしくお願いいたします。お力になれるよう頑張ります
- `EVENT_LINES_BY_KEY.faSigning.polite.normal[2]`: 新しい環境ですね…悪くありません。頑張ります

### faSigning.polite.bold[]

- `EVENT_LINES_BY_KEY.faSigning.polite.bold[1]`: 頂点を獲るために来ました。おわかりですよね
- `EVENT_LINES_BY_KEY.faSigning.polite.bold[2]`: 新しい闘いの場ですね…！燃えてきました

### faSigning.polite.quiet[]

- `EVENT_LINES_BY_KEY.faSigning.polite.quiet[1]`: …お世話になります。精一杯やらせていただきます

### faSigning.polite.shy[]

- `EVENT_LINES_BY_KEY.faSigning.polite.shy[1]`: あ、あの…よろしくお願いいたします…精一杯やります…

### faSigning.polite.easygoing[]

- `EVENT_LINES_BY_KEY.faSigning.polite.easygoing[1]`: やっほー、新天地です！暴れまくりますよ
- `EVENT_LINES_BY_KEY.faSigning.polite.easygoing[2]`: ここなら好き放題やれそうです。楽しみ

### faSigning.polite.earnest[]

- `EVENT_LINES_BY_KEY.faSigning.polite.earnest[1]`: ありがとうございます。期待にお応えいたします

### faSigning.polite.emotional[]

- `EVENT_LINES_BY_KEY.faSigning.polite.emotional[1]`: ありがとうございます…！嬉しいです…！全力で頑張ります…！

### faSigning.standard.normal[]

- `EVENT_LINES_BY_KEY.faSigning.standard.normal[1]`: よろしくお願いします。力になれるよう頑張ります
- `EVENT_LINES_BY_KEY.faSigning.standard.normal[2]`: 新しい環境…悪くないですね。頑張ります

### faSigning.standard.bold[]

- `EVENT_LINES_BY_KEY.faSigning.standard.bold[1]`: てっぺんを獲るために来た。わかってるよな？
- `EVENT_LINES_BY_KEY.faSigning.standard.bold[2]`: 新しい闘いの場…！燃えてきた！

### faSigning.standard.quiet[]

- `EVENT_LINES_BY_KEY.faSigning.standard.quiet[1]`: …よろしくお願いします

### faSigning.standard.shy[]

- `EVENT_LINES_BY_KEY.faSigning.standard.shy[1]`: あ、あの…よろしくお願いします…頑張ります…

### faSigning.standard.easygoing[]

- `EVENT_LINES_BY_KEY.faSigning.standard.easygoing[1]`: やっほー！新天地だ！暴れまくるよ！
- `EVENT_LINES_BY_KEY.faSigning.standard.easygoing[2]`: ここなら好き放題やれそう！楽しみ！

### faSigning.standard.earnest[]

- `EVENT_LINES_BY_KEY.faSigning.standard.earnest[1]`: ありがとうございます…毎日練習して、絶対に期待に応えます！
- `EVENT_LINES_BY_KEY.faSigning.standard.earnest[2]`: この恩は忘れません。ずっとこの団体で戦います

### faSigning.standard.emotional[]

- `EVENT_LINES_BY_KEY.faSigning.standard.emotional[1]`: ありがとうございます…！嬉しい…！全力で頑張ります…！

### faSigning.ojousama.normal[]

- `EVENT_LINES_BY_KEY.faSigning.ojousama.normal[1]`: よろしくお願いいたしますわ。お力になりますの

### faSigning.ojousama.bold[]

- `EVENT_LINES_BY_KEY.faSigning.ojousama.bold[1]`: 頂点を獲るために参りましたわ。ご期待くださいませ

### faSigning.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.faSigning.ojousama.quiet[1]`: …お世話になりますわ

### faSigning.ojousama.shy[]

- `EVENT_LINES_BY_KEY.faSigning.ojousama.shy[1]`: あ、あの…よろしくお願いいたしますわ…頑張りますの…

### faSigning.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.faSigning.ojousama.easygoing[1]`: ごきげんよう。新天地ですわ、暴れさせていただきますの
- `EVENT_LINES_BY_KEY.faSigning.ojousama.easygoing[2]`: ここなら好きにやれそうですわね。楽しみですの

### faSigning.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.faSigning.ojousama.earnest[1]`: ありがとうございますわ。ご期待に応えてみせますの

### faSigning.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.faSigning.ojousama.emotional[1]`: ありがとうございますわ…！嬉しい…！全力で頑張りますの…！

### faSigning.delinquent.normal[]

- `EVENT_LINES_BY_KEY.faSigning.delinquent.normal[1]`: よろしくな。暴れさせてもらうぜ

### faSigning.delinquent.bold[]

- `EVENT_LINES_BY_KEY.faSigning.delinquent.bold[1]`: やってやるぜ！暴れまくるからな！

### faSigning.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.faSigning.delinquent.quiet[1]`: …よろしく、頼む

### faSigning.delinquent.shy[]

- `EVENT_LINES_BY_KEY.faSigning.delinquent.shy[1]`: あ、あの…よろしくっす…頑張るんで…

### faSigning.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.faSigning.delinquent.easygoing[1]`: よっしゃー！新天地だ！暴れるぞ！

### faSigning.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.faSigning.delinquent.earnest[1]`: ありがとう…毎日練習して、絶対に期待に応える
- `EVENT_LINES_BY_KEY.faSigning.delinquent.earnest[2]`: この恩は忘れねえ。ずっとここで戦うから

### faSigning.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.faSigning.delinquent.emotional[1]`: ありがとう…！嬉しい…！全力でやる…！

### faSigning.seductive.normal[]

- `EVENT_LINES_BY_KEY.faSigning.seductive.normal[1]`: よろしくね。力になるわ

### faSigning.seductive.bold[]

- `EVENT_LINES_BY_KEY.faSigning.seductive.bold[1]`: てっぺん獲りに来たの。一緒に頂点に立ちましょう

### faSigning.seductive.quiet[]

- `EVENT_LINES_BY_KEY.faSigning.seductive.quiet[1]`: …よろしく、ね

### faSigning.seductive.shy[]

- `EVENT_LINES_BY_KEY.faSigning.seductive.shy[1]`: あ、あの…よろしく…頑張るから…

### faSigning.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.faSigning.seductive.easygoing[1]`: 新しい場所ね。楽しみだわ。よろしく

### faSigning.seductive.earnest[]

- `EVENT_LINES_BY_KEY.faSigning.seductive.earnest[1]`: ありがとう。期待に応えるわ

### faSigning.seductive.emotional[]

- `EVENT_LINES_BY_KEY.faSigning.seductive.emotional[1]`: ありがとう…っ…嬉しい…。全力で、やるから…

### faSigning.composed.normal[]

- `EVENT_LINES_BY_KEY.faSigning.composed.normal[1]`: …よろしく。力になるよ

### faSigning.composed.bold[]

- `EVENT_LINES_BY_KEY.faSigning.composed.bold[1]`: …てっぺんを獲りに来た。よろしく

### faSigning.composed.quiet[]

- `EVENT_LINES_BY_KEY.faSigning.composed.quiet[1]`: ……よろしく

### faSigning.composed.shy[]

- `EVENT_LINES_BY_KEY.faSigning.composed.shy[1]`: …よろしくね。…頑張るよ

### faSigning.composed.easygoing[]

- `EVENT_LINES_BY_KEY.faSigning.composed.easygoing[1]`: …新天地か。…楽しみだね

### faSigning.composed.earnest[]

- `EVENT_LINES_BY_KEY.faSigning.composed.earnest[1]`: …期待に応えるよ。…コツコツやる

### faSigning.composed.emotional[]

- `EVENT_LINES_BY_KEY.faSigning.composed.emotional[1]`: …っ…ありがとう。全力でやる

### faSigningGeneric[]

- `EVENT_LINES_BY_KEY.faSigningGeneric[1]`: この団体で新しいスタートです。よろしくお願いします！
- `EVENT_LINES_BY_KEY.faSigningGeneric[2]`: 契約ありがとうございます！全力で戦います！
- `EVENT_LINES_BY_KEY.faSigningGeneric[3]`: 新しい仲間ができて嬉しいです。頑張ります！

### faWelcome.cool.normal[]

- `EVENT_LINES_BY_KEY.faWelcome.cool.normal[1]`: …よろしく。やる
- `EVENT_LINES_BY_KEY.faWelcome.cool.normal[2]`: …力になれるよう、精一杯やる

### faWelcome.cool.bold[]

- `EVENT_LINES_BY_KEY.faWelcome.cool.bold[1]`: …見ていろ。格の違いを証明する

### faWelcome.cool.quiet[]

- `EVENT_LINES_BY_KEY.faWelcome.cool.quiet[1]`: …やるべきことをやる

### faWelcome.cool.shy[]

- `EVENT_LINES_BY_KEY.faWelcome.cool.shy[1]`: …よろしく。…精一杯やる

### faWelcome.cool.easygoing[]

- `EVENT_LINES_BY_KEY.faWelcome.cool.easygoing[1]`: …今日から仲間だ。よろしく
- `EVENT_LINES_BY_KEY.faWelcome.cool.easygoing[2]`: …みんなで楽しくやろう

### faWelcome.cool.earnest[]

- `EVENT_LINES_BY_KEY.faWelcome.cool.earnest[1]`: …毎日コツコツやる。見ていてくれ
- `EVENT_LINES_BY_KEY.faWelcome.cool.earnest[2]`: …この団体のために、全てを捧げる

### faWelcome.cool.emotional[]

- `EVENT_LINES_BY_KEY.faWelcome.cool.emotional[1]`: …っ…よろしく。…頑張る

### faWelcome.polite.normal[]

- `EVENT_LINES_BY_KEY.faWelcome.polite.normal[1]`: よろしくお願いいたします。頑張ります
- `EVENT_LINES_BY_KEY.faWelcome.polite.normal[2]`: お力になれるよう、精一杯務めます

### faWelcome.polite.bold[]

- `EVENT_LINES_BY_KEY.faWelcome.polite.bold[1]`: 頂点まで一直線です。邪魔はさせません
- `EVENT_LINES_BY_KEY.faWelcome.polite.bold[2]`: 燃えてきました…！早く試合がしたいです

### faWelcome.polite.quiet[]

- `EVENT_LINES_BY_KEY.faWelcome.polite.quiet[1]`: …精一杯、頑張らせていただきます

### faWelcome.polite.shy[]

- `EVENT_LINES_BY_KEY.faWelcome.polite.shy[1]`: よ、よろしくお願いいたします…が、頑張ります…！

### faWelcome.polite.easygoing[]

- `EVENT_LINES_BY_KEY.faWelcome.polite.easygoing[1]`: わーい、今日から仲間です！よろしくお願いします
- `EVENT_LINES_BY_KEY.faWelcome.polite.easygoing[2]`: みんなで楽しくやりましょう

### faWelcome.polite.earnest[]

- `EVENT_LINES_BY_KEY.faWelcome.polite.earnest[1]`: 毎日精進いたします。見ていてください

### faWelcome.polite.emotional[]

- `EVENT_LINES_BY_KEY.faWelcome.polite.emotional[1]`: 嬉しいです…！よろしくお願いします…！頑張ります…！

### faWelcome.standard.normal[]

- `EVENT_LINES_BY_KEY.faWelcome.standard.normal[1]`: よろしくお願いします。頑張ります
- `EVENT_LINES_BY_KEY.faWelcome.standard.normal[2]`: 力になれるよう、精一杯やります

### faWelcome.standard.bold[]

- `EVENT_LINES_BY_KEY.faWelcome.standard.bold[1]`: 頂点まで一直線だ。邪魔はさせない
- `EVENT_LINES_BY_KEY.faWelcome.standard.bold[2]`: 燃えてきた…！早く試合がしたい！

### faWelcome.standard.quiet[]

- `EVENT_LINES_BY_KEY.faWelcome.standard.quiet[1]`: …よろしくお願いします

### faWelcome.standard.shy[]

- `EVENT_LINES_BY_KEY.faWelcome.standard.shy[1]`: よ、よろしくお願いします…が、頑張ります…！

### faWelcome.standard.easygoing[]

- `EVENT_LINES_BY_KEY.faWelcome.standard.easygoing[1]`: わーい！今日から仲間だ！よろしく！
- `EVENT_LINES_BY_KEY.faWelcome.standard.easygoing[2]`: みんなで楽しくやりましょー！

### faWelcome.standard.earnest[]

- `EVENT_LINES_BY_KEY.faWelcome.standard.earnest[1]`: 毎日コツコツ、頑張ります！見ていてください！
- `EVENT_LINES_BY_KEY.faWelcome.standard.earnest[2]`: この団体のために…全てを捧げます

### faWelcome.standard.emotional[]

- `EVENT_LINES_BY_KEY.faWelcome.standard.emotional[1]`: 嬉しい…！よろしくお願いします…！頑張ります…！

### faWelcome.ojousama.normal[]

- `EVENT_LINES_BY_KEY.faWelcome.ojousama.normal[1]`: よろしくお願いいたしますわ。精一杯務めますの

### faWelcome.ojousama.bold[]

- `EVENT_LINES_BY_KEY.faWelcome.ojousama.bold[1]`: 頂点を目指しますわ。ご期待くださいませ

### faWelcome.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.faWelcome.ojousama.quiet[1]`: …よろしく。お世話になりますわ

### faWelcome.ojousama.shy[]

- `EVENT_LINES_BY_KEY.faWelcome.ojousama.shy[1]`: よ、よろしくお願いいたしますわ…が、頑張りますの…！

### faWelcome.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.faWelcome.ojousama.easygoing[1]`: まあ、今日から仲間ですわね。よろしくお願いしますの
- `EVENT_LINES_BY_KEY.faWelcome.ojousama.easygoing[2]`: 皆様、楽しくやりましょうね

### faWelcome.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.faWelcome.ojousama.earnest[1]`: コツコツ頑張りますわ。見ていてくださいませ

### faWelcome.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.faWelcome.ojousama.emotional[1]`: 嬉しい…！よろしくお願いいたしますわ…！頑張りますの…！

### faWelcome.delinquent.normal[]

- `EVENT_LINES_BY_KEY.faWelcome.delinquent.normal[1]`: よろしくな！ガンガンやるぜ

### faWelcome.delinquent.bold[]

- `EVENT_LINES_BY_KEY.faWelcome.delinquent.bold[1]`: 大暴れするぞー！覚悟しとけ！

### faWelcome.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.faWelcome.delinquent.quiet[1]`: …よろしく。世話になる

### faWelcome.delinquent.shy[]

- `EVENT_LINES_BY_KEY.faWelcome.delinquent.shy[1]`: よ、よろしくっす…が、頑張るんで…！

### faWelcome.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.faWelcome.delinquent.easygoing[1]`: よっしゃー！楽しくやろうぜ！

### faWelcome.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.faWelcome.delinquent.earnest[1]`: 毎日コツコツ頑張る！見ててくれ！
- `EVENT_LINES_BY_KEY.faWelcome.delinquent.earnest[2]`: この団体のために…全部捧げる

### faWelcome.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.faWelcome.delinquent.emotional[1]`: 嬉しい…！よろしく頼む…！頑張るから…！

### faWelcome.seductive.normal[]

- `EVENT_LINES_BY_KEY.faWelcome.seductive.normal[1]`: よろしくね。精一杯やるわ

### faWelcome.seductive.bold[]

- `EVENT_LINES_BY_KEY.faWelcome.seductive.bold[1]`: 頂点まで一直線よ。見ていてね

### faWelcome.seductive.quiet[]

- `EVENT_LINES_BY_KEY.faWelcome.seductive.quiet[1]`: …よろしく。仲良くしましょ

### faWelcome.seductive.shy[]

- `EVENT_LINES_BY_KEY.faWelcome.seductive.shy[1]`: よ、よろしくね…が、頑張るから…

### faWelcome.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.faWelcome.seductive.easygoing[1]`: よろしくね。楽しくやりましょう

### faWelcome.seductive.earnest[]

- `EVENT_LINES_BY_KEY.faWelcome.seductive.earnest[1]`: 毎日頑張るわ。見ていてね

### faWelcome.seductive.emotional[]

- `EVENT_LINES_BY_KEY.faWelcome.seductive.emotional[1]`: 嬉しい…っ…よろしくね…。頑張るから…

### faWelcome.composed.normal[]

- `EVENT_LINES_BY_KEY.faWelcome.composed.normal[1]`: …よろしく。精一杯やるよ

### faWelcome.composed.bold[]

- `EVENT_LINES_BY_KEY.faWelcome.composed.bold[1]`: …頂点まで。…見ていて

### faWelcome.composed.quiet[]

- `EVENT_LINES_BY_KEY.faWelcome.composed.quiet[1]`: ……やるべきことをやる

### faWelcome.composed.shy[]

- `EVENT_LINES_BY_KEY.faWelcome.composed.shy[1]`: …よろしくね。…頑張ってみるよ

### faWelcome.composed.easygoing[]

- `EVENT_LINES_BY_KEY.faWelcome.composed.easygoing[1]`: …よろしくね。楽しくやろう

### faWelcome.composed.earnest[]

- `EVENT_LINES_BY_KEY.faWelcome.composed.earnest[1]`: …コツコツやる。見ていてくれれば

### faWelcome.composed.emotional[]

- `EVENT_LINES_BY_KEY.faWelcome.composed.emotional[1]`: …っ…嬉しい。よろしく

### faWelcomeGeneric[]

- `EVENT_LINES_BY_KEY.faWelcomeGeneric[1]`: よろしくお願いします！頑張ります！
- `EVENT_LINES_BY_KEY.faWelcomeGeneric[2]`: 精一杯やります！応援してください！
- `EVENT_LINES_BY_KEY.faWelcomeGeneric[3]`: 新しい仲間として、全力で頑張ります！

### factionIgniteProvoke.standard[]

- `EVENT_LINES_BY_KEY.factionIgniteProvoke.standard[1]`: ずっと言えなかったことを、リングで言う。逃げないで。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.standard[2]`: 文句があるなら、リングで聞く。それでいい？
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.standard[3]`: 先に手を挙げたのは私。ここから最後まで付き合って。

### factionIgniteProvoke.ojousama[]

- `EVENT_LINES_BY_KEY.factionIgniteProvoke.ojousama[1]`: 言葉を尽くしても届かないなら、あとはリングね。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.ojousama[2]`: この一戦は、わたくしから申し込んだもの。お受けになって。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.ojousama[3]`: 一度では終わらないの。長くお付き合いいただくわ。

### factionIgniteProvoke.cool[]

- `EVENT_LINES_BY_KEY.factionIgniteProvoke.cool[1]`: 話は終わり。あとは、リングで。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.cool[2]`: 先に仕掛けたのは私。異論は、要らない。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.cool[3]`: ……一度で終わるとは思っていない。始めるだけ。

### factionIgniteProvoke.delinquent[]

- `EVENT_LINES_BY_KEY.factionIgniteProvoke.delinquent[1]`: 言い訳はいい。あんたとは、リングで話をつける。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.delinquent[2]`: 売った喧嘩だ。引っ込めるつもりはねえよ。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.delinquent[3]`: 一発で終わると思うなよ。ここからだ。

### factionIgniteProvoke.polite[]

- `EVENT_LINES_BY_KEY.factionIgniteProvoke.polite[1]`: これ以上は、言葉では足りません。お相手願います。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.polite[2]`: 申し込んだのは私です。どうか、逃げないでください。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.polite[3]`: これは始まりです。最後まで、お付き合いいただきます。

### factionIgniteProvoke.composed[]

- `EVENT_LINES_BY_KEY.factionIgniteProvoke.composed[1]`: 穏やかに済ませたかった。でも、もう無理みたいだね。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.composed[2]`: 先に名前を出したのは私だ。責任は取るよ。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.composed[3]`: 一回で終わらせる気はないんだ。長くなるよ。

### factionIgniteProvoke.seductive[]

- `EVENT_LINES_BY_KEY.factionIgniteProvoke.seductive[1]`: 我慢はもうやめたの。あなたと、正面からやるわ。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.seductive[2]`: ふふ、もう断れないでしょう？　私が申し込んだのよ。
- `EVENT_LINES_BY_KEY.factionIgniteProvoke.seductive[3]`: この一戦じゃ終わらないわ。……ゆっくり付き合って。

### factionIgniteRespond.standard[]

- `EVENT_LINES_BY_KEY.factionIgniteRespond.standard[1]`: わかった。売られたなら、買うだけ。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.standard[2]`: そっちが決めたことでしょ。後悔しても遅いよ。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.standard[3]`: 言いたいことは全部、リングで受け取る。

### factionIgniteRespond.ojousama[]

- `EVENT_LINES_BY_KEY.factionIgniteRespond.ojousama[1]`: お受けしますわ。……そちらから来たのですもの。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.ojousama[2]`: 呼ばれて断るような育ち方は、していないの。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.ojousama[3]`: 受けて立ちます。品位まで落とすつもりはないの。

### factionIgniteRespond.cool[]

- `EVENT_LINES_BY_KEY.factionIgniteRespond.cool[1]`: 受ける。それだけ。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.cool[2]`: 先に動いたのはそっち。……付き合う。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.cool[3]`: 後戻りできないのは、そっちも同じ。

### factionIgniteRespond.delinquent[]

- `EVENT_LINES_BY_KEY.factionIgniteRespond.delinquent[1]`: 上等だ。その喧嘩、買うよ。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.delinquent[2]`: 先に手を出したのはそっちだ。もう遅えよ。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.delinquent[3]`: あんたが始めたことだ。落とし前はつける。

### factionIgniteRespond.polite[]

- `EVENT_LINES_BY_KEY.factionIgniteRespond.polite[1]`: 謹んでお受けします。逃げるつもりはありません。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.polite[2]`: そちらから来られたのなら、遠慮はいたしません。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.polite[3]`: 言葉は要りません。リングでお答えします。

### factionIgniteRespond.composed[]

- `EVENT_LINES_BY_KEY.factionIgniteRespond.composed[1]`: そう来るなら、受けるよ。避けはしない。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.composed[2]`: よく決めたね。……その分、こっちも遠慮しないよ。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.composed[3]`: 怒ってはいないんだ。ただ、負けるつもりもない。

### factionIgniteRespond.seductive[]

- `EVENT_LINES_BY_KEY.factionIgniteRespond.seductive[1]`: うれしい。……そんなに私と、やりたかったのね。
- `EVENT_LINES_BY_KEY.factionIgniteRespond.seductive[2]`: いいわ、受けてあげる。後で泣かないでね♪
- `EVENT_LINES_BY_KEY.factionIgniteRespond.seductive[3]`: 仕掛けたのはあなたよ。……その顔、忘れないわ。

### challengeArrival.standard[]

- `EVENT_LINES_BY_KEY.challengeArrival.standard[1]`: 三人で行きます。お宅の三人、隠さず出してください。
- `EVENT_LINES_BY_KEY.challengeArrival.standard[2]`: 私を切った判断が正しかったか、確かめに来ました。
- `EVENT_LINES_BY_KEY.challengeArrival.standard[3]`: 三つとも取ります。それで話は終わりです。

### challengeArrival.ojousama[]

- `EVENT_LINES_BY_KEY.challengeArrival.ojousama[1]`: 三人で参りますわ。お宅の精鋭を、お出しになって。
- `EVENT_LINES_BY_KEY.challengeArrival.ojousama[2]`: わたくしを要らないと決めた方に、お会いしたいの。
- `EVENT_LINES_BY_KEY.challengeArrival.ojousama[3]`: 三つの勝負で、格の違いをお見せいたします。

### challengeArrival.cool[]

- `EVENT_LINES_BY_KEY.challengeArrival.cool[1]`: 三人で行く。そちらも三人、出して。
- `EVENT_LINES_BY_KEY.challengeArrival.cool[2]`: 切られた理由を、まだ聞いていない。……三つで返す。
- `EVENT_LINES_BY_KEY.challengeArrival.cool[3]`: 断ってもいい。逃げたと書かれるだけ。

### challengeArrival.delinquent[]

- `EVENT_LINES_BY_KEY.challengeArrival.delinquent[1]`: 三人で乗り込む。お宅も三人、出しなよ。
- `EVENT_LINES_BY_KEY.challengeArrival.delinquent[2]`: 私を追い出したこと、忘れちゃいねえよ。三人で行く。
- `EVENT_LINES_BY_KEY.challengeArrival.delinquent[3]`: あんたたちの一番強いのを出せばいい。潰すから。

### challengeArrival.polite[]

- `EVENT_LINES_BY_KEY.challengeArrival.polite[1]`: 三人で伺います。断られては、困りますので。
- `EVENT_LINES_BY_KEY.challengeArrival.polite[2]`: 私を手放した判断、間違いだったと申し上げます。
- `EVENT_LINES_BY_KEY.challengeArrival.polite[3]`: お宅の三人を、正面から倒させていただきます。

### challengeArrival.composed[]

- `EVENT_LINES_BY_KEY.challengeArrival.composed[1]`: 三人で行かせてもらうよ。そちらも三人、頼むね。
- `EVENT_LINES_BY_KEY.challengeArrival.composed[2]`: 恨んではいないんだ。ただ、確かめたいことがある。
- `EVENT_LINES_BY_KEY.challengeArrival.composed[3]`: 断る自由はあるよ。それも、答えのうちだ。

### challengeArrival.seductive[]

- `EVENT_LINES_BY_KEY.challengeArrival.seductive[1]`: 三人で伺うわ。お宅の自慢の三人、見せて。
- `EVENT_LINES_BY_KEY.challengeArrival.seductive[2]`: 私を手放したこと、後悔させてあげる。……ふふ。
- `EVENT_LINES_BY_KEY.challengeArrival.seductive[3]`: 三つとも、いただくわ。断る理由、あるかしら？

### rentalGreeting.cool.normal[]

- `EVENT_LINES_BY_KEY.rentalGreeting.cool.normal[1]`: …レンタルだが、手は抜かない。よろしく
- `EVENT_LINES_BY_KEY.rentalGreeting.cool.normal[2]`: …短い間だ。よろしく

### rentalGreeting.cool.bold[]

- `EVENT_LINES_BY_KEY.rentalGreeting.cool.bold[1]`: …手は抜かない。見ていろ

### rentalGreeting.cool.quiet[]

- `EVENT_LINES_BY_KEY.rentalGreeting.cool.quiet[1]`: …やるべきことはやる

### rentalGreeting.cool.shy[]

- `EVENT_LINES_BY_KEY.rentalGreeting.cool.shy[1]`: …短い間だが。…よろしく

### rentalGreeting.cool.easygoing[]

- `EVENT_LINES_BY_KEY.rentalGreeting.cool.easygoing[1]`: …お邪魔する。短い間だが、暴れさせてもらう
- `EVENT_LINES_BY_KEY.rentalGreeting.cool.easygoing[2]`: …一時的だからこそ、思い切りやる

### rentalGreeting.cool.earnest[]

- `EVENT_LINES_BY_KEY.rentalGreeting.cool.earnest[1]`: …短い期間だが、精一杯やる
- `EVENT_LINES_BY_KEY.rentalGreeting.cool.earnest[2]`: …限られた時間でも成長したい。よろしく

### rentalGreeting.cool.emotional[]

- `EVENT_LINES_BY_KEY.rentalGreeting.cool.emotional[1]`: …っ…よろしく。短い間だが、全力で

### rentalGreeting.polite.normal[]

- `EVENT_LINES_BY_KEY.rentalGreeting.polite.normal[1]`: レンタルですが、手は抜きません。よろしくお願いいたします
- `EVENT_LINES_BY_KEY.rentalGreeting.polite.normal[2]`: 短い間ですが、よろしくお願いいたします

### rentalGreeting.polite.bold[]

- `EVENT_LINES_BY_KEY.rentalGreeting.polite.bold[1]`: レンタルだからと侮らないでください。全試合全力です
- `EVENT_LINES_BY_KEY.rentalGreeting.polite.bold[2]`: よその団体でも闘志は変わりません。燃えてきました

### rentalGreeting.polite.quiet[]

- `EVENT_LINES_BY_KEY.rentalGreeting.polite.quiet[1]`: …短い間ですが、精一杯務めさせていただきます

### rentalGreeting.polite.shy[]

- `EVENT_LINES_BY_KEY.rentalGreeting.polite.shy[1]`: あ、あの…短い間ではございますが…よろしくお願いいたします…

### rentalGreeting.polite.easygoing[]

- `EVENT_LINES_BY_KEY.rentalGreeting.polite.easygoing[1]`: おじゃましまーす！短い間ですけど暴れますよ
- `EVENT_LINES_BY_KEY.rentalGreeting.polite.easygoing[2]`: 一時的だからこそ、思い切り好き放題やりますね

### rentalGreeting.polite.earnest[]

- `EVENT_LINES_BY_KEY.rentalGreeting.polite.earnest[1]`: 短い間ですが、精一杯務めさせていただきます

### rentalGreeting.polite.emotional[]

- `EVENT_LINES_BY_KEY.rentalGreeting.polite.emotional[1]`: よろしくお願いします…！短い間ですが…全力で…！

### rentalGreeting.standard.normal[]

- `EVENT_LINES_BY_KEY.rentalGreeting.standard.normal[1]`: レンタルですが、手は抜きませんので。よろしく
- `EVENT_LINES_BY_KEY.rentalGreeting.standard.normal[2]`: 短い間ですがよろしくお願いします

### rentalGreeting.standard.bold[]

- `EVENT_LINES_BY_KEY.rentalGreeting.standard.bold[1]`: レンタルだからって舐めるなよ！全試合全力だ！
- `EVENT_LINES_BY_KEY.rentalGreeting.standard.bold[2]`: よその団体でも闘志は変わらない！燃えるぞ！

### rentalGreeting.standard.quiet[]

- `EVENT_LINES_BY_KEY.rentalGreeting.standard.quiet[1]`: …短い間ですが、よろしくお願いします

### rentalGreeting.standard.shy[]

- `EVENT_LINES_BY_KEY.rentalGreeting.standard.shy[1]`: あ、あの…短い間ですけど…よろしくお願いします…

### rentalGreeting.standard.easygoing[]

- `EVENT_LINES_BY_KEY.rentalGreeting.standard.easygoing[1]`: おじゃましまーす！短い間だけど暴れるよー！
- `EVENT_LINES_BY_KEY.rentalGreeting.standard.easygoing[2]`: 一時的だからこそ思い切り好き放題やるね！

### rentalGreeting.standard.earnest[]

- `EVENT_LINES_BY_KEY.rentalGreeting.standard.earnest[1]`: 短い期間ですが、精一杯やらせていただきます！
- `EVENT_LINES_BY_KEY.rentalGreeting.standard.earnest[2]`: 限られた時間でも成長したい。よろしくお願いします

### rentalGreeting.standard.emotional[]

- `EVENT_LINES_BY_KEY.rentalGreeting.standard.emotional[1]`: よろしくお願いします…！短い間だけど…全力で…！

### rentalGreeting.ojousama.normal[]

- `EVENT_LINES_BY_KEY.rentalGreeting.ojousama.normal[1]`: 短い間ですが、よろしくお願いいたしますわ

### rentalGreeting.ojousama.bold[]

- `EVENT_LINES_BY_KEY.rentalGreeting.ojousama.bold[1]`: レンタルでも手は抜きませんわよ！

### rentalGreeting.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.rentalGreeting.ojousama.quiet[1]`: …短い間ですが、よろしくお願いいたしますわ

### rentalGreeting.ojousama.shy[]

- `EVENT_LINES_BY_KEY.rentalGreeting.ojousama.shy[1]`: あ、あの…短い間ですけれど…よろしくお願いいたしますわ…

### rentalGreeting.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.rentalGreeting.ojousama.easygoing[1]`: お邪魔いたしますわ。短い間ですけれど、暴れさせていただきますの
- `EVENT_LINES_BY_KEY.rentalGreeting.ojousama.easygoing[2]`: 一時のご縁ですもの、思い切りやらせていただきますわ

### rentalGreeting.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.rentalGreeting.ojousama.earnest[1]`: 短い間ですが、精一杯お務めいたしますわ

### rentalGreeting.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.rentalGreeting.ojousama.emotional[1]`: よろしくお願いいたしますわ…！短い間ですけれど…全力で…！

### rentalGreeting.delinquent.normal[]

- `EVENT_LINES_BY_KEY.rentalGreeting.delinquent.normal[1]`: よろしくな。手は抜かねーから

### rentalGreeting.delinquent.bold[]

- `EVENT_LINES_BY_KEY.rentalGreeting.delinquent.bold[1]`: レンタル？ 関係ねえ！暴れるぞ！

### rentalGreeting.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.rentalGreeting.delinquent.quiet[1]`: …短い間だけど、よろしく頼む

### rentalGreeting.delinquent.shy[]

- `EVENT_LINES_BY_KEY.rentalGreeting.delinquent.shy[1]`: あ、あの…短い間っすけど…よろしくお願いします…

### rentalGreeting.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.rentalGreeting.delinquent.easygoing[1]`: おじゃまー！暴れさせてもらうぜ！

### rentalGreeting.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.rentalGreeting.delinquent.earnest[1]`: 短い期間だけど、精一杯やらせてもらう！
- `EVENT_LINES_BY_KEY.rentalGreeting.delinquent.earnest[2]`: 限られた時間でも成長してえ。よろしく頼む

### rentalGreeting.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.rentalGreeting.delinquent.emotional[1]`: よろしく頼む…！短い間だけど…全力でやる…！

### rentalGreeting.seductive.normal[]

- `EVENT_LINES_BY_KEY.rentalGreeting.seductive.normal[1]`: 短い間だけど、よろしくね

### rentalGreeting.seductive.bold[]

- `EVENT_LINES_BY_KEY.rentalGreeting.seductive.bold[1]`: レンタルでも全力よ。見ていてね

### rentalGreeting.seductive.quiet[]

- `EVENT_LINES_BY_KEY.rentalGreeting.seductive.quiet[1]`: …短い間だけど、よろしくね

### rentalGreeting.seductive.shy[]

- `EVENT_LINES_BY_KEY.rentalGreeting.seductive.shy[1]`: あ、あの…短い間だけど…よろしく、ね…

### rentalGreeting.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.rentalGreeting.seductive.easygoing[1]`: お邪魔するわね。短い間だけど楽しみましょう

### rentalGreeting.seductive.earnest[]

- `EVENT_LINES_BY_KEY.rentalGreeting.seductive.earnest[1]`: 短い間だけど、精一杯やるわ

### rentalGreeting.seductive.emotional[]

- `EVENT_LINES_BY_KEY.rentalGreeting.seductive.emotional[1]`: よろしくね…っ…短い間だけど…全力で、やるから…

### rentalGreeting.composed.normal[]

- `EVENT_LINES_BY_KEY.rentalGreeting.composed.normal[1]`: …短い間だけど、手は抜かないよ

### rentalGreeting.composed.bold[]

- `EVENT_LINES_BY_KEY.rentalGreeting.composed.bold[1]`: …レンタルでも全力。当然だね

### rentalGreeting.composed.quiet[]

- `EVENT_LINES_BY_KEY.rentalGreeting.composed.quiet[1]`: ……短い間だけど、よろしく

### rentalGreeting.composed.shy[]

- `EVENT_LINES_BY_KEY.rentalGreeting.composed.shy[1]`: …短い間だけど…よろしくね。頑張るよ

### rentalGreeting.composed.easygoing[]

- `EVENT_LINES_BY_KEY.rentalGreeting.composed.easygoing[1]`: …おじゃまします。楽しくやろう

### rentalGreeting.composed.earnest[]

- `EVENT_LINES_BY_KEY.rentalGreeting.composed.earnest[1]`: …短い間でも精一杯やる。よろしく

### rentalGreeting.composed.emotional[]

- `EVENT_LINES_BY_KEY.rentalGreeting.composed.emotional[1]`: …っ…短い間だけど、全力で

### rentalGreetingGeneric[]

- `EVENT_LINES_BY_KEY.rentalGreetingGeneric[1]`: 短い間ですが、よろしくお願いします！
- `EVENT_LINES_BY_KEY.rentalGreetingGeneric[2]`: お邪魔します。力になれたら嬉しいです！
- `EVENT_LINES_BY_KEY.rentalGreetingGeneric[3]`: レンタルでも全力です。よろしくお願いします！

### heatSelf.fresh.standard.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.standard.normal[1]`: 今日は体が軽い。なんでもできそうな気がする

### heatSelf.fresh.standard.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.standard.bold[1]`: 体が動きたがってる。もっとやらせてくれない?

### heatSelf.fresh.standard.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.standard.easygoing[1]`: なんか今日、体が軽いんだよねー。いけるいける

### heatSelf.fresh.standard.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.standard.earnest[1]`: 体が素直に動きます。やった分だけ返ってきます

### heatSelf.fresh.standard.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.standard.emotional[1]`: 体が軽い…！今ならなんでもできる気がする…！

### heatSelf.fresh.standard.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.standard.quiet[1]`: …体が、軽いです。…今日は、いけます

### heatSelf.fresh.standard.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.standard.shy[1]`: な、なんだか今日、体が軽くて…！やれそうです…！

### heatSelf.fresh.cool.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.cool.normal[1]`: …調子はいい。今なら、何をやっても身につく

### heatSelf.fresh.cool.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.cool.bold[1]`: …万全だ。遠慮はいらない。もっと来て

### heatSelf.fresh.cool.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.cool.earnest[1]`: …体が応えてくれる。…今のうちに色々試したい

### heatSelf.fresh.cool.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.cool.quiet[1]`: …体は軽い。…今日は、かなり…やれる

### heatSelf.fresh.polite.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.polite.normal[1]`: 体が軽いんです。今なら、いくらでもやれます

### heatSelf.fresh.polite.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.polite.earnest[1]`: 今日は身体が素直に動きます。学んだ分だけ、身につきます

### heatSelf.fresh.polite.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.polite.shy[1]`: あ、あの…今日は体が軽くて…もっと、やれます…！

### heatSelf.fresh.composed.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.composed.normal[1]`: …体は軽いね。こういう日は、伸びるんだよ

### heatSelf.fresh.composed.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.composed.earnest[1]`: …今日はなんだか感覚が良い。こういう日を、無駄にしたくない

### heatSelf.fresh.composed.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.composed.emotional[1]`: …体は軽い。…こういう日は、黙って積むよ

### heatSelf.fresh.composed.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.composed.quiet[1]`: ……体が軽い。…こういう日は、大事にしたいね

### heatSelf.fresh.delinquent.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.delinquent.bold[1]`: 力が余ってる感じだ。もっと来い、まだまだ行ける！

### heatSelf.fresh.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.delinquent.easygoing[1]`: お、今日は体が軽ぃな。もう一本いこうぜ

### heatSelf.fresh.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.delinquent.emotional[1]`: 体が軽ぃ…!今日はいくらでもやれるぞ…!

### heatSelf.fresh.ojousama.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.ojousama.bold[1]`: 今日は調子がいいの。手加減は無用ですわね

### heatSelf.fresh.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.ojousama.emotional[1]`: 体が軽くて…!うずうずしてしまいます…!

### heatSelf.fresh.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.seductive.easygoing[1]`: 今日の体、いい感じ。…もっと動きたい気分なの

### heatSelf.fresh.seductive.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.fresh.seductive.shy[1]`: 今日は…体が軽いの。…もう少し、やってみたいな

### heatSelf.warm.standard.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.standard.normal[1]`: 同じだけやってるのに、手応えが薄い気がする

### heatSelf.warm.standard.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.standard.bold[1]`: まだやれる。…切れが鈍った? 気のせいだって

### heatSelf.warm.standard.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.standard.easygoing[1]`: んー、なんか乗り切らないなー。動けてはいるけど

### heatSelf.warm.standard.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.standard.earnest[1]`: 同じだけやってるのに、身についてる感じがしません

### heatSelf.warm.standard.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.standard.emotional[1]`: あれ…なんか入ってこない…！？もっとやれるはずなのに

### heatSelf.warm.standard.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.standard.quiet[1]`: …同じことを、しているのに。…返るものが、少ない

### heatSelf.warm.standard.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.standard.shy[1]`: あの…同じようにやってるはずなんですけど…なんだか…

### heatSelf.warm.cool.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.cool.normal[1]`: …昨日と同じ動きだ。…なのに、入りが浅い

### heatSelf.warm.cool.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.cool.bold[1]`: …問題ない。…動きが半歩遅いだけだ

### heatSelf.warm.cool.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.cool.earnest[1]`: …数はこなした。…だが、残った気がしない

### heatSelf.warm.cool.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.cool.quiet[1]`: …動けている。…ただ、深さがない

### heatSelf.warm.polite.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.polite.normal[1]`: 動けてはいます。ただ、手応えが少し薄くて

### heatSelf.warm.polite.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.polite.earnest[1]`: 回数はこなせています。ただ、残る実感が薄くて

### heatSelf.warm.polite.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.polite.shy[1]`: あの…できてはいるんです。ただ、残らなくて…

### heatSelf.warm.composed.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.composed.normal[1]`: …悪くはないよ。…ただ、切れが一つ落ちたかな

### heatSelf.warm.composed.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.composed.earnest[1]`: …積めてはいる。…厚みが出ないのが引っかかるね

### heatSelf.warm.composed.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.composed.emotional[1]`: …おかしいな。…同じことをして、同じに戻らない

### heatSelf.warm.composed.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.composed.quiet[1]`: ……手応えが、少し遠いかな。…気のせいだといいけど

### heatSelf.warm.delinquent.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.delinquent.bold[1]`: まだいけるって。…ちょい鈍ってるだけだ、これは

### heatSelf.warm.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.delinquent.easygoing[1]`: なんか今日、乗んねーな。ま、動けてるからいっか

### heatSelf.warm.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.delinquent.emotional[1]`: なんだこれ…体が乗らねぇ…!ちくしょう、なんでだ

### heatSelf.warm.ojousama.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.ojousama.bold[1]`: まだ動けます。…少し、体が言うことを聞きませんが

### heatSelf.warm.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.ojousama.emotional[1]`: あら…?思ったように動けません…どうしてなの…!

### heatSelf.warm.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.seductive.easygoing[1]`: 今日はちょっと乗らないの。…なんでかしらね

### heatSelf.warm.seductive.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.warm.seductive.shy[1]`: …なんだか、届かないの。…わたし、鈍ってるのかな

### heatSelf.heavy.standard.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.standard.normal[1]`: 体が重い。動いてはいるけど、何も残らないな

### heatSelf.heavy.standard.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.standard.bold[1]`: 重い。…でも止まらない。止まったら負けた気がする

### heatSelf.heavy.standard.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.standard.easygoing[1]`: あー、体が重い。今日は何やっても身にならないねー

### heatSelf.heavy.standard.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.standard.earnest[1]`: 動きが同じところで止まる。私の集中が足りないのかな

### heatSelf.heavy.standard.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.standard.emotional[1]`: 体が重い…！やる気はあるのに、体がついてこない…！

### heatSelf.heavy.standard.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.standard.quiet[1]`: …体が、重いです。…今日は、たぶん、残りません

### heatSelf.heavy.standard.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.standard.shy[1]`: あ、あの…体が重いです…今日は、身になってない気がして…

### heatSelf.heavy.cool.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.cool.normal[1]`: …体が重い。今日は、何をやっても素通りだ

### heatSelf.heavy.cool.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.cool.bold[1]`: …鉛みたいだ。…だが、止まるとは言っていない

### heatSelf.heavy.cool.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.cool.earnest[1]`: …体が重い。…こなしただけで、何も残らなかった

### heatSelf.heavy.cool.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.cool.quiet[1]`: …重い。…やっても、抜けていくだけだ

### heatSelf.heavy.polite.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.polite.normal[1]`: 正直、体が重いです。汗をかいた実感しかなくて

### heatSelf.heavy.polite.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.polite.earnest[1]`: 同じ量をこなしても、何も積み上がりません。情けないです

### heatSelf.heavy.polite.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.polite.shy[1]`: すみません…動けてはいるんですけど…空回りしてしまって

### heatSelf.heavy.composed.normal[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.composed.normal[1]`: …体が重いね。今日やっても、たぶん流れるだけ

### heatSelf.heavy.composed.earnest[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.composed.earnest[1]`: …今日は流れるだけだね。…私の頑張り方が雑なのかな

### heatSelf.heavy.composed.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.composed.emotional[1]`: …体が重い。…今日は、腹が立つほど何も入らない

### heatSelf.heavy.composed.quiet[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.composed.quiet[1]`: ……体が重い。…今日はやっても、こぼれるだけだね

### heatSelf.heavy.delinquent.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.delinquent.bold[1]`: 重ぇ。…けど休まねぇ。休むって言葉が嫌ぇなんだよ

### heatSelf.heavy.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.delinquent.easygoing[1]`: 体がだりぃわ。今日やっても、ザルに水だろ

### heatSelf.heavy.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.delinquent.emotional[1]`: くそっ…体が石みてぇだ…!やってんのに進まねぇ…!

### heatSelf.heavy.ojousama.bold[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.ojousama.bold[1]`: 体は重いですけれど。…認めるつもりはありません

### heatSelf.heavy.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.ojousama.emotional[1]`: 体が重くて…!やっても、やっても、進みません…!

### heatSelf.heavy.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.seductive.easygoing[1]`: 体が重いの。…今日は、やるだけ損な気がするわ

### heatSelf.heavy.seductive.shy[]

- `EVENT_LINES_BY_KEY.heatSelf.heavy.seductive.shy[1]`: …体が重いの。…今日は、なぞってるだけみたい

### heatCoach.fresh[]

- `EVENT_LINES_BY_KEY.heatCoach.fresh[1]`: {name}、今日はよく動いてる。仕込むなら今だ
- `EVENT_LINES_BY_KEY.heatCoach.fresh[2]`: {name}の体が、新しい動きを素直に飲み込んでいる
- `EVENT_LINES_BY_KEY.heatCoach.fresh[3]`: 今の{name}なら、多少きつくしても全部持っていく
- `EVENT_LINES_BY_KEY.heatCoach.fresh[4]`: {name}の足が軽い。こういう週こそ厚く積ませたい
- `EVENT_LINES_BY_KEY.heatCoach.fresh[5]`: {name}、伸びる顔をしている。今日の一本は残るぞ
- `EVENT_LINES_BY_KEY.heatCoach.fresh[6]`: {name}は休み明けの体だ。一番よく入る時期に来ている
- `EVENT_LINES_BY_KEY.heatCoach.fresh[7]`: {name}、今週は当たり週だ。使うなら、ここで使え

### heatCoach.warm[]

- `EVENT_LINES_BY_KEY.heatCoach.warm[1]`: {name}、悪くはない。ただ、先週ほどは入っていかない
- `EVENT_LINES_BY_KEY.heatCoach.warm[2]`: {name}の伸びが少し鈍ってきた。詰めすぎたか
- `EVENT_LINES_BY_KEY.heatCoach.warm[3]`: {name}、同じメニューなのに返りが薄い。そろそろ一息か
- `EVENT_LINES_BY_KEY.heatCoach.warm[4]`: {name}、動けてはいる。だが、切れがひとつ落ちている
- `EVENT_LINES_BY_KEY.heatCoach.warm[5]`: {name}の体が慣れてきた。効きが落ちる頃合いだ
- `EVENT_LINES_BY_KEY.heatCoach.warm[6]`: {name}、今週も同じ調子で行くなら、得は薄いぞ
- `EVENT_LINES_BY_KEY.heatCoach.warm[7]`: {name}にきついのを続けるか。…見極めどきだな

### heatCoach.heavy[]

- `EVENT_LINES_BY_KEY.heatCoach.heavy[1]`: {name}、今日は体が重い。何をやらせても素通りだ
- `EVENT_LINES_BY_KEY.heatCoach.heavy[2]`: 今の{name}に課しても、削るだけで何も積まれない
- `EVENT_LINES_BY_KEY.heatCoach.heavy[3]`: {name}は追い込みすぎだ。一度、外してやってくれ
- `EVENT_LINES_BY_KEY.heatCoach.heavy[4]`: {name}、汗はかいている。だが、身についてはいない
- `EVENT_LINES_BY_KEY.heatCoach.heavy[5]`: {name}の体はもう受け付けていない。休ませれば戻る
- `EVENT_LINES_BY_KEY.heatCoach.heavy[6]`: 今の{name}にやらせるのは、怪我を買うようなものだ
- `EVENT_LINES_BY_KEY.heatCoach.heavy[7]`: {name}、一週抜けばまた入るようになる。それだけの話だ

### scoutGreeting.standard.normal[]

- `EVENT_LINES_BY_KEY.scoutGreeting.standard.normal[1]`: 声をかけてくれた目を信じて、頑張ってみるね
- `EVENT_LINES_BY_KEY.scoutGreeting.standard.normal[2]`: まさか自分に声がかかるとはね。よろしく
- `EVENT_LINES_BY_KEY.scoutGreeting.standard.normal[3]`: 期待されてるうちに、いいとこ見せないとね

### scoutGreeting.standard.bold[]

- `EVENT_LINES_BY_KEY.scoutGreeting.standard.bold[1]`: 見る目あるじゃん。すぐ活躍してみせるよ
- `EVENT_LINES_BY_KEY.scoutGreeting.standard.bold[2]`: 買われた実力、値段以上だったって言わせてみせるよ

### scoutGreeting.standard.quiet[]

- `EVENT_LINES_BY_KEY.scoutGreeting.standard.quiet[1]`: …見ていてくれた人が、いたんですね
- `EVENT_LINES_BY_KEY.scoutGreeting.standard.quiet[2]`: …がんばります。…それだけ、です

### scoutGreeting.standard.shy[]

- `EVENT_LINES_BY_KEY.scoutGreeting.standard.shy[1]`: わ、わたしなんかに声をかけてくれて…！が、頑張ります！
- `EVENT_LINES_BY_KEY.scoutGreeting.standard.shy[2]`: き、期待外れって言われないように…します…！

### scoutGreeting.standard.easygoing[]

- `EVENT_LINES_BY_KEY.scoutGreeting.standard.easygoing[1]`: よく見つけたねー。掘り出し物だよ、私
- `EVENT_LINES_BY_KEY.scoutGreeting.standard.easygoing[2]`: ちょうど暴れる場所探してたんだ。よろしくね

### scoutGreeting.standard.earnest[]

- `EVENT_LINES_BY_KEY.scoutGreeting.standard.earnest[1]`: 見ていてくれた人がいた。それだけで頑張れます
- `EVENT_LINES_BY_KEY.scoutGreeting.standard.earnest[2]`: 期待してもらった分、毎日積み上げていきます

### scoutGreeting.standard.emotional[]

- `EVENT_LINES_BY_KEY.scoutGreeting.standard.emotional[1]`: 声をかけてもらえた…！嬉しくて、もう燃えてきた…！
- `EVENT_LINES_BY_KEY.scoutGreeting.standard.emotional[2]`: 誰かが見ててくれた…！それだけで、こんなに熱い…！

### scoutGreeting.cool.normal[]

- `EVENT_LINES_BY_KEY.scoutGreeting.cool.normal[1]`: …話は受けた。あとは試合で
- `EVENT_LINES_BY_KEY.scoutGreeting.cool.normal[2]`: …期待は、悪くない

### scoutGreeting.cool.bold[]

- `EVENT_LINES_BY_KEY.scoutGreeting.cool.bold[1]`: …値踏みは済んだんでしょ。なら、見てて

### scoutGreeting.cool.quiet[]

- `EVENT_LINES_BY_KEY.scoutGreeting.cool.quiet[1]`: …期待には、応える

### scoutGreeting.cool.shy[]

- `EVENT_LINES_BY_KEY.scoutGreeting.cool.shy[1]`: …選ばれた。…がっかりは、させない

### scoutGreeting.cool.easygoing[]

- `EVENT_LINES_BY_KEY.scoutGreeting.cool.easygoing[1]`: …いいタイミングだった。まあ、よろしく

### scoutGreeting.cool.earnest[]

- `EVENT_LINES_BY_KEY.scoutGreeting.cool.earnest[1]`: …評価は、練習と結果で返します

### scoutGreeting.cool.emotional[]

- `EVENT_LINES_BY_KEY.scoutGreeting.cool.emotional[1]`: …っ…悪くない気分だ。…やってやる

### scoutGreeting.polite.normal[]

- `EVENT_LINES_BY_KEY.scoutGreeting.polite.normal[1]`: お声がけありがとうございます。精一杯やります

### scoutGreeting.polite.bold[]

- `EVENT_LINES_BY_KEY.scoutGreeting.polite.bold[1]`: 見込まれた以上、結果は出します。必ず

### scoutGreeting.polite.quiet[]

- `EVENT_LINES_BY_KEY.scoutGreeting.polite.quiet[1]`: …お声がけ、ありがとうございます。…やります

### scoutGreeting.polite.shy[]

- `EVENT_LINES_BY_KEY.scoutGreeting.polite.shy[1]`: あ、あの…お声がけ、光栄です…！

### scoutGreeting.polite.easygoing[]

- `EVENT_LINES_BY_KEY.scoutGreeting.polite.easygoing[1]`: 声をかけてくださって嬉しいです！　思いきり暴れますね！

### scoutGreeting.polite.earnest[]

- `EVENT_LINES_BY_KEY.scoutGreeting.polite.earnest[1]`: お声がけに恥じないよう、努めます

### scoutGreeting.polite.emotional[]

- `EVENT_LINES_BY_KEY.scoutGreeting.polite.emotional[1]`: 見つけてくださって…！必ず応えてみせます！

### scoutGreeting.ojousama.normal[]

- `EVENT_LINES_BY_KEY.scoutGreeting.ojousama.normal[1]`: 見つけていただいたからには、お応えするわ。……期待を裏切るつもりはないもの

### scoutGreeting.ojousama.bold[]

- `EVENT_LINES_BY_KEY.scoutGreeting.ojousama.bold[1]`: あら、お目が高いわね。わたくしに気づくなんて

### scoutGreeting.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.scoutGreeting.ojousama.quiet[1]`: …見つけてくださって。…光栄です

### scoutGreeting.ojousama.shy[]

- `EVENT_LINES_BY_KEY.scoutGreeting.ojousama.shy[1]`: あ、あの…見つけていただけるなんて…！

### scoutGreeting.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.scoutGreeting.ojousama.easygoing[1]`: うふふ♪見出されるって、とても気分がよいことですね

### scoutGreeting.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.scoutGreeting.ojousama.earnest[1]`: 見込んでいただいた期待、一つずつ形にしてまいります

### scoutGreeting.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.scoutGreeting.ojousama.emotional[1]`: 見出されるって、こんなに胸が高鳴るものなのね…！

### scoutGreeting.delinquent.normal[]

- `EVENT_LINES_BY_KEY.scoutGreeting.delinquent.normal[1]`: よく見つけたな。損はさせねーよ

### scoutGreeting.delinquent.bold[]

- `EVENT_LINES_BY_KEY.scoutGreeting.delinquent.bold[1]`: あんたが見つけた私が当たりかどうか。見てなよ。

### scoutGreeting.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.scoutGreeting.delinquent.quiet[1]`: …目、つけてくれたんだろ。…応えるよ

### scoutGreeting.delinquent.shy[]

- `EVENT_LINES_BY_KEY.scoutGreeting.delinquent.shy[1]`: え、えっと…あたしでいいの…？や、やるけど…！

### scoutGreeting.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.scoutGreeting.delinquent.easygoing[1]`: スカウトってのも、けっこう悪い気しねーな。やる気出てきたっ！

### scoutGreeting.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.scoutGreeting.delinquent.earnest[1]`: 見つけてくれてありがとな。死ぬ気でやる

### scoutGreeting.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.scoutGreeting.delinquent.emotional[1]`: ふん！まぁ、アンタの目が正しいのは、証明してやるよ

### scoutGreeting.seductive.normal[]

- `EVENT_LINES_BY_KEY.scoutGreeting.seductive.normal[1]`: 目をつけたのはそっち。…責任、取ってね

### scoutGreeting.seductive.bold[]

- `EVENT_LINES_BY_KEY.scoutGreeting.seductive.bold[1]`: 私に声をかけた責任は、取ってちょうだいね

### scoutGreeting.seductive.quiet[]

- `EVENT_LINES_BY_KEY.scoutGreeting.seductive.quiet[1]`: ……見つかっちゃった。…ふふ

### scoutGreeting.seductive.shy[]

- `EVENT_LINES_BY_KEY.scoutGreeting.seductive.shy[1]`: み、見つかっちゃった…えへへ…

### scoutGreeting.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.scoutGreeting.seductive.easygoing[1]`: ふうん、私に目をつけたんだ。…お目が高いね

### scoutGreeting.seductive.earnest[]

- `EVENT_LINES_BY_KEY.scoutGreeting.seductive.earnest[1]`: 評価してくれたのね。…ちゃんと応えるわ

### scoutGreeting.seductive.emotional[]

- `EVENT_LINES_BY_KEY.scoutGreeting.seductive.emotional[1]`: うふふ♪嬉しい♪

### scoutGreeting.composed.normal[]

- `EVENT_LINES_BY_KEY.scoutGreeting.composed.normal[1]`: …見込まれたなら、応えるだけだよ

### scoutGreeting.composed.bold[]

- `EVENT_LINES_BY_KEY.scoutGreeting.composed.bold[1]`: …目は確かみたいだね。まぁ…頑張るよ

### scoutGreeting.composed.quiet[]

- `EVENT_LINES_BY_KEY.scoutGreeting.composed.quiet[1]`: ……声がかかった。…なら、やるよ

### scoutGreeting.composed.shy[]

- `EVENT_LINES_BY_KEY.scoutGreeting.composed.shy[1]`: …声、かけてくれたんだね。…うれしいよ

### scoutGreeting.composed.easygoing[]

- `EVENT_LINES_BY_KEY.scoutGreeting.composed.easygoing[1]`: …見つけてくれたんだ。じゃ、応えようか

### scoutGreeting.composed.earnest[]

- `EVENT_LINES_BY_KEY.scoutGreeting.composed.earnest[1]`: …見込んでくれたんなら、その目を証明していこうか

### scoutGreeting.composed.emotional[]

- `EVENT_LINES_BY_KEY.scoutGreeting.composed.emotional[1]`: …っ…選んでくれたんなら。…応えるつもりだよ

### scoutGreetingGeneric[]

- `EVENT_LINES_BY_KEY.scoutGreetingGeneric[1]`: 声をかけてもらえて嬉しいです。頑張ります！
- `EVENT_LINES_BY_KEY.scoutGreetingGeneric[2]`: 期待に応えられるよう、全力でやります！
- `EVENT_LINES_BY_KEY.scoutGreetingGeneric[3]`: ここで腕を磨かせてもらいます。よろしくお願いします！

### faGreeting.standard.normal[]

- `EVENT_LINES_BY_KEY.faGreeting.standard.normal[1]`: 所属が決まるって、やっぱり落ち着くね
- `EVENT_LINES_BY_KEY.faGreeting.standard.normal[2]`: また声がかかって嬉しいよ。今度は長くいたいね
- `EVENT_LINES_BY_KEY.faGreeting.standard.normal[3]`: フリーも気楽だったけど、やっぱりリングが一番だね

### faGreeting.standard.bold[]

- `EVENT_LINES_BY_KEY.faGreeting.standard.bold[1]`: フリーのままで終わる女じゃないって、証明する
- `EVENT_LINES_BY_KEY.faGreeting.standard.bold[2]`: 払ってくれた分は、全部利子つけて返してやる

### faGreeting.standard.quiet[]

- `EVENT_LINES_BY_KEY.faGreeting.standard.quiet[1]`: …もう一度、リングに立てるんですね
- `EVENT_LINES_BY_KEY.faGreeting.standard.quiet[2]`: …声がかかって、よかったです

### faGreeting.standard.shy[]

- `EVENT_LINES_BY_KEY.faGreeting.standard.shy[1]`: わ、わたしとまた契約してくれる人がいるなんて…！
- `EVENT_LINES_BY_KEY.faGreeting.standard.shy[2]`: こ、今度こそ…長く居られるように、頑張ります…！

### faGreeting.standard.easygoing[]

- `EVENT_LINES_BY_KEY.faGreeting.standard.easygoing[1]`: フリーも気楽だったけどねー。ここらで腰を据えるか
- `EVENT_LINES_BY_KEY.faGreeting.standard.easygoing[2]`: しばらく声かかんなくてさー。呼んでくれて嬉しいよ

### faGreeting.standard.earnest[]

- `EVENT_LINES_BY_KEY.faGreeting.standard.earnest[1]`: もう一度チャンスをもらえた。無駄にしません
- `EVENT_LINES_BY_KEY.faGreeting.standard.earnest[2]`: 声をかけてくれた恩には、積み上げた練習で応えます

### faGreeting.standard.emotional[]

- `EVENT_LINES_BY_KEY.faGreeting.standard.emotional[1]`: また契約できた…！この嬉しさ、試合で爆発させる…！
- `EVENT_LINES_BY_KEY.faGreeting.standard.emotional[2]`: 呼んでくれた…！ この恩、絶対に返す…！

### faGreeting.cool.normal[]

- `EVENT_LINES_BY_KEY.faGreeting.cool.normal[1]`: …契約は契約。きっちり働く

### faGreeting.cool.bold[]

- `EVENT_LINES_BY_KEY.faGreeting.cool.bold[1]`: …私を放り出した連中に、後悔させてみせる

### faGreeting.cool.quiet[]

- `EVENT_LINES_BY_KEY.faGreeting.cool.quiet[1]`: ……ここでやる。……結果で返す

### faGreeting.cool.shy[]

- `EVENT_LINES_BY_KEY.faGreeting.cool.shy[1]`: …次が決まった。…ほっとしてる

### faGreeting.cool.easygoing[]

- `EVENT_LINES_BY_KEY.faGreeting.cool.easygoing[1]`: …フリー生活も飽きた頃だ。ちょうどいい

### faGreeting.cool.earnest[]

- `EVENT_LINES_BY_KEY.faGreeting.cool.earnest[1]`: …もらった機会だ。…無駄にはしない

### faGreeting.cool.emotional[]

- `EVENT_LINES_BY_KEY.faGreeting.cool.emotional[1]`: …っ…まだやれるってことだ。…見てろ

### faGreeting.polite.normal[]

- `EVENT_LINES_BY_KEY.faGreeting.polite.normal[1]`: 声をかけてもらえて嬉しいな。…そのぶんは試合で返すね

### faGreeting.polite.bold[]

- `EVENT_LINES_BY_KEY.faGreeting.polite.bold[1]`: 私を要らないと言った人たちに、見せつけてやります

### faGreeting.polite.quiet[]

- `EVENT_LINES_BY_KEY.faGreeting.polite.quiet[1]`: …お世話になります。…精一杯やります

### faGreeting.polite.shy[]

- `EVENT_LINES_BY_KEY.faGreeting.polite.shy[1]`: あ、あの…契約してもらえて…感謝しています…！

### faGreeting.polite.easygoing[]

- `EVENT_LINES_BY_KEY.faGreeting.polite.easygoing[1]`: フリー生活は今日で卒業です！　ここから楽しくなりそう！

### faGreeting.polite.earnest[]

- `EVENT_LINES_BY_KEY.faGreeting.polite.earnest[1]`: いただいた契約の重み、忘れずにやります

### faGreeting.polite.emotional[]

- `EVENT_LINES_BY_KEY.faGreeting.polite.emotional[1]`: 所属を失っていた私に…！ありがとうございます…！

### faGreeting.ojousama.normal[]

- `EVENT_LINES_BY_KEY.faGreeting.ojousama.normal[1]`: 声をかけていただいたこと、感謝しています。……ここで、また一から積み上げていくわね

### faGreeting.ojousama.bold[]

- `EVENT_LINES_BY_KEY.faGreeting.ojousama.bold[1]`: 良い機会をいただいたわ。私を見誤った方々に、答えを見せるとしましょう

### faGreeting.ojousama.quiet[]

- `EVENT_LINES_BY_KEY.faGreeting.ojousama.quiet[1]`: ……置いてくださるのですね。ありがとうございます

### faGreeting.ojousama.shy[]

- `EVENT_LINES_BY_KEY.faGreeting.ojousama.shy[1]`: あ、あの…どこにも所属していない身でしたのに…！

### faGreeting.ojousama.easygoing[]

- `EVENT_LINES_BY_KEY.faGreeting.ojousama.easygoing[1]`: 巡り巡って、良い場所にご縁がありましたこと

### faGreeting.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.faGreeting.ojousama.earnest[1]`: 頂いた機会、決して粗末にいたしません

### faGreeting.ojousama.emotional[]

- `EVENT_LINES_BY_KEY.faGreeting.ojousama.emotional[1]`: また声をかけていただけるなんて…！嬉しい…！

### faGreeting.delinquent.normal[]

- `EVENT_LINES_BY_KEY.faGreeting.delinquent.normal[1]`: 拾われた借りは、リングで返す。それだけだ

### faGreeting.delinquent.bold[]

- `EVENT_LINES_BY_KEY.faGreeting.delinquent.bold[1]`: 干されてた女がどこまで行くか、見てろよ

### faGreeting.delinquent.quiet[]

- `EVENT_LINES_BY_KEY.faGreeting.delinquent.quiet[1]`: …拾ってくれた借りは、でかいな

### faGreeting.delinquent.shy[]

- `EVENT_LINES_BY_KEY.faGreeting.delinquent.shy[1]`: あ、あの…あたしみたいなのでも…いいんすか…？

### faGreeting.delinquent.easygoing[]

- `EVENT_LINES_BY_KEY.faGreeting.delinquent.easygoing[1]`: フリーもそろそろ飽きたんでな。世話になるぜ

### faGreeting.delinquent.earnest[]

- `EVENT_LINES_BY_KEY.faGreeting.delinquent.earnest[1]`: 拾ってもらった以上、腐った真似はしねえ

### faGreeting.delinquent.emotional[]

- `EVENT_LINES_BY_KEY.faGreeting.delinquent.emotional[1]`: 拾ってくれんのか…！泣けてきたぜ…！

### faGreeting.seductive.normal[]

- `EVENT_LINES_BY_KEY.faGreeting.seductive.normal[1]`: わざわざ口説きに来るなんて。…物好きね、あなた。

### faGreeting.seductive.bold[]

- `EVENT_LINES_BY_KEY.faGreeting.seductive.bold[1]`: 拾った目利きは正解よ。…すぐに分かるわ

### faGreeting.seductive.quiet[]

- `EVENT_LINES_BY_KEY.faGreeting.seductive.quiet[1]`: ……ここが新しい場所ね。……ええ、悪くない……。

### faGreeting.seductive.shy[]

- `EVENT_LINES_BY_KEY.faGreeting.seductive.shy[1]`: …もう、独りで待たなくていいのね…よかった…

### faGreeting.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.faGreeting.seductive.easygoing[1]`: あら、悪くない話じゃない♪　…ええ、お世話になるわね

### faGreeting.seductive.earnest[]

- `EVENT_LINES_BY_KEY.faGreeting.seductive.earnest[1]`: 声をかけてくれた人は久しぶりなの。…このチャンス、大事にするわ

### faGreeting.seductive.emotional[]

- `EVENT_LINES_BY_KEY.faGreeting.seductive.emotional[1]`: 口説かれる側になるなんて…っ…ふふ、いい度胸ね

### faGreeting.composed.normal[]

- `EVENT_LINES_BY_KEY.faGreeting.composed.normal[1]`: …また名前を呼ばれる場所ができた。悪くないよ

### faGreeting.composed.bold[]

- `EVENT_LINES_BY_KEY.faGreeting.composed.bold[1]`: …空白は、結果で埋める。それだけだよ

### faGreeting.composed.quiet[]

- `EVENT_LINES_BY_KEY.faGreeting.composed.quiet[1]`: ……帰る場所ができた。助かるよ

### faGreeting.composed.shy[]

- `EVENT_LINES_BY_KEY.faGreeting.composed.shy[1]`: …また居場所ができたんだね。…嬉しい

### faGreeting.composed.easygoing[]

- `EVENT_LINES_BY_KEY.faGreeting.composed.easygoing[1]`: …フリーはここまでにするよ。落ち着くとこだ

### faGreeting.composed.earnest[]

- `EVENT_LINES_BY_KEY.faGreeting.composed.earnest[1]`: …二度目はもうない。…だから丁寧にやる

### faGreeting.composed.emotional[]

- `EVENT_LINES_BY_KEY.faGreeting.composed.emotional[1]`: …っ…まだ終わってなかった。…やるよ

### faGreetingGeneric[]

- `EVENT_LINES_BY_KEY.faGreetingGeneric[1]`: もう一度リングに立てます。無駄にしません！
- `EVENT_LINES_BY_KEY.faGreetingGeneric[2]`: 拾っていただいた恩、必ず返します！
- `EVENT_LINES_BY_KEY.faGreetingGeneric[3]`: 所属を失っていました。ここで、やり直します！

### bitterPrematch.ahead.standard.normal[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.normal[1]`: 終わったはずなのに、まだ胃の底が重い
- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.normal[2]`: もう一度勝てば消えるのかな。……多分、消えない

### bitterPrematch.ahead.standard.bold[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.bold[1]`: 勝った側が、いつまで覚えてなきゃいけないの
- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.bold[2]`: 終わらせたのは私。付き合ってやるのは、これで最後

### bitterPrematch.ahead.standard.quiet[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.quiet[1]`: ………（終わったはずの相手を、じっと見ている）

### bitterPrematch.ahead.standard.shy[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.shy[1]`: …もう終わったのに…どうして、また気になるんだろう…

### bitterPrematch.ahead.standard.easygoing[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.easygoing[1]`: はぁ……また？ もう終わった話でしょ、これ
- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.easygoing[2]`: 勝っても軽くならないもんだね。……不思議

### bitterPrematch.ahead.standard.earnest[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.earnest[1]`: 決着はつきました。……私の中だけ、まだです
- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.earnest[2]`: 勝った人間が引きずるのは、変な話ですね

### bitterPrematch.ahead.standard.emotional[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.standard.emotional[1]`: 終わったって言ったのに……！ なんで、まだいるの

### bitterPrematch.ahead.cool.normal[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.cool.normal[1]`: ……済んだ話だ。まだ気にする方がどうかしてる

### bitterPrematch.ahead.cool.quiet[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.cool.quiet[1]`: ……終わった。それだけだ。……それだけのはずだ

### bitterPrematch.ahead.delinquent.normal[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.delinquent.normal[1]`: 片付いた話を蒸し返すな。……いい加減、疲れるんだよ

### bitterPrematch.ahead.delinquent.bold[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.delinquent.bold[1]`: もう決着はついてんだよ。何度潰されりゃ気が済む

### bitterPrematch.ahead.composed.normal[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.composed.normal[1]`: …決着はついてる。…なのに、まだ喉に引っかかってる

### bitterPrematch.ahead.composed.bold[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.composed.bold[1]`: …片付いた相手だよ。…なのに、まだ目で追ってる

### bitterPrematch.ahead.composed.quiet[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.composed.quiet[1]`: ……もう済んだ。…なのに、目が探してしまう

### bitterPrematch.ahead.composed.easygoing[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.composed.easygoing[1]`: …また同じ顔か。…終わったって言ったんだけどな

### bitterPrematch.ahead.composed.earnest[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.composed.earnest[1]`: …終わった件だよ。…片付けきれてないのは、私の方か

### bitterPrematch.ahead.composed.emotional[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.composed.emotional[1]`: …勝ったのに、まだ腹が煮えてる。…笑えないな

### bitterPrematch.ahead.ojousama.bold[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.ojousama.bold[1]`: 倒した相手と同じ列に並ばされる屈辱、分かるかしらね？

### bitterPrematch.ahead.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.ojousama.earnest[1]`: 下ろしたはずの荷を、また持たされているみたいですわね

### bitterPrematch.ahead.polite.quiet[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.polite.quiet[1]`: …もう済んだはず、なんです。…なのに、まだ

### bitterPrematch.ahead.polite.shy[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.polite.shy[1]`: 勝たせて…いただきました。…なのに、怖いままです…

### bitterPrematch.ahead.polite.earnest[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.polite.earnest[1]`: 済んだことにしたいのです。……できないだけで

### bitterPrematch.ahead.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.seductive.easygoing[1]`: 片がついた相手なのにね。…目に入るとイラつくわ

### bitterPrematch.ahead.seductive.emotional[]

- `EVENT_LINES_BY_KEY.bitterPrematch.ahead.seductive.emotional[1]`: 済んだ話よ……っ……なのに、まだ手が震えるの

### bitterPrematch.behind.standard.normal[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.normal[1]`: 終わったことにされた。私だけ、置いていかれたまま
- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.normal[2]`: 忘れられたら楽だったのに。……よく覚えてるんだ、これが

### bitterPrematch.behind.standard.bold[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.bold[1]`: 終わりってことにされてる。でも私はまだ認めない
- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.bold[2]`: もう格付けは済んでいるのかも。それでも・・・

### bitterPrematch.behind.standard.quiet[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.quiet[1]`: ………（あの日の敗北の瞬間が、まだ耳から抜けない）

### bitterPrematch.behind.standard.shy[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.shy[1]`: …あの日敗北した屈辱を…まだ、毎晩思い出すんです…

### bitterPrematch.behind.standard.easygoing[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.easygoing[1]`: みんな綺麗に忘れてるね。……私は忘れないけど
- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.easygoing[2]`: いつまでやるんだろうね、これ。……やめられないけど

### bitterPrematch.behind.standard.earnest[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.earnest[1]`: あの負けを、まだ一度も納得できていません
- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.earnest[2]`: 終わったと言われるたび、足元が抜けるんです

### bitterPrematch.behind.standard.emotional[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.standard.emotional[1]`: 終わってない……！ 勝手に終わらせないで……！

### bitterPrematch.behind.cool.normal[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.cool.normal[1]`: ……決着はついた。納得したとは、言ってない

### bitterPrematch.behind.cool.quiet[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.cool.quiet[1]`: ……終わっていない。……私の中では

### bitterPrematch.behind.delinquent.normal[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.delinquent.normal[1]`: 終わった扱いされんのが、一番腹立つんだよ

### bitterPrematch.behind.delinquent.bold[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.delinquent.bold[1]`: あの日から一度も、まともに寝てねえんだよ

### bitterPrematch.behind.composed.normal[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.composed.normal[1]`: …片がついたらしいよ。…誰の中で、って話だけど

### bitterPrematch.behind.composed.bold[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.composed.bold[1]`: …終わった話らしいね。…じゃあ、この重さは何なんだろう

### bitterPrematch.behind.composed.quiet[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.composed.quiet[1]`: ……もう昔の話だ。…そう言えたら、楽だったな

### bitterPrematch.behind.composed.easygoing[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.composed.easygoing[1]`: …忘れたふりが下手でさ。…まだ引きずってるよ

### bitterPrematch.behind.composed.earnest[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.composed.earnest[1]`: …終わったって言われてる。…受け取れてないだけだよ

### bitterPrematch.behind.composed.emotional[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.composed.emotional[1]`: …勝手に幕を下ろさないで。…まだ、こっちに残ってる

### bitterPrematch.behind.ojousama.bold[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.ojousama.bold[1]`: 幕を引かれた側の気持ちは、誰も聞きませんのね

### bitterPrematch.behind.ojousama.earnest[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.ojousama.earnest[1]`: 終わったことにされた分は、まだお返ししていませんの

### bitterPrematch.behind.polite.quiet[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.polite.quiet[1]`: …終わったと、皆さんは仰います。…私は違います

### bitterPrematch.behind.polite.shy[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.polite.shy[1]`: …もう終わったって…言われました。…言われただけです…

### bitterPrematch.behind.polite.earnest[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.polite.earnest[1]`: 決着は……ついておりません。私の中では、まだ

### bitterPrematch.behind.seductive.easygoing[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.seductive.easygoing[1]`: 終わったって聞いたわ。…誰が決めたのかしらね

### bitterPrematch.behind.seductive.emotional[]

- `EVENT_LINES_BY_KEY.bitterPrematch.behind.seductive.emotional[1]`: 終わったの……？ ……嘘よ。まだ、疼いてる
