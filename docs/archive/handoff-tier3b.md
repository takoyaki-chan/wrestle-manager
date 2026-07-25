# Tier3B 大穴埋め作業 引き継ぎ

## 現在の状況

レッスルマネージャーのセリフデータ拡張作業の途中。
Session F + TIER2 + バトル系穴埋め + Tier3A は Claude Code で実装完了済み。
次のフェーズ **Tier3B(シャイ/丁寧、感情的/蠱惑 の広範欠落補完)** に着手するところで、
チャットが重くなったため次セッションに持ち越し。

## やること

最新の `docs/archive/xlsx-old/dialogue-all-main.xlsx`(旧パス: `dialogue-all-main.xlsx`、Claude Code 反映後の版)に存在する
**シャイ/丁寧** と **感情的/蠱惑** の組合せ欠落を全て埋める。

**総計 634 行**(調査済み、確定数値)

## ソース別の不足行数

| ソース | 不足行数 |
|---|---|
| CARE_REACTION_DIALOGUES | 72 |
| GLIMPSE_B_LINES | 56 |
| CHOICE_EVENT_DIALOGUES | 44 |
| GLIMPSE_A_LINES | 42 |
| LARGE_EVENT_DIALOGUES | 40 |
| RETIREMENT_LINES | 32 |
| CONTRACT_NEGOTIATION_LINES | 30 |
| JUNIOR_TOURNAMENT_LINES | 28 |
| NOTIF_DIALOGUES | 24 |
| AWARD_LINES | 21 |
| RETIRE_ACCEPT_LINES | 20 |
| RIVALRY_CONFRONTATION_LINES | 20 |
| SNAPSHOT_TEXTS | 19 |
| NEGOTIATE_LINES | 16 |
| RETIRE_REFUSE_LINES | 16 |
| RIVALRY_RESOLUTION_LINES | 16 |
| SLUMP_START_LINES | 16 |
| RIVALRY_CONFRONTATION_LINES_70 | 12 |
| SCOUT_SIGNING_LINES | 12 |
| RETAIN_LINES | 10 |
| BITTER_RESOLUTION_LINES | 8 |
| FAN_EXPECT_REACTIONS | 8 |
| GOODRIVAL_RESOLUTION_LINES | 8 |
| WAR_POST_DIALOGUE | 8 |
| ENDING_LINES | 6 |
| PPV_OPPONENT_LINES | 6 |
| UPSET_RIVALRY_LINES | 6 |
| BREAKTHROUGH_LINES | 4 |
| GLIMPSE_HOTSTREAK_END_LINES | 4 |
| MOTIVATION_LOSS_LINES | 4 |
| MOTIVATION_RECOVERY_LINES | 4 |
| PPV_SUMMIT_VICTORY_LINES | 4 |
| RIVALRY_CONFRONTATION_LINES_90 | 4 |
| SLUMP_END_LINES | 4 |
| WAR_CHALLENGER_DIALOGUE | 4 |
| WAR_DECLINE_DIALOGUE | 4 |
| BT_HINT_LINES | 2 |
| **合計** | **634** |

## 該当キャラ

- **シャイ/丁寧**: 黒江舞、阿部みのり、高島さや(3名)
- **感情的/蠱惑**: 東金沙織、芹沢亜里紗(2名)

## ユーザーの方針

- **案3を選択**: 634行を一気に書く(分割せず1ファイルで)
- 内容は叩き台でOK。後でユーザーがキャラ単位で全セリフを書き直す予定
- 後で書き直すから、品質よりも網羅性優先で進めてよい

## トーン基準

### シャイ/丁寧
- 「あ、あの…」「す、すみません…」のためらい+敬語
- ビッグムーブ、ダメージセリフの shy×polite トーンを参考に
- 「…っ」「…」を多用、声が小さい印象
- 例: 「あ、あの…ありがとうございます…嬉しい、です…」

