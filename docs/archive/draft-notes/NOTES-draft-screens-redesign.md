# ドラフト画面リニューアル — Claude Code 作業指示書

作成: 2026-04-06
対象ブランチ: `main` から新規作成 `feature/draft-screens-redesign`
関連仕様: `specs/draft-negotiation-spec-v1.0.md`

---

## ゴール

1. ドラフトフローの「スカウト」呼称を「ドラフト」に統一
2. ドラフト開幕前画面を **号外紙面型 (A1)** に刷新
3. ドラフト完了画面を **トレーディングカード型 (B1)** に新設
4. 獲得時リアクション（旧スカウト契約演出）を新ドラフトフローに復活
5. 超逸材人数を実データから算出（モックの "3" は嘘）

モックアップ: `docs/draft-notes/draft-mockup.html`（本作業の前に main に追加しておく）

---

## 前提確認（最初にやること）

```bash
git checkout main
git pull origin main
git checkout -b feature/draft-screens-redesign
```

main の先頭が `2a858e1 merge: feature/draft-negotiation` 以降であることを確認。

---

## Step 1 — 呼称 rename（スカウト → ドラフト）

**コミット:** `refactor: draft naming unification on draft entry flow`

### 置換対象（ユーザー可視文字列のみ）

#### `src/ui-render.js`

| 行 | 現状 | 変更後 |
|---|---|---|
| 499 | `const offLabels = ['🏁 シーズン終了', '📊 シーズンレポート', '🔍 スカウト活動', '🔄 移籍ウィンドウ', '🎬 新シーズン準備'];` | `'🔍 スカウト活動'` → `'⚖ ドラフト'` |
| 510 | `<span>レポート</span><span>スカウト</span><span>移籍</span><span>開幕</span>` | `スカウト` → `ドラフト` |
| 590 | `const nextLabels = ['シーズンレポートへ →', 'スカウト活動へ →', '移籍ウィンドウへ →', '新シーズン開幕 →'];` | `'スカウト活動へ →'` → `'ドラフト会議へ →'` |
| 1290 | `const eventLabel = G.scoutEventType === 'midseason' ? '補強スカウト' : 'メインスカウト';` | `'補強スカウト'` → `'補強ドラフト'`、`'メインスカウト'` → `'メインドラフト'` |
| 3691 | 同上（別箇所で同じ式） | 同上 |
| 3780 | `<button class="btn btn-gold" onclick="scoutFinish()">🔍 スカウト活動終了</button>` | `🔍 スカウト活動終了` → `⚖ ドラフト終了` |

**注:** 1290 付近と 1293-1299 の「🔍 スカウトレポート到着」ブロック全体は **Step 2** で差し替えるので、Step 1 では触らない。

#### `src/management.js`

| 行 | 現状 | 変更後 |
|---|---|---|
| 9176 | `events.push('📅 オフシーズン第3週: スカウトレポート到着！');` | `'📅 オフシーズン第3週: ドラフト速報到着！'` |
| 9177 | `events.push(\`🔍 スカウト候補 ${report.candidates.length}名の情報が届きました\`);` | `⚖ ドラフト候補 ${...}名の情報が届きました` |
| 9447 | `events.push(\`🔍 シーズン中スカウト: 補強候補 ${report.candidates.length}名の情報が届きました\`);` | `⚖ 補強ドラフト: 候補 ${...}名の情報が届きました` |

### 触らない（重要）

- `src/data.js` — 選手プロフィール・台詞内の「スカウト」（世界観テキスト）
- `src/ui-common.js:6158, 6227` — E4 ランダムイベント `🔍 スカウト情報`（別機構）
- `src/management.js:9664` — `フリーエージェント${n}名がスカウト可能` → これは FA の話なのでそのまま
- `src/management.js:1887, 2032` — 選手経歴表示の via 判定、`scout` が別ルートから入るので残す
- `src/app.js:2789, 2905, 2936, 2958, 3084, 3126, 3159` — 旧 `acceptScout` 系のログ文字列。E4 経由や旧セーブデータで到達の可能性あり、今回は触らない

### 動作確認

- オフシーズン進行バーのラベルが「ドラフト」になっているか
- 次フェーズボタン「ドラフト会議へ →」で scoutEvent に遷移するか
- ゲームログに「⚖ ドラフト速報到着」が出るか

---

