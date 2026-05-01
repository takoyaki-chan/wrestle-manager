# 画面：派閥（データベース 🎭 派閥サブタブ）

**ファイル**：`docs/ui/03-screens/factions.md`
**最終更新**：2026-05-01
**実装状況**：未着手（Phase A' Mockup 確定 / Phase B 実装スコープ）
**Mockup**：`docs/ui/mockups/mockup-faction-screen-v0.9.html`

---

## 基本属性

| 項目 | 値 |
|---|---|
| 所属カテゴリ | Office |
| パネル様式 | Dark Panel ベース（カード単位の局所ダーク。Cream Panel は使わない） |
| レイアウトパターン | P1 Catalog 派生（抗争ペアセクション + 中立派閥グリッド） |
| 所属シーケンス | なし |
| 使用フォント | Noto Sans JP（本文）+ Bebas Neue（OVR/PT/週数）+ Oswald（ラベル UPPERCASE） |
| 実装ファイル | `src/ui-render.js` `_renderDbFactions()` ／関連: `src/factions.js` `Engine.factions.*` |

---

## 目的

団体内に存在する全派閥の状態を一望し、抗争中の派閥を物語の主役として浮かび上がらせる画面。
Phase B で導入される **抗争ポイント制** を可視化する主舞台であり、「いまどの派閥が誰と争っていて、どちらが流れを掴んでいるか」が一目でわかること。
派閥はただの名簿ではなく、**派閥単位の物語装置**として黒田ナレーション付きで提示される。

---

## 遷移

- **入ってくる経路**:
  - ナビバー「データベース」→ サブタブ「🎭 派閥」
  - `openFactionPanel(factionId)` 呼び出し（新聞・ティッカー等から）→ 派閥タブを開いて該当カードをハイライト1.5秒
- **出ていく経路**:
  - リーダー/2ND/3RD/RANK&FILE 画像クリック → `showFighterPopup(id)` 選手詳細
  - HISTORY ボタン展開 → タイムライン下方表示（モーダルではなく同画面内）
  - タイムラインマーカークリック → 該当試合 or 派閥イベントモーダル再表示
- **戻る挙動**:
  - サブタブの切替えで離脱、戻るボタンは持たない

---

## 骨格ワイヤーフレーム

```
┌─ Top Bar (Office dark, 44px) ───────────────────────────┐
├─ Nav Bar (Office dark, 34px) ───────────────────────────┤
├─ DB Sub-Tabs ───────────────────────────────────────────┤
│  全選手 │ 全コーチ │ 相関図 │ 団体比較 │ [🎭 派閥] │ 新聞 │ 殿堂 │ 年代記
├─ Section: FACTION OVERVIEW (5) ─────────────────────────┤
│                                                          │
│ ⚔ 抗争中 — 紅蓮組 ╳ 蒼天会 (W48)                        │
│ ┌──────────────┐ ┌──VS─┐ ┌──────────────┐               │
│ │ Hero(紅蓮)   │ │WK48 │ │ Hero(蒼天)   │               │
│ │ pt bar→ 47PT │ │GOAL │ │ 32PT ←pt bar │               │
│ │ 2ND row(対比)│ │ 100 │ │ 2ND row(対比)│               │
│ │ 3RD row(対比)│ │spine│ │ 3RD row(対比)│               │
│ │ RANK&FILE 🎴│ │HIST │ │ RANK&FILE 🎴│               │
│ │ CHRONICLE   │ │  ▼  │ │ CHRONICLE   │               │
│ │ stats / foot│ │     │ │ stats / foot│               │
│ └──────────────┘ └─────┘ └──────────────┘               │
│   ▼ HISTORY 展開時:                                      │
│   [Timeline 横帯: F02—match—F08-A—match—match—now]      │
│                                                          │
│ ⛺ 平和な派閥 — 3 FACTIONS                              │
│ ┌──────┐ ┌──────┐ ┌──────┐                              │
│ │ Hero │ │ Hero │ │ Hero │  3列グリッド                 │
│ │ 2ND  │ │ 2ND  │ │ 2ND  │                              │
│ │ 🎴🎴 │ │ 🎴   │ │ 🎴   │                              │
│ │stats │ │stats │ │stats │                              │
│ │foot  │ │foot  │ │foot  │                              │
│ └──────┘ └──────┘ └──────┘                              │
└──────────────────────────────────────────────────────────┘
```

