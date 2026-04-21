# Phase 3a: 派閥システム 演出イベント土台（F01/F02/F03）— 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 8〜12時間
> **承認状態**: 未承認（本指示書のレビュー承認後に実装開始）
> **前提コミット**: Phase 2 完了後（`git log --oneline -20` で確認）
> **ブランチ**: `feature/faction-system` を継続使用
> **参照**: `specs/faction-system-spec-v0.1.md` §8〜§11、`plans/faction-phase3-handoff.md`

---

## Phase 3a のねらい

Phase 1 でバックエンド、Phase 2 で可視化が済んだ。しかし**派閥が生まれる瞬間・消える瞬間のドラマはまだ演出されていない**。現状 tickWeek は「条件成立で即生成」しているだけで、プレイヤーの介入も、セリフも、選択肢もない。Phase 3a はここに「派閥誕生（F01/F02）」と「リーダー喪失（F03）」の 3 イベントを差し込み、派閥の骨格ドラマを動かす。

F04〜F08 は Phase 3b に回す（handoff §Phase 3 分割提案 案1）。

### Phase 3a で実装するもの

1. **F01 忠誠型結成**: 条件成立時、60%/週で発火。4シーン＋選択肢3択（A:権威化 / B:拒否 / C:静観）＋結果演出
2. **F02 対立型結成**: 条件成立時、80%/週で発火。4シーン＋選択肢4択（A:派閥A中心 / B:派閥B中心 / C:調停 / D:静観）＋結果演出
3. **F03 リーダー喪失**: 退団・引退・長期離脱（8週以上の重傷）で即時発動。選択肢なし、後継候補 OVR 比率で自動分岐（通常継承 / 大動揺 / 解散）。軽量版ナレーション＋残メンバー1人セリフ
4. **F01/F02/F03 のセリフ叩き台**: 各性格 × アーキタイプで**最低1パターン**（spec §11 の4組例示を核に、性格6種は最低1個ずつ埋める）
5. **Engine.factions 新規 API**: 発動判定・選択肢効果適用・F03 自動分岐計算を純粋関数として追加
6. **モーダル UI**: 既存 `careOverlay` を流用（B1-B4 大型イベント／契約交渉と同じ流儀）
7. **tickWeek 派閥パイプライン改修**: 現状「条件成立で即生成」を「条件成立 → 確率判定 → モーダル pending → 社長判断を待って生成」に書き換え
8. **F03 フック**: 退団・引退・長期離脱の発生点から Engine.factions にイベントを立てる
9. **auto-sim の選択肢ランダム化対応**: F01/F02 モーダルが出ても auto-sim が止まらないよう、ランダム分岐ヘルパーを追加

### Phase 3a で実装しないもの（重要）

- ❌ F04〜F08 演出イベント（→ Phase 3b）
- ❌ セリフの全量産（Phase 3a は各性格最低1パターンの叩き台まで、全アーキタイプ網羅は Phase 3b）
- ❌ 相関図派閥ビューモード（→ Phase 3c 単独セッション）
- ❌ 派閥絡みの bond/rivalry 週次変動カタログ（→ Phase 3d）
- ❌ `Engine.factions.*` の既存関数シグネチャ変更（追加は OK）
- ❌ `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` のデータ形状変更
- ❌ Phase 2 の派閥 UI 3ポイント（DBタブ・ポップアップバッジ・試合カードバッジ）への干渉

---

## ⚠ 未解決・判断が必要な項目（レビュー時に確定）

handoff §Phase 3 全体での未解決項目のうち、Phase 3a に効くもの。**推奨案をデフォルトとして入れているが、承認時に指示があれば変える**。

| # | 論点 | 推奨案（デフォルト） | 代替案 |
|---|------|-------------------|------|
| 1 | モーダル UI の実装 | **`careOverlay` 流用**。B1-B4 大型イベント／契約交渉と同じフロー。4シーン切替は既存オーバーレイ内での HTML 差し替えで実現 | 新規コンポーネント（コスト大。Phase 3a では避けたい） |
| 2 | F01/F02 の発動タイミング | **翌週ゲーム開始時**。tickWeek 末尾で `_pendingFactionEvent` を立て、`advanceWeek` 後に `App` が検出してモーダル表示。B1-B4/契約交渉と同じパターン | tickWeek 内で即モーダル（UI とエンジンの結合が強くなる、auto-sim で扱いづらい） |
| 3 | F03 の演出量 | **軽量版**: ナレーション3〜4行＋残メンバー1人セリフ（後継候補 or 最古参）。モーダル1シーン完結、選択肢なし「続ける」ボタンのみ | 中量版（F01/F02 と同じ4シーン。spec には軽量指定、重くしない方が良い） |
| 4 | セリフのスケール | **各性格最低1パターン、アーキタイプは spec 例示4組＋不足分は normal でフォールバック**。Phase 3b で全アーキタイプ網羅 | 全性格×全アーキタイプ網羅（F01 だけで 36 セリフ、F02 でリーダー×2 = 72、F03 = 36、計 144 セリフ。Phase 3a には重い） |

