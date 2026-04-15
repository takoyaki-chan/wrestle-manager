# Phase 7: 継続系書類の遅延発現 + 可視化 + 閾値最終確認 — 実装指示書

> **対象**: Claude Code (次セッション)
> **所要時間目安**: 2〜4時間 (スコープ縮小版)
> **前提コミット**: `621f03f` (Phase 5 後の磨き込み = 声かけ2段階化) 以降
> **目的**: 成長バフが走っている書類 (trainer / camp) の信頼度上昇を **バフ期間と並走** させて段階発現にする。それ以外の即時型書類 (bonus / refresh_leave / party / encourage) は即時のまま維持する。
> **承認ポイント**: 実装完了後、Keisuke さんに動作確認依頼 → 承認されたら Phase 8 (不確実性) へ
> **spec 相当箇所**: `specs/shachoshitsu-spec-v1.0.md` §4.3, §5 (ただし Phase 7 で設計変更あり。v1.1 で逆輸入予定)

---

## ⚠️ spec v1.0 からの設計変更

spec v1.0 は「trust 効果は6書類すべてを3週間に分割発現」としていたが、**これは narrative 的に間違っている** と判明した (Keisuke 指摘 2026-04-15):

> 「ボーナス付きってよく考えたら、即時で上がるよね。金をもらったら、その時嬉しいもんね。休暇もそうかな。」

Phase 7 では以下の方針に修正する:

### 即時型 (信頼度は今まで通り即時で上がる)

| 書類 | narrative 的理由 |
|---|---|
| **bonus** (ボーナス支給) | 金をもらった瞬間が一番嬉しい |
| **refresh_leave** (休暇辞令) | 「社長、分かってくれてた」が発動するのはその瞬間 |
| **party** (慰労会) | その夜の場で盛り上がる、後日じゃない |
| **encourage** (声かけ) | Phase 5 で既に即時維持 (自発的行動) |

これらは **Phase 7 で一切変更しない**。結果モーダルも現行のまま。

### 遅延型 (成長バフと並走して信頼度がじわじわ上がる)

| 書類 | 期間 | narrative 的理由 |
|---|---|---|
| **trainer** (専属トレーナー) | 4週間 | バフ期間中に「私、伸びてる。社長が投資してくれてる」を実感していく |
| **camp** (合宿) | 2週間 | 共同練習の2週間で「本気で強くなった」が積み上がる |

**遅延期間は既存 `_trainerBuff.weeksLeft` と完全に同期** させる。別トラックで管理しない。これにより:
- 可視化が既存の成長バフ表示と自然に一体化する (新バッジ設計不要)
- `pendingTrustDeltas` の weeksRemaining と `_trainerBuff.weeksLeft` が同じ値を指す
- プレイヤーから見ると「成長バフ中=信頼度もじわじわ上昇中」という覚えやすいルール

### media (メディア露出) の扱い — **即時のまま維持**

当初「看板として使われていくので遅延型」と考えたが、mechanical に見ると media には既存の buff 期間が無い (orgPop +0.4 / condition +5 は一発完結)。遅延トラストだけ追加すると「何の期間?」が曖昧になり、バッジ設計も苦しい。

**media は即時維持**。narrative 的にも「この子を表紙に抜擢する」という決裁はその瞬間に「選ばれた」感情が動く、と解釈できる。

### 「即時万能感の排除」はどうするか

spec v1.0 は遅延発現でこれを実現しようとしていたが、Phase 7 では諦める。代わりに **Phase 8 (不確実性) に全面的に寄せる**:

- ボーナスを渡しても、不良キャラは大喜び、お嬢様は「こんなの要りませんわ」で軽くしか効かない
- 性格×アーキタイプのマトリクスで trust 効果が ±50% 変動
- 「刺せば必ず望み通り」という万能感は、結果の不確実性だけで十分に崩せる

遅延でごまかす必要はなく、Phase 8 の方が narrative 的に正直。

---

## Phase 7 のスコープ (全体像)

