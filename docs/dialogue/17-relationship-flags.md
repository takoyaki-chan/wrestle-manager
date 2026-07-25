# 関係性フラグ

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `FLAG_DIALOGUE`

- 出典: `src/flag-dialogue.js`
- コード内コメント: polite    : 私、〜です・〜ます、敬語ベース / seductive : わたし、〜よ・〜わ・〜の、艶やか / delinquent: あたし/俺、〜っす・〜じゃん、荒い / cool      : 短い、語尾省略、淡々 / normal    : 私、〜です・〜ます、標準 / {name} = 当事者A、{name2} = 相手B (該当時)。
- 本数: 449

### M-1.composed[]

- `FLAG_DIALOGUE.M-1.composed[1]`: {name}……あれだけ言葉を交わして、それでも行ったか。仕方ないとは言わせない。
- `FLAG_DIALOGUE.M-1.composed[2]`: あの団体で何を背負うつもりだ、{name}。次にリングで会うときは、こちらも遠慮しない。
- `FLAG_DIALOGUE.M-1.composed[3]`: 止められなかったのは私の力不足だ。だが、置いていかれた怒りは別の話だ。

### M-1.ojousama[]

- `FLAG_DIALOGUE.M-1.ojousama[1]`: {name}、あなたが選んだ道ですのね。わたくしを置いて、よくも。
- `FLAG_DIALOGUE.M-1.ojousama[2]`: あれほど共に歩んだのに……許しませんわ、{name}。
- `FLAG_DIALOGUE.M-1.ojousama[3]`: 裏切り者には、それ相応のご挨拶を用意しておきますの。

### M-1.polite[]

- `FLAG_DIALOGUE.M-1.polite[1]`: {name}先輩、あの言葉は本心だったのでしょうか。
- `FLAG_DIALOGUE.M-1.polite[2]`: 残された私たちは、私たちで前を向きます。けれど、簡単には呑み込めません。
- `FLAG_DIALOGUE.M-1.polite[3]`: お元気で、とは申しません。次にお会いするときは、敵として。

### M-1.seductive[]

- `FLAG_DIALOGUE.M-1.seductive[1]`: {name}、置いていくの? いいわ。次に向き合うときは、容赦しないから。
- `FLAG_DIALOGUE.M-1.seductive[2]`: あの背中、追わない。けど、忘れもしないわよ。
- `FLAG_DIALOGUE.M-1.seductive[3]`: 裏切ったって言葉、あなたによく似合うわね、{name}。

### M-1.delinquent[]

- `FLAG_DIALOGUE.M-1.delinquent[1]`: {name}ぁ、テメー筋通せって話だろ。次のリング、覚悟しとけよ。
- `FLAG_DIALOGUE.M-1.delinquent[2]`: 行きやがったか。あたしらに何の説明もなしによ。
- `FLAG_DIALOGUE.M-1.delinquent[3]`: いいぜ、向こうで好きにやれ。会ったらブッ潰すだけだ。

### M-1.cool[]

- `FLAG_DIALOGUE.M-1.cool[1]`: {name}……行ったか。
- `FLAG_DIALOGUE.M-1.cool[2]`: 次は、敵だ。

### M-1.normal[]

- `FLAG_DIALOGUE.M-1.normal[1]`: {name}が抜けた。受け止めるしかないけど、釈然としない。
- `FLAG_DIALOGUE.M-1.normal[2]`: あの練習場が{name}抜きで回るようになる。当たり前のように。それが寂しい。
- `FLAG_DIALOGUE.M-1.normal[3]`: 行くなら行くで、こっちはこっちで前に進む。それだけだ。

### M-2.composed[]

- `FLAG_DIALOGUE.M-2.composed[1]`: {name2}……あの試合は本物だった。私もあそこに立つ。
- `FLAG_DIALOGUE.M-2.composed[2]`: 今日見せられたものは、忘れない。{name2}、追わせてもらう。
- `FLAG_DIALOGUE.M-2.composed[3]`: 背中はまだ遠い。だが、目標が定まった。

### M-2.ojousama[]

- `FLAG_DIALOGUE.M-2.ojousama[1]`: {name2}様……あのお試合、わたくしの目に焼き付きましたわ。
- `FLAG_DIALOGUE.M-2.ojousama[2]`: あの方の背中、追いかけさせていただきますの。
- `FLAG_DIALOGUE.M-2.ojousama[3]`: 今日という日、わたくしの心に灯がともりましたわ。

### M-2.polite[]

- `FLAG_DIALOGUE.M-2.polite[1]`: {name2}先輩、本当に素晴らしい試合でした。私も、いつか。
- `FLAG_DIALOGUE.M-2.polite[2]`: あの背中を追わせてください。それが今日からの私の目標です。
- `FLAG_DIALOGUE.M-2.polite[3]`: こんな試合ができる人がいるんですね。胸が、震えました。

### M-2.seductive[]

- `FLAG_DIALOGUE.M-2.seductive[1]`: {name2}……いいものを見せてくれたわね。私も燃えてきたわ。
- `FLAG_DIALOGUE.M-2.seductive[2]`: あの人みたいな試合、わたしにもできるかしら。試したくなったの。
- `FLAG_DIALOGUE.M-2.seductive[3]`: あんな景色を見せられたら、追いかけたくなるじゃない。

### M-2.delinquent[]

- `FLAG_DIALOGUE.M-2.delinquent[1]`: {name2}、マジでカッコ良すぎだろ。あたしもあそこ目指すわ。
- `FLAG_DIALOGUE.M-2.delinquent[2]`: うわー、これは追いかけるしかねぇっす、{name2}先輩。
- `FLAG_DIALOGUE.M-2.delinquent[3]`: あんな試合見せられたら、こっちもやるしかねぇだろ。

### M-2.cool[]

- `FLAG_DIALOGUE.M-2.cool[1]`: {name2}……すごい。
- `FLAG_DIALOGUE.M-2.cool[2]`: あの背中、追う。
- `FLAG_DIALOGUE.M-2.cool[3]`: ……目標、決まった。

### M-2.normal[]

- `FLAG_DIALOGUE.M-2.normal[1]`: {name2}の試合、本物だった。素直に追いかけたい。
- `FLAG_DIALOGUE.M-2.normal[2]`: あれを見て動かないなら、選手として終わりだ。私も行く。
- `FLAG_DIALOGUE.M-2.normal[3]`: 目標ができた。{name2}、見ててほしい。

### M-3.composed[]

- `FLAG_DIALOGUE.M-3.composed[1]`: {name2}、隣に立てた。礼を言わせてくれ。
- `FLAG_DIALOGUE.M-3.composed[2]`: 追いつくのが目標だった。だが、ここからは別の景色を見る。
- `FLAG_DIALOGUE.M-3.composed[3]`: 背中は見えなくなった。今度は並んで歩こう、{name2}。

### M-3.ojousama[]

- `FLAG_DIALOGUE.M-3.ojousama[1]`: {name2}様、ここまで参りましたわ。これからは、わたくしも肩を並べて。
- `FLAG_DIALOGUE.M-3.ojousama[2]`: 追いついた、と申し上げてもよろしくて? {name2}様。
- `FLAG_DIALOGUE.M-3.ojousama[3]`: あなた様の背中、ようやくわたくしの隣にございますの。

### M-3.polite[]

- `FLAG_DIALOGUE.M-3.polite[1]`: {name2}先輩、ようやく追いつきました。ありがとうございます。
- `FLAG_DIALOGUE.M-3.polite[2]`: ここまで来られたのは、あなたを目標にしていたからです。
- `FLAG_DIALOGUE.M-3.polite[3]`: 隣を歩かせてください。それが、私からの恩返しです。

### M-3.seductive[]

- `FLAG_DIALOGUE.M-3.seductive[1]`: {name2}、追いついちゃった。これから、もっと面白くなるわよ。
- `FLAG_DIALOGUE.M-3.seductive[2]`: 目標にしてた背中、もう見えないのね。寂しいくらい。
- `FLAG_DIALOGUE.M-3.seductive[3]`: 同じ景色、見えてる? あなたとは、ここから本気で競るわよ。

### M-3.delinquent[]

