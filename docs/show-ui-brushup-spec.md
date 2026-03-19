# 興行画面ブラッシュアップ 実装指示書

## 概要

通常興行・対抗戦の「試合進行ポップアップ」「試合結果画面」をPPV基準で洗練させる。
加えて、PPV・通常興行の結果画面のHPバーを中央対比表示に統一する。

参照モックアップは `archive/prototype/` に配置済み。

---

## 1. HP対比バー共通化（PPV + 通常興行）

### 概要
PPV結果画面・通常興行結果画面のHPバーを「左右にただ並べるだけ」から「中央基準の左右対称表示（UI共通ルール①）」に変更する。

### A. CSSクラス追加（index.html）

`.ppvprog-sa button:hover` の後に以下を追加：

```css
/* HP comparison bar — center-out symmetric (UI共通ルール①) */
.hp-cmp{display:flex;align-items:center;gap:0;height:22px;margin-top:8px}
.hp-cmp-half{flex:1;display:flex;align-items:center;gap:5px}
.hp-cmp-half.left{flex-direction:row-reverse}
.hp-cmp-center{font-size:10px;color:#555;width:30px;text-align:center;flex-shrink:0;letter-spacing:1px}
.hp-cmp-name{font-size:10px;color:rgba(255,255,255,0.4);white-space:nowrap}
.hp-cmp-val{font-size:10px;color:rgba(255,255,255,0.3);white-space:nowrap;min-width:40px}
.hp-cmp-half.left .hp-cmp-val{text-align:left}
.hp-cmp-half.right .hp-cmp-val{text-align:right}
.hp-cmp-track{flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;max-width:160px;overflow:hidden}
.hp-cmp-half.left .hp-cmp-track{direction:rtl}
.hp-cmp-fill{height:100%;border-radius:3px}
```

### B. ヘルパー関数追加（ui-common.js）

`_ppvBubble` 関数の直前に追加：

```js
/** HP対比バー — 中央基準の左右対称表示（UI共通ルール①） */
function _hpComparisonBar(leftName, leftHP, rightName, rightHP) {
  const lPct = leftHP.max > 0 ? Math.round(leftHP.final / leftHP.max * 100) : 0;
  const rPct = rightHP.max > 0 ? Math.round(rightHP.final / rightHP.max * 100) : 0;
  const lColor = lPct > 30 ? '#2ecc71' : lPct > 10 ? '#f39c12' : '#e74c3c';
  const rColor = rPct > 30 ? '#2ecc71' : rPct > 10 ? '#f39c12' : '#e74c3c';
  return `<div class="hp-cmp">
    <div class="hp-cmp-half left">
      <div class="hp-cmp-track"><div class="hp-cmp-fill" style="width:${lPct}%;background:${lColor}"></div></div>
      <span class="hp-cmp-val">${leftHP.final}/${leftHP.max}</span>
      <span class="hp-cmp-name">${leftName}</span>
    </div>
    <div class="hp-cmp-center">HP</div>
    <div class="hp-cmp-half right">
      <div class="hp-cmp-track"><div class="hp-cmp-fill" style="width:${rPct}%;background:${rColor}"></div></div>
      <span class="hp-cmp-val">${rightHP.final}/${rightHP.max}</span>
      <span class="hp-cmp-name">${rightName}</span>
    </div>
  </div>`;
}
```

### C. 差し替え箇所（2箇所）

**C-1. `renderShowResult`（ui-common.js 〜L3081）**

旧コード（`// HP bars` のブロック全体）を以下に置換：
```js
html += _hpComparisonBar(r.left.name, r.hpLeft, r.right.name, r.hpRight);
```

**C-2. `renderPPVResult`（ui-common.js 〜L3684）**

同じく旧HPバーブロック全体を以下に置換：
```js
html += _hpComparisonBar(r.left.name, r.hpLeft, r.right.name, r.hpRight);
```

### 対象外
- 対抗戦結果画面（`renderWarFinalResult`）にはHP表示がないのでスキップ

---

## 2. 対抗戦 試合進行ポップアップ（renderWarMatchPreview）

### 参照モックアップ
`archive/prototype/mockup_war_final.html`
（2パターンあり: vs 皇武館 赤 / vs ノヴァインパクト 紫）

### 変更点

**現状:** 56pxポートレート + テキスト名前 + vs のフラットな行表示。全試合同じ見た目。

**変更後の構造:**

#### 2-1. ヘッダー
- リング背景画像（`battle-bg_venue_4.webp`）を暗く敷く
- 左右陣営カラー分割オーバーレイ（左=`#3498db`プレイヤー色、右=`orgCfg.color`敵団体色）
- ビネット（周辺減光）
- タイトル:「⚔ Interpromotional War」小ラベル +「対抗戦」大文字
- スコアボード: 左右団体名 + 中央に大きな円形スコア（72pxフォント）+ 勝敗状態

