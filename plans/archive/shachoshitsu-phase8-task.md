# Phase 8: 不確実性メカニズム (性格×アーキタイプで効き目±50%変動) — 実装指示書

> **対象**: Claude Code (次セッション)
> **所要時間目安**: 1〜3時間 (Phase 7 の下地があるので短め)
> **前提コミット**: `8339cc6` (Phase 7 完了) 以降
> **目的**: 同じ書類でも選手の性格・アーキタイプで信頼度への効き目が ±50% 変動するようにし、「刺せば必ず望み通りに効く」万能感を崩す。spec v1.0 の Phase 7 で「遅延発現で実現する」としていた「即時万能感の排除」を、Phase 8 の不確実性に完全移行させる。
> **承認ポイント**: 実装完了後、Keisuke さんに動作確認依頼 → 承認されたら Phase 9 (ビジュアル磨きとヘルプ) へ
> **spec 相当箇所**: `specs/shachoshitsu-spec-v1.0.md` §6 (不確実性メカニズム) の設計をそのまま採用

---

## Phase 7 で準備済みの下地

Phase 7 で既に以下が入っている。Phase 8 はこの下地を活用するだけで完結する。

- `fighter.pendingTrustDeltas` エントリに `finalMult: 1.0` フィールドが既存
- `Engine.shachoshitsu.applyPendingTrustDeltas` が毎週 `perWeekDelta × finalMult` を適用する実装済み
- `Engine.shachoshitsu.execute` に `queueTrust` ローカルヘルパーが既存(trainer/camp が使用)
- `applyTrust` ローカルヘルパーも既存(即時型書類が使用)
- 結果モーダル `showDecisionResultModal` が changes + 話者ヒーロー+セリフを表示する構造は Phase 5/7 で完成済み

Phase 8 では:
1. マトリクス2本を `src/data.js` に追加
2. `Engine.shachoshitsu.calcUncertainty(docId, fighter)` を新設
3. `execute` 内の trust 適用箇所で `calcUncertainty` を呼んで finalMult を反映
4. 結果モーダルにトーンマーカー(🌟 / 💤)を追加
5. trainer/camp (遅延型) の予告文言を finalMult 帯で3段階に出し分け

これだけ。

---

## 事前に必ず読むべきファイル (順序厳守)

1. **この指示書**: `plans/shachoshitsu-phase8-task.md`
2. **spec**: `specs/shachoshitsu-spec-v1.0.md` §6 (不確実性メカニズム)
3. **Phase 7 の実装コード**: `src/management.js` L12576 付近 (`applyTrust` + `queueTrust`)、L12761 付近 (`applyPendingTrustDeltas`)
4. **CLAUDE.md**: 「数値哲学」「やらないことリスト」
5. **memory**: `memory/feedback_player_text_no_internal_tokens.md`

---

## 現状把握メモ

### 性格・アーキタイプの実データ

`memory/MEMORY.md` と `src/data.js` のキャラ定義より:

- **性格 (6種)**: `normal` / `bold` / `quiet` / `easygoing` / `earnest` / `emotional`
- **アーキタイプ (5種)**: `normal` / `ojousama` / `delinquent` / `cool` / `seductive`

spec §6.3 の表には `shy` が含まれているが、プロジェクトには存在しないので **skip**。6性格 × 7書類 (bonus/encourage/refresh_leave/party/trainer/camp/media) のマトリクスになる。

spec §6.4 のアーキタイプ表は 4非normal × 3書類 (bonus/party/media) を扱っている。Phase 8 では全7書類を対象にし、記載のない書類は 1.00 (影響なし)。

### DECISION_DOCS の場所 (`src/data.js`)

- `DECISION_DOC_ORDER`: L11676-11679
- `DECISION_DOCS`: L11681 〜 L11824 (末尾 `hireCoach` で閉じる)
- **Phase 8 のマトリクスは L11824 直後に追加** (コメント付きセクションとして)

### Engine.shachoshitsu.execute (`src/management.js`)

