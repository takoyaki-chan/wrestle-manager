# 実装指示: 団体比較タブ UI再構成

## 概要

団体比較タブ（`_renderDbOrgCompare`）を「スポーツ新聞の特集企画」風に全面リニューアルする。
黒田幸子（記者キャラ）のテキストを全面投入し、新セクションを追加する。

**依存:**
- `Engine.orgWar`（orgWarRecord）が実装済みであること
- `kuroda-text-part1.js` / `kuroda-text-part2.js` のテキスト定数
- `image/npc/face_kuroda_s.png` / `image/npc/upper_kuroda_s.webp`

---

## 1. NPC画像システム

### 1-1. ファイル配置

```
image/npc/
  face_kuroda_s.png      （72×72〜110pxの顔アイコン）
  upper_kuroda_s.webp     （上半身画像、コラム大表示用）
```

### 1-2. data.js に追加

```javascript
const NPC_PORTRAIT = { reporter: 'kuroda_s' };
function getNpcPortraitUrl(key) {
  return NPC_PORTRAIT[key] ? `../image/npc/face_${NPC_PORTRAIT[key]}.png` : '';
}
function getNpcUpperUrl(key) {
  return NPC_PORTRAIT[key] ? `../image/npc/upper_${NPC_PORTRAIT[key]}.webp` : '';
}
```

---

## 2. セクション構成（上から順）

```
┌─────────────────────────────────────────────┐
│ [SELECT] 比較対象選択（既存）                 │
├─────────────────────────────────────────────┤
│ ① 特集ヘッダー                              │  ← NEW
│    黒田の顔 + 見出し + グレード              │
├─────────────────────────────────────────────┤
│ ② 団体カードVS（既存リニューアル）           │
│    情報追加: 王者名、orgPop推移              │
├─────────────────────────────────────────────┤
│ ③ 戦績サマリー                              │  ← NEW
│    直接対決W-L + streak + 黒田コメント       │
├─────────────────────────────────────────────┤
│ ④ Top 3 Matchups（既存テキスト強化）         │
│    黒田フレーバー追加                        │
├─────────────────────────────────────────────┤
│ ⑤ Power Snapshot（既存レーダー+バー）        │
├─────────────────────────────────────────────┤
│ ⑥ 記者の総評コラム                          │  ← NEW（GM Brief置換）
│    黒田の上半身画像 + コラム文               │
├─────────────────────────────────────────────┤
│ ⑦ 注目選手ピックアップ                      │  ← NEW
│    相手団体の2-3名をハイライト               │
├─────────────────────────────────────────────┤
│ ⑧ ファン世論                                │  ← NEW
│    2-4件のSNS風コメント                      │
└─────────────────────────────────────────────┘
```

---

## 3. 各セクション詳細

### ① 特集ヘッダー（`db-cmp-headline`）

既存の `db-cmp-hero` + `db-cmp-grade` を置き換え。

**レイアウト:**
```
┌───────────────────────────────────────────┐
│ [黒田顔48px]  「見出しテキスト」    Grade  │
│               ——黒田幸子            B+     │
│               週刊グラップル               │
└───────────────────────────────────────────┘
```

**HTML構造:**
```html
<section class="db-cmp-headline">
  <div class="db-cmp-headline-reporter">
    <img src="../image/npc/face_kuroda_s.png" class="db-cmp-kuroda-face" alt="">
    <div class="db-cmp-headline-text">
      <div class="db-cmp-headline-quote">「見出しテキスト」</div>
      <div class="db-cmp-headline-byline">——黒田幸子 <span>週刊グラップル</span></div>
    </div>
  </div>
  <div class="db-cmp-headline-grade">
    <div class="grade-label">Matchup</div>
    <div class="grade-value">B+</div>
    <div class="grade-desc">説明テキスト</div>
  </div>
</section>
```

**CSS（新規）:**
```css
.db-cmp-headline{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px;border-radius:8px;border:1px solid rgba(212,168,67,0.18);background:linear-gradient(180deg,rgba(212,168,67,0.08),rgba(212,168,67,0.02));margin-bottom:14px}
.db-cmp-headline-reporter{display:flex;gap:14px;align-items:flex-start;flex:1;min-width:0}
.db-cmp-kuroda-face{width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid rgba(200,190,170,0.2);flex-shrink:0}
.db-cmp-headline-text{min-width:0}
.db-cmp-headline-quote{font-size:15px;line-height:1.7;color:var(--text-main);font-weight:600}
.db-cmp-headline-byline{font-size:11px;color:var(--text-dim);margin-top:6px}
.db-cmp-headline-byline span{margin-left:4px;color:var(--text-sub);font-style:italic}
.db-cmp-headline-grade{text-align:center;flex-shrink:0}
```

