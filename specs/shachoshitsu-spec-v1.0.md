# 🏛️ 社長室システム設計書 v1.0

> **ステータス**: 🟡 作成中
> **作成日**: 2026-04-14
> **依存**: trust-system-spec-v2.1.md / relationship-system-spec-v2.0.md / personality-archetype-spec-v1.0.md
> **置き換え対象**: 既存 `CARE_ACTIONS`, `showCareActionModal`, `Engine.careActions`
> **実装箇所（予定）**: `src/management.js` (Engine.shachoshitsu), `src/data.js` (DECISION_DOCS), `src/ui-render.js` (renderShachoshitsu), `src/ui-common.js`, `src/index.html`
> **🔧マーク = 調整可能パラメータ**

---

## 設計原則

1. **社長室は決裁の場所** — プレイヤーは「社長」として、毎週この部屋で能動的な判断（決裁）を下す
2. **決裁は社長の介入の総量** — 社長が週あたりに行える能動施策の回数は限られている（決裁枠というリソースで縛る）
3. **ケアは信頼度介入に絞る** — ケア=選手の信頼崩壊を防ぐリアクティブな介入。条件がないと発動不可
4. **即時万能感の排除** — 効果は遅延発現し、選手の性格で効き具合が変わる。所長の万能感を削り、先読みと不確実性を導入
5. **世界観への統合** — ピンクのケアモーダルを廃止し、Officeテーマ（暖色ブラウン・朱色）の「社長室」空間に統合

---

## §1 全体アーキテクチャ

### §1.1 旧ケアシステムとの対比

| 項目 | 旧（ケア） | 新（社長室） |
|---|---|---|
| 名称 | ケア | 社長決裁 |
| アクセス | 今週画面の「💝 ケア」ボタン → モーダル | トップバー「🏛️ 社長室」タブ → 専用画面 |
| リソース | careStock (初期5/最大5/4週+1) | decisionPoints (初期6/最大6/4週+2) |
| カテゴリ色 | マゼンタピンク `#e8439f` | Officeブラウン + 朱色 `#c00000` |
| UIメタファー | なし | 机・書類・印鑑 |
| アクション数 | 9（ケア） | 8（決裁書類） |
| アクション性質 | 自由 | リアクティブ（ケア4項目）+ プロアクティブ（4項目） |
| 効果の発現 | 即時 | 2〜4週かけて分割発現 |
| 効果の確定性 | 確定 | 性格で±50%変動 |

### §1.2 新しいアクションの分類

**決裁書類 8種類**:

| カテゴリ | 書類 | 性質 | コスト | 移設元 |
|---|---|---|---|---|
| リアクティブ（ケア） | bonus | 信頼不安定時 | 1 | 旧ケア |
| リアクティブ（ケア） | encourage | スランプ時・無料 | 0 | 旧ケア |
| リアクティブ（ケア） | refresh_leave | スランプ時 | 1 | 旧ケア |
| リアクティブ（ケア） | party | morale悪化時 | 1 | 旧ケア |
| プロアクティブ（育成） | trainer | 個人成長投資 | 2 | 旧ケア |
| プロアクティブ（育成） | camp | 全員成長投資 | 3 | 旧ケア |
| プロアクティブ（広報） | media | 団体広報投資 | 2 | 旧ケア |
| プロアクティブ（人事） | hireCoach | コーチ雇用 | 2 | 新規 |

**削除**:
- costume（実体がないため削除）

**決裁枠外（医療）**:
- special_treatment（不可抗力の怪我対応）→ 怪我発生時のモーダルに統合、決裁枠は消費しない

### §1.3 ナビゲーション構造

**トップバー（修正後）**:
```
📅 今週 | 🎤 興行準備 | 👥 団体 | 🔍 スカウト | 🏛️ 社長室 | 🏆 ランキング | 📊 データベース | 🏢 経営 | 📋 ログ | 💾 セーブ | ❓ ヘルプ
```

- 5番目に「🏛️ 社長室」を新規追加
- スカウトは現状維持（4番目）
- 団体タブは現状維持
- 他タブは右に1つずつシフト

---

## §2 決裁枠システム（decisionPoints）

### §2.1 基本仕様

| 項目 | 値 🔧 |
|---|---|
| 初期値 | 6 |
| 最大値（キャップ） | 6 |
| 回復タイミング | 第1,5,9,13,17,21,25,29,33,37,41,45週の進行時 |
| 回復量 | +2 |
| オフシーズン | 回復なし（前シーズン末の残量を持ち越し） |
| キャップ到達時 | 頭打ち（警告なし、見た目で満タン表現） |

### §2.2 回復スケジュール

レッスルマネージャーの1シーズン = 48週、12ヶ月（4週で1ヶ月）。

```
月1開始: 第1週 → 決裁枠+2 (初期から開始)
月2開始: 第5週 → 決裁枠+2
月3開始: 第9週 → 決裁枠+2
...
月12開始: 第45週 → 決裁枠+2
```

シーズン理論最大供給: 6（初期） + 12ヶ月 × 2 = **30枠**

### §2.3 決裁枠の状態管理

```javascript
// G（gameState）に追加する新フィールド
G.decisionPoints: number      // 現在の決裁枠（0〜6）
G.decisionPointsMax: number   // 最大値（デフォルト6、将来の拡張用）
```

**マイグレーション** (§9で詳述): 既存セーブの `G.careStock` と `G.careStockMax` は読み捨てて、新フィールドを初期値で設定する。

### §2.4 消費と回復のタイミング

- **消費**: 決裁書類の実行時に即座に消費
- **回復**: 週進行処理（`advanceWeek` 内）で、該当週なら +2
- **満タン時の回復**: `Math.min(decisionPoints + 2, decisionPointsMax)` で頭打ち

### §2.5 UI表示

HUD（社長室画面の上部）に印鑑6個を横並び表示。

- **使用可能**: 印鑑が立っている + ほのかな金色の光 `filter: drop-shadow(0 0 6px rgba(255,200,100,0.4))`
- **使用済み**: 印鑑が横倒し（CSSで `transform: rotate(90deg)` ）+ 彩度低下
- **消費時アニメーション**: 立っている印鑑がスーッと倒れる（0.5秒、ease-out）
  - ただし実機テストで不自然と判断されたら瞬時切替に変更
- **回復時アニメーション**: 瞬時に起き上がる（アニメーションなし）

---

## §3 決裁書類（DECISION_DOCS）

### §3.1 データ構造

`src/data.js` に新規定義する `DECISION_DOCS` オブジェクト。`CARE_ACTIONS` の後継。

```javascript
const DECISION_DOCS = {
  bonus: {
    id: 'bonus',
    label: 'ボーナス支給願',
    category: 'care',        // 'care' | 'growth' | 'pr' | 'hr'
    icon: '💰',              // 書類中央に表示する絵文字アイコン（§7.3参照）
    cost: 50,                // 資金コスト（万）
    decisionCost: 1,         // 決裁枠コスト
    activationCondition: 'trust_unstable',  // §3.3参照
    minOrgPop: 0,
    cooldown: 1,             // 同一対象への再発動待ち週数
    body: '対象選手に特別手当を支給し、組織貢献への感謝を示す',  // 書類本文（常時表示）
    // ホバー時に表示するツールチップ3項目（§7.3参照）
    detailText: '特別手当の支給により、信頼関係に揺らぎのある選手の心を繋ぎ止める。額面よりも「見てくれている」という事実が響く。',
    effectSummary: '信頼度 +8〜12（2-3週後に発現）',
    recommendation: '信頼度が60を下回り始めた選手に早期介入するのが効果的。',
    effect: { /* §4参照 */ },
    delay: { /* §5参照 */ },
    uncertainty: { /* §6参照 */ },
  },
  // ... 他7種類
};
```