- L12576-12584: `applyTrust(fighter, delta, skipOvrScale)` — 即時型
- L12586-12607 付近: `queueTrust(fighter, delta, source, weeks, skipOvrScale)` — 遅延型 (Phase 7 追加)
- L12601-12611 付近: 書類ごとの分岐 (bonus, encourage, refresh_leave, trainer, media)
- L12713 付近: party / camp (team書類)
- **変更が必要なのは `queueTrust` のシグネチャ (finalMult を受け取るよう拡張) + 各書類分岐での calcUncertainty 呼び出し**

### 結果モーダル (`src/ui-common.js` L6349〜)

`showDecisionResultModal(displayData)` — `displayData.reactionTone` を読んでトーン表示する (今は存在しない)。

### 呼び出し側 (`src/app.js` L6914〜 `executeDecision`)

`Engine.shachoshitsu.execute` の返り値 `result` から `displayData` を構築している。ここに `reactionTone` を載せる。

---

## Phase 8 で実施するタスク

### Task 1: マトリクスを data.js に追加

`src/data.js` の L11824 (`DECISION_DOCS` 閉じ括弧) の直後に以下を追加:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// 社長室 Phase 8: 不確実性マトリクス (spec §6.3 / §6.4)
// 決裁の信頼度効果が、選手の性格×アーキタイプで ±50% 変動する。
// これにより「刺せば必ず望み通りに効く」万能感を崩し、
// 「刺してみないとわからない」体感を導入する。
//
// 計算式: finalMult = clamp(personalityMult × archetypeMult, 0.5, 1.5)
// finalMult は applyTrust/queueTrust で効果量に直接乗算される。
// ─────────────────────────────────────────────────────────────────────────────

// 性格 × 書類 マトリクス (6性格 × 7書類)
// spec §6.3 の shy は project に存在しないため除外。
const DECISION_PERSONALITY_MULT = {
  normal:    { bonus: 1.00, encourage: 1.00, refresh_leave: 1.00, party: 1.00, trainer: 1.00, camp: 1.00, media: 1.00 },
  bold:      { bonus: 0.80, encourage: 0.70, refresh_leave: 0.90, party: 1.00, trainer: 1.20, camp: 1.20, media: 1.00 },
  quiet:     { bonus: 1.00, encourage: 1.20, refresh_leave: 1.10, party: 0.70, trainer: 1.00, camp: 0.90, media: 0.60 },
  easygoing: { bonus: 1.10, encourage: 1.00, refresh_leave: 1.00, party: 1.20, trainer: 0.90, camp: 1.10, media: 1.10 },
  earnest:   { bonus: 0.90, encourage: 1.20, refresh_leave: 1.10, party: 0.90, trainer: 1.30, camp: 1.20, media: 1.00 },
  emotional: { bonus: 1.30, encourage: 1.40, refresh_leave: 1.20, party: 1.10, trainer: 1.00, camp: 1.10, media: 1.20 },
};

// アーキタイプ × 書類 マトリクス (normal 以外の4種)
// 記載のないアーキタイプ+書類の組合せは 1.00 (影響なし)
// spec §6.4 を拡張して全書類を扱う
const DECISION_ARCHETYPE_MULT = {
  ojousama:   { bonus: 0.70, party: 1.00, media: 1.10, camp: 0.80 },   // 金には動じない、合宿は好まない
  delinquent: { bonus: 1.30, party: 1.30, media: 0.80, trainer: 1.10 }, // 金と酒は効く、メディアは嫌う、体育会系は好む
  cool:       { bonus: 0.70, party: 0.60, media: 0.80, encourage: 0.80 }, // 全体的に冷めている
  seductive:  { bonus: 1.00, party: 1.10, media: 1.30, refresh_leave: 1.10 }, // 華やかな場で輝く
};
```

**注意**:
- `normal` アーキタイプのエントリは存在しないので `{}` で参照するとすべて 1.00 になる — 意図通り
- camp と encourage と refresh_leave は spec §6.4 に無いので、narrative から補った (ojousama の camp: 合宿は好まない 0.80、delinquent の trainer: 体育会系は好む 1.10、cool の encourage: 距離感がある 0.80、seductive の refresh_leave: 休養を楽しむ 1.10)
- これらは仮値。auto-sim + 実機で尖りすぎていたら後で調整

### Task 2: Engine.shachoshitsu.calcUncertainty / classifyTone 新設

`src/management.js` の `Engine.shachoshitsu` オブジェクト内、`getDoc` の直後あたりに追加:

```javascript
// ── Phase 8: 不確実性計算 ──────────────────────────────────────────────
// 書類ID と選手から finalMult (0.5〜1.5) を計算して返す。
// personalityMult × archetypeMult を clamp 範囲に収める。
calcUncertainty(docId, fighter) {
  if (!fighter || !docId) return 1.0;
  if (typeof DECISION_PERSONALITY_MULT === 'undefined') return 1.0;
  const personality = fighter.personality || 'normal';
  const archetype = fighter.archetype || 'normal';
  const pRow = DECISION_PERSONALITY_MULT[personality] || DECISION_PERSONALITY_MULT.normal;
  const pMult = pRow && pRow[docId] != null ? pRow[docId] : 1.0;
  const aRow = (typeof DECISION_ARCHETYPE_MULT !== 'undefined' && DECISION_ARCHETYPE_MULT[archetype]) || {};
  const aMult = aRow[docId] != null ? aRow[docId] : 1.0;
  const mult = pMult * aMult;
  return Math.max(0.5, Math.min(1.5, mult));
},

