# MQ確定経路の一本化に向けた事前調査

調査日: 2026-07-21  
対象HEAD: `9e46a61` から開始した作業ツリー  
前提資料: `docs/mq-inventory-report.md`（task-11）、`test/mq-ceiling-worstcase-report.md`（task-13）

## 0. 結論

1. 通常興行のMQ確定は `Engine.executeShow` と `App._finalizeShowImpl` で一致していない。典型的なauto-simカードでは平均差はほぼゼロだが、高OVR・王座・因縁・満員が重なると平均3〜5点、個別では10点以上ずれる。
2. 一本化は「2関数の片方を呼ぶ」だけでは終わらない。`src/` の本番コードから `Engine.executeShow` を直接呼ぶ箇所は0件で、AI興行、PPV、イベント戦、ジュニア大会、天頂戦、春タッグ、秋勝ち残り戦がそれぞれ独自の確定処理を持つ。
3. 最小の現実的単位は、DOMに触れない `Engine` 側へ「シミュレーション済み結果 + 興行文脈から最終MQを返す純粋な共通関数」を切り出し、通常UIとheadlessから同じ関数を呼ぶことである。特殊興行まで同じ外部補正を適用するかは別の仕様判断になる。
4. 方向①（画面をEngineへ寄せる）を推奨寄りとする。アーキテクチャ原則と既存のheadless較正を保ちやすい。ただし鮮度の扱い、100超表示、画面側だけにある集客計算差を先に決める必要がある。方向②は表示を100以内に保ちやすいが、+12 cap、trust、マイルストーン、ラストランと過去較正を失うため推奨度は低い。
5. 既存セーブに保存済みのMQは再シミュレーションされない。一本化後も過去値は当時の記録として残り、未来の試合から新経路になる。クラッシュ要因はないが、career best、年代記、表彰、ランキングで新旧スケールが混在する。

## 1. 計測条件

### 1.1 通常分布

現在HEADで `node test/auto-sim.js 20 42` を実行した。100シーズンは300秒で50/100までしか進まずタイムアウトしたため、現在HEADの再確認は20シーズンに縮小した。task-11の100シーズン完走値も併記する。

| 計測 | n | `Engine.executeShow` | UI経路再構成 | Engine - UI |
|---|---:|---:|---:|---:|
| 現在HEAD、20 season、seed 42 | 1,285 | 54.568 | 54.608 | -0.040 |
| task-11、100 season、seed 42 | 6,812 | 55.832 | 55.833 | -0.001 |

20シーズンでは violations 0、errors 0、frequency warnings 0、`ALL CLEAR`。再構成はDOMを動かさず、同一のエンジン素点と寄与を `App._finalizeShowImpl` の順序へ投入した値である。

### 1.2 上位・最悪ケース

task-13の `node test/mq-ceiling-worstcase.js 20000 130042` を正とする。

| 構成 | Engine平均 / 最大 | UI平均 / 最大 | Engine - UI | 主因 |
|---|---:|---:|---:|---|
| 現実寄りOVR95シングル | 89.724 / 108 | 93.384 / 100 | -3.660 | Engineの+12 cap、UIの鮮度+2と100 clamp |
| 人工最大OVR100シングル | 93.625 / 112 | 97.584 / 100 | -3.959 | Engineは外部27を12へcap、UIは適用要素が少ないが100 clamp |
| 好敵手/宿怨OVR100 | 93.721 / 112 | 95.469 / 100 | -1.748 | 因縁+2、会場+6、UI鮮度+2、両経路の上限差 |
| 人工最大タッグ | 94.080 / 111 | 88.697 / 100 | +5.383 | Engineだけラストラン+5、UIは外部100 clamp |

平均差の符号は固定ではない。「Engineへ寄せれば常に上がる/下がる」とは言えず、通常シングルの上位カードは下がりやすく、ラストランを含むタッグは上がりやすい。

### 1.3 特殊経路への100上限だけの適用

