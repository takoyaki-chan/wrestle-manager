# その他雰囲気テキスト

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `TEAM_SPIRIT_TEXTS`

- 出典: `src/data.js`
- コード内コメント: v2.0 Phase1-7: 逆境チームスピリットテキスト
- 本数: 8

### [].text

- `TEAM_SPIRIT_TEXTS[1].text`: 🔥 苦しい中でもチームの結束が深まった
- `TEAM_SPIRIT_TEXTS[2].text`: 💪 逆境がチームを強くしている
- `TEAM_SPIRIT_TEXTS[3].text`: 🤝 厳しい時期だからこそ仲間の大切さを実感
- `TEAM_SPIRIT_TEXTS[4].text`: ✊ チーム全員が同じ方向を向いている

### [].detail

- `TEAM_SPIRIT_TEXTS[1].detail`: 資金繰りは厳しいが、選手たちの表情に迷いはない。困難を共にすることで、絆が強まっているようだ。
- `TEAM_SPIRIT_TEXTS[2].detail`: 豪華な設備も潤沢な資金もない。だからこそ、選手同士で支え合う文化が自然に生まれている。
- `TEAM_SPIRIT_TEXTS[3].detail`: 決して恵まれた環境ではない。それでも、誰一人として文句を言わずに練習に打ち込む姿がある。
- `TEAM_SPIRIT_TEXTS[4].detail`: 苦しい状況を全員で分かち合っている。この経験が、いつかチームの財産になるはずだ。

## `PRE_WINDOW_TEXTS`

- 出典: `src/data.js`
- コード内コメント: §B-2: 移籍ウィンドウ予兆テキスト（trust帯別）
- 本数: 9

### mild[]

- `PRE_WINDOW_TEXTS.mild[1]`: 👁️ 業界筋が{name}の試合映像を取り寄せているらしい
- `PRE_WINDOW_TEXTS.mild[2]`: 👁️ {name}の名前が他団体の会議で挙がっていたとの噂
- `PRE_WINDOW_TEXTS.mild[3]`: 👁️ {name}への注目度が他団体内で高まっているようだ

### moderate[]

- `PRE_WINDOW_TEXTS.moderate[1]`: 👁️ {rival}のスカウトが{name}の試合をチェックしていた
- `PRE_WINDOW_TEXTS.moderate[2]`: 👁️ {rival}関係者が{name}について詳しく探っているらしい
- `PRE_WINDOW_TEXTS.moderate[3]`: 👁️ 業界紙が{name}を「動向注目の選手」として取り上げた

### serious[]

- `PRE_WINDOW_TEXTS.serious[1]`: ⚠️ 複数の団体が{name}に接触を試みている噂が流れている
- `PRE_WINDOW_TEXTS.serious[2]`: ⚠️ {name}の周辺で他団体の動きが活発化している
- `PRE_WINDOW_TEXTS.serious[3]`: ⚠️ {name}への具体的なオファーが近いとの観測が出ている

## `LOCKER_AIR_TEXTS`

- 出典: `src/data.js`
- コード内コメント: §B-1: ロッカールーム空気ログテキスト
- 本数: 14

### good[]

- `LOCKER_AIR_TEXTS.good[1]`: 💬 ロッカールームから笑い声が聞こえてくる
- `LOCKER_AIR_TEXTS.good[2]`: 💬 控室の空気は和やかだ
- `LOCKER_AIR_TEXTS.good[3]`: 💬 選手たちが自主練で残っている
- `LOCKER_AIR_TEXTS.good[4]`: 💬 誰かが差し入れを持ってきたらしい

### warning[]

- `LOCKER_AIR_TEXTS.warning[1]`: 💬 控室で{name}がため息をついていた
- `LOCKER_AIR_TEXTS.warning[2]`: 💬 {name}の表情が最近硬い
- `LOCKER_AIR_TEXTS.warning[3]`: 💬 ロッカーの会話が少ない日が続いている
- `LOCKER_AIR_TEXTS.warning[4]`: 💬 {name}が一人で帰る姿を見かけた
- `LOCKER_AIR_TEXTS.warning[5]`: 💬 練習後、{name}がスマホをじっと見つめていた

### danger[]

- `LOCKER_AIR_TEXTS.danger[1]`: 💬 ロッカールームの空気が重い
- `LOCKER_AIR_TEXTS.danger[2]`: 💬 {name}と{name2}が何か話し込んでいた
- `LOCKER_AIR_TEXTS.danger[3]`: 💬 控室で小さな言い争いがあったらしい
- `LOCKER_AIR_TEXTS.danger[4]`: 💬 {name}の機嫌が明らかに悪い
- `LOCKER_AIR_TEXTS.danger[5]`: 💬 誰もが口数少なく着替えを済ませていた

