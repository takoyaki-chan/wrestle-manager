# 因縁列伝(3面)実装 + 新聞・団体比較リデザイン Handoff v1.0

## このドキュメントについて

3つの作業をまとめて Claude Code セッションで実装するための引き継ぎ書です。

**作業範囲(優先度順):**
1. 派閥タブの位置変更 + 非表示制御 (小・独立)
2. MQ評価の会場レベル補正 (中・独立)
3. 新聞 + 団体比較の780px紙面統一 + 文面拡充 (大)
4. 因縁列伝(3面)新規実装 [B案: H2H.history[] 駆動 + 9象限分類] (大)

**モックアップ参照:**
- `docs/ui/mockups/newspaper-mockup-v8.html` (1面+2面+3面 統合形)

**実装方針:**
- 既存の `kuroda-text.js` の世界観・配列構造に倣う
- 9象限ラベルは内部タグ。紙面には**叙述的見出し+本文**で関係性を伝える(数値メーター表示は廃止)
- 淡白なペア(rivalry < 40)は3面に表示しない

---

## Step 0: 事前準備

```bash
git fetch origin
git checkout -b feat/newspaper-rivalry-redesign
```

リポジトリ全体を `view` で確認:
- `src/ui-render.js` (主要対象。約8000行)
- `src/relationships.js` (Engine.h2h, BOND/RIVALRY ラベル定義)
- `src/kuroda-text.js` (黒田フレーバー配列。新規 KURODA_RELATION_NARRATIVE を追加)
- `src/app.js` (SAVE_TRIM, h2h.update 呼び出し箇所)
- `src/management.js` (AI同士h2h.update呼び出し)
- `src/index.html` (CSS追加箇所)

---

## 黒田幸子の文体設計(全フレーバーテキスト共通の指針)

このセクションは Step 3(KURODA_*配列の拡充)と Step 4-4(KURODA_RELATION_NARRATIVE 新規実装)の**両方から参照される、文体の共通ガイド**です。

### キャラクターの核

黒田幸子は **「業界を40年見てきた、冷静な観察者」**。

- GMに対しては容赦なく辛口だが、選手個人の努力や、関係性の深さを語るときには、敬意と感傷が滲む
- 共通するのは **「数字を見て、人間を見る」** という観察眼
- 観察対象によって温度が変わるが、観察者の姿勢は変わらない

この核を全画面で守ることで、画面ごとに温度差があっても「同じ人物」として読める。

### 画面ごとの温度設計(モード制)

| 画面 | 観察対象 | 温度 | モード名 | 例 |
|---|---|---|---|---|
| **2面 団体比較** | 団体・GM | 冷徹・煽り | 論評モード | 「鏡を見るべきだ」「夜ちゃんと眠れているのか」 |
| **1面 興行記事(自団体)** | 興行・観客の反応 | 冷静・分析的 | 観戦モード | 「観客の表情が変わった瞬間が3度あった。これは嘘をつかない数字だ」 |
| **1面 他団体ニュース** | 他団体・選手 | 中立・観察 | 取材モード | 「〜と関係者は語る」「〜と本紙は見ている」 |
| **3面 因縁列伝** | 選手と選手の関係 | 感傷的・含蓄 | 取材モード(深め) | 「3年の付き合いの中で、二人は確実に何かを共有してきた」 |

**設計上の重要原則**:
- 同じ画面内では基本トーンを揃える(団体比較で急に情緒的にならない、因縁列伝で急に煽らない)
- ただし**例外文として、別の温度を1割程度混ぜる**ことで、人間味とリズムが出る(例: 因縁列伝の中に「もっとも、それを認めるかどうかは別の話だが」のような辛口のチクリを混ぜる)

### 共通項(画面が違っても変えない要素)

#### 文体ルール

1. **断定する語尾**を中心とする
   - ✅ 「〜だ」「〜である」「〜のだ」「〜と見ている」
   - ❌ 「〜ですね」「〜だと思います」「〜でしょうね」

2. **観察者としての主語**を時々使う(主観を隠さない)
   - 「私は」「本紙は」「記者として」
   - 例: 「記者として40年やってきたが」「本紙はそう書いておく」

3. **対比構造**を好む(短く対比させる)
   - 「Aだ。だがBではない」
   - 例: 「強いのは事実だ。だが、強いだけで勝てるなら誰も苦労しない」

4. **数字を引用する癖**(必ず数値に絡める)
   - 「3年の付き合い」「89点という最高評価」「+26という伸び」
   - 数字を出して、そこから人間の話に繋げるのが黒田の型

5. **業界全体の引いた視点**
   - 「業界では」「記者として」「本紙としては」「40年見てきた中で」

#### 黒田のお決まりフレーズ(画面横断で散りばめる)

実装時は各配列内で2〜3割の頻度でこれらのフレーズを混ぜる。読者(プレイヤー)が画面を跨いでも「あ、黒田だな」と認識できるようにする。

