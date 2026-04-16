# Phase 2: 決裁枠システム — 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 1〜1.5時間
> **承認状態**: Phase 1 完了済み(コミット `b6c52b5` / `b74a619`)
> **前提**: `specs/shachoshitsu-spec-v1.0.md` §2 決裁枠システム を事前に読むこと

---

## Phase 2 の目的

`G.decisionPoints` を GameState に導入して、社長室HUDの印鑑表示を state 連動にする。まだ書類を押しても何も起こらない(消費ロジックは Phase 4 で実装)が、**週進行に応じて印鑑が回復する様子が見える** 状態にする。

Phase 2 は "Phase 1 の見た目" に "週進行に追従する HUD" を付け足す工程。書類の消費側は触らない。

---

## Phase 2 で実装するもの

1. `G.decisionPoints` / `G.decisionPointsMax` の2フィールドを GameState に追加
2. 既存セーブ向けマイグレーション
3. 週次回復ロジック(第1,5,9,...,45週 に +2、最大6でキャップ)
4. 新シーズン開始時にフル回復
5. HUD の印鑑表示を `G.decisionPoints` 連動にする(現状の固定値 6 を差し替え)
6. HUD のカウンター(`⚡N/M`) も連動
7. `Engine.validateGameState` に不変条件チェック追加

**Phase 2 で実装しないもの(Phase 4 以降の範囲)**:
- 書類クリック時の消費ロジック
- 対象選手選択モーダル
- 朱印エフェクト
- 印鑑が倒れるアニメーション

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. `specs/shachoshitsu-spec-v1.0.md` §2 全体(73〜126行目)
2. `specs/shachoshitsu-spec-v1.0.md` §11 Phase 2 セクション(878〜896行目)
3. `plans/shachoshitsu-phase1-task.md`(Phase 1 の指示書。命名規則の参考)
4. `CLAUDE.md` の「自動検証システム(auto-sim)」セクション

---

## 既存コードへの影響範囲(重要)

Phase 2 は `management.js` を編集するので、**自動で auto-sim が走る**(フック: `.claude/hooks/auto-sim-check.sh`)。不変条件違反が出たら即座に修正する。

**触ってはいけない既存コード**:
- `G.careStock` / `G.careStockMax` / `G.careStockLastRecovery` — 旧ケアシステム用。Phase 5 で削除するので Phase 2 ではそのまま残す
- 既存のケアモーダル(`showCareActionModal`, `care-overlay`) — Phase 5 まで共存
- 週次処理 `tickWeek` の既存ロジック — 追記のみ、削除や改変しない

Phase 2 は **純粋に追加のみ**。既存の数値バランスや挙動に影響させてはいけない。

---

## タスクリスト

### 1. GameState 初期値に decisionPoints を追加

**ファイル**: `src/management.js`

**場所**: `initState` オブジェクトリテラル内、既存の `careStock: 5, careStockMax: 5, careStockLastRecovery: 0` の直後(検索アンカー: `careStockLastRecovery: 0,`)

**追加するコード**:
```javascript
      // v3.0: ケアストック制
      careStock: 5,
      careStockMax: 5,
      careStockLastRecovery: 0,
      // 社長室 Phase 2: 決裁枠(decisionPoints)
      decisionPoints: 6,
      decisionPointsMax: 6,
```

**検証**: 新規ゲーム開始時に `G.decisionPoints === 6` かつ `G.decisionPointsMax === 6` になっていること。

---

### 2. 既存セーブ向けマイグレーション

**ファイル**: `src/app.js`

**場所**: 既存の careStock マイグレーションの直後(検索アンカー: `// v3.0: ケアストック制マイグレーション`)

