# 挑戦試合(直訴・遠征)

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `CHALLENGE_LINES`

- 出典: `src/data.js`
- コード内コメント: 挑戦試合セリフ 全34セル（Keisuke 承認済み最終版 2026-07-25） / キー: `${archetype}_${personality}` / 場面: petition(直訴) / sendoff(YES直後の返事) / win(勝利報告) / lose(敗戦報告) / {org} は実行時に相手団体名へ置換するプレースホルダ
- 本数: 408

### polite_earnest.petition[]

- `CHALLENGE_LINES.polite_earnest.petition[1]`: 社長、ご迷惑は承知しています。それでも、あの方とやらせていただけませんか。
- `CHALLENGE_LINES.polite_earnest.petition[2]`: 不躾なお願いだと分かっています。……あの方と、闘わせてください。
- `CHALLENGE_LINES.polite_earnest.petition[3]`: 社長。どうかお願いします。あの方とだけは、やらせていただきたくて。

### polite_earnest.sendoff[]

- `CHALLENGE_LINES.polite_earnest.sendoff[1]`: ありがとうございます。……このご恩は、必ず結果でお返しします。
- `CHALLENGE_LINES.polite_earnest.sendoff[2]`: 許していただけて、本当に嬉しいです。行ってまいります。
- `CHALLENGE_LINES.polite_earnest.sendoff[3]`: わがままを聞いていただいて、ありがとうございます。精一杯やってきます。

### polite_earnest.win[]

- `CHALLENGE_LINES.polite_earnest.win[1]`: 勝ちました。……社長、ありがとうございました。
- `CHALLENGE_LINES.polite_earnest.win[2]`: 無理を聞いていただいた甲斐が、ありました。本当にありがとうございます。
- `CHALLENGE_LINES.polite_earnest.win[3]`: 勝てました。……ご期待に応えられて、ほっとしています。

### polite_earnest.lose[]

- `CHALLENGE_LINES.polite_earnest.lose[1]`: ……負けました。申し訳ありません。
- `CHALLENGE_LINES.polite_earnest.lose[2]`: 勝てませんでした。……社長の顔に、泥を塗ってしまいました。
- `CHALLENGE_LINES.polite_earnest.lose[3]`: すみません。……許していただいたのに、この結果で。

### polite_normal.petition[]

- `CHALLENGE_LINES.polite_normal.petition[1]`: 社長、お願いがあります。あの方と、やらせていただけませんか。
- `CHALLENGE_LINES.polite_normal.petition[2]`: どうしても、あの方とやってみたいんです。……お願いします。
- `CHALLENGE_LINES.polite_normal.petition[3]`: 叶うなら、あの方と。……我慢できなくて、言いに来ました。

### polite_normal.sendoff[]

- `CHALLENGE_LINES.polite_normal.sendoff[1]`: ありがとうございます！ ……行ってまいります。
- `CHALLENGE_LINES.polite_normal.sendoff[2]`: ありがとうございます。必ず、勝ってきます。
- `CHALLENGE_LINES.polite_normal.sendoff[3]`: 嬉しいです。……精一杯やってきますね。

### polite_normal.win[]

- `CHALLENGE_LINES.polite_normal.win[1]`: 勝ちました。ありがとうございました。
- `CHALLENGE_LINES.polite_normal.win[2]`: やりました！ ……見ていてくださいましたか。
- `CHALLENGE_LINES.polite_normal.win[3]`: 勝てました。……言い出して、よかったです。

### polite_normal.lose[]

- `CHALLENGE_LINES.polite_normal.lose[1]`: ……負けました。すみません。
- `CHALLENGE_LINES.polite_normal.lose[2]`: 悔しいです。……本当に、悔しくて。
- `CHALLENGE_LINES.polite_normal.lose[3]`: 勝てませんでした。……申し訳ありません。

### polite_shy.petition[]

- `CHALLENGE_LINES.polite_shy.petition[1]`: あの……社長。あの方と、やらせていただけませんか。
- `CHALLENGE_LINES.polite_shy.petition[2]`: 言いにくいのですが……どうしても、あの方と。
- `CHALLENGE_LINES.polite_shy.petition[3]`: すみません、わがままです。それでも、お願いしたくて。

### polite_shy.sendoff[]

- `CHALLENGE_LINES.polite_shy.sendoff[1]`: あ……ありがとうございます。行って、きます。
- `CHALLENGE_LINES.polite_shy.sendoff[2]`: よろしいのですか……。ありがとうございます。
- `CHALLENGE_LINES.polite_shy.sendoff[3]`: すみません、ありがとうございます。頑張ります。

### polite_shy.win[]

- `CHALLENGE_LINES.polite_shy.win[1]`: あの……勝てました。ありがとうございました。
- `CHALLENGE_LINES.polite_shy.win[2]`: 勝ちました。……信じてくださって、嬉しかったです。
- `CHALLENGE_LINES.polite_shy.win[3]`: わたし、勝てたんですね……。ありがとうございます。

### polite_shy.lose[]

- `CHALLENGE_LINES.polite_shy.lose[1]`: あの……負けて、しまいました。すみません。
- `CHALLENGE_LINES.polite_shy.lose[2]`: わがままを言ったのに……申し訳ありません。
- `CHALLENGE_LINES.polite_shy.lose[3]`: 勝てませんでした。……顔向けできないです。

### polite_easygoing.petition[]

- `CHALLENGE_LINES.polite_easygoing.petition[1]`: 社長、あの方とやってみたいのですけれど、だめでしょうか。
- `CHALLENGE_LINES.polite_easygoing.petition[2]`: あの方と一度、やってみたいんです。だめならいいので。
- `CHALLENGE_LINES.polite_easygoing.petition[3]`: ふと思ったんです。あの方とやってみたいなって。

### polite_easygoing.sendoff[]

- `CHALLENGE_LINES.polite_easygoing.sendoff[1]`: ありがとうございます。では、のんびり行ってきますね。
- `CHALLENGE_LINES.polite_easygoing.sendoff[2]`: わあ、いいんですか。ありがとうございます。
- `CHALLENGE_LINES.polite_easygoing.sendoff[3]`: ありがとうございます。楽しんできますね。

### polite_easygoing.win[]

- `CHALLENGE_LINES.polite_easygoing.win[1]`: 勝てちゃいました。ありがとうございます。
- `CHALLENGE_LINES.polite_easygoing.win[2]`: うまくいきました。言ってみるものですね。
- `CHALLENGE_LINES.polite_easygoing.win[3]`: 勝ちましたよ。……許してくださって、よかったです。

### polite_easygoing.lose[]

- `CHALLENGE_LINES.polite_easygoing.lose[1]`: 負けちゃいました。すみません、でも楽しかったです。
- `CHALLENGE_LINES.polite_easygoing.lose[2]`: だめでした……。あ、でもちゃんと悔しいんですよ。
- `CHALLENGE_LINES.polite_easygoing.lose[3]`: 負けました。でも次はいけそうな気がします。

### polite_quiet.petition[]

- `CHALLENGE_LINES.polite_quiet.petition[1]`: 社長。……あの方と、お願いします。
- `CHALLENGE_LINES.polite_quiet.petition[2]`: 一つだけ。あの方と、やらせてください。
- `CHALLENGE_LINES.polite_quiet.petition[3]`: ……お願いがあります。あの方と。

### polite_quiet.sendoff[]

- `CHALLENGE_LINES.polite_quiet.sendoff[1]`: ……ありがとうございます。行ってまいります。
- `CHALLENGE_LINES.polite_quiet.sendoff[2]`: 感謝します。……それだけです。
- `CHALLENGE_LINES.polite_quiet.sendoff[3]`: はい。……無駄にはしません。

### polite_quiet.win[]

- `CHALLENGE_LINES.polite_quiet.win[1]`: ……勝ちました。ありがとうございました。
- `CHALLENGE_LINES.polite_quiet.win[2]`: 終わりました。……勝てました。
- `CHALLENGE_LINES.polite_quiet.win[3]`: ご報告です。……勝ちました。

### polite_quiet.lose[]

- `CHALLENGE_LINES.polite_quiet.lose[1]`: ……負けました。申し訳ありません。
- `CHALLENGE_LINES.polite_quiet.lose[2]`: 勝てませんでした。……それだけです。
- `CHALLENGE_LINES.polite_quiet.lose[3]`: ……すみません。言葉が、ありません。

### polite_bold.petition[]

- `CHALLENGE_LINES.polite_bold.petition[1]`: 社長、あの方とやります。許可をください。
- `CHALLENGE_LINES.polite_bold.petition[2]`: 決めてきました。あの方と、やらせてください。
- `CHALLENGE_LINES.polite_bold.petition[3]`: 必ず勝ちます。あの方との試合、通してください。

### polite_bold.sendoff[]

- `CHALLENGE_LINES.polite_bold.sendoff[1]`: ありがとうございます。勝って戻ります。
- `CHALLENGE_LINES.polite_bold.sendoff[2]`: はい、必ず結果でお返しします。
- `CHALLENGE_LINES.polite_bold.sendoff[3]`: 感謝します。任せてください。

### polite_bold.win[]

- `CHALLENGE_LINES.polite_bold.win[1]`: 勝ちました。言った通りです。
- `CHALLENGE_LINES.polite_bold.win[2]`: 約束、果たしました。ありがとうございます。
- `CHALLENGE_LINES.polite_bold.win[3]`: 勝ちましたよ、社長。まだいけます。

### polite_bold.lose[]

- `CHALLENGE_LINES.polite_bold.lose[1]`: 負けました。……大きなことを言ったのに。
- `CHALLENGE_LINES.polite_bold.lose[2]`: 申し訳ありません。今回は、私の力不足です。
- `CHALLENGE_LINES.polite_bold.lose[3]`: 悔しいです。もう一度、機会をください。

### standard_normal.petition[]

- `CHALLENGE_LINES.standard_normal.petition[1]`: 社長、お願いがあります。あの人とやらせてください。
- `CHALLENGE_LINES.standard_normal.petition[2]`: どうしても、あの人とやりたいんです。……お願いします。
- `CHALLENGE_LINES.standard_normal.petition[3]`: わがままだとは分かってます。それでも、組んでほしいんです。

### standard_normal.sendoff[]

- `CHALLENGE_LINES.standard_normal.sendoff[1]`: ありがとうございます！ ……行ってきます。
- `CHALLENGE_LINES.standard_normal.sendoff[2]`: ありがとうございます。必ず、勝ってきます。
- `CHALLENGE_LINES.standard_normal.sendoff[3]`: ……ありがとうございます。やってきます。

### standard_normal.win[]

- `CHALLENGE_LINES.standard_normal.win[1]`: 勝ちました。……ありがとうございました。
- `CHALLENGE_LINES.standard_normal.win[2]`: やりました！ ……見ててくれましたか。
- `CHALLENGE_LINES.standard_normal.win[3]`: 勝てました。……無駄にしなくて、よかった。

