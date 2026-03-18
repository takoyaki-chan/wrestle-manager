# P2+P3 実装仕様: 決着表記変更 & 対戦ポイント追加

> **対象**: glimpse-popup-overhaul-spec-v1.2 の §6（P2）+ §5（P3）
> **実装者**: Claude Code (Sonnet)
> **テスト**: Keisuke が手動確認

---

## P2: 試合決着表記の変更

### 概要

決着表記を「finType / finMove」から「**finMove → 決着方法**」に変更する。
技名が主役、決着方法は補足。

---

### Step 1: formatFinish 関数を追加 (engine.js)

engine.js の末尾付近、`module.exports` ブロックの前に追加:

```javascript
/**
 * 決着表記フォーマット（§6 技名優先表示）
 * @param {string} finType - 'フォール'|'ピン'|'ギブアップ'|'TKO'|'丸め込み'|'HP判定'|'時間切れドロー' 等
 * @param {string} finMove - 技名（例: 'ジャーマンスープレックス'）
 * @param {boolean} [isFinisher=false] - フィニッシャー判定（将来拡張用）
 * @returns {string} フォーマット済み決着表記
 */
function formatFinish(finType, finMove, isFinisher) {
  if (!finMove) return finType || '激闘決着';
  const prefix = isFinisher ? '★ ' : '';
  switch (finType) {
    case 'フォール':
    case 'ピン':
      return `${prefix}${finMove} → 3カウント`;
    case 'ギブアップ':
      return `${prefix}${finMove} → ギブアップ`;
    case 'TKO':
      return `${prefix}${finMove} → レフェリーストップ`;
    case '丸め込み':
      return `${prefix}${finMove} → 丸め込み`;
    default:
      return finType || '激闘決着';
  }
}
```

`module.exports` ブロックに `formatFinish` を追加してエクスポートすること。

**注意**: `isFinisher` 引数は現時点では常に省略（=undefined=falsy）で呼ばれる。フィニッシャーシステムが実装済みになった段階で呼び出し側が判定を渡す。今回は引数だけ用意しておく。

---

### Step 2: app.js — finishLabel 構築の変更

**場所**: `app.js` L3969 付近

```
変更前:
    const finishLabel = [main.finType, main.finMove].filter(Boolean).join(' / ') || '激闘決着';

変更後:
    const finishLabel = formatFinish(main.finType, main.finMove);
```

この `finishLabel` は新聞テンプレート（L3806〜L3905）で `d.finishLabel` として多数参照されるが、テンプレート側は変更不要。

---

### Step 3: ui-common.js — 6箇所の表示変更

全箇所で `finType` の直接表示を `formatFinish()` に置き換える。

#### 3a. L210 付近 — 対抗戦カード結果一覧

```
変更前:
html += `<span style="color:${result.playerWon ? 'var(--blue)' : orgCfg.color}">${winIcon} ${wName}${result.finType ? ' (' + result.finType + ')' : ''}</span>`;

変更後:
html += `<span style="color:${result.playerWon ? 'var(--blue)' : orgCfg.color}">${winIcon} ${wName}${result.finType ? ' (' + formatFinish(result.finType, result.finMove) + ')' : ''}</span>`;
```

#### 3b. L2852 付近 — 興行カード試合結果サマリー

```
変更前:
        <span style="font-size:12px;color:var(--text-sub)">勝利: <strong style="color:var(--text-main)">${wName}</strong>${result.finType ? ` (${result.finType})` : ''}</span>

変更後:
        <span style="font-size:12px;color:var(--text-sub)">勝利: <strong style="color:var(--text-main)">${wName}</strong>${result.finType ? ` (${formatFinish(result.finType, result.finMove)})` : ''}</span>
```

#### 3c. L2948 付近 — 引き分け時の結果詳細

```
変更前:
      <div style="margin-top:2px;font-size:13px;color:var(--text-sub)">${r.finType} / ${r.turns}ターン</div>

変更後:
      <div style="margin-top:2px;font-size:13px;color:var(--text-sub)">${formatFinish(r.finType, r.finMove)} / ${r.turns}ターン</div>
```

#### 3d. L2966 付近 — 勝敗時の結果詳細

```
変更前:
        <span style="font-size:13px;color:var(--text-sub)">${r.finType}${r.finMove ? `（${r.finMove}）` : ''} / ${r.turns}ターン</span>

変更後:
        <span style="font-size:13px;color:var(--text-sub)">${formatFinish(r.finType, r.finMove)} / ${r.turns}ターン</span>
```

#### 3e. L3290 付近 — PPVカード結果

```
変更前:
      html += `<span style="color:var(--green)">✔ ${wName}${result.finType ? ' (' + result.finType + ')' : ''}</span>`;

変更後:
      html += `<span style="color:var(--green)">✔ ${wName}${result.finType ? ' (' + formatFinish(result.finType, result.finMove) + ')' : ''}</span>`;
```

