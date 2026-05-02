# 序章付き団体年代記 実装計画 v1.0

> **本書の位置づけ**: ミッションシステム廃止 + 既存団体年代記 (`specs/chronicle-system-spec-v0.1.md` 〜 `v0.2.md`) への「序章」追加の実装計画。既存の章生成ロジックには一切手を入れない、純粋な追加実装として設計する。
>
> **関連資料**: `docs/chronicle-prologue-mockup-v0.1.html` (UIモックアップ、VARIANT Bを採用)

---

## §1. 概要

### 1.1 背景

- 今週画面のミッションパネル (`src/app.js MISSIONS`、`src/ui-render.js .mission-panel`) は CLAUDE.md の三本柱・やらないことリストと整合せず、機能的にも経営サバイバルおよび既存年代記と重複している
- 既存年代記は「届かなかった世代の物語を残す」コンセプトで完成度が高いが、最初のエース章 CH.1 の prime window が始まるまでの期間（多くの場合 S1-S2、長ければ S3-S4）は記録されない
- ユーザー実プレイで、2年目半ばに FA 加入した選手がエースとなり、その前の旗揚げ期が年代記に残らない現象が観察された

### 1.2 狙い

- ミッションの哲学的不整合と機能重複を解消する
- 旗揚げ世代の物語を独立した「序章」として永久に残す場所を作る
- 既存年代記の確定章ロジックは一切変更せず、純粋な追加実装で完結させる

### 1.3 設計の核

- **序章は番号外** (`"序"` / `"Prologue"`)、確定章は CH.1 から始まる
- **エースを置かない** (VARIANT B 方式)。旗揚げ5人を等価に並べる
- **最後の旗揚げメンバーが引退した時点で確定する** (移籍・解雇・契約満了は閉じない)
- **既存 `Engine.chronicle` には触らない**。`Engine.prologue` を独立モジュールとして追加

---

## §2. やらないことリスト

CLAUDE.md 慣習に従い、明示的に書く。

- ❌ 既存 `Engine.chronicle` の章生成ロジック (`_collectCandidates` / `_segmentChapters` / `_selectAceAndPeers` / `_primeWindow` / `_heroScore`) への変更
- ❌ 序章の中に「暫定エース」を置く設計 (VARIANT A / C は採用しない)
- ❌ 序章への番号付与 ("CH.1" にしない)
- ❌ チェックリスト型 UI、進捗％表示、「→ 開く」型ガイダンスの再導入
- ❌ 既存セーブの破壊的マイグレーション (`missionsCompleted` 等は無視するだけ)
- ❌ 序章を `_segmentChapters` の章境界システムに混ぜる (独立した別レイヤー)
- ❌ FA 選手や 2 年目以降に加入した選手を旗揚げメンバーに含める
- ❌ 序章のハイライトを動的に新聞ティッカーで通知・煽る (年代記タブを開いた時の発見が体験)
- ❌ 序章のために `G.chronicle` の既存プロパティ構造を変更する (`G.prologue` を別途用意)
- ❌ 既存セーブの旗揚げ世代を遡及生成する (情報がもう取れない)

---

## §3. 削除フェーズ: ミッションシステム撤去

### 3.1 撤去対象コード

| 場所 | 内容 |
|---|---|
| `src/app.js` L1230–1290 | `MISSIONS` 配列 (14項目定義) |
| `src/app.js` L1292 | `PHASE_LABELS` |
| `src/app.js` L1430–1477 | `Mission` オブジェクト |
| `src/app.js` L1704 | 旧バージョン互換初期化ブロック |
| `src/app.js` L7250, L7748–7753 | `tickWeek` 内の `Mission.updateCompleted` 呼び出し |
| `src/app.js` L9179–9190 | `App.toggleMission`, `App.dismissMissionClear` |
| `src/management.js` L13174–13176 | 初期 state (`missionEnabled` / `missionsCompleted` / `missionNewClears`) |
| `src/ui-render.js` L865–908 | 今週画面のミッションパネル描画ブロック |
| `src/index.html` L1275–1304 周辺 | `.mission-*` CSS 全般 |
| `src/index.html` 内 `dismissMissionClear` 関連 | グローバル関数等の残骸 |

### 3.2 撤去確認

```sh
grep -rn "mission\|Mission" src/ specs/ | grep -v "submission\|Submission"
```

→ ヒットゼロを確認。

### 3.3 既存セーブの扱い

