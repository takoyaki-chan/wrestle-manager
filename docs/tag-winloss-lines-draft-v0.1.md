# タッグ勝敗セリフ [personality][archetype] 7×7 拡張ドラフト v0.1

TAG_MATCH_WIN_LINES / TAG_MATCH_LOSS_LINES を、現行の personality 単軸（口調崩壊あり）から
[personality][archetype] の 7×7 マトリクス（各セル2本）へ拡張したもの。実装前の草案。

## 文体方針（3行）
- personality＝感情の中身（勝利の喜び方／敗北の受け止め方）、archetype＝言い方（語尾・一人称・呼称）の二層で書き分ける。勝敗の温度は性格が、口調は完全にアーキタイプが支配する。
- 全行に `{partner}` 必須。呼称はアーキタイプで変える（polite/ojousama＝「{partner}さん」、delinquent＝呼び捨て＋一人称「あたし」、cool＝短文、composed＝「…〜だよ」の緩い間合い）。「俺」・絵文字・{partner}以外のプレースホルダは禁止。
- 敗北は痛みから逃げない。ただし棒読みの「くやしい…」テンプレは使わず、その子の性格（earnest＝自責 / bold＝倍返し宣言 / easygoing＝軽く流して悔しさが滲む / emotional×composed＝熱を呑み込んだ圧縮）を口調に乗せて言わせる。

---

## TAG_MATCH_WIN_LINES

### normal（素直な喜びと感謝）
- normal: 「{partner}、ありがとう。二人だから勝てたよ。」「やった…{partner}となら勝てるって、信じてた！」
- polite: 「{partner}さん、ありがとうございました。二人で掴んだ勝ちです。」「{partner}さんを信じてよかったです…ちゃんと、勝てました！」
- seductive: 「{partner}…ありがとう。二人でつかんだ勝ち、悪くないでしょ？」「ふふ、{partner}となら負ける気がしないわ。」
- delinquent: 「{partner}、ありがとな！ 二人だから勝てたんだ！」「やったぜ{partner}！ あたしら、いいコンビだろ？」
- ojousama: 「{partner}さん、ありがとうございますわ。二人で掴んだ勝利ですのね。」「{partner}さんを信じておりまして、本当によかったですわ。」
- cool: 「…{partner}、ありがとう。二人で、勝った。」「…{partner}となら、勝てる。」
- composed: 「…{partner}、ありがとう。二人だから、勝てたね。」「…{partner}となら勝てる気がしてた。…当たったよ。」

### earnest（実直な感謝・信頼を勝ちに繋いだ）
- normal: 「{partner}、あなたを信じてよかった。この勝ち、二人のものだよ。」「{partner}が繋いでくれたから…最後まで諦めずに済んだ。」
- polite: 「{partner}さんのおかげです。本当に、ありがとうございました。」「{partner}さんが繋いでくれたバトン…無駄にせずに済みました。」
- seductive: 「{partner}…あなたを信じてよかった。この勝ちは二人のものよ。」「{partner}、あなたが繋いでくれたから…最後まで折れずにいられたの。」
- delinquent: 「{partner}、お前を信じてよかった。この勝ちは二人のもんだ。」「{partner}が繋いでくれたから…あたし、最後まで踏ん張れた。」
- ojousama: 「{partner}さんを信じておりまして、本当によかったですわ。」「{partner}さんが繋いでくださったからこそ、掴めた勝利ですの。」
- cool: 「…{partner}。信じて、よかった。この勝ちは、二人の。」「…{partner}が繋いだ。だから、勝てた。」
- composed: 「…{partner}、信じてよかったよ。この勝ちは、二人のものだね。」「…{partner}が繋いでくれたから、最後まで立てた。ありがとう。」

