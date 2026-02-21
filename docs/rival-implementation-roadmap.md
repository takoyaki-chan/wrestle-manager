# 🗺️ ライバル団体実装ロードマップ v0.9

> **ベース仕様**: rival-org-spec-v1.0.md
> **変更点**: 移籍タイミングを四半期ウィンドウ（低確率）に変更
> **現在コード**: wrestle-manager.html v0.85b (3,094行)
> **作成日**: 2026-02-20

---

## 現状コードとv1.0仕様のギャップ分析

### ✅ 既に一致している部分

| 項目 | 現コード | v1.0仕様 | 状態 |
|------|---------|---------|:----:|
| 初期資金 | 5,000万 | 5,000万 | ✅ |
| バトルエンジン | v4.1b | v4.0+ | ✅ |
| 給与テーブル | SALARY_TABLE | economy §1 | ✅ |
| 会場テーブル | VENUES | economy §3.1 | ✅ |
| Heatシステム | HEAT_LEVELS | mq-pop §4 | ✅ |
| コーチシステム | ALL_COACHES | character-data連携 | ✅ |
| 施設システム | FACILITIES | training §6 | ✅ |
| タイトルシステム | 基本実装済 | title-spec基本 | ✅ |
| ライバル度 | RIVALRY_THRESHOLDS | mq-pop §9 | ✅ |
| キャラデータ80名 | ALL_CHARS (Notion値+潜在値) | character-data | ✅ |

### 🔧 修正が必要な部分

| 項目 | 現コード | v1.0仕様 | 差分 |
|------|---------|---------|------|
| 初期ロスター | 8名 (DEFAULT_ROSTER_IDS) | 5〜6名 | 人数削減＋団体配分 |
| キャラデータ構造 | Notion値=直接stat値 | notionValue/current/trainCap分離 | **構造変更** |
| 成長システム | gap比例式(growth.calcGrowth) | style配分+convergence式(training §2-3) | **ロジック変更** |
| シーズン末処理 | decline判定のみ | 8ステップパイプライン | **大幅拡張** |
| freeAgents | 72名フラットプール | FA+未登場プール分離 | 構造変更 |
| advanceWeek | week>48で即シーズン進行 | オフシーズン4週間挟む | フロー変更 |

### 🆕 新規追加が必要な部分

| 機能 | 仕様参照 | 推定行数 | 優先度 |
|------|---------|:-------:|:-----:|
| AI団体定数・初期データ | rival §1-3 | ~80 | P0 |
| AI団体state構造 | rival §3 | ~30 | P0 |
| org-rating計算エンジン | org-ranking §1 | ~40 | P0 |
| ランキング表示UI | org-ranking §2 | ~80 | P0 |
| AIシーズン末一括処理 | rival §4 | ~120 | P0 |
| エース認定システム | rival §6 | ~60 | P1 |
| 四半期移籍ウィンドウ（変更版） | rival §7 改変 | ~150 | P1 |
| 引き抜き防衛UI | rival §7.2 | ~100 | P1 |
| AI間移籍 | rival §7.3 | ~30 | P1 |
| レンタルシステム | rival §8 | ~120 | P2 |
| 対抗戦イベント | rival §9.2 | ~100 | P2 |
| 挑戦状イベント | rival §9.3 | ~60 | P2 |
| 頂上決戦イベント | rival §9.4 | ~80 | P2 |
| AIスカウト行動 | rival §5 | ~60 | P1 |

---

## 実装フェーズ

### フェーズ A: 基盤構築（P0 — これがないと始まらない）

**目標**: AI団体が存在し、ランキングが計算・表示される状態

#### A-1: キャラデータ構造の拡張

```javascript
// 現在の ALL_CHARS に追加が必要なフィールド
{
  id: 1,
  name: '阿武隈塔子',
  // Notion値 = 現在のstat値そのまま（変更不要）
  // pw/sp/te/st/mn = Notion値として維持
  org: 'player',        // 🆕 所属先: 'player'|'empress'|'nova'|'crescent'|'free'|'pool'
  entryAge: 16,         // 🆕 入団年齢（登場年齢）
  age: 16,              // 🆕 現在年齢
  // pot: {} は既存のまま
}
```

