# 通知2層化リデザイン仕様書 v1.0

## 概要

現行の通知システムでは、スポーツ新聞・スナップショット通知・Glimpse（心の垣間見え）がすべて同一形式のモーダルダイアログとして表示され、以下の問題が発生している：

1. **重なり問題** — 複数モーダルが同タイミングで発火し、newspaperOverlay と notifModalOverlay が視覚的に重なる
2. **誰→誰かわからない** — 心情変化の主語と対象が不明確
3. **数が多すぎる** — Glimpse A層＋B層がすべてOKクリック必須のモーダルで表示され、テンポが悪化

### 設計方針

通知を **2層（Tier）** に分離する。重要な演出はリッチモーダルで印象深く見せ、日常的な心の声はバナーエリアのログフィードとして「そこに生きている感」を演出する。キャラクターの声は消さず、**見せ方の格** を変える。

---

## §1 Tier 1: リッチモーダル（厳選・割り込み）

### §1.1 対象

現行のモーダル表示対象のうち、以下のみ Tier 1 に残す：

| ソース | 条件 | 既存の表示関数 |
|--------|------|----------------|
| Glimpse A層 | tone が `gold`, `danger`, `dramatic` のもの | `showGlimpseAModal` |
| notifEvent | N5, N_isolation, N_coach_report, N_sudden_departure | `showNotifEventToast` |
| R3モーダル | bond 75+離脱時 | `showR3Modal` |
| 大型イベント | B1〜B4 | `App.handleLargeEvent` |
| 選択型イベント | S/E型 | `showChoiceEventModal` |
| 引退 | 全件 | `showRetirementPopups` |
| 成長イベント | 覚醒・スランプ等 | `showGrowthEventPopups` |

**Glimpse A層の Tier 1 対象（tone別）：**

| threshold id | axis | tone | Tier |
|---|---|---|---|
| bond_80_up | bond | gold | **Tier 1** |
| rivalry_50_up | rivalry | dramatic | **Tier 1** |
| rivalry_70_up | rivalry | gold | **Tier 1** |
| trust_below_20 | trust | danger | **Tier 1** |
| bond_60_up | bond | positive | Tier 2 |
| bond_59_down | bond | negative | Tier 2 |
| bond_39_down | bond | negative | Tier 2 |
| rivalry_30_up | rivalry | dramatic | Tier 2（序盤の因縁、ログフィードで十分） |
| rivalry_29_down | rivalry | calm | Tier 2 |
| trust_below_35 | trust | warning | Tier 2 |
| trust_above_75 | trust | positive | Tier 2 |

→ Tier 1 に残るのは **gold / danger** の3種 + **rivalry_50_up (dramatic)** の計4種。週あたり **0〜1件** 程度に収まる想定。

**Glimpse B層** はすべて Tier 2 へ移行。

### §1.2 表示の改善（誰→誰 問題の解決）

Tier 1 モーダル（GlimpseA）の二人表示時に、**矢印と名前ラベル**を追加する。

現行:
```
[顔A] ⚡ [顔B]
 名前A      名前B
```

改善後:
```
[顔A] ⚡ [顔B]
 名前A  →  名前B
```

- `speakerName` が左（心情の主体）、`targetName` が右（対象）
- 間の記号は軸に応じて変更: bond=💙/💔、rivalry=⚡、trust=（一人表示なので該当なし）
- 名前の間に `→` を挿入し、方向性を明示

**実装箇所**: `_renderGlimpseA()` の portraits 下部の名前表示を修正。

```javascript
// 変更前
<span style="font-size:13px;color:var(--text-sub)">${glimpse.speakerName}</span>
<span style="font-size:13px;color:var(--text-sub)">${glimpse.targetName}</span>

// 変更後
<span style="font-size:13px;color:var(--text-sub)">${glimpse.speakerName}</span>
<span style="font-size:13px;color:var(--text-dim)">→</span>
<span style="font-size:13px;color:var(--text-sub)">${glimpse.targetName}</span>
```

### §1.3 表示タイミングの直列化

既存の問題: 複数モーダル系通知が setTimeout のタイミング差だけで制御されており、重なりが発生しうる。

**改善**: Tier 1 通知を **統合キューで直列管理** する。

```
[newspaper] → (close後) → [notifEvent] → (close後) → [Tier1 Glimpse] → ...
```