- `FLAG_DIALOGUE.M-3.delinquent[1]`: {name2}先輩、追いついたっす。ここからは隣で行かせてもらうっすよ。
- `FLAG_DIALOGUE.M-3.delinquent[2]`: 見てくれよ、{name2}。あたし、ここまで来たぜ。
- `FLAG_DIALOGUE.M-3.delinquent[3]`: もう背中追っかけねぇ。隣で並んで殴り合うだけっす。

### M-3.cool[]

- `FLAG_DIALOGUE.M-3.cool[1]`: {name2}……追いついた。
- `FLAG_DIALOGUE.M-3.cool[2]`: 隣、貰う。
- `FLAG_DIALOGUE.M-3.cool[3]`: 次は、超える。

### M-3.normal[]

- `FLAG_DIALOGUE.M-3.normal[1]`: {name2}を追いかけてきて、ようやく隣に立てた気がする。
- `FLAG_DIALOGUE.M-3.normal[2]`: あの背中が目標だった。だから今日は素直に嬉しい。
- `FLAG_DIALOGUE.M-3.normal[3]`: 追いついた、というよりは、同じ場所に立てた。それで十分だ。

### M-4.composed[]

- `FLAG_DIALOGUE.M-4.composed[1]`: {name2}……ここで降りるのか。届く前に見送るのは堪える。
- `FLAG_DIALOGUE.M-4.composed[2]`: あの背中を追っていた日々が、終わる。礼を言うべきか、恨むべきか。
- `FLAG_DIALOGUE.M-4.composed[3]`: お疲れさま、{name2}。続きは、こちらで引き受ける。

### M-4.ojousama[]

- `FLAG_DIALOGUE.M-4.ojousama[1]`: {name2}様……どうかお健やかに。あなた様の続きを、わたくしが背負いますわ。
- `FLAG_DIALOGUE.M-4.ojousama[2]`: 追いつく前にお別れだなんて……ずるうございますわ。
- `FLAG_DIALOGUE.M-4.ojousama[3]`: 見届けたかった景色、わたくしが代わりに歩みますの。

### M-4.polite[]

- `FLAG_DIALOGUE.M-4.polite[1]`: {name2}先輩、お疲れさまでした。何も返せないまま、お別れになります。
- `FLAG_DIALOGUE.M-4.polite[2]`: まだ追いついていなかった私を、置いていくんですか。
- `FLAG_DIALOGUE.M-4.polite[3]`: あなたの試合は、私の中にずっと残ります。本当に、ありがとうございました。

### M-4.seductive[]

- `FLAG_DIALOGUE.M-4.seductive[1]`: {name2}……いなくなるなんて、認められないわよ。
- `FLAG_DIALOGUE.M-4.seductive[2]`: 追いかける背中が消えるって、こんなに虚しいのね。
- `FLAG_DIALOGUE.M-4.seductive[3]`: お疲れさま。あなたの分まで、わたしが暴れるわ。

### M-4.delinquent[]

- `FLAG_DIALOGUE.M-4.delinquent[1]`: {name2}、引退かよ。あたし、まだ届いてねぇっつーのに。
- `FLAG_DIALOGUE.M-4.delinquent[2]`: おつかれっす……つーかズリーぜ、{name2}先輩。
- `FLAG_DIALOGUE.M-4.delinquent[3]`: 追いつく前に降りやがって。ここから先は、あたしの戦いだ。

### M-4.cool[]

- `FLAG_DIALOGUE.M-4.cool[2]`: 行くな、と言うのも違う気がする。
- `FLAG_DIALOGUE.M-4.cool[3]`: ……お疲れさま。

### M-4.normal[]

- `FLAG_DIALOGUE.M-4.normal[1]`: {name2}が引退。背中を追っていた人がいなくなるのは、思った以上に重い。
- `FLAG_DIALOGUE.M-4.normal[2]`: お疲れさまでした。続きは、私たちで。
- `FLAG_DIALOGUE.M-4.normal[3]`: まだ追いつけていなかったのに、置いていくんですね。

### M-5.composed[]

- `FLAG_DIALOGUE.M-5.composed[1]`: {name2}……勝手に憧れて、勝手に離れる。私の問題だ。
- `FLAG_DIALOGUE.M-5.composed[2]`: 思っていた人と違ったな。それだけのことだ。
- `FLAG_DIALOGUE.M-5.composed[3]`: 目標は、別の場所に置く。あなたではない。

### M-5.ojousama[]

- `FLAG_DIALOGUE.M-5.ojousama[1]`: {name2}様……わたくしの目は、節穴でしたのね。
- `FLAG_DIALOGUE.M-5.ojousama[2]`: あなた様への憧れ、ここで仕舞わせていただきますわ。
- `FLAG_DIALOGUE.M-5.ojousama[3]`: 理想と現実は別物。よくわかりましたの。

### M-5.polite[]

- `FLAG_DIALOGUE.M-5.polite[1]`: {name2}先輩、勝手に憧れて、勝手に距離を置きます。すみません。
- `FLAG_DIALOGUE.M-5.polite[2]`: 見ていたのは私が作った像でした。本当のあなたは、違う。
- `FLAG_DIALOGUE.M-5.polite[3]`: これからは、ただの先輩後輩として。

### M-5.seductive[]

- `FLAG_DIALOGUE.M-5.seductive[1]`: {name2}、思ってたのと違ったわね。距離、置かせてもらうわ。
- `FLAG_DIALOGUE.M-5.seductive[2]`: 憧れって賞味期限あるのね。今日で終わり。
- `FLAG_DIALOGUE.M-5.seductive[3]`: もう背中は追わない。その方が、お互いのためでしょ?

### M-5.delinquent[]

- `FLAG_DIALOGUE.M-5.delinquent[1]`: {name2}、ガッカリだわ。憧れた自分が馬鹿みてぇだ。
- `FLAG_DIALOGUE.M-5.delinquent[2]`: ちっ、こんなもんかよ。{name2}先輩、降りますわ。
- `FLAG_DIALOGUE.M-5.delinquent[3]`: 別にもう追わねぇっす。次は対等にぶつかるだけだ。

### M-5.cool[]

- `FLAG_DIALOGUE.M-5.cool[1]`: {name2}……違ったか。
- `FLAG_DIALOGUE.M-5.cool[2]`: もう、見ない。
- `FLAG_DIALOGUE.M-5.cool[3]`: ……目標、変える。

### M-5.normal[]

- `FLAG_DIALOGUE.M-5.normal[1]`: {name2}も人間だった、ってことか。憧れるのはやめておく。
- `FLAG_DIALOGUE.M-5.normal[2]`: あの頃の{name2}は格好良かった。今のあなたは、知らない人だ。
- `FLAG_DIALOGUE.M-5.normal[3]`: 勝手な期待だった。降ろすしかない。

### M-6.composed[]

- `FLAG_DIALOGUE.M-6.composed[1]`: {name2}、勝った。これでようやく、まっすぐ前を向ける。
- `FLAG_DIALOGUE.M-6.composed[2]`: 燻っていた気持ちは、今日で下ろす。次の試合からは別人として戦う。
- `FLAG_DIALOGUE.M-6.composed[3]`: 羨ましさは、勝った瞬間に消えた。不思議なものだな。

### M-6.ojousama[]

- `FLAG_DIALOGUE.M-6.ojousama[1]`: {name2}様、勝たせていただきましたわ。これで胸のつかえも取れますの。
- `FLAG_DIALOGUE.M-6.ojousama[2]`: 長らくの嫉妬、本日をもって閉幕いたしますわ。
- `FLAG_DIALOGUE.M-6.ojousama[3]`: 勝利という形でしか手放せませんでしたの。お許しを。

### M-6.polite[]

- `FLAG_DIALOGUE.M-6.polite[1]`: {name2}先輩、今日は私が勝ちました。これで前を向けます。
- `FLAG_DIALOGUE.M-6.polite[2]`: ずっと胸につかえていたものが、ようやく取れた気がします。
- `FLAG_DIALOGUE.M-6.polite[3]`: 対等に向き合えるのは、ここからですね。

### M-6.seductive[]

