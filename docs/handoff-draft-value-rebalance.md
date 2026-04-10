# ドラフト価値向上リバランス — 引き継ぎ資料

> 作成: 2026-04-10
> コミット: `3f4a749 feat: ドラフト価値向上リバランス (draft-value-rebalance)`
> ステータス: **施策0-3は実装済み・コミット済み。選手循環システムに未解決の構造的問題あり。**

---

## 背景

セリ（オークション）方式のドラフトを導入した結果、ドラフトはAI団体と金額で競り合う高コストな場になった。一方でFA市場は無競争・安価のまま残っており、ドラフトを経由せずFAで良い選手を安く拾えてしまう。ドラフトの相対的な価値を上げるため、4つの施策を実装した。

---

## 実装済み（コミット済み）

### 施策0: 候補数・FA枠の適正化
- `SCOUT_EVENT_CFG.offseason.count`: [14, 18] → [6, 8]、maxPicks: 4 → 3
- `SCOUT_EVENT_CFG.midseason.count`: [8, 10] → [4, 6]
- `ROSTER_CFG.fa`: 22 → 10
- `getVisibleFAIds`: 6人抽選 → 10人全員表示

### 施策1: 年齢ベースでドラフト/FAを棲み分け
- `generateScoutReport`: age 17-18の全員をpotTotal降順でドラフトに出す（count上限なし）
- FAローテーション: age 19-20のエントリのみから抽出
- FA選手に待機微成長: age 19以上の場合 `年3% × (age - 18)` をtrainCap余地に適用
- dormantPoolの実年齢を使用（age振り直し廃止）

### 施策2: AI団体がシーズン中にFAを取りに来る
- `AI_MIDSEASON_FA_CFG` 定数追加（data.js）
- `Engine.rival.aiMidseasonFAAcquire()` 新設（management.js）
- 四半期FAローテーション直後にフック（tickWeek内）
- grabChance: S=35%, A=25%, B=15%、年間最大1人/団体
- OVR差閾値: S=8, A=6, B=4
- ロスター上限時は最弱を戦力外 → dormantPool末尾に返却
- `_midseasonFAGrabs` カウンタをシーズン開始時にリセット

### 施策3: ドラフト指名ボーナス（trust + bond）
- `DRAFT_SIGNING_BONUS` 定数追加（data.js）
- trust: +5（基本）+ 2×ラウンド数、上限+15
- bond: 既存メンバー→新人に +1〜+5（`applyFromRoster`使用）
- AI落札時もtrust加算（bondはAI側にrelationshipsがないため不適用）
- `draftNextCandidate()`（ui-common.js）に追加

### コミット後の追加変更（未コミット）

- `generateScoutReport`: age 17-18全員出し + potTotal順ソート（count上限撤廃）
- 引退復帰システム書き換え（offWeek 1の年次処理を全面改修）
- 旧リサイクル処理2箇所を廃止（v1.9c dormantPool補充 + 四半期FA緊急補充）

---

## 未解決の構造的問題

### pool-stats計測結果（20シーズン、seed=42）

```
Season | Pool | 17-18 | 19-20 | 21+ | FA | Retired
  S2   |   1  |   0   |   1   |  0  | 69 |   1
  S5   |   1  |   0   |   1   |  0  |  0 |  80
  S10  |   0  |   0   |   0   |  0  |  2 |  89
  S15  |   1  |   0   |   1   |  0  |  3 |  69
  S20  |   5  |   0   |   5   |  0  |  8 |  62
```

### 問題1: FA膨張（S2でFA=69人）

**原因**: ROSTER_CFG.faを10に減らしても、FAに選手が流入する既存ルートが制御されていない。

FAに流入するルート（特定済み）:
1. **initRandomRoster**: 初期FA枠。ROSTER_CFG.fa=10に変更済みだが、既存セーブデータは旧値
2. **退団（contract departure）**: trust低下で退団 → FAに直接流入（management.js processAIContracts）
3. **引き抜き失敗/解雇**: releaseFighter → FA流入
4. **ドラフト見送り候補**: scoutEventFinish で30%がFAへ（app.js:3273）
5. **レンタル帰還**: 帰団先がない場合FAに
6. **突然離脱**: 移籍先がない場合FAに