**承認時、1〜4 のいずれかに指示があれば指示書を書き直してから着手**。指示がなければ推奨案で進める。

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. **`CLAUDE.md`** — 感情設計、数値哲学、テンプレセリフ禁止、やらないことリスト
2. **`docs/ui/01-foundations.md` / `02-layouts.md`** — Office/Stage/Ceremony カテゴリ、CSSトークン、ハードコード色禁止
3. **`specs/faction-system-spec-v0.1.md`** — 特に §8（発動制御）§9.1〜§9.3（F01/F02/F03 イベントカタログ）§10（連鎖マトリクス）§11（セリフ方針）§17（Phase 1/2 実装状況）
4. **`src/factions.js`** — Phase 1 で完成した Engine.factions 全27関数。`checkLoyalFormationConditions` / `checkRivalrousFormationConditions` / `createFaction` / `reconcileRoster` の返却形状を必ず確認
5. **`src/management.js` L7441〜7480**（tickWeek 派閥週次パイプライン）— 現状の「条件成立で即生成」コードを Phase 3a で改修する対象
6. **`src/app.js` L6523〜6545 付近**（`_pendingChoiceEvent` / `_pendingLargeEvent` のハンドリング）— 翌週モーダル検出パターンの既存例
7. **既存の大型イベント B1〜B4 実装**（`_applyLargeEventResult` 呼び出し周辺）— `careOverlay` 利用パターン
8. **既存の契約交渉イベント実装**（`Engine.contract.resolveNegotiation` と対応する UI）— 1対1対話のモーダル遷移、シーン切替
9. **`src/data.js` の既存セリフ定数**（NEGOTIATE_LINES / CARE_REACTION / CHOICE_EVENT など）— セリフデータの格納・参照パターン
10. **`memory/feedback_player_text_no_internal_tokens.md` / `feedback_auto_sim_ui_only.md`** — プレイヤー向け表記ルール・auto-sim 方針

---

## アーキテクチャ5原則の遵守

1. **Engine 純粋関数**: F01/F02/F03 の判定・効果適用は全て `src/factions.js` に純粋関数として追加。`G.factions` 等の直接書換は UI から行わない
2. **GameState 返却値更新**: 選択肢効果は `Engine.factions.applyF01Choice(state, choiceId, ...) → newState` 形式。副作用なし
3. **UI は GameState を直接変更しない**: モーダル選択結果は `App` のディスパッチャ経由で Engine を呼ぶ
4. **乱数シード管理**: F01/F02/F03 用シード `0xFA11` / `0xFA12` / `0xFA13` を新設（既存 `0xFA0B` の隣接枠）。spec §12 の RNG シード表に追記
5. **tickWeek 統合パイプライン**: 派閥週次処理は既存の L7441〜7480 ブロックに追記。処理順序は「reconcileRoster（F03 判定） → 形成チェック＋発動抽選（F01/F02 pending 立て） → processWeeklyMemberChanges → hostility/momentumDecay → checkDissolutionConditions」

---

## 実装タスクリスト

### Task 1: Engine.factions 新規 API（3時間）

`src/factions.js` に以下を追加。**既存関数は一切触らない**。

#### 1-1. 発動抽選ヘルパー

```javascript
// 条件成立したイベントの中から確率判定＋競合解決で1つだけ発動候補を返す
// return: { eventId: 'F01'|'F02'|'F03'|null, payload: {...} }
Engine.factions.pickWeeklyEvent(state, rng)
```

- spec §8.2 の確率（F01:60% / F02:80%）を判定
- spec §8.3 の優先順位（F03 > F08 > F04 > F05 > F07 > F06 > F01/F02）。Phase 3a では F03 / F01 / F02 の3つだけ対象
- F03 は `reconcileRoster` が内部で検知したリーダー喪失フラグを使う（§1-2 で用意）
- 確率判定に使う RNG は `0xFA11`

