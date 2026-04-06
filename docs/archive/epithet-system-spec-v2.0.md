# 殿堂異名（エピテット）システム v2.0 最終仕様書

## 1. 概要

引退殿堂入り時に付与される異名を、現行の固定10パターンから
**実績タグ × 重み付きランダム選出** 方式に改修する。

### 設計方針
- 修飾語レイヤー（style/personality/archetype/role/trait合成）は**廃止**
- 実績テンプレート単体のバリエーションで勝負する
- 短く言い切る体言止め・名詞系を重視

---

## 2. 改修箇所

### 2.1 関数シグネチャ変更

```javascript
// Before:
generateEpithet(rec)

// After:
generateEpithet(rec, fighter, rng)
```

### 2.2 _buildHofEntry 変更

```javascript
// epithet生成にrngとfighterを渡す
const epithetRng = Engine.rng.create(Engine.rng.derive(
  state.rngSeed, fighter.id, 0xEF17
));
entry.epithet = Engine.awards.generateEpithet(rec, fighter, epithetRng);

// 追加フィールド（epithet判定用）
entry.careerBestMQ = fighter.careerBestMQ || 0;
entry.trust = fighter.trust ?? 50;
```

---

## 3. 実績タグ定義（全30タグ）

```javascript
const EPITHET_TAGS = [
  // ── 難易度6 (rarity: 100) ──
  { id: 'undefeatedReign', rarity: 100,
    test: (r, h, f, ctx) => ctx.maxSingleReign >= 10 && ctx.retiredAsChamp },
  { id: '20Defense', rarity: 100,
    test: (r) => (r.totalDefenses || 0) >= 20 },

  // ── 難易度5 (rarity: 80) ──
  { id: 'grandSlam', rarity: 80,
    test: (r) => (r.totalTitleWins || 0) >= 1
      && (r.juniorTournamentWins || 0) >= 1
      && (r.ppvMainEventWins || 0) >= 1 },
  { id: 'juniorConsecutive3', rarity: 80,
    test: (r, h, f, ctx) => ctx.maxConsecutiveJT >= 3 },
  { id: 'ppvConsecutive2', rarity: 80,
    test: (r, h, f, ctx) => ctx.maxConsecutivePPV >= 2 },
  { id: 'mvp3plus', rarity: 80,
    test: (r, h, f, ctx) => ctx.mvpCount >= 3 },
  { id: '15Defense', rarity: 80,
    test: (r, h, f, ctx) => ctx.maxSingleReign >= 15 },
  { id: 'tripleChamp', rarity: 80,
    test: (r) => (r.totalTitleWins || 0) >= 3 },

  // ── 難易度4 (rarity: 60) ──
  { id: 'juniorConsecutive2', rarity: 60,
    test: (r, h, f, ctx) => ctx.maxConsecutiveJT >= 2 },
  { id: 'ppvDouble', rarity: 60,
    test: (r) => (r.ppvMainEventWins || 0) >= 2 },
  { id: '10Defense', rarity: 60,
    test: (r) => (r.totalDefenses || 0) >= 10 },
  { id: 'mvp2', rarity: 60,
    test: (r, h, f, ctx) => ctx.mvpCount >= 2 },
  { id: 'bestMatch3plus', rarity: 60,
    test: (r, h, f, ctx) => ctx.bestMatchCount >= 3 },
  { id: 'warAce', rarity: 60,
    test: (r, h, f, ctx) => ctx.warWins >= 5 },

  // ── 難易度3 (rarity: 40) ──
  { id: 'titleDefender', rarity: 40,
    test: (r) => (r.totalTitleWins || 0) >= 1 && (r.totalDefenses || 0) >= 5 },
  { id: 'juniorChamp', rarity: 40,
    test: (r) => (r.juniorTournamentWins || 0) >= 1 },
  { id: 'ppvChamp', rarity: 40,
    test: (r) => (r.ppvMainEventWins || 0) >= 1 },
  { id: 'mvp1', rarity: 40,
    test: (r, h, f, ctx) => ctx.mvpCount >= 1 },
  { id: 'doubleChamp', rarity: 40,
    test: (r) => (r.totalTitleWins || 0) >= 2 },
  { id: 'bestMatch1', rarity: 40,
    test: (r, h, f, ctx) => ctx.bestMatchCount >= 1 },

  // ── 難易度2 (rarity: 20) ──
  { id: 'titleHolder', rarity: 20,
    test: (r) => (r.totalTitleWins || 0) >= 1 && (r.totalDefenses || 0) < 5 },
  { id: 'rookieOfYear', rarity: 20,
    test: (r, h, f, ctx) => ctx.hasRookie },
  { id: 'peakOvr90', rarity: 20,
    test: (r) => (r.peakOVR || 0) >= 90 },
  { id: 'warHero', rarity: 20,
    test: (r, h, f, ctx) => ctx.warWins >= 3 },
  { id: 'mediaAward', rarity: 20,
    test: (r, h, f, ctx) => ctx.mediaCount >= 1 },
  { id: 'ironwoman', rarity: 20,
    test: (r, h, f, ctx) => ctx.careerSeasons >= 10 },

  // ── 難易度1 (rarity: 10) ──
  { id: 'peakOvr80', rarity: 10,
    test: (r) => (r.peakOVR || 0) >= 80 },
  { id: 'bestMQ70', rarity: 10,
    test: (r, h, f) => (f.careerBestMQ || 0) >= 70 },
  { id: 'highTrust', rarity: 10,
    test: (r, h, f) => (f.trust ?? 50) >= 80 },
  { id: 'solidCareer', rarity: 10,
    test: () => true },
];
```