#### 2-2. 試合表示（3段階）
表示順は下が第1試合→上がメイン方向（通常興行・PPVと同じ）。

**完了試合 → PPV `ppvprog-md` 形式（コンパクト1行、中央寄せ）**
- 試合番号 + 勝者名 def. 敗者名 + 決まり手 + MQ

**現在の試合 → PPV `ppvprog-mc` 形式の大カード**
- カード枠: `border-image: linear-gradient(90deg, プレイヤー色, #444, 敵色)` の左右分割
- カード背景: 左下からプレイヤー色、右下から敵色が薄く滲む
- 煽りテキスト（hype）
- 白吹き出しセリフ（UI共通ルール② `#f0f0f0` 背景、黒文字、中央寄せ）
- **スタンド画像**（`image/stand/stand_*.webp`）を向かい合わせ配置
  - **左側を `scaleX(-1)` で反転**、右側はそのまま（スタンド画像はデフォルト左向き）
  - コンテナ: 140×260px, `object-fit:contain; object-position:bottom center`
- 名前 + 団体名 + OVR（PPV `ppvprog-fi/fn/fo/fov` と同じ構造）
- ステータス対比バー 5本（PW/SP/TE/ST/MN、各色付き、UI共通ルール①）
- トレイト表示
- 「試合を観る」ボタン（縦配置、大きめ）+「≫ スキップ」テキストリンク

**未到達試合 → PPV `ppvprog-mw` 形式（霧表示、opacity下げ）**

#### 2-3. 全試合スキップ
控えめなボーダーボタン（PPVと同じ）

#### 2-4. カラーテーマ
固定色ではなく、`orgCfg.color`（RIVAL_ORGSの各団体color）を動的に適用:
- ヘッダー右側オーバーレイ
- スコアボード右側団体名・スコア数字
- 現在試合カードの枠線右半分・背景右側グラデ
- 敵選手名・団体名・OVR
- 「試合を観る」ボタンの枠線色
- プレイヤー側は常に `#3498db` 固定

---

## 3. 対抗戦 結果画面（renderWarFinalResult）

### 参照モックアップ
`archive/prototype/mockup_war_result_v2.html`

### 変更点

**現状:** 「⚔ 対抗戦結果」テキストタイトル + 各試合行（ポートレート36px + テキスト）+ スコア + 敵エース72pxポートレート + 吹き出し

**変更後:**

#### 3-1. ヘッダー
試合進行と同じ: リング背景 + 陣営分割 + スコアボード（円形、大きなスコア数字）
- 勝ち越し時: 金色glow + パルスアニメーション「🏆 勝ち越し！」
- 負け越し時: 赤色「負け越し…」

#### 3-2. フレーバーテキスト
ヘッダー直下に大きめ表示（例:「Sランク王者・皇武館に勝利！団体の格が上がった！」）

#### 3-3. 各試合結果行（中央寄せ・対称）
- 「第N試合」ラベルはカード上部中央
- 左右にポートレート（face画像 72px、角丸7px）+ 名前を中央対称配置
- 勝者: 金ボーダー + 金色名前
- 敗者: 薄ボーダー + dim名前 + **グレースケール**（対抗戦は特別試合なのでグレーあり）
- 勝敗ラベル（WIN/LOSE）+ MQ + 決まり手を中央に

#### 3-4. 報酬表示
人気変動 / 対戦pt変動 / Heat変動を1行で

#### 3-5. 敵エースの試合後セリフ
- 左にupper画像（160×250px）、右に白吹き出し（左向き三角）の横並びレイアウト
- プレイヤー勝利時: エース画像を `brightness(0.7) saturate(0.8)` で敗北感
- セリフは既存の `getWarPostDialogue` をそのまま使用

#### 3-6. 閉じるボタン
金グラデーション

---

## 4. 通常興行 試合進行ポップアップ（renderMatchPreview）

### 参照モックアップ
`archive/prototype/mockup_show_match_v3.html`

### 変更点

**現状:** 各試合カードにupper画像 + 名前+OVR + VS + 関係性 + 観る/スキップ

**変更後:**

#### 4-1. ヘッダー分離
- 背景色付き（`linear-gradient(180deg, rgba(20,20,40,1), rgba(16,16,32,0.95))`）
- `border-bottom: 2px solid #1a1a30` でコンテンツと明確に分離
- 「Weekly Show」小ラベル +「第N回 定期興行」大タイトル +「全N試合 ─ M/N 完了」進行表示