詳細レイアウトは `docs/ui/mockups/mockup-faction-screen-v0.9.html` を正本として参照。

---

## 構成要素（使用コンポーネント）

### 抗争ペアセクション

- **FeudDuelGrid**（新規）— `1fr | 96px(VS軸) | 1fr` グリッド
  - 内包: 左 FactionCard / 中央 FeudAxis / 右 FactionCard
- **FeudAxis**（新規・96px幅・縦長）
  - VS ブロック (Bebas Neue 52px, 真紅+blood glow) / WEEK表示
  - GOAL ブロック (`100` + 「先取で決着」)
  - Spine (縦の血の線、グラデーション+box-shadow)
  - HISTORY トグル (クリックで下方の Timeline 展開)
- **Timeline**（HISTORY 展開時のみ）
  - 横帯マーカー: F02 / Match / F08-A / F09 / now
  - マーカー色分け: F02=warn, Match=cream-gold, F08=hostility, F09=hostility-deep, now=hostility

### FactionCard（抗争中・大判）

縦並び構造（上→下）:
1. **Hero ブロック** — リーダー画像(78×96) + 派閥名(22px大文字) + リーダー名 + OVR/POP + 派閥タイプタグ
2. **RIVALRY POINTS ブロック**（抗争中のみ） — ラベル + 横バー + ptテキスト
3. **2ND / 3RD 行**（対比配置） — 中央軸側に portrait(44×54)、中央に stats(OVR大+POP)、外側に名前+sub-info
4. **RANK & FILE タイル群** — 画像タイル(50×64) + 右下OVRオーバーレイ。能力値詳細は省略
5. **FACTION CHRONICLE** — 黒田ナレーション 2〜3段落（キャラ台詞なし、設立週・要選手・勝敗状況をテンプレ生成）
6. **Stats グリッド**（2列） — 平均OVR / 設立 / 勝率 / 直対戦績
7. **Foot** — 結束/勢い/対立相手のメーター帯

### FactionCard（中立・小判 / 3列グリッド）

抗争中カードと同構造、ただし:
- Hero リーダー画像 60×72 / 派閥名 17px
- RIVALRY POINTS ブロックなし
- 2ND 1行のみ
- FACTION CHRONICLE なし（または短縮版）
- Stats グリッド 1列、平均OVR + 設立のみ
- Foot に直近イベント1行

---

## 情報階層（視線誘導の優先順位）

**抗争ペアセクション内**:
1. **中央 VS 軸**（GOAL 100 / VS 大タイポ / 血の spine）— 最初に視線を引く
2. **両派閥のリーダー画像 + 派閥名タイポ**（Bebas 22px + glow）
3. **RIVALRY POINTS バーと PT 数値**（pt差で「いまどっちが優勢か」即時把握）
4. 2ND/3RD の OVR/POP（対比可能な中央寄せ）
5. RANK & FILE タイル群（情報密度低、スクロール可）
6. FACTION CHRONICLE 黒田ナレーション
7. Stats / Foot

**画面全体**:
1. 抗争中ペア（最も濃い物語）
2. 平和な派閥（控えめ）

---

## 特有ルール

### レイアウト
- 抗争中ペアは **1組のみ** の前提（Phase B 仕様。同時抗争は1組）
- 抗争中ペアが0件の場合、抗争中セクションごと非表示。「現在抗争はありません」のプレースホルダ等は出さない
- 派閥が0件の場合、現行 v0.6 のプレースホルダを踏襲（🎭+説明文）
- 中立派閥が4個以上の場合、3列グリッドが下に積み上がる（折り返し）

