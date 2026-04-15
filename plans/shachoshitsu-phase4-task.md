# Phase 4: 決裁実行ロジック — 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 2〜3時間(Phase 2 より重い)
> **承認状態**: Phase 3 完了済み(コミット `a3d301b` / `d410994`)
> **前提**: `specs/shachoshitsu-spec-v1.0.md` §4 (効果定義), §6 (不確実性メカニズム — Phase 8 で本実装、Phase 4 では未適用), §8 (決裁実行フロー) を事前に読むこと

---

## Phase 4 の目的

Phase 3 で机に並べた書類を **実際にクリックして決裁できる** ようにする。対象選手選択モーダル、団体確認モーダル、朱印エフェクト、印鑑が倒れるアニメ、決裁済み書類の差し替え、結果トーストまでを一通り実装して、「決裁する体験」の骨格を完成させる。

Phase 4 の段階では:
- **遅延発現はしない** (trust も即時適用) — Phase 7 で切り替え
- **不確実性はない** (性格×書類マトリクスを掛けない) — Phase 8 で追加
- **hireCoach の決裁枠連動は実装しない** — Phase 5 で実装

つまり Phase 4 は「既存の `Engine.careActions.execute` を移植 + 新モーダル + 新演出」と考えてよい。

---

## Phase 4 で実装するもの

1. `Engine.shachoshitsu.execute(docId, fighterId, state)` — 既存 `Engine.careActions.execute` をベースに改修
2. 決裁枠 (`decisionPoints`) 消費ロジック
3. team 書類の同週cooldown (`_decisionWeekUsed`) 更新
4. 個人決裁の cooldown (`_decisionWeekUsed` 選手ごと) 更新
5. 対象選手選択モーダル `showDecisionTargetModal`(個人書類用)
6. 団体確認モーダル `showDecisionConfirmModal`(team書類用)
7. 朱印エフェクトのアニメーション(`stamp-effect.webp` + CSS keyframes)
8. 印鑑が倒れるアニメーション(HUD の hanko 画像に `hanko-fall` クラス付与)
9. 決裁済み書類の表示(`document-stamped.webp` に差し替え + cursor 無効化)
10. 週進行時の決裁済みフラグリセット
11. 結果トースト(画面下、1-2行の実行結果表示)
12. サウンド(既存 `Audio.play` の組み合わせ、新規音源は追加しない)
13. App.executeDecision() — 上記を束ねるエントリポイント
14. renderShachoshitsu を書類クリックで executeDecision を呼ぶように更新

## Phase 4 で実装しないもの(後続Phase)

- ❌ 遅延発現 (`pendingTrustDeltas`)  → Phase 7
- ❌ 不確実性(性格×書類マトリクス) → Phase 8
- ❌ hireCoach の決裁枠連動 → Phase 5
- ❌ 旧ケアモーダル / `Engine.careActions` の削除 → Phase 5
- ❌ 朱印アニメーション用の専用サウンドファイル追加 → Phase 9(既存の Audio.play で代替)
- ❌ 選手詳細画面での `pendingTrustDeltas` 可視化 → Phase 9

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. `specs/shachoshitsu-spec-v1.0.md` §4(効果定義)
2. `specs/shachoshitsu-spec-v1.0.md` §8(決裁実行フロー全体)
3. `specs/shachoshitsu-spec-v1.0.md` §11(Phase 4 セクション)
4. `plans/shachoshitsu-phase2-task.md`(Phase 2 指示書。命名・スタイル参考)
5. `src/management.js` の既存 `Engine.careActions.execute`(~12458行〜12689行。Phase 4 で移植するコード)
6. `src/app.js` の既存 `App.executeCareAction`(~6774行〜6837行。Phase 4 の App.executeDecision の参考)
7. `src/ui-common.js` の既存 `showCareActionModal`(~6104行〜。新モーダル実装の参考。**コピーしない** — Phase 5 で削除する予定)
8. `CLAUDE.md` の「自動検証システム(auto-sim)」セクション

---

## 既存コードへの影響範囲

Phase 4 は `management.js` を編集するので **auto-sim が自動実行される**(フック経由)。違反検出時は即修正する。

**触ってはいけない既存コード**(Phase 5 まで並行稼働させる):
- `CARE_ACTIONS`(`data.js`) — Phase 5 で削除
- `Engine.careActions`(`management.js`) — Phase 5 でリネーム/削除
- `showCareActionModal`(`ui-common.js`) — Phase 5 で削除
- `App.openCareModal` / `App.executeCareAction`(`app.js`) — Phase 5 で削除/リネーム
- 今週画面の「💝 ケア」ボタン — Phase 5 で削除
- `G.careStock` / `G.careStockMax` / `G.careStockLastRecovery` / `G._teamCareWeekUsed` — Phase 5 で廃止
- `f._careWeekUsed` / `f._bonusRepeat` — Phase 5 でリネーム(`_decisionWeekUsed` / `_bonusRepeat` そのまま維持)

**Phase 4 は純粋に追加**。既存のケアシステムを壊してはいけない。

---

## タスクリスト

### Task 1: Engine.shachoshitsu.execute の実装

**ファイル**: `src/management.js`

**場所**: `Engine.shachoshitsu` 名前空間内(Phase 3 で追加)の末尾。`getAvailableDocs` の後ろに追加。

