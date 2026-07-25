# 挑戦（直訴／遠征）セリフ 全棚卸し — 書き直し用

作成 2026-07-25。挑戦試合(challenge-request)まわりで「誰が・どの場面で・どの条件で・どのセリフを言うか」を全部並べたもの。**書き直しの土台**。各行にIDを振ってあるので「REQ-BASE-composed-hostile-1 をこう変えたい」のように指定すれば実装できます。

## 前提：軸と分岐ロジック

- **archetype（口調）7種**: `composed`(鷹揚) / `ojousama`(お嬢様) / `polite`(丁寧) / `seductive`(艶) / `delinquent`(不良) / `cool`(クール) / `normal`(標準)。**セリフは全部この軸で分ける**（personalityで分けると口調崩壊するため）。
- **type 2種（打診者セリフのみ）**: `hostile`（bond<50＝わだかまり）/ `respectful`（bond≥50＝敬意）。
- **style 6種（打診者セリフのみ）**: Grappler / Brawler / Striker / Submission / Aerial / Allround（戦法フレーバー）。
- **方向**: `forward`（自団体→他団体へ遠征＝送り出す）/ `inverse`（他団体→自団体へ来る＝迎え撃つ、解雇者の遺恨含む）。

---

## 場面一覧（フロー順）

| 場面 | 誰が | いつ | 使うプール |
|---|---|---|---|
| S1 直訴が上がる | 取次コーチ＋打診者 | heat≥90で発火・打診モーダル | COACH-PETITION / REQ-BASE / REQ-STYLE / FLAVOR |
| S2 断る | 打診者 | NO選択時・ティッカー | NO-LINES |
| S3 試合本編 | 選手 | 遠征/迎撃の3試合 | （通常の試合エンジン側。挑戦固有セリフなし） |
| S4 結果発表 | 取次コーチ＋代表選手 | 結果モーダル「果たし状、成就。」 | TITLE-RESULT / COACH-RESULT / 代表リアクション |

---

# S1. 直訴モーダル

## S1-a. 取次コーチのナレーション（地の文・上段の暗色ストリップ）
選手名・団体名が入る。1本ずつ（分岐なし）。

- `COACH-PETITION-fwd`（送り出す）: 「社長、**{打診者}**選手から直訴です。**{相手団体}**の**{相手}**選手と試合をさせてほしい、と。」
- `COACH-PETITION-inv`（来る／解雇者含む）: 「社長、**{打診者団体}**の**{打診者}**選手から直訴です。古巣の**{相手}**選手とリングで決着をつけたい、と。」

## S1-b. 打診者のセリフ（頭上の吹き出し・**ここが「基本セリフ」**）
抽選: `type = bond<50 ? hostile : respectful`。**60%で REQ-STYLE（戦法入り）／40%で REQ-BASE**。styleが無いキャラは常にBASE。

### REQ-BASE（archetype × type × 3）＝ 42本
> composed
- `REQ-BASE-composed-hostile-1`: あの相手と、けじめをつけたい。次の興行で組んでもらえないか。
- `REQ-BASE-composed-hostile-2`: 社長、あの一戦は私で背負わせてくれ。引きずってばかりはいられない。
- `REQ-BASE-composed-hostile-3`: 気持ちが落ち着かない相手がいる。リングで決着させてほしい。
- `REQ-BASE-composed-respectful-1`: あの選手と、本気で向き合いたい。次の興行で組めないか。
- `REQ-BASE-composed-respectful-2`: 社長、あの人と一度、まともに当たらせてくれ。
- `REQ-BASE-composed-respectful-3`: 同じマットに上がれるなら、いま欲しい一戦がある。