### §3.2 8書類の完全定義

#### bonus（ボーナス支給願）
- **カテゴリ**: `care`
- **アイコン**: 💰
- **コスト**: 50万 / 決裁枠1
- **発動条件**: `trust_unstable` — 対象候補が1人以上いること（trust < 60の選手が存在）
- **効果対象**: 個人
- **効果**: 信頼度上昇（遅延発現）
- **逓減**: 同一選手への連続使用で効果半減（既存のbonus_repeat仕様を継承）
- **cooldown**: 1週
- **書類見出し**: 「ボーナス支給願」
- **書類本文**: 「対象選手に特別手当を支給し、組織貢献への感謝を示す」
- **ホバー詳細**:
  - detailText: 「特別手当の支給により、信頼関係に揺らぎのある選手の心を繋ぎ止める。額面よりも『見てくれている』という事実が響く。」
  - effectSummary: 「信頼度 +8〜12（2-3週後に発現）」
  - recommendation: 「信頼度が60を下回り始めた選手に早期介入するのが効果的。」

#### encourage（面談申込）
- **カテゴリ**: `care`
- **アイコン**: 💬
- **コスト**: 0万 / 決裁枠0
- **発動条件**: `slump_or_motivation_loss` — 対象候補が1人以上いること
- **効果対象**: 個人
- **効果**: スランプ回復モーメンタム + 信頼度微上昇
- **cooldown**: 1週
- **書類見出し**: 「面談申込書」
- **書類本文**: 「スランプ中の選手と対話し、気持ちを立て直す機会を設ける」
- **ホバー詳細**:
  - detailText: 「社長自ら面談の場を設け、選手の本音に耳を傾ける。コスト0・決裁枠0でスランプ脱出の糸口を掴める気軽な一手。」
  - effectSummary: 「スランプ回復モーメンタム + 信頼度微上昇」
  - recommendation: 「スランプ/モチベ低下の初期段階で真っ先に使いたい。」

#### refresh_leave（休暇辞令）
- **カテゴリ**: `care`
- **アイコン**: 🏖️
- **コスト**: 100万 / 決裁枠1
- **発動条件**: `slump_or_motivation_loss`
- **効果対象**: 個人
- **効果**: 強力なスランプ回復 + condition回復 + 信頼度上昇
- **cooldown**: 4週
- **書類見出し**: 「休暇辞令」
- **書類本文**: 「心身の疲弊を察し、一定期間の休養を与える」
- **ホバー詳細**:
  - detailText: 「数週間の休養を正式な辞令として発行。強制的に現場から離脱させることで、心身を根本から回復させる重い一手。」
  - effectSummary: 「スランプ強力回復 + condition回復 + 信頼度上昇」
  - recommendation: 「面談では効果が薄い重症スランプに対する切り札。クールダウン4週に注意。」

#### party（慰労会開催届）
- **カテゴリ**: `care`
- **アイコン**: 🍻
- **コスト**: 単価15万×人数 / 決裁枠1
- **発動条件**: `morale_low` — ロッカールームの雰囲気が60未満(2026-04-15 Phase 4 レビュー反映で 50→60 に緩和)
- **効果対象**: 団体全員
- **効果**: 全員の信頼わずかに上昇 + ロッカールームの雰囲気回復
- **cooldown**: 1週（団体全体で1回）
- **書類見出し**: 「慰労会開催届」
- **書類本文**: 「団体の雰囲気を立て直すべく、慰労の宴席を設ける」
- **ホバー詳細**(プレイヤー向け表記: 英字変数名は使わず日本語で):
  - detailText: 「全選手を集めた慰労の宴席。個別の数値を動かすより、ロッカールームの空気そのものを立て直すのが主目的。」
  - effectSummary: 「全員の信頼がわずかに上がる + ロッカールームの雰囲気が良くなる」
  - recommendation: 「ロッカールームの空気に少し陰りが見えてきたときの応急処置として。単発では決定打にならない点に留意。」

#### trainer（専属トレーナー手配書）
- **カテゴリ**: `growth`
- **アイコン**: 💪
- **コスト**: 160万 / 決裁枠2
- **発動条件**: なし（常時発動可）
- **効果対象**: 個人
- **効果**: 4週間 成長速度+30% + 信頼度上昇
- **cooldown**: 1週
- **書類見出し**: 「専属トレーナー手配書」
- **書類本文**: 「対象選手の成長を加速させるため、外部専属トレーナーを招聘する」
- **ホバー詳細**:
  - detailText: 「外部の専属トレーナーを期間限定で招聘。短期集中で成長曲線を押し上げる、育成特化の投資型書類。」
  - effectSummary: 「4週間 成長速度+30% + 信頼度上昇」
  - recommendation: 「伸ばしたい若手、シリーズ前の追い込み期、昇格を狙う選手に充てたい。」

#### camp（合宿実施手配書）
- **カテゴリ**: `growth`
- **アイコン**: 🏕️
- **コスト**: 単価40万×人数 / 決裁枠3
- **発動条件**: なし
- **効果対象**: 団体全員
- **効果**: 2週間 全員成長速度+50% + 全員信頼度微上昇
- **cooldown**: 1週
- **書類見出し**: 「合宿実施手配書」
- **書類本文**: 「全選手を集中的に強化するため、合宿を実施する」
- **ホバー詳細**:
  - detailText: 「選手全員を合宿地へ送り込み、短期集中で基礎を鍛え直す。単価40万×人数と決裁枠3の重量級書類。」
  - effectSummary: 「2週間 全員成長速度+50% + 全員信頼度微上昇」
  - recommendation: 「資金に余裕があり、オフシーズンに全体を底上げしたいとき。年1〜2回が現実的な使用頻度。」

#### media（メディア露出手配書）
- **カテゴリ**: `pr`
- **アイコン**: 📺
- **コスト**: 120万 / 決裁枠2
- **発動条件**: `minOrgPop 20` — 団体人気が20以上
- **効果対象**: 個人
- **効果**: 団体露出 orgPop +0.4 + 対象選手 condition+5 + 信頼度上昇
- **cooldown**: 2週
- **書類見出し**: 「メディア露出手配書」
- **書類本文**: 「対象選手を広告塔とし、団体の知名度向上を図る」
- **ホバー詳細**:
  - detailText: 「対象選手をメディア露出の広告塔として起用。団体の知名度向上と本人のコンディション維持を両立させる外向き施策。」
  - effectSummary: 「orgPop +0.4 + 対象選手 condition+5 + 信頼度上昇」
  - recommendation: 「団体人気20以上が前提。看板選手のコンディション管理と兼ねて回すと無駄がない。」

