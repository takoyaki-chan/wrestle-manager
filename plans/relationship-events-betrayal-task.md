# 離脱・裏切りイベントパッケージ — Claude Code 実装ハンドオフ

**ファイル**: `plans/relationship-events-betrayal-task.md`
**作成日**: 2026-04-26
**対象**: Claude Code
**担当モデル推奨**: Opus（複数システム連動: relationship + title-system + 契約交渉 + UI追加）
**前提**: `plans/cross-org-relationship-rebalance-task.md`（v2.1）が**完了している**こと

---

## 1. このタスクで何をやるか

「契約交渉決裂で他団体に行く」という選手側の決定を、関係値・士気・タイトル・新聞・ドラマすべてに波及する**裏切りイベント**として再設計する。さらに「離脱した元同僚との初対戦」「ベルト持ち出し→奪還挑戦状」までを含めた一連のイベントパッケージを実装する。

### 必ず最初に読むドキュメント

順番に読んでから実装に入ること:

1. **`CLAUDE.md`**（数値哲学、機能追加の判断基準）
2. **`specs/relationship-system-spec-v2.1.md`** §5.2（既存 O-03 移籍退団）— 本タスクで O-03 を細分化する
3. **`specs/relationship-system-spec-v2.2.md`**（本タスクで作成、v2.1 に追記する形）
4. **`specs/title-system-spec-v1.0.md`**（タイトル管理、本タスクで「外部タイトル保持」概念を追加）
5. **`specs/contract-negotiation-spec-v2.0.md`**（契約交渉、本タスクの主トリガー）
6. **`src/relationships.js`** L1336-1662（v2.1 の applyMatchResult 構造を理解）
7. **`src/management.js`** L9672 付近（resolveNegotiation）/ L1612 validateChampion / L6408 processAIContracts

### スコープ

| 対象 | 内容 |
|------|------|
| 関係値仕様 | `specs/relationship-system-spec-v2.2.md` を新規作成（v2.1 + 本タスク追加分） |
| タイトル仕様 | `specs/title-system-spec-v1.0.md` に「外部タイトル保持」セクション追加 |
| 関係値実装 | `src/relationships.js` に `applyContractDepartureBetrayal` などの新ハンドラ追加 |
| 契約交渉連携 | `src/management.js` `resolveNegotiation` から本イベント発火 |
| タイトル連携 | `Engine.title.validateChampion` 拡張で持ち出し50%判定 / `aiOrgs[id].externalTitles[]` 状態追加 |
| 奪還挑戦状UI | `src/index.html` + `src/ui-render.js` に挑戦状発行UI追加 |
| 新聞連動 | 新聞1面・3面でA-4発生時の特別扱い |

### スコープ外

- O-04 引退、O-07 解雇、O-08 突然離脱、O-09 引き抜き — 本タスクでは触らない
- B-1 大会直前離脱、B-2 連鎖離脱、B-4 古巣批判 — 第二弾・別タスク
- C-1 元選手復帰、C-2 残留宣言 — 第二弾・別タスク
- AI団体間でのタイトル移動 — 簡略案のため発生しない（AI団体が保持中のベルトはAI同士で動かない）

---

## 2. 全体の進め方と Phase 進行

| Phase | 内容 | 想定規模 |
|-------|------|:------:|
| 1 | A-1〜A-4 関係値ハンドラ実装、O-03 細分化 | 中 |
| 2 | A-4 ベルト持ち出し50%/置いていき50% 分岐、AI団体外部タイトル状態追加 | 中〜大 |
| 3 | B-3 元同僚vs元同僚 初対戦処理 | 中 |
| 4 | タイトル奪還挑戦状システム（発行UI、判定、結果反映） | 大 |
| 5 | 王座決定戦UI（置いていき時のプレイヤー任意発行） | 中 |
| 6 | 新聞連動（A-4 時の特別ヘッドライン）+ auto-sim 検証 | 中 |

各 Phase 完了時に Keisuke さんに報告して承認を得てから次へ進む。

---

## 3. Phase 1: A-1〜A-4 関係値ハンドラ実装