> ojousama
- `REQ-BASE-ojousama-hostile-1`: あの方とは、リングで決着をつけねば気が済みませんの。
- `REQ-BASE-ojousama-hostile-2`: 社長、不躾なお願いですが…あの選手と、一戦お願いいたしますわ。
- `REQ-BASE-ojousama-hostile-3`: 心が落ち着きませんの。あの相手と、組んでくださいませ。
- `REQ-BASE-ojousama-respectful-1`: あの方と、一度きちんと拳を交えとうございますの。
- `REQ-BASE-ojousama-respectful-2`: 社長、お聞き入れいただきたいのです。あの選手とのお試合を。
- `REQ-BASE-ojousama-respectful-3`: あの方とリングで向き合えるなら、それ以上の喜びはございませんわ。

> polite
- `REQ-BASE-polite-hostile-1`: 社長、お願いがあります。あの選手と決着をつけさせてください。
- `REQ-BASE-polite-hostile-2`: けじめをつけたいんです。あの相手との試合、組んでいただけませんか。
- `REQ-BASE-polite-hostile-3`: ご無理を承知でお願いします。あの方と当たらせてください。
- `REQ-BASE-polite-respectful-1`: 社長、突然で申し訳ありません。あの選手と試合を組んでいただけませんか。
- `REQ-BASE-polite-respectful-2`: お時間恐縮です。あの方と、本気の試合をさせていただきたく。
- `REQ-BASE-polite-respectful-3`: ご検討いただきたいのですが、あの相手と一度組ませてください。

> seductive
- `REQ-BASE-seductive-hostile-1`: あの女、放っておけないの。リングで答え合わせさせて。
- `REQ-BASE-seductive-hostile-2`: 社長、あの相手と組んでくれない? 借り、返さなきゃいけないから。
- `REQ-BASE-seductive-hostile-3`: モヤモヤしてるの。あの試合、組んでちょうだい。
- `REQ-BASE-seductive-respectful-1`: あの人と、一度きちんと向き合いたいの。組んでくれる?
- `REQ-BASE-seductive-respectful-2`: 次の興行で、あの相手と当たれたら…私、燃えるわよ。
- `REQ-BASE-seductive-respectful-3`: 気になる人がいるの。リング、用意してもらえる?

> delinquent
- `REQ-BASE-delinquent-hostile-1`: 社長、あいつと一発やらせてくれ。けじめがつかねぇんだ。
- `REQ-BASE-delinquent-hostile-2`: あの女、ほっとけねぇんすよ。次の興行で組ませてください。
- `REQ-BASE-delinquent-hostile-3`: すみません、あの相手と決着つけたいんで、リング組んでくれません?
- `REQ-BASE-delinquent-respectful-1`: あの人とやってみたいんすよ。次の興行、ねじ込めません?
- `REQ-BASE-delinquent-respectful-2`: 社長、お願いっす。あの相手と組ませてください。
- `REQ-BASE-delinquent-respectful-3`: いっぺん本気で当たりたい相手がいるんで、頼みます。

> cool
- `REQ-BASE-cool-hostile-1`: あの相手と、決着を。
- `REQ-BASE-cool-hostile-2`: 社長、あの一戦を組んでくれ。
- `REQ-BASE-cool-hostile-3`: けじめが要る。あの選手との試合を。
- `REQ-BASE-cool-respectful-1`: あの選手と、組ませてくれ。
- `REQ-BASE-cool-respectful-2`: 次の興行に、あの相手を。
- `REQ-BASE-cool-respectful-3`: あの人とやりたい。お願いします。

> normal
- `REQ-BASE-normal-hostile-1`: あの相手と決着をつけたい。次の興行で組んでもらえませんか。
- `REQ-BASE-normal-hostile-2`: 社長、お願いがあります。あの選手との試合、私にやらせてください。
- `REQ-BASE-normal-hostile-3`: ずっと引きずってる相手がいるんです。一度しっかり当ててほしい。
- `REQ-BASE-normal-respectful-1`: あの選手と本気でやってみたい。次のチャンスにねじ込めませんか。
- `REQ-BASE-normal-respectful-2`: 気になる相手がいるんです。次の興行で組めるなら、お願いします。
- `REQ-BASE-normal-respectful-3`: いつかと言わず、今やりたい相手がいます。社長、舞台をください。

