# 選択イベント・大型イベント・社長室

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `DECISION_DOCS`

- 出典: `src/data.js`
- 本数: 63

- `DECISION_DOCS.bonus.label`: ボーナス支給願
- `DECISION_DOCS.bonus.categoryLabel`: 選手ケア
- `DECISION_DOCS.bonus.costLabel`: 起案額による
- `DECISION_DOCS.bonus.body`: 対象選手に特別手当を支給し、組織貢献への感謝を示す
- `DECISION_DOCS.bonus.detailText`: 起案された支給額の中から、いくら積むかを社長が決める。額面が彼女の格に見合ってこそ、誠意は伝わる。安すぎる額は、かえって心を離れさせることもある。
- `DECISION_DOCS.bonus.effectSummary`: 支給額しだいで本人の受け止め方が変わる。相場を大きく超える額は深く響く
- `DECISION_DOCS.bonus.recommendation`: 団体への気持ちが陰りはじめた選手に、早めに手を打つと効果的。同じ選手への再支給は相場が吊り上がる点に注意。
- `DECISION_DOCS.encourage.label`: 声かけ
- `DECISION_DOCS.encourage.categoryLabel`: 選手ケア
- `DECISION_DOCS.encourage.body`: 気にかけている選手に社長自ら声をかけに行く
- `DECISION_DOCS.encourage.detailText`: 決裁枠も資金も使わない、社長自らの自発的な行動。スランプ中・モチベ喪失中・最近様子が気になる選手に足を運んで声をかける。
- `DECISION_DOCS.encourage.effectSummary`: 本人の表情が少し和らぐ（スランプ・モチベ喪失なら回復促進も）
- `DECISION_DOCS.encourage.recommendation`: 気になる選手のポップアップから直接実行する。机には並ばない。
- `DECISION_DOCS.special_treatment.label`: 特別治療指示書
- `DECISION_DOCS.special_treatment.categoryLabel`: 選手ケア
- `DECISION_DOCS.special_treatment.body`: 離脱中の選手に専門医を手配し、復帰を早める
- `DECISION_DOCS.special_treatment.detailText`: 専門医による集中ケアを正式に発注。怪我からの離脱期間を確率的に短縮する、復帰前倒しの一手。確実な短縮量は治療結果次第。
- `DECISION_DOCS.special_treatment.effectSummary`: 対象選手の離脱期間が1〜4週短縮される
- `DECISION_DOCS.special_treatment.recommendation`: 主力選手や王座挑戦が控えている選手の離脱が痛手なときに。離脱が長引いている怪我ほど短縮量も大きくなりやすい。
- `DECISION_DOCS.refresh_leave.label`: 休暇辞令
- `DECISION_DOCS.refresh_leave.categoryLabel`: 選手ケア
- `DECISION_DOCS.refresh_leave.costLabel`: 週給×週数+50万
- `DECISION_DOCS.refresh_leave.body`: 心身の疲弊を察し、一定期間の休養を与える
- `DECISION_DOCS.refresh_leave.detailText`: 1〜4週間の休暇を正式な辞令として発行する。休暇中の試合には欠場するが、そのぶん心身は着実に回復していく。長い休みは、積み重なった消耗までも癒やす。
- `DECISION_DOCS.refresh_leave.effectSummary`: 休みの長さに応じて体調が戻り、長期なら蓄積した消耗も癒える。本人にも気遣いが伝わる
- `DECISION_DOCS.refresh_leave.recommendation`: 疲れの見える主力を、大事な興行の前に立て直す疲労管理の要。休暇中の欠場と引き換えになる点は覚悟すること。
- `DECISION_DOCS.party.label`: 慰労会開催届
- `DECISION_DOCS.party.categoryLabel`: 選手ケア
- `DECISION_DOCS.party.body`: 団体の雰囲気を立て直すべく、慰労の宴席を設ける
- `DECISION_DOCS.party.detailText`: 全選手を集めた慰労の宴席。個別の数値を動かすより、ロッカールームの空気そのものを立て直すのが主目的。
- `DECISION_DOCS.party.effectSummary`: 選手同士の会話が増え、ロッカールームと社長への空気が柔らかくなる
- `DECISION_DOCS.party.recommendation`: ロッカールームの空気に少し陰りが見えてきたときの応急処置として。単発では決定打にならない点に留意。
- `DECISION_DOCS.trainer.label`: 外部コーチ招聘状
- `DECISION_DOCS.trainer.categoryLabel`: 育成
- `DECISION_DOCS.trainer.costLabel`: コーチの格による
- `DECISION_DOCS.trainer.body`: 今期の候補から外部コーチを選び、一人の選手に短期集中で指導を受けさせる
- `DECISION_DOCS.trainer.detailText`: 今期市場に出ている外部コーチの中から一人を選び、期間限定で招聘する。指導タイプと選手の相性、得意スタイルの一致が効果を左右する。招聘中は雇用コーチの指導から外れ、そのコーチに専念する。
- `DECISION_DOCS.trainer.effectSummary`: 4週間のあいだ対象選手の練習効果が上がる。コーチの格・相性・特殊能力しだいで伸び方が変わる
- `DECISION_DOCS.trainer.recommendation`: 今期の市場に出た顔ぶれを見て、伸ばしたい選手に合いそうな一人を選ぶ。同時に招聘できるのは1件のみ、同じ選手を続けて詰め込みすぎると効果が鈍る点に注意。
- `DECISION_DOCS.camp.label`: 合宿実施手配書
- `DECISION_DOCS.camp.categoryLabel`: 育成
- `DECISION_DOCS.camp.body`: 全選手を集中的に強化するため、合宿を実施する
- `DECISION_DOCS.camp.detailText`: 選手全員を合宿地へ送り込み、短期集中で基礎を鍛え直す。ひとり40万×人数ぶんの費用と決裁枠3を消費する重量級書類。
- `DECISION_DOCS.camp.effectSummary`: 2週間のあいだ全員の練習効果が上がり、団体全体に一体感が育つ
- `DECISION_DOCS.camp.recommendation`: 資金に余裕があり、オフシーズン前後に全体を底上げしたいとき。年1〜2回が現実的な使用頻度。
- `DECISION_DOCS.media.label`: メディア露出手配書
- `DECISION_DOCS.media.categoryLabel`: 広報
- `DECISION_DOCS.media.body`: 対象選手を広告塔とし、団体の知名度向上を図る
- `DECISION_DOCS.media.detailText`: 対象選手をメディア露出の広告塔として起用。団体の知名度向上と本人の体調維持を両立させる外向き施策。
- `DECISION_DOCS.media.effectSummary`: 選手人気と団体人気が上がり、体調が整う。本人も起用を前向きに受け止める
- `DECISION_DOCS.media.recommendation`: 団体人気がある程度育ってから解禁される書類。看板選手の体調管理と兼ねて回すと無駄がない。選手の人気を直接押し上げたい時にも有効。
- `DECISION_DOCS.relationship_repair.label`: 関係修復斡旋書
- `DECISION_DOCS.relationship_repair.categoryLabel`: 選手ケア
- `DECISION_DOCS.relationship_repair.body`: 長期的な険悪関係にあるペアの間に立ち、関係改善を図る
- `DECISION_DOCS.relationship_repair.detailText`: 勝負の世界では険悪な関係も時に武器になる。だが限度を超えると組織全体を蝕む。社長が間に立ち、最悪の事態を避ける。成功率は約70%。失敗しても関係はそのまま。
- `DECISION_DOCS.relationship_repair.effectSummary`: 成功時、双方向 bond +5〜+10。失敗時は据え置き。
- `DECISION_DOCS.relationship_repair.recommendation`: W-1（憎い敵ゾーン）が累計4回以上発火したペアに対して使用できる。慢性化する前に手を打てば、亀裂が修復可能になることもある。
- `DECISION_DOCS.hireCoach.label`: コーチ雇用決裁書
- `DECISION_DOCS.hireCoach.categoryLabel`: 人事
- `DECISION_DOCS.hireCoach.body`: 新たなスタッフを招聘し、団体の指導体制を強化する
- `DECISION_DOCS.hireCoach.detailText`: 新たなコーチを招聘し、指導体制を強化する。机には並ばず、コーチ画面から実行する特殊書類。
- `DECISION_DOCS.hireCoach.effectSummary`: コーチを1名新しく迎える(決裁枠を2消費)
- `DECISION_DOCS.hireCoach.recommendation`: コーチ枠に空きがあり、新規雇用を検討している週に。机に書類として表示されない点に注意。

## `BONUS_PROPOSAL_MEMOS`

- 出典: `src/data.js`
- コード内コメント: care-rework v0.1 §1.4: ボーナス起案4案の「起案メモ」(基準額×0.5/1.0/2.0/3.0 の順) / 効果を数字で明かさないぼかし表現。文言は Keisuke 承認済み — 変更時は要レビュー。
- 本数: 4

- `BONUS_PROPOSAL_MEMOS[1]`: 無難な線です。ただ、響くかどうかは相手次第かと。
- `BONUS_PROPOSAL_MEMOS[2]`: 彼女の格に見合った額かと存じます。
- `BONUS_PROPOSAL_MEMOS[3]`: 相場を超えています。誠意は伝わるはずです。
- `BONUS_PROPOSAL_MEMOS[4]`: ……思い切りましたな。ここまで出す団体は他にありません。

## `CAMP_FLAVOR_TEXTS`

- 出典: `src/data.js`
- コード内コメント: §2-5: 資金投入リアクションセリフ（特性別） / {name} はプレースホルダ
- 本数: 12

- `CAMP_FLAVOR_TEXTS[1]`: {name1}と{name2}が朝から激しいスパーリングを繰り広げている…！
- `CAMP_FLAVOR_TEXTS[2]`: 夜の自主練で{name1}が黙々とスクワットをしている…
- `CAMP_FLAVOR_TEXTS[3]`: {name1}が{name2}に技の受け身を教えている場面が見られた
- `CAMP_FLAVOR_TEXTS[4]`: 合宿の食事は{name1}が率先して準備していた
- `CAMP_FLAVOR_TEXTS[5]`: {name1}と{name2}が夕食後のランニングで競い合っている
- `CAMP_FLAVOR_TEXTS[6]`: 早朝の海辺で{name1}が一人、基礎練習に励んでいた
- `CAMP_FLAVOR_TEXTS[7]`: {name1}が新技の研究に没頭している姿が印象的だった
- `CAMP_FLAVOR_TEXTS[8]`: 消灯後も{name1}と{name2}がリングで語り合っていた
- `CAMP_FLAVOR_TEXTS[9]`: {name1}が合宿の記念写真を撮ろうとみんなを集めていた
- `CAMP_FLAVOR_TEXTS[10]`: 全員で浜辺を走るメニューに{name1}が一番乗りでゴールした
- `CAMP_FLAVOR_TEXTS[11]`: {name1}のムードメーカーぶりで合宿の雰囲気がぐっと明るくなった
- `CAMP_FLAVOR_TEXTS[12]`: 練習後の大浴場で{name1}と{name2}が今後の抱負を語り合っていた

## `CARE_REACTION_DIALOGUES`

- 出典: `src/data.js`
- 本数: 297

### bonus.normal._default[]

- `CARE_REACTION_DIALOGUES.bonus.normal._default[1]`: ありがとうございます！
- `CARE_REACTION_DIALOGUES.bonus.normal._default[2]`: いただきます…！
- `CARE_REACTION_DIALOGUES.bonus.normal._default[3]`: 感謝します
- `CARE_REACTION_DIALOGUES.bonus.normal._default[4]`: 励みになります！
- `CARE_REACTION_DIALOGUES.bonus.normal._default[5]`: 嬉しいです！大切に使います

### bonus.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.bonus.normal.ojousama[1]`: まあ、ありがとうございます。大切に使わせていただきます

### bonus.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.bonus.normal.delinquent[1]`: お、マジ？ ありがとな！

### bonus.normal.seductive[]

- `CARE_REACTION_DIALOGUES.bonus.normal.seductive[1]`: あら、嬉しい。ありがとう

### bonus.normal.composed[]

- `CARE_REACTION_DIALOGUES.bonus.normal.composed[1]`: …ありがとう。大事に使うよ

### bonus.bold._default[]

- `CARE_REACTION_DIALOGUES.bonus.bold._default[1]`: これで負けていられない！
- `CARE_REACTION_DIALOGUES.bonus.bold._default[2]`: よし！もっと強くなります！

### bonus.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.bonus.bold.ojousama[1]`: ありがとうございます。結果でお返しするわ

### bonus.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.bonus.bold.delinquent[1]`: おっしゃ！この金で栄養つけてもっと強くなるぜ！

### bonus.bold.cool[]

- `CARE_REACTION_DIALOGUES.bonus.bold.cool[1]`: …感謝する。結果で返す

### bonus.bold.seductive[]

- `CARE_REACTION_DIALOGUES.bonus.bold.seductive[1]`: 嬉しいわ。実力で返させてもらうわね

### bonus.bold.composed[]

- `CARE_REACTION_DIALOGUES.bonus.bold.composed[1]`: …ありがとう。結果で返すよ

### bonus.quiet._default[]

- `CARE_REACTION_DIALOGUES.bonus.quiet._default[1]`: ……ありがとうございます

### bonus.quiet.cool[]

- `CARE_REACTION_DIALOGUES.bonus.quiet.cool[1]`: …ありがたい

### bonus.quiet.polite[]

- `CARE_REACTION_DIALOGUES.bonus.quiet.polite[1]`: …ありがとうございます。大切に使います

### bonus.shy._default[]

- `CARE_REACTION_DIALOGUES.bonus.shy._default[1]`: え…あの…ありがとう、ございます…！

### bonus.shy.polite[]

- `CARE_REACTION_DIALOGUES.bonus.shy.polite[1]`: ぼ、ボーナスを…？ あ、ありがとうございます…大切に使わせていただきます…

### bonus.easygoing._default[]

- `CARE_REACTION_DIALOGUES.bonus.easygoing._default[1]`: やった！ありがとうございます！
- `CARE_REACTION_DIALOGUES.bonus.easygoing._default[2]`: おごってもらっちゃおうかな！

### bonus.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.bonus.easygoing.delinquent[1]`: やった！ラッキー！

### bonus.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.bonus.easygoing.seductive[1]`: あら嬉しい。何に使おうかしら

### bonus.earnest._default[]

- `CARE_REACTION_DIALOGUES.bonus.earnest._default[1]`: ありがとうございます！次の試合、絶対頑張ります！
- `CARE_REACTION_DIALOGUES.bonus.earnest._default[2]`: …いつもありがとうございます

### bonus.earnest.polite[]

- `CARE_REACTION_DIALOGUES.bonus.earnest.polite[1]`: ありがとうございます。必ず結果でお返しいたします

### bonus.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.bonus.earnest.ojousama[1]`: ありがとうございます。結果でお応えしますわ

### bonus.earnest.seductive[]

- `CARE_REACTION_DIALOGUES.bonus.earnest.seductive[1]`: ありがとう。ちゃんと結果で返すわ

### bonus.earnest.composed[]

- `CARE_REACTION_DIALOGUES.bonus.earnest.composed[1]`: …ありがたいね。次で応えるよ

### bonus.emotional._default[]

- `CARE_REACTION_DIALOGUES.bonus.emotional._default[1]`: え…！ありがとうございます…！嬉しい…！
- `CARE_REACTION_DIALOGUES.bonus.emotional._default[2]`: うわあ…嬉しくて泣きそう…！

### bonus.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.bonus.emotional.seductive[1]`: ボーナス……っ……気にかけてくれてたのね、嬉しい……ふふ、ありがとう……

### bonus_repeat.normal._default[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.normal._default[1]`: …また？
- `CARE_REACTION_DIALOGUES.bonus_repeat.normal._default[2]`: えっと…ありがとうございます
- `CARE_REACTION_DIALOGUES.bonus_repeat.normal._default[3]`: （また、お金…か…）

### bonus_repeat.bold._default[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.bold._default[1]`: …また金か。もういいよ

### bonus_repeat.shy._default[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.shy._default[1]`: あ…ありがとう、ございます…（また…？）

### bonus_repeat.shy.polite[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.shy.polite[1]`: ま、また…？ そんな、毎回いただいては…申し訳ないです…

### bonus_repeat.easygoing._default[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.easygoing._default[1]`: えっと…ありがと…？

### bonus_repeat.earnest._default[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.earnest._default[1]`: あの…気持ちは嬉しいんですが…

### bonus_repeat.emotional._default[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.emotional._default[1]`: …また…？（少し困った顔をしている）

### bonus_repeat.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.emotional.seductive[1]`: また……っ……ふふ、こんなに優しくされたら、応えないわけにはいかないわ……

### bonus_insult.normal._default[]

- `CARE_REACTION_DIALOGUES.bonus_insult.normal._default[1]`: ……これが、私の値段ですか
- `CARE_REACTION_DIALOGUES.bonus_insult.normal._default[2]`: ……お気持ちだけ、受け取っておきます

### bonus_insult.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.bonus_insult.normal.ojousama[1]`: まあ。……わたくし、この程度に見られていましたのね

### bonus_insult.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.bonus_insult.normal.delinquent[1]`: は？ ケチくさ。いらねーよ、こんなん

### bonus_insult.normal.cool[]

- `CARE_REACTION_DIALOGUES.bonus_insult.normal.cool[1]`: ……そう。わかった

### bonus_insult.normal.seductive[]

- `CARE_REACTION_DIALOGUES.bonus_insult.normal.seductive[1]`: あら……ずいぶん安く見られたものね

### bonus_insult.normal.composed[]

- `CARE_REACTION_DIALOGUES.bonus_insult.normal.composed[1]`: …これで済ませるつもりかい。そうか

### bonus_insult.bold._default[]

- `CARE_REACTION_DIALOGUES.bonus_insult.bold._default[1]`: この額で私が喜ぶと思ったんですか
- `CARE_REACTION_DIALOGUES.bonus_insult.bold._default[2]`: なめられたものね。受け取れない

### bonus_insult.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.bonus_insult.bold.ojousama[1]`: お断りしますわ。わたくしの価値は、この程度ではありませんの