`test/auto-sim.js` に観測専用フックを追加し、各特殊経路が返した結果オブジェクトの最終MQを、状態へ書き戻さず `min(100, mq)` と比較した。20 season、seed 42の結果:

| 経路 | n | 現行平均 | 100 clamp後平均 | 差 | >100 | 最大 |
|---|---:|---:|---:|---:|---:|---:|
| AI興行 | 6,615 | 53.149 | 53.149 | 0.000 | 0 | 100 |
| PPV | 81 | 68.259 | 68.259 | 0.000 | 0 | 90 |
| ジュニア大会 | 140 | 52.986 | 52.986 | 0.000 | 0 | 77 |
| 天頂戦 | 75 | 69.040 | 69.040 | 0.000 | 0 | 88 |
| 春タッグリーグ | 140 | 61.114 | 61.114 | 0.000 | 0 | 98 |
| 秋勝ち残り戦 | 256 | 67.000 | 67.000 | 0.000 | 0 | 97 |

これは「上限だけを画面に合わせる」場合の実測である。観客/会場、鮮度、タイトル、trust、マイルストーンまで特殊興行へ移植する場合は、各大会に通常興行の会場・matchupLog・タイトル文脈をどう定義するかが先に必要で、同じ入力の機械的比較にはならない。

## A. 通常興行2経路の完全差分

### A-1. 処理順の比較

| 順 | 項目 | `Engine.executeShow` | `App._finalizeShowImpl` | 同一試合への差 |
|---:|---|---|---|---|
| 0 | エンジン素点 | シングル `simulateMatch`、タッグ `simulateTagMatch`（`src/management.js:11273-11316`） | プレビュー/観戦/スキップ中に同じエンジンを実行（`src/app.js:5751-5777,5805,5897,6158-6173`） | 同じstate・seed・カードなら素点は同じ |
| 1 | 因縁 | シングルのみ0〜+5、解決済み+2（`src/management.js:11300-11303,11443-11445`） | シングルのみ同値を加算後すぐ `min(100)`（`src/app.js:6253-6257`） | 通常域は同値。100付近だけUIが先に切る |
| 2 | ケミストリー | メタデータは作るが加算しない。関数自体が現在0（`src/management.js:11302-11303,11445`） | `>0`なら加算して100 clamp（`src/app.js:6256-6257`） | 現在は0差。関数復活時は分岐する |
| 3 | タイトル | +5、外部cap対象（`src/management.js:11446-11447`） | +5、直後に100 clamp（`src/app.js:6258`）。定数欠落時だけfallback +15 | 通常は同値。fallbackだけ潜在差10 |
| 4 | 集客入力（シングル） | match appeal→attendance（`src/management.js:11338-11368`） | 同系統（`src/app.js:6460-6528`） | 後述のバフ適用差あり |
| 5 | 集客入力（タッグ） | `m.left/right` を読むためタッグを専用計算せず appeal 0扱い（`src/management.js:11340-11343`） | 4人のdraw power平均を計算（`src/app.js:6463-6468`） | 同じカードでも興行動員とcrowd MQが変わりうる |
| 6 | attendance系バフ | `attendance_boost` のみ（`src/management.js:11363-11365`） | それに加え `mq_boost.attendanceMultiplier` と `next_match_mq.attendanceMultiplier`（`src/app.js:6500-6518`） | crowd MQの入力自体が分岐 |
| 7 | 観客/会場 | -3〜+6を外部合計へ追加（`src/management.js:11367-11370,11449`） | 全試合へ加算し、その場で5〜100 clamp（`src/app.js:6528-6534`） | 100付近はUIだけ切る。低域は両者とも下限5 |
| 8 | 全試合MQバフ | `mq_boost.amount`、通常+3、cap対象（`src/management.js:11374-11376,11450-11451`） | MQへは加算しない | Engineが+3。ただしcapで吸収されうる |
| 9 | 指定ペア次戦MQ | `next_match_mq.amount`、通常+3、1回消費、cap対象（`src/management.js:11377-11379,11452-11460,11532-11536`） | MQへ加算せず、attendanceMultiplierだけ使う | Engineが+3。UIではバフ消費もこの箇所では行わない |
| 10 | ラストラン | 出場+2、index 0メインなら計+5。シングル/タッグ両方（`src/management.js:11403-11415,11469-11483`） | MQ加算なし | Engineが+2/+5 |
| 11 | 鮮度 | +2 / -1〜-5をラベルだけ記録、MQへ入れない（`src/management.js:11486-11493`） | シングルだけ加算し5〜100 clamp（`src/app.js:6536-6549`） | UIが-5〜+2 |
| 12 | +12外部cap | シングルの正方向合計を12へcap（`src/management.js:11494-11497`、定数 `src/data.js:4353`） | なし。代わりに各段階100 clamp | Engineは最大15点のcap損失を実測 |
| 13 | trust | trust<35の選手1人につき-1.53、最大-3.06。cap後に減算（`src/management.js:11498-11505`） | なし | Engineが0〜-3.06 |
| 14 | 最終下限/上限 | `max(5, ...)`。上限なし（`src/management.js:11504-11527`） | 補正段階ごと5〜100（`src/app.js:6255-6258,6528-6547`） | Engineは最終100超、UIは必ず100以下 |
| 15 | タッグ固有 | エンジン内5〜100の後、会場とラストランを足し下限のみ（`src/match-engine.js:1730`, `src/management.js:11416-11440`） | エンジン内5〜100の後、会場だけ足して再度5〜100（`src/app.js:6528-6530`） | task-13最大: Engine 111、UI 100。平均差+5.383 |

