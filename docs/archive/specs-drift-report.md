# specs/ 乖離レポート (生成日: 2026-04-05)

## カテゴリA: docs/指示書が specs/ に未反映

以下のシステムは指示書に基づいて実装済みだが、対応する **アクティブな specs/ ファイルが存在しない**。
（specs/archive/ にアーカイブ版のみ存在する状態）

### A-1. 信頼度システム v2.1 [指示書: specs/archive/trust-redesign-v2.1.md]
- **指示書の内容**: 勝敗ベース→団体行動ベースへ根本変更。出場+1.53/不出場-2.64。舞台追加ボーナス(メイン+1.07/タイトル+1.84/因縁+0.77/好試合+0.54)。高信頼帯(70+)逓減gainMult。low帯(40未満)回復減衰。ケアOVR傾斜。ロッカールーム士気連動。noAppearStreakフィールド。CARE_ACTIONS全値差替。契約更新trustベース判定
- **specs/ の現状**: アクティブspecなし。specs/archive/trust-redesign-v2.1.md のみ
- **必要な更新**: trust-system-spec を新規作成（現行実装の全定数・計算式・週次処理フローを記載）
- **重要度**: 高（ゲームコアシステム。契約・士気・ケアすべてに影響）

### A-2. 絆・ライバル関係性システム Phase1-5 [指示書: specs/archive/relationship-system-spec-v0.2.md, bond-rivalry-balance-spec-v2.0.md]
- **指示書の内容**: 非対称2軸(bond/rivalry)×全キャラ間。Phase1:データ基盤+週次decay。Phase2:試合結果反映(M-01〜M-13)。Phase3:Trust連動(R1-R5)。Phase4:Bond/Rivalry自体の調整(同団体ボーナス天井・摩擦・世代近接・試合外rivalry)。Phase5:AI団体同等処理。ライバル称号4段階(none→cause→rival→fated)。認知イベント。因縁決着
- **specs/ の現状**: アクティブspecなし。アーカイブ版のみ
- **必要な更新**: relationship-system-spec を新規作成（2軸データ構造・13種試合イベント・14種団体イベント・ライバル称号・スナップショット通知を統合記載）
- **重要度**: 高（試合MQ・集客・契約・演出すべてに連動する中核システム）

### A-3. 契約交渉イベント [指示書: specs/archive/contract-negotiation-event-spec-v2.0.md]
- **指示書の内容**: シーズン開幕offWeek2で1対1交渉。trust閾値ベース(40+自動/30-39昇給/25-29高額昇給/15-24移籍示唆/0-14移籍確定)。5性格×2態度×分岐=30セリフ。salaryBonusフィールド(永続週給加算)。退団先:引退/ライバル移籍/FA。特性補正(忠誠心/反骨心/野心)
- **specs/ の現状**: アクティブspecなし
- **必要な更新**: contract-negotiation-spec を新規作成
- **重要度**: 中（シーズン遷移の重要イベントだが変更頻度は低い）

### A-4. プロモシステム v1.0 [指示書: specs/archive/promo-redesign-spec-v1.0.md]
- **指示書の内容**: プロモ＝商売コンセプト。PROMO_POP_CAP 70。PROMO_EVENT_INCOME(pop帯別15-85万)。promoStack(0-3)フィールド。興行週にstack消費でMQボーナス。AI行動バランス(pop<70 or stack<3ならpromo)
- **specs/ の現状**: アクティブspecなし
- **必要な更新**: promo-system-spec を新規作成
- **重要度**: 中

### A-5. レンタルシステム v2 [指示書: specs/archive/rental-system-spec.md 相当]
- **指示書の内容**: G.rental(単体)→G.rentals(配列)。シーズン単位契約(1-4季)。前払い一括。FA+ライバル2ソース。同時2-3枠。タイトル戦不可。orgPop貢献50%
- **specs/ の現状**: アクティブspecなし
- **必要な更新**: rental-system-spec-v2 を新規作成
- **重要度**: 中

### A-6. 成長システム v2.0 [指示書: specs/archive/growth-system-redesign-v2.0.md]
- **指示書の内容**: 予算配給型(GROWTH_SEASON_BASE)廃止→trainCap距離ベース全面移行。核心式:`baseLearning(2.0)×(remaining/trainCap)×ageMul×coachMul×variance`。7定数廃止
- **specs/ の現状**: アクティブspecなし
- **必要な更新**: growth-system-spec-v2.0 を新規作成
- **重要度**: 中（コアシステムだが安定稼働中）

### A-7. PPV GRAND FINAL [指示書: specs/archive/ppv-grand-final-spec-v2.0.md]
- **指示書の内容**: orgPop≥30で解禁。エントリー制(プレイヤー選択)。因縁MQ+コーチMQボーナス。因縁決着判定。ビッグマッチTier2適用。結果画面にMQボーナス内訳
- **specs/ の現状**: アクティブspecなし
- **必要な更新**: ppv-system-spec を新規作成（weekly-gameloop-specへの追記も必要）
- **重要度**: 中

