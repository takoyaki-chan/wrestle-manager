# セーブデータ書き出し／読み込み 実装スペック v1.0

> **設置場所**: ゲーム中のセーブ画面（`renderSave()`）
> **タイトル画面**: 変更なし（既存の LOAD GAME → セーブ画面経由でアクセス可能）

---

## 1. 概要

別デバイスへのセーブデータ移行を可能にする。

- **エクスポート（書き出し）**: 各セーブスロットから `.json` ファイルをダウンロード
- **インポート（読み込み）**: `.json` ファイルを選択して即ロード（スロットに格納しない）

---

## 2. 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `src/ui-render.js` | `renderSave()` にエクスポートボタン + インポートセクション追加 |
| `src/app.js` | `Storage` オブジェクトに `exportToFile(slot)`, `importFromFile()` を追加 |
| `src/ui-common.js` | ラッパー関数 `exportSave(slot)`, `importSave()` を追加 |
| `src/index.html` | 必要に応じてCSS追加（`.data-transfer-section` 等） |

---

## 3. Storage オブジェクト拡張（app.js）

`Storage` オブジェクト（app.js 1140行付近）に以下の2メソッドを追加：

### 3.1 exportToFile(slotOrAuto)

```js
exportToFile(slotOrAuto) {
  // 1. localStorage からデータ取得
  //    slotOrAuto === 'auto' → AUTOSAVE_KEY
  //    slotOrAuto === 1,2,3  → SAVE_KEY + slot
  const key = slotOrAuto === 'auto' ? AUTOSAVE_KEY : SAVE_KEY + slotOrAuto;
  const raw = localStorage.getItem(key);
  if (!raw) { alert('セーブデータがありません'); return; }

  // 2. ファイル名生成
  //    例: wm_save_auto_S3W12_2026-03-09.json
  //        wm_save_slot1_S3W12_2026-03-09.json
  const parsed = JSON.parse(raw);
  const datePart = new Date().toISOString().slice(0, 10);
  const seasonPart = `S${parsed.season || 1}W${parsed.week || 1}`;
  const slotLabel = slotOrAuto === 'auto' ? 'auto' : `slot${slotOrAuto}`;
  const filename = `wm_save_${slotLabel}_${seasonPart}_${datePart}.json`;

  // 3. Blob → ダウンロードリンク生成 → クリック → 解放
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 3.2 importFromFile()

```js
importFromFile() {
  // 1. 非表示の <input type="file"> を生成してクリック
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target.result;

      // 2. バリデーション（最低限の形式チェック）
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.season || !parsed.roster || !parsed.rngSeed) {
          alert('有効なセーブデータではありません');
          return;
        }
      } catch {
        alert('ファイルの読み込みに失敗しました');
        return;
      }

      // 3. deserialize で即ロード（スロットには格納しない）
      if (Storage.deserialize(raw)) {
        G = { ...G, gameLog: [...G.gameLog, '📂 ファイルからデータを読み込みました'] };
        if (G.weekPhase === 'showPrep') G = { ...G, weekPhase: 'manage' };
        refreshAll();
        if (G.weekPhase === 'ppvShow') App.initPPVShow();
        else if (G.weekPhase === 'ppvTV') App.initPPVTV();
        if (App._refreshTicker) App._refreshTicker();
        Audio.bgm.playForState();
        Audio.play('save');
      } else {
        alert('データの読み込みに失敗しました。ファイルが破損している可能性があります。');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}
```

---

## 4. ラッパー関数（ui-common.js）

`loadAutoSave()` / `getSaveInfo()` 等のラッパーがある場所（2892行付近）に追加：

```js
function exportSave(slot) { Audio.play('click'); Storage.exportToFile(slot); }
function importSave() { Storage.importFromFile(); }
```

---

## 5. セーブ画面UI変更（ui-render.js）

`renderSave()` に以下の変更を加える。

### 5.1 各スロットに「書出」ボタン追加

**オートセーブ行**（2475行付近）のロードボタンの横に追加：

```html
<button class="btn btn-sm" style="..." onclick="exportSave('auto')">📥 書出</button>
```

**手動スロット行**（2494行付近）のボタン群に追加：

```html
<button class="btn btn-sm" style="..." onclick="exportSave(${i})">📥 書出</button>
```

書出ボタンのスタイル: `background:rgba(116,185,255,0.08);color:#74b9ff;border:1px solid rgba(116,185,255,0.25)` — 既存ボタン（金=セーブ、青=ロード、赤=削除）と区別しつつ控えめに。

### 5.2 DATA TRANSFER セクション追加

「⚙️ 設定」セクションの**上**（手動スロットの後、設定の前）に挿入：

```js
// Data Transfer section
html += `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
  <div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:8px">📦 データ移行</div>
  <div style="font-size:11px;color:var(--text-dim);margin-bottom:10px;line-height:1.6">
    セーブデータをファイルとして書き出し、別のデバイスやブラウザに移行できます。<br>
    上のスロットの「📥 書出」でファイル保存、下の「読み込む」で復元してください。
  </div>
  <div class="save-slot" style="border-color:rgba(116,185,255,0.2);background:rgba(116,185,255,0.03)">
    <div>
      <div class="save-slot-title" style="color:#74b9ff">📤 ファイルから読み込む</div>
      <div class="save-slot-meta">JSONファイルを選択するとすぐにロードされます</div>
    </div>
    <button class="btn btn-blue btn-sm" onclick="importSave()">ファイルを選択</button>
  </div>
</div>`;
```

### 5.3 最終的な renderSave() の構成

```
⚡ オートセーブ        [ロード] [📥 書出]
💾 スロット 1          [セーブ] [ロード] [削除] [📥 書出]
💾 スロット 2          [セーブ] [ロード] [削除] [📥 書出]
💾 スロット 3          [セーブ] [ロード] [削除] [📥 書出]
───────────────────
📦 データ移行
   説明テキスト
   📤 ファイルから読み込む  [ファイルを選択]
───────────────────
⚙️ 設定
   🏢 団体名: [入力] [変更]
───────────────────
🔄 ニューゲーム
```

---

## 6. バリデーション

インポート時の最低限チェック：

```js
// 必須フィールドの存在確認
if (!parsed.season || !parsed.roster || !parsed.rngSeed) → 拒否
```

改ざん対策は行わない（ユーザー要望）。JSON生読みでOK。

---

## 7. エクスポートファイル形式

- 拡張子: `.json`
- 中身: `Storage.serialize(G)` で生成されるのと全く同じJSON文字列（localStorageに保存されている生データそのもの）
- ファイル名例: `wm_save_slot1_S3W12_2026-03-09.json`
- エンコーディング: UTF-8

---

## 8. 導線まとめ

### エクスポート（デバイスAで）

1. ゲーム中 → 💾 セーブ画面
2. 移行したいスロットの「📥 書出」ボタン
3. JSONファイルがダウンロードされる
4. そのファイルを別デバイスに転送（AirDrop、メール、クラウド等）

### インポート（デバイスBで）

1. ゲームを開く → タイトル画面
2. LOAD GAME → セーブ画面が開く
3. 「📤 ファイルから読み込む」→「ファイルを選択」
4. JSONファイルを選ぶ → 即ロード → ゲーム開始

※ NEW GAME 直後でもセーブ画面にアクセスできるため、タイトル画面にボタンを追加する必要はない。
