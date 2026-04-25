# 年代記 vNext (mode判定 + 記者の目拡充) 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 4〜5時間
> **承認状態**: 設計合意済み (`specs/chronicle-system-spec-v0.2.md`)
> **前提**: `feature/chronicle-vnext` ブランチを main から切って作業
> **モデル選定**: Sonnet 推奨 (Engine 側の純粋関数追加 + 表示層の単純な切り替え + テンプレート集執筆の複合タスクだが、複雑な状態遷移は伴わない)

---

## このタスクの目的

団体年代記に「章ごとのプレイヤー団体の立場 (mode)」概念を導入し、表示と記者の目の文章を mode に応じて変化させる。

具体的には:

1. プレイヤーが 1 位を取った後の章で「VS S-TIER 0勝0敗」のような空虚な表示が出ないようにする
2. 章ごとの主役 (ace) の人物像が、所属時代の立場と本人の戦績の組み合わせでより鮮明に語られるようにする

---

## 実装するもの

1. **`Engine.chronicle._classifyChapterMode(chapter, state)`** 新規 — 章 mode 判定 (純粋関数)
2. **`Engine.chronicle._buildCompetitiveRecord(chapter, mode, eraStats, chars)`** 新規 — `{ mode, label, valueText }` 整形
3. **`Engine.chronicle._buildEraStats` 拡張** — `totalTitleDefenses` フィールド追加
4. **`Engine.chronicle.buildChapters` 修正** — `_buildEraStats` 呼び出し後に `_classifyChapterMode` と `_buildCompetitiveRecord` を呼んで `eraStats.competitiveRecord` を埋める
5. **`Engine.chronicle.QUOTE_TEMPLATES`** 新規定数 — 8カテゴリ × 各3本以上のテンプレート集
6. **`Engine.chronicle._classifyAceQuoteCategory(ace, chapter, state)`** 新規 — カテゴリ判定 (純粋関数)
7. **`Engine.chronicle.buildAceQuote(ace, chapter, state)`** 新規 — テンプレート選択 + 値埋め
8. **`ui-render.js` の `_chronicleAceQuote`** — `Engine.chronicle.buildAceQuote` を呼ぶだけのシムに置換
9. **`ui-render.js` の era stats レンダリング** — 2番目のボックスを `competitiveRecord.label` / `valueText` で描画

**実装しないもの**:
- `eraStats.vsStier` の集計対象変更 (v0.1 のまま、全対抗戦カウント)
- 他3ボックス (TITLES / PEAK POP / STATUS) のラベル和語化
- 古いセーブ向けの明示的マイグレーションコード
- mode/カテゴリの追加自由化機構 (テンプレートの動的追加 API 等は作らない)
- `decline` モード以外での `titleLoss` の表示

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. `CLAUDE.md` — アーキテクチャ原則・開発ルール
2. `specs/chronicle-system-spec-v0.1.md` — 既存仕様 (特に §3.2, §4.5, §6)
3. `specs/chronicle-system-spec-v0.2.md` — 今回の仕様 (最重要)
4. `src/management.js` L2156-2796 — `Engine.chronicle` モジュール本体
5. `src/ui-render.js` L7148-7228 — era stats 描画と `_chronicleAceQuote` 現行コード

---

## 既存コードの影響範囲

### 変更するファイル

| ファイル | 変更内容 |
|---|---|
| `src/management.js` | `Engine.chronicle` に新規関数 4つ + 定数 1つ追加 / `_buildEraStats` 拡張 / `buildChapters` 修正 |
| `src/ui-render.js` | era stats 2番目のボックスを `competitiveRecord` 参照に変更 / `_chronicleAceQuote` をシム化 |
| `specs/chronicle-system-spec-v0.2.md` | 既に作成済み (本タスクで参照のみ) |

### 触らないファイル

- `src/data.js` (新規定数は `Engine.chronicle` 名前空間に置くため)
- `src/app.js` (chronicle.refreshChapters の呼び出し箇所は既存通り)
- `src/index.html` (CSS 変更なし)
- `specs/chronicle-system-spec-v0.1.md` (差分は v0.2 に分離)

---

## 実装フェーズ

### Phase A: eraStats 拡張 + mode 判定 (Engine 層)

#### Step A1. `_classifyChapterMode(chapter, state)` 実装