### A-2. 同じ通常興行で揃える必要がある項目

- 外部補正の単一の順序と、cap/clampをかける地点
- 鮮度をMQへ残すか、集客専用へ完全移行するか
- `mq_boost` / `next_match_mq` / ラストラン / trustを画面興行にも適用するか
- タッグに因縁・タイトル・trust・マイルストーンを適用しない現仕様を維持するか
- タッグの内部100 clampと外部補正後上限の関係
- App側だけのattendanceMultiplier 2種と、Engine側のタッグmatch appeal欠落
- 次戦MQバフの消費責務

## B. 一本化方向ごとの影響

### B-1. 方向①: 画面経路を廃し `Engine` 側へ寄せる

推奨度: **高め。ただし現行 `executeShow` を丸ごとUIから呼ぶのではなく、MQ確定の純粋関数を抽出する形を推奨。**

- 典型分布ではプレイヤー表示は平均0.001〜0.040点下がるだけだった。
- OVR95上位シングルでは平均3.660点下がる一方、5.320%が100超となり最大108を表示する。
- 人工最大シングルでは平均3.959点下がり、最大112。外部27点のうち15点は+12 capで失われる。
- ラストラン付き人工最大タッグは平均5.383点上がり、最大111。UIに無かった+5が入るためである。
- 鮮度はEngine側で現在すでに計算・ラベル保存している。MQへ残すなら共通確定関数へ入力し、集客専用へ寄せるならApp側加算を削除する。計算場所の移設自体は小さいが、仕様選択が必要。
- 100超で例外になる表示はtask-11の走査では見つからなかった。数値、星、色分けは安全。ただし線形報酬（イベント収入、MVP/ランキングの一部）と「最大5星」等の飽和は再確認が必要。
- `Engine.executeShow` は興行全体の状態更新まで行うため、観戦済み結果を持つAppからそのまま呼ぶと再シミュレーション・二重更新になる。共通化対象はMQ確定関数であり、興行全体関数の直接置換ではない。

### B-2. 方向②: headlessを画面経路へ合わせる

推奨度: **低め。**

