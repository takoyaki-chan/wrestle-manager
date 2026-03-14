# P4+P5+P6 実装仕様: Glimpse（心の垣間見え）システム

> **対象**: glimpse-popup-overhaul-spec-v1.2 の §2（P4）+ §2.3（P5）+ §3（P6）
> **実装者**: Claude Code (Sonnet)
> **テスト**: Keisuke が手動確認
> **セリフ監修**: Opus が執筆済み（本specに全文収録）

---

## 全体構造

```
Engine.glimpse = {
  // A層: 重要イベント（bond/rivalry/trust閾値跨ぎ）
  checkALayer(state, rng) → { glimpses: [...], state }

  // B層: 日常の垣間見え（GL-01〜GL-10 + 絶好調終了）
  checkBLayer(state, rng) → { glimpses: [...], state }
}
```

**tickWeek への挿入位置**:

```
// Phase 5: ライバル称号 週次判定
...
// ★★★ A層 Glimpse（ここに挿入）★★★
const glimpseARng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xEE01));
const glimpseAResult = Engine.glimpse.checkALayer(s, glimpseARng);
s = glimpseAResult.state;
if (glimpseAResult.glimpses.length > 0) {
  s = { ...s, _pendingGlimpseA: glimpseAResult.glimpses };
}

// ── スナップショット生成 ──
...（既存コード）...

// ★★★ B層 Glimpse（スナップショットの後に挿入）★★★
const glimpseBRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xEE02));
const glimpseBResult = Engine.glimpse.checkBLayer(s, glimpseBRng);
s = glimpseBResult.state;
if (glimpseBResult.glimpses.length > 0) {
  s = { ...s, _pendingGlimpseB: glimpseBResult.glimpses };
}

// v3.0: ケアストック回復
...
```

---

## Part 1: P4 — A層 Glimpse エンジンロジック

### 1.1 閾値定義

```javascript
const GLIMPSE_A_THRESHOLDS = [
  // bond上昇
  { id: 'bond_60_up',   axis: 'bond',    dir: 'up',   value: 60, rate: 0.90, tone: 'positive', cooldown: 8,  label: '打ち解けた様子' },
  { id: 'bond_80_up',   axis: 'bond',    dir: 'up',   value: 80, rate: 1.00, tone: 'gold',     cooldown: 8,  label: '深い絆の芽生え' },
  // bond下降
  { id: 'bond_59_down', axis: 'bond',    dir: 'down', value: 59, rate: 0.85, tone: 'negative', cooldown: 8,  label: '距離ができた' },
  { id: 'bond_39_down', axis: 'bond',    dir: 'down', value: 39, rate: 0.90, tone: 'negative', cooldown: 8,  label: '不和の兆し' },
  // rivalry上昇
  { id: 'rivalry_30_up', axis: 'rivalry', dir: 'up',   value: 30, rate: 0.85, tone: 'dramatic', cooldown: 8,  label: '因縁の始まり' },
  { id: 'rivalry_50_up', axis: 'rivalry', dir: 'up',   value: 50, rate: 0.95, tone: 'dramatic', cooldown: 8,  label: '宿敵として意識' },
  { id: 'rivalry_70_up', axis: 'rivalry', dir: 'up',   value: 70, rate: 1.00, tone: 'gold',     cooldown: 8,  label: '宿命のライバル' },
  // rivalry下降
  { id: 'rivalry_29_down', axis: 'rivalry', dir: 'down', value: 29, rate: 0.80, tone: 'calm',  cooldown: 8,  label: '因縁の終息' },
  // trust
  { id: 'trust_below_35', axis: 'trust', dir: 'down', value: 35, rate: 0.95, tone: 'warning',  cooldown: 12, label: '信頼の揺らぎ' },
  { id: 'trust_below_20', axis: 'trust', dir: 'down', value: 20, rate: 1.00, tone: 'danger',   cooldown: 12, label: '不信感の極み' },
  { id: 'trust_above_75', axis: 'trust', dir: 'up',   value: 75, rate: 0.85, tone: 'positive', cooldown: 12, label: '厚い信頼' },
];
```

この定数は `data.js` に配置する。

### 1.2 checkALayer ロジック

```javascript
Engine.glimpse = {
  checkALayer(state, rng) {
    const glimpses = [];
    const roster = state.roster || [];
    const relationships = state.relationships || {};
    const cooldowns = { ...(state._glimpseACooldowns || {}) };
    const absWeek = ((state.season - 1) * 52) + state.week;
    // 前週の値を記録したスナップショットと比較
    const prevSnap = state._glimpseAPrevValues || {};
    const newSnap = {};

    // ── bond / rivalry 閾値チェック ──
    // 全ロスター選手のペアについて、自分→相手 の bond/rivalry をチェック
    const allCharIds = new Set();
    roster.forEach(f => { if (!f.injury) allCharIds.add(f.id); });
    // AI団体の選手も含める（関係値は全キャラ間に存在）
    if (state.aiOrgs) {
      Object.values(state.aiOrgs).forEach(org => {
        (org.roster || []).forEach(f => allCharIds.add(f.id));
      });
    }

    const charIds = [...allCharIds];
    for (let i = 0; i < charIds.length; i++) {
      for (let j = 0; j < charIds.length; j++) {
        if (i === j) continue;
        const idA = charIds[i], idB = charIds[j];
        const key = Engine.relationships._key(idA, idB);
        const rel = relationships[key];
        if (!rel) continue;

        // プレイヤーロスターに属する選手のみ表示対象
        const speakerInRoster = roster.some(f => f.id === idA);
        if (!speakerInRoster) continue;

        const prevBond = (prevSnap[key] || {}).bond;
        const prevRivalry = (prevSnap[key] || {}).rivalry;
        const curBond = rel.bond;
        const curRivalry = rel.rivalry;

        // bond/rivalry 閾値判定
        GLIMPSE_A_THRESHOLDS.forEach(th => {
          if (th.axis === 'trust') return; // trustは別処理
          const prev = th.axis === 'bond' ? prevBond : prevRivalry;
          const cur = th.axis === 'bond' ? curBond : curRivalry;
          if (prev === undefined) return; // 初週はスキップ

          let crossed = false;
          if (th.dir === 'up' && prev < th.value && cur >= th.value) crossed = true;
          if (th.dir === 'down' && prev >= th.value + 1 && cur <= th.value) crossed = true;

          if (!crossed) return;

          // クールダウンチェック
          const cdKey = `${th.id}_${idA}_${idB}`;
          if (cooldowns[cdKey] && absWeek - cooldowns[cdKey] < th.cooldown) return;

          // 発火率判定
          if (Engine.rng.float(rng) >= th.rate) return;

          // 発火！
          cooldowns[cdKey] = absWeek;
          const speaker = roster.find(f => f.id === idA);
          const target = [...roster, ..._getAllAIChars(state)].find(f => f.id === idB);
          if (!speaker || !target) return;

          const line = pickDialogueLine(GLIMPSE_A_LINES[th.id], speaker);
          glimpses.push({
            layer: 'A',
            type: th.id,
            tone: th.tone,
            label: th.label,
            speakerId: idA,
            speakerName: speaker.name,
            targetId: idB,
            targetName: target.name,
            dialogue: line,
            axis: th.axis,
            value: cur,
          });
        });

        // 現在値をスナップショットに記録
        newSnap[key] = { bond: curBond, rivalry: curRivalry };
      }
    }

    // ── trust 閾値チェック ──
    roster.forEach(f => {
      if (f.injury || f.isRental) return;
      const prevTrust = (state._glimpseAPrevTrust || {})[f.id];
      const curTrust = f.trust || 50;

      if (prevTrust === undefined) return; // 初週スキップ

      GLIMPSE_A_THRESHOLDS.forEach(th => {
        if (th.axis !== 'trust') return;
        let crossed = false;
        if (th.dir === 'down' && prevTrust >= th.value && curTrust < th.value) crossed = true;
        if (th.dir === 'up' && prevTrust < th.value && curTrust >= th.value) crossed = true;
        if (!crossed) return;

        const cdKey = `trust_${th.id}_${f.id}`;
        if (cooldowns[cdKey] && absWeek - cooldowns[cdKey] < th.cooldown) return;
        if (Engine.rng.float(rng) >= th.rate) return;

        cooldowns[cdKey] = absWeek;
        const line = pickDialogueLine(GLIMPSE_A_LINES[th.id], f);
        glimpses.push({
          layer: 'A',
          type: th.id,
          tone: th.tone,
          label: th.label,
          speakerId: f.id,
          speakerName: f.name,
          targetId: null,
          targetName: null,
          dialogue: line,
          axis: 'trust',
          value: curTrust,
        });
      });
    });

    // 新しいスナップショットを記録
    const newPrevTrust = {};
    roster.forEach(f => { newPrevTrust[f.id] = f.trust || 50; });

    const newState = {
      ...state,
      _glimpseACooldowns: cooldowns,
      _glimpseAPrevValues: newSnap,
      _glimpseAPrevTrust: newPrevTrust,
    };

    return { glimpses, state: newState };
  },
```

**ヘルパー**: `_getAllAIChars(state)` — AI団体全選手をフラットな配列で返す。

```javascript
function _getAllAIChars(state) {
  const chars = [];
  if (state.aiOrgs) {
    Object.values(state.aiOrgs).forEach(org => {
      (org.roster || []).forEach(f => chars.push(f));
    });
  }
  return chars;
}
```