`Engine.chronicle` モジュール内、`_buildEraStats` の上か直前に新規追加。

純粋関数。spec v0.2 §A.3 のアルゴリズムを忠実に実装する。

入力:
- `chapter`: `{ seasonStart, seasonEnd, ... }`
- `state`: `{ seasonHistory, rankings, ... }`

出力: `'summit' | 'defense' | 'contention' | 'challenge' | 'ascend' | 'decline'`

実装の骨格:

```js
_classifyChapterMode(chapter, state) {
  const sh = state?.seasonHistory || [];
  const ranks = [];
  for (let s = chapter.seasonStart; s <= chapter.seasonEnd; s++) {
    const entry = sh.find(h => h.season === s);
    if (entry && typeof entry.rank === 'number') ranks.push(entry.rank);
  }
  if (ranks.length === 0) {
    const cur = (state?.rankings || []).find(r => r.orgId === 'player');
    if (cur && typeof cur.rank === 'number') ranks.push(cur.rank);
  }
  if (ranks.length === 0) return 'challenge';

  const first = ranks[0];
  const last = ranks[ranks.length - 1];
  if (first >= 3 && last === 1) return 'ascend';
  if (first === 1 && last >= 3) return 'decline';

  const t1 = ranks.filter(r => r === 1).length;
  const t2 = ranks.filter(r => r === 2).length;
  const t3 = ranks.filter(r => r >= 3).length;

  // タイブレーク: 章末ランクのティアを優先
  const lastTier = last === 1 ? 't1' : last === 2 ? 't2' : 't3';
  const counts = { t1, t2, t3 };
  const max = Math.max(t1, t2, t3);
  let topTier;
  if (counts[lastTier] === max) topTier = lastTier;
  else if (t1 === max) topTier = 't1';
  else if (t2 === max) topTier = 't2';
  else topTier = 't3';

  if (topTier === 't1') {
    const t2Ratio = t2 / ranks.length;
    return t2Ratio >= 0.25 ? 'defense' : 'summit';
  }
  if (topTier === 't2') return 'contention';
  return 'challenge';
}
```

`Engine.ranking.getPlayerRank` が既存にある場合はフォールバック処理でそちらを使ってもよい (要確認: `src/management.js` を grep)。

**確認すること**:
- `state.rankings` 内のプレイヤーエントリは `orgId === 'player'` で識別できるか (要 grep)
- `seasonHistory[i].rank` は 1-indexed か 0-indexed か (実データ確認)

#### Step A2. `_buildEraStats` 拡張

既存 (management.js L2677-2692) の関数に `totalTitleDefenses` 集計を追加。

```js
_buildEraStats(chapter, aces, peers) {
  const chars = [...aces, ...peers];
  let totalTitleWins = 0;
  let totalTitleDefenses = 0;        // ← 新規
  let warWins = 0, warLosses = 0;
  let titleLossInChapter = false;    // ← decline モード用 (Step A3 で使う)
  chars.forEach(c => {
    const hist = ((c.careerRecord || {}).history || [])
      .filter(e => (e.season || 0) >= chapter.seasonStart
                && (e.season || 0) <= chapter.seasonEnd);
    totalTitleWins += hist.filter(e => e.type === 'titleWin').length;
    hist.filter(e => e.type === 'titleDefense').forEach(e => {
      totalTitleDefenses += (e.count || 1);   // count があればそれを優先
    });
    if (hist.some(e => e.type === 'titleLoss')) titleLossInChapter = true;
    hist.filter(e => e.type === 'war').forEach(e => {
      if (e.won === true) warWins++;
      else if (e.won === false) warLosses++;
    });
  });
  const peakOrgPop = chars.reduce((mx, c) => Math.max(mx, c.peakPopularity || 0), 0);
  return {
    totalTitleWins,
    totalTitleDefenses,
    vsStier: { wins: warWins, losses: warLosses },
    peakOrgPop,
    _titleLossInChapter: titleLossInChapter,   // 内部用、competitiveRecord 計算で消費
  };
}
```

**注意**: `titleDefense` イベントの `count` が「累積」なのか「単発」なのかは要実データ確認。`_buildHighlights` (L2624-2628) では `ev.count >= 3` で判定しているので、累積カウンタの可能性が高い。もし累積であれば、章メンバー × チャプター内 titleDefense イベントの **最大 count から最小 count + 1** を取るような処理が必要。実装前に `git log -p` で `titleDefense` を作っている箇所を確認すること。