### 感情的/蠱惑
- 「……っ」の感情噴出 + 妖艶語尾「〜なのよ」「〜だわ」の混合
- 涙ぐみながらの色気 = ギャップの強い独特のトーン
- 既存の感情的キャラのセリフ(東金沙織、芹沢亜里紗の現行セリフ)を参考に
- 例: 「……っ……嬉しい……っ……ふふ、ありがとう……」

## 既存の設計原則(継続)

`dialogue-expansion-tone-guide.md` を参照(docs/ にあるはず)。
特に「原則1: polite のネガティブ感情表現」がシャイ/丁寧 にも応用できる。
- 痛み・疲労系: 敬語ベース + 素の混入
- 怒り・不満系: 敬語の構文を崩す

## 入力ファイル

次セッションでアップロードする必要があるもの:
- `docs/archive/xlsx-old/dialogue-all-main.xlsx`(旧パス: `dialogue-all-main.xlsx`)(最新版、Claude Code 反映後)
- `docs/archive/xlsx-old/dialogue-all-battle.xlsx`(旧パス: `dialogue-all-battle.xlsx`)(バトル系最新版、Tier3B はメイン系のみだが念のため)
- `dialogue-expansion-tone-guide.md` (トーン原則、参考)

## 出力ファイル

- `docs/archive/xlsx-old/tier3b-fixes.xlsx`(旧パス: `tier3b-fixes.xlsx`) (634行、1シートまたはソース別シート)
- `tier3b-fixes-instructions.md` (Claude Code への指示書)

## ファイル構造案

`tier3b-fixes.xlsx` の columns:
```
source | path | personality | archetype | dialogue_text | scene_text | notes
```

GLIMPSE_B_LINES と SNAPSHOT_TEXTS は scene_text も必要。
他は dialogue_text のみ。

## 進め方

1. 次セッションの最初に最新ファイルを再アップロード
2. アシスタントが Tier3B 不足を再確認(数字が変わっていないか念のため確認)
3. ソース順に書いていく(大きい順がいいか、関連順か要相談)
4. 全634行書き終わったら tier3b-fixes.xlsx として出力
5. 指示書 tier3b-fixes-instructions.md も作成
6. Claude Code に投げて反映
7. その後、書き直しフェーズ準備に移行

## 完了済みの作業(参考)

| 作業 | ファイル | 行数 | 状態 |
|---|---|---|---|
| Session F nested sources | dialogue-expansion-worksheet.xlsx (6シート) | 394 | Claude Code 実装完了 |
| TIER2 fixes (EMOTION/RET_CHAMPION) | dialogue-expansion-worksheet.xlsx (TIER2_FIXES) | 13 | 同上 |
| バトル系穴埋め | battle-fixes.xlsx | 91 | 同上 |
| Tier3A 大穴埋め | tier3a-fixes.xlsx | 124 | 同上 |
| **Tier3B 広範欠落** | **tier3b-fixes.xlsx** | **634** | **次セッションで作成** |

## Tier3B 完了後の次フェーズ

ユーザーの計画:
- 全セリフを最新状態でエクスポート
- ユーザーがキャラ単位で Excel を見て、変なセリフを直していく
- 「既存の良いセリフは残し、変なところだけ直す」方針
- キャラ別に並べ替えた Excel が欲しい(現在は出典別)

なので Tier3B 完了後は:
1. Claude Code に最新エクスポート依頼
2. キャラ別ソート版の Excel 出力依頼
3. ユーザーがキャラ単位の書き直し作業に入る

## 補足事項

- バトル系の方針: ダメージボイスは属性のみ、それ以外のバトル系は性格×属性
- `> 2` / `> 3` バリエーション拡充パスは Tier3B 対象外(ユーザーが「使われていないなら空欄でOK」と判断済み)
- ユーザーは Notion 書き込み禁止
- Excel の見やすさを重視(列幅、word wrap)