**設計方針**:
- 既存の `Engine.careActions.execute` をほぼそのまま移植。違いは:
  - `CARE_ACTIONS` → `DECISION_DOCS` 参照
  - `careStock` → `decisionPoints` 参照
  - `_teamCareWeekUsed` → `_decisionWeekUsed`(キー名だけ変更。値の意味は同じ)
  - `f._careWeekUsed` → `f._decisionWeekUsed`(選手単位)
  - 発動条件チェックは `DECISION_DOCS[id].effect` と `activationCondition` を参照
  - コスト計算は `doc.cost` / `doc.unitCost` / `doc.decisionCost` を参照
- `costume` / `special_treatment` の分岐は実装しない(削除済み書類 / Phase 5 で怪我モーダル統合)
- `hireCoach` の分岐も実装しない(コーチ画面から呼ばれる、Phase 5)

**追加するコード(骨格)**:
```javascript
  // ── 決裁枠コスト / 資金コスト計算 ────────────────────────────────────────
  calcCost(doc, state) {
    if (doc.effect && doc.effect.target === 'team' && doc.unitCost) {
      const headcount = (state.roster || []).filter(f => !f.isRental && !f.injury).length;
      return doc.unitCost * Math.max(headcount, doc.minHeadcount || 4);
    }
    return doc.cost || 0;
  },

  // ── 決裁実行 ─────────────────────────────────────────────────────────────
  // 返り値: { roster, funds, lockerRoomMorale, events, changes, decisionPoints,
  //          _decisionWeekUsed, reactionKey, reactionFighterId, orgPopDelta?, relationships? }
  //        | { error: 'xxx', ... }
  execute(docId, fighterId, state) {
    const doc = Engine.shachoshitsu.getDoc(docId);
    if (!doc) return { error: 'doc_not_found' };

    // minOrgPop / 発動条件の最終確認(レンダー時のフィルタが外れた場合の保険)
    if (doc.minOrgPop && (state.orgPop || 0) < doc.minOrgPop) {
      return { error: 'orgpop_locked', required: doc.minOrgPop };
    }
    if (!Engine.shachoshitsu.checkActivation(docId, state)) {
      return { error: 'condition_not_met' };
    }

    // 決裁枠チェック
    const dpCost = doc.decisionCost || 0;
    const currentDp = state.decisionPoints || 0;
    if (currentDp < dpCost) return { error: 'decision_points_insufficient' };

    // 資金チェック
    const actualCost = Engine.shachoshitsu.calcCost(doc, state);
    if ((state.funds || 0) < actualCost) return { error: 'funds_insufficient' };

    // ── 以下、Engine.careActions.execute をほぼそのまま移植 ──
    let roster = [...state.roster];
    let lockerRoomMorale = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
    let _decisionWeekUsed = state._decisionWeekUsed ? { ...state._decisionWeekUsed } : {};
    const events = [];
    const changes = [];
    let reactionKey = docId;
    let reactionFighterId = fighterId;
    let orgPopDelta = 0;

    // OVR傾斜 / trust gainMult などは既存の Engine.careActions のヘルパーを流用
    // (コピーしてローカル関数として定義するのが安全。Engine.careActions が Phase 5 で
    //  消えるときに参照切れを防ぐため)
    const careOvrMult = (fighter) => {
      const ovr = Engine.util.ov(fighter);
      return 0.7 + (100 - ovr) / 100 * 0.9;
    };
    const applyTrust = (fighter, delta, skipOvrScale) => {
      const mental = fighter.mn || 50;
      let adjusted = Engine.trust.applyCoeff(delta, mental);
      if (!skipOvrScale) adjusted *= careOvrMult(fighter);
      const oldTrust = fighter.trust != null ? fighter.trust : 50;
      if (adjusted > 0) adjusted *= Engine.trust.gainMult(oldTrust);
      const newTrust = Engine.util.clamp(oldTrust + adjusted, 0, 100);
      return { ...fighter, trust: newTrust };
    };

    // ── 個人書類(target: 'individual') ──
    if (doc.effect.target === 'individual') {
      const idx = roster.findIndex(f => f.id === fighterId);
      if (idx < 0) return { error: 'fighter_not_found' };
      let f = { ...roster[idx] };
      const _before = {
        trust: f.trust != null ? f.trust : 50,
        condition: f.condition || 70,
      };

      // cooldown チェック(選手単位)
      const lastUsed = (f._decisionWeekUsed || {})[docId] || -99;
      const cooldown = doc.cooldown != null ? doc.cooldown : 1;
      if (state.week - lastUsed < cooldown) return { error: 'cooldown' };

      // 書類ごとの効果適用(switch で分岐)
      if (docId === 'bonus') {
        const repeatCount = f._bonusRepeat || 0;
        // Phase 4 では遅延発現しない。baseDelta をそのまま即時適用。
        const trustGain = Math.max(0.77, (doc.effect.trust || 0) - repeatCount * 1.53);
        f = applyTrust(f, trustGain);
        f._bonusRepeat = repeatCount + 1;
        events.push(`💰 ${f.name}にボーナスを支給`);
        if (repeatCount >= 2) reactionKey = 'bonus_repeat';
      } else if (docId === 'encourage') {
        if (!f.slump && !f.motivationLoss) return { error: 'not_slump' };
        const highTrust = (f.trust || 50) >= 60;
        const m = doc.effect.slumpMomentum || {};
        const momentumBoost = highTrust ? (m.high || 4.0) : (m.low || 2.5);
        if (f.slump) {
          f = { ...f, slump: { ...f.slump, recoveryMomentum: (f.slump.recoveryMomentum || 0) + momentumBoost } };
        }
        if (f.motivationLoss) {
          f = { ...f, motivationLoss: { ...f.motivationLoss, recoveryMomentum: (f.motivationLoss.recoveryMomentum || 0) + momentumBoost * 0.7 } };
        }
        f = applyTrust(f, doc.effect.trust || 0.77);
        reactionKey = highTrust ? 'encourage_high_trust' : 'encourage';
        events.push(`💬 ${f.name}と面談(スランプ回復促進)`);
      } else if (docId === 'refresh_leave') {
        if (!f.slump && !f.motivationLoss) return { error: 'not_slump' };
        const momentumBoost = typeof doc.effect.slumpMomentum === 'number'
          ? doc.effect.slumpMomentum : 12.0;
        if (f.slump) {
          f = { ...f, slump: { ...f.slump, recoveryMomentum: (f.slump.recoveryMomentum || 0) + momentumBoost } };
        }
        if (f.motivationLoss) {
          f = { ...f, motivationLoss: { ...f.motivationLoss, recoveryMomentum: (f.motivationLoss.recoveryMomentum || 0) + momentumBoost * 0.67 } };
        }
        f = { ...f, condition: Math.min(100, (f.condition || 70) + (doc.effect.condition || 15)) };
        f = applyTrust(f, doc.effect.trust || 5.36);
        events.push(`🏖️ ${f.name}に休暇辞令(スランプ回復大促進・状態+${doc.effect.condition || 15})`);
      } else if (docId === 'trainer') {
        f = applyTrust(f, doc.effect.trust || 5.97);
        const gb = doc.effect.growthBoost || { weeks: 4, mult: 1.3 };
        f._trainerBuff = { weeksLeft: gb.weeks, mult: gb.mult };
        events.push(`💪 ${f.name}に専属トレーナー(${gb.weeks}週間 成長+30%)`);
      } else if (docId === 'media') {
        f = applyTrust(f, doc.effect.trust || 5.36);
        f = { ...f, condition: Math.min(100, (f.condition || 70) + (doc.effect.condition || 5)) };
        orgPopDelta = doc.effect.orgPopDelta || 0.4;
        events.push(`📺 ${f.name}のメディア露出を手配(団体知名度 +${orgPopDelta})`);
      } else {
        return { error: 'unsupported_doc', docId };
      }

      // cooldown 記録(選手単位)
      f._decisionWeekUsed = { ...(f._decisionWeekUsed || {}), [docId]: state.week };
      roster[idx] = f;

      // changes 構築
      const _after = { trust: f.trust, condition: f.condition || 70 };
      if (_after.trust !== _before.trust) {
        changes.push({ label: '信頼度', emoji: '🤝', text: Engine.trust.describeChange(_after.trust - _before.trust) });
      }
      if (_after.condition !== _before.condition) {
        changes.push({ label: '状態', emoji: '💪', before: _before.condition, after: _after.condition });
      }
      if (docId === 'trainer') {
        const gb = doc.effect.growthBoost;
        changes.push({ label: '成長速度', emoji: '📈', text: `${gb.weeks}週間 +${Math.round((gb.mult-1)*100)}%` });
      }
      if (docId === 'media') changes.push({ label: '団体露出', emoji: '📺', text: '団体の知名度が少し上がった' });
      if (docId === 'encourage') changes.push({ label: 'スランプ回復', emoji: '💪', text: 'ほんの少し、気持ちが楽になったようだ' });
      if (docId === 'refresh_leave') changes.push({ label: 'スランプ回復', emoji: '💪', text: '心身ともにリフレッシュし、回復が大きく進んだ' });
    }

    // ── 団体書類(target: 'team') ──
    if (doc.effect.target === 'team') {
      if (_decisionWeekUsed[docId] === state.week) return { error: 'cooldown' };
      const _beforeMorale = lockerRoomMorale;

      if (docId === 'party') {
        roster = roster.map(f => {
          if (f.injury) return f;
          return applyTrust(f, doc.effect.trust || 1.84);
        });
        lockerRoomMorale = Engine.util.clamp(lockerRoomMorale + (doc.effect.morale || 5), 0, 100);
        changes.push({ label: '全員の信頼度', emoji: '🤝', text: '少し上がった' });
        changes.push({ label: 'ロッカールーム', emoji: '🏠', before: _beforeMorale, after: lockerRoomMorale });
        events.push(`🍻 慰労会を開催(チームの雰囲気が良くなった)`);
        reactionFighterId = null;
      } else if (docId === 'camp') {
        const gb = doc.effect.growthBoost || { weeks: 2, mult: 1.5 };
        roster = roster.map(f => {
          if (f.injury) return f;
          const newF = applyTrust(f, doc.effect.trust || 1.84);
          return { ...newF, _trainerBuff: { weeksLeft: gb.weeks, mult: gb.mult } };
        });
        changes.push({ label: '全員の信頼度', emoji: '🤝', text: '少し上がった' });
        changes.push({ label: '全員の成長速度', emoji: '📈', text: `${gb.weeks}週間 +${Math.round((gb.mult-1)*100)}%` });
        events.push(`🏕️ 合宿を実施(全員の成長バフ ${gb.weeks}週間)`);
        reactionFighterId = null;
      } else {
        return { error: 'unsupported_doc', docId };
      }

      _decisionWeekUsed = { ..._decisionWeekUsed, [docId]: state.week };
    }

    // ── 人間関係反映(既存 Engine.careActions の Phase 4 と同じロジック) ──
    let updatedRelationships = null;
    if (state.relationships) {
      const relRng = Engine.rng.create(Engine.rng.derive(state.rngSeed, state.season, state.week, 0xBE50));
      let relState = { relationships: { ...state.relationships } };
      const relRosterIds = roster.filter(c => !c.isRental).map(c => c.id);

      if (docId === 'encourage' || docId === 'refresh_leave') {
        relState = Engine.relationships.applyToRoster({ ...state, ...relState }, fighterId, relRosterIds, { min: 1, max: 2 }, { min: 0, max: 0 }, relRng);
      } else if (docId === 'media') {
        relState = Engine.relationships.applyToRoster({ ...state, ...relState }, fighterId, relRosterIds, { min: 1, max: 2 }, { min: 0, max: 0 }, relRng);
        relState = Engine.relationships.applyFromRoster(relState, relRosterIds, fighterId, { min: -1, max: -1 }, { min: 0, max: 0 }, relRng);
      } else if (docId === 'camp' || docId === 'party') {
        const pairIds = roster.filter(c => !c.isRental && !c.injury).map(c => c.id);
        relState = Engine.relationships.applyAllPairs({ ...state, ...relState }, pairIds, { min: 2, max: 4 }, { min: 0, max: 0 }, relRng);
      }
      updatedRelationships = relState.relationships;
    }

    // ── 返り値構築 ──
    const newFunds = (state.funds || 0) - actualCost;
    const newDp = Math.max(0, currentDp - dpCost);
    const result = {
      roster, lockerRoomMorale, funds: newFunds, cost: actualCost, events, reactionKey,
      reactionFighterId, changes, _decisionWeekUsed, decisionPoints: newDp,
    };
    if (orgPopDelta) result.orgPopDelta = orgPopDelta;
    if (updatedRelationships) result.relationships = updatedRelationships;
    return result;
  },

  // ── リアクションセリフ取得(既存 Engine.careActions と同じ辞書を使う) ──
  getReactionText(docId, fighter) {
    if (typeof CARE_REACTION_DIALOGUES === 'undefined') return '…';
    const dialogues = CARE_REACTION_DIALOGUES[docId];
    if (!dialogues) return '…';
    return pickDialogueLine(dialogues, fighter);
  },
```