### bonus_insult.quiet._default[]

- `CARE_REACTION_DIALOGUES.bonus_insult.quiet._default[1]`: …………（何も言わず、封筒を見つめている）

### bonus_insult.easygoing._default[]

- `CARE_REACTION_DIALOGUES.bonus_insult.easygoing._default[1]`: あはは……えっと、これは……うん……

### bonus_insult.earnest._default[]

- `CARE_REACTION_DIALOGUES.bonus_insult.earnest._default[1]`: ……私の頑張りは、これくらいなんですね

### bonus_insult.emotional._default[]

- `CARE_REACTION_DIALOGUES.bonus_insult.emotional._default[1]`: え……これだけ、ですか……私って、その程度なんだ……

### trainer.normal._default[]

- `CARE_REACTION_DIALOGUES.trainer.normal._default[1]`: 頑張ります！
- `CARE_REACTION_DIALOGUES.trainer.normal._default[2]`: 全力で取り組みます！
- `CARE_REACTION_DIALOGUES.trainer.normal._default[3]`: しっかり吸収します！

### trainer.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.trainer.normal.ojousama[1]`: 精一杯、学ばせていただきます

### trainer.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.trainer.normal.delinquent[1]`: おっしゃ、ガンガンやるぞ！

### trainer.normal.seductive[]

- `CARE_REACTION_DIALOGUES.trainer.normal.seductive[1]`: しっかり吸収させてもらうわね

### trainer.normal.composed[]

- `CARE_REACTION_DIALOGUES.trainer.normal.composed[1]`: …了解。しっかり吸収するよ

### trainer.bold._default[]

- `CARE_REACTION_DIALOGUES.trainer.bold._default[1]`: この環境を無駄にしない！絶対に結果を出す！
- `CARE_REACTION_DIALOGUES.trainer.bold._default[2]`: 最高の後押しね！限界まで追い込むよ！

### trainer.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.trainer.bold.ojousama[1]`: この機会、決して無駄にはしない

### trainer.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.trainer.bold.delinquent[1]`: 最高じゃん！限界まで追い込んでもらうぜ！

### trainer.bold.cool[]

- `CARE_REACTION_DIALOGUES.trainer.bold.cool[1]`: …ありがたい。結果を出す

### trainer.bold.seductive[]

- `CARE_REACTION_DIALOGUES.trainer.bold.seductive[1]`: この環境、無駄にしないわ。見ていてね

### trainer.bold.composed[]

- `CARE_REACTION_DIALOGUES.trainer.bold.composed[1]`: …いい機会だね。無駄にはしないよ

### trainer.quiet._default[]

- `CARE_REACTION_DIALOGUES.trainer.quiet._default[1]`: ……全力で、学びます

### trainer.quiet.cool[]

- `CARE_REACTION_DIALOGUES.trainer.quiet.cool[1]`: …吸収する。見ていてくれ

### trainer.quiet.polite[]

- `CARE_REACTION_DIALOGUES.trainer.quiet.polite[1]`: …精一杯学ばせていただきます

### trainer.shy._default[]

- `CARE_REACTION_DIALOGUES.trainer.shy._default[1]`: せ、専属の先生…！が、頑張ります…！

### trainer.shy.polite[]

- `CARE_REACTION_DIALOGUES.trainer.shy.polite[1]`: 専属トレーナー…ですか…あ、あの、よろしくお願いいたします…

### trainer.easygoing._default[]

- `CARE_REACTION_DIALOGUES.trainer.easygoing._default[1]`: マンツーマン！？ めちゃくちゃ贅沢じゃないですか！

### trainer.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.trainer.easygoing.delinquent[1]`: マンツーマン！？ 超贅沢じゃん！

### trainer.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.trainer.easygoing.seductive[1]`: マンツーマンなんて贅沢ね。楽しみだわ

### trainer.earnest._default[]

- `CARE_REACTION_DIALOGUES.trainer.earnest._default[1]`: 専属の先生がつくんですか…！もっと上手くなれます！
- `CARE_REACTION_DIALOGUES.trainer.earnest._default[2]`: こんな機会をいただけて…全力で応えます

### trainer.earnest.polite[]

- `CARE_REACTION_DIALOGUES.trainer.earnest.polite[1]`: こんな機会をいただけて…全力でお応えいたします

### trainer.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.trainer.earnest.ojousama[1]`: こんな機会をいただけますなんて…全力でお応えしますわ

### trainer.earnest.seductive[]

- `CARE_REACTION_DIALOGUES.trainer.earnest.seductive[1]`: こんな機会をもらえるなんて…全力で応えるわ

### trainer.earnest.composed[]

- `CARE_REACTION_DIALOGUES.trainer.earnest.composed[1]`: …ありがたいね。全部吸収させてもらうよ

### trainer.emotional._default[]

- `CARE_REACTION_DIALOGUES.trainer.emotional._default[1]`: ええっ…！専属トレーナー…！頑張ります…！嬉しい…！

### trainer.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.trainer.emotional.seductive[1]`: トレーナーをつけてくれるの……っ……ふふ、本気で育ててくれるのね……

### media.normal._default[]

- `CARE_REACTION_DIALOGUES.media.normal._default[1]`: よろしくお願いします！
- `CARE_REACTION_DIALOGUES.media.normal._default[2]`: ありがとうございます！
- `CARE_REACTION_DIALOGUES.media.normal._default[3]`: 緊張するけど…頑張ります！

### media.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.media.normal.ojousama[1]`: メディアのお仕事ですの？ 精一杯務めます

### media.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.media.normal.delinquent[1]`: テレビ？ やってやるよ！

### media.normal.seductive[]

- `CARE_REACTION_DIALOGUES.media.normal.seductive[1]`: メディア出演…？ 楽しみだわ

### media.normal.composed[]

- `CARE_REACTION_DIALOGUES.media.normal.composed[1]`: …なるほど。やってみるよ

### media.bold._default[]

- `CARE_REACTION_DIALOGUES.media.bold._default[1]`: もっと広い舞台に出たかった。ありがとう！
- `CARE_REACTION_DIALOGUES.media.bold._default[2]`: 注目される場は大歓迎！存在感見せてあげる！

### media.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.media.bold.ojousama[1]`: より広い舞台へということね。当然ね。

### media.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.media.bold.delinquent[1]`: 注目されんの大歓迎！やってやるぜ！

### media.bold.cool[]

- `CARE_REACTION_DIALOGUES.media.bold.cool[1]`: …いい機会だ。結果を出す

### media.bold.seductive[]

- `CARE_REACTION_DIALOGUES.media.bold.seductive[1]`: 注目される場って好きよ。任せて

### media.bold.composed[]

- `CARE_REACTION_DIALOGUES.media.bold.composed[1]`: …いい機会だね。任せて

### media.quiet._default[]

- `CARE_REACTION_DIALOGUES.media.quiet._default[1]`: …が、頑張ります

### media.quiet.cool[]

- `CARE_REACTION_DIALOGUES.media.quiet.cool[1]`: ……やる

### media.quiet.polite[]

- `CARE_REACTION_DIALOGUES.media.quiet.polite[1]`: …緊張しますが、精一杯頑張ります

### media.shy._default[]

- `CARE_REACTION_DIALOGUES.media.shy._default[1]`: え…テレビ…？ き、緊張します…で、でも頑張ります…！

### media.shy.polite[]

- `CARE_REACTION_DIALOGUES.media.shy.polite[1]`: メ、メディア出演…ですか…き、緊張しますけど…や、やってみます…

### media.easygoing._default[]

- `CARE_REACTION_DIALOGUES.media.easygoing._default[1]`: テレビ！？ ファンのみんな見てる〜？

### media.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.media.easygoing.delinquent[1]`: テレビ！？ みんな見てるー？

### media.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.media.easygoing.seductive[1]`: テレビ？ みんなに見てもらえるのね。楽しみ

### media.earnest._default[]

- `CARE_REACTION_DIALOGUES.media.earnest._default[1]`: うわあ、緊張する…でも頑張ります！
- `CARE_REACTION_DIALOGUES.media.earnest._default[2]`: 団体の看板として恥ずかしくないようにします

### media.earnest.polite[]

- `CARE_REACTION_DIALOGUES.media.earnest.polite[1]`: 緊張いたしますが…精一杯務めます

### media.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.media.earnest.ojousama[1]`: 団体の看板として恥ずかしくない姿をお見せしますわ

### media.earnest.seductive[]

- `CARE_REACTION_DIALOGUES.media.earnest.seductive[1]`: 緊張するけど…精一杯やるわ

### media.earnest.composed[]

- `CARE_REACTION_DIALOGUES.media.earnest.composed[1]`: …いつも通りやればいいよ。大丈夫

### media.emotional._default[]

- `CARE_REACTION_DIALOGUES.media.emotional._default[1]`: テレビ…！？ うわあ…緊張するけど嬉しい…！頑張る…！

### media.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.media.emotional.seductive[1]`: メディアに……っ……ふふ、わたしを世間に見せたいのね、いいわ……

### special_treatment.normal._default[]

- `CARE_REACTION_DIALOGUES.special_treatment.normal._default[1]`: 専門の先生まで…ありがとうございます。早く戻ります
- `CARE_REACTION_DIALOGUES.special_treatment.normal._default[2]`: こんなに気にかけていただけるなんて…必ず復帰します

### special_treatment.normal.polite[]

- `CARE_REACTION_DIALOGUES.special_treatment.normal.polite[1]`: ご丁寧な治療を…ありがとうございます。一日でも早く戻ります

### special_treatment.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.special_treatment.normal.ojousama[1]`: まあ…そこまでしてくださるなんて。早く戻りますわ

### special_treatment.normal.composed[]

- `CARE_REACTION_DIALOGUES.special_treatment.normal.composed[1]`: …ありがとう。リング、待たせちゃ悪いね

### special_treatment.bold._default[]

- `CARE_REACTION_DIALOGUES.special_treatment.bold._default[1]`: 早く戻る…！ こんなとこで止まってられない！
- `CARE_REACTION_DIALOGUES.special_treatment.bold._default[2]`: すぐ治します！次の試合は絶対ものにする！

### special_treatment.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.special_treatment.bold.delinquent[1]`: しゃあ！すぐ治して暴れに戻るぜ！

### special_treatment.bold.cool[]

- `CARE_REACTION_DIALOGUES.special_treatment.bold.cool[1]`: …無駄にはしない。すぐ戻る

### special_treatment.bold.composed[]

- `CARE_REACTION_DIALOGUES.special_treatment.bold.composed[1]`: …早く戻るよ。ありがとう

### special_treatment.quiet._default[]

- `CARE_REACTION_DIALOGUES.special_treatment.quiet._default[1]`: …ありがとうございます。早く、戻ります

### special_treatment.quiet.cool[]

- `CARE_REACTION_DIALOGUES.special_treatment.quiet.cool[1]`: …感謝する。早く戻る

### special_treatment.quiet.polite[]

- `CARE_REACTION_DIALOGUES.special_treatment.quiet.polite[1]`: …そんなに気遣っていただいて。早く戻ります

### special_treatment.easygoing._default[]

- `CARE_REACTION_DIALOGUES.special_treatment.easygoing._default[1]`: うわ、専門医まで…！ 早く戻りますね〜！

### special_treatment.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.special_treatment.easygoing.delinquent[1]`: マジか！すぐ治してくる！

### special_treatment.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.special_treatment.easygoing.seductive[1]`: ふふ、こんなに大事にされたら、頑張らなきゃ

### special_treatment.earnest._default[]

- `CARE_REACTION_DIALOGUES.special_treatment.earnest._default[1]`: こんなに気にかけてもらえるなんて…必ず期待に応えます
- `CARE_REACTION_DIALOGUES.special_treatment.earnest._default[2]`: …私のためにここまで…早く戻って、結果でお返しします

### special_treatment.earnest.polite[]

- `CARE_REACTION_DIALOGUES.special_treatment.earnest.polite[1]`: …ご厚意に甘えます。必ず復帰してお返しいたします

### special_treatment.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.special_treatment.earnest.ojousama[1]`: そこまでお気遣いを…必ずや復帰してお応えしますわ

### special_treatment.earnest.composed[]

- `CARE_REACTION_DIALOGUES.special_treatment.earnest.composed[1]`: …そこまでしてくれるんだ。早く戻って返すよ

### special_treatment.emotional._default[]

- `CARE_REACTION_DIALOGUES.special_treatment.emotional._default[1]`: …っ、こんなにしてもらって…っ、絶対早く戻ります…！

### special_treatment.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.special_treatment.emotional.seductive[1]`: そこまで…してくれるの…っ、嬉しい……早く戻るわ……

### encourage.normal._default[]

- `CARE_REACTION_DIALOGUES.encourage.normal._default[1]`: ありがとうございます…
- `CARE_REACTION_DIALOGUES.encourage.normal._default[2]`: もう少し、頑張ってみます
- `CARE_REACTION_DIALOGUES.encourage.normal._default[3]`: その言葉、嬉しかったです

### encourage.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.encourage.normal.ojousama[1]`: …ありがとうございます。もう少し、頑張ってみます

### encourage.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.encourage.normal.delinquent[1]`: …サンキュ。もうちょいやってみるわ

### encourage.normal.seductive[]

- `CARE_REACTION_DIALOGUES.encourage.normal.seductive[1]`: …ありがとう。もう少し、頑張ってみるわ

### encourage.normal.composed[]

- `CARE_REACTION_DIALOGUES.encourage.normal.composed[1]`: …ありがとう。もう少しやってみるよ

### encourage.bold._default[]

- `CARE_REACTION_DIALOGUES.encourage.bold._default[1]`: こんなところで止まってられない！次は絶対やるから！
- `CARE_REACTION_DIALOGUES.encourage.bold._default[2]`: …分かった。まだ諦めない

### encourage.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.encourage.bold.ojousama[1]`: こんなところで終わりませんわ！

### encourage.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.encourage.bold.delinquent[1]`: 止まってられるかよ！次は絶対やってやる！

### encourage.bold.cool[]

- `CARE_REACTION_DIALOGUES.encourage.bold.cool[1]`: …まだ終わっていない。やる

### encourage.bold.seductive[]

- `CARE_REACTION_DIALOGUES.encourage.bold.seductive[1]`: 止まるつもりはないわ。見ていてね

### encourage.bold.composed[]

- `CARE_REACTION_DIALOGUES.encourage.bold.composed[1]`: …まだ終わってないよ。やるだけやる

### encourage.quiet._default[]

- `CARE_REACTION_DIALOGUES.encourage.quiet._default[1]`: ………ありがとう、ございます

### encourage.quiet.cool[]

- `CARE_REACTION_DIALOGUES.encourage.quiet.cool[1]`: ……分かった

### encourage.quiet.polite[]

- `CARE_REACTION_DIALOGUES.encourage.quiet.polite[1]`: …お言葉、ありがとうございます

### encourage.shy._default[]

- `CARE_REACTION_DIALOGUES.encourage.shy._default[1]`: …声をかけてもらえて…嬉しかったです…頑張ります…

### encourage.shy.polite[]

- `CARE_REACTION_DIALOGUES.encourage.shy.polite[1]`: あ、ありがとうございます…そう言っていただけると、頑張れます…

### encourage.easygoing._default[]

- `CARE_REACTION_DIALOGUES.encourage.easygoing._default[1]`: うわー、しんみりした！でも元気出た！やってやる！
- `CARE_REACTION_DIALOGUES.encourage.easygoing._default[2]`: よし！やってやる！

### encourage.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.encourage.easygoing.delinquent[1]`: おっしゃ！元気出た！やってやるわ！

### encourage.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.encourage.easygoing.seductive[1]`: ふふ、元気出ちゃった。やってみるわ

### encourage.earnest._default[]

- `CARE_REACTION_DIALOGUES.encourage.earnest._default[1]`: ありがとうございます…もう一度、頑張ってみます！
- `CARE_REACTION_DIALOGUES.encourage.earnest._default[2]`: その言葉、すごく嬉しかったです。頑張ります！

### encourage.earnest.polite[]

- `CARE_REACTION_DIALOGUES.encourage.earnest.polite[1]`: お言葉、ありがとうございます。もう一度頑張ります

### encourage.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.encourage.earnest.ojousama[1]`: ありがとうございます…もう一度、頑張ってみますわ

### encourage.earnest.seductive[]

- `CARE_REACTION_DIALOGUES.encourage.earnest.seductive[1]`: ありがとう…もう一度、頑張ってみるわ

### encourage.earnest.composed[]

- `CARE_REACTION_DIALOGUES.encourage.earnest.composed[1]`: …その言葉、ありがたいよ。もう少し踏ん張ってみる

### encourage.emotional._default[]

- `CARE_REACTION_DIALOGUES.encourage.emotional._default[1]`: …っ！ありがとうございます…！もう一回…もう一回頑張ります…！

### encourage.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.encourage.emotional.seductive[1]`: 励まし……っ……ふふ、その言葉だけで、力が湧いてくるの……

### encourage_high_trust.normal._default[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.normal._default[1]`: ずっと見てくれてたんですね…頑張ります！
- `CARE_REACTION_DIALOGUES.encourage_high_trust.normal._default[2]`: あなたに言われると、本当に力が出ます！

### encourage_high_trust.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.normal.ojousama[1]`: ずっと見守ってくださったんですのね…その気持ちに、お応えしなくては

### encourage_high_trust.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.normal.delinquent[1]`: …アンタに言われると、やんなきゃって思うんだよ

### encourage_high_trust.normal.seductive[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.normal.seductive[1]`: ずっと見てくれてたのね…嬉しい。頑張るわ

### encourage_high_trust.normal.composed[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.normal.composed[1]`: …見てくれてたんだ。…悪くないね

### encourage_high_trust.bold._default[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.bold._default[1]`: 信じてくれるなら、絶対やるよ！
- `CARE_REACTION_DIALOGUES.encourage_high_trust.bold._default[2]`: 期待には必ず応える！

### encourage_high_trust.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.bold.ojousama[1]`: あなたが信じているなら、応えてあげないとかしらね？

### encourage_high_trust.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.bold.delinquent[1]`: アンタが信じてくれんなら、やってやるよ！

