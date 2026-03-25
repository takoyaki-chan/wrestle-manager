# 実装仕様書: 3件の修正・改善

> 作成: 2026-03-20 チャット設計会議

---

## 修正1: 選手カードの身長表示「?cm」→ 正しい表示に

### 原因

`ui-render.js` L1273:
```javascript
<div class="rd-portrait-sub">${c.height || '?'}cm ｜ ${tenure}年目</div>
```
プロパティ名が `c.height` だが、正しくは `c.h`。

### 修正内容

L1273 を以下に変更:
```javascript
<div class="rd-portrait-sub">${c.h || '?'}cm ｜ ${c.age || '?'}歳 ｜ ${tenure}年目</div>
```

**変更点:**
- `c.height` → `c.h`（バグ修正）
- 年齢(`c.age`)を追加表示

### 影響範囲

`_renderRosterDetailPanel()` のみ。他画面(L181, L274)は既に `c.h` を使っており正常。

---

## 修正2: 密着取材イベントのレパートリー拡充

### 現状の問題

1. `_buildB4Modal()` (ui-common.js L5377) で全選手が候補（レンタル含む）
2. テキストが全部同じ趣旨（「密着取材」）
3. 「次世代のスターを追いかけたい」がベテランにも適用される

### 設計: 取材サブタイプ

B4イベント生成時にサブタイプを決定し、サブタイプごとに候補フィルタを適用する。

| subType | テーマ | 候補条件 | フォールバック |
|---|---|---|---|
| `youngStar` | 次世代のスター | 年齢22歳以下 ＆ `!isRental` ＆ `!injury` | 候補0人→別subTypeへ |
| `ace` | エース密着 | (チャンピオン or OVR上位3名) ＆ `!isRental` ＆ `!injury` | 候補0人→別subTypeへ |
| `veteran` | ベテランの矜持 | (年齢26歳以上 or `careerSeasons >= 5`) ＆ `!isRental` ＆ `!injury` | 候補0人→別subTypeへ |

**レンタル選手は全サブタイプで除外。**

### §2.1 engine.js の変更 — B4生成 (L10530付近)

`case 'B4'` のreturn値に `subType` を追加。ロスター情報を使ってサブタイプを決定する。

```javascript
case 'B4': {
  const outlets = typeof MEDIA_OUTLET_NAMES !== 'undefined' ? MEDIA_OUTLET_NAMES : ['メディア'];
  const outletName = outlets[Engine.rng.int(rng, 0, outlets.length - 1)];
  
  // サブタイプ候補を判定（ロスターは state.roster）
  const r = (state.roster || []).filter(f => !f.injury && !f.isRental);
  const champId = state.titles?.world?.championId;
  const ovrSorted = r.slice().sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const top3Ids = new Set(ovrSorted.slice(0, 3).map(f => f.id));
  
  const subCandidates = [];
  const youngPool = r.filter(f => (f.age || 17) <= 22);
  const acePool = r.filter(f => f.id === champId || top3Ids.has(f.id));
  const vetPool = r.filter(f => (f.age || 17) >= 26 || (f.careerSeasons || 0) >= 5);
  
  if (youngPool.length > 0) subCandidates.push('youngStar');
  if (acePool.length > 0) subCandidates.push('ace');
  if (vetPool.length > 0) subCandidates.push('veteran');
  
  // 候補がなければデフォルト（全員対象、旧挙動）
  const subType = subCandidates.length > 0
    ? subCandidates[Engine.rng.int(rng, 0, subCandidates.length - 1)]
    : 'youngStar';
  
  return { type: 'B4', outletName, subType };
}
```

**注意:** `generateLargeEvent` の引数に `state` が必要。現在 L10460 の関数シグネチャは `generateLargeEvent(rng, state, roster)` なので `state` はアクセス可能。B4の `case` ブロック内で `state.roster` と `state.titles` を参照する。

### §2.2 data.js の変更 — B4テキストをサブタイプ別に分割

既存の `LARGE_EVENT_TEXTS.B4` 配列をサブタイプ別オブジェクトに変更:

```javascript
B4: {
  youngStar: [
    { text: '📺 {outletName}から若手特集の申し入れ', detail: '{outletName}が「次世代のスターを追いかけたい」と密着取材を申し出ている。' },
    { text: '📺 {outletName}が注目の新星を追いたいと打診', detail: '{outletName}のディレクターが「若い才能に密着したい」と話を持ちかけてきた。' },
    { text: '📺 {outletName}の「若手発掘」企画にうちの選手が候補に', detail: '「プロレス界の未来を担う若手を追う」——{outletName}からそんな企画の依頼が来た。' },
  ],
  ace: [
    { text: '📺 {outletName}がエース密着企画を提案', detail: '{outletName}が「団体の顔に密着したい」とドキュメンタリー企画を持ち込んできた。' },
    { text: '📺 {outletName}から「頂点の景色」取材オファー', detail: '{outletName}が「頂点に立つ選手の日常を追いたい」と密着取材を打診してきた。' },
    { text: '📺 {outletName}がトップ選手の特集を企画中', detail: '「団体を背負うエースに迫る」——{outletName}からそんなオファーが届いた。推薦する選手を選んでほしいという。' },
  ],
  veteran: [
    { text: '📺 {outletName}がベテラン特集を企画', detail: '{outletName}が「長く戦い続ける選手の矜持に迫りたい」と密着取材を申し出ている。' },
    { text: '📺 {outletName}から「キャリアの深み」取材依頼', detail: '{outletName}のプロデューサーが来訪。「経験豊富な選手の素顔を追いたい」とのこと。' },
    { text: '📺 {outletName}が「円熟の技」ドキュメントを提案', detail: '「ベテランだからこそ見える景色がある」——{outletName}からそんなテーマの企画が持ち込まれた。' },
  ],
},
```

### §2.3 engine.js — pickText の B4 対応

`pickText()` (L10432) でB4テキスト取得時にサブタイプを考慮する必要がある。

`pickText` を呼ぶ側（`generateLargeEvent` or その呼び出し元）で、B4イベントの場合はキー `B4` の代わりに `B4.subType` でアクセスするか、pickText内でサブタイプを処理する。

**推奨方法:** pickTextの呼び出し元を確認し、B4の場合にサブオブジェクトからプールを取得するようにする。

pickTextの中で処理する場合:
```javascript
// B4のサブタイプ対応
if (key === 'B4' && vars.subType && typeof pool === 'object' && !Array.isArray(pool)) {
  pool = pool[vars.subType] || pool.youngStar || [];
}
```

**呼び出し元でvarsに `subType` を渡す必要がある。** イベント生成→テキスト取得の流れを追って、B4イベントオブジェクトの `subType` が `vars` に含まれるようにすること。

### §2.4 ui-common.js — _buildB4Modal のフィルタリング (L5377)

```javascript
function _buildB4Modal(event, state, roster) {
  const subType = event.subType || 'youngStar';
  const champId = state.titles?.world?.championId;
  
  // 基本フィルタ: 怪我なし ＆ レンタルでない
  let available = roster.filter(f => !f.injury && !f.isRental);
  
  // サブタイプ別フィルタ
  switch (subType) {
    case 'youngStar':
      available = available.filter(f => (f.age || 17) <= 22);
      break;
    case 'ace': {
      const ovrSorted = available.slice().sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
      const top3Ids = new Set(ovrSorted.slice(0, 3).map(f => f.id));
      available = available.filter(f => f.id === champId || top3Ids.has(f.id));
      break;
    }
    case 'veteran':
      available = available.filter(f => (f.age || 17) >= 26 || (f.careerSeasons || 0) >= 5);
      break;
  }
  
  // フォールバック: 候補0人なら全員（レンタル除外のみ）
  if (available.length === 0) {
    available = roster.filter(f => !f.injury && !f.isRental);
  }
  
  const outletName = event.outletName || 'メディア';
  // ... 以降のHTML生成は現行どおり。ただしタイトル部分にサブタイプを反映 ...
```

**モーダルタイトルもサブタイプ別に変更:**
```javascript
const subTypeLabels = {
  youngStar: '若手特集',
  ace: 'エース密着',
  veteran: 'ベテラン特集',
};
const subLabel = subTypeLabels[subType] || '密着取材';

let html = `<div class="care-title" style="border-bottom:1px solid #3498db;padding-bottom:10px;margin-bottom:12px">📺 ${outletName}からの${subLabel}オファー</div>`;
```