#### hireCoach（コーチ雇用決裁書）★新規
- **カテゴリ**: `hr`
- **アイコン**: 🎓（机には並ばないため実UI上は未使用。データ定義上のみ保持）
- **コスト**: コーチの雇用費（候補ごとに変動）/ 決裁枠2
- **発動条件**: なし（コーチ枠に空きがあること）
- **効果対象**: 新規コーチ1名
- **効果**: 既存のコーチ雇用処理を実行
- **cooldown**: なし（資金が続く限り実行可能、ただし決裁枠を消費）
- **書類見出し**: 「コーチ雇用決裁書」
- **書類本文**: 「新たなスタッフを招聘し、団体の指導体制を強化する」
- **ホバー詳細**:
  - detailText: 「新たなコーチを招聘し、指導体制を強化する。机には並ばず、コーチ画面から実行する特殊書類。」
  - effectSummary: 「コーチ1名雇用（決裁枠2消費）」
  - recommendation: 「コーチ枠に空きがあり、新規雇用を検討している週に。机に書類として表示されない点に注意。」
- **実装注意**: この書類は社長室から実行するのではなく、**既存のコーチ画面で雇用時に決裁枠をチェック・消費する**形で実装。社長室の机には書類として**表示しない**（他の書類と性質が異なるため）。
  - ただし、§3.4の「机に並ぶ書類」のカウントからは除外。
  - 決裁枠が0の場合、コーチ画面の雇用ボタンが無効化される。

### §3.3 発動条件（activationCondition）

発動条件は `Engine.shachoshitsu.checkActivation(docId, state)` で判定する。

| 条件ID | 判定ロジック |
|---|---|
| なし（undefined） | 常時発動可 |
| `trust_unstable` 🔧 | `state.roster.some(f => !f.isRental && !f.injury && (f.trust ?? 50) < 60)` |
| `slump_or_motivation_loss` | `state.roster.some(f => (f.slump \|\| f.motivationLoss) && !f.isRental)` |
| `morale_low` 🔧 | `(state.lockerRoomMorale ?? 60) < 60` (2026-04-15 Phase 4 レビューで 50→60 に緩和) |

**閾値の根拠**:
- **trust < 60**: 信頼度60を「安定」の基準とする。60以上は介入不要、60未満で要注意。60は既存のtrustシステムで「high帯(70+) / normal帯(40-69)」の境目に近い値。
- **morale < 60**: ロッカールームの雰囲気が陰ってきた状態。デフォルト値=60-65帯が通常運営の基準線で、60を下回ると「少し陰ってきた」と判定。Phase 4 初版では 50 だったが、auto-sim + 実機レビューで「危機時以外に机に出ない」ことが判明したため、予防的に使える 60 に緩和(2026-04-15)。

### §3.4 机に並ぶ書類の動的生成

毎週、机の上には**今週実行可能な書類のみ**が並ぶ。

```javascript
Engine.shachoshitsu.getAvailableDocs(state) {
  const docs = [];
  for (const docId of DOC_ORDER) {  // bonus, encourage, refresh_leave, party, trainer, camp, media
    const doc = DECISION_DOCS[docId];
    // hireCoachはコーチ画面からの実行なので机には並べない
    if (docId === 'hireCoach') continue;
    // 発動条件チェック
    if (!Engine.shachoshitsu.checkActivation(docId, state)) continue;
    // orgPopチェック
    if (doc.minOrgPop && (state.orgPop || 0) < doc.minOrgPop) continue;
    // teamアクションのcooldownチェック
    if (doc.effect.target === 'team') {
      const used = (state._decisionWeekUsed || {})[docId];
      if (used === state.week) continue;
    }
    docs.push(doc);
  }
  return docs;
}
```

机の上には **最大7種類** の書類が並ぶ。条件を満たさない書類は机に出ない。

**机に並ぶ順序（固定）**:
```
1行目: bonus | encourage | refresh_leave | party
2行目: trainer | camp | media | (空)
```

**決裁済み書類**: 今週既に決裁した書類は、机の上に**朱印が押された状態**で残る。クリック無効化、CSSフィルターで彩度低下。
次の週の進行時に、決裁済みフラグはリセットされる。

---

## §4 決裁の効果（effect）

### §4.1 効果の基本構造

```javascript
effect: {
  target: 'individual' | 'team',
  trust?: number,           // 信頼度の総上昇量（遅延発現される）
  condition?: number,       // condition回復量（即時）
  morale?: number,          // morale上昇量（即時）
  growthBoost?: {           // 成長バフ
    weeks: number,
    mult: number
  },
  slumpMomentum?: number,   // スランプ回復モーメンタム
  orgPopDelta?: number,     // 団体人気上昇
  customHandler?: string,   // 特殊処理のID
}
```

### §4.2 書類別効果定義

既存のCARE_ACTIONSの効果をベースに、遅延発現を前提として再構築する。

| 書類 | target | trust | condition | morale | growthBoost | slumpMomentum | orgPopDelta |
|---|---|---|---|---|---|---|---|
| bonus | individual | 4.59 (逓減あり) | - | - | - | - | - |
| encourage | individual | 0.77 | - | - | - | 2.5〜4.0 | - |
| refresh_leave | individual | 5.36 | 15 | - | - | 12.0 | - |
| party | team | 1.84 (全員) | - | 5 | - | - | - |
| trainer | individual | 5.97 | - | - | {4, 1.3} | - | - |
| camp | team | 1.84 (全員) | - | - | {2, 1.5} (全員) | - | - |
| media | individual | 5.36 | 5 | - | - | - | 0.4 |
| hireCoach | - | - | - | - | - | - | - (既存処理) |

### §4.3 即時発現 vs 遅延発現

**即時発現する効果**:
- condition
- morale
- growthBoost（バフの付与タイミング）
- slumpMomentum
- orgPopDelta
- costume／カスタム処理

**遅延発現する効果**:
- trust（信頼度の上昇のみ）

trustだけを遅延発現させる理由: これが「即時万能感」を生む主因だから。conditionや成長バフはシステム的に時間がかかる効果（4週間バフ等）なので、発現を遅延させる意味が薄い。

---

## §5 遅延発現メカニズム

### §5.1 基本方針

信頼度上昇を **3週間にわたって分割発現** させる。

**実装例**: bonus で trust +6 を付与した場合
- 実行週: trust +2 (約33%)
- 1週後: trust +2 (約33%)
- 2週後: trust +2 (約33%)

毎週の進行時に、未発現分を少しずつ反映していく。

### §5.2 データ構造

選手オブジェクトに新フィールド `pendingTrustDeltas` を追加する。

```javascript
fighter.pendingTrustDeltas = [
  {
    source: 'bonus',          // 書類ID
    totalDelta: 6,            // 総上昇量
    weeksRemaining: 3,        // 残り発現週
    perWeekDelta: 2,          // 毎週の発現量
    startedWeek: 12,          // 発動週（ログ用）
  },
  // ... 複数の効果が並列で存在可能
];
```

### §5.3 毎週の発現処理

```javascript
// advanceWeek 内で呼ばれる
Engine.shachoshitsu.applyPendingTrustDeltas(state) {
  state.roster = state.roster.map(f => {
    if (!f.pendingTrustDeltas || f.pendingTrustDeltas.length === 0) return f;
    let trust = f.trust ?? 50;
    const remaining = [];
    for (const delta of f.pendingTrustDeltas) {
      trust = Engine.util.clamp(trust + delta.perWeekDelta, 0, 100);
      if (delta.weeksRemaining > 1) {
        remaining.push({ ...delta, weeksRemaining: delta.weeksRemaining - 1 });
      }
    }
    return { ...f, trust, pendingTrustDeltas: remaining };
  });
  return state;
}
```