**テキスト選択ロジック:**
```javascript
// totalDiff から段階判定
function getKurodaTier(totalDiff) {
  if (totalDiff <= -60) return 'devastating';
  if (totalDiff <= -25) return 'behind';
  if (totalDiff <= 10) return 'even';
  if (totalDiff <= 40) return 'ahead';
  return 'dominant';
}
// seed固定でランダム選択（週ごとに変わるが同一週内は固定）
const tier = getKurodaTier(totalDiff);
const headlinePool = KURODA_HEADLINES[tier];
const headlineIdx = Engine.rng.seededInt(seed, headlinePool.length);
const headline = headlinePool[headlineIdx]({ playerName, rivalName });
```

### ③ 戦績サマリー（`db-cmp-war-record`）— NEW

**レイアウト:**
```
┌───────────────────────────────────────────┐
│ ⚔ 直接対決                通算 1勝5敗     │
│                                           │
│  対抗戦    0勝2敗  │  PPV    1勝3敗       │
│  サミット  0勝0敗  │                      │
│                                           │
│  現在 2連敗中                             │
│                                           │
│ [黒田顔28px] 「コメントテキスト」          │
└───────────────────────────────────────────┘
```

**HTML構造:**
```html
<section class="db-cmp-panel db-cmp-war-record">
  <h2 class="db-cmp-panel-title">⚔ Head to Head</h2>
  <div class="db-cmp-war-overall">
    <span class="db-cmp-war-label">通算</span>
    <strong class="db-cmp-war-wl">${wins}勝${losses}敗${draws > 0 ? draws + '分' : ''}</strong>
  </div>
  <div class="db-cmp-war-breakdown">
    <div class="db-cmp-war-item"><label>対抗戦</label><span>${warsWon}勝${warsLost}敗</span></div>
    <div class="db-cmp-war-item"><label>PPV</label><span>${ppvWon}勝${ppvLost}敗</span></div>
    <div class="db-cmp-war-item"><label>サミット</label><span>${summitsWon}勝${summitsLost}敗</span></div>
  </div>
  ${streakHtml}
  <div class="db-cmp-war-comment">
    <img src="face_kuroda_s.png" class="db-cmp-kuroda-face-sm" alt="">
    <p>「コメント」</p>
  </div>
</section>
```

**CSS（新規）:**
```css
.db-cmp-war-record{margin-bottom:14px}
.db-cmp-war-overall{display:flex;justify-content:space-between;align-items:center;padding:12px;border-radius:6px;background:rgba(0,0,0,0.15);margin-bottom:10px}
.db-cmp-war-label{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--text-dim)}
.db-cmp-war-wl{font-family:'Bebas Neue',sans-serif;font-size:28px;line-height:1;background:linear-gradient(180deg,#fff 20%,var(--gold-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.db-cmp-war-breakdown{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
.db-cmp-war-item{padding:8px 10px;border-radius:6px;border:1px solid rgba(200,190,170,0.06);background:rgba(200,190,170,0.02);text-align:center}
.db-cmp-war-item label{display:block;font-size:10px;color:var(--text-dim);font-family:'Oswald',sans-serif;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.db-cmp-war-item span{font-size:14px;font-weight:700;color:var(--text-main)}
.db-cmp-war-streak{padding:8px 12px;border-radius:6px;font-size:13px;font-weight:700;text-align:center;margin-bottom:10px}
.db-cmp-war-streak.win{background:rgba(46,204,113,0.1);color:#7ce8a8;border:1px solid rgba(46,204,113,0.2)}
.db-cmp-war-streak.lose{background:rgba(231,76,60,0.1);color:#f09e93;border:1px solid rgba(231,76,60,0.2)}
.db-cmp-war-comment{display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:6px;border:1px solid rgba(200,190,170,0.06);background:rgba(200,190,170,0.02);margin-top:8px}
.db-cmp-kuroda-face-sm{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0}
.db-cmp-war-comment p{margin:0;font-size:12px;line-height:1.8;color:var(--text-sub)}
```