---

## 4. コンテキスト算出関数

```javascript
function buildEpithetContext(rec, history, fighter) {
  // 連覇判定
  function maxConsecutive(type, resultField) {
    const seasons = history
      .filter(e => e.type === type && e.result === resultField)
      .map(e => e.season).sort((a, b) => a - b);
    let max = seasons.length > 0 ? 1 : 0, cur = 1;
    for (let i = 1; i < seasons.length; i++) {
      if (seasons[i] === seasons[i - 1] + 1) { cur++; max = Math.max(max, cur); }
      else cur = 1;
    }
    return max;
  }

  // maxSingleReign
  let maxSingleReign = 0, currentDefenses = 0;
  history.forEach(ev => {
    if (ev.type === 'titleWin') currentDefenses = 0;
    else if (ev.type === 'titleDefense') currentDefenses = ev.count || 0;
    else if (ev.type === 'titleLoss') {
      maxSingleReign = Math.max(maxSingleReign, ev.defenses || currentDefenses);
      currentDefenses = 0;
    }
  });
  if (currentDefenses > 0) maxSingleReign = Math.max(maxSingleReign, currentDefenses);

  // 王座保持引退判定
  const lastTitleEvent = [...history].reverse().find(e =>
    e.type === 'titleWin' || e.type === 'titleDefense' || e.type === 'titleLoss');
  const retiredAsChamp = lastTitleEvent && lastTitleEvent.type !== 'titleLoss';

  // アワード集計
  const mvpCount = history.filter(e => e.type === 'awardMVP').length;
  const bestMatchCount = history.filter(e => e.type === 'awardBestMatch').length;
  const hasRookie = history.some(e => e.type === 'awardRookie');
  const mediaCount = history.filter(e => e.type === 'awardMedia').length;
  const warWins = history.filter(e => e.type === 'war' && e.won).length;

  // キャリア年数
  const debut = history.find(e => e.type === 'debut');
  const retire = history.find(e => e.type === 'retire');
  const careerSeasons = debut && retire ? (retire.season - debut.season + 1) : 1;

  return {
    maxConsecutiveJT: maxConsecutive('juniorTournament', 'champion'),
    maxConsecutivePPV: maxConsecutive('ppvMainEvent', 'champion'),
    maxSingleReign, retiredAsChamp,
    mvpCount, bestMatchCount, hasRookie, mediaCount, warWins,
    careerSeasons,
  };
}
```

---

## 5. テンプレート辞書（全104テンプレート）

