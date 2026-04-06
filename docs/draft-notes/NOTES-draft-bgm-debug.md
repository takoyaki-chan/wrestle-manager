# ドラフト交渉 BGM切替 デバッグ記録

作成: 2026-04-06

---

## 問題
ドラフト交渉画面に入っても BGM が management のまま変わらない。
ステップ5(初回実装)、c5e4c73(SFX独立Audio化)、��ずれも解決せず。

## 原因調査

### 試行1: SFXがBGMを止める問題（c5e4c73で修正済み）
- `_draftSfx()` が `Audio.fileBgm.play()` を使っていた
- FileBGM.play 内部で `BGM.stop()` が走り、直後の tension BGM も止まっていた
- **修正済み**: SFXを全て `new Audio()` に変更

### 試行2: _finalizeDraft のデッドコード（c5e4c73で修正済み）
- `playForState()` が `return` 文の後にあった
- **修正済み**: 呼び出し元に移動

### 試行3（今回）: BGM.play() の状態管理による早期リターン

**核心の問題**: `Audio.bgm.playForState()` → `BGM.play('tension')` の呼び出しチェーンで、
`showScreen()` 内（ui-common.js L5364）の2回目の `playForState()` が干渉していた。

BGM.play() の内部（app.js L557-568）:
```javascript
play(trackName) {
  if (_bgmMuted) return;
  if (trackName === BGM._current && BGM._playing) return; // ← 早期リターン
  const suno = SUNO_BGM[trackName];
  if (suno) {
    BGM.stop();
    FileBGM.play(suno.file, { loop: true, volume: suno.vol });
    BGM._playing = true;
    BGM._current = trackName;
    return;
  }
  ...
}
```

showScreen() 内（ui-common.js L5364）:
```javascript
if (id !== 'show' && G.weekPhase !== 'showExec') Audio.bgm.playForState();
```

フロー:
1. `startDraftNegotiation()` で `Audio.bgm.playForState()` → tension に切替
2. `showScreen('scoutEvent')` が呼ばれる
3. showScreen 内で `playForState()` が **再度** 呼ばれる
4. `BGM.play('tension')` → `BGM._current === 'tension'` → 早期リターン...

**しかし**: SUNO BGM の場合、BGM.play() 内で FileBGM.play() を呼ぶと、
FileBGM.play() 内部で `FileBGM.stop(); BGM.stop();` が実行される。
この BGM.stop() で `BGM._current = null; BGM._playing = false;` にリセットされ、
直後に `BGM._playing = true; BGM._current = trackName;` でセットし直す。

理論上は動くはずだが、タイミング依存で FileBGM の new Audio().play() が
Promise ベースのため、実際の音声再生開始が遅延する可能性がある。

## 修正方針: 既存の動作実績パターンと完全一��

PPV BGM 切替（app.js L3846, 動作確認済み）:
```javascript
Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 });
```

これは `BGM.play()` を経由せず、`Audio.fileBgm.play()` を直接呼んでいる。
BGM.play() の複雑な状態管理を完全にバイパスするため、確実に動作する。

## 修正内容

### startDraftNegotiation（交渉開始）
```javascript
Audio.fileBgm.play('../bgm/bgm_tension_v1.mp3', { loop: true, volume: 0.12 });
Audio.bgm._current = 'tension';
Audio.bgm._playing = true;
```
- FileBGM を直接呼び出し
- BGM 状態を手動同期（showScreen内のplayForStateで上書きされないように）

### _finalizeDraft 呼び出し元2箇所（ドラフト完了）
```javascript
Audio.fileBgm.play('../bgm/bgm_management_v1.mp3', { loop: true, volume: 0.12 });
Audio.bgm._current = 'management';
Audio.bgm._playing = true;
```
- 同様に FileBGM 直接 + 状態手動同期

### console.log
`[WM Draft] BGM →` でブラウザ devtools から発火確認可能。
