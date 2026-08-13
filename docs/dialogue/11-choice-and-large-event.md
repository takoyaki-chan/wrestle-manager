# 選択イベント・大型イベント・社長室

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `DECISION_DOCS`

- 出典: `src/data.js`
- 本数: 69

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
- `DECISION_DOCS.faction_decree.label`: 派閥解散命令
- `DECISION_DOCS.faction_decree.categoryLabel`: 人事
- `DECISION_DOCS.faction_decree.body`: 団体内の派閥を社長命令で解散させ、以後の結成を認めるかどうかを決める
- `DECISION_DOCS.faction_decree.detailText`: 選手たちが自然に作った群れを、上から畳む。畳まれた側は当然おもしろくない。とくに束ねていた本人には深く残る。勢いに乗っていた派閥ほど、その傷は深い。
- `DECISION_DOCS.faction_decree.effectSummary`: 選択した内容によって、解散のみ／解散して以後禁止／禁止の解除 が実行される
- `DECISION_DOCS.faction_decree.recommendation`: 派閥の揉め事を団体から切り離したいときに。まだ派閥が生まれていないうちに禁止しておけば、誰の信頼も損なわずに済む。
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
- 本数: 368

### bonus.standard.normal[]

- `CARE_REACTION_DIALOGUES.bonus.standard.normal[1]`: ありがとうございます！
- `CARE_REACTION_DIALOGUES.bonus.standard.normal[2]`: いただきます…！
- `CARE_REACTION_DIALOGUES.bonus.standard.normal[3]`: 感謝します
- `CARE_REACTION_DIALOGUES.bonus.standard.normal[4]`: 励みになります！
- `CARE_REACTION_DIALOGUES.bonus.standard.normal[5]`: 嬉しいです！大切に使います

### bonus.standard.bold[]

- `CARE_REACTION_DIALOGUES.bonus.standard.bold[1]`: これで負けていられない！
- `CARE_REACTION_DIALOGUES.bonus.standard.bold[2]`: よし！もっと強くなります！

### bonus.standard.quiet[]

- `CARE_REACTION_DIALOGUES.bonus.standard.quiet[1]`: ……ありがとうございます

### bonus.standard.shy[]

- `CARE_REACTION_DIALOGUES.bonus.standard.shy[1]`: え…あの…ありがとう、ございます…！

### bonus.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.bonus.standard.easygoing[1]`: やった！ありがとうございます！
- `CARE_REACTION_DIALOGUES.bonus.standard.easygoing[2]`: おごってもらっちゃおうかな！

### bonus.standard.earnest[]

- `CARE_REACTION_DIALOGUES.bonus.standard.earnest[1]`: ありがとうございます！次の試合、絶対頑張ります！
- `CARE_REACTION_DIALOGUES.bonus.standard.earnest[2]`: …いつもありがとうございます

### bonus.standard.emotional[]

- `CARE_REACTION_DIALOGUES.bonus.standard.emotional[1]`: え…！ありがとうございます…！嬉しい…！
- `CARE_REACTION_DIALOGUES.bonus.standard.emotional[2]`: うわあ…嬉しくて泣きそう…！

### bonus.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.bonus.ojousama.normal[1]`: まあ、ありがとうございます。大切に使わせていただきます

### bonus.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.bonus.ojousama.bold[1]`: ありがとうございます。結果でお返しするわ

### bonus.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.bonus.ojousama.earnest[1]`: ありがとうございます。結果でお応えしますわ

### bonus.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.bonus.delinquent.normal[1]`: お、マジ？ ありがとな！

### bonus.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.bonus.delinquent.bold[1]`: おっしゃ！この金で栄養つけてもっと強くなるぜ！

### bonus.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.bonus.delinquent.easygoing[1]`: やった！ラッキー！

### bonus.seductive.normal[]

- `CARE_REACTION_DIALOGUES.bonus.seductive.normal[1]`: あら、嬉しい。ありがとう

### bonus.seductive.bold[]

- `CARE_REACTION_DIALOGUES.bonus.seductive.bold[1]`: 嬉しいわ。実力で返させてもらうわね

### bonus.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.bonus.seductive.easygoing[1]`: あら嬉しい。何に使おうかしら

### bonus.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.bonus.seductive.earnest[1]`: ありがとう。ちゃんと結果で返すわ

### bonus.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.bonus.seductive.emotional[1]`: ボーナス……っ……気にかけてくれてたのね、嬉しい……ふふ、ありがとう……

### bonus.composed.normal[]

- `CARE_REACTION_DIALOGUES.bonus.composed.normal[1]`: …ありがとう。大事に使うよ

### bonus.composed.bold[]

- `CARE_REACTION_DIALOGUES.bonus.composed.bold[1]`: …ありがとう。結果で返すよ

### bonus.composed.earnest[]

- `CARE_REACTION_DIALOGUES.bonus.composed.earnest[1]`: …ありがたいね。次で応えるよ

### bonus.cool.bold[]

- `CARE_REACTION_DIALOGUES.bonus.cool.bold[1]`: …感謝する。結果で返す

### bonus.cool.quiet[]

- `CARE_REACTION_DIALOGUES.bonus.cool.quiet[1]`: …ありがたい

### bonus.polite.quiet[]

- `CARE_REACTION_DIALOGUES.bonus.polite.quiet[1]`: …ありがとうございます。大切に使います

### bonus.polite.shy[]

- `CARE_REACTION_DIALOGUES.bonus.polite.shy[1]`: ぼ、ボーナスを…？ あ、ありがとうございます…大切に使わせていただきます…

### bonus.polite.earnest[]

- `CARE_REACTION_DIALOGUES.bonus.polite.earnest[1]`: ありがとうございます。必ず結果でお返しいたします

### bonus_repeat.standard.normal[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.standard.normal[1]`: …また？
- `CARE_REACTION_DIALOGUES.bonus_repeat.standard.normal[2]`: えっと…ありがとうございます
- `CARE_REACTION_DIALOGUES.bonus_repeat.standard.normal[3]`: （また、お金…か…）

### bonus_repeat.standard.bold[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.standard.bold[1]`: …また金か。もういいよ

### bonus_repeat.standard.shy[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.standard.shy[1]`: あ…ありがとう、ございます…（また…？）

### bonus_repeat.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.standard.easygoing[1]`: えっと…ありがと…？

### bonus_repeat.standard.earnest[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.standard.earnest[1]`: あの…気持ちは嬉しいんですが…

### bonus_repeat.standard.emotional[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.standard.emotional[1]`: …また…？（少し困った顔をしている）

### bonus_repeat.polite.shy[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.polite.shy[1]`: ま、また…？ そんな、毎回いただいては…申し訳ないです…

### bonus_repeat.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.bonus_repeat.seductive.emotional[1]`: また……っ……ふふ、こんなに優しくされたら、応えないわけにはいかないわ……

### bonus_insult.standard.normal[]

- `CARE_REACTION_DIALOGUES.bonus_insult.standard.normal[1]`: ……これが、私の値段ですか
- `CARE_REACTION_DIALOGUES.bonus_insult.standard.normal[2]`: ……お気持ちだけ、受け取っておきます

### bonus_insult.standard.bold[]

- `CARE_REACTION_DIALOGUES.bonus_insult.standard.bold[1]`: この額で私が喜ぶと思ったんですか
- `CARE_REACTION_DIALOGUES.bonus_insult.standard.bold[2]`: なめられたものね。受け取れない

### bonus_insult.standard.quiet[]

- `CARE_REACTION_DIALOGUES.bonus_insult.standard.quiet[1]`: …………（何も言わず、封筒を見つめている）

### bonus_insult.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.bonus_insult.standard.easygoing[1]`: あはは……えっと、これは……うん……

### bonus_insult.standard.earnest[]

- `CARE_REACTION_DIALOGUES.bonus_insult.standard.earnest[1]`: ……私の頑張りは、これくらいなんですね

### bonus_insult.standard.emotional[]

- `CARE_REACTION_DIALOGUES.bonus_insult.standard.emotional[1]`: え……これだけ、ですか……私って、その程度なんだ……

### bonus_insult.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.bonus_insult.ojousama.normal[1]`: まあ。……わたくし、この程度に見られていましたのね

### bonus_insult.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.bonus_insult.ojousama.bold[1]`: お断りしますわ。わたくしの価値は、この程度ではありませんの

### bonus_insult.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.bonus_insult.delinquent.normal[1]`: は？ ケチくさ。いらねーよ、こんなん

### bonus_insult.cool.normal[]

- `CARE_REACTION_DIALOGUES.bonus_insult.cool.normal[1]`: ……そう。わかった

### bonus_insult.seductive.normal[]

- `CARE_REACTION_DIALOGUES.bonus_insult.seductive.normal[1]`: あら……ずいぶん安く見られたものね

### bonus_insult.composed.normal[]

- `CARE_REACTION_DIALOGUES.bonus_insult.composed.normal[1]`: …これで済ませるつもりかい。そうか

### trainer.standard.normal[]

- `CARE_REACTION_DIALOGUES.trainer.standard.normal[1]`: 頑張ります！
- `CARE_REACTION_DIALOGUES.trainer.standard.normal[2]`: 全力で取り組みます！
- `CARE_REACTION_DIALOGUES.trainer.standard.normal[3]`: しっかり吸収します！

### trainer.standard.bold[]

- `CARE_REACTION_DIALOGUES.trainer.standard.bold[1]`: この環境を無駄にしない！絶対に結果を出す！
- `CARE_REACTION_DIALOGUES.trainer.standard.bold[2]`: 最高の後押しね！限界まで追い込むよ！

### trainer.standard.quiet[]

- `CARE_REACTION_DIALOGUES.trainer.standard.quiet[1]`: ……全力で、学びます

### trainer.standard.shy[]

- `CARE_REACTION_DIALOGUES.trainer.standard.shy[1]`: せ、専属の先生…！が、頑張ります…！

### trainer.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.trainer.standard.easygoing[1]`: マンツーマン！？ めちゃくちゃ贅沢じゃないですか！

### trainer.standard.earnest[]

- `CARE_REACTION_DIALOGUES.trainer.standard.earnest[1]`: 専属の先生がつくんですか…！もっと上手くなれます！
- `CARE_REACTION_DIALOGUES.trainer.standard.earnest[2]`: こんな機会をいただけて…全力で応えます

### trainer.standard.emotional[]

- `CARE_REACTION_DIALOGUES.trainer.standard.emotional[1]`: ええっ…！専属トレーナー…！頑張ります…！嬉しい…！

### trainer.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.trainer.ojousama.normal[1]`: 精一杯、学ばせていただきます

### trainer.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.trainer.ojousama.bold[1]`: この機会、決して無駄にはしない

### trainer.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.trainer.ojousama.earnest[1]`: こんな機会をいただけますなんて…全力でお応えしますわ

### trainer.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.trainer.delinquent.normal[1]`: おっしゃ、ガンガンやるぞ！

### trainer.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.trainer.delinquent.bold[1]`: 最高じゃん！限界まで追い込んでもらうぜ！

### trainer.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.trainer.delinquent.easygoing[1]`: マンツーマン！？ 超贅沢じゃん！

### trainer.seductive.normal[]

- `CARE_REACTION_DIALOGUES.trainer.seductive.normal[1]`: しっかり吸収させてもらうわね

### trainer.seductive.bold[]

- `CARE_REACTION_DIALOGUES.trainer.seductive.bold[1]`: この環境、無駄にしないわ。見ていてね

### trainer.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.trainer.seductive.easygoing[1]`: マンツーマンなんて贅沢ね。楽しみだわ

### trainer.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.trainer.seductive.earnest[1]`: こんな機会をもらえるなんて…全力で応えるわ

### trainer.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.trainer.seductive.emotional[1]`: トレーナーをつけてくれるの……っ……ふふ、本気で育ててくれるのね……

### trainer.composed.normal[]

- `CARE_REACTION_DIALOGUES.trainer.composed.normal[1]`: …了解。しっかり吸収するよ

### trainer.composed.bold[]

- `CARE_REACTION_DIALOGUES.trainer.composed.bold[1]`: …いい機会だね。無駄にはしないよ

### trainer.composed.earnest[]

- `CARE_REACTION_DIALOGUES.trainer.composed.earnest[1]`: …ありがたいね。全部吸収させてもらうよ

### trainer.cool.bold[]

- `CARE_REACTION_DIALOGUES.trainer.cool.bold[1]`: …ありがたい。結果を出す

### trainer.cool.quiet[]

- `CARE_REACTION_DIALOGUES.trainer.cool.quiet[1]`: …吸収する。見ていてくれ

### trainer.polite.quiet[]

- `CARE_REACTION_DIALOGUES.trainer.polite.quiet[1]`: …精一杯学ばせていただきます

### trainer.polite.shy[]

- `CARE_REACTION_DIALOGUES.trainer.polite.shy[1]`: 専属トレーナー…ですか…あ、あの、よろしくお願いいたします…

### trainer.polite.earnest[]

- `CARE_REACTION_DIALOGUES.trainer.polite.earnest[1]`: こんな機会をいただけて…全力でお応えいたします

### media.standard.normal[]

- `CARE_REACTION_DIALOGUES.media.standard.normal[1]`: よろしくお願いします！
- `CARE_REACTION_DIALOGUES.media.standard.normal[2]`: ありがとうございます！
- `CARE_REACTION_DIALOGUES.media.standard.normal[3]`: 緊張するけど…頑張ります！

### media.standard.bold[]

- `CARE_REACTION_DIALOGUES.media.standard.bold[1]`: もっと広い舞台に出たかった。ありがとう！
- `CARE_REACTION_DIALOGUES.media.standard.bold[2]`: 注目される場は大歓迎！存在感見せてあげる！

### media.standard.quiet[]

- `CARE_REACTION_DIALOGUES.media.standard.quiet[1]`: …が、頑張ります

### media.standard.shy[]

- `CARE_REACTION_DIALOGUES.media.standard.shy[1]`: え…テレビ…？ き、緊張します…で、でも頑張ります…！

### media.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.media.standard.easygoing[1]`: テレビ！？ ファンのみんな見てる〜？

### media.standard.earnest[]

- `CARE_REACTION_DIALOGUES.media.standard.earnest[1]`: うわあ、緊張する…でも頑張ります！
- `CARE_REACTION_DIALOGUES.media.standard.earnest[2]`: 団体の看板として恥ずかしくないようにします

### media.standard.emotional[]

- `CARE_REACTION_DIALOGUES.media.standard.emotional[1]`: テレビ…！？ うわあ…緊張するけど嬉しい…！頑張る…！

### media.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.media.ojousama.normal[1]`: メディアのお仕事ですの？ 精一杯務めます

### media.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.media.ojousama.bold[1]`: より広い舞台へということね。当然ね。

### media.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.media.ojousama.earnest[1]`: 団体の看板として恥ずかしくない姿をお見せしますわ

### media.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.media.delinquent.normal[1]`: テレビ？ やってやるよ！

### media.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.media.delinquent.bold[1]`: 注目されんの大歓迎！やってやるぜ！

### media.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.media.delinquent.easygoing[1]`: テレビ！？ みんな見てるー？

### media.seductive.normal[]

- `CARE_REACTION_DIALOGUES.media.seductive.normal[1]`: メディア出演…？ 楽しみだわ

### media.seductive.bold[]

- `CARE_REACTION_DIALOGUES.media.seductive.bold[1]`: 注目される場って好きよ。任せて

### media.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.media.seductive.easygoing[1]`: テレビ？ みんなに見てもらえるのね。楽しみ

### media.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.media.seductive.earnest[1]`: 緊張するけど…精一杯やるわ

### media.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.media.seductive.emotional[1]`: メディアに……っ……ふふ、私を世間に見せたいのね、いいわ……

### media.composed.normal[]

- `CARE_REACTION_DIALOGUES.media.composed.normal[1]`: …なるほど。やってみるよ

### media.composed.bold[]

- `CARE_REACTION_DIALOGUES.media.composed.bold[1]`: …いい機会だね。任せて

### media.composed.earnest[]

- `CARE_REACTION_DIALOGUES.media.composed.earnest[1]`: …いつも通りやればいいよ。大丈夫

### media.cool.bold[]

- `CARE_REACTION_DIALOGUES.media.cool.bold[1]`: …いい機会だ。結果を出す

### media.cool.quiet[]

- `CARE_REACTION_DIALOGUES.media.cool.quiet[1]`: ……やる

### media.polite.quiet[]

- `CARE_REACTION_DIALOGUES.media.polite.quiet[1]`: …緊張しますが、精一杯頑張ります

### media.polite.shy[]

- `CARE_REACTION_DIALOGUES.media.polite.shy[1]`: メ、メディア出演…ですか…き、緊張しますけど…や、やってみます…

### media.polite.earnest[]

- `CARE_REACTION_DIALOGUES.media.polite.earnest[1]`: 緊張いたしますが…精一杯務めます

### encourage.standard.normal[]

- `CARE_REACTION_DIALOGUES.encourage.standard.normal[1]`: ありがとうございます…
- `CARE_REACTION_DIALOGUES.encourage.standard.normal[2]`: もう少し、頑張ってみます
- `CARE_REACTION_DIALOGUES.encourage.standard.normal[3]`: その言葉、嬉しかったです

### encourage.standard.bold[]

- `CARE_REACTION_DIALOGUES.encourage.standard.bold[1]`: こんなところで止まってられない！次は絶対やるから！
- `CARE_REACTION_DIALOGUES.encourage.standard.bold[2]`: …分かった。まだ諦めない

### encourage.standard.quiet[]

- `CARE_REACTION_DIALOGUES.encourage.standard.quiet[1]`: ………ありがとう、ございます

### encourage.standard.shy[]

- `CARE_REACTION_DIALOGUES.encourage.standard.shy[1]`: …声をかけてもらえて…嬉しかったです…頑張ります…

### encourage.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.encourage.standard.easygoing[1]`: うわー、しんみりした！でも元気出た！やってやる！
- `CARE_REACTION_DIALOGUES.encourage.standard.easygoing[2]`: よし！やってやる！

### encourage.standard.earnest[]

- `CARE_REACTION_DIALOGUES.encourage.standard.earnest[1]`: ありがとうございます…もう一度、頑張ってみます！
- `CARE_REACTION_DIALOGUES.encourage.standard.earnest[2]`: その言葉、すごく嬉しかったです。頑張ります！

### encourage.standard.emotional[]

- `CARE_REACTION_DIALOGUES.encourage.standard.emotional[1]`: …っ！ありがとうございます…！もう一回…もう一回頑張ります…！

### encourage.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.encourage.ojousama.normal[1]`: …ありがとうございます。もう少し、頑張ってみます

### encourage.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.encourage.ojousama.bold[1]`: こんなところで終わりませんわ！

### encourage.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.encourage.ojousama.earnest[1]`: ありがとうございます…もう一度、頑張ってみますわ

### encourage.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.encourage.delinquent.normal[1]`: …サンキュ。もうちょいやってみるわ

### encourage.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.encourage.delinquent.bold[1]`: 止まってられるかよ！次は絶対やってやる！

### encourage.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.encourage.delinquent.easygoing[1]`: おっしゃ！元気出た！やってやるわ！

### encourage.seductive.normal[]

- `CARE_REACTION_DIALOGUES.encourage.seductive.normal[1]`: …ありがとう。もう少し、頑張ってみるわ

### encourage.seductive.bold[]

- `CARE_REACTION_DIALOGUES.encourage.seductive.bold[1]`: 止まるつもりはないわ。見ていてね

### encourage.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.encourage.seductive.easygoing[1]`: ふふ、元気出ちゃった。やってみるわ

### encourage.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.encourage.seductive.earnest[1]`: ありがとう…もう一度、頑張ってみるわ

### encourage.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.encourage.seductive.emotional[1]`: 励まし……っ……ふふ、その言葉だけで、力が湧いてくるの……

### encourage.composed.normal[]

- `CARE_REACTION_DIALOGUES.encourage.composed.normal[1]`: …ありがとう。もう少しやってみるよ

### encourage.composed.bold[]

- `CARE_REACTION_DIALOGUES.encourage.composed.bold[1]`: …まだ終わってないよ。やるだけやる

### encourage.composed.earnest[]

- `CARE_REACTION_DIALOGUES.encourage.composed.earnest[1]`: …その言葉、ありがたいよ。もう少し踏ん張ってみる

### encourage.cool.bold[]

- `CARE_REACTION_DIALOGUES.encourage.cool.bold[1]`: …まだ終わっていない。やる

### encourage.cool.quiet[]

- `CARE_REACTION_DIALOGUES.encourage.cool.quiet[1]`: ……分かった

### encourage.polite.quiet[]

- `CARE_REACTION_DIALOGUES.encourage.polite.quiet[1]`: …お言葉、ありがとうございます

### encourage.polite.shy[]

- `CARE_REACTION_DIALOGUES.encourage.polite.shy[1]`: あ、ありがとうございます…そう言っていただけると、頑張れます…

### encourage.polite.earnest[]

- `CARE_REACTION_DIALOGUES.encourage.polite.earnest[1]`: お言葉、ありがとうございます。もう一度頑張ります

### encourage_high_trust.standard.normal[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.normal[1]`: ずっと見てくれてたんですね…頑張ります！
- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.normal[2]`: あなたに言われると、本当に力が出ます！

### encourage_high_trust.standard.bold[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.bold[1]`: 信じてくれるなら、絶対やるよ！
- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.bold[2]`: 期待には必ず応える！

### encourage_high_trust.standard.quiet[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.quiet[1]`: ……ずっと、見てくれてたんですね

### encourage_high_trust.standard.shy[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.shy[1]`: ずっと…見てくれてたんですか…？ わ、私…頑張ります…！

### encourage_high_trust.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.easygoing[1]`: えへへ…見てくれてたんだ。もうちょっと頑張ろうかな！

### encourage_high_trust.standard.earnest[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.earnest[1]`: あなたに言われると、本当に力が出ます！もっと頑張れます！
- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.earnest[2]`: ずっと見てくれてたんですね…絶対に報いてみせます

### encourage_high_trust.standard.emotional[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.standard.emotional[1]`: …っ！ずっと見てくれてたんですね…！泣いちゃう…でも頑張る…！

### encourage_high_trust.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.ojousama.normal[1]`: ずっと見守ってくださったんですのね…その気持ちに、お応えしなくては

### encourage_high_trust.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.ojousama.bold[1]`: あなたが信じているなら、応えてあげませんとね？

### encourage_high_trust.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.ojousama.earnest[1]`: ずっと見てくださったんですのね…お報いしますわ

### encourage_high_trust.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.delinquent.normal[1]`: …アンタに言われると、やんなきゃって思うんだよ

### encourage_high_trust.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.delinquent.bold[1]`: アンタが信じてくれんなら、やってやるよ！

### encourage_high_trust.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.delinquent.easygoing[1]`: 見てくれてたんだ？ じゃ、もうちょいやるか！

### encourage_high_trust.seductive.normal[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.seductive.normal[1]`: ずっと見てくれてたのね…嬉しい。頑張るわ

### encourage_high_trust.seductive.bold[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.seductive.bold[1]`: あなたが信じてくれるなら…絶対応えるわ

### encourage_high_trust.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.seductive.easygoing[1]`: 見てくれてたのね。嬉しいわ。もう少し頑張ってみるわ

### encourage_high_trust.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.seductive.earnest[1]`: ずっと見てくれてたのね…絶対に報いるわ

### encourage_high_trust.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.seductive.emotional[1]`: あなたの言葉だけで……っ……私、何でもできちゃいそうなの……ふふ……

### encourage_high_trust.composed.normal[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.composed.normal[1]`: …見てくれてたんだ。…悪くないね

### encourage_high_trust.composed.bold[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.composed.bold[1]`: …信じてくれるなら、応えないとね

### encourage_high_trust.composed.earnest[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.composed.earnest[1]`: …ずっと見てくれてたんだ。…ありがとう。応えるよ

### encourage_high_trust.cool.bold[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.cool.bold[1]`: …信じてくれるなら、応える

### encourage_high_trust.cool.quiet[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.cool.quiet[1]`: …分かった。応える

### encourage_high_trust.polite.quiet[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.polite.quiet[1]`: …ずっと見守ってくださったんですね。お応えします

### encourage_high_trust.polite.shy[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.polite.shy[1]`: いつも気にかけてくださって…あ、あの、本当に感謝しています…

### encourage_high_trust.polite.earnest[]