### 3-1 イベント定義（仕様書 v2.2 §5.2 改訂版）

既存 O-03 を以下のように細分化:

| ID | イベント | トリガー条件 | 既存挙動からの差 |
|----|---------|-------------|----------------|
| O-03a | 退団→FA行き | 契約決裂 + 移籍先がFAプール | bond -15〜-8、rivalry +5〜+10（**現状O-03と同じ、据え置き**） |
| O-03b（A-1） | 退団→他団体移籍（基本） | 契約決裂 + 移籍先がAI団体 | **新設**、§3-2 参照 |

### 3-2 加算モデル（§4.4 サーチャージ式）

```
function applyContractDepartureBetrayal(state, departingFighterId, toOrgId, rng):
  // departingFighterId は離脱選手、roster は残留選手のid配列
  
  const fighter = ALL.find(f => f.id === departingFighterId)
  const isAce = fighter._isAce === true || (fighter.popularity || 0) >= 75
  const isRivalOrg = recentlyClashedWith(state, state.orgId, toOrgId, 24) // 直近24週で対抗戦/挑戦状/PPV対戦実績
  const isChampion = state.titles?.world?.championId === departingFighterId

  // ── A-1 ベース（必ず発火） ──
  let bondDelta    = -roll(rng, 12, 20)  // -20〜-12
  let rivalryDelta = roll(rng, 8, 15)
  let morDelta = 0, orgPopDelta = 0

  // ── A-2 エースサーチャージ ──
  if (isAce):
    bondDelta    -= roll(rng, 3, 5)    // -5〜-3
    rivalryDelta += roll(rng, 4, 5)
    morDelta     -= roll(rng, 8, 12)   // -12〜-8

  // ── A-3 宿敵団体サーチャージ ──
  if (isRivalOrg):
    bondDelta    -= roll(rng, 5, 6)    // -6〜-5
    rivalryDelta += roll(rng, 7, 10)

  // ── A-4 チャンピオンサーチャージ ──
  let beltCarried = false
  if (isChampion):
    bondDelta    -= 10                  // -10 固定
    rivalryDelta += roll(rng, 12, 15)
    orgPopDelta  -= roll(rng, 3, 5)
    morDelta     -= roll(rng, 10, 15)
    
    // ── ベルト持ち出し判定 50% ──
    if (rng_chance(rng, 0.5)):
      beltCarried = true
      rivalryDelta += roll(rng, 5, 10)  // 持ち出し時の屈辱surcharge
      // タイトル移動は Phase 2 で実装

  // ── キャップ ──
  bondDelta    = Math.max(bondDelta, -35)
  rivalryDelta = Math.min(rivalryDelta, 35)

  // ── 残留選手全員に適用（残留→離脱者の片方向） ──
  const remainingIds = roster.filter(c => c.id !== departingFighterId && !c.injury && !c.isRental).map(c => c.id)
  state = Engine.relationships.applyFromRoster(state, remainingIds, departingFighterId,
                                               { min: bondDelta, max: bondDelta }, // 一律
                                               { min: rivalryDelta, max: rivalryDelta }, rng)
  // 注: applyFromRoster の min/max は同値で渡し、roll はこの関数の頭で済ませているので各残留メンバーには同じ delta が適用される
  // もしメンバー個別にばらけさせたい場合は forEach で個別 roll する設計に変更可能（要相談）

  // ── ロッカールーム士気 ──
  state.lockerRoomMorale = clamp(state.lockerRoomMorale + morDelta, 0, 100)

  // ── orgPop ──
  if (orgPopDelta < 0):
    state.orgPop = clamp(state.orgPop + Engine.orgPop.applyOrgPopChange(orgPopDelta, state.orgPop, null), 0, 100)

  return { state, beltCarried, summary: { bondDelta, rivalryDelta, morDelta, orgPopDelta, isAce, isRivalOrg, isChampion } }
```

### 3-3 配置位置

`src/relationships.js` 内、既存の `Engine.relationships.applyFromRoster` 付近に新ハンドラ `Engine.relationships.applyContractDepartureBetrayal` を追加。