### §5.4 発現期間 🔧

デフォルト: **3週間に分割**

将来の調整ポイント:
- 短くしたい → 2週間
- 長くしたい → 4週間
- 書類ごとに変える → `DECISION_DOCS[id].delay.weeks`

### §5.5 UI表現

社長室の書類説明に「効果は3週にわたって発現」と明記。実行後のトースト通知にも「効果が徐々に現れる」旨を表示。

発現中の選手の詳細画面で、進行中の効果を可視化する（例: 「ボーナス効果：あと2週」）。ただしこれはPhase 9の磨き込みで対応。

---

## §6 不確実性メカニズム

### §6.1 基本方針

信頼度上昇の効果量を、選手の性格によって **±50%の範囲で変動** させる。

不確実性は **trust効果のみに適用**。他の効果（condition、growthBoost等）には適用しない。

### §6.2 変動式

```javascript
finalDelta = baseDelta × personalityMult × archetypeMult
```

- `baseDelta`: 書類の基本効果量（§4.2のtrust値）
- `personalityMult`: 性格×書類IDのマトリクス（§6.3）
- `archetypeMult`: アーキタイプ（ojousama, delinquent等）による追加係数（§6.4）

### §6.3 性格×書類 マトリクス 🔧

| 性格 | bonus | encourage | refresh_leave | party | trainer | media |
|---|---|---|---|---|---|---|
| normal | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| bold | 0.80 | 0.70 | 0.90 | 1.00 | 1.20 | 1.00 |
| quiet | 1.00 | 1.20 | 1.10 | 0.70 | 1.00 | 0.60 |
| shy | 1.20 | 1.30 | 1.20 | 0.50 | 1.00 | 0.60 |
| easygoing | 1.10 | 1.00 | 1.00 | 1.20 | 0.90 | 1.10 |
| earnest | 0.90 | 1.20 | 1.10 | 0.90 | 1.30 | 1.00 |
| emotional | 1.30 | 1.40 | 1.20 | 1.10 | 1.00 | 1.20 |

**読み方**:
- bold（強気）はbonusに冷めている（金では動かない）
- quiet（物静か）はpartyが苦手
- shy（恥ずかしがり）はpartyとmediaが苦手（人前が苦手）
- earnest（真面目）はtrainerを喜ぶ（向上心）
- emotional（情緒的）は全体的に響きやすい

### §6.4 アーキタイプ×書類 マトリクス 🔧

一部のアーキタイプには追加の倍率を適用。

| アーキタイプ | bonus | party | media | 備考 |
|---|---|---|---|---|
| ojousama（お嬢様） | 0.70 | 1.00 | 1.10 | 金には動じない |
| delinquent（不良） | 1.30 | 1.30 | 0.80 | 金と酒は効く、メディアは嫌う |
| cool（クール） | 0.70 | 0.60 | 0.80 | 全体的に冷めている |
| seductive（大人） | 1.00 | 1.10 | 1.30 | 華やかな場で輝く |

記載のないアーキタイプは1.00。

### §6.5 変動幅のガード

極端な値を避けるため、最終倍率には下限・上限を設ける。

```javascript
finalMult = Math.max(0.5, Math.min(1.5, personalityMult × archetypeMult))
```

つまり実効倍率は**0.5〜1.5倍**の範囲に収まる。

### §6.6 UI表現

#### 期待値表示
書類の説明では**固定値ではなく範囲**で表示:
- 「信頼度が少し上がる（選手による）」
- 「信頼度が中程度上がる（選手による）」

具体的な数値は見せない。

#### 結果表示
実行後のトーストで実際の効果量を表示:
- 「〇〇の信頼度が予想以上に上がった」（finalMult ≥ 1.2）
- 「〇〇の信頼度が少し上がった」（0.8 ≤ finalMult < 1.2）
- 「〇〇には響かなかったようだ」（finalMult < 0.8）

これで「刺してみないとわからない」が体感される。

---

## §7 社長室画面

### §7.1 画面レイアウト

基準解像度: **1920 × 1080** px（CSS で画面サイズに応じて伸縮）

```
┌────────────────────────────────────────────────┐  0
│  HUD: 日付 | 資金 | 決裁枠（印鑑6個）          │  60
├────────────────────────────────────────────────┤
│                                                │
│   壁 + 窓 + 景色（春夏秋冬で切り替え）          │
│   画像: wall-window-{season}.webp  1920×400     │
│                                                │  460
├────────────────────────────────────────────────┤
│                                                │
│   机の天板                                      │
│   画像: desk.webp  1920×1020                    │
│   この上に書類を配置                            │
│                                                │
│      [書類1] [書類2] [書類3] [書類4]            │
│                                                │
│      [書類5] [書類6] [書類7] [書類8]            │  1080
└────────────────────────────────────────────────┘
```

**レイヤー順（z-index順、上から）**:
1. HUD（position: fixed, z-index: 100）
2. 朱印エフェクト（実行時のみ表示、z-index: 80）
3. 書類（z-index: 50）
4. 机（z-index: 10）
5. 壁+窓+景色（z-index: 5、机の裏側）

**机と壁の境界**: 実装時、机画像が壁画像の下端に60pxほど重なるように配置して、境界を馴染ませる。

### §7.2 書類のグリッド配置

8つの書類を4×2グリッドで机の中央に配置する。

- 書類サイズ: 240 × 320 px (2倍解像度なら 480×640 の画像を縮小表示)
- グリッド: 横4 × 縦2
- ギャップ: 20px
- グリッド全体: 1020 × 660 px
- 机エリア内での配置: 中央寄せ

条件を満たさない書類は**表示しない**。表示される書類は `DECISION_DOC_ORDER` の順序を保ったまま左上から詰めて並べる(空いたスロットに穴を残さない)。

**実装メモ (Phase 3 2026-04-15)**:
- 初回実装では「穴は空いたまま」を厳密に再現し、DECISION_DOC_ORDER のインデックスから固定位置を計算していた (`gridCol = idx%4+1`, `gridRow = floor(idx/4)+1`)。
- しかし Keisuke さんの実機レビューで「空いたスロットが飛び地になると紙だけ抜けたように見えて違和感が強い」と判明したため、**左上から自然に詰めるフロー方式に変更**した。CSS Grid のデフォルト詰めに任せ、`grid-column/grid-row` は付与しない。
- 書類の相対順序は `DECISION_DOC_ORDER` で決まるので、週ごとに書類が入れ替わるわけではない(非表示の書類が前詰めされるだけ)。
- ツールチップ位置補正は `data-col` 属性(1..4、レンダー列)を各書類に付与し、`[data-col="1"]` と `[data-col="4"]` の CSS 側で左右位置を調整する(nth-child では非表示書類がカウントされないので正しく機能しないため、data-col 方式で統一)。

### §7.3 書類の見た目

各書類は「紙の背景 + カテゴリタグ + 絵文字アイコン + 見出し + 本文 + コストバッジ」の6要素で構成される。書類本体は常時表示される情報のみを持ち、詳細はホバー時のツールチップに逃がす。