### 1.3 初週の初期化

ゲーム開始時（`initNewGame` または `tickWeek` 初回）に `_glimpseAPrevValues` と `_glimpseAPrevTrust` が存在しない場合、現在値でスナップショットを作成する（= 初週は閾値跨ぎが検出されない）。

マイグレーション:
```javascript
if (!state._glimpseAPrevValues) {
  // 現在の関係値を prev にセット（初回は何も発火しない）
  const snap = {};
  Object.entries(state.relationships || {}).forEach(([key, rel]) => {
    snap[key] = { bond: rel.bond, rivalry: rel.rivalry };
  });
  state = { ...state, _glimpseAPrevValues: snap };
}
if (!state._glimpseAPrevTrust) {
  const trustSnap = {};
  (state.roster || []).forEach(f => { trustSnap[f.id] = f.trust || 50; });
  state = { ...state, _glimpseAPrevTrust: trustSnap };
}
```

これは `checkALayer` の冒頭で行う。

---

## Part 2: P5 — 絶好調終了通知

### 2.1 エンジン側の変更

tickWeek 内の既存の絶好調カウントダウン処理:

```
変更前:
        if (nc.hotStreak) {
          const hadSevere = nc.injury && nc.injury.type === '重傷';
          const hsResult = Engine.growthEvents.tickHotStreak(nc, hadSevere);
          nc = { ...nc, hotStreak: hsResult.fighter.hotStreak };
          if (hsResult.ended) events.push(`✨ ${nc.name}の絶好調期間が終了した`);
        }

変更後:
        if (nc.hotStreak) {
          const hadSevere = nc.injury && nc.injury.type === '重傷';
          const hsResult = Engine.growthEvents.tickHotStreak(nc, hadSevere);
          nc = { ...nc, hotStreak: hsResult.fighter.hotStreak };
          if (hsResult.ended) {
            events.push(`✨ ${nc.name}の絶好調期間が終了した`);
            // P5: 絶好調終了 Glimpse B層に追加
            pendingHotStreakEnds.push(nc.id);
          }
        }
```

`pendingHotStreakEnds` 配列は tickWeek 冒頭で `const pendingHotStreakEnds = [];` として初期化。

tickWeek 末尾（B層 Glimpse チェック前）で `s = { ...s, _pendingHotStreakEnds: pendingHotStreakEnds };` としてstateに載せる。

### 2.2 B層 Glimpse 内での処理

`checkBLayer` 内で `_pendingHotStreakEnds` を優先的にB層候補に追加:

```javascript
// 絶好調終了 → 100%発火、B層として表示
(state._pendingHotStreakEnds || []).forEach(fighterId => {
  const f = roster.find(c => c.id === fighterId);
  if (!f) return;
  const line = pickDialogueLine(GLIMPSE_HOTSTREAK_END_LINES, f);
  candidates.push({
    type: 'hotstreak_end',
    weight: 10, // 高重みで優先選出
    fighterId: f.id,
    fighterName: f.name,
    dialogue: line,
    tone: 'calm',
    label: '絶好調の終わり',
    guaranteed: true, // 抽選不要、確定選出
  });
});
```

`guaranteed: true` の候補は最大2件制限から除外し、確定でB層に含める。

---

## Part 3: P6 — B層 Glimpse エンジンロジック

### 3.1 checkBLayer ロジック

```javascript
  checkBLayer(state, rng) {
    const glimpses = [];
    const roster = (state.roster || []).filter(f => !f.isRental);
    const cooldowns = { ...(state._glimpseBCooldowns || {}) };
    const absWeek = ((state.season - 1) * 52) + state.week;
    const candidates = [];

    // ── 絶好調終了（P5: guaranteed） ──
    (state._pendingHotStreakEnds || []).forEach(fighterId => {
      const f = roster.find(c => c.id === fighterId);
      if (!f) return;
      const line = pickDialogueLine(GLIMPSE_HOTSTREAK_END_LINES, f);
      candidates.push({ type: 'hotstreak_end', weight: 10, fighterId: f.id,
        fighterName: f.name, dialogue: line, tone: 'calm', label: '絶好調の終わり', guaranteed: true });
    });

    // ── GL-01〜GL-10 ──
    roster.forEach(f => {
      if (f.injury && !['GL-10'].includes('')) {
        // GL-10（怪我中の焦り）は負傷中でもOK、他は負傷中スキップ
      }
      const cdKey = `B_${f.id}`;
      if (cooldowns[cdKey] && absWeek - cooldowns[cdKey] < 4) return; // 4週クールダウン

      // GL-01: 試合後の感情（今週試合に出場）
      if (f._weekAction === 'match' || f._weekAction === 'show') {
        if (Engine.rng.float(rng) < 0.15) {
          const matchResult = f._lastMatchResult || {};
          let subType = 'win';
          if (matchResult.won === false) subType = (matchResult.mq || 0) >= 70 ? 'goodLoss' : 'loss';
          else if (matchResult.won === true && (matchResult.mq || 0) >= 70) subType = 'greatWin';
          const lineObj = GLIMPSE_B_LINES['GL-01'][subType];
          if (lineObj) {
            candidates.push({ type: 'GL-01', subType, weight: 3, fighterId: f.id,
              fighterName: f.name, dialogue: pickDialogueLine(lineObj, f),
              tone: subType === 'loss' ? 'negative' : 'positive', label: '試合後の感情' });
          }
        }
      }

      // GL-02: 練習中のひとこと（練習中の非負傷選手）
      if (!f.injury && (f._weekAction === 'practice' || f._weekAction === 'intensive')) {
        if (Engine.rng.float(rng) < 0.08) {
          candidates.push({ type: 'GL-02', weight: 2, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-02'], f),
            tone: 'calm', label: '練習中のひとこと' });
        }
      }

      // GL-03: 信頼度の揺れ（trust変動±3以上）
      const prevTrust = (state._glimpseAPrevTrust || {})[f.id] || 50;
      const trustDelta = (f.trust || 50) - prevTrust;
      if (Math.abs(trustDelta) >= 3) {
        if (Engine.rng.float(rng) < 0.10) {
          const sub = trustDelta > 0 ? 'up' : 'down';
          candidates.push({ type: 'GL-03', subType: sub, weight: 3, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-03'][sub], f),
            tone: sub === 'up' ? 'positive' : 'negative', label: '信頼の揺れ' });
        }
      }

      // GL-04: 仲間への想い（bond 50+のペアが存在）
      if (state.relationships) {
        const bestBondPair = this._findBestRelPair(f.id, state, 'bond', 50);
        if (bestBondPair) {
          if (Engine.rng.float(rng) < 0.08) {
            const target = [...roster, ..._getAllAIChars(state)].find(c => c.id === bestBondPair.targetId);
            candidates.push({ type: 'GL-04', weight: 2, fighterId: f.id,
              fighterName: f.name, fighter2Id: bestBondPair.targetId,
              fighter2Name: target ? target.name : '???',
              dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-04'], f),
              tone: 'positive', label: '仲間への想い' });
          }
        }
      }

      // GL-05: ライバルへの意識（rivalry 30+のペアが存在）
      if (state.relationships) {
        const bestRivalPair = this._findBestRelPair(f.id, state, 'rivalry', 30);
        if (bestRivalPair) {
          if (Engine.rng.float(rng) < 0.10) {
            const target = [...roster, ..._getAllAIChars(state)].find(c => c.id === bestRivalPair.targetId);
            candidates.push({ type: 'GL-05', weight: 3, fighterId: f.id,
              fighterName: f.name, fighter2Id: bestRivalPair.targetId,
              fighter2Name: target ? target.name : '???',
              dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-05'], f),
              tone: 'dramatic', label: 'ライバルへの意識' });
          }
        }
      }

      // GL-06: 不出場の鬱憤（興行に出場できなかった選手）
      if (!f.injury && f._weekAction !== 'match' && f._weekAction !== 'show'
          && Engine.util.isShowWeek(state.week)) {
        if (Engine.rng.float(rng) < 0.12) {
          candidates.push({ type: 'GL-06', weight: 3, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-06'], f),
            tone: 'negative', label: '不出場の鬱憤' });
        }
      }

      // GL-07: コンディション不良（condition < 40）
      if ((f.condition || 100) < 40 && !f.injury) {
        if (Engine.rng.float(rng) < 0.10) {
          candidates.push({ type: 'GL-07', weight: 2, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-07'], f),
            tone: 'negative', label: 'コンディション不良' });
        }
      }

      // GL-08: 連敗のストレス（losingStreak >= 2）
      if ((f.losingStreak || 0) >= 2) {
        if (Engine.rng.float(rng) < 0.15) {
          candidates.push({ type: 'GL-08', weight: 4, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-08'], f),
            tone: 'negative', label: '連敗のストレス' });
        }
      }

      // GL-09: 連勝の自信（winStreak >= 3）
      if ((f.winStreak || 0) >= 3) {
        if (Engine.rng.float(rng) < 0.12) {
          candidates.push({ type: 'GL-09', weight: 2, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-09'], f),
            tone: 'positive', label: '連勝の自信' });
        }
      }

      // GL-10: 怪我中の焦り（負傷中）
      if (f.injury) {
        if (Engine.rng.float(rng) < 0.08) {
          candidates.push({ type: 'GL-10', weight: 2, fighterId: f.id,
            fighterName: f.name, dialogue: pickDialogueLine(GLIMPSE_B_LINES['GL-10'], f),
            tone: 'negative', label: '怪我中の焦り' });
        }
      }
    });

    // ── 抽選: guaranteed は確定、残りから重み付き最大2件 ──
    const guaranteed = candidates.filter(c => c.guaranteed);
    const pool = candidates.filter(c => !c.guaranteed);

    // 同一選手は1週1件まで（guaranteedを除く）
    const usedFighters = new Set(guaranteed.map(g => g.fighterId));
    const filteredPool = pool.filter(c => !usedFighters.has(c.fighterId));

    const maxSlots = 2;
    const selected = this._weightedSample(rng, filteredPool, maxSlots, usedFighters);

    const allSelected = [...guaranteed, ...selected];

    // クールダウン更新（guaranteed含む）
    allSelected.forEach(g => {
      if (!g.guaranteed) cooldowns[`B_${g.fighterId}`] = absWeek;
    });

    // glimpse オブジェクト構築
    allSelected.forEach(g => {
      glimpses.push({
        layer: 'B',
        type: g.type,
        subType: g.subType || null,
        tone: g.tone,
        label: g.label,
        speakerId: g.fighterId,
        speakerName: g.fighterName,
        targetId: g.fighter2Id || null,
        targetName: g.fighter2Name || null,
        dialogue: g.dialogue,
      });
    });

    // state更新
    const newState = {
      ...state,
      _glimpseBCooldowns: cooldowns,
    };
    // transient フラグクリア
    delete newState._pendingHotStreakEnds;

    return { glimpses, state: newState };
  },

  // ── ヘルパー ──
  _findBestRelPair(fighterId, state, axis, threshold) {
    const rels = state.relationships || {};
    let best = null;
    Object.keys(rels).forEach(key => {
      if (!key.startsWith(`${fighterId}>`)) return;
      const val = rels[key][axis] || 0;
      if (val >= threshold) {
        if (!best || val > best.value) {
          best = { targetId: parseInt(key.split('>')[1]), value: val };
        }
      }
    });
    return best;
  },

  _weightedSample(rng, pool, max, usedFighters) {
    const result = [];
    const remaining = [...pool];
    for (let i = 0; i < max && remaining.length > 0; i++) {
      const totalWeight = remaining.reduce((sum, c) => sum + c.weight, 0);
      if (totalWeight <= 0) break;
      let roll = Engine.rng.float(rng) * totalWeight;
      let picked = null;
      for (let j = 0; j < remaining.length; j++) {
        roll -= remaining[j].weight;
        if (roll <= 0) { picked = j; break; }
      }
      if (picked === null) picked = remaining.length - 1;
      const item = remaining.splice(picked, 1)[0];
      result.push(item);
      usedFighters.add(item.fighterId);
      // 同一選手の残り候補を除去
      for (let j = remaining.length - 1; j >= 0; j--) {
        if (remaining[j].fighterId === item.fighterId) remaining.splice(j, 1);
      }
    }
    return result;
  },
};
```