- 既存の `_glimpseQueue` を拡張し、Tier 1 の全モーダル通知をキューイングする
- 各モーダルの close 時に次のキューアイテムを dequeue して表示
- newspaper は独立 overlay だが、`onDone` コールバックでキューに接続

---

## §2 Tier 2: バナーログフィード（日常の声）

### §2.1 対象

| ソース | 内容 |
|--------|------|
| Glimpse A層 | tone が `positive`, `negative`, `warning`, `calm` のもの（§1.1 の Tier 2 行） |
| Glimpse B層 | GL-01〜GL-10 全種（試合後の感情、練習中のひとこと、信頼の揺れ、仲間への想い、ライバルへの意識、不出場の鬱憤、コンディション不良、連敗のストレス、連勝の自信、怪我中の焦り） |
| 絶好調終了 | `hotstreak_end`（B層 guaranteed） |

### §2.2 バナーUI設計

**配置**: `dojo-header` バナー内、右下エリア。既存の `dojo-scene-fighters`（練習中の選手アイコン群）の**右端**に、ログフィード専用スロットを追加。

```
┌──────────────────────────────────────────────┐
│  [dojo-header-img]                           │
│                                              │
│  [コーチ吹き出し]     [選手A][選手B] [📋]    │
│   (左下)               (中央)    (右端)      │
└──────────────────────────────────────────────┘
                                     ↑
                            ログフィードアイコン
```

**ログフィードアイコン（📋）**:
- バナー右下に配置される小さなアイコン（32×32px）
- 未読ログがある場合、アイコン右上に赤バッジ（未読件数）を表示
- アイコンの上に、最新のログ1件が吹き出しで自動表示される

### §2.3 吹き出しローテーション表示

週送り完了後、Tier 2 に振り分けられたログが吹き出しとしてローテーション表示される。

- **表示位置**: ログフィードアイコンの上方に吹き出し
- **表示内容**: `[顔アイコン24px] セリフ（→対象名）`
  - 対象がいる場合: `「まだまだ負けない…」→ 白銀麗子`
  - 対象がいない場合: `「身体が重い…練習キツい…」`
- **ローテーション**: 5秒間隔でフェードイン→フェードアウト→次のログ
- **最大ローテーション数**: キューに溜まった全件（通常1〜5件程度）を1巡したら最新1件を固定表示
- **掛け声との共存**: 掛け声（`.dojo-scene-shout`）はキャラの頭上に表示される個別アニメーション。ログフィード吹き出しはバナー右端の固定位置なので干渉しない

### §2.4 ログ一覧パネル

ログフィードアイコンをクリックすると、**今週のログ一覧パネル**が展開される。

**パネル仕様**:
- バナー下にドロップダウン的に展開（overlay ではない、インライン展開）
- 最大高さ: 300px（スクロール可）
- 各ログアイテムのレイアウト:

```
┌────────────────────────────────────────┐
│ [顔24px] 芝綾音 → 白銀麗子            │
│ 💙 打ち解けた様子                      │
│ 「不思議と気が合う。一緒にいて楽だ」   │
├────────────────────────────────────────┤
│ [顔24px] 宮ケ瀬千夏                   │
│ 😰 連敗のストレス                      │
│ 「なんで勝てないんだろう…」            │
├────────────────────────────────────────┤
│ [顔24px] 井澤遥                       │
│ 🏋️ 練習中のひとこと                    │
│ 「今日は調子いい…いける…！」           │
└────────────────────────────────────────┘
```

- **ヘッダ**: 「📋 今週の声（N件）」
- **空の場合**: 「今週は特に報告なし」
- **再クリックで閉じる**

### §2.5 ログアイテムのデータ構造

```javascript
// Tier 2 ログアイテム
{
  speakerId: number,       // 発言者のキャラID
  speakerName: string,     // 発言者名
  targetId: number | null, // 対象キャラID（ない場合null）
  targetName: string | null,
  label: string,           // ラベル（例: '打ち解けた様子', '連敗のストレス'）
  dialogue: string,        // セリフテキスト
  tone: string,            // positive / negative / calm / warning / dramatic
  axis: string | null,     // bond / rivalry / trust / null
  type: string,            // threshold id or GL-xx
  layer: string,           // 'A' or 'B'
}
```

### §2.6 状態管理