### standard_normal.lose[]

- `CHALLENGE_LINES.standard_normal.lose[1]`: ……負けました。すみません。
- `CHALLENGE_LINES.standard_normal.lose[2]`: 悔しいです。……本当に、悔しい。
- `CHALLENGE_LINES.standard_normal.lose[3]`: 勝てませんでした。……申し訳ないです。

### standard_earnest.petition[]

- `CHALLENGE_LINES.standard_earnest.petition[1]`: 社長、迷惑をかけるのは分かってます。それでも、あの人とやらせてください。
- `CHALLENGE_LINES.standard_earnest.petition[2]`: 半端な気持ちじゃありません。……あの人と、闘わせてください。
- `CHALLENGE_LINES.standard_earnest.petition[3]`: お願いします。この一戦だけは、逃げたくないんです。

### standard_earnest.sendoff[]

- `CHALLENGE_LINES.standard_earnest.sendoff[1]`: ありがとうございます。……この決断、無駄にしません。
- `CHALLENGE_LINES.standard_earnest.sendoff[2]`: 許してもらった分は、結果で返します。行ってきます。
- `CHALLENGE_LINES.standard_earnest.sendoff[3]`: ありがとうございます。……背負って、行ってきます。

### standard_earnest.win[]

- `CHALLENGE_LINES.standard_earnest.win[1]`: 勝ちました。……社長、ありがとうございました。
- `CHALLENGE_LINES.standard_earnest.win[2]`: 約束は守れました。……ほっとしています。
- `CHALLENGE_LINES.standard_earnest.win[3]`: 勝てました。……送り出してもらった甲斐が、ありました。

### standard_earnest.lose[]

- `CHALLENGE_LINES.standard_earnest.lose[1]`: ……負けました。すみませんでした。
- `CHALLENGE_LINES.standard_earnest.lose[2]`: 言い出したのは私です。……この結果は、全部私の責任です。
- `CHALLENGE_LINES.standard_earnest.lose[3]`: 悔しいです。……それ以上に、申し訳ないです。

### standard_bold.petition[]

- `CHALLENGE_LINES.standard_bold.petition[1]`: 社長、あの人とやらせてください。勝てます。
- `CHALLENGE_LINES.standard_bold.petition[2]`: あの人とやりたいんです。……今なら、いけると思ってます。
- `CHALLENGE_LINES.standard_bold.petition[3]`: 待ってても回ってこないので、言いに来ました。組んでください。

### standard_bold.sendoff[]

- `CHALLENGE_LINES.standard_bold.sendoff[1]`: ありがとうございます! 勝ってきますから。
- `CHALLENGE_LINES.standard_bold.sendoff[2]`: ありがとうございます。……見ててください。
- `CHALLENGE_LINES.standard_bold.sendoff[3]`: 話が早くて助かります。行ってきます。

### standard_bold.win[]

- `CHALLENGE_LINES.standard_bold.win[1]`: 勝ちました! ……言った通りでしょう。
- `CHALLENGE_LINES.standard_bold.win[2]`: 勝ちました。社長、ありがとうございました。
- `CHALLENGE_LINES.standard_bold.win[3]`: やりました。……次も、任せてください。

### standard_bold.lose[]

- `CHALLENGE_LINES.standard_bold.lose[1]`: 負けました。……悔しいです。
- `CHALLENGE_LINES.standard_bold.lose[2]`: 今日は届きませんでした。……次は勝ちます。
- `CHALLENGE_LINES.standard_bold.lose[3]`: 悪いわね、負けた。でも、やってよかったよ。

### standard_easygoing.petition[]

- `CHALLENGE_LINES.standard_easygoing.petition[1]`: 社長、あの人とやってみたいんですけど、どうですか。
- `CHALLENGE_LINES.standard_easygoing.petition[2]`: だめならいいんです。でも、あの人とやりたくて。
- `CHALLENGE_LINES.standard_easygoing.petition[3]`: なんとなく、あの人とやりたくなっちゃって。

### standard_easygoing.sendoff[]

- `CHALLENGE_LINES.standard_easygoing.sendoff[1]`: ありがとうございます。じゃあ、行ってきますね。
- `CHALLENGE_LINES.standard_easygoing.sendoff[2]`: わ、いいんですか。ありがとうございます。
- `CHALLENGE_LINES.standard_easygoing.sendoff[3]`: ありがとうございます。楽しんできます。

### standard_easygoing.win[]

- `CHALLENGE_LINES.standard_easygoing.win[1]`: 勝てました。案外、いけるもんですね。
- `CHALLENGE_LINES.standard_easygoing.win[2]`: やった、勝ちました。言ってよかったです。
- `CHALLENGE_LINES.standard_easygoing.win[3]`: 勝ちましたよ。ちゃんと帰ってきました。

### standard_easygoing.lose[]

- `CHALLENGE_LINES.standard_easygoing.lose[1]`: 負けちゃいました。ごめんなさい。
- `CHALLENGE_LINES.standard_easygoing.lose[2]`: だめでした。まあ、また誘えばいいですよね。
- `CHALLENGE_LINES.standard_easygoing.lose[3]`: 負けました。でも、後悔はしてないです。

### standard_quiet.petition[]

- `CHALLENGE_LINES.standard_quiet.petition[1]`: 社長。あの人と、やらせてください。
- `CHALLENGE_LINES.standard_quiet.petition[2]`: ……お願いがあります。あの人です。
- `CHALLENGE_LINES.standard_quiet.petition[3]`: 一つだけ。あの人と、組んでください。

### standard_quiet.sendoff[]

- `CHALLENGE_LINES.standard_quiet.sendoff[1]`: ……ありがとうございます。行ってきます。
- `CHALLENGE_LINES.standard_quiet.sendoff[2]`: はい。……無駄にはしません。
- `CHALLENGE_LINES.standard_quiet.sendoff[3]`: ……もう、迷いはないです。

### standard_quiet.win[]

- `CHALLENGE_LINES.standard_quiet.win[1]`: ……勝ちました。
- `CHALLENGE_LINES.standard_quiet.win[2]`: 勝ちです。……以上です。
- `CHALLENGE_LINES.standard_quiet.win[3]`: 勝ちました。……それだけ、伝えたくて。

### standard_quiet.lose[]

- `CHALLENGE_LINES.standard_quiet.lose[1]`: ……負けです。ごめんなさい。
- `CHALLENGE_LINES.standard_quiet.lose[2]`: 負けました。……悔しい、とだけ。
- `CHALLENGE_LINES.standard_quiet.lose[3]`: ……次は、違います。

### standard_shy.petition[]

- `CHALLENGE_LINES.standard_shy.petition[1]`: あの……社長。ひとつ、お願いが……。
- `CHALLENGE_LINES.standard_shy.petition[2]`: 言うか迷ったんですけど……あの人と、やりたいです。
- `CHALLENGE_LINES.standard_shy.petition[3]`: わがままですよね。……でも、どうしても。

### standard_shy.sendoff[]

- `CHALLENGE_LINES.standard_shy.sendoff[1]`: あ……ありがとうございます。行ってきます。
- `CHALLENGE_LINES.standard_shy.sendoff[2]`: 本当に、いいんですか……。嬉しいです。
- `CHALLENGE_LINES.standard_shy.sendoff[3]`: ありがとうございます。……頑張り、ます。

### standard_shy.win[]

- `CHALLENGE_LINES.standard_shy.win[1]`: あの……勝てました。
- `CHALLENGE_LINES.standard_shy.win[2]`: 勝ちました。……信じてもらえて、嬉しかったです。
- `CHALLENGE_LINES.standard_shy.win[3]`: 勝ちました。……こんなこと、初めてです。

### standard_shy.lose[]

- `CHALLENGE_LINES.standard_shy.lose[1]`: ……負けました。ごめんなさい。
- `CHALLENGE_LINES.standard_shy.lose[2]`: 言い出したの、わたしなのに……すみません。
- `CHALLENGE_LINES.standard_shy.lose[3]`: 顔、上げられないです。……ごめんなさい。

### standard_emotional.petition[]

- `CHALLENGE_LINES.standard_emotional.petition[1]`: 社長! あの人とやりたいんです、お願いします!
- `CHALLENGE_LINES.standard_emotional.petition[2]`: もう我慢できないんです。あの人と、やらせてください。
- `CHALLENGE_LINES.standard_emotional.petition[3]`: ずっと考えてました。……お願いします、どうしても!

### standard_emotional.sendoff[]

- `CHALLENGE_LINES.standard_emotional.sendoff[1]`: ありがとうございます! 絶対、勝ってきます!
- `CHALLENGE_LINES.standard_emotional.sendoff[2]`: うれしい……ありがとうございます。行ってきます!
- `CHALLENGE_LINES.standard_emotional.sendoff[3]`: 泣きそうです。……ありがとうございます!

### standard_emotional.win[]

- `CHALLENGE_LINES.standard_emotional.win[1]`: 勝ちました! 社長、勝ちましたよ!
- `CHALLENGE_LINES.standard_emotional.win[2]`: やった……! 見ててくれましたか!
- `CHALLENGE_LINES.standard_emotional.win[3]`: 勝てた……。うれしくて、声が震えてます。

### standard_emotional.lose[]

- `CHALLENGE_LINES.standard_emotional.lose[1]`: 負けました……。ごめんなさい、悔しいです。
- `CHALLENGE_LINES.standard_emotional.lose[2]`: くやしい……! ごめんなさい、涙が止まらなくて。
- `CHALLENGE_LINES.standard_emotional.lose[3]`: 勝てなかった……。あんなに、お願いしたのに。

### composed_normal.petition[]

- `CHALLENGE_LINES.composed_normal.petition[1]`: 社長。……頼みがあります。あの人と、やらせてください。
- `CHALLENGE_LINES.composed_normal.petition[2]`: あの人と、一度やってみたい。……それだけなんです。
- `CHALLENGE_LINES.composed_normal.petition[3]`: 無茶を言ってる自覚はあります。……それでも、お願いします。

### composed_normal.sendoff[]

- `CHALLENGE_LINES.composed_normal.sendoff[1]`: ありがとうございます。……行ってきます。
- `CHALLENGE_LINES.composed_normal.sendoff[2]`: 感謝します。……ちゃんと、勝って帰りますよ。
- `CHALLENGE_LINES.composed_normal.sendoff[3]`: ……助かります。任せてください。

### composed_normal.win[]

- `CHALLENGE_LINES.composed_normal.win[1]`: 勝ちました。……ありがとうございました。
- `CHALLENGE_LINES.composed_normal.win[2]`: ……ま、こんなものかな。社長、感謝します。
- `CHALLENGE_LINES.composed_normal.win[3]`: 勝てました。……言い出して、よかった。

### composed_normal.lose[]

