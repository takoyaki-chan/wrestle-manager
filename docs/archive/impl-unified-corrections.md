# 統合修正指示: 新聞v2 + 文体変更 + UI修正

## 概要

以下の変更を一括で実施する:

1. **黒田の上半身画像を全削除** → 顔アイコン（24-36px）のみに統一
2. **団体比較のデフォルト比較対象** → ランキングでプレイヤーのすぐ上の団体
3. **黒田の文体変更** → セリフ調（〜ですね）→ 記事調（〜だ/〜である）
4. **新聞システムv2** → 毎週発行、他団体ニュース、一面は最大ニュースが取る

---

## 1. 上半身画像の削除

### 対象
- `_renderDbOrgCompare()` 内の COLUMN セクションで `upper_kuroda_s.webp` を使っている箇所
- `.db-cmp-kuroda-upper` CSS
- `getNpcUpperUrl()` 関数（残してもいいが、UI上では使わない）

### 修正
全て `getNpcPortraitUrl('reporter')` の顔アイコン（24-36px丸）に置き換え。
コラムセクションのレイアウトも上半身画像ありきの横並びから、顔アイコン小 + テキストの構成に変更。

```html
<!-- BEFORE -->
<img src="upper_kuroda_s.webp" class="db-cmp-kuroda-upper">

<!-- AFTER -->
<img src="face_kuroda_s.png" style="width:28px;height:28px;border-radius:50%;object-fit:cover">
```

---

## 2. デフォルト比較対象の変更

### 現状
`_dbCompareTarget` の初期値が `RIVAL_ORGS[0].id`（= org_s、Tier S）固定。

### 修正
ランキングでプレイヤーのすぐ上の団体をデフォルトにする。

```javascript
// _renderDbOrgCompare() の冒頭、または renderDatabase() 内
function getDefaultCompareTarget(state) {
  const rankings = state.rankings || [];
  const playerRank = Engine.ranking.getPlayerRank(rankings);
  // プレイヤーの1つ上のランクの団体を探す
  const above = rankings.find(r => r.rank === playerRank - 1 && r.orgId !== 'player');
  if (above) return above.orgId;
  // 1位なら1つ下を見る
  const below = rankings.find(r => r.rank === playerRank + 1 && r.orgId !== 'player');
  if (below) return below.orgId;
  // フォールバック: 最初のAI団体
  return RIVAL_ORGS[0].id;
}

// 初期値設定（_dbCompareTarget が未設定のとき）
if (!_dbCompareTarget) _dbCompareTarget = getDefaultCompareTarget(G);
```

---

## 3. 黒田の文体変更（セリフ調 → 記事調）

### ルール

**全ての黒田テキストに適用する変換ルール：**

| セリフ調（現行） | 記事調（変更後） |
|----------------|----------------|
| 〜ですね | 〜だ / 〜である |
| 〜ですよ | 〜だろう / 〜と言える |
| 〜ですけど | 〜だが / 〜ではあるが |
| 〜ませんけど | 〜ないが |
| 〜ですから | 〜だからだ / 〜である以上 |
| 〜してください | 〜すべきだ / 〜が急務だ |
| 〜でしょうね | 〜だろう |
| 〜じゃないですか | 〜ではないか |
| 〜ませんよ | 〜ない |
| 〜ますけど | 〜るが |

**ただし完全に三人称の硬い記事調にはしない。** 黒田の「感じの悪さ」を残すために：
- 一人称（筆者）は稀に使う: 「筆者としては〜と見ている」「率直に言えば〜」
- 皮肉・反語は残す: 「〜と言えば聞こえはいいが」「〜のは自由だが」
- 読者への問いかけ風は残す: 「果たして〜だろうか」「問いたいのは〜だ」
- 「——」（ダッシュ）で切る鋭い表現は残す

**変換例:**

BEFORE（セリフ調）:
> 「比較記事を書くにも最低限のラインがあるんですけど、今回はそれを下回ってますね」

AFTER（記事調）:
> 「比較記事として成立する最低限のラインがある。今回はそれを下回っている」

BEFORE:
> 「ファンの皆さんには悪いですけど、今のこの団体に夢を見るのは時期尚早です」

AFTER:
> 「ファンには申し訳ないが、この団体に夢を見るのは時期尚早と言わざるを得ない」

BEFORE:
> 「悪くないですね。まあ、このくらいで満足されても困りますけど」

AFTER:
> 「悪くない。だが、このくらいで満足されても困る」

BEFORE（圧倒時）:
> 「……正直、ここまでやるとは思っていませんでした。少しだけ、見る目がなかったことを認めます」