**重要**: `CARE_REACTION_DIALOGUES` は Phase 5 で `DECISION_REACTION_DIALOGUES` などにリネームする予定だが、Phase 4 では **既存の辞書をそのまま参照する**。リネームは Phase 5 で一括で行う。

**検証**:
- bonus を実行 → 対象選手の trust 上昇、資金-50、decisionPoints-1、_bonusRepeat 増加
- encourage を実行 → slump 中でなければ `error: 'not_slump'` を返す
- party を実行 → 全員 trust 上昇 + morale+5、_decisionWeekUsed[party] = state.week
- 連続実行で cooldown が効く

---

### Task 2: `_decisionWeekUsed` と `_decisionDoneThisWeek` の週進行時リセット

**ファイル**: `src/management.js`

**場所**: `tickWeek` 内、既存の `_teamCareWeekUsed` リセット処理の直後(検索アンカー: `_teamCareWeekUsed`)

**追加するコード**:
```javascript
    // 社長室 Phase 4: 週進行時に _decisionDoneThisWeek をクリア
    // (_decisionWeekUsed はクリアしない。各書類の cooldown 判定に使うため)
    if (s._decisionDoneThisWeek && s._decisionDoneThisWeek.length > 0) {
      s = { ...s, _decisionDoneThisWeek: [] };
    }
```