---

## Part 4: UI 統合

### 4.1 app.js — advanceWeek 内でのGlimpse表示

tickWeek 後の UI 処理（`advanceWeek` or `renderWeekScreen` 内）で、`_pendingGlimpseA` と `_pendingGlimpseB` をポップアップ表示する。

**A層**は既存の `showNotifEventToast` のモーダル版（P1で実装済み `notifModalOverlay`）を使う:

```javascript
// A層 Glimpse 表示
if (G._pendingGlimpseA && G._pendingGlimpseA.length > 0) {
  const glimpsesA = G._pendingGlimpseA;
  delete G._pendingGlimpseA;
  let delay = 0;
  glimpsesA.forEach(g => {
    setTimeout(() => showGlimpseAModal(g), delay);
    delay += 300;
  });
}
```

**B層**は既存の `showNotifEventToast` モーダルを B層スタイルで使う:

```javascript
// B層 Glimpse 表示（A層の後に表示）
if (G._pendingGlimpseB && G._pendingGlimpseB.length > 0) {
  const glimpsesB = G._pendingGlimpseB;
  delete G._pendingGlimpseB;
  let delay = glimpsesA ? glimpsesA.length * 300 + 200 : 0;
  glimpsesB.forEach(g => {
    setTimeout(() => showGlimpseBModal(g), delay);
    delay += 300;
  });
}
```

### 4.2 showGlimpseAModal — A層モーダル（二人表示対応）

`ui-common.js` に追加。P1で作成した `notifModalOverlay` を再利用:

```javascript
function showGlimpseAModal(glimpse) {
  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) return;

  const toneClass = glimpse.tone === 'gold' ? 'notif-gold'
    : glimpse.tone === 'warning' || glimpse.tone === 'danger' ? 'notif-warning'
    : glimpse.tone === 'dramatic' ? 'notif-dramatic' : '';

  let portraitsHtml = '';
  if (glimpse.targetId) {
    // 二人表示（bond/rivalry）
    portraitsHtml = `<div class="notif-modal-portraits">
      ${portraitImg(glimpse.speakerId, 100, 'notif-modal-face dual')}
      <span style="font-size:20px;padding:0 8px;align-self:center">${
        glimpse.axis === 'rivalry' ? '⚡' : glimpse.tone === 'negative' ? '💔' : '💙'
      }</span>
      ${portraitImg(glimpse.targetId, 100, 'notif-modal-face dual')}
    </div>
    <div style="display:flex;justify-content:center;gap:40px;margin-bottom:8px">
      <span style="font-size:13px;color:var(--text-sub)">${glimpse.speakerName}</span>
      <span style="font-size:13px;color:var(--text-sub)">${glimpse.targetName}</span>
    </div>`;
  } else {
    // 一人表示（trust）
    portraitsHtml = `<div class="notif-modal-portraits">
      ${portraitImg(glimpse.speakerId, 120, 'notif-modal-face')}
    </div>
    <div style="font-size:14px;color:var(--text-sub);margin-bottom:8px">${glimpse.speakerName}</div>`;
  }

  box.className = 'notif-modal-box' + (toneClass ? ` ${toneClass}` : '');
  box.innerHTML = `
    ${portraitsHtml}
    <div style="font-size:13px;color:var(--text-dim);margin-bottom:10px">${glimpse.label}</div>
    <div class="notif-modal-dialogue">「${glimpse.dialogue}」</div>
    <button class="notif-modal-btn" onclick="closeNotifModal()">OK</button>
  `;
  overlay.classList.add('active');
  Audio.play(glimpse.tone === 'gold' ? 'award' : glimpse.tone === 'dramatic' ? 'event' : 'event');

  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(closeNotifModal, 60000);
}
```

### 4.3 showGlimpseBModal — B層モーダル

B層は設計書ではスライドイン型だが、P1でモーダル化済みの `notifModalOverlay` を共用する（画面中央表示）。A層との差分: 顔100px、枠線が控えめ。

```javascript
function showGlimpseBModal(glimpse) {
  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) return;

  let portraitsHtml = '';
  if (glimpse.targetId) {
    portraitsHtml = `<div class="notif-modal-portraits">
      ${portraitImg(glimpse.speakerId, 80, 'notif-modal-face dual')}
      ${portraitImg(glimpse.targetId, 80, 'notif-modal-face dual')}
    </div>`;
  } else {
    portraitsHtml = `<div class="notif-modal-portraits">
      ${portraitImg(glimpse.speakerId, 100, 'notif-modal-face')}
    </div>`;
  }

  box.className = 'notif-modal-box';
  box.innerHTML = `
    ${portraitsHtml}
    <div style="font-size:13px;color:var(--text-sub);margin-bottom:4px">${glimpse.speakerName}</div>
    <div style="font-size:11px;color:var(--text-dim);margin-bottom:10px">${glimpse.label}</div>
    <div class="notif-modal-dialogue">「${glimpse.dialogue}」</div>
    <button class="notif-modal-btn" onclick="closeNotifModal()">OK</button>
  `;
  overlay.classList.add('active');

  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(closeNotifModal, 60000);
}
```

### 4.4 CSS追加（notif-dramatic / notif-gold）

```css
.notif-modal-box.notif-dramatic{border-color:rgba(155,89,182,0.4);
  box-shadow:0 0 24px rgba(155,89,182,0.12)}
.notif-modal-box.notif-gold{border-color:rgba(241,196,15,0.4);
  box-shadow:0 0 24px rgba(241,196,15,0.15)}
```

### 4.5 A層/B層のキュー管理

A層とB層のGlimpseが同時に複数ある場合、既存の `_eventPopupQueue` と同じパターンでキュー管理する。

```javascript
const _glimpseQueue = [];

function showGlimpseAModal(glimpse) {
  _glimpseQueue.push({ ...glimpse, _renderer: 'A' });
  if (_glimpseQueue.length === 1) _renderNextGlimpse();
}

function showGlimpseBModal(glimpse) {
  _glimpseQueue.push({ ...glimpse, _renderer: 'B' });
  if (_glimpseQueue.length === 1) _renderNextGlimpse();
}

function _renderNextGlimpse() {
  if (_glimpseQueue.length === 0) return;
  const g = _glimpseQueue[0];
  if (g._renderer === 'A') _renderGlimpseA(g);
  else _renderGlimpseB(g);
}

// closeNotifModal を拡張して次のGlimpseを表示
// 既存の closeNotifModal の末尾に追加:
//   _glimpseQueue.shift();
//   if (_glimpseQueue.length > 0) setTimeout(_renderNextGlimpse, 200);
```