- `missionsCompleted` / `missionEnabled` / `missionNewClears` はロード時に無視
- 上書き保存時に自動的に消える (能動的なクリーンアップは不要)

---

## §4. 新規実装: 序章 (Prologue)

### 4.1 データモデル

```js
G.prologue = {
  founderIds: number[],              // 旗揚げ5人のID (不変)
  startSeason: 1,                    // 固定
  startWeek: number,                 // ドラフト完了週
  endSeason: number | null,          // 全旗揚げメンバー引退時のシーズン
  endWeek: number | null,            // 同・週
  status: 'in_progress' | 'confirmed',
  highlights: PrologueHighlight[],   // 序章期間中に刻まれた出来事
  closing: string | null,            // 確定時に1度だけ生成して保存
}

PrologueHighlight = {
  id: string,                        // 重複防止用 ID
  season: number,
  week: number,
  tier: 'gold' | 'red' | 'silver' | 'normal',  // 既存 _chronicleHighlightClass 準拠
  text: string,                      // 事実ベースの短文
}
```

### 4.2 ライフサイクル

#### 生成タイミング

- `completeDraft()` 内で `Engine.prologue.create(state)` を呼ぶ
  - `founderIds = state.roster.map(c => c.id)` (固定2人 + ドラフト3人 = 5人)
  - `startSeason: 1, startWeek: state.week, status: 'in_progress'`
  - 初回ハイライト 1 件を即時記録 (`org_founded`)

#### 終了タイミング (確定: 最後の旗揚げメンバーが引退)

引退処理 (既存の retire ロジック) の中で:

1. 引退選手の id が `founderIds` に含まれるかチェック
2. 含まれていれば、`founderIds` 全員が `retiredFighters` に入っているか判定
3. 全員引退済みになった瞬間に:
   - `status: 'confirmed'`
   - `endSeason / endWeek` を確定
   - 終結ハイライト `prologue_end` を刻む
   - `closing` テキストを生成して保存

**移籍・解雇・契約満了・突然退団では序章を閉じない**。これは「引退してこそ世代が終わる」という既存 `fighterArchive` の哲学 (引退選手のみ archive に入る) と一貫させるため。

ただし他団体に移籍した旗揚げメンバーが、その他団体で引退した場合も `retiredFighters` 相当に入る (要確認: 既存実装で移籍後引退を追跡できるか)。追跡できない場合のフォールバック: 30シーズン経過しても確定しない場合の保険ロジックを v1.1 で検討。v1.0 では「全員 `retiredFighters` 入り」をシンプルに採用。

### 4.3 エース選定なし

- `aces` フィールドは持たない
- VARIANT B レイアウト (旗揚げ世代グリッド + ハイライト + 通算統計)
- 「記者の見立て」短文 1 本のみ (固定文 + `orgName` 置換)
- 「同期」セクションは不要 (グリッドが兼ねる)

### 4.4 ハイライトの粒度

序章期間中に拾うイベントを以下に絞る (最小限スタート、観察してから拡張)。

| 種別 | tier | 発火条件 | 重複ガード ID |
|---|---|---|---|
| 旗揚げ宣言 | gold | ドラフト完了 | `org_founded` |
| 旗揚げ戦 | gold | 初興行完了 | `first_show` |
| 初代王座認定 | normal | 王座作成 | `first_title_setup` |
| 初代王座戴冠 | red | 初代王者誕生 | `first_title_winner` |
| 初の MQ50 | silver | bestMQ 初到達 50 | `first_mq50` |
| 初の MQ70 | silver | bestMQ 初到達 70 | `first_mq70` |
| 初の MQ80 | gold | bestMQ 初到達 80 | `first_mq80` |
| 人気 25 到達 | normal | orgPop 初到達 25 | `pop_25` |
| 人気 50 到達 | silver | orgPop 初到達 50 | `pop_50` |
| 経営安定化 | red | survivalCleared | `survival_clear` |
| 旗揚げメンバー初引退 | red | founder の最初の引退 | `founder_first_retire_${id}` |
| 全旗揚げメンバー引退 | red | 序章終了 | `prologue_end` |

意図的に拾わないもの:

- ランキング順位 (ランキング画面で十分、確定章にも入る)
- コーチ雇用関連 (経営の細部)
- 季節フィッシュ
- アワード (既存年末アワード演出で十分)
- 興行ごとの細部 (週ごとに刻むとログになり、年代記の品位を損なう)

### 4.5 旗揚げメンバーグリッドの表示

モックアップ `docs/chronicle-prologue-mockup-v0.1.html` の VARIANT B 通り。