AFTER:
> 「……正直、ここまでやるとは思っていなかった。筆者の見る目がなかったことを、少しだけ認めざるを得ない」

### 対象ファイル
`src/kuroda-text.js` 内の全テキスト定数:
- KURODA_HEADLINES（全段階）
- KURODA_EDITORIAL（全段階）
- KURODA_WAR_RECORD（全区分）
- KURODA_MATCHUP_FLAVOR（style/age/h2h/momentum全カテゴリ。ただしこれはマッチアップ解説なので黒田署名ではない場合、既存の「だ/である」調ならそのままでOK）
- KURODA_SHOW_RATING（全星）
- KURODA_SPOTLIGHT（全カテゴリ）
- KURODA_PREVIEW（全カテゴリ）
- KURODA_SEASON_REVIEW / KURODA_HALL_OF_FAME / KURODA_RETIREMENT / KURODA_PPV_REVIEW / KURODA_NEWS_COMMENT

**ファン世論（FAN_OPINIONS）は変更しない。** ファンはSNS口調なのでそのまま。
**NEWSPAPER_DIGEST_COMMENTS も変更しない。** これは黒田署名ではなく一般的な試合寸評なので既に記事調。

### 変換方法
Claude Codeが上記ルールに従って一括変換する。
機械的な置換ではなく、各テキストの意味と文脈を保ったまま記事調に書き換えること。
「感じの悪さ」「皮肉」「辛辣さ」のトーンは維持すること。

---

## 4. 新聞システム v2

### 設計思想

**毎週、業界全体のニュースを集めて新聞を生成する。**
自分の興行結果はその中の一記事に過ぎない。
一面は「その週で最も大きなニュース」が取る。

### 4-1. データ構造

```javascript
// state.weeklyNewspaper — 毎週生成される新聞データ
{
  season: 4, week: 18,

  // 一面記事（1件）
  topStory: {
    type: 'playerShow' | 'aiChampionChange' | 'aiRetirement' | 'crossWar' | 'ppvResult' | 'aiShow' | ...,
    priority: 100,  // 高いほど一面に来る
    headline: '...',
    body: '...',
    // 対戦カード情報（該当する場合）
    matchData: { left, right, winner, mq, turns, finishLabel, ... } | null,
    characterId: null,  // 顔表示用
  },

  // サブ記事（0-3件）
  subStories: [ { type, headline, body, characterId }, ... ],

  // 自団体興行データ（興行週のみ、null の週もある）
  playerShowData: {
    // 既存の currentNewspaper 相当のデータ
    ...existingNewspaperFields,
    allMatches: [...],
    showRating: { stars, expected, actual, diff },
  } | null,

  // 次回展望（毎週）
  preview: { fanExpect, rivalry, title },
}
```

### 4-2. 一面の優先度

```javascript
const NEWS_PRIORITY = {
  ppvSummitResult:     200,  // PPVサミットマッチ結果
  playerTitleChange:   180,  // 自団体の王座移動
  aiAceRetirement:     160,  // 他団体のエース級引退（OVR 75+）
  crossWarResult:      140,  // 対抗戦結果（プレイヤー参加）
  aiChampionChange:    130,  // 他団体の王者交代
  playerShowTitle:     120,  // 自団体興行（タイトル戦あり）
  aiCrossWar:          110,  // AI同士の対抗戦
  aiRetirement:        100,  // 他団体の引退（一般）
  playerShowNormal:     90,  // 自団体興行（通常）
  aiShowHighlight:      80,  // 他団体興行ハイライト
  aiBreakthrough:       60,  // 他団体のブレイクスルー選手
  transfer:             50,  // FA移籍
  general:              30,  // 一般フレーバー
};
```

一面は最も priority が高い記事。同率なら seed で決定。

### 4-3. 新聞生成タイミング

**毎週の tickWeek 終了時**に `state.weeklyNewspaper` を生成する。

```javascript
// tickWeek の末尾（既存の sanitizeFloats の前あたり）に追加
state = { ...state, weeklyNewspaper: Engine.newspaper.generate(state, rng) };
```

### 4-4. Engine.newspaper オブジェクト