#### 4-2. 各試合カード
5カラム構造: **左パラメータ — 左キャラ — VS — 右キャラ — 右パラメータ**

- パラメータ列: PW/SP/TE/ST/MN の5段、各色バー付き
  - 左側: バーが右→左に伸びる（`direction:rtl`）、値は内側
  - 右側: バーが左→右に伸びる、値は内側
  - 高い方の値に `color: var(--gold)` を付与
  - メイン: カラム幅130px、バー高8px / 前座: カラム幅110px、バー高6px
- キャラ表示: upper画像 + 名前 + OVR（現状と同じ）
- メイン/前座のサイズ差: メインは画像120×150、前座は100×125

#### 4-3. 完了/次戦/待機の表現
- 完了: バッジ「完了」（緑）、opacity下げなし
- 次戦: バッジ「次戦」（青）、青ボーダー
- 待機: バッジ「待機」（グレー）、opacity下げ

#### 4-4. ボタン統一（対抗戦と同じ）
- 「🎬 試合を観る」— 大きめ縦配置、`border:2px solid var(--blue)`、幅300px
- 「≫ スキップ」— その下にテキストリンク風
- 「残り全試合をスキップ（N試合）」— 控えめボーダーボタン

#### 4-5. カード角丸
`border-radius: 10px`（対抗戦と統一）

---

## 5. 通常興行 結果画面（renderShowResult）

### 参照モックアップ
`archive/prototype/mockup_show_result_v2.html`

### 変更点

**現状:** タイトル + 各試合（大きいupper画像で勝者/敗者） + 観客動員 + MQ + HPバー

**変更後:**

#### 5-1. ヘッダー分離（試合進行と同じ）
背景色 + 分離線 +「Weekly Show」+「第N回 定期興行」

#### 5-2. サマリーバー
平均MQ（星表示）+ Heat情報を1行で

#### 5-3. 観客動員バナー
会場名 + 大きな動員数 + キャパ + 占有率バー + ラベル（超満員など）
※現行の `renderShowResult` にある観客動員表示と同等

#### 5-4. 各試合結果カード

**ラベル行:**
- 試合番号は独立して1行目（Bebas Neue、大きめ）
- タグ類（タイトルマッチ、因縁等）は改行して2行目

**キャラ表示:**
- face画像（`face_*.png`）、角丸7px（PPVと同じ）、丸ではない
- 勝者: 大きめ（メイン140px / 前座110px）、金ボーダー
- 敗者: 小さめ（メイン100px / 前座80px）、薄ボーダー、**グレースケールなし**（通常興行は日常なので）

**セリフ統合（因縁30以上のペアのみ）:**
- PPVの `_ppvBubble` と同じ構造の白吹き出しをキャラ画像の上に配置
- 勝者名 = 金色（🏆付き）、敗者名 = オレンジ
- セリフがない試合でも `.bubble-slot`（`min-height:60px`）を配置して画像位置を揃える
- **別ポップアップにはしない** — この結果画面内で直接表示

**VS:** 試合後なので `color:rgba(255,255,255,0.12)` の控えめグレー

**勝利バッジ + 決まり手 + MQ:**
中央寄せ1行ずつ

**HPバー:**
セクション1で実装する `_hpComparisonBar` を使用

#### 5-5. Heat情報 + 閉じるボタン
現行と同じ

---

## UI共通ルール（再確認）

- **UI共通ルール①:** 能力値の対比表示は必ず左右対称レイアウト（中央にラベル、左右にバーが伸びる形）
- **UI共通ルール②:** 選手のセリフ表示は白い吹き出し（`#f0f0f0` 背景）+ 黒文字。吹き出し内テキストは中央寄せ、話者名は上部に小さく色付き表示
- スクロールバーは非表示（`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`）
- ポップアップの `border-radius: 12px`、カードの `border-radius: 10px` で統一

---

## 配置ファイル

モックアップは全て `archive/prototype/` に配置済み:

| ファイル | 内容 |
|---|---|
| `mockup_war_final.html` | 対抗戦 試合進行（2パターン: 赤/紫） |
| `mockup_war_result_v2.html` | 対抗戦 結果画面 |
| `mockup_show_match_v3.html` | 通常興行 試合進行 |
| `mockup_show_result_v2.html` | 通常興行 結果画面 |

## 実装順序の推奨

1. HP対比バー共通化（CSSクラス + ヘルパー関数 + 2箇所差し替え）— 最小限の変更で効果大
2. 対抗戦 試合進行（renderWarMatchPreview）— 最も変更が大きい
3. 対抗戦 結果画面（renderWarFinalResult）
4. 通常興行 試合進行（renderMatchPreview）
5. 通常興行 結果画面（renderShowResult）