`_renderGlimpseA` と `_renderGlimpseB` は 4.2/4.3 の `showGlimpseAModal`/`showGlimpseBModal` の内部描画ロジック。

---

## Part 5: セリフデータ — P4 A層

### 構造

```javascript
const GLIMPSE_A_LINES = {
  bond_60_up: { /* personality → archetype → lines[] */ },
  bond_80_up: { ... },
  bond_59_down: { ... },
  bond_39_down: { ... },
  rivalry_30_up: { ... },
  rivalry_50_up: { ... },
  rivalry_70_up: { ... },
  rivalry_29_down: { ... },
  trust_below_35: { ... },
  trust_below_20: { ... },
  trust_above_75: { ... },
};
```

`data.js` に配置。

---

### bond_60_up — 打ち解けた様子

```javascript
GLIMPSE_A_LINES.bond_60_up = {
  normal: {
    _default: ['最近、一緒にいるとなんだか居心地がいいな', '不思議と気が合う。一緒にいて楽だ'],
    ojousama: ['不思議と波長が合いますの。心地よい距離感ですわ'],
    delinquent: ['一緒にいると肩の力が抜けるっつーか', 'まぁ…悪くないやつだよ'],
    seductive: ['なかなか面白い人ね。もっと近くで見ていたい'],
    polite: ['一緒にいると自然体でいられます。ありがたいです'],
    cool: ['いいバランスだ。やりやすい'],
  },
  bold: {
    _default: ['いい空気だな。背中を預けられる気がする', 'なかなかやるじゃない。認めてあげる'],
    ojousama: ['良き仲間になれそうですわ。認めてあげます'],
    delinquent: ['見込みあるよ。面倒見てやるか', 'フン、気に入ったぜ'],
    seductive: ['気に入ったわ。なかなか味のある人ね'],
    polite: ['信頼関係が築けそうです。心強いですね'],
    cool: ['信用できる。それだけだ'],
  },
  quiet: {
    _default: ['……最近、隣にいると落ち着く', '……この距離が、静かで心地いい'],
    ojousama: ['おそばにいると……不思議と落ち着きますわ'],
    delinquent: ['…うるさいけど…嫌いじゃない'],
    seductive: ['一緒にいると……なんだか温かいの'],
    polite: ['……穏やかな時間を過ごせます'],
    cool: ['……悪くない距離感だ'],
  },
  shy: {
    _default: ['近くにいると…なんか安心するかも…', '話してると…緊張しなくなってきた…かな'],
    ojousama: ['おそばですと…少し安心できますの…'],
    delinquent: ['あ、うん…悪いやつじゃない…と思う'],
    seductive: ['一緒だと…ドキドキするけど…安心もする…'],
    polite: ['一緒にいると…少しだけ自分に自信が持てるんです…'],
    cool: ['そばにいると…なんだか…落ち着く…'],
  },
  easygoing: {
    _default: ['ノリが合うんだよね〜。一緒にいると楽しいわ', 'あはは、一緒にいると時間忘れちゃう'],
    ojousama: ['楽しくお過ごしできますの〜'],
    delinquent: ['つるんでると楽しいんだわ、まじで'],
    seductive: ['一緒にいて飽きないわ〜'],
    polite: ['気楽にお付き合いできて嬉しいです〜'],
    cool: ['なんかいい感じ〜。楽でいいわ'],
  },
  emotional: {
    _default: ['…考えると胸が温かくなるんです…！', '一緒にいると元気が出る…！ 大好き…！'],
    ojousama: ['大切に思っておりますの…！'],
    delinquent: ['こいつのことはよ…大事にしてやりてぇんだ…！'],
    seductive: ['放っておけないの…もう'],
    polite: ['一緒の時間が…とても大切なんです…！'],
    cool: ['…気になって仕方ない…'],
  },
  earnest: {
    _default: ['一緒に練習してて楽しいんです。もっと強くなれる気がして', '背中を見てると、自分も頑張ろうって思える'],
    ojousama: ['切磋琢磨できること、光栄ですわ'],
    delinquent: ['一緒にやってると気合入るんだよな。いい練習相手だ'],
    seductive: ['一緒のトレーニング、刺激があっていいわ'],
    polite: ['おかげで練習にも身が入ります。感謝しています'],
    cool: ['存在が刺激になる。いい関係だ'],
  },
};
```

### bond_80_up — 深い絆の芽生え

```javascript
GLIMPSE_A_LINES.bond_80_up = {
  normal: {
    _default: ['もう仲間とかそういう言葉じゃ足りない。大事な存在だ', 'この人がいるから、ここにいる意味がある'],
    ojousama: ['かけがえのない方ですわ。何物にも代えられません'],
    delinquent: ['ダチだ。何があっても守ってやる'],
    seductive: ['特別な存在。他の誰とも違うの'],
    polite: ['なくてはならない方です。心からそう思います'],
    cool: ['唯一の、本当の仲間だ'],
  },
  bold: {
    _default: ['最高のコンビだ。誰にも負けない', '二人なら怖いもんなしだ'],
    ojousama: ['わたくしたち、最強のペアですわ'],
    delinquent: ['相棒だ。文句あるか'],
    seductive: ['最高のコンビネーションよ、私たち'],
    polite: ['二人なら、どんな困難も乗り越えられます'],
    cool: ['一緒なら、どこまでも戦える'],
  },
  quiet: {
    _default: ['……私の光だ', '……そばにいてくれれば、それでいい'],
    polite: ['……太陽のような存在です'],
    cool: ['……この人だけは、信じられる'],
  },
  shy: {
    _default: ['いてくれるから…私、ここにいられるんです…', '笑顔を見ると…頑張れるんです…'],
  },
  easygoing: {
    _default: ['最高の相棒だよ〜。ずっと一緒にいたいな', '一緒にいると全部うまくいく気がするんだよね'],
    delinquent: ['一生の仲間だぜ。間違いない'],
  },
  emotional: {
    _default: ['この人のためなら何でもできる…！ 絶対に守る…！', '出会えてよかった…本当に…！'],
  },
  earnest: {
    _default: ['一緒に頂点を目指したい。二人ならきっと行ける', '最高のパートナー。この出会いに感謝してます'],
    polite: ['共に歩めること、何よりの幸せです'],
  },
};
```

### bond_59_down — 距離ができた

```javascript
GLIMPSE_A_LINES.bond_59_down = {
  normal: {
    _default: ['最近、目が合わなくなった気がする', '距離…少し開いたかも'],
    ojousama: ['少し距離ができたように感じますわ'],
    delinquent: ['最近よそよそしくねぇか…'],
    seductive: ['最近どこか冷たいわ…気のせいかしら'],
    polite: ['少し壁ができたようで…気のせいだといいんですが'],
    cool: ['距離感が…変わった'],
  },
  bold: {
    _default: ['なんか壁作ってねぇか？ 気に入らないな', 'ちっ、前はもっと話してたのに'],
    delinquent: ['おい、最近態度おかしくね？ ムカつくな'],
    cool: ['空気が変わった。…面倒だな'],
  },
  quiet: {
    _default: ['……遠くなった', '……気づけば、隣にいない'],
  },
  shy: {
    _default: ['うまく話せなくなっちゃった…どうしよう…', 'わ、私…何か悪いことしちゃったのかな…'],
  },
  easygoing: {
    _default: ['あれ〜、最近ちょっと素っ気ないなぁ', 'ん〜なんだろ、微妙に空気変わった？'],
  },
  emotional: {
    _default: ['離れていく…嫌だ…こんなの…', 'どうして…前みたいに話してくれないの…'],
  },
  earnest: {
    _default: ['この距離…自分の何がいけなかったんだろう', 'もう一度、分かり合えるように努力しなきゃ'],
    polite: ['関係を修復したいです…何とかしなければ'],
  },
};
```

### bond_39_down — 不和の兆し

```javascript
GLIMPSE_A_LINES.bond_39_down = {
  normal: {
    _default: ['…もうダメかもしれない', '顔を合わせるだけで気まずい'],
    ojousama: ['もう以前のようには戻れませんわ'],
    delinquent: ['顔見るとイラつくんだよ'],
    seductive: ['もう…合わないみたいね'],
    polite: ['もう以前のようには…すみません'],
    cool: ['…相容れない'],
  },
  bold: {
    _default: ['好きになれない。無理だ', '合わねぇ。それだけだ'],
    delinquent: ['虫が好かねぇんだよ'],
  },
  quiet: {
    _default: ['……もう、終わりだ'],
  },
  shy: {
    _default: ['…怖いです…近づきたくない…'],
  },
  easygoing: {
    _default: ['う〜ん、ちょっと合わないかもなぁ…'],
  },
  emotional: {
    _default: ['考えると苦しい…もう無理…'],
  },
  earnest: {
    _default: ['この関係…修復できる自信がない…', 'どこで間違えたんだろう…'],
  },
};
```

### rivalry_30_up — 因縁の始まり