- `CHALLENGE_LINES.composed_normal.lose[1]`: ……負けました。すみません。
- `CHALLENGE_LINES.composed_normal.lose[2]`: 完敗です。……悔しいですね、やっぱり。
- `CHALLENGE_LINES.composed_normal.lose[3]`: 勝てませんでした。……ご迷惑を、かけました。

### composed_emotional.petition[]

- `CHALLENGE_LINES.composed_emotional.petition[1]`: 社長。…あの人のことが、まだ腹の底に残ってます。やらせてください。
- `CHALLENGE_LINES.composed_emotional.petition[2]`: …ずっと呑み込んできました。もう限界です。あいつと、やらせてください。
- `CHALLENGE_LINES.composed_emotional.petition[3]`: 社長。…静かに言いますけど、本気です。あの人と、やらせてください。

### composed_emotional.sendoff[]

- `CHALLENGE_LINES.composed_emotional.sendoff[1]`: ありがとうございます。…この熱が冷めないうちに、行ってきます。
- `CHALLENGE_LINES.composed_emotional.sendoff[2]`: …感謝します。抑えてきた分、全部ぶつけてきます。
- `CHALLENGE_LINES.composed_emotional.sendoff[3]`: 感謝します。…行ってきます。震えは、止まりました。

### composed_emotional.win[]

- `CHALLENGE_LINES.composed_emotional.win[1]`: 勝ちました。…社長、やっと胸のつかえが取れました。
- `CHALLENGE_LINES.composed_emotional.win[2]`: 勝ちました。…社長、感謝します。言葉が、まとまらない。
- `CHALLENGE_LINES.composed_emotional.win[3]`: 勝てました。…叫びたいのを、こらえてます。

### composed_emotional.lose[]

- `CHALLENGE_LINES.composed_emotional.lose[1]`: 負けました。…すみません、まだ呑み込めません。
- `CHALLENGE_LINES.composed_emotional.lose[2]`: …悔しい、なんて言葉じゃ足りません。完敗です。
- `CHALLENGE_LINES.composed_emotional.lose[3]`: 届きませんでした。…すみません、声が震えて。

### composed_earnest.petition[]

- `CHALLENGE_LINES.composed_earnest.petition[1]`: 社長。…あの人と、やらせてください。覚悟はできています。
- `CHALLENGE_LINES.composed_earnest.petition[2]`: …わがままを言います。あの人と、やらせてください。責任は取ります。
- `CHALLENGE_LINES.composed_earnest.petition[3]`: 社長。…自分に必要な相手です。あの人と、お願いします。

### composed_earnest.sendoff[]

- `CHALLENGE_LINES.composed_earnest.sendoff[1]`: ありがとうございます。…託された分、務めてきます。
- `CHALLENGE_LINES.composed_earnest.sendoff[2]`: …背中を押していただきました。恥じない試合をしてきます。
- `CHALLENGE_LINES.composed_earnest.sendoff[3]`: 感謝します。…行ってきます。無駄には、しません。

### composed_earnest.win[]

- `CHALLENGE_LINES.composed_earnest.win[1]`: 勝ちました。…社長、任せていただいた甲斐がありました。
- `CHALLENGE_LINES.composed_earnest.win[2]`: …役目は果たせました。ありがとうございます。
- `CHALLENGE_LINES.composed_earnest.win[3]`: 勝てました。…言い出した責任は、これで返せたでしょうか。

### composed_earnest.lose[]

- `CHALLENGE_LINES.composed_earnest.lose[1]`: 負けました。…無理を通させてもらったのに、この結果です。次は必ず持ち帰ります。
- `CHALLENGE_LINES.composed_earnest.lose[2]`: 完敗です。…この経験は、必ず勝ちで返してみせます。
- `CHALLENGE_LINES.composed_earnest.lose[3]`: …頼み込んだ以上は勝つつもりでした。この悔しさ、糧にしてみせます。

### composed_bold.petition[]

- `CHALLENGE_LINES.composed_bold.petition[1]`: 社長。……あの人は、私が引き受けるよ。
- `CHALLENGE_LINES.composed_bold.petition[2]`: 頼みがあるの。あの相手と、やらせてほしい。
- `CHALLENGE_LINES.composed_bold.petition[3]`: ……名前を挙げさせてもらうね。あの人と、やりたい。

### composed_bold.sendoff[]

- `CHALLENGE_LINES.composed_bold.sendoff[1]`: ありがとう。……ちゃんと応えるよ。
- `CHALLENGE_LINES.composed_bold.sendoff[2]`: ……話が早いね。感謝する。行ってくる。
- `CHALLENGE_LINES.composed_bold.sendoff[3]`: うん、ありがとう。……心配は要らないから。

### composed_bold.win[]

- `CHALLENGE_LINES.composed_bold.win[1]`: 勝ってきたよ。……通してくれて、ありがとう。
- `CHALLENGE_LINES.composed_bold.win[2]`: ……ほら、任せて正解だったでしょ。
- `CHALLENGE_LINES.composed_bold.win[3]`: 勝ったよ。思った通りにね。……感謝してる。

### composed_bold.lose[]

- `CHALLENGE_LINES.composed_bold.lose[1]`: 負けたよ。……言い訳はしない。
- `CHALLENGE_LINES.composed_bold.lose[2]`: ……届かなかったね。ごめん、社長。
- `CHALLENGE_LINES.composed_bold.lose[3]`: 完敗。……悔しいよ、さすがに。

### composed_easygoing.petition[]

- `CHALLENGE_LINES.composed_easygoing.petition[1]`: 社長、ちょっといい？ ……やってみたい相手がいるの。
- `CHALLENGE_LINES.composed_easygoing.petition[2]`: ……あのね。あの人と、やらせてもらえないかな。
- `CHALLENGE_LINES.composed_easygoing.petition[3]`: お願いがあるんだけど。……あの相手、私に回してくれない？

### composed_easygoing.sendoff[]

- `CHALLENGE_LINES.composed_easygoing.sendoff[1]`: ありがとね、社長。……行ってくる。
- `CHALLENGE_LINES.composed_easygoing.sendoff[2]`: ふふ、通しちゃうんだ。……うん、ありがと。
- `CHALLENGE_LINES.composed_easygoing.sendoff[3]`: 助かるよ。……のんびりしてる場合じゃないね。

### composed_easygoing.win[]

- `CHALLENGE_LINES.composed_easygoing.win[1]`: 勝っちゃった。……わがまま聞いてくれて、ありがとね。
- `CHALLENGE_LINES.composed_easygoing.win[2]`: ……ほら、心配なかったでしょ。ちゃんと勝ったよ。
- `CHALLENGE_LINES.composed_easygoing.win[3]`: 勝ったよ。……うん、いい気分。

### composed_easygoing.lose[]

- `CHALLENGE_LINES.composed_easygoing.lose[1]`: 負けちゃった。……ごめんね、社長。
- `CHALLENGE_LINES.composed_easygoing.lose[2]`: ……だめだったよ。悔しいなって、ちゃんと思ってる。
- `CHALLENGE_LINES.composed_easygoing.lose[3]`: 勝てなかった。……次はもう少し、うまくやるよ。

### composed_quiet.petition[]

- `CHALLENGE_LINES.composed_quiet.petition[1]`: 社長。…あの人と、やりたいです。
- `CHALLENGE_LINES.composed_quiet.petition[2]`: …お願いが、ひとつだけ。あの人と、やらせてください。
- `CHALLENGE_LINES.composed_quiet.petition[3]`: 社長。…あの人です。お願いします。

### composed_quiet.sendoff[]

- `CHALLENGE_LINES.composed_quiet.sendoff[1]`: …ありがとうございます。行ってきます。
- `CHALLENGE_LINES.composed_quiet.sendoff[2]`: 感謝します。…では、行ってきます。
- `CHALLENGE_LINES.composed_quiet.sendoff[3]`: …はい。必ず、報告します。

### composed_quiet.win[]

- `CHALLENGE_LINES.composed_quiet.win[1]`: 勝てました。…ありがとうございます。
- `CHALLENGE_LINES.composed_quiet.win[2]`: …勝ちました。それだけ、報告に。
- `CHALLENGE_LINES.composed_quiet.win[3]`: 終わりました。…勝ちです。

### composed_quiet.lose[]

- `CHALLENGE_LINES.composed_quiet.lose[1]`: …完敗です。言葉が出ません。
- `CHALLENGE_LINES.composed_quiet.lose[2]`: 負けました。…情けないです。
- `CHALLENGE_LINES.composed_quiet.lose[3]`: …届きませんでした。悔しい。

### seductive_normal.petition[]

- `CHALLENGE_LINES.seductive_normal.petition[1]`: 社長、正直に言うわ。対戦したい相手が居るのよね。
- `CHALLENGE_LINES.seductive_normal.petition[2]`: {org}のあの子が気に障るのよね……対戦、セッティングしてくれる？
- `CHALLENGE_LINES.seductive_normal.petition[3]`: 理由は言いたくないのだけれど。試合を組んで欲しいの。

### seductive_normal.sendoff[]

- `CHALLENGE_LINES.seductive_normal.sendoff[1]`: ありがとう。……あなた、話が早いのね。
- `CHALLENGE_LINES.seductive_normal.sendoff[2]`: 話を通してくれたのね。ふふ、行ってくるわ。
- `CHALLENGE_LINES.seductive_normal.sendoff[3]`: 感謝するわ、社長。ちゃんと勝ってくるわね。

### seductive_normal.win[]

- `CHALLENGE_LINES.seductive_normal.win[1]`: 勝ったわ。……当然よね。
- `CHALLENGE_LINES.seductive_normal.win[2]`: 勝ってきたわよ。わがまま言った分は返さないとね。
- `CHALLENGE_LINES.seductive_normal.win[3]`: いい顔してる？ やっぱり勝った後だからかしらね。ふふ♪

### seductive_normal.lose[]

- `CHALLENGE_LINES.seductive_normal.lose[1]`: 負けたわ。……ごめんなさい、話す気分じゃないわ。
- `CHALLENGE_LINES.seductive_normal.lose[2]`: 勝てなかった。セッティングしてくれたのに、ごめんなさいね
- `CHALLENGE_LINES.seductive_normal.lose[3]`: 悔しいって、こういうことね。

### seductive_easygoing.petition[]

- `CHALLENGE_LINES.seductive_easygoing.petition[1]`: 社長〜、あの人とやりたいの。だめ？
- `CHALLENGE_LINES.seductive_easygoing.petition[2]`: ねえ社長、あの人と当てて。お願い。
- `CHALLENGE_LINES.seductive_easygoing.petition[3]`: あの人とやらせて？ わがままよね、私。

### seductive_easygoing.sendoff[]

