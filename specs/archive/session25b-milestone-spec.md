# セッション25b 実装指示書：rawDeltaカーブ改修 + 補助金カウントダウン + 節目イベント

> **目的**: 序盤の停滞感を解消し「少しずつ進んでいる感」を生む。能動的選択で体験に厚みを出す
> **対象ファイル**: engine.js, data.js, ui-render.js, ui-common.js, app.js, index.html

---

## Part 1: rawDelta カーブ改修

### 1.1 engine.js — applyShowPopularity 内の rawDelta

**現行**:
```javascript
const rawDelta = avgMQ >= 80 ? 2 : avgMQ >= 65 ? 1 : avgMQ >= 45 ? 0 : -1;
```

**変更後**:
```javascript
const rawDelta = avgMQ >= 80 ? 1.8
              : avgMQ >= 65 ? 1.2
              : avgMQ >= 55 ? 0.7
              : avgMQ >= 45 ? 0.3
              : avgMQ >= 35 ? -0.3
              :               -0.5;
```

**設計意図**:
- MQ 45-54 → +0.3: 序盤でもゆっくり上がる（逓減前）
- MQ < 35 → -0.5: 序盤の下落を旧値（-1）の半分に緩和
- MQ 80+ → +1.8: 最大上昇を微減（旧2 → 1.8。高帯域では逓減が効くので影響小）

---

## Part 2: 補助金カウントダウン表示

### 2.1 ui-render.js — ヘッダーの団体人気の横

orgPop < 40 の時に「補助金終了まで +Xpt」を表示。

**表示例**: `団体人気 23 ⟨補助金あと17pt⟩`

**実装**:
```javascript
// updateHeader() 内、dispPop 表示の直後
const subsidyEl = document.getElementById('dispSubsidy');
if (subsidyEl) {
  const pop = Engine.util.dispOrgPop(G.orgPop);
  if (pop < 40) {
    subsidyEl.textContent = `補助金あと${40 - pop}pt`;
    subsidyEl.style.display = '';
  } else {
    subsidyEl.style.display = 'none';
  }
}
```

### 2.2 index.html — DOM追加

団体人気表示の横に `<span id="dispSubsidy">` を追加。
```html
<span class="info-val" id="dispPop">0</span>
<span id="dispSubsidy" class="subsidy-badge"></span>
```

### 2.3 index.html — CSS
```css
.subsidy-badge {
  font-size: 10px;
  color: #f39c12;
  background: rgba(243,156,18,0.12);
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: 4px;
}
```

---

## Part 3: 節目イベントシステム

### 3.1 概要

- ナレーション形式（キャラ顔画像なし、テキストのみ）
- 3択 → 選んだ選択肢に応じた短期バフが state に付与
- 一度発動したマイルストーンは再発動しない（`state.milestones` で管理）
- トリガー検出は tickWeek / finalizeShow の後に行う

### 3.2 データ定義（data.js）