- `FLAG_DIALOGUE.M-6.seductive[1]`: {name2}、勝ったわ。気分、最高よ。
- `FLAG_DIALOGUE.M-6.seductive[2]`: モヤモヤしてた相手に勝つって、こんなに気持ちいいのね。
- `FLAG_DIALOGUE.M-6.seductive[3]`: これでやっと、あなたを普通に見られそう。

### M-6.delinquent[]

- `FLAG_DIALOGUE.M-6.delinquent[1]`: {name2}先輩、勝たせてもらったっすよ。これで肩の荷が下りるっす。
- `FLAG_DIALOGUE.M-6.delinquent[2]`: ずっと羨ましかったあんたに勝った。マジで嬉しいわ。
- `FLAG_DIALOGUE.M-6.delinquent[3]`: やっと、対等にケンカできるな、{name2}。

### M-6.cool[]

- `FLAG_DIALOGUE.M-6.cool[1]`: {name2}……勝った。
- `FLAG_DIALOGUE.M-6.cool[2]`: ……重荷、下ろせる。
- `FLAG_DIALOGUE.M-6.cool[3]`: 次は、普通の試合をする。

### M-6.normal[]

- `FLAG_DIALOGUE.M-6.normal[1]`: {name2}に勝った。長かった。本当に長かった。
- `FLAG_DIALOGUE.M-6.normal[2]`: 羨んでた相手に勝つと、こうも違うものなんだな。
- `FLAG_DIALOGUE.M-6.normal[3]`: ようやく、自分の試合に集中できる。

### M-7.composed[]

- `FLAG_DIALOGUE.M-7.composed[1]`: {name2}、引退か。決着は自分の中でつけるしかないな。
- `FLAG_DIALOGUE.M-7.composed[2]`: お前を超える前に降りるのは、ずるいぞ、{name2}。
- `FLAG_DIALOGUE.M-7.composed[3]`: 抱えたまま終わる嫉妬もある。仕方ない。

### M-7.ojousama[]

- `FLAG_DIALOGUE.M-7.ojousama[1]`: {name2}様、お引退とのこと。わたくしの胸の内は、置き場を失いましたわ。
- `FLAG_DIALOGUE.M-7.ojousama[2]`: 勝ち越せぬまま、お見送りすることになるとは……。
- `FLAG_DIALOGUE.M-7.ojousama[3]`: この嫉妬、どこへ片付けたものでしょう。

### M-7.polite[]

- `FLAG_DIALOGUE.M-7.polite[1]`: {name2}先輩、引退ですか。私の中の宿題は、宿題のまま残りそうです。
- `FLAG_DIALOGUE.M-7.polite[2]`: 届かないまま終わるのは、悔しい。けれど、お疲れさまでした。
- `FLAG_DIALOGUE.M-7.polite[3]`: 羨ましい気持ち、自分の中で片付けます。

### M-7.seductive[]

- `FLAG_DIALOGUE.M-7.seductive[1]`: {name2}、引退? 決着つける前にいなくなるなんて、ずるいじゃない。
- `FLAG_DIALOGUE.M-7.seductive[2]`: モヤモヤしたまま終わるなんて、最低の置き土産ね。
- `FLAG_DIALOGUE.M-7.seductive[3]`: あなた抜きで先に進むしかないのね。

### M-7.delinquent[]

- `FLAG_DIALOGUE.M-7.delinquent[1]`: {name2}先輩、引退かよ。決着つけねぇまま終わんなって。
- `FLAG_DIALOGUE.M-7.delinquent[2]`: ずりぃっす、マジで。あたしの嫉妬、宙ぶらりんじゃねぇっすか。
- `FLAG_DIALOGUE.M-7.delinquent[3]`: もう追えねぇ相手になっちまった。それだけだ。

### M-7.cool[]

- `FLAG_DIALOGUE.M-7.cool[1]`: {name2}……行くのか。
- `FLAG_DIALOGUE.M-7.cool[2]`: ……決着、なし。
- `FLAG_DIALOGUE.M-7.cool[3]`: 中で、片付ける。

### M-7.normal[]

- `FLAG_DIALOGUE.M-7.normal[1]`: {name2}、引退か。羨んだまま終わるのは、悔しい気もする。
- `FLAG_DIALOGUE.M-7.normal[2]`: 勝ち越せないまま終わるのも、人生だな。
- `FLAG_DIALOGUE.M-7.normal[3]`: もう追えない相手になった。それだけのことだ。

### M-8.composed[]

- `FLAG_DIALOGUE.M-8.composed[1]`: 一年前は、{name2}に火がついていた。今は別の景色を見ている。
- `FLAG_DIALOGUE.M-8.composed[2]`: あの嫉妬、まだ完全には消えていない。だが、動けなくなるほどではない。
- `FLAG_DIALOGUE.M-8.composed[3]`: 時間は容赦ない。あの熱が懐かしいくらいだ。

### M-8.ojousama[]

- `FLAG_DIALOGUE.M-8.ojousama[1]`: 一年も経ちますと、{name2}様への気持ちも色褪せてまいりましたの。
- `FLAG_DIALOGUE.M-8.ojousama[2]`: あの頃のわたくしの焦りが、嘘のようですわ。
- `FLAG_DIALOGUE.M-8.ojousama[3]`: 時間という薬、思いのほか効きますのね。

### M-8.polite[]

- `FLAG_DIALOGUE.M-8.polite[1]`: 一年経ちました。{name2}先輩への気持ち、少しずつ薄れています。
- `FLAG_DIALOGUE.M-8.polite[2]`: あの頃のモヤモヤ、もう色褪せてきました。
- `FLAG_DIALOGUE.M-8.polite[3]`: 気づけば、当時ほど焦っていない自分がいます。

### M-8.seductive[]

- `FLAG_DIALOGUE.M-8.seductive[1]`: 一年か。{name2}への気持ちも、ずいぶん落ち着いたわね。
- `FLAG_DIALOGUE.M-8.seductive[2]`: あれだけ燃えてたのに、こうして冷めていくのね。
- `FLAG_DIALOGUE.M-8.seductive[3]`: 時間って、女のつれない友達よね。

### M-8.delinquent[]

- `FLAG_DIALOGUE.M-8.delinquent[1]`: もう一年っすか。{name2}に焦ってた自分、ちょっと笑えるわ。
- `FLAG_DIALOGUE.M-8.delinquent[2]`: あの頃の熱、もうだいぶ薄れたな。時間、おそろしいぜ。
- `FLAG_DIALOGUE.M-8.delinquent[3]`: 一年経ったら、こんなもんっすね。

### M-8.cool[]

- `FLAG_DIALOGUE.M-8.cool[1]`: 一年。
- `FLAG_DIALOGUE.M-8.cool[2]`: ……色、薄い。
- `FLAG_DIALOGUE.M-8.cool[3]`: 消えかけ。

### M-8.normal[]

- `FLAG_DIALOGUE.M-8.normal[1]`: {name2}への嫉妬、一年経ってだいぶ風化してきた。
- `FLAG_DIALOGUE.M-8.normal[2]`: 当時はあんなに焦ってたのに、不思議だな。
- `FLAG_DIALOGUE.M-8.normal[3]`: モヤモヤが、ぼんやりしてきた感じだ。

### M-9.composed[]

- `FLAG_DIALOGUE.M-9.composed[1]`: 二年。{name2}を見ても、もう心が動かない。
- `FLAG_DIALOGUE.M-9.composed[2]`: あれだけ目障りだった相手が、ただの選手にしか見えない。
- `FLAG_DIALOGUE.M-9.composed[3]`: 時間は嫉妬すら磨耗させる。覚えておこう。

### M-9.ojousama[]

- `FLAG_DIALOGUE.M-9.ojousama[1]`: 二年も経てば、{name2}様への感情も雲散霧消ですわ。
- `FLAG_DIALOGUE.M-9.ojousama[2]`: あの頃のわたくしの必死さ、もはや遠い夢のよう。
- `FLAG_DIALOGUE.M-9.ojousama[3]`: 今では、ただの一選手として拝見しておりますの。

### M-9.polite[]

- `FLAG_DIALOGUE.M-9.polite[1]`: 二年経ちました。{name2}先輩を、ただの一人の選手として見られます。
- `FLAG_DIALOGUE.M-9.polite[2]`: 時間がここまで気持ちを削るとは、思いませんでした。
- `FLAG_DIALOGUE.M-9.polite[3]`: あの感情、ほとんど思い出せません。