**テキスト選択ロジック:**
```javascript
const rec = Engine.orgWar.getFor(state, 'player', targetOrgId);
const totalW = rec.warsWon + rec.summitsWon + rec.ppvWon;
const totalL = rec.warsLost + rec.summitsLost + rec.ppvLost;
const totalGames = totalW + totalL;
let recordTier;
if (totalGames === 0) recordTier = 'noRecord';
else if (totalW / totalGames >= 0.67) recordTier = 'heavyWinning';
else if (totalW / totalGames > 0.50) recordTier = 'slightWinning';
else if (totalW / totalGames >= 0.34) recordTier = 'slightLosing';
else if (totalW === totalL) recordTier = 'evenRecord';
else recordTier = 'heavyLosing';

// streak追記（該当すれば）
if (rec.streak >= 3) streakComment = pick(KURODA_WAR_RECORD.winStreak, seed);
else if (rec.streak <= -3) streakComment = pick(KURODA_WAR_RECORD.loseStreak, seed);
```

### ④ Top 3 Matchups テキスト強化

既存の `buildMatchupCard()` の `<p class="db-cmp-match-copy">` に、
黒田フレーバーテキストを追記する。

**追加ロジック（`getMatchupCopy` の後に結合）:**
```javascript
// スタイル相性フレーバー
const styleFlavor = getStyleFlavor(playerStyle, rivalStyle);
// 年齢差フレーバー
const ageFlavor = getAgeFlavor(playerAge, rivalAge);
// h2h直接対戦歴フレーバー
const h2hRec = Engine.h2h.getRecordFor(state, playerId, rivalId);
const h2hFlavor = getH2hFlavor(h2hRec);

// 全フレーバーを結合（1〜2件をランダム選択して追記）
const flavors = [styleFlavor, ageFlavor, h2hFlavor].filter(Boolean);
const selectedFlavor = flavors.length ? pickN(flavors, Math.min(2, flavors.length), seed) : [];
const fullCopy = baseCopy + ' ' + selectedFlavor.join(' ');
```

**スタイル判定ヘルパー:**
```javascript
function getStyleMatchupKey(s1, s2) {
  const map = { power: 'power', speed: 'speed', technique: 'tech', allround: null };
  const a = map[s1], b = map[s2];
  if (!a || !b) return 'defaultStyle';
  if (a === b) return `${a}Vs${capitalize(a)}`; // powerVsPower 等
  const sorted = [a, b].sort();
  return `${sorted[0]}Vs${capitalize(sorted[1])}`;
}
```

**年齢差判定:**
```javascript
function getAgeFlavorKey(age1, age2) {
  const diff = Math.abs(age1 - age2);
  if (diff <= 2) {
    if (age1 <= 22 && age2 <= 22) return 'youngVsYoung';
    if (age1 >= 30 && age2 >= 30) return 'veteranVsVeteran';
    return 'sameGeneration';
  }
  const younger = Math.min(age1, age2);
  const older = Math.max(age1, age2);
  if (older >= 28 && younger <= 23) return 'veteranVsYoung';
  return null; // 中途半端な差はスキップ
}
```

### ⑥ 記者の総評コラム（`db-cmp-editorial`）— GM Brief 置換

既存の `db-cmp-story` + `db-cmp-insight-list` + `db-cmp-brief-grid` を
**黒田のコラムパネル**に置き換える。

**レイアウト:**
```
┌───────────────────────────────────────────┐
│ 📝 黒田幸子のコラム                        │
│                                           │
│ ┌─────┐                                  │
│ │上半身│  コラム本文（3-5行）              │
│ │画像  │  既存のopportunity/risk/scout     │
│ │     │  もコラム内に織り込む              │
│ └─────┘                                  │
│                                           │
│ ── 補強ポイント ──                         │
│ [既存のactions表示]                        │
└───────────────────────────────────────────┘
```

**HTML構造:**
```html
<div class="db-cmp-panel">
  <h2 class="db-cmp-panel-title">📝 Column</h2>
  <div class="db-cmp-editorial">
    <img src="../image/npc/upper_kuroda_s.webp" class="db-cmp-kuroda-upper" alt="">
    <div class="db-cmp-editorial-body">
      <p>${editorialText}</p>
      <div class="db-cmp-editorial-byline">——黒田幸子</div>
    </div>
  </div>
  <div class="db-cmp-editorial-actions">
    <strong>補強ポイント</strong>
    ${planHtml}
  </div>
</div>
```

**CSS（新規）:**
```css
.db-cmp-editorial{display:flex;gap:16px;align-items:flex-start;margin-bottom:14px}
.db-cmp-kuroda-upper{width:100px;height:auto;border-radius:8px;flex-shrink:0;border:1px solid rgba(200,190,170,0.1)}
.db-cmp-editorial-body{flex:1;min-width:0}
.db-cmp-editorial-body p{margin:0;font-size:13px;line-height:2;color:var(--text-sub)}
.db-cmp-editorial-byline{margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right}
.db-cmp-editorial-actions{padding-top:12px;border-top:1px solid rgba(200,190,170,0.08)}
.db-cmp-editorial-actions strong{display:block;font-size:12px;margin-bottom:8px;color:var(--gold-light);font-family:'Oswald',sans-serif;letter-spacing:1px;text-transform:uppercase}
```