- `CHALLENGE_LINES.seductive_easygoing.sendoff[1]`: やった。ありがと、社長。行ってくるわ。
- `CHALLENGE_LINES.seductive_easygoing.sendoff[2]`: ふふ、通っちゃった。感謝するわ。
- `CHALLENGE_LINES.seductive_easygoing.sendoff[3]`: ありがと。ちゃんと勝ってくるから。

### seductive_easygoing.win[]

- `CHALLENGE_LINES.seductive_easygoing.win[1]`: 勝っちゃった。ふふ、ありがと社長。
- `CHALLENGE_LINES.seductive_easygoing.win[2]`: 勝ったわよ。頷いてくれて、よかった。
- `CHALLENGE_LINES.seductive_easygoing.win[3]`: ほら、いい報告。ありがとね、社長。

### seductive_easygoing.lose[]

- `CHALLENGE_LINES.seductive_easygoing.lose[1]`: 負けちゃった。……悔しい、けっこう悔しい。
- `CHALLENGE_LINES.seductive_easygoing.lose[2]`: だめだったわ。……ごめん、社長。堪えたわ。
- `CHALLENGE_LINES.seductive_easygoing.lose[3]`: 負けたの。……ふふ、笑えないわね、これは。

### seductive_earnest.petition[]

- `CHALLENGE_LINES.seductive_earnest.petition[1]`: 社長、あの人とやらせてほしいの。お願いします。
- `CHALLENGE_LINES.seductive_earnest.petition[2]`: どうしてもあの人とやりたくて。……聞いてくれる？
- `CHALLENGE_LINES.seductive_earnest.petition[3]`: 身勝手なお願いなの。あの人と、やらせて。

### seductive_earnest.sendoff[]

- `CHALLENGE_LINES.seductive_earnest.sendoff[1]`: ありがとう、社長。ちゃんとやってくるわ。
- `CHALLENGE_LINES.seductive_earnest.sendoff[2]`: 嬉しい。……行ってきます。
- `CHALLENGE_LINES.seductive_earnest.sendoff[3]`: 通してくれて、感謝してる。行ってくるわね。

### seductive_earnest.win[]

- `CHALLENGE_LINES.seductive_earnest.win[1]`: 勝ったわよ、社長。言い出して、よかった。
- `CHALLENGE_LINES.seductive_earnest.win[2]`: 勝てたの。……頷いてくれたおかげよ。
- `CHALLENGE_LINES.seductive_earnest.win[3]`: ふふ、いい報告ができるわ。勝ってきたの。

### seductive_earnest.lose[]

- `CHALLENGE_LINES.seductive_earnest.lose[1]`: 負けたわ。……ごめんなさい、社長。
- `CHALLENGE_LINES.seductive_earnest.lose[2]`: 届かなかったの。悔しい、素直に悔しいわ。
- `CHALLENGE_LINES.seductive_earnest.lose[3]`: 勝てなかったわ。……次は、必ず。

### seductive_bold.petition[]

- `CHALLENGE_LINES.seductive_bold.petition[1]`: 社長、{org}のあの女、私にやらせて。
- `CHALLENGE_LINES.seductive_bold.petition[2]`: 気に入らない女がいるの。……そいつと、やらせてほしいのよ。
- `CHALLENGE_LINES.seductive_bold.petition[3]`: 身の程を教えてあげたい相手がいるの。組んでくれる？

### seductive_bold.sendoff[]

- `CHALLENGE_LINES.seductive_bold.sendoff[1]`: ありがと。……せいぜい可愛がってくるわ。
- `CHALLENGE_LINES.seductive_bold.sendoff[2]`: 話がわかるじゃない、社長。任せて。
- `CHALLENGE_LINES.seductive_bold.sendoff[3]`: ふふ、行ってくる。心配なんて要らないわよ。

### seductive_bold.win[]

- `CHALLENGE_LINES.seductive_bold.win[1]`: 勝ったわ。当然でしょ？ ……ありがと、社長。
- `CHALLENGE_LINES.seductive_bold.win[2]`: 大したことなかったわ。いい報告でしょ、社長。
- `CHALLENGE_LINES.seductive_bold.win[3]`: ほら、言った通り。通してくれて助かったわ。

### seductive_bold.lose[]

- `CHALLENGE_LINES.seductive_bold.lose[1]`: ……負けたわ。認めるけど、実力じゃないわよ。
- `CHALLENGE_LINES.seductive_bold.lose[2]`: 取りこぼしたわ。ごめん、社長。次はないから。
- `CHALLENGE_LINES.seductive_bold.lose[3]`: 一度くらい、ね。……悔しいのは、本当よ。

### seductive_quiet.petition[]

- `CHALLENGE_LINES.seductive_quiet.petition[1]`: 社長。あの人と、やらせてほしいの。
- `CHALLENGE_LINES.seductive_quiet.petition[2]`: お願いがあるの。……あの人と、やりたい。
- `CHALLENGE_LINES.seductive_quiet.petition[3]`: 一度、あの人と。……いいかしら。

### seductive_quiet.sendoff[]

- `CHALLENGE_LINES.seductive_quiet.sendoff[1]`: ありがとう。……行ってくるわ。
- `CHALLENGE_LINES.seductive_quiet.sendoff[2]`: 感謝するわ、社長。任せて。
- `CHALLENGE_LINES.seductive_quiet.sendoff[3]`: ……嬉しい。ちゃんと報告するわね。

### seductive_quiet.win[]

- `CHALLENGE_LINES.seductive_quiet.win[1]`: 勝ったわ。……ありがとう、社長。
- `CHALLENGE_LINES.seductive_quiet.win[2]`: 報告よ。勝ってきたの。
- `CHALLENGE_LINES.seductive_quiet.win[3]`: ……勝てたわ。頷いてくれたから。

### seductive_quiet.lose[]

- `CHALLENGE_LINES.seductive_quiet.lose[1]`: 負けたわ。……ごめんなさい。
- `CHALLENGE_LINES.seductive_quiet.lose[2]`: 届かなかった。悔しい。
- `CHALLENGE_LINES.seductive_quiet.lose[3]`: ……勝てなかったの。次は違うわ。

### seductive_emotional.petition[]

- `CHALLENGE_LINES.seductive_emotional.petition[1]`: 社長。あの人とやりたいの。……いいでしょ？
- `CHALLENGE_LINES.seductive_emotional.petition[2]`: 我慢が切れたの。あの人と、やらせて。
- `CHALLENGE_LINES.seductive_emotional.petition[3]`: 言うだけ言うわ。あの人と当てて。

### seductive_emotional.sendoff[]

- `CHALLENGE_LINES.seductive_emotional.sendoff[1]`: ふん、話が早いのね。……ありがとう。
- `CHALLENGE_LINES.seductive_emotional.sendoff[2]`: それでいいのよ、社長。行ってくるわ。
- `CHALLENGE_LINES.seductive_emotional.sendoff[3]`: 感謝はするわ。……見てなさい。

### seductive_emotional.win[]

- `CHALLENGE_LINES.seductive_emotional.win[1]`: 勝ったわ。当たり前でしょ。……ありがと。
- `CHALLENGE_LINES.seductive_emotional.win[2]`: ほら、私の言う通り。いい報告でしょう？
- `CHALLENGE_LINES.seductive_emotional.win[3]`: 勝ったわよ。頷いた甲斐、あったでしょ。

### seductive_emotional.lose[]

- `CHALLENGE_LINES.seductive_emotional.lose[1]`: ……負けたわ。悔しい。ごめんなさい。
- `CHALLENGE_LINES.seductive_emotional.lose[2]`: 認めるわ。今日は届かなかった。それだけ。
- `CHALLENGE_LINES.seductive_emotional.lose[3]`: ……勝てなかった。次はこうはいかないわ。

### ojousama_normal.petition[]

- `CHALLENGE_LINES.ojousama_normal.petition[1]`: 社長、わたくし、あの方と対戦したいのです。
- `CHALLENGE_LINES.ojousama_normal.petition[2]`: お願いがあります。あの方と試合をさせてくださいませ
- `CHALLENGE_LINES.ojousama_normal.petition[3]`: 不躾を承知で申します。あの方と当たりたいのです。

### ojousama_normal.sendoff[]

- `CHALLENGE_LINES.ojousama_normal.sendoff[1]`: ありがとうございます。行ってまいります。
- `CHALLENGE_LINES.ojousama_normal.sendoff[2]`: お認めいただけて、嬉しく思います。
- `CHALLENGE_LINES.ojousama_normal.sendoff[3]`: 感謝いたします。必ず、報告に戻ります。

### ojousama_normal.win[]

- `CHALLENGE_LINES.ojousama_normal.win[1]`: 勝ちましたわ！ ……お骨折り、ありがとうございました。
- `CHALLENGE_LINES.ojousama_normal.win[2]`: ご報告です。勝ってまいりました！
- `CHALLENGE_LINES.ojousama_normal.win[3]`: 勝てました。お許しをいただけたからです。

### ojousama_normal.lose[]

- `CHALLENGE_LINES.ojousama_normal.lose[1]`: 負けました。……申し訳ありません。
- `CHALLENGE_LINES.ojousama_normal.lose[2]`: 及びませんでした。悔しく思います。
- `CHALLENGE_LINES.ojousama_normal.lose[3]`: 勝てませんでした。……次は、必ず。

### ojousama_easygoing.petition[]

- `CHALLENGE_LINES.ojousama_easygoing.petition[1]`: 社長、わたくし、あの方とやってみたいのです。
- `CHALLENGE_LINES.ojousama_easygoing.petition[2]`: ねえ社長、あの方と当ててくださいません？
- `CHALLENGE_LINES.ojousama_easygoing.petition[3]`: 思いつきではないのです。あの方と、試合を。

### ojousama_easygoing.sendoff[]

- `CHALLENGE_LINES.ojousama_easygoing.sendoff[1]`: まあ、嬉しい。ありがとうございます。
- `CHALLENGE_LINES.ojousama_easygoing.sendoff[2]`: 通していただけましたね。行ってまいります。
- `CHALLENGE_LINES.ojousama_easygoing.sendoff[3]`: 感謝します。楽しんでまいりますね。

### ojousama_easygoing.win[]

- `CHALLENGE_LINES.ojousama_easygoing.win[1]`: 勝ちました。ふふ、いい報告でしょう。
- `CHALLENGE_LINES.ojousama_easygoing.win[2]`: 勝ってまいりました。ありがとうございます。
- `CHALLENGE_LINES.ojousama_easygoing.win[3]`: 思ったより、うまくいきました。感謝します。

### ojousama_easygoing.lose[]

- `CHALLENGE_LINES.ojousama_easygoing.lose[1]`: 負けてしまいました。……ごめんなさい。
- `CHALLENGE_LINES.ojousama_easygoing.lose[2]`: 及びませんでした。存外、こたえますね。
- `CHALLENGE_LINES.ojousama_easygoing.lose[3]`: 勝てませんでした。……少し、悔しいです。

