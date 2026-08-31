# 序章 (Chronicle Prologue) 仕様書 v1.0

> **実装状況 (2026-05-02)**: Phase 1-5 全実装完了。Phase 1 = ミッションシステム撤去 (commit dd16a50)。Phase 2 = データ層 (`G.prologue` 初期 state、`Engine.prologue` モジュール、`completeDraft()` および `createInitialState(skipDraft=true)` での `Engine.prologue.create()` 呼び出し)。Phase 3 = ハイライト発火フック (`App.checkPrologueHighlights()` を tickWeek 後段 4 箇所で呼び出し、状態ベースで冪等)。Phase 4 = 引退時の founder 判定 + 序章確定 (同 `App.checkPrologueHighlights()` 内で `Engine.prologue.checkAndConfirm()` 実行)。Phase 5 = UI (年代記タブ idx=0 を序章に確保、`_renderPrologueBlock` 新規実装、VARIANT B レイアウト)。auto-sim 100シーズン × seed 42 で violation 0 / error 0 / game over 0。

## 1. 位置づけ

- 既存の団体年代記 (`specs/chronicle-system-spec-v0.1.md` 〜 `v0.2.md`) は「届かなかった世代の物語を残す」コンセプトで完成度が高い
- ただし最初のエース章 CH.1 の prime window が始まるまで(多くの場合 S1-S2)は記録されない
- 序章は「旗揚げ世代」を確定章とは別レイヤーで永久保存する場
- `Engine.chronicle` の章生成ロジックには一切手を入れない、純粋な追加実装として完結

## 2. 設計の核

- **序章は番号外** (`"序"` / `"Prologue"`)、確定章は CH.1 から始まる
- **エースを置かない** (VARIANT B 方式)。旗揚げ5人を等価に並べる
- **最後の旗揚げメンバーが引退した時点で確定する** (移籍・解雇・契約満了は閉じない)
- **Engine.prologue を独立モジュールとして追加**

## 3. データモデル

```js
G.prologue = {
  founderIds: number[],          // 旗揚げ5人のID (不変)
  startSeason: number,           // ドラフト/初期化完了時のシーズン
  startWeek: number,             // 同・週
  endSeason: number | null,      // 全旗揚げメンバー引退時のシーズン
  endWeek: number | null,        // 同・週
  status: 'empty' | 'in_progress' | 'confirmed',
  highlights: PrologueHighlight[],
  closing: string | null,        // 確定時に1度だけ生成して保存
}

PrologueHighlight = {
  id: string,                    // 重複防止用 ID
  season: number,
  week: number,
  tier: 'gold' | 'red' | 'silver' | 'normal',
  text: string,
}
```

## 4. ライフサイクル

### 4.1 生成 (`Engine.prologue.create(state)`)

- `completeDraft()` 完了時 (app.js)、または `createInitialState(seed, skipDraft=true)` 内で呼び出し
- `founderIds = state.roster.map(c => c.id)` (固定2人 + ドラフト3人 = 5人 / skipDraft 経路は preset roster)
- `startSeason / startWeek` を確定、`status: 'in_progress'`
- 初回ハイライト `org_founded` を即時記録

### 4.2 ハイライト発火 (`App.checkPrologueHighlights()`)

`tickWeek` 後段 4 箇所 (週次処理 / 興行決算 / オフシーズン / ジュニアトーナメント) から呼び出し。
状態ベースで冪等(同じ条件でも `addHighlight` 内の id 重複ガードでスキップ)。

| 種別 | id | 発火条件 | tier |
|---|---|---|---|
| 旗揚げ宣言 | `org_founded` | `Engine.prologue.create` 内で即時 | gold |
| 旗揚げ戦 | `first_show` | totalShows >= 1 | gold |
| 初代王座認定 | `first_title_setup` | titleEstablished | normal |
| 初代王座戴冠 | `first_title_winner` | titles.world.championId 確定 | red |
| 初の MQ50 | `first_mq50` | bestMQ 50+ | silver |
| 初の MQ70 | `first_mq70` | bestMQ 70+ | silver |
| 初の MQ80 | `first_mq80` | bestMQ 80+ | gold |
| 人気 25 到達 | `pop_25` | orgPop >= 25 | normal |
| 人気 50 到達 | `pop_50` | orgPop >= 50 | silver |
| 経営安定化 | `survival_clear` | survivalCleared | red |
| 旗揚げメンバー引退 | `founder_first_retire_${id}` | founder の `retired` 検出 | red |
| 全旗揚げメンバー引退 | `prologue_end` | confirm 時 | red |