## Step 2 — A1 ドラフト開幕前画面

**コミット:** `feat: draft kickoff screen (A1 newspaper teaser)`

**対象:** `src/ui-render.js:1287-1300` の `else if (G.weekPhase === 'scoutEvent')` ブロック

### 要件

モックアップ `docs/draft-notes/draft-mockup.html` の **A1 セクション** をそのまま踏襲。ただしモックの SUPER ELITE 数値は嘘だったので、実データから算出する。

### 実装

```js
else if (G.weekPhase === 'scoutEvent') {
  const weekLabel = G.offSeason ? `オフシーズン第${G.offWeek}週` : Engine.util.formatDate(G.season, G.week);
  const eventLabel = G.scoutEventType === 'midseason' ? '補強ドラフト' : 'メインドラフト';
  document.getElementById('weekTitle').textContent = `${weekLabel} — ⚖ ${eventLabel}`;

  const candidates = G.scoutCandidates || [];
  const totalCount = candidates.length;
  const superElites = candidates.filter(c => c.assessedTier === 'superElite');
  const elites = candidates.filter(c => c.assessedTier === 'elite');
  const promisings = candidates.filter(c => c.assessedTier === 'promising');
  const maxPicks = G.scoutMaxPicks || 4;
  const editionNo = 100 + (G.season - 1) * 4 + (G.scoutEventType === 'midseason' ? 2 : 1);
  const yearNo = 2024 + G.season;

  // Hero headline: 超逸材がいれば最年少 or 一番 assessedValue が高い超逸材で
  const topSE = superElites.length > 0
    ? [...superElites].sort((a, b) => (b.assessedValue || 0) - (a.assessedValue || 0))[0]
    : null;
  const heroHeadline = topSE
    ? `<span class="red">超逸材</span>・${topSE.name}、<br>ついに業界の門を叩く`
    : `<span class="red">運命</span>の<span class="red">ドラフト</span>、<br>ついに開幕`;
  const heroSub = topSE
    ? `${yearNo}年度 ${eventLabel} — ${topSE.age}歳の才能を筆頭に全${totalCount}名`
    : `${yearNo}年度 ${eventLabel} — 全${totalCount}名、業界の門を叩く`;

  // Silhouette count (max 8 shown)
  const silCount = Math.min(8, totalCount);
  const featCount = Math.min(3, superElites.length + elites.length); // feat = SE + elite

  let silHtml = '';
  for (let i = 0; i < silCount; i++) {
    silHtml += `<div class="a1-sil${i < featCount ? ' feat' : ''}"></div>`;
  }

  // Lead body
  const leadBody = topSE
    ? `本日、${weekLabel}。各団体のフロントが動き出す。今年の目玉は${topSE.age}歳の超逸材・${topSE.name}。複数の団体がすでに獲得に本腰を入れているとの情報があり、業界関係者の注目が集まっている。${maxPicks}名の新戦力を掴み取れるか — あなたの団体の未来を決める選択が、今始まる。`
    : `本日、${weekLabel}。各団体のフロントが動き出す。${elites.length > 0 ? `注目の逸材${elites.length}名を中心に、` : ''}業界関係者の視線が集まっている。${maxPicks}名の新戦力を掴み取れるか — あなたの団体の未来を決める選択が、今始まる。`;

  // Stats cells: 超逸材は 0 のときは出さない
  const statCells = [
    { num: totalCount, lbl: 'TOTAL' },
  ];
  if (superElites.length > 0) {
    statCells.push({ num: superElites.length, lbl: 'SUPER ELITE', hot: true });
  }
  statCells.push({ num: elites.length, lbl: 'ELITE' });
  statCells.push({ num: maxPicks, lbl: '獲得上限' });
  statCells.push({ num: Math.round(G.funds).toLocaleString(), lbl: '資金 (万)' });

  const statsHtml = statCells.map(s =>
    `<div class="a1-stat"><div class="a1-stat-num${s.hot ? ' hot' : ''}">${s.num}</div><div class="a1-stat-lbl">${s.lbl}</div></div>`
  ).join('');

  html += `<div class="a1-wrap">
    ${superElites.length > 0 ? '<div class="a1-stamp">◆ 超逸材発見 ◆</div>' : '<div class="a1-stamp">◆ 号外 ◆</div>'}
    <div class="a1-title-bar">
      <div class="brand">週刊グラップル</div>
      <div class="ed">第${editionNo}号 ・ ${weekLabel}</div>
    </div>
    <div class="a1-hero">
      <div class="a1-kicker">◆ ${superElites.length > 0 ? '緊急速報' : 'ドラフト速報'} ◆</div>
      <div class="a1-main-h">${heroHeadline}</div>
      <div class="a1-sub-h">${heroSub}</div>
      <div class="a1-lead">${leadBody}</div>
    </div>
    <div class="a1-silhouettes">
      <div class="a1-sil-label">本日の候補者 ・ ${totalCount}名</div>
      <div class="a1-sil-row">${silHtml}</div>
    </div>
    <div class="a1-stats" style="grid-template-columns:repeat(${statCells.length},1fr);">${statsHtml}</div>
    <div class="a1-footer">
      <button class="btn btn-gold a1-btn-go" onclick="showScreen('scoutEvent');try{Audio.bgm.play('tension')}catch(e){}">⚖ ドラフトへ</button>
      <button class="btn btn-ghost" onclick="scoutFinish()">辞退する →</button>
    </div>
  </div>`;
}
```

