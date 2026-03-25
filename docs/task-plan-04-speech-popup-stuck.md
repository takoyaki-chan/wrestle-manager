# BUG-01: 試合中セリフポップアップが消えない — 計画書

## 概要

ver2の試合中セリフポップアップが自動で消えず、試合続行が阻害されて決着後も試合が続き結果が逆転するというバグの再現確認と修正。

## 現状の問題（コード調査結果）

### セリフポップアップの実装

battle-engine.html 内の `showSp()` 関数 (L2443-2447):
```js
function showSp(side,text,cls){
  const el=document.getElementById(`sp-${side}`);if(!el)return;
  el.textContent=text;el.className=`speech-bubble ${cls} visible`;
  setTimeout(()=>el.classList.remove('visible'),1800);
}
```

- CSSクラス `visible` を付与して表示
- 1800ms後に `visible` を除去して非表示
- CSSアニメーション: `.speech-bubble` は `opacity:0` → `.visible` で `opacity:1`

### ポップアップのタイミング制御

battle-engine.html には以下の箇所でセリフ表示が行われる:

1. **通常攻撃時のダメージセリフ** (L2198付近): クリティカルヒット(dmg>=15)時にHP残量ベースで判定
2. **ビッグムーブ時のダメージセリフ** (L2114付近): 同上
3. **confrontation（宣戦布告）** (L1965, L2090付近): 試合開始前のセリフカットイン、1.5秒で消去

### 自動進行タイマーとの競合可能性

battle-engine.html の `endAnim()` (L2448-2464):
```js
if(autoAdvance&&!S.winner){
  clearTimeout(autoTimer);
  autoTimer=setTimeout(()=>{
    if(autoAdvance&&!S.winner&&!S.anim)nextTurn();
  },AUTO_DELAY);
}
```

- 自動進行は `S.winner` が設定されると停止する
- しかし `showSp()` の `setTimeout` と `autoTimer` の `setTimeout` が競合する可能性がある

### 過去の対処状況

コードを調査した限り:
- `showSp()` は常に1800msの固定タイマーでvisibleを除去
- セリフ表示自体は試合進行をブロックしない（別のsetTimeoutで非同期）
- **ただし**: app.js L3576-3606 の confrontation（宣戦布告ポップアップ）は app.js側で管理されており、battle-engine.html内のセリフとは別系統

### 宣戦布告ポップアップ（app.js側）の調査

app.js L3575-3606: rivalry50+ペアの宣戦布告を検出し `confrontationMap` に格納。
ui-common.js L7208: `pre-match speech` のコメントあり。

この宣戦布告ポップアップは battle-engine.html の iframe 外で表示されるため、iframe内の試合進行と独立している。これが「消えない」原因の可能性がある。

### 再現確認の必要性

コード上は `setTimeout(1800)` で確実に消えるはずだが、以下のケースで問題が起きうる:
1. ブラウザのタブがバックグラウンドになりsetTimeoutが遅延
2. 複数のshowSp呼び出しが重なりclassNameの上書きで消去タイマーが無効化
3. confrontation系ポップアップとの競合

## 変更方針

### ステップ1: 再現確認

まず再現テストを実施し、問題がまだ存在するか確認:
- ライバル関係（rivalry 50+）のペアで試合を複数回観戦
- 特にconfrontation表示がある試合を重点確認
- 自動進行モードでの挙動を確認

### ステップ2: 予防的修正（再現有無に関わらず）

#### 修正A: showSp の堅牢化 (battle-engine.html L2443-2447)

```js
let _spTimers = {};
function showSp(side,text,cls){
  const el=document.getElementById(`sp-${side}`);if(!el)return;
  // 既存タイマーをクリアして上書き安全にする
  if(_spTimers[side]) clearTimeout(_spTimers[side]);
  el.textContent=text;el.className=`speech-bubble ${cls} visible`;
  _spTimers[side] = setTimeout(()=>{
    el.classList.remove('visible');
    _spTimers[side] = null;
  },1800);
}
```

これにより、複数のshowSp呼び出しが重なっても最後のタイマーが確実に消去する。

#### 修正B: 勝者決定時のセリフ強制消去 (battle-engine.html)

試合終了判定後（`S.winner` 設定時）に全セリフバブルを強制非表示:
```js
// finish判定の直後に追加
document.querySelectorAll('.speech-bubble').forEach(el => el.classList.remove('visible'));
Object.values(_spTimers).forEach(t => clearTimeout(t));
_spTimers = {};
```

### ステップ3: 再現した場合の追加修正

confrontation系ポップアップが原因の場合、app.js側の表示管理を修正。具体的にはconfrontation表示の閉じるボタン/タイマーの確認。

## 影響範囲

- **battle-engine.html**: `showSp()` 関数と勝者決定処理
- **app.js**: confrontation系の表示管理（再現確認後に判断）
- 他システムへの影響: なし

## 検証方法

1. **再現テスト**: rivalry 50+のペアで試合を5回以上観戦（ユーザー委任）
2. **自動進行テスト**: 自動送りモードで試合が正常に完了するか
3. **auto-sim**: battle-engine.htmlの変更はエンジン外なのでフック対象外だが、engine.jsへの変更があれば自動実行

## 完了条件

- ライバル同士の試合を複数回観戦して再現しないこと
- 再現した場合: ポップアップが確実に自動消去され、試合結果が正しく確定すること
- 再現しない場合: 予防的修正（showSpの堅牢化）を適用してスキップ可
