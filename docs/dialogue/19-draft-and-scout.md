# ドラフト・スカウト

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `Engine.draftNegotiation.NARRATION`

- 出典: `src/draft-negotiation.js`
- コード内コメント: §7.4 ナレーション
- 本数: 40

### fighting.org_s[]

- `Engine.draftNegotiation.NARRATION.fighting.org_s[1]`: {ORG}、引く気配なし
- `Engine.draftNegotiation.NARRATION.fighting.org_s[2]`: {ORG}、王者の貫禄で粘る
- `Engine.draftNegotiation.NARRATION.fighting.org_s[3]`: {ORG}、余裕の表情を崩さない
- `Engine.draftNegotiation.NARRATION.fighting.org_s[4]`: {ORG}、資金力を背景にじわじわ圧をかける

### fighting.org_a[]

- `Engine.draftNegotiation.NARRATION.fighting.org_a[1]`: {ORG}、ヒートアップ
- `Engine.draftNegotiation.NARRATION.fighting.org_a[2]`: {ORG}、勝負に出た
- `Engine.draftNegotiation.NARRATION.fighting.org_a[3]`: {ORG}、若い情熱で食い下がる
- `Engine.draftNegotiation.NARRATION.fighting.org_a[4]`: {ORG}、ここで引いたら育成計画が崩れる

### fighting.org_b[]

- `Engine.draftNegotiation.NARRATION.fighting.org_b[1]`: {ORG}、まさかの執念
- `Engine.draftNegotiation.NARRATION.fighting.org_b[2]`: {ORG}、地方の意地を見せる
- `Engine.draftNegotiation.NARRATION.fighting.org_b[3]`: {ORG}、小さな団体の大きな賭け
- `Engine.draftNegotiation.NARRATION.fighting.org_b[4]`: {ORG}、身の丈を超えた挑戦

### dropped.org_s[]

- `Engine.draftNegotiation.NARRATION.dropped.org_s[1]`: {ORG}、ここで撤退。王者にも見切り時はある
- `Engine.draftNegotiation.NARRATION.dropped.org_s[2]`: {ORG}、苦渋の判断で離脱。次の獲物を見据えるか
- `Engine.draftNegotiation.NARRATION.dropped.org_s[3]`: {ORG}、静かに席を立った。その背中に敗北の影はない

### dropped.org_a[]

- `Engine.draftNegotiation.NARRATION.dropped.org_a[1]`: {ORG}、無念の撤退
- `Engine.draftNegotiation.NARRATION.dropped.org_a[2]`: {ORG}、ここは引くしかなかった。拳を握りしめている
- `Engine.draftNegotiation.NARRATION.dropped.org_a[3]`: {ORG}、予算の限界。悔しさを滲ませて離脱

### dropped.org_b[]

- `Engine.draftNegotiation.NARRATION.dropped.org_b[1]`: {ORG}、現実的な判断で離脱
- `Engine.draftNegotiation.NARRATION.dropped.org_b[2]`: {ORG}、深追いせず撤退。堅実経営の信条を貫く
- `Engine.draftNegotiation.NARRATION.dropped.org_b[3]`: {ORG}、これ以上は無理と判断。潔い引き際

### playerWin.solo[]

- `Engine.draftNegotiation.NARRATION.playerWin.solo[1]`: 契約成立。静かに迎え入れる
- `Engine.draftNegotiation.NARRATION.playerWin.solo[2]`: 他に名乗りを上げる者はなかった。交渉成立

### playerWin.vs1[]

- `Engine.draftNegotiation.NARRATION.playerWin.vs1[1]`: 一騎打ちを制した
- `Engine.draftNegotiation.NARRATION.playerWin.vs1[2]`: 激しい交渉を勝ち抜いた
- `Engine.draftNegotiation.NARRATION.playerWin.vs1[3]`: 粘り強い交渉が実を結んだ

### playerWin.multi[]

