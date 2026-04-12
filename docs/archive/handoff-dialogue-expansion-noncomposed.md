# 引き継ぎ: セリフ拡張（非composed archetypeコンボ）

## 現状

### 完了分（コミット `f226b38`）
288エントリを26ソースに追加。パッチスクリプト `test/patch-dialogue-gaps.js` で一括挿入。

**対象コンボ**: polite, seductive, ojousama, cool, delinquent × normal/bold/quiet/easygoing/earnest

**完了ソース（Sessions A-E + F flat）**:
- RIVALRY_MATCH_REACTION, BITTER_RESOLUTION_LINES
- RIVALRY_CONFRONTATION_LINES, RIVALRY_CONFRONTATION_LINES_70, RIVALRY_CONFRONTATION_LINES_90
- RIVALRY_RESOLUTION_LINES, GOODRIVAL_RESOLUTION_LINES, UPSET_RIVALRY_LINES
- AWARD_LINES, WAR_VICTORY_LINES, BREAKTHROUGH_LINES, BT_HINT_LINES
- RETIREMENT_LINES, RETIRE_ACCEPT_LINES, RETIRE_REFUSE_LINES
- RETAIN_LINES, NEGOTIATE_LINES, CONTRACT_NEGOTIATION_LINES
- SLUMP_START_LINES, SLUMP_END_LINES, MOTIVATION_LOSS_LINES, MOTIVATION_RECOVERY_LINES
- ENDING_LINES, PPV_OPPONENT_LINES, GLIMPSE_HOTSTREAK_END_LINES

### 残り: Session F nested sources（6ソース）

以下はイベントタイプごとにサブカテゴリが分かれた深いネスト構造。
各サブカテゴリに個別のテーマ文脈があるため、セリフの内容もそれぞれ異なる必要がある。

| ソース | サブカテゴリ数 | 追加コンボ数/サブカテ | 推定エントリ数 |
|--------|--------------|---------------------|-------------|
| NOTIF_DIALOGUES | 6 (N1-N5) | 6 | ~36 |
| CARE_REACTION_DIALOGUES | 6 (bonus,costume等) | 6 | ~36 |
| CHOICE_EVENT_DIALOGUES | 8+ (S1-S6,E1等) | 5-6 | ~40+ |
| LARGE_EVENT_DIALOGUES | 4 (B1,B2x2,B4) | 6 | ~24 |
| GLIMPSE_B_LINES | 10 (GL-01〜GL-10) | 4-7 | ~50+ |
| SNAPSHOT_TEXTS | 6+ (G1-G4,R1-R2) | 7-8 | ~50+ |

推定合計: ~240エントリ

### 追加コンボ一覧（各サブカテゴリ共通パターン）

ほぼ全ソースで共通:
1. **normal/polite**: 9人 — です/ます口調
2. **normal/cool**: 4人 — 短く冷たい ※一部ソースのみ
3. **bold/polite**: 2人 — 強気+敬語
4. **quiet/seductive**: 2人 — 寡黙+蠱惑
5. **easygoing/polite**: 3人 — お気楽+敬語
6. **easygoing/ojousama**: 1人 — お気楽+お嬢様

ソースによって追加:
- bold/seductive, bold/ojousama, earnest/seductive, earnest/ojousama 等

## パッチスクリプトの使い方

`test/patch-dialogue-gaps.js` に新しいソースのパッチを追加して実行:

```bash
node test/patch-dialogue-gaps.js --dry-run   # 確認
node test/patch-dialogue-gaps.js              # 実行
```

### ネストされたソースの追加方法

PATCHES オブジェクトに追加:
```javascript
NOTIF_DIALOGUES: {
  N1: {           // サブカテゴリ
    normal: {     // personality
      polite: ['セリフテキスト']  // archetype: lines
    },
    bold: {
      polite: ['セリフテキスト']
    },
    // ...
  },
  N2: { ... },
  // ...
}
```

### 注意点

1. **FLAT_SOURCES セット**: フラットなソース（サブカテゴリなし）は `FLAT_SOURCES` に登録が必要
2. **既存エントリのスキップ**: スクリプトは既存archetype を自動検出してスキップ
3. **トレイリングカンマ修正**: `]` の後にカンマがない場合を自動検出して修正
4. **composed の前に挿入**: 新エントリは `composed:` の直前に挿入される
5. **構文チェック**: 失敗時は自動で元ファイルを復元

## 各ソースのサブカテゴリ文脈メモ

### NOTIF_DIALOGUES
- N1: 練習での成長実感 — 前向き
- N2: チームメイトとの絆 — 温かい
- N3: 疲労・休息警告 — 弱気/心配
- N4: 自信回復 — 前向き
- N5_warning: モチベーション低下警告 — 不安
- N5_low: 深刻なモチベーション喪失 — 絶望的

### CARE_REACTION_DIALOGUES
- bonus: ボーナス支給反応 — 喜び/感謝
- bonus_repeat: 繰り返しボーナス — やや慣れた喜び
- costume: 新衣装 — 興奮/喜び
- trainer: 専属トレーナー — 感謝/やる気
- media: メディア出演 — 緊張/喜び
- special_treatment: 特別待遇 — 感謝/恐縮

### CHOICE_EVENT_DIALOGUES
- S1: タイトルマッチ要求 — 挑戦的
- S2: ライバル戦要求 — 闘志
- S3: 休息要求 — 疲弊
- S4_direct: 待遇不満直訴 — 不満
- S5: プロモ/メディア提案 — 前向き
- S6: チーム提案 — 協調的
- E1: 大成功イベント — 歓喜
- E4, E6: その他大型イベント

### LARGE_EVENT_DIALOGUES
- B1: 怪我/事故 — 苦痛/心配
- B2_fighter1: 対立（第1者視点）— 怒り/挑発
- B2_fighter2: 対立（第2者視点）— 応戦
- B4: 引退/離脱 — 寂しさ/決意

### GLIMPSE_B_LINES
GL-01〜GL-10: 試合シチュエーション別の心理描写。outcome (win/loss/goodLoss/greatWin) ごとに分岐。

### SNAPSHOT_TEXTS
G1-G4: 不満系スナップショット（給与、後輩、タイトル、出番）
R1-R2: 人間関係系スナップショット（摩擦、孤立）

## 検証

```bash
node -e "require('./src/data.js')"        # 構文チェック
node test/auto-sim.js 100 42              # 100シーズン検証
```
