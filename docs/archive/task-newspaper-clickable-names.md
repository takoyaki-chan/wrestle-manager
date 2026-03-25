# タスク依頼書: 新聞記事追加 + キャラクター名クリック対応

## タスク1: 対抗戦・頂上決戦の結果を新聞に掲載

### 背景
- `Engine.newspaper.PRIORITY` に `crossWarResult: 140` と `ppvSummitResult: 200` が定義済みだが、実際にstoryを生成するコードが存在しない
- 対抗戦は tickWeek 内で `return { weekPhase: 'event' }` で早期リターンするため、その週の新聞生成（tickWeek末尾）に到達しない
- 結果データを次週まで持ち越して新聞に載せる設計にする

### やること

#### A. 対抗戦結果の保存（app.js）
`App.finalizeWar()` 内（L6181付近、`Engine.event.applyWarOutcome` 呼び出し後）で、結果データを `G._newsWarResult` に保存する:

```js
G._newsWarResult = {
  opponentName: ev.opponentName,
  opponentOrgId: ev.opponentOrgId,
  playerWins,
  aiWins,
  won: playerWins > aiWins,
  draw: playerWins === aiWins,
  matches: wp.results.map(r => ({
    playerName: r.playerFighter.name,
    playerId: r.playerFighter.id,
    aiName: r.aiFighter.name,
    aiId: r.aiFighter.id,
    playerWon: r.playerWon,
    mq: r.mq,
  })),
};
```

#### B. 頂上決戦結果の保存（app.js）
頂上決戦（summit match）のfinalize処理でも同様に `G._newsSummitResult` を保存する。
summit matchの結果処理箇所を探して同じ構造で保存すること（`Engine.event.applySummitOutcome` 付近）。

#### C. 新聞生成でstory追加（engine.js）
`Engine.newspaper.generate()` 内（L15100付近、`// === 自団体の興行結果` の後あたり）に以下を追加:

```js
// === 対抗戦結果 ===
if (state._newsWarResult) {
  const wr = state._newsWarResult;
  const resultLabel = wr.won ? '勝ち越し' : wr.draw ? '引き分け' : '敗北';
  const bestMatch = wr.matches.reduce((best, m) => m.mq > (best?.mq || 0) ? m : best, null);
  stories.push({
    type: 'crossWarResult',
    priority: P.crossWarResult,
    headline: `⚔ 対抗戦 vs ${wr.opponentName} — ${wr.playerWins}勝${wr.aiWins}敗で${resultLabel}`,
    body: `${wr.opponentName}との対抗戦が行われ、${wr.playerWins}勝${wr.aiWins}敗で${resultLabel}。${bestMatch ? `ベストバウトは${bestMatch.playerName} vs ${bestMatch.aiName}（MQ${bestMatch.mq}）。` : ''}`,
    characterId: bestMatch ? (bestMatch.playerWon ? bestMatch.playerId : bestMatch.aiId) : null,
    warData: wr,  // UI側で個別試合結果を表示するため保持
  });
}

// === 頂上決戦結果 ===
if (state._newsSummitResult) {
  const sr = state._newsSummitResult;
  stories.push({
    type: 'ppvSummitResult',
    priority: P.ppvSummitResult,
    headline: `⚔ 頂上決戦 vs ${sr.opponentName} — ${sr.won ? '勝利！' : '敗北…'}`,
    body: `${sr.playerName} vs ${sr.aiName}の頂上決戦は${sr.won ? sr.playerName : sr.aiName}の勝利に終わった。MQ${sr.mq}。`,
    characterId: sr.won ? sr.playerId : sr.aiId,
  });
}
```

#### D. フラグクリア（engine.js）
`Engine.newspaper.generate()` の末尾 return の前、または tickWeek の新聞生成直後で `_newsWarResult` と `_newsSummitResult` をクリアする。
既存の `clearAINewsFlags()` と同じタイミングで処理するのが自然:

```js
// tickWeek内（L4951付近）
s = { ...s, weeklyNewspaper, _juniorTournamentResult: null, _juniorTournamentPreview: null, _newsWarResult: null, _newsSummitResult: null };
```

### 変更ファイル
- `src/engine.js` — newspaper.generate() にstory追加 + クリア処理
- `src/app.js` — finalizeWar() と summit finalize に結果データ保存

### テスト確認
- 対抗戦を実行 → 次の週に進む → 新聞タブで対抗戦結果記事が表示される
- 頂上決戦を実行 → 同様に新聞に表示される
- 対抗戦も頂上決戦もない週は従来通りの新聞が出る

---

## タスク2: 新聞画面のキャラクター名をクリック可能にする

### 背景
- 新聞内のキャラクター名はすべてテキストとして埋め込まれており、クリックできない
- `showFighterPopup(id)` は source 省略で全所属先を自動検索する（findFighter のauto-detect）
- 新聞はDB画面内なので、ポップアップからの操作（相関図遷移、引き抜き、管理等）はすべて許可してよい