- `Engine.draftNegotiation.NARRATION.playerWin.multi[1]`: 複数団体との争奪戦を勝ち抜いた！
- `Engine.draftNegotiation.NARRATION.playerWin.multi[2]`: 激戦の末、獲得に成功！
- `Engine.draftNegotiation.NARRATION.playerWin.multi[3]`: 3団体を退けての獲得。この選手にかけた執念が勝った

### playerLost[]

- `Engine.draftNegotiation.NARRATION.playerLost[1]`: 他団体に持っていかれた。次の機会を待とう
- `Engine.draftNegotiation.NARRATION.playerLost[2]`: 残念…他団体の執念が上回った
- `Engine.draftNegotiation.NARRATION.playerLost[3]`: 相手の本気度が一枚上手だった。縁がなかったと割り切るしかない

### flowThrough[]

- `Engine.draftNegotiation.NARRATION.flowThrough[1]`: 全団体が手を引いた。この選手はフリー市場へ
- `Engine.draftNegotiation.NARRATION.flowThrough[2]`: 誰も最後まで残らなかった。フリーエージェントとして再出発

### roundStart[]

- `Engine.draftNegotiation.NARRATION.roundStart[1]`: 交渉卓に緊張が走る
- `Engine.draftNegotiation.NARRATION.roundStart[2]`: 各団体の代表が表情を引き締める
- `Engine.draftNegotiation.NARRATION.roundStart[3]`: 金額が上がるごとに空気が重くなる
- `Engine.draftNegotiation.NARRATION.roundStart[4]`: 交渉は佳境を迎えている
- `Engine.draftNegotiation.NARRATION.roundStart[5]`: 静かな駆け引きが続く
- `Engine.draftNegotiation.NARRATION.roundStart[6]`: 次の一手が勝敗を分ける

## `Engine.scout.TIERS`

- 出典: `src/management.js`
- コード内コメント: Tier thresholds for assessedValue calculation
- 本数: 5

### [].label

- `Engine.scout.TIERS[1].label`: 超逸材
- `Engine.scout.TIERS[2].label`: 逸材
- `Engine.scout.TIERS[3].label`: 有望
- `Engine.scout.TIERS[4].label`: 原石
- `Engine.scout.TIERS[5].label`: 素材

## `Engine.draft.EVAL_TIERS`

- 出典: `src/management.js`
- コード内コメント: Coach evaluation tiers (potOVR distribution: 85-164, most 115-160)
- 本数: 6

### [].text

- `Engine.draft.EVAL_TIERS[1].text`: 将来のエース候補
- `Engine.draft.EVAL_TIERS[2].text`: 逸材の匂いがする
- `Engine.draft.EVAL_TIERS[3].text`: かなりの素質あり
- `Engine.draft.EVAL_TIERS[4].text`: 十分な伸びしろ
- `Engine.draft.EVAL_TIERS[5].text`: 堅実に育つタイプ
- `Engine.draft.EVAL_TIERS[6].text`: 未知数

## `SCOUT_GREETING_LINES`

- 出典: `src/data.js`
- 本数: 58

### standard.normal[]

- `SCOUT_GREETING_LINES.standard.normal[1]`: 声をかけてくれた目を信じて、頑張ってみるね
- `SCOUT_GREETING_LINES.standard.normal[2]`: まさか自分に声がかかるとはね。よろしく
- `SCOUT_GREETING_LINES.standard.normal[3]`: 期待されてるうちに、いいとこ見せないとね

### standard.bold[]

- `SCOUT_GREETING_LINES.standard.bold[1]`: 見る目あるじゃん。すぐ活躍してみせるよ
- `SCOUT_GREETING_LINES.standard.bold[2]`: 買われた実力、値段以上だったって言わせてみせるよ

### standard.quiet[]

- `SCOUT_GREETING_LINES.standard.quiet[1]`: …見ていてくれた人が、いたんですね
- `SCOUT_GREETING_LINES.standard.quiet[2]`: …がんばります。…それだけ、です

### standard.shy[]

- `SCOUT_GREETING_LINES.standard.shy[1]`: わ、わたしなんかに声をかけてくれて…！が、頑張ります！
- `SCOUT_GREETING_LINES.standard.shy[2]`: き、期待外れって言われないように…します…！