- 通常auto-simの平均は0.001〜0.040点上がる。典型分布だけ見ると影響は小さい。
- OVR95上位シングルは平均3.660点上がるが、14.350%が100へ切られ、該当試合の損失は平均5.347、最大14。
- +12 cap、trust、2種マイルストーン、ラストランを単純に消すと、これらを前提にしたtask-11/task-13の較正と実測の連続性を失う。特にラストラン付きタッグは平均5.383点下がる。
- 特殊経路へ「100 clampだけ」を適用した20シーズン実測では、AI/PPV/JT/天頂戦/春タッグ/秋勝ち残りの全件が100以下で平均差0だった。ただし高OVRストレスではtask-13どおり差が出る。
- 観客/会場と鮮度まで特殊興行へ広げる場合、PPV・天頂戦・大会戦に通常興行の会場と鮮度を定義する必要がある。これは単なる経路統合ではなく大会仕様変更である。
- これまでのauto-sim、AI較正、PPV/天頂戦分布、ランキング較正はheadless値を基準にしている。変更後は同じseedでもMQ閾値を跨ぎ、人気、trust、成長、関係、表彰へ連鎖しうる。

## C. 呼び出し元と経路一覧

### C-1. `App._finalizeShowImpl`

| 呼び出し | 場所 |
|---|---|
| 興行開催ボタン | `src/ui-render.js:3451` → `src/ui-common.js:4145 executeShow()` → `src/app.js:5359 App.executeShow()` |
| 全試合解決後 | `src/app.js:5682,5880,6083` → `App.finalizeShow()` |
| 全スキップ | `src/app.js:6184` → `App.finalizeShow()` |
| 排他ガード後の本体呼出し | `src/app.js:6188-6194` → `src/app.js:6216 App._finalizeShowImpl()` |
| 失敗時再試行 | `src/ui-common.js:4209,4216` → `App.finalizeShow()` |

一本化時は、`App.executeShow` が作った `sp.results` を共通MQ確定関数へ渡し、`_finalizeShowImpl` 内の `6250-6258` と `6528-6549` の独立加算を除去する必要がある。観戦結果を再シミュレーションしてはならない。

### C-2. `Engine.executeShow`

`src/` 内の本番呼び出しは**0件**。定義は `src/management.js:11227`。直接呼ぶのはheadless/診断テストである。

- `test/auto-sim.js:1033`
- `test/decay-longevity-test.js:201`
- `test/diag-draft.js:315`
- `test/diag-fa.js:254`
- `test/economy-check.js:200`
- `test/extraction-rate-phase2.js:440`
- `test/extraction-rate-verify.js:288,526`
- `test/faction-sim.js:97`
- `test/growth-v2-verification.js:378`
- `test/growth-analysis.js:220`
- `test/mq-analysis.js:151`
- `test/make-save.js:210`
- `test/progression-repair-test.js:73`
- `test/pool-stats.js:130`
- `test/relationship-distribution-analysis.js:565`
- `test/roster-depth-analysis.js:369`
- `test/test-vacant-title.js:112,140`
- `test/title-diagnostic.js:151`
- `test/track-org-rosters.js:546`

一本化時はこれらのテストが新しい共通確定関数を間接的に通ることを確認し、`mqInventory` の観測項目を共通関数の返却メタデータへ移す。

### C-3. `executeShow` を通らない本番MQ経路

