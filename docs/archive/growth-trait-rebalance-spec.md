# 成長トレイト再調整 実装指示

## 変更対象
`src/data.js` の `ageMultiplier()` 関数（2855行目付近）

## 現行コード（削除対象）
```javascript
// 早熟: ≤18で+30%、≥23で-30%
if (traits.includes('早熟')) {
  if (age <= 18) mul *= 1.3;
  else if (age >= 23) mul *= 0.7;
}
// 晩成: ≤18で-20%、21-27で+40%
if (traits.includes('晩成')) {
  if (age <= 18) mul *= 0.8;
  else if (age >= 21 && age <= 27) mul *= 1.4;
}
// 遅咲き: ≤20で-20%、21-29で爆発的成長
if (traits.includes('遅咲き')) {
  if (age <= 20) mul *= 0.8;
  else if (age <= 29) mul = Math.max(mul, 0.9);
}
```

## 新コード（差し替え）

3つのトレイトは**ベースageMultiplierに掛け算する方式をやめて、専用テーブルで直接上書きする方式**に変更する。
理由: 掛け算方式だとベースが0の年齢帯で成長を与えられない（遅咲きが`Math.max`で無理矢理やっていた問題の根本原因）。

```javascript
// 成長トレイト: 専用テーブル上書き方式（growth-trait-rebalance v1.0）
// 個性なしベース: ≤17:0.70 / 18:1.00 / 19-20:1.15 / 21-22:1.00 / 23-24:0.50 / 25-26:0.10 / 27+:0
if (traits.includes('早熟')) {
  // ピーク17-19歳、20歳から鈍化、23歳で完全停止。累計5.95（通常比-17%）
  if      (age <= 17) mul = 1.00;
  else if (age <= 18) mul = 1.30;
  else if (age <= 19) mul = 1.15;
  else if (age <= 20) mul = 0.80;
  else if (age <= 21) mul = 0.50;
  else if (age <= 22) mul = 0.20;
  else                mul = 0;
} else if (traits.includes('晩成')) {
  // ピーク21-22歳、序盤は鈍い、23歳でまだ伸びる。累計7.40（通常比+3%）
  if      (age <= 17) mul = 0.50;
  else if (age <= 18) mul = 0.70;
  else if (age <= 19) mul = 0.90;
  else if (age <= 20) mul = 1.00;
  else if (age <= 22) mul = 1.15;
  else if (age <= 23) mul = 0.70;
  else if (age <= 24) mul = 0.30;
  else                mul = 0;
} else if (traits.includes('遅咲き')) {
  // ピーク22-23歳、序盤は非常に鈍い、23歳で突然覚醒。累計7.25（通常比+1%）
  if      (age <= 17) mul = 0.40;
  else if (age <= 18) mul = 0.50;
  else if (age <= 19) mul = 0.60;
  else if (age <= 20) mul = 0.70;
  else if (age <= 21) mul = 0.80;
  else if (age <= 22) mul = 1.00;
  else if (age <= 23) mul = 1.15;
  else if (age <= 24) mul = 0.80;
  else if (age <= 25) mul = 0.30;
  else                mul = 0;
}
```

**重要**: `else if` チェーンにすること（排他Aなので1つしか持てないが、安全のため）。

## TRAIT_DEFS説明文の更新（同ファイル 209行目付近）

```javascript
'早熟':  {cat:'growth', icon:'早', color:'#27ae60', en:'Early Bloomer',  desc:'10代から即戦力。20歳で完成するが、伸びしろは少ない', excl:'A'},
'晩成':  {cat:'growth', icon:'晩', color:'#16a085', en:'Late Bloomer',   desc:'序盤は遅いが、21〜22歳でピークに成長する', excl:'A'},
'遅咲き':{cat:'growth', icon:'遅', color:'#1abc9c', en:'Late Starter',   desc:'序盤は全く伸びないが、23歳で突然覚醒する', excl:'A'},
```

## 検証
- auto-sim 10seeds × 10seasons で ALL CLEAR を確認
- 特に遅咲き持ちの選手が27歳以降に成長していないことを確認
- 早熟持ちの選手が23歳以降に成長ゼロであることを確認

## 変更しないもの
- ベースのageMultiplier（個性なしの値）は変更しない
- SCOUT_TRAITS_POOL（早熟・晩成・遅咲きは元々含まれている）
- スカウト生成時の排他チェック（既存のまま）
