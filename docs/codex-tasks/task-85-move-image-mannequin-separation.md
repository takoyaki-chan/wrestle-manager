# task-85: 技画像第1波の人形化・分離処理（16_powerbomb試作先行）

## ⚠️ 様式修正（2026-08-12 Keisuke指摘・初回Phase A成果は不採用）

初回Phase A（コミット693a4d1）の**ベタ塗りグレー2トーン様式は不採用**。正しい完成様式は `assets/moves/reference/mannequin_turnaround_master.png` の**基本3面図キャラ**（白ボディ+黒線画・簡略レオタード/ニーパッド/編み上げブーツ・卵型頭・淡い陰影。旧世代30枚のmasterと同系統）。**GPT Imageの各呼び出しに、この3面図PNGをスタイル参照として必ず入力へ添付する。**

レイヤーの意図（`image/moves/README.md` と2026-08-12 Keisuke説明）: `attacker`/`receiver` はゲーム実行時に**青コーナー/赤コーナー等のうっすらティントでキャラ識別**するためのフィルレイヤー。したがって:

- `attacker.png` / `receiver.png` = 白ボディ+淡陰影のフィル（**黒線を焼き込まない** — ティントで線が汚れる）
- `outline.png` = 両者分の黒線画（外周+内部線+衣装線）と影をまとめた上掛けレイヤー
- 攻守の判別はベタ塗り色分けではなく**単体撮影パスとの照合**で行う。色分けは `work/` の中間物に限り使用可
- 再合成（attacker+receiver+outline）が線画masterと一致することがQAの再合成基準になる

数値検証（決定性・寸法・二値アルファ・攻守重なり0・IoU閾値）と Phase A→検収→Phase B の停止契約は下記の既定どおり。凍結済み `PIPELINE-SETTINGS.md` は本様式で作り直す。

## ⚠️ 品質仕様（2026-08-12 Keisuke検収: 様式は承認・製品版は品質を上げる）

Phase A v2（コミット91f78e6）は様式承認済み。ただし製品最終版は以下の2点の品質を上げる。**この品質仕様でv3試作を作り、Fable検収を経てからPhase Bに進む。**

1. **色分けの精度（役割割り当てを領域単位に）**: 画素単位の役割割り当てをやめ、**線画で閉じられた領域を単位**に割り当てる（領域ごとに単体パス照合の多数決）。役割の色境界は必ず線画に沿うこと。ティント合成テスト（攻め手=淡赤/受け手=淡青）で接触部の色にじみが視認できないことを合格条件にする
2. **線の滑らかさ（アンチエイリアス許可）**: 「半透明画素ゼロ」の制約を撤廃する。**2倍解像度（3360×2680）で分離・輪郭処理を行い、1680×1340へ縮小する際にエッジのAAを許可**。ジャギー（階段状エッジ）を解消する。ただし半透明はエッジ帯（線幅±3px程度）のみに限定し、フィル内部は完全不透明・穴なしを維持。QAの「二値アルファ」検査は「内部不透明+エッジ帯限定AA」検査に置き換える
3. 成果物に **ティント合成プレビュー**（work/`<pose>_tint-preview.png`、攻め赤/受け青/outline重ね）と **512px縮小プレビュー**（work/`<pose>_512-preview.png`、ゲーム実寸確認用）を含める
4. 決定的処理（同一入力→同一出力）は維持する

## 目的

第1波として受領済みの撮影PNG（技24セット+M0の3構図、各3パス）を、GPT Imageによるグレー人形化→決定的ローカル処理で `attacker / receiver / outline` の透過PNG 3枚へ分離する。**まず `16_powerbomb` 1技だけを試作して共通設定（グレーRGB値・輪郭線幅・内部線方針）を確定し、Fableの検収を待ってから残りを流す。**

## 作業場所

`C:\Users\nkmrk\Downloads\wrestle-manager-codex`（ブランチ `codex/agent-workspace`）。mainフォルダは触らない。

## 仕様の正（指示書内に二重記載しない）