### §2.5 processMediaSpotlight — 変更不要

取材開始後の処理（3興行のMQ追跡→結果判定）はサブタイプに関係なく同じロジック。変更不要。

---

## 修正3: オフシーズン処理順の変更（契約更新→スカウト）

### 現行の順序

| offWeek | 処理 |
|---|---|
| 1 | 引退処理・シーズンレポート・レンタル終了 |
| 2 | スカウト（AI + プレイヤー） |
| 3 | 移籍ウィンドウ（AI間移籍 + FA） |
| 4 | 契約更新交渉 + 契約OVR更新 |
| 5 | 新シーズン開始 |

### 変更後の順序

| offWeek | 処理 |
|---|---|
| 1 | 引退処理・シーズンレポート・レンタル終了（変更なし） |
| 2 | **契約更新交渉 + 契約OVR更新**（旧offWeek 4） |
| 3 | **スカウト（AI + プレイヤー）**（旧offWeek 2） |
| 4 | **移籍ウィンドウ（AI間移籍 + FA）**（旧offWeek 3） |
| 5 | 新シーズン開始（変更なし） |

### §3.1 engine.js の変更箇所

`Engine.advanceWeek` 内のオフシーズン処理ブロック (L7350〜L7690付近)。

**具体的な変更:** `if (offWeek === 2)` / `else if (offWeek === 3)` / `else if (offWeek === 4)` の中身を入れ替える。

- 現行 offWeek 2 のコード（スカウト L7510-7537）→ offWeek 3 へ移動
- 現行 offWeek 3 のコード（移籍 L7539-7550）→ offWeek 4 へ移動
- 現行 offWeek 4 のコード（契約更新 L7552-7586）→ offWeek 2 へ移動

**ログメッセージも修正:**
- `'📅 オフシーズン第2週: スカウトレポート到着！'` → `'📅 オフシーズン第3週: スカウトレポート到着！'`
- `'📅 オフシーズン第3週: 移籍ウィンドウ'` → `'📅 オフシーズン第4週: 移籍ウィンドウ'`
- `'📅 オフシーズン第4週: 契約更新完了'` → `'📅 オフシーズン第2週: 契約更新完了'`
- 契約交渉のログ（L7569等）にある週番号参照は変わらない（シーズン番号参照のため）

### §3.2 RNGシード

各offWeekのRNGシードはoffWeek番号で派生している (L7353):
```javascript
const rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 900 + offWeek));
```
コードブロックを移動するだけで自動的に新しいoffWeek番号のシードが使われるので、RNGの変更は不要。ただし **auto-simの結果が変わる**（シード変更による）ことは想定内。

### §3.3 依存関係の確認

- offWeek 2（契約更新）→ offWeek 3（スカウト）: 契約更新で退団した選手分の空き枠がスカウト判断に使える ✅ 正しい依存方向
- offWeek 3（スカウト）→ offWeek 4（移籍）: スカウト完了後にFAが拾われる ✅ 問題なし
- 契約OVR更新（旧offWeek4のL7578-7585）: スカウト前に更新するが、新規加入選手はスカウト時に個別設定されるので問題なし

### §3.4 UI側の変更

`ui-render.js` や `ui-common.js` でoffWeek番号を直接参照している箇所があれば修正が必要。

```bash
grep -n "offWeek.*[234]\|オフシーズン第[234]週" src/ui-render.js src/ui-common.js src/app.js
```
で該当箇所を洗い出し、表示テキストを新しい週番号に合わせること。

---

## 実装順序

1. **修正1**（身長バグ）— 1行変更のみ。最初に実施。
2. **修正3**（オフシーズン順序変更）— コードブロック入れ替え。ロジック変更なし。
3. **修正2**（密着取材レパートリー）— data.js + engine.js + ui-common.js の3ファイル変更。

## 検証

- 修正1: ゲーム起動→団体画面→選手カード展開→身長が正しく表示されることを確認
- 修正2: auto-sim 100シーズンでB4イベントが発生し、各subTypeが出現していることをログで確認。手動プレイでモーダルの候補がフィルタリングされていることを確認
- 修正3: auto-sim 100シーズンでオフシーズンが正常に進行すること。手動プレイで「契約更新→スカウト」の順序になっていることを確認