1. **trainer / camp の信頼度だけ** を `pendingTrustDeltas` に積み、バフ期間に同期して発現させる
2. 選手ポップアップと団体タブの既存成長バフ表示の近くに「✦ 専属トレーナー 3週目/4週 — 信頼もじわじわ」的な一言を添える
3. 週進行時、遅延発現した選手のうち **1件だけ** ミニ通知で拾う (「○○の気持ちが前向きになってきた」)
4. 結果モーダル: trainer / camp の trust 関連 changes だけ「今後◯週にわたって、じわじわと効いていく」に差し替え。それ以外は触らない
5. マイグレーション: `pendingTrustDeltas: []` を全選手に初期化
6. Phase 6 の残タスク (閾値確認): 実機10シーズンで確認、問題なければ現状維持
7. auto-sim + 実機検証 + コミット + spec 逆輸入メモ

---

## Phase 5 以降に入っているレビュー追加 (実装済み・再掲)

Phase 5 完了後、複数コミットで以下が入っている。Phase 7 着手前に頭に入れておくこと:

1. **決裁結果モーダル豪華化** (`b62c654`, `2d4e67b`) — 個人/団体両対応、話者ヒーロー+セリフ
2. **信頼度マスクデータ全面除去** (`618cfcf`) — 生数値・デルタを質的表現に統一
3. **encourage を選手ポップアップへ移設** (`618cfcf`) — 机から外れ、自発的行動に
4. **trust<40 に💔信頼低下バッジ** (`618cfcf`)
5. **声かけの2段階化** (`621f03f`) — gentle (trust<50 緑) / urgent (slump or trust<40 オレンジ)

つまり社長室の机に並ぶのは実質 **6書類** (bonus/refresh_leave/party/trainer/camp/media) で、そのうち **Phase 7 が触るのは trainer と camp の2書類だけ**。

---

## 事前に必ず読むべきファイル (順序厳守)

1. **この指示書** (本ファイル): `plans/shachoshitsu-phase7-task.md`
2. **spec**: `specs/shachoshitsu-spec-v1.0.md` §4, §5 (ただし上記「設計変更」で上書きされる点に注意)
3. **CLAUDE.md**: 「数値哲学」「やらないことリスト」「自動検証システム」
4. **memory**: `memory/feedback_player_text_no_internal_tokens.md`
5. **前フェーズの指示書** (参考): `plans/archive/shachoshitsu-phase5-task.md`
6. **実コード**: 下記「現状把握メモ」の行番号

---

## 現状把握メモ (Phase 7 開始時点)

### Engine.shachoshitsu.execute の trust 適用 (`src/management.js:12541`〜)

- ローカルヘルパー `applyTrust(fighter, delta, skipOvrScale)` が L12576-12584
  - `Engine.trust.applyCoeff` → OVR傾斜 → `Engine.trust.gainMult` → clamp
  - **この関数はそのまま残す** (即時型書類5つ= bonus/refresh_leave/party/encourage/media が使い続ける)
- trainer 分岐: L12646-12650 (`f = applyTrust(f, doc.effect.trust || 5.97);` + `_trainerBuff` 付与)
- camp 分岐 (team): L12703-12713 (`roster.map` の中で `applyTrust` + `_trainerBuff` 付与)
- **この2箇所だけ** が Phase 7 の改修対象

### _trainerBuff の既存管理

- 付与: L12649 (trainer), L12708 (camp)
- 週次消費: `Engine.shachoshitsu.tickTrainerBuffs(roster)` が `processManage` 内 L5971 で呼ばれる (L12764-12774)
- 成長計算での参照: `Engine.shachoshitsu.getTrainerMult(fighter)` (L12777-12779)
- バフ切れ時は `_trainerBuff` フィールド自体を削除

**Phase 7 の設計**: `pendingTrustDeltas` の `weeksRemaining` は `_trainerBuff.weeksLeft` と **同じタイミングで減る**。つまり `tickTrainerBuffs` と `applyPendingTrustDeltas` は同じタイミングで呼ぶ必要がある。

### tickWeek の構造 (`src/management.js:6391`〜)

