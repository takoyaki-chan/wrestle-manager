# K-14 タッグ勝利セリフ 書き直し下書き(98本・各セル1本だけ名前を呼ぶ)

- 作成: 2026-09-25(セリフ担当・Opus) / 状態: **下書き**。Keisuke の全文確認待ち。src は未変更
- 改訂: 2026-09-25 夜 — 呼び名の裁定(フルネームにせず、基本は名字、絆85以上で下の名前)を受けて、**各セル2本のうち1本を名前入り(`{partner}`)に戻した**。名前なしの49本は前稿と同じ文
- 裁定: K-14「タッグ勝利セリフ98本を書き直して勝利欄に加える。各セル2本のうち1本は相手の名前を呼び、もう1本は名前なし。連携セリフは入れない」/呼び名「セリフで相手を呼ぶときフルネームにしない。基本は名字、話し手→相手の絆が85以上で下の名前、一度切り替えたら絆50未満まで戻さない。敬称はセリフに書いたまま」(`docs/fun-audit-v0.1.md`)
- 対象: `src/tag-battle-lines.js` の `TAG_MATCH_WIN_LINES`(口調7×性格7×2本)と、その英訳(`i18n/dialogue-ledger.json` → `src/lang-en-dialogue.js`)
- 物差し: `specs/dialogue-tone-spec-v1.0.md`、`docs/tone-bible/` の口調シート34枚と裁定記録、`docs/tone-bible-anchors.md`、`docs/en-tone-bible-draft-v0.1.md`

## 0. 読み方

- 番号 #1〜#98 は src の並び順です(口調: 標準→丁寧→蠱惑→ヤンキー→お嬢様→クール→鷹揚。性格: ノーマル→真面目→強気→お気楽→寡黙→内気→感情的。各2本)
- 表の列は「番号 / 名前 / 現行のセリフ / 書き直し案 / 英語の現行 / 英語の書き直し案 / メモ」です。**「名前」列が「呼ぶ」の行が名前入り**(各セル1本・計49行)。名前入りの49行だけを §2 に一覧にしました
- 英語はそのままコピーできるようにコード表記にしています
- 各性格の見出しに在籍人数とアンカーを付けました。**在籍0のセル(15セル・30本)は今のゲームでは誰も喋りません**。確認は在籍ありの68本を優先してください
- メモ欄の【迷い】は §3 にまとめています

## 1. 書き直しの方針

