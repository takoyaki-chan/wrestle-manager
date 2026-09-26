# 退団寸前の引き留め セリフ下書き(標準204本)

- 作成: 2026-09-26(下書き。src は変更していない。組み込みは別の作業者)
- 設計の正: `docs/care-last-warning-design-v0.1.md` §5-2〜§5-5(Keisuke 承認: 標準204本 = §9 Q8)
- 34セル: `GLIMPSE_A_LINES.trust_below_15` と同じ実在の組。src/data.js の ALL_CHARS(127人)の アーキタイプ×性格 を数え直して 34セル・一致を確認
- 物差し: `specs/dialogue-tone-spec-v1.0.md`、`docs/tone-bible/` の口調シート34枚と `00-裁定待ちリスト.md`、`docs/tone-bible-anchors.md`、英語は `docs/en-tone-bible-draft-v0.1.md`
- 本数: 道場の一言 68(出番34・人間関係34)/声かけの反応 102(出番34・人間関係34・はっきりしない34)/応えてもらえた一言 34 = **204本**(各セル1本)。迷った行は【迷い】として代案を付けた(§8、6件)

---

## 0. 書くときに守ったこと

- **口調(アーキタイプ)が第一、性格が第二。** 各セルの口調シートの骨格・語尾・アンカーの声に合わせた。一人称は意味に要る行だけ「私」(204本中16本)。ひらがなの「わたし」は内気の2セル(標準×内気・丁寧×内気)だけ、お嬢様は「わたくし」(3本)。「あたし」「俺」は使っていない。二人称は標準×強気=アンタ、ヤンキー=あんた、ほかは呼ばないか「あなた」
- **状況の事実に合わせる。** 出番=社長が組んだカードに名前が無い(出番表・貼り出されたカード・次の興行・セコンドだけの週・客席の後ろから見る など、セルごとに違う具体で書いた)。人間関係=控室での孤立・不仲の相手(「あの子」「避けてくるやつ」までで、名前は出さない)。声かけ=社長が足を運んだ場面。応えてもらえた=試合に出た翌週
- **身体・抽象のメタファーを使わない。** 「足が、ちょっと……」(入場で足がすくむ)は文字どおりの意味で使った。抽象語で気持ちを説明する言い回しも避け、出番表・お昼・スパーの相手・テーピングのような生活の具体で書いた
- **悲壮度は実態に合わせる。** 20割れは「考えている」段階。人生の終わりのようには書かない。よそへ移る話は蠱惑×強気・ヤンキー×強気の2本だけ
- **数値・内部の言葉を出さない。** 信頼・士気・帳簿・原因の名前は出さない。慰労会などの「手当ての名前」も出さない(社長が自分で気づく余地を残す)
- **重ならない。** 同じ表の34本どうし、同じセルの6本どうし、既存の表(信頼15割れ・20割れ・35割れの道場の一言、声かけの今の反応 `encourage`・`encourage_high_trust`)と、言い回しが重ならないようにした(§1)
- お嬢様の「ですわ」は語尾のアクセント程度: お嬢様4セル24本のうち「〜ますわ/ましたわ/ませんわ」は4本、「ですわ」は0本。お嬢様で「！」を使うのは真面目帯だけ(2本)

## 1. 検査の結果