### ojousama_earnest.petition[]

- `CHALLENGE_LINES.ojousama_earnest.petition[1]`: 社長、お願いがあります。あの方と戦わせてください。
- `CHALLENGE_LINES.ojousama_earnest.petition[2]`: わたくし、あの方と対戦したいのです。どうか。
- `CHALLENGE_LINES.ojousama_earnest.petition[3]`: 願いはひとつです。あの方と、当たらせてください。

### ojousama_earnest.sendoff[]

- `CHALLENGE_LINES.ojousama_earnest.sendoff[1]`: ありがとうございます。必ず応えます。
- `CHALLENGE_LINES.ojousama_earnest.sendoff[2]`: お許し、無駄にはしません。行ってまいります。
- `CHALLENGE_LINES.ojousama_earnest.sendoff[3]`: 感謝します。……全力で戦ってまいります。

### ojousama_earnest.win[]

- `CHALLENGE_LINES.ojousama_earnest.win[1]`: 勝ちました。……ありがとうございました。
- `CHALLENGE_LINES.ojousama_earnest.win[2]`: ご報告します。勝ってまいりました。
- `CHALLENGE_LINES.ojousama_earnest.win[3]`: 応えられました。認めてくださったおかげです。

### ojousama_earnest.lose[]

- `CHALLENGE_LINES.ojousama_earnest.lose[1]`: 負けました。……申し訳ありません。
- `CHALLENGE_LINES.ojousama_earnest.lose[2]`: 及びませんでした。悔しくてなりません。
- `CHALLENGE_LINES.ojousama_earnest.lose[3]`: 勝てませんでした。……この借りは返します。

### ojousama_bold.petition[]

- `CHALLENGE_LINES.ojousama_bold.petition[1]`: 社長、あの方はわたくしが引き受けますわね。
- `CHALLENGE_LINES.ojousama_bold.petition[2]`: あの方と対戦したいのです。適任はわたくしでしょう。
- `CHALLENGE_LINES.ojousama_bold.petition[3]`: 名指しさせていただくわ。あの相手との舞台、整えられる？

### ojousama_bold.sendoff[]

- `CHALLENGE_LINES.ojousama_bold.sendoff[1]`: ありがとうございます。期待には応えますわ。
- `CHALLENGE_LINES.ojousama_bold.sendoff[2]`: 賢明な判断ね。行ってまいりますわ。
- `CHALLENGE_LINES.ojousama_bold.sendoff[3]`: 感謝しますわ。……結果でお返しするわね。

### ojousama_bold.win[]

- `CHALLENGE_LINES.ojousama_bold.win[1]`: 勝ったわよ。任せてもらった甲斐はあったでしょう。
- `CHALLENGE_LINES.ojousama_bold.win[2]`: 危なげなく、勝ってまいりましたわ。
- `CHALLENGE_LINES.ojousama_bold.win[3]`: 当然勝ちましたわ。機会をいただき、感謝しますわ。

### ojousama_bold.lose[]

- `CHALLENGE_LINES.ojousama_bold.lose[1]`: 負けました。……言い訳はいたしませんわ。
- `CHALLENGE_LINES.ojousama_bold.lose[2]`: 力及ばずという事ね。
- `CHALLENGE_LINES.ojousama_bold.lose[3]`: 勝てませんでした。……次は、必ず。

### delinquent_bold.petition[]

- `CHALLENGE_LINES.delinquent_bold.petition[1]`: 社長、あいつとやらせてくださいよ。勝てるんで。
- `CHALLENGE_LINES.delinquent_bold.petition[2]`: あいつとやりたいんす。……頼みます、組んでください。
- `CHALLENGE_LINES.delinquent_bold.petition[3]`: 言わなきゃ回ってこねぇんで、直接来ました。お願いします。

### delinquent_bold.sendoff[]

- `CHALLENGE_LINES.delinquent_bold.sendoff[1]`: あざっす！ ……行ってきます。
- `CHALLENGE_LINES.delinquent_bold.sendoff[2]`: ありがとうございます。……勝ってくるんで、心配いらないっす。
- `CHALLENGE_LINES.delinquent_bold.sendoff[3]`: 話通してくれて、あざっした。ちゃんとやってきます。

### delinquent_bold.win[]

- `CHALLENGE_LINES.delinquent_bold.win[1]`: 勝ったっす！ ……ほら、言った通りでしょ。
- `CHALLENGE_LINES.delinquent_bold.win[2]`: きっちり勝ってきたっすよ。社長、ありがとうっす。
- `CHALLENGE_LINES.delinquent_bold.win[3]`: やってきました。……頼んだ甲斐、あったでしょ？

### delinquent_bold.lose[]

- `CHALLENGE_LINES.delinquent_bold.lose[1]`: ……負けたっす。すんません。
- `CHALLENGE_LINES.delinquent_bold.lose[2]`: 悔しいっすね。……次は、こうはいかねぇんで。
- `CHALLENGE_LINES.delinquent_bold.lose[3]`: 負けました。……でも、やらせてもらってよかったっす。

### delinquent_normal.petition[]

- `CHALLENGE_LINES.delinquent_normal.petition[1]`: 社長、あの人とやらせてください。
- `CHALLENGE_LINES.delinquent_normal.petition[2]`: お願いがあるんすよ。あの人と当ててほしい。
- `CHALLENGE_LINES.delinquent_normal.petition[3]`: ずっと引っかかってる相手がいる。組ませてください。

### delinquent_normal.sendoff[]

- `CHALLENGE_LINES.delinquent_normal.sendoff[1]`: ありがとうございます。行ってきます。
- `CHALLENGE_LINES.delinquent_normal.sendoff[2]`: マジっすか。……あざす、社長。
- `CHALLENGE_LINES.delinquent_normal.sendoff[3]`: 恩に着ます。ちゃんと結果出してきます。

### delinquent_normal.win[]

- `CHALLENGE_LINES.delinquent_normal.win[1]`: 勝ちました。ありがとうございました。
- `CHALLENGE_LINES.delinquent_normal.win[2]`: 勝ってきたっす。頷いてくれたおかげで。
- `CHALLENGE_LINES.delinquent_normal.win[3]`: いい報告持ってきました。勝ちです。

### delinquent_normal.lose[]

- `CHALLENGE_LINES.delinquent_normal.lose[1]`: 負けました。……すんません、社長。
- `CHALLENGE_LINES.delinquent_normal.lose[2]`: だめでした。悔しいっす、正直。
- `CHALLENGE_LINES.delinquent_normal.lose[3]`: 勝てませんでした。……次は絶対返します。

### delinquent_easygoing.petition[]

- `CHALLENGE_LINES.delinquent_easygoing.petition[1]`: 社長、あの人とやらせてよ。頼む。
- `CHALLENGE_LINES.delinquent_easygoing.petition[2]`: やりたい相手がいるんだ。組んでくれ。
- `CHALLENGE_LINES.delinquent_easygoing.petition[3]`: なあ社長、あの人と当ててくれない？

### delinquent_easygoing.sendoff[]

- `CHALLENGE_LINES.delinquent_easygoing.sendoff[1]`: サンキュー社長。行ってくるわ。
- `CHALLENGE_LINES.delinquent_easygoing.sendoff[2]`: あざーす。行ってくるぜ。
- `CHALLENGE_LINES.delinquent_easygoing.sendoff[3]`: 話わかるじゃん。任せとけ。

### delinquent_easygoing.win[]

- `CHALLENGE_LINES.delinquent_easygoing.win[1]`: 勝ったぜ。ありがとな、社長。
- `CHALLENGE_LINES.delinquent_easygoing.win[2]`: 勝ってきた。頷いてくれたおかげだ。
- `CHALLENGE_LINES.delinquent_easygoing.win[3]`: ほら、いい報告。感謝してるよ。

### delinquent_easygoing.lose[]

- `CHALLENGE_LINES.delinquent_easygoing.lose[1]`: 負けた。……悪い、社長。
- `CHALLENGE_LINES.delinquent_easygoing.lose[2]`: だめだった。くそ、悔しい。
- `CHALLENGE_LINES.delinquent_easygoing.lose[3]`: 勝てなかった。次は絶対とる。

### cool_normal.petition[]

- `CHALLENGE_LINES.cool_normal.petition[1]`: ……社長。あの人と、やらせてください。
- `CHALLENGE_LINES.cool_normal.petition[2]`: ……頼みがあります。あの人と、やりたい。
- `CHALLENGE_LINES.cool_normal.petition[3]`: ……あの人だ。あの人と、やらせてほしい。

### cool_normal.sendoff[]

- `CHALLENGE_LINES.cool_normal.sendoff[1]`: ……ありがとうございます。行ってきます。
- `CHALLENGE_LINES.cool_normal.sendoff[2]`: ……感謝します。行ってきます。
- `CHALLENGE_LINES.cool_normal.sendoff[3]`: ……無駄にはしません。行ってきます。

### cool_normal.win[]

- `CHALLENGE_LINES.cool_normal.win[1]`: ……勝ちました。言ってよかった。
- `CHALLENGE_LINES.cool_normal.win[2]`: ……勝ちです。ありがとうございました。
- `CHALLENGE_LINES.cool_normal.win[3]`: ……終わりました。勝ちました。

### cool_normal.lose[]

- `CHALLENGE_LINES.cool_normal.lose[1]`: ……負けました。申し訳ない。
- `CHALLENGE_LINES.cool_normal.lose[2]`: ……完敗です。悔しい。
- `CHALLENGE_LINES.cool_normal.lose[3]`: ……勝てませんでした。次は、勝ちます。

### cool_quiet.petition[]

- `CHALLENGE_LINES.cool_quiet.petition[1]`: ……社長。あの人と。
- `CHALLENGE_LINES.cool_quiet.petition[2]`: ……願いが、ひとつ。あの人と。
- `CHALLENGE_LINES.cool_quiet.petition[3]`: ……やりたい相手が、います。

### cool_quiet.sendoff[]

- `CHALLENGE_LINES.cool_quiet.sendoff[1]`: ……ありがとうございます。行きます。
- `CHALLENGE_LINES.cool_quiet.sendoff[2]`: ……行ってきます。
- `CHALLENGE_LINES.cool_quiet.sendoff[3]`: ……感謝を。では。

### cool_quiet.win[]

- `CHALLENGE_LINES.cool_quiet.win[1]`: ……勝ちました。
- `CHALLENGE_LINES.cool_quiet.win[2]`: ……勝ち。ありがとうございます。
- `CHALLENGE_LINES.cool_quiet.win[3]`: ……終わりました。報告まで。

### cool_quiet.lose[]

- `CHALLENGE_LINES.cool_quiet.lose[1]`: ……負けました。すみません。
- `CHALLENGE_LINES.cool_quiet.lose[2]`: ……だめでした。それだけです。
- `CHALLENGE_LINES.cool_quiet.lose[3]`: ……次は、勝ちます。