```javascript
GLIMPSE_A_LINES.rivalry_30_up = {
  normal: {
    _default: ['…最近やたら気になる。負けたくない', 'どうしても…意識してしまう'],
    ojousama: ['負けたくありませんわ…こんな気持ちは初めて'],
    delinquent: ['目障りなんだよ…ぶっ潰してやる'],
    seductive: ['気になるわ…潰しがいがありそうね'],
    polite: ['どうしても負けたくないんです…この気持ちは…'],
    cool: ['この存在が…引っかかる'],
  },
  bold: {
    _default: ['面白いじゃない。叩き潰してあげるわ', 'やっと面白い相手が出てきたね'],
    delinquent: ['面ぁ見ると血が騒ぐんだよ'],
    cool: ['…倒すべき相手だ'],
    ojousama: ['打ち負かすこと、楽しみにしておりますわ'],
    seductive: ['なかなかの逸材ね。ふふ、楽しみ'],
  },
  quiet: {
    _default: ['……考えてしまう。どうしても', '……燃えている。自分の中の何かが'],
    cool: ['……気になる。ただ、それだけだが'],
  },
  shy: {
    _default: ['負けたくない…って思うんです…', '見ると…胸がざわざわして…'],
  },
  easygoing: {
    _default: ['いい勝負になりそうだね〜。燃えてきた', 'あはは、負けたくないなぁ'],
    delinquent: ['やり合うの、ワクワクすんだよな'],
  },
  emotional: {
    _default: ['絶対に負けない…！ 絶対に…！', '考えると胸が熱くなる…！'],
  },
  earnest: {
    _default: ['ライバルとして意識し始めている自分がいる', '超えることが、今の一番の目標だ'],
    polite: ['勝つために、もっと努力しなければなりません'],
  },
};
```

### rivalry_50_up — 宿敵として意識

```javascript
GLIMPSE_A_LINES.rivalry_50_up = {
  normal: {
    _default: ['絶対に負けられない。絶対にだ', '名前を聞くだけで拳が握りしまる'],
    ojousama: ['何としてでも超えてみせますわ'],
    delinquent: ['絶対ぶっ倒す。覚悟しろ'],
    seductive: ['どうしても許せない。必ず私が勝つわ'],
    polite: ['絶対に負けるわけにはいきません'],
    cool: ['倒すまで、止まれない'],
  },
  bold: {
    _default: ['全力を出せる相手だ。最高の敵！', '倒す。それがあたしの存在意義だ'],
    delinquent: ['這いつくばらせてやる…！'],
    cool: ['認めたくないが…最高の敵だ'],
    ojousama: ['打ち破ることが、わたくしの使命ですわ'],
  },
  quiet: {
    _default: ['……認めたくないけど、意識してる', '……そのことばかり考えている'],
    cool: ['……超えなければ、先へ進めない'],
  },
  shy: {
    _default: ['負けたくないんです…！ 絶対に…！', '考えると…怖いけど…燃える…'],
  },
  easygoing: {
    _default: ['本気でやり合いたい相手って、そうはいないよ', 'ふふ、考えると自然と気合入るわ'],
  },
  emotional: {
    _default: ['くっ…考えると熱くなる…！', '絶対に…超えてみせる…！！'],
  },
  earnest: {
    _default: ['この壁を超えない限り、自分の成長はない', '最大の壁。だからこそ、越えなきゃいけない'],
    polite: ['超えることが、私の覚悟です'],
  },
};
```

### rivalry_70_up — 宿命のライバル

```javascript
GLIMPSE_A_LINES.rivalry_70_up = {
  normal: {
    _default: ['もう運命みたいなものだと思ってる', 'この存在がなかったら、今の自分はいない'],
    ojousama: ['わたくしの宿命ですわ…それ以外に言葉がない'],
    delinquent: ['この勝負が全てだ。他はどうでもいい'],
    seductive: ['私の全て…最高の獲物よ'],
    polite: ['この戦いが…私のプロレス人生そのものです'],
    cool: ['決着をつけるまで、死んでも死にきれない'],
  },
  bold: {
    _default: ['こいつがいるから強くなれた。感謝してるよ…でも負けない', 'この戦いは一生続く。それでいい'],
    delinquent: ['生涯の敵だ。最後まで殴り合ってやる'],
    cool: ['生涯をかけた勝負になる'],
  },
  quiet: {
    _default: ['……この相手がいる限り、リングに立ち続ける', '……言葉はいらない。リングの上で語り合おう'],
  },
  shy: {
    _default: ['この人がいるから…私は強くなれたんです…', 'この戦いだけは…絶対に逃げません…'],
  },
  easygoing: {
    _default: ['この試合が一番楽しい。ずっとこの関係が続けばいいのに', '運命のライバルだね〜。最高だよ'],
  },
  emotional: {
    _default: ['この出会いがなければ今の私はなかった…！', 'この因縁に終わりなんてない…！ 永遠に戦い続ける…！'],
  },
  earnest: {
    _default: ['この存在が自分を高めてくれる。これが宿命というものか', '戦えることに感謝してる。でも次は絶対に勝つ'],
    polite: ['この切磋琢磨こそが、私の原動力です'],
  },
};
```

### rivalry_29_down — 因縁の終息

```javascript
GLIMPSE_A_LINES.rivalry_29_down = {
  normal: {
    _default: ['前ほど意識しなくなったかもしれない', 'あの因縁も…もう終わったのかな'],
    ojousama: ['もう過去のことですわ'],
    delinquent: ['…もう興味ねーよ'],
    seductive: ['もういいかしら。次を探さなきゃ'],
    polite: ['関係も、穏やかになってきました'],
    cool: ['…執着は、消えたか'],
  },
  bold: {
    _default: ['……もう終わったことだ', '因縁は決着がついた。次に進む'],
    delinquent: ['時代は終わりだ。もう眼中にねぇ'],
  },
  quiet: {
    _default: ['……もう、考えない', '……風が止んだ。そんな感覚だ'],
  },
  shy: {
    _default: ['前みたいに怖くなくなりました…', '普通に話せるようになれるかな…'],
  },
  easygoing: {
    _default: ['熱い関係も一段落かぁ。ちょっと寂しいね', 'まぁ因縁も永遠じゃないよね〜'],
  },
  emotional: {
    _default: ['因縁…終わっちゃったんだ…少し寂しい…', '……あの熱さが消えていく。これでいいのかな…'],
  },
  earnest: {
    _default: ['関係も変わった。前に進もう', 'あの因縁から学んだことは多い。次の目標を見つけなきゃ'],
  },
};
```

### trust_below_35 — 信頼の揺らぎ

```javascript
GLIMPSE_A_LINES.trust_below_35 = {
  normal: {
    _default: ['この団体で…本当にやっていけるのかな', '自分のこと、ちゃんと見てくれてるのかな…'],
    ojousama: ['この団体の運営方針に…疑問を感じますわ'],
    delinquent: ['ここ、ちゃんとしてんのかよ…不安になるぜ'],
    seductive: ['ここにいる意味…本当にあるのかしら'],
    polite: ['すみません…少し不安になってきました…'],
    cool: ['この環境に…疑問を感じ始めている'],
  },
  bold: {
    _default: ['この扱いはなんだ。あたしの実力を分かってんのか', 'ここにいていいのか…考え直す時期かもな'],
    delinquent: ['なめんじゃねぇぞ。あたしをもっと使え'],
    ojousama: ['わたくしの価値をご理解いただけていませんわね'],
  },
  quiet: {
    _default: ['……ここにいていいのか、分からなくなってきた'],
    cool: ['……この場所に、未来はあるのか'],
  },
  shy: {
    _default: ['私なんかが…ここにいて…迷惑じゃないですか…？'],
  },
  easygoing: {
    _default: ['う〜ん、最近ちょっとモヤモヤするなぁ…', 'まぁ大丈夫…だよね？ ちょっと不安だけど'],
  },
  emotional: {
    _default: ['不安…こんなんでいいの…？ 私のこと忘れてない…？'],
  },
  earnest: {
    _default: ['この団体の方針に…少し不安を感じています', '自分の居場所がここにあるのか…考えてしまう'],
    polite: ['恐縮ですが…少し運営に対して不安があります…'],
  },
};
```

### trust_below_20 — 不信感の極み

```javascript
GLIMPSE_A_LINES.trust_below_20 = {
  normal: {
    _default: ['もう限界かもしれない。ここにいる理由が見つからない', '…他の団体のことを、考え始めてしまっている'],
    ojousama: ['このような扱いを受ける覚えはございませんわ'],
    delinquent: ['こんなとこ、もういられるか。出て行ってやる'],
    seductive: ['ここにはもう何も残ってないわ'],
    polite: ['…すみません。もう限界かもしれません'],
    cool: ['ここにいる理由が…もうない'],
  },
  bold: {
    _default: ['ふざけんな。あたしの価値が分からないなら他を当たるぞ', 'この扱いは許さない。覚悟しておけ'],
    delinquent: ['あたしを舐めてんなら出てってやるよ。後悔するなよ'],
  },
  quiet: {
    _default: ['……（荷物をまとめ始めている）', '……もう、何も感じない'],
  },
  shy: {
    _default: ['ごめんなさい…ごめんなさい…もう…無理です…'],
  },
  easygoing: {
    _default: ['さすがにこれは…笑えないかも', 'あはは…って笑ってる場合じゃないよね、これ'],
  },
  emotional: {
    _default: ['もう…信じられない…！ どうして…！', '裏切られた…全部…嘘だったの…？'],
  },
  earnest: {
    _default: ['信頼してたのに…もうここでは頑張れないかもしれない', '自分の全力を尽くしてきたつもりです。でも、もう…'],
    polite: ['大変申し訳ありませんが…退団を検討させていただきます'],
  },
};
```