**設計ノート**:
- `_decisionWeekUsed` はシーズンをまたいで保持(`cooldown` 判定に必要)
- `_decisionDoneThisWeek` は「今週机の上で朱印済み表示にする書類ID」のリスト。週進行でクリア
- `f._decisionWeekUsed` も同様にシーズン末リセットしない(`cooldown` 判定継続)

---

### Task 3: App.executeDecision() 実装

**ファイル**: `src/app.js`

**場所**: 既存の `App.executeCareAction` の直後(検索アンカー: `executeCareAction(actionId, fighterId) {`)

**追加するコード**:
```javascript
  // 社長室 Phase 4: 決裁実行エントリポイント
  // fighterId: 個人書類のとき対象選手ID、team書類のとき null
  // 返り値: { ok, displayData } | { ok: false, error }
  executeDecision(docId, fighterId) {
    const result = Engine.shachoshitsu.execute(docId, fighterId, G);
    if (!result) { showToast('書類が見つかりません'); return { ok: false }; }
    if (result.error === 'doc_not_found') { showToast('書類が見つかりません'); return { ok: false }; }
    if (result.error === 'decision_points_insufficient') { showToast('決裁枠が不足しています'); return { ok: false }; }
    if (result.error === 'funds_insufficient') { showToast('資金が不足しています'); return { ok: false }; }
    if (result.error === 'fighter_not_found') { showToast('選手が見つかりません'); return { ok: false }; }
    if (result.error === 'not_slump') { showToast('スランプ中の選手ではありません'); return { ok: false }; }
    if (result.error === 'cooldown') { showToast('今週はすでに決裁済みです'); return { ok: false }; }
    if (result.error === 'orgpop_locked') { showToast(`団体の知名度が足りません(${result.required} 必要)`); return { ok: false }; }
    if (result.error === 'condition_not_met') { showToast('この書類の発動条件を満たしていません'); return { ok: false }; }

    // state 更新
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      _decisionWeekUsed: result._decisionWeekUsed || G._decisionWeekUsed || {},
      _decisionDoneThisWeek: [...(G._decisionDoneThisWeek || []), docId],
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    if (result.relationships) G = { ...G, relationships: result.relationships };
    if (result.orgPopDelta) {
      const newOrgPop = Engine.util.clamp((G.orgPop || 0) + Engine.orgPop.applyOrgPopChange(result.orgPopDelta, G.orgPop, null), 0, 100);
      G = { ...G, orgPop: newOrgPop };
    }
    Storage.autoSave();

    // displayData 構築(結果トースト用)
    const doc = Engine.shachoshitsu.getDoc(docId);
    const reactionKey = result.reactionKey || docId;
    let displayData = null;
    if (result.reactionFighterId != null) {
      const fighter = G.roster.find(f => f.id === result.reactionFighterId);
      if (fighter) {
        const text = Engine.shachoshitsu.getReactionText(reactionKey, fighter);
        displayData = {
          fighter, text, changes: result.changes || [],
          cost: result.cost || 0, remainingFunds: result.funds,
          icon: doc?.icon || '', label: doc?.label || '', docId,
        };
      }
    } else {
      displayData = {
        fighter: null, isTeam: true, changes: result.changes || [],
        cost: result.cost || 0, remainingFunds: result.funds,
        icon: doc?.icon || '', label: doc?.label || '', docId,
      };
    }

    // サウンド(コスト別、既存流用)
    const soundCost = result.cost || 0;
    if (docId === 'camp') Audio.play('fanfare');
    else if (soundCost >= 160) Audio.play('award');
    else if (soundCost >= 80) Audio.play('event');
    else Audio.play('notify');

    // 社長室画面を再レンダリングして決裁済み状態を反映 + 印鑑を倒す
    if (typeof renderShachoshitsu === 'function') renderShachoshitsu();
    return { ok: true, displayData };
  },
```