**追加するコード**:
```javascript
      // v3.0: ケアストック制マイグレーション
      if (G.careStock === undefined) {
        G = { ...G,
          careStock: 5,
          careStockMax: 5,
          careStockLastRecovery: Engine.util.absWeek(G.season, G.week),
        };
      }
      // 社長室 Phase 2: 決裁枠マイグレーション
      if (G.decisionPoints === undefined) {
        G = { ...G, decisionPoints: 6, decisionPointsMax: 6, _migrated_decisionPoints_v1: true };
      }
```

**マイグレーションフラグ命名**: `_migrated_decisionPoints_v1` — MEMORY.md の既存パターンに従う。

**検証**: Phase 1 完了時点のセーブデータを読み込んだとき、`G.decisionPoints === 6` に初期化されていること。

---

### 3. 週次回復ロジック

**ファイル**: `src/management.js`

**場所**: `tickWeek` 内、既存の careStock 回復処理の直後(検索アンカー: `// v3.0: ケアストック回復(4週ごとに+1、オフシーズン含む)`)

**追加するコード**:
```javascript
    // v3.0: ケアストック回復(4週ごとに+1、オフシーズン含む)
    const careAbsWeek = Engine.util.absWeek(s.season, s.week);
    const careLastRecovery = s.careStockLastRecovery || 0;
    if (careAbsWeek - careLastRecovery >= 4) {
      const newCareStock = Math.min((s.careStock || 0) + 1, s.careStockMax || 5);
      s = { ...s, careStock: newCareStock, careStockLastRecovery: careAbsWeek };
    }

    // 社長室 Phase 2: 決裁枠回復(第1,5,9,...,45週の週進行時に +2、シーズン中のみ)
    // オフシーズンは別途シーズン開始時にフル回復(§9676 付近)
    if (!s.offSeason && s.week >= 1 && s.week <= 45 && (s.week - 1) % 4 === 0) {
      const dpMax = s.decisionPointsMax || 6;
      const newDp = Math.min((s.decisionPoints || 0) + 2, dpMax);
      if (newDp !== s.decisionPoints) {
        s = { ...s, decisionPoints: newDp };
      }
    }
```

**設計ノート**:
- 発動条件: `!offSeason && 1 ≤ week ≤ 45 && (week - 1) % 4 === 0` → week = 1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45 の 12 回/シーズン
- 回復量: +2(spec §2.1)
- キャップ: `decisionPointsMax`(デフォ 6)で頭打ち
- 既にキャップの場合は state を新オブジェクト化しない(パフォーマンス微最適化 & オブジェクト差分削減)
- 初期値 6 の状態で week 1 に +2 しても min(6+2, 6) = 6 で頭打ちになるので、初回週進行で問題は起こらない

**検証**:
- 新規ゲームを 4 週進めて(week 1 → 5)、decisionPoints が 6 のまま(キャップ頭打ち)
- decisionPoints を手動で 2 に減らした状態で week 4 → 5 を進めると、4 になる
- オフシーズン中は回復しない

---

### 4. 仕様書 §2.1 を「オフシーズン: 回復なし」に修正

**重要**: 実装では **新シーズン開始時のフル回復を実装しない**。前シーズン末の残量をそのまま持ち越す仕様に変更する。

**理由(Keisuke さんからの設計判断)**:
- 新シーズン初日に 6 枠フル回復されると、プレイヤー心理的に「使い切らなきゃ損」というプレッシャーが生まれる
- 残量を持ち越す挙動のほうが、プレイヤーが自分のペースで決裁枠を計画的に使える
- 前年に 0 まで使い切っていたら翌年は 2 枠(week 1 の +2 だけ)スタート、という帰結も自然

**ファイル**: `specs/shachoshitsu-spec-v1.0.md`

**場所**: §2.1 基本仕様の表(検索アンカー: `| オフシーズン | 新シーズン開始時にフル回復`)

**修正前**:
```
| オフシーズン | 新シーズン開始時にフル回復(6) |
```

**修正後**:
```
| オフシーズン | 回復なし(前シーズン末の残量を持ち越し) |
```