### 3-4 呼び出し元（`src/management.js` `resolveNegotiation`）

契約交渉決裂の処理パスで、移籍先が AI 団体の場合に本ハンドラを呼ぶ。FA行きの場合は既存 O-03a（=現状O-03）処理を維持。

実装イメージ:
```javascript
// resolveNegotiation 内、契約決裂が確定した直後
if (negotiationFailed) {
  if (departureDestination === 'ai_org') {
    const result = Engine.relationships.applyContractDepartureBetrayal(s, fighterId, toOrgId, negRng);
    s = result.state;
    if (result.summary.isChampion && result.beltCarried) {
      // Phase 2 で実装: タイトル移動処理
    }
    // ニュース・ティッカー連動（Phase 6）
  } else {
    // 既存 O-03a 処理（FA行き）
    s = Engine.relationships.applyFromRoster(s, remainingIds, fighterId, { min: -15, max: -8 }, { min: 5, max: 10 }, negRng);
  }
}
```

### 3-5 検証

**Phase 1 完了基準**:
- 契約決裂 + AI団体移籍を発火させ、各条件組み合わせ（A-1のみ / A-1+A-2 / A-1+A-3 / A-1+A-4）で適切な値が出ることをログ確認
- auto-sim 100シーズンで違反0
- 既存 O-03 が壊れていないこと（FA行きケースで bond -15〜-8 が出る）

---

## 4. Phase 2: A-4 ベルト持ち出し / 置いていき分岐

### 4-1 仕様

A-4 発火時、内部で 50% 判定:
- **持ち出し（50%）**: タイトルが AI 団体に移動。プレイヤー側は王座非保持状態
- **置いていき（50%）**: 既存の `validateChampion` 挙動と同じ、王座空位

### 4-2 AI団体外部タイトル状態（簡略案）

`G.aiOrgs[orgId]` に以下を追加:

```javascript
aiOrgs[orgId] = {
  ...,
  externalTitles: [
    {
      titleType: 'world',           // タイトル種別
      championId: fighterId,        // 持ち出した選手のID（AI団体所属になっている）
      acquiredFromOrg: 'player',    // 取得元
      acquiredSeason: state.season,
      acquiredWeek: state.week,
      lastDefenseWeek: null,        // AI同士の防衛戦は発生しないので常にnull
    }
  ]
}
```

### 4-3 `Engine.title.validateChampion` 拡張

現状（L1612-1617）は離脱時に空位返上のみ。これを拡張して持ち出し判定を組み込む。

ただし `validateChampion` は週次ヘルスチェック的に呼ばれているので、**A-4 発火時に外部から明示的に呼ぶ専用関数 `transferTitleToOrg(state, titleType, fighterId, toOrgId)` を新設**する方が安全。

```javascript
// Engine.title 内に追加
transferTitleToOrg(state, titleType, fighterId, toOrgId) {
  const titles = { ...state.titles };
  if (titles[titleType]?.championId !== fighterId) return state; // 念のため整合性チェック
  
  // タイトルを空位扱いに（プレイヤー側はchampionId=null）
  titles[titleType] = { ...titles[titleType], championId: null, defenses: 0, externalHolder: { fighterId, orgId: toOrgId, transferredSeason: state.season, transferredWeek: state.week } };
  
  // AI団体側に外部タイトル登録
  const aiOrgs = { ...state.aiOrgs };
  const targetOrg = { ...aiOrgs[toOrgId] };
  targetOrg.externalTitles = [...(targetOrg.externalTitles || []), {
    titleType,
    championId: fighterId,
    acquiredFromOrg: 'player',
    acquiredSeason: state.season,
    acquiredWeek: state.week,
    lastDefenseWeek: null,
  }];
  aiOrgs[toOrgId] = targetOrg;
  
  return { ...state, titles, aiOrgs };
}
```

### 4-4 既存 `validateChampion` の挙動

A-4 持ち出しの場合、`validateChampion` は呼ばれる前に `transferTitleToOrg` で championId が null になっているため、空位メッセージは出ない。代わりに「持ち出された」専用メッセージをイベントログに追加する（Phase 6 新聞で扱う）。