**検証**:
- bonus を実行 → 資金/decisionPoints/roster が更新され、Storage.autoSave が走る
- 連続実行で cooldown / decision_points_insufficient などが正しくトーストに出る
- displayData がモーダル表示用に正しく組まれる

---

### Task 4: 対象選手選択モーダル `showDecisionTargetModal`

**ファイル**: `src/ui-common.js`

**場所**: 既存の `showCareActionModal` 関数の **末尾の直後**(元のまま残す)

**実装方針**:
- spec §8.2 のモックに沿って、個人書類で対象候補を選ぶシンプルなモーダル
- 候補選手: `Engine.shachoshitsu.checkActivation` のロジックを書類別に適用
  - bonus: `f.trust < 60` の選手
  - encourage / refresh_leave: `f.slump || f.motivationLoss` の選手
  - trainer / media: 全員(非レンタル・非怪我)
- 各選手カード: 顔画像(48px角丸) + 名前 + 現在 trust(bonus時) or スランプ状態(encourage等時)
- 選択状態: 選手カードをクリック → `.selected` クラス付与
- 決裁実行ボタン: `App.executeDecision(docId, selectedFighterId)` を呼ぶ → 結果を受けて次のステップへ

**追加するコード(骨格)**:
```javascript
// 社長室 Phase 4: 対象選手選択モーダル(個人書類用)
function showDecisionTargetModal(docId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS[docId] : null;
  if (!doc) return;

  // 候補選手の絞り込み(書類別)
  const roster = state.roster || [];
  let candidates = roster.filter(f => !f.isRental && !f.injury);
  if (docId === 'bonus') {
    candidates = candidates.filter(f => (f.trust != null ? f.trust : 50) < 60);
  } else if (docId === 'encourage' || docId === 'refresh_leave') {
    candidates = candidates.filter(f => f.slump || f.motivationLoss);
  }
  // 現在ウィークの cooldown も除外
  candidates = candidates.filter(f => {
    const lastUsed = (f._decisionWeekUsed || {})[docId] || -99;
    const cooldown = doc.cooldown != null ? doc.cooldown : 1;
    return (state.week - lastUsed) >= cooldown;
  });

  if (candidates.length === 0) {
    showToast('対象候補の選手がいません');
    return;
  }

  // モーダルHTML構築(既存の showCareActionModal を参考に shachoshitsu-* プレフィックスで書く)
  // 実装詳細は省略。ポイント:
  // - 背景オーバーレイ + 中央モーダルボックス
  // - タイトル: doc.label + doc.icon
  // - コスト表示: `${actualCost}万 / 決裁⚡${doc.decisionCost}`(actualCost は Engine.shachoshitsu.calcCost で算出)
  // - 候補選手カードグリッド(3-4列、選択で .selected クラス)
  // - [キャンセル] [決裁実行] ボタン
  // - 決裁実行押下時: App.executeDecision(docId, selectedId) → 結果トースト表示

  // ★選択状態は local state(let selectedId)で管理。DOM直接操作でOK。
}
```

**CSS** (`src/index.html`): `.shachoshitsu-decision-overlay` / `.shachoshitsu-decision-modal` 系のクラスを新規追加。既存 `.care-overlay` は触らない。

**検証**:
- bonus をクリック → trust<60 の選手だけがモーダルに出る
- encourage → スランプ中の選手だけ
- trainer → 全員
- キャンセル → モーダル閉じるだけ、state 変更なし
- 決裁実行 → App.executeDecision 呼び出し → 朱印演出 → トースト

---

### Task 5: 団体確認モーダル `showDecisionConfirmModal`

**ファイル**: `src/ui-common.js`

**場所**: `showDecisionTargetModal` の直後

**実装方針**:
- party / camp 用。対象選手の選択不要、確認のみ
- 「対象: 団体全員(N名)」「コスト: X万 / 決裁⚡Y」「効果: ...」を表示
- [キャンセル] [決裁実行] ボタン

