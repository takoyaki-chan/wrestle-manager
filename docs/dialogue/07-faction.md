# 派閥イベント

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `FACTION_TRANSITION_LINES`

- 出典: `src/data.js`
- コード内コメント: reasonKey: / 'AUTHORITY_TO_BOND_REBUKE' | 'AUTHORITY_TO_MERIT_LEADER' | / 'AUTHORITY_TO_BOND_LEADER' | 'COMBAT_TO_BOND_DEFEAT' | / 'FACE_TO_HEEL_DRIFT' | 'HEEL_TO_FACE_DRIFT' / 各エントリは { leaderLine, narration } を返す。 / {leader} {org} は呼び出し側 vars で置換される。
- 本数: 84

- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.composed.leaderLine`: ……肩の力、抜こうか。私が上に立つ意味、もう要らない気がして。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.composed.narration`: 幾度かの否認を経て、{leader}は静かに権威を手放した。{org}は仲間意識の方へ重心を移す。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.ojousama.leaderLine`: もう、わたくしが旗を持つ必要もございませんわね。皆様、横で歩みましょう。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.ojousama.narration`: 社長に四度退けられた末、{leader}はお高い旗を自ら畳んだ。{org}は対等な絆へと舵を切る。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.polite.leaderLine`: ……私が先頭に立つやり方は、皆にも社長にも届きませんでした。横で支える側に回ります。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.polite.narration`: {leader}は何度も拒まれた末、自らの統率方針を改めた。{org}は対等な絆を軸に再編される。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.seductive.leaderLine`: ふふ……上に立つの、もう疲れちゃった。横で寄り添う方が、きっと素敵よ。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.seductive.narration`: 艶やかな諦めとともに、{leader}は権威を解いた。{org}は寄り添う側の温度へと移ろう。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.delinquent.leaderLine`: チッ……もういい。命令も指示も、今日でやめだ。横並びでやんなよ、おまえら。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.delinquent.narration`: 社長への要求を四度跳ねられ、{leader}は権威の旗を自分から下ろした。{org}は横並びの結束へ舵を切る。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.cool.leaderLine`: ……いい。降りる。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.cool.narration`: 短く告げて、{leader}は権威の座から降りた。{org}は静かに横並びへ重心を移す。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.normal.leaderLine`: もう私が上に立つ理由、なくなったかも。みんなで横並びでいこう。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_REBUKE.normal.narration`: 幾度かの否認を経て、{leader}は権威の看板を畳んだ。{org}は仲間意識の方へ寄り直す。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.composed.leaderLine`: 彼女が引っ張るなら、私は数字で支える側に。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.composed.narration`: 幹部交代を機に、{org}の柱は権威から実績へと静かに置き換えられた。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.ojousama.leaderLine`: あの方が頭に立たれるのなら、わたくしも結果で応えねばなりませんわね。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.ojousama.narration`: 新たな幹部のもと、{org}は権威の旗を下ろし、勝ち星で序列を測る組織へと衣替えした。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.polite.leaderLine`: 彼女のやり方を尊重します。これからは、結果で語る組織でありたい。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.polite.narration`: {org}は新たな幹部のもと、序列を実力で測る派閥へと色を変えた。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.seductive.leaderLine`: あの子が頭? ふふ、面白いわ。私も数字で答えるしかないわね。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.seductive.narration`: 艶のある含み笑いとともに、{leader}は権威を譲った。{org}は実力本位の派閥へ移る。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.delinquent.leaderLine`: あの子が頭に立つんなら、こっちはリングで黙らせるしかねぇだろ。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.delinquent.narration`: 幹部の突き上げを受け、{org}は実力主義へ路線変更した。残った者は数字で位置取りを争う。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.cool.leaderLine`: ……数字で示す。それだけ。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.cool.narration`: 幹部交代を境に、{org}は権威から実績本位へと静かに塗り替わった。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.normal.leaderLine`: 次のボスは結果重視の人だしね。私もちゃんと数字残さなきゃ。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_MERIT_LEADER.normal.narration`: 幹部交代をきっかけに、{org}は権威から実力主義へ移行した。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.composed.leaderLine`: ふふ、彼女が立つなら、私もただの仲間に戻れる。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.composed.narration`: {leader}は柔らかい後継者を得て、自らの権威を解いた。{org}は仲間意識を軸に再編される。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.ojousama.leaderLine`: あの方の温かさが、この組には合っておりましたわ。わたくしも、横で並ばせていただきます。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.ojousama.narration`: 新たな幹部の人柄を受け、{leader}は権威の旗を畳んだ。{org}は横の絆で立つ組織へ姿を変える。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.polite.leaderLine`: 彼女の優しさが、この組には合っていた。私もその下で、皆と並びたい。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.polite.narration`: {org}は新たな幹部のもと、横の絆で立つ組織へと姿を変えた。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.seductive.leaderLine`: あの子のあったかさ、いいわね。私も、肩肘張るのやめにするわ。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.seductive.narration`: 柔らかな後継者の温度に引かれ、{leader}は権威を解いた。{org}は寄り添い合う組織へ衣替えする。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.delinquent.leaderLine`: あいつが頭か。……ま、いい。もう肩肘張んなくて済むわ。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.delinquent.narration`: 新たな幹部の温度に引かれ、{org}は権威の組織から横で支え合う組織へ姿を変えた。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.cool.leaderLine`: ……あの子に任せる。私はただの仲間でいい。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.cool.narration`: 短い譲位の言葉とともに、{org}は権威派閥から結束派閥へ姿を変えた。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.normal.leaderLine`: 上下関係とかもういいかな。みんなで仲良くやろう。
- `FACTION_TRANSITION_LINES.AUTHORITY_TO_BOND_LEADER.normal.narration`: 幹部交代を境に、{org}は権威から結束派閥へ衣替えした。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.composed.leaderLine`: これが答えね。……戦い方を、変える時。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.composed.narration`: 完敗を受け、{leader}は静かに闘争路線を畳んだ。{org}は仲間内の結束で立て直しを図る。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.ojousama.leaderLine`: これだけやられては、もう拳を上げる気にもなりませんわ。寄り添う道を探しましょう。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.ojousama.narration`: 抗争での完全敗北を機に、{leader}は牙を収めた。{org}は内向きの絆へと退く。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.polite.leaderLine`: ……負けは、認めます。これからは、ぶつかるより、寄り添うやり方を探したい。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.polite.narration`: 完全敗北の末、{org}は闘争派閥から結束派閥へ路線を改めた。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.seductive.leaderLine`: ふふ……完敗、ね。もう拳より、温もりの方が欲しいわ。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.seductive.narration`: 艶のある諦めとともに、{leader}は闘争心を畳んだ。{org}は寄り添う側の派閥へと退く。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.delinquent.leaderLine`: はぁ……ここまでやられたら、もう拳ふり上げる気にもならねぇよ。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.delinquent.narration`: 抗争に大敗した{org}は、闘争組織から結束派閥へと変質した。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.cool.leaderLine`: ……負けた。終わりだ。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.cool.narration`: 短い敗北宣言を経て、{leader}は牙を収めた。{org}は内向きの絆へと退く。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.normal.leaderLine`: これだけやられたらもう降参。仲良くやっていこう。
- `FACTION_TRANSITION_LINES.COMBAT_TO_BOND_DEFEAT.normal.narration`: 抗争完敗を機に、{org}は牙を畳んで結束派閥へと衣替えした。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.composed.leaderLine`: ……正直に言うと、王道って、しんどかった。こっちの方が、息がしやすい。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.composed.narration`: {leader}は静かに王道の看板を下ろした。{org}は表舞台の華やかさより、裏側の温度を選ぶ。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.ojousama.leaderLine`: もう、お行儀よくしているのも飽きましたわ。客の悲鳴のほうが、ずっと心地よろしくて。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.ojousama.narration`: {leader}の口元から優雅な微笑みが消え、艶のある悪意が滲んだ。{org}はファンに背を向け、ヒールへと滑り出す。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.polite.leaderLine`: ……ファンに胸を張れる派閥でいたかった。でも、ここまで来た自分たちを、もう戻せません。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.polite.narration`: 迷いと諦めの末、{leader}は王道の旗を畳んだ。{org}は反主流の側へ立ち位置を移す。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.seductive.leaderLine`: ふふ……あなたたちが嫌がる顔、見ていたいの。それじゃ、ダメかしら?
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.seductive.narration`: 艶やかな囁きとともに、{leader}は王道の仮面を捨てた。{org}は挑発と反則を糧に変質していく。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.delinquent.leaderLine`: もう「いい子」のフリは限界だ。客の歓声より、悲鳴の方が気持ちいいんだよ。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.delinquent.narration`: {leader}の表情から王道の柔らかさが消えた。{org}はファンに背を向け、挑発と反則を糧に変質する。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.cool.leaderLine`: ……飽きた。こっち側でいい。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.cool.narration`: 短い告白を経て、{leader}は王道の看板を下ろした。{org}はヒール側へと立ち位置を変える。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.normal.leaderLine`: もう真面目にやるのやめた。客が嫌がる顔の方が、見てて楽しい。
- `FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT.normal.narration`: {leader}は王道の重さに飽きた。{org}は軽々と立ち位置を変え、ヒールサイドへ転がり込む。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.composed.leaderLine`: ……反則、続けるの、しんどかった。普通に試合する方が、自分らしい。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.composed.narration`: {leader}は静かに反主流の看板を下ろした。{org}は王道の側で、ようやく息を整える。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.ojousama.leaderLine`: 悪役を演じるのも、そろそろ飽きましたわ。皆様の声援、頂戴いたしますわよ。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.ojousama.narration`: {leader}は艶やかにヒールの仮面を外した。{org}は王道路線へと衣替えする。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.polite.leaderLine`: ヒールでいる意味を、もう自分で説明できません。応援してくれる人の方を見ます。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.polite.narration`: 誠実さがヒールの仮面を内側から押し返した。{org}は王道路線へと舵を切る。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.seductive.leaderLine`: ふふ……あの子たちの真っ直ぐな目に、参っちゃったの。悪役は、もう似合わないわ。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.seductive.narration`: 艶やかな告白とともに、{leader}はヒールの皮を脱いだ。{org}は王道路線へ歩み戻る。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.delinquent.leaderLine`: チッ、ガラじゃねぇが……うちらに歓声が向くなら、それも悪くねぇ。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.delinquent.narration`: {leader}の挑発の刃が鈍った。{org}は反主流の旗を畳み、王道の側へと立ち位置を変える。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.cool.leaderLine`: ……普通でいい。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.cool.narration`: 短い告白を機に、{leader}はヒールの看板を下ろした。{org}は王道の側で息を整える。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.normal.leaderLine`: ヒール、もういいかな。やっぱり歓声の方が気持ちいいし。
- `FACTION_TRANSITION_LINES.HEEL_TO_FACE_DRIFT.normal.narration`: {leader}はあっさりとヒールの皮を脱いだ。{org}は王道路線へ転がり込む。

## `FACTION_F02_LINES`

- 出典: `src/data.js`
- コード内コメント: → bold / introverted / carefree / earnest / emotional / shy / archetype は fighter.archetype そのまま / → normal / ojousama / polite / composed / cool / delinquent / seductive / side は 'attack'（宣戦側）または 'defend'（応じる側） / archetype キー未定義の場合は normal にフォールバック。 / personality 未定義の場合は introverted にフォールバック。
- 本数: 84

- `FACTION_F02_LINES.bold.attack.normal`: もう、同じ場所には立てない
- `FACTION_F02_LINES.bold.attack.ojousama`: もう、同じ場所には立てませんわ
- `FACTION_F02_LINES.bold.attack.polite`: もう、同じ場所には立てません
- `FACTION_F02_LINES.bold.attack.composed`: もう、同じ場所には立てない
- `FACTION_F02_LINES.bold.attack.cool`: ……もう、並べない
- `FACTION_F02_LINES.bold.attack.delinquent`: もう、一緒にゃいられねえ
- `FACTION_F02_LINES.bold.attack.seductive`: もう、隣には立てないわ
- `FACTION_F02_LINES.bold.defend.normal`: 上等だ。受けて立つ
- `FACTION_F02_LINES.bold.defend.ojousama`: 上等ですわ。お受けいたしましょう
- `FACTION_F02_LINES.bold.defend.polite`: 上等です。お受けいたします
- `FACTION_F02_LINES.bold.defend.composed`: 上等。受けて立とう
- `FACTION_F02_LINES.bold.defend.cool`: ……上等
- `FACTION_F02_LINES.bold.defend.delinquent`: 上等だ、かかってこい
- `FACTION_F02_LINES.bold.defend.seductive`: 上等よ。受けて立つわ
- `FACTION_F02_LINES.introverted.attack.normal`: ……もう、戻れません
- `FACTION_F02_LINES.introverted.attack.ojousama`: ……もう、戻れませんわ
- `FACTION_F02_LINES.introverted.attack.polite`: ……もう、戻れません
- `FACTION_F02_LINES.introverted.attack.composed`: ……もう、戻れない
- `FACTION_F02_LINES.introverted.attack.cool`: ……戻れない
- `FACTION_F02_LINES.introverted.attack.delinquent`: ……もう、戻れない
- `FACTION_F02_LINES.introverted.attack.seductive`: ……もう、戻れないの
- `FACTION_F02_LINES.introverted.defend.normal`: そちらが望むなら
- `FACTION_F02_LINES.introverted.defend.ojousama`: そちらがお望みでしたら
- `FACTION_F02_LINES.introverted.defend.polite`: そちらがお望みなら
- `FACTION_F02_LINES.introverted.defend.composed`: そちらが望むなら
- `FACTION_F02_LINES.introverted.defend.cool`: ……望むなら
- `FACTION_F02_LINES.introverted.defend.delinquent`: そっちがそう言うなら
- `FACTION_F02_LINES.introverted.defend.seductive`: あなたが望むなら
- `FACTION_F02_LINES.carefree.attack.normal`: 仲良しごっこは終わり、かな
- `FACTION_F02_LINES.carefree.attack.ojousama`: 仲良しごっこは、もう終わりですわね
- `FACTION_F02_LINES.carefree.attack.polite`: 仲良しごっこは、もう終わりですね
- `FACTION_F02_LINES.carefree.attack.composed`: 仲良しごっこは、もう終わりだ
- `FACTION_F02_LINES.carefree.attack.cool`: ……仲良しごっこは終わり
- `FACTION_F02_LINES.carefree.attack.delinquent`: 仲良しごっこは終わりだな
- `FACTION_F02_LINES.carefree.attack.seductive`: 仲良しごっこは終わり、でしょ？
- `FACTION_F02_LINES.carefree.defend.normal`: ま、仕方ないよね
- `FACTION_F02_LINES.carefree.defend.ojousama`: まあ、仕方ありませんわね
- `FACTION_F02_LINES.carefree.defend.polite`: まあ、仕方ありませんね
- `FACTION_F02_LINES.carefree.defend.composed`: まあ、仕方ない
- `FACTION_F02_LINES.carefree.defend.cool`: ……仕方ない
- `FACTION_F02_LINES.carefree.defend.delinquent`: ま、しゃあねえな
- `FACTION_F02_LINES.carefree.defend.seductive`: ま、仕方ないわね
- `FACTION_F02_LINES.earnest.attack.normal`: けじめを、つけさせてください
- `FACTION_F02_LINES.earnest.attack.ojousama`: けじめを、つけさせてくださいませ
- `FACTION_F02_LINES.earnest.attack.polite`: けじめを、つけさせてください
- `FACTION_F02_LINES.earnest.attack.composed`: けじめを、つけさせてもらう
- `FACTION_F02_LINES.earnest.attack.cool`: ……けじめをつける
- `FACTION_F02_LINES.earnest.attack.delinquent`: けじめはつけさせてもらう
- `FACTION_F02_LINES.earnest.attack.seductive`: けじめを、つけさせて
- `FACTION_F02_LINES.earnest.defend.normal`: 逃げるつもりはありません
- `FACTION_F02_LINES.earnest.defend.ojousama`: 逃げるつもりはございませんわ
- `FACTION_F02_LINES.earnest.defend.polite`: 逃げるつもりはありません
- `FACTION_F02_LINES.earnest.defend.composed`: 逃げるつもりはない
- `FACTION_F02_LINES.earnest.defend.cool`: ……逃げない
- `FACTION_F02_LINES.earnest.defend.delinquent`: 逃げる気はねえ
- `FACTION_F02_LINES.earnest.defend.seductive`: 逃げるつもりはないわ
- `FACTION_F02_LINES.emotional.attack.normal`: 許せない、あの子のやり方
- `FACTION_F02_LINES.emotional.attack.ojousama`: 許せませんわ、あの方のなさりよう
- `FACTION_F02_LINES.emotional.attack.polite`: 許せません、あの方のやり方
- `FACTION_F02_LINES.emotional.attack.composed`: 許せないね、あのやり方は
- `FACTION_F02_LINES.emotional.attack.cool`: ……許せない
- `FACTION_F02_LINES.emotional.attack.delinquent`: 許せねえ、あいつのやり方
- `FACTION_F02_LINES.emotional.attack.seductive`: 許せないのよ、あの子のやり方
- `FACTION_F02_LINES.emotional.defend.normal`: こっちだって、引けないの
- `FACTION_F02_LINES.emotional.defend.ojousama`: わたくしだって、引けませんわ
- `FACTION_F02_LINES.emotional.defend.polite`: こちらも、引くわけにはいきません
- `FACTION_F02_LINES.emotional.defend.composed`: こちらも、引けないんだ
- `FACTION_F02_LINES.emotional.defend.cool`: ……引けない
- `FACTION_F02_LINES.emotional.defend.delinquent`: こっちだって引けねえんだよ
- `FACTION_F02_LINES.emotional.defend.seductive`: こっちだって、引けないのよ
- `FACTION_F02_LINES.shy.attack.normal`: あの…もう、一緒には…いられなくて
- `FACTION_F02_LINES.shy.attack.ojousama`: あの…もう、ご一緒には…いられませんの
- `FACTION_F02_LINES.shy.attack.polite`: あの、もう…ご一緒には、いられません…
- `FACTION_F02_LINES.shy.attack.composed`: もう、一緒にはいられない…
- `FACTION_F02_LINES.shy.attack.cool`: ……もう、無理
- `FACTION_F02_LINES.shy.attack.delinquent`: もう…一緒には、いられない…
- `FACTION_F02_LINES.shy.attack.seductive`: あの…もう、一緒には…いられないの
- `FACTION_F02_LINES.shy.defend.normal`: …やるしか、ないんです
- `FACTION_F02_LINES.shy.defend.ojousama`: …やるしか、ありませんわ
- `FACTION_F02_LINES.shy.defend.polite`: …やるしか、ないんです
- `FACTION_F02_LINES.shy.defend.composed`: …やるしかない
- `FACTION_F02_LINES.shy.defend.cool`: ……やる
- `FACTION_F02_LINES.shy.defend.delinquent`: …やるしか、ねえ
- `FACTION_F02_LINES.shy.defend.seductive`: …やるしかないの

## `F07_LINES`

- 出典: `src/data.js`
- コード内コメント: - leaderDemand: 入口モーダル本文のリーダー直接セリフ（要求型のみ） / - coachReport:  入口モーダルのコーチ報告ナレーション（観察型・インシデント型） / - resultLeader: 結果モーダルのリーダー反応セリフ / - resultTarget: 結果モーダルの対象選手反応（観察・インシデント型） / 段階投入: DEMAND_MAIN / OBSERVE_RIVAL_HEAT / INCIDENT_BOUNDARY をフル品質、 / 残り 9 種は性格無視のプレースホルダ。
- 本数: 1595

### leaderDemand.DEMAND_MAIN.normal.bold[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.normal.bold[1]`: 社長、次の興行のメイン、私たちに任せてもらえませんか。実力で示します。

### leaderDemand.DEMAND_MAIN.normal.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.normal.introverted[1]`: …社長、次のメイン、私たちで挑ませてもらえませんか。

### leaderDemand.DEMAND_MAIN.normal.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.normal.carefree[1]`: 社長〜、次のメイン、私たちでいきましょうよ。盛り上げますって。

### leaderDemand.DEMAND_MAIN.normal.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.normal.earnest[1]`: 社長、お願いがあります。次の興行のメイン、私たちにやらせてください。

### leaderDemand.DEMAND_MAIN.normal.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.normal.emotional[1]`: 社長、頼みます。メイン、私たちに回してください。今の私たちなら必ず応えます。

### leaderDemand.DEMAND_MAIN.normal.shy[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.normal.shy[1]`: …社長、あの、次のメイン…私たちに、お願いできませんか。

### leaderDemand.DEMAND_MAIN.composed.bold[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.composed.bold[1]`: 社長、次のメインカード、私たちで組ませてください。今ならハマります。

### leaderDemand.DEMAND_MAIN.composed.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.composed.introverted[1]`: …社長、次のメイン、私たちで考えてみたいのですが。

### leaderDemand.DEMAND_MAIN.composed.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.composed.carefree[1]`: 社長、次のメイン、私たちで請けても構いませんか。流れを作りますよ。

### leaderDemand.DEMAND_MAIN.composed.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.composed.earnest[1]`: 社長、次の興行のメインを私たちに任せていただけないか、ご検討いただけますか。

### leaderDemand.DEMAND_MAIN.composed.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.composed.emotional[1]`: 社長、次のメインは私たちに任せてください。今の状態を逃したくないんです。

### leaderDemand.DEMAND_MAIN.composed.shy[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.composed.shy[1]`: …社長、次のメイン…私たちで、考えていただけませんか。

### leaderDemand.DEMAND_MAIN.ojousama.bold[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.ojousama.bold[1]`: ねぇ社長、次のメイン、わたくしたちにお任せいただけませんこと?

### leaderDemand.DEMAND_MAIN.ojousama.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.ojousama.introverted[1]`: …社長、次のメイン、わたくしたちに頂戴できませんでしょうか。

### leaderDemand.DEMAND_MAIN.ojousama.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.ojousama.carefree[1]`: 社長〜、次のメインカード、わたくしたちでいかがかしら?

### leaderDemand.DEMAND_MAIN.ojousama.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.ojousama.earnest[1]`: 社長、不躾なお願いですが、次の興行のメインをわたくしたちにお任せいただきたく。

### leaderDemand.DEMAND_MAIN.ojousama.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.ojousama.emotional[1]`: 社長、お願いいたしますわ。次のメイン、わたくしたちに任せてくださいませ。

### leaderDemand.DEMAND_MAIN.ojousama.shy[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.ojousama.shy[1]`: …社長、その…次のメイン、わたくしたちに…いただけませんでしょうか。

### leaderDemand.DEMAND_MAIN.polite.bold[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.polite.bold[1]`: 社長、突然ですが、次のメインを私たちに任せていただけないでしょうか。

### leaderDemand.DEMAND_MAIN.polite.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.polite.introverted[1]`: …社長、次のメイン、私たちに任せていただけませんでしょうか。

### leaderDemand.DEMAND_MAIN.polite.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.polite.carefree[1]`: 社長、次のメイン、よろしければ私たちでやらせていただけませんか〜。

### leaderDemand.DEMAND_MAIN.polite.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.polite.earnest[1]`: 社長、お忙しいところ恐縮ですが、次の興行のメインを私たちにお任せいただけませんでしょうか。

### leaderDemand.DEMAND_MAIN.polite.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.polite.emotional[1]`: 社長、お願いします。次のメインを、どうか私たちに任せてください。

### leaderDemand.DEMAND_MAIN.polite.shy[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.polite.shy[1]`: …社長、あの…次のメイン、私たちに…お任せいただけたら、嬉しいです。

### leaderDemand.DEMAND_MAIN.seductive.bold[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.seductive.bold[1]`: 社長、次のメイン、私に任せてくれない? 必ず客を沸かすから。

### leaderDemand.DEMAND_MAIN.seductive.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.seductive.introverted[1]`: …社長、次のメイン、私で行ってもいい?

### leaderDemand.DEMAND_MAIN.seductive.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.seductive.carefree[1]`: 社長〜、次のメイン、私たちでいかが? 楽しい絵を描けるわよ。

### leaderDemand.DEMAND_MAIN.seductive.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.seductive.earnest[1]`: 社長、次の興行のメイン、私に預けてくれませんか。手応えはあるんです。

### leaderDemand.DEMAND_MAIN.seductive.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.seductive.emotional[1]`: 社長、次のメインは私たちに任せて。中途半端じゃ嫌なの、お願い。

### leaderDemand.DEMAND_MAIN.seductive.shy[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.seductive.shy[1]`: …社長、次のメイン…私で、いいですか?

### leaderDemand.DEMAND_MAIN.delinquent.bold[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.delinquent.bold[1]`: 社長、次のメイン、あたしらでいきますよ。話、通してください。

### leaderDemand.DEMAND_MAIN.delinquent.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.delinquent.introverted[1]`: …社長、次のメイン、あたしらに回してくんないっすか。

### leaderDemand.DEMAND_MAIN.delinquent.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.delinquent.carefree[1]`: 社長〜、次のメイン、あたしらで暴れさせてくれません?

### leaderDemand.DEMAND_MAIN.delinquent.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.delinquent.earnest[1]`: 社長、こんな言い方アレですけど、次のメインはあたしらに張らせてください。

### leaderDemand.DEMAND_MAIN.delinquent.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.delinquent.emotional[1]`: 社長、次のメイン、あたしらに張らせろっつってんです。逃げないですから。

### leaderDemand.DEMAND_MAIN.delinquent.shy[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.delinquent.shy[1]`: …社長、その、次のメイン…あたしらに、お願いできないっすかね…?

### leaderDemand.DEMAND_MAIN.cool.bold[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.cool.bold[1]`: 社長、次のメイン、私たちに任せてください。準備はできています。

### leaderDemand.DEMAND_MAIN.cool.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.cool.introverted[1]`: …社長、次のメイン、私たちに回せませんか。

### leaderDemand.DEMAND_MAIN.cool.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.cool.carefree[1]`: 社長、次のメイン、私たちで請けます。発表してください。

### leaderDemand.DEMAND_MAIN.cool.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.cool.earnest[1]`: 社長、次のメイン、私たちに任せていただけるなら、結果で返します。

### leaderDemand.DEMAND_MAIN.cool.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.cool.emotional[1]`: 社長、次のメインは私たちです。任せてください。

### leaderDemand.DEMAND_MAIN.cool.shy[]

- `F07_LINES.leaderDemand.DEMAND_MAIN.cool.shy[1]`: …社長、次のメイン…私で、お願いできますか。

### leaderDemand.DEMAND_MONEY.normal.bold[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.normal.bold[1]`: 社長、私たちのメンバーの待遇、もう一度見直してもらえませんか。

### leaderDemand.DEMAND_MONEY.normal.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.normal.introverted[1]`: …社長、待遇のことで相談があります。私たちのメンバーのことです。

### leaderDemand.DEMAND_MONEY.normal.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.normal.carefree[1]`: 社長〜、お給料の話なんですけど、ちょっとだけ上げてもらえませんか?

### leaderDemand.DEMAND_MONEY.normal.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.normal.earnest[1]`: 社長、図々しいお願いですが、私たちのメンバーの待遇を見直していただけませんか。

### leaderDemand.DEMAND_MONEY.normal.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.normal.emotional[1]`: 社長、お願いします。私たちのメンバー、もっと正当に評価されてもいいはずです。

### leaderDemand.DEMAND_MONEY.normal.shy[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.normal.shy[1]`: …社長、その、待遇の件で…一度、聞いてもらえますか。

### leaderDemand.DEMAND_MONEY.composed.bold[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.composed.bold[1]`: 社長、私たちの給与、一度見直しの俎上に乗せてもらえませんか。

### leaderDemand.DEMAND_MONEY.composed.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.composed.introverted[1]`: …社長、給与改定のこと、ご相談したいのですが。

### leaderDemand.DEMAND_MONEY.composed.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.composed.carefree[1]`: 社長、給与の話、頃合いだと思うんですけど、いかがですか?

### leaderDemand.DEMAND_MONEY.composed.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.composed.earnest[1]`: 社長、私たちのメンバーの待遇について、一度ご検討いただけませんでしょうか。

### leaderDemand.DEMAND_MONEY.composed.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.composed.emotional[1]`: 社長、私たちが受け取っているもの、もう一度見直してください。お願いします。

### leaderDemand.DEMAND_MONEY.composed.shy[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.composed.shy[1]`: …社長、給与のこと…一度、お時間いただけませんか。

### leaderDemand.DEMAND_MONEY.ojousama.bold[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.ojousama.bold[1]`: ねぇ社長、わたくしどもの給与、改めてお考えいただけませんこと?

### leaderDemand.DEMAND_MONEY.ojousama.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.ojousama.introverted[1]`: …社長、待遇の件で、わたくしどものお話を伺っていただけませんでしょうか。

### leaderDemand.DEMAND_MONEY.ojousama.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.ojousama.carefree[1]`: 社長〜、お給金の件、少々考えてくださってもよろしくてよ?

### leaderDemand.DEMAND_MONEY.ojousama.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.ojousama.earnest[1]`: 社長、お聞き苦しいかもしれませんが、わたくしどもの待遇を見直していただけませんでしょうか。

### leaderDemand.DEMAND_MONEY.ojousama.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.ojousama.emotional[1]`: 社長、わたくしどもの努め、相応のお手当てでお返しいただきたいのです。

### leaderDemand.DEMAND_MONEY.ojousama.shy[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.ojousama.shy[1]`: …社長、わたくしどもの待遇のこと…一度、お話聞いてくださいませ。

### leaderDemand.DEMAND_MONEY.polite.bold[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.polite.bold[1]`: 社長、突然ですが、私たちのメンバーの待遇を見直していただきたいです。

### leaderDemand.DEMAND_MONEY.polite.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.polite.introverted[1]`: …社長、待遇のことで、ご相談させていただいてもよろしいですか。

### leaderDemand.DEMAND_MONEY.polite.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.polite.carefree[1]`: 社長、お給料のこと、よろしければ少しご検討いただけませんか〜。

### leaderDemand.DEMAND_MONEY.polite.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.polite.earnest[1]`: 社長、不躾で申し訳ありませんが、私たちのメンバーの待遇を一度ご再考いただけませんでしょうか。

### leaderDemand.DEMAND_MONEY.polite.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.polite.emotional[1]`: 社長、お願いします。私たちのメンバー、もう少し報いてあげてください。

### leaderDemand.DEMAND_MONEY.polite.shy[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.polite.shy[1]`: …社長、あの…待遇のこと、少しだけお話、させていただけませんか。

### leaderDemand.DEMAND_MONEY.seductive.bold[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.seductive.bold[1]`: 社長、私たちの給料の話、ちょっと聞いてくれない?

### leaderDemand.DEMAND_MONEY.seductive.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.seductive.introverted[1]`: …社長、待遇の話…してもいい?

### leaderDemand.DEMAND_MONEY.seductive.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.seductive.carefree[1]`: 社長〜、お給料の話、たまには上向きにしてくれないと困りますよ?

### leaderDemand.DEMAND_MONEY.seductive.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.seductive.earnest[1]`: 社長、私たちの仕事に見合うお手当て、考え直してくださいませんか。

### leaderDemand.DEMAND_MONEY.seductive.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.seductive.emotional[1]`: 社長、お願い、私たちが何を受け取ってるか、もう一度見て。

### leaderDemand.DEMAND_MONEY.seductive.shy[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.seductive.shy[1]`: …社長、お給料のこと…相談、してもいいですか?

### leaderDemand.DEMAND_MONEY.delinquent.bold[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.delinquent.bold[1]`: 社長、あたしらの給料、見直してくれません? はっきり言って足りないっす。

### leaderDemand.DEMAND_MONEY.delinquent.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.delinquent.introverted[1]`: …社長、給料の話、聞いてくんないっすか。

### leaderDemand.DEMAND_MONEY.delinquent.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.delinquent.carefree[1]`: 社長〜、お給料の件、ちょっと色つけてくんないっすかね〜?

### leaderDemand.DEMAND_MONEY.delinquent.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.delinquent.earnest[1]`: 社長、こんなこと言うのもアレなんですけど、あたしらの待遇、見直してくださいよ。

### leaderDemand.DEMAND_MONEY.delinquent.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.delinquent.emotional[1]`: 社長、あたしらの給料、ちゃんと釣り合わせてくださいよ。我慢の限界なんですよ。

### leaderDemand.DEMAND_MONEY.delinquent.shy[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.delinquent.shy[1]`: …社長、その、給料のこと…ちょっとだけ、聞いてくんないっすかね…?

### leaderDemand.DEMAND_MONEY.cool.bold[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.cool.bold[1]`: 社長、私たちのメンバーの待遇、見直してください。理由は資料で出します。

### leaderDemand.DEMAND_MONEY.cool.introverted[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.cool.introverted[1]`: …社長、給与のこと、相談があります。

### leaderDemand.DEMAND_MONEY.cool.carefree[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.cool.carefree[1]`: 社長、給与改定、提案させてください。妥当だと思います。

### leaderDemand.DEMAND_MONEY.cool.earnest[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.cool.earnest[1]`: 社長、私たちの待遇、現状と合っていないと思います。一度ご検討ください。

### leaderDemand.DEMAND_MONEY.cool.emotional[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.cool.emotional[1]`: 社長、私たちが受け取ってる金額、見合ってないです。直してください。

### leaderDemand.DEMAND_MONEY.cool.shy[]

- `F07_LINES.leaderDemand.DEMAND_MONEY.cool.shy[1]`: …社長、給与のこと、一度、聞いてくれますか。

### leaderDemand.DEMAND_ABSTRACT.normal.bold[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.normal.bold[1]`: 社長、私たちのメンバーのこと、もう少しだけ大事にしてもらえませんか。

### leaderDemand.DEMAND_ABSTRACT.normal.introverted[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.normal.introverted[1]`: …社長、私たちのメンバーを、ちゃんと見てもらえるとありがたいです。

### leaderDemand.DEMAND_ABSTRACT.normal.carefree[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.normal.carefree[1]`: 社長〜、私たちの子のこと、忘れないでくださいね。

### leaderDemand.DEMAND_ABSTRACT.normal.earnest[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.normal.earnest[1]`: 社長、お願いがあります。私たちのメンバーのこと、気にかけてもらえないでしょうか。

### leaderDemand.DEMAND_ABSTRACT.normal.emotional[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.normal.emotional[1]`: 社長、頼みます。私たちのメンバー、もっと大切に扱ってください。

### leaderDemand.DEMAND_ABSTRACT.normal.shy[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.normal.shy[1]`: …社長、その、私たちのメンバーのこと、お願いします。

### leaderDemand.DEMAND_ABSTRACT.composed.bold[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.composed.bold[1]`: 社長、私たちのメンバーに、もう少し目を配っていただけませんか。

### leaderDemand.DEMAND_ABSTRACT.composed.introverted[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.composed.introverted[1]`: …社長、私たちのこと、気に留めていただけると嬉しいです。

### leaderDemand.DEMAND_ABSTRACT.composed.carefree[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.composed.carefree[1]`: 社長、私たちのこと、たまには思い出してあげてくださいね。

### leaderDemand.DEMAND_ABSTRACT.composed.earnest[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.composed.earnest[1]`: 社長、私たちのメンバーのこと、いま少しお気にかけていただきたいのですが。

### leaderDemand.DEMAND_ABSTRACT.composed.emotional[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.composed.emotional[1]`: 社長、私たちの子たち、ちゃんと抱えていてください。お願いします。

### leaderDemand.DEMAND_ABSTRACT.composed.shy[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.composed.shy[1]`: …社長、私たちのこと…忘れないでいてくださると、嬉しいです。

### leaderDemand.DEMAND_ABSTRACT.ojousama.bold[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.ojousama.bold[1]`: ねぇ社長、わたくしどものこと、もっと大切に扱ってくださいませ。

### leaderDemand.DEMAND_ABSTRACT.ojousama.introverted[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.ojousama.introverted[1]`: …社長、わたくしどもを、もう少しだけ気にかけていただきたいですわ。

### leaderDemand.DEMAND_ABSTRACT.ojousama.carefree[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.ojousama.carefree[1]`: 社長〜、わたくしたちのこと、たまには思い出してくださってもよろしくてよ?

### leaderDemand.DEMAND_ABSTRACT.ojousama.earnest[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.ojousama.earnest[1]`: 社長、不躾ですが、わたくしどものメンバーをもう少しお気遣いいただけませんでしょうか。

### leaderDemand.DEMAND_ABSTRACT.ojousama.emotional[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.ojousama.emotional[1]`: 社長、わたくしどもの子たち、どうか大切に扱ってくださいませ。

### leaderDemand.DEMAND_ABSTRACT.ojousama.shy[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.ojousama.shy[1]`: …社長、わたくしどものこと…どうか、忘れずにいてくださいませ。

### leaderDemand.DEMAND_ABSTRACT.polite.bold[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.polite.bold[1]`: 社長、突然ですが、私たちのメンバーをもう少し大切にしていただきたいです。

### leaderDemand.DEMAND_ABSTRACT.polite.introverted[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.polite.introverted[1]`: …社長、私たちのメンバーのこと、お気にかけていただけますでしょうか。

### leaderDemand.DEMAND_ABSTRACT.polite.carefree[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.polite.carefree[1]`: 社長、私たちの子のこと、よろしければ思い出してあげてくださいね〜。

### leaderDemand.DEMAND_ABSTRACT.polite.earnest[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.polite.earnest[1]`: 社長、お忙しいところ恐縮ですが、私たちのメンバーのこと、お気遣いいただけませんでしょうか。

### leaderDemand.DEMAND_ABSTRACT.polite.emotional[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.polite.emotional[1]`: 社長、お願いします。私たちのメンバーのこと、どうか大事にしてあげてください。

### leaderDemand.DEMAND_ABSTRACT.polite.shy[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.polite.shy[1]`: …社長、あの…私たちのメンバーのこと、気にかけていただけると…嬉しいです。

### leaderDemand.DEMAND_ABSTRACT.seductive.bold[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.seductive.bold[1]`: 社長、私たちのこと、もう少し気にかけて。寂しくなっちゃうから。

### leaderDemand.DEMAND_ABSTRACT.seductive.introverted[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.seductive.introverted[1]`: …社長、私たちのこと…たまには思い出してくれる?

### leaderDemand.DEMAND_ABSTRACT.seductive.carefree[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.seductive.carefree[1]`: 社長〜、私たちの子のこと、ちゃんと可愛がってあげないとダメですよ?

### leaderDemand.DEMAND_ABSTRACT.seductive.earnest[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.seductive.earnest[1]`: 社長、私たちのメンバーのこと、もう少しだけ目を向けてくださいませんか。

### leaderDemand.DEMAND_ABSTRACT.seductive.emotional[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.seductive.emotional[1]`: 社長、お願い、私たちの子たちを置き去りにしないで。

### leaderDemand.DEMAND_ABSTRACT.seductive.shy[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.seductive.shy[1]`: …社長、私たちのこと…忘れてないですか?

### leaderDemand.DEMAND_ABSTRACT.delinquent.bold[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.delinquent.bold[1]`: 社長、あたしらのこと、もうちょい大事にしてくんないっすか。

### leaderDemand.DEMAND_ABSTRACT.delinquent.introverted[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.delinquent.introverted[1]`: …社長、あたしらのこと、もう少し気にかけてくんないっすか。

### leaderDemand.DEMAND_ABSTRACT.delinquent.carefree[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.delinquent.carefree[1]`: 社長〜、あたしらの子のこと、たまには可愛がってやってくれません?

### leaderDemand.DEMAND_ABSTRACT.delinquent.earnest[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.delinquent.earnest[1]`: 社長、こんなこと言うのもアレですけど、あたしらのメンバー、もうちょい大事にしてくださいよ。