### やること

#### A. ヘルパー関数を追加（ui-render.js 冒頭付近）
```js
function _newsClickableName(name, characterId) {
  if (!characterId) return name;
  return `<span style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px" onclick="event.stopPropagation();showFighterPopup(${characterId})">${name}</span>`;
}
```
- dotted underline で「クリックできる名前」を視覚的に示す
- event.stopPropagation() でカード全体のクリックイベントを阻害しない

#### B. 適用箇所

1. **topStory**（L3087付近）: `ts.headline` と `ts.body` 内の名前
   - story に `characterId` がある → headline/body に含まれるキャラ名を置換
   - ただし headline/body は文字列なので、characterId の名前を _newsClickableName で置換する
   - story構造: `{ type, headline, body, characterId, warData? }` — characterIdは1人分しかない
   - **方針**: topStory, subStories のレンダリング時に characterId がある場合、そのキャラの名前部分だけクリック可能にする
   - 対抗戦記事（warData付き）の場合は warData.matches 内の全選手名もクリック可能に

2. **subStories**（L3113付近）: 同上

3. **playerShowData**（`_renderNewspaperPlayerShow` L3137付近）:
   - `d.left.id`, `d.right.id` で左右選手の名前をクリック可能に
   - `d.winner.id` で勝者名もクリック可能に

4. **次回展望**（`_renderNewspaperPreview`）:
   - ファン期待カード内の選手名
   - 因縁ペアの選手名
   - タイトル情報の王者・挑戦者名

5. **特集ページ（ジュニアトーナメント）**（`_renderNewspaperExtraPage`）:
   - 参加選手名、勝者名、敗者名

#### C. 対抗戦記事の個別試合結果表示
タスク1で追加される `warData` がある topStory の場合、body の下に各試合結果を簡潔に表示する。
_renderDbNewspaper の topStory レンダリング部分に:

```js
if (ts.warData && ts.warData.matches) {
  html += `<div style="margin-top:8px;font-size:12px;line-height:1.8;">`;
  ts.warData.matches.forEach((m, i) => {
    const icon = m.playerWon ? '🔵' : '🔴';
    const pName = _newsClickableName(m.playerName, m.playerId);
    const aName = _newsClickableName(m.aiName, m.aiId);
    html += `<div>${icon} 第${i+1}試合: ${pName} vs ${aName} → ${m.playerWon ? pName : aName} (MQ${m.mq})</div>`;
  });
  html += `</div>`;
}
```

### 変更ファイル
- `src/ui-render.js`

### テスト確認
- 新聞画面でキャラクター名にドット下線が表示される
- 名前をクリックすると showFighterPopup が開く
- ポップアップから相関図、管理タブ等に遷移できる
- 対抗戦記事では各試合の選手名もクリック可能

---

## タスク3: 団体比較画面のキャラクター名をクリック可能にする

### 背景
- 団体比較画面のキャラクター名（王者名、Top 3 Matchups、Scouting Report）はクリックできない
- DB画面内なのでポップアップからの全操作を許可

### やること

#### A. 王者名（L3902付近 `buildOrgSummaryCard` 内）
```
王者 <strong style="color:var(--text-main)">${championName}</strong>
```
→ 自団体王者: `onclick="showFighterPopup(${champId},'roster')"` + cursor:pointer
→ 相手団体王者: `onclick="showFighterPopup(${rivalChampId},'ai:${_dbCompareTarget}')"` + cursor:pointer

buildOrgSummaryCard に championId パラメータを追加するか、外側で処理する。

#### B. Top 3 Matchups（L4048付近 `buildMatchupCard` 内）
選手名の `<strong>${m.player.name}</strong>` と `<strong>${m.rival.name}</strong>` を:
```js
<strong style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px" onclick="event.stopPropagation();showFighterPopup(${m.player.id},'roster')">${m.player.name}</strong>
```
```js
<strong style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px" onclick="event.stopPropagation();showFighterPopup(${m.rival.id},'ai:${_dbCompareTarget}')">${m.rival.name}</strong>
```

顔写真アバター（`db-cmp-match-avatar`）にも同じ onclick を付与。

#### C. Scouting Report（L4224付近）
注目選手の名前 `${p.name}` と顔写真にクリックイベント追加:
```js
onclick="event.stopPropagation();showFighterPopup(${p.id},'ai:${_dbCompareTarget}')"
style="cursor:pointer"
```

#### D. スタイル統一
新聞と同じ dotted underline スタイルを使い、「クリックできる名前」の視覚表現をゲーム全体で統一する。

### 変更ファイル
- `src/ui-render.js`（タスク2完了後に実行）

### テスト確認
- 団体比較画面で王者名、Matchup選手名、Scouting選手名にドット下線が表示される
- クリックで showFighterPopup が開く
- ポップアップ内で正しい所属情報が表示される（自団体=roster、相手=ai:orgId）