- 社長室週次処理ブロック: L6751-6765 (決裁枠回復 + `_decisionDoneThisWeek` クリア)
- **Phase 7 で追加する `applyPendingTrustDeltas` は L6766 付近**
- ただし `tickTrainerBuffs` は `processManage` 内 (L5971) で呼ばれているので、両者のタイミングを揃えるには `applyPendingTrustDeltas` も `processManage` 側に入れた方が自然
- **判断**: `applyPendingTrustDeltas` は **processManage 内で `tickTrainerBuffs` の直後** に呼ぶ。これなら `_trainerBuff.weeksLeft` と `pendingTrustDeltas[].weeksRemaining` が完全に同期する

### fighter オブジェクト

- 既存: `trust` / `_trainerBuff` / `_decisionWeekUsed` / `_bonusRepeat` / `pendingTrustDeltas` (Phase 7 で追加)
- `_trainerBuff` は `{ weeksLeft, mult }`
- `pendingTrustDeltas` は `{ source, totalDelta, perWeekDelta, weeksRemaining, startedWeek, finalMult }[]`

### マイグレーションの置き場所 (`src/app.js:2040`〜)

- L2041-2043: `_migrated_decisionPoints_v1` (Phase 2)
- L2045-2053: Phase 4 の `_decisionWeekUsed` 初期化
- L2055-2075: Phase 5 の各種整理
- **Phase 7 のマイグレーションはこのブロック末尾 (L2075 付近)**

### 選手ポップアップ表示 (`src/ui-common.js:2753`〜)

- L2753-2768: ステータスバッジ群
- L2757: `growthPenalty` 表示
- L2758: `hotStreak` 表示
- L2759: `slump` 表示
- L2760: `motivationLoss` 表示
- L2761: `trust<40` 💔バッジ
- **Phase 7 で追加する成長バフ表示**: 現状 `_trainerBuff` を表示している箇所が無い。L2758 付近に新規追加する (「🏋️ 専属トレーナー 残り3週」的な表現 + 「信頼もじわじわ育っていく」一言)

### 決裁結果モーダル (`src/ui-common.js:6349`〜)

- `showDecisionResultModal(displayData)` — `changes` 配列を `changesHtml` として描画
- trainer の changes 構築は `src/management.js:12672-12675`:
  ```javascript
  if (docId === 'trainer') {
    const gb = doc.effect.growthBoost || { weeks: 4, mult: 1.3 };
    changes.push({ label: '成長速度', emoji: '📈', text: `${gb.weeks}週間 +${Math.round((gb.mult - 1) * 100)}%` });
  }
  ```
- camp の changes 構築は L12710-12711
- **Phase 7 で書き換え**: trust 関連 changes (L12667 / L12699 / L12710) のうち trainer/camp の分だけ「今後◯週にわたって、じわじわと効いていく」文言に差し替え

### 週進行時のトースト経路 (`src/app.js:5635`〜)

- `processWeek()` が tickWeek を呼び、`_pendingXxx` 系トランジェントを setTimeout で順次表示
- 既存パターン: L5690-5727 の `weekGrowthEvents`
- **Phase 7 で追加する `_pendingTrustReveals` もこの pattern**

---

## Phase 7 で実施するタスク (順序推奨)

### Task 1: データ構造とマイグレーション

1. `src/app.js` L2075 付近のマイグレーションブロック末尾に追加:
   ```javascript
   // 社長室 Phase 7: pendingTrustDeltas 初期化
   if (G.roster && G.roster.some(f => f.pendingTrustDeltas === undefined)) {
     G = { ...G, roster: G.roster.map(f =>
       f.pendingTrustDeltas === undefined ? { ...f, pendingTrustDeltas: [] } : f
     ) };
   }
   ```
