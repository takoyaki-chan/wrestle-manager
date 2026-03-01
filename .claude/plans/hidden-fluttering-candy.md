# Phase A 実装計画

## Context

コーチ＋ロッカールーム統合リデザイン（`docs/coach-lockerroom-redesign-v1.0.md`）のうち、
他フェーズに依存しない3つの独立タスクを先行実装する。

---

## A-1: 努力家特性の変更

**ファイル:** `src/engine.js`

### 変更1: baseGain 乗算の削除（L1408-1409）
```
削除:
// 努力家: 練習成長+15%
if (Traits.has(char, '努力家')) baseGain *= 1.15;
```

### 変更2: weeklyVariance 下限の引き上げ（L1417）
```
現在: let weeklyVariance = 0.5 + Engine.rng.float(rng) * 1.0; // 0.5〜1.5
変更後:
const vFloor = Traits.has(char, '努力家') ? 0.75 : 0.5;
let weeklyVariance = vFloor + Engine.rng.float(rng) * (1.5 - vFloor);
```
- 通常: 0.5〜1.5（変更なし）
- 努力家: 0.75〜1.5（下振れしにくい）
- 破天荒の分岐（L1418-1419）はそのまま維持（後勝ちで上書き）

---

## A-2: award-frame 画像パス修正

**ファイル:** `src/index.html` L600-605

| frame | 現在 | 修正後 | 理由 |
|---|---|---|---|
| a | `.png.png` | `none` | ファイル不在 |
| b-f | `.png.png` | `.png.webp` | WebPに差し替え済み |
| g | `none` | 変更なし | 既にOK |

---

## A-3: ケアアクション変更

### 変更1: data.js — CARE_ACTIONSに `minOrgPop` 追加
- bonus: `minOrgPop: 0`（常時解放）
- costume: `minOrgPop: 20`
- trainer: `minOrgPop: 0`（変更なし）
- media: `minOrgPop: 20`
- special_treatment: `minOrgPop: 40`
- party/camp: `minOrgPop: 0`（団体向けは制限なし）

### 変更2: engine.js — costume/media の制限を2週に1回（L5437, L5450）
```
現在: if ((f._careWeekUsed || {})[actionId] === state.week)
変更: if (state.week - ((f._careWeekUsed || {})[actionId] || -99) < 2)
```
→ 前回使用週からの差が2未満なら `{ error: 'cooldown' }`

### 変更3: engine.js — orgPopゲートをcostume/media/special_treatment冒頭に追加
```javascript
if (cfg.minOrgPop && (state.orgPop || 0) < cfg.minOrgPop) return { error: 'orgpop_locked' };
```
→ bonus/trainer の直前にはゲート不要（minOrgPop: 0）。
→ 各アクション分岐に入る前の共通チェックとして、execute() 冒頭に1箇所追加。

### 変更4: ui-common.js — showCareActionModal ロック表示（L2640-2652）
individualActions.forEach 内で:
- `a.minOrgPop > (G.orgPop||0)` → disabled + 「orgPop XX で解放」テキスト表示
- 2週制限の残りクールダウン表示（選手選択後の段階で表示）

### 変更5: app.js — エラーハンドリング追加（L3389）
- `already_used_this_week` → メッセージを「2週に1回まで」に変更（エラーコードは `cooldown` に統一）
- `orgpop_locked` → 「団体の知名度が足りません（orgPop XX 必要）」

---

## 実装順序

1. A-1（engine.js 2箇所、最小変更）
2. A-2（index.html 6行、CSS修正のみ）
3. A-3（data.js → engine.js → ui-common.js → app.js、4ファイル連携）

## 検証

- **A-1**: プレビューで新規ゲーム開始 → 努力家選手のgrowth計算がhitするか console で確認（破天荒と対比）
- **A-2**: プレビューで表彰式画面を確認（`/image/award-frame-b.png.webp` 等が200返却）
- **A-3**: ケアモーダル表示 → orgPop低い初期状態でcostume/media/special_treatmentがグレーアウト表示を確認
