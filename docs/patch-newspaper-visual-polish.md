# 新聞タブ 見た目パッチ

## 概要

新聞タブのデザインを団体比較タブと統一する。
変更対象: `src/ui-render.js`（`_renderDbNewspaper()` 周辺）+ `src/index.html`（CSS）

---

## 1. 赤帯ヘッダー

### 現状
```html
<div style="font-size:18px;font-weight:1000;letter-spacing:0.06em;color:#4a3518;">WEEKLY GRAPPLE</div>
```
セピア背景に茶色の英語テキスト。地味。

### 修正
団体比較と同じ赤帯ヘッダーに置換。

```html
<div style="background:linear-gradient(90deg,#8b1a1a,#c22020);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;">
  <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:2px;">週刊グラップル</div>
  <div style="font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;">S${wp.season || '?'} W${wp.week || '?'}</div>
</div>
```

既存の `border-bottom:3px double` のサブヘッダー部分は削除（赤帯で十分区切れるため）。

---

## 2. セクションラベル日本語化

### 変更一覧

| 旧（英語） | 新（日本語） | 縦線色 |
|-----------|-------------|--------|
| `TOP STORY` | `一面記事` | 赤 `#8b1a1a` |
| ※興行結果セクション（現在ラベルなし or 英語） | `興行結果` | 赤 |
| `OTHER NEWS` | `他団体ニュース` | 金 `#9a7020` |
| ※次回展望セクション | `次回展望` | 金 |

### セクションラベルのスタイル
```css
/* 赤ラベル（自団体関連） */
.news-sec-label {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: #8b1a1a;
  font-weight: 900;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid #8b1a1a;
}
/* 金ラベル（他団体・中立） */
.news-sec-label-gold {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: #6a4a10;
  font-weight: 900;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid #9a7020;
}
```

既存の `text-transform:uppercase` の英語ラベル表示をすべてこのクラスに置換。

---

## 3. 画像アイコンの派手化

団体比較パッチと同様、画像アイコンまわりをダーク＋グロウに。

### 一面記事のキャラアイコン
```css
/* 一面記事の選手ポートレート */
.newspaper-box img[style*="64px"] {
  /* インラインスタイルで上書きするか、専用クラスを付与 */
}
```

実装方針: 一面記事のキャラ画像を描画している箇所で、`border` と `box-shadow` を追加。

```
border: 2px solid rgba(154,112,32,0.4);
box-shadow: 0 0 8px rgba(154,112,32,0.2);
```

フォールバック（画像なし時の姓1文字表示）の場合:
```
background: linear-gradient(135deg, #5a4020, #3a2810);
color: #d4a843;
border: 2px solid rgba(154,112,32,0.4);
box-shadow: 0 0 8px rgba(154,112,32, 0.2);
```

### 他団体ニュースのアイコン
他団体ニュースの選手アイコンはライバル色:
```
background: linear-gradient(135deg, #3a2050, #2a1440);
color: #b088d0;
border: 2px solid rgba(106,56,144,0.3);
box-shadow: 0 0 6px rgba(106,56,144,0.15);
```

---

## 4. ダイジェストのテーブル形式化（コンパクト化）

### 現状
各試合がカード風のブロックで、ヘッダー→フェイスオフ→統計→コメントが縦に並ぶ。
余白が多くスカスカ。

### 修正
テーブル形式にして1試合を基本1行（＋コメント行）に圧縮。

### HTML構造

```html
<table class="news-digest-table">
  <!-- 1試合 = 2行（対戦行 + コメント行） -->
  <tr>
    <td class="ndt-num">3</td>
    <td class="ndt-badge"><span class="ndt-badge-tag title">王座戦</span></td>
    <td class="ndt-card">
      <div class="ndt-ff">
        <div class="ndt-port w">鳶</div>
        <span class="ndt-name w">鳶岡加奈子</span>
        <span class="ndt-vs">vs</span>
        <span class="ndt-name">宇田川里奈</span>
        <div class="ndt-port l">宇</div>
      </div>
    </td>
    <td class="ndt-mq high">MQ82</td>
  </tr>
  <tr>
    <td colspan="2"></td>
    <td colspan="2" class="ndt-comment">「王者の貫禄。最後は格の差が出た」</td>
  </tr>
</table>
```