A-4 置いていきの場合、既存の `validateChampion` がそのまま発火し、空位メッセージが出る。これは設計通り。

### 4-5 検証

- 持ち出しケースで `state.aiOrgs[toOrgId].externalTitles` にエントリが追加されている
- 置いていきケースで既存 validateChampion の空位メッセージが出る
- 50/50 の分布が auto-sim 100シーズンで概ね均衡（45-55%程度）

---

## 5. Phase 3: B-3 元同僚vs元同僚 初対戦

### 5-1 仕様

| 項目 | 値 |
|------|---|
| トリガー | 試合発生時、`orgTimeline.wereColleagues(fighterA, fighterB)` が true、かつ離脱後の **初対戦** |
| 効果（追加） | 両側 rivalry **+6〜+10**、bond **-3〜-1** |
| 適用方法 | 通常の `applyMatchResult` の M-events に**追加**して適用（v2.1 のクロスOrg乗数は別枠で動く） |
| 逓減 | なし（初対戦のみ） |

### 5-2 「初対戦」判定

`h2h[key]` の `matches` を見て、本試合が「離脱以降の初対戦」かを判定:
- `orgTimeline.wereColleagues(A, B)` = true（過去同団体だった）
- 過去の対戦データの中で「両者同団体時代」の対戦は除外（h2h.history を見て、各エントリの両者所属が同じだった対戦をスキップ）
- 離脱以降の対戦カウントが **0回**（この試合が1回目）

### 5-3 実装位置

`applyMatchResult` 内、M-events ループの **末尾**（クロスOrg cap 直前）に追加:

```javascript
// ═══ B-3: 元同僚vs元同僚 初対戦 ═══
if (Engine.orgTimeline?.wereColleagues(state, charIdA, charIdB)) {
  const isFirstMeetSinceDeparture = checkFirstMeetSinceDeparture(state, charIdA, charIdB);
  if (isFirstMeetSinceDeparture) {
    apply('AB', 'firstMeetExColleague', context.stage, -3, -1, 6, 10, false, { skipCrossOrgBondMult: true });
    apply('BA', 'firstMeetExColleague', context.stage, -3, -1, 6, 10, false, { skipCrossOrgBondMult: true });
  }
}
```

`checkFirstMeetSinceDeparture` ヘルパーを `Engine.orgTimeline` に新設。

### 5-4 検証

- A 団体離脱選手 vs 元同僚の初対戦時、bond/rivalry 変動が想定通り
- 2回目以降の対戦では発火しない
- v2.1 のクロスOrg乗数（×1.5 / ×2.0）が同時に効いている（B-3 は乗数対象外で固定）

---

## 6. Phase 4: タイトル奪還挑戦状システム

### 6-1 仕様

| 項目 | 値 |
|------|---|
| 発行可能タイミング | 通常興行週のみ（オフシーズン不可） |
| クールダウン | 離脱後 **12週**、または前回挑戦から **12週** |
| 年間上限 | なし（実質4回/年が最大） |
| 試合形式 | 1試合のみ |
| プレイヤー操作 | 任意のタイミングで挑戦状発行ボタン押下 → 出場選手選択（自団体ロスター1名） |
| 対戦相手 | AI団体に持ち出された旧チャンピオン（externalTitles の championId） |
| 試合結果 | 勝利 → **勝った選手が新王者**、タイトルが自団体に戻る／敗北 → ベルトは AI団体保持継続、12週CD発動 |

### 6-2 状態管理

`G.titles.world.externalHolder` を見て、ベルトが外部にある状態を判定。挑戦履歴は `G.reclaimChallenges` 配列で管理:

```javascript
G.reclaimChallenges = [
  {
    titleType: 'world',
    issuedSeason, issuedWeek,
    challengerFighterId, defenderFighterId,
    result: null | 'win' | 'lose',
    resolvedSeason, resolvedWeek,
  }
]
```

### 6-3 発行UI

社長室タブまたは興行準備画面に「タイトル奪還挑戦状を発行」ボタンを追加。