**構成要素**:

1. **背景画像**: `document-blank.webp` （決裁済みは `document-stamped.webp`）
2. **カテゴリタグ**: 左上の小バッジ（`care` / `growth` / `pr` / `hr` を日本語表記）
3. **絵文字アイコン**: 書類中央に大きめ（32〜36px）で表示。`DECISION_DOCS[id].icon` を参照
4. **書類見出し**: §3.2の label をアイコンの下に配置
5. **書類本文**: §3.2の body（1行要約）。小さめのフォントで2行まで
6. **コストバッジ**: 右下に「50万 / 決裁⚡1」

**ホバー詳細ツールチップ（新規）**:

書類をホバーすると、右側（画面端では左側に自動反転）に詳細ツールチップがフェードインする。ツールチップには §3.2 で定義した以下の3項目を表示する:

- **詳細説明**（detailText）: 書類本文より一歩踏み込んだ説明文
- **効果**（effectSummary）: 具体的な数値・期間・影響範囲
- **使いどころ**（recommendation）: どんなタイミングでどの選手に使うべきか

ツールチップ仕様:
- サイズ: 約280px幅 × 可変高
- 背景: 暗色半透明（`rgba(24,22,20,0.95)`）+ 金色ボーダー（`rgba(212,168,67,0.5)`）
- フォント: Noto Sans JP、本文12px
- 遅延: ホバー開始から 0.3秒後に表示（誤ホバー防止）
- アニメーション: opacity 0→1 を 0.15s で
- 位置: 書類の右側。ただしグリッド右端2列（`:nth-child(4n)`, `:nth-child(4n-1)`）は左側表示
- 資金不足・決裁枠不足状態では詳細ツールチップは出さず、§7.3末尾の不足理由ツールチップを優先

**書類本体ホバー時の動き**:
- 少し浮き上がる `transform: translateY(-4px)`
- 影が強くなる
- カーソル変化

**クリック可能状態と無効化状態**:
- **クリック可能**: 通常表示 + ホバー有効（詳細ツールチップ表示）
- **資金不足**: 書類がわずかに暗くなる + 詳細ツールチップは非表示 + 「資金不足」ツールチップを表示
- **決裁枠不足**: 書類がわずかに暗くなる + 詳細ツールチップは非表示 + 「決裁枠不足」ツールチップを表示
- **決裁済み**: 朱印付き画像 + ホバー無効

### §7.4 HUD 実装

画面上部に固定表示されるヘッダー。

```html
<div class="shachoshitsu-hud">
  <div class="hud-left">
    <span class="hud-date">第12週 春</span>
    <span class="hud-funds">資金 5,230万</span>
  </div>
  <div class="hud-right">
    <div class="hud-hankos">
      <!-- 印鑑6個を状態に応じて表示 -->
      <img class="hanko available" src="image/shachoshitsu/hanko.webp">
      <img class="hanko available" src="image/shachoshitsu/hanko.webp">
      <img class="hanko available" src="image/shachoshitsu/hanko.webp">
      <img class="hanko available" src="image/shachoshitsu/hanko.webp">
      <img class="hanko used" src="image/shachoshitsu/hanko.webp">
      <img class="hanko used" src="image/shachoshitsu/hanko.webp">
    </div>
  </div>
</div>
```

### §7.5 画面遷移

- **入場**: トップバーの「🏛️ 社長室」をクリック → 0.3秒フェードで社長室画面へ
- **退場**: 他のタブをクリック → 0.3秒フェードで他画面へ
- 社長室画面自体に「戻る」ボタンは不要（タブで他画面に移動すればよい）

### §7.6 季節による窓の切り替え

```javascript
function getSeasonImage(week) {
  if (week <= 12) return 'wall-window-spring.webp';
  if (week <= 24) return 'wall-window-summer.webp';
  if (week <= 36) return 'wall-window-autumn.webp';
  return 'wall-window-winter.webp';
}
```

画面レンダリング時に現在の週から季節を判定し、対応する画像を背景に設定する。

---

## §8 決裁実行フロー

### §8.1 実行手順

1. プレイヤーが書類をクリック
2. **対象選手選択モーダル**（個人書類の場合）または**確認モーダル**（団体書類の場合）を表示
3. 対象を選択、確認ボタン
4. **決裁枠と資金を消費**
5. **効果を適用**（即時効果 + 遅延効果のpending登録）
6. **朱印エフェクト**を書類の上に表示（アニメーション）
7. HUDの印鑑を1本倒す（アニメーション）
8. 書類を決裁済み状態に切り替え（朱印書類画像に差し替え）
9. **結果トースト**を画面下に表示（不確実性の効果度合いを含む）
10. サウンド再生（朱印音 + 決裁完了音）

### §8.2 対象選手選択モーダル

個人書類の場合、発動条件を満たす選手全員が対象候補。

```
┌──────────────────────────────────┐
│  ボーナス支給願 - 対象選手を選択  │
├──────────────────────────────────┤
│  [選手1] [選手2] [選手3]         │
│  [選手4] [選手5]                 │
├──────────────────────────────────┤
│  [キャンセル]  [決裁実行]         │
└──────────────────────────────────┘
```

各選手カードには:
- 顔画像
- 名前
- 現在のtrust（bonus の場合）or スランプ状態（encourage等の場合）
- 選択状態の枠

### §8.3 団体書類の確認モーダル

team書類（party, camp）の場合は対象選手の選択不要、確認のみ:

```
┌──────────────────────────────────┐
│  合宿実施手配書 - 確認            │
├──────────────────────────────────┤
│  対象: 団体全員（6名）            │
│  コスト: 240万 / 決裁⚡3           │
│  効果: 2週間 全員成長速度+50%     │
├──────────────────────────────────┤
│  [キャンセル]  [決裁実行]         │
└──────────────────────────────────┘
```

### §8.4 朱印アニメーション

決裁実行時、書類の上に朱印画像 `stamp-effect.webp` を重ねて表示。

```css
@keyframes stamp-slam {
  0% { opacity: 0; transform: scale(2) rotate(-10deg); }
  30% { opacity: 1; transform: scale(1.1) rotate(-3deg); }
  50% { transform: scale(1) rotate(-2deg); }
  100% { opacity: 1; transform: scale(1) rotate(-2deg); }
}
```

0.6秒の演出。終わった後も朱印はそのまま書類に残る（決裁済み表示）。

### §8.5 印鑑が倒れるアニメーション

```css
@keyframes hanko-fall {
  0% { transform: rotate(0deg); opacity: 1; }
  100% { transform: rotate(90deg); opacity: 0.5; }
}
```

0.5秒の演出。実機テストで不自然と判断された場合、瞬時切替（アニメーションなし）に変更。

---

## §9 マイグレーションと削除

### §9.1 既存セーブデータの扱い

ユーザーの既存セーブには以下のフィールドが存在する:
- `G.careStock` — 旧決裁枠
- `G.careStockMax` — 旧最大値
- `G._teamCareWeekUsed` — 団体ケアのcooldown管理
- `G.roster[i]._careWeekUsed` — 個人ケアのcooldown管理
- `G.roster[i]._bonusRepeat` — ボーナス逓減カウンタ