---

## カテゴリB: specs/ と実装コードの乖離

### B-1. 試合エンジン定数の大幅乖離 [specs/battle-engine-spec-v4.1b.md]

#### B-1a. ダメージ・HP系定数（重大）

| 定数 | specs/ の記述 | 実装 (data.js) | 乖離度 |
|------|-------------|---------------|--------|
| hpScale | 1.85 | 0.90 | **-51%** |
| hpBase | 記載なし | 50 | 実装独自 |
| dmgPwrScale | 0.12 | 0.20 | **+67%** |
| dmgSpdScale | 0.03(飛び技のみ) | 0.08(全技) | **+167%** |
| defStaScale | 0.08 | 0.02 | **-75%** |
| spdDodgeBonus | 0.075 | 0.18 | **+140%** |
| tecHitBonus | 0.21 | 0.17 | -19% |
| counterSpdPenalty | 0.03 | 0.07 | +133% |
| effSlopeAfterPivot | 0.60 | 1.0 | **逓減無効化** |

- **どちらが正しいか**: 実装が正（バランス調整の結果）。specs/ を実装に合わせるべき
- **重要度**: 高

#### B-1b. フォール・決着系定数

| 定数 | specs/ | 実装 | 乖離度 |
|------|--------|------|--------|
| pinAttemptBaseRate | 25 | 36 | +44% |
| pinAttemptSuccessBase | 20 | 23 | +15% |
| pinAttemptClimax | 15 | 22 | +47% |
| pinAttemptMinDmg | 10 | 9 | -10% |

- **重要度**: 中

#### B-1c. finishWeights（決着タイプ重み）

- specs/: strike/throw/ground に gu:5 が設定
- 実装: **非submission技の gu を全て 0 に統一**（バグ修正として処理）
- submission: fall 5→0, gu 90→95
- **重要度**: 中

#### B-1d. Big Match Tier 2 未記載

- specs/ にはTier1（通常試合、最大20ターン）のみ記載
- 実装にはBIGMATCH_MAX_T(24)/BIGMATCH_PHASES(4フェーズ)/BIGMATCH_ENG(HP+70%、キックアウト3回)が存在
- PPV/タイトルマッチ/対抗戦で適用
- **必要な更新**: §新セクション「Big Match Tier 2」を追加
- **重要度**: 高

#### B-1e. MQ外部ボーナスの変更

- specs/: MQ_EXTERNAL_CAP = 15、タイトル+10、ファン期待+5
- 実装: MQ_EXTERNAL_CAP = 12、タイトル+5、ファン期待廃止(集客に移行)
- 廃止済み: 乱闘蓄積MQ/初顔合わせMQ/マンネリMQ/プロモスタックMQ/コーチMQ/タイトル格差ペナルティ
- **重要度**: 高

#### B-1f. ペーシング減点「長すぎ」の撤廃

- specs/: Tier1で7T+/Tier2で13T+のペナルティあり
- 実装: 「長すぎ」ペナルティは完全撤廃（短すぎのみ維持）
- **重要度**: 中

### B-2. AI団体仕様の大幅変更 [specs/rival-org-spec-v1.0.md]

- **specs/の記述**: シーズン末一括成長(aiSeasonGrowth)。怪我管理なし(§3.2)。Trust記載なし
- **実装の現状**:
  - processAIWeek週次成長に全面移行（aiSeasonGrowth廃止）
  - AI怪我判定・重症度・怪我引退を実装
  - Trust統合（applyShowTrust/processAIContracts）
  - processAICare新設（trust<60ケア）
  - processAIChoiceEvent新設
  - lockerRoomMorale初期値60
- **必要な更新**: rival-org-spec を全面改訂（AI処理パイプラインの週次化、Trust/Bond/Rivalry統合、怪我・引退管理）
- **重要度**: 高

### B-3. 週次ゲームループの変更 [specs/weekly-gameloop-spec-v1_0.md]

- **specs/の記述**: offWeek 1-4（シーズン末→スカウト→引き抜き→FA）
- **実装の現状**:
  - offWeek 2: 契約更新交渉が挿入（仕様に無い）
  - offWeek 4: AI団体間移籍＋FA獲得が追加
  - PPV解禁条件・タイミングの追加
  - processAIWar 毎週実行の追加
- **必要な更新**: §1.4 オフシーズン処理順の全面更新、PPV/対抗戦セクション追加
- **重要度**: 中

### B-4. スカウトシステムの値変更 [specs/scout-system-spec-v1.0.md]

- **specs/の記述**: 年齢分布15-16歳40%、入団時startRatio 0.55〜0.85
- **実装の現状**: 年齢分布16-17歳に変更、startRatio値が全帯で異なる(18歳以下 0.40〜0.70等)
- **どちらが正しいか**: 実装が正
- **必要な更新**: §3候補者生成の年齢分布表、§6.1入団時現在値のstartRatio表を更新
- **重要度**: 低

### B-5. タイトルシステムの値変更 [specs/title-system-spec-v1.0.md]