- 工程・ファイル契約・QA基準: `docs/move-illustration-3d-capture-pipeline-v0.1.md`
- 受領台帳（処理対象・要反転・採用/alt・撮影名対応）: `assets/moves/INTAKE.md`
- 1技の管理項目: `docs/move-illustration-coverage-plan-v0.1.md` §1技ごとの管理項目
- ゲーム接続（**今回はやらない**）: `docs/move-illustration-integration-spec-v0.1.md`

## 触ってよいファイル / 触ってはいけないファイル

- **OK**: `assets/moves/<pose>/` 配下への成果物追加（`<pose>_master.png`、`work/`、最終3枚）、`assets/moves/INTAKE.md` への処理状態追記、`assets/moves/PIPELINE-SETTINGS.md` の新設（採用した共通設定の記録）、分離・QA用スクリプトの新設（`scripts/move-image/` 配下）
- **NG**: `src/` 全部、`image/moves/`（プレースホルダーを ready にしない・ゲーム配置は統合仕様Phase 0以降）、`release/manifest.json`、既存docs（上記INTAKE/SETTINGS以外）、**各poseの `*_source.png` / `*_attacker-capture.png` / `*_receiver-capture.png` の上書き・削除・移動（原本保全）**

## 処理仕様

1. **要反転の正規化**: `09_ddt` と `26_figure_four` のみ、3パスを一括で水平反転した作業コピーを作ってから処理する（原本は未反転のまま残す）。他のposeは反転しない
2. **人形化（GPT Image）**: 2体版sourceを `<pose>_master.png`、単体2枚を `work/<pose>_{attacker,receiver}-gray.png` へ。ポーズ・カメラ・接触位置を保持し、顔・髪・衣装の細部・小物・影を除去。**攻め手=中間グレー、受け手=明るいグレー**。出力背景は単色（白推奨）
3. **分離・輪郭・透過（決定的ローカル処理のみ）**: masterの色分け+単体グレーパスの照合で `attacker / receiver / outline` の透過PNGを生成。輪郭はmasterから抽出（GPT Imageで別生成しない）
4. **M0の特例**: `downed` は1人ポーズで単体パスなし。最終形は `downed.png`（透過1枚）+ `downed_outline.png` の2枚でよい（attacker/receiver分離は不要）。`cover-pin` / `kickout` は通常の3枚契約
5. **alt束（`alt/` 配下）は処理しない**。本採用セットのみ

## 目標と不変条件（対）

| 目標 | ただし（不変条件） |
|---|---|
| 各poseに最終透過3枚（downedは2枚）を作る | 全成果物は原本と同一キャンバス 1680×1340。切り抜き・トリミングでサイズを変えない |
| 人形化で素材を単純化する | ポーズ・接触位置・前後関係・カメラはsourceと一致（QA基準表のとおり）。人物内部に穴・半透明・孤立ノイズを作らない |
| グレー2値で攻守を判別可能にする | RGB値と線幅は**16_powerbomb試作で固定し、以後全poseで変えない**。poseごとに調整しない |
| 再現可能なパイプライン | GPT Imageの利用は人形化のみ。分離・透過・輪郭・反転・サイズ検査はスクリプト化し、同一入力→同一出力 |

## 検証手順（フォアグラウンド実行。run_in_background禁止）

auto-simは不要（ゲームコード無変更）。代わりに全処理poseへ機械QAを実行:

1. 寸法検査: 全成果物が1680×1340
2. 再合成検査: `attacker`+`receiver`+`outline` を重ねた結果が `master` の人物シルエット・前後関係と一致（差分画像を `work/` に保存）
3. 透過検査: 人物領域の穴・孤立ノイズ・半透明の検出
4. 命名検査: パイプライン文書のファイル契約と完全一致

## 完了条件とコミット粒度

- **Phase A（試作・ここで必ず停止）**: `16_powerbomb` の master+最終3枚+QA結果+`PIPELINE-SETTINGS.md`（採用RGB値・線幅・外周のみ/内部線の方針）を1コミット。**Fableの検収合格までPhase Bへ進まない**
- **Phase B（本処理）**: 検収合格後、残り23技+M0を同一設定で処理。5poseごとに1コミット。各コミットでINTAKE.mdの状態列を更新
- 差分は assets/moves/ 配下と scripts/move-image/ のみであること