### 対比配置
- 抗争ペアの左カードは **完全ミラー**: Hero/Roster/Stats/Foot すべて右寄せ、portrait は中央軸側を向く
- pt バーは中央軸に向かって伸びる: 左カード=右端起点で左へ、右カード=左端起点で右へ
- 2ND/3RD 行: portrait を中央軸側に置き、stats を中央寄り、外側に name

### 状態
- 抗争中カードは `border-top: 4px solid var(--accent-hostility)` + `inset glow rgba(196,98,58,0.05)`
- 抗争中カードは右上(右側)/左上(左側)に「🔥 抗争中」フラグ
- F09 接近条件成立時(両方向 hostility ≥ 65 等) は VS軸の WEEK 表示横に「F09 接近中」バッジ追加

### インタラクション
- カード hover: `translateY(-2px)` + `box-shadow` 強化
- HISTORY トグル: クリックで Timeline を arena 全幅で下方展開（アコーディオン式・モーダルではない）
- タイムラインマーカー hover: dot scale(1.25) ＋ ツールチップで詳細表示
- RANK & FILE タイル hover: opacity↑ + クリックで `showFighterPopup(id)`
- 中立カードクリック: `openFactionPanel(factionId)` で詳細パネル展開（既存実装流用）

### Phase B 接続点
- RIVALRY POINTS バーの値は `G.factionRivalryPoints[pairKey].pointsA/B` を参照
- 中央軸 GOAL 値は `FACTION_CONFIG.pointsResolutionThreshold`（既定 100）
- HISTORY タイムラインは `G.factionTimeline[factionId]` + 該当抗争の試合履歴を時系列ソート
- F09 接近バッジは hostility 両方向 ≥ 65 で点灯
- pt バーは値変動時に 300ms ease-out アニメ（ただし画面遷移時の1回のみ、毎フレーム再描画はしない）

### FACTION CHRONICLE 生成戦略
- **キャラ台詞は使わない**（性格×アーキタイプで膨張するため管理コスト過大）
- **黒田ナレーション**: 派閥状態（設立週・要選手・勝敗状況・抗争状態）からテンプレ生成
- テンプレ例:
  - `第{Y}年 W{w}、{leaderName}を頂点に結束。{flavor}を掲げる新興派閥として台頭、結成{n}週で{rivalName}と抗争状態へ突入した。`
  - `要は若手の {keyMemberName}。直対 {wins}勝{losses}敗 と勝ち越し{trend}、{factionName}の象徴的選手に成長中。`
- パターン数: 5〜10セット程度、派閥状態スロットを埋める形で量産

---

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| 通常（抗争1組+中立N） | 上記レイアウト |
| 抗争なし（中立のみ） | 抗争中セクション非表示、平和な派閥セクションのみ表示 |
| 派閥なし | 「現在、派閥は存在しません」プレースホルダ（🎭 + 説明文、現行 `_renderDbFactions` のものを流用） |
| 1派閥のみ | 平和な派閥セクションに1カードだけ表示（3列グリッドで左寄せ） |
| F09 接近 | 中央軸 WEEK 表示横に「F09 接近中」バッジ点灯（背景: warn） |
| 強制和解直前 | 表示変更なし。Phase B での「強制和解 残○週」表示は本仕様では出さない（決まっていると思われる印象を避けるため） |

---

## 関連トークン

### 既存トークン（Office）
- `--office-bg` `--office-panel-dark` `--office-panel-dark-deep`
- `--office-text-on-dark-main` `--office-text-on-dark-sub` `--office-text-on-dark-dim`
- `--office-border-cream` `--office-border-cream-strong`
- `--gold` `--gold-light` `--cream-gold` `--cream-gold-dark`