**マイグレーション戦略**:
1. セーブ読み込み時、`G.decisionPoints` が未定義なら**新規初期値6でセット**
2. `G.careStock` 等の旧フィールドは読み捨て（削除）
3. `_teamCareWeekUsed` は `_decisionWeekUsed` にリネーム（値はそのまま使える）
4. `_careWeekUsed` は `_decisionWeekUsed`（選手ごと）にリネーム
5. `_bonusRepeat` はそのまま維持

### §9.2 削除するコード

**完全削除**:
- `CARE_ACTIONS.costume` （costume書類は廃止）
- `Engine.careActions.execute` の `actionId === 'costume'` 分岐
- `showCareActionModal` 関数本体（`src/ui-common.js`）
- `App.openCareModal`（`src/app.js`）
- 今週画面の「💝 ケア」ボタン（`src/ui-render.js` 内の該当箇所）
- `care-modal-*`, `care-overlay`, `care-box` 関連のCSS（`src/index.html`）
- `CARE_REACTION_DIALOGUES.costume` 関連

**リネーム**:
- `CARE_ACTIONS` → `DECISION_DOCS`
- `Engine.careActions` → `Engine.shachoshitsu`
- `careStock` → `decisionPoints`
- `_teamCareWeekUsed` → `_decisionWeekUsed`
- `_careWeekUsed` → `_decisionWeekUsed`（個別選手）

**変更**:
- `special_treatment`: 決裁書類ではなくなる。怪我発生モーダルに統合。資金コストは維持、決裁枠消費なし。
- `hireCoach`: コーチ画面の既存雇用処理に決裁枠チェックを追加

### §9.3 関連CSSの整理

旧ケア関連のCSSクラス（`src/index.html` 内）:
- `.care-modal-overlay`, `.care-modal-box`, `.care-modal-name`, `.care-modal-speech`, `.care-modal-changes`, `.care-modal-change*`, `.care-modal-cost`, `.care-modal-btn`, `.care-modal-face`
- `.care-overlay`, `.care-box`, `.care-title`, `.care-section-label`
- `.care-action-row`, `.care-action-emoji`, `.care-action-info`, `.care-action-name`, `.care-action-desc`, `.care-action-cost`
- `.care-fighter-grid`, `.care-fighter-card*`
- `.care-reaction*`, `.care-close-btn`
- `.care-result-*`, `.care-rc-*`, `.care-expect*`

これらは全削除し、新しい `.shachoshitsu-*` プレフィックスのCSSクラスを追加する。

### §9.4 データ構造の変更

G state に追加:
```javascript
G.decisionPoints: number       // 現在の決裁枠
G.decisionPointsMax: number    // 最大値
G._decisionWeekUsed: {         // 団体決裁のcooldown
  [docId]: weekNumber
}
G._decisionDoneThisWeek: []    // 今週既に決裁した書類IDリスト
```

選手オブジェクト（`G.roster[i]`）に追加:
```javascript
f.pendingTrustDeltas: [        // 遅延発現中の信頼効果
  {
    source: string,            // 書類ID
    totalDelta: number,
    perWeekDelta: number,
    weeksRemaining: number,
    startedWeek: number,
  }
]
f._decisionWeekUsed: {         // 個人決裁のcooldown
  [docId]: weekNumber
}
```

選手オブジェクトから削除:
```javascript
f._careWeekUsed: {}  // → _decisionWeekUsed にリネーム
```

---

## §10 ファイル変更マップ

| ファイル | 変更内容 |
|---|---|
| `src/data.js` | `CARE_ACTIONS` 削除、`DECISION_DOCS` 新規追加、`CARE_REACTION_DIALOGUES` の costume 削除 |
| `src/management.js` | `Engine.careActions` → `Engine.shachoshitsu`、遅延発現処理追加、不確実性処理追加、週進行での決裁枠回復、`pendingTrustDeltas` 処理、`_teamCareWeekUsed` → `_decisionWeekUsed` |
| `src/ui-render.js` | `renderWeekScreen` の「💝 ケア」ボタン削除、`renderShachoshitsu` 新規追加、社長室画面のHTML構築 |
| `src/ui-common.js` | `showCareActionModal` 削除、`showDecisionTargetModal` 新規、朱印エフェクトの実装、結果トーストの実装 |
| `src/app.js` | `App.openCareModal` 削除、`App.executeCareAction` → `App.executeDecision`、既存セーブマイグレーション処理追加、`hireCoach` の決裁枠チェック追加 |
| `src/index.html` | トップバーに「🏛️ 社長室」タブ追加、ケア関連CSS削除、社長室CSS追加、社長室のDOMコンテナ追加 |

---

## §11 Phase 分割

Phase 0（本仕様書）完了後、以下のPhaseを順番に実行する。各Phaseは独立にテスト可能で、完了時点でゲームが動作する状態を保つ。

### Phase 1: 社長室画面の骨組み

**目的**: トップバーに社長室タブを追加し、専用画面を表示できるようにする。機能は無く、見た目だけの静的画面。

**タスク**:
1. `src/index.html` のトップバーにボタン追加（スカウトの右）
2. `src/index.html` に `<div id="shachoshitsuContent">` コンテナ追加
3. `src/ui-common.js` の `showScreen` に `'shachoshitsu'` 分岐追加
4. `src/ui-render.js` に `renderShachoshitsu` 関数を新規追加
5. 画像読み込み: 壁+窓（季節判定）+ 机 + 書類プレースホルダー8枚
6. HUDの骨組み（日付・資金・印鑑6本）を配置、ただし印鑑は常に全部立っている状態
7. CSS: `.shachoshitsu-*` 系のクラスを `src/index.html` に追加
8. 書類はクリック無効のプレースホルダー

**成果物**: 🏛️ 社長室タブを開くと、社長室の見た目が表示される。インタラクションはなし。

**検証**:
- トップバーに新タブが出ている
- タブクリックで遷移する
- 季節に応じて窓画像が切り替わる
- 既存のケアモーダルが壊れていない
- ゲーム起動・既存セーブ読み込みが正常動作

### Phase 2: 決裁枠システム

**目的**: `decisionPoints` の状態を導入し、HUDに反映する。まだ何も消費できない。

**タスク**:
1. `G.decisionPoints`, `G.decisionPointsMax` を追加
2. 既存セーブのマイグレーション（未定義なら初期値6）
3. 週進行処理に決裁枠回復ロジック追加（第1,5,9,...週で +2）
4. オフシーズン開始時にフル回復
5. HUD の印鑑表示を state 連動にする（使用済み状態を表示）
6. CSS: `.hanko.used` スタイル追加（横倒し・彩度低下）

**成果物**: 社長室HUDに現在の決裁枠が印鑑で表示される。週進行で回復する。

**検証**:
- 初期状態で印鑑6本立っている
- 週を進めると4週ごとに回復する
- 既存セーブでも正しく初期化される

### Phase 3: 書類の動的生成と表示 ✅ 完了 (2026-04-15)

**目的**: 書類データを定義し、発動条件に応じて机に並べる。

**タスク**:
1. `src/data.js` に `DECISION_DOCS` 定義（8種類、うちhireCoachを除く7種類が机に並ぶ）
2. `Engine.shachoshitsu.checkActivation` 関数実装
3. `Engine.shachoshitsu.getAvailableDocs` 関数実装
4. `renderShachoshitsu` で動的に書類を描画
5. 書類のホバー・クリック状態のスタイリング
6. 書類はクリックしても何も起こらない（機能はPhase 4で）

