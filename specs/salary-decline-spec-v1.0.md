# 給与の下り坂(契約査定)仕様 v1.0

- 昇格: 2026-08-12(Fable)。P0(task-83)+P1(task-84)実装・P2較正完了を受けて確定仕様化
- 設計経緯・決定記録: `docs/salary-decline-proposal-v0.2.md`(v0.1は分析のみ有効)
- セリフの正: `docs/salary-decline-dialogue-draft-v0.1.md`(2026-08-12 Keisuke承認済み・343本)
- テスト: `test/salary-refix-test.js` / `test/salary-decline-cards-test.js`

## 1. 契約査定の年次サイクル(P0)

```
offWeek1: applySeasonEnd — 加齢・wear衰え・salaryBonus×0.8減衰
offWeek2: 契約交渉 — 判定は旧契約給与 vs 現在の適正給(再固定前の値)
offWeek3: 冒頭で再固定+吸収(Engine.contract.refixRoster) → 交渉の有無に関わらず毎季ちょうど1回
```

- **再固定**: `contractOVR=現在OVR / contractPop=現在人気` へ全ロスター(レンタル除く)を書き直す。
  給与のbase+popBonusが実力・人気に**両方向**で追従する(下り坂はここで実現される)
- **昇給吸収(absorption)**: `absorb = max(0, newBP − oldBP)` を salaryBonus から差し引く。
  昇給は「実力が評価に追いつくまでの前払い」であり、追いついた分は基本給に織り込まれる。
  数学的性質: 伸びた選手=給与総額 max(前給, 適正給)±1 / 衰えた選手=適正BP+bonus(+title)
- **入団時スタンプ**: `G.roster` への全加入経路で加入時点の contractOVR/contractPop を固定する。
  実装は `Engine.career.addEvent` の加入イベントフック(debut orgId='player' / transfer toOrg='player')
  +スカウト候補生成時スタンプ(headless経路用)+各経路の直接セット

## 2. 下り交渉カード(P1)

- **判定は査定比** `bpRatio = newBP / oldBP`(基本給部分同士。bonus込みのgapRatioでは判定しない):
  `bpRatio ≤ 0.90 かつ 減額幅 ≥ 10万 → decline-mid` / `≤ 0.75 かつ同上 → decline-large`
- **trust×マトリクス**:

| trust | attitude | 選択肢と効果 |
|---|---|---|
| 75+ | `decline_voluntary`(選手からの申し出) | 据え置く(trust+10, morale+3) / 受け入れる(trust+2) |
| 40〜74 | `decline`(査定減の通告) | 据え置く(trust+6, morale+2) / 査定どおり(trust≥60は±0、<60は−4) / 厳しく改定(bonus清算=適正給ちょうど、trust−10、調整後trust<40なら40%で移籍志願へ発展) |
| <40 | カードなし | 従来の低trust交渉が優先。壊れた関係の整理は放出の領分 |

- **据え置き(温情)**: 減額幅を `salaryDeclineHold` として選手に予約し、offWeek3の再固定が
  salaryBonusへ加算して消費する(**上限100は維持=超過分は据え置ききれない**。フィールドは消費後に除去、旧セーブ互換)
- **枠**: decline系は**季2枚まで**(減額幅の大きい順)。既存の交渉上位4名枠に同居。
  深刻度ソートは `|gapRatio−1|`(下りの負方向が埋もれないため)
- **カード化されなかった下り選手は静かに再固定される**。隠しペナルティなし(年次査定は制度として織り込み済み)
- **セリフ**: `CONTRACT_NEGOTIATION_LINES` 新フェーズ7種
  (`decline_open/accept/hold/strict` / `decline_voluntary_open/hold/accept`)、archetype×personality 343本
- **UI**: 既存交渉モーダルに同居。バッジ `📉 契約査定` / `🤝 減俸申し出`、
  金額行「現在の週給: X万 → 査定: Y万(−Z万/週)」。内部数値(trust等)は露出しない

## 3. 経済較正の確定値(P2)

- **SALARY_PARAMS は変更なし**(2026-08-12計測: pre/post統制比較40季×2シードで総支出x1.00〜x1.20、
  資金増加基調・破産0・退団引退分布同一。吸収がラチェットを消した分と基本給適正化が相殺)
- 較正後の実測帯(40季): gap≥1.3=34〜38%(残存はほぼ若手の成長由来) / 下り帯(≤0.90)=9〜11%(うちwear>0が9割超)
- 25%目標未達はKeisuke裁定で容認(2026-08-12「調整目標であり安全条件ではない」)

## 4. 不変条件(検算済み・テストで固定)

1. 再固定は1季にちょうど1回(交渉あり季・なし季とも)
2. `salaryBonus ∈ [0, 100]`(吸収・据え置き・清算のいずれでも維持)
3. 給与が動くのはオフシーズン処理と契約交渉のみ(titleBonus着脱を除く)
4. decline系は季2枚まで・trust<40には出さない
5. trustが上がるのは「据え置き」と「voluntaryの受け入れ」のみ
6. レンタル選手は再固定・交渉とも対象外
7. decline系が出ない季・旧セーブでも従来フローが完走する(fail-open)

## 5. やらないこと

- 年齢バンドの自動減額(下りは査定=シミュレーション実数で駆動)/ popBonusの加齢カット /
  シーズン中の週次減額 / 給与適正度メーターの常設UI / カード化されなかった査定減への隠しtrustペナルティ
- AI団体の contractOVR/contractPop 管理(AI団体は週次給与経済を持たない。移籍金 `calcFee` は現在OVR/人気ベースで契約値を参照しない)
