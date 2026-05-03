# 💀 破産再設計 実装タスク（Phase 1）

> **対応 spec**: `specs/bankruptcy-redesign-spec-v1.1.md`
> **推奨モデル**: Opus（セリフ書き起こしのテキスト品質が重要なため）
> **進行**: Phase 1-A → 1-B → 1-C の順。各 Phase 完了時に承認を待つ

---

## 📋 必読チェックリスト

実装着手前に以下を必ず読む:

- [ ] `specs/bankruptcy-redesign-spec-v1.1.md` — 本タスクの仕様書（全文）
- [ ] `specs/personality-archetype-spec-v1.0.md` — archetype/personality の定義
- [ ] `docs/character-voices/kuroda.md` — 黒田の voice spec（editorial モード固定）
- [ ] `specs/archive/ending-gameover-spec-v1.0.md` — 旧仕様（§1, §3, §4 は継続、§2 は本書で置き換え）
- [ ] `CLAUDE.md` — ゲーム全体の設計原則（特に「テンプレセリフ禁止」「数字は繊細に使え」）

実装中に参照するソース:

| ファイル | 範囲 | 内容 |
|---|---|---|
| `src/ui-common.js` | L12500-12780 | `showEndingCeremony`（クリア時5スライド・参考実装）、`showGameOverScreen`（置き換え対象） |
| `src/management.js` | L9312-9520 | `tickWeek` 本体・`processSettlement` 呼び出し、既存破産判定（L9514）の位置 |
| `src/management.js` | L12694-13230 | `advanceWeek`、オフシーズン処理、`week > 48` 分岐（L13215） |
| `src/app.js` | L1230-1380 | `Survival` システム・燃料ゲージ計算（コメント修正対象） |
| `src/data.js` | L17771 付近 | `ENDING_LINES` の定義場所（近くに `GAMEOVER_LINES`、`CRISIS_DIALOGUE` を追加） |
| `src/kuroda-text.js` | 全体 | `KURODA_TEXT` 構造（追記対象） |

---

## ⚠️ 重要な実装原則（spec の核）

- **archetype が主軸、personality は Phase 2 で扱う**。セリフプールは `archetype × trust` の 18 構造。`personality` は Phase 1 では使わない。
- **「お嬢様の怒り」と「不良の怒り」は違う**。各 archetype の口調が一貫していることを確認しながらセリフを書く。spec の §3.3 をそのまま使い、勝手な書き換えはしない。
- **オフシーズン中は `processSettlement` が走らない**。危機判定は `!s.offSeason` 条件で囲む。シーズン末判定は `advanceWeek` の `week > 48` 直前に挿入。
- **黒田は editorial モード固定**。`数字は嘘をつかない` 系の決まり文句、`本紙は`、宣言調 `〜だ`/`〜である`、対比構造を守る。
- **トラスト・モラル減衰は控えめに**（trust -2, morale -1 程度）。数値ペナルティでドラマを作らない。ドラマはセリフと黒田で作る。

---

## Phase 1-A: 状態追加と破産判定の刷新（基盤）

### タスク

1. **`createInitialState` に状態フィールド追加**（`src/app.js` または該当箇所）
   ```js
   crisisActive: false,
   crisisEnteredWeek: null,
   crisisWeeksRemaining: 0,
   crisisHistoryCount: 0,
   gameOverReason: null,
   ```

2. **ロード時の後方互換補完**（spec §7.1 のコードを使用）

3. **`tickWeek` 既存破産判定の置き換え**（`src/management.js` L9513-9517）
   - 現状: `if (s.funds <= 0) { weekPhase: 'gameover' }` を削除
   - 新規: spec §2.2 のトリガー条件 + §2.3 の毎週処理を挿入
   - **必ず `!s.offSeason` 条件で囲む**

4. **`advanceWeek` のシーズン末強制判定**（`src/management.js` L13215 付近、`week > 48` 分岐の冒頭）
   - spec §2.4 のコードをそのまま挿入
   - 破産確定時は `return { state: s, events }` でオフシーズン突入処理をバイパス

