# コーチ＋ロッカールーム＋施設廃止 統合リデザイン 実装計画

## Context

設計書 `docs/coach-lockerroom-redesign-v1.0.md` に基づく大規模リファクタ。
コーチシステムの全面刷新（8人→30-35人プール制、指導力/観察眼2能力、得意スタイル、コーチ特性6種）、
施設システム完全廃止、ロッカールーム可視化の新設、ケアアクション変更、努力家特性変更を一括実装する。

全5ファイル（data.js / engine.js / app.js / ui-common.js / ui-render.js）+ index.html に変更が及ぶ。

### 調査で判明した事実
- **award-frame画像**: ディスク上は `.png.webp`（b〜g）。`a` は存在しない。コードは `.png.png` を参照 → 現在壊れている
- **dojo-header.webp**: `image/dojo-header.webp` として既に存在
- **施設参照箇所**: engine.js 10箇所、app.js 8箇所、ui-render.js 3箇所、ui-common.js 3箇所、index.html 3箇所
- **コーチ参照箇所**: engine.js 1249-1329、data.js 678-737、app.js 1975-2025、ui-render.js 3関数、ui-common.js 572-668

---

## 実装フェーズ（4フェーズ構成）

### Phase A: 独立した小規模変更（他フェーズに依存しない）

#### A-1. 努力家特性の変更
- **ファイル**: `src/engine.js` L1408-1409, L1417
- **変更内容**:
  - L1408-1409 の `baseGain *= 1.15` を削除
  - L1417 の `weeklyVariance` 計算に努力家分岐を追加:
    ```javascript
    // 通常: 0.5〜1.5、努力家: 0.75〜1.5（下振れしにくい）
    const vFloor = Traits.has(char, '努力家') ? 0.75 : 0.5;
    let weeklyVariance = vFloor + Engine.rng.float(rng) * (1.5 - vFloor);
    ```

#### A-2. award-frame 画像パス修正
- **ファイル**: `src/index.html` L600-605
- **変更内容**: `.png.png` → `.png.webp` に6箇所修正。frame "a" はファイル不在 → `background-image:none` に変更

#### A-3. ケアアクション変更（§5）
- **ファイル**: `src/engine.js`（careActions.execute 内）、`src/ui-common.js`（showCareActionModal）、`src/app.js`（executeCareAction エラーハンドリング）
- **変更内容**:
  - costume/media の制限を週1→2週に1回に変更（`_careWeekUsed` の判定を `=== state.week` → `state.week - used < 2` に）
  - orgPop ゲート追加: bonus=常時、costume/media=orgPop20〜、special_treatment=orgPop40〜
  - ケアモーダルにロック表示（「orgPop XX で解放」テキスト）
  - app.js に `orgpop_locked` エラーケース追加

---

### Phase B: コアエンジン層の書き換え（data.js → engine.js）

#### B-1. コーチデータモデル刷新（data.js）
- **ファイル**: `src/data.js`
- **変更内容**:
  - `COACH_RANKS` 定数追加: `{E:1.05, D:1.08, C:1.12, B:1.18, A:1.25}`
  - `COACH_STYLE_MAP` 定数追加: パワー型→pw, スピード型→sp, テクニック型→te
  - `COACH_TRAIT_DEFS` 定数追加: 6種の効果定義（暫定値、🔧マーク付き）
  - `ALL_COACHES` を完全書き換え: 新フォーマット（id/name/emoji/grade/teaching/observation/style/trait/salary/hireFee/minOrgPop/hasPortrait）
    - 既存8人を新フォーマットに変換（ID維持、hasPortrait:true）
    - 新規22-27人を追加（C:12 / B:10 / A:5 程度。emoji表示、hasPortrait:false）
  - `COACH_MAX_ASSIGN` を 4 → 3 に変更
  - `GROWTH_CONFIG` から `specialtyWeight`/`otherWeight`/`subMult` を削除
  - `LOCKER_ROOM_TEXTS` 追加: 5段階×3-4パターン（設計書§3.3からコピー）
  - `OBSERVATION_TEXTS` 追加: ランク別テンプレート（暫定テキスト）