```
署名・自称系:
  「記者として」
  「本紙は」「本紙としては」
  「40年やってきたが」「40年見てきた中で」

観察・断定系:
  「〜と書いておく」
  「〜と見ている」
  「〜である」「〜のだ」

数字への敬意系:
  「数字は嘘をつかない」
  「数字が物語っている」
  「この数字こそ〜の証明だ」

含蓄系:
  「〜とも言える」「〜とも取れる」
  「〜が、まあ、それはそれとして」
  「もっとも、〜は別の話だが」
```

### 例: 同じ事実を3つのモードで書き分ける

仮に「阿武隈塔子が橘玲美に初勝利した(MQ89)」という事実を、3画面それぞれで書くなら:

#### 団体比較(論評モード・辛口)
> 「ようやく1勝。だが、通算1勝2敗で「並んだ」とは言わない。本紙としては、ここで満足するなら興行を打つ意味がない、と書いておく。」

#### 興行記事(観戦モード・冷静)
> 「観客の歓声が割れた瞬間が、25分の試合で3度あった。MQ89という数字は、その3度の瞬間が積み上がった結果だろう。記者として、納得できる評価だ。」

#### 因縁列伝(取材モード・情緒)
> 「3年の付き合いの中で、塔子はようやく1勝をもぎ取った。勝った試合がキャリア最高の評価——これ以上の証明はない。本紙はそう書いておく。」

すべて黒田だが、温度と語り口の重心が違う。**「〜と書いておく」「本紙は」「数字は嘘をつかない」**のようなお決まりフレーズが、同一人物としての連続性を担保する。

### 既存配列の扱い(リスペクトすべきもの)

`src/kuroda-text.js` の既存配列(主に団体比較用)は **論評モード** の典型例として残す。これらの調子は変えない。

新規追加する配列(`KURODA_RELATION_NARRATIVE` など)は **取材モード(深め)** で書き、団体比較とは異なる温度であることを明確にする。

ただし**お決まりフレーズ**は両方で共有することで、画面を跨いだ連続性を保つ。

### NG パターン(避けるべきもの)

| NG | なぜダメか |
|---|---|
| 興行記事で「お前の興行はゴミだ」のような煽り | 興行画面は「振り返りを楽しむ」場面。煽られると不快 |
| 因縁列伝で「数値: 87点の宿敵」のように数字ラベル | 紙面表現は言葉のみ(数値メーター廃止の決定) |
| 「〜だね」「〜じゃん」のような砕けた語尾 | 黒田の文体ではない(編集長の格を保つ) |
| 過剰な感情表現「素晴らしい!」「最悪だ!」 | 観察者の冷静さを保つ |
| キャラクター内輪の発言として書く | 黒田は記者であって、当事者ではない |

### 実装時のチェックリスト

新しいフレーバーテキストを書く時、以下を満たしているか確認:

- [ ] 語尾が断定形(「〜だ」「〜である」など)で揃っているか
- [ ] その画面のモードに合った温度か(団体比較=辛口、興行=冷静、因縁=情緒)
- [ ] お決まりフレーズが2〜3割の頻度で含まれているか
- [ ] 数字や事実に絡めて書かれているか(完全に主観だけになっていないか)
- [ ] 「観察者」の立場が崩れていないか(当事者目線になっていないか)

---



## Step 1: 派閥タブの位置移動 + 非表示制御

**対象**: `src/ui-render.js` L5255 付近の `_dbSubTab` 定義 と L5326 の `subTabs` 配列

### 1-1. subTabs 配列の順序変更

現状(L5326付近):
```js
const subTabs = [
  { idx: 0, label: '👥 全選手' },
  { idx: 1, label: '👔 全コーチ' },
  { idx: 4, label: '🕸 相関図' },
  { idx: 2, label: '⚔ 団体比較' },
  { idx: 7, label: '🎭 派閥' },     // ← これを団体比較の左へ
  { idx: 5, label: '📰 新聞' },
  { idx: 3, label: '🏆 殿堂' },
  { idx: 6, label: '📜 年代記' },
];
```

変更後:
```js
const subTabs = [
  { idx: 0, label: '👥 全選手' },
  { idx: 1, label: '👔 全コーチ' },
  { idx: 4, label: '🕸 相関図' },
  { idx: 7, label: '🎭 派閥' },     // ← 団体比較の左へ移動
  { idx: 2, label: '⚔ 団体比較' },
  { idx: 5, label: '📰 新聞' },
  { idx: 3, label: '🏆 殿堂' },
  { idx: 6, label: '📜 年代記' },
];
```

### 1-2. 派閥未発生時の非表示

派閥タブの表示条件を追加。`subTabs` 配列を生成する直前で:

```js
const hasFactions = (G.factions && G.factions.length > 0);
const subTabs = [
  { idx: 0, label: '👥 全選手' },
  { idx: 1, label: '👔 全コーチ' },
  { idx: 4, label: '🕸 相関図' },
  ...(hasFactions ? [{ idx: 7, label: '🎭 派閥' }] : []),
  { idx: 2, label: '⚔ 団体比較' },
  { idx: 5, label: '📰 新聞' },
  { idx: 3, label: '🏆 殿堂' },
  { idx: 6, label: '📜 年代記' },
];
```

L5255 の `let _dbSubTab = 0;` のコメントも更新:
```js
let _dbSubTab = 0; // 0=全選手 1=全コーチ 4=相関図 7=派閥(条件付) 2=団体比較 5=新聞 3=殿堂 6=年代記
```

### 1-3. テスト

- 派閥システム発動前: タブ8個 → 7個(派閥タブが消える)
- 派閥発動後: 派閥タブが団体比較の左に出現
- 既存の `_dbSubTab === 7` の派閥タブ参照は変更不要(idx値は同じ)

---

## Step 2: MQ評価の会場レベル補正

**対象**: `src/ui-render.js` L5723 の `_renderNewspaperDigest` 関数内

### 2-1. 現状の問題

```js
const expectedMQ = d.showRating?.expected || Math.round(25 + (G.orgPop || 0) * 0.6);
```

会場レベルが考慮されていないため、公民館(venue 0)で MQ40 を出しても「期待を下回る」判定されてしまう。

### 2-2. 修正方針

会場レベル別の係数テーブルを導入し、`expectedMQ` の計算式を変更:

```js
// 会場レベル別の期待MQベースライン(venueIdx: 0=公民館 → 9=ドーム)
const EXPECTED_MQ_BY_VENUE = [
  { base: 18, popCoef: 0.30 },  // 0: 公民館
  { base: 22, popCoef: 0.40 },  // 1: 小ホール
  { base: 26, popCoef: 0.45 },  // 2: 中ホール
  { base: 30, popCoef: 0.50 },  // 3: 大ホール
  { base: 35, popCoef: 0.55 },  // 4: アリーナ
  { base: 40, popCoef: 0.60 },  // 5: 大アリーナ
  { base: 45, popCoef: 0.65 },  // 6: 武道館
  { base: 50, popCoef: 0.70 },  // 7: スタジアム
  { base: 55, popCoef: 0.75 },  // 8: 大スタジアム
  { base: 60, popCoef: 0.80 },  // 9: ドーム
];

function _calcExpectedMQ(venueIdx, orgPop) {
  const conf = EXPECTED_MQ_BY_VENUE[venueIdx] || EXPECTED_MQ_BY_VENUE[0];
  return Math.round(conf.base + (orgPop || 0) * conf.popCoef);
}

// 使用箇所:
const expectedMQ = d.showRating?.expected || _calcExpectedMQ(d.venueIdx, G.orgPop);
```

`d.venueIdx` が `_renderNewspaperDigest` に来ているか確認(L5552 `_renderNewspaperPlayerShow` 経由なので、`d` には興行データが含まれる)。来ていない場合は `wp.venue` または `wp.show.venue` から取得。

### 2-3. テスト

- venue 0 (公民館), orgPop 30 → expectedMQ ≈ 27 (旧: 43 → 改善)
- venue 5 (大アリーナ), orgPop 50 → expectedMQ ≈ 70 (旧: 55)
- venue 9 (ドーム), orgPop 80 → expectedMQ ≈ 124 → 100以上は飽和でMax 95程度にcapする処理も検討

数値テーブルは初版を上記で実装し、auto-simで違和感あれば調整(数値はゲームバランスの観点でユーザー(Keisuke)に最終確認を取る)。

---

## Step 3: 新聞 + 団体比較の780px紙面統一

### 3-1. CSS の追加・統一

`src/index.html` の既存 `.db-cmp-*` 系CSSを v8 モックアップ準拠に統一。

**主な変更点(モックアップ `newspaper-mockup-v8.html` を参照):**

1. `.db-cmp-wrap` の `max-width` を `780px` に固定(現状は無指定 → 画面幅いっぱい)
2. 新聞紙面の幅も同じく `780px` に拡大(現状 560px)
3. 共通赤帯ヘッダー (`.paper-header`) と共通ページナビ (`.page-nav`) のクラスを定義
4. セクションラベル (`.sec-label`, `.sec-label-gold`) の統一
5. 黒田コメントブロック (`.kuroda-block`, `.kuroda-face`) の統一

CSS の詳細はモックアップ v8 の `<style>` セクションをベースに。

### 3-2. 新聞ページの豪華化

`_renderDbNewspaper` 関数の構造を改修:

- 一面記事の写真を 200×240px の額装風に拡大(現状不足)
- 興行結果の試合カード写真を 80px → 130px に拡大
- ダイジェストテーブルに寸評列を追加
- 他団体ニュースを 2カラムグリッドに

