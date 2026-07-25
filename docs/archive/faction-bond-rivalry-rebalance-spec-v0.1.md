# 派閥イベント bond/rivalry リバランス仕様 v0.1 (DRAFT)

作成: 2026-05-04
対象: F01〜F08 の全選択結果における選手間 bond/rivalry の動かし方
背景: 現状 F07 を中心に派閥イベントは trust(個人→団体)のみで、選手間 bond/rivalry を全く動かしていない。派閥イベントが h2h ネットワーク・因縁列伝・相関図から切り離され、派閥が経営レイヤー単独の機能になっている。

## 設計原則

1. **2 者が特定できるイベントだけ動かす**。派閥全体・派閥間に対する事象は trust/hostility に任せ、bond/rivalry は当事者ペアが明確なときだけ。
2. **スケールは試合 1 回の 1/3〜1/2**。試合 1 回で bond ±5〜8 / rivalry +12〜18 動くのに対し、派閥イベントは **bond ±2〜4 / rivalry ±3〜8** を上限。
3. **同一イベントで bond と rivalry を同時に逆方向に動かさない**。1 イベントで動かすのは片方の軸のみ。
4. **方向は「社長介入の感情的解釈」に揃える**:
   - 注意/介入 → 標的の rivalry が当事者視点で微減(火種が処理された安心感)、リーダー視点では rivalry 微増(口出し苛立ち)もありうる
   - 黙認 → 標的の rivalry 微増、メンバー間 bond 微増
   - 個別ケア → 標的→リーダー rivalry 微減のみ
5. **F02/F07 の DEMAND_*/INCIDENT_HEEL_PROVOKE 等、対象が居ないイベントは bond/rivalry を動かさない**(数値暴走防止)。

## 動かす対象一覧

### 整備済(現状維持)
- **F01** A: `_applyBondBetweenMembers` でメンバー間 bond+
- **F01** B: フォロワー→リーダー bond-
- **F06** A: 派閥間 bond+
- **F08**: 試合本体で動くため不要

### 動かさない(意図的)
- **F02 抗争勃発**(全 choice): 派閥対派閥の事象。試合で動く
- **F05 据え置き**(分裂回避時)
- **F07 リーダー単独系**: DEMAND_MAIN / DEMAND_MONEY / DEMAND_RECOGNITION / OBSERVE_ABSENCE / OBSERVE_FAN_PRESSURE / INCIDENT_HEEL_PROVOKE
- **F03 dissolution**: 派閥消滅は全体イベント

## 新規追加レンジ表

凡例: 数値はすべて `Engine.rng.float` ベースの整数レンジ。`+`は上昇、`-`は減少。

### F03 リーダー交代

| branch | 動かす関係 | 軸 | レンジ |
|---|---|---|---|
| succession(平和的交代) | 後継→旧リーダー | bond | +2〜+4 |
| 下克上(force_takeover) | 後継→旧リーダー | rivalry | +5〜+8 |
| 下克上 | 旧リーダー→後継 | rivalry | +3〜+6 |

### F04 寝返り誘い

| choice | 動かす関係 | 軸 | レンジ |
|---|---|---|---|
| A 寝返らせる | 対象→旧リーダー | rivalry | +5〜+8 |
| A 寝返らせる | 旧派閥メンバー→対象 | bond | -3〜-5 |
| A 寝返らせる | 対象→敵対派閥リーダー | bond | +2〜+4 |
| B 面談で慰留 | 対象→旧リーダー | bond | +1〜+3 |
| C 告げ口 | 対象→旧リーダー | rivalry | +10〜+15(現状維持) |
| C 告げ口 | 旧リーダー→対象 | rivalry | +3〜+5 (新規) |

### F05 自然分裂

| branch | 動かす関係 | 軸 | レンジ |
|---|---|---|---|
| 自然分裂発火時 | 離脱組⇄残留組(全ペア両方向) | bond | -2〜-4 |
| 自然分裂発火時 | 首謀者→旧リーダー | rivalry | +3〜+5 |

### F07 INCIDENT_BOUNDARY(派閥の壁)

対象: leader, tName(派閥外の標的)

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 注意する | tName→leader | rivalry | -2〜-4 |
| A 注意する | leader→tName | rivalry | +1〜+3(口出しされた逆効果) |
| B 流す | tName→leader | rivalry | +3〜+5 |
| B 流す | tName→派閥メンバー(各人) | rivalry | +1〜+3 |
| B 流す | 派閥メンバー間 | bond | +1〜+2(社長は我らの側) |