```javascript
// GameState に追加
G.weekLogFeed = [];  // 今週の Tier 2 ログ配列（週送り時にリセット）
```

- `tickWeek` → `checkALayer` / `checkBLayer` で生成された glimpses を tier 振り分け
- Tier 1 は既存の `_pendingGlimpseA` に格納（→ モーダル表示）
- Tier 2 は `_pendingLogFeed` に格納（→ UI側で `G.weekLogFeed` に追加）
- `weekLogFeed` は次の週送り時にクリアされる

---

## §3 振り分けロジック

### §3.1 app.js 側の変更

既存の Glimpse 表示フロー（3箇所）を修正:

```javascript
// 変更前（app.js L4616-4621 等）
if (pendingGlimpseA || pendingGlimpseB) {
  const glimpseDelay = ...;
  setTimeout(() => {
    if (pendingGlimpseA) pendingGlimpseA.forEach(g => showGlimpseAModal(g));
    if (pendingGlimpseB) pendingGlimpseB.forEach(g => showGlimpseBModal(g));
  }, glimpseDelay);
}

// 変更後
if (pendingGlimpseA || pendingGlimpseB) {
  const allGlimpses = [...(pendingGlimpseA || []), ...(pendingGlimpseB || [])];
  const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
  const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));

  // Tier 2 → ログフィードに追加
  if (tier2.length > 0) {
    G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
    refreshDojoLogFeed();  // バナーUI更新
  }

  // Tier 1 → モーダルキューに追加
  if (tier1.length > 0) {
    const glimpseDelay = ...;
    setTimeout(() => {
      tier1.forEach(g => showGlimpseAModal(g));
    }, glimpseDelay);
  }
}
```

### §3.2 振り分け判定関数

```javascript
function _isGlimpseTier1(glimpse) {
  // A層: gold / danger tone → Tier 1
  // rivalry_50_up (dramatic) → Tier 1
  // rivalry_30_up (dramatic) → Tier 2（序盤の因縁はログフィードで十分）
  if (glimpse.layer === 'A') {
    if (glimpse.tone === 'gold' || glimpse.tone === 'danger') return true;
    if (glimpse.type === 'rivalry_50_up') return true;
    return false;
  }
  // B層: すべて Tier 2（hotstreak_end 含む）
  return false;
}
```

### §3.3 変更箇所一覧

app.js 内で Glimpse を表示している**全4箇所**を修正:

1. **L4616-4621** — `processWeek` 後の Glimpse 表示
2. **L4282-4291** — `closeShowResult` 内の興行後 Glimpse 表示
3. **L5960-5967** — ケアアクション後の Glimpse 表示
4. **L6009-6016** — 同上（別分岐）

すべて同一パターンで tier 振り分けを適用する。

---

## §4 CSS / HTML 追加

### §4.1 バナーログフィードのHTML構造

```html
<!-- dojo-header 内、dojo-scene-fighters の後に追加 -->
<div class="dojo-log-feed">
  <div class="dojo-log-feed-icon" onclick="toggleLogFeedPanel()">
    📋
    <span class="dojo-log-feed-badge" style="display:none">0</span>
  </div>
  <div class="dojo-log-feed-bubble" style="display:none">
    <img class="dojo-log-feed-face" src="" alt="">
    <span class="dojo-log-feed-text"></span>
  </div>
</div>

<!-- バナー外（dojo-header 直後）にログ一覧パネル -->
<div class="log-feed-panel" style="display:none">
  <div class="log-feed-panel-header">📋 今週の声（0件）</div>
  <div class="log-feed-panel-list"></div>
</div>
```

### §4.2 CSS