## `CHALLENGE_REQUEST_OPPONENT_REACTIONS`

- 出典: `src/data.js`
- 本数: 408

### polite_earnest._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest._accept[1]`: ご指名、確かに受け取りました。全力でお相手します。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest._accept[2]`: 私を選んだのなら、その責任は果たします。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest._accept[3]`: お受けします。半端な気持ちでは、向き合いません。

### polite_earnest.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.win[1]`: 受けた以上、負けるわけにはいきませんでした。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.win[2]`: あなたの本気、確かに受け止めました。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.win[3]`: 勝ちました。あなたの覚悟には、応えられたはずです。

### polite_earnest.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.lose[1]`: ……受けておいて、この結果です。悔やみます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.lose[2]`: あなたが上でした。言い訳はいたしません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.lose[3]`: 私の力不足です。……この負けは、忘れません。

### polite_earnest.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.draw[1]`: 決着がつかないのが、いちばん心残りです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.draw[2]`: まだ終わっていません。必ず、続きを。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_earnest.draw[3]`: 決めきれず、申し訳ないです。……次は必ず。

### polite_normal._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal._accept[1]`: お受けします。正面から、お相手いたします。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal._accept[2]`: ご指名をいただいた以上、引くわけにはまいりません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal._accept[3]`: 承知しました。あなたの気持ち、受け取ります。

### polite_normal.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.win[1]`: お受けして良かったです。いい試合でした。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.win[2]`: 今日は私が上でしたね。お強かったですよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.win[3]`: 勝たせていただきました。またいつでも、どうぞ。

### polite_normal.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.lose[1]`: 私の力が及びませんでした。お見事です。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.lose[2]`: 悔しいです。……ですが、受けたことに悔いはありません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.lose[3]`: 完敗です。次は、違う結果をお見せします。

### polite_normal.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.draw[1]`: 決着つかず、ですか。……心残りです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.draw[2]`: 決着つかずですね。続きは、またの機会に。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_normal.draw[3]`: 決着がつかないというのは、いちばん困りますね。

### polite_shy._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy._accept[1]`: え……わたしで、いいんですか。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy._accept[2]`: あの……お受けします。自信は、ないですけど。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy._accept[3]`: 名指し、されるとは思わなくて……。でも、逃げません。

### polite_shy.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.win[1]`: あの……勝てちゃいました。すみません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.win[2]`: 勝ったんですよね、わたし……。実感がなくて。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.win[3]`: わたしを選んで、後悔してませんか……。

### polite_shy.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.lose[1]`: やっぱり……わたしじゃ、だめでしたね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.lose[2]`: ……強かったです。何も、できませんでした。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.lose[3]`: ごめんなさい……。がっかり、させてしまいましたよね。

### polite_shy.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.draw[1]`: 決着つかず……。よかったのか、悪かったのか。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.draw[2]`: 決着、つかなかったですね……。少し、ほっとしてます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_shy.draw[3]`: あの……もう一度、やりますか。今度は、ちゃんと。

### polite_easygoing._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing._accept[1]`: あら、私ですか。いいですよ、やりましょう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing._accept[2]`: お受けします。せっかく呼ばれましたし。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing._accept[3]`: そんなに構えなくていいですよ。ちゃんとお相手します。

### polite_easygoing.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.win[1]`: 勝てちゃいました。……気を落とさないでくださいね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.win[2]`: 受けてよかったです。楽しかったですよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.win[3]`: 思ったより、あっさりでしたね。ふふ。

### polite_easygoing.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.lose[1]`: 負けちゃいました。まあ、そういう日ですね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.lose[2]`: 今日はあなたの日でしたね。お見事です。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.lose[3]`: やられました。……次は、もう少し粘りますね。

### polite_easygoing.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.draw[1]`: 決着つかずですって。ちょうどいいじゃないですか。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.draw[2]`: 決まりませんでしたね。まあ、またそのうちに。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_easygoing.draw[3]`: お互い元気ですねえ。……少し、疲れました。

### polite_quiet._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet._accept[1]`: ……お受けします。それだけです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet._accept[2]`: わかりました。言葉は、要りません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet._accept[3]`: ……はい。逃げません。

### polite_quiet.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.win[1]`: ……勝ちました。以上です。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.win[2]`: 終わりました。……お相手、感謝します。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.win[3]`: 勝ちです。……あなたは、強かった。

### polite_quiet.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.lose[1]`: ……負けました。何も言えません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.lose[2]`: あなたの勝ちです。……失礼します。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.lose[3]`: ……悔しい、とだけ。

### polite_quiet.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.draw[1]`: ……決着は、つきませんでした。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.draw[2]`: ……決まりませんでした。いつか、続きを。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_quiet.draw[3]`: ……終わりません。まだ。

### polite_bold._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold._accept[1]`: 望むところです。逃げも隠れもいたしません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold._accept[2]`: 選ばれたからには、出し惜しみなしで！　全力で応えますよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold._accept[3]`: 結構です。そのお気持ち、全部受け止めます。

### polite_bold.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.win[1]`: 申し上げた通りです。最初から最後まで、全力で押し切りました。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.win[2]`: ふぅ……出し切りました。これが今の実力です。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.win[3]`: 受け止めました。……もう一度、いかがですか。

### polite_bold.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.lose[1]`: ……大きなことを申し上げた分、恥ずかしい限りです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.lose[2]`: あなたが上でした。潔く、認めます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.lose[3]`: 持っていかれましたね。……次はございません。

### polite_bold.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.draw[1]`: 決めきれませんでした。……不本意です。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.draw[2]`: こんな終わり方は、望んでおりませんでした。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.polite_bold.draw[3]`: まだ足りませんね。またご指名ください。

### standard_normal._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal._accept[1]`: 受けて立ちます。正面から来てください。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal._accept[2]`: 名指しされて、引くわけにはいきません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal._accept[3]`: わかりました。全力でいきます。

### standard_normal.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.win[1]`: 受けて正解でした。いい試合だった。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.win[2]`: 今日は私が上でしたね。強かったですよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.win[3]`: 勝ちました。いい相手でしたよ、あなた。

### standard_normal.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.lose[1]`: 負けました。あなたのほうが上だった。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.lose[2]`: 悔しい。……でも、受けたことに後悔はないです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.lose[3]`: 完敗。……この借りは返します。

### standard_normal.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.draw[1]`: 決着つかず、か。すっきりしませんね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.draw[2]`: 決まらなかったですね。続きは、またいつか。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_normal.draw[3]`: 勝ててないし、負けてもいない。それだけです。

### standard_earnest._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest._accept[1]`: 私を選んだ以上、真正面から受けます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest._accept[2]`: その覚悟、無駄にはしません。必ず応えます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest._accept[3]`: 逃げません。全部、受け止めます。

### standard_earnest.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.win[1]`: 受けた以上、負けられませんでした。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.win[2]`: 勝ちました。……あの目は、忘れません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.win[3]`: 勝ちました。……重い一戦でした。

### standard_earnest.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.lose[1]`: 受けておいて、この結果です。……情けない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.lose[2]`: あなたが上でした。全部、私の責任です。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.lose[3]`: 負けました。……この悔しさは、抱えていきます。

### standard_earnest.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.draw[1]`: 決着をつけられなかった。……それが一番悔しい。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.draw[2]`: これで終わりにはできません。もう一度。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_earnest.draw[3]`: 宙ぶらりんのままです。……気持ちが収まりません。

### standard_bold._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold._accept[1]`: 望むところ。よく言ってくれました。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold._accept[2]`: 待ってましたよ、そういうの。受けます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold._accept[3]`: いいですね。全部まとめて受け止めます。

### standard_bold.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.win[1]`: ほら、言った通りでしょう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.win[2]`: 引く気なんて、最初からなかったので。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.win[3]`: 勝ちました。……次、いつでもどうぞ。

### standard_bold.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.lose[1]`: 持っていかれました。……大口叩いた分、痛い。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.lose[2]`: アンタが上だった。認めるわよ、今日は。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.lose[3]`: 負けました。次はこうはいきませんから。

### standard_bold.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.draw[1]`: 決めきれなかった。……つまらない終わり方だ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.draw[2]`: 決着つかず? そんなの求めてません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_bold.draw[3]`: まだ足りない。もう一度、名前を呼んでください。

### standard_easygoing._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing._accept[1]`: 私でいいの？ いいよ、やろっか。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing._accept[2]`: ずいぶん熱心だね。まあ、受けるよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing._accept[3]`: そんなに力まなくても、ちゃんと相手するって。

### standard_easygoing.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.win[1]`: 勝っちゃった。……そんな顔しないでよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.win[2]`: 受けてよかったな。楽しかったよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.win[3]`: 案外あっさりだったね。次はもっと粘って。

### standard_easygoing.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.lose[1]`: 負けちゃった。まあ、そういう日もあるよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.lose[2]`: あなたの勝ち。おめでとう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.lose[3]`: やられたなあ。……次はもうちょっと粘る。

### standard_easygoing.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.draw[1]`: 決着つかずだって。ちょうどいいんじゃない？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.draw[2]`: 決まらなかったね。まあ、またそのうち。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_easygoing.draw[3]`: お互い元気だねえ。ちょっと疲れた。

### standard_quiet._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet._accept[1]`: ……受ける。それだけ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet._accept[2]`: わかった。言葉はいらない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet._accept[3]`: ……逃げない。来て。

### standard_quiet.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.win[1]`: ……勝った。以上。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.win[2]`: 終わり。……強かった、あなた。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.win[3]`: 勝ち。それだけ伝えておく。

### standard_quiet.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.lose[1]`: ……負けた。何も言えない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.lose[2]`: あなたの勝ち。……失礼する。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.lose[3]`: ……悔しい。それだけ。

### standard_quiet.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.draw[1]`: ……つかなかった。決着は。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.draw[2]`: ……決着つかず。いつか、続きを。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_quiet.draw[3]`: ……まだ、終わってない。

### standard_shy._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy._accept[1]`: え、わたし……？ ……うん、逃げないよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy._accept[2]`: 名指しされるなんて、思ってなかった。……でも、受ける。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy._accept[3]`: 自信、ないんだけど……。それでも、いいなら。

### standard_shy.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.win[1]`: あ……勝っちゃった。ごめんなさい。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.win[2]`: わたしが勝ったんだよね……。まだ、信じられない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.win[3]`: 選んでくれたのに……こんな結果で、よかったのかな。

### standard_shy.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.lose[1]`: やっぱり、わたしじゃ……だめだったね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.lose[2]`: 強かった……。何も、できなかった。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.lose[3]`: ……ごめんなさい。がっかり、させちゃったよね。

