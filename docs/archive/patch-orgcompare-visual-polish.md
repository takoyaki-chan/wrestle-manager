# 団体比較 セピア新聞UI 見た目パッチ

## 概要

団体比較のセピア新聞風リデザインは実装済み。
本パッチは「全体がおとなしすぎる」問題への対処。
スポーツ新聞の実紙面と同様、**紙面はセピアでも写真まわり・見出し・見せ場はドギツいくらい派手にする**方針。

変更対象: `src/index.html`（CSS）, `src/ui-render.js`（HTML構造の一部変更）

---

## 方針: セピアの中に「ダーク＋発光」の見せ場を作る

セピアのおとなしい紙面はそのまま維持。
以下の「見せ場」だけトーンを変えて派手にする:

1. **エース対決アリーナ** — 背景をダーク化、VS発光、照明演出
2. **相性グレードボックス** — 赤ベタ塗り白文字
3. **No.2・No.3のアバターアイコン** — ダーク背景＋グロウ影
4. **注目選手のアバターアイコン** — 同上
5. **バッジ類（急務/検討、要警戒/スター候補）** — ベタ塗り白文字

---

## 1. エース対決アリーナの派手化

### 現状
セピア背景の中にスタンド画像が置かれているだけ。紙面と同化して地味。

### 修正
エース対決（index === 0）のアリーナ部分のみ、**ダーク背景＋赤照明＋VS発光**にする。

```css
/* エース対決アリーナ — ダーク＋照明演出 */
.db-cmp-match-featured .db-cmp-ace-arena {
  background: linear-gradient(180deg, #2a1008 0%, #1a0a00 60%, #0a0400 100%);
}
/* 赤いラジアル照明 */
.db-cmp-match-featured .db-cmp-ace-arena::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at 50% 80%, rgba(200,40,40,0.15) 0%, transparent 60%);
  z-index: 1;
}
/* 下部の赤金ライン */
.db-cmp-match-featured .db-cmp-ace-arena::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, #d4a843, #c22020, #d4a843);
  z-index: 2;
}
```

### VS文字の発光
```css
.db-cmp-ace-vs {
  font-size: 48px;
  font-weight: 900;
  color: #c22020;
  letter-spacing: 4px;
  text-shadow:
    0 0 30px rgba(200,40,40,0.6),
    0 0 60px rgba(200,40,40,0.3),
    2px 2px 0 rgba(0,0,0,0.5);
}
```
※VSの下の「OVR差/人気差」テキストも白系に変更（ダーク背景上なので）:
```css
.db-cmp-ace-metrics {
  color: rgba(255,255,255,0.6);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
```

### 名前バーのグラデーション
エース対決の名前バー（アリーナ直下）にグラデーション背景:
```css
.db-cmp-ace-namebar {
  background: linear-gradient(90deg,
    rgba(154,112,32,0.15),
    rgba(139,26,26,0.1),
    rgba(90,40,128,0.12));
}
```

---

## 2. 相性グレードボックスの派手化

### 現状
セピア背景上のテキストで地味。

### 修正
赤ベタ塗りボックスに白文字。一目で目を引くようにする。

```css
.db-cmp-headline-grade {
  background: #8b1a1a;
  border-radius: 8px;
  padding: 12px 18px;
  text-align: center;
}
.db-cmp-headline-grade .grade-label {
  color: rgba(255,255,255,0.7);
}
.db-cmp-headline-grade .grade-value {
  font-size: 42px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.db-cmp-headline-grade .grade-desc {
  color: rgba(255,255,255,0.8);
}
```

---

## 3. No.2・No.3アバターアイコンの派手化

### 現状
セピア背景に馴染むフラットな丸アイコン。存在感が薄い。

### 修正
ダーク背景＋アクセントカラーのボーダー＋グロウ影で浮き立たせる。

```css
/* プレイヤー側アバター */
.db-cmp-match-avatar.player {
  background: linear-gradient(135deg, #5a4020, #3a2810);
  border: 2px solid #9a7020;
  box-shadow: 0 0 8px rgba(154,112,32,0.3);
}
/* ライバル側アバター */
.db-cmp-match-avatar.rival {
  background: linear-gradient(135deg, #3a2050, #2a1440);
  border: 2px solid #6a3890;
  box-shadow: 0 0 8px rgba(106,56,144,0.3);
}
```

---

## 4. 注目選手アバターの派手化

### 現状
薄い背景の丸アイコン。

### 修正
No.2・No.3と同様のダーク＋グロウ。さらにサイズを少し大きく（52px）。

```css
.db-cmp-spotlight-face {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #3a2050, #2a1440);
  border: 2px solid #6a3890;
  box-shadow: 0 0 10px rgba(106,56,144,0.25);
}
```

---

## 5. バッジ・タグ類のベタ塗り化

### 現状
半透明背景＋色テキスト。セピア上で目立たない。

### 修正
ベタ塗り背景＋白文字に統一。

```css
/* 要警戒タグ */
.db-cmp-spotlight-tag.growth,
.db-cmp-spotlight-tag.youngThreat {
  background: #8b1a1a;
  color: #fff;
}
/* スター候補タグ */
.db-cmp-spotlight-tag.star {
  background: #9a7020;
  color: #fff;
}
/* 補強ポイント — 急務 */
.db-cmp-badge.urgent {
  background: #8b1a1a;
  color: #fff;
}
/* 補強ポイント — 検討 */
.db-cmp-badge.ok {
  background: #1a7a50;
  color: #fff;
}
/* エース対決チップ、No.2/No.3対決チップ */
.db-cmp-role-chip {
  background: #8b1a1a;
  color: #fff;
  font-weight: 900;
  letter-spacing: 1px;
}
```

---

## 6. 対戦成績の通算数字

大きく太く赤色にして見せ場にする:
```css
.db-cmp-war-wl {
  font-size: 28px;
  font-weight: 900;
  color: #8b1a1a;
}
```

---

## 注意事項

- セピア紙面の基本カラー（背景、本文色、セクションタイトル等）は変更しない
- 変更するのは「見せ場」部分のみ: 画像まわり、グレード、バッジ、アバター
- クラス名は既存実装に合わせること（上記のクラス名はモックアップ基準なので、実際のクラス名に読み替えて適用）
- 100シーズンauto-sim（10 seeds × 10 seasons）でエラーなし確認