2. `src/management.js` の `makeChar` と `makeAIFighter` に `pendingTrustDeltas: []` 初期化追加 (Grep で該当箇所特定)
3. `resolveScout` / `applyDraftSigning` 経由で新規に加わる選手にも付与
4. `validateGameState` (`src/management.js:14475` 以降) に型チェック追加:
   ```javascript
   // Phase 7: pendingTrustDeltas の型チェック
   for (const f of (G.roster || [])) {
     if (f.pendingTrustDeltas !== undefined && !Array.isArray(f.pendingTrustDeltas)) {
       warn(`${f.name}.pendingTrustDeltas が配列でない→自動修正`);
       f.pendingTrustDeltas = [];
     }
     if (Array.isArray(f.pendingTrustDeltas)) {
       f.pendingTrustDeltas = f.pendingTrustDeltas.filter(d => {
         if (!d || typeof d !== 'object') return false;
         if (!isValidNum(d.perWeekDelta) || !isValidNum(d.weeksRemaining)) return false;
         if (d.weeksRemaining < 1) return false;
         return true;
       });
     }
   }
   ```

### Task 2: trainer / camp の trust だけを pending に積むよう変更

`src/management.js:12541` の `execute` 内で、**trainer と camp の2箇所だけ** を改修。他の書類には一切触らない。

1. `applyTrust` ヘルパーはそのまま残す (bonus/refresh_leave/party/encourage/media が使い続ける)
2. 新ヘルパー `queueTrust` をローカルに追加:
   ```javascript
   // Phase 7: trainer/camp 専用 — バフ期間と並走して信頼度を遅延発現
   // trust フィールドは触らず、pendingTrustDeltas にエントリを積むだけ
   const queueTrust = (fighter, delta, source, weeks, skipOvrScale) => {
     const mental = fighter.mn || 50;
     let adjusted = Engine.trust.applyCoeff(delta, mental);
     if (!skipOvrScale) adjusted *= careOvrMult(fighter);
     const oldTrust = fighter.trust != null ? fighter.trust : 50;
     if (adjusted > 0) adjusted *= Engine.trust.gainMult(oldTrust);
     if (adjusted <= 0.001) return fighter;
     const perWeek = adjusted / weeks;
     const entry = {
       source,              // 'trainer' | 'camp'
       totalDelta: adjusted,
       perWeekDelta: perWeek,
       weeksRemaining: weeks,
       startedWeek: state.week,
       finalMult: 1.0,      // Phase 8 で性格×アーキタイプ倍率を入れる
     };
     const list = [...(fighter.pendingTrustDeltas || []), entry];
     return { ...fighter, pendingTrustDeltas: list };
   };
   ```

3. **trainer 分岐の書き換え** (L12646-12650):
   ```javascript
   // 旧
   // f = applyTrust(f, doc.effect.trust || 5.97);

   // 新
   const gb = doc.effect.growthBoost || { weeks: 4, mult: 1.3 };
   f = queueTrust(f, doc.effect.trust || 5.97, 'trainer', gb.weeks);
   f._trainerBuff = { weeksLeft: gb.weeks, mult: gb.mult };
   ```
   — `weeks` が 4 で `_trainerBuff.weeksLeft` と完全一致

4. **camp 分岐の書き換え** (L12703-12713):
   ```javascript
   // 旧
   // roster = roster.map(f => {
   //   if (f.injury) return f;
   //   const newF = applyTrust(f, doc.effect.trust || 1.84);
   //   return { ...newF, _trainerBuff: { weeksLeft: gb.weeks, mult: gb.mult } };
   // });

   // 新
   const gb = doc.effect.growthBoost || { weeks: 2, mult: 1.5 };
   roster = roster.map(f => {
     if (f.injury) return f;
     const queued = queueTrust(f, doc.effect.trust || 1.84, 'camp', gb.weeks);
     return { ...queued, _trainerBuff: { weeksLeft: gb.weeks, mult: gb.mult } };
   });
   ```
   — camp は全員に2週分積む

5. **bonus / refresh_leave / party / encourage / media は一切触らない**。既存の `applyTrust` 呼び出しをそのまま維持

### Task 3: 毎週の発現処理 (tickTrainerBuffs と同期)

`Engine.shachoshitsu` に `applyPendingTrustDeltas` を新設し、**`tickTrainerBuffs` と同じタイミング (processManage 内)** で呼ぶ。

