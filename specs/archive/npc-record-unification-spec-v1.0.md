# NPC記録データ完全統一 設計書 v1.0

> **ステータス**: 🟡 設計確定・実装待ち
> **作成日**: 2026-03-06
> **依存**: ai-unified-growth-spec-v1.0.md / growth-event-spec-v1.0.md / event-system-spec-v2.md
> **🔧マーク = 調整可能パラメータ**

---

## 背景と目的

AI統一成長モデル v1.0（Phase 1-5）により、AI選手はプレイヤーと同一の `calcGrowth` + `simulateMatch` を通るようになった。しかし**試合後処理**（ブレークスルー判定・trust変動・人気連動・連敗追跡・careerBestMQ更新等）はプレイヤー団体のみに適用されており、AI選手は簡易版の処理にとどまっている。

**本設計書の目的**:
1. AI選手に**プレイヤーと完全同一の試合後処理**を適用する
2. ゲーム開始時に**全選手の過去経歴を自動生成**する（年齢・能力に応じた戦績）
3. AI選手の記録データを**プレイヤー選手と同じUIで閲覧可能**にする
4. 統一に伴い**不要になった旧コード**を整理・廃止する

---

## 全体構成

| Part | 内容 | 変更規模 |
|------|------|---------|
| A | processAIWeek 試合後処理の完全統一 | engine.js 中規模追加 |
| B | 旧コード廃止（重複排除） | engine.js 中規模削除 |
| C | ゲーム開始時の経歴自動生成 | engine.js 大規模追加 |
| D | AI選手データの表示統一 | ui-render.js / app.js 中規模改修 |

---

## Part A: processAIWeek 試合後処理の完全統一

### §A-1 現状の差分一覧

| 処理 | プレイヤー団体 | AI団体（現状） | 統一後 |
|------|-------------|--------------|--------|
| ブレークスルー判定 | `checkAndApplyBreakthrough()` 毎試合 | `aiSeasonGrowthEvents()` シーズン末一括 | 毎試合 |
| careerBestMQ更新 | 毎試合後 | なし | 毎試合 |
| スランプ判定 | 敗北時 `checkSlump()` | シーズン末一括 | 敗北時 |
| モチベ喪失判定 | スランプ中敗北 `checkMotivationLoss()` | シーズン末一括 | スランプ中敗北 |
| スランプ/モチベ momentum | 毎試合後更新 | なし | 毎試合 |
| trust変動 | `applyShowTrust()` 毎興行 | 固定50 | 毎興行 |
| 人気MQ連動 | `applyMQPopularity()` 毎試合 | `aiSeasonPopularity()` シーズン末一括 | 毎試合 |
| 連敗追跡 | `checkLosingStreak()` 毎試合 | なし | 毎試合 |
| peakOVR更新 | シーズン末 `updatePeakOVR()` | なし | シーズン末 |
| カード鮮度(matchupLog) | 蓄積→プレビュー表示 | なし | AI団体内でも蓄積 |

### §A-2 processAIWeek 興行週の改修

現在の `processAIWeek` の興行週処理（L2324-2401）を以下のように拡張する。

```
processAIWeek 興行週フロー（改修後）:
  1. generateAIMatchCard(roster, matchupLog)     ← カード鮮度考慮を追加
  2. for each match:
     a. simulateMatch()                          ← 既存
     b. 試合成長（ステータス分配）               ← 既存
     c. 勝敗記録 (wins/losses/draws)             ← 既存
     d. ★ checkAndApplyBreakthrough()            ← 新規
     e. ★ careerBestMQ 更新                      ← 新規
     f. ★ checkLosingStreak()                    ← 新規
     g. ★ checkSlump() (敗北時)                  ← 新規
     h. ★ updateSlumpMomentumAfterMatch()        ← 新規
     i. ★ checkMotivationLoss() (スランプ中敗北) ← 新規
     j. ★ updateMotivationLossMomentumAfterMatch() ← 新規
     k. ★ MQ連動人気変動（簡易版）               ← 新規
     l. condition消耗 + 怪我判定                  ← 既存
  3. ★ applyAIShowTrust(roster, matchResults)     ← 新規
  4. ★ matchupLog 蓄積                           ← 新規
  5. 全選手自然回復                               ← 既存
```