```javascript
const EPITHET_TEMPLATES = {
  // ── 難易度6 (rarity: 100) ──
  undefeatedReign: [
    '無敗の女王', '不敗伝説', '無傷の戴冠者', '負け知らずの王者'
  ],
  '20Defense': [
    '絶対王者', '防衛ロードの怪物', '{n}人切り', '生ける要塞', '不落の王座'
  ],

  // ── 難易度5 (rarity: 80) ──
  grandSlam: [
    '完全制覇の女帝', '全冠の覇者', 'グランドスラム・クイーン', '歴史を塗り替えた女'
  ],
  juniorConsecutive3: [
    '世代の悪夢', '三年王朝', 'ジュニアの独裁者', '三連覇の怪物'
  ],
  ppvConsecutive2: [
    '大舞台の女王', '連覇の記憶', 'グランドファイナルの支配者', 'ファイナルの主役'
  ],
  mvp3plus: [
    '殿堂級MVP', '三度の栄冠', '時代の主人公', '永遠のMVP', '栄光の常連'
  ],
  '15Defense': [
    '無敵の長期政権', '鉄壁の女王', '終わらない治世', '防衛街道の果てに'
  ],
  tripleChamp: [
    '不死鳥', '返り咲きの女王', '三度の頂', '不滅の王者'
  ],

  // ── 難易度4 (rarity: 60) ──
  juniorConsecutive2: [
    'ジュニアの覇者', '二連覇の衝撃', '連覇を刻んだ新星', '世代を二度制した女'
  ],
  ppvDouble: [
    '大舞台の主', 'PPVの申し子', '決戦のスペシャリスト'
  ],
  '10Defense': [
    '堅牢なる王者', '王座の番人', '鉄の防衛線'
  ],
  mvp2: [
    '団体の顔', '二度の最優秀', 'MVP二冠', '時代のエース'
  ],
  bestMatch3plus: [
    '試合の天才', '名勝負の女神', '黄金のカード', '好勝負請負人'
  ],
  warAce: [
    '対抗戦の英雄', '団体の切り札', '対抗戦の鬼', 'エースキラー'
  ],

  // ── 難易度3 (rarity: 40) ──
  titleDefender: [
    '名王者', '堅実なる戴冠者', '守りの女王', '実力派チャンピオン'
  ],
  juniorChamp: [
    'ジュニアの星', '登竜門の覇者', 'トーナメント・ウィナー'
  ],
  ppvChamp: [
    '大舞台の勝者', '年末の主人公', 'PPVの記憶', 'グランドファイナリスト'
  ],
  mvp1: [
    'MVP', '年間最優秀選手', 'その年の顔', '一年の主役'
  ],
  doubleChamp: [
    '二度の戴冠', '復活王者', 'リターン・クイーン', '捲土重来'
  ],
  bestMatch1: [
    'ベストバウトの主役', '一戦の輝き', 'ベストバウト・アーティスト'
  ],

  // ── 難易度2 (rarity: 20) ──
  titleHolder: [
    '戴冠の記憶', '流星のチャンピオン', 'ワンチャンス・クイーン'
  ],
  rookieOfYear: [
    '新人王', 'デビューイヤーの主役'
  ],
  peakOvr90: [
    '超一流の証', '天賦の才', '覚醒者'
  ],
  warHero: [
    '対抗戦の功労者', '団体間抗争の主役', '抗争の立役者'
  ],
  mediaAward: [
    'メディアのチャンピオン', '広報の星', 'リング外のMVP', 'メディアの寵児', '話題の中心'
  ],
  ironwoman: [
    '鉄人', '生涯現役', '10年選手'
  ],

  // ── 難易度1 (rarity: 10) ──
  peakOvr80: [
    '実力者', '隠れた実力派', 'いぶし銀'
  ],
  bestMQ70: [
    '試合巧者', '技巧派'
  ],
  highTrust: [
    '愛された女', 'ファンの心'
  ],
  solidCareer: [
    '殿堂の誇り', '確かな足跡', '静かなる功労者',
    '忘れてはならない選手', '名脇役の勲章', 'リングに生きた女',
    '縁の下の力持ち', '無冠の実力者'
  ],
};
```

---

## 6. プレースホルダー解決

```javascript
function resolvePlaceholders(text, rec, fighter) {
  return text
    .replace('{n}', String(rec.totalDefenses || 0))
    .replace('{name}', fighter.name || '');
}
```

---

## 7. 選出アルゴリズム