```javascript
Engine.newspaper = {
  generate(state, rng) {
    const stories = [];

    // === 自団体の興行結果（興行週のみ）===
    if (state.currentNewspaper) {
      const isTitleShow = state.currentNewspaper.isTitleMatch;
      stories.push({
        type: isTitleShow ? 'playerShowTitle' : 'playerShowNormal',
        priority: NEWS_PRIORITY[isTitleShow ? 'playerShowTitle' : 'playerShowNormal'],
        headline: state.currentNewspaper.headline,
        body: state.currentNewspaper.article,
        matchData: state.currentNewspaper,
        characterId: state.currentNewspaper.winner?.id || state.currentNewspaper.left?.id,
      });
    }

    // === AI団体のイベント（tickWeek中に蓄積されたもの）===
    // AI王者交代
    (state._aiChampionChanges || []).forEach(ev => {
      const isAce = ev.ovr >= 75;
      stories.push({
        type: 'aiChampionChange',
        priority: NEWS_PRIORITY.aiChampionChange + (isAce ? 20 : 0),
        headline: `${ev.orgName}——新王者${ev.newChampName}が誕生`,
        body: `${ev.orgName}の王座が動いた。${ev.newChampName}（OVR ${ev.ovr}）が${ev.prevChampName || '前王者'}を下し、新たな頂点に立った。`,
        characterId: ev.newChampId,
      });
    });

    // AI引退
    (state._aiRetirements || []).forEach(ev => {
      const isAce = ev.ovr >= 70;
      stories.push({
        type: isAce ? 'aiAceRetirement' : 'aiRetirement',
        priority: NEWS_PRIORITY[isAce ? 'aiAceRetirement' : 'aiRetirement'],
        headline: `${ev.orgName}の${ev.name}が現役引退を表明`,
        body: `${ev.orgName}で${ev.seasons || '複数'}シーズンを戦った${ev.name}（${ev.age}歳）が引退を発表。${isAce ? '看板選手の退団は団体にとって大きな痛手だ。' : '長い現役生活に幕を下ろした。'}`,
        characterId: ev.id,
      });
    });

    // AI対抗戦（AI同士）
    (state._aiCrossWars || []).forEach(ev => {
      stories.push({
        type: 'aiCrossWar',
        priority: NEWS_PRIORITY.aiCrossWar,
        headline: `${ev.org1Name} vs ${ev.org2Name}——対抗戦は${ev.org1Wins > ev.org2Wins ? ev.org1Name : ev.org2Name}に軍配`,
        body: `${ev.org1Name}と${ev.org2Name}の対抗戦が行われ、${ev.org1Wins}勝${ev.org2Wins}敗で${ev.org1Wins > ev.org2Wins ? ev.org1Name + 'が勝ち越した' : ev.org1Wins < ev.org2Wins ? ev.org2Name + 'が勝ち越した' : '引き分けに終わった'}。`,
      });
    });

    // AI団体の興行ハイライト（高MQの試合があった場合）
    (state._aiShowHighlights || []).forEach(ev => {
      stories.push({
        type: 'aiShowHighlight',
        priority: NEWS_PRIORITY.aiShowHighlight,
        headline: `${ev.orgName}定期興行——${ev.winnerName}が${ev.loserName}を下す`,
        body: `${ev.orgName}の興行で${ev.winnerName}が${ev.loserName}に勝利。MQ ${ev.mq}を記録した。`,
        characterId: ev.winnerId,
      });
    });

    // AIブレイクスルー
    (state._aiBreakthroughs || []).forEach(ev => {
      stories.push({
        type: 'aiBreakthrough',
        priority: NEWS_PRIORITY.aiBreakthrough,
        headline: `${ev.orgName}の${ev.name}が急成長——注目の存在に`,
        body: `${ev.orgName}所属の${ev.name}がブレイクスルーを達成。${ev.stat}が大幅に向上し、今後の活躍が期待される。`,
        characterId: ev.id,
      });
    });

    // priority でソート
    stories.sort((a, b) => b.priority - a.priority);

    // 一面 + サブ記事（最大3件）
    const topStory = stories[0] || null;
    const subStories = stories.slice(1, 4);

    // 次回展望（既存の buildPreviewData を流用）
    const preview = this.buildPreview(state);

    return {
      season: state.season, week: state.week,
      topStory, subStories,
      playerShowData: state.currentNewspaper || null,
      preview,
    };
  },

  buildPreview(state) { /* 既存の buildPreviewData と同等 */ },
};
```

### 4-5. AI イベントの蓄積

tickWeek 内の AI 処理で、以下のイベントを `state._ai***` に一時蓄積する。
新聞生成後にクリアする。

**追加が必要なフック:**

| イベント | 蓄積先 | 追加箇所 |
|---------|-------|---------|
| AI王者交代 | `state._aiChampionChanges` | engine.js AI 興行処理でタイトル変更時（L3565付近） |
| AI引退 | `state._aiRetirements` | engine.js AI シーズン末引退処理（L3677付近） |
| AI同士の対抗戦 | `state._aiCrossWars` | engine.js AI イベント処理（存在するなら） |
| AI興行ハイライト | `state._aiShowHighlights` | engine.js AI 興行処理でMQ 75+の試合があった場合 |
| AIブレイクスルー | `state._aiBreakthroughs` | engine.js AI ブレイクスルー処理 |