### 3-3. 団体比較ページの圧縮

`_renderDbOrgCompare` 関数の改修:

- 既存の SVG 放射状レーダーチャート + 軸別バー4本を**廃止**
- 新しい**左右対称バー型レーダー**(エース力・層の厚み・集客力・タイトル力の4軸)に置換
- エース対決 (`db-cmp-match-featured`) のスタンド画像対峙は維持(向き処理は `.ace-char.left img { transform: scaleX(-1); }` 既存のまま)
- 団体カード VS は 2カラムにコンパクト化

### 3-4. 文面バリエーションの拡充

> **文体ガイド: このドキュメント上部の「黒田幸子の文体設計」セクションを必ず参照してから書くこと。**
> 既存配列(主に団体比較用)は **論評モード**(辛口・煽り)、興行記事配列は **観戦モード**(冷静・分析的)、他団体ニュース配列は **取材モード**(中立・観察)で書き分ける。
> お決まりフレーズ(「本紙は」「〜と書いておく」「数字は嘘をつかない」など)を画面横断で散りばめ、同一人物としての連続性を担保する。

`src/kuroda-text.js` の既存配列を拡充:

| 配列名 | 既存件数 | 追加目標 |
|---|---|---|
| `KURODA_HEADLINES` (各tier) | 14-16 | +5本 |
| `KURODA_EDITORIAL` (各tier) | 既存数 | +5本 |
| `KURODA_WAR_RECORD.winStreak/loseStreak/even` | 各3-5 | 各+3本 |
| `KURODA_MATCHUP_FLAVOR.style/age/h2h` | 各4-5 | 各+3本 |
| `KURODA_SPOTLIGHT` (star/growth/youngThreat) | 各3-5 | 各+3本 |
| `FAN_OPINIONS` (各tier × 各type) | 各3-5 | 各+2本 |

文面はモックアップ v8 のパターン①②③ を参考に、黒田の「冷徹で含蓄ある語り口」を維持。

---

## Step 4: 因縁列伝(3面)新規実装 [核心作業]

### 4-1. データ層: H2H.history[] の追加

#### `src/relationships.js` の `Engine.h2h.update` 拡張

**現状(L2200付近):**
```js
update(h2h, leftId, rightId, winner, mq, isTitleMatch, isPPV, season, week) {
  const a = Math.min(leftId, rightId), b = Math.max(leftId, rightId);
  const key = `${a}>${b}`;
  const newH2h = { ...(h2h || {}) };
  const entry = { ...(newH2h[key] || { matches: 0, winsA: 0, winsB: 0, draws: 0, bestMQ: 0, hadTitleMatch: false, hadPPV: false }) };
  entry.matches += 1;
  // ...
  return newH2h;
}
```

**修正後:** `stage` パラメータを追加(末尾)、`history` 配列を追加。

```js
update(h2h, leftId, rightId, winner, mq, isTitleMatch, isPPV, season, week, stage = 'show') {
  const a = Math.min(leftId, rightId), b = Math.max(leftId, rightId);
  const key = `${a}>${b}`;
  const newH2h = { ...(h2h || {}) };
  const entry = { ...(newH2h[key] || {
    matches: 0, winsA: 0, winsB: 0, draws: 0,
    bestMQ: 0, hadTitleMatch: false, hadPPV: false,
    history: []
  }) };
  entry.matches += 1;
  if (winner === 'draw') entry.draws += 1;
  else {
    const winnerId = winner === 'left' ? leftId : rightId;
    if (winnerId === a) entry.winsA += 1;
    else entry.winsB += 1;
  }
  entry.bestMQ = Math.max(entry.bestMQ, mq || 0);
  entry.lastMatch = { season, week };
  if (isTitleMatch) entry.hadTitleMatch = true;
  if (isPPV) entry.hadPPV = true;

  // ★ history 追加(最大50件、超過は古いものから削除)
  const historyEntry = {
    s: season,
    w: week,
    st: stage,                                       // 'show' | 'war' | 'ppv'
    win: winner === 'draw' ? 'd' : (winner === 'left' ? (leftId === a ? 'A' : 'B') : (rightId === a ? 'A' : 'B')),
    mq: mq || 0,
  };
  if (isTitleMatch) historyEntry.t = 1;
  if (isPPV) historyEntry.p = 1;

  const newHistory = [...(entry.history || []), historyEntry];
  if (newHistory.length > 50) newHistory.shift();
  entry.history = newHistory;

  newH2h[key] = entry;
  return newH2h;
}
```

#### 既存の呼び出し7箇所に `stage` 引数を追加