1. **名前は各セル1本だけ呼ぶ(9/25夜の裁定で変更)。** 各セル2本のうち1本は `{partner}` で相手を呼び、もう1本は前稿どおり名前なしです。`{partner}` には「呼び名」の仕組みが名字(例: 阿武隈)か下の名前(例: 塔子。話し手→相手の絆85以上)を入れるので、**どちらが入っても自然に読める文**にしました。フルネームは入りません
   - どちらを名前入りにするか: 相手に向けた感謝・労い・約束・「あなたのおかげ」の行を優先し、観客や対戦相手に向けた行(「見た？」「文句あるやつ、いるか？」など)は名前なしに残しました。前稿で二人称(あなた/アンタ/あんた)を使っていた行は、その二人称を名前に置き換えています。二人称が残るのは名前なしの #45 #52 だけです
   - 敬称はセリフに書いたものがそのまま付きます。口調シートに名前の呼び方の規則は無いので、台帳にある既存の名前入りセリフの慣行(丁寧27本・お嬢様26本が「さん」、他の口調は全部呼び捨て)に合わせました: **丁寧・お嬢様は「{partner}さん」、標準・蠱惑・ヤンキー・クール・鷹揚は呼び捨て**。例外は標準×内気(#11)で、アンカー朝比奈の敬体に合わせて「さん」を付けました。「先輩」「ちゃん」は使っていません(名字でも下の名前でも通るように。上下関係も決め打ちしない)
   - クールは口調シートの「呼びかけをしない」に合わせ、名前を呼びかけでなく「{partner}がいなければ」「{partner}となら」のような言及で使いました
   - 1行に名前は1回だけ。名前と二人称を同じ行に並べていません
   - 「相棒」は使っていません。春タッグ優勝の受賞セリフ(`AWARD_LINES.springTagChampion`)がほぼ全セルで「相棒」を使っているので、そちらと声を分けるためです
2. **気持ちは残す。** 各行が何に感謝し、どう喜んでいたか(信じてよかった/繋いでくれた/二人なら負けない/見たか/組むのが楽しい/約束)は残し、言い回しを変えました。同じ性格の7本(口調違い)が同じ骨組みにならないよう、具体的な場面を分けています。例: 真面目[2]の「繋いでくれた」は、繋いでもらった/託してもらった/時間を稼いでくれた/粘ってくれた/持ちこたえてくださった/耐えた/踏みとどまってくれた、の7通り
3. **名前なし21本とかぶらない。** 今出ている21本の定番(「お疲れさま」「息ぴったり」「二人でつかんだ勝利」「最後まで一緒に戦ってくれてありがとう」)は使っていません。現行98本のお気楽[1]は7本とも「お疲れさま+息ぴったり」で21本とほぼ同文だったので、7本とも別の場面(合図なしで通じる/次の動きが読めた/噛み合った/目が合っただけで分かった/打ち合わせなしで揃う/やりやすい/乗っかるだけ)に替えました
4. **口調シートに合わせる。** 名前以外にも、2026-08 の全直しの後の規則に合わない箇所が現行にあったので、あわせて直しました(下の表)。ヤンキーの「ぜ」「やがる」「ねえ」は骨格内の伝法として残しています(検品06)
5. **試合結果とずれない。** 決着画面は時間切れの判定勝ち(HP判定)でも出るので、決め技を前提にする言い方(「決めきれた」「最後の一手」)は避けました。試合中の出来事を前提にする言い方は、現行の「繋いでくれた」と同じ程度にとどめています(§3 のG)
6. **英語。** 名前入りの49行は英語にも `{partner}` を1回入れました(英語の呼び名は姓か名だけ。例 Abukuma / Toko)。**-san などの敬称は付けません**(現行98本の英訳も「さん」を訳していない。英語トーンバイブル §1-10「実在方言の記号を属性に貼らない」と同じ考え)。日本語で名前を二人称の代わりに使っている行(「{partner}さんのおかげです」)は、英語では you+呼びかけにしました(`all thanks to you, {partner}`)。クールの言及型は英語も三人称です(`...Without {partner}, I'd have lost.`)。属性ごとの書き方は前稿どおり(お嬢様=短縮形なし/クール=断片・感嘆符なし・3文まで/ヤンキー=g落とし/蠱惑=Hehe... と味わう語彙/鷹揚=急がない英語)。台帳ビルド(`test/i18n-build-dialogue-dict.js`)の機械検査と同じ規則(プレースホルダの一致、直前の不定冠詞、直後の複数形名詞を含む)を全98行に掛け、違反0を確認しています

### 現行98本にあった、名前以外の問題(あわせて直したもの)

| 問題 | 行 | 対応 |
|---|---|---|
| 一人称「あたし」(裁定53: 共通セリフは極力出さず、出すなら「私」) | #46 #53 #76 | 一人称を落とした |
| 二人称「お前」(裁定55: ヤンキーは「あんた」) | #45 | 「あんた」 |
| 同じ文が2セルにある(英訳も1本を共有していた) | #9=#37、#10=#52、#58=#59 | すべて別の文にした |
| 名前なし21本と同じ・ほぼ同じ言い回し | お気楽[1]の7本(#7 #21 #35 #49 #63 #77 #91)、#15 #29 #36 #57 #71 | 別の場面・言い回しにした |
| お嬢様の「ですわ」系が14本すべてに付いていた(Keisuke既裁定「語尾はアクセント程度」) | お嬢様の14本 | 4本に減らした(#59 #64 #68 #70)。ノーマル・強気は0本 |
| お嬢様×強気の「！」と、敬語として不自然な「おやりになりましたわね」 | #61 #62 | アンカー大河内の型(声を張らず上から)に |
| 蠱惑×感情的が涙・取り乱し型(裁定29は「取り乱しではなく敵意・攻撃性が漏れる」) | #41 #42 | 裁定29へ【迷い】 |
| 鷹揚×感情的が沈んだ「…」型(アンカー林は明るく直球で「…」をほぼ使わない) | #97 #98 | 林の型へ【迷い】 |
| 比喩「バトン」、定型の「言葉はいらない」 | #18 #98 | 具体的な言い方にした |
| 鷹揚の14本がすべて「…」始まり | 鷹揚の14本 | 明るい帯(強気・お気楽・感情的)と真面目[1]は「…」始まりをやめた。ノーマル・寡黙・内気と真面目[2]は残した |
| 標準×内気がタメ口(アンカー朝比奈は敬体が地の声) | #11 #12 | 敬体に【迷い】 |
| 丁寧×寡黙がです・ます(裁定26は岸準拠=言葉を選ぶ省言の常体) | #23 #24 | 常体に【迷い】 |

## 2. 名前を呼ぶ49行(一覧)

`{partner}` の部分に、名字か下の名前が入ります(例: 阿武隈/塔子、英語は Abukuma/Toko)。

| # | セル | 呼び方 | 書き直し案 | 英語の書き直し案 |
|---|---|---|---|---|
| #1 | 標準×ノーマル | 呼び捨て | {partner}、ありがとう！ 一人じゃ、ここまで持たなかったよ。 | `Thanks, {partner}! On my own, I'd never have lasted that long.` |
| #3 | 標準×真面目 | 呼び捨て | ふぅ…{partner}を信じて任せたの、正解だったわね。この勝ちは、二人で分け合いましょう。 | `Phew... trusting you was the right call, {partner}. Let's split this win between us.` |
| #5 | 標準×強気 | 呼び捨て | 当然の結果よ。…でも、{partner}と一緒だと、負ける気が全然しないわね。 | `Of course we won. ...But with you around, {partner}, I never once felt like losing.` |
| #7 | 標準×お気楽 | 呼び捨て | {partner}、ハイタッチ〜♪ 合図なしで通じちゃうの、マジ最高じゃん！ | `High five, {partner}~ ♪ We didn't even need to signal each other. Totally the best!` |
| #9 | 標準×寡黙 | 呼び捨て | …助かったわ。組んだ相手が{partner}で、よかったかも。 | `...That helped, {partner}. Glad it was you I got paired with, I think.` |
| #11 | 標準×内気 | さん | あ、あの、{partner}さん……ほ、本当に……ありがとうございました……！ | `U-um, {partner}... th-thank you... so, so much...!` |
| #13 | 標準×感情的 | 呼び捨て | {partner}っ…！ ありがとう…ありがとうっ…！ 二人で勝てたんだよ、ほんとに…！ | `{partner}...! Thank you — thank you...! We actually won this, the two of us...!` |
| #15 | 丁寧×ノーマル | さん | あっ…勝てた…。{partner}さん、今日はずいぶん助けてもらっちゃいましたね。 | `Ah... we won... You really helped me out a lot today, {partner}.` |
| #17 | 丁寧×真面目 | さん | なんとか、なりましたね…{partner}さんのおかげです。ありがとうございました！ | `We somehow pulled it off... all thanks to you, {partner}. Thank you!` |
| #19 | 丁寧×強気 | さん | やりましたね、{partner}さん！ 二人で全力を出し切れば、負けません！ | `We did it, {partner}! When we both go all out, we don't lose!` |
| #22 | 丁寧×お気楽 | さん | 勝っちゃいました♪ {partner}さんと組めて楽しかったです、またやりましょうね〜！ | `We won ♪ Teaming up with you was so much fun, {partner}. Let's do it again soon~!` |
| #23 | 丁寧×寡黙 | さん | …ありがとう、{partner}さん。先に崩してくれたから、組み立てが楽になったの。 | `...Thank you, {partner}. You broke them down first, so the rest was easy to plan.` |
| #26 | 丁寧×内気 | さん | わ、わたし…一度も、逃げなかったの…！ {partner}さんが一緒に出てくれたから…！ | `I-I never ran away, not once...! Because you were out there with me, {partner}...!` |
| #28 | 丁寧×感情的 | さん | 約束、守れましたね、{partner}さん…っ！ よかった…ほんとに、よかったです…！ | `We kept our promise, {partner}...! I'm so glad... so, so glad...!` |
| #30 | 蠱惑×ノーマル | 呼び捨て | ふふ、{partner}がいると、負けるところが想像できないの。…相手の子には気の毒だけど♪ | `Hehe... with you here, {partner}, I can't picture us losing. ...Pity the other girls ♪` |
| #31 | 蠱惑×真面目 | 呼び捨て | …見立てどおりだったわ。信じて正解。この勝ち、半分は{partner}の手柄よ。 | `...Just as I judged. Trusting you was right — half of this win is yours, {partner}.` |
| #33 | 蠱惑×強気 | 呼び捨て | やったわね、{partner}。この二人なら、もっと上まで行けるわ…！ | `We did it, {partner}. The two of us can climb a lot higher than this...!` |
| #35 | 蠱惑×お気楽 | 呼び捨て | {partner}、いい感じに噛み合ってたじゃない？ おかげで楽させてもらったわ♪ | `We meshed pretty nicely, didn't we, {partner}? Made my job easy ♪` |
| #38 | 蠱惑×寡黙 | 呼び捨て | …{partner}となら、筋書きどおりに運ぶわね。 | `...With you, {partner}, everything goes exactly to script.` |
| #40 | 蠱惑×内気 | 呼び捨て | だ、大丈夫って、思えたの…{partner}が、そこにいたから… | `I-I felt like it would be okay... because you were right there, {partner}...` |
| #41 | 蠱惑×感情的 | 呼び捨て | ふふっ…！ {partner}、あの子たちの悔しそうな顔、見えた？ 二人で勝つと、たまらないわね♪ | `Hehe...! See their sour faces, {partner}? Winning as a pair is simply delicious ♪` |
| #43 | ヤンキー×ノーマル | 呼び捨て | {partner}、ありがとな！ おかげで、真っ向から行けたんだ！ | `Thanks, {partner}! With you backin' me up, I could go right at 'em!` |
| #46 | ヤンキー×真面目 | 呼び捨て | {partner}が粘ってくれた分、こっちも倒れずに済んだんだ。…ありがてえ。 | `You hung in there, {partner}, so I didn't go down either. ...Appreciate it.` |
| #47 | ヤンキー×強気 | 呼び捨て | どうだ、{partner}！ 私らが組みゃ、どこの誰が来たって負けねえんだよ！ | `How 'bout that, {partner}! Us two together? Doesn't matter who shows up. We don't lose!` |
| #49 | ヤンキー×お気楽 | 呼び捨て | {partner}、目ぇ合っただけで分かったろ？ 楽しかったな〜♪ | `One look and we both knew the play, right, {partner}? That was a blast~ ♪` |
| #51 | ヤンキー×寡黙 | 呼び捨て | …{partner}、恩に着る。この借りは、次のリングで返す。 | `...Owe you one, {partner}. I'll pay it back in the ring next time.` |
| #54 | ヤンキー×内気 | 呼び捨て | ぜ、全部…{partner}のおかげ、だ…！ …い、今のナシ、忘れろ… | `A-all of it... that was thanks to you, {partner}...! ...F-forget I said that.` |
| #56 | ヤンキー×感情的 | 呼び捨て | 絶対勝つって言ったろ…！ な、{partner}…？ 言ったとおりになったろ…っ！ | `Told you we'd win...! Right, {partner}...? Just like I said...!` |
| #57 | お嬢様×ノーマル | さん | {partner}さん、感謝するわ。…この一勝は、二人で積み上げたぶんの結果ね。 | `Thank you, {partner}. ...This win is simply what the two of us built, step by step.` |
| #59 | お嬢様×真面目 | さん | {partner}さんに預けた信頼に、しかと応えていただきましたわ。 | `The trust I placed in you was answered in full, {partner}. I am truly grateful.` |
| #61 | お嬢様×強気 | さん | ふふ…{partner}さんがいて、負ける理由がどこにあるのかしら？ | `Hehe... with you at my side, {partner}, what reason could there possibly be to lose?` |
| #64 | お嬢様×お気楽 | さん | あら、勝ってしまいましたわ。こんなに楽しいのなら、{partner}さんとまたご一緒したいものね。 | `Oh my, we have won. With this much fun, {partner}, I would gladly team up again.` |
| #66 | お嬢様×寡黙 | さん | …ご一緒したのが、{partner}さんでよかった。…それだけ。 | `...I am glad it was you beside me, {partner}. ...That is all.` |
| #68 | お嬢様×内気 | さん | み、みっともない姿は…お見せせずに済みましたかしら…？ {partner}さんのおかげですわ… | `D-did I manage not to look unseemly...? It is all thanks to you, {partner}...` |
| #70 | お嬢様×感情的 | さん | お約束、果たせましたわね、{partner}さん…っ！ …嬉しくて、言葉になりませんの… | `The promise is kept, {partner}...! ...I am far too happy to say anything sensible...` |
| #72 | クール×ノーマル | 呼び捨て(言及) | …{partner}と組めば勝てると読んでた。読み通り。 | `...Figured teaming with {partner} would win it. Read it right.` |
| #74 | クール×真面目 | 呼び捨て(言及) | …あの場面、{partner}が耐えた。だから、勝ち切れた。 | `...{partner} held on back there. That's how we closed it out.` |
| #75 | クール×強気 | 呼び捨て(言及) | …{partner}となら、負けない。今日で証明した。 | `...With {partner}, we don't lose. Proved it today.` |
| #78 | クール×お気楽 | 呼び捨て(言及) | …勝った。{partner}と組むのは、嫌いじゃない。 | `...Won. Don't mind teaming up with {partner} at all.` |
| #80 | クール×寡黙 | 呼び捨て(言及) | ……{partner}がいなければ、負けてた。 | `...Without {partner}, I'd have lost.` |
| #82 | クール×内気 | 呼び捨て(言及) | …ちゃんと、やれた。…{partner}に、ついていけた。 | `...Held up fine. ...Kept pace with {partner}.` |
| #83 | クール×感情的 | 呼び捨て(言及) | …っ。…勝った。{partner}と、二人で。…勝ったんだ。 | `...Kh. We won — {partner} and me. ...We actually won.` |
| #85 | 鷹揚×ノーマル | 呼び捨て | …ありがとう、{partner}。いい仕事をしてくれたね。おかげで、こっちは落ち着いて戦えたんだ。 | `...Thank you, {partner}. You did good work, so I could keep a calm head out there.` |
| #88 | 鷹揚×真面目 | 呼び捨て | …{partner}が踏みとどまってくれたから、最後まで立っていられた。ありがとう。 | `...You stood your ground, {partner}, so I stayed on my feet to the end. Thank you.` |
| #90 | 鷹揚×強気 | 呼び捨て | どう？ ざっとこんなもんだよ。…なんてね、ほとんど{partner}のおかげ。 | `How's that? Easy as anything. ...Kidding — it was mostly thanks to you, {partner}.` |
| #91 | 鷹揚×お気楽 | 呼び捨て | あ〜、楽だった。{partner}が合わせてくれるから、こっちは乗っかるだけだったよね〜 | `Ahh, that was easy. You set it all up, {partner}, so I just rode along~` |
| #94 | 鷹揚×寡黙 | 呼び捨て | ……{partner}と組んだから、勝てたの。…分かってるよね？ | `...We won because I teamed with you, {partner}. ...You know that, don't you?` |
| #96 | 鷹揚×内気 | 呼び捨て | …{partner}の役に、ちゃんと立てたかな…？ …おかげで、頑張りきれたよ | `...Was I any real help to you, {partner}...? ...Thanks to you, I made it all the way.` |
| #97 | 鷹揚×感情的 | 呼び捨て | 勝ったよ、{partner}！ 二人でもぎ取った一勝だよ！ ね、抱きついていい？ | `We won, {partner}! We wrestled that one away together! Hey — can I hug you?` |

名前を入れた形の例(#1): 「阿武隈、ありがとう！ 一人じゃ、ここまで持たなかったよ。」/「塔子、ありがとう！ 一人じゃ、ここまで持たなかったよ。」、丁寧(#19): 「やりましたね、阿武隈さん！ 二人で全力を出し切れば、負けません！」/「やりましたね、塔子さん！ 二人で全力を出し切れば、負けません！」

## 3. 判断に迷った行(17本+1グループ)

代案は「迷いの逆側に倒した場合」の文です。#41 #42 #97 #98 の代案は現行の声(涙・沈んだ「…」型)に寄せたもので、口調シートの裁定とは少しずれます。それ以外の代案は、どちらを選んでも口調規則に収まります。名前入りの行は代案も名前入りにしてあります。

| # | 名前 | セル | 迷った点 | 代案 |
|---|---|---|---|---|
| #11 | 呼ぶ | 標準×内気 | 口調シートの「敬体が地の声」に合わせてタメ口→敬体にし、名前にも「さん」を付けた(相手はパートナー) | あ、あの、{partner}……ほ、本当に……ありがとう……！(タメ口・呼び捨て) |
| #12 | — | 標準×内気 | #11と同じく敬体化。46字で長め | わ、わたし……ちゃんと、やれてた、よね……？ 一緒だったから、足が止まらなかった……！ |
| #14 | — | 標準×感情的 | 試合前に控室で話したことを前提にしている(原文の「約束したもんね」と同程度の前提) | 絶対勝とうねって、約束したもんね…っ！ ほんとになった…！(控室を外す) |
| #23 | 呼ぶ | 丁寧×寡黙 | 現行・名前なし21本・ゲーム内の同セルはです・ます主体。口調シート(岸)に合わせて常体にした | …ありがとうございました、{partner}さん。先に崩してもらえたので、組み立てが楽でした。 |
| #24 | — | 丁寧×寡黙 | #23と同じ(です・ます→常体) | …勝因は、組んだ相手です。考えるまでもありません。 |
| #26 | 呼ぶ | 丁寧×内気 | セル内で常体(高島・阿部)と敬体(松岡)が割れているため、#25を敬体・#26を常体にした | わ、わたし…一度も、逃げずにいられました…！ {partner}さんが一緒に出てくれたから、です…！ |
| #41 | 呼ぶ | 蠱惑×感情的 | 現行は涙・取り乱し型。口調シートの裁定29に合わせて声を変えたため、パートナーへの感謝が薄くなった(名前を呼ぶ行にして少し補った) | …っ、やったわ、{partner}…！ 二人で勝てたのね…ふふ、こんな顔、見せるつもりじゃなかったのに… |
| #42 | — | 蠱惑×感情的 | #41と同じ(声を裁定29へ) | 約束…守れたわね…っ！ …泣いてなんかいないわよ、ふふ… |
| #61 | 呼ぶ | お嬢様×強気 | 上から目線の声にしたため、パートナーへの感謝が「承認」の形になる(名前を呼ぶ行にしたので、誰を認めているかははっきりした) | ふふ…悪くなかったわ、{partner}さん。負ける理由が、どこにも見当たらないもの。 |
| #63 | — | お嬢様×お気楽 | 現行にあった♪を外した(アンカー蔵前の実セリフに♪が無いため) | 行末に♪を戻す(…揃うものなのね♪) |
| #64 | 呼ぶ | お嬢様×お気楽 | #63と同じ(♪を外した) | 行末に♪を戻す(…{partner}さんとまたご一緒したいものね♪) |
| #73 | — | クール×真面目 | 原文の「この勝ちは、二人の」は他セルの行と重なるため落とした | …信じて、よかった。この一勝は、半分ずつ。 |
| #79 | — | クール×寡黙 | 次の組み合わせを選手が口にしている(組むのは社長が決める) | ……ありがとう。……悪くなかった。 |
| #87 | — | 鷹揚×真面目 | 原文の「この勝ちは、二人のもの」は他セルの行と重なるため、成長の言葉に置き換えた | 信じてよかった。この勝ちは二人のもの…ここからもっと強くなれるね！ |
| #92 | — | 鷹揚×お気楽 | 次の組み合わせを選手が口にしている(組むのは社長が決める) | 勝っちゃったね〜。一緒だと楽しいし、言うことなしってやつ？ |
| #97 | 呼ぶ | 鷹揚×感情的 | 現行・ゲーム内の同セルは沈んだ「…っ」型が多い。口調シート(林)に合わせて明るくした | …っ、{partner}。勝った。二人で、勝ったよ。…約束、守れたね。(現行寄り) |
| #98 | — | 鷹揚×感情的 | #97と同じ(林準拠で明るく) | …っ…ありがとう。…うまく言えないけど、本当に、ありがとう。(現行寄り) |
| G | — | 9本: #4 #23 #32 #46 #60 #71 #74 #88 #91 | 試合中の出来事(繋いだ・崩した・時間を稼いだ・粘った・耐えた等)を前提にしている。現行の「繋いでくれた」と同じ程度だが、パートナーがほとんどリングに入らずに勝った試合だと少しずれる。名前入りの #23 #46 #74 #88 #91 は、誰がそうしたかをはっきり言う形になった | 気になる行は「繋いでくれた」程度のぼかしに戻す |

## 4. 全98本

### 4-1. 標準(standard)

骨格: 現代の標準語。性格でカジュアル度が振れる。名前は呼び捨て(内気だけ敬体に合わせて「さん」)

#### ノーマル(normal) — 在籍6名・アンカー深町真琴

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #1 standard.normal[1] | **呼ぶ** | {partner}、ありがとう。二人だから勝てたよ。 | **{partner}、ありがとう！ 一人じゃ、ここまで持たなかったよ。** | `Thank you, {partner}. We won because there were two of us.` | `Thanks, {partner}! On my own, I'd never have lasted that long.` | 「二人だから勝てた」を裏側(一人なら持たなかった)から言う。原文と同じく文頭で呼ぶ |
| #2 standard.normal[2] | — | やった…{partner}となら勝てるって、信じてた！ | **よしっ！ 組むって決まった時から、いけるって思ってたんだ♪** | `We did it... I knew we could win together, {partner}!` | `Yes! I had a good feeling about us the moment we got paired up ♪` | アンカー深町の掛け声「よしっ」と♪。「信じてた」→組むと決まった時からいけると思っていた |

#### 真面目(earnest) — 在籍9名・アンカー井沢遥

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #3 standard.earnest[1] | **呼ぶ** | {partner}、あなたを信じてよかった。この勝ち、二人のものだよ。 | **ふぅ…{partner}を信じて任せたの、正解だったわね。この勝ちは、二人で分け合いましょう。** | `{partner}, I was right to trust you. This win belongs to both of us.` | `Phew... trusting you was the right call, {partner}. Let's split this win between us.` | 井沢の息を整える間と「〜わね」。原文の「あなたを信じて」を名前に |
| #4 standard.earnest[2] | — | {partner}が繋いでくれたから…最後まで諦めずに済んだ。 | **苦しいところを繋いでもらったおかげで…最後まであきらめずにいられたわ。** | `You kept it alive for me, {partner}... that's why I never had to quit.` | `You got us through the rough stretch... so I could keep going without giving up.` | 勝因を過程に帰す真面目帯の型。表記はアンカーの「あきらめ」に合わせた |

#### 強気(bold) — 在籍7名・アンカー高津小春

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #5 standard.bold[1] | **呼ぶ** | やったな{partner}！ 二人揃えば、負ける気がしないよ！ | **当然の結果よ。…でも、{partner}と一緒だと、負ける気が全然しないわね。** | `We did it, {partner}! With the two of us out there, losing isn't on the table!` | `Of course we won. ...But with you around, {partner}, I never once felt like losing.` | 高津の啖呵→素が漏れる落差。前稿の「アンタ」を名前に置き換えた |
| #6 standard.bold[2] | — | 見たか、これが{partner}と私のタッグの力だ！ | **見た？ 二人で組めば、この程度は当たり前よ？** | `See that? That's what {partner} and I are together!` | `See that? Put the two of us together and this is a given. Any doubts?` | 見下ろす疑問形「〜よ？」。観客に向けた行なので名前なし |

#### お気楽(easygoing) — 在籍6名・アンカー宇田川里奈

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #7 standard.easygoing[1] | **呼ぶ** | {partner}〜お疲れさま！ 私たち、息ぴったりだったね〜 | **{partner}、ハイタッチ〜♪ 合図なしで通じちゃうの、マジ最高じゃん！** | `{partner}~ nice work! We were so in step out there~` | `High five, {partner}~ ♪ We didn't even need to signal each other. Totally the best!` | 名前なし21本「私たち、息ぴったりだったね！」とほぼ同文だったため「合図なしで通じる」に。宇田川準拠の軽いギャルノリ |
| #8 standard.easygoing[2] | — | 勝っちゃった。{partner}と組むの、やっぱ楽しい〜 | **勝っちゃった〜♡ 組むの楽しすぎて、試合ってこと忘れてたかも♪** | `And we won. Teaming with {partner} really is the best~` | `We won~ ♡ Teaming up was so fun I kinda forgot it was a match ♪` | 「組むのが楽しい」を軽い誇張で |

#### 寡黙(quiet) — 在籍2名・アンカー早見知子

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #9 standard.quiet[1] | **呼ぶ** | …{partner}、ありがとう。 | **…助かったわ。組んだ相手が{partner}で、よかったかも。** | `...Thank you, {partner}.` | `...That helped, {partner}. Glad it was you I got paired with, I think.` | 現行は蠱惑×寡黙[1]と同文(英訳も共有)だったので分けた。早見の「〜わ」「〜かも。」。前稿の「あなた」を名前に |
| #10 standard.quiet[2] | — | …{partner}と、だから勝てた。 | **…勝てた理由？ 隣を見れば分かるでしょ。** | `...With {partner}. That's the only reason we won.` | `...Why we won? Just look who was next to me.` | 現行はヤンキー×寡黙[2]と同文だったので分けた。早見の乾いた軽口で「あなたがいたから」 |

#### 内気(shy) — 在籍1名・アンカー朝比奈ひかり(仮)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #11 standard.shy[1] | **呼ぶ** | {partner}…ほ、本当に…ありがとう…！ | **あ、あの、{partner}さん……ほ、本当に……ありがとうございました……！** | `{partner}... th-thank you... really...!` | `U-um, {partner}... th-thank you... so, so much...!` | アンカー朝比奈の地の声(敬体+「あの……」)に寄せた。敬体なので名前に「さん」を付けた(標準で唯一) 【迷い】 |
| #12 standard.shy[2] | — | わ、私…頑張れた…{partner}のおかげ…！ | **わ、わたし……ちゃんと、やれてましたか……？ 一緒だったから、足が止まらなかったんです……！** | `I-I got through it... it's because of {partner}...!` | `D-did I do okay out there...? Having you with me kept my legs moving...!` | 一人称は内気帯のひらがな「わたし」。朝比奈の「見ててくれましたか？」型の確認+感謝 【迷い】 |

#### 感情的(emotional) — 在籍1名・アンカー吉野萌子(仮)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #13 standard.emotional[1] | **呼ぶ** | {partner}っ…！ ありがとう…二人で、勝ったよ…！ | **{partner}っ…！ ありがとう…ありがとうっ…！ 二人で勝てたんだよ、ほんとに…！** | `{partner}...! Thank you... we won — the two of us...!` | `{partner}...! Thank you — thank you...! We actually won this, the two of us...!` | 吉野の反復。原文と同じく名前を叫んでから |
| #14 standard.emotional[2] | — | 絶対勝つって、約束したもんね…{partner}…っ！ | **絶対勝とうねって、控室で言ったよね…っ！ ほんとになった…！** | `We promised each other we'd win... didn't we, {partner}...!` | `We said we'd win, back in the locker room...! And we really did...!` | 「約束」を控室での一言という具体に 【迷い】 |

### 4-2. 丁寧(polite)

骨格: 敬語基調(ただし寡黙=岸の省言、内気=高島の常体など、セル内で割れがある)。名前は「さん」付け

#### ノーマル(normal) — 在籍8名・アンカー澤出みずき

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #15 polite.normal[1] | **呼ぶ** | {partner}さん、ありがとうございました。二人で掴んだ勝ちです。 | **あっ…勝てた…。{partner}さん、今日はずいぶん助けてもらっちゃいましたね。** | `Thank you so much, {partner}. The two of us earned this one.` | `Ah... we won... You really helped me out a lot today, {partner}.` | 名前なし21本「二人でつかんだ勝利ですね」と重なるため言い換え。澤出の「あっ…勝てたかぁ」の安堵と、柔らかい礼 |
| #16 polite.normal[2] | — | {partner}さんを信じてよかったです…ちゃんと、勝てました！ | **信じてよかったです…ほら、ちゃんと勝てましたよ！** | `I was right to believe in you, {partner}... and we really did win!` | `I was right to believe in you... See? We really did win!` | ほぼ原文どおり。「ほら」で相手へ向ける |

#### 真面目(earnest) — 在籍12名・アンカー川野辺菜穂子

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #17 polite.earnest[1] | **呼ぶ** | {partner}さんのおかげです。本当に、ありがとうございました。 | **なんとか、なりましたね…{partner}さんのおかげです。ありがとうございました！** | `This is all thanks to you, {partner}. Truly, thank you.` | `We somehow pulled it off... all thanks to you, {partner}. Thank you!` | 川野辺の「なんとかなったぁ」の安堵を敬語で。原文と同じ「{partner}さんのおかげです」。「報われた」は通常のタッグ戦には重いので使わない。#11と「本当に…ありがとうございました」が重ならないようにした |
| #18 polite.earnest[2] | — | {partner}さんが繋いでくれたバトン…無駄にせずに済みました。 | **託してもらった試合、ちゃんと勝ちで返せました。…いい試合でしたね！** | `The baton you handed me, {partner}... I didn't waste it.` | `You trusted me with this one, and I paid you back with a win. ...What a good match!` | 「バトン」の比喩を「託す」に。相手へのリスペクトで締めるセルの型 |

#### 強気(bold) — 在籍1名・アンカー大久保桃子

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #19 polite.bold[1] | **呼ぶ** | やりましたね{partner}さん！ 二人揃えば負けません！ | **やりましたね、{partner}さん！ 二人で全力を出し切れば、負けません！** | `We did it, {partner}! Together, we don't lose!` | `We did it, {partner}! When we both go all out, we don't lose!` | 大久保の「全力」。原文と同じ位置で呼ぶ |
| #20 polite.bold[2] | — | 見ましたか、これが{partner}さんと私のタッグです！ | **ふぅ……見てもらえましたか？ これが、二人で組んだ実力です！** | `Did you see that? That is {partner} and me as a team!` | `Phew... did you all see? That's what the two of us can really do!` | アンカーの「ふぅ……」+観客への確認。観客に向けた行なので名前なし |

#### お気楽(easygoing) — 在籍3名・アンカー木ノ内幸音

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #21 polite.easygoing[1] | — | {partner}さん、お疲れさまです♪ 息ぴったりでしたね〜 | **途中から、次に何をするか全部わかっちゃいました♪ すごくないですか！？** | `Nice work, {partner} ♪ We were right in step, weren't we~` | `Halfway through, I could tell exactly what you'd do next ♪ Isn't that amazing!?` | 「お疲れさま」「息ぴったり」は名前なし21本の定番なので避けた。木ノ内のはしゃぎ |
| #22 polite.easygoing[2] | **呼ぶ** | 勝っちゃいました♪ {partner}さんと組めて、楽しかったです〜 | **勝っちゃいました♪ {partner}さんと組めて楽しかったです、またやりましょうね〜！** | `We won ♪ Teaming up with {partner} was such fun~` | `We won ♪ Teaming up with you was so much fun, {partner}. Let's do it again soon~!` | ほぼ原文どおり+「またやりましょう」 |

#### 寡黙(quiet) — 在籍2名・アンカー岸ゆみえ

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #23 polite.quiet[1] | **呼ぶ** | …{partner}さん、ありがとうございました。 | **…ありがとう、{partner}さん。先に崩してくれたから、組み立てが楽になったの。** | `...Thank you, {partner}. Truly.` | `...Thank you, {partner}. You broke them down first, so the rest was easy to plan.` | 裁定26(丁寧×寡黙=岸準拠・言葉を選ぶ省言)に合わせ、理由→結論の常体に。前稿の「あなた」を名前に 【迷い】 |
| #24 polite.quiet[2] | — | …{partner}さんと、だから勝てました。 | **…勝因は、組んだ相手。考えるまでもないことだわ。** | `...It was with {partner}. That's why we won.` | `...What won it was who I teamed with. There's nothing more to analyze.` | 同上(岸の理詰め) 【迷い】 |

#### 内気(shy) — 在籍4名・アンカー高島さや

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #25 polite.shy[1] | — | {partner}さん…ほ、本当に…ありがとうございました…！ | **ご、ごめんなさい、うまく言えなくて…でも、ほんとに、ありがとうございます…！** | `{partner}... th-thank you so much... really...!` | `S-sorry, I can't find the right words... but really, thank you so much...!` | 標準×内気(#11)と同じ形になるのを避けた。敬語組(松岡)寄り |
| #26 polite.shy[2] | **呼ぶ** | わ、わたし…頑張れました…{partner}さんのおかげです…！ | **わ、わたし…一度も、逃げなかったの…！ {partner}さんが一緒に出てくれたから…！** | `I-I made it through... all because of you, {partner}...!` | `I-I never ran away, not once...! Because you were out there with me, {partner}...!` | アンカー高島の常体(「〜の…！」「〜から…！」) 【迷い】 |

#### 感情的(emotional) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #27 polite.emotional[1] | — | {partner}さんっ…！ ありがとうございます…二人で、勝てました…！ | **ありがとうございますっ…！ す、すみません、涙が止まらなくて…っ** | `{partner}...! Thank you... we won, the two of us...!` | `Thank you so much...! S-sorry, I can't stop crying...` | 在籍0(外挿)。丁寧の敬語が涙で崩れかける形 |
| #28 polite.emotional[2] | **呼ぶ** | 絶対勝つって約束…守れましたね、{partner}さん…っ！ | **約束、守れましたね、{partner}さん…っ！ よかった…ほんとに、よかったです…！** | `That promise to win... we kept it, {partner}...!` | `We kept our promise, {partner}...! I'm so glad... so, so glad...!` | 在籍0(外挿)。ほぼ原文どおり |

### 4-3. 蠱惑(seductive)

骨格: 色気と余裕。声を荒げない。感情的=取り乱しではなく敵意が漏れる(裁定29)。名前は呼び捨て

#### ノーマル(normal) — 在籍2名・アンカー橘玲美

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #29 seductive.normal[1] | — | {partner}…ありがとう。二人でつかんだ勝ち、悪くないでしょ？ | **ありがとう。二人がかりで追い詰めるのって、なかなか愉しいものね♪** | `Thank you, {partner}. A win the two of us took — not bad, was it?` | `Thank you. Cornering them as a pair... that was rather enjoyable ♪` | 橘帯の「支配と遊戯」。名前なし21本の「二人でつかんだ」を避けた |
| #30 seductive.normal[2] | **呼ぶ** | ふふ、{partner}となら負ける気がしないわ。 | **ふふ、{partner}がいると、負けるところが想像できないの。…相手の子には気の毒だけど♪** | `Mm. With {partner} beside me, losing never crosses my mind.` | `Hehe... with you here, {partner}, I can't picture us losing. ...Pity the other girls ♪` | 余裕の下の嗜虐を一滴(サディスト帯)。原文と同じく名前を呼ぶ行 |

#### 真面目(earnest) — 在籍4名・アンカー新見ゆり

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #31 seductive.earnest[1] | **呼ぶ** | {partner}…あなたを信じてよかった。この勝ちは二人のものよ。 | **…見立てどおりだったわ。信じて正解。この勝ち、半分は{partner}の手柄よ。** | `{partner}... trusting you was the right call. This win is ours, both of ours.` | `...Just as I judged. Trusting you was right — half of this win is yours, {partner}.` | 新見帯の「観察」。「二人のもの」→「半分は{partner}の手柄」 |
| #32 seductive.earnest[2] | — | {partner}、あなたが繋いでくれたから…最後まで折れずにいられたの。 | **時間を稼いでくれたから…こちらは落ち着いて、勝ち筋を選べたの。** | `You held the line for me, {partner}... that's why I never broke.` | `You bought me time... so I could calmly pick our way to the win.` | 勝因を自分の言葉で説明する律義さ。「折れずに」の比喩を避けた |

#### 強気(bold) — 在籍3名・アンカー浅見里緒菜

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #33 seductive.bold[1] | **呼ぶ** | やったわね{partner}。二人揃えば、負ける気なんてしないわ。 | **やったわね、{partner}。この二人なら、もっと上まで行けるわ…！** | `We did it, {partner}. With the two of us, losing is not a thought I have.` | `We did it, {partner}. The two of us can climb a lot higher than this...!` | 浅見帯の野心(常に「まだ上」)。負けず嫌いが「…！」で漏れる |
| #34 seductive.bold[2] | — | 見た？ これが{partner}と私のタッグよ。 | **今の、ちゃんと見ていてくれた？ これが私たちのやり方。…忘れさせないわ。** | `Did you watch? That is what {partner} and I are.` | `Were you watching closely? That's how we do it. ...And no one gets to forget it.` | 言い差しで野心を匂わせる。観客に向けた行なので名前なし |

#### お気楽(easygoing) — 在籍7名・アンカー倉見菜々

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #35 seductive.easygoing[1] | **呼ぶ** | {partner}〜お疲れさま♪ 息ぴったりだったでしょ？ | **{partner}、いい感じに噛み合ってたじゃない？ おかげで楽させてもらったわ♪** | `{partner}~ well done ♪ We were right in time with each other, no?` | `We meshed pretty nicely, didn't we, {partner}? Made my job easy ♪` | 名前なし21本「息ぴったりだったでしょ？」と同文になるため置き換え。倉見帯の省エネ・実利 |
| #36 seductive.easygoing[2] | — | 勝っちゃった♪ やっぱり{partner}と組むと、楽しいわ〜 | **勝っちゃった♪ 楽しい上に勝ち星まで付いてくるなんて、この組み合わせ、お得よね♪** | `And we won ♪ Teaming with {partner} really is a pleasure~` | `We won ♪ It's fun AND it comes with a win? This pairing's a real bargain ♪` | 名前なし21本「一緒に戦うの、やっぱり楽しいわね。」と重なるため、打算(お得)の角度に |

#### 寡黙(quiet) — 在籍2名・アンカー高槻千歳

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #37 seductive.quiet[1] | — | …{partner}、ありがとう。 | **…ふふ。ありがとう、と言っておくわ。** | `...Thank you, {partner}.` | `...Hehe. Consider yourself thanked.` | 現行は標準×寡黙[1]と同文だったので分けた。高槻帯の最小語数+含み笑い |
| #38 seductive.quiet[2] | **呼ぶ** | …{partner}と、だから…ね。 | **…{partner}となら、筋書きどおりに運ぶわね。** | `...Because it was {partner}. That's all.` | `...With you, {partner}, everything goes exactly to script.` | 「計画通り」の帯。アンカーの語をそのまま使わない |

#### 内気(shy) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #39 seductive.shy[1] | — | {partner}…う、嬉しい…二人で、勝てて…わ… | **…あ、ありがとう。こういうの、面と向かって言うの…慣れてないの…** | `{partner}... I-I'm so glad... we won, together...` | `...Th-thank you. Saying it to your face like this... I'm not used to it...` | 在籍0(外挿)。蠱惑の余裕が照れで崩れる |
| #40 seductive.shy[2] | **呼ぶ** | {partner}となら…だ、大丈夫って…信じてた、の… | **だ、大丈夫って、思えたの…{partner}が、そこにいたから…** | `With {partner}... I-I knew it would be all right... I believed that...` | `I-I felt like it would be okay... because you were right there, {partner}...` | 在籍0(外挿)。ほぼ原文どおり。前稿の「あなた」を名前に |

#### 感情的(emotional) — 在籍2名・アンカー東金沙織

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #41 seductive.emotional[1] | **呼ぶ** | {partner}っ…！ やったわ…二人で、勝ったのよ…！ | **ふふっ…！ {partner}、あの子たちの悔しそうな顔、見えた？ 二人で勝つと、たまらないわね♪** | `{partner}...! We did it... the two of us won...!` | `Hehe...! See their sour faces, {partner}? Winning as a pair is simply delicious ♪` | 裁定29(蠱惑×感情的=取り乱しではなく敵意・攻撃性が漏れる)に合わせ、涙から攻撃性へ。名前を呼んで相手と喜びを分ける形にした 【迷い】 |
| #42 seductive.emotional[2] | — | 約束…守れたわね、{partner}…っ！ | **約束どおりね…！ 私たちを甘く見た子たちに、たっぷり思い知らせてやったわ♪** | `The promise... we kept it, {partner}...!` | `Just as we promised...! We made the ones who underestimated us pay for it ♪` | 同上。「約束」は残した 【迷い】 |

### 4-4. ヤンキー(delinquent)

骨格: 伝法(じゃねえ/かよ/ぜ)は骨格内。一人称は「私」、複数は「私ら」、二人称は「あんた」。寡黙・内気・真面目・感情的の「っす」体は対社長の言葉なので、パートナーに向ける本件はタメ口にした。名前は呼び捨て

#### ノーマル(normal) — 在籍4名・アンカー岩屋みら

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #43 delinquent.normal[1] | **呼ぶ** | {partner}、ありがとな！ 二人だから勝てたんだ！ | **{partner}、ありがとな！ おかげで、真っ向から行けたんだ！** | `Thanks, {partner}! Took the both of us to pull that off!` | `Thanks, {partner}! With you backin' me up, I could go right at 'em!` | 岩屋帯の王道の自負(真っ向勝負)。原文と同じく文頭で呼ぶ |
| #44 delinquent.normal[2] | — | やったぜ{partner}！ 私ら、いいコンビだろ？ | **へへっ、私ら、けっこういいコンビじゃねえ？** | `We got 'em, {partner}! We make a pretty good pair, huh?` | `Heh. We make a pretty solid pair, don't we?` | 一人称複数はヤンキー帯の実績「私ら」 |

#### 真面目(earnest) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #45 delinquent.earnest[1] | — | {partner}、お前を信じてよかった。この勝ちは二人のもんだ。 | **あんたを信じてよかった。…この勝ちは、二人のもんだ。** | `{partner}, trusting you was right. This win belongs to us both.` | `Trustin' you was the right move. ...This win's ours. Both of us.` | 在籍0(外挿)。二人称「お前」→ヤンキー既定の「あんた」(裁定55) |
| #46 delinquent.earnest[2] | **呼ぶ** | {partner}が繋いでくれたから…あたし、最後まで踏ん張れた。 | **{partner}が粘ってくれた分、こっちも倒れずに済んだんだ。…ありがてえ。** | `You kept it going for me, {partner}... that's why I held on to the end.` | `You hung in there, {partner}, so I didn't go down either. ...Appreciate it.` | 在籍0(外挿)。一人称「あたし」を落とした。名前なし21本「最後までついてきてくれて、ありがとな！」に寄らないよう「最後まで」を外した |

#### 強気(bold) — 在籍8名・アンカー本郷真理子

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #47 delinquent.bold[1] | **呼ぶ** | やったな{partner}！ 私らが組みゃ、負ける気がしねえ！ | **どうだ、{partner}！ 私らが組みゃ、どこの誰が来たって負けねえんだよ！** | `We did it, {partner}! Us two together, losing's not happening!` | `How 'bout that, {partner}! Us two together? Doesn't matter who shows up. We don't lose!` | 本郷帯の喧嘩口調「〜んだよ」。原文の「やったな{partner}！」の位置で呼ぶ |
| #48 delinquent.bold[2] | — | 見たかよ！ {partner}と私のタッグ、最強だぜ！ | **見たかよ！ このタッグが最強だ。文句あるやつ、いるか？** | `You see that? {partner} and me — nobody beats this team!` | `You see that? This team's the strongest there is. Anybody wanna argue?` | 一人称「私」を落とした。観客・対戦相手に向けた行なので名前なし |

#### お気楽(easygoing) — 在籍1名・アンカー生駒エリカ

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #49 delinquent.easygoing[1] | **呼ぶ** | {partner}〜お疲れさん！ 私ら息ぴったりだったろ？ | **{partner}、目ぇ合っただけで分かったろ？ 楽しかったな〜♪** | `{partner}~ good work! We were right in sync, yeah?` | `One look and we both knew the play, right, {partner}? That was a blast~ ♪` | 名前なし21本の「お疲れさん」「息ぴったり」を避け、目配せという具体に |
| #50 delinquent.easygoing[2] | — | 勝っちゃったぜ♪ {partner}と組むの、やっぱ楽しいわ〜 | **よっしゃ♪ 組んでると、しんどい試合も遊んでるみてえだな** | `And we took it ♪ Teaming with {partner} is a blast~` | `Alright ♪ Teamin' up, even a rough match feels like goofin' around.` | 生駒帯の「勝ちすら軽く流す余裕」。語尾はアンカーの「〜だな」 |

#### 寡黙(quiet) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #51 delinquent.quiet[1] | **呼ぶ** | …{partner}、恩に着る。 | **…{partner}、恩に着る。この借りは、次のリングで返す。** | `...I owe you, {partner}.` | `...Owe you one, {partner}. I'll pay it back in the ring next time.` | 在籍0(外挿)。原文「…{partner}、恩に着る。」を残した |
| #52 delinquent.quiet[2] | — | …{partner}と、だから勝てた。 | **…あんたとだから、勝てた。それ以上は言わねえ。** | `...With {partner}. That's the only reason we won.` | `...Won 'cause it was you. Not sayin' more than that.` | 在籍0(外挿)。現行は標準×寡黙[2]と同文だったので分けた |

#### 内気(shy) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #53 delinquent.shy[1] | — | {partner}…あ、ありがとな…！ あたし、頑張れた…！ | **あ、ありがとな…！ …こ、こっち見んなよ、照れんだろ…** | `{partner}... th-thanks...! I made it through...!` | `Th-thanks...! ...D-don't look at me like that, it's embarrassin'...` | 在籍0(外挿)。一人称「あたし」を落とし、照れ隠しに |
| #54 delinquent.shy[2] | **呼ぶ** | ぜ、全部…{partner}のおかげ、だ…！ | **ぜ、全部…{partner}のおかげ、だ…！ …い、今のナシ、忘れろ…** | `A-All of it... that was {partner}...!` | `A-all of it... that was thanks to you, {partner}...! ...F-forget I said that.` | 在籍0(外挿)。原文と同じ「全部…{partner}のおかげ」 |

#### 感情的(emotional) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #55 delinquent.emotional[1] | — | {partner}っ…！ やったぜ…二人で、勝ったんだ…！ | **やった…やったぜ…！ ちくしょう、嬉しくて声が震えやがる…！** | `{partner}...! We did it... the two of us took it...!` | `We did it... we actually did it...! Ugh, my voice won't stop shakin'...!` | 在籍0(外挿)。「ぜ」「やがる」はヤンキー骨格内の伝法として温存(検品06) |
| #56 delinquent.emotional[2] | **呼ぶ** | 絶対勝つって言ったろ…！ な、{partner}…っ！ | **絶対勝つって言ったろ…！ な、{partner}…？ 言ったとおりになったろ…っ！** | `Told you we'd win...! Right, {partner}...!` | `Told you we'd win...! Right, {partner}...? Just like I said...!` | 在籍0(外挿)。ほぼ原文どおり |

### 4-5. お嬢様(ojousama)

骨格: 語彙で品格を作り、「ですわ」はアクセント程度。強気=大河内は声を張らず上から。名前は「さん」付け

#### ノーマル(normal) — 在籍2名・アンカー富岡加奈子

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #57 ojousama.normal[1] | **呼ぶ** | {partner}さん、ありがとうございますわ。二人で掴んだ勝利ですのね。 | **{partner}さん、感謝するわ。…この一勝は、二人で積み上げたぶんの結果ね。** | `Thank you, {partner}. A victory the two of us took together.` | `Thank you, {partner}. ...This win is simply what the two of us built, step by step.` | 富岡準拠で装飾語尾ゼロ。「積み上げ」は求道の語彙 |
| #58 ojousama.normal[2] | — | {partner}さんを信じておりまして、本当によかったですわ。 | **この二人なら崩れない。…最初から、そう信じていたわ。** | `I am so very glad that I placed my faith in you, {partner}.` | `The two of us would not crumble. ...I believed that from the very start.` | 現行は真面目[1]と同文(英訳も共有)だったので分けた。取り乱さない佇まい |

#### 真面目(earnest) — 在籍1名・アンカー芝彩音

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #59 ojousama.earnest[1] | **呼ぶ** | {partner}さんを信じておりまして、本当によかったですわ。 | **{partner}さんに預けた信頼に、しかと応えていただきましたわ。** | `I am so very glad that I placed my faith in you, {partner}.` | `The trust I placed in you was answered in full, {partner}. I am truly grateful.` | 芝の礼節と古風な副詞。「ましたわ」は真面目帯でこの1本だけ(アンカー実績3本中1回に合わせる)。前稿の「あなた」を名前に |
| #60 ojousama.earnest[2] | — | {partner}さんが繋いでくださったからこそ、掴めた勝利ですの。 | **持ちこたえてくださったから、最後に全力で当たれたのだもの。** | `It is only because you held on for me, {partner}, that this victory came at all.` | `Because you held out for me, I could meet them with everything I had at the end.` | 「全力で当たることが礼儀」の倫理 |

#### 強気(bold) — 在籍1名・アンカー大河内紗代子

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #61 ojousama.bold[1] | **呼ぶ** | おやりになりましたわね{partner}さん！ 二人揃えば負けませんわ！ | **ふふ…{partner}さんがいて、負ける理由がどこにあるのかしら？** | `You were magnificent, {partner}! The two of us together do not lose!` | `Hehe... with you at my side, {partner}, what reason could there possibly be to lose?` | 大河内準拠で「！」と「ですわ」を外した。現行の「おやりになりましたわね」は敬語として不自然 【迷い】 |
| #62 ojousama.bold[2] | — | ご覧になって？ {partner}さんとわたくしのタッグですのよ！ | **ご覧になって？ これに並ぶタッグなど、どこにもいないでしょうね。** | `Did you see? That is {partner} and myself as a team!` | `Did you see? I am afraid no other team comes close.` | 「〜でしょうね」の偽の同情(大河内の道具)。一人称「わたくし」を落とした。観客に向けた行なので名前なし |

#### お気楽(easygoing) — 在籍1名・アンカー蔵前静

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #63 ojousama.easygoing[1] | — | {partner}さん、お疲れさまですわ♪ 息ぴったりでしたわね〜 | **あらあら、打ち合わせもなしに、こんなに揃うものなのね。** | `Well done, {partner} ♪ We were perfectly in step, were we not~` | `Goodness, we moved so neatly together, and without a single rehearsal.` | 名前なし21本の「お疲れさま」「息の合った」を避けた。蔵前の「あらあら」 【迷い】 |
| #64 ojousama.easygoing[2] | **呼ぶ** | 勝ってしまいましたわ♪ {partner}さんと組むの、楽しいですの〜 | **あら、勝ってしまいましたわ。こんなに楽しいのなら、{partner}さんとまたご一緒したいものね。** | `We have gone and won ♪ Teaming with {partner} is such a delight~` | `Oh my, we have won. With this much fun, {partner}, I would gladly team up again.` | 勝っても半ば他人事の受け止め。「ですの〜」と♪を外した 【迷い】 |

#### 寡黙(quiet) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #65 ojousama.quiet[1] | — | …{partner}さん、感謝いたしますわ。 | **…感謝いたします。言葉は、あとで改めて。** | `...My thanks to you, {partner}.` | `...My thanks. The proper words can wait until later.` | 在籍0(外挿) |
| #66 ojousama.quiet[2] | **呼ぶ** | …{partner}さんと、だからですの。 | **…ご一緒したのが、{partner}さんでよかった。…それだけ。** | `...It was with {partner}. That is the whole of it.` | `...I am glad it was you beside me, {partner}. ...That is all.` | 在籍0(外挿)。前稿の「あなた」を名前に |

#### 内気(shy) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #67 ojousama.shy[1] | — | {partner}さん…あ、ありがとうございますわ…！ | **あ、ありがとうございます…こ、こういう時、どんなお顔をすればよいのかしら…** | `{partner}... th-thank you ever so much...!` | `Th-thank you... At a moment like this, I do not quite know what face to make...` | 在籍0(外挿) |
| #68 ojousama.shy[2] | **呼ぶ** | わ、私…頑張れましたわ…{partner}さんのおかげで…！ | **み、みっともない姿は…お見せせずに済みましたかしら…？ {partner}さんのおかげですわ…** | `I-I managed it... thanks entirely to {partner}...!` | `D-did I manage not to look unseemly...? It is all thanks to you, {partner}...` | 在籍0(外挿)。一人称「私」を落とした。原文と同じ「{partner}さんのおかげ」 |

#### 感情的(emotional) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #69 ojousama.emotional[1] | — | {partner}さんっ…！ やりましたわ…二人で、勝ったのですわ…！ | **勝ちましたのね…！ 二人で…！ …ごめんなさい、今だけは、お行儀を忘れさせて…** | `{partner}...! We have done it... the two of us have won...!` | `We won...! Together...! ...Forgive me — just this once, let me forget my manners...` | 在籍0(外挿)。熱くなっても品を気にする |
| #70 ojousama.emotional[2] | **呼ぶ** | 約束、守れましたわね…{partner}さん…っ！ | **お約束、果たせましたわね、{partner}さん…っ！ …嬉しくて、言葉になりませんの…** | `We kept our promise, did we not... {partner}...!` | `The promise is kept, {partner}...! ...I am far too happy to say anything sensible...` | 在籍0(外挿)。原文と同じく約束の行で呼ぶ |

### 4-6. クール(cool)

骨格: 言い切り・体言止め・低温。呼びかけをしない。感嘆符なし。名前は呼び捨てで、呼びかけではなく言及に使う

#### ノーマル(normal) — 在籍3名・アンカー未指定(西川・赤沼・柳沼)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #71 cool.normal[1] | — | …{partner}、ありがとう。二人で、勝った。 | **…ありがとう。二人で削って、二人で取った。** | `...Thank you, {partner}. The two of us. We won.` | `...Thanks. Wore them down together, took it together.` | 名前なし21本「…お疲れ。二人で、勝てた。」と重なるため、言い切りの対句に |
| #72 cool.normal[2] | **呼ぶ** | …{partner}となら、勝てる。 | **…{partner}と組めば勝てると読んでた。読み通り。** | `...With {partner}, I win.` | `...Figured teaming with {partner} would win it. Read it right.` | 原文「…{partner}となら、勝てる。」の言及型。分析の語彙 |

#### 真面目(earnest) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #73 cool.earnest[1] | — | …{partner}。信じて、よかった。この勝ちは、二人の。 | **…信じたのは、正しかった。…いい判断だった。** | `...{partner}. Right to trust you. This win is ours.` | `...Trusting you was right. ...Good call.` | 在籍0(外挿) 【迷い】 |
| #74 cool.earnest[2] | **呼ぶ** | …{partner}が繋いだ。だから、勝てた。 | **…あの場面、{partner}が耐えた。だから、勝ち切れた。** | `...{partner} held on. That's why we won.` | `...{partner} held on back there. That's how we closed it out.` | 在籍0(外挿)。原文「…{partner}が繋いだ。だから、勝てた。」の型 |

#### 強気(bold) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #75 cool.bold[1] | **呼ぶ** | …やったな、{partner}。二人なら、負けない。 | **…{partner}となら、負けない。今日で証明した。** | `...We did it, {partner}. Two of us. We don't lose.` | `...With {partner}, we don't lose. Proved it today.` | 在籍0(外挿) |
| #76 cool.bold[2] | — | …見たか。{partner}と、あたしのタッグだ。 | **…見たか。これが、この二人の仕事。** | `...You saw. {partner} and me. That's the team.` | `...You saw. That's how this pair works.` | 在籍0(外挿)。一人称「あたし」を落とした |

#### お気楽(easygoing) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #77 cool.easygoing[1] | — | …{partner}、お疲れ。息、ぴったりだった。 | **…やりやすかった。余計なこと、考えずに済んだ。** | `...Good work, {partner}. We were in step.` | `...Easy to work with. Didn't have to think about anything extra.` | 在籍0(外挿)。名前なし21本「…息、ぴったりだったね。」と重なるため置き換え |
| #78 cool.easygoing[2] | **呼ぶ** | …勝った。{partner}と組むの、好き。 | **…勝った。{partner}と組むのは、嫌いじゃない。** | `...We won. I like teaming with {partner}.` | `...Won. Don't mind teaming up with {partner} at all.` | 在籍0(外挿)。原文「{partner}と組むの、好き」を控えめな言い方に |

#### 寡黙(quiet) — 在籍3名・アンカー堂前ユキ

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #79 cool.quiet[1] | — | ……{partner}、ありがとう。 | **……ありがとう。……次も、組む。** | `...Thanks, {partner}.` | `...Thanks. ...Next time, same team.` | 堂前帯の短文 【迷い】 |
| #80 cool.quiet[2] | **呼ぶ** | ……{partner}と、だから。 | **……{partner}がいなければ、負けてた。** | `...Because of {partner}. That's it.` | `...Without {partner}, I'd have lost.` | 堂前帯の短文。原文「……{partner}と、だから。」の言及型 |

#### 内気(shy) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #81 cool.shy[1] | — | …っ、{partner}…ありがとう… | **…っ。……あり、がと。……今の、聞こえた？** | `...Kh. {partner}... thank you...` | `...Kh. ...Th-thanks. ...Did you catch that?` | 在籍0(外挿)。言葉が途切れるのが内気の変調 |
| #82 cool.shy[2] | **呼ぶ** | …わ、私、頑張れた…{partner}と… | **…ちゃんと、やれた。…{partner}に、ついていけた。** | `...I-I got through it... with {partner}...` | `...Held up fine. ...Kept pace with {partner}.` | 在籍0(外挿)。一人称「私」を落とした |

#### 感情的(emotional) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #83 cool.emotional[1] | **呼ぶ** | …っ、{partner}…勝った。二人で。 | **…っ。…勝った。{partner}と、二人で。…勝ったんだ。** | `...Kh. {partner}... we won. Together.` | `...Kh. We won — {partner} and me. ...We actually won.` | 在籍0(外挿)。反復で抑えた感情を見せる |
| #84 cool.emotional[2] | — | …約束、守った。{partner}…っ。 | **…二人で勝つ、と決めてた。…決めた通りに、なった。** | `...Kept the promise. {partner}...` | `...We'd decided to win together. ...It went just as we decided.` | 在籍0(外挿) |

### 4-7. 鷹揚(composed)

骨格: 大人の余裕。中性的な「〜だ」「〜だよ」。明るい帯(強気・お気楽・感情的)は「…」で始めない。名前は呼び捨て

#### ノーマル(normal) — 在籍8名・アンカー阿武隈塔子

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #85 composed.normal[1] | **呼ぶ** | …{partner}、ありがとう。二人だから、勝てたね。 | **…ありがとう、{partner}。いい仕事をしてくれたね。おかげで、こっちは落ち着いて戦えたんだ。** | `...Thanks, {partner}. It took both of us to win that one.` | `...Thank you, {partner}. You did good work, so I could keep a calm head out there.` | 阿武隈帯の「まず相手を労う」 |
| #86 composed.normal[2] | — | …{partner}となら勝てる気がしてた。…当たったよ。 | **…なんとなく、今日は負けない気がしてたんだ。…当たったね。** | `...I had a feeling we'd win with {partner}. ...Turns out I was right.` | `...Somehow I just knew we wouldn't lose today. ...Guess I was right.` | 中性的な「〜んだ」 |

#### 真面目(earnest) — 在籍3名・アンカー馬入橋ほとり

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #87 composed.earnest[1] | — | …{partner}、信じてよかったよ。この勝ちは、二人のものだね。 | **信じてよかった。二人とも、まだまだ強くなれるね！** | `...Glad I trusted you, {partner}. This win belongs to the both of us.` | `Glad I trusted you. And we've both still got plenty of room to grow!` | 馬入橋帯の「長期目線の向上心」 【迷い】 |
| #88 composed.earnest[2] | **呼ぶ** | …{partner}が繋いでくれたから、最後まで立てた。ありがとう。 | **…{partner}が踏みとどまってくれたから、最後まで立っていられた。ありがとう。** | `...You kept it alive, {partner}, so I stayed on my feet. Thank you.` | `...You stood your ground, {partner}, so I stayed on my feet to the end. Thank you.` | ほぼ原文どおり |

#### 強気(bold) — 在籍4名・アンカー菊池璃子

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #89 composed.bold[1] | — | …やったね、{partner}。二人なら、負ける気がしないよ。 | **やったね！ 二人で組んだら負けるかって？ …まさか、だよ。** | `...Nicely done, {partner}. With the two of us, I don't see us losing.` | `We did it! Could the two of us lose? ...Not a chance.` | 菊池帯の「自分に問いを立てて自分で答える」 |
| #90 composed.bold[2] | **呼ぶ** | …見た？ {partner}と組めば、こんなもんさ。 | **どう？ ざっとこんなもんだよ。…なんてね、ほとんど{partner}のおかげ。** | `...See that? Pair me with {partner} and this is what you get.` | `How's that? Easy as anything. ...Kidding — it was mostly thanks to you, {partner}.` | 茶目っ気。前稿の「あなた」を名前に |

#### お気楽(easygoing) — 在籍2名・アンカー副沢たまき

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #91 composed.easygoing[1] | **呼ぶ** | …{partner}、お疲れさま。息、ぴったりだったね〜 | **あ〜、楽だった。{partner}が合わせてくれるから、こっちは乗っかるだけだったよね〜** | `...Good work, {partner}. We were right in step there~` | `Ahh, that was easy. You set it all up, {partner}, so I just rode along~` | 名前なし21本「…息、ぴったりだったよ。」と重なるため置き換え。副沢帯の脱力 |
| #92 composed.easygoing[2] | — | …勝っちゃった。{partner}と組むの、やっぱいいな〜 | **勝っちゃったね〜。一緒だと楽しいし、次もこれでいっか♪** | `...And we won. Teaming with {partner} really does suit me~` | `We won~. It's fun with you, so... same pairing next time? Sure, why not ♪` | 副沢の「いっか♪」 【迷い】 |

#### 寡黙(quiet) — 在籍1名・アンカー北畠吉乃

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #93 composed.quiet[1] | — | …{partner}、ありがとう。二人だから、だね。 | **……ありがとう。二人で勝ったの、ちゃんと伝わった？** | `...Thank you, {partner}. Because it was the two of us.` | `...Thank you. Everyone could tell it took both of us, right?` | 北畠の疑問形の確認(「さすがに伝わった？」の型) |
| #94 composed.quiet[2] | **呼ぶ** | …{partner}と、だから勝てた。それだけだよ。 | **……{partner}と組んだから、勝てたの。…分かってるよね？** | `...We won because it was with {partner}. That's all it is.` | `...We won because I teamed with you, {partner}. ...You know that, don't you?` | 北畠の柔らかい凄み。前稿の「あなた」を名前に |

#### 内気(shy) — 在籍0(外挿。今は誰も喋らない)

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #95 composed.shy[1] | — | …{partner}、あ、ありがとう…二人で、勝てたね… | **…え、えっと…ありがとう。…二人で勝てたの、まだちょっと、信じられなくて…** | `...{partner}, th-thank you... we won, the two of us...` | `...U-um... thank you. ...I still can't quite believe we won, the two of us...` | 在籍0(外挿) |
| #96 composed.shy[2] | **呼ぶ** | …わ、私、頑張れたよ…{partner}のおかげ… | **…{partner}の役に、ちゃんと立てたかな…？ …おかげで、頑張りきれたよ** | `...I-I held up out there... thanks to {partner}...` | `...Was I any real help to you, {partner}...? ...Thanks to you, I made it all the way.` | 在籍0(外挿)。一人称「私」を落とした |

#### 感情的(emotional) — 在籍3名・アンカー林真尋

| 番号 | 名前 | 現行のセリフ | 書き直し案 | 英語の現行 | 英語の書き直し案 | メモ |
|---|---|---|---|---|---|---|
| #97 composed.emotional[1] | **呼ぶ** | …{partner}。二人で、勝ったよ。…約束、守れたね。 | **勝ったよ、{partner}！ 二人でもぎ取った一勝だよ！ ね、抱きついていい？** | `...{partner}. The two of us won. ...We kept our promise.` | `We won, {partner}! We wrestled that one away together! Hey — can I hug you?` | 林準拠(明るく直球・「…」をほぼ使わない) 【迷い】 |
| #98 composed.emotional[2] | — | …言葉はいらない。{partner}、ありがとう。…それだけだ。 | **ありがとう！ って、それしか言葉が出てこないや！ 最高だったよ！** | `...No need for words. Thank you, {partner}. ...That's all.` | `Thank you! Yeah, that's all I can manage to say! That was the best!` | 「言葉はいらない」の定型を避け、言葉が出てこない明るさに 【迷い】 |

## 5. src への組み込み方(提案。未実装)

### 推奨: 表は名前を変えずに中身を置き換え、名前なし21本と合わせて引く。名前入りの行は呼び名が取れたときだけ出す

1. `src/tag-battle-lines.js` の `TAG_MATCH_WIN_LINES` の98本を、本書の「書き直し案」で置き換える。表名・`[archetype][personality][2本]` の形・並び順はそのまま。314行目のコメント「パートナー言及必須、{partner} プレースホルダ」は「各セル2本のうち1本だけ {partner}(呼び名)を含む。フルネームは入れない(K-14/呼び名の裁定 2026-09-25)」に直す
   - 表名と形を変えないので、セリフ編集ワークブック(`tools/extract-dialogue.js` の TABLE_MANIFEST に登録済み)と台帳の抽出(`test/i18n-extract-dialogue.js`)は無改修でそのまま追いかける
2. `pickTagWinLine` を、呼び名を受け取って差し込む形にする。

   ```js
   function pickTagWinLine(fighter, partnerCallName, dict) {
     const archetype = (fighter && fighter.archetype) || 'standard';
     const byCell = _tagLineArrFor(TAG_MATCH_WIN_LINES, fighter) || [];
     const byArch = TAG_MATCH_WIN_NAMELESS_LINES[archetype] || TAG_MATCH_WIN_NAMELESS_LINES.standard;
     let pool = byCell.concat(byArch);
     // 呼び名が取れないときは名前入りの行を出さない({partner} が生で出るのを防ぐ)
     if (!partnerCallName) pool = pool.filter((line) => line.indexOf('{partner}') < 0);
     const line = pool[Math.floor(Math.random() * pool.length)];
     return _tplTagLine(line, { partner: partnerCallName }, dict);
   }
   ```

   - 抽選は5本(性格別2本+口調別の名前なし3本)から等確率。**名前を呼ぶ行が出るのは5回に1回(20%)**、性格別の行は40%。名前をもっと聞かせたいなら名前入りの行に重みを付ける手もある(判断は Keisuke)
   - `_tplTagLine` は差し込みの**前に**辞書を引く(i18n-runtime-spec §6 の dict-opts)。名前なしの行もこの経路で英訳される
   - `_tagLineArrFor` の4段フォールバックは、49セルすべて埋まっているので通常は1段目で決まる。乱数は表示専用の文選びなので `Math.random()` のままでよい(CLAUDE.md 原則4・C-2裁定)
3. 呼び出し側(`src/tag-battle-main.js` 1706行。行番号は 2026-09-25 の main 時点)を次の形にする。**外側を `WM_I18N.t` で包み直さない**(差し込み後の文は辞書のキーと一致しないため)。

   ```js
   const winLine = pickTagWinLine(winFinisher, _tagCallName(winFinisher, winPartner), WM_I18N.t);
   ```

   - 観戦画面に渡る選手オブジェクトには archetype と personality が載っている(`_watchTagMatch` の `mkProfile` が roster の選手を丸ごと渡す。春タッグの観戦も同じ)ので、性格別の抽選はそのまま効く
4. 呼び名の受け渡し: 観戦画面(iframe)には G(絆の値)が無いので、呼び名は親(`app.js`)で決めて `START_TAG_MATCH` のメッセージに載せる。例: `matchInfo.callNames = { '<話し手のid>:<相手のid>': '阿武隈' }`(向きのあるキー。関係値の `小さいid>大きいid` とは別物)。どちらが決め手になるかは再生まで分からないので、両チームの4方向ぶんを載せる。**送り元は2か所**(`app.js` 4867行 春タッグの観戦/7388行 興行のタッグ観戦 `_watchTagMatch`)。`_tagCallName` は見つからなければ空文字を返す(→名前なしの行だけから引く)
   - 呼び名そのもの(名字⇔下の名前、絆85/50での切り替え)は、別作業の「呼び名」の仕組みの関数を使う
   - 英語: `t()` の英語の分岐は差し込む値を名前辞書で英語化する。名前辞書には姓だけのキー(例: 「富岡」→ Tomioka)はあるが、下の名前だけのキーは無いので、下の名前(例: 塔子 → Toko)の英語化は呼び名の仕組みの側で用意が要る
5. 既存テスト: `test/tag-battle-presentation-ui-test.js`(65行・67行)と `test/victory-overlay-speaker-test.js`(28〜30行)は、呼び出し行 `const winLine = WM_I18N.t(pickTagWinLine(winFinisher));` と関数の頭 `function pickTagWinLine(fighter) {` を文字列のまま確かめているので、どちらも書き換える。意図(フルネームを入れない)は残す: `winPartner.name` を直接渡していないこと、呼び名の関数を通していることを確かめる
6. 回帰テストを1本足す(例 `test/tag-win-lines-callname-test.js`)。確かめること: 49セル×2本がそろっている/各セルちょうど1本が `{partner}` を1回だけ含む/もう1本は `{` を含まない/98本が互いに重複しない/名前なし21本と同文が無い/`pickTagWinLine(f, '', dict)` が `{partner}` 入りを返さない/名前を渡したとき結果に `{` が残らない
7. 英語の台帳: `node test/i18n-extract-dialogue.js` を回すと、現行の95キー(98本のうち3組が同文のため95)が消え、新しい98キーが英訳空で入る(名前入りの49行は hasPlaceholder)。本書の「英語の書き直し案」を en 列に入れる → `node test/i18n-build-dialogue-dict.js`(プレースホルダの一致と機械検査込みで `src/lang-en-dialogue.js` を再生成)→ `node test/i18n-ledger-consistency-test.js`
   - 新しい98本は、台帳にある他のテーブルの文と1本も同文にならないことを確認済み(同文だと英訳を共有してしまい、セル判定も消える)
   - `test/i18n-ratchet.js` はファイルごとの日本語文字列の本数を比べるだけなので、98本→98本の置き換えでは引っかからない
8. セリフ編集ワークブック: src に入れた後で `node tools/dialogue-workbook.js export`。**書き出しは破壊的**なので、先に xlsx に未反映の改訂が無いことを確かめる(反映→書き出しの順)。`docs/dialogue/02-tag-match.md` も `tools/extract-dialogue.js` で作り直す
9. specs: `specs/battle-presentation-spec-v1.0.md` §5 の「勝者セリフ本文へパートナーや対戦相手のフルネームを動的挿入しない」を、「フルネームは入れない。パートナーの名前は呼び名(基本は名字、話し手→相手の絆85以上で下の名前)で入れてよい。勝者セリフは口調×性格別の2本(うち1本は名前を呼ぶ)と口調別の名前なし3本から抽選する」に直す(呼び名の spec が別にできるならそちらを参照)。`docs/fun-audit-v0.1.md` の K-14 の状態も更新
10. 確かめ方: `node --check src/tag-battle-lines.js` と上のテスト。auto-sim は不要(表示だけの変更)。実機では、興行のタッグ戦と春タッグの観戦を1試合ずつ見て、決着画面の吹き出しに名字(仲の良いペアなら下の名前)が出るか、フルネームや `{partner}` がそのまま出ていないかを日本語と英語の両方で見る

### 別案: 性格別だけから引き、名前なし21本は予備にする

49セルが全部埋まっているので、この形だと21本は実際にはほぼ出なくなります。裁定の「今の勝利セリフ欄に加える」とずれるので、推奨しません。

### 組み込みのときに一緒に直したい1行(本件の範囲外・要承認)

- 名前なし21本のヤンキー[1]「お疲れさん！　あたしらの勝ちだ！」に「あたしら」が残っています(裁定53の「あたし」廃止に合わない)。ヤンキー帯の実績どおり「私ら」に直すことを提案します(英訳 `Good work! That one's ours!` はそのままで合う)

## 6. 付記

- 吹き出しの長さ(名前に「阿武隈」「Abukuma」を入れた場合): 日本語16〜46字(平均30.1字)、英語34〜85字(平均66.7字)。長い名前(シュタインフェルト/Banyubashi)でも日本語最大49字・英語最大88字。日本語40字超は6本(#3 #12 #41 #64 #68 #85)、英語80字超は12本(#3 #5 #7 #18 #30 #31 #47 #57 #61 #69 #70 #96)。今出ている名前なし21本は日本語最長28字・英語最長63字なので、それより長い行が入る。英語トーンバイブルの目安(40〜90字・上限110字)には収まっているが、実機確認のときは、この行で吹き出しが崩れないかも見てほしい
- 範囲外のまま残しているもの: 敗者セリフ `TAG_MATCH_LOSS_LINES`(98本。決着画面は敗者セリフを出さない仕様)と連携セリフ `DOUBLE_TEAM_LINES`(148本。K-14裁定で入れない)。LOSS にも `{partner}` と「あたし」「お前」が残っているが、出す場所が無いので今回は触っていない
- 検査の中身(下書き作成時に実施): 98本の並び/各セルの名前入りがちょうど1本/名前入りの行は日本語・英語とも `{partner}` を1回だけ含み、名前なしの行は `{` を含まない/敬称の規則(丁寧・お嬢様・標準×内気は「さん」、他は呼び捨て。「ちゃん」「先輩」なし。英語に -san 等なし)/名前と二人称の二重参照なし/クールが文頭で呼びかけていない/全角の！？/禁止語(あたし・お前・俺・バトン・言葉はいらない・息ぴったり・お疲れ・相棒・二人でつかんだ・先輩等)/98本内の重複/名前なし21本との同文/台帳の他テーブルとの同文/英語の機械検査(お嬢様の短縮形・クールの感嘆符と3文超・hell/damn・g落とし・ain't・蠱惑の少女的感嘆と呼称・鷹揚の若者スラング・文末maybe・比喩のweapon・翻訳調定型・プレースホルダ直前の不定冠詞・直後の複数形名詞・110字上限)は、すべて0件。名前なしの49本が前稿と1字も変わっていないことも突き合わせで確認した。文字の似かよい(bigram)は、残ったのが「さん」「ありがとうございました」など共通の語による口調違いの組だけであることを目で確認した