## `ATMOSPHERE_TEXTS`

- 出典: `src/data.js`
- コード内コメント: §3 ロッカールーム可視化: 雰囲気テキスト（5段階×3-4パターン）
- 本数: 18

### [][].text

- `ATMOSPHERE_TEXTS[1][1].text`: 練習場が静まり返っている
- `ATMOSPHERE_TEXTS[1][2].text`: 誰も目を合わせようとしない
- `ATMOSPHERE_TEXTS[1][3].text`: 重い空気が漂っている
- `ATMOSPHERE_TEXTS[2][1].text`: どこかよそよそしい空気がある
- `ATMOSPHERE_TEXTS[2][2].text`: 最低限のメニューだけこなしている
- `ATMOSPHERE_TEXTS[2][3].text`: 会話が少ない
- `ATMOSPHERE_TEXTS[3][1].text`: 淡々とメニューをこなしている
- `ATMOSPHERE_TEXTS[3][2].text`: いつも通りの練習風景
- `ATMOSPHERE_TEXTS[3][3].text`: 特に変わった様子はない
- `ATMOSPHERE_TEXTS[3][4].text`: 黙々と汗を流している
- `ATMOSPHERE_TEXTS[4][1].text`: 声が飛び交っている
- `ATMOSPHERE_TEXTS[4][2].text`: 練習に熱が入っている
- `ATMOSPHERE_TEXTS[4][3].text`: 選手同士でアドバイスし合っている
- `ATMOSPHERE_TEXTS[4][4].text`: 活気のある練習場
- `ATMOSPHERE_TEXTS[5][1].text`: 自主練する選手が増えている
- `ATMOSPHERE_TEXTS[5][2].text`: 練習場に笑い声が響いている
- `ATMOSPHERE_TEXTS[5][3].text`: 全員の目つきが違う
- `ATMOSPHERE_TEXTS[5][4].text`: チーム全体に勢いがある

## `EMOTION_TEXTS`

- 出典: `src/ui-render.js`
- コード内コメント: 感情テキストシステム
- 本数: 91