### trust_above_75 — 厚い信頼

```javascript
GLIMPSE_A_LINES.trust_above_75 = {
  normal: {
    _default: ['この団体に来てよかった。ここが自分の居場所だ', 'みんなと一緒にもっと上を目指したい'],
    ojousama: ['ここがわたくしの居場所ですわ。誇りに思います'],
    delinquent: ['ここはあたしの場所だ。誰にも渡さねぇ'],
    seductive: ['ここでなら…私らしくいられるわ'],
    polite: ['この団体の一員でいられて…本当に幸せです'],
    cool: ['ここが…自分の場所だ'],
  },
  bold: {
    _default: ['ここが最高の場所だ。あたしがもっと強くしてみせる', 'この団体を背負っていく覚悟はできてる'],
    delinquent: ['ここは最高だ。あたしがてっぺんまで連れてってやるよ'],
    ojousama: ['この団体の看板、わたくしが背負って差し上げますわ'],
  },
  quiet: {
    _default: ['……ここにいたい。ずっと', '……この場所を、守りたい'],
  },
  shy: {
    _default: ['ここに…いさせてもらえるなら…頑張ります…！', 'みんなが…優しくて…ここが大好きです…'],
  },
  easygoing: {
    _default: ['ここ最高〜！ みんなとやるの楽しいよ！', 'この団体、すっごく居心地いいんだよね〜'],
  },
  emotional: {
    _default: ['みんなのこと…大好き…！ この団体のために全力を尽くす…！', 'ここで出会えた仲間は宝物…絶対に裏切らない…！'],
  },
  earnest: {
    _default: ['この団体に貢献できるよう、これからも全力で努力します', 'ここでプロレスができる幸せを噛みしめています'],
    polite: ['ご期待に添えるよう、精一杯頑張らせていただきます'],
  },
};
```

---

## Part 6: セリフデータ — P5 絶好調終了

```javascript
const GLIMPSE_HOTSTREAK_END_LINES = {
  normal: {
    _default: ['絶好調は終わったけど…あの期間は無駄じゃなかった', '体が落ち着いてきた。でも前より強くなってる気がする'],
    ojousama: ['好調期は過ぎたようですけど…よい経験でしたわ'],
    delinquent: ['チッ、終わっちまったか。まぁ上等だ'],
    seductive: ['あら、いつもの私に戻ったみたい。でも悪くない気分よ'],
    polite: ['好調の波は去りましたが、得たものは大きかったです'],
    cool: ['調子は戻った。だが…確実に何かを掴んだ'],
  },
  bold: {
    _default: ['……身体が元に戻ってきた。でも悪くない、いい時間だった', 'あの好調で掴んだ感覚は忘れない。次に繋げてみせる'],
    delinquent: ['調子戻っちまったけど、あの感覚は覚えたぜ'],
    cool: ['好調は終わった。だが、この経験は糧になる'],
    ojousama: ['絶好調が過ぎましたわ。でも、得るものは十分でしたの'],
    seductive: ['ふふ、あの輝きは一時的だったみたいね。でもいい夢だったわ'],
  },
  quiet: {
    _default: ['……ふぅ。あの調子は続かないか', '……元に戻った。でも…少し、違う自分になれた気がする'],
    cool: ['……調子は落ち着いた。だが後退じゃない'],
    polite: ['好調は過ぎたようです…でも、悪くない気持ちです'],
  },
  shy: {
    _default: ['あ…なんか、普通に戻っちゃった…かな', 'すごく調子よかったのに…でも、いい思い出です…'],
  },
  easygoing: {
    _default: ['あ〜、絶好調タイム終了〜。楽しかったなぁ', 'まぁ好調もずっとは続かないよね〜。でもいい経験だった'],
    delinquent: ['終わっちまったかー。まぁ次また来るっしょ'],
    seductive: ['あらら、魔法が解けちゃったわ〜。でも楽しかった'],
  },
  emotional: {
    _default: ['終わっちゃった…あの最高の時間…でも、泣いてる場合じゃない！', 'あの感覚を…もう一度…必ず取り戻す…！'],
  },
  earnest: {
    _default: ['絶好調は終わったけど…あの期間で掴んだものがある', 'あの好調は偶然じゃない。努力の結果だ。また必ず来る'],
    polite: ['好調期間は終わりましたが、学びの多い日々でした'],
    ojousama: ['絶好調の時期を糧に、さらなる高みを目指しますわ'],
  },
};
```

---

## Part 7: セリフデータ — P6 B層 Glimpse

### 構造

```javascript
const GLIMPSE_B_LINES = {
  'GL-01': { win: {...}, loss: {...}, goodLoss: {...}, greatWin: {...} },
  'GL-02': { /* 練習中 */ },
  'GL-03': { up: {...}, down: {...} },
  'GL-04': { /* 仲間 */ },
  'GL-05': { /* ライバル */ },
  'GL-06': { /* 不出場 */ },
  'GL-07': { /* コンディション不良 */ },
  'GL-08': { /* 連敗 */ },
  'GL-09': { /* 連勝 */ },
  'GL-10': { /* 怪我中 */ },
};
```

---

### GL-01: 試合後の感情

```javascript
GLIMPSE_B_LINES['GL-01'] = {
  win: {
    normal: {
      _default: ['よし、勝てた。この調子で頑張ろう', '今日はいい試合ができた'],
      ojousama: ['勝利ですわ。当然の結果ですけどね'],
      delinquent: ['勝ったぜ。当然だろ'],
      seductive: ['ふふ、今日も勝ち。気分がいいわ'],
      polite: ['勝てました。応援のおかげです'],
      cool: ['……勝った。それでいい'],
    },
    bold: {
      _default: ['楽勝！ あたしに勝てるわけないでしょ', '当たり前よ。この程度で負けるわけないじゃない'],
      delinquent: ['へっ、雑魚が。話にならねぇ'],
      cool: ['勝った。次も同じだ'],
    },
    quiet: {
      _default: ['……勝った', '……悪くない'],
    },
    shy: {
      _default: ['か、勝てた…！ よかった…', '嬉しい…勝てて本当に嬉しいです…'],
    },
    easygoing: {
      _default: ['やった〜勝った〜！ 今日のご褒美何にしよう', '勝利！ いい一日だね〜'],
    },
    emotional: {
      _default: ['やった…！ 勝てた…！ 嬉しい…！', '勝った…！ この気持ち、最高…！'],
    },
    earnest: {
      _default: ['勝てた。でもまだ課題はある。次に繋げよう', '勝利を掴めたのは練習の成果。もっと上を目指す'],
      polite: ['勝利できました。引き続き精進します'],
    },
  },

  loss: {
    normal: {
      _default: ['負けた…。悔しい', '今日は相手が上だった。次は負けない'],
      ojousama: ['この敗北…受け入れがたいですわ'],
      delinquent: ['ちっ…次は絶対ぶっ倒す'],
      seductive: ['負けたのね…屈辱だわ'],
      polite: ['負けてしまいました…申し訳ないです'],
      cool: ['……足りないか'],
    },
    bold: {
      _default: ['くそっ…こんなはずじゃない', 'この借りは必ず返す'],
      delinquent: ['次会ったらぶっ飛ばしてやる…覚えてろ'],
    },
    quiet: {
      _default: ['………………', '……（無言で拳を握りしめている）'],
    },
    shy: {
      _default: ['う…また負けちゃった…ごめんなさい…', '私…ダメですよね…ごめんなさい…'],
    },
    easygoing: {
      _default: ['あちゃ〜、負けちゃった。次頑張ろ', '残念〜。でもいい勉強になったかな'],
    },
    emotional: {
      _default: ['くっ…悔しい…！ 涙が止まらない…', '負けた…負けた…もう嫌だ…！'],
    },
    earnest: {
      _default: ['悔しい…もっと練習しないと…', '負けた原因を分析して、必ず次に活かす'],
      polite: ['不甲斐ない試合をしてしまいました。申し訳ございません'],
    },
  },

  goodLoss: {
    normal: {
      _default: ['負けたけど…いい試合だった。得るものはあった', '悔しいけど、あの人は強かった。認めるしかない'],
      ojousama: ['敗北は悔しいですけど…素晴らしい試合でしたわ'],
      delinquent: ['負けたけど…あいつ、やるじゃねぇか'],
      seductive: ['負けは負け。でも…悪くない戦いだったわ'],
      polite: ['負けてしまいましたが…良い試合ができたと思います'],
      cool: ['……負けた。だが、後悔はない'],
    },
    bold: {
      _default: ['負けたけど…悔しいけど…いい試合だった', 'ちっ…認めてあげる。今日は向こうが上だった'],
    },
    quiet: {
      _default: ['……負けた。でも…悪くなかった'],
    },
    shy: {
      _default: ['負けちゃったけど…精一杯やれました…', '悔しいけど…いい試合だったって…思いたいです'],
    },
    easygoing: {
      _default: ['いい試合だったなぁ〜。負けたけど満足かも', '相手が強かった！ でも楽しかった〜'],
    },
    emotional: {
      _default: ['くっ…認めたくないけど、あの人は強かった…！', '負けた…でも…この試合は…忘れない…！'],
    },
    earnest: {
      _default: ['負けたが良い試合だった。この経験を糧にする', 'あの人の強さを体感できた。次は必ず超える'],
    },
  },

  greatWin: {
    normal: {
      _default: ['最高の試合で勝てた…！ この感覚を忘れない', '今日は自分でも驚くくらいいい試合ができた'],
      ojousama: ['素晴らしい勝利ですわ。この舞台に相応しい試合でしたの'],
      delinquent: ['最高の試合で最高の結果だ。文句ねぇだろ'],
      seductive: ['完璧な夜ね…最高の気分だわ'],
      polite: ['最高の試合で勝利できました。感無量です'],
      cool: ['……完璧だった'],
    },
    bold: {
      _default: ['これがあたしの実力だ！ 最高の試合で最高の勝利！', 'へへっ、見たか！ これがあたしの全力だ！'],
    },
    quiet: {
      _default: ['……（小さくガッツポーズをしている）', '……いい試合だった。全てが噛み合った'],
    },
    shy: {
      _default: ['す、すごい試合ができました…！ 信じられない…！', '勝てた…しかもいい試合で…夢みたい…'],
    },
    easygoing: {
      _default: ['最高〜〜〜！ こういう試合のためにプロレスやってんだよ！', 'いい試合で勝てるって最高だね〜！'],
    },
    emotional: {
      _default: ['最高…！ 最高の試合だった…！ 泣いちゃう…！', 'この瞬間のために生きてるんだ…！！'],
    },
    earnest: {
      _default: ['最高の試合で勝利。努力は裏切らないと証明できた', '自分の全てを出し切って勝てた。これ以上の幸せはない'],
    },
  },
};
```