#### 3f. L3375 付近 — PPV試合結果ログ

```
変更前:
    html += `<div style="font-size:12px;color:var(--text-sub)">${r.finType || ''}${r.finMove ? '（' + r.finMove + '）' : ''} MQ: ...

変更後:
    html += `<div style="font-size:12px;color:var(--text-sub)">${formatFinish(r.finType, r.finMove)} MQ: ...
```

---

### Step 4: result オブジェクトに finMove が含まれているか確認

3a (L210) と 3b (L2852) と 3e (L3290) では現在 `result.finType` のみ使用しているが、`result.finMove` も存在するか確認すること。

`result` オブジェクトは `simulateMatch` の戻り値から構築されており、`finType` と `finMove` は常にペアで返される（`app.js` L3262-3263, L5417, L5437, L5460, L5696 で `finType: result.finType || '', finMove: result.finMove || ''` としてコピーされている）。

**結論**: `result.finMove` は全箇所でアクセス可能。ただし空文字列の場合があるので `formatFinish` 内の `if (!finMove)` ガードで処理済み。

---

## P3: B3チャレンジ・乱入マッチの対戦ポイント追加

### 概要

B3チャレンジと乱入マッチに対戦ポイント（battlePoints）の増減を追加する。

---

### Step 1: BATTLE_POINT_CFG に定数追加 (data.js)

**場所**: `data.js` L1904 付近

```
変更前:
const BATTLE_POINT_CFG = {
  war: 9,
  summit: 7,
  tournament: { champion: 20, runnerUp: 8, semiFinal: 0, firstRound: -14 },
  tournamentWeek: 24,
};

変更後:
const BATTLE_POINT_CFG = {
  war: 9,
  summit: 7,
  b3: 3,
  b3draw: 1,
  intrusion: 3,
  tournament: { champion: 20, runnerUp: 8, semiFinal: 0, firstRound: -14 },
  tournamentWeek: 24,
};
```

---

### Step 2: engine.js — B3 step 2（試合結果）に battlePoints 更新を追加

**場所**: `engine.js` L10160 付近、`case 'B3':` の `if (step === 2)` ブロック内

現在の勝利/敗北/引分の各分岐にbattlePoints更新を追加する。
`state.battlePoints` を読み取り、更新後の `battlePoints` オブジェクトを戻り値に含める。

```
変更前（step === 2 ブロックの冒頭、result変数宣言の直後あたり）:
          let orgPopDelta = 0;

変更後:
          let orgPopDelta = 0;
          const bp = { ...(state.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
          const opponentOrgId = event.orgId;
```

各分岐に以下を追加:

**勝利時** (`result.winner === 'left'` ブロック内、`events.push(...)` の直前):
```javascript
            bp.player = (bp.player || 0) + BATTLE_POINT_CFG.b3;
            if (opponentOrgId && bp[opponentOrgId] !== undefined) bp[opponentOrgId] = (bp[opponentOrgId] || 0) - BATTLE_POINT_CFG.b3;
```

**敗北時** (`result.winner === 'right'` ブロック内、`events.push(...)` の直前):
```javascript
            bp.player = (bp.player || 0) - BATTLE_POINT_CFG.b3;
            if (opponentOrgId && bp[opponentOrgId] !== undefined) bp[opponentOrgId] = (bp[opponentOrgId] || 0) + BATTLE_POINT_CFG.b3;
```

**引分時** (`else` ブロック内、`events.push(...)` の直前):
```javascript
            bp.player = (bp.player || 0) + BATTLE_POINT_CFG.b3draw;
```

各 `events.push(...)` のメッセージ末尾に対戦pt情報を付加:

- 勝利: `（人気+...、対戦pt+${BATTLE_POINT_CFG.b3}）`
- 敗北: `（人気...、対戦pt-${BATTLE_POINT_CFG.b3}）`
- 引分: `（人気+...、対戦pt+${BATTLE_POINT_CFG.b3draw}）`

**戻り値に battlePoints を追加**:
step 2 の全 return 文に `battlePoints: bp` を追加。

例:
```
変更前:
          return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, orgPopDelta, relationships };

変更後:
          return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, orgPopDelta, battlePoints: bp, relationships };
```

---

### Step 3: engine.js — B3 step 0（辞退）に battlePoints ペナルティ追加

**場所**: `engine.js` L10148 付近、`choiceIdx !== 0`（辞退）の分岐