**追加するコード(骨格)**:
```javascript
// 社長室 Phase 4: 団体書類の確認モーダル
function showDecisionConfirmModal(docId, state) {
  const doc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS[docId] : null;
  if (!doc) return;
  const headcount = (state.roster || []).filter(f => !f.isRental && !f.injury).length;
  const actualCost = Engine.shachoshitsu.calcCost(doc, state);
  // HTML構築: タイトル / 対象人数 / コスト / 効果サマリー(doc.effectSummary) / [キャンセル][決裁実行]
  // 決裁実行時: App.executeDecision(docId, null) → 結果トースト
}
```

**検証**:
- party → 対象N名の確認表示
- camp → 同様 + コストが `単価×人数` になっている

---

### Task 6: 書類クリックハンドラ

**ファイル**: `src/ui-render.js`

**場所**: `renderShachoshitsu` 内の書類HTMLテンプレート。現状 `<div class="shachoshitsu-doc" ...>` には onclick がない。

**修正内容**:
```javascript
      html += `
        <div class="shachoshitsu-doc" data-doc-id="${doc.id}" data-category="${doc.category}" data-col="${gridCol}" onclick="App.onShachoshitsuDocClick('${doc.id}')">
          ...
```

**ファイル**: `src/app.js`

**場所**: `App.executeDecision` の直前

**追加する関数**:
```javascript
  // 社長室 Phase 4: 机の書類をクリック → モーダル分岐
  onShachoshitsuDocClick(docId) {
    Audio.play('click');
    // 決裁済みなら無視
    if ((G._decisionDoneThisWeek || []).includes(docId)) return;
    // 決裁枠不足チェック(UX向上のため事前チェック)
    const doc = Engine.shachoshitsu.getDoc(docId);
    if (!doc) return;
    const dpCost = doc.decisionCost || 0;
    if ((G.decisionPoints || 0) < dpCost) {
      showToast(`決裁枠が不足しています(必要: ⚡${dpCost})`);
      return;
    }
    const actualCost = Engine.shachoshitsu.calcCost(doc, G);
    if ((G.funds || 0) < actualCost) {
      showToast(`資金が不足しています(必要: ${actualCost}万)`);
      return;
    }
    // 個人書類 / 団体書類で分岐
    if (doc.effect.target === 'team') {
      showDecisionConfirmModal(docId, G);
    } else {
      showDecisionTargetModal(docId, G);
    }
  },
```

**検証**:
- 決裁済み書類クリック → 無反応
- 資金不足 → トースト表示、モーダル開かない
- 決裁枠不足 → トースト表示、モーダル開かない
- 正常ケース → モーダル表示

---

### Task 7: 朱印エフェクト + 印鑑倒れアニメ

**ファイル**: `src/index.html`

**場所**: `.shachoshitsu-*` の CSS ブロック末尾

**追加するCSS**:
```css
/* 決裁済み書類: 朱印画像をオーバーレイ */
.shachoshitsu-doc.is-approved { cursor: default; filter: saturate(0.6) brightness(0.9) }
.shachoshitsu-doc.is-approved::after {
  content: ''; position: absolute; inset: 0;
  background: url('../image/shachoshitsu/stamp-effect.webp') center/60% no-repeat;
  pointer-events: none; opacity: 1;
}
/* 朱印アニメーション: 書類クリック直後の0.6秒演出用 */
@keyframes stamp-slam {
  0%   { opacity: 0; transform: scale(2) rotate(-10deg); }
  30%  { opacity: 1; transform: scale(1.1) rotate(-3deg); }
  100% { opacity: 1; transform: scale(1) rotate(-2deg); }
}
.shachoshitsu-doc.is-approving::after {
  content: ''; position: absolute; inset: 0;
  background: url('../image/shachoshitsu/stamp-effect.webp') center/60% no-repeat;
  animation: stamp-slam 0.6s ease-out forwards;
  pointer-events: none; z-index: 80;
}
/* 印鑑が倒れるアニメーション */
@keyframes hanko-fall {
  0%   { transform: rotate(0deg); opacity: 1; }
  100% { transform: rotate(90deg); opacity: 0.5; }
}
.shachoshitsu-hud .hanko.falling {
  animation: hanko-fall 0.5s ease-out forwards;
}
```

**ファイル**: `src/ui-render.js`

**`renderShachoshitsu` 内の変更**:
- `_decisionDoneThisWeek.includes(doc.id)` なら `.is-approved` クラスを付与
- 朱印画像を `document-stamped.webp` に差し替え(背景画像)

**CSS の is-approved バリアント**:
```css
.shachoshitsu-doc.is-approved {
  background-image: url('../image/shachoshitsu/document-stamped.webp');
}
```

**App.executeDecision 内の演出フック追加**:
- 結果を state に反映した後、対象書類の DOM 要素に `.is-approving` クラスを付与 → 0.6秒後に `.is-approved` に切り替え(再レンダで反映)
- 同時に HUD の最初の「立っている」hanko に `.falling` クラスを付与

**検証**:
- 書類をクリック → 朱印演出0.6秒 → 書類が .is-approved 表示に切り替わる
- HUD の印鑑が倒れる演出 → 次の州進行で is-approved がクリアされる
- 週を1進める → 決裁済み書類がリセットされて再度クリック可能に

---

### Task 8: 結果トースト

**ファイル**: `src/ui-common.js` の末尾、または既存 `showToast` の近く

**実装方針**: Phase 4 では **シンプルな1行トースト** で OK。不確実性テキスト(Phase 8)や豪華なポップアップ(Phase 9)は後回し。

**追加するコード**:
```javascript
// 社長室 Phase 4: 決裁実行の結果トースト
function showDecisionResultToast(displayData) {
  if (!displayData) return;
  const name = displayData.fighter?.name || '団体全員';
  const icon = displayData.icon || '';
  const label = displayData.label || '決裁';
  // 1行メッセージ構築: "💰 ボーナス支給願 → 山田花子: 信頼度 少し上昇"
  let msg = `${icon} ${label} → ${name}`;
  const firstChange = (displayData.changes || [])[0];
  if (firstChange) {
    const deltaStr = firstChange.text || `${firstChange.before}→${firstChange.after}`;
    msg += `: ${firstChange.label} ${deltaStr}`;
  }
  showToast(msg);
}
```

**App.executeDecision 内の呼び出し**:
```javascript
    // ... state 更新 / 演出 ...
    showDecisionResultToast(displayData);
    return { ok: true, displayData };