### REQ-STYLE（style × archetype × type × 1）＝ 84本
戦法フレーバー入り。60%でこちらが優先。`REQ-STYLE-{style}-{archetype}-{type}`。

**Grappler（組み技/グラウンド）**
- composed-hostile: あの相手と床で組み合いたい。立ち技じゃ終わらせない。
- composed-respectful: あの人と腰を据えて組みたい。グラウンドで答えを出したい相手だ。
- ojousama-hostile: あの方と、マットの上でじっくり組み合わせていただきたいですの。
- ojousama-respectful: あの方と組み合っての勝負が、しとうございますの。
- polite-hostile: 失礼を承知でお願いします。あの選手と組み技で正面から組ませてください。
- polite-respectful: 組み合いの間合いを学びたい相手がいます。同じマットに上げてください。
- seductive-hostile: あの子と床で絡みたいの。立ち技で逃げられたら、つまらないでしょ?
- seductive-respectful: あの人とマットでじっくり組み合いたいの。やらせてくれる?
- delinquent-hostile: あの女と床で転がりたいんすよ。組み合えばあたしのもんっす。
- delinquent-respectful: 組みたい相手がいるんすよ。マットの上でじっくり、お願いっす。
- cool-hostile: あの相手と、グラウンドで決着を。
- cool-respectful: あの人と、組み技で。お願いします。
- normal-hostile: あの相手とグラウンドで決着つけたい。立ち技じゃ終わらない試合になる。
- normal-respectful: 組み技で当たりたい相手がいます。じっくり腰を据えた一戦を、お願いします。

**Brawler（殴り合い/痛み）**
- composed-hostile: あの相手と打ち合いたい。痛みごと飲み込む試合を組んでくれ。
- composed-respectful: あの人と真っ向から殴り合いたい。組ませてくれないか。
- ojousama-hostile: あの方と、痛みを分け合うお試合がしとうございますの。お願いしますわ。
- ojousama-respectful: あの方と真っ向から打ち合うお試合を…組んでくださいませ。
- polite-hostile: ご無礼を承知でお願いします。あの選手と打ち合いの試合、最後まで立ち続ける覚悟で。
- polite-respectful: 真っ向から殴り合いたい相手がいます。ぶつかる試合を組ませてください。
- seductive-hostile: あの女と殴り合いたいの。痛みなんてどうでもいい、組んでちょうだい。
- seductive-respectful: あの人と痛み分けしたいの。真正面から、組ませて?
- delinquent-hostile: あの女と殴り合わせろっす。痛みなんざ承知の上っすから。
- delinquent-respectful: あの人と打ち合いたいんすよ。腹括ったやつ、組ませてください。
- cool-hostile: あの相手と、打ち合いを。
- cool-respectful: あの人と、殴り合いたい。お願いします。
- normal-hostile: 打ち合いで決着つけたい相手がいます。逃げない試合を、お願いします。
- normal-respectful: 真正面から殴り合える相手だと思ってます。組ませてください。

**Striker（打撃/蹴り/間合い）**
- composed-hostile: あの相手の打撃、私の打撃で迎え撃ちたい。間合いの取り合いを組んでくれ。
- composed-respectful: あの人と打撃で噛み合いたい。蹴り合いの試合を組ませてくれ。
- ojousama-hostile: あの方の打撃を、わたくしの打撃で押し返してみせますわ。
- ojousama-respectful: あの方と打撃の応酬を…一度、お試合を組んでくださいませ。
- polite-hostile: 失礼ながら、あの選手と打撃の間合いで決着をつけさせてください。
- polite-respectful: 打撃の精度を試したい相手がいます。蹴り合いの試合を組ませてください。
- seductive-hostile: あの女の顔、私の蹴りで止めたいの。間合いだけは取らせてくれる?
- seductive-respectful: あの人と打撃で噛み合いたいの。間合いの読み合い、組ませて?
- delinquent-hostile: あの女の顔面に一発入れたいんすよ。打撃で勝負させてください。
- delinquent-respectful: あの人の蹴りに、あたしの蹴り合わせたいんすよ。間合い、もらえません?
- cool-hostile: 打撃で、決着を。あの相手と。
- cool-respectful: あの人と、蹴り合いを。
- normal-hostile: あの相手と打撃戦で決めたい。間合いの読み合いで答えを出します。
- normal-respectful: 打撃で噛み合う相手だと思ってます。蹴り合いの試合、お願いします。