### leaderDemand.DEMAND_ABSTRACT.delinquent.emotional[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.delinquent.emotional[1]`: 社長、あたしらの子たち、ちゃんと面倒見てくださいよ。放っとかないでくださいよ。

### leaderDemand.DEMAND_ABSTRACT.delinquent.shy[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.delinquent.shy[1]`: …社長、その、あたしらのこと…忘れてないっすよね…?

### leaderDemand.DEMAND_ABSTRACT.cool.bold[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.cool.bold[1]`: 社長、私たちのメンバー、もう少し目を配ってください。お願いします。

### leaderDemand.DEMAND_ABSTRACT.cool.introverted[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.cool.introverted[1]`: …社長、私たちのこと、気にかけていただけますか。

### leaderDemand.DEMAND_ABSTRACT.cool.carefree[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.cool.carefree[1]`: 社長、私たちのメンバーのこと、たまに思い出してください。

### leaderDemand.DEMAND_ABSTRACT.cool.earnest[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.cool.earnest[1]`: 社長、私たちのメンバーのこと、もう少し気にかけていただきたいです。

### leaderDemand.DEMAND_ABSTRACT.cool.emotional[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.cool.emotional[1]`: 社長、私たちの子たち、放っておかないでください。

### leaderDemand.DEMAND_ABSTRACT.cool.shy[]

- `F07_LINES.leaderDemand.DEMAND_ABSTRACT.cool.shy[1]`: …社長、私たちのこと、忘れないでいてくれますか。

### leaderDemand.DEMAND_RECOGNITION.normal.bold[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.normal.bold[1]`: 社長、私の貢献、ちゃんと評価してもらえてますか。確認させてください。

### leaderDemand.DEMAND_RECOGNITION.normal.introverted[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.normal.introverted[1]`: …社長、私たちの仕事、見てもらえてますか。

### leaderDemand.DEMAND_RECOGNITION.normal.carefree[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.normal.carefree[1]`: 社長〜、私たちの頑張り、たまには褒めてくれてもいいんですよ?

### leaderDemand.DEMAND_RECOGNITION.normal.earnest[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.normal.earnest[1]`: 社長、私たちの貢献、もし届いていれば、一言いただけませんか。

### leaderDemand.DEMAND_RECOGNITION.normal.emotional[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.normal.emotional[1]`: 社長、私たちのメンバーがやってきたこと、ちゃんと見てください。

### leaderDemand.DEMAND_RECOGNITION.normal.shy[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.normal.shy[1]`: …社長、その、私たちのこと、見てくれてますか…?

### leaderDemand.DEMAND_RECOGNITION.composed.bold[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.composed.bold[1]`: 社長、私たちが積み上げてきたもの、評価の俎上に乗っていますか。

### leaderDemand.DEMAND_RECOGNITION.composed.introverted[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.composed.introverted[1]`: …社長、私たちの働き、ご覧になっていますか。

### leaderDemand.DEMAND_RECOGNITION.composed.carefree[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.composed.carefree[1]`: 社長、私たちの仕事ぶり、たまには口に出していただけると助かります。

### leaderDemand.DEMAND_RECOGNITION.composed.earnest[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.composed.earnest[1]`: 社長、私たちの貢献に、一言いただける機会をお願いしたいのですが。

### leaderDemand.DEMAND_RECOGNITION.composed.emotional[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.composed.emotional[1]`: 社長、私たちのメンバーがやってきたこと、しっかり見ていただきたい。

### leaderDemand.DEMAND_RECOGNITION.composed.shy[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.composed.shy[1]`: …社長、私たちのこと、覚えていてくださると、嬉しいです。

### leaderDemand.DEMAND_RECOGNITION.ojousama.bold[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.ojousama.bold[1]`: ねぇ社長、わたくしどもの貢献、きちんと評価していただいておりますの?

### leaderDemand.DEMAND_RECOGNITION.ojousama.introverted[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.ojousama.introverted[1]`: …社長、わたくしどものこと、見ていただけていますの?

### leaderDemand.DEMAND_RECOGNITION.ojousama.carefree[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.ojousama.carefree[1]`: 社長〜、わたくしたちの働き、たまには褒めてくださってもよろしくてよ?

### leaderDemand.DEMAND_RECOGNITION.ojousama.earnest[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.ojousama.earnest[1]`: 社長、不躾なお願いですが、わたくしどもの貢献にひとことお言葉を頂戴したく。

### leaderDemand.DEMAND_RECOGNITION.ojousama.emotional[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.ojousama.emotional[1]`: 社長、わたくしどもの努め、どうかご覧いただきたいのです。

### leaderDemand.DEMAND_RECOGNITION.ojousama.shy[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.ojousama.shy[1]`: …社長、わたくしのこと…見ていてくださいますか。

### leaderDemand.DEMAND_RECOGNITION.polite.bold[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.polite.bold[1]`: 社長、突然ですが、私たちの貢献を一度きちんと評価していただきたく存じます。

### leaderDemand.DEMAND_RECOGNITION.polite.introverted[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.polite.introverted[1]`: …社長、私たちの働き、見ていただけていますでしょうか。

### leaderDemand.DEMAND_RECOGNITION.polite.carefree[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.polite.carefree[1]`: 社長、私たちの頑張り、よろしければ一度褒めていただけませんか〜。

### leaderDemand.DEMAND_RECOGNITION.polite.earnest[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.polite.earnest[1]`: 社長、お忙しいところ恐縮ですが、私たちの貢献にお言葉をいただけませんでしょうか。

### leaderDemand.DEMAND_RECOGNITION.polite.emotional[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.polite.emotional[1]`: 社長、私たちの積み重ね、どうかちゃんと見てください。お願いします。

### leaderDemand.DEMAND_RECOGNITION.polite.shy[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.polite.shy[1]`: …社長、あの…私たちのこと、見ていてくださると…うれしいです。

### leaderDemand.DEMAND_RECOGNITION.seductive.bold[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.seductive.bold[1]`: 社長、私の貢献、ちゃんと見てくれてる? 確かめさせて。

### leaderDemand.DEMAND_RECOGNITION.seductive.introverted[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.seductive.introverted[1]`: …社長、私のこと、見ていてくれてる?

### leaderDemand.DEMAND_RECOGNITION.seductive.carefree[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.seductive.carefree[1]`: 社長〜、私のこと、たまには褒めてくれないと拗ねちゃいますよ?

### leaderDemand.DEMAND_RECOGNITION.seductive.earnest[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.seductive.earnest[1]`: 社長、私の仕事、届いてるなら一言ください。それで救われる子もいるんです。

### leaderDemand.DEMAND_RECOGNITION.seductive.emotional[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.seductive.emotional[1]`: 社長、私たちが何をしてきたか、ちゃんと見てくれないと寂しいじゃない。

### leaderDemand.DEMAND_RECOGNITION.seductive.shy[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.seductive.shy[1]`: …社長、私のこと…ちゃんと、見てくださってる?

### leaderDemand.DEMAND_RECOGNITION.delinquent.bold[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.delinquent.bold[1]`: 社長、あたしらの働き、ちゃんと数えてんですか。はっきり言ってもらえます?

### leaderDemand.DEMAND_RECOGNITION.delinquent.introverted[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.delinquent.introverted[1]`: …社長、あたしらのこと、見てんすか。

### leaderDemand.DEMAND_RECOGNITION.delinquent.carefree[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.delinquent.carefree[1]`: 社長〜、あたしらの頑張り、たまには口に出してくれませんかね〜?

### leaderDemand.DEMAND_RECOGNITION.delinquent.earnest[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.delinquent.earnest[1]`: 社長、こんなこと言うのもアレですけど、あたしらの貢献、ちゃんと見ててくださいよ。

### leaderDemand.DEMAND_RECOGNITION.delinquent.emotional[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.delinquent.emotional[1]`: 社長、あたしらが何やってきたか、ちゃんと見ろっつってんですよ。

### leaderDemand.DEMAND_RECOGNITION.delinquent.shy[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.delinquent.shy[1]`: …社長、その、あたしらのこと…見ててくれてんすよね…?

### leaderDemand.DEMAND_RECOGNITION.cool.bold[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.cool.bold[1]`: 社長、私の貢献、評価の対象に入っていますか。確認したい。

### leaderDemand.DEMAND_RECOGNITION.cool.introverted[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.cool.introverted[1]`: …社長、私たちの仕事、見ていますか。

### leaderDemand.DEMAND_RECOGNITION.cool.carefree[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.cool.carefree[1]`: 社長、私たちの働き、一度くらい言葉にしてほしい。

### leaderDemand.DEMAND_RECOGNITION.cool.earnest[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.cool.earnest[1]`: 社長、私たちの貢献が評価の対象なら、一言いただけますか。

### leaderDemand.DEMAND_RECOGNITION.cool.emotional[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.cool.emotional[1]`: 社長、私たちがやってきたこと、見ないままにしないでください。

### leaderDemand.DEMAND_RECOGNITION.cool.shy[]

- `F07_LINES.leaderDemand.DEMAND_RECOGNITION.cool.shy[1]`: …社長、私のこと、見ていてくれていますか。

### coachReport.OBSERVE_RIVAL_HEAT[]

- `F07_LINES.coachReport.OBSERVE_RIVAL_HEAT[1]`: {leaderName}が{targetName}に当たりが強いんです。練習場でも、控室でも。
- `F07_LINES.coachReport.OBSERVE_RIVAL_HEAT[2]`: コーチから報告が。{leaderName}が{targetName}を露骨に避けてる。派閥外の選手にだけ、なんですよ。
- `F07_LINES.coachReport.OBSERVE_RIVAL_HEAT[3]`: {leaderName}の言葉、{targetName}には冷たい。気のせいじゃないと思います。

### coachReport.OBSERVE_ABSENCE[]

- `F07_LINES.coachReport.OBSERVE_ABSENCE[1]`: {leaderName}の練習出席が落ちています。{factionName}全体に伝染しかけてる。
- `F07_LINES.coachReport.OBSERVE_ABSENCE[2]`: {leaderName}、ここ二週間ほど道場に顔を出してません。下の子たちも、なんとなく雰囲気を真似してる。
- `F07_LINES.coachReport.OBSERVE_ABSENCE[3]`: コーチから報告で、{leaderName}の遅刻と早退が増えてます。理由までは聞けてない。

### coachReport.OBSERVE_INTERNAL_RANK[]

- `F07_LINES.coachReport.OBSERVE_INTERNAL_RANK[1]`: {factionName}の中で、序列の話が出ています。OVR の上下が露骨に意識されてる。
- `F07_LINES.coachReport.OBSERVE_INTERNAL_RANK[2]`: {factionName}内で、誰が二番手かって囁きが回ってます。{leaderName}の耳には、まだ入ってない。
- `F07_LINES.coachReport.OBSERVE_INTERNAL_RANK[3]`: コーチが言うには、{factionName}は実力差の話を持ち出すと空気が変わるそうです。

### coachReport.OBSERVE_FAN_PRESSURE[]

- `F07_LINES.coachReport.OBSERVE_FAN_PRESSURE[1]`: {leaderName}、最近少し疲れて見えます。客席の期待が、重くのしかかってるみたいで。
- `F07_LINES.coachReport.OBSERVE_FAN_PRESSURE[2]`: ファンレターの量が増えてから、{leaderName}の顔色が良くない。期待の重さに押されてる。
- `F07_LINES.coachReport.OBSERVE_FAN_PRESSURE[3]`: {leaderName}、入場曲がかかると一瞬肩が下がるんです。気づいた人、何人かいます。

### coachReport.OBSERVE_TRAINING_HARD[]

- `F07_LINES.coachReport.OBSERVE_TRAINING_HARD[1]`: {leaderName}が{factionName}を追い込みすぎています。怪我のリスクが高い。
- `F07_LINES.coachReport.OBSERVE_TRAINING_HARD[2]`: 練習場、{factionName}だけ終わらない。{leaderName}が頷くまで誰も上がれない雰囲気で。
- `F07_LINES.coachReport.OBSERVE_TRAINING_HARD[3]`: コーチが心配してます。{factionName}のスパーリング、強度が一段階上がってる。

### coachReport.INCIDENT_BOUNDARY[]

- `F07_LINES.coachReport.INCIDENT_BOUNDARY[1]`: ロッカールーム、{factionName}が固まって陣取ってます。{targetName}が居場所をなくしかけてる。
- `F07_LINES.coachReport.INCIDENT_BOUNDARY[2]`: {factionName}と派閥外の間に、目に見えない壁ができてます。{targetName}が困ってました。
- `F07_LINES.coachReport.INCIDENT_BOUNDARY[3]`: {leaderName}たちのテーブル、誰も近づけない雰囲気で。{targetName}が遠巻きにしてました。

### coachReport.INCIDENT_BONDING[]

- `F07_LINES.coachReport.INCIDENT_BONDING[1]`: {factionName}だけで打ち上げに行ったみたいです。誘われなかった子、ちょっと寂しそうで。
- `F07_LINES.coachReport.INCIDENT_BONDING[2]`: {factionName}、休日に揃って出かけてるみたいです。{targetName}は声をかけてもらえなかったとか。
- `F07_LINES.coachReport.INCIDENT_BONDING[3]`: ロッカーで{factionName}が固まって笑ってる。輪の外に立ってる子の背中、見ていられないです。

### coachReport.INCIDENT_HEEL_PROVOKE[]

- `F07_LINES.coachReport.INCIDENT_HEEL_PROVOKE[1]`: {leaderName}、試合外でも観客を煽ってます。客席はざわついてました。
- `F07_LINES.coachReport.INCIDENT_HEEL_PROVOKE[2]`: 取材で{leaderName}が他団体の選手を挑発してました。記者も困惑顔で。
- `F07_LINES.coachReport.INCIDENT_HEEL_PROVOKE[3]`: バックステージで{leaderName}が客席のヤジに乗ってます。営業に少し影響が出るかも。

### resultLeader.DEMAND_MAIN.A.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.normal.bold[1]`: ありがとうございます。期待に応えます。

### resultLeader.DEMAND_MAIN.A.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.normal.introverted[1]`: …ありがとうございます。やります。

### resultLeader.DEMAND_MAIN.A.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.normal.carefree[1]`: やった、社長ありがとう! メイン張りますね!

### resultLeader.DEMAND_MAIN.A.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.normal.earnest[1]`: 本当にありがとうございます。必ず応えます。

### resultLeader.DEMAND_MAIN.A.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.normal.emotional[1]`: 社長…ありがとうございます。応えてみせます。

### resultLeader.DEMAND_MAIN.A.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.normal.shy[1]`: …はい、ありがとうございます。

### resultLeader.DEMAND_MAIN.A.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.composed.bold[1]`: ありがたく頂戴します。期待は超えてみせます。

### resultLeader.DEMAND_MAIN.A.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.composed.introverted[1]`: …ありがとうございます。やらせていただきます。

### resultLeader.DEMAND_MAIN.A.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.composed.carefree[1]`: 社長、ありがとうございます。任されたからにはやりますよ。

### resultLeader.DEMAND_MAIN.A.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.composed.earnest[1]`: ありがとうございます。お預かりした以上、形にしてお返しします。

### resultLeader.DEMAND_MAIN.A.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.composed.emotional[1]`: 社長、ありがとうございます。引き受けた重さ、噛み締めます。

### resultLeader.DEMAND_MAIN.A.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.composed.shy[1]`: …社長、ありがとうございます。…精一杯、やります。

### resultLeader.DEMAND_MAIN.A.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.ojousama.bold[1]`: まあ、社長ありがとうございますわ。期待に応えてみせますわよ。

### resultLeader.DEMAND_MAIN.A.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.ojousama.introverted[1]`: …ありがとうございますわ。…精一杯、努めます。

### resultLeader.DEMAND_MAIN.A.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.ojousama.carefree[1]`: まあ嬉しい、社長ありがとう! 華やかなメインにいたしますわ。

### resultLeader.DEMAND_MAIN.A.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.ojousama.earnest[1]`: 社長、誠にありがとうございます。粗相のないよう務めますわ。

### resultLeader.DEMAND_MAIN.A.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.ojousama.emotional[1]`: 社長…わたくし、嬉しゅうございます。必ずや応えてみせますわ。

### resultLeader.DEMAND_MAIN.A.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.ojousama.shy[1]`: …ありがとうございますわ。…がんばりますわ。

### resultLeader.DEMAND_MAIN.A.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.polite.bold[1]`: ありがとうございます。お任せいただいた以上、結果で示します。

### resultLeader.DEMAND_MAIN.A.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.polite.introverted[1]`: …ありがとうございます。誠心誠意、努めさせていただきます。

### resultLeader.DEMAND_MAIN.A.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.polite.carefree[1]`: わ、社長ありがとうございます〜。期待に応えますね!

### resultLeader.DEMAND_MAIN.A.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.polite.earnest[1]`: 社長、本当にありがとうございます。お預かりしたメイン、最後まで責任持って務めます。

### resultLeader.DEMAND_MAIN.A.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.polite.emotional[1]`: 社長、ありがとうございます…お言葉に応えられるよう、全力を尽くします。

### resultLeader.DEMAND_MAIN.A.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.polite.shy[1]`: …あの、ありがとうございます。…精一杯、がんばります。

### resultLeader.DEMAND_MAIN.A.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.seductive.bold[1]`: ありがとう、社長。期待してて、ちゃんと魅せるから。

### resultLeader.DEMAND_MAIN.A.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.seductive.introverted[1]`: …ありがとうございます。…ちゃんと応えますね。

### resultLeader.DEMAND_MAIN.A.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.seductive.carefree[1]`: やった〜、社長ありがとう! 楽しいメインにしますね。

### resultLeader.DEMAND_MAIN.A.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.seductive.earnest[1]`: 社長、ありがとうございます。預かった以上、手は抜きません。

### resultLeader.DEMAND_MAIN.A.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.seductive.emotional[1]`: 社長…ありがとう。胸が熱いの、忘れないから。

### resultLeader.DEMAND_MAIN.A.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.seductive.shy[1]`: …ありがとうございます。…ちゃんと、応えますね。

### resultLeader.DEMAND_MAIN.A.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.delinquent.bold[1]`: ありがとうございます。客、ぶち上げてみせますよ。

### resultLeader.DEMAND_MAIN.A.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.delinquent.introverted[1]`: …ありがとうございます。…やらせてもらいます。

### resultLeader.DEMAND_MAIN.A.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.delinquent.carefree[1]`: マジですか? 社長ありがとう! 暴れさせてもらいますね〜!

### resultLeader.DEMAND_MAIN.A.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.delinquent.earnest[1]`: 社長、ありがとうございます。あたしら、ちゃんとやります。

### resultLeader.DEMAND_MAIN.A.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.delinquent.emotional[1]`: 社長、ありがとうございます。この熱、ちゃんと客に届けますから。

### resultLeader.DEMAND_MAIN.A.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.delinquent.shy[1]`: …社長、その…ありがとうございます。…がんばります。

### resultLeader.DEMAND_MAIN.A.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.cool.bold[1]`: ありがとうございます。結果で返します。

### resultLeader.DEMAND_MAIN.A.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.cool.introverted[1]`: …ありがとうございます。やります。

### resultLeader.DEMAND_MAIN.A.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.cool.carefree[1]`: ありがとうございます。やりますね。

### resultLeader.DEMAND_MAIN.A.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.cool.earnest[1]`: ありがとうございます。任された以上、応えます。

### resultLeader.DEMAND_MAIN.A.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.cool.emotional[1]`: 社長、ありがとうございます。…胸に留めておきます。

### resultLeader.DEMAND_MAIN.A.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.A.cool.shy[1]`: …ありがとうございます。…がんばります。

### resultLeader.DEMAND_MAIN.B.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.normal.bold[1]`: …そうですか。わかりました。

### resultLeader.DEMAND_MAIN.B.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.normal.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_MAIN.B.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.normal.carefree[1]`: えぇ〜、まあ、わかりましたけど〜。

### resultLeader.DEMAND_MAIN.B.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.normal.earnest[1]`: …はい、承知しました。

### resultLeader.DEMAND_MAIN.B.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.normal.emotional[1]`: …そうですか。次の機会に、また。

### resultLeader.DEMAND_MAIN.B.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.normal.shy[1]`: …はい…わかりました。

### resultLeader.DEMAND_MAIN.B.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.composed.bold[1]`: …承知しました。次の機会を待ちます。

### resultLeader.DEMAND_MAIN.B.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.composed.introverted[1]`: …はい、わかりました。出直します。

### resultLeader.DEMAND_MAIN.B.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.composed.carefree[1]`: まあ、こういうこともありますね。次に期待します〜。

### resultLeader.DEMAND_MAIN.B.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.composed.earnest[1]`: …承知しました。次回、改めてお願いします。

### resultLeader.DEMAND_MAIN.B.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.composed.emotional[1]`: …そうですか。…次は、必ず。

### resultLeader.DEMAND_MAIN.B.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.composed.shy[1]`: …はい…承知しました。

### resultLeader.DEMAND_MAIN.B.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.ojousama.bold[1]`: …そうですの。わかりましたわ。

### resultLeader.DEMAND_MAIN.B.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.ojousama.introverted[1]`: …そうですわ。…承知いたしました。

### resultLeader.DEMAND_MAIN.B.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.ojousama.carefree[1]`: まあ、つれないですこと。次は期待してますわ〜。

### resultLeader.DEMAND_MAIN.B.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.ojousama.earnest[1]`: …承知いたしましたわ。失礼いたしました。

### resultLeader.DEMAND_MAIN.B.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.ojousama.emotional[1]`: …そうですの。…次の機会に、いたしますわ。

### resultLeader.DEMAND_MAIN.B.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.ojousama.shy[1]`: …はい…承知いたしましたわ。

### resultLeader.DEMAND_MAIN.B.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.polite.bold[1]`: …承知しました。失礼いたしました。

### resultLeader.DEMAND_MAIN.B.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.polite.introverted[1]`: …はい、承知いたしました。

### resultLeader.DEMAND_MAIN.B.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.polite.carefree[1]`: えぇ〜、そうですか〜。まあ仕方ないですね。

### resultLeader.DEMAND_MAIN.B.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.polite.earnest[1]`: …承知しました。出過ぎたことを申しました。失礼いたしました。

### resultLeader.DEMAND_MAIN.B.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.polite.emotional[1]`: …そう、ですか。…承知いたしました。

### resultLeader.DEMAND_MAIN.B.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.polite.shy[1]`: …はい…承知しました。失礼いたしました。

### resultLeader.DEMAND_MAIN.B.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.seductive.bold[1]`: …そう。じゃあ、覚えておくね。

### resultLeader.DEMAND_MAIN.B.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.seductive.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_MAIN.B.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.seductive.carefree[1]`: えぇ〜、つれない。まあいいですけど〜。

### resultLeader.DEMAND_MAIN.B.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.seductive.earnest[1]`: …承知しました。図々しいことを言いました。

### resultLeader.DEMAND_MAIN.B.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.seductive.emotional[1]`: …そうですか。…ちょっと、寂しいな。

### resultLeader.DEMAND_MAIN.B.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.seductive.shy[1]`: …はい…わかりました。

### resultLeader.DEMAND_MAIN.B.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.delinquent.bold[1]`: …っす。わかりました。

### resultLeader.DEMAND_MAIN.B.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.delinquent.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_MAIN.B.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.delinquent.carefree[1]`: えぇ〜、つれないっすね〜。まあいいっすけど。

### resultLeader.DEMAND_MAIN.B.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.delinquent.earnest[1]`: …っす、承知っす。すんません、出過ぎました。

### resultLeader.DEMAND_MAIN.B.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.delinquent.emotional[1]`: …っ、そうっすか。…次は、わかんないですよ。

### resultLeader.DEMAND_MAIN.B.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.delinquent.shy[1]`: …っす…わかりました。

### resultLeader.DEMAND_MAIN.B.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.cool.bold[1]`: …承知。次に回します。

### resultLeader.DEMAND_MAIN.B.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.cool.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_MAIN.B.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.cool.carefree[1]`: わかりました。仕方ない。

### resultLeader.DEMAND_MAIN.B.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.cool.earnest[1]`: …承知しました。失礼しました。

### resultLeader.DEMAND_MAIN.B.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.cool.emotional[1]`: …そうですか。…わかりました。

### resultLeader.DEMAND_MAIN.B.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.B.cool.shy[1]`: …はい…わかりました。

### resultLeader.DEMAND_MAIN.C.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.normal.bold[1]`: …そういうことですか。心遣いはありがたく。

### resultLeader.DEMAND_MAIN.C.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.normal.introverted[1]`: …そうですね。ありがとうございます。

### resultLeader.DEMAND_MAIN.C.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.normal.carefree[1]`: ふぅん、そっちですか〜。まあいいですけど。

### resultLeader.DEMAND_MAIN.C.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.normal.earnest[1]`: …ありがとうございます。気にかけてくださって。

### resultLeader.DEMAND_MAIN.C.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.normal.emotional[1]`: …そうですね。社長の判断、信じます。

### resultLeader.DEMAND_MAIN.C.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.normal.shy[1]`: …はい、ありがとうございます。

### resultLeader.DEMAND_MAIN.C.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.composed.bold[1]`: …なるほど、そういう形ですか。お預かりします。

### resultLeader.DEMAND_MAIN.C.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.composed.introverted[1]`: …ありがとうございます。…そっちで考えてくださったんですね。

### resultLeader.DEMAND_MAIN.C.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.composed.carefree[1]`: ふむ、まあそういう手もありますね〜。ありがとうございます。

### resultLeader.DEMAND_MAIN.C.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.composed.earnest[1]`: …ありがとうございます。お気持ち、しっかり受け取ります。

### resultLeader.DEMAND_MAIN.C.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.composed.emotional[1]`: …社長…そういう形でしたか。…ありがたいです。

### resultLeader.DEMAND_MAIN.C.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.composed.shy[1]`: …はい…ありがとうございます。

### resultLeader.DEMAND_MAIN.C.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.ojousama.bold[1]`: …まあ、そういうご配慮ですのね。ありがたく頂戴いたしますわ。

### resultLeader.DEMAND_MAIN.C.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.ojousama.introverted[1]`: …ありがとうございますわ。…お心遣い、嬉しゅうございます。

### resultLeader.DEMAND_MAIN.C.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.ojousama.carefree[1]`: あら、そういう形ですの? まあ、ありがとうございますわ〜。

### resultLeader.DEMAND_MAIN.C.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.ojousama.earnest[1]`: …社長、ご配慮痛み入りますわ。

### resultLeader.DEMAND_MAIN.C.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.ojousama.emotional[1]`: …社長、そのお心遣い…胸に染みますわ。

### resultLeader.DEMAND_MAIN.C.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.ojousama.shy[1]`: …ありがとうございますわ。…嬉しゅう、ございます。

### resultLeader.DEMAND_MAIN.C.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.polite.bold[1]`: …なるほど、そういう形ですか。ありがたく承ります。

### resultLeader.DEMAND_MAIN.C.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.polite.introverted[1]`: …ありがとうございます。…そっちで考えてくださったんですね。

### resultLeader.DEMAND_MAIN.C.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.polite.carefree[1]`: ふぅん、別の手ですか〜。ありがとうございます〜。

### resultLeader.DEMAND_MAIN.C.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.polite.earnest[1]`: …ご配慮、ありがとうございます。お気持ち、しっかり受け取ります。

### resultLeader.DEMAND_MAIN.C.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.polite.emotional[1]`: …社長、そういう答え方、ですか。…ありがとうございます。

### resultLeader.DEMAND_MAIN.C.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.polite.shy[1]`: …あの、ありがとうございます。

### resultLeader.DEMAND_MAIN.C.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.seductive.bold[1]`: …そう。それも悪くないかもね。ありがとう。

### resultLeader.DEMAND_MAIN.C.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.seductive.introverted[1]`: …ありがとうございます。…そっちで気にかけてくれるんですね。

### resultLeader.DEMAND_MAIN.C.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.seductive.carefree[1]`: あら、そっちの形? まあ、ありがとうございます〜。

### resultLeader.DEMAND_MAIN.C.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.seductive.earnest[1]`: …社長、お気遣いありがとうございます。

### resultLeader.DEMAND_MAIN.C.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.seductive.emotional[1]`: …社長…そういう形ですか。…ありがとう。

### resultLeader.DEMAND_MAIN.C.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_MAIN.C.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.delinquent.bold[1]`: …っす。まあ、そういう形ならありがたく。

### resultLeader.DEMAND_MAIN.C.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.delinquent.introverted[1]`: …っす。ありがとうございます。

### resultLeader.DEMAND_MAIN.C.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.delinquent.carefree[1]`: へぇ、そっちっすか? まあ、ありがたいっすけど〜。

### resultLeader.DEMAND_MAIN.C.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.delinquent.earnest[1]`: …社長、配慮ありがとうございます。

### resultLeader.DEMAND_MAIN.C.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.delinquent.emotional[1]`: …っ、そういう形っすか。…ありがたいっす。

### resultLeader.DEMAND_MAIN.C.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.DEMAND_MAIN.C.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.cool.bold[1]`: …承知。そういう形でも構いません。ありがとうございます。

### resultLeader.DEMAND_MAIN.C.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.cool.introverted[1]`: …ありがとうございます。受け取ります。

### resultLeader.DEMAND_MAIN.C.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.DEMAND_MAIN.C.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.DEMAND_MAIN.C.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.cool.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.DEMAND_MAIN.C.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_MAIN.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.DEMAND_MONEY.A.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.normal.bold[1]`: 助かります。みんなにも、ちゃんと伝えます。

### resultLeader.DEMAND_MONEY.A.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.normal.introverted[1]`: …ありがとうございます。みんな、喜びます。

### resultLeader.DEMAND_MONEY.A.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.normal.carefree[1]`: えっ、ホントに上げてくれるんですか? やった〜! みんなに自慢しちゃう。

### resultLeader.DEMAND_MONEY.A.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.normal.earnest[1]`: …社長、本当にありがとうございます。応えなければ、と気が引き締まります。

### resultLeader.DEMAND_MONEY.A.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.normal.emotional[1]`: ありがとうございます。社長…これ、忘れません。

### resultLeader.DEMAND_MONEY.A.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.normal.shy[1]`: …あの…ありがとう、ございます。みんなに、伝えます。

### resultLeader.DEMAND_MONEY.A.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.composed.bold[1]`: 社長、ありがとうございます。気持ちが引き締まります。

### resultLeader.DEMAND_MONEY.A.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.composed.introverted[1]`: …ありがとうございます。みんな、安心します。

### resultLeader.DEMAND_MONEY.A.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.composed.carefree[1]`: ありがとうございます〜。これでみんなも一息つけますね。

### resultLeader.DEMAND_MONEY.A.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.composed.earnest[1]`: 社長、本当にありがとうございます。みんなを代表して、お礼を申し上げます。

### resultLeader.DEMAND_MONEY.A.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.composed.emotional[1]`: 社長…この決断、忘れません。ありがとうございます。

### resultLeader.DEMAND_MONEY.A.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.composed.shy[1]`: …ありがとうございます。…みんなに、伝えますね。

### resultLeader.DEMAND_MONEY.A.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.ojousama.bold[1]`: まあ社長、ありがとうございますわ。みんなに伝えますわね。

### resultLeader.DEMAND_MONEY.A.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.ojousama.introverted[1]`: …ありがとうございますわ。…みんな、喜びますわ。

### resultLeader.DEMAND_MONEY.A.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.ojousama.carefree[1]`: まあ嬉しい! 社長ありがとうございますわ〜。

### resultLeader.DEMAND_MONEY.A.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.ojousama.earnest[1]`: 社長、誠にありがとうございますわ。皆を代表してお礼申し上げますわ。

### resultLeader.DEMAND_MONEY.A.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.ojousama.emotional[1]`: 社長…なんと申し上げてよいやら。ありがとうございますわ。

### resultLeader.DEMAND_MONEY.A.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.ojousama.shy[1]`: …ありがとうございますわ。…胸に、しまっておきますわ。

### resultLeader.DEMAND_MONEY.A.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.polite.bold[1]`: 社長、ありがとうございます。お言葉以上の働きでお返しします。

### resultLeader.DEMAND_MONEY.A.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.polite.introverted[1]`: …ありがとうございます。皆にも、ちゃんと伝えさせていただきます。

### resultLeader.DEMAND_MONEY.A.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.polite.carefree[1]`: わ、社長ありがとうございます〜! みんな喜びます!

### resultLeader.DEMAND_MONEY.A.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.polite.earnest[1]`: 社長、本当にありがとうございます。皆を代表してお礼申し上げます。

### resultLeader.DEMAND_MONEY.A.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.polite.emotional[1]`: 社長、ありがとうございます…この恩、必ずお返しします。

### resultLeader.DEMAND_MONEY.A.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.polite.shy[1]`: …あの、ありがとう、ございます。…みんなに、伝えます。

### resultLeader.DEMAND_MONEY.A.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.seductive.bold[1]`: ありがとう社長、嬉しい。みんなにも伝えるね。

### resultLeader.DEMAND_MONEY.A.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.seductive.introverted[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_MONEY.A.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.seductive.carefree[1]`: えっホントに〜? 社長ありがとう! みんなに自慢しちゃう。

### resultLeader.DEMAND_MONEY.A.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.seductive.earnest[1]`: 社長、ありがとうございます。きちんと結果でお返しします。

### resultLeader.DEMAND_MONEY.A.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.seductive.emotional[1]`: 社長…ありがとう。この嬉しさ、忘れない。

### resultLeader.DEMAND_MONEY.A.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.seductive.shy[1]`: …ありがとうございます。…みんなに、伝えますね。

### resultLeader.DEMAND_MONEY.A.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.delinquent.bold[1]`: マジっすか、社長ありがとうございます! みんな喜びますよ。

### resultLeader.DEMAND_MONEY.A.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.delinquent.introverted[1]`: …ありがとうございます。…助かります。

### resultLeader.DEMAND_MONEY.A.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.delinquent.carefree[1]`: マジで上げてくれんすか?! 社長太っ腹〜! みんなにも言っときます!

### resultLeader.DEMAND_MONEY.A.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.delinquent.earnest[1]`: 社長、ありがとうございます。あたしら、ちゃんとやります。

### resultLeader.DEMAND_MONEY.A.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.delinquent.emotional[1]`: 社長…ありがとうございます。この恩、忘れないっすから。

### resultLeader.DEMAND_MONEY.A.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.delinquent.shy[1]`: …っす…ありがとうございます。…みんなに、伝えます。

### resultLeader.DEMAND_MONEY.A.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.cool.bold[1]`: ありがとうございます。みんなにも伝えます。

### resultLeader.DEMAND_MONEY.A.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.cool.introverted[1]`: …ありがとうございます。

### resultLeader.DEMAND_MONEY.A.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.cool.carefree[1]`: ありがとうございます。みんな喜びます。

### resultLeader.DEMAND_MONEY.A.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.cool.earnest[1]`: 社長、ありがとうございます。応えていきます。

### resultLeader.DEMAND_MONEY.A.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.cool.emotional[1]`: 社長、ありがとうございます。…忘れません。

### resultLeader.DEMAND_MONEY.A.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.A.cool.shy[1]`: …ありがとうございます。

### resultLeader.DEMAND_MONEY.B.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.normal.bold[1]`: …そうですか。次の機会に、また話します。

### resultLeader.DEMAND_MONEY.B.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.normal.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_MONEY.B.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.normal.carefree[1]`: えぇ〜、まあ仕方ないですよね〜。次に期待してます〜。

### resultLeader.DEMAND_MONEY.B.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.normal.earnest[1]`: …承知しました。図々しいお願いだったかもしれません、すみませんでした。

### resultLeader.DEMAND_MONEY.B.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.normal.emotional[1]`: …そうですか。…わかりました。

### resultLeader.DEMAND_MONEY.B.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.normal.shy[1]`: …はい…そう、ですよね。

### resultLeader.DEMAND_MONEY.B.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.composed.bold[1]`: …承知しました。次の機会に、また話します。

### resultLeader.DEMAND_MONEY.B.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.composed.introverted[1]`: …はい、わかりました。出直します。

### resultLeader.DEMAND_MONEY.B.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.composed.carefree[1]`: まあ、こういうご時世ですからね〜。承知しました。

### resultLeader.DEMAND_MONEY.B.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.composed.earnest[1]`: …承知しました。お時間を取らせてしまい、すみませんでした。

### resultLeader.DEMAND_MONEY.B.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.composed.emotional[1]`: …そうですか。…次に、また。

### resultLeader.DEMAND_MONEY.B.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.composed.shy[1]`: …はい…承知しました。

### resultLeader.DEMAND_MONEY.B.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.ojousama.bold[1]`: …そうですの。承知いたしましたわ。

### resultLeader.DEMAND_MONEY.B.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.ojousama.introverted[1]`: …そうですわ。…承知いたしました。

### resultLeader.DEMAND_MONEY.B.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.ojousama.carefree[1]`: あら、そうですの。まあ仕方ありませんわ〜。

### resultLeader.DEMAND_MONEY.B.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.ojousama.earnest[1]`: …承知いたしましたわ。お聞き苦しいことを申しました。

### resultLeader.DEMAND_MONEY.B.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.ojousama.emotional[1]`: …そうですの。…承知いたしましたわ。

### resultLeader.DEMAND_MONEY.B.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.ojousama.shy[1]`: …はい…承知いたしましたわ。

### resultLeader.DEMAND_MONEY.B.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.polite.bold[1]`: …承知しました。失礼いたしました。

### resultLeader.DEMAND_MONEY.B.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.polite.introverted[1]`: …はい、承知いたしました。

### resultLeader.DEMAND_MONEY.B.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.polite.carefree[1]`: えぇ〜、そうですか〜。承知しました。

### resultLeader.DEMAND_MONEY.B.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.polite.earnest[1]`: …承知しました。図々しいお願いをしてしまい、申し訳ありません。

### resultLeader.DEMAND_MONEY.B.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.polite.emotional[1]`: …そう、ですか。…承知いたしました。

### resultLeader.DEMAND_MONEY.B.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.polite.shy[1]`: …はい…承知しました。失礼いたしました。

### resultLeader.DEMAND_MONEY.B.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.seductive.bold[1]`: …そう。わかった、また話そうね。

### resultLeader.DEMAND_MONEY.B.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.seductive.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_MONEY.B.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.seductive.carefree[1]`: えぇ〜、つれない〜。まあ次に期待してます。

### resultLeader.DEMAND_MONEY.B.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.seductive.earnest[1]`: …承知しました。お金の話、出してすみません。

### resultLeader.DEMAND_MONEY.B.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.seductive.emotional[1]`: …そう、ですか。…ちょっと、寂しいけど。

### resultLeader.DEMAND_MONEY.B.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.seductive.shy[1]`: …はい…わかりました。

### resultLeader.DEMAND_MONEY.B.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.delinquent.bold[1]`: …っす。わかりました。

### resultLeader.DEMAND_MONEY.B.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.delinquent.introverted[1]`: …っす。わかりました。

### resultLeader.DEMAND_MONEY.B.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.delinquent.carefree[1]`: えぇ〜、ケチっすね〜。まあ次に期待してますんで〜。

### resultLeader.DEMAND_MONEY.B.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.delinquent.earnest[1]`: …っす、承知しました。すんません、図々しかったっす。

### resultLeader.DEMAND_MONEY.B.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.delinquent.emotional[1]`: …っ、そうっすか。…まあ、わかりました。

### resultLeader.DEMAND_MONEY.B.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.delinquent.shy[1]`: …っす…そうっすよね。

### resultLeader.DEMAND_MONEY.B.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.cool.bold[1]`: …承知。次に回します。

### resultLeader.DEMAND_MONEY.B.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.cool.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_MONEY.B.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.cool.carefree[1]`: わかりました。仕方ないですね。