### bold（強気・二人揃えば無敵という誇り）
- normal: 「やったな{partner}！ 二人揃えば、負ける気がしないよ！」「見たか、これが{partner}と私のタッグの力だ！」
- polite: 「やりましたね{partner}さん！ 二人揃えば負けません！」「見ましたか、これが{partner}さんと私のタッグです！」
- seductive: 「やったわね{partner}。二人揃えば、負ける気なんてしないわ。」「見た？ これが{partner}とわたしのタッグよ。」
- delinquent: 「やったな{partner}！ あたしらが組みゃ、負ける気がしねえ！」「見たかよ！ {partner}とあたしのタッグ、最強だぜ！」
- ojousama: 「おやりになりましたわね{partner}さん！ 二人揃えば負けませんわ！」「ご覧になって？ {partner}さんとわたくしのタッグですのよ！」
- cool: 「…やったな、{partner}。二人なら、負けない。」「…見たか。{partner}と、あたしのタッグだ。」
- composed: 「…やったね、{partner}。二人なら、負ける気がしないよ。」「…見た？ {partner}と組めば、こんなもんさ。」

### easygoing（軽く楽しく・息ぴったりを噛みしめる）
- normal: 「{partner}〜お疲れさま！ 私たち、息ぴったりだったね〜」「勝っちゃった。{partner}と組むの、やっぱ楽しい〜」
- polite: 「{partner}さん、お疲れさまです♪ 息ぴったりでしたね〜」「勝っちゃいました♪ {partner}さんと組めて、楽しかったです〜」
- seductive: 「{partner}〜お疲れさま♪ 息ぴったりだったでしょ？」「勝っちゃった♪ やっぱり{partner}と組むと、楽しいわ〜」
- delinquent: 「{partner}〜お疲れさん！ あたしら息ぴったりだったろ？」「勝っちゃったぜ♪ {partner}と組むの、やっぱ楽しいわ〜」
- ojousama: 「{partner}さん、お疲れさまですわ♪ 息ぴったりでしたわね〜」「勝ってしまいましたわ♪ {partner}さんと組むの、楽しいですの〜」
- cool: 「…{partner}、お疲れ。息、ぴったりだった。」「…勝った。{partner}と組むの、好き。」
- composed: 「…{partner}、お疲れさま。息、ぴったりだったね〜」「…勝っちゃった。{partner}と組むの、やっぱいいな〜」

### quiet（短く、重い感謝）
- normal: 「…{partner}、ありがとう。」「…{partner}と、だから勝てた。」
- polite: 「…{partner}さん、ありがとうございました。」「…{partner}さんと、だから勝てました。」
- seductive: 「…{partner}、ありがとう。」「…{partner}と、だから…ね。」
- delinquent: 「…{partner}、恩に着る。」「…{partner}と、だから勝てた。」
- ojousama: 「…{partner}さん、感謝いたしますわ。」「…{partner}さんと、だからですの。」
- cool: 「……{partner}、ありがとう。」「……{partner}と、だから。」
- composed: 「…{partner}、ありがとう。二人だから、だね。」「…{partner}と、だから勝てた。それだけだよ。」

### shy（内気・どもりながらの感謝）
- normal: 「{partner}…ほ、本当に…ありがとう…！」「わ、私…頑張れた…{partner}のおかげ…！」
- polite: 「{partner}さん…ほ、本当に…ありがとうございました…！」「わ、私…頑張れました…{partner}さんのおかげです…！」
- seductive: 「{partner}…う、嬉しい…二人で、勝てて…わ…」「{partner}となら…だ、大丈夫って…信じてた、の…」
- delinquent: 「{partner}…あ、ありがとな…！ あたし、頑張れた…！」「ぜ、全部…{partner}のおかげ、だ…！」
- ojousama: 「{partner}さん…あ、ありがとうございますわ…！」「わ、私…頑張れましたわ…{partner}さんのおかげで…！」
- cool: 「…っ、{partner}…ありがとう…」「…わ、私、頑張れた…{partner}と…」
- composed: 「…{partner}、あ、ありがとう…二人で、勝てたね…」「…わ、私、頑張れたよ…{partner}のおかげ…」

