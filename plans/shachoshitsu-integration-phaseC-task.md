# Phase C: スカウト/レンタルの机上統合 — 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 4〜5時間（最大のフェーズ）
> **承認状態**: 設計合意済み（shachoshitsu-integration-spec-v0.2.md）
> **前提**: Phase A + Phase B 完了後に着手
> **モックアップ**: `shachoshitsu-integration-mockup-v3.html` を必ず開いて見た目を確認すること

---

## Phase C の目的

トップバーの「🔍 スカウト」タブを廃止し、社長室に内部タブ（📋 決裁 / 🔍 スカウト / 🤝 レンタル）を追加する。スカウトのFA一覧を3列履歴書カード、レンタル候補を4列×2行小型カードとして、机の上の書類として表示する。

ロジック（`Engine.scout`, `Engine.rental`）には一切手を入れない。

---

## Phase C で実装するもの

1. 社長室に内部タブUI（決裁/スカウト/レンタル）を追加
2. タブ切替 + 書類入替アニメーション + HUD右側出し分け
3. スカウトタブ: 3列履歴書カード + 3枚ずつページ送り + 知名度不足表示
4. レンタルタブ: 4×2小型カード + 金額ソート + 壁ミニカード（契約中）
5. ドラフト導線: 新聞イントロを社長室スカウトタブに表示
6. トップバーから「🔍 スカウト」を削除、全参照を書換え
7. オフシーズン時の各タブの制限表示

**Phase C で実装しないもの**:
- `Engine.scout` / `Engine.rental` のロジック変更
- `renderScoutEvent` / scoutEvent 画面の変更
- ドラフト交渉（`draft-negotiation.js`）の変更

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. `CLAUDE.md` — アーキテクチャ5原則、UI実装ルール
2. `specs/shachoshitsu-integration-spec-v0.2.md` §2 + §5 + §6 全体
3. `specs/scout-system-spec-v1.0.md` §2（全体フロー）、§3（開示範囲）
4. `specs/rental-system-spec-v2.0.md` §1〜§3
5. `shachoshitsu-integration-mockup-v3.html` — **ブラウザで開いて3タブを確認**

---

## 既存コードの影響範囲（重要）

### 変更するファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/index.html` | ①トップバーからスカウトボタン削除 ②内部タブCSS追加 ③スカウト/レンタルカードCSS追加 |
| `src/ui-render.js` | ①`renderShachoshitsu` に内部タブ対応を追加 ②スカウトタブ・レンタルタブのレンダリング関数追加 ③`refreshAll` から `renderScout()` を除去 |
| `src/ui-common.js` | ①`showScreen` から `scout` 分岐を処理 ②`sortRentalTable` を社長室レンタルタブ用に書換え ③ポップアップの `source:'scout'` → `source:'free'` 等の調整 |
| `src/app.js` | 画面遷移先の `showScreen('scout')` → `showScreen('shachoshitsu')` 書換え |

### 触ってはいけない既存コード

- `Engine.scout` 名前空間（`management.js`）— 候補生成・契約金計算等のロジック
- `Engine.rental` 名前空間（`management.js`）— レンタル計算・契約処理ロジック
- `renderScoutEvent` / `_renderDraftNegotiation` / `_renderDraftCandidateList` — ドラフト画面は全く変更しない
- `screen-scoutEvent` DOM要素 — ドラフト専用画面として残す
- `Engine.util.getVisibleFAIds` / `Engine.util.getVisibleRentalIds` — 紹介枠ロジック

---

## タスクリスト

### C-1: 内部タブUIの追加

**ファイル**: `src/index.html`（CSS）, `src/ui-render.js`

`renderShachoshitsu()` を拡張して内部タブを描画:

```
HUD（既存）
↓
内部タブ行: [📋 決裁] [🔍 スカウト] [🤝 レンタル]
↓
サマリーバー（タブ別の情報）
↓
壁 + 窓（既存の壁画像）
↓
机（タブに応じて異なるコンテンツ）
```

**タブの状態管理**: `G._shachoshitsuTab` に `'decision'` / `'scout'` / `'rental'` を保持。未設定なら `'decision'`。ドラフト開催週（`G.scoutCandidates` が存在）なら `'scout'`。

