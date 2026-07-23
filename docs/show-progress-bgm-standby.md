# 通常興行・進行曲(SP00)の再有効化手順 — 待機メモ

2026-07-23、通常興行の進行画面用BGM(WM-SP00)を一度実装したうえで「興行を通してM01の1曲」に再裁定して撤回した。
Keisukeの意向により**将来差し替える可能性が高い**ため、決定後すぐ実行できるよう手順を残す。所要目安: 10分。

## 現状(撤回後の状態)

- 通常興行: 興行開始〜観戦〜一覧復帰まで `battle`(WM-M01)1曲通し。王座戦観戦のみ `bigMatch`(WM-M04)
- 前回採用曲: 「WM-E01 特別興行 (12).mp3」(候補は転用プールの旧E01系16曲)
- **加工済み待機ファイル**: `【サウンド・BGM】/wm_bgm_sp00_v01_standby.ogg`(28.5秒ループ・-17 LUFS・検証済み)

## 手順

### 1. 曲の確定

前回採用(特別興行(12))のままなら待機ファイルをコピーするだけ:

```bash
cp "【サウンド・BGM】/wm_bgm_sp00_v01_standby.ogg" "bgm/production-ogg/wm_bgm_sp00_v01.ogg"
```

別の曲にする場合は常設ツールで加工(ループ型・30〜45秒・-17 LUFS):

```bash
node tools/process-bgm-loop.js "【サウンド・BGM】/<採用曲>.mp3" "bgm/production-ogg/wm_bgm_sp00_v01.ogg" 30 45
```

継ぎ目が合わない曲はフェード型(C01と同方式)も選べる:

```bash
node tools/process-bgm-loop.js "<採用曲>" "bgm/production-ogg/wm_bgm_sp00_v01.ogg" --fade 1.2 2.0
```

### 2. 配線(app.js)

**コミット `47ee60b` に前回実装の全diffがそのまま残っている**(`git show 47ee60b -- src/app.js`)。撤回コミットは `d8508f0`。変更点は次の8箇所:

1. `STAGE_BGM` に `showProgress: { file: '../bgm/production-ogg/wm_bgm_sp00_v01.ogg', vol: 0.15 }` を追加
2. `resolveActiveStageBgm`: `_showPreview` があり `currentWatching < 0` のとき `'showProgress'` を返す
3. `playForState`: `weekPhase === 'showExec'` 分岐を `BGM.playStage('showProgress')` に
4. 興行開始時(`Audio.play('bell')` 直後)の `play('battle')` → `playStage('showProgress')`
5. タッグ観戦後の一覧復帰(300ms setTimeout)
6. シングル観戦後の一覧復帰(fadeOut後1600ms・stop()→再生)
7. `escapeBattle` の興行復帰(300ms)
8. 敵地遠征興行セットアップ(`_awayChallengeInProgress` の直後)

観戦オープン時の `battle`/`bigMatch` 切替(watchMatch / _watchTagMatch)は**そのまま触らない** — これが「進行曲→試合曲」の遷移になる。

### 3. 台帳・ボード

- `docs/wrestle-manager-audio-production-plan.md` Dセクション: SP00行を復活し、再裁定注記(「1曲通しに戻した」)を更新
- `audio-review/generate-specs.ps1` 再実行
- 選定ボードで候補比較し直す場合は `index.html` の `CANDIDATE_ALIAS` に `'WM-E01':'WM-SP00'` を復活

### 4. 検証

- `node --check src/app.js`
- 実機: 興行開始→進行曲が鳴る→観戦を開くとM01(王座戦はM04)→閉じると進行曲へ復帰→全試合後ジングル
- auto-sim不要(app.jsのみ)