// ── Phase 8: トーン分類 ───────────────────────────────────────────────
// finalMult を3段階のトーンに分類する。結果モーダルのマーカーに使う。
// 返り値: '🌟' (響いた) | null (普通) | '💤' (響かなかった)
classifyTone(finalMult) {
  if (finalMult == null) return null;
  if (finalMult >= 1.2) return 'high';
  if (finalMult < 0.8) return 'low';
  return null;
},
```

### Task 3: queueTrust に finalMult パラメータを追加

現在の `queueTrust` は finalMult を常に 1.0 で埋めている (Phase 7 の下地)。これを呼び出し側から受け取るように拡張。

```javascript
// 旧 (Phase 7):
const queueTrust = (fighter, delta, source, weeks, skipOvrScale) => {
  // ...
  const entry = {
    source, totalDelta: adjusted,
    perWeekDelta: perWeek, weeksRemaining: weeks,
    startedWeek: state.week,
    finalMult: 1.0,
  };
  // ...
};

// 新 (Phase 8):
const queueTrust = (fighter, delta, source, weeks, finalMult, skipOvrScale) => {
  // ... 既存処理
  const entry = {
    source, totalDelta: adjusted,
    perWeekDelta: perWeek, weeksRemaining: weeks,
    startedWeek: state.week,
    finalMult: finalMult != null ? finalMult : 1.0,
  };
  // ...
};
```

`applyTrust` は即時反映なので finalMult を外で計算して delta に乗算するだけでよく、シグネチャ変更不要。

### Task 4: 各書類分岐で calcUncertainty を呼ぶ

`execute` 内の個人書類分岐 (L12601 付近〜):

```javascript
// bonus
} else if (docId === 'bonus') {
  const repeatCount = f._bonusRepeat || 0;
  const trustGain = Math.max(0.77, (doc.effect.trust || 0) - repeatCount * 1.53);
  const mult = Engine.shachoshitsu.calcUncertainty('bonus', f);
  f = applyTrust(f, trustGain * mult);
  currentFinalMult = mult;
  f._bonusRepeat = repeatCount + 1;
  // ...
}
```

同じパターンを以下の書類に適用:
- **encourage**: `const mult = Engine.shachoshitsu.calcUncertainty('encourage', f);` を slump/trust 判定の前に計算。trust 上昇とモメンタム両方に乗算するか? → **trust のみに適用**。slumpMomentum は回復メカニクスなので不確実性対象外
- **refresh_leave**: trust にのみ mult 適用。condition 回復と slumpMomentum は即時固定
- **trainer**: `queueTrust(f, doc.effect.trust || 5.97, 'trainer', gb.weeks, mult)` で finalMult を渡す。`currentFinalMult = mult` を記録
- **media**: trust にのみ mult 適用。condition と orgPopDelta は即時固定

team書類 (party, camp) の場合、各選手の mult が異なるため、**team の結果モーダルにはトーン表示なし** とする。party/camp の実装は:

```javascript
// party
roster = roster.map(f => {
  if (f.injury) return f;
  const mult = Engine.shachoshitsu.calcUncertainty('party', f);
  return applyTrust(f, (doc.effect.trust || 1.84) * mult);
});

