# 画面：派閥イベント結果モーダル

**ファイル**：`docs/ui/03-screens/faction-event-result.md`
**最終更新**：2026-05-01 / v0.1
**実装状況**：DRAFT（未着手・Keisuke レビュー待ち）
**親仕様**：`docs/ui/03-screens/faction-events.md`（入口モーダル群）

---

## 0. このドキュメントのスコープ

派閥イベント F01〜F08 の **選択結果ナレーション表示** を担う共通モーダル。現状は [src/ui-common.js:7917](src/ui-common.js:7917) `showFactionEventResult` が「黒枠 + 🎭 結果見出し + 短文 + 閉じるボタン」だけの簡素なポップアップで、入口モーダル（応接室型・対峙型・追悼型）の演出格と全く釣り合っていない。

### 現状の問題

- F01〜F08 の入口モーダルは Office Cream Panel や Stage 純黒 P7 Theatrical で重厚に演出されている
- 一方、その結末を見せる結果モーダルは [ui-common.js:7917](src/ui-common.js:7917) `_factionModalBox` のフォールバックスタイル（care-box 汎用）で済まされている
- 結果として、社長が決断した直後の「余韻」を演出する場面が **データ通知トーストと変わらない見た目** になっている
- 13 箇所すべて（F01/F02/F02_PEACE/F02_IGNITE/F02_RESOLUTION/F02_ENDLESS/F03/F04/F05H/F05/F06/F07/F08）で同じ簡素表示が使われている

### この差し替えの目的

派閥イベントの **「決断の余韻を見せる」** ステップを、入口モーダルと同じ演出格の小サイズ cinematic に引き上げる。「キャラクターの人生を覗き見る」ゲームの魂を、決断の直後の沈黙にも適用する。

---

## 基本属性

| 項目 | 値 |
|---|---|
| 所属カテゴリ | **入口に追従**（F01/F04/F06/F07/F08: Office、F02/F03/F05/F05H: Stage） |
| パネル様式 | Office: Cream Panel（紙の通達）／ Stage: なし（純黒オーバーレイ） |
| レイアウトパターン | 小モーダル（A-4派生）／ Stage 系は P7 Theatrical の縮小版 |
| 所属シーケンス | シネマティック・イベント（faction-events.md と同枠） |
| 使用フォント | Noto Sans JP（本文）+ Bebas Neue（イベントID）+ Oswald（メタラベル） |
| 実装ファイル | `src/ui-common.js` `showFactionEventResult`（改修）、`src/index.html` 新規CSS |

---

## 目的

派閥リーダー／関係者の **決断直後の表情・沈黙・空気の変化** をひと呼吸見せる。

- 入口モーダルが「対峙」だとすれば、結果モーダルは **「対峙の後の静寂」**
- 4〜6 秒で読み終わる短いナレーション、可能ならキャラ立ち絵 or アイコンを 1 点添える
- 数値の変化を **副次的に小さく** 見せる（プレイヤー向け表記で：「リーダー信頼 -10／非メンバー信頼 +3」等）。プレイヤー向け表記なので内部変数名は使わない（feedback_player_text_no_internal_tokens 準拠）

---

## 遷移

- **入ってくる経路**：F01〜F08 の入口モーダルで選択肢ボタンを押した直後／通知のみイベントの「見届ける」ボタン押下後
- **出ていく経路**：「閉じる」ボタン押下 → 元画面（多くは「今週」画面）に復帰
- **戻る挙動**：戻るボタンなし。閉じるのみ。ESC で即閉じ可

---

## 骨格ワイヤーフレーム

### Office 系（F01/F04/F06/F07/F08）