押下フロー:
1. 「○○団体に持ち出された世界王座を取り戻す挑戦状を発行しますか？」確認モーダル
2. 出場選手選択（自団体ロスター、怪我・レンタル除外）
3. 確定 → 次の通常興行のメインに自動配置

### 6-4 試合処理

- 通常の試合エンジンで実行（`isCrossOrg = true`、stage = 'normal' or 専用 'reclaim' を新設）
- 結果反映:
  - 勝利: `Engine.title.reclaimTitle(state, titleType, newChampId)` で空位状態を解除し、`externalTitles` から該当エントリを削除、自団体 `titles[type].championId = newChampId` をセット
  - 敗北: `reclaimChallenges` に result='lose' を追記、12週CD開始
- 関係値: 勝利時 M-04 / M-CO1 等が通常通り発動（クロスOrg なので v2.1 ルール適用）

### 6-5 検証

- ベルト持ち出し後 12週経過で挑戦状発行ボタンが活性化
- 勝利でタイトルが自団体に戻る、敗北で12週CDが発動
- 12週経過後に再挑戦可能

---

## 7. Phase 5: 王座決定戦UI（置いていき時）

### 7-1 仕様

A-4 置いていき発火 → `validateChampion` で空位返上 → プレイヤーが任意のタイミングで王座決定戦を組める。

| 項目 | 値 |
|------|---|
| トリガー | プレイヤー任意（興行準備画面で「王座決定戦」カードを選択） |
| 出場資格 | `Engine.title.getEligibleChallengers` の上位 2名（既存ロジック流用） |
| 試合形式 | 1試合（タイトルマッチ扱い、stage='title'） |
| 結果反映 | 勝者が新王者、`Engine.title.setChampion` 呼び出し |

### 7-2 実装

興行準備画面（show prep）の試合カード追加 UI に「王座決定戦」オプションを追加。タイトルが空位状態の時のみ活性化。

### 7-3 検証

- A-4 置いていき発火後、興行準備で「王座決定戦」カードが選択可能
- 試合結果でタイトルが復権する

---

## 8. Phase 6: 新聞連動 + auto-sim 検証

### 8-1 新聞対応

A-4 発火時、新聞1面のトップストーリーに専用ヘッドラインを配置:

| 条件 | ヘッドライン例 |
|------|----------|
| A-4 持ち出し | 「衝撃の裏切り — ◯◯がベルトを持って△△団体へ」 |
| A-4 置いていき | 「◯◯が△△団体へ — ベルトは置いて去った」 |
| A-3 単独 | 「因縁の相手へ — ◯◯が△△団体に移籍」 |
| A-2 単独 | 「エース流出 — ◯◯が△△団体へ」 |
| A-1 単独 | 既存 O-03 ニュース流用 |

実装は `src/ui-render.js` 新聞 1面（`_npRenderPage1`）で `state.events` の `[contract-betrayal]` タグを検出してヘッドライン分岐。

### 8-2 auto-sim 検証

100シーズン（10seed × 10season）で:
- A-1 / A-2 / A-3 / A-4 各イベントの発生頻度を集計
- A-4 持ち出し/置いていき分布が 45-55% に収まる
- ベルト奪還挑戦状の発行頻度（プレイヤー側はAIなので発行されないが、シミュレーション内で AI 団体側からの自動応答が組み込まれていれば確認）
- 関係値分布: A-4 発生団体ペアは「敵対」帯（bond <40 + rivalry 60+）に確実に落ちる
- 違反0/エラー0/ゲームオーバー0/5300週完走

### 8-3 完了報告フォーマット