### encourage_high_trust.bold.cool[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.bold.cool[1]`: …信じてくれるなら、応える

### encourage_high_trust.bold.seductive[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.bold.seductive[1]`: あなたが信じてくれるなら…絶対応えるわ

### encourage_high_trust.bold.composed[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.bold.composed[1]`: …信じてくれるなら、応えないとね

### encourage_high_trust.quiet._default[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.quiet._default[1]`: ……ずっと、見てくれてたんですね

### encourage_high_trust.quiet.cool[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.quiet.cool[1]`: …分かった。応える

### encourage_high_trust.quiet.polite[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.quiet.polite[1]`: …ずっと見守ってくださったんですね。お応えします

### encourage_high_trust.shy._default[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.shy._default[1]`: ずっと…見てくれてたんですか…？ わ、私…頑張ります…！

### encourage_high_trust.shy.polite[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.shy.polite[1]`: いつも気にかけてくださって…あ、あの、本当に感謝しています…

### encourage_high_trust.easygoing._default[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.easygoing._default[1]`: えへへ…見てくれてたんだ。もうちょっと頑張ろうかな！

### encourage_high_trust.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.easygoing.delinquent[1]`: 見てくれてたんだ？ じゃ、もうちょいやるか！

### encourage_high_trust.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.easygoing.seductive[1]`: 見てくれてたのね。嬉しいわ。もう少し頑張ってみるわ

### encourage_high_trust.earnest._default[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.earnest._default[1]`: あなたに言われると、本当に力が出ます！もっと頑張れます！
- `CARE_REACTION_DIALOGUES.encourage_high_trust.earnest._default[2]`: ずっと見てくれてたんですね…絶対に報いてみせます

### encourage_high_trust.earnest.polite[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.earnest.polite[1]`: ずっと見守ってくださったんですね…必ずお報いいたします

### encourage_high_trust.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.earnest.ojousama[1]`: ずっと見てくださったんですのね…お報いしますわ

### encourage_high_trust.earnest.seductive[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.earnest.seductive[1]`: ずっと見てくれてたのね…絶対に報いるわ

### encourage_high_trust.earnest.composed[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.earnest.composed[1]`: …ずっと見てくれてたんだ。…ありがとう。応えるよ

### encourage_high_trust.emotional._default[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.emotional._default[1]`: …っ！ずっと見てくれてたんですね…！泣いちゃう…でも頑張る…！

### encourage_high_trust.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.emotional.seductive[1]`: あなたの言葉だけで……っ……わたし、何でもできちゃいそうなの……ふふ……

### refresh_leave.normal._default[]

- `CARE_REACTION_DIALOGUES.refresh_leave.normal._default[1]`: ありがとうございます！行ってきます！
- `CARE_REACTION_DIALOGUES.refresh_leave.normal._default[2]`: ゆっくり休んで戻ってきます！
- `CARE_REACTION_DIALOGUES.refresh_leave.normal._default[3]`: ありがとうございます…少し、休みます

### refresh_leave.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.refresh_leave.normal.ojousama[1]`: ありがとうございます。リフレッシュして戻って参ります

### refresh_leave.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.refresh_leave.normal.delinquent[1]`: サンキュ！ちょっと休んでくるわ

### refresh_leave.normal.seductive[]

- `CARE_REACTION_DIALOGUES.refresh_leave.normal.seductive[1]`: ありがとう。リフレッシュしてくるわね

### refresh_leave.normal.composed[]

- `CARE_REACTION_DIALOGUES.refresh_leave.normal.composed[1]`: …ありがとう。少し休んでくるよ

### refresh_leave.bold._default[]

- `CARE_REACTION_DIALOGUES.refresh_leave.bold._default[1]`: リフレッシュして、もっと上を目指す！
- `CARE_REACTION_DIALOGUES.refresh_leave.bold._default[2]`: 充電して戻ってくる！

### refresh_leave.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.refresh_leave.bold.ojousama[1]`: すこし休んでまいりますわ。ごめんあそばせ。

### refresh_leave.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.refresh_leave.bold.delinquent[1]`: 充電してくる！戻ったら全開だぜ！

### refresh_leave.bold.cool[]

- `CARE_REACTION_DIALOGUES.refresh_leave.bold.cool[1]`: …充電してくる。戻ったら結果を出す

### refresh_leave.bold.seductive[]

- `CARE_REACTION_DIALOGUES.refresh_leave.bold.seductive[1]`: リフレッシュしてくるわ。戻ったらもっと輝くから

### refresh_leave.bold.composed[]

- `CARE_REACTION_DIALOGUES.refresh_leave.bold.composed[1]`: …充電してくるよ。戻ったらまた行こう

### refresh_leave.quiet._default[]

- `CARE_REACTION_DIALOGUES.refresh_leave.quiet._default[1]`: …少し、休みます。ありがとうございます

### refresh_leave.quiet.cool[]

- `CARE_REACTION_DIALOGUES.refresh_leave.quiet.cool[1]`: …感謝する。少し休む

### refresh_leave.quiet.polite[]

- `CARE_REACTION_DIALOGUES.refresh_leave.quiet.polite[1]`: …ありがとうございます。少し休ませていただきます

### refresh_leave.shy._default[]

- `CARE_REACTION_DIALOGUES.refresh_leave.shy._default[1]`: あの…休んでいいんですか…？ ありがとうございます…

### refresh_leave.shy.polite[]

- `CARE_REACTION_DIALOGUES.refresh_leave.shy.polite[1]`: お休みを…？ あ、あの…ありがとうございます、ゆっくり休ませていただきます…

### refresh_leave.easygoing._default[]

- `CARE_REACTION_DIALOGUES.refresh_leave.easygoing._default[1]`: やった！バカンスだ！でも戻ったら本気出します！

### refresh_leave.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.refresh_leave.easygoing.delinquent[1]`: バカンスだー！戻ったら本気出すから！

### refresh_leave.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.refresh_leave.easygoing.seductive[1]`: バカンスね。リフレッシュして戻るわ

### refresh_leave.earnest._default[]

- `CARE_REACTION_DIALOGUES.refresh_leave.earnest._default[1]`: え…でも練習が…でも、ありがとうございます！
- `CARE_REACTION_DIALOGUES.refresh_leave.earnest._default[2]`: …そんなに気にかけてもらえるとは。ありがとうございます

### refresh_leave.earnest.polite[]

- `CARE_REACTION_DIALOGUES.refresh_leave.earnest.polite[1]`: 練習が気になりますが…お気遣いありがとうございます

### refresh_leave.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.refresh_leave.earnest.ojousama[1]`: 練習のことが気になりますけれど…お心遣い、ありがとうございますわ

### refresh_leave.earnest.seductive[]

- `CARE_REACTION_DIALOGUES.refresh_leave.earnest.seductive[1]`: 練習が気になるけど…ありがとう。休んでくるわ

### refresh_leave.earnest.composed[]

- `CARE_REACTION_DIALOGUES.refresh_leave.earnest.composed[1]`: …まあ、たまには休むのも大事だよね。ありがとう

### refresh_leave.emotional._default[]

- `CARE_REACTION_DIALOGUES.refresh_leave.emotional._default[1]`: 休んでいいんですか…？ ありがとうございます…リフレッシュしてきます…！

### refresh_leave.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.refresh_leave.emotional.seductive[1]`: 休暇……っ……気を遣ってくれたのね、ふふ、嬉しいわ……

### party.normal._default[]

- `CARE_REACTION_DIALOGUES.party.normal._default[1]`: お疲れ様でした〜！
- `CARE_REACTION_DIALOGUES.party.normal._default[2]`: みんなで楽しく過ごせました！
- `CARE_REACTION_DIALOGUES.party.normal._default[3]`: こういう時間、いいですね！
- `CARE_REACTION_DIALOGUES.party.normal._default[4]`: リフレッシュできました！

### party.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.party.normal.ojousama[1]`: 楽しいお時間でしたわ。それでは、ごきげんよう

### party.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.party.normal.delinquent[1]`: いえーい！カンパーイ！

### party.normal.seductive[]

- `CARE_REACTION_DIALOGUES.party.normal.seductive[1]`: 楽しかったわ。こういう時間もいいわね

### party.normal.composed[]

- `CARE_REACTION_DIALOGUES.party.normal.composed[1]`: …いい時間だったね。悪くないよ

### party.bold._default[]

- `CARE_REACTION_DIALOGUES.party.bold._default[1]`: 楽しいけど…次の興行ではもっと結果を出す！
- `CARE_REACTION_DIALOGUES.party.bold._default[2]`: いい雰囲気。チームが強くなってる証拠だね

### party.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.party.bold.ojousama[1]`: 皆様の頑張りを、誇りに思いますわ

### party.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.party.bold.delinquent[1]`: カンパーイ！！ 今日は無礼講だ〜！

### party.bold.cool[]

- `CARE_REACTION_DIALOGUES.party.bold.cool[1]`: …悪くない時間だった

### party.bold.seductive[]

- `CARE_REACTION_DIALOGUES.party.bold.seductive[1]`: いい雰囲気ね。チームが成長してる証拠だわ

### party.bold.composed[]

- `CARE_REACTION_DIALOGUES.party.bold.composed[1]`: …いい雰囲気だね。こういうのも大事だよ

### party.quiet._default[]

- `CARE_REACTION_DIALOGUES.party.quiet._default[1]`: ……楽しかったです（小さく微笑んでいる）

### party.quiet.cool[]

- `CARE_REACTION_DIALOGUES.party.quiet.cool[1]`: …悪くなかった

### party.quiet.polite[]

- `CARE_REACTION_DIALOGUES.party.quiet.polite[1]`: …楽しいお時間でした。ありがとうございます

### party.shy._default[]

- `CARE_REACTION_DIALOGUES.party.shy._default[1]`: あ、あの…楽しかった、です…（隅で小さく笑っている）

### party.shy.polite[]

- `CARE_REACTION_DIALOGUES.party.shy.polite[1]`: パ、パーティー…人が多いところは少し苦手ですけど…頑張って参加します…

### party.easygoing._default[]

- `CARE_REACTION_DIALOGUES.party.easygoing._default[1]`: カンパーイ！！ 今日は無礼講だ〜！
- `CARE_REACTION_DIALOGUES.party.easygoing._default[2]`: もう一軒行きましょうよ〜！

### party.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.party.easygoing.delinquent[1]`: うぇーい！飲むぞ〜！

### party.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.party.easygoing.seductive[1]`: ふふ、みんないい顔してるわね

### party.earnest._default[]

- `CARE_REACTION_DIALOGUES.party.earnest._default[1]`: みんなお疲れ様でした！明日からまた頑張ります！
- `CARE_REACTION_DIALOGUES.party.earnest._default[2]`: こうしてみんなで集まれるのが嬉しいです

### party.earnest.polite[]

- `CARE_REACTION_DIALOGUES.party.earnest.polite[1]`: 皆様、お疲れ様でした。明日からまた頑張りましょう

### party.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.party.earnest.ojousama[1]`: 皆様、お疲れ様ですわ。明日からまた頑張りましょうね

### party.earnest.seductive[]

- `CARE_REACTION_DIALOGUES.party.earnest.seductive[1]`: お疲れ様。また明日から頑張りましょうね

### party.earnest.composed[]

- `CARE_REACTION_DIALOGUES.party.earnest.composed[1]`: …お疲れ様。こういう時間があるから、また頑張れるね

### party.emotional._default[]

- `CARE_REACTION_DIALOGUES.party.emotional._default[1]`: みんな〜！楽しい〜！大好き〜！
- `CARE_REACTION_DIALOGUES.party.emotional._default[2]`: こういう時間…最高だよ…！

### party.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.party.emotional.seductive[1]`: パーティー……っ……ふふ、今夜は思いっきり楽しませてもらうわ……

### camp.normal._default[]

- `CARE_REACTION_DIALOGUES.camp.normal._default[1]`: しっかり鍛えてきます！
- `CARE_REACTION_DIALOGUES.camp.normal._default[2]`: 頑張ります！
- `CARE_REACTION_DIALOGUES.camp.normal._default[3]`: 良い合宿にしましょう！
- `CARE_REACTION_DIALOGUES.camp.normal._default[4]`: 楽しみです！全力で取り組みます！

### camp.normal.ojousama[]

- `CARE_REACTION_DIALOGUES.camp.normal.ojousama[1]`: 合宿ですの？ 精一杯取り組みますわ

### camp.normal.delinquent[]

- `CARE_REACTION_DIALOGUES.camp.normal.delinquent[1]`: 合宿！ ガンガンやるぞ！

### camp.normal.seductive[]

- `CARE_REACTION_DIALOGUES.camp.normal.seductive[1]`: 合宿ね。しっかり鍛えるわ

### camp.normal.composed[]

- `CARE_REACTION_DIALOGUES.camp.normal.composed[1]`: …合宿か。じっくりやろう

### camp.bold._default[]

- `CARE_REACTION_DIALOGUES.camp.bold._default[1]`: ライバルに差をつけるチャンスだね！
- `CARE_REACTION_DIALOGUES.camp.bold._default[2]`: 合宿から帰る頃には一回り強くなってやる！

### camp.bold.ojousama[]

- `CARE_REACTION_DIALOGUES.camp.bold.ojousama[1]`: この合宿で一段上へ参りましょう

### camp.bold.delinquent[]

- `CARE_REACTION_DIALOGUES.camp.bold.delinquent[1]`: やってやるぜ！帰る頃には別人だ！

### camp.bold.cool[]

- `CARE_REACTION_DIALOGUES.camp.bold.cool[1]`: …鍛えさせてもらう。結果を出す

### camp.bold.seductive[]

- `CARE_REACTION_DIALOGUES.camp.bold.seductive[1]`: 帰る頃には一回り強くなってるわよ

### camp.bold.composed[]

- `CARE_REACTION_DIALOGUES.camp.bold.composed[1]`: …いい機会だね。しっかり追い込むよ

### camp.quiet._default[]

- `CARE_REACTION_DIALOGUES.camp.quiet._default[1]`: ……頑張ります

### camp.quiet.cool[]

- `CARE_REACTION_DIALOGUES.camp.quiet.cool[1]`: …追い込む

### camp.quiet.polite[]

- `CARE_REACTION_DIALOGUES.camp.quiet.polite[1]`: …精一杯、取り組みます

### camp.shy._default[]

- `CARE_REACTION_DIALOGUES.camp.shy._default[1]`: が、合宿…！ が、頑張ります…！

### camp.shy.polite[]

- `CARE_REACTION_DIALOGUES.camp.shy.polite[1]`: が、合宿…ですか…緊張しますけど…頑張ります…!

### camp.easygoing._default[]

- `CARE_REACTION_DIALOGUES.camp.easygoing._default[1]`: うおー！！合宿だ！楽しみ！
- `CARE_REACTION_DIALOGUES.camp.easygoing._default[2]`: 夜は枕投げだ！…嘘です、練習します

### camp.easygoing.delinquent[]

- `CARE_REACTION_DIALOGUES.camp.easygoing.delinquent[1]`: 合宿だー！ 盛り上がっていくぞー！

### camp.easygoing.seductive[]

- `CARE_REACTION_DIALOGUES.camp.easygoing.seductive[1]`: 合宿楽しみ〜。みんなで頑張りましょ

### camp.earnest._default[]

- `CARE_REACTION_DIALOGUES.camp.earnest._default[1]`: やった！思い切り練習できる！
- `CARE_REACTION_DIALOGUES.camp.earnest._default[2]`: 合宿の間に絶対レベルアップしてみせます！
- `CARE_REACTION_DIALOGUES.camp.earnest._default[3]`: みんなで一緒に強くなれるなんて…最高です

### camp.earnest.polite[]

- `CARE_REACTION_DIALOGUES.camp.earnest.polite[1]`: 全力で取り組ませていただきます。レベルアップしてみせます

### camp.earnest.ojousama[]

- `CARE_REACTION_DIALOGUES.camp.earnest.ojousama[1]`: みっちり鍛えていただきますわ！絶対に成長してみせますの

### camp.earnest.seductive[]

- `CARE_REACTION_DIALOGUES.camp.earnest.seductive[1]`: 思い切り鍛えられるのね。楽しみだわ

### camp.earnest.composed[]

- `CARE_REACTION_DIALOGUES.camp.earnest.composed[1]`: …みんなでやれるのはいいね。じっくり行こう

### camp.emotional._default[]

- `CARE_REACTION_DIALOGUES.camp.emotional._default[1]`: 合宿…！みんなで強くなれる…！最高だよ…！

### camp.emotional.seductive[]

- `CARE_REACTION_DIALOGUES.camp.emotional.seductive[1]`: 合宿……っ……ふふ、みんなと一緒に過ごせるのね、楽しみ……

## `CHOICE_EVENT_DIALOGUES`

- 出典: `src/data.js`
- コード内コメント: §3-3: 選択型イベントセリフ（S1〜S6, E1〜E6）— personality×archetype
- 本数: 283