```

---

### Task 9: マイグレーション

**ファイル**: `src/app.js`

**場所**: 既存の `_migrated_decisionPoints_v1` マイグレーションの直後

**追加するコード**:
```javascript
      // 社長室 Phase 4: _decisionWeekUsed / _decisionDoneThisWeek の初期化
      if (G._decisionWeekUsed === undefined) {
        G = { ...G, _decisionWeekUsed: {}, _decisionDoneThisWeek: [] };
      }
      // 選手ごとの _decisionWeekUsed 初期化(空オブジェクトで埋める)
      if (G.roster && G.roster.some(f => f._decisionWeekUsed === undefined)) {
        G = { ...G, roster: G.roster.map(f => f._decisionWeekUsed === undefined ? { ...f, _decisionWeekUsed: {} } : f) };
      }
```

**検証**: Phase 3 時点のセーブを読み込み → エラーなしで起動 → 社長室から bonus 実行できる

---

### Task 10: validateGameState に不変条件追加

**ファイル**: `src/management.js`、`Engine.validateGameState` 内

**追加するコード(decisionPoints チェックの後)**:
```javascript
  // ── 社長室(決裁消費関連) ──
  if (G._decisionDoneThisWeek !== undefined && !Array.isArray(G._decisionDoneThisWeek)) {
    warn(`_decisionDoneThisWeek が配列でない: ${typeof G._decisionDoneThisWeek}`);
    G._decisionDoneThisWeek = [];
  }
  if (G._decisionWeekUsed !== undefined && typeof G._decisionWeekUsed !== 'object') {
    warn(`_decisionWeekUsed がオブジェクトでない: ${typeof G._decisionWeekUsed}`);
    G._decisionWeekUsed = {};
  }
```

---

### Task 11: auto-sim 検証

Phase 4 は `management.js` を編集するので auto-sim が自動実行される。

auto-sim 側は **プレイヤー判断をランダム自動化** しているので、Engine.shachoshitsu.execute は通常呼ばれない(UIボタン経由のため)。よって不変条件違反は出にくい。

手動で100シーズン以上のチェックを推奨:
```bash
node test/auto-sim.js 100
```

---

### Task 12: ブラウザ実機確認

以下を手動で確認:

1. ゲーム起動 → 社長室タブ → bonus をクリック
2. 対象選手モーダル表示 → 候補が trust<60 の選手のみ
3. 選手選択 → 決裁実行ボタン → 朱印演出 → トースト表示
4. HUD の印鑑が1つ倒れる、decisionPoints が 6 → 5
5. 同じ bonus 書類が朱印付き(is-approved)表示に切り替わっている
6. 週を1進める → 決裁済みがリセットされる
7. party をクリック → 団体確認モーダル → 決裁実行 → 全員 trust 上昇トースト
8. camp をクリック → コスト `単価×人数` 表示 → 決裁実行 → 全員 _trainerBuff 付与
9. trainer を同じ選手に4週連続クリックしようとする → cooldown トーストが出る
10. 決裁枠0の状態で書類クリック → 「決裁枠が不足しています」トースト

---

### Task 13: spec / roadmap 更新

- `specs/shachoshitsu-spec-v1.0.md` §11 の Phase 4 セクションに「✅ 完了(日付)」と実装メモを追加
- `docs/ui/shachoshitsu.md` の「実装状況」を「Phase 1-4 完了」に更新
- `docs/game-system-roadmap.md` に 1行追記

---

## 完了の定義

- [ ] `Engine.shachoshitsu.execute` が実装されていて、既存の 7 書類全てが動作する
- [ ] `Engine.shachoshitsu.calcCost` / `getReactionText` 実装済み
- [ ] `App.executeDecision` / `App.onShachoshitsuDocClick` 実装済み
- [ ] 対象選手選択モーダル(個人書類) / 団体確認モーダル(team書類) が動作する
- [ ] 朱印エフェクト + 印鑑倒れアニメ + 決裁済み書類の差し替え動作
- [ ] 結果トーストが表示される
- [ ] 週進行で `_decisionDoneThisWeek` がリセットされる
- [ ] `Engine.validateGameState` に新しい不変条件が追加されている
- [ ] マイグレーション: Phase 3 時点のセーブを読み込んでもエラーなし
- [ ] auto-sim 100 シーズン以上で違反なし
- [ ] 既存のケアモーダル(💝 ケアボタン)は壊れていない — 並行稼働している
- [ ] 既存の `G.careStock` / `Engine.careActions` に変更を加えていない
- [ ] 既存セーブ互換

---

## 完了時のコミット

```
feat(shachoshitsu): Phase 4 — 決裁実行ロジック