#### 1-2. F03 自動分岐計算

```javascript
// リーダー喪失時、後継候補 OVR 比率から分岐を決定
// return: { branch: 'succession'|'turmoil'|'dissolution', successorId, oldLeaderOVR, successorOVR }
Engine.factions.resolveF03Branch(state, factionId, rng)
```

- spec §9.3 分岐ロジック: 83%以上=通常継承 / 70〜82%=50%で動揺・50%で継承 / 70%未満=解散
- RNG は `0xFA13`
- **注意**: 現行 `reconcileRoster` は内部でリーダー喪失を拾って自動で再選出または解散しているはず（Phase 1 実装確認要）。Phase 3a では `reconcileRoster` を「F03 発動フラグを立てるだけ」に改修し、実際の継承/解散処理はモーダル後の `applyF03Result` で行う **← この改修が Phase 1 関数シグネチャ変更に相当するなら、代替として新関数 `detectLeaderLoss(state)` を立てて reconcileRoster 呼び出し前に検知する**

#### 1-3. 選択肢効果適用 API

```javascript
Engine.factions.applyF01Choice(state, payload, choiceId, rng)  // choiceId: 'A'|'B'|'C'
Engine.factions.applyF02Choice(state, payload, choiceId, rng)  // choiceId: 'A'|'B'|'C'|'D'
Engine.factions.applyF03Result(state, payload, rng)            // 選択肢なし、branch で分岐
```

- spec §9.1 / §9.2 / §9.3 の効果表をそのまま実装
- 各効果（trust±、bond±、rivalry±、authoritativeTag 付与、対立度初期化、勢い初期化、メンバー間 bond±、ロッカールーム士気±）を GameState 返却値更新で適用
- RNG は `0xFA11` / `0xFA12` / `0xFA13`
- **authoritativeTag** は派閥オブジェクトに `tags: []` を生やして `'authoritative'` を push。Phase 1 のデータ形状に `tags` が無ければ `_migrated_factions_tags_v1` マイグレーションを追加
- F01-B（拒否）でクールダウン12週を立てるため、`state.factionEventCooldowns[\`F01_reject:${leaderId}\`] = week + 12` 形式で設定

#### 1-4. auto-sim 用ランダム選択ヘルパー

```javascript
// auto-sim がプレイヤー判断を自動化するときに使う。均等乱択
Engine.factions.pickRandomChoice(eventId, rng)
// return: 'A' | 'B' | 'C' | 'D'（F02のみD含む、F03は'OK'固定）
```

---

### Task 2: tickWeek 派閥パイプライン改修（1時間）

`src/management.js` L7441〜7480 の既存ブロックを書き換え。

#### 改修前（現状）

```
reconcileRoster → checkLoyalFormationConditions → 即 createFaction
                → checkRivalrousFormationConditions → 即 createFaction × 2
→ processWeeklyMemberChanges → decay → checkDissolutionConditions
```

#### 改修後

```
detectLeaderLoss（F03候補拾い）
→ pickWeeklyEvent（F03/F01/F02 の確率判定＋競合解決）
  → イベント発動決定なら s._pendingFactionEvent = { eventId, payload } を立てて**形成処理はここで止める**
  → イベント発動なしなら、そのまま processWeeklyMemberChanges → decay → checkDissolutionConditions
```

- `_pendingFactionEvent` は B 系列大型イベントと同じ transient フィールド。翌週 `App` がピックアップしてモーダル表示
- **auto-sim 時は `_pendingFactionEvent` を即座に `Engine.factions.pickRandomChoice` で自動解決して `applyFxxChoice` を呼ぶ分岐**を `test/auto-sim.js` 側に追加（UI を経由しない）

---

### Task 3: モーダル UI（careOverlay 流用）（3時間）

`src/app.js` の週開始時フロー（`advanceWeek` 完了後、`_pendingChoiceEvent` / `_pendingLargeEvent` を拾う直後）に `_pendingFactionEvent` 検出を追加。

#### 3-1. ディスパッチャ