### resultLeader.DEMAND_MONEY.B.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.cool.earnest[1]`: …承知しました。失礼しました。

### resultLeader.DEMAND_MONEY.B.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.cool.emotional[1]`: …そうですか。…わかりました。

### resultLeader.DEMAND_MONEY.B.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.B.cool.shy[1]`: …はい…わかりました。

### resultLeader.DEMAND_MONEY.C.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.normal.bold[1]`: …ご配慮、ありがとうございます。お金の話、しちゃってすみません。

### resultLeader.DEMAND_MONEY.C.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.normal.introverted[1]`: …ありがとうございます。…そっちで気にかけてくださって、嬉しいです。

### resultLeader.DEMAND_MONEY.C.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.normal.carefree[1]`: あれ、お金の話そらされた? でもまあ、ありがとうございます〜。

### resultLeader.DEMAND_MONEY.C.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.normal.earnest[1]`: …ありがとうございます。お金じゃない部分で、気にかけていただけるなんて。

### resultLeader.DEMAND_MONEY.C.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.normal.emotional[1]`: …社長…そういう形ですか。…わかりました、ありがたいです。

### resultLeader.DEMAND_MONEY.C.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.normal.shy[1]`: …あの、ありがとう…ございます。

### resultLeader.DEMAND_MONEY.C.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.composed.bold[1]`: …なるほど、そういうご配慮ですか。ありがたく頂戴します。

### resultLeader.DEMAND_MONEY.C.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.composed.introverted[1]`: …ありがとうございます。…そっちで考えてくださったんですね。

### resultLeader.DEMAND_MONEY.C.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.composed.carefree[1]`: ふむ、お金じゃないんですね〜。まあ、ありがたいですよ。

### resultLeader.DEMAND_MONEY.C.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.composed.earnest[1]`: …社長、ご配慮ありがとうございます。気持ち、しっかり受け取ります。

### resultLeader.DEMAND_MONEY.C.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.composed.emotional[1]`: …社長…そういう形ですか。…ありがたいです。

### resultLeader.DEMAND_MONEY.C.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.composed.shy[1]`: …ありがとうございます。…嬉しいです。

### resultLeader.DEMAND_MONEY.C.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.ojousama.bold[1]`: …まあ、そういうお心遣いですのね。ありがたく頂戴いたしますわ。

### resultLeader.DEMAND_MONEY.C.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.ojousama.introverted[1]`: …ありがとうございますわ。…お気持ち、嬉しゅうございます。

### resultLeader.DEMAND_MONEY.C.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.ojousama.carefree[1]`: あら、お金じゃない形ですの? まあ、それも素敵ですわね。

### resultLeader.DEMAND_MONEY.C.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.ojousama.earnest[1]`: …社長、ご配慮痛み入りますわ。

### resultLeader.DEMAND_MONEY.C.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.ojousama.emotional[1]`: …社長、そのお心遣い…ありがたく、頂戴いたしますわ。

### resultLeader.DEMAND_MONEY.C.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.ojousama.shy[1]`: …ありがとうございますわ。…嬉しゅう、ございます。

### resultLeader.DEMAND_MONEY.C.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.polite.bold[1]`: …なるほど、そういう形ですか。ありがたく頂戴します。

### resultLeader.DEMAND_MONEY.C.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.polite.introverted[1]`: …ありがとうございます。…お気持ち、嬉しいです。

### resultLeader.DEMAND_MONEY.C.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.polite.carefree[1]`: ふぅん、別の形ですか〜。ありがとうございます〜。

### resultLeader.DEMAND_MONEY.C.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.polite.earnest[1]`: …ご配慮、ありがとうございます。お金以外で気にかけていただけるなんて、ありがたいです。

### resultLeader.DEMAND_MONEY.C.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.polite.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.DEMAND_MONEY.C.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.polite.shy[1]`: …あの、ありがとうございます。…嬉しいです。

### resultLeader.DEMAND_MONEY.C.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.seductive.bold[1]`: …ふぅん、お金じゃないんだ。まあ、それも嬉しいよ。

### resultLeader.DEMAND_MONEY.C.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.seductive.introverted[1]`: …ありがとうございます。…そっちで気にかけてくれるんですね。

### resultLeader.DEMAND_MONEY.C.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.seductive.carefree[1]`: あら、お金の話そらされた〜。でもまあ、ありがと社長。

### resultLeader.DEMAND_MONEY.C.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.seductive.earnest[1]`: …ご配慮、ありがとうございます。お気持ち、受け取ります。

### resultLeader.DEMAND_MONEY.C.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.seductive.emotional[1]`: …社長…そういう形ですか。…嬉しいです。

### resultLeader.DEMAND_MONEY.C.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_MONEY.C.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.delinquent.bold[1]`: …っす。お金じゃないけど、まあありがたいっす。

### resultLeader.DEMAND_MONEY.C.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.delinquent.introverted[1]`: …っす。ありがとうございます。

### resultLeader.DEMAND_MONEY.C.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.delinquent.carefree[1]`: へぇ、お金じゃないんすか〜。まあ気持ちは嬉しいっす〜。

### resultLeader.DEMAND_MONEY.C.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.delinquent.earnest[1]`: …社長、ご配慮どうもっす。気持ちは受け取りました。

### resultLeader.DEMAND_MONEY.C.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.delinquent.emotional[1]`: …っ、そうっすか。…まあ、ありがたいっす。

### resultLeader.DEMAND_MONEY.C.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.DEMAND_MONEY.C.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.cool.bold[1]`: …承知。お気持ちは受け取ります。

### resultLeader.DEMAND_MONEY.C.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.cool.introverted[1]`: …ありがとうございます。

### resultLeader.DEMAND_MONEY.C.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.DEMAND_MONEY.C.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.DEMAND_MONEY.C.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.cool.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.DEMAND_MONEY.C.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_MONEY.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.A.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.normal.bold[1]`: …ありがとうございます。その言葉だけで、十分です。

### resultLeader.DEMAND_ABSTRACT.A.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.normal.introverted[1]`: …ありがとうございます。…見てもらえてるんだ、って、安心しました。

### resultLeader.DEMAND_ABSTRACT.A.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.normal.carefree[1]`: わ、ちゃんと聞いてくれてた! 嬉しいです、ありがとうございます〜。

### resultLeader.DEMAND_ABSTRACT.A.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.normal.earnest[1]`: ありがとうございます。私たちも、もっと社長に応えたいと思います。

### resultLeader.DEMAND_ABSTRACT.A.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.normal.emotional[1]`: ありがとうございます…社長、その一言、ずっと欲しかったです。

### resultLeader.DEMAND_ABSTRACT.A.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.normal.shy[1]`: …あの…ありがとうございます。…うれしい、です。

### resultLeader.DEMAND_ABSTRACT.A.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.composed.bold[1]`: 社長、ありがとうございます。その言葉、胸に留めます。

### resultLeader.DEMAND_ABSTRACT.A.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.composed.introverted[1]`: …ありがとうございます。…見ていてくださったんですね、安心しました。

### resultLeader.DEMAND_ABSTRACT.A.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.composed.carefree[1]`: ありがとうございます〜。社長にそう言ってもらえると、肩の力が抜けます。

### resultLeader.DEMAND_ABSTRACT.A.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.composed.earnest[1]`: ありがとうございます。お言葉、しっかり受け取ります。

### resultLeader.DEMAND_ABSTRACT.A.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.composed.emotional[1]`: 社長…その一言で、随分と救われます。

### resultLeader.DEMAND_ABSTRACT.A.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.composed.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_ABSTRACT.A.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.ojousama.bold[1]`: まあ社長、ありがとうございますわ。その一言で十分ですの。

### resultLeader.DEMAND_ABSTRACT.A.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.ojousama.introverted[1]`: …ありがとうございますわ。…胸が、温こうなりますの。

### resultLeader.DEMAND_ABSTRACT.A.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.ojousama.carefree[1]`: まあ嬉しい、社長ありがとうございますわ〜。

### resultLeader.DEMAND_ABSTRACT.A.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.ojousama.earnest[1]`: 社長、誠にありがとうございますわ。お言葉、大切にいたします。

### resultLeader.DEMAND_ABSTRACT.A.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.ojousama.emotional[1]`: 社長…そのお言葉、わたくし生涯忘れませんわ。

### resultLeader.DEMAND_ABSTRACT.A.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.ojousama.shy[1]`: …ありがとうございますわ。…嬉しゅう、ございます。

### resultLeader.DEMAND_ABSTRACT.A.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.polite.bold[1]`: 社長、ありがとうございます。お言葉、何より励みになります。

### resultLeader.DEMAND_ABSTRACT.A.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.polite.introverted[1]`: …ありがとうございます。…見ていただけていたんですね。

### resultLeader.DEMAND_ABSTRACT.A.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.polite.carefree[1]`: わ、ありがとうございます〜! 社長にそう言ってもらえると本当に嬉しいです。

### resultLeader.DEMAND_ABSTRACT.A.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.polite.earnest[1]`: 社長、本当にありがとうございます。お言葉、大切にいたします。

### resultLeader.DEMAND_ABSTRACT.A.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.polite.emotional[1]`: 社長、ありがとうございます…そのお言葉、ずっと欲しかったんです。

### resultLeader.DEMAND_ABSTRACT.A.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.polite.shy[1]`: …あの、ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_ABSTRACT.A.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.seductive.bold[1]`: ありがとう社長、嬉しい。ちゃんと届いてたんだね。

### resultLeader.DEMAND_ABSTRACT.A.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.seductive.introverted[1]`: …ありがとうございます。…見てくれてたんですね、嬉しい。

### resultLeader.DEMAND_ABSTRACT.A.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.seductive.carefree[1]`: わ、社長ちゃんと聞いてくれてた! ありがとうございます〜。

### resultLeader.DEMAND_ABSTRACT.A.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.seductive.earnest[1]`: 社長、ありがとうございます。お言葉、ちゃんと持って帰ります。

### resultLeader.DEMAND_ABSTRACT.A.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.seductive.emotional[1]`: 社長…その一言、ずっと欲しかったの。ありがとう。

### resultLeader.DEMAND_ABSTRACT.A.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_ABSTRACT.A.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.delinquent.bold[1]`: ありがとうございます社長。その一言で十分っすよ。

### resultLeader.DEMAND_ABSTRACT.A.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.delinquent.introverted[1]`: …ありがとうございます。…見ててくれたんすね。

### resultLeader.DEMAND_ABSTRACT.A.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.delinquent.carefree[1]`: マジっすか、社長ありがとう〜! 嬉しいっすね。

### resultLeader.DEMAND_ABSTRACT.A.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.delinquent.earnest[1]`: 社長、ありがとうございます。あたしら、ちゃんと応えます。

### resultLeader.DEMAND_ABSTRACT.A.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.delinquent.emotional[1]`: 社長…その一言、ずっと欲しかったっす。ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.A.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.delinquent.shy[1]`: …っす…ありがとうございます。…嬉しい、っす。

### resultLeader.DEMAND_ABSTRACT.A.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.cool.bold[1]`: ありがとうございます。その言葉、胸に留めます。

### resultLeader.DEMAND_ABSTRACT.A.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.cool.introverted[1]`: …ありがとうございます。…見ていてくれたんですね。

### resultLeader.DEMAND_ABSTRACT.A.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.cool.carefree[1]`: ありがとうございます。嬉しいです。

### resultLeader.DEMAND_ABSTRACT.A.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.cool.earnest[1]`: 社長、ありがとうございます。お言葉、忘れません。

### resultLeader.DEMAND_ABSTRACT.A.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.cool.emotional[1]`: 社長、ありがとうございます。…胸に、染みます。

### resultLeader.DEMAND_ABSTRACT.A.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.A.cool.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_ABSTRACT.B.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.normal.bold[1]`: …そうですか。失礼しました。

### resultLeader.DEMAND_ABSTRACT.B.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.normal.introverted[1]`: …はい、すみません。出過ぎたことを言いました。

### resultLeader.DEMAND_ABSTRACT.B.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.normal.carefree[1]`: あ、はーい。…まあ、社長忙しいですもんね。

### resultLeader.DEMAND_ABSTRACT.B.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.normal.earnest[1]`: …承知しました。お時間を取らせて、申し訳ありません。

### resultLeader.DEMAND_ABSTRACT.B.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.normal.emotional[1]`: …そう、ですか。…わかりました。

### resultLeader.DEMAND_ABSTRACT.B.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.normal.shy[1]`: …はい…ごめんなさい。

### resultLeader.DEMAND_ABSTRACT.B.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.composed.bold[1]`: …承知しました。出過ぎたことを申しました。

### resultLeader.DEMAND_ABSTRACT.B.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.composed.introverted[1]`: …はい、すみません。出直します。

### resultLeader.DEMAND_ABSTRACT.B.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.composed.carefree[1]`: まあ、こういうこともありますね。失礼しました〜。

### resultLeader.DEMAND_ABSTRACT.B.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.composed.earnest[1]`: …承知しました。お時間を取らせて、申し訳ありません。

### resultLeader.DEMAND_ABSTRACT.B.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.composed.emotional[1]`: …そう、ですか。…わかりました。

### resultLeader.DEMAND_ABSTRACT.B.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.composed.shy[1]`: …はい…失礼しました。

### resultLeader.DEMAND_ABSTRACT.B.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.ojousama.bold[1]`: …そうですの。失礼いたしましたわ。

### resultLeader.DEMAND_ABSTRACT.B.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.ojousama.introverted[1]`: …そうですわ。…失礼いたしましたわ。

### resultLeader.DEMAND_ABSTRACT.B.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.ojousama.carefree[1]`: あら、そうですの。お時間取らせてしまいましたわね〜。

### resultLeader.DEMAND_ABSTRACT.B.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.ojousama.earnest[1]`: …承知いたしましたわ。お聞き苦しいことを申しました。

### resultLeader.DEMAND_ABSTRACT.B.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.ojousama.emotional[1]`: …そうですの。…承知いたしましたわ。

### resultLeader.DEMAND_ABSTRACT.B.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.ojousama.shy[1]`: …はい…ごめんなさいませ。

### resultLeader.DEMAND_ABSTRACT.B.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.polite.bold[1]`: …承知しました。失礼いたしました。

### resultLeader.DEMAND_ABSTRACT.B.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.polite.introverted[1]`: …はい、申し訳ありません。出直します。

### resultLeader.DEMAND_ABSTRACT.B.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.polite.carefree[1]`: えぇ〜、そうですか〜。失礼しました〜。

### resultLeader.DEMAND_ABSTRACT.B.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.polite.earnest[1]`: …承知しました。お時間を取らせて、申し訳ありません。

### resultLeader.DEMAND_ABSTRACT.B.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.polite.emotional[1]`: …そう、ですか。…承知いたしました。

### resultLeader.DEMAND_ABSTRACT.B.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.polite.shy[1]`: …はい…ごめんなさい。

### resultLeader.DEMAND_ABSTRACT.B.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.seductive.bold[1]`: …そう。じゃあ、忘れて。

### resultLeader.DEMAND_ABSTRACT.B.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.seductive.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_ABSTRACT.B.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.seductive.carefree[1]`: えぇ〜、つれない。まあいいですけど〜。

### resultLeader.DEMAND_ABSTRACT.B.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.seductive.earnest[1]`: …承知しました。出過ぎた口きいて、すみません。

### resultLeader.DEMAND_ABSTRACT.B.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.seductive.emotional[1]`: …そう、ですか。…ちょっと、寂しい。

### resultLeader.DEMAND_ABSTRACT.B.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.seductive.shy[1]`: …はい…ごめんなさい。

### resultLeader.DEMAND_ABSTRACT.B.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.delinquent.bold[1]`: …っす。失礼しました。

### resultLeader.DEMAND_ABSTRACT.B.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.delinquent.introverted[1]`: …っす。すんません。

### resultLeader.DEMAND_ABSTRACT.B.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.delinquent.carefree[1]`: あ、はい〜。まあ社長忙しいっすもんね。

### resultLeader.DEMAND_ABSTRACT.B.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.delinquent.earnest[1]`: …っす、承知しました。すんません、出過ぎました。

### resultLeader.DEMAND_ABSTRACT.B.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.delinquent.emotional[1]`: …っ、そうっすか。…わかりました。

### resultLeader.DEMAND_ABSTRACT.B.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.delinquent.shy[1]`: …っす…ごめんなさい。

### resultLeader.DEMAND_ABSTRACT.B.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.cool.bold[1]`: …承知。失礼しました。

### resultLeader.DEMAND_ABSTRACT.B.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.cool.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_ABSTRACT.B.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.cool.carefree[1]`: わかりました。失礼しました。

### resultLeader.DEMAND_ABSTRACT.B.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.cool.earnest[1]`: …承知しました。失礼しました。

### resultLeader.DEMAND_ABSTRACT.B.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.cool.emotional[1]`: …そうですか。…わかりました。

### resultLeader.DEMAND_ABSTRACT.B.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.B.cool.shy[1]`: …はい…ごめんなさい。

### resultLeader.DEMAND_ABSTRACT.C.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.normal.bold[1]`: …そういう形ですか。心遣い、ありがたく受け取ります。

### resultLeader.DEMAND_ABSTRACT.C.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.normal.introverted[1]`: …ありがとうございます。…そっちでしたか。

### resultLeader.DEMAND_ABSTRACT.C.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.normal.carefree[1]`: ふぅん、別ルートですか〜。まあ、ありがたいですけど。

### resultLeader.DEMAND_ABSTRACT.C.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.normal.earnest[1]`: …ありがとうございます。私が言いたかったのは、まさにそういうことかもしれません。

### resultLeader.DEMAND_ABSTRACT.C.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.normal.emotional[1]`: …ああ、社長…そういう答え方、ですか。…ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.C.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.DEMAND_ABSTRACT.C.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.composed.bold[1]`: …なるほど、そういう形ですか。ありがたく受け取ります。

### resultLeader.DEMAND_ABSTRACT.C.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.composed.introverted[1]`: …ありがとうございます。…そっちで考えてくださったんですね。

### resultLeader.DEMAND_ABSTRACT.C.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.composed.carefree[1]`: ふむ、別ルートですか〜。それもまた、ありがたいです。

### resultLeader.DEMAND_ABSTRACT.C.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.composed.earnest[1]`: …社長、ご配慮ありがとうございます。お気持ち、しっかり受け取ります。

### resultLeader.DEMAND_ABSTRACT.C.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.composed.emotional[1]`: …社長…そういう形でしたか。…ありがたいです。

### resultLeader.DEMAND_ABSTRACT.C.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.composed.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_ABSTRACT.C.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.ojousama.bold[1]`: …まあ、そういうお心遣いですのね。ありがたく頂戴いたしますわ。

### resultLeader.DEMAND_ABSTRACT.C.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.ojousama.introverted[1]`: …ありがとうございますわ。…お気持ち、嬉しゅうございます。

### resultLeader.DEMAND_ABSTRACT.C.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.ojousama.carefree[1]`: あら、別の形ですの? まあ、ありがたいですわ〜。

### resultLeader.DEMAND_ABSTRACT.C.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.ojousama.earnest[1]`: …社長、ご配慮痛み入りますわ。

### resultLeader.DEMAND_ABSTRACT.C.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.ojousama.emotional[1]`: …社長、そのお心遣い…胸に染みますわ。

### resultLeader.DEMAND_ABSTRACT.C.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.ojousama.shy[1]`: …ありがとうございますわ。…嬉しゅう、ございます。

### resultLeader.DEMAND_ABSTRACT.C.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.polite.bold[1]`: …なるほど、そういう形ですか。ありがたく承ります。

### resultLeader.DEMAND_ABSTRACT.C.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.polite.introverted[1]`: …ありがとうございます。…そっちで気にかけてくださったんですね。

### resultLeader.DEMAND_ABSTRACT.C.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.polite.carefree[1]`: ふぅん、別の形ですか〜。ありがとうございます〜。

### resultLeader.DEMAND_ABSTRACT.C.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.polite.earnest[1]`: …ご配慮、ありがとうございます。お気持ち、しっかり受け取ります。

### resultLeader.DEMAND_ABSTRACT.C.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.polite.emotional[1]`: …社長、そういう答え方、ですか。…ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.C.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.polite.shy[1]`: …あの、ありがとうございます。…嬉しいです。

### resultLeader.DEMAND_ABSTRACT.C.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.seductive.bold[1]`: …そう、別ルートね。それも嬉しい、ありがとう。

### resultLeader.DEMAND_ABSTRACT.C.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.seductive.introverted[1]`: …ありがとうございます。…そっちで気にかけてくれるんですね。

### resultLeader.DEMAND_ABSTRACT.C.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.seductive.carefree[1]`: あら、別の形? まあ、ありがとうございます〜。

### resultLeader.DEMAND_ABSTRACT.C.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.seductive.earnest[1]`: …ご配慮、ありがとうございます。お気持ち、受け取ります。

### resultLeader.DEMAND_ABSTRACT.C.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.seductive.emotional[1]`: …社長…そういう形ですか。…嬉しい、です。

### resultLeader.DEMAND_ABSTRACT.C.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_ABSTRACT.C.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.delinquent.bold[1]`: …っす、そういう形なら、ありがたく頂戴します。

### resultLeader.DEMAND_ABSTRACT.C.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.delinquent.introverted[1]`: …っす。ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.C.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.delinquent.carefree[1]`: へぇ、別ルートっすか〜。まあ気持ちは受け取ります〜。

### resultLeader.DEMAND_ABSTRACT.C.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.delinquent.earnest[1]`: …社長、配慮ありがとうございます。気持ちは受け取りました。

### resultLeader.DEMAND_ABSTRACT.C.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.delinquent.emotional[1]`: …っ、そういう形っすか。…ありがたいっす。

### resultLeader.DEMAND_ABSTRACT.C.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.C.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.cool.bold[1]`: …承知。そういう形でも構いません。ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.C.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.cool.introverted[1]`: …ありがとうございます。受け取ります。

### resultLeader.DEMAND_ABSTRACT.C.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.C.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.C.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.cool.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.DEMAND_ABSTRACT.C.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_ABSTRACT.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.A.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.normal.bold[1]`: …ありがとうございます。励みになります。

### resultLeader.DEMAND_RECOGNITION.A.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.normal.introverted[1]`: …ありがとうございます。…見てもらえてたんですね。

### resultLeader.DEMAND_RECOGNITION.A.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.normal.carefree[1]`: ホント!? やった、社長に褒められちゃった〜!

### resultLeader.DEMAND_RECOGNITION.A.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.normal.earnest[1]`: 本当にありがとうございます。これからも、見ていてください。

### resultLeader.DEMAND_RECOGNITION.A.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.normal.emotional[1]`: ありがとうございます…社長、その言葉、染みます。

### resultLeader.DEMAND_RECOGNITION.A.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.normal.shy[1]`: …あの…ありがとうございます。…がんばります。

### resultLeader.DEMAND_RECOGNITION.A.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.composed.bold[1]`: ありがとうございます。その言葉、励みにします。

### resultLeader.DEMAND_RECOGNITION.A.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.composed.introverted[1]`: …ありがとうございます。…見ていてくださったんですね。

### resultLeader.DEMAND_RECOGNITION.A.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.composed.carefree[1]`: ありがとうございます〜。社長にそう言ってもらえると、嬉しいです。

### resultLeader.DEMAND_RECOGNITION.A.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.composed.earnest[1]`: ありがとうございます。お言葉、しっかり受け取ります。

### resultLeader.DEMAND_RECOGNITION.A.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.composed.emotional[1]`: 社長…その一言で、随分と救われます。

### resultLeader.DEMAND_RECOGNITION.A.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.composed.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_RECOGNITION.A.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.ojousama.bold[1]`: まあ社長、ありがとうございますわ。励みになりますの。

### resultLeader.DEMAND_RECOGNITION.A.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.ojousama.introverted[1]`: …ありがとうございますわ。…見ていてくださったのですね。

### resultLeader.DEMAND_RECOGNITION.A.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.ojousama.carefree[1]`: まあ嬉しい、社長に褒められちゃいましたわ〜!

### resultLeader.DEMAND_RECOGNITION.A.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.ojousama.earnest[1]`: 社長、誠にありがとうございますわ。お言葉、大切にいたします。

### resultLeader.DEMAND_RECOGNITION.A.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.ojousama.emotional[1]`: 社長…そのお言葉、わたくし忘れませんわ。

### resultLeader.DEMAND_RECOGNITION.A.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.ojousama.shy[1]`: …ありがとうございますわ。…嬉しゅう、ございます。

### resultLeader.DEMAND_RECOGNITION.A.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.polite.bold[1]`: 社長、ありがとうございます。お言葉、何よりの励みになります。

### resultLeader.DEMAND_RECOGNITION.A.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.polite.introverted[1]`: …ありがとうございます。…見ていただけていたんですね。

### resultLeader.DEMAND_RECOGNITION.A.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.polite.carefree[1]`: わ、ありがとうございます〜! 社長に褒めてもらえるなんて!

### resultLeader.DEMAND_RECOGNITION.A.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.polite.earnest[1]`: 社長、本当にありがとうございます。お言葉、大切にいたします。

### resultLeader.DEMAND_RECOGNITION.A.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.polite.emotional[1]`: 社長、ありがとうございます…そのお言葉、ずっと欲しかったんです。

### resultLeader.DEMAND_RECOGNITION.A.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.polite.shy[1]`: …あの、ありがとうございます。…がんばります。

### resultLeader.DEMAND_RECOGNITION.A.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.seductive.bold[1]`: ありがとう社長、嬉しい。ちゃんと見ててくれたんだね。

### resultLeader.DEMAND_RECOGNITION.A.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.seductive.introverted[1]`: …ありがとうございます。…見ていてくれたんですね。

### resultLeader.DEMAND_RECOGNITION.A.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.seductive.carefree[1]`: わ、社長に褒められちゃった〜! 嬉しいです。

### resultLeader.DEMAND_RECOGNITION.A.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.seductive.earnest[1]`: 社長、ありがとうございます。お言葉、ちゃんと持って帰ります。

### resultLeader.DEMAND_RECOGNITION.A.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.seductive.emotional[1]`: 社長…その一言、ずっと欲しかったの。ありがとう。

### resultLeader.DEMAND_RECOGNITION.A.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_RECOGNITION.A.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.delinquent.bold[1]`: 社長、ありがとうございます。励みになりますよ。

### resultLeader.DEMAND_RECOGNITION.A.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.delinquent.introverted[1]`: …ありがとうございます。…見ててくれたんすね。

### resultLeader.DEMAND_RECOGNITION.A.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.delinquent.carefree[1]`: マジっすか〜、社長に褒められちゃった〜! ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.A.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.delinquent.earnest[1]`: 社長、ありがとうございます。あたしら、もっとやりますんで。

### resultLeader.DEMAND_RECOGNITION.A.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.delinquent.emotional[1]`: 社長…その一言、ずっと欲しかったっす。ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.A.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.delinquent.shy[1]`: …っす…ありがとうございます。…がんばります。

### resultLeader.DEMAND_RECOGNITION.A.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.cool.bold[1]`: ありがとうございます。励みにします。

### resultLeader.DEMAND_RECOGNITION.A.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.cool.introverted[1]`: …ありがとうございます。…見ていてくれたんですね。

### resultLeader.DEMAND_RECOGNITION.A.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.cool.carefree[1]`: ありがとうございます。嬉しいです。

### resultLeader.DEMAND_RECOGNITION.A.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.cool.earnest[1]`: 社長、ありがとうございます。お言葉、受け取ります。

### resultLeader.DEMAND_RECOGNITION.A.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.cool.emotional[1]`: 社長、ありがとうございます。…胸に、染みます。

### resultLeader.DEMAND_RECOGNITION.A.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.A.cool.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_RECOGNITION.B.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.normal.bold[1]`: …そうですか。失礼しました。

### resultLeader.DEMAND_RECOGNITION.B.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.normal.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_RECOGNITION.B.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.normal.carefree[1]`: えぇ〜、つれないなぁ〜。まあいいですけど。

### resultLeader.DEMAND_RECOGNITION.B.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.normal.earnest[1]`: …承知しました。図々しいことを申しました。

### resultLeader.DEMAND_RECOGNITION.B.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.normal.emotional[1]`: …そう、ですか。…わかりました。

### resultLeader.DEMAND_RECOGNITION.B.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.normal.shy[1]`: …はい…ごめんなさい。

### resultLeader.DEMAND_RECOGNITION.B.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.composed.bold[1]`: …承知しました。出過ぎたことを申しました。

### resultLeader.DEMAND_RECOGNITION.B.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.composed.introverted[1]`: …はい、わかりました。出直します。

### resultLeader.DEMAND_RECOGNITION.B.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.composed.carefree[1]`: まあ、こういうこともありますね〜。

### resultLeader.DEMAND_RECOGNITION.B.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.composed.earnest[1]`: …承知しました。お時間を取らせて、申し訳ありません。

### resultLeader.DEMAND_RECOGNITION.B.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.composed.emotional[1]`: …そう、ですか。…わかりました。

### resultLeader.DEMAND_RECOGNITION.B.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.composed.shy[1]`: …はい…失礼しました。

### resultLeader.DEMAND_RECOGNITION.B.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.ojousama.bold[1]`: …そうですの。失礼いたしましたわ。

### resultLeader.DEMAND_RECOGNITION.B.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.ojousama.introverted[1]`: …そうですわ。…失礼いたしましたわ。

### resultLeader.DEMAND_RECOGNITION.B.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.ojousama.carefree[1]`: あら、つれないですこと。まあいいですわ〜。

### resultLeader.DEMAND_RECOGNITION.B.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.ojousama.earnest[1]`: …承知いたしましたわ。お聞き苦しいことを申しました。

### resultLeader.DEMAND_RECOGNITION.B.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.ojousama.emotional[1]`: …そうですの。…承知いたしましたわ。

### resultLeader.DEMAND_RECOGNITION.B.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.ojousama.shy[1]`: …はい…ごめんなさいませ。

### resultLeader.DEMAND_RECOGNITION.B.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.polite.bold[1]`: …承知しました。失礼いたしました。

### resultLeader.DEMAND_RECOGNITION.B.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.polite.introverted[1]`: …はい、申し訳ありません。

### resultLeader.DEMAND_RECOGNITION.B.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.polite.carefree[1]`: えぇ〜、そうですか〜。失礼しました〜。

### resultLeader.DEMAND_RECOGNITION.B.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.polite.earnest[1]`: …承知しました。図々しいお願いをしてしまい、申し訳ありません。

### resultLeader.DEMAND_RECOGNITION.B.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.polite.emotional[1]`: …そう、ですか。…承知いたしました。

### resultLeader.DEMAND_RECOGNITION.B.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.polite.shy[1]`: …はい…ごめんなさい。

### resultLeader.DEMAND_RECOGNITION.B.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.seductive.bold[1]`: …そう。じゃあ忘れて。

### resultLeader.DEMAND_RECOGNITION.B.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.seductive.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_RECOGNITION.B.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.seductive.carefree[1]`: えぇ〜、つれない〜。まあいいですけど〜。

### resultLeader.DEMAND_RECOGNITION.B.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.seductive.earnest[1]`: …承知しました。出過ぎたこと言いました。

### resultLeader.DEMAND_RECOGNITION.B.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.seductive.emotional[1]`: …そう、ですか。…ちょっと、寂しい。

### resultLeader.DEMAND_RECOGNITION.B.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.seductive.shy[1]`: …はい…ごめんなさい。

### resultLeader.DEMAND_RECOGNITION.B.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.delinquent.bold[1]`: …っす。失礼しました。

### resultLeader.DEMAND_RECOGNITION.B.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.delinquent.introverted[1]`: …っす。すんません。

### resultLeader.DEMAND_RECOGNITION.B.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.delinquent.carefree[1]`: えぇ〜、つれないっすね〜。まあいいっすけど〜。

### resultLeader.DEMAND_RECOGNITION.B.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.delinquent.earnest[1]`: …っす、承知しました。すんません、出過ぎました。

### resultLeader.DEMAND_RECOGNITION.B.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.delinquent.emotional[1]`: …っ、そうっすか。…わかりました。

### resultLeader.DEMAND_RECOGNITION.B.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.delinquent.shy[1]`: …っす…ごめんなさい。

### resultLeader.DEMAND_RECOGNITION.B.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.cool.bold[1]`: …承知。失礼しました。

### resultLeader.DEMAND_RECOGNITION.B.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.cool.introverted[1]`: …はい、わかりました。

### resultLeader.DEMAND_RECOGNITION.B.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.cool.carefree[1]`: わかりました。失礼しました。

### resultLeader.DEMAND_RECOGNITION.B.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.cool.earnest[1]`: …承知しました。失礼しました。

### resultLeader.DEMAND_RECOGNITION.B.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.cool.emotional[1]`: …そうですか。…わかりました。

### resultLeader.DEMAND_RECOGNITION.B.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.B.cool.shy[1]`: …はい…ごめんなさい。

### resultLeader.DEMAND_RECOGNITION.C.normal.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.normal.bold[1]`: …ご配慮ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.normal.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.normal.introverted[1]`: …ありがとうございます。…そっちで返してくださるんですね。

### resultLeader.DEMAND_RECOGNITION.C.normal.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.normal.carefree[1]`: なるほど〜、評価は別の形でってことですね。了解です〜。

### resultLeader.DEMAND_RECOGNITION.C.normal.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.normal.earnest[1]`: …ありがとうございます。形は違っても、気にかけていただけるのは嬉しいです。

### resultLeader.DEMAND_RECOGNITION.C.normal.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.normal.emotional[1]`: …社長…そういう答え方、好きです。ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.normal.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.normal.shy[1]`: …はい…ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.composed.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.composed.bold[1]`: …なるほど、そういう形ですか。ありがたく受け取ります。

### resultLeader.DEMAND_RECOGNITION.C.composed.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.composed.introverted[1]`: …ありがとうございます。…そっちで考えてくださったんですね。

### resultLeader.DEMAND_RECOGNITION.C.composed.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.composed.carefree[1]`: ふむ、別ルートですか〜。それもまた、ありがたいです。

### resultLeader.DEMAND_RECOGNITION.C.composed.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.composed.earnest[1]`: …社長、ご配慮ありがとうございます。お気持ち、しっかり受け取ります。

### resultLeader.DEMAND_RECOGNITION.C.composed.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.composed.emotional[1]`: …社長…そういう形でしたか。…ありがたいです。

### resultLeader.DEMAND_RECOGNITION.C.composed.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.composed.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_RECOGNITION.C.ojousama.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.ojousama.bold[1]`: …まあ、そういうお心遣いですのね。ありがたく頂戴いたしますわ。

### resultLeader.DEMAND_RECOGNITION.C.ojousama.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.ojousama.introverted[1]`: …ありがとうございますわ。…お気持ち、嬉しゅうございます。

### resultLeader.DEMAND_RECOGNITION.C.ojousama.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.ojousama.carefree[1]`: あら、別の形ですの? まあ、ありがたいですわ〜。

### resultLeader.DEMAND_RECOGNITION.C.ojousama.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.ojousama.earnest[1]`: …社長、ご配慮痛み入りますわ。

### resultLeader.DEMAND_RECOGNITION.C.ojousama.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.ojousama.emotional[1]`: …社長、そのお心遣い…胸に染みますわ。

### resultLeader.DEMAND_RECOGNITION.C.ojousama.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.ojousama.shy[1]`: …ありがとうございますわ。…嬉しゅう、ございます。

### resultLeader.DEMAND_RECOGNITION.C.polite.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.polite.bold[1]`: …なるほど、そういう形ですか。ありがたく承ります。

### resultLeader.DEMAND_RECOGNITION.C.polite.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.polite.introverted[1]`: …ありがとうございます。…そっちで気にかけてくださったんですね。

### resultLeader.DEMAND_RECOGNITION.C.polite.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.polite.carefree[1]`: ふぅん、別の形ですか〜。ありがとうございます〜。

### resultLeader.DEMAND_RECOGNITION.C.polite.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.polite.earnest[1]`: …ご配慮、ありがとうございます。形は違っても、お気持ちは伝わりました。

### resultLeader.DEMAND_RECOGNITION.C.polite.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.polite.emotional[1]`: …社長、そういう答え方、ですか。…ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.polite.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.polite.shy[1]`: …あの、ありがとうございます。…嬉しいです。

### resultLeader.DEMAND_RECOGNITION.C.seductive.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.seductive.bold[1]`: …そう、別の形ね。それも嬉しい、ありがとう。

### resultLeader.DEMAND_RECOGNITION.C.seductive.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.seductive.introverted[1]`: …ありがとうございます。…そっちで気にかけてくれるんですね。

### resultLeader.DEMAND_RECOGNITION.C.seductive.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.seductive.carefree[1]`: あら、別ルート? まあ、ありがとうございます〜。

### resultLeader.DEMAND_RECOGNITION.C.seductive.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.seductive.earnest[1]`: …ご配慮、ありがとうございます。お気持ち、受け取ります。

### resultLeader.DEMAND_RECOGNITION.C.seductive.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.seductive.emotional[1]`: …社長…そういう答え方、好き。ありがとう。

### resultLeader.DEMAND_RECOGNITION.C.seductive.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.DEMAND_RECOGNITION.C.delinquent.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.delinquent.bold[1]`: …っす、そういう形なら、ありがたく頂戴します。

### resultLeader.DEMAND_RECOGNITION.C.delinquent.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.delinquent.introverted[1]`: …っす。ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.delinquent.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.delinquent.carefree[1]`: へぇ、別ルートっすか〜。まあ気持ちは受け取ります〜。

### resultLeader.DEMAND_RECOGNITION.C.delinquent.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.delinquent.earnest[1]`: …社長、配慮ありがとうございます。気持ちは受け取りました。

### resultLeader.DEMAND_RECOGNITION.C.delinquent.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.delinquent.emotional[1]`: …っ、そういう形っすか。…ありがたいっす。

### resultLeader.DEMAND_RECOGNITION.C.delinquent.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.cool.bold[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.cool.bold[1]`: …承知。そういう形でも構いません。ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.cool.introverted[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.cool.introverted[1]`: …ありがとうございます。受け取ります。

### resultLeader.DEMAND_RECOGNITION.C.cool.carefree[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.cool.earnest[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.cool.emotional[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.cool.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.DEMAND_RECOGNITION.C.cool.shy[]

- `F07_LINES.resultLeader.DEMAND_RECOGNITION.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.normal.bold[1]`: …わかりました。気をつけます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.normal.introverted[1]`: …はい、すみません。

### resultLeader.OBSERVE_RIVAL_HEAT.A.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.normal.carefree[1]`: あー、はい、注意します〜。

### resultLeader.OBSERVE_RIVAL_HEAT.A.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.normal.earnest[1]`: …申し訳ありません。改めます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.normal.emotional[1]`: …そうですね、悪かったです。

### resultLeader.OBSERVE_RIVAL_HEAT.A.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.normal.shy[1]`: …はい…ごめんなさい。

### resultLeader.OBSERVE_RIVAL_HEAT.A.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.composed.bold[1]`: …承知しました。態度、改めます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.composed.introverted[1]`: …はい、…気をつけます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.composed.carefree[1]`: あらら、見られてましたか〜。気をつけますね。

### resultLeader.OBSERVE_RIVAL_HEAT.A.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.composed.earnest[1]`: …申し訳ありません。私の管理不行き届きでした。

### resultLeader.OBSERVE_RIVAL_HEAT.A.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.composed.emotional[1]`: …そうですか。…私が、抑えきれていませんでした。

### resultLeader.OBSERVE_RIVAL_HEAT.A.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.composed.shy[1]`: …はい…申し訳ない、です。

### resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.bold[1]`: …そうですの。気をつけますわ。

### resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.introverted[1]`: …はい、…失礼いたしましたわ。

### resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.carefree[1]`: あら、見られてましたの? 失礼いたしましたわ〜。

### resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.earnest[1]`: …申し訳ありませんわ。心がけを改めます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.emotional[1]`: …そうですの。…わたくしが、至りませんでしたわ。

### resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.ojousama.shy[1]`: …はい…ごめんなさいませ。

### resultLeader.OBSERVE_RIVAL_HEAT.A.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.polite.bold[1]`: …承知しました。改めます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.polite.introverted[1]`: …はい、申し訳ありません。

### resultLeader.OBSERVE_RIVAL_HEAT.A.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.polite.carefree[1]`: あ、はい〜。気をつけさせていただきます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.polite.earnest[1]`: …申し訳ありません。私の振る舞いが至りませんでした。

### resultLeader.OBSERVE_RIVAL_HEAT.A.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.polite.emotional[1]`: …そう、ですか。…申し訳ありません。

### resultLeader.OBSERVE_RIVAL_HEAT.A.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.polite.shy[1]`: …はい…ごめんなさい。

### resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.bold[1]`: …そう。気をつけるね。

### resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.introverted[1]`: …はい、わかりました。

### resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.carefree[1]`: あら、バレてた? 気をつけますね〜。

### resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.earnest[1]`: …ごめんなさい。わかりやすかったかな。

### resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.emotional[1]`: …そう、ですか。…私、出ちゃってましたね。

### resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.seductive.shy[1]`: …はい…ごめんなさい。

### resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.bold[1]`: …っす、わかりました。気をつけます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.introverted[1]`: …っす。すんません。

### resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.carefree[1]`: あー、はい〜、気をつけまーす。

### resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.earnest[1]`: …っす、すんません、態度悪かったっす。

### resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.emotional[1]`: …っ、わかりました。…抑えます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.delinquent.shy[1]`: …っす…ごめんなさい。

### resultLeader.OBSERVE_RIVAL_HEAT.A.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.cool.bold[1]`: …承知。気をつけます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.cool.introverted[1]`: …はい、わかりました。

### resultLeader.OBSERVE_RIVAL_HEAT.A.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.cool.carefree[1]`: わかりました。気をつけます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.cool.earnest[1]`: …申し訳ありません。改めます。

### resultLeader.OBSERVE_RIVAL_HEAT.A.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.cool.emotional[1]`: …そうですか。…悪かったです。

### resultLeader.OBSERVE_RIVAL_HEAT.A.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.A.cool.shy[1]`: …はい…ごめんなさい。

### resultLeader.OBSERVE_RIVAL_HEAT.B.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.normal.bold[1]`: （黙ったまま、視線をそらした）

### resultLeader.OBSERVE_RIVAL_HEAT.B.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.normal.introverted[1]`: （…何も言わず、目を伏せた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.normal.carefree[1]`: （へらっと笑って、話を流した）

### resultLeader.OBSERVE_RIVAL_HEAT.B.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.normal.earnest[1]`: （唇を結んだまま、頷くだけだった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.normal.emotional[1]`: （…目元に力が入ったが、言葉は出てこなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.normal.shy[1]`: （…俯いて、何も言わなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.composed.bold[1]`: （小さく頷いて、それ以上は語らなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.composed.introverted[1]`: （黙って、視線を落とした）

### resultLeader.OBSERVE_RIVAL_HEAT.B.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.composed.carefree[1]`: （曖昧に微笑んで、話題を逃がした）

### resultLeader.OBSERVE_RIVAL_HEAT.B.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.composed.earnest[1]`: （唇を結び、わずかに頭を下げた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.composed.emotional[1]`: （…一度息を吸って、結局何も言わなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.composed.shy[1]`: （…俯いて、肩を縮めた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.bold[1]`: （扇を畳むように、口を閉ざしましたわ）

### resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.introverted[1]`: （…そっと目を伏せましたわ）

### resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.carefree[1]`: （あら、と微笑んで、お話を流しましたわ）

### resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.earnest[1]`: （…静かに会釈なさいましたわ）

### resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.emotional[1]`: （…目元が揺れましたが、お言葉は出ませんでしたわ）

### resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.ojousama.shy[1]`: （…俯いて、お黙りになりましたわ）

### resultLeader.OBSERVE_RIVAL_HEAT.B.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.polite.bold[1]`: （…言葉を選ぶように、口を閉ざした）

### resultLeader.OBSERVE_RIVAL_HEAT.B.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.polite.introverted[1]`: （…静かに目を伏せた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.polite.carefree[1]`: （曖昧に笑って、お辞儀した）

### resultLeader.OBSERVE_RIVAL_HEAT.B.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.polite.earnest[1]`: （唇を結び、深く頷いた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.polite.emotional[1]`: （…言葉を呑み込んだ）

### resultLeader.OBSERVE_RIVAL_HEAT.B.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.polite.shy[1]`: （…俯いて、口を閉ざした）

### resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.bold[1]`: （小さく息を吐いて、視線を逸らした）

### resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.introverted[1]`: （…黙って、髪に触れた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.carefree[1]`: （含み笑いで、何も言わなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.earnest[1]`: （…静かに目を伏せた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.emotional[1]`: （…睫毛が震えたが、口は開かなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.seductive.shy[1]`: （…俯いて、何も言わなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.bold[1]`: （チッ、と舌打ちして、目を逸らした）

### resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.introverted[1]`: （…黙ったまま、何も言わなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.carefree[1]`: （へらっと笑って、誤魔化した）

### resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.earnest[1]`: （…口を結んで、頷くだけだった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.emotional[1]`: （…拳を握ったが、言葉は出なかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.delinquent.shy[1]`: （…俯いて、肩を縮めた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.cool.bold[1]`: （黙ったまま、視線を逸らした）

### resultLeader.OBSERVE_RIVAL_HEAT.B.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.cool.introverted[1]`: （…何も言わず、目を伏せた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.cool.carefree[1]`: （曖昧に頷いて、話を流した）

### resultLeader.OBSERVE_RIVAL_HEAT.B.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.cool.earnest[1]`: （…静かに頭を下げた）

### resultLeader.OBSERVE_RIVAL_HEAT.B.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.cool.emotional[1]`: （…目元が揺れたが、口は開かなかった）

### resultLeader.OBSERVE_RIVAL_HEAT.B.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.B.cool.shy[1]`: （…俯いた）

### resultLeader.OBSERVE_RIVAL_HEAT.C.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.normal.bold[1]`: …ご配慮、ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.normal.introverted[1]`: …はい、ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.normal.carefree[1]`: そっち経由ですか〜。了解です。

### resultLeader.OBSERVE_RIVAL_HEAT.C.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.normal.earnest[1]`: …ありがとうございます。気をつけます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.normal.emotional[1]`: …そうですね。すみません。

### resultLeader.OBSERVE_RIVAL_HEAT.C.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.composed.bold[1]`: …ご配慮、ありがたく頂戴します。

### resultLeader.OBSERVE_RIVAL_HEAT.C.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.composed.introverted[1]`: …ありがとうございます。…そっちで動いてくださったんですね。

### resultLeader.OBSERVE_RIVAL_HEAT.C.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.composed.carefree[1]`: ふむ、別ルートで動いてくれるんですね〜。ありがたいです。

### resultLeader.OBSERVE_RIVAL_HEAT.C.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.composed.earnest[1]`: …ありがとうございます。私の至らなさを、社長に拾っていただいて。

### resultLeader.OBSERVE_RIVAL_HEAT.C.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.composed.emotional[1]`: …社長…そういう形ですか。…ありがたいです。

### resultLeader.OBSERVE_RIVAL_HEAT.C.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.composed.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.bold[1]`: …まあ、ご配慮ありがたく頂戴いたしますわ。

### resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.introverted[1]`: …ありがとうございますわ。…お気遣い、痛み入りますわ。

### resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.carefree[1]`: あら、別の手立てですの? ありがたいですわ〜。

### resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.earnest[1]`: …社長、ご配慮痛み入りますわ。

### resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.emotional[1]`: …社長、そのお心遣い…胸に染みますわ。

### resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.ojousama.shy[1]`: …ありがとうございますわ。…嬉しゅう、ございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.polite.bold[1]`: …ご配慮、ありがたく承ります。

### resultLeader.OBSERVE_RIVAL_HEAT.C.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.polite.introverted[1]`: …ありがとうございます。…お心遣い、嬉しいです。

### resultLeader.OBSERVE_RIVAL_HEAT.C.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.polite.carefree[1]`: ふぅん、別ルートですか〜。ありがとうございます〜。

### resultLeader.OBSERVE_RIVAL_HEAT.C.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.polite.earnest[1]`: …ご配慮、ありがとうございます。お気持ち、しっかり受け取ります。

### resultLeader.OBSERVE_RIVAL_HEAT.C.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.polite.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.polite.shy[1]`: …あの、ありがとうございます。…嬉しいです。

### resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.bold[1]`: …そう、別ルートね。ありがとう。

### resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.introverted[1]`: …ありがとうございます。…そっちで動いてくれるんですね。

### resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.carefree[1]`: あら、別の形? まあ、ありがとうございます〜。

### resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.earnest[1]`: …ご配慮、ありがとうございます。お気持ち、受け取ります。

### resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.emotional[1]`: …社長…そういう形ですか。…嬉しい、です。

### resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.bold[1]`: …っす、配慮ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.introverted[1]`: …っす。ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.carefree[1]`: へぇ、別ルートっすか〜。まあ気持ちは受け取ります〜。

### resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.earnest[1]`: …社長、配慮ありがとうございます。気持ちは受け取りました。

### resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.emotional[1]`: …っ、そうっすか。…ありがたいっす。

### resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.cool.bold[1]`: …承知。ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.cool.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.cool.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.OBSERVE_RIVAL_HEAT.C.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_RIVAL_HEAT.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.A.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.normal.bold[1]`: …ご迷惑おかけしました。明日から、ちゃんと出ます。

### resultLeader.OBSERVE_ABSENCE.A.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.normal.introverted[1]`: …申し訳ありません。…出ます、ちゃんと。

### resultLeader.OBSERVE_ABSENCE.A.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.normal.carefree[1]`: あ、ばれてました? すみませ〜ん、明日から出ますって。

### resultLeader.OBSERVE_ABSENCE.A.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.normal.earnest[1]`: …申し訳ありません。立場のある身で、お恥ずかしい限りです。

### resultLeader.OBSERVE_ABSENCE.A.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.normal.emotional[1]`: …社長、すみません。…言い訳できないです。

### resultLeader.OBSERVE_ABSENCE.A.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.normal.shy[1]`: …ごめんなさい…明日から、出ます。

### resultLeader.OBSERVE_ABSENCE.A.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.composed.bold[1]`: …ご迷惑をおかけしました。明日から、しっかり出ます。

### resultLeader.OBSERVE_ABSENCE.A.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.composed.introverted[1]`: …申し訳ありません。…出直します。

### resultLeader.OBSERVE_ABSENCE.A.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.composed.carefree[1]`: あらら、見られてましたか。明日から、ちゃんとしますね。

### resultLeader.OBSERVE_ABSENCE.A.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.composed.earnest[1]`: …申し訳ありません。立場をわきまえず、恥ずかしい限りです。

### resultLeader.OBSERVE_ABSENCE.A.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.composed.emotional[1]`: …社長、申し訳ありません。…次こそ、ちゃんと出ます。

### resultLeader.OBSERVE_ABSENCE.A.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.composed.shy[1]`: …ごめんなさい…明日から、ちゃんと、出ます。

### resultLeader.OBSERVE_ABSENCE.A.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.ojousama.bold[1]`: …ご迷惑おかけしましたわ。明日から、ちゃんと出ますわ。

### resultLeader.OBSERVE_ABSENCE.A.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.ojousama.introverted[1]`: …申し訳ありませんわ。…出直しますわ。

### resultLeader.OBSERVE_ABSENCE.A.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.ojousama.carefree[1]`: あら、ばれてましたの? 明日から出ますわ〜。

### resultLeader.OBSERVE_ABSENCE.A.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.ojousama.earnest[1]`: …申し訳ありませんわ。お恥ずかしい限りですの。

### resultLeader.OBSERVE_ABSENCE.A.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.ojousama.emotional[1]`: …社長、申し訳ありません。…言い訳もありませんわ。

### resultLeader.OBSERVE_ABSENCE.A.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.ojousama.shy[1]`: …ごめんなさいませ…明日から、出ますわ。

### resultLeader.OBSERVE_ABSENCE.A.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.polite.bold[1]`: …ご迷惑おかけしました。明日からきちんと出させていただきます。

### resultLeader.OBSERVE_ABSENCE.A.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.polite.introverted[1]`: …申し訳ありません。…明日から、ちゃんと出ます。

### resultLeader.OBSERVE_ABSENCE.A.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.polite.carefree[1]`: あ、ばれてました〜? すみません、明日から出ます〜。

### resultLeader.OBSERVE_ABSENCE.A.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.polite.earnest[1]`: …申し訳ありません。立場ある身で、本当にお恥ずかしいです。

### resultLeader.OBSERVE_ABSENCE.A.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.polite.emotional[1]`: …社長、申し訳ありません。…本当に、言い訳できないです。

### resultLeader.OBSERVE_ABSENCE.A.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.polite.shy[1]`: …ごめんなさい…明日から、ちゃんと、出ます。

### resultLeader.OBSERVE_ABSENCE.A.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.seductive.bold[1]`: …ごめん、社長。明日から、ちゃんと出るね。

### resultLeader.OBSERVE_ABSENCE.A.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.seductive.introverted[1]`: …ごめんなさい。…明日から、出ます。

### resultLeader.OBSERVE_ABSENCE.A.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.seductive.carefree[1]`: あら、ばれちゃった? 明日から出るね〜。

### resultLeader.OBSERVE_ABSENCE.A.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.seductive.earnest[1]`: …申し訳ありません。立場ある身で、本当に恥ずかしい。

### resultLeader.OBSERVE_ABSENCE.A.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.seductive.emotional[1]`: …社長…ごめんなさい。…言い訳、しないから。

### resultLeader.OBSERVE_ABSENCE.A.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.seductive.shy[1]`: …ごめんなさい…明日から、ちゃんと、出ます。

### resultLeader.OBSERVE_ABSENCE.A.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.delinquent.bold[1]`: …っす、すんません。明日からちゃんと出ます。

### resultLeader.OBSERVE_ABSENCE.A.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.delinquent.introverted[1]`: …っす。すんません。明日から、出ます。

### resultLeader.OBSERVE_ABSENCE.A.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.delinquent.carefree[1]`: あ〜ばれてました? すんませ〜ん、明日から出まっす。

### resultLeader.OBSERVE_ABSENCE.A.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.delinquent.earnest[1]`: …っす、すんません。立場あるのに、恥ずかしいっす。

### resultLeader.OBSERVE_ABSENCE.A.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.delinquent.emotional[1]`: …社長、すんません。…言い訳できないっす。

### resultLeader.OBSERVE_ABSENCE.A.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.delinquent.shy[1]`: …っす…ごめんなさい。明日から、出ます。

### resultLeader.OBSERVE_ABSENCE.A.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.cool.bold[1]`: …申し訳ない。明日から、出ます。

### resultLeader.OBSERVE_ABSENCE.A.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.cool.introverted[1]`: …申し訳ありません。…出ます。

### resultLeader.OBSERVE_ABSENCE.A.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.cool.carefree[1]`: ばれてましたか。明日から出ます。

### resultLeader.OBSERVE_ABSENCE.A.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.cool.earnest[1]`: …申し訳ありません。立場をわきまえます。

### resultLeader.OBSERVE_ABSENCE.A.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.cool.emotional[1]`: …社長、すみません。…言葉も、ないです。

### resultLeader.OBSERVE_ABSENCE.A.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.A.cool.shy[1]`: …ごめんなさい…明日から、出ます。

### resultLeader.OBSERVE_ABSENCE.B.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.normal.bold[1]`: …ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.normal.introverted[1]`: …ありがとうございます。…気を遣っていただいて。

### resultLeader.OBSERVE_ABSENCE.B.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.normal.carefree[1]`: お、見逃してくれるんですか〜? 助かります〜。

### resultLeader.OBSERVE_ABSENCE.B.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.normal.earnest[1]`: …ありがとうございます。お見逃しいただいたぶん、行動で返します。

### resultLeader.OBSERVE_ABSENCE.B.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.normal.emotional[1]`: …ありがとうございます…社長、優しい。

### resultLeader.OBSERVE_ABSENCE.B.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.OBSERVE_ABSENCE.B.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.composed.bold[1]`: …ありがとうございます。次は、しっかりやります。

### resultLeader.OBSERVE_ABSENCE.B.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.composed.introverted[1]`: …ありがとうございます。…お気遣い、痛み入ります。

### resultLeader.OBSERVE_ABSENCE.B.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.composed.carefree[1]`: 助かります〜、社長ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.composed.earnest[1]`: …ありがとうございます。お見逃しいただいた分、必ず返します。

### resultLeader.OBSERVE_ABSENCE.B.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.composed.emotional[1]`: …社長…ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.composed.shy[1]`: …ありがとうございます。…ほっ、としました。

### resultLeader.OBSERVE_ABSENCE.B.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.ojousama.bold[1]`: …ありがとうございますわ。次はちゃんといたしますわ。

### resultLeader.OBSERVE_ABSENCE.B.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.ojousama.introverted[1]`: …ありがとうございますわ。…お気遣い痛み入りますわ。

### resultLeader.OBSERVE_ABSENCE.B.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.ojousama.carefree[1]`: まあ、見逃してくださるの? 助かりますわ〜。

### resultLeader.OBSERVE_ABSENCE.B.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.ojousama.earnest[1]`: …ありがとうございますわ。お見逃しのぶん、お返しいたしますわ。

### resultLeader.OBSERVE_ABSENCE.B.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.ojousama.emotional[1]`: …社長…ありがとうございますわ、お優しい。

### resultLeader.OBSERVE_ABSENCE.B.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.ojousama.shy[1]`: …ありがとうございますわ。…ほっ、といたしましたわ。

### resultLeader.OBSERVE_ABSENCE.B.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.polite.bold[1]`: …ありがとうございます。お見逃しいただいた分、しっかり返します。

### resultLeader.OBSERVE_ABSENCE.B.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.polite.introverted[1]`: …ありがとうございます。…お気遣い、ありがたいです。

### resultLeader.OBSERVE_ABSENCE.B.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.polite.carefree[1]`: わ、助かります〜、社長ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.polite.earnest[1]`: …ありがとうございます。本当に、お見逃しに甘えないようにします。

### resultLeader.OBSERVE_ABSENCE.B.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.polite.emotional[1]`: …社長…ありがとうございます。お優しいです。

### resultLeader.OBSERVE_ABSENCE.B.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.polite.shy[1]`: …はい…ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_ABSENCE.B.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.seductive.bold[1]`: …ありがとう、社長。お返しは、ちゃんとするから。

### resultLeader.OBSERVE_ABSENCE.B.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.seductive.introverted[1]`: …ありがとうございます。…優しい。

### resultLeader.OBSERVE_ABSENCE.B.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.seductive.carefree[1]`: お〜、見逃してくれるの? 社長優しい〜。

### resultLeader.OBSERVE_ABSENCE.B.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.seductive.earnest[1]`: …社長、ありがとうございます。次はちゃんとします。

### resultLeader.OBSERVE_ABSENCE.B.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.seductive.emotional[1]`: …社長…ありがとう、本当に優しい。

### resultLeader.OBSERVE_ABSENCE.B.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_ABSENCE.B.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.delinquent.bold[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.delinquent.introverted[1]`: …っす。ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.delinquent.carefree[1]`: マジっすか〜、社長太っ腹! 助かります〜。

### resultLeader.OBSERVE_ABSENCE.B.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.delinquent.earnest[1]`: …社長、ありがとうございます。お見逃し分、ちゃんと返します。

### resultLeader.OBSERVE_ABSENCE.B.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.delinquent.emotional[1]`: …社長、ありがとうございます。…マジで優しい。

### resultLeader.OBSERVE_ABSENCE.B.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.delinquent.shy[1]`: …っす…ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.cool.bold[1]`: …ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.cool.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.cool.carefree[1]`: ありがとうございます。助かります。

### resultLeader.OBSERVE_ABSENCE.B.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.cool.earnest[1]`: …ありがとうございます。お気遣いに、応えます。

### resultLeader.OBSERVE_ABSENCE.B.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.cool.emotional[1]`: …社長、ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.B.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.B.cool.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.normal.bold[1]`: …そっちですか。…私たちのメンバーをちゃんと見てくれて、感謝します。

### resultLeader.OBSERVE_ABSENCE.C.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.normal.introverted[1]`: …ありがとうございます。…私の代わりに、みんなを見てくださって。

### resultLeader.OBSERVE_ABSENCE.C.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.normal.carefree[1]`: ふぅん、メンバーケア優先ですか〜。まあ、それでいいです。

### resultLeader.OBSERVE_ABSENCE.C.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.normal.earnest[1]`: …ありがとうございます。私の不在の分、メンバーが寂しい思いをしないように。

### resultLeader.OBSERVE_ABSENCE.C.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.normal.emotional[1]`: …社長…私の穴、埋めてくれるんですか。…申し訳ないです。

### resultLeader.OBSERVE_ABSENCE.C.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.OBSERVE_ABSENCE.C.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.composed.bold[1]`: …なるほど、そういう形ですか。ありがたく頂戴します。

### resultLeader.OBSERVE_ABSENCE.C.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.composed.introverted[1]`: …ありがとうございます。…私の代わりに、みんなを見てくださって。

### resultLeader.OBSERVE_ABSENCE.C.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.composed.carefree[1]`: ふむ、メンバーケアですか〜。それも助かりますね。

### resultLeader.OBSERVE_ABSENCE.C.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.composed.earnest[1]`: …ありがとうございます。私の至らなさを、社長が補ってくださる形で。

### resultLeader.OBSERVE_ABSENCE.C.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.composed.emotional[1]`: …社長…そういう形ですか。…申し訳ないです、ありがたいです。

### resultLeader.OBSERVE_ABSENCE.C.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.composed.shy[1]`: …ありがとうございます。…申し訳ない、です。

### resultLeader.OBSERVE_ABSENCE.C.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.ojousama.bold[1]`: …まあ、そういうご配慮ですのね。ありがたく頂戴いたしますわ。

### resultLeader.OBSERVE_ABSENCE.C.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.ojousama.introverted[1]`: …ありがとうございますわ。…わたくしの代わりに、皆を見てくださるなんて。

### resultLeader.OBSERVE_ABSENCE.C.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.ojousama.carefree[1]`: あら、メンバー優先ですの? まあ、ありがたいですわ〜。

### resultLeader.OBSERVE_ABSENCE.C.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.ojousama.earnest[1]`: …社長、ご配慮痛み入りますわ。

### resultLeader.OBSERVE_ABSENCE.C.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.ojousama.emotional[1]`: …社長、そのお心遣い…胸に染みますわ。

### resultLeader.OBSERVE_ABSENCE.C.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.ojousama.shy[1]`: …ありがとうございますわ。…申し訳ない、ですわ。

### resultLeader.OBSERVE_ABSENCE.C.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.polite.bold[1]`: …なるほど、そういう形ですか。ありがたく承ります。

### resultLeader.OBSERVE_ABSENCE.C.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.polite.introverted[1]`: …ありがとうございます。…私の代わりに、メンバーを見てくださって。

### resultLeader.OBSERVE_ABSENCE.C.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.polite.carefree[1]`: ふぅん、メンバー優先ですか〜。それも助かります〜。

### resultLeader.OBSERVE_ABSENCE.C.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.polite.earnest[1]`: …ご配慮、ありがとうございます。私の不在を、社長に拾っていただいて。

### resultLeader.OBSERVE_ABSENCE.C.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.polite.emotional[1]`: …社長、そういう形ですか。…申し訳ないです。

### resultLeader.OBSERVE_ABSENCE.C.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.polite.shy[1]`: …あの、ありがとうございます。…嬉しいです。

### resultLeader.OBSERVE_ABSENCE.C.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.seductive.bold[1]`: …そう、メンバー優先ね。ありがとう。

### resultLeader.OBSERVE_ABSENCE.C.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.seductive.introverted[1]`: …ありがとうございます。…そっちで動いてくれるんですね。

### resultLeader.OBSERVE_ABSENCE.C.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.seductive.carefree[1]`: あら、私じゃなくて子たち優先? まあ、ありがたいです〜。

### resultLeader.OBSERVE_ABSENCE.C.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.seductive.earnest[1]`: …社長、ご配慮ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.seductive.emotional[1]`: …社長…そういう形ですか。…ありがたい、です。

### resultLeader.OBSERVE_ABSENCE.C.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_ABSENCE.C.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.delinquent.bold[1]`: …っす、メンバー優先っすか。ありがたいっす。

### resultLeader.OBSERVE_ABSENCE.C.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.delinquent.introverted[1]`: …っす。ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.delinquent.carefree[1]`: へぇ、メンバーケアっすか〜。まあありがたいっす。

### resultLeader.OBSERVE_ABSENCE.C.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.delinquent.earnest[1]`: …社長、配慮ありがとうございます。あたしらの分、見てくださって。

### resultLeader.OBSERVE_ABSENCE.C.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.delinquent.emotional[1]`: …っ、そうっすか。…申し訳ないっす、ありがたいっす。

### resultLeader.OBSERVE_ABSENCE.C.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.cool.bold[1]`: …承知。ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.cool.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.cool.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.OBSERVE_ABSENCE.C.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_ABSENCE.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.normal.bold[1]`: …そうですか。私からも、メンバーに話します。

### resultLeader.OBSERVE_INTERNAL_RANK.A.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.normal.introverted[1]`: …はい、…わかりました。気をつけます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.normal.carefree[1]`: えー、序列の話なんてしてないですよ〜。…まあ、注意しときますけど。

### resultLeader.OBSERVE_INTERNAL_RANK.A.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.normal.earnest[1]`: …申し訳ありません。私がしっかり見ていれば、防げたはずです。

### resultLeader.OBSERVE_INTERNAL_RANK.A.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.normal.emotional[1]`: …そう、ですか。…私の至らなさです。

### resultLeader.OBSERVE_INTERNAL_RANK.A.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.normal.shy[1]`: …はい…ごめんなさい、注意します。

### resultLeader.OBSERVE_INTERNAL_RANK.A.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.composed.bold[1]`: …承知しました。私からメンバーに話します。

### resultLeader.OBSERVE_INTERNAL_RANK.A.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.composed.introverted[1]`: …はい、…気をつけます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.composed.carefree[1]`: あらら、序列の話ですか〜。注意しておきますね。

### resultLeader.OBSERVE_INTERNAL_RANK.A.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.composed.earnest[1]`: …申し訳ありません。私の目が届いていませんでした。

### resultLeader.OBSERVE_INTERNAL_RANK.A.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.composed.emotional[1]`: …そうですか。…私の至らなさ、噛み締めます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.composed.shy[1]`: …はい…申し訳ない、です。

### resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.bold[1]`: …そうですの。わたくしから皆に話しますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.introverted[1]`: …はい、…気をつけますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.carefree[1]`: あら、そんな話してましたの? 注意しておきますわ〜。

### resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.earnest[1]`: …申し訳ありませんわ。わたくしの目が届きませんでしたわ。

### resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.emotional[1]`: …そうですの。…わたくしの至らなさですわ。

### resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.ojousama.shy[1]`: …はい…ごめんなさいませ、注意いたしますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.A.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.polite.bold[1]`: …承知しました。私からメンバーに話させていただきます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.polite.introverted[1]`: …はい、申し訳ありません。気をつけます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.polite.carefree[1]`: えぇ〜、そんな話あったんですか〜。注意しときます〜。

### resultLeader.OBSERVE_INTERNAL_RANK.A.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.polite.earnest[1]`: …申し訳ありません。私が見ていれば、防げたはずです。

### resultLeader.OBSERVE_INTERNAL_RANK.A.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.polite.emotional[1]`: …そう、ですか。…私の責任です。

### resultLeader.OBSERVE_INTERNAL_RANK.A.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.polite.shy[1]`: …はい…ごめんなさい、注意します。

### resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.bold[1]`: …そう。私から皆に話すね。

### resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.introverted[1]`: …はい、…気をつけます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.carefree[1]`: えー、そんな話してた? まあ、注意しとくね〜。

### resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.earnest[1]`: …ごめんなさい。私の目が届いてなかった。

### resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.emotional[1]`: …そう、ですか。…私のせいだね。

### resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.seductive.shy[1]`: …はい…ごめんなさい。

### resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.bold[1]`: …っす、わかりました。あたしから言っときます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.introverted[1]`: …っす。気をつけます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.carefree[1]`: えー、そんな話してました? まあ注意しときますんで〜。

### resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.earnest[1]`: …っす、すんません。あたしの目が届いてなかったっす。

### resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.emotional[1]`: …っ、そうっすか。…あたしの不徳っす。

### resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.delinquent.shy[1]`: …っす…ごめんなさい、気をつけます。

### resultLeader.OBSERVE_INTERNAL_RANK.A.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.cool.bold[1]`: …承知。私から話します。

### resultLeader.OBSERVE_INTERNAL_RANK.A.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.cool.introverted[1]`: …はい、わかりました。

### resultLeader.OBSERVE_INTERNAL_RANK.A.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.cool.carefree[1]`: わかりました。注意します。

### resultLeader.OBSERVE_INTERNAL_RANK.A.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.cool.earnest[1]`: …申し訳ありません。私の管理不足です。

### resultLeader.OBSERVE_INTERNAL_RANK.A.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.cool.emotional[1]`: …そうですか。…私の責任です。

### resultLeader.OBSERVE_INTERNAL_RANK.A.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.A.cool.shy[1]`: …はい…ごめんなさい。

### resultLeader.OBSERVE_INTERNAL_RANK.B.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.normal.bold[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.normal.introverted[1]`: …はい、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.normal.carefree[1]`: ふぅん、まあ放っておいてくれるなら〜。

### resultLeader.OBSERVE_INTERNAL_RANK.B.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.normal.earnest[1]`: …ありがとうございます。穏便に収まるよう努めます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.normal.emotional[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.normal.shy[1]`: …はい…。

### resultLeader.OBSERVE_INTERNAL_RANK.B.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.composed.bold[1]`: …ありがとうございます。穏便に収めます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.composed.introverted[1]`: …ありがとうございます。…ほっとしました。

### resultLeader.OBSERVE_INTERNAL_RANK.B.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.composed.carefree[1]`: ありがとうございます〜。穏便に〜。

### resultLeader.OBSERVE_INTERNAL_RANK.B.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.composed.earnest[1]`: …ありがとうございます。穏便に収まるよう努めます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.composed.emotional[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.composed.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.bold[1]`: …ありがとうございますわ。穏便にいたしますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.introverted[1]`: …ありがとうございますわ。…ほっといたしましたわ。

### resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.carefree[1]`: ありがとうございますわ〜。穏便に、ですわね。

### resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.earnest[1]`: …ありがとうございますわ。穏便に収まるよう努めますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.emotional[1]`: …ありがとうございますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.ojousama.shy[1]`: …ありがとうございますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.B.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.polite.bold[1]`: …ありがとうございます。穏便にいたします。

### resultLeader.OBSERVE_INTERNAL_RANK.B.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.polite.introverted[1]`: …ありがとうございます。…安心しました。

### resultLeader.OBSERVE_INTERNAL_RANK.B.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.polite.carefree[1]`: ありがとうございます〜。穏便にいきますね。

### resultLeader.OBSERVE_INTERNAL_RANK.B.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.polite.earnest[1]`: …ありがとうございます。穏便に収めるよう努めます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.polite.emotional[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.polite.shy[1]`: …はい…ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.bold[1]`: …ありがとう、社長。穏便にね。

### resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.carefree[1]`: お〜、放っといてくれるんですね〜。ありがと〜。

### resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.earnest[1]`: …社長、ありがとうございます。穏便にいきます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.emotional[1]`: …社長、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.seductive.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.bold[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.introverted[1]`: …っす。ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.carefree[1]`: お〜、放っといてくれるんすか〜。ありがたいっす〜。

### resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.earnest[1]`: …っす、ありがとうございます。穏便にいきます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.emotional[1]`: …社長、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.cool.bold[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.cool.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.cool.carefree[1]`: ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.cool.earnest[1]`: …ありがとうございます。穏便に収めます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.cool.emotional[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.B.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.B.cool.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.normal.bold[1]`: …ご配慮、ありがとうございます。下の子にも声をかけてくださって。

### resultLeader.OBSERVE_INTERNAL_RANK.C.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.normal.introverted[1]`: …ありがとうございます。…下の子のフォロー、助かります。

### resultLeader.OBSERVE_INTERNAL_RANK.C.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.normal.carefree[1]`: お、別ルートですか。下の子のフォロー、お願いします〜。

### resultLeader.OBSERVE_INTERNAL_RANK.C.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.normal.earnest[1]`: …ありがとうございます。私の力不足を、社長に補っていただいて。

### resultLeader.OBSERVE_INTERNAL_RANK.C.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.normal.emotional[1]`: …社長…そういう形で気にかけてくれるの、ありがたいです。

### resultLeader.OBSERVE_INTERNAL_RANK.C.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.composed.bold[1]`: …ご配慮ありがとうございます。下の子のフォロー、助かります。

### resultLeader.OBSERVE_INTERNAL_RANK.C.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.composed.introverted[1]`: …ありがとうございます。…下の子のケア、ありがたいです。

### resultLeader.OBSERVE_INTERNAL_RANK.C.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.composed.carefree[1]`: ふむ、別ルートですか。下の子も助かりますね〜。

### resultLeader.OBSERVE_INTERNAL_RANK.C.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.composed.earnest[1]`: …ありがとうございます。私の至らなさを、社長に補っていただいて。

### resultLeader.OBSERVE_INTERNAL_RANK.C.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.composed.emotional[1]`: …社長…そういう形で気にかけてくださるの、ありがたいです。

### resultLeader.OBSERVE_INTERNAL_RANK.C.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.composed.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.bold[1]`: …まあ、ご配慮ありがたく頂戴いたしますわ。下の子のフォロー、助かりますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.introverted[1]`: …ありがとうございますわ。…下の子のケア、ありがたいですわ。

### resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.carefree[1]`: あら、別ルートですの? 下の子のフォロー、お願いいたしますわ〜。

### resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.earnest[1]`: …社長、ご配慮痛み入りますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.emotional[1]`: …社長、そのお心遣い…胸に染みますわ。

### resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.ojousama.shy[1]`: …ありがとうございますわ。…嬉しゅう、ございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.polite.bold[1]`: …ご配慮、ありがとうございます。下の子にも目を向けてくださって。

### resultLeader.OBSERVE_INTERNAL_RANK.C.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.polite.introverted[1]`: …ありがとうございます。…下の子のフォロー、ありがたいです。

### resultLeader.OBSERVE_INTERNAL_RANK.C.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.polite.carefree[1]`: ふぅん、別ルートですか〜。下の子のケア、助かります〜。

### resultLeader.OBSERVE_INTERNAL_RANK.C.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.polite.earnest[1]`: …ご配慮、ありがとうございます。私の力不足を、社長に補っていただいて。

### resultLeader.OBSERVE_INTERNAL_RANK.C.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.polite.emotional[1]`: …社長、そういう形で気にかけてくださって、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.polite.shy[1]`: …あの、ありがとうございます。…嬉しいです。

### resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.bold[1]`: …そう、下の子のケアね。ありがとう。

### resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.introverted[1]`: …ありがとうございます。…下の子のフォロー、嬉しい。

### resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.carefree[1]`: あら、別ルートで動いてくれるの? ありがとうございます〜。

### resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.earnest[1]`: …ご配慮、ありがとうございます。下の子も救われます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.emotional[1]`: …社長…そういう形で気にかけてくれるの、嬉しい。

### resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.bold[1]`: …っす、配慮ありがとうございます。下の子助かります。

### resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.introverted[1]`: …っす。下の子のフォロー、ありがたいっす。

### resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.carefree[1]`: へぇ、別ルートっすか。下の子のケア助かります〜。

### resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.earnest[1]`: …社長、配慮ありがとうございます。下の子の分、見てくださって。

### resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.emotional[1]`: …っ、そういう形っすか。…ありがたいっす。

### resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.cool.bold[1]`: …承知。下の子のケア、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.cool.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.cool.emotional[1]`: …社長、そういう形ですか。…ありがとうございます。

### resultLeader.OBSERVE_INTERNAL_RANK.C.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_INTERNAL_RANK.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.normal.bold[1]`: …大丈夫だと思ってましたが、…少しだけ、休ませてもらいます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.normal.introverted[1]`: …ありがとうございます。…少し、休みます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.normal.carefree[1]`: えへへ、バレてた? じゃ、お言葉に甘えて休みまーす。

### resultLeader.OBSERVE_FAN_PRESSURE.A.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.normal.earnest[1]`: …ありがとうございます。…ご厚意に、甘えさせてもらいます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.normal.emotional[1]`: …社長…見ててくれたんですね。…ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.normal.shy[1]`: …はい…休ませて、もらいます…ありがとう。

### resultLeader.OBSERVE_FAN_PRESSURE.A.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.composed.bold[1]`: …ありがとうございます。少し、休ませてもらいます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.composed.introverted[1]`: …ありがとうございます。…お気遣い、頂戴します。

### resultLeader.OBSERVE_FAN_PRESSURE.A.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.composed.carefree[1]`: あらら、見ててくれたんですね〜。じゃ、休ませてもらいます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.composed.earnest[1]`: …ありがとうございます。ご厚意に、甘えさせていただきます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.composed.emotional[1]`: …社長…見ていてくださったんですね。ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.composed.shy[1]`: …ありがとうございます。…休ませて、もらいます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.bold[1]`: …ありがとうございますわ。少し休ませていただきますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.introverted[1]`: …ありがとうございますわ。…休ませていただきますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.carefree[1]`: まあ、見ていてくださったの? ではお言葉に甘えますわ〜。

### resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.earnest[1]`: …ありがとうございますわ。ご厚意に甘えさせていただきますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.emotional[1]`: …社長…見ていてくださったんですのね。ありがとうございますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.ojousama.shy[1]`: …ありがとうございますわ。…休ませて、いただきますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.A.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.polite.bold[1]`: …ありがとうございます。お言葉に甘えて、少し休ませていただきます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.polite.introverted[1]`: …ありがとうございます。…休ませていただきます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.polite.carefree[1]`: わ、見ててくれたんですか〜。じゃ、休ませていただきます〜。

### resultLeader.OBSERVE_FAN_PRESSURE.A.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.polite.earnest[1]`: …ありがとうございます。ご厚意に、しっかり甘えさせていただきます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.polite.emotional[1]`: …社長…見ていてくださったんですね。ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.polite.shy[1]`: …はい…ありがとうございます。…休ませて、いただきます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.bold[1]`: …ありがとう、社長。ちょっと休むね。

### resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.introverted[1]`: …ありがとうございます。…休みます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.carefree[1]`: あら、バレちゃった? じゃ、お言葉に甘えて〜。

### resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.earnest[1]`: …ありがとうございます。ご厚意、頂戴します。

### resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.emotional[1]`: …社長…見ててくれたんですね。嬉しい。

### resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.seductive.shy[1]`: …ありがとうございます。…休ませて、もらいます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.bold[1]`: …っす、ありがとうございます。ちょっと休みます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.introverted[1]`: …っす、ありがとうございます。…休みます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.carefree[1]`: えへ、バレてました〜? じゃお言葉に甘えて休みまっす。

### resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.earnest[1]`: …社長、ありがとうございます。甘えさせてもらいます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.emotional[1]`: …社長、見ててくれたんすね。ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.delinquent.shy[1]`: …っす…ありがとうございます。…休みます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.cool.bold[1]`: …ありがとうございます。少し休みます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.cool.introverted[1]`: …ありがとうございます。…休みます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.cool.carefree[1]`: ありがとうございます。休みますね。