- `repeat(auto-fit, minmax(140px, 1fr))` グリッドで 5 枚のカード
- 各カード: ポートレート (72×90) / 名前 / スタイル + ロール / 状態バッジ
- 状態バッジ (動的判定):
  - **初代王者**: `careerRecord.totalTitleWins >= 1` でゴールドバッジ「初代王者」
  - **看板**: peakPopularity が 5 人中最高、かつ閾値 (例 60) 以上で「看板」バッジ
  - **退団**: `roster` にも `retiredFighters` にもない (= 移籍・解雇・契約満了)
  - **引退**: `retiredFighters` に含まれる
- カードは状態に関わらず**消えない**。退団/引退時は彩度を落とした表示

### 4.6 章末 (closing)

- in_progress 中: 固定文「この世代の物語は、まだ始まったばかりだ。」
- confirmed 後: 生成して `prologue.closing` に保存。v1.0 は固定文 1 本:
  > 「最後の旗揚げメンバーが去り、団体は次の世代へと託された。」

closing バリエーションは v1.1 で拡張検討 (旗揚げメンバーの実績パターンに応じて)。

### 4.7 気風 (spirit) への寄与

- 既存 `Engine.chronicle.applySpiritContribution` ロジックがそのまま動く
- 旗揚げメンバーが引退すると `chronicle.spirit` に加算される (現行通り)
- 序章の表示には spirit を出さない (既存仕様: プレイヤーには非表示)

### 4.8 UI 配置

- データベース画面の「📖 年代記」サブタブ内
- 既存 `_renderDbChronicle` の章リスト (`status === 'confirmed'` フィルタ) の**前**に序章ブロックを 1 つ表示
- タイムライン tic は 「序」 と表示し、確定章 CH.1, CH.2... と同じレールに乗る
  - in_progress: dash 線スタイル (既存 `chron-timeline-tick.in-progress` を流用)
  - confirmed: 実線 (通常 tick)
- ナビゲーション (前章/次章) で序章にも遷移可能 (序章は idx=0 とする)
- レイアウトは VARIANT B (モックアップ参照)

---

## §5. 既存システムへの影響

### 5.1 影響しない箇所

- `Engine.chronicle.buildChapters` および配下の関数群 (一切変更なし)
- 章の hero score / prime window / 章境界 / 章名生成 / mode 判定
- 既存の `chronicle.spirit` / `fighterArchive` / `chaptersCache`
- 新聞 / ランキング / データベース他画面

### 5.2 影響する箇所

| 場所 | 変更内容 |
|---|---|
| `src/management.js` 初期 state | `prologue` プロパティ追加 |
| `src/management.js` または新規 `src/engine-prologue.js` | `Engine.prologue` モジュール追加 |
| `src/app.js` `completeDraft()` | 序章生成呼び出し |
| `src/app.js` 興行決算 | `addHighlight('first_show', ...)` |
| `src/app.js` 王座作成・決定戦 | `addHighlight('first_title_*', ...)` |
| `src/app.js` 試合判定後 | bestMQ 閾値到達で `addHighlight('first_mq*', ...)` |
| `src/app.js` orgPop 更新後 | 閾値到達で `addHighlight('pop_*', ...)` |
| `src/app.js` Survival graduation | `addHighlight('survival_clear', ...)` |
| `src/app.js` retire 処理 | founder 判定 + 序章終了判定 |
| `src/ui-render.js` `_renderDbChronicle` | 冒頭に `_renderPrologueBlock(G)` 呼び出し追加 |
| `src/ui-render.js` (新規) `_renderPrologueBlock` | 序章描画関数 |
| `src/ui-render.js` `_chronicleStyleBlock` | `.chron-prologue-roster` 等の追加 CSS (モックアップから移植) |
| `src/ui-render.js` `setDbChronicleIdx` | idx=0 で序章を表示するよう拡張 |
| `src/index.html` | (CSS は `_chronicleStyleBlock` 内に集約するため変更最小) |

---

## §6. 段階的実装プラン

### Phase 1: ミッション撤去

- `src/app.js` / `src/ui-render.js` / `src/index.html` から mission 関連コードを削除
- `grep -rn mission src/` でゼロを確認 (`submission` を除外)
- auto-sim で挙動確認 (validateGameState 違反ゼロ)

### Phase 2: 序章データ層