```javascript
const MILESTONE_EVENTS = [
  {
    id: 'first_show',
    trigger: { type: 'totalShows', value: 1 },
    title: '🎉 旗揚げ興行',
    narration: '記念すべき第一回興行が幕を閉じた。\n観客はまばらだったが、選手たちの目は確かに輝いていた。\nこの先、団体をどう導いていくか——',
    choices: [
      {
        label: '🏠 地元を地道に固めていく',
        effect: { type: 'weekly_funds', amount: 40, weeks: 3 },
        result: '地元の商店街が応援してくれることになった。'
      },
      {
        label: '💪 選手の育成に力を入れる',
        effect: { type: 'training_boost', multiplier: 1.5, weeks: 4 },
        result: '選手たちの練習に、一層の熱が入り始めた。'
      },
      {
        label: '📣 とにかく知名度を上げたい',
        effect: { type: 'attendance_boost', multiplier: 1.3, shows: 2 },
        result: 'チラシ配りにSNS、できることは全部やった。噂が少しずつ広がり始めている。'
      }
    ]
  },
  {
    id: 'orgpop_20',
    trigger: { type: 'orgPop', value: 20 },
    title: '📰 地元で話題に',
    narration: '地元のスポーツ紙に団体の名前が載った。\n「あそこの興行、最近面白いらしいよ」\n——そんな声がちらほら聞こえ始めている。',
    choices: [
      {
        label: '🤝 ファンとの距離を縮める',
        effect: { type: 'promo_boost', amount: 1, weeks: 4 },
        result: 'ファン感謝デーを開催した。常連ファンの顔が少しずつ見えてきた。'
      },
      {
        label: '🎯 試合の質をもっと高める',
        effect: { type: 'mq_boost', amount: 2, weeks: 4 },
        result: '練習メニューを見直し、試合構成にもこだわり始めた。'
      },
      {
        label: '🔍 新戦力の獲得を急ぐ',
        effect: { type: 'fa_discount', percent: 30 },
        result: '業界に顔が利く人物から、有望な選手の情報が入ってきた。'
      }
    ]
  },
  {
    id: 'first_rivalry',
    trigger: { type: 'first_rivalry' },
    title: '⚡ 因縁の芽生え',
    // narration は動的生成（選手名を埋め込む）
    narration: null, // App側で生成
    choices: [
      {
        label: '🔥 この対決をじっくり育てる',
        effect: { type: 'rivalry_boost', amount: 1 },
        result: 'ふたりの視線がリング上で交差するたび、会場の空気が変わる。'
      },
      {
        label: '⚔️ 熱いうちに大一番を組む',
        effect: { type: 'next_match_mq', pair: null, amount: 5 },
        result: '次の対戦が、特別な一戦になる予感がする。'
      },
      {
        label: '🌐 他の組み合わせも試したい',
        effect: { type: 'rivalry_chance_up', weeks: 3 },
        result: 'いろんな選手をぶつけてみよう。化学反応はどこで起きるか分からない。'
      }
    ]
  }
];
```

### 3.3 state 管理

```javascript
// initState に追加
milestones: {},        // { first_show: true, orgpop_20: true, ... }
milestoneBuffs: [],    // [{ type, ..., remainingWeeks/remainingShows }]
```

### 3.4 トリガー検出（app.js）

```javascript
App._checkMilestones = function(state) {
  const ms = state.milestones || {};
  for (const evt of MILESTONE_EVENTS) {
    if (ms[evt.id]) continue; // 発動済み
    let triggered = false;
    switch (evt.trigger.type) {
      case 'totalShows':
        triggered = (state.totalShows || 0) >= evt.trigger.value;
        break;
      case 'orgPop':
        triggered = Engine.util.dispOrgPop(state.orgPop) >= evt.trigger.value;
        break;
      case 'first_rivalry':
        triggered = Object.keys(state.rivalries || {}).length > 0;
        break;
    }
    if (triggered) return evt;
  }
  return null;
};
```

### 3.5 UI（ui-common.js）

`showMilestoneEvent(evt, state, onChoice)` 関数を新設。

- オーバーレイ表示（z-index: awards-overlay と同等 = 270）
- タイトル + ナレーション文（改行対応）
- 3ボタン縦並び
- ボタンクリック → 結果テキスト表示 → 「閉じる」ボタン → onChoice(choiceIndex) コールバック

### 3.6 効果適用（app.js）

```javascript
App._applyMilestoneChoice = function(evt, choiceIdx) {
  const choice = evt.choices[choiceIdx];
  const eff = choice.effect;
  const buff = { ...eff, source: evt.id };

  // 週カウント系
  if (eff.weeks) buff.remainingWeeks = eff.weeks;
  if (eff.shows) buff.remainingShows = eff.shows;

  G = {
    ...G,
    milestones: { ...G.milestones, [evt.id]: true },
    milestoneBuffs: [...(G.milestoneBuffs || []), buff]
  };
  App.autoSave();
};
```

### 3.7 バフ消費（engine.js or app.js の tickWeek/finalizeShow）

