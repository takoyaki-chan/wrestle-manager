# 開発率ラベル化 実装仕様

## 目的

開発率（getPotentialPct）の数値%表示を廃止し、ファジーな5段階ラベルに置き換える。
CLAUDE.md「❌ 数値の丸見せによるスプレッドシートゲーム化」の是正。

## 5段階定義

| ラベル | 基準レンジ（potPct） |
|--------|---------------------|
| 未開花 | 0〜30 |
| 成長期 | 25〜55 |
| 開花中 | 45〜75 |
| 充実期 | 65〜90 |
| 完成形 | 85〜100 |

隣接する段階のレンジは意図的に10〜15ポイント重複している（ファジーバウンダリ）。

## ファジーバウンダリ（選手固定オフセット方式）

### 仕組み
- 選手ごとに `devLabelOffset`（整数、-7〜+7）を持つ
- ラベル判定時、各境界閾値にこのオフセットを加算してから判定する
- 同じpotPct=68%でも、offset=-5の選手は「充実期」、offset=+5の選手は「開花中」になりうる
- 一度決まったら固定。リロードや週経過で揺れない

### 生成タイミング
- **新規選手**: 生成時（`Engine.growth.initChar` 等、選手初期化の箇所）にランダムで振る
- **既存セーブの選手**: `devLabelOffset` が未定義の場合、選手IDからの決定論的ハッシュで生成する（セーブ互換）
  - 例: `((charId * 2654435761) >>> 0) % 15 - 7` のような簡易ハッシュ

### 判定ロジック（疑似コード）

```javascript
getPotentialLabel(char) {
  const potPct = Engine.util.getPotentialPct(char);
  const offset = char.devLabelOffset || calcDevLabelOffset(char.id);
  
  // 境界（上から判定）
  if (potPct >= 85 + offset) return { label: '完成形', stage: 4 };
  if (potPct >= 65 + offset) return { label: '充実期', stage: 3 };
  if (potPct >= 45 + offset) return { label: '開花中', stage: 2 };
  if (potPct >= 25 + offset) return { label: '成長期', stage: 1 };
  return { label: '未開花', stage: 0 };
}
```

※ offsetにより閾値がレンジ外に飛ばないようclampすること（例: 最低閾値の25+offsetが18未満にならないよう等、極端なケースをケア）。

## 表示変更

### 共通方針
- 数値`XX%`を廃止し、ラベルテキストで表示
- プログレスバーは残す（内部potPctをそのまま使用）。バーだけ見ても正確な%はわからない程度の細いバーなのでOK
- バーの色はフィジカルのように段階に応じて変える

### バー色の目安
| stage | 色 | 意味 |
|-------|----|------|
| 0 (未開花) | #2ecc71 (緑) | 伸びしろたっぷり |
| 1 (成長期) | #27ae60 (深緑) | 伸びてきている |
| 2 (開花中) | #f39c12 (黄) | 力をつけてきた |
| 3 (充実期) | #e67e22 (オレンジ) | かなり仕上がっている |
| 4 (完成形) | #e74c3c (赤) | ほぼ天井 |

### 変更箇所①: ui-common.js:2317付近（ロスターポップアップ）

現状:
```javascript
const potPct = getPotentialPct(c);
const potColor = potPct >= 90 ? '#e74c3c' : potPct >= 70 ? '#f39c12' : '#2ecc71';
// ...
<span style="color:${potColor};font-weight:700">${potPct}%</span>
```

変更後: `getPotentialLabel(c)` を呼び、数値の代わりにラベルを表示。バー幅は内部potPctのまま。色はstageから決定。

### 変更箇所②: ui-render.js:1543付近（詳細画面・育成タブ）

現状:
```javascript
const potPct = getPotentialPct(c);
tab3 += `...${potPct}%...`;
```

変更後: 同上。ラベル表示に置換。

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/engine.js` | `Engine.util.getPotentialLabel(char)` 新設、`calcDevLabelOffset(id)` ヘルパー追加 |
| `src/app.js` | `getPotentialLabel()` ラッパー関数追加（既存の `getPotentialPct` と同様） |
| `src/ui-common.js` | ポップアップの開発率表示をラベル化（2317行付近） |
| `src/ui-render.js` | 詳細画面育成タブの開発率表示をラベル化（1543行付近） |
| `src/data.js` | 新規選手生成時に `devLabelOffset` を付与 |

## 注意事項

- `getPotentialPct()` 自体は廃止しない（内部計算・バー表示・テスト等で引き続き使用）
- auto-simに影響なし（UIのみの変更）
- 既存セーブデータとの互換性はハッシュ方式で担保
- ラベル「開発率」という項目名自体はそのまま残す