### 4.3 終了 (`Engine.prologue.checkAndConfirm` / `Engine.prologue.confirm`)

- `App.checkPrologueHighlights` 末尾で毎週 `checkAndConfirm` を実行
- 全 `founderIds` が `Engine.prologue.founderState() === 'retired'` になった時点で `confirm` が走る
- `endSeason / endWeek` 確定 / 終結ハイライト追加 / closing 生成 / `status: 'confirmed'`

`Engine.prologue.founderState(state, id)`:
- `roster` に在籍 → `active`
- `retiredFighters` または `chronicle.fighterArchive` に存在 → `retired`
- それ以外 (移籍・解雇・契約満了) → `departed`

**移籍・解雇・契約満了では序章を閉じない**。これは「引退してこそ世代が終わる」という既存 `fighterArchive` の哲学と一貫させるため。
すべての旗揚げメンバーが他団体移籍だけで終わった場合は `status: 'in_progress'` のまま (既知の挙動 / v1.1 で保険ロジック検討)。

### 4.4 closing

- in_progress 中: 固定文「この世代の物語は、まだ始まったばかりだ。」(表示時)
- confirmed 後: 固定文 1 本「最後の旗揚げメンバーが去り、団体は次の世代へと託された。」を `prologue.closing` に保存
- v1.1 で実績パターン別バリエーション拡張を検討

## 5. UI 実装

### 5.1 配置

- データベース画面の「📖 年代記」サブタブ内に統合
- `_dbChronicleIdx === 0` で序章ブロック (`_renderPrologueBlock`) を表示、`>= 1` で既存確定章を表示
- 確定章ゼロかつ序章ありの初期表示は自動で `_dbChronicleIdx = 0` に遷移

### 5.2 レイアウト (VARIANT B / `docs/ui/mockups/chronicle-prologue-mockup-v0.1.html`)

1. **Subhead**: ◆ 団体年代記 ◆ / 団体名
2. **Timeline**: 先頭に "序" tic (current・dash 線スタイル / in_progress)、続けて確定章 CH.1, CH.2... の tic
3. **Header**: 「PROLOGUE」「旗揚げ — 最初の5人と、最初の会場」「SEASON N — 現在」
4. **Founder Grid** (`.chron-prologue-roster`):
   - `repeat(auto-fit, minmax(140px, 1fr))` で 5 枚カード
   - 各カード: ポートレート (72×90 / `getPortraitUrl`) / 名前 / スタイル + ロール / 状態バッジ
   - バッジ判定:
     - **初代王者** (`careerRecord.totalTitleWins >= 1`): ゴールドバッジ「初代王者」
     - **看板** (`peakPopularity` 5人中最高 かつ 60+): 「看板」バッジ (idol 配色)
     - **退団** (`departed` state): muted バッジ「退団」
     - **引退** (`retired` state): muted バッジ「引退」
   - 退団/引退カードは saturate(0.4) + opacity 0.7 で彩度を落とす
5. **記者の見立て** (`.chron-prologue-quote`): in_progress 中のみ表示
6. **Two-col body**:
   - 左: 主な出来事 (highlights, season 順 / tier 色分け)
   - 右: 通算 stats (TITLES / 最高評価 / PEAK POP / STATUS) ※旧ラベル「PEAK MQ」は2026-08-31のMQ表記一掃で「最高評価」へ
7. **Closing** (`.chron-closing`): in_progress または confirmed の closing 文 + ノート
8. **Nav**: 序章は前章なし、次章ボタンで CH.1 へ

### 5.3 CSS (`_chronicleStyleBlock` 内)

`.chron-prologue-roster / -card / -portrait / -name / -style / -badge / -quote` を追加。
hardcoded 16進カラーは使わず `var(--chr-*)` トークン経由。

