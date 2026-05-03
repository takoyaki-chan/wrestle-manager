# 解雇キャラクター 遺恨システム 仕様 v0.1

**ファイル**：`specs/firing-grudge-spec-v0.1.md`
**最終更新**：2026-05-04
**実装状況**：全Phase完了 + AI団体汎用化（2026-05-04）— grudge.vsOrgId は player / AI org id を受け付ける汎用フラグに昇格。AI団体側の解雇パス2箇所（aiMidseasonFAAcquire 戦力外通告 / claimDepartedStar eject）でも applyFiringGrudge を呼び grudge を付与。getVsExEmployerLine / _vsExEmployeeFires / _buildVlVsPlayerForExEmployee / _buildVsExHitLines / _getWarVictoryLine / _emitFiredReturn は opponentOrgId を受け取り「対戦相手 org が grudge.vsOrgId と一致」する場合に発動。firedReturn ニュースの ourOrg は grudge.vsOrgId 側の組織名を解決して使用。challenge-request inverse（逆方向打診）の AI→AI 経路はスコープ外（player↔AI のみ）。auto-sim 100×1: ALL CLEAR / violations 0。
旧履歴：Phase 1: grudge 構造 / intensity 算出 / decay / Phase 2: 解雇者→残留組ティア別更新+性格バイアス / Phase 3a: forward heat バイアス / Phase 3b: 逆方向 AI→player 打診インフラ / Phase 4: firedReturn 新聞テンプレ + 挑戦試合内トリガー / Phase 5: vsExEmployer victory-lines 28パターン + iframe 配信
**親仕様**：
- `specs/relationship-system-spec-v2.0.md`（Bond / Rivalry 非対称2軸）
- `specs/relationship-system-spec-v2.2.md`（A-1〜A-4 / B-3 元同僚初対戦 / 契約離脱裏切りハンドラ）
- `specs/career-history-spec-v1.0.md`（type: 'release'）
**連動仕様**：
- `specs/challenge-request-spec-v0.1.md`（heat バイアス）

---

## 0. 位置付け

「解雇」は**自分の意志でない離脱**。契約満了・突然離脱（`processDeparture`）とは性質が違い、
**解雇された側の感情は強く、特定の方向（元社長団体・元同僚）に向く**。

現状の実装（`src/app.js` L4040-4097）：
- 残留組 → 解雇者: bond −2〜+2（性格別、控えめ）
- 解雇者 → 残留組: **更新処理なし**（穴）
- 解雇者の「元プレイヤー団体への遺恨」概念: **存在しない**

本仕様で：
1. 解雇者 → 残留組の片方向ネガティブ更新を追加
2. キャラ個別フラグ `grudge` を導入し、**団体への遺恨**を別レイヤーで保持
3. challenge-request-spec と連動し、解雇キャラが他団体所属になった場合の挑戦試合発火率にバイアス

「数字は繊細に使え」原則に従い、効果は **ニュース・セリフ・連動演出** で見せる。
直接の数値変動は最小限に抑える。

## 1. 解雇者 → 残留組の関係性更新

解雇イベント発生時（`src/app.js` の release 確定処理内）、
**解雇者から残留組全員への片方向更新**を追加：

| 区分（解雇者から見た残留組） | 元 bond | 元 rivalry | bond Δ | rivalry Δ |
|---|---|---|---|---|
| 親友グループ | ≥ 70 | 任意 | −25〜−35 | +8〜+12 |
| 元ライバル | 任意 | ≥ 40 | −5〜−10 | +20〜+28 |
| 一般同僚 | < 70 | < 40 | −10〜−18 | +12〜+18 |

### 性格バイアス

乱数幅を性格で偏らせる：

| 性格 | bond Δ 寄り | rivalry Δ 寄り |
|---|---|---|
| hot | 中央 | **+方向に強く**（怒り） |
| composed | **−方向に弱め**（落胆寄り） | −方向に弱め |
| proud | −方向に強め（裏切られた誇り） | +方向に中央 |
| quiet | −方向に強め（沈黙の恨み） | 中央 |
| emotional | **−方向に最も強く**（深い喪失） | +方向に弱め |
| seductive | 中央 | 中央 |
| competitive | 中央 | +方向に強め |

### 上限ガード

- bond は最低 0 までクランプ（既存 `clamp01` 流用）
- rivalry は 100 までクランプ
- 1 回の解雇イベントで `bond Δ ≥ −45 / rivalry Δ ≤ +45` のサーチャージ規約に準拠

### 残留組 → 解雇者は据え置き

現状の `src/app.js` L4060-4068 の処理（性格別 bond −2〜+2）はそのまま維持。
残留組側は同情・複雑な感情の領域なので、過度に動かさない。

## 2. キャラ個別フラグ `grudge`

関係性は1対1で団体への遺恨を表現できないため、**キャラ個別レイヤーで保持**：

```js
fighter.grudge = {
  vsOrgId: 'player',           // 'player' or aiOrg id
  reason: 'fired',             // 'fired' のみ（将来拡張可）
  issuedSeason: number,
  issuedWeek: number,
  intensity: 0~100,            // 解雇時の状況から算出
  decayUntilSeason: number     // この季節を超えると intensity が逓減開始
}
```