### standard_shy.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.draw[1]`: 決着つかず……。よかったのか、どうなのか。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.draw[2]`: 決着、つかなかったね……。ちょっと、ほっとしてる。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_shy.draw[3]`: あの……もう一度、やる？ 今度は、ちゃんと。

### standard_emotional._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional._accept[1]`: いいよ、受ける！ そっちが名前を出したんだからね！
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional._accept[2]`: 私を選んだんだ。……絶対、後悔させてやる。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional._accept[3]`: 言ったよね？ もう引っ込みつかないよ、お互い！

### standard_emotional.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.win[1]`: ほら見なさい！ 私を選んだのが間違い！
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.win[2]`: 勝った……! ざまあみろって、言っていい?
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.win[3]`: これで分かったでしょ! 二度と名前呼ばないで!

### standard_emotional.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.lose[1]`: 悔しい……！ 認めない、絶対に認めないから！
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.lose[2]`: 負けた……。悔しい、悔しいよ……!
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.lose[3]`: なんで……! こんなの、納得できるわけない!

### standard_emotional.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.draw[1]`: 決着つかずって何!? 中途半端すぎるでしょ!
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.draw[2]`: 終わってない! こんなので終わらせない!
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.standard_emotional.draw[3]`: もう一回! いますぐもう一回やろうよ!

### composed_normal._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal._accept[1]`: ……いいよ。受けて立つ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal._accept[2]`: 名前を呼ばれたなら、応えないとね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal._accept[3]`: ……そう来たか。まあ、来なよ。

### composed_normal.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.win[1]`: ……ま、こんなものかな。悪くない相手だった。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.win[2]`: 受けて正解だったね。……また来るといい。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.win[3]`: 勝ったよ。……いい試合だった、とだけ。

### composed_normal.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.lose[1]`: ……完敗だね。潔く認めるよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.lose[2]`: あんたが上だった。……それだけの話。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.lose[3]`: ……やられたな。次は、こうはいかない。

### composed_normal.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.draw[1]`: ……決まらなかったか。まあ、悪くない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.draw[2]`: ……決着つかず。続きは、そのうちにね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_normal.draw[3]`: ……お互い、まだ何か残してるってことだ。

### composed_emotional._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional._accept[1]`: ……ふぅん。よく、私の名前を出せたね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional._accept[2]`: ……いいよ。言葉はいらない。来なよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional._accept[3]`: ……そう。じゃあ、覚悟はできてるんだ。

### composed_emotional.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.win[1]`: ……これで分かった？ 次はないよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.win[2]`: ……言いたいことは、全部言えたよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.win[3]`: ……もう、名前は呼ばないほうがいい。

### composed_emotional.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.lose[1]`: ……くっ。次は、こうはいかない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.lose[2]`: ……っ……そう。覚えておく。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.lose[3]`: ……何も言わない。今は、何も。

### composed_emotional.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.draw[1]`: ……終わってない。まだ、全然。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.draw[2]`: ……こんな中途半端、いちばん腹が立つ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_emotional.draw[3]`: ……次だ。次は、必ず終わらせる。

### composed_earnest._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest._accept[1]`: ……受ける。呼ばれたら、応えるのが筋だ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest._accept[2]`: わかった。……半端な向き合い方はしない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest._accept[3]`: ……いいだろう。その覚悟、正面から受け取る。

### composed_earnest.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.win[1]`: ……務めは果たした。あんたも、よくやったよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.win[2]`: 受けた以上、負けるわけにはいかなかった。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.win[3]`: ……勝ったよ。重い一戦だった。

### composed_earnest.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.lose[1]`: ……受けたからには勝ちたかった。この悔しさ、忘れない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.lose[2]`: あんたが上だった。……言い訳はしない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.lose[3]`: ……負けは、私のものだ。持って帰るよ。

### composed_earnest.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.draw[1]`: ……決着をつけられなかった。それが心残りだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.draw[2]`: これでは、答えたことにならない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_earnest.draw[3]`: ……まだ途中だ。必ず、続きをやろう。

### composed_bold._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold._accept[1]`: 来なよ。……受けて立つから。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold._accept[2]`: ……いい度胸してるね。乗ってあげる。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold._accept[3]`: 私を選んだんだ。……せいぜい、悔やまないように。

### composed_bold.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.win[1]`: ……ほら、言った通りだよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.win[2]`: 私を選んだのが、間違いだったね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.win[3]`: ……悪くなかったよ。もう一度来るなら、受ける。

### composed_bold.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.lose[1]`: ……持っていかれたか。大きく出た分、堪えるね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.lose[2]`: あんたが上だった。……認めるよ、今日は。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.lose[3]`: ……いい仕事するね。次は、こうはいかない。

### composed_bold.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.draw[1]`: ……決めきれなかったか。つまらないね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.draw[2]`: こういう終わり方は、私の趣味じゃない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_bold.draw[3]`: ……まだ足りない。また名前を呼びなよ。

### composed_easygoing._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing._accept[1]`: …私？ ま、いいよ。付き合う。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing._accept[2]`: へえ、名指しか。…断る理由もないかな。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing._accept[3]`: そんなに気合い入れなくていいよ。…受けるから。

### composed_easygoing.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.win[1]`: …ま、こんなもんかな。悪くなかったよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.win[2]`: あんた、力入りすぎ。…だから届かない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.win[3]`: 勝っちゃったね。…気にしなくていいよ。

### composed_easygoing.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.lose[1]`: あー…やられた。まいったな。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.lose[2]`: うん、あんたの勝ち。…強かったよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.lose[3]`: …完敗。言い訳はしないよ。

### composed_easygoing.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.draw[1]`: …決着つかずか。まあ、そういう日もある。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.draw[2]`: 決まらなかったね。…また今度でいいよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_easygoing.draw[3]`: お互い、まだ余ってるね。…楽しみだ。

### composed_quiet._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet._accept[1]`: …わかった。受けよう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet._accept[2]`: …名指しだね。逃げないよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet._accept[3]`: …来なよ。ちゃんと立ってる。

### composed_quiet.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.win[1]`: …うん。届かなかったね、今日は。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.win[2]`: …想定の内。それだけ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.win[3]`: …いい目してた。また来なよ。

### composed_quiet.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.lose[1]`: …強かった。それが答えだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.lose[2]`: …認めるよ。今日は。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.lose[3]`: …立てない。参った。

### composed_quiet.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.draw[1]`: …決まらなかったね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.draw[2]`: …まだ終わってない。それでいい。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.composed_quiet.draw[3]`: …続きは、いつか。

### seductive_normal._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal._accept[1]`: あら、私を選んだの？ 光栄だわ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal._accept[2]`: ふふ、いいわよ。受けて立つ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal._accept[3]`: そんなに私が欲しいの？ …来なさい。

### seductive_normal.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.win[1]`: ね、届かなかったでしょう？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.win[2]`: ふふ、いい夢は見られた？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.win[3]`: 悪くなかったわよ。…でも、まだ早い。

### seductive_normal.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.lose[1]`: あら……今日はあなたの日ね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.lose[2]`: 参ったわ。…悔しいけど、綺麗に負けた。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.lose[3]`: ふふ、痛いところを突かれたわね。

### seductive_normal.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.draw[1]`: 決まらないなんて、じれったいわね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.draw[2]`: 続きは、また今度。ね？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_normal.draw[3]`: あら、まだ足りない顔してるわよ。

### seductive_easygoing._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing._accept[1]`: え、私？ ふふ、いいわよー、遊びましょ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing._accept[2]`: ま、呼ばれたら行くわよ。そういうものでしょ？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing._accept[3]`: あら、断るの面倒だし。…受けるわ。

### seductive_easygoing.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.win[1]`: ふふ、勝っちゃった。ごめんね？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.win[2]`: あんまり気張らないの。…疲れるわよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.win[3]`: ね、思ったより楽しかったわ。

### seductive_easygoing.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.lose[1]`: あらら、やられちゃった。ふふ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.lose[2]`: まあ、こういう日もあるわよね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.lose[3]`: 悔しい……ことにしておくわ。

### seductive_easygoing.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.draw[1]`: 決着つかずかぁ。…ま、いいんじゃない？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.draw[2]`: 決まらなかったわね。お茶でも飲む？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_easygoing.draw[3]`: もう、しつこいんだから。ふふ。

### seductive_earnest._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest._accept[1]`: 私を選んだ理由、リングで聞くわ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest._accept[2]`: 本気なのね。…なら、私も本気で返す。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest._accept[3]`: 逃げないわ。ちゃんと受け止めてあげる。

### seductive_earnest.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.win[1]`: あなたの本気、確かに受け取ったわよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.win[2]`: 手は抜いてない。…だから、胸を張って。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.win[3]`: 勝ったわ。でも、楽じゃなかった。

### seductive_earnest.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.lose[1]`: 私の力不足よ。言い訳はしないわ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.lose[2]`: あなたが上だった。……認めるわ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.lose[3]`: 悔しい。この気持ち、忘れないでおく。

### seductive_earnest.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.draw[1]`: 決着はつけたかった。……正直にね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.draw[2]`: まだ終わってないわ。約束する。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_earnest.draw[3]`: お互い、出し切ったわね。それは認める。

### seductive_bold._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold._accept[1]`: へえ、私に噛みつくの？ …いい度胸ね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold._accept[2]`: いいわ、来なさい。喰ってあげる。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold._accept[3]`: 後悔しても知らないわよ？ ふふ。

### seductive_bold.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.win[1]`: ほら、言った通り。届かなかったでしょ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.win[2]`: ふふ、可愛かったわよ。その必死な顔。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.win[3]`: もう一度来る？ …今度は容赦しない。

### seductive_bold.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.lose[1]`: ……あら。やるじゃない、あなた。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.lose[2]`: 痛いわね。…でも、次はこうはいかない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.lose[3]`: 悔しい。認めるわ、今日だけね。

### seductive_bold.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.draw[1]`: 決めさせてくれないの？ 生意気ね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.draw[2]`: まだ足りないわ。…ぜんぜん、足りない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_bold.draw[3]`: 決着つかず？ 私は納得してないわよ。

### seductive_quiet._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet._accept[1]`: ……いいわよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet._accept[2]`: ふふ。……来なさい。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet._accept[3]`: 私で、いいのね。……受けるわ。

### seductive_quiet.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.win[1]`: ……ね？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.win[2]`: ふふ。……おやすみ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.win[3]`: ……まだ、早かったわね。

### seductive_quiet.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.lose[1]`: ……上手ね、あなた。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.lose[2]`: ……参ったわ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.lose[3]`: ふふ。……悔しい。

### seductive_quiet.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.draw[1]`: ……お預けね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.draw[2]`: ……足りないわ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_quiet.draw[3]`: ふふ。……また、今度。

