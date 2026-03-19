# PPV結果画面リデザイン — 実装仕様書

## 概要
`renderPPVResult()` (ui-common.js L3530-3605) を全面改修し、通常興行 `renderShowResult()` と同等以上の情報量＋PPV固有の豪華演出にする。

## 参照モックアップ
`docs/ppv-result-mockup-v3.html`

---

## 変更対象
- `src/ui-common.js` の `renderPPVResult()` 関数のみ
- 新規CSS追加なし（既存inline styleパターンを踏襲）
- 新規JS関数追加なし（既存の `portraitImg()`, `fLink()`, `mqStars()`, `Engine.formatFinish()` 等をそのまま使用）

---

## ヘッダー部（既存をほぼ維持）
- PPV GRAND FINAL「{ppvName}」結果（ゴールドグラデ背景）
- 平均MQ＋星表示
- Heat変動表示（既存ロジックそのまま）
- 会場ピル（「🏆 特設リング｜観客 XX人」）← **新規追加**: PPVには観客動員の概念がないため、表示はオプション。会場情報がない場合は省略してよい

---

## 各試合カード — 全試合フル表示

### レイアウト構造（1試合あたり）
```
┌─ match-card ──────────────────────┐
│ ラベル行（第N試合 / 因縁 / 決着等）    │
│                                    │
│  [吹き出しW]        [吹き出しL]      │  ← コメントがある場合のみ
│     ▼                  ▼           │
│  [portrait勝者]  VS  [portrait敗者] │  ← portraitImg() 使用
│   勝者名               敗者名       │
│                                    │
│  🏆 {勝者名} 勝利                   │
│  決まり手 → フィニッシュ / Nターン    │
│  ★★★ MQ: XX  ボーナスタグ群        │
│  HP残量バー（左右）                  │
│  ▸ 試合ログを見る                   │
└───────────────────────────────────┘
```

### メインイベント vs アンダーカードの差
| 要素 | メインイベント | アンダーカード |
|---|---|---|
| カード外枠 | 金枠 `border:1.5px solid rgba(212,168,67,0.4)` + 金背景グラデ | 通常枠 `border:1px solid var(--border)` |
| ラベル | 「🏆 頂上決戦」金色 | 「第N試合」通常色 |
| 勝者portrait | 大 (180px高) + 金枠 + glow shadow | 中 (140px高) + 緑枠 |
| 敗者portrait | 中 (110px高) + opacity:0.65 | 小 (80px高) + opacity:0.65 |
| 勝者名 | 金色 `color:var(--gold)` | 通常色 |

**注意**: portraitサイズは `portraitImg(id, size)` の第2引数で制御。メイン勝者=180, メイン敗者=110, アンダー勝者=140, アンダー敗者=80。

### 因縁/決着等のラベルタグ
既存 `renderShowResult()` と同じロジックで表示:
- `isRivalry` → `🔥因縁` 赤
- `rivalryResolved` → `⚡決着！` 赤太字
- `freshnessBonus > 0` → `✨{label}` 青
- `freshnessBonus < 0` → `😐{label}` オレンジ
- `isTitleMatch` → `🏆 タイトルマッチ` 金
- `spotlightInMatch` → `📺 取材中` 青

### 勝利バッジ・決まり手・MQ行
`renderShowResult()` と完全に同じ形式:
- 勝利バッジ: `🏆 {名前} 勝利` ゴールドグラデ背景
- 決まり手: `Engine.formatFinish(r.finType, r.finMove) / {r.turns}ターン`
- MQ行: `mqStars(r.mq)` + `MQ: {r.mq}` + ボーナスタグ群（王座+5, 格差ペナ, 因縁ボーナス, コーチ, 鮮度）

### HPバー
`renderShowResult()` と同じ: 左右flex、パーセントバー、色分け（>30%緑、>10%黄、それ以下赤）

### 試合ログ
`renderShowResult()` と同じ: `<details>` 折りたたみ

---

## 吹き出し（コメント）— 新規追加要素

### 配置ルール
- 吹き出しは各キャラのportrait画像の **真上** に配置
- 吹き出し下部に三角矢印（CSS border trick）でポートレイトを指す
- 両者コメントの場合: 勝者側（左）と敗者側（右）にそれぞれ吹き出し
- 勝者のみコメントの場合: 勝者側（左）にだけ吹き出し
- コメントなしの場合: 吹き出しなし