```javascript
if (G._pendingFactionEvent) {
  const { _pendingFactionEvent: fe, ...clean } = G;
  G = clean;
  // fe.eventId で分岐して対応モーダルを開く
  if (fe.eventId === 'F01') showFactionF01Modal(fe.payload);
  else if (fe.eventId === 'F02') showFactionF02Modal(fe.payload);
  else if (fe.eventId === 'F03') showFactionF03Modal(fe.payload);
  return; // 他イベントと排他
}
```

#### 3-2. F01 モーダル（4シーン＋結果）

- シーン1: ロッカールーム導入ナレーション（固定テキスト叩き台: 「ロッカールームで、○○の周りに自然と選手たちが集まっている。……」）
- シーン2: リーダーのセリフ（性格×アーキタイプで `FACTION_F01_LEADER_LINES[personality][archetype]` を引く）
- シーン3: フォロワー1〜2人のセリフ（`FACTION_F01_FOLLOWER_LINES[personality][archetype]`）
- シーン4: 社長の判断（選択肢3択ボタン: A/B/C）
- シーン5: 結果演出（選択後、効果を文章化してナレーション表示、「続ける」で閉じる）

シーン切替は既存 `careOverlay` 内の HTML を `innerHTML` で差し替え、「次へ」ボタンで進める。契約交渉イベントと同じ流儀。

#### 3-3. F02 モーダル（4シーン＋結果、4択）

- F01 と同じ構成、ただしシーン2とシーン3でそれぞれ異なる派閥のリーダーセリフを出す
- シーン4: A/B/C/D の4択（A:派閥A中心 / B:派閥B中心 / C:調停 / D:静観）

#### 3-4. F03 モーダル（軽量1シーン）

- ナレーション3〜4行（「旧リーダー○○が退団した。派閥『××組』に動揺が広がる」など、branch で分岐前の汎用テキスト）
- 残メンバー1人のセリフ（後継候補 or 最古参、`FACTION_F03_SURVIVOR_LINES` から性格×アーキタイプで引く）
- 「続ける」ボタン押下で `applyF03Result` を呼び、continuation モーダルで branch 結果を表示（通常継承 / 大動揺 / 解散のそれぞれナレーション3行）

#### 3-5. CSS

既存 `.care-overlay` 系を流用。派閥モーダル独自の装飾が必要なら `.faction-event-overlay` クラスを足して `--accent-faction-1〜4` トークンで識別色を乗せる（Phase 2 で追加済）。**ハードコード色禁止**。

---

### Task 4: セリフデータ叩き台（2時間）

`src/data-faction-dialogue.js` を新規作成。格納形式:

```javascript
const FACTION_F01_LEADER_LINES = {
  bold: {
    normal: [ "あんたらのことは、あたしが見てる。だから安心しな。", /* 2〜3パターン */ ],
    delinquent: [ ... ],
    cool: [ ... ],
    // 不足アーキタイプは normal にフォールバック
  },
  earnest: { normal: [...], polite: [...], ... },
  quiet: { normal: [...], cool: [...], ... },
  easygoing: { normal: [...], ... },
  emotional: { normal: [...], ojousama: [...], ... },
  normal: { normal: [...] },  // フォールバック
};
```

#### 叩き台の最小セット（Phase 3a）

| データ | 性格 | アーキタイプ | 最小パターン数 |
|--------|------|------------|--------------|
| F01 LEADER | 6性格 × 核4アーキタイプ（normal/ojousama/delinquent/cool）+ normalフォールバック | 1〜2パターン | 24〜48 |
| F01 FOLLOWER | 6性格 × normalフォールバック | 1〜2パターン | 6〜12 |
| F02 LEADER | 6性格 × 核4アーキタイプ + normal | 1パターン | 24〜30（派閥A/B共用） |
| F03 SURVIVOR | 6性格 × normalフォールバック | 2〜3パターン（branch別に出し分けたい場合は3種） | 18〜36 |

- **spec §11 の叩き台4組（bold/normal, earnest/normal, quiet/cool, emotional/ojousama）は必ず核として使う**
- **CLAUDE.md 鉄則**: テンプレセリフ禁止、一人称・語尾・感情の出し方を性格ごとに変える
- **プレイヤー向け表記ルール**: morale / orgPop / trust / bond 等の内部トークンをセリフに出さない
- 欠けたアーキタイプは `normal` を fallback として参照するヘルパー `_getFactionLine(table, personality, archetype, rng)` を `src/factions.js` または `src/data-faction-dialogue.js` に用意

---

### Task 5: F03 フック（退団・引退・長期離脱）（1時間）