### CSS 追加

モックアップ `docs/draft-notes/draft-mockup.html` の A1 部分 CSS をそのままコピーして `src/ui-render.js` の既存 CSS 注入ブロック（`draft-newspaper-css` の近く）に `a1-*` プレフィックスで追加。

**ただし `a1-wrap` の `max-width` は既存パネル幅に合わせること**（940px くらい）。`a1-btn-go` には軽いパルスアニメーションを追加して目を引かせる:

```css
.a1-btn-go { animation: a1-pulse 2s infinite; }
@keyframes a1-pulse {
  0%,100% { box-shadow: 0 4px 0 #5a3a10, 0 6px 16px rgba(0,0,0,0.4); }
  50%     { box-shadow: 0 4px 0 #5a3a10, 0 6px 24px rgba(212,160,76,0.6); }
}
.a1-stat-num.hot { color: #c22020; animation: a1-hot 1.5s infinite; }
@keyframes a1-hot { 0%,100%{opacity:1} 50%{opacity:0.7} }
```

### 動作確認

- 超逸材 0 人の seed で普通の「運命のドラフト」見出しが出る
- 超逸材 1 人以上の seed で「超逸材・●●、ついに業界の門を叩く」になる
- スタンプが「号外」/「超逸材発見」で切り替わる
- TOTAL / SUPER ELITE(条件付き) / ELITE / 獲得上限 / 資金 の統計が正しい
- 「ドラフトへ」ボタンで候補者一覧に進む
- 「辞退する」ボタンで scoutFinish() に進む

### 検証用 seed 探し

超逸材ありとなしの両方を試すために:

```js
// ブラウザコンソールで
for (let s = 1; s <= 50; s++) {
  generateDraftConfig(s);
  const cands = Engine.scout.generateScoutReport(Engine.rng.create(s), { season: 1 }, 'offseason').candidates;
  const se = cands.filter(c => c.assessedTier === 'superElite').length;
  if (se > 0) console.log('seed', s, 'SE=', se);
}
```

---

## Step 3 — B1 ドラフト完了画面

**コミット:** `feat: draft completion screen (B1 trading cards)`

**対象:**
- `src/ui-common.js` の `draftNextCandidate()` と `_finalizeDraft()`
- `src/ui-common.js` の `_buildDraftSummaryPage()` の前段に B1 ページを挿入

### 要件

ドラフト全候補終了後、最初に B1 の獲得選手カード画面を表示。ユーザーが「▶ 次へ進む」を押すと既存の業界紙まとめ記事（`_buildDraftSummaryPage`）に進み、そこから経営画面へ。

### 前提変更: 契約金を選手ごとに保持

現状 `dn.acquiredThisSession` は `[id, id, ...]` の ID 配列のみ。これを `[{id, finalBid, tier}, ...]` に変更する。

**`src/ui-common.js` `draftNextCandidate()` 内:**

```js
// 変更前
acquired.push(clean.id);

// 変更後
acquired.push({ id: clean.id, finalBid: ns.finalBid, tier: clean.assessedTier });
```

そして `_finalizeDraft()` 呼び出し時の `acquiredThisSession` も同じ形式で保持。

### B1 ページ生成関数

