# S級エース強化 & NPC団体チャンピオン — 設計書 v1.0

## 1. 背景と目標

### 1.1 現状の問題

1. **S級エースのOVRが低すぎる**: プレイ10年目でプレイヤー主力が95前後に対し、S級トップが80半ば。「業界の頂点に君臨する絶対王者」としてのボスキャラ感がない。
2. **NPC団体にチャンピオンがいない**: AI団体の `titles` が空オブジェクトで初期化され、チャンピオンの決定・管理ロジックが存在しない。
3. **trainCap の下振れが致命的**: factor=0.50 でtrainCapがnotion値を下回るケースが発生し、成長が構造的に不可能になる。

### 1.2 目標OVR水準（Monte Carlo N=5000 で検証済み）

| 対象 | S5 | S7 | S10 | S15 |
|---|---|---|---|---|
| S級エーストップ3 | avg 99 | avg 100 | avg 101 | avg 102 |
| S級一般 | avg 84 | avg 85 | avg 85 | avg 86 |
| プレイヤー現実的 | avg 85 | avg 92 | avg 94 | avg 95 |
| プレイヤー最適 | avg 92 | avg 98 | avg 100 | avg 100 |

→ S級1位はゲームを通じて個人OVRでトップクラスを維持。プレイヤーはチーム総力で対抗する構図。

---

## 2. 変更内容

### 2.1 trainCap factor 範囲の変更

**対象ファイル**: `src/engine.js` — `Engine.rival.generateTrainCap()`

**現行**:
```js
generateTrainCap(rng, _notionValue, potential) {
  const caps = {};
  ['pw','sp','te','st','mn'].forEach(s => {
    const factor = 0.50 + Engine.rng.float(rng) * 0.30; // 0.50〜0.80
    caps[s] = Math.round(factor * (potential[s] || 0));
  });
  return caps;
},
```

**変更後**:
```js
generateTrainCap(rng, _notionValue, potential, factorOverride) {
  const fMin = factorOverride ? factorOverride[0] : 0.55;
  const fMax = factorOverride ? factorOverride[1] : 0.80;
  const caps = {};
  ['pw','sp','te','st','mn'].forEach(s => {
    const factor = fMin + Engine.rng.float(rng) * (fMax - fMin);
    caps[s] = Math.round(factor * (potential[s] || 0));
  });
  return caps;
},
```

| 条件 | 旧 factor | 新 factor | 根拠 |
|---|---|---|---|
| 通常（全員） | 0.50〜0.80 | **0.55〜0.80** | ①下限0.50でcap<notionが発生するバグ修正 ②母体pot=164で最低cap=90→ notion(80)を確実に上回る |
| potTop3 → S級所属時 | 0.50〜0.80 | **0.75〜0.80** | ①cap avg=126 ②OVR100+到達が安定 ③プレイヤーのmax cap(=128)と重なるため超える余地あり |

### 2.2 potTop3 の判定とtrainCap特別設定

**対象ファイル**: `src/engine.js` — `Engine.rival.makeAIFighter()` + `Engine.rival.initAIOrgs()` / `initRandomRoster()`

potTop3はゲーム開始時にALL_CHARSから静的に決定できる（potTotal上位3名）。

**判定方法**:
```js
// initAIOrgs() or initRandomRoster() の冒頭で1回計算
const potTop3Ids = new Set(
  ALL_CHARS.map(c => ({
    id: c.id,
    potTotal: (c.pot.pw||0)+(c.pot.sp||0)+(c.pot.te||0)+(c.pot.st||0)+(c.pot.mn||0)
  }))
  .sort((a,b) => b.potTotal - a.potTotal)
  .slice(0, 3)
  .map(c => c.id)
);
```

**makeAIFighter への適用**（initAIOrgs内のみ）:
```js
roster.forEach(...) {
  const isPotTop3 = potTop3Ids.has(id) && org.tier === 'S';
  const factorOverride = isPotTop3 ? [0.75, 0.80] : null;
  return Engine.rival.makeAIFighter(t, rng, org.id, age, factorOverride);
}
```

`makeAIFighter` のシグネチャに `factorOverride` を追加:
```js
makeAIFighter(template, rng, orgId, age, factorOverride) {
  ...
  const trainCap = Engine.rival.generateTrainCap(rng, notion, template.pot, factorOverride);
  ...
}
```

**重要**: `makeChar()`（プレイヤーキャラ生成）は変更なし。プレイヤーは常に 0.55〜0.80。

### 2.3 S級 trainCapトップ3 の練習重視スケジュール

**対象ファイル**: `src/engine.js` — `Engine.rival.getAceConfig()`

現行の `getAceConfig` はOVR順でエースを判定しているが、S級のtrainCapトップ3に対して「練習重視」設定を適用する。

**変更概要**:
- S級団体内で、trainCap OVRの上位3名を判定
- 該当選手の `practiceRate` を 0.95 に設定（休養はほぼなし = 練習重視スケジュール相当）

```js
getAceConfig(org, fighter) {
  const config = AI_COACH_CONFIG[org.tier] || AI_COACH_CONFIG.B;
  const roster = (org.roster || [])
    .filter(f => !f.injury)
    .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const rank = roster.findIndex(f => f.id === fighter.id);
  if (rank < 0) return config.general;

  // S級: trainCapトップ3判定
  if (org.tier === 'S') {
    const byTrainCap = [...(org.roster || [])]
      .map(f => ({
        id: f.id,
        capOvr: f.trainCap
          ? Math.round((f.trainCap.pw + f.trainCap.sp + f.trainCap.te + f.trainCap.st + f.trainCap.mn) / 5)
          : 0
      }))
      .sort((a, b) => b.capOvr - a.capOvr);
    const trainCapTop3Ids = new Set(byTrainCap.slice(0, 3).map(f => f.id));

    if (trainCapTop3Ids.has(fighter.id)) {
      // 練習重視: practiceRate を 0.95 にオーバーライド
      const baseConfig = rank === 0 ? config.ace.top1
        : rank < config.ace.count && config.ace.top2_3 ? config.ace.top2_3
        : config.general;
      return { ...baseConfig, practiceRate: 0.95 };
    }
  }

  // 既存ロジック（変更なし）
  if (rank === 0 && config.ace.top1) return config.ace.top1;
  if (rank < config.ace.count && config.ace.top2_3) return config.ace.top2_3;
  if (rank < config.ace.count) return config.ace.top1;
  return config.general;
},
```