- `CHOICE_EVENT_DIALOGUES.S1.normal._default[1]`: タイトルマッチの機会をいただけませんか？
- `CHOICE_EVENT_DIALOGUES.S1.normal.ojousama[1]`: 王座への挑戦をお許しいただけませんこと？
- `CHOICE_EVENT_DIALOGUES.S1.normal.delinquent[1]`: タイトルマッチ、組んでくれよ
- `CHOICE_EVENT_DIALOGUES.S1.normal.seductive[1]`: タイトルマッチの機会、いただけないかしら
- `CHOICE_EVENT_DIALOGUES.S1.normal.composed[1]`: …そろそろベルトに挑戦させてもらえないかな
- `CHOICE_EVENT_DIALOGUES.S1.bold._default[1]`: チャンピオンの座が欲しい。今すぐ組んでよ
- `CHOICE_EVENT_DIALOGUES.S1.bold._default[2]`: ベルトを賭けた試合がしたい！
- `CHOICE_EVENT_DIALOGUES.S1.bold.ojousama[1]`: チャンピオンの座、いただきに参りましょう
- `CHOICE_EVENT_DIALOGUES.S1.bold.delinquent[1]`: ベルトよこせ！今すぐ組め！
- `CHOICE_EVENT_DIALOGUES.S1.bold.cool[1]`: …ベルトが欲しい。組んでくれ
- `CHOICE_EVENT_DIALOGUES.S1.bold.seductive[1]`: ベルトが欲しいの。組んでもらえる？
- `CHOICE_EVENT_DIALOGUES.S1.bold.composed[1]`: …ベルト、狙わせてもらうよ。組んでくれる？
- `CHOICE_EVENT_DIALOGUES.S1.quiet._default[1]`: ……挑戦させてください
- `CHOICE_EVENT_DIALOGUES.S1.quiet.cool[1]`: …タイトルマッチを。頼む
- `CHOICE_EVENT_DIALOGUES.S1.quiet.polite[1]`: …タイトルマッチに挑戦させていただけますか
- `CHOICE_EVENT_DIALOGUES.S1.shy._default[1]`: あ、あの…タイトルマッチ…挑戦させてもらえませんか…？
- `CHOICE_EVENT_DIALOGUES.S1.shy.polite[1]`: あ、あの…ご相談したいことが…
- `CHOICE_EVENT_DIALOGUES.S1.easygoing._default[1]`: ねえねえ、タイトルマッチ組んでよ！
- `CHOICE_EVENT_DIALOGUES.S1.easygoing._default[2]`: ベルト欲しいなー。挑戦させてくれない？
- `CHOICE_EVENT_DIALOGUES.S1.easygoing.delinquent[1]`: タイトルマッチ組めよ！やる気あんだからさ！
- `CHOICE_EVENT_DIALOGUES.S1.easygoing.seductive[1]`: ベルト、欲しくなっちゃった。挑戦させてくれない？
- `CHOICE_EVENT_DIALOGUES.S1.earnest._default[1]`: ずっと準備してきました…チャンスをください
- `CHOICE_EVENT_DIALOGUES.S1.earnest._default[2]`: タイトルマッチに挑ませてください！
- `CHOICE_EVENT_DIALOGUES.S1.earnest.polite[1]`: ずっと準備して参りました。チャンスをいただけませんか
- `CHOICE_EVENT_DIALOGUES.S1.earnest.ojousama[1]`: ずっと準備してまいりましたの。チャンスをいただけませんこと
- `CHOICE_EVENT_DIALOGUES.S1.earnest.seductive[1]`: ずっと準備してきたの。チャンスをちょうだい
- `CHOICE_EVENT_DIALOGUES.S1.earnest.composed[1]`: …準備はできてる。あとはチャンスだけだよ
- `CHOICE_EVENT_DIALOGUES.S1.emotional._default[1]`: お願いします…！タイトルマッチに挑ませてください…！
- `CHOICE_EVENT_DIALOGUES.S1.emotional.seductive[1]`: ねえ……っ……ちょっと、聞いてほしいの……
- `CHOICE_EVENT_DIALOGUES.S2.normal._default[1]`: 因縁のある相手と試合を組んでいただけませんか
- `CHOICE_EVENT_DIALOGUES.S2.normal.ojousama[1]`: あの方との決着を、お許しいただけませんか？
- `CHOICE_EVENT_DIALOGUES.S2.normal.delinquent[1]`: あいつとの試合、組んでくれよ
- `CHOICE_EVENT_DIALOGUES.S2.normal.seductive[1]`: あの人との試合、組んでもらえないかしら
- `CHOICE_EVENT_DIALOGUES.S2.normal.composed[1]`: …あの人との試合、そろそろ組んでもらえないかな
- `CHOICE_EVENT_DIALOGUES.S2.bold._default[1]`: あの相手と戦わずにはいられない！早く試合を組んでくれ！
- `CHOICE_EVENT_DIALOGUES.S2.bold._default[2]`: 決着をつけたい。あいつと戦う機会をちょうだい！
- `CHOICE_EVENT_DIALOGUES.S2.bold.ojousama[1]`: あれとも決着をつけませんとね……
- `CHOICE_EVENT_DIALOGUES.S2.bold.delinquent[1]`: あいつと決着つけさせろ！
- `CHOICE_EVENT_DIALOGUES.S2.bold.cool[1]`: …決着をつけたい。組んでくれ
- `CHOICE_EVENT_DIALOGUES.S2.bold.seductive[1]`: あの人と決着をつけたいの。組んでもらえる？
- `CHOICE_EVENT_DIALOGUES.S2.bold.composed[1]`: …決着をつけたいんだ。組んでくれないかな
- `CHOICE_EVENT_DIALOGUES.S2.quiet._default[1]`: ……あの人と、戦わせてください
- `CHOICE_EVENT_DIALOGUES.S2.quiet.cool[1]`: …あいつとの試合を。頼む
- `CHOICE_EVENT_DIALOGUES.S2.quiet.polite[1]`: …あの方との対戦を、お願いできますか
- `CHOICE_EVENT_DIALOGUES.S2.shy._default[1]`: あの…あの人と…試合させてもらえませんか…
- `CHOICE_EVENT_DIALOGUES.S2.shy.polite[1]`: す、すみません…少しお時間いただけますか…
- `CHOICE_EVENT_DIALOGUES.S2.easygoing._default[1]`: あの人との試合組んでよ！決着つけたいんだ！
- `CHOICE_EVENT_DIALOGUES.S2.easygoing.delinquent[1]`: あいつとやらせろよ！ケリつけてやる！
- `CHOICE_EVENT_DIALOGUES.S2.easygoing.seductive[1]`: あの人との試合、組んでくれない？ 決着つけたいの
- `CHOICE_EVENT_DIALOGUES.S2.earnest._default[1]`: あの相手を越えてこそ、次のステージに行ける。組んでください
- `CHOICE_EVENT_DIALOGUES.S2.earnest.polite[1]`: あの方との試合を組んでいただけないでしょうか
- `CHOICE_EVENT_DIALOGUES.S2.earnest.ojousama[1]`: あの方を越えてこそですわ。組んでいただけませんこと
- `CHOICE_EVENT_DIALOGUES.S2.earnest.seductive[1]`: あの人を越えたいの。試合を組んでくれない？
- `CHOICE_EVENT_DIALOGUES.S2.earnest.composed[1]`: …あの人を越えないと先に進めない。頼むよ
- `CHOICE_EVENT_DIALOGUES.S2.emotional._default[1]`: あの人と戦いたい…！お願いします…組んでください…！
- `CHOICE_EVENT_DIALOGUES.S2.emotional.seductive[1]`: 時間、ある……っ……ふふ、ちょっとだけ付き合って……
- `CHOICE_EVENT_DIALOGUES.S3.normal._default[1]`: 少し休養をいただけますか？
- `CHOICE_EVENT_DIALOGUES.S3.normal.ojousama[1]`: 少しお休みをいただけますかしら…
- `CHOICE_EVENT_DIALOGUES.S3.normal.delinquent[1]`: ちょっと休ませてくれ…
- `CHOICE_EVENT_DIALOGUES.S3.normal.seductive[1]`: 少し休ませてもらえないかしら…
- `CHOICE_EVENT_DIALOGUES.S3.normal.composed[1]`: …少し休ませてもらえるかな
- `CHOICE_EVENT_DIALOGUES.S3.bold._default[1]`: …悔しいけど、体が限界みたい。少し休ませて
- `CHOICE_EVENT_DIALOGUES.S3.bold.ojousama[1]`: …情けないけれど、もう、体が限界ですわね
- `CHOICE_EVENT_DIALOGUES.S3.bold.delinquent[1]`: くそ…体がもう限界だ。休ませてくれ
- `CHOICE_EVENT_DIALOGUES.S3.bold.cool[1]`: …限界だ。休む
- `CHOICE_EVENT_DIALOGUES.S3.bold.seductive[1]`: …体が限界なの。少し休ませて
- `CHOICE_EVENT_DIALOGUES.S3.bold.composed[1]`: …体が限界みたいだ。少し休むよ
- `CHOICE_EVENT_DIALOGUES.S3.quiet._default[1]`: ……少し、休ませてください
- `CHOICE_EVENT_DIALOGUES.S3.quiet.cool[1]`: …休む必要がある
- `CHOICE_EVENT_DIALOGUES.S3.quiet.polite[1]`: …申し訳ありません。少し休ませていただけますか…
- `CHOICE_EVENT_DIALOGUES.S3.shy._default[1]`: あの…すみません…体が…少し休ませてもらえますか…
- `CHOICE_EVENT_DIALOGUES.S3.shy.polite[1]`: あ、あの…どう答えたらいいか、わからなくて…
- `CHOICE_EVENT_DIALOGUES.S3.easygoing._default[1]`: もう限界！ちょっと休まないとマジでやばい！
- `CHOICE_EVENT_DIALOGUES.S3.easygoing.delinquent[1]`: 無理！限界！休ませて！
- `CHOICE_EVENT_DIALOGUES.S3.easygoing.seductive[1]`: ごめんね、ちょっと限界みたい。休ませてくれる？
- `CHOICE_EVENT_DIALOGUES.S3.earnest._default[1]`: 迷惑をかけてしまって申し訳ないんですが…少し休ませてもらえますか
- `CHOICE_EVENT_DIALOGUES.S3.earnest._default[2]`: チームに迷惑はかけたくないんですが…体が限界で…
- `CHOICE_EVENT_DIALOGUES.S3.earnest.polite[1]`: ご迷惑をおかけしまして申し訳ございません…少しお休みをいただけますか
- `CHOICE_EVENT_DIALOGUES.S3.earnest.ojousama[1]`: チームにご迷惑はかけたくありませんのに…体が限界ですわ…
- `CHOICE_EVENT_DIALOGUES.S3.earnest.seductive[1]`: 迷惑かけたくないんだけど…体が限界なの…
- `CHOICE_EVENT_DIALOGUES.S3.earnest.composed[1]`: …無理したくないんだ。少し休ませてもらえるかな
- `CHOICE_EVENT_DIALOGUES.S3.emotional._default[1]`: ごめんなさい…体がもう…休ませてください…！
- `CHOICE_EVENT_DIALOGUES.S3.emotional.seductive[1]`: ……っ……どう答えるのが正解なのかしら、ふふ……
- `CHOICE_EVENT_DIALOGUES.S4_direct.normal._default[1]`: このままでは限界です。待遇を改善していただけませんか
- `CHOICE_EVENT_DIALOGUES.S4_direct.normal.ojousama[1]`: このままでは困ります！お話し合いをさせてくださいまし
- `CHOICE_EVENT_DIALOGUES.S4_direct.normal.delinquent[1]`: 不満だっつってんの。ちゃんと話し合おうぜ
- `CHOICE_EVENT_DIALOGUES.S4_direct.normal.seductive[1]`: このままじゃ困るわ。ちゃんと考えてもらえないかしら
- `CHOICE_EVENT_DIALOGUES.S4_direct.normal.composed[1]`: …このままだと困るんだよね。少し考えてもらえるかな
- `CHOICE_EVENT_DIALOGUES.S4_direct.bold._default[1]`: このままじゃ納得できない。改善してくれないなら移籍を考えるからね
- `CHOICE_EVENT_DIALOGUES.S4_direct.bold._default[2]`: 私の実力を発揮できていない。ここにいる意味はあるのかな
- `CHOICE_EVENT_DIALOGUES.S4_direct.bold.ojousama[1]`: このままでは納得できませんわね。……どうするか、考えなさいね？
- `CHOICE_EVENT_DIALOGUES.S4_direct.bold.delinquent[1]`: こんなんじゃやってらんねーよ！改善しろ！
- `CHOICE_EVENT_DIALOGUES.S4_direct.bold.cool[1]`: …このままでは先がない。考えてくれ
- `CHOICE_EVENT_DIALOGUES.S4_direct.bold.seductive[1]`: このままじゃ我慢の限界よ。考え直してもらえない？
- `CHOICE_EVENT_DIALOGUES.S4_direct.bold.composed[1]`: …このままだと先がないよ。考え直してくれないかな
- `CHOICE_EVENT_DIALOGUES.S4_direct.quiet._default[1]`: ………（険しい目でこちらを見つめている）
- `CHOICE_EVENT_DIALOGUES.S4_direct.quiet.cool[1]`: ……もう、限界だ（静かに、しかし断固として）
- `CHOICE_EVENT_DIALOGUES.S4_direct.quiet.polite[1]`: …申し訳ありません。ただ…このままでは…
- `CHOICE_EVENT_DIALOGUES.S4_direct.shy._default[1]`: …あの…ごめんなさい…でも…このままだと…
- `CHOICE_EVENT_DIALOGUES.S4_direct.shy.polite[1]`: は、はっきり言わせていただきます…わたしは…
- `CHOICE_EVENT_DIALOGUES.S4_direct.easygoing._default[1]`: ぶっちゃけ不満です！ちゃんと話し合いましょう！
- `CHOICE_EVENT_DIALOGUES.S4_direct.easygoing.delinquent[1]`: もう無理！ちゃんと話し合えよ！
- `CHOICE_EVENT_DIALOGUES.S4_direct.easygoing.seductive[1]`: ぶっちゃけ、不満があるの。ちゃんと話しましょう？
- `CHOICE_EVENT_DIALOGUES.S4_direct.earnest._default[1]`: …ずっと我慢してきました。でも、このままでは…
- `CHOICE_EVENT_DIALOGUES.S4_direct.earnest._default[2]`: 私の目標を達成できる環境が必要です。考え直してもらえませんか
- `CHOICE_EVENT_DIALOGUES.S4_direct.earnest.polite[1]`: ずっと我慢して参りましたが…このままでは限界です
- `CHOICE_EVENT_DIALOGUES.S4_direct.earnest.ojousama[1]`: これまで耐えてまいりましたけれど…もう限界ですわ
- `CHOICE_EVENT_DIALOGUES.S4_direct.earnest.seductive[1]`: ずっと我慢してきたの。でも、もう限界よ
- `CHOICE_EVENT_DIALOGUES.S4_direct.earnest.composed[1]`: …ずっと黙ってたけど、そろそろ限界だよ
- `CHOICE_EVENT_DIALOGUES.S4_direct.emotional._default[1]`: …もう…無理です…！このままだと…私…！
- `CHOICE_EVENT_DIALOGUES.S4_direct.emotional.seductive[1]`: はっきり言うわ……っ……わたしの気持ちは……
- `CHOICE_EVENT_DIALOGUES.S4_silent.normal._default[1]`: （沈黙）…いえ、何でもないです
- `CHOICE_EVENT_DIALOGUES.S4_silent.bold._default[1]`: …………（拳を握りしめている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.quiet._default[1]`: …………（小さくため息をつき、視線を逸らす）
- `CHOICE_EVENT_DIALOGUES.S4_silent.quiet.cool[1]`: ……（何も言わず、立ち去ろうとする）
- `CHOICE_EVENT_DIALOGUES.S4_silent.quiet.polite[1]`: ………（目を伏せて、何かを堪えるように唇を噛む）……
- `CHOICE_EVENT_DIALOGUES.S4_silent.shy._default[1]`: …………（目を逸らして、何も言えずにいる）
- `CHOICE_EVENT_DIALOGUES.S4_silent.shy.polite[1]`: ………あの…なにも、言えません…
- `CHOICE_EVENT_DIALOGUES.S4_silent.easygoing._default[1]`: あはは…いや、なんでも…（笑っているが目が笑っていない）
- `CHOICE_EVENT_DIALOGUES.S4_silent.earnest._default[1]`: …………（何か言いたげに口を開きかけ、止める）
- `CHOICE_EVENT_DIALOGUES.S4_silent.emotional._default[1]`: ……っ（泣くのを堪えるように唇を噛んでいる）
- `CHOICE_EVENT_DIALOGUES.S4_silent.emotional.seductive[1]`: ………っ……言葉にならないの……ふふ……
- `CHOICE_EVENT_DIALOGUES.S5.normal._default[1]`: 特訓する時間をいただけませんか？
- `CHOICE_EVENT_DIALOGUES.S5.normal.ojousama[1]`: 特訓の時間をいただけませんこと？
- `CHOICE_EVENT_DIALOGUES.S5.normal.delinquent[1]`: 特訓させてくれ。もっと強くなりてえ
- `CHOICE_EVENT_DIALOGUES.S5.normal.seductive[1]`: 特訓させてもらえないかしら？
- `CHOICE_EVENT_DIALOGUES.S5.normal.composed[1]`: …少し追い込みたいんだ。特訓させてもらえるかな
- `CHOICE_EVENT_DIALOGUES.S5.bold._default[1]`: もっと上を目指したい。特訓させて！
- `CHOICE_EVENT_DIALOGUES.S5.bold._default[2]`: 今燃えてるの！とことんやらせて！
- `CHOICE_EVENT_DIALOGUES.S5.bold.ojousama[1]`: もっと上を目指す為に。特訓が必要ね…
- `CHOICE_EVENT_DIALOGUES.S5.bold.delinquent[1]`: もっと強くなりてぇ！特訓させろ！
- `CHOICE_EVENT_DIALOGUES.S5.bold.cool[1]`: …特訓させてくれ。もっと強くなる
- `CHOICE_EVENT_DIALOGUES.S5.bold.seductive[1]`: もっと強くなりたいの。特訓させてもらえる？
- `CHOICE_EVENT_DIALOGUES.S5.bold.composed[1]`: …もう少し上に行きたい。特訓させてくれないかな
- `CHOICE_EVENT_DIALOGUES.S5.quiet._default[1]`: ……特訓、させてください
- `CHOICE_EVENT_DIALOGUES.S5.quiet.cool[1]`: …鍛えたい。場所を貸してくれ
- `CHOICE_EVENT_DIALOGUES.S5.quiet.polite[1]`: …特訓をさせていただけますか
- `CHOICE_EVENT_DIALOGUES.S5.shy._default[1]`: あの…特訓…させてもらえませんか…？ もっと強くなりたいんです…
- `CHOICE_EVENT_DIALOGUES.S5.shy.polite[1]`: 考えさせて…いただけますか…？
- `CHOICE_EVENT_DIALOGUES.S5.easygoing._default[1]`: 特訓したい！もっと強くなりたいんだ！
- `CHOICE_EVENT_DIALOGUES.S5.easygoing.delinquent[1]`: 特訓すんぞ！もっと強くなりてーんだよ！
- `CHOICE_EVENT_DIALOGUES.S5.easygoing.seductive[1]`: 特訓したいの。もっと強くなりたくて
- `CHOICE_EVENT_DIALOGUES.S5.earnest._default[1]`: もっと強くなりたいんです。特訓を許可してください！
- `CHOICE_EVENT_DIALOGUES.S5.earnest.polite[1]`: もっと強くなりたいのです。特訓をお許しいただけますか
- `CHOICE_EVENT_DIALOGUES.S5.earnest.ojousama[1]`: もっと強くなりたいですの。特訓のお許しをいただけませんこと
- `CHOICE_EVENT_DIALOGUES.S5.earnest.seductive[1]`: もっと強くなりたいの。特訓させてもらえる？
- `CHOICE_EVENT_DIALOGUES.S5.earnest.composed[1]`: …まだ伸びしろはあるはずなんだ。やらせてほしい
- `CHOICE_EVENT_DIALOGUES.S5.emotional._default[1]`: お願いします…！特訓させてください…！もっと、もっと強くなりたい…！
- `CHOICE_EVENT_DIALOGUES.S5.emotional.seductive[1]`: 少し考えさせて……っ……ふふ、すぐには決められないの……
- `CHOICE_EVENT_DIALOGUES.S6.normal._default[1]`: 後輩の指導を担当させてもらえませんか？
- `CHOICE_EVENT_DIALOGUES.S6.normal.ojousama[1]`: 後輩のお世話は、私にお任せください
- `CHOICE_EVENT_DIALOGUES.S6.normal.delinquent[1]`: 後輩の面倒、見させてくれよ
- `CHOICE_EVENT_DIALOGUES.S6.normal.seductive[1]`: 後輩の指導、私にやらせてもらえないかしら
- `CHOICE_EVENT_DIALOGUES.S6.normal.composed[1]`: …後輩の面倒、見させてもらえないかな
- `CHOICE_EVENT_DIALOGUES.S6.bold._default[1]`: 若い子たちの面倒を見させてよ。それが私の役目だと思うから
- `CHOICE_EVENT_DIALOGUES.S6.bold.ojousama[1]`: 若手の面倒を見るのも、私の務めですわね
- `CHOICE_EVENT_DIALOGUES.S6.bold.delinquent[1]`: 後輩の面倒は任せろ。鍛えてやる
- `CHOICE_EVENT_DIALOGUES.S6.bold.cool[1]`: …後輩を見る。任せてくれ
- `CHOICE_EVENT_DIALOGUES.S6.bold.seductive[1]`: 後輩の面倒、見させてもらえるかしら？
- `CHOICE_EVENT_DIALOGUES.S6.bold.composed[1]`: …後輩に伝えておきたいことがあるんだ。任せてくれないかな
- `CHOICE_EVENT_DIALOGUES.S6.quiet._default[1]`: ……後輩に、伝えたいことがあるんです
- `CHOICE_EVENT_DIALOGUES.S6.quiet.cool[1]`: …次の世代に、繋ぎたいものがある
- `CHOICE_EVENT_DIALOGUES.S6.quiet.polite[1]`: …後輩のご指導を、担当させていただけますか
- `CHOICE_EVENT_DIALOGUES.S6.shy._default[1]`: あの…私でよければ…後輩の子たちに…何か伝えられたら…
- `CHOICE_EVENT_DIALOGUES.S6.shy.polite[1]`: 決めました…これで、いいんですよね…？
- `CHOICE_EVENT_DIALOGUES.S6.easygoing._default[1]`: 後輩の面倒見させてよ！楽しそうだし！
- `CHOICE_EVENT_DIALOGUES.S6.easygoing.delinquent[1]`: 後輩の面倒見るわ！任せとけ！
- `CHOICE_EVENT_DIALOGUES.S6.easygoing.seductive[1]`: 後輩の子たち、かわいいわよね。面倒見させてもらえない？
- `CHOICE_EVENT_DIALOGUES.S6.earnest._default[1]`: 私が培ってきたものを、後輩に伝えたいと思って…
- `CHOICE_EVENT_DIALOGUES.S6.earnest._default[2]`: 後輩に何かを伝えたいんです。指導の機会をもらえますか
- `CHOICE_EVENT_DIALOGUES.S6.earnest.polite[1]`: 培ってきたものを後輩にお伝えしたいのです
- `CHOICE_EVENT_DIALOGUES.S6.earnest.ojousama[1]`: 私が学んできたことを、後輩にお伝えしたいと思いまして…
- `CHOICE_EVENT_DIALOGUES.S6.earnest.seductive[1]`: 培ってきたものを、次の子たちに伝えたいの
- `CHOICE_EVENT_DIALOGUES.S6.earnest.composed[1]`: …次の世代に繋げたいものがあるんだ。やらせてほしい
- `CHOICE_EVENT_DIALOGUES.S6.emotional._default[1]`: 後輩の子たちに…私にできることがあるなら…やらせてください！
- `CHOICE_EVENT_DIALOGUES.S6.emotional.seductive[1]`: 決めたわ……っ……ふふ、これがわたしの答えよ……
- `CHOICE_EVENT_DIALOGUES.E1.normal._default[1]`: メディアへの出演、ご検討いただけますか？
- `CHOICE_EVENT_DIALOGUES.E1.normal._default[2]`: 出演のお話をいただきました。やってみたいです
- `CHOICE_EVENT_DIALOGUES.E1.normal.ojousama[1]`: メディアのお話ですの？ ぜひお受けしたいですわ
- `CHOICE_EVENT_DIALOGUES.E1.normal.delinquent[1]`: テレビ出れんの？ やるやる！
- `CHOICE_EVENT_DIALOGUES.E1.normal.seductive[1]`: メディア出演のお話？ 楽しみだわ
- `CHOICE_EVENT_DIALOGUES.E1.normal.composed[1]`: …メディアか。いい機会だね
- `CHOICE_EVENT_DIALOGUES.E1.bold._default[1]`: この露出を足がかりに、もっと大きな舞台へ進みたい
- `CHOICE_EVENT_DIALOGUES.E1.bold._default[2]`: 私が出れば注目されるのは当然。楽しみにしてるよ
- `CHOICE_EVENT_DIALOGUES.E1.bold.ojousama[1]`: 私が出ればお客様も喜ぶでしょうね。楽しみだわ…
- `CHOICE_EVENT_DIALOGUES.E1.bold.delinquent[1]`: やってやるぜ！注目されんのは大歓迎だ！
- `CHOICE_EVENT_DIALOGUES.E1.bold.cool[1]`: …いい機会だ。出る
- `CHOICE_EVENT_DIALOGUES.E1.bold.seductive[1]`: 注目される場は好きよ。もちろんやるわ
- `CHOICE_EVENT_DIALOGUES.E1.bold.composed[1]`: …悪くないね。いつも通りやるよ
- `CHOICE_EVENT_DIALOGUES.E1.quiet._default[1]`: …出演のお話、ですか…頑張ります
- `CHOICE_EVENT_DIALOGUES.E1.quiet.cool[1]`: ……やる
- `CHOICE_EVENT_DIALOGUES.E1.quiet.polite[1]`: …出演のお話でしょうか。精一杯努めます
- `CHOICE_EVENT_DIALOGUES.E1.shy._default[1]`: え…テレビ…？ わ、私なんかが…で、でもやってみたいです…
- `CHOICE_EVENT_DIALOGUES.E1.shy.polite[1]`: あ、あの…どうしたら、いいんでしょうか…
- `CHOICE_EVENT_DIALOGUES.E1.easygoing._default[1]`: ファンのみなさんに、もっと近くで私を見てもらいたい！
- `CHOICE_EVENT_DIALOGUES.E1.easygoing._default[2]`: テレビ！？ やった！出たい！
- `CHOICE_EVENT_DIALOGUES.E1.easygoing.delinquent[1]`: テレビ出んの！？ 最高じゃん！
- `CHOICE_EVENT_DIALOGUES.E1.easygoing.seductive[1]`: ファンのみんなにもっと見てもらえるのね。嬉しいわ
- `CHOICE_EVENT_DIALOGUES.E1.earnest._default[1]`: テレビは緊張しますけど…精一杯やります！
- `CHOICE_EVENT_DIALOGUES.E1.earnest.polite[1]`: 緊張いたしますが…精一杯務めさせていただきます
- `CHOICE_EVENT_DIALOGUES.E1.earnest.ojousama[1]`: テレビは緊張いたしますけれど…精一杯やらせていただきますわ
- `CHOICE_EVENT_DIALOGUES.E1.earnest.seductive[1]`: 緊張するけど…精一杯やるわ
- `CHOICE_EVENT_DIALOGUES.E1.earnest.composed[1]`: …緊張はしないよ。いつも通りやればいい
- `CHOICE_EVENT_DIALOGUES.E1.emotional._default[1]`: テレビ…！？ えっ…嬉しい…！頑張ります…！
- `CHOICE_EVENT_DIALOGUES.E1.emotional.seductive[1]`: ……っ……どうしようかしら、ふふ、迷っちゃうわね……
- `CHOICE_EVENT_DIALOGUES.E4.normal._default[1]`: 新たなスカウト情報が届きました
- `CHOICE_EVENT_DIALOGUES.E4.shy.polite[1]`: え、ええと…そ、その件は…
- `CHOICE_EVENT_DIALOGUES.E6.normal._default[1]`: 他の団体からオファーが来ています
- `CHOICE_EVENT_DIALOGUES.E6.normal.ojousama[1]`: 他の団体からお話がございましたの…
- `CHOICE_EVENT_DIALOGUES.E6.normal.delinquent[1]`: 他所から話来てんだけど
- `CHOICE_EVENT_DIALOGUES.E6.normal.seductive[1]`: 他の団体からお誘いが来てるの
- `CHOICE_EVENT_DIALOGUES.E6.normal.composed[1]`: …他所から話が来てるんだ。一応報告しておくね
- `CHOICE_EVENT_DIALOGUES.E6.bold._default[1]`: …本当のことを言うと、いい条件だと思ってる
- `CHOICE_EVENT_DIALOGUES.E6.bold._default[2]`: 他所から話が来た。考えてもいいでしょ？
- `CHOICE_EVENT_DIALOGUES.E6.bold.ojousama[1]`: …正直に申しますと、良い条件ですわ
- `CHOICE_EVENT_DIALOGUES.E6.bold.delinquent[1]`: 他所からいい話来てんだよ。考えさせてくれ
- `CHOICE_EVENT_DIALOGUES.E6.bold.cool[1]`: …他から話が来た。条件は悪くない
- `CHOICE_EVENT_DIALOGUES.E6.bold.seductive[1]`: 他所からいい話が来てるの。正直、迷ってるわ
- `CHOICE_EVENT_DIALOGUES.E6.bold.composed[1]`: …悪くない条件なんだよね。…少し考えてもいいかな
- `CHOICE_EVENT_DIALOGUES.E6.quiet._default[1]`: ………他から、話が（小さな声で）
- `CHOICE_EVENT_DIALOGUES.E6.quiet.cool[1]`: …他所から来た。報告する
- `CHOICE_EVENT_DIALOGUES.E6.quiet.polite[1]`: …他の団体様からお話が…報告しておきます
- `CHOICE_EVENT_DIALOGUES.E6.shy._default[1]`: あの…他の団体から…その…どうしたらいいか分からなくて…
- `CHOICE_EVENT_DIALOGUES.E6.shy.polite[1]`: は、はい…わかりました…やってみます…
- `CHOICE_EVENT_DIALOGUES.E6.easygoing._default[1]`: マジで！？ 他の団体が私を欲しいって！？ ちょっと嬉しいかも…
- `CHOICE_EVENT_DIALOGUES.E6.easygoing.delinquent[1]`: 他所から話来たんだけど！ちょっと嬉しくね？
- `CHOICE_EVENT_DIALOGUES.E6.easygoing.seductive[1]`: 他所からお誘いが来ちゃった。ちょっと嬉しいかも
- `CHOICE_EVENT_DIALOGUES.E6.earnest._default[1]`: こちらに義理があるので断りましたが…報告しておきます
- `CHOICE_EVENT_DIALOGUES.E6.earnest._default[2]`: みんなと離れたくない気持ちはあるけど…正直、迷ってます
- `CHOICE_EVENT_DIALOGUES.E6.earnest.polite[1]`: こちらに義理がございますので…ただ、ご報告だけは
- `CHOICE_EVENT_DIALOGUES.E6.earnest.ojousama[1]`: こちらへの義理がございますから…でも、ご報告だけはと思いまして
- `CHOICE_EVENT_DIALOGUES.E6.earnest.seductive[1]`: 義理があるから断ったけど…報告はしておくわね
- `CHOICE_EVENT_DIALOGUES.E6.earnest.composed[1]`: …義理があるから断ったよ。でも、一応報告だけね
- `CHOICE_EVENT_DIALOGUES.E6.emotional._default[1]`: 他の団体からオファーが…どうしよう…迷ってる…
- `CHOICE_EVENT_DIALOGUES.E6.emotional.seductive[1]`: いいわよ……っ……ふふ、やってみせるわ……
- `CHOICE_EVENT_DIALOGUES.S_boycott.normal._default[1]`: ……今日は練習する気分じゃないです
- `CHOICE_EVENT_DIALOGUES.S_boycott.normal._default[2]`: ……すみません、今日は帰ります
- `CHOICE_EVENT_DIALOGUES.S_boycott.normal.ojousama[1]`: 今日はお稽古をお休みさせていただきますわ…理由は…ご想像にお任せしますわ
- `CHOICE_EVENT_DIALOGUES.S_boycott.normal.delinquent[1]`: 練習？やる意味あんの？出してもらえねぇんじゃ同じだろ
- `CHOICE_EVENT_DIALOGUES.S_boycott.normal.cool[1]`: …………（荷物をまとめて帰ろうとしている）
- `CHOICE_EVENT_DIALOGUES.S_boycott.normal.seductive[1]`: ごめんなさいね…今日はちょっと、気持ちが入らなくて
- `CHOICE_EVENT_DIALOGUES.S_boycott.normal.composed[1]`: …今日はいいかな。少し考えたいことがあって
- `CHOICE_EVENT_DIALOGUES.S_boycott.bold._default[1]`: 練習？出してもくれないのに何の意味があるのよ？
- `CHOICE_EVENT_DIALOGUES.S_boycott.bold._default[2]`: リングに上がれないなら練習しても仕方ないでしょ
- `CHOICE_EVENT_DIALOGUES.S_boycott.bold.delinquent[1]`: はぁ？やる気出ないっつの。文句あんなら試合組めよ
- `CHOICE_EVENT_DIALOGUES.S_boycott.quiet._default[1]`: …………（黙って道場を出ていこうとしている）
- `CHOICE_EVENT_DIALOGUES.S_boycott.quiet._default[2]`: ……すみません…今日は……
- `CHOICE_EVENT_DIALOGUES.S_boycott.quiet.cool[1]`: ………（静かにテーピングを外している）
- `CHOICE_EVENT_DIALOGUES.S_boycott.easygoing._default[1]`: あはは…今日はちょっとサボりまーす…
- `CHOICE_EVENT_DIALOGUES.S_boycott.easygoing._default[2]`: 練習ねぇ…うーん、今日はパスで
- `CHOICE_EVENT_DIALOGUES.S_boycott.earnest._default[1]`: すみません…今日はどうしても体が動かなくて…
- `CHOICE_EVENT_DIALOGUES.S_boycott.earnest._default[2]`: 練習に集中できなくて…申し訳ありません
- `CHOICE_EVENT_DIALOGUES.S_boycott.earnest.polite[1]`: 大変申し訳ございません…今日はどうしても…
- `CHOICE_EVENT_DIALOGUES.S_boycott.emotional._default[1]`: もう無理…練習なんてできない…
- `CHOICE_EVENT_DIALOGUES.S_boycott.emotional._default[2]`: 出してもらえないのに練習して…何になるの…
- `CHOICE_EVENT_DIALOGUES.S_boycott.emotional.seductive[1]`: ……っ……これは認められないわ、悪いけど……
- `CHOICE_EVENT_DIALOGUES.S_boycott.shy.polite[1]`: あ、あの…これは、納得できません…
- `CHOICE_EVENT_DIALOGUES.S_grumble.normal._default[1]`: （ロッカールームで不満を漏らしている…周囲に伝播し始めた）
- `CHOICE_EVENT_DIALOGUES.S_grumble.normal.ojousama[1]`: （控室で「あの方の采配、少しおかしくなくて？」と囁いている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.normal.delinquent[1]`: （「マジふざけんな」とロッカーを蹴る音が聞こえてきた）
- `CHOICE_EVENT_DIALOGUES.S_grumble.normal.cool[1]`: （無言で佇んでいるが、周囲が気を遣って重い空気になっている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.normal.seductive[1]`: （「最近、ここにいる意味あるのかしら」と同僚に漏らしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.normal.composed[1]`: （いつもの穏やかさが消え、「…ま、そういうことだよね」と静かに呟いている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.bold._default[1]`: （「なんで私たちがこんな扱い受けなきゃいけないんだ」と大声で言っている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.quiet._default[1]`: （黙っているが、その沈黙がかえって周囲を不安にさせている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.easygoing._default[1]`: （いつもの笑顔が消え、「ちょっとさぁ…」と珍しく愚痴をこぼしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.earnest._default[1]`: （「自分、このままでいいんですかね…」と後輩に弱音を吐いている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.emotional._default[1]`: （涙ぐみながら「もう限界かも…」とチームメイトに打ち明けている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.emotional.seductive[1]`: 正直に言うわね……っ……ちょっと不満なの……
- `CHOICE_EVENT_DIALOGUES.S_grumble.shy.polite[1]`: すみません…少し、不満があります…
- `CHOICE_EVENT_DIALOGUES.S_sns.normal._default[1]`: （SNSに「自分の居場所はどこなんだろう」と意味深な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.normal.ojousama[1]`: （SNSに「窮屈な場所からは、いつでも出ていけますの」と投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.normal.delinquent[1]`: （SNSに「もう我慢の限界」と不穏な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.normal.cool[1]`: （SNSに風景写真と「遠くへ」とだけ投稿。ファンがざわついている）
- `CHOICE_EVENT_DIALOGUES.S_sns.normal.seductive[1]`: （SNSに「次のステージが待っているかも」と匂わせ投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.normal.composed[1]`: （SNSに夕焼けの写真と「…少し考える時間が欲しいかな」と投稿。ファンがざわついている）
- `CHOICE_EVENT_DIALOGUES.S_sns.bold._default[1]`: （SNSに「このまま終わるつもりはない」と宣言的な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.quiet._default[1]`: （SNSに「…」とだけ投稿。ファンの間で憶測が広がっている）
- `CHOICE_EVENT_DIALOGUES.S_sns.easygoing._default[1]`: （SNSに「最近ちょっと考えることがあってー」と珍しく真面目な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.earnest._default[1]`: （SNSに「自分は本当にここで必要とされているのか」と率直な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.emotional._default[1]`: （SNSに涙の絵文字と「もうダメかもしれない」と投稿。炎上し始めている）
- `CHOICE_EVENT_DIALOGUES.S_sns.emotional.seductive[1]`: SNS見たわ……っ……ふふ、勝手な人たちね……
- `CHOICE_EVENT_DIALOGUES.S_sns.shy.polite[1]`: え、SNSで…そんな風に書かれてしまって…

## `CHOICE_EVENT_RESULT_DIALOGUES`

- 出典: `src/data.js`
- コード内コメント: 選択型イベント 結果セリフ（成功時の喜びリアクションなど） / 構造: CHOICE_EVENT_RESULT_DIALOGUES[type][outcome][archetype][personality] / outcome: 'accept'(出す/受ける成功), 'recommend'(別の選手推薦時、推薦された選手のリアクション)
- 本数: 19

- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.normal._default[1]`: 出演のお話、ありがたくお受けします
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.normal.polite[1]`: やりました……!夢みたいです、本当にありがとうございます
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.bold._default[1]`: 任せてよ、ばっちり爪痕残してくる!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.bold.polite[1]`: やった、やりましたよ!わたしにできないことなんてない!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.quiet._default[1]`: ……出る。頑張る
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.quiet.seductive[1]`: ……やれた。……嬉しい
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.shy._default[1]`: は、はい…!せ、精一杯やります…!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.easygoing._default[1]`: やったー!カメラの前で何しよっかな!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.easygoing.polite[1]`: やったー!信じられない、夢みたい……!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.easygoing.ojousama[1]`: まあ、成功いたしましたの!わたくし、嬉しくて仕方ありませんわ!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.earnest._default[1]`: お任せください…精一杯務めます
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.emotional._default[1]`: ほんとに……!? 嬉しい……っ……頑張ります……!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.normal._default[1]`: えっ、わたしですか？ ……はい、頑張ります!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.bold._default[1]`: お、わたしに来た!? いいよ、任せて!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.quiet._default[1]`: ……わたしで、いいんですか。……やります
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.shy._default[1]`: えっ、わ、わたしが…!? が、頑張ります……!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.easygoing._default[1]`: えー!? わたしでいいの? やったー!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.earnest._default[1]`: ご指名、ありがとうございます。精一杯やります
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.emotional._default[1]`: えっ、わたしに……!? う、嬉しい……!