### resultLeader.OBSERVE_FAN_PRESSURE.A.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.cool.earnest[1]`: …ありがとうございます。ご厚意、頂戴します。

### resultLeader.OBSERVE_FAN_PRESSURE.A.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.cool.emotional[1]`: …社長、ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.A.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.A.cool.shy[1]`: …ありがとうございます。…休みます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.normal.bold[1]`: …大丈夫です。問題ありません。

### resultLeader.OBSERVE_FAN_PRESSURE.B.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.normal.introverted[1]`: …はい、平気です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.normal.carefree[1]`: いや〜、まだいけますって〜。

### resultLeader.OBSERVE_FAN_PRESSURE.B.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.normal.earnest[1]`: …ご心配ありがとうございます。まだ立てます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.normal.emotional[1]`: …大丈夫です。…まだ、やれます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.normal.shy[1]`: …はい…大丈夫、です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.composed.bold[1]`: …大丈夫です。まだ、いけます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.composed.introverted[1]`: …はい、…まだ、平気です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.composed.carefree[1]`: いやいや、まだ大丈夫ですよ〜。

### resultLeader.OBSERVE_FAN_PRESSURE.B.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.composed.earnest[1]`: …ご心配ありがとうございます。まだ立てます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.composed.emotional[1]`: …大丈夫です。…まだ、立っていられます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.composed.shy[1]`: …はい…大丈夫、です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.bold[1]`: …大丈夫ですわ。問題ございませんわ。

### resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.introverted[1]`: …はい、…平気ですわ。

### resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.carefree[1]`: まあ、まだ大丈夫ですのよ〜。

### resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.earnest[1]`: …ご心配ありがとうございますわ。まだ立てますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.emotional[1]`: …大丈夫ですわ。…まだ、やれますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.ojousama.shy[1]`: …はい…大丈夫、ですわ。

### resultLeader.OBSERVE_FAN_PRESSURE.B.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.polite.bold[1]`: …大丈夫です。問題ありません。

### resultLeader.OBSERVE_FAN_PRESSURE.B.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.polite.introverted[1]`: …はい、…平気です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.polite.carefree[1]`: いや〜、まだいけます〜。

### resultLeader.OBSERVE_FAN_PRESSURE.B.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.polite.earnest[1]`: …ご心配いただきありがとうございます。まだ立てます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.polite.emotional[1]`: …大丈夫です。…まだ、やれます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.polite.shy[1]`: …はい…大丈夫、です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.bold[1]`: …大丈夫、まだ平気だよ。

### resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.introverted[1]`: …はい、平気です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.carefree[1]`: いやいや、まだ大丈夫〜。

### resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.earnest[1]`: …ご心配ありがとうございます。まだ立てます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.emotional[1]`: …大丈夫です。…まだ、やれる。

### resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.seductive.shy[1]`: …はい…大丈夫、です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.bold[1]`: …っす、大丈夫っす。問題ないっす。

### resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.introverted[1]`: …っす。平気っす。

### resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.carefree[1]`: いやいや、まだいけますって〜。

### resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.earnest[1]`: …ご心配どうもっす。まだ立てます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.emotional[1]`: …大丈夫っす。…まだ、やれます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.delinquent.shy[1]`: …っす…大丈夫、です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.cool.bold[1]`: …大丈夫です。問題ありません。

### resultLeader.OBSERVE_FAN_PRESSURE.B.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.cool.introverted[1]`: …はい、平気です。

### resultLeader.OBSERVE_FAN_PRESSURE.B.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.cool.carefree[1]`: まだ、いけます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.cool.earnest[1]`: …ご心配ありがとうございます。まだ立てます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.cool.emotional[1]`: …大丈夫です。…まだ、やれます。

### resultLeader.OBSERVE_FAN_PRESSURE.B.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.B.cool.shy[1]`: …はい…大丈夫、です。

### resultLeader.OBSERVE_FAN_PRESSURE.C.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.normal.bold[1]`: …そっちですか。…メンバーにフォローを入れてくださると、私も楽になります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.normal.introverted[1]`: …ありがとうございます。…メンバーが受け止めてくれると、助かります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.normal.carefree[1]`: お、メンバーケアですか? 助かりますね〜。

### resultLeader.OBSERVE_FAN_PRESSURE.C.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.normal.earnest[1]`: …ありがとうございます。チームで支えてもらえるなら、私も持ち直せます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.normal.emotional[1]`: …社長…ありがとうございます。一人で抱えなくていいって、思えます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.composed.bold[1]`: …なるほど、メンバーケアですか。私も助かります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.composed.introverted[1]`: …ありがとうございます。…メンバーに支えてもらえると、楽になります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.composed.carefree[1]`: ふむ、メンバーケアですか〜。それも助かりますね。

### resultLeader.OBSERVE_FAN_PRESSURE.C.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.composed.earnest[1]`: …ありがとうございます。チームで支えていただけると、持ち直せます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.composed.emotional[1]`: …社長…ありがとうございます。一人で抱えなくていいんですね。

### resultLeader.OBSERVE_FAN_PRESSURE.C.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.composed.shy[1]`: …ありがとうございます。…助かります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.bold[1]`: …まあ、メンバーケアですの。わたくしも楽になりますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.introverted[1]`: …ありがとうございますわ。…皆に支えていただけると、ありがたいですわ。

### resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.carefree[1]`: あら、皆のケアですの? 助かりますわ〜。

### resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.earnest[1]`: …ありがとうございますわ。皆で支えていただけると、立ち直れますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.emotional[1]`: …社長…ありがとうございますわ。一人で抱えずに済みますわ。

### resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.ojousama.shy[1]`: …ありがとうございますわ。…助かります、わ。

### resultLeader.OBSERVE_FAN_PRESSURE.C.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.polite.bold[1]`: …なるほど、メンバーケアですか。私も助かります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.polite.introverted[1]`: …ありがとうございます。…メンバーに支えていただけると、楽になります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.polite.carefree[1]`: お、メンバーケアですか〜。助かります〜。

### resultLeader.OBSERVE_FAN_PRESSURE.C.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.polite.earnest[1]`: …ありがとうございます。チームで支えていただけるなら、持ち直せます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.polite.emotional[1]`: …社長…ありがとうございます。一人で抱えなくて済みます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.polite.shy[1]`: …あの、ありがとうございます。…嬉しいです。

### resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.bold[1]`: …そう、メンバーケアね。私も助かる、ありがとう。

### resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.introverted[1]`: …ありがとうございます。…メンバーに支えてもらえる、嬉しい。

### resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.carefree[1]`: あら、メンバー優先? まあ、助かります〜。

### resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.earnest[1]`: …ご配慮、ありがとうございます。皆に支えてもらえます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.emotional[1]`: …社長…一人じゃなくていいんだね。ありがとう。

### resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.bold[1]`: …っす、メンバーケアっすか。助かります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.introverted[1]`: …っす。皆のフォロー、ありがたいっす。

### resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.carefree[1]`: へぇ、メンバー優先っすか〜。助かりますね〜。

### resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.earnest[1]`: …社長、配慮ありがとうございます。皆に支えてもらえます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.emotional[1]`: …社長…ありがとうございます。一人で抱えなくていいんすね。

### resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.cool.bold[1]`: …承知。メンバーケア、助かります。

### resultLeader.OBSERVE_FAN_PRESSURE.C.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.cool.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.cool.emotional[1]`: …社長、ありがとうございます。

### resultLeader.OBSERVE_FAN_PRESSURE.C.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_FAN_PRESSURE.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.A.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.normal.bold[1]`: …わかりました。怪我させちゃ意味がないですもんね。少し、緩めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.normal.introverted[1]`: …はい、…わかりました。やりすぎ、だったかもしれません。

### resultLeader.OBSERVE_TRAINING_HARD.A.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.normal.carefree[1]`: えぇ〜、これくらい大丈夫なんですけどぉ。…はぁい、緩めま〜す。

### resultLeader.OBSERVE_TRAINING_HARD.A.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.normal.earnest[1]`: …申し訳ありません。私の判断が、行きすぎていました。

### resultLeader.OBSERVE_TRAINING_HARD.A.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.normal.emotional[1]`: …社長…そう、ですか。…私が、追い込みすぎてました。

### resultLeader.OBSERVE_TRAINING_HARD.A.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.normal.shy[1]`: …はい…ごめんなさい、加減します。

### resultLeader.OBSERVE_TRAINING_HARD.A.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.composed.bold[1]`: …承知しました。怪我させては元も子もないですね。緩めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.composed.introverted[1]`: …はい、…緩めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.composed.carefree[1]`: あらら、見られてました? じゃ、緩めますね〜。

### resultLeader.OBSERVE_TRAINING_HARD.A.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.composed.earnest[1]`: …申し訳ありません。私の判断が行きすぎていました。

### resultLeader.OBSERVE_TRAINING_HARD.A.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.composed.emotional[1]`: …社長…そうですね。…私が、追い込みすぎていました。

### resultLeader.OBSERVE_TRAINING_HARD.A.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.composed.shy[1]`: …はい…申し訳ない、です。緩めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.bold[1]`: …承知いたしましたわ。怪我は本末転倒ですものね、緩めますわ。

### resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.introverted[1]`: …はい、…緩めますわ。

### resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.carefree[1]`: あら、見ていらしたの? では緩めますわ〜。

### resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.earnest[1]`: …申し訳ありませんわ。わたくしの判断が行きすぎましたわ。

### resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.emotional[1]`: …社長…そうですの。…わたくしが、追い込みすぎましたわ。

### resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.ojousama.shy[1]`: …はい…ごめんなさいませ、加減いたしますわ。

### resultLeader.OBSERVE_TRAINING_HARD.A.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.polite.bold[1]`: …承知しました。怪我させては元も子もありません。緩めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.polite.introverted[1]`: …はい、…加減します。

### resultLeader.OBSERVE_TRAINING_HARD.A.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.polite.carefree[1]`: えぇ〜、これくらい大丈夫だと思ったんですけど〜。緩めますね〜。

### resultLeader.OBSERVE_TRAINING_HARD.A.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.polite.earnest[1]`: …申し訳ありません。私の判断が、行きすぎていました。

### resultLeader.OBSERVE_TRAINING_HARD.A.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.polite.emotional[1]`: …社長…そうですね。…私の追い込みが、過ぎていました。

### resultLeader.OBSERVE_TRAINING_HARD.A.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.polite.shy[1]`: …はい…ごめんなさい、加減します。

### resultLeader.OBSERVE_TRAINING_HARD.A.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.seductive.bold[1]`: …そうね、緩めるね。怪我させたくないし。

### resultLeader.OBSERVE_TRAINING_HARD.A.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.seductive.introverted[1]`: …はい、…加減します。

### resultLeader.OBSERVE_TRAINING_HARD.A.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.seductive.carefree[1]`: あら、これくらい平気なんだけどな〜。じゃ、緩めますね。

### resultLeader.OBSERVE_TRAINING_HARD.A.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.seductive.earnest[1]`: …ごめんなさい。私の判断が行きすぎてました。

### resultLeader.OBSERVE_TRAINING_HARD.A.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.seductive.emotional[1]`: …社長…そう、ですか。…私が追い込みすぎてた。

### resultLeader.OBSERVE_TRAINING_HARD.A.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.seductive.shy[1]`: …はい…ごめんなさい、加減します。

### resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.bold[1]`: …っす、わかりました。怪我さしたら意味ないっすね。緩めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.introverted[1]`: …っす。…加減します。

### resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.carefree[1]`: えぇ〜、これくらいいけるんすけどな〜。はい、緩めまっす。

### resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.earnest[1]`: …っす、すんません。あたしの判断が行きすぎたっす。

### resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.emotional[1]`: …社長、すんません。…あたし、追い込みすぎたっす。

### resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.delinquent.shy[1]`: …っす…ごめんなさい、加減します。

### resultLeader.OBSERVE_TRAINING_HARD.A.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.cool.bold[1]`: …承知。緩めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.cool.introverted[1]`: …はい、加減します。

### resultLeader.OBSERVE_TRAINING_HARD.A.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.cool.carefree[1]`: わかりました。緩めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.cool.earnest[1]`: …申し訳ありません。判断を改めます。

### resultLeader.OBSERVE_TRAINING_HARD.A.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.cool.emotional[1]`: …社長、…私が、追い込みすぎていました。

### resultLeader.OBSERVE_TRAINING_HARD.A.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.A.cool.shy[1]`: …はい…加減します。

### resultLeader.OBSERVE_TRAINING_HARD.B.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.normal.bold[1]`: …ありがとうございます。このままで大丈夫です。

### resultLeader.OBSERVE_TRAINING_HARD.B.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.normal.introverted[1]`: …ありがとうございます。…見守ってください。

### resultLeader.OBSERVE_TRAINING_HARD.B.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.normal.carefree[1]`: お、続けていいんですね〜! やった〜。

### resultLeader.OBSERVE_TRAINING_HARD.B.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.normal.earnest[1]`: …ありがとうございます。責任は私が持ちます。

### resultLeader.OBSERVE_TRAINING_HARD.B.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.normal.emotional[1]`: …ありがとうございます。やり切らせてください。

### resultLeader.OBSERVE_TRAINING_HARD.B.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.OBSERVE_TRAINING_HARD.B.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.composed.bold[1]`: …ありがとうございます。このまま続けます。

### resultLeader.OBSERVE_TRAINING_HARD.B.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.composed.introverted[1]`: …ありがとうございます。…見守ってください。

### resultLeader.OBSERVE_TRAINING_HARD.B.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.composed.carefree[1]`: ありがとうございます〜。続けますね。

### resultLeader.OBSERVE_TRAINING_HARD.B.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.composed.earnest[1]`: …ありがとうございます。責任は私が持ちます。

### resultLeader.OBSERVE_TRAINING_HARD.B.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.composed.emotional[1]`: …ありがとうございます。やり切らせてください。

### resultLeader.OBSERVE_TRAINING_HARD.B.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.composed.shy[1]`: …ありがとうございます。…続けます。

### resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.bold[1]`: …ありがとうございますわ。このまま続けますわ。

### resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.introverted[1]`: …ありがとうございますわ。…見守ってくださいませ。

### resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.carefree[1]`: まあ、続けていいんですの? ありがとうございますわ〜。

### resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.earnest[1]`: …ありがとうございますわ。責任はわたくしが持ちますわ。

### resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.emotional[1]`: …ありがとうございますわ。やり切らせてくださいませ。

### resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.ojousama.shy[1]`: …ありがとうございますわ。…続けます、わ。

### resultLeader.OBSERVE_TRAINING_HARD.B.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.polite.bold[1]`: …ありがとうございます。このまま続けさせていただきます。

### resultLeader.OBSERVE_TRAINING_HARD.B.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.polite.introverted[1]`: …ありがとうございます。…見守ってください。

### resultLeader.OBSERVE_TRAINING_HARD.B.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.polite.carefree[1]`: わ、続けていいんですか〜! ありがとうございます〜。

### resultLeader.OBSERVE_TRAINING_HARD.B.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.polite.earnest[1]`: …ありがとうございます。責任は私が持たせていただきます。

### resultLeader.OBSERVE_TRAINING_HARD.B.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.polite.emotional[1]`: …ありがとうございます。やり切らせてください。

### resultLeader.OBSERVE_TRAINING_HARD.B.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.polite.shy[1]`: …はい…ありがとうございます。…続けます。

### resultLeader.OBSERVE_TRAINING_HARD.B.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.seductive.bold[1]`: …ありがとう、社長。このまま続けるね。

### resultLeader.OBSERVE_TRAINING_HARD.B.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.seductive.introverted[1]`: …ありがとうございます。…続けます。

### resultLeader.OBSERVE_TRAINING_HARD.B.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.seductive.carefree[1]`: お〜、続けていいの? やった〜!

### resultLeader.OBSERVE_TRAINING_HARD.B.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.seductive.earnest[1]`: …社長、ありがとうございます。責任は私が持ちます。

### resultLeader.OBSERVE_TRAINING_HARD.B.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.seductive.emotional[1]`: …社長…ありがとう。やり切らせてください。

### resultLeader.OBSERVE_TRAINING_HARD.B.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.seductive.shy[1]`: …ありがとうございます。…続けます。

### resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.bold[1]`: …っす、ありがとうございます。このままいきます。

### resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.introverted[1]`: …っす。続けます。

### resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.carefree[1]`: お〜、続けていいんすか〜! やった〜!

### resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.earnest[1]`: …社長、ありがとうございます。責任はあたしが持ちます。

### resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.emotional[1]`: …社長、ありがとうございます。やり切らせてください。

### resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.B.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.cool.bold[1]`: …ありがとうございます。続けます。

### resultLeader.OBSERVE_TRAINING_HARD.B.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.cool.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.B.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.cool.carefree[1]`: ありがとうございます。続けます。

### resultLeader.OBSERVE_TRAINING_HARD.B.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.cool.earnest[1]`: …ありがとうございます。責任は私が持ちます。

### resultLeader.OBSERVE_TRAINING_HARD.B.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.cool.emotional[1]`: …ありがとうございます。やり切ります。

### resultLeader.OBSERVE_TRAINING_HARD.B.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.B.cool.shy[1]`: …ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.normal.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.normal.bold[1]`: …そっちですか。下の子の負担を見てくださって、ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.normal.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.normal.introverted[1]`: …ありがとうございます。…下の子、限界が近かったかもしれません。

### resultLeader.OBSERVE_TRAINING_HARD.C.normal.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.normal.carefree[1]`: あれ、私じゃなくて子たち優先? まあ、ありがたいですけど〜。

### resultLeader.OBSERVE_TRAINING_HARD.C.normal.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.normal.earnest[1]`: …ありがとうございます。私が見落としていた負担を、社長に拾っていただいて。

### resultLeader.OBSERVE_TRAINING_HARD.C.normal.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.normal.emotional[1]`: …社長…ありがとうございます。私、見えてなかったです。

### resultLeader.OBSERVE_TRAINING_HARD.C.normal.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.composed.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.composed.bold[1]`: …なるほど、下の子のケアですか。ありがたく頂戴します。

### resultLeader.OBSERVE_TRAINING_HARD.C.composed.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.composed.introverted[1]`: …ありがとうございます。…下の子、限界が近かったかもしれません。

### resultLeader.OBSERVE_TRAINING_HARD.C.composed.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.composed.carefree[1]`: ふむ、私じゃなくて子たち優先ですか〜。ありがたいです。

### resultLeader.OBSERVE_TRAINING_HARD.C.composed.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.composed.earnest[1]`: …ありがとうございます。私が見落としていた負担を、社長に拾っていただいて。

### resultLeader.OBSERVE_TRAINING_HARD.C.composed.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.composed.emotional[1]`: …社長…ありがとうございます。私、見えていませんでした。

### resultLeader.OBSERVE_TRAINING_HARD.C.composed.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.composed.shy[1]`: …ありがとうございます。…申し訳ない、です。

### resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.bold[1]`: …まあ、下の子のケアですのね。ありがたく頂戴いたしますわ。

### resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.introverted[1]`: …ありがとうございますわ。…下の子、限界が近かったのかもしれませんわ。

### resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.carefree[1]`: あら、わたくしより皆優先ですの? ありがたいですわ〜。

### resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.earnest[1]`: …社長、ご配慮痛み入りますわ。

### resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.emotional[1]`: …社長、そのお心遣い…胸に染みますわ。

### resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.ojousama.shy[1]`: …ありがとうございますわ。…申し訳ない、ですわ。

### resultLeader.OBSERVE_TRAINING_HARD.C.polite.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.polite.bold[1]`: …なるほど、下の子のケアですか。ありがたく承ります。

### resultLeader.OBSERVE_TRAINING_HARD.C.polite.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.polite.introverted[1]`: …ありがとうございます。…下の子、限界が近かったかもしれません。

### resultLeader.OBSERVE_TRAINING_HARD.C.polite.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.polite.carefree[1]`: あれ、私じゃなくて子たち優先ですか〜? ありがたいです〜。

### resultLeader.OBSERVE_TRAINING_HARD.C.polite.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.polite.earnest[1]`: …ご配慮、ありがとうございます。私が見落としていた負担を、社長に拾っていただいて。

### resultLeader.OBSERVE_TRAINING_HARD.C.polite.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.polite.emotional[1]`: …社長…ありがとうございます。私、見えていませんでした。

### resultLeader.OBSERVE_TRAINING_HARD.C.polite.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.polite.shy[1]`: …あの、ありがとうございます。…嬉しいです。

### resultLeader.OBSERVE_TRAINING_HARD.C.seductive.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.seductive.bold[1]`: …そう、子たち優先ね。ありがとう。

### resultLeader.OBSERVE_TRAINING_HARD.C.seductive.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.seductive.introverted[1]`: …ありがとうございます。…下の子、限界近かったかも。

### resultLeader.OBSERVE_TRAINING_HARD.C.seductive.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.seductive.carefree[1]`: あら、私じゃなくて子たち? まあ、ありがたいですけどね〜。

### resultLeader.OBSERVE_TRAINING_HARD.C.seductive.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.seductive.earnest[1]`: …ご配慮、ありがとうございます。私の見落とし、拾ってくれて。

### resultLeader.OBSERVE_TRAINING_HARD.C.seductive.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.seductive.emotional[1]`: …社長…ありがとう。私、見えてなかった。

### resultLeader.OBSERVE_TRAINING_HARD.C.seductive.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.seductive.shy[1]`: …ありがとうございます。…嬉しい、です。

### resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.bold[1]`: …っす、子たち優先っすか。ありがたいっす。

### resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.introverted[1]`: …っす。下の子、限界近かったかもしれないっす。

### resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.carefree[1]`: あれ、あたしじゃなくて子たち優先っすか〜? まあありがたいっす。

### resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.earnest[1]`: …社長、配慮どうもっす。あたしの見落とし、拾ってくれて。

### resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.emotional[1]`: …社長、ありがとうございます。あたし、見えてなかったっす。

### resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.cool.bold[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.cool.bold[1]`: …承知。下の子のケア、ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.cool.introverted[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.cool.introverted[1]`: …ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.cool.carefree[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.cool.carefree[1]`: ふぅん、そっちですか。ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.cool.earnest[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.cool.earnest[1]`: …ご配慮、ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.cool.emotional[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.cool.emotional[1]`: …社長、ありがとうございます。

### resultLeader.OBSERVE_TRAINING_HARD.C.cool.shy[]

- `F07_LINES.resultLeader.OBSERVE_TRAINING_HARD.C.cool.shy[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.A.normal.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.normal.bold[1]`: …そうですね、注意します。

### resultLeader.INCIDENT_BOUNDARY.A.normal.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.normal.introverted[1]`: …はい、すみません。

### resultLeader.INCIDENT_BOUNDARY.A.normal.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.normal.carefree[1]`: あ、そっか〜、気をつけまーす。

### resultLeader.INCIDENT_BOUNDARY.A.normal.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.normal.earnest[1]`: …申し訳ありません、配慮が足りませんでした。

### resultLeader.INCIDENT_BOUNDARY.A.normal.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.normal.emotional[1]`: …そうですね、悪かったです。

### resultLeader.INCIDENT_BOUNDARY.A.normal.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.normal.shy[1]`: …はい…ごめんなさい。

### resultLeader.INCIDENT_BOUNDARY.A.composed.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.composed.bold[1]`: …承知しました、注意します。

### resultLeader.INCIDENT_BOUNDARY.A.composed.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.composed.introverted[1]`: …はい、…気をつけます。

### resultLeader.INCIDENT_BOUNDARY.A.composed.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.composed.carefree[1]`: あらら、配慮足りませんでしたね〜。気をつけます。

### resultLeader.INCIDENT_BOUNDARY.A.composed.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.composed.earnest[1]`: …申し訳ありません、配慮が足りませんでした。

### resultLeader.INCIDENT_BOUNDARY.A.composed.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.composed.emotional[1]`: …そうですね、…悪かったです。

### resultLeader.INCIDENT_BOUNDARY.A.composed.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.composed.shy[1]`: …はい…申し訳ない、です。

### resultLeader.INCIDENT_BOUNDARY.A.ojousama.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.ojousama.bold[1]`: …そうですの、気をつけますわ。

### resultLeader.INCIDENT_BOUNDARY.A.ojousama.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.ojousama.introverted[1]`: …はい、…失礼いたしましたわ。

### resultLeader.INCIDENT_BOUNDARY.A.ojousama.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.ojousama.carefree[1]`: あら、配慮が足りませんでしたわね〜。気をつけますわ。

### resultLeader.INCIDENT_BOUNDARY.A.ojousama.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.ojousama.earnest[1]`: …申し訳ありませんわ、心がけを改めますわ。

### resultLeader.INCIDENT_BOUNDARY.A.ojousama.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.ojousama.emotional[1]`: …そうですの、…申し訳ありませんわ。

### resultLeader.INCIDENT_BOUNDARY.A.ojousama.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.ojousama.shy[1]`: …はい…ごめんなさいませ。

### resultLeader.INCIDENT_BOUNDARY.A.polite.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.polite.bold[1]`: …承知しました。気をつけます。

### resultLeader.INCIDENT_BOUNDARY.A.polite.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.polite.introverted[1]`: …はい、申し訳ありません。

### resultLeader.INCIDENT_BOUNDARY.A.polite.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.polite.carefree[1]`: あ、配慮足りなかったですか〜。気をつけます〜。

### resultLeader.INCIDENT_BOUNDARY.A.polite.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.polite.earnest[1]`: …申し訳ありません、配慮が至りませんでした。

### resultLeader.INCIDENT_BOUNDARY.A.polite.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.polite.emotional[1]`: …そうですね、…申し訳ありません。

### resultLeader.INCIDENT_BOUNDARY.A.polite.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.polite.shy[1]`: …はい…ごめんなさい。

### resultLeader.INCIDENT_BOUNDARY.A.seductive.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.seductive.bold[1]`: …そう、気をつけるね。

### resultLeader.INCIDENT_BOUNDARY.A.seductive.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.seductive.introverted[1]`: …はい、…気をつけます。

### resultLeader.INCIDENT_BOUNDARY.A.seductive.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.seductive.carefree[1]`: あら、配慮足りなかった? 気をつけるね〜。

### resultLeader.INCIDENT_BOUNDARY.A.seductive.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.seductive.earnest[1]`: …ごめんなさい、配慮が足りませんでした。

### resultLeader.INCIDENT_BOUNDARY.A.seductive.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.seductive.emotional[1]`: …そうね、…悪かった。

### resultLeader.INCIDENT_BOUNDARY.A.seductive.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.seductive.shy[1]`: …はい…ごめんなさい。

### resultLeader.INCIDENT_BOUNDARY.A.delinquent.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.delinquent.bold[1]`: …っす、わかりました。気をつけます。

### resultLeader.INCIDENT_BOUNDARY.A.delinquent.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.delinquent.introverted[1]`: …っす、すんません。

### resultLeader.INCIDENT_BOUNDARY.A.delinquent.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.delinquent.carefree[1]`: あ、そっかぁ〜、気をつけまっす。

### resultLeader.INCIDENT_BOUNDARY.A.delinquent.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.delinquent.earnest[1]`: …っす、すんません、配慮足りなかったっす。

### resultLeader.INCIDENT_BOUNDARY.A.delinquent.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.delinquent.emotional[1]`: …っ、そうっすね、…悪かったっす。

### resultLeader.INCIDENT_BOUNDARY.A.delinquent.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.delinquent.shy[1]`: …っす…ごめんなさい。

### resultLeader.INCIDENT_BOUNDARY.A.cool.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.cool.bold[1]`: …承知。気をつけます。

### resultLeader.INCIDENT_BOUNDARY.A.cool.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.cool.introverted[1]`: …はい、わかりました。

### resultLeader.INCIDENT_BOUNDARY.A.cool.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.cool.carefree[1]`: わかりました、気をつけます。

### resultLeader.INCIDENT_BOUNDARY.A.cool.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.cool.earnest[1]`: …申し訳ありません、改めます。

### resultLeader.INCIDENT_BOUNDARY.A.cool.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.cool.emotional[1]`: …そうですね、悪かったです。

### resultLeader.INCIDENT_BOUNDARY.A.cool.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.A.cool.shy[1]`: …はい…ごめんなさい。

### resultLeader.INCIDENT_BOUNDARY.B.normal.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.normal.bold[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.normal.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.normal.introverted[1]`: …はい。

### resultLeader.INCIDENT_BOUNDARY.B.normal.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.normal.carefree[1]`: ありがとうございま〜す。

### resultLeader.INCIDENT_BOUNDARY.B.normal.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.normal.earnest[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.normal.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.normal.emotional[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.normal.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.normal.shy[1]`: …はい…。

### resultLeader.INCIDENT_BOUNDARY.B.composed.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.composed.bold[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.composed.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.composed.introverted[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.composed.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.composed.carefree[1]`: ありがとうございます〜。

### resultLeader.INCIDENT_BOUNDARY.B.composed.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.composed.earnest[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.composed.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.composed.emotional[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.composed.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.composed.shy[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.ojousama.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.ojousama.bold[1]`: …ありがとうございますわ。

### resultLeader.INCIDENT_BOUNDARY.B.ojousama.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.ojousama.introverted[1]`: …ありがとうございますわ。

### resultLeader.INCIDENT_BOUNDARY.B.ojousama.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.ojousama.carefree[1]`: ありがとうございますわ〜。

### resultLeader.INCIDENT_BOUNDARY.B.ojousama.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.ojousama.earnest[1]`: …ありがとうございますわ。

### resultLeader.INCIDENT_BOUNDARY.B.ojousama.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.ojousama.emotional[1]`: …ありがとうございますわ。

### resultLeader.INCIDENT_BOUNDARY.B.ojousama.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.ojousama.shy[1]`: …ありがとうございますわ。

### resultLeader.INCIDENT_BOUNDARY.B.polite.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.polite.bold[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.polite.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.polite.introverted[1]`: …はい、ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.polite.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.polite.carefree[1]`: ありがとうございます〜。

### resultLeader.INCIDENT_BOUNDARY.B.polite.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.polite.earnest[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.polite.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.polite.emotional[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.polite.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.polite.shy[1]`: …はい…ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.seductive.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.seductive.bold[1]`: …ありがとう、社長。

### resultLeader.INCIDENT_BOUNDARY.B.seductive.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.seductive.introverted[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.seductive.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.seductive.carefree[1]`: ありがとうございます〜。

### resultLeader.INCIDENT_BOUNDARY.B.seductive.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.seductive.earnest[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.seductive.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.seductive.emotional[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.seductive.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.seductive.shy[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.delinquent.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.delinquent.bold[1]`: …っす、ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.delinquent.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.delinquent.introverted[1]`: …っす。

### resultLeader.INCIDENT_BOUNDARY.B.delinquent.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.delinquent.carefree[1]`: ありがとうござ〜っす。

### resultLeader.INCIDENT_BOUNDARY.B.delinquent.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.delinquent.earnest[1]`: …っす、ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.delinquent.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.delinquent.emotional[1]`: …っす、ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.delinquent.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.delinquent.shy[1]`: …っす…ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.cool.bold[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.cool.bold[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.cool.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.cool.introverted[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.cool.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.cool.carefree[1]`: ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.cool.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.cool.earnest[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.cool.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.cool.emotional[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BOUNDARY.B.cool.shy[]

- `F07_LINES.resultLeader.INCIDENT_BOUNDARY.B.cool.shy[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BONDING.A.normal.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.normal.bold[1]`: …そうですね、配慮が足りませんでした。次は声をかけます。

### resultLeader.INCIDENT_BONDING.A.normal.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.normal.introverted[1]`: …はい、すみません。…悪気は、なかったんですけど。

### resultLeader.INCIDENT_BONDING.A.normal.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.normal.carefree[1]`: え、そんなに気にしてました? ごめんなさ〜い、次は誘いますって。

### resultLeader.INCIDENT_BONDING.A.normal.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.normal.earnest[1]`: …申し訳ありません。輪の外にいる子の気持ち、見えてませんでした。

### resultLeader.INCIDENT_BONDING.A.normal.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.normal.emotional[1]`: …ああ、…そう、ですか。…悪いことしました。

### resultLeader.INCIDENT_BONDING.A.normal.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.normal.shy[1]`: …ごめんなさい…次は、声、かけます。

### resultLeader.INCIDENT_BONDING.A.composed.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.composed.bold[1]`: …承知しました、次は声をかけます。

### resultLeader.INCIDENT_BONDING.A.composed.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.composed.introverted[1]`: …はい、…悪気はなかったんですが、配慮が足りませんでした。

### resultLeader.INCIDENT_BONDING.A.composed.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.composed.carefree[1]`: あらら、気にしてましたか〜。次は誘いますね。

### resultLeader.INCIDENT_BONDING.A.composed.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.composed.earnest[1]`: …申し訳ありません。輪の外にいる子の気持ち、見えていませんでした。

### resultLeader.INCIDENT_BONDING.A.composed.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.composed.emotional[1]`: …ああ、…そうでしたか。…悪いことをしました。

### resultLeader.INCIDENT_BONDING.A.composed.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.composed.shy[1]`: …ごめんなさい…次は、声をかけます。

### resultLeader.INCIDENT_BONDING.A.ojousama.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.ojousama.bold[1]`: …そうですの、次はお声をかけますわ。

### resultLeader.INCIDENT_BONDING.A.ojousama.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.ojousama.introverted[1]`: …はい、…悪気はなかったのですけれど、申し訳ありませんわ。

### resultLeader.INCIDENT_BONDING.A.ojousama.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.ojousama.carefree[1]`: あら、気にしてらしたの? 次はお誘いしますわ〜。

### resultLeader.INCIDENT_BONDING.A.ojousama.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.ojousama.earnest[1]`: …申し訳ありませんわ。輪の外の子のお気持ち、見えてませんでしたわ。

### resultLeader.INCIDENT_BONDING.A.ojousama.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.ojousama.emotional[1]`: …ああ、…そうでしたの。…悪いことをいたしましたわ。

### resultLeader.INCIDENT_BONDING.A.ojousama.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.ojousama.shy[1]`: …ごめんなさいませ…次は、お声がけ、いたしますわ。

### resultLeader.INCIDENT_BONDING.A.polite.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.polite.bold[1]`: …承知しました、次はお声をかけさせていただきます。

### resultLeader.INCIDENT_BONDING.A.polite.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.polite.introverted[1]`: …はい、申し訳ありません。…悪気はなかったんですが。

### resultLeader.INCIDENT_BONDING.A.polite.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.polite.carefree[1]`: え、気にされてました〜? ごめんなさい、次は誘いますね〜。

### resultLeader.INCIDENT_BONDING.A.polite.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.polite.earnest[1]`: …申し訳ありません。輪の外にいる子のお気持ち、見えていませんでした。

### resultLeader.INCIDENT_BONDING.A.polite.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.polite.emotional[1]`: …ああ、…そうでしたか。…申し訳ありませんでした。

### resultLeader.INCIDENT_BONDING.A.polite.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.polite.shy[1]`: …ごめんなさい…次は、声、かけます。

### resultLeader.INCIDENT_BONDING.A.seductive.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.seductive.bold[1]`: …そう、次は声かけるね。ごめんなさい。

### resultLeader.INCIDENT_BONDING.A.seductive.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.seductive.introverted[1]`: …はい、…悪気はなかったんです。次は、声、かけます。

### resultLeader.INCIDENT_BONDING.A.seductive.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.seductive.carefree[1]`: あら、気にしてた? ごめん、次は誘うね〜。

### resultLeader.INCIDENT_BONDING.A.seductive.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.seductive.earnest[1]`: …ごめんなさい。輪の外にいる子の気持ち、見えてなかった。

### resultLeader.INCIDENT_BONDING.A.seductive.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.seductive.emotional[1]`: …ああ、…そう、だったんですね。…悪いことをした。

### resultLeader.INCIDENT_BONDING.A.seductive.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.seductive.shy[1]`: …ごめんなさい…次は、声、かけます。

### resultLeader.INCIDENT_BONDING.A.delinquent.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.delinquent.bold[1]`: …っす、わかりました。次は声かけます。

### resultLeader.INCIDENT_BONDING.A.delinquent.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.delinquent.introverted[1]`: …っす、すんません。…悪気はなかったんすけど。

### resultLeader.INCIDENT_BONDING.A.delinquent.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.delinquent.carefree[1]`: え、気にしてました? ごめんなさ〜い、次は誘いますんで〜。

### resultLeader.INCIDENT_BONDING.A.delinquent.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.delinquent.earnest[1]`: …っす、すんません。輪の外にいる子の気持ち、見えてなかったっす。

### resultLeader.INCIDENT_BONDING.A.delinquent.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.delinquent.emotional[1]`: …っ、そうっすか。…悪いことしたっす。

### resultLeader.INCIDENT_BONDING.A.delinquent.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.delinquent.shy[1]`: …っす…ごめんなさい。次は、声、かけます。

### resultLeader.INCIDENT_BONDING.A.cool.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.cool.bold[1]`: …承知。次は声をかけます。

### resultLeader.INCIDENT_BONDING.A.cool.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.cool.introverted[1]`: …はい、わかりました。

### resultLeader.INCIDENT_BONDING.A.cool.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.cool.carefree[1]`: わかりました、次は誘います。

### resultLeader.INCIDENT_BONDING.A.cool.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.cool.earnest[1]`: …申し訳ありません、配慮が足りませんでした。

### resultLeader.INCIDENT_BONDING.A.cool.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.cool.emotional[1]`: …そう、ですか。…悪かったです。

### resultLeader.INCIDENT_BONDING.A.cool.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.A.cool.shy[1]`: …ごめんなさい…次は、声、かけます。

### resultLeader.INCIDENT_BONDING.B.normal.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.normal.bold[1]`: …ありがとうございます。仲間内の付き合いも大事ですから。

### resultLeader.INCIDENT_BONDING.B.normal.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.normal.introverted[1]`: …ありがとうございます。…でも、少し、考えます。

### resultLeader.INCIDENT_BONDING.B.normal.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.normal.carefree[1]`: ありがとうございま〜す、楽しんでこまーす。

### resultLeader.INCIDENT_BONDING.B.normal.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.normal.earnest[1]`: …ありがとうございます。いただいた寛容に甘え過ぎないようにします。

### resultLeader.INCIDENT_BONDING.B.normal.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.normal.emotional[1]`: …ありがとうございます。…でも、誰かを置いてけぼりにはしたくないですね。

### resultLeader.INCIDENT_BONDING.B.normal.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.INCIDENT_BONDING.B.composed.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.composed.bold[1]`: …ありがとうございます。仲間内の付き合いも、大事ですから。

### resultLeader.INCIDENT_BONDING.B.composed.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.composed.introverted[1]`: …ありがとうございます。…でも、少し、考えます。

### resultLeader.INCIDENT_BONDING.B.composed.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.composed.carefree[1]`: ありがとうございます〜。楽しんできますね。

### resultLeader.INCIDENT_BONDING.B.composed.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.composed.earnest[1]`: …ありがとうございます。寛容に甘え過ぎないように気をつけます。

### resultLeader.INCIDENT_BONDING.B.composed.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.composed.emotional[1]`: …ありがとうございます。…でも、誰かを置いてけぼりにはしたくないですね。

### resultLeader.INCIDENT_BONDING.B.composed.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.composed.shy[1]`: …ありがとうございます。…でも、少し、考えます。

### resultLeader.INCIDENT_BONDING.B.ojousama.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.ojousama.bold[1]`: …ありがとうございますわ。仲間内のお付き合いも大事ですものね。

### resultLeader.INCIDENT_BONDING.B.ojousama.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.ojousama.introverted[1]`: …ありがとうございますわ。…ですが、少し、考えますわ。

### resultLeader.INCIDENT_BONDING.B.ojousama.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.ojousama.carefree[1]`: ありがとうございますわ〜、楽しんで参りますわ。