**毎週処理（tickWeek）**:
```javascript
// milestoneBuffs の週カウントダウン
milestoneBuffs = milestoneBuffs.map(b => {
  if (b.remainingWeeks != null) return { ...b, remainingWeeks: b.remainingWeeks - 1 };
  return b;
}).filter(b => b.remainingWeeks == null || b.remainingWeeks > 0);
```

**興行後処理（finalizeShow）**:
```javascript
// remainingShows のカウントダウン
milestoneBuffs = milestoneBuffs.map(b => {
  if (b.remainingShows != null) return { ...b, remainingShows: b.remainingShows - 1 };
  return b;
}).filter(b => b.remainingShows == null || b.remainingShows > 0);
```

### 3.8 バフ参照箇所

| バフtype | 参照箇所 | 効果 |
|----------|----------|------|
| `weekly_funds` | app.js tickWeek 資金計算 | `amount` 万を毎週加算 |
| `training_boost` | engine.js processManage 練習成長 | trainGrowth × `multiplier` |
| `attendance_boost` | engine.js calcAttendance | attendance × `multiplier` |
| `promo_boost` | engine.js processManage プロモ | rawPromoGain + `amount` |
| `mq_boost` | engine.js processShow Pass2 | externalMQ に `amount` 加算（キャップ対象） |
| `fa_discount` | ui-common.js 交渉UI | 交渉金額 × (1 - `percent`/100)。次1回のみ（適用後に除去） |
| `rivalry_boost` | app.js 初因縁の対象ペアのみ | 因縁カウントを即時+1 |
| `next_match_mq` | engine.js processShow | 特定ペアの次の対戦のみ MQ + `amount`（1回限り） |
| `rivalry_chance_up` | engine.js recordRivalry | 因縁成立に必要な試合数を一時的に-1 |

### 3.9 マイグレーション

```javascript
// _migrated_milestone
if (!G.milestones) G.milestones = {};
if (!G.milestoneBuffs) G.milestoneBuffs = [];
// 既存セーブで totalShows > 0 なら first_show は発動済みとする
if ((G.totalShows || 0) > 0) G.milestones.first_show = true;
if (Engine.util.dispOrgPop(G.orgPop) >= 20) G.milestones.orgpop_20 = true;
if (Object.keys(G.rivalries || {}).length > 0) G.milestones.first_rivalry = true;
```

---

## Part 4: index.html CSS追加

```css
/* 節目イベントオーバーレイ */
.milestone-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 275;
  display: flex; align-items: center; justify-content: center;
}
.milestone-box {
  background: var(--bg-card);
  border: 2px solid var(--gold);
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 480px;
  width: 90%;
  text-align: center;
}
.milestone-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 16px;
}
.milestone-narration {
  font-size: 14px;
  color: var(--text);
  line-height: 1.8;
  margin-bottom: 20px;
  white-space: pre-line;
}
.milestone-choice {
  display: block;
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s, border-color 0.2s;
}
.milestone-choice:hover {
  background: rgba(255,255,255,0.08);
  border-color: var(--gold);
}
.milestone-result {
  font-size: 14px;
  color: var(--text-sub);
  line-height: 1.6;
  margin: 16px 0;
  font-style: italic;
}
.milestone-effect {
  font-size: 12px;
  color: var(--gold);
  margin-bottom: 16px;
}
```

---

## 変更サマリー

| ファイル | 変更概要 |
|---------|---------|
| **engine.js** | rawDelta 6段階化。milestoneBuffs の training_boost/mq_boost/attendance_boost/promo_boost 参照 |
| **data.js** | MILESTONE_EVENTS 定義追加 |
| **ui-render.js** | 補助金カウントダウン表示。milestoneBuffs のアクティブ表示（任意） |
| **ui-common.js** | showMilestoneEvent() 新設 |
| **app.js** | _checkMilestones / _applyMilestoneChoice / tickWeek バフ消費 / finalizeShow バフ消費。マイグレーション |
| **index.html** | milestone-overlay DOM + CSS。dispSubsidy DOM + CSS |