#### B-2. Engine.coach 名前空間の書き換え（engine.js）
- **ファイル**: `src/engine.js` L1249-1329
- **変更内容**:
  - `getCharGrowthMult()`: specialty方式 → teaching ランク + スタイル一致ボーナス方式に
  - `pickGrowthStat()`: specialty重み付き → 均一分布に（コーチは成長速度に影響するが、どのステが伸びるかは影響しない）
  - `getMQBonusForMatch()` → コーチ特性「引き出し上手」による判定に変更
  - `getPopBonusForChar()` → 削除（代替なし）
  - `getCondBonus()` → コーチ特性「コンディショニング」による判定に変更
  - `getInjuryMult()` → コーチ特性「コンディショニング」による判定に変更
  - `getMaxCoachSlots(orgPop)` 新設: orgPop 0→1枠、25→2枠、50→3枠
  - `generateCoachCandidates(rng, G)` 新設: orgPopに応じた5-8名の候補生成
  - コーチ特性6種の効果適用ロジック追加（暫定値）:
    - 新人育成: OVR≤60 → growth ×1.15
    - ベテラン調整: applyDecay で decay 量-1
    - コンディショニング: 怪我確率×0.8、condition消耗-2/週
    - 実戦主義: 試合出場時の成長ボーナス+0.3
    - 引き出し上手: 担当選手出場試合 MQ+2
    - 人脈持ち: スカウト候補+1人

#### B-3. Engine.observation 名前空間の新設（engine.js）
- **ファイル**: `src/engine.js`
- **変更内容**: 新しい `Engine.observation` 名前空間:
  - `shouldReport(G, week)`: 非興行週かつ4週間隔で true
  - `generateReport(rng, G, coachId)`: 観察眼ランク依存の報告生成
    - E-D: 曖昧な雰囲気テキスト（選手名なし）
    - C: 選手名あり（的外れ20%）
    - B: パラメータ名あり（的外れ20%）
    - A: trainCap接近の示唆（的外れ5-10%）

#### B-4. Engine.facility 名前空間の削除 + 呼び出し元修正（engine.js）
- **ファイル**: `src/engine.js` L1332-1374 + 散在する10箇所
- **変更内容**:
  - `Engine.facility` 全体を削除
  - L1404 `facilityMul` → 削除（コーチ指導力に吸収済み）
  - L2204 dormitory bonus → 0固定
  - L2282 medical recovery → 0固定
  - L2333 promo bonus → orgPop連動に（暫定: `Math.floor(orgPop/25)`, cap+3）
  - L2341 rest bonus → 0固定
  - L2463-2466 maintenance → 削除
  - L2473 broadcast bonus → 削除
  - L2867 injury reduction → 0固定
  - L3588 scout discount → orgPop連動に（暫定: `orgPop>=50?20:orgPop>=30?10:0`）
- **注意**: AI団体の `facilityMul`（RIVAL_ORGS config）はプレイヤー施設とは別概念なので残す

---

### Phase C: App統合層（app.js）

#### C-1. 施設関連の除去
- app.js: `upgradeFacility()` 削除、`getFacilityLevel()`/`getFacilityMaintenance()` 削除
- Scout呼び出しの `getScoutDiscount` → orgPop連動関数に差し替え
- `Survival.estimateWeeklyNet()` から施設維持費・放送ボーナスを除去
- `upgrade_fac` ミッション → `hire_coach`（コーチを1人雇おう）に差し替え

#### C-2. コーチApp層の書き換え
- `hireCoach()`: orgPop ゲート追加（grade別）、`coachCandidates` から雇用
- `fireCoach()`: 解雇したコーチはプールに戻る（`coachCandidates` から消えるだけ）
- `assignToCoach()`: 上限3人チェック
- `refreshCoachCandidates()` 新設: シーズン開始時に5-8名候補選出
- 観察眼レポート処理: `_pendingCoachReport` transientフィールド追加

#### C-3. セーブデータマイグレーション
- `_migrated_coach_v2` フラグでワンショット実行
- 既存コーチID（1-8）は維持 → coachAssign互換
- coachAssign を3人上限に截断（4人目を外す）
- `coachCandidates` を初期生成
- `G.facilities` はクラッシュしないよう無視（削除はしない）
- 初期State: `facilities` フィールド削除、`coachCandidates: []` / `coachReports: []` 追加

---

### Phase D: UI層