### ⑦ 注目選手ピックアップ（`db-cmp-spotlight`）— NEW

**選出ロジック:**
```javascript
function getSpotlightPicks(rivalRoster, state, targetOrgId) {
  const picks = [];
  const sorted = [...rivalRoster];

  // 1. 最も成長した選手（今シーズンのOVR上昇量）
  sorted.sort((a, b) => (b.ovrGainThisSeason || 0) - (a.ovrGainThisSeason || 0));
  if (sorted[0] && (sorted[0].ovrGainThisSeason || 0) >= 5) {
    picks.push({ ...sorted[0], category: 'growth', ovrGain: sorted[0].ovrGainThisSeason });
  }

  // 2. 人気TOP（既にpicksに入ってなければ）
  const popSorted = [...rivalRoster].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  if (popSorted[0] && !picks.find(p => p.id === popSorted[0].id)) {
    picks.push({ ...popSorted[0], category: 'star', pop: Math.round(popSorted[0].popularity) });
  }

  // 3. 若手で伸びしろが大きい選手
  const young = rivalRoster.filter(f => (state.season - (f.debutSeason || 1)) <= 2);
  const youngBest = young.sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
  if (youngBest && !picks.find(p => p.id === youngBest.id)) {
    picks.push({ ...youngBest, category: 'youngThreat' });
  }

  return picks.slice(0, 3);
}
```

※ `ovrGainThisSeason` が既存データにない場合は、シーズン開始OVRを別途記録するか、
この項目をスキップして人気TOP + 若手 + OVR最高の3名にフォールバックする。

**レイアウト:**
```
┌───────────────────────────────────────────┐
│ 🔍 Scouting Report                        │
│                                           │
│ [顔48px] 田中花子 (OVR 78)               │
│ 📈 要警戒 — 今季OVR +12の急成長          │
│ 「コメントテキスト」                       │
│                                           │
│ [顔48px] 佐藤美咲 (OVR 65 / 人気72)      │
│ ⭐ スター候補 — 実力以上の集客力          │
│ 「コメントテキスト」                       │
└───────────────────────────────────────────┘
```

**CSS（新規）:**
```css
.db-cmp-spotlight{margin-bottom:14px}
.db-cmp-spotlight-pick{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:8px;border:1px solid rgba(200,190,170,0.06);background:rgba(200,190,170,0.02);margin-bottom:8px}
.db-cmp-spotlight-face{width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;overflow:hidden}
.db-cmp-spotlight-face img{width:100%;height:100%;object-fit:cover}
.db-cmp-spotlight-info{flex:1;min-width:0}
.db-cmp-spotlight-name{font-size:14px;font-weight:700;margin-bottom:2px}
.db-cmp-spotlight-tag{display:inline-block;padding:3px 8px;border-radius:3px;font-size:11px;font-weight:700;margin-bottom:6px}
.db-cmp-spotlight-tag.growth{background:rgba(231,76,60,0.15);color:#f09e93;border:1px solid rgba(231,76,60,0.2)}
.db-cmp-spotlight-tag.star{background:rgba(212,168,67,0.15);color:var(--gold-light);border:1px solid rgba(212,168,67,0.2)}
.db-cmp-spotlight-tag.youngThreat{background:rgba(46,204,113,0.15);color:#7ce8a8;border:1px solid rgba(46,204,113,0.2)}
.db-cmp-spotlight-tag.nemesis{background:rgba(108,92,231,0.15);color:#b8acff;border:1px solid rgba(108,92,231,0.2)}
.db-cmp-spotlight-comment{font-size:12px;line-height:1.8;color:var(--text-sub)}
```

### ⑧ ファン世論（`db-cmp-fan-opinions`）— NEW

**レイアウト:**
```
┌───────────────────────────────────────────┐
│ 💬 Fan Voice                              │
│                                           │
│ 🗣️「テキスト」                            │
│     — @wrestling_fan_2026                 │
│                                           │
│ 🗣️「テキスト」                            │
│     — @core_analysis                      │
│                                           │
│ 🗣️「テキスト」                            │
│     — @hopeful_supporter                  │
└───────────────────────────────────────────┘
```