**成果物**: 社長室の机に、今週発動可能な書類だけが並ぶ。ボタンとしては反応するがまだ実行されない。

**検証**:
- 信頼が全員60以上だと bonus 書類が出ない
- スランプ中の選手がいなければ encourage, refresh_leave が出ない
- morale 60 なら party が出ない
- 団体人気20未満なら media が出ない

**実装メモ**:
- `src/data.js` に `DECISION_DOC_ORDER` (机の並び順) と `DECISION_DOCS` (8種類) を追加。`effect` フィールドは §4.2 準拠で定義済みだが、実適用は Phase 4 で実装する。
- `Engine.shachoshitsu` に `getDoc` / `getDocOrder` / `checkActivation` / `getAvailableDocs` を実装。`execute` は Phase 4 で追加予定。
- `renderShachoshitsu` は `_SHACHOSHITSU_PLACEHOLDER_DOCS` (Phase 1 のハードコード) を廃止し、`getAvailableDocs(G)` で動的取得。§7.2 の「穴は空いたまま」を満たすため `grid-column/grid-row` を各書類に明示的に付与(CSSツールチップ補正も `nth-child` → `[data-col]` ベースに切替)。
- 検証結果(ブラウザ実機): 初期状態 → bonus/trainer/camp の3枚。orgPop≥20で +media、slump追加で +encourage +refresh_leave、morale<50で +party の順にフィルタが連動。全員 trust≥60 + スランプなし + orgPop<20 + morale≥50 で trainer/camp のみに絞られる。
- auto-sim 20シーズン ALL CLEAR (Phase 3 は週次処理に干渉しないため回帰なし)。

**保留事項(Phase 4 実装時に再考)**:
- **慰労会(party)の発動条件**: 現状 `morale < 50` 限定だが、予防的に雰囲気が良い時にも使いたいニーズあり。効果量(trust+1.84全員/morale+5)と頻度から見て「常時使用可」にすべきか、閾値を緩めるか、cooldown を伸ばすかを Phase 4 実装後の実機プレイで再検討する。

### Phase 4: 決裁実行ロジック ✅ 完了 (2026-04-15)

**目的**: 書類をクリックして実際に決裁を実行できるようにする。遅延発現・不確実性はまだ無い。

**タスク**:
1. `Engine.shachoshitsu.execute(docId, fighterId, state)` 関数実装（既存 `careActions.execute` をベースに改修）
2. 効果適用（§4.2の値、即時発現のみ）
3. 決裁枠消費
4. 対象選手選択モーダル（個人書類）
5. 団体確認モーダル（team書類）
6. 朱印エフェクトのアニメーション
7. 印鑑が倒れるアニメーション
8. 決裁済み書類の表示（`document-stamped.webp` に差し替え）
9. 結果トースト

**成果物**: 社長室から実際に決裁を実行できる。効果は即時に反映される。

**承認ポイント2**: ここでKeisukeさんに動作確認依頼。

**検証**:
- 各書類が正常に実行される
- 決裁枠が消費される
- 印鑑の倒れるアニメーションが不自然でないか確認
- 決裁済み書類が正しく表示される
- 週が変わると決裁済みがリセットされる

**実装メモ**:
- `Engine.shachoshitsu` に `calcCost` / `execute` / `getReactionText` を追加。既存 `Engine.careActions.execute` から 7 書類分(bonus/encourage/refresh_leave/party/trainer/camp/media)のロジックを移植し、costume・special_treatment 分岐は実装せず(Phase 5 で怪我モーダル統合)。hireCoach もここでは実装せず(Phase 5 でコーチ画面から呼び出し)。
- `App.executeDecision(docId, fighterId)` エントリポイントと `App.onShachoshitsuDocClick(docId)` クリックハンドラを追加。事前チェック(決裁枠・資金・is-approved 判定)はクリック時にトーストではじき、engine 側にも安全弁を入れた(`decision_points_insufficient` / `funds_insufficient` / `orgpop_locked` / `condition_not_met` 等)。
- 対象選手選択モーダル `showDecisionTargetModal` は書類別に候補を絞り込む(bonus: trust<60、encourage/refresh_leave: slump or motivationLoss、trainer/media: 全員、個別 cooldown 除外)。団体確認モーダル `showDecisionConfirmModal` は対象人数・コスト内訳・残金・効果サマリを表示してから実行確認。
- 朱印演出: 書類クリック → `.is-approving` クラス付与 → `stamp-slam` アニメ 0.6s → `renderShachoshitsu` 再レンダで `is-approved` に切替。HUD 側は `.hanko.available:not(.falling)` の先頭に `.falling` を付与して `hanko-fall` アニメ 0.5s。決裁済み書類は `document-stamped.webp` 背景に差し替え + onclick 除去でクリック不可。
- 週進行リセット: `tickWeek` で `s._decisionDoneThisWeek` を空配列にクリア(`_decisionWeekUsed` は cooldown 管理のため維持)。validateGameState に `_decisionDoneThisWeek`(配列型) / `_decisionWeekUsed`(オブジェクト型) の不変条件チェックを追加。
- マイグレーション: Phase 3 時点のセーブ読み込み時に `_decisionWeekUsed: {}` / `_decisionDoneThisWeek: []` を空で初期化。選手オブジェクトにも `_decisionWeekUsed` を付与。
- 既存のケアモーダル(💝 ケアボタン / `showCareActionModal` / `App.openCareModal` / `Engine.careActions` / `G.careStock`)は一切触らず、Phase 5 まで並行稼働。
- auto-sim 100 シーズン ALL CLEAR(Engine.shachoshitsu.execute は UI ボタン経由なので週次ループから呼ばれず、回帰は発生しない — 不変条件の型チェックだけが発火)。
- ブラウザ実機(localhost:3000)で verify: bonus 実行で trust 50→56.4 / DP 6→5 / funds 5000→4950、camp 実行で全員 trust 上昇 + `_trainerBuff: {weeksLeft:2, mult:1.5}` 付与 / DP 5→2 / funds 4950→4790(40万×4人=160万) / `_decisionWeekUsed[camp]=1`。決裁済み書類は onclick 除去 + `is-approved` 表示。`App.processWeek()`→`advanceFromWeekSummary()` で週 2→3 に進めると `_decisionDoneThisWeek` が `[]` にリセットされ、全書類が再度クリック可能になることを確認。決裁枠不足時は「決裁枠が不足しています(必要: ⚡3)」トーストでモーダル開かず。

**Phase 4 レビュー反映(2026-04-15)**:
- **慰労会(party)の発動条件を緩和**: `morale < 50` → `morale < 60`(選択肢②)。理由: auto-sim プローブ(5シード×4シーズン=960週サンプル)で lockerRoomMorale が 100% 60-69 帯に滞留し、旧 50 閾値では通常運営で机に出ないことが判明。60 に緩和することで「少し陰ってきた」段階から予防的に使用可能に。好調帯(60+)では依然として出ないので、数値ハメルーチン化は防げる。cooldown は 1 週のまま維持。
- **プレイヤー向け表記ルール**: detailText / effectSummary / recommendation などプレイヤーに見せる文言からは、内部変数名(`morale`/`orgPop`/`MQ`/`condition` 等の英字トークン)を排除し、日本語の自然な言い回し(「ロッカールームの雰囲気」「団体人気」「体調」「試合の評価」等)に統一。全7書類の文言を書き換え。

