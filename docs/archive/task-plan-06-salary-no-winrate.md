# TASK-04: 給料交渉から勝率ロジックを撤去 — 計画書

## 概要

契約更新交渉ロジックから勝率（winRate）を判断材料として撤去し、OVR・人気・タイトル歴・在籍年数等の自然な交渉材料で代替する。

## 現状の問題

### 勝率の使用箇所

`Engine.contract.extractContext()` (engine.js L12931-12960):
```js
const wins = fighter.wins || 0;
const losses = fighter.losses || 0;
const total = wins + losses + (fighter.draws || 0);
// ...
let record = 'average';
if (total > 0) {
  const winRate = wins / total;
  if (winRate >= 0.6) record = 'good';
  else if (winRate < 0.35) record = 'bad';
}
if (fewMatches) record = 'few_matches';
```

`record` は `extractContext` の返り値に含まれ、以下で使用される:

1. **セリフ差し込み** `_insertRecord()` (engine.js L13155-13161):
   - `{record}` プレースホルダーをセリフテンプレートに差し込み
   - テンプレート (data.js L4230-4234):
     - good: '去年は{wins}勝{losses}敗。結果は出してたと思うんですけど。'
     - average: '成績は{wins}勝{losses}敗。悪くはなかったはずです。'
     - bad: '成績が{wins}勝{losses}敗で……自分でもわかってます。でも……'
     - few_matches: 'あんまり試合に出してもらえなかった……。'

2. **交渉の態度・確率には直接影響しない**: `record` は現在セリフの文脈のみで使用されており、交渉の発火確率や態度決定（L13007-13100）には勝率が直接使われていない。

### 勝率の問題点

1. **累積勝率**: `fighter.wins / fighter.losses` はキャリア通算。初期にたくさん負けた選手が後半好調でも勝率が低いまま
2. **社長の責任**: 勝率はカード編成（社長の判断）に大きく依存。選手が「勝率が低い」と自分を責めるのは不自然
3. **試合数格差**: たくさん出場した選手と少ない選手で勝率の意味が異なる
4. **セリフの不整合**: 勝率が低い強豪選手が「成績が悪くて…」と言うのが不自然

### 別ファイルでの勝率使用

- `Engine.retirement.calcRecentWinRate()` (engine.js L2003-2004): 引退判定で使用 → 今回の対象外
- `Engine.rival._bidWinRate` (engine.js L7447-7448): AI移籍入札 → 今回の対象外

これらは別の文脈で使われており、契約交渉とは独立している。

## 変更方針

### 方針: recordをOVR・人気・タイトル歴ベースに再設計

#### 変更1: extractContext の record 算出ロジック改修 (engine.js L12942-12949)

```js
// 変更前: winRateベース
// 変更後: OVR・人気・タイトル歴ベース
let record = 'average';
const ovr = Engine.util.ov(fighter);
const pop = fighter.popularity || 0;
const hasTitleHistory = (fighter.careerRecord?.totalTitleWins || 0) > 0;
const isChampion = state.titles?.world?.championId === fighter.id;

if (isChampion || (ovr >= 70 && pop >= 50)) {
  record = 'ace';  // エース格
} else if (ovr >= 60 || pop >= 40 || hasTitleHistory) {
  record = 'good'; // 実績あり
} else if (fewMatches) {
  record = 'few_matches'; // 試合出場が少ない
} else {
  record = 'developing'; // 発展途上
}
```

**数値パラメータ根拠:**

`ovr >= 70 && pop >= 50` (ace判定):
- 基準スケール: OVR 70は「業界上位」に位置する。人気50は「中堅以上」の認知度
- 相対比較: 全キャラのOVR分布で上位20%程度が70+、人気50+は団体の顔クラス
- プレイヤー体験: このランクの選手が「自分は結果を出している」と言うのは自然

`ovr >= 60 || pop >= 40 || hasTitleHistory` (good判定):
- 基準スケール: OVR 60は「一人前」、人気40は「ファンに認知されている」
- 相対比較: ロスターの平均的な中堅選手がここに入る
- プレイヤー体験: 中堅以上なら「悪くなかった」と言えるのは自然

#### 変更2: セリフテンプレートの改修 (data.js L4230-4234)

```js
record: {
  ace: 'この団体で一番やれてる自信はあります。それは数字にも出てるはずです。',
  good: '自分なりに結果は出してきたつもりです。',
  developing: 'まだ発展途上なのはわかってます。でも、ちゃんと見てほしいんです。',
  few_matches: 'あんまり試合に出してもらえなかった……。'
},
```

wins/losses を直接セリフに含めない。選手は「結果」を抽象的に語り、具体的な勝敗数には言及しない。

#### 変更3: {wins} {losses} プレースホルダーの残存処理 (engine.js L13128-13130)

```js
// 変更前
text = text.replace(/\{wins\}/g, String(context.wins || 0));
text = text.replace(/\{losses\}/g, String(context.losses || 0));
```

セリフテンプレートから `{wins}` `{losses}` を使うテンプレートが他にも残っている可能性があるため、差し込み処理自体は残す。ただし record テンプレートからは除去済みなので、record以外の箇所（transfer_farewell等）で使われている場合のみ有効。

#### 変更4: extractContext の返り値からwinRate関連を整理

`extractContext` の返り値に `ovr`, `popularity`, `isChampion`, `hasTitleHistory` を追加:
```js
return {
  careerSeasons: seasons, tenureSeasons, wins, losses, total,
  isFounder, fewMatches, record, rivalName,
  ovr: Engine.util.ov(fighter),
  popularity: fighter.popularity || 0,
  isChampion: state.titles?.world?.championId === fighter.id,
  hasTitleHistory: (fighter.careerRecord?.totalTitleWins || 0) > 0,
};
```

将来的にセリフテンプレートでこれらの値を使えるようにする拡張ポイント。

## 影響範囲

- **engine.js**: `Engine.contract.extractContext()` (L12931-12960) の record 算出ロジック
- **engine.js**: `Engine.contract._insertRecord()` (L13155-13161) のテンプレートキー
- **data.js**: `CONTRACT_NEGOTIATION_LINES.record` (L4230-4234) のテンプレート文言
- **engine.js**: 交渉の発火確率・態度決定ロジック (L13007-13100) は変更不要（recordは使われていない）

他システムへの影響:
- 引退判定の `calcRecentWinRate()` は別関数で独立。影響なし
- AI移籍入札の `_bidWinRate` は別関数で独立。影響なし

## 検証方法

1. **auto-sim**: engine.js変更のため自動フック実行
2. **手動確認ポイント** (ユーザー委任):
   - オフシーズンの契約交渉で、セリフに勝率・勝敗数が含まれないこと
   - エース格の選手が「結果を出している」系のセリフを言うこと
   - 発展途上の選手が「まだこれから」系のセリフを言うこと
   - 出場が少ない選手が「試合に出してもらえなかった」と言うこと
   - 交渉の発火・態度・結果が不自然でないこと
3. **大規模テスト**: 100シーズンで交渉セリフの出力を確認（必要ならデバッグログ）

## 完了条件

- 交渉ダイアログ・ロジックから勝率(winRate)参照が除去されること
- record 判定がOVR・人気・タイトル歴ベースに切り替わること
- セリフテンプレートに `{wins}勝{losses}敗` が含まれないこと（record部分）
- 代替材料で自然な交渉セリフが成立すること
- auto-sim 100シーズンで違反なし