#### Step A3. `_buildCompetitiveRecord(chapter, mode, eraStats, chars)` 実装

spec v0.2 §C.1 の表に従って `{ mode, label, valueText }` を組み立てる。

```js
_buildCompetitiveRecord(chapter, mode, eraStats) {
  const def = eraStats.totalTitleDefenses || 0;
  const w = (eraStats.vsStier && eraStats.vsStier.wins) || 0;
  const l = (eraStats.vsStier && eraStats.vsStier.losses) || 0;
  switch (mode) {
    case 'summit':
      return { mode, label: '君臨', valueText: `${def}度防衛` };
    case 'defense':
      return { mode, label: '防衛戦', valueText: `${def}度防衛` };
    case 'contention':
      return { mode, label: 'つばぜり合い', valueText: `${w}勝${l}敗` };
    case 'challenge':
      return { mode, label: '殴り込み', valueText: `${w}勝${l}敗` };
    case 'ascend':
      return { mode, label: '下剋上', valueText: `${w}勝${l}敗` };
    case 'decline': {
      const lost = eraStats._titleLossInChapter ? '・王座失陥' : '';
      return { mode, label: '陥落', valueText: `${def}度防衛${lost}` };
    }
    default:
      return { mode: 'challenge', label: '殴り込み', valueText: `${w}勝${l}敗` };
  }
}
```

#### Step A4. `buildChapters` への組み込み

management.js L2710 付近の `buildChapters` 内、`_buildEraStats` 呼び出し直後に mode と competitiveRecord を生成して `eraStats` にマージする:

```js
const eraStats = Engine.chronicle._buildEraStats(b, sel.aces, sel.peers);
const mode = Engine.chronicle._classifyChapterMode(b, state);
eraStats.competitiveRecord = Engine.chronicle._buildCompetitiveRecord(b, mode, eraStats);
delete eraStats._titleLossInChapter;   // 内部フィールドは外に出さない
```

#### Step A5. Phase A 動作確認

- auto-sim を 1 シード × 50 シーズン回し、生成された章の `eraStats.competitiveRecord` をログ出力で確認
- 6 mode 全てが少なくとも一度は登場することを確認 (シード次第なので最低限 challenge/contention/summit の3つ)
- `eraStats.vsStier` の値が v0.1 と変わっていないことを確認

---

### Phase B: 表示の切り替え (UI 層)

#### Step B1. era stats 2番目のボックスの差し替え

`src/ui-render.js` L7155-7158 の VS S-TIER ボックス:

```html
<div class="chron-era-stat">
  <div class="chron-era-stat-key">VS S-TIER</div>
  <div class="chron-era-stat-val">${(es.vsStier && es.vsStier.wins) || 0}<span class="small">勝</span>${(es.vsStier && es.vsStier.losses) || 0}<span class="small">敗</span></div>
</div>
```

これを以下に置き換える:

```html
<div class="chron-era-stat">
  <div class="chron-era-stat-key">${es.competitiveRecord ? es.competitiveRecord.label : 'VS S-TIER'}</div>
  <div class="chron-era-stat-val">${es.competitiveRecord ? _chronicleCompetitiveValueHtml(es.competitiveRecord.valueText) : `${(es.vsStier && es.vsStier.wins) || 0}<span class="small">勝</span>${(es.vsStier && es.vsStier.losses) || 0}<span class="small">敗</span>`}</div>
</div>
```

ここで `_chronicleCompetitiveValueHtml(valueText)` は新規ヘルパーで、文字列内の「勝/敗/度防衛/王座失陥」を `<span class="small">` で装飾する。例:
- `"5度防衛"` → `5<span class="small">度防衛</span>`
- `"3勝7敗"` → `3<span class="small">勝</span>7<span class="small">敗</span>`
- `"2度防衛・王座失陥"` → `2<span class="small">度防衛・王座失陥</span>`

ヘルパー実装例:

```js
function _chronicleCompetitiveValueHtml(text) {
  // "X度防衛・王座失陥" → "X<span class='small'>度防衛・王座失陥</span>"
  let m = text.match(/^(\d+)度防衛(.*)$/);
  if (m) return `${m[1]}<span class="small">度防衛${m[2]}</span>`;
  // "X勝Y敗" → "X<span class='small'>勝</span>Y<span class='small'>敗</span>"
  m = text.match(/^(\d+)勝(\d+)敗$/);
  if (m) return `${m[1]}<span class="small">勝</span>${m[2]}<span class="small">敗</span>`;
  return text;
}
```

#### Step B2. v0.1 互換のフォールバック確認

古いセーブを読み込んで、`competitiveRecord` が `undefined` のまま `_renderDbChronicle` を呼んだとき、Step B1 の三項演算子により VS S-TIER 表示にフォールバックすることを確認。手動で 1 章だけ古い形式に戻して目視確認すれば十分。

---

### Phase C: 記者の目 8カテゴリ拡充

#### Step C1. テンプレート定数の追加

`Engine.chronicle` モジュールに `QUOTE_TEMPLATES` 定数を追加。各カテゴリ最低3本。spec v0.2 §D.4 の文体目安に従って執筆する。

サンプル (実装時に増やす):

```js
QUOTE_TEMPLATES: {
  peakDefender: [
    '{surname}は{defenses}度の防衛で頂点を守り続けた。誰にも玉座を譲ない世代だった。',
    '王者{surname}に挑んだ者たちは、ことごとく退けられた。{defenses}度防衛は、その時代を象徴している。',
    '{surname}が王座にいる限り、誰もその座は奪えない。誰もがそう信じて疑わない。そういう時代だった。'
  ],
  defender: [
    '{surname}は王座を{defenses}度防衛し、団体の核として時代を背負った。',
    '{titleReigns}度の戴冠と{defenses}度の防衛。{surname}が立っていることが、団体の安定そのものだった。',
    '{surname}は王座を離さなかった。挑戦者たちは皆、跳ね返された。'
  ],
  champion: [
    '{surname}は{titleReigns}度の王座戴冠を達成し、世代を黄金期に押し上げた。',
    '{surname}の{titleReigns}度の戴冠が、この世代を語る上での出発点になる。',
    '何度王座から落ちても、{surname}は戻ってきた。{titleReigns}度の戴冠はその執念の証だった。'
  ],
  popStar: [
    '{surname}の人気が客足を支えた。戦績ではなく動員で、時代を作った世代だった。',
    '王座にこそ恵まれなかったが、{surname}の華やかさが客席を埋めた。',
    '試合記録には残らない記憶というものを、{surname}は、その人気でこの世代に刻みつけた。'
  ],
  generationShift: [
    '{surname}は前世代の主役たちと並走し、世代交代の橋渡しとなった。',
    '{surname}の章は、過去と未来が混じり合った時間として団体史に残る。',
    '前章の主役たちが退いていく中、{surname}が次の中心を担った。'
  ],
  struggle: [
    '{surname}は{styleJa}を貫いたが、上位の壁は厚かった。届かないまま章は閉じる。',
    '挑んでは敗れ、それでも{surname}は{styleJa}を捨てなかった。届かなかった世代の象徴である。',
    '{surname}の章は、勝てなかった日々の記録である。だが、それでも諦めず挑戦を続けた日々の記録でもある。'
  ],
  craftsman: [
    '{surname}は{styleJa}を武器に団体を支えた。王座にこそ届かなかったが、世代の支柱だった。',
    'OVR{peakOVR}に達した{surname}は、無冠ながら誰よりも信頼される選手だった。',
    '{surname}の{styleJa}は派手さこそないが、団体を底から支え続けた。'
  ],
  uncrowned: [
    '{surname}は無冠ながらこの世代の主役だった。タイトルでは測れない存在感がそこにあった。',
    '王座を獲ることはなかったが、{surname}抜きにこの章は語れない。',
    '{surname}は最後までベルトを巻かなかった。だが団体史はこの選手を主役として記憶する。'
  ]
}
```

実装時に追加で 1〜2 本ずつ書き足し、ばらつきを増やす。

#### Step C2. `_classifyAceQuoteCategory(ace, chapter, state)` 実装

spec v0.2 §D.3 の優先順表に従って判定。`chapter.eraStats.competitiveRecord.mode` を参照すること (Phase A で既に格納されている前提)。