## `LARGE_EVENT_TEXTS`

- 出典: `src/data.js`
- コード内コメント: v2.0 Phase1-6: 大型イベント（B1〜B4）テキスト＋セリフ
- 本数: 86

### B1[].text

- `LARGE_EVENT_TEXTS.B1[1].text`: ⚠️ {name}が練習中にアクシデント
- `LARGE_EVENT_TEXTS.B1[2].text`: ⚠️ {name}が練習で負傷
- `LARGE_EVENT_TEXTS.B1[3].text`: ⚠️ {name}に練習中のトラブル
- `LARGE_EVENT_TEXTS.B1[4].text`: ⚠️ {name}がロープワーク中に負傷
- `LARGE_EVENT_TEXTS.B1[5].text`: ⚠️ {name}がスパーリング中に痛みを訴えた
- `LARGE_EVENT_TEXTS.B1[6].text`: ⚠️ {name}が練習後に体の異変を報告

### B1[].detail

- `LARGE_EVENT_TEXTS.B1[1].detail`: {name}が練習中に技を受けた際にバランスを崩し、負傷してしまった。
- `LARGE_EVENT_TEXTS.B1[2].detail`: スパーリング中に{name}が相手の技を受け損ね、マットに叩きつけられた。
- `LARGE_EVENT_TEXTS.B1[3].detail`: {name}が新技の練習中に着地に失敗。痛みを訴えている。
- `LARGE_EVENT_TEXTS.B1[4].detail`: ロープの反動を利用した連続技の練習中、{name}の足がロープに絡まり転倒。すぐには立ち上がれなかった。
- `LARGE_EVENT_TEXTS.B1[5].detail`: 練習パートナーとのスパーリングで{name}が技を受けた直後、顔をしかめて膝をついた。本人は続けられると言うが…
- `LARGE_EVENT_TEXTS.B1[6].detail`: 練習を終えた{name}が、動かすと痛む箇所があると申告。無理をしていた可能性がある。

