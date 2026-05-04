# 派閥イベント bond/rivalry 連動仕様 v1.0

実装完了: 2026-05-04
対象: F03/F04/F05/F07 の選択結果における選手間 bond/rivalry 連動
根拠ドキュメント: `docs/faction-bond-rivalry-rebalance-spec-v0.1.md` (DRAFT 起案)

## 1. 設計原則

1. **2 者が特定できるイベントだけ動かす** — 派閥対全体・派閥対派閥の事象は trust(個人→団体) と hostility(派閥間対立度) に任せ、選手間 bond/rivalry は当事者ペアが明確なときだけ動かす。
2. **スケールは試合 1 回の 1/3〜1/2** — 試合 1 回で bond ±5〜8 / rivalry +12〜18 動くのに対し、派閥イベントは bond ±2〜4 / rivalry ±3〜8 を上限とする。
3. **同一イベントで bond と rivalry を同時に逆方向に動かさない** — 1 イベントの主動作は片方の軸のみ(関係性ノイズの抑制)。ただし「介入で当事者は冷えるが、リーダーは口出しされて苛立つ」のような対称的な動きは許容(同軸両方向)。
4. **方向は社長介入の感情的解釈に揃える**:
   - 注意/介入 → 標的の rivalry が当事者視点で微減(火種が処理された安心感)、リーダー視点では rivalry 微増(口出し苛立ち)もありうる
   - 黙認 → 標的の rivalry 微増、メンバー間 bond 微増(社長は我らの側)
   - 個別ケア(rebuke/別ルート) → 標的→リーダー rivalry 微減のみ
5. **動かさないイベント**:
   - F02 抗争勃発(全 choice): 派閥対派閥の事象。試合本体で動く
   - F05 据え置き(分裂回避時)
   - F07 リーダー単独系: DEMAND_MAIN / DEMAND_MONEY / DEMAND_RECOGNITION / OBSERVE_ABSENCE / OBSERVE_FAN_PRESSURE / INCIDENT_HEEL_PROVOKE
   - F03 dissolution: 派閥消滅は全体イベント

## 2. 共通ヘルパー

- `_applyBondDirected(state, fromId, toId, delta)` — 既存
- `_applyBondBetweenMembers(state, memberIds, delta)` — 既存
- `_applyRivalryDirected(state, fromId, toId, delta)` — 既存
- `_applyRivalryBetweenMembers(state, memberIds, delta)` — 既存
- **`_applyAxisBetweenGroups(state, groupAIds, groupBIds, axis, delta, sampleSize=4)`** — 新規。2 グループ間の axis(bond|rivalry) を両方向で動かす。各グループ最大 sampleSize 名(roster 順) でサンプリングしてノイズを抑える。

## 3. 動かすイベント別レンジ表

### F03 リーダー交代(既存実装をそのまま継続)

| branch | 関係 | 軸 | レンジ |
|---|---|---|---|
| succession | 後継→旧リーダー | bond | +3〜+5 |
| turmoil | 残留メンバー間 | bond | -5〜-10 |
| turmoil | 後継→旧リーダー | bond | +10〜+15(残像の美化) |

### F04 寝返り誘い

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 寝返らせる | 対象→旧リーダー | rivalry | +5〜+8 |
| A 寝返らせる | 残留メンバー(旧リーダー除く)→対象 | bond | -3〜-5 |
| A 寝返らせる | 対象→敵対派閥リーダー | bond | +2〜+4 |
| B 慰留 | 対象→旧リーダー | bond | +1〜+3 |
| C 告げ口 | 対象→旧リーダー | rivalry | +10〜+15(既存) |
| C 告げ口 | 旧リーダー→対象 | rivalry | +3〜+5(新規・失望) |

### F05 自然分裂

| branch | 関係 | 軸 | レンジ |
|---|---|---|---|
| 自然分裂発火 | 離脱組⇄残留組(両方向、各最大 4 名サンプル) | bond | -2〜-4 |
| 自然分裂発火 | 首謀者→旧リーダー | rivalry | +3〜+5 |