5. **`Survival` 燃料ゲージのコメント・計算式整合**（`src/app.js` L1298-1310）
   - 既存コメント `// bankrupt at -1000` → 新仕様に合わせて修正（危機突入は0、即死は-1500）
   - `weeksUntilBankrupt` と `fuelPct` のロジックを新数値に整合

### 動作確認ポイント（Phase 1-A 完了時に報告）

- [ ] 資金がマイナスに突入 → ゲームログに「🚨 資金が底をついた。残り猶予4週」が出る
- [ ] 危機中に資金がプラスに戻ると「✅ 資金が黒字に戻った」が出て、危機解除される
- [ ] 4週放置で `gameOverReason: 'timeout'` で破産する
- [ ] 危機中に -1500 を割ると `gameOverReason: 'collapse'` で即破産する
- [ ] レギュラーシーズン最終週でマイナスのままだと `gameOverReason: 'season_end'` で破産する
- [ ] オフシーズン中は危機フェーズに新規突入しない

→ ✋ **ここで承認を待つ**

---

## Phase 1-B: 危機フェーズの演出

### タスク

1. **危機警告バー UI 実装**
   - 画面上部に常時表示（`crisisActive === true` のとき）
   - 表示内容: 「⚠️ 資金危機 残り○週」を赤帯で
   - 既存ナビゲーションを邪魔しない位置に配置
   - 該当箇所: `src/ui-render.js` + `src/index.html` の CSS

2. **`CRISIS_DIALOGUE` データ追加**（spec §2.7）
   - 配置先: `src/data.js`（`ENDING_LINES` の近く）
   - archetype 別 6 プール（ojousama / delinquent / cool / seductive / polite / normal）
   - **spec §2.7 のセリフをそのまま使う**

3. **危機突入時の選手発言ポップアップ**
   - 危機フェーズ突入週に1回、ロスター内のトラスト最上位1名（同値の場合は人気最上位）に発言させる
   - 既存の発言ポップアップ機構を流用（`flag-dialogue.js` 系または `app.js` の発言処理）
   - archetype をキーに `CRISIS_DIALOGUE.enter[archetype]` からランダム選出

4. **`KURODA_TEXT.crisis` 追加**（`src/kuroda-text.js`）
   - spec §2.6 の `enter` / `ongoing` / `recovered` の3区分
   - 各区分内のセリフは spec のままコピー
   - `{orgName}` `{weeksRemaining}` のテンプレ置換に注意

5. **新聞 Page 1 への黒田警告コラム掲載ロジック**
   - 危機突入週: `KURODA_TEXT.crisis.enter` から1つ選んで Page 1 に掲載
   - 危機継続週: `KURODA_TEXT.crisis.ongoing` を掲載
   - 危機脱出週: `KURODA_TEXT.crisis.recovered` を掲載
   - 既存の Page 1 黒田コラムロジック（editorial モード）に分岐を追加

### 動作確認ポイント（Phase 1-B 完了時に報告）

- [ ] 危機中、画面上部に警告バーが表示される
- [ ] 残り週数が正しく減っていく
- [ ] 危機突入週に選手の発言ポップアップが出る（archetype に応じたセリフ）
- [ ] 新聞に黒田の警告コラムが出る（危機突入・継続・脱出で文面が変わる）
- [ ] 危機脱出後は警告バーが消える

→ ✋ **ここで承認を待つ**

---

## Phase 1-C: 解散セレモニー（5スライド）

### タスク

1. **`GAMEOVER_LINES` データ追加**（`src/data.js`）
   - **spec §3.3 を一字一句そのまま使う**。勝手な書き換えはしない
   - archetype × trust = 18 プール、各プール 3 セリフ
   - コーチ用 6 セリフ
   - **書き起こすときに、各 archetype の口調が一貫しているか自分で確認する**（特に妖艶系・お嬢様系は崩れやすい）

2. **`pickGameOverLinesForTop3` ヘルパー関数**（`src/management.js` または `gameover-lines.js` 新設）
   - spec §3.4 のコードをそのまま使う
   - 3名分を重複なく選出するロジック