### M-9.seductive[]

- `FLAG_DIALOGUE.M-9.seductive[1]`: 二年も経つと、嫉妬も色気がなくなってくるわね。
- `FLAG_DIALOGUE.M-9.seductive[2]`: {name2}のこと、もう何とも思わないわ。寂しいくらい。
- `FLAG_DIALOGUE.M-9.seductive[3]`: あれだけ燃えた相手が、今は風景の一部。

### M-9.delinquent[]

- `FLAG_DIALOGUE.M-9.delinquent[1]`: 二年っすか。{name2}に焦ってたとか、もう思い出せねぇ。
- `FLAG_DIALOGUE.M-9.delinquent[2]`: あんなに目障りだった相手が、今はただの先輩っす。
- `FLAG_DIALOGUE.M-9.delinquent[3]`: 時間、容赦ねぇっすね。あたしの嫉妬も削り倒したわ。

### M-9.cool[]

- `FLAG_DIALOGUE.M-9.cool[1]`: 二年。
- `FLAG_DIALOGUE.M-9.cool[2]`: 透明。
- `FLAG_DIALOGUE.M-9.cool[3]`: ……痛まない。

### M-9.normal[]

- `FLAG_DIALOGUE.M-9.normal[1]`: 二年か。あの嫉妬、もうほとんど残ってない。
- `FLAG_DIALOGUE.M-9.normal[2]`: {name2}を見ても、心が動かなくなった。
- `FLAG_DIALOGUE.M-9.normal[3]`: 時間が解決した、ってこういうことか。

### M-10.composed[]

- `FLAG_DIALOGUE.M-10.composed[1]`: 三年。{name2}への嫉妬、ここで完全に手放す。
- `FLAG_DIALOGUE.M-10.composed[2]`: 抱え続ける必要のなかった重荷だ。下ろせ、ようやく下ろせる。
- `FLAG_DIALOGUE.M-10.composed[3]`: もう{name2}を見ても、何も湧かない。これでいい。

### M-10.ojousama[]

- `FLAG_DIALOGUE.M-10.ojousama[1]`: 三年がかりで、ようやく{name2}様を心から解き放ちましたの。
- `FLAG_DIALOGUE.M-10.ojousama[2]`: 長きにわたる嫉妬、本日をもって完全に幕引きですわ。
- `FLAG_DIALOGUE.M-10.ojousama[3]`: お互い、別の景色を見て参りましょう。

### M-10.polite[]

- `FLAG_DIALOGUE.M-10.polite[1]`: 三年経ちました。{name2}先輩への嫉妬、もうありません。区切りをつけます。
- `FLAG_DIALOGUE.M-10.polite[2]`: 長く抱えました。今は、感謝に近い気持ちです。
- `FLAG_DIALOGUE.M-10.polite[3]`: 私の中で、ようやく終わりました。

### M-10.seductive[]

- `FLAG_DIALOGUE.M-10.seductive[1]`: 三年、長かったわね。{name2}への気持ち、今日で完全にお別れよ。
- `FLAG_DIALOGUE.M-10.seductive[2]`: あれだけ拗らせた感情も、こうして終わるのね。
- `FLAG_DIALOGUE.M-10.seductive[3]`: もう、{name2}を見ても何も感じない。それでいい。

### M-10.delinquent[]

- `FLAG_DIALOGUE.M-10.delinquent[1]`: 三年っすよ三年。やっと{name2}を引きずらずに済むっす。
- `FLAG_DIALOGUE.M-10.delinquent[2]`: 長かったぜ、マジで。あの嫉妬、ここで完全終了だ。
- `FLAG_DIALOGUE.M-10.delinquent[3]`: もう{name2}見ても何も湧かねぇ。これで普通に戻れるな。

### M-10.cool[]

- `FLAG_DIALOGUE.M-10.cool[1]`: 三年。
- `FLAG_DIALOGUE.M-10.cool[2]`: ……完全に、消えた。
- `FLAG_DIALOGUE.M-10.cool[3]`: 区切り。

### M-10.normal[]

- `FLAG_DIALOGUE.M-10.normal[1]`: 三年か。{name2}への嫉妬、もう完全に過去だ。
- `FLAG_DIALOGUE.M-10.normal[2]`: あんなに気にしてた相手が、今では風景の一部だ。
- `FLAG_DIALOGUE.M-10.normal[3]`: 長かった。区切りをつけられて、よかった。

### M-11.composed[]

- `FLAG_DIALOGUE.M-11.composed[1]`: {name2}、また持って行ったか。腹の底がざわついている。自分でも認めたくないが。
- `FLAG_DIALOGUE.M-11.composed[2]`: 同じ場所にいたはずだ。なのに、見ている景色は違う。
- `FLAG_DIALOGUE.M-11.composed[3]`: 羨むのは性に合わない。だが、目を奪われている。

### M-11.ojousama[]

- `FLAG_DIALOGUE.M-11.ojousama[1]`: {name2}様、なぜあなた様ばかり……わたくしの胸の中、煮えておりますの。
- `FLAG_DIALOGUE.M-11.ojousama[2]`: 比べてはならぬと存じております。けれど、比べてしまいますの。
- `FLAG_DIALOGUE.M-11.ojousama[3]`: 同じ場所におりましたのに、距離が開いてゆきますわ。

### M-11.polite[]

- `FLAG_DIALOGUE.M-11.polite[1]`: {name2}先輩、どうしてあなたばかり。私だって努力しているのに。
- `FLAG_DIALOGUE.M-11.polite[2]`: 比べたくありませんでした。でも、比べてしまう自分がいます。
- `FLAG_DIALOGUE.M-11.polite[3]`: 同じスタートだったはずなのに、もう同じ景色を見ていません。

### M-11.seductive[]

- `FLAG_DIALOGUE.M-11.seductive[1]`: {name2}、また派手にやってくれたわね。腹の底が、ちりちりするわ。
- `FLAG_DIALOGUE.M-11.seductive[2]`: 羨ましい、なんて言葉、使うつもりなかったのに。
- `FLAG_DIALOGUE.M-11.seductive[3]`: あなたばっかりずるいじゃない。わたしも燃えてるのよ。

### M-11.delinquent[]

- `FLAG_DIALOGUE.M-11.delinquent[1]`: {name2}先輩、また持ってかれたっすか。あたしのほうがムカついてんすよ。
- `FLAG_DIALOGUE.M-11.delinquent[2]`: ちっ、なんであいつばっかなんだよ。腹立つわ。
- `FLAG_DIALOGUE.M-11.delinquent[3]`: あいつだけは羨んじゃだめだろ。なのに、目で追っちまう。

### M-11.cool[]

- `FLAG_DIALOGUE.M-11.cool[1]`: {name2}……眩しい。
- `FLAG_DIALOGUE.M-11.cool[2]`: ……ざわつく。
- `FLAG_DIALOGUE.M-11.cool[3]`: 比べてしまう。

### M-11.normal[]

- `FLAG_DIALOGUE.M-11.normal[1]`: {name2}を見ているとモヤモヤする。これが嫉妬か。
- `FLAG_DIALOGUE.M-11.normal[2]`: 同じスタートだったはずなのに、もう同じ景色を見ていない。
- `FLAG_DIALOGUE.M-11.normal[3]`: 羨ましい。素直に言えなかったから、こうなる。

### M-12.returner.composed[]

- `FLAG_DIALOGUE.M-12.returner.composed[1]`: ただいま、戻った。受け入れるかどうかは皆に任せる。
- `FLAG_DIALOGUE.M-12.returner.composed[2]`: すまない。もう一度、ここで戦わせてくれ。
- `FLAG_DIALOGUE.M-12.returner.composed[3]`: 頭は下げる。だが、リングでは下げない。それでいいか。

### M-12.returner.ojousama[]

- `FLAG_DIALOGUE.M-12.returner.ojousama[1]`: ただいま戻りましたの。お騒がせいたしました皆様、申し訳ございません。
- `FLAG_DIALOGUE.M-12.returner.ojousama[2]`: もう一度、こちらの団体で戦わせてくださいませ。
- `FLAG_DIALOGUE.M-12.returner.ojousama[3]`: わたくしの帰還、歓迎されぬのは承知のうえですわ。