### standard.easygoing[]

- `SCOUT_GREETING_LINES.standard.easygoing[1]`: よく見つけたねー。掘り出し物だよ、あたし
- `SCOUT_GREETING_LINES.standard.easygoing[2]`: ちょうど暴れる場所探してたんだ。よろしくね

### standard.earnest[]

- `SCOUT_GREETING_LINES.standard.earnest[1]`: 見ていてくれた人がいた。それだけで頑張れます
- `SCOUT_GREETING_LINES.standard.earnest[2]`: 期待してもらった分、毎日積み上げていきます

### standard.emotional[]

- `SCOUT_GREETING_LINES.standard.emotional[1]`: 声をかけてもらえた…！嬉しくて、もう燃えてきた…！
- `SCOUT_GREETING_LINES.standard.emotional[2]`: 誰かが見ててくれた…！それだけで、こんなに熱い…！

### cool.normal[]

- `SCOUT_GREETING_LINES.cool.normal[1]`: …話は受けた。あとは試合で
- `SCOUT_GREETING_LINES.cool.normal[2]`: …期待は、悪くない

### cool.bold[]

- `SCOUT_GREETING_LINES.cool.bold[1]`: …値踏みは済んだんでしょ。なら、見てて

### cool.quiet[]

- `SCOUT_GREETING_LINES.cool.quiet[1]`: …期待には、応える

### cool.shy[]

- `SCOUT_GREETING_LINES.cool.shy[1]`: …選ばれた。…がっかりは、させない

### cool.easygoing[]

- `SCOUT_GREETING_LINES.cool.easygoing[1]`: …いいタイミングだった。まあ、よろしく

### cool.earnest[]

- `SCOUT_GREETING_LINES.cool.earnest[1]`: …評価は、練習と結果で返します

### cool.emotional[]

- `SCOUT_GREETING_LINES.cool.emotional[1]`: …っ…悪くない気分だ。…やってやる

### polite.normal[]

- `SCOUT_GREETING_LINES.polite.normal[1]`: お声がけありがとうございます。精一杯やります

### polite.bold[]

- `SCOUT_GREETING_LINES.polite.bold[1]`: 見込まれた以上、結果は出します。必ず

### polite.quiet[]

- `SCOUT_GREETING_LINES.polite.quiet[1]`: …お声がけ、ありがとうございます。…やります

### polite.shy[]

- `SCOUT_GREETING_LINES.polite.shy[1]`: あ、あの…お声がけ、光栄です…！

### polite.easygoing[]

- `SCOUT_GREETING_LINES.polite.easygoing[1]`: 見つけてくださって助かりました！暴れますね

### polite.earnest[]

- `SCOUT_GREETING_LINES.polite.earnest[1]`: お声がけに恥じないよう、努めます

### polite.emotional[]

- `SCOUT_GREETING_LINES.polite.emotional[1]`: 見つけてくださって…！必ず応えてみせます！

### ojousama.normal[]

- `SCOUT_GREETING_LINES.ojousama.normal[1]`: わたくしを見つけたご慧眼、称えて差し上げます

### ojousama.bold[]

- `SCOUT_GREETING_LINES.ojousama.bold[1]`: あら、お目が高いわね。わたくしに気づくなんて

### ojousama.quiet[]

- `SCOUT_GREETING_LINES.ojousama.quiet[1]`: …見つけてくださって。…光栄です

### ojousama.shy[]

- `SCOUT_GREETING_LINES.ojousama.shy[1]`: あ、あの…見つけていただけるなんて…！

### ojousama.easygoing[]

- `SCOUT_GREETING_LINES.ojousama.easygoing[1]`: うふふ♪見出されるって、とても気分がよいことですね

### ojousama.earnest[]

- `SCOUT_GREETING_LINES.ojousama.earnest[1]`: 見込んでいただいた期待、一つずつ形にしてまいります

### ojousama.emotional[]

- `SCOUT_GREETING_LINES.ojousama.emotional[1]`: 見出されるって、こんなに胸が高鳴るものなのね…！

### delinquent.normal[]

