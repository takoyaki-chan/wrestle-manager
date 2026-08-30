# task-102: care-rework2 P3「招聘市場の再設計」実装

- 起票: 2026-08-30(Fable)。実装: **Opus(隔離worktree)** → Fable検算マージ
- **前提**: task-101マージ後に着手(同領域のため並列禁止)。worktree HEADがtask-101を含むことを最初に確認(含まなければff-onlyで最新化。task-101が「feat(care-P2-G)」系コミットで判別可)

## 1. 目的

「ピッタリのコーチが来ない」の構造解消。指名リクエスト/重点ステ指導/市場の常設可視化/Allround一致経路/normal相性副軸/G15二重計上修正。**ALL_COACHES 35名のデータは1名も・1値も変えない**。

## 2. 仕様の正

**`docs/care-rework2-p3-design-v0.1.md`**(P3-1〜P3-5+G15の数値・不変条件のすべて)。関数アンカー(行番号はtask-100/101で動いているため関数名で探すこと): `rollInviteMarket` / `ensureInviteMarket` / `calcInviteMult` / `getCoachingCompat` / `COACHING_COMPAT_MATRIX`(data.js) / `getStatSpecBoost`+適用箇所(management.js練習ステ選択) / `getCharGrowthMult`(G15の二重計上側) / `showInviteCoachModal`・`showInviteTargetModal`(ui-common.js) / `_renderShachoshitsuDecisionDesk`(ui-render.js)

## 3. 触ってよい / 触ってはいけない

触ってよい: src/data.js(COACHING_COMPAT_ARCHETYPE新設・宣言リテラルのみ) / src/management.js / src/app.js / src/ui-common.js / src/ui-render.js / src/index.html(パネルCSS・トークンのみ) / test/

触ってはいけない: **ALL_COACHESの全データ** / src/match-engine.js / src/relationships.js / 特化ability×1.40の値と保持者 / 消化力逓減 / 招聘の格基礎倍率{1.25,1.30,1.35} / コーチ世代交代関連(凍結案件)

## 4. 実装確定事項(設計docの補足)

- **P3-1 指名リクエスト**: `G.coachRequest = { axis: 'style'|'grade', value, quarterKey }`。依頼は招聘市場パネル(P3-3)から・⚡0費用0・**同一四半期に1件まで**(依頼済みならボタン無効+理由)。四半期ロール時: 母集団(既存フィルタ後)にリクエスト該当者がいれば**候補の1枠目を該当者から抽選**(専用ソルトのderive)、残り枠は従来抽選。該当者ゼロなら従来抽選のまま+報告1行「今期は都合がつかなかった」。処理後 `G.coachRequest` はクリア。**リクエストが存在しないときの市場ロールは従来とビット一致**(0x1CB1の消費順を変えない — リクエスト枠の抽選は別ソルトで引く)
- **P3-2 重点ステ指導**: `showInviteTargetModal` に重点ステ選択(なし/PW/SP/TE/ST)を追加。`_inviteBuff.focusStat` に保存。練習ステ選択の重み付け(getStatSpecBoost適用箇所)で、招聘中かつfocusStat一致なら**×1.25**。**コーチが同じステの特化ability(×1.40)を持つ場合は特化のみ適用(非累積)**。AI招聘(aiSeasonTrainer)はfocusStatなし(従来どおり)
- **P3-3 常設パネル**: 社長室決裁タブに招聘市場ミニパネル — 今期候補(顔40px丸・名前・格・指導タイプ・得意スタイル)+「入れ替わりまで あと◯週」+リクエスト状態/依頼ボタン。ティッカー: 四半期最終週(12/24/36/48…の各四半期末週)に1行。モーダル・週次ポップアップは増やさない
- **P3-4**: ①calcInviteMultの分岐順を `coach.style===fighter.style`(+0.08)先行へ(Allround×Allroundが+0.08になる。他の組合せの値は不変) ②招聘のA級解禁を `orgPop≥55 || coachSlots≥4` へ(rollInviteMarketのminOrgPopフィルタに条件追加。C/Bのゲートは不変)
- **P3-5**: `COACHING_COMPAT_ARCHETYPE` をdata.jsに新設(値は設計doc §P3-5の表のとおり)。`getCoachingCompat` で **personality==='normal' のときだけ**archetype副表を参照(good+0.10/bad-0.10)。standardは全±0。非normalの判定は不変
- **G15**: `getCharGrowthMult`(coachMul側)で、**現在のコーチが招聘コーチ(inviteBuff由来)のときはスタイル一致ボーナスを加算しない**(gMultは残す)。雇用コーチ経路は不変

## 5. 数値目標と不変条件(対)

| # | 目標 | 不変条件 |
|---|---|---|
| 1 | リクエスト該当者がいれば翌四半期に1枠確定 | リクエスト不使用時の市場ロールは従来と**ビット一致**/orgPopゲートを超える格は連れて来ない/ご都合補充なし(不在は正直報告) |
| 2 | focusStat指定でそのステの練習選択率×1.25 | 特化×1.40の値・優先(非累積)/focusStat未指定の招聘は従来と完全同一/常勤コーチの練習選択に影響しない |
| 3 | Allround×Allround=+0.08 | 他の全組合せのスタイルボーナス値は不変 |
| 4 | 招聘A級が coachSlots≥4 でも解禁 | C/B級ゲート不変・A級の希少性(高い壁のどちらか)維持 |
| 5 | normal33名に相性good/badが発生 | 非normalの相性判定・倍率幅±0.10・逓減は不変/standardは全±0 |
| 6 | G15: 一致ボーナスの居場所をcalcInviteMultに一本化 | 非一致招聘の成長はビット一致/一致招聘は約-6〜8%の織り込み済み低下のみ(修正前後の4週成長を両ケースで計測・報告) |

## 6. 検証(フォアグラウンド)

1. node --check / `npm test` 全PASS
2. `node test/auto-sim.js 40 42` — ケアなしはリクエスト・focusStat不使用なので**市場ロール互換を含め挙動が大きく動かないこと**(G15とP3-4①はケアなしでもAI招聘に効くため、意味指紋の変化はその2点由来であることを切り分けて報告)
3. `node test/auto-sim.js 40 42 --care` ALL CLEAR — --care方針に指名リクエスト(欠けている軸を決定的に依頼)とfocusStat(対象選手の最低ステ)を追加し、**充足/不在報告の両方が40季で1回以上発生**することをプローブで確認
4. G15計測: スタイル一致/非一致それぞれ招聘4週成長を修正前後で比較(§5#6)
5. walkthrough 1本(社長室パネル追加のため)

## 7. 完了条件

- コミットは G15 → P3-4 → P3-5 → P3-2 → P3-1 → P3-3 の順で粒度分け
- `docs/codex-tasks/task-102-report.md`(変更点/計測値/発火件数/申し送り)
- specs更新・マージはFable