| ファイル | 行 | 呼び出しコンテキスト | 渡す stage 値 |
|---|---|---|---|
| `src/app.js` | 5591 | プレイヤー興行のタッグ | `'show'` |
| `src/app.js` | 5595 | プレイヤー興行のシングル | `'show'` |
| `src/app.js` | 8761 | 対抗戦 | `'war'` |
| `src/app.js` | 9162 | PPV | `'ppv'` |
| `src/management.js` | 7746 | AI団体内興行 | `'show'` |
| `src/management.js` | 8785 | プレイヤー興行(auto-sim タッグ) | `'show'` |
| `src/management.js` | 8788 | プレイヤー興行(auto-sim シングル) | `'show'` |

`stage` を最後の引数として追加するだけ。

#### AI同士の対抗戦(対抗戦時にAI団体側で記録される処理)の確認

現状コードでは AI団体間の対抗戦が `Engine.h2h.update` を通っているか要確認。通っていなければ、対抗戦処理に AI vs AI の H2H 記録を追加する必要がある(Q3で「AI同士も記録する」決定)。

`src/management.js` の AI団体間対抗戦処理(`_simAiVsAiWar` のような関数)を grep で探し、なければ既存の AI団体ターン処理に AI vs AI の H2H 記録ロジックを追加。

```js
// 例: AI vs AI対抗戦の結果処理直後に追加
results.forEach(r => {
  s = { ...s, h2h: Engine.h2h.update(s.h2h, r.left.id, r.right.id, r.winner, r.mq, false, false, s.season, s.week, 'war') };
});
```

### 4-2. SAVE_TRIM の追加

`src/app.js` L1467 の `SAVE_TRIM` 定数に追加:

```js
const SAVE_TRIM = {
  gameLogMax: 200,
  growthLogMax: 100,
  financeKeepSeasons: 2,
  matchupLogMax: 60,
  aiMatchupLogMax: 40,
  h2hHistoryMax: 50,  // ★ 追加: H2H.history[] 配列の上限(ペア毎)
};
```

`Storage.serialize` (L1476付近) に H2H トリミング処理を追加:

```js
// h2h.history トリミング(各ペアごとに最新N件)
if (state.h2h) {
  for (const key in state.h2h) {
    const entry = state.h2h[key];
    if (entry.history && entry.history.length > SAVE_TRIM.h2hHistoryMax) {
      entry.history = entry.history.slice(-SAVE_TRIM.h2hHistoryMax);
    }
  }
}
```

### 4-3. UI層: 因縁列伝サブタブの追加

#### `_dbSubTab` の拡張

`src/ui-render.js` L5255 を更新:
```js
let _dbSubTab = 0; // 0=全選手 1=全コーチ 4=相関図 7=派閥 2=団体比較 5=新聞 8=因縁列伝 3=殿堂 6=年代記
```

`subTabs` 配列に追加:
```js
const subTabs = [
  { idx: 0, label: '👥 全選手' },
  { idx: 1, label: '👔 全コーチ' },
  { idx: 4, label: '🕸 相関図' },
  ...(hasFactions ? [{ idx: 7, label: '🎭 派閥' }] : []),
  { idx: 2, label: '⚔ 団体比較' },
  { idx: 5, label: '📰 新聞' },
  { idx: 8, label: '🔥 因縁列伝' },  // ★ 追加
  { idx: 3, label: '🏆 殿堂' },
  { idx: 6, label: '📜 年代記' },
];
```

ルーティング(L5344付近)に追加:
```js
else if (_dbSubTab === 8) html += _renderDbRivalry();
```

#### `_renderDbRivalry` 関数の新規実装

新関数を `_renderDbOrgCompare` の後あたり(L8055付近)に追加。実装手順:

**Step 4-3-a. 関係性分類関数**

```js
/**
 * bond × rivalry の 9象限分類
 * 淡白なペア(rivalry < 40)は null を返す → 紙面非表示
 */
function _classifyRelation(bond, rivalry) {
  if (rivalry < 40) return null;

  if (rivalry >= 80) {
    if (bond >= 70) return 'fated_admiration';   // 宿命の好敵手
    if (bond <= 30) return 'pure_hatred';         // 憎悪の宿敵
    return 'destined_rival';                       // 宿命のライバル
  }
  if (rivalry >= 60) {
    if (bond >= 70) return 'allied_rivalry';      // 盟友のライバル
    if (bond <= 30) return 'bitter_feud';         // 不仲の因縁
    return 'standard_rivalry';                     // 普通のライバル
  }
  // rivalry 40-59
  if (bond >= 70) return 'mutual_respect';        // 互いを認める
  if (bond <= 30) return 'cold_rivalry';           // 反目しあう
  return 'casual_rivalry';                         // 軽いライバル視
}
```

**Step 4-3-b. featured ピックアップロジック**