**Submission（関節/極め）**
- composed-hostile: あの相手の関節、私の極めで取りに行きたい。組ませてくれないか。
- composed-respectful: あの人と極め合いたい。技術の試合を組ませてくれ。
- ojousama-hostile: あの方の腕、わたくしのサブミッションで…と思っておりますの。
- ojousama-respectful: あの方と関節技の応酬がしとうございますわ。組んでくださいませ。
- polite-hostile: お願いがあります。あの選手とサブミッションの応酬で決着をつけさせてください。
- polite-respectful: 極め合いを学びたい相手がいます。技術の試合を組ませてください。
- seductive-hostile: あの女の腕、私の手で極めたいの。タップ取らせてちょうだい?
- seductive-respectful: 関節の取り合いって、楽しいでしょ? あの人と組ませて?
- delinquent-hostile: あの女の関節、極めたいんすよ。タップ取るまで離さないっす。
- delinquent-respectful: あの人と極め合いたいんすよ。技の試合、お願いっす。
- cool-hostile: あの相手と、極め合いを。
- cool-respectful: あの人と、関節技で。
- normal-hostile: 関節技で勝負したい相手がいます。最後はタップで決着、お願いします。
- normal-respectful: サブミッションで噛み合う相手だと思ってます。技術戦を組ませてください。

**Aerial（空中戦）**
- composed-hostile: あの相手の頭上から飛びたい。空中戦の試合を組んでくれ。
- composed-respectful: あの人と空中で交わってみたい。お互い飛ぶ試合、組ませてくれ。
- ojousama-hostile: あの方の頭上から、わたくしの一発を落とさせていただきますわ。
- ojousama-respectful: あの方と、空中でのお試合がしとうございますの。組んでくださいませ。
- polite-hostile: ご無礼ながら、あの選手の頭上から飛ぶ試合を組ませてください。
- polite-respectful: 空中の技を試したい相手がいます。飛ぶ試合を組ませてください。
- seductive-hostile: あの子の真上に、ダイブ決めたいの。一発でいいから組ませて?
- seductive-respectful: 空中戦で噛み合いそうな人がいるの。ふたりで飛ばせてもらえる?
- delinquent-hostile: あの女のド真ん中に上から落としたいんすよ。リング、用意してくれません?
- delinquent-respectful: あの人と空中戦やりたいんすよ。お互い飛んで落とすやつ、組ませてください。
- cool-hostile: 上から、決める。あの相手を。
- cool-respectful: あの人と、空中戦を。
- normal-hostile: 空中戦で決着つけたい相手がいます。リスクを取った試合を、お願いします。
- normal-respectful: ダイブで噛み合う相手だと思ってます。空中戦の舞台、お願いします。