- `CARE_REACTION_DIALOGUES.encourage_high_trust.polite.earnest[1]`: ずっと見守ってくださったんですね…必ずお報いいたします

### refresh_leave.standard.normal[]

- `CARE_REACTION_DIALOGUES.refresh_leave.standard.normal[1]`: ありがとうございます！行ってきます！
- `CARE_REACTION_DIALOGUES.refresh_leave.standard.normal[2]`: ゆっくり休んで戻ってきます！
- `CARE_REACTION_DIALOGUES.refresh_leave.standard.normal[3]`: ありがとうございます…少し、休みます

### refresh_leave.standard.bold[]

- `CARE_REACTION_DIALOGUES.refresh_leave.standard.bold[1]`: リフレッシュして、もっと上を目指す！
- `CARE_REACTION_DIALOGUES.refresh_leave.standard.bold[2]`: 充電して戻ってくる！

### refresh_leave.standard.quiet[]

- `CARE_REACTION_DIALOGUES.refresh_leave.standard.quiet[1]`: …少し、休みます。ありがとうございます

### refresh_leave.standard.shy[]

- `CARE_REACTION_DIALOGUES.refresh_leave.standard.shy[1]`: あの…休んでいいんですか…？ ありがとうございます…

### refresh_leave.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.refresh_leave.standard.easygoing[1]`: やった！バカンスだ！でも戻ったら本気出します！

### refresh_leave.standard.earnest[]

- `CARE_REACTION_DIALOGUES.refresh_leave.standard.earnest[1]`: え…でも練習が…でも、ありがとうございます！
- `CARE_REACTION_DIALOGUES.refresh_leave.standard.earnest[2]`: …そんなに気にかけてもらえるとは。ありがとうございます

### refresh_leave.standard.emotional[]

- `CARE_REACTION_DIALOGUES.refresh_leave.standard.emotional[1]`: 休んでいいんですか…？ ありがとうございます…リフレッシュしてきます…！

### refresh_leave.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.refresh_leave.ojousama.normal[1]`: ありがとうございます。リフレッシュして戻って参ります

### refresh_leave.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.refresh_leave.ojousama.bold[1]`: すこし休んでまいりますわ。ごめんあそばせ。

### refresh_leave.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.refresh_leave.ojousama.earnest[1]`: 練習のことが気になりますけれど…お心遣い、ありがとうございますわ

### refresh_leave.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.refresh_leave.delinquent.normal[1]`: サンキュ！ちょっと休んでくるわ

### refresh_leave.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.refresh_leave.delinquent.bold[1]`: 充電してくる！戻ったら全開だぜ！

### refresh_leave.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.refresh_leave.delinquent.easygoing[1]`: バカンスだー！戻ったら本気出すから！

### refresh_leave.seductive.normal[]

- `CARE_REACTION_DIALOGUES.refresh_leave.seductive.normal[1]`: ありがとう。リフレッシュしてくるわね

### refresh_leave.seductive.bold[]

- `CARE_REACTION_DIALOGUES.refresh_leave.seductive.bold[1]`: リフレッシュしてくるわ。戻ったらもっと輝くから

### refresh_leave.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.refresh_leave.seductive.easygoing[1]`: バカンスね。リフレッシュして戻るわ

### refresh_leave.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.refresh_leave.seductive.earnest[1]`: 練習が気になるけど…ありがとう。休んでくるわ

### refresh_leave.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.refresh_leave.seductive.emotional[1]`: 休暇……っ……気を遣ってくれたのね、ふふ、嬉しいわ……

### refresh_leave.composed.normal[]

- `CARE_REACTION_DIALOGUES.refresh_leave.composed.normal[1]`: …ありがとう。少し休んでくるよ

### refresh_leave.composed.bold[]

- `CARE_REACTION_DIALOGUES.refresh_leave.composed.bold[1]`: …充電してくるよ。戻ったらまた行こう

### refresh_leave.composed.earnest[]

- `CARE_REACTION_DIALOGUES.refresh_leave.composed.earnest[1]`: …まあ、たまには休むのも大事だよね。ありがとう

### refresh_leave.cool.bold[]

- `CARE_REACTION_DIALOGUES.refresh_leave.cool.bold[1]`: …充電してくる。戻ったら結果を出す

### refresh_leave.cool.quiet[]

- `CARE_REACTION_DIALOGUES.refresh_leave.cool.quiet[1]`: …感謝する。少し休む

### refresh_leave.polite.quiet[]

- `CARE_REACTION_DIALOGUES.refresh_leave.polite.quiet[1]`: …ありがとうございます。少し休ませていただきます

### refresh_leave.polite.shy[]

- `CARE_REACTION_DIALOGUES.refresh_leave.polite.shy[1]`: お休みを…？ あ、あの…ありがとうございます、ゆっくり休ませていただきます…

### refresh_leave.polite.earnest[]

- `CARE_REACTION_DIALOGUES.refresh_leave.polite.earnest[1]`: 練習が気になりますが…お気遣いありがとうございます

### special_treatment.standard.normal[]

- `CARE_REACTION_DIALOGUES.special_treatment.standard.normal[1]`: 専門の先生まで…ありがとうございます。早く戻ります
- `CARE_REACTION_DIALOGUES.special_treatment.standard.normal[2]`: こんなに気にかけていただけるなんて…必ず復帰します

### special_treatment.standard.bold[]

- `CARE_REACTION_DIALOGUES.special_treatment.standard.bold[1]`: 早く戻る…！ こんなとこで止まってられない！
- `CARE_REACTION_DIALOGUES.special_treatment.standard.bold[2]`: すぐ治します！次の試合は絶対ものにする！

### special_treatment.standard.quiet[]

- `CARE_REACTION_DIALOGUES.special_treatment.standard.quiet[1]`: …ありがとうございます。早く、戻ります

### special_treatment.standard.shy[]

- `CARE_REACTION_DIALOGUES.special_treatment.standard.shy[1]`: すみません…ご迷惑をおかけして…必ず、戻ります…

### special_treatment.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.special_treatment.standard.easygoing[1]`: うわ、専門医まで…！ 早く戻りますね〜！

### special_treatment.standard.earnest[]

- `CARE_REACTION_DIALOGUES.special_treatment.standard.earnest[1]`: こんなに気にかけてもらえるなんて…必ず期待に応えます
- `CARE_REACTION_DIALOGUES.special_treatment.standard.earnest[2]`: …私のためにここまで…早く戻って、結果でお返しします

### special_treatment.standard.emotional[]

- `CARE_REACTION_DIALOGUES.special_treatment.standard.emotional[1]`: …っ、こんなにしてもらって…っ、絶対早く戻ります…！

### special_treatment.polite.normal[]

- `CARE_REACTION_DIALOGUES.special_treatment.polite.normal[1]`: ご丁寧な治療を…ありがとうございます。一日でも早く戻ります

### special_treatment.polite.quiet[]

- `CARE_REACTION_DIALOGUES.special_treatment.polite.quiet[1]`: …そんなに気遣っていただいて。早く戻ります

### special_treatment.polite.shy[]

- `CARE_REACTION_DIALOGUES.special_treatment.polite.shy[1]`: こ、こんな特別扱い…わたしなんかに、もったいないです…

### special_treatment.polite.earnest[]

- `CARE_REACTION_DIALOGUES.special_treatment.polite.earnest[1]`: …ご厚意に甘えます。必ず復帰してお返しいたします

### special_treatment.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.special_treatment.ojousama.normal[1]`: まあ…そこまでしてくださるなんて。早く戻りますわ

### special_treatment.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.special_treatment.ojousama.bold[1]`: すぐ戻ります。待っていなさいな。

### special_treatment.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.special_treatment.ojousama.earnest[1]`: そこまでお気遣いを…必ずや復帰してお応えしますわ

### special_treatment.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.special_treatment.delinquent.normal[1]`: サンキュ。早く治してリング戻るわ

### special_treatment.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.special_treatment.delinquent.bold[1]`: しゃあ！すぐ治して暴れに戻るぜ！

### special_treatment.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.special_treatment.delinquent.easygoing[1]`: マジか！すぐ治してくる！

### special_treatment.seductive.normal[]

- `CARE_REACTION_DIALOGUES.special_treatment.seductive.normal[1]`: ありがとう。早く戻れるように頑張るわ

### special_treatment.seductive.bold[]

- `CARE_REACTION_DIALOGUES.special_treatment.seductive.bold[1]`: 早く戻りたいの…待っていてね

### special_treatment.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.special_treatment.seductive.easygoing[1]`: ふふ、こんなに大事にされたら、頑張らなきゃ

### special_treatment.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.special_treatment.seductive.earnest[1]`: ありがとう…早く戻れるように頑張るわ

### special_treatment.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.special_treatment.seductive.emotional[1]`: そこまで…してくれるの…っ、嬉しい……早く戻るわ……

### special_treatment.composed.normal[]

- `CARE_REACTION_DIALOGUES.special_treatment.composed.normal[1]`: …ありがとう。リング、待たせちゃ悪いね

### special_treatment.composed.bold[]

- `CARE_REACTION_DIALOGUES.special_treatment.composed.bold[1]`: …早く戻るよ。ありがとう

### special_treatment.composed.earnest[]

- `CARE_REACTION_DIALOGUES.special_treatment.composed.earnest[1]`: …そこまでしてくれるんだ。早く戻って返すよ

### special_treatment.cool.bold[]

- `CARE_REACTION_DIALOGUES.special_treatment.cool.bold[1]`: …無駄にはしない。すぐ戻る

### special_treatment.cool.quiet[]

- `CARE_REACTION_DIALOGUES.special_treatment.cool.quiet[1]`: …感謝する。早く戻る

### party.standard.normal[]

- `CARE_REACTION_DIALOGUES.party.standard.normal[1]`: お疲れ様でした〜！
- `CARE_REACTION_DIALOGUES.party.standard.normal[2]`: みんなで楽しく過ごせました！
- `CARE_REACTION_DIALOGUES.party.standard.normal[3]`: こういう時間、いいですね！
- `CARE_REACTION_DIALOGUES.party.standard.normal[4]`: リフレッシュできました！

### party.standard.bold[]

- `CARE_REACTION_DIALOGUES.party.standard.bold[1]`: 楽しいけど…次の興行ではもっと結果を出す！
- `CARE_REACTION_DIALOGUES.party.standard.bold[2]`: いい雰囲気。チームが強くなってる証拠だね

### party.standard.quiet[]

- `CARE_REACTION_DIALOGUES.party.standard.quiet[1]`: ……楽しかったです（小さく微笑んでいる）

### party.standard.shy[]

- `CARE_REACTION_DIALOGUES.party.standard.shy[1]`: あ、あの…楽しかった、です…（隅で小さく笑っている）

### party.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.party.standard.easygoing[1]`: カンパーイ！！ 今日は無礼講だ〜！
- `CARE_REACTION_DIALOGUES.party.standard.easygoing[2]`: もう一軒行きましょうよ〜！

### party.standard.earnest[]

- `CARE_REACTION_DIALOGUES.party.standard.earnest[1]`: みんなお疲れ様でした！明日からまた頑張ります！
- `CARE_REACTION_DIALOGUES.party.standard.earnest[2]`: こうしてみんなで集まれるのが嬉しいです

### party.standard.emotional[]

- `CARE_REACTION_DIALOGUES.party.standard.emotional[1]`: みんな〜！楽しい〜！大好き〜！
- `CARE_REACTION_DIALOGUES.party.standard.emotional[2]`: こういう時間…最高だよ…！

### party.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.party.ojousama.normal[1]`: 楽しいお時間でしたわ。それでは、ごきげんよう

### party.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.party.ojousama.bold[1]`: 皆様の頑張りを、誇りに思いますわ

### party.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.party.ojousama.earnest[1]`: 皆様、お疲れ様ですわ。明日からまた頑張りましょうね

### party.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.party.delinquent.normal[1]`: いえーい！カンパーイ！

### party.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.party.delinquent.bold[1]`: カンパーイ！！ 今日は無礼講だ〜！

### party.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.party.delinquent.easygoing[1]`: うぇーい！飲むぞ〜！

### party.seductive.normal[]

- `CARE_REACTION_DIALOGUES.party.seductive.normal[1]`: 楽しかったわ。こういう時間もいいわね

### party.seductive.bold[]

- `CARE_REACTION_DIALOGUES.party.seductive.bold[1]`: いい雰囲気ね。チームが成長してる証拠だわ

### party.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.party.seductive.easygoing[1]`: ふふ、みんないい顔してるわね

### party.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.party.seductive.earnest[1]`: お疲れ様。また明日から頑張りましょうね

### party.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.party.seductive.emotional[1]`: パーティー……っ……ふふ、今夜は思いっきり楽しませてもらうわ……

### party.composed.normal[]

- `CARE_REACTION_DIALOGUES.party.composed.normal[1]`: …いい時間だったね。悪くないよ

### party.composed.bold[]

- `CARE_REACTION_DIALOGUES.party.composed.bold[1]`: …いい雰囲気だね。こういうのも大事だよ

### party.composed.earnest[]

- `CARE_REACTION_DIALOGUES.party.composed.earnest[1]`: …お疲れ様。こういう時間があるから、また頑張れるね

### party.cool.bold[]

- `CARE_REACTION_DIALOGUES.party.cool.bold[1]`: …悪くない時間だった

### party.cool.quiet[]

- `CARE_REACTION_DIALOGUES.party.cool.quiet[1]`: …悪くなかった

### party.polite.quiet[]

- `CARE_REACTION_DIALOGUES.party.polite.quiet[1]`: …楽しいお時間でした。ありがとうございます

### party.polite.shy[]

- `CARE_REACTION_DIALOGUES.party.polite.shy[1]`: パ、パーティー…人が多いところは少し苦手ですけど…頑張って参加します…

### party.polite.earnest[]

- `CARE_REACTION_DIALOGUES.party.polite.earnest[1]`: 皆様、お疲れ様でした。明日からまた頑張りましょう

### camp.standard.normal[]

- `CARE_REACTION_DIALOGUES.camp.standard.normal[1]`: しっかり鍛えてきます！
- `CARE_REACTION_DIALOGUES.camp.standard.normal[2]`: 頑張ります！
- `CARE_REACTION_DIALOGUES.camp.standard.normal[3]`: 良い合宿にしましょう！
- `CARE_REACTION_DIALOGUES.camp.standard.normal[4]`: 楽しみです！全力で取り組みます！

### camp.standard.bold[]

- `CARE_REACTION_DIALOGUES.camp.standard.bold[1]`: ライバルに差をつけるチャンスだね！
- `CARE_REACTION_DIALOGUES.camp.standard.bold[2]`: 合宿から帰る頃には一回り強くなってやる！

### camp.standard.quiet[]

- `CARE_REACTION_DIALOGUES.camp.standard.quiet[1]`: ……頑張ります

### camp.standard.shy[]

- `CARE_REACTION_DIALOGUES.camp.standard.shy[1]`: が、合宿…！ が、頑張ります…！

### camp.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.camp.standard.easygoing[1]`: うおー！！合宿だ！楽しみ！
- `CARE_REACTION_DIALOGUES.camp.standard.easygoing[2]`: 夜は枕投げだ！…嘘です、練習します

### camp.standard.earnest[]

- `CARE_REACTION_DIALOGUES.camp.standard.earnest[1]`: やった！思い切り練習できる！
- `CARE_REACTION_DIALOGUES.camp.standard.earnest[2]`: 合宿の間に絶対レベルアップしてみせます！
- `CARE_REACTION_DIALOGUES.camp.standard.earnest[3]`: みんなで一緒に強くなれるなんて…最高です

### camp.standard.emotional[]

- `CARE_REACTION_DIALOGUES.camp.standard.emotional[1]`: 合宿…！みんなで強くなれる…！最高だよ…！

### camp.ojousama.normal[]

- `CARE_REACTION_DIALOGUES.camp.ojousama.normal[1]`: 合宿ですの？ 精一杯取り組みますわ

### camp.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.camp.ojousama.bold[1]`: この合宿で一段上へ参りましょう

### camp.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.camp.ojousama.earnest[1]`: みっちり鍛えていただきますわ！絶対に成長してみせますの

### camp.delinquent.normal[]

- `CARE_REACTION_DIALOGUES.camp.delinquent.normal[1]`: 合宿！ ガンガンやるぞ！

### camp.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.camp.delinquent.bold[1]`: やってやるぜ！帰る頃には別人だ！

### camp.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.camp.delinquent.easygoing[1]`: 合宿だー！ 盛り上がっていくぞー！

### camp.seductive.normal[]

- `CARE_REACTION_DIALOGUES.camp.seductive.normal[1]`: 合宿ね。しっかり鍛えるわ

### camp.seductive.bold[]

- `CARE_REACTION_DIALOGUES.camp.seductive.bold[1]`: 帰る頃には一回り強くなってるわよ

### camp.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.camp.seductive.easygoing[1]`: 合宿楽しみ〜。みんなで頑張りましょ

### camp.seductive.earnest[]

- `CARE_REACTION_DIALOGUES.camp.seductive.earnest[1]`: 思い切り鍛えられるのね。楽しみだわ

### camp.seductive.emotional[]

- `CARE_REACTION_DIALOGUES.camp.seductive.emotional[1]`: 合宿……っ……ふふ、みんなと一緒に過ごせるのね、楽しみ……

### camp.composed.normal[]

- `CARE_REACTION_DIALOGUES.camp.composed.normal[1]`: …合宿か。じっくりやろう

### camp.composed.bold[]

- `CARE_REACTION_DIALOGUES.camp.composed.bold[1]`: …いい機会だね。しっかり追い込むよ

### camp.composed.earnest[]

- `CARE_REACTION_DIALOGUES.camp.composed.earnest[1]`: …みんなでやれるのはいいね。じっくり行こう

### camp.cool.bold[]

- `CARE_REACTION_DIALOGUES.camp.cool.bold[1]`: …鍛えさせてもらう。結果を出す

### camp.cool.quiet[]

- `CARE_REACTION_DIALOGUES.camp.cool.quiet[1]`: …追い込む

### camp.polite.quiet[]

- `CARE_REACTION_DIALOGUES.camp.polite.quiet[1]`: …精一杯、取り組みます

### camp.polite.shy[]

- `CARE_REACTION_DIALOGUES.camp.polite.shy[1]`: が、合宿…ですか…緊張しますけど…頑張ります…！

### camp.polite.earnest[]

- `CARE_REACTION_DIALOGUES.camp.polite.earnest[1]`: 全力で取り組ませていただきます。レベルアップしてみせます

### faction_decree.standard._default[]

- `CARE_REACTION_DIALOGUES.faction_decree.standard._default[1]`: ……わかりました。社長がそう言うなら
- `CARE_REACTION_DIALOGUES.faction_decree.standard._default[2]`: あれは、ただ集まっていただけなのに
- `CARE_REACTION_DIALOGUES.faction_decree.standard._default[3]`: ……解散、ですか。……はい

### faction_decree.standard.bold[]

- `CARE_REACTION_DIALOGUES.faction_decree.standard.bold[1]`: あれは徒党じゃない。私が呼んで、集まってくれた仲間です
- `CARE_REACTION_DIALOGUES.faction_decree.standard.bold[2]`: 納得はしていません。それでも、従います

### faction_decree.standard.emotional[]

- `CARE_REACTION_DIALOGUES.faction_decree.standard.emotional[1]`: どうして…！ 私、何か間違えましたか…！
- `CARE_REACTION_DIALOGUES.faction_decree.standard.emotional[2]`: みんな、私を信じてついてきてくれたのに…

### faction_decree.standard.quiet[]

- `CARE_REACTION_DIALOGUES.faction_decree.standard.quiet[1]`: ……そう、ですか
- `CARE_REACTION_DIALOGUES.faction_decree.standard.quiet[2]`: ……はい。わかりました

### faction_decree.standard.earnest[]

- `CARE_REACTION_DIALOGUES.faction_decree.standard.earnest[1]`: 私のやり方が、間違っていたということでしょうか
- `CARE_REACTION_DIALOGUES.faction_decree.standard.earnest[2]`: ……もっと、うまくやれたはずでした

### faction_decree.standard.easygoing[]

- `CARE_REACTION_DIALOGUES.faction_decree.standard.easygoing[1]`: ……まあ、決まったなら仕方ないですね
- `CARE_REACTION_DIALOGUES.faction_decree.standard.easygoing[2]`: あーあ。楽しかったんですけどね

### faction_decree.standard.shy[]

- `CARE_REACTION_DIALOGUES.faction_decree.standard.shy[1]`: ……あの、わたし……はい、わかりました
- `CARE_REACTION_DIALOGUES.faction_decree.standard.shy[2]`: ……ごめんなさい。うまく、言えなくて

### faction_decree.composed._default[]

- `CARE_REACTION_DIALOGUES.faction_decree.composed._default[1]`: ……そう。決めたのなら、それでいいよ
- `CARE_REACTION_DIALOGUES.faction_decree.composed._default[2]`: ま、いつかこうなる気はしてた。従うよ

### faction_decree.composed.bold[]

- `CARE_REACTION_DIALOGUES.faction_decree.composed.bold[1]`: ……納得はしていない。それだけは言っておくよ

### faction_decree.composed.emotional[]

- `CARE_REACTION_DIALOGUES.faction_decree.composed.emotional[1]`: ……参ったな。これは、こたえるよ

### faction_decree.composed.quiet[]

- `CARE_REACTION_DIALOGUES.faction_decree.composed.quiet[1]`: ……そうか

### faction_decree.composed.earnest[]

- `CARE_REACTION_DIALOGUES.faction_decree.composed.earnest[1]`: ……どこで間違えたのかは、自分で考えるよ

### faction_decree.composed.easygoing[]

- `CARE_REACTION_DIALOGUES.faction_decree.composed.easygoing[1]`: ま、そういうこともあるさ。またどこかで

### faction_decree.ojousama._default[]

- `CARE_REACTION_DIALOGUES.faction_decree.ojousama._default[1]`: ……承知いたしました。異は申しません
- `CARE_REACTION_DIALOGUES.faction_decree.ojousama._default[2]`: わたくしの一存で始めたこと。畳むのも同じでしょう

### faction_decree.ojousama.bold[]

- `CARE_REACTION_DIALOGUES.faction_decree.ojousama.bold[1]`: 納得はしておりません。そこだけは、申し上げておきます

### faction_decree.ojousama.emotional[]

- `CARE_REACTION_DIALOGUES.faction_decree.ojousama.emotional[1]`: なぜですの……。あの子たちに、何と言えばよいのです

### faction_decree.ojousama.quiet[]

- `CARE_REACTION_DIALOGUES.faction_decree.ojousama.quiet[1]`: …………承知しました

### faction_decree.ojousama.earnest[]

- `CARE_REACTION_DIALOGUES.faction_decree.ojousama.earnest[1]`: わたくしの不徳の致すところ、ということですわね

### faction_decree.polite._default[]

- `CARE_REACTION_DIALOGUES.faction_decree.polite._default[1]`: ……はい。皆には、私から伝えます

### faction_decree.polite.bold[]

- `CARE_REACTION_DIALOGUES.faction_decree.polite.bold[1]`: 従います。ですが、間違っているとは思っていません

### faction_decree.polite.emotional[]

- `CARE_REACTION_DIALOGUES.faction_decree.polite.emotional[1]`: どうして……。皆に、なんてお伝えすれば

### faction_decree.polite.earnest[]

- `CARE_REACTION_DIALOGUES.faction_decree.polite.earnest[1]`: 私の至らなさです。申し訳ありませんでした

### faction_decree.polite.shy[]

- `CARE_REACTION_DIALOGUES.faction_decree.polite.shy[1]`: ……あの。皆には、わたしから……

### faction_decree.seductive._default[]

- `CARE_REACTION_DIALOGUES.faction_decree.seductive._default[1]`: ……ふぅん。ずいぶん急なお話ね
- `CARE_REACTION_DIALOGUES.faction_decree.seductive._default[2]`: あら。目障りだったのかしら

### faction_decree.seductive.bold[]

- `CARE_REACTION_DIALOGUES.faction_decree.seductive.bold[1]`: いいわ、畳みましょう。……でも、覚えておいて

### faction_decree.seductive.easygoing[]

- `CARE_REACTION_DIALOGUES.faction_decree.seductive.easygoing[1]`: あら残念。いい集まりだったのに

### faction_decree.delinquent._default[]

