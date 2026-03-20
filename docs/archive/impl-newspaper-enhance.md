# 実装指示: 新聞タブ豪華化

## 概要

データベース内の新聞タブ（`_renderDbNewspaper`）を拡張し、
全試合ダイジェスト、興行評価（星 + 黒田コメント）、次回展望を追加する。

**依存:**
- `kuroda-text-part2.js` のテキスト定数（NEWSPAPER_DIGEST_COMMENTS, KURODA_SHOW_RATING, KURODA_PREVIEW）
- NPC画像システム（黒田幸子の顔アイコン）

---

## 1. データ構造の拡張

### 1-1. currentNewspaper の拡張

`_buildShowResultNewspaperData()` (app.js) の返却オブジェクトに以下を追加:

```javascript
return {
  // === 既存フィールド（変更なし） ===
  showName, venueName, attendance, avgMQ,
  headline, subheadline, article,
  winner, loser, left, right, isDraw, finishLabel,
  turns, mq, hpLeft, hpRight, isTitleMatch,

  // === NEW: 全試合ダイジェスト ===
  allMatches: results.map((r, idx) => {
    if (idx === 0) return null; // メインは既に別途表示
    const isMatchDraw = r.winner === 'draw';
    const matchWinner = isMatchDraw ? null : (r.winner === 'left' ? r.left : r.right);
    const matchLoser = isMatchDraw ? null : (r.winner === 'left' ? r.right : r.left);
    return {
      left: { id: r.left.id, name: r.left.name, ovr: Engine.util.ov(r.left) },
      right: { id: r.right.id, name: r.right.name, ovr: Engine.util.ov(r.right) },
      winner: r.winner, // 'left' | 'right' | 'draw'
      winnerName: matchWinner?.name || null,
      loserName: matchLoser?.name || null,
      mq: r.mq || 0,
      turns: r.turns || 0,
      finishLabel: Engine.formatFinish(r.finType, r.finMove),
      isDraw: isMatchDraw,
      // 特殊フラグ
      isUpset: !isMatchDraw && matchWinner && (
        (matchWinner.id === r.left.id && Engine.util.ov(r.left) < Engine.util.ov(r.right) - 8) ||
        (matchWinner.id === r.right.id && Engine.util.ov(r.right) < Engine.util.ov(r.left) - 8)
      ),
      isDominant: !isMatchDraw && (r.turns || 99) <= 6,
      isTitleMatch: !!r.isTitleMatch,
    };
  }).filter(Boolean),

  // === NEW: 興行総合評価 ===
  showRating: (() => {
    const expected = getExpectedMQ(G.orgPop);
    const diff = avgMQ - expected;
    let stars;
    if (diff >= 20) stars = 5;
    else if (diff >= 10) stars = 4;
    else if (diff >= 0) stars = 3;
    else if (diff >= -10) stars = 2;
    else if (diff >= -20) stars = 1;
    else stars = 0;
    return { stars, expected, actual: avgMQ, diff };
  })(),

  // === NEW: 次回展望データ ===
  preview: buildPreviewData(G),

  generatedWeek: G.week,
  generatedSeason: G.season,
};
```

### 1-2. ヘルパー関数

```javascript
// 団体人気から期待されるMQ水準を算出
function getExpectedMQ(orgPop) {
  return Math.round(25 + orgPop * 0.6);
}

// 次回展望データ
function buildPreviewData(state) {
  const preview = { fanExpect: [], rivalry: null, title: null };

  // ファン期待カード（fanExpectation が既存システムにあれば参照）
  if (state.fanExpectation) {
    state.fanExpectation.slice(0, 2).forEach(fe => {
      const left = state.roster.find(f => f.id === fe.leftId) || ALL_CHARS.find(c => c.id === fe.leftId);
      const right = state.roster.find(f => f.id === fe.rightId) || ALL_CHARS.find(c => c.id === fe.rightId);
      if (left && right) {
        preview.fanExpect.push({ leftId: left.id, leftName: left.name, rightId: right.id, rightName: right.name });
      }
    });
  }

  // 因縁ペア（最もヒートが高いペア）
  // state.rivalries から heat が最大のものを取得
  if (state.rivalries) {
    let maxHeat = 0, hotPair = null;
    Object.entries(state.rivalries).forEach(([key, riv]) => {
      if (riv.heat > maxHeat) {
        maxHeat = riv.heat;
        const ids = key.split('>').map(Number);
        const left = state.roster.find(f => f.id === ids[0]);
        const right = state.roster.find(f => f.id === ids[1]);
        if (left && right) hotPair = { leftName: left.name, rightName: right.name };
      }
    });
    if (hotPair && maxHeat >= 30) preview.rivalry = hotPair;
  }

  // タイトル戦展望
  const champId = state.titles?.world?.championId;
  if (champId) {
    const champ = state.roster.find(f => f.id === champId);
    // 挑戦者候補: OVRトップの非王者
    const challenger = [...state.roster]
      .filter(f => f.id !== champId)
      .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
    if (champ && challenger) {
      preview.title = { championName: champ.name, challengerName: challenger.name };
    }
  }

  return preview;
}
```