**タブ切替関数**: `App.switchShachoshitsuTab(tabId)` を新設。`G._shachoshitsuTab` を更新して `renderShachoshitsu()` を再呼び出し。

**HUD右側の出し分け**:
- 決裁: 既存の `renderShachoshitsuHud()` をそのまま使用
- スカウト: `所属 N/M名 ｜ 紹介枠 N名`
- レンタル: `レンタル枠 N/M枠 ｜ 残り N枠`

**タブバッジ**:
- スカウト: `G.scoutCandidates` が存在するときのみ `📰` バッジ
- レンタル: `(G.rentals || []).length > 0` のときのみドット
- 決裁: バッジなし

### C-2: タブ切替アニメーション

**ファイル**: `src/index.html`（CSS）

タブ切替時に机の書類がバサッと入れ替わる:

```css
@keyframes shachoshitsu-doc-enter {
  from { opacity:0; transform:translateY(18px) rotate(var(--doc-rotate,0deg)); }
  to { opacity:1; transform:translateY(0) rotate(var(--doc-rotate,0deg)); }
}
```

既存の `shachoshitsu-doc-enter` アニメーションを再利用。各カードに `animation-delay` を stagger 付与（0.05秒刻み）。

### C-3: スカウトタブの実装

**ファイル**: `src/ui-render.js`

`renderShachoshitsuScout()` を新設。

**データ取得**: 既存の `renderScout()` (L3273) と同じロジックを使用:
```javascript
const visibleFAIds = Engine.util.getVisibleFAIds(G);
const visibleFA = [...G.freeAgents]
  .filter(c => visibleFAIds.includes(c.id))
  .sort((a,b) => ov(b) - ov(a));
```

**知名度不足の候補**:
1. `Engine.scout.canNegotiate(G.orgPop, c, 'fa', G)` で判定
2. 契約可能な候補を先にソート、不可の候補を末尾に回す
3. 不可カード: グレーオーバーレイ (`filter:grayscale(0.8) brightness(0.85)` + opacity低下)
4. カード上に斜めの「契約不可」朱印スタンプ（CSS `transform:rotate(-15deg)` の赤文字）
5. ボタン: `⛔ 知名度不足` で disabled
6. ホバーツールチップ: 具体的な条件を表示

**3列グリッド**: 
```css
.shachoshitsu-scout-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  max-width: 832px;
  margin: 0 auto;
}
```

**履歴書カードの構造**（モックアップv3参照）:
```
背景: document-resume-blank.webp (264×460px)
├── タグ行: [フリー] [有望]
├── アッパー画像エリア（aspect-ratio: 5/4、portraitImg を使用）
├── 名前 + 年齢
├── OVR（Bebas Neue 36px）
├── スタイル + ロールバッジ
├── 5ステータスバー（PWR/SPD/TEC/STA/MNT）
├── 契約金 + 給与
└── [📋 詳細] [✒️ 契約交渉] ボタン
```

**ステータスバーの値**: `c._estimate` があればそれを使用、なければ `c.pw`, `c.sp`, `c.te`, `c.st`, `c.mn` を直接使用。既存の `renderScout` の表示と同じデータソース。

**ページ送り**: 
```javascript
const PAGE_SIZE = 3;
let scoutPage = G._shachoshitsuScoutPage || 0;
const totalPages = Math.ceil(sortedFA.length / PAGE_SIZE);
const pageItems = sortedFA.slice(scoutPage * PAGE_SIZE, (scoutPage + 1) * PAGE_SIZE);
```

◀ ▶ ボタンで `G._shachoshitsuScoutPage` を更新 → `renderShachoshitsu()` を再呼び出し。

**ドラフト開催週の新聞**:
`G.scoutCandidates` が存在し `G._draftNegotiationStarted` が false のとき、FA一覧の代わりに既存の新聞イントロ（`_renderDraftCandidateList` 相当のコード）を机上に表示。ただし実際のレンダリングは `renderScoutEvent` 内にあるので、ここでは「ドラフトへ」ボタンのみを表示するシンプル版にする:

```html
<div class="draft-notice">
  📰 ドラフト速報が届いています — 候補 N名
  <button onclick="showScreen('scoutEvent');Audio.bgm.play('tension')">⚖ ドラフトへ</button>
</div>
```

### C-4: レンタルタブの実装

**ファイル**: `src/ui-render.js`

`renderShachoshitsuRental()` を新設。

**データ取得**: 既存の `renderScout()` 内のレンタルセクション (L3328〜) と同じロジック:
```javascript
const activeRentals = G.rentals || [];
const ownRoster = G.roster.filter(c => !c.isRental);
const maxSlots = RENTAL_CONFIG.getMaxConcurrent(ownRoster.length);
const remainingSlots = Math.max(0, maxSlots - activeRentals.length);
const rentals = Engine.rental.getAvailableRentals(G);
const visibleRentalIds = Engine.util.getVisibleRentalIds(G);
const visibleRentals = rentals.filter(r => visibleRentalIds.includes(r.fighter.id));
```

**ソート**: `window._rentalSortDir` (`'asc'` / `'desc'`) で金額ソート。
- 安い順（デフォルト）: `a.fees[1] - b.fees[1]`
- 高い順: `b.fees[1] - a.fees[1]`
- ソートボタン: 「💰 安い順 ▲ / 高い順 ▼」をグリッド上部に表示

**4列×2行グリッド**: 
```css
.shachoshitsu-rental-grid {
  display: grid;
  grid-template-columns: repeat(4, 196px);
  gap: 10px 16px;
  max-width: 832px;
  margin: 0 auto;
}
```

**小型カードの構造**（モックアップv3参照）:
```
背景: document-mini-blank.webp (196×148px)
├── タグ: 供給元（EMPRESS / NOVA / CRESCENT / フリー）
├── ポートレイト（32px） + 名前 + OVR
├── スタイル + ロールバッジ
├── 費用 + 期間セレクト
└── [🤝 契約] ボタン
```

**契約中レンタルの壁ミニカード**:
- `activeRentals.length > 0` のとき、壁エリアの右下にミニカードを配置
- 壁の `position:relative` 内に `position:absolute;bottom:8px;right:4%` で配置
- ミニカード: 選手名・供給元・残り週数のみ
- レンタルタブ表示中のみ `display:flex`

**オフシーズン / 枠上限**:
- `G.offSeason`: 候補一覧を出さず「オフシーズン中はレンタルできません」メモ。契約中があれば壁ミニカードは表示
- `remainingSlots <= 0`: 「レンタル枠が満員です」メモ

### C-5: トップバーからスカウト削除

**ファイル**: `src/index.html` L3259

```html
<!-- 削除 -->
<button class="nav-btn" onclick="showScreen('scout',event)">🔍 スカウト</button>
```

社長室ボタンの位置が繰り上がる。

### C-6: showScreen の 'scout' 処理

**ファイル**: `src/ui-common.js` L5780

`showScreen` に互換処理を追加:

```javascript
if (id === 'scout') {
  // Legacy compat: scout tab merged into shachoshitsu
  id = 'shachoshitsu';
  // スカウトタブを選択
  G = { ...G, _shachoshitsuTab: 'scout' };
}
```

これにより、万が一コード内に `showScreen('scout')` の呼び出しが残っていても社長室のスカウトタブに飛ぶ。

### C-7: refreshAll からの renderScout 除去

**ファイル**: `src/ui-render.js` L4534

```javascript
// 削除または条件分岐
// renderScout();  ← 社長室に統合されたので不要
```

代わりに `renderShachoshitsu()` 内でアクティブタブに応じて描画する。

### C-8: 関連する参照の書換え

**確認が必要な箇所**:

| 箇所 | 現在 | 変更後 |
|------|------|--------|
| `src/index.html` L3259 | `showScreen('scout')` | 削除 |
| `src/ui-common.js` L5727 | `renderScout()` (sortRentalTable) | `renderShachoshitsu()` |
| `src/ui-render.js` L1395 | `showScreen('scoutEvent')` | そのまま（scoutEvent は残す） |
| `src/ui-render.js` L4534 | `renderScout()` (refreshAll) | 除去 |
| `src/ui-common.js` L2630 | `source === 'scout'` (ポップアップ) | `source === 'free'` に統一するか検討 |