`src/ui-common.js` に新規関数:

```js
function _buildDraftGetPage(state, acquiredRecords) {
  // acquiredRecords: [{id, finalBid, tier}, ...]
  const roster = state.roster || [];
  const acquired = acquiredRecords
    .map(rec => {
      const f = roster.find(r => r.id === rec.id);
      return f ? { ...f, _finalBid: rec.finalBid, _tierId: rec.tier } : null;
    })
    .filter(Boolean);

  const totalCost = acquired.reduce((s, f) => s + (f._finalBid || 0), 0);
  const avgOvr = acquired.length > 0
    ? Math.round(acquired.reduce((s, f) => s + Engine.util.ov(f), 0) / acquired.length)
    : 0;
  const avgAge = acquired.length > 0
    ? (acquired.reduce((s, f) => s + (f.age || 0), 0) / acquired.length).toFixed(1)
    : 0;
  const remainingFunds = Math.round(state.funds || 0);

  const TIER_LABELS = { superElite: '超逸材', elite: '逸材', promising: '有望', raw: '原石', material: '素材' };
  const STYLE_SHORT = { Grappler: 'GRP', Striker: 'STK', Submission: 'SUB', Aerial: 'AER', Allround: 'ALL', Brawler: 'BRW' };
  const ROLE_SHORT = { Babyface: 'Face', Heel: 'Heel', Neutral: 'Neu', Dirty: 'Dirty' };

  function _card(f) {
    const tierId = f._tierId || 'material';
    const tierLabel = TIER_LABELS[tierId] || tierId;
    const ovr = Engine.util.ov(f);
    const url = typeof getPortraitUrl === 'function' ? getPortraitUrl(f.id) : '';
    const portrait = url
      ? `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;">`
      : `<div class="b1-placeholder">${(f.name || '?').charAt(0)}</div>`;

    const statRow = (k, v) => `<div class="b1-stat-row"><span class="k">${k}</span><div class="bar"><div class="fill" style="width:${Math.min(100, v)}%"></div></div><span class="v">${v}</span></div>`;

    return `<div class="b1-card tier-${tierId}">
      <div class="b1-card-top">
        <span class="b1-tier tier-${tierId}">${tierLabel}</span>
        <span class="b1-style">${STYLE_SHORT[f.style] || f.style} / ${ROLE_SHORT[f.role] || f.role}</span>
      </div>
      <div class="b1-portrait">
        ${portrait}
        <div class="b1-age">${f.age}歳</div>
      </div>
      <div class="b1-name">${f.name}</div>
      <div class="b1-ovr">OVR <span class="v">${ovr}</span></div>
      <div class="b1-stats">
        ${statRow('PWR', f.pw || 0)}
        ${statRow('SPD', f.sp || 0)}
        ${statRow('TEC', f.te || 0)}
        ${statRow('STA', f.st || 0)}
        ${statRow('MNT', f.mn || 0)}
      </div>
      <div class="b1-cost">
        <span class="lbl">契約金</span>
        <span class="val">${f._finalBid.toLocaleString()} 万</span>
      </div>
    </div>`;
  }

  const gridCols = acquired.length >= 4 ? 4 : Math.max(1, acquired.length);

  return {
    title: 'ドラフト完了',
    isGetPage: true,
    html: `<div class="b1-wrap">
      <div class="b1-head">
        <div class="kick">DRAFT COMPLETE</div>
        <div class="title">獲得選手</div>
        <div class="sub">新戦力<span class="count">${acquired.length}</span>名 ・ 契約金合計 <span class="total-cost">${totalCost.toLocaleString()}</span> 万</div>
      </div>
      ${acquired.length === 0
        ? '<div class="b1-empty">今回のドラフトでは獲得がありませんでした</div>'
        : `<div class="b1-grid" style="grid-template-columns:repeat(${gridCols},1fr);">${acquired.map(_card).join('')}</div>`
      }
      <div class="b1-totals">
        <div class="cell"><div class="n">${acquired.length}</div><div class="l">新戦力</div></div>
        ${acquired.length > 0 ? `<div class="cell"><div class="n">${avgOvr}</div><div class="l">平均 OVR</div></div>` : ''}
        ${acquired.length > 0 ? `<div class="cell"><div class="n">${avgAge}</div><div class="l">平均 年齢</div></div>` : ''}
        <div class="cell"><div class="n">${totalCost.toLocaleString()}</div><div class="l">契約金 (万)</div></div>
        <div class="cell"><div class="n" style="color:#2ecc71">${remainingFunds.toLocaleString()}</div><div class="l">残資金 (万)</div></div>
      </div>
    </div>`
  };
}
```

### `_finalizeDraft()` に挿入

現状:
```js
const draftNewsPage = _buildDraftSummaryPage(summary, acquired, empressNames, s);
```

変更後:
```js
const getPage = _buildDraftGetPage(s, dn.acquiredThisSession || []);
const draftNewsPage = _buildDraftSummaryPage(summary, acquired, empressNames, s);
// draftPages は既存のページリストに追加。getPage を先頭に差し込む
// state の _draftResultPages に保持して、scoutEvent → _renderDraftResultPages で表示
s = { ...s, _draftResultPages: [getPage, draftNewsPage], _draftResultIdx: 0 };
```

### 表示経路

`renderScoutEvent()` の先頭ガードに追加:

```js
if (G._draftResultPages && G._draftResultPages.length > 0) {
  const pages = G._draftResultPages;
  const idx = G._draftResultIdx || 0;
  const page = pages[idx];
  const isLast = idx >= pages.length - 1;
  el.innerHTML = (page.html || _renderNewsStoriesHtml(page.stories))
    + `<div class="btn-row" style="justify-content:center;margin-top:20px;">
      <button class="btn btn-gold" onclick="_draftResultNext()">${isLast ? '▶ 経営画面へ' : '▶ 次へ進む'}</button>
    </div>`;
  const titleEl = document.getElementById('scoutEventTitle');
  if (titleEl) titleEl.textContent = page.title || 'ドラフト結果';
  return;
}
```

`_draftResultNext()` 関数:

```js
function _draftResultNext() {
  Audio.play('click');
  const idx = (G._draftResultIdx || 0) + 1;
  if (idx >= (G._draftResultPages || []).length) {
    // 完了 → クリーンアップして経営画面へ
    G = { ...G, _draftResultPages: null, _draftResultIdx: 0, weekPhase: 'manage' };
    refreshAll();
    showScreen('week');
    return;
  }
  G = { ...G, _draftResultIdx: idx };
  refreshAll();
  showScreen('scoutEvent');
}
```

**注:** 既存のまとめ記事表示フロー（`_renderNewsStoriesHtml` 等）と名前が違う場合は実装を読んで合わせること。`_buildDraftSummaryPage` の戻り値 `{title, stories}` を表示している箇所を特定してそこに合流させる。

### CSS 追加

モックアップ B1 の CSS をコピー。`b1-card.tier-superElite`, `b1-card.tier-elite` の発光エフェクトは残す。`b1-card` の `::before` の `GET!` スタンプは cardsWrap 内で position:absolute になるよう注意。

### 動作確認

- 4名獲得時: 4カード横並び、各カードにポートレート・5バー・契約金・GET! スタンプ
- 1名だけ獲得: グリッド1列、中央寄せ
- 0名獲得: 「今回のドラフトでは獲得がありませんでした」表示、平均 OVR/年齢は出さない
- ティアごとのカード枠色: 超逸材=赤発光、逸材=金発光、それ以外=通常金
- 「▶ 次へ進む」で既存のまとめ記事に進み、そこから「▶ 経営画面へ」で週画面に戻る

---

## Step 4 — 獲得時リアクション復活

**コミット:** `feat: restore signing celebration in draft negotiation`

**対象:** `src/ui-common.js` `draftNextCandidate()`

### 現状

旧 `app.js:3088-3151` の `acceptScout` 系では以下が動いていた:
- `getSigningLine(cand, signingContext)` で性格×年齢×文脈の台詞取得
- `showEventPopup({type:'fighter', id, name, tone:'positive', message, detail})` で顔写真付きポップアップ
- `Audio.play('fanfare')` で勝利ファンファーレ

新 `draftNextCandidate()` ではこれが呼ばれていない。

### 実装

`draftNextCandidate()` の `if (ns.winner === 'player') { ... newRoster.push(signed); ... }` の直後に追加:

```js
if (ns.winner === 'player') {
  // ... 既存の newRoster.push(signed) まで ...

  // 獲得時リアクション（旧スカウトと同じポップアップ）
  try {
    const signingLine = (typeof getSigningLine === 'function')
      ? getSigningLine(clean, 'competition_won')
      : `${clean.name}との契約が成立した`;
    G._pendingDraftSigningPopup = {
      type: 'fighter',
      id: clean.id,
      name: clean.name,
      tone: 'positive',
      message: signingLine,
      detail: `📝 契約金: ${ns.finalBid.toLocaleString()}万 [${tierLabel}]`
    };
  } catch (e) {
    console.warn('[WM Draft] signing line fallback:', e);
  }
}
```

そして `draftNextCandidate()` の末尾、`refreshAll(); _showScreenNoBgm('scoutEvent');` のあとに:

```js
if (G._pendingDraftSigningPopup) {
  const popup = G._pendingDraftSigningPopup;
  G = { ...G, _pendingDraftSigningPopup: null };
  setTimeout(() => showEventPopup(popup), 50);
}
```

`setTimeout` を入れるのは `showScreen` が `dismissAllPopups` を呼ぶ順序対策（旧 app.js の方針と同じ）。

### ファンファーレ二重鳴り対策

`draftPlayerAction()` で既に `_draftSfx('fanfare')` が鳴っている。Audio.play('fanfare') を追加すると二重になるので、**追加しない**。`_draftSfx` 側だけで音は完結。

### 動作確認

- 獲得時に選手顔写真 + 性格に応じた台詞ポップアップが出る
- ポップアップに契約金と [ティア] が表示される
- BGM は切れず、ファンファーレ SE が1回鳴る（二重鳴りしない）
- 見送り/競り負け時は ポップアップ 出ない
- 次候補に自動遷移する際もポップアップが正常に閉じる

---

## Step 5 — auto-sim 再走 + 実機確認

### auto-sim 回帰

```
test/auto-sim.js を 30 シーズン相当で走らせ、以下を確認:
- ドラフト流札率が spec §4.9 範囲内
- AI 団体ロスター上限ガード動作
- エラーなく完走
```

### 実機確認チェックリスト

- [ ] オフシーズン進行バーラベル「ドラフト」表示
- [ ] 「ドラフト会議へ →」ボタン動作
- [ ] A1 画面 超逸材 0 パターン
- [ ] A1 画面 超逸材 1+ パターン
- [ ] A1 「ドラフトへ」で候補者一覧へ（BGM tension）
- [ ] A1 「辞退する」でスキップ可能
- [ ] 獲得時リアクション ポップアップ表示
- [ ] ファンファーレ SE 二重鳴りしない
- [ ] B1 画面 4名パターン
- [ ] B1 画面 1名/0名パターン
- [ ] B1 → 既存まとめ記事 → 経営画面の順で進む
- [ ] ゲームログ「⚖ ドラフト速報到着」表示

### マージ

全て OK なら:

```bash
git checkout main
git pull origin main
git merge --no-ff feature/draft-screens-redesign -m "feat: ドラフト開幕前/完了画面リニューアル + 獲得リアクション復活"
git push origin main
```

---

## 注意事項

1. **既存テスト/spec を壊さない**: `scoutEvent` の weekPhase 名や `_draftInterests`, `_draftNegotiation`, `scoutCandidates` などの state キー名は**変更しない**。ユーザー可視の文字列だけを変える。
2. **`_buildDraftSummaryPage` は消さない**: B1 の次ページとして使う。既存の業界紙ロジックは残したまま、前に B1 を差し込むだけ。
3. **ポートレート URL**: `getPortraitUrl(id)` が `image/face_*.png` を返す。存在しない選手は空文字を返すので placeholder で必ずフォールバック。
4. **契約金表示**: `ns.finalBid` は整数（万単位）。カンマ区切り表示 `.toLocaleString()` で。
5. **signing line のフォールバック**: `victory-lines.js` がロードされていないケースに備えて `try/catch` 必須。

---

## 参考ファイル

- モックアップ: `docs/draft-notes/draft-mockup.html`（A1/B1 の CSS と HTML 構造を全てここから取る）
- 仕様: `specs/draft-negotiation-spec-v1.0.md`
- 引き継ぎ: `docs/draft-notes/NOTES-draft-handoff.md`
- 既存獲得リアクション参考: `src/app.js:3088-3151` および `src/victory-lines.js` `getSigningLine()`