**注意事項**:
- `src/management.js` のシーズン遷移処理(`season: s.season + 1, week: 1, offSeason: false` の行)には **decisionPoints を追加しない**。触らない
- 前シーズン残量 + week 1 の +2 で新シーズンがスタートする(タスク 3 の週次回復ロジックが自動的にカバーする)
- `decisionPoints` が initState で 6 スタート → week 1 で +2 クランプ → 6 維持 なので、新規ゲームの挙動は変わらない

**検証(実装後、Phase 2 コミット時点で確認)**:
- シーズン末まで進めて decisionPoints を 2 に減らした状態でオフシーズンを通過
- 新シーズン week 1 に入ったときに decisionPoints が **2 のまま(or tickWeek の +2 適用後の 4)** であること
- 新シーズン week 1 で急に 6 に戻っていないこと

**設計メモ**:
- 仕様書の修正と実装コードは **同じコミット内で整合させる**(specs/ と実装の乖離を作らない、CLAUDE.md の specs/ 更新ルール準拠)

---

### 5. HUD を state 連動に変更

**ファイル**: `src/ui-render.js`

**場所**: `renderShachoshitsuHud()` 関数内(Phase 1 で作成した関数)

**現在のコード**:
```javascript
function renderShachoshitsuHud() {
  // Phase 1: 決裁枠は固定6本で全て立っている状態(機能なし)
  const dp = 6;
  const dpMax = 6;
  let hankos = '';
  for (let i = 0; i < dpMax; i++) {
    const cls = i < dp ? 'hanko available' : 'hanko used';
    hankos += `<img class="${cls}" src="../image/shachoshitsu/hanko.webp" alt="決裁枠">`;
  }
  ...
}
```

**修正後**:
```javascript
function renderShachoshitsuHud() {
  // Phase 2: 決裁枠は G.decisionPoints 連動
  const dpMax = G.decisionPointsMax || 6;
  const dp = Math.max(0, Math.min(G.decisionPoints != null ? G.decisionPoints : dpMax, dpMax));
  let hankos = '';
  for (let i = 0; i < dpMax; i++) {
    const cls = i < dp ? 'hanko available' : 'hanko used';
    hankos += `<img class="${cls}" src="../image/shachoshitsu/hanko.webp" alt="決裁枠">`;
  }
  ...
}
```

**注意事項**:
- `Math.max(0, Math.min(..., dpMax))` で表示側でも範囲を念のためクランプ(validateGameState で守っているので本来不要だが安全弁として)
- `G.decisionPoints != null` で 0 を正しく 0 として扱う(undefined のみフォールバック)
- HUD のカウンター `⚡${dp}/${dpMax}` は既に `dp` と `dpMax` を参照しているので自動的に連動する

**検証**:
- 新規ゲーム開始時: 印鑑 6 本立っている、`⚡6/6`
- decisionPoints を手動で 4 に設定して社長室を開く: 印鑑 4 本立 + 2 本倒れ、`⚡4/6`
- decisionPoints を手動で 0 に設定: 全部倒れ、`⚡0/6`

---

### 6. validateGameState に不変条件追加

**ファイル**: `src/management.js`

**場所**: `Engine.validateGameState` 関数内、経済関連チェック(検索アンカー: `// ── 経済関連 ──`)の後ろ、またはシーズン・進行関連チェックの直後に新セクションを追加