### CSS

```css
.news-digest-table {
  width: 100%;
  border-collapse: collapse;
}
.news-digest-table tr {
  border-bottom: 1px solid rgba(95,69,35,0.1);
}
.news-digest-table tr:last-child {
  border-bottom: none;
}
.news-digest-table td {
  padding: 8px 0;
  vertical-align: middle;
}

/* 試合番号 */
.ndt-num {
  font-size: 10px;
  font-weight: 900;
  color: #7a5b32;
  width: 24px;
  text-align: center;
}

/* バッジセル */
.ndt-badge {
  width: 50px;
}
.ndt-badge-tag {
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.5px;
  display: inline-block;
}
.ndt-badge-tag.title { background: #b8892a; color: #fff; }
.ndt-badge-tag.upset { background: #8b1a1a; color: #fff; }

/* 対戦カード1行 */
.ndt-ff {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ndt-vs {
  font-size: 10px;
  color: rgba(80,50,20,0.35);
  font-weight: 700;
  padding: 0 2px;
  flex-shrink: 0;
}

/* ポートレート */
.ndt-port {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  flex-shrink: 0;
  overflow: hidden;
}
.ndt-port.w {
  background: linear-gradient(135deg, #5a4020, #3a2810);
  color: #d4a843;
  border: 1.5px solid rgba(154,112,32,0.4);
  box-shadow: 0 0 4px rgba(154,112,32,0.15);
}
.ndt-port.l {
  background: rgba(80,50,20,0.08);
  color: rgba(80,50,20,0.4);
  border: 1px solid rgba(80,50,20,0.1);
}
/* ポートレートがimg要素の場合 */
.ndt-port img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 選手名 */
.ndt-name {
  font-size: 12px;
  color: #5b4b34;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ndt-name.w {
  font-weight: 900;
  color: #1a0a00;
}

/* MQ */
.ndt-mq {
  font-size: 11px;
  font-weight: 900;
  width: 44px;
  text-align: center;
}
.ndt-mq.high { color: #1a7a50; }
.ndt-mq.mid  { color: #6a4a10; }
.ndt-mq.low  { color: #8b1a1a; }

/* MQランク判定基準: high >= 75, mid >= 55, low < 55 */

/* コメント行 */
.ndt-comment {
  font-size: 11px;
  color: #5b4b34;
  line-height: 1.5;
  padding: 2px 0 4px 28px;
  font-style: italic;
}
```

### JS修正箇所

`_renderNewspaperDigest()` 関数を書き換え。

現在の構造:
```
forEach match → <div class="news-digest-match"> ヘッダー + フェイスオフ + stats + comment </div>
```

新しい構造:
```
<table class="news-digest-table">
  forEach match → <tr>対戦行</tr><tr>コメント行</tr>
</table>
```

対戦行の中身:
- td: 試合番号
- td: バッジ（タイトルマッチ/番狂わせ/なし）
- td: 勝者アイコン＋名前 vs 名前＋敗者アイコン（1行）
- td: MQ値（色分け: high/mid/low）

コメント行:
- td colspan=2: 空
- td colspan=2: 黒田コメント（italic）

勝者判定: 既存の `m.winnerId` または `m.leftWon` フラグで判定。
勝者側のアイコンは `.w`（ダーク＋金グロウ）、敗者は `.l`（グレーアウト）。

ポートレートが画像の場合: `<img>` を `.ndt-port` 内に入れる。勝者は `.w` の枠＋グロウ付き、敗者は `.l` のグレー枠。

---

## 5. ダイジェストの勝敗視覚差の強化

### 現状
勝者は `.winner` クラスで名前が太字になるだけ。ポートレートは勝者も敗者も同じ見た目。
スクショで見ても一目でどちらが勝ったかわからない。

### 修正方針
- **勝者**: ポートレートにダーク金背景＋金枠＋金グロウ、名前を太字＋濃い色＋大きめ
- **敗者**: ポートレートをグレーアウト（薄い背景＋薄い枠）、名前を薄い色＋小さめ
- 中央の「def.」テキストを廃止し、勝者名の直後に小さく「WIN」マーカーを付ける