派閥リーダーがロスターから消える瞬間は複数箇所に散らばっている。Phase 1 で `reconcileRoster` がこれを検知している前提だが、**長期離脱（8週以上の重傷）は現状検知されていない可能性が高い**。

- `Engine.factions.detectLeaderLoss(state)` を新設（Task 1-2）して、以下3条件のいずれかを週次で検査:
  1. リーダー ID が `state.fighters` に存在しない（退団・引退済み）
  2. リーダー ID が FA プールに移動している
  3. リーダーの `injuryWeeks` が 8 以上（長期離脱）
- 検出したら `_pendingFactionEvent = { eventId: 'F03', payload: { factionId, loseReason } }` を立てる
- 実際の `createFaction` 取り消し・メンバー無派閥化は `applyF03Result` 内で実行

**Phase 1 の `reconcileRoster` が既にリーダー喪失で自動解散している場合、Phase 3a では一旦 `reconcileRoster` を「検知のみ・解散しない」版に後退させる**。これが既存シグネチャ変更に該当するなら、**新関数 `detectLeaderLoss` を reconcileRoster 呼び出し前に先行配置し、pending が立ったら reconcileRoster をスキップ**する実装でも OK（推奨）。

---

### Task 6: auto-sim の選択肢ランダム化対応（30分）

`test/auto-sim.js` に以下を追加:

```javascript
// tickWeek 後、_pendingFactionEvent が立っていたらランダム選択で即解決
if (G._pendingFactionEvent) {
  const fe = G._pendingFactionEvent;
  const choice = Engine.factions.pickRandomChoice(fe.eventId, simRng);
  if (fe.eventId === 'F01') G = Engine.factions.applyF01Choice(G, fe.payload, choice, simRng);
  else if (fe.eventId === 'F02') G = Engine.factions.applyF02Choice(G, fe.payload, choice, simRng);
  else if (fe.eventId === 'F03') G = Engine.factions.applyF03Result(G, fe.payload, simRng);
  delete G._pendingFactionEvent;
}
```

これを週次ループに挟み込まないと、auto-sim が pending を放置して派閥が一切生成されなくなる。

---

### Task 7: spec §12 RNG シード追記（10分）

`specs/faction-system-spec-v0.1.md` §12 に以下3行を追加:

| 用途 | シード |
|------|-------|
| F01 発動抽選＋選択肢効果 | `0xFA11` |
| F02 発動抽選＋選択肢効果 | `0xFA12` |
| F03 分岐判定＋選択肢効果 | `0xFA13` |

---

### Task 8: 実プレイ確認（ユーザー委任）（30分）

実装完了後、以下を Keisuke に委任:

1. 既存の13年目セーブ（梅ヶ丘みのり組がある）をロード → 数週進めて F03 系がリーダー退団時に発動するか（意図的にリーダーを解雇 or 引退週を待つ）
2. 新規ゲームで rosterSize 11 超え → bond 高い3人以上 → F01 モーダルが翌週開幕で出るか
3. F01 モーダル: A/B/C 各選択肢を押して派閥成立/不成立/静観の結果演出を確認
4. F02 発生条件（2クラスタ rivalry 中央値 30+）を手元で作るのは難しいので、このシナリオは auto-sim ログで発火シードを特定してもらう
5. F03 軽量モーダルの流れ確認: ナレーション → 残メンバーセリフ → branch 結果

### Task 9: auto-sim 検証（15分）

Phase 3a は tickWeek パイプライン＋新イベント追加で**数値に影響する**ため、フックで自動実行される 100シーズン（5シード×20シーズン）に加えて:

```bash
node test/auto-sim.js 100 42
node test/auto-sim.js 100 7919
```

2シード × 100シーズン ALL CLEAR を確認。派閥系の `[WM Faction]` ログで F01/F02/F03 が実際に発動しているか（発動回数が 0 でないか）を目視。

---

## 完了時のチェックリスト

### 機能

- [ ] F01 忠誠型結成モーダル: 4シーン＋3択、各選択で spec §9.1 の効果が適用される
- [ ] F02 対立型結成モーダル: 4シーン＋4択、各選択で spec §9.2 の効果が適用される
- [ ] F03 リーダー喪失モーダル: 軽量1シーン＋続き演出、OVR 比率で通常継承/大動揺/解散に自動分岐
- [ ] `authoritativeTag` が F01-A で付与され、派閥オブジェクトに永続保存される
- [ ] F01-B 選択で `factionEventCooldowns` に12週クールダウンが立つ
- [ ] tickWeek で条件成立 → 確率判定 → `_pendingFactionEvent` 経由で翌週モーダル表示のフローが動く
- [ ] セリフ叩き台が最低 spec §11 の4組＋全性格 normal フォールバック分存在する
- [ ] auto-sim が `_pendingFactionEvent` を自動解決して止まらない