**追加するコード**:
```javascript
  // ── 社長室(決裁枠)関連 ──
  if (G.decisionPoints !== undefined) {
    if (!isValidNum(G.decisionPoints)) {
      warn(`decisionPointsが不正値: ${G.decisionPoints}`);
    } else if (G.decisionPoints < 0) {
      warn(`decisionPointsが負値: ${G.decisionPoints}`);
    } else if (G.decisionPoints > (G.decisionPointsMax || 6)) {
      warn(`decisionPointsがmax超過: ${G.decisionPoints}(max: ${G.decisionPointsMax || 6})`);
    } else if (!Number.isInteger(G.decisionPoints)) {
      warn(`decisionPointsが非整数: ${G.decisionPoints}→自動修正`);
      G.decisionPoints = Math.round(G.decisionPoints);
    }
  }
  if (G.decisionPointsMax !== undefined) {
    if (!isValidNum(G.decisionPointsMax) || G.decisionPointsMax < 1 || G.decisionPointsMax > 20) {
      warn(`decisionPointsMaxが不正値: ${G.decisionPointsMax}`);
    }
  }
```

**設計ノート**:
- `decisionPointsMax > 20` は将来の拡張を考えて広めに取っている(現状は 6 固定)
- undefined の場合はチェックをスキップ(マイグレーション前の極短い一時状態を許容)
- 自動修正は非整数の場合のみ(最小介入原則)

**検証**:
- `G.decisionPoints = -1` を手動で設定して週進行 → `[WM Debug]` warn が出る
- `G.decisionPoints = 7` を設定 → max 超過 warn
- `G.decisionPoints = 3.5` を設定 → 非整数 warn + 自動で 4 に丸め

---

### 7. 動作確認

ブラウザで以下を手動で確認する(ユーザーに確認を依頼してもよい):

1. ゲームを起動、社長室を開く → HUD に `⚡6/6` + 印鑑 6 本立っている
2. DevTools コンソールで `G.decisionPoints = 3` → 社長室タブを再クリック → `⚡3/6` + 印鑑 3 本立 / 3 本倒れ
3. `G.decisionPoints = 0` → 全部倒れ
4. `G.decisionPoints = 6` に戻す
5. 週を 4 回進めて社長室を開く → まだ `⚡6/6`(キャップ頭打ちなので増えないのが正しい)
6. `G.decisionPoints = 2` に設定、週を 1 回進めて社長室を開く(next week から week % 4 === 1 のタイミングで) → `⚡4/6` に回復していること
7. **既存のケアモーダル(💝 ケアボタン)は壊れていない**
8. **既存の careStock は触れていない**(careStock 6 のままのはず — 初期値は 5 だが)
9. コンソールに `[WM Debug]` の違反ログが出ていないこと

---

### 8. auto-sim 検証

`management.js` を編集したので、コミット前に auto-sim が自動実行される(フック経由)。違反検出時はフィードバックが返り、その場で修正に入る。

手動検証したい場合:
```bash
node test/auto-sim.js 100    # 100シーズン(ランダムシード)
```

validateGameState の新しい不変条件(decisionPoints 範囲)で違反が出ないこと。

---

## 完了の定義

- [ ] `G.decisionPoints` / `G.decisionPointsMax` が initState に追加されている
- [ ] 既存セーブのマイグレーションが動作する
- [ ] 第1,5,9,...,45週に decisionPoints が +2 回復する(キャップ 6 で頭打ち)
- [ ] オフシーズンは回復しない(前シーズン末の残量を持ち越し)
- [ ] 新シーズン開始時に自動リセットしない(持ち越し運用)
- [ ] `specs/shachoshitsu-spec-v1.0.md` §2.1 の「オフシーズン」欄が「回復なし(持ち越し)」に修正されている
- [ ] HUD の印鑑表示が `G.decisionPoints` 連動している
- [ ] HUD の `⚡N/M` カウンターが連動している
- [ ] `Engine.validateGameState(G)` に decisionPoints の不変条件が追加されている
- [ ] auto-sim 100 シーズン以上で違反なし
- [ ] 既存のケアモーダルが壊れていない
- [ ] 既存の `G.careStock` に変更を加えていない

---

## 完了時のコミット

完了したら以下のコミットメッセージでローカルコミット:

```
feat(shachoshitsu): Phase 2 — 決裁枠システム

- G.decisionPoints / G.decisionPointsMax を GameState に追加(初期値6)
- 既存セーブ用マイグレーション(_migrated_decisionPoints_v1)
- 週次回復ロジック: 第1,5,9,...,45週 に +2(キャップ6で頭打ち)
- オフシーズン/新シーズン跨ぎは回復なし(前シーズン末残量を持ち越し)
- HUD の印鑑表示とカウンター ⚡N/M を G.decisionPoints 連動に変更
- Engine.validateGameState に decisionPoints の不変条件チェック追加
- specs/shachoshitsu-spec-v1.0.md §2.1 を持ち越し仕様に修正

仕様: specs/shachoshitsu-spec-v1.0.md §2
指示書: plans/shachoshitsu-phase2-task.md
```

**push はしない**(Keisukeさんが判断)。

---

## Phase 2 完了後の次のステップ

Phase 2 が Keisuke さんに承認されたら、Phase 3(書類の動的生成と表示)へ進む。Phase 3 は:

- `src/data.js` に `DECISION_DOCS` 定義(8書類ぶんの仕様データ)
- `Engine.shachoshitsu.checkActivation` / `getAvailableDocs` 関数実装
- 発動条件判定(trust < 60 / スランプ / morale 等)
- `renderShachoshitsu` で動的書類描画(現状のハードコード `_SHACHOSHITSU_PLACEHOLDER_DOCS` を置き換え)

Phase 3 はプレースホルダーから正式データへの置き換えが主軸なので、仕様書 §3 全体の精読が必要になる。

---

## 禁止事項(再掲)

- ❌ 既存の `G.careStock` / `careStockMax` / `careStockLastRecovery` への変更
- ❌ 既存のケアモーダル(`showCareActionModal` / `care-overlay`)の改変
- ❌ 既存の `tickWeek` 内ロジックの既存部分の改変(追記のみ OK)
- ❌ `decisionPoints` の消費ロジック実装(Phase 4 の範囲)
- ❌ 書類クリック処理の実装(Phase 4 の範囲)
- ❌ 旧ケアシステムの削除(Phase 5 の範囲)
- ❌ ハードコード16進色の使用(既に変数で賄える)

---

## トラブルシュート

### auto-sim で violation が出る

- `decisionPoints` が undefined のまま週次処理に入っている → マイグレーションが走っていない可能性。`app.js` のマイグレーションブロックが正しい位置に入っているか確認
- `decisionPoints` が NaN → 加算前に数値チェック(`s.decisionPoints || 0` のフォールバック)を確認

### HUD の印鑑数が更新されない

- 社長室画面を開きっぱなしで `G.decisionPoints` を手動で変更しても、自動再レンダリングされない(Phase 2 仕様範囲)
- 他タブに切り替えて戻すと `renderShachoshitsu()` が再実行されて反映される
- Phase 4 以降で書類クリック時に再レンダリングを入れる

### 既存セーブを読み込んだら decisionPoints が undefined のまま

- app.js のマイグレーションが既存セーブ読込パスで走っていない可能性
- マイグレーションブロックは `careStock === undefined` チェックの直後に置くこと(同じ if-else 構造ではなく、別の if として独立させる)

### 週を進めても回復しない

- `(s.week - 1) % 4 === 0` の判定ミスがないか(JavaScript の `%` は 0-based)
- `s.offSeason` が true のままになっていないか確認
- `s.week` が 46 以降の場合は回復しないのが正しい(45 が最終回復週)

### 新シーズン開始時に 6 に戻る(本来は持ち越すはず)

- Phase 2 では **新シーズン開始時のフル回復を実装しない**(Keisuke さんの設計判断)
- もし 6 に戻っていたら `management.js` のシーズン遷移行に `decisionPoints` を追加してしまっていないか確認
- 正しい挙動: 前シーズン末残量 + week 1 の tickWeek で +2 加算 → 最大キャップ 6 で頭打ち

---

以上、Phase 2 実装指示書終わり。