### GL-02: 練習中のひとこと

```javascript
GLIMPSE_B_LINES['GL-02'] = {
  normal: {
    _default: ['今日の練習はいい感じだ', 'もう少しスタミナつけないとな…'],
    ojousama: ['今日のトレーニングも充実しておりますわ'],
    delinquent: ['もう一本いくぞ、おら！'],
    seductive: ['汗を流すのも悪くないわね'],
    polite: ['今日も精一杯練習させていただきます'],
    cool: ['……集中。あと一セット'],
  },
  bold: {
    _default: ['まだまだ！ もっと追い込むぞ！', 'こんなもんで満足できるか！ 次！'],
    delinquent: ['おらおら、休んでる暇ねぇぞ！'],
  },
  quiet: {
    _default: ['……（黙々とスクワットを続けている）', '………（汗が床に落ちる音だけが響く）'],
  },
  shy: {
    _default: ['あ、えっと…もう少し頑張ります…', '今日の練習…うまくできてるかな…'],
  },
  easygoing: {
    _default: ['練習たのし〜。いい汗かいてるわ', 'よーし、今日もがんばるぞ〜っと'],
  },
  emotional: {
    _default: ['絶対強くなる…！ もっともっと…！', '練習は裏切らない…頑張るぞ…！'],
  },
  earnest: {
    _default: ['一つ一つの練習を大切に。基礎が全ての土台だ', '今日のメニューも全力でこなす。手は抜かない'],
    polite: ['基本を怠らず、しっかり取り組みます'],
  },
};
```

### GL-03: 信頼度の揺れ

```javascript
GLIMPSE_B_LINES['GL-03'] = {
  up: {
    normal: {
      _default: ['最近いい感じだ。この団体で頑張ろうって思える', 'ちゃんと見てくれてるんだな。嬉しいよ'],
      ojousama: ['最近の待遇には満足しておりますわ'],
      delinquent: ['ここも悪くねぇな。やる気出てきたぜ'],
      seductive: ['最近いい扱い受けてる気がするわ。嬉しいわね'],
      polite: ['最近、居心地がとても良くなりました'],
      cool: ['……この環境は、悪くない'],
    },
    bold: {
      _default: ['この団体、やっぱり最高！ もっと盛り上げてみせる！'],
    },
    quiet: { _default: ['……ここにいてもいいんだな'] },
    shy: { _default: ['あ、あの…ここにいていいんですね…嬉しいです…'] },
    easygoing: { _default: ['最近めっちゃ楽しい〜。ここ大好き！'] },
    emotional: { _default: ['嬉しい…！ ここで頑張れるって幸せ…！'] },
    earnest: { _default: ['信頼に応えるよう、より一層精進します'] },
  },
  down: {
    normal: {
      _default: ['最近…なんだか扱いが雑じゃないか…？', 'ちょっと不安になってきた…大丈夫かな'],
      ojousama: ['最近のお扱い…少々不満がございますわ'],
      delinquent: ['おい、最近の扱い何だよ…舐めてんのか'],
      seductive: ['ねぇ…最近私のこと放置してない？'],
      polite: ['少し寂しいというか…不安が…'],
      cool: ['……この状況は、よくない'],
    },
    bold: {
      _default: ['何だよ最近の扱いは。あたしを軽く見てんのか'],
    },
    quiet: { _default: ['……（不安そうに窓の外を見ている）'] },
    shy: { _default: ['私…ちゃんとやれてますか…？ 不安です…'] },
    easygoing: { _default: ['あれ〜？ なんかちょっと居心地悪くなった？'] },
    emotional: { _default: ['どうして…私のこと忘れてるの…？ 悲しい…'] },
    earnest: { _default: ['何か改善すべき点があるなら教えてほしい…'] },
  },
};
```

### GL-04: 仲間への想い

```javascript
GLIMPSE_B_LINES['GL-04'] = {
  normal: {
    _default: ['一緒にいると練習も楽しいんだよな', '最近調子良さそうだな。嬉しいな'],
    ojousama: ['一緒の時間、わたくしにとって大切ですわ'],
    delinquent: ['つるむの、結構楽しいんだよな'],
    seductive: ['ちょっと気になってるの。いい距離感よね'],
    polite: ['一緒にいると安心します'],
    cool: ['…おかげで、ここにいる意味がある'],
  },
  bold: {
    _default: ['いい仲間だよ。一緒に強くなろう'],
    delinquent: ['ダチだ。大事にしてやるよ'],
  },
  quiet: { _default: ['……（そっと隣を見て、少し微笑んでいる）'] },
  shy: { _default: ['近くにいてくれると…安心する…'] },
  easygoing: { _default: ['一緒だとテンション上がるわ〜'] },
  emotional: { _default: ['大切にしたい…この関係を…！'] },
  earnest: {
    _default: ['切磋琢磨できる環境に感謝してる'],
    polite: ['ともに成長できることが嬉しいです'],
  },
};
```

### GL-05: ライバルへの意識

```javascript
GLIMPSE_B_LINES['GL-05'] = {
  normal: {
    _default: ['今何してるかな…気になる', '勝ったって聞くと…悔しいな'],
    ojousama: ['動向が…気になりますわ'],
    delinquent: ['顔が頭から離れねぇんだよ'],
    seductive: ['…考えちゃうのよね'],
    polite: ['活躍が気になってしまいます'],
    cool: ['……情報は、自然と入ってくる'],
  },
  bold: {
    _default: ['負けてたまるか。見てろよ'],
    delinquent: ['超えるまで止まらねぇ'],
  },
  quiet: { _default: ['……（試合映像を食い入るように見ている）'] },
  shy: { _default: ['…すごいな…私も頑張らなきゃ…'] },
  easygoing: { _default: ['気になって仕方ないんだよね〜'] },
  emotional: { _default: ['絶対…！ 絶対に…！！'] },
  earnest: {
    _default: ['意識するからこそ成長できる'],
    polite: ['追いつくため、日々研鑽します'],
  },
};
```

### GL-06: 不出場の鬱憤

```javascript
GLIMPSE_B_LINES['GL-06'] = {
  normal: {
    _default: ['今週は出番なしか…リングが恋しい', '試合に出たい。見てるだけはつらい'],
    ojousama: ['わたくしを出場させない理由がございまして？'],
    delinquent: ['なんで出してくれねぇんだよ…腕が鳴ってんのに'],
    seductive: ['私を干すつもり？ もったいないと思うけど'],
    polite: ['出場できなかったのは残念ですが…次の機会を待ちます'],
    cool: ['……出番がないのは、つらい'],
  },
  bold: {
    _default: ['なんであたしを使わないの！ 実力は見せてるでしょ！', 'リングに上がらせて！ くすぶってる場合じゃないのよ！'],
    delinquent: ['おいこら！ あたしを出せよ！ 暴れたいんだよ！'],
    ojousama: ['わたくしの出番がないとは…運営の怠慢ですわ'],
  },
  quiet: {
    _default: ['……（リングを見つめている）', '……出番がない。ただそれだけが、重い'],
  },
  shy: {
    _default: ['出られなかった…私じゃダメなんですか…', 'あの…次は…出してもらえますか…？'],
  },
  easygoing: {
    _default: ['まあ今週は仕方ないか〜。でもちょっと寂しいな', 'お休みかぁ。まぁたまにはね。…うん、寂しいけど'],
  },
  emotional: {
    _default: ['出たかった…リングに立ちたかった…！', '試合したい…みんなと一緒に戦いたい…！'],
  },
  earnest: {
    _default: ['出場できなかった…次こそは選んでもらえるように頑張らないと', '実力不足なら練習で補う。必ず次は出場する'],
    polite: ['出場機会をいただけるよう、より一層努力いたします'],
  },
};
```

