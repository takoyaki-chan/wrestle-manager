# 画面仕様: PPV GRAND FINAL テレビ中継（ppvTV）

- **カテゴリ**: Stage（純黒 + 金アクセント。`--stage-*` トークン初導入画面）
- **実装状況**: 実装済み（2026-07-23）／進行導線を実ボタン化・fail-open追加（2026-08-31 task-103）。実機確認待ち
- **モックアップ**: `docs/ui/mockups/ppv-tv-broadcast-mockup.html` v1（Keisuke承認済み 2026-07-23）
- **実装**: `ui-common.js renderPPVTvBroadcast()` / `app.js App.initPPVTV()` / CSS `index.html #ptv-style`（`ptv-*`）

## 目的

PPV未解禁（団体人気30未満）の年の第48週、他団体のPPV GRAND FINALを「テレビ中継で見届ける」画面。
旧実装（結果一覧ポップアップ1枚）が安っぽかったため、実PPV画面の構造をテレビ放送のフレームに載せて作り直した。
「画面の向こうの大舞台」＝自団体がまだ届かない世界を見せ、出場解禁への動機付けにする感情設計。

## データ

- カード・結果は `Engine.ppv.simulateTVResults`（実在AI選手・正規の `simulatePPVMatch` シミュレーション）
- **実績記録**（2026-07-23追加・プレイヤー参加時と同等）: h2h（stage 'ppv'）／サミット勝者・敗者の
  `ppvMainEventWins`・`careerRecord.history(ppvMainEvent)`（AIロスターへ反映）／battlePoints／orgWarRecord／
  新聞素材（`_newsSummitResult`・`_newsPpvUndercards`）

## 画面構成（5場面・クリックで進行）

共通クロム: テレビ受像機フレーム（薄い走査線）／局ロゴ「WRESTLE TV」／LIVEバッジ（赤点滅、最終場面は「放送終了」グレー）／下部テロップ帯（金ボーダー＋カテゴリチップ＋主文＋社長の独白サブ）／右下の進行ボタン「次へ ▶」

1. **放送オープニング** — ♛エンブレム＋「GRAND FINAL」＋大会名（ppvName）＋全国生中継バッジ
2. **本日の対戦カード** — メイン（頂上決戦・金枠）先頭で全カード。実ポートレート＋団体名。独白は視聴回数で分岐
3. **試合速報** — アンダーカードを1試合ずつ。勝者クローズアップ＋決まり手＋MQ星＋実況コメント（MQ帯4段×3種から (mq+turns) で決定的に選択）＋進行ドット
4. **頂上決戦** — 大型VS対峙 → クリックで決着発表の2段階。決着時に WM-SE-RS04 を小音量再生
5. **放送終了** — 社長の独白（初視聴／2回目以降で分岐）＋出場条件ヒント＋「事務所へ戻る」→ `App.closePPVTV()`（従来の週次処理へ）

### 場面送りの導線（2026-08-31 task-103 で作り直し）

`.ptv-hint` は **実ボタン**（`<button type="button" class="ptv-hint" data-ptv-next>次へ ▶</button>`）。
テロップ帯（高さ約52px）に被らないよう `bottom:60px`。旧実装は10.5pxの点滅 `div` テキストで、
帯に重なって読めず、キーボードでも押せなかった。

進行は `showResultOverlay` に**1本だけ**張った委譲クリックリスナー＋`document` の keydown に集約する。
場面ごとに `{ once:true }` を張り直す旧方式は、描画が一度転ぶと張り直しが起きず
**出口ゼロの画面で恒久停止**するため廃止した（§5-D 鉄則1）。

- 押せる場所: 「次へ ▶」ボタン／TV枠内のどこか／**枠の外の暗幕**（旧実装は枠内720pxだけだった）
- キーボード: Enter・Space・→（ボタンにフォーカスがあるときは既定の活性化に任せ、二重送りしない）
- `advance()` は `advancing`／`tornDown`／`.ptv-tv` の在否／最終場面かを検証してから進む（§5-D 鉄則2「1操作=1進行」）
- 最終場面に達したら委譲リスナーを外し、出口を「事務所へ戻る」に一本化する
- 中継が二重起動しても、生きている委譲は常に1組だけ（`overlay._ptvSurfaceHandler` で単一化）
- `App.initPPVTV` は `renderPPVTvBroadcast` を try/catch で包み、組み立てが転んだら
  `App._renderPPVTvFallback()`（「事務所へ戻る」だけの最小画面）へ着地する。
  二重起動防止フラグを先に立てる都合上、3秒のセーフティネットは二度と張られないため、ここが最後の砦
- 回帰ガード: `test/u6-org-identity-safety-net-test.js` の
  `every ppvTV scene carries a real, pressable exit`
- **同型の横展開（2026-08-31）**: 同じ「出口ゼロの全画面」だった旗揚げ完成演出
  （`App.completeDraft`）・オープニング（`renderOpeningScreen`）・リーグ昇格セレモニー
  （`showLeagueElevationCeremony`）・シーズン開幕ファンファーレ（`showSeasonFanfare`）も
  この型（実ボタン＋キーボード＋二重起動防止＋fail-open）に統一した。
  回帰ガードは `test/fullscreen-exit-zero-guard-test.js`

## BGM / SE

- 場面1〜3: `grandFinalProgress`（WM-SP07 冬・GRAND FINAL進行曲、vol 0.13 のテレビ音量）
- 場面4〜5: `grandFinalMain`（WM-M05 ビッグマッチ2）
- 決着時SE: WM-SE-RS04（最高栄誉）×0.14（テレビ越しの控えめ音量）
- 場面送りクリック: 既存 click SE

## トークン

`--stage-bg / --stage-panel / --stage-panel-2 / --stage-line / --stage-live / --stage-text / --stage-text-sub` を
`index.html :root` に新設（Foundations 1-4 の「Stage画面へ手を入れるタイミングで導入」に基づく初適用）。
金は既存 `--gold` / `--gold-light` を使用。

## 確認ポイント（実機）

- 新規ゲーム（人気30未満）で第48週 → TV中継5場面が流れるか
- 右下の「次へ ▶」ボタンが帯に被らず読めるか／暗幕（TV枠の外）クリックでも進むか／Enterで進むか
- 実況コメントの温度がMQに合っているか／頂上決戦のRS04音量
- 「事務所へ戻る」後、通常どおりオフシーズンへ進むか
- 翌週の新聞に頂上決戦・アンダーカード記事が載るか（実績記録の確認）
