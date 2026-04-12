# 引き継ぎ: 鷹揚(composed)セリフ追加

## 完了済み

- `ARCHETYPE_LABELS` に `composed: '鷹揚'` 追加
- `management.js` L7169 ホワイトリストに `'composed'` 追加
- `data.js` 44人の personality/archetype 更新（composed 20人）

### セッションA: 表彰・因縁系（完了）
- コミット `29ca3dc`: AWARD_LINES + RIVALRY_CONFRONTATION_LINES(attacker全6 + defender全6 + fateAttacker全6 + fateDefender全6)
- コミット `29ca3dc` に含む: RIVALRY_RESOLUTION_LINES, GOODRIVAL_RESOLUTION_LINES, BITTER_RESOLUTION_LINES, RIVALRY_CONFRONTATION_LINES_70, RIVALRY_CONFRONTATION_LINES_90, RIVALRY_MATCH_REACTION, UPSET_RIVALRY_LINES

### セッションB: 引退・交渉系（完了）
- コミット `b56f7c2`: RETIRE_ACCEPT_LINES(5種), RETIRE_REFUSE_LINES(4種), RETAIN_LINES(4種), RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE
- 前セッション完了分: NEGOTIATE_LINES(4種), CONTRACT_NEGOTIATION_LINES(15種), RETIREMENT_LINES(8種 A1-A4,B1-B4)
- auto-sim 100シーズン ALL CLEAR

### セッションC: 試合・対抗戦・JT系（完了）
- コミット `508f448`: PPV_SUMMIT_VICTORY_LINES, PPV_OPPONENT_LINES, WAR_VICTORY_LINES, WAR_CHALLENGER_DIALOGUE, WAR_DECLINE_DIALOGUE, WAR_POST_DIALOGUE(result_lose+result_win), JUNIOR_TOURNAMENT_LINES(summon/preMatch/postMatchWin/preFinal/champion/postWin/postLose)
- スキップ: PPV_HYPE_TEMPLATES, BESTMATCH_FLAVOR（アーキタイプ別ではないテンプレ）
- auto-sim 20シーズン ALL CLEAR

### セッションD: イベント系（完了）
- コミット `3285cb8`: +279行
- NOTIF_DIALOGUES (N1/N2/N3/N4/N5_warning/N5_low) — 全6性格の normal/bold/earnest ブロックに composed:
- CARE_REACTION_DIALOGUES — bonus/costume/trainer/media/special_treatment/encourage/encourage_high_trust/refresh_leave/party/camp 全10種
- CHOICE_EVENT_DIALOGUES — S1〜S6, E1, E6, S_boycott, S_grumble, S_sns
- LARGE_EVENT_DIALOGUES — B1, B2_fighter1, B2_fighter2, B4, B4_cm/B4_gravure/B4_variety/B4_brand/B4_fashion/B4_fan
- VOLUNTARY_STAY_LINES — 全6性格
- CAMP_FLAVOR_TEXTS はアーキタイプ別ではない（プレーン配列）のでスキップ
- auto-sim 20シーズン ALL CLEAR

## 残作業: セリフ本体の追加

`data.js` と `ui-common.js` の各 `_LINES` ブロックに `composed:` エントリを追加する。
口調ルールは **`specs/oyou-style-guide.md`** を必ず参照。

### セッション分割案

| セッション | 対象 | 概要 | 状態 |
|---|---|---|---|
| A | AWARD_LINES, RIVALRY_*_LINES | 表彰・因縁系 | ✅ 完了 |
| B | RETIREMENT系, NEGOTIATE系 | 引退・交渉系 | ✅ 完了 |
| C | PPV_*, WAR_*, JUNIOR_TOURNAMENT_* | 試合・対抗戦・JT系 | ✅ 完了 |
| D | NOTIF_*, CHOICE_*, LARGE_EVENT_*, VOLUNTARY_STAY_* | イベント系 | ✅ 完了 |
| E | BT_HINT, BREAKTHROUGH, SLUMP, MOTIVATION, GLIMPSE, ENDING, SNAPSHOT | 小物系 | ✅ 完了 |
| F | ui-common.js の SCOUT_SIGNING_LINES 等 | UI共通セリフ | ✅ 完了 |
| - | relationships.js 相性表 + management.js 仕事適性 | 任意対応 | ✅ 完了 |

### セッションE: 小物系（完了）
- コミット `e1b7e4c`: +204 composed エントリ (543→747)
- BT_HINT_LINES, BREAKTHROUGH_LINES, SLUMP_START_LINES(4トリガー), SLUMP_END_LINES, MOTIVATION_LOSS_LINES, MOTIVATION_RECOVERY_LINES, ENDING_LINES, SNAPSHOT_TEXTS(G1-G4/R2-R5/breakthrough/warVictory), GLIMPSE_A_LINES(全10帯), GLIMPSE_HOTSTREAK_END_LINES, GLIMPSE_B_LINES(GL-01〜GL-03)
- auto-sim 20シーズン ALL CLEAR

### セッションF: UI共通セリフ（完了）
- コミット `499a351`: ui-common.js SCOUT_SIGNING_LINES 全8サブキー +48 composed エントリ
- auto-sim 20シーズン ALL CLEAR

### 任意対応（完了）
- コミット `cc34375`: relationships.js ARCHETYPE_BOND_MATRIX (composed×cool +2, ×polite +2, ×delinquent -3, ×composed +1) + management.js _TALENT_ARCHETYPE_BONUS (brand/fan に composed 追加)
- auto-sim 20シーズン ALL CLEAR

### 全作業完了

composed エントリ総数:
- data.js: 747
- ui-common.js: 48
- **合計: 795 エントリ**

全セッション A〜F + 任意対応 完了。追加作業なし。