```js
_classifyAceQuoteCategory(ace, chapter, state) {
  const mode = chapter?.eraStats?.competitiveRecord?.mode || 'challenge';
  const aceHist = ((ace.careerRecord || {}).history || [])
    .filter(e => (e.season || 0) >= chapter.seasonStart
              && (e.season || 0) <= chapter.seasonEnd);
  const chapterDefenses = aceHist.filter(e => e.type === 'titleDefense')
    .reduce((s, e) => s + (e.count || 1), 0);
  const chapterWarWins = aceHist.filter(e => e.type === 'war' && e.won === true).length;
  const chapterWarLosses = aceHist.filter(e => e.type === 'war' && e.won === false).length;

  // 1. peakDefender
  if (mode === 'summit' && chapterDefenses >= 3) return 'peakDefender';
  // 2. defender
  if ((ace.titleReigns || 0) >= 1 && (ace.totalDefenses || 0) >= 3) return 'defender';
  // 3. champion
  if ((ace.titleReigns || 0) >= 2) return 'champion';
  // 4. popStar
  if ((ace.peakPopularity || 0) >= 90) return 'popStar';
  // 5. generationShift
  if ((chapter.number || 0) >= 3) {
    const chapters = state?.chronicle?.chaptersCache?.chapters || [];
    const prev = chapters.find(c => c.number === chapter.number - 1);
    if (prev) {
      const prevIds = new Set([...(prev.aces || []), ...(prev.peers || [])].map(p => p.id));
      const curPeerIds = (chapter.peers || []).map(p => p.id);
      if (curPeerIds.some(id => prevIds.has(id))) return 'generationShift';
    }
  }
  // 6. struggle
  if (mode === 'challenge' && chapterWarLosses >= 2 && chapterWarWins === 0) return 'struggle';
  // 7. craftsman
  if ((ace.peakOVR || 0) >= 88 && (ace.titleReigns || 0) === 0) return 'craftsman';
  // 8. uncrowned
  return 'uncrowned';
}
```

#### Step C3. `buildAceQuote(ace, chapter, state)` 実装

```js
buildAceQuote(ace, chapter, state) {
  const category = Engine.chronicle._classifyAceQuoteCategory(ace, chapter, state);
  const templates = Engine.chronicle.QUOTE_TEMPLATES[category]
    || Engine.chronicle.QUOTE_TEMPLATES.uncrowned;
  const seedBase = state?.rngSeed || 'default';
  const seedKey = `chronicle-quote:${chapter.id}:${ace.id}`;
  const seed = Engine.rng.derive(seedBase, seedKey);
  const idx = ((seed | 0) % templates.length + templates.length) % templates.length;
  const tpl = templates[idx];

  const styleJa = Engine.chronicle.AXIS_LABELS[Engine.chronicle._styleAxis(ace.style)] || '独自';
  const surname = Engine.chronicle._getSurname(ace.name);
  const aceHist = ((ace.careerRecord || {}).history || [])
    .filter(e => (e.season || 0) >= chapter.seasonStart
              && (e.season || 0) <= chapter.seasonEnd);
  const chapterDefenses = aceHist.filter(e => e.type === 'titleDefense')
    .reduce((s, e) => s + (e.count || 1), 0);

  return tpl
    .replace(/\{surname\}/g, surname)
    .replace(/\{styleJa\}/g, styleJa)
    .replace(/\{titleReigns\}/g, String(ace.titleReigns || 0))
    .replace(/\{defenses\}/g, String(chapterDefenses))
    .replace(/\{peakOVR\}/g, String(ace.peakOVR || 0))
    .replace(/\{peakPop\}/g, String(ace.peakPopularity || 0));
}
```

`Engine.rng.derive` の引数仕様は要確認 (`src/management.js` 内の使用例を grep)。`(seedBase, seedKey)` の2引数形式が無い場合は、`(seedBase, hash1, hash2)` 形式に分解する必要がある可能性がある。

#### Step C4. `_chronicleAceQuote` のシム化

`src/ui-render.js` L7209-7228 の `_chronicleAceQuote` を以下に置換:

```js
function _chronicleAceQuote(ace, chapter) {
  if (Engine.chronicle && typeof Engine.chronicle.buildAceQuote === 'function') {
    return Engine.chronicle.buildAceQuote(ace, chapter, G);
  }
  // フォールバック (古い Engine 状態)
  return `${Engine.chronicle._getSurname(ace.name)}はこの世代の主役だった。`;
}
```