### M-12.returner.polite[]

- `FLAG_DIALOGUE.M-12.returner.polite[1]`: ただいま、戻ってきました。皆さん、改めてよろしくお願いします。
- `FLAG_DIALOGUE.M-12.returner.polite[2]`: ご迷惑をおかけしました。もう一度、ここで戦わせてください。
- `FLAG_DIALOGUE.M-12.returner.polite[3]`: 受け入れていただけるかどうかは、これからの私次第だと思っています。

### M-12.returner.seductive[]

- `FLAG_DIALOGUE.M-12.returner.seductive[1]`: ただいま。冷たくしないでくれる? まだわたしの居場所、ここでしょ?
- `FLAG_DIALOGUE.M-12.returner.seductive[2]`: 戻ってきちゃった。許してくれるかは、あなた次第ね。
- `FLAG_DIALOGUE.M-12.returner.seductive[3]`: 結局ここに帰ってきたわ。それだけは、信じて。

### M-12.returner.delinquent[]

- `FLAG_DIALOGUE.M-12.returner.delinquent[1]`: ただいま戻ったっす。文句あるなら受けて立つっすよ。
- `FLAG_DIALOGUE.M-12.returner.delinquent[2]`: はー、結局戻ってきちまった。ヨロシクっす。
- `FLAG_DIALOGUE.M-12.returner.delinquent[3]`: 頭下げにきました。もういっぺん、ここで暴れさせてくれ。

### M-12.returner.cool[]

- `FLAG_DIALOGUE.M-12.returner.cool[1]`: ……ただいま。
- `FLAG_DIALOGUE.M-12.returner.cool[2]`: 戻った。
- `FLAG_DIALOGUE.M-12.returner.cool[3]`: ……すまない。

### M-12.returner.normal[]

- `FLAG_DIALOGUE.M-12.returner.normal[1]`: 戻ってきました。お騒がせしてすみません。
- `FLAG_DIALOGUE.M-12.returner.normal[2]`: いろいろあったけど、また一緒にやれたら嬉しいです。
- `FLAG_DIALOGUE.M-12.returner.normal[3]`: ただいま。これから、またよろしく。

### M-12.forgiven.composed[]

- `FLAG_DIALOGUE.M-12.forgiven.composed[1]`: {name2}、戻ったか。続きはリングで話そう。
- `FLAG_DIALOGUE.M-12.forgiven.composed[2]`: おかえり、{name2}。色々あったが、もう過ぎた話だ。
- `FLAG_DIALOGUE.M-12.forgiven.composed[3]`: よく戻った。これでまた、こちらの形が揃う。

### M-12.forgiven.ojousama[]

- `FLAG_DIALOGUE.M-12.forgiven.ojousama[1]`: {name2}様、おかえりなさいまし。お待ちしておりましたの。
- `FLAG_DIALOGUE.M-12.forgiven.ojousama[2]`: 色々ございましたけれど、もう水に流しましてよ。
- `FLAG_DIALOGUE.M-12.forgiven.ojousama[3]`: 戻ってきてくださって、嬉しゅうございますわ。

### M-12.forgiven.polite[]

- `FLAG_DIALOGUE.M-12.forgiven.polite[1]`: {name2}先輩、おかえりなさい。また一緒にやりましょう。
- `FLAG_DIALOGUE.M-12.forgiven.polite[2]`: 一度傷ついた気持ちも、戻ってきてくれた今は溶けています。
- `FLAG_DIALOGUE.M-12.forgiven.polite[3]`: お帰りなさい。それだけで、十分です。

### M-12.forgiven.seductive[]

- `FLAG_DIALOGUE.M-12.forgiven.seductive[1]`: {name2}、おかえり。やっぱりここでしょ、あなたの居場所。
- `FLAG_DIALOGUE.M-12.forgiven.seductive[2]`: 待ってたわよ。次の試合、隣に並んでね。
- `FLAG_DIALOGUE.M-12.forgiven.seductive[3]`: 戻ってきたなら、細かいこと抜き。歓迎するわ。

### M-12.forgiven.delinquent[]

- `FLAG_DIALOGUE.M-12.forgiven.delinquent[1]`: おかえり、{name2}! 文句は次の試合でぶつけ合おうぜ!
- `FLAG_DIALOGUE.M-12.forgiven.delinquent[2]`: よく戻ってきたな、{name2}。歓迎するっすよ。
- `FLAG_DIALOGUE.M-12.forgiven.delinquent[3]`: ま、ヨロシクっす。{name2}が戻れば、それでいいわ。

### M-12.forgiven.cool[]

- `FLAG_DIALOGUE.M-12.forgiven.cool[2]`: おかえり。
- `FLAG_DIALOGUE.M-12.forgiven.cool[3]`: ……それでいい。

### M-12.forgiven.normal[]

- `FLAG_DIALOGUE.M-12.forgiven.normal[1]`: {name2}、おかえり。色々あったけど、もう過ぎた話だ。
- `FLAG_DIALOGUE.M-12.forgiven.normal[2]`: よく戻ってきたな。歓迎するよ。
- `FLAG_DIALOGUE.M-12.forgiven.normal[3]`: 一緒にやれるなら、それで十分だ。

### M-12.notForgiven.composed[]

- `FLAG_DIALOGUE.M-12.notForgiven.composed[1]`: {name2}、戻ったか。リングで会おう。それまで話す気はない。
- `FLAG_DIALOGUE.M-12.notForgiven.composed[2]`: 裏切り者を歓迎する義理はない。実力で取り返してみせろ。
- `FLAG_DIALOGUE.M-12.notForgiven.composed[3]`: 同じ更衣室は使うな。それだけだ。

### M-12.notForgiven.ojousama[]

- `FLAG_DIALOGUE.M-12.notForgiven.ojousama[1]`: {name2}様、戻られたとのこと。けれども、わたくしは会釈以上のことは差し上げかねますわ。
- `FLAG_DIALOGUE.M-12.notForgiven.ojousama[2]`: あの時の言葉、まだ胸に残っておりますの。
- `FLAG_DIALOGUE.M-12.notForgiven.ojousama[3]`: 受け入れる前に、リングで示してくださいませ。

### M-12.notForgiven.polite[]

- `FLAG_DIALOGUE.M-12.notForgiven.polite[1]`: {name2}先輩、おかえり、とは申し上げません。実力で示してください。
- `FLAG_DIALOGUE.M-12.notForgiven.polite[2]`: もう一度信じるかどうかは、これからのあなた次第です。
- `FLAG_DIALOGUE.M-12.notForgiven.polite[3]`: 今は、距離を置かせてください。

### M-12.notForgiven.seductive[]

- `FLAG_DIALOGUE.M-12.notForgiven.seductive[1]`: {name2}、戻ってきたのね。でも、前みたいには無理よ。
- `FLAG_DIALOGUE.M-12.notForgiven.seductive[2]`: おかえり、なんて軽くは言えないわ。残念だけど。
- `FLAG_DIALOGUE.M-12.notForgiven.seductive[3]`: 気まずいわよね。わたしもそう思ってるわ。

### M-12.notForgiven.delinquent[]

- `FLAG_DIALOGUE.M-12.notForgiven.delinquent[1]`: {name2}、顔も見たくねぇっす。戻ってこないでほしかったわ。
- `FLAG_DIALOGUE.M-12.notForgiven.delinquent[2]`: 裏切ったヤツを歓迎する義理はねぇ。実力で取り返せ。
- `FLAG_DIALOGUE.M-12.notForgiven.delinquent[3]`: 近寄んな、まだムカついてんだよ。

### M-12.notForgiven.cool[]

- `FLAG_DIALOGUE.M-12.notForgiven.cool[2]`: ……話さない。
- `FLAG_DIALOGUE.M-12.notForgiven.cool[3]`: 距離を、置く。

### M-12.notForgiven.normal[]

