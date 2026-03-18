# 相関図リニューアル 実装スペック v1.0

> **プロトタイプ**: `relmap-prototype-v5.html`（リポジトリルート）
> **実装先**: Claude Code（チャットでは方針議論のみ）
> **方針**: データベースのサブタブ維持。相関図選択時はコンテンツエリアをフルに使う。

---

## 1. 設置場所と既存コード

### 1.1 置換対象

| ファイル | 行範囲 | 内容 |
|---|---|---|
| `src/ui-render.js` | 2989–3467 | `_RELMAP_ORG_COLORS`〜`_updateRelmapDetail()` の全関数群 |
| `src/index.html` | 1048–1118 | `.rel-layout` 〜 `.legend-swatch` の全CSSブロック |

### 1.2 維持するもの

- `_dbSubTab === 4` による切替（`renderDatabase()` 内の分岐はそのまま）
- `_relmapCenterId`, `_relmapFilter`, `_relmapSelected` のグローバル変数名（互換のため）
- `openRelationshipMap(charId)` （`ui-common.js:2391`）— 既存のまま
- サブタブバー（`🔗 相関図` ボタン）— 既存のまま

### 1.3 新規追加グローバル変数

```js
let _relmapViewMode = 'network'; // 'network' | 'focus'
let _relmapFilterRelOnly = false;
let _relmapFilterThreshold = 5;
let _relmapCompareA = null;
let _relmapCompareB = null;
```

---

## 2. データ接続

### 2.1 キャラデータ

```js
const allChars = Engine.database.getAllFighters(G);
// → 各要素: { id, name, style, pw, sp, te, st, mn, _orgId, _orgName, _orgTier, ... }
// OVR計算: Engine.util.ov(fighter)
```

### 2.2 関係データ

```js
const rels = G.relationships || {};
// キー: "charA>charB" → { bond: 0-100, rivalry: 0-100 }
// 非対称: "A>B" と "B>A" は別エントリ

const history = G.relationshipHistory || [];
// 過去の因縁履歴
```

### 2.3 ライバルタイトル

```js
const rivalLvl = Engine.title.getRivalryLevel(G, id1, id2);
// → null | { label, emoji, color, tier, matches, isOneSided, aggressor }
```

### 2.4 団体情報

```js
// プレイヤー団体名
G.orgName || 'プレイヤー団体'

// ライバル団体（data.js のグローバル）
RIVAL_ORGS // [{ id:'org_s', name:'', tier:'S', color:'#d63031', emoji:'👑' }, ...]

// 団体表示名（ゲーム内でランダム生成される）
G.rivalOrgNames?.[orgId] || org.name

// 団体カラー
const ORG_COLORS = { player:'#d4a843', org_s:'#d63031', org_a:'#6c5ce7', org_b:'#00b894', fa:'#8bc4f0' };
```

### 2.5 画像

```js
getPortraitUrl(charId)  // data.js:389 — 顔画像パス or ''
getUpperUrl(charId)     // data.js:390 — アッパー画像パス or ''
```

---

## 3. 画面構成

### 3.1 レイアウト方針

`_dbSubTab === 4` のとき、`_renderDbRelmap()` が返すHTMLは：
- **サブタブバーの直下**から使えるエリア全体を使用
- `.panel-title` は非表示（サブタブバーで「🔗 相関図」が既にアクティブなため自明）
- `#databasePanel` の `padding` をオーバーライドして余白を最小化

```css
/* 相関図モード時のパネル拡張 */
#databasePanel.relmap-active { padding: 0; }
#databasePanel.relmap-active > .db-subtab-bar { padding: 0 16px; }
```

### 3.2 HTML構造概要

```
<div id="relmapRoot" class="relmap-root">
  <!-- ヘッダーバー：ビューモード切替 + フィルタ + CENTER表示 -->
  <div class="relmap-header">
    [🌐 ネットワーク | 🎯 フォーカス]  [全リンク | ライバル | 親密度]  [CENTER: 白銀麗子 ✕]
  </div>

  <!-- メインエリア -->
  <div class="relmap-main">
    <!-- 左サイドバー -->
    <div class="relmap-sidebar">
      [🔄 全体を表示]
      [📊 表示フィルタ: 関係ありのみ / しきい値スライダー]
      [団体カード × 5]
    </div>

    <!-- グラフ領域 -->
    <div class="relmap-canvas" id="relmapContainer">
      <svg id="relmapSvg">
        <g id="relmapZoneLayer"></g>
        <g id="relmapLinkLayer"></g>
        <g id="relmapNodeLayer"></g>
      </svg>
    </div>

    <!-- 凡例 -->
    <div class="relmap-legend">...</div>
  </div>

  <!-- ボトムディテールパネル -->
  <div class="relmap-detail" id="relmapDetailPanel">...</div>

  <!-- 比較セレクトヒント -->
  <div class="relmap-select-hint" id="relmapSelectHint">...</div>
</div>
```