**Allround（総合力/引き出し）**
- composed-hostile: 引き出し全部、あの相手にぶつけたい。逃げ場のない試合を組んでくれ。
- composed-respectful: あの人と技の応酬がしたい。お互い手の内全部出すやつ、組ませてくれ。
- ojousama-hostile: わたくしの引き出し、あの方にすべてお見せしますわ。お試合、お願いしますの。
- ojousama-respectful: あの方と、技の応酬がしとうございますの。お試合を組んでくださいませ。
- polite-hostile: 失礼を承知でお願いします。あの選手と全領域で噛み合う試合を組ませてください。
- polite-respectful: 引き出しを試したい相手がいます。総合力の試合を組ませてください。
- seductive-hostile: あの女に、私の手の内ぜんぶ見せたいの。組ませてちょうだい?
- seductive-respectful: あの人となら、ぜんぶ出せそうなの。技の応酬、組ませて?
- delinquent-hostile: 持ってる技、あの女に全部叩きつけたいんすよ。組ませてください。
- delinquent-respectful: あの人と引き出し比べしたいんすよ。総合力の試合、お願いっす。
- cool-hostile: 全部、ぶつける。あの相手に。
- cool-respectful: あの人と、技の応酬を。
- normal-hostile: 全領域で噛み合う相手だと思ってます。引き出しの試合、お願いします。
- normal-respectful: 技の応酬で決着がつく相手です。総合力で当たりたい、お願いします。

## S1-c. 社長視点のフレーバー1行（`.fc1m-rivalry`・地の文・選手名入りOK）
条件: `pure`(bond<50 かつ rivalry≥60・純粋憎悪) / `respect`(bond≥75・好敵手) / それ以外。{r}=打診者名, {o}=相手名。

- `FLAVOR-pure-1`: {r}の中で、何かが煮詰まっている
- `FLAVOR-pure-2`: {r}は{o}の名前を出すたびに目つきが変わる
- `FLAVOR-pure-3`: {r}の溜めたものは、リングでしか出せない
- `FLAVOR-respect-1`: {r}は{o}との次の一戦を待ち続けている
- `FLAVOR-respect-2`: {r}の中で{o}は、特別な位置にいる
- `FLAVOR-respect-3`: {r}が{o}の試合映像を何度も見返しているらしい
- `FLAVOR-normal-1`: {r}は{o}に強い思いを抱いている
- `FLAVOR-normal-2`: {r}の中で、{o}との決着が宿題になっている
- `FLAVOR-normal-3`: {r}は{o}を意識しすぎている節がある

## S1-d. UIテキスト（セリフではないが関連）
- タイトル: 📜 挑戦試合の直訴
- プロンプト: forward「この直訴、社長としてどう答えますか？」/ inverse「この越境試合、社長として受けますか？」
- 決定A: forward「この舞台、組もう」（ヒント: 次の通常興行週、自団体興行より先に{相手団体}へ3人で遠征する）/ inverse「受けて立つ」
- 決定B: forward「今は時期じゃない」/ inverse「お引き取り願う」

---

# S2. 断ったとき（NO選択・ティッカー）
`CHALLENGE_REQUEST_NO_LINES`（archetype × 2）。落胆／諦め。`NO-{archetype}-{n}`。

- composed-1: ……そうか。社長がそう言うなら、今は引っ込めておく。
- composed-2: 今じゃないってことだな。承知した。借りは消えないが。
- ojousama-1: ……さようでございますの。失礼いたしましたわ。
- ojousama-2: ご判断、承りますわ。…でも、忘れたわけではございませんの。
- polite-1: ……承知しました。失礼いたしました。
- polite-2: ご判断、受け止めます。お時間いただいたこと、感謝いたします。
- seductive-1: あら、ダメなの? ……まあ、いいわ。今は引いてあげる。
- seductive-2: ……つれないのね。でも、諦めたわけじゃないわよ?
- delinquent-1: マジっすか……まあ、社長の判断なら仕方ねぇっす。
- delinquent-2: 今じゃねぇってことっすね。分かったっす、引っ込めますわ。
- cool-1: ……分かった。
- cool-2: ……そう。
- normal-1: ……わかりました。タイミングじゃないってことですね。
- normal-2: 社長の判断なら従います。でも、忘れたわけじゃないので。

---

# S4. 結果モーダル「果たし状、成就。」