// camp
roster = roster.map(f => {
  if (f.injury) return f;
  const mult = Engine.shachoshitsu.calcUncertainty('camp', f);
  const queued = queueTrust(f, doc.effect.trust || 1.84, 'camp', gb.weeks, mult);
  return { ...queued, _trainerBuff: { weeksLeft: gb.weeks, mult: gb.mult } };
});
```

### Task 5: execute 返り値に reactionTone を載せる

`execute` 関数の冒頭付近に `let currentFinalMult = 1.0;` を追加し、個人書類分岐で各書類が自分の値をセット。

返り値構築部 (L12748 付近) に追加:

```javascript
const result = {
  roster, lockerRoomMorale, funds: newFunds, cost: actualCost, events, reactionKey,
  reactionFighterId, changes, _decisionWeekUsed, decisionPoints: newDp,
};
if (orgPopDelta) result.orgPopDelta = orgPopDelta;
if (updatedRelationships) result.relationships = updatedRelationships;
// Phase 8: 個人書類のみトーン情報を返す (team書類は finalMult が選手ごとに異なるため無視)
if (doc.effect && doc.effect.target === 'individual') {
  result.reactionTone = Engine.shachoshitsu.classifyTone(currentFinalMult);
  result.finalMult = currentFinalMult;  // デバッグ/表示用
}
return result;
```

### Task 6: 結果モーダルにトーンマーカー追加

`src/ui-common.js` の `showDecisionResultModal` に:

1. `displayData.reactionTone` を読む (存在すれば)
2. トーンに応じたマーカーを changes の前に表示

```javascript
// ── Phase 8: 不確実性トーンマーカー ──
let toneHtml = '';
if (reactionTone === 'high') {
  toneHtml = `<div class="decision-result-tone high">🌟 深く刺さった</div>`;
} else if (reactionTone === 'low') {
  toneHtml = `<div class="decision-result-tone low">💤 あまり響かなかったようだ</div>`;
}