**必要な対策**:
- FA人数に上限キャップ（10人超ならdormantPoolか引退枠に流す）
- または全流入ルートでFA上限チェックを追加
- `scoutEventFinish`の30% FA流入も見直し（全員dormantPoolに返却でよい）

### 問題2: dormantPool枯渇（S5以降ほぼ空）

**原因**: 初期プール78人が全員age 17 → 3シーズンでage 20超 → 引退送り。復帰は5シーズンクールダウン後なので、S6-S10はプールが完全に空になる。

**追加要因**: auto-simではスカウトイベントをスキップしているため、ドラフト候補がpoolから引き出されても消化されず、残りがFAやdormantPoolに戻るフローが動かない。実ゲームでは多少マシかもしれないが、構造的問題は同じ。

### 問題3: age 17-18が常に0人

**原因**: 復帰システム自体は動いているが（retiredIds: 91→62と減少）、以下の問題で17-18に入らない:
- 復帰はage 17で入る → 翌シーズンのoffWeek 1でage 18に加齢 → 計2年間ドラフト対象
- しかし復帰の前提条件（クールダウン5年 + eligible判定）を満たす引退者が少ない
- 計測タイミング（シーズン開始 = 加齢後）ではage 17の人はすでに18に → 表示上は正しい
- **根本**: 初期プールの「全員同時age 17」が全員同時に循環するため、復帰タイミングも偏る

---

## 次のセッションでやるべきこと

### Phase 1: FA膨張の修正

1. **全FAの流入ルートにキャップチェックを入れる**
   - FA人数が10人を超える場合、新規流入をdormantPool（age 19）に回す
   - 対象箇所: processAIContracts, releaseFighter, scoutEventFinish, レンタル帰還, 突然離脱

2. **scoutEventFinish の30% FA流入を廃止**（app.js:3273）
   - 見送り候補は100%dormantPool返却に変更

### Phase 2: 初期プールの年齢分散

3. **initRandomRosterで初期dormantPoolの年齢を分散させる**
   - 全員age 17ではなく、17-20歳をランダムに振る
   - これにより初期からドラフト候補(17-18)とFA候補(19-20)の両方が存在
   - 全員が同時にage 20超で消えることがなくなる

### Phase 3: 復帰システムの検証

4. **pool-stats計測で安定するか確認**
   - Phase 1-2の修正後、20シーズン計測
   - 期待値: 毎シーズン age 17-18 = 8-12人、FA = 5-10人で安定
   - dormantPoolが枯渇しないこと

### Phase 4: バランスチューニング

5. 必要に応じて定数調整:
   - 復帰人数（現在6人/年: FIFO 3 + random 3）
   - 安全弁の閾値（現在8人）
   - クールダウン年数（現在5年）

---

## 変更済みファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| src/data.js | SCOUT_EVENT_CFG, ROSTER_CFG.fa, AI_MIDSEASON_FA_CFG, DRAFT_SIGNING_BONUS |
| src/management.js | generateScoutReport, FAローテーション, getVisibleFAIds, aiMidseasonFAAcquire, offWeek1引退復帰, v1.9c旧補充2箇所廃止, _midseasonFAGrabsリセット |
| src/ui-common.js | draftNextCandidate trust+bond付与, AI落札trust付与 |
| docs/game-system-roadmap.md | ロードマップ更新 |
| specs/scout-system-spec-v1.0.md | §1.1テーブル更新, §9.4-9.6追加 |

## コミット状況

- `3f4a749` (コミット済み): 施策0-3の基本実装
- **未コミット**: generateScoutReport全員出し, 引退復帰システム書き換え, 旧補充処理廃止

次のセッションでは未コミット分の問題を解決してからコミットすること。

---

## 設計の合意事項（ユーザー確認済み）

- ドラフト候補はage 17-18の全員を出す（人数制限なし、potTotal順）
- FA候補はage 19-20（ドラフト漏れ世代）
- age 20超はdormantPool/FAから引退枠に戻す
- 引退復帰: 5年クールダウン、年6人（古い順3 + ランダム3）、安全弁あり
- FAローテーション: 4週ごとに2人入れ替え（現状維持）
- AI midseason FA: S級積極/B級控えめ、年間最大1人
- ドラフト指名ボーナス: trust +5〜+15、bond +1〜+5
- 弱い選手もドラフトに出る（競合なしで安く取れる）
