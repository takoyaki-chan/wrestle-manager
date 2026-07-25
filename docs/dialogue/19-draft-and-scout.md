# ドラフト・スカウト

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `Engine.draftNegotiation.NARRATION`

- 出典: `src/draft-negotiation.js`
- コード内コメント: §7.4 ナレーション
- 本数: 40

### fighting.org_s[]

- `Engine.draftNegotiation.NARRATION.fighting.org_s[1]`: {ORG}、引く気配なし
- `Engine.draftNegotiation.NARRATION.fighting.org_s[2]`: {ORG}、王者の貫禄で粘る
- `Engine.draftNegotiation.NARRATION.fighting.org_s[3]`: {ORG}、余裕の表情を崩さない
- `Engine.draftNegotiation.NARRATION.fighting.org_s[4]`: {ORG}、資金力を背景にじわじわ圧をかける

### fighting.org_a[]

- `Engine.draftNegotiation.NARRATION.fighting.org_a[1]`: {ORG}、ヒートアップ
- `Engine.draftNegotiation.NARRATION.fighting.org_a[2]`: {ORG}、勝負に出た
- `Engine.draftNegotiation.NARRATION.fighting.org_a[3]`: {ORG}、若い情熱で食い下がる
- `Engine.draftNegotiation.NARRATION.fighting.org_a[4]`: {ORG}、ここで引いたら育成計画が崩れる

### fighting.org_b[]

- `Engine.draftNegotiation.NARRATION.fighting.org_b[1]`: {ORG}、まさかの執念
- `Engine.draftNegotiation.NARRATION.fighting.org_b[2]`: {ORG}、地方の意地を見せる
- `Engine.draftNegotiation.NARRATION.fighting.org_b[3]`: {ORG}、小さな団体の大きな賭け
- `Engine.draftNegotiation.NARRATION.fighting.org_b[4]`: {ORG}、身の丈を超えた挑戦

### dropped.org_s[]

- `Engine.draftNegotiation.NARRATION.dropped.org_s[1]`: {ORG}、ここで撤退。王者にも見切り時はある
- `Engine.draftNegotiation.NARRATION.dropped.org_s[2]`: {ORG}、苦渋の判断で離脱。次の獲物を見据えるか
- `Engine.draftNegotiation.NARRATION.dropped.org_s[3]`: {ORG}、静かに席を立った。その背中に敗北の影はない

### dropped.org_a[]

- `Engine.draftNegotiation.NARRATION.dropped.org_a[1]`: {ORG}、無念の撤退
- `Engine.draftNegotiation.NARRATION.dropped.org_a[2]`: {ORG}、ここは引くしかなかった。拳を握りしめている
- `Engine.draftNegotiation.NARRATION.dropped.org_a[3]`: {ORG}、予算の限界。悔しさを滲ませて離脱

### dropped.org_b[]

- `Engine.draftNegotiation.NARRATION.dropped.org_b[1]`: {ORG}、現実的な判断で離脱
- `Engine.draftNegotiation.NARRATION.dropped.org_b[2]`: {ORG}、深追いせず撤退。堅実経営の信条を貫く
- `Engine.draftNegotiation.NARRATION.dropped.org_b[3]`: {ORG}、これ以上は無理と判断。潔い引き際

### playerWin.solo[]

- `Engine.draftNegotiation.NARRATION.playerWin.solo[1]`: 契約成立。静かに迎え入れる
- `Engine.draftNegotiation.NARRATION.playerWin.solo[2]`: 他に名乗りを上げる者はなかった。交渉成立

### playerWin.vs1[]

- `Engine.draftNegotiation.NARRATION.playerWin.vs1[1]`: 一騎打ちを制した
- `Engine.draftNegotiation.NARRATION.playerWin.vs1[2]`: 激しい交渉を勝ち抜いた
- `Engine.draftNegotiation.NARRATION.playerWin.vs1[3]`: 粘り強い交渉が実を結んだ

### playerWin.multi[]

- `Engine.draftNegotiation.NARRATION.playerWin.multi[1]`: 複数団体との争奪戦を勝ち抜いた！
- `Engine.draftNegotiation.NARRATION.playerWin.multi[2]`: 激戦の末、獲得に成功！
- `Engine.draftNegotiation.NARRATION.playerWin.multi[3]`: 3団体を退けての獲得。この選手にかけた執念が勝った

### playerLost[]

- `Engine.draftNegotiation.NARRATION.playerLost[1]`: 他団体に持っていかれた。次の機会を待とう
- `Engine.draftNegotiation.NARRATION.playerLost[2]`: 残念…他団体の執念が上回った
- `Engine.draftNegotiation.NARRATION.playerLost[3]`: 相手の本気度が一枚上手だった。縁がなかったと割り切るしかない

### flowThrough[]

- `Engine.draftNegotiation.NARRATION.flowThrough[1]`: 全団体が手を引いた。この選手はフリー市場へ
- `Engine.draftNegotiation.NARRATION.flowThrough[2]`: 誰も最後まで残らなかった。フリーエージェントとして再出発

### roundStart[]

- `Engine.draftNegotiation.NARRATION.roundStart[1]`: 交渉卓に緊張が走る
- `Engine.draftNegotiation.NARRATION.roundStart[2]`: 各団体の代表が表情を引き締める
- `Engine.draftNegotiation.NARRATION.roundStart[3]`: 金額が上がるごとに空気が重くなる
- `Engine.draftNegotiation.NARRATION.roundStart[4]`: 交渉は佳境を迎えている
- `Engine.draftNegotiation.NARRATION.roundStart[5]`: 静かな駆け引きが続く
- `Engine.draftNegotiation.NARRATION.roundStart[6]`: 次の一手が勝敗を分ける

## `Engine.scout.TIERS`

- 出典: `src/management.js`
- コード内コメント: Tier thresholds for assessedValue calculation
- 本数: 5

### [].label

- `Engine.scout.TIERS[1].label`: 超逸材
- `Engine.scout.TIERS[2].label`: 逸材
- `Engine.scout.TIERS[3].label`: 有望
- `Engine.scout.TIERS[4].label`: 原石
- `Engine.scout.TIERS[5].label`: 素材

## `Engine.draft.EVAL_TIERS`

- 出典: `src/management.js`
- コード内コメント: Coach evaluation tiers (potOVR distribution: 85-164, most 115-160)
- 本数: 6

### [].text

- `Engine.draft.EVAL_TIERS[1].text`: 将来のエース候補
- `Engine.draft.EVAL_TIERS[2].text`: 逸材の匂いがする
- `Engine.draft.EVAL_TIERS[3].text`: かなりの素質あり
- `Engine.draft.EVAL_TIERS[4].text`: 十分な伸びしろ
- `Engine.draft.EVAL_TIERS[5].text`: 堅実に育つタイプ
- `Engine.draft.EVAL_TIERS[6].text`: 未知数