### 品質

- [ ] `Engine.factions.*` の既存関数シグネチャに**破壊的変更**がない（追加のみ）
- [ ] `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` のデータ形状に破壊的変更がない（`tags` 追加のみ、マイグレーション対応）
- [ ] セリフに morale/orgPop/trust/bond/MQ 等の内部トークンが混入していない
- [ ] ハードコード16進カラーが新規追加されていない
- [ ] CLAUDE.md「テンプレセリフ禁止」に従い、性格ごとに一人称・語尾・感情が区別されている
- [ ] auto-sim 2シード × 100シーズン ALL CLEAR

### 影響確認（非変更）

- [ ] Phase 2 の派閥 UI 3ポイント（DBタブ・ポップアップバッジ・試合カードバッジ）が変わっていない
- [ ] calcMatchAppeal の factionAppeal 分岐が変わっていない
- [ ] 既存の大型イベント B1〜B4 / 契約交渉 / 選択型イベントの挙動が変わっていない
- [ ] `_pendingChoiceEvent` / `_pendingLargeEvent` / `_pendingFactionEvent` の相互排他が効いている（同じ週に複数 pending が立った場合は優先度順に処理）

---

## specs/ 更新フロー

実装完了後:

1. `specs/faction-system-spec-v0.1.md` §17 に「Phase 3a 完了（F01/F02/F03 演出 + セリフ叩き台 + モーダル基盤）」を追記
2. §12 RNG シード表に `0xFA11/0xFA12/0xFA13` を追記
3. §15 オープン項目のうち該当分を「Phase 3a で確定」にマーク
4. `docs/game-system-roadmap.md` に Phase 3a 完了を追記
5. diff を Keisuke に確認してもらう
6. 承認後、この指示書を `plans/archive/faction-phase3a-task.md` に移動

---

## 完了報告時に Keisuke に伝えること

1. **変更ファイル一覧**: `src/factions.js` / `src/management.js` / `src/app.js` / `src/data-faction-dialogue.js`（新規）/ `test/auto-sim.js` / `specs/faction-system-spec-v0.1.md` / `docs/game-system-roadmap.md`
2. **Engine.factions 新規 API 一覧**: pickWeeklyEvent / detectLeaderLoss / resolveF03Branch / applyF01Choice / applyF02Choice / applyF03Result / pickRandomChoice
3. **モーダル UI の実装方針**: careOverlay 流用 vs 新規 のどちらを採ったか、シーン切替の実装
4. **セリフ叩き台の行数**: F01 LEADER / F01 FOLLOWER / F02 LEADER / F03 SURVIVOR の各テーブル行数
5. **auto-sim 結果**: 2シード × 100シーズン ALL CLEAR、および派閥イベント発動回数の集計（F01/F02/F03 何回発動したか）
6. **確認してほしい画面・操作・表示**: Task 8 のシナリオ1〜5
7. **未解決項目1〜4** の採用した最終仕様（デフォルト案のままか、指示があれば変更後の内容）

---

## やらないことリスト（重要）

- ❌ F04〜F08 演出イベント（Phase 3b）
- ❌ 相関図派閥ビューモード（Phase 3c）
- ❌ 派閥絡みの bond/rivalry 週次変動カタログ（Phase 3d）
- ❌ セリフの全アーキタイプ網羅（Phase 3b、Phase 3a は叩き台のみ）
- ❌ `Engine.factions.*` の既存関数シグネチャ破壊的変更
- ❌ `G.factions` / `G.factionHostility` データ形状の破壊的変更（`tags` 追加のみ OK、マイグレーション必須）
- ❌ Phase 2 派閥 UI への干渉（DBタブ・ポップアップバッジ・試合カードバッジ）
- ❌ ハードコード16進カラーの追加
- ❌ 数値を UI に丸見せする演出（CLAUDE.md「数値の丸見せによるスプレッドシートゲーム化」禁止）
- ❌ テンプレセリフ（「やったー！」「くやしい…」の量産）