**makeChar拡張**: trainCap生成、現在値(current)をNotionから算出

```javascript
// makeCharで生成されるランタイムデータ
{
  // ...既存フィールド
  notionValue: { pw:95, sp:73, te:71, st:81, mn:80 }, // 🆕 元のstat値を保存
  trainCap: { pw:?, sp:?, te:?, st:?, mn:? },          // 🆕 入団時ランダム生成
  // pw/sp/te/st/mn = 現在値（入団時はNotionより低い）
}
```

#### A-2: 80名の団体配分定義

```javascript
const ORG_ASSIGNMENTS = {
  player:   [4, 3, 5, 19, 20, 10],              // 6名: 高津,澤出,深町,四条,岸,ヨーコ
  empress:  [1, 2, 37, 33, 65, 66, 16, 38, ...], // 15-18名: 上位能力キャラ中心
  nova:     [11, 12, 13, 17, 29, ...],           // 12-14名: 中堅キャラ中心
  crescent: [8, 9, 27, 28, ...],                 // 8-10名: 下位キャラ中心
  free:     [...],                                // 8-10名
  pool:     [...]                                 // 残り（未登場）
};
```

> ⚠️ 具体的な配分はキャラのOVR分布を見て別途決定

#### A-3: AI団体定数 (Section 4E)

```javascript
const RIVAL_ORGS = [
  {
    id: 'empress', name: 'EMPRESS GRAND', tier: 'S',
    championScore: 60,
    coachMul: 1.30, facilityMul: 1.15,
    scoutBudget: 1500, scoutStyle: 'immediate',
    desc: '業界の頂点に君臨する絶対王者'
  },
  {
    id: 'nova', name: 'NOVA IMPACT', tier: 'A',
    championScore: 40,
    coachMul: 1.15, facilityMul: 1.10,
    scoutBudget: 800, scoutStyle: 'youth',
    desc: '若手主体の攻撃的な挑戦者'
  },
  {
    id: 'crescent', name: 'CRESCENT RISE', tier: 'B',
    championScore: 20,
    coachMul: 1.00, facilityMul: 1.05,
    scoutBudget: 400, scoutStyle: 'conservative',
    desc: '堅実経営の小規模団体'
  }
];
```

#### A-4: GameState拡張

```javascript
createInitialState(seed) {
  // ...既存処理
  return {
    // ...既存フィールド
    
    // 🆕 AI団体データ
    aiOrgs: {
      empress: {
        roster: [...],    // AI選手オブジェクト配列
        orgPop: 75,       // 団体人気（AI側）
        orgRating: 0,     // 計算値（シーズン末更新）
      },
      nova: {
        roster: [...],
        orgPop: 55,
        orgRating: 0,
      },
      crescent: {
        roster: [...],
        orgPop: 35,
        orgRating: 0,
      }
    },
    
    // 🆕 プレイヤー団体
    aceDesignation: null,     // エース認定選手ID
    orgRating: 0,             // プレイヤー団体の評価値
    rankings: [],             // [{orgId, name, rating}] 降順
    
    // 🆕 移籍・レンタル
    transferLog: [],          // 移籍履歴
    activeRental: null,       // { fighterId, fromOrg, weeksLeft, originalData }
    
    // 🆕 抗争イベント
    pendingEvents: [],        // 予約済み抗争イベント
    
    // 🆕 未登場プール
    unrevealedPool: [...],    // まだ登場していない選手
  };
}
```

#### A-5: org-rating計算エンジン

```javascript
Engine.ranking = {
  calcStarPower(roster) {
    return roster.reduce((score, f) => {
      if (f.popularity >= 70) return score + 15;
      if (f.popularity >= 50) return score + 8;
      if (f.popularity >= 30) return score + 3;
      return score;
    }, 0);
  },
  
  calcTotalPop(roster) {
    return Math.round(roster.reduce((s, f) => s + f.popularity, 0) * 0.1);
  },
  
  calcOrgRating(championScore, roster) {
    return championScore + this.calcStarPower(roster) + this.calcTotalPop(roster);
  },
  
  updateRankings(state) {
    // プレイヤー + 3AI団体の評価値を計算してソート
    // return { state, rankings }
  }
};
```

#### A-6: ランキングUI

