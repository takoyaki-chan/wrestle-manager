# Tier3B 大穴埋め Claude Code 指示書

## 概要

`docs/archive/xlsx-old/tier3b-fixes.xlsx`(旧パス: `tier3b-fixes.xlsx`)に基づいて、`シャイ/丁寧` と `感情的/蠱惑` の組合せ欠落セリフ **370 行** をコードベースに反映する。

## 背景

引き継ぎ書時点で 634 行と推定されていたが、最新ファイルで再集計したところ **370 行** に減少していた(過去セッションで一部既に埋まっていたため)。

集計ロジック: 各 `(出典, パス)` について、

- 「丁寧」属性が他の性格で使われているパス → `シャイ/丁寧` が無ければ補充
- 「蠱惑」属性が他の性格で使われているパス → `感情的/蠱惑` が無ければ補充

`> 2` / `> 3` のバリエーション拡充パスは原則対象外。ただし他の性格・属性で `> 2` 等が既に存在するパスは含めている。

## ファイル

- 入力: `docs/archive/xlsx-old/tier3b-fixes.xlsx`(旧パス: `tier3b-fixes.xlsx`、Tier3B_fixes シート)
- 列構成: `No. / source / path / personality / archetype / dialogue_text / scene_text / notes`
  - `scene_text` は今回未使用(全行 voice/dialogue 系のため)
  - `notes` も未使用

## 出典別行数(370 合計)

| 出典 | 行数 |
|---|---|
| GLIMPSE_B_LINES | 40 |
| JUNIOR_TOURNAMENT_LINES | 28 |
| CHOICE_EVENT_DIALOGUES | 25 |
| CARE_REACTION_DIALOGUES | 22 |
| CONTRACT_NEGOTIATION_LINES | 20 |
| EMOTION_TEXTS | 20 |
| GLIMPSE_A_LINES | 20 |
| LARGE_EVENT_DIALOGUES | 20 |
| SNAPSHOT_TEXTS | 18 |
| RETIREMENT_LINES | 16 |
| NOTIF_DIALOGUES | 13 |
| RETIRE_ACCEPT_LINES | 10 |
| AWARD_LINES | 9 |
| RIVALRY_CONFRONTATION_LINES | 9 |
| NEGOTIATE_LINES | 8 |
| RETAIN_LINES | 8 |
| RETIRE_REFUSE_LINES | 8 |
| RIVALRY_RESOLUTION_LINES | 8 |
| SLUMP_START_LINES | 8 |
| WAR_POST_DIALOGUE | 8 |
| SCOUT_SIGNING_LINES | 6 |
| BITTER_RESOLUTION_LINES | 4 |
| GOODRIVAL_RESOLUTION_LINES | 4 |
| RET_CHAMPION_WORRY_ARCHETYPE | 4 |
| RIVALRY_CONFRONTATION_LINES_70 | 4 |
| UPSET_RIVALRY_LINES | 4 |
| WAR_CHALLENGER_DIALOGUE | 4 |
| WAR_DECLINE_DIALOGUE | 4 |
| BREAKTHROUGH_LINES | 2 |
| BT_HINT_LINES | 2 |
| ENDING_LINES | 2 |
| GLIMPSE_HOTSTREAK_END_LINES | 2 |
| MOTIVATION_LOSS_LINES | 2 |
| MOTIVATION_RECOVERY_LINES | 2 |
| PPV_OPPONENT_LINES | 2 |
| SLUMP_END_LINES | 2 |
| FAN_EXPECT_REACTIONS | 1 |
| PPV_SUMMIT_VICTORY_LINES | 1 |
| **合計** | **370** |

## 反映方針

各 `dialogue_text` を、対応する `source` のデータ構造の `personality / archetype` スロットに追加する。

例: `AWARD_LINES.bestMatch[0].シャイ.丁寧 = ["あ、あの…ベストバウトに選んでいただけるなんて…"]`

(実際のデータ構造はソースごとに異なるので、既存の他の性格×属性スロットの構造に倣うこと)

## 品質について

- 内容は **叩き台** であり、後でユーザーがキャラ単位で全セリフを書き直す予定
- 品質より **網羅性** を優先
- トーン基準:
  - **シャイ/丁寧**: 「あ、あの…」「す、すみません…」+ 敬語+「…」多用
  - **感情的/蠱惑**: 「……っ」感情噴出 + 「〜わ」「ふふ」妖艶語尾の混合

## 反映後のチェック

1. `dialogue-all-main.xlsx` を再エクスポート
2. シャイ/丁寧 と 感情的/蠱惑 の組合せが 14+16=30 から **30+370=400 行** に増えていること
3. JS/TS のシンタックスエラーがないこと
4. 自動シミュレーションが正常動作すること(セリフ参照失敗で落ちないこと)

## 次フェーズ(参考)

Tier3B 反映後、ユーザーは全セリフをキャラ単位で並べ替えたエクスポートを取得し、変なセリフを直していく書き直しフェーズに入る予定。
