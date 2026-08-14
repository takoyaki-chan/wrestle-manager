# UI walkthrough harness

Chromium で製品の `src/index.html` を開き、fixture セーブから翌シーズン第1週までを実UIクリックだけで走破する長時間テストです。製品コードや `G` は変更しません。`page.evaluate` は画面・進行状態の読取りにだけ使います。

## 実行

```powershell
npm run test:ui:walkthrough -- --mode walk --seasons 1 --seed 42
```

既定の全体タイムアウトは15分です。再現範囲を絞る場合は、失敗アーティファクトの `README.txt` に記録された `--max-steps` 付きコマンドを使います。

## ignite モード（レア画面強制点火カタログ・バグ捜索体制③）

自然走破では踏めないレア画面(天頂戦・ゲームオーバー等)を、合成 fixture から実UIクリックで強制到達して検査します。設計は `docs/rare-screen-ignition-catalog-design-v0.1.md`。

```powershell
npm run test:ui:ignite -- --scenario tenchosen
npm run test:ui:ignite -- --scenario gameover
npm run test:ui:ignite -- --scenario tenchosen --regen   # fixtureを作り直す
```

現行シナリオ(2026-08-14): `tenchosen`(天頂戦通年+初代統一王座戴冠) / `gameover`(資金破綻→解散セレモニー) / `away-challenge`(CH-1直訴→遠征→2拍) / `incoming-challenge`(果たし状迎撃→シリーズ) / `faction-ignite`(派閥開戦。boostが実際にリーダー対決をカード編成する) / `unified-player-turn`(統一王座「こちらの番」→挑戦者選出→遠征。**全6本PASS** — 当初FAILの正体は孤児化した直訴pendingが週次モーダル枠を恒久占有する製品バグで、修正済み。`specs/challenge-request-spec-v0.1.md` 2026-08-14追加改修+`test/challenge-request-stale-pending-test.js`)

- スナップショットの `overlays` は、汎用モーダル枠(mdlA〜D/notifModal)についてはカード直下2階層のクラス列を `mdlAOverlay:mdl-a-card.narrow.…` の形で連結します(枠idだけでは中身を識別できず点火マーカーが書けないため)。`popup` プローブ(`_popupQueue` 残量+`_isPopupActive`)も常時観測され、残量が変わった手は `popup-queue: 0 -> 1 …` として標準出力に出ます

- シナリオ定義は `scenarios.js`。fixture は初回実行時に `fixtures/generated/`(Git管理外)へ自動生成されます(headless進行+`Engine.validateGameState` ゲート)
- 各シナリオは**点火マーカー**(対象オーバーレイ/画面の観測)を必須宣言し、未観測なら検出0件でも `IGNITION_MISFIRE` で失敗します(不発検出)
- 実行後に観測した全オーバーレイ・画面IDを表示します。新シナリオのマーカー選定はこの一覧から行ってください

検出器だけを既知バグ入りサンドボックスで確認するには次を実行します。

```powershell
npm run test:ui:walkthrough -- --self-test
```

同一 seed の操作列を比較する例です。操作ログには時刻や所要時間を含めません。

```powershell
node test/ui-walkthrough/run.js --mode walk --seasons 1 --seed 42 --action-log C:\tmp\wm-walk-1.json
node test/ui-walkthrough/run.js --mode walk --seasons 1 --seed 42 --action-log C:\tmp\wm-walk-2.json
git diff --no-index -- C:\tmp\wm-walk-1.json C:\tmp\wm-walk-2.json
```

## fixture

既定 fixture は `fixtures/season-1-week-1-seed42.json` です。既存 `test/make-save.js` と同じ headless Engine 読込方式を使い、初期ドラフト済みロスターへ利用可能なFAをOVR順で補充した12名体制を seed 42 から決定論的に生成しています。

```powershell
node test/ui-walkthrough/fixtures/generate-fixture.js 42
```

読み込み前の `page.addInitScript` で、fixture を `wrestle_manager_autosave`、完全ミュート設定を `wm_audio` に入れます。Chromium は毎回一時 context で起動するため、通常ブラウザのプロファイルと localStorage には触れません。

## 検出とアーティファクト

- D1: `pageerror`、console error、`[WM Debug]` warning
- D2: クリック後5秒間、DOM・状態・overlay のいずれにも変化がない進行停止
- D3: 可視テキストに出た `undefined`、`NaN`、`[object ...]`、`null`、内部トークン
- D5: 90秒以上、シーズン／週／オフ週が変化しない大域停止

FAIL/FREEZE ごとに `artifacts/<timestamp>-<type>/` へ screenshot、操作列、読取り専用の状態要約、console 全文、再現コマンドを保存します。このディレクトリは Git 管理外です。サーバと Chromium は成功・失敗・タイムアウトのいずれでも `finally` で終了します。