**方針: 最高rarityのタグ群のみからテンプレートを選ぶ。**
異なるrarity（難度）のテンプレートが混ざらないため、
「通算20防衛の選手に3度戴冠由来の異名がつく」ような違和感が起きない。
汎用プール混入は最高rarityが20以下（難度1〜2）のときだけ。

```javascript
generateEpithet(rec, fighter, rng) {
  const history = (rec && rec.history) || [];
  const ctx = buildEpithetContext(rec, history, fighter);

  // 1. 全タグ判定（solidCareerは常にマッチするのでフォールバック兼用）
  const matchedTags = EPITHET_TAGS.filter(tag =>
    tag.test(rec, history, fighter, ctx)
  );

  if (matchedTags.length === 0) return '殿堂の誇り';

  // 2. 最高rarityを特定
  const maxRarity = Math.max(...matchedTags.map(t => t.rarity));

  // 3. 最高rarityのタグ群のみ抽出（同一難度は全部まとめてOK）
  const topTier = matchedTags.filter(t => t.rarity === maxRarity);

  // 4. テンプレートをプール化（均等weight）
  const pool = [];
  for (const tag of topTier) {
    const templates = EPITHET_TEMPLATES[tag.id] || [];
    for (const tmpl of templates) {
      pool.push(resolvePlaceholders(tmpl, rec, fighter));
    }
  }

  // 5. 低難度（rarity <= 20）のときだけ汎用プール混入（25%確率）
  if (maxRarity <= 20 && Engine.rng.float(rng) < 0.25) {
    pool.push(...EPITHET_TEMPLATES.solidCareer);
  }

  // 6. プール不足時はsolidCareerをフォールバック
  if (pool.length === 0) {
    pool.push(...EPITHET_TEMPLATES.solidCareer);
  }

  // 7. 均等ランダム選出
  return pool[Engine.rng.int(rng, 0, pool.length - 1)];
}
```

---

## 8. テンプレート数一覧

| 難度 | タグ | テンプレート数 |
|------|------|---------------|
| 6 | 無敗王座引退 | 4 |
| 6 | 通算20防衛 | 5 |
| 5 | グランドスラム | 4 |
| 5 | ジュニア3連覇 | 4 |
| 5 | PPV 2連覇 | 4 |
| 5 | MVP 3回以上 | 5 |
| 5 | 単一在位15防衛 | 4 |
| 5 | 3度戴冠 | 4 |
| 4 | ジュニア2連覇 | 4 |
| 4 | PPV 2回優勝 | 3 |
| 4 | 通算10防衛 | 3 |
| 4 | MVP 2回 | 4 |
| 4 | ベストマッチ3回以上 | 4 |
| 4 | 対抗戦5勝以上 | 4 |
| 3 | タイトル戴冠+5防衛 | 4 |
| 3 | ジュニア優勝 | 3 |
| 3 | PPV優勝 | 4 |
| 3 | MVP 1回 | 4 |
| 3 | 2度戴冠 | 4 |
| 3 | ベストマッチ1回以上 | 3 |
| 2 | タイトル戴冠(防衛5未満) | 3 |
| 2 | 新人王 | 2 |
| 2 | peakOVR 90以上 | 3 |
| 2 | 対抗戦3勝以上 | 3 |
| 2 | メディア功労賞 | 5 |
| 2 | 在籍10シーズン以上 | 3 |
| 1 | peakOVR 80以上 | 3 |
| 1 | careerBestMQ 70以上 | 2 |
| 1 | trust 80以上 | 2 |
| 1 | 汎用 | 8 |
| | **合計** | **104** |

---

## 9. 実装フェーズ

### Phase 1: コア実装
1. `buildEpithetContext()` 関数追加
2. `EPITHET_TAGS` 定数追加
3. `EPITHET_TEMPLATES` 定数追加
4. `generateEpithet(rec, fighter, rng)` 書き換え
5. `_buildHofEntry` の呼び出し変更（rng渡し + 追加フィールド）
6. `resolvePlaceholders()` 追加

### Phase 2: テスト
1. 既存auto-simとの互換確認
2. 100シーズンsimで異名分布確認
3. 同一選手の異名重複率チェック