呼び出し側 (L7044, L7085) は変更不要。

#### Step C5. Phase C 動作確認

- 同じ章を 5 回開いて、文章が完全に同一であることを確認 (決定論性)
- 異なるセーブ (rngSeed が異なる) で同条件の章を生成し、文章が違う選択になり得ることを確認
- auto-sim 50 シーズンを回し、生成される章のエースに対してカテゴリの分布を集計 (8 カテゴリ全て登場するのが理想だが、最低でも uncrowned/champion/craftsman の 3 つは出るはず)

---

## 受け入れ条件

`feature/chronicle-vnext` ブランチで以下が全て満たされていること:

1. **空虚表示の解消**: プレイヤーが 1 位を取った後の章で「VS S-TIER 0勝0敗」が表示されない。代わりに「君臨 / 防衛戦 / つばぜり合い」のいずれかが出る
2. **下剋上の保持**: 下位時代の章は「殴り込み w勝l敗」または「下剋上 w勝l敗」で表示される
3. **転落の表現**: 1 位から 4 位まで落ちた章は「陥落 n度防衛・王座失陥」で表示される
4. **記者の目の安定性**: 同じ章を再度開いても文章が変わらない
5. **記者の目の多様性**: 章のエースが違えば文章の方向性 (カテゴリ) が変わる。auto-sim ログで複数カテゴリが出ていることを確認
6. **古いセーブの後方互換**: v0.1 で作成されたセーブを開いてもクラッシュせず、フォールバック表示 (VS S-TIER) で動く
7. **auto-sim regression**: 1 シード × 100 シーズンの auto-sim が完走する (Engine 変更による副作用がないこと)
8. **ビルド警告ゼロ**: コンソールエラー・警告が増えていない
9. **文字化けなし**: 8 カテゴリのテンプレート文に文字化けする外字が含まれない (実機 = iPhone Safari でも目視確認)
10. **spec 整合**: `specs/chronicle-system-spec-v0.2.md` の §A.3 判定例 (12 ケース) が `_classifyChapterMode` 単体テスト相当の手動チェックで全て通る

---

## 進め方の推奨

1. まず Phase A だけを実装してコミット (eraStats 拡張・mode 判定)。コミットメッセージ例: `feat(chronicle): add chapter mode classification and titleDefenses to eraStats`
2. 次に Phase B をコミット (UI 切り替え)。コミットメッセージ例: `feat(chronicle): switch competitive record display by chapter mode`
3. 最後に Phase C をコミット (記者の目)。コミットメッセージ例: `feat(chronicle): expand ace quote into 8 categories with deterministic templates`
4. 各フェーズ後に最低限の手動確認 (auto-sim 起動 + 年代記タブ目視) を挟む
5. 全フェーズ完了後に main にマージする前に、Keisuke に PR レビュー依頼

---

## 想定される落とし穴

- **`titleDefense.count` の意味**: 累積 vs 単発の判定が誤っていると `totalTitleDefenses` がインフレする可能性。実データで要確認
- **`Engine.rng.derive` の引数仕様**: 2 引数か 3 引数かは既存使用箇所を grep して合わせる
- **`state.rankings[].orgId`**: プレイヤーが `'player'` か別キーかは要確認 (4団体構成では `RIVAL_ORGS` の id と区別される)
- **章 mode が章境界変更で変わる**: refreshChapters で章境界が動くと mode も変わる。これは仕様通り (確定したらキャッシュされる) なので問題ないが、テスト時は混乱しやすい
- **古いセーブで `competitiveRecord` 未生成**: フォールバック表示が機能することを実機で確認

---

## 完了時の成果物

- `feature/chronicle-vnext` ブランチに 3 コミット (Phase A/B/C)
- `specs/chronicle-system-spec-v0.2.md` を main に取り込む PR (本タスク開始時に既に作成されている前提だが、まだなら最初のコミットに含める)
- auto-sim ログ (100 シーズン分) の概要を PR description に記載
- 実機での目視確認結果 (年代記タブの 6 mode 表示例 + 8 カテゴリ記者コメント例) を PR にスクリーンショット添付

実装後の post-implementation 課題 (今回の範囲外):
- 他 era stats ボックス (TITLES / PEAK POP / STATUS) のラベル和語化検討
- mode の表示色分け (summit=金、challenge=赤 等) の検討
