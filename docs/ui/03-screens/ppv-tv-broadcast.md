# 画面仕様: PPV GRAND FINAL テレビ中継（ppvTV）

- **カテゴリ**: Stage（純黒 + 金アクセント。`--stage-*` トークン初導入画面）
- **実装状況**: 実装済み（2026-07-23）。実機確認待ち
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

共通クロム: テレビ受像機フレーム（薄い走査線）／局ロゴ「WRESTLE TV」／LIVEバッジ（赤点滅、最終場面は「放送終了」グレー）／下部テロップ帯（金ボーダー＋カテゴリチップ＋主文＋社長の独白サブ）／右下「クリックで進む ▶」

1. **放送オープニング** — ♛エンブレム＋「GRAND FINAL」＋大会名（ppvName）＋全国生中継バッジ
2. **本日の対戦カード** — メイン（頂上決戦・金枠）先頭で全カード。実ポートレート＋団体名。独白は視聴回数で分岐
3. **試合速報** — アンダーカードを1試合ずつ。勝者クローズアップ＋決まり手＋MQ星＋実況コメント（MQ帯4段×3種から (mq+turns) で決定的に選択）＋進行ドット
4. **頂上決戦** — 大型VS対峙 → クリックで決着発表の2段階。決着時に WM-SE-RS04 を小音量再生
5. **放送終了** — 社長の独白（初視聴／2回目以降で分岐）＋出場条件ヒント＋「事務所へ戻る」→ `App.closePPVTV()`（従来の週次処理へ）

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
- 実況コメントの温度がMQに合っているか／頂上決戦のRS04音量
- 「事務所へ戻る」後、通常どおりオフシーズンへ進むか
- 翌週の新聞に頂上決戦・アンダーカード記事が載るか（実績記録の確認）