- `CARE_REACTION_DIALOGUES.faction_decree.delinquent._default[1]`: ……はぁ？ なんだよ、それ
- `CARE_REACTION_DIALOGUES.faction_decree.delinquent._default[2]`: ちっ……好きにしろよ

### faction_decree.delinquent.bold[]

- `CARE_REACTION_DIALOGUES.faction_decree.delinquent.bold[1]`: ふざけんな。あそこは、私らの場所だっただろ

### faction_decree.delinquent.emotional[]

- `CARE_REACTION_DIALOGUES.faction_decree.delinquent.emotional[1]`: なんでだよ……！ 誰にも迷惑かけてねぇだろ！

### faction_decree.delinquent.easygoing[]

- `CARE_REACTION_DIALOGUES.faction_decree.delinquent.easygoing[1]`: えー。せっかく楽しくやってたのに

### faction_decree.cool._default[]

- `CARE_REACTION_DIALOGUES.faction_decree.cool._default[1]`: ……了解
- `CARE_REACTION_DIALOGUES.faction_decree.cool._default[2]`: ……理由くらい、聞きたかった

### faction_decree.cool.bold[]

- `CARE_REACTION_DIALOGUES.faction_decree.cool.bold[1]`: ……従う。納得はしない

### faction_decree.cool.emotional[]

- `CARE_REACTION_DIALOGUES.faction_decree.cool.emotional[1]`: ……勝手にしろ

### faction_decree.cool.shy[]

- `CARE_REACTION_DIALOGUES.faction_decree.cool.shy[1]`: ……別に

### faction_decree_seal_quiet._default.standard[]

- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.standard[1]`: えっと……つまり、徒党を組むなということですか？
- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.standard[2]`: そういう話、別に出ていなかったですけど……
- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.standard[3]`: ……はい。心得ておきます

### faction_decree_seal_quiet._default.composed[]

- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.composed[1]`: ……了解。そういう決まりなら、それで

### faction_decree_seal_quiet._default.ojousama[]

- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.ojousama[1]`: まあ。そのようなお達しが出るとは思いませんでした

### faction_decree_seal_quiet._default.polite[]

- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.polite[1]`: 承知しました。皆にも伝えておきます

### faction_decree_seal_quiet._default.seductive[]

- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.seductive[1]`: あら。ずいぶん用心深いのね

### faction_decree_seal_quiet._default.delinquent[]

- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.delinquent[1]`: つるむなってこと？ 別にいいけどさ

### faction_decree_seal_quiet._default.cool[]

- `CARE_REACTION_DIALOGUES.faction_decree_seal_quiet._default.cool[1]`: ……わかった

### faction_decree_unseal._default.standard[]

- `CARE_REACTION_DIALOGUES.faction_decree_unseal._default.standard[1]`: え、いいんですか？ ……はい、ありがとうございます
- `CARE_REACTION_DIALOGUES.faction_decree_unseal._default.standard[2]`: ……そうですか。元通り、ということですね

### faction_decree_unseal._default.composed[]

- `CARE_REACTION_DIALOGUES.faction_decree_unseal._default.composed[1]`: ……そう。好きにしていい、ということか

### faction_decree_unseal._default.ojousama[]

- `CARE_REACTION_DIALOGUES.faction_decree_unseal._default.ojousama[1]`: あら。お心変わりですの

### faction_decree_unseal._default.polite[]

- `CARE_REACTION_DIALOGUES.faction_decree_unseal._default.polite[1]`: かしこまりました。皆に伝えます

### faction_decree_unseal._default.seductive[]

- `CARE_REACTION_DIALOGUES.faction_decree_unseal._default.seductive[1]`: ふふ。気が変わったのね

### faction_decree_unseal._default.delinquent[]

- `CARE_REACTION_DIALOGUES.faction_decree_unseal._default.delinquent[1]`: へえ。急にどうしたんだよ

### faction_decree_unseal._default.cool[]

- `CARE_REACTION_DIALOGUES.faction_decree_unseal._default.cool[1]`: ……了解

## `CHOICE_EVENT_DIALOGUES`

- 出典: `src/data.js`
- コード内コメント: §3-3: 選択型イベントセリフ（S1〜S6, E1〜E6）— personality×archetype
- 本数: 603

