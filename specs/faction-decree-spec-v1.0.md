# 派閥解散命令 / 派閥の封印 spec v1.0

確定日: 2026-07-27
実装: 完了（同日）

---

## 1. 何のための機能か

派閥のイベントを煩わしいと感じるプレイヤーが、派閥システムそのものを止められるようにする。

「設定でオフ」ではなく **社長室の決裁書**として出す。理由は、社長の権限行使という
このゲームの既存の語彙にそのまま乗るため（設定画面にするとドラマが消える）。

---

## 2. 書類定義（`DECISION_DOCS.faction_decree` / src/data.js）

| 項目 | 値 |
|---|---|
| id | `faction_decree` |
| label | 派閥解散命令 |
| category / categoryLabel | `hr` / 人事 |
| icon | ⚖️ |
| cost | 0（無料） |
| decisionCost | 2 |
| activationCondition | `faction_exists_or_sealed` |
| cooldown | 0 |
| effect.target | `faction`（新設。individual / team / pair と並ぶ4つめ） |

`DECISION_DOC_ORDER` の末尾に追加。

### 2.1 発動条件 `faction_exists_or_sealed`（src/management.js `checkActivation`）

次のいずれかで机に出る。

1. 既に封印中（＝解除したい）
2. 派閥が1つ以上ある（＝解散させたい）
3. 派閥は無いが、非レンタルのロスターが `FACTION_CONFIG.minRosterSize` 以上（＝先回りして禁じたい）

ロスターが派閥発生規模に届いていないうちは伏せる。存在しないものを禁じる書類にしないため。

---

## 3. 処置（`options.mode`）

モーダルが状況に応じて出し分ける。

| 状況 | 出る処置 |
|---|---|
| 封印中 | `unseal`（禁止を解く）のみ |
| 派閥がある | `dissolve`（解散させる） / `seal`（解散し、以後認めない） |
| 派閥が無い | `seal`（以後認めない）のみ |

---

## 4. 代償の設計

**封印そのものは無料。代償が生まれるのは「今ある派閥を潰すとき」だけ。**

派閥を煩わしいと感じるプレイヤーが、まだ何も起きていないうちに先回りして封じるのを罰しない。
一方、育った派閥を上から畳めば、その分は払う。

| 対象 | 変動 | 根拠 |
|---|---|---|
| 元メンバー全員 | trust −6 / 相互 bond −5〜−10 | 既存 `_dissolveFaction` の自然解散と同じ実費 |
| リーダー（追加） | trust −(2 + 6 × momentum/100)、momentum が負なら −2 | 自分が束ねた場所を上から畳まれる痛み。**勢いに乗っていた派閥ほど深い**（既に空中分解しかけていた派閥のリーダーは痛手が浅い）。固定値を置かないのはここに説得力を持たせるため |
| ロッカーの空気 | −(2 + 5 × 畳まれた人数 / 在籍数) | 解散を見ていた側にも波及する。3人の派閥ひとつと、ロスターの半分を巻き込む解散が同じ重さになるのはおかしいため |

先回りの `seal`（畳む対象が無い）と `unseal` では、trust もロッカーの空気も動かない。

---

## 5. 封印の効き方

`state.factionsSealed`（真偽値）1つ。

`tickWeek` の派閥ブロック冒頭でパイプライン全体をスキップする。
`Engine.factions.dissolveAllByDecree` が `factions` を空にし、進行中の予約も畳んでいるので、
**週次処理を回さないだけで系全体が静止する**。

個別の分岐を各所に撒く必要はない。試合 appeal・F02 ignite・抗争ポイント・派閥内挑戦戦などの
派閥フックは例外なく `factions.length > 0` か `(state.factions || [])` で守られているため。

### 5.1 畳む対象（`dissolveAllByDecree`）

- 削除するキー: `_pendingFactionEvent` / `_pendingF09` / `_pendingInternalChallenge` /
  `_pendingF08Directive` / `_pendingF08Aftermath` / `_pendingF07Directive` /
  `_pendingForceCloseRivalry` / `_pendingFactionJoinNotices`