### 3.3 SVGのサイズ

```js
// DOM挿入後に _drawRelmapAfterRender() で取得
const container = document.getElementById('relmapContainer');
const W = container.offsetWidth;
const H = container.offsetHeight;
svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
```

---

## 4. ビューモード

### 4.1 ネットワークモード（デフォルト）

- **フォースシミュレーション**（プロトタイプの物理エンジンをそのまま移植）
  - クラスタ重力: 団体ごとの中心点に引き寄せ
  - リンク引力: 関係の強いノード同士が近づく
  - 反発力: ノード同士の重なり防止
  - alpha減衰: 初期 1.0 → 0.005 で安定
- **団体ゾーン表示**: radialGradient + 団体名テキスト（opacity 0.07）
- **ノードクリック = 中心設定** → 無関係ノードがフェードアウト（opacity 0.1）
- **ドラッグ** でノード移動可能

### 4.2 フォーカスモード

- 選択キャラが画面中央に配置（ノードサイズ 1.3倍）
- 関係のあるキャラだけが放射状に配置される（関係の強さで距離が変わる）
- 関係のないキャラは `_hidden = true` で非表示
- 団体ゾーンは非表示
- ノードクリックで中心キャラを切り替え

---

## 5. 表示フィルタ

### 5.1 「関係ありのみ表示」チェック

`filterRelOnly = true` のとき、`strength >= threshold/100` のリンクに接続していないノードを非表示にする。
ネットワークモードでのみ有効。

### 5.2 「強度しきい値」スライダー

range: 0–40。リンクの `strength` がこの値/100未満のものを間引く。

### 5.3 リンクフィルタ（ヘッダー）

| ボタン | 条件 |
|---|---|
| 全リンク | `strength >= 0.15`（弱い関係をカット） |
| ライバル | `rivAB >= 25 \|\| rivBA >= 25 \|\| rivalTitle` |
| 親密度 | `|bondAB - 50| >= 15 \|\| |bondBA - 50| >= 15` |

---

## 6. ノード表現

| 要素 | 仕様 |
|---|---|
| サイズ | `r = 12 + (ovr - 60) * 0.5` |
| 枠線 | 団体カラー、2px。中心キャラは 3px + glow filter |
| 中央テキスト | OVR値（Oswald、団体カラー、opacity 0.5） |
| 下ラベル | 名前（5文字超は省略）+ 団体emoji |
| ライバル持ち | 赤いパルスリング（opacity アニメーション） |
| 中心キャラ | ゴールドのパルスリング + glow-gold filter |
| 比較選択 | 青(LEFT)/赤(RIGHT) のダッシュリング + ラベル |

---

## 7. リンク表現

既存の `_drawRelmapConnection` のロジックを踏襲しつつ、SVG innerHTML 一括生成に変更。

- **親密度線**: A→B / B→A を並行2本（offset ±4px）。色は bond≥50 で青、<50 で赤。幅は |bond-50|/25 + 1。bond<40 は破線。
- **競争意識線**: 中央に橙色の破線オーバーレイ。`stroke-dasharray: 8,5` + `dash-march` アニメーション。rivalry≥50 で 🔥 アイコン。
- **ライバルタイトルバッジ**: リンク中間点に `<rect>` + `<text>`。
- **片側因縁**: ⚡ アイコン。

---

## 8. 右クリックメニュー

| 項目 | 動作 |
|---|---|
| 🎯 中心に設定 | `_relmapCenterId = id; updateVisibility(); reheat()` |
| 📋 詳細を見る | `showFighterPopup(id)` ← **既存関数をそのまま呼ぶ** |
| ⚖ 比較に追加 | `handleCompareClick(id)` |

---

## 9. 比較ポップアップ

### 9.1 セレクション