### F07 INCIDENT_BOUNDARY(派閥の壁)

対象: leader, tName(派閥外の標的)

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 注意する | tName→leader | rivalry | -2〜-4 |
| A 注意する | leader→tName | rivalry | +1〜+3 |
| B 流す | tName→leader | rivalry | +3〜+5 |
| B 流す | tName→派閥メンバー(各人) | rivalry | +1〜+3 |
| B 流す | 派閥メンバー間 | bond | +1〜+2 |

### F07 OBSERVE_RIVAL_HEAT(派閥外への当たり)

対象: leader, tName

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 介入 | tName→leader | rivalry | -3〜-5 |
| A 介入 | leader→tName | rivalry | +2〜+3 |
| B 黙認 | tName→leader | rivalry | +4〜+6 |
| B 黙認 | leader→tName | rivalry | +2〜+4 |
| C 別ルートで諭す | tName→leader | rivalry | -2〜-3 |

### F07 OBSERVE_INTERNAL_RANK(内部格付け争い)

対象: leader, 中位メンバー(targets, 通常 2 名)

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 介入 | targets→leader | bond | +1〜+2 |
| B 黙認 | targets→leader | rivalry | +2〜+4 |
| B 黙認 | targets 同士 | rivalry | +2〜+3 |
| C 別ルートで諭す | targets→leader | bond | +1〜+2 |

### F07 OBSERVE_TRAINING_HARD(過度な追い込み)

対象: leader, 追い込まれているメンバー(targets)

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 追い込み止める | targets→leader | bond | +1〜+2 |
| B 黙認 | targets→leader | rivalry | +2〜+3 |
| C コーチ経由 | targets→leader | bond | +1 |

### F07 INCIDENT_BONDING(派閥内結束)

対象: 派閥メンバー全員, 派閥外全員

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A たしなめる | 派閥メンバー間 | bond | -1〜-2 |
| A たしなめる | 派閥メンバー⇄派閥外(両方向、各最大 4 名サンプル) | bond | +1 |
| B 見守る | 派閥メンバー間 | bond | +2〜+3 |
| B 見守る | 派閥メンバー→派閥外(片方向、各最大 4 名サンプル) | bond | -1〜-2 |

### F07 DEMAND_ABSTRACT(リーダー要求)

対象: leader, 派閥外, (C のみ)別幹部 altExec

| choice | 関係 | 軸 | レンジ |
|---|---|---|---|
| A 権威認める | 派閥外→leader(最大 4 名サンプル) | rivalry | +3〜+5 |
| C 別幹部立てる | 旧leader→altExec | rivalry | +5〜+8 |
| C 別幹部立てる | altExec→旧leader | rivalry | +2〜+4 |

## 4. impactSummary 表記

選手間関係の変動はモーダルに集約表示。プレイヤー向け文言には内部変数名 `bond/rivalry` を出さず、**絆 / 因縁** 表記で統一する。

例: `${tName} → ${leaderName} 因縁` `+3` / `${factionName} メンバー間 絆` `微増`

## 5. 検証

- auto-sim 50 シーズン × 2 シード(seed 1, 2) で実施
- 結果: 違反 0 件、ALL CLEAR、orgPop/funds 推移にも異常傾向なし
- 関係性フラグ(F-1〜F-7)の頻度は v1.0 導入前後で変化なし(派閥イベント発火頻度自体が低いため)

## 6. 既知の限界 / 後続検討

- F02 派閥抗争勃発と F05 分裂回避は意図的に bond/rivalry 不変。試合本体側で動くため二重計上回避。
- 大集団ペア(派閥メンバー × 派閥外)は 4 名サンプルで打ち切る。これにより roster の上位選手が偏ってサンプルされる傾向あり。将来的にランダム抽選 or OVR ベース選抜に変更余地あり。
- F03 turmoil は既存実装の「残像の美化」(後継→旧リーダー bond +10〜+15) を継承。下克上後のリスペクト/憎悪の方向性は別途デザイン議論余地あり。