### resultLeader.INCIDENT_BONDING.B.ojousama.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.ojousama.earnest[1]`: …ありがとうございますわ。寛容に甘え過ぎぬよう気をつけますわ。

### resultLeader.INCIDENT_BONDING.B.ojousama.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.ojousama.emotional[1]`: …ありがとうございますわ。…でも、誰かを置き去りにはいたしませんわ。

### resultLeader.INCIDENT_BONDING.B.ojousama.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.ojousama.shy[1]`: …ありがとうございますわ。…ですが、少し、考えますわ。

### resultLeader.INCIDENT_BONDING.B.polite.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.polite.bold[1]`: …ありがとうございます。仲間内の付き合いも大切にします。

### resultLeader.INCIDENT_BONDING.B.polite.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.polite.introverted[1]`: …ありがとうございます。…でも、少し、考えさせていただきます。

### resultLeader.INCIDENT_BONDING.B.polite.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.polite.carefree[1]`: ありがとうございます〜! 楽しんできます〜。

### resultLeader.INCIDENT_BONDING.B.polite.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.polite.earnest[1]`: …ありがとうございます。寛容に甘え過ぎないように気をつけます。

### resultLeader.INCIDENT_BONDING.B.polite.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.polite.emotional[1]`: …ありがとうございます。…でも、誰かを置いてけぼりにはしたくないです。

### resultLeader.INCIDENT_BONDING.B.polite.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.polite.shy[1]`: …はい…ありがとうございます。…でも、少し、考えます。

### resultLeader.INCIDENT_BONDING.B.seductive.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.seductive.bold[1]`: …ありがとう。仲間内の付き合いも、大事だからね。

### resultLeader.INCIDENT_BONDING.B.seductive.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.seductive.introverted[1]`: …ありがとうございます。…でも、少し、考えます。

### resultLeader.INCIDENT_BONDING.B.seductive.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.seductive.carefree[1]`: ありがとうございます〜、楽しんできますね。

### resultLeader.INCIDENT_BONDING.B.seductive.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.seductive.earnest[1]`: …ありがとうございます。甘え過ぎないようにします。

### resultLeader.INCIDENT_BONDING.B.seductive.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.seductive.emotional[1]`: …ありがとうございます。…でも、誰かを置いてけぼりにはしたくないな。

### resultLeader.INCIDENT_BONDING.B.seductive.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.seductive.shy[1]`: …ありがとうございます。…でも、少し、考えます。

### resultLeader.INCIDENT_BONDING.B.delinquent.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.delinquent.bold[1]`: …っす、ありがとうございます。仲間内の付き合いも大事っすから。

### resultLeader.INCIDENT_BONDING.B.delinquent.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.delinquent.introverted[1]`: …っす、ありがとうございます。…でも、少し、考えます。

### resultLeader.INCIDENT_BONDING.B.delinquent.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.delinquent.carefree[1]`: ありがとうござ〜っす、楽しんできまっす。

### resultLeader.INCIDENT_BONDING.B.delinquent.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.delinquent.earnest[1]`: …っす、ありがとうございます。甘え過ぎないっす。

### resultLeader.INCIDENT_BONDING.B.delinquent.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.delinquent.emotional[1]`: …っす、ありがとうございます。…でも、誰か置いてくのは、嫌っすね。

### resultLeader.INCIDENT_BONDING.B.delinquent.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.delinquent.shy[1]`: …っす…ありがとうございます。…でも、考えます。

### resultLeader.INCIDENT_BONDING.B.cool.bold[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.cool.bold[1]`: …ありがとうございます。

### resultLeader.INCIDENT_BONDING.B.cool.introverted[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.cool.introverted[1]`: …ありがとうございます。…でも、少し、考えます。

### resultLeader.INCIDENT_BONDING.B.cool.carefree[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.cool.carefree[1]`: ありがとうございます。

### resultLeader.INCIDENT_BONDING.B.cool.earnest[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.cool.earnest[1]`: …ありがとうございます。甘え過ぎないようにします。

### resultLeader.INCIDENT_BONDING.B.cool.emotional[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.cool.emotional[1]`: …ありがとうございます。…でも、誰かを置いていきたくはないです。

### resultLeader.INCIDENT_BONDING.B.cool.shy[]