1. `Engine.shachoshitsu` に追加:
   ```javascript
   // Phase 7: pendingTrustDeltas の週次発現
   // tickTrainerBuffs と同じタイミングで呼ばれることを前提に設計されており、
   // trainer/camp の _trainerBuff.weeksLeft と pendingTrustDeltas[].weeksRemaining が同期する
   // 返り値: { roster, reveals }
   applyPendingTrustDeltas(roster, currentWeek) {
     const reveals = [];
     const newRoster = roster.map(f => {
       if (!f.pendingTrustDeltas || f.pendingTrustDeltas.length === 0) return f;
       let trust = f.trust != null ? f.trust : 50;
       const remaining = [];
       for (const delta of f.pendingTrustDeltas) {
         const applied = delta.perWeekDelta * (delta.finalMult != null ? delta.finalMult : 1.0);
         trust = Engine.util.clamp(trust + applied, 0, 100);
         reveals.push({
           fighterId: f.id,
           fighterName: f.name,
           source: delta.source,
           perWeekDelta: applied,
         });
         const nextRem = delta.weeksRemaining - 1;
         if (nextRem >= 1) {
           remaining.push({ ...delta, weeksRemaining: nextRem });
         }
       }
       return { ...f, trust, pendingTrustDeltas: remaining };
     });
     return { roster: newRoster, reveals };
   },
   ```

2. **呼び出し位置**: `processManage` 内の `tickTrainerBuffs` の **直後** (`src/management.js:5971` 付近)
   ```javascript
   roster = Engine.shachoshitsu.tickTrainerBuffs(roster);
   // Phase 7: trainer/camp の信頼度遅延発現を buff と同タイミングで処理
   {
     const result = Engine.shachoshitsu.applyPendingTrustDeltas(roster, state.week);
     roster = result.roster;
     if (result.reveals.length > 0) {
       pendingTrustReveals = result.reveals;  // 後続の result オブジェクトに載せる
     }
   }
   ```
3. `processManage` の返り値に `_pendingTrustReveals` を追加 (`src/management.js:6086` 付近、他の `_pending*` と同じ pattern):
   ```javascript
   if (pendingTrustReveals.length > 0) result._pendingTrustReveals = pendingTrustReveals;
   ```
4. `tickWeek` の transient 転送ブロック (L6412-6423) にも1行追加:
   ```javascript
   if (manage._pendingTrustReveals) s = { ...s, _pendingTrustReveals: manage._pendingTrustReveals };
   ```

### Task 4: 結果モーダルの trainer / camp 文言だけ書き換え

`src/management.js:12667` 付近の個人書類 changes 構築で、trainer の trust エントリだけ遅延発現表現に:

```javascript
// 現状 (全書類共通): 
// if (_after.trust !== _before.trust) {
//   changes.push({ label: '信頼度', emoji: '🤝', text: Engine.trust.describeChange(...) });
// }

// Phase 7 変更: trainer/camp は即時には上がらないので別処理
if (docId === 'trainer') {
  // 信頼度は今後4週にわたって積み上がる
  changes.push({
    label: '信頼度',
    emoji: '🤝',
    text: '今後4週にわたって、じわじわと育っていく',
  });
} else if (_after.trust !== _before.trust) {
  // bonus / refresh_leave / encourage / media は従来通り即時
  changes.push({ label: '信頼度', emoji: '🤝', text: Engine.trust.describeChange(_after.trust - _before.trust) });
}
```

camp (team書類 L12710) も同様:
```javascript
// 旧: changes.push({ label: '全員の信頼度', emoji: '🤝', text: '少し上がった' });
// 新:
changes.push({
  label: '全員の信頼度',
  emoji: '🤝',
  text: '今後2週にわたって、団体全体にじわじわと育っていく',
});
```

**bonus / refresh_leave / party / encourage / media の changes は一切触らない**。

### Task 5: 選手ポップアップの成長バフ表示追加

`src/ui-common.js:2753-2768` のバッジ群に、`_trainerBuff` 表示を追加する。**既存に `_trainerBuff` 表示が無かった** ので新規。