```css
/* ログフィードアイコン — バナー右下 */
.dojo-log-feed {
  position: absolute;
  bottom: 8px;
  right: 10px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.dojo-log-feed-icon {
  width: 32px;
  height: 32px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  transition: background .2s;
}

.dojo-log-feed-icon:hover {
  background: rgba(0,0,0,0.7);
}

.dojo-log-feed-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e74c3c;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}

/* 吹き出しローテーション */
.dojo-log-feed-bubble {
  background: rgba(0,0,0,0.6);
  border-radius: 8px;
  padding: 4px 8px;
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
  max-width: 220px;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: logFeedFadeIn 0.4s ease;
  text-shadow: 0 1px 1px rgba(0,0,0,0.4);
}

.dojo-log-feed-face {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.dojo-log-feed-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes logFeedFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ログ一覧パネル */
.log-feed-panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.log-feed-panel-header {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.log-feed-panel-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-feed-item {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 12px;
}

.log-feed-item:last-child {
  border-bottom: none;
}

.log-feed-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.log-feed-item-face {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.log-feed-item-names {
  font-weight: 600;
  color: var(--text);
}

.log-feed-item-arrow {
  color: var(--text-dim);
  font-size: 11px;
}

.log-feed-item-label {
  font-size: 11px;
  color: var(--text-dim);
  margin-bottom: 4px;
}

.log-feed-item-dialogue {
  color: var(--text-sub);
  font-style: italic;
}
```

---

## §5 週送りフロー全体の通知シーケンス

改善後のフロー（時系列）:

```
processWeek / closeShowResult
  │
  ├─ 怪我通知（showToast、即時）
  ├─ フレーバーイベント（showToast、短delay）
  ├─ 成長イベント（showGrowthEventPopups、delay）
  ├─ 突然の退団（showNotifEventToast、delay）   ← Tier 1 キュー
  ├─ 週次通知（showNotifEventToast、delay）      ← Tier 1 キュー
  ├─ チームスピリット（showNotifEventToast、delay）
  ├─ 選択型イベント（showChoiceEventModal、delay）
  ├─ 大型イベント（handleLargeEvent、delay）
  ├─ R3モーダル（showR3Modal、delay）
  │
  ├─ Glimpse振り分け:
  │   ├─ Tier 1 → モーダルキュー（delay後に1つずつ）
  │   └─ Tier 2 → G.weekLogFeed に追加 → バナーUI即時更新
  │
  ├─ ロスターキャップ通知
  ├─ 逸材チケット通知
  │
  ├─ 新聞パネル（_showNewsPanelIfNeeded、close後にcallback）
  ├─ マイルストーン
  └─ シーズンファンファーレ → refreshAll()
```

Tier 2 は **モーダルキューに入らない** ため、他の通知をブロックしない。プレイヤーは自分のペースでバナーの吹き出しやログパネルを確認できる。

---

## §6 weekLogFeed のライフサイクル

1. **生成**: `tickWeek` → `checkALayer` / `checkBLayer` → glimpses 生成
2. **振り分け**: app.js の表示フローで `_isGlimpseTier1()` 判定
3. **格納**: Tier 2 は `G.weekLogFeed` に push
4. **表示**: `refreshDojoLogFeed()` でバナーUI更新 + ローテーション開始
5. **クリア**: 次の `processWeek` 開始時に `G.weekLogFeed = []`
6. **永続化**: セーブデータに含める（ロード後も今週のログが見える）

---

## §7 実装順序

### Phase 1: 振り分けロジック + Tier 1 改善
1. `_isGlimpseTier1()` 関数追加
2. app.js の4箇所で tier 振り分け適用
3. Tier 1 モーダルの「誰→誰」矢印追加（`_renderGlimpseA` 修正）
4. `G.weekLogFeed` 配列の追加・週送り時クリア

### Phase 2: バナーログフィードUI
5. `dojo-header` 内にログフィードアイコン追加（`_renderDojoBanner` 修正）
6. CSS追加
7. 吹き出しローテーション表示ロジック
8. ログ一覧パネルのHTML/JS

### Phase 3: 統合テスト
9. 500シーズン auto-sim で Tier 1/2 の振り分け件数を検証
10. 手動プレイでUI動作確認（重なり・テンポ・視認性）

---

## §8 決定済み事項

1. **rivalry_30_up（因縁の始まり）** → **Tier 2（ログフィード）** に確定。序盤の因縁はモーダルほどの重さは不要。Tier 1 の dramatic は rivalry_50_up のみ。

2. **興行タブのバナー（arena-header）にもログフィード表示するか？**
   - → 初期は団体タブ（dojo-header）のみで実装し、様子を見る

3. **ログフィードの過去週参照**:
   - → 初期は今週分のみ保持。必要であれば後から `logFeedHistory[]` として蓄積可能

4. **B層 `hotstreak_end`（guaranteed）の Tier** → **Tier 2（ログフィード）** に確定。報告的な内容なのでモーダルは不要。