### emotional（熱・涙・約束）
- normal: 「{partner}っ…！ ありがとう…二人で、勝ったよ…！」「絶対勝つって、約束したもんね…{partner}…っ！」
- polite: 「{partner}さんっ…！ ありがとうございます…二人で、勝てました…！」「絶対勝つって約束…守れましたね、{partner}さん…っ！」
- seductive: 「{partner}っ…！ やったわ…二人で、勝ったのよ…！」「約束…守れたわね、{partner}…っ！」
- delinquent: 「{partner}っ…！ やったぜ…二人で、勝ったんだ…！」「絶対勝つって言ったろ…！ な、{partner}…っ！」
- ojousama: 「{partner}さんっ…！ やりましたわ…二人で、勝ったのですわ…！」「約束、守れましたわね…{partner}さん…っ！」
- cool: 「…っ、{partner}…勝った。二人で。」「…約束、守った。{partner}…っ。」
- composed: 「…{partner}。二人で、勝ったよ。…約束、守れたね。」「…言葉はいらない。{partner}、ありがとう。…それだけだ。」

---

## TAG_MATCH_LOSS_LINES

### normal（素直に詫び、次を見る）
- normal: 「{partner}…ごめん。私が決めきれてたら…」「{partner}、悔しいね。次は絶対、勝とう。」
- polite: 「{partner}さん…ごめんなさい。私が決めきれていれば…」「{partner}さん、次は必ず勝ちましょう。」
- seductive: 「{partner}…ごめんなさい。わたしが決めきれてたら…」「悔しいわね、{partner}。次は絶対、勝つわよ。」
- delinquent: 「{partner}…悪い。あたしが決めてりゃな…」「{partner}、悔しいな。次は絶対、勝とうぜ。」
- ojousama: 「{partner}さん…ごめんなさいまし。わたくしが決めきれていれば…」「{partner}さん、次こそは必ず勝ちましょうね。」
- cool: 「…{partner}、ごめん。決めきれ、なかった。」「…{partner}、次は。勝つ。」
- composed: 「…{partner}、ごめん。決めきれなかったね。」「…悔しいけど、{partner}。次までに、詰めようか。」

### earnest（自責・パートナーを勝たせられなかった）
- normal: 「{partner}…私の力不足だ。あなたを勝たせてあげられなかった…」「ここまで繋いでくれたのに…{partner}、ごめん。」
- polite: 「{partner}さん、申し訳ありませんでした…私の力不足です。」「{partner}さんを勝たせてあげられなくて…本当にすみません…！」
- seductive: 「{partner}…わたしの力不足よ。あなたを勝たせられなかった…」「ここまで繋いでくれたのに…ごめんなさい、{partner}。」
- delinquent: 「{partner}…あたしの力不足だ。お前を勝たせてやれなかった…」「ここまで繋いでくれたのに…悪い、{partner}。」
- ojousama: 「{partner}さん、申し訳ございませんでした…わたくしの力不足ですわ。」「{partner}さんを勝たせてさしあげられず…本当にごめんなさい…！」
- cool: 「…{partner}、ごめん。あたしの、力不足。」「…繋いでくれたのに。{partner}、すまない。」
- composed: 「…{partner}、ごめん。あたしの力不足だ。」「…ここまで繋いでくれたのにな。{partner}、すまない。」

### bold（悔しさを再戦宣言に変える）
- normal: 「くそっ…{partner}、悪い。私のミスだ。次は絶対だ。」「負けたままでいられるか…{partner}、次は倍返しだ！」
- polite: 「{partner}さん、私のミスです。ですが…次は絶対に返します。」「このままでは終われません。{partner}さん、次は倍返しです！」
- seductive: 「わたしのミスよ、{partner}…悪いわね。でも次は絶対、返すわ。」「このままじゃ終わらせない。{partner}、次は倍返しよ。」
- delinquent: 「くそっ…あたしのミスだ、{partner}。次は絶対、返してやる。」「このまま終われるかよ…{partner}、次は倍返しだ！」
- ojousama: 「わたくしのミスですわ、{partner}さん。ですが次は必ず返しますの。」「このままでは終われませんわ。{partner}さん、次は倍返しですわ！」
- cool: 「…あたしのミスだ、{partner}。次は、返す。」「…このまま終わらない。{partner}、倍返しだ。」
- composed: 「…あたしのミスだ、{partner}。でも、次はこうはいかないよ。」「…このまま終わる気はない。{partner}、次は返すから。」