```js
function _pickRivalryFeatured(state) {
  const all = [];
  Object.entries(state.h2h || {}).forEach(([key, h2h]) => {
    const [a, b] = key.split('>').map(Number);

    // 両選手の存在確認(引退済みでも記録は残るので、ALL_CHARS全体から探す)
    const charA = ALL_CHARS.find(c => c.id === a);
    const charB = ALL_CHARS.find(c => c.id === b);
    if (!charA || !charB) return;

    // bond/rivalry の双方向平均を取得
    const relAB = state.relationships?.[`${a}>${b}`] || { bond: 50, rivalry: 0 };
    const relBA = state.relationships?.[`${b}>${a}`] || { bond: 50, rivalry: 0 };
    const bond = (relAB.bond + relBA.bond) / 2;
    const rivalry = (relAB.rivalry + relBA.rivalry) / 2;

    const tag = _classifyRelation(bond, rivalry);
    if (!tag) return;  // 淡白排除

    // 基本スコア
    let score = rivalry * 0.4 + h2h.matches * 0.2 + h2h.bestMQ * 0.2;
    // 極端なbond値(愛憎の振れ幅)を加点
    score += Math.abs(bond - 50) * 0.3;
    // プレイヤー絡み加点
    const isPlayerInvolved = _isPlayerSide(state, a) || _isPlayerSide(state, b);
    if (isPlayerInvolved) score += 15;
    // 濃い象限加点
    const dramaTagBonus = {
      pure_hatred: 20,
      fated_admiration: 18,
      bitter_feud: 12,
      allied_rivalry: 10,
      destined_rival: 8,
    };
    score += dramaTagBonus[tag] || 0;

    all.push({ key, h2h, tag, bond, rivalry, charA, charB, score, isPlayerInvolved });
  });

  all.sort((x, y) => y.score - x.score);

  return {
    featured: all[0] || null,
    relations: all.slice(1, 7),  // 関係マップは6枠
  };
}

function _isPlayerSide(state, charId) {
  return state.roster.some(c => c.id === charId);
}
```

**Step 4-3-c. メイン紙面の組み立て**

`_renderDbRivalry` の本体は v8 モックアップの構造をそのまま JS で組み立てる。テンプレート文字列で記述し、`featured` と `relations` のデータを差し込む。

```js
function _renderDbRivalry() {
  const { featured, relations } = _pickRivalryFeatured(G);

  let html = `<div class="db-cmp-newspaper-header">
    <h1>週刊グラップル ── 因縁列伝</h1>
    <span>${G.season}シーズン 第${G.week}週</span>
  </div>
  <div class="db-cmp-wrap">`;

  if (!featured) {
    html += `<div class="db-cmp-rivalry-empty">
      <p>記事にする価値のある因縁が、まだ業界には育っていない。記者として、もう少し時間が要ると見ている。</p>
    </div></div>`;
    return html;
  }

  // ─── メイン因縁(featured) ───
  html += _renderRivalryFeatured(featured);

  // ─── 対戦の軌跡(history[]駆動) ───
  html += _renderRivalryHistory(featured);

  // ─── 他にも続く因縁(関係マップ) ───
  html += _renderRivalryRelations(relations);

  html += '</div>'; // close .db-cmp-wrap
  return html;
}
```

**Step 4-3-d. 各サブ関数の実装**

`_renderRivalryFeatured(featured)`, `_renderRivalryHistory(featured)`, `_renderRivalryRelations(relations)` をそれぞれ実装。各関数の HTML 構造は v8 モックアップを参照。

ポイント:
- 見出し・本文は **`KURODA_RELATION_NARRATIVE[tag]` 配列** から `pickText()` で選ぶ
- 数値は叙述変換: 「3年の付き合い」(初対戦 history[0].s から計算)、「最高評価89点を残した夜」(bestMQ)など
- `history[]` は最新10件を時系列で表示(全50件のうち)
- スタンド画像の向き処理は **左側のみ flip**(右側はそのまま)

### 4-4. フレーバー層: KURODA_RELATION_NARRATIVE の新規実装

> **文体ガイド: このドキュメント上部の「黒田幸子の文体設計」セクションを必ず参照してから書くこと。**
> 因縁列伝は **取材モード(深め)** — 感傷的・含蓄ある語り口。ただし冷静さは保つ(感情を爆発させない)。
> お決まりフレーズ(「本紙は」「〜と書いておく」「3年の付き合い」「数字は嘘をつかない」など)を散りばめて、団体比較画面の論評モードと「同じ人物が違う温度で書いている」と感じさせる。

`src/kuroda-text.js` の末尾あたりに追加:

```js
//  10. 因縁列伝の関係性叙述（KURODA_RELATION_NARRATIVE）
//
//  3面の関係カードと featured で使用。
//  9象限の内部タグごとに見出し+本文プールを持ち、紙面では言葉のみで関係性を伝える。
//
const KURODA_RELATION_NARRATIVE = {
  // ─── 厚めに(主要4象限) ───
  fated_admiration: {  // 宿命の好敵手 (bond高×rivalry特高)
    headlines: [
      d => `認め合うがゆえに、退けない`,
      d => `友情と勝負——両立しないはずの二つを、両立させた`,
      d => `互いの背中を押し続ける、稀有な関係`,
      d => `${d.years}年の付き合い、それでも飽きが来ない理由`,
      d => `リング上では敵、リング外では戦友`,
      // 5本以上
    ],
    bodies: [
      d => `試合後の握手は本物だ。だがリング上では一切の手加減もない。${d.matches}度の対戦、最高評価は${d.bestMQ}点——この数字こそ、二人の関係の質を物語っている。`,
      d => `${d.years}年の付き合い、${d.matches}度の対戦。それでも飽きが来ないのは、両者が互いを真の好敵手と認めているからだろう。`,
      d => `「あいつとの試合は、観客のためじゃなくて、自分たちのためにやってる」——どちらかがいつかそう漏らしていた。本当のところ、それが真実なのだろう。`,
      // 5本以上
    ],
  },

  pure_hatred: {  // 憎悪の宿敵 (bond低×rivalry特高)
    headlines: [
      d => `顔も見たくない、それでも組まれてしまう`,
      d => `楽屋ですれ違っても、目を合わせない`,
      d => `憎しみだけが原動力——それでも観客は望む`,
      d => `次の対戦が、もう怖い`,
      d => `${d.matches}度の激突、いまだに笑顔の握手は一度もない`,
    ],
    bodies: [
      d => `通算${d.matches}度の対戦、いまだに笑顔の握手は一度もない。${d.bestMQ}点の最高評価が示す通り、リング上の温度は本物だ。問題は、その温度の出どころが「闘志」ではなく「憎悪」だということである。`,
      d => `互いに敵意を隠さない関係。リング上だけでなく、楽屋裏でも目を合わせない。それでも観客はこのカードを望み続け、興行のたびに同じリングに上げられる——憎しみだけが原動力の試合は、皮肉にもこの業界で最も売れる商品の一つだ。`,
      // 5本以上
    ],
  },

  bitter_feud: {  // 不仲の因縁 (bond低×rivalry高)
    headlines: [
      d => `水と油、リングでも楽屋でも`,
      d => `${d.matches}度の対戦、一度の握手もない`,
      d => `相容れない二人、それでも同じリングへ`,
      // 5本
    ],
    bodies: [
      d => `${d.matches}度の対戦、いずれも遺恨を残した。試合後の挨拶もない、業界が認める「対立関係」の典型例。`,
      // 5本
    ],
  },

  allied_rivalry: {  // 盟友のライバル (bond高×rivalry高)
    headlines: [
      d => `友情と闘志、矛盾しない関係`,
      d => `リングで殴り合い、控室で笑い合う`,
      d => `互いを必要としているライバル`,
      // 5本
    ],
    bodies: [
      d => `${d.matches}度の対戦は引き分け含み。両者がともに「次もやりたい」と表明している、業界では珍しい関係。`,
      // 5本
    ],
  },

  // ─── 薄めに(残り5象限) ───
  destined_rival: {  // 宿命のライバル (bond中×rivalry特高)
    headlines: [
      d => `避けられない一夜が、いずれ来る`,
      d => `業界が待つ、二人の対峙`,
    ],
    bodies: [
      d => `${d.matches > 0 ? `${d.matches}度の対戦` : '未対戦'}、それでも互いの存在は確かに意識し合っている。`,
    ],
  },
  standard_rivalry: {  // 普通のライバル (bond中×rivalry高)
    headlines: [
      d => `拮抗する数字、燃える夜`,
      d => `業界の中堅戦線、目が離せない`,
    ],
    bodies: [
      d => `${d.matches}度の対戦で${d.bestMQ}点を記録。次戦も注目に値する。`,
    ],
  },
  mutual_respect: {  // 互いを認める (bond高×rivalry中)
    headlines: [d => `静かな信頼、淡い競争`],
    bodies: [d => `穏やかな関係。リングで会っても、過度な熱は持ち込まない。`],
  },
  cold_rivalry: {  // 反目しあう (bond低×rivalry中)
    headlines: [d => `熱くはないが、冷たい二人`],
    bodies: [d => `淡々と試合をして、淡々と別れる。それでいて、目は合わない。`],
  },
  casual_rivalry: {  // 軽いライバル視 (bond中×rivalry中)
    headlines: [d => `業界の通常運転`],
    bodies: [d => `特筆すべきこともなく、しかし完全な無関心でもない。`],
  },
};
```

**叙述データの作成:**

`pickText()` に渡すデータオブジェクト `d` には以下を含める:
```js
const narrativeData = {
  charA: charA.name,
  charB: charB.name,
  matches: h2h.matches,
  bestMQ: h2h.bestMQ,
  years: Math.max(1, Math.floor((G.season - h2h.history[0].s) + (G.week - h2h.history[0].w) / 52)),
  hadTitleMatch: h2h.hadTitleMatch,
  hadPPV: h2h.hadPPV,
  // ... 他の必要なフィールド
};
```