- ヘッダーバーに現在順位表示（例: "4位 / 4団体"）
- ランキング詳細画面（各団体の評価値内訳）
- 自団体の評価値リアルタイム表示

**フェーズA推定追加行数**: ~350行
**依存する既存変更**: createInitialState, makeChar, DEFAULT_ROSTER_IDS

---

### フェーズ B: シーズンサイクル（P0/P1）

**目標**: AI団体が毎シーズン成長・衰退し、ランキングが変動する

#### B-1: AIシーズン末一括処理

```javascript
Engine.rival = {
  processSeasonEnd(rng, state) {
    // 8ステップパイプライン（rival §4）
    // 1. 加齢
    // 2. 衰退判定 (training-spec §5.3-5.4)
    // 3. 成長一括 (aiSeasonGrowth)
    // 4. 人気変動 (aiSeasonPopularity)
    // 5. 引退判定 (scout-spec §7)
    // 6. AIスカウト (§5)
    // 7. AI間移籍 (§7.3)
    // 8. org-rating再計算
    return { state, events }
  }
};
```

#### B-2: advanceWeek改修 — オフシーズン導入

```
現在: week > 48 → 即 season+1, week=1
変更: week > 48 → offSeason週 (1〜4)
  - offWeek 1: 引退処理・シーズンレポート
  - offWeek 2: スカウト（既存拡張）
  - offWeek 3: 移籍ウィンドウ ← ★今回の変更で四半期に分散
  - offWeek 4: 新シーズン準備 → season+1, week=1
```

#### B-3: AIスカウト行動

- 年2回のスカウト時にAI団体も候補者を取得
- ティア別のスカウト方針で自動選択
- プレイヤーとの競合処理

#### B-4: 成長システムのv1.0仕様対応

現在の `growth.calcGrowth` をtraining-spec v1.0の計算式に更新:
- スタイル別成長配分(§3)
- 年齢倍率(§5.2)
- convergenceFactor(§2.4)
- 週次ランダム幅(§2.3)

> ⚠️ これはプレイヤー選手にも影響する大きな変更

**フェーズB推定追加行数**: ~300行
**フェーズB改修行数**: ~100行（既存growth/advanceWeek）

---

### フェーズ C: 移籍・エース（P1）

**目標**: プレイヤーとAI団体間の選手移動が機能する

#### C-1: エース認定システム

```javascript
// state.aceDesignation = fighterId | null
Engine.ace = {
  designate(state, fighterId) { ... },
  revoke(state) { ... },
  isAce(state, fighterId) { return state.aceDesignation === fighterId; }
};
```

UI: ロスター画面に「エース認定」ボタン（1名限定）

#### C-2: 四半期移籍ウィンドウ（仕様変更版）

**v1.0仕様からの変更点**:
- 元: オフシーズン第3週に年1回
- 変更後: **W12, W24, W36, W48の四半期末に移籍ウィンドウが開く**

```javascript
const TRANSFER_CONFIG = {
  windows: [12, 24, 36, 48],  // 四半期末
  
  // AI → プレイヤー引き抜き（四半期ごと）
  poachChancePerFighter: 0.06,  // 1選手あたり6%/四半期（年間約22%）
  poachMinPopularity: 50,        // 人気50以上が対象
  poachRequiresHigherRank: true,  // 引き抜き元がプレイヤーより上位
  
  // プレイヤー → AI引き抜き（年間上限は維持）
  playerPoachLimit: 1,           // 年1名まで
  playerPoachWindows: [12, 24, 36, 48],  // どの四半期でも可能
  
  // エース防衛
  aceRetentionRate: 1.0,         // 100%
  nonAceRetentionRate: 0.80,     // 80%
};
```

**四半期移籍フロー**:
```
四半期末(W12/24/36/48)到達
  │
  ├─ AI→プレイヤー引き抜き判定
  │    各対象選手ごとに6%で発生
  │    → 発生した場合: 引き留めUI表示
  │      - エース+引き留め金 → 100%残留
  │      - 非エース+引き留め金 → 80%残留
  │      - 放出 → 移籍金入手
  │
  └─ プレイヤー→AI引き抜きオファー（年1回制限）
       残り枠があれば「引き抜きリスト」表示
       → 対象選手選択 → 移籍金提示 → 成否判定
```