### B2[].text

- `LARGE_EVENT_TEXTS.B2[1].text`: 💥 {name1}と{name2}が衝突
- `LARGE_EVENT_TEXTS.B2[2].text`: 💥 {name1}と{name2}の対立が深刻化
- `LARGE_EVENT_TEXTS.B2[3].text`: 💥 {name1}と{name2}がスパーリングでエスカレート
- `LARGE_EVENT_TEXTS.B2[4].text`: 💥 {name1}と{name2}の間に亀裂
- `LARGE_EVENT_TEXTS.B2[5].text`: 💥 {name1}と{name2}の関係が限界に

### B2[].detail

- `LARGE_EVENT_TEXTS.B2[1].detail`: 控室で{name1}と{name2}の間に激しい口論が発生。周囲の制止も聞かず一触即発の状態になっている。
- `LARGE_EVENT_TEXTS.B2[2].detail`: 以前から不穏な空気があった{name1}と{name2}の関係がついに破綻。練習にも支障が出始めている。
- `LARGE_EVENT_TEXTS.B2[3].detail`: 本来は軽い打ち合いのはずが、{name1}と{name2}のスパーリングが本気のぶつかり合いに発展。コーチが間に割って入る事態となった。
- `LARGE_EVENT_TEXTS.B2[4].detail`: {name1}がSNSに意味深な投稿をしたことで{name2}が激怒。控室で怒鳴り合う二人の声が外まで漏れていた。
- `LARGE_EVENT_TEXTS.B2[5].detail`: 合同練習中、{name1}が{name2}への不満を公然と口にした。全員の前での出来事に、チーム全体が凍りついた。

### B3[].text

- `LARGE_EVENT_TEXTS.B3[1].text`: ⚔️ {orgName}から挑戦状
- `LARGE_EVENT_TEXTS.B3[2].text`: ⚔️ {orgName}が宣戦布告
- `LARGE_EVENT_TEXTS.B3[3].text`: ⚔️ {orgName}の選手が記者会見で挑発
- `LARGE_EVENT_TEXTS.B3[4].text`: ⚔️ {orgName}から果たし状が届いた
- `LARGE_EVENT_TEXTS.B3[5].text`: ⚔️ {orgName}が興行に乗り込んできた

### B3[].detail

- `LARGE_EVENT_TEXTS.B3[1].detail`: {orgName}が「実力を見せてやる」と挑戦状を叩きつけてきた。
- `LARGE_EVENT_TEXTS.B3[2].detail`: {orgName}の代表が公の場でこちらの団体を挑発。挑戦状で決着をつけようと迫ってきた。
- `LARGE_EVENT_TEXTS.B3[3].detail`: {orgName}の選手がメディアの前でこちらの団体名を出し、「いつでも受けて立つ」と公開挑戦状を叩きつけた。
- `LARGE_EVENT_TEXTS.B3[4].detail`: {orgName}から正式な書面が届いた。「団体の威信をかけて一騎打ちを行いたい」——無視するわけにはいかない雰囲気だ。
- `LARGE_EVENT_TEXTS.B3[5].detail`: こちらの興行会場に{orgName}の関係者が姿を見せ、「リングで語り合おう」と挑戦状を突きつけてきた。

### B4.youngStar[].text

- `LARGE_EVENT_TEXTS.B4.youngStar[1].text`: 📺 {outletName}から若手特集の申し入れ
- `LARGE_EVENT_TEXTS.B4.youngStar[2].text`: 📺 {outletName}が注目の新星を追いたいと打診
- `LARGE_EVENT_TEXTS.B4.youngStar[3].text`: 📺 {outletName}の「若手発掘」企画にうちの選手が候補に

### B4.youngStar[].detail

- `LARGE_EVENT_TEXTS.B4.youngStar[1].detail`: {outletName}が「次世代のスターを追いかけたい」と密着取材を申し出ている。
- `LARGE_EVENT_TEXTS.B4.youngStar[2].detail`: {outletName}のディレクターが「若い才能に密着したい」と話を持ちかけてきた。
- `LARGE_EVENT_TEXTS.B4.youngStar[3].detail`: 「プロレス界の未来を担う若手を追う」——{outletName}からそんな企画の依頼が来た。

### B4.ace[].text

- `LARGE_EVENT_TEXTS.B4.ace[1].text`: 📺 {outletName}がエース密着企画を提案
- `LARGE_EVENT_TEXTS.B4.ace[2].text`: 📺 {outletName}から「頂点の景色」取材オファー
- `LARGE_EVENT_TEXTS.B4.ace[3].text`: 📺 {outletName}がトップ選手の特集を企画中

### B4.ace[].detail

- `LARGE_EVENT_TEXTS.B4.ace[1].detail`: {outletName}が「団体の顔に密着したい」とドキュメンタリー企画を持ち込んできた。
- `LARGE_EVENT_TEXTS.B4.ace[2].detail`: {outletName}が「頂点に立つ選手の日常を追いたい」と密着取材を打診してきた。
- `LARGE_EVENT_TEXTS.B4.ace[3].detail`: 「団体を背負うエースに迫る」——{outletName}からそんなオファーが届いた。推薦する選手を選んでほしいという。

### B4.veteran[].text

- `LARGE_EVENT_TEXTS.B4.veteran[1].text`: 📺 {outletName}がベテラン特集を企画
- `LARGE_EVENT_TEXTS.B4.veteran[2].text`: 📺 {outletName}から「キャリアの深み」取材依頼
- `LARGE_EVENT_TEXTS.B4.veteran[3].text`: 📺 {outletName}が「円熟の技」ドキュメントを提案

### B4.veteran[].detail

- `LARGE_EVENT_TEXTS.B4.veteran[1].detail`: {outletName}が「長く戦い続ける選手の矜持に迫りたい」と密着取材を申し出ている。
- `LARGE_EVENT_TEXTS.B4.veteran[2].detail`: {outletName}のプロデューサーが来訪。「経験豊富な選手の素顔を追いたい」とのこと。
- `LARGE_EVENT_TEXTS.B4.veteran[3].detail`: 「ベテランだからこそ見える景色がある」——{outletName}からそんなテーマの企画が持ち込まれた。

### B4_cm[].text

- `LARGE_EVENT_TEXTS.B4_cm[1].text`: 📸 {outletName}からCM出演の打診
- `LARGE_EVENT_TEXTS.B4_cm[2].text`: 📸 {outletName}がCMキャストを探している
- `LARGE_EVENT_TEXTS.B4_cm[3].text`: 📸 {outletName}のCM出演オファー

### B4_cm[].detail

- `LARGE_EVENT_TEXTS.B4_cm[1].detail`: {outletName}から「選手をCMの顔として起用したい」と打診が来た。
- `LARGE_EVENT_TEXTS.B4_cm[2].detail`: 「プロレスラーのカッコよさをCMで表現したい」——{outletName}からそんな依頼が届いた。
- `LARGE_EVENT_TEXTS.B4_cm[3].detail`: {outletName}のプロデューサーが来訪。「うちの団体の選手を広告塔に使いたい」とのこと。

### B4_gravure[].text

- `LARGE_EVENT_TEXTS.B4_gravure[1].text`: 📷 {outletName}からグラビア撮影の依頼
- `LARGE_EVENT_TEXTS.B4_gravure[2].text`: 📷 {outletName}がグラビア特集企画を検討
- `LARGE_EVENT_TEXTS.B4_gravure[3].text`: 📷 {outletName}からグラビア出演のオファー

### B4_gravure[].detail

- `LARGE_EVENT_TEXTS.B4_gravure[1].detail`: {outletName}が「プロレスラーの魅力をグラビアで届けたい」と申し出てきた。
- `LARGE_EVENT_TEXTS.B4_gravure[2].detail`: 「女子プロレスラーの素顔に迫りたい」——{outletName}からそんな企画の打診が来た。
- `LARGE_EVENT_TEXTS.B4_gravure[3].detail`: {outletName}の編集長から直接連絡が入った。「ぜひ選手を誌面に起用したい」とのこと。

### B4_variety[].text

- `LARGE_EVENT_TEXTS.B4_variety[1].text`: 📺 {outletName}からバラエティ出演のオファー
- `LARGE_EVENT_TEXTS.B4_variety[2].text`: 📺 {outletName}がゲスト出演の候補を探している
- `LARGE_EVENT_TEXTS.B4_variety[3].text`: 📺 {outletName}のトーク番組に出演依頼

### B4_variety[].detail

- `LARGE_EVENT_TEXTS.B4_variety[1].detail`: {outletName}が「プロレスラーがゲスト出演するコーナーを作りたい」と打診してきた。
- `LARGE_EVENT_TEXTS.B4_variety[2].detail`: 「面白いキャラクターのプロレスラーを探している」——{outletName}からそんな依頼が届いた。
- `LARGE_EVENT_TEXTS.B4_variety[3].detail`: {outletName}のディレクターが来訪。「選手のキャラクターを全国に届けたい」とのこと。

### B4_brand[].text

- `LARGE_EVENT_TEXTS.B4_brand[1].text`: 🤝 {outletName}からコラボ商品の提案
- `LARGE_EVENT_TEXTS.B4_brand[2].text`: 🤝 {outletName}がコラボパートナーを探している
- `LARGE_EVENT_TEXTS.B4_brand[3].text`: 🤝 {outletName}とのコラボ企画の打診

### B4_brand[].detail

- `LARGE_EVENT_TEXTS.B4_brand[1].detail`: {outletName}が「選手とのコラボ商品を作りたい」と申し出てきた。
- `LARGE_EVENT_TEXTS.B4_brand[2].detail`: 「プロレスのパワーとブランドのスタイルを組み合わせたい」——{outletName}からそんな話が来た。
- `LARGE_EVENT_TEXTS.B4_brand[3].detail`: {outletName}の担当者が来訪。「選手のイメージを商品に落とし込みたい」とのこと。

### B4_fashion[].text

- `LARGE_EVENT_TEXTS.B4_fashion[1].text`: 👗 {outletName}のランウェイ出演オファー
- `LARGE_EVENT_TEXTS.B4_fashion[2].text`: 👗 {outletName}がファッションショー出演者を募集
- `LARGE_EVENT_TEXTS.B4_fashion[3].text`: 👗 {outletName}のコレクションへの参加依頼

### B4_fashion[].detail

- `LARGE_EVENT_TEXTS.B4_fashion[1].detail`: {outletName}が「アスリートのランウェイ参加を企画している」と打診してきた。
- `LARGE_EVENT_TEXTS.B4_fashion[2].detail`: 「プロレスラーの迫力をランウェイで表現したい」——{outletName}からそんな話が届いた。
- `LARGE_EVENT_TEXTS.B4_fashion[3].detail`: {outletName}のデザイナーが来訪。「ぜひ選手にランウェイを歩いてほしい」とのこと。

### B4_fan[].text

- `LARGE_EVENT_TEXTS.B4_fan[1].text`: 🎤 ファンイベント開催の打診
- `LARGE_EVENT_TEXTS.B4_fan[2].text`: 🎤 サイン会・トークショーの開催依頼
- `LARGE_EVENT_TEXTS.B4_fan[3].text`: 🎤 ファンミーティングの企画提案

### B4_fan[].detail

- `LARGE_EVENT_TEXTS.B4_fan[1].detail`: 主催者から「選手とファンが直接交流できるイベントを開きたい」と相談が来た。
- `LARGE_EVENT_TEXTS.B4_fan[2].detail`: 「ファンと選手が触れ合える機会を作りたい」——イベント会社からそんな提案が届いた。
- `LARGE_EVENT_TEXTS.B4_fan[3].detail`: 「選手の素顔をファンに見せる場を作りたい」と主催者から打診があった。

## `LARGE_EVENT_DIALOGUES`

- 出典: `src/data.js`
- 本数: 272