#### D-1. 施設UI除去
- `index.html`: ナビボタン削除（L896）、screen-facility 削除（L1000-1005）、`.facility-*` CSS削除（L323-338）
- `ui-render.js`: `renderFacility()` 削除、`refreshAll()` から除去
- `ui-common.js`: `getFacility*()` ヘルパー7本削除、`upgradeFacility()` ラッパー削除

#### D-2. コーチUI書き換え
- `ui-render.js` `renderCoach()`:
  - 雇用中セクション: グレードバッジ(C/B/A) + 指導力/観察眼ランク表示 + スタイル + 特性名
  - 雇用候補セクション: `coachCandidates`（5-8名）表示、orgPopゲート表示
  - 枠数表示: `getMaxCoachSlots(orgPop)` ベース
- `ui-render.js` `renderTraining()`:
  - コーチサマリー: グレード + 指導力ランク + スタイル表示
  - ドロップダウン: 新フォーマット対応
- `ui-common.js` `showCoachTooltip()`:
  - specialty表示 → 指導力/観察眼/スタイル/特性の4項目表示に
- 財務UI: 施設維持費行を削除

#### D-3. ロッカールーム可視化（§3）
- `ui-render.js` manage画面上部に挿入:
  - `<img>` dojo-header.webp（1200×200、CSS width:100%）
  - 雰囲気テキスト: `lockerRoomMorale ± rng(-10,+10)` → 5段階からランダム選択
  - コーチレポート吹き出し: `_pendingCoachReport` 存在時に表示
- `index.html`: `.dojo-header`/`.atmosphere-text`/`.coach-report-bubble` CSS追加
- RNGは週ベースseedで同一週内は固定表示

#### D-4. ケアモーダルのロック表示
- `ui-common.js` `showCareActionModal()`: orgPop不足アクションをグレーアウト + 「orgPop XX で解放」テキスト

---

## 未決事項への対応

| # | 項目 | 対応方針 |
|---|------|----------|
| 1 | コーチ30-35人分データ | 既存8人をリデザイン + 新規25人程度を生成。分布: C:12 / B:8 / A:5。日本語名・emoji付き |
| 2 | 観察眼セリフ | ランク別に3-4パターンの暫定テキストを作成。後から拡充可能 |
| 4 | orgPop連動テーブル | プロモ: `floor(orgPop/25)` cap+3、スカウト: 0/10/20%。暫定値として実装 |
| 6 | コーチ特性定量効果 | 上記B-2に記載の暫定値で実装。全て🔧マーク付き |

---

## 修正対象ファイル一覧

| ファイル | Phase | 主な変更 |
|----------|-------|----------|
| `src/data.js` | B-1 | ALL_COACHES全面書き換え、FACILITIES削除、新定数群追加 |
| `src/engine.js` | A-1, B-2〜B-4 | Engine.coach書き換え、Engine.facility削除、Engine.observation新設、努力家変更 |
| `src/app.js` | A-3, C-1〜C-3 | 施設除去、コーチApp書き換え、マイグレーション、ケア変更 |
| `src/ui-render.js` | D-1〜D-3 | renderFacility削除、renderCoach書き換え、ロッカールーム可視化 |
| `src/ui-common.js` | A-3, D-1, D-2, D-4 | 施設ヘルパー削除、コーチツールチップ書き換え、ケアモーダル変更 |
| `src/index.html` | A-2, D-1, D-3 | award-frame修正、施設HTML/CSS削除、ロッカールームCSS追加 |

---

## 検証計画

1. **Phase A完了後**: プレビューで新規ゲーム開始 → 努力家選手の成長が下振れしにくいことを確認、表彰式フレーム画像表示確認、ケアモーダルのorgPopロック表示確認
2. **Phase B+C完了後**: 新規ゲーム → コーチ雇用フローが動作（候補表示→雇用→アサイン→成長反映）、施設画面にアクセスしてもクラッシュしないこと
3. **Phase D完了後**: manage画面にdojo-header画像+雰囲気テキスト表示、施設ナビボタン消滅、コーチ画面が新UI、財務表示から施設維持費消滅
4. **マイグレーション**: Phase C-3後、既存セーブデータをロードして壊れないことを確認（コーチアサイン3人截断、coachCandidates生成）