### seductive_emotional._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional._accept[1]`: 私を呼んだわね？ …後悔させてあげる。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional._accept[2]`: ふざけてるの？ …いいわ、受けるわよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional._accept[3]`: その目、気に入らないわ。…来なさい。

### seductive_emotional.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.win[1]`: 分かった？ 二度と私を選ばないで。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.win[2]`: ふふ……ざまあないわね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.win[3]`: もっと吠えてみせなさいよ。ほら。

### seductive_emotional.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.lose[1]`: ……っ、なんで。認めたくないわ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.lose[2]`: 悔しい……！ 悔しいのよ、私は。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.lose[3]`: 笑いなさいよ。……今だけは、許すわ。

### seductive_emotional.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.draw[1]`: なによこれ。…全然すっきりしないわ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.draw[2]`: 決めさせなさいよ！ …ああ、もう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.seductive_emotional.draw[3]`: 中途半端は嫌いなの。…わかるでしょ？

### ojousama_normal._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal._accept[1]`: お受けします。正面からお相手しましょう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal._accept[2]`: わたくしを名指しなさったのですね。承知しました。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal._accept[3]`: 逃げる理由がありません。お受けします。

### ojousama_normal.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.win[1]`: 勝たせていただきました。良い試合でした。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.win[2]`: わたくしの勝ちです。異論はないでしょう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.win[3]`: あなたの本気、確かに受け取りました。

### ojousama_normal.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.lose[1]`: 及びませんでした。悔しく思います。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.lose[2]`: わたくしの負けです。潔く認めます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.lose[3]`: お見事でした。……本当に、悔しい。

### ojousama_normal.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.draw[1]`: 決着つかず、ですか。心残りです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.draw[2]`: またお相手願います。今度こそ決めたい。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_normal.draw[3]`: このままでは、納得しておりません。

### ojousama_easygoing._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing._accept[1]`: あら、わたくしですか。ええ、構いません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing._accept[2]`: 面白そうですね。お受けしましょう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing._accept[3]`: そんなに気を張らないで。ちゃんとお相手します。

### ojousama_easygoing.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.win[1]`: 勝ってしまいました。ごめんなさいね。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.win[2]`: 楽しい試合でした。ありがとう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.win[3]`: あら、もう終わり？ 少し物足りません。

### ojousama_easygoing.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.lose[1]`: 負けてしまいましたね。仕方ありません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.lose[2]`: あなたのほうが上手でした。お見事。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.lose[3]`: あらあら。……少しだけ、悔しいです。

### ojousama_easygoing.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.draw[1]`: 決着つかずですか。それも悪くありません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.draw[2]`: 決まりませんでしたね。またの機会に。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_easygoing.draw[3]`: お互い、まだ元気そうです。ふふ。

### ojousama_earnest._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest._accept[1]`: お受けします。全力でお相手します。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest._accept[2]`: 名指しの意味、違えずに応えます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest._accept[3]`: あなたの覚悟に、礼を欠くことはしません。

### ojousama_earnest.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.win[1]`: 勝ちました。手は一切抜いていません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.win[2]`: あなたは強かった。それは伝えておきます。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.win[3]`: 勝ちよりも、良い試合だったことが嬉しいですの。

### ojousama_earnest.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.lose[1]`: わたくしの力不足です。言い訳はしません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.lose[2]`: 完敗です。悔しさは持ち帰ります。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.lose[3]`: あなたが上でした。素直に認めます。

### ojousama_earnest.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.draw[1]`: 決着をつけられませんでした。心残りです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.draw[2]`: わたくしはまだ納得していません。必ずまた。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_earnest.draw[3]`: お互い出し切りました。それだけは確かです。

### ojousama_bold._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold._accept[1]`: わたくしを選ぶとは、見る目はあるようです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold._accept[2]`: よろしい。お受けします。覚悟はおありで？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold._accept[3]`: 無謀ですけれど……嫌いではありません。

### ojousama_bold.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.win[1]`: 勝ちました。この結果に驚きはありません。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.win[2]`: 身の程は分かりました？ …ふふ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.win[3]`: 危なげなく、勝たせていただきました。

### ojousama_bold.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.lose[1]`: ……お黙りなさい。今日だけです。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.lose[2]`: 認めます。ただし、今日だけの話です。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.lose[3]`: 悔しい。この屈辱は忘れません。

### ojousama_bold.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.draw[1]`: 決めさせないとは、生意気なこと。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.draw[2]`: こうした結末など、わたくしには不本意です。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.ojousama_bold.draw[3]`: まだ終わっていません。次で片をつけます。

### delinquent_bold._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold._accept[1]`: 上等じゃん。名指しとかいい度胸してんな。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold._accept[2]`: 来いよ。全部まとめて叩き返してやる。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold._accept[3]`: 私を選んだ時点で、勝負ありだろ。

### delinquent_bold.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.win[1]`: ほらな。届かねぇって言ったろ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.win[2]`: イキがるのはここまでだ。分かったか。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.win[3]`: もう一回来い。何度でも潰してやる。

### delinquent_bold.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.lose[1]`: ちっ……やるじゃねぇか、あんた。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.lose[2]`: 痛ぇな。…けど次はこうはいかねぇ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.lose[3]`: 負けだよ。悔しくて仕方ねぇけどな。

### delinquent_bold.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.draw[1]`: 決まらねぇとか、一番むかつくんだよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.draw[2]`: はぁ？ まだ全然終わってねぇだろ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_bold.draw[3]`: 決着つかず？ 冗談。続きやるぞ。

### delinquent_normal._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal._accept[1]`: まあ、指名されて逃げる趣味はねぇよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal._accept[2]`: いいっすよ、受けて立つ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal._accept[3]`: そう来たか。分かった、やろうぜ。

### delinquent_normal.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.win[1]`: 受けて正解だったな。それだけだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.win[2]`: あんた強かったよ。でも今日はこっちだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.win[3]`: 悪ぃな。譲れねぇもんがあってさ。

### delinquent_normal.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.lose[1]`: ……負けだ。ちゃんと認めるよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.lose[2]`: くそ、届かなかったか。次は分かんねぇぞ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.lose[3]`: あんたの勝ち。文句なしだ。

### delinquent_normal.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.draw[1]`: 決まらなかったか。すっきりしねぇな。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.draw[2]`: 決着つかずって、一番モヤるやつだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_normal.draw[3]`: まあ、悪い試合じゃなかったっす。

### delinquent_easygoing._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing._accept[1]`: お、私？ いいよ、やろうやろう。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing._accept[2]`: めんどくせ……ま、断る理由もねぇか。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing._accept[3]`: そんな睨むなって。受けるっての。

### delinquent_easygoing.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.win[1]`: 勝っちった。まあ、そういう日もあるって。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.win[2]`: あんた力入りすぎ。もっと抜けよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.win[3]`: 悪ぃ悪ぃ。今日はこっちの気分だった。

### delinquent_easygoing.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.lose[1]`: あー、やられた。強ぇなあんた。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.lose[2]`: まいったまいった。降参だよ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.lose[3]`: 負けたわ。…ま、しゃーない。

### delinquent_easygoing.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.draw[1]`: 決着つかずか。ちょうどいいんじゃね？
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.draw[2]`: 決まんなかったな。腹減った。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.delinquent_easygoing.draw[3]`: まだやんの？ 私はもういいよ。

### cool_normal._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal._accept[1]`: ……受ける。理由はいらない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal._accept[2]`: ……いいだろう。来い。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal._accept[3]`: ……名指しか。応える。

### cool_normal.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.win[1]`: ……そこまでだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.win[2]`: ……届いていない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.win[3]`: ……次はない。

### cool_normal.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.lose[1]`: ……強かった。それだけだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.lose[2]`: ……負けた。認める。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.lose[3]`: ……借りだ。返す。

### cool_normal.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.draw[1]`: ……決着はつかず、か。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.draw[2]`: ……まだ、終わらない。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_normal.draw[3]`: ……次で決める。

### cool_quiet._accept[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet._accept[1]`: ……受ける。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet._accept[2]`: ……いい。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet._accept[3]`: ……来い。

### cool_quiet.win[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.win[1]`: ……終わりだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.win[2]`: ……当然。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.win[3]`: ……ここまで。

### cool_quiet.lose[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.lose[1]`: ……負けだ。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.lose[2]`: ……強い。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.lose[3]`: ……そうか。

### cool_quiet.draw[]

- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.draw[1]`: ……決着つかず。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.draw[2]`: ……また。
- `CHALLENGE_REQUEST_OPPONENT_REACTIONS.cool_quiet.draw[3]`: ……足りない。

## `CHALLENGE_REQUEST_NO_LINES`

- 出典: `src/data.js`
- コード内コメント: challenge-request-spec-v0.1 Phase 4: NO 選択時の打診者ティッカーセリフ / archetype(7) × 2 パターン。落胆 / 不満 / 諦めの色合いを archetype で出し分け。
- 本数: 14

### composed[]

- `CHALLENGE_REQUEST_NO_LINES.composed[1]`: ……そうか。社長がそう言うなら、今は引っ込めておく。
- `CHALLENGE_REQUEST_NO_LINES.composed[2]`: 今じゃないってことだな。承知した。借りは消えないが。

### ojousama[]

- `CHALLENGE_REQUEST_NO_LINES.ojousama[1]`: ……さようでございますの。失礼いたしましたわ。
- `CHALLENGE_REQUEST_NO_LINES.ojousama[2]`: ご判断、承りますわ。…でも、忘れたわけではございませんの。

### polite[]

- `CHALLENGE_REQUEST_NO_LINES.polite[1]`: ……承知しました。失礼いたしました。
- `CHALLENGE_REQUEST_NO_LINES.polite[2]`: ご判断、受け止めます。お時間いただいたこと、感謝いたします。

### seductive[]

- `CHALLENGE_REQUEST_NO_LINES.seductive[1]`: あら、ダメなの? ……まあ、いいわ。今は引いてあげる。
- `CHALLENGE_REQUEST_NO_LINES.seductive[2]`: ……つれないのね。でも、諦めたわけじゃないわよ?

### delinquent[]

- `CHALLENGE_REQUEST_NO_LINES.delinquent[1]`: マジっすか……まあ、社長の判断なら仕方ねぇっす。
- `CHALLENGE_REQUEST_NO_LINES.delinquent[2]`: 今じゃねぇってことっすね。分かったっす、引っ込めますわ。

### cool[]

- `CHALLENGE_REQUEST_NO_LINES.cool[1]`: ……分かった。
- `CHALLENGE_REQUEST_NO_LINES.cool[2]`: ……そう。

### standard[]

- `CHALLENGE_REQUEST_NO_LINES.standard[1]`: ……わかりました。タイミングじゃないってことですね。
- `CHALLENGE_REQUEST_NO_LINES.standard[2]`: 社長の判断なら従います。でも、忘れたわけじゃないので。