#### C-3: 移籍金計算

```javascript
Engine.transfer = {
  calcFee(fighter, fromOrg) {
    const overall = Engine.util.ov(fighter);
    const popBonus = fighter.popularity * 10;
    let baseFee;
    if (overall >= 80)      baseFee = 800;
    else if (overall >= 60) baseFee = 400;
    else if (overall >= 45) baseFee = 200;
    else                    baseFee = 100;
    const tierMul = { S: 1.5, A: 1.2, B: 1.0 }[fromOrg.tier];
    return Math.round((baseFee + popBonus) * tierMul);
  },
  
  calcRetentionCost(fighter) {
    return Math.round(this.calcFee(fighter, {tier:'B'}) * 0.5);
  }
};
```

#### C-4: 移籍UI

- 四半期末に「移籍ウィンドウ」通知
- 引き抜き発生時の防衛選択画面
- AI選手引き抜きリスト画面（年1回制限表示付き）

**フェーズC推定追加行数**: ~350行

---

### フェーズ D: レンタル・抗争（P2）

**目標**: ゲームに彩りを加えるイベント系機能

#### D-1: レンタルシステム

- 4週間固定、同時1名まで
- Overall順位3位以下の選手が対象
- レンタル中は成長なし、怪我あり、人気変動あり
- 週次費用: OVR帯×ティア倍率

#### D-2: 対抗戦

- 年1回30%で発生（ランキング隣接団体）
- 3〜5試合のミニマッチ
- バトルエンジンで実シミュレーション
- 勝敗で団体人気・選手人気変動

#### D-3: 挑戦状

- トラブルトリガー（レンタル怪我、引き抜き等）で発生
- 因縁の1戦、MQ+10ボーナス

#### D-4: 頂上決戦

- ランキング2位以上 + PPV週に発生
- プレイヤーエース vs 1位団体エース
- 勝利でorgPop+10、rating+15ボーナス

**フェーズD推定追加行数**: ~400行

---

## 実装順序とtickWeek統合

```
現在のtickWeekパイプライン:
  1. processManage(rng, state)
  2. processSettlement(s)

拡張後:
  1. processManage(rng, state)          ← 既存
  2. processRivalWeek(rng, s)           ← 🆕 四半期判定・レンタル進行等
  3. processSettlement(s)                ← 既存
  4. checkTransferWindow(s)             ← 🆕 四半期末のみ発動

advanceWeek拡張:
  - week > 48 → オフシーズン4週間
  - offWeek末 → AI一括処理 + ランキング更新
```

---

## 推定総追加行数

| フェーズ | 新規行数 | 改修行数 | 合計 |
|---------|:-------:|:-------:|:---:|
| A: 基盤構築 | 350 | 50 | 400 |
| B: シーズンサイクル | 300 | 100 | 400 |
| C: 移籍・エース | 350 | 30 | 380 |
| D: レンタル・抗争 | 400 | 20 | 420 |
| **合計** | **1,400** | **200** | **1,600** |

最終コード規模: 約4,700行（3,094 + 1,600）

---

## 未決定事項（実装前に要確認）

1. **80名の具体的な団体配分** — OVR分布を分析して決定
2. **プレイヤー初期ロスター** — 6名に減らす際の選出（現在8名）
3. **各AI選手の初期年齢** — 未登場プール選手の登場年齢
4. **成長システム移行** — v0.85bの簡易成長式 → v1.0のconvergence式に変更するか、AI団体だけv1.0式にするか
5. **四半期移籍の具体的な確率** — 6%/四半期/選手が適切か（年間22%程度）

---

## 推奨実装順序

```
Phase A-1〜A-4（データ構造）→ A-5〜A-6（ranking表示）
  → B-4（成長システム更新）→ B-1〜B-3（AI処理）
    → C-1（エース）→ C-2〜C-4（移籍）
      → D-1〜D-4（レンタル・抗争）
```

フェーズAが完了すれば「AI団体がいる」状態になり、ゲームとして見え方が変わる。
フェーズB完了でAI団体が動的に変化し、競争感が出る。
フェーズCで選手の流動性が加わり、戦略性が深まる。
フェーズDで物語性が加わり、ドラマが生まれる。