- `EMOTION_TEXTS.trust.normal`: そばにいてくれるだけで、なんだか安心する
- `EMOTION_TEXTS.trust.ojousama`: お隣にいてくださると、心が穏やかになりますの
- `EMOTION_TEXTS.trust.delinquent`: 一緒にいると……なんか、落ち着くんだよな
- `EMOTION_TEXTS.trust.cool`: 信頼できる数少ない人間。それだけで十分
- `EMOTION_TEXTS.trust.seductive`: 隣にいると、居心地がいいのよね……ふふ
- `EMOTION_TEXTS.trust.polite`: 本当に感謝しています。大切な存在です
- `EMOTION_TEXTS.trust.composed`: 一緒にいてくれると、不思議と心が落ち着くのよね
- `EMOTION_TEXTS.rival_friend.normal`: 負けたくない。でも、おかげで強くなれている気がする
- `EMOTION_TEXTS.rival_friend.ojousama`: 負けたくありませんけれど……実力は認めざるを得ませんわ
- `EMOTION_TEXTS.rival_friend.delinquent`: ぜってー負けねえ。でもまあ……いるから燃えんだよ
- `EMOTION_TEXTS.rival_friend.cool`: 互いに高め合える関係。……悪くない
- `EMOTION_TEXTS.rival_friend.seductive`: 勝ちたい……でも、追いかけてる時間も嫌いじゃないの
- `EMOTION_TEXTS.rival_friend.polite`: 競い合えることが、自分の力になっています
- `EMOTION_TEXTS.rival_friend.composed`: あの子のおかげで、わたくしも頑張れるの。ありがたい存在ね
- `EMOTION_TEXTS.destined_rival.normal`: 考えない日はない。絶対に、越えなきゃいけない壁
- `EMOTION_TEXTS.destined_rival.ojousama`: 何があっても……わたくしの手で超えてみせますわ
- `EMOTION_TEXTS.destined_rival.delinquent`: 四六時中頭ん中にいやがる。絶対ぶっ倒す
- `EMOTION_TEXTS.destined_rival.cool`: ……いなければ、今の自分はいない。だからこそ、倒す
- `EMOTION_TEXTS.destined_rival.seductive`: 頭から離れない……悔しいけど、そういうことなのよね
- `EMOTION_TEXTS.destined_rival.polite`: その存在が、私を突き動かしています。必ず、超えてみせます
- `EMOTION_TEXTS.destined_rival.composed`: あの子とはいつか、決着をつけなければね。楽しみでもあるのよ
- `EMOTION_TEXTS.acquaintance.normal`: まあ、知ってはいるけど……それだけかな
- `EMOTION_TEXTS.acquaintance.ojousama`: 存じ上げてはおりますけれど、特別な感情はございませんわ
- `EMOTION_TEXTS.acquaintance.delinquent`: あー、いたな。別にどうでもいいけど
- `EMOTION_TEXTS.acquaintance.cool`: 認識はしている。それ以上でもそれ以下でもない
- `EMOTION_TEXTS.acquaintance.seductive`: 知ってるわよ、一応ね。……それだけ
- `EMOTION_TEXTS.acquaintance.polite`: お名前は存じています。お話する機会は少ないですけれど
- `EMOTION_TEXTS.acquaintance.composed`: そうねぇ、お名前くらいは存じているかしら
- `EMOTION_TEXTS.intrigued.normal`: なんだろう、目で追ってしまう。気にしてないと言えば嘘になる
- `EMOTION_TEXTS.intrigued.ojousama`: なぜかしら……気にかかって仕方がありませんの
- `EMOTION_TEXTS.intrigued.delinquent`: ……別に気にしてねーし。してねーけど、目に入んだよ
- `EMOTION_TEXTS.intrigued.cool`: 気にしていないつもりだった……
- `EMOTION_TEXTS.intrigued.seductive`: ちょっと気になるのよね……何がとは言えないけど
- `EMOTION_TEXTS.intrigued.polite`: つい気にかけてしまいます。理由はよくわかりませんが
- `EMOTION_TEXTS.intrigued.composed`: どういうわけか、あの子のことが気になるのよね
- `EMOTION_TEXTS.hostile_competitor.normal`: 負けたくない。それだけは、はっきりしている
- `EMOTION_TEXTS.hostile_competitor.ojousama`: 絶対に遅れを取りたくありませんの。それだけですわ
- `EMOTION_TEXTS.hostile_competitor.delinquent`: 負けねえ。死んでも負けねえ
- `EMOTION_TEXTS.hostile_competitor.cool`: 負けるわけにはいかない。理屈じゃない
- `EMOTION_TEXTS.hostile_competitor.seductive`: 負けたくないの。理由なんて知らないわ
- `EMOTION_TEXTS.hostile_competitor.polite`: どうしても負けたくないんです。強い気持ちがあります
- `EMOTION_TEXTS.hostile_competitor.composed`: 負けるわけにはいかないわ。穏やかに、でも譲らない
- `EMOTION_TEXTS.distant.normal`: 名前は知ってるけど、それ以上は別に
- `EMOTION_TEXTS.distant.ojousama`: 存じ上げてはおりますけれど、それ以上は……特に
- `EMOTION_TEXTS.distant.delinquent`: あー、いたな。それで?
- `EMOTION_TEXTS.distant.cool`: 認識しているだけ。それ以上はない
- `EMOTION_TEXTS.distant.seductive`: いたわね、そういえば。……それだけ
- `EMOTION_TEXTS.distant.polite`: お見かけはしますけれど、特には……
- `EMOTION_TEXTS.distant.composed`: お顔は存じているわ。それだけのことね
- `EMOTION_TEXTS.contempt.normal`: 同じリングに立っていい相手じゃない
- `EMOTION_TEXTS.contempt.ojousama`: わたくしと並ぶには、まだ早うございますわ
- `EMOTION_TEXTS.contempt.delinquent`: ハッ、雑魚が視界に入んな。場違いだ
- `EMOTION_TEXTS.contempt.cool`: 実力差は数字で出てる。語ることもない
- `EMOTION_TEXTS.contempt.seductive`: あらあら……まだそのレベルなのね。可愛いこと
- `EMOTION_TEXTS.contempt.polite`: ……失礼ですが、同じ土俵という気にはなれません
- `EMOTION_TEXTS.contempt.composed`: 同じ場に立つ相手だとは、思っていないの。ごめんなさいね
- `EMOTION_TEXTS.irritation.normal`: 視界に入るたび、地味にイラっとくる
- `EMOTION_TEXTS.irritation.ojousama`: どうにも、お顔を拝見するだけで気が立ちますの
- `EMOTION_TEXTS.irritation.delinquent`: チッ……顔見るだけでイライラすんだよ
- `EMOTION_TEXTS.irritation.cool`: 不快。距離を取りたい
- `EMOTION_TEXTS.irritation.seductive`: なんかね、無性にカチンとくるのよ。理由は知らない
- `EMOTION_TEXTS.irritation.polite`: ……正直、近くにいられると気が休まりません
- `EMOTION_TEXTS.irritation.composed`: あの子とは、どうしてもそりが合わないの。困ったことに
- `EMOTION_TEXTS.dislike.normal`: はっきり言って、好きじゃない。関わりたくもない
- `EMOTION_TEXTS.dislike.ojousama`: あの方とは、お話する気にもなれませんの
- `EMOTION_TEXTS.dislike.delinquent`: 嫌い。マジで嫌い。それだけ
- `EMOTION_TEXTS.dislike.cool`: 受け付けない。理屈じゃない
- `EMOTION_TEXTS.dislike.seductive`: ごめんなさいね、あの子は無理。生理的に
- `EMOTION_TEXTS.dislike.polite`: ……申し訳ありませんが、お近づきになりたくはありません
- `EMOTION_TEXTS.dislike.composed`: あの子のことは、はっきりと苦手ね。隠す気もないわ
- `EMOTION_TEXTS.cold_loathing.normal`: 視線も合わせない。いないものとして扱ってる
- `EMOTION_TEXTS.cold_loathing.ojousama`: わたくしの視界には、入れておりませんの
- `EMOTION_TEXTS.cold_loathing.delinquent`: ……あいつは、いねえもんとして扱ってる
- `EMOTION_TEXTS.cold_loathing.cool`: 存在を認識から外している。話すこともない
- `EMOTION_TEXTS.cold_loathing.seductive`: あら、誰のこと？……ふふ、知らない人だわ
- `EMOTION_TEXTS.cold_loathing.polite`: お話できることは、何もございません。失礼します
- `EMOTION_TEXTS.cold_loathing.composed`: あの子のことは、わたくしの中では終わっているの
- `EMOTION_TEXTS.dislike_strong.normal`: 顔も見たくない。同じ空気を吸いたくない
- `EMOTION_TEXTS.dislike_strong.ojousama`: 同じ空間にいるだけで、息が詰まりますの
- `EMOTION_TEXTS.dislike_strong.delinquent`: マジで無理。視界から消えてくれ
- `EMOTION_TEXTS.dislike_strong.cool`: 生理的に駄目。これは変わらない
- `EMOTION_TEXTS.dislike_strong.seductive`: ねえ、近寄らないでくれる？……本気で
- `EMOTION_TEXTS.dislike_strong.polite`: ……同じ場にいるだけで、耐えがたいのです
- `EMOTION_TEXTS.dislike_strong.composed`: 同じ部屋にいるのも辛いの。本当に、無理なのよ
- `EMOTION_TEXTS.hatred.normal`: 絶対に許さない。叩き潰すまで終わらない
- `EMOTION_TEXTS.hatred.ojousama`: あの方だけは、決して許しませんわ。何があっても
- `EMOTION_TEXTS.hatred.delinquent`: ぶっ潰す。マジでぶっ潰す。それしかねえ
- `EMOTION_TEXTS.hatred.cool`: 消したい。自覚している。そういう感情だ
- `EMOTION_TEXTS.hatred.seductive`: この気持ち、一生消えないと思う。許す気もないし
- `EMOTION_TEXTS.hatred.polite`: ……あの方のことは、生涯、許すつもりはございません
- `EMOTION_TEXTS.hatred.composed`: あの子だけは、どうしても許せないの。穏やかではいられないわ