3. **`KURODA_TEXT.gameover` 追加**（`src/kuroda-text.js`）
   - `timeout` / `collapse` / `season_end` の3パターン、各2セリフ
   - spec §3.5 をそのまま使う

4. **`Engine.ending.buildGameOverData(state)` 拡張**（`src/management.js`）
   - 既存の `buildGameOverSummary` をベースに、以下を追加:
     - `gameOverReason`（state から取得）
     - `top3Fighters`（人気上位3名、`showEndingCeremony` と同じ選出ロジック）
     - `top3Lines`（`pickGameOverLinesForTop3` で生成）
     - `coaches`（雇用中コーチ全員）
     - `coachLines`（`GAMEOVER_LINES.coach` から人数分ランダム選出、重複なし）
     - `kurodaColumn`（`KURODA_TEXT.gameover[gameOverReason]` から1つ選出）

5. **`showGameOverCeremony(data, onDone)` 実装**（`src/ui-common.js`）
   - **`showEndingCeremony` の実装パターンを完全踏襲**（L12515-）
   - スライド構成は spec §3.2:
     - スライド1: 解散告知 + 黒田コラム（`gameOverReason` で文面分岐）
     - スライド2: 成績表（`showGameOverScreen` の項目を流用、トーンを暗く）
     - スライド3: 選手3名の解散セリフ（顔画像 + セリフ）
     - スライド4: コーチ陣の解散セリフ（コーチ0人ならスキップ）
     - スライド5: 締めくくり（spec §3.2 の文言通り）
   - BGM: `Audio.fileBgm.play('../bgm/iwa_gameover001.mp3', { volume: 0.13, loop: true })` で開始、スライド5「タイトルへ」で `fadeOut(2000)`
   - フレーム配色は `showEndingCeremony` の祝祭系から喪失系に変更（白→灰、金→黒灰など）

6. **既存 `showGameOverScreen` の置き換え**（`src/app.js`）
   - 呼び出し箇所を `showGameOverCeremony` に変更
   - データは `Engine.ending.buildGameOverData(G)` で生成

7. **オートセーブ抑制の確認**（`src/app.js`）
   - ゲームオーバー到達時にオートセーブを上書きしないことを確認（既存仕様継続）
   - 危機フェーズ突入時は通常通りオートセーブする（プレイヤーが「危機の瞬間からやり直したい」を許容）

### 動作確認ポイント（Phase 1-C 完了時に報告）

- [ ] 4週猶予切れ → 5スライドが順に流れる、`timeout` の黒田コラムが出る
- [ ] -1500突破 → `collapse` の黒田コラムが出る
- [ ] シーズン末破産 → `season_end` の黒田コラムが出る
- [ ] スライド3: 選手3名のセリフが archetype × trust 通りに出る（同じ archetype の口調が一貫している）
- [ ] スライド3: 3名のセリフが重複しない
- [ ] スライド4: コーチがいるとセリフが出る、いないとスキップされる
- [ ] スライド5: 「だが選手たちの戦いは続く——どこか別の団体の下で。」の文言が出る
- [ ] BGM が再生され、スライド5でフェードアウトする
- [ ] 「タイトルへ」ボタンでタイトル画面に戻る
- [ ] ゲームオーバー後にロードすると、危機突入時のセーブから再開できる

→ ✋ **ここで承認を待つ**

---

## 完了報告フォーマット

各 Phase 完了時に以下を報告:

```
## Phase 1-X 完了報告

### 実装したもの
- [ファイル名 L行範囲]: 概要
- ...

### 動作確認結果
- [動作確認ポイントの各項目について ✅ or ⚠️ + 補足]

### 気になった点・spec との差異
- [ない場合は「なし」]
```

---

## やってはいけないこと

- ❌ spec のセリフを勝手に書き換える（§3.3, §2.7, §3.5）
- ❌ archetype を無視して personality 主軸でデータ構造を作る
- ❌ オフシーズン中も危機判定を走らせる
- ❌ 黒田を editorial 以外のモード（observation, interview）で書く
- ❌ トラスト・モラルを大きく削る（spec §2.5「数字でドラマを作らない」原則）
- ❌ Phase をまたいで一気に実装する（必ず承認ゲートを通す）