```
┌─ Modal Backdrop (rgba(0,0,0,.55), blur 6px) ──────────────────┐
│                                                                │
│   ┌─ Cream Panel (max-width 520px, R-LG) ──────────────────┐  │
│   │                                                         │  │
│   │   ┌─ Header strip (event accent, 6px height) ────────┐ │  │
│   │                                                         │  │
│   │   F07 · リーダーの要求       [WEEK 19 · 9Y]           │  │
│   │   ─────────────────────                               │  │
│   │                                                         │  │
│   │   ┌─Char─┐                                            │  │
│   │   │ 立絵 │  大久保桃子                                │  │
│   │   │ 88px │  ※静止画、表情1つ                          │  │
│   │   └──────┘                                            │  │
│   │                                                         │  │
│   │   「あんたが下した決断、覚えておくよ」                 │  │
│   │   （リーダーのリアクション・短セリフ）                 │  │
│   │                                                         │  │
│   │   ┌─Narration band (cream panel, slight inset) ───┐  │  │
│   │   │ 大久保桃子に正面から釘を刺した。一瞬の沈黙、 │  │  │
│   │   │ それから硬い返事。空気は張り詰めた。         │  │  │
│   │   └────────────────────────────────────────────┘  │  │
│   │                                                         │  │
│   │   ┌─Impact summary (subtle, opacity .8) ─────────┐  │  │
│   │   │ リーダー信頼 -10  ／  非メンバー信頼 +3      │  │  │
│   │   └────────────────────────────────────────────┘  │  │
│   │                                                         │  │
│   │              [  閉じる  ]                              │  │
│   └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Stage 系（F02/F03/F05/F05H）

純黒背景に縦組みでセンター配置。立ち絵は使わず、テキストとイベントアイコンのみ。フェードイン 600ms / フェードアウト 400ms。BGM は入口の余韻を引きずる。

```
                 ┌──────────────────────────────┐
                 │                              │
                 │       F02 · 抗争 — 決着       │  (gold serif)
                 │       ─────────────          │
                 │                              │
                 │   宇田川派と三浦派の抗争は    │
                 │   対等な和解に至った。       │
                 │   控室の空気が、ようやく     │
                 │   緩んでいく。                │
                 │                              │
                 │            [ 閉じる ]         │
                 └──────────────────────────────┘