### 4-5. CSS の追加

`src/index.html` に v8 モックアップから抽出した CSS を追加:

```css
/* 因縁列伝(3面)用 */
.db-cmp-rivalry-featured-headline { /* ... */ }
.db-cmp-rivalry-featured-body { /* ... */ }
.db-cmp-relation-card { /* ... */ }
.db-cmp-relation-card[data-tag="fated_admiration"] { border-left-color: #d4a82a; }
.db-cmp-relation-card[data-tag="pure_hatred"] { border-left-color: #6a0a0a; }
/* ... 他の象限の色分け */
```

クラス名は `.db-cmp-` プレフィックスで統一(既存規約に倣う)。

---

## Step 5: 検証

### 5-1. auto-sim での H2H.history[] 蓄積確認

```bash
# auto-sim を 30シーズン回す
# (リポジトリの auto-sim スクリプトの仕組みに従う)
```

確認項目:
- [ ] H2H エントリが正しく蓄積される
- [ ] history[] が 50件超えると古いものが削除される
- [ ] AI団体間対抗戦が H2H に記録されている
- [ ] セーブ→ロード往復で history[] が消えない
- [ ] セーブサイズが許容範囲(目安: シーズン30で +200KB 程度の増加)

### 5-2. 3面の表示確認

- [ ] 因縁列伝サブタブが表示される(派閥タブの右、団体比較の右)
- [ ] featured が選ばれる(プレイヤー絡みのペアが優先)
- [ ] 各象限のカードで内部タグに応じた色分けが見える
- [ ] 淡白ペア(rivalry < 40)が紙面に出ない
- [ ] AI同士の関係カードが含まれる(濃いペアがあれば)

### 5-3. 既存機能の非破壊性

- [ ] 既存セーブのロード時にエラーなし(history が無いペアは空配列で初期化される)
- [ ] H2H.update の既存呼び出し7箇所が全て stage 引数を渡す形に修正済み
- [ ] 派閥タブの位置移動と非表示制御が他のタブに影響しない
- [ ] MQ会場補正が既存の calcShowRating(★評価)に影響しない

### 5-4. 全画面リグレッション

- [ ] 全ての画面遷移(団体比較、新聞、派閥、因縁列伝)で表示崩れなし
- [ ] スタンド画像の向きが正しい(左 flip / 右 そのまま)
- [ ] モバイル幅(< 820px)でも紙面が破綻しない

---

## 実装しないこと(明示的なスコープ外)

- 試合内容(分秒、決まり手、観客反応)の表示・記録(データに無い)
- 過去の発言・インタビューの記録(同上)
- 因縁メーター(0-100の数値ゲージ表示)— 廃止決定
- 「rivalry: 87」のような数値ラベル表示 — 廃止決定
- 9象限ラベル名(「宿命の好敵手」等)を紙面に直接表示 — 内部タグのみ

---

## 確認決定事項(これまでの議論より)

| 項目 | 決定内容 |
|---|---|
| Q1 history保持件数 | **50件**(ペア毎) |
| Q2 stage種別 | **`show / war / ppv`** + `t:1`(タイトル戦独立フラグ)+ `p:1`(PPV独立フラグ) |
| Q3 AI同士の記録 | **記録する**(世界が動いている実感) |
| Q4 既存セーブのマイグレ | **何もしない**(新規記録から) |
| 9象限ラベル | **内部タグのみ**(紙面表示しない) |
| 数値メーター | **廃止**(関係性は言葉で伝える) |
| 淡白ペア(rivalry<40) | **紙面非表示** |
| featured 選定 | **A+C ハイブリッド**(基本スコア + 濃い象限への加点) |
| フレーバープール | **主要4象限を厚く**(各5本以上)、**残り5象限は薄く**(各1-2本) |
| 黒田の文体方針 | **モード制(案B)** — 同一人物だが画面ごとに温度が変わる。共通項(お決まりフレーズ)で連続性を担保。詳細は「黒田幸子の文体設計」セクション参照 |

---

## 推奨実装順

1. **Step 1**(派閥タブ)— 独立・小規模、最初のウォームアップ
2. **Step 2**(MQ会場補正)— 独立・中規模、数値テーブルはユーザー確認推奨
3. **Step 4-1, 4-2**(データ層: H2H拡張 + SAVE_TRIM)— UI実装の前提
4. **Step 3**(新聞・団体比較780px統一)— UI改修の主軸
5. **Step 4-4**(KURODA_RELATION_NARRATIVE)— フレーバー層、UI実装と並行可能
6. **Step 4-3**(_renderDbRivalry 関数)— UI層の新規実装
7. **Step 4-5**(CSS追加)— UI仕上げ
8. **Step 5**(検証)— 全体テスト

各ステップの後で auto-sim を回して動作確認、コミット。最終的に1つのfeature branchで PR を出す。