- `F07_LINES.resultLeader.INCIDENT_BONDING.B.cool.shy[1]`: …ありがとうございます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.bold[1]`: …そうですか。営業に響くなら、線は引きます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.introverted[1]`: …はい、わかりました。…やりすぎ、でしたね。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.carefree[1]`: えぇ〜、客もノッてたじゃないですか〜。…はーい、控えまーす。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.earnest[1]`: …申し訳ありません。リングの外にまで持ち込むのは、確かに行きすぎでした。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.emotional[1]`: …そう、ですか。…私の熱、しまいます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.normal.shy[1]`: …はい…ごめんなさい、控えます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.bold[1]`: …承知しました。営業に響くなら線を引きます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.introverted[1]`: …はい、…やりすぎでした。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.carefree[1]`: あらら、見られてました〜? じゃ、控えますね。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.earnest[1]`: …申し訳ありません。リングの外まで持ち込んだのは行きすぎでした。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.emotional[1]`: …そう、ですか。…私の熱、しまいます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.composed.shy[1]`: …はい…ごめんなさい、控えます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.bold[1]`: …そうですの、営業に響くなら線を引きますわ。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.introverted[1]`: …はい、…やりすぎでしたわ。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.carefree[1]`: あら、見られてましたの? では控えますわ〜。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.earnest[1]`: …申し訳ありませんわ。リングの外にまで持ち込むのは、行きすぎでしたわ。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.emotional[1]`: …そうですの、…わたくしの熱、しまいますわ。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.ojousama.shy[1]`: …はい…ごめんなさいませ、控えますわ。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.bold[1]`: …承知しました。営業に響くなら、線を引かせていただきます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.introverted[1]`: …はい、申し訳ありません。…やりすぎでした。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.carefree[1]`: えぇ〜、お客さんノッてたじゃないですか〜。…はい、控えます〜。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.earnest[1]`: …申し訳ありません。リングの外にまで持ち込むのは、行きすぎでした。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.emotional[1]`: …そう、ですか。…私の熱、しまいます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.polite.shy[1]`: …はい…ごめんなさい、控えます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.bold[1]`: …そう、線を引くね。客はノッてたんだけど。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.introverted[1]`: …はい、わかりました。…やりすぎたかな。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.carefree[1]`: えぇ〜、お客さんノッてたのに〜。はい、控えますね。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.earnest[1]`: …ごめんなさい。リング外まで持ち込んだのは、やりすぎでした。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.emotional[1]`: …そう、ですか。…私の熱、しまいます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.seductive.shy[1]`: …はい…ごめんなさい、控えます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.bold[1]`: …っす、わかりました。営業に響くなら線引きます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.introverted[1]`: …っす。…やりすぎたっす。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.carefree[1]`: えぇ〜、客ノッてたじゃないっすか〜。はい、控えまっす。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.earnest[1]`: …っす、すんません。リングの外まで持ち込んだのは行きすぎだったっす。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.emotional[1]`: …っ、そうっすか。…あたしの熱、しまいます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.delinquent.shy[1]`: …っす…ごめんなさい、控えます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.bold[1]`: …承知。線を引きます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.introverted[1]`: …はい、わかりました。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.carefree[1]`: わかりました、控えます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.earnest[1]`: …申し訳ありません、行きすぎでした。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.emotional[1]`: …そう、ですか。…熱、しまいます。

### resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.A.cool.shy[1]`: …はい…ごめんなさい、控えます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.bold[1]`: …ありがとうございます。これも仕事のうちです。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.introverted[1]`: …ありがとうございます。…ヒールの仕事、続けます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.carefree[1]`: やった〜、社長わかってる〜! 引き続き暴れまーす。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.earnest[1]`: …ありがとうございます。役柄の責任、まっとうします。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.emotional[1]`: …ありがとうございます。…私、止まれないですから。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.normal.shy[1]`: …はい…ありがとう、ございます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.bold[1]`: …ありがとうございます。これも仕事のうちです。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.introverted[1]`: …ありがとうございます。…ヒールの仕事、続けます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.carefree[1]`: ありがとうございます〜、引き続きやらせていただきます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.earnest[1]`: …ありがとうございます。役柄の責任、まっとうします。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.emotional[1]`: …ありがとうございます。…私、止まれませんから。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.composed.shy[1]`: …ありがとうございます。…続けます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.bold[1]`: …ありがとうございますわ。これも仕事のうちですもの。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.introverted[1]`: …ありがとうございますわ。…ヒールの仕事、続けますわ。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.carefree[1]`: まあ、ご理解ありがとうございますわ〜。続けますわよ。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.earnest[1]`: …ありがとうございますわ。役柄の責任、まっとういたしますわ。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.emotional[1]`: …ありがとうございますわ。…わたくし、止まれませんわ。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.ojousama.shy[1]`: …ありがとうございますわ。…続けます、わ。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.bold[1]`: …ありがとうございます。これも仕事のうちです。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.introverted[1]`: …ありがとうございます。…ヒールの仕事、続けさせていただきます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.carefree[1]`: わ、社長わかってる〜! 引き続きやらせていただきます〜。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.earnest[1]`: …ありがとうございます。役柄の責任、まっとうします。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.emotional[1]`: …ありがとうございます。…私、止まれないですから。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.polite.shy[1]`: …はい…ありがとうございます。…続けます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.bold[1]`: …ありがとう、社長。これも仕事だからね。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.introverted[1]`: …ありがとうございます。…ヒールの仕事、続けます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.carefree[1]`: やった〜、社長わかってる〜! 引き続き暴れちゃう〜。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.earnest[1]`: …ありがとうございます。役柄の責任、まっとうします。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.emotional[1]`: …ありがとうございます。…私、止まれないから。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.seductive.shy[1]`: …ありがとうございます。…続けます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.bold[1]`: …っす、ありがとうございます。これも仕事のうちっす。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.introverted[1]`: …っす。ヒールの仕事、続けます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.carefree[1]`: やった〜、社長わかってる〜! 引き続き暴れまっす!

### resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.earnest[1]`: …っす、ありがとうございます。役柄の責任、まっとうします。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.emotional[1]`: …っす、ありがとうございます。…あたし、止まれないんすから。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.delinquent.shy[1]`: …っす、ありがとうございます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.bold[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.bold[1]`: …ありがとうございます。仕事です。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.introverted[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.introverted[1]`: …ありがとうございます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.carefree[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.carefree[1]`: ありがとうございます。続けます。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.earnest[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.earnest[1]`: …ありがとうございます。役柄の責任、まっとうします。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.emotional[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.emotional[1]`: …ありがとうございます。…止まれませんから。

### resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.shy[]

- `F07_LINES.resultLeader.INCIDENT_HEEL_PROVOKE.B.cool.shy[1]`: …ありがとうございます。

### resultTarget.OBSERVE_RIVAL_HEAT.A[]

- `F07_LINES.resultTarget.OBSERVE_RIVAL_HEAT.A[1]`: {targetName}は、ほっと息を吐いた。
- `F07_LINES.resultTarget.OBSERVE_RIVAL_HEAT.A[2]`: {targetName}の肩から、ようやく力が抜けた。

### resultTarget.OBSERVE_RIVAL_HEAT.B[]

- `F07_LINES.resultTarget.OBSERVE_RIVAL_HEAT.B[1]`: {targetName}は、何も言わずに視線を落とした。
- `F07_LINES.resultTarget.OBSERVE_RIVAL_HEAT.B[2]`: {targetName}は、小さく唇を噛んだ。

### resultTarget.OBSERVE_RIVAL_HEAT.C[]

- `F07_LINES.resultTarget.OBSERVE_RIVAL_HEAT.C[1]`: {targetName}は、小さく頷いた。
- `F07_LINES.resultTarget.OBSERVE_RIVAL_HEAT.C[2]`: {targetName}は、社長の方をちらりと見て、口元を緩めた。

### resultTarget.INCIDENT_BOUNDARY.A[]

- `F07_LINES.resultTarget.INCIDENT_BOUNDARY.A[1]`: {targetName}の表情が、わずかに緩んだ。
- `F07_LINES.resultTarget.INCIDENT_BOUNDARY.A[2]`: {targetName}は、ロッカーの自分の席に、ようやく腰を下ろせた。

### resultTarget.INCIDENT_BOUNDARY.B[]

- `F07_LINES.resultTarget.INCIDENT_BOUNDARY.B[1]`: {targetName}は、視線を逸らした。
- `F07_LINES.resultTarget.INCIDENT_BOUNDARY.B[2]`: {targetName}は、誰にも気づかれないよう、深く息を吐いた。

### resultTarget.OBSERVE_FAN_PRESSURE.A[]

- `F07_LINES.resultTarget.OBSERVE_FAN_PRESSURE.A[1]`: {factionName}のメンバーが、{leaderName}の表情を見て、安心したように肩を撫で下ろした。

### resultTarget.OBSERVE_FAN_PRESSURE.B[]

- `F07_LINES.resultTarget.OBSERVE_FAN_PRESSURE.B[1]`: {factionName}のメンバーは、{leaderName}の背中を、心配そうに見送った。

### resultTarget.OBSERVE_FAN_PRESSURE.C[]

- `F07_LINES.resultTarget.OBSERVE_FAN_PRESSURE.C[1]`: {factionName}のメンバーは、自分たちの番だ、という顔で頷き合った。

### resultTarget.INCIDENT_BONDING.A[]

- `F07_LINES.resultTarget.INCIDENT_BONDING.A[1]`: {targetName}は、少しだけ顔を上げて、遠くの輪を見ていた。

### resultTarget.INCIDENT_BONDING.B[]

- `F07_LINES.resultTarget.INCIDENT_BONDING.B[1]`: {targetName}は、誰にも見られないように、ロッカーの隅で目を伏せた。

### resultTarget.INCIDENT_HEEL_PROVOKE.A[]

- `F07_LINES.resultTarget.INCIDENT_HEEL_PROVOKE.A[1]`: 観客は、わずかに静かになった。線が引かれた、と気づいた者もいた。

### resultTarget.INCIDENT_HEEL_PROVOKE.B[]

- `F07_LINES.resultTarget.INCIDENT_HEEL_PROVOKE.B[1]`: 客席のヤジは止まらなかった。むしろ、加速した。

## `COMMON1_LINES`

- 出典: `src/data.js`
- コード内コメント: Common-1 派閥内試合提案 セリフテーブル（spec §3） / 引き方: Engine.factions.getCommon1Line(category, ctx) / category: 'coachReport' | 'leaderDemand' | 'resultLeader' | 'resultLoser' / ctx: { archetypeId?, fighter?, choice?, vars? }
- 本数: 50

- `COMMON1_LINES.coachReport.AUTHORITY[1]`: {factionName}内で{aName}と{bName}が肩肘張り合っています。リーダーは実力で示させる構えです。
- `COMMON1_LINES.coachReport.BOND[1]`: {aName}と{bName}、ちょっと意地の張り合いが目立ってきまして……手合わせさせるのもアリかと。
- `COMMON1_LINES.coachReport.MERIT[1]`: {factionName}内の序列確認の話が出ています。{aName}対{bName}、組んでみる価値はあります。
- `COMMON1_LINES.coachReport.HEEL[1]`: {aName}と{bName}が派閥内で潰し合いを始めそうです。客に見せれば化けますよ。
- `COMMON1_LINES.coachReport.FACE[1]`: 切磋琢磨の象徴、ということで{aName}と{bName}を組ませる案が上がっています。
- `COMMON1_LINES.coachReport.COMBAT[1]`: {aName}と{bName}、もう殴り合うしか落とし所がない感じです。
- `COMMON1_LINES.coachReport._any[1]`: {factionName}内で{aName}と{bName}の間に火種があります。試合で清算する手も。
- `COMMON1_LINES.leaderDemand.AUTHORITY.fiery[1]`: 揉めるなら、リングで決める。うちじゃそれが筋だ。
- `COMMON1_LINES.leaderDemand.AUTHORITY.composed[1]`: 揉め事は、リングの上で答えを出す。それがうちの流儀だ。
- `COMMON1_LINES.leaderDemand.AUTHORITY.grudging[1]`: ぐだぐだ言うな。リングで黙らせろ。
- `COMMON1_LINES.leaderDemand.AUTHORITY.airy[1]`: 揉めてるなら、リングで決めちゃお? その方が早いよ。
- `COMMON1_LINES.leaderDemand.AUTHORITY.earnest[1]`: 筋を通すために、リングで結論を出させてください。
- `COMMON1_LINES.leaderDemand.AUTHORITY.flippant[1]`: 口で揉めるくらいなら、さっさとリングでやれっての。
- `COMMON1_LINES.leaderDemand.BOND.fiery[1]`: 仲間同士で燻ってるのは見てられない。組んで、一回出し切ってくれ。
- `COMMON1_LINES.leaderDemand.BOND.composed[1]`: 練習の延長として組みたい。お互い、後に引きずらないでほしい。
- `COMMON1_LINES.leaderDemand.BOND.grudging[1]`: ……身内で揉めるな。組んで、終わらせろ。
- `COMMON1_LINES.leaderDemand.BOND.airy[1]`: 二人とも大事な仲間なんだから、ちゃんと向き合って? お願い。
- `COMMON1_LINES.leaderDemand.BOND.earnest[1]`: 仲間として、まっすぐぶつかってほしいんです。組ませてください。
- `COMMON1_LINES.leaderDemand.BOND.flippant[1]`: 身内ゲンカ、リングで一回スカッとやっちゃおうよ。
- `COMMON1_LINES.leaderDemand.MERIT.fiery[1]`: 序列はリングで決まる。組ませろ、今すぐだ。
- `COMMON1_LINES.leaderDemand.MERIT.composed[1]`: 序列の話、リングで片付ける。組んでくれ。
- `COMMON1_LINES.leaderDemand.MERIT.grudging[1]`: 数字で示せ。話はそれからだ。
- `COMMON1_LINES.leaderDemand.MERIT.airy[1]`: 強い方が前、ってシンプルでいいよね? 組んじゃお。
- `COMMON1_LINES.leaderDemand.MERIT.earnest[1]`: 実力で順番を決めるのが、一番公平だと思います。組ませてください。
- `COMMON1_LINES.leaderDemand.MERIT.flippant[1]`: 口より結果でしょ。組んで、はっきりさせよ。
- `COMMON1_LINES.leaderDemand.HEEL.fiery[1]`: 内輪揉めも興行だ。客の前で潰し合え。
- `COMMON1_LINES.leaderDemand.HEEL.composed[1]`: 身内で潰し合う様こそ、客が見たい光景だ。組ませる。
- `COMMON1_LINES.leaderDemand.HEEL.grudging[1]`: どうせ揉めるなら、金になる場所でやれ。
- `COMMON1_LINES.leaderDemand.HEEL.airy[1]`: うふふ、二人の喧嘩、客に見せちゃおうよ?
- `COMMON1_LINES.leaderDemand.HEEL.earnest[1]`: 見世物として残酷な絵になる。覚悟の上で、組ませてもらいます。
- `COMMON1_LINES.leaderDemand.HEEL.flippant[1]`: 内輪のゴタゴタ、客に売りつけよーぜ。
- `COMMON1_LINES.leaderDemand.FACE.fiery[1]`: 切磋琢磨の象徴として組む。本気でやってくれ。
- `COMMON1_LINES.leaderDemand.FACE.composed[1]`: 切磋琢磨の試合として組みたい。応援してくれる人に恥じない試合を。
- `COMMON1_LINES.leaderDemand.FACE.grudging[1]`: 見せ場として組む。手を抜けば、こっちが許さん。
- `COMMON1_LINES.leaderDemand.FACE.airy[1]`: ファンに頑張ってる二人を見せたいの。組んでくれる?
- `COMMON1_LINES.leaderDemand.FACE.earnest[1]`: 応援してくださる方々に誠実な試合をお見せしたい。組ませてください。
- `COMMON1_LINES.leaderDemand.FACE.flippant[1]`: ファン受けする絵になるっしょ。組んじゃおう。
- `COMMON1_LINES.leaderDemand.COMBAT.fiery[1]`: 口で決まらねぇなら、殴って決めろ。組むぞ。
- `COMMON1_LINES.leaderDemand.COMBAT.composed[1]`: 言葉が尽きたなら、拳で語るしかない。組む。
- `COMMON1_LINES.leaderDemand.COMBAT.grudging[1]`: ごちゃごちゃ言うな。リングで殴り合え。
- `COMMON1_LINES.leaderDemand.COMBAT.airy[1]`: 二人ともムキムキしてるんだもん、リングで発散しちゃお?
- `COMMON1_LINES.leaderDemand.COMBAT.earnest[1]`: 拳でしか伝わらないものがあると思います。組ませてください。
- `COMMON1_LINES.leaderDemand.COMBAT.flippant[1]`: 殴り合った方が早いっしょ、こういうのは。
- `COMMON1_LINES.leaderDemand._any._any[1]`: この件、リングで片付けたい。
- `COMMON1_LINES.resultLeader.A._any[1]`: 組んだ甲斐があった。これで{factionName}は前に進める。
- `COMMON1_LINES.resultLeader.B._any[1]`: カードは別物にした。火種は残ったが、扱い方は俺が見ておく。
- `COMMON1_LINES.resultLeader.C._any[1]`: 静観した。彼女らがどう収めるか、見届けるしかない。
- `COMMON1_LINES.resultLoser.A[1]`: 負けた以上、ここで黙って引き下がるしかない……。
- `COMMON1_LINES.resultLoser.B[1]`: 組まれなかった。気持ちの行き場が、まだ無い。
- `COMMON1_LINES.resultLoser.C[1]`: 誰も止めない。胸の中で、また熱が膨らんだ。

## `COMMON3_LINES`

- 出典: `src/data.js`
- コード内コメント: personality では分けない。性格で分けると同じ archetype のキャラの口調が崩壊する / （お嬢様キャラがタメ口で挨拶、など）ため、archetype に揃える。 / 引き方: Engine.factions.getCommon3Line(category, ctx) / category: 'newcomer' | 'reaction' / ctx (newcomer): { fighter }                          ← fighter.archetype を引く / ctx (reaction): { archetypeId, newcomerFighter }     ← 派閥アーキ × 新人 archetype
- 本数: 57

- `COMMON3_LINES.newcomer.composed[1]`: 世話になる。よろしく頼む。
- `COMMON3_LINES.newcomer.composed[2]`: 足を引っ張らんように、心がけよう。
- `COMMON3_LINES.newcomer.ojousama[1]`: お世話になりますわ。よろしくお願いいたします。
- `COMMON3_LINES.newcomer.ojousama[2]`: 皆様のお力添え、頂戴できれば嬉しゅうございますわ。
- `COMMON3_LINES.newcomer.polite[1]`: お世話になります。よろしくお願いいたします。
- `COMMON3_LINES.newcomer.polite[2]`: 至らぬ点もあるかと存じますが、ご指導お願いいたします。
- `COMMON3_LINES.newcomer.seductive[1]`: よろしくね。仲良く……してくれる?
- `COMMON3_LINES.newcomer.seductive[2]`: ふふ、楽しくなりそうね。
- `COMMON3_LINES.newcomer.delinquent[1]`: ま、よろしく頼むわ。
- `COMMON3_LINES.newcomer.delinquent[2]`: 邪魔はしねぇから、安心してくれよ。
- `COMMON3_LINES.newcomer.cool[1]`: よろしく。
- `COMMON3_LINES.newcomer.cool[2]`: ……結果で示す。
- `COMMON3_LINES.newcomer.normal[1]`: よろしくお願いします。頑張ります。
- `COMMON3_LINES.newcomer.normal[2]`: お世話になります。よろしくお願いします。
- `COMMON3_LINES.reaction.AUTHORITY.composed[1]`: ふむ、来たか。流儀は身体で覚えてもらう。
- `COMMON3_LINES.reaction.AUTHORITY.ojousama[1]`: ようこそ。気品は結構。だが、規律の前では一兵卒だ。
- `COMMON3_LINES.reaction.AUTHORITY.polite[1]`: よろしい。礼儀のある者は伸びる。期待している。
- `COMMON3_LINES.reaction.AUTHORITY.seductive[1]`: 色気で味方を惑わすな。リングでだけ使え。
- `COMMON3_LINES.reaction.AUTHORITY.delinquent[1]`: 突っ張るな。うちの順序を覚えてからだ。
- `COMMON3_LINES.reaction.AUTHORITY.cool[1]`: 無駄口がない、結構。あとは結果で示せ。
- `COMMON3_LINES.reaction.AUTHORITY.normal[1]`: うちの流儀を覚えてもらう。それだけだ。
- `COMMON3_LINES.reaction.BOND.composed[1]`: よく来たね。肩の力、抜いていいよ。
- `COMMON3_LINES.reaction.BOND.ojousama[1]`: うふふ、華があるねぇ。みんなで大事にするよ。
- `COMMON3_LINES.reaction.BOND.polite[1]`: そんなに畏まらないで。ここは家族みたいなもんだから。
- `COMMON3_LINES.reaction.BOND.seductive[1]`: うちはみんな本気で仲良しだから。あなたも溶け込んで。
- `COMMON3_LINES.reaction.BOND.delinquent[1]`: 尖ってんねぇ。でも、うちじゃ独りにはさせないよ。
- `COMMON3_LINES.reaction.BOND.cool[1]`: 無理に喋らなくていい。隣にいるから。
- `COMMON3_LINES.reaction.BOND.normal[1]`: 一緒に頑張ろうね。困ったら言って。
- `COMMON3_LINES.reaction.MERIT.composed[1]`: 言葉は要らん。結果を持ってこい。それだけだ。
- `COMMON3_LINES.reaction.MERIT.ojousama[1]`: 気品も結構。ただし、勝てない上品は退屈だ。
- `COMMON3_LINES.reaction.MERIT.polite[1]`: 謙虚さは武器になる。あとは星を取ってこい。
- `COMMON3_LINES.reaction.MERIT.seductive[1]`: 惑わすのは客だけにしろ。仲間内じゃ通じない。
- `COMMON3_LINES.reaction.MERIT.delinquent[1]`: 威勢があるな。実績で裏付けてみせろ。
- `COMMON3_LINES.reaction.MERIT.cool[1]`: 黙して語らず、結構。リングで吠えろ。
- `COMMON3_LINES.reaction.MERIT.normal[1]`: 実力を見せられるなら、いい。期待してる。
- `COMMON3_LINES.reaction.HEEL.composed[1]`: 落ち着いてやがるな。うちで歪ませてやるよ。
- `COMMON3_LINES.reaction.HEEL.ojousama[1]`: お嬢ちゃんが、なぁ。汚れる覚悟はあるんだろうな?
- `COMMON3_LINES.reaction.HEEL.polite[1]`: 丁寧な悪役、というのも面白い。化けてみろ。
- `COMMON3_LINES.reaction.HEEL.seductive[1]`: いい色気だ。観客を狂わせる側に回れ。
- `COMMON3_LINES.reaction.HEEL.delinquent[1]`: 気が合いそうだ。一緒に悪者になろうぜ。
- `COMMON3_LINES.reaction.HEEL.cool[1]`: 冷たい目だな。気に入った。
- `COMMON3_LINES.reaction.HEEL.normal[1]`: うちの色に染まれるか、見てやる。
- `COMMON3_LINES.reaction.FACE.composed[1]`: よく来てくれた。王道は、静かに歩む者にこそ似合う。
- `COMMON3_LINES.reaction.FACE.ojousama[1]`: ようこそ。気品も、王道の華だ。失わないでくれ。
- `COMMON3_LINES.reaction.FACE.polite[1]`: ようこそ。うちは王道を貫く。あなたもそのつもりで。
- `COMMON3_LINES.reaction.FACE.seductive[1]`: その色気、悪役の道具にせず、観客の歓声に変えてみせろ。
- `COMMON3_LINES.reaction.FACE.delinquent[1]`: 尖ってんな。でも、うちでは正面から殴るぞ?
- `COMMON3_LINES.reaction.FACE.cool[1]`: クールな王道、悪くない。観客を裏切るな。
- `COMMON3_LINES.reaction.FACE.normal[1]`: ようこそ。うちは王道を貫く。あなたもそのつもりで。
- `COMMON3_LINES.reaction.COMBAT.composed[1]`: 落ち着き払ってやがる。リングではそれを捨ててもらう。
- `COMMON3_LINES.reaction.COMBAT.ojousama[1]`: お嬢ちゃん、ここじゃ汗と血だ。覚悟はあるか?
- `COMMON3_LINES.reaction.COMBAT.polite[1]`: 丁寧なのはリング外だけにしとけ。中じゃ殴れ。
- `COMMON3_LINES.reaction.COMBAT.seductive[1]`: 色気もいいが、まずは殴り方からだ。
- `COMMON3_LINES.reaction.COMBAT.delinquent[1]`: 気に入った。明日から拳で語ろうぜ。
- `COMMON3_LINES.reaction.COMBAT.cool[1]`: 黙ってんのはいい。リングじゃ吠えろ。
- `COMMON3_LINES.reaction.COMBAT.normal[1]`: 強くなりたきゃ、うちで殴り合え。
- `COMMON3_LINES.reaction._any[1]`: よろしく。

## `COMMON4_LINES`

- 出典: `src/data.js`
- コード内コメント: Common-4 派閥合宿・慰労会 セリフ&情景テーブル（spec §5） / 引き方: Engine.factions.getCommon4Line(archetypeId) / 返り値: { headline, narration, leaderQuote } / archetype 別のトーンで研修合宿/家族旅行/追い込み合宿/秘密会合/遠征/対外練習を書き分ける。
- 本数: 39

- `COMMON4_LINES.AUTHORITY[1].headline`: 研修合宿
- `COMMON4_LINES.AUTHORITY[1].narration`: 山あいの古い道場を借り切って、夜まで型と所作を叩き直す週となった。リーダーの目が光っている間、誰も笑わない。
- `COMMON4_LINES.AUTHORITY[1].leaderQuote`: うちの看板を背負う以上、立ち姿から仕込み直す。
- `COMMON4_LINES.AUTHORITY[2].headline`: 規律強化合宿
- `COMMON4_LINES.AUTHORITY[2].narration`: 朝五時の点呼から始まり、夜の反省会まで一日が分単位で組まれていた。泣き言は許されない、ただ通すだけだ。
- `COMMON4_LINES.AUTHORITY[2].leaderQuote`: 甘えを残したまま試合場には出さない。
- `COMMON4_LINES.BOND[1].headline`: 家族旅行のような合宿
- `COMMON4_LINES.BOND[1].narration`: 海沿いの民宿で雑魚寝、夜は鍋を囲んで誰かが歌い出した。練習も笑い声と一緒に進む、そんな数日。
- `COMMON4_LINES.BOND[1].leaderQuote`: 一緒に飯食って、一緒に転がるだけで強くなれる気がする。
- `COMMON4_LINES.BOND[2].headline`: 慰労会
- `COMMON4_LINES.BOND[2].narration`: 個室の座敷を貸し切って、ただ笑って食べて飲んだ。仕事の話より、お互いの近況の方が長く続いた。
- `COMMON4_LINES.BOND[2].leaderQuote`: みんないてくれて助かってる。今日くらい、それだけ伝えたかった。
- `COMMON4_LINES.MERIT[1].headline`: 追い込み合宿
- `COMMON4_LINES.MERIT[1].narration`: スパーリング室の壁時計だけが回っている。誰も口を開かず、ただ受けて、返して、転がる。数字でしか測られない数日。
- `COMMON4_LINES.MERIT[1].leaderQuote`: 結果が全部だ。ここで上がらない奴は、本番でも上がらない。
- `COMMON4_LINES.MERIT[2].headline`: OVR 測定合宿
- `COMMON4_LINES.MERIT[2].narration`: 全員のスタッツをコーチが手帳に書き込んでいく。誰の数字が伸びたか、停滞したか、表に並んでいた。
- `COMMON4_LINES.MERIT[2].leaderQuote`: 数字は嘘つかない。次の興行までに、もう一段上げよう。
- `COMMON4_LINES.HEEL[1].headline`: 秘密会合
- `COMMON4_LINES.HEEL[1].narration`: 街外れの貸し切り。電気は最小限、誰が何を話したかは外には出ない。次に何を仕掛けるか、それだけが議題だった。
- `COMMON4_LINES.HEEL[1].leaderQuote`: 次の標的、決めとこうか。誰から壊す?
- `COMMON4_LINES.HEEL[2].headline`: 裏路地の集会
- `COMMON4_LINES.HEEL[2].narration`: 看板のない店の奥で集まり、煙草と酒の匂いの中で次の興行の話をしていた。表には絶対に出ない顔の打ち合わせ。
- `COMMON4_LINES.HEEL[2].leaderQuote`: いい子ぶってる連中が、一番崩しがいがある。
- `COMMON4_LINES.FACE[1].headline`: 地方ファンサービス遠征
- `COMMON4_LINES.FACE[1].narration`: 小さな体育館で握手会と公開練習を兼ねた合宿。子どもたちのサインリクエストに、誰も嫌な顔をしなかった。
- `COMMON4_LINES.FACE[1].leaderQuote`: うちを応援してくれる人たちに、まずは顔を見せに行く。それが先。
- `COMMON4_LINES.FACE[2].headline`: 地域貢献合宿
- `COMMON4_LINES.FACE[2].narration`: 地元の小学校で簡単なプロレス教室を開き、午後は商店街の清掃にまで顔を出した。汗をかく場所が変わっただけだ、と笑っていた。
- `COMMON4_LINES.FACE[2].leaderQuote`: 応援してくれる街に、こっちからも何か返したいだけだよ。
- `COMMON4_LINES.COMBAT[1].headline`: 他団体道場での出稽古
- `COMMON4_LINES.COMBAT[1].narration`: 道着を持ち込んで、知らない選手相手に何本もスパーリングをこなした。痣ばかり増えて帰ってきた、という顔つきだった。
- `COMMON4_LINES.COMBAT[1].leaderQuote`: 同じ相手とばっかり殴り合ってても、強くなれねぇからな。
- `COMMON4_LINES.COMBAT[2].headline`: 対外練習合宿
- `COMMON4_LINES.COMBAT[2].narration`: 別団体の練習生に混じって、朝から晩まで実戦形式の打ち合いに突っ込んだ。誰も加減しない数日が、肌に刻まれた。
- `COMMON4_LINES.COMBAT[2].leaderQuote`: 外の風当たりに当たんねぇと、うちの中身が腐る。
- `COMMON4_LINES._any[1].headline`: 派閥合宿
- `COMMON4_LINES._any[1].narration`: 揃って数日を一緒に過ごした。練習の合間にぽつぽつと、普段は出ない話まで出ていた。
- `COMMON4_LINES._any[1].leaderQuote`: たまにはこういう時間も悪くない。

## `COMMON5_LINES`

- 出典: `src/data.js`
- コード内コメント: Common-5 派閥代表メディア取材 セリフテーブル（spec §6） / 引き方: Engine.factions.getCommon5Line(category, ctx) / category: 'coachReport' | 'leaderQuote' | 'headline' | 'resultLeader' / ctx: { archetypeId?, choice?, fighter? }
- 本数: 52

- `COMMON5_LINES.coachReport.AUTHORITY[1]`: {leaderName}に取材オファーが来ています。掲載媒体は中堅誌です。
- `COMMON5_LINES.coachReport.BOND[1]`: 派閥特集の取材、来てます。{factionName}の家族的な空気を撮りたいそうで。
- `COMMON5_LINES.coachReport.MERIT[1]`: {factionName}の実力主義路線を取り上げたい、という記者からの打診です。
- `COMMON5_LINES.coachReport.HEEL[1]`: 尖った媒体から{factionName}に取材依頼。挑発的な記事になる気配です。
- `COMMON5_LINES.coachReport.FACE[1]`: ファン誌から{factionName}の特集オファー。模範的に対応すれば好感度アップかと。
- `COMMON5_LINES.coachReport.COMBAT[1]`: 格闘専門誌から{leaderName}にインタビュー。次の標的を聞きたいそうです。
- `COMMON5_LINES.coachReport._any[1]`: {factionName}に取材依頼が来ています。
- `COMMON5_LINES.leaderQuoteA.AUTHORITY.fiery[1]`: 「うちに逆らう連中は、リングで黙らせるだけだ」
- `COMMON5_LINES.leaderQuoteA.AUTHORITY.composed[1]`: 「うちには筋がある。そこを乱す者は、誰であれ容赦しない」
- `COMMON5_LINES.leaderQuoteA.AUTHORITY.grudging[1]`: 「ふん、舐められるくらいなら噛み砕く方が早い」
- `COMMON5_LINES.leaderQuoteA.AUTHORITY.airy[1]`: 「うちのルールに従えない子は、ちょっと怖い目に遭うかもね?」
- `COMMON5_LINES.leaderQuoteA.AUTHORITY.earnest[1]`: 「うちの規律を守ることが、選手たちの将来を守ることだと思っています」
- `COMMON5_LINES.leaderQuoteA.AUTHORITY.flippant[1]`: 「歯向かう奴は容赦しない、ってだけの話っしょ?」
- `COMMON5_LINES.leaderQuoteA.BOND.fiery[1]`: 「仲間がいるから戦える。それだけ」
- `COMMON5_LINES.leaderQuoteA.BOND.composed[1]`: 「私たち、家族みたいな組です。それを守りたい」
- `COMMON5_LINES.leaderQuoteA.BOND.grudging[1]`: 「……まあ、こいつらと一緒なら、悪くない」
- `COMMON5_LINES.leaderQuoteA.BOND.airy[1]`: 「えへへ、みんな大好きー!」
- `COMMON5_LINES.leaderQuoteA.BOND.earnest[1]`: 「メンバー一人ひとりを大切にしたい。そう思っています」
- `COMMON5_LINES.leaderQuoteA.BOND.flippant[1]`: 「うちは仲良しグループ。仕事も雑談も同じ温度だよ」
- `COMMON5_LINES.leaderQuoteA.MERIT.fiery[1]`: 「結果を出せない奴に居場所はない。それだけだ」
- `COMMON5_LINES.leaderQuoteA.MERIT.composed[1]`: 「実力で順番が決まる。私はそれを正しいと思っている」
- `COMMON5_LINES.leaderQuoteA.MERIT.grudging[1]`: 「数字で示せ。話はそれからだ」
- `COMMON5_LINES.leaderQuoteA.MERIT.airy[1]`: 「強い子が前に出る、それでいいよね?」
- `COMMON5_LINES.leaderQuoteA.MERIT.earnest[1]`: 「実力主義は冷たく見えますが、誰にとっても公平だと信じています」
- `COMMON5_LINES.leaderQuoteA.MERIT.flippant[1]`: 「弱いまま居られても困るしねー」
- `COMMON5_LINES.leaderQuoteA.HEEL.fiery[1]`: 「ぬるい連中は、全員潰す。覚悟しとけ」
- `COMMON5_LINES.leaderQuoteA.HEEL.composed[1]`: 「綺麗事を並べる団体には、私たちは目障りでしょうね」
- `COMMON5_LINES.leaderQuoteA.HEEL.grudging[1]`: 「ふん、清く正しい連中ほど崩しがいがある」
- `COMMON5_LINES.leaderQuoteA.HEEL.airy[1]`: 「うふふ、あの子たちが泣くまでやめないからね?」
- `COMMON5_LINES.leaderQuoteA.HEEL.earnest[1]`: 「悪役と呼ばれることに、私たちは誇りを持っている」
- `COMMON5_LINES.leaderQuoteA.HEEL.flippant[1]`: 「いい子ぶってる連中、全員ぶっ壊すから」
- `COMMON5_LINES.leaderQuoteA.FACE.fiery[1]`: 「ファンの期待に背中を押されてる。だから倒れない」
- `COMMON5_LINES.leaderQuoteA.FACE.composed[1]`: 「うちは王道を貫きます。それが応援してくれる方への返事です」
- `COMMON5_LINES.leaderQuoteA.FACE.grudging[1]`: 「……まあ、応援してくれる人がいる以上、応えるしかない」
- `COMMON5_LINES.leaderQuoteA.FACE.airy[1]`: 「ファンのみんな、いつもありがとー!」
- `COMMON5_LINES.leaderQuoteA.FACE.earnest[1]`: 「応援してくださる方々の期待に、誠実に応え続けたい」
- `COMMON5_LINES.leaderQuoteA.FACE.flippant[1]`: 「ファンに恥かかせない、それだけ意識してる」
- `COMMON5_LINES.leaderQuoteA.COMBAT.fiery[1]`: 「次に当たる相手は潰す。誰だろうと関係ねぇ」
- `COMMON5_LINES.leaderQuoteA.COMBAT.composed[1]`: 「強い相手と当たるためなら、どこにでも乗り込みます」
- `COMMON5_LINES.leaderQuoteA.COMBAT.grudging[1]`: 「殴り合えば、答えは出る。それだけだ」
- `COMMON5_LINES.leaderQuoteA.COMBAT.airy[1]`: 「強い子と当たれるなら、どこ行ってもいいよー!」
- `COMMON5_LINES.leaderQuoteA.COMBAT.earnest[1]`: 「強敵と戦うことでしか、私たちは成長できないと思っています」
- `COMMON5_LINES.leaderQuoteA.COMBAT.flippant[1]`: 「次の獲物、もう決まってるんで」
- `COMMON5_LINES.headlineA.AUTHORITY[1]`: 「{leaderName}、敵対派閥に宣戦布告」
- `COMMON5_LINES.headlineA.BOND[1]`: 「{factionName}、家族のような結束 ―― 専属密着レポ」
- `COMMON5_LINES.headlineA.MERIT[1]`: 「{factionName} ―― 実力主義の旗を掲げて」
- `COMMON5_LINES.headlineA.HEEL[1]`: 「{factionName}が業界の秩序を破壊する」
- `COMMON5_LINES.headlineA.FACE[1]`: 「{factionName}、王道を貫く ―― ファンへの誓い」
- `COMMON5_LINES.headlineA.COMBAT[1]`: 「{leaderName}、次の標的を名指し」
- `COMMON5_LINES.resultLeader.A._any[1]`: 記事は派手に出た。良くも悪くも{factionName}は注目されている。
- `COMMON5_LINES.resultLeader.B._any[1]`: コーチ同席で無難に切り抜けた。実りはささやかだが、実りはある。
- `COMMON5_LINES.resultLeader.C._any[1]`: 取材は断った。{factionName}は静かなまま、しばらく沈む。

## `COMMON7_LINES`

- 出典: `src/data.js`
- コード内コメント: Common-7 派閥間合同企画 セリフテーブル（spec §7） / 引き方: Engine.factions.getCommon7Line(category, ctx) / category: 'coachReport' | 'leaderAQuote' | 'leaderBQuote' | 'planType' | 'resultLeader'
- 本数: 30

- `COMMON7_LINES.coachReport._any[1]`: {factionAName}と{factionBName}、合同企画の打診が出てます。{planType}の方向で。
- `COMMON7_LINES.planType.BOND_BOND`: 合同合宿・温泉旅行
- `COMMON7_LINES.planType.MERIT_MERIT`: 合同練習会・OVR テスト
- `COMMON7_LINES.planType.HEEL_HEEL`: タッグマッチ興行
- `COMMON7_LINES.planType.FACE_FACE`: チャリティイベント
- `COMMON7_LINES.planType.COMBAT_COMBAT`: エキシビションマッチ
- `COMMON7_LINES.planType.BOND_FACE`: チャリティ興行
- `COMMON7_LINES.planType.FACE_BOND`: チャリティ興行
- `COMMON7_LINES.planType.MERIT_COMBAT`: エキシビションマッチ
- `COMMON7_LINES.planType.COMBAT_MERIT`: エキシビションマッチ
- `COMMON7_LINES.planType.AUTHORITY_COMBAT`: リーダー対決興行
- `COMMON7_LINES.planType.COMBAT_AUTHORITY`: リーダー対決興行
- `COMMON7_LINES.planType._any`: 合同企画
- `COMMON7_LINES.leaderAQuote.AUTHORITY[1]`: 「うちと組むなら、こちらの流儀に合わせてもらう」
- `COMMON7_LINES.leaderAQuote.BOND[1]`: 「一緒に何かできるなら、うちは大歓迎だよ」
- `COMMON7_LINES.leaderAQuote.MERIT[1]`: 「お互い実力派だ。組む価値はある」
- `COMMON7_LINES.leaderAQuote.HEEL[1]`: 「お前らとタッグ、悪くないな。客が嫌がる顔が見える」
- `COMMON7_LINES.leaderAQuote.FACE[1]`: 「うちと一緒なら、ファンへの良い還元になる」
- `COMMON7_LINES.leaderAQuote.COMBAT[1]`: 「殴り合える相手と組めるなら、断る理由がない」
- `COMMON7_LINES.leaderAQuote._any[1]`: 「組んでみるか。話を進めよう」
- `COMMON7_LINES.leaderBQuote.AUTHORITY[1]`: 「こちらも筋を通す。期待していい」
- `COMMON7_LINES.leaderBQuote.BOND[1]`: 「楽しくやろう、お互い」
- `COMMON7_LINES.leaderBQuote.MERIT[1]`: 「結果で応える。それでいいね」
- `COMMON7_LINES.leaderBQuote.HEEL[1]`: 「派手にやろうぜ。客の悲鳴で迎えてやる」
- `COMMON7_LINES.leaderBQuote.FACE[1]`: 「真っ直ぐな企画にしたい。協力する」
- `COMMON7_LINES.leaderBQuote.COMBAT[1]`: 「容赦はなしだ。それでいいな」
- `COMMON7_LINES.leaderBQuote._any[1]`: 「乗った。よろしく頼む」
- `COMMON7_LINES.resultLeader.A._any[1]`: {planType}が組まれた。両派閥の勢いが上がっている。
- `COMMON7_LINES.resultLeader.B._any[1]`: 企画は流した。関係は今のままで充分、ということで。
- `COMMON7_LINES.resultLeader.C._any[1]`: 返事は保留した。流れに任せたまま、話は静かに立ち消えた。

## `FACTION_F01_LEADER_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: 形式: { [personality]: { [archetype]: [ lines... ] } } / 欠けたアーキタイプは normal にフォールバック（Engine.factions.getFactionLine） / 性格 6種: normal / bold / quiet / easygoing / earnest / emotional / アーキタイプ: normal / ojousama / delinquent / cool / seductive / polite / Phase 3a 叩き台: 核4アーキタイプ（normal / ojousama / delinquent / cool）+ normalフォールバック / F01: 忠誠型結成時、リーダーのセリフ
- 本数: 21

### bold.normal[]

- `FACTION_F01_LEADER_LINES.bold.normal[1]`: あんたらのことは、あたしが見てる。だから安心しな。
- `FACTION_F01_LEADER_LINES.bold.normal[2]`: 何かあったら、あたしんとこに来い。悪いようにはしない。
- `FACTION_F01_LEADER_LINES.bold.normal[3]`: ついてこいよ。あんたら守るのは、あたしの役目だろ。

### bold.delinquent[]

- `FACTION_F01_LEADER_LINES.bold.delinquent[1]`: チッ……仕方ねえな。あんたらのケツ、あたしが持ってやるよ。
- `FACTION_F01_LEADER_LINES.bold.delinquent[2]`: 誰に文句言われても、あたしが前で受ける。引っ込んでな。

### bold.cool[]

- `FACTION_F01_LEADER_LINES.bold.cool[1]`: 別に特別なことはしない。ただ、あたしの背中を見てりゃいい。

### earnest.normal[]

- `FACTION_F01_LEADER_LINES.earnest.normal[1]`: みんなで一緒に強くなろうね。私たち、やれるよ。
- `FACTION_F01_LEADER_LINES.earnest.normal[2]`: 一人じゃ辛いこともあるでしょ。だから、私がそばにいるから。
- `FACTION_F01_LEADER_LINES.earnest.normal[3]`: 信じてついてきてほしい。絶対に見捨てないから。

### earnest.polite[]

- `FACTION_F01_LEADER_LINES.earnest.polite[1]`: みなさんのこと、必ず守ります。私、この団体で誰よりも本気ですから。

### quiet.normal[]

- `FACTION_F01_LEADER_LINES.quiet.normal[1]`: ……みんな、いてくれるなら。一緒に、やってみようか。
- `FACTION_F01_LEADER_LINES.quiet.normal[2]`: ……あたしで、いいの？　じゃあ……いいよ。

### quiet.cool[]

- `FACTION_F01_LEADER_LINES.quiet.cool[1]`: ……別にいいよ、ついてきたいなら。
- `FACTION_F01_LEADER_LINES.quiet.cool[2]`: ……邪魔はしない。勝手についてくればいい。

### easygoing.normal[]

- `FACTION_F01_LEADER_LINES.easygoing.normal[1]`: んー、みんなで楽しくやろうよ。難しく考えないで。
- `FACTION_F01_LEADER_LINES.easygoing.normal[2]`: まあ、困ったらあたしに言って。なんとかするから。

### emotional.normal[]

- `FACTION_F01_LEADER_LINES.emotional.normal[1]`: あたし、みんなのこと、大好きだから！　ずっと一緒にいたい！

### emotional.ojousama[]

- `FACTION_F01_LEADER_LINES.emotional.ojousama[1]`: わたくしがついていますわ。ご心配なく。
- `FACTION_F01_LEADER_LINES.emotional.ojousama[2]`: あなた方のこと、このわたくしが最後まで面倒を見ますわ。

### normal.normal[]

- `FACTION_F01_LEADER_LINES.normal.normal[1]`: これからは、私についてきて。何とかするから。
- `FACTION_F01_LEADER_LINES.normal.normal[2]`: みんなで一つになって、この団体を盛り上げていこう。

## `FACTION_F01_FOLLOWER_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F01: フォロワー（メンバー）側のセリフ（追従・決意）
- 本数: 11

### bold.normal[]

- `FACTION_F01_FOLLOWER_LINES.bold.normal[1]`: アンタの後ろなら、どこでもついていけるよ。
- `FACTION_F01_FOLLOWER_LINES.bold.normal[2]`: あたしは決めたんだ。アンタの組に入る。

### bold.delinquent[]

- `FACTION_F01_FOLLOWER_LINES.bold.delinquent[1]`: へっ、別に頼まれたわけじゃねーけど。ま、付き合ってやるよ。

### earnest.normal[]

- `FACTION_F01_FOLLOWER_LINES.earnest.normal[1]`: ……ありがとうございます。ついていかせてください。
- `FACTION_F01_FOLLOWER_LINES.earnest.normal[2]`: 一緒に頑張りたいんです。お願いします。

### quiet.normal[]

- `FACTION_F01_FOLLOWER_LINES.quiet.normal[1]`: ……うん。お願い、します。

### easygoing.normal[]

- `FACTION_F01_FOLLOWER_LINES.easygoing.normal[1]`: まー、面白そうだし、付き合うよ。

### emotional.normal[]

- `FACTION_F01_FOLLOWER_LINES.emotional.normal[1]`: 嬉しい……！　あたし、本当に嬉しいです……！

### emotional.ojousama[]

- `FACTION_F01_FOLLOWER_LINES.emotional.ojousama[1]`: 光栄ですわ。お言葉、決して忘れません。

### normal.normal[]

- `FACTION_F01_FOLLOWER_LINES.normal.normal[1]`: じゃあ、私も。よろしくお願いします。
- `FACTION_F01_FOLLOWER_LINES.normal.normal[2]`: あなたがそう言ってくれるなら、私も力になります。

## `FACTION_F02_LEADER_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F02: 派閥抗争勃発時、両リーダーのセリフ（派閥A/派閥B 共用）
- 本数: 12

- `FACTION_F02_LEADER_LINES.bold.normal[1]`: あいつらと一緒にやってく気はないね。団体の中に、もう一本の筋が必要だ。
- `FACTION_F02_LEADER_LINES.bold.normal[2]`: あっち側にいるのがあたしの道じゃない。ここに集まった連中と、別でやる。
- `FACTION_F02_LEADER_LINES.bold.delinquent[1]`: あいつらと馴れ合う気なんかねえよ。道を分けるだけだ。
- `FACTION_F02_LEADER_LINES.bold.cool[1]`: 居場所が違う、ただそれだけのこと。
- `FACTION_F02_LEADER_LINES.earnest.normal[1]`: 本当は、一つにまとまりたかった。でも……私たちには、譲れないものがある。
- `FACTION_F02_LEADER_LINES.earnest.polite[1]`: 団体のため、あえて分かれる道を選びます。中途半端には、しません。
- `FACTION_F02_LEADER_LINES.quiet.normal[1]`: ……あっち側とは、違う。それだけ。
- `FACTION_F02_LEADER_LINES.quiet.cool[1]`: ……交わる気はない。
- `FACTION_F02_LEADER_LINES.easygoing.normal[1]`: あー、まあ、一緒にやるのはちょっと無理かな。向こうとは、別で。
- `FACTION_F02_LEADER_LINES.emotional.normal[1]`: 嫌だ……あの子たちと同じ方向は向けない……！
- `FACTION_F02_LEADER_LINES.emotional.ojousama[1]`: あちらの方々とは、わたくし、相容れませんの。悪しからず。
- `FACTION_F02_LEADER_LINES.normal.normal[1]`: あちら側とは、方針が違う。私たちは私たちの道を行く。

## `FACTION_F03_SURVIVOR_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F03: リーダー喪失後、残メンバーのセリフ（branch 非依存の一般反応）
- 本数: 15

### bold.normal[]

- `FACTION_F03_SURVIVOR_LINES.bold.normal[1]`: ……信じられない。あの人が、もういない。
- `FACTION_F03_SURVIVOR_LINES.bold.normal[2]`: ふざけんな……あたしら、どうすりゃいいんだよ。

### bold.delinquent[]

- `FACTION_F03_SURVIVOR_LINES.bold.delinquent[1]`: ……チッ。あの人がいねえリングなんて、想像つかねえよ。

### earnest.normal[]

- `FACTION_F03_SURVIVOR_LINES.earnest.normal[1]`: 嘘ですよね……？　まだ、教わりたいことがたくさんあったのに……。
- `FACTION_F03_SURVIVOR_LINES.earnest.normal[2]`: 私たちは、どうしたらいいんでしょうか。

### earnest.polite[]

- `FACTION_F03_SURVIVOR_LINES.earnest.polite[1]`: あの方がいらっしゃらない団体は、わたくしには想像もできません……。

### quiet.normal[]

- `FACTION_F03_SURVIVOR_LINES.quiet.normal[1]`: ……え。……そんな……。
- `FACTION_F03_SURVIVOR_LINES.quiet.normal[2]`: ……いやだ。

### quiet.cool[]

- `FACTION_F03_SURVIVOR_LINES.quiet.cool[1]`: ……何も言葉が出てこない。

### easygoing.normal[]

- `FACTION_F03_SURVIVOR_LINES.easygoing.normal[1]`: ……えっ。……ちょっと、待って。頭、追いつかない……。

### emotional.normal[]

- `FACTION_F03_SURVIVOR_LINES.emotional.normal[1]`: うそ……うそだよ……あの人が……！
- `FACTION_F03_SURVIVOR_LINES.emotional.normal[2]`: あたし、どうすれば……あたし、あの人のために頑張ってたのに……！

### emotional.ojousama[]

- `FACTION_F03_SURVIVOR_LINES.emotional.ojousama[1]`: そんな……そんなことって……。わたくし、認めませんわ。

### normal.normal[]

- `FACTION_F03_SURVIVOR_LINES.normal.normal[1]`: ……実感が湧かない。あの人がいない団体なんて。
- `FACTION_F03_SURVIVOR_LINES.normal.normal[2]`: これから、どうなるんだろう。

## `FACTION_F04_TARGET_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F04: 寝返り対象のセリフ（敵対派閥メンバーと親しげに話す場面）
- 本数: 24

- `FACTION_F04_TARGET_LINES.bold.normal[1]`: ……悪いね。でも、あっち側のほうが、今のあたしには合ってる気がする。
- `FACTION_F04_TARGET_LINES.bold.normal[2]`: ここにいる理由、もう見つからないんだ。
- `FACTION_F04_TARGET_LINES.bold.delinquent[1]`: チッ……義理とか、もう重てえんだよ。
- `FACTION_F04_TARGET_LINES.bold.cool[1]`: 居場所って、自分で決めるもんだろ。
- `FACTION_F04_TARGET_LINES.bold.ojousama[1]`: 筋を通して、あちらへ参りますわ。悪しからず。
- `FACTION_F04_TARGET_LINES.bold.polite[1]`: ……申し訳ありません。けれど、心は固まっております。
- `FACTION_F04_TARGET_LINES.bold.seductive[1]`: ふふ……今、一番息ができるのは、あの人たちの隣なの。
- `FACTION_F04_TARGET_LINES.earnest.normal[1]`: ごめんなさい……私、どうしてもあの人たちの側にいたいんです。
- `FACTION_F04_TARGET_LINES.earnest.normal[2]`: 信じていたのに、気づいたら距離ができてて……。
- `FACTION_F04_TARGET_LINES.earnest.polite[1]`: 筋違いは承知の上で申し上げます。わたくし、あちらへ移らせていただきたく存じます。
- `FACTION_F04_TARGET_LINES.earnest.ojousama[1]`: 心苦しいけれど……わたくし、向こう側で咲きたいのです。
- `FACTION_F04_TARGET_LINES.earnest.cool[1]`: 理屈じゃない。ただ、合わないと気づいた。
- `FACTION_F04_TARGET_LINES.quiet.normal[1]`: ……ごめん。もう、ここにはいられない。
- `FACTION_F04_TARGET_LINES.quiet.normal[2]`: ……あたし、あっち側に……行きたい。
- `FACTION_F04_TARGET_LINES.quiet.cool[1]`: ……もう、決めたから。
- `FACTION_F04_TARGET_LINES.quiet.delinquent[1]`: ……うるせえ。余計な詮索すんな。
- `FACTION_F04_TARGET_LINES.easygoing.normal[1]`: んー、なんかさ、流れでこっちの方が楽しいんだよね。悪く思わないでよ。
- `FACTION_F04_TARGET_LINES.easygoing.ojousama[1]`: あら、向こうのお茶会のほうが、わたくしの性に合っておりますの。
- `FACTION_F04_TARGET_LINES.emotional.normal[1]`: だってあの子たちの前だと……素でいられるんだもん！
- `FACTION_F04_TARGET_LINES.emotional.normal[2]`: ごめんなさい、ごめんなさい……でも、止められない……！
- `FACTION_F04_TARGET_LINES.emotional.ojousama[1]`: わたくし、もう我慢できませんの。あちらにお邪魔いたしますわ。
- `FACTION_F04_TARGET_LINES.emotional.seductive[1]`: ……引き止めないで。わたし、もう向こうへ傾いてるの。
- `FACTION_F04_TARGET_LINES.normal.normal[1]`: ……悪いけど、あたし、あっちに行くことにした。
- `FACTION_F04_TARGET_LINES.normal.normal[2]`: 色々、考えた結果です。どうかご理解を。

## `FACTION_F05_DISSIDENT_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F05: 派閥内不満分子（ringleader）のセリフ（陰口・リーダーへの不満）
- 本数: 20

- `FACTION_F05_DISSIDENT_LINES.bold.normal[1]`: あの人のやり方、もう付き合いきれねえわ。
- `FACTION_F05_DISSIDENT_LINES.bold.normal[2]`: あたしらの声なんて、届いてないんだよ。上は。
- `FACTION_F05_DISSIDENT_LINES.bold.delinquent[1]`: 舐めてんじゃねーぞって話だよ。毎回毎回、同じパターンで。
- `FACTION_F05_DISSIDENT_LINES.bold.cool[1]`: 別に文句はない。ただ、道が違うだけ。
- `FACTION_F05_DISSIDENT_LINES.earnest.normal[1]`: みんなで一つのはずだったのに……こんなの、違う。
- `FACTION_F05_DISSIDENT_LINES.earnest.normal[2]`: 本当に変わってほしい。だから、声を上げなきゃ。
- `FACTION_F05_DISSIDENT_LINES.earnest.polite[1]`: 申し上げにくいのですが……今のままでは、わたくしたち、息が詰まります。
- `FACTION_F05_DISSIDENT_LINES.quiet.normal[1]`: ……もう、ついていけない。
- `FACTION_F05_DISSIDENT_LINES.quiet.normal[2]`: ……息が、できない。
- `FACTION_F05_DISSIDENT_LINES.quiet.cool[1]`: ……静かに、離れたい。
- `FACTION_F05_DISSIDENT_LINES.easygoing.normal[1]`: まー、なんていうか、ちょっと合わないんだよね、もう。
- `FACTION_F05_DISSIDENT_LINES.emotional.normal[1]`: あたし、あの人のこと信じてたのに……ひどい！
- `FACTION_F05_DISSIDENT_LINES.emotional.normal[2]`: もう、無理だよ……泣きたい……！
- `FACTION_F05_DISSIDENT_LINES.emotional.ojousama[1]`: わたくし、もう耐えかねますの。このままでは、心が削れてしまいますわ。
- `FACTION_F05_DISSIDENT_LINES.emotional.seductive[1]`: 冷めちゃったのよ、すっかりね……。
- `FACTION_F05_DISSIDENT_LINES.normal.normal[1]`: 今のままじゃ、立ち行かない。誰かが、声を上げないと。
- `FACTION_F05_DISSIDENT_LINES.normal.normal[2]`: 上の人には、もう期待できない。
- `FACTION_F05_DISSIDENT_LINES.normal.ojousama[1]`: 率直に申し上げます。このままでは、わたくしたちは朽ちますわ。
- `FACTION_F05_DISSIDENT_LINES.normal.delinquent[1]`: 黙ってたけど、もう限界だっつーの。
- `FACTION_F05_DISSIDENT_LINES.normal.polite[1]`: 失礼ながら、意見を申し上げさせてください。

## `FACTION_F06_AMBIENT_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F06: 和解の兆し — 両派閥メンバーの何気ない雑談（1人分のセリフで十分）
- 本数: 15

- `FACTION_F06_AMBIENT_LINES.bold.normal[1]`: あんた、意外と悪くないじゃん。ちょっと見直したわ。
- `FACTION_F06_AMBIENT_LINES.bold.normal[2]`: まあ、あの日のことは、忘れてやるよ。
- `FACTION_F06_AMBIENT_LINES.bold.delinquent[1]`: ……ったく、気まずいっての。
- `FACTION_F06_AMBIENT_LINES.earnest.normal[1]`: ずっと、こうして話せたらって思ってたんです。
- `FACTION_F06_AMBIENT_LINES.earnest.normal[2]`: あの頃のこと、お互いに少しずつ……手放せたらいいですね。
- `FACTION_F06_AMBIENT_LINES.earnest.polite[1]`: きっかけがあれば、と思っておりました。今日がその日かもしれません。
- `FACTION_F06_AMBIENT_LINES.quiet.normal[1]`: ……意外と、普通に、話せるね。
- `FACTION_F06_AMBIENT_LINES.quiet.cool[1]`: ……まあ、別にいいよ。
- `FACTION_F06_AMBIENT_LINES.easygoing.normal[1]`: あはは、もう何で揉めてたんだっけ、あたしたち。
- `FACTION_F06_AMBIENT_LINES.easygoing.ojousama[1]`: あら、そんな昔のこと、もう忘れていますわよ。
- `FACTION_F06_AMBIENT_LINES.emotional.normal[1]`: ずっと、気まずかったの……嬉しい……！
- `FACTION_F06_AMBIENT_LINES.emotional.ojousama[1]`: わたくし、あの頃のわだかまりは、もう水に流そうかと存じますの。
- `FACTION_F06_AMBIENT_LINES.emotional.seductive[1]`: ふふ、仲直り……いいものね。
- `FACTION_F06_AMBIENT_LINES.normal.normal[1]`: ……気づけば、睨み合う理由がどこかに消えてたね。
- `FACTION_F06_AMBIENT_LINES.normal.normal[2]`: まあ、お互い、大人になったってことかな。

## `FACTION_F07_LEADER_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F07: 横暴リーダーのセリフ（社長への要求・威圧）
- 本数: 15

- `FACTION_F07_LEADER_LINES.bold.normal[1]`: 社長、うちの連中の扱い、いいかげん見直してもらいたい。
- `FACTION_F07_LEADER_LINES.bold.normal[2]`: あたしが言う以上、話は通しておけよ。
- `FACTION_F07_LEADER_LINES.bold.delinquent[1]`: おい社長、あんた誰のおかげで食えてると思ってんだ？
- `FACTION_F07_LEADER_LINES.bold.cool[1]`: 結論だけ言う。うちの連中を軽く扱うな。
- `FACTION_F07_LEADER_LINES.earnest.normal[1]`: 社長。私たちのこと、もっと見ていただきたいんです。
- `FACTION_F07_LEADER_LINES.earnest.polite[1]`: 畏れながら、わたくしたちの処遇について、再考いただきたく存じます。
- `FACTION_F07_LEADER_LINES.quiet.normal[1]`: ……この扱い、納得してない。
- `FACTION_F07_LEADER_LINES.quiet.cool[1]`: ……ちゃんと見てほしい。それだけ。
- `FACTION_F07_LEADER_LINES.easygoing.normal[1]`: えー社長、ちょっと、うちの子らに甘くしてくんない？
- `FACTION_F07_LEADER_LINES.easygoing.ojousama[1]`: 社長、気安いところで申し上げますけれど、待遇、もう少しどうにか。
- `FACTION_F07_LEADER_LINES.emotional.normal[1]`: 社長！　あたしの子たちが、どんな思いしてるか、わかってます？
- `FACTION_F07_LEADER_LINES.emotional.ojousama[1]`: 社長。このわたくしの派閥、粗略に扱われては困りますわ。
- `FACTION_F07_LEADER_LINES.emotional.seductive[1]`: 社長さん、うちの子たちに、もうちょっと優しくしてくださらない？
- `FACTION_F07_LEADER_LINES.normal.normal[1]`: 社長、うちの派閥には、それなりの配慮が必要だと思いますが。
- `FACTION_F07_LEADER_LINES.normal.normal[2]`: 話しておきたいことがあります。時間を取ってほしい。

## `FACTION_F08_LEADER_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F08: 対立ヒートアップ — 両リーダー対峙のセリフ（A側/B側 共用）
- 本数: 15

- `FACTION_F08_LEADER_LINES.bold.normal[1]`: もう言葉はいらない。リングで片をつけるだけだ。
- `FACTION_F08_LEADER_LINES.bold.normal[2]`: あたしが勝つ。それだけの話。
- `FACTION_F08_LEADER_LINES.bold.delinquent[1]`: 上等じゃねーか。来いよ、いつでも。
- `FACTION_F08_LEADER_LINES.bold.cool[1]`: 決着をつける。それ以外の選択肢はない。
- `FACTION_F08_LEADER_LINES.earnest.normal[1]`: これ以上は、話し合いでは済まない。わかってるはず。
- `FACTION_F08_LEADER_LINES.earnest.polite[1]`: 言葉ではもう届きません。リングで、決着をつけましょう。
- `FACTION_F08_LEADER_LINES.earnest.ojousama[1]`: ここまで来て、退く理由がございませんわ。
- `FACTION_F08_LEADER_LINES.quiet.normal[1]`: ……もう、逃げない。
- `FACTION_F08_LEADER_LINES.quiet.cool[1]`: ……リングで、会う。
- `FACTION_F08_LEADER_LINES.easygoing.normal[1]`: はぁ〜あ、こうなると、もうやるしかないよね。
- `FACTION_F08_LEADER_LINES.emotional.normal[1]`: もう、我慢できない！　あの子とは、決着をつける！
- `FACTION_F08_LEADER_LINES.emotional.ojousama[1]`: あの御方とわたくし、このまま並び立つことはできませんの。
- `FACTION_F08_LEADER_LINES.emotional.seductive[1]`: ……リングでなら、本音で話せるでしょ？
- `FACTION_F08_LEADER_LINES.normal.normal[1]`: 話はもう済んだ。後は、リングで示すだけ。
- `FACTION_F08_LEADER_LINES.normal.normal[2]`: 引き下がる理由は、もう、どこにもない。

## `FACTION_F08_PRE_MATCH_LINES_A`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: Phase 3e: F08-A 直接対決 試合前後演出 / 4テーブル × hostility帯 / HP帯分岐 / 6性格 × 6アーキタイプ、normal フォールバック、cool/delinquent/ojousama は核 / 試合前 リーダー A 側（宣戦）
- 本数: 42

### bold.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.bold.normal.high[1]`: あんたんとこの組、今夜で終わりだ。覚悟しときな
- `FACTION_F08_PRE_MATCH_LINES_A.bold.normal.high[2]`: あたしの背中にいる連中のためにも、今日は退かない
- `FACTION_F08_PRE_MATCH_LINES_A.bold.normal.high[3]`: あんた一人潰せば、組ごと崩れる――遠慮しねえぞ

### bold.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_A.bold.normal.mid[1]`: 今日は決着つけにきた。話はリングの上で
- `FACTION_F08_PRE_MATCH_LINES_A.bold.normal.mid[2]`: これ以上、あんたんとこに好き勝手はさせない

### bold.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_A.bold.normal.low[1]`: ……来なよ。最後まで付き合ってやる

### bold.delinquent.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.bold.delinquent.high[1]`: 今夜、あんたの組は終わる。しっかり見とけよ
- `FACTION_F08_PRE_MATCH_LINES_A.bold.delinquent.high[2]`: ヘラヘラしてられんのも今のうちだぜ
- `FACTION_F08_PRE_MATCH_LINES_A.bold.delinquent.high[3]`: 舐めた口きいてた連中、ぜんぶ纏めてあたしが叩く

### bold.delinquent.mid[]

- `FACTION_F08_PRE_MATCH_LINES_A.bold.delinquent.mid[1]`: 黙って来な。話すことなんかねえだろ

### bold.cool.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.bold.cool.high[1]`: リングに上がれば、あとは結果がすべてだ
- `FACTION_F08_PRE_MATCH_LINES_A.bold.cool.high[2]`: あんたの組の名前、今夜から軽くなる

### earnest.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.earnest.normal.high[1]`: あなたたちのやり方は……許せない。今日で決着をつける
- `FACTION_F08_PRE_MATCH_LINES_A.earnest.normal.high[2]`: 私、あなたを倒さないと、後ろのみんなに顔向けできない
- `FACTION_F08_PRE_MATCH_LINES_A.earnest.normal.high[3]`: うしろにいる子たちのために、今日は逃げない

### earnest.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_A.earnest.normal.mid[1]`: 今日は、絶対に引きません
- `FACTION_F08_PRE_MATCH_LINES_A.earnest.normal.mid[2]`: あなたの組の流儀には、もう従えない

### earnest.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_A.earnest.normal.low[1]`: リングの上で、答えを出しましょう

### earnest.polite.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.earnest.polite.high[1]`: 今日という日のために、私、ここまで来たんです
- `FACTION_F08_PRE_MATCH_LINES_A.earnest.polite.high[2]`: 御免なさい。今日は手加減できません

### quiet.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.quiet.normal.high[1]`: ……話すことは、もうない
- `FACTION_F08_PRE_MATCH_LINES_A.quiet.normal.high[2]`: ……行こう。リングが、待ってる
- `FACTION_F08_PRE_MATCH_LINES_A.quiet.normal.high[3]`: ……うちらの組のこと、悪く言う声は、ぜんぶ今日で消す

### quiet.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_A.quiet.normal.mid[1]`: ……来なよ

### quiet.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_A.quiet.normal.low[1]`: ……うん。受けて立つ

### quiet.cool.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.quiet.cool.high[1]`: ……話すことは、もうない
- `FACTION_F08_PRE_MATCH_LINES_A.quiet.cool.high[2]`: ……決着、つけよう

### easygoing.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.easygoing.normal.high[1]`: んー、こうなっちゃったら、もう仕方ないよね。やろっか
- `FACTION_F08_PRE_MATCH_LINES_A.easygoing.normal.high[2]`: あたしも嫌なんだけど、組のみんなが黙ってないから

### easygoing.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_A.easygoing.normal.mid[1]`: ま、リングで決めようよ。それが一番すっきりする

### easygoing.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_A.easygoing.normal.low[1]`: やれやれ……一回、ぶつかっとくか

### emotional.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.emotional.normal.high[1]`: もう、我慢できない！　あんたんとこの組、今夜で終わりにする！
- `FACTION_F08_PRE_MATCH_LINES_A.emotional.normal.high[2]`: うちのみんなが泣いた分、ぜんぶ返してもらうから

### emotional.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_A.emotional.normal.mid[1]`: 今日のあたし、止めても無駄だよ

### emotional.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_A.emotional.normal.low[1]`: もう、泣いてる暇なんか、ない

### emotional.ojousama.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.emotional.ojousama.high[1]`: ええ、わたくしも引きませんわ。これは戦争です
- `FACTION_F08_PRE_MATCH_LINES_A.emotional.ojousama.high[2]`: あなたの組の方々が、わたくしの妹分にしたこと――今夜、お返ししますわ

### emotional.ojousama.mid[]

- `FACTION_F08_PRE_MATCH_LINES_A.emotional.ojousama.mid[1]`: わたくし、本気でいきますわよ

### normal.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_A.normal.normal.high[1]`: 今日のリングは、あんたとあたしのためにある
- `FACTION_F08_PRE_MATCH_LINES_A.normal.normal.high[2]`: 言葉ではもう、何も伝わらない。だからリングで

### normal.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_A.normal.normal.mid[1]`: 今日で、片付ける

### normal.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_A.normal.normal.low[1]`: リングで、会いましょう

## `FACTION_F08_PRE_MATCH_LINES_B`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: 試合前 リーダー B 側（応戦）
- 本数: 33

### bold.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.bold.normal.high[1]`: 上等だ。やってもらおうじゃねえか
- `FACTION_F08_PRE_MATCH_LINES_B.bold.normal.high[2]`: 受けて立つ。あたしんとこの組も、舐められっぱなしじゃ終われねえ
- `FACTION_F08_PRE_MATCH_LINES_B.bold.normal.high[3]`: そっちが来るなら、こっちも全力で潰しにいく

### bold.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_B.bold.normal.mid[1]`: いいだろう。来な
- `FACTION_F08_PRE_MATCH_LINES_B.bold.normal.mid[2]`: あんたの覚悟、リングで見せてみろよ

### bold.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_B.bold.normal.low[1]`: ……分かった。受けるよ

### bold.delinquent.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.bold.delinquent.high[1]`: おう、待ってたぞ。逃がさねえからな
- `FACTION_F08_PRE_MATCH_LINES_B.bold.delinquent.high[2]`: あたしんとこも、舐められたまま終わる気はねえ

### bold.delinquent.mid[]

- `FACTION_F08_PRE_MATCH_LINES_B.bold.delinquent.mid[1]`: ったく。来るなら来いよ

### earnest.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.earnest.normal.high[1]`: ……分かりました。今日、あなたの全てを受け止めます
- `FACTION_F08_PRE_MATCH_LINES_B.earnest.normal.high[2]`: 私のうしろの子たちも、もう泣かせない。受けて立ちます

### earnest.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_B.earnest.normal.mid[1]`: 逃げません。今日は、決着をつけましょう

### earnest.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_B.earnest.normal.low[1]`: 受けます。リングで、お会いしましょう

### earnest.polite.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.earnest.polite.high[1]`: ご丁寧に、ありがとうございます。お受けいたします

### quiet.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.quiet.normal.high[1]`: ……分かった。リングで
- `FACTION_F08_PRE_MATCH_LINES_B.quiet.normal.high[2]`: ……うん。逃げない

### quiet.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_B.quiet.normal.mid[1]`: ……いいよ

### quiet.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_B.quiet.normal.low[1]`: ……分かった

### quiet.cool.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.quiet.cool.high[1]`: ……いいだろう。受けて立つ

### easygoing.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.easygoing.normal.high[1]`: あ〜あ、こうなっちゃったか。仕方ない、付き合うよ
- `FACTION_F08_PRE_MATCH_LINES_B.easygoing.normal.high[2]`: 断りたいけど、断れる空気じゃないもんね、これ

### easygoing.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_B.easygoing.normal.mid[1]`: ま、いっか。リングで決めようよ

### easygoing.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_B.easygoing.normal.low[1]`: んー、付き合います

### emotional.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.emotional.normal.high[1]`: あんたが本気なら、あたしも本気で受ける！
- `FACTION_F08_PRE_MATCH_LINES_B.emotional.normal.high[2]`: うちの子たちのこと、もう傷つけさせない！

### emotional.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_B.emotional.normal.mid[1]`: 受ける。今日は引かない

### emotional.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_B.emotional.normal.low[1]`: ……分かった。ぶつかろう

### emotional.ojousama.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.emotional.ojousama.high[1]`: 結構ですわ。お相手いたしましょう
- `FACTION_F08_PRE_MATCH_LINES_B.emotional.ojousama.high[2]`: わたくしの組も、あなたに膝を屈する気はございません

### normal.normal.high[]

- `FACTION_F08_PRE_MATCH_LINES_B.normal.normal.high[1]`: 受けます。リングで会いましょう
- `FACTION_F08_PRE_MATCH_LINES_B.normal.normal.high[2]`: 退きません。今日は、決着のときだ

### normal.normal.mid[]

- `FACTION_F08_PRE_MATCH_LINES_B.normal.normal.mid[1]`: 分かった。受ける

### normal.normal.low[]

- `FACTION_F08_PRE_MATCH_LINES_B.normal.normal.low[1]`: リングで

## `FACTION_F08_POST_MATCH_WINNER_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: 試合後 勝者セリフ（敗者派閥への一撃）
- 本数: 33

### bold.normal.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.normal.high[1]`: これがあんたの組の限界か？　次は誰だ
- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.normal.high[2]`: 見たかよ。これが格の違いってやつだ
- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.normal.high[3]`: もう二度と、あたしらに楯突くんじゃねえぞ

### bold.normal.mid[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.normal.mid[1]`: ……今日は、あたしの勝ちだ
- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.normal.mid[2]`: 次の番、誰でも構わねえ。来な

### bold.normal.low[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.normal.low[1]`: ……勝った。それだけだ

### bold.delinquent.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.delinquent.high[1]`: 口ほどにもねえな、あんたの組
- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.delinquent.high[2]`: 次の番、誰だよ？　全員かかってこい

### bold.delinquent.mid[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.bold.delinquent.mid[1]`: ふん。あたしの勝ちだ

### earnest.normal.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.earnest.normal.high[1]`: ……あなたの組のやり方が、間違ってたって、これで証明された
- `FACTION_F08_POST_MATCH_WINNER_LINES.earnest.normal.high[2]`: 私、勝ちました。みんなのために
- `FACTION_F08_POST_MATCH_WINNER_LINES.earnest.normal.high[3]`: もう、うちの子たちを傷つけないでください

### earnest.normal.mid[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.earnest.normal.mid[1]`: ありがとう……みんな、見ててくれて

### earnest.normal.low[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.earnest.normal.low[1]`: ……勝てた。みんなのおかげです

### earnest.polite.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.earnest.polite.high[1]`: 失礼いたしました。今日は、私が勝たせてもらいます

### quiet.normal.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.quiet.normal.high[1]`: ……勝った
- `FACTION_F08_POST_MATCH_WINNER_LINES.quiet.normal.high[2]`: ……これで、終わり。じゃない

### quiet.normal.mid[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.quiet.normal.mid[1]`: ……勝てた

### quiet.normal.low[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.quiet.normal.low[1]`: ……（深く息をつく）

### quiet.cool.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.quiet.cool.high[1]`: ……結果がすべて、だろ

### easygoing.normal.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.easygoing.normal.high[1]`: あ〜あ、勝っちゃった。次は仲良くやろうよ、本気で
- `FACTION_F08_POST_MATCH_WINNER_LINES.easygoing.normal.high[2]`: 勝つには勝ったけど、あんたんとこも、もう静かにしとこ？

### easygoing.normal.mid[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.easygoing.normal.mid[1]`: んー、勝った。それだけ

### easygoing.normal.low[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.easygoing.normal.low[1]`: 勝てたみたい。ふぅ

### emotional.normal.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.emotional.normal.high[1]`: 勝った！　うちのみんなのために、勝った！
- `FACTION_F08_POST_MATCH_WINNER_LINES.emotional.normal.high[2]`: あんたら、もう泣かせないからね、絶対！

### emotional.normal.mid[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.emotional.normal.mid[1]`: 勝てた……みんな、ありがとう

### emotional.normal.low[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.emotional.normal.low[1]`: ……勝った……

### emotional.ojousama.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.emotional.ojousama.high[1]`: ご覧の通りですわ。わたくしの組に、刃向うものではありませんの

### normal.normal.high[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.normal.normal.high[1]`: 今夜の決着は、これで充分だろう
- `FACTION_F08_POST_MATCH_WINNER_LINES.normal.normal.high[2]`: あんたの組とは、もう距離を置かせてもらう

### normal.normal.mid[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.normal.normal.mid[1]`: 勝った。それで充分

### normal.normal.low[]

- `FACTION_F08_POST_MATCH_WINNER_LINES.normal.normal.low[1]`: ……勝てた

## `FACTION_F08_POST_MATCH_LOSER_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: 試合後 敗者セリフ（HP帯分岐）
- 本数: 34

- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.normal.hp_high[1]`: ……次は、こうはいかねえ。覚えとけよ
- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.normal.hp_high[2]`: 今日のとこは、あたしの負けだ。だが、組は潰れねえ
- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.normal.hp_mid[1]`: ……くそっ……まだ、終わりじゃ……
- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.normal.hp_mid[2]`: ……次、絶対に……
- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.normal.hp_low[1]`: ……っ……
- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.normal.hp_low[2]`: （呻き声）
- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.delinquent.hp_high[1]`: チッ……負けた。今日のとこはな
- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.delinquent.hp_mid[1]`: ……うるせえ……
- `FACTION_F08_POST_MATCH_LOSER_LINES.bold.delinquent.hp_low[1]`: （息も荒い）
- `FACTION_F08_POST_MATCH_LOSER_LINES.earnest.normal.hp_high[1]`: ……ごめんなさい。私、勝てなかった……
- `FACTION_F08_POST_MATCH_LOSER_LINES.earnest.normal.hp_high[2]`: ……みんな、ごめん。次は、絶対に
- `FACTION_F08_POST_MATCH_LOSER_LINES.earnest.normal.hp_mid[1]`: ……うっ……ごめん……みんな……
- `FACTION_F08_POST_MATCH_LOSER_LINES.earnest.normal.hp_low[1]`: ……（声にならない）
- `FACTION_F08_POST_MATCH_LOSER_LINES.earnest.polite.hp_high[1]`: ……お見事でした。次は、こうはいきません
- `FACTION_F08_POST_MATCH_LOSER_LINES.quiet.normal.hp_high[1]`: ……負けた、けど……組は、潰れない
- `FACTION_F08_POST_MATCH_LOSER_LINES.quiet.normal.hp_high[2]`: ……次は、ない、なんて……思ってない
- `FACTION_F08_POST_MATCH_LOSER_LINES.quiet.normal.hp_mid[1]`: ……っ……
- `FACTION_F08_POST_MATCH_LOSER_LINES.quiet.normal.hp_low[1]`: （沈黙）
- `FACTION_F08_POST_MATCH_LOSER_LINES.quiet.cool.hp_high[1]`: ……負け。それだけ
- `FACTION_F08_POST_MATCH_LOSER_LINES.quiet.cool.hp_mid[1]`: ……っ……
- `FACTION_F08_POST_MATCH_LOSER_LINES.easygoing.normal.hp_high[1]`: あ〜あ、負けちゃった。ま、こんな日もあるよ
- `FACTION_F08_POST_MATCH_LOSER_LINES.easygoing.normal.hp_high[2]`: うん、負け。次はもうちょっと頑張る
- `FACTION_F08_POST_MATCH_LOSER_LINES.easygoing.normal.hp_mid[1]`: ……いた……っ……
- `FACTION_F08_POST_MATCH_LOSER_LINES.easygoing.normal.hp_low[1]`: （うつぶせのまま動かない）
- `FACTION_F08_POST_MATCH_LOSER_LINES.emotional.normal.hp_high[1]`: ……悔しい……ぜんぜん、納得いかない……！
- `FACTION_F08_POST_MATCH_LOSER_LINES.emotional.normal.hp_high[2]`: ……ごめん、みんな……次は、絶対勝つから……
- `FACTION_F08_POST_MATCH_LOSER_LINES.emotional.normal.hp_mid[1]`: ……うっ……うぅ……
- `FACTION_F08_POST_MATCH_LOSER_LINES.emotional.normal.hp_low[1]`: （嗚咽だけが漏れる）
- `FACTION_F08_POST_MATCH_LOSER_LINES.emotional.ojousama.hp_high[1]`: ……今日は、お先にどうぞ。次は、こうはいかせませんわ
- `FACTION_F08_POST_MATCH_LOSER_LINES.emotional.ojousama.hp_mid[1]`: ……っ……まだ、わたくし……
- `FACTION_F08_POST_MATCH_LOSER_LINES.normal.normal.hp_high[1]`: ……今日は、負け。だけど、組は終わらない
- `FACTION_F08_POST_MATCH_LOSER_LINES.normal.normal.hp_high[2]`: ……次は、こうはいかせない
- `FACTION_F08_POST_MATCH_LOSER_LINES.normal.normal.hp_mid[1]`: ……くっ……
- `FACTION_F08_POST_MATCH_LOSER_LINES.normal.normal.hp_low[1]`: ……（呼吸だけが響く）

## `FACTION_F09_OPENING_LINES_A`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: F09 派閥対抗戦 セリフテーブル群（spec: faction-rivalry-points-spec-v0.1 §3.5） / hostility帯 (high/mid/low) で分岐する F08 と同じ形式。引きは Engine.factions._getF08LineByBand を流用。 / オープニング宣戦：A 派閥リーダーの宣言
- 本数: 15

- `FACTION_F09_OPENING_LINES_A.bold.normal.high[1]`: 今夜、あんたの組ごと踏み潰す。覚悟しときな
- `FACTION_F09_OPENING_LINES_A.bold.normal.high[2]`: 選手全員、リングに上げな。一人残らず叩く
- `FACTION_F09_OPENING_LINES_A.bold.normal.mid[1]`: 今日が、あんたんとこの分水嶺だ
- `FACTION_F09_OPENING_LINES_A.bold.delinquent.high[1]`: 全員揃ってるな？ じゃあ、今夜が最後だ
- `FACTION_F09_OPENING_LINES_A.earnest.normal.high[1]`: 派閥同士の決着、今夜つけさせていただきます
- `FACTION_F09_OPENING_LINES_A.earnest.normal.high[2]`: うちの組のみんなのためにも、今日は引きません
- `FACTION_F09_OPENING_LINES_A.earnest.normal.mid[1]`: この夜が、わたしたちの答えになります
- `FACTION_F09_OPENING_LINES_A.earnest.polite.high[1]`: 今夜の興行で、すべてを決めさせてください
- `FACTION_F09_OPENING_LINES_A.quiet.normal.high[1]`: ……今夜で、終わらせる
- `FACTION_F09_OPENING_LINES_A.quiet.cool.high[1]`: ……話すことは、もう何もない
- `FACTION_F09_OPENING_LINES_A.easygoing.normal.high[1]`: まあ、ここまで来ちゃったしね。今夜決めようよ
- `FACTION_F09_OPENING_LINES_A.emotional.normal.high[1]`: わたしたち、今日で全部背負って戦います
- `FACTION_F09_OPENING_LINES_A.emotional.normal.high[2]`: うちの組の名前、今夜傷つけさせない
- `FACTION_F09_OPENING_LINES_A.emotional.ojousama.high[1]`: わたくしたち、今夜こそ決着をつけますわ
- `FACTION_F09_OPENING_LINES_A.shy.normal.high[1]`: ……今夜、組の全員で受けて立ちます

## `FACTION_F09_OPENING_LINES_B`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: オープニング宣戦：B 派閥リーダーの応答
- 本数: 11

### bold.normal.high[]

- `FACTION_F09_OPENING_LINES_B.bold.normal.high[1]`: 上等だ。組ごと潰し合おうじゃねえか

### bold.delinquent.high[]

- `FACTION_F09_OPENING_LINES_B.bold.delinquent.high[1]`: 来なよ。全員でかかってこい

### earnest.normal.high[]

- `FACTION_F09_OPENING_LINES_B.earnest.normal.high[1]`: わかりました。受けて立たせていただきます
- `FACTION_F09_OPENING_LINES_B.earnest.normal.high[2]`: うちの組も、引きません

### earnest.polite.high[]

- `FACTION_F09_OPENING_LINES_B.earnest.polite.high[1]`: お受けいたします。今夜、決着を

### quiet.normal.high[]

- `FACTION_F09_OPENING_LINES_B.quiet.normal.high[1]`: ……いいよ。来な

### quiet.cool.high[]

- `FACTION_F09_OPENING_LINES_B.quiet.cool.high[1]`: ……受ける

### easygoing.normal.high[]

- `FACTION_F09_OPENING_LINES_B.easygoing.normal.high[1]`: やれやれ……じゃあ、行こうか

### emotional.normal.high[]

- `FACTION_F09_OPENING_LINES_B.emotional.normal.high[1]`: わたしたちも、今夜は退きません

### emotional.ojousama.high[]

- `FACTION_F09_OPENING_LINES_B.emotional.ojousama.high[1]`: わたくしも、引きませんわよ

### shy.normal.high[]

- `FACTION_F09_OPENING_LINES_B.shy.normal.high[1]`: ……はい。受けて、立ちます

## `FACTION_F09_MATCH_PRE_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: 各試合前 簡略 confrontation（軽量版・F08 PRE_MATCH より短め）
- 本数: 8

### bold.normal.high[]

- `FACTION_F09_MATCH_PRE_LINES.bold.normal.high[1]`: 順番が来たね

### bold.normal.mid[]

- `FACTION_F09_MATCH_PRE_LINES.bold.normal.mid[1]`: 先に来な

### earnest.normal.high[]

- `FACTION_F09_MATCH_PRE_LINES.earnest.normal.high[1]`: お願いします

### earnest.normal.mid[]

- `FACTION_F09_MATCH_PRE_LINES.earnest.normal.mid[1]`: 全力で行きます

### quiet.normal.high[]

- `FACTION_F09_MATCH_PRE_LINES.quiet.normal.high[1]`: ……行く

### easygoing.normal.high[]

- `FACTION_F09_MATCH_PRE_LINES.easygoing.normal.high[1]`: やろっか

### emotional.normal.high[]

- `FACTION_F09_MATCH_PRE_LINES.emotional.normal.high[1]`: 背負ってるもの、見せます

### shy.normal.high[]

- `FACTION_F09_MATCH_PRE_LINES.shy.normal.high[1]`: ……はい

## `FACTION_F09_MATCH_POST_WIN_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: 各試合後 勝者の一言（軽量）
- 本数: 8

### bold.normal.high[]

- `FACTION_F09_MATCH_POST_WIN_LINES.bold.normal.high[1]`: 1勝。あと何回続くかな

### bold.normal.mid[]

- `FACTION_F09_MATCH_POST_WIN_LINES.bold.normal.mid[1]`: まだ序章だぜ

### bold.delinquent.high[]

- `FACTION_F09_MATCH_POST_WIN_LINES.bold.delinquent.high[1]`: 次。次出てこい

### earnest.normal.high[]

- `FACTION_F09_MATCH_POST_WIN_LINES.earnest.normal.high[1]`: ……ありがとうございました。次の人に繋ぎます

### quiet.normal.high[]

- `FACTION_F09_MATCH_POST_WIN_LINES.quiet.normal.high[1]`: ……次

### easygoing.normal.high[]

- `FACTION_F09_MATCH_POST_WIN_LINES.easygoing.normal.high[1]`: とりあえず1つ、もらった

### emotional.normal.high[]

- `FACTION_F09_MATCH_POST_WIN_LINES.emotional.normal.high[1]`: みんな、見ててね

### shy.normal.high[]

- `FACTION_F09_MATCH_POST_WIN_LINES.shy.normal.high[1]`: ……勝てて、よかった

## `FACTION_F09_MATCH_POST_LOSE_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: 各試合後 敗者の一言（軽量・呻き寄り）
- 本数: 6

### bold.normal.high[]

- `FACTION_F09_MATCH_POST_LOSE_LINES.bold.normal.high[1]`: ……ちっ。次の奴で取り返してくれ

### earnest.normal.high[]

- `FACTION_F09_MATCH_POST_LOSE_LINES.earnest.normal.high[1]`: ……ごめんなさい、次に繋いでください

### quiet.normal.high[]

- `FACTION_F09_MATCH_POST_LOSE_LINES.quiet.normal.high[1]`: ……すまない

### easygoing.normal.high[]

- `FACTION_F09_MATCH_POST_LOSE_LINES.easygoing.normal.high[1]`: ……うわ、負けた。次よろしく

### emotional.normal.high[]

- `FACTION_F09_MATCH_POST_LOSE_LINES.emotional.normal.high[1]`: ……ごめん、ごめんね

### shy.normal.high[]

- `FACTION_F09_MATCH_POST_LOSE_LINES.shy.normal.high[1]`: ……ごめんなさい

## `FACTION_F09_ENDING_WIN_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: エンディング 勝ち越し派閥リーダー
- 本数: 10

### bold.normal.high[]

- `FACTION_F09_ENDING_WIN_LINES.bold.normal.high[1]`: 勝ち越した。今夜は、うちの組の夜だ
- `FACTION_F09_ENDING_WIN_LINES.bold.normal.high[2]`: 見たか。これがうちの組の力だ

### bold.delinquent.high[]

- `FACTION_F09_ENDING_WIN_LINES.bold.delinquent.high[1]`: 完全勝利だ。文句あるか？

### earnest.normal.high[]

- `FACTION_F09_ENDING_WIN_LINES.earnest.normal.high[1]`: ……勝てて、よかった。みんなのおかげです
- `FACTION_F09_ENDING_WIN_LINES.earnest.normal.high[2]`: うちの組、今日のために積み上げてきたんです

### quiet.normal.high[]

- `FACTION_F09_ENDING_WIN_LINES.quiet.normal.high[1]`: ……勝った

### easygoing.normal.high[]

- `FACTION_F09_ENDING_WIN_LINES.easygoing.normal.high[1]`: なんとかなったね、よかった

### emotional.normal.high[]

- `FACTION_F09_ENDING_WIN_LINES.emotional.normal.high[1]`: みんな、ありがとう……ありがとう

### emotional.ojousama.high[]

- `FACTION_F09_ENDING_WIN_LINES.emotional.ojousama.high[1]`: わたくしたち、勝ち越しましたわよ

### shy.normal.high[]

- `FACTION_F09_ENDING_WIN_LINES.shy.normal.high[1]`: ……勝ち越せて、嬉しいです

## `FACTION_F09_ENDING_LOSE_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: エンディング 負け越し派閥リーダー
- 本数: 8

### bold.normal.high[]

- `FACTION_F09_ENDING_LOSE_LINES.bold.normal.high[1]`: ……負けた。受け止める。次は必ず取り返す
- `FACTION_F09_ENDING_LOSE_LINES.bold.normal.high[2]`: 今夜のは、覚えとく。次に返すから

### earnest.normal.high[]

- `FACTION_F09_ENDING_LOSE_LINES.earnest.normal.high[1]`: ……ごめんなさい、みんな。わたしの責任です
- `FACTION_F09_ENDING_LOSE_LINES.earnest.normal.high[2]`: 今夜は、わたしたちが弱かった。立て直します

### quiet.normal.high[]

- `FACTION_F09_ENDING_LOSE_LINES.quiet.normal.high[1]`: ……負けた。それだけ

### easygoing.normal.high[]

- `FACTION_F09_ENDING_LOSE_LINES.easygoing.normal.high[1]`: はー、やられたなあ。組み立て直しだね

### emotional.normal.high[]

- `FACTION_F09_ENDING_LOSE_LINES.emotional.normal.high[1]`: ……うちの組、今夜は弱かった。みんな、ごめん

### shy.normal.high[]

- `FACTION_F09_ENDING_LOSE_LINES.shy.normal.high[1]`: ……ごめんなさい、わたしのせいです

## `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES`

- 出典: `src/data-faction-dialogue.js`
- コード内コメント: 派閥内序列戦（spec: faction-internal-rank-spec-v0.2 §5.3） / 構造: personality.archetype.band 形式（_getF08LineByBand 流用） / band は 'high' のみ使用（同派閥内対立なので hostility 帯は単一）。loser のみ HP帯。
- 本数: 18

### bold.normal.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.bold.normal.high[1]`: 今夜、あんたの座は降ろさせてもらう
- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.bold.normal.high[2]`: ずっと、あんたの背中ばっか見てきた。今日で終わりにする
- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.bold.normal.high[3]`: リーダー――その肩書、重そうだな。譲ってもらうぜ

### bold.delinquent.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.bold.delinquent.high[1]`: 黙って退け、なんて言わねえ。リングで証明してやる
- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.bold.delinquent.high[2]`: あたしが上に立つ。それだけだ

### bold.cool.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.bold.cool.high[1]`: 順番が回ってきただけだ。受けてもらう

### earnest.normal.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.earnest.normal.high[1]`: ……失礼を承知で言います。私が、上に立ちます
- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.earnest.normal.high[2]`: あなたを尊敬しています。だからこそ、今日、超える
- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.earnest.normal.high[3]`: 後ろの子たちに、もう待ってと言えない

### earnest.polite.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.earnest.polite.high[1]`: 御免なさい。今日だけは、譲れません

### quiet.normal.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.quiet.normal.high[1]`: ……時間だ
- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.quiet.normal.high[2]`: ……席を、もらいに来た

### emotional.normal.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.emotional.normal.high[1]`: 怖いよ。でも、行かなきゃ
- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.emotional.normal.high[2]`: ごめん、ごめんね……それでも、譲れないんだ

### easygoing.normal.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.easygoing.normal.high[1]`: やー、こういう日も来るよね。じゃ、行こうか

### shy.normal.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.shy.normal.high[1]`: ……わたし、勝ちます

### normal.normal.high[]

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.normal.normal.high[1]`: 今日、あなたの座を奪いに来た
- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES.normal.normal.high[2]`: ずっとこの日を待っていた

## `INTERNAL_CHALLENGE_PRE_LEADER_LINES`

- 出典: `src/data-faction-dialogue.js`
- 本数: 11

### bold.normal.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.bold.normal.high[1]`: 上等。叩き潰してやる
- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.bold.normal.high[2]`: 若いの、その意気だけは買ってやる。リングは別だがな

### bold.cool.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.bold.cool.high[1]`: 受けてやる。それだけのことだ

### earnest.normal.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.earnest.normal.high[1]`: ……来なさい。それが、あなたの覚悟なら
- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.earnest.normal.high[2]`: わかった。今日は、本気で迎え撃つ

### earnest.polite.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.earnest.polite.high[1]`: 光栄です。全力で、お相手します

### quiet.normal.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.quiet.normal.high[1]`: ……いいだろう

### emotional.normal.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.emotional.normal.high[1]`: そんな顔で来られたら――退けないじゃない

### easygoing.normal.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.easygoing.normal.high[1]`: おう、来るかい。じゃあ行こう

### shy.normal.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.shy.normal.high[1]`: ……負けません。今日は

### normal.normal.high[]

- `INTERNAL_CHALLENGE_PRE_LEADER_LINES.normal.normal.high[1]`: 受けて立つ。リングで会おう

## `INTERNAL_CHALLENGE_POST_WINNER_LINES`

- 出典: `src/data-faction-dialogue.js`
- 本数: 9

### bold.normal.high[]

- `INTERNAL_CHALLENGE_POST_WINNER_LINES.bold.normal.high[1]`: これで、あたしが先頭に立つ。文句あるか
- `INTERNAL_CHALLENGE_POST_WINNER_LINES.bold.normal.high[2]`: 後ろのみんな、ついて来な。ここからだ

### earnest.normal.high[]

- `INTERNAL_CHALLENGE_POST_WINNER_LINES.earnest.normal.high[1]`: ……ありがとうございました。この座、必ず守ります
- `INTERNAL_CHALLENGE_POST_WINNER_LINES.earnest.normal.high[2]`: 重い……でも、引き受けます

### quiet.normal.high[]

- `INTERNAL_CHALLENGE_POST_WINNER_LINES.quiet.normal.high[1]`: ……勝った。それだけ

### emotional.normal.high[]

- `INTERNAL_CHALLENGE_POST_WINNER_LINES.emotional.normal.high[1]`: 勝った……勝っちゃった……

### easygoing.normal.high[]

- `INTERNAL_CHALLENGE_POST_WINNER_LINES.easygoing.normal.high[1]`: あー、勝っちゃったか。じゃ、頑張りますわ

### shy.normal.high[]

- `INTERNAL_CHALLENGE_POST_WINNER_LINES.shy.normal.high[1]`: ……ほんとうに、勝てるなんて

### normal.normal.high[]

- `INTERNAL_CHALLENGE_POST_WINNER_LINES.normal.normal.high[1]`: 勝った。これからはわたしが先頭に立つ

## `INTERNAL_CHALLENGE_POST_LOSER_LINES`

- 出典: `src/data-faction-dialogue.js`
- 本数: 21

- `INTERNAL_CHALLENGE_POST_LOSER_LINES.bold.normal.hp_high[1]`: ……次はねえぞ。覚えとけ
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.bold.normal.hp_high[2]`: ふん、今日は譲ってやる。それだけだ
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.bold.normal.hp_mid[1]`: ……認めるしかねえな、今日は
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.bold.normal.hp_low[1]`: ……強かった
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.earnest.normal.hp_high[1]`: ……あなたの方が、上でした。素直に認めます
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.earnest.normal.hp_high[2]`: あとは、お任せします。立派に、組を率いてください
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.earnest.normal.hp_mid[1]`: ……負けました。次は、支える側に回ります
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.earnest.normal.hp_low[1]`: ……託します
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.quiet.normal.hp_high[1]`: ……負けた
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.quiet.normal.hp_mid[1]`: ……うむ
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.emotional.normal.hp_high[1]`: ……ごめんね、みんな。守れなかった
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.emotional.normal.hp_mid[1]`: ……うちの背中、もう、頼りにならないかな
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.emotional.normal.hp_low[1]`: ……ごめん
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.easygoing.normal.hp_high[1]`: はー、抜かれちゃったか。次の子、頑張れよ
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.easygoing.normal.hp_mid[1]`: やられたなあ、参った参った
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.easygoing.normal.hp_low[1]`: ……参った
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.shy.normal.hp_high[1]`: ……ごめんなさい、わたしのせいで
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.shy.normal.hp_mid[1]`: ……すみません
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.normal.normal.hp_high[1]`: 負けた。あとは任せる
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.normal.normal.hp_mid[1]`: やられた。次は支える側に回る
- `INTERNAL_CHALLENGE_POST_LOSER_LINES.normal.normal.hp_low[1]`: ……託す

## `_F01_ARCHETYPE_META`

- 出典: `src/ui-common.js`
- コード内コメント: F01 アーキタイプ別の前置き文 + A 選択肢補足（spec faction-archetype-rework-spec-v0.1.md §5.1）
- 本数: 24

- `_F01_ARCHETYPE_META.authoritarian.flavorText`: リーダーへの一方向の追従が強く、トップダウンの色が濃いようです。
- `_F01_ARCHETYPE_META.authoritarian.aLabel`: 正式なチームとして認める
- `_F01_ARCHETYPE_META.authoritarian.aHint`: 権威型として承認（authoritativeTag）。求心力と引き換えにロッカー士気が下がる。
- `_F01_ARCHETYPE_META.authoritarian.archLabel`: 権威型
- `_F01_ARCHETYPE_META.bond_first.flavorText`: 上下というより、横の絆で繋がった集まりのようです。
- `_F01_ARCHETYPE_META.bond_first.aLabel`: チームとして後押しする
- `_F01_ARCHETYPE_META.bond_first.aHint`: 結束型として承認（bondTag）。メンバー間 bond +5〜+8、ロッカー士気 +1〜+2。
- `_F01_ARCHETYPE_META.bond_first.archLabel`: 結束型
- `_F01_ARCHETYPE_META.meritocratic.flavorText`: OVR を強く意識した、自負心の高い者同士の集まりに見えます。
- `_F01_ARCHETYPE_META.meritocratic.aLabel`: 実力主義のチームとして認める
- `_F01_ARCHETYPE_META.meritocratic.aHint`: 実力主義として承認（meritTag）。bond +2〜+3（敬意ベース）、士気 -1〜-2。
- `_F01_ARCHETYPE_META.meritocratic.archLabel`: 実力主義
- `_F01_ARCHETYPE_META.heel.flavorText`: 反主流派の色が濃く、観客を挑発する姿勢が共通しているようです。
- `_F01_ARCHETYPE_META.heel.aLabel`: ヒール派閥として承認する
- `_F01_ARCHETYPE_META.heel.aHint`: ヒール派閥として承認（heelTag）。bond +3〜+4、次回興行集客一時+。
- `_F01_ARCHETYPE_META.heel.archLabel`: ヒール派閥
- `_F01_ARCHETYPE_META.face.flavorText`: 王道・ベビーフェイスの旗印で、団体の顔を担う気概が見えます。
- `_F01_ARCHETYPE_META.face.aLabel`: 正統派として承認する
- `_F01_ARCHETYPE_META.face.aHint`: 正統派として承認（faceTag）。bond +3〜+4、次回興行集客一時+ + メディア露出収益。
- `_F01_ARCHETYPE_META.face.archLabel`: 正統派
- `_F01_ARCHETYPE_META.combat.flavorText`: 攻めの姿勢を共有する集まりで、メインを取りに行く色が濃いようです。
- `_F01_ARCHETYPE_META.combat.aLabel`: 武闘派として承認する
- `_F01_ARCHETYPE_META.combat.aHint`: 武闘派として承認（combatTag）。リーダー momentum +5、派閥外 rivalry が生まれやすくなる。
- `_F01_ARCHETYPE_META.combat.archLabel`: 武闘派

## `_F07_INCIDENT_META`

- 出典: `src/ui-common.js`
- コード内コメント: F07 v0.4: 派閥動向（Office 応接室型 / modalShape choice2 or choice3） / trio 配置は維持し、incidentType により本文・選択肢を分岐。 / 互換: incidentType 未指定の場合は旧 DEMAND_ABSTRACT 3 択挙動を表示。
- 本数: 78

### DEMAND_MAIN.titleText

- `_F07_INCIDENT_META.DEMAND_MAIN.titleText`: メインカード相談

### DEMAND_MAIN.choices[].label

- `_F07_INCIDENT_META.DEMAND_MAIN.choices[1].label`: 相談に乗る
- `_F07_INCIDENT_META.DEMAND_MAIN.choices[2].label`: 受け流す
- `_F07_INCIDENT_META.DEMAND_MAIN.choices[3].label`: 別ルートで応える

### DEMAND_MAIN.choices[].hint

- `_F07_INCIDENT_META.DEMAND_MAIN.choices[1].hint`: 次回興行のメイン提案で、{factionName}メンバーを優先候補にする。<br>派閥内では期待に応えたと受け止められそうだ。
- `_F07_INCIDENT_META.DEMAND_MAIN.choices[2].hint`: リーダーは不満を募らせるが、派閥外には公平な対応と映りそうだ。
- `_F07_INCIDENT_META.DEMAND_MAIN.choices[3].hint`: 要求自体には応じず、メンバーへの個別ケアで返す。<br>注意累積 +1。

### DEMAND_MONEY.titleText

- `_F07_INCIDENT_META.DEMAND_MONEY.titleText`: 待遇相談

### DEMAND_MONEY.choices[].label

- `_F07_INCIDENT_META.DEMAND_MONEY.choices[1].label`: 次オフで反映する
- `_F07_INCIDENT_META.DEMAND_MONEY.choices[2].label`: 受け流す
- `_F07_INCIDENT_META.DEMAND_MONEY.choices[3].label`: 個別ケアで応える

### DEMAND_MONEY.choices[].hint

- `_F07_INCIDENT_META.DEMAND_MONEY.choices[1].hint`: 次オフ契約交渉で +10% 反映予定（Phase D 実装）。<br>派閥メンバーは前向きな回答と受け止める。
- `_F07_INCIDENT_META.DEMAND_MONEY.choices[2].hint`: 待遇相談は黙認する。リーダーは不満を残しそうだ。
- `_F07_INCIDENT_META.DEMAND_MONEY.choices[3].hint`: メンバー一人一人に目を配る。<br>注意累積 +1。

### DEMAND_ABSTRACT.titleText

- `_F07_INCIDENT_META.DEMAND_ABSTRACT.titleText`: リーダーの要求

### DEMAND_ABSTRACT.choices[].label

- `_F07_INCIDENT_META.DEMAND_ABSTRACT.choices[1].label`: 権威を認める
- `_F07_INCIDENT_META.DEMAND_ABSTRACT.choices[2].label`: 釘を刺す
- `_F07_INCIDENT_META.DEMAND_ABSTRACT.choices[3].label`: 別の幹部を立てる

### DEMAND_ABSTRACT.choices[].hint

- `_F07_INCIDENT_META.DEMAND_ABSTRACT.choices[1].hint`: リーダーは満足するが、非メンバーとロッカー全体には反発が広がる。<br>権威型なら「独裁化」する。
- `_F07_INCIDENT_META.DEMAND_ABSTRACT.choices[2].hint`: リーダーは強く反発する一方、非メンバーには歓迎される。<br>4 回累積で権威型資格剥がし。
- `_F07_INCIDENT_META.DEMAND_ABSTRACT.choices[3].hint`: 現リーダーは反発し、別幹部は社長の意図を汲む。<br>権威型資格は剥がれるが、派閥内に新たな対立軸。

### DEMAND_RECOGNITION.titleText

- `_F07_INCIDENT_META.DEMAND_RECOGNITION.titleText`: 評価要求

### DEMAND_RECOGNITION.choices[].label

- `_F07_INCIDENT_META.DEMAND_RECOGNITION.choices[1].label`: 貢献を認める
- `_F07_INCIDENT_META.DEMAND_RECOGNITION.choices[2].label`: 受け流す
- `_F07_INCIDENT_META.DEMAND_RECOGNITION.choices[3].label`: 個別の声かけで応える

### DEMAND_RECOGNITION.choices[].hint

- `_F07_INCIDENT_META.DEMAND_RECOGNITION.choices[1].hint`: 派閥メンバーは報われたと感じ、ロッカーの空気も少し明るくなる。
- `_F07_INCIDENT_META.DEMAND_RECOGNITION.choices[2].hint`: リーダーは評価されなかったと感じそうだ。
- `_F07_INCIDENT_META.DEMAND_RECOGNITION.choices[3].hint`: メンバーごとに労をねぎらう。注意累積 +1。

### OBSERVE_RIVAL_HEAT.titleText

- `_F07_INCIDENT_META.OBSERVE_RIVAL_HEAT.titleText`: 派閥外への当たり

### OBSERVE_RIVAL_HEAT.choices[].label

- `_F07_INCIDENT_META.OBSERVE_RIVAL_HEAT.choices[1].label`: 介入する
- `_F07_INCIDENT_META.OBSERVE_RIVAL_HEAT.choices[2].label`: 黙認する
- `_F07_INCIDENT_META.OBSERVE_RIVAL_HEAT.choices[3].label`: 別ルートで諭す

### OBSERVE_RIVAL_HEAT.choices[].hint

- `_F07_INCIDENT_META.OBSERVE_RIVAL_HEAT.choices[1].hint`: リーダーは口出しに反発するが、標的になった選手は守られたと感じる。
- `_F07_INCIDENT_META.OBSERVE_RIVAL_HEAT.choices[2].hint`: リーダーは勢いづく一方、標的とロッカー全体に不満が残る。
- `_F07_INCIDENT_META.OBSERVE_RIVAL_HEAT.choices[3].hint`: リーダーの顔を立てつつ、標的を個別に支える。注意累積 +1。

### OBSERVE_ABSENCE.titleText

- `_F07_INCIDENT_META.OBSERVE_ABSENCE.titleText`: 練習サボり連鎖

### OBSERVE_ABSENCE.choices[].label

- `_F07_INCIDENT_META.OBSERVE_ABSENCE.choices[1].label`: 介入する
- `_F07_INCIDENT_META.OBSERVE_ABSENCE.choices[2].label`: 黙認する
- `_F07_INCIDENT_META.OBSERVE_ABSENCE.choices[3].label`: 別ルートで諭す

### OBSERVE_ABSENCE.choices[].hint

- `_F07_INCIDENT_META.OBSERVE_ABSENCE.choices[1].hint`: 派閥は反発するが、ロッカー全体には規律を示せる。
- `_F07_INCIDENT_META.OBSERVE_ABSENCE.choices[2].hint`: リーダーは満足するが、ロッカー全体の空気が悪くなる。
- `_F07_INCIDENT_META.OBSERVE_ABSENCE.choices[3].hint`: コーチ経由で個別ケア／注意累積 +1。

### OBSERVE_INTERNAL_RANK.titleText

- `_F07_INCIDENT_META.OBSERVE_INTERNAL_RANK.titleText`: 内部格付け争い

### OBSERVE_INTERNAL_RANK.choices[].label

- `_F07_INCIDENT_META.OBSERVE_INTERNAL_RANK.choices[1].label`: 介入する
- `_F07_INCIDENT_META.OBSERVE_INTERNAL_RANK.choices[2].label`: 黙認する
- `_F07_INCIDENT_META.OBSERVE_INTERNAL_RANK.choices[3].label`: 別ルートで諭す

### OBSERVE_INTERNAL_RANK.choices[].hint

- `_F07_INCIDENT_META.OBSERVE_INTERNAL_RANK.choices[1].hint`: リーダーは不服そうだが、中位メンバーは救われる。
- `_F07_INCIDENT_META.OBSERVE_INTERNAL_RANK.choices[2].hint`: リーダーの顔は立つが、ロッカーにわだかまりが残る。
- `_F07_INCIDENT_META.OBSERVE_INTERNAL_RANK.choices[3].hint`: 派閥内 bond 微増／注意累積 +1。

### OBSERVE_FAN_PRESSURE.titleText

- `_F07_INCIDENT_META.OBSERVE_FAN_PRESSURE.titleText`: ファン期待の重圧

### OBSERVE_FAN_PRESSURE.choices[].label

- `_F07_INCIDENT_META.OBSERVE_FAN_PRESSURE.choices[1].label`: 介入する
- `_F07_INCIDENT_META.OBSERVE_FAN_PRESSURE.choices[2].label`: 黙認する
- `_F07_INCIDENT_META.OBSERVE_FAN_PRESSURE.choices[3].label`: 別ルートで諭す

### OBSERVE_FAN_PRESSURE.choices[].hint

- `_F07_INCIDENT_META.OBSERVE_FAN_PRESSURE.choices[1].hint`: リーダーは不服そうだが、コンディションは回復する。
- `_F07_INCIDENT_META.OBSERVE_FAN_PRESSURE.choices[2].hint`: リーダーの意向を尊重する代わりに、コンディションが落ちる。
- `_F07_INCIDENT_META.OBSERVE_FAN_PRESSURE.choices[3].hint`: コンディション <strong>+3</strong>／注意累積 +1。

### OBSERVE_TRAINING_HARD.titleText

- `_F07_INCIDENT_META.OBSERVE_TRAINING_HARD.titleText`: 過度な追い込み

### OBSERVE_TRAINING_HARD.choices[].label

- `_F07_INCIDENT_META.OBSERVE_TRAINING_HARD.choices[1].label`: 介入する
- `_F07_INCIDENT_META.OBSERVE_TRAINING_HARD.choices[2].label`: 黙認する
- `_F07_INCIDENT_META.OBSERVE_TRAINING_HARD.choices[3].label`: 別ルートで諭す

### OBSERVE_TRAINING_HARD.choices[].hint

- `_F07_INCIDENT_META.OBSERVE_TRAINING_HARD.choices[1].hint`: リーダーは反発するが、メンバーの消耗を抑えられる。勢いは落ちる。
- `_F07_INCIDENT_META.OBSERVE_TRAINING_HARD.choices[2].hint`: リーダーは勢いづくが、怪我の危険が高まる。
- `_F07_INCIDENT_META.OBSERVE_TRAINING_HARD.choices[3].hint`: コーチ経由で調整／注意累積 +1。

### INCIDENT_BOUNDARY.titleText

- `_F07_INCIDENT_META.INCIDENT_BOUNDARY.titleText`: 派閥の壁

### INCIDENT_BOUNDARY.choices[].label

- `_F07_INCIDENT_META.INCIDENT_BOUNDARY.choices[1].label`: 注意する
- `_F07_INCIDENT_META.INCIDENT_BOUNDARY.choices[2].label`: 流す

### INCIDENT_BOUNDARY.choices[].hint

- `_F07_INCIDENT_META.INCIDENT_BOUNDARY.choices[1].hint`: リーダーは反発するが、対象選手は守られたと感じる。注意累積 +1。
- `_F07_INCIDENT_META.INCIDENT_BOUNDARY.choices[2].hint`: 派閥は勢いづく一方、対象選手に不満が残る。

### INCIDENT_BONDING.titleText

- `_F07_INCIDENT_META.INCIDENT_BONDING.titleText`: 派閥内結束

### INCIDENT_BONDING.choices[].label

- `_F07_INCIDENT_META.INCIDENT_BONDING.choices[1].label`: たしなめる
- `_F07_INCIDENT_META.INCIDENT_BONDING.choices[2].label`: 見守る

### INCIDENT_BONDING.choices[].hint

- `_F07_INCIDENT_META.INCIDENT_BONDING.choices[1].hint`: 派閥は少し不満を持つが、派閥外には公平な態度と映る。
- `_F07_INCIDENT_META.INCIDENT_BONDING.choices[2].hint`: 派閥の結束は強まるが、派閥外には距離を置かれる。

### INCIDENT_HEEL_PROVOKE.titleText

- `_F07_INCIDENT_META.INCIDENT_HEEL_PROVOKE.titleText`: 観客挑発エピソード

### INCIDENT_HEEL_PROVOKE.choices[].label

- `_F07_INCIDENT_META.INCIDENT_HEEL_PROVOKE.choices[1].label`: 注意する
- `_F07_INCIDENT_META.INCIDENT_HEEL_PROVOKE.choices[2].label`: 流す

### INCIDENT_HEEL_PROVOKE.choices[].hint

- `_F07_INCIDENT_META.INCIDENT_HEEL_PROVOKE.choices[1].hint`: リーダーは反発。次回興行の集客が一時微減し、注意累積 +1。
- `_F07_INCIDENT_META.INCIDENT_HEEL_PROVOKE.choices[2].hint`: 次回興行集客一時+。