## S4-a. タイトル（勝敗×方向）
- `TITLE-fwd-win`: 果たし状、成就。
- `TITLE-fwd-lose`: 果たし状、敗れる。
- `TITLE-fwd-draw` / `TITLE-inv-draw`: 挑戦、痛み分け。
- `TITLE-inv-win`（迎撃成功）: 挑戦、退ける。
- `TITLE-inv-lose`（迎撃失敗）: 挑戦、許す。

## S4-b. 取次コーチの総括ナレーション（地の文・選手名/スコア入り）
`COACH-RESULT-{fwd/inv}-{win/lose/draw}`。{req}=打診者, {opp}=相手, {ps}-{as}=スコア。

- fwd-win: 社長、挑戦試合 {ps}-{as}。{req}選手が呼んだ舞台、しっかり制しました。
- fwd-lose: 社長、挑戦試合 {ps}-{as}。{req}選手の直訴…結果が伴いませんでした。
- fwd-draw: 社長、挑戦試合 {ps}-{as}の痛み分け。{req}選手と{opp}選手の決着は持ち越しです。
- inv-win: 社長、挑戦試合 {ps}-{as}。{相手団体}の{req}選手の越境挑戦、退けました。
- inv-lose: 社長、挑戦試合 {ps}-{as}。{req}選手陣に古巣として星を取られる結果になりました。
- inv-draw: 社長、挑戦試合 {ps}-{as}の痛み分け。{req}選手と{opp}選手の決着は持ち越しです。

## S4-c. 代表選手のリアクション（頭上の吹き出し＋ラベル）
勝敗×方向で「誰を映すか」と「どのプールを引くか」が変わる。

| ケース | 映る選手 | ラベル | 使うプール |
|---|---|---|---|
| **forward-win** | 自団体・打診者 | 挑戦を実らせた代表 | ⚠**現状=汎用`VICTORY_LINES`**（→今回の発端。専用プール新設予定） |
| inverse-win（迎撃成功） | AI・挑んで敗れた相手 | 挑み、敗れた代表 | REACT lose |
| forward-lose | AI・受けて勝った相手 | 受けて、勝った代表 | REACT win |
| inverse-lose（迎撃失敗） | 自団体・受けて敗れた代表 | 受けて、敗れた代表 | REACT lose |
| draw | 決着つかず側 | 〜決着つかず | REACT draw |

### S4-c-1. forward勝利の代表セリフ（＝作り直しの主対象）
現状は汎用 `VICTORY_LINES[選手ID]`（一般的な勝利台詞）を流用。フォールバック1本のみ挑戦専用:
- `VICTORY-forward-fallback`: この勝利、みんなでつかみ取りました！

→ **CH-5で専用プール `CHALLENGE_REQUEST_VICTORY_LINES`（archetype×3）を新設予定**。Opus初稿は保留（このドキュメントで方針を決め直してから）。

### S4-c-2. 相手選手リアクション `CHALLENGE_REQUEST_OPPONENT_REACTIONS`（archetype × _accept/win/lose/draw）
`REACT-{archetype}-{key}-{n}`。_accept は受諾時／フォールバック。win/lose/draw は相手陣(teamB)視点の結果。

> composed — _accept: [受けよう。来るなら正面から来い。 / 名指しされた以上、逃げ隠れはしない。リングで応えよう。 / いいだろう。あんたの覚悟、受け止める。] win: [やはり、受けて正解だった。 / この程度は、想定の内だ。] lose: [……力及ばず、か。次は違う。 / 負けは負けだ。しかし、悔いはない。] draw: [決着はまた次だ。悪くない一戦だった。 / 痛み分けか。これはこれで、収穫はあった。]