### §A-3 AI人気変動（MQ連動・簡易版）

プレイヤー団体の `applyMQPopularity` はUI演出と密結合している（popEvents配列でイベントログを出す）。AI団体では演出不要なため、**計算ロジックだけを再利用する簡易ラッパー**を用意する。

```js
// Engine.rival に追加
applyAIMQPopularity(roster, matchCard, matchResults) {
  // 各試合参加者に対して:
  //   rawGain = MQ帯(70:+3, 50:+2, 30:+1) + 勝利(+1) + 特性ボーナス
  //   → applyDiminishing(rawGain, pop)
  //   → checkLosingStreak() 連敗ペナルティ
  //   → pop更新
  // popEvents は生成しない（AI側はログ不要）
  // 戻り値: 更新されたroster
}
```

### §A-4 AI trust変動

プレイヤー団体の `Engine.trust.applyShowTrust()` をAI団体にも適用する。

```js
// processAIWeek 興行週末尾に追加
const aiTrustResult = Engine.trust.applyShowTrust(roster, matchResults, {});
roster = aiTrustResult.roster;
// ※ AI団体はタイトルシステムなしのため第3引数は {}
// ※ lockerRoomMorale はAI団体では保存不要（将来拡張ポイント）
```

### §A-5 AI matchupLog

AI団体ごとに `aiOrgs[orgId].matchupLog` を新設する。

```js
// processAIWeek 興行週末尾に追加
const newEntries = matchCard.map(m => ({
  leftId: m.left.id, rightId: m.right.id,
  showCount: orgData.showCount || 0
}));
orgData.matchupLog = [...(orgData.matchupLog || []), ...newEntries];
orgData.showCount = (orgData.showCount || 0) + 1;
```

`generateAIMatchCard` にもmatchupLogを渡し、**直近3回以内の同カード**にペナルティを付与してペアリングの多様性を改善する。

### §A-6 AI peakOVR更新

`processSeasonEnd` のAI選手ループ内、decay適用後に追加:

```js
roster = roster.map(f => Engine.career.updatePeakOVR(f, state.season));
```

### §A-7 AI ブレークスルー蓄積（脅威通知用）

processAIWeekでブレークスルー発生時、orgDataに蓄積する:

```js
if (btResult) {
  orgData.seasonBreakthroughs = [...(orgData.seasonBreakthroughs || []),
    { fighter: { name: nc.name, id: nc.id }, stat: btResult.stat, gain: btResult.gain }
  ];
}
```

processSeasonEndで `seasonBreakthroughs` をリセットする。

---

## Part B: 旧コード廃止（重複排除）

統一により不要になるコードを明示的にリストアップして廃止する。

### §B-1 廃止対象一覧

| 関数/処理 | 場所 | 理由 |
|-----------|------|------|
| `Engine.growthEvents.aiSeasonGrowthEvents()` | engine.js L6719-6760 | ブレークスルー/スランプ/モチベ喪失が週次に移行 |
| processSeasonEnd Step 2b の `aiSeasonGrowthEvents` 呼び出し | engine.js L2433-2443 | 上記廃止に伴い不要 |
| `_lastSeasonGrowthEvents` の記録・参照 | engine.js 複数箇所 | `seasonBreakthroughs` に置き換え |
| `Engine.rival.aiSeasonPopularity()` | engine.js L2529-2538 | 試合ごとのMQ連動人気変動に完全移行 |
| processSeasonEnd Step 4 の `aiSeasonPopularity` 呼び出し | engine.js L2459 | 上記廃止に伴い不要 |

### §B-2 維持するリセット処理

