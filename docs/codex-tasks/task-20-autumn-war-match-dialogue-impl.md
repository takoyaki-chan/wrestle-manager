# Codexタスク20: 秋の4団体勝ち残り対抗戦「試合中セリフ」の実装

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**変更してよいファイル**: `src/data.js`、`src/ui-common.js`、`test/` 配下、`specs/autumn-gauntlet-war-spec-v0.1.md`、`docs/worklog.md`、`docs/game-system-roadmap.md`

**コミットはOK**（日本語の明確なメッセージで）。**pushは禁止**。

**必読**: `CLAUDE.md`、`docs/autumn-war-match-dialogue-draft-v0.1.md`（＝実装する確定稿）、`specs/autumn-gauntlet-war-spec-v0.1.md`

---

## ⚑ このタスクは「実装のみ」。セリフ文面は書かない・改変しない

セリフは Opus がアーキタイプ別に書き下ろした確定稿 **`docs/autumn-war-match-dialogue-draft-v0.1.md`** にある。**文面の追記・削除・語尾変更・言い換えを一切行わないこと。** 草案のJSコードブロックをそのまま構造化して `src/data.js` に載せるのが仕事。文面の過不足に気づいた場合は勝手に直さず、完了報告で指摘するに留める。

---

## 背景（現状の"仮"実装）

秋大会の試合中セリフは、コミット `27aa3b9` で仕組み（決定的シード抽選・確率）だけ先に入り、**文面はジュニア大会 `getJuniorTournamentLine` を暫定流用**している。これを秋大会専用の確定稿へ差し替える。

- **優勝スピーチ（`AUTUMN_WAR_MVP_LINES.champion`）・MVP一言（`gauntlet`/`defiant`）は既に秋大会専用で完成済み。今回の対象外。触らない。**
- 今回差し替えるのは次の3文脈のみ:
  - **試合前 (preMatch / preFinal)** … `_agwPreBoutDialogueHtml`（`src/ui-common.js`）が `getJuniorTournamentLine('preMatch'|'preFinal', ...)` を呼んでいる
  - **勝ち残り後 (survivor)** … `_agwSurvivorLine`（`src/ui-common.js`）が `getJuniorTournamentLine('postMatchWin', ...)` を呼んでいる

## やること

### 1. `src/data.js` に `AUTUMN_WAR_MATCH_LINES` を新設

確定稿末尾の3つのJSコードブロック（`preMatch:` / `preFinal:` / `survivor:`）を、そのまま1つのオブジェクトにまとめて定義する。

```js
const AUTUMN_WAR_MATCH_LINES = {
  preMatch:  { /* 草案§1のブロック */ },
  preFinal:  { /* 草案§2のブロック */ },
  survivor:  { /* 草案§3のブロック */ },
};
```

- 構造は既存 `JUNIOR_TOURNAMENT_LINES` と同型（`文脈 → personality → archetype / _default`）。
- 配置場所は既存 `AUTUMN_WAR_MVP_LINES`（L5962付近）の直後が自然。
- **`data.js` 末尾のエクスポート集約（L27390付近、`AWARD_LINES` 等を並べている箇所）に `AUTUMN_WAR_MATCH_LINES` を必ず追加する。** 追加忘れは即 undefined 参照になる。

### 2. 取得ヘルパー

既存 `getJuniorTournamentLine(timing, personality, archetype, rng)`（`data.js` L14511）と**同じフォールバック規則**（`pData[archetype] || pData._default || []`）で `AUTUMN_WAR_MATCH_LINES` を引く関数を用意する。専用 `getAutumnWarMatchLine(context, personality, archetype, rng)` を新設するのが明快。既存の getter を一般化して共用してもよいが、その場合もジュニア側の挙動を一切変えないこと。

### 3. 呼び出し側の差し替え（`src/ui-common.js`）

- `_agwPreBoutDialogueHtml`: `getJuniorTournamentLine('preMatch'|'preFinal', ...)` → 新テーブルの `preMatch` / `preFinal` を引くように変更
- `_agwSurvivorLine`: `getJuniorTournamentLine('postMatchWin', ...)` → 新テーブルの `survivor` を引くように変更
- **決定的シード抽選（`_agwDialogueRng`）と確率（preBout 0.55 / survivor 0.60）はそのまま維持。** 抽選の仕組みは変えず、参照するデータ表だけ差し替える
- `getJuniorTournamentLine` 自体・ジュニアトーナメント側の呼び出しは**一切変更しない**

### 4. 仕様・記録の更新

- `specs/autumn-gauntlet-war-spec-v0.1.md`: 試合中セリフが秋大会専用テーブル化された旨を1〜2行追記（出典: `docs/autumn-war-match-dialogue-draft-v0.1.md`）
- `docs/worklog.md` の**先頭**に詳細ログ、`docs/game-system-roadmap.md` は該当行のステータスを1行更新

## 検証

- **auto-sim を回す**: `node test/auto-sim.js 200`（シード複数）で違反0・エラー0を確認。ただしセリフはUI層のためエンジン不変条件には出ない。主眼は「参照追加でクラッシュや undefined が出ないこと」
- 既存の秋大会UIフローテスト（`test/autumn-war-ui-flow-test.js`）が通ること。必要なら preMatch/preFinal/survivor が新テーブルから引けることの最小テストを追加
- `node --check` で構文確認

## 厳守事項

- セリフ文面を書かない・変えない（確定稿の丸写し）
- `AUTUMN_WAR_MVP_LINES`（champion/gauntlet/defiant）を触らない
- 抽選の仕組み・確率を変えない
- `data.js` のエクスポート追加を忘れない
- ハードコード16進カラー等のUI規約は今回範囲外（データ追加＋参照差し替えのみ）
- push禁止

## 完了報告に含めること

- 変更ファイル一覧とコミット
- auto-sim 結果（違反件数・シード）
- 確定稿と実装データの一致確認（過不足なく載ったか）
- Keisuke が実機で確認すべき点（秋大会を1本回し、試合前/勝ち残り後で「会話あり/なし」が確率で混在し、アーキタイプ別の口調が出ること）