- Engine.shachoshitsu.execute 実装(既存 careActions.execute を移植・改修)
  - 7書類全ての効果適用(bonus/encourage/refresh_leave/trainer/media/party/camp)
  - 決裁枠 / 資金 / cooldown / 発動条件の最終チェック
  - Phase 7 の遅延発現 / Phase 8 の不確実性はまだ適用しない(即時・固定値)
- Engine.shachoshitsu.calcCost / getReactionText 実装
- App.executeDecision / App.onShachoshitsuDocClick エントリポイント追加
- 対象選手選択モーダル(showDecisionTargetModal, 個人書類用)
- 団体確認モーダル(showDecisionConfirmModal, team書類用)
- 朱印エフェクト(stamp-slam keyframe)+ 印鑑倒れアニメ(hanko-fall)
- 決裁済み書類表示(document-stamped.webp 差し替え + is-approved クラス)
- 週進行時に _decisionDoneThisWeek をクリア(tickWeek)
- 結果トースト(showDecisionResultToast)
- validateGameState に _decisionWeekUsed / _decisionDoneThisWeek チェック追加
- Phase 3 セーブからのマイグレーション(_decisionWeekUsed / 選手側も空初期化)

既存のケアモーダルは Phase 5 まで並行稼働(G.careStock / Engine.careActions / showCareActionModal 全て未変更)

仕様: specs/shachoshitsu-spec-v1.0.md §4, §8, §11 (Phase 4)
指示書: plans/shachoshitsu-phase4-task.md
```

---

## 禁止事項(再掲)

- ❌ 既存の `CARE_ACTIONS` / `Engine.careActions` / `showCareActionModal` / `App.openCareModal` の改変
- ❌ `G.careStock` / `careStockMax` / `careStockLastRecovery` / `_teamCareWeekUsed` の削除
- ❌ 今週画面の「💝 ケア」ボタン削除
- ❌ 遅延発現(`pendingTrustDeltas`)の実装 — Phase 7 の範囲
- ❌ 不確実性(性格×書類マトリクス)の実装 — Phase 8 の範囲
- ❌ hireCoach のコーチ画面連動 — Phase 5 の範囲
- ❌ `special_treatment` の怪我モーダル統合 — Phase 5 の範囲
- ❌ ハードコード16進色の使用
- ❌ `care-overlay` / `care-box` CSS の再利用(新規 `shachoshitsu-*` で書く)

---

## トラブルシュート

### `decision_points_insufficient` が常に出る
- `G.decisionPoints` が undefined のまま → マイグレーションが効いていない
- app.js のマイグレーションブロック `_migrated_decisionPoints_v1` が走っているか確認

### bonus 連続実行で trust が上がらない
- `_bonusRepeat` が蓄積して trustGain が下限 0.77 に張り付いている可能性
- 異なる選手で試す、または `_bonusRepeat` の蓄積をログで確認

### 朱印演出が出ない
- `.is-approving` クラスの付与 → 0.6秒後 `.is-approved` への切替タイミングのズレ
- `setTimeout` 600ms で切り替える
- `stamp-effect.webp` のパスが正しいか確認(`../image/shachoshitsu/stamp-effect.webp`)

### 印鑑が倒れない
- HUD の hanko が毎回再レンダーされると classList が消える
- `renderShachoshitsu()` を呼ばず、個別の hanko 要素に `classList.add('falling')` を付与する方がよい
- または、animation の終了時に `.falling` クラスを残したまま is-used に切り替える

### auto-sim で違反
- `_decisionWeekUsed` の型チェック違反の可能性 → マイグレーションが全パスで走っているか確認
- auto-sim 自体は Engine.shachoshitsu.execute を呼ばないので、通常は違反なし

### 決裁済み書類が翌週もクリック不可
- `tickWeek` で `_decisionDoneThisWeek` をクリアする処理が抜けている可能性
- 既存の `_teamCareWeekUsed` リセットの直後に新規処理を追加しているか確認

---

## Phase 4 完了後の次のステップ

Phase 4 が Keisuke さんに承認されたら、Phase 5(既存ケアシステム廃止)へ進む。Phase 5 は:

- 今週画面の「💝 ケア」ボタン削除
- `showCareActionModal` / `App.openCareModal` / `App.executeCareAction` 削除
- `CARE_ACTIONS.costume` と関連コード削除
- `CARE_REACTION_DIALOGUES.costume` 削除
- `special_treatment` を怪我発生モーダルに統合
- `hireCoach` のコーチ画面での決裁枠チェック追加
- ケア関連CSS削除
- 旧命名のリファクタリング(`CARE_ACTIONS` → 削除 or alias化)

Phase 5 は削除中心で比較的軽いが、見落としやすいので慎重に。

---

## 保留事項(Phase 3 から持ち越し)

**慰労会(party)の発動条件**: 現状 `morale < 50` 限定だが、予防的に雰囲気が良い時にも使いたいニーズがある。Phase 4 で実機プレイ可能になったら再検討する。

選択肢:
- ①常時使用可(cooldown 延長で抑制)
- ②閾値緩和(例: `morale < 60`)
- ③cooldown 4週に延長、現状維持
- ④現状維持(spec §3.3 のまま)

Phase 4 の実装自体には影響しないが、実機で触れるようになったタイミングで必ず判断すること。

---

以上、Phase 4 実装指示書終わり。