| 種別 | 確定経路 | 現在の補正 | 一本化時の修正候補 |
|---|---|---|---|
| AI通常興行 | `Engine.rival.processAIWeek` `src/management.js:7946`、MQ加算 `8106-8112` | 因縁、死んだケミストリー。上限再処理なし | 共通関数を使う範囲を決める。通常会場/鮮度を持たせないなら専用profileが必要 |
| PPV | `simulatePPVMatch` `13451` → `applyPPVResults` `13458`、加算 `13491-13497`。呼出し `src/app.js:12867,12925,12939,12993`、TV側 `src/management.js:13924` | プレイヤー関与戦の因縁。上限なし | PPV用profileか、現状維持を明示 |
| 対抗戦/イベント戦 | `resolveEventMatch` `src/management.js:14017-14025`。呼出し `src/app.js:12456,12528,12552`、`src/ui-common.js:5629,5638`、`src/management.js:14034` | `mqBonus`直加算（現呼出しは0） | 共通関数にevent bonus入力を持たせるか、素点経路として残す |
| ジュニア大会 | `Engine.juniorTournament.run` `src/management.js:23152`、呼出し `src/app.js:13477`, `test/auto-sim.js:974` | エンジン素点 | 大会profile。連戦HPはMQ外なので維持 |
| 天頂戦 | `_applyMqBonuses` `src/management.js:23671` → `run` `23688`、週次呼出し `14689` | 因縁、死んだケミストリー。上限なし | 大会profile。通常会場補正を混ぜない判断が必要 |
| 春タッグリーグ | `Engine.springTagLeague.run` `src/management.js:24131`、週次呼出し `14846` | タッグエンジン素点5〜100 | タッグ内部上限方針と一緒に決める |
| 秋勝ち残り戦 | `Engine.autumnWar.simulateNextBout` `src/management.js:24835`、UI呼出し `src/app.js:3447`、auto-sim `test/auto-sim.js:1150` | シングルエンジン素点、上限なし | 大会profile。連戦消耗と観戦再生の結果同一性を維持 |
| その他B3/C1/B2 | 例 `src/app.js:11511,11674,11815` | 独自に `simulateMatch` | 対象範囲を別途列挙し、profileなしの素点経路として扱うか決める |

## D. 既存セーブとの整合

### D-1. どの値が保存されるか

- プレイヤー通常興行はUI経路確定値を `lastShowResults` に保存する（`src/app.js:7122`）。`careerBestMQ`（`7205-7210`）、bigMatch履歴（`7353`）、H2H、関係、ニュースもその値を参照する。
- headless通常興行はEngine経路確定値を `lastShowResults`（`src/management.js:12096`）とH2H（`12045-12064`）へ保存する。
- AI興行は独自値を `careerBestMQ`（`8180-8182`）、bigMatch履歴（`8240-8243`）、`seasonBestMQ` / match（`8318-8325`）へ保存する。
- PPVは独自値を結果（`13508`）とキャリア履歴（`13802`付近）へ保存する。
- ジュニア大会は結果MQを大会結果（`23200`）、戦績をcareerRecord（`23297`以降）へ保存する。
- 天頂戦は結果MQ（`23728`）を持ち、careerRecordへ大会結果を保存する（`23859`）。
- 年代記、表彰、実績、新聞はこれらの保存値を集計・比較・表示する。

### D-2. 一本化後の不整合

- 過去の試合は再シミュレーションされないため、同じ対戦を将来組んでも新経路では違うMQになりうる。
- 保存済みMQを現在式で一括再計算する箇所は見つからなかった。年代記再構築や表彰集計は保存済み `careerRecord.history`、`careerBestMQ`、`seasonBestMQ` を読むだけである。
- 実害はデータ破損ではなくスケール混在である。過去のcareer bestが旧経路の高値なら新経路で更新しにくくなり、逆なら更新しやすくなる。MQ閾値を使う実績・ランキング・表彰にも同じ世代差が残る。
- migrationで過去値を書き換える根拠はない。移行時点を仕様/セーブバージョンに記録し、過去値は当時の記録として保持するのが最も安全である。

## E. タッグの二重クランプ

### E-1. 履歴から見た意図

- タッグエンジンの `clamp(...,5,100)` はタッグ初回実装コミット `ec5a9cd`（2026-04-16）で最初から入った。
- 外部のcrowd MQ加算は後続の結果処理統合 `b19e135`（同日）で追加された。初版から「内部で100へ丸めた後、外部加算で再び超える」という統一ルールが文書化されていた証拠は見つからない。
- シングル上限撤廃コミット `bf0f3a6`（2026-03-30）は「全5箇所で撤廃」と記しているが、タッグ実装より前である。後から追加されたタッグに撤廃方針が反映されなかった時系列になる。
- したがって、現在の二重処理は意図的な二段階上限というより、別時期に追加された処理が揃っていない可能性が高い。