### 吹き出しスタイル（UI共通ルール②準拠）
```
背景: #f0f0f0
文字色: #222（黒）
テキスト: 中央寄せ
border-radius: 8px
padding: 7px 10px
font-size: 11px (※カード内に収めるため通常の12pxより1px小さく)
line-height: 1.5
```
三角矢印:
```css
/* ::after疑似要素 */
border-left: 7px solid transparent;
border-right: 7px solid transparent;
border-top: 7px solid #f0f0f0;
/* 中央配置 */
left: 50%; transform: translateX(-50%);
```

### 話者名表示
- 吹き出しの上に小さく表示
- 勝者: `color:var(--gold)` + 「🏆 {名前}」
- 敗者: `color:#e17055` + 「{名前}」
- font-size: 9-10px, font-weight: 600

### コメント表示条件
既存の `renderShowResult()` 内の因縁リアクションロジック（L3096-3116）を拡張:

| 条件 | 勝者コメント | 敗者コメント | セリフプール |
|---|---|---|---|
| 因縁 rivalry≥40 | ○ | ○ | 既存: `RIVALRY_MATCH_REACTION` / `UPSET_RIVALRY_LINES` |
| 高MQ ≥65（※要調整） | ○ | × | **新規作成が必要**: 高MQ勝者コメントプール |
| PPVデビュー（初出場） | ○ | × | **新規作成が必要**: PPVデビューコメントプール |

**注意**: 高MQコメントとPPVデビューコメントのセリフプールは新規作成が必要。既存の `pickDialogueLine(pool, char)` でパーソナリティ×アーキタイプに対応させる。セリフ内容・プール定義はこの実装の範囲外（別途設計が必要）。まずは因縁リアクションのみ対応し、残りはTODOコメントで残す。

### HTML構造（吹き出し付きversus部分）
```html
<div style="display:flex;align-items:flex-end;justify-content:center;gap:12px;flex-wrap:wrap">
  <!-- 勝者列 -->
  <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;max-width:55%">
    <!-- 吹き出し（ある場合のみ） -->
    <div style="margin-bottom:8px;width:100%">
      <div style="font-size:9px;font-weight:600;color:var(--gold);text-align:center;margin-bottom:3px">🏆 {名前}</div>
      <div style="background:#f0f0f0;color:#222;padding:7px 10px;border-radius:8px;font-size:11px;text-align:center;line-height:1.5;position:relative">
        {セリフ}
        <!-- 三角矢印は::afterで。inline styleでは疑似要素使えないので、直接divで作る -->
        <div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid #f0f0f0"></div>
      </div>
    </div>
    <!-- ポートレイト -->
    {portraitImg(winnerId, size, 'portrait-match winner')}
    <div>{fLink(winner)}</div>
  </div>
  <!-- VS -->
  <div style="...padding-bottom:Npx">vs</div>
  <!-- 敗者列（同構造、吹き出しは条件付き） -->
</div>
```

**重要**: `::after`疑似要素はinline HTMLでは使えないため、三角矢印は実体divで作る。

---

## 報酬・対戦pt・Heat変動（下部）
既存ロジックそのまま維持。変更なし。

---

## 表示順序
既存と同じ: メインイベント（card配列の末尾）→ 前座の順（descending index）

---

## 実装手順
1. `renderPPVResult()` を全面書き換え
2. メインイベント判定: `match.isSummit` で金枠＋大サイズportrait
3. 各試合: `renderShowResult()` のmatch-result生成ロジックをベースにPPV用に調整
4. 吹き出し: 因縁リアクション（既存ロジック流用）→ portrait上に配置
5. 高MQ / PPVデビューコメントは `// TODO: 高MQ勝者コメント` `// TODO: PPVデビューコメント` でスタブを残す
6. `_pendingMatchDialogues` への push は**不要**（PPVでは吹き出しを結果画面内に直接表示するため、別ポップアップは出さない）

---

## 既存との整合性
- `renderPPVTVResult()` (L3607-3649) は変更なし（テレビ中継版は簡素でOK）
- `App.closePPVResult()` の呼び出しは既存のまま
- 通常興行の `renderShowResult()` は変更なし