### GL-07: コンディション不良

```javascript
GLIMPSE_B_LINES['GL-07'] = {
  normal: {
    _default: ['体が重い…コンディションが上がらない', '調子悪いな…少し休んだ方がいいかも'],
    ojousama: ['お体の調子が…あまり芳しくありませんわ'],
    delinquent: ['くそ…体がついてこねぇ'],
    seductive: ['体が言うこと聞かないわ…もどかしい'],
    polite: ['申し訳ありません…少し体調が…'],
    cool: ['……体が鈍い。これは…まずいな'],
  },
  bold: {
    _default: ['ちっ、体がなまってる…休んでる場合じゃないのに'],
    delinquent: ['くそっ、こんな体じゃ戦えねぇだろ…！'],
  },
  quiet: { _default: ['……体が、動かない'] },
  shy: { _default: ['体が…重くて…すみません…迷惑かけて…'] },
  easygoing: { _default: ['う〜ん、体がだるいなぁ。ちょっと休もっかな'] },
  emotional: { _default: ['体が動かない…悔しい…早く元気になりたい…'] },
  earnest: {
    _default: ['コンディションが良くない。焦らず回復に努めよう'],
    polite: ['体調管理を怠りました。しっかり立て直します'],
  },
};
```

### GL-08: 連敗のストレス

```javascript
GLIMPSE_B_LINES['GL-08'] = {
  normal: {
    _default: ['また負けた…どうすればいいんだ', '連敗が止まらない…自信がなくなってきた'],
    ojousama: ['連敗…こんなはずでは…ありませんわ'],
    delinquent: ['くそが…何連敗してんだよあたしは…'],
    seductive: ['負け続き…こんなの私じゃないわ'],
    polite: ['連敗してしまって…皆さんに申し訳なくて…'],
    cool: ['……勝てない。何が足りない'],
  },
  bold: {
    _default: ['…このまま終わるつもりはない', 'いつまで負け続ける気だ…！ 目を覚ませ、あたし！'],
    delinquent: ['ふざけんな…いつまで負けてんだよ…！'],
  },
  quiet: {
    _default: ['……（無言で練習を続けている）', '……（壁に拳を押し当てている）'],
  },
  shy: {
    _default: ['わ、私…足引っ張ってますよね…ごめんなさい…', '勝てない…勝てない…どうしたらいいの…'],
  },
  easygoing: {
    _default: ['あはは…笑えない状況だね…さすがに凹むわ', 'う〜ん、負けが込んでるなぁ…どうしたもんか'],
  },
  emotional: {
    _default: ['もう…どうしたらいいの…', '勝てない…私なんかもう…うっ…'],
  },
  earnest: {
    _default: ['連敗の原因を見つけなければ。何かが間違っているはずだ', '負けが続いている。でも腐らない。必ず糸口はある'],
    polite: ['不甲斐ない結果が続いています…何とか打開しなければ'],
  },
};
```

### GL-09: 連勝の自信

```javascript
GLIMPSE_B_LINES['GL-09'] = {
  normal: {
    _default: ['いい流れが来てる。この調子を維持したい', '連勝中…自信がついてきた'],
    ojousama: ['連勝ですわ。わたくしの実力が証明されましたわね'],
    delinquent: ['勝ちまくってるぜ。誰か止めてみろよ'],
    seductive: ['最近負けなしよ。ふふ、誰が相手でも返り討ちだわ'],
    polite: ['連勝させていただいています。ありがたいことです'],
    cool: ['……負ける気がしない'],
  },
  bold: {
    _default: ['絶好調！ この波に乗って一気に行くぞ！', '今のあたしを止められるやつはいない！'],
    delinquent: ['止まらねぇぜ！ 全員ぶっ倒す！'],
  },
  quiet: { _default: ['……いい流れだ。このまま'] },
  shy: { _default: ['連勝…嘘みたい…でも自信になってます…！'] },
  easygoing: { _default: ['連勝〜！ ノッてるね〜。この波乗りこなすぞ〜'] },
  emotional: { _default: ['勝ち続けてる…！ この調子で…もっと…！！'] },
  earnest: {
    _default: ['連勝は努力の証。でも油断はしない。謙虚にいこう'],
    polite: ['結果がついてきていますが、慢心せず精進します'],
  },
};
```

### GL-10: 怪我中の焦り

```javascript
GLIMPSE_B_LINES['GL-10'] = {
  normal: {
    _default: ['早くリングに戻りたい…体が疼く', '怪我…早く治してくれ…'],
    ojousama: ['このお体が恨めしいですわ…早くリングに'],
    delinquent: ['くそ、いつまで寝てりゃいいんだよ…'],
    seductive: ['退屈…早くリングに立ちたいわ'],
    polite: ['早く復帰して、皆さんのお役に立ちたいです'],
    cool: ['……じっとしているのが、一番つらい'],
  },
  bold: {
    _default: ['こんなとこで寝てる場合じゃねぇんだよ…！', 'あたしがいない間に追い抜かれてたまるか'],
    delinquent: ['チッ…じっとしてらんねぇ。もう走れるだろ…！'],
  },
  quiet: {
    _default: ['……（天井を見つめている）', '……リングが、遠い'],
  },
  shy: {
    _default: ['みんなに置いてかれちゃう…怖い…', '怪我…早く治って…お願い…'],
  },
  easygoing: {
    _default: ['怪我かぁ…暇だなぁ。早く治らないかな〜', 'じっとしてるの苦手なんだよね〜。あーリング恋しい'],
  },
  emotional: {
    _default: ['みんなが戦ってるのに…私だけ…悔しい…！', 'リングに…早く…戻りたい…！！'],
  },
  earnest: {
    _default: ['リハビリに全力で取り組む。一日でも早く復帰する', '怪我の間もできることはある。頭を鍛える時間にする'],
    polite: ['復帰に向けて、今できることを精一杯やります'],
  },
};
```

---

## Part 8: セーブデータマイグレーション

以下のフィールドを新規追加（既存セーブに存在しない場合はデフォルト値で初期化）:

| フィールド | デフォルト | 用途 |
|---|---|---|
| `_glimpseACooldowns` | `{}` | A層クールダウン記録 |
| `_glimpseAPrevValues` | `null` | 前週のbond/rivalry値（初回にcheckALayer内で自動初期化） |
| `_glimpseAPrevTrust` | `null` | 前週のtrust値（同上） |
| `_glimpseBCooldowns` | `{}` | B層クールダウン記録 |

transient フィールド（セーブ不要）:
- `_pendingGlimpseA` — A層Glimpseキュー（UI表示後に消去）
- `_pendingGlimpseB` — B層Glimpseキュー（同上）
- `_pendingHotStreakEnds` — 絶好調終了検出（B層処理後に消去）

### セーブデータ除外

`exportSave` / `importSave` で `_pendingGlimpseA`, `_pendingGlimpseB`, `_pendingHotStreakEnds` を除外すること。

---

## チェックリスト

### P4: A層 Glimpse

- [ ] bond 60到達: 二人の顔が表示され、セリフが出る
- [ ] bond 80到達: gold演出でセリフが出る
- [ ] bond 59以下: negative演出でセリフが出る
- [ ] bond 39以下: negative演出でセリフが出る
- [ ] rivalry 30/50/70到達: dramatic演出でセリフが出る
- [ ] rivalry 29以下: calm演出で因縁終息のセリフが出る
- [ ] trust 35未満: warning演出でセリフが出る（一人表示）
- [ ] trust 20未満: danger演出でセリフが出る（一人表示）
- [ ] trust 75以上: positive演出でセリフが出る（一人表示）
- [ ] 同一ペア/選手のクールダウンが機能する（bond/rivalry=8週、trust=12週）
- [ ] 発火率が設計通りに機能する（100%のものは毎回発火）
- [ ] A層は件数制限なし

### P5: 絶好調終了

- [ ] 絶好調が終了したタイミングでB層モーダルが表示される
- [ ] セリフが性格×アーキタイプに応じて変わる
- [ ] guaranteed=true で必ず表示される（2件制限から除外）

### P6: B層 Glimpse

- [ ] GL-01〜GL-10がそれぞれの条件で発火する
- [ ] 週あたり最大2件（guaranteed除く）
- [ ] 同一選手は1週1件まで
- [ ] 同一選手は4週クールダウン
- [ ] 二人表示（GL-04, GL-05）で二つの顔が表示される
- [ ] 重み付き抽選が機能する

### 共通

- [ ] 既存セーブデータでエラーが出ない（マイグレーション）
- [ ] auto-sim で violation が出ない
- [ ] A層→B層の順序で表示される
- [ ] 複数Glimpseがキューで順番に表示される
- [ ] OKボタンで閉じて次のGlimpseが表示される

---

## 禁止事項

- **テストコードを書かない**: Keisukeが手動確認する
- **ブラウザ起動やスクリーンショット取得をしない**
- **既存のスナップショットシステムを変更しない**（並存）
- **既存のbond/rivalry/trust更新ロジックを変更しない**
- **セリフデータを省略しない**: 本specに記載された全データをそのまま実装すること