### E-2. 選択肢

1. **素点も最終値も上限なし**: タッグ内部の100上限を外し、シングルと同じ下限のみ。task-13の人工最大では無制限最大127となる。上限撤廃方針には最も一貫するが、タッグ固有bonusの較正が必要。
2. **素点100、最終上限なし**: 現headlessを正とする。タッグ固有演出bonusは100で飽和し、会場/ラストランだけが100超を作る。意味の説明が必要。
3. **素点100、最終も100**: 現UIを正とする。二重clampを明示仕様にするが、上位カードの差が最も消える。
4. **共通の外部capを適用**: 内部上限を外し、シングル/タッグとも最終確定で+12等の共通capを一度だけ適用する。構造は揃うが、タッグにタイトル・因縁等を入れるかは別問題。
5. **試合形式別profile**: 共通関数は1本にしつつ、singles/tag/eventの適用要素と上限policyをデータで渡す。経路は一本、仕様差は明示できる。

決定は本調査では行わない。構造上は5が最も特殊興行を扱いやすい。

## 2. 調査中に見つかった追加の食い違い

1. `Engine.executeShow` は本番から直接呼ばれていない。通常本番UI以外も単一のheadless経路ではなく、複数の独自経路である。
2. Engine側のタッグmatch appealは専用処理がなく0扱いだが、App側は4人のdraw powerを使う。MQ補正以前にattendanceが分岐する。
3. App側だけ `mq_boost` / `next_match_mq` のattendanceMultiplierを適用する一方、MQ amountはEngine側だけが適用する。同じバフが経路ごとに別の半分だけ効く。
4. `next_match_mq` のMQ消費はEngine側にしかない。UI経路では該当戦を終えても、このMQ確定箇所では消費されない。
5. タイトルMQのfallbackがEngine +5、App +15で異なる。通常は定数が存在するため顕在化しない。
6. Engineのコメントは「正方向+15」と残るが実定数は+12（`src/management.js:11373` 対 `src/data.js:4353`）。
7. Engineは外部寄与を合算後に正負分離するため、負のcrowd補正は他の正加算と相殺してからcap判定される。「負値はcap対象外」という説明より実式はnet方式である。

## 3. 難易度見立てと実装時の境界

### 難易度

- **通常興行2経路だけのMQ確定共通化: 中**。純粋関数抽出、App/Engineの呼び替え、鮮度/cap policy決定、回帰テストが必要。
- **attendance差、バフ消費、タッグまで含む通常興行完全一致: 中〜大**。
- **AI/PPV/全大会を同じ外部補正へ統合: 大**。各大会に会場・鮮度・タイトル・trustを適用するかという仕様変更を伴う。

### 推奨する分割

1. MQ確定の入力/出力schemaとpolicy（singles/tag/normal/event）を先に決める。
2. 通常興行のシングルを共通関数へ移し、同一seed同一カードのApp/headless一致テストを追加する。
3. タッグの上限policyを単独で決めて移す。
4. attendance/buff消費の差を別コミットで揃える。
5. 特殊興行は現状維持かprofile接続かを種類ごとに決裁する。

## 4. 再現コマンド

```text
node --check test/auto-sim.js
node test/auto-sim.js 20 42
node test/mq-ceiling-worstcase.js 20000 130042
```

- 通常分布と特殊経路の上限再構成: `test/auto-sim.js`
- 上位/最悪ケースの2経路比較: `test/mq-ceiling-worstcase.js`
- どちらも新規の `Math.random()` は使用していない。task-16の追加フックは観測だけで、MQやGameStateへ書き戻さない。