- `SCOUT_GREETING_LINES.delinquent.normal[1]`: よく見つけたな。損はさせねーよ

### delinquent.bold[]

- `SCOUT_GREETING_LINES.delinquent.bold[1]`: あんたが見つけた私が当たりかどうか。見てなよ。

### delinquent.quiet[]

- `SCOUT_GREETING_LINES.delinquent.quiet[1]`: …目、つけてくれたんだろ。…応えるよ

### delinquent.shy[]

- `SCOUT_GREETING_LINES.delinquent.shy[1]`: え、えっと…あたしでいいの…？や、やるけど…！

### delinquent.easygoing[]

- `SCOUT_GREETING_LINES.delinquent.easygoing[1]`: スカウトってのも、けっこう悪い気しねーな。やる気出てきたっ！

### delinquent.earnest[]

- `SCOUT_GREETING_LINES.delinquent.earnest[1]`: 見つけてくれてありがとな。死ぬ気でやる

### delinquent.emotional[]

- `SCOUT_GREETING_LINES.delinquent.emotional[1]`: ふん！まぁ、アンタの目が正しいのは、証明してやるよ

### seductive.normal[]

- `SCOUT_GREETING_LINES.seductive.normal[1]`: 目をつけたのはそっち。…責任、取ってね

### seductive.bold[]

- `SCOUT_GREETING_LINES.seductive.bold[1]`: わたしに声をかけた責任は、取ってちょうだいね

### seductive.quiet[]

- `SCOUT_GREETING_LINES.seductive.quiet[1]`: ……見つかっちゃった。…ふふ

### seductive.shy[]

- `SCOUT_GREETING_LINES.seductive.shy[1]`: み、見つかっちゃった…えへへ…

### seductive.easygoing[]

- `SCOUT_GREETING_LINES.seductive.easygoing[1]`: ふうん、あたしに目をつけたんだ。…お目が高いね

### seductive.earnest[]

- `SCOUT_GREETING_LINES.seductive.earnest[1]`: 評価してくれたのね。…ちゃんと応えるわ

### seductive.emotional[]

- `SCOUT_GREETING_LINES.seductive.emotional[1]`: うふふ♪嬉しい♪

### composed.normal[]

- `SCOUT_GREETING_LINES.composed.normal[1]`: …見込まれたなら、応えるだけだよ

### composed.bold[]

- `SCOUT_GREETING_LINES.composed.bold[1]`: …目は確かみたいだね。まぁ…頑張るよ

### composed.quiet[]

- `SCOUT_GREETING_LINES.composed.quiet[1]`: ……声がかかった。…なら、やるよ

### composed.shy[]

- `SCOUT_GREETING_LINES.composed.shy[1]`: …声、かけてくれたんだね。…うれしいよ

### composed.easygoing[]

- `SCOUT_GREETING_LINES.composed.easygoing[1]`: …見つけてくれたんだ。じゃ、応えようか

### composed.earnest[]

- `SCOUT_GREETING_LINES.composed.earnest[1]`: …見込んでくれたんなら、その目を証明していこうか

### composed.emotional[]

- `SCOUT_GREETING_LINES.composed.emotional[1]`: …っ…選んでくれたんなら。…応えるつもりだよ

## `SCOUT_GREETING_GENERIC_LINES`

- 出典: `src/data.js`
- 本数: 3

- `SCOUT_GREETING_GENERIC_LINES[1]`: 声をかけてもらえて嬉しいです。頑張ります！
- `SCOUT_GREETING_GENERIC_LINES[2]`: 期待に応えられるよう、全力でやります！
- `SCOUT_GREETING_GENERIC_LINES[3]`: ここで腕を磨かせてもらいます。よろしくお願いします！

## `FA_GREETING_LINES`

- 出典: `src/data.js`
- 本数: 57

### standard.normal[]

- `FA_GREETING_LINES.standard.normal[1]`: 所属が決まるって、やっぱり落ち着くね
- `FA_GREETING_LINES.standard.normal[2]`: また声がかかって嬉しいよ。今度は長くいたいね
- `FA_GREETING_LINES.standard.normal[3]`: フリーも気楽だったけど、やっぱりリングが一番だね