- `FLAG_DIALOGUE.M-12.notForgiven.normal[1]`: {name2}、戻ったか。悪いけど、前と同じには戻れない。
- `FLAG_DIALOGUE.M-12.notForgiven.normal[2]`: 時間がいる。今は無理だ。
- `FLAG_DIALOGUE.M-12.notForgiven.normal[3]`: とりあえずは、距離を取らせてもらう。

### M-13.master.composed[]

- `FLAG_DIALOGUE.M-13.master.composed[1]`: {name2}、お前を弟子と認める。本気で来い。
- `FLAG_DIALOGUE.M-13.master.composed[2]`: 預かったからには、最後まで面倒を見る。覚悟しておけ、{name2}。
- `FLAG_DIALOGUE.M-13.master.composed[3]`: お前の歩みは、こちらの歩みでもある。よろしくな。

### M-13.master.ojousama[]

- `FLAG_DIALOGUE.M-13.master.ojousama[1]`: {name2}様、本日よりわたくしの弟子と認めますの。覚悟なさいましね。
- `FLAG_DIALOGUE.M-13.master.ojousama[2]`: お預かりしたからには、立派な選手に育て上げてみせますわ。
- `FLAG_DIALOGUE.M-13.master.ojousama[3]`: わたくしの背中、しかと追っていらっしゃい。

### M-13.master.polite[]

- `FLAG_DIALOGUE.M-13.master.polite[1]`: {name2}さん、これからよろしくお願いします。あなたを弟子として迎えます。
- `FLAG_DIALOGUE.M-13.master.polite[2]`: 師匠と呼ばれるのは少し照れますが、責任を持って指導します。
- `FLAG_DIALOGUE.M-13.master.polite[3]`: 一緒に上を目指しましょう、{name2}さん。

### M-13.master.seductive[]

- `FLAG_DIALOGUE.M-13.master.seductive[1]`: {name2}、いいわ。わたしの弟子になりなさい。甘えは許さないけど。
- `FLAG_DIALOGUE.M-13.master.seductive[2]`: 預かるからには、最強にしてあげる。覚悟して、{name2}。
- `FLAG_DIALOGUE.M-13.master.seductive[3]`: あなたの背中、わたしが押すわ。さあ、ついてきて。

### M-13.master.delinquent[]

- `FLAG_DIALOGUE.M-13.master.delinquent[1]`: {name2}、お前を弟子と認めるっす。甘えんなよ。
- `FLAG_DIALOGUE.M-13.master.delinquent[2]`: ヨロシクな、{name2}。あたしの背中、ついてこい。
- `FLAG_DIALOGUE.M-13.master.delinquent[3]`: 弟子と呼ぶからにゃ、最強にしてやる。それだけだ。

### M-13.master.cool[]

- `FLAG_DIALOGUE.M-13.master.cool[1]`: {name2}……弟子に。
- `FLAG_DIALOGUE.M-13.master.cool[2]`: ……ついて、来い。
- `FLAG_DIALOGUE.M-13.master.cool[3]`: よろしく。

### M-13.master.normal[]

- `FLAG_DIALOGUE.M-13.master.normal[1]`: {name2}、よろしくな。師匠と呼ばれるのは少しくすぐったいけど。
- `FLAG_DIALOGUE.M-13.master.normal[2]`: お前の成長、見届けるよ。
- `FLAG_DIALOGUE.M-13.master.normal[3]`: 一緒に強くなろう、{name2}。

### M-13.disciple.composed[]

- `FLAG_DIALOGUE.M-13.disciple.composed[1]`: {name2}先輩、今日からあなたを師匠と呼ばせてもらう。よろしく頼む。
- `FLAG_DIALOGUE.M-13.disciple.composed[2]`: 弟子として、恥じない戦いをする。{name2}先輩、見ていてくれ。
- `FLAG_DIALOGUE.M-13.disciple.composed[3]`: ここまで連れてきてくれた礼は、リングで返す。

### M-13.disciple.ojousama[]

- `FLAG_DIALOGUE.M-13.disciple.ojousama[1]`: {name2}様、本日よりわたくしの師匠ですわ。光栄ですの。
- `FLAG_DIALOGUE.M-13.disciple.ojousama[2]`: 師の背中、しかと追わせていただきますわ。
- `FLAG_DIALOGUE.M-13.disciple.ojousama[3]`: 弟子として、決して恥はかかせませんわよ。

### M-13.disciple.polite[]

- `FLAG_DIALOGUE.M-13.disciple.polite[1]`: {name2}先輩、ありがとうございます。一生ついていきます。
- `FLAG_DIALOGUE.M-13.disciple.polite[2]`: 師匠……まだ照れますが、これからよろしくお願いします。
- `FLAG_DIALOGUE.M-13.disciple.polite[3]`: あなたに認めてもらえた。私の人生、変わった気がします。

### M-13.disciple.seductive[]

- `FLAG_DIALOGUE.M-13.disciple.seductive[1]`: {name2}先輩、嬉しいわ。これから本気でついていく。
- `FLAG_DIALOGUE.M-13.disciple.seductive[2]`: 師匠なんて呼ぶ日が来るとはね。覚悟して、抜くわよ。
- `FLAG_DIALOGUE.M-13.disciple.seductive[3]`: あなたに預けてもらえた以上、最強の弟子になるわよ。

### M-13.disciple.delinquent[]

- `FLAG_DIALOGUE.M-13.disciple.delinquent[1]`: {name2}先輩、マジ感謝っす! 一生ついてくっすよ!
- `FLAG_DIALOGUE.M-13.disciple.delinquent[2]`: 師匠! いや、なんか恥ずかしいな。{name2}先輩、ヨロシク!
- `FLAG_DIALOGUE.M-13.disciple.delinquent[3]`: いつか抜くっすからね。覚悟しといてください、{name2}先輩!

### M-13.disciple.cool[]

- `FLAG_DIALOGUE.M-13.disciple.cool[1]`: {name2}先輩……。
- `FLAG_DIALOGUE.M-13.disciple.cool[2]`: ……師匠。
- `FLAG_DIALOGUE.M-13.disciple.cool[3]`: よろしく。

### M-13.disciple.normal[]

- `FLAG_DIALOGUE.M-13.disciple.normal[1]`: {name2}先輩、ありがとうございます。これから本気でついていきます。
- `FLAG_DIALOGUE.M-13.disciple.normal[2]`: 師匠……ちょっと照れるけど、嬉しいです。
- `FLAG_DIALOGUE.M-13.disciple.normal[3]`: 弟子として、頑張ります。

### M-14.composed[]

- `FLAG_DIALOGUE.M-14.composed[1]`: {name2}、同じ日に来たお前と、ここまで来た。これからは並び立つ。
- `FLAG_DIALOGUE.M-14.composed[2]`: 同期じゃない。ライバルだ。覚悟してくれ、{name2}。
- `FLAG_DIALOGUE.M-14.composed[3]`: 隣にいたお前が、いまは越えるべき相手だ。

### M-14.ojousama[]

- `FLAG_DIALOGUE.M-14.ojousama[1]`: {name2}様、同じ日に入門したわたくしたちが、ここまで参りましたのね。
- `FLAG_DIALOGUE.M-14.ojousama[2]`: ライバル同士として、これからは堂々と火花を散らしましょうの。
- `FLAG_DIALOGUE.M-14.ojousama[3]`: 隣にいた方が、最大の好敵手。何という巡り合わせでしょう。

### M-14.polite[]

- `FLAG_DIALOGUE.M-14.polite[1]`: {name2}先輩、同期からライバルへ。私たち、いい関係に育ちましたね。
- `FLAG_DIALOGUE.M-14.polite[2]`: 長く一緒にいたからこそ、こうしてぶつかれます。
- `FLAG_DIALOGUE.M-14.polite[3]`: ライバルとして、最後まで競らせてください。

### M-14.seductive[]

- `FLAG_DIALOGUE.M-14.seductive[1]`: {name2}、わたしたち、ここまで来ちゃったわね。
- `FLAG_DIALOGUE.M-14.seductive[2]`: ライバル同期って、悪くない響きじゃない?
- `FLAG_DIALOGUE.M-14.seductive[3]`: 同じ日に来たあなたが好敵手って、運命みたいでしょ。

### M-14.delinquent[]