processSeasonEnd でシーズン末にリセットすべきフィールド（変更なし）:
- `wins / losses / draws` → 0（シーズン戦績）
- `seasonGrowth` → {pw:0, sp:0, te:0, st:0, mn:0}
- `seasonInjuries` → 0
- `injury` → null（シーズンまたぎ回復）
- `lastMatchResult` → null
- `seasonBreakthroughs` → []（脅威通知参照後にクリア）
- `slump / motivationLoss` → **維持**（シーズンをまたいで継続）

### §B-3 脅威通知の情報源切り替え

現在シーズン開始時の脅威通知は `_lastSeasonGrowthEvents` を参照（engine.js L5417-5431）。これを `orgData.seasonBreakthroughs` に切り替える。データ構造は互換性あり。

---

## Part C: ゲーム開始時の経歴自動生成

### §C-1 発火タイミング

`confirmDraft()` でドラフト完了後、ゲーム本編開始前に全選手の経歴を一括生成する。

```
confirmDraft() フロー:
  1. Engine.draft.completeDraft(G, picks, rng)    ← 既存
  2. ★ Engine.career.generateAllBackstories(G)    ← 新規
  3. ドラフト選手の歓迎ポップアップ               ← 既存
```

処理時間は98キャラ × 軽量な確率計算のみで、推定50-150ms。実測して200ms以下なら**ローディング表示なし**、超える場合のみシンプルなプログレスバーを追加。

### §C-2 対象選手

- プレイヤー団体ロスター（ドラフトで選んだ選手）
- AI団体ロスター（S級/A級/B級の全選手）
- フリーエージェント
- 待機プール（dormantPool）

→ 実質的に `ALL_CHARS` の全員。

### §C-3 経歴生成アルゴリズム

#### 入力パラメータ
- `age`: 現在の年齢
- `careerSeasons`: キャリア年数（= age - 16）
- `ovr`: 現在のOVR
- `pot`: ポテンシャル各ステ
- `traits`: 特性リスト
- `orgId`: 所属団体ID（`org_s` / `org_a` / `org_b` / `'fa'` / `'dormant'`）
- `rivalOrgNames`: GameStateの団体名マップ（`{ org_s: '皇武館', org_a: 'ノヴァインパクト', ... }`）

#### 出力
```js
{
  careerRecord: {
    history: [ /* debut, titleWin, titleLoss, titleDefense, breakthrough, transfer 等 */ ],
    totalTitleWins: N,
    totalDefenses: N,
    peakOVR: N,
    peakOVRSeason: N,
  },
  careerHistory: [ /* UI表示用マイルストーン */ ],
  careerBestMQ: N,
  trust: N,      // 35-65 の範囲
}
```

#### §C-3-1 peakOVR算出

```
peakAge = 26 + random(0, 4)  // 26-30歳がピーク
if (age >= peakAge):
  decayPerYear = random(0.5, 1.5)
  peakOVR = ovr + round((age - peakAge) × decayPerYear)
  → clamp(ovr, ovr + 15)
  peakOVRSeason = max(1, careerSeasons - (age - peakAge))
else:
  peakOVR = ovr  // まだ成長中 → 現在が最高
  peakOVRSeason = careerSeasons
```

#### §C-3-2 ベストMQ生成

```
careerBestMQ = f(peakOVR)
  peakOVR 80+:  68 + random(0, 12)  → 68-80
  peakOVR 60-79: 55 + random(0, 12)  → 55-67
  peakOVR 40-59: 40 + random(0, 12)  → 40-52
  peakOVR <40:   30 + random(0, 10)  → 30-40
  
  名勝負製造機持ちは +5
```

#### §C-3-3 キャリアイベント生成

**デビュー**:
```
全員に必ず1件。season=1, week=1。
via = orgに所属していれば 'draft'、FAなら 'fa'。
```

**ブレークスルー**:
```
期待回数 = careerSeasons × 🔧 0.08（年8%）
  若年シーズン（その時点で≤25歳）は ×1.3
  potOVR ≥ 150 は ×1.2
実際の回数 = Poisson近似（期待値から）、max 🔧 5回
各ブレークスルーにシーズンをランダム割当（キャリア前半に偏重）
stat: pw/sp/te/st/mn ランダム
gain: 2-4
```

