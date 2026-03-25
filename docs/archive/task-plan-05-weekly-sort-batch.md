# TASK-02: 今週画面のソート＆一括操作 — 計画書

## 概要

今週画面（manage フェーズ）の選手リストに、ソート機能・一括選択・一括行動プリセット適用を追加する。

## 現状の問題

### 今週画面の構造

ui-render.js L808-890 の `renderWeek()` 内で選手テーブルを生成:
- L810-811: `_ownRosterWk`（自前選手）と `_rentalRosterWk`（レンタル）に分離
- L812-881: `_renderWeekRow` でtr要素を生成
- L883: `<table class="data-table">` のヘッダー: 名前/総合/体調/状態/スケジュール/⚡/今週の行動
- L884: `_ownRosterWk.forEach(_renderWeekRow)` でソートなし、roster順そのまま

### 現状の制約

1. **ソート機能なし**: 選手はroster配列の順番（入団順）で固定表示
2. **一括選択なし**: 各選手のスケジュールは個別の`<select>`で1人ずつ変更
3. **行動プリセットなし**: 練習優先やプロモ優先を一括で切り替える手段がない

### 関連する既存ソート実装

ロスター画面（ui-render.js L53-55, L1506-1731）には既にソート機能がある:
```js
let _rosterSortKey = 'ovr';
function setRosterSort(key) { _rosterSortKey = key; renderRoster(); }
```
L1577付近でソートボタンUIを生成。このパターンを今週画面にも適用できる。

## 変更方針

### 1. ソート機能

#### 変更箇所: ui-render.js `renderWeek()` 内 (L808付近)

**新規グローバル変数追加:**
```js
let _weekSortKey = 'ovr'; // デフォルト: OVR降順
let _weekSortDir = 'desc';
function setWeekSort(key) {
  if (_weekSortKey === key) _weekSortDir = _weekSortDir === 'desc' ? 'asc' : 'desc';
  else { _weekSortKey = key; _weekSortDir = 'desc'; }
  renderWeek();
}
```

**ソート対象キー:**
| キー | ラベル | ソート基準 |
|------|--------|-----------|
| `ovr` | 総合 | `Engine.util.ov(c)` |
| `cond` | 体調 | `c.condition` |
| `pop` | 人気 | `c.popularity` |
| `name` | 名前 | `c.name`（五十音順） |
| `trust` | 信頼 | `c.trust` |
| `schedule` | 方針 | `c.schedule` |

**テーブルヘッダー修正 (L883):**
各thをクリック可能にする:
```html
<th onclick="setWeekSort('name')">名前 ${sortIndicator('name')}</th>
<th onclick="setWeekSort('ovr')">総合 ${sortIndicator('ovr')}</th>
...
```

**ソート適用 (L884の前):**
```js
const sortedOwn = [..._ownRosterWk].sort((a, b) => {
  const va = getSortValue(a, _weekSortKey);
  const vb = getSortValue(b, _weekSortKey);
  const cmp = typeof va === 'string' ? va.localeCompare(vb, 'ja') : vb - va;
  return _weekSortDir === 'asc' ? -cmp : cmp;
});
sortedOwn.forEach(_renderWeekRow);
```

### 2. 一括選択（チェックボックス）

#### 変更箇所: ui-render.js `_renderWeekRow` (L812-881)

**各行にチェックボックス追加:**
```html
<td><input type="checkbox" class="week-check" data-id="${c.id}" ${c.isRental ? 'disabled' : ''}></td>
```

**テーブルヘッダーに全選択チェック追加 (L883):**
```html
<th style="width:30px"><input type="checkbox" id="weekCheckAll" onchange="toggleWeekCheckAll(this.checked)"></th>
```

**新規関数:**
```js
function toggleWeekCheckAll(checked) {
  document.querySelectorAll('.week-check:not(:disabled)').forEach(cb => cb.checked = checked);
}
function getCheckedFighterIds() {
  return [...document.querySelectorAll('.week-check:checked')].map(cb => parseInt(cb.dataset.id));
}
```

### 3. 一括行動プリセット

#### 変更箇所: ui-render.js `renderWeek()` 内、テーブルの上 (L806付近)

**プリセットUI:**
```html
<div class="week-batch-panel">
  <span style="font-size:12px;color:var(--text-dim)">選択中の選手に一括適用:</span>
  <button class="btn-sm" onclick="applyWeekPreset('practice')">練習優先</button>
  <button class="btn-sm" onclick="applyWeekPreset('promo')">プロモ優先</button>
  <button class="btn-sm" onclick="applyWeekPreset('balance')">バランス</button>
  <button class="btn-sm" onclick="applyWeekPreset('rest')">休養重視</button>
</div>
```

**新規関数:**
```js
function applyWeekPreset(schedule) {
  const ids = getCheckedFighterIds();
  if (ids.length === 0) return;
  ids.forEach(id => {
    const fighter = G.roster.find(c => c.id === id);
    if (!fighter || fighter.injury || fighter.isRental) return;
    G = { ...G, roster: G.roster.map(c => c.id === id ? { ...c, schedule } : c) };
  });
  renderWeek();
}
```

**既存の個別変更関数 `updateSchedulePreview()` との整合性:**
現在の `updateSchedulePreview()` (app.js内にあるはず) はGameStateのroster内の `schedule` プロパティを更新している。一括操作も同じ仕組みを使うので整合性は問題ない。

### 4. 強化モード一括操作（オプション）

チェック選手の⚡強化を一括ON/OFFにするボタン:
```html
<button class="btn-sm" onclick="batchIntensive(true)">⚡全ON</button>
<button class="btn-sm" onclick="batchIntensive(false)">⚡全OFF</button>
```

## 影響範囲

- **ui-render.js**: `renderWeek()` 関数内のテーブル生成部分 (L780-890)
- **app.js**: 新規関数 `applyWeekPreset()`, `batchIntensive()` 等のGameState更新関数を追加
- **index.html**: `.btn-sm`, `.week-batch-panel` 等のCSS追加（既存スタイルの拡張）
- **engine.js**: 変更なし（UIのみの変更）

他システムへの影響: なし。GameState.roster[].schedule の値を変更するだけで、既存の週処理パイプラインがそのまま動く。

## 検証方法

1. **auto-sim**: engine.jsへの変更なしのため不要
2. **手動確認ポイント** (ユーザー委任):
   - 各ソートキーでクリックすると選手リストが並び替わること
   - 同じキーを2回クリックで昇順/降順が切り替わること
   - 全選択/全解除が動作すること
   - 選択した選手にプリセットが適用されること
   - レンタル選手はチェック不可であること
   - 怪我中の選手のスケジュールが変更されないこと

## 完了条件

- ソート: OVR・体調・人気・名前等で選手リストを並び替えられること
- 一括選択: 全選択/全解除/個別チェックが動作すること
- 一括プリセット: チェックした選手に練習優先/プロモ優先/バランス/休養重視を一括適用できること
- 既存の個別操作（select, ⚡ボタン）が壊れないこと