### easygoing（軽く流しつつ、悔しさが滲む）
- normal: 「{partner}〜ごめんね…私、決められちゃった…」「あちゃ〜負けちゃった…でも{partner}、次は頑張るね。」
- polite: 「{partner}さん…ごめんなさい、私、決められちゃいました…」「あちゃ〜負けちゃいましたね…次は頑張ります、{partner}さん。」
- seductive: 「{partner}〜ごめんね…わたし、決められちゃった…」「あーあ、負けちゃった…でも{partner}、次はやるわよ。」
- delinquent: 「{partner}〜わりぃ…あたし、決められちった…」「あちゃ〜負けたか…でも{partner}、次は頑張るぜ。」
- ojousama: 「{partner}さん…ごめんなさい、決められてしまいましたわ…」「あらら、負けてしまいましたわ…でも次は頑張りますの、{partner}さん。」
- cool: 「…{partner}、ごめん。決められ、ちゃった。」「…負けちゃった。{partner}、次は。」
- composed: 「…{partner}、ごめんね。決められちゃった…」「…あ〜あ、負けちゃった。まあ、次があるよ、{partner}。」

### quiet（短い詫び、言葉少なに痛む）
- normal: 「…{partner}、ごめん。」「…悔しい。{partner}にも、申し訳ない。」
- polite: 「…{partner}さん、ごめんなさい。」「…申し訳、ありませんでした。{partner}さん。」
- seductive: 「…{partner}、ごめんなさい。」「…悔しい。{partner}にも…ね。」
- delinquent: 「…{partner}、悪い。」「…悔しい。{partner}にも、詫びる。」
- ojousama: 「…{partner}さん、ごめんなさい。」「…申し訳ありませんわ。{partner}さん。」
- cool: 「……{partner}、ごめん。」「……悔しい。{partner}にも。」
- composed: 「…{partner}、ごめん。」「…悔しいな。{partner}にも、悪い。」

### shy（どもりながらの自責）
- normal: 「{partner}…ご、ごめん…私のせいで…」「つ、次は…絶対、{partner}を勝たせる…！」
- polite: 「{partner}さん…ご、ごめんなさい…私のせいで…」「つ、次は…絶対…{partner}さんを勝たせます…！」
- seductive: 「{partner}…ご、ごめんね…わたしのせいで…」「つ、次は…絶対…{partner}を、勝たせるわ…！」
- delinquent: 「{partner}…わ、悪い…あたしのせいで…」「つ、次は…絶対…{partner}を勝たせる…！」
- ojousama: 「{partner}さん…ご、ごめんなさいまし…わたくしのせいで…」「つ、次は…必ず…{partner}さんを勝たせますわ…！」
- cool: 「…っ、{partner}…ごめん…私の、せいで…」「…つ、次は…{partner}を、勝たせる…」
- composed: 「…{partner}、ご、ごめん…私のせいで…」「…つ、次は、ちゃんと…{partner}を勝たせるよ…」

### emotional（熱く詫びる／composed は熱を呑み込む）
- normal: 「{partner}っ…ごめんっ…ごめんねっ…！」「次は絶対…絶対勝つからっ…！ {partner}…！」
- polite: 「{partner}さんっ…ごめんなさいっ…私のせいでっ…！」「次は絶対…勝ちますからっ…！ {partner}さん…！」
- seductive: 「{partner}っ…ごめんっ…わたしのせいでっ…！」「次は絶対、勝つわっ…！ {partner}…！」
- delinquent: 「{partner}っ…わりぃっ…あたしのせいでっ…！」「次は絶対、勝つからっ…！ な、{partner}…！」
- ojousama: 「{partner}さんっ…ごめんなさいっ…わたくしのせいでっ…！」「次は絶対、勝ちますわっ…！ {partner}さん…！」
- cool: 「…っ、{partner}…ごめん。」「…次は、勝つ。絶対。{partner}…っ。」
- composed: 「…{partner}、悪い。あたしが弱かった。…それだけだ。」「…次は、こうはいかない。{partner}、もう一回だけ付き合ってくれ。」