### intensity 算出

解雇された選手の状況から算出：

```
intensity = 40                          // 基底
  + (popularity / 100) × 25             // 人気が高いほど恨みが深い
  + titleHistoryCount × 5               // タイトル経験ごとに +5
  + (age < 23 ? +10 : 0)                // 若手切り
  + (yearsInOrg ≥ 3 ? +10 : 0)          // 長期在籍からの解雇
  + (hadActiveTitle ? +15 : 0)          // 王座保持中の解雇

clamp 0〜100
```

### intensity 逓減

- `decayUntilSeason = issuedSeason + 3`（3シーズン保持）
- 以降、シーズンごとに `intensity × 0.85` で減衰
- intensity ≤ 5 でフラグ削除

### セーブ互換性

既存セーブには `grudge` フィールドがない → `null` フォールバック。
読み込み時に `f.grudge ?? null` で扱い、未設定キャラには影響なし。

## 3. 効果（数字より演出）

### 3.1 challenge-request-spec との連動（最重要）

解雇キャラが他団体所属になった場合（`claimDepartedStar` 経由）、
そのキャラ（解雇された側）が **打診者** になるケースで heat 計算にバイアス：

```
heat += grudge.intensity × 0.3   // 最大 +30 ブースト
（grudge.vsOrgId === 'player' のときのみ）
```

これにより、**人気が高かった元エースを解雇すると、後で挑戦を仕掛けてくる確率が上がる**。
逆方向（残留組 → 解雇キャラ）にはバイアスをかけない（残留組は同情側）。

### 3.2 新聞ヘッドライン

解雇キャラが他団体に移籍 → 半年（24週）以内に対プレイヤー団体戦に登場で専用見出し：

- 「あの解雇から○週、○○が古巣に挑む」
- 「○○、別団体での再起はじまる」
- 「解雇○週目の挑戦、果たしてリングに何を持ち込むか」

`src/data.js` の NEWS_HEADLINE_TEMPLATES に新カテゴリ `firedReturn` を追加。
intensity ≥ 60 で発動、3〜5 パターン以上を性格別に用意。

### 3.3 試合中セリフバイアス

元プレイヤー団体選手と当たったとき、解雇キャラ側に専用セリフカテゴリ：

- `victory-lines.js` に `vsExEmployer` カテゴリ追加
- 勝利セリフ：「あの団体で潰されかけた俺が、ここまで来た」系
- 被弾セリフ：「ここで負けたら、何のために出てきた」系
- 性格別、最低 各性格 × 2 パターン = 14 パターン

### 3.4 直接の数値効果は **なし**

intensity を毎週どこかに加算するような処理は **行わない**。
intensity は「演出と発火確率にバイアスをかけるための背景値」として扱う。

## 4. 実装ファイル

| ファイル | 内容 |
|---|---|
| `src/app.js` | 解雇処理（L4040-4097）に解雇者→残留組更新と grudge 付与を追加 |
| `src/relationships.js` | `applyFiringGrudge(state, firedId, rng)` 新規関数 / heat バイアス連動 |
| `src/management.js` | grudge 逓減処理（シーズン切り替え時）/ career history 拡張 |
| `src/data.js` | NEWS_HEADLINE_TEMPLATES.firedReturn 追加 |
| `src/victory-lines.js` | `vsExEmployer` カテゴリ追加 |

## 5. 検証

- auto-sim 100シーズン × 5 シードで：
  - grudge フラグの付与・逓減が正しく動く（intensity が 0 未満や 100 超にならない）
  - bond/rivalry のクランプ違反が出ない
  - 解雇 → 他団体加入 → 挑戦打診 → 試合の連動シナリオが少なくとも数件発生する
- セーブ互換性：grudge フィールドが無い旧セーブで例外が出ないこと

## 6. 実装フェーズ

| Phase | 内容 | auto-sim |
|---|---|---|
| Phase 1 | grudge データ構造 / 解雇時の付与 / intensity 算出 / 逓減処理 | 不要 |
| Phase 2 | 解雇者→残留組の関係性更新（性格バイアス含む） | **必須** |
| Phase 3 | challenge-request heat バイアス連動 | 不要（challenge-request 実装後） |
| Phase 4 | 新聞ヘッドライン firedReturn 追加 | 不要 |
| Phase 5 | victory-lines.vsExEmployer カテゴリ追加 | 不要 |

Phase 2 のみ auto-sim 必須（関係性数値に影響）。
challenge-request-spec と並行実装し、Phase 3 で接続する。

## 7. 未確定事項

- 性格バイアスの具体数値レンジ：実装時に他のサーチャージ（A-1〜A-4）と整合を取る
- intensity 算出式の重み：実プレイデータが取れたら再調整（初期値はやや強めに設定して様子見）
- 「契約満了で他団体へ」と「解雇」の差別化：契約満了はキャラ自身の意志要素もあるため grudge は付与しない（解雇のみに限定）
- 「解雇直後に他団体が拾わなかった場合（FA / dormantPool 行き）」：FA から後で他団体に拾われたタイミングで grudge を継承するか、または FA → 復帰時に再評価するか。Phase 1 では grudge は解雇時点で必ず付与し、所属に関わらず保持する方針