### F07 OBSERVE_RIVAL_HEAT(派閥外への当たり)

対象: leader, tName

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 介入する | tName→leader | rivalry | -3〜-5 |
| A 介入する | leader→tName | rivalry | +2〜+3 |
| B 黙認する | tName→leader | rivalry | +4〜+6 |
| B 黙認する | leader→tName | rivalry | +2〜+4 |
| C 別ルートで諭す | tName→leader | rivalry | -2〜-3 |

### F07 OBSERVE_INTERNAL_RANK(内部格付け争い)

対象: leader, 中位メンバー(targets, 最大2名)

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 介入する | targets→leader | bond | +1〜+2 |
| B 黙認する | targets→leader | rivalry | +2〜+4 |
| B 黙認する | targets 同士 | rivalry | +2〜+3 |
| C 別ルートで諭す | targets→leader | bond | +1〜+2(微温) |

### F07 OBSERVE_TRAINING_HARD(過度な追い込み)

対象: leader, 追い込まれているメンバー(targets)

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 追い込み止める | targets→leader | bond | +1〜+2 |
| B 黙認 | targets→leader | rivalry | +2〜+3(or 諦め) |
| C コーチ経由 | targets→leader | bond | +1 |

### F07 INCIDENT_BONDING(派閥内結束)

対象: 派閥メンバー全員, 派閥外全員

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A たしなめる | 派閥メンバー間 | bond | -1〜-2 |
| A たしなめる | 派閥メンバー⇄派閥外(全ペア) | bond | +1 |
| B 見守る | 派閥メンバー間 | bond | +2〜+3 |
| B 見守る | 派閥メンバー→派閥外 | bond | -1〜-2 |

### F07 DEMAND_ABSTRACT(リーダー要求)

対象: leader, 派閥外, (C のみ)別幹部 altExec

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 権威認める | 派閥外→leader | rivalry | +3〜+5 |
| B 釘を刺す | leader→社長…は trust 領域。新規追加なし |  |  |
| C 別幹部立てる | 旧leader→altExec | rivalry | +5〜+8 |
| C 別幹部立てる | altExec→旧leader | rivalry | +2〜+4 |

## ヘルパーの再利用

`factions.js` 既存の以下を使う:
- `_applyBondDirected(state, fromId, toId, delta)`
- `_applyBondBetweenMembers(state, memberIds, delta)`
- `_applyRivalryDirected(state, fromId, toId, delta)`
- `_applyRivalryBetweenMembers(state, memberIds, delta)`

「派閥メンバー⇄派閥外」のような片方が大集団のケースは、メンバー数 N × 非メンバー数 M 全ペアではノイズ過大なので、**非メンバーは OVR 上位 4 名に限定**して両方向適用する(F07 OBSERVE_ABSENCE 既存の慣行に合わせる)。新規ヘルパー `_applyBondBetweenGroups(state, groupAIds, groupBIds, delta)` を追加し、両グループから最大 4 名ずつをサンプル(roster 順)して全ペア両方向に当てる。

## impactSummary 表記

選手間関係の変動はモーダルに 1 行集約で出す(細かいペア表示は煩雑):
- `${tName} → ${leaderName} 因縁` `+3` のような形(rivalry は「因縁」、bond は「絆」と表記)
- 内部変数名 `bond/rivalry` はプレイヤー向け文言には出さない。impactSummary は **絆 / 因縁** 表記で統一。

## 検証

- 50 シーズン × 1〜2 回の auto-sim で以下を確認:
  - bond/rivalry 平均が現状から ±5 以上動いていないこと
  - bond=100 や rivalry=100 で飽和するペアが極端に増えていないこと
  - validateGameState 違反 0 件

## 実装順

1. `_applyBondBetweenGroups` ヘルパー追加(factions.js)
2. F07 全 incidentType に bond/rivalry 適用ブロックを追加(applyF07Choice 内)
3. F04 A/B、F03 succession/下克上、F05 自然分裂 に追加
4. impactSummary を 絆/因縁 表記に統一
5. auto-sim 50 シーズン × 2 回で確認
6. specs/ に確定版を移す(faction-bond-rivalry-spec-v1.0.md)