**タイトル歴**:

各AI団体にはその団体名を冠したチャンピオンベルトがある。ゲーム中にAI団体内タイトル戦は発生しないが、**経歴としてそのベルトの歴史を持つ**。

```
■ タイトル名の決定
  beltId = orgId + '_title'           （例: 'org_s_title'）
  beltName = rivalOrgNames[orgId] + '王座'  （例: '皇武館王座'）

■ 団体別の獲得条件
  S級（org_s）: peakOVR >= 🔧 75、確率 (peakOVR - 70) × 0.02（max 30%）
  A級（org_a）: peakOVR >= 🔧 68、確率 (peakOVR - 63) × 0.02（max 30%）
  B級（org_b）: peakOVR >= 🔧 60、確率 (peakOVR - 55) × 0.02（max 30%）

■ タイトルイベント生成（獲得した場合）
  防衛回数 = min(8, round((peakOVR - 閾値) / 3 + random(0, 3)))
  戴冠シーズン = キャリア中盤〜後半にランダム割当
  
  history events:
    { type: 'titleWin',     season, week, beltId, orgName: beltName }
    { type: 'titleDefense', season, week, beltId, count: N }  ※ 3,5回目のみ記録
    { type: 'titleLoss',    season, week, beltId, defenses: total }
  
  careerHistory entries:
    { type: 'title_win',     season, detail: '皇武館王座 獲得' }
    { type: 'title_defense', season, detail: '皇武館王座 5度防衛' }
    { type: 'title_loss',    season, detail: '皇武館王座 陥落（5度防衛）' }

■ 複数回戴冠
  peakOVR >= 閾値+15 なら 🔧 15% の確率で2回目戴冠
  2回目は1回目の陥落後のシーズンに配置

■ FA/dormant選手のタイトル歴
  「かつて所属していた団体」をランダムに1つ決め、
  その団体名のタイトルとする。
  → 「元皇武館王者がFAにいる」等のドラマが生まれる
```

**移籍歴**:
```
careerSeasons >= 5 のとき、1回移籍した確率: 🔧 15%
careerSeasons >= 10 のとき、2回移籍した確率: 🔧 5%
移籍元はランダム選択（現所属と異なる団体）
history: { type: 'transfer', season, fromOrg: 旧団体名, toOrg: 現団体名 }
careerHistory: { type: 'transfer', season, detail: '○○から移籍' }
```

**怪我歴**:
```
各シーズン 🔧 8% の確率で長期欠場イベント
careerHistory: { type: 'injury', season, detail: '膝の負傷で長期欠場' }
怪我種類プール: ['膝の負傷', '肩の負傷', '腰の負傷', '首の負傷', '足首の負傷']
```

#### §C-3-4 trust初期値

```
baseTrust = 50
+ (careerSeasons >= 8 ? random(0, 5) : 0)   // ベテラン補正
+ (traits.includes('忠誠心') ? 5 : 0)
+ random(-5, 5)                                // 個人差
→ clamp(35, 65)
```

#### §C-3-5 イベント時系列ソート

すべてのイベントを生成後、`season → week` でソートして `careerRecord.history` と `careerHistory` に格納する。`Engine.milestone.get()` で自然な時系列表示になる。

### §C-4 RNG設計

経歴生成はseedベース。`Engine.rng.derive(state.rngSeed, charId, 0xBACK)` で各キャラ固有のRNGを作る。ドラフト選択が変わっても個々のキャラの経歴は同一（再現性保証）。

---

## Part D: AI選手データの表示統一

### §D-1 milestone.get のAI団体検索追加

```js
// Engine.milestone.get 改修:
const fighter = (G.roster || []).find(c => c.id === fighterId)
  || (G.retiredFighters || []).find(c => c.id === fighterId)
  || (G.freeAgents || []).find(c => c.id === fighterId)
  || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(c => c.id === fighterId);
```