- `FLAG_DIALOGUE.M-14.delinquent[1]`: {name2}! 同期からライバルかよ、燃えるじゃねぇか!
- `FLAG_DIALOGUE.M-14.delinquent[2]`: ライバル同期っす。マジ最高じゃん、{name2}!
- `FLAG_DIALOGUE.M-14.delinquent[3]`: 一緒にやってきたお前と燃え上がれるとは思わなかったぜ!

### M-14.cool[]

- `FLAG_DIALOGUE.M-14.cool[1]`: {name2}……ライバル。
- `FLAG_DIALOGUE.M-14.cool[2]`: 隣から、敵に。
- `FLAG_DIALOGUE.M-14.cool[3]`: 燃やす。

### M-14.normal[]

- `FLAG_DIALOGUE.M-14.normal[1]`: {name2}、同期からライバルへ。いい関係に育ったな。
- `FLAG_DIALOGUE.M-14.normal[2]`: 長く一緒にいたからこそ、こうしてぶつかれる。
- `FLAG_DIALOGUE.M-14.normal[3]`: ライバル同期。悪くない響きだ、{name2}。

### M-15.composed[]

- `FLAG_DIALOGUE.M-15.composed[1]`: {name2}、今日のことは事故だ。次は容赦しない。
- `FLAG_DIALOGUE.M-15.composed[2]`: 油断した。それだけのことだ。借りはすぐ返す。
- `FLAG_DIALOGUE.M-15.composed[3]`: 一度の番狂わせで、終わったとは思うなよ、{name2}。

### M-15.ojousama[]

- `FLAG_DIALOGUE.M-15.ojousama[1]`: {name2}、このわたくしが、あなたごときに……許せませんの。
- `FLAG_DIALOGUE.M-15.ojousama[2]`: 次にお会いするときは、覚悟なさいまし。
- `FLAG_DIALOGUE.M-15.ojousama[3]`: 今日のことは、絶対に忘れませんわよ。

### M-15.polite[]

- `FLAG_DIALOGUE.M-15.polite[1]`: {name2}さん、今日の試合は私の力不足でした。次は失礼のない試合を。
- `FLAG_DIALOGUE.M-15.polite[2]`: 一からやり直します。今日のお礼は、リングで。
- `FLAG_DIALOGUE.M-15.polite[3]`: 油断ではなく、実力差。それを認めるところから始めます。

### M-15.seductive[]

- `FLAG_DIALOGUE.M-15.seductive[1]`: {name2}、いい気にならないでね。次はわたしの番よ。
- `FLAG_DIALOGUE.M-15.seductive[2]`: 一度や二度の番狂わせで、わたしを計らないで。
- `FLAG_DIALOGUE.M-15.seductive[3]`: 借り、利子つきで返すから。覚えておきなさい。

### M-15.delinquent[]

- `FLAG_DIALOGUE.M-15.delinquent[1]`: {name2}ぁ! テメー調子こいてんじゃねぇぞ!
- `FLAG_DIALOGUE.M-15.delinquent[2]`: クソが……次会ったらブッ潰す。覚えとけ、{name2}!
- `FLAG_DIALOGUE.M-15.delinquent[3]`: こんなんで終わるわけねぇだろ。次は本気だ。

### M-15.cool[]

- `FLAG_DIALOGUE.M-15.cool[1]`: {name2}……次は。
- `FLAG_DIALOGUE.M-15.cool[2]`: ……借り、返す。
- `FLAG_DIALOGUE.M-15.cool[3]`: 言葉は、いらない。

### M-15.normal[]

- `FLAG_DIALOGUE.M-15.normal[1]`: {name2}に負けた。実感が湧かないな。
- `FLAG_DIALOGUE.M-15.normal[2]`: 番狂わせ、される側になるとは。借りはすぐ返す。
- `FLAG_DIALOGUE.M-15.normal[3]`: やられたな。次までに立て直す。

### M-16.composed[]

- `FLAG_DIALOGUE.M-16.composed[1]`: {name2}、悪いが今は話せない。優しさが、今は痛い。
- `FLAG_DIALOGUE.M-16.composed[2]`: 同情はやめてくれ。お前の顔を見ると、惨めさが増すだけだ。
- `FLAG_DIALOGUE.M-16.composed[3]`: 今日だけは、ひとりにさせてくれ、{name2}。

### M-16.ojousama[]

- `FLAG_DIALOGUE.M-16.ojousama[1]`: {name2}さん、わたくしの惨めな姿を、ご覧にならないでくださいまし。
- `FLAG_DIALOGUE.M-16.ojousama[2]`: 優しくされるのが、今は耐えられませんの。
- `FLAG_DIALOGUE.M-16.ojousama[3]`: ひとりにさせてくださいませ。お願いいたしますわ。

### M-16.polite[]

- `FLAG_DIALOGUE.M-16.polite[1]`: {name2}先輩、ごめんなさい。今は近くにいないでください。
- `FLAG_DIALOGUE.M-16.polite[2]`: あなたが優しいから、余計に苦しいんです。少し距離を。
- `FLAG_DIALOGUE.M-16.polite[3]`: 私が惨めなのを、あなたに見られたくないんです。

### M-16.seductive[]

- `FLAG_DIALOGUE.M-16.seductive[1]`: {name2}、今日は近寄らないで。お願い。
- `FLAG_DIALOGUE.M-16.seductive[2]`: あなたの優しさが、いまは一番こたえるの。
- `FLAG_DIALOGUE.M-16.seductive[3]`: 見ないでよ、こんなわたしを。

### M-16.delinquent[]

- `FLAG_DIALOGUE.M-16.delinquent[1]`: {name2}! 鬱陶しい、消えてくれ!
- `FLAG_DIALOGUE.M-16.delinquent[2]`: お前の優しさが一番ムカつくんだよ、今は!
- `FLAG_DIALOGUE.M-16.delinquent[3]`: 黙ってろ! 何も言うな!

### M-16.cool[]

- `FLAG_DIALOGUE.M-16.cool[2]`: 今は、見ないで。
- `FLAG_DIALOGUE.M-16.cool[3]`: ……お願い。

### M-16.normal[]

- `FLAG_DIALOGUE.M-16.normal[1]`: {name2}、悪い。今は、お前のことすら鬱陶しい。一人にさせてくれ。
- `FLAG_DIALOGUE.M-16.normal[2]`: お前が悪いんじゃない。わかってる。でも、今は無理だ。
- `FLAG_DIALOGUE.M-16.normal[3]`: ごめんな、{name2}。少し時間をくれ。

### M-17.composed[]

- `FLAG_DIALOGUE.M-17.composed[1]`: {name2}、おめでとう。……一言だけだ。今は、それしか出てこない。
- `FLAG_DIALOGUE.M-17.composed[2]`: 俺たちは、ここで分かれたな。次は同じ場所で会おう、{name2}。
- `FLAG_DIALOGUE.M-17.composed[3]`: 前座のリングで、お前の背中を見上げる。屈辱だ。

### M-17.ojousama[]

- `FLAG_DIALOGUE.M-17.ojousama[1]`: {name2}様。おめでとうございます……心から、と言えればよろしかったのですが。
- `FLAG_DIALOGUE.M-17.ojousama[2]`: わたくしの順番は、いつ参りますの?
- `FLAG_DIALOGUE.M-17.ojousama[3]`: 同じ団体に、こんな距離がありますのね。

### M-17.polite[]

- `FLAG_DIALOGUE.M-17.polite[1]`: {name2}先輩、おめでとうございます。……心から、と言えたらよかった。
- `FLAG_DIALOGUE.M-17.polite[2]`: 一緒にここまで来たと思っていました。今日、その認識を改めました。
- `FLAG_DIALOGUE.M-17.polite[3]`: 私の出番は、いつ来るんでしょうか。

### M-17.seductive[]

- `FLAG_DIALOGUE.M-17.seductive[1]`: {name2}、おめでとう。……うそ、ちょっと言えないかも。
- `FLAG_DIALOGUE.M-17.seductive[2]`: 同じ場所にいたつもりだったのに。あなたは、もう違う場所ね。
- `FLAG_DIALOGUE.M-17.seductive[3]`: 今日は祝えそうにないわ。ごめんね、{name2}。