L2758 (`hotStreak` バッジ) の **直後** に挿入:
```javascript
${c._trainerBuff ? (() => {
  const weeks = c._trainerBuff.weeksLeft;
  // バフの元が camp か trainer かは pendingTrustDeltas の source を見れば分かる
  const pending = (c.pendingTrustDeltas || []).find(p => p.source === 'trainer' || p.source === 'camp');
  const label = pending && pending.source === 'camp' ? '合宿' : '専属トレーナー';
  return `<span style="color:#d4a843">🏋️ ${label} 残り${weeks}週 — 信頼もじわじわ育つ</span>`;
})() : ''}
```

数値は出さない (残り週数だけ)。色はゴールド系 `#d4a843` (成長/投資を表す)。

**団体タブの選手カード** (`src/ui-render.js` 内の選手カードバッジ並び) にも同じ表示を追加すべきか?
→ Phase 7 スコープ外。選手ポップアップだけで OK。団体タブは Phase 9 の磨き込みで検討。

### Task 6: 週進行ミニ通知 (1件/週)

`src/app.js:5690` 付近の `weekGrowthEvents` 処理の **直後** に追加:

```javascript
// 社長室 Phase 7: trainer/camp の信頼度遅延発現ミニ通知 (1件/週)
const weekTrustReveals = G._pendingTrustReveals || [];
if (G._pendingTrustReveals) {
  const { _pendingTrustReveals: _, ...cleanTr } = G;
  G = cleanTr;
}
if (weekTrustReveals.length > 0) {
  // perWeekDelta 降順でソートして1件だけピック (スポットライトは巡る)
  const pick = [...weekTrustReveals].sort((a, b) => b.perWeekDelta - a.perWeekDelta)[0];
  const SOURCE_TEXTS = {
    trainer: '専属トレーナーとの練習で',
    camp: '合宿の手応えで',
  };
  const prefix = SOURCE_TEXTS[pick.source] || '';
  const msg = `🤝 ${prefix}${pick.fighterName}の気持ちが前向きになってきた`;
  const baseDelayTr = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 600;
  setTimeout(() => showToast(msg, 5000), baseDelayTr);
}
```

**1件/週** にした理由:
- trainer は個別、camp は全員分の reveal が同週に大量発生する (camp で5選手なら週2回 × 5 = 毎週5件のトースト候補)
- 全部流すと通知が過剰で感情が薄まる
- 「その週特に響いた誰か」にスポットを当てる方がゲームのトーン (スポットライトは巡る) に合う

### Task 7: Phase 6 の残タスク = 閾値確認

Phase 7 実装完了後、**10〜15シーズンの実機プレイ** で以下を確認:

1. **bonus (trust<60)**: Phase 7 でも即時のままなので、既存プレイ感と変わらないはず。変更不要と予想
2. **refresh_leave (slump_or_motivation_loss)**: 同上、変更不要
3. **party (morale<60)**: Phase 4 で 50→60 に緩和済み。実機で問題なければ現状維持
4. **trainer / camp**: 発動条件なし or orgPop 20。閾値調整不要

10-15シーズン問題なく回ったら「変更なし」で確定。変更が必要だった場合は該当箇所を調整し、spec v1.1 での逆輸入メモに記録。

### Task 8: auto-sim + 実機検証

```bash
node test/auto-sim.js 100 42
```

- 期待: ALL CLEAR (違反0/エラー0/ゲームオーバー0)
- 追加チェック: auto-sim 終了時に全選手の `pendingTrustDeltas` が空配列であることを確認 (camp/trainer は最大4週で消えるはず)

実機検証 (ブラウザ localhost:3000):
1. trainer を1人に刺す → `pendingTrustDeltas` に1件、`_trainerBuff.weeksLeft=4`、trust は変わらず
2. 1週進行 → trust が1/4上昇、weeksRemaining=3、`_trainerBuff.weeksLeft=3`
3. 選手ポップアップで「🏋️ 専属トレーナー 残り3週 — 信頼もじわじわ育つ」が見える
4. 週進行トーストで「🤝 専属トレーナーとの練習で○○の気持ちが前向きになってきた」が出る
5. 4週進行後、`pendingTrustDeltas` が空配列、`_trainerBuff` も消える
6. camp を実行 → 全員に2週分積まれ、2週後に全員空配列
7. bonus を実行 → **trust が即時上昇** (従来通り)、`pendingTrustDeltas` に何も積まれない
8. 結果モーダル: trainer/camp は「今後◯週にわたって育っていく」、bonus/refresh_leave/media は従来の質的表現