### ポートレートCSS

テーブル形式化する場合の `.ndt-port` は修正3で定義済み（`.w` と `.l`）。

レガシー形式（テーブル化前/フォールバック用）の場合も同様に:

```css
/* 勝者ポートレート（写真あり） */
.news-digest-fighter.winner .news-digest-portrait {
  border: 2px solid rgba(154,112,32,0.5);
  box-shadow: 0 0 6px rgba(154,112,32,0.25);
}
/* 勝者ポートレート（フォールバック文字） */
.news-digest-fighter.winner .news-digest-portrait-fb {
  background: linear-gradient(135deg, #5a4020, #3a2810);
  color: #d4a843;
  border: 2px solid rgba(154,112,32,0.4);
  box-shadow: 0 0 6px rgba(154,112,32,0.2);
}

/* 敗者ポートレート（写真あり） */
.news-digest-fighter:not(.winner) .news-digest-portrait {
  border: 1px solid rgba(80,50,20,0.1);
  opacity: 0.6;
  filter: grayscale(40%);
}
/* 敗者ポートレート（フォールバック文字） */
.news-digest-fighter:not(.winner) .news-digest-portrait-fb {
  background: rgba(80,50,20,0.08);
  color: rgba(80,50,20,0.35);
  border: 1px solid rgba(80,50,20,0.1);
}

/* 敗者名前を薄く */
.news-digest-fighter:not(.winner) span {
  color: rgba(80,50,20,0.4);
  font-size: 12px;
}
```

### 中央の結果表示

現状の `def.` テキストは意味がわかりにくい。以下に変更:

```javascript
// 現状
<div class="news-digest-result">${m.isDraw ? 'DRAW' : 'def.'}</div>

// 修正
<div class="news-digest-result">${m.isDraw ? '引分' : 'WIN'}</div>
```

WINは赤太字で目立たせる:
```css
.news-digest-result {
  font-size: 11px;
  font-weight: 900;
  color: #8b1a1a;
  min-width: 30px;
  text-align: center;
}
```

### テーブル形式化時も同様

テーブル形式に変更する場合も、`.ndt-port.w`（勝者）と `.ndt-port.l`（敗者）で
同じダーク金 vs グレーアウトの差を維持する。修正4のCSSで対応済み。

加えて、テーブル形式でも勝者名の横に小さく勝利マーカーを付ける:
```javascript
// 勝者名の後ろに ◎ または 勝 を小さく付ける
`<span class="ndt-name w">${winnerName}</span><span style="font-size:9px;color:#8b1a1a;font-weight:900;margin-left:2px">勝</span>`
```

---

## 6. 星評価＋黒田コメントの微調整

星評価と黒田コメントは現状のレイアウトを維持。
変更は:
- 星を1行にまとめて右に「観客満足度 X.X」テキストを並べる
- 黒田コメントの顔アイコンにダーク背景＋赤ボーダー適用

---

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/ui-render.js` | `_renderDbNewspaper()` ヘッダー部分書き換え、`_renderNewspaperDigest()` テーブル形式化、セクションラベル日本語化 |
| `src/index.html` | 新聞タブ用CSS追加（`.news-sec-label`, `.ndt-*` クラス群）、既存 `.news-digest-*` は残して互換性維持 |

## 検証

- 100シーズンauto-sim（10 seeds × 10 seasons）でエラーなし確認
- 新聞が表示されること（興行後）
- ヘッダーが赤帯で「週刊グラップル」であること
- セクションラベルがすべて日本語であること
- ダイジェストがテーブル形式でコンパクトであること
- 勝者ポートレートがダーク金＋グロウ、敗者がグレーアウトであること
- 勝者名が太字＋濃い色、敗者名が薄い色であること
- 「def.」ではなく「WIN」（または「引分」）が表示されること
- 特集ページ（2面以降）が正常に表示されること
- 旧セーブデータ（`_renderDbNewspaperLegacy`）でもエラーが出ないこと