---

## 2. UI レイアウト

### 全体構成

```
┌──────────────────────────────────────┐
│ 既存メインイベント記事               │
│ （ヘッドライン + 対戦カード + 本文） │
├──────────────────────────────────────┤
│ 興行総合評価  ★★★★☆               │  ← NEW
│ 黒田コメント                         │
├──────────────────────────────────────┤
│ ■ 全試合ダイジェスト                 │  ← NEW
│ ▼ 第2試合 [顔]○○ def. [顔]○○      │
│   MQ 72 / 12T / ジャーマン           │
│   「好勝負。序盤の攻防が光った」     │
│ ▼ 第3試合 ...                        │
├──────────────────────────────────────┤
│ 📋 次回展望                          │  ← NEW
│ ファン期待 / 因縁 / タイトル         │
└──────────────────────────────────────┘
```

### 興行総合評価セクション

```html
<div class="news-show-rating">
  <div class="news-rating-stars">${starHtml}</div>
  <div class="news-rating-comment">
    <img src="${kurodaFaceUrl}" class="news-kuroda-face" alt="">
    <p>「コメント」</p>
  </div>
</div>
```

**星の表示:**
```javascript
function renderStars(count) {
  return '★'.repeat(count) + '☆'.repeat(5 - count);
}
```

### 全試合ダイジェストセクション

```html
<div class="news-digest">
  <div class="news-digest-title">全試合ダイジェスト</div>
  ${allMatches.map((m, idx) => `
    <div class="news-digest-match">
      <div class="news-digest-header">
        <span class="news-digest-num">第${idx + 2}試合</span>
        ${m.isTitleMatch ? '<span class="news-digest-badge title">TITLE</span>' : ''}
        ${m.isUpset ? '<span class="news-digest-badge upset">UPSET</span>' : ''}
      </div>
      <div class="news-digest-faceoff">
        <div class="news-digest-fighter ${m.winner === 'left' ? 'winner' : ''}">
          ${smallPortrait(m.left.id)}
          <span>${m.left.name}</span>
        </div>
        <div class="news-digest-result">
          ${m.isDraw ? 'DRAW' : 'def.'}
        </div>
        <div class="news-digest-fighter ${m.winner === 'right' ? 'winner' : ''} right">
          <span>${m.right.name}</span>
          ${smallPortrait(m.right.id)}
        </div>
      </div>
      <div class="news-digest-stats">
        MQ ${m.mq} / ${m.turns}T / ${m.finishLabel}
      </div>
      <div class="news-digest-comment">「${digestComment}」</div>
    </div>
  `).join('')}
</div>
```

**ダイジェストコメント選択ロジック:**
```javascript
function getDigestComment(match, expectedMQ, seed) {
  // 特殊状況を優先チェック
  if (match.isDraw) return pick(NEWSPAPER_DIGEST_COMMENTS.draw, seed);
  if (match.isUpset) return pick(NEWSPAPER_DIGEST_COMMENTS.upset, seed);
  if (match.isDominant) return pick(NEWSPAPER_DIGEST_COMMENTS.dominant, seed);
  if (match.isTitleMatch) return pick(NEWSPAPER_DIGEST_COMMENTS.titleMatch, seed);

  // 相対MQ評価
  const diff = match.mq - expectedMQ;
  let rating;
  if (diff >= 15) rating = 'great';
  else if (diff >= 5) rating = 'good';
  else if (diff >= -4) rating = 'average';
  else if (diff >= -15) rating = 'poor';
  else rating = 'bad';

  return pick(NEWSPAPER_DIGEST_COMMENTS[rating], seed);
}
```

### 次回展望セクション

```html
<div class="news-preview">
  <div class="news-preview-title">📋 次回展望</div>
  ${previewHtml}
</div>
```

展望内容の優先度:
1. `fanExpect` があれば表示（最大2件）
2. `rivalry` があれば表示
3. `title` があれば表示
4. いずれもなければ `generic` テンプレ

---

## 3. CSS（新規追加、新聞紙風デザインの既存スタイルに合わせる）