### M-17.delinquent[]

- `FLAG_DIALOGUE.M-17.delinquent[1]`: {name2}、テメーだけ華やかなとこ行きやがって。
- `FLAG_DIALOGUE.M-17.delinquent[2]`: こっちは前座だ。同じリングって言葉が嘘くせぇぜ。
- `FLAG_DIALOGUE.M-17.delinquent[3]`: 次は、あたしがそこに立つ。覚悟しとけよ、{name2}。

### M-17.cool[]

- `FLAG_DIALOGUE.M-17.cool[2]`: ……おめでとう。
- `FLAG_DIALOGUE.M-17.cool[3]`: 前座、苦い。

### M-17.normal[]

- `FLAG_DIALOGUE.M-17.normal[1]`: {name2}、おめでとう。……正直、複雑だ。
- `FLAG_DIALOGUE.M-17.normal[2]`: 同じ団体にいるのに、こんなに距離があるとは思わなかった。
- `FLAG_DIALOGUE.M-17.normal[3]`: 前座と本戦。今日でその差を、はっきり見せつけられた。

### M-18.composed[]

- `FLAG_DIALOGUE.M-18.composed[1]`: {name2}、二度と俺の前に立つな。
- `FLAG_DIALOGUE.M-18.composed[2]`: 話す価値もない。リングで会えば叩き潰すだけだ。
- `FLAG_DIALOGUE.M-18.composed[3]`: 同じ更衣室? 冗談じゃない。{name2}、消えろ。

### M-18.ojousama[]

- `FLAG_DIALOGUE.M-18.ojousama[1]`: {name2}、あなたとは、二度と口を利きませんわ。
- `FLAG_DIALOGUE.M-18.ojousama[2]`: 同じリングに立つのも汚らわしいですわ。
- `FLAG_DIALOGUE.M-18.ojousama[3]`: わたくしの世界から、消えなさい。

### M-18.polite[]

- `FLAG_DIALOGUE.M-18.polite[1]`: {name2}さん、長くお話ししました。でも、今日で終わりにします。
- `FLAG_DIALOGUE.M-18.polite[2]`: 言葉が通じていなかったんですね。気づくのが遅すぎました。
- `FLAG_DIALOGUE.M-18.polite[3]`: お互いの道を、別々に歩きましょう。

### M-18.seductive[]

- `FLAG_DIALOGUE.M-18.seductive[1]`: {name2}、もう無理よ、わたしたち。
- `FLAG_DIALOGUE.M-18.seductive[2]`: あなたの顔を見るのも、声を聞くのも、限界。
- `FLAG_DIALOGUE.M-18.seductive[3]`: 別々の道を行きましょ。それが大人ってものよ。

### M-18.delinquent[]

- `FLAG_DIALOGUE.M-18.delinquent[1]`: {name2}っ! テメーの顔見るたびにムカつくんだよ!
- `FLAG_DIALOGUE.M-18.delinquent[2]`: 近寄んな、ぶっ飛ばすぞ!
- `FLAG_DIALOGUE.M-18.delinquent[3]`: もう同じ屋根の下、無理だ! 出てけ!

### M-18.cool[]

- `FLAG_DIALOGUE.M-18.cool[2]`: 視界に入らないで。
- `FLAG_DIALOGUE.M-18.cool[3]`: ……言葉は、もう。

### M-18.normal[]

- `FLAG_DIALOGUE.M-18.normal[1]`: {name2}とは、もうダメだな。同じ団体にいるけど、それだけだ。
- `FLAG_DIALOGUE.M-18.normal[2]`: 言葉を交わすたびに削れる関係って、こういうことか。
- `FLAG_DIALOGUE.M-18.normal[3]`: 修復は、たぶん無理だ。それでいい。

### M-19.normal[]

- `FLAG_DIALOGUE.M-19.normal[1]`: {name2}とは、どうしても噛み合わない。今週も火花が散った。
- `FLAG_DIALOGUE.M-19.normal[2]`: {name2}と向き合うたびに、空気が張りつめる。
- `FLAG_DIALOGUE.M-19.normal[3]`: {name2}との溝は、そう簡単には埋まりそうにない。

### M-20.normal[]

- `FLAG_DIALOGUE.M-20.normal[1]`: {name2}まで引き抜かれたのか。簡単に割り切れる話じゃない。
- `FLAG_DIALOGUE.M-20.normal[2]`: {name2}の移籍を受け入れるには、まだ時間がかかりそうだ。
- `FLAG_DIALOGUE.M-20.normal[3]`: {name2}が出ていった事実は、団体の空気を確実に冷やした。

### M-21.normal[]

- `FLAG_DIALOGUE.M-21.normal[1]`: {name2}を引き留めきれなかった。残された側のわだかまりは深い。
- `FLAG_DIALOGUE.M-21.normal[2]`: {name2}を止めたかった。その気持ちだけが、余計に胸に残る。
- `FLAG_DIALOGUE.M-21.normal[3]`: {name2}に去られた悔しさは、簡単には消えそうにない。

### M-22.normal[]

- `FLAG_DIALOGUE.M-22.normal[1]`: {name2}の引退は、ただ見送るだけでは済まない喪失だった。
- `FLAG_DIALOGUE.M-22.normal[2]`: {name2}がいなくなった現実が、静かに重くのしかかる。
- `FLAG_DIALOGUE.M-22.normal[3]`: {name2}の不在は、リングの外でも大きな穴を残した。

### M-23.normal[]

- `FLAG_DIALOGUE.M-23.normal[1]`: {name2}の突然の離脱に、まだ気持ちの整理がついていない。
- `FLAG_DIALOGUE.M-23.normal[2]`: {name2}が何も告げずに去ったことが、強いしこりになって残った。
- `FLAG_DIALOGUE.M-23.normal[3]`: {name2}の離脱は、団体内に不信と動揺を広げた。

## `FLAG_MODAL_META`

- 出典: `src/ui-common.js`
- コード内コメント: 関係性フラグモーダル ドレイン (relationship-flags-spec-v1.0 §4) / モーダル種別 → 表示メタ
- 本数: 24

- `FLAG_MODAL_META.M-1.title`: 🗯️ 裏切り
- `FLAG_MODAL_META.M-2.title`: ✨ 憧れ
- `FLAG_MODAL_META.M-3.title`: 🌟 憧れ・達成
- `FLAG_MODAL_META.M-4.title`: 🕯️ 憧れ・喪失
- `FLAG_MODAL_META.M-5.title`: 💧 憧れ・幻滅
- `FLAG_MODAL_META.M-6.title`: ⚔️ 嫉妬・撃破
- `FLAG_MODAL_META.M-7.title`: 🌫️ 嫉妬・宙吊り
- `FLAG_MODAL_META.M-8.title`: 🌬️ 嫉妬・風化
- `FLAG_MODAL_META.M-9.title`: 🌬️ 嫉妬・風化
- `FLAG_MODAL_META.M-10.title`: 🌬️ 嫉妬・風化
- `FLAG_MODAL_META.M-11.title`: 🩸 嫉妬
- `FLAG_MODAL_META.M-12.title`: 🚪 出戻りの日
- `FLAG_MODAL_META.M-13.title`: 🥋 師弟
- `FLAG_MODAL_META.M-14.title`: 🔥 ライバル同期
- `FLAG_MODAL_META.M-15.title`: 🔥 番狂わせ・逆恨み
- `FLAG_MODAL_META.M-16.title`: 💔 スランプの八つ当たり
- `FLAG_MODAL_META.M-17.title`: 🪦 共闘ペアの裏切り
- `FLAG_MODAL_META.M-18.title`: ⛓️ 価値観の決裂
- `FLAG_MODAL_META.M-19.title`: ⚡ BF/Heel 衝突
- `FLAG_MODAL_META.M-20.title`: 💸 引き抜きの遺恨
- `FLAG_MODAL_META.M-21.title`: 😭 引き留め失敗の遺恨
- `FLAG_MODAL_META.M-22.title`: 🥀 引退の置き土産
- `FLAG_MODAL_META.M-23.title`: 🚪 突然離脱の波紋
- `FLAG_MODAL_META.M-24.title`: 🌫️ ロッカールームの崩壊