- `LARGE_EVENT_DIALOGUES.B1.normal._default[1]`: …痛みが引くまで少し時間がかかりそうです
- `LARGE_EVENT_DIALOGUES.B1.normal.ojousama[1]`: 少しお時間をいただくことになりそうですわ…
- `LARGE_EVENT_DIALOGUES.B1.normal.delinquent[1]`: いてて…やっちまった。すぐ戻るから
- `LARGE_EVENT_DIALOGUES.B1.normal.seductive[1]`: …少し時間がかかりそう。ごめんなさいね
- `LARGE_EVENT_DIALOGUES.B1.normal.composed[1]`: …やっちゃったね。まあ、焦らず治すよ
- `LARGE_EVENT_DIALOGUES.B1.bold._default[1]`: くそっ…こんなところで足を止めるわけにはいかないのに
- `LARGE_EVENT_DIALOGUES.B1.bold._default[2]`: 大丈夫。この程度…すぐ直るから
- `LARGE_EVENT_DIALOGUES.B1.bold.ojousama[1]`: こんなところで止まるわけにはいかないわ…
- `LARGE_EVENT_DIALOGUES.B1.bold.delinquent[1]`: くそっ…こんなとこで止まってらんねえ！
- `LARGE_EVENT_DIALOGUES.B1.bold.cool[1]`: …すぐ戻る。問題ない
- `LARGE_EVENT_DIALOGUES.B1.bold.seductive[1]`: こんなところで止まるつもりはないわ…すぐ戻る
- `LARGE_EVENT_DIALOGUES.B1.bold.composed[1]`: …まあ、こういうこともあるよ。少し待ってて
- `LARGE_EVENT_DIALOGUES.B1.quiet._default[1]`: ……すみません
- `LARGE_EVENT_DIALOGUES.B1.quiet.cool[1]`: …すぐ戻る
- `LARGE_EVENT_DIALOGUES.B1.quiet.polite[1]`: …申し訳ございません。すぐに戻ります
- `LARGE_EVENT_DIALOGUES.B1.shy._default[1]`: す、すみません…ご迷惑を…早く治します…
- `LARGE_EVENT_DIALOGUES.B1.shy.polite[1]`: あ、あの…これから、頑張りたいことがあります…
- `LARGE_EVENT_DIALOGUES.B1.easygoing._default[1]`: いてて…やっちゃいました。でも根性で治します！
- `LARGE_EVENT_DIALOGUES.B1.easygoing.delinquent[1]`: いった！やっちまったけど、すぐ治すから！
- `LARGE_EVENT_DIALOGUES.B1.easygoing.seductive[1]`: あら、やっちゃった…でもすぐ治すわ
- `LARGE_EVENT_DIALOGUES.B1.earnest._default[1]`: すみません…もっと注意するべきでした。早く復帰できるよう頑張ります
- `LARGE_EVENT_DIALOGUES.B1.earnest.polite[1]`: 申し訳ございません…一日も早く復帰いたします
- `LARGE_EVENT_DIALOGUES.B1.earnest.ojousama[1]`: もっと気をつけるべきでしたわ…早く復帰して見せますの
- `LARGE_EVENT_DIALOGUES.B1.earnest.seductive[1]`: ごめんなさい…早く戻れるように頑張るわ
- `LARGE_EVENT_DIALOGUES.B1.earnest.composed[1]`: …不注意だったね。きちんと治して、ちゃんと戻るよ
- `LARGE_EVENT_DIALOGUES.B1.emotional._default[1]`: ごめんなさい…！早く治します…早く戻りたい…！
- `LARGE_EVENT_DIALOGUES.B1.emotional.seductive[1]`: これから……っ……やりたいこと、いっぱいあるの……
- `LARGE_EVENT_DIALOGUES.B2_fighter1.normal._default[1]`: このままじゃチームがもたない。何とかしてほしい
- `LARGE_EVENT_DIALOGUES.B2_fighter1.normal.ojousama[1]`: あの方とは…もう限界ですわ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.normal.delinquent[1]`: あいつとはもう無理だ。何とかしてくれ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.normal.seductive[1]`: あの人とはもう無理よ。何とかしてもらえないかしら
- `LARGE_EVENT_DIALOGUES.B2_fighter1.normal.composed[1]`: …まあ、合わない人もいるよね。少し距離を置きたいな
- `LARGE_EVENT_DIALOGUES.B2_fighter1.bold._default[1]`: あいつの態度が許せない。もう我慢の限界よ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.bold._default[2]`: チームのためにも、この問題ははっきりさせるべき！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.bold.ojousama[1]`: あの女の態度は許せないわね……
- `LARGE_EVENT_DIALOGUES.B2_fighter1.bold.delinquent[1]`: あいつの態度が気に食わねえ！限界だ！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.bold.cool[1]`: …あいつとは合わない。決着をつける
- `LARGE_EVENT_DIALOGUES.B2_fighter1.bold.seductive[1]`: あの人の態度、もう我慢できないの
- `LARGE_EVENT_DIALOGUES.B2_fighter1.bold.composed[1]`: …悪いけど、あの人とはちょっと厳しいかな
- `LARGE_EVENT_DIALOGUES.B2_fighter1.quiet._default[1]`: ………あの人とは、もう…
- `LARGE_EVENT_DIALOGUES.B2_fighter1.quiet.cool[1]`: …あれとは合わない。それだけだ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.quiet.polite[1]`: …あの方とは…申し訳ありません、もう限界です
- `LARGE_EVENT_DIALOGUES.B2_fighter1.shy._default[1]`: あの…あの人のこと…もう…どうしたらいいか…
- `LARGE_EVENT_DIALOGUES.B2_fighter1.shy.polite[1]`: お、お話を聞かせていただけますか…？
- `LARGE_EVENT_DIALOGUES.B2_fighter1.easygoing._default[1]`: あいつとはもう無理！顔も見たくない！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.easygoing.delinquent[1]`: あいつマジ無理！もう顔も見たくねえ！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.easygoing.seductive[1]`: あの人とはもう無理。顔も見たくないわ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.earnest._default[1]`: 足を引っ張る人間とは一緒にやれない
- `LARGE_EVENT_DIALOGUES.B2_fighter1.earnest._default[2]`: このままでは団体のためにならない。何とかしてほしい
- `LARGE_EVENT_DIALOGUES.B2_fighter1.earnest.polite[1]`: あの方とは…このままではチームに影響が出ます
- `LARGE_EVENT_DIALOGUES.B2_fighter1.earnest.ojousama[1]`: あの方とは…チームのためにもはっきりさせるべきですわ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.earnest.seductive[1]`: あの人と一緒じゃ仕事にならないの。何とかして
- `LARGE_EVENT_DIALOGUES.B2_fighter1.earnest.composed[1]`: …無理に合わせても仕方ないからね。整理してもらえると助かるよ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.emotional._default[1]`: もう無理…！あの人と一緒にいると…辛い…！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.emotional.seductive[1]`: ねえ……っ……ちょっと話、聞いてくれる？
- `LARGE_EVENT_DIALOGUES.B2_fighter2.normal._default[1]`: 向こうにも非があるのに、私だけ悪いみたいに…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.normal.ojousama[1]`: あちらにも非がおありでしょうに…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.normal.delinquent[1]`: 向こうが悪いんだろ。なんで私だけ？
- `LARGE_EVENT_DIALOGUES.B2_fighter2.normal.seductive[1]`: 向こうにも非があるのに…私だけが悪いの？
- `LARGE_EVENT_DIALOGUES.B2_fighter2.normal.composed[1]`: …ふぅん。まあ、お互い様だと思うけどね
- `LARGE_EVENT_DIALOGUES.B2_fighter2.bold._default[1]`: 私だって黙ってない。向こうが謝るべきでしょ？
- `LARGE_EVENT_DIALOGUES.B2_fighter2.bold._default[2]`: 正面からぶつかって決着つけるしかないわね
- `LARGE_EVENT_DIALOGUES.B2_fighter2.bold.ojousama[1]`: 私も黙ってはいられませんわ。あちらに非があるのだから
- `LARGE_EVENT_DIALOGUES.B2_fighter2.bold.delinquent[1]`: 黙ってると思うなよ！向こうが謝れ！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.bold.cool[1]`: …謝る気はない。向こうが非を認めるべきだ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.bold.seductive[1]`: 黙ってるつもりはないわ。向こうが悪いんだから
- `LARGE_EVENT_DIALOGUES.B2_fighter2.bold.composed[1]`: …私は私のやり方を変えるつもりはないよ。それだけ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.quiet._default[1]`: ………（静かに俯いている）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.quiet.cool[1]`: …私は間違っていない
- `LARGE_EVENT_DIALOGUES.B2_fighter2.quiet.polite[1]`: …あの方とは…すみません、もう…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.shy._default[1]`: …私が悪いんでしょうか…（不安そうに）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.shy.polite[1]`: は、はい…お聞きします…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.easygoing._default[1]`: 売られたケンカは買うよ！来いよ！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.easygoing.delinquent[1]`: やんのか！？ 売られたケンカは買うぜ！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.easygoing.seductive[1]`: ケンカ売ってきたのは向こうよ？ 買ってあげるわ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.earnest._default[1]`: 団体には迷惑をかけたくないけど…あの人とは無理です
- `LARGE_EVENT_DIALOGUES.B2_fighter2.earnest._default[2]`: 私のやり方に文句があるなら、はっきり言えばいい
- `LARGE_EVENT_DIALOGUES.B2_fighter2.earnest.polite[1]`: 団体にご迷惑はかけたくないのですが…あの方とは…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.earnest.ojousama[1]`: 団体にご迷惑はかけたくありませんのに…あの方とは…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.earnest.seductive[1]`: 迷惑はかけたくないけど…あの人とはもう無理なの
- `LARGE_EVENT_DIALOGUES.B2_fighter2.earnest.composed[1]`: …迷惑はかけたくないんだけどね。うまくいかないものだね
- `LARGE_EVENT_DIALOGUES.B2_fighter2.emotional._default[1]`: 私だって…！私だって辛いのに…！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.emotional.seductive[1]`: いいわよ……っ……話してみて……
- `LARGE_EVENT_DIALOGUES.B4.normal._default[1]`: 取材…緊張しますが、いい試合を見せられるよう頑張ります
- `LARGE_EVENT_DIALOGUES.B4.normal.ojousama[1]`: 取材ですか？ 精一杯務めさせていただきます
- `LARGE_EVENT_DIALOGUES.B4.normal.delinquent[1]`: 取材？ やってやるよ！
- `LARGE_EVENT_DIALOGUES.B4.normal.seductive[1]`: 取材ね…いい姿を見せてあげるわ
- `LARGE_EVENT_DIALOGUES.B4.normal.composed[1]`: …取材か。まあ、いつも通りやるよ
- `LARGE_EVENT_DIALOGUES.B4.bold._default[1]`: いい機会ね。全国に私の実力を見せつけてやる
- `LARGE_EVENT_DIALOGUES.B4.bold._default[2]`: 団体の代表として、恥ずかしくない姿を見せる
- `LARGE_EVENT_DIALOGUES.B4.bold.ojousama[1]`: あらあら、全国の皆様も私の事が気にかかるのかしら？
- `LARGE_EVENT_DIALOGUES.B4.bold.delinquent[1]`: 全国に見せてやるぜ！かかってこい！
- `LARGE_EVENT_DIALOGUES.B4.bold.cool[1]`: …いい機会だ。結果で語る
- `LARGE_EVENT_DIALOGUES.B4.bold.seductive[1]`: 全国に見てもらえるのね。楽しみだわ
- `LARGE_EVENT_DIALOGUES.B4.bold.composed[1]`: …いい機会だね。自分らしくやらせてもらうよ
- `LARGE_EVENT_DIALOGUES.B4.quiet._default[1]`: …がんばります
- `LARGE_EVENT_DIALOGUES.B4.quiet.cool[1]`: …やる。見ていてくれ
- `LARGE_EVENT_DIALOGUES.B4.quiet.polite[1]`: …精一杯、頑張らせていただきます
- `LARGE_EVENT_DIALOGUES.B4.shy._default[1]`: え…わ、私なんかでいいんですか…？ が、頑張ります…！
- `LARGE_EVENT_DIALOGUES.B4.shy.polite[1]`: こ、こんなお仕事、わたしに務まるでしょうか…
- `LARGE_EVENT_DIALOGUES.B4.easygoing._default[1]`: マジで！？ テレビに出れるの！？ やったー！
- `LARGE_EVENT_DIALOGUES.B4.easygoing._default[2]`: ファンの皆さんにもっと近い姿を見せられるね！
- `LARGE_EVENT_DIALOGUES.B4.easygoing.delinquent[1]`: テレビ！？ マジ！？ やったー！
- `LARGE_EVENT_DIALOGUES.B4.easygoing.seductive[1]`: テレビに出れるの？ 嬉しい。もっと見てもらえるわね
- `LARGE_EVENT_DIALOGUES.B4.earnest._default[1]`: 私なんかでいいんですか？ …精一杯頑張ります！
- `LARGE_EVENT_DIALOGUES.B4.earnest.polite[1]`: 私でよろしいんですか…？ 精一杯務めさせていただきます
- `LARGE_EVENT_DIALOGUES.B4.earnest.ojousama[1]`: 私でよろしいのですか…？ 精一杯頑張りますわ
- `LARGE_EVENT_DIALOGUES.B4.earnest.seductive[1]`: 私でいいの？ …精一杯頑張るわ
- `LARGE_EVENT_DIALOGUES.B4.earnest.composed[1]`: …なるほど、私でいいんだ。悪くない話だね
- `LARGE_EVENT_DIALOGUES.B4.emotional._default[1]`: えっ…テレビ…！？ 私が…！？ 頑張ります…！頑張ります…！
- `LARGE_EVENT_DIALOGUES.B4.emotional.seductive[1]`: このお仕事……っ……ふふ、面白そうね……
- `LARGE_EVENT_DIALOGUES.B4_cm.normal._default[1]`: CMか…ちゃんとできるかな。頑張ってみます
- `LARGE_EVENT_DIALOGUES.B4_cm.normal.ojousama[1]`: CMですか。しっかりお役目を果たしますわ
- `LARGE_EVENT_DIALOGUES.B4_cm.normal.delinquent[1]`: CM！？ なんか恥ずかしいけど、やってやるよ
- `LARGE_EVENT_DIALOGUES.B4_cm.normal.seductive[1]`: カメラの前ね…いい絵、撮らせてあげる♡
- `LARGE_EVENT_DIALOGUES.B4_cm.normal.composed[1]`: …CMか。まあ、悪くないね
- `LARGE_EVENT_DIALOGUES.B4_cm.bold._default[1]`: CMで私の顔を全国に売り込む。完璧にやってみせる
- `LARGE_EVENT_DIALOGUES.B4_cm.bold._default[2]`: このチャンス、最大限に使ってやる
- `LARGE_EVENT_DIALOGUES.B4_cm.bold.ojousama[1]`: CM？仕方ないわね……品と格というものを知らしめなければ
- `LARGE_EVENT_DIALOGUES.B4_cm.bold.delinquent[1]`: CM？ 全国にこの顔を売りつけてやる！
- `LARGE_EVENT_DIALOGUES.B4_cm.bold.cool[1]`: …カメラに映るか。悪くない
- `LARGE_EVENT_DIALOGUES.B4_cm.bold.seductive[1]`: 全国に私を見てもらえるのね。楽しみだわ♡
- `LARGE_EVENT_DIALOGUES.B4_cm.bold.composed[1]`: …全国か。いい機会だね、自分のペースでやるよ
- `LARGE_EVENT_DIALOGUES.B4_cm.quiet._default[1]`: …やります
- `LARGE_EVENT_DIALOGUES.B4_cm.quiet.cool[1]`: …カメラか。まぁ、やる
- `LARGE_EVENT_DIALOGUES.B4_cm.quiet.polite[1]`: …精一杯、頑張らせていただきます
- `LARGE_EVENT_DIALOGUES.B4_cm.shy._default[1]`: わ、私がCMに…？ ほ、本当に大丈夫ですか…？
- `LARGE_EVENT_DIALOGUES.B4_cm.shy.polite[1]`: CM…ですか…？ わ、わたしなんかで、いいんでしょうか…
- `LARGE_EVENT_DIALOGUES.B4_cm.easygoing._default[1]`: CM！？ 私ってもしかして売れっ子？♪
- `LARGE_EVENT_DIALOGUES.B4_cm.easygoing._default[2]`: どんなCMになるんだろ〜楽しみ♪
- `LARGE_EVENT_DIALOGUES.B4_cm.easygoing.delinquent[1]`: CM撮影！？ 楽しそうじゃん！
- `LARGE_EVENT_DIALOGUES.B4_cm.easygoing.seductive[1]`: CM出演か…どんな自分が映るか楽しみ♡
- `LARGE_EVENT_DIALOGUES.B4_cm.earnest._default[1]`: CM出演、しっかり準備します。恥ずかしくない姿を
- `LARGE_EVENT_DIALOGUES.B4_cm.earnest.polite[1]`: 大切なお仕事ですね。精一杯務めさせていただきます
- `LARGE_EVENT_DIALOGUES.B4_cm.earnest.ojousama[1]`: しっかり準備してお役目を果たしますわ
- `LARGE_EVENT_DIALOGUES.B4_cm.earnest.seductive[1]`: ちゃんと準備して、いい姿を見せるわ
- `LARGE_EVENT_DIALOGUES.B4_cm.earnest.composed[1]`: …ちゃんとやるよ。恥ずかしくない仕事をしたいからね
- `LARGE_EVENT_DIALOGUES.B4_cm.emotional._default[1]`: CMに出るの…！？ うわあああ緊張する！でもやる！
- `LARGE_EVENT_DIALOGUES.B4_cm.emotional.seductive[1]`: CMに出るの……っ……ふふ、世間に顔を売るチャンスね……
- `LARGE_EVENT_DIALOGUES.B4_gravure.normal._default[1]`: グラビアか…ちょっと恥ずかしいけど、頑張ります
- `LARGE_EVENT_DIALOGUES.B4_gravure.normal.ojousama[1]`: 撮影ですか。美しく仕上げていただけるよう努めますわ
- `LARGE_EVENT_DIALOGUES.B4_gravure.normal.delinquent[1]`: グラビア…？ まぁ、やってやるか
- `LARGE_EVENT_DIALOGUES.B4_gravure.normal.seductive[1]`: グラビアね…全部見せてあげるわ♡
- `LARGE_EVENT_DIALOGUES.B4_gravure.normal.composed[1]`: …グラビアか。まあ、たまにはいいんじゃない
- `LARGE_EVENT_DIALOGUES.B4_gravure.bold._default[1]`: 私の強さと魅力、カメラに焼き付けてやる
- `LARGE_EVENT_DIALOGUES.B4_gravure.bold._default[2]`: これで一気に知名度上げてやる
- `LARGE_EVENT_DIALOGUES.B4_gravure.bold.ojousama[1]`: 撮影？私の魅力を引き出せるのかしら？
- `LARGE_EVENT_DIALOGUES.B4_gravure.bold.delinquent[1]`: グラビアも勝負事だ。全力でいくよ
- `LARGE_EVENT_DIALOGUES.B4_gravure.bold.cool[1]`: …写真か。余計なことはしないが、手は抜かない
- `LARGE_EVENT_DIALOGUES.B4_gravure.bold.seductive[1]`: 私の本気の魅力、たっぷり撮ってもらうわ♡
- `LARGE_EVENT_DIALOGUES.B4_gravure.bold.composed[1]`: …撮られるのは嫌いじゃないよ。いい写真にしよう
- `LARGE_EVENT_DIALOGUES.B4_gravure.quiet._default[1]`: …撮るだけですよね。わかりました
- `LARGE_EVENT_DIALOGUES.B4_gravure.quiet.cool[1]`: …写真か。余計なことはしないでくれ
- `LARGE_EVENT_DIALOGUES.B4_gravure.quiet.polite[1]`: …恥ずかしいですが、精一杯頑張ります
- `LARGE_EVENT_DIALOGUES.B4_gravure.shy._default[1]`: え…グラビア…？ は、恥ずかしいです…でも、やります…
- `LARGE_EVENT_DIALOGUES.B4_gravure.shy.polite[1]`: グ、グラビア…ですか…？ は、恥ずかしいです…でも、頑張ります…
- `LARGE_EVENT_DIALOGUES.B4_gravure.easygoing._default[1]`: グラビアか〜！ どんな感じになるんだろ♪
- `LARGE_EVENT_DIALOGUES.B4_gravure.easygoing._default[2]`: かわいく撮ってもらえるかな♪
- `LARGE_EVENT_DIALOGUES.B4_gravure.easygoing.delinquent[1]`: グラビアか。まぁ、派手にやってやる
- `LARGE_EVENT_DIALOGUES.B4_gravure.easygoing.seductive[1]`: グラビア？ 任せておいてよ♡
- `LARGE_EVENT_DIALOGUES.B4_gravure.earnest._default[1]`: しっかり準備して臨みます。でも…少し恥ずかしいですね
- `LARGE_EVENT_DIALOGUES.B4_gravure.earnest.polite[1]`: 精一杯きれいに撮っていただけるよう頑張ります…
- `LARGE_EVENT_DIALOGUES.B4_gravure.earnest.ojousama[1]`: プロとして恥ずかしくない撮影ができるよう、準備します
- `LARGE_EVENT_DIALOGUES.B4_gravure.earnest.seductive[1]`: きちんと準備して、いい仕上がりにするわ
- `LARGE_EVENT_DIALOGUES.B4_gravure.earnest.composed[1]`: …丁寧にやるよ。せっかくの機会だからね
- `LARGE_EVENT_DIALOGUES.B4_gravure.emotional._default[1]`: グラビア！？ えっ、私ほんとに！？ うわ〜〜！
- `LARGE_EVENT_DIALOGUES.B4_gravure.emotional.seductive[1]`: グラビア……っ……ふふ、見られるのは嫌いじゃないの……
- `LARGE_EVENT_DIALOGUES.B4_variety.normal._default[1]`: バラエティか…うまく喋れるかな。頑張ります
- `LARGE_EVENT_DIALOGUES.B4_variety.normal.ojousama[1]`: バラエティ番組ですか。品よくふるまえるよう努めますわ
- `LARGE_EVENT_DIALOGUES.B4_variety.normal.delinquent[1]`: バラエティ？ 面白いことしてやるよ
- `LARGE_EVENT_DIALOGUES.B4_variety.normal.seductive[1]`: バラエティか。じゃあ、素の私を少し見せてあげようかな
- `LARGE_EVENT_DIALOGUES.B4_variety.normal.composed[1]`: …バラエティか。まあ、のんびり喋るよ
- `LARGE_EVENT_DIALOGUES.B4_variety.bold._default[1]`: 番組ジャックしてやる。全部持っていく
- `LARGE_EVENT_DIALOGUES.B4_variety.bold._default[2]`: トーク番組だろうと、私が主役に決まってる
- `LARGE_EVENT_DIALOGUES.B4_variety.bold.ojousama[1]`: トーク番組？妙な仕事を持ってくるものね
- `LARGE_EVENT_DIALOGUES.B4_variety.bold.delinquent[1]`: テレビで暴れてやる！ 絶対爪痕残す！
- `LARGE_EVENT_DIALOGUES.B4_variety.bold.cool[1]`: …余計なことは言わない。でも、印象には残る
- `LARGE_EVENT_DIALOGUES.B4_variety.bold.seductive[1]`: バラエティでも私のペースで話すわ♡
- `LARGE_EVENT_DIALOGUES.B4_variety.bold.composed[1]`: …まあ、自分のペースで話せばいいんでしょ。大丈夫
- `LARGE_EVENT_DIALOGUES.B4_variety.quiet._default[1]`: …喋るんですか。少し、緊張します
- `LARGE_EVENT_DIALOGUES.B4_variety.quiet.cool[1]`: …無駄なことは言わない。それだけだ
- `LARGE_EVENT_DIALOGUES.B4_variety.quiet.polite[1]`: …うまく喋れるか不安ですが、精一杯やります
- `LARGE_EVENT_DIALOGUES.B4_variety.shy._default[1]`: バ、バラエティ…しゃべるの…？ が、頑張ります…
- `LARGE_EVENT_DIALOGUES.B4_variety.shy.polite[1]`: バ、バラエティ番組…ちゃんと、お話できるか不安です…
- `LARGE_EVENT_DIALOGUES.B4_variety.easygoing._default[1]`: バラエティ！ 笑わせにいくよ♪
- `LARGE_EVENT_DIALOGUES.B4_variety.easygoing._default[2]`: テレビって楽しそう！ 全力でいく♪
- `LARGE_EVENT_DIALOGUES.B4_variety.easygoing.delinquent[1]`: テレビで暴れてやる！ 楽しみ！
- `LARGE_EVENT_DIALOGUES.B4_variety.easygoing.seductive[1]`: バラエティか〜。楽しそう！ 見ててよ♡
- `LARGE_EVENT_DIALOGUES.B4_variety.earnest._default[1]`: うまく喋れるか不安ですが…精一杯やります
- `LARGE_EVENT_DIALOGUES.B4_variety.earnest.polite[1]`: トーク番組は緊張しますが…誠実に対応いたします
- `LARGE_EVENT_DIALOGUES.B4_variety.earnest.ojousama[1]`: 言葉遣いには気をつけて、丁寧に対応しますわ
- `LARGE_EVENT_DIALOGUES.B4_variety.earnest.seductive[1]`: ちゃんと準備して、面白い話ができるよう頑張るわ
- `LARGE_EVENT_DIALOGUES.B4_variety.earnest.composed[1]`: …落ち着いて話せばいいよね。焦らずやるよ
- `LARGE_EVENT_DIALOGUES.B4_variety.emotional._default[1]`: バラエティ出る！？ テンション上がってきた〜！！
- `LARGE_EVENT_DIALOGUES.B4_variety.emotional.seductive[1]`: バラエティに出るの……っ……ふふ、楽しんでくるわね……
- `LARGE_EVENT_DIALOGUES.B4_brand.normal._default[1]`: ブランドとのコラボか。ちゃんとイメージに合わせられるかな
- `LARGE_EVENT_DIALOGUES.B4_brand.normal.ojousama[1]`: まあ、コラボのお話ですの。嬉しい限りですわ
- `LARGE_EVENT_DIALOGUES.B4_brand.normal.delinquent[1]`: ブランドとコラボ…？ なんか柄じゃないな。でもやる
- `LARGE_EVENT_DIALOGUES.B4_brand.normal.seductive[1]`: 私のイメージに合うブランドね。いい選択だわ♡
- `LARGE_EVENT_DIALOGUES.B4_brand.normal.composed[1]`: …コラボか。なるほどね、面白そう
- `LARGE_EVENT_DIALOGUES.B4_brand.bold._default[1]`: そのブランドのイメージ、私が底上げしてやる
- `LARGE_EVENT_DIALOGUES.B4_brand.bold._default[2]`: 私が使ったら絶対売れる。任せて
- `LARGE_EVENT_DIALOGUES.B4_brand.bold.ojousama[1]`: 私なら、確かにブランドイメージは上がるでしょうね
- `LARGE_EVENT_DIALOGUES.B4_brand.bold.delinquent[1]`: コラボ商品、派手にやってやる！
- `LARGE_EVENT_DIALOGUES.B4_brand.bold.cool[1]`: …ブランドには口数の少なさが向いている。悪くない
- `LARGE_EVENT_DIALOGUES.B4_brand.bold.seductive[1]`: 私とブランドの組み合わせ…最高じゃない♡
- `LARGE_EVENT_DIALOGUES.B4_brand.bold.composed[1]`: …悪くない組み合わせだね。いいものにしよう
- `LARGE_EVENT_DIALOGUES.B4_brand.quiet._default[1]`: …わかりました。やります
- `LARGE_EVENT_DIALOGUES.B4_brand.quiet.cool[1]`: …無駄口は叩かない。それがブランドには向いているかもな
- `LARGE_EVENT_DIALOGUES.B4_brand.quiet.polite[1]`: …コラボですね。しっかり務めさせていただきます
- `LARGE_EVENT_DIALOGUES.B4_brand.shy._default[1]`: わ、私がコラボ…？ 本当に私でいいんですか…
- `LARGE_EVENT_DIALOGUES.B4_brand.shy.polite[1]`: ブランドのお仕事…ですか…？ あ、あの、精一杯やらせていただきます…
- `LARGE_EVENT_DIALOGUES.B4_brand.easygoing._default[1]`: コラボ！？ 商品もらえたりする？♪
- `LARGE_EVENT_DIALOGUES.B4_brand.easygoing._default[2]`: どんな商品になるんだろ〜楽しみ♪
- `LARGE_EVENT_DIALOGUES.B4_brand.easygoing.delinquent[1]`: コラボか。なんか面白そうじゃん
- `LARGE_EVENT_DIALOGUES.B4_brand.easygoing.seductive[1]`: コラボ商品か…どんなのになるかな♡
- `LARGE_EVENT_DIALOGUES.B4_brand.earnest._default[1]`: ブランドさんのイメージを大切に。しっかり務めます
- `LARGE_EVENT_DIALOGUES.B4_brand.earnest.polite[1]`: ブランド様のご期待に添えるよう、精一杯取り組みます
- `LARGE_EVENT_DIALOGUES.B4_brand.earnest.ojousama[1]`: 品格を忘れず、ブランドのイメージを大切にしますわ
- `LARGE_EVENT_DIALOGUES.B4_brand.earnest.seductive[1]`: ちゃんとブランドのイメージに合わせて取り組むわ
- `LARGE_EVENT_DIALOGUES.B4_brand.emotional._default[1]`: えっブランドコラボ！？ すごい！どんな商品になるの！？
- `LARGE_EVENT_DIALOGUES.B4_brand.emotional.seductive[1]`: ブランドのお話……っ……ふふ、素敵ね……
- `LARGE_EVENT_DIALOGUES.B4_fashion.normal._default[1]`: ファッションショーか…歩けるかな。頑張ります
- `LARGE_EVENT_DIALOGUES.B4_fashion.normal.ojousama[1]`: ランウェイですか。精一杯美しく歩いてみせますわ
- `LARGE_EVENT_DIALOGUES.B4_fashion.normal.delinquent[1]`: ファッションショー…？ 歩くだけ？ まぁいいけど
- `LARGE_EVENT_DIALOGUES.B4_fashion.normal.seductive[1]`: ランウェイか…私の本領発揮ね♡
- `LARGE_EVENT_DIALOGUES.B4_fashion.bold._default[1]`: ランウェイも私のステージ。全部持っていく
- `LARGE_EVENT_DIALOGUES.B4_fashion.bold._default[2]`: プロレスもファッションも、どっちも私のもの
- `LARGE_EVENT_DIALOGUES.B4_fashion.bold.ojousama[1]`: ランウェイね……もちろん自信はあるわよ？
- `LARGE_EVENT_DIALOGUES.B4_fashion.bold.delinquent[1]`: 歩くだけなら怖くない。ど派手にやってやる
- `LARGE_EVENT_DIALOGUES.B4_fashion.bold.cool[1]`: …ランウェイか。静かにやる。でも存在感は出す
- `LARGE_EVENT_DIALOGUES.B4_fashion.bold.seductive[1]`: ランウェイ、私のためにあるようなものよ♡
- `LARGE_EVENT_DIALOGUES.B4_fashion.quiet._default[1]`: …歩けばいいんですね。やります
- `LARGE_EVENT_DIALOGUES.B4_fashion.quiet.cool[1]`: …余計なことはしない。ただ歩く。それだけだ
- `LARGE_EVENT_DIALOGUES.B4_fashion.quiet.polite[1]`: …練習して、ちゃんと歩けるよう準備します
- `LARGE_EVENT_DIALOGUES.B4_fashion.shy._default[1]`: フ、ファッションショー…みんなに見られるんですよね…！
- `LARGE_EVENT_DIALOGUES.B4_fashion.shy.polite[1]`: フ、ファッション関連のお仕事…似合うでしょうか…
- `LARGE_EVENT_DIALOGUES.B4_fashion.easygoing._default[1]`: ファッションショー！ なんかキラキラしてそう♪
- `LARGE_EVENT_DIALOGUES.B4_fashion.easygoing._default[2]`: 衣装とかかわいいのかな〜♪
- `LARGE_EVENT_DIALOGUES.B4_fashion.easygoing.delinquent[1]`: ランウェイか。めっちゃ目立てそうじゃん！
- `LARGE_EVENT_DIALOGUES.B4_fashion.easygoing.seductive[1]`: ランウェイ！ 絶対楽しい！ 見ててよ♡
- `LARGE_EVENT_DIALOGUES.B4_fashion.earnest._default[1]`: 練習して、ちゃんと歩けるよう準備します
- `LARGE_EVENT_DIALOGUES.B4_fashion.earnest.polite[1]`: ご期待に沿えるよう、歩き方から練習いたします
- `LARGE_EVENT_DIALOGUES.B4_fashion.earnest.ojousama[1]`: ランウェイには自信がありますわ。しっかり務めます
- `LARGE_EVENT_DIALOGUES.B4_fashion.earnest.seductive[1]`: きちんと練習して、完璧に歩いてみせるわ
- `LARGE_EVENT_DIALOGUES.B4_fashion.emotional._default[1]`: ランウェイ歩くの！？ わあああどうしよう緊張するやつだ！
- `LARGE_EVENT_DIALOGUES.B4_fashion.emotional.seductive[1]`: ファッションのお仕事……っ……ふふ、おしゃれするのは好きよ……
- `LARGE_EVENT_DIALOGUES.B4_fan.normal._default[1]`: ファンの皆さんと直接話せるのか。楽しみです
- `LARGE_EVENT_DIALOGUES.B4_fan.normal.ojousama[1]`: ファンの方々に直接お礼を申し上げる機会ですわね
- `LARGE_EVENT_DIALOGUES.B4_fan.normal.delinquent[1]`: ファンイベ！ 直接会えるのいいな
- `LARGE_EVENT_DIALOGUES.B4_fan.normal.seductive[1]`: ファンと直接会える機会ね…喜ばせてあげるわ♡
- `LARGE_EVENT_DIALOGUES.B4_fan.bold._default[1]`: ファンに最高の思い出を作らせてやる
- `LARGE_EVENT_DIALOGUES.B4_fan.bold._default[2]`: 全員を笑顔にして帰らせる。それが私の仕事
- `LARGE_EVENT_DIALOGUES.B4_fan.bold.ojousama[1]`: ファンの方々に最高の時間をお届けしますわ
- `LARGE_EVENT_DIALOGUES.B4_fan.bold.delinquent[1]`: ファンイベ、盛り上げてやるよ！
- `LARGE_EVENT_DIALOGUES.B4_fan.bold.cool[1]`: …ファンの前では、少し気を緩めてもいいかもな
- `LARGE_EVENT_DIALOGUES.B4_fan.bold.seductive[1]`: ファンを喜ばせるのは得意よ。任せて♡
- `LARGE_EVENT_DIALOGUES.B4_fan.quiet._default[1]`: …ファンの人たちと話す。ちゃんとやります
- `LARGE_EVENT_DIALOGUES.B4_fan.quiet.cool[1]`: …来てくれた人には、ちゃんと応えたい
- `LARGE_EVENT_DIALOGUES.B4_fan.quiet.polite[1]`: …緊張しますが、来てくださった方に感謝を伝えます
- `LARGE_EVENT_DIALOGUES.B4_fan.shy._default[1]`: フ、ファンの方に直接会うんですか…！ 緊張しますが頑張ります
- `LARGE_EVENT_DIALOGUES.B4_fan.shy.polite[1]`: ファンの方に…直接、お会いできるんですか…？ う、嬉しいです…
- `LARGE_EVENT_DIALOGUES.B4_fan.easygoing._default[1]`: ファンのみんなに会えるの！ テンション上がる♪
- `LARGE_EVENT_DIALOGUES.B4_fan.easygoing._default[2]`: みんなの笑顔が見れるかな♪
- `LARGE_EVENT_DIALOGUES.B4_fan.easygoing.delinquent[1]`: ファンと直接会えるのいいじゃん！ 楽しみ！
- `LARGE_EVENT_DIALOGUES.B4_fan.easygoing.seductive[1]`: ファンに会いに行くの？ 嬉しいな♡
- `LARGE_EVENT_DIALOGUES.B4_fan.earnest._default[1]`: ファンの皆さん一人ひとりに、誠実に向き合います
- `LARGE_EVENT_DIALOGUES.B4_fan.earnest.polite[1]`: 来てくださった方全員に、心から感謝を伝えたいです
- `LARGE_EVENT_DIALOGUES.B4_fan.earnest.ojousama[1]`: ファンの方々に誠実に向き合うことが私の務めですわ
- `LARGE_EVENT_DIALOGUES.B4_fan.earnest.seductive[1]`: 一人ひとりにちゃんと向き合う。それが大事だと思うわ
- `LARGE_EVENT_DIALOGUES.B4_fan.emotional._default[1]`: ファンに会える！！ 絶対みんなを笑顔にしてみせる！！
- `LARGE_EVENT_DIALOGUES.B4_fan.emotional.seductive[1]`: ファンに会えるの……っ……ふふ、みんなに直接ありがとうって言えるのね……