- `src/management.js` 初期 state に `prologue` 追加
- 新規 `Engine.prologue` モジュール:
  - `createEmpty()`, `create(state)`, `addHighlight(state, entry)`,  `checkRetireAll(state, retiredFighterId)`,  `confirm(state)`, `getStatus(state)`
- `completeDraft()` から `Engine.prologue.create()` 呼び出し

### Phase 3: ハイライト発火フック

- 各イベント発火ポイントに `Engine.prologue.addHighlight()` を 1 行ずつ追加
- すべて `prologue.status === 'in_progress'` のときのみ発火 (関数内部でガード)
- 重複 ID チェックは `addHighlight` 内で実装

### Phase 4: 引退時の序章終了判定

- 既存の retire 処理の中で `Engine.prologue.checkRetireAll()` を呼ぶ
- 全 founder が引退済みになった時点で `Engine.prologue.confirm()` を呼ぶ
  - status 更新 / endSeason・endWeek 確定 / 終結ハイライト追加 / closing 生成

### Phase 5: UI 実装

- `src/ui-render.js` に `_renderPrologueBlock(G)` を新規実装 (VARIANT B)
- `_renderDbChronicle` の冒頭で呼び出し
- タイムライン tic を「序」表示で追加
- 前章/次章ナビに序章 (idx=0) を含める
- `_chronicleStyleBlock` に `.chron-prologue-roster` 等の CSS 追加

### Phase 6: 検証

- `test/auto-sim.js` で 1000+ シーズン回す:
  - `validateGameState` 違反ゼロ
  - 序章の highlights が各シナリオで正しく蓄積
  - 序章 confirmed 遷移が正しく起きる (全 founder 引退で 1 度だけ)
- 既存セーブのロード時に prologue が空でもクラッシュしないこと
- 旧 `missions*` プロパティがあっても無視されること
- 手動: 新規ゲーム → ドラフト完了 → 序章にメンバー 5 人とハイライト 1 件
- 手動: 旗揚げ戦実施 → ハイライト追加
- 手動: 王座決定戦 → ハイライト追加
- 手動: ロード/セーブのラウンドトリップで保持

---

## §7. マイグレーション

### 7.1 新規ゲーム

ドラフト完了時に正常生成。問題なし。

### 7.2 既存セーブ (旧 `missions*` あり、`prologue` なし)

ロード時:

- `missionsCompleted / missionEnabled / missionNewClears` → 無視 (上書き保存で消える)
- `prologue` が `undefined` の場合:
  - **遡及生成は行わない** (旗揚げ時点の roster や週次イベントが復元できないため)
  - `G.prologue = { founderIds: [], status: 'confirmed', highlights: [], closing: null, ... }` を埋めて、序章を「データなし・既に閉じた章」として扱う
  - 表示時は「このセーブには序章のデータが残っていません」のメッセージを出す
  - タイムラインに「序」tic は表示するが、クリックすると上記メッセージのみ

### 7.3 マイグレーションフラグ

`G._migrated_prologue_v1: true` を立てて、二重マイグレを防止。

---

## §8. 検証計画

### 8.1 自動検証

- `test/auto-sim.js` を 1000+ シーズン回す
- 検証項目:
  - `validateGameState` 違反ゼロ
  - `prologue.highlights` の重複登録ゼロ (id ベース重複ガード)
  - `prologue.status` 遷移が一度だけ起きる
  - founder 全員引退でも `prologue.status === 'confirmed'` になる
  - 旗揚げメンバーが全員他団体移籍した場合 (引退しない) → `status: 'in_progress'` のまま (既知の挙動)

### 8.2 手動検証

- 新規ゲーム開始 → ドラフト完了
  - データベース → 年代記タブ → 序章ブロックが表示される
  - 5 人のカードが表示される
  - 「旗揚げ宣言」ハイライトが 1 件
- 第 1 シーズン進行
  - 旗揚げ戦 → ハイライト「旗揚げ戦」追加
  - 初代王座決定戦 → 「初代王座認定」「初代王者戴冠」追加
  - 初代王者バッジが該当カードに表示
- 既存セーブをロード
  - クラッシュなし
  - 序章ブロックが「データなし」表示
- 旗揚げメンバー全員引退まで進行 (auto-sim で 30+ シーズン)
  - status が confirmed に遷移
  - closing テキストが表示される
  - タイムライン tic が実線に変化

---

## §9. オープン質問 (実装前に確定したい)

### Q1: 旗揚げメンバーの定義

ドラフト時に契約した 5 人 (固定 2 人 + ドラフト 3 人) を全員 `founderIds` に入れるか?