- **specs/の記述**: タイトルMQボーナス+10、タイトル集客+15%
- **実装の現状**: タイトルMQボーナス+5、集客attendBonus 1.15(=+15%)、レンタル選手タイトル不可
- **必要な更新**: MQボーナス値更新、レンタル制限追記
- **重要度**: 低

### B-6. キャラクターデータSpec版番号 [specs/character-data-spec-v1.4.md]

- **specs/の記述**: v1.4
- **実装の現状**: personality/archetypeフィールド追加済み（v1.5相当）。41名57項目のデータ差分反映済み。コーチ35名データ未記載
- **必要な更新**: バージョンをv1.5以上に更新、personality/archetype一覧表追加、コーチ35名データ追加
- **重要度**: 低

### B-7. 技テーブル [specs/技テーブル_全160技_v3_5.md]

- **一致**: ✅ 全160技が仕様と実装で一致。更新不要
- **重要度**: なし

### B-8. フィニッシャーシステム [specs/finisher-system-spec-v1.0.md]

- **状態**: 未実装のまま。specs/ に残すか判断が必要
- **重要度**: 判断保留（Keisukeさん決定）

---

## カテゴリC: 指示書にも specs/ にも明示されていないが実装で動いているもの

### C-1. 性格/アーキタイプシステム
- **実装箇所**: relationships.js (PERSONALITY_BOND_MATRIX, ARCHETYPE_BOND_MATRIX)、management.js (getPersonalityType)
- **内容**: 8性格×6アーキタイプの相性マトリクス。Bond初期値生成・週次変動・セリフ選択・契約交渉に影響
- **重要度**: 中（関係性システムspecに統合可能）

### C-2. 大型イベントシステム B1-B4
- **実装箇所**: management.js (applyLargeEventEffect)、data.js (EVENT SYSTEM v2.0)
- **内容**: B1練習中怪我/B2チーム対立/B3対抗戦/B4メディア露出。2.5%/週・8週CD。選択型イベント
- **重要度**: 中

### C-3. 会場・集客システム v2.0
- **実装箇所**: management.js (calcBaseAttendance, calcAttendance, VENUES 10段)、data.js (BASE_ATTENDANCE_CURVE, MOMENTUM_CONFIG)
- **内容**: 10段階会場(公民館150〜ドーム30000)。orgPopベース補間曲線。勢い補正±15%。週次揺らぎ±17%
- **重要度**: 中

### C-4. 経済バランスシステム v2.0
- **実装箇所**: management.js (processSettlement, GOODS_CONFIG, MEDIA_CONFIG)
- **内容**: グッズ収入(pop×0.2万+興行ブースト)。メディア収入7発生源。給与指数関数化。Trust昇給割引
- **重要度**: 中

### C-5. コーチシステム v3.0
- **実装箇所**: management.js (Engine.coach)、data.js (ALL_COACHES 35名)
- **内容**: 35名コーチ。格C/B/A。指導力E-A。観察眼E-A。6スタイル。コーチ特性6種。枠orgPop連動(1-3枠)
- **重要度**: 中

### C-6. スナップショット通知システム
- **実装箇所**: relationships.js (Engine.snapshot, SNAPSHOT_TEXTS)
- **内容**: 関係変化をプレイヤーに通知。G1-G4不満系、R1-R5関係系。25%/週。6週CD。personality×archetypeセリフ
- **重要度**: 低（関係性specに統合可能）

### C-7. MQ計算 v3.0（Phase1-3改修+外部ボーナス整理）
- **実装箇所**: match-engine.js (calcMQ相当ロジック)
- **内容**: ペーシング「長すぎ」撤廃。外部MQソース6件削除。MQ_EXTERNAL_CAP 15→12。マンネリランダム幅化。ロスターサイズ連動ウィンドウ
- **重要度**: 高（battle-engine-specのMQセクション更新で対応可能）

---

## サマリー

| カテゴリ | 件数 | 内訳 |
|---------|------|------|
| **A（指示書→specs未反映）** | 7件 | Trust/Bond-Rivalry/契約交渉/プロモ/レンタル/成長v2/PPV |
| **B（specs↔実装コード乖離）** | 7件 | battle-engine(重大)/rival-org(重大)/weekly-gameloop/scout/title/character-data/finisher(未実装) |
| **C（未文書化だが稼働中）** | 7件 | 性格archetype/大型イベント/会場集客/経済/コーチ/スナップショット/MQ v3 |
| **問題なし** | 1件 | 技テーブル ✅ |

### 優先度の提案

**最優先（高）**: B-1(battle-engine定数), B-2(rival-org全面改訂), A-1(Trust), A-2(Bond/Rivalry)
**次点（中）**: B-3(weekly-gameloop), A-3〜A-7, C-1〜C-5
**低**: B-4〜B-6, C-6

---

*このレポートに基づき、Keisukeさんが各項目の方針（更新/実装修正/保留/削除）を決定してください。*
*specs/ 本体はまだ書き換えていません。*