**ランダムハンドル名生成:**
```javascript
const FAN_HANDLES = {
  neutral: ['wrestling_fan', 'casual_viewer', 'ringside_seat', 'monday_night', 'arena_regular'],
  hardcore: ['core_analysis', 'stat_nerd', 'tape_watcher', 'ovr_tracker', 'scouting_eye'],
  troll: ['truth_hurts', 'just_saying', 'real_talk', 'no_mercy', 'savage_take'],
  hopeful: ['hopeful_fan', 'never_give_up', 'true_believer', 'always_cheering', 'loyal_supporter'],
};
```

**選択ロジック:**
- 3件表示。タイプの組み合わせは段階で変わる:
  - 惨敗: troll + hardcore + hopeful
  - 劣勢: hardcore + hopeful + neutral
  - 互角: neutral + hardcore + hopeful
  - 優勢: neutral + hopeful + hardcore
  - 圧倒: troll(味方側) + neutral + hopeful

**seed:** `Engine.rng.derive(state.rngSeed, state.season, state.week, orgId.charCodeAt(0), 0xFAC1)` で週固定。

**CSS（新規）:**
```css
.db-cmp-fan-opinions{padding:16px;border-radius:6px;border:1px solid rgba(200,190,170,0.08);background:var(--panel-bg)}
.db-cmp-fan-comment{padding:10px 12px;border-radius:8px;border:1px solid rgba(200,190,170,0.04);background:rgba(200,190,170,0.02);margin-bottom:8px}
.db-cmp-fan-comment:last-child{margin-bottom:0}
.db-cmp-fan-text{font-size:13px;line-height:1.7;color:var(--text-main)}
.db-cmp-fan-handle{font-size:11px;color:var(--text-dim);margin-top:4px}
```

---

## 4. 団体カードVS（②）への情報追加

既存の `buildOrgSummaryCard` に以下を追加:
- **王者名**（既に実装済み）
- **orgPop推移ミニ表示**: `S1: 10 → 現在: 35（↑25）` のような1行テキスト

```javascript
// orgPopHistory からシーズン1の start を取得
const popHistory = state.orgPopHistory?.player || [];
const s1Pop = popHistory[0]?.start || Math.round(orgPop);
const currentPop = Math.round(orgPop);
const popDelta = currentPop - s1Pop;
const popTrendHtml = `<div style="margin-top:6px;font-size:11px;color:var(--text-sub)">
  S1: ${s1Pop} → 現在: ${currentPop}
  <span class="${popDelta > 0 ? 'growth-up' : popDelta < 0 ? 'growth-down' : ''}">${popDelta > 0 ? '+' : ''}${popDelta}</span>
</div>`;
```

---

## 5. レスポンシブ対応

既存の `@media(max-width:900px)` と `@media(max-width:600px)` に追加:

```css
@media(max-width:900px){
  .db-cmp-headline{flex-direction:column;text-align:center}
  .db-cmp-headline-reporter{flex-direction:column;align-items:center}
  .db-cmp-headline-grade{margin-top:8px}
  .db-cmp-editorial{flex-direction:column;align-items:center}
  .db-cmp-kuroda-upper{width:80px}
  .db-cmp-war-breakdown{grid-template-columns:1fr}
}
@media(max-width:600px){
  .db-cmp-kuroda-face{width:40px;height:40px}
  .db-cmp-headline-quote{font-size:13px}
  .db-cmp-spotlight-pick{flex-direction:column;align-items:center;text-align:center}
}
```

---

## 6. 削除/置換するもの

- `db-cmp-hero` セクション → ① 特集ヘッダーに置換
- `db-cmp-grade`（position:absolute版） → ① に統合
- GM Brief パネル内の `db-cmp-story` + `db-cmp-insight-list` → ⑥ 記者コラムに置換
- `briefItems` 配列（勝ち筋/危険信号/スカウティング） → コラム本文に織り込み
- 既存の関数名 `_renderDbOrgCompare` はそのまま維持（内部をリビルド）

---

## 7. テキスト定数の組み込み

`kuroda-text-part1.js` と `kuroda-text-part2.js` の内容を
`src/ui-render.js` の上部（または別ファイルとして `src/kuroda-text.js` に分離して index.html で読み込み）に配置。

推奨: `src/kuroda-text.js` として分離。index.html の `<script>` タグで engine.js の後、ui-render.js の前に読み込む。

---

## 8. 検証ポイント

- 各段階（惨敗〜圧倒）でヘッダー・コラム・戦績コメントが正しく切り替わること
- 週が変わると表示テキストが変わること（seed固定なので同一週内は固定）
- orgWarRecord が空の場合（新規セーブ）でも「対戦歴なし」が正しく表示されること
- レスポンシブ: 900px / 600px で崩れないこと
- 黒田の顔画像が正しく表示されること
- 注目選手のポートレートが正しく表示されること
- ファン世論が3件表示されること