順次クリック方式:
1. 1回目 → `compareA` にセット
2. 2回目 → `compareB` にセット → 自動でポップアップ表示
3. 既にセット済みのIDをクリック → 解除
4. 3人目 → `compareA = compareB; compareB = newId`（シフト）

### 9.2 レイアウト

```
┌─────────────────────────────────────────────────┐
│  [✕]                                            │
│  ┌─── 左側 ──────────┐⇄┌─── 右側 ──────────┐   │
│  │  [upper画像 220×280]│  │  [upper画像 220×280]│   │
│  │  名前              │  │  名前              │   │
│  │  団体 ─ Style      │  │  団体 ─ Style      │   │
│  │  OVR badge         │  │  OVR badge         │   │
│  └────────────────────┘  └────────────────────┘   │
│                                                   │
│  [PW] ████████ 86  PW  72 ████████               │
│  [SP] ████████ 82  SP  88 ████████████           │
│  ...                                              │
│                                                   │
│  🔗 RELATIONSHIP  🔥🔥🔥 永遠のライバル          │
│  ┌── 白銀の感情 ──────┐┌── 川野辺の感情 ────┐     │
│  │ 親密度    35 ████  ││ 親密度    60 ██████│     │
│  │ 競争意識  82 ██████││ 競争意識  28 ███   │     │
│  └────────────────────┘└────────────────────┘     │
└───────────────────────────────────────────────────┘
```

**重要**: 感情は **そのキャラクター側に配置**。
- 左パネル = 左キャラ → 右キャラ への感情（親密度・競争意識）
- 右パネル = 右キャラ → 左キャラ への感情

### 9.3 画像

```js
const upperSrc = getUpperUrl(charId);
// fallback: getPortraitUrl(charId) → 👤 アイコン
```

---

## 10. ボトムディテールパネル

中心キャラの**最も強い関係**を自動表示。
- 左右に顔画像（クリックで `showFighterPopup`）
- 「⇄」（VS ではない）
- 親密度・競争意識の双方向メーター
- 右端: 「📋 詳細」「⚖ 比較」のクイックリンク

---

## 11. サイドバー

上から順に:
1. **🔄 全体を表示** ボタン — フォーカス解除 + ビューモードリセット
2. **📊 表示フィルタ** パネル
   - 「関係ありのみ表示」チェックボックス
   - 「強度しきい値」rangeスライダー (0–40)
3. **団体カード** × 最大5枚（player, org_s, org_a, org_b, fa）
   - 団体名 + 所属人数 + 平均OVR
   - 顔画像プレビュー（上位6名）
   - クリック → そのエースを中心に設定

---

## 12. パフォーマンス考慮事項

### 12.1 フレームレート

- `requestAnimationFrame` で毎フレーム `tick()` → **2フレームに1回だけDOM更新**（`frameCount % 2`）
- alpha が min（0.005）に達したら物理は最小限に

### 12.2 ノード数制限

98キャラ全員のペアは 98×97 = 9,506 方向。
- **リンクは `_relmapGetPairs` 相当のフィルタ後のもの**（sortScore >= 3）のみ生成
- ネットワークモードで `filterRelOnly` 有効時は接続なしノードを非表示
- フォーカスモードでは中心キャラの接続先のみ表示（最大20程度）

### 12.3 SVG vs Canvas

プロトタイプは SVG innerHTML 一括差し替え。
28ノード + 28リンクで十分軽い。98ノードでもSVGで問題ないが、
もしパフォーマンス問題が出た場合は Canvas 2D に切り替えを検討。

---

## 13. 実装手順（推奨）

1. `index.html` に新CSS追加（旧CSS `.rel-layout` 〜 `.legend-swatch` を置換）
2. `ui-render.js` の旧関数群（2989–3467行）を削除し、新しい関数群を挿入:
   - `_renderDbRelmap()` — HTML骨格生成
   - `_drawRelmapAfterRender()` — 物理シミュレーション開始 + イベントリスナー設定
   - `_relmapTick()` — 物理ステップ + render
   - `_relmapRender()` — SVG innerHTML 更新
   - `_relmapUpdateVisibility()` — ノード表示/非表示制御
   - `_relmapShowDetail(nodeId)` — ボトムパネル更新
   - `_relmapShowCompare()` — 比較ポップアップ表示
3. `renderDatabase()` 内の `if (_dbSubTab === 4)` ブロックで `.relmap-active` クラスをパネルに付与
4. 動作確認: ネットワーク/フォーカス切替、フィルタ、比較、右クリック