### Task 9: コミット + ドキュメント更新

コミットメッセージ:
```
feat(shachoshitsu): Phase 7 — trainer/campの信頼度を成長バフと並走で遅延発現

spec v1.0 の「全書類3週遅延」方針を narrative 不整合により修正。
ボーナスや休暇は金や休みをもらったその瞬間が嬉しさのピーク。遅延
発現にすると感情の時間軸が壊れる (Keisuke 指摘)。

Phase 7 で遅延発現するのは成長バフが並走する2書類のみ:
- trainer: 4週間、_trainerBuff.weeksLeft と完全同期
- camp:    2週間、_trainerBuff.weeksLeft と完全同期

残り4書類(bonus/refresh_leave/party/encourage/media)は即時維持、
既存動作を一切変更しない。

実装:
- fighter.pendingTrustDeltas (配列) 追加、全選手マイグレーション
- Engine.shachoshitsu.queueTrust ローカルヘルパー新設
  (trainer/camp 専用。applyTrust はそのまま残す)
- Engine.shachoshitsu.applyPendingTrustDeltas 新設
- processManage 内 tickTrainerBuffs 直後で呼び出し(バフと同タイミング)
- processManage 返り値に _pendingTrustReveals、tickWeek で転送
- processWeek() で週次ミニ通知1件表示(perWeekDelta降順ピック)
- showFighterPopup に 🏋️ 成長バフ表示 + 信頼度育成一言追加
- trainer/camp の結果モーダル changes を「今後◯週にわたって
  じわじわと育っていく」文言に書換
- validateGameState に pendingTrustDeltas 型チェック追加
- makeChar/makeAIFighter/resolveScout/applyDraftSigning で初期化

重要な設計判断: 「即時万能感の排除」は Phase 8 の不確実性(性格×
アーキタイプ ±50%)に全面的に寄せる。遅延発現でごまかす必要はない。

Phase 6 の残タスク(閾値最終確認): 10-15シーズン実機プレイ、現状
維持で問題なしを確認。

auto-sim 100シーズン(seed=42) ALL CLEAR。
実機: trainer/camp の遅延発現と bonus/refresh_leave 即時維持を
両方確認。ポップアップバッジ・週次ミニ通知も目視 OK。

spec v1.1 リライト時に §4.3 / §5 の「全書類3週遅延」を本 Phase
の方針に逆輸入する(Keisuke 承認後)。

仕様: specs/shachoshitsu-spec-v1.0.md §4.3, §5 (設計変更あり)
指示書: plans/shachoshitsu-phase7-task.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

その他:
- `docs/game-system-roadmap.md` の冒頭更新 (Phase 5 → Phase 7)
- この指示書を `plans/archive/` へ移動
- push しない

---

## 完了の定義チェックリスト

- [ ] `fighter.pendingTrustDeltas` が全選手に初期化される
- [ ] `Engine.shachoshitsu.queueTrust` ローカルヘルパーが trainer/camp でのみ使われる
- [ ] bonus/refresh_leave/party/encourage/media の trust は **即時** のまま (既存動作と完全一致)
- [ ] `Engine.shachoshitsu.applyPendingTrustDeltas` が processManage 内 `tickTrainerBuffs` 直後で呼ばれる
- [ ] `_trainerBuff.weeksLeft` と `pendingTrustDeltas[].weeksRemaining` が常に同期
- [ ] 結果モーダル: trainer/camp だけ「今後◯週にわたって育っていく」、他は従来表現
- [ ] 選手ポップアップに `_trainerBuff` 表示 (数値なし、残り週数のみ)
- [ ] 週進行ミニ通知 (1件/週、perWeekDelta 降順でピック)
- [ ] マイグレーション (既存セーブで `pendingTrustDeltas: []` 付与)
- [ ] `makeChar` / `makeAIFighter` / `resolveScout` / `applyDraftSigning` 初期化追加
- [ ] `validateGameState` 型チェック追加
- [ ] Phase 6 閾値確認: 10-15シーズン実機プレイで問題なし
- [ ] auto-sim 100シーズン ALL CLEAR
- [ ] 実機: trainer 4週 / camp 2週の遅延発現を目視確認
- [ ] 実機: bonus/refresh_leave が従来通り即時で上がることを目視確認
- [ ] 数値露出チェック: 新設 UI に `perWeekDelta` / `totalDelta` が一切出ていない
- [ ] spec / roadmap 更新、指示書アーカイブ移動
- [ ] ローカルコミット完了 (push はしない)

---

## 禁止事項

- ❌ bonus/refresh_leave/party/encourage/media の trust 挙動を変更する (Phase 7 の対象外)
- ❌ `applyTrust` ヘルパー本体を変更 / 削除する (即時型書類が使い続ける)
- ❌ `pendingTrustDeltas` の `perWeekDelta` / `totalDelta` を UI に露出する (数値哲学違反)
- ❌ 選手ポップアップの成長バフバッジに「信頼+2.5」のような数値を表示する
- ❌ 週進行ミニ通知を 2件以上出す (1件/週に絞る)
- ❌ `finalMult` に 1.0 以外の値を入れる (Phase 8 で実装)
- ❌ `pendingTrustDeltas` と `_trainerBuff.weeksLeft` を別タイミングで減算する (必ず同タイミング)
- ❌ プレイヤー向けテキストに英字内部トークン混入 (`trust` / `morale` / `MQ` 等)
- ❌ push (Cloudflare Pages 自動デプロイ回避、ユーザー判断待ち)
- ❌ コミット時の `--no-verify`

---

## トラブルシュート

### `_trainerBuff.weeksLeft` と `pendingTrustDeltas[].weeksRemaining` がズレる
Task 3 の呼び出し位置が間違っている。両者は **同じタイミング (processManage 内 `tickTrainerBuffs` 直後)** で減算される必要がある。tickWeek の社長室ブロックに入れないこと。

### bonus 実行後に trust が上がらない
Task 2 の書き換えで bonus 分岐まで `queueTrust` に変えてしまった可能性。bonus は `applyTrust` のまま維持。

### 週進行で大量のトーストが出る
Task 6 の `.sort(...).slice(0, 1)` ではなく `.sort(...)[0]` でピックし、1件だけ `setTimeout` する。

### 選手ポップアップにバッジが出ない
Task 5 の挿入位置を確認。`c._trainerBuff` の存在チェックを忘れていないか。

### auto-sim で validateGameState 警告
Task 1 の型チェックが不完全。`isValidNum` が `pendingTrustDeltas` の entry フィールドに適用されているか。

### 既存セーブ読み込み時に trust が NaN
マイグレーションが走る前に `applyPendingTrustDeltas` が呼ばれている可能性。マイグレーションブロックはセーブ読み込み直後、tickWeek より前に実行されるはず。

---

## Phase 8 予告

- **Phase 8**: 不確実性メカニズム
  - `DECISION_PERSONALITY_MULT` / `DECISION_ARCHETYPE_MULT` マトリクスを `src/data.js` に定義
  - trainer/camp の `queueTrust` で `finalMult = personalityMult × archetypeMult` を計算して pending エントリに載せる
  - bonus/refresh_leave/party/media などの即時型書類は `applyTrust` 呼び出しの直前で `delta *= finalMult` する
  - 結果モーダルに「予想以上に響いた / 普通 / 響かなかった」の3段階表現を追加
  - セリフバリエーションを性格×アーキタイプで出し分け

Phase 7 が承認されたら、Phase 8 の指示書作成 → 実装。

---

以上、Phase 7 実装指示書 (スコープ縮小版) 終わり。