```
変更前:
            // Phase0修正: 辞退ペナルティ追加 orgPop -1（逓減適用）
            const declineOrgPopDelta = Engine.orgPop.applyOrgPopChange(-1, state.orgPop, null);
            events.push(`🚫 ${event.orgName || '他団体'}からの対抗戦オファーを断った（団体人気${Math.round(declineOrgPopDelta * 10) / 10}）`);
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, orgPopDelta: declineOrgPopDelta };

変更後:
            // Phase0修正: 辞退ペナルティ追加 orgPop -1（逓減適用）
            const declineOrgPopDelta = Engine.orgPop.applyOrgPopChange(-1, state.orgPop, null);
            // B3辞退: 対戦pt -1.0〜-2.0（小数第1位ランダム）
            const bp = { ...(state.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
            const declineBpPenalty = -(1.0 + Math.round(Engine.rng.float(rng) * 10) / 10);  // -1.0〜-2.0
            bp.player = (bp.player || 0) + declineBpPenalty;
            events.push(`🚫 ${event.orgName || '他団体'}からの対抗戦オファーを断った（団体人気${Math.round(declineOrgPopDelta * 10) / 10}、対戦pt${declineBpPenalty.toFixed(1)}）`);
            return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events, orgPopDelta: declineOrgPopDelta, battlePoints: bp };
```

**注意**: `Engine.rng.float(rng)` が 0.0〜1.0 を返す前提。
`-(1.0 + Math.round(float * 10) / 10)` で -1.0〜-2.0 の範囲（0.1刻み）を生成。

実装時に `Engine.rng.float` の存在を確認すること。なければ `Engine.rng.int(rng, 0, 10) / 10` で代替。

---

### Step 4: app.js — _applyLargeEventResult に battlePoints 処理を追加

**場所**: `app.js` L5145 付近の `_applyLargeEventResult` メソッド内

```
変更前:
    if (result.orgPopDelta) updates.orgPop = G.orgPop + result.orgPopDelta;

変更後:
    if (result.orgPopDelta) updates.orgPop = G.orgPop + result.orgPopDelta;
    if (result.battlePoints) updates.battlePoints = result.battlePoints;
```

---

### Step 5: app.js — 乱入マッチ結果処理に battlePoints 更新を追加

**場所**: `app.js` L3408 付近、`// v1.2: 乱入マッチ結果処理` ブロック内

**乱入者勝利時**（`if (intruderWon)` ブロック内、`events.push(...)` の直前）:
```javascript
        // 乱入敗北: 対戦pt -3
        const bpIntrusion = { ...(s.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
        bpIntrusion.player = (bpIntrusion.player || 0) - BATTLE_POINT_CFG.intrusion;
        s = { ...s, battlePoints: bpIntrusion };
```
`events.push(...)` のメッセージ末尾に `対戦pt-${BATTLE_POINT_CFG.intrusion}` を付加。

**チャンピオン防衛時**（`else` ブロック内、`events.push(...)` の直前）:
```javascript
        // 乱入撃退: 対戦pt +3
        const bpIntrusion = { ...(s.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
        bpIntrusion.player = (bpIntrusion.player || 0) + BATTLE_POINT_CFG.intrusion;
        s = { ...s, battlePoints: bpIntrusion };
```
`events.push(...)` のメッセージ末尾に `対戦pt+${BATTLE_POINT_CFG.intrusion}` を付加。

**注意**: 乱入マッチの相手は外部団体の選手なので、相手側の `bp[orgId]` は更新しない（どの団体から来たか不定のため）。プレイヤー側のみ増減。

---

## チェックリスト（実装後の手動確認用）

### P2: 決着表記

- [ ] 通常興行: 試合結果で「ジャーマンスープレックス → 3カウント」形式で表示される
- [ ] 通常興行: ギブアップ決着で「腕ひしぎ十字固め → ギブアップ」形式で表示される
- [ ] 通常興行: TKO決着で「ラリアット → レフェリーストップ」形式で表示される
- [ ] 通常興行: 丸め込み決着で「エビ固め → 丸め込み」形式で表示される
- [ ] 通常興行: HP判定・時間切れドローはそのまま表示される
- [ ] 新聞パネル: finishLabel が新フォーマットで表示される
- [ ] PPVカード結果: 新フォーマットで表示される
- [ ] PPV試合結果ログ: 新フォーマットで表示される
- [ ] 対抗戦カード結果: 新フォーマットで表示される
- [ ] finMoveが空の場合: finTypeのみ表示される（フォールバック正常）

### P3: 対戦ポイント

- [ ] B3チャレンジ勝利: 対戦pt+3 がログに表示される
- [ ] B3チャレンジ敗北: 対戦pt-3 がログに表示される
- [ ] B3チャレンジ引分: 対戦pt+1 がログに表示される
- [ ] B3チャレンジ辞退: 対戦pt-1.0〜-2.0 がログに表示される
- [ ] 乱入マッチ（防衛成功）: 対戦pt+3 がログに表示される
- [ ] 乱入マッチ（王座奪取）: 対戦pt-3 がログに表示される
- [ ] ランキング画面: battlePoints が正しく反映されている

---

## 禁止事項

- **既存の関数シグネチャを変更しない**
- **テストコードを書かない**: Keisukeが手動確認する
- **ブラウザ起動やスクリーンショット取得をしない**
- **BATTLE_POINT_CFG の既存値（war: 9, summit: 7, tournament）を変更しない**