- `CHOICE_EVENT_DIALOGUES.S1.cool.normal[1]`: …タイトル戦を。組んでほしい
- `CHOICE_EVENT_DIALOGUES.S1.cool.bold[1]`: …ベルトが欲しい。組んでくれ
- `CHOICE_EVENT_DIALOGUES.S1.cool.quiet[1]`: …タイトルマッチを。頼む
- `CHOICE_EVENT_DIALOGUES.S1.cool.shy[1]`: …あの。…タイトル、挑戦したい
- `CHOICE_EVENT_DIALOGUES.S1.cool.easygoing[1]`: …ベルトが欲しい。組んでくれ
- `CHOICE_EVENT_DIALOGUES.S1.cool.easygoing[2]`: …タイトル戦。やらせてほしい
- `CHOICE_EVENT_DIALOGUES.S1.cool.earnest[1]`: …準備はできてる。機会をくれ
- `CHOICE_EVENT_DIALOGUES.S1.cool.earnest[2]`: …タイトル戦に、挑ませてほしい
- `CHOICE_EVENT_DIALOGUES.S1.cool.emotional[1]`: …頼む。ベルトに、挑ませてくれ
- `CHOICE_EVENT_DIALOGUES.S1.standard.normal[1]`: タイトルマッチの機会をいただけませんか？
- `CHOICE_EVENT_DIALOGUES.S1.standard.bold[1]`: チャンピオンの座が欲しい。今すぐ組んでよ
- `CHOICE_EVENT_DIALOGUES.S1.standard.bold[2]`: ベルトを賭けた試合がしたい！
- `CHOICE_EVENT_DIALOGUES.S1.standard.quiet[1]`: ……挑戦させてください
- `CHOICE_EVENT_DIALOGUES.S1.standard.shy[1]`: あ、あの…タイトルマッチ…挑戦させてもらえませんか…？
- `CHOICE_EVENT_DIALOGUES.S1.standard.easygoing[1]`: ねえねえ、タイトルマッチ組んでよ！
- `CHOICE_EVENT_DIALOGUES.S1.standard.easygoing[2]`: ベルト欲しいなー。挑戦させてくれない？
- `CHOICE_EVENT_DIALOGUES.S1.standard.earnest[1]`: ずっと準備してきました…チャンスをください
- `CHOICE_EVENT_DIALOGUES.S1.standard.earnest[2]`: タイトルマッチに挑ませてください！
- `CHOICE_EVENT_DIALOGUES.S1.standard.emotional[1]`: お願いします…！タイトルマッチに挑ませてください…！
- `CHOICE_EVENT_DIALOGUES.S1.ojousama.normal[1]`: 王座への挑戦をお許しいただけませんこと？
- `CHOICE_EVENT_DIALOGUES.S1.ojousama.bold[1]`: チャンピオンの座、いただきに参りましょう
- `CHOICE_EVENT_DIALOGUES.S1.ojousama.quiet[1]`: ……あの。わたくしに、挑戦の機会を
- `CHOICE_EVENT_DIALOGUES.S1.ojousama.shy[1]`: あの…わたくし…その、ベルトに…挑戦させていただけませんか…
- `CHOICE_EVENT_DIALOGUES.S1.ojousama.earnest[1]`: ずっと準備してまいりましたの。チャンスをいただけませんこと
- `CHOICE_EVENT_DIALOGUES.S1.ojousama.emotional[1]`: お願いします…！わたくしに、ベルトへ挑む機会を…！
- `CHOICE_EVENT_DIALOGUES.S1.delinquent.normal[1]`: タイトルマッチ、組んでくれよ
- `CHOICE_EVENT_DIALOGUES.S1.delinquent.bold[1]`: ベルトよこせ！今すぐ組め！
- `CHOICE_EVENT_DIALOGUES.S1.delinquent.quiet[1]`: ……ベルト、挑ませてくれ。頼む
- `CHOICE_EVENT_DIALOGUES.S1.delinquent.shy[1]`: あの…その…タイトル、挑ませてもらえないっすか…
- `CHOICE_EVENT_DIALOGUES.S1.delinquent.easygoing[1]`: タイトルマッチ組めよ！やる気あんだからさ！
- `CHOICE_EVENT_DIALOGUES.S1.delinquent.earnest[1]`: ずっと準備してきたんだ。チャンスをくれよ
- `CHOICE_EVENT_DIALOGUES.S1.delinquent.earnest[2]`: タイトル戦、挑ませてくれ。本気で頼む
- `CHOICE_EVENT_DIALOGUES.S1.delinquent.emotional[1]`: 頼む…！タイトル戦、挑ませてくれ…！
- `CHOICE_EVENT_DIALOGUES.S1.seductive.normal[1]`: タイトルマッチの機会、いただけないかしら
- `CHOICE_EVENT_DIALOGUES.S1.seductive.bold[1]`: ベルトが欲しいの。組んでもらえる？
- `CHOICE_EVENT_DIALOGUES.S1.seductive.shy[1]`: あの…笑わないで聞いてほしいの…ベルト、挑ませてもらえない…？
- `CHOICE_EVENT_DIALOGUES.S1.seductive.easygoing[1]`: ベルト、欲しくなっちゃった。挑戦させてくれない？
- `CHOICE_EVENT_DIALOGUES.S1.seductive.earnest[1]`: ずっと準備してきたの。チャンスをちょうだい
- `CHOICE_EVENT_DIALOGUES.S1.seductive.emotional[1]`: ねえ……っ……ちょっと、聞いてほしいの……
- `CHOICE_EVENT_DIALOGUES.S1.composed.normal[1]`: …そろそろベルトに挑戦させてもらえないかな
- `CHOICE_EVENT_DIALOGUES.S1.composed.bold[1]`: …ベルト、狙わせてもらうよ。組んでくれる？
- `CHOICE_EVENT_DIALOGUES.S1.composed.quiet[1]`: ……挑戦、させてほしい。それだけ
- `CHOICE_EVENT_DIALOGUES.S1.composed.shy[1]`: …言い出しにくいんだけど。…ベルトに、挑戦させてもらえないかな
- `CHOICE_EVENT_DIALOGUES.S1.composed.easygoing[1]`: …ねえ、タイトル戦って組めないかな
- `CHOICE_EVENT_DIALOGUES.S1.composed.easygoing[2]`: …ベルト、ちょっと欲しくなってさ。挑ませてよ
- `CHOICE_EVENT_DIALOGUES.S1.composed.earnest[1]`: …準備はできてる。あとはチャンスだけだよ
- `CHOICE_EVENT_DIALOGUES.S1.composed.emotional[1]`: …頼むよ。ベルト、挑ませてほしい。…もう、待てないんだ
- `CHOICE_EVENT_DIALOGUES.S1.polite.quiet[1]`: …タイトルマッチに挑戦させていただけますか
- `CHOICE_EVENT_DIALOGUES.S1.polite.shy[1]`: あ、あの…ご相談したいことが…
- `CHOICE_EVENT_DIALOGUES.S1.polite.earnest[1]`: ずっと準備して参りました。チャンスをいただけませんか
- `CHOICE_EVENT_DIALOGUES.S1.polite.emotional[1]`: お願いします…！どうか、タイトル戦に挑ませてください…！
- `CHOICE_EVENT_DIALOGUES.S2.cool.normal[1]`: …あの人との試合を組んでほしい
- `CHOICE_EVENT_DIALOGUES.S2.cool.bold[1]`: …決着をつけたい。組んでくれ
- `CHOICE_EVENT_DIALOGUES.S2.cool.quiet[1]`: …あいつとの試合を。頼む
- `CHOICE_EVENT_DIALOGUES.S2.cool.shy[1]`: …あの。…あの人と、やりたい
- `CHOICE_EVENT_DIALOGUES.S2.cool.easygoing[1]`: …あの人と。決着をつけたい
- `CHOICE_EVENT_DIALOGUES.S2.cool.earnest[1]`: …あの人を越えたい。組んでくれ
- `CHOICE_EVENT_DIALOGUES.S2.cool.emotional[1]`: …あの人と、やりたい。頼む
- `CHOICE_EVENT_DIALOGUES.S2.standard.normal[1]`: 因縁のある相手と試合を組んでいただけませんか
- `CHOICE_EVENT_DIALOGUES.S2.standard.bold[1]`: あの相手と戦わずにはいられない！早く試合を組んでくれ！
- `CHOICE_EVENT_DIALOGUES.S2.standard.bold[2]`: 決着をつけたい。あいつと戦う機会をちょうだい！
- `CHOICE_EVENT_DIALOGUES.S2.standard.quiet[1]`: ……あの人と、戦わせてください
- `CHOICE_EVENT_DIALOGUES.S2.standard.shy[1]`: あの…あの人と…試合させてもらえませんか…
- `CHOICE_EVENT_DIALOGUES.S2.standard.easygoing[1]`: あの人との試合組んでよ！決着つけたいんだ！
- `CHOICE_EVENT_DIALOGUES.S2.standard.earnest[1]`: あの相手を越えてこそ、次のステージに行ける。組んでください
- `CHOICE_EVENT_DIALOGUES.S2.standard.emotional[1]`: あの人と戦いたい…！お願いします…組んでください…！
- `CHOICE_EVENT_DIALOGUES.S2.ojousama.normal[1]`: あの方との決着を、お許しいただけませんか？
- `CHOICE_EVENT_DIALOGUES.S2.ojousama.bold[1]`: あれとも決着をつけませんとね……
- `CHOICE_EVENT_DIALOGUES.S2.ojousama.quiet[1]`: ……あの方と。戦わせていただけませんか
- `CHOICE_EVENT_DIALOGUES.S2.ojousama.shy[1]`: あの…わたくし、あの方と…試合を組んでいただけませんか…
- `CHOICE_EVENT_DIALOGUES.S2.ojousama.earnest[1]`: あの方を越えてこそですわ。組んでいただけませんこと
- `CHOICE_EVENT_DIALOGUES.S2.ojousama.emotional[1]`: あの方と戦いたいんです…！どうか、組んでください…！
- `CHOICE_EVENT_DIALOGUES.S2.delinquent.normal[1]`: あいつとの試合、組んでくれよ
- `CHOICE_EVENT_DIALOGUES.S2.delinquent.bold[1]`: あいつと決着つけさせろ！
- `CHOICE_EVENT_DIALOGUES.S2.delinquent.quiet[1]`: ……あいつと。…やらせてくれ
- `CHOICE_EVENT_DIALOGUES.S2.delinquent.shy[1]`: あの…あいつと、試合…組んでもらえないっすか…
- `CHOICE_EVENT_DIALOGUES.S2.delinquent.easygoing[1]`: あいつとやらせろよ！ケリつけてやる！
- `CHOICE_EVENT_DIALOGUES.S2.delinquent.earnest[1]`: あいつを越えねぇと先がねぇんだ。試合、組んでくれ
- `CHOICE_EVENT_DIALOGUES.S2.delinquent.emotional[1]`: あいつとやりてえんだ…！頼む、組んでくれ…！
- `CHOICE_EVENT_DIALOGUES.S2.seductive.normal[1]`: あの人との試合、組んでもらえないかしら
- `CHOICE_EVENT_DIALOGUES.S2.seductive.bold[1]`: あの人と決着をつけたいの。組んでもらえる？
- `CHOICE_EVENT_DIALOGUES.S2.seductive.shy[1]`: あの…あの人と、試合…組んでもらえない…？ 変よね、こんなの…
- `CHOICE_EVENT_DIALOGUES.S2.seductive.easygoing[1]`: あの人との試合、組んでくれない？ 決着つけたいの
- `CHOICE_EVENT_DIALOGUES.S2.seductive.earnest[1]`: あの人を越えたいの。試合を組んでくれない？
- `CHOICE_EVENT_DIALOGUES.S2.seductive.emotional[1]`: 時間、ある……っ……ふふ、ちょっとだけ付き合って……
- `CHOICE_EVENT_DIALOGUES.S2.composed.normal[1]`: …あの人との試合、そろそろ組んでもらえないかな
- `CHOICE_EVENT_DIALOGUES.S2.composed.bold[1]`: …決着をつけたいんだ。組んでくれないかな
- `CHOICE_EVENT_DIALOGUES.S2.composed.quiet[1]`: ……あの人と、やらせてほしい。それだけ
- `CHOICE_EVENT_DIALOGUES.S2.composed.shy[1]`: …言いにくいんだけど。…あの人と、やらせてもらえないかな
- `CHOICE_EVENT_DIALOGUES.S2.composed.easygoing[1]`: …ねえ、あの人との試合、組んでくれない？ 決着つけたくてさ
- `CHOICE_EVENT_DIALOGUES.S2.composed.earnest[1]`: …あの人を越えないと先に進めない。頼むよ
- `CHOICE_EVENT_DIALOGUES.S2.composed.emotional[1]`: …あの人と、やらせてほしい。…これだけは、譲れないんだ
- `CHOICE_EVENT_DIALOGUES.S2.polite.quiet[1]`: …あの方との対戦を、お願いできますか
- `CHOICE_EVENT_DIALOGUES.S2.polite.shy[1]`: す、すみません…少しお時間いただけますか…
- `CHOICE_EVENT_DIALOGUES.S2.polite.earnest[1]`: あの方との試合を組んでいただけないでしょうか
- `CHOICE_EVENT_DIALOGUES.S2.polite.emotional[1]`: あの人と戦いたいんです…！お願いします、組んでください…！
- `CHOICE_EVENT_DIALOGUES.S3.cool.normal[1]`: …少し、休みたい
- `CHOICE_EVENT_DIALOGUES.S3.cool.bold[1]`: …限界だ。休む
- `CHOICE_EVENT_DIALOGUES.S3.cool.quiet[1]`: …休む必要がある
- `CHOICE_EVENT_DIALOGUES.S3.cool.shy[1]`: …あの。…体が、もたない。休みたい
- `CHOICE_EVENT_DIALOGUES.S3.cool.easygoing[1]`: …もう無理だ。少し休みたい
- `CHOICE_EVENT_DIALOGUES.S3.cool.earnest[1]`: …迷惑をかける。それでも、休ませてくれ
- `CHOICE_EVENT_DIALOGUES.S3.cool.earnest[2]`: …みんなに悪いが、体が限界だ
- `CHOICE_EVENT_DIALOGUES.S3.cool.emotional[1]`: …すまない。体が、もう…休ませてくれ
- `CHOICE_EVENT_DIALOGUES.S3.standard.normal[1]`: 少し休養をいただけますか？
- `CHOICE_EVENT_DIALOGUES.S3.standard.bold[1]`: …悔しいけど、体が限界みたい。少し休ませて
- `CHOICE_EVENT_DIALOGUES.S3.standard.quiet[1]`: ……少し、休ませてください
- `CHOICE_EVENT_DIALOGUES.S3.standard.shy[1]`: あの…すみません…体が…少し休ませてもらえますか…
- `CHOICE_EVENT_DIALOGUES.S3.standard.easygoing[1]`: もう限界！ちょっと休まないとマジでやばい！
- `CHOICE_EVENT_DIALOGUES.S3.standard.earnest[1]`: 迷惑をかけてしまって申し訳ないんですが…少し休ませてもらえますか
- `CHOICE_EVENT_DIALOGUES.S3.standard.earnest[2]`: チームに迷惑はかけたくないんですが…体が限界で…
- `CHOICE_EVENT_DIALOGUES.S3.standard.emotional[1]`: ごめんなさい…体がもう…休ませてください…！
- `CHOICE_EVENT_DIALOGUES.S3.ojousama.normal[1]`: 少しお休みをいただけますかしら…
- `CHOICE_EVENT_DIALOGUES.S3.ojousama.bold[1]`: …情けないけれど、もう、体が限界ですわね
- `CHOICE_EVENT_DIALOGUES.S3.ojousama.quiet[1]`: ……少しだけ。お休みを、いただけませんか
- `CHOICE_EVENT_DIALOGUES.S3.ojousama.shy[1]`: あの…申し訳ありません…体が…少し、休ませていただけませんか…
- `CHOICE_EVENT_DIALOGUES.S3.ojousama.earnest[1]`: チームにご迷惑はかけたくありませんのに…体が限界ですわ…
- `CHOICE_EVENT_DIALOGUES.S3.ojousama.emotional[1]`: 申し訳ありません…！みっともないところを…体が、もう…休ませてください…！
- `CHOICE_EVENT_DIALOGUES.S3.delinquent.normal[1]`: ちょっと休ませてくれ…
- `CHOICE_EVENT_DIALOGUES.S3.delinquent.bold[1]`: くそ…体がもう限界だ。休ませてくれ
- `CHOICE_EVENT_DIALOGUES.S3.delinquent.quiet[1]`: ……悪い。少し、休ませてくれ
- `CHOICE_EVENT_DIALOGUES.S3.delinquent.shy[1]`: あの…すんません…体がもう…少し休ませてもらえねぇっすか…
- `CHOICE_EVENT_DIALOGUES.S3.delinquent.easygoing[1]`: 無理！限界！休ませて！
- `CHOICE_EVENT_DIALOGUES.S3.delinquent.earnest[1]`: 迷惑かけて悪いんだけど…少し休ませてもらえねぇか
- `CHOICE_EVENT_DIALOGUES.S3.delinquent.earnest[2]`: みんなに迷惑かけたかねぇ…けど、体がもう限界なんだ
- `CHOICE_EVENT_DIALOGUES.S3.delinquent.emotional[1]`: 悪ぃ…！体がもう限界なんだ…休ませてくれ…！
- `CHOICE_EVENT_DIALOGUES.S3.seductive.normal[1]`: 少し休ませてもらえないかしら…
- `CHOICE_EVENT_DIALOGUES.S3.seductive.bold[1]`: …体が限界なの。少し休ませて
- `CHOICE_EVENT_DIALOGUES.S3.seductive.shy[1]`: あの…ごめんなさい…体が、もう…少しだけ休ませて…？
- `CHOICE_EVENT_DIALOGUES.S3.seductive.easygoing[1]`: ごめんね、ちょっと限界みたい。休ませてくれる？
- `CHOICE_EVENT_DIALOGUES.S3.seductive.earnest[1]`: 迷惑かけたくないんだけど…体が限界なの…
- `CHOICE_EVENT_DIALOGUES.S3.seductive.emotional[1]`: ……っ……どう答えるのが正解なのかしら、ふふ……
- `CHOICE_EVENT_DIALOGUES.S3.composed.normal[1]`: …少し休ませてもらえるかな
- `CHOICE_EVENT_DIALOGUES.S3.composed.bold[1]`: …体が限界みたいだ。少し休むよ
- `CHOICE_EVENT_DIALOGUES.S3.composed.quiet[1]`: ……休みたい。少しでいいんだ
- `CHOICE_EVENT_DIALOGUES.S3.composed.shy[1]`: …情けない話なんだけど。…体が持たない。少し休ませてほしい
- `CHOICE_EVENT_DIALOGUES.S3.composed.easygoing[1]`: …ま、限界みたいでさ。ちょっと休ませてよ
- `CHOICE_EVENT_DIALOGUES.S3.composed.earnest[1]`: …無理したくないんだ。少し休ませてもらえるかな
- `CHOICE_EVENT_DIALOGUES.S3.composed.emotional[1]`: …すまない。体が、もう限界でさ。…少し休ませてほしい
- `CHOICE_EVENT_DIALOGUES.S3.polite.quiet[1]`: …申し訳ありません。少し休ませていただけますか…
- `CHOICE_EVENT_DIALOGUES.S3.polite.shy[1]`: あ、あの…どう答えたらいいか、わからなくて…
- `CHOICE_EVENT_DIALOGUES.S3.polite.earnest[1]`: ご迷惑をおかけしまして申し訳ございません…少しお休みをいただけますか
- `CHOICE_EVENT_DIALOGUES.S3.polite.emotional[1]`: ごめんなさい…！もう、体が…どうか、休ませてください…！
- `CHOICE_EVENT_DIALOGUES.S4_direct.cool.normal[1]`: …このままでは続けられない。考えてほしい
- `CHOICE_EVENT_DIALOGUES.S4_direct.cool.bold[1]`: …このままでは先がない。考えてくれ
- `CHOICE_EVENT_DIALOGUES.S4_direct.cool.quiet[1]`: ……もう、限界だ（静かに、しかし断固として）
- `CHOICE_EVENT_DIALOGUES.S4_direct.cool.shy[1]`: …あの。…このままは、無理だ
- `CHOICE_EVENT_DIALOGUES.S4_direct.cool.easygoing[1]`: …不満がある。話をさせてくれ
- `CHOICE_EVENT_DIALOGUES.S4_direct.cool.earnest[1]`: …ずっと黙ってた。だが、もう限界だ
- `CHOICE_EVENT_DIALOGUES.S4_direct.cool.earnest[2]`: …目標に届く環境がいる。考え直してくれ
- `CHOICE_EVENT_DIALOGUES.S4_direct.cool.emotional[1]`: …もう、無理だ。…このままなら、続けられない
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.normal[1]`: このままでは限界です。待遇を改善していただけませんか
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.bold[1]`: このままじゃ納得できない。改善してくれないなら移籍を考えるからね
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.bold[2]`: 私の実力を発揮できていない。ここにいる意味はあるのかな
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.quiet[1]`: ………（険しい目でこちらを見つめている）
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.shy[1]`: …あの…ごめんなさい…でも…このままだと…
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.easygoing[1]`: ぶっちゃけ不満です！ちゃんと話し合いましょう！
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.earnest[1]`: …ずっと我慢してきました。でも、このままでは…
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.earnest[2]`: 私の目標を達成できる環境が必要です。考え直してもらえませんか
- `CHOICE_EVENT_DIALOGUES.S4_direct.standard.emotional[1]`: …もう…無理です…！このままだと…私…！
- `CHOICE_EVENT_DIALOGUES.S4_direct.ojousama.normal[1]`: このままでは困ります！お話し合いをさせてくださいまし
- `CHOICE_EVENT_DIALOGUES.S4_direct.ojousama.bold[1]`: このままでは納得できませんわね。……どうするか、考えなさいね？
- `CHOICE_EVENT_DIALOGUES.S4_direct.ojousama.quiet[1]`: ……申し上げます。…このままでは、わたくし、続けられません
- `CHOICE_EVENT_DIALOGUES.S4_direct.ojousama.shy[1]`: あの…申し訳ありません…でも…このままでは、わたくし…
- `CHOICE_EVENT_DIALOGUES.S4_direct.ojousama.earnest[1]`: これまで耐えてまいりましたけれど…もう限界ですわ
- `CHOICE_EVENT_DIALOGUES.S4_direct.ojousama.emotional[1]`: …もう…耐えられません…！このままでは、わたくし…！
- `CHOICE_EVENT_DIALOGUES.S4_direct.delinquent.normal[1]`: 不満だっつってんの。ちゃんと話し合おうぜ
- `CHOICE_EVENT_DIALOGUES.S4_direct.delinquent.bold[1]`: こんなんじゃやってらんねーよ！改善しろ！
- `CHOICE_EVENT_DIALOGUES.S4_direct.delinquent.quiet[1]`: ……言わせてもらう。…このままじゃ、もたねえ
- `CHOICE_EVENT_DIALOGUES.S4_direct.delinquent.shy[1]`: …あの…悪ぃんすけど…このままじゃ、もう…
- `CHOICE_EVENT_DIALOGUES.S4_direct.delinquent.easygoing[1]`: もう無理！ちゃんと話し合えよ！
- `CHOICE_EVENT_DIALOGUES.S4_direct.delinquent.earnest[1]`: ずっと我慢してきたんだ。でも、このままじゃ…
- `CHOICE_EVENT_DIALOGUES.S4_direct.delinquent.earnest[2]`: 目標に届く場所じゃねぇと意味がねぇ。考え直してくれよ
- `CHOICE_EVENT_DIALOGUES.S4_direct.delinquent.emotional[1]`: …もう…無理だっつってんだよ…！このままじゃ、あたし…！
- `CHOICE_EVENT_DIALOGUES.S4_direct.seductive.normal[1]`: このままじゃ困るわ。ちゃんと考えてもらえないかしら
- `CHOICE_EVENT_DIALOGUES.S4_direct.seductive.bold[1]`: このままじゃ我慢の限界よ。考え直してもらえない？
- `CHOICE_EVENT_DIALOGUES.S4_direct.seductive.shy[1]`: あの…ごめんなさい…でも、このままじゃ…わたし…
- `CHOICE_EVENT_DIALOGUES.S4_direct.seductive.easygoing[1]`: ぶっちゃけ、不満があるの。ちゃんと話しましょう？
- `CHOICE_EVENT_DIALOGUES.S4_direct.seductive.earnest[1]`: ずっと我慢してきたの。でも、もう限界よ
- `CHOICE_EVENT_DIALOGUES.S4_direct.seductive.emotional[1]`: はっきり言うわ……っ……私の気持ちは……
- `CHOICE_EVENT_DIALOGUES.S4_direct.composed.normal[1]`: …このままだと困るんだよね。少し考えてもらえるかな
- `CHOICE_EVENT_DIALOGUES.S4_direct.composed.bold[1]`: …このままだと先がないよ。考え直してくれないかな
- `CHOICE_EVENT_DIALOGUES.S4_direct.composed.quiet[1]`: ……黙ってたけどね。…このままは、無理だよ
- `CHOICE_EVENT_DIALOGUES.S4_direct.composed.shy[1]`: …こんなこと言いたくないんだけどね。…このままだと、もたないよ
- `CHOICE_EVENT_DIALOGUES.S4_direct.composed.easygoing[1]`: …正直、不満があってさ。…一度、ちゃんと話そうよ
- `CHOICE_EVENT_DIALOGUES.S4_direct.composed.earnest[1]`: …ずっと黙ってたけど、そろそろ限界だよ
- `CHOICE_EVENT_DIALOGUES.S4_direct.composed.emotional[1]`: …もう無理だよ。…このままなら、ここにはいられない
- `CHOICE_EVENT_DIALOGUES.S4_direct.polite.quiet[1]`: …申し訳ありません。ただ…このままでは…
- `CHOICE_EVENT_DIALOGUES.S4_direct.polite.shy[1]`: は、はっきり言わせていただきます…わたしは…
- `CHOICE_EVENT_DIALOGUES.S4_direct.polite.earnest[1]`: ずっと我慢して参りましたが…このままでは限界です
- `CHOICE_EVENT_DIALOGUES.S4_direct.polite.emotional[1]`: …申し訳ありません…！でも、もう…このままでは、私…！
- `CHOICE_EVENT_DIALOGUES.S4_silent.ojousama.normal[1]`: （…申し上げたいことは、ございます。けれど、口にはできません）
- `CHOICE_EVENT_DIALOGUES.S4_silent.ojousama.bold[1]`: …………（膝の上で、手を固く握りしめている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.ojousama.quiet[1]`: …………（小さく息をつき、そっと目を伏せる）
- `CHOICE_EVENT_DIALOGUES.S4_silent.ojousama.shy[1]`: …………（目を伏せたまま、言葉を探しあぐねている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.ojousama.earnest[1]`: …………（何か申し上げようと口を開き、そっと閉じた）
- `CHOICE_EVENT_DIALOGUES.S4_silent.ojousama.emotional[1]`: ……っ（唇を噛み、こみ上げるものを必死にこらえている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.delinquent.normal[1]`: …（沈黙）…いや、なんでもねえよ
- `CHOICE_EVENT_DIALOGUES.S4_silent.delinquent.bold[1]`: …………（舌打ちをこらえて、拳を握っている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.delinquent.quiet[1]`: …………（舌打ちをひとつ、そっぽを向く）
- `CHOICE_EVENT_DIALOGUES.S4_silent.delinquent.shy[1]`: …………（下を向いたまま、何も言えずにいる）
- `CHOICE_EVENT_DIALOGUES.S4_silent.delinquent.easygoing[1]`: あー…いや、なんでもねえって（笑ってはいるが、目が笑っていない）
- `CHOICE_EVENT_DIALOGUES.S4_silent.delinquent.earnest[1]`: …………（言いかけて、結局は口をつぐんだ）
- `CHOICE_EVENT_DIALOGUES.S4_silent.delinquent.emotional[1]`: ……っ（歯を食いしばって、目元を腕でぬぐった）
- `CHOICE_EVENT_DIALOGUES.S4_silent.cool.normal[1]`: ………（首を振って、口をつぐんだ）
- `CHOICE_EVENT_DIALOGUES.S4_silent.cool.bold[1]`: …………（拳を握ったまま、視線を外さない）
- `CHOICE_EVENT_DIALOGUES.S4_silent.cool.quiet[1]`: ……（何も言わず、立ち去ろうとする）
- `CHOICE_EVENT_DIALOGUES.S4_silent.cool.shy[1]`: ………（目を合わせず、口を閉ざしている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.cool.easygoing[1]`: …別に。…なんでもない（薄く笑って、目を逸らした）
- `CHOICE_EVENT_DIALOGUES.S4_silent.cool.earnest[1]`: ………（口を開きかけ、やめた）
- `CHOICE_EVENT_DIALOGUES.S4_silent.cool.emotional[1]`: ……っ（唇を噛んで、顔を背けた）
- `CHOICE_EVENT_DIALOGUES.S4_silent.seductive.normal[1]`: …（沈黙）…ううん、なんでもないの
- `CHOICE_EVENT_DIALOGUES.S4_silent.seductive.bold[1]`: …………（笑みは崩さないまま、指先だけが強く握られている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.seductive.shy[1]`: …………（何か言いかけて、力なく微笑んだだけだった）
- `CHOICE_EVENT_DIALOGUES.S4_silent.seductive.easygoing[1]`: ふふ…ううん、なんでもないの（笑顔のまま、目だけが冷えている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.seductive.earnest[1]`: …………（言いかけた言葉を、笑みの奥に飲み込んだ）
- `CHOICE_EVENT_DIALOGUES.S4_silent.seductive.emotional[1]`: ………っ……言葉にならないの……ふふ……
- `CHOICE_EVENT_DIALOGUES.S4_silent.composed.normal[1]`: …（少し間を置いて）…いや、なんでもないよ
- `CHOICE_EVENT_DIALOGUES.S4_silent.composed.bold[1]`: …………（拳を握り、それから静かに息を吐いた）
- `CHOICE_EVENT_DIALOGUES.S4_silent.composed.quiet[1]`: …………（ひとつ息をついて、それきり黙っている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.composed.shy[1]`: …………（目を伏せて、それきり口を開かない）
- `CHOICE_EVENT_DIALOGUES.S4_silent.composed.easygoing[1]`: …いや、なんでもないよ（笑ってみせたが、目は笑っていない）
- `CHOICE_EVENT_DIALOGUES.S4_silent.composed.earnest[1]`: …………（言いかけて、ひとつ息をつき、そのまま黙った）
- `CHOICE_EVENT_DIALOGUES.S4_silent.composed.emotional[1]`: ……っ（込み上げたものを飲み下し、静かに目を閉じた）
- `CHOICE_EVENT_DIALOGUES.S4_silent.standard.normal[1]`: （沈黙）…いえ、何でもないです
- `CHOICE_EVENT_DIALOGUES.S4_silent.standard.bold[1]`: …………（拳を握りしめている）
- `CHOICE_EVENT_DIALOGUES.S4_silent.standard.quiet[1]`: …………（小さくため息をつき、視線を逸らす）
- `CHOICE_EVENT_DIALOGUES.S4_silent.standard.shy[1]`: …………（目を逸らして、何も言えずにいる）
- `CHOICE_EVENT_DIALOGUES.S4_silent.standard.easygoing[1]`: あはは…いや、なんでも…（笑っているが目が笑っていない）
- `CHOICE_EVENT_DIALOGUES.S4_silent.standard.earnest[1]`: …………（何か言いたげに口を開きかけ、止める）
- `CHOICE_EVENT_DIALOGUES.S4_silent.standard.emotional[1]`: ……っ（泣くのを堪えるように唇を噛んでいる）
- `CHOICE_EVENT_DIALOGUES.S4_silent.polite.quiet[1]`: ………（目を伏せて、何かを堪えるように唇を噛む）……
- `CHOICE_EVENT_DIALOGUES.S4_silent.polite.shy[1]`: ………あの…なにも、言えません…
- `CHOICE_EVENT_DIALOGUES.S4_silent.polite.earnest[1]`: …………（何か申し上げかけて、深く頭を下げるだけだった）
- `CHOICE_EVENT_DIALOGUES.S4_silent.polite.emotional[1]`: ……っ（涙をこらえるように、深く頭を下げたまま動かない）
- `CHOICE_EVENT_DIALOGUES.S5.cool.normal[1]`: …特訓の時間を。もらえるか
- `CHOICE_EVENT_DIALOGUES.S5.cool.bold[1]`: …特訓させてくれ。もっと強くなる
- `CHOICE_EVENT_DIALOGUES.S5.cool.quiet[1]`: …鍛えたい。場所を貸してくれ
- `CHOICE_EVENT_DIALOGUES.S5.cool.shy[1]`: …あの。…特訓させてほしい。強くなりたい
- `CHOICE_EVENT_DIALOGUES.S5.cool.easygoing[1]`: …特訓したい。強くなりたいんだ
- `CHOICE_EVENT_DIALOGUES.S5.cool.earnest[1]`: …もっと強くなりたい。特訓を許可してくれ
- `CHOICE_EVENT_DIALOGUES.S5.cool.emotional[1]`: …頼む。特訓させてくれ。…もっと、強くなりたい
- `CHOICE_EVENT_DIALOGUES.S5.standard.normal[1]`: 特訓する時間をいただけませんか？
- `CHOICE_EVENT_DIALOGUES.S5.standard.bold[1]`: もっと上を目指したい。特訓させて！
- `CHOICE_EVENT_DIALOGUES.S5.standard.bold[2]`: 今燃えてるの！とことんやらせて！
- `CHOICE_EVENT_DIALOGUES.S5.standard.quiet[1]`: ……特訓、させてください
- `CHOICE_EVENT_DIALOGUES.S5.standard.shy[1]`: あの…特訓…させてもらえませんか…？ もっと強くなりたいんです…
- `CHOICE_EVENT_DIALOGUES.S5.standard.easygoing[1]`: 特訓したい！もっと強くなりたいんだ！
- `CHOICE_EVENT_DIALOGUES.S5.standard.earnest[1]`: もっと強くなりたいんです。特訓を許可してください！
- `CHOICE_EVENT_DIALOGUES.S5.standard.emotional[1]`: お願いします…！特訓させてください…！もっと、もっと強くなりたい…！
- `CHOICE_EVENT_DIALOGUES.S5.ojousama.normal[1]`: 特訓の時間をいただけませんこと？
- `CHOICE_EVENT_DIALOGUES.S5.ojousama.bold[1]`: もっと上を目指す為に。特訓が必要ね…
- `CHOICE_EVENT_DIALOGUES.S5.ojousama.quiet[1]`: ……特訓のお許しを、いただけますか
- `CHOICE_EVENT_DIALOGUES.S5.ojousama.shy[1]`: あの…わたくし、特訓を…もっと強くなりたいんです…お許しいただけませんか…
- `CHOICE_EVENT_DIALOGUES.S5.ojousama.earnest[1]`: もっと強くなりたいですの。特訓のお許しをいただけませんこと
- `CHOICE_EVENT_DIALOGUES.S5.ojousama.emotional[1]`: お願いします…！特訓を…！わたくし、もっと強くなりたいんです…！
- `CHOICE_EVENT_DIALOGUES.S5.delinquent.normal[1]`: 特訓させてくれ。もっと強くなりてえ
- `CHOICE_EVENT_DIALOGUES.S5.delinquent.bold[1]`: もっと強くなりてぇ！特訓させろ！
- `CHOICE_EVENT_DIALOGUES.S5.delinquent.quiet[1]`: ……特訓、させてくれ
- `CHOICE_EVENT_DIALOGUES.S5.delinquent.shy[1]`: あの…特訓、させてもらえないっすか…もっと強くなりてぇんす…
- `CHOICE_EVENT_DIALOGUES.S5.delinquent.easygoing[1]`: 特訓すんぞ！もっと強くなりてーんだよ！
- `CHOICE_EVENT_DIALOGUES.S5.delinquent.earnest[1]`: もっと強くなりてぇんだ。特訓、許可してくれ
- `CHOICE_EVENT_DIALOGUES.S5.delinquent.emotional[1]`: 頼む…！特訓させてくれ…！もっと強くなりてぇんだよ…！
- `CHOICE_EVENT_DIALOGUES.S5.seductive.normal[1]`: 特訓させてもらえないかしら？
- `CHOICE_EVENT_DIALOGUES.S5.seductive.bold[1]`: もっと強くなりたいの。特訓させてもらえる？
- `CHOICE_EVENT_DIALOGUES.S5.seductive.shy[1]`: あの…特訓、させてもらえない…？ もっと強くなりたいの…
- `CHOICE_EVENT_DIALOGUES.S5.seductive.easygoing[1]`: 特訓したいの。もっと強くなりたくて
- `CHOICE_EVENT_DIALOGUES.S5.seductive.earnest[1]`: もっと強くなりたいの。特訓させてもらえる？
- `CHOICE_EVENT_DIALOGUES.S5.seductive.emotional[1]`: 少し考えさせて……っ……ふふ、すぐには決められないの……
- `CHOICE_EVENT_DIALOGUES.S5.composed.normal[1]`: …少し追い込みたいんだ。特訓させてもらえるかな
- `CHOICE_EVENT_DIALOGUES.S5.composed.bold[1]`: …もう少し上に行きたい。特訓させてくれないかな
- `CHOICE_EVENT_DIALOGUES.S5.composed.quiet[1]`: ……特訓、させてほしい。それだけ
- `CHOICE_EVENT_DIALOGUES.S5.composed.shy[1]`: …図々しいかもしれないけど。…特訓させてほしい。もっと強くなりたくて
- `CHOICE_EVENT_DIALOGUES.S5.composed.easygoing[1]`: …特訓させてよ。もっと強くなりたくてさ
- `CHOICE_EVENT_DIALOGUES.S5.composed.earnest[1]`: …まだ伸びしろはあるはずなんだ。やらせてほしい
- `CHOICE_EVENT_DIALOGUES.S5.composed.emotional[1]`: …頼むよ。特訓させてほしい。…まだ、こんなもので終われないんだ
- `CHOICE_EVENT_DIALOGUES.S5.polite.quiet[1]`: …特訓をさせていただけますか
- `CHOICE_EVENT_DIALOGUES.S5.polite.shy[1]`: 考えさせて…いただけますか…？
- `CHOICE_EVENT_DIALOGUES.S5.polite.earnest[1]`: もっと強くなりたいのです。特訓をお許しいただけますか
- `CHOICE_EVENT_DIALOGUES.S5.polite.emotional[1]`: お願いします…！特訓させてください…！もっと、強くなりたいんです…！
- `CHOICE_EVENT_DIALOGUES.S6.cool.normal[1]`: …後輩の指導を。任せてくれ
- `CHOICE_EVENT_DIALOGUES.S6.cool.bold[1]`: …後輩を見る。任せてくれ
- `CHOICE_EVENT_DIALOGUES.S6.cool.quiet[1]`: …次の世代に、繋ぎたいものがある
- `CHOICE_EVENT_DIALOGUES.S6.cool.shy[1]`: …あの。…後輩に、伝えたいことがある
- `CHOICE_EVENT_DIALOGUES.S6.cool.easygoing[1]`: …後輩の面倒、見させてくれ
- `CHOICE_EVENT_DIALOGUES.S6.cool.earnest[1]`: …培ったものを、後輩に渡したい
- `CHOICE_EVENT_DIALOGUES.S6.cool.earnest[2]`: …後輩の指導を。機会をくれ
- `CHOICE_EVENT_DIALOGUES.S6.cool.emotional[1]`: …後輩のために、できることがあるなら。…やらせてくれ
- `CHOICE_EVENT_DIALOGUES.S6.standard.normal[1]`: 後輩の指導を担当させてもらえませんか？
- `CHOICE_EVENT_DIALOGUES.S6.standard.bold[1]`: 若い子たちの面倒を見させてよ。それが私の役目だと思うから
- `CHOICE_EVENT_DIALOGUES.S6.standard.quiet[1]`: ……後輩に、伝えたいことがあるんです
- `CHOICE_EVENT_DIALOGUES.S6.standard.shy[1]`: あの…私でよければ…後輩の子たちに…何か伝えられたら…
- `CHOICE_EVENT_DIALOGUES.S6.standard.easygoing[1]`: 後輩の面倒見させてよ！楽しそうだし！
- `CHOICE_EVENT_DIALOGUES.S6.standard.earnest[1]`: 私が培ってきたものを、後輩に伝えたいと思って…
- `CHOICE_EVENT_DIALOGUES.S6.standard.earnest[2]`: 後輩に何かを伝えたいんです。指導の機会をもらえますか
- `CHOICE_EVENT_DIALOGUES.S6.standard.emotional[1]`: 後輩の子たちに…私にできることがあるなら…やらせてください！
- `CHOICE_EVENT_DIALOGUES.S6.ojousama.normal[1]`: 後輩のお世話は、私にお任せください
- `CHOICE_EVENT_DIALOGUES.S6.ojousama.bold[1]`: 若手の面倒を見るのも、私の務めですわね
- `CHOICE_EVENT_DIALOGUES.S6.ojousama.quiet[1]`: ……後輩の子たちに、伝えたいことがあります
- `CHOICE_EVENT_DIALOGUES.S6.ojousama.shy[1]`: あの…わたくしでよろしければ…後輩の子たちに、何かお伝えできたら…
- `CHOICE_EVENT_DIALOGUES.S6.ojousama.earnest[1]`: 私が学んできたことを、後輩にお伝えしたいと思いまして…
- `CHOICE_EVENT_DIALOGUES.S6.ojousama.emotional[1]`: 後輩の子たちに…わたくしにできることがあるのなら…やらせてください…！
- `CHOICE_EVENT_DIALOGUES.S6.delinquent.normal[1]`: 後輩の面倒、見させてくれよ
- `CHOICE_EVENT_DIALOGUES.S6.delinquent.bold[1]`: 後輩の面倒は任せろ。鍛えてやる
- `CHOICE_EVENT_DIALOGUES.S6.delinquent.quiet[1]`: ……後輩に、伝えてぇことがあるんだ
- `CHOICE_EVENT_DIALOGUES.S6.delinquent.shy[1]`: あの…あたしでよけりゃ…後輩に、何か教えてやりたくて…
- `CHOICE_EVENT_DIALOGUES.S6.delinquent.easygoing[1]`: 後輩の面倒見るわ！任せとけ！
- `CHOICE_EVENT_DIALOGUES.S6.delinquent.earnest[1]`: あたしが積んできたもん、後輩に渡してやりてぇんだ
- `CHOICE_EVENT_DIALOGUES.S6.delinquent.earnest[2]`: 後輩に伝えてぇことがある。指導、任せてくれよ
- `CHOICE_EVENT_DIALOGUES.S6.delinquent.emotional[1]`: 後輩に…あたしにできることがあるなら…やらせてくれ…！
- `CHOICE_EVENT_DIALOGUES.S6.seductive.normal[1]`: 後輩の指導、私にやらせてもらえないかしら
- `CHOICE_EVENT_DIALOGUES.S6.seductive.bold[1]`: 後輩の面倒、見させてもらえるかしら？
- `CHOICE_EVENT_DIALOGUES.S6.seductive.shy[1]`: あの…わたしでよければ…後輩の子たちに、何か残せたら…って…
- `CHOICE_EVENT_DIALOGUES.S6.seductive.easygoing[1]`: 後輩の子たち、かわいいわよね。面倒見させてもらえない？
- `CHOICE_EVENT_DIALOGUES.S6.seductive.earnest[1]`: 培ってきたものを、次の子たちに伝えたいの
- `CHOICE_EVENT_DIALOGUES.S6.seductive.emotional[1]`: 決めたわ……っ……ふふ、これが私の答えよ……
- `CHOICE_EVENT_DIALOGUES.S6.composed.normal[1]`: …後輩の面倒、見させてもらえないかな
- `CHOICE_EVENT_DIALOGUES.S6.composed.bold[1]`: …後輩に伝えておきたいことがあるんだ。任せてくれないかな
- `CHOICE_EVENT_DIALOGUES.S6.composed.quiet[1]`: ……後輩に、渡したいものがあるんだ
- `CHOICE_EVENT_DIALOGUES.S6.composed.shy[1]`: …おこがましいかもしれないけど。…後輩に、何か残せたらと思ってさ
- `CHOICE_EVENT_DIALOGUES.S6.composed.easygoing[1]`: …後輩の面倒、見させてよ。…案外、向いてる気がしてさ
- `CHOICE_EVENT_DIALOGUES.S6.composed.earnest[1]`: …次の世代に繋げたいものがあるんだ。やらせてほしい
- `CHOICE_EVENT_DIALOGUES.S6.composed.emotional[1]`: …後輩に残せるものがあるなら、やらせてほしい。…それだけだよ
- `CHOICE_EVENT_DIALOGUES.S6.polite.quiet[1]`: …後輩のご指導を、担当させていただけますか
- `CHOICE_EVENT_DIALOGUES.S6.polite.shy[1]`: 決めました…これで、いいんですよね…？
- `CHOICE_EVENT_DIALOGUES.S6.polite.earnest[1]`: 培ってきたものを後輩にお伝えしたいのです
- `CHOICE_EVENT_DIALOGUES.S6.polite.emotional[1]`: 後輩の子たちに…私にできることがあるのでしたら…やらせてください…！
- `CHOICE_EVENT_DIALOGUES.E1.cool.normal[1]`: …メディアの話が来ている。出たい
- `CHOICE_EVENT_DIALOGUES.E1.cool.normal[2]`: …出演の話。やらせてくれ
- `CHOICE_EVENT_DIALOGUES.E1.cool.bold[1]`: …いい機会だ。出る
- `CHOICE_EVENT_DIALOGUES.E1.cool.quiet[1]`: ……やる
- `CHOICE_EVENT_DIALOGUES.E1.cool.shy[1]`: …テレビ。…私なんかが。…でも、やる
- `CHOICE_EVENT_DIALOGUES.E1.cool.easygoing[1]`: …もっと近くで、見てもらいたい
- `CHOICE_EVENT_DIALOGUES.E1.cool.easygoing[2]`: …テレビ。出る
- `CHOICE_EVENT_DIALOGUES.E1.cool.earnest[1]`: …緊張はする。でも、やる
- `CHOICE_EVENT_DIALOGUES.E1.cool.emotional[1]`: …テレビ。…っ、…やる。ありがとう
- `CHOICE_EVENT_DIALOGUES.E1.polite.normal[1]`: メディア出演のお話をいただきまして…ご検討いただけますでしょうか
- `CHOICE_EVENT_DIALOGUES.E1.polite.normal[2]`: 出演のお話をいただきました。ぜひ、やらせていただきたいです
- `CHOICE_EVENT_DIALOGUES.E1.polite.bold[1]`: この露出を足がかりに、もっと大きな舞台へ行きたいんです
- `CHOICE_EVENT_DIALOGUES.E1.polite.bold[2]`: 私が出れば注目は集まります。任せてください
- `CHOICE_EVENT_DIALOGUES.E1.polite.quiet[1]`: …出演のお話でしょうか。精一杯努めます
- `CHOICE_EVENT_DIALOGUES.E1.polite.shy[1]`: あ、あの…どうしたら、いいんでしょうか…
- `CHOICE_EVENT_DIALOGUES.E1.polite.easygoing[1]`: もっと多くの方に見ていただきたくて…出させていただけませんか
- `CHOICE_EVENT_DIALOGUES.E1.polite.easygoing[2]`: テレビ、ですか…！ぜひ、出させてください！
- `CHOICE_EVENT_DIALOGUES.E1.polite.earnest[1]`: 緊張いたしますが…精一杯務めさせていただきます
- `CHOICE_EVENT_DIALOGUES.E1.polite.emotional[1]`: テレビ、ですか…！？ 嬉しいです…！精一杯やります…！
- `CHOICE_EVENT_DIALOGUES.E1.standard.normal[1]`: メディアへの出演、ご検討いただけますか？
- `CHOICE_EVENT_DIALOGUES.E1.standard.normal[2]`: 出演のお話をいただきました。やってみたいです
- `CHOICE_EVENT_DIALOGUES.E1.standard.bold[1]`: この露出を足がかりに、もっと大きな舞台へ進みたい
- `CHOICE_EVENT_DIALOGUES.E1.standard.bold[2]`: 私が出れば注目されるのは当然。楽しみにしてるよ
- `CHOICE_EVENT_DIALOGUES.E1.standard.quiet[1]`: …出演のお話、ですか…頑張ります
- `CHOICE_EVENT_DIALOGUES.E1.standard.shy[1]`: え…テレビ…？ わ、私なんかが…で、でもやってみたいです…
- `CHOICE_EVENT_DIALOGUES.E1.standard.easygoing[1]`: ファンのみなさんに、もっと近くで私を見てもらいたい！
- `CHOICE_EVENT_DIALOGUES.E1.standard.easygoing[2]`: テレビ！？ やった！出たい！
- `CHOICE_EVENT_DIALOGUES.E1.standard.earnest[1]`: テレビは緊張しますけど…精一杯やります！
- `CHOICE_EVENT_DIALOGUES.E1.standard.emotional[1]`: テレビ…！？ えっ…嬉しい…！頑張ります…！
- `CHOICE_EVENT_DIALOGUES.E1.ojousama.normal[1]`: メディアのお話ですの？ ぜひお受けしたいですわ
- `CHOICE_EVENT_DIALOGUES.E1.ojousama.bold[1]`: 私が出ればお客様も喜ぶでしょうね。楽しみだわ…
- `CHOICE_EVENT_DIALOGUES.E1.ojousama.quiet[1]`: …メディアの、お話。…恥ずかしくないよう努めます
- `CHOICE_EVENT_DIALOGUES.E1.ojousama.shy[1]`: え…テレビ、ですか…？ わたくしなんかが…で、でも、やってみたいです…
- `CHOICE_EVENT_DIALOGUES.E1.ojousama.easygoing[1]`: ファンの皆さまに、もっと近くで見ていただきたいんです
- `CHOICE_EVENT_DIALOGUES.E1.ojousama.easygoing[2]`: テレビ…！わたくし、出てみたいです
- `CHOICE_EVENT_DIALOGUES.E1.ojousama.earnest[1]`: テレビは緊張いたしますけれど…精一杯やらせていただきますわ
- `CHOICE_EVENT_DIALOGUES.E1.ojousama.emotional[1]`: テレビ…！？ わたくしが…嬉しい…！精一杯やります…！
- `CHOICE_EVENT_DIALOGUES.E1.delinquent.normal[1]`: テレビ出れんの？ やるやる！
- `CHOICE_EVENT_DIALOGUES.E1.delinquent.bold[1]`: やってやるぜ！注目されんのは大歓迎だ！
- `CHOICE_EVENT_DIALOGUES.E1.delinquent.quiet[1]`: …出演の話か。…やる
- `CHOICE_EVENT_DIALOGUES.E1.delinquent.shy[1]`: え…テレビ…？ あたしなんかが…で、でも…やってみてぇっす…
- `CHOICE_EVENT_DIALOGUES.E1.delinquent.easygoing[1]`: テレビ出んの！？ 最高じゃん！
- `CHOICE_EVENT_DIALOGUES.E1.delinquent.earnest[1]`: テレビは緊張すんだけど…精一杯やらせてくれ
- `CHOICE_EVENT_DIALOGUES.E1.delinquent.emotional[1]`: テレビ…！？ マジか…！うれしい…！やってやる…！
- `CHOICE_EVENT_DIALOGUES.E1.seductive.normal[1]`: メディア出演のお話？ 楽しみだわ
- `CHOICE_EVENT_DIALOGUES.E1.seductive.bold[1]`: 注目される場は好きよ。もちろんやるわ
- `CHOICE_EVENT_DIALOGUES.E1.seductive.quiet[1]`: …出演の話…？ …やってみるわ
- `CHOICE_EVENT_DIALOGUES.E1.seductive.shy[1]`: え…テレビ…？ わたしなんかで…でも、やってみたいの…
- `CHOICE_EVENT_DIALOGUES.E1.seductive.easygoing[1]`: ファンのみんなにもっと見てもらえるのね。嬉しいわ
- `CHOICE_EVENT_DIALOGUES.E1.seductive.earnest[1]`: 緊張するけど…精一杯やるわ
- `CHOICE_EVENT_DIALOGUES.E1.seductive.emotional[1]`: ……っ……どうしようかしら、ふふ、迷っちゃうわね……
- `CHOICE_EVENT_DIALOGUES.E1.composed.normal[1]`: …メディアか。いい機会だね
- `CHOICE_EVENT_DIALOGUES.E1.composed.bold[1]`: …悪くないね。いつも通りやるよ
- `CHOICE_EVENT_DIALOGUES.E1.composed.quiet[1]`: …出演の話か。…受けるよ
- `CHOICE_EVENT_DIALOGUES.E1.composed.shy[1]`: …テレビか。…私でいいのかな。…でも、やってみたいよ
- `CHOICE_EVENT_DIALOGUES.E1.composed.easygoing[1]`: …もっと近くで見てもらいたくてさ。出してよ
- `CHOICE_EVENT_DIALOGUES.E1.composed.easygoing[2]`: …テレビか。いいね、出るよ
- `CHOICE_EVENT_DIALOGUES.E1.composed.earnest[1]`: …緊張はしないよ。いつも通りやればいい
- `CHOICE_EVENT_DIALOGUES.E1.composed.emotional[1]`: …テレビか。…っ、…嬉しいね。やらせてもらうよ
- `CHOICE_EVENT_DIALOGUES.E4.ojousama.normal[1]`: 新しいスカウトのお話が、届いているそうです
- `CHOICE_EVENT_DIALOGUES.E4.ojousama.shy[1]`: え、ええと…その…お話のことは…
- `CHOICE_EVENT_DIALOGUES.E4.delinquent.normal[1]`: 新しいスカウトの話、来てるみたいっすよ
- `CHOICE_EVENT_DIALOGUES.E4.delinquent.shy[1]`: え、えっと…その…その話は、あたしからはなんとも…
- `CHOICE_EVENT_DIALOGUES.E4.cool.normal[1]`: …スカウトの報告が来ている
- `CHOICE_EVENT_DIALOGUES.E4.cool.shy[1]`: …えっと。…その件は
- `CHOICE_EVENT_DIALOGUES.E4.seductive.normal[1]`: 新しいスカウトのお話が来てるみたいよ
- `CHOICE_EVENT_DIALOGUES.E4.seductive.shy[1]`: え、ええと…その件は…わたしからは、ちょっと…
- `CHOICE_EVENT_DIALOGUES.E4.composed.normal[1]`: …スカウトから、新しい話が来てるみたいだよ
- `CHOICE_EVENT_DIALOGUES.E4.composed.shy[1]`: …えっと。…その件は、私からはなんとも言えないな
- `CHOICE_EVENT_DIALOGUES.E4.standard.normal[1]`: 新たなスカウト情報が届きました
- `CHOICE_EVENT_DIALOGUES.E4.polite.shy[1]`: え、ええと…そ、その件は…
- `CHOICE_EVENT_DIALOGUES.E6.cool.normal[1]`: …他団体からオファーが来ている
- `CHOICE_EVENT_DIALOGUES.E6.cool.bold[1]`: …他から話が来た。条件は悪くない
- `CHOICE_EVENT_DIALOGUES.E6.cool.quiet[1]`: …他所から来た。報告する
- `CHOICE_EVENT_DIALOGUES.E6.cool.shy[1]`: …あの。…他所から話が来た。…どうすればいい
- `CHOICE_EVENT_DIALOGUES.E6.cool.easygoing[1]`: …他所が私を欲しいらしい。…少し、嬉しい
- `CHOICE_EVENT_DIALOGUES.E6.cool.earnest[1]`: …義理がある。断った。報告まで
- `CHOICE_EVENT_DIALOGUES.E6.cool.earnest[2]`: …離れたくはない。だが、迷ってる
- `CHOICE_EVENT_DIALOGUES.E6.cool.emotional[1]`: …他所から話が来た。…迷ってる
- `CHOICE_EVENT_DIALOGUES.E6.standard.normal[1]`: 他の団体からオファーが来ています
- `CHOICE_EVENT_DIALOGUES.E6.standard.bold[1]`: …本当のことを言うと、いい条件だと思ってる
- `CHOICE_EVENT_DIALOGUES.E6.standard.bold[2]`: 他所から話が来た。考えてもいいでしょ？
- `CHOICE_EVENT_DIALOGUES.E6.standard.quiet[1]`: ………他から、話が（小さな声で）
- `CHOICE_EVENT_DIALOGUES.E6.standard.shy[1]`: あの…他の団体から…その…どうしたらいいか分からなくて…
- `CHOICE_EVENT_DIALOGUES.E6.standard.easygoing[1]`: マジで！？ 他の団体が私を欲しいって！？ ちょっと嬉しいかも…
- `CHOICE_EVENT_DIALOGUES.E6.standard.earnest[1]`: こちらに義理があるので断りましたが…報告しておきます
- `CHOICE_EVENT_DIALOGUES.E6.standard.earnest[2]`: みんなと離れたくない気持ちはあるけど…正直、迷ってます
- `CHOICE_EVENT_DIALOGUES.E6.standard.emotional[1]`: 他の団体からオファーが…どうしよう…迷ってる…
- `CHOICE_EVENT_DIALOGUES.E6.ojousama.normal[1]`: 他の団体からお話がございましたの…
- `CHOICE_EVENT_DIALOGUES.E6.ojousama.bold[1]`: …正直に申しますと、良い条件ですわ
- `CHOICE_EVENT_DIALOGUES.E6.ojousama.quiet[1]`: ………他所から、お話が（声を落として）
- `CHOICE_EVENT_DIALOGUES.E6.ojousama.shy[1]`: あの…他の団体からお話が…その…どうすればよいのか、わからなくて…
- `CHOICE_EVENT_DIALOGUES.E6.ojousama.earnest[1]`: こちらへの義理がございますから…でも、ご報告だけはと思いまして
- `CHOICE_EVENT_DIALOGUES.E6.ojousama.emotional[1]`: 他の団体からお話が…どうしましょう…迷っているんです…
- `CHOICE_EVENT_DIALOGUES.E6.delinquent.normal[1]`: 他所から話来てんだけど
- `CHOICE_EVENT_DIALOGUES.E6.delinquent.bold[1]`: 他所からいい話来てんだよ。考えさせてくれ
- `CHOICE_EVENT_DIALOGUES.E6.delinquent.quiet[1]`: ………他所から、話が来てる（小さな声で）
- `CHOICE_EVENT_DIALOGUES.E6.delinquent.shy[1]`: あの…他所から話が来てて…その…どうしたらいいか、わかんねぇんす…
- `CHOICE_EVENT_DIALOGUES.E6.delinquent.easygoing[1]`: 他所から話来たんだけど！ちょっと嬉しくね？
- `CHOICE_EVENT_DIALOGUES.E6.delinquent.earnest[1]`: 義理があるから断ったけどよ…一応、報告しとく
- `CHOICE_EVENT_DIALOGUES.E6.delinquent.earnest[2]`: みんなと離れたかねぇ…けど、正直、迷ってんだ
- `CHOICE_EVENT_DIALOGUES.E6.delinquent.emotional[1]`: 他所からオファーが来て…どうすりゃいいんだよ…迷ってんだ…
- `CHOICE_EVENT_DIALOGUES.E6.seductive.normal[1]`: 他の団体からお誘いが来てるの
- `CHOICE_EVENT_DIALOGUES.E6.seductive.bold[1]`: 他所からいい話が来てるの。正直、迷ってるわ
- `CHOICE_EVENT_DIALOGUES.E6.seductive.shy[1]`: あの…他所から、お誘いが…その…どうしたらいいか、わからなくて…
- `CHOICE_EVENT_DIALOGUES.E6.seductive.easygoing[1]`: 他所からお誘いが来ちゃった。ちょっと嬉しいかも
- `CHOICE_EVENT_DIALOGUES.E6.seductive.earnest[1]`: 義理があるから断ったけど…報告はしておくわね
- `CHOICE_EVENT_DIALOGUES.E6.seductive.emotional[1]`: いいわよ……っ……ふふ、やってみせるわ……
- `CHOICE_EVENT_DIALOGUES.E6.composed.normal[1]`: …他所から話が来てるんだ。一応報告しておくね
- `CHOICE_EVENT_DIALOGUES.E6.composed.bold[1]`: …悪くない条件なんだよね。…少し考えてもいいかな
- `CHOICE_EVENT_DIALOGUES.E6.composed.quiet[1]`: ………他所から、話が来てるんだ（声を落として）
- `CHOICE_EVENT_DIALOGUES.E6.composed.shy[1]`: …その、他所から話が来ててさ。…どう答えたものか、わからないんだ
- `CHOICE_EVENT_DIALOGUES.E6.composed.easygoing[1]`: …他所が私を欲しいってさ。…ちょっと嬉しいかもね
- `CHOICE_EVENT_DIALOGUES.E6.composed.earnest[1]`: …義理があるから断ったよ。でも、一応報告だけね
- `CHOICE_EVENT_DIALOGUES.E6.composed.emotional[1]`: …他所から話が来てるんだ。…どうしたものかな。正直、迷ってる
- `CHOICE_EVENT_DIALOGUES.E6.polite.quiet[1]`: …他の団体様からお話が…報告しておきます
- `CHOICE_EVENT_DIALOGUES.E6.polite.shy[1]`: は、はい…わかりました…やってみます…
- `CHOICE_EVENT_DIALOGUES.E6.polite.earnest[1]`: こちらに義理がございますので…ただ、ご報告だけは
- `CHOICE_EVENT_DIALOGUES.E6.polite.emotional[1]`: 他の団体からオファーが…どうしたらいいか…迷っています…
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.normal[1]`: ……今日は練習する気分じゃないです
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.normal[2]`: ……すみません、今日は帰ります
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.bold[1]`: 練習？出してもくれないのに何の意味があるのよ？
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.bold[2]`: リングに上がれないなら練習しても仕方ないでしょ
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.quiet[1]`: …………（黙って道場を出ていこうとしている）
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.quiet[2]`: ……すみません…今日は……
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.easygoing[1]`: あはは…今日はちょっとサボりまーす…
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.easygoing[2]`: 練習ねぇ…うーん、今日はパスで
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.earnest[1]`: すみません…今日はどうしても体が動かなくて…
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.earnest[2]`: 練習に集中できなくて…申し訳ありません
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.emotional[1]`: もう無理…練習なんてできない…
- `CHOICE_EVENT_DIALOGUES.S_boycott.standard.emotional[2]`: 出してもらえないのに練習して…何になるの…
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.normal[1]`: 今日はお稽古をお休みさせていただきますわ…理由は…ご想像にお任せしますわ
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.bold[1]`: 練習…？ 出していただけないのに、意味がありますか
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.bold[2]`: リングに上がれないのなら、稽古など無駄でしょう
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.quiet[1]`: …………（何も言わず、静かに道場をあとにしようとしている）
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.quiet[2]`: ……申し訳ありません…今日は……
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.earnest[1]`: 申し訳ありません…今日はどうしても、体が動かなくて…
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.earnest[2]`: 稽古に身が入らなくて…申し訳ありません…
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.emotional[1]`: もう…無理です…稽古など、できません…
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.emotional[2]`: 出していただけないのに、稽古をして…何になるのでしょう…
- `CHOICE_EVENT_DIALOGUES.S_boycott.ojousama.shy[1]`: あの…わたくし…これは、納得できません…
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.normal[1]`: 練習？やる意味あんの？出してもらえねぇんじゃ同じだろ
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.bold[1]`: はぁ？やる気出ないっつの。文句あんなら試合組めよ
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.quiet[1]`: …………（何も言わず、荷物を担いで出ていこうとしている）
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.quiet[2]`: ……悪い…今日は……
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.easygoing[1]`: はは…今日はサボるわ…
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.easygoing[2]`: 練習な…うーん、今日はパスで
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.earnest[1]`: 悪い…今日はどうしても体が動かねぇんだ…
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.earnest[2]`: 練習に集中できなくて…すまねぇ…
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.emotional[1]`: もう無理だ…練習なんかできねぇよ…
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.emotional[2]`: 出してもらえねぇのに練習して…何になんだよ…
- `CHOICE_EVENT_DIALOGUES.S_boycott.delinquent.shy[1]`: あの…その…これは、納得できねぇっす…
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.normal[1]`: …………（荷物をまとめて帰ろうとしている）
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.bold[1]`: …出さないなら、練習する意味がない
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.bold[2]`: …リングに上がれないなら、やるだけ無駄だ
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.quiet[1]`: ………（静かにテーピングを外している）
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.easygoing[1]`: …今日は、やらない
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.easygoing[2]`: …練習。…今日はいい
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.earnest[1]`: …すまない。今日は体が動かない
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.earnest[2]`: …集中できない。悪いが、休ませてくれ
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.emotional[1]`: …もう無理だ。練習はしない
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.emotional[2]`: …出ないのに練習して、何になる
- `CHOICE_EVENT_DIALOGUES.S_boycott.cool.shy[1]`: …あの。…これは、納得できない
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.normal[1]`: ごめんなさいね…今日はちょっと、気持ちが入らなくて
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.bold[1]`: 練習？ 出してもくれないのに、意味があるのかしら
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.bold[2]`: リングに上がれないなら、やっても同じでしょう？
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.easygoing[1]`: ふふ…今日はサボっちゃおうかな…
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.easygoing[2]`: 練習ねぇ…今日は、遠慮しておくわ
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.earnest[1]`: ごめんなさい…今日はどうしても、体が動かなくて…
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.earnest[2]`: 練習に集中できないの…ごめんなさいね…
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.emotional[1]`: ……っ……これは認められないわ、悪いけど……
- `CHOICE_EVENT_DIALOGUES.S_boycott.seductive.shy[1]`: あの…ごめんなさい…これは、納得できないの…
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.normal[1]`: …今日はいいかな。少し考えたいことがあって
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.bold[1]`: …出してもらえないのに、練習する意味あるのかな
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.bold[2]`: …リングに上がれないなら、同じことだよ
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.quiet[1]`: …………（何も言わずに、道場の戸口へ向かっている）
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.quiet[2]`: ……悪いね…今日は……
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.easygoing[1]`: …今日は、休ませてもらおうかな
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.easygoing[2]`: …練習ね。…今日はいいや
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.earnest[1]`: …すまない。今日はどうにも体が動かなくてさ
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.earnest[2]`: …集中できないんだ。…悪いね
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.emotional[1]`: …もう無理だよ。…今日は、やらない
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.emotional[2]`: …出してもらえないのに練習して。…何になるのかな
- `CHOICE_EVENT_DIALOGUES.S_boycott.composed.shy[1]`: …言いにくいんだけど。…これは、納得できないな
- `CHOICE_EVENT_DIALOGUES.S_boycott.polite.quiet[1]`: …………（一礼だけして、道場を出ていこうとしている）
- `CHOICE_EVENT_DIALOGUES.S_boycott.polite.quiet[2]`: ……申し訳ございません…今日は、どうしても……
- `CHOICE_EVENT_DIALOGUES.S_boycott.polite.earnest[1]`: 大変申し訳ございません…今日はどうしても…
- `CHOICE_EVENT_DIALOGUES.S_boycott.polite.emotional[1]`: もう…無理です…練習なんて、できません…
- `CHOICE_EVENT_DIALOGUES.S_boycott.polite.emotional[2]`: 出していただけないのに練習して…何になるんですか…
- `CHOICE_EVENT_DIALOGUES.S_boycott.polite.shy[1]`: あ、あの…これは、納得できません…
- `CHOICE_EVENT_DIALOGUES.S_grumble.standard.normal[1]`: （ロッカールームで不満を漏らしている…周囲に伝播し始めた）
- `CHOICE_EVENT_DIALOGUES.S_grumble.standard.bold[1]`: （「なんで私たちがこんな扱い受けなきゃいけないんだ」と大声で言っている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.standard.quiet[1]`: （黙っているが、その沈黙がかえって周囲を不安にさせている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.standard.easygoing[1]`: （いつもの笑顔が消え、「ちょっとさぁ…」と珍しく愚痴をこぼしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.standard.earnest[1]`: （「自分、このままでいいんですかね…」と後輩に弱音を吐いている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.standard.emotional[1]`: （涙ぐみながら「もう限界かも…」とチームメイトに打ち明けている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.ojousama.normal[1]`: （控室で「あの方の采配、少しおかしくなくて？」と囁いている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.ojousama.bold[1]`: （「この扱いの意味、伺いたいものね」と控室で静かに笑ってみせる）
- `CHOICE_EVENT_DIALOGUES.S_grumble.ojousama.quiet[1]`: （一言も発しないまま、その静けさが控室を重くしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.ojousama.earnest[1]`: （「わたくし、このままでよろしいのでしょうか」と後輩に弱音を漏らしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.ojousama.emotional[1]`: （目を潤ませて「もう限界かもしれません」と仲間に打ち明けている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.ojousama.shy[1]`: あの…わたくし…少しだけ、不満がございます…
- `CHOICE_EVENT_DIALOGUES.S_grumble.delinquent.normal[1]`: （「マジふざけんな」とロッカーを蹴る音が聞こえてきた）
- `CHOICE_EVENT_DIALOGUES.S_grumble.delinquent.bold[1]`: （「なんで私らがこんな扱い受けなきゃなんねぇんだよ」とロッカーで吠えている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.delinquent.quiet[1]`: （何も言わず壁にもたれているが、その空気に誰も近づけない）
- `CHOICE_EVENT_DIALOGUES.S_grumble.delinquent.easygoing[1]`: （いつもの軽口が消え、「なぁ、ちょっとさぁ…」と珍しく愚痴をこぼしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.delinquent.earnest[1]`: （「あたし、このままでいいのかな…」と後輩に珍しく弱音を吐いている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.delinquent.emotional[1]`: （目を赤くして「もう限界かもしんねぇ」と仲間にこぼしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.delinquent.shy[1]`: あの…すんません…ちょっと、不満があるんす…
- `CHOICE_EVENT_DIALOGUES.S_grumble.cool.normal[1]`: （無言で佇んでいるが、周囲が気を遣って重い空気になっている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.cool.bold[1]`: （「…この扱いは筋が通らない」と低く言い放ち、周囲が黙り込んだ）
- `CHOICE_EVENT_DIALOGUES.S_grumble.cool.quiet[1]`: （無言のまま動かず、周囲だけが落ち着かなくなっている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.cool.easygoing[1]`: （いつもの軽さが消え、「…ちょっと、さ」とだけ漏らして黙り込んだ）
- `CHOICE_EVENT_DIALOGUES.S_grumble.cool.earnest[1]`: （「…このままでいいのか」と、後輩にだけ短く漏らしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.cool.emotional[1]`: （「…もう限界かもしれない」と、声を殺して仲間に漏らしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.cool.shy[1]`: …あの。…少し、不満がある
- `CHOICE_EVENT_DIALOGUES.S_grumble.seductive.normal[1]`: （「最近、ここにいる意味あるのかしら」と同僚に漏らしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.seductive.bold[1]`: （「私たち、ずいぶん軽く見られてるのね」と笑みを崩さずに言い放っている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.seductive.easygoing[1]`: （笑顔が消え、「ねえ…ちょっと聞いてよ」と同僚に愚痴をこぼしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.seductive.earnest[1]`: （「私、このままでいいのかしら」と後輩に弱音を漏らしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.seductive.emotional[1]`: 正直に言うわね……っ……ちょっと不満なの……
- `CHOICE_EVENT_DIALOGUES.S_grumble.seductive.shy[1]`: あの…ごめんなさい…少し、不満があるの…
- `CHOICE_EVENT_DIALOGUES.S_grumble.composed.normal[1]`: （いつもの穏やかさが消え、「…ま、そういうことだよね」と静かに呟いている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.composed.bold[1]`: （「…この扱いは、さすがに通らないよ」と静かに言い切り、場が凍りついた）
- `CHOICE_EVENT_DIALOGUES.S_grumble.composed.quiet[1]`: （何も言わないが、その静けさがかえってロッカーを重くしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.composed.easygoing[1]`: （いつもの飄々とした顔が消え、「…ちょっとさ」と珍しく愚痴をこぼしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.composed.earnest[1]`: （「…このままでいいのかな」と、後輩相手に珍しく弱音を漏らしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.composed.emotional[1]`: （感情を押し殺した声で「…もう限界かもね」と仲間にだけ漏らしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.composed.shy[1]`: …言いにくいんだけど。…少し、不満があってさ
- `CHOICE_EVENT_DIALOGUES.S_grumble.polite.quiet[1]`: （黙って頭を下げるだけで、その沈黙が周囲を不安にさせている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.polite.earnest[1]`: （「私、このままでいいんでしょうか…」と後輩に弱音をこぼしている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.polite.emotional[1]`: （涙をこらえながら「もう限界かもしれません」と仲間に打ち明けている）
- `CHOICE_EVENT_DIALOGUES.S_grumble.polite.shy[1]`: すみません…少し、不満があります…
- `CHOICE_EVENT_DIALOGUES.S_sns.standard.normal[1]`: （SNSに「自分の居場所はどこなんだろう」と意味深な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.standard.bold[1]`: （SNSに「このまま終わるつもりはない」と宣言的な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.standard.quiet[1]`: （SNSに「…」とだけ投稿。ファンの間で憶測が広がっている）
- `CHOICE_EVENT_DIALOGUES.S_sns.standard.easygoing[1]`: （SNSに「最近ちょっと考えることがあってー」と珍しく真面目な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.standard.earnest[1]`: （SNSに「自分は本当にここで必要とされているのか」と率直な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.standard.emotional[1]`: （SNSに涙の絵文字と「もうダメかもしれない」と投稿。炎上し始めている）
- `CHOICE_EVENT_DIALOGUES.S_sns.ojousama.normal[1]`: （SNSに「窮屈な場所からは、いつでも出ていけますの」と投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.ojousama.bold[1]`: （SNSに「このまま終わるつもりはございません」と宣言めいた投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.ojousama.quiet[1]`: （SNSに白い花の写真だけを投稿。ファンの間で憶測が飛び交っている）
- `CHOICE_EVENT_DIALOGUES.S_sns.ojousama.earnest[1]`: （SNSに「わたくしは本当に必要とされているのでしょうか」と率直な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.ojousama.emotional[1]`: （SNSに涙の絵文字をひとつ添えて「…もう、限界かもしれません」と投稿。騒ぎが広がっている）
- `CHOICE_EVENT_DIALOGUES.S_sns.ojousama.shy[1]`: あの…SNSで、あんなふうに書かれてしまって…
- `CHOICE_EVENT_DIALOGUES.S_sns.delinquent.normal[1]`: （SNSに「もう我慢の限界」と不穏な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.delinquent.bold[1]`: （SNSに「このまま終わる気はねぇから」と宣戦布告じみた投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.delinquent.quiet[1]`: （SNSに「…」とだけ投稿。何も語らないぶん、ファンがざわついている）
- `CHOICE_EVENT_DIALOGUES.S_sns.delinquent.easygoing[1]`: （SNSに「最近ちょい考えることあってさ」と珍しく真面目な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.delinquent.earnest[1]`: （SNSに「あたし、ここで本当に必要とされてんのかな」と率直な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.delinquent.emotional[1]`: （SNSに涙の絵文字と「もう無理かもしんねぇ」と投稿。炎上し始めている）
- `CHOICE_EVENT_DIALOGUES.S_sns.delinquent.shy[1]`: あの…SNSで、あんな風に書かれちまって…
- `CHOICE_EVENT_DIALOGUES.S_sns.cool.normal[1]`: （SNSに風景写真と「遠くへ」とだけ投稿。ファンがざわついている）
- `CHOICE_EVENT_DIALOGUES.S_sns.cool.bold[1]`: （SNSに「まだ終わらない」とだけ投稿。ファンがざわついている）
- `CHOICE_EVENT_DIALOGUES.S_sns.cool.quiet[1]`: （SNSに点を三つ置いただけの投稿。ファンの憶測だけが広がっていく）
- `CHOICE_EVENT_DIALOGUES.S_sns.cool.easygoing[1]`: （SNSに「…最近、考えることがある」と珍しく本音めいた投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.cool.earnest[1]`: （SNSに「…必要とされているのか、わからない」と短く投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.cool.emotional[1]`: （SNSに涙の絵文字ひとつと「…もう無理かもしれない」と投稿。騒ぎが広がっている）
- `CHOICE_EVENT_DIALOGUES.S_sns.cool.shy[1]`: …あの。…SNSで、あんなふうに書かれてしまって
- `CHOICE_EVENT_DIALOGUES.S_sns.seductive.normal[1]`: （SNSに「次のステージが待っているかも」と匂わせ投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.seductive.bold[1]`: （SNSに「このまま終わるつもりはないの。楽しみにしてて」と投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.seductive.easygoing[1]`: （SNSに「最近ね、ちょっと考えることがあるの」と珍しく素の投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.seductive.earnest[1]`: （SNSに「私、ここで必要とされているのかしら」と率直な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.seductive.emotional[1]`: SNS見たわ……っ……ふふ、勝手な人たちね……
- `CHOICE_EVENT_DIALOGUES.S_sns.seductive.shy[1]`: え、SNSで…あんなふうに書かれてしまって…
- `CHOICE_EVENT_DIALOGUES.S_sns.composed.normal[1]`: （SNSに夕焼けの写真と「…少し考える時間が欲しいかな」と投稿。ファンがざわついている）
- `CHOICE_EVENT_DIALOGUES.S_sns.composed.bold[1]`: （SNSに「…このまま終わるつもりはないよ」と静かな宣言を投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.composed.quiet[1]`: （SNSに何も書かず、夜の窓の写真だけを投稿。ファンがざわついている）
- `CHOICE_EVENT_DIALOGUES.S_sns.composed.easygoing[1]`: （SNSに「…最近、少し考えることがあってね」と珍しく本音めいた投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.composed.earnest[1]`: （SNSに「…私はここで必要とされてるのかな」と、珍しく率直な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.composed.emotional[1]`: （SNSに涙の絵文字と「…もう駄目かもしれないね」と投稿。静かな文面だけに騒ぎが大きくなっている）
- `CHOICE_EVENT_DIALOGUES.S_sns.composed.shy[1]`: …SNSでね。…あんなふうに書かれてしまって
- `CHOICE_EVENT_DIALOGUES.S_sns.polite.quiet[1]`: （SNSに「…すみません」とだけ投稿。ファンの間で憶測が広がっている）
- `CHOICE_EVENT_DIALOGUES.S_sns.polite.earnest[1]`: （SNSに「私は本当にここで必要とされているんでしょうか」と率直な投稿）
- `CHOICE_EVENT_DIALOGUES.S_sns.polite.emotional[1]`: （SNSに涙の絵文字と「もう駄目かもしれません」と投稿。炎上し始めている）
- `CHOICE_EVENT_DIALOGUES.S_sns.polite.shy[1]`: え、SNSで…そんな風に書かれてしまって…

## `CHOICE_EVENT_RESULT_DIALOGUES`

- 出典: `src/data.js`
- コード内コメント: 選択型イベント 結果セリフ（成功時の喜びリアクションなど） / 構造: CHOICE_EVENT_RESULT_DIALOGUES[type][outcome][archetype][personality] / outcome: 'accept'(出す/受ける成功), 'recommend'(別の選手推薦時、推薦された選手のリアクション)
- 本数: 19

- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.standard.normal[1]`: 出演のお話、ありがたくお受けします
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.standard.bold[1]`: 任せてよ、ばっちり爪痕残してくる!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.standard.quiet[1]`: ……出る。頑張る
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.standard.shy[1]`: は、はい…！せ、精一杯やります…！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.standard.easygoing[1]`: やったー！カメラの前で何しよっかな！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.standard.earnest[1]`: お任せください…精一杯務めます
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.standard.emotional[1]`: ほんとに……！？ 嬉しい……っ……頑張ります……！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.polite.normal[1]`: やりました……！夢みたいです、本当にありがとうございます
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.polite.bold[1]`: やりました！　全力でぶつかれば、届くんですね！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.polite.easygoing[1]`: やったー！信じられない、夢みたい……！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.seductive.quiet[1]`: ……やれた。……嬉しい
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.accept.ojousama.easygoing[1]`: まあ、成功いたしましたの！わたくし、嬉しくて仕方ありませんわ！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.standard.normal[1]`: えっ、私ですか？ ……はい、頑張ります！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.standard.bold[1]`: お、私に来た!? いいよ、任せて!
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.standard.quiet[1]`: ……私で、いいんですか。……やります
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.standard.shy[1]`: えっ、わ、わたしが…！？ が、頑張ります……！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.standard.easygoing[1]`: えー！？ 私でいいの？ やったー！
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.standard.earnest[1]`: ご指名、ありがとうございます。精一杯やります
- `CHOICE_EVENT_RESULT_DIALOGUES.E1.recommend.standard.emotional[1]`: えっ、私に……！？ う、嬉しい……！

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
- 本数: 469

- `LARGE_EVENT_DIALOGUES.B1.standard.normal[1]`: …痛みが引くまで少し時間がかかりそうです
- `LARGE_EVENT_DIALOGUES.B1.standard.bold[1]`: くそっ…こんなところで足を止めるわけにはいかないのに
- `LARGE_EVENT_DIALOGUES.B1.standard.bold[2]`: 大丈夫。この程度…すぐ直るから
- `LARGE_EVENT_DIALOGUES.B1.standard.quiet[1]`: ……すみません
- `LARGE_EVENT_DIALOGUES.B1.standard.shy[1]`: す、すみません…ご迷惑を…早く治します…
- `LARGE_EVENT_DIALOGUES.B1.standard.easygoing[1]`: いてて…やっちゃいました。でも根性で治します！
- `LARGE_EVENT_DIALOGUES.B1.standard.earnest[1]`: すみません…もっと注意するべきでした。早く復帰できるよう頑張ります
- `LARGE_EVENT_DIALOGUES.B1.standard.emotional[1]`: ごめんなさい…！早く治します…早く戻りたい…！
- `LARGE_EVENT_DIALOGUES.B1.ojousama.normal[1]`: 少しお時間をいただくことになりそうですわ…
- `LARGE_EVENT_DIALOGUES.B1.ojousama.bold[1]`: こんなところで止まるわけにはいかないわ…
- `LARGE_EVENT_DIALOGUES.B1.ojousama.quiet[1]`: ……不覚ですわ。……ごめんなさい
- `LARGE_EVENT_DIALOGUES.B1.ojousama.shy[1]`: ご、ご迷惑をおかけして…お恥ずかしいですわ…早く治しますから…
- `LARGE_EVENT_DIALOGUES.B1.ojousama.earnest[1]`: もっと気をつけるべきでしたわ…早く復帰して見せますの
- `LARGE_EVENT_DIALOGUES.B1.ojousama.emotional[1]`: ごめんなさい…！早く治しますわ…早く、戻りたいの…！
- `LARGE_EVENT_DIALOGUES.B1.delinquent.normal[1]`: いてて…やっちまった。すぐ戻るから
- `LARGE_EVENT_DIALOGUES.B1.delinquent.bold[1]`: くそっ…こんなとこで止まってらんねえ！
- `LARGE_EVENT_DIALOGUES.B1.delinquent.quiet[1]`: ……悪い。すぐ治す
- `LARGE_EVENT_DIALOGUES.B1.delinquent.shy[1]`: す、すんません…迷惑かけて…すぐ治すんで…
- `LARGE_EVENT_DIALOGUES.B1.delinquent.easygoing[1]`: いった！やっちまったけど、すぐ治すから！
- `LARGE_EVENT_DIALOGUES.B1.delinquent.earnest[1]`: すんません…もっと気をつけるべきだった。早く戻れるように頑張るんで
- `LARGE_EVENT_DIALOGUES.B1.delinquent.emotional[1]`: くそっ…悪い…！すぐ治す…！早く戻りてえ…！
- `LARGE_EVENT_DIALOGUES.B1.seductive.normal[1]`: …少し時間がかかりそう。ごめんなさいね
- `LARGE_EVENT_DIALOGUES.B1.seductive.bold[1]`: こんなところで止まるつもりはないわ…すぐ戻る
- `LARGE_EVENT_DIALOGUES.B1.seductive.shy[1]`: ごめんなさい…迷惑かけて…すぐ、治すから…
- `LARGE_EVENT_DIALOGUES.B1.seductive.easygoing[1]`: あら、やっちゃった…でもすぐ治すわ
- `LARGE_EVENT_DIALOGUES.B1.seductive.earnest[1]`: ごめんなさい…早く戻れるように頑張るわ
- `LARGE_EVENT_DIALOGUES.B1.seductive.emotional[1]`: これから……っ……やりたいこと、いっぱいあるの……
- `LARGE_EVENT_DIALOGUES.B1.composed.normal[1]`: …やっちゃったね。まあ、焦らず治すよ
- `LARGE_EVENT_DIALOGUES.B1.composed.bold[1]`: …まあ、こういうこともあるよ。少し待ってて
- `LARGE_EVENT_DIALOGUES.B1.composed.quiet[1]`: ……ごめん。…すぐ戻るよ
- `LARGE_EVENT_DIALOGUES.B1.composed.shy[1]`: …ごめんね。迷惑かけて…ちゃんと治すよ
- `LARGE_EVENT_DIALOGUES.B1.composed.easygoing[1]`: …いてて。やっちゃったものは仕方ないね。ちゃんと治すよ
- `LARGE_EVENT_DIALOGUES.B1.composed.earnest[1]`: …不注意だったね。きちんと治して、ちゃんと戻るよ
- `LARGE_EVENT_DIALOGUES.B1.composed.emotional[1]`: …っ…すぐ治す。…早く戻りたいんだ
- `LARGE_EVENT_DIALOGUES.B1.cool.bold[1]`: …すぐ戻る。問題ない
- `LARGE_EVENT_DIALOGUES.B1.cool.quiet[1]`: …すぐ戻る
- `LARGE_EVENT_DIALOGUES.B1.cool.shy[1]`: …すみません。…すぐ治す
- `LARGE_EVENT_DIALOGUES.B1.cool.easygoing[1]`: …いてて。…まあ、治す
- `LARGE_EVENT_DIALOGUES.B1.cool.earnest[1]`: …不注意だった。…早く戻る
- `LARGE_EVENT_DIALOGUES.B1.cool.emotional[1]`: …っ…すぐ治す。…早く戻りたい
- `LARGE_EVENT_DIALOGUES.B1.polite.quiet[1]`: …申し訳ございません。すぐに戻ります
- `LARGE_EVENT_DIALOGUES.B1.polite.shy[1]`: あ、あの…これから、頑張りたいことがあります…
- `LARGE_EVENT_DIALOGUES.B1.polite.earnest[1]`: 申し訳ございません…一日も早く復帰いたします
- `LARGE_EVENT_DIALOGUES.B1.polite.emotional[1]`: ごめんなさい…！早く…早く治します…戻りたいんです…！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.normal[1]`: このままじゃチームがもたない。何とかしてほしい
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.bold[1]`: あいつの態度が許せない。もう我慢の限界よ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.bold[2]`: チームのためにも、この問題ははっきりさせるべき！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.quiet[1]`: ………あの人とは、もう…
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.shy[1]`: あの…あの人のこと…もう…どうしたらいいか…
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.easygoing[1]`: あいつとはもう無理！顔も見たくない！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.earnest[1]`: 手を抜く人と同じリングには立てない
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.earnest[2]`: このままでは団体のためにならない。何とかしてほしい
- `LARGE_EVENT_DIALOGUES.B2_fighter1.standard.emotional[1]`: もう無理…！あの人と一緒にいると…辛い…！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.ojousama.normal[1]`: あの方とは…もう限界ですわ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.ojousama.bold[1]`: あの女の態度は許せないわね……
- `LARGE_EVENT_DIALOGUES.B2_fighter1.ojousama.quiet[1]`: ………あの方とは、もう…無理ですの
- `LARGE_EVENT_DIALOGUES.B2_fighter1.ojousama.shy[1]`: あの…あの方のこと…もう、どうしたらよいのか…わたくし…
- `LARGE_EVENT_DIALOGUES.B2_fighter1.ojousama.earnest[1]`: あの方とは…チームのためにもはっきりさせるべきですわ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.ojousama.emotional[1]`: もう無理ですわ…！あの方と一緒にいると…苦しくて…！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.delinquent.normal[1]`: あいつとはもう無理だ。何とかしてくれ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.delinquent.bold[1]`: あいつの態度が気に食わねえ！限界だ！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.delinquent.quiet[1]`: ………あいつとは、もう…無理だ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.delinquent.shy[1]`: あの…あいつのこと…もう、どうしていいか…わかんなくて…
- `LARGE_EVENT_DIALOGUES.B2_fighter1.delinquent.easygoing[1]`: あいつマジ無理！もう顔も見たくねえ！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.delinquent.earnest[1]`: 足引っ張るやつとは一緒にやれねえ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.delinquent.earnest[2]`: このままじゃ団体のためにならねえ。何とかしてくれ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.delinquent.emotional[1]`: もう無理だ…！あいつといると…しんどいんだよ…！
- `LARGE_EVENT_DIALOGUES.B2_fighter1.seductive.normal[1]`: あの人とはもう無理よ。何とかしてもらえないかしら
- `LARGE_EVENT_DIALOGUES.B2_fighter1.seductive.bold[1]`: あの人の態度、もう我慢できないの
- `LARGE_EVENT_DIALOGUES.B2_fighter1.seductive.shy[1]`: あの…あの人のこと、なんだけど…もう、どうしたら…
- `LARGE_EVENT_DIALOGUES.B2_fighter1.seductive.easygoing[1]`: あの人とはもう無理。顔も見たくないわ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.seductive.earnest[1]`: あの人と一緒じゃ仕事にならないの。何とかして
- `LARGE_EVENT_DIALOGUES.B2_fighter1.seductive.emotional[1]`: ねえ……っ……ちょっと話、聞いてくれる？
- `LARGE_EVENT_DIALOGUES.B2_fighter1.composed.normal[1]`: …まあ、合わない人もいるよね。少し距離を置きたいな
- `LARGE_EVENT_DIALOGUES.B2_fighter1.composed.bold[1]`: …悪いけど、あの人とはちょっと厳しいかな
- `LARGE_EVENT_DIALOGUES.B2_fighter1.composed.quiet[1]`: ……あの人とは…もう、いいかな
- `LARGE_EVENT_DIALOGUES.B2_fighter1.composed.shy[1]`: …あの人のこと…もう、どうしたらいいのかな…
- `LARGE_EVENT_DIALOGUES.B2_fighter1.composed.easygoing[1]`: …あの人とはもう無理かな。顔も合わせたくないよ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.composed.earnest[1]`: …無理に合わせても仕方ないからね。整理してもらえると助かるよ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.composed.emotional[1]`: …もう無理だよ。…あの人といると、息が詰まる
- `LARGE_EVENT_DIALOGUES.B2_fighter1.cool.bold[1]`: …あいつとは合わない。決着をつける
- `LARGE_EVENT_DIALOGUES.B2_fighter1.cool.quiet[1]`: …あれとは合わない。それだけだ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.cool.shy[1]`: …あの人のこと…もう、限界だ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.cool.easygoing[1]`: …あいつとは無理だ。顔も見たくない
- `LARGE_EVENT_DIALOGUES.B2_fighter1.cool.earnest[1]`: …足を引っ張る人間とは組めない
- `LARGE_EVENT_DIALOGUES.B2_fighter1.cool.earnest[2]`: …このままでは団体に響く。手を打ってくれ
- `LARGE_EVENT_DIALOGUES.B2_fighter1.cool.emotional[1]`: …もう無理だ。…あの人といると、きつい
- `LARGE_EVENT_DIALOGUES.B2_fighter1.polite.quiet[1]`: …あの方とは…申し訳ありません、もう限界です
- `LARGE_EVENT_DIALOGUES.B2_fighter1.polite.shy[1]`: お、お話を聞かせていただけますか…？
- `LARGE_EVENT_DIALOGUES.B2_fighter1.polite.earnest[1]`: あの方とは…このままではチームに影響が出ます
- `LARGE_EVENT_DIALOGUES.B2_fighter1.polite.emotional[1]`: もう…もう無理です…！あの方と一緒にいると…辛くて…！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.normal[1]`: 向こうにも非があるのに、私だけ悪いみたいに…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.bold[1]`: 私だって黙ってない。向こうが謝るべきでしょ？
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.bold[2]`: 正面からぶつかって決着つけるしかないわね
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.quiet[1]`: ………（静かに俯いている）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.shy[1]`: …私が悪いんでしょうか…（不安そうに）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.easygoing[1]`: 売られたケンカは買うよ！来いよ！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.earnest[1]`: 団体には迷惑をかけたくないけど…あの人とは無理です
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.earnest[2]`: 私のやり方に文句があるなら、はっきり言えばいい
- `LARGE_EVENT_DIALOGUES.B2_fighter2.standard.emotional[1]`: 私だって…！私だって辛いのに…！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.ojousama.normal[1]`: あちらにも非がおありでしょうに…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.ojousama.bold[1]`: 私も黙ってはいられませんわ。あちらに非があるのだから
- `LARGE_EVENT_DIALOGUES.B2_fighter2.ojousama.quiet[1]`: ………（背筋を伸ばしたまま、目を伏せている）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.ojousama.shy[1]`: …わたくしが悪いのでしょうか…（不安そうに指を絡めて）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.ojousama.earnest[1]`: 団体にご迷惑はかけたくありませんのに…あの方とは…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.ojousama.emotional[1]`: わたくしだって…！わたくしだって、辛いんですのに…！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.delinquent.normal[1]`: 向こうが悪いんだろ。なんで私だけ？
- `LARGE_EVENT_DIALOGUES.B2_fighter2.delinquent.bold[1]`: 黙ってると思うなよ！向こうが謝れ！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.delinquent.quiet[1]`: ………（壁に背を預けて、そっぽを向いている）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.delinquent.shy[1]`: …あたしが悪いんすかね…（下を向いたまま）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.delinquent.easygoing[1]`: やんのか！？ 売られたケンカは買うぜ！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.delinquent.earnest[1]`: 団体に迷惑はかけたくねえ…けど、あいつとは無理だ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.delinquent.earnest[2]`: あたしのやり方に文句があんなら、はっきり言えよ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.delinquent.emotional[1]`: あたしだって…！あたしだって辛いんだよ…！
- `LARGE_EVENT_DIALOGUES.B2_fighter2.seductive.normal[1]`: 向こうにも非があるのに…私だけが悪いの？
- `LARGE_EVENT_DIALOGUES.B2_fighter2.seductive.bold[1]`: 黙ってるつもりはないわ。向こうが悪いんだから
- `LARGE_EVENT_DIALOGUES.B2_fighter2.seductive.shy[1]`: …私が、悪いの…？（声が小さくなる）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.seductive.easygoing[1]`: ケンカ売ってきたのは向こうよ？ 買ってあげるわ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.seductive.earnest[1]`: 迷惑はかけたくないけど…あの人とはもう無理なの
- `LARGE_EVENT_DIALOGUES.B2_fighter2.seductive.emotional[1]`: いいわよ……っ……話してみて……
- `LARGE_EVENT_DIALOGUES.B2_fighter2.composed.normal[1]`: …ふぅん。まあ、お互い様だと思うけどね
- `LARGE_EVENT_DIALOGUES.B2_fighter2.composed.bold[1]`: …私は私のやり方を変えるつもりはないよ。それだけ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.composed.quiet[1]`: ………（黙ったまま、静かに息を吐いている）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.composed.shy[1]`: …私が悪いのかな…（小さく息を吐いて）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.composed.easygoing[1]`: …売られたなら、買うよ。…いつでもどうぞ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.composed.earnest[1]`: …迷惑はかけたくないんだけどね。うまくいかないものだね
- `LARGE_EVENT_DIALOGUES.B2_fighter2.composed.emotional[1]`: …私だって辛いんだよ。…わかってないだろうけど
- `LARGE_EVENT_DIALOGUES.B2_fighter2.cool.bold[1]`: …謝る気はない。向こうが非を認めるべきだ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.cool.quiet[1]`: …私は間違っていない
- `LARGE_EVENT_DIALOGUES.B2_fighter2.cool.shy[1]`: …私が悪いのか…（視線を落として）
- `LARGE_EVENT_DIALOGUES.B2_fighter2.cool.easygoing[1]`: …売られたケンカは買う。来い
- `LARGE_EVENT_DIALOGUES.B2_fighter2.cool.earnest[1]`: …団体に迷惑はかけたくない。でも、あの人とは無理だ
- `LARGE_EVENT_DIALOGUES.B2_fighter2.cool.earnest[2]`: …文句があるなら、はっきり言えばいい
- `LARGE_EVENT_DIALOGUES.B2_fighter2.cool.emotional[1]`: …私だって。…私だって、辛い
- `LARGE_EVENT_DIALOGUES.B2_fighter2.polite.quiet[1]`: …あの方とは…すみません、もう…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.polite.shy[1]`: は、はい…お聞きします…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.polite.earnest[1]`: 団体にご迷惑はかけたくないのですが…あの方とは…
- `LARGE_EVENT_DIALOGUES.B2_fighter2.polite.emotional[1]`: 私だって…私だって、辛いんです…！
- `LARGE_EVENT_DIALOGUES.B4.standard.normal[1]`: 取材…緊張しますが、いい試合を見せられるよう頑張ります
- `LARGE_EVENT_DIALOGUES.B4.standard.bold[1]`: いい機会ね。全国に私の実力を見せつけてやる
- `LARGE_EVENT_DIALOGUES.B4.standard.bold[2]`: 団体の代表として、恥ずかしくない姿を見せる
- `LARGE_EVENT_DIALOGUES.B4.standard.quiet[1]`: …がんばります
- `LARGE_EVENT_DIALOGUES.B4.standard.shy[1]`: え…わ、私なんかでいいんですか…？ が、頑張ります…！
- `LARGE_EVENT_DIALOGUES.B4.standard.easygoing[1]`: マジで！？ テレビに出れるの！？ やったー！
- `LARGE_EVENT_DIALOGUES.B4.standard.easygoing[2]`: ファンの皆さんにもっと近い姿を見せられるね！
- `LARGE_EVENT_DIALOGUES.B4.standard.earnest[1]`: 私でいいんですか？ …精一杯やらせていただきます！
- `LARGE_EVENT_DIALOGUES.B4.standard.emotional[1]`: えっ…テレビ…！？ 私が…！？ 頑張ります…！頑張ります…！
- `LARGE_EVENT_DIALOGUES.B4.ojousama.normal[1]`: 取材ですか？ 精一杯務めさせていただきます
- `LARGE_EVENT_DIALOGUES.B4.ojousama.bold[1]`: あらあら、全国の皆様も私の事が気にかかるのかしら？
- `LARGE_EVENT_DIALOGUES.B4.ojousama.quiet[1]`: …務めさせていただきますわ
- `LARGE_EVENT_DIALOGUES.B4.ojousama.shy[1]`: え…わ、わたくしでよろしいんですの…？ が、頑張りますわ…！
- `LARGE_EVENT_DIALOGUES.B4.ojousama.earnest[1]`: 私でよろしいのですか…？ 精一杯頑張りますわ
- `LARGE_EVENT_DIALOGUES.B4.ojousama.emotional[1]`: えっ、取材…！？ わたくしが…！？ 頑張りますわ…！頑張りますの…！
- `LARGE_EVENT_DIALOGUES.B4.delinquent.normal[1]`: 取材？ やってやるよ！
- `LARGE_EVENT_DIALOGUES.B4.delinquent.bold[1]`: 全国に見せてやるぜ！かかってこい！
- `LARGE_EVENT_DIALOGUES.B4.delinquent.quiet[1]`: …ん。まあ、やるっす
- `LARGE_EVENT_DIALOGUES.B4.delinquent.shy[1]`: え…あ、あたしなんかでいいんすか…？ が、頑張るんで…！
- `LARGE_EVENT_DIALOGUES.B4.delinquent.easygoing[1]`: テレビ！？ マジ！？ やったー！
- `LARGE_EVENT_DIALOGUES.B4.delinquent.earnest[1]`: あたしでいいんすか？ …精一杯やるんで
- `LARGE_EVENT_DIALOGUES.B4.delinquent.emotional[1]`: えっ、テレビ…！？ あたしが…！？ やる…！やってやる…！
- `LARGE_EVENT_DIALOGUES.B4.seductive.normal[1]`: 取材ね…いい姿を見せてあげるわ
- `LARGE_EVENT_DIALOGUES.B4.seductive.bold[1]`: 全国に見てもらえるのね。楽しみだわ
- `LARGE_EVENT_DIALOGUES.B4.seductive.shy[1]`: え…私で、いいの…？ が、頑張る…
- `LARGE_EVENT_DIALOGUES.B4.seductive.easygoing[1]`: テレビに出れるの？ 嬉しい。もっと見てもらえるわね
- `LARGE_EVENT_DIALOGUES.B4.seductive.earnest[1]`: 私でいいの？ …精一杯頑張るわ
- `LARGE_EVENT_DIALOGUES.B4.seductive.emotional[1]`: このお仕事……っ……ふふ、面白そうね……
- `LARGE_EVENT_DIALOGUES.B4.composed.normal[1]`: …取材か。まあ、いつも通りやるよ
- `LARGE_EVENT_DIALOGUES.B4.composed.bold[1]`: …いい機会だね。自分らしくやらせてもらうよ
- `LARGE_EVENT_DIALOGUES.B4.composed.quiet[1]`: …わかった。…やってみるよ
- `LARGE_EVENT_DIALOGUES.B4.composed.shy[1]`: …私でいいのかな。…まあ、やってみるよ
- `LARGE_EVENT_DIALOGUES.B4.composed.easygoing[1]`: …テレビに出られるんだ。…悪くないね
- `LARGE_EVENT_DIALOGUES.B4.composed.easygoing[2]`: …ファンにもう少し近づける。…いい話だよ
- `LARGE_EVENT_DIALOGUES.B4.composed.earnest[1]`: …なるほど、私でいいんだ。悪くない話だね
- `LARGE_EVENT_DIALOGUES.B4.composed.emotional[1]`: …っ…私が、か。…やるよ
- `LARGE_EVENT_DIALOGUES.B4.cool.bold[1]`: …いい機会だ。結果で語る
- `LARGE_EVENT_DIALOGUES.B4.cool.quiet[1]`: …やる。見ていてくれ
- `LARGE_EVENT_DIALOGUES.B4.cool.shy[1]`: …私でいいのか。…やる
- `LARGE_EVENT_DIALOGUES.B4.cool.easygoing[1]`: …テレビか。…出る
- `LARGE_EVENT_DIALOGUES.B4.cool.easygoing[2]`: …ファンに近い姿を見せられる。悪くない
- `LARGE_EVENT_DIALOGUES.B4.cool.earnest[1]`: …私でいいのか。…全力でやる
- `LARGE_EVENT_DIALOGUES.B4.cool.emotional[1]`: …っ…私が。…やる
- `LARGE_EVENT_DIALOGUES.B4.polite.quiet[1]`: …精一杯、頑張らせていただきます
- `LARGE_EVENT_DIALOGUES.B4.polite.shy[1]`: こ、こんなお仕事、わたしに務まるでしょうか…
- `LARGE_EVENT_DIALOGUES.B4.polite.earnest[1]`: 私でよろしいんですか…？ 精一杯務めさせていただきます
- `LARGE_EVENT_DIALOGUES.B4.polite.emotional[1]`: えっ…テレビ…！？ 私が、ですか…！？ 頑張ります…！頑張ります…！
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.normal[1]`: CMか…ちゃんとできるかな。頑張ってみます
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.bold[1]`: CMで私の顔を全国に売り込む。完璧にやってみせる
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.bold[2]`: このチャンス、最大限に使ってやる
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.quiet[1]`: …やります
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.shy[1]`: わ、私がCMに…？ ほ、本当に大丈夫ですか…？
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.easygoing[1]`: CM！？ 私ってもしかして売れっ子？♪
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.easygoing[2]`: どんなCMになるんだろ〜楽しみ♪
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.earnest[1]`: CM出演、しっかり準備します。恥ずかしくない姿を
- `LARGE_EVENT_DIALOGUES.B4_cm.standard.emotional[1]`: CMに出るの…！？ うわあああ緊張する！でもやる！
- `LARGE_EVENT_DIALOGUES.B4_cm.ojousama.normal[1]`: CMですか。しっかりお役目を果たしますわ
- `LARGE_EVENT_DIALOGUES.B4_cm.ojousama.bold[1]`: CM？仕方ないわね……品と格というものを知らしめなければ
- `LARGE_EVENT_DIALOGUES.B4_cm.ojousama.quiet[1]`: …お受けしますわ
- `LARGE_EVENT_DIALOGUES.B4_cm.ojousama.shy[1]`: わ、わたくしがCMに…？ ほ、本当によろしいんですの…？
- `LARGE_EVENT_DIALOGUES.B4_cm.ojousama.earnest[1]`: しっかり準備してお役目を果たしますわ
- `LARGE_EVENT_DIALOGUES.B4_cm.ojousama.emotional[1]`: CMに出るんですの…！？ 緊張しますわ…！でも、やりますの…！
- `LARGE_EVENT_DIALOGUES.B4_cm.delinquent.normal[1]`: CM！？ なんか恥ずかしいけど、やってやるよ
- `LARGE_EVENT_DIALOGUES.B4_cm.delinquent.bold[1]`: CM？ 全国にこの顔を売りつけてやる！
- `LARGE_EVENT_DIALOGUES.B4_cm.delinquent.quiet[1]`: …ん。やるっす
- `LARGE_EVENT_DIALOGUES.B4_cm.delinquent.shy[1]`: あ、あたしがCM…？ ほ、ほんとに大丈夫っすか…？
- `LARGE_EVENT_DIALOGUES.B4_cm.delinquent.easygoing[1]`: CM撮影！？ 楽しそうじゃん！
- `LARGE_EVENT_DIALOGUES.B4_cm.delinquent.earnest[1]`: CMか。しっかり準備するっす。恥ずかしいもんは映せねえ
- `LARGE_EVENT_DIALOGUES.B4_cm.delinquent.emotional[1]`: CM出るのかよ…！？ うわ、緊張する…！でもやる…！
- `LARGE_EVENT_DIALOGUES.B4_cm.seductive.normal[1]`: カメラの前ね…いい絵、撮らせてあげる♡
- `LARGE_EVENT_DIALOGUES.B4_cm.seductive.bold[1]`: 全国に私を見てもらえるのね。楽しみだわ
- `LARGE_EVENT_DIALOGUES.B4_cm.seductive.shy[1]`: わ、私がCMに…？ 本当に、大丈夫なの…？
- `LARGE_EVENT_DIALOGUES.B4_cm.seductive.easygoing[1]`: CM出演か…どんな自分が映るか楽しみ♡
- `LARGE_EVENT_DIALOGUES.B4_cm.seductive.earnest[1]`: ちゃんと準備して、いい姿を見せるわ
- `LARGE_EVENT_DIALOGUES.B4_cm.seductive.emotional[1]`: CMに出るの……っ……ふふ、世間に顔を売るチャンスね……
- `LARGE_EVENT_DIALOGUES.B4_cm.composed.normal[1]`: …CMか。まあ、悪くないね
- `LARGE_EVENT_DIALOGUES.B4_cm.composed.bold[1]`: …全国か。いい機会だね、自分のペースでやるよ
- `LARGE_EVENT_DIALOGUES.B4_cm.composed.quiet[1]`: …うん。…やるよ
- `LARGE_EVENT_DIALOGUES.B4_cm.composed.shy[1]`: …私がCMか。…本当にいいのかな
- `LARGE_EVENT_DIALOGUES.B4_cm.composed.easygoing[1]`: …CMか。…売れっ子になったのかな
- `LARGE_EVENT_DIALOGUES.B4_cm.composed.easygoing[2]`: …どんなのになるんだろうね。ちょっと楽しみ
- `LARGE_EVENT_DIALOGUES.B4_cm.composed.earnest[1]`: …ちゃんとやるよ。恥ずかしくない仕事をしたいからね
- `LARGE_EVENT_DIALOGUES.B4_cm.composed.emotional[1]`: …っ…CMか。…緊張はする。…でもやるよ
- `LARGE_EVENT_DIALOGUES.B4_cm.cool.bold[1]`: …カメラに映るか。悪くない
- `LARGE_EVENT_DIALOGUES.B4_cm.cool.quiet[1]`: …カメラか。まぁ、やる
- `LARGE_EVENT_DIALOGUES.B4_cm.cool.shy[1]`: …私がCM。…本当にいいのか
- `LARGE_EVENT_DIALOGUES.B4_cm.cool.easygoing[1]`: …CMか。…売れっ子扱いだな
- `LARGE_EVENT_DIALOGUES.B4_cm.cool.easygoing[2]`: …どんな仕上がりになるか。少しだけ楽しみだ
- `LARGE_EVENT_DIALOGUES.B4_cm.cool.earnest[1]`: …しっかり準備する。恥ずかしい姿は映さない
- `LARGE_EVENT_DIALOGUES.B4_cm.cool.emotional[1]`: …っ…CMか。…緊張する。…でもやる
- `LARGE_EVENT_DIALOGUES.B4_cm.polite.quiet[1]`: …精一杯、頑張らせていただきます
- `LARGE_EVENT_DIALOGUES.B4_cm.polite.shy[1]`: CM…ですか…？ わ、わたしなんかで、いいんでしょうか…
- `LARGE_EVENT_DIALOGUES.B4_cm.polite.earnest[1]`: 大切なお仕事ですね。精一杯務めさせていただきます
- `LARGE_EVENT_DIALOGUES.B4_cm.polite.emotional[1]`: CMに出るんですか…！？ き、緊張します…！でも、やります…！
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.normal[1]`: グラビアか…ちょっと恥ずかしいけど、頑張ります
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.bold[1]`: 私の強さと魅力、カメラに焼き付けてやる
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.bold[2]`: これで一気に知名度上げてやる
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.quiet[1]`: …撮るだけですよね。わかりました
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.shy[1]`: え…グラビア…？ は、恥ずかしいです…でも、やります…
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.easygoing[1]`: グラビアか〜！ どんな感じになるんだろ♪
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.easygoing[2]`: かわいく撮ってもらえるかな♪
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.earnest[1]`: しっかり準備して臨みます。でも…少し恥ずかしいですね
- `LARGE_EVENT_DIALOGUES.B4_gravure.standard.emotional[1]`: グラビア！？ えっ、私ほんとに！？ うわ〜〜！
- `LARGE_EVENT_DIALOGUES.B4_gravure.ojousama.normal[1]`: 撮影ですか。美しく仕上げていただけるよう努めますわ
- `LARGE_EVENT_DIALOGUES.B4_gravure.ojousama.bold[1]`: 撮影？私の魅力を引き出せるのかしら？
- `LARGE_EVENT_DIALOGUES.B4_gravure.ojousama.quiet[1]`: …撮るだけですのね。承知しましたわ
- `LARGE_EVENT_DIALOGUES.B4_gravure.ojousama.shy[1]`: え…グラビア…？ は、恥ずかしいですわ…でも、やりますの…
- `LARGE_EVENT_DIALOGUES.B4_gravure.ojousama.earnest[1]`: プロとして恥ずかしくない撮影ができるよう、準備します
- `LARGE_EVENT_DIALOGUES.B4_gravure.ojousama.emotional[1]`: グラビア…！？ えっ、わたくしが本当に…！？ どうしましょう…！
- `LARGE_EVENT_DIALOGUES.B4_gravure.delinquent.normal[1]`: グラビア…？ まぁ、やってやるか
- `LARGE_EVENT_DIALOGUES.B4_gravure.delinquent.bold[1]`: グラビアも勝負事だ。全力でいくよ
- `LARGE_EVENT_DIALOGUES.B4_gravure.delinquent.quiet[1]`: …撮るだけっすよね。わかった
- `LARGE_EVENT_DIALOGUES.B4_gravure.delinquent.shy[1]`: え…グラビア…？ は、恥ずいっす…でも、やるんで…
- `LARGE_EVENT_DIALOGUES.B4_gravure.delinquent.easygoing[1]`: グラビアか。まぁ、派手にやってやる
- `LARGE_EVENT_DIALOGUES.B4_gravure.delinquent.earnest[1]`: しっかり準備して臨むっす。でも…ちょっと恥ずいな
- `LARGE_EVENT_DIALOGUES.B4_gravure.delinquent.emotional[1]`: グラビア…！？ えっ、あたしが…！？ うわ、マジか…！
- `LARGE_EVENT_DIALOGUES.B4_gravure.seductive.normal[1]`: グラビアね…全部見せてあげるわ♡
- `LARGE_EVENT_DIALOGUES.B4_gravure.seductive.bold[1]`: 私の本気の魅力、たっぷり撮ってもらうわ
- `LARGE_EVENT_DIALOGUES.B4_gravure.seductive.shy[1]`: え…グラビア…？ は、恥ずかしい…でも、やる…
- `LARGE_EVENT_DIALOGUES.B4_gravure.seductive.easygoing[1]`: グラビア？ 任せておいてよ♡
- `LARGE_EVENT_DIALOGUES.B4_gravure.seductive.earnest[1]`: きちんと準備して、いい仕上がりにするわ
- `LARGE_EVENT_DIALOGUES.B4_gravure.seductive.emotional[1]`: グラビア……っ……ふふ、見られるのは嫌いじゃないの……
- `LARGE_EVENT_DIALOGUES.B4_gravure.composed.normal[1]`: …グラビアか。まあ、たまにはいいんじゃない
- `LARGE_EVENT_DIALOGUES.B4_gravure.composed.bold[1]`: …撮られるのは嫌いじゃないよ。いい写真にしよう
- `LARGE_EVENT_DIALOGUES.B4_gravure.composed.quiet[1]`: …撮るだけだよね。…わかった
- `LARGE_EVENT_DIALOGUES.B4_gravure.composed.shy[1]`: …グラビアか。恥ずかしいけど…まあ、やるよ
- `LARGE_EVENT_DIALOGUES.B4_gravure.composed.easygoing[1]`: …グラビアか。どんな感じになるんだろうね
- `LARGE_EVENT_DIALOGUES.B4_gravure.composed.easygoing[2]`: …かわいく撮ってもらえるかな。…期待しておくよ
- `LARGE_EVENT_DIALOGUES.B4_gravure.composed.earnest[1]`: …丁寧にやるよ。せっかくの機会だからね
- `LARGE_EVENT_DIALOGUES.B4_gravure.composed.emotional[1]`: …っ…グラビア。…私が、か。…参ったな
- `LARGE_EVENT_DIALOGUES.B4_gravure.cool.bold[1]`: …写真か。余計なことはしないが、手は抜かない
- `LARGE_EVENT_DIALOGUES.B4_gravure.cool.quiet[1]`: …写真か。余計なことはしないでくれ
- `LARGE_EVENT_DIALOGUES.B4_gravure.cool.shy[1]`: …グラビア。恥ずかしい。…でも、やる
- `LARGE_EVENT_DIALOGUES.B4_gravure.cool.easygoing[1]`: …グラビアか。どうなるんだろうな
- `LARGE_EVENT_DIALOGUES.B4_gravure.cool.easygoing[2]`: …かわいく撮ってくれるなら、それでいい
- `LARGE_EVENT_DIALOGUES.B4_gravure.cool.earnest[1]`: …準備はする。…少し恥ずかしいが
- `LARGE_EVENT_DIALOGUES.B4_gravure.cool.emotional[1]`: …っ…グラビア。…私が、か
- `LARGE_EVENT_DIALOGUES.B4_gravure.polite.quiet[1]`: …恥ずかしいですが、精一杯頑張ります
- `LARGE_EVENT_DIALOGUES.B4_gravure.polite.shy[1]`: グ、グラビア…ですか…？ は、恥ずかしいです…でも、頑張ります…
- `LARGE_EVENT_DIALOGUES.B4_gravure.polite.earnest[1]`: 精一杯きれいに撮っていただけるよう頑張ります…
- `LARGE_EVENT_DIALOGUES.B4_gravure.polite.emotional[1]`: グラビア…！？ えっ、私が本当に…！？ ど、どうしましょう…！
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.normal[1]`: バラエティか…うまく喋れるかな。頑張ります
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.bold[1]`: 番組ジャックしてやる。全部持っていく
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.bold[2]`: トーク番組だろうと、私が主役に決まってる
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.quiet[1]`: …喋るんですか。少し、緊張します
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.shy[1]`: バ、バラエティ…しゃべるの…？ が、頑張ります…
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.easygoing[1]`: バラエティ！ 笑わせにいくよ♪
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.easygoing[2]`: テレビって楽しそう！ 全力でいく♪
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.earnest[1]`: うまく喋れるか不安ですが…精一杯やります
- `LARGE_EVENT_DIALOGUES.B4_variety.standard.emotional[1]`: バラエティ出る！？ テンション上がってきた〜！！
- `LARGE_EVENT_DIALOGUES.B4_variety.ojousama.normal[1]`: バラエティ番組ですか。品よくふるまえるよう努めますわ
- `LARGE_EVENT_DIALOGUES.B4_variety.ojousama.bold[1]`: トーク番組？妙な仕事を持ってくるものね
- `LARGE_EVENT_DIALOGUES.B4_variety.ojousama.quiet[1]`: …お喋りするんですのね。少し、緊張しますわ
- `LARGE_EVENT_DIALOGUES.B4_variety.ojousama.shy[1]`: バ、バラエティ…お喋りを…？ が、頑張りますわ…
- `LARGE_EVENT_DIALOGUES.B4_variety.ojousama.earnest[1]`: 言葉遣いには気をつけて、丁寧に対応しますわ
- `LARGE_EVENT_DIALOGUES.B4_variety.ojousama.emotional[1]`: バラエティに出ますの…！？ 気分が上がってきましたわ…！
- `LARGE_EVENT_DIALOGUES.B4_variety.delinquent.normal[1]`: バラエティ？ 面白いことしてやるよ
- `LARGE_EVENT_DIALOGUES.B4_variety.delinquent.bold[1]`: テレビで暴れてやる！ 絶対爪痕残す！
- `LARGE_EVENT_DIALOGUES.B4_variety.delinquent.quiet[1]`: …喋るんすか。ちょっと、緊張するな
- `LARGE_EVENT_DIALOGUES.B4_variety.delinquent.shy[1]`: バ、バラエティ…喋るんすか…？ が、頑張るんで…
- `LARGE_EVENT_DIALOGUES.B4_variety.delinquent.easygoing[1]`: テレビで暴れてやる！ 楽しみ！
- `LARGE_EVENT_DIALOGUES.B4_variety.delinquent.earnest[1]`: うまく喋れるか不安っすけど…精一杯やるんで
- `LARGE_EVENT_DIALOGUES.B4_variety.delinquent.emotional[1]`: バラエティ出るのか…！？ うおー、テンション上がってきた…！
- `LARGE_EVENT_DIALOGUES.B4_variety.seductive.normal[1]`: バラエティねぇ。じゃあ、素の私を少し見せてあげようかしら
- `LARGE_EVENT_DIALOGUES.B4_variety.seductive.bold[1]`: バラエティでも私のペースで話すわ
- `LARGE_EVENT_DIALOGUES.B4_variety.seductive.shy[1]`: バ、バラエティ…喋るの…？ が、頑張る…
- `LARGE_EVENT_DIALOGUES.B4_variety.seductive.easygoing[1]`: バラエティか〜。楽しそう！ 見ててよ♡
- `LARGE_EVENT_DIALOGUES.B4_variety.seductive.earnest[1]`: ちゃんと準備して、面白い話ができるよう頑張るわ
- `LARGE_EVENT_DIALOGUES.B4_variety.seductive.emotional[1]`: バラエティに出るの……っ……ふふ、楽しんでくるわね……
- `LARGE_EVENT_DIALOGUES.B4_variety.composed.normal[1]`: …バラエティか。まあ、のんびり喋るよ
- `LARGE_EVENT_DIALOGUES.B4_variety.composed.bold[1]`: …まあ、自分のペースで話せばいいんでしょ。大丈夫
- `LARGE_EVENT_DIALOGUES.B4_variety.composed.quiet[1]`: …喋るんだね。…少し、緊張するかな
- `LARGE_EVENT_DIALOGUES.B4_variety.composed.shy[1]`: …バラエティ。喋るんだね。…頑張ってみるよ
- `LARGE_EVENT_DIALOGUES.B4_variety.composed.easygoing[1]`: …バラエティか。笑わせにいこうかな
- `LARGE_EVENT_DIALOGUES.B4_variety.composed.easygoing[2]`: …テレビは楽しそうだね。全力でやるよ
- `LARGE_EVENT_DIALOGUES.B4_variety.composed.earnest[1]`: …落ち着いて話せばいいよね。焦らずやるよ
- `LARGE_EVENT_DIALOGUES.B4_variety.composed.emotional[1]`: …っ…バラエティか。…これは、少し楽しみだね
- `LARGE_EVENT_DIALOGUES.B4_variety.cool.bold[1]`: …余計なことは言わない。でも、印象には残る
- `LARGE_EVENT_DIALOGUES.B4_variety.cool.quiet[1]`: …無駄なことは言わない。それだけだ
- `LARGE_EVENT_DIALOGUES.B4_variety.cool.shy[1]`: …バラエティ。喋るのか。…やる
- `LARGE_EVENT_DIALOGUES.B4_variety.cool.easygoing[1]`: …バラエティか。笑わせにいく
- `LARGE_EVENT_DIALOGUES.B4_variety.cool.easygoing[2]`: …テレビは楽しそうだ。全力でやる
- `LARGE_EVENT_DIALOGUES.B4_variety.cool.earnest[1]`: …うまく喋れるか不安だ。…でも、やる
- `LARGE_EVENT_DIALOGUES.B4_variety.cool.emotional[1]`: …っ…バラエティか。…燃えてきた
- `LARGE_EVENT_DIALOGUES.B4_variety.polite.quiet[1]`: …うまく喋れるか不安ですが、精一杯やります
- `LARGE_EVENT_DIALOGUES.B4_variety.polite.shy[1]`: バ、バラエティ番組…ちゃんと、お話できるか不安です…
- `LARGE_EVENT_DIALOGUES.B4_variety.polite.earnest[1]`: トーク番組は緊張しますが…誠実に対応いたします
- `LARGE_EVENT_DIALOGUES.B4_variety.polite.emotional[1]`: バラエティに出るんですか…！？ こ、これはもう…気合いが入ります…！
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.normal[1]`: ブランドとのコラボか。ちゃんとイメージに合わせられるかな
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.bold[1]`: そのブランドのイメージ、私が底上げしてやる
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.bold[2]`: 私が使ったら絶対売れる。任せて
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.quiet[1]`: …わかりました。やります
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.shy[1]`: わ、私がコラボ…？ 本当に私でいいんですか…
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.easygoing[1]`: コラボ！？ 商品もらえたりする？♪
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.easygoing[2]`: どんな商品になるんだろ〜楽しみ♪
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.earnest[1]`: ブランドさんのイメージを大切に。しっかり務めます
- `LARGE_EVENT_DIALOGUES.B4_brand.standard.emotional[1]`: えっブランドコラボ！？ すごい！どんな商品になるの！？
- `LARGE_EVENT_DIALOGUES.B4_brand.ojousama.normal[1]`: まあ、コラボのお話ですの。嬉しい限りですわ
- `LARGE_EVENT_DIALOGUES.B4_brand.ojousama.bold[1]`: 私なら、確かにブランドイメージは上がるでしょうね
- `LARGE_EVENT_DIALOGUES.B4_brand.ojousama.quiet[1]`: …承知しましたわ。お受けします
- `LARGE_EVENT_DIALOGUES.B4_brand.ojousama.shy[1]`: わ、わたくしがコラボ…？ 本当にわたくしでよろしいんですの…
- `LARGE_EVENT_DIALOGUES.B4_brand.ojousama.earnest[1]`: 品格を忘れず、ブランドのイメージを大切にしますわ
- `LARGE_EVENT_DIALOGUES.B4_brand.ojousama.emotional[1]`: えっ、ブランドのコラボ…！？ すごいですわ…！どんな商品になりますの…！？
- `LARGE_EVENT_DIALOGUES.B4_brand.delinquent.normal[1]`: ブランドとコラボ…？ なんか柄じゃないな。でもやる
- `LARGE_EVENT_DIALOGUES.B4_brand.delinquent.bold[1]`: コラボ商品、派手にやってやる！
- `LARGE_EVENT_DIALOGUES.B4_brand.delinquent.quiet[1]`: …わかったっす。やる
- `LARGE_EVENT_DIALOGUES.B4_brand.delinquent.shy[1]`: あ、あたしがコラボ…？ ほんとにあたしでいいんすか…
- `LARGE_EVENT_DIALOGUES.B4_brand.delinquent.easygoing[1]`: コラボか。なんか面白そうじゃん
- `LARGE_EVENT_DIALOGUES.B4_brand.delinquent.earnest[1]`: ブランドのイメージは大事だろ。しっかり務めるっす
- `LARGE_EVENT_DIALOGUES.B4_brand.delinquent.emotional[1]`: えっ、ブランドとコラボ…！？ すげえ…！どんな商品になるんだよ…！？
- `LARGE_EVENT_DIALOGUES.B4_brand.seductive.normal[1]`: 私のイメージに合うブランドね。いい選択だわ♡
- `LARGE_EVENT_DIALOGUES.B4_brand.seductive.bold[1]`: 私とブランドの組み合わせ…最高じゃない
- `LARGE_EVENT_DIALOGUES.B4_brand.seductive.shy[1]`: わ、私がコラボ…？ 本当に、私でいいの…
- `LARGE_EVENT_DIALOGUES.B4_brand.seductive.easygoing[1]`: コラボ商品か…どんなのになるかな♡
- `LARGE_EVENT_DIALOGUES.B4_brand.seductive.earnest[1]`: ちゃんとブランドのイメージに合わせて取り組むわ
- `LARGE_EVENT_DIALOGUES.B4_brand.seductive.emotional[1]`: ブランドのお話……っ……ふふ、素敵ね……
- `LARGE_EVENT_DIALOGUES.B4_brand.composed.normal[1]`: …コラボか。なるほどね、面白そう
- `LARGE_EVENT_DIALOGUES.B4_brand.composed.bold[1]`: …悪くない組み合わせだね。いいものにしよう
- `LARGE_EVENT_DIALOGUES.B4_brand.composed.quiet[1]`: …わかった。…やるよ
- `LARGE_EVENT_DIALOGUES.B4_brand.composed.shy[1]`: …私がコラボか。…本当に私でいいのかな
- `LARGE_EVENT_DIALOGUES.B4_brand.composed.easygoing[1]`: …コラボか。…商品ってもらえたりするのかな
- `LARGE_EVENT_DIALOGUES.B4_brand.composed.easygoing[2]`: …どんなのになるんだろうね。楽しみだよ
- `LARGE_EVENT_DIALOGUES.B4_brand.composed.earnest[1]`: …先方のイメージを大事にね。…しっかり務めるよ
- `LARGE_EVENT_DIALOGUES.B4_brand.composed.emotional[1]`: …っ…コラボか。…どんな形になるんだろうね
- `LARGE_EVENT_DIALOGUES.B4_brand.cool.bold[1]`: …ブランドには口数の少なさが向いている。悪くない
- `LARGE_EVENT_DIALOGUES.B4_brand.cool.quiet[1]`: …無駄口は叩かない。それがブランドには向いているかも
- `LARGE_EVENT_DIALOGUES.B4_brand.cool.shy[1]`: …私がコラボ。…本当に私でいいのか
- `LARGE_EVENT_DIALOGUES.B4_brand.cool.easygoing[1]`: …コラボか。…商品はもらえるのか
- `LARGE_EVENT_DIALOGUES.B4_brand.cool.easygoing[2]`: …どんなものになるのか。少し気になる
- `LARGE_EVENT_DIALOGUES.B4_brand.cool.earnest[1]`: …先方のイメージは壊さない。それだけだ
- `LARGE_EVENT_DIALOGUES.B4_brand.cool.emotional[1]`: …っ…コラボか。…どんな形になる
- `LARGE_EVENT_DIALOGUES.B4_brand.polite.quiet[1]`: …コラボですね。しっかり務めさせていただきます
- `LARGE_EVENT_DIALOGUES.B4_brand.polite.shy[1]`: ブランドのお仕事…ですか…？ あ、あの、精一杯やらせていただきます…
- `LARGE_EVENT_DIALOGUES.B4_brand.polite.earnest[1]`: ブランド様のご期待に添えるよう、精一杯取り組みます
- `LARGE_EVENT_DIALOGUES.B4_brand.polite.emotional[1]`: えっ、ブランドコラボ…！？ す、すごいです…！どんな商品になるんですか…！？
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.normal[1]`: …ランウェイか。歩けるかな。…まあ、やってみるよ
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.bold[1]`: …ランウェイも私の舞台だよ。…全部持っていく
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.bold[2]`: …プロレスもファッションも。…どっちも私のものだね
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.quiet[1]`: …歩けばいいんだね。…やるよ
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.shy[1]`: …ファッションショー。みんなに見られるんだよね…
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.easygoing[1]`: …ファッションショーか。キラキラしてそうだね
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.easygoing[2]`: …衣装、かわいいのかな。…楽しみだよ
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.earnest[1]`: …練習しておくよ。ちゃんと歩けるようにね
- `LARGE_EVENT_DIALOGUES.B4_fashion.composed.emotional[1]`: …っ…ランウェイか。…これは、緊張するやつだね
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.normal[1]`: ファッションショーか…歩けるかな。頑張ります
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.bold[1]`: ランウェイも私のステージ。全部持っていく
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.bold[2]`: プロレスもファッションも、どっちも私のもの
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.quiet[1]`: …歩けばいいんですね。やります
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.shy[1]`: フ、ファッションショー…みんなに見られるんですよね…！
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.easygoing[1]`: ファッションショー！ なんかキラキラしてそう♪
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.easygoing[2]`: 衣装とかかわいいのかな〜♪
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.earnest[1]`: 練習して、ちゃんと歩けるよう準備します
- `LARGE_EVENT_DIALOGUES.B4_fashion.standard.emotional[1]`: ランウェイ歩くの！？ わあああどうしよう緊張するやつだ！
- `LARGE_EVENT_DIALOGUES.B4_fashion.ojousama.normal[1]`: ランウェイですか。精一杯美しく歩いてみせますわ
- `LARGE_EVENT_DIALOGUES.B4_fashion.ojousama.bold[1]`: ランウェイね……もちろん自信はあるわよ？
- `LARGE_EVENT_DIALOGUES.B4_fashion.ojousama.quiet[1]`: …歩けばよろしいんですのね。お受けします
- `LARGE_EVENT_DIALOGUES.B4_fashion.ojousama.shy[1]`: フ、ファッションショー…皆様に見られますのよね…！
- `LARGE_EVENT_DIALOGUES.B4_fashion.ojousama.earnest[1]`: ランウェイには自信がありますわ。しっかり務めます
- `LARGE_EVENT_DIALOGUES.B4_fashion.ojousama.emotional[1]`: ランウェイを歩きますの…！？ ど、どうしましょう…緊張しますわ…！
- `LARGE_EVENT_DIALOGUES.B4_fashion.delinquent.normal[1]`: ファッションショー…？ 歩くだけ？ まぁいいけど
- `LARGE_EVENT_DIALOGUES.B4_fashion.delinquent.bold[1]`: 歩くだけなら怖くない。ど派手にやってやる
- `LARGE_EVENT_DIALOGUES.B4_fashion.delinquent.quiet[1]`: …歩けばいいんすよね。やる
- `LARGE_EVENT_DIALOGUES.B4_fashion.delinquent.shy[1]`: フ、ファッションショー…みんなに見られるんすよね…！
- `LARGE_EVENT_DIALOGUES.B4_fashion.delinquent.easygoing[1]`: ランウェイか。めっちゃ目立てそうじゃん！
- `LARGE_EVENT_DIALOGUES.B4_fashion.delinquent.earnest[1]`: 練習して、ちゃんと歩けるようにしとくっす
- `LARGE_EVENT_DIALOGUES.B4_fashion.delinquent.emotional[1]`: ランウェイ歩くのかよ…！？ うわ、どうしよ、緊張するやつだろこれ…！
- `LARGE_EVENT_DIALOGUES.B4_fashion.seductive.normal[1]`: ランウェイか…私の本領発揮ね♡
- `LARGE_EVENT_DIALOGUES.B4_fashion.seductive.bold[1]`: ランウェイ、私のためにあるようなものよ
- `LARGE_EVENT_DIALOGUES.B4_fashion.seductive.shy[1]`: フ、ファッションショー…みんなに、見られるのよね…！
- `LARGE_EVENT_DIALOGUES.B4_fashion.seductive.easygoing[1]`: ランウェイ！ 絶対楽しい！ 見ててよ♡
- `LARGE_EVENT_DIALOGUES.B4_fashion.seductive.earnest[1]`: きちんと練習して、完璧に歩いてみせるわ
- `LARGE_EVENT_DIALOGUES.B4_fashion.seductive.emotional[1]`: ファッションのお仕事……っ……ふふ、おしゃれするのは好きよ……
- `LARGE_EVENT_DIALOGUES.B4_fashion.cool.bold[1]`: …ランウェイか。静かにやる。でも存在感は出す
- `LARGE_EVENT_DIALOGUES.B4_fashion.cool.quiet[1]`: …余計なことはしない。ただ歩く。それだけだ
- `LARGE_EVENT_DIALOGUES.B4_fashion.cool.shy[1]`: …ファッションショー。人に見られるのか…
- `LARGE_EVENT_DIALOGUES.B4_fashion.cool.easygoing[1]`: …ファッションショーか。派手そうだな
- `LARGE_EVENT_DIALOGUES.B4_fashion.cool.easygoing[2]`: …衣装はかわいいのか。少し気になる
- `LARGE_EVENT_DIALOGUES.B4_fashion.cool.earnest[1]`: …練習する。ちゃんと歩けるように
- `LARGE_EVENT_DIALOGUES.B4_fashion.cool.emotional[1]`: …っ…ランウェイか。…緊張する
- `LARGE_EVENT_DIALOGUES.B4_fashion.polite.quiet[1]`: …練習して、ちゃんと歩けるよう準備します
- `LARGE_EVENT_DIALOGUES.B4_fashion.polite.shy[1]`: フ、ファッション関連のお仕事…似合うでしょうか…
- `LARGE_EVENT_DIALOGUES.B4_fashion.polite.earnest[1]`: ご期待に沿えるよう、歩き方から練習いたします
- `LARGE_EVENT_DIALOGUES.B4_fashion.polite.emotional[1]`: ランウェイを歩くんですか…！？ ど、どうしましょう…緊張します…！
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.normal[1]`: …直接話せるんだ。…それは、楽しみだね
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.bold[1]`: …最高の思い出を持って帰ってもらおうか
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.bold[2]`: …全員笑顔で帰す。…それが私の仕事だからね
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.quiet[1]`: …ファンの人と話すんだね。…ちゃんとやるよ
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.shy[1]`: …ファンに直接会うんだね。…緊張するけど、やるよ
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.easygoing[1]`: …みんなに会えるんだ。…気分が上がるね
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.easygoing[2]`: …笑顔が見られるかな。…楽しみだよ
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.earnest[1]`: …一人ひとりと、ちゃんと向き合うよ
- `LARGE_EVENT_DIALOGUES.B4_fan.composed.emotional[1]`: …っ…みんなに会えるんだ。…全員、笑顔にして帰すよ
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.normal[1]`: ファンの皆さんと直接話せるのか。楽しみです
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.bold[1]`: ファンに最高の思い出を作らせてやる
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.bold[2]`: 全員を笑顔にして帰らせる。それが私の仕事
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.quiet[1]`: …ファンの人たちと話す。ちゃんとやります
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.shy[1]`: フ、ファンの方に直接会うんですか…！ 緊張しますが頑張ります
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.easygoing[1]`: ファンのみんなに会えるの！ テンション上がる♪
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.easygoing[2]`: みんなの笑顔が見れるかな♪
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.earnest[1]`: ファンの皆さん一人ひとりに、誠実に向き合います
- `LARGE_EVENT_DIALOGUES.B4_fan.standard.emotional[1]`: ファンに会える！！ 絶対みんなを笑顔にしてみせる！！
- `LARGE_EVENT_DIALOGUES.B4_fan.ojousama.normal[1]`: ファンの方々に直接お礼を申し上げる機会ですわね
- `LARGE_EVENT_DIALOGUES.B4_fan.ojousama.bold[1]`: ファンの方々に最高の時間をお届けしますわ
- `LARGE_EVENT_DIALOGUES.B4_fan.ojousama.quiet[1]`: …ファンの方々とお話を。きちんと務めますわ
- `LARGE_EVENT_DIALOGUES.B4_fan.ojousama.shy[1]`: フ、ファンの方に直接お会いするんですの…！ 緊張しますけれど、頑張りますわ
- `LARGE_EVENT_DIALOGUES.B4_fan.ojousama.earnest[1]`: ファンの方々に誠実に向き合うことが私の務めですわ
- `LARGE_EVENT_DIALOGUES.B4_fan.ojousama.emotional[1]`: ファンの方に会えますの…！ 絶対に、皆様を笑顔にしてみせますわ…！
- `LARGE_EVENT_DIALOGUES.B4_fan.delinquent.normal[1]`: ファンイベ！ 直接会えるのいいな
- `LARGE_EVENT_DIALOGUES.B4_fan.delinquent.bold[1]`: ファンイベ、盛り上げてやるよ！
- `LARGE_EVENT_DIALOGUES.B4_fan.delinquent.quiet[1]`: …ファンと話すんすよね。ちゃんとやる
- `LARGE_EVENT_DIALOGUES.B4_fan.delinquent.shy[1]`: フ、ファンに直接会うんすか…！ 緊張するけど、頑張るんで
- `LARGE_EVENT_DIALOGUES.B4_fan.delinquent.easygoing[1]`: ファンと直接会えるのいいじゃん！ 楽しみ！
- `LARGE_EVENT_DIALOGUES.B4_fan.delinquent.earnest[1]`: 来てくれた一人ひとりと、ちゃんと向き合うっす
- `LARGE_EVENT_DIALOGUES.B4_fan.delinquent.emotional[1]`: ファンに会えるのか…！ 絶対みんな笑顔にしてやる…！
- `LARGE_EVENT_DIALOGUES.B4_fan.seductive.normal[1]`: ファンと直接会える機会ね…喜ばせてあげるわ♡
- `LARGE_EVENT_DIALOGUES.B4_fan.seductive.bold[1]`: ファンを喜ばせるのは得意よ。任せて
- `LARGE_EVENT_DIALOGUES.B4_fan.seductive.shy[1]`: フ、ファンの人に直接会うの…！ 緊張するけど、頑張る
- `LARGE_EVENT_DIALOGUES.B4_fan.seductive.easygoing[1]`: ファンに会いに行くの？ 嬉しいな♡
- `LARGE_EVENT_DIALOGUES.B4_fan.seductive.earnest[1]`: 一人ひとりにちゃんと向き合う。それが大事だと思うわ
- `LARGE_EVENT_DIALOGUES.B4_fan.seductive.emotional[1]`: ファンに会えるの……っ……ふふ、みんなに直接ありがとうって言えるのね……
- `LARGE_EVENT_DIALOGUES.B4_fan.cool.bold[1]`: …ファンの前では、少し気を緩めてもいいかもな
- `LARGE_EVENT_DIALOGUES.B4_fan.cool.quiet[1]`: …来てくれた人には、ちゃんと応えたい
- `LARGE_EVENT_DIALOGUES.B4_fan.cool.shy[1]`: …ファンに直接会うのか。…緊張するが、やる
- `LARGE_EVENT_DIALOGUES.B4_fan.cool.easygoing[1]`: …みんなに会えるのか。…悪くない
- `LARGE_EVENT_DIALOGUES.B4_fan.cool.easygoing[2]`: …笑顔が見られるなら、行く価値はある
- `LARGE_EVENT_DIALOGUES.B4_fan.cool.earnest[1]`: …一人ひとりに、きちんと向き合う
- `LARGE_EVENT_DIALOGUES.B4_fan.cool.emotional[1]`: …っ…みんなに会える。…笑顔にしてみせる
- `LARGE_EVENT_DIALOGUES.B4_fan.polite.quiet[1]`: …緊張しますが、来てくださった方に感謝を伝えます
- `LARGE_EVENT_DIALOGUES.B4_fan.polite.shy[1]`: ファンの方に…直接、お会いできるんですか…？ う、嬉しいです…
- `LARGE_EVENT_DIALOGUES.B4_fan.polite.earnest[1]`: 来てくださった方全員に、心から感謝を伝えたいです
- `LARGE_EVENT_DIALOGUES.B4_fan.polite.emotional[1]`: ファンの方に会えるんですか…！ 絶対に、みんなを笑顔にします…！