**推奨**: 全員入れる。プレイヤーから見れば「最初に揃った 5 人」がそのまま旗揚げ世代。

### Q2: closing バリエーション

確定時の closing テキストは v1.0 では固定文 1 本でスタートしてよいか?

**推奨**: YES。観察後 v1.1 で実績パターン別に拡張 (例: 5 人全員王座経験あり / 1 人もタイトル無し / 旗揚げ戦の MQ が 50 超だった、など)。

### Q3: タイムライン上の「序」tic の見た目

通常 tick と区別するか?

**推奨**: in_progress は dash 線 (既存 `chron-timeline-tick.in-progress` 流用)、confirmed は実線。ラベルは「序」固定。

### Q4: 移籍した旗揚げメンバーが他団体で引退した場合

既存実装で `retiredFighters` に追加されるか? それとも他団体の `aiOrgs[orgId].retiredFighters` に行くか?

**要調査**: Phase 2 着手前に既存 retire ロジックを確認。後者なら founder の引退判定で両方をチェックする必要がある。

### Q5: 序章 idx の扱い

既存の `_dbChronicleIdx` は 1-based。序章を idx=0 にするか、idx=1 にしてエース章を idx=2 以降にずらすか?

**推奨**: idx=0 を序章専用に確保し、エース章は idx=1 以降のまま (既存ロジックを変えない)。`setDbChronicleIdx(0)` で序章へ遷移。

---

## §10. 完了基準

- [ ] Phase 1 完了: `grep mission src/` がヒットゼロ
- [ ] Phase 2 完了: 新規ゲーム開始時に `G.prologue` が正常初期化
- [ ] Phase 3 完了: 全ハイライト種別が auto-sim で発火確認
- [ ] Phase 4 完了: 全 founder 引退で status 遷移確認
- [ ] Phase 5 完了: モックアップ通りの表示
- [ ] Phase 6 完了: 自動検証 + 手動検証すべてパス
- [ ] `docs/game-system-roadmap.md` 更新
- [ ] ローカルコミット (push しない)

---

## §11. 参考資料

- `specs/chronicle-system-spec-v0.1.md` — 既存年代記の基本仕様
- `specs/chronicle-system-spec-v0.2.md` — 章 mode 判定の追加仕様
- `docs/chronicle-prologue-mockup-v0.1.html` — UI モックアップ (VARIANT A/B/C 比較、本計画は B を採用)
- `CLAUDE.md` — プロジェクト哲学・三本柱・やらないことリスト

---

## 付録 A: ミッションシステムから引き継がれる/捨てられるもの

旧 14 ミッションのうち、序章ハイライトとして拾われるもの・捨てられるもの。

| 旧ミッション | 扱い |
|---|---|
| `hire_coach` (コーチを雇おう) | **削除** (チュートリアル文言、社長視点でない) |
| `set_schedule` (スケジュール変更) | **削除** (同上) |
| `first_show` (初興行) | **序章 hl `first_show` へ** |
| `mq40` (MQ40) | **削除** (序章は MQ50 から拾う、より高い達成にフォーカス) |
| `assign_coach` (コーチに選手を任せよう) | **削除** (同上) |
| `crown_champ` (団体王座を認定) | **序章 hl `first_title_setup` + `first_title_winner` へ** |
| `pop25` (人気25) | **序章 hl `pop_25` へ** |
| `coach3` (コーチ3人体制) | **削除** (経営の細部) |
| `rank3` (ランキング3位) | **削除** (ランキング画面で十分) |
| `assign_all` (全選手にコーチ配置) | **削除** (チュートリアル) |
| `mq70` (MQ70) | **序章 hl `first_mq70` へ** |
| `pop50` (人気50) | **序章 hl `pop_50` へ** |
| `rank1` (ランキング1位) | **削除** (序章は団体外活動を扱わない、ランキング画面・確定章で十分) |
| `season2` (2年目を迎えよう) | **削除** (時間経過に意味を持たせない) |

序章で新規追加されるもの:

- `org_founded` (旗揚げ宣言)
- `first_mq50` (MQ50)
- `first_mq80` (MQ80)
- `survival_clear` (経営安定化)
- `founder_first_retire_${id}` (旗揚げメンバー初引退)
- `prologue_end` (全旗揚げメンバー引退)

旧 14 ミッションのうち実質的に保持されるのは 5 件 (first_show / crown_champ → 2件 / pop25 / mq70 / pop50)。残り 9 件は削除。