### 抗争系（既存・本画面でも継続使用）
- `--accent-hostility` `--accent-hostility-deep` `--accent-blood`
- `--accent-bond` `--accent-warn`

### 派閥識別色（既存・派閥ID順循環）
- `--accent-faction-1` `--accent-faction-2` `--accent-faction-3` `--accent-faction-4`

### 新規追加が必要なトークン
- **`--pop-pink`** = `#d4538a` — 人気値の表示色（★人気数値、Bebas Neue）
- **`--pop-pink-light`** = `#f0a0bf` — 人気★アイコンの薄色版
  - 既存変数に POP/人気を表す色がないため新設。Foundations §1-8 アクセントカラー表に追記する

### Phase B 接続予定の data 値
- `G.factionRivalryPoints[pairKey].pointsA/B` — pt バー値
- `FACTION_CONFIG.pointsResolutionThreshold` — GOAL 100
- `G.factionTimeline[factionId]` — Timeline マーカーソース
- `Engine.factions.getKeyMember(faction)` — FACTION CHRONICLE の「要選手」抽出

---

## 階層1・2への参照

- **階層1**: Office カテゴリ。Cream Panel は使わず、Dark Panel ベースで派閥カードを構成（試合中の Stage ではないが、抗争中の血みどろ感を局所ダークで表現）
- **階層1**: ハードコード16進カラー禁止 → 既存トークン + 新規 `--pop-pink` `--pop-pink-light` のみで構成
- **階層2 P1 Catalog 派生**: 「フィルタなし + コンテンツエリアは抗争中ペア + カードグリッド」の変則。Catalog の「並べ方を画面ごとに選べる」ルールを適用し、抗争セクション + グリッドの2層構造を採る
- **階層2 A-3 ナビバー / DB サブタブ**: 既存の `_dbSubTab=7` 派閥サブタブとして既に実装済み

---

## 実装段取り（Phase B スコープ）

1. `--pop-pink` `--pop-pink-light` トークンを `src/index.html` の :root に追加し、`docs/ui/01-foundations.md` §1-8 にも追記
2. `src/ui-render.js` `_renderDbFactions()` を v0.9 構造に丸ごと書き換え
3. `_renderDbFactions` から呼ばれるサブ関数を分離:
   - `_renderFeudDuel(state, feudPair)` — 抗争ペアグリッド
   - `_renderFactionCard(state, faction, opts)` — 派閥カード本体（in-feud / left-right / 中立 で分岐）
   - `_renderFeudAxis(state, feudPair)` — 中央VS軸
   - `_renderFactionChronicle(state, faction, feudPair)` — 黒田ナレーション生成（テンプレ駆動）
   - `_renderFeudTimeline(state, feudPair)` — HISTORY 展開時のタイムライン
4. CSS は `src/index.html` の `<style>` ブロック内に新規セクション `/* === Faction Tab v0.9 === */` で集約追加
5. Phase B の `factionRivalryPoints` データモデル実装と並行して進行、データ未配置時は pt=0 / GOAL=100 のプレースホルダ表示
6. 実装後、本仕様書の「実装状況」を「完了」に更新

---

## 未決事項

- 黒田ナレーションのテンプレパターン本数（最低5、推奨10）— Phase B 着手時に確定
- F09 接近中バッジの hostility 閾値（≥65 仮置き）— Phase B 仕様で確定
- HISTORY タイムラインの最大表示マーカー数（直近6件 or 全件横スクロール）— 実装時に判断
- 中立派閥のクリック挙動: 既存 `openFactionPanel` 流用 vs 新規詳細パネル設計（Phase B で詰める）
- RANK & FILE タイルの最大表示数（4個まで横並び、それ以上は「+N」スタブ）— 実装時に判断
- ペア進行度の決着間際（pt ≥ 90 等）の演出強化案 — Phase B で別途検討
