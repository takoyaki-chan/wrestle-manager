# task-84: 給与の下り坂P1 — 下り交渉カード実装

- 起票: 2026-08-12(Fable)
- 作業場所: **`C:\Users\nkmrk\Downloads\wrestle-manager-codex`(ブランチ `codex/agent-workspace`)**。
  mainフォルダ(`Downloads/wrestle-manager`)は触らない。**開始前にmainの最新を取り込むこと**
  (P0マージ `c5e1683` とセリフ草案改訂 `d182536` を含んでいること)
- マージ: Fableがdiffレビューと不変条件の検算をしてからmainへ

## 1. 目的

P0で毎季の査定(再固定)が両方向に動くようになった。大きな査定減となる選手を契約交渉
カード化し、「据え置き(温情)/査定どおり/厳しく」の選択を社長に渡す。
下り坂を黙った数値処理にせず、キャラクターの物語として見せる。

## 2. 仕様の正

- **`docs/salary-decline-proposal-v0.2.md` §4(P1: 4.1判定比/4.2マトリクス/4.3フェーズ/4.4UI)と§6(不変条件)**。
  本指示書に仕様を二重記載しない。実装前に必ず全文読むこと
- **セリフ本文の正: `docs/salary-decline-dialogue-draft-v0.1.md`(2026-08-12 Keisuke承認済み)**。
  343本を新フェーズ7種として `CONTRACT_NEGOTIATION_LINES` へ移す。
  行末の `※実在セルなし` `※08-12改` `※08-12 Keisuke改` は**レビュー用マーカーなので取り込まない**。
  文中の全角スペースは原文のまま。「執筆メモ」節と冒頭のレビュー説明はセリフではない
- P2較正の結論: **SALARY_PARAMS変更なし**(worklog 2026-08-12。較正済みなので触る理由がない)

## 3. 触ってよいファイル / 触ってはいけないファイル

| 区分 | ファイル |
|---|---|
| 変更可 | `src/management.js`(generateNegotiations のdecline判定・枠・深刻度ソート修正 / resolveNegotiation の新attitude分岐 / offWeek3再固定の据え置きフラグ消費) |
| 変更可 | `src/data.js`(**CONTRACT_NEGOTIATION_LINES への新フェーズ7種の追加のみ**。SALARY_PARAMSは1文字も変えない。既存セリフの改変禁止) |
| 変更可 | `src/ui-common.js`(showContractNegotiationModal のattitude分岐追加。新画面・新モーダルは作らない) |
| 変更可 | `test/auto-sim.js`(**autoHandleContractNegotiation への新attitude自動応答の追加のみ**。WM_SALARY_FIXTURE計測フックと既存の自動判断ロジックを壊さない) |
| 変更可 | `test/salary-decline-cards-test.js`(新規作成) |
| 変更禁止 | 上記以外のsrc全て / `src/index.html` / セーブ形式の破壊的変更(新フィールドは後方互換の追加のみ。旧セーブで新フィールド欠落でも落ちないこと) |

## 4. 実装内容(詳細はv0.2 §4)

1. **判定**: 査定比 `bpRatio = newBP / oldBP`(基本給部分同士。§4.1の式)。
   `≤0.90 かつ 減額幅≥10万 → decline-mid` / `≤0.75 かつ 同上 → decline-large`
2. **trust×マトリクス**(§4.2の表どおり): trust75+=`decline_voluntary` / 40〜74=`decline` / <40=カード無し
3. **選択肢と効果**: §4.2の表の値をそのまま。据え置きは「減額幅をsalaryBonusへ加算する予約フラグ」を
   選手に立て、offWeek3の再固定(Engine.contract.refixRoster)が消費する。上限100は維持
4. **枠**: decline系は季2枚まで(減額幅の大きい順)。既存の交渉上位4名枠に同居。
   深刻度ソートは `(gapRatio−1)` → `|gapRatio−1|` へ修正(下りが負で埋もれる問題)
5. **セリフ**: 承認済み343本を `[phase][archetype][personality]` で追加(既存raise_openと同型)。
   表示経路は既存raise系と同じで、`{tenure}`/`{record}` 置換が効くこと
6. **UI**: バッジ `📉 契約査定` / `🤝 減俸申し出`、金額行「現在の週給: X万 → 査定: Y万(−Z万/週)」。
   色はCSSトークンのみ(ハードコード16進禁止)
7. **auto-sim自動応答**: decline: A30/B50/C20%、decline_voluntary: A30/B70%

## 5. 数値目標と不変条件(対で書く)

| 数値目標 | 対になる不変条件(これを壊して目標を満たすのは失敗) |
|---|---|
| 40季auto-simでdecline系カードが実際に発生する(0でない) | **I-1**: 昇給側(raise/transfer)交渉の発生件数・attitude分布を変えない(前後比較±10%以内)。declineを出すために昇給判定や下り判定の閾値を細工しない |
| decline_voluntary がtrust75+帯で発生する | **I-2**: decline系は季2枚まで。trust<40には一切出さない(§6-5) |
| 「据え置き」選択で翌季更改の給与総額が下がらない | **I-3**: `salaryBonus ∈ [0,100]` を維持。据え置き加算で100を超える分は据え置ききれない(§6-2)。負値を作らない |
| 「厳しく改定」で給与が適正給ちょうどになる | **I-4**: trustが上がるのは「据え置き」と「voluntaryの受け入れ」のみ(§6-6) |
| — | **I-5**: 給与が動くのはオフシーズン処理と契約交渉のみ(§6-4)。tickWeek通常週パイプラインに手を入れない |
| — | **I-6**: レンタル選手は対象外(§6-7)。`Engine.validateGameState` 全季違反0 |
| — | **I-7**: decline系が1枚も出ない季・旧セーブでも従来の交渉フローが完走する(fail-open。詰まると週が進まない) |

## 6. 検証手順(すべてフォアグラウンド実行。run_in_background禁止)

```bash
node --check src/management.js && node --check src/data.js && node --check src/ui-common.js
node test/salary-decline-cards-test.js   # 新規: 判定比/枠/trust帯/据え置き消費/厳格清算の数学
node test/salary-refix-test.js           # P0の回帰
npm test                                 # 全PASS
node test/auto-sim.js 40 7919            # ALL CLEAR
WM_SALARY_FIXTURE=1 node test/auto-sim.js 40 7919
WM_SALARY_FIXTURE=1 node test/auto-sim.js 40 42
```

- auto-simはシード毎に分割して直列で回す
- fixture 2本で: gap分布がP0後の帯(gap≥1.3が34〜38% / 下り帯9〜10%)から大きく動かないこと、
  decline/voluntaryカードの発生数と自動応答の内訳をレポート

## 7. 完了条件

- diffは§3の変更可ファイルのみ。無関係なリファクタ・整形を混ぜない
- コミットは3粒度: (1)エンジン(判定+解決+据え置き消費+ソート修正) (2)セリフデータ343本 (3)UI+auto-sim対応+テスト
- 完了レポートに記載: decline/voluntary発生数(40季×2シード)、選択肢別内訳、I-1〜I-7の確認方法1行ずつ、
  Keisukeに見てもらうUI確認ポイントの列挙(UI確認はKeisukeに委任)