```
## 離脱・裏切りイベントパッケージ 実装完了報告

### 実装サマリ
- Phase 1（A-1〜A-4 関係値）: ✅
- Phase 2（ベルト持ち出し/置いていき）: ✅
- Phase 3（B-3 元同僚初対戦）: ✅
- Phase 4（奪還挑戦状）: ✅
- Phase 5（王座決定戦UI）: ✅
- Phase 6（新聞 + auto-sim）: ✅

### auto-sim 検証結果
- 100シーズン完走、違反0
- A-4 発火回数: XX回（うち持ち出し YY 回 / 置いていき ZZ 回 = X.X% / Y.Y%）
- 奪還挑戦状の平均発行回数: 持ち出し1件あたり N.N 回

### 数値感の確認
- A-1 単独実測値: bond X.X / rivalry Y.Y（仕様書 -20〜-12 / +8〜+15 と一致）
- A-1+A-4 持ち出し実測値: bond X.X (cap到達: Y%)/ rivalry Z.Z (cap到達: W%)

### 変更ファイル
- specs/relationship-system-spec-v2.2.md: 新規作成
- specs/title-system-spec-v1.X.md: §X 外部タイトル保持セクション追加
- src/relationships.js: applyContractDepartureBetrayal、checkFirstMeetSinceDeparture、B-3 適用 (XX行)
- src/management.js: resolveNegotiation 連携、transferTitleToOrg、reclaimTitle (XX行)
- src/ui-render.js: 奪還挑戦状UI、王座決定戦UI、新聞ヘッドライン分岐 (XX行)
- src/index.html: 関連CSS追加 (XX行)

### 残課題 / 次のステップ
- B-1 大会直前離脱、B-2 連鎖離脱、B-4 古巣批判、C-1 元選手復帰、C-2 残留宣言（別タスクで処理予定）
```

---

## 9. 実装上の注意

### 9-1 数値哲学（CLAUDE.md 準拠）

§3-2 の加算モデル数値（A-1 -20〜-12 / A-2 -5〜-3 / A-3 -6〜-5 / A-4 -10固定 等）は**すべてユーザー合意済み**。これらの値を変更する必要が出てきた場合は Keisuke さんに相談してから動かすこと。

### 9-2 RNGシード

新規シード `0xBE60`（A-1〜A-4 全体）/ `0xBE61`（B-3）/ `0xBE62`（ベルト持ち出し50%判定）を割り当てる。既存シードと衝突しないこと。

### 9-3 既存セーブ互換性

- `G.aiOrgs[id].externalTitles` が存在しない既存セーブをロードした場合、初期化マイグレーション `_migrated_external_titles_v1` を追加
- `G.titles.world.externalHolder` が存在しない既存セーブも同様
- `G.reclaimChallenges` も同様

### 9-4 v2.1 との関係

v2.1 のクロスOrg乗数（×1.5 bond低下、×2.0 rivalry）は **試合の applyMatchResult** で発動するもの。本タスクの A-1〜A-4 は **契約交渉決裂時** に発動するもので、適用パスが完全に分離している。

ただし B-3 元同僚初対戦は試合内で発火するため、v2.1 のクロスOrg乗数と同居する。B-3 効果は v2.1 乗数の対象外（固定値）として `skipCrossOrgBondMult: true` を渡すこと。

### 9-5 簡略案の徹底

AI団体に持ち出されたベルトはAI同士で動かない（簡略案）。以下の処理を**実装しない**:
- AI団体での自動防衛戦
- AI同士のタイトル移動
- AI団体間のベルト奪取

挑戦できるのはプレイヤーのみ。

---

## 10. 参考: 既存ファイル位置

| ファイル | 該当箇所 |
|---------|---------|
| `src/management.js` L9672 | `resolveNegotiation` 契約交渉解決 |
| `src/management.js` L1612 | `Engine.title.validateChampion` 王座空位判定 |
| `src/management.js` L1566 | `Engine.title.setChampion` 王座セット |
| `src/management.js` L1626 | `Engine.title.getEligibleChallengers` 挑戦資格判定（流用） |
| `src/management.js` L6408 | `processAIContracts` AI団体側の契約処理 |
| `src/relationships.js` L1336 | `applyMatchResult`（B-3 適用箇所） |
| `src/relationships.js` L2330 付近 | `Engine.orgTimeline.wereColleagues` 過去同僚判定 |
| `src/ui-render.js` `_npRenderPage1` | 新聞1面（A-4 ヘッドライン分岐） |

---

**指示書終わり**
