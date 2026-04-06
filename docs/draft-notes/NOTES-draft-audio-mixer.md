# ドラフト交渉 オーディオミキサー統一記録

作成: 2026-04-06

---

## ゲームのオーディオミキサーシステム概要

### 構造（app.js SECTION 0）

```
AudioContext
├─ masterGain (1.0、ミュート時0)
│   ├─ bgmMasterGain (_bgmMasterVol: デフォルト0.7)
│   │   └─ bgmGain (_bgmVol: チップチューン用個別)
│   └─ sfxMasterGain (_sfxMasterVol: デフォルト1.0)
│       └─ sfxGain (_sfxVol: 個別SE用)
```

### BGM再生パス
1. **BGM.play(trackName)** — SUNO_BGM に定義がある場合 → `FileBGM.play(file, {volume})` を呼ぶ
2. **FileBGM.play(src, {volume})** — `_resolveVolume(volume)` = `_bgmMasterVol × volume` で音量決定
3. **FileBGM.updateVolume()** — `setBgmMasterVol()` 時に呼ばれ、再生中のFileBGMの音量を更新

### SFX再生パス
1. **Audio.play(name)** — Web Audio API のシンセSE。sfxGain → sfxMasterGain → masterGain 経由。ミキサー完全対応。
2. **外部ファイルSE**（ドラフト等） — `new Audio(src)` で独立再生。AudioContext を経由しないため、masterGain/sfxMasterGain は適用されない。手動で `sfxMasterVol` を乗算する必要がある。

### ユーザー設定（localStorageに保存）
- `_bgmMasterVol` — BGMマスター音量（スライダー）
- `_sfxMasterVol` — SEマスター音量（スライダー）
- `_muted` — 全体ミュート
- `_bgmMuted` — BGMのみミュート

---

## ドラフト交渉のオーディオ修正

### BGM
**変更前**: `Audio.fileBgm.play('../bgm/bgm_tension_v1.mp3', { loop: true, volume: 0.12 })`
**変更後**: `Audio.bgm.play('tension')`

- `BGM.play()` 経由にすることで、SUNO_BGM.tension.vol (0.17) が自動適用
- `_bgmMasterVol` はFileBGM._resolveVolume 内で乗算される
- volume のハードコード値を廃止
- `showScreen` 内の `playForState()` との二重再生は、BGM.play L559 の早期リターン (`trackName === BGM._current`) で防止
- 前回問題だった `_draftSfx` による BGM.stop() は、SFXを独立Audioに変更済みで解消

### SFX
**変更前**: `a.volume = cfg.vol * (Audio.sfxMasterVol ?? 1)` + ミュートチェックなし
**変更後**: `a.volume = cfg.vol * (Audio.sfxMasterVol ?? 1)` + `Audio.muted` チェック追加

- `Audio.muted` が true の場合、SFX を一切再生しない
- `Audio.sfxMasterVol` でユーザーのSEスライダーが適用される
- 個別SE音量 (`_sfxVol`) は外部ファイルSEには適用しない（Web Audio API 固有のゲイン）

### 既存BGM切替箇所との整合性

| 箇所 | 使用API | ミキサー対応 |
|------|---------|:---:|
| PPV BGM (app.js L3846) | `Audio.fileBgm.play(path, {volume})` | OK (FileBGM経由) |
| 対抗戦BGM (app.js L3863) | `Audio.fileBgm.play(path, {volume})` | OK |
| 試合BGM (app.js L3738) | `Audio.bgm.play('battle')` | OK (BGM.play経由) |
| **ドラフトBGM (修正後)** | **`Audio.bgm.play('tension')`** | **OK (BGM.play経由)** |
| **ドラフトSFX (修正後)** | **`new Audio() + sfxMasterVol`** | **OK (手動適用)** |