## 6. やらないこと (CLAUDE.md 慣習)

- ❌ 既存 `Engine.chronicle` の章生成ロジック (`_collectCandidates` / `_segmentChapters` / `_selectAceAndPeers` / `_primeWindow` / `_heroScore`) への変更
- ❌ 序章の中に「暫定エース」を置く設計 (VARIANT A / C は不採用)
- ❌ 序章への番号付与 ("CH.1" にしない)
- ❌ 既存セーブの破壊的マイグレーション (`missionsCompleted` 等は無視するだけ)
- ❌ 序章を `_segmentChapters` の章境界システムに混ぜる (独立した別レイヤー)
- ❌ FA 選手や 2 年目以降に加入した選手を旗揚げメンバーに含める
- ❌ 序章のハイライトを動的に新聞ティッカーで通知・煽る (年代記タブを開いた時の発見が体験)
- ❌ 既存セーブの旗揚げ世代を遡及生成する (情報がもう取れない)

## 7. 既存セーブのマイグレーション

- `missionsCompleted / missionEnabled / missionNewClears`: ロード時に無視 (上書き保存で消える)
- `prologue` が undefined のセーブ: management.js 初期 state で `Engine.prologue.createEmpty()` (status='empty') として埋まる。表示時は条件分岐により表示なし(年代記タブを開くと従来通り確定章のみ)
- 遡及生成は行わない (旗揚げ時点の roster 情報がもう取れない)

## 8. 実装ファイル

| ファイル | 内容 |
|---|---|
| `src/management.js` | `Engine.prologue` モジュール / 初期 state / `createInitialState` skipDraft 経路の `prologue.create()` |
| `src/app.js` | `completeDraft()` 内の `Engine.prologue.create()` 呼び出し / `App.checkPrologueHighlights()` (tickWeek 後段 4 箇所) |
| `src/ui-render.js` | `_renderPrologueBlock` / `_renderDbChronicle` の idx=0 分岐 / Timeline・Nav 改修 / `_chronicleStyleBlock` の CSS 追加 |

## 9. 検証

- auto-sim 100 シーズン × seed 42: violation 0 / error 0 / game over 0 / ALL CLEAR
- 手動: 新規ゲーム → ドラフト完了 → 年代記タブで序章ブロックに 5 人と「旗揚げ宣言」ハイライト
- 手動: 各種閾値到達 (初興行 / 王座認定 / 初代王者 / MQ50/70/80 / pop25/50 / 経営安定化) でハイライト追加
- 手動: 既存セーブをロード → クラッシュなし、年代記タブが従来通り動作 (序章は status='empty' のため非表示)

## 10. 関連資料

- `plans/chronicle-prologue-plan-v1.0.md` — 実装計画書
- `docs/ui/mockups/chronicle-prologue-mockup-v0.1.html` — UIモックアップ (VARIANT B 採用)
- `specs/chronicle-system-spec-v0.1.md` / `-v0.2.md` / `-v0.3.md` — 既存年代記

## 11. v0.3 連携メモ (2026-05-04 追記)

`specs/chronicle-system-spec-v0.3.md` で章重複が許容されたため、**序章と CH.1 / 駆け出し章のシーズン窓は重なってよい**。

- 序章 = S1-S2 固定の旗揚げ専用レイヤー (本仕様、不変)
- 駆け出し章 (`_fledgling=true`) = 章重複 v0.3 で導入された S1-S2 固定の synthetic 章。`_segmentChapters` が常に先頭に挿入する
- 両者は別レイヤーで併存する。序章は旗揚げメンバー視点、駆け出し章はその時点ロスター視点 (序章後に加入した選手も含む)
- 序章メンバーの一部が駆け出し章にも「ベテラン」「中堅」として登場することは許容 (v0.3 の重複登場ルールと一致)

序章の独立性 (本仕様 §6 「既存 `_segmentChapters` への変更禁止」) は v0.3 でも維持される。v0.3 は `Engine.chronicle._segmentChapters` を全面書き換えしているが、序章は `G.prologue` 単独レイヤーなので影響を受けない。
- `CLAUDE.md` — プロジェクト哲学