// ... modal.innerHTML の中で heroHtml の直後に挿入
modal.innerHTML = `
  <div class="shachoshitsu-decision-title">...</div>
  <div class="decision-result-body" data-variant="${variant}">
    ${heroHtml}
    ${toneHtml}     <!-- ここ -->
    ${rosterHtml}
    ${flavorHtml}
    ${changesHtml}
    ${costHtml}
  </div>
  ...
`;
```

CSS は `src/index.html` の `.decision-result-*` の近くに追加:

```css
.decision-result-tone {
  text-align: center;
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  margin: 8px 20px;
  border-radius: 6px;
  letter-spacing: 0.05em;
}
.decision-result-tone.high {
  background: rgba(212, 168, 67, 0.18);
  color: #e8c35c;
  border: 1px solid rgba(212, 168, 67, 0.45);
  text-shadow: 0 0 8px rgba(212, 168, 67, 0.35);
}
.decision-result-tone.low {
  background: rgba(160, 160, 160, 0.10);
  color: #a8a8a8;
  border: 1px solid rgba(160, 160, 160, 0.25);
}
```

### Task 7: trainer の予告文言をトーン帯で出し分け

`src/management.js` の trainer 分岐で changes 構築 (L12690 付近):

```javascript
// Phase 7+8: trainer は trust が即時変わらないので専用メッセージ + tone に応じて文言変化
if (docId === 'trainer') {
  const gb = doc.effect.growthBoost || { weeks: 4, mult: 1.3 };
  const tone = Engine.shachoshitsu.classifyTone(currentFinalMult);
  let trustText;
  if (tone === 'high') {
    trustText = `今後${gb.weeks}週にわたって、予想以上に深く響いていきそうだ`;
  } else if (tone === 'low') {
    trustText = `今後${gb.weeks}週にわたって、わずかに効いていくだけかもしれない`;
  } else {
    trustText = `今後${gb.weeks}週にわたって、じわじわと育っていく`;
  }
  changes.push({ label: '信頼度', emoji: '🤝', text: trustText });
  changes.push({ label: '成長速度', emoji: '📈', text: `${gb.weeks}週間 +${Math.round((gb.mult - 1) * 100)}%` });
} else if (_after.trust !== _before.trust) {
  // 即時型書類 (bonus/refresh_leave/encourage/media) は従来通り describeChange の質的表現
  changes.push({ label: '信頼度', emoji: '🤝', text: Engine.trust.describeChange(_after.trust - _before.trust) });
}
```

**camp の team changes は固定文言のまま**。finalMult が選手ごとに異なるので「全員まとめて」予告することはしない。

### Task 8: app.js executeDecision で reactionTone を displayData に渡す

`src/app.js` の `executeDecision` 関数 (L6914 付近)、結果モーダルに渡す displayData を構築する箇所:

```javascript
// 既存の displayData 構築に追加
displayData.reactionTone = result.reactionTone || null;
```

具体的な行は実コードを確認して配置。`App.encourageFighter` 側も同じように `reactionTone` を displayData に載せる。

### Task 9: auto-sim + 実機検証

```bash
node test/auto-sim.js 100 42
```

- 期待: ALL CLEAR
- マトリクスで trust 平均が大きく崩れていないか確認 (0.5〜1.5 の範囲なので平均は 1.0 近辺、大きく変動することはないはず)

実機検証 (localhost:3000):
1. emotional + normal 性格の選手に bonus → 🌟 マーカー表示、trust 上昇大
2. bold + normal 性格の選手に bonus → 💤 マーカー表示、trust 上昇小
3. normal + ojousama の選手に bonus → 💤 マーカー (0.70)
4. normal + delinquent の選手に bonus → 🌟 マーカー (1.30)
5. emotional + delinquent の選手に bonus → clamp 上限 1.5 で 🌟
6. trainer 実行で予告文言が 3段階出し分けされる
7. party/camp 実行で**トーンマーカー表示なし** (team書類)
8. 選手の trust が正しく変動している (preview_eval で before/after 比較)

### Task 10: コミット + roadmap + 指示書アーカイブ

コミットメッセージ骨子:
```
feat(shachoshitsu): Phase 8 — 性格×アーキタイプで決裁効果が±50%変動

「即時万能感の排除」を遅延発現から不確実性に完全移行。spec v1.0
§6 の2マトリクス(性格×書類, アーキタイプ×書類)を採用し、finalMult
= clamp(personalityMult × archetypeMult, 0.5, 1.5) を各書類の trust
効果に乗算。

実装:
- DECISION_PERSONALITY_MULT (6性格×7書類) と DECISION_ARCHETYPE_MULT
  (4非normal×書類) を data.js に追加。spec §6.3 の shy はプロジェクト
  に存在しないため除外、camp/encourage/refresh_leave の扱いを narrative
  から補完
- Engine.shachoshitsu.calcUncertainty(docId, fighter) 新設
- Engine.shachoshitsu.classifyTone(finalMult) 新設 ('high'|'low'|null)
- queueTrust のシグネチャに finalMult パラメータ追加 (Phase 7 の
  pendingTrustDeltas.finalMult フィールドに保存)
- execute 内の6書類分岐 (bonus/encourage/refresh_leave/trainer/
  media/party/camp) で calcUncertainty を呼び、trust 効果に適用
- 個人書類の execute 返り値に reactionTone / finalMult を追加
- 結果モーダル showDecisionResultModal にトーンマーカー追加
  (🌟 深く刺さった / 💤 あまり響かなかったようだ、普通は無表示)
- trainer の予告文言を3段階 (予想以上 / 通常 / わずか) に出し分け
- CSS .decision-result-tone.high / .low 追加

team書類 (party/camp) は選手ごとに finalMult が異なるため結果モーダ
ルにトーン表示なし(従来通り固定文言)。

spec §6.5 の clamp (0.5〜1.5) に従い極端な値を防ぐ。matrix の数値は
spec §6.3/§6.4 の叩き台をそのまま採用、実機プレイで尖りすぎていた
ら後で調整。

auto-sim 100シーズン(seed=42) ALL CLEAR。
実機: 6パターン(性格×アーキタイプ) の反応差を preview_eval で検証。
trainer の3段階予告文言 + party/camp のトーン非表示を目視確認。