### standard.bold[]

- `FA_GREETING_LINES.standard.bold[1]`: フリーのままで終わる女じゃないって、証明する
- `FA_GREETING_LINES.standard.bold[2]`: 払ってくれた分は、全部利子つけて返してやる

### standard.quiet[]

- `FA_GREETING_LINES.standard.quiet[1]`: …もう一度、リングに立てるんですね
- `FA_GREETING_LINES.standard.quiet[2]`: …声がかかって、よかったです

### standard.shy[]

- `FA_GREETING_LINES.standard.shy[1]`: わ、わたしとまた契約してくれる人がいるなんて…！
- `FA_GREETING_LINES.standard.shy[2]`: こ、今度こそ…長く居られるように、頑張ります…！

### standard.easygoing[]

- `FA_GREETING_LINES.standard.easygoing[1]`: フリーも気楽だったけどねー。ここらで腰を据えるか
- `FA_GREETING_LINES.standard.easygoing[2]`: 声かかんなくてさー。拾ってくれて助かったよ

### standard.earnest[]

- `FA_GREETING_LINES.standard.earnest[1]`: もう一度チャンスをもらえた。無駄にしません
- `FA_GREETING_LINES.standard.earnest[2]`: 拾ってくれた恩は、練習の量でお返しします

### standard.emotional[]

- `FA_GREETING_LINES.standard.emotional[1]`: また契約できた…！この嬉しさ、試合で爆発させる…！
- `FA_GREETING_LINES.standard.emotional[2]`: 拾ってくれた…！この恩、絶対に返す…！

### cool.normal[]

- `FA_GREETING_LINES.cool.normal[1]`: …契約は契約。きっちり働く

### cool.bold[]

- `FA_GREETING_LINES.cool.bold[1]`: …私を放り出した連中に、後悔させてみせる

### cool.quiet[]

- `FA_GREETING_LINES.cool.quiet[1]`: …拾われた。…なら、恩を返す

### cool.shy[]

- `FA_GREETING_LINES.cool.shy[1]`: …次が決まった。…ほっとしてる

### cool.easygoing[]

- `FA_GREETING_LINES.cool.easygoing[1]`: …フリー生活も飽きた頃だ。ちょうどいい

### cool.earnest[]

- `FA_GREETING_LINES.cool.earnest[1]`: …もらった機会だ。…無駄にはしない

### cool.emotional[]

- `FA_GREETING_LINES.cool.emotional[1]`: …っ…まだやれるってことだ。…見てろ

### polite.normal[]

- `FA_GREETING_LINES.polite.normal[1]`: 拾っていただいた御恩は、試合でお返しします

### polite.bold[]

- `FA_GREETING_LINES.polite.bold[1]`: 私を要らないと言った人たちに、見せつけてやります

### polite.quiet[]

- `FA_GREETING_LINES.polite.quiet[1]`: …お世話になります。…精一杯やります

### polite.shy[]

- `FA_GREETING_LINES.polite.shy[1]`: あ、あの…契約してもらえて…感謝しています…！

### polite.easygoing[]

- `FA_GREETING_LINES.polite.easygoing[1]`: フリー生活、今日で終わりです！助かりました

### polite.earnest[]

- `FA_GREETING_LINES.polite.earnest[1]`: いただいた契約の重み、忘れずにやります

### polite.emotional[]

- `FA_GREETING_LINES.polite.emotional[1]`: 所属を失っていた私に…！ありがとうございます…！

### ojousama.normal[]

- `FA_GREETING_LINES.ojousama.normal[1]`: 行くあての無いわたくしを招いてくださって。恩は必ずお返しします

### ojousama.bold[]

- `FA_GREETING_LINES.ojousama.bold[1]`: チャンスをありがとう。私を侮ったあいつらに、ほえ面かかせてやりますわ

### ojousama.quiet[]

- `FA_GREETING_LINES.ojousama.quiet[1]`: ……置いてくださるのですね。ありがとうございます

### ojousama.shy[]