**`screen-scout` DOM要素**: 
- `src/index.html` L3309 の `<div id="screen-scout">` は**残す**（即座に削除すると未発見の参照で壊れる可能性）。中身を空にして `display:none` 固定にする。十分テストした後に安全に削除。

### C-9: オフシーズン対応

`renderShachoshitsu()` 内で `G.offSeason` を判定し:

- 決裁タブ: `Engine.shachoshitsu.getAvailableDocs(G)` が空なら「オフシーズン — 案件なし」メモ（既存の `shachoshitsu-empty-note` スタイルを使用）
- スカウトタブ: FA一覧は表示するが契約ボタンを disabled 化。`offWeek === 3` のときはドラフト導線表示
- レンタルタブ: 候補を出さない。契約中のみ壁ミニカード表示

---

## 新規 CSS（index.html に追加）

```css
/* 内部タブ */
.shachoshitsu-tabs { ... }
.shachoshitsu-tab { ... }
.shachoshitsu-tab.active { ... }
.shachoshitsu-tab-badge { ... }

/* サマリーバー */
.shachoshitsu-summary { ... }

/* スカウト 3列履歴書 */
.shachoshitsu-scout-grid { ... }
.shachoshitsu-resume { ... }
.shachoshitsu-resume-img { ... }
.shachoshitsu-resume-body { ... }
.shachoshitsu-resume-stats { ... }
.shachoshitsu-resume-unavailable { ... }  /* 知名度不足 */
.shachoshitsu-resume-stamp { ... }       /* 契約不可スタンプ */

/* レンタル 4列小型 */
.shachoshitsu-rental-grid { ... }
.shachoshitsu-rental-mini { ... }
.shachoshitsu-rental-sort { ... }

/* 壁上のレンタルミニカード */
.shachoshitsu-wall-rental-strip { ... }
.shachoshitsu-wall-rental-mini { ... }

/* ページ送り */
.shachoshitsu-page-nav { ... }
.shachoshitsu-page-btn { ... }
```

既存の社長室 CSS トークン（`--shachoshitsu-*`）を活用すること。命名は既存の `.shachoshitsu-doc-*` に揃える。

---

## 検証

1. **タブ切替**: 3タブ間の切替で書類が正しく入れ替わること。アニメーション付き
2. **スカウトFA**: 全候補が履歴書カードで表示され、ページ送りが動作すること
3. **知名度不足**: 契約不可の候補がグレー+スタンプで末尾表示されること
4. **レンタル候補**: 8枚が一画面に収まり、金額ソートが動作すること
5. **レンタル壁ミニ**: 契約中レンタルが壁に表示され、レンタルタブのみで出現すること
6. **ドラフト導線**: ドラフト開催週にスカウトタブが自動選択され、「⚖ ドラフトへ」が機能すること
7. **ドラフト会場**: scoutEvent 画面が従来通り動作すること（新聞・交渉・結果）
8. **オフシーズン**: 決裁タブ空・スカウト閲覧可能（契約不可）・レンタル不可が正しく表示されること
9. **トップバー**: スカウトタブが消えて10個になっていること
10. **FA契約フロー**: スカウトタブからFAの契約交渉が従来通り動作すること
11. **レンタル契約フロー**: レンタルタブからレンタル契約が従来通り動作すること
12. **HUD出し分け**: タブごとにHUD右側の表示が切り替わること
13. **auto-sim**: 100シーズン(seed=42) ALL CLEAR

---

## 完了条件

- [ ] 社長室に内部タブ（決裁/スカウト/レンタル）が機能する
- [ ] スカウト: 3列履歴書カード + ページ送り + 知名度不足表示
- [ ] レンタル: 4×2小型カード + 金額ソート + 壁ミニカード
- [ ] ドラフト: 社長室スカウトタブから scoutEvent へ遷移可能
- [ ] トップバーからスカウト削除
- [ ] オフシーズン対応
- [ ] auto-sim 100シーズン ALL CLEAR
- [ ] 既存のFA契約・レンタル契約・ドラフトフローが壊れていない