仕様: specs/shachoshitsu-spec-v1.0.md §6
指示書: plans/shachoshitsu-phase8-task.md
```

その他:
- `docs/game-system-roadmap.md` 冒頭を Phase 7 → Phase 8 に更新
- `specs/shachoshitsu-spec-v1.0.md` §11 Phase 8 セクションに完了メモ追記
- この指示書を `plans/archive/` に移動
- push しない

---

## 完了の定義チェックリスト

- [ ] `DECISION_PERSONALITY_MULT` と `DECISION_ARCHETYPE_MULT` が `data.js` に追加
- [ ] `Engine.shachoshitsu.calcUncertainty` / `classifyTone` 実装
- [ ] `queueTrust` のシグネチャに `finalMult` 追加、Phase 7 の pending エントリに反映
- [ ] 個人書類 (bonus/encourage/refresh_leave/trainer/media) の分岐で `calcUncertainty` が呼ばれる
- [ ] team書類 (party/camp) が選手ごとに `calcUncertainty` を呼ぶ
- [ ] 個人書類 `execute` 返り値に `reactionTone` / `finalMult` が含まれる
- [ ] 結果モーダルにトーンマーカー (🌟 / 💤) が条件付き表示
- [ ] trainer の予告文言が3段階に出し分けされる
- [ ] auto-sim 100シーズン ALL CLEAR
- [ ] 実機: 少なくとも 🌟 / 普通 / 💤 の3パターンが preview_eval で検証済
- [ ] camp/party にトーンマーカーが**表示されない**ことを確認
- [ ] spec / roadmap / 指示書アーカイブ
- [ ] ローカルコミット完了

---

## 禁止事項

- ❌ `finalMult` を UI にそのまま数値として露出する (0.85 とか出さない)
- ❌ トーンマーカーに「+50%」「−30%」のような百分率表示
- ❌ 書類ホバーのツールチップで「この選手には効きやすい/効きにくい」を事前に漏らす (不確実性が崩れる)
- ❌ 結果モーダルの「🌟 深く刺さった」に説明文を添えて仕組みを開示する (体感で感じさせる)
- ❌ `condition` / `slumpMomentum` / `orgPopDelta` / `growthBoost` に finalMult を適用する (不確実性は trust 効果のみ)
- ❌ プレイヤー向けテキストに英字内部トークン混入
- ❌ ハードコード16進色 (CSSは var(--*) 優先、ただし既存パターンに合わせる場合は例外)
- ❌ push (ユーザー判断待ち)
- ❌ `--no-verify`

---

## トラブルシュート

### calcUncertainty が常に 1.0 を返す
`DECISION_PERSONALITY_MULT` が参照できていない可能性。`typeof DECISION_PERSONALITY_MULT === 'undefined'` の安全弁が発動していないか確認。data.js のロード順が management.js より先であることを確認。

### finalMult が 0.5 / 1.5 を超える
clamp 忘れ。`Math.max(0.5, Math.min(1.5, mult))` が入っているか確認。

### trainer の予告文言が変わらない
Task 7 の changes 構築で `currentFinalMult` を読んでいない可能性。`currentFinalMult = mult;` を trainer 分岐で設定しているか確認。

### party/camp の結果モーダルにトーンマーカーが出てしまう
Task 5 の返り値構築で `doc.effect.target === 'individual'` のガードが効いていない。

### auto-sim で validateGameState が finalMult の警告を吐く
`pendingTrustDeltas` エントリの型チェックで `finalMult` を検証していないか。Phase 7 の validateGameState は `perWeekDelta` / `weeksRemaining` のみ見ているはずだが、念のため追加が必要な場合は finite number チェックを追加。

---

## Phase 9 予告

- **Phase 9**: ビジュアル磨きとヘルプ
  - 書類微回転、朱印サウンド、季節切り替えフェード、決裁済み翌週リセット演出
  - 社長室の使い方チュートリアル (ヘルプ画面)
  - spec v1.1 リライト (encourage 分離 / trust 3段階 / 信頼度質的表現ルール / Phase 7+8 の設計変更逆輸入)

Phase 8 が承認されたら、Phase 9 の指示書作成 → 実装。

---

以上、Phase 8 実装指示書終わり。
