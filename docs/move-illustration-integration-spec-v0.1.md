# 試合エンジンへの技イラスト統合仕様 v0.1

## この文書の目的

技イラストを、確定済みの試合結果を変えずにReplay観戦画面へ重ねるための再開用仕様である。素材制作の優先順位は [技イラスト・大技カバレッジ計画](move-illustration-coverage-plan-v0.1.md)、将来の技再配置は [再配置後・全技カタログ v0.2](move-catalog-reclassified-v0.2.md) を参照する。

別の作業窓で再開する時は、本書の「着手条件」から読み、Phase 0から順に進める。ここに書かれていない表示・エンジン変更を同時に始めない。

## 1. 変更しない境界

`Engine.battle.simulateMatch()` と `Engine.battle.simulateTagMatch()` は先に試合全体を確定し、Replay画面は `result.frames` を読むだけである。技イラスト導入では以下を変更しない。

- 技抽選、命中、ダメージ、カウンター、勝敗、キックアウト、ギブアップ、MQ、乱数シード
- `src/match-engine.js` のフレーム生成契約
- Replayの「次の攻防」「戻る」「自動再生」によるフレーム順序

イラストは `action` と `events` の表示レイヤーであり、数値計算に参加しない。これは [バトル観戦プレゼンテーション仕様](../specs/battle-presentation-spec-v1.0.md) の境界に従う。

## 2. 現在の真実と前提

### 現行ゲーム

- シングル戦の表示元は `action.move`、`action.counterMove`、`action.moveCat`、`action.kind`、`pinAttempt`、`rollup`、`kickout`、`tkoStop`。
- タッグ戦の表示元は上記に加え、`events` の `hotTag`、`doubleTeam`、`cutinSave`、`friendlyFire`、`betrayal` と法定選手／控え選手の入替。
- 現在のReplay画面は、選手の `full` 立ち絵、矢印、ダメージ、技名、SFXを表示する。`image/moves` はまだどの画面コードからも参照されていない。
- `image/moves/moves_manifest.json` と `placeholder_assets.json` は制作管理用のプレースホルダーであり、完成素材として表示してはならない。

### 将来案との関係

`docs/move-catalog-reclassified-v0.2.md` は未実装の将来案である。`Technique` 廃止・個人技スロット・全161技の再配置を、今回の表示実装へ先取りしない。

実行時の技名の正本は、その時点の `src/data.js` とReplayフレームである。v0.2を実装した後にだけ、同じ統合機構へ新しいマニフェストを足す。

## 3. アセット契約

### ファイルと表示状態

完成した1技は `image/moves` 直下に、同じ `assetId` を持つ3ファイルで置く。

```text
NN_slug_attacker.webp
NN_slug_defender.webp
NN_slug_overlay.webp
```

- 制作元：1024px `raw.png` と透過 `master.png` を `assets/moves` に保管する。
- ゲーム配置用：512×512 WebP。攻め手・受け手・輪郭／影を別レイヤーにする。
- `status: "ready"` の3ファイルが揃った時だけゲームで表示する。
- `placeholder`、`planned`、未知の技、読み込みエラーはすべて既存の立ち絵・矢印・技名表示へフォールバックし、プレースホルダーを画面に出さない。

### 実行時マニフェスト

ローカルHTML起動でも確実に読めるよう、JSONの`fetch`ではなく静的JavaScriptの `src/move-asset-manifest.js` を作る。`battle-engine.html` と `tag-battle.html` は、各mainファイルより先にこれを読み込む。

マニフェストは最低限、正規の表示技名からアセットへ引けることを保証する。

```js
var MOVE_ASSET_MANIFEST = {
  version: 1,
  moves: {
    'パワーボム': { assetId: '16_powerbomb', status: 'ready', aliases: [] },
    'パイルドライバー（喧）': { assetId: '17_piledriver', status: 'ready', aliases: ['パイルドライバー'] }
  },
  common: {
    'cover-pin': { assetId: 'cover-pin', status: 'ready' }
  }
};
```

別名は技名ごとにキーを持たせる。実行時に日本語名からslugを自動生成しない。カタカナ表記、`（専）`、`（喧）`、旧名を誤って別素材にする事故を防ぐためである。

## 4. 表示解決と優先順位

新設する表示専用関数は `resolveMoveVisual(frame)` とする。戻り値は `none`、`move`、`common`、`tagMove` のいずれかと、必要な `assetId`・攻守・重ねるオーバーレイを持つ。関数は状態を変更しない。