**蓄積形式の例（AI王者交代）:**
```javascript
// engine.js AI興行処理内、タイトルが移動した箇所に追加
const changes = [...(s._aiChampionChanges || [])];
changes.push({
  orgId, orgName: org.name,
  newChampId: winnerId, newChampName: winnerFighter.name,
  prevChampName: prevChamp?.name || null,
  ovr: Engine.util.ov(winnerFighter),
});
s = { ...s, _aiChampionChanges: changes };
```

**クリア:**
```javascript
// Engine.newspaper.generate() の最後、または tickWeek の末尾で
state = { ...state,
  _aiChampionChanges: undefined,
  _aiRetirements: undefined,
  _aiCrossWars: undefined,
  _aiShowHighlights: undefined,
  _aiBreakthroughs: undefined,
};
```

### 4-6. UI表示（_renderDbNewspaper の変更）

**新聞タブの表示ロジックを weeklyNewspaper ベースに変更:**

```
┌──────────────────────────────────────┐
│ [新聞ヘッダー]                        │
│ WEEKLY GRAPPLE / S4 W18              │
├──────────────────────────────────────┤
│ 【一面】（topStory）                  │
│ 見出し + 本文 + 顔画像               │
│ ※自団体の試合結果とは限らない        │
├──────────────────────────────────────┤
│ 【自団体の興行結果】                  │
│ ※playerShowData がある場合のみ表示   │
│ 既存のメインイベント記事              │
│ ★興行評価                            │
│ 全試合ダイジェスト                    │
├──────────────────────────────────────┤
│ 【他団体動向】（subStories）          │
│ 2-3件の短い記事                       │
├──────────────────────────────────────┤
│ 【次回展望】                          │
└──────────────────────────────────────┘
```

**自団体の興行がない週:**
一面は他団体のニュースが来る。自団体興行セクションは非表示。
他団体ニュース + 次回展望だけの「薄い新聞」でもOK。

**自団体の興行がある週かつ一面が他団体:**
自団体の結果は「自団体興行結果」セクションに表示される（二面扱い）。

### 4-7. 新聞がない週の扱い

ニュースが1件もない週は稀だが、あり得る。
その場合は `weeklyNewspaper = null` で「今週の新聞はありません」表示（既存と同じ）。

---

## 5. 既存の currentNewspaper との関係

`currentNewspaper`（興行後に生成）は **weeklyNewspaper.playerShowData** として統合される。
独立した `G.currentNewspaper` は残すが、新聞タブの描画は `G.weeklyNewspaper` を見る。

既存セーブで `weeklyNewspaper` がない場合:
- `currentNewspaper` があればそれを使って旧形式で表示（フォールバック）
- どちらもなければ「新聞はありません」

---

## 6. 黒田テキストの新聞v2での使い方

### 一面が他団体ニュースのとき
黒田のコメントは**一面記事の末尾に短評として付加**:

```html
<div class="news-kuroda-comment">
  [黒田顔24px] 「○○プロレスの王座交代は業界に波紋を広げるだろう。
  新王者・田中の実力は本物だが、前王者が抜けた穴は小さくない。——黒田幸子」
</div>
```

### 他団体ニュース用の黒田コメント（NEW）
KURODA_NEWS_COMMENT を拡充して使う。
各ニュースタイプ（王者交代、引退、対抗戦、ブレイクスルー）ごとにテンプレ。

---

## 実装順序

1. AI イベント蓄積フック追加（engine.js — 5箇所）
2. Engine.newspaper オブジェクト新設（engine.js）
3. tickWeek に weeklyNewspaper 生成を追加
4. _renderDbNewspaper() を weeklyNewspaper ベースに全面書き換え
5. 黒田テキストの記事調変換（src/kuroda-text.js 全体）
6. 上半身画像の削除 + 顔アイコン統一
7. デフォルト比較対象の変更
8. CSS調整

## 検証

- auto-sim 10seeds×10seasons で weeklyNewspaper がエラーなく生成されること
- 興行がない週でも新聞が生成されること
- 他団体のニュースが一面に来るケースがあること
- AI王者交代、引退が正しく記録・表示されること
- 既存セーブで weeklyNewspaper がなくてもフォールバックで動くこと
- 黒田テキストが記事調に統一されていること（「ですね」「ですよ」が残っていないこと）