```css
/* ── 興行総合評価 ── */
.news-show-rating{padding:14px;border-top:2px double rgba(95,69,35,0.35);border-bottom:1px solid rgba(95,69,35,0.15);margin:14px 0}
.news-rating-stars{font-size:24px;letter-spacing:4px;color:#b8892a;text-align:center;margin-bottom:10px}
.news-rating-comment{display:flex;gap:10px;align-items:flex-start}
.news-kuroda-face{width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(82,53,23,0.3)}
.news-rating-comment p{margin:0;font-size:12.5px;line-height:1.8;color:#3a2e1c}

/* ── 全試合ダイジェスト ── */
.news-digest{padding:12px 0}
.news-digest-title{font-size:14px;font-weight:900;color:#2a1f0e;border-bottom:2px solid rgba(95,69,35,0.3);padding-bottom:6px;margin-bottom:12px}
.news-digest-match{padding:10px 0;border-bottom:1px solid rgba(95,69,35,0.1)}
.news-digest-match:last-child{border-bottom:none}
.news-digest-header{display:flex;gap:8px;align-items:center;margin-bottom:6px}
.news-digest-num{font-size:11px;font-weight:700;color:#5b4b34}
.news-digest-badge{padding:2px 6px;border-radius:3px;font-size:10px;font-weight:900;letter-spacing:1px}
.news-digest-badge.title{background:#b8892a;color:#fff}
.news-digest-badge.upset{background:#9b1212;color:#fff}
.news-digest-faceoff{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.news-digest-fighter{display:flex;align-items:center;gap:6px;flex:1;min-width:0}
.news-digest-fighter.right{flex-direction:row-reverse;text-align:right;justify-content:flex-start}
.news-digest-fighter.winner span{font-weight:900;color:#2a1f0e}
.news-digest-fighter span{font-size:13px;color:#5b4b34;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.news-digest-fighter img{width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0}
.news-digest-result{font-size:11px;font-weight:700;color:#7a5b32;white-space:nowrap;min-width:30px;text-align:center}
.news-digest-stats{font-size:11px;color:#7a5b32;margin-bottom:3px}
.news-digest-comment{font-size:12px;color:#5b4b34;line-height:1.6;font-style:italic}

/* ── 次回展望 ── */
.news-preview{padding:14px 0;border-top:2px double rgba(95,69,35,0.35)}
.news-preview-title{font-size:14px;font-weight:900;color:#2a1f0e;margin-bottom:10px}
.news-preview-item{padding:8px 0;border-bottom:1px solid rgba(95,69,35,0.08);font-size:12.5px;line-height:1.8;color:#3a2e1c}
.news-preview-item:last-child{border-bottom:none}
.news-preview-faces{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.news-preview-faces img{width:28px;height:28px;border-radius:50%;object-fit:cover}
.news-preview-vs{font-size:11px;font-weight:900;color:#9b1212}
```

---

## 4. 既存コードの変更箇所

### app.js
- `_buildShowResultNewspaperData()` に `allMatches`, `showRating`, `preview` を追加
- `getExpectedMQ()` ヘルパー追加
- `buildPreviewData()` ヘルパー追加

### ui-render.js
- `_renderDbNewspaper()` を拡張
  - 既存のメインイベント表示の後に3セクション追加
  - ダイジェスト / 評価 / 展望

### index.html
- 上記CSSを追加

---

## 5. ポートレート表示

ダイジェストの顔は小さめ（32px）で表示。
既存の `getPortraitUrl(id)` を使用。
画像がない場合はイニシャル表示（既存パターン踏襲）。

```javascript
function smallPortrait(id) {
  const url = getPortraitUrl(id);
  if (url) return `<img src="${url}" alt="" style="width:32px;height:32px;border-radius:6px;object-fit:cover">`;
  return `<div style="width:32px;height:32px;border-radius:6px;background:#b8892a;display:grid;place-items:center;font-size:12px;font-weight:900;color:#fff">${(ALL_CHARS.find(c => c.id === id)?.name || '?').charAt(0)}</div>`;
}
```

---

## 6. 検証ポイント

- 全試合分のダイジェストが正しく表示されること（メイン以外の全試合）
- 顔画像が全ての試合で表示されること
- 星評価が orgPop に応じた相対評価になっていること（低人気でも良い試合なら高評価）
- 特殊状況（番狂わせ、圧勝、ドロー、タイトル戦）のコメントが優先表示されること
- 次回展望に fanExpect / rivalry / title が正しく反映されること
- 新聞紙風デザインの既存スタイルと調和していること
- 既存セーブで currentNewspaper に新フィールドがない場合でもエラーにならないこと