同様に `Engine.career.buildSummary()` もAI選手を検索対象に含める。

### §D-2 スカウト画面での戦績表示

AI団体の選手をスカウト/偵察する際に以下を表示:

- **今シーズン戦績**: ○勝○敗○分（wins/losses/draws）
- **ベストMQ**: careerBestMQ
- **peakOVR**: careerRecord.peakOVR (S○)
- **タイトル歴**: 「元○○王座王者」（totalTitleWins > 0 なら表示）
- **キャリアサマリー**: buildSummary() の出力

### §D-3 対抗戦・PPV選手情報パネル

対抗戦やPPVでAI選手と対戦する際の選手情報パネルに、§D-2と同じ項目を表示。特にタイトル歴は対戦の格付けに重要。

### §D-4 マイルストーン表示

AI選手の詳細画面で、プレイヤー選手と同じマイルストーン年表が使える。生成された経歴イベント（デビュー・ブレークスルー・タイトル歴・移籍・怪我）がすべて時系列で表示される。

### §D-5 タイトル歴の表示形式

AI団体のタイトルは団体名を冠して表示する:

```
マイルストーン表示例:
  🏆 皇武館王座 獲得（S3）
  🛡️ 皇武館王座 5度防衛（S3-S5）
  💔 皇武館王座 陥落（S5、5度防衛）
  
buildSummary での表示:
  「元皇武館王座王者（5度防衛）」
```

---

## 実装順序

```
Step 1: Part A（processAIWeek 統一）+ Part B（旧コード廃止）
  → processAIWeek 興行週に全試合後処理を追加
  → aiSeasonGrowthEvents 廃止
  → aiSeasonPopularity 廃止
  → 脅威通知を seasonBreakthroughs に切り替え
  → processSeasonEnd に peakOVR更新追加
  → テスト: auto-simで数シーズン回してAI選手のデータ蓄積を確認

Step 2: Part C（経歴自動生成）
  → Engine.career.generateBackstory(fighter, state) 関数実装
  → Engine.career.generateAllBackstories(state) で全キャラ一括処理
  → confirmDraft() にフック
  → 処理時間実測 → ローディング要否判断
  → テスト: 生成された経歴の妥当性確認（OVR・年齢との整合性）

Step 3: Part D（表示統一）
  → milestone.get / buildSummary のAI団体検索追加
  → スカウト画面に戦績・タイトル歴表示
  → 対抗戦・PPVパネルに戦績表示
  → マイルストーン画面のAI選手対応
```

---

## セーブデータ互換

既存セーブデータのAI選手には新フィールドが無い。ロード時にマイグレーション:

```js
// 各AI選手に対して:
if (!f.careerBestMQ) f.careerBestMQ = 0;
// orgData レベル:
if (!orgData.matchupLog) orgData.matchupLog = [];
if (!orgData.seasonBreakthroughs) orgData.seasonBreakthroughs = [];
if (!orgData.showCount) orgData.showCount = 0;
// careerRecord, careerHistory は Engine.career.ensure() で既に補完済み
// trust は makeAIFighter (Phase 2) で初期値50あり
```

経歴は生成済みでないセーブデータでは「空の経歴」のまま。ゲーム進行中に蓄積される実績のみが記録される。新規ゲームのみ経歴生成が走る。

---

## 注意事項

1. **AI団体タイトル（ゲーム中）**: 経歴として「過去にタイトルを持っていた」記録は作るが、ゲーム進行中のAI団体内タイトル戦は本設計のスコープ外（将来拡張ポイント）

2. **人気の二重処理回避**: Part Aの試合ごとMQ連動を入れるため、Part Bで `aiSeasonPopularity()` を廃止。二重適用は起きない

3. **dormantPool選手の経歴**: 待機プールの選手も経歴を持つ。FA市場に出てきたときに「元皇武館王者」等の情報が活きる

4. **RNG再現性**: 経歴生成は seed + charId で決定。同じseedなら同じ経歴。ドラフト選択の影響を受けない