## `SURVIVAL_MILESTONES`

- 出典: `src/app.js`
- コード内コメント: ╔══════════════════════════════════════════════════════════╗ / ║  SECTION 6c: SURVIVAL GAUGE (v0.97)                        ║ / ║  Startup deficit tracker — pure functions, no DOM          ║ / ╚══════════════════════════════════════════════════════════╝
- 本数: 10

### [].label

- `SURVIVAL_MILESTONES[1].label`: 初興行収入
- `SURVIVAL_MILESTONES[2].label`: スポンサー獲得
- `SURVIVAL_MILESTONES[3].label`: 初の月次黒字
- `SURVIVAL_MILESTONES[4].label`: 2ヶ月連続月次黒字
- `SURVIVAL_MILESTONES[5].label`: 経営安定化

### [].desc

- `SURVIVAL_MILESTONES[1].desc`: 興行でチケット・グッズ収入を得た
- `SURVIVAL_MILESTONES[2].desc`: 人気20到達でスポンサー収入が発生
- `SURVIVAL_MILESTONES[3].desc`: 直近4週の合計収支がプラスになった
- `SURVIVAL_MILESTONES[4].desc`: 安定経営が見えてきた
- `SURVIVAL_MILESTONES[5].desc`: 月次黒字定着＋資金確保！サバイバルクリア