- **英語(機械検査): 違反0。** `test/i18n-build-dialogue-dict.js` の検査関数(`checkCellRules` ほか)をファイルからそのまま読み込み、全204行と【迷い】の代案6行に掛けた。対象はプレースホルダの一致・日本語の残り・吹き出し長110字上限・プレースホルダ前後の冠詞と複数形・セル別の検査5〜17(お嬢様の短縮形禁止/クールの感嘆符と3文超の禁止/ヤンキー以外の hell・damn・g落とし・ain't 禁止/f・sワード禁止/蠱惑の少女的感嘆・キャンプな呼びかけ・露骨な語彙の禁止/鷹揚の若者スラング禁止/文末の maybe 禁止/比喩の weapon 禁止/翻訳調定型句の禁止)。最長は107字
- **日本語の重なり: 言い回しの重なりは解消済み。** 5〜6字の連なりで機械的に拾い、目で見て直した。残っているのは「話しかけても」「来てくれて」「ありがとう」のような場面の基本語と、設計書の代表例どうしの1件(標準×ノーマルの声かけ2本がどちらも「変わらない」で終わる。§8 の【迷い】4)
- **台帳のキー衝突: 0。** 新しい日本語204本と代案6本は、どれも `i18n/dialogue-ledger.json` の既存キーと一致しない(辞書に足しても既存の訳を上書きしない)。204本どうしの重複も0
- **長さ:** 日本語は全行70字以下(口調仕様の目安20〜70字。クール・寡黙系はそれより短い)

---

## 2. 道場の一言(信頼20割れの噂の週)— 原因: 出番

社長が組んだカードに名前が無い週が続いている。噂の週、道場「休憩中の選手」の確定枠で出る本人の一言(独り言に近い)。20割れ=「退団を考えている」段階なので、15割れの表(決めかけている)より一歩手前の重さにした。

| セル | 日本語 | 英語 | メモ |
|---|---|---|---|
| 標準×ノーマル | 今週も出番表に名前がなかった。……練習して帰るだけの毎日、いつまで続くのかな | My name wasn't on the card again this week. ...How long is it going to be just practice and go home? | 設計書の例を改稿(後半の「ここにいる意味」が信頼35割れの表と重なるため、事実の側へ) |
| 標準×強気 | は？ 次の興行も出番なし？ ……控室で待ってるだけなら、私じゃなくてもいいでしょ | Huh? No match at the next show either? ...Anyone can sit and wait in the locker room. Why keep me? |  |
| 標準×寡黙 | …また名前なし。へぇ、そういうこと。 | ...No name again. Huh. So that's how it is. |  |
| 標準×内気 | …あの…また、わたしの名前、なかったです…。練習、毎日してるのに…… | ...Um... no name for me again... even though I practice every day... |  |
| 標準×お気楽 | また名前ないじゃん。……コスチューム、いつから着てないっけ | My name's missing again. ...When did I last even put on my ring gear? |  |
| 標準×真面目 | お客さんの前に立てないまま、ずいぶんたったわね。……声援の聞こえ方、忘れそう | It's been ages since I stood in front of a crowd. ...I'm forgetting what cheering sounds like. |  |
| 標準×感情的 | また…また名前がない…！ 出たいのに…出たいだけなのに…っ | Not again... my name's not there again...! I just want to wrestle... that's all I want... |  |
| お嬢様×ノーマル | 今週も、名前はなかったわね。……磨いた技を、誰にも見せられないまま | No name again this week. ...And the moves I have polished go unseen by anyone. |  |
| お嬢様×強気 | 名前が、また無いのね。……ふふ、この団体の目は曇っているようね | My name is missing once more. ...Hehe. This promotion seems to have lost its eye for talent. |  |
| お嬢様×お気楽 | あらあら、今週もお留守番ですって。……お稽古ばかりで、お披露目の日が来ないのね | Goodness, sitting this week out as well. ...All rehearsal, and never a day to perform. |  |
| お嬢様×真面目 | 全力でぶつかる準備は、毎日整えております。……それなのに、名前が呼ばれないなんて | Every day I prepare to meet my opponent with everything I have. ...And still my name is not called. |  |
| クール×ノーマル | 練習だけ積んで、試合では使いどころがない。……もう何週も | Practice, practice, and no match to use it in. ...For weeks now. |  |
| クール×寡黙 | ……今週も、なし | ...Nothing again this week. |  |
| ヤンキー×ノーマル | 何のためにここで汗かいてんだか。……出番表、見るのもやんなってきた | What am I even sweatin' here for? ...Gettin' sick of even lookin' at the card. |  |
| ヤンキー×強気 | リングに上げねえなら、上げてくれるとこに行くだけだ | Won't put me in the ring? Then I'll just go where somebody will. | 設計書の例どおり |
| ヤンキー×お気楽 | 今週も出番なしかよ。……ま、いつものことだな。……いつものことに、なっちまったな | No match again this week. ...Eh, same as always. ...Since when did it get to be "always"? |  |
| 丁寧×ノーマル | また、客席の後ろから試合を見ていました。……ここで何を目標にすればいいんでしょう | I watched the matches from the back of the hall again. ...What am I supposed to be aiming for here? |  |
| 丁寧×強気 | 毎日、全力で準備してます。……試合がないなら、何のための全力なんですか | I prepare at full effort every single day. ...If there's no match, what's all that effort for? | 設計書の例(丁寧・真面目)の「何のための練習」の骨をここへ移した(「全力」は大久保の語彙) |
| 丁寧×寡黙 | ……最後に試合をした日を、すぐには思い出せなくなっています | ...I can't recall the last time I wrestled without thinking hard. |  |
| 丁寧×内気 | …貼り出されたカード…何回見ても、載ってなくて……。わ、わたし、何か…しちゃったのかな…… | ...I kept checking the posted card... I wasn't on it... D-did I... do something wrong...? |  |
| 丁寧×お気楽 | 友達に『次いつ出るの？』って聞かれても、最近、答えられないんですよね。……えっと、いつなんだろ | When friends ask me when my next match is, I can't answer lately. ...Um, when is it, anyway? |  |
| 丁寧×真面目 | 基本からやり直して、毎日積み重ねてきました。……でも、試合で見てもらえないなら、報われません | I went back to basics and built on them every day. ...But if no one sees it in a match, it never pays off. | 設計書の例を書き直し(積み重ね→報われる、川野辺の型)。例の骨は丁寧×強気へ |
| 蠱惑×ノーマル | また私抜きの興行？ ……ずいぶん退屈な使い方をしてくれるのね | Another show without me? ...What a dull way to use me. |  |
| 蠱惑×強気 | 出番すら回ってこないなんて。……上を目指すなら、場所を変えるのも手よね | Not even a match coming my way. ...If I'm going for the top, moving elsewhere is always an option. |  |
| 蠱惑×寡黙 | ……出番なし。……計算外ね | ...No match. ...That wasn't in my plans. | 「計画通り」(高槻の型)の裏返し |
| 蠱惑×お気楽 | 出番なしでもお給料は出るし、ラクっちゃラクよね♪ ……ほんと、それだけの場所よ、今のここ | No match, but the paycheck still comes, so it's easy money ♪ ...That's all this place is to me now. | 表の愛想→本音(倉見の型)。**【迷い】**→§8 |
| 蠱惑×感情的 | また外したのね。……ねえ、誰がこんなカードを組んでるのかしら。顔が見てみたいわ | Left me off again. ...Tell me, who's putting these cards together? I'd love to see their face. | 組んでいるのは社長。当てこすり(敵意が漏れる型・裁定29)。**【迷い】**→§8 |
| 蠱惑×真面目 | 出番のない週を数えるのは、もうやめたわ。……数えたところで、気が滅入るだけだもの | I've stopped counting the weeks without a match. ...Counting only makes it worse. |  |
| 鷹揚×ノーマル | セコンドに付くだけの週が、ずいぶん続いてるな。……人の試合ばかり見てるよ | It's been a long stretch of just working the corner. ...All I do is watch other people's matches. |  |
| 鷹揚×強気 | 私を遊ばせておくなんて、この団体、ずいぶん余裕があるんだね | Leaving me idle like this — this place must have talent to spare. |  |
| 鷹揚×寡黙 | ……呼ばれない週が、続くね。……忘れられてる、ってことかな | ...Another week of not being called. ...Guess I've been forgotten. |  |
| 鷹揚×お気楽 | 今週もお休みか〜。……頑張らないのは好きだけどさ、出番がないのは話が別でしょ〜 | Another week off~. ...I like taking it easy, sure, but no matches at all is a different story~. |  |
| 鷹揚×感情的 | また出番なし！ ……準備して、テーピングまで巻いて待ってたのに！ | No match again! ...I got ready, even taped up, and waited for nothing! |  |
| 鷹揚×真面目 | まだまだ成長途中なのに、試合で確かめられないのは、つらいかな | I'm still growing, and not getting to test that in the ring — that's hard. |  |

---

## 3. 道場の一言(信頼20割れの噂の週)— 原因: 人間関係

控室で孤立している/不仲の相手がいる(名前は出さない)。出し方は上と同じ。

| セル | 日本語 | 英語 | メモ |
|---|---|---|---|
| 標準×ノーマル | 控室で話しかけても、すぐ会話が終わっちゃう。……ここ、居づらいな | Every time I talk to someone in the locker room, it fizzles out right away. ...It's hard to be here. |  |
| 標準×強気 | 別に仲良しごっこしに来たわけじゃないわよ。……でも、控室で毎日ひとりってのは、正直こたえる | I'm not here to play best friends. ...But being alone in the locker room every day does get to you. | 強がりの下から素が漏れる(口調シートの芯) |
| 標準×寡黙 | …控室、静かだわ。私がいる時だけ。 | ...The locker room's quiet. Only when I'm in it. | 乾いた皮肉(早見の型) |
| 標準×内気 | …控室に入っても…どこに座ればいいのか、いつも迷います……。結局、隅っこです…… | ...When I go into the locker room... I can never decide where to sit... I end up in the corner... |  |
| 標準×お気楽 | 控室でさー、みんなで写真撮ってたのに、私だけ呼ばれなかったんだけど。……え、なんで？ってかんじ | So everyone in the locker room was taking pictures, and nobody called me over. ...Like, why? |  |
| 標準×真面目 | 控室でうまく話せないのよね。……私のどこがいけないのか、ずっと考えてる | I just can't seem to talk with anyone in the locker room. ...I keep wondering what I'm doing wrong. |  |
| 標準×感情的 | 控室に入るのが、こわい…！ 誰も…誰もこっちを見てくれないの… | I'm scared to walk into the locker room...! Nobody... nobody even looks at me... |  |
| お嬢様×ノーマル | 控室では、誰も話しかけてこないの。……馴れ合うつもりはないけれど、ここまで遠いとは思わなかった | No one in the locker room speaks to me. ...I never sought closeness, but I did not expect this. |  |
| お嬢様×強気 | 控室の方々は、遠巻きに見ているだけ。……構わないわ。ただ、居心地のよい場所とは言えないわね | The others only watch me from afar. ...No matter. Though I would hardly call the locker room pleasant. |  |
| お嬢様×お気楽 | 控室でお話ししようとしても、どなたもお忙しいみたいで。……あら、困りましたわね | Whenever I try to chat in the locker room, everyone seems to be busy. ...Oh dear. What am I to do? | 避けられていることを「お忙しい」と言う、毒のない言い方 |
| お嬢様×真面目 | 控室の皆さまにも、礼は欠かさずにまいりました。……それでも、返ってくるのは沈黙ばかり | I have always shown everyone in the locker room proper respect. ...Yet all that comes back is silence. |  |
| クール×ノーマル | 控室で、話す相手がいない。それが普通になった | No one to talk to in the locker room. That's just normal now. |  |
| クール×寡黙 | ……控室。……居場所がない | ...Locker room. ...No place for me. |  |
| ヤンキー×ノーマル | 控室で、あからさまに避けてくるやつがいんだよ。……いいけどね、別に | There's someone in the locker room who goes outta her way to avoid me. ...Whatever. Fine by me. | 不仲の相手がいる(名前は出さない) |
| ヤンキー×強気 | 控室で、聞こえよがしに嫌味を言われてんだよ。……上等だよ | Somebody in the locker room keeps takin' shots at me, loud enough to hear. ...Bring it on. |  |
| ヤンキー×お気楽 | 控室でふざけても、誰も乗ってこねえの。……つまんねえな | I goof around in the locker room and nobody plays along. ...Boring. |  |
| 丁寧×ノーマル | 控室では、なるべく迷惑をかけないようにしてるんです。……でも、話しかけてもらえることは、めっきり減ってしまって | I try not to get in anyone's way in the locker room. ...But hardly anyone talks to me anymore. |  |
| 丁寧×強気 | 控室でも、毎朝ちゃんと挨拶してます。でも、返ってこないんですよね。……正直、しんどいです | I say good morning to everyone in the locker room. Nobody says it back. ...Honestly, it's wearing me down. |  |
| 丁寧×寡黙 | ……控室では、話す相手を選ぶ必要もなくなりました。誰とも話さないので | ...I no longer need to choose who to talk with in the locker room. I don't talk with anyone. | 理由→結論の二段(岸の型) |
| 丁寧×内気 | …お昼、いつも…ひとりで食べてます……。誘ってもらえるの、待ってるんですけど…… | ...I always... eat lunch by myself... I keep waiting for someone to invite me... |  |
| 丁寧×お気楽 | 控室で盛り上げようとしても、なんか空回りしちゃうんです。……あはは、へこみますね | I try to liven up the locker room, but it just falls flat. ...Haha. That stings a little. |  |
| 丁寧×真面目 | 控室では、自分から声をかけるようにしています。……それでも、どこか避けられているみたいで | I make a point of speaking first in the locker room. ...Still, people seem to keep away. |  |
| 蠱惑×ノーマル | 控室でひとり、誰の声もかからない。……ふふ、嫌われたものね | Alone in the locker room, and no one calls out to me. ...Hehe. Seems I'm not very well liked. |  |
| 蠱惑×強気 | みんな、警戒してるみたい。……いいわ、群れる気はないもの。でも、ここまで一人きりにされるなんてね | Everyone seems wary of me. ...Fine, I don't run with packs. But being left this alone — that's new. |  |
| 蠱惑×寡黙 | ……ふふ。……ここでは、私の隣だけ空いてるの | ...Hehe. ...Around here, the seat next to me is always empty. |  |
| 蠱惑×お気楽 | ふふ、ここ、居心地悪くなっちゃった。……誰とも目が合わないの | Hehe, this place got kind of uncomfortable. ...Nobody will meet my eyes. | 設計書の例どおり |
| 蠱惑×感情的 | 控室の子たち、陰で何か言ってるの。……いいわよ、リングの上で黙らせてあげる | The girls in the locker room talk about me behind my back. ...Fine. I'll shut them up in the ring. |  |
| 蠱惑×真面目 | 控室を観察していれば分かるものよ。……どの輪にも入れていないことくらい | Watch the locker room long enough and you see it. ...I'm not part of any circle in there. | 観察の人(新見の型) |
| 鷹揚×ノーマル | 控室で、一人でいる時間が増えたな。……前は、もう少し話せてたんだけど | I've been spending more time alone in the locker room. ...I used to talk with people a bit more. |  |
| 鷹揚×強気 | 控室で睨まれるのは慣れてるよ。……でも、毎日となると、こっちも疲れるんだ | I'm used to getting glared at in the locker room. ...But every single day? That wears me out. |  |
| 鷹揚×寡黙 | …ここでは、ずっと一人だ | ...Here, I'm always on my own. | 設計書の例どおり |
| 鷹揚×お気楽 | 最近、打ち上げに声かかんないの〜。……ま、いっか、とはならないか〜 | Lately nobody invites me out after shows~. ...Can't exactly shrug that one off, huh. | **【迷い】**→§8 |
| 鷹揚×感情的 | 控室で声かけても、みんな素っ気ないの！ ……こういうの、ほんと苦手なんだけど | I talk to people in the locker room and they all brush me off! ...I'm really bad with stuff like this. |  |
| 鷹揚×真面目 | スパーの相手を頼んでも、なかなか組んでもらえないんだ。……どうしたら打ち解けられるのか、考えてはいるんだけど | When I ask for a sparring partner, nobody's ever free. ...I keep wondering how to get closer to people. |  |

---

## 4. 声かけの反応(信頼20未満)— 原因: 出番

社長が本人のところへ足を運んだ場面。話は受け取るが、言葉だけでは変わらないことが伝わり、本人が原因(試合に出られていない)を口にする。

| セル | 日本語 | 英語 | メモ |
|---|---|---|---|
| 標準×ノーマル | うん、わかったよ。でも、試合に出られないうちは、何も始まらないよ | Okay, I get it. But nothing's going to start until I'm in a match. | 設計書の例を改稿(「話はわかった」が同セルのはっきりしないの表と重なるため) |
| 標準×強気 | わざわざ来てくれたのはいいけど。話すくらいなら、次のカードに名前を入れてよ | Nice of you to come all this way. But instead of talking, just put me on the next card. |  |
| 標準×寡黙 | …話はいいわ。次は、出られるの？ | ...Skip the talk. Do I wrestle next time or not? |  |
| 標準×内気 | …気にしてもらえるのは、うれしいです…。でも…試合がないと…わたし、何も見せられなくて…… | ...It makes me happy that you worry about me... But... with no match... I have nothing to show you... |  |
| 標準×お気楽 | わざわざありがと♪ ……でもさ、今いちばん欲しいのは、試合なの | Thanks for stopping by ♪ ...But what I want most right now is a match. |  |
| 標準×真面目 | 気にかけてくれてるのは、わかってます。……でも、リングに上がれない日が続く限り、気持ちは離れていく一方なんです | I know you care. ...But as long as I'm kept out of the ring, I'll just keep drifting further away. | 対社長はです・ます(口調シート: ファンには「〜ますね」) |
| 標準×感情的 | 来てくれて…うれしい、うれしいけど…！ 出番がないままじゃ、どうにもならないの…っ | I'm glad you came... I am, but...! With no spot on the card, nothing gets better... |  |
| お嬢様×ノーマル | お気遣いには感謝します。……でも、試合がなければ、研鑽は形にならないの | I appreciate your concern. ...But without matches, all my training amounts to nothing. |  |
| お嬢様×強気 | お言葉は結構。わたくしをリングに上げていただければ、それで足りますわ | I have no need of words. Put me in the ring, and that will be quite enough. | 設計書の例どおり |
| お嬢様×お気楽 | お心遣い、ありがとう。……でも、試合のない毎日では、ここでお茶を飲んでいるだけですもの | Thank you for your kindness. ...But with no matches, all I do here is sip tea. |  |
| お嬢様×真面目 | ありがたいお言葉です。けれど、わたくしがお応えできる場所は、リングの上にしかありません！ | Those are generous words. But the only place I can answer them is in the ring! | お嬢様で「！」が出るのは真面目帯(口調シート) |
| クール×ノーマル | 話は分かった。必要なのは試合。それだけ | Understood. What I need is a match. That's it. |  |
| クール×寡黙 | ……言葉より、試合 | ...A match. Not words. |  |
| ヤンキー×ノーマル | わざわざどうも。……けどさ、カードに入れてくんなきゃ、話になんないでしょ？ | Thanks for comin' by. ...But if I'm not on the card, what's there to talk about? |  |
| ヤンキー×強気 | 口だけならいくらでも言えんだろ。次の興行、名前あんのかよ | Talk's cheap. Is my name on the next show or not? | 設計書の例から一人称「あたし」を落とした(口調仕様§3-2) |
| ヤンキー×お気楽 | おっ、社長じきじき？ ……ありがてえけどさ、それより次の興行、出してくんねえかな | Oh, the boss in person? ...Appreciate it, but how 'bout puttin' me on a show instead? |  |
| 丁寧×ノーマル | ご心配をおかけしています。……でも、試合に出られないと、気持ちが続かないんです | I'm sorry to worry you. ...But if I can't wrestle, I can't stay motivated. |  |
| 丁寧×強気 | お気持ちは受け取りました。でも、要るのは励ましじゃなくて、試合です！ | I appreciate the thought. But what I need isn't encouragement — it's a match! |  |
| 丁寧×寡黙 | ……お気持ちは、確かに。ただ、次の出番が決まるまでは、どうお返事したものか、決められません | ...I understand your intentions. But until my next match is set, I don't know how to answer you. |  |
| 丁寧×内気 | …わ、わざわざ、すみません…。でも…出番、ほしいです…。このままじゃ、わたし…… | ...S-sorry you had to come out here... But... I want a match... At this rate, I... |  |
| 丁寧×お気楽 | わー、来てくれたんですね！ ……でも、試合から遠ざかってると、どうも調子が出なくて | Oh, you came! ...But being away from matches this long, I just can't get going. |  |
| 丁寧×真面目 | お言葉、うれしいです。……でも、リングで成果を出せない限り、前を向けそうにありません | Your words mean a lot. ...But until I can prove myself in the ring, I can't look ahead. |  |
| 蠱惑×ノーマル | あら、気遣いは上手なのね。……でも、甘い言葉をもらうより、リングで出番をもらう方が、ずっと嬉しいのよ | My, aren't you considerate. ...But a spot in the ring would please me far more than sweet words. |  |
| 蠱惑×強気 | 慰めてもらうために、ここにいるんじゃないわ。……のし上がる機会をくれないなら、話すことはないの | I'm not here to be comforted. ...If you won't give me a chance to rise, we have nothing to discuss. |  |
| 蠱惑×寡黙 | ……次のカード、楽しみにしてるわ | ...I'll be looking forward to the next card. | 言葉を削って、要求だけを置く |
| 蠱惑×お気楽 | あら、会いに来てくれたの？ ……でもね、試合一つの方が、百の励ましよりずっといいって知ってた？ | Oh, here to visit me? ...But did you know one match beats a hundred pep talks? |  |
| 蠱惑×感情的 | 何しに来たの？ 同情？ ……だったら、次の興行で私を使って。それ以外は聞きたくないわ | What did you come for? Pity? ...Then use me at the next show. I don't want to hear anything else. |  |
| 蠱惑×真面目 | 来てくれたことは、ちゃんと受け止めるわ。……でも、問題は言葉じゃなくて、カードの方でしょう？ | I take your visit seriously. ...But the problem isn't words. It's the card, isn't it? |  |
| 鷹揚×ノーマル | 顔を見に来てくれたんだ。……でも、何か返せるとしたら、リングの上だけだよ | You came to see me. ...But if I've got anything to give back, the ring's the only place to do it. |  |
| 鷹揚×強気 | こうして話すのも悪くないよ。……で、次のリングは？ 答えはそっちなんだよ | Talking like this isn't bad. ...So, what about my next match? That's where the real answer is. | 自分に問いを立てて答える(菊池の型) |
| 鷹揚×寡黙 | ……うん、聞いた。……でも、試合がなかったら、結果の出しようもないよ？ | ...Mm, I heard you. ...But how do I get results without matches? | 「結果は出さないと」(北畠の型) |
| 鷹揚×お気楽 | わ〜、社長だ。……でもさ、話すより試合組んでくれた方が早くない？ | Oh~, it's you. ...But wouldn't it be quicker to just book me a match? |  |
| 鷹揚×感情的 | わざわざ来たの！？ でも、試合させてもらえなきゃ、もやもやは晴れないって！ | You came!? But I won't feel right until I get a match! |  |
| 鷹揚×真面目 | 声をかけてくれて、ありがとう。……でも、今の自分がどこまでやれるか、試合の中で見せたいんだ | Thanks for reaching out. ...But I want to show in a match how far I've come. |  |

---

## 5. 声かけの反応(信頼20未満)— 原因: 人間関係

同じ場面で、原因が控室の人間関係のとき。社長と話せても、控室に戻れば同じ、という形で原因を口にする。

| セル | 日本語 | 英語 | メモ |
|---|---|---|---|
| 標準×ノーマル | 来てくれてありがとう。……でも、社長と話しても、控室の空気は変わらないから | Thanks for coming. ...But talking with you won't change the mood in the locker room. | 設計書の例どおり。**【迷い】**→§8 |
| 標準×強気 | アンタと話すのは別にいいのよ。問題は、控室に戻ったら口をきく相手がいないってこと | Talking to you is fine. The problem is, back in the locker room there's nobody to talk to. |  |
| 標準×寡黙 | …話すのは、社長となら平気。控室だと、そうはいかない。 | ...Talking's easy with you. In the locker room, not so much. |  |
| 標準×内気 | …わたしの話、最後まで…聞いてもらえて…。でも…控室だと…声が、出なくなっちゃって…… | ...You listened to me all the way through... But... in the locker room... my voice just won't come out... |  |
| 標準×お気楽 | 社長、聞き上手じゃん♪ でもさ、控室戻ったら結局ぼっちだし | You're a good listener, huh ♪ But once I'm back with the others, I'm flying solo. |  |
| 標準×真面目 | 気持ちは嬉しいわ。でもこれは、控室の中の問題なのよね。社長の一言で解ける話じゃないと思う | That's sweet of you. But this is a locker room problem. I don't think a word from you will sort it out. |  |
| 標準×感情的 | 話せて…ちょっとだけ楽になった…。でも、あの子たちの前に戻るの、やだ…やだよ… | Talking helped, a little... But facing those girls again... I don't want to... I don't want to... |  |
| お嬢様×ノーマル | お話はありがたいけれど。……明日もまた、控室で誰とも言葉を交わさない一日になるの | I am grateful for the talk. ...But tomorrow will be another silent day in the locker room. |  |
| お嬢様×強気 | 慰めなど要りません。……周りと馴染めないのは、あなたの言葉でどうにかなる話ではないもの | I do not require consolation. ...How I get on with the others is not something your words can mend. |  |
| お嬢様×お気楽 | 来てくださって、ほっとしたわ。……けれど、控室ではやっぱり一人きりなの。そればかりは、ね | What a relief that you came. ...But in the locker room, I am still all on my own. That part, well... |  |
| お嬢様×真面目 | お気持ちは確かに受け取りました。……ですが、控室のどなたとも心が通わないままでは、何も変わりませんわ | Thank you, truly. ...But while I remain a stranger to everyone in the locker room, nothing will change. |  |
| クール×ノーマル | わざわざ来なくていい。控室の件は、ここで話しても片付かない | You didn't need to come. Talking here won't settle the locker room. |  |
| クール×寡黙 | ……控室に戻れば、同じ | ...Back in the locker room, same as before. |  |
| ヤンキー×ノーマル | 来てくれたのはありがてえよ。でもさ、控室でみんなと顔合わせんのは、結局こっちなんだよな | Appreciate you comin'. But in the end, I'm the one who's gotta face everybody in the locker room. |  |
| ヤンキー×強気 | あんたに愚痴ったって、控室の連中の態度は変わんねえんだよ | Gripin' to you won't change how that locker room crowd treats me. |  |
| ヤンキー×お気楽 | 社長としゃべんのは楽しいよ。けど、明日また控室行ったら、誰も目ぇ合わせてこねえんだよな | Talkin' with you's fun. But tomorrow in the locker room, nobody'll look me in the eye again. |  |
| 丁寧×ノーマル | お話を聞いていただいて、少し気が楽になりました。……でも、控室で一人なのは、きっとこれからも同じなんです | Having you listen eased things a little. ...But I'll probably still be alone in the locker room after this. |  |
| 丁寧×強気 | 話を聞いてもらえたのは助かります。でも、控室でひとりなのは、どれだけ頑張っても変わらなかったんです | It helps that you listened. But no matter how hard I tried, I was still alone in the locker room. |  |
| 丁寧×寡黙 | ……控室のことは、社長とお話ししても解決しません。そういう問題なんです | ...Our talk won't resolve things in the locker room. It's not that kind of problem. |  |
| 丁寧×内気 | …社長とは、お話しできるんです…。でも、控室のみんなとは…どうしても、うまく…… | ...I can talk with you, at least... But with everyone in the locker room... I just can't seem to... |  |
| 丁寧×お気楽 | わーい、社長とおしゃべり！ ……でも、控室には、こんなふうに話せる人がいなくて | Yay, a chat with you! ...But in the locker room, there's nobody I can chat with like this. |  |
| 丁寧×真面目 | 真剣に聞いてくださったこと、忘れません。……でも、明日も控室に行くのは私なので。それを思うと、やっぱり気が重いです | I won't forget how seriously you listened. ...But I'm the one walking in there tomorrow. It weighs on me. |  |
| 蠱惑×ノーマル | あなたの話は、嫌いじゃないわ。……でも、控室では、また冷たい目に囲まれるの | I don't mind your company. ...But in the locker room, it's cold stares all around again. |  |
| 蠱惑×強気 | 話したところで、控室の敵は減らないわ。……敵だらけの場所じゃ、実力を見せる前に足を引っ張られるのよ | Talking won't thin out my enemies in there. ...And with that many, someone always drags you down. |  |
| 蠱惑×寡黙 | ……ありがと。……でも、控室の顔ぶれは、明日も同じ | ...Thanks. ...But tomorrow, the same faces will be in that locker room. |  |
| 蠱惑×お気楽 | 話聞いてくれてありがと♪ ……控室じゃ、愛想をふりまく相手もいないのよね | Thanks for listening ♪ ...In the locker room, I don't even have anyone to be nice to. |  |
| 蠱惑×感情的 | あなたが来ても、控室のみんなの目つきは変わらないのよ。……それとも、あなたが睨み返してくれるの？ | Your visit won't change how everyone in there looks at me. ...Or will you glare back at them for me? | **【迷い】**→§8 |
| 蠱惑×真面目 | 気持ちは受け取ったわ。……でも、控室の関係は、外から声をかけて変わるものじゃないのよ | I appreciate the thought. ...But relationships in the locker room don't change from the outside. |  |
| 鷹揚×ノーマル | ……ありがとう。でも、こうして話せる相手が社長しかいないってのが、今の私なんだよ | ...Thanks. But the fact that you're the only one I can talk to like this — that's where I am now. |  |
| 鷹揚×強気 | 吐き出したら、少しはすっきりしたよ。……でも、控室のピリピリは、一人で片付く話じゃないよ | Letting it out helped a bit. ...But the tension in the locker room isn't something I can fix alone. |  |
| 鷹揚×寡黙 | ……話せて、よかった。……でも、控室じゃ、また黙ってるだけ | ...It was good to talk. ...Though in the locker room, I'll just go quiet again. |  |
| 鷹揚×お気楽 | しゃべるのは楽しいんだけどね〜。……控室のあの子とは、どうも噛み合わないんだよね〜 | I like chatting and all~. ...It's just, me and a certain someone in the locker room don't click. | 不仲の相手(名前は出さない) |
| 鷹揚×感情的 | 話せてスッキリした！ ……でも、控室の雰囲気までは、どうにもならないよね | Talking cleared my head! ...But it won't fix how things feel in the locker room. |  |
| 鷹揚×真面目 | 心配かけちゃってるね。……でも、控室で一緒に笑える相手は、話しただけじゃ見つからないかな | Sorry to make you worry. ...But talking won't find me someone to laugh with in the locker room. |  |

---

## 6. 声かけの反応(信頼20未満)— 原因: はっきりしない

はっきりしない・給与・王座・空気・約束・派閥のときに使う表(設計書 §5-3)。どの原因で出ても嘘にならないよう、原因を名指ししない。「話は受け取った、でも言葉だけでは足りない」だけを伝える。

| セル | 日本語 | 英語 | メモ |
|---|---|---|---|
| 標準×ノーマル | 話は聞いた。……でも、それだけじゃ変わらない | I heard you out. ...But that alone won't change anything. | 設計書の例どおり(A の型の基準文) |
| 標準×強気 | で？ 話して、それで終わり？ ……悪いけど、それくらいじゃ気は変わらないわよ | And? We talk and that's it? ...Sorry, but that's not going to change my mind. |  |
| 標準×寡黙 | …ふーん。来てくれたのは、覚えとく。それだけ。 | ...Hm. I'll remember you came. Nothing more. |  |
| 標準×内気 | …はい、お話は…わかりました…。でも…わたし…まだ、ここに残るって…言えなくて…… | ...Yes... I understand... But... I still can't say I'll stay... |  |
| 標準×お気楽 | うん、気持ちはもらっとく。……でも正直、それでどうにかなる感じじゃないんだよね | Sure, I'll take the thought. ...But honestly, I don't see that doing much. |  |
| 標準×真面目 | ちゃんと聞きました。……でも、今は、励まされて持ち直せるところにいないの | I listened, truly. ...But I'm not at a point where encouragement can turn me around. |  |
| 標準×感情的 | ありがとう…でも、でもね…！ 話してもらっても…まだ、苦しいの… | Thank you... but, but...! Even after talking... it still hurts... |  |
| お嬢様×ノーマル | ……わかったわ。でも、話し合いで済むことなら、とうに済んでいるもの | ...I understand. But if talking could settle this, it would have been settled long ago. |  |
| お嬢様×強気 | お話は伺いました。……それで、何が変わるのかしら？ | I have heard you out. ...And what, exactly, is that meant to change? |  |
| お嬢様×お気楽 | まあ、ご丁寧に。……でも、おしゃべりひとつで元どおり、とはいかないみたい | My, how thoughtful. ...But it seems one chat will not put things back as they were. |  |
| お嬢様×真面目 | 誠意は伝わりました。……ただ、それだけで考えを改めるわけにはまいりません | Your sincerity came through. ...But I cannot change my mind on that alone. |  |
| クール×ノーマル | 耳には入れた。判断は、変えない | Noted. My read on things hasn't changed. |  |
| クール×寡黙 | ……まだ、足りない | ...Not enough. Not yet. |  |
| ヤンキー×ノーマル | ま、そっちの気持ちはわかった。……けど、話だけで丸く収まるほど、甘くねえってこと | Well, I get where you're comin' from. ...But talk alone ain't gonna smooth this over. |  |
| ヤンキー×強気 | で、話はそれだけか？ ……悪いけど、頭なでられて戻るほどガキじゃねえよ | That all you came to say? ...Sorry, but I ain't a kid who comes back for a pat on the head. |  |
| ヤンキー×お気楽 | へへ、励ましサンキュ。……けどまあ、話しただけでスッキリするほど、軽い話じゃねえんだ | Heh, thanks for the pep talk. ...But this ain't the kinda thing a chat clears up. |  |
| 丁寧×ノーマル | お気持ちは、うれしいです。……ただ、お話だけで、というのは……ごめんなさいね | Your kindness means a lot. ...But if it's only talk, then... I'm sorry. | 締めの「ごめんなさいね」(澤出の型) |
| 丁寧×強気 | ありがとうございます。……でも、話だけで踏みとどまれるほど、今は余裕がないんです | Thank you. ...But right now, I don't have room to hang on just because we talked. |  |
| 丁寧×寡黙 | ……承知しました。ですが、言葉で気持ちが動くところは、もう過ぎてしまいました | ...I understand. But I'm past the point where words can move me. | **【迷い】**→§8 |
| 丁寧×内気 | …は、はい…。でも…ごめんなさい…まだ、気持ちが…ついてこなくて…… | ...Y-yes... But... I'm sorry... my heart just... isn't there yet... |  |
| 丁寧×お気楽 | えっと、元気づけてくれて、ありがとうございます。……でも、今回は、いつもの調子にはまだ戻れないかもです | Um, thanks for trying to cheer me up. ...But this time, I don't think I'm back to my usual self yet. |  |
| 丁寧×真面目 | お話、胸にとめておきます。……でも、今のままでは、この先もここで、とはお約束できません | I'll keep what you said in mind. ...But as things stand, I can't promise I'll be here down the line. |  |
| 蠱惑×ノーマル | 優しいのね。でも言葉だけじゃ、私の気持ちは戻らないわ | You're kind. But words alone won't win me back. | 設計書の例どおり |
| 蠱惑×強気 | ふうん、そう。……で、あなたは私のために何をしてくれるの？ | Hmm, I see. ...So what are you actually going to do for me? |  |
| 蠱惑×寡黙 | ……ふふ。言葉だけ？ | ...Hehe. Only words? |  |
| 蠱惑×お気楽 | ふふ、社長ってばマメね♪ ……でも、それで気が済むほど、私、安い女じゃないわ | Hehe, aren't you attentive ♪ ...But I'm not so cheap that a chat settles it. |  |
| 蠱惑×感情的 | 言葉で私をなだめられると思った？ ……欲しいのは、そんなものじゃないの | Did you think words would calm me down? ...That's not what I'm after. |  |
| 蠱惑×真面目 | あなたの考えは、理解したわ。……でも、何も変わっていないのに、気持ちだけ変えるのは無理よ | I see what you're thinking. ...But nothing has actually changed, and I can't change how I feel on my own. |  |
| 鷹揚×ノーマル | その気持ちだけで、十分だよ。……でも、ごめんね。言葉は届いても、残る理由にはならないんだ | Your concern is plenty. ...But I'm sorry. The words reach me, but they aren't a reason to stay. | 「ごめんね」から入る(阿武隈の型) |
| 鷹揚×強気 | 言いたいことは分かったよ。……それだけ？ 私を残したいなら、もうひと押し要るんじゃない？ | I get what you're saying. ...Is that it? If you want to keep me, won't it take more than that? |  |
| 鷹揚×寡黙 | ……そっか。……話だけなら、前と同じだよ？ | ...I see. ...Just talk, and nothing's any different, right? |  |
| 鷹揚×お気楽 | うん、うん、わかった〜。……でも、それで、はい解決〜、ってわけにもいかなくてさ〜 | Uh-huh, got it~. ...But it's not like one chat and, ta-da, problem solved~. |  |
| 鷹揚×感情的 | 話してくれて、ありがと！ ……でも、やっぱり納得できないんだ！ | Thanks for talking! ...But I just can't make peace with it! |  |
| 鷹揚×真面目 | 本気で向き合ってくれてるのは、伝わったよ。……でも、今日の話だけで気持ちを決めるのは、まだ早い気がするんだ | I can tell you're taking this seriously. ...But making up my mind off one talk feels too soon. |  |

---

## 7. 応えてもらえた一言 — 原因: 出番

出番が原因の子を、噂のあと初めて通常興行のカードに入れた翌週。道場の確定枠(tone positive)。試合の勝ち負けに触れない(どちらでも嘘にならない)。信頼はまだ低いので、残ると言い切らず、応えてもらえた手応えだけを抑えて出す。

| セル | 日本語 | 英語 | メモ |
|---|---|---|---|
| 標準×ノーマル | 名前、あった。……ちゃんと見ててくれたんだ | My name was up there. ...So you were paying attention after all. | 設計書の例どおり。信頼35割れの「ちゃんと見てくれてるのかな」への答えになる |
| 標準×強気 | やっと名前が載ったわね。……遅いのよ、ほんと。……でも、ちょっとだけ見直した | About time my name went up. ...Way too slow, honestly. ...But I think a little better of you now. |  |
| 標準×寡黙 | …久しぶりにリングに立った。…悪くないかも。 | ...Back in the ring for once. ...Not bad, I think. | 文末の「かも」は "I think"(英語検品①) |
| 標準×内気 | …試合、できました…。久しぶりすぎて、入場のとき…足が、ちょっと……。でも、うれしかったです…… | ...I was in a match... It'd been so long my legs were wobbly on the way out... But I was really happy... |  |
| 標準×お気楽 | 久々の試合、マジ最高だった♪ ……やっぱ、見られてナンボだよね | First match in forever, and it was the best ♪ ...Being seen is what it's all about. |  |
| 標準×真面目 | やっと試合ができたわ。……歓声って、やっぱりいいものね | A real match at last. ...There's nothing like a cheering crowd. | 道場の一言(声援の聞こえ方を忘れそう)と対になる |
| 標準×感情的 | 出れた…！ 出れたよ…！ ……リング、やっぱり好き… | I got a match...! I really got one...! ...I still love the ring... |  |
| お嬢様×ノーマル | リングの上は、やはり違うわね。……試合でしか分からないことが、まだたくさんあるもの | The ring really is different. ...There is still so much I can only learn in a match. | 研鑽の人(富岡の型)。装飾語尾なし |
| お嬢様×強気 | ようやく、わたくしの使い道に気づいたのね。……遅すぎるくらいだけれど、覚えておくわ | So you finally realized how to make use of me. ...Rather late, but I shall remember it. | 感謝は言わない(大河内の型: 丁寧形の内側に謙遜・感謝を入れない) |
| お嬢様×お気楽 | お客様の前は、本当に楽しいわね。……つい、張り切りすぎてしまったかしら | Performing for an audience really is a delight. ...I may have gotten a little carried away. |  |
| お嬢様×真面目 | 久方ぶりに、全力をお見せできましたわ！ ……機会をいただけたこと、忘れません | At long last, I could show you everything I have! ...I will not forget the chance you gave me. |  |
| クール×ノーマル | 試合、やっと来た。待つより、ずっといい | Finally got a match. Beats waiting. |  |
| クール×寡黙 | ……リングは、いい | ...The ring's good. | 設計書の例どおり |
| ヤンキー×ノーマル | やっと出番が回ってきたか。……久々に思いっきりやれて、スッとしたわ | Finally my turn came around. ...Felt good to go all out again. |  |
| ヤンキー×強気 | やっと呼んだか。……遅えんだよ。ま、今回は大目に見てやる | Finally called me up, huh. ...Took your sweet time. I'll let it slide this time. | 設計書の例「やっと出番かよ。……見てろよ」を改稿(試合の翌週の一言なので「見てろよ」は時間の順がずれる) |
| ヤンキー×お気楽 | 久々に暴れた暴れた♪ ……やっぱこれだよな | Got to cut loose at last ♪ ...Yeah, this is what it's about. | 「勝った勝った♪」(生駒の型)の反復 |
| 丁寧×ノーマル | カードに名前があって、ほっとしました。……リングに立つと、やっぱり落ち着きますね | I was relieved to see my name on the card. ...Being in the ring really does put me at ease. |  |
| 丁寧×強気 | ふぅ……久しぶりの試合、全力でやれました！ 次も、呼んでください | Phew... My first match in a while, and I gave it everything! Please call on me again. |  |
| 丁寧×寡黙 | ……出番、いただけましたね。考えていたことを、ようやく試せました | ...So I was given a match. I finally got to try out what I'd been thinking through. |  |
| 丁寧×内気 | あ、あの…出してくださって、ありがとうございました…！ わたし、やっぱり…試合がしたいです…… | U-um... thank you for putting me in...! I... I really do want to keep wrestling... | 設計書の例に後半を足した |
| 丁寧×お気楽 | 出られました！ 楽しかった！ ……試合がある週って、こんなに違うんですね！ | I got to wrestle! It was so fun! ...A week with a match feels completely different! | 短文の連打(木ノ内の型) |
| 丁寧×真面目 | 出してもらえたからには、次はもっといい試合にします！ ……本当に、ありがとうございました | Since you gave me the chance, I'll make the next one even better! ...Thank you, truly. |  |
| 蠱惑×ノーマル | リングに戻れたわ。……ふふ、こういう扱いなら、悪い気はしないわね | Back in the ring. ...Hehe. Treatment like this, I could get used to. |  |
| 蠱惑×強気 | やっと舞台を用意してくれたわね。……いいわ、ここから上がっていくから | You finally gave me a stage. ...Good. I'll climb from here. |  |
| 蠱惑×寡黙 | ……ようやく、計算が合ってきた | ...Things are finally adding up. | 道場の一言(計算外)と対になる |
| 蠱惑×お気楽 | 出番きた♪ ……やっと仕事させてくれるのね。ちゃんと稼いでくるわ | Got a match ♪ ...Finally letting me work, huh. I'll earn my keep. |  |
| 蠱惑×感情的 | ようやくカードに戻してくれたのね。……ふん、これくらい当然よ。でも、少しだけ気が晴れたわ | So you finally put me back on the card. ...Hmph. The least you could do. But I do feel a little better. |  |
| 蠱惑×真面目 | リングに立って、はっきりしたわ。……やっぱり私は、見る側より、見られる側なのよ | Being back in the ring made one thing clear. ...I'm meant to be watched, not to watch. |  |
| 鷹揚×ノーマル | 久しぶりに、試合をさせてもらったよ。……うん、いい汗をかけた | Finally got to wrestle again, after all that waiting. ...Yeah. It felt good to work up a real sweat. |  |
| 鷹揚×強気 | 待たせてくれたね。……ふぅ、でも、勘は鈍ってなかったよ | You sure kept me waiting. ...Phew. But I hadn't lost my touch. |  |
| 鷹揚×寡黙 | ……出られた。……ちゃんと、応えたつもり。伝わった？ | ...I got my match. ...I tried to live up to it. Did that come across? |  |
| 鷹揚×お気楽 | 久々のリング、疲れた〜。……でも、いい疲れってやつ？ | Back in the ring after ages, and I'm beat~. ...But it's the good kind of tired, you know? | 「〜ってやつ？」(副沢の型) |
| 鷹揚×感情的 | 試合できた！ やっぱり動いてる方が性に合ってるね！ | Had a match! Moving around out there just suits me better! | カラッと明るく(林の型) |
| 鷹揚×真面目 | 試合に出られて、よかった。……ここでなら、もっと伸びていける。そう思えたよ | Getting a match felt good. ...It made me think I can grow more here. | 成長の目線(馬入橋の型) |

---

## 8. 【迷い】一覧(代案付き)

本文の表には1案目を入れてある。代案の英語も §1 の機械検査を通してある。

### 【迷い】1. 蠱惑×お気楽 — 道場の一言(信頼20割れの噂の週)— 原因: 出番

- 迷った点: 打算の皮をかぶった本音。読み方によっては「楽をしたい子」に見えるおそれ
- 1案目(本文): 「出番なしでもお給料は出るし、ラクっちゃラクよね♪ ……ほんと、それだけの場所よ、今のここ」 / No match, but the paycheck still comes, so it's easy money ♪ ...That's all this place is to me now.
- 代案: 「出番がなくても、お給料日はちゃんと来るのよね♪ ……ほんと、それだけの場所よ、今のここ」 / No match, but payday still comes around ♪ ...That's all this place is to me now.

### 【迷い】2. 蠱惑×感情的 — 道場の一言(信頼20割れの噂の週)— 原因: 出番

- 迷った点: カードを組むのは社長なので、社長への当てこすりになる。敵意の漏れ方として強すぎないか
- 1案目(本文): 「また外したのね。……ねえ、誰がこんなカードを組んでるのかしら。顔が見てみたいわ」 / Left me off again. ...Tell me, who's putting these cards together? I'd love to see their face.
- 代案: 「また外したのね。……このカードを組んだ人、私の何を見てるのかしら」 / Left me off again. ...Whoever made this card, what exactly do they see in me?

### 【迷い】3. 鷹揚×お気楽 — 道場の一言(信頼20割れの噂の週)— 原因: 人間関係

- 迷った点: 「打ち上げに呼ばれない」は、手当て(慰労会)を連想させすぎるかもしれない
- 1案目(本文): 「最近、打ち上げに声かかんないの〜。……ま、いっか、とはならないか〜」 / Lately nobody invites me out after shows~. ...Can't exactly shrug that one off, huh.
- 代案: 「最近、控室の雑談に入れてもらえないの〜。……ま、いっか、とはならないか〜」 / Lately nobody lets me in on the locker room chatter~. ...Can't exactly shrug that one off, huh.

### 【迷い】4. 標準×ノーマル — 声かけの反応(信頼20未満)— 原因: 人間関係

- 迷った点: 同じセルのはっきりしない(設計書の例)も「変わらない」で終わる。どちらも設計書の例なので残したが、並べると重なる
- 1案目(本文): 「来てくれてありがとう。……でも、社長と話しても、控室の空気は変わらないから」 / Thanks for coming. ...But talking with you won't change the mood in the locker room.
- 代案: 「来てくれてありがとう。……でも、社長と話しても、控室に戻れば同じだから」 / Thanks for coming. ...But talking with you won't make the locker room any different.

### 【迷い】5. 蠱惑×感情的 — 声かけの反応(信頼20未満)— 原因: 人間関係

- 迷った点: 後半は社長への挑発。原因(控室の目)は伝わるが、挑発が強すぎないか
- 1案目(本文): 「あなたが来ても、控室のみんなの目つきは変わらないのよ。……それとも、あなたが睨み返してくれるの？」 / Your visit won't change how everyone in there looks at me. ...Or will you glare back at them for me?
- 代案: 「あなたが来ても、控室のみんなの目つきは変わらないのよ。……あの目、あなたは向けられたことがないでしょう？」 / Your visit won't change how everyone in there looks at me. ...You've never had those eyes on you, have you?

### 【迷い】6. 丁寧×寡黙 — 声かけの反応(信頼20未満)— 原因: はっきりしない

- 迷った点: 声かけの表は信頼20未満の全域(15以上を含む)で出る。「もう過ぎてしまいました」は決めかけている(15割れ)寄りに聞こえるかもしれない
- 1案目(本文): 「……承知しました。ですが、言葉で気持ちが動くところは、もう過ぎてしまいました」 / ...I understand. But I'm past the point where words can move me.
- 代案: 「……承知しました。ですが、お話だけでは、まだ考えを動かせません」 / ...I understand. But talk alone isn't enough to change my thinking yet.

---

## 9. 設計書の代表例の扱い

| 表 | セル | 設計書の例 | 扱い |
|---|---|---|---|
| 道場・出番 | 標準×ノーマル | 今週も出番表に名前がなかった。……ここにいる意味、あるのかな | 改稿: 後半を「練習して帰るだけの毎日、いつまで続くのかな」に(「ここにいる意味」は信頼35割れの表、「ここにいる理由」は20割れの表と重なるため、事実の側へ寄せた) |
| 道場・出番 | ヤンキー×強気 | リングに上げねえなら、上げてくれるとこに行くだけだ | そのまま |
| 道場・出番 | 丁寧×真面目 | 毎日練習しています。でも、試合に出られないなら、何のための練習なんでしょうか | 骨(「何のための〜」)を丁寧×強気へ移した(「全力」は大久保の語彙で、問い詰める形は強気に合う)。丁寧×真面目は「積み重ね→報われる」(川野辺の型)で書き直した |
| 道場・人間関係 | 蠱惑×お気楽 | ふふ、ここ、居心地悪くなっちゃった。……誰とも目が合わないの | そのまま |
| 道場・人間関係 | 鷹揚×寡黙 | …ここでは、ずっと一人だ | そのまま |
| 声かけ・出番 | 標準×ノーマル | 話はわかった。でも、試合に出られないなら、何も変わらないよ | 改稿: 「うん、わかったよ。でも、試合に出られないうちは、何も始まらないよ」(同じセルの人間関係・はっきりしない(どちらも設計書の例)も「変わらない」で終わり、3本とも同じ動詞になるため) |
| 声かけ・出番 | ヤンキー×強気 | 口だけならいくらでも言えんだろ。次の興行、あたしの名前あんのかよ | 一人称「あたし」を落として「次の興行、名前あんのかよ」に(口調仕様§3-2: 一人称は極力出さない。「私」を当てるより自然)。ほかはそのまま |
| 声かけ・出番 | お嬢様×強気 | お言葉は結構。わたくしをリングに上げていただければ、それで足りますわ | そのまま |
| 声かけ・人間関係 | 標準×ノーマル | 来てくれてありがとう。……でも、社長と話しても、控室の空気は変わらないから | そのまま(【迷い】4) |
| 声かけ・はっきりしない | 標準×ノーマル | 話は聞いた。……でも、それだけじゃ変わらない | そのまま |
| 声かけ・はっきりしない | 蠱惑×ノーマル | 優しいのね。でも言葉だけじゃ、私の気持ちは戻らないわ | そのまま |
| 応えてもらえた | 標準×ノーマル | 名前、あった。……ちゃんと見ててくれたんだ | そのまま(信頼35割れの同セル「ちゃんと見てくれてるのかな」への答えになる) |
| 応えてもらえた | ヤンキー×強気 | やっと出番かよ。……見てろよ | 改稿: 「やっと呼んだか。……遅えんだよ。ま、今回は大目に見てやる」(試合の翌週に出る一言なので、「見てろよ」(これから見せる)だと時間の順がずれる) |
| 応えてもらえた | 丁寧×内気 | あの…出してくださって、ありがとうございました… | そのまま+後半「わたし、やっぱり…試合がしたいです……」を足した |
| 応えてもらえた | クール×寡黙 | ……リングは、いい | そのまま |

## 10. 組み込みメモ(組み込む作業者向け)

- 表の形は `GLIMPSE_A_LINES.trust_below_15` と同じ「アーキタイプ → 性格 → [文]」(`getDialoguePool` が引ける形)。実在しない15セルは、アーキタイプを保ったまま性格をノーマルへ落とすフォールバックに任せる(標準のノーマル・お嬢様のノーマルなど、落ち先はすべてこの34セルの中にある)
- 置き場の名前は組み込み側で決めてよい。英訳の台帳(`test/i18n-extract-dialogue.js`)は、トップレベル宣言名に `LINES` / `DIALOGUE(S)` を含む表と、`GLIMPSE_A_LINES` / `CARE_REACTION_DIALOGUES` の下の表を拾う。既存と同じくドット代入(`GLIMPSE_A_LINES.xxx = {...}`)で置く(ブラケット代入 `TABLE['key'] = {}` はセリフ編集ワークブックの往復から見えなくなる。2026-08-12 GLIMPSE_B 統一のときの取り決め)
- 英訳: 組み込み後に `node test/i18n-extract-dialogue.js` で台帳に行が立つので、`en` 列にこの下書きの英語を入れて `node test/i18n-build-dialogue-dict.js` で辞書を再生成する(§1 と同じ検査が掛かる)
- 声かけの結果モーダルの地の文(「話は最後まで聞いてくれた。けれど、表情は硬いままだ」)と噂のログの一節7本(設計書 §5-1)は、この下書きの範囲外