- 空にするキー: `factionHostility` / `factionRivalryPoints` / `factionInternalPoints` /
  `factionReconciliationStreak` / `factionEndlessStreak` / `factionEventCooldowns` /
  `f02MediationWatches` / `_commonEvent7PairCooldowns` / `_commonEventTeamCooldownUntil`
- `factionPendingIgnite` → `null`

**`factionTimeline`（履歴）は消さない。起きたことは残す。**

### 5.2 解除

`unsealFactions` が `factionsSealed` を落とすだけ。
畳んだ派閥は戻らない（結成条件が再び満たされれば新しく生まれる）。

---

## 6. 見せ方

### 6.1 処置選択モーダル

新規UIは作らない。ボーナス起案4案と同じ `mdl-a-decision-card` グリッドをそのまま使う
（`showFactionDecreeModal` / src/ui-common.js）。

派閥がある場合のみ、下部に赤字で
「畳まれた選手たちの信頼は下がる。とくに束ねていた本人には深く残る」を出す。

### 6.2 結果のセリフ

| reactionKey | 話し手 |
|---|---|
| `faction_decree` | **畳まれた派閥のリーダー本人**（最大の派閥のリーダー） |
| `faction_decree_seal_quiet` | ロスターの誰か（当事者がいない先回りの禁止） |
| `faction_decree_unseal` | ロスターの誰か |

当事者がいない通達でも必ず1人を立てる。団体書類の「参加者◯名」レイアウトに流すと
合宿や慰労会と同じ見た目になり、通達が催しのように見えてしまうため。

セリフは `CARE_REACTION_DIALOGUES`（src/data.js）に personality × archetype で定義。

### 6.3 データベースの派閥タブ

封印中は「派閥の結成を認めていません」を出す。
「まだ生まれていない」と「作らせていない」を書き分け、解除導線（社長室）を明記する。

---

## 7. Common-1 の個別クールダウン（同日の関連修正）

派閥イベントの偏りに対する構造的な手当。詳細は docs/worklog.md 2026-07-27 の項。

`FACTION_CONFIG.commonEventIndividualCooldowns.COMMON_1` は 16 で定義されていたが
**`checkCommon1Conditions` が読んでいなかった**（死に設定）。

さらに、16 は派閥ごとの共通イベント枠 `commonEventFactionCooldown: 24` **以下**なので、
配線しても枠CDに飲まれて何も変わらない。

→ **48 に変更したうえで配線**。

> **不変条件: `commonEventIndividualCooldowns.COMMON_1 > commonEventFactionCooldown`**
> この関係が崩れると個別CDは完全に無効になり、Common-1 がまた共通イベント枠を独占する。
> `test/faction-decree-and-common-cd-test.js` 1-a が守る。

---

## 8. 安全網

`test/faction-decree-and-common-cd-test.js`（全10項目、run-all の QUICK 入り）

1. Common-1 個別CD が枠CDより長い / CD 中は選ばれない / 明ければ選ばれる
2. 解散のみで封印されない / 封印でフラグが立つ / 進行中予約が残らない /
   リーダーがメンバーより深く落ちる / 勢いに比例する / 解除でフラグが消える
3. 封印中は実物の `tickWeek` を回しても派閥が1つも生まれない（対照として封印なしでは起きることも確認）

5通りの故意の破壊がすべて検出されることを確認済み。

---

## 9. 派閥計測モード（auto-sim）

通常の auto-sim では自団体ロスターが平均7.5人までしか育たず `minRosterSize: 10` に届かないため、
**40シーズン回しても派閥イベントは1件も発生しない**（2026-07-27 実測）。

`WM_FACTION_FIXTURE=1 node test/auto-sim.js <seasons> <seed>` でロスターを積み、
末尾に派閥イベントの発生内訳を出す。

```bash
WM_FACTION_FIXTURE=1 node test/auto-sim.js 30 7919
```

※ロスターが `rosterCap` を超えるため `validateGameState` の「キャップ超過」違反が出る。
fixture の副作用であって派閥側の不具合ではない。**整合性チェック目的では使わないこと。**