### Phase 5: 既存ケアシステム廃止

**目的**: 旧ケアモーダルを完全に廃止し、社長室を唯一の入口にする。

**タスク**:
1. 今週画面の「💝 ケア」ボタン削除
2. `showCareActionModal` 関数の削除
3. `App.openCareModal` の削除
4. `CARE_ACTIONS.costume` と関連コードの削除
5. `CARE_REACTION_DIALOGUES.costume` 削除
6. `special_treatment` を怪我発生モーダルに統合、決裁枠コスト削除
7. `trainer`, `camp`, `media` のコスト再定義（決裁枠2, 3, 2）
8. `hireCoach` のコーチ画面での決裁枠チェック追加
9. ケア関連CSSの削除
10. 旧命名のリファクタリング（`CARE_ACTIONS` → `DECISION_DOCS`, `careActions` → `shachoshitsu` 等）

**成果物**: 「ケア」という言葉がゲームから消える。社長室が唯一の決裁入口。

**承認ポイント3**: ここでKeisukeさんに動作確認依頼。

**検証**:
- 今週画面からケアボタンが消えている
- 怪我選手に「特別治療」オプションが怪我モーダルで選べる
- コーチ画面で雇用時に決裁枠が消費される
- 既存セーブの読み込みが問題なく動作する

### Phase 6: ケア4項目の発動条件強化

**目的**: 予防的ドーピングを防ぐため、発動条件を既にPhase 3で実装済み。ここでは確認と微調整のみ。

**タスク**:
1. Phase 3で実装した発動条件が正しく動作しているか確認
2. 閾値の調整（trust < 60, morale < 50 等）
3. エッジケース対応（全員trust 100 の時の挙動、など）

**成果物**: ケア書類が「危機的な時にしか使えない」状態になっている。

### Phase 7: 遅延発現メカニズム

**目的**: trust上昇を3週間に分割発現させる。

**タスク**:
1. `fighter.pendingTrustDeltas` フィールドの定義
2. `Engine.shachoshitsu.execute` で trust効果を pending に登録するよう変更
3. `Engine.shachoshitsu.applyPendingTrustDeltas` 関数実装
4. 週進行処理で毎週呼び出し
5. 書類説明文に「3週かけて効いていく」を追加
6. マイグレーション（既存セーブに pendingTrustDeltas が無い場合は空配列で初期化）

**成果物**: 決裁効果の trust が即時ではなく3週かけて反映される。

### Phase 8: 不確実性メカニズム

**目的**: 性格×アーキタイプで trust効果が±50%変動する。

**タスク**:
1. §6.3の性格マトリクス定義（`src/data.js` に `DECISION_PERSONALITY_MULT`）
2. §6.4のアーキタイプマトリクス定義（`DECISION_ARCHETYPE_MULT`）
3. `Engine.shachoshitsu.calcUncertainty(docId, fighter)` 関数実装
4. `execute` で `finalDelta = baseDelta × uncertaintyMult` を適用
5. 結果トーストに効果度合いを表示（「予想以上」「普通」「響かなかった」）
6. 書類説明文の効果表記を期待値表示に変更

**成果物**: 決裁結果が選手によって効き具合が変わる。

### Phase 9: 磨き込み

**目的**: 演出と細部の完成度を上げる。

**タスク**:
1. 印鑑のアニメーション調整（実機テスト結果を反映）
2. 書類の微回転（`transform: rotate(random -3deg to 3deg)`）
3. 朱印エフェクトのサウンド追加
4. 季節切り替えのフェードアニメーション
5. 決裁済み書類の翌週リセット演出
6. 選手詳細画面での `pendingTrustDeltas` 可視化
7. チュートリアル・ヘルプテキストの追加（社長室の使い方）

**成果物**: 完成度の高いUX。

---

## §12 既知のリスクと懸念

1. **hireCoach の扱いが複雑**: コーチ画面から実行するが決裁枠をチェックする、という変則的な仕組み。実装時に混乱しやすい。
2. **マイグレーションの影響範囲**: 旧ケア関連のフィールドが散在しているので、見落としが出やすい。テスト必須。
3. **画像の読み込み遅延**: 初回アクセス時に壁+机+書類の画像がロードされるまで白い画面が出る可能性。プリロードを検討。
4. **不確実性の数値チューニング**: §6のマトリクスは仮の値。実プレイでバランスが崩れる可能性があるので、Phase 9以降も調整余地あり。
5. **遅延発現で「効果を感じられない」リスク**: 3週かけて少しずつ上がるので、プレイヤーが気づかない可能性。UIで可視化が必要。

---

## §13 将来の拡張候補

1. **選手同士の対立仲裁**: Keisukeさんが予告した将来拡張。対立発生時に「仲裁」書類が机に追加される。
2. **月次の社長ナレーション**: 月初に「今月はこの書類を決裁した」という振り返りテキスト。
3. **書類の履歴**: 過去シーズンの決裁履歴をアーカイブとして見られる。
4. **社長室の小物カスタマイズ**: 実績を解放すると机の小物が追加される（万年筆、灰皿、電話機）。
5. **秘書キャラクター**: 社長室に秘書のアバターを常駐させ、書類の説明や提案を喋らせる。
6. **緊急決裁**: 選手からの直訴イベントで強制的に社長室に飛ばされる。

---

## §14 未決事項・TODO

- [ ] 朱印エフェクトのサウンドファイルを選定
- [ ] 書類の配置順序の最終決定（bonus → encourage → ... の並び）
- [ ] アイコン絵文字の確定（🏛️ で進めるが、Keisukeさんが別を選ぶ可能性あり）
- [ ] 季節切り替えのタイミングの正確な計算（第1-12週=春、第13-24週=夏、第25-36週=秋、第37-48週=冬 で確定か）
- [ ] 対象選手選択モーダルのUI詳細（書類から直接選手を選ぶか、別モーダルを開くか）

---

## 変更履歴

### v1.0 (2026-04-14) 初版リリース
- 初版作成

### v1.0 レビュー注記 (2026-04-14)
Keisukeさんのレビュー結果を反映した注記:

- **§3.2 各書類の金額**: 現状の値（既存の `CARE_ACTIONS` から踏襲）は**仮の値**であり、
  後日「金額設計セッション」で全書類の金額を経済システム全体の文脈で再検討する予定。
  実装は現状値のまま進める。

- **§5.5 遅延発現の可視化（追加要件）**: プレイヤーが「効いている感」を感じられる演出が必要。
  Phase 9 の磨き込みで以下を実装予定:
  - **週進行時のミニ通知**: 毎週、発現した効果を1-2行で表示（例: 「○○選手、ボーナス効果でモチベーション上昇」）
  - **選手詳細画面の「継続中の効果」バッジ**: `pendingTrustDeltas` を視覚化（例: 「ボーナス効果 あと2週」）
  - これらによって「刺した決裁が後から効いている」が明示的に伝わる

---

以上、v1.0 仕様書終わり。