### 2.4 NPC団体チャンピオンシステム

**対象ファイル**: `src/engine.js` — `Engine.rival.processAIWeek()` + `Engine.rival.initAIOrgs()`

#### 2.4.1 データ構造

AI団体のorgDataに `titles` フィールドを追加:
```js
// initAIOrgs() の orgs[org.id] に追加
titles: { world: { championId: null, defenses: 0, wonSeason: 0, wonWeek: 0 } }
```

#### 2.4.2 チャンピオン決定ロジック

`processAIWeek()` の興行処理後に追加:

```js
// AI団体チャンピオン管理
if (isShow) {
  const aiTitles = nextOrgData.titles || { world: { championId: null, defenses: 0 } };
  const champId = aiTitles.world?.championId;
  const champAlive = champId && roster.find(f => f.id === champId && !f.injury);

  if (!champAlive) {
    // 空位 → OVRトップが自動戴冠
    const top = roster
      .filter(f => !f.injury)
      .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
    if (top) {
      nextOrgData.titles = {
        world: { championId: top.id, defenses: 0, wonSeason: state.season, wonWeek: state.week }
      };
    }
  } else {
    // チャンピオンが興行に出場 → 防衛カウント
    const champInMatch = matchResults.some(r =>
      r.leftId === champId || r.rightId === champId
    );
    if (champInMatch) {
      const champResult = matchResults.find(r =>
        r.leftId === champId || r.rightId === champId
      );
      const champWon = champResult &&
        ((champResult.winner === 'left' && champResult.leftId === champId) ||
         (champResult.winner === 'right' && champResult.rightId === champId));
      if (champWon) {
        nextOrgData.titles = {
          ...nextOrgData.titles,
          world: { ...aiTitles.world, defenses: (aiTitles.world.defenses || 0) + 1 }
        };
      } else if (!champWon && champResult.winner !== 'draw') {
        // 敗北 → 王座陥落、勝者が新王者
        const winnerId = champResult.winner === 'left' ? champResult.leftId : champResult.rightId;
        nextOrgData.titles = {
          world: { championId: winnerId, defenses: 0, wonSeason: state.season, wonWeek: state.week }
        };
      }
      // 引き分けは防衛成功として扱う
    }
  }
}
```

#### 2.4.3 退団・引退時の王座処理

既存の退団/引退処理（processSeasonEnd, poach等）でチャンピオンがいなくなった場合、次の興行で自動的にOVRトップが戴冠する（§2.4.2のchampAlive判定で処理される）。

#### 2.4.4 表示

ランキング画面・団体情報画面でNPC団体チャンピオン名を表示する（UI側の変更はClaude Code実装時に対応）。

---

## 3. 変更対象まとめ

| ファイル | 関数 | 変更内容 |
|---|---|---|
| `src/engine.js` | `generateTrainCap()` | factor引数追加、デフォルト0.55-0.80 |
| `src/engine.js` | `makeAIFighter()` | factorOverride引数追加、trainCap生成に転送 |
| `src/engine.js` | `initAIOrgs()` / `initRandomRoster()` | potTop3判定、S級所属時にfactor[0.75,0.80]を渡す |
| `src/engine.js` | `getAceConfig()` | S級trainCapトップ3にpracticeRate=0.95 |
| `src/engine.js` | `processAIWeek()` | AI団体チャンピオン管理ロジック追加 |
| `src/engine.js` | `initAIOrgs()` | titles初期データ追加 |

## 4. 数値根拠（3点ルール）

### trainCap factor 0.55〜0.80（通常）
1. **母体スケール**: pot=164（トップ）× 0.55 = 90。notion=80を確実に上回る
2. **相対比較**: 旧下限0.50ではcap=82となりnotion=80からの成長が+2しかないバグ状態だった
3. **プレイ体験**: trainCap avg=108、プレイヤーは10年で95前後に到達。適切な追い上げ感

### potTop3 factor 0.75〜0.80
1. **母体スケール**: pot=164 × 0.75〜0.80 = 123〜131。OVR100+到達に十分な天井
2. **相対比較**: プレイヤーfactor上限0.80、potAvg=160 → max cap=128。S級min cap=123と重なり、超える希望あり
3. **プレイ体験**: S級エースがS5で99、S10で101。「絶対王者」の存在感が10年以上持続

### practiceRate 0.95（S級trainCapトップ3）
1. **母体スケール**: 非興行24週中22.8週が練習（通常: 20.4週）。年間追加2.4回の練習機会
2. **相対比較**: プレイヤー「練習重視」=全非興行週が練習相当。S級エースも同等の練習量
3. **プレイ体験**: trainCap到達率81%→推定90%+。OVR100+の安定度が大幅向上

## 5. 検証方法

auto-sim 500シーズン × 2回で以下を確認:
- violations = 0, errors = 0
- S級1位のOVRが S5 時点で avg 95+ 
- S級1位のOVRが S10 時点で avg 100+
- プレイヤー（現実的条件）のS10 OVR avg が 90-96 の範囲
- NPC団体チャンピオンが常時存在（空位期間が1週以内）