> ojousama — _accept: [お受けいたしますわ。リングでお迎えいたしますの。 / わたくしを名指しなさるのね。ならば、相応のお返事をいたしますわ。 / 光栄ですわ。お試合、お引き受けいたします。] win: [ほら、申し上げた通りですわ。 / お受けして正解でしたわね、ふふ。] lose: [……悔しいですけれど、これも経験ですわ。 / 負けを認めるのも、淑女のたしなみですの。] draw: [痛み分け、ですのね。次こそは勝たせてもらいますわ。 / 決着つかずとは……もどかしいですわ。]

> polite — _accept: [ご指名、ありがたく頂戴します。失礼のない試合をします。 / 直訴で組まれた試合とのこと。お受けいたします。最善を尽くします。 / こちらこそお願いします。ベストを尽くしてお迎えします。] win: [お受けして良かったです。ありがとうございました。 / 全力を尽くした結果です。感謝しています。] lose: [力及ばず、申し訳ありません。次に活かします。 / 悔しいですが、これが今の実力です。] draw: [決着つかずでしたが、良い試合でした。 / 痛み分けとのこと。次の機会を待ちます。]

> seductive — _accept: [あら、私を選んでくれたの? ふふ、受けて立つわよ。 / そんなに私とやりたいの? いいわ、リングで応えてあげる。 / 名指しされたら、断る理由なんてないでしょ?] win: [ね、言ったでしょ。受けて正解だったって。 / ふふ、やっぱり私を選んで正解よ。] lose: [あら……今日はあなたに華を持たせてあげる。 / 悔しいけど、負けも悪くない気分よ。] draw: [決着つかず、ね。じれったいけど……嫌いじゃないわ。 / 痛み分けか。続きはまた今度、しましょう?]

> delinquent — _accept: [上等っす。来るなら来いっすよ、全部受けてやるんで。 / 指名されたんなら、断る理由ねぇっす。リングで返事しますわ。 / そう来たか。面白ぇ、付き合うっすよ。] win: [言った通りだろ、受けて正解だったぜ。 / 上等、って言った通りになったな。] lose: [ちっ……今日のところは負けを認めてやるよ。 / 悔しいけど、力及ばずだ。次は絶対勝つ。] draw: [決着つかずか。中途半端だな、こりゃ。 / 痛み分けって柄じゃねぇんだけどな。]

> cool — _accept: [……受ける。 / ……望むところ。 / ……来い。リングで答える。] win: [……当然だ。 / ……勝つと言った。] lose: [……そうか。 / ……負けは、認める。] draw: [……引き分けか。 / ……決着は、また。]

> normal — _accept: [受けて立ちます。リングで決着をつけましょう。 / 名指しされた以上、逃げません。同じ気持ちで向き合います。 / いいでしょう。あなたの直訴、受けます。] win: [受けて正解でした。全力を出せた試合です。 / やはり、受けるべき試合でした。] lose: [力及ばず、悔しいです。次は違う結果を。 / 負けは負けです。でも後悔はありません。] draw: [決着つかず、でしたが良い経験になりました。 / 痛み分け。次はもっと踏み込みます。]

---

## 実データの所在（実装時の参照）
- REQ-BASE: `src/data.js` `CHALLENGE_REQUEST_LINES`（~9598）
- REQ-STYLE: `src/data.js` `CHALLENGE_REQUEST_LINES_STYLE`（~9696）
- 抽選: `src/relationships.js` `pickRequesterLine`（3632）
- FLAVOR: `src/relationships.js` `pickFlavorLine`（3665）
- NO: `src/data.js` `CHALLENGE_REQUEST_NO_LINES`（~9871）
- REACT: `src/data.js` `CHALLENGE_REQUEST_OPPONENT_REACTIONS`（~9800）
- コーチ/タイトル/代表リアクション分岐: `src/ui-common.js` 打診 `showChallengeRequestModal`（10949〜）/ 結果 `showChallengeRequestResultModal`（11145〜）/ 代表選定 `_challengeRequestResultReaction`（11100〜）
- forward勝利プール(新設予定): `CHALLENGE_REQUEST_VICTORY_LINES`