- `FA_GREETING_LINES.ojousama.shy[1]`: あ、あの…どこにも所属していない身でしたのに…！

### ojousama.easygoing[]

- `FA_GREETING_LINES.ojousama.easygoing[1]`: 巡り巡って、良い場所にご縁がありましたこと

### ojousama.earnest[]

- `FA_GREETING_LINES.ojousama.earnest[1]`: 頂いた機会、決して粗末にいたしません

### ojousama.emotional[]

- `FA_GREETING_LINES.ojousama.emotional[1]`: また声をかけていただけるなんて…！嬉しい…！

### delinquent.normal[]

- `FA_GREETING_LINES.delinquent.normal[1]`: 拾われた借りは、リングで返す。それだけだ

### delinquent.bold[]

- `FA_GREETING_LINES.delinquent.bold[1]`: 干されてた女がどこまで行くか、見てろよ

### delinquent.quiet[]

- `FA_GREETING_LINES.delinquent.quiet[1]`: …拾ってくれた借りは、でかいな

### delinquent.shy[]

- `FA_GREETING_LINES.delinquent.shy[1]`: あ、あの…あたしみたいなのでも…いいんすか…？

### delinquent.easygoing[]

- `FA_GREETING_LINES.delinquent.easygoing[1]`: フリーもそろそろ飽きたんでな。世話になるぜ

### delinquent.earnest[]

- `FA_GREETING_LINES.delinquent.earnest[1]`: 拾ってもらった以上、腐った真似はしねえ

### delinquent.emotional[]

- `FA_GREETING_LINES.delinquent.emotional[1]`: 拾ってくれんのか…！泣けてきたぜ…！

### seductive.normal[]

- `FA_GREETING_LINES.seductive.normal[1]`: 落ちこぼれを拾うなんて。…物好きね。

### seductive.bold[]

- `FA_GREETING_LINES.seductive.bold[1]`: 拾った目利きは正解よ。…すぐに分かるわ

### seductive.quiet[]

- `FA_GREETING_LINES.seductive.quiet[1]`: ……居場所ができたのね。…助かるわ

### seductive.shy[]

- `FA_GREETING_LINES.seductive.shy[1]`: …もう、独りで待たなくていいのね…よかった…

### seductive.easygoing[]

- `FA_GREETING_LINES.seductive.easygoing[1]`: 拾ってくれるなんて。…優しいのね、ここ

### seductive.earnest[]

- `FA_GREETING_LINES.seductive.earnest[1]`: 声をかけてくれた人は久しぶりなの。…このチャンス、大事にするわ

### seductive.emotional[]

- `FA_GREETING_LINES.seductive.emotional[1]`: 拾われる側になるなんて…っ…参ったわ

### composed.normal[]

- `FA_GREETING_LINES.composed.normal[1]`: …また名前を呼ばれる場所ができた。悪くないよ

### composed.bold[]

- `FA_GREETING_LINES.composed.bold[1]`: …空白は、結果で埋める。それだけだよ

### composed.quiet[]

- `FA_GREETING_LINES.composed.quiet[1]`: ……帰る場所ができた。助かるよ

### composed.shy[]

- `FA_GREETING_LINES.composed.shy[1]`: …また居場所ができたんだね。…嬉しい

### composed.easygoing[]

- `FA_GREETING_LINES.composed.easygoing[1]`: …フリーはここまでにするよ。落ち着くとこだ

### composed.earnest[]

- `FA_GREETING_LINES.composed.earnest[1]`: …二度目はもうない。…だから丁寧にやる

### composed.emotional[]

- `FA_GREETING_LINES.composed.emotional[1]`: …っ…まだ終わってなかった。…やるよ

## `FA_GREETING_GENERIC_LINES`

- 出典: `src/data.js`
- 本数: 3

- `FA_GREETING_GENERIC_LINES[1]`: もう一度リングに立てます。無駄にしません！
- `FA_GREETING_GENERIC_LINES[2]`: 拾っていただいた恩、必ず返します！
- `FA_GREETING_GENERIC_LINES[3]`: 所属を失っていました。ここで、やり直します！