```

---

## 構成要素（使用コンポーネント）

### 共通

- **EventBadge**：イベントID（F07 等）+ 日本語サブタイトル + WEEK/Y メタ
- **NarrationBand**：結果ナレーション本文。Office 系は cream inset、Stage 系は純黒中央
- **ImpactSummary**：trust 増減などの副次表示。プレイヤー向け表記（「リーダー信頼」「ロッカー士気」等）
- **CloseButton**：「閉じる」単独。ESC でも閉じられる

### Office 系のみ

- **CharacterPortrait**：立ち絵 88×88、静止画 1 枚、表情は中立 or 軽い驚き／落胆
- **CharacterReaction**：キャラクターの短い反応セリフ（30 字以内）。テンプレ表現禁止（CLAUDE.md 鉄則）

新規 CSS が必要：

- `.fevt-result-modal`（Office cream panel ベース）
- `.fevt-result-stage`（Stage 純黒オーバーレイ）
- `.fevt-result-header-strip`（イベント色アクセント）
- `.fevt-result-narration`（ナレーション帯）
- `.fevt-result-impact`（副次サマリ）

---

## 情報階層（視線誘導の優先順位）

1. キャラクター立ち絵 / イベントアイコン（最優先、最大）
2. リーダーの短い反応セリフ（Office 系のみ）
3. 結果ナレーション本文
4. Impact summary（trust 等の数値変化、副次的）
5. 閉じるボタン

---

## 特有ルール

- **Office 系：入口モーダルの背景・パネル位置を継承**してフェードクロス（背景色は維持、パネル中身だけ差し替え）
- **Stage 系：入口の暗転を維持**し、ナレーションだけ差し替えてフェード
- 結果文の表示はタイプライタ風ではなく **一気に表示**（入口の対峙シーンほどの長さがないため）
- BGM はフェードアウトせず、入口のループを引き継いで結果モーダル中も継続。閉じた瞬間にフェードアウト
- ESC または「閉じる」押下で即フェードアウト 300ms
- **結果ナレーションが長文（80字超）の場合**、ナレーションだけタイプライタ表示にしてもよい（要 demand 別判定）
- ImpactSummary は **数字を出すべきでないイベント**（F02_PEACE 等の通知系）では非表示

---

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| 通常（決断あり） | キャラ立ち絵 + 反応セリフ + ナレーション + impact summary |
| 通知のみ（F02系・F04・F05H） | キャラ立ち絵なし or 派閥アイコンのみ + ナレーションのみ（impact なし） |
| Stage 系（F02/F03/F05） | 純黒 + ナレーションセンター配置 |

---

## API（共通関数の改修）

### 現行

```js
showFactionEventResult(resultText, onClose)
```

### 新シグネチャ

```js
showFactionEventResult({
  eventId,        // 'F07' 等。必須。ヘッダー帯／カテゴリ自動判定に使う
  category,       // 'office' | 'stage'。省略時は eventId からデフォルト推論
  resultText,     // 必須。ナレーション本文
  charId,         // Office 系の立ち絵キャラID（省略可）
  charLine,       // 立ち絵キャラの反応セリフ（省略可、charId とセット）
  impactSummary,  // [{label: 'リーダー信頼', delta: -10}, ...] 表示順で配列（省略可）
  weekLabel,      // 'WEEK 19 · 9Y' 等のメタラベル（省略時は state から自動生成）
}, onClose)
```

### 後方互換

引数が文字列だった場合は従来通り `resultText` だけ受け取った扱いにする：

```js
if (typeof opts === 'string') opts = { resultText: opts };
```

これにより 13 箇所の呼び出し元を **段階移行** できる。Phase 1 で関数本体だけ刷新、Phase 2 で呼び出し元を順次新シグネチャに移行。

---

## 改修計画（呼び出し元 13 箇所）

すべて [src/app.js](src/app.js) の factionEventHandler 内。優先順位は F07 → F08 → F01 → F04 → F06 → F02 系 → F03 → F05 系。

| 行 | イベント | 優先 | 新シグネチャ移行時の必要情報 |
|---|---|---|---|
| 8637 | F07 | 1 | leaderId, leaderLine, impactSummary（要求別の trust 変化） |
| 8649 | F08 | 2 | leaderAId/leaderBId（両派閥）、impactSummary |
| 8459 | F01 | 3 | leaderId, charLine, impactSummary |
| 8578 | F04 | 4 | targetId（移籍した本人）、charLine 不可（既成事実型） |
| 8625 | F06 | 5 | leaderAId/leaderBId、impactSummary |
| 8483 | F02 | 6 | leaderAId/leaderBId、Stage 系 |
| 8495 | F02_PEACE | 6 | impactSummary なし、Stage 系 |
| 8507 | F02_IGNITE | 6 | impactSummary なし、Stage 系 |
| 8530 | F02_RESOLUTION | 6 | impactSummary なし、Stage 系 |
| 8542 | F02_ENDLESS | 6 | impactSummary なし、Stage 系 |
| 8566 | F03 | 7 | Stage 系（追悼）、impactSummary なし |
| 8589 | F05H | 7 | Stage 系、impactSummary なし |
| 8613 | F05 | 7 | Stage 系、impactSummary なし |

---

## 関連トークン

- `--office-bg`
- `--office-panel-cream`
- `--office-border-cream`
- `--stage-bg-pure-black`
- `--space-md`, `--space-lg`, `--space-xl`
- `--radius-lg`
- `--t-headline`, `--t-narration`, `--t-meta`
- `--accent-faction-{F01..F08}` ※新規。各イベントのヘッダー帯色を Foundations に追加要

---

## 階層1・2への参照

- 階層1：Office Cream Panel（紙の通達メタファー）／ Stage 純黒（Theatrical 残響）
- 階層2：シネマティック・イベント新カテゴリ（faction-events.md で起案済み、入口と結果のペア）の **結果側**

---

## 状態バリエーションの表現指針

「数値は嘘をつかない」哲学（CLAUDE.md）に従い、impact summary は **必ず実際にエンジンが適用した数値の動きと一致** させる。デモ用の偽値を出さない。

「鮮烈に見せる」（CLAUDE.md）に従い、結果文・反応セリフはテンプレ化を避ける。F07 demand 別の文言テーブル（`F07_RESULT_TEXTS[demandId][choice]`）と組み合わせて、同じ choice でも 2〜3 文ローテで毎回少し違う表現になるようにする。

---

## 未決事項

- Office 系のキャラ立ち絵：表情差分を作るか、中立 1 枚のみで済ますか
- Stage 系の追悼系（F03）に派閥エンブレム差し込みを入れるか
- ImpactSummary の表示形式は横並びか縦並びか
- BGM 引き継ぎの音量カーブ（入口とのクロスフェード）
- 既存 `showFactionEventResult` シグネチャ拡張の段階移行を 1PR でやるか分割か