| 優先順位 | フレーム条件 | 表示内容 |
|---:|---|---|
| 1 | `pinAttempt` がある | `cover-pin` を導入に表示。`kickout` / `cutinSave` / `tap-out-overlay` / `downed` はクリック駆動の決着シーケンス内で結果に応じて重ねる。 |
| 2 | タッグの `doubleTeam` | `events[].move` を `tagMove` として解決する。未割当なら既存のダブルチーム演出のみ。 |
| 3 | `action.kind === 'counter'` | 実際に決まった返し技、すなわち画面で表示する `counterMove || move` を解決する。 |
| 4 | `action.kind === 'hit'` | `action.move` を解決する。 |
| 5 | `action.kind === 'miss'` または未割当 | 技絵なし。既存の回避フラッシュ・矢印・実況を維持する。 |

`friendlyFire` と `betrayal` は技名と構図を持たない。新規技絵を解決せず、現行のフラッシュ／減彩／カットインだけを使う。`hotTag` は `hot-tag-entry`、通常タッチは `tag-touch`、救出は `cutin-breakup` を、完成後にタッグ専用のイベント表示として解決する。

## 5. 画面レイヤー

`_liveRingHtml()` と `_tagLiveRingHtml()` のリング背景と選手パネルの間に、共通の `move-visual-layer` を1つ置く。そこへ次の順に重ねる。

```text
リング背景・照明
  → 技イラスト defender
  → 技イラスト attacker
  → 技イラスト overlay
  → 既存の選手full立ち絵・選手名
  → 矢印、ダメージ、衝撃、技名、実況、カットイン
```

- 技絵の表示中も既存の選手立ち絵を消さない。技絵を中央の主役にし、立ち絵は状態と選手識別を担う。
- アタッカー／ディフェンダーの左右反転は、攻撃側のリング位置に合わせて`move-visual-layer`全体へ適用する。元ファイルを左右別に作らない。
- レイヤーの画像ロード失敗は即座に`none`へ戻し、Replayを停止させない。
- フォール・ギブアップ・TKOは既存のクリック駆動決着シーケンスと同じタイミングで切り替える。通常技の表示タイマーで勝手に消してはいけない。

## 6. 実装Phase

### Phase 0 — 着手前の棚卸し

1. `src/data.js` の実行時技名と `MOVE_ASSET_MANIFEST.moves` のキーを比較する。
2. 各`ready`エントリについてattacker／defender／overlayの3ファイルが存在することを検査する。
3. v0.2の技再配置が未実装であることを確認し、現行名だけをマニフェストへ入れる。
4. `image/moves`のプレースホルダーを`ready`にしない。

### Phase 1 — シングル戦の最小導入

変更対象は次だけに限る。

- 新規：`src/move-asset-manifest.js`
- 変更：`src/battle-engine.html`、`src/battle-engine-main.js`、`src/battle-shared.css`
- 配布：新規JSを`release/manifest.json`の`sourceFiles`へ追加する。

順序は、(1) HTMLでマニフェストを先読み、(2)リングに空の`move-visual-layer`を追加、(3)`resolveMoveVisual`と安全な画像生成、(4)通常hit／counterの表示、(5)M0の決着表示、(6)フォールバック検証とする。

このPhaseでは、`src/match-engine.js`、タッグ画面、技抽選、技テーブルを変更しない。

### Phase 2 — タッグ戦の導入

Phase 1の解決器・CSS・フォールバックを再利用し、以下だけを追加する。

- `src/tag-battle.html` と `src/tag-battle-main.js` で同じマニフェストとレイヤーを読み込む。
- `doubleTeam`、`tag-touch`、`hot-tag-entry`、`cutin-breakup` をイベントへ接続する。
- 法定選手／控え選手が入れ替わるフレームでは、タッチ絵の終了後に既存の`animateTouchSwap`を動かす。

連携技の素材は、v0.2のスタイル再配置を実装した後に別カタログで確定する。素材がない連携技は既存のバナー・控え選手表示へフォールバックする。

### Phase 3 — カバレッジ拡張

P0→P1→P2の順で`ready`エントリを増やす。別名の共用はカバレッジ計画の3条件を満たすものだけにする。v0.2実装時は、新しい技名・個人技表示名・連携技をマニフェストへ足し、既存IDは不必要に変更しない。

## 7. 検証と完了条件

### 自動検証

- `test/move-asset-manifest-test.js` を追加し、`ready`エントリの3ファイル、重複assetId、別名キー、P0の未割当を検査する。
- Resolverは未知の技名、読み込み失敗、`miss`、counter、pin、rollup、TKOで例外を投げず`none`または正しい表示種別を返すことを検査する。
- 既存Replay関連テストを実行し、試合結果・フレーム数・勝者が変わらないことを確認する。

### 手動確認

シングル戦では、通常hit、カウンター、未割当技、フォール成功、キックアウト、ギブアップ、TKO、丸め込みの各1例をReplayで確認する。タッグ導入後は、通常タッチ、ホットタッグ、救出、ダブルチーム、同士討ち、見殺しも各1例確認する。

完了は「技絵が出る」ことではない。未作成技で従来のReplayが壊れず、技絵があるフレームでも勝敗・ログ・カウント操作・SFX・戻る操作が変わらないことをもって完了とする。

