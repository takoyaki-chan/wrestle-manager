# Wrestle Manager 作業ログ（worklog）

## リポジトリ大掃除: 恒常dirtの根絶+陳腐化ブランチ26本の処理（2026-08-13・Fable・Keisuke指示）

「未コミット・未マージが残って毎回考える羽目になるものは処理してしまえ」の指示。

**①恒常的な未コミットdirtの根絶**: `docs/stat-contribution-report.md` がnpm testのたびに汚れる原因は、stat-contribution-test.jsが**実行時間の行をレポートファイルに書き込む**こと(本文はシード済みで決定論)。実行時間をコンソール表示のみに変更し、レポートを再生成してコミット。以後npm testを何度回してもツリーは汚れない。

**②陳腐化ブランチの処理**(全て中身の突き合わせ検証つき): 未マージ4本は**全て内容がmainへ別経路で反映済み or 別製品ライン**と確認 — inspiring-ritchie(Math.randomシード化→checkRecontact/applyChoiceEffectのrng引数として反映済み)/autumn-war-winner-comments(→is-autumn-speechとして反映済み)/browser-battle-demo(→_playWarMatchResultSe/finalizeRetireeBufferとして反映済み)/battle-demo-move-assets(公開デモ1.25B資材393ファイル=本編と別ライン)。**`archive/*` の注釈タグ4本で保全してからブランチ削除**(タグはoriginにもpush)。加えて**マージ済みで削除し忘れていた17本**(codex/task-86〜92の7本・サブエージェント残骸worktree-agent-*8本・セッション残骸2本)を`git branch -d`(マージ検証つき)で一括削除。

**③完了セッションの後始末**: 今日マージした3セッション(sweet-galileo/ポップアップ監査/ガードテスト)のworktree撤去+ブランチ削除+セッションアーカイブ。残るブランチ・worktreeは**稼働中のもののみ**(eager-bell検品/goofy-sammet/keen-taussig=OVRチップ/task-85系のcodexワークスペース+技画像2本)。

検証: node test/stat-contribution-test.js 再実行→git diffゼロ(実行時間行の削除のみ)。specs/manifest該当なし(テスト基盤+git整理)。

## v1.30リリース: 取り残し2ブランチ回収+バージョン更新+push（2026-08-13・Fable）

Keisuke指示「取り残しがないか確認してからv1.30でpush」。push前監査で**マージ漏れ2ブランチ**を発見し回収:
①**ポップアップ直列化**(claude/serene-shamir-97d4d7、同日の監査チップ完了分)→マージ(f28fcdf)。`_isPopupActive`のオプション対応が現mainに存在することを確認済み ②**ui-baseline-guard-test新設**(claude/serene-pascal-03f89e、08-12完了分)→マージ(b002643)。08-12以降に入った画面で検出3件(task-86開戦の120×180/36×52・果たし状隊列のモバイル縮小105×157)は**承認済み設計値のためALLOWへ理由付き凍結**+陳腐化ALLOW5行掃除(F07肖像修正・task-86で消えた旧サイズ)。これでCLAUDE.md/ui-checkスキルが参照する機械検査が実在するようになった。
残置ブランチ4本(inspiring-ritchie/autumn-war-winner-comments/battle-demo系2本、7/30〜8/5)は旧実験・別リリース系のため意図的に除外。

バージョン: release/manifest.json + タイトル画面 `title-ver` を **1.26→1.30**。検証: ui-baseline-guard-test ok(allowed=98/98)・npm test **243/243全緑**(直列化+ガードテスト込み)。この状態で origin/main へ push(Cloudflare Pages自動デプロイ)。

## task-96マージ: 春のタッグリーグv0.2(2ブロック制)（2026-08-13・Fable+Codex）

**task-96をマージ**(bb9c0ed)。Codexがworktree wm-codex-task96で実装(+1,167行、src6+テスト6)→sandboxコミット不可(BLOCKED)→Fableがdiff全文レビュー・検算・**2件の設計修正**・3粒度コミット代行(①エンジンd352fb4/②UI 9180697/③文言38d6a0e)→mainへ。ui-common.jsは並行チップ(798861b 試合前OVR7帯統一)と自動マージ。

実装: 出場枠=Week10ランキング3/2/2/1計8チーム(返上繰り下げ・6未満中止)/蛇行組み分け(同団体3チーム同居は下位入れ替え)/A・Bブロック独立総当たり(勝ち点・タイブレーカーはv0.1継承をブロック内適用)/決勝=A1位vsB1位(引き分け裁定: 勝ち点→接戦ボーナス→総MQ→決定論シード、`decideFinalDraw`)/賞金v0.2表(チーム単位・自団体合算表示)/`G.springTagLeague`は`format:2`+teamId基軸、**旧formatセーブは表示・リプレイ・run途中とも互換**/seedTag=A0〜5・B6〜11・決勝12を試合に保存。UI=枠数分のスロットタブ編成(掛け持ちロック・fail-openおまかせ)/A/B順位表縦積み/決勝A1位・B1位チップ/進行900msロック+champion一回化。spec§10未決2点は指示書のFable裁定どおり(AI2組目以降=未選出OVR上位/蛇行固定)。

**Fableレビューでの設計修正2件**: ①**対戦ポイント(battlePoints)がチーム単位加算になっていた** — 3枠団体がブロック敗退すると-8×3を食い、枠が多い上位団体ほど沈む歪み。v0.1と同じ**各団体1回(最良成績で代表)**へ修正しテストで固定(サミット/対抗戦系に効く実数のため) ②観戦の総試合数が13固定 — 6〜7チーム開催年・旧形式で狂うため実データから算出へ。

検算(Fable独立実施): 全spring-tag系テスト単独実行→npm test **242/242全緑**(worktree・マージ後main両方)/auto-sim **40季seed42 ALL CLEAR**(フォアグラウンド。指紋55f20623=エンジン挙動変更を含むためmain旧指紋とは不一致で正)/I-1〜I-10はv02テスト3本が構造固定(枠配分6〜8チーム+5チーム中止・別ブロック決勝・掛け持ちゼロ・リプレイ13試合一致・careerRecordキー不変・殿堂+3/実績8/人気+10据え置き)/旧shape参照の残存grep=ガード付き1箇所のみ。specs INDEX(v0.2実装完了)+画面仕様書の実装状況+roadmap+バックログ§春タッグv0.2(7項目)を更新。manifest変更なし(新規配布ファイルなし)。

残: Keisuke実機確認(バックログ§春タッグv0.2)/新聞・画面の新規文言レビュー(完了報告に全文列挙済み)/worktree・ブランチ削除済み。

## 試合前画面OVRを共通7帯階調へ統一（2026-08-13・Fable）

前セッション(2bbfc99)でチップ起票した統一タスク。通常興行の試合前画面(`renderMatchPreview`)のOVRだけがDB(7帯 `statTierStyle`、stat-notation-v1.0が正)と違う旧6段(`_scale6Style(_ovrColor())`)のままだった件。task-95マージ済み(e104b7d)を確認してから着手。

変更: ui-common.js の3箇所(シングル左右+タッグの`_tagFighter`)を `statTierStyle('ovr', …)` へ置換。遠征変種はtask-95で適用済みのため、これで試合前画面のOVR4箇所すべてが7帯に揃った。見た目の差: 85+常時glow廃止(輝きは100超のみ)/90+純色太字/60台は白。DOM構造・クラスは不変(style文字列の中身だけ)。

テスト: `regular-show-pregame-design-test.js` を7帯前提へ更新(preview内 `statTierStyle('ovr'` 4箇所以上+旧6段の残存禁止)。`stat-notation-backport-test.js` §5の件数ピンを新しい真実へ再較正(`_ovrColor` 6→3 / `_scale6Style` 19→16。ピンは意図しないドリフト検出用で、今回は意図的移行)。**npm test 239/239全緑**。

OVR系の残置3件(勝手に変えない裁定・spec §4へ残置理由を明記): ①選手詳細・戦績タブのピークOVR(ui-common.js:4279。task-91が「変更しない」とピンした箇所+同行のベストMQが6段のままで単独変更は行内混在になる) ②社長室・履歴書カードのOVR(ui-render.js:5097) ③同レンタルミニカード(ui-render.js:5192)。②③はクリーム背景のOffice画面で7帯の白帯#f2f0e8が背景に溶けるため、適用するならOffice向け明度設計が先。統一するかはKeisuke裁定待ち。

specs: `docs/ui/stat-notation-v1.0.md` §4へ試合前画面の行+残置理由を追記。manifest変更なし(新規ファイルなし)。残: Keisuke実機確認(バックログ§選手ファイル+数値表記へ1項目追記)+spec diff確認。

## task-95マージ: 遠征試合リスタイル+結果2拍シーケンス（2026-08-13・Fable+Codex）

**task-95をマージ**(e104b7d)。Codexがworktree wm-codex-task95で実装(+850行、src4+新テスト3)→sandboxのindex.lock拒否でBLOCKED→Fableがdiff全文レビュー・検算・2粒度コミット代行(A=進行画面8b027d2 / B=2拍+セリフ+テスト7e5d7e5、ui-common.jsはパッチ分割でA/Bへ振り分け)→mainへ。

実装: **A)** away進行画面を黒×火の赤(`--awx-*`=--accent-warエイリアス・新規16進ゼロ)+fc1m式5項目帯(生値・優位のみ点灯: 自=金/敵=赤)+OVR7帯statTierStyle+梯子S。**通常興行の5カラムDOMはelse分岐に完全隔離**。**B)** 決着時のみ2拍シーケンス(B1=勝者側代表XL172×258の勝ち名乗り+スコア帯「団体として勝利/敗北」+明細crrm-row/B2=「— そ の 夜 —」敗者側代表M132×194単独、グレースケールは本人勝敗基準)。引き分けは従来並置。主役選定(代表戦勝者→同陣営最高MQ勝者)と場面選定(本人○×団体●=regretOwnWin/本人●=既存lose)は純関数。▶待ち12秒タイムアウト+二重起動防止+onClose単発。コーチ要約はモーダル撤去→gameLog1行(文面は旧モーダルの流用)。42本は`AWAY_CHALLENGE_RESULT_LINES`宣言追加(ブラケット代入なし)。

検算(Fable独立実施): **I-1**=auto-sim 20季seed42の指紋 worktree`c4ae4364`=main`c4ae4364`完全一致(表示層のみ) / **I-2**=突き合わせテストが承認稿mdを直接パースしdeepStrictEqual(21+21本・archetype7×3) / **I-3/I-4**=純関数をテスト固定 / **I-5**=梯子XL/M・吹き出しは画像の上でセリフのみ・○×のみでLOSE文字なし / **I-6**=非away DOM不変+既存安全網テスト通過 / **I-7**=シーケンステストがクリック二重・タイムアウト経路まで検査 / `sp.awayPlayerRosterIds`等の参照は全て既存(app.js:9970)。**マージ後main: npm test 239/239全緑**(新3本込み)。ui-check 7項目全○(機械検査のui-baseline-guard-test.jsはリポジトリに存在せず=CLAUDE.md記載が古い、npm test内guard群で代替)。specs: challenge-request-spec-v0.2 の結果演出行を2拍へ更新。バックログに実機確認6項目追記。manifest変更なし(新規配布ファイルなし)。

新規マイクロコピー(Keisuke要レビュー): B1タイトル「果たし状、成就。/果たし状、敗れる。」(inverse:「挑戦、退ける。/挑戦、許す。」)/帯「団体として勝利/敗北」/役割ラベル「挑んで、団体を勝たせた代表」「受けて立ち、団体を勝たせた代表」「挑んだ代表/受けて立った代表 ・ 本人の試合: ○ 勝利/× 敗北 / 団体: 敗北」/キッカー「AWAY CHALLENGE ・ RESULT」「— そ の 夜 —」/ボタン「▶」「— 閉 じ る —」。

残: Keisuke実機確認(バックログ§遠征試合)/worktree・ブランチ削除済み/次工程=task-96(春タッグv0.2)のCodex投入。

## 春タッグv0.2をtask-96起票+task-95をCodex投入+既存テスト3本を再較正（2026-08-13・Fable）

Keisukeが実機で「決勝は同率1位のときだけにすべきでは。8チーム2リーグの1位同士ならわかる」と再提起 — これは**2026-08-01の本人裁定と同内容で、spec v0.2(2ブロック制)として起票済み・未実装**だった。同率時のみ決勝案は「決勝の有無が年により不定/3チーム同率で結局詰む」ため不採用とし、v0.2実装で進める。**task-96(docs/codex-tasks/task-96-spring-tag-league-v02.md)を起票**: spec §10未決2点へのFable裁定(AIの2・3チーム目=未選出OVR上位ペア/蛇行固定/プレイヤー未編成枠はAI規則で自動編成のfail-open)+不変条件I-1〜I-10(核: 3/2/2/1計8・別ブロック1位同士・掛け持ち禁止・seedTag=A0〜5/B6〜11/決勝12・旧セーブ互換・報酬据え置き)。roadmap実装順表とspecs/INDEXに1行反映。**投入はtask-95マージ後**(app.js/index.html/data.jsが交差)。

**task-95(遠征試合リスタイル+結果2拍)をCodexへ投入**: 従来のwrestle-manager-codexはtask-85のWIPで占有中+mainの未push149コミットをGitHub経由で取り込めないため、§0をtask-86/93/94と同じ**worktree方式(wm-codex-task95、ブランチcodex/task-95)へ変更**(0b28342)して`codex exec --full-auto`をバックグラウンド起動。マージレビュー(不変条件I-1〜I-7の検算)はFableが行う。なお開始時、sweet-galileoセッションのマージがworklogコンフリクトで停止していたが、当該セッションが自力で完了(4b315a7)。マージ後mainのsrc4ファイルはnode --check通過。

**npm test既存3失敗の再較正(2bbfc99)**: worklog記載の「task-91陳腐化疑い」を確定させた。①feedback-fixes §5=選手詳細バーの150目盛り直計算(`val/150`)を見ていたが、task-91で共通枠越えバー`statOverBarHtml`へ移行済み→共通表記経由の検査へ ②wear-ceiling-decay §11/12=▼N・+Nの旧排他表示を見ていたが、新表記は`is-lost`/`is-gain`別チップ併記が確定デザイン→独立マークの検査へ ③regular-show-pregame-design=DB照合先`_scale6Style(_ovrSc)`がfaf4e8cで`statTierStyle('ovr')`(共通7帯)へ移行済み→照合先を差し替え。**検査は削らず新しい真実の固定に置き換え。npm test 236/236全緑へ復帰**。副産物: 試合前画面のOVRだけ旧6段階調のまま(DBは7帯)と判明→統一タスクをチップ起票。

残: task-95のCodex完走→Fableマージレビュー / task-96はその後に投入 / specs更新なし(実装なしのためN/A、v0.2実装完了時にspec INDEXのステータス更新)。manifest変更なし。

## 挑戦フロー2バグ修正: 同一週の挑戦系コンテナ排他+対抗戦中断で結果が出る（2026-08-13・Fable・mainへマージ済み）

チップ起票済みの2件を修正(worktree sweet-galileo→main)。

**バグ1(優先): 同一週に受け挑戦と遠征が同時発生し同一選手が複数回試合** — 呼び出し元の数え上げの結果、予約は5コンテナ(敵地遠征/統一王座遠征/果たし状シリーズ/B3挑戦状/統一王座迎撃)あり、既存排他は ①`hasCompetingBooking`=1興行のカード内のみ ②B3の`hasAwayParticipantConflict`=**遠征の消化後は予約が消えて素通り**(9910行コメントの既知の罠と同型) ③task-88の統一王座繰り越し=受け側同士のみ、で**週内の遠征↔受け側の排他が無かった**。修正: `Engine.challengeRequest.resolveWeeklyChallengeContainer(state)`(純関数・'away'/'incoming'/null)を新設し、**同一週の挑戦系コンテナは1つまで・受理週の先着優先・後発は予約を消さず次の通常興行週へ持ち越し**(=既存の8週失効sweepと整合、消すのは従来どおりsweepだけ)。「今週遠征消化済み」は`_awayChallengeUsedIds`で判定する`hasAwayRunThisWeek`を対にし、同週2本目の遠征も見送り。配線は全地点: executeShow(遠征起動2+受け予約3+果たし状消化1+**I-1保険=今週遠征済み選手をカードから除去**)/renderShowPrep(受け予約3+持ち越しバナー)/startShowPrep・resumeShowPrep(移動演出ごと見送り)/_startAwayChallengeShow(直接呼び出しの保険)。B3の旧参加者重複ゲートは本排他に置換(旧ゲートを残すと相互デッドロックでB3が失効まで走らない)。

**バグ2: 対抗戦観戦の「✕試合中断」で試合が未消化に見える** — 原因は表示: warWatchMatchが結果を観戦開始時に確定済みなのに、escapeBattleの対抗戦分岐だけ**盤面を再描画せず**古いスコア(0-0)のまま戻していた。さらに最終試合を中断すると finalizeWar が呼ばれず**ボタンも死ぬソフトロック**が潜在。修正: 中断でも観戦完了(`_receiveWarBattleResult`)と同じ着地=勝敗SE→`renderWarMatchPreview()`→全消化なら`finalizeWar()`。BGM復帰はトークンガード付き`_scheduleWarBgmResume`へ。**対抗戦分岐のみの変更**で、通常興行/PPV/大会観戦の中断挙動は不変。

触ったファイル: relationships.js(裁定関数2つ)/app.js(executeShowゲート+I-1保険+遠征起動保険+escapeBattle)/ui-common.js(startShowPrep/resumeShowPrep)/ui-render.js(renderShowPrep+バナー)。テスト新設: `test/challenge-week-exclusivity-test.js`(先着裁定・消化済みロック・純関数性=I-2・8週失効不変=I-3・全配線の静的検査)/`test/war-escape-result-test.js`(escapeBattle実抽出の挙動検査3ケース)。検証: 新規2本+関連13本(challenge系5・away系2・unified2・autumn-war2・b3・f09)全緑、auto-sim 40季(seed 7919)ALL CLEAR 違反0。specs: challenge-request-spec-v0.2 に§7(週次排他)追記+INDEX更新。マージはtask-95(遠征画面リスタイル・Codex投入前)より先に完了し衝突なし。残: Keisuke実機確認(バックログ追記済み)・specs diff確認。

## 遠征試合リデザイン: セリフ42本承認→task-95指示書起票（2026-08-13・Fable+Keisuke）

セリフ42本(勝ち名乗り21+悔しさ本人○象限21、docs/dialogue/away-challenge-result-lines-draft-v0.1.md)を**Keisukeが全文承認**。統一王座P3と同じ「Codex投入はセリフ承認後」の順で **task-95(docs/codex-tasks/task-95-away-challenge-redesign.md)を起票**: A=進行画面リスタイル(黒×火の赤+fc1m式5項目帯・生値踏襲・awayのみ) / B=結果2拍シーケンス(勝者代表XL勝ち名乗り→敗者代表M単独の悔しさ・2軸選定・主役選定規則・コーチ要約は週次レポート行へ)。不変条件I-1〜I-7(核: auto-sim指紋main一致=表示層のみ/承認稿一字一句の突き合わせテスト/2軸選定の純関数化/onClose単発保証)。並行中の挑戦フロー2バグ修正(別セッション)とのコンフリクト注意を明記。**残: Codex投入→Fableマージレビュー(不変条件を1つずつ検算)**。

## コーチ世代交代+新25名: 凍結（2026-08-13・Keisuke裁定）

実装未着手のままプロジェクトを凍結。「コーチが永遠に固定なのが嫌」という当初動機(08-12起票)は当面気にするほどではない、との再判断。ここまでの成果は再開可能な形で保存 — ①設計案v0.1(裁定5点確定済み: 在籍年数tenureLimit/退任予告/市場段階供給/S級なし/25名配分) ②キャラ草案25名v0.1a(ID36〜60・レビュー途中。一次レビュー反映済み: 体調が通常興行の試合強度に効かない実測を受けた質疑→「仕上げ職人」は強すぎ裁定で廃止、荒船=限界突破+闘志注入/東雲=弱点克服+TE特化へ組み替え。新特技は復帰支援/結束育成の2種)。**ゲーム本体への変更ゼロ**(docsのみ・ALL_COACHESは35名のまま)。再開時は25名リストのレビューから。

## task-94マージ+週次オートメーション刷新: UI自動走破ハーネス(バグ捜索②)（2026-08-13・Fable+Codex）

**task-94をマージ**(0dd77fb)。Codexがworktree wm-codex-task94で実装(+7,801行、11ファイル)→git管理領域書き込み不可でBLOCKED(task-93と同根)→Fableがdiff全文レビュー・不変条件の独立検算→4粒度コミット代行→mainへ。worktree/ブランチ削除済み。mainで `npm install`+self-test動作確認済み。

実装: `test/ui-walkthrough/` 新設(run/server/driver/detectors/fixtures/README)+Playwright devDependency+`npm run test:ui:walkthrough`。Wモード=fixtureセーブ(headless Engine生成・seed42・14名体制)から**実UIクリックのみで1季走破**。主ボタン方針のスコア表+最前面オーバーレイ優先+破壊操作遮断リスト+CSSアニメ待ちのclock制御。検出器: D1例外(pageerror/console/[WM Debug])/D2スタック(クリック後5秒無変化→他ボタン一巡→FREEZE)/D3可視テキスト(undefined/NaN/[object/null/内部トークン)/D5大域90秒+step上限。失敗時artifacts(スクショ/操作列/状態/console/再現コマンド1行)。

検算(Fable独立実行): **決定論成立**=同一シード2走で319操作・digest 09f442518091ed7a・操作ログ完全一致(227s/183s)/1季完走・検出0件/サンドボックス4検出器PASS(main上でも再確認)/src/変更ゼロ/`page.evaluate`はG読み取りのみ/サーバはポート0+パストラバーサル防御/一時コンテキストでKeisukeの実ブラウザ非干渉/run-all.jsは`test/*-test.js`直下のみ収集=npm test非干渉。開発中D2_FREEZEアーティファクト群は全て「driverが押し方を知らなかった画面」(大型イベント選手カード/PPVエントリー/年間表彰式→特別対応済み)でゲーム本体のバグ検出はゼロ。

**週次オートメーション刷新**: Codexの `weekly-bug-audit`(月曜10時・ACTIVE)のプロンプトを新フルスイートへ書き換え——main取り込み→依存確認→npm test→auto-sim 40季(日付シード)→**UI走破1季**→bug:audit:full、修正禁止(検出と報告のみ)。effort low→medium。重複していた旧 `weekly-bug-check`(4月作成heartbeat)はPAUSED化を試行→**Keisuke実機確認で「停止になっていない」**。追調査(TOML再読+内部sqlite読み取り)で確定: **オートメーションの実体はローカル `~/.codex/automations/*.toml` ではなくアプリ/クラウド側**(少なくともheartbeat型はローカル編集が無効)。weekly-bug-checkの停止と、weekly-bug-auditの新プロンプト反映確認は**Codexアプリ画面での操作をKeisukeに依頼**(新プロンプト全文はworklogではなくチャットで手渡し済み+`scratchpad`不要のためこの節の手順(0)〜(5)が正)。CLAUDE.mdの自動検証システム節に「UI層の検証」小節を追記(フライトレコーダー/走破ハーネス/週次スイートの入口)。

残: ③レア画面強制点火カタログ(②のdriver/detectors流用・別タスク)/Mモード・D4不可視検出(後続)/specs化は設計書v0.1+READMEが正のため不要と判断(dev基盤のため)。manifest変更なし(配布物に含まれない)。npm testの既存3失敗(task-91陳腐化疑い)は未解消のまま=別対応。

## 遠征試合モックv0.2: 一次レビュー3点反映（2026-08-13・Fable・二次レビュー待ち）

Keisuke一次レビュー(①オレンジは中途半端で赤系がいい ②パラメータの並びがかっこよくない・既存の何かを参考に ③結果は相手の勝者が大きく映って挑発するのをメインに→その後単独の悔しさ)を反映し `docs/ui/mockups/away-challenge-v0.2.html` を作成。

- **進行画面**: 団体色連動(v0.1)を廃止し**黒×火の赤固定**(果たし状/開戦画面と同じ敵対の言語)。パラメータは中央対比行(独自発明)をやめ、**既存fc1m(派閥1対1比較)の「各選手の下に5項目帯・優位値のみ点灯(自=金/敵=赤)」**へ。中央はVS+宿命/友好チップのみ
- **結果画面**: クリーム報告1枚→**2拍のシーケンス**へ再設計。B1=敗北時は**相手の勝った代表がXL(172×258)で挑発**(スコア帯「団体として敗北」+明細3行同居)/B2=「—その夜—」で**直訴した代表の悔しさを単独で**(2軸マトリクス象限別・本人が勝っていれば軽いグレーに留める)。コーチ要約はモーダルから週次レポート1行へ移す方針(モーダル連発回避)。勝利時は鏡像(要判断)
- ブラウザ実測: 画像6/6・4ビュー切替・B1主役172×258・進行S108×162・--fire #c93b30

残: **Keisuke二次レビュー(判断点3: 勝利時の鏡像の深さ/明細の置き場/5項目帯の生値継続)**→承認後にセリフ起案(挑発+悔しさ2象限+捨て台詞×口調7種、Opus)→実装。v0.1は記録として残置。
## 遠征試合2画面のリデザイン設計+モックv0.1 / 紫線修正 / 挑戦フロー2バグをチップ起票（2026-08-13・Fable・レビュー待ち）

実機フィードバック続き4件。①**相手エース一言カードの「変な紫線」**= `.pb-ace-area` の左端団体色帯(border-left: --pb-enemy-color)。紫系団体で不評のため削除(団体色はバッジが担う)→コミット13189d1 ②**同一週に受け挑戦と遠征が同時発生し同一選手が複数試合**+③**対抗戦観戦の「中断」後に試合が未消化に見える**の2件は、既存排他(hasCompetingBookingは1興行内のみ=週内の別コンテナ間に穴)と escapeBattle の対抗戦分岐(warSkipMatchで結果は埋めるはず)まで調査した結果を添えて**修正タスクをチップ起票**(不変条件I-1〜I-3対) ④**遠征試合の進行/結果画面リデザイン** — 設計+`docs/ui/mockups/away-challenge-v0.1.html`(3ビュー・相手団体カラー3種切替)。

設計の骨子: 進行画面=茶オレンジ廃止→**敵地黒+相手団体カラー照明**、左右バー10本全廃→**中央の5ステ対比行**(優位側だけ点灯: 自=金/敵=団体色)、OVRは階調カラー。結果画面=**2軸の分離** — 団体の勝敗はヘッダー+スコア帯(「団体として敗北」明記)が背負い、代表の○×・グレースケール・ラベル・セリフは**本人の試合結果**基準に(現行は全部が団体勝敗で決まり「勝った代表が敗者の言葉を言う」「代表戦で負けた相手が勝ち名乗り」の不整合=Keisuke指摘の原因。`_challengeRequestResultReaction` が scene を playerWon だけで選んでいる)。新規セリフは2象限×口調7種×自他2視点(Opus工程)。ブラウザ実測: 画像7/7・ビュー3切替・色3切替・結果M132×194/進行S108×162/敗者グレースケール値を確認。**残: Keisukeレビュー(判断点: 生値表示の踏襲可否/配色/2軸マトリクス)→承認後にセリフ起案と実装**。

## F07派閥相談モーダルの肖像を梯子サイズへ(顔出し監査の取りこぼし)（2026-08-13・Fable）

実機報告: 内部格付け争い(F07)モーダルの画像サイズが「縦長統一」から外れている。調査の結果、08-12の顔出し監査20件に漏れていた直書きサイズが残っていた: 中央リーダー `.fevt-subject-portrait-wrap` 120×140(1:1.17)→**梯子M 132×194**、脇メンバー `.fevt-follower-portrait` 64×76(ほぼ正方形)→**梯子chip 46×66**(index.html)。JS側インラインの `center 20%` クロップも `center top` へ(2:3枠×2:3素材で欠けゼロ、ui-common.js)。F07全種(相談/観察/インシデント)の共通モーダルに効く。ブラウザ実測: computed 132×194 / 46×66 / pos 50% 0% を確認。

## ポップアップ直列化監査+修正 — 素通り経路4種を既存ゲートへ寄せる（2026-08-13・Fable）

Keisuke実機報告「興行後、王座防衛モーダル(mdl-a)の前に怪我ポップと『試合がうまくいかなかった』系が**同時に重なって**出た」の監査タスク(同日チップ起票分)。興行後(closeShowResult)・週頭(processWeek)・PPV後(closePPVResult)の**ポップアップ開き手を全数調査**し、ゲートを素通りする経路4種を特定、新しい仕組みは発明せず既存ゲート(`_enqueuePopup`/`_isPopupActive`/`_chainEventPopupQueueEmpty`)へ寄せた。

**数え上げの結論**(開き手→ゲートの対応表):
- **ゲート済みで健全(変更なし)**: showEventPopup系C3(mdlC・_eventPopupQueueで相互直列+_enqueuePopup)/showPostMatchDialogues・Glimpse(notifModal・_enqueuePopup)/showNotifEventToast・showR3Modal・showBigNewsPopup(mdlD・自前_isPopupActive)/showChoiceEventModal・showLargeEventModal・showChallengeRequestModal・派閥F01〜F03/F08/F09/Common3/遷移・統一王座4種・showHostileArrivalStage(自前_isPopupActive)/showRetirementPopups・showGrowthEventPopups・showRivalryPopups・renderTenchosenPreEvent・checkUnifiedTitlePresentation(_enqueuePopup)/CR結果モーダル(自前+ignoreShowResultOverlay)。週頭の「件数×100+700」型タイマー群は遅延こそキュー非連動だが、開き手側が全員ゲート持ちで実害なし
- **素通り4種(修正)**:
  1. **fevt系30箇所の'active'付与が20ms遅延** — `setTimeout(→classList.add('active'), 20)`のため、ゲート通過〜付与の20ms間 _isPopupActive がそのモーダルを「不在」と誤答し、同時期の別開き手が素通り→重なる(check-then-showレースの実体・容疑1)。→ `_activatePopupOverlaySync()`(offsetWidth強制リフロー+同期付与。_mdlB/COpenと同じイディオムでトランジション維持)へ30箇所一括置換
  2. **popupActionsチェーン(王座式典→引退→成長→因縁決着)** — (a)hasEventPopupsなし時の盲目`setTimeout(200)`開始 (b)`_chainEventPopupQueueEmpty`のcb発火(閉じ待ち200ms)がキュー積み直しを再検証しない (c)showTitleMatchCeremonyが無ゲートでmdl-aを開く(容疑3)。→ (a)常時`_chainEventPopupQueueEmpty`経由(空でも200ms再検証後に発火=旧実効タイミングと同じ) (b)cb発火を`_chainEventPopupQueueEmpty(cb)`再入で再検証 (c)入口に共有ゲート追加(F09と同型・ignoreShowResultOverlay・typeof検査でテストサンドボックス互換)
  3. **キュー非連動の再入** — closeMatchDialogue/closeNotifModalの次件描画が200ms後に直接発火し、隙間に開いた他モーダルの上へ重なる。→ closeEventPopupと同型の`_enqueuePopup`経由へ
  4. **同期ドレインが同tickのdismissAllPopupsに破棄される(監査の副産物・「書いてあるのに出ていない」型)** — closeShowResult/processWeekは同期のまま`advanceFromWeekSummary`→`dismissAllPopups`(closePPVResultは`advanceWeek`→同)まで進むため、同期で開いた**因縁マッチコメント・関係性フラグモーダル(C3キュー)は表示前に消えていた**(コード読解で確定。fevt系の派閥通知はfactionEventRootが全消去対象外のため生存していたが、別モーダル表示中に退避された分は同様に消失)。→ 4箇所(closeShowResultの因縁コメント+ドレイン3種/processWeekのドレイン4種/closePPVResultの因縁コメント)を`setTimeout(0)`遅延にし、全消去の後に開かせて共有ゲートで直列化。Engine.advanceWeekは`{...state}`スプレッドで`_pending*`を保持するため遅延後の消費でも取りこぼさない(検算済み)

**デッドロック対策(§5-D)**: ユーザー操作を堰き止めるガードは一切追加していない(78f1445型の回避)。新しい待ちはすべて「閉じ手が_drainPopupQueue/再検証ループを回す」既存機構上で、`_chainEventPopupQueueEmpty`は空なら200ms後に必ず発火・dismissAllPopupsの待機cb即時発火保険も従来どおり。

触ったファイル: src/ui-common.js(ヘルパー新設+30箇所置換+ゲート3件)/src/app.js(チェーン開始+遅延化4箇所)/test/title-defense-scale-test.js(新セクション12: 表示中は退避→ドレイン後に開く)/test/faction-f03-modal-flow-test.js・test/ch1-challenge-flow-test.js(サンドボックスへ実物ヘルパー注入)。

検証: node --check 2本/u4-modal-frame-safety-net-test 43 ok/title-defense-scale-test 12 PASS/faction-f03・ch1 ok/npm test=既存破損3本(feedback-fixes・regular-show-pregame-design・wear-ceiling-decay。stashで変更前から失敗と切り分け済み・task-91系の並行セッション管轄)以外全通過。auto-simはUI層のみの変更につき対象外。specs更新なし(バグ修正・既存仕様の回復)・manifest変更なし(新規ファイルなし)。実機確認はバックログ「ポップアップ直列化」へ追記。

残課題: フラグモーダル・因縁コメントが**興行後に出るようになる**(これまで沈黙破棄)ため、頻度・くどさはKeisukeの実機裁定待ち。08-13の「関係性通知全廃」裁定はGlimpse系が対象で、relationship-flags-spec §4のフラグモーダルは確定仕様として復活が正——ただし観て不要と判断されたらチャンネル再設計で応える。

## task-93マージ: フライトレコーダー(バグ捜索①)（2026-08-13・Fable+Codex）

**task-93をマージ**(c532b95)。Codexがworktree wm-codex-task93で実装(+1174行、4ファイル)→サンドボックスが `.git/worktrees/` に書けずコミット不能(BLOCKED報告)→Fableがdiff全文レビュー・検算・ブラウザ実測(Codex環境で不可だった§5-3)・2粒度コミット代行→mainへ。worktree/ブランチは削除済み。

実装: `src/flight-recorder.js` 新設(index.html先頭スクリプト・manifest sourceFiles追加)。onerror/unhandledrejection/console.error/`[WM Debug]`warn捕捉30件リング+クリックトレース100件リング+境界マーカー(`wm_flight`≤150KB・リロード跨ぎ永続化)+エラー時のみ⚠バッジ遅延生成+報告バンドルv1(openLayers/autosave同梱/context復元)。ガードテストはstub環境の振る舞い検査で上出来(Math.random禁止トラップ・capture-phase検証・確定文言固定まで)。

検算(Fable独立実施): guard test単独実行OK/`WM_LZ|`マーカーとslice(6)・旧`WM_LZ\x00`両対応が実コード(app.js:1891,2018)と一致/serialize形状=Gクローン直列化でseason/weekトップレベル一致。**ブラウザ実測**: クリーンロードでDOM無追加(I-3)/エラー注入→バッジ(左下8px・24px・z99999・**トークン実値解決を確認**=--bg-dark #24221e)→パネル文言一字一句/バンドル(クリック相対t・muteBtn記録・openLayers=div.app+titleScreen)/リロード跨ぎ(session1→2・クリックとエラー残存・起動時バッジ再表示)/**data.js先頭throw→`data.js:1`で捕捉**(読み込み順I-6の実証・連鎖5件収集)。

**npm test 230/233 — 失敗3本(feedback-fixes/regular-show-pregame-design/wear-ceiling-decay)はmainでも同一失敗の既存破損でtask-93非起因**(能力バー150目盛り期待など=task-91枠越えバー改修後の陳腐化の疑い。並行セッションの領分のため触らず報告のみ)。specs昇格済み: `specs/flight-recorder-spec-v1.0.md`+INDEX追記。実機確認はバックログへ追記。

## task-92マージ+specs昇格: 全国統一王座シリーズ全完了（2026-08-13・Fable+Codex）

**task-92(P4記録・表彰・殿堂・MVP)をマージ**(5aba026)し、**`specs/unified-title-spec-v1.0.md` へ昇格**(INDEX追記済み)。統一王座はP1〜P4完結。

P4実装: ①careerRecordに奪取(captured)/防衛(defense)イベント(天頂戦戴冠はwonのまま分離) ②殿堂pt=1勝2pt対称・won+0(calcHofPointsとbuildCareerHighlightsを共通ヘルパーで対に) ③MVPレース=UNIFIED_DEFENSE 20/CAPTURE 20/HOLD_AT_END 12(既存キー無変更・breakdownは条件付き展開で旧shape維持) ④年間表彰「全国統一王者」スライド(非天頂戦年のみ・空位年なし・オーロラ帯)+表彰式全体にfinishCeremony一回化+10分時限保険 ⑤📜記録タブ「全国統一王座」セクション(政権復元は不成立年の返還仮置きまで処理・最多防衛/最長在位・未創設は非表示) ⑥シーズンチップ🌐3種。

検算(Fable): worktreeでnpm test 231/231・I-3=3季auto-simが現mainと完全一致・diff全文レビュー。**I-6較正判定: 両条項とも未発動**(殿堂★分布 23/32/45→16/36/50=★★★+11%で2倍条項外/年間MVP中の統一王者比率38%→56%で9割条項外。導入前値はWM_SOURCE_REF=HEADの外付け計測器・baseline指紋一致確認済み)。**レビューで発見したP3の代数バグをmainで修正**(3e0c539): 戴冠式の「第N代」がcreation/crown/repeatしか数えず奪取(move)の政権交代を落としていた→記録タブ・実績リストと同じ定義(move含む)へ統一。

併せて同日の実機フィードバック3点は cff0929 で対応済み(戴冠ファンファーレRS04/決勝の決着後カードを敗者のみへ/優勝画面→戴冠式→コーチ総括の順へ)。実機確認はバックログ§全国統一王座にP4項目5点を追記。**残: Keisuke実機確認とベルト画像のみ。次工程=コーチ世代交代サイクルの設計**(既存35名の分布実測から)。※main側でnpm test 4本(feedback-fixes/wear-ceiling-decay/regular-show-pregame-design ほか)が並行セッションのマージ由来で失敗中 — 統一王座系とは無関係(stash切り分け済み・当該セッションの管轄)。

## R3リアクションの顔画像修正+ポップアップ重なりの監査タスク起票（2026-08-13・Fable）

実機報告2件の続き。①**R3モーダル(仲間の引退/退団リアクション)の縦枠に顔アイコンが引き伸ばされて入っていた** — 呼び出し元(app.js 2箇所)が getPortraitUrl を渡していたため。showR3Modal に fighterId を追加し getUpperUrl のアッパー画像優先へ(取れないときのみ旧fighterFace)。②**種類の違うポップアップが同時に重なる件**(怪我+試合下振れ+王座防衛) — 主要経路(_eventPopupQueue/_enqueuePopup/_chainEventPopupQueueEmpty/popupActionsチェーン)は調査の結果ゲート済みで、残る容疑は (a)_enqueuePopup の check-then-show レース (b)週頭経路のキュー非連動 setTimeout遅延 (c)チェーン外ドレイン3種のゲート未確認 に絞り込んだ。**盲目パッチは78f1445型のフリーズ事故を生むため、調査結果一式を持たせた監査タスクをチップ起票**(全発火経路の数え上げ→既存ゲートへの寄せ、タイムアウト保険必須)。

## バグ捜索①②: Keisuke全承認→task-93/94へ改番・指示書完成・Codex並行投入（2026-08-13・Fable）

「全部推奨通りで進めてくれ」の裁定。①配布物に含める(sourceFiles)・可視文言確定 ②Playwright導入OK・初期スコープ=Wモード1季・分担=骨格Codex/検出器調整Fable、すべて確定。

**改番**: フライトレコーダーはtask-92→**task-93**へ(並行セッションの統一王座P4がtask-92と専用worktree `wm-codex-task92` を先に取得していたため。git mvで改名し依存欄を92/94並行可に更新)。**task-94(ハーネス骨格)指示書を新規作成**: スコープ=静的サーバ+Wモードdriver+検出器D1/D2/D3/D5+アーティファクト+fixture(Mモード・D4は後続)。不変条件I-1〜I-6の核: **src/変更ゼロ**(git diffで検証)/進行は実UIクリックのみ(evaluateでのG書き換え・App直接呼び出しによる進行禁止)/検出器はサンドボックスページ(既知バグ3種入り)でテスト固定/同一シード2回実行で操作列diff空/15分タイムアウト+プロセス残留禁止/`*-test.js`命名回避でnpm test非干渉。ゲーム側の真バグを検出した場合は修正せず報告(検出が成果物)。

投入: worktree `wm-codex-task93` / `wm-codex-task94` を作成しCodexを並行起動(触るファイル交差なし)。マージ時にFableがdiff全文レビュー+不変条件検算。

備考: mainの作業ツリーに並行セッションの未コミットsrc変更(management/ui-common/ui-render)が存在するため、本コミットはdocsのみを明示addで封じ込め。

## 興行後の関係性通知を全廃 — 「世界の側」チャンネルへ置き換え（2026-08-13・Fable+Keisuke裁定）

同日先行分(実機フィードバック7件バッチの2項)の「Tier1縮小+カード小型化」はKeisukeに差し戻し——「小さくすればいいってもんじゃない。試合後に羅列するのをやめて、設計思想(さりげなく垣間見える)から考え直す」。再設計して以下を実装:

- **モーダル全廃**: `_isGlimpseTier1` を常に false 化(ui-common.js)。gold(宿命のライバル/深い絆)・danger(退団の噂)級も含め、興行後のカスケード/単発モーダルは一切出ない。全Glimpseが weekLogFeed(Tier2)へ
- **受け皿(新UIなし・全部既存チャンネル)**: ①道場バナー「休憩中の選手」— gold/danger級はその週の**確定枠**(通常18%抽選のまま。見に来なければ流れる=覗き見の距離感を維持。ui-render.js rest picker) ②週次ティッカー/新聞3面・因縁列伝/相関図 — 既存のまま(因縁列伝は featured 選定が rivalry×0.4+ドラマタグで高rivalryペアを自然に上位に置くため追加ボーナス不要と判断) ③**退団の噂(danger)のみ週次レポートに1行**「💬 {name}が退団を考えているという噂がある」(management.js tickWeek・Keisuke選択「週次レポートに1行」)
- 旧表示経路(showGlimpseCascade/.gc-* CSS/#glimpseCascadeOverlay)は不達のまま残置。撤去は安全網テスト追随が要るため別途クリーンアップ
- specs/glimpse-cascade-spec を **v2.0(廃止)** に改訂(置き換え先の表を§0に記録)。実機確認バックログの該当項目を書き換え

検証: node --check(3ファイル)/ブラウザ実測(_isGlimpseTier1 が gold でも false)/auto-simはターン末フック。

## バグ捜索②: UI自動走破ハーネス設計v0.1（2026-08-13・Fable・判断点3件レビュー待ち）

②の設計書 `docs/ui-walkthrough-harness-design-v0.1.md` を作成。**核心の発見: 「`G`はapp.jsクロージャ内でアクセス不可」は誤認だった**。実体は `let G` がapp.js:3797の**トップレベル宣言**(グローバル・レキシカル)で、アクセスできなかったのはプレビューツールのevalが拡張の隔離ワールドで走るため。Playwrightの `page.evaluate` はメインワールド実行なので G/App/Engine/Storage を直接読める→**製品コードを1文字も変えずにハーネスを作れる**(テスト用フック新設は不要と判明)。メモリの誤情報も訂正済み。

設計骨子: Playwright(devDependency)+使い捨てローカルhttpサーバ(file://はbattle-engine.html iframeの同一オリジン制約で不安定)。Wモード(fixture セーブから実UIで1〜2季走破・主ボタン方針)/Mモード(シード付きモンキー・破壊操作遮断リスト)。検出器5種: D1例外(pageerror+console)/D2スタック(クリック後5秒でDOM変異・G変化・オーバーレイ変化のいずれも無し→全ボタン一巡再試行→FREEZE判定。閉じる手段のないオーバーレイも同判定)/D3可視テキスト(undefined・NaN・内部変数名)/D4不可視(遷移差分要素の実効面積0・親overflowクリップ=「書いてあるのに出ていない」検出器)/D5進行ウォッチドッグ。page.clockで演出待ち圧縮。npm test・編集毎フックには入れない(実行時間が桁違い)。③レア画面カタログはこの driver/detectors を流用する共通基盤設計。

残: **Keisuke判断点3件**(①Playwright導入可否=Chromiumダウンロード数百MB ②初期スコープ=Wモード1季推奨 ③実装分担=骨格Codex task-93+検出器調整Fable推奨)→裁定後にtask-93指示書。specs更新なし(設計段階)・manifest変更なし。

## バグ徹底捜索体制の設計+task-92フライトレコーダー指示書（2026-08-13・Fable）

Keisukeの問題提起「少し触るだけで深刻なバグが出る。徹底的に探す仕組みが要る」を受けた体制設計。**診断**: エンジン層(auto-sim+validateGameState+132本テスト)は厚いが、**UI・進行層 約26,000行(app.js/ui-common/ui-render/index.html=コードの過半)は自動検証ゼロ**(フックの構文チェック対象ですらない)。実プレイで踏むバグ——交渉フリーズ・「書いてあるのに出ていない」・想定外ボタン経路——は全部この層。さらに `window.onerror`/`unhandledrejection` の捕捉が皆無で、プレイ中の例外はF12を開かない限り消える。

**4本柱を提案しKeisuke承認(優先順どおり着手の裁定)**: ①フライトレコーダー(ゲーム内エラー捕捉+操作トレース+ワンクリック報告書き出し) ②Playwright自動走破ハーネス(実ブラウザで実クリック。進行停止・モーダルデッドロック・可視undefined/NaN・0サイズ要素の検出。前提としてテスト時のみGを読めるフック新設) ③レア画面強制点火カタログ(天頂戦/果たし状/開戦/統一王座を合成データで一括表示検査) ④回帰の規律(挙動検査型ガードテスト徹底=既存方針の継続)。

**今回の「深刻なバグ」の正体を特定**: 契約交渉フリーズ=当日の実機FB 7件バッチ項目1で**修正済み**(78f1445の多重クリックガードが残置の旧ガード `if (this.disabled) return;` と衝突し全選択肢が無反応。08-07以降の契約系交渉が全滅していた)。重要な教訓: **このバグは例外を投げない**(早期returnのみ)→①のエラー捕捉では捕まらないクラス。①に操作トレースのlocalStorage永続化(リロード越しに残す)を仕様として織り込み、検出自体は②の担当と整理。

**成果物**: `docs/codex-tasks/task-92-flight-recorder.md`(指示書=仕様の正。§7に仕様本文: onerror/unhandledrejection/console.error+`[WM Debug]`warnの捕捉30件リング・クリックトレース100件リング+境界マーカー・`wm_flight`≤150KB・エラー時のみ⚠バッジ遅延生成・報告バンドルv1にopenLayers/autosave生文字列同梱・可視文言確定)。不変条件I-1〜I-6(核: エラー握りつぶし禁止/セーブキー書き込み禁止/エラーゼロならDOM無追加/乱数不消費/読み込み順先頭で後続の読み込み時エラーも捕捉)。**配布物に含める判断(sourceFiles)**——顧客の実プレイも報告源になるため。demote判断はKeisukeに委ねる(レビュー時に要確認)。roadmap「開発・検証基盤」に体制全体の1行を追加。

残: task-92のCodex投入(worktree wm-codex-task92)→マージ後にspec昇格 / ②のハーネス設計(次工程) / 実機確認: 交渉フリーズ修正の再確認はバックログ既載。specs更新なし(実装前のためN/A)・manifest変更なし(実装時にCodexが更新)。

## task-91マージ: 数値表記の本編DB逆輸入完了——選手ファイル案件は実装全完了（2026-08-13・Fable+Codex）

**task-91をマージ**(abd5cbf)。Codexが専用worktree wm-codex-task91で実装(+177/-28、3ファイル)→Fableがdiff全文レビュー・不変条件I-1〜I-6の独立検算→3粒度コミット代行→mainへ。worktreeは撤去(ブランチ保持)。

実装: ①**DB全選手一覧**のOVR+ステ5列を共通7帯階調へ(`_statCell`をkindシグネチャに変更=呼び出しはDB一覧の1箇所のみ確認済み。OVRの`_scale6Style`常時glow(85+)を廃止し輝き=100超のみ) ②**選手詳細・能力タブ**の0-150バーを枠越え圧縮バーへ(`_fighterPopupStatBarsHtml`が共通部品`statOverBarHtml`をラップ。消耗▼=`statDecayView`のlostPtsをゴースト+▼n表記に移植、季節成長+nも維持——旧実装は+nか▼nの片方しか出なかったが新実装は両方出る) ③レーダー軸ラベルを`_STAT_TIER_PURE`の系統色へ(値・0-100クランプ・塗り(styleカラー)・グリッドは不変)。

**発見**: 旧DB一覧の`_statCell`呼び出しはSP=青/TE=緑を渡しており`_STAT_COLORS`定義(SP緑/TE青)と逆——**ゲーム内に二重定義が潜んでいた**。今回stat-notation正(SP=#2ecc71緑/TE=#3498db青)へ全画面統一。

検算(Fable独立実施): `_statCell`呼び出し全数=1(シグネチャ変更の波及なし)/対象外画面の`_ovrColor`/`_scale6Style`/`_popColor`件数が前後一致(減少は置換対象のDB一覧OVRセル1件ずつのみ)/テストは境界値キャラでDB一覧をVM実描画して帯・glow・列数12を検査、対象外呼び出し件数を6/19/9件に固定、レーダー不変・バー非発光も固定。auto-sim 20季 ALL CLEAR(fingerprint d057b96f、Codex実行・出力全文確認)。

**これで選手ファイル案件(起票〜デザイン7ラウンド〜実装2タスク)は同日完了**。残: Keisuke実機確認——①ゲーム内DB一覧の階調(SP/TE色が入れ替わって見える点は正への統一)②選手詳細の枠越えバー(100超選手・消耗▼持ち・+n持ち)③レーダー軸色。実機確認バックログへ。

## task-90マージ: タイトル画面「選手ファイル」+配色案2+共通数値表記ヘルパー（2026-08-13・Fable+Codex）

**task-90をマージ**(cd746da)。Codexが専用worktree wm-codex-task90で実装(+663/-5、4ファイル)→Fableがdiff全文レビュー・不変条件I-1〜I-6の独立検算→3粒度コミット代行(ヘルパー/配色+DOM/本体+テスト)→mainへ。

実装: ①`statTierStyle`/`barDispOver`/`statOverBarHtml`をui-commonへ新設(stat-notation v1.0。7帯・glow=数値の100超のみ・枠越え圧縮バー・バー非発光・▼n/+n対応) ②タイトル配色を案2「会場の夜」へ(`.title-screen`ローカルトークン`--title-bg:#161b21`/`--title-glow`で上書き。**全画面共通の`--bg-dark`は不変**。マーキー彩度0.4→0.55)+Credits横に「Fighter File」リンク ③選手ファイル本体(z200オーバーレイ・確定文言の機密注記・スタイル絞り込み+名前検索+thクリックソート・詳細モーダル=upper172×258+色軸レーダー+枠越えバー+特性+紹介文)。静的カタログはホワイトリスト14キーのみで構築、`G`・乱数に非接触。

検算(Fable独立実施): barDispOver 4点一致(110→103.6/130→110.8/150→118/200→118頭打ち)/機密注記3行の一字一句/`--bg-dark`定義不変/新設トークン`--stat-*`・`--border-strong`の:root追加確認/**SVGプレゼンテーション属性のvar()が実環境で解決されることをブラウザ実測で確認**(fill/stroke/font-family——修正不要と判定)。ガードテストは番兵方式でpot/trainCap漏れを全127名×一覧+詳細の生成HTMLに対して検査する本物(Codexテストとしては上出来)。auto-sim不要(エンジン非接触)。実機確認はバックログへ: タイトル配色の見え方/Fighter Fileリンク→一覧→詳細の通し/検索・ソート/ESC・背景クリック閉じ。

**続けてtask-91(DB逆輸入)をCodexへ投入済み**(worktree wm-codex-task91。task-90ヘルパー依存が解けたため)。

**実機バグ2件を即日修正(e266327・Fable直接)**: ①詳細画面で画像フォールバックが常時表示され写真列が縦に溢れて特性/紹介に被さる——`hidden`属性がフォールバックの`display:flex`に負けていた。`.fighter-file-overlay [hidden]{display:none!important}`で解消(一覧の顔40pxも同根) ②能力値ソートで数字列が横ずれ——ソート矢印の付け外しで列幅が動いていた。数値列に固定幅(OVR50/ステ40/身長56/スタイル90px、ゲーム内DBと同作法)。ガードテストに両方の再発防止アサーションを追加。

## 選手ファイル+DB逆輸入: デザイン全面確定→仕様書2本+Codex指示書2本（2026-08-13・Fable）

Keisukeの**「完璧」裁定でデザイン全面確定**(選手ファイルv0.7+逆輸入v0.1+バーglow廃止まで)。確定内容を仕様化し実装工程を準備した。

**新規ドキュメント4本**: ①`docs/ui/stat-notation-v1.0.md` — 数値表記の共通言語(階調7帯/枠越え圧縮バー/レーダー軸色/glow=数値の100超のみ・バー非発光/適用3画面と非適用の線引き/共通ヘルパー方針)。7ラウンドの裁定の集約で、以後この画面群の塗りはこのファイルが唯一の正 ②`docs/ui/03-screens/fighter-file.md` — 選手ファイル画面仕様書(静的データ前提・確定文言・タイトル配色案2の変更内容込み) ③`docs/codex-tasks/task-90-fighter-file.md` — 選手ファイル新設+タイトル配色+共通ヘルパー新設(不変条件I-1〜I-6: G不干渉・乱数消費ゼロ/pot非露出のホワイトリスト/注記一字一句/1クリック1描画/共通変数の書き換え禁止/ヘルパー検算値) ④`docs/codex-tasks/task-91-db-stat-notation-backport.md` — DB一覧+選手詳細への逆輸入(task-90のヘルパーに依存・後行。不変条件I-1〜I-6: 表示のみ/対象外画面のglow件数不変/バー非発光/▼n・+n情報維持/レーダー値不変/diff封じ込め)。

投入順: **task-90→(マージ後)task-91**。専用worktree方式(wm-codex-task90/91、task-86〜88と同型)。残: Keisukeの仕様書diff確認(このコミット)→Codex投入。specs/は該当なし(UI仕様はdocs/ui/配下が正)、manifest該当なし(新規配布ファイルを作らない設計)。

## task-89マージ: 統一王座P3(演出4画面+セリフ焼き込み+オーロラ化)（2026-08-13・Fable+Codex）

**task-89をマージ**(0c43162)。Codexがworktree wm-codex-task89で実装(+1008/-38、10ファイル)→Fableがdiff全文レビュー・レビュー修正2点・独立検算→3粒度コミット代行→mainへ。

実装: ①`--unified`系オーロラトークン新設(index.html :root)+仮ティール全置換(色は全てトークン参照へ) ②承認セリフ147本(v0.1a)を`UNIFIED_TITLE_LINES`へ一字一句焼き込み+`EVENT_LINES_BY_KEY`7キー登録(ブック往復対応)+選択はderiveローカル ③戴冠セレモニー案B(finalizeTenchosen接続・AI優勝年も表示・ceremonyKeyで1回保証・30秒保険) ④返還式(W47・自団体王者のみ・在位/防衛/保持者数はhistory実データ) ⑤挑戦到着=showHostileArrivalStageの`variant:'unifiedTitle'`(静か版・受けて立つ1択・既存果たし状はスコープ外クラスで無影響) ⑥こちらの番Office化(相手王者upper M+候補face52pxチップ+見送り) ⑦統一王座戦の結果画面に専用セリフ差し込み(防衛/喪失/奪取/挑戦失敗・勝者/敗者の向き分岐)。

**レビュー修正2点(Fable)**: (a)到着通知フラグ(表示用)がUI側でしかクリアされず、UIの無いauto-simで残留→シード次第でI-1が破れる潜在 — エンジン側の予約消費/失効に`_clearArrivalNotification`を連動 (b)「こちらの番」モーダルの60秒タイムアウトが`finish(null)`=見送り消費になっており、放置しただけで9か月に一度の挑戦権が消える — `'defer'`で閉じて通知を復元し翌週再提示へ(保険は進行を塞がないためのもので、選択の代行はしない)。

検算(Fable独立実行): npm test **230/230**(セリフ突き合わせ/演出進行保険テスト含む)/**I-1成立**=`auto-sim 20 42`がmain(並行セッションの実機フィードバック反映後)とworktree(修正込み)で**全行一致・指紋8b9e2121**/仮ティールgrep 0件/I-5=果たし状への変更はバリアントclass+opt-in保険のみ(既定挙動不変)。ui-check7項目はCodex申告○+Fable diff読みで確認。実機確認はバックログ§全国統一王座にP3項目を追記。**残: P4(表彰・殿堂)/specs昇格(P4後にunified-title-spec v1.0)/ベルト画像(Keisuke制作)**。

## セリフ検品の指摘を修正: 違反6本差し替え+「わたし」→「私」13箇所+取り残し3箇所（2026-08-13・Fable・文言レビュー待ち）

検品報告へのKeisuke裁定「①②③全部直せ。不揃いも含めて」を受けて実施。全24箇所、宣言テーブル内のみ(push実行文は対象外・後述)。

1. **①違反セルの差し替え6本**(新規執筆・口調シートのアンカー準拠): GL-01のpolite.bold 4行(win「ふぅ……勝ちました！ 実力、見せられたかな？」/loss「……悔しいです。この負けは、次で必ず取り返します！」/goodLoss「負けました……でも、全力は出し切れたかな。次は勝ちます！」/greatWin「見ていただけましたか？ これが私の、全力です！」=大久保アンカーの全力・誇り・見下しなし)+loss.seductive.earnest「……敗因は、分かっているの。次は、同じようにはいかないわ」(新見アンカーの観察と分析)+GL-02-hostile.polite.normalの重複コピー解消「私情は持ち込まないと、決めているんです。……難しいですね」
2. **②ひらがな一人称13箇所を漢字「私」へ**(裁定53: ひらがなはshy帯のみ): CONTRACT_NEGOTIATION(polite.emotional×2/seductive×2)、RETIREMENT・POACH・CHOICE_EVENTのpolite.emotional×4、CARE_REACTION polite._default、GLIMPSE_A trust_below_20.seductive.emotional、FLAG_DIALOGUE seductive×2、F08_PRE_MATCH_LINES_B(delinquent)「私んとこ」。**shyセルの「わたし」116行は仕様通りなので不変**
3. **③取り残し3箇所**: F07 composed.bold 2セルをタメ口化(「…わかった。私からメンバーに話しておくよ。」「…そこまで見てくれてるんだ。下の子のこと、助かるよ。」=6295662の同型改訂と同じ骨格)+GL-02-hostile.standard.normal「見てろよ」→「見返してやる」+FLAG_DIALOGUE cool「……すまない。」→「……ごめん。」
4. **③のGlimpse常体7セルは直していない(重要)**: 規範の口調シート「鷹揚×真面目」のアンカー(馬入橋)が常体(「まだまだ成長途中。もっと強くなってみせる！」)であり、GLIMPSE_A/Bとも既にシート通り=**両者は揃っていた**。不揃いの実体はspec§4の要約1行だったため、specの鷹揚行を「対社長の改まった場面のみearnestがです・ます」へ明確化(specs/dialogue-tone-spec-v1.0.md、diff要Keisuke確認)
5. **新発見(未対応・要判断)**: `NOTIF_DIALOGUES['N2'].easygoing.polite.push(...)` 型の**push実行文セリフ群**(NOTIF/CARE_REACTION/CHOICE_EVENT/LARGE_EVENT/SNAPSHOT_TEXTS等)に「わたし」61行+半角!?が大量残存。GLIMPSE_B§5と同じ「ブラケット/push=ワークブック不可視」の第2の盲点で、口調全直しを一度も通っていない。規模が大きいため今回は触らず別タスク起票(チップ)

検証: node --check 3ファイル / glimpse-b-axis-guard PASS / **test 228/228 PASS** / 残存「わたし」の分布再計測(宣言テーブル=shyのみ116行・push実行文61行)。data-faction-dialogue.jsは混在改行のためEditツールが562行を巻き込む事故→復元しバイト精密置換で1行差分に修正済み。auto-simはターン末フック任せ。manifest変更なし。ブック再export+抽出MD再生成は**未実施**(文言レビュー後にまとめて実施)。

残: Keisukeの文言レビュー(差し替え6本+③3本は全文提示済み)/specs diff確認/push実行文クラスの検品タスク。

## セリフ検品: 文言化けの全数照合+GLIMPSE_B移植59セル検品（2026-08-13・Fable・修正はレビュー待ち）

「拳が握りしまる」(1f4222f修正済み)と同型の文言化けを機械検品した。**コードは一切変更していない**(指摘の修正はKeisukeレビュー後)。

**手法**: ①`tools/extract-dialogue.js` をworktreeで再実行→committed版カタログとgit diff→docs復元(同一生成ロジックなので \uXXXX デコード・キー順正規化は自動吸収、全20,540本照合) ②口調バイブル反映(6295662)のdiffから旧文言849本を抽出し、現行srcへの残存を全数走査(拳ケースの検出器として設計) ③GLIMPSE_B移植59セル(composed42+GL-02-hostile13+GL-01push分)へ口調spec鉄則の機械検査+目視 ④petition102本を承認草案と全数突き合わせ。

**結果**:
1. **doc↔src不一致ゼロ**。差分は4ファイルすべて意図的改稿と一致(petition100本置換=task-87 / 負傷セリフ1本+雰囲気テキスト15本=実機FB 7件バッチ / 新セリフ63本=task-86/87のEVENT_LINES_BY_KEY登録)
2. **化け残り(拳同型)は実質なし**。残存候補8件を精査→全て別人格セルの正当な文言か部分一致。ただし改訂漏れ疑い2件+迷い1件を列挙(flag-dialogue seductiveの「わたし」/F07 composed.boldの敬語/coolの「すまない」)
3. **GLIMPSE_B移植分に明確な違反5件**: GL-01の polite.bold 4行(data.js:26706/26818/26923/27026、「よっしゃ……!」「見ろよ!!これがわたしだ!!」等=旧セッションF push由来。半角!+ひらがな一人称+丁寧の口調完全不一致)+loss.seductive.earnest(26809「わたし、足りませんわね」)。**移植の軸変換自体は正しい**(旧`['win'].bold.polite`→新`polite.bold`)=4月の元執筆がpoliteスロットに非丁寧文言を書いていた。ほかGL-02-hostile.polite.normal(27199)がstandard.earnest(27176)と完全重複+常体、composed.earnest 7セルが常体(specは「earnestのみです・ます」)=裁定待ちとして列挙
4. **petition102本は草案と102/102一致**(「変更なし」2本含む)

**残**: 指摘セルの直しはKeisuke裁定後(違反5件は直し推奨、迷い項目は裁定のみ)。roadmap該当項目なし・specs変更なし(検品のみ)・manifest変更なし。
## 本編DB逆輸入モック v0.1: 階調・枠越えバー・レーダー軸色（2026-08-13・Fable・レビュー待ち）

選手ファイルv0.7の**Keisuke全項目承認**を受け、「詳細画面の五角形・能力値表記・一覧のグラデーションを本編データベースへ逆輸入したい」の指示で `docs/ui/mockups/db-gradient-backport-v0.1.html` を作成。**§1 DB全選手一覧**: 現行の塗り(ステ3段・OVR=_scale6 6段で85+常時glow)と逆輸入(案X7帯)を同一ダミーデータ10行で上下比較。**輝きは100超だけに限定する提案**(現行の85+常時glowは廃止——本編は100超が実在するので、輝きの稀少性が規格外の格を作る。01-foundations原則11と同思想)。**§2 選手詳細・能力タブ**: 0-150バー→枠越え圧縮バーへ。本編固有要素を織り込み——PW112=枠越え+輝き/消耗天井▼6=現在値の先に同色半透明ゴースト(現行の薄バー表現を新ジオメトリへ移植)/季節成長+2=緑マーカー維持/レーダー軸ラベルを系統色に。**§3 実装方針**: 階調`statTierStyle`と`barDisp`をui-commonへ共通ヘルパー化し**DB一覧・選手詳細・選手ファイルの3画面で共用**(画面ごとの再実装=ドリフトを禁止)。置換対象=_statCell/DB・詳細のOVR塗り/詳細ステバー・レーダー軸。**触らない**=_scale6本体と他用途(_mqColor/_condColor/_popColor/_bondColor)・ランキングv0.9階調・開発率バー。**§4 判断点5件**: 85+glow廃止の是非/人気ほか他スケールへの展開/ランキング階調との整合(当面残す提案)/ゴースト濃度/他画面への展開範囲。

検証: DOM検査で現行再現(OVR92=#f0d078+glow/SP107=色のみ)vs逆輸入(OVR92=純金太字glowなし/SP107=輝き)・枠越えPW112=88.4%・ゴースト/マーカー・レーダー軸色mono→系統色・エラー0。残: Keisukeレビュー。承認後は選手ファイルと合わせて画面仕様書+Codex指示書(逆輸入は既存画面差し替えのため別タスク分割を想定)。

**追記(同日Keisuke裁定)**: 詳細画面で**100超のバー自体を光らせるのは廃止**——枠を飛び越えるはみ出しは維持し、規格外の輝きは数値側(階調の100超glow)だけが担う。fighter-file-title-v0.7.html と db-gradient-backport-v0.1.html の両方から `sb-fill` の box-shadow を撤去済み(検証: 両モックともバーglow=0、数値glow・はみ出し幅・ゴーストは維持)。

## 選手ファイル モックアップ v0.7: 育成上限の事実訂正→バーを「圧縮はみ出し」へ（2026-08-13・Fable・レビュー待ち）

Keisukeの疑問「上限110と言ったが、理想が揃えば120以上行くのでは?」を実装調査で確認——**その通りで、v0.6の「実上限110」は誤り**。エンジンの天井は `trainCap` = **各ステごとに pot × 0.55〜0.80**（`Engine.rival.generateTrainCap` management.js:8989。係数はステ・プレイごと乱数、大物新人は0.70〜0.80保証）。pot最高帯（深町SP194/大馬越PW188/橘TE186等）×最大係数で**約150台**（ゲーム内バー0-150目盛の由来）。さらに限界突破+4（装着中・management.js:7742）/弱点克服+5（最低ステ）。成長は天井到達可能（cap_reached通知実装済み）。→ **上限は固定値ではなく、120〜150台が実在する**。

対応を `docs/ui/mockups/fighter-file-title-v0.7.html` に反映: **枠=100終端は維持**しつつ、100超は**実寸に比例させない「圧縮はみ出し」**へ——100超(〜150)を枠の右18%区画に圧縮（disp=100+(v-100)×18/50。110→枠+3%/130→+11%/150→+18%で頭打ち）+輝き。「枠を越えた=規格外」は記号で伝え、正確な量は数字が語る。150錯覚を戻さず、110でも150でも破綻しない。§2見本バーを85/100/110/130/150の5本へ。なお選手ファイル本体は基準値のみ（最高95）なので枠越えは本編詳細画面へ展開したときに現れる。

**但し書きの訂正（同日Keisuke指摘）**: 「記載の能力値は入団前査定の初期値」は誤り——実際の入団時数値はテンプレ値に成熟度0.68〜0.84を掛けて生成される（`getEntryMaturityRatio` management.js:9003）ため、ファイルの数値は入団時値ではない。**「記載の能力値は各選手の基準値」へ全箇所修正**（一覧の機密注記/モーダルのOVRラベル「基準値」/モーダル脚注）。

**機密注記の文言はKeisuke起草で確定（同日）**: 「潜在能力値は、本ファイルには記載されない。／各選手の潜在能力は機密事項。さらに同じ選手であっても、その数値はプレイごとに変化する。／※ 記載の能力値は各選手の能力基準値。」——一字一句この通りに反映済み（実装時もこの文言を正とする）。

検証: DOM検査でマッピング（110→103.6/130→110.8/150→118/200→118頭打ち）・100のバー右端が枠の右端に一致・輝きは100超のみ・モーダル最大80.5%（枠内）・エラー0。残: Keisuke確認（§3: 圧縮率18%区画の感触/枠越え方式のゲーム内選手詳細への展開=別タスク起票候補/ほか継続項目）。

## 選手ファイル モックアップ v0.6: 階調=案X確定・バーを「枠越え」方式へ（2026-08-13・Fable・レビュー待ち）

Keisuke裁定2件を反映して `docs/ui/mockups/fighter-file-title-v0.6.html` を作成。①**階調=案X「段で塗る」で確定**（v0.5の3モード比較UI・案Y・v0.4参考を撤去し確定形へ整理。7帯: 0-44暗灰/45-59明灰/60-69白/70-79系統色50%/80-89同80%/90-99純色+太字/100+純色+輝き）②**詳細モーダルのステータスバーを「枠越え」方式へ**——旧0-150目盛は「150まで育つ」と錯覚させるためNGの裁定。新方式は**バーの枠(トラック)が100で終わり、100超の黒い空きトラックは存在しない**。実際の育成上限110で、100を超えた選手はバーが枠の右端を飛び越えてはみ出し輝く=「枠を越えた規格外」が説明なしで伝わる。ゾーン全幅=110・枠=90.909%。§2に見本バー3本（85=枠内/100=枠いっぱい/110=枠越え+glow）。

検証: DOM検査でバー幅（85→77.3%/100→90.9%=枠右端に一致/110→100%+glow、モーダルPW95=86.4%枠内）・凡例6行・比較UI撤去・エラー0。残: Keisuke確認（§3: はみ出し量と輝きの強さ/**枠越え方式をゲーム内選手詳細の0-150バーにも展開するか**=別タスク起票候補/70台の濃さ/低域グレー/配色適用範囲/ファイル画面の地色）。デザイン確定後は画面仕様書→Codex実装指示書へ。

## 選手ファイル モックアップ v0.5: 「モヤモヤ」診断→塗り方3モード比較（2026-08-13・Fable・レビュー待ち）

v0.4の階調へのKeisuke評「モヤモヤして美しくない。はっきり視認性が良く、各能力値の個性も見えるのがいい」を受けて診断と処方。**診断**: 白→純色の直線混合は低彩度パステル帯を通り、初期値の大半(60〜85)がそこに集中して濁る。連続変化は隣接値が全部微妙に違う色になり帯として揃わずノイズに見える。**処方**を `docs/ui/mockups/fighter-file-title-v0.5.html` に3モード切替で実装——**案X「段で塗る」(推奨)**: 7帯に量子化(0-44暗灰/45-59明灰/60-69白/70-79系統色50%/80-89同80%/90-99純色+太字/100+純色+輝き)。同じ帯=同じ色で列が揃い、`_scale6` と同じ「段」の色言語/**案Y「連続+イーズ」**: 60→100をt^1.9で混色しパステル帯を素通り/**参考: v0.4直線混合**(原因確認用)。骨格(0=グレー→60=白→上ほど濃い→100+輝き)は3案共通。比較ストリップ(OVR金+PW赤の3方式並置)+現行モードの全系統凡例+表・モーダルのライブ切替。太字は90+(純色帯と同時に切替)へ変更。

検証: DOM検査で帯の一致(70と79が同色)・境界値・切替・凡例更新・モーダル追随・glow・エラー0。スクリーンショットで段方式の視認性を目視確認。残: Keisuke裁定(案X vs 案Y、案Xの帯割り/70台の濃さ50%か60%か)。承認後は画面仕様書→Codex実装指示書へ。

## 統一王座セリフ確定(A/B裁定でOpus稿採用)→task-89 Codex投入（2026-08-13・Fable+Keisuke）

セリフ147本が**全文承認で確定**。経緯: Opus稿v0.1に「レベルが低い・一番セリフ回りがうまいモデルで」→Fableが全面書き直し(v0.2)→両方見たKeisukeが**「前のままの方がいい」でOpus稿(v0.1a=直し5本+裁定①②④反映)を採用**、v0.2は不採用(git 97bac89に記録)。要判断③(話し方の混在=このまま)⑤(素の歓喜なし=このまま)も確定。**委譲方針メモリを更新**: セリフ=Opus委譲を維持(A/B実証)、記事・地の文はFable筆でも承認実績あり。**task-89(P3演出+焼き込み)をworktree wm-codex-task89でCodexへ投入**。完了後はdiffレビュー+I-1〜I-6検算(核: 表示層のみ=auto-sim 20季指紋一致/承認稿突き合わせ/果たし状無影響)→マージの手順。


## 選手ファイル モックアップ v0.4: 階調を二段構成へ（2026-08-13・Fable・レビュー待ち）

Keisuke三次レビューの反映で `docs/ui/mockups/fighter-file-title-v0.4.html` を作成。階調の形を「**0=グレー → 白へ → そこから上はだんだん色が濃くなる**」の二段構成に作り直した。白の折り返しは50か60かを一任され**60を採用**（既存実装 `_statCell` の「60以上=通常表示」閾値と一致し、「色が付いたら平均以上」のサインになるため。`WHITE_POINT` 定数1つで50へ変更可）。OVRは 0グレー→60白→78薄金`#f0d078`→100濃金`#d4a843`（金2色は `--gold-light`/`--gold` の実値）、PW〜MNは 0グレー→60白→100で系統の純色。新規定義色は0点グレー`#6e6e69`と白点`#f2f0e8`の2色のみ。100超glow・太字85+・凡例は前版の型を維持（凡例マークを 0/20/40/60/70/80/90/100+105 へ更新）。

検証: DOM検査で二段の通過点一致（PW: 30=灰白/60=白/75=淡赤/90=強赤/100=純赤、OVR: 78=薄金/100=濃金）・glow発動・凡例6行・コンソールエラー0。残: Keisuke四次レビュー（§3: 白点60の感触/グレーと白点の色味/glow強度/太字閾値/配色適用範囲/ファイル画面の地色）。承認後は画面仕様書→Codex実装指示書へ。

## 選手ファイル モックアップ v0.3: 階調カラー作り直し（2026-08-13・Fable・レビュー待ち）

Keisuke二次レビューの反映で `docs/ui/mockups/fighter-file-title-v0.3.html` を作成。①**OVRの階調を「元のルール」へ**: ランキングv0.9の白っぽい階調をやめ、DB実装 `_ovrColor`/`_SCALE6`（ui-common.js:799、スレート#607080→青灰#8090a8→タン#b89870→銅#c4853a→金#d4a843→明金#f0d078）のアンカーを**値で線形補間する連続グラデーション**に（検証: 45/75/85でアンカー色に正確に一致、80=#e2bc5e）②**PW〜MNは系統色が100で頂点**: 低域スレートから始まり100でその系統の純色に到達する専用グラデーション ③**100オーバーは輝く**: 元実装 `_scale6Style` のglow（text-shadow 6px）と同型の表現を100超へ移設（少し明るく+二重shadow。初期値では出ないため凡例に成長域見本105/112を掲示）④**確定**: タイトル配色=案2「会場の夜」・入口=Credits横小リンク（§0を確定形1枚に整理）⑤**訂正**: SP/TEの系統色がv0.2まで逆だった——実装 `_STAT_COLORS`（ui-render.js:9154）の実値は**SP=#2ecc71（緑）/TE=#3498db（青）**。Explore調査報告の誤転記が原因。モック・レーダー・バーとも訂正済み（ゲーム側は元から正しい）。

検証: DOM検査でアンカー一致・純色到達・glow発動・凡例6行・題色#161b21・モーダル追随（橘TE91=青太字）・コンソールエラー0。残: Keisuke三次レビュー（§3判断点: 階調カーブの感触/輝きの強さ/太字閾値85/配色の適用範囲/ファイル画面の地色追従）。承認後は画面仕様書→Codex実装指示書へ。

## 実機フィードバック7件バッチ: 契約交渉フリーズ(進行停止)ほか（2026-08-13・Fable）

Keisukeのプレイ中報告7件を一括対応。

1. **【最重要】契約更新交渉のフリーズ修正** — 交渉画面でどの選択肢を押しても進まない進行停止バグ。原因は78f1445(08-07)の多重クリックガード: `_bindContractOnce` が onClick 呼び出し**前に**自ボタンを disabled にするため、ハンドラ内に残っていた旧ガード `if (this.disabled) return;` が常に成立し onChoice/onSubChoice が永久に呼ばれなかった。`showContractNegotiationModal` / `showContractListenModal` の死んだガードを除去(ui-common.js)。08-07以降の契約更改・昇給・移籍志願・査定はすべて詰む状態だった(今季の契約更新が初遭遇)。`annual-contract-single-flight-test` 通過。**フリーズ中のセーブはリロードで交渉が再開する**
2. **関係性カスケード(SHOW AFTERMATH)の設計回帰を是正** — 「毎試合通知は当初設計(さりげなく垣間見せる)とずれ・キャラが大きく大げさ」の裁定。(a) `rivalry_50_up`(宿敵として意識)の特例Tier1入りを廃止し、モーダルは gold(宿命のライバル/深い絆)・danger(退団の噂)級のみに(ui-common.js `_isGlimpseTier1`)。降格分は weekLogFeed→道場バナー「休憩中の選手」経路へ。(b) カードを簡略化: 画像S(108×162)→梯子chip(46×66・2:3)、モーダル幅680→480、矢印/名前/バッジ縮小(ui-common.js size:'chip' + index.html .gc-*)。単発版(showGlimpseAModal)も同カードを共用するため同時に縮む。specs/glimpse-cascade-spec を v1.1 に更新
3. **団体タブ道場バナーのコーチ吹き出しを縮小** — 13px→11px(右下の休憩選手と同格)+max-width 190px(index.html .dojo-scene-bubble)
4. **バナーのセリフ量を拡充** — 雰囲気テキスト各レベル3〜4本→6〜7本(+15本、音・道具・時間の観測事実系)、練習掛け声15→27本(data.js ATMOSPHERE_TEXTS / ui-render.js DOJO_SHOUTS)。草案Opus・Fable検収。ランタイムでプール件数6/6/7/7/7を実測確認
5. **因縁セリフ「拳が握りしまる」修正** — 正本(docs/dialogue/13-glimpse-cascade.md「拳に力がこもる」)から反映時に文言が化けていた(日本語として不成立)。docの文言へ復元(data.js GLIMPSE_A_LINES.rivalry_50_up)。**同型の化けが他セルにもある疑い**→検品タスクを別途起票
6. **菊池璃子の負傷セリフ差し替え** — EVENT_INJURY_LINES.composed.bold「…止まるわけにはいかない。すぐ戻る」は負傷で止まる本人の台詞として矛盾(Keisuke「なんか変」)→「…私の代わりは、そう簡単には見つからないよ」(Opus起案5本からFable選定。欠場を受け入れつつ静かな強気)
7. **新聞一面「ただの5連勝」の格下げ** — winStreakMilestone 基礎120→100+強度補正に節目スケール(+4/連勝・上限+40)を追加(management.js)。不変条件: 5連勝は王手+主役補正上限でも240<top(260)で一面不可/記録更新絡み(例:10連勝更新280)は従来どおり一面可/連敗(95)<連勝(100)。`newspaper-news-value-test` 全通過。specs/newspaper-spec-v1.0 の表を更新
8. **PPVカード紹介でBGMが変わらない報告への保険** — 全経路で `initPPVShow`→`playStage('ppvA')` は呼ばれており静的には原因を特定できず。カード紹介画面(`_showPPVCardIntro`)表示時に `Audio.bgm.playForState()` で状態BGMを張り直す保険を追加(既に同曲なら素通しで鳴り直しなし)。**根本原因は次のPPVで要観察**(それでも変わらなければF12コンソールの [Audio] エラーを見る)

検証: node --check 全編集ファイル / newspaper-news-value / annual-contract-single-flight / stage-bgm-state / seasonal-tournament-bgm-continuity 全通過 / ブラウザ実測(ロード・プール件数・Tier1判定・差し替えセリフ到達・streak基礎点)。ui-check目視7項目○(機械検査 `test/ui-baseline-guard-test.js` は**スキル記載のパスに存在せず**=要スキル修正、2度目の検出)。auto-simはターン末フックに委任。manifest変更なし(新規配布ファイルなし)。roadmap該当項目なしのため更新なし。

残: 実機確認(バックログ「2026-08-13 実機フィードバック対応」に集約)/セリフ移植の文言化け検品(別タスク起票)。

第2ラウンド裁定: **戴冠=案B(暗転スポットライト)・色=オーロラ・到着画面=派手化なし(静か版)**(発話「アンビートオーロラ」=案B+オーロラと解釈、①〜⑤全点確定)。モックをv0.2aへ: 既定色をオーロラに・既定ビューを案Bに・到着ビューを静か版へ戻し(透かし/帯線/リムライト/内側グロー撤去、21px単グロー)・判断メモに全裁定刻印。案A/C・白金/紫紺は不採用の記録として残置。ブラウザ実測(画像8/8・既定 c-aurora/v2・到着21px・撤去確認)。**task-89(P3実装)起票**: A オーロラトークン新設+仮ティール全置換 / B セリフ147本焼き込み(承認稿一字一句+ブック往復) / C 戴冠セレモニー案B(AI優勝年も表示・タイムアウト保険) / D 返還式(自団体王者のみ) / E 到着=showHostileArrivalStageバリアント(静か版・受けて立つ1択) / F こちらの番Office化 / G 結果画面セリフ差し込み。不変条件I-1〜I-6(核: 表示層のみ=auto-sim 20季指紋完全一致/承認稿突き合わせ/果たし状への無影響)。**Codex投入はセリフ承認後**(要判断5点のレビュー継続中)。

## 統一王座P3: モックv0.2(戴冠3案+色3候補ライブ切替)+セリフ147本着弾（2026-08-13・Fable・裁定第2ラウンド待ち）

第1ラウンド裁定: ①戴冠セレモニー級=**確定**(デザインは複数案から選ぶ指示)/②到着画面の白金単色=**「地味」差し戻し**/③色=**「見た目で見せて」**/④Office・⑤仮運用先行=確定。→ モックをv0.2へ全面改訂: **戴冠3案**(A深紅の授与式/B暗転スポットライト「頂点はただ一人」/C黄金セレモニー表彰式様式)+**色3候補**(1白金/2紫紺/3オーロラ)を**bodyクラスのCSS変数切替で全ビュー連動**+到着画面の派手化(タイトル30px二重グロー/ベルト帯線/リムライト/エンブレム透かし/枠内側グロー)+バッジ見た目ビュー(クリーム地/黒地/👑並置)。ブラウザ実測: 画像9/9・7ビュー切替・3色切替(--idc-hi 3値)・粒子/紙吹雪アニメ確認。Fable推奨=案B×オーロラ。**セリフ147本はOpus起案が着弾・Fable検算通過**(一人称14本すべて規約内・固有名詞/「世界」0・最長25字・return期間非依存)→コミット655fa5f・Keisuke全文レビュー待ち(要判断5点: 推奨=①差し替え②温存③混在のまま④差し替え⑤現構成)。

## 統一王座P3起動: 場面割り設計+演出モックアップv0.1+セリフ147本Opus起案（2026-08-13・Fable・レビュー待ち）

「どんどん進めて」を受けP3(演出+セリフ)へ。(1)**場面割り設計** `docs/unified-title-p3-presentation-plan-v0.1.md` — 原則11適用で格付け: 戴冠授与式=セレモニー級全画面(4年に1回)/返還式=中規模Stageモーダル/挑戦者到着=**showHostileArrivalStage共通仕様の初展開**(黒Stage・ただし色は白金=赤は開戦級専用の裁定を守る)/こちらの番=Office改善/防衛・喪失=既存結果画面+専用セリフ/AI同士=紙面のみ。(2)**モックアップ** `docs/ui/mockups/unified-title-ceremonies-v0.1.html`(5ビュー: 授与式/返還式/挑戦表明/こちらの番/判断メモ)。ブラウザ実測: 画像8/8ロード・ビュー切替5/5・吹き出しクリーム地黒文字を計測確認。ui-check目視7項目○(隊列/勝敗/進行はモック該当なし・実装時注意を各ビューに刻印。機械検査スクリプトはスキル記載パスに存在せず=要スキル更新)。(3)**セリフ147本**(7場面×口調7種×3本: coronation/return/challengerArrival/defenseWin/beltLost/captureWin/challengeFailed)を**Opusへ起案委譲**(dialogue-tone-spec v1.0準拠・36字以内・メタファー禁止)→ `docs/dialogue/unified-title-lines-draft-v0.1.md` 予定。**残: Keisuke裁定5点**(①戴冠セレモニー級②到着画面は白金③アイデンティティカラー=白金トークン新設④こちらの番Office⑤ベルト画像は仮運用先行)+セリフ全文レビュー→P3実装指示書(codex-task)起票。

## 選手ファイル モックアップ v0.2: 一次レビュー4点反映（2026-08-13・Fable・レビュー待ち）

Keisuke一次レビュー（器=案A承認・操作感OK）の反映で `docs/ui/mockups/fighter-file-title-v0.2.html` を作成。①**数値を階調カラーへ**: OVR〜MN全列の系統色ハイライトを廃止し、**ランキング画面のOVR階調トークン（OVR_TIER_THRESHOLDS 100/95/90/85/80/70/60）を全能力列へ展開**（60未満=sub / 45未満=dim のみモック追加定義。80以上は太字。表の下に凡例）。詳細モーダルもOVR大数字とバー数値を階調へ（レーダー軸ラベルとバーの塗りは軸識別のため系統色を維持） ②**器=案A確定**でクリーム案Bを廃止 ③**入口**: 4つ目の大ボタン案を廃止し**Credits横の小リンク「Fighter File」**へ ④**タイトル画面の黄色がかり解消2案**: 原因は暖茶`--bg-dark #24221e`+金ラジアルグロー。ロゴ・ボタンの金は残し**地色と光だけ差し替える**——案1「グラファイト」#17181a+上からの白金光 / 案2「会場の夜」#161b21+下からの涼しい青光（推奨=案2）。ゲーム内Officeの暖茶は不変。顔マーキー彩度0.4→0.55（判断点）。

検証: ソート・階調色（PW95=`--v-elite-mid`／21=`--text-dim`）・モーダル・ESC・コンソールエラー0をDOM検査で確認（ブラウザペイン非表示のためスクショ不可）。残: Keisuke二次レビュー（§3判断点6件: 配色案1vs2／適用範囲（団体設立・難易度画面）／ファイル画面の地色追従／リンクラベル英字vs日本語／低域階調の追加定義／マーキー彩度）。

## task-88マージ: 全国統一王座 P1+P2（2026-08-13・Fable+Codex）

**task-88(統一王座エンジン基盤+挑戦サイクル)をマージ**(3ef181d)。Codexが専用worktree wm-codex-task88で実装(+1719/-37、10ファイル)→Fableがdiff全文レビュー・独立検算→3粒度コミット代行→mainへ。

実装: ①`G.unifiedTitle`(lazy-init・`_migrated_*`なし)+天頂戦apply()で授与(創設/戴冠/連覇を自動判別・tvModeでも授与・人気+8逓減・careerRecordは専用type=団体王座カウント不干渉) ②W47返還式(データ移動はapply時のみ=不成立年は前王者継続) ③保持者異動の整合5経路(プレイヤー引退/AI週次/AI季末/契約退団/引き抜きはベルト追従・FA/解雇は返上)+tickWeek週次スイープ+saveDoctor ④四半期periodKeyサイクル(創設前は乱数・状態とも不変/王者負傷はスキップ/天頂戦年Q4除外/団体0.65^idx・選手0.8^idx=最高OVR−4圏) ⑤AI→プレイヤー挑戦=B3型予約(先着優先CR>統一>B3・hasCompetingBooking排他・ゲスト非永続・fail-open再検証・8週失効) ⑥AI間防衛戦(派生RNG・新聞化) ⑦こちらの番(3サイクル輪番・選択モーダル+showTravelScene遠征1試合・見送り/失効でリセット) ⑧記事8種を承認稿一字一句で焼き込み+組み立て式compose(プロフィール4帯はtask-80プール参照共用・優先度 移動/戴冠180・防衛/返還/返上140) ⑨王者バッジ(選手詳細/ロースター/週画面/興行準備)+統一王座戦の集客1.25(キャパ上限)+1興行1タイトル制約参加。

検算(Fable独立実行): npm test **228/228**(記事突き合わせテスト含む)/**I-1成立**=`auto-sim 3 42` がmainとworktreeで指紋含め完全一致(9571aae6・創設前の挙動不変)/20季 ALL CLEAR・指紋 ad15932e がCodex申告と一致(決定論確認)/I-2〜I-8はdiff読み+テストで確認。Codexの100季計測: 創設1・移動57・防衛成功率218/275(79.3%)・こちらの番消化71・返上6 — 在位中央値1年強でベルトがよく旅する初期値。体感調整は実機後。ハードコード色(#4fb7c5系ティール)はP3のトークン化課題として持ち越し。manifest変更なし(新規srcなし)。

**残: 実機確認(バックログ§全国統一王座に7項目集約)/P3演出+選手セリフ(Opus起案から)/P4表彰・殿堂/specs昇格(P3-P4後)**。

## タイトル画面「選手ファイル」モックアップ v0.1（2026-08-13・Fable・レビュー待ち）

Keisuke起票: オープニング画面に全選手の能力値+プロフィールを見られる「選手ファイル」を新設。**潜在能力値は見せず、「基準値は秘密・プレイごとに変化する」旨を明記**。ソートはゲーム内DB同等、詳細画面も同型。当初Solへ発注したが**「実装はCodex、設計・モックアップはFable自身」の新裁定**を受けて自作へ切替（委譲メモリ2本を更新済み）。

成果物: `docs/ui/mockups/fighter-file-title-v0.1.html`（自己完結HTML・ソート/フィルタ/詳細モーダルが実動）。構成: §0 タイトル画面に4つ目の`.title-btn`「FIGHTER FILE」（代替=Credits横リンク、開閉はCreditsと同じオーバーレイz200型）/ §1 案A ダーク・ゲーム内DB準拠（推奨）/ §2 案B クリーム書類（機能同一・器だけ比較）/ §3 詳細モーダル（2:3梯子XL 172×258+レーダーチャート+ステバー0–150+特性+紹介文。**開発率含む潜在派生表示は全面非表示**）/ §4 判断点8件。設計前提: タイトル時点は`G`が無いため`ALL_CHARS`+`CHAR_PROFILES`+`PORTRAIT`の静的3点で完結させる（ゲーム内DBの団体/年齢/人気列は開始前に存在しないため落とし、身長列を追加）。機密注記は「①記載しない ②基準値は機密 ③プレイごとに変化」の3点必須で「機密指定」スタンプ付き欄外但し書きに。見本18名（全6スタイル網羅）は実データ転記、**potはモックのソースにも不含**。

検証: ブラウザ実動確認（ソート昇降=PW降順先頭・阿武隈95/昇順先頭・高島21、モーダル開閉、レーダーSVG描画、ESC/背景クリック、横スクロールなし、コンソールエラー0）。使用画像18名分（face+upper計36枚）の実在確認済み。ui-check目視7項目○。なお機械検査 `test/ui-baseline-guard-test.js` は**スキルが参照するだけで実体がリポジトリに無い**ことが判明（別タスクとして起票済み）。

残: Keisukeレビュー（案A/B・入口の形・判断点8件）→ 承認後に `docs/ui/03-screens/` 画面仕様書を新規作成 → Codex実装指示書。specs更新なし（モック段階のため該当なし）、manifest該当なし（docsのみ）。

## 統一王座記事65本 Keisuke全文承認 → task-88 Codex投入（2026-08-13・Fable）

記事草案v0.1改(大仰トーン)が**全文承認**。草案ファイルに承認マーク、task-88 §Hを「一字一句変更禁止・草案MD突き合わせテスト必須」(task-86セリフと同じ扱い)へ更新。task-87マージでゲートが開いたため、**task-88(統一王座P1+P2)を専用worktree `wm-codex-task88`(ブランチ codex/task-88-unified-title)でCodexへ投入**。完了後はFableがdiff全文レビュー+不変条件I-1〜I-8の独立検算(核: 創設前の乱数消費ゼロ=auto-sim 3季指紋一致/hasCompetingBooking排他)→コミット代行→mainマージの手順(task-86/87と同型)。

## task-87マージ+petition102本焼き込み: CH-1完遂・spec v0.2昇格（2026-08-13・Fable+Codex）

**task-87(CH-1挑戦フロー改修)をマージ**(7199354)。Codex実装→Fableのdiff全文レビュー・独立検算(npm test 227/227/auto-sim指紋 前後とも fae2a4d1=I-1成立/口上21本を自前照合で全文一致/I-2〜I-6はdiff+テストで確認)→3粒度コミット代行。実装: ①直訴+同行2名ピッカー統合(3枚→2枚。資格判定は旧showAwayTeamPickModalと同一集合、2名未満はYES無効、旧モーダル撤去) ②**果たし状画面を共通コンポーネント`showHostileArrivalStage`として新設**(黒Stage+--accent-war・敵隊列L寸-18px群外枠・人数可変1〜5・onChoice単発ガード+900msタイムアウト)しinverse挑戦を差し替え、重複受理ポップ廃止 ③inverse発火時に相手3名をエンジンで確定(OVR上位2名・負傷/引退除外・同値はderiveローカル・**旧セーブはfail-openで従来自動選抜**) ④sendoffのOffice化(行き先実エンブレム+遠征3人チップ)。

**追補(Fable直接実装)**: 承認済み**petition102本を団体戦文脈版へ焼き込み**(2121196)——引用符アンカーの全数置換で旧→新を適用(草案と双方向で完全一致を検算。旧文の包含衝突1件と「変更なし」注記の混入2件は検出→即修復)。直訴の配線を暫定14本(pickGroupRequesterLine)から**二軸34セル(pickRequesterLine=死蔵解消)**へ切替、14本テーブル撤去。kind-copyテストは新契約(固有名詞非混入・集団性マーカー・102本維持)へ書き換え。ブック再export(20,525行: 口上21初収録+petition102更新)。

**specs: `challenge-request-spec-v0.2.md` 新設**(v0.1=旧設計案を置き換え。エンジン数値は不変参照、UIフロー2枚/果たし状/セリフ4プール/不変条件を成文化)+INDEX更新。実機確認はバックログへ。worktree(wm-codex-task86/87)は撤去、ブランチは保持。**これでUI統一プログラムの残件はゼロ**(U1〜U8+顔出し監査+CH-1)。残るKeisuke確認: specs diff(v0.2含む)+実機確認バックログ。

## 技画像・生成方式の確定: 試作6周の結論はハイブリッド分業（2026-08-12〜13・Fable+Codex+Sol）

16_powerbombを題材に生成方式を6周試作(v2グレー2トーン→v3領域色分け→v5レシピ生成→v5.1/v5.2入力浄化→v6自動合成)し、**「密着技のmaster生成の全自動化は不可」が最終結論**(2026-08-13 Keisuke承認)。2体一括生成は様式品質は製品水準に達するが密着・逆さの体勢を構造的に勘違いする(受け手=逆さ+くの字+足上げをモデルが解釈できない)。自動個別生成→機械合成(v6)は幾何は正しいが線・陰影の分解再合成で絵が死ぬ(機械ゲート全PASSでもFable目視差し戻し — 数字合わせで絵が死ぬGoodhart事例)。**唯一体勢と品質を両立した実績はKeisukeの手動レシピ(旧作30枚)** — 生SS+リファレンスの2枚渡し。Codex経由GPT Imageは生SSを安全判定で弾く(手元ChatGPTは通る)ことも自動化のハンデだった。

**最終分業**: Keisuke=密着技(投げ8+関節7+DDT+M0の2体構図≒18枚)のmaster生成(手元レシピ・目で選別→inbox) / Codex=決定的レイヤー分離+QA+WebP(機械はv3〜v5.2で完成済み)+打撃・跳び系の自動一括生成レーン / Sol=ルーブリック判定 / Fable=工程管理・検収。

**確定した資産**: ①リファレンス `mannequin_turnaround_production-v4.png`(v2体型・紐なしプレーンブーツ・体型語彙はSol計測でv2と誤差1〜2%、Keisuke裁定の変遷: むっちりv3→v2回帰) ②見た目品質ルーブリック(`docs/move-illustration-visual-quality-rubric-v0.1.md`、v0.5相当まで: ハードゲートG1-4/L1-9/C/S/F/P1-7、線幅統一計測定義、四肢員数・くの字角・様式パリティ・継ぎ目健全性) ③分離・QA機械一式(codex側 scripts/move-image/、決定的・ハッシュ再現) ④5層契約(fill×2/shading/outline/master)+ゲーム3ファイル契約への平坦化 ⑤運用知見: ポーズ入力はベタ塗りシルエット不可(四肢欠落)・180度回転で正立生成(陰影は合成後生成とセット)・接触影/様式はリファレンス2枚を混ぜない・匿名化は品質正規化として正当(なお拒否ならKeisukeへ)。

Codexコミット代行はsandbox制約で常態化(ZIP退避→Fable復元→コミット、計7回)。codex側コミット: 9db7fd7(撮影素材)→693a4d1(v2)→91f78e6(v5様式)→03f53ae(v3)→6ce4b79(v5)→0fc283c(v5.1)→5e89e5d(v5.2)→6c62974(v6記録)。specs該当なし(制作工程でありゲーム仕様ではない)、manifest該当なし(配布物なし)。**残: Keisukeの密着技master生成(第1便)→Codex分離パイロット→自動レーンの打撃系パイロット**。

## 統一王座記事v0.1改: Keisuke指示で全文を大仰・豪快トーンへ書き直し（2026-08-13・レビュー待ち）

「記事は派手に、文言も派手で、豪快(大仰)な言い方してもいい。4年に一度のゲーム内一番のイベント」の裁定を受け、`docs/unified-title-article-drafts-v0.1.md` の65本+合成例8本を全文書き直した(スポーツ紙一面のトーンへ——「業界の歴史が変わった夜」「頂点はただ一人」「刺客」「牙城」「玉座」等を解禁)。維持した規則は3つだけ: 「世界」を冠しない/内部変数名禁止/鉤括弧セリフなし。07-16の「ナレーションは事実記述・格言禁止」はこの記事群に関して上書き(統一王座は最大格のイベントのため。他の記録系テキストには従来規則が生きている)。残: Keisuke全文レビュー。

## 統一王座: 新聞記事を一面級の組み立て式へ格上げ、草案65本をFable執筆（2026-08-12〜13・レビュー待ち）

Keisuke指示「一面記事が埋まるようにリッチな内容で」を受け、task-88 §H を改訂——一行記事を廃し、task-80王座交代記事と同じ組み立て式(リード→経緯→人物→来歴→締め)へ。文面の正は `docs/unified-title-article-drafts-v0.1.md`(見出し16本+本文テンプレ65本+合成例8本)。**執筆はOpus委譲が529過負荷で2連続死したためKeisuke裁定でFableが代行**。人物プロフィールは承認済み`CHAMPION_CHANGE_TEMPLATES`の年齢帯4帯を参照共用(複製しない)、来歴スロットは`unifiedTitle.history`の実データ(防衛数/保持年数/渡った団体数/歴代保持者数)から条件付きで叙述——リッチさをテンプレの水増しではなくデータ由来にした。規約(事実記述/格言禁止/「世界」禁止/変数名禁止/連呼禁止/セリフなし)は自己検査済み。残: **Keisuke全文レビュー**→修正反映→task-88のCodex投入(task-87の決着後)。

## task-86マージ: 開戦画面リデザイン+敵対度表記の全画面統一（2026-08-12・Fable+Codex）

Codexを専用worktree(wm-codex-task86、mainのlinked worktree)で`codex exec --full-auto`実行→Fableがdiff全文レビュー・検算・コミット代行(sandboxがworktreeのindex.lock作成を拒むため。task-84と同型)→mainへマージ(749b93e)。

実装: 赤トークン`--accent-war`系新設(橙--accent-hostilityは不変)/開戦モーダルをモック案Aへ(L 150×224+吹き出し+中央の段位ラベル+火ゲージ🔥×5+upperチップ46×66隊列+「両派リーダー・一騎打ち」+飾り数字ledger廃止→定性2行)/`FACTION_IGNITE_LINES`42本+ブック往復登録/`checkF02IgniteTrigger`にmemberIds/Count追加(氏名カンマ連結バグの土台修正)/敵対度露出6箇所をラベル統一(F08ヘッダ・本文・ヒント、F06、DBタイムライン・バッジ)/F09ナレーションescHtml 2箇所/テスト追随3本+新規`test/faction-ignite-rework-test.js`(草案42/42突き合わせ・生数値非露出・チップN個・escHtml振る舞い検査)。

**レビューでの修正1件(Fable)**: タイムラインのF02系ラベルがCodex実装では一律「開戦」になっており、**F02_PEACE(和解)まで「開戦」と表示される取り違え**だったため、種別ごとに 開戦/和解/決着/長期化 へ振り分け直した。

検算(Fable独立実行): npm test **226/226 PASS**/auto-sim 20季 seed42の指紋がmain(変更なし)とworktree(変更後)で**完全一致 fae2a4d1**=I-1成立(エンジン乱数消費ゼロ増)/セリフ42本は自前スクリプトで草案と全文一致(data→草案の不一致0)/I-2〜I-5はdiff読みで確認(getHostilityLabel・F08実挙動・発火判定に差分なし)。ブック再export済み(その他.xlsxに42本初収録、apply --dry-runで全冊クリーン確認後)。実機確認はバックログへ追記。**task-87(CH-1)を続けてCodexへ投入済み**(専用worktree wm-codex-task87)。

## 統一王座: 全8件裁定完了+コーチ引退基準確定、実装指示書 task-88 起票（2026-08-12・Fable+Keisuke）

設計提案v0.1の裁定8件が**全件推奨どおり確定**(①AI間でもベルトが動く ②自団体王者への挑戦は断れない・負傷四半期は自動スキップ ③王者常設バフなし・王座戦は団体王座より一段大きい扱い ④こちらの挑戦は相手団体へ遠征 ⑤W47返還式・不成立年は前王者保持継続 ⑥統一王者は天頂戦自動エントリー・優勝で連覇 ⑦移籍はベルトごと移動/FA・解雇は返上 ⑧名称「全国統一王座」)。あわせて**コーチ引退の基準=在籍年数**も裁定(年齢基準ではない。年数の具体値は設計時)。提案書・ロードマップに刻印済み。

**task-88(unified-title-engine)起票**: P1(基盤=授与/W47返還/引退・移籍・FA整合/新聞8文面/最小UI)+P2(四半期periodKeyサイクル/AI→プレイヤーB3型予約/AI間防衛/こちらの番=輪番3回後+遠征)。数値はFable設計——団体抽選weight 0.65^idx(rank順)/選手抽選0.8^idx(OVR順・最高OVR−4圏)/attendBonus 1.25/人気は戴冠+8・防衛+3(既存逓減)/新聞priority 移動・戴冠180、防衛・返還・返上140。不変条件I-1〜I-8を対で記載(核はI-1: 創設前は乱数消費ゼロ=実装前後で `auto-sim 3 42` 完全一致、とI-5: hasCompetingBooking経由の予約排他)。100季1本の分布計測(創設/移動/防衛率/こちらの番/返上)をCodex報告に含めさせ、較正判断はFable。**新規srcファイル禁止**(manifest事故防止)。新聞8文面はFable草案——Keisukeレビューは実装と並行、差し替え指示があり得る旨を指示書に明記。残: Codex投入(同ツリーのWIP状況を見て)→diffレビュー+不変条件検算→マージ→P3(演出+セリフOpus)/P4(表彰系)起票。

## 全国統一王座+コーチ世代交代のロードマップ起票、統一王座の設計提案 v0.1 起草（2026-08-12・Fable・Keisuke裁定待ち）

Keisuke起票の新要素2件をロードマップ「次の実装予定」冒頭へ追加した（この順で着手）。**①全国統一王座**=天頂戦優勝者に授与される業界頂点ベルト（保留中の秋挑戦権トーナメント案とは別方式である旨を両所に明記）。**②コーチの年齢・引退・契約満了サイクル**=年数ベースの引退方針+**約25名の新コーチ追加**（既存35名の分布を実測してから偏りを埋める形で設計。ALL_COACHES の `age` は表示用静的データで加齢・引退処理は皆無と実測確認）。オリキャラ作成の詳細（メニュー画面/Web公開版/購入者限定掲示板）は既存 E-7 行へ追記した。

統一王座は既存実装の全数調査（Explore・天頂戦/団体王座/CR・B3挑戦フロー/週種別/引退6経路/団体ランキング/セーブ互換）を経て **`docs/unified-championship-proposal-v0.1.md`** を起草。骨子: ベルトは選手個人に付く/四半期（12週）ごとの防衛サイクル（periodKey方式・inviteMarketと同型）/挑戦3態（AI→プレイヤー=B3型予約・AI間=processAIB3Challenge型・こちらの番=遠征+奪還型）/「こちらの番」は喪失から3サイクル後の輪番/天頂戦W47返還式→apply()で授与（不成立年は前王者保持継続）。調査の要注意点も織り込んだ——`G.ppvTournament` はシーズン開幕でnull化されるため永続フィールド新設が必須/`hasCompetingBooking`（factions.js:3168）への追記漏れが最頻衝突バグ/予約注入は app.js:6454 と ui-render.js:3165 の二重管理。不変条件7件・工程P1〜P4・lazy-initセーブ互換も記載。

**残: Keisuke裁定8件**（提案書§5。AI間でもベルトを動かすか/挑戦は断れない扱いか/王者バフなしか/こちらの挑戦は遠征か/返還のタイミング/王者の天頂戦自動エントリー/移籍・FA時の扱い/ゲーム内名称）→ 裁定後に codex-task 起票。specs該当なし（実装完了時に specs 昇格予定）、manifest該当なし、コード変更なし。

## task-86/87 起票: 開戦画面リデザインとCH-1挑戦フロー改修のCodex指示書（2026-08-12・Fable）

「進めてください」を受け実装フェーズへ。**task-86**=開戦画面(赤トークン--accent-war新設/L寸+吹き出し/中央ラベル+火ゲージ/upperチップ46×66の頭数隊列/ledger廃止/帯文言「両派リーダー・一騎打ち」/セリフ42本焼き込み/敵対度露出6箇所のラベル統一/人数バグのID配列追加/F09 escHtml 2箇所)。**task-87**=CH-1(直訴+同行ピッカー統合で3枚→2枚/果たし状画面を人数可変1〜5の共通コンポーネント showHostileArrivalStage として新設/口上21本焼き込み/sendoffのOffice化+行き先情報。task-86マージ後に着手)。両書とも数値目標と不変条件を対で記載(核はI-1: 同一シードauto-sim fingerprint完全一致=表示層のみの改修でエンジン乱数消費を増やさない。セリフ選択・相手3名選出はderiveローカル)。**Codex投入はtask-85(技画像PhaseA)の決着後**(同一作業ツリーのWIP衝突回避)。並行して死蔵102本(CHALLENGE_LINES.petition)の団体戦文脈改修をOpusへ起案依頼(旧→新の対で出させKeisukeレビューへ)。モックのチップはface画像だが**実装はupper素材(2:3)を使う**旨を指示書に明記(素材系統違反の再発防止)。

## セリフ63本承認+迎撃画面を「果たし状」形式(黒Stage+敵隊列)へ再設計（2026-08-12・Fable+Keisuke）

(1)**セリフ草案63本が全文承認**(開戦の宣戦21/応戦21/挑戦状の口上21。Opus起案→Fable機械検算→Keisukeレビュー)。要判断3点も推奨どおり確定——「そっち」温存/場面3の敬体このまま(慇懃無礼として機能)/ヤンキー「出しなよ」温存(伝法は骨格内)。草案 `docs/dialogue/faction-ignite-and-challenge-lines-draft-v0.1.md` に承認マーク済み。実装焼き込みは開戦+CH-1の実装タスクに同梱。

(2)**迎撃(相手発の挑戦状)画面をさらに再設計**。Keisuke追裁定: ①背景はベージュ(Office)でなく**黒系Stage——ブラックメインに赤**(「危険な挑戦が来た」感) ②**主役は仕掛けてきた側の3人の隊列**(「向こうが仕掛けてきた絵を見たい」。こちらの選手は出さない・迎撃3名は興行準備で決める)。CH-1モックの迎撃ビューを全面書き換え——タイトル「果 た し 状」(結果画面「果たし状、成就。」と語を統一)/話者ラベル+承認済みセリフのクリーム吹き出し/敵3人をL寸・群外枠+18px重ねの隊列(秋対抗戦トリオと同型)/団体バッジ/黒地の決裁トレイ(Stage画面にクリームパネルは置かない——クリームは吹き出しのみ)。**この形式は「相手から仕掛けられた突発バトルイベント」到着画面の共通仕様候補**(Keisuke「共通の仕様としてありかな」)——人数可変(1〜5人)で実装し、B3挑戦状等への展開は各実装時に判断。スクリーンショット検証済み。

残: 開戦画面+CH-1の実装指示書(codex-task)起票——次工程。specs該当なし(実装時にchallenge-request-spec v0.2で成文化)、manifest該当なし。

## 開戦・CH-1の全裁定完了、モックへ刻印、設計原則11新設、セリフ起案開始（2026-08-12・Fable+Keisuke）

対話レビューで両モックの全論点が確定した。**開戦5+2点**: ①敵対度=5段ラベル+火ゲージ(数値なし) ②宣戦/応戦セリフ新設 ③飾り数字ledger廃止→定性2行 ④帯文言を実態に合う言葉へ(案「両派リーダー・一騎打ち」) ⑤頭数=数字+顔チップ列、**サイズは「もう少し大きく・丸じゃない形」→梯子chip 46×66矩形** ⑥団体戦への宣戦フォーマット適用は見送り(ドラマは遠征〜敵地3連戦側に既にあり、YES直後の宣戦は復唱になるため。記録ビューは残置) ⑦色は火の赤#e04343(「肌色っぽい橙より赤で燃え上がる感じ」。PPV深紅と色相分離)。**CH-1全4点**: ①同行選択の統合(3枚→2枚) ②迎撃の差別化——**挑む=事務所の平和的クリーム/来た=攻撃的な赤系**+専用タイトル+こちらへ向いた専用セリフ ③死蔵102本を団体戦文脈へ改修して復活 ④sendoffのOffice化。両モックの判断メモを裁定刻印済みの状態に更新し、案A(チップ矩形化・帯文言)と迎撃ビュー(赤)へ反映した。

**設計原則の新設**: 「このレベルのイベントモーダルは節目じゃないといけない。多いと過剰になる」「節目じゃないものはいつものモーダルでいい」(Keisuke)を **01-foundations.md §1-6 原則11** として成文化(c952d8b)+メモリ保存。あわせて対立の橙(--accent-hostility)の棚卸しを回答——**1トークンが4役**(敵対識別/is-hostilityステージ演出=F09で最大12枚連発/遠征「敵地」配色/--c-warningエイリアス)であることが「何度も見た・過剰」の正体。**色の役割分割方針**(赤=開戦級の稀少演出のみ/橙=常設対立識別に限定/警告色はエイリアス切り離し)を提案し、橙全箇所の振り分け一覧は実装回で提示することにした。

次工程(進行中): **Opusへセリフ起案を委譲**(開戦の宣戦21+応戦21+挑戦状の口上21=63本、口調7種×各3本・36字以内・dialogue-tone-spec v1.0準拠→ `docs/dialogue/faction-ignite-and-challenge-lines-draft-v0.1.md` 予定)→Keisuke全文レビュー。その後、開戦画面とCH-1の実装指示書(codex-task)起票。specs該当なし(実装後にchallenge-request-spec v0.2改訂を予約)、manifest該当なし。

## CH-1 直訴フォーマット統合のモックアップ v0.1 + 開戦モックに横並び比較追加（2026-08-12・Fable・レビュー待ち）

(1b)**開戦モック v0.1b: 赤メイン化+団体戦への同フォーマット適用ビュー追加**。Keisukeレビュー第2弾(08-12)を反映——①「肌色っぽい中途半端な色→赤で燃え上がる感じ」指示により案A/団体戦ビューを火の赤 #e04343 へ(PPV/天頂戦の深紅とは色相を分離。実装時は--ev-war系トークン化)。②「団体間の挑戦試合も重みは同格、両方このデザインで合わせては」の示唆を受け、**宣戦フォーマット共通化案**を新ビューで提示(挑戦YES後の送り出しをStage宣戦画面に置き換え。派閥フラグ→団体バッジ/敵対度ゲージ→シリーズ情報の差分のみ。採用ならCH-1判断メモ④は置き換え)。判断メモに論点⑥として追記、色は確定扱いで記録。スクリーンショット検証済み(赤テーマ・全画像・ビュー切替)。

(1)**開戦モックへ「横並び比較」ビュー追加**(9e833ae)。Keisukeレビュー中の指摘「見比べられないから判断がつかない」への対応——案A/現行を同倍率(zoom .74)で並置し、下段に既存の派閥系モック2本(faction-events.html / f05-f08-rework)をiframeでそのまま埋め込んだ(中の切替ボタンも動作)。案Aのデザイン言語は既存から継承(タイトル帯/煽り橙/役割ラベル/フラグ/VS)で、新規要素は吹き出し・火ゲージ・顔チップ列の3つだけという整理も注記した。

(2)**CH-1のモックアップ作成** `docs/ui/mockups/ch1-petition-unified-v0.1.html`(挑む/迎撃/判断メモの3ビュー)。事前調査(Explore)の確定事項: **挑戦試合は07-25以降に3人制シングル3連戦の団体戦へ作り替え済み**で、直訴モーダル(showChallengeRequestModal, ui-common.js:11915〜)は既に派閥と同じOffice書式+u3b部品に乗っている=**「書式統合」というCH-1の当初定義は実質完了済み**。残る固有判断として④点をモック化: ①同行2名選択の直訴画面内統合(現行は直訴→別画面選択→送り出しの3枚→2枚へ)/②迎撃(inverse)の差別化(現状はタイトル・ラベルが挑む側と同一+セリフは自団体用「社長、…」が敵選手からも出る向きの矛盾)/③petitionセリフ供給(団体戦化でCHALLENGE_GROUP_PETITION_LINES 14本のみになり、07-25の34セル102本(CHALLENGE_LINES.petition)が死蔵)/④sendoff画面だけmdl-a枠で情報なし→Office統一。仮セリフは全てダミーで採用時Opus起案と明記。調査の副産物: `_mdlASubjectStage`の3:4問題は**07-31にM 132×194一本化で解消済み**(ui-common.js:470実測)——roadmapの「残り」記載を訂正し、**UI統一の残件はCH-1のみ**になった。結果画面.crrm-*の第3CSS系統残存・spec v0.1の旧前提(1対1/mdl-a)乖離は実装時注意として記録。

検証: 両モックともブラウザ実測(画像全ロード/M寸/ピッカー2名上限/ビュー切替)OK。コード変更なし・specs/manifest該当なし。残: **Keisukeレビュー**(開戦=判断メモ5点、CH-1=判断メモ4点)→承認後に実装タスク化。

## 派閥「開戦」画面リデザインのモックアップ v0.1 作成（2026-08-12・Fable・レビュー待ち）

roadmap起票(08-02)の「派閥『開戦/直接決戦』画面の再設計」に着手。Keisuke承認「モックアップを作るのを進めて」を受け、まず現行実装を全数調査(Explore)した上で `docs/ui/mockups/faction-ignite-rework-v0.1.html` を作成した(案A/現行比較/敵対度統一案/判断メモの4ビュー切替)。**コードは未変更**。

調査の主要な確定事項: (1)**「直接決戦」という単独画面は存在しない**——語は開戦画面のカード帯(ui-common.js:11175)にのみあり、実体はF08決裁→試合前後+F09対抗戦×4(最大12枚)に分散。再設計の主対象は開戦(F02 ignite)画面。(2)**開戦画面だけが共通部品の外**(u3b未使用・吹き出しゼロ・画像220×260 cover=2:3素材の脚が切れる・生ハードコード色)。(3)**人数表記は実装バグ**——checkF02IgniteTrigger がメンバー氏名配列を返し(factions.js:2458-2459)、モーダルが素通しで埋めるため「派閥人数 東條,西島,…」と出る。(4)**敵対度の露出6箇所**(生数値小数2桁/英語HOSTILITY/内部閾値80・70の直書き)——一方でラベル関数 getHostilityLabel(冷え込み〜血みどろ5段)は既存でDB派閥タブのみ使用。(5)**開戦ledgerの数値は大半が飾り**——実効は敵対度+12のみで「対戦マッチ数1→2/MQ期待値+8/集客+6%」はエンジン未実装(faction-events.md:578-583に既記載)。F02②③のledgerも同様。(6)付随バグ: F09ナレーション2箇所だけescHtml未通し。

モックの提案(要裁定5点は判断メモビュー参照): 敵対度=中央1つの段位ラベル+火ゲージ(数値なし)/リーダーの宣戦・応戦セリフ新設(採用ならOpus起案・アーキタイプ軸)/ledger廃止→定性2行/帯文言「派閥抗争・直接決戦」の可否(07-27未回答項目)/頭数=「N名」+24px顔チップ列。実装時注意(裁定不要)として画像L 150×224化・u3b移行・トークン化・escHtml・触ると壊れるテスト6本も明記。スコープ外(別起票候補)としてF09の情報量(100pt進捗不可視/スコア単位不一致)とbuildF09MatchPairsの出場可否未検証(task-70残根本)を記録。

検証: ブラウザ実測で画像11枚ロード正常・アッパーL寸・吹き出しが画像の上・4ビュー切替動作OK。specs該当なし(モック段階)、manifest該当なし(docsは配布対象外)。残: **Keisukeレビュー**(特に判断メモ5点)→承認後に実装タスク化。次はCH-1(直訴フォーマット統合)のモック——現行調査を並行実施中。

## 記録整理2件: 「全盛期の窓」クローズ(Keisuke裁定)+宿怨セリフの更新漏れ訂正（2026-08-12・Fable）

(1)**「全盛期の窓が狭すぎる」をクローズ**。Keisuke裁定「収束(ブレーキ)をもう少し長く持つようにし、wearもいじった。そこで概ね解決した」を受け、コード実測と突き合わせて確認——成長リバランスv2.0(07-30)の収束ブレーキγ1.3(カンスト率92%→22%)+wear系再設計(熱量逓減/strainDebt/AI活動wear)+開眼第1フェーズ(08-02)により、「若くして伸び切って君臨」の構造がほぼ消えて山なりのキャリアになっている。**decayStartAge=23+実効耐久(±3クランプ・上限26歳)自体は未変更**であることも確認済み(management.js:7820/7934)。再浮上時はパリティ実測トップ到達帯を基準に再起票(08-02依存順メモ)。roadmapの専用セクションをクローズ表記に更新、当初分析は記録として残置。

(2)**宿怨(BITTER)試合前セリフの記録訂正**。roadmapで「⏸未着手」のままだったが、実際は07-31のtask-45で実装済み(`BITTER_PREMATCH_LINES` ahead/behind各28本+宿怨専用分岐16週CD+「遺 恨 再 燃」モーダル)。roadmap訂正+実機確認バックログへ追加。コード変更なし・specs/manifest該当なし。

## ui-baseline-guard-test 新設: チェックリスト参照の欠落ファイルを実装で解消（2026-08-12・Fable）

CLAUDE.md「頻出違反チェックリスト」と `.claude/skills/ui-check/SKILL.md` が機械検査として案内する `node test/ui-baseline-guard-test.js` が実在しない問題(53952a7 でスキルが参照だけ書き、テスト本体が作られていなかった)。対応2択(参照書き換え or ガード新設)のうち、**ガード新設(b)を採用**——顔出し監査(12a76c3)直後で現状スナップショットの取り時であり、`/ui-check` が毎回叩くコマンドが回帰ガードとして実際に機能する価値が参照修正のコストを上回ると判断。

実装(`test/ui-baseline-guard-test.js`、run-all自動発見で npm test に編入): **Part A=共有部品の梯子値の改変検知**(.u3b-upper 4段+chip / .ch-por系 / .emr-upper系 / .pb-portrait / 表彰式 portrait-main・aw-team / 両観戦の cutin・winner・vic、計17本を実寸一致で検査)。**Part B=梯子外の新規流入検出**——CSS(index/battle-engine/tag-battle の style ブロック+battle-shared/battle-mobile/mobile.css)の width+height 固定ルールを全走査し、人物系セレクタ(port/upper/face/photo等のキーワード、emblem等は除外)で「2:3梯子5段」「52px以下の正方形(§2-C)」「ALLOW」のいずれでもなければ FAIL。失敗時はそのまま貼れる ALLOW 行を出力する。分類ロジック自体の自己検査付き。

**ALLOW=既知の梯子外100件を理由グループ付きで凍結**(準拠ではなく既知、減らす方向が正): faceout-audit保留分(新聞np-*・wm-stat-upper) / 旧A〜D型モーダル(_mdlASubjectStage 3:4はモックアップ先行の残タスク) / 派閥イベント旧画面(F02系=U3対象外、co-class上書きの元ルール) / DB・相関図タブ独自レイアウト / CSS内コメントに根拠のある設計値(JT 150×225等) / コーチ・NPC / モバイル比例縮小。走査で人物画像なのにキーワードから漏れた2クラス(.jtc-up/.awpick-cf)も検出対象へ追加した。陳腐化した ALLOW 行は note 表示で掃除を促す(失敗にはしない)。

検証: 単体OK(ladder=65, face≤52=56, allowed=100/100) / **npm test 226/226 PASS**(既存225+本テスト)。監査書 `docs/ui/faceout-audit-v0.1.md` v0.2追記へガード新設の段落を追加。specs該当なし(テスト基盤でありゲーム仕様は不変)、manifest該当なし(test/は配布対象外)。auto-simはsrc未変更のため対象外。残: 新規に梯子外が必要になったら ALLOW へ理由付き1行追記という運用の周知は本テストのヘッダコメントと失敗メッセージが担う。

## 顔出し違反の一括解消: faceout-audit再検証→20件修正+死にCSS掃除（2026-08-12・Fable）

UI統一の残タスク「顔出し違反32件」(docs/ui/faceout-audit-v0.1.md、07-31監査)を消化した。監査後にPPV修正(task-46)・バトル観戦Pattern C v4刷新・新聞全面再設計が入っていたため、まず32件全数を現行コードで再検証(Explore並列2本)——自然解消7件(U3共通部品化とtask-46/50の効果)・残25件を確定し、**20件を承認済み梯子(XL/L/M/S/chip)へ一括修正、5件を理由付き保留**とした。件別の対応表は監査書の**v0.2追記**が正。

主な修正: (1)**イベント試合結果のタッグ隊列**(.emr-pair)を「左右分割の写真枠+境界線+104×152+17px重ね」から**群の外枠1つ+S 108×162+18px重ね+drop-shadow+敗者grayscale**(.ch-duoと同型)へ。is-spring/is-normal分岐を廃止し全プロファイル共通化(モバイルはchip)。(2)**タッグ観戦の勝利画面**を L寸隊列+群外枠へ。セリフを画像の上の吹き出しへ移動(尻尾下向き)・話者名を吹き出し外のラベルへ・「LOSER」→×記号・**アッパーのscaleX(-1)反転を廃止**(07-18裁定に反していた)。(3)素材系統違反2件——解雇面談の1:1 face→getUpperUrl、年代記序章の72×90切り抜き→face card 52。(4)残りは段合わせ: オープニングL(モバイルS)/シーズン総括(主役枠258=XL・記録S・入退団chip)/旗揚げドラフト(固定S・候補XL、600px以下S)/スカウト履歴書XL(4:3廃止)/殿堂(一覧40丸・詳細52・全身258)/年代記(エースXL・二枚看板M・同期chip・モバイルS)/相関図(団体24丸・比較M)/PPV事前M/PPV TV頂上M(モバイル--sも108×162)/カットインS両iframe統一(100×150と90×135の二重定義解消)/単発観戦勝者XL(話者チップ36→40丸)。

死にコード掃除: 旧因縁列伝CSS 66行(index.html。現役参照は`np-`接頭辞の新聞側のみと全数grep確認)・`.notif-modal-face`系・`.apron-avatar`(tag-battle.html+battle-mobile.css)・`.chron-ace-row.dual`。画面仕様書 `docs/ui/03-screens/season-retrospective.md` の92px記載も追随更新。

**設計判断の記録**: 単発観戦の勝者画面下段チップが勝者を二重表示する件(敗者不在)は、当初敗者へ復元したが**08-03の意図的設計**(victory-overlay-speaker-test.jsが「敗者を出さない」を明示検査)と判明したため撤回し維持(保留5件の一つとして記録)。新聞2件(np-注目対決/関係カード)はnewspaper-spec-v1.0の管轄、バトルv4内在3件(吹き出し被り/.bp-img/.wm-stat-upper)はv4実機確認と合わせて判断。

検証: `node --check` 4本OK / **npm test 225/225 PASS**——テスト3本を新契約へ追随(spring-tag-team-frame=群外枠契約+プロファイル分岐なしの負検査 / victory-overlay-speaker=話者ラベル外出し+吹き出し内に名前が無い負検査 / u3-safety-net=getUpperUrl注入) / **全変更CSSをブラウザ実測(computed style)で数値一致確認**(メインapp+タッグ観戦+単発観戦の3文書、wm_audioミュートで実施)。auto-simはUI/CSSのみの変更のためフック対象外。specs該当なし(承認済みベースラインの適用でゲーム仕様は不変)、manifest該当なし(新規配布ファイルなし)。残: 実機確認は `docs/実機確認バックログ.md`「UI系」へ集約 / 保留5件は監査書v0.2参照。

## 技画像・初回30枚ショットリスト策定: ポーズ庫照合済みの撮影発注書を新設（2026-08-12・Fable）

技イラスト制作の司令官役として、初回30枚+M0共通4点の撮影発注を `docs/move-illustration-first30-shot-list-v0.1.md` に確定した。コーデックス側の計画4本(カバレッジ計画/3D撮影パイプライン/統合仕様/初回撮影候補台帳、mainにも同一あり)を精読し、**ポーズ庫 `D:\TDCG\pose\■技` の実在束と全数照合**して3波に編成: 第1波19技(束あり即撮影可 — パワーボム作り直し/シットダウンパワーボム/デスバレー/垂直落下BB/喉輪落とし=チョークスラム/卍固め/ロメロ/脚四の字/ムーンサルト等)、第2波8技(近縁束から改変 — ラストライド/ツームストン/バズソー/テキサスクローバー等)、第3波3技(自作必須 — SSP/450/スワントンの空中フィニッシャー。ムーンサルトで型を先に確立)。assetIdは `image/moves/placeholder_assets.json` の既存割当(01〜87)に紐付け済み。

選定原則: フィニッシャー優先(現行プールのd≥14を全カバー)/Allround8技全埋め(43人・フィニッシャー候補なしのため大技=決着技)/同名バリアント相乗り(チョークスラム=喧、パイル=喧、テキサス=専など)/**v0.2で固有選定専用へ抜ける5技(ファルコンアロー/みちのくII/エクスプローダー/フェニックス/ハリケーンラナ)は初回から除外**(Keisuke方針「固有技はまだ先」と一致。v0.2実装が長引く場合はみちのくII/フェニックスの繰上げ再検討を明記)。M0(cover-pin/kickout/downed/tap-out-overlay)は30枚と別枠で第1波に同梱(フォール束・ダウン束あり)。前回チャットで示した30案からの変更: スクールボーイ(丸め込み)をP1後送にし、ジャーマン(現行Grappler P0・束あり)を繰り上げ。

役割分担を台帳に明文化: Keisuke=カスコでポーズ・3パス撮影 / Codex=GPT Image人形化→決定的分離・輪郭・QA(依頼合図「<pose>を3D技画像パイプラインで処理」) / Fable=台帳維持・バッチ指示・納品検収。検証: ドキュメントのみでsrc変更なし(auto-sim対象外)。specs該当なし(制作計画でありゲーム仕様ではない)、manifest該当なし(docsは配布対象外)。残: Keisukeの第1波撮影開始 / 撮影済みPNGが届き次第Codexへの加工指示。

追記(同日): Keisukeの質問「どのキャラで撮るか・背景はグリーンバック」を受け、台帳に**§8 撮影モデルとグリーンバック規定**を新設。人形化で見た目は消えるため基準は識別性とシルエットのみ — 撮影専用固定2体(攻め手=暗色系/受け手=明色系で人形化後のグレー明暗と揃える、両者ショートヘア・装飾なし単色レオタード・同身長標準体型)、緑系の衣装・髪禁止、フラット照明、16_powerbomb試作で2体確定後は変更しない。**肌は攻守で分ける(攻め手=褐色/受け手=色白、Keisuke発案)** — レオタード型では映るピクセルの大半が肌で、四肢が絡む関節技の分離ミスは肌同士の接触部で起きるため。

追記2(同日): **第1波の撮影が3便で全完了**。Keisukeがカスコで即日撮影し、技24セット(第1波19のうち撮影18+共用裁定2+P1先行ボーナス4)+M0 3構図=計78枚(全1680×1340・3パス・グリーンバック)を受領。全便を目視+寸法で検収し、codex側 `assets/moves/<pose>/` へ契約名で格納(受領台帳=INTAKE.md)。主な裁定: 要反転=DDT/脚四の字のみ(卍固めは現状維持) / ラストライド=パワーボム絵・インプラントDDT=DDT絵の共用(Keisuke) / cover-pin=片エビ固め本採用 / downed=あおむけ1本採用 / アキレス腱固めに新規ID 88_achilles_hold採番。**Codex委譲指示書 task-85 を作成**(人形化・分離、16_powerbomb試作先行→グレーRGB・線幅を固定→検収後に残りを流す。Phase A で必ず停止する契約)。残: Codex投入と試作検収。

## GLIMPSE_B統一を実施(要判断8クローズ): const新軸を正に一本化・平坦化解消・ガードテスト新設（2026-08-12・Fable）

下記精査エントリの提案(案A)をKeisukeが承認(「あなたの提案通りで進めましょう」=裁定3点とも推奨どおり)、即日実施した(29cc160)。

変更: **data.jsのGLIMPSE_B_LINESを単一const定義(新軸・286セル)に統一**(-885行)。再代入GL-01〜10+GL-02-hostile+push帯(28323〜28966)を撤去し、生存系統を移植——composed(鷹揚)42セル・GL-02-hostile13セル(新軸転置、`_default`→`standard`)・セッションFのGL-01分(新セル24+normal.polite追記4行)。**4月の文脈ズレ群は削除**——Tier3B 20セル(GL-02〜10のshy×丁寧/感情的×蠱惑、「お客さんがいっぱい」等)+pushのGL-02/04〜10分56行(「ここで決める!!」等の試合中文脈)+消費コードのない`_scene`84葉。GL-11/12帯はコメントごと原文保持。変換はスクリプト一括(スタイル踏襲・検証付き)で、セル数は予測どおり 227−20+42+13+24=286。

これで(1)**08-11口調全直しのGLIMPSE_B改訂が初めて実効化**(お嬢様改稿・私統一などブック承認済み文言)、(2)**平坦化バグ解消**——GL-01勝利の10コンボ実測が「全部同一」→「10種に分岐」、(3)ブック往復の盲点解消(ブラケット代入が残存0)。**ガードテスト新設 `test/glimpse-b-axis-guard-test.js`**: src全ファイルのトップレベル・ブラケット代入禁止+GLIMPSE_B単一定義+10コンボ分岐の回帰検査。

検証: node --check OK / **test/run-all.js 224/224 PASS**(新ガード込み) / **auto-sim 20季 ALL CLEAR**(1060週・違反0・Game over 0、スクリプト一括編集でフックが発火しないため手動1本)。付随して**ブック26冊を再export**(apply --dry-runで全冊改訂列空を確認してから。鷹揚6冊=composed初収録、ノーマル帯=hostile初収録、丁寧×内気/蠱惑×感情的=ズレセル行削除)+抽出MD再生成(08-11以降の累積未再生成分も追随)。

残: **移植59セル(composed42+hostile13+GL-01push分)は口調バイブル検品を通っていない**(ひらがな「わたし」等の違反が数件見えている)→検品タスクチップ起票済み / 実機確認は `docs/実機確認バックログ.md` に追加(B層がキャラ別に分岐して出るか)。specs該当なし(意図挙動「セルどおり分岐」への回復でありデータ内部構造の整理)、manifest該当なし(新規配布ファイルなし、テストは配布対象外)。

## GLIMPSE_B二重定義の精査完了: const側=承認済み改訂の正統・実効側は平坦化バグで分岐死（2026-08-12・Fable・裁定待ち）

roadmap要判断8(棚卸し09で発見)の精査。**コードは未変更**、結果は `docs/tone-bible/10-GLIMPSE_B二重定義精査-v1.md` に集約した。

主要な確定事項: (1)**歴代のブック経由改訂(03-16全行改訂・08-11口調全直し)は全部、死んでいるconst側に載っていた**——GLIMPSE_Bの承認済み改訂は一度も画面に出ていない。二重定義の誕生は2026-03-16(09acc2c、ブック適用がconstを再構築した際に旧再代入が残存)。(2)**さらに実効(旧軸)側は08-01のgetDialoguePool改修以降、全アーキタイプ×全性格が `normal._default` に落ちる平坦化状態**(実測10/10コンボ同一。旧軸トップの性格`normal`がarchKeysの'normal'に、内側の未改名`_default`がpersKeysの'_default'に誤ヒット。GLIMPSE_Aは`standard`改名済みで無事)——B層は現在テンプレ一本。(3)セルdiff実測: 一致166/相違33(お嬢様13は全直し前の旧文体が実効)/constのみ28/実効のみ127(composed42+GL-02-hostile13+セッションFpush72、**全てブック未収録=全直し未検品**)。(4)4月のセッションFpush(GL-04〜10)とTier3B穴埋め(GL-02〜10)は**試合中文脈で書かれておりB層文脈と完全にズレ**——平坦化が発火を握り潰していたため無害だった。(5)タスク③の答え: `extract-dialogue-parser.js` はドットパス代入しか拾わず**ブラケット代入(`['GL-01']`型、src全体でGLIMPSE_Bの11箇所のみ)とpush実行文が構造的に不可視**。exportはconst側を写し、applyはconst側に書き戻す(6295662のdiffで確認)。

**提案(案A・推奨)**: const側(新軸)を正に統一。composed42+hostile13を新軸転置で移植、文脈ズレセル群は原則削除、再代入・pushブロック撤去(約1,100行減)。統一だけで平坦化もツール盲点も同時に消える。**Keisuke裁定待ち3点**(案A可否/ズレセル削除可否/移植セルの検品タイミング)は10番ドキュメント§7。specs更新は該当なし(調査のみ)、manifest該当なし(src変更なし)。

## task-84 P1下り交渉カード: Codex実装を検算・マージ、給与の下り坂 全工程完了（2026-08-12・Fable+Codex）

Codex CLIへ直接投入(`codex exec --full-auto`)して実装させ、diffレビューと検算の上mainへマージ(b86080a)。CodexはsandboxがworktreeのGitメタデータ書き込みを塞ぎ**コミットのみBLOCKED**だったため、レビュー後にFableが3粒度(エンジン/セリフ343本/UI+auto-sim+テスト)でコミット代行した。

検算の要点: (I-2)据え置き予約`salaryDeclineHold`はrefixRosterが吸収後に加算し clamp[0,100]、消費後フィールド除去(旧セーブ互換)。据え置き選手の給与総額=前給維持を数式で確認。(I-1)昇給側の発生は127→122件(−3.9%)/132→119件(−9.8%)で±10%以内 — declineカードが4名枠に同居する設計どおりの減少。(I-4)厳格清算はbonus=0+trust−10、調整後trust<40のみ40%エスカレート(コード確認)。セリフ343本は原稿(承認済み草案)と突き合わせ — 本数一致・マーカー混入なし・Keisuke改3件を原文確認。SALARY_PARAMS無変更をdiffで確認。検証: 単体テスト2本PASS/npm test 224/224/fixture再計測40季(昇給122件=Codex報告一致、gap分布はP0帯を維持、ALL CLEAR)。

締め: **`specs/salary-decline-spec-v1.0.md` へ昇格**(P0サイクル/P1カード/P2較正値/不変条件7項を成文化、INDEX追記)。セリフ編集ブックを再export(20,396行、新343本込み。「あたし」修正セッションのexport直後だったため差分は新フェーズのみ)。実機確認5点は `docs/実機確認バックログ.md` へ集約。proposal v0.2は設計経緯の記録に降格。**給与の下り坂はこれで全工程完了** — 残はKeisukeのspecs diff確認と実機確認のみ。


## roadmap要判断7(COMMON1/COMMON5に口調軸が無い・72行)をクローズ — 08-01解消済みを実測確認（2026-08-12・Fable）

棚卸し09(08-12)で「roadmapの記述とコードが食い違う」と起票された課題チップの消化。**結論: コードもExcelも解消済みで、roadmapの記録だけが更新漏れだった。**

**経緯の特定(git履歴)**: 2026-08-01 の c44309c(08:55)が worklog/roadmap に「残る72行=COMMON1/COMMON5のleaderDemand・leaderQuoteA」を記録し、その33分後の 5dde838(09:28「選手が喋るのに口調軸が無かった129箇所を解消」)が当の2テーブルの第二階層を性格6種→**話者の口調7種**へ入れ替えていた。記録→解消が同日同朝に連続したため、roadmap側の項目だけ据え置きになった。

**Excel実測(読み取りのみ・exportは破壊的なので不実行)**: `tools/dialogue-workbook.js` の `readWorkbookSheets` でセリフ編集/配下の全48ブック20,180行を走査。「archetype列が空で性格列のみ埋まっている行」は**0行**(08-01時点の72行→0)。派閥.xlsx の当該行は leaderDemand 49行(派閥6+`_any`×口調7)+leaderQuoteA 42行(派閥6×口調7)=**91行すべて archetype列に口調が入っている**。personality列が空なのは第二軸が性格→口調に置き換わった新構造の仕様どおり。

触ったファイル: `docs/game-system-roadmap.md`(要判断7を解消済み表記へ1行更新)、`docs/worklog.md`(本エントリ)。計数スクリプトはscratchpad(セッション限り)。specs更新なし(仕様変更なし・記録の訂正のみ)、manifest変更なし、コード変更なしのため能動auto-simなし。残課題なし。

## 「あたし」棚卸しの承認反映: 19出現を修正・xlsx書き出し・GLIMPSE_B二重定義を発見（2026-08-12・Fable）

Keisuke承認(①直し漏れ11=オールOK・②_default 8=今回一緒に直す)を受け、**data.jsの19出現を修正**(あたし→私/私ら、10422のみ一人称を落とす改稿)し、`tools/dialogue-workbook.js export` で**原本xlsxへ書き出した**(ブックはクリーン状態を確認してから実行——破壊的書き出しルール順守。変更ブック: その他.xlsx / ヤンキー×強気.xlsx)。検証: 残存 `grep "あたし"` は103行→**86行**(全て該当者なしセル=想定どおり)、`node --check` OK、全ブック走査で旧文言残存0・新文言の所在確認(ヤンキー×強気/ノーマル・その他・標準×強気)。

**反映時の発見——GLIMPSE系の二重定義**: (1)`GLIMPSE_A_LINES` のtrust系はconst(24264〜)の後に再代入(25669〜25801)があり**再代入側が実効**。分類1のGLIMPSE_A分4件は死にコピーの残存で、実効文言は08-11に「私」化済みだった(今回で両コピー一致)。(2)`GLIMPSE_B_LINES` は逆で、`GL-01`〜`GL-10`の**再代入(あたし版だった側)が後勝ちで実効**、constの新軸セル群(標準×強気の「楽勝！私に勝てるわけないでしょ」等)が**死んでいる**。つまり_default 8出現+GL-06/GL-08のヤンキー2件は実際に画面に出ていた「あたし」で、今回の修正が本命だった。HEAD時点のブックにあたし版が無く私版があった不一致もこれで説明が付く(exportはconst側を拾っていた)。二重定義の精査はroadmap要判断8として起票+タスクチップ発行。

残: Stopフックのauto-simバッチ(ターン末自動)。specs更新は該当なし(セリフ文言のみ・仕様構造は不変)。**実機確認はKeisuke指示(2026-08-12「とりあえず通して、あの時期の確認は溜め込んでおいて」)により保留とし、新設の `docs/実機確認バックログ.md` に他の未消化分と合わせて集約。mainへマージ済み。**

## 棚卸し: data.js「あたし」残存103行の仕分けレポート作成（2026-08-12・Fable・レビュー待ち）

口調バイブル全直し(08-11)後に残る `grep -n "あたし" src/data.js` 103行(111出現)を全数仕分けし、**docs/tone-bible/09-棚卸し-あたし残存103行-v1.md** にまとめた。**修正は未実施**(Keisukeレビュー承認後)。

結果: **直し漏れ11出現**(ヤンキー×強気7・ヤンキー×ノーマル2・口調軸のみ行2。うち1件は`RIVALRY_MATCH_REACTION`へのpush実行文——「セリフは実行文でも足されている」の型) / **COMMON1/COMMON5系=0件** / **該当者なしセル92出現**(56番裁定で対象外。ヤンキーの内気35・真面目26・感情的23・寡黙7+クール×感情的1) / **`_default`軸なしフォールバック8出現=要判断**(GLIMPSE_Bのbold帯。標準×強気7名らに実際に発火するため、据え置くと画面に「あたし」が出続ける)。

依頼前提の訂正2点: (1)例示された9260行(`raise_open.delinquent.emotional`)はヤンキー×感情的の在籍0名=該当者なし行で直し漏れではない。(2)2032〜2211行はCOMMON1/COMMON5ではなく`F07_LINES.leaderDemand`(話者口調軸あり)で、残存は全て該当者なし性格の行。本物のCOMMON1/COMMON5(3074〜/3223〜)に「あたし」はない——さらにコード側は08-01に第二階層が話者口調へ入れ替え済みに見え、roadmap「口調軸が無い・72行」と食い違うため別課題チップを起票。

方法: 各出現の所属キーをインデント逆走+行内キー位置スキャンで機械特定し、曖昧箇所は目視確認。在籍セル判定はALL_CHARS全127名の`personality`×`archetype`集計(在籍34組=ワークブック34冊と完全一致)。傍証として同一テーブルの在籍セル行が「私」化済みであること(例: 2031「私らでいきますよ」)、`getDialoguePool`の両レイアウト対応(data.js 15256〜)、カタカナ「アタシ」残存0件も確認。

残: Keisukeレビュー(直し漏れ11の修正案+`_default`8の扱い裁定)→承認後に data.js修正+原本xlsxへ書き戻し(反映→書き出しの順序厳守)→受け入れauto-sim 1本。

## 口調バイブルをspecs昇格: dialogue-tone-spec-v1.0（2026-08-12・Fable）

口調バイブル案件の最後の残タスク。`specs/dialogue-tone-spec-v1.0.md` を新設し、INDEX.md に追記した。二軸構造(archetype第一/フォールバック規則)・アンカー制・**全セル共通の鉄則10項**(個体マーカー禁止41/一人称=漢字「私」53+内気例外+お嬢様「わたくし」採用実績/二人称55/対社長敬語59/中性カジュアル許容/身体・抽象メタファー禁止(08-12新裁定)/固有名詞禁止/悲壮度較正/表記/吹き出し長)・属性別骨格サマリ・スコープ(個人セリフ57/該当なし56は対象外)・執筆運用フローを成文化。口調シート34枚+アンカー表+裁定リスト00は規範文書として本仕様の一部に位置づけた。**残: Keisukeのspecs diff確認**(承認後、口調バイブル案件はKeisuke実機確認のみ)。task-84実装中のCodexとファイル衝突なし(specs/とdocs/のみ)。


## セリフ343本Keisuke承認・task-84(P1下り交渉カード)起票（2026-08-12・Fable）

レビュー第1弾でKeisukeから差し戻し11本(原文指定3件=お嬢様bold3本、意味不明指摘4件、同型スイープ4件)。**「体が言う/鏡が教える/走る/呼吸」型の身体・抽象メタファーが軒並み通らなかった**ため執筆方針としてメモリ化(feedback_dialogue_no_abstract_metaphors)。お嬢様帯の「わたくし」はKeisuke自身の改稿で採用実績が付いた。反映後「OK、全部いいよ」で**草案343本が承認確定**(裁定論点7件は草案どおり、境界線2本も残置)。`docs/salary-decline-dialogue-draft-v0.1.md` が実装のセリフの正。

D=P1実装の指示書 `docs/codex-tasks/task-84-salary-decline-cards.md` を起票(bpRatio判定/trust×マトリクス/据え置き予約フラグ→offWeek3消費/枠2枚/|gapRatio−1|ソート修正/セリフ7フェーズ移植/UIバッジ/auto-sim自動応答。数値目標と不変条件I-1〜I-7を対で記載)。次はCodexの実装待ち → Fable検算・マージ → specs昇格。

## 給与の下り坂 B=P2経済較正・C=セリフ起案 完了（2026-08-12・Fable+Opus）

**B(P2経済較正): 結論=SALARY_PARAMS再スケール不要(現行値のまま採用)**。pre(7772c53)/post(P0マージ後main)を同一シード40季×2本(7919/42)の統制比較で計測した。総支出(更改直前の週給総額・季平均)はseed7919でx1.00(512→514万)、seed42でx1.20(456→547万)とシードノイズ範囲。資金は両シードとも増加基調のまま(40季末 pre102万/79万 vs post90万/96万)、最低資金も同水準、破産0。退団・引退も前後同一(最終年齢中央値27→26、在籍季平均9.4-9.5→8.3-9.2)。§7が警戒した「fair支払いで総支出~1.5倍」は起きなかった——**吸収がラチェットを消した分(昇給総額3265万→1466万/週分に半減)が基本給の適正化と相殺**したため。gap分布の統制比較はgap≥1.3が92.3%→38.1%(7919)/90.1%→34.3%(42)、下り帯計9-10%出現(下り帯のwear>0率96%)。採用値(=無変更)の最終確認として100季×seed1001を1本実行し**ALL CLEAR(5300週・違反0・Game over 0)**。計測ログ・生JSONはscratchpad(セッション限り)、要点は本エントリに全記載。

**C(下り交渉セリフ起案): 343本の草案完成 → Keisukeレビュー待ち**。`docs/salary-decline-dialogue-draft-v0.1.md` に集約。7属性並列のOpus起草(口調バイブルシート+00-裁定リスト+既存raise_open文体を参照させた)→Fable全文レビュー。新フェーズ7種(decline_open/accept/hold/strict、decline_voluntary_open/hold/accept)×7属性×性格7種、各セル1本。実在しないセルは骨格外挿+`※実在セルなし`付き。レビューで裁定が要る論点7件(お嬢様の「！」/ヤンキー「あんた」1件/蠱惑「お店」比喩/丁寧shyの卑屈際どい線/標準quietの声のシート準拠化/鷹揚quietの意図的短文/新規セリフでの伝法の濃さ)をドキュメント冒頭に明記した。

**副産物の発見**: data.jsに「あたし」103箇所残存(raise_open.delinquent.emotional等は全直しの取りこぼしの疑い、派閥COMMON1/5系「あたしら」はスコープ外と記録済みの系統)。棚卸しを別タスクチップで起票済み。

残: **Keisukeのセリフ草案レビュー(裁定7件込み)** → D=P1実装のtask起票(下り交渉カード+UI+auto-sim対応、B/Cの結果を反映)。

## task-83 給与再固定P0: Codex実装をレビュー・検算してmainマージ（2026-08-12・Fable）

Codexが `codex/agent-workspace` に実装した task-83(再固定のoffWeek3移設+昇給吸収+入団経路監査、d38a190/c84b143)をレビューし、不変条件を自分で検算してからmainへマージした(c5e1683)。diff は management.js +51/-11 と新規 `test/salary-refix-test.js` の2ファイルのみで、SALARY_PARAMS・UI・セーブ形式は無変更(指示書の変更可範囲どおり)。

検算の要点: (**I-1**)offWeek2の交渉早期returnは`offWeek:2`保存→次tickで3に進むため、ブロック先頭の`Engine.contract.refixRoster`は交渉の有無に関わらず毎季ちょうど1回走る(単体テストが計数フックで両ケース検証、交渉判定が旧契約値のまま=§3.3も検証済み)。(**I-2/I-3**)吸収の数学(`absorb=max(0,newBP−oldBP)`、伸びた選手=max(前給,適正給)±1、衰えた選手=適正BP+bonus)は`getSalary(f,{})`がtitleBonus/bonusを含まないことを実装で確認、テストも直接検証。(**I-4**)加入経路を自分で全数列挙——app.js 5048(ドラフト)/5182・5359(FA)/5385・5519(スカウト)/5408(引き抜き)、ui-common.js 6372(スカウト)、management.js 14634(headless引き抜き・直接スタンプ併用)/14820(交渉移籍・14817直接スタンプ併用)は全て`Engine.career.addEvent`の加入イベントフック(debut orgId='player' / transfer toOrg='player')でスタンプされ、auto-simのheadlessドラフト経路は候補生成時スタンプ(15341)で担保。興行ゲスト(app.js 6480等)は一時所属で更改を跨がずスコープ外。(**I-5**)debut/transferイベントは全て加入瞬間にのみ積まれ、季中の再スタンプ経路なし。(**I-6**)validateGameState違反0。AI団体へ落札候補のスタンプが混入するが、`calcFee`は現在OVR/人気ベースでcontractOVRを参照せず無害(v0.2 §3.5の既知周辺課題のまま)。

検証: `test/salary-refix-test.js` PASS / フィクスチャ再計測(40季×seed7919)でCodex報告と完全一致——**gap≥1.3が92.7%→36.4%**、下り帯が初出現(下りmid 9.2%+下りlarge 1.8%、下り帯31件中30件がwear>0)。残存gap≥1.3の103件中wear>0は15件のみで「残りは若手の成長由来」の説明も裏付けた。マージ後main: **npm test 223/223 PASS**(Codex環境の3失敗はmain側で解消済みと確認)、auto-sim 20季 ALL CLEAR。**Keisuke裁定(2026-08-12): 25%目標未達は問題なし——調整目標であり安全条件ではない。基準はP2経済較正へ移す**。

残: **B=P2経済較正(Fable・次工程)** — fair支払い世界の総支出増を計測しSALARY_PARAMSスケール要否を判断 → C=下り交渉セリフのOpus起案 → D=P1下り交渉カード実装。specs昇格はP1/P2完了後にまとめて行う(task-83指示書もそれまでアーカイブしない)。

## セリフ全直しの本番反映完了: 866件をソース書き戻し・222/222テストPASS・auto-sim ALL CLEAR（2026-08-11・Fable）

Keisukeのブック直接修正(数箇所)を取り込んだ上で `tools/dialogue-workbook.js apply` により**改訂863件+手動3件をsrcへ反映**(data.js/victory-lines.js/tag-battle-lines.js/battle-lines.js/data-faction-dialogue.js/battle-engine-main.js)。EVENT_LINES_BY_KEYミラー46件は参照構造のためスキップ(実体側で反映済み・取りこぼしゼロ)。名簿(在籍キャラシート)は移動8名分を手動同期済み。

反映ゲート(test/run-all.js)で発覚した問題と対処: (1)**セリフ固定テスト4本**は参照元ドラフト文書(autumn-war/bitter-prematch/heat-visibility/signing-greeting)との同期が必要→改訂ペアで文書側を更新(Keisukeの直接修正2行も文書へ同期)。(2)**HEAT実体3行**はミラー行にのみ改訂を書いていたため実体へ手動反映+ブック修正。(3)**既存破損3本**: archetype人数テスト=セル移動8名を反映して更新 / showprep画像サイズ=bba6ba3の意図的変更(解決済み行46px→108×162)にテストを追随 / **prospect-assessment=13aa69e(成長リバランス)以降「FAは経済を動かさない」不変条件が破損**(FA超逸材0→10件・FA逸材32%帯→44.7%)——仕様とするかクランプするかはKeisuke裁定待ちとしてFIXME付きで暫定緩和(worktreeバイセクトで犯人特定済み)。

検証: **test/run-all.js 222/222 PASS、auto-sim 20シーズン ALL CLEAR**。反映後に `export` も実行し、セリフ編集ブック全冊を正規状態(新・現在列/改訂列空欄/名簿最新)へ再生成。

追記(同日): **prospect裁定確定——「リバランス後の仕様として認める」**。FIXMEを除去し、FA分布の新実測(100シード: 超逸材1.4%/逸材44.7%/有望39.1%/原石14.7%)を正式較正値としてテストに反映。Keisukeの指示によりmainをpush。残: Keisuke実機確認 / 口調バイブルspecs化。

口調バイブルを正とした共通セリフ全直しを1日で完走。検品(セル別エージェント並列・口調シート照合)→機械修正即書き込み→声の書き直しはOpus起草→Fableレビュー→Keisuke承認→zip+XML直接方式でxlsx改訂列(G)へ書き込み、のループを7帯・34セルで回した。総合成績: **重160・軽855(違反率8.8%)、約910セル記入**。「現在」列は全冊無傷、バックアップはscratchpadに保存。

主な成果: 汚染区画4つの特定と書き直し(標準×強気の派閥/ドーム男口調、標準×感情的と鷹揚×感情的の秋の陣、蠱惑×強気のF07友達口調) / FA卑屈の全帯一掃 / 一人称の全帯統一(漢字「私」、内気帯のみひらがな例外、「俺」3件・あたし系90件超を解消) / victory-lines.js:974の文字化け等の実バグ修復。

セッション中の主なKeisuke裁定: ヤンキー帯も私統一(アタシ廃止・馴染ませ用ひらがな可) / 鷹揚×強気は中性語尾(「〜なんだ」「だよ」、女性的アクセント控えめ) / お嬢様×ノーマルは質実+柔らかい品(硬い体言止めNG) / 「虫けらを叩き潰すのは気分がいいわね」は原文維持 / 差し戻し計6件(78/79/488/320/329/嬢強気51)。

残: **Keisukeの反映(Excel改訂列→データ取り込み)→実機確認** / 口調バイブルのspecs化 / 個人セリフ(victory-lines等)は対象外のまま(57番裁定)。詳細レポートは docs/tone-bible/02〜08。

## 口調バイブル: B/C項裁定+標準×強気パイロット完走・68セル書き込み（2026-08-11・Fable）

B/C項の裁定を口頭で大量に受けて反映（19〜31・33〜35・41・53・54ほか）。**41番「個体固有の口癖・自称・異名は共通セリフに侵食させない」を全タイプ共通の鉄則化**、一人称は「共通セリフでは極力出さない+必要なら漢字『私』」で全帯統一。標準×強気の裁定: 語尾は中性カジュアル許容（「今時の女性が普通に使う『〜だよ』はOK、柄の悪い男系のみNG」）、強気系は対社長でも敬語不要。

パイロット実務: 標準×強気568行を検品（重40/軽87、派閥・ドーム系に男口調が集中、一人称「あたし」19件+「俺」1件）→Opus起草→Fableレビュー→Keisuke承認（「これ以外は全部OK」）→**確定55行+表記統一13行=68セルを標準×強気.xlsxの改訂列(G)へ書き込み**（zip+XML直接方式・G列のみ変更・バックアップは scratchpad に保存・既存データ上書きなしを検証済み）。対社長帯の脱敬語23行+起草漏れ528は追加起草済みでレビュー待ち（docs/tone-bible/03-改訂案-標準×強気-v1.md のv1.2節）。残裁定は23/29/55の3件。

同日中に**標準帯7セル(3,369行)の検品を完走**。強気94セル→ノーマル/真面目36セル(差し戻し5件込み・許容幅較正2を獲得)→残り4セル128セル(機械101+改訂27)の計**258セルを改訂列に記入**。感情的の秋の陣ブロック(408〜419)が強気同様の伝法汚染区画だった。副産物: **victory-lines.js:974の文字化け「仲��」を発見しバイト修復**(配布コードの実バグ)。詳細は docs/tone-bible/02〜05 の検品ファイル群。保留: 内気帯のひらがな「わたし」20箇所(どもり表現とセットの意図的表記に見えるため漢字統一の例外を提案中)。

## 口調バイブル始動 — 全34セルのアンカー確定+口調シート型サンプル（2026-08-11・Fable）

全セリフ見直し(全直し)の前段階として、属性×性格セルごとに「口調の正」となるアンカー選手をKeisukeの口頭指定(音声入力3ターン)で収集し、`docs/tone-bible-anchors.md` に34セル全表を記録した。内訳: 確定31 / こだわりなし1(クール×ノーマル、既存セリフから草案→レビューで決める) / 仮2(標準×内気=朝比奈ひかり、標準×感情的=吉野萌子、単独所属の自動仮置き)。データ整合も確認: data.js抽出127名の属性×性格34セルが `セリフ編集/キャラタイプ別/` のxlsx 34冊と完全一致。

続けて口調シートの型サンプルとして `docs/tone-bible/蠱惑×ノーマル.md`(草案v0.1)を起草。構成=口調の骨格(一人称/二人称/語尾/リズム/テンション帯/語彙/禁句)+性格変調+アンカー見本+個体差メモ+記入欄。このセルは長谷川レオナがセルから大きく外れる実例を含み、例外リスト運用の判断材料になる。

型サンプルのレビュー中に裁定が2件出た: **長谷川レオナ(id66)を蠱惑×ノーマル→蠱惑×真面目へセル移動**(「蠱惑的な雰囲気とセクシーな見た目だが、根は真面目」、personality normal→earnest)、**山本理香(id121)を蠱惑×ノーマル→鷹揚×強気へセル移動**(「確かに妖艶じゃないかも」を受け移動先はFable判断で委任。大人の余裕+打ち合い好きの全力主義が菊池璃子と同帯。personality normal→bold / archetype seductive→composed)。蠱惑×ノーマルは橘玲美・片桐ありさのサディスト系2名になり凝集度が上がった。これによりセリフ選出プール(personality×archetype キーの全系統)に加え、relationships の絆/因縁相性補正・決断傾向(DECISION_PERSONALITY_MULT)等も真面目側の挙動になる。既存セーブは選手データがセーブ内に保持されるため反映されない可能性が高い(新規開始から)。

同日中に**残り33セルの口調シートを7属性並列のエージェントで量産し、全34セルが完成**(docs/tone-bible/ 配下、属性ごとに6コミット)。各草案は「実セリフに無いことを創作しない(一人称不明は要記入と明記)」の鉄則で書かせ、Fableが全引用を抽出データと突き合わせて捏造ゼロを確認してからコミットした。シート群から**セル移動候補18名**(松岡綾乃/割田久美/池辺マリ/三橋ふみえ/西園百合香/海老名栞/小森さなえ/南谷杏/レオナ・O/楠木なぎさ/八重樫舞/福浦理乃/湯本ほたる/鴨志田ルーシー/穴澤ほのか/黒江舞/白銀麗子/富士見ヶ丘遥)と骨格裁定10件・一人称要記入21名が浮上し、`docs/tone-bible/00-裁定待ちリスト.md` に総覧を集約した。

同日、**A項(移動候補18名)とD項をKeisukeが口頭裁定、全反映済み**。移動6名: 松岡綾乃→丁寧×内気 / 海老名栞→蠱惑×お気楽 / 小森さなえ→標準×お気楽 / 南谷杏→標準×ノーマル / 穴澤ほのか→蠱惑×お気楽(暫定、「表面は丁寧で優しい、根はすごく悪い女」) / 白銀麗子→丁寧×真面目(暫定、「設定はお嬢様だが丁寧語で。強気ではない」)。残留12名(黒江舞は「二重人格みたいなところがある」でギャップ保持のc案)。D項: 斎藤麻衣はStrikerが正(データは既にStriker)、「サブミッション技術なら…」セリフの方を全直しで修正。data.js 6行変更+裁定リスト・アンカー表・関係10シートを追随更新。丁寧×強気は大久保桃子1名所帯になった。

キャラタイプ別xlsx 35冊(タイプ別34+_該当者なし)の棚卸しも完了(読み取り専用エージェント)。**全冊同一構造(在籍キャラ/全セリフの2シート)で、セリフ行は `CUTIN_LINES.atk.standard.normal[1]` のようにタイプにのみ紐づき、キャラ個人紐づけはゼロ**——つまりセル移動8名に伴うセリフ行の引っ越しは不要。在籍キャラ名簿はスクリプト生成(inlineStr形式)なので、次回の書き出しでdata.jsから自動更新される(書き出し前に未反映改訂の反映を忘れないこと=破壊的書き出しルール)。全直しの母数は**約14,767行**(タイプ別11,590+該当者なし3,177、テーブル約100種)。

残: B項(骨格裁定10件)・C項(一人称・二人称)のKeisuke裁定 → 反映してシートv0.2化 → specs化 → 全直し実行計画(約14,800行・セル単位・委譲体制) → セル単位で全直し。

## LLMセリフ生成ブラインドテストを作成（2026-08-10・Fable）

Keisukeの「安価になったLLMを組み込んでセリフを動的生成できないか」という相談を受け、議論(結論: 今作のランタイム組み込みは非推奨=オフラインzip配布・レイテンシ・再現性・レビューゲート不在のため。現実解は執筆時LLMパイプラインの拡大、ランタイム生成は次回作で最初から設計)の判断材料として、安価格帯モデルの現在地を測るブラインドテストを作成した。ゲーム本体のコードは未変更。

口調の距離が最大になる5キャラ(堂前ユキ/橘玲美/生駒エリカ/大河内紗代子/宇田川里奈)を選定。各キャラの勝利セリフ3本のうち1本だけを見本としてHaiku(組み込み時の直接API換算≈0.2円/回)に渡して4本生成させ、生成順の先頭3本を無加工採用。温存した実セリフ2本と混ぜてシャッフルした(手書き10本+AI産15本=25本)。採点シートは `docs/llm-dialogue-blind-test/blind-sheet.md`、解答・実験条件・Fable所見は同フォルダの `answer-key.md`(採点後に開く)。

2026-08-10 Keisuke判定: **なし**。ランタイムLLMセリフ生成は当面見送りで確定。今作は現行路線(手書き+執筆時LLM草案→レビュー→焼き込み)を継続し、次回作の設計時に価格・品質を再測定して再評価する。

## 給与の下り坂 v0.2 — 再固定バグ発見・設計改訂・task-83起票（2026-08-10・Fable）

v0.1承認（08-08）を受け、実装詰めの前にベースライン計測を実施。`test/auto-sim.js` に読み取り専用の給与計測フィクスチャ（`WM_SALARY_FIXTURE=1`、更改直前の全ロスターgapRatio等を記録、`WM_SALARY_FIXTURE_OUT`でJSON保存）を追加し、40季×seed7919で計測した。

**重大発見: 契約OVR制の再固定（management.js:16832）は一度も実行されていない。** 季をまたぐ給与変動254件の100%がsalaryBonus増減だけで説明でき、gapRatio≥1.3が選手シーズンの92.7%を占めた。機序はコードで確認: tickWeekはオフ中offWeekを無条件インクリメント（16504）するため、交渉発生季は早期return（16825）→再入時offWeek=3となり、offWeek===2ブロック末尾の再固定がスキップされる。再固定欠落自体がgapを増大させ毎季交渉を発生させるので、一度外れると恒久的に走らない。これが「給料上がりっぱなし・ピーク過ぎても昇給要求が止まらない」の根因（基本給が新人契約時のまま固定され、昇給ラチェットだけが動く）。再固定が働いた場合のgap分布を再構成すると、下り帯（≤0.90）が全体44%・wear>0では71%現れ、減俸ドラマの母集団はシミュが既に生んでいることも確認した。

設計をv0.2へ全面改訂（`docs/salary-decline-proposal-v0.2.md` が正、v0.1はsuperseded注記）: P0=再固定をoffWeek3先頭へ移設し毎季確実に1回実行+昇給吸収（absorption: 適正給上昇分をsalaryBonusから差し引き、昇給の二重乗りを解消）+入団経路の契約値監査 / P1=下り交渉カード（判定は査定比bpRatio、trust75+は自発的減俸申し出、「据え置き（温情）」の選択、季2枚まで） / P2=経済較正（fair支払い世界の総支出増をSALARY_PARAMSスケールで吸収するかは計測後判断）。P0実装指示書 `docs/codex-tasks/task-83-salary-refix-and-absorption.md` を起票（数値目標と不変条件I-1〜I-6を対で記載、SALARY_PARAMS変更禁止）。

## 3Dカスタム少女を使う技画像制作パイプラインを計画化（2026-08-09・Codex）

技画像の実装・画像制作には着手せず、既存のP0カバレッジ計画とReplay統合仕様に接続する制作パイプラインを文書化した。人間は3Dカスタム少女で同一カメラ・同一解像度の2体完成構図と、完全分離に必要な攻め手／受け手の単体パスを撮影する。CodexはGPT Imageでポーズ・カメラ・接触位置を保つグレー人形へ一度だけ変換し、以後はローカルの決定的処理で分離・透過・master由来の輪郭抽出・命名・原本比較QAを行う。

再処理用の`<pose>_source.png`／`<pose>_master.png`と、最終の`<pose>_attacker.png`／`<pose>_receiver.png`／`<pose>_outline.png`を明確に区別した。ゲーム配置時だけ`receiver`を`defender` WebPへ対応付ける。3Dカスタム少女のUI自動操作は、DirectX／独自UIでの安定性を別途確認するまで前提にしない。詳細は `docs/move-illustration-3d-capture-pipeline-v0.1.md`、ロードマップは「撮影準備・未着手」とした。

## 給与の下り坂設計 v0.1 起案（2026-08-08・Fable）

「給料が上がりっぱなしで、ピークを過ぎても上がり続ける」というKeisukeの指摘を受け、実装を精査して設計提案 `docs/salary-decline-proposal-v0.1.md` を起案した（コードは未変更・レビュー待ち）。

原因分析: (A) 契約交渉の gapRatio 段階に下り側（<1）の分岐がなく「上げる or 維持」しかない、(B) 昇給が salaryBonus に積まれた直後にオフ第2週の contractOVR/Pop 再固定で base も適正給まで上がる二重乗りラチェット、(C) popBonus は人気が落ちない限り高止まり（これは説得力があるので削らない）。base 自体は再固定により衰えへ1季遅れで追従しており、下りの土台は既にある。

提案の柱: ① gapレベルを5段階に拡張し（decline-mid ≤0.90 / decline-large ≤0.75）、trust×declineマトリクスで「自発的減俸申し出（trust75+・季1〜2名）／社長発の減俸提示（trust40〜74）／退団リスク込みの提示（trust<40）」を契約更改に追加。減俸は salaryBonus を削る形で下限は適正給。② 再固定時に適正給の上昇分だけ salaryBonus を吸収してラチェットを解消。不変条件6項目と較正計画（40季グリッド→100季1本）を対で記載。



Keisukeの依頼で Claude Code の使い方を遡って分析し、運用環境を6点改善した。ゲーム本体のコードは一切触っていない。

1. **auto-simフックをターン末バッチに再設計** — 従来はエンジン系5ファイルの Edit/Write のたびに100シーズンが走り、「一区切りで1回」方針(feedback_auto_sim_policy)と矛盾していた。PostToolUse は構文チェック(node --check)+dirtyフラグのみに軽量化し、新設の Stop フック(`auto-sim-stop.sh`)がターン終了時に1回だけ5シード×20年を実行する。違反時は exit 2 でその場修正へ。
2. **プロジェクトスキル4本を新設**(`.claude/skills/`) — finish(完了フロー)/release(配布梱包)/ui-check(UI頻出違反7項目)/codex-task(委譲指示書テンプレ)。Keisukeはスキル名を呼ばない前提で、Claudeが該当場面で自発発動する運用(CLAUDE.mdにも明記)。
3. **許可リスト整理** — `.claude/settings.local.json` の allow 194件を34件の前方一致ルールに整理。CLAUDE.mdのpush禁止と矛盾していた `git push` 許可、`git reset`・`taskkill` 等の危険/断片ルールを削除。
4. **specs索引の外部化** — CLAUDE.md内の約85行の索引テーブルを `specs/INDEX.md` へ移動(毎セッションの読み込みコスト削減)。CLAUDE.mdは参照のみに。
5. **メモリ棚卸し** — auto-sim関連feedback3本を1本に統合、実装完了済み・仕様書化済みの旧メモリ4本を削除、索引漏れ3本を復帰。
6. **worktree掃除** — 回収済み(2026-07-24)のagent worktree 8本を削除。念のため未コミット差分は `Downloads/wrestle-manager-worktree-patches-20260806/` にパッチ退避済み。中身がmainに反映済みであることを確認後、Keisukeの了承を得てフォルダごと削除してよい。

## 自団体タイトル呼称を「団体王者／団体王座」へ全面統一（2026-08-03・Codex）

自団体のトップベルトを「世界王者」「世界王座」と呼んでいた残存表現を全面監査し、戴冠・節目防衛モーダル、王座空位／持ち出し表示、奪還目標と結果メッセージ、ランキング総評、新聞のテスト素材、現行仕様書とUIモックアップを「団体王者／団体王座」へ統一した。戴冠モーダルの役割表示は「新・団体王者」「団体王者・防衛成功」「挑戦者」「前・団体王者」とし、本文も「団体王座戦」に変更した。禁止方針そのものを記録した設計メモだけは旧語を引用として残している。

セーブ互換性に関わる `titles.world`、`worldTitleUnlocked`、`getWorldChampion()` 等の内部識別子は変更せず、プレイヤーに見える表現と設計上の呼称だけを修正した。今後 `src` に「世界王者／世界王座／世界戦線」または `WORLD CHAMPION/TITLE/CHAMPIONSHIP` が再混入すると失敗する `title-terminology-test.js` を追加。`npm.cmd test` は **212/212 PASS**。

## 興行準備タッグ枠の顔サイズ統一（2026-08-03・Codex）

興行準備画面のタッグ枠だけ顔アイコンが40pxで、シングルの標準カード72pxより明らかに小さかったため、タッグ4選手も72pxへ統一した。タッグの2段構成、選手選択・プロフィール導線、名前・OVR・体調・集客力の表示は変更していない。72pxは興行カード固有のサイズとして一覧用24/40/52pxの梯子から用途限定で除外し、`mobile-layout-test.js` と `u7-roster-list-safety-net-test.js` で固定した。

## v1.25 トライアル版／DL商品版の配布梱包（2026-08-03・Codex）

バージョン表記を1.25へ更新し、`release/manifest.json`、タイトル画面、セーブメタデータの3か所を統一した。承認済みのバトル観戦画面刷新とシングル／タッグの表示・演出調整を含む同一ソースから、DL商品版 `WrestleManager_1.25.zip` と3シーズン制限のトライアル版 `WrestleManager_1.25_Trial.zip` を規定スクリプトで生成した。各ZIPは941ファイル、約60.3MB。開発専用JS2本とそのHTML参照、試聴・編集用ファイルは配布対象外のまま維持した。

検証は `npm test` 211/211 PASS。両ZIPを展開する `verify-package.ps1 -CheckOnly` で、manifest記載33ファイル、`image`／`bgm`の2アセットディレクトリ、製品版／体験版フラグ、体験版3シーズン制限とREADME説明、開発専用ファイル非混入を確認した。最終配布物は通常ローカルの `release/dist/` へ生成する。

## 通常興行結果のタッグ画像サイズ統一（2026-08-03・Codex）

通常興行の結果一覧ではシングル選手がSサイズ（108×162px）なのに対し、タッグだけ各選手がLサイズ（150×224px）で表示され、タッグ行の視覚量が過大になっていた。タッグ結果の各選手をシングルと同じ108×162pxへ統一し、2人を重ねて1つのチーム枠に収める構造、勝敗色、名前・OVR、プロフィール導線は維持した。試合前編成など別画面のタッグ画像サイズと、試合シミュレーションは変更していない。

## シングル観戦リング上端の背景欠け修正（2026-08-03・Codex）

シングル観戦では左右の選手パネル内にある試合中セリフ予約枠（高さ52px）が旧カード用の黒背景を保持し、リング背景の上端を左右から覆っていた。ライブリング内に限って予約枠を透明化し、背景画像が枠全面へ常時表示されるよう修正した。吹き出しの予約高さ・表示順・セリフ内容、キャラクターの位置とカメラ演出、Replayフレームと数値シミュレーションは変更していない。

## 観戦リングのDANGER文字削除（2026-08-03・Codex）

HP低下は上部HPバーと選手シルエットの危険色演出で把握できるため、リング左上へ意図せず露出していた英字 `DANGER` をシングル／タッグ双方から削除した。HP判定・危険域判定・Replayフレーム・数値シミュレーションは変更していない。

## リング背景画像のWebP軽量化（2026-08-03・Codex）

シングル／タッグ観戦と操作モックで共用するリング背景を、1672×941の解像度を維持したままPNGから品質92のWebPへ置換した。容量は1,588,827 bytesから135,178 bytesへ約91.5%削減した。ゲーム本体・タッグ戦・モックの参照をWebPへ統一し、旧PNGは削除した。数値シミュレーションとReplay処理は変更していない。

## タッチ輪郭発光・タッグ決着画面・クローズアップ負荷修正（2026-08-03・Codex）

タッグ交代時の `tag-highlight` / `tag-highlight-hot` が選手カードの矩形外周を光らせていたため、入場する選手の透過full画像だけへ緑／赤の輪郭発光を掛ける方式へ変更した。親カードの発光アニメーションは停止し、水平スライドとは独立して再生する。

フォール等のクローズアップはリング上の2人だけを対象とし、画面比率対応・最大180%へ縮小した。画面外の控え選手は118%のまま維持し、アップ中は継続的な危険域・大技発光アニメーションを停止する。シングルはリング背景を独立した画像レイヤーではなくライブリング本体の静止背景として描画し、攻撃時の照明拡大と選手の黒い移動影を撤去した。

タッグ決着画面は勝者中心へ戻し、後付けされていた敗者セリフを削除した。勝者セリフは相手・パートナーのフルネームを差し込まず、口調別の名前なしセリフ群から選ぶ。敗者の顔・名前と試合数値は小さな結果情報として維持する。

## シングル／タッグ観戦の輪郭発光・決着セリフ統一（2026-08-03・Codex）

大技の溜めと低HP時の赤い危険表示が、透過full画像の矩形キャンバス外周を光らせていた問題を修正した。選手パネルへの `box-shadow` と矩形の放射グラデーションをライブリング内では無効化し、透過PNGのアルファ輪郭に追従する `drop-shadow` アニメーションへ変更した。シングル／タッグの大技、危険域、丸め込み、タッグの救援系フラッシュで同じ輪郭発光方式を使う。Replayフレーム、HP判定値、技・ダメージ・決着処理は変更していない。

決着画面の選手セリフは通常ゲームの会話規則へ揃えた。既に白い吹き出し＋黒文字だったシングルを維持し、タッグ側の暗色ログ風表示を白い吹き出し＋黒文字＋選手側を向く三角へ変更した。実況文は選手セリフと区別して従来の金色表示を維持する。

## シングル観戦の背景レイヤー・アップ構図修正（2026-08-03・Codex）

選手が攻撃モーションで移動した瞬間、ライブリング背景の一部が黒く抜けて見える問題を修正した。背景画像・カラーグレード・照明を負の `z-index` から固定の正レイヤーへ移し、動く選手パネルも透明な正レイヤーへ分離した。選手画像の強い影も抑え、キャラクターの外周に黒い面が追従して見える違和感を軽減した。

アップは固定 `205%` から、最大 `180%` かつライブリングの横幅に応じて自動的に縮小する構図へ変更した。左右とも各ハーフの中央を共通アンカーとし、full画像の同一キャンバス・同一縮尺・上端保持は維持する。利用者がウィンドウサイズを手動調整しなくても、縦長寄りの表示では過剰な拡大を抑え、左右の偏りと画面占有を減らす。

## バトル観戦アップ時の長身選手・頭切れ修正（2026-08-02・Codex）

アップカメラがfull画像をキャンバス上端より上へ押し出していたため、178cmの楠木なぎさ等で頭が切れていた。full素材は全員が同じ512×768キャンバス・同一縮尺で、頭上余白そのものが身長差を表す前提を再確認。選手別の身長補正や個別ズームは加えず、両者を同じ205%へ拡大し、キャンバス上端を0位置に保つ `height:205% / bottom:-105%` へ変更した。アップは下側だけをクロップするため、長身選手の頭部を守りながら小柄な選手の頭上余白と自然な目線差を維持する。

実ゲームでライブリング直上にあった全幅の `RIVALRY MATCH`／`BIG MATCH` 帯も撤去した。帯内のupper画像2枚を削除し、タイトルと対戦記録だけの小型バッジをリング上端中央へ内包。約58px＋余白ぶんをライブリングへ返し、演出画面そのものを上へ拡張した。モバイルでは記録部分を省略してタイトルだけを残す。

## シングル戦バトル観戦プレゼンテーション刷新（2026-08-02・Codex）

承認済みの `battle-presentation-pattern-c-v4.html` をシングル戦の本番Replay観戦画面へ反映した。ライブリングを画面の主役へ拡大し、OVR差し替え対応のfull画像を膝上の全景／上半身アップで使い分ける。下段は左右のupper画像・OVR・5能力バーと、中央の最新順攻防ログ＋初心者向け技説明に再編。右側能力バーは肖像側から左へ伸びる鏡映しとした。最下段は「次の攻防」を画面中央の最大操作に固定し、左右へ戻る／自動／速度とカメラ／正確な数値を分離した。

実況は従来の「選手名の技名 → Nダメージ」中心から、技が体勢や試合の流れに与えた意味を伝える中央の角型放送ローワーサードへ変更。正確なDMG/PWRは任意表示の技説明へ残した。自動カメラはOpening/Midの通常攻防を全景、End/Climaxの大技・クリティカル・カウンターと全フェーズのフォール／ギブアップ／TKO／決着をアップにし、最低でも次の攻防まで保持する。無意味な毎ターンの往復はしない。手動の全景／アップも選べる。

`Engine.battle.simulateMatch()` と `src/match-engine.js` は変更せず、開始前に完成した `result.frames` を順に再生する構造を維持した。MISS、反転カウンター、大技、ダメージ、危険域、HP帯ダメージ台詞、因縁／フェーズカットイン、フォール、丸め込み、キックアウト、ギブアップ、TKO、勝利オーバーレイ、既存SFXを新レイアウトへ接続した。表示専用の1フレーム戻しはHP・モメンタム・ログを過去フレームから再構築し、再シミュレーションしない。

UI階層1のStage／P7 Theatricalへ合わせ、Cream Panelを使わず純黒会場を基調とした。同種情報の左右固定色は使わず、左右差は鏡映しレイアウトで表現。モバイルはライブリング→攻防情報→左右データの順に積み、能力バーを残したまま中央主操作を下端へ固定した。画面仕様 `docs/ui/03-screens/battle-spectator.md` と確定仕様 `specs/battle-presentation-spec-v1.0.md`、静的回帰テスト `test/battle-presentation-ui-test.js` を追加した。
## 旧イベントと王座モーダルの同時表示を防止（2026-08-02・Codex）
特番出演などの旧イベントポップアップが短い `setTimeout` の後に登録される一方、興行後の王座防衛・戴冠モーダルもイベントキューの空判定から200ms後に開いていた。空判定後の待機中に旧イベントが追加されても再判定しなかったため、C3型イベントが開いている上へA型王座モーダルが重なる競合が発生していた。

`_chainEventPopupQueueEmpty` は200ms後にイベントキューを再確認し、遅れて追加されたイベントがあれば、その終了後へコールバックをつなぎ直すよう修正した。また、旧イベントが複数続く場合の2件目以降も直接描画せず、全モーダル共通の `_enqueuePopup` を経由するよう統一した。イベント内容・発火率・既存デザインは変更せず、表示順だけを「先に開いたイベントを閉じてから次のモーダル」に揃えた。遅延追加を再現する回帰テストと、連続C3イベントが共通キューを通ることの検査を追加した。

## Common-1派閥内対決の`undefined`修正と既存A型モーダル化（2026-08-02・Codex）

派閥内対決の予約化後、`bookedCommon1`には選手IDだけが残る一方、決着処理が予約内の`fighterAName` / `fighterBName`を直接参照していた。そのため下克上結果の本文だけでなく、社長への反応・人気・因縁など名前を使う影響欄へ連鎖的に`undefined`が出ていた。決着時に選手ID・派閥IDから現行ロスター／現行派閥を引き直すよう修正し、今後の予約には名前も補助情報として保持する。名前を持たない旧予約でも現行名へ復旧し、IDの文字列／数値差も吸収する。

この一戦は派閥の序列を動かし得る重要戦のため、Common-1専用の暗い`.c1r-*`結果カードを廃止。新規デザインは作らず、戴冠・節目防衛で承認済みの既存A型イベントモーダル（`mdl-a-title-*`）へ統一した。表示順は **地の文 → 勝者・敗者それぞれの頭上吹き出し → 画像 → 名前 → 役割／OVR → 試合結果・影響欄**。キャラクター台詞は既存`COMMON1_LINES.resultLeader/resultLoser`をそのまま使い、決着説明・ナレーション・数値影響は吹き出しへ入れない。選手画像と名前からのプロフィール導線も維持した。

回帰テストは、名前のない旧予約から結果文・全影響行を生成して`undefined`が一切出ないこと、現行派閥名を優先すること、A型共通骨格・頭上吹き出し順・数値欄分離・旧専用カード不在を固定した。

## 定期興行の全試合結果へ因縁セリフ吹き出しを復元（2026-08-02・Codex）

定期興行の終了画面で選手画像上のセリフが全て消えていた。原因は2026-07-21の結果画面リデザインで、仕様書 `docs/ui/03-screens/show-result-spec.md` §4-5 に残っている **因縁30以上なら勝者・敗者とも画像上へ表示** という既存ルールを描画側だけ削除し、後日の修復では独立した試合後モーダルへ移していたことだった。

`_buildRivalryMatchDialogue` に勝敗セリフの選定を共通化し、定期興行では旧来どおり rivalry 30+（好敵手／宿敵称号は例外）の勝者・敗者セリフを `_pbFighterBlock` の頭上白吹き出しへ戻した。OVR差9以上の番狂わせでは既存 `UPSET_RIVALRY_LINES` を使う。因縁決着は専用演出を維持し、同じセリフを結果一覧の後に独立モーダルでも重ねることはしない。PPV側の独立モーダルは既存の60以上・1興行1件・同一ペア8週クールダウンを維持する。実況・決着説明・ナレーションは吹き出しへ入れない。

`rivalry-match-dialogue-test.js` と `show-result-summary-theme-test.js` を現行ルールへ更新し、左右の選手画像へ実際に `leftLine` / `rightLine` を渡すこと、定期興行だけ一覧内表示にすること、PPV側の頻度制御と番狂わせ71本への接続を失わないことを固定した。

## 季節の特別興行週から通常興行を完全排除（2026-08-02・Codex）

春の特別興行週に通常興行が併発していた原因は、通常興行の可否を大会ごとの `cancelled` / `completedSeason` 等で判定し、大会不成立時は通常興行へフォールバックする旧仕様が残っていたことだった。カレンダー共通判定 `isSeasonSpecialEventWeek` / `isRegularShowWeek` を新設し、**各季節の第12週（年12・24・36・48週）は開催結果に関係なく特別興行専用**、通常興行はそれ以外の偶数週だけ、という不変条件へ統一した。

画面の興行準備入口・再開導線・開催直前・純エンジン直呼び・他団体AI興行・挑戦興行予約・派閥興行イベント・AI興行ニュースまで同じ判定を使用する。旧「大会中止なら通常興行」「通常の特別興行は試合枠+1」という表示と枠増加処理も撤去。春夏秋冬の週定数、キャンセル済み夏大会、古い `showPrep` 状態、純エンジン拒否を回帰テスト化し、`npm test` **209/209 PASS**。
## F09派閥対抗戦の全台詞を共通の頭上吹き出しへ統一（2026-08-02・Codex）

F09の開幕・各試合前・各試合後・最終結果だけが、キャラクター台詞を画像下の暗色テキスト枠へ置く旧構造のまま残っていた。既存のF08／派閥内序列戦と同じ `_u3bSideHtml` へ4画面すべてを移し、縦順を **白い吹き出し → キャラクター画像 → 名前 → 役割** に統一。勝者／敗者の大小・減彩、Stageの抗争色、スコア、メンバー列、文面は変更していない。回帰テストは4画面すべての共通部品使用、旧セリフ枠不在、頭上配置、勝者基準のスコア順を固定する。

## 確定済み未完・到達不能実装の最終監査（2026-08-02・Codex）

会話内で確定した秋大会・王座モーダル・判定決着・開眼第1フェーズの実装を再照合し、いずれも本番経路・表示・回帰テストまで接続済みであることを確認した。その上で `task-81` の休眠コード削除を全項目完了した。

- `getWelcomeQuote` / `getHeatStateQuote` と旧Common-1即時試合一式を削除。現行の加入挨拶、道場コーチ、興行予約経路は保持
- 旧単独頂上決戦を削除。古いセーブの `pendingEvent.type='summit'` はロード時マイグレーションで詰まらないようにした。現行のPPV内頂上決戦は保持
- 旧UI・検証用ヘルパー8件を削除し、現行の春タッグ、タッグ枠操作、MVP選出、秋大会を保持
- 追加監査で、データベースの旧サブタブ値5／8は冒頭で0へ正規化される一方、旧新聞／因縁列伝の描画入口と専用ヘルパー815行が残っていることを確認。現行のトップレベル新聞タブとは別物で外部参照もなかったため削除した。現行新聞1面・3面、黒田コメント、期待MQ計算、ドラフト特集描画は保持

同じ監査で、F09派閥対抗戦の試合後モーダルが `ptDelta: 0` 固定のままという、過去worklogに明記された残課題も発見した。`Engine.factions.calculateRivalryPointsForMatch` を副作用のない共通計算口として切り出し、本番加算とモーダル表示を一本化。F09倍率・下剋上補正を含むその試合の `+PT` と、興行確定前までに終了したF09試合の累積スコアを表示する。純計算がゲーム状態を変更しないこと、本番加算値と一致することを回帰テスト化した。

ソース内の未実装表記も全件確認した。派閥スピンオフ、調子連動、シーズン最大動員、加入経路精緻化、開眼第2フェーズなど、仕様書上で将来Phase・要設計・ユーザーレビュー待ちと明記されたものは、今回の「確定済み未完」には含めず保留を維持した。

最終検証は `npm.cmd test` **204/204 PASS**。`node test/stale-lint.js` の表示2件はtask-81記載どおり「関数が存在しないこと」を確認するテストの既知検出で、当該テストを含め全件成功。`node test/auto-sim.js 20 42` は1060週、violations 0、errors 0、Game overs 0、`ALL CLEAR`（semantic fingerprint `f006780c`）。

## 王座結果を既存A型モーダルへ統一（2026-08-02・Codex）

王座獲得だけで大判の全画面式典が発火していたため、承認済みモックアップに合わせて既存A型モーダル枠へ移した。戴冠は新王者／前王者、5・10・15回の節目防衛は王者／挑戦者を2人並びで表示し、地の文と `titleWin` / `titleLoss` / `titleDefense` / `titleChallengeLoss` の既存台詞をそのまま使う。通常防衛は同じA型デザイン・同じフォントと肖像サイズの1人用小型版を維持する。

本文は `Noto Sans JP`、英字ラベルは `Oswald` の既存トークンに固定し、大判式典用の明朝体は使わない。観客数、スマホ時の縦積み、画像フォールバック、二重閉じ防止を含めて回帰テスト化し、全201テスト成功。

## 秋4団体勝ち残り対抗戦の旧導入画面を撤去（2026-08-02・Codex）

特別興行の共通導入を追加した際、秋大会だけ `コーチ → 選手` の後に旧「今週は4団体勝ち残り対抗戦」ルール説明Stageを残していた。`showSpecialEventIntro('autumnWar')` の完了先を `App.awBeginEntry()` へ変更し、流れを **コーチ1人 → 選手1人 → 代表編成 → バス → 本編** に統一した。旧 `renderAutumnWarIntro` と専用 `.agw-intro-*` CSS は休眠実装にせず削除。`autumn-war-ui-flow-test.js` に直結経路と旧画面不在の回帰検査を追加した。

実機確認で見つかった後段も修正。優勝発表は最多勝1名・75%抽選だったため全枠が無言になり得たが、既存 `AUTUMN_WAR_MVP_LINES.champion` から最多勝1名の台詞をseed固定・100%で出す形へ変更した。理論派コーチの番狂わせ評は、個別評と大会総評の機械連結を止め、指定の一続きの評へ差し替えた。また通常戦・タッグ戦の時間切れ同HP時に `draw` を返していた試合エンジンを、残りHP→試合優勢→seeded判定で必ず勝者を決める仕様へ変更。結果画面・新聞の決着表記は `判定勝ち`、試合ログは `時間切れ判定により、○○の勝利` と明記する。全201テスト成功。

## task-82 実装完了: 開眼システム 第1フェーズ（2026-08-02・Codex）

`docs/codex-tasks/task-82-kaigan-phase1.md` に従い、開眼のエンジン、40季較正、既存UIだけを使う最小可視化を実装した。前兆・専用モーダル・選手セリフ・コーチ観察・選手詳細表示は第2フェーズのまま手を付けていない。配布ファイル追加はなく、`release/manifest.json` は未変更。

**生成時の隠しシード**（`src/management.js`）: `Engine.kaigan.assignSeed` は生成時trainCapOVR 100以下だけを対象とし、専用派生RNGで判定する。採用率は2.9%。通常の乱数状態を読み取りはするが進めず、シードはUI・見立て評価へ出さない。全呼び出し元を列挙し、共通生成口2本へ集約した。

- `Engine.makeChar`: 初期ドラフト確定後の自団体ロスター、ドラフト不採用者を含む初期FA、`createInitialState` のドラフト開始時／skipDraft時ロスターとFA
- `Engine.rival.makeAIFighter`: 初期AI3団体、季中FA補充、スカウト／ドラフト級候補、S級ドラフト級補強、ロード時FA即時補充、saveDoctorによるFA修復
- S級の上位候補用trainCap上書きと、初期ドラフト確定時の年代記・気風補正は生成後に資格線を再確認し、最終capが100超になった場合はシードを外す

**発火と効果**: プレイヤー興行（実画面の`App.finalizeShow`と純エンジンの`Engine.executeShow`）・AI興行（`processAIWeek`）を `Engine.kaigan.processMatchResults` へ合流させた。シングル戦のみ、19〜24歳、試合前OVR差+8以上、MQ72以上または勝利、在籍中・怪我離脱でないシード保持者を対象に専用派生RNGで50%判定する。AI限定トレーナー経路からは呼ばない。

発火時点の実データからS級団体ロスターのtrainCapOVR上位4名の中央値を取得し、`中央値 - 0〜4 + mn補正4` を目標に、本人のpot比率を最大剰余法で保存して5statへ再配分する。potと現在mnは不変、各statは開眼前capを下限にする。発火から3季だけ`calcGrowth`のγを1.0、ageMul下限を1.0とし、4季目から通常物理へ完全復帰する。`validateGameState`へ、シードなし発火・残季数0〜3・適用時cap非低下のI5検査を追加した。期間終了後の通常wearによる将来のcap低下はI4違反ではないため、発火時スナップショット同士を検査する。

**最小可視化**: 新しい画面やモーダルは作っていない。既存の週次イベントログへ `👁️ {選手名}が格上との一戦を境に開眼した。` を追加し、既存の大ニュース通知／新聞へ基礎点315（`hotProspectDebut`と同点）で流す。

新聞記事の全文（変数展開前）:

- 見出し: `{name}、格上との一戦で動きに変化`
- 本文: `{orgName}の{name}は{opponentName}との一戦で、それまでと異なる動きを見せた。試合は{result}に終わったが、攻防の組み立てと反応には明らかな変化があり、この試合が成長の転機として記録された。次戦以降も、その変化が続くか注目される。`
- 号外リード: `号外――格上との一戦を境に、若手選手の動きが変わった`

**較正**（`test/kaigan-calibration.js`）: auto-sim本体を改変せず、stateのディープコピーだけを四半期ごとと発火時に観測した。資格線・着地帯・期間は固定し、許可されたシード率／発火率だけを変更した。

| 候補 | seed 1001 / 2002 / 3003 / 4004 / 5005 | 中央値 / 最大 | 結果 |
|------|-------------------------------------------|---------------|------|
| 1.5% / 25%（初期値） | 0 / 0 / 0 / 3 / 3 | 0 / 3 | G1未達 |
| 3.0% / 25% | 0 / 0 / 3 / 3 / 4 | 3 / 4 | seed 3003で同時点p95+4、I2違反 |
| **2.9% / 50%（採用）** | **0 / 2 / 1 / 2 / 4** | **2 / 4** | **G1・I1・I2適合** |

採用値は合計9名。発火年齢は19〜22歳（中央値19）、到達OVRは67〜107（中央値96）。各ランのp95超過最大は `— / 0 / -14 / -4 / -3` で、p95+2違反0。採用値100季の最終確認（seed 6006）は7名、発火年齢20〜23歳、到達OVR 70〜100、p95超過最大0。100季ランで当初出たI5警告は、開眼から9季後の通常wearを「開眼操作による低下」と誤認した検査側の偽陽性だった。検査を発火時の`appliedTrainCap`対`capFloor`比較へ修正し、通常wearを違反にしない回帰テストを追加した。シミュレーション結果・乱数・較正値には影響しない。

**I3実測**（`test/kaigan-invariants-test.js`）: シード判定の前後で既存RNGオブジェクトが完全一致。未発火シード保持者と非保持者へ同じRNGで24回の成長計算を行い、次のfingerprintが完全一致した。発火判定と着地帯の乱数も外部RNG不変を固定した。

`{"rows":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"rng":{"s0":1292538672,"s1":-1628571937}}`

**検証結果**:

- `node test/kaigan-invariants-test.js`: 10項目すべてPASS（I3a/b/c、I4、3季物理、資格ガード、共通試合入口、I5、通常wear回帰、新聞制約）
- `node test/auto-sim.js 20 42`: 1060週、violations 0、errors 0、Game overs 0、`ALL CLEAR`、semantic fingerprint `0b59b679`
- `npm.cmd test`: 200 / 200 PASS、failed 0、timed out 0
- `node --check`: `src/management.js` / `src/app.js` / `src/data.js` / 新規テスト2本すべて成功

## task-80 実装完了: 王座交代記事の本文拡充 + 記事本文からの内部値(OVR/MQ)排除（2026-08-02・worktree）

`docs/codex-tasks/task-80-champion-article-body.md` の実装。task-77 マージ後の main を fast-forward してから着手。

**A. 王座交代記事の組み立て式本文**: `Engine.newspaper.composeChampionChangeBody(ev, seed)` を新設（`src/management.js`）。
テンプレは `CHAMPION_CHANGE_TEMPLATES`（`src/data.js`、§4確定版26本・Keisukeレビュー通過、一字一句そのまま収録）。
リード(3)+プロフィール(年齢帯4分割: 若手≤21=3/伸び盛り22-24=6/完成期25-29=3/ベテラン30+=3)+戴冠歴(初=3/複数回=2)+締め(3)。
- プロフィールは `age` から年齢帯を判定して該当プールを1本選ぶ。22-24帯だけ6本(慎重系3+前向き系3)から選ぶ設計通り
- 戴冠歴は `titleReigns>=2` なら複数回目文へ。複数回目テンプレは `[取り返した版, 汎用版]` の順で並ぶ前提で、
  新設ヘルパー `Engine.newspaper._isRepeatSameTitleReign(fighter, titleOrgName)` が
  `careerRecord.history` を `orgName`(例:「○○王座」文字列。`beltId` は常に `'world'` 固定で団体をまたいだ判別に
  使えないため使わない)でスコープし、同じ王座の `titleWin` が2件以上あるときだけ「取り返した」版を選択肢に含める
- ペイロード拡張(`age`/`styleJa`/`titleReigns`/`careerSeasons`)は2箇所: AI側は `nextOrgData._newsChampionChange`
  組み立て時(`recordTitleWin` 適用後の roster から取得)、自団体側は `Engine.title.crownChampion` の
  `newsEvent.data`(`recordTitleWin` 適用後の `newRoster` から取得)。どちらも「今回の戴冠を含んだ値」で揃えた
- `styleJa` は `Engine.newspaper.STYLE_JA` を新設して `composeDraftPlayerResult`(task-77)のローカル重複定義も
  ここへ差し替え(共用化)
- `playerTitleChange`(自団体側、`titleChange` industry news event)の本文も同じ composer で拡充。
  見出しは既存の `NEWS_HEADLINE_TEMPLATES.titleChange`(3種)のまま。`age` が取れない場合のみ旧・単文本文へフォールバック
- パーツ選択の擬似乱数は `(season*131 + week*17 + fighterId)` を種にする(乱数不使用・仕様通り)

**B. 記事本文からの内部値(OVR/MQ)排除**: `aiChampionChange` 本文の「（OVR {ovr}）」を削除。
それ以外は grep で全列挙してから対応方針を決めた——**「新聞に載る記事の地の文」だけを対象**とし、
表・数字欄のラベル(MVPレース欄・戦力レーダー・fact-item バッジ・UIカードの `AGE`/`OVR` メタ行等)は
仕様の例外規定どおり現状維持。年代記(章システム)・殿堂/経歴サマリー・キャリア年表ハイライトは
別スペック(chronicle-system-spec 等)の機能であり新聞ではないため対象外とした。
実際に書き換えた箇所:
- `src/management.js`: `_buildPpvSummitStory`(頂上決戦の質評価4分岐)/`crossWarResult`/`ppvUndercard`(見出し+本文)/
  `aiShowHighlight`/`aiTeamConflict`(見出し)/`aiWarResult`(2)/`aiB3Result`(2)/`aiMediaSpotlight`/
  `juniorTournamentBestBout`(見出し)/`juniorTournamentOutlook`(黒田記者の展望、OVR)/
  `Engine.mvpRace` の直近名勝負叙述(2箇所・計11行) — 全て `MQ` → 「試合評価」、`OVR` → 「総合力」
- `src/app.js`: `_NEWSPAPER_HEADLINES`(closeMQ/superMQ)/`_NEWSPAPER_ARTICLES`(9種のプール中8箇所、
  upsetの「OVR格差」→「総合力差」含む)/メインイベント記事のサブヘッドライン3分岐 — 新聞1面メイン記事の生成元
- `src/ui-render.js`: 格上げ記事(`promotedArticle`)フォールバック3種、2面 団体比較の黒田寸評フォールバック1箇所
- `src/kuroda-text.js`: `KURODA_SPOTLIGHT`(2面 団体比較の選手寸評、growth/star/risingYoung/midCareer/veteranの
  計19箇所)。文意・語尾は変えず `OVR` トークンだけ「総合力」に置換
- スコープ外と判断した箇所(Chronicle章生成テンプレ・殿堂`_buildHighlights`・`buildCareerSummary`・
  career-history highlights・DBカード/UIラベル類)は変更していない

**C.** newsValue/PRIORITY の点数は一切変更していない(§4の組み立てはあくまで本文の厚みの改修)。

**検証**: `node test/newspaper-news-value-test.js` 全25項目PASS(点数不変)。`node test/auto-sim.js 20 42` 違反0/エラー0/ALL CLEAR。
`npm test` 196/196 PASS(既存本数のまま)。手動で `Engine.newspaper.composeChampionChangeBody` を直接呼び、
若手初戴冠/22-24前向き系/ベテラン返り咲き(同王座取り返し)の組文が仕様通りに出ることと、
`repeatSameTitle: false` のときに「取り返した」版が一切選ばれないことを確認。

**specs更新**: `specs/newspaper-spec-v1.0.md` に「3-1b. 王座交代記事の組み立て式本文」を新設し、
「7. 文章のルール」へ OVR/MQ 生表記禁止のルールと対象範囲(地の文 vs 表・数字欄の線引き)を追記。

## 天頂戦 開催前ミニイベント(Week42)が大会後に出るバグ修正（2026-08-02・worktree）

Keisuke実機報告（8年目・12年目の2回連続再現、天頂戦=4年に一度のPPVトーナメント）: 開催前ミニイベント（「4年に一度の大舞台まで、あと6週」モーダル）が本来のWeek42ではなく、天頂戦そのものが終わった直後に表示される。

**根本原因**（ブラウザ実機トレースで実測・確定。仮説1「セット週のズレ」でも仮説3「他イベントとの競合」でもなく、仮説2の亜種）:

`App.checkTenchosenPreEvent()`（app.js 14119、`advanceFromWeekSummary`/`advanceWeek` から2箇所で呼ばれる）は `_enqueuePopup()` を**同期的に**呼んでモーダルを即座に開いていた。ところが呼び出し元は、このチェックの直後に `showScreen('week')` を呼ぶ——**showScreenは内部で`dismissAllPopups()`を呼ぶ**（この関数は `_popupQueue` を空にし、`showResultOverlay` の `active` クラスも外す）。`checkTitleEstablishment` や `_notifyRosterCapUnlock` など他の週次チェックが軒並り `setTimeout(..., 220〜300ms)` でポップアップを開いているのは、まさにこの罠を避けるためだった。`checkTenchosenPreEvent` だけがこの配慮を欠いていたため、Week42に開いた直後に同じ関数呼び出しチェーン内で `showScreen` に畳まれ、プレイヤーが一度も目にしないまま消えていた。

`seen` フラグが立たないため、Week43〜47の毎週の遷移でも同じ理由（`checkTenchosenPreEvent`→即消去）で再挑戦しては消え続ける。Week48で天頂戦本編に入ると `_shouldStartTenchosenReplay()` の早期returnが `checkTenchosenPreEvent` 呼び出しより先に来るため、このチェック自体が呼ばれなくなる。本編の演出チェーンが完走して通常フローに戻った瞬間、初めて `showScreen` による即時ワイプに巻き込まれない状況になり、そこで初めて表示される——これが「大会後に出る」ように見えていた正体。

ブラウザ実機（`serve src` 相当、dev-tools.js の `WrestleManagerDev.fastForward(4,40)` でシーズン4週40まで早送りし、`App.checkTenchosenPreEvent`/`dismissAllPopups`/`renderTenchosenPreEvent` にログを仕込んで実測）:

- 修正前: Week42遷移時、`checkTenchosenPreEvent`実行直後に`overlayActive:true`（開いた）→ その直後の`dismissAllPopups`（`showScreen`由来）で`overlayActiveBefore:true`→即オーバーレイ消去。`tenchosenPreEvent.seen`はfalseのまま。Week43でも同じ現象が再現し、Week48の天頂戦本編中は`checkTenchosenPreEvent`自体が呼ばれず、Week49（オフシーズン）まで`seen:false`が持ち越し
- 修正後: Week42遷移時は`checkTenchosenPreEvent`実行直後は`overlayActive:false`（即開かない）→`showScreen`の`dismissAllPopups`が空振り（`overlayActiveBefore:false`）→300ms後に`renderTenchosenPreEvent`が実行され`overlayActive:true`。プレイヤーが閉じると`seen:true`。Week43〜48（天頂戦完走）まで再表示なし

**修正**（app.js `App.checkTenchosenPreEvent()` のみ。呼び出し元2箇所には触れていない——関数内で遅延させれば両方の呼び出し元に効くため）:
1. **根本修正**: `_enqueuePopup`呼び出しを`setTimeout(..., 300)`でラップし、`showScreen`のdismissAllPopupsより後に開くようにした（他のcheck*と同じ作法に揃えた）
2. **陳腐化の保険**: `G.week >= Engine.ppvTournament.ENTRY_WEEK`（週43）に達してもまだ未読なら、本編に飲まれた演出とみなし静かに`markPreEventSeen`する。setTimeoutの遅延中に何らかの理由で不発でも、「大会後に出る」症状が再発しないための保険
3. **多重enqueueガード**: `App._tenchosenPreEventPending`フラグで、同じ週に複数回チェックが走っても`setTimeout`予約を重ねて積まない（`checkTenchosenPreEvent`は`seen`になるまで毎週呼ばれる設計のため）

**検証**:
- ブラウザ実機トレース（上記）: 修正後はWeek42で正しく表示・Week43〜48は再表示なしを確認
- 陳腐化保険・多重enqueueガードもブラウザ実機で個別に動作確認
- `node test/auto-sim.js 20 42`: Total violations 0 / errors 0 / ALL CLEAR
- `npm test`: 197/197 PASS

## AI怪我引退記事の戴冠数バグ修正（2026-08-02・worktree）

task-77実装時にエージェントが発見しスコープ外とした残件の修正。`_newsInjuryRetirement` の生成側（`processAIWeek` 内、management.js 9720行付近）が `retiree.careerHistory` の `'titleWin'` を数えていたが、careerHistory に入るのは背景生成の `'title_win'` のみで、ゲーム内の戴冠は `careerRecord.totalTitleWins` に記録される。このため怪我引退記事の「通算N度の戴冠」がほぼ常に0か過少になり、task-77で追加した強度補正（`retirementGrade` への `newsData.reigns` 入力）も効いていなかった。

- 取得元を task-77 の共通ヘルパー `Engine.newspaper._retirementCareerStats(retiree)` に統一（reigns=totalTitleWins / peakOVR / wasChampion の3値まとめて）。他の引退2経路（AIシーズン末・週次スキャン）と同じ取得元になった
- 消費側（記事本文の戴冠言及 29366行・強度補正入力 29373行）は `ev.titleReigns` 参照のままで正しい値を受け取る。コード変更は生成側1箇所のみ
- 消費側の「取得元を分けない」コメント（task-77 §A-3 の旧裁定）を実態に合わせて更新

**検証**: `node test/newspaper-news-value-test.js` 全PASS。`node test/auto-sim.js 20 42` 違反0/エラー0 ALL CLEAR。

## task-79 実装完了: Common-1 興行予約化 + リーダー発言の帰属修正（2026-08-02・worktree）

`docs/codex-tasks/task-79-common1-booking-and-attribution.md` の実装。

**着手前の既存「予約→興行組み込み」機構の全列挙**（grep調査）:
- 挑戦状(CH系) — `Engine.challengeRequest.reserveScheduledMatches`（`src/relationships.js`）。3枠(メイン/セミ/準セミ)を**強制ロック**して`showCard`に自動挿入(`_crMatchLocked`)。枠を選べない
- B3奪還挑戦 — `Engine.challengeRequest.reserveScheduledSingleMatch`。メイン1枠を強制ロック(`isCRMatch`/`_b3ChallengeMatch`)
- F09派閥対抗戦 — `_f09Locked`フラグでカード挿入(枠は自動選定)。試合連動ポイント制(先取100)で決着、これも「枠が固定」型
- F08派閥直接対決 — `_pendingF08Directive`を立てておき、**カードのどこにリーダー同士の組み合わせが現れても**(`validMatches`を走査して検出)、その週の結果処理で追加効果を適用。枠を強制しない、唯一の「自由枠」既存パターン
- F07 DEMAND_MAIN — メイン枠(`showCard[0]`)にメンバーが入っているかを**判定のみ**行い、含まれていれば加点/含まれなければ減点。カードへの挿入は一切しない
- 頂上決戦(天頂戦) — 完全に独立した特別興行(`quadrennial-ppv-tournament`)。通常カードの予約とは無関係

→ Common-1は「枠を強制しない」という要件がCH/B3/F09と根本的に異なり、**F08直接対決の「カード走査検出」パターンが最も近い**ため、これに乗せた。新しい並行機構は発明していない。

**A. リーダー発言の帰属修正**: `showFactionCommon1Modal`（`src/ui-common.js`）の`leaderSide`フォールバックを`'a'`固定から`null`に変更。リーダー非当事者時は対戦者の吹き出しにセリフを出さず、コーチ帯(reporter strip)の下に新設した`.fc1-leader-strip`（chip 46×66・2:3のミニ画像+頭上吹き出し、名前/所属は吹き出し外）へ回す。`_renderCommon1MatchResult`のresultLeader/resultLoser帰属は元々`payload.leaderId === fA.id`の直接比較で正しく、修正不要と確認。

**B. 興行予約化**: `Engine.factions.applyCommon1Choice`のA選択を`G.bookedCommon1 = {fighterAId, fighterBId, factionId, factionName, archetypeId, leaderId, createdSeason, createdWeek, createdAbsWeek}`という単一予約の作成に変更（即時試合を撤去）。新設ヘルパー5つ（`isBookedCommon1Valid`/`isBookedCommon1Expired`/`sweepBookedCommon1`/`findBookedCommon1CardIndex`/`hasCompetingBooking`）を`src/factions.js`に追加。`App._finalizeShowImpl`（F08ディレクティブ処理の直前）で予約ペアが今週のカードのどこにあるかを枠を問わず検出し、`Engine.challengeRequest.isEligibleHomeShow`で特別興行週を除外、`hasCompetingBooking`で他予約(CH/B3/F09/派閥内序列戦/奪還戦)との同一興行重複を回避してから`applyCommon1MatchResult`を適用。結果表示は即時試合用モーダルを廃し、F09/F08/CRと同じdrainチェーンで`_renderCommon1MatchResult`を表示。`renderShowPrep`に予約バナーを追加（配置済み/未配置/特別興行繰り越しを表示）。`tickWeek`の派閥週次処理末尾で`sweepBookedCommon1`を毎週実行し無効化/1シーズン(48週)経過を静かに解除。`dissolveAllByDecree`の畳む対象リストに`bookedCommon1`を追加。`Engine.validateGameState`に整合チェック(オブジェクト型/存在しない選手ID参照/season・week型)を追加。旧・即時試合フロー(`App._common1Preview`等5関数)は呼び出し元を失い未使用のまま残置(削除は別タスク候補)。

**検証**: `node test/auto-sim.js 20 42` 違反0/エラー0/ALL CLEAR。`node test/common1-booking-test.js`（新規、12ケース）全PASS。`npm test` 197/197 PASS。

**手動確認手順**（Keisuke実機確認用）:
1. Common-1発火 → A選択 → 派閥イベント結果バナーに「次の興行のカード編成で、どこに置くかは社長次第だ」の文言が出ることを確認
2. 興行準備画面に「⚔ ○○内対決の予約」バナーが出て、2名の名前と「カードのどこか(メイン/セミ/中盤)に組んでください」の案内が表示されることを確認
3. カード編成で2名を中盤枠に配置 → バナーが「✓ 今週のカードに組まれています」に変わることを確認
4. 興行実行 → 通常の試合結果に続き、派閥内対決の専用結果画面(因縁-30〜-50表記)が出ることを確認 → 興行準備画面から予約バナーが消えていることを確認
5. 特別興行週(PPV/月末特別興行等)に2名を配置しても清算されず、次の通常興行まで予約が残ることを確認
6. 予約中の当事者を負傷させる（または退団させる）→ 予約バナーが静かに消えることを確認（エラー表示なし）
7. リーダーが対戦者でないCommon-1打診で、コーチ帯の下にリーダー専用の吹き出し(小さい2:3画像)が出て、対戦者側の吹き出しにリーダーのセリフが誤って出ないことを確認

specs更新: `specs/faction-common-events-spec-v0.1.md` §3.3/§3.4/§3.4.1/§3.4.2 を予約制へ改訂。`specs/faction-rivalry-points-spec-v0.1.md`は調査の結果Common-1関連記述が存在せず、更新対象なし（`faction-internal-rank-spec-v0.2.md`にCommon-1の派閥内ポイント計算があるが、その計算ロジック自体は無変更のため未改訂）。

## task-77 実装完了: 引退記事の格付け + ドラフト1面拡充（2026-08-02 続き2・worktree）

`docs/codex-tasks/task-77-newspaper-retirement-rank-and-draft-feature.md` の実装。

**A. 引退記事の格付け**: `Engine.newspaper.retirementGrade(d)` を新設（reigns/peakOVR/seasons/wasChampion → 強度補正+上限120・ティアL/A/B/C判定）。基礎点は一切変更していない。呼び出し元は3経路:
- `_newsRetirements`（AIシーズン末キュー・processSeasonEnd）→ `aiAceRetirement`/`aiRetirement`。旧 `isAce = ovr>=70` 二値と固定文「看板選手の退団は団体にとって大きな痛手だ。」を廃止し、tier(L/A→ace, B/C→通常)+ティア別テンプレ(`RETIREMENT_TEMPLATES`、§5-L/A/B/C 確定版12文)へ置き換え
- `retirementDeclare`（週次スキャン・`retiredFighters`新規）→ 同じ `retirementGrade`/`RETIREMENT_TEMPLATES` を使う共通経路。`generate()` の業界ニュースキュー処理内で type別に分岐（汎用 `NEWS_HEADLINE_TEMPLATES` 経由だとティア別本文を選べないため個別処理）。旧 `careerRecord.titleReigns`（実在しないフィールド、常に0だった）を `careerRecord.totalTitleWins` に修正
- `aiInjuryRetirement`（怪我引退）は既存の負傷フレーバー本文をスコープ外として維持し、強度補正（newsData経由）だけ効かせた。reigns は既存の `ev.titleReigns` をそのまま使用（取得元を分けない）
- 同一号内で同ティアの引退が複数出る場合、`pickRetirementVariant` が `_retiredVariantCounts`（AI団体ループと業界ニュースキューで共有）を使って順繰りにバリアントを回す。無冠(reigns=0)では `{reigns}` 入りバリアントを除外
- `_newsContractDepartures`(destination='retire') は今回のスコープ外と判断（見出し/本文が既に isAce で分岐しており、背景で報告された「同一文4連発」バグの発生源ではない）

**B. ドラフト自団体1面**: `data.js` の `draftPlayerResult` テンプレを見出し2種+本文パススルー(`{body}`)に変更し、`Engine.newspaper.composeDraftPlayerResult(org, fighters, seed)` がリード(3種)+注目選手(assessedTier降順・superElite/eliteがいれば2名まで、promising以下しかいなければ1名のみ・superElite3/elite3/promising2バリアント)+締め(3種)を組み立てる。内部数値(pot/trainCap/OVR)は一切使わず、`assessedTier`/`age`/`h`/`style`のみ使用。`ui-common.js` の `_queueDraftIndustryNews` から呼ぶ。

**検証**: `node test/newspaper-news-value-test.js` にtask-77 §A-4不変条件5件を追加、全24項目PASS。`node test/auto-sim.js 20 42` 違反0/エラー0。`npm test` 196/196 PASS（既存 `draft-news-portrait-ids-test.js` は関数が伸びた分の走査ウィンドウを2600→3600へ拡張）。手動で4件混在の引退シナリオ(L×2/B×3/A×1)を再現し、全件が異なる本文・ティア相応のスコアになることを確認。

## task-77実装をエージェントへ・開眼spec v0.1起票（2026-08-02 続き2）

Keisuke「どんどん流していってください」を受けて2本並行:

- **task-77実装**: 記事テンプレ確定(Keisukeレビュー通過)を受け、worktree隔離の実装エージェント(Sonnet)へ投入。
  追加裁定2件を指示書に反映済み — ①ドラフト記事で同ティア2名言及時は必ず別バリアント(同文反復禁止)
  ②peakOVR70-79帯の強度を+15→+5(ティアB量産帯は中記事に収まり、在籍12季以上だけが肩に届く)。
  マージは戻り次第こちらでdiffレビュー+テスト確認してから。
- **開眼システムspec v0.1 起票**(`specs/kaigan-awakening-spec-v0.1.md`、DRAFT): パリティ較正完了でゲートが
  開いたため。骨子 — 隠しシード1.5%(生成時trainCapOVR≤100のみ・トップ素質は対象外)/発火=格上+8とのMQ72+
  or 勝利×25%・19〜24歳窓/着地帯=S級top4のcapOVR中央値−0〜4(実測相対)/開眼期間3季はγ1.0扱い+ageMul下限1.0/
  頻度目標=40季で中央値2〜3人。開いた論点: mn特例(開眼中はmnも伸びる案Aを推奨)/資格線/名称。
  **演出(前兆→開眼の一戦→事後)は第2フェーズ**、セリフはOpus起案予定。

## パリティdiffレビュー合格・100季完走・新聞2件をtask-77起票（2026-08-02 続き）

**パリティのdiffレビュー(74f47de)**: 合格。熱量テーブルが `calcGrowth` 内の唯一の倍率源で外掛け×1.8の二重掛けなし、
wear共通ルーチンは旧プレイヤーコードと行単位で一致、P-5は専用派生RNGでI4(プレイヤー無風)を維持、死に定数の参照ゼロ。
指摘2点(手戻りなし): ①G1の文言(top4がcap−6〜cap)は「S級全体の到達率」しか記録がなく厳密には未確定
——実機で物足りなければ次のダイヤルはS級 practiceRate かトレーナー確率。②AIの招聘は自団体雇用コーチから選ぶため
プレイヤー(外部専門家を呼べる)がやや有利のまま。仕様の「同値参照」は満たす。

**100季最終確認**: ツールの10分上限を回避するため Start-Process の切り離しプロセスで実行。
seed 1001 × 100季が7.6分で完走、5300週・Game overs 0・ALL CLEAR(違反0)。ロードマップ更新済み。
パリティの残件は Keisuke実機確認のみ。

**新聞・実機フィードバック2件** → `docs/codex-tasks/task-77-newspaper-retirement-rank-and-draft-feature.md` 起票:
①引退記事が同一文4連発(現行は ovr>=70 の二値。パリティでAIのOVRが上がり全員「看板」側に落ちた)
→ 格スコア(戴冠歴/peakOVR/在籍/現役王者、強度補正+120上限)+本文4ティア化。
②自団体ドラフト1面が本文2行 → リード+注目選手1〜2名言及(assessedTier上位)+締めの組み立て式。
記事テンプレ文はOpusに起草を依頼中。Keisukeレビュー後にtask-77 §5へ確定版を貼ってからCodexが着手する。

## AI成長パリティ実装・40年較正完了（2026-08-02）

AIを「毎週おまかせ(balance)を押す社長」として、成長式だけでなく**成長入力と代償**をプレイヤー側へ揃えた。確定仕様は `specs/growth-system-spec-v2.2.md`。設計経緯と較正結果は `specs/ai-growth-parity-spec-v0.1.md` に記録した。

- `processAIWeek`: 興行週の早期returnを撤去。general枠のプロモ実行者だけは練習せず、その他は通常の練習判定へ進む
- 体調60未満は自動休養、追い込みは体調50以上かつ連続2週未満。AIの `_heat` は追い込み+1／通常練習-1／休養-2で、成長倍率も `intensiveHeatTable` を唯一の入力にした
- `applySeasonTrainingWear` を抽出し、プレイヤー／AIとも `baseWear + 試合数 + 怪我 + 追い込み + 負債 − 耐久` と延命術を同じ式で処理。`aiMatchWearCoef` を廃止
- S級50%、leagueElevated中A級30%で、wearゼロかつstatPeak低下ゼロのtrainCap上位3名から1名へ、プレイヤー招聘と同じ4週バフを限定付与。AIの卒業・延長・化けるは**発火させない**
- AI設定の未参照 `coachMul` / `growthBonus` を削除し、normal/elevatedのintensiveRateを仕様値へ再較正。practiceRateは据え置き
- `test/ai-growth-parity-test.js` を追加。興行週練習、体調・連続ガード、熱量、共通wear、トレーナー候補／4週終了、プレイヤー状態の非変更、I5検証を実行テスト化。旧非対称を固定していた `growth-strain-presentation-test.js` は新裁定へ更新

較正: 同一5シード（1001 / 2002 / 3003 / 4004 / 5005）×40シーズンを通常・開幕からelevated強制で実行。全10ランが errors=0 / invariant violations=0。通常S級の到達率はmean 80.9%、median 85.4%、p95 93.9%。elevated A級はmean 84.8%、median 87.6%で、初期のintensiveRateとトレーナー確率を維持した。

季節境界で移籍済みAI選手の負債が一度だけ残るケースを計測で再現したため、`advanceWeek`の全早期returnを通過した後にAIロスターを正規化するラッパーを追加し、I5を閉じた。`node test/auto-sim.js 20 42` は違反0・エラー0、`npm.cmd test` は196/196 PASS。100シーズン最終確認は環境の10分上限で50/100シーズン到達時にタイムアウト（クラッシュ・違反出力なし）したため、時間上限のない環境で1本だけ再実行する。実機では興行週のプロモ選手以外が練習すること、体調不足時の休養、4週トレーナーの成長体感を確認する。

## 新聞の全面再設計 P1〜P6 完走（2026-08-02）

Keisuke「新聞周りのデザインは終わっていないんじゃないんですか」。**その通りだった。**
私は「P1完了・次はP2」という引き継ぎメモの言い方をそのまま使い、
**6フェーズ中5フェーズが未着手**であることを報告から落としていた。
上がってきた不具合（2面の文字／記事の写真が空）も、単発バグとして処理しようとしたが、
実際は**未完了フェーズそのもの**（P4 と P6）だった。

### 完了した6フェーズ

| P | 内容 | commit |
|---|---|---|
| P2 | 採点の合成点化（基礎+主役+強度）+ 資格線 + 検算不変条件 | `87167b8` |
| P3 | ニュース源6種（事前記事/大怪我/連勝連敗/移籍/引退/ドラフト総括） | `0eaa8fb` `ad6546e` `7f111a0` `bc11e98` |
| P4 | 静かな週の読み物 / 見出し1本化・見出し本文の対化 / 2面3面の特集化 | `ed6c5ed` `3326398` `82a8415` |
| P5 | MVPレース下位を順位争いへ / 固定4面を廃止 | `1dc7745` |
| P6 | 写真の優先順（人物→汎用→なし）+ 素材27枚 | `b1cfccf` `53779cb` |

確定仕様は `specs/newspaper-spec-v1.0.md` が正。旧 `newspaper-and-orgcompare-spec-v2.0.md` は置き換え。

### 一面の質（40シーズン・1298号）

| | 再設計前 | 現在 |
|---|---|---|
| 一面トップの合成点 中央値 | 163 | **194** |
| `aiShowHighlight`（基礎点45の埋め草）が一面 | 27.8% | **4.9%** |
| 一面が成立する号 | 1215 | 1298 |

資格線260以上は約22%のままだが**これは設計どおり**。「王者の全治14週=286」級は毎週起きない。
静かな週は後追い記事が受け持つ。ここを埋めるために点を水増しすると「数値は嘘をつかない」が壊れる。

### また出た「書いてあるのに出ていない」3件

- `transfer` — 優先度50があるだけで**記事テンプレも生成側も無し**。移籍しても一行も載らない
- 因縁列伝の本文の単独pick — `pool.length` を見ていたが pool は `{headlines,bodies}` の
  オブジェクトで `.length` を持たず、**一度も動いていなかった**
- 自団体の引退記事 — AI団体にはあるのに自団体には無し

### 自分で踏んだ罠（同じ轍を踏まないための記録）

- **後追い記事の初版が一面の40%を占めた。** 連勝は「継続状態」であって出来事ではないので、
  5連勝以上の選手が1人いれば毎週その選手の記事が出続ける。クールダウン8週で 7.4% へ
- **特集タブのフォールバックを描画の後ろに置き、紙面が真っ白になる書き方をした。**
  タブを描く前に戻す必要がある
- **テストファイルの構文を壊したままコミットした。** `run-all` が通ったのは、
  そのテストが読み込めず落ちていたのを拾えていなかったため
- **`.db-cmp-*` が2面の原因だと決めつけて委譲した。** あのCSSは到達不能で、直しても1pxも変わらない。
  CSSを見つけただけで live と判断したのが誤り

### そのほか同日

- 団体比較の語調（`b47c3cf`）: GRADE D「正面から勝てる要素がない」の直下に
  「主力の差はまだ小さい」が出ていた。前回の修正が軸フラグメントだけで、
  勝ち筋・注意点は1段の固定文のままだった。AXIS_BIG 35→20、楽観コピーを3段化
- 「他団体」（`3258bc6`）: `aiOrgs[x].name` が**存在しない**フィールドで、記事テキストが
  100%プレースホルダに落ちていた。バッジだけ正しかったのは別経路だったため
- コーチ総括の顔画像（`84339b7`）: 2:3枠に256×256の正方形を入れていた自分の回帰


## AI成長パリティの実装待機をロードマップ化（2026-08-02）

Keisuke 指示により、**Claude側で進行中の更新・アップデート・追加実装がすべて完了してmainが安定した後**に、
AI成長パリティを次の成長系実装として着手する順序を `docs/game-system-roadmap.md` に明記した。

- 仕様の正: `specs/ai-growth-parity-spec-v0.1.md`
- 着手入口: `docs/ai-growth-parity-claude-code-prompt.md`（差分分離→呼び出し元全列挙→40年×同一5シードのベースライン→P-1〜P-6→検算・較正）
- 依存順: パリティの較正を先に終え、その実測したトップ到達帯を基準に**全盛期の窓**と**開眼（化ける）システム**を設計する。先行実装はしない

## AI成長パリティ spec 承認・実装指示書化（2026-08-02）

前日起案の spec がレビュー通過(🟢承認済み・実装待ち)。レビュー中の追加決定:

- **AI=毎週おまかせ(balance)を押す社長**モデルを設計原則に明文化。タレント活動(B4)は既にAI対称と確認(9037)
- P-5トレーナー: 対象=**trainCapOVR上位3名からランダム1名**、候補は**衰えが少しでも見えたら対象外**(wear=0 かつ ▼ゼロ)
- growthBonus は**未参照の死に定数**と判明(grep: data.js定義のみ)→ 削除=現状追認で決着。覚醒イベントの強さは実在要素(practiceRate/コーチ格/枠/FA/P-5)が担い、対称化のカレンダー倍増でむしろ効きが増す
- §9-2(P-5確率 S50%/eA30%)は初期値のまま計測へ、§9-3(下位層底上がり)は計測後判断

**実装はメインセッションで行う**ため、`docs/ai-growth-parity-claude-code-prompt.md` を起こしてこのセッションはストップ。
次段の開眼(化ける)specは、パリティ較正後のトップ実到達帯を物差しに別途起票する。

## AI成長パリティ spec v0.1 起案（2026-08-01）

発端は「中位以下の選手がOVR100級に化ける可能性をほんの少し残したい」という開眼(化ける)システムの構想議論。
現状調査の途中で「プレイヤーは trainCap 際まで登れるのに AI団体は84〜87で失速する」非対称が焦点になり、
Keisuke 裁定「**公平な対決。成長入力はAI/プレイヤーで対称にする。差がつくのは采配の質だけ**」が出た。
7月30日リバランスの「AIトップ低下は意図的」(growth-spec v2.1 §9)・「AI wear非対称は是正しない」(§6.2)を上書きする方針転換。

`specs/ai-growth-parity-spec-v0.1.md`（DRAFT）を起案。要点:

- **実装調査で判明**: AI は ALL_COACHES から本物のコーチを隠し雇用しており(ensureAICoachStaffing)、
  buildAIState が coaches/coachAssign を渡すため **限界突破/弱点克服/ステ特化などのコーチ能力・
  ブレークスルーは既に対称**だった。セッション中盤の「AIには限界突破がない」という私の報告は誤りで訂正済み
- 真の非対称は5つ: ①興行週(年の半分)にAIは練習ゼロ(最大要因) ②体調安全弁なし ③専属トレーナーなし
  ④(AI有利)熱量逓減なしの常時×1.8 ⑤(AI有利)追い込みwear/strainDebtを払わない
- 是正 P-1〜P-6 + AI追い込み節度(intensiveRate を全ティア約1/2.5に引き下げ、wear対称の代償) +
  leagueElevated 再較正(「覚醒」の表現を追い込み連打から練習量・コーチ格・獲得競争へ。growthBonus×1.10/1.08 は廃止提案)
- 数値目標と不変条件を対で定義(G1-G4 / I1-I5)、計測は同5シード40年×2構成+最終100年1本
- AI_COACH_CONFIG.coachMul が週次成長経路で未使用(参照は 8374 の1箇所)なのを発見 → P-6で整理

次の手: Keisuke レビュー → 実装 → 較正 → その後に開眼(化ける)spec を起票
(開眼の着地帯は較正後のトップ実到達帯を物差しにするため、この順序が必須)。
CLAUDE.md のファイル索引に DRAFT 行を追加済み。

## コーチ総括 / PPV の相手セリフ / 天頂戦セリフの改訂反映（2026-08-01 続き）

引き継ぎメモ §1 の C → A を片付け、途中で Keisuke からセリフの口調指示が入ったのでそちらへ。

### 特別興行後のコーチ総括（`af82547` / task-73）

worktree `agent-a8b7dcb14d5dd038d` の実装を main へ取り込んだ。
**そのままマージせず、5大会の実データ構造を `management.js` 側で1件ずつ突き合わせてから**入れた
——テストが手作りフィクスチャで組まれており、フィクスチャが実物とずれていれば
テストは通るのに機能は死ぬ（この日の最頻の型）。
実際 `_orgId` と `orgId`、`championId` と `champion`、`results[].mq` の不在など
名前違いが複数あり、実装側はいずれも正しく当てていた。

進行は `App._tcwGate` 一本。大会結果 → コーチ → 経営画面の連鎖なので、
**詰まると週が進まなくなる**。`lastKey` で二重起動を止め、組み立て失敗は `false` を返して
呼び出し元をそのまま通し（fail-open）、表示したらクリック / 背景タップ / タイムアウト /
内部例外のどれで抜けても `onDone` をちょうど1回呼ぶ。

### PPV「相手選手が喋る」枠（`62d998b` / task-75）

`oppOnLoss` / `oppOnWin` / `summitPre` を配線。あわせて **`summitLose` が一度も出ていなかった**
のを直した——前セッションの `6c5dd84` が `_newsSummitResult.loserLine` に値を載せていたが、
**紙面も画面もその値を読んでいなかった**。またしても「書いてあるのに出ていない」。

そのため `test/ppv-lines-test.js` の項目11を
「引いているか」→「**引いた値が読まれているか**」に変えた。旧テストは
`/loserLine,/` を app.js に探すだけだったので、死蔵をそのまま通していた。

アンダーカードの発火は 因縁 / 番狂わせ(OVR差8+) / 大熱戦(MQ75+) に限定。
40シーズン計測で自団体が絡む決着カードの約1割、1興行あたり0.2回。
頂上決戦の敗者は無条件なので興行あたり最低1枚は出る。

> 計測にあたり auto-sim へ一時的に `WM_PPV_FIXTURE` を足したが、
> **本編の乱数消費とシーズン推移が変わった**（fingerprint が動いた）ため取り下げた。
> auto-sim は PPV エントリーを一度も組まないので、`preparePPVDay` を素で呼ぶと
> 頂上決戦1試合だけのカードになる。計測用にエントリーを組むと本編に干渉する。
> 恒久計測が要るなら、干渉しない形（state のディープコピー）で作り直すこと。

### 天頂戦セリフ 改訂53件の反映 + 口調の書き直し76件（`456a84a`）

Keisuke がレビュー済みの改訂53件を反映。**反映経路が2箇所で詰まっていた**:

1. `tenchosen-final-lines.js` / `ppv-lines.js` が `extract-dialogue.js` の `FILE_ORDER` に
   入っておらず、`apply` が ID を1件も解決できなかった
2. `apply` が ID 列の見出しを `ID(編集不可)` に限定しており、レビュー用書き出し（見出し `ID`）の
   シートを丸ごと読み飛ばしていた

さらに往復コーパスの配列インデックスは**1始まり**、レビュー用書き出しは**0始まり**だった。
原本は Keisuke が開いたままなので触らず、1始まりに直した写しを一時領域に作って `apply` に渡した。

続けて Keisuke 指定の口調を4組ぶん書き直し（76本）:
標準×のんき（明るく前向きに）/ 標準×強気（敬語をやめた女言葉・自信家できつめ）/
不良×のんき（お気楽だが強気で自信家）/ 不良×強気（自信家かつ相手を見下す）。

## 「書いてあるのに出ていない」を5件掘り出した日（2026-08-01 続き・25コミット）

新聞 P1 の後、Keisuke の指摘を追いかけるたびに**同じ型の不具合**が出てきた。
この日の最大の収穫は個々の修正ではなく、**この型が最頻であると分かったこと**。

### 死んでいた5件

| 見つかったもの | 死んでいた理由 | commit |
|---|---|---|
| 黒田の見出し95本＋論説63本 | `src/` のどこからも参照されていなかった | `5f29f21` |
| 主力対決の寸評120本 | 参照キーが2つとも**存在しないキー**。さらに文字列を `fn()` で呼んでいた | `3c9f856` |
| 歴代最高評価・大会ベストバウト | ニュース記事の type にしかならず `careerRecord` に刻まれていなかった | `a27aa5b` |
| AI引退者の `retire` / 引退年の受賞歴 | 積む経路が漏れ、称号の在籍年数が常に1年 | `ee8af86` |
| 吹き出しの尻尾9本 | 親に `-webkit-line-clamp` が付いて `overflow:hidden`、**丸ごとクリップ** | `493537f` |

最後の1件が効いた。**座標を実測して「ずれ0.0px」でも、描かれていないことがある。**
幾何の実測は正しさの証明にならない。以後、委譲先の「実測しました」も同じ目で読む。

### 主な変更

- **新聞 P1**（`4f92a50`）: 一面を v0.3 モックの紙面骨格へ。詳細は下の節
- **団体比較の語調**（`5f29f21`）: ±10の1段しきい値しかなく +12 も +80 も同じ文だったのを
  5段に。グレードと同じ境界で語調帯を決め、死蔵の黒田158本を接続。
  見出しの引用と記者コラムが**同じ一文を1ページに二度**出していたのも解消
- **主力対決の寸評**（`3c9f856`）: 4軸（対戦成績/スタイル/年齢/勢い）から**2文**を組む形へ。
  1文目は必ず対戦成績（いちばん事実に近い）
- **キャリア記録の全点監査**（`ee8af86`）: 実在した4件を修正。
  auto-sim で0件だった9種のうち8種は**計測の制約**（auto-sim は app.js を読まない）と判明。
  `joinSeason` 判定の一本化は**4096通りの総当たりで旧実装と等価**を確認
- **天頂戦 決勝の会話**（`37cf6b3`→`13a52b0`）: 161本 → **実在34組×18モチーフ = 666本**。
  指示書に書いた「満身創痍=消耗40未満」が `FLOOR=55` の関係で**構造的に到達不能**だったのを
  800サンプル実測で 77/81 へ較正（私の指示書のミス）
- **PPV のセリフ**（`6c5dd84`）: 47本しかなく、喋るのは頂上決戦の勝者だけだった。
  **相手選手が喋る**表を新設（56本）。侮辱は `oppOnWin.grudge` だけに限定
- **負傷の表示**（`8d123c5`）: 「中傷」が誹謗中傷と読めるので表示だけ言い換え。
  内部キーはセーブに載っているので据え置き
- 天頂戦のエントリー受付を Week43→47（`e0c1307`）、
  挑戦の直訴を団体戦として明示（`7e8cc5d`）、音声差し替え（`2679474`）ほか

### 起票した spec / 指示書

- `specs/spring-tag-league-spec-v0.2.md` — **2ブロック制への作り直し**（`dcdb470`）。
  総当たりで順位が決まっているのに決勝がある矛盾を解消。8チーム=団体順位で3/2/2/1
- `docs/codex-tasks/task-71`（新聞 全面統一モック・Sol）/ `task-72`（天頂戦決勝の会話）/
  `task-73`（大会後のコーチ総括）/ `task-74`（特別興行3大会の作り直しモック・Sol）/
  `task-75`（PPV のセリフ）
- `docs/newspaper-redesign-spec-v0.2.md` §2-7 — **特別興行の事前記事**（`4cae7e8`）。
  「事前の記事は結果記事以上の注目度がある」（Keisuke）。いまの PRIORITY は逆で、
  結果230〜270に対し announce 系は揃って150

### 道具

- `tools/review-workbook.js`（`12eba0b`）— **未承認セリフのレビュー専用** xlsx 書き出し。
  既存の `dialogue-workbook.js export` は セリフ編集/ を丸ごと書き直す破壊的操作なので使わない
- `test/auto-sim.js` に `WM_HOF_FIXTURE=1`（`2ff3629`）— 殿堂入りの分布と取りこぼし監査

### 積み残し（次セッションの入口は `docs/session-handoff-2026-08-01.md`）

## 新聞再設計 P1「紙面骨格」— 一面を v0.3 モックの構造へ載せ替え（2026-08-01）

指示書 `docs/newspaper-p1-handoff.md` / 仕様 `docs/newspaper-redesign-spec-v0.2.md` §1・§6(P1)。
承認済みモック `docs/ui/mockups/newspaper-redesign-best-v0.3.html` の構造を実装に移した。
**採点の作り直し（P2）・不足ニュース源（P3）・特集化（P4）・MVP本文（P5）には手を付けていない。**

### 何をしたか

一面が「一面記事 → 自団体興行 → 業界ニュース2列」の縦積みだったのを、実際の新聞の
紙面構造にした。**大きさの階段がそのままニュースバリューになる**:

```
きょうの紙面(目次)
┌────────────┬────────┐
│ トップ記事   │ 肩記事   │
│（写真190×228 ├────────┤
│  を回り込み）│ MVP小窓 │
├────────────┴────────┤
│ 準トップ(中段の横帯)       │
├──────┬──────┬──────┤
│ 小記事 │ 小記事 │ 短信  │
├──────┴──────┴──────┤
│ 黒田コラム(最下段固定)      │
└─────────────────────┘
つづき ─ 自団体興行 詳報（同じ紙の下へそのまま続く）
```

- **割り付けは現行 `PRIORITY` の順位のまま**上から流すだけ。
  `topStory`→トップ / `subStories[0]`→肩 / `[1]`→準トップ / `[2][3]`→小記事 / `[4..]`→短信
- **枠が増えたので `subStories` の上限を 3 → 7 に**（`NP_SUB_MAX`, management.js）。
  並び順は従来と同一なので先頭3件は以前と一致する。
  上限を残したのは**溢れた記事を翌号へ持ち越す弁を殺さないため**——
  全部を短信で飲み込むと「来週なら肩に載れた記事」が一行で消費されてしまう
- **続きの見せ方は「下へ続く1枚」を採用**（spec §1・Keisuke 裁定）。自団体興行の詳報は
  面をめくらせず一面の下へ継ぐ。目次から `#npShowDetail` へ飛べる
- **黒田寸評を2箇所→最下段コラム1本に集約**。コラムは定位置が命なので毎号同じ場所に出る
- **MVP小窓は最新号だけ**。`G.mvpRace` は「いまの順位」なので過去号に貼ると号と中身が食い違う
- 本文は `_npV3Paragraphs()` が段落に割る。**記事文そのものは書き換えていない**（P3の仕事）。
  `｜`・改行の既存区切りを尊重し、1本のベタ文だけを「。」位置で均す。
  閉じ括弧の直前では割らない（セリフを断ち切らない）。3段目以降は2段組へ回る

### バックナンバー互換

新規生成号に `layout: 'v3'` を立て、**この目印がある号だけ**新レイアウトで描く。
旧号は `_npFrontLegacy()`（従来の描画をそのまま関数に切り出したもの）で出る。
マイグレーションはしない＝新レイアウトは次に週を進めた号から。

### 実装中に直したもの

- **肩記事の本文が9文字幅のリボンになる**問題。右カラムは200px弱しかないので、
  84×126 の写真を flex で横に並べると本文が細い柱になって読めなかった。
  写真を `float: left` にして回り込ませ、写真の下は全幅に戻る新聞の定石へ
- **人物が特定できない小記事に空の黒い額縁が出る**問題。写真枠ごと出さないようにした
  （記事用の汎用画像は spec §3 の P6）
- `App.preloadNewspaperImages` が単数 `characterId` しか見ておらず、隊列写真
  （`characterIds`）を持つ記事が肩・準トップ・小記事に回ると先読みから漏れていた

### 検証

- `test/newspaper-front-v3-test.js` を新設（38項目）。枠の有無・スロット割り付け・
  段落割り・写真寸法・反転していないこと・レスポンシブ・記事が無い週で落ちないことまで、
  実際に `_npFrontV3()` を回して確認する
- `test/_render-newspaper-v3.js` を新設。実装の出力に実CSSを当てた1枚を
  `docs/ui/mockups/newspaper-v3-render-check.html` に書き出す（**生成物**・目視確認用）。
  900px と 390px の両方で確認済み。390px で横スクロールが出ないことも確認
- `node test/run-all.js` … 185件中183件PASS。残る2件は**本件と無関係**:
  `u3-group-a`（app.js の `CEREMONY_ARRIVAL_BGM` — 音声ミックス作業由来）と
  `u3-group-b`（`Engine.challengeRequest.pickGroupRequesterLine` — 挑戦状モーダル改修由来）。
  どちらも失敗シンボルが本件の差分に一切現れない
- auto-sim は回していない（試合数値・判定に影響しない UI + 掲載本数の変更のため）

### 積み残し（次はここから）

- **P2 採点の合成点化**（基礎点＋主役補正＋強度補正＋資格線 / spec §2）。
  いま一面トップに来るものは PRIORITY のままなので「無名の怪我」と「王者の怪我」が同点
- **本文が短い**。トップは4段落（約400字）想定だが現行の記事文は150〜250字なので2段どまり。
  組みは4段まで対応済みで、本文が伸びれば自動で効く（P3）
- N-2（新人記事の顔写真が出ない）は未着手のまま。セーブのトリミング疑いで中断中

## 新聞の全面見直しに着手 — 課題台帳と再設計 spec（2026-08-01 夜）

Keisuke「新聞をもう全部見直したい。ツッコミどころばっかり。いい加減ちゃんと計画を」。
気づいた順に単発で直していて、UI統一のときと同じ「触った画面だけ直って他が取り残される」
失敗をしかけていたので、いったん止めて台帳と設計に切り替えた。

### 単発で直した2件

- **因縁列伝のアッパー画像の左右反転を撤去**（`33e88d9`）。3面の右側だけ `scaleX(-1)` が
  掛かっていた。`_npPhotoBg` は getUpperUrl＝アッパーなので反転禁止の箇所
  （2026-07-18 裁定: 反転してよいのはスタンド画像の対面だけ）。同種の flip 指定を全数確認し、
  残る2箇所は getStandUrl なので適正と確認
- **選手詳細から熱量セリフを撤去**（`906bc24`）。「今日は体が軽い」が選手詳細のヘッダーに
  無条件で入っており、AI所属選手やスカウト候補にまで出ていた。Keisuke「選手の情報に
  こんなのが載るのはおかしい。特訓的練習的なものをした時に出るセリフだろ」。
  セリフ75本は捨てず、道場シーンへの移設を前提に未接続のままにした（新規UIを勝手に作らない）

### 課題台帳（`docs/newspaper-overhaul-plan.md`）

N-1〜N-13 を登録。**調査で判明した最大の問題は N-3**:
`KURODA_HEADLINES` 95本 + `KURODA_EDITORIAL` 63本が**どこからも読まれていない**（死蔵158本）。
先日反映した黒田記者の目16件も、現状ゲームには一度も出ていなかった。
N-7 も構造が判明: 因縁列伝の見出し6本と本文9本が**独立に抽選**されており（54通り）、
「片方だけ直すと噛み合わない」のは当然だった。

### 再設計 spec（`docs/newspaper-redesign-spec-v0.2.md`）

**枠を先に決めず、その週に起きたことの大きさが紙面の大きさを決める**形に。

モックは3周した:
- v0.1（3案）→「特大画像が邪魔。文章のボリュームが全く足りない。パッと見るじゃなく読む新聞に」
- v0.2（3案）→ 写真を現行同等に縮小・本文を段落単位に増量
- 「特大1+2番手2の枠に縛られすぎ。君のベストを出せ」
- **v0.3（1案）で方向承認**（「ベスト版はとてもいい感じ」）

v0.3 の一面: トップ（約4割・本文4段落・後半2段組）/ 肩記事 / MVP小窓 / 準トップ（中段帯）/
下段の小記事2+短信（▼連結）/ 黒田コラム（最下段の定位置）/ きょうの紙面（目次）。
**写真は本文に従属する脇役**（最大190×228）。続きは「面をめくる」に固定せず、
場合により下へ続く1枚（縦スクロール）でもよい。

採点は固定点をやめ、**合成点**（基礎点 + 主役補正 + 強度補正 + 文脈補正）に。
Keisuke「雑魚が怪我しても大ニュースにならない。MVPトップが怪我したら大変なニュース。
その粒度で設計しろ」。同じ大怪我でも 無名164（中記事）/ 主力215（肩）/ 王者286（一面トップ）
と割れる。帯は重なりを許し、枠の資格線だけ固定。検算不変条件4本も対で明記した。

そのほかの裁定: 記事用の汎用画像を新設してよい / 団体比較の特集は節目主義 /
静かな週の読み物は**実話主義**（実イベントの後追いのみ・捏造禁止）/
ドラフト総括の並びは能力値の降順にしない（隠しステが読めると冷める）/
既存の記事文は資産ではなく候補（合わなければ捨てる）。

### 次

**P1（紙面骨格）の実装から。** 着手メモを `docs/newspaper-p1-handoff.md` に置いた
（スコープ・触る場所・注意点・未解決の N-2 調査の中断地点）。

## アーキタイプ列が空だった2,516行を解消（2026-08-01 追補）

Keisuke「アーキタイプがないのに、パーソナリティだけ設計されてるところは全部
アーキタイプ優先に来てくれないと困る」「セリフ編集のフォルダは全部見ないとダメ」。

**棚卸しの基準を変えた。** それまでは `TABLE_MANIFEST` 経由のソース走査で数えていたが、
Keisuke が実際に目にするのは書き出された Excel。`セリフ編集/` 配下の全ブック
19,582行を読み、「アーキタイプ列が空で性格列だけ埋まっている行」を数えたところ
**2,588行**あった。原因は3つ。

### 1. 標準アーキタイプの綴りが割れていた（2,350行）

`_default` と `standard` の2通りがあり、detectMeta は `_default` をアーキタイプとして
認識しない。そのブロックの行は**キャラタイプ別/ に振り分けられず落ちていた**。

`tools/axis-rewrite.js` に `defkey` を追加して277ヶ所を統一。
後付け拡張（`GLIMPSE_A_LINES.bond_60_up = {...}`）も走査対象に入れないと
GLIMPSE_A_LINES だけで77ヶ所取りこぼす。

AUTUMN_WAR_MATCH_LINES の3ブロックだけ両方を持っていた。追ってみると、
**normal→standard 改名（638f247）で表示される行が入れ替わっていた** —
改名前は `_default` が生きて `normal`(=標準) が死んでいたのが、逆になっていた。
改名前の行を先頭に戻し、併存していた2行も失わないよう末尾に足した
（標準×感情的が 2本 → 4本）。

### 2. 実行文で足されたセリフが旧軸のままだった（312行）

    if (!T.winnerLines.bold) T.winnerLines.bold = {};
    if (!T.winnerLines.bold._default) T.winnerLines.bold._default = [];
    T.winnerLines.bold._default.push('...');

宣言リテラルではなくこの形で追記しているセリフが SNAPSHOT_TEXTS と
RIVALRY_MATCH_REACTION にあり、**軸入れ替え後は全部到達不能になっていた**。
`if (!x)` ガードのおかげで例外にならず、旧レイアウトの死んだ枝を作るだけだったので
テストにも auto-sim にも出なかった。`extract-dialogue` の `evalAll` は宣言しか
評価しないため、これまでの検証からも構造的に漏れていた。

入れ替え後 RIVALRY_MATCH_REACTION は **92セルでセリフが復活**（総本数136は不変）。

### 3. 取りこぼし2件

- `FLAG_DIALOGUE.M-19`〜`M-23` のアーキタイプキーが `normal` のまま（親が `M-19` で
  性格キーでないため、改名の判定から漏れていた）
- `App._NEWSPAPER_HEADLINES` / `_NEWSPAPER_ARTICLES` の `normal` は
  **ニュース分類名**であって性格ではない。detectMeta の誤判定なので除外リスト化

### 書き出しの後始末を追加

行が無くなったブックは書き出されず、**古いIDのファイルが残り続ける**。
実際 `その他セリフ/02-タッグマッチ.xlsx` が入れ替え前のIDのまま残っていて、
最初の棚卸しの数字を狂わせた。export の最後に今回書かなかった .xlsx を消す処理を
追加（Excel で開かれていれば消さずに警告）。

### 結果

| セリフ編集/ 全19,582行 | 前 | 後 |
|---|---:|---:|
| 両軸そろっている | 12,779 | **15,275** |
| 性格のみ（アーキ空） | 2,588 | **72** |

残る72行は COMMON1_LINES / COMMON5_LINES の leaderDemand・leaderQuoteA。
**派閥のアーキタイプ**（AUTHORITY/BOND/…）×性格で分岐しており、話者本人の口調軸が
そもそも無い。ここに足すのは新規のセリフ執筆になるので未着手（要判断）。

### 検証

アーキタイプ辞書 × 全(性格8 × アーキタイプ8) = **18,176エントリ**を変更前と突き合わせ、
退行0 / 変化6（すべて上記 AUTUMN_WAR の意図した統合）。
実行文込みで data.js を丸ごと実行しての比較でも 92セル増 / 0セル減 / 総数不変。
test/run-all.js 179 passed / 0 failed。auto-sim 25シーズン×2シード ALL CLEAR。

## セリフ軸入れ替え 完了 + 旧語彙の統一 + 死にデータ削除（2026-08-01 後半）

前半（同日）の S1〜S4 に続き、Keisuke 裁定を受けて残り全部を片付けた。
裁定: Q1=口調優先（案A）/ Q2=S5 実行可 / Q3=読み手のいないセリフは削除 /
Q4=旧語彙は現行体系へ / Q5=ui-render のローカル定数はそのまま / Q6=Excel は反映する。

### Q6 の反映で6本を壊し、書き戻しのバグを潰した

黒田記者の目16件を apply したところ、`${d.rivalName}` が `\${d.rivalName}` になり
**6本でプレースホルダが展開されなくなった**（団体名の代わりに文字列がそのまま紙面に出る）。
revert して原因を潰してから再実行した。

原因は、書き戻しに意味の違う2経路があるのにエスケープを共用していたこと:

| 経路 | 抽出/照合 | 差し込み |
|---|---|---|
| (a) プレーンなリテラル | vm 評価値（デコード済み） | エスケープが**必要** |
| (b) 関数本体のリテラル（`d => ` + backtick） | ソースの生テキスト | エスケープしては**いけない** |

黒田記者の目は (b) なのに (a) 用の `escapeForQuote` を掛けていた。
(b) 専用に `rawLiteralBody()` を新設。エスケープを外した分、リテラルを壊しうる入力は
`literalIsSafe()` で検査して**該当行をスキップ+警告**する（黙って書き換えない）。
`test/dialogue-workbook-roundtrip-test.js` を新設。

### Q3: 読み手のいない派閥セリフ6テーブルを削除（338行 / セリフ104本）

`FACTION_F01_LEADER` / `F01_FOLLOWER` / `F02_LEADER` / `F03_SURVIVOR` / `F04_TARGET` /
`F07_LEADER`。src のどこからも参照されておらず、ゲーム中に一度も出ないデータだった
（F05/F06/F08/F09 は `_factionLine()` から呼ばれている）。
data-faction-dialogue.js 1447 → 1101行。

### S5: 残り211ヶ所 / 65テーブル（約9,300本）

`getDialoguePool`（data.js）が中心にいて23ヶ所以上から呼ばれるため、
S1〜S4 のようには分割できず1段でまとめて動かした。反転した読み手は6ヶ所
（getDialoguePool / getJuniorTournamentLine / getAutumnWarMatchLine /
App.resolveDomeLine / _warVictoryLine / _resolveVoice）。
下5つは独自のフォールバックを持っていたが、探索順を1箇所に集約するため
getDialoguePool に寄せた。

**探索順で一度つまずいた。** 当初 4段固定にしたら AUTUMN_WAR_MATCH_LINES で42ヶ所の
退行が出た。このテーブルはアーキタイプ位置に `_default` と `standard` を**両方**持ち、
`standard` の方が疎なので `_default` に辿り着けない。既定キーの綴りはテーブルごとに
`standard` / `_default` / `normal` が混在するため、決め打ちせず順に試す形にした:

    アーキタイプ側: [a, 'standard', '_default', 'normal']
    性格側:         [p, 'normal', '_default']

「アーキタイプを保ったまま性格を落とす」→「標準の口調へ落ちる」の優先順は維持。

**検証**: 211辞書 × 全(性格8 × アーキタイプ8) = 13,504エントリを入れ替え前と突き合わせ。
退行 0 / 改善 93 / 別セリフに変化 2,518 / 一致 10,893。
セル単位の無損失検証も 12,766 / 12,766 で一致。
変化はすべてフォールバック経路で、狙い通りの方向だった:

    [ヤンキー × 真面目] 前「よろしくお願いします！ この団体で強くなりたいです！」
                        後「おう、よろしくな。で、いつから暴れていいんだ？」

ロードマップが挙げていた「真面目なお嬢様も真面目なヤンキーも同じ
『よろしくお願いします！』で喋る」がこれで解消。

承認済み草案4ファイルにも同じ組み替えを掛けた（本文は1文字も変えていない）。
構造を直接検査していたテスト5件も軸を入れ替えた。

### Q4: 旧語彙を現行の性格7種に統一（594ヶ所）

派閥まわりだけ `fiery / grudging / airy / flippant / composed / introverted / carefree`
という独自語彙で書かれていた。**composed がアーキタイプ「鷹揚」と綴りで衝突**しており、
Excel の軸判定が解決できない原因になっていた。

`tools/axis-rewrite.js` に `vocab` を追加（対象テーブルと変換表を固定で持ち、全文検索はしない）。
`getPersonalityType` が現行キーを返すようにし、`_personalityLineKey` の橋渡しを撤去。
personality='normal' のときの特性ベース推論は残した — 「素の子」に色を付けないと
全員が同じ行を喋るため。

これで `F07_LINES` は両軸とも Excel で解決する。COMMON1/5 の archetype 列が空なのは
正しい（あの2表は派閥アーキタイプ AUTHORITY/BOND/… で分岐しており、キャラの
アーキタイプ軸を持たない）。

### 直さずに注記だけ残した既存バグ

`factions.js` の派閥アーキタイプ判定（COMBAT バイアス）が
`f.archetype === 'fiery' || f.archetype === 'flippant'` を見ている。
archetype がこの値を取ることはないので**一度も成立しない死条件**で、実質
`personality === 'bold'` だけで判定されている。直すと派閥の決まり方＝バランスが
変わるためコード内に NOTE を残すに留めた。**要判断**。

### Excel 再書き出し

未反映0を確認してから書き出し（全19,582行）。`キャラタイプ別/` に入る行が大きく増えた
（丁寧×内気354本 / ヤンキー×強気366本 / 丁寧×真面目352本 ほか）。
入れ替え前は標準アーキタイプの行や派閥系テーブルが振り分けから落ちていた。

### 検証まとめ

test/run-all.js 179 passed / 0 failed。
auto-sim 30シーズン(seed 2026) / 25シーズン(seed 777) いずれも violations 0 / ALL CLEAR。

**残: Keisuke 実機確認**（口調が属性どおりに出るか。特にヤンキー・お嬢様・丁寧の
真面目/寡黙/内気あたり。派閥イベントと契約更改が変化の大きい系統）。

## セリフ軸入れ替え S1〜S4 + 旧キー改名 + 抽出ツール修正（2026-08-01）

指示: 「性格が第一分岐だと、お嬢様もヤンキーも同じ行を引いて口調が揃ってしまう」の解消。
着手前に全数棚卸しを作り、系統ごとに分けて進める方針。棚卸しは
`docs/dialogue-axis-swap-inventory.md`、確認事項は `docs/dialogue-axis-swap-questions.md`。

### 引き継ぎの前提が2つ外れていた

1. **「書き出せない4テーブル」は `app.js:1884` のパースエラーとは無関係だった。**
   `BESTMATCH_FLAVOR` / `AI_BREAKTHROUGH_NEWS` / `AI_SLUMP_NEWS` / `AI_MOTIVATION_LOSS_NEWS`
   の4件とも `c79a3ba`(2026-07-26「役目を終えた定数7件を削除」)で src から消えており、
   `TABLE_MANIFEST` に登録行だけが残っていた。4行削除で解決。

2. **未改名は「factions.js の14テーブル」ではなく 31テーブル・6ファイルだった。**
   派閥はその一部。`data.js` 側に `F07_LINES`(37ヶ所) / `FACTION_F02_LINES` /
   `COMMON3_LINES` / `FACTION_TRANSITION_LINES`、さらに派閥でもタッグでもない
   `AUTUMN_WAR_MATCH_LINES` があり、`tag-battle-lines.js` 6テーブル・`CUTIN_LINES`・
   `DAMAGE_SERIF_LINES`・`FLAG_DIALOGUE` も同じ状態。計258ヶ所・758本。

`app.js:1884` は別件の実バグだった。`scanExpr` が正規表現リテラルを理解せず、
`src/app.js:1902` の正規表現（Windows禁止文字の置換）に含まれる `"` を文字列開始と誤認して
`const Storage = {` を丸ごと取りこぼしていた。実害は無かったが、将来のセリフテーブルが
同じ形の正規表現をまたげば黙って消える性質のものなので潰した。宣言 423 → 424 件。

### 「254箇所」の内訳が判明

`tools/axis-rewrite.js swap` の全体集計で **236ヶ所（実体）+ 18ヶ所（別名テーブル
`EVENT_LINES_BY_KEY` の重複）= 254**。別名テーブルは参照だけで構成されており
ソース上に動かすリテラルが無いため対象外（実体を直せば自動追従）。

### 改名（258ヶ所・1対1）

`normal` は性格キーでもアーキタイプキーでもあるため、テキスト置換では壊れる。
値の型で見分ける案も検証したが**反例が75件**あり使えなかった
（`FACTION_TRANSITION_LINES` / `F07_LINES` / `FACTION_F02_LINES` はアーキタイプ位置なのに
値が dict や string）。

そこで `tools/axis-rewrite.js` を新設し、(1) テーブルを評価してアーキタイプ位置の
`normal` 辞書のパスを確定 → (2) 同じテーブルのソースをキーパス付きで走査し、
そのパスの `normal:` トークンだけを置換、とした。評価側とソース側の件数が一致しなければ
書き込まずに異常終了する。31テーブルすべてで 258/258 が一致。

**ゲームは壊れていなかった。壊れていたのは Excel 側。** 引く側が全て
`byP[archetype] || byP.normal` のフォールバックを持っていたため、最大勢力の
archetype='standard' 33名も正しい内容を引けていた。実害は `detectMeta` が
`normal` を性格としか見ないことで、**同じテーブルの中で標準アーキタイプの行だけが
`キャラタイプ別/` に振り分けられず落ちる**という形で出ていた。

### 入れ替え S1〜S4（35ヶ所 / 895セル）

| 段 | 対象 | 読み手 |
|---|---|---|
| S1 `8a5e805` | タッグ6テーブル（784本） | `_tagLineArrFor` 1個 |
| S2 `916a261` | `DAMAGE_SERIF_LINES` / `CUTIN_LINES`（567本） | `_pickSerif` / `_getCutinLines` |
| S3 `0593d8a` | `VS_EX_EMPLOYER_LINES`（196本） | `getVsExEmployerLine` + app.js 2ヶ所 |
| S4 `f0be764` | 派閥24テーブル（314セル） | `getFactionLine` / `_getF08LineByBand` / app.js 2ヶ所 |

`swap` は**セリフ配列のテキストを1文字も触らず、キー2段の入れ子だけを組み替える**
（値をソースからそのまま切り出して再配置）。そのため diff の文字列はすべて移動であって
書き換えではない。

### フォールバックの向きを一度間違えた

最初 `(a,p) → (a,normal)` の2段にしたところ、入れ替え前と**140ヶ所で挙動が変わった**。
原因はアーキタイプ束が疎なこと。`FACTION_F01_LEADER_LINES.ojousama` は `emotional` しか
持たないので、bold のお嬢様が `(ojousama,bold)` を外した瞬間に `(standard,normal)` まで落ち、
性格まで失っていた。

正しくは4段: **`(a,p) → (a,normal) → (standard,p) → (standard,normal)`**。
「同じ口調の normal」を先に試し、それも無ければ「標準の口調で同じ性格」。
S1〜S3 の読み手も同じ4段に揃えた。

### 検証

全 swap 対象 × 全（性格8 × アーキタイプ8、未知値2種を含む）で読み手9系統を叩き、
入れ替え直前と突き合わせ（**2,112エントリ**）。差分は **12件のみ**、すべて
`FACTION_F05_DISSIDENT_LINES`、すべて意図した方向:

```
[お嬢様 × 強気] 前「あの人のやり方、もう付き合いきれねえわ。」
                後「率直に申し上げます。このままでは、わたくしたちは朽ちますわ。」
```

残り2,100エントリは完全一致（タッグ / ダメージ / カットイン / 元雇用団体は差分ゼロ）。
セル単位の無損失検証（正規化キーで前後比較）も各段で不一致0。
`test/run-all.js` 178 passed / 0 failed。auto-sim 30シーズン(seed 2026) と
25シーズン(seed 777) いずれも violations 0 / ALL CLEAR。

### ついでに解消した既存バグ

- **派閥セリフ9テーブルが条件次第で空文字を返していた**（364ヶ所）。
  `FACTION_F02_LEADER` / `F03_SURVIVOR` / `F04_TARGET` / `F05` / `F07_LEADER` /
  `F09_OPENING_A` / `F09_OPENING_B` / `F09_MATCH_POST_WIN` / `F09_ENDING_WIN` は
  task-68 の時点で既に standard キーに改名されていたのに、`getFactionLine` 側は
  `byPersona.normal` を見たままだった。例: 鷹揚×ノーマルの生き残りコメントが出ない。
- `CRISIS_DIALOGUE.enter.normal`（app.js）— このテーブルは改名済みで standard しか持たず、
  未知アーキタイプのキャラは空配列になっていた。
- `archMap.normal`（ui-render.js `_aceFlavorByPersona`）— 同種の死んだ参照。

### S5（残り211ヶ所 / 65テーブル）は未着手

**分割できないため判断待ち。** 読み手を数え直したところ
`getDialoguePool`（`data.js:14879`）が中心にいて、`data.js` / `management.js` /
`relationships.js` / `ui-common.js` / `app.js` の23ヶ所以上がこの1関数を通っている。
反転した瞬間に serve している全テーブルが同時に切り替わるため、
「テーブル1つずつ確認しながら」は物理的にできない。
反転が必要な読み手6ヶ所の一覧は棚卸し文書の §3.5 に記載。

あわせて `docs/dialogue-axis-swap-questions.md` に確認事項6件（最優先は
疎な束での口調 vs 性格の優先順位）。

### 注意

- **Excel の書き出し（`1_エクセルに書き出し.bat`）は破壊的**なので一度も実行していない。
  未反映16件（`KURODA_HEADLINES`）は今回触ったテーブルと重ならず、
  `apply --dry-run` で「16 resolved, 0 skipped」を維持している。
  順序は `3_ゲームに反映.bat` → `1_エクセルに書き出し.bat`。逆にすると16件が消える。
- 読み手のいないセリフが6テーブル・約104本ある（`FACTION_F01`〜`F04` / `F07`）。
  配線するか削るかは未判断。

## 計測ツールの再現性を壊していた Math.random() をシード化（2026-07-31）

### 発端

task-63 の分布計測中、`node test/relationship-distribution-analysis.js 40 12345` を
**同じコード・同じシードで2回走らせると毎回違う結果が出る**ことに気づいた
（同団体ペア数 435 / 420 / 468）。before/after 比較が成立しない状態だった。

`test/auto-sim.js` は冒頭（45-51行）で `Math.random` をシード付き実装に差し替える
モンキーパッチを持っているため影響を受けていなかった。**パッチを当てていない計測ツールだけが
非再現になる**という、気づきにくい形で残っていた。

### 犯人の特定

推測で潰さず、`Math.random` を差し替えて呼び出し元スタックを記録する計測ラッパを書き、
8シーズン走らせて**実際に発火する箇所だけ**を列挙した。結果は3箇所：

| 呼び出し回数 | 箇所 | 状態を動かすか |
|---|---|---|
| 1029 | `pickDialogueLine` (`data.js:14814`) | いいえ（セリフ選択のみ） |
| 1 | `Engine.eventSystem.applyChoiceEffect` (`management.js:22616`) | **はい** |
| 1 | `Engine.eventSystem.applyChoiceEffect` (`management.js:22574`) | **はい** |

指示書が名指ししていた `checkRecontact` は 8シーズンでは発火しなかったが、
呼ばれれば同じく状態（condition / 士気 / bond / rivalry）を動かす。
逆に `applyChoiceEffect` の2件は回数こそ各1回でも、E6 の説得判定が外れると選手が
**退団してロスターごと分岐する**ため、影響は最大級だった。

### 直したもの

いずれも `rng` を省略可能な引数として追加し、渡されなければ `state` から導出する形にした。
分布は変えていない（`5 + Math.floor(Math.random()*6)` → `5 + Engine.rng.int(rng, 0, 5)` は同一レンジ）。

1. **`Engine.relationships.checkRecontact`**（`relationships.js:1897`）
   第5引数 `rng` を追加。フォールバックは
   `Engine.rng.derive(rngSeed, season, week, newCharId, 0xBE7C)`。
   reunion の condition ボーナス / vendetta の 士気・rivalry・bond / grudge の士気、計5箇所を置換。
   呼び出し元3箇所（`management.js` 引き抜き・レンタル、`app.js` スカウト）は、
   直前で既に `ppRelRng` / `rentalRelRng` / `scoutRelRng` を作っていたので**それをそのまま渡した**。
2. **`Engine.eventSystem.applyChoiceEffect`**（`management.js:22451`）
   第4引数 `rng` を追加。フォールバックは
   `Engine.rng.derive(rngSeed, season, week, event.fighter, 0xE0C1)`。
   E1 の代役抽選 / E6 の説得判定 / S_grumble の巻き添え抽選の3箇所を置換
   （S_grumble は計測では発火しなかったが同一関数・同一欠陥のため同時に対処）。
   呼び出し元は AI 側（`management.js:8932`、スコープに `rng` があるので直接渡す）と
   プレイヤー側（`app.js:12029`、`choiceRng` を新規に導出）。

### 検証

- `node test/relationship-distribution-analysis.js 40 12345` ×2 → **完全一致**
  （差分は `Elapsed:` の実測秒のみ。これは実行時間そのものなので当然）
- `node test/auto-sim.js 40` → ALL CLEAR ✓（violations 0 / errors 0 / game overs 0）
- `node test/run-all.js` → **173/173 PASS**

### 残していい Math.random()

`pickDialogueLine` 系のセリフ・記事テンプレ抽選は今回対象外。文字列を選ぶだけで
数値に戻らないため、修正後に出力が完全一致したことで実害がないと確認できている
（`management.js:7051` にも「UI表示専用 — rng不要」と明記済みの前例がある）。

---
## F09派閥対抗戦: 空き枠にロックが残りカードが組めないバグ修正（task-70・2026-07-31）

出典: `docs/codex-tasks/task-70-f09-empty-slot-lock.md`。作業は `wm-task70`
（ブランチ `fix/f09-empty-slot-lock`）で実施、mainは未変更。**未コミット（指示によりコミットなし）**。

### Keisuke実機報告

興行準備で空いた試合スロットに選手を組もうとしたら「⚔ F09 派閥対抗戦のため、この試合の選手は
変更できません」が出て組めない。スクリーンショットでは第1・第2試合が埋まっており、その下の
空き枠が押せない。

### 1. 仮説検証

指示書の仮説は「`buildF09MatchPairs` が返したペアに選手が揃っていない場合、枠は空のままロック
だけ立つ」。**この仮説は方向として正しいが、原因の中身は「0/undefined」ではなく「ロスターから
消えた選手idの取りこぼし」だった。** 確認手順:

- `src/factions.js:5470` の `buildF09MatchPairs` を読むと、両派閥の `memberIds` をそのまま
  OVR順にソートしてペアにしているだけで、`!c.injury && !c.forcedRest` や「ロスターに実在するか」
  のチェックが一切ない（`ovr(id)` は未ヒット時に黙って0を返すだけで、idそのものは弾かない）。
- 対して `src/ui-render.js` 内の兄弟ロジック（F08ディレクティブ注入 3083-3086行付近、派閥内
  序列戦注入 2979-2980行付近）は、いずれも注入直前に
  `G.roster.find(c => c.id === xxx && !c.injury && !c.forcedRest)` で実在・出場可能性を検証してから
  ロックしている。F09だけこの検証が抜けていた。
- `src/ui-common.js:4299` の `getShowCardFighter(id)` は `id>0` でもロスターに見つからなければ
  `null` を返す。単発試合の描画（`ui-render.js` の `_spFighterInfo`）は `f` が `null` なら
  「— 選手選択 —」という**空きスロット表示**にフォールバックする。
- つまり `left`/`right` に「もういないキャラのid」が入ると、UI上は完全に空きスロットに見えるが、
  そのスロットオブジェクトには旧コードが無条件で立てた `_f09Locked: true` が残り、
  `_spOpenPicker`（2447行付近）はスロットの中身を見ずに `_f09Locked` の有無だけでガードしていた
  ため「空いているのに押せない」状態になっていた。
- 発生経路: `_pendingF09` セット時点（`management.js` の週次tick、`reconcileRoster` 後）では
  ペアは有効。しかしその後、同じ週のうちにプレイヤーが社長室から該当選手を解雇/引退承認したり、
  休養辞令（forcedRest）を出したりすると、`reconcileRoster` の次回実行（翌週）を待たずに
  `buildF09MatchPairs` が古い/無効なidを拾い続ける。この仮説はテストの `forcedRest` ケースと
  `roster` から意図的に除外した「退団済みid」ケースの両方で再現・確認した
  （`test/f09-empty-slot-lock-test.js` 参照）。

### 2. 直した箇所

`src/ui-render.js` のみ変更（指示どおり `factions.js`/`match-engine.js`/`management.js` は不変）。

1. **F09注入（3041行付近）**: 各ペアについて `_f09FighterOk(id)`
   （`G.roster.find` で実在確認 + `!c.injury && !c.forcedRest`）を両者に適用し、
   **両者そろって出場可能なペアだけ** `_f09Locked: true` で書き込む。不成立のペアは
   `{ left: 0, right: 0, isTitle: false }` にリセットしてロックを立てず、通常の空きスロットとして
   開放する。同時に `console.warn('[WM F09] incomplete pair — leaving slot unlocked/open', {season, week, slotIdx, pairCount, showCardLength, fighterIdA, fighterIdB})` で状況を残す。
   ロック済み選手を他枠から除去する後段ロジックの `lockedIds` も、実際にロックした（＝有効な）
   ペアの id だけを積むように変更（無効ペアのidは無関係な枠に影響しない）。
2. **ピッカーのガード（最後の砦・2446行付近）**: `slot._f09Locked` が立っていても、
   `left>0 && right>0`（両者とも埋まっている）の場合だけ従来どおりブロックする。
   どちらか一方でも0（＝実質空き枠）なら、`console.warn('[WM F09] _f09Locked slot has an empty side — allowing picker to open', {...})` を出したうえでガードを素通りさせ、ピッカーを開く。
   F08ロック・派閥内序列戦ロックの分岐はこの変更の対象外（絶対ロックのまま、意図的に不変）。

### 3. 空き枠が必ず操作できることの確認方法

新規テスト `test/f09-empty-slot-lock-test.js` で、`src/ui-render.js` から
「F09注入ブロック」と `_spOpenPicker` 関数をソース文字列として切り出し（`faction-f09-show-flow-guard-test.js` / `rivalry-resolution-match-guard-test.js` と同じ手法）、`new Function` で単体実行して検証:

1. forced-rest / 退団id を含む3ペア中2ペアが不成立 → 該当2枠は `left:0,right:0` かつ
   `_f09Locked` 無し、他枠の選手除去(strip)ロジックは有効ペアのみ機能、`_pendingF09` は
   （1ペアでも成立しているため）維持されることを確認
2. `_f09Locked:true` かつ `left:0,right:0` の空き枠に対して `_spOpenPicker` を呼ぶと、
   トースト無しでピッカーが開く（`_spActivePicker` がセットされ `renderShowPrep` が呼ばれる）ことを確認
3. 全ペア成立時は従来どおり全枠ロック（回帰確認）
4. `_f08Locked` / `_internalChallengeLocked` は空き枠でも従来どおり絶対ロックのまま
   （F09専用の抜け道が波及していないこと）を確認

`node test/f09-empty-slot-lock-test.js` 単体PASS、`node test/run-all.js` フルスイート
175 tests **全PASS**（既存174 + 新規1）。engine系（`match-engine.js`/`management.js`）は
無変更のためauto-simは対象外（CLAUDE.md「app.js やUIのみの変更→不要」に該当）。

### 4. 不変条件確認

1. F09が正常に成立した枠は従来どおりロック → 確認（テスト2件目・regression）
2. 空き枠は必ず操作できる → 確認（ピッカーガードのfailsafeで担保、テスト4件目）
3. F08・派閥内序列戦のロックを壊さない → 確認（テスト6・7件目、当該分岐は無変更）
4. GameStateへの書き込みを増やさない → 確認。新規state項目は追加していない。
   `console.warn` はログのみでstateに書き込まない。ロック解除時に `_f09Locked` を書かない
   （元々書いていなかったキーを書かないだけ）ため、書き込み量はむしろ減る方向
5. `node test/run-all.js` 全PASS → 確認（175/175）

### 迷った点（未実装・要判断）

- 「出場可能」の判定基準を `!c.injury && !c.forcedRest`（F08/派閥内序列戦と同じ基準）にしたが、
  `onLeave` は含めていない（既存の兄弟ロジックがどれも見ていないため踏襲）。もし `onLeave` も
  F09の出場不可条件に含めるべきなら別途指示がほしい。
- 根本的には `factions.js` の `buildF09MatchPairs` 自身が実在・出場可能な選手だけで
  ペアを組む（かつ可能なら代役で埋め直す）のが理想だが、今回のスコープ外（`ui-render.js`のみ）
  のため見送り。空きが出ても最大5→3まで自動で詰め直す、といった改善は別タスク向けの提案として
  残す。
## アーキタイプの `normal` を `standard` に改名（task-68・2026-07-31）

出典: `docs/codex-tasks/task-68-archetype-normal-rename.md`。作業は `wm-task68`
（ブランチ `feat/archetype-normal-rename`）で実施、mainは未変更。**未コミット
（指示によりコミットなし）**。

### 背景

`normal` が性格リストとアーキタイプリストの両方に存在するため、書き出しツール
`tools/dialogue-workbook.js` の `detectMeta` がアーキタイプの `normal` を性格と
誤ってラベルし、アーキタイプ列が空になる不具合があった（Keisuke指摘）。改名で
曖昧さを根元から絶つ。新しい綴りは **`standard`**（表示ラベル「標準」はそのまま、
プレイヤーに見える文言は1文字も変えていない）。

### 判定方法（機械的分類）

`normal:` という同じ綴りが表によって性格を指したりアーキタイプを指したりするため、
一括置換ではなく **構造解析スクリプト**で判定してから置換した(スクラッチパッドの
`classify-normal.js`。本体は保存していないため、手法をここに記録する)。

1. `tools/extract-dialogue-parser.js` の `findTopLevelDeclarations`/`scanExpr` を
   流用し、対象8ファイル（`data.js` / `data-faction-dialogue.js` / `relationships.js`
   / `ui-common.js` / `ui-render.js` / `app.js` / `coach-lines.js` / `victory-lines.js`。
   `management.js` はAI王座ブロック行9100〜9250を除外して同様に走査）の**全ての
   トップレベル宣言**をオブジェクトリテラルとして再帰的に走査し、`normal` という
   キーが現れる**すべての位置**を収集した。
2. 各出現位置について、**同じオブジェクトリテラル内の兄弟キー**を見て軸を判定:
   兄弟に `composed/ojousama/delinquent/cool/seductive/polite` があればアーキタイプ、
   `bold/quiet/shy/easygoing/earnest/emotional` があれば性格。
3. 兄弟が `normal` 単独（他のアーキタイプ変種がまだ書かれていない性格バケツ）の
   場合は、**親オブジェクトの軸を継承**して判定した（[性格][アーキタイプ]の入れ子
   で、性格バケツ配下に来た `normal` は原則アーキタイプ）。
4. 3でも判定できない3件（`App._NEWSPAPER_HEADLINES.normal` / `_NEWSPAPER_ARTICLES.normal`
   =試合種別の「通常興行」区分、`Engine.mq.STAGE_LABELS.normal`=興行ステージ区分の
   「通常興行」ラベル）は**性格/アーキタイプ軸と無関係と判明**したため対象外。

結果: 495件の `normal:` キー出現のうち、246件がアーキタイプ、246件が性格、3件が
軸無関係（上記）。さらに `CHALLENGE_LINES` / `CHALLENGE_REQUEST_OPPONENT_REACTIONS`
（`archetype_personality` 複合キー形式。例 `polite_earnest`）で計14件（`normal_*`
→ `standard_*`、7性格×2テーブル）を別途特定した。

### 置換したもの

1. **`ALL_CHARS` の `archetype` フィールド**（`src/data.js` 12〜142行）: 33名分
   `archetype:'normal'` → `archetype:'standard'`。`personality` フィールドは
   1件も触っていない（37名が `personality:'normal'` のまま）。
2. **コード側の `normal` フォールバック/比較**（約35箇所、`app.js` / `data.js` /
   `relationships.js` / `ui-common.js` / `ui-render.js` / `victory-lines.js` /
   `management.js`）: `fighter.archetype || 'normal'` のようなアーキタイプ用の
   既定値・比較値のみ `'standard'` に変更。`fighter.personality || 'normal'` は
   1件も変更していない（同一行に両方あるケースも archetype 側だけ変更）。
3. **テーブルキー本体**: 上記構造解析で「アーキタイプ」と判定された246件のうち、
   後述の理由で読み手コードを直せない20件を除いた計83件のキーを `normal:` →
   `standard:` に改名（該当テーブル19個。内訳は下記）。
4. **複合キーテーブル**: `CHALLENGE_LINES` / `CHALLENGE_REQUEST_OPPONENT_REACTIONS`
   の `normal_*`(7種) → `standard_*`(7種)、計14キー。

改名した19テーブル: `AUTUMN_WAR_MATCH_LINES`(→後述の理由で**再度リバート**)、
`CHALLENGE_REQUEST_NO_LINES`、`CRISIS_DIALOGUE`、`GAMEOVER_LINES`、
`RELEASE_INTERVIEW_LINES`、`TENCHOSEN_DRAMA_LINES`、`TENCHOSEN_PREEVENT_LINES`、
`FACTION_F02_LEADER_LINES`、`FACTION_F03_SURVIVOR_LINES`、`FACTION_F04_TARGET_LINES`、
`FACTION_F07_LEADER_LINES`、`FACTION_F09_OPENING_LINES_A/B`、
`FACTION_F09_MATCH_POST_WIN_LINES`、`FACTION_F09_ENDING_WIN_LINES`、
`Engine.relationships.flags.ARCHETYPE_FORGIVENESS_BASE`、`EMOTION_TEXTS`、
`FIGHTER_INVITE_GRAD_LINES`、`VS_EX_EMPLOYER_LINES`。

`FACTION_F09_MATCH_POST_WIN_LINES` / `FACTION_F09_ENDING_WIN_LINES` /
`FACTION_F09_OPENING_LINES_A/B` は `app.js` の共通ヘルパー(`_f09PickLine`/
インライン`pickLine`)を、後述の理由で未改名のまま残る兄弟テーブルと共有して
いるため、フォールバックを `byP[arch] || byP.standard || byP.normal || {}` の
二段構えに変更し、どちらのテーブルが渡っても正しく引けるようにした。

### あえて改名しなかったもの（意図的な除外・計20テーブル）

**A. 指示書で名指しされた6テーブル**（「性格だけで分岐している」との前提）:
`FACTION_F02_LINES`(data.js) / `FACTION_F09_MATCH_PRE_LINES` /
`FACTION_F09_MATCH_POST_LOSE_LINES` / `FACTION_F09_ENDING_LOSE_LINES` /
`INTERNAL_CHALLENGE_POST_WINNER_LINES` / `INTERNAL_CHALLENGE_POST_LOSER_LINES`。

**発見した齟齬**: 実際にソースを読むと、この6テーブルは全て
`[personality][archetype]` の入れ子構造で、読み手コード（`getF02ClashLine` /
`_f09PickLine` / `_getF08LineByBand`）も `personality×archetype` のフォール
バックを行っている（例: `FACTION_F02_LINES` は
`bold: { attack: { normal:'…', ojousama:'…', delinquent:'…', … } }` と7
アーキタイプ全種が実在し、コード側コメントにも「6 personality × 7 archetype ×
{attack,defend}」と明記されている）。**指示書の「第一階層は性格」は正しいが、
「アーキタイプ次元が無い」という前提は誤り**だった可能性が高い。ただし指示書に
名指しで「触らない」とある以上、**独断で覆さずここに明記した上で従った**
（機能上のリスクはゼロ — 未改名でも `.normal` フォールバックがそのまま生きている
ため、実際のプレイには一切影響しない。Excel書き出しのアーキタイプ列だけが
埋まらないままになる、という書き出しツール側の限定的な既知課題として残る）。

**B. 読み手コードが `factions.js` にあり、このタスクでは編集できないため
除外した14テーブル**（`FACTION_F01_LEADER_LINES` / `FACTION_F01_FOLLOWER_LINES` /
`FACTION_F05_DISSIDENT_LINES` / `FACTION_F06_AMBIENT_LINES` /
`FACTION_F08_LEADER_LINES` / `FACTION_F08_PRE_MATCH_LINES_A/B` /
`FACTION_F08_POST_MATCH_WINNER_LINES` / `FACTION_F08_POST_MATCH_LOSER_LINES` /
`INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES` / `INTERNAL_CHALLENGE_PRE_LEADER_LINES` /
`FACTION_TRANSITION_LINES` / `COMMON3_LINES` / `F07_LINES`）:
`Engine.factions.getFactionLine` / `_getF08LineByBand` / `getTransitionLine` /
`getCommon3Line` / `getF07Line` が全て `byPersona.normal` のようなハード
コードされたフォールバックを持つが、これらの関数は `factions.js`（本タスクの
編集許可ファイル外）にある。テーブル側だけ改名すると、そのテーブルの
アーキタイプ未定義セル（実際に大半のセルがそう）が空文字にフォールバックし、
**セリフが引けなくなる退行**が起きるため見送った。特に
`INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES`/`PRE_LEADER_LINES`（指示書は
「254箇所」側＝改名対象と分類）も、`POST_WINNER_LINES`/`POST_LOSER_LINES`と
**同じ関数を共有**していると判明したため、対象4テーブルすべてを見送った。

**C. 改名後にテスト破綻が発覚し、リバートした1テーブル**（`AUTUMN_WAR_MATCH_LINES`）:
一度は改名したが、`test/autumn-war-match-dialogue-test.js` が
`docs/autumn-war-match-dialogue-draft-v0.1.md`（確定済み下書き）とライブコードの
オブジェクトリテラルを `deepStrictEqual` で厳密比較しており、キー名変更で
構造不一致になり失敗した。このテーブルの読み手（`getAutumnWarMatchLine`）は
`pData[archetype] || pData._default || []` と **`_default` ベースの
フォールバック**で `.normal` 直参照が無く機能的リスクはゼロだったため、
docs/ 配下の下書きファイルや既存テストへの手出しを避けるためにリバートし、
除外リストに追加する判断をした。

### 既存テストへの最小限の例外（2件）

上記に反して、以下の2箇所だけは**改名の直接の帰結として不可避**だったため
既存テストの中身を修正した（データの意味は変えず、リネームに追従しただけ）:

1. `test/challenge-request-result-reaction-test.js`: `CHALLENGE_LINES.normal_normal`
   を3箇所 `CHALLENGE_LINES.standard_normal` に変更。理由: 複合キー
   `normal_normal` → `standard_normal` の改名は、`Engine.challengeRequest.pickLine`
   の中間フォールバック層（`${archetype}_normal`。ここの `archetype` は実際の
   キャラの値であり `'normal'` 固定ではない）も道連れで意味が変わるため、
   ここだけは「テーブルを戻す」と「実際のキャラ(archetype='standard')が
   性格別バリエーションを引けなくなる」という**本物の退行**を招く。テーブルの
   改名を維持し、テストのハードコードされたキー参照だけを追従させた。
2. AUTUMN_WAR_MATCH_LINES は前述の通りテーブル側をリバートして解決したため
   テストへの手出しは不要だった。

### セーブ移行（`Engine.saveDoctor`）

`src/management.js` の `Engine.saveDoctor` に `_normArchetype(c)` を追加
（`archetype === 'normal'` のときだけ `standard` に読み替え、`personality` は
一切触らない）。`repairOnLoad` 内で `roster` / `freeAgents` / `scoutCandidates`
/ `retiredFighters` / `aiOrgs[].roster` の全キャラに適用。`dormantPool` は
`{id, age}` のみで `archetype` を持たないため対象外。

移行の挙動保存性は `test/archetype-key-rename-test.js` で検証: 移行後の
`archetype:'standard'` キャラが引く `RELEASE_INTERVIEW_LINES` のプールと、
最初から `archetype:'standard'` だったキャラが引くプールが **同一配列
参照（===）** であることを確認済み。

### `tools/dialogue-workbook.js`

`ARCHETYPE_LABELS` のキーを `normal` → `standard` に改名（ラベル文言「標準」は
不変）。`detectMeta` は ARCHETYPE_KEYS と PERSONALITY_KEYS がもう重複しないため
判定順に依存しなくなった旨をコメントで明記（ロジック自体は元々どちらの順で
判定しても壊れない書き方だったため、コードの実質変更はコメントのみ）。

### テスト

新規 `test/archetype-key-rename-test.js`（41チェック、全PASS）。検証内容:
アーキタイプ/性格のキー集合、`ALL_CHARS` の値、`repairOnLoad` の移行（5リスト
全部+冪等性+`archetype`欠落オブジェクトの無害化）、移行前後のセリフプール
同一性、代表テーブル（`FACTION_F02_LEADER_LINES`=12本、`FACTION_F03_SURVIVOR_LINES`
=15本）の本数保持、複合キーテーブルの改名、**未改名テーブルでも実キャラ
(archetype='standard')が正しくセリフを引けること**（退行なしの証明）、
`detectMeta` の判定結果。

`node test/run-all.js`: 175 test files, **全PASS**（新規テスト含む）。
`node test/auto-sim.js 40`: Total violations: 0, Total errors: 0, Game overs: 0,
**Result: ALL CLEAR ✓**。

### 変更ファイル

`src/data.js`、`src/data-faction-dialogue.js`、`src/relationships.js`、
`src/ui-common.js`、`src/ui-render.js`、`src/app.js`、`src/coach-lines.js`、
`src/victory-lines.js`、`src/management.js`、`tools/dialogue-workbook.js`、
`test/archetype-key-rename-test.js`（新規）、`test/challenge-request-result-reaction-test.js`
（複合キー参照の追従のみ）。`セリフ編集/` 配下のxlsxは検証のため
`node tools/dialogue-workbook.js export` で再生成した（コミットしないため
実害なし）。

### 残課題

- 上記A・Bの計20テーブルは `normal` キーのまま。読み手コードを直せる別タスク
  （`factions.js` を編集可能な文脈、または6テーブルの「性格のみ」前提の
  Keisuke再確認）が来たら改名を検討する。
- `docs/dialogue/` のMarkdown索引は今回のセッションでは再生成していない
  （`node tools/extract-dialogue.js` は読み取り専用ツールで別件）。
## AI王者が負傷しただけでベルトを剥奪される不具合を直す + AI王座戦のビッグマッチ化・挑戦資格緩和（task-67・2026-08-01）

出典: `docs/codex-tasks/task-67-ai-champion-injury-belt.md`（task-65本体を内包）、前段調査
`docs/ai-title-defense-survey-v0.1.md`、`docs/codex-tasks/task-65-ai-title-bigmatch.md`。
作業は `wm-task67`（ブランチ `fix/ai-champion-injury-belt`、親コミット1a2fb0d=task-62適用済み
マージコミット）で実施、mainは未変更。**未コミット（指示によりコミットなし）**。

### §1（本命）: 負傷でベルトを剥奪しない

`Engine.rival.processAIWeek`（`management.js:9447`付近）の空位判定が
`champAlive = champId && roster.find(f => f.id === champId && !f.injury)` と、
「ロスターに居るか」と「負傷していないか」を同じ条件に混ぜていた。このため**軽傷1週間でも
champAliveがfalseになり、試合をせずにベルトが移っていた**（防衛回数は0にリセット、
王者が回復しても戻らない）。プレイヤー側の`Engine.title.validateChampion`は
「ロスターから居なくなったときだけ」空位化しており、AI側だけの非対称だった。

`champAlive`の判定から`!f.injury`を外し、「ロスターに居るか」だけを見るように変更した
（`champAlive = champId && roster.find(f => f.id === champId)`）。負傷中の王者は
`generateAIMatchCard`の`available`フィルタ（`!f.injury`）でそもそもカードに乗らないため
試合は組まれず、王座交代/防衛の判定ブロック（`champResult`が見つからないケース）を
素通りする。防衛回数・`lastTitleMatchWeek`（クールダウンの起点）は負傷週に触れられず、
そのまま次週に持ち越される（テストで確認）。引退・移籍・解雇でロスターから消えた場合は
従来どおりここで空位化→OVR最上位への戴冠が起きる（変更なし）。

**長期離脱の扱い: (a)「期間によらず保持」を採用**（(b)「一定週数超で返上」は不採用）。理由:

- プレイヤー側の`validateChampion`も元々、負傷の有無・期間を一切見ずに「ロスターに居るか」
  だけで判定している。今回の変更は「AI側をプレイヤー側の既存規則に揃える」ことが目的であり、
  (a)はその規則を寸分違わず踏襲する選択になる。
- AIの負傷テーブルの上限を確認したところ（`management.js:9325`、`プレイヤーと同等のINJURY_TABLE
  分布`とコメントあり）、重傷でも `weeksLeft = 4 + rng(0,4)` で最大8週。しかも負傷中は
  再負傷（スタッキング）しない（負傷中の選手は`generateAIMatchCard`の対象外になるため、
  新たな負傷ロールを引く機会がない）。つまり「無期限に持ち越される」ケースはこの実装では
  そもそも起こり得ず、(b)が防ぎたい「明らかに長期」の懸念は最大8週という有限の範囲に収まる。
- (b)を選ぶと「何週からが“明らかに長期”か」という新しい閾値を、根拠となる実測データなしに
  決め打ちすることになる。CLAUDE.mdの数値哲学（安易な数値をドラマの裏に置かない）に照らすと、
  データの裏付けがない閾値を追加するより、プレイヤー側で既に成立している規則にそのまま
  揃える(a)の方が説得力がある。

### §2（task-65 §1相当）: AI王座戦を tier2（ビッグマッチ）にする

`management.js:9208`付近、AIの試合は`Engine.battle.simulateMatch(...,1,...)`とtierを`1`に
直書きしていた。プレイヤーの通常興行タイトル戦は`App._normalShowMatchTier`が必ず2を返すのに
対し、AI王座戦だけ常に通常tierで処理されていた。task-61で導入済みの`isAiTitleCard`判定
（王者出場+12週クールダウン明け+相手が挑戦資格者）をそのまま流用し、
`const aiMatchTier = isAiTitleCard ? 2 : 1;` でAI王座戦だけtier2にした。AIの通常興行は
`isAiTitleCard`がfalseのままtier1で変化なし。恣意的な下駄ではなく「王座戦を王座戦として扱う」
だけである点をコード側のコメントにも明記した。

### §3（task-65 §2相当）: 挑戦資格を上位3人→上位4人

`Engine.title.getEligibleChallengers`の`rankingLimit`（ai側）を`3`直書きから
`AI_TITLE_ELIGIBILITY_CFG.rankingLimit`（新規定数、`src/data.js`、値4）参照に変更。
`maxOvrGap`も同様に`AI_TITLE_ELIGIBILITY_CFG.maxOvrGap`（値5、**変更なし**）へ定数化した。
player側（5/8）は元のまま直書きで、この定数を参照しない（テストで両方を確認）。

既存の`test/title-challenger-eligibility-test.js`が旧・上位3人境界を固定して検査していたため、
新しい上位4人境界に合わせて更新した（reportedCaseRosterの4番目の挑戦者が、旧仕様では
対象外→新仕様では対象、というのが今回の変更の意図そのものだったため、アサーションを
反転させて更新）。

### §4: 検討したが不採用

§1〜§3を入れた段階で「0回で陥落」が目標(30〜40%)にわずかに届かなかった（seed42/43で
44〜45%、他の指標は目標達成）ため、指示どおり`CHAMPION_DEFENSE_ESCAPE_BONUS`をAI王座戦に
限って強める実験を行った（`buildRingInOpts`に`championDefenseEscapeBonus`オプションを追加し、
AI王座戦だけ新定数`AI_CHAMPION_DEFENSE_ESCAPE_BONUS=0.05`（既定0.02の2.5倍）を渡す形。
player側は`options`を渡さないため既定値のまま）。

**実装は正しく動作したが、効果が測定できないほど小さかった**ため不採用にした（コードは
全て復元済み、`src/data.js`・`src/management.js`・`src/match-engine.js`に痕跡なし）。
seed42・40シーズンで比較すると、§1+2+3適用後と§4適用後で**全指標が完全に一致**した
（semantic fingerprint `449c47ec`で完全一致）。原因を`WM_DEBUG_CDB`環境変数によるデバッグ計測
（一時的に`match-engine.js`へcounter用のconsole.errorを追加→計測後に`git checkout`で復元、
差分ゼロを確認済み）で特定した:

- `CHAMPION_DEFENSE_ESCAPE_BONUS`が効くのは、フォール/TKO/ギブアップの決着チェックで
  防御側（＝王者）がキックアウト/ロープエスケープを試みる、ごく狭い分岐だけ
  （`match-engine.js:570-605`）。
- この分岐自体が**40シーズン・AI3団体合算で15回しか発火しなかった**（161件の完結reignに対して）。
- しかも15回中4回は、王者の`mn`値＋人気差＋タイトル戦の脱出率ボーナス(+0.10)だけで既に
  `koChance`/`escChance`の上限（0.45/0.40）に達しており、ボーナスを0.02→0.05にしても
  **数式上まったく差が出ない**状態だった（`Math.min(chance + bonus, cap)`のcapで吸収される）。
- 残り11回は理論上は差が出る状況だったが、0.02→0.05という差は0.03幅の乱数ウィンドウでしか
  結果を反転させない。11回×0.03 ≈ 期待反転回数0.3〜0.4回で、この特定のseedでは偶然0回だった
  （`P(0回)=(1-0.05)^11≈0.57`相当で、起こって不思議はない範囲）。

つまり、CHAMPION_DEFENSE_ESCAPE_BONUSという手は「値が小さすぎる」のではなく、**そもそも
発火する場面が構造的に稀すぎて、AI3団体合算100件超のreign統計を動かす力を持たない**という
結論になった。値をさらに大きくしても(例えば0.05→0.20)、発火回数自体が増えない限り
「0回で陥落」の母数（全reign）に対する影響は誤差の範囲を出ない。§1〜§3で主要因（不戦による
移動45%→9%前後、短期決戦のブレ、挑戦者選定の硬直化）を潰した後に残る「0回陥落」のギャップは、
この特定の逃げ切りボーナスとは別の要因（例えば挑戦者側の初動有利、あるいはOVR差そのものの
ダメージ補正）に起因する可能性が高い。**数字を作るために値を恣意的に強めることはしなかった**。

### 計測（同一シード42・43、各40シーズン、段階ごと。フォアグラウンド実行）

`test/`・`src/`は無改変。`test/auto-sim.js`と同じvmローダー手法をスクラッチパッドの
`measure-ai-title-defense.js`にコピーし、以下2点を追加した:

1. `Engine.rival.processAIWeek`をラップし、実行前後で`aiOrgs[orgId].titles.world.
   {championId,defenses}`を比較。championIdが変わったreignを「完結」とみなし、
   直前の`defenses`値を最終防衛回数として記録。`_lastMatchResults`（処理後に
   `nextOrgData`へ積まれる直近試合結果）に旧王者vs新王者の対戦があり旧王者が負けていれば
   `reason:'loss'`、無ければ`reason:'vacancy'`（不戦・空位化）として分類した。
2. `Engine.title.crownChampion`/`Engine.title.validateChampion`を同様にラップし、
   プレイヤー側も同じ手法で参考値を記録した（`checkTitleEstablishment`を毎週呼ぶ1行も追加
   — `test/auto-sim.js`本体には元々プレイヤー王座の自動設立処理が無いため。UIの
   `App.checkTitleEstablishment`の代替）。

ベースライン計測値は`docs/worklog.md`のtask-62セクションの「修正後」列（seed42/43）と
完全一致し（org_s/org_a/org_bの平均防衛回数が全て一致）、この計測手法の再現性を確認できた。

| seed | 段階 | org_s 平均 | org_a 平均 | org_b 平均 | **AI3団体合算 平均** | 0回陥落 | 3回以上 | **敗北以外での移動** |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 42 | ベースライン | 0.69 | 1.02 | 0.77 | **0.81** | 56.0% | 9.0% | **38.3%** |
| 42 | §1 | 1.00 | 1.12 | 1.42 | **1.18** | 50.0% | 13.9% | **8.2%** |
| 42 | §1+§2 | 1.07 | 1.47 | 1.34 | **1.29** | 48.4% | 14.0% | **9.7%** |
| 42 | §1+§2+§3 | 1.76 | 1.15 | 1.96 | **1.58** | 44.1% | 26.7% | **9.3%** |
| 42 | §1+§2+§3+§4(不採用) | 1.76 | 1.15 | 1.96 | **1.58**（変化なし） | 44.1% | 26.7% | 9.3% |
| 43 | ベースライン | 0.69 | 0.62 | 0.83 | **0.71** | 58.5% | 7.1% | **38.8%** |
| 43 | §1 | 1.10 | 1.20 | 2.10 | **1.42** | 42.4% | 18.6% | **7.6%** |
| 43 | §1+§2 | 1.26 | 1.30 | 1.53 | **1.36** | 46.8% | 17.9% | **10.4%** |
| 43 | §1+§2+§3 | 1.61 | 1.75 | 1.80 | **1.73** | 45.2% | 23.6% | **8.3%** |

目標（平均防衛1.5〜2.2、0回陥落30〜40%、3回以上20〜30%、敗北以外での移動を大きく下げる）との対比:

- **平均防衛回数**: seed42=1.58、seed43=1.73。**目標レンジ(1.5〜2.2)内**。
- **0回で陥落**: seed42=44.1%、seed43=45.2%。**目標(30〜40%)にわずかに届かず**（4〜15pt超過）。
- **3回以上**: seed42=26.7%、seed43=23.6%。**目標レンジ(20〜30%)内**。
- **敗北以外での移動**: 38.3〜38.8%→8.2〜10.4%に低下。**「大きく下げる」を達成**（§1が直接の狙い
  どおり効いている。§2・§3を足しても大きくは動かない＝§1が支配的要因だったことの裏付け）。
- **プレイヤーとの比較**: 参考計測（プレイヤー通常興行、auto-simのランダム編成という下限条件）は
  seed42で2.16→2.09→2.64→3.23、seed43で1.94→3.00→2.18→1.49と段階間で大きく振れた。
  これは`Math.random`共有ストリーム経由の計測ハーネス特有のノイズで、プレイヤー側のコードは
  1行も変更していない（`git diff`で確認、`crownChampion`/`recordDefense`/
  `getEligibleChallengers('player')`/プレイヤー通常興行の`buildRingInOpts`呼び出しは
  ソース文字列レベルで無変更。task-61 worklogで既に確認済みの既知パターン）。AI3団体の値
  (1.58/1.73)はtask-65が基準としたプレイヤー参考値2.71は一貫して下回っている。

### どの手がどれだけ効いたか

- **§1（負傷剥奪の是正）が支配的**: 平均防衛0.81→1.18(seed42)/0.71→1.42(seed43)と、
  この1手だけで既に目標レンジの下限付近まで到達。「敗北以外での移動」も38%台→8〜10%台に
  一気に落ちた。事前調査（task-62 worklog）で特定した「王座交代の45%は不戦」という主因への
  直接対処であり、狙いどおりの効果が出た。
- **§2（tier2化）は小さいが一貫してプラス**: 平均防衛は両seedとも微増(1.18→1.29、
  1.42→1.36 ※seed43はほぼ横ばい)。3回以上の割合はseed42で微増、seed43でほぼ横ばい。
  task-65時点の事前予想（短期決戦のブレを均す）どおりの方向だが、単独では小さい。
- **§3（挑戦資格4人化）が2番目に大きい**: 平均防衛1.29→1.58(seed42)/1.36→1.73(seed43)、
  3回以上14.0%→26.7%/17.9%→23.6%と、§1に次ぐ規模の改善。挑戦者の顔ぶれが1人増えたことで、
  「毎回同じ最強挑戦者と当たる」構造がさらに緩んだと見られる。
- **§4（逃げ切りボーナス強化）は測定不能なほど小さい**: 上記のとおり構造的に発火が稀すぎ、
  40シーズンでは効果が観測できなかった（不採用・詳細は上記）。

### テスト

新規 `test/ai-champion-injury-belt-test.js`（6ブロック）:
1. 負傷中の王者はロスターに残っている限りベルトを保持する（防衛回数・lastTitleMatchWeekも不変）
2. ロスターから居なくなったら従来どおり空位化→OVR最上位が新王者になる
3. AI王座戦は`matchTier=2`で`simulateMatch`が呼ばれる
4. 王座と無関係のAI通常試合は`matchTier=1`のまま
5. `getEligibleChallengers`のai側が上位4人+差5以内（`AI_TITLE_ELIGIBILITY_CFG`経由）、
   player側が5/8のまま（境界値を実際に振って確認）
6. プレイヤー側の`validateChampion`（負傷では剥奪しない・離脱では剥奪する、いずれも従来どおり）
   ・`buildRingInOpts`呼び出し形・`getEligibleChallengers`のplayer分岐の数値リテラルが
   一切変わっていないことをソース文字列レベルでも確認

既存`test/title-challenger-eligibility-test.js`は、旧・上位3人境界を固定して検査していたため
今回の意図的な変更（上位3→4人）に合わせてアサーションを更新した（4番目の挑戦者が
「旧仕様で対象外→新仕様で対象」に反転する、というのがまさに§3の変更内容そのもの）。

### 不変条件・検証結果

1. **プレイヤー団体の王座ロジックを1行も変えない**: **PASS**（`git diff`で確認。変更は
   `getEligibleChallengers`のai分岐・`processAIWeek`のtier/champAlive判定のみ。
   `crownChampion`/`recordDefense`/`validateChampion`/`getEligibleChallengers('player')`の
   player分岐/`App._normalShowMatchTier`はソース文字列レベルで無変更。テスト6で確認）
2. **AIの通常興行はtier1のまま（王座戦だけtier2）**: **PASS**（テスト3・4）
3. **`maxOvrGap`（ai=5）を変えない**: **PASS**（`AI_TITLE_ELIGIBILITY_CFG.maxOvrGap=5`。テスト5）
4. **短期の負傷で王座が動かないこと**: **PASS**（テスト1）
5. **王者がロスターから居なくなったら従来どおり空位になる**: **PASS**（テスト2）
6. **乱数はシードから導出**: **PASS**（既存コードのRNG経路のみ使用、新規RNG消費なし。
   `Math.random`/`Date.now`は使用していない）
7. **`Engine.validateGameState`が新しい違反を出さない**: **PASS**（`node test/auto-sim.js 40`
   参照）
8. **`node test/run-all.js`全PASS / `node test/auto-sim.js 40` ALL CLEAR**: **PASS**
   - `node test/run-all.js`: **175/175 PASS**（既存174 + 新規1、うち`title-challenger-
     eligibility-test.js`は§3に合わせて更新）
   - `node test/auto-sim.js 40`（フォアグラウンド実行、ランダムseed）:

```
Total violations: 0 (0 unique)
Total errors: 0
Freq warnings: 0
Total weeks simulated: 2120
Game overs: 0
Semantic fingerprint: ed480c3f
Elapsed: 169.9s
Result: ALL CLEAR ✓
```

### 迷った点・質問として残すこと（実装はしていない）

- **「0回で陥落」が目標(30〜40%)にわずかに届かない(44〜45%)**。平均防衛回数・3回以上の
  割合・敗北以外での移動はいずれも目標を満たしているが、この1指標だけ残った。§4で唯一
  許可されていたレバー（`CHAMPION_DEFENSE_ESCAPE_BONUS`強化）は構造的に効かないと判明した
  ため、これ以上の追加介入はスコープ外・実装していない。仮に追い込むなら「挑戦者側の初動
  有利を弱める」「OVR差によるダメージ補正をタイトル戦だけ緩める」等の別レバーが考えられるが、
  いずれも本タスクの指示（§1〜§3+CHAMPION_DEFENSE_ESCAPE_BONUSの範囲）の外側であり、
  バランス設計判断としてKeisuke判断を仰ぎたい。現状の44〜45%でも、ベースラインの56〜59%
  からは大きく改善している点は付言する。
- プレイヤー参考値（auto-simのランダム編成）が段階間で大きく振れる件は、task-61 worklogで
  既に確認済みの計測ハーネス由来のノイズ（Math.random共有ストリーム）であり、今回も同じ
  パターンを踏襲していることをソース差分で確認済み。実プレイのプレイヤー体験には影響しない。
## 実力差を勝敗に効かせる — 番狂わせを「奇跡」に戻す（task-69・2026-08-01）

出典: `docs/codex-tasks/task-69-ovr-gap-decisiveness.md`。作業は `wm-task69`
（ブランチ `feat/ovr-gap-decisiveness`）で実施、mainは未変更。**未コミット（指示によりコミットなし）**。
**100シーズンの確認ランは未完了**（50/100で打ち切り。以下の数値はすべて40シーズン以下の計測）。

### §1 計測(調整前・実装)

`test/auto-sim.js` の `matchBalanceProbe.ovrBands` を細分化。差0を独立(strongerSideの概念が無いので
`left勝利/matches`で追う)、差1-2/3-4/5-9/10-14/15-19/20-24/25-29/30+の8バンド、
tier1(通常)/tier2(ビッグマッチ)/carried(`_hpOverride`で消耗持ち越しが検出された大会)を分離して集計。

**調整前(exp=0.50=旧仕様、seed42・40シーズン)**:

| OVR差 | tier1 | tier2 | carried |
|---|---:|---:|---:|
| 0 | 53.32%(n=767) | 60.00%(n=10) | 61.11%(n=18) |
| 1-2 | 55.08%(n=3014) | 50.00%(n=42) | 55.56%(n=72) |
| 3-4 | 59.33%(n=2823) | 26.67%(n=30) | 52.38%(n=63) |
| 5-9 | 69.66%(n=4882) | 68.18%(n=44) | 68.39%(n=155) |
| 10-14 | 81.03%(n=2240) | 72.73%(n=55) | 71.79%(n=156) |
| 15-19 | 89.27%(n=997) | 83.33%(n=42) | 76.26%(n=139) |
| 20-24 | 92.14%(n=407) | 96.67%(n=30) | 87.95%(n=83) |
| 25-29 | 96.97%(n=198) | 100.00%(n=20) | 86.67%(n=45) |
| 30+ | 99.39%(n=165) | 93.33%(n=15) | 100.00%(n=17) |

差0はtier1で53.32%、理論値50%から2.3pt乖離(±1pt目標を外れる)。**バグかどうかを先に検証**:
1. 固定stats(pw=sp=te=st=mn=同値)の完全同一クローン同士をleft/rightどちらに置いても
   `simulateMatch`単体でN=20,000回検証 → 50.00%/50.41%/50.08%(3パターン)。**エンジン自体は対称でバグなし**。
2. 実ロスターの「差0」は`Engine.util.ov()`が**四捨五入した平均**でのタイであり、真の平均は
   微小に異なる(例: 65.4 vs 65.6は両方65)。この端数が試合中ずっと同じ方向に効き続けるため、
   ターン数の多い試合ほど蓄積して数ptの偏りとして現れうる。
3. 別seed(999・20シーズン)で再測定 → tier1差0は51.26%(n=437)。53.32%→51.26%と**方向が揺れる**ため、
   系統的な左右バイアスではなく**サンプルサイズなりのノイズ+端数丸めの残差**と判断。
   `n=767`でのSE≈1.8pt、乖離2.3pt≈1.3SE相当で統計的に驚くほどではない。
   → **測定バグではない**。ただし「±1pt」という不変条件は、この定義(四捨五入OVRの一致)のままだと
   サンプルを相当増やさない限り安定して満たせない可能性がある点は正直に記録しておく。

### 勝敗に効いていたパラメータの特定

`src/match-engine.js`のコードを読み、OVR差が勝敗に効く経路を洗い出した:
- `calcDamage`(基礎ダメージ)は`atk.pw/te/sp`と`def.st/mn`の**生の値**に線形依存 → OVRが高いほど自然に有利
- **`_ovrMult = Math.pow(_atkOvr/_defOvr, 0.50)`**(通常打撃の与ダメへの追加補正、v5.0 M1で導入、
  コメント「OVR比ダメージ補正」)← これが**唯一の名前で示された「実力差」専用ダメージ補正**であり、
  かつ`match-engine.js`に`0.50`と直書きされていた(データ定数化されていなかった)。**主要な調整対象と判断**
- カウンター成立時のダメージ(`cDmg = mv.d * counterDmgMult`)は**OVR比に一切反応しない**固定式だった
  → 弱者の反撃が強者と同じ重みで刺さる「等値化装置」になっている可能性がある副次的候補
- kickout/gu escape率は`def.mn`のみに依存(相手のOVRを見ない)、hitRate/counterRateは`te`/`sp`の生値依存
  (OVRではなく個別スタット依存)。これらはOVR差そのものを直接見ておらず、独立した調整レバーとしては
  複雑になりすぎるため、まず`_ovrMult`とカウンターの2つに絞って検証することにした

`_ovrMult`の指数(0.50)を`src/data.js`の`ENG.ovrGapDmgExponent`へ名前付き定数として抽出。
カウンターダメージにも同じ比率補正を混ぜられるよう`ENG.counterOvrGapMixin`(0〜1、既定0=旧仕様)を追加。
どちらも`BIGMATCH_ENG`は`...ENG`のスプレッドで継承するため、**tier別の値分岐は追加していない**
(後述のとおり、共通式のままでtier2がtier1より自然に厳しくなることを確認できたため)。

### 1つずつ振った記録

**実験A: 固定stats・固定gapのコントロール実験**(実ロスターのノイズを排除するため新規に作成。
`pw=sp=te=st=mn`を揃えた2キャラをgap=0,2,4,7,12,17,22,27,32で対戦させ、tier1/tier2それぞれN=4000回。
popularity/trust/因縁/称号などring-in効果は一切なし。指示書外のスクリプトなのでスクラッチパッドに保存、
`src/`/`test/`は無改変)。`ovrGapDmgExponent`を0.50/0.65/0.80/1.00/1.20で振った:

| gap | tier | 0.50 | 0.65 | 0.80 | 1.00 | 1.20 |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 1/2 | 49.53/51.14 | (同、gap0はexponentに無反応=ratio1のため) | | | |
| 2 | 1 | 55.21 | 56.21 | 57.06 | 57.64 | 58.25 |
| 2 | 2 | 55.70 | 56.60 | 58.27 | 59.00 | 59.85 |
| 4 | 1 | 61.18 | 62.40 | 63.32 | 64.94 | 66.22 |
| 4 | 2 | 62.08 | 62.85 | 64.15 | 65.97 | 67.47 |
| 7 | 1 | 68.08 | 69.15 | 70.87 | 73.17 | 75.67 |
| 7 | 2 | 71.23 | 73.08 | 75.02 | 77.45 | 79.03 |
| 12 | 1 | 78.60 | 80.53 | 82.88 | 85.22 | 86.75 |
| 12 | 2 | 84.40 | 86.15 | 88.38 | 90.88 | 92.15 |
| 17 | 1 | 87.50 | 89.55 | 91.35 | 93.63 | 94.70 |
| 17 | 2 | 91.07 | 92.97 | 94.40 | 95.93 | 96.50 |
| 22 | 1 | 92.25 | 93.85 | 95.30 | 96.90 | 97.78 |
| 22 | 2 | 95.00 | 96.67 | 97.55 | 98.45 | 98.67 |
| 27 | 1 | 95.87 | 96.97 | 97.80 | 98.95 | 99.63 |
| 27 | 2 | 97.88 | 98.47 | 99.05 | 99.42 | 99.72 |
| 32 | 1 | 98.25 | 98.58 | 98.95 | 99.57 | 99.85 |
| 32 | 2 | 99.30 | 99.48 | 99.70 | 99.90 | 99.95 |

**発見1**: gap=0はexponentの値に関わらず完全に不変(ratio=1なのでpowが何乗でも1)。exponentを
上げても差0の勝率は動かない → 不変条件1と調整の独立性が保証される。
**発見2**: **tier2はtier1より常に高い**(全gap・全exponentで例外なし)。tierごとの分岐を追加しなくても、
共通の式のままでKeisukeの想定通り「ビッグマッチの方が実力差が出る」構造になっている
(BIGMATCH_PHASESの方がターン数が長くClimax倍率が高いため)。
**発見3**: exponentを上げるほど全帯で単調に勝率が上がるが、**小さいgap(1-2)ほど動きが鈍い**
(0.50→1.20の変化幅: gap2は+3.0pt前後だがgap12は+7.8pt前後)。ratio-1が小さいほど
`pow`の指数を変えても効果が線形にしか効かないため、構造的な限界がある。

**exponent=1.00**が目標曲線(tier2)に最も良く合致したため採用。

**実験B: カウンターへのOVR補正混入**(`counterOvrGapMixin`単独、exponentは0.50に固定して分離検証。
実ロスターでの40シーズン実測、seed42): mixin=0(旧仕様)→1.0の比較で、tier1の各帯の動きは
1-2:53.99%(旧55.08%)/3-4:59.90%(59.33%)/5-9:69.05%(69.66%)/10-14:80.66%(81.03%)/
15-19:86.95%(89.27%)/20-24:94.35%(92.14%)/25-29:97.50%(96.97%)/30+:98.73%(99.39%)。
**方向が帯ごとにバラバラで、動き幅もすべて±3pt程度のノイズ帯に収まった**。有意な効果を確認できず、
採用を見送り(既定0のまま)。

### 調整後の曲線(exponent=1.00・実ロスター・seed42・40シーズン)

| OVR差 | tier1 | tier2 | carried | 目標(tier2基準) |
|---|---:|---:|---:|---|
| 0 | 52.25%(n=800) | 36.84%(n=19) | 34.48%(n=29) | 50%(定義上) |
| 1-2 | 55.30%(n=3284) | 58.93%(n=56) | 52.11%(n=71) | 58-63% |
| 3-4 | 63.14%(n=2824) | 41.67%(n=36) | 70.49%(n=61) | 65-70% |
| 5-9 | 73.25%(n=4913) | 60.00%(n=55) | 58.33%(n=180) | 76-82% |
| 10-14 | 85.95%(n=2256) | 92.31%(n=39) | 79.88%(n=164) | 87-91% |
| 15-19 | 94.03%(n=921) | 87.10%(n=31) | 81.15%(n=122) | 93-96% |
| 20-24 | 95.03%(n=443) | 100.00%(n=21) | 96.72%(n=61) | 97-98% |
| 25-29 | 98.66%(n=224) | 100.00%(n=14) | 90.48%(n=42) | 98-99% |
| 30+ | 100.00%(n=159) | 100.00%(n=15) | 100.00%(n=14) | 99%以上 |

**実ロスターのtier2/carriedはnが小さすぎて(15〜56件/帯)ノイズが支配的**。同じexponent=1.00を
「popularity/因縁/称号などring-inを排したコントロール実験」(実験A)で見ると、tier2はgap2:59.00%
gap4:65.97% gap7:77.45% gap12:90.88% gap17:95.93% gap22:98.45% gap27:99.42% gap32:99.90%と
**目標曲線にほぼ一致**する。実ロスター計測との差は主にサンプル数(nが実験Aの1/100以下)と
ring-in効果(人気・trust・因縁・称号)由来のノイズと考えられるが、**100シーズンでの確認は未完了
(50/100シーズンで打ち切り)のため、実ロスターでの最終的な当てはまりは未確認のまま**。

**tier2≧tier1の逆転**: 実ロスター40シーズンでは3-4帯(tier2 41.67% < tier1 63.14%)、5-9帯
(tier2 60.00% < tier1 73.25%)、15-19帯(tier2 87.10% < tier1 94.03%)で逆転が見られる。
いずれもtier2側のnが36〜55と小さく、コントロール実験(実験A、N=4000)では全gapでtier2>tier1が
一貫していたことから**サンプル不足による見かけ上の逆転**と考えているが、実ロスターでの確証は
100シーズン待ち(未完了)。

### MQ・★分布・決着ターン数(調整前後比較、seed42・40シーズン)

| 指標 | 調整前(exp=0.50) | 調整後(exp=1.00) |
|---|---|---|
| MQ平均 | 49.38 | 50.30 |
| ★1〜5分布 | ★1=0.4% ★2=3.4% ★3=32.2% ★4=59.7% ★5=4.4% | ★1=0.2% ★2=4.4% ★3=26.6% ★4=60.1% ★5=8.7% |
| 平均ターン数 | 14.28 | 14.08 |
| 時間切れ率 | 295/16529 (1.78%) | 238/16854 (1.41%) |
| ビッグマッチClimax到達率 | 311/398 (78.14%) | 299/396 (75.51%) |

MQ平均・★4+5比率はむしろ微増(64.1%→68.8%)、平均ターン数は-0.2Tのみで「極端に短くならない」に該当せず。
決着が早まって凡戦化する兆候は見られない。

### 目標に届かなかった帯(正直な記録)

- **tier1の1-2帯**: 55.08%→55.30%とほぼ無変化(目標58-63%に届かず)。コントロール実験でも
  0.50→1.20まで振っても+3pt程度しか動かず、**構造的にexponent一本では小gapを大きく動かせない**
  ことを確認済み(ratio-1が小さいほどpowの指数を変えても線形にしか効かない)。tier1は目標必達では
  ないため許容範囲と判断したが、tier2でも同じ制約があるため20-24/25-29帯は目標上限をわずかに
  超過する可能性がある(コントロール実験でgap22=98.45%[目標97-98%]、gap27=99.42%[目標98-99%]、
  いずれも上限を0.4pt程度超過)
- **実ロスターのtier2・carriedは40シーズンでは目標曲線への適合を確証できない**(サンプル数不足)。
  100シーズンでの確認が必要だが**未完了**

### 不変条件確認

1. 差0の勝率50%±1pt: **コントロール実験(N=20000クローン)では50.00%/50.41%/50.08%で達成**。
   実ロスターでは53.32%(調整前)/52.25%(調整後、tier1)などSE1.8pt程度のブレがあり、
   ±1ptを外れることがあるが、上記の通りexponent自体はgap0のratioを変えないため測定バグ・
   本調整由来ではないと判断
2. 番狂わせがゼロにならない: コントロール実験のgap32(最大帯)でtier1=99.57%(n=4000)、
   tier2=99.90%(n=4000)、いずれも100%未達。実ロスター40シーズンでは30+帯が100%(n=159/15/14)と
   出ることがあるが、上記コントロール実験の通り真の確率は非ゼロであり、小サンプルでの見かけ上の
   飽和と判断
3. MQ分布・★分布: 上表の通り、崩れるどころか★4+5比率・MQ平均ともに微増
4. 決着ターン数: 平均14.28T→14.08T、-0.2Tのみ。極端な短縮なし
5. 乱数はシードから導出、調整値は`src/data.js`: 満たす
6. `test/auto-sim.js`の自動プレイ判断ロジックは不変、計測フック(`ovrBandGroups`)の追加のみ
7. `node test/run-all.js`: **174/174 PASS**(実行時間内訳は省略、slow: stat-contribution-test.js 56076ms)
8. `node test/auto-sim.js 40`(デフォルトseed、フォアグラウンド): **ALL CLEAR**、
   Total violations: 0 (0 unique)、Total errors: 0、Game overs: 0

### 質問として残す点(実装せず)

- tier2の20-24/25-29帯がコントロール実験値で目標上限をわずかに超過する(98.45% vs 97-98%、
  99.42% vs 98-99%)。exponentをこれ以上下げると1-9帯の改善が弱まるため、**上振れを許容するか、
  20+帯だけ別途頭打ちを入れるか**は判断が必要
- 実ロスターの`counterOvrGapMixin`は効果を確認できなかったが、これはコントロール実験のような
  クリーンな条件では検証していない(実ロスターの40シーズン計測のみ)。カウンター発生頻度自体が
  低い(通常1試合あたり数回程度)ため、クリーンな条件でN=4000規模の検証をすれば別の結果になる
  可能性がある。優先度が低いと判断し今回は保留
- 100シーズンでの最終確認ラン(seed42)が未完了(50/100で打ち切り)。実ロスターでのtier2/carried帯の
  最終的な当てはまり検証は次回に持ち越し

## AI団体の王座 挑戦者に幅を持たせる（task-62・2026-07-31）

出典: `docs/codex-tasks/task-62-ai-title-challenger-variety.md`、前段調査
`docs/ai-title-defense-survey-v0.1.md`。作業は `wm-task62`（ブランチ
`feat/ai-title-challenger-variety`、親コミット8ad961f=task-61適用済み）で実施、mainは未変更。
**未コミット（指示によりコミットなし）**。

### Keisuke指摘と裁定

「NPCのベルトは防衛が続きやすいようなシミュレーションにしたい。ごく短期防衛しかできないことが多い」。
裁定: 挑戦者に幅を持たせる（上位数名から重み付きで選ぶ。時に格下の挑戦も入るので防衛が続き、
「連続防衛中の王者」が生まれる）。

### 直したもの

`Engine.rival.processAIWeek`内のFix3ブロック（`management.js:9113〜`）が、王者の対戦相手を
「挑戦資格者(`Engine.title.getEligibleChallengers(roster, champId, 'ai')`)の中で最高OVRの1人」に
`.sort((a,b)=>ov(b)-ov(a))[0]`で決め打ちしていた。この1名選出ロジックを、上位候補からの
**重み付き抽選**に置き換えた。挑戦資格の判定（`getEligibleChallengers`）自体は1文字も変えていない。

加えて、旧Fix3は「対戦相手が資格者でない場合だけ」差し替えるガード付きだったが、これを外し、
資格者がいる週は毎回この抽選で挑戦者を決め直すようにした（抽選結果が現在の対戦相手と同じなら
カードは変更しない）。理由: 素のカード生成（`generateAIMatchCard`）がOVR差最小の貪欲マッチングを
行うため、放置しても王者は自然と資格者中の最上位（≒2番手）と組まれやすく、「対戦相手が資格者で
ない場合だけ」というガードのままでは実際にはほとんど発火しなかった（後述の計測メモ参照）。

### 新規定数（`src/data.js` `AI_TITLE_CHALLENGER_CFG`）

```js
const AI_TITLE_CHALLENGER_CFG = {
  poolSize: 4,            // 資格者をOVR降順、上位何名を抽選候補にするか
  weightDecay: 0.65,      // 順位ごとの重み減衰率(0〜1)。重み = decay^rank
  rivalryWeightBonus: 0.5,// 因縁(rivalry 0〜100)がある相手への重み倍率上限
};
```

- **poolSize=4の根拠**: 計測（後述）の結果、`getEligibleChallengers(policy='ai')`の実返却数は
  seed42/40シーズンでorg_s 89%・org_a 99%・org_b 95%が「3人」で、4〜6人に広がるのは
  「最高OVRとの差5以内」条件がまれに追加発動するケースのみ（1〜6%）。4名あればこの追加ケースまで
  ほぼ全て候補に含められる。
- **weightDecay=0.65の根拠**: 資格者3人なら生重みはおよそ`1 : 0.65 : 0.4225`（最強候補が選ばれる
  確率はおよそ48%まで下がる＝「最強が必ず選ばれるほど尖らせない」を満たしつつ、OVRベースの
  優先度自体は残す）。0.55/0.75/0.9(poolSize5)も比較したが、後述のとおり最終防衛回数への
  影響は誤差の範囲で、この値に決め手となる根拠はない（詳細は下記「目標に届かなかった理由」）。
- **rivalryWeightBonus=0.5の根拠**: rivalry=100（理論上限）でも重み倍率は最大1.5倍まで。
  「因縁だけで決めない」の指示どおり、決定打にはならない程度に留めた。ドラマ的な意味合いが
  主目的で、防衛回数の底上げは狙っていない。

### 乱数

挑戦者抽選用のRNGは`Engine.rng.derive(state.rngSeed, state.season, state.week, aiChampId, 0x6341)`
から`Engine.rng.create`で作る専用ストリーム（アーキテクチャ原則4）。season/week/王者IDから
決定的に導出されるため、同一stateなら同一結果になる（再現性）。`Math.random`/`Date.now`は未使用。

### 計測（同一シード・40シーズン、修正前=親コミット8ad961f / 修正後=作業ツリー、seed 42と43の2本）

`docs/ai-title-defense-survey-v0.1.md §B`と同じ手法のスクリプトをスクラッチパッドにコピーし
（`test/`/`src/`は無改変）、`WM_SOURCE_REF`環境変数で「同一スクリプト・同一seedのまま対象commitだけ
切り替えて計測」する形で修正前後を比較した。

| seed | 団体 | 修正前 平均防衛 | 修正後 平均防衛 | 修正前 0回陥落% | 修正後 0回陥落% | 修正前 3回以上% | 修正後 3回以上% |
|---|---|---:|---:|---:|---:|---:|---:|
| 42 | org_s | 0.73 | 0.69 | 52.7% | 63.8% | 6.5% | 7.4% |
| 42 | org_a | 0.70 | 1.02 | 54.8% | 49.4% | 4.8% | 16.0% |
| 42 | org_b | 0.77 | 0.77 | 62.6% | 54.4% | 8.7% | 5.6% |
| 42 | player(参考) | 2.71 | 2.17 | 26.8% | 37.5% | 41.5% | 27.1% |
| 43 | org_s | 0.70 | 0.69 | 62.5% | 57.0% | 7.3% | 5.4% |
| 43 | org_a | 0.55 | 0.62 | 60.2% | 63.6% | 3.1% | 5.9% |
| 43 | org_b | 0.96 | 0.83 | 46.7% | 54.4% | 11.2% | 9.6% |
| 43 | player(参考) | 2.87 | 1.94 | 35.9% | 46.0% | 33.3% | 26.0% |

**目標（平均防衛1.5〜2.2、0回陥落30〜40%、3回以上20〜30%）には届かなかった。** 6サンプル
（seed×団体）中、明確に改善したのはseed42のorg_aのみ（0.70→1.02、3回以上4.8%→16.0%）。
org_s・org_bはほぼ横ばい〜微減、seed43のorg_a・org_bはむしろ悪化寄り。プレイヤー(参考)側の
数値変動は`test/auto-sim.js`のMath.random共有ストリームによる計測ハーネス由来のノイズ
（task-61 worklog参照、プレイヤー経路のコードは1行も変更していない）。

weightDecayを0.55/0.75/0.9（poolSizeも4/5で併振り）にした中間実験でも、AI3団体平均は
常に0.6〜1.0回のレンジ内に収まり、どの数値に振っても目標レンジ（1.5〜2.2）には近づかなかった。

### 目標に届かなかった理由（根本原因を追加調査）

方向性（決め打ち→重み付き）自体は指示どおり実装したが、この変更だけでは目標に届かないことが
2つの追加計測で分かった。

1. **`getEligibleChallengers(policy='ai')`の実返却数はほぼ常に3人。**
   seed42・40シーズンで計測すると、org_s 89%・org_a 99%・org_b 95%が「3人」（残りも大半は
   4〜5人）。つまりpoolSize/weightDecayをどれだけ広げても、実際にはほぼ常に「資格者3人の中の
   並び替え」でしかない。さらにこの3人は`(atkOvr/defOvr)^0.5`のダメージ補正に照らして互いに
   数ポイント差の僅差であることが多い（王者と抽選候補のOVR差を実測すると、王者の方が平均+3.4
   高いが、逆に挑戦者側が上回るケースも珍しくない）。「誰を当てるか」の振れ幅自体が小さいため、
   重み付けを強めても結果への影響が小さい。
2. **AI王座の交代の約45%は、敗北ではなく王者の負傷等による空位化（不戦）で起きている。**
   seed42・40シーズンの内訳を直接計測すると、王座交代330件のうち149件（45%）が
   `!champAlive`分岐（王者が負傷等でロスターから消え、無条件でOVR最上位が新王者になる）経由で、
   これは挑戦者選定と無関係に発生する。しかもこのうち66件（44%）は「1回も防衛できないまま
   空位化」で、これが「0回で陥落」の主因の一部を占めている。防衛回数の分布は敗北イベントと
   空位化イベントの合成であり、**挑戦者選定を変えても空位化側の45%はそのまま残る**ため、
   平均防衛回数を1.5〜2.2まで引き上げるには足りない。

このタスクのスコープ（`getEligibleChallengers`は変えない、選び方だけ変える）では、この2点への
対処は行えない。**数字を目標に合わせて捏造していない**旨、明記しておく。

### テスト

新規 `test/ai-title-challenger-variety-test.js`（5ブロック）:
1. 同じstate・同じシードから2回選んで同じ結果になること（再現性）
2. 最強候補以外も選ばれ得ること（重みが偏りすぎていない。season/weekを振って40試行）
3. 王者本人が挑戦者に選ばれないこと
4. 資格者が1人しかいない場合は従来どおりその1人が選ばれること
5. 調整値（poolSize/weightDecay/rivalryWeightBonus）が`src/data.js`の`AI_TITLE_CHALLENGER_CFG`に
   あり、`management.js`のFix3ブロックがそれをプロパティ経由で参照していること（コード直書きでない）

### 不変条件・検証結果

1. プレイヤー団体の王座ロジックを変えないこと: **PASS**（`git diff`で確認。変更は
   `management.js`のAI Fix3ブロックのみ、プレイヤー経路（`crownChampion`/`recordDefense`/
   `getEligibleChallengers('player')`/プレイヤー通常興行の`buildRingInOpts`呼び出し）は
   ソース文字列レベルで無変更）
2. 挑戦資格の判定（`getEligibleChallengers`）自体を変えていないこと: **PASS**（同関数は無変更、
   選び方（Fix3ブロック内のみ）だけを変更）
3. 乱数はシードから導出（`Math.random`/`Date.now`不使用）: **PASS**
   （`Engine.rng.derive(state.rngSeed, state.season, state.week, aiChampId, 0x6341)`経由）
4. 王者本人が挑戦者に選ばれないこと: **PASS**（テスト3、および候補プール自体が`f.id !== aiChampId`
   でフィルタ済み）
5. 資格者が1人しかいない場合は従来どおりその1人: **PASS**（テスト4）
6. `Engine.validateGameState`が新しい違反を出さないこと: **PASS**（下記auto-sim参照、violations 0）
7. `node test/run-all.js`全PASS: **PASS**（174/174、既存173 + 新規1）
8. `node test/auto-sim.js 40`（フォアグラウンド実行、seed42）: **ALL CLEAR**、violations 0、
   errors 0、freq warnings 0、40シーズン・2120週完走、elapsed 88.2s

### 迷った点・質問として残すこと（実装はしていない）

- 目標未達の主因として特定した「王座交代の45%が空位化（負傷等）由来」への対処は、今回のスコープ
  （挑戦者の選び方のみ）を明確に超える（防衛失敗率や空位化そのものの頻度を変える話になるため）。
  ここに手を入れるかどうかはバランス設計判断であり、Keisuke判断を仰ぎたい。仮に着手する場合、
  例えば「空位化時に前王者の在位期間に応じたボーナスを与える」「AI王者の負傷確率を下げる」等の
  方向性が考えられるが、いずれも本タスクの指示（`getEligibleChallengers`を変えない・選び方だけ
  変える）の外側であり、実装していない。
- weightDecay/poolSize/rivalryWeightBonusの具体値は、複数振っても最終結果への影響差が小さかった
  ため「妥当な中庸値」を置いた以上の強い根拠はない。目標に近づける調整ではなく、あくまで
  「決め打ち→重み付き」という方向性の実装として受け取ってほしい。
## 他団体の因縁を「見えるように」する + レンタル選手を因縁の経路だけ開ける（task-63・2026-07-31）

出典: `docs/relationship-rivalry-survey-v0.1.md`（前段調査）+
`docs/codex-tasks/task-63-rivalry-visibility-rental.md`。作業は `wm-task63`
（ブランチ `feat/rivalry-visibility-rental`）で実施、main / `wm-task62`
（`src/management.js` を別タスクが同時編集中）は無関係・未変更。`src/management.js`には触れていない。
**未コミット（指示によりコミットなし）**。

前提: 実測（survey調査）で「他団体戦にはrivalry×2.0が既に掛かっており、1ペアあたりの育ち方は
自団体とほぼ同じ」ことが判明済み。**したがって本タスクではrivalryの増加量(倍率・式)は一切変更せず、
走査対象と表示だけを広げた。**

### A. 週次ドラマの因縁系イベントにレンタルを対象追加

`processWeeklyStoryEvents`（relationships.js、`activeRoster = roster.filter(f => !f.injury && !f.isRental)`）
の中身を全ブロック読み、`relationships[key].rivalry`を直接加算/減算するイベントを洗い出した。

**因縁系と判定した2つ**（レンタルを対象に追加）:
- 「一方的な敵意」ゾーンの3.5%escalationロール（`rivalry+=2`）
- 「クロス非対称 覚醒」イベント（`rivalry+15〜20`, `bond-10〜15`）

**絆系と判定し従来どおり除外した枝**（bond/trust/condition/orgPop/moraleを動かすだけで
rivalry軸そのものは動かさない）: 親友ゾーンのcondition回復、好敵手ゾーンのmarkGrowthPressure、
片思い・完全断絶・嫌悪伝染のtrust/bond変動、ロッカー荒廃モーダル(bond≤30カウント)。
「憎い敵ゾーン」の5%clashロールは`rivalries[].pendingClashBonus`という別の因縁称号系オブジェクトを
書き換えるだけで`relationships[key].rivalry`は動かさないため、厳密な定義からは除外した
（質問として残す、後述）。

実装は既存2イベントのロジックをそのまま**独立RNGストリーム**
（`Engine.rng.derive(state.rngSeed, state.season, state.week, 0x8ED2)`）でレンタル絡みペアに
複製し、確率・rivalry増加量にだけ`RENTAL_RIVALRY_CONFIG`（新規, data.js）の倍率を掛けた。
bondの増減量（覚醒イベントの-10〜15）には倍率を掛けていない（bond分布不変条件のため）。
既存の`activeRoster`側ループには一切触れておらず、レンタルが1人も居ない週はこの新ブロックが
まるごと実行されない（`rentalFighters.length > 0`ガード）。

**倍率**: `probMult: 1.4`, `magnitudeMult: 1.4`（指示書の推奨レンジ1.3〜1.6の中央よりやや低め）。
根拠: レンタル在籍は`RENTAL_CONFIG.minSeasons〜maxSeasons`=1〜4期(12〜48週)で、契約選手のように
無期限に同じ顔ぶれと接触し続けられない。確率・増加量の両方に掛かるため体感の伸びは複合で
約2倍相当になる点は自覚した上で、「短期滞在の埋め合わせ」として意図的に採用した。

### B. 他団体の因縁を通知・演出に載せる

`_collectCandidates`/`_isOnCooldown`/`_buildSnapshotText`（`Engine.snapshot`）と
`checkALayer`/`checkBLayer`（`Engine.glimpse`）を全部読んだ。

**発見1（既に開いていた）**: `checkALayer`（bond/rivalry閾値跨ぎGlimpse）は
`allTargetIds`に`_getAllAIChars(state)`を含めており、他団体キャラを最初からtarget候補に
入れている。`checkBLayer`のGL-05「ライバルへの意識」も`_findBestRelPair`が
org無関係に全relationshipsキーを検索するため、既に他団体の相手を拾える作りだった。
**この2つは変更していない**（既存の値を変えない、のため）。

**発見2（バグ）**: `Engine.snapshot._buildSnapshotText`のname2解決が`state.roster`
（自団体ロスター）しか見ておらず、`fighter2Id`が他団体キャラだと解決できず`"???"`表示に
なっていた。R4/R5（rivalry40+の相手との勝敗）候補は元々`fighter2Id`を正しく渡していたので、
このname解決だけが閉じていた実質的なボトルネック。`Engine.glimpse._getAllAIChars(state)`への
フォールバックを1行追加して直した。

**追加した仕組み**:
- `Engine.snapshot._isCrossOrg(state, targetId)`（新規ヘルパー）: fighter2Idが自団体ロスターに
  居なければ他団体ロスターを検索してtrue/falseを返す。R4/R5/rivalryResolved候補生成時に
  `crossOrg`フラグとして付与
- `_isOnCooldown`が`crossOrg`フラグを見て、他団体絡み候補には通常(6週, `SNAPSHOT_PAIR_COOLDOWN_WEEKS`
  として定数化。**値は変更していない**)より長い`CROSS_ORG_SNAPSHOT_COOLDOWN_WEEKS=10週`の
  クールダウンを掛ける（同じ他団体の相手が毎週のように出るノイズを防止）

**守った制約**:
- 自団体の選手が必ず一方に居ること: `_collectCandidates`は`roster.forEach`（自団体ロスター）
  起点でしか候補を作らないため構造的に保証される。他団体同士(AI対AI)の候補は生成されない
- レンタルを通知の主体にはしない: R4/R5候補の起点`roster.forEach(f => {if (f.injury || f.isRental) return; ...})`
  は元々レンタルを除外済み（変更なし）。相手役(fighter2Id)としては元々レンタルも入りうる
  （同団体内でレンタル選手と対戦した場合など）ので、その経路は塞いでいない

### 計測

**手法上の注意（重要な副産物）**: `test/relationship-distribution-analysis.js`をシード固定で
2回連続実行しただけで、同一seed・同一コードにもかかわらず結果が毎回変わることを発見した
（同団体ペア数435→420→468、他団体ペアrivalry平均20.1→15.1等、実行のたびに変動）。
原因を追跡し、`relationships.js:2016`付近`checkRecontact`（再接触/vendetta/grudgeイベント、
本タスクでは未変更・pre-existing）が`Engine.rng`ではなく素の`Math.random()`を使っていることを
特定した（`git blame`で2026-03-30の既存コードと確認、本タスク由来ではない）。
`test/auto-sim.js`は45-51行目でこれを回避するために`Math.random`をシード化する互換パッチを
既に持っているが、`test/relationship-distribution-analysis.js`にはこのパッチが無い。
このファイルは「test/新規」の対象外（既存ファイル）なので変更せず、代わりに
auto-sim.jsと同じパッチを当てた**スクラッチ版**（リポジトリ外、報告用に一時作成し破棄）を用意して
同一シードでの前後比較を行った。

- **同一シード12345・40シーズン・レンタルなしの通常オートプレイ**: 修正前後で
  同団体ペア(n=485, meanRivalry=17.94)・他団体通算対戦ありペア(n=348, meanRivalry=18.90)・
  rivalry60+比率(58/485, 38/348)が**すべて完全一致（byte-identical）**。
  このシナリオではレンタルが1人も生成されないため`rentalFighters.length>0`ガードが常にfalseで
  Aブロックが1回も実行されず、B節の変更も候補のメタデータ(crossOrgフラグ・クールダウン窓)にしか
  触れないため、rivalry軸の数値には一切影響しないことを実測で確認した
- **同一シード・強制レンタル版**（毎週空き枠があればAI団体上位以外からOVR50+を1体レンタル）:
  修正前 rentalPairs n=296 meanRivalry=14.03 / 修正後 n=260 meanRivalry=11.14、
  同団体・他団体分布も前後で乖離した。**これは信頼できる比較ではない** —
  レンタルの重み付き抽選が実際に回った時点でrivalryの値がその週の試合結果(MQ計算経由)に
  波及し得るため、40シーズンという長い時間軸では初週の分岐がその後の全試合結果・ドラフト・
  引退等に連鎖して別の歴史になる（task-61のworklogで既に報告済みの「単一seed長期比較は
  原理的に成立しない」問題と同種）。数値の大小自体に意味を見出さず、
  「レンタルペアが実在し、値が壊れていない(NaN等なし)」という健全性確認にとどめた
- **レンタルの因縁増加そのものの一次証拠**は`test/rivalry-visibility-rental-test.js`の
  直接関数呼び出し(400試行)による決定的テストを一次情報として扱う
  （後述「テスト」節。escalation/awakeningともに発火を確認済み）

### 不変条件・検証結果

1. 試合起因のrivalry増加量(`applyMatchResult`)を変えない: **PASS（コード差分で確認、1行も
   変更していない）**。かつ上記のレンタルなしシナリオでrivalry分布が完全一致したことでも裏付け
2. bondの分布を動かさない: **PASS**。Aブロックの新規イベントはbond変動を一切追加していない
   （覚醒イベントの`bond-10〜15`は既存ロジックの値をそのまま流用、倍率は掛けていない）
3. 他団体同士(AI対AI)の因縁を通知に出さない: **PASS**。`_collectCandidates`が自団体ロスター
   起点でしか候補を作らない構造で保証
4. 乱数はシードから導出: **PASS**（Aブロックは`Engine.rng.derive(state.rngSeed, ...)`由来の
   独立ストリーム。新規追加コードに`Math.random()`/`Date.now()`は無い。ただし前述の通り
   pre-existingな`checkRecontact`のMath.random()使用を副産物として発見した — 別問題として報告のみ）
5. 調整値は`src/data.js`の新規定数、既存の値は変えない: **PASS**。
   `RENTAL_RIVALRY_CONFIG`/`CROSS_ORG_SNAPSHOT_COOLDOWN_WEEKS`は新規、
   `SNAPSHOT_PAIR_COOLDOWN_WEEKS=6`は既存のハードコード値をそのまま定数化（値は不変）
6. `Engine.validateGameState`が新しい違反を出さない: **PASS**（`auto-sim.js 40`で
   violations 0, errors 0）
7. `node test/run-all.js`: **174/174 PASS**（既存173 + 新規1、`rivalry-visibility-rental-test.js`）
8. `node test/auto-sim.js 40`（フォアグラウンド実行）: **ALL CLEAR**、
   Total violations: 0, Total errors: 0, Freq warnings: 0, 40シーズン・2120週完走、Elapsed 139.7s

### テスト

新規 `test/rivalry-visibility-rental-test.js`（5ブロック）:
1. レンタル絡みペアで「一方的な敵意」escalation・「クロス非対称 覚醒」が発火すること
   （400試行、直接`processWeeklyStoryEvents`呼び出し）
2. 親友ゾーン(絆系)のcondition回復がレンタル選手には適用されないこと(従来どおり除外)
3. `RENTAL_RIVALRY_CONFIG`がdata.jsのトップレベル定数であり、確率式に直書きの倍率
   （`0.035 * 1.4`等）が無いこと
4. `_isCrossOrg`判定・R4候補生成時の`crossOrg`フラグ・自団体選手が必ずfighterId側に
   居ること・他団体の相手名が`_buildSnapshotText`で正しく解決される(???にならない)こと・
   同団体ペアでは`crossOrg:false`のままであること
5. `_isOnCooldown`が`crossOrg`候補により長いクールダウン(10週)を、通常候補には従来の
   クールダウン(6週)を適用すること

### 質問として残すこと（実装はしていない）

- 「憎い敵ゾーン」の5%clashロール（`rivalries[].pendingClashBonus`書き換え、`[rivalry-clash]`
  ティッカー）を「因縁系」に含めてレンタルにも開けるべきか判断が割れる。rivalry軸の数値を
  直接動かさないので今回は対象外としたが、因縁ドラマの体感としては近い枝なので、
  含めるべきか要判断
- 「好敵手ゾーン」のmarkGrowthPressure（rivalry40+bond50+ペアの育成負荷ボーナス）も同様に
  rivalry軸を動かさないため対象外としたが、レンタルにも「好敵手との切磋琢磨」を与えるべきかは
  デザイン判断が要る
- `checkRecontact`（relationships.js:2016）のMath.random()直呼びは今回のタスクの因縁可視化とは
  無関係のpre-existingな問題だが、シミュレーション計測全般の再現性を損なうため、
  別タスクとしての修正を推奨（`test/auto-sim.js`は既にワークアラウンド済みだが、
  `test/relationship-distribution-analysis.js`を含む他の計測ツールは未対応）

## AI団体の王座戦にタイトル戦リング内効果を発火させる（task-61・2026-07-31）

出典: `docs/ai-title-defense-survey-v0.1.md`（前段調査）。作業は `wm-task61`
（ブランチ `fix/ai-title-ringin`、親コミット213fbd2）で実施、mainは未変更。**未コミット（指示によりコミットなし）**。

### 直したもの

`Engine.rival.processAIWeek`（`src/management.js:9014`）が試合ごとに
`Engine.mq.buildRingInOpts` を呼ぶとき、`isTitle` / `normalShowRingExtras` を一切渡していなかった。
このため AI 団体の内部王座戦（`aiOrgs[orgId].titles.world`）は、実際にはバトルエンジンで
毎週シミュレートされているにもかかわらず、`match-engine.js:311-320` のタイトル戦リング内効果
（脱出率+0.10・カウンター率+4pt・王者専用逃げ切り+0.02）が一度も発動していなかった。
プレイヤーの通常興行タイトル戦（`management.js`のプレイヤー経路呼び出し、`isTitle`/`normalShowRingExtras:true`）
では発動しており、非対称だった。

### 「王座戦かどうか」の判定に使ったコード

新しい判定式は作らず、**既存のFix3ブロック（`management.js:9113〜`、王者の対戦相手を
挑戦資格者の最高OVRへ強制差し替えするロジック）が使っている条件をそのまま再利用**した。

- 王者(`aiChampId`)がカードに出場している
- 12週クールダウンが明けている(`aiCdOk`)
- 対戦相手が `Engine.title.getEligibleChallengers(roster, aiChampId, 'ai')` の資格者集合に含まれる

この資格者集合(`eligibleIds`)は元々Fix3の `if` ブロック内のローカル変数だったため、
試合ループ側でも参照できるよう `aiEligibleIds` としてスコープ外に出した（挙動は不変、
`aiChampId && aiCdOk` の場合にのみ計算する点も従来のガード条件と同一）。これは
`management.js:9427〜` にある防衛/王座交代の確定ロジック（試合後、同じ条件で
「これはタイトルマッチだったか」を判定している箇所）と同じ判定式であり、二重に定義していない。

### 変更

1. `Engine.mq.buildRingInOpts`（`management.js:2233`）が `options.championId` を受け取れるように
   1行追加。未指定時は従来どおり `state.titles.world.championId`（プレイヤー団体の王者）に
   フォールバックするため、既存の全呼び出し元（プレイヤー通常興行・PPV・天頂戦・春タッグ等）は無変更。
2. `Engine.rival.processAIWeek` の試合ループ（`management.js:9172`〜）で、上記の判定式が
   真になるカードにだけ `isTitle: true, normalShowRingExtras: true, championId: aiChampId` を渡す。
   `aiChampId` は `state.titles.world.championId`（プレイヤー王者）ではなく
   `nextOrgData.titles.world.championId`（そのAI団体自身の王者）から取っており、
   調査で指摘された「championIdの参照先が違う」問題も同時に解消している。

### 計測（同一シード42・40シーズン、修正前=親コミット213fbd2 / 修正後=作業ツリー）

`docs/ai-title-defense-survey-v0.1.md §B` と同じ手法（`test/auto-sim.js` をスクラッチパッドに
コピーし、`processAIWeek`前後の`titles.world.{championId,defenses}`比較でAI側reignを、
`Engine.title.crownChampion`/`recordDefense`の直接フックでプレイヤー側reignを追跡。
プレイヤー王座自動設立も同様に`Engine.title.checkTitleEstablishment(G)`を毎週呼ぶ1行を追加）で計測。
スクリプトは `test/` 外（Claude Codeスクラッチパッド）に配置、`src/`/`test/`は無改変。

| 団体 | 修正前 平均防衛 | 修正後 平均防衛 | 修正前 0回陥落% | 修正後 0回陥落% | 修正前 3回以上% | 修正後 3回以上% | 修正前 最長 | 修正後 最長 | 修正前 年あたり移動 | 修正後 年あたり移動 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| org_s (EMPRESS/S) | 0.79 | 0.73 | 52.1% | 52.7% | 5.3% | 6.5% | 9 | 4 | 2.38 | 2.35 |
| org_a (NOVA/A) | 0.74 | 0.70 | 59.0% | 54.8% | 8.0% | 4.8% | 4 | 8 | 2.52 | 2.63 |
| org_b (CRESCENT/B) | 0.71 | 0.77 | 57.4% | 62.6% | 4.7% | 8.7% | 8 | 12 | 3.25 | 2.90 |
| player(参考) | 2.10 | 2.71 | 35.4% | 26.8% | 25.0% | 41.5% | 18 | 15 | 1.23 | 1.05 |

**正直に書く: 効果はほぼ測れないほど小さい。** AI3団体の平均防衛回数は0.79/0.74/0.71→0.73/0.70/0.77で、
改善している団体（org_b）もあれば悪化している団体（org_s/org_a）もあり、seed 42・40シーズン1本では
「効いた」と言えるほどの一貫した改善は見えなかった。原因は分析済みで、`docs/ai-title-defense-survey-v0.1.md`
§C.1（挑戦者が常に「その時点の最強」に固定される）の効きの方が強く、リング内ボーナス（脱出+0.10/
カウンター+4pt/王者+0.02）程度では、常に格上か同格とだけ戦わされる構造的不利を覆すには足りないと見られる。
今回のタスクはこの構造（挑戦者選定）には触れておらず、あくまで「非対称の是正」が目的だったため、
効果が小さいこと自体は指示範囲内の結果として報告する。

### プレイヤー側の数値が動いた件（重要・調査済み）

上表で player(参考) の平均防衛回数が 2.10→2.71 と大きく動いているが、**プレイヤーの王座解決コードは
1行も変更していない**（`git diff` で確認済み。変更は `buildRingInOpts` への後方互換オプション追加と
`processAIWeek` の試合ループのみで、プレイヤー経路の呼び出し（通常興行の `buildRingInOpts({ ...s, roster }, m.left, m.right, {...})`）・`crownChampion`・`recordDefense`・`getEligibleChallengers('player')` はソース文字列レベルで無変更）。

原因を追跡した: `test/auto-sim.js` は再現性のため `Math.random` をシード化した関数で
上書きしている（レガシーな `Math.random()` 直呼びのUIテキスト選択箇所が数カ所ある）。
AI側の王座戦アウトカムが本修正で実際に変わる（意図どおりの効果）→
その変化がS1W16のorg_bタイトル戦で最初に発現→
S1W23時点で `Math.random()` の累計呼び出し回数が修正前後で1回ずれる→
以降のツール内蔵ヒューリスティック（スカウト/契約更新等、プレイヤー側自動判断も同じ
`Math.random`ストリームを共有）が全部ズレて、S2W8のプレイヤー王座戦の結果まで連鎖的に変わった、
という事象連鎖をイベントログ突き合わせで確認した（両ログとも先頭2件のプレイヤー王座イベントは
完全一致、3件目から分岐）。

これは「本番のプレイヤー体験が変わる」ことを意味しない。本番のブラウザは `Math.random()` が
非決定的で、AI団体の内部処理とプレイヤーの操作の間に共有ストリームは存在しない。今回のズレは
auto-simの再現性のためのシード共有という**計測ハーネス特有の副作用**であり、AI側の行動を
少しでも意図的に変えれば（今回に限らず今後どんな修正でも）同じ理由で下流の値が動きうる。
なお参考として、**未修正コードのまま**seedだけ42→43に変えても player平均防衛は2.10→1.77と
同程度動く（seed起因の自然なばらつきの目安）。単一seedの「試合結果の一致/不一致」比較は
このゲームの計測手法として原理的に無理があり、コード差分の静的確認（今回はゼロ差分）を
一次情報として扱うべき、という教訓が得られた。

### テスト

新規 `test/ai-title-ringin-test.js`（4ブロック）:
1. AI王座戦カードで `buildRingInOpts` に `isTitle`/`normalShowRingExtras`/正しい`championId`
   （プレイヤー王者IDではなくAI団体自身の王者ID）が渡ること
2. 王座と無関係な通常AI内マッチは `isTitle: false` のままであること（過剰適用していないこと）
3. `buildRingInOpts` の `championId` オプション: 未指定時はstateへフォールバック（後方互換）、
   指定時はそれを優先すること
4. プレイヤー通常興行の実際の呼び出し形（`management.js`のソース文字列を直接読んで検査）に
   `championId` が追加されていないこと

### 不変条件・検証結果

1. プレイヤー団体の王座の挙動が変わらないこと: **コード差分レベルではPASS**（プレイヤー経路は
   1行も触っていない。シミュレーション数値の単一seed比較は上記の理由で「変わらない」ことの
   証明には使えないと判断し、静的差分確認を一次証拠とした）
2. `node test/run-all.js`: **173/173 PASS**（既存172 + 新規1、`ai-title-ringin-test.js`含む）
3. `node test/auto-sim.js 40`（フォアグラウンド実行）: **ALL CLEAR**、violations 0、errors 0、
   freq warnings 0、40シーズン・2120週完走
4. GameStateのスキーマ変更なし（`buildRingInOpts`の引数追加のみ、`aiOrgs[].titles`の形は不変）: PASS

### 質問として残すこと（実装はしていない）

- 効果が小さいこと自体は「Fix2（リング内ボーナス付与）」の担当範囲では想定内だが、
  「AI王座がすぐ陥落する」というKeisukeの体感課題を実際に解消するには、
  調査で最有力とされたC.1（挑戦者選定が常に最強固定）側の手当てが別途要る可能性が高い。
  この設計判断（挑戦者選定ロジックを緩めるかどうか、緩めるなら数値をどうするか）は
  バランス設計判断であり実装していない。次の一手として着手するか、Keisuke判断を仰ぎたい。

## 二度押し監査「残り」のうち判断の要らない5件を修正（task-58・2026-07-31）

出典: `docs/ui/two-click-audit-v0.1.md` の「残り（未確認・低優先）」。
Keisuke裁定「判断の要らない安いものだけ今潰す」で対象5件のみに絞って着手。
作業は `wm-task58`（ブランチ `fix/audit-cheap-items`）で実施、main作業ツリーは未変更。

### 1. `App.skipAllMatches` の到達不能コード → 削除

`if (sp.results.some(r => r === null)) { renderMatchPreview(); if (false) {...} return; }`
を丸ごと削除（`if(false)`の中身だけでなく外側のガードごと）。

**到達しないことの確認方法**: `sp.results` は初期化時（app.js 2箇所、`App._showPreview = {...}`
の中）に必ず `new Array(sp.validMatches.length).fill(null)` で作られ、以後
`sp.results`/`sp.validMatches` の `push`/`splice`/再代入は無い（grepで確認）ので
`results.length === validMatches.length` が常に成立する。`skipAllMatches` 冒頭の
`sp.validMatches.forEach((m, idx) => { if (sp.results[idx]) return; ... })` は
**全indexを走査**し、タッグ/シングルいずれも「不在選手ならstale draw結果」
「揃っていればsimulateMatch/simulateTagMatchの結果」を必ず代入して返るため、
ループ完了時点で `sp.results` に `null` は残り得ない。よって直後の
`sp.results.some(r => r === null)` は常に false で、その中の `if (false)` は二重に到達不能。

### 2. `App.stlAdvance` に想定外phase用の`else`を追加

`'table'`/`'finalReady'`/`'finalResult'` 以外のphaseで呼ばれても無言で何もしなかった。
`else` 節を追加し、`Audio.play('error')` + `console.warn('[WM] App.stlAdvance: unexpected phase', p.phase)`
で異常を可視化。phaseは書き換えない（進行不能にしない）。既存3分岐の判定・処理は無変更。

呼ばれる経路は見つけられなかった（`_receiveSpringTagLeagueBattleResult` と
`escapeBattle` の両方が、`stlAdvance()` を呼ぶ前に必ず `p.phase = p.watchReturnPhase || 'table'`
で phase を戻している）。「見つからない」は「絶対に来ない」の証明にはならないための保険。

### 3. `showTravelScene` の正常系に時限の保険を追加

`anim.onfinish = finish;` の直後に
`setTimeout(() => { if (done) return; console.warn(...); finish(); }, dur + 1000)` を追加。
**時限は `dur + 1000ms`**（`dur` はそのシーンの実際のアニメーション所要時間 = `opts.durationMs`
に reduced-motion 補正を経た値）。固定の絶対値ではなく実際の所要時間に連動させることで、
シーン側で `durationMs` を変えても保険が壊れない。1000msはonfinishの通常発火より
確実に後になる程度の余裕（mockup-baseline-v0.1.md §5-D 鉄則1）。
既存の `done` フラグで二重発火は防止済み（保険が後から鳴っても無害）。

### 4. `renderTenchosenPreEvent` の早期returnがキューを流すように修正

`if (!tp) return;` → `if (!tp) { _drainPopupQueue(); return; }`。
`_enqueuePopup` 経由でキューから取り出された後にデータが無いと分かった場合、
オーバーレイを開かないまま黙って戻ると後続のポップアップが詰まるため。
（`showBigNewsPopup` 等、既存コードにある同型のフォールバックと同じ形に揃えた。）
詰まる経路は見つけられなかった（保険として追加）。

### 5. 動的オーバーレイのcloseが`_drainPopupQueue()`を呼んでいなかった

`.war-victory-overlay`（4箇所: `_showWarVictoryChain` / `_showWarEnemyAceStatement` /
`showB3OpponentAftermath` / `_showJTImpressionChain`）、`.db-hof-detail-overlay`
（背景クリック / ×ボタン / 閉じるボタン / ESC共通ハンドラ / `openChronicleForFighter`、
計5経路）、`.cerem-overlay`（`closeCeremony`）の**close経路すべて**に
`overlay.remove()` の直後で `_drainPopupQueue()` を追加。

- `showB3OpponentAftermath` は同名関数が2回宣言されており（旧mojibake版→クリーン版で
  上書き、`// Re-declare the B3 aftermath renderers...` のコメントで明記済み）、
  最初の定義は関数再宣言で完全にシャドウされ絶対に実行されない。**生きている方（後者）だけ**修正
- `.cerem-overlay` も同じ形の動的オーバーレイ（`_isPopupActive()`の判定対象だが
  `_POPUP_OVERLAY_IDS`のMutationObserver監視対象には無い＝id無しでDOMContentLoaded後に生成）
  だったため、指示書の指示どおり同じ扱いにした。詰まる経路はどちらも確認できていない
  （db-hof/cerem-overlayは指示書側も「見つけられていない」扱い）

### テスト

`test/audit-cheap-items-test.js`（新規・8アサーションブロック）。
DOM無しでソーステキストを静的検査する既存流儀（`week-advance-contract-test.js`と同じ）。
1は行コメント（旧コードを引用した説明文）を除いた実コードだけを検査対象にして誤検知を回避。
5は生きている`showB3OpponentAftermath`をコメントマーカー基準で特定し、シャドウされた方は対象外。
新規1件を含めて `node test/run-all.js` 全171件PASS（170既存 + 新規1）。
テストが実際に退行を検知することは、修正箇所を一時的に壊して失敗することを1件確認して確認した
（確認後は元に戻し、`git diff --stat` で意図した3ファイルの差分のみであることを確認）。

### 不変条件の確認結果

1. 既存の正常系の挙動は変えていない（1は到達不能コードの削除のみ、2/3/4/5はすべて
   「異常系にだけ効く」追加分岐・追加呼び出し）。全171件PASSで裏取り
2. 待ちを足した3は`done`フラグとセットで実装。**未検証**: 実機でタブ非表示時に実際に
   保険が発火するかは確認していない（ソースレベルの静的検証のみ）
3. GameStateへの書き込みは増やしていない（5件とも DOM操作/フラグ/console.warn/Audio.playのみ）
4. 新規16進カラーは増やしていない（HTML/CSSは一切変更していない）
5. `node test/run-all.js` 全PASS確認済み（171/171）

### 質問（実装せず残す）

- 5の `openChronicleForFighter` は直後に `showScreen('database')` を呼んでおり、
  `showScreen`内の`dismissAllPopups()`が`_popupQueue`を丸ごと空にするため、
  今回追加した`_drainPopupQueue()`は実質redundant（無害だが効果が無い）。
  他4経路との統一を優先してそのまま残したが、要らないと判断するなら剥がしてよい
- `.cerem-overlay`を同じ扱いにする判断が指示書の想定と合っているか（詰まる経路が
  未確認という点は`db-hof-detail-overlay`と同格に見えたため、指示書の「同じ形なら合わせる」
  に沿って追加した）を確認してほしい

---

## ドラフト: 自団体が参加しなくても他団体は指名する（2026-07-31）

Keisuke実機報告「自分の団体がドラフトに参加しないと、他の団体もドラフトに参加せず、人を取らない」。
**2回に分けて直した。1度目は経路を読み違えて届かなかった。**

### 構造上の問題

他団体の指名処理は `startDraftNegotiation`（ui-common.js）の中の
「非選択候補のバックグラウンド処理」ループにしか無い。
つまり**この関数を通らずに週が進むと、その年は業界全体が新人ゼロ**になる。
本来はエンジン側の責務だが、今回は経路を塞ぐ対処に留めた（構造の作り直しは別途）。

### 1度目（37a895c）— ドラフト画面の0名ガード

`startDraftNegotiation` の入口に `if (selections.length === 0) return;` があり、
0名だと関数ごと走らなかった。加えて0名時のボタンは
「★ 候補を選択してください」と出るだけの飾りで、**指名しないという選択自体ができなかった**。

- 0名ガードを撤去（非選択候補は既存ループが全部処理するので通してよい）
- `declineDraft()` を追加。確認を1枚挟み、確認文に
  **「他団体の指名はこのまま進みます」**と明記（全員フリーになると誤解させない）

### 2度目（c2ab26e / e18d74e）— 本当に使われていた経路

Keisuke 再報告「ドラフトに行かないと、やっぱり新人は一人も取ってなかった」。
実際に押されていたのは**週画面（ドラフト速報の号外）の「辞退する →」ボタン**で、
`scoutFinish()` → `App.scoutEventFinish()` を直接呼び、候補を捨てて次へ進んでいた。
1度目の保険は `weekPhase !== 'scoutEvent'` を条件にしていたため、
phase がドラフトのままこの経路を通るケースには発火しなかった。

- 「辞退する →」を `declineDraft()` 経由に変更
- **`scoutEventFinish` の入口**に `App._resolveDraftBeforeFinish()` を設置。
  呼び出し元は複数あるので、ボタンごとではなく終了処理の入口で必ず見る。
  ドラフト正常終了後は `_finalizeDraft` が候補を畳み済みなので発火せず、再帰しない
- 週送りの入口（`advanceWeek` / `advanceCurrentFlow`）にも
  `App._ensureDraftResolvedBeforeAdvance()` を設置（phase が外れた場合の保険）
- ドラフト画面の行き止まり解消：候補や関心マークが欠けて指名も見送りもできない状態で
  **押せるボタンが1つも無くなる**ため、「今年のドラフトは行われませんでした」+
  経営画面へ進むボタンを出す

### テスト

`test/draft-decline-test.js` / `test/draft-never-skipped-test.js`（計9節）。
0名ガードの復活検知、**他団体のセリ処理がその関数の中にあること自体**の固定
（別の場所へ移すなら移した先を確かめさせる）、保険の発火条件を実際に関数を動かして検証、
週送りの入口2つが両方保険を通っていることの機械検査、終了後の再帰しないことの確認。

### 教訓

同日、同じ型で2回外した（もう1件は `_tryAutoAdvance` の契約変更で
`closeShowResult` を取りこぼした件）。**共有関数の挙動を変えたら呼び出し元を全部列挙する。
ボタンごとに気をつけるのではなく共有の入口にガードを置き、網羅をテストで縛る。**

---

## 新聞サブ記事の写真 — 複数人記事の隊列化 + 正方形72pxを2:3チップへ（task-54・2026-07-31）

### 対応内容

- 原因は2つ。(1) サブ記事の写真枠(`.np-sub-photo`)が単数の `characterId` しか見ておらず、
  ドラフト/新人系記事などが積んでいる `characterIds`（複数）を無視していた。
  (2) 写真枠が 72×72 の正方形で、素材(upper)は 256×384(2:3) なので体が切れていた。
- `src/ui-render.js` に `_npSubPhotoHtml(ss)` を新設。`characterIds` が2件以上あれば
  `mockup-baseline-v0.1.md` §2-B の隊列（枠は外側に1つだけ／18px重ね／`filter:drop-shadow`／
  個々に額縁なし）で最大3人を chip段(46×66)で並べ、元の人数が3人を超えるぶんは
  右下に `+N` バッジを添える。1人分の情報しか無い記事（`characterIds` が1件、または旧形式の
  `characterId` 単数のみ）は今までどおり単発チップ1枚（サイズだけ 72×72→46×66 に変更）。
  どちらの情報も無い旧バックナンバーは例外を出さず空枠を描く。
- `_npRenderPage1()` のサブ記事ループを `_npPhotoBg(ss.characterId)` 直書きから
  `_npSubPhotoHtml(ss)` 呼び出しへ差し替え。
- `src/index.html`: `.np-sub-photo` を 72×72→46×66(chip段)へ縮小。新規に
  `.np-sub-photo-group`（群の外枠。既存 `.np-sub-photo` と同じ background/border/box-shadow
  を再利用）、`.np-sub-photo-member`（46×66、個々には border/box-shadow を持たせない）、
  `.np-sub-photo-member + .np-sub-photo-member { margin-left: -18px }`、
  `.np-sub-photo-member img { filter: drop-shadow(...) }`、`.np-sub-photo-more`（+Nバッジ、
  `.np-mvprace-rank-mini` と同じ配色を再利用）を追加。新規16進カラーは増やしていない
  （すべて同ファイル内の既存色の再利用）。
- `src/management.js` の `Engine.newspaper.generate`: `characterIds` の
  `slice(0, 2)` を `slice(0, 3)` へ拡張し、元の人数を保持する `characterCount` フィールドを
  story に追加（"+N" 表示に使う）。ただし現行の呼び出し元（`tenchosenSemiFinal` /
  `tenchosenBestBout` / `fatedRivals` 等の `Engine.industryNews.push` 呼び出し、および
  `src/ui-common.js` の `_queueDraftIndustryNews`）はどれも `characterIds` を2件までしか積んで
  いないため、現状のデータでは3人目・"+N" は実際には発火しない（描画側の対応は完了しているが、
  未検証＝到達不能。下記「質問」参照）。

### 何人まで出すか、その根拠

指示書 §B の「3人まで、超えたら+N」をそのまま採用。幅の実測（CSSの数値からの計算。
375px実機スクリーンショットは未取得——後述）:

- chip 46px・18px重ねなので、N人の隊列幅 ≈ `46 + (N-1)*28` (+ 群外枠のborder 4px)。
  1人素材=46px、2人=74px(+border=78px)、3人=102px(+border=106px)。
- モバイル（`@media (max-width: 820px)`）では既存の仕組みで `.np-sub-grid` が2列→1列に
  落ちる（`src/index.html:8746` 付近、今回変更していない）ので、375px幅では `.np-sub` が
  行全体の幅を使える。`.np-content` のモバイル左右パディングは18pxずつ（既存、同じmedia内）
  なので本文幅 = 375-36 = 339px。3人隊列(106px)+`.np-sub`のgap(10px)=116pxを差し引いても
  テキスト側に223px残り、11〜13px日本語の折り返しに十分（デスクトップ2列時の1カラム幅
  357pxでも同様に3人隊列で241px残ることを確認）。横方向にはみ出す計算にはならなかった。
- ただし上記はCSS値からの計算検証であり、**実機/ブラウザでの375pxスクリーンショットは
  取得できていない**（本セッションのブラウザプレビューはプロジェクト外のファイルに対して
  静的スナップショットしか返さず、プロジェクト内に一時ファイルを置いて試したが同様だった。
  本プロジェクトの既定方針「UI確認はスクリーンショットではなくユーザーに委任する」に従い、
  計算検証にとどめた）。**Keisuke に実機確認をお願いしたい。**

### `characterIds` の slice を広げたか

広げた（`slice(0, 2)`→`slice(0, 3)`）。元の人数は新設の `characterCount` フィールドに保持し、
`_npSubPhotoHtml` 側で `characterCount > 表示数` のときだけ `+N` を出す設計にした。
現行データでは3人以上を積む呼び出し元が無い（上述）ため、"+N" 分岐は現状のプレイでは
到達しない。将来 `characterIds` を3件以上積む呼び出しが増えたときに描画側の変更なしで
そのまま "+N" が機能する、という前方互換の実装。

### 古いバックナンバーで壊れないことの確認方法

`test/newspaper-sub-photo-test.js` のセクションD（D1〜D3）で、`_npPhotoBg`/`_npSubPhotoHtml`
を `src/ui-render.js` から `vm` で実際に抜き出して実行し、(1) `characterIds` はあるが
`getUpperUrl` が全滅するケース、(2) `characterId`/`characterIds` どちらも無いケース、
(3) `characterIds` が空配列のケース、のすべてで例外を投げず単発チップの空枠に落ちることを
検証している。

### テスト

- 新規 `test/newspaper-sub-photo-test.js`（20 sections、A〜F）:
  1人/2人/3人ちょうど/3人+N/画像URL欠落/情報欠落のHTML出力、隊列の外枠1つ・個々に
  border/box-shadow が無いこと・z-indexの重なり順、`.np-sub-photo` の46×66化、
  `.np-sub-photo-group`/`-member`/`-more` のCSS構造（drop-shadow使用・box-shadow不使用・
  18px負マージン）、375px用media queryに`.np-sub-grid`の1列フォールバックが残っていること、
  新規16進カラーが既存パレット内の値の再利用であること、`management.js` の
  slice(0,3)・characterCount 追加、をすべて実関数実行 or ソース正規表現で検証。
- `node test/run-all.js`: **166/166 PASS**（既存165 + 新規1）。
- テスト実行の副作用で `docs/stat-contribution-report.md` の実行時間表記だけが更新されたため
  （`stat-contribution-test.js` が実行時に自身のレポートを書き直す既存の挙動）、
  タスク対象外のためコミット前に `git checkout` で元に戻した。

### 不変条件チェック（指示書§不変条件1〜8）

1. 既存1人記事: 枠は72×72→46×66に変更(意図通り)、それ以外の構造(background-image/onclick経路)は不変 — 確認済み(テストA1)
2. 一面トップの2名並び写真(`_npTopTagPhotoHtml`/`_npRenderBignewsTag`)は無変更 — diff確認済み
3. アッパー画像を左右反転していない(`transform:scaleX`等を追加していない) — diff確認済み
4. 新規16進カラーを追加していない(すべて同ファイル内の既存値の再利用) — テストE7で機械検証
5. GameStateへの書き込みを増やしていない(表示関数のみ変更、`management.js`側もstoryオブジェクトの
   フィールド追加のみでstate自体への新規キー追加ではない) — diff確認済み
6. 375px幅で横方向にはみ出さない — **CSS値からの計算検証のみ**(上記参照)。実機/スクリーンショットでの確認は未実施
7. バックナンバー(`characterIds`無し)が例外なく描けること — テストD1〜D3で確認済み
8. `node test/run-all.js` 全PASS — 166/166 PASS確認済み

### 質問(実装せず残した点)

- 3人以上/`+N`表示は描画側の実装は完了しているが、`characterIds`を3件以上積む呼び出し元が
  現状どこにも無い（`_queueDraftIndustryNews`が`src/ui-common.js`側で`slice(0, 2)`しており、
  本タスクでは同ファイルを変更禁止とされていたため触っていない）。実際に3人以上のドラフト
  記事で"+N"を見せたい場合、`_queueDraftIndustryNews`側のslice上限を広げる別タスクが必要。
  優先度・要否の判断をお願いしたい。
- 375pxでの実機確認（スクリーンショット）ができていない。計算上は問題ないはずだが、
  実際のポートレート画像（透過PNG/webp）での見え方はKeisukeの実機確認をお願いしたい。
## 年間表彰式の是正3件（吹き出しのはみ出し / 団体名 / 選手詳細）（task-53・2026-07-31）

### A. 複数人受賞の吹き出し破綻

- 原因は2つ。(1) `.speech-text{-webkit-line-clamp:2;overflow:hidden}` が文の途中でぶつ切りにしていた。(2) `.aw-team-member + .aw-team-member{margin-left:-18px}` は画像の隊列用の重なりだが、吹き出しは `width:100%` で列いっぱいのため吹き出しまで重なり、隣同士が1つの白い箱に見えていた。
- `_buildSeasonEventChampionAward`（`fighters.length >= 2` の経路。春タッグ/4団体勝ち残り対抗戦/天頂戦/PPV GRAND FINALが共通で通る）のスコープに絞って、`.aw-team-member` 配下だけを上書きする3行を追加した（他画面の吹き出し規約 `-webkit-line-clamp:2` / `.aw-speech-slot{height:52px}` はそのまま残し、既存テストを壊さない）。
  - `.aw-team-member .aw-speech-slot{height:auto;min-height:52px}` — 固定枠をやめ、内容に応じて縦に伸ばす。
  - `.aw-team-member .speech-text{display:block;-webkit-line-clamp:none;overflow:visible}` — 切り捨てを解除。
  - `.aw-team-lineup .aw-team-member .speech-bubble{width:calc(100% - 2 * var(--space-lg))}` — 吹き出しを画像より左右16px(`--space-lg`)ずつ狭め、18pxの重なり分を打ち消して隣と約14px離す。画像自体は§2-Bどおり18px重ねたまま。
- 画像上端の揃え方は「列の下端で揃える」方式に作り直した。実装は変更していない — `.aw-team-lineup{align-items:flex-end}` は既存のまま。吹き出しの高さがメンバーごとに変わっても、吹き出しから下（画像＋名前）の高さは全員共通なので、下端基準の揃えなら自動的に画像の上端も揃う（旧方式は固定52px枠による上端合わせだったが、吹き出しが伸びる新方式ではこちらのほうが壊れない）。
- 3人以上（`is-many`、4団体勝ち残り対抗戦の3名制）でも専用分岐は作らず、同じ3行がそのまま効く。中心（`is-center`、L 150×224）と脇（132×194）でポートレート高さが違うぶん画像上端はズレるが、これは§2-Bの「ひな壇」仕様どおりで新規の破綻ではない。

### B. タイトル王者に団体名を大きく入れる

- `_buildChampionsAward` の `buildCol` で、エンブレムだけだった `.aw-winner-emblem` を `.champ-org`（エンブレム＋団体名テキストを横並び）に置き換えた。エンブレムは削除していない。
- サイズは選手名 `.champ-name`（15px）を基準に、2位・3位は同格の15px、1位はタイプスケールで1段上の18px（`.rank-1 .champ-orgname`）。既にエンブレムを36px/24pxで差を付けているのと同じ考え方。
- 自団体は既存の `champ-defense` の isPlayer 着色と同じ `var(--gold)` で強調する。新しい16進カラーは追加していない。`.champ-orgname` の既定色 `#f0ead8` は新規の色ではなく、同じ枠内の `.champ-name` / `.aw-team-name` / `.fighter-name` 等が既に使っている値をそのまま再利用した。

### C. 表彰式でも選手名・選手画像から詳細を開ける

- 共有ヘルパー `_awOpenAttr(id)` を新設（`_awPortrait` の直後）。`canOpenFighterPopup(id)` で実在を確認できたときだけ `onclick="event.stopPropagation();showFighterPopup(id,'',true)" data-fp-open` を返す。`source` は空文字で渡し、roster/FA/スカウト/AI団体/引退直後を自動探索させる（決め打ちにしない）。cursor は `style=""` の二重付与を避けるため `#awardsOverlay [data-fp-open]{cursor:pointer}` という属性セレクタで示した。
- 対象は `_awPortrait` を使っている6箇所全部: `_awWinnerBlock`（メディア功労賞/新人王/大会優勝1名/MVPが共通で通る）、`_buildSeasonEventChampionAward` の隊列（複数人）、`_buildBestMatchAward` の両サイド、`_buildChampionsAward` の `buildCol`、`_buildHallOfFame`。いずれも既存の `class="..."` 属性文字列は変更せず、その直後に属性を追記するだけに留めた（既存テストの部分一致アサーションを壊さないため）。
- リンクにしなかったケース: `_buildJTChampionAward` の決勝相手（`d.runnerUp = {id:null, name, orgName}`）。もともと `_awPortrait` を使わない名前だけのテキスト表示で、`id` も無いため何も付けていない。
- 進行への影響: `showFighterPopup` 自体は「押したら必ず開く」実装（キュー判定なし）で、表彰式のスライド送り（`goToSlide`/`nextSlide`/`window._awardsNext`）には手を入れていない。全 onclick に `event.stopPropagation()` を付け、殿堂入りスライドの `slideWrap.addEventListener('click', ...)`（コーチFG切り替え）へクリックが抜けないようにした。z-index は選手詳細 `.fighter-popup-overlay{z-index:500}` が式典 `.awards-overlay{z-index:400}` より上で確認済み。

### 検証

- 新規 `test/awards-ceremony-polish-test.js`（18 sections）: A(line-clamp解除の上書き/吹き出しの非重なり/吹き出し→画像の順序/名前や所属を吹き出しに入れない/is-many専用分岐が無いこと)、B(団体名テキストの有無/1位が2位・3位より大きいこと/自団体が--goldであること)、C(6ブロック全部で名前・画像双方にリンクがあること/`_awOpenAttr`がcanOpenFighterPopupとstopPropagationを持つこと/idが無い相手にリンクを付けないこと)、不変条件(進行ロジック無改修/z-index順序)を静的ソース検査で確認した。
- `node test/run-all.js`: **166/166 PASS**（既存165 + 新規1）。既存 `test/awards-ceremony-layout-test.js`（`-webkit-line-clamp:2` や `.aw-speech-slot{height:52px` などの基準ルール文字列を検査）は無改修でPASS — 今回の変更は `.aw-team-member` にスコープした追加ルールのみで、基準ルール自体は書き換えていないため。
- `src/data.js` は無変更。GameStateへの書き込みは追加していない（表示専用の文字列生成のみ）。アッパー画像の左右反転・2:3ラダーの既存枠サイズは変更していない。
- 未検証: 375px幅での実機レイアウト確認（横スクロールの有無）。静的なソース検査では実際のブラウザ計算後の折り返し・オーバーフローまでは確認できないため、目視確認をお願いしたい。

## 王座防衛の演出を派閥イベント級に落とす（task-51・2026-07-31）

### 対応内容

- `showTitleMatchCeremony(outcome, onDone)`（`src/ui-common.js`）を3分岐に分けた。
  - **戴冠**（`outcome !== 'defense'`）… 従来どおり `showCeremonyEvent` の大判式典（`visualVariant: 'triumph'`）。変更なし。
  - **節目の防衛**（`Engine.news.checkDefenseMilestone(defenses)` が 5/10/15 を返す）… 従来どおり同じ大判式典。新しい閾値は作らず、既存関数をそのまま呼んでいる。
  - **通常の防衛**（上記以外）… 新設した `showTitleDefenseResultModal(champion, champLine, defenses, done)` を呼ぶ。`showFactionEventResult` と同じ部品（`_mdlAHeader` / `_mdlASubjectStage` / `_mdlAOpen`）だけで組んだA型モーダル1枚で、全画面式典オーバーレイは使わない。
- 通常防衛モーダルの中身: 見出し1行「🛡 王座防衛」、メタ行に「N度目の防衛 ・ WEEK xx ・ xY」、地の文1行（`mdl-a-observation`）、王者の顔（`_mdlASubjectStage` の `small` 段）+ 頭上吹き出し1つ（`getTraitQuote('titleDefense', champion)` をそのまま使用）、ボタンは「閉じる」のみ。挑戦者の顔・吹き出しは出さない。
- セリフ取得ロジックは既存のまま流用（`getTraitQuote('titleDefense'|'titleWin', champion)` / `getTraitQuote('titleChallengeLoss'|'titleLoss', opponent)`）。`src/data.js` は一切変更していない。
- 併せて、`showTitleMatchCeremony` 冒頭の早期return条件を整理した。旧実装は「王者が見つからない or showCeremonyEvent が無い」を1つのif文で判定しており、通常防衛の軽量モーダル経路まで無関係な `showCeremonyEvent` の有無に引きずられていた。`showCeremonyEvent` のtypeofチェックは、実際にそれを呼ぶ式典分岐の直前だけに移した（王者不在の判定は引き続き最上部）。

### 判断が要った点（実装しつつ判断したもの）

- **挑戦者の扱い**: 指示書は「挑戦者は出しても1枚まで」としていたが、王者の頭上吹き出しを「セリフ1つ」に絞る方針と両立させるため、通常防衛では挑戦者の顔・セリフを出さない（0枚）判断にした。`getTraitQuote('titleChallengeLoss', opponent)` の呼び出し自体は関数内に残しているが、通常防衛の表示には使っていない（節目防衛・戴冠の式典側では従来どおり使用）。
- **選手画像サイズ（2:3ラダー）**: `_mdlASubjectStage` の `small: true` は既存実装のまま 120×160（3:4）で、`docs/ui/mockup-baseline-v0.1.md` §2 の2:3ラダー（S 108×162 等）とは厳密には一致しない。ただし本タスクは `showFactionEventResult` と「同じ部品」を使うことが明示指示であり、`showFactionEventResult` 自身もこの同じ `_mdlASubjectStage(…, { small: true })` を使っている。`_mdlASubjectStage` は他の多数の画面が共有する部品で、今回の変更許可ファイル（`showTitleMatchCeremony` 一帯のみ）の範囲外のため、サイズそのものは変更していない。§2ラダーとの不一致は本タスク固有の新規逸脱ではなく既存の共有部品の仕様であることを明記しておく。

### 検証

- 新規 `test/title-defense-scale-test.js`（11 sections）: 通常防衛（0〜16度目のうち非節目値）で `showCeremonyEvent` を呼ばないこと、節目防衛（5/10/15）と戴冠で呼ぶこと、王者不在・DOM未整備・`showCeremonyEvent`不在・onDone未指定を含む全分岐で `onDone` が必ず1回だけ呼ばれること、通常防衛モーダルの出力HTML構造（見出し1行/メタ行/地の文1行/吹き出し1つ/顔1つ/ボタン文言「閉じる」/`margin-top`不使用/吹き出しに選手名・団体名が入らないこと）を、実関数を `vm.runInNewContext` で実行して検証する。
- 既存 `test/title-match-ceremony-test.js` は無改修でPASS（戴冠側の式典コード・文言・`showCeremonyEvent(evt, speakers` 呼び出しを変更していないため）。
- `npm test`: **164/164 PASS**（既存163 + 新規1）。
- `src/data.js` は無変更。GameStateへの書き込みは追加していない（この関数群は表示専用のまま）。新規16進カラー・新規CSSクラスは追加していない（既存の `mdl-a-*` トークン/クラスのみを再利用）。

## 興行準備・興行結果の画像規格是正（task-49・2026-07-31）

### 対応内容

- 興行準備のシングル主試合・通常試合を、ともに upper の M（132×194）へ統一した。`imgW` / `imgH` のfallbackも同じ値に揃え、2:3素材を1:1.25へ切り抜く経路を除去した。
- 興行準備・興行結果共通のタッグは、2人分を `L 150×224` で横に18px重ねる群表示へ変更した。個人の枠・境界線は持たせず、群コンテナだけが外枠を持つ。各画像の影は矩形に付かない `filter: drop-shadow()` を使用し、各選手ブロック自体を150px幅・`margin-left:-18px`にしたため、画像と名前／OVRの中心も同じ重なりで揃う。
- 興行結果の共通 `.pb-portrait` を S（108×162）へ変更し、解決済み行だけをより具体的な `chip 46×66` で上書きした。既存の主試合 `.pb-mrow.is-main .pb-portrait{width:108px;height:162px}` は変更していないため、主試合の見た目と吹き出しの画像上配置を維持する。
- 375px幅では、興行準備のシングルを「画像3列＋能力値行」のgridへ再配置する。興行準備・興行結果のタッグ、興行結果の各行は縦積みに切り替え、規定画像サイズを縮小せず横スクロールを防ぐ。

### 回帰確認

- 新規 `test/showprep-result-image-size-test.js` は、6対象のサイズ、タッグの群外枠・18px重ね・drop-shadow・個人枠なし、および既存の興行結果主試合が108×162のままであることを静的に検証する。
- 個別確認: `node test/showprep-result-image-size-test.js`、`node test/spring-tag-team-frame-test.js`、`node test/regular-show-pregame-design-test.js` はすべてPASS。`npm test` も **158/158 PASS**。
- 試合エンジン系ファイル、GameState書き込み、画像の左右反転は変更していない。新規16進カラーも追加していない。
## PPVテレビ中継の勝敗明瞭化・年末表彰式順序保証（task-50・2026-07-31）

### A. アンダーカード速報

- `renderPPVTvBroadcast` の関数内に結果用 `_resultSide` を追加し、速報を勝者のみの表示から両者並置へ変更した。勝者は `ptv-result-upper--m`（M: 132×194）と `○`・`WIN`、敗者は `ptv-result-upper--s`（S: 108×162）と `×`・`grayscale(.9) brightness(.72)` で表示する。両者の名前・団体・upper画像を必ず出す。
- 引き分けは両者とも M サイズ、`△`、`DRAW` とし、グレースケールを適用しない。ベースライン §2 の「並置は同段」から勝者を一段上げる逸脱は、PPV速報で勝敗を瞬時に読ませる Keisuke 指示によるものとして `_resultSide` の利用箇所にコードコメントを残した。

### B. 頂上決戦の決着

- 対峙シーン専用の `vsBlock` を決着では再利用せず、`summitResultBlock` を新設した。勝者は XL（172×258）・`○`・`WIN`、敗者は M（132×194）・`×`・グレースケール。引き分けは双方 XL・`△`・`DRAW` で対等に表示する。

### C. ファンファーレ

- 決着シーンは `stopBgmBeforeSe: true` とし、`rs04` 再生の直前に `Audio.bgm.stop()` を実行する。決着後は余韻のBGMを再開せず、既存どおり放送終了まで無音とした。OP／カード／速報の `grandFinalProgress` と、対峙シーンの `grandFinalMain` は維持した。

### D. 表彰式と総括の順序

- オフシーズン第1週だけは、AI成長ポップアップ待機前の `refreshAll()` を抑止した。これにより、背面に総括を先描画せず、ポップアップ → 表彰式 → `_showFarewellsThenReport()`（今週画面へ復帰して総括描画）の順に固定する。
- AI成長ポップアップ完了コールバックには、`Math.max(8000, aiAlerts.length * 4000)` の時限保険と一度だけ起動するガードを追加した。コールバック喪失時も表彰式チェーンの予約へ進み、PPVの「準備中…」停止と同型の永久待機を防ぐ。

### 検証

- 新規 `test/ppv-tv-result-clarity-test.js`: 敗者のupper表示・グレースケール・M/S/XLサイズ、決着ブロックの分離、`LOSE` 不使用、引き分け対等表示、ファンファーレ前のBGM停止を確認。
- 新規 `test/awards-before-report-order-test.js`: オフシーズン第1週の先行総括抑止、ポップアップ→表彰式→総括、待機コールバックの時限保険と二重起動防止を確認。
- 対象テスト: `ppv-tv-result-clarity-test`、`awards-before-report-order-test`、`ppv-tv-start-test`、`season-end-order-test` はすべてPASS。全体 `npm test`: **160/160 PASS**。

## 顔出し画面ベースライン監査（task-47・2026-07-31）

- 調査専用。`src/` は変更せず、`docs/ui/faceout-audit-v0.1.md` に顔・upper・stand・full を出す46箇所の実測監査を記録した。
- 違反は38件（高19 / 中19 / 低0）。毎週使う興行準備・興行結果、試合エンジン、52px超のface主役表示、タッグ群の§2-B違反を優先候補とした。
- 表彰式は共通U3部品による準拠として記録。PPVテレビ中継カード一覧はtask-46対応済み、事前プログラム・速報・頂上決戦は同タスク対応中として記録し、二重修正を避けた。

## 第48週PPVが飛ぶ週進行バグ修正（task-48・2026-07-31）

### 原因（UIイベント経路）

- 今週画面の通常ボタンは `ui-common.js` の `advanceWeek()` → `App.advanceCurrentFlow()` → `App.processWeek()` を呼ぶ。一方、`ui-render.js` が週次サマリー用に生成するボタンは、インライン `onclick="App.advanceFromWeekSummary()"` を直接呼ぶ別入口だった。
- 修正前の `App.processWeek()` は `tickWeek()` で当週を処理した後、非月末なら `_tryAutoAdvance()` が `weekPhase: 'weekSummary'` を設定して return していた。つまり第47週は**1クリック目が第47週の精算だけ、2クリック目が第48週への遷移**であり、UI設計そのものが「2回押す必要」を作っていた。
- さらに `advanceFromWeekSummary()` は呼出前の `weekPhase` を検証せず、常に `Engine.advanceWeek(G)` を実行していた。第47週サマリーのハンドラが重複発火／再入すると、1回目で `W47 → W48:ppvShow/ppvTV`、2回目でPPV専用phaseのまま `W48 → W49:offseason` となる。これが「第48週が丸ごと飛ぶ」根であり、Engine単体が正常でもUI入口で再現する。

### 修正

- `_tryAutoAdvance()` は月末・非月末を分けず、`tickWeek()` 完了後に財務履歴を1件だけ追加して `weekSummary` を入力契約として設定する。
- `processWeek()` はその同一クリック内で `advanceFromWeekSummary()` を1回だけ呼ぶ。これにより、週次処理と翌週遷移が必ず1クリックで完結する。月末決算は既に `tickWeek()` 内で一度だけ実施済みなので、止めることによる二重操作をなくしても決算計算・履歴は飛ばない。
- `advanceFromWeekSummary()` は `weekPhase === 'weekSummary'` の時だけ `Engine.advanceWeek()` を呼ぶ。PPV専用phaseなどで到着した古い／重複onclickは `false` を返して無視するため、どの大会週でも二重進行できない。
- 実機コンソールに残るUI経路ログを追加した。

  ```text
  [WM][week-advance] summary handler advanced exactly once
  [WM][week-advance] ignored stale summary handler
  ```

### 実測ログと新規回帰テスト

- 新規 `test/week-advance-single-step-test.js` は app.js の実際の `advanceFromWeekSummary` 関数本体をVMで実行し、`Engine.advanceWeek` の呼出回数とUIハンドラログを取得する。修正前 `HEAD` に対しては、`processWeek` が同一クリック中に遷移を行わないため失敗することを先に確認した。

  ```text
  修正前HEAD: AssertionError: processWeek は週次処理後に同一クリック内で advanceFromWeekSummary を1回呼ぶこと

  修正後UI handler log:
  [WM][week-advance] summary handler advanced exactly once
  | initPPVTV
  | [WM][week-advance] ignored stale summary handler

  W44:weekSummary -> W45:manage
  W45:weekSummary -> W46:manage
  W46:weekSummary -> W47:manage
  W47:weekSummary -> W48:ppvTV
  W48:PPV-settle -> W49:offseason
  ```

- 第48週は必ずPPV専用phaseを通過し、PPV終了時の第48週確定後にだけオフシーズンへ入る。新規テストは春タッグ（12）・ジュニア（24）・秋4団体戦（36）・PPV（48）の各開始も、同じUIハンドラが Engine を1回だけ呼んで正規の大会週へ到達することを確認している。

### 不変条件・検証結果

1. 1クリックで `tickWeek` 後の `Engine.advanceWeek` は1回だけ: PASS。
2. 大会週12/24/36/48は各々1回だけ正規開始、第48週もPPV専用phaseを正規通過: PASS。
3. 順序は `W48 PPV → W48 settle → W49/offseason`。既存のオフシーズン処理（表彰式→総括→契約更改）に変更なし: PASS。
4. 月末を含む全週で財務履歴は1件だけ追加、決算は `tickWeek` 内で一度だけ: PASS。
5. 数値バランス・試合結果のロジックは未変更: PASS。
6. `npm test`: **157/157 PASS**。
7. `node test/auto-sim.js 40`: **ALL CLEAR**（violations 0、errors 0、通常年PPV 30/30、天頂戦 10/10）。

## PPVテレビ中継の4不具合修正（task-46・2026-07-31）

### D. 時系列（最優先）— 仮説の検証と修正

- 指示書の仮説を `Engine.advanceWeek()` で第47週から実測した。通常年・TV観戦・seed `46001` の遷移列は次のとおり。

  ```text
  S1 W47:manage
  → S1 W48:ppvTV
  → S1 W48:settled
  → S1 W49/OFF0:offseason
  → S1 W49/OFF1:awards
  → S1 W49/OFF2:contract
  ```

- 結論として、`ppvPhase === 'tv' / 'locked'` の実発火分岐に `!s.offSeason` がなかったことは事実だが、**現行コード単体ではこの仮説どおりの再発はしなかった**。`advanceWeek()` 冒頭のオフシーズン処理が先に return するため、`offSeason: true, week: 48, ppvPhase: 'tv'` を与えた実測でも `OFF1:offseason` のまま、`ppvTV` には入らない。
- それでも壊れた復旧データや将来の分岐順変更で不変条件が崩れないよう、`locked` と `tv` の両発火分岐へ `!s.offSeason` を追加した。第48週の正規化ブロックと条件を揃えた防御であり、正規の第48週の PPV は消化される。
- `App.initPPVTV()` は中継結果を `_ppvTvBroadcast` としてその第48週に保存する。保存からの再開・重複呼び出しではこの結果を再利用し、シミュレーション、戦績、ニュース、視聴回数、ログを二重に反映しない。終了時にキャッシュと `ppvPhase` を消して次週へ進む。
- 新規 `test/ppv-season-flow-test.js` は上の第47週→オフシーズン第2週をヘッドレスで通し、PPVが `S1 W48:ppvTV` の一度だけ、表彰データが契約更改週より前、オフシーズン中の `ppvTV` / `ppvShow` 不発火を検証する。

### A. 選手画像

- 原因は ID の取り違えや画像取得失敗ではなく、`portraitImg(..., 96)` が生成する **96×96 の inline サイズ**を、38×38・丸・`overflow:hidden` の親へ入れていたこと。inline サイズが `.ptv-face img` の CSS を上書きし、画像の左上だけが円形に切り取られて、色の塊／別人のように見えていた。
- PPVカードの選手画像を `getUpperUrl(id)` の upper 素材へ変更し、2:3 の `chip` **46×66**、`--radius-md` の矩形枠にした。左右のセルは既存の対称レイアウトを維持し、画像を左右反転していない。速報は62×90、頂上決戦は92×138の同じ2:3系統で表示する。

### B. BGM

- 放送OP・カード一覧・試合速報は `grandFinalProgress`（WM-SP07）、頂上決戦の対峙・決着は `grandFinalMain`（WM-M05）。放送終了は無音であり、終幕場面への遷移時に `Audio.bgm.fadeOutStop(350)` を実行する。
- 「事務所へ戻る」でも `Audio.bgm.stop()` と `Audio.fileBgm.stop()` を先に実行するため、最終試合曲は確実に停止する。週を進めた後は既存の `Audio.bgm.playForState()` がオフシーズン曲、表彰式では既存の表彰式曲へ切り替える。

### C. PPV直前の背面ちらつき

- 原因は `ppvTV` へ遷移後、イベントポップアップキューが空になるのを待ってから初めて中継オーバーレイを描画していたこと。待機中には `refreshAll()` 済みの総括など背面画面が一瞬見え得た。
- `App.initPPVTV()` の最初に不透明な「WRESTLE TV / GRAND FINAL を準備中…」枠を表示してからキューを待つようにした。よって `weekPhase: 'ppvTV'` になった時点で背面ではなくPPV中継が先に表示され、task-43 の総括表示経路とも競合しない。

### 検証

- `node test/ppv-season-flow-test.js`: PASS（上記の実測遷移列を出力）。
- `npm test`: **156/156 PASS**。
- `node test/auto-sim.js 40`: **ALL CLEAR**（violations 0、errors 0、40シーズン中の通常年PPV 30/30 実行、天頂戦 10/10 完走）。
- `git diff --check`: PASS。

## 年末表彰式レイアウト是正・総括表示修正（task-43・2026-07-31）

### 実装

- モックアップ共通ベースライン v0.8 の §2 / §2-B / §3 / §4 と Ceremony カテゴリを確認してから、`src/ui-common.js` と `src/index.html` の年末表彰式を修正した。
- 単独主役（メディア功労賞、JT優勝、新人王相当、MVP、殿堂入り、天頂戦、PPV最終戦）は `XL` **172×258**、ベストマッチの対置2名は `M` **132×194**、春タッグの同格2名は `L` **150×224** に統一した。タイトル王者の順位表示も 2:3 比率へ移行した。
- `aw-speech-slot`（52px の通常予約枠）を追加し、全ての顔出しブロックを「吹き出し予約枠 → 画像 → 名前 → 役割/補助情報 → 団体バッジ」の順へ統一した。吹き出しはクリーム地・本文13px・2行クランプで、下向きの尻尾が画像中心を指す。`_awSpeech()` から話者名の出力を除去した。
- 春タッグおよび複数人の大会優勝は `aw-team-group` の外枠1つに変更した。個人の矩形枠は置かず、2名はL、3名以上は中央L・両脇M、隣接者を **18px** 重ね、`filter: drop-shadow()` を画像シルエットへ適用した。団体名・タッグ王者の称号は群の頭に置いた。
- 春タッグ、秋4団体勝ち残り対抗戦、天頂戦、PPV GRAND FINAL の大会優勝スライドでは、既存の **`AWARD_LINES.champion`** を `_awardLine('champion', fighter.id)` で参照した。セリフ定数・文言の追加や変更はしていない。

### 総括が出なかった原因と修正

- `Engine.advanceWeek()` は offWeek 1 に `pendingAwards` を生成し、表彰式の完了コールバックも `_showFarewellsThenReport()` へ接続済みだった。総括の描画も `renderWeekScreen()` の offWeek 1 条件で正しかった。
- しかし `_showFarewellsThenReport()` は `refreshAll()` だけで、年末表彰式の背面にしていた別タブを「今週」へ切り替えなかった。そのため総括は再描画されてもアクティブでない画面内にあり、式典後に見えない状態になり得た。task-42 の初年度用 `pendingAwards` 復旧は原因ではなく、復旧条件を戻していない。
- offWeek 1 に限り `showScreen('week')` を実行してから描き直すようにし、表彰式終了後は必ずレポート週のシーズン総括を表示する。

### 検証

- 新規 `test/awards-ceremony-layout-test.js` で、吹き出し→画像の出力順、予約枠、下向き尻尾、XL/L/Mサイズ、タッグ群枠・18px重なり・drop-shadow、大会優勝4種の既存プール参照、総括への画面遷移を検証した。
- 既存 `test/awards-champions-layout-test.js` のタイトル王者の等幅列チェックも維持した。
- 個別実行: `node test/awards-ceremony-layout-test.js`、`node test/awards-champions-layout-test.js`、`node test/season-end-order-test.js`、`node test/year1-season-events-test.js` は全てPASS。`npm test`: **153/153 PASS**。`git diff --check` もPASS。

## 追い込みの熱量逓減・本番セリフ統合（task-44・2026-07-31）

### 実装

- `docs/dialogue/heat-visibility-lines-draft-v0.1.md` の承認済み本文を、`src/data.js` の `HEAT_STATE_SELF_LINES`（75本）と `HEAT_STATE_COACH_LINES`（21本）へ一字一句そのまま登録した。`EVENT_LINES_BY_KEY` には `heatSelf` / `heatCoach` を追加し、Node エクスポートにも両定数を追加した。
- 選手詳細の仮 `HEAT_STATE_LINES` を撤去し、`getHeatStateQuote()` から `pickDialogueLine(HEAT_STATE_SELF_LINES[state], fighter)` で personality → archetype → `_default` の既存フォールバックに従って選ぶようにした。未設定のプールでも `…` に安全にフォールバックする。
- 道場画面左下の既存コーチ吹き出しを熱量観察の表示枠として配線した。heavy の選手がいれば常時その選手を優先し、warm/fresh は既存コーチ報告が表示される週に限って表示する。既存 `COACH_VOICE_REPORT_LINES`（strain系を含む）と同じ吹き出し本文を差し替えるため、同じ週に将来のstrain報告と今週のheat観察を重ねない。表示選択は `Engine.rng.derive()` のローカルRNGで固定し、GameState・成長計算には書き込まない。
- 新規 `test/heat-lines-test.js` は草案の2つのJavaScriptブロックを直接パースし、実装定数との完全一致、43文字上限、全状態×全personalityのフォールバック、heavyの回復明示2本、数値・倍率・内部変数名の非露出、レジストリとUI配線を検査する。既存 `test/heat-visibility-test.js` は仮テキスト参照の検査を本番プール参照へ更新した。

### 検証

- fingerprint 比較は同一seed `492879082` で実施した。変更前ソース（`WM_SOURCE_REF=HEAD`）と変更後ワーキングツリーはいずれも `268bd395`、violations 0 / errors 0 / ALL CLEAR。`node test/auto-sim.js 20` のseed省略時は日時由来のため、比較には用いない。
- 個別: `node test/heat-lines-test.js` / `node test/heat-visibility-test.js`: PASS。`npm test`: **153/153 PASS**。`git diff --check`: PASS。
- 成長計算（`GROWTH_CONFIG` / `Engine.growth`）は未変更。

## 宿怨（BITTER）試合前セリフ（task-45・2026-07-31）

### 実装

- `src/data.js` に草案 `bitter-prematch-lines-draft-v0.1.md` の `BITTER_PREMATCH_LINES`（ahead / behind 各28本）をそのまま追加し、`EVENT_LINES_BY_KEY.bitterPrematch` と Node export に登録した。宿怨用の表示クールダウンは `RIVALRY_POPUP_CONFIG.bitterPairCooldownWeeks: 16`。
- `src/app.js` の通常興行試合前検出に、宿怨専用の独立分岐を追加した。`G._rivalryPopupSeen['bitter:idA-idB']` を task-41 と同じ仕組みで使い、同一ペア16週・1興行1件を適用する。候補が重なった場合は宿怨を通常因縁より先に選ぶ。
- 通常興行で宿怨が確定したとき、既存の決着値や判定を変えず `G.rivalries[key].bitterResolutionWinnerId` に決着戦の勝者IDだけを追記する。勝者IDのない既存セーブは、コメント付きでH2H通算勝敗へフォールバックする。
- `src/ui-common.js` は `isBitter` の宣戦布告モーダルだけを分岐し、タイトル「遺 恨 再 燃」・`GRUDGE REKINDLED`・`tone-bitter`・「再 燃」・指定タグを表示する。通常の宣戦布告文言は変更していない。

### 検証

- 新規 `test/bitter-prematch-test.js` は草案を直接評価して実装値との完全一致、56本の内訳、動的マップ登録、決着戦勝者／旧セーブの側判定、16週設定、宿怨優先、宿怨／通常モーダル文言を検証する。
- `test/rivalry-popup-frequency-test.js` の設定値検証を宿怨用16週設定に更新した。
- `npm test`: **153/153 PASS**。`node test/auto-sim.js 20`: **ALL CLEAR**（違反0、エラー0）。`git diff --check`: PASS。

## 因縁の一戦ポップアップ頻度の抑制（task-41・2026-07-31）

### 実装

- `src/data.js` に表示頻度専用の `RIVALRY_POPUP_CONFIG` を追加した。`normalMinRivalry: 60`、`maxNormalPerShow: 1`、`normalPairCooldownWeeks: 8` とし、因縁値の計算・蓄積・決着判定の設定は変更していない。
- `src/ui-common.js` の通常試合後「因縁の一戦」予約だけを対象に、60以上（好敵手／宿敵の称号持ちは例外）、興行あたり最高rivalryの1件、同一ペア8週クールダウンを適用した。期限切れ・不正・未来週の `_rivalryPopupSeen` エントリは各興行結果描画時に削除する。
- 表示済み記録はセーブ対象の `G._rivalryPopupSeen` に `{ "idA-idB": absoluteWeek }` として保持する。未設定の既存セーブは空の記録として扱うため、移行不要でクラッシュしない。
- 決着試合には通常の「因縁の一戦」を重ねず、既存の `showRivalryPopups(pendingResolutions, ...)` 専用キューを変更していない。したがって「因縁決着」「宿敵戦勝利」などの決着演出は頻度抑制の対象外である。

### 検証

- 新規 `test/rivalry-popup-frequency-test.js` で閾値、称号例外、興行上限、同一ペアのクールダウンと期限後再表示、決着専用キューを検証した。
- 既存 `test/rivalry-match-dialogue-test.js` は旧仕様のrivalry 30固定値チェックを、`RIVALRY_POPUP_CONFIG.normalMinRivalry` を読む60設定のチェックへ更新した。
- `npm test`: **150/150 PASS**。

## 1年目イベント・引き留め待遇（task-42・2026-07-31）

### A. 1年目イベントの実データ調査と修正

- `Engine.createInitialState(20260731, true)` を開始点に、実際の `tickWeek` / `advanceWeek` で第1シーズンをオフシーズン第1週まで進めた。`Engine.awards.generate()` の出力は `springTagChampion`、`bestMatch`、`mvp`、`mediaAward`、`champions` が成立していた。少なくともエンジンに1年目を表彰から除外する分岐はなく、データ不足で全賞が空になる再現もしなかった。
- 原因は表示側の復旧ガードだった。`App._recoverPendingAwards()` は `pendingAwards` が失われた際、`seasonHistory.length === 0` なら復旧を拒否していた。初年度のoffWeek 1では履歴アーカイブがまだ行われず `seasonHistory` が空のため、この経路だけ初年度の表彰式が消える。`offSeason && offWeek === 1` を唯一の復旧条件にして、同じ実データから再生成するよう修正した。
- 同じ実行で初期 `ppvUnlocked: false` のまま第48週に `weekPhase: 'ppvTV'` へ到達した。これは出場資格がない団体を除外する設計ではなく、PPV GRAND FINALをテレビ観戦へ切り替える既存仕様である。`tvMode` は天頂戦用の表示/BGM分岐であり、通常PPVの1年目を弾いていない。
- 表彰式UIは、表示可能な賞が1件以上ある場合にのみ開くよう `Engine.awards.hasDisplayableAwards()` を明示した。全賞が空のときは「該当者なし」等の説明スライドを作らず、静かに次の演出へ進む。成立した賞がある1年目は従来どおり式典と全受賞者一覧を表示する。
- 新規 `test/year1-season-events-test.js` は上記の実進行を実行し、表彰データ、表示対象の賞、`ppvTV` 到達を出力・検証する。全賞が空の合成データでは式典対象外になること、および初年度の空の履歴で復旧を拒否しないことも確認する。

### B. 引き留め時の給与反映

- `Engine.contract.calcRetentionRaiseAmount(neg, fighter, state)` を追加。昇給額は `neg.raiseAmount` を優先し、既存セーブでそれが欠ける場合だけ `neg.counterOffer`、最後に既存の `calcRaiseAmount()` を使う。結果は既存の `salaryBonus` 上限100万/週の残余で上限を掛ける。
- 移籍志願の引き留め成功時に上記額を `salaryDelta` へ設定する。一時金 `neg.retentionBonus`、失敗時の退団・給与据え置きは変更していない。
- 引き留め選択肢と「理由を聞く」後の再選択の全文を `一時金◯万 + 給与+◯万/週` に変更した。選ぶ前の情報欄も同じ条件を示す。
- 新規 `test/contract-retention-salary-test.js` は成功時の給与・一時金・上限、失敗時の退団/昇給なし、両条件を含む選択肢文言を検証する。

### 検証

- `node test/year1-season-events-test.js`: PASS（実出力: `springTagChampion, bestMatch, mvp, mediaAward, champions` / `year1 ppvTV: true`）。
- `node test/contract-retention-salary-test.js`: PASS。
- `npm test`: **151/151 PASS**。
- `node test/auto-sim.js 20`: **ALL CLEAR**（違反0、エラー0）。
- `git diff --check`: PASS。

## 実機フィードバック修正6件（task-40・2026-07-31）

### 実装

- サッカー用語をプロレス文脈へ修正した。ランキング講評の「欠場中で、ベンチは見た目より薄い。」を「欠場中で、選手層は見た目より薄い。」へ、「来季このベンチの景色は…」を「来季この陣容の景色は…」へ変更。練習イベントの「目を引くプレー」を「目を引く動き」へ変更した。
- 記録タブの天頂戦・PPV GRAND FINAL歴代優勝カードは、現役選手に現在OVR、引退者等に `careerRecord.peakOVR`（なければ `peakOVR`、最終的に保持ステータスからのOVR）を表示する。数字は既存の `valueClassOvr()` と Bebas Neue を使用し、名前帯内の横並びにして既存レイアウトを保った。
- 栄冠カードのアッパー画像では、画像成功時にイニシャル要素をHTML出力しない。画像エラー時のみ `data-initial` と `.is-image-missing::before` でイニシャルを描く。天頂戦・PPV・最多連続防衛は同じ `_recordBookUpper()` を通るため、全て同時に修正された。
- 選手詳細ポップアップの能力バーと消耗帯を0〜150目盛りへ統一し、能力120は幅80%になるよう変更した。

### AI消耗の調査と修正

- 実データ確認: `Engine.createInitialState(20260731, true)` のAI団体 `org_s` を `Engine.rival.processSeasonEnd()` で8回処理した。初期は `statPeak` 0/16名、8回後も `statPeak` 0/2名。一方で消耗済みの生駒エリカ（28歳、wear 48）と高津小春（25歳、wear 45）はいずれも `trainCapOrigin` と減少済み `trainCap` を持っていた。
- 原因は (a): `Engine.growth.applyDecay()` はAIにも実行されて天井差を記録するが、`statPeak` を毎週控える `Engine.growth.trackStatPeaks()` は `state.roster`（プレイヤー団体）だけを対象にする。`statDecayView()` が `statPeak` のみを読んでいたため、AI選手の `▼` は常に0だった。消耗量が閾値未満なのではない（cではない）。
- `src/management.js` は変更許可範囲外のため、表示側だけを修正した。AI選手詳細に限り、`trainCapOrigin - trainCap` という実際に保存された天井差を既存と同じ `wearCapDecayRatio` の式で復元して描画する。通常選手・既存セーブにはこの経路を使わないため、履歴を捏造せず、GameStateへの書き込みもない。数値設定・バランスは変更していない。

### 検証

- 新規 `test/feedback-fixes-test.js`: 禁止語の全`src/`走査、歴代優勝OVR（現役・引退者フォールバック）、画像成功時のイニシャル非出力、150目盛り、AIの実天井差復元と通常選手の非捏造を検証。
- 既存 `test/stat-decay-bar-test.js` と `test/wear-ceiling-decay-test.js` を150目盛り・AI限定の実記録復元に合わせて更新し、個別実行で全PASS。
- `npm test`: **149/149 PASS**。
- `rg -P 'ベンチ(?!マーク)|プレー(?!スホルダ|ヤー|ト)' src` は0件。`GROWTH_CONFIG` / `ATTENDANCE_V2_CONFIG` / `RANKING_CONFIG` の設定値変更なし。

## 追い込み練習の熱量可視化（task-38・2026-07-31）

### 実装

- `src/ui-render.js` に表示専用の純粋関数 `getTrainingState(fighter)` を追加。内部の蓄積値を `fresh` / `warm` / `heavy` の3段階へ畳み、未設定は `fresh` とする。GameStateへの書き込みは追加していない。
- ロスター／道場の選手行は、最も重い状態だけに控えめな `😮‍💨` サインを既存バッジ列と同じ小ささで表示する。レンタル行も安全に処理する。
- 今週画面では、追い込みを選べる列に同じサインを先出しし、選択を禁止せずに休ませどきを伝える。
- 選手詳細ポップアップには状態別の一文を置く枠を追加。`src/ui-common.js` の `HEAT_STATE_LINES` が、Opus起案のセリフへ差し替える参照点である。
- ツールチップ全文: 「追い込みを続けると体が重くなり、同じ練習でも身につきにくくなる。休ませると戻る。」
- `src/index.html` に上記サインと詳細枠のCSSを追加。プレイヤー向け表示には内部変数名・数値・倍率を出していない。

### 検証

- 新規 `test/heat-visibility-test.js`: 段階変換（未設定を含む）、出力HTMLの内部名・数値・倍率非表示、レンタル／怪我中／新加入の例外なし、仮テキスト参照点を検証。
- `npm test`: **147/147 PASS**。
- `node test/auto-sim.js 20`: **ALL CLEAR**。引数なしのseedは日時由来なので比較には不適切なため、比較可能な固定seedで `node test/auto-sim.js 20 42` を実施。変更前（`WM_SOURCE_REF=HEAD`）と変更後はいずれも fingerprint **`8ee8bfa0`**、ALL CLEAR。
- `GROWTH_CONFIG` と `Engine.growth.calcGrowth` を含む `src/data.js` / `src/management.js` は差分なし。GameState書き込みも追加なし。

## SE配線棚卸し・載せ替え（task-39・2026-07-31）

音響台帳 `docs/wrestle-manager-audio-role-map.md` を正として、`bgm/production-ogg` のSE 46本と `src/app.js` の実参照を全数照合した。着手時点の既存配線は21本、未配線は25本だった。未配線のうち、再生時点が一意に定まる12本だけを配線し、試合中・汎用イベント・週次結果へ無理に重ねることになる13本は保留とした。

| ファイル | 状態 | 用途 |
|---|---|---|
| wm_se_bta01_v01.ogg | 保留 | 実音カウント。試合iframeの既存Web Audioカウントを比較試聴せず置換しない。 |
| wm_se_bta02_v01.ogg | 保留 | タップ。試合iframe側に限定すべきため、このタスクの変更範囲では配線しない。 |
| wm_se_cr03_v01.ogg | 配線済み | 歓声（crowd / boutOther）。 |
| wm_se_cr05_v01.ogg | 保留 | ブーイング。反則・裏切りの単発発火点を特定できず、汎用失敗音に転用しない。 |
| wm_se_cr06_v01.ogg | 保留 | 驚き（4.80秒）。試合中の一撃には長く、既存tension_hitを置換しない。 |
| wm_se_ev01_v01.ogg | 保留 | 好転。関係イベントの個別結果へ安全に限定できない。 |
| wm_se_ev02_v01.ogg | 保留 | 悪化（5.70秒）。汎用イベント音と重複するため。 |
| wm_se_ev04_v01.ogg | 保留 | 裏切り（6.40秒）。試合中は既存betrayalSE優先、画面イベントにも専用発火点がない。 |
| wm_se_ev05_v01.ogg | 配線済み | 新時代（bignews）。 |
| wm_se_hr01_v01.ogg | 新規配線 | 接続（コーチ雇用・担当割当）。 |
| wm_se_hr02_v01.ogg | 新規配線 | 解除（コーチ解雇・担当解除）。 |
| wm_se_hr04_v01.ogg | 新規配線 | 発見（スカウト候補画面を開く）。 |
| wm_se_hr05_v01.ogg | 配線済み | 提示（offer / confirm）。 |
| wm_se_hr06_v01.ogg | 配線済み | 成立（contract）。 |
| wm_se_hr07_v01.ogg | 新規配線 | 拒否・決裂（引き抜き交渉の不成立）。 |
| wm_se_hr08_v01.ogg | 配線済み | 到着・出発（transfer）。 |
| wm_se_mg01_v01.ogg | 新規配線 | 方針選択（選手の週間方針変更）。 |
| wm_se_mg03_v01.ogg | 配線済み | 収入（coin）。 |
| wm_se_mg04_v01.ogg | 配線済み | 支出（spend）。 |
| wm_se_mg05_v01.ogg | 保留 | 上昇（3.08秒）。既存RS05達成音と重なるため、通常成長用の単発表示が得られるまで使わない。 |
| wm_se_mg06_v01.ogg | 保留 | 低下。数値変動ごとの鳴らしすぎを避け、明確な結果表示まで保留。 |
| wm_se_mg07_v01.ogg | 保留 | 軽度危機。資金警告・期限接近を一意に扱うUI発火点がない。 |
| wm_se_mg08_v01.ogg | 保留 | 回復（4.47秒）。復帰発表専用の演出発火点がない。 |
| wm_se_mg09_v01.ogg | 保留 | 重度危機。重大度を区別したUIエラー発火点がない。 |
| wm_se_rs01_v01.ogg | 配線済み | 通常勝利（boutWin）。 |
| wm_se_rs02_v01.ogg | 配線済み | 敗北（boutLose）。 |
| wm_se_rs04_v01.ogg | 配線済み | 最高栄誉（championship jingle）。 |
| wm_se_rs05_v01.ogg | 配線済み | 達成（fanfare / matchVictoryFanfare）。 |
| wm_se_rs06_v01.ogg | 配線済み | 失敗（defeat）。 |
| wm_se_sh02_v01.ogg | 配線済み | 会場決定（venue）。 |
| wm_se_sh03_v01.ogg | 新規配線 | カード配置（シングル・タッグの選手配置）。 |
| wm_se_sh04_v01.ogg | 新規配線 | カード解除（全消去・タッグ解体）。 |
| wm_se_sh05_v01.ogg | 配線済み | 入替・並替（tick）。 |
| wm_se_sh06_v01.ogg | 新規配線 | 統合（シングル2枠をタッグ化）。 |
| wm_se_sh07_v01.ogg | 新規配線 | 特別条件（タイトル戦ON）。解除は既存取消音。 |
| wm_se_sh08_v01.ogg | 新規配線 | カード完成（おまかせ編成3種）。 |
| wm_se_sh09_v01.ogg | 新規配線 | 興行開始（興行実行時の開始演出）。 |
| wm_se_ui01_v01.ogg | 配線済み | 決定（click / select）。 |
| wm_se_ui02_v01.ogg | 配線済み | 取消（deselect）。 |
| wm_se_ui03_v01.ogg | 新規配線 | 移動（switch：候補枠を開く・切替）。 |
| wm_se_ui04_v01.ogg | 配線済み | 設定切替（save）。 |
| wm_se_ui05_v01.ogg | 配線済み | パネル表示（reveal / event）。 |
| wm_se_ui06_v01.ogg | 配線済み | 通常通知（notify）。 |
| wm_se_ui07_v01.ogg | 配線済み | 軽いエラー（error）。 |
| wm_se_ui08_v01.ogg | 保留 | 重大エラー。現状はUI07の軽い入力エラーしか区別していない。 |
| wm_se_ui09_v01.ogg | 配線済み | 紙（paper）。 |

追加した `test/se-wiring-test.js` は、`src/app.js` の全SE参照について、実ファイルの存在、`release/manifest.json` の配布対象、`SE_FILES` のキー重複なしを検証する。

## 成長システム仕様 v2.1 同期（task-34・2026-07-31）

- `GROWTH_CONFIG` と `management.js` を正として、成長リバランス v2.0 の指数ブレーキ、追い込み熱量逓減、AI活動wearを `specs/growth-system-spec-v2.1.md` に同期。`src/` は未変更。

## 記録タブ画面仕様書の起票（task-37・2026-07-31）

- `docs/ui/03-screens/records.md` を新規作成。データベースの「📜 記録」タブ、殿堂／歴代記録セグメント、MQ記録ストリップ、天頂戦・PPV・最多連続防衛、ピークOVR、DB全選手一覧の大会称号バッジを現行実装から仕様化した。
- `src/` は変更していない。CLAUDE.md には画面仕様書の索引テーブルがないため変更していない。

## ランキング仕様 v2.1・画面仕様 v1.1（task-36・2026-07-31）

- `Engine.ranking`、`RANKING_CONFIG`、`renderRanking()` とランキング CSS の実値を基準に、
  計算仕様 v2.1 と画面仕様 v1.1 を更新。Depth を業界水準連動の到達度評価として明文化し、
  02/03 の表示、講評の母集団、画像・文字サイズ、意図的な逸脱を現行実装へ同期した。
- `src/` は変更していない。

## 会場・集客仕様書 v2.1（task-35・2026-07-31）

- `specs/venue-attendance-spec-v2.1.md` を新設し、`ATTENDANCE_V2_CONFIG`、
  `SHOW_DRAW_CONFIG`、`VENUES`、`Engine.attendanceV2` の実装値を基準に、消費枠数
  （シングル1・タッグ2）、不足累進V、フル枠ボーナス、適用順、特別興行の対象外を記録した。
- 会場表は実装値に同期し、ドームを収容22,500・コスト7,000・最大8枠、適正7枠とした。
- 既存v2.0には移行済みの1行のみを追記し、CLAUDE.mdのspecs索引へv2.1を追加した。`src/` は変更していない。

## DB全選手一覧の大会称号バッジ拡張（task-33・2026-07-31）

### 実装

- DB一覧の描画前に、全所属・FA・引退者の careerRecord.history を1回だけ走査する
  _dbBuildTournamentTitleChampions() を追加。ジュニア／秋対抗戦／PPV GRAND FINAL／天頂戦ごとに
  有効な最大シーズンと優勝者IDのSetを作り、同シーズンより前の優勝者IDを置き換える。
  これにより次回大会が確定すると、前回優勝者の大会バッジは必ず消える。
- 名前右のバッジは、王座 → 天頂戦 → PPV → ジュニア → 秋対抗戦 → 春タッグの順で表示。
  各バッジに日本語のtitle属性を付け、.db-title-badges / .db-title-badge の
  white-space: nowrap で長い名前でもバッジ内・バッジ列を折り返さないようにした。
- 王座は既存の_champIds、春タッグは既存のbestTagTeam +
  getActiveBestTagTeam()を引き続き使用。春タッグは毎年の優勝時に単一の
  bestTagTeamを上書きする直近優勝チーム方式であり、歴代表示ではなかったため、
  その判定を変えていない。
- 春タッグの既存桃色は--db-title-springエイリアス化し、他大会と王座は
  --ev-summer / --ev-autumn / --ppv-accent / --ev-winter / --gold の
  既存トークンのみを使用。GameStateへの書き込みは追加していない。

### 検証

- 新規 test/db-title-badges-test.js:
  - 合成GameStateで各大会の直近優勝者のみを集計することと、前シーズン優勝者が
    Setから外れることを検証。
  - 複数称号の規定順、ツールチップ、色トークン、引退者を含む集計、欠損履歴で
    undefined / NaN を出さないことを検証。
- npm test: **145/145 PASS**。
- git diff --check: PASS。

## juniorTournament weekPhase ライフサイクル修正（task-31・2026-07-31）

### 根本原因

- 結論は**仮説B（16人化以前からの既存バグ）**。`git blame` により、
  `weekPhase = 'juniorTournament'` を設定する `App.enterJuniorTournamentFromWeek`
  (app.js:3847、導入は `ab1da86` / 2026-05-12)、ロード復帰の
  `resumeLoadedSpecialPhase` (同:3786)、結果確定を `manage` に戻す
  `finalizeJuniorTournament` (同:15332) は全て43dbcad以前から存在することを確認した。
  復旧UIも ui-render.js:1680-1691 の `9646007` (2026-05-09) から既存。
- 問題は、開催中の正規状態である `juniorTournament` を `showScreen('week')` が
  `renderWeekScreen()` へ渡す一方、同描画関数にそのphaseの正規分岐が無かったこと。
  そのため今週タブ・他タブから戻るだけで汎用の「進行不具合」UIに落ち、旧ボタンが
  phase を `manage` に強制変更していた。
- 43dbcadのジュニア変更は16人選出、`firstRound`、ブラケット表示、履歴記録の拡張であり、
  weekPhaseの設定・解除経路を変更していない。したがって16人化は大量露出の契機にはなり得ても、
  原因ではない。

### 実装

- `Engine.juniorTournament.apply()` を大会結果の原子的コミット境界にした。結果・賞金・
  careerRecordを反映する同じstate更新で `weekPhase: 'manage'` へ遷移し、
  `_juniorTournamentSelection` を削除する。これにより「結果反映済みなのに
  juniorTournament phaseのまま」という状態を新たに保存しない。
- `App.resumeJuniorTournament()` を追加。大会途中に今週タブへ移動しても選出と事前計算済みの
  勝敗を再作成せず、召集／対戦表／試合結果／優勝結果の現在地点を再描画する。観戦iframeだけは
  タブ移動で閉じられるため、安全に対戦表へ戻す。
- `renderWeekScreen()` に `juniorTournament` の正規表示を追加し、復旧UIではなく
  「U-20ジュニアトーナメント進行中」+「大会へ戻る」導線を表示する。
- 汎用復旧ボタンは直接stateを壊さず `App.recoverWeekPhase()` を呼ぶ。ジュニア未確定なら
  大会へ戻し、旧セーブなどで結果が既に反映済みなら結果を保持して `manage` へ完了させる。

### 復旧ボタンの副作用調査

- 修正前は大会途中で `weekPhase='manage'` にするだけだった。選出・結果反映前の
  `_jtPreview` は永続化されないため、そのまま週送りすると大会結果、careerRecord、賞金、
  出場記録を確定しないまま開催週を越えられる二次被害があった。
- 修正後は未確定データを `manage` に偽装しない。反映済みの旧セーブは再計算せず、既存の
  result／careerRecord／賞金を残したまま完了させる。

### 検証

- 新規 `test/junior-weekphase-lifecycle-test.js`:
  - Week23→24の開始phase、進行→確定→manageの遷移列。
  - 4人／8人／16人の全選手について、`champion` / `runnerUp` / `semiFinal` /
    `quarterFinal` / `firstRound` の履歴と賞金を検証。
  - 今週タブの正規再開導線、旧セーブの確定結果保全、汎用復旧ボタンの委譲を検証。
- `npm test`: **144/144 PASS**。
- `node test/auto-sim.js 40`: **ALL CLEAR**、violations 0、errors 0、40年・2120週。
- `git diff --check`: PASS。

## 加入第一声（キャリア判定式）+ スカウト/FA識別バッジ（task-30・2026-07-30）

### 実装

- 承認済み草案 `signing-greeting-draft-v0.1.md` の `SCOUT_GREETING_LINES` /
  `SCOUT_GREETING_GENERIC_LINES` / `FA_GREETING_LINES` /
  `FA_GREETING_GENERIC_LINES` を本文無改変で `data.js` へ追加し、
  `EVENT_LINES_BY_KEY` と Node export に登録した。既存の
  `EVENT_FA_SIGNING_LINES` / `EVENT_FA_WELCOME_LINES` は変更していない。
- `hasCareerHistory(char)` を追加。戦績、`careerRecord.history` の debut 以外の
  所属歴イベント、`careerSeasons >= 1` のいずれかでキャリアありと判定する。
  `getJoinGreeting(char)` はキャリアありを FA、なしを発掘の主プールへ振り分け、
  25%で既存 welcome プールを使う。プール欠損時は各 generic、固定文の順で落とす。
- FA 契約は契約セレモニー前の `getSigningQuote()` を維持し、契約後の welcome
  ポップアップだけを `getJoinGreeting()` へ切り替えた。スカウト獲得も既存の
  ポップアップを加入第一声へ置換し、詳細を「{名前}が加入しました！(スカウト獲得)」へ統一した。
- 出自バッジは `getJoinSourceBadge()` で共通化。社長室の FA 候補カードと契約セレモニー
  ヘッダーに青系 `FA`、ドラフト候補カードに緑系 `発掘` を表示する。色は
  `var(--blue)` / `var(--green)` と `color-mix()` のみで指定し、GameState への書込みは追加していない。

### 検証

- `test/join-greeting-badges-test.js` を追加。草案代表24本+全generic、定数件数、
  レジストリ、17歳/debutのみの発掘候補、release履歴を持つ FA、戦績/careerSeasons、
  25% welcome、プール欠損時フォールバック、既存契約/レンタル経路、バッジ色トークンを検証。
- 作業時に PowerShell `Get-Content -Encoding utf8` で草案を読み、草案の4定数全体と
  `data.js` 定数の完全一致を別途照合した。
- `node test/join-greeting-badges-test.js` PASS、`git diff --check` PASS。
- `npm test`: **140/141 PASS**。失敗は今回未変更の
  `ranking-depth-redesign-test.js` で、`src/index.html` に既存テストが要求する
  `width: 108px;` と次行 `height: 162px;` のCSS断片がないため。許可対象外の
  `src/index.html` は変更していない。

### 補足

- スカウト獲得は1名ごとに既存 `showEventPopup()` へ投入する。既存のイベントポップアップ
  キューが順番に消化するため、同週に複数名を獲得した場合も各人の加入第一声を順次表示する。
- 草案のSCOUT本文は実データで58本（FA本文57本）であることを確認した。

## ランキング画面 v1.3: ベースライン寸法・実データ講評文（task-29・2026-07-30）

### 実装

- `renderRanking()` のエース文を、王者/防衛数/年齢/看板/OVR差だけで選ぶ個人講評へ置換。
  防衛数・年齢はテンプレートへ実データを差し込み、団体の層・控え・戦列に触れる語りを除外した。
- 主力欄を、看板以外の二番手・三番手の `surname`、実OVR帯、`depthCoreReady`、
  `depthReserveReady`、欠場数、レンタル在籍から二〜三文で生成する形へ置換。
  ロスター不足時は極薄フォールバックを使い、王者/看板不在も `undefined` / `NaN` を出さない。
- 講評のシード基準をシーズン+団体へ固定し、週が変わるだけでは文面が揺れないようにした。
- v1.3正本に合わせ、マスト28px、布陣の2:3梯子（中心132×194 / 首位150×224、脇108×162 /
  首位132×194）、カード最小高400/465、エース画像108×162、主力顔40px、紋章62px、
  評価/指標28px、団体名18px、エース名15px、講評行間1.7へ更新。平均OVR用の
  `ovr-line` は `depth-line` へ置換した。
- `test/ranking-depth-redesign-test.js` を拡張。合成GameStateで防衛数、姓、欠場数、
  王者不在、空ロスター、複数シーズン・全4団体の未展開値なしを検証し、CSSサイズも静的検証した。

### 検証

- `node test/ranking-depth-redesign-test.js` PASS
- `npm test` **140/140 PASS**
- `git diff --check` PASS
- `src/management.js` は未変更。GameStateへの書込みは追加なし。ランキング計算も未変更。

## 集客ボリューム係数 v1.1: 適正を「枠数−1」に再定義（2026-07-30・Keisuke指摘による是正）

v1.0 は2つの誤りがあった。(1)「大会場は7から8」を枠数増加と誤読し
`VENUES[8].maxMatches` を 7→8 に変更してしまった(**7へ復元**)。
(2) 適正試合数を既存の別テーブル(2,2,2,3,3,3,4,4,5,5)のまま使ったが、
Keisuke の意図は「会場の試合枠数(=上限)から導く」だった。

**v1.1 確定**: 適正 = 枠数 − 1(`minMatchesByVenue: [2,2,2,3,3,4,4,5,6,7]`)。
枠数フル(=適正+1、上限)で1段だけ微弱ボーナス(+2〜6%、帯別)。枠数を超える興行は
存在しないため超過段はこの1段のみ。不足の累進テーブル・小会場下限0.5は v1.0 のまま。
上位会場の要求水準が上がった: 大会場は6試合、ドームは7試合が標準(5試合だと40%)。

検証: attendance-volume-factor-test 41件更新PASS、auto-sim 20年 ALL CLEAR、139/139 PASS。

## 成長リバランス v2.0: 収束ブレーキ/熱量逓減/AI活動wear 採用（2026-07-30・本番適用）

task-27 のグリッド計測から採用値を確定し、GROWTH_CONFIG の既定値を切り替えた
（プローブは既定オフでマージ済みだったため、本番適用はこの3値の変更のみ）。

### 採用値（Keisuke承認・業界一律）

- `brakeGamma: 1.3` — 収束ブレーキ (remaining/trainCap)^1.3。上限接近ほど1ptが重い
- `intensiveHeatTable: [1.8, 1.6, 1.4, 1.2, 1.0]` — 追い込み連用で効き逓減
  （通常練習-1/休養-2で回復）。負傷・wearの代償は満額のまま
- `aiMatchWearCoef: 0.05` — AIにも活動由来wear（試合数×0.05、プレイヤーの3〜6割相当）

### 効果（probe-report v0.1 より）

- 追い込み連打のカンスト率(27歳4stat98%+) 92%→22%、エース帯OVR100+ 48%→17%
  （試合成長抜きの保守値。実プレイは20%台=目標帯20〜30%）
- 連打と間欠運用の成長差 +0.5%まで縮小=連打は消耗と負傷だけ余計に払う
- **業界一律のため AI トップ8 平均OVRも 88〜98 → 84〜87 に低下**（40年×2シード）。
  「OVR95超の怪物が希少になる」体感変更を Keisuke が明示承認（2026-07-30）。
  AI引退年齢中央値 25→24〜25
- Keisuke裁定: 放置層の底上げはしない（年齢カーブ乖離は触らない）/ジュニア級の
  伸びは対象外/カンストは「キャリアを注いだ一部だけ」

### 検証

- 切替後 `node test/auto-sim.js 40 7919` の fingerprint = `58415a0e` が
  プローブ注入計測と完全一致（=計測どおりの挙動で本番化）
- `npm test` 138/138 PASS。100年×1本の最終確認は下記コミット時点の結果を参照

### 残タスク

- **熱量の可視化**（数値は見せない・道場コメント/顔つきで「体が重い」を仄めかす）
  — セリフは Opus 起案で別タスク。現状は見えない仕様のままなので優先度高
- specs/growth-system-spec-v2.0 への反映（v2.1 として）+ Keisuke 実機確認

## 成長リバランス3レバー・プローブとグリッド計測（task-27・2026-07-30・実装完了）

`GROWTH_CONFIG` に、既定値で現行演算を保つ `brakeGamma: 1.0`、
`intensiveHeatTable: null`、`aiMatchWearCoef: 0` を追加。`brakeGamma===1.0` は
`Math.pow` を呼ばず既存の除算式を通し、heat table が `null` のときは `_heat` を
生成・参照・更新しないゲートにした。AI活動wearは係数が正のときだけ当季試合数由来の
丸め加算を行う。

成長projectionは N / I / I2（2週追い込み→2週通常）、γ 4水準、heat off/A/B の
全36セルを追加測定。auto-simは src と `test/auto-sim.js` を改変せず、メモリ上注入の
新規測定ラッパーで指定6本（各40年）のAI OVR・引退年齢・wear分布を採取した。
詳細は `docs/growth-lever-probe-report-v0.1.md`。

### 検証

- `node test/auto-sim.js 40 7919`: 実装前/後の Semantic fingerprint はともに
  `aa225fc9`。`Total violations: 0`、`ALL CLEAR`。
- `npm test`: **138 / 138 PASS**。
- `git diff --check`: 成功。

## 集客ボリューム係数: 消費枠数を通常興行需要へ反映（task-28・2026-07-30・実装完了）

### 実装

- `Engine.attendanceV2.calcCardSlots(showCard)` を新設。成立したシングルを1枠、成立した
  タッグを2枠として数え、未入力の表示枠は数えない。`calcVolumeFactor` は会場帯ごとの
  Keisuke確定不足表と超過表を使い、適正ちょうどを `V=1.0`、超過枠は会場の
  `maxMatches - 適正` 段まで加算する。
- `calcAttendanceV2` は `rawAttendance = reach × draw` の直後にVを乗算する。従って
  heat・揺らぎ・momentum・soft capより前、かつ `rawDemand` にも同じVが反映される。
  旧 `shortPenalty1/2` と `calcShowDraw` 内の旧ペナルティは撤去した。
- `VENUES[8].maxMatches` を指定どおり 7 から8へ変更。既存の
  `test/challenge-request-card-reservation-test.js` はこの確定値を固定の7ではなく
  `VENUES[8].maxMatches` として検証するよう最小限追随した。
- 呼び出しは `getAttendancePrediction`、`attendanceV2.measureShow`、週次精算フォールバック、
  `Engine.executeShow`、`App._finalizeShowImpl`、`renderShowPrep` の全経路で、成立カードを
  `calcAttendanceV2` に渡すよう更新した。

### 枠数・特別興行の確認

- カード編成UIは `App.addTagSlot()` で空シングル2枠をタッグ1件へ置換し、
  `ui-common.js` の `_preserveTagSlots()` でも `tagWeight = tags.length * 2` としている。
  エンジン側の `calcCardSlots` はこれと同じタッグ=2の数え方である。
- `calcAttendanceV2` の全呼び出しは通常興行のプレビュー・確定・精算フォールバックのみ。
  PPV GRAND FINAL、天頂戦、ジュニア、春タッグ、秋対抗戦は
  `Engine.specialEventFinance` の固定収益・`calcShowRating` 経路であり、集客v2を呼ばない。
  特別興行側は変更していない。

### 検証

- 新規 `test/attendance-volume-factor-test.js`: 41件PASS。
  - 適正ちょうどの動員は旧D系と完全一致: 大ホール4枠 `2731→2731`、
    大会場5枠 `7129→7129`、ドーム5枠 `12029→12029`。
  - 超過は意図した変更として大会場8枠 `V=1.12`、ドーム8枠 `V=1.18`。いずれも
    上限を超えないこと、タッグ2+シングル1が5枠でシングル5と同じVになること、
    会場帯別不足表(k=1〜4)を検証した。
  - orgPop80・大ホール・シングル2試合は `1749人 / 49.97%`。orgPop85・会場6〜9の
    同条件も全て占有率80%未満。公民館1試合は `V=0.85` かつキャパ半分以上を確認した。
- `npm test`: 139 / 139 PASS（既存138件+本タスク新規1件）。
- auto-sim 40年・seed `424242` を `WM_SOURCE_REF=4f07d267e450a93da032fbbb9aa9a42b19f0a376`
  （main）と実装後で比較。両方とも violations/errors/game overs は0、勢い分布は完全一致。

| 指標 | 前 | 後 | 差分 |
| --- | ---: | ---: | ---: |
| 倒産 | 0 | 0 | 0 |
| momentum (n=804) | 平均+0.1380 / 負32・中立3・正769 | 同左 | なし |
| 平均動員（v2計測帯別平均から集計） | 約1,270.7 | 約1,931.7 | +52.0% |
| 平均興行収入 | 1,197.5万 | 1,581.7万 | +32.1% |
| ★分布 | 1/2/3/4/5 = 0.2/2.7/10.6/56.5/30.0% | 0.2/2.7/15.9/60.9/20.1% | ★5 -9.9pt |

通常興行の平均動員・収入には有意な上昇が出た。これはタッグを消費枠どおり評価して
旧shortPenaltyの二重罰を除いた結果であり、確定済みのV数値は変更していない。採否の
判断用として報告する。

## 年間MVPレース: 近年実装大会・MQ歴代記録を反映（2026-07-30・実装完了）

`Engine.mvpRace` の読み取り側だけを拡張し、天頂戦・4団体勝ち残り対抗戦・春のタッグリーグ・
MQ歴代記録更新を年度ポイントへ反映した。各大会の history 記録側と
`Engine.mq.updateRecord` は変更していない。

### 実装

- `POINTS` に承認済みの定数を追加。天頂戦は最終順位から 34 / 19 / 8 / 3 / 0pt、
  4団体勝ち残り対抗戦は個人勝利 +3pt とチーム順位ボーナス、春のタッグリーグは
  優勝 +8pt・準優勝 +4pt とした。
- `calcSeasonPoints` は既存の `ev.season !== season` フィルタを通して新しい history を読み、
  `breakdown.tenchosen` / `autumnWar` / `springTag` と表示用 meta を返す。
- MQ歴代記録は `state.mqRecord` と `state.mqRecordTag` を直接参照し、当年の
  `holderIds` に含まれる選手へ各 +5pt（単複スタック可）を既存 `mq` 内訳へ合算する。
- `_topElements`、ナラティブ、タグライン、4面の既存リッチ・ファクトチップ経路に、
  「天頂戦」「4団体勝ち残り対抗戦」「春のタッグリーグ」「歴代最高の試合評価」の
  プレイヤー向け文言を追加。`src/ui-render.js` は meta から同リッチ表示を描画する既存経路で
  追随するため変更なし。
- 新規 `test/mvp-race-new-events-test.js` を追加。天頂戦の全結果、非開催年、対抗戦、春タッグ、
  MQ記録（敗者側・単複スタック・過去年）、ジュニア不加点、当年引退選手のランキング経路、
  既存合計回帰、表示ラベルを振る舞いで検査した。

### 検証

- 新規テストは実装前に天頂戦優勝の期待値で `0 !== 34` となり失敗することを確認後、実装後に PASS。
- `npm test`: 138 / 138 PASS。
- auto-sim（5シード × 20シーズン）: 全シードで `Total violations: 0 (0 unique)`、
  `Total errors: 0`、`Result: ALL CLEAR ✓`。

## 記録タブ+ピークOVR表示（task-26・2026-07-30・実装完了）

`docs/codex-tasks/task-26-records-tab-and-peak-ovr.md` と確定モックアップ v0.4 に従い、
表示専用で「📜 記録」タブを実装。

### 実装内容

- DBサブタブを「📜 記録」へ改名。更新週は小さな `NEW` バッジを表示し、内部は
  「🏅 殿堂入り」（既存 `_renderDbHallOfFame()` をそのまま呼び出す）と「📜 歴代記録」の
  2セグメントにした。
- 歴代記録は v0.4 の順序で、試合評価のシングル/タッグ最高記録ストリップ、天頂戦の
  大判アッパー列+次回空席、PPV GRAND FINAL の中判横スクロール列、最多連続防衛の王者横帯を追加。
- 走査元は roster / 全AI団体 / freeAgents / retiredFighters を優先し、引退後の解決には
  `G.chronicle.fighterArchive`、さらに殿堂アーカイブをフォールバックとして使用。通常の記録イベントは
  走査元の選手オブジェクトを必ず持つため、名前・ID・画像を解決して表示できる。名前だけ欠損した
  異常データでは `Engine.career.resolveFighterName()` を使い、それも解決できない場合だけ
  「記録保持者」としてカードを残す（「名前不明」表記やカードの欠落はしない）。
- `careerRecord.peakOVR` / `peakOVRSeason` を選手詳細ヘッダー、団体タブの能力行、戦績タブに
  追加・調整。すべて現在OVRがピーク未満のときだけ表示し、戦績タブは王者も対象とした。
- `--ppv-accent` 以外の新規16進カラーは追加せず、記録ブロックは既存トークンのみで構成。

### 検証

- `node --check src/ui-render.js` / `node --check src/ui-common.js`、`git diff --check` 成功。
- 代表的な複数シーズン状態と記録未更新状態を、レンダラの読み取り専用チェックで確認。
  前者では更新バッジ・天頂戦/PPV/最多防衛・次回S12枠、後者では初期値90/94の減光、
  説明文なし、次回S4枠を確認。
- `npm test` は 137/137 PASS。
- ブラウザからのローカルファイル画面確認は環境のURL制限で実行できなかったため、最終実機確認は
  記録タブのセグメント切替、狭幅時の横スクロール、選手詳細遷移、ピークOVRの表示条件を対象に依頼する。

### 不変条件確認

- 本タスクの追加差分について `G` への代入・更新演算子は0行。殿堂レンダラ本体は無改変。
- 新設プレイヤー向け文言に内部変数名は出さず、不在データの説明文も追加していない。
- アッパー/顔画像は `object-position:top` で表示し、左右反転指定を追加していない。

## 記録タブ+ピークOVR+MVPレース拡張: 設計確定・指示書化（2026-07-30・実装はCodexへ委譲）

Keisuke起案3件をセットで設計。(1)歴代記録を殿堂タブ側に見せる (2)ピークOVRを
選手詳細と団体タブへ控えめ表示 (3)年間MVPレースに近年実装大会を反映。

### 確定した設計（Keisuke承認済み）

- **①「📜 記録」タブ**: DBサブタブ「🏅 殿堂」を「📜 記録」に改名し、中を
  セグメント2択（🏅殿堂入り=既存無改変／📜歴代記録=新設）。タブは増やさない。
  歴代記録ページは **v0.4 レイアウト採用**（`docs/ui/mockups/hof-records-and-peak-ovr-v0.4.html`）:
  最上段=MQ記録2種の小型ストリップ（数字記録・見比べ用）、以下は栄冠の展示室
  （天頂戦歴代優勝=アッパー大判132×198+次回空席／PPV歴代優勝=中判96×144紫・横スク／
  最多連続防衛=王者の肖像横帯）。個人ベストMQ TOP5案は廃案。
  v0.1→0.4の経緯: 縦積み→セグメント→額縁ビジュアル→「MQは小さく数字だけ、
  栄冠3種（人に紐づく栄誉）を主役に」（Keisuke）
- **②ピークOVR**: careerRecord.peakOVR/peakOVRSeason は週次更新済みでUIのみ。
  A-1案=選手詳細ヘッダーのOVR真横に text-sub で「ピーク 91 (S8)」＋団体タブ
  ロスター詳細のOVR行にも同トーン。**表示条件は 現在OVR<ピーク のときのみ**。
  戦績タブ既存表示の王者非表示条件は撤廃
- **③MVPレース加点**（数値承認済み・不変条件つき）:
  - 天頂戦=ラウンド勝ち星積み上げ型（R1勝+3/QF+5/SF+8/決勝+12、優勝ボーナス+6/準優勝+3
    →合計 優勝34/準優勝19/B4 8/B8 3）。resultから勝ち星逆算できるためエンジン記録変更不要
  - 秋の勝ち残り対抗戦=個人勝ち星+3/勝が主役、チーム優勝+7/準優勝+3
  - 春タッグ 優勝+8/準優勝+4、MQ歴代記録更新 一度きり+5（敗者側holderにも付く）
  - ジュニアトーナメントは**据え置き**（新人王と役割が被る・Keisuke裁定）
  - 不変条件: 34>PPV優勝30／15<19<30／B8の3≦MQ90ビッグマッチ4／
    対抗戦完全制覇上限25<34／非開催年の寄与0

### 成果物

- `docs/codex-tasks/task-25-mvp-race-new-events.md`（③・management.jsのみ・要検算）
- `docs/codex-tasks/task-26-records-tab-and-peak-ovr.md`（①②・UIのみ・state書込禁止）
- `docs/ui/mockups/hof-records-and-peak-ovr-v0.1〜v0.4.html`（v0.4が正）

### 残タスク（実装後にこちらで）

- task-25/26 の diff レビュー＋不変条件の手元検算（Codexは検算しない前提）
- specs 更新（mvp-race系は plans/mvp-race-and-page4-plan-v2.md 系譜、記録タブは新規spec or
  screen doc）と roadmap 1行、`docs/ui/03-screens/` に記録タブの画面仕様書を1枚

## 見立て評価: 逸材評価の再設計（2026-07-30・実装完了）

Keisuke起案「逸材などの評価の考え方を再調整（ドラフト・初期ドラフト・スカウト）。
初期能力値もその評価に入れる」+「評価にはランダム性があり必ずしも本当ではない方がいい」。

### 走査で分かった前提（3回測り直した）

1. ティア判定は `pot>=minPot OR cur>=minCur` で、若手は実質**潜在値だけ**で決まる。
   高島さや(cur109/pot760)が年次ドラフト級で**15回中15回『逸材』表示**＝設計のネタバレ
2. **超逸材はどこにも出ていなかった**（年次0%・FA開始時0%・初期0%）。
   「FAが超逸材22.6%」という中間報告は私の測定ミス（テンプレ値を生で評価していた。
   本番は makeAIFighter が年齢成熟度を掛ける）。訂正済み
3. ドラフットは3系統ある: **初期ドラフト**(generateDraftConfig・制限は意図)/
   **毎年のドラフト級**(generateScoutReport→dormantPoolの17-18歳)/**スカウト**(同関数)。
   当初これを混同して初期ドラフトばかり測っていた

### 設計（specs/prospect-assessment-spec-v1.0.md が正）

```
見立て = 今の実力 + 伸びしろ × 実現見込み(年齢) × (1+ブレ)
```

実現見込み: 18歳以下85%→27歳超15%。ブレ: 18歳以下±20%→25歳超±5%、
**伸びしろ項のみ**・(rngSeed,id)固定でプレイ内一貫。しきい値は本番150シードから採寸
(超逸材=p98で**~2%**「めったに出ないが絶対に出ないわけではない」)。
**FAは対象外**（経済を動かさない。現行式のまま凍結）。

### 実装

- `Engine.scout.calcProspectAssessment` + `PROSPECT_EVAL` 新設（management.js）
- `generateScoutReport`: 候補の査定を見立てで上書き（年次ドラフト・スカウト両方が通る）
- `getCandidateInfo`: 初期ドラフトUIも同式・同rngへ（プール選定時と画面の価格が一致）
- `generateDraftConfig`: **OVR下限40撤廃**（Keisuke裁定）+ 安価保証を「安い順」フォールバック化
  （新価格は120万以下が存在しないシードがあり、絶対額保証が全滅していた）

### 分布（150シード・前→後）

- 年次: 逸材35→27.5%・有望60.6→55.7%・**超逸材0→2.1%**・素材0→3.8%
- FA: 不変（逸材32%帯・経済凍結の確認）
- 初期: 素材0→37%（入場係数で削った実力を正直に見るため。**意図した変化**＝
  旗揚げドラフトは無名の若手を安く拾う場になった）
- 高島さや: 年次で 有望/逸材/原石 とプレイごとに揺れる。初期ドラフトにも4/150回出現

### テスト

`test/prospect-assessment-test.js` 新設（不変条件7項目・分布帯・プレイ内固定・
ブレは伸びしろのみ・FA非汚染の指紋=素材0%）。
`tenchosen-preevent-speaker-test.js` が1件落ちたのは**テスト側の同点処理欠落**
（実装はOVR同点をidで安定ソート、テスト再現は同点処理なしで上位N名を切るため、
rng消費が変わってロスター境界に同点者が現れた seed で誤判定）。同点許容に修正。

npm test 137/137 PASS。auto-sim 20シーズン ALL CLEAR。

### 実機で見てほしいところ

①年次ドラフトの顔ぶれの格が従来の感触か ②たまに『超逸材』が出る年があるか（10年に1人級）
③高島さやの表示がプレイごとに違うか ④初期ドラフトに安い無名の子が並ぶ感じ
（素材表示が増えた）が旗揚げとして良い感触か ⑤初期ドラフトの総費用が下がったぶんの
開幕資金の余り方に違和感がないか

変更: src/management.js / src/data.js / test/prospect-assessment-test.js(新規) /
test/tenchosen-preevent-speaker-test.js / specs/prospect-assessment-spec-v1.0.md(新規) / CLAUDE.md(索引)

## `raw` 経路にも因縁を効かせた（2026-07-30・裁定実装）

Keisuke裁定「**当然因縁を効かせます**」の実装。バグB（天頂戦とPPVのTV放送）を直した時点で
`raw` プロファイルは対象外のまま残していたが、**「大舞台ほど因縁が試合内容に出ない」**という
逆転を解消した。

なお私はこの裁定を同じメッセージの U8 指示と一緒に受け取り、U8 だけ進めて実装を落とし、
以降の報告で「未決」と書き続けていた。**未決ではなく未実装**だった（Keisuke 指摘で判明）。

### 通した経路

`buildRingInOpts(..., { rivalryOnly: true })` を6箇所へ。

| 経路 | profile |
|---|---|
| ジュニアトーナメント | raw |
| 秋4団体勝ち残り対抗戦（`simulateNextBout` / `legacyRun` の2経路） | raw |
| AI vs AI 対抗戦（aiWar） | raw |
| AI vs AI 挑戦状（aiB3Challenge） | raw |
| AI 団体内紛（B2） | raw |

`rivalryOnly` なのでタイトル/trust/プレイヤーのバフは持ち込まない。裁定は「因縁を効かせる」
であって、他のチャネルまで広げるのは別の設計変更になるため。
**春タッグリーグはタッグなので `specs/mq-system-spec-v1.0.md` §4 のスコープどおり対象外。**

これで `Engine.battle.simulateMatch` の**全11経路**がリング内効果を通す。

### 呼び忘れを縛るテストを新設

`test/ringin-coverage-test.js`。`simulateMatch` をスパイして、ジュニアと天頂戦を実際に走らせ、
**全試合の opts に `rivalryRing` があること**を検査する。

これを足した理由は、**呼び忘れは症状が出ない**こと。`match-engine.js` は `ringOpts.rivalryRing` を
読むだけで因縁を自前計算しないので、呼び忘れた経路は静かに因縁ゼロになる。実際 P3b の
リング内化で天頂戦とPPVのTV放送が呼び忘れられ、**6日間気づかれなかった**（バグB）。

修正前のコード（HEAD版の management.js）で実際に落ちることを確認済み
（「第1試合の opts に rivalryRing が無い（buildRingInOpts の呼び忘れ）」）。
因縁のある組で counterPt/escape が乗ること、無い組では null のままであること、
`rivalryOnly` スコープ（titleMatch:false / ovBuff:[0,0] / trustDebuff:[0,0]）も併せて検査する。

`junior-tournament-simulation-test.js` の `deepStrictEqual(options, { recordFrames: true })` が
チャネル追加で落ちたので、`recordFrames === true` と `'rivalryRing' in options` の2点検査へ変更。
opts の完全一致で固定すると今後チャネルが増えるたびに落ちる。

### 計測（同一シード前後比較）

100シーズン seed 12345:

| 指標 | 前 | 後 |
|---|---|---|
| MQ>=45 | 79.03% | 79.30% |
| MQ>=60 | 30.31% | 31.60% |
| MQ>=65 | 14.96% | 16.57% |
| MQ>=70 | 6.25% | 7.44% |
| MQ>=80 | 0.62% | 0.98% |
| ★5 | 15.8% | 25.1% |

★分布が大きく動いたので seed 依存を確認した（40シーズン×2シード追加）。

| seed | ★5 前 → 後 | 差 |
|---|---|---|
| 12345(100季) | 15.8% → 25.1% | **+9.3** |
| 777(40季) | 20.2% → 22.4% | **+2.2** |
| 31337(40季) | 26.3% → 14.4% | **−11.9** |

**符号がバラバラ＝カスケードによるノイズ。** 大会の勝敗が変わると以降のロスター状態
（怪我・人気・王座・成長）が変わり、通常興行の★分布はそれに強く反応する。系統的な変化ではない。
私の変更が直接触るのは「因縁が閾値（min≥45・一方的でない）を満たす大会/対外戦の試合」だけで、
母数が小さいため集計では分離できない。**再較正は不要**と判断した。

意図した効果（因縁のある試合の中身が変わる）は集計ではなく機構とテストで担保している。

npm test 136/136 PASS。auto-sim 20シーズン ALL CLEAR。

### 実機で見てほしいところ

因縁のある2人がジュニア決勝・秋の対抗戦・対抗戦で当たったとき、**試合が粘るか**
（カウンター率と脱出率が上がる＝決まりかけてから返す展開が増える）。
通常興行の因縁戦と同じ手触りになっているのが正解。

変更: src/management.js（6経路）/ test/ringin-coverage-test.js（新規）/
test/junior-tournament-simulation-test.js / specs/mq-system-spec-v1.0.md

## バグE / H / A を Codex から取り込み、Aは差し戻して修正（2026-07-30）

Codex が task-23(E/H) と task-24(A) を別ブランチで完了。レビューして E/H はそのまま採用、
**A は指示と逆のことをしていたので差し戻した。**

### バグE / H — 承認（`codex/bug-eh` → `44058e1`）

**E**: `resolvePoach` が選手の実体を現ロスターから引き直す（`liveFighter`）。承諾分岐と
防衛失敗の強制移籍分岐の両方に入っている。`poach.fee` / `poach.org` はスナップショット側を
維持していて指示どおり。`liveFighter` を取る位置が `applyDepartureTrustImpact` の後・
roster 除去の前で、**順序も正しい**（trust 反映後の姿が移籍先へ渡る）。

**H**: 私は「`memberIds` を手動で filter し、リーダーなら `handleLeaderLoss` に委ねる」と
指示したが、Codex は `Engine.factions.reconcileRoster` を呼ぶ形にしていた。
**こちらのほうが良い** — 既存の正規経路を再利用するので、リーダー引退時の
`handleLeaderLoss` 委譲・複数所属の dedupe まで自動的に守られる。
副作用を確認したところ `handleLeaderLoss` / `_dissolveFaction` はモーダルもニュースも
出さない状態掃除のみで、オフシーズンに呼んでも問題ない。引退処理内に派閥を触る箇所も
無いので二重呼びにもならない。

### バグA — 差し戻し（`codex/bug-a-mq-clamp` → `4ee20af` + 修正 `ee0f397`）

エンジン内部（`match-engine.js` シングル/タッグ）の床除去は正しかったが、
**`finalize` の床まで外されていた**。

指示書は明示していた。

> - エンジン内部の `Math.max(5, ...)` を**シングル・タッグ両方から外す**
> - `finalize` の `Math.max(5, preLowerClampMq)` は**そのまま残す**（唯一の床）
> - 不変条件1: プレイヤーに見える最終MQの下限は5のまま

**「二重クランプの解消」を「床の撤去」と解釈**したため、最終MQが4や負値のまま
プレイヤーに届く状態になっていた。目的は一本化であって撤去ではない。

さらに悪いことに、この誤りを**テスト側で固定**していた。

- `mq-finalize-parity-test.js` の期待値を `5 → 4`、`lowerClampHit: true → false` に書き換え、
  **通常興行で最終MQ 4 を正解**にしてしまっていた
- 新規テスト `mq-lower-clamp-single-source-test.js` は**指示書で禁止したソース文字列照合のみ**で、
  しかも `management.includes('const finalMq = preLowerClampMq;')` を要求して
  **床の撤去を固定**していた

差し戻した3点は commit `ee0f397` 参照。新規テストは振る舞い検査へ全面書き換えし、
①床が finalize にあること ②凡戦の水増しが消えたこと（`max(5, 生+crowd)` であって
`max(5, 5+crowd)` でないこと）③raw/ppv/ai-show は crowd 0 で床だけが効くこと
④良い試合は不変 ⑤エンジンは床を持たないこと を検証する。

`tag-match-test.js` の range を `<5 → <0` に緩めた変更はエンジン側の検査なので妥当と
判断し、そのまま採用した。

### Codex 報告に無かった計測を実施

task-24 は「WM_SOURCE_REF による同一シード前後比較 100シーズン×1本」を必須にしていたが、
報告は「クイックテスト」のみだった。バランスに触る変更なので自分で回した。

| 指標 | 修正前(cb938ec) | 修正後 |
|---|---|---|
| MQ>=45 | 79.03% | 79.03% |
| MQ>=60 | 30.31% | 30.31% |
| MQ>=65 | 14.96% | 14.96% |
| MQ>=70 | 6.25% | 6.25% |
| MQ>=80 | 0.62% | 0.62% |
| ★分布 | ★3=17.4/★4=65.3/★5=15.8 | 同一 |

**小数まで完全一致。再較正不要。** 効くのは生スコアが5未満の試合だけで、
auto-sim の母集団にはほぼ存在しない（＝水増しが起きていたのは稀なケースだった）。
violations 0 / errors 0 / ALL CLEAR。

npm test 135/135 PASS（テスト2本増）。

### 学び

**Codex は不変条件を自分で検算しない。** 指示書に「そのまま残す」「不変条件」と明記しても、
主目的（二重クランプの解消）を最短で満たす方向に寄る。数値・不変条件が絡むタスクは
**マージ前に指示書の不変条件を1つずつ自分で確認する**工程が必須。
今回は不変条件1（下限5）と不変条件2（raw/ppv 不変）を突き合わせて発見できた。

変更: src/management.js / src/match-engine.js / test/mq-lower-clamp-single-source-test.js(全面) /
test/mq-finalize-parity-test.js / test/tag-match-test.js / test/poach-live-fighter-test.js(新規) /
test/retire-faction-cleanup-test.js(新規)

## U8: `stamp` の呼び分けを整理した（2026-07-30・U1〜U8 完了）

UI統一の最後に残っていた宿題。`Audio.play('stamp')` が**11箇所で意味の違う場面に共用**されていた。
レジストリのコメント自身がそれを認めていた。

> stamp **呼び出し元がばらばら**(セーブ名変更 / 契約成立 / 団体名決定)。
> 1つの音で全部を賄えないので、先に呼び分けを整理する必要がある

### 台帳に答えがあった

`docs/wrestle-manager-audio-role-map.md` に契約用の音が2本、**未採用のまま**あった。

- **WM-SE-HR06「成立」** — 契約、更新、雇用、スポンサー成立
- **WM-SE-HR05「提示」** — 契約送信、入札、移籍回答

つまり `stamp` が肩代わりしていたものの本体は最初から用意されていて、配線されていなかっただけ。
契約の**入口(提示)**と**成立**を別の音に割るのが台帳の設計だった。

### 長さの実測で判断が変わった

ffprobe で測ると HR06 は **5.10秒**。「決着・区切り(2.6〜8.6秒・重ねない)」の帯なので、
リストから契約するたびに5秒鳴るのは重いと判断し、いったん短い音への迂回を検討した。

ここで Keisuke から「**HR06は実際には2.6秒ぐらいで終わっている。後半は無音**」との指摘。
実効長が `defeat`(2.68s) と同じ帯なので、**台帳どおり契約成立に当てられる**ことが確定した。
迂回案は破棄。ファイルは触らず、実効長をレジストリのコメントに残した。

`confirm`(モーダルの確定)を HR05 にしたのも Keisuke の聴感による指定
（「あのカチッとしたクリック音みたいな音だから」）。実測 0.26秒で操作音の帯に収まる。

### 11箇所の割り振り

| 場面 | 新キー | 音源 |
|---|---|---|
| 入団セレモニー / FA契約成立 / ロスター超過契約 / 加入確定（4件） | **`contract`** 新設 | HR06 成立・実効2.6s・solo |
| 交渉開始の確定（4週間の交渉に入る） | **`offer`** 新設 | HR05 提示 0.26s |
| 契約結果画面の OK | **`confirm`** 新設 | HR05 提示 0.26s |
| セーブ名変更 / 団体名変更（2件） | `save` 既存 | UI04 設定切替 0.25s |
| PPVエントリー確定 | `select` 既存 | UI01 決定 0.49s |
| 逸材特別交渉枠の獲得 | — | `stamp` を撤去し **fanfare 単発**に |
| **社長室の決裁書** | **`stamp` のまま** | 合成音 |

**`stamp` が残るのは決裁書だけ**にした。0.6秒の朱印アニメと同時に鳴らす短いバーストで、
`award` を合成音で残したのと同じ理由。むしろ「朱印」の名にふさわしいのはここだけで、
他が借用していたのが混在の原因だった。

`click`/`select` が同じ UI01 を共有しているのと同じ流儀で、`offer`/`confirm` は同じ HR05 を指す。

### テストに捕まった不変条件

`se-file-playback-test.js` の「7. 表に載せたキーには合成音の保険もある」で落ちた。
**音源が読めない環境（配布ミス等）で無音にならないこと**を守るテストで、
SE_FILES に載せた全キーに同名の合成音メソッドが要る。`contract`/`offer`/`confirm` の
3つを追加して解消（contract は朱印+上向きの和音、offer/confirm は短いカチッ）。

`_SE_SOLO` にも `contract` を追加（実効2.6秒は重ねると濁る帯）。
`SE_MIX` は contract:.30 / offer:.15 / confirm:.15。

npm test 132/132 PASS。台帳の HR05/HR06 を「採用(2026-07-30 U8)」へ更新。

### 実機で聴いてほしいところ

①FA選手と契約したときの成立音（HR06・2.6秒。長すぎないか）②入団セレモニーで同じ音が映えるか
③交渉開始の確定（HR05・カチッ）④契約結果画面のOK（同じHR05）⑤セーブ名・団体名の変更（UI04）
⑥社長室の決裁書が**従来どおり**朱印音のままか ⑦逸材枠の獲得が fanfare 単発で寂しくないか

**これで UI統一リデザイン U1〜U8 が全項目完了。**

変更: src/app.js（レジストリ3キー+合成音3種+solo+mix、呼び出し5箇所）/ src/ui-common.js（3箇所）/
src/ui-render.js（1箇所）/ docs/wrestle-manager-audio-role-map.md

## 挑戦試合: 自団体が敗れた回も相手の勝ち名乗りを出す（2026-07-30・裁定撤回）

Keisuke「挑戦試合が全部終わった後、勝ったら喜んだり、負けたら悔しがったり、相手から
挑戦してきた場合は相手が勝ち誇ったり、相手を返り討ちにしたらすごい悔しそうなことを
言ったりとか、それを実装してって話だったと思うんだけど、されてないようだな」

### 調べたこと

**機能自体は実装済み**だった。`_challengeRequestOpponentReaction` があり、
`CHALLENGE_REQUEST_OPPONENT_REACTIONS` の `win`（勝ち誇り）プールもラベル
（「挑戦を実らせた代表」「受けて、勝った代表」）も揃っていた。

出ていなかったのは**自団体が負けた回だけ**で、理由がコードに残っていた。

> 勝っても負けても、映すのは「自団体の代表」。この画面は社長への報告であり、
> 自団体が敗れた回で相手が勝ち名乗りを上げる構図にはしない（2026-07-25 Keisuke裁定）

つまり意図的に外されていて、根拠が5日前の裁定として記録されていた。
**過去の判断を黙って上書きしないため確認を取り、A（撤回して出す）の裁定を得た。**

### 実装

`foeReaction` のガードを `playerWon` → `playerWon || playerLost` に変更。
セリフ・ラベルは既存のものがそのまま使える（`outcome = playerWon ? 'lose' :
(playerLost ? 'win' : 'draw')` で既に3分岐していた）。

**併記の並び順のバグも同時に直した。** 「2人出す場合は勝者を左、敗者を右に固定する」
という規則がコメントに書かれていたが、実装は `reaction`（＝常に自団体）を先に描いていた。
敗戦時を出せるようにすると**自団体（敗者）が左に来て規則が破れる**。
並び順を純粋関数 `_challengeRequestReactionOrder(reaction, foeReaction, playerLost)` に
切り出し、敗戦時は相手（勝者）を先に置くようにした。

### テストの陳腐化を3件解消

並び順を検査していた既存アサーションが**ソース文字列の照合**（`ui.includes('const scenes =
renderReactionScene(reaction)')` と `indexOf` の前後比較）だったため、リファクタで落ちた。
`npm run test:stale` が警告している型の負債そのもの。

- `test/challenge-request-result-reaction-test.js` — 字面照合を撤去し、
  `_challengeRequestReactionOrder` の返り値で並び順を検査する形へ。
  併せて**敗戦時に相手が勝ち名乗りを上げること**（fighter/セリフプール/label/defeated）を新規検査
- `test/challenge-result-layout-test.js` — 同じ字面照合を同様に置換。
  この file には `functionSource` ヘルパーが無かったので追加
- `test/u5-winloss-safety-net-test.js` — `showChallengeRequestResultModal` を単体評価する
  `new Function` の注入リストに新ヘルパーを追加（未注入で ReferenceError になっていた）

npm test 132/132 PASS。

### 実機で見てほしいところ

開発者モードの「イベント即時発火 → 挑戦の直訴（他団体→自団体）」で inverse を出し、
**自団体が負ける回**を引く。①相手（勝者）が左・自団体（敗者）が右に並ぶか、
②相手のセリフが勝ち誇りになっているか、③ラベルが「挑戦を実らせた代表」か、
④敗者のポートレートだけグレースケールになっているか。

変更: src/ui-common.js / test/challenge-request-result-reaction-test.js /
test/challenge-result-layout-test.js / test/u5-winloss-safety-net-test.js

## バグB: 天頂戦とPPVのTV放送で因縁が試合内容に効いていなかった（2026-07-30）

全体バグ監査で「天頂戦が`buildRingInOpts`未呼出」と記録されていた項目（バグB）を調査・修復した。
**MQ再設計P3b(9cb70da, 2026-07-24)が持ち込んだ回帰**だった。

### 何が起きていたか

`match-engine.js:310`は`ringOpts.rivalryRing`を読むだけで、因縁を自前計算しない。
つまり**`buildRingInOpts`を呼ばない経路では因縁のリング内効果が完全にゼロ**になる。
呼んでいたのは`simulateMatch`の約10箇所のうち2箇所（プレイヤー通常興行とAI団体興行）だけだった。

回帰かスコープ漏れかは、旧実装(`9cb70da^`)の`finalize`のプロファイル別ルールで切り分けた。

| profile | 旧v2.0の外部加算 | P3b後 | 判定 |
|---|---|---|---|
| `normal-single` | 因縁/タイトル/crowd/バフ/ラストラン/trust | リング内で全部あり | 正常 |
| `normal-tag` | crowd/ラストラン | 同(タッグはスコープ外) | 正常 |
| `ai-show` | **因縁** | リング内であり | 正常 |
| **`ppv`** | **因縁** | **なし** | **回帰** |
| `raw` | （分岐なし＝ゼロ） | なし | 元からスコープ外 |

`ppv`プロファイル＝**PPV GRAND FINALと天頂戦**。ここだけが回帰で、
`raw`（ジュニア/春タッグ/秋勝ち残り/対抗戦/挑戦状/B2）は旧実装でも外部加算ゼロなので
仕様どおりだった。当初「特別興行のほぼ全部が抜けている」と見立てたが、
旧コードのプロファイル別ルールを読んで範囲が2経路に確定した。

実際に効果が落ちていたのは：
- **天頂戦の全15試合**（`ppvTournament.run`）
- **PPVのTV放送**（`ppv.applyPPVResults`のheadless経路。観戦/スキップ経路は
  `App._ppvRingInOpts`が渡していたので生きていた）

### 直し方

`buildRingInOpts`に`options.rivalryOnly`を新設し、因縁チャネルだけを返してタイトル/trust/バフは
中立値にする。旧v2.0の`ppv`スコープ（因縁のみ）に正確に一致させるためで、
`state.milestoneBuffs`はプレイヤーのバフなので**他団体どうしの試合へ漏らさない**役割も兼ねる。
trust/タイトルまで一緒に効かせるのは旧スコープを超える**設計変更**なので、ここではやらない。

### 検証

**回帰テスト`test/tenchosen-rivalry-ringin-test.js`を新設**。`simulateMatch`をスパイして
実際に渡る`opts`を捕まえる振る舞い検査（ソース文字列照合はしない）。15試合すべてが
`rivalryRing`チャネルを受け取ること、因縁を張った組では`counterPt>0 / escape>0`が乗ること、
因縁の無い組では`null`のままであること、`rivalryOnly`スコープ（`titleMatch:false`・
`ovBuff:[0,0]`・`trustDebuff:[0,0]`）が守られていることを確認する。
修正前は`opts`が`{recordFrames:true}`だったので`'rivalryRing' in opts`が偽になり、確実に落ちる。

**バランス影響は測定不能＝ノイズの範囲**。`WM_SOURCE_REF`で同一シード同一条件の前後比較を3本：

| seed | 修正前 天頂戦MQ | 修正後 | 差 |
|---|---|---|---|
| 777 | 69.173 | 68.133 | −1.04 |
| 4242 | 66.813 | 67.973 | +1.16 |
| 31337 | 70.480 | 70.520 | +0.04 |

符号がバラバラで平均+0.05。n=75/シードでは検出できない（仕様書自身のリング内較正は
120,000試合規模）。効果が乗るのは因縁が閾値（min≥45・一方的でない）を満たす組だけなので、
大会全体の平均はほとんど動かない。**数値の再較正は不要**と判断した。

npm test 132/132 PASS。auto-sim 20シーズン×3シード ALL CLEAR。

### 残した判断

`raw`プロファイル（ジュニア/春タッグ/秋勝ち残り/対抗戦/挑戦状）に因縁・trust・タイトルを
効かせるかは**設計判断として未決**。旧実装でもゼロだったので回帰ではないが、
「大舞台ほど因縁が試合内容に出ない」状態が続いていることは事実。仕様書に明記した。

変更: src/management.js（`rivalryOnly`新設 + 天頂戦 + PPV TV経路）/
test/tenchosen-rivalry-ringin-test.js（新規）/ specs/mq-system-spec-v1.0.md

## 年末表彰の項目を整理した（2026-07-30）

Keisuke「年末表彰の項目を検討。今あるものの掘り起こしと、特別興行などから考える」から始まり、
棚卸しの結果を受けて4点を確定・実装した。

### 棚卸しで分かったこと

現行11スライドのうち**純粋な「賞」は4つだけ**（メディア功労賞・新人王・ベストマッチ・MVP）で、
残りは大会結果と状態の再掲だった。四半期末の特別興行は4つあるのに、
**Q3末（Week36）の秋の4団体勝ち残り対抗戦だけが表彰式に一切出ていなかった**。
Q1（春タッグ）・Q2（JT）・Q4（PPV/天頂戦）は全部出ているのにQ3だけ空席という穴。

さらに Keisuke 指摘の「JT優勝と新人王はほぼ同じ」を実装で確認したところ、
**JT** は年齢20歳以下・全団体からOVR上位8名（`Engine.juniorTournament.select`）、
**新人王** は在籍1年目からOVR最高を機械的に選ぶだけ（試合結果を一切見ていない）。
軸は年齢 vs 在籍年数で別だが母集団がほぼ重なり、しかも新人王は無条件のOVR1位なので
JT優勝者と一致しやすい。**旧スライド順では 新人王(2枚目) → JT優勝(3枚目) で隣接**しており、
同じ顔が2連続で出る状態だった。

### 確定した方針（Keisuke 裁定）

1. **新人王＝ジュニアトーナメント優勝者**に統合。OVRだけで選ぶ旧方式は廃止
2. **春のタッグリーグ優勝＝タッグ王者**。独立賞は作らず優勝スライドが称号を兼ねる
3. **秋の4団体勝ち残り対抗戦の優勝団体**を新規追加。個人賞（勝ち抜き賞）は**作らない**
4. **今年の大会 / 個人表彰の2部構成**にする。仕切りスライドは挟まない（枚数を増やさない）
5. 新人賞の実績ポイント加点は**廃止**（JT優勝 8pt に一本化）
6. 天頂戦覇者とPPV最終戦勝者は**既に排他**（`management.js` の Week48 早期 return を確認）。変更不要

### 実装

**① メディア「厚労」賞の誤字修正**: プレイヤーに見える2箇所（`management.js` の
`Engine.achievement.add` ラベル、`ui-render.js` の実績ツールチップ空状態）と
`data.js`・`specs/org-ranking-spec-v2.0.md` のコメント/表。worklog は過去記録なので不変。

**② 秋の対抗戦 優勝団体スライド**: `Engine.awards.generate` に `autumnWarChampion` を追加。
データ源は **careerRecord の `autumnWar` 履歴**（`{result:'champion', season}`）で、
天頂戦・PPV最終戦と同じ導出パターンに揃えた。`state.autumnWar` を読まないので
ロード後も欠けず、中止年は出場履歴自体が付かないため自然に該当なしとなる。
UIは `_buildSeasonEventChampionAward` に `autumnWar` バリアント（🍁）を追加。
3名並ぶため gap 28px→14px・名前17px・`flex-wrap` を条件付きで適用。

**③ 新人王のJT統合**: `Engine.awards.selectRookie`（OVR方式・約40行）を削除し、
`rookieOfYear: jtChampion` へ。`jtChampion` に `age` を追加（スライド表示用）。
`rookieOfYear` フィールドを残したので `awardRookie` 履歴・年表・殿堂ポイント・称号・
DBカード表示の**下流はすべて無改修で動く**。UIは `_buildRookieAward` を削除し、
JTスライドに `新人王` タグと年齢を追加。受賞セリフは従来どおり rookie プール（これが正になった）。

**④ 2部構成**: `slideInfo` に `section` を持たせ、`index.html` にヘッダー行
`.aw-header-section` を新設（`:empty{display:none}` で締めの一覧スライドでは非表示）。
順序は 第1部＝開催週順（春タッグ→JT→秋対抗戦→天頂戦/PPV）、
第2部＝メディア功労賞→ベストマッチ→タイトル王者→MVP→殿堂入り と重みを上げる。
新人王が1枚消えて秋対抗戦が1枚入るので**正味 ±0 枚**。

**⑤ 新人賞加点の廃止**: `offWeek1` の `rookie_${season}` add ブロックを削除し、
`ACHIEVEMENT_CONFIG.pt.rookie` も削除。既存セーブの `rookie_${season}` アイテムは
自前の `originalPt` を持つので通常の減衰でそのまま消滅する。

### ついでに直した既存バグ2件

**シーズン総括の二重計上**: `Engine.seasonReview.build` が `rookieOfYear` と `jtChampion` で
`records[]` に**同じ選手を2行**push し、`awardsCount` も2重に数えていた。1件に統合。

**受賞履歴の二重記録**: `app.js` の表彰履歴書き込みで、業界の賞とNPC団体内の賞に
同じ選手が選ばれると `awardMVP`/`awardRookie` が**同一年に2件**入っていた。
団体内MVPは業界MVPと必然的に一致するため、NPC団体所属の選手がMVPを取ると
年表が「MVP 2度受賞」になり殿堂ポイント（`count * 2`）も二重に乗る状態だった。
賞の種類ごとに記録済みIDを覚える `recordAwardOnce` を挟んで解消。

### セリフ1本修正

`AWARD_LINES.rookie` の seductive 系に `'新人賞……っ……一年目、無我夢中だったの……'` があり、
受賞者がU-20の2〜3年目でも起こりうるようになったため「一年目」を外し、
賞の名称も `新人賞`→`新人王` に揃えた（他のセリフはすべて「新人王」表記）。

### 検証

- `node test/auto-sim.js 40 12345` → violations 0 / errors 0 / weeks 2120 / **ALL CLEAR ✓**
- `test/year-end-event-awards-test.js` を改訂（新人王＝JT優勝／`_buildRookieAward` 撤去／
  kind文字列と設定キーの一致／2部構成／新人賞加点の消滅を検査）
- **`test/year-end-awards-generate-test.js` を新規追加**。`Engine.awards.generate` を実際に呼び、
  優勝チーム3名の復元・準優勝と不出場の除外・前シーズン履歴を拾わない・中止年の該当なし・
  新人王＝JT優勝者・JT未開催年は新人王なし の6点を検証

### 実機で見てほしいところ

シーズン末（offWeek1）の年間表彰式を通しで送り、①ヘッダーに「今年の大会 / 個人表彰」が
切り替わって出るか、②秋の対抗戦スライドで3名が横に収まるか（スマホ幅も）、
③JTスライドに「新人王」タグと年齢が出るか、④春タッグスライドに「タッグ王者」タグが出るか、
⑤全受賞者一覧の並びと文言、⑥シーズン総括（ANNUAL RECORD）の記録欄が
「JT優勝・新人王」1行になっているか。

変更: src/management.js / src/app.js / src/ui-common.js / src/ui-render.js / src/index.html /
src/data.js / specs/org-ranking-spec-v2.0.md / test/year-end-event-awards-test.js /
test/year-end-awards-generate-test.js(新規)

## 挑戦試合の結果を横並びにした（2026-07-27）

Keisuke「対抗戦関係で敗北と勝者の横並びになるはずなのに、縦並びになっている」

### 原因

2つの `.crrm-reaction-scene`（敗れた側 / 勝った側）を**ラッパー無しで並べていた**。
それぞれが `margin:8px auto` の独立ブロックになるため縦に積まれ、
対戦の結果なのに**2画面ぶんの高さ**を食っていた。

### 直した内容

`.crrm-reactions` で囲み、`display:flex / justify-content:center / align-items:flex-end`。

**下端揃いにしたのが要点。** 勝者だけ画像が一段大きい（172×258 vs 132×194）ので、
上端で揃えると土台がずれて見える。名前・役割の行で揃うようにした。

狭い画面（600px以下）でも**縦積みには戻さない**。戻すと結局2画面ぶんの高さになるので、
画像と吹き出しを一段小さくして2人を収める。

実機で測って確認:

| カード幅 | 横並び | はみ出し | 2人の幅 |
|---|---|---|---|
| 1200px | ✓ | なし | 223 / 203 |
| 600px | ✓ | なし | 223 / 203 |
| 390px | ✓ | なし | 164 / 149 |

下端も一致（bottom 791 / 791）。

安全網 `test/challenge-result-layout-test.js`（5項目）。`display:block` に戻す破壊で落ちることを確認。

### 補足: 因縁決着4件の追加報告について

Keisuke「この週に因縁決着が4つ連続で出ました」（12年目 冬第7週）

**上限（1興行1件）を入れたのは 16:18 のコミット `6a316b5`。**
お手元は `file:///` で直接開く構成なので、**pull してブラウザを再読み込みするまで
古いコードのまま**になる。報告のスクリーンショットは修正前の可能性が高い。

念のため確認した点:
- `Engine.title.checkResolution` の呼び出しは3箇所のみで、**全部に上限が入っている**
- ポップアップは週をまたいで溜まらない（`App._pendingRivalryResolutions` は毎回代入で置き換え）

再読み込み後も4件続くようなら、別経路が残っていることになるので教えてほしい。

---

## 因縁決着の同期爆発 / 特別興行の週表示ズレ（2026-07-27）

### 1. 因縁決着が1興行に6〜7件（原因確定・修正済み）

Keisuke「冬の第9週に因縁決着が一度に6つか7つぐらい連続して起こった」
→ 追加情報「これは普通の通常興行が終わった後です」

**この一言で再現できた。原因はカードの組み方だった。**

auto-sim はカードを毎回シャッフルするので条件が揃わず、私の最初の計測（60シーズン相当）は
空振りしていた。実プレイのおまかせ編成は **OVR順で同じ組が繰り返し当たる**ため、
決着条件（対戦4回以上 + rivalry 60以上）が**全ペア同時に熟す**。

| 組み方 | 1興行あたりの決着数（60興行） |
|---|---|
| ランダム編成（auto-sim がやっていた） | すべて **0件** |
| **固定ペア（おまかせ編成に近い）** | 58興行が0件、**2興行で6件** ← 再現 |

しかも決着は `matches` を全ペア同時に0へ戻すので、また揃って溜まり**周期的に爆発**する。
コードのバグではなく、**閾値が全ペア一律であることによる同期現象**。

**A) 1興行に出す決着は1件まで。** 溢れた分は決着させず、対戦回数が積み上がったまま
次の興行へ持ち越す。UI（app.js）とエンジン（management.js × 2）の**3経路すべて**に入れた。

**B) 決着に必要な対戦回数にペアごとの個体差（0〜2）を足す。** 同期そのものを崩す。
ペアIDから決まるので同じ組なら常に同じ値。乱数にしないのは、評価のたびに基準が動くと
「あと1回」で足踏みしていた組が突然通ってしまうため。

修正後: **最大1件/興行**、60興行で合計12件に散った（以前は6件が一度に2回）。

### 2. 天頂戦・PPVが「冬の第11週」に見えていた

Keisuke「天頂戦が発火するタイミングが冬の第11週になってる。12週でラストで行うように
しないといけない。それはPPVも同じ」「基本的に、特別興行は季節の12週目に行うはず」

**定数はすべて正しかった。** 春12 / 夏24 / 秋36 / 冬48 = 各季の第12週。ズレていたのは表示だけ。

`App.advanceWeek` は `Engine.advanceWeek` で週を48にした後、特別興行（PPV・天頂戦・
秋4団体・ジュニア）や交渉フェーズへ**そのまま return する**分岐が並んでおり、
そこへ入ると `refreshAll` が回らない。結果、週は48（冬第12週）になっているのに
**ヘッダーだけ前の週（47＝冬第11週）のまま**特別興行の画面が開いていた。

週が進んだ直後に `refreshTopBar()` を呼ぶようにした。実機で確認:

| | 進む前 | 進んだ直後(0ms) |
|---|---|---|
| 修正前 | 冬第11週 | **冬第11週**（そのまま天頂戦へ） |
| 修正後 | 冬第11週 | **冬第12週** |

シーズン末の総括で直したのと**同じ staleness**（描き直しが演出チェーン頼み）だった。

### 3. 天頂戦の前に通常PPVのオープニングが混ざる（再現せず）

Keisuke「転調線が始まる前に、一瞬その、一画面、普通のPPVでのオープニング画面が入っちゃう」

**再現できなかった。** 実機で天頂戦の年の W47→W48 を踏んだところ、呼ばれた順は
`initTenchosenReplay` → `intro:tenchosen` のみで、PPV側（`initPPVShow` /
`intro:ppvGrandFinal`）は一度も呼ばれていない。

エンジン側も、天頂戦の年は Week48 の処理で `weekPhase: 'manage'` を返して**PPV分岐へ
落ちない**作りになっており、週画面のラベルも `tcBlocked` で「👑 天頂戦」に切り替わる
（`isPPV` は週番号だけを見るため、という注記付きで既に手当てされていた）。

2 のヘッダー修正で「冬第11週のまま天頂戦が始まる」という見え方は消えたので、
**それが「PPVのオープニングに見えた」可能性がある**。再発したらスクリーンショットを
いただきたい。

### 4. 検証

- 全テスト **117/117 PASS**
- auto-sim 20シーズン ALL CLEAR

---

## 能力バーの減衰帯を直した / 天頂戦の紙面を厚くした（2026-07-27）

### 1. 減衰帯が trainCap の位置を漏らしていた

Keisuke「トレインキャップの部分から色を入れてるので、隠しているトレインキャップの数値が
諸バレになってしまう。あくまで今まで一番高くまで行った能力値の上限のところから始まる感じで。
もう今の能力値のところまで全部染め上げて、繋がるようにしてほしい」

帯を **[trainCap, trainCapOrigin]** に置いていた。そのため:

- **帯の左端がそのまま trainCap の位置**になり、伏せてある天井の値が読めた
- 現在値と帯のあいだに「現在値→trainCap」の隙間が空き、バーが分断されて見えた

→ 帯を **[現在値, trainCapOrigin]** に変更。現在値の右隣から始まり自己最高の天井で終わる。
色が途切れず繋がり、途中に境目が出ないので天井の位置も割り出せない。

```
変更前  [■■■■■現在値■■■■■]   隙間   [▒▒失われた天井▒▒]        ← 隙間の左端＝trainCap
変更後  [■■■■■現在値■■■■■][▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒]                ← 境目なし
                              現在値 →→→ 自己最高の天井
```

**▼の数字は従来どおり「失った天井の量（origin − cap）」。** 帯の長さとは別物で、
帯は「どこまで伸ばせたはずか」、数字は「どれだけ失ったか」を見せている。

計算は `statDecayView` 1箇所。団体画面のロスター詳細と選手詳細ポップアップの両方が通る。
実機で5本すべて隙間0を確認。

### 2. 天頂戦の紙面が優勝記事1枠だけだった

Keisuke「天頂戦って結構大イベントだからさ。この1個だけ、1枠しか使ってないのは寂しい。
下枠でセミファイナルとか、その下の方でも全体であった他の名勝負とかも候補にして
リッチな記事に仕上げるっていうのもあり」

4年に一度・全15試合の大会なのに、紙面は優勝記事1本で
**下の業界ニュース欄が「今週は業界動向の特筆事項なし」**になっていた。

→ **準決勝**と**大会ベストバウト**を業界ニュースへ積み、1面の下枠を埋める。

| 記事 | 優先度 | 中身 |
|---|---|---|
| tenchosenResult（既存） | 270 | 一面・優勝 |
| tenchosenBestBout | 205 | 大会最高評価の一戦。**決勝とは限らない** |
| tenchosenSemiFinal | 202 | 準決勝2試合 |

ベストバウトが決勝以外だったときは「決勝より前に、この大会の頂は一度現れていた。」と
締めを変える。

**回り道の記録**: 最初はジュニアトーナメントと同じ `result.pages`（特集面）方式で作ったが、
📰新聞画面は**新しい4面構成のレンダラで `wp.pages` を描いていなかった**（page方式を描くのは
旧DBタブ側のレンダラ）。実機で確認して気づき、ご要望どおり「下枠」＝業界ニュース欄
（`subStories`）に載る形へ作り直した。**生成されるのに表示されないデータを残さない。**

### 3. 検証

- 全テスト **117/117 PASS**（`test/stat-decay-bar-test.js` 新設・6項目）
- 帯の起点を trainCap に戻す破壊で落ちることを確認
- auto-sim 20シーズン ALL CLEAR
- `test/wear-ceiling-decay-test.js` の項目7を字面照合から**実際に呼ぶ**検査へ変更
  （式の形を変えたら落ちたが、意図（0のとき帯を描かない）は保たれている）

---

## 天頂戦の前触れを1人に / 契約交渉から選手詳細へ（2026-07-27）

### 1. 天頂戦の開催前ミニイベント（Week42）

Keisuke「毎回同じ3人が出てきてる感じがする。もう1人だけでいいし、それがある程度
ランダムに出るんでもいいし、発火条件によってセリフが変わるっていうのは嬉しいけど」

**原因は選び方だった。** OVR 上位3人を `slice(0, 3)` で固定して並べていた。
ランダムなのはセリフだけで、**誰が喋るかは毎回同じ**。

なお**セリフの条件分岐は既に入っている**（`veteran` = 31歳以上 / `notPriorEntrant` =
前回の天頂戦に出ていない）。話し手が動かないので、その違いも見えにくくなっていた。

→ **語り手をひとりにして、毎回ランダムに選ぶ**ようにした。

選ぶ範囲は「出場を狙える圏内」（OVR順の上半分・最低3人・最大8人）。全員から等確率に
しないのは、セリフが「あの狭き門をくぐれるか」という出場を意識した内容で、
圏外の選手が言うと言葉が浮くため。

実測（20回ぶん）: **8人の異なる語り手**に散り、最多でも5回（25%）。以前は毎回同じ3人。

UI は3列固定グリッドだったので、1人のとき左に寄る。中央寄せの並びに変えた（人数が増えても崩れない）。

### 2. 契約交渉画面から選手詳細を開けるようにした

Keisuke「契約交渉画面でキャラクターのアイコンか名前をクリックしたら、選手詳細情報が
見れるようにしてほしい」

交渉相手の成績・能力を確かめないまま判断することになっていた。
**サマリー画面の顔一覧**と**交渉中の話し手**の両方で、顔と名前から開ける。
既存の `portraitImg(..., clickable)` と `showFighterPopup` を流用（新規UIなし）。

**ついでに1つ塞いだ**: 選手詳細の「🔗 相関図」ボタンは画面遷移を伴うが、
交渉中・解雇面談中は `showScreen` がブロックされるため**押しても何も起きない**状態だった。
その間はボタン自体を出さないようにした。

### 3. 因縁決着が一度に6〜7件（再現せず）

Keisuke「冬の第9週に因縁決着が一度に6つか7つぐらい連続して起こった」

判定は `Engine.title.checkResolution` の1経路のみで、興行の試合ごとに評価される。
成立条件は minRivalry≥60 / 対戦回数4回以上（他団体戦は3回）/ MQ が閾値（30〜50）以上。

**実測したが再現しなかった。**

| ロスター規模 | 1週1件 | 1週2件 | 4件以上 |
|---|---|---|---|
| 通常(平均7.5人) 30シーズン | 68週 | 6週 | **0週** |
| 拡充(14人超) 30シーズン | 65週 | 2週 | **0週** |

計60シーズン相当で**1週あたり最大2件**。6〜7件はこの経路からは出ないはず。

考えられるのは (a) 別系統の決着（派閥抗争 `Engine.factions.checkRivalryResolution` の
F02決着など）を因縁決着と見ている、(b) 溜まっていたポップアップがその週にまとめて
流れた、のどちらか。**画面の文言かスクリーンショットが要る。**

### 4. 検証

- 全テスト **116/116 PASS**（`test/tenchosen-preevent-speaker-test.js` 新設・4項目）
- 語り手を上位固定に戻す破壊で落ちることを確認
- auto-sim 20シーズン ALL CLEAR
- 実機で「語り手1人・中央寄せ」「顔と名前から詳細が開く」「交渉中は相関図ボタンが出ない」を確認

`test/u7-roster-list-safety-net-test.js` の除外リストを更新（clickable 引数追加で
呼び出し文字列が変わったため。どちらも一覧ではなく単独表示なので除外である点は変わらない）。

---

## ミキサーの音量を取りこぼしなく反映した（2026-07-27）

Keisuke「一応、WM Audio Mixer v4で全部音量は調整して、俺は正しいと思った音量を出したはずだよ」

### 見落としていたもの

書き出しの「まだゲームに割り当てていない音（参考）」欄に並んでいた曲の**多くが、
実際にはゲームで使われていた**。参考欄だからと見送っていたため、これらは音源セット導入時の
仮値 **0.15 のまま**残っていた。全ファイルを走査して初めて分かった。

| 見落としていた枠 | 本数 |
|---|---|
| `STAGE_BGM`（ビッグマッチ/因縁戦/春夏秋冬の特別興行/天頂戦） | 12 |
| 引退BGM(WM-D03) / エンディング(WM-H04) / 表彰式(WM-H05) | 3 |
| 最高栄誉ジングル(RS04) | 1 |

### 反映した値

すべてミキサーの実聴値。

| | 値 |
|---|---|
| ビッグマッチ / 因縁戦 | 0.33 / 0.30 |
| 春A・春B / 夏A・夏B | 0.28 / 0.28 |
| 秋A・秋B | 0.22 / 0.27 |
| 冬A・冬B / 天頂戦 | 0.34 / 0.41 |
| 引退 / エンディング / 表彰式 | 0.41 / 0.45 / 0.40 |
| 最高栄誉ジングル | 0.39 |

**台帳に無い「一段低い版」は下げ幅を保った。** PPV TV中継の2枠（`grandFinalProgress` /
`grandFinalMain`）と、TV中継画面の RS04 は演出上わざと低く鳴らしている。台帳にはTV中継用の
値が無いので、元の下げ幅（0.13/0.15 ≒ 0.87倍、0.14/0.29 ≒ 0.48倍）を新しい実聴値に掛けた。
耳で決め直したい場合はその3箇所を直接いじる。

走査後、**production-ogg を鳴らす箇所に仮値は1つも残っていない**（23本すべて実聴値）。

### ミキサーの基準値も直した

`GAME_VOL` は「ゲームの現在値」を持つ基準で、ここがずれるとミキサーを開いた瞬間
ほぼ全部が「編集済み」に見える。実際ずれていた。

- 既存19件を現在値へ更新
- **項目そのものが無かった17件を追加**（＝「未割り当て」扱いだったが実際は使用中のもの）
- 結果: スライダー75本 / GAME_VOL 44件 / **編集済みマーク0件・食い違い0件**

`bgm/audio-mixer.html` は `.gitignore` 済みのローカルツールなのでコミットには含まれない。

### 安全網

`test/audio-mix-applied-test.js`（4項目・QUICK入り）。3通りの故意の破壊を検出することを確認。

守るのは「**仮値(0.13〜0.15)が残っていないこと**」と「参照する音源が実在すること」だけ。
個々の数値は耳で決めるものなので焼き付けない（焼き付けると調整のたびに落ちる）。

### 検証

- 全テスト **115/115 PASS**
- ミキサーをブラウザで開いて確認（コンソールエラーなし）

---

## 契約交渉BGMを差し替えた（2026-07-27）

Keisuke 指定の `Static on the Desk.mp3` を WM-C07 契約交渉に採用。

### 変換

元は 48kHz / stereo / 約187kbps の mp3（アルバムアート付き）。
`bgm/production-ogg/` の他の曲に合わせて **vorbis q6 / 48kHz / stereo** へ変換し、
アートは除去した（`-vn -map_metadata -1`）。

| | 尺 | サイズ |
|---|---|---|
| 元 mp3 | 24.48秒 | 571 KB |
| `wm_bgm_c07_v02.ogg` | 24.48秒 | 455 KB |

旧曲 `wm_bgm_c07_v01.ogg` はファイルだけ残した（参照はゼロ）。

### 反映先

- `src/app.js` の `SUNO_BGM.contract` → `wm_bgm_c07_v02.ogg`（vol 0.16 据え置き）
- `bgm/audio-mixer.html` の台帳に WM-C07 として登録。旧曲は「WM-C07旧（未使用）」として
  聴き比べ用に残した。`GAME_VOL` も v02＝0.16 / v01＝キー無し に更新。見出しの本数を 74→75 に

`release/manifest.json` は `assetDirectories` に `bgm` が入っており**フォルダごと配布される**ため、
更新不要（確認済み）。

### 確認

- ゲームが使うパスで配信できる: `/bgm/production-ogg/wm_bgm_c07_v02.ogg` → 206 / `audio/ogg` / 454,723 bytes
- ブラウザでデコード可: 24.48秒
- ミキサーが参照する75本すべてが実在（総点検）
- 旧 v01 を参照しているコードは 0 箇所
- 全テスト 114/114 PASS

**未確認**: 実際の契約交渉画面で聴いた印象（ループの継ぎ目含む）は Keisuke 確認待ち。
ミキサー台帳では「⚠継ぎ目要確認」のままにしてある。

---

## シーズン総括の出す週を直した / 新年号にドラフトを載せた（2026-07-27）

### 1. 総括が表彰式より先に出ていた（三度目の修正）

Keisuke「相変わらずシーズンレポートの前に年末総括が出て興ざめします」
「年末表彰式の後に総括は出してほしいよ」

**一度目・二度目とも直っていなかった。** 実機で追ったところ、演出の呼ぶ順序は正しく、
問題は**総括を描く週**にあった。原因は2つ。

**(a) `offW <= 1` で offWeek 0 にも描いていた。**
年度末ブリッジのステッパーは レポート→ドラフト→移籍→開幕 と週に名前を付けている。
offWeek 0 は引退・新聞・エンディング・年末表彰式が走りきる週で、総括の居場所ではない。
表彰式が終わった直後の offWeek 0 に総括が出て、しかもボタンは「シーズンレポートへ →」と
**これから見せると言っており**、翌週もう一度同じものが出ていた。

**(b) 伏せ札フラグが逆に事故を起こしていた。**
`App._seasonEndChainActive` は advanceWeek のたびに立ち、演出チェーンが完走したときにしか
下りない。チェーンがどこかで待ちに入ると立ったまま残り、**レポートの週で総括が消える**。
実機で offWeek 1 に到達しても総括が出ない状態を確認した。

→ **週で決め打つ**（`if (offW === 1)`）。フラグは廃止。

**(c) 週送りのあと画面を描き直していなかった。**
描き直しは演出チェーン完走時の refreshAll しか無く、チェーンが待ちに入ると前の週の画面が残った。
実機で **offWeek 1 なのにステッパー「0/4」・ボタン「シーズンレポートへ →」が出たまま**だった。
週送りの締めくくりで無条件に描き直す。

#### 実機確認

| | ステッパー | 総括 | ボタン |
|---|---|---|---|
| OFF0 到着（表彰式中） | 0/4 | 出ない | シーズンレポートへ → |
| OFF0 演出が全部おわった | 0/4 | **出ない** | シーズンレポートへ → |
| OFF1（レポートの週） | **1/4** | **出る** | 次へ → |

**表彰式(OFF0) → 総括(OFF1)** の順になった。

`test/season-end-order-test.js` を 13→14項目に書き直し。4通りの故意の破壊を検出することを確認
（うち1件は最初 窓が広すぎて別の refreshAll を拾い**落ちなかった**ので締め直した）。

### 2. 持ち越しに期限を付けた

昨日入れた「載らなかった記事を翌号へ持ち越す」に**期限が無かった**。
記事には時限性のあるものがある。春のタッグリーグの告知は本文に
「第12週に激突する」と書いてあるので、これが何週も持ち越されて後の号に載ると
**開催済みの大会をこれから開催すると報じてしまう**。

`_carryFromAbsWeek` を刻み、3週で捨てる（`INDUSTRY_CARRY_MAX_AGE`）。

### 3. 新年号にドラフト結果を載せた

Keisuke「新年号に去年末の引退のことばっかり書いてあるのは、やっぱりワンパターンすぎて
つまらなくなっちゃうから」

ドラフト結果は既に `weeklyNewspaper.pages` に付いていたが、**オフシーズン中は新聞が
発行されない**ため W48 の号にぶら下がったままで、本紙には出てこなかった
（画像のヘッダが「S13 W48 — ドラフト結果」なのはそのため）。

`_finalizeDraft` から業界ニュースへも積むようにした。材料は「ドラフト結果」画面と同じ
`draftNewsPage.stories` を使う（2箇所で別々に文章を作ると必ず片方だけ古くなる）。

テンプレート4種を新設。優先度は **自団体の獲得を 165** に置き、引退記事(aiAceRetirement 160)と
一面を争える高さにした——新年号が引退ばかりにならないようにするのが狙いなので。

| type | 優先度 |
|---|---|
| draftPlayerResult（自団体の獲得） | 165 |
| draftAiResult（他団体の獲得） | 100 |
| draftFlowThrough（指名漏れ） | 70 |
| draftEmpty（指名漏れゼロ） | 40 |

実機で材料を通したところ「たこやき軍が3名を指名、新体制へ／富岡加奈子、高島さや、
川野辺菜穂子が加入。どこまで伸びるかは、これからの一年が決める。」が紙面に載った。

### 4. 春のタッグリーグの開催週（再現せず）

Keisuke「タッグリーグが春の第2週に開催されちゃってるよ。春の最終週に開催されるはずなのに」

**調べた範囲ではすべて春の最終週で一致していて、再現できなかった。**

| | 値 | 表示 |
|---|---|---|
| `ANNOUNCE_WEEK` | 10 | 春 第10週 |
| `ENTRY_WEEK` | 11 | 春 第11週（実機で確認） |
| `LEAGUE_WEEK` | 12 | 春 第12週（＝春の最終週） |

カレンダーも `WEEKS_PER_QUARTER: 12` で、W12 の `weekInQuarter` は 12。
記事本文も「第12週に激突する」。

ただし **2 の持ち越しが原因になりえた**（告知記事が枠を外れて後の号へ持ち越されると、
古い告知が後の紙面に出る）。期限を付けたので、この経路は塞がっている。
**どの画面で「春の第2週」と出ていたかを教えてもらう必要がある。**

### 5. 検証

- 全テスト **114/114 PASS**
- auto-sim 20シーズン **ALL CLEAR**
- コンソールエラーなし

---

## 年始の業界ニュースを新聞へ一本化 / 派閥タブの追い修正（2026-07-27）

### 1. 派閥タブが封印中に消えていた（Keisuke 実機報告）

「データベースに派閥結成を認めていません、じゃなくて、派閥タブそのものが消えてます」

タブの出し分けが `factions.length > 0` だけを見ていた。封印すると派閥が0になるので**タブごと消え**、
封印中の説明にも社長室への解除導線にも辿り着けなかった。`factionsSealed` を条件に足した。

安全網に1項目追加（条件を `factions.length` だけに戻すと落ちることを確認）。

### 2. 年始の業界ニュース

Keisuke「小さい枠で業界ニュースみたいな感じで大ニュースが出る。地味すぎるし、周りの枠を押すだけで
何枚あってもスキップされて見落とす可能性がめちゃくちゃ高い」

#### 調べたこと：新聞システムが2つ並存していた

| | 通り道 | 記事は残るか |
|---|---|---|
| 📰新聞タブ | `weeklyNewspaper` / `newspaperArchive` | **残る**（24号ぶん） |
| 年始のあれ | `_newsEvents` → `showNewspaperPanel`（「v1.4w」） | **消える** |

古い方は表示時に `const { _newsEvents: _, ...cleanG } = G` で**記事を state から削除**していた。

実測（S3の年またぎ）で**4本**がこの経路を通り、その4本は**最新号にも24号ぶんの
バックナンバーにも1本も入っていなかった**。見落としたら復元不能だった。

3つの不満はすべて同じ原因:
- **地味** — 新聞画面ができる前の実装。見出しが常に「📰 業界ニュース」で大ニュースと区別が無い
- **周りを押すと全部飛ぶ** — 背景クリックの `_newsClose()` が**パネルごと**閉じる。前/次で送る作りなのに
  何枚目にいても1クリックで全部消える
- **見落とすと終わり** — 上記のとおり

さらに、**新聞はオフシーズン中に発行されない**（`if (!s.offSeason)`）。
最新号が W45 で止まり、年またぎの号が存在しなかった。

#### 直した内容

**(a) 積み先を新聞のキューへ替えた。** `_pushNewsEvent` → `Engine.industryNews.push`。
両者はイベント形状もテンプレート（`NEWS_HEADLINE_TEMPLATES`）も同じなので、積み先を替えるだけで
紙面に載りバックナンバーにも残る。旧セーブの `_newsEvents` は捨てずに新聞側へ移す。

**(b) 載らなかった記事を翌号へ持ち越すようにした。**
掲載枠は一面1+サブ3の**4本しかない**。以前は毎週 `_industryNewsEvents: []` でキューをまるごと
空にしていたので、まとめて積まれる週は溢れた分が黙って消えていた。
`generate` が `unpublishedIndustryEvents` を返し、tickWeek がそれを次週へ渡す。

- 上限12本（古い方から捨てる）。持ち越しが溜まって新しいニュースを押しのけないため
- テンプレートの無い type は持ち越さない（永久にキューへ居座るため）
- 持ち越しリストは `weeklyNewspaper` から外してから保存する。**外さないと
  バックナンバー24号ぶんに同じイベントが複製されてセーブが膨らむ**

**(c) 旧パネルを開く側ごと撤去した。** `showNewspaperPanel` / `newspaperOverlay` の DOM / CSS /
`_POPUP_OVERLAY_IDS` 登録 / Esc ハンドラの分岐。U4 で死んだ枠を消したときと同じ手順。

**(d) シーズン開幕号の知らせ。** 既存の号外フレーム（`mdl-d bignews`）をそのまま使い、
文言だけ `SEASON_OPENING_NEWS_LEAD_LINES` に分けた。**新規UIは作っていない。**

```
📰 年が明けた。休んでいる間の出来事が紙面に並んでいる
   [紙面を読む] [あとで]
```

#### 実機で確認した（音は無効化）

| | 結果 |
|---|---|
| オフ中の記事4本 | `queued=4` のまま**生き残る**（以前はここで消費・破棄されていた） |
| シーズン第1週の号 | 引退2本＋契約満了移籍2本が**一面＋サブに載った** |
| 開幕号ポップアップ | **1回だけ**表示（3回に見えたのは計測側が `_popupQueue` の再投入を数えていたため） |
| 未読バッジ | 新聞を開くと消灯 |
| バックナンバー | 24号ぶんに残る |
| 持ち越しリストのセーブ混入 | `'unpublishedIndustryEvents' in wp === false` |

コンソールエラーなし。

### 3. 安全網

`test/industry-news-to-newspaper-test.js`（9項目）。**6通りの故意の破壊がすべて検出される**ことを確認。

| 壊した内容 | 落ちた項目 |
|---|---|
| キューをまた毎週空にする | 3-d |
| 持ち越しを返さない | 3-a, 3-b, 3-c |
| 掲載済みも持ち越す | 3-a, 3-b |
| `_pushNewsEvent` を旧キューに戻す | 2 |
| 開幕号の分岐を消す | 4 |
| 持ち越しリストを新聞に残す（セーブ肥大） | 3-d |

※最初 4 は「変数があること」しか見ておらず**穴が空いていた**（分岐を消しても落ちなかった）。
早期 return の条件式そのものを見るよう締め直した。

`test/u4-modal-frame-safety-net-test.js` の z-index 階層リストから `.newspaper-overlay` を外した
（撤去した枠なので CSS が無く、載せたままだと落ちる）。撤去の検査は新テストが持つ。

### 4. 検証

- 全テスト **114/114 PASS**
- auto-sim 20シーズン **ALL CLEAR**

---

## 派閥の総合見直し：オフ機能と偏りの構造（2026-07-27）

### 0. 前提が崩れた：auto-sim は派閥を一度も踏んでいなかった

CLAUDE.md には「factions.js を編集すると自動で100シーズンのチェックが走る」とある。
だが **auto-sim の自団体ロスターは平均7.5人までしか育たず、`minRosterSize: 10` に届かない**。

40シーズン回して**派閥イベント0件**。派閥の分岐は一行も実行されていなかった。

計測できるようにするため、auto-sim に opt-in の fixture を足した。

```bash
WM_FACTION_FIXTURE=1 node test/auto-sim.js 30 7919
```

ロスターを14人に積み、末尾に派閥イベントの発生内訳を出す。
※`rosterCap` を超えるのでキャップ超過違反が出る。fixture の副作用なので整合性チェックには使わない。

### 1. 実測（30シーズン / 1590週 / seed 7919）

| イベント | 件数 | /season |
|---|---|---|
| COMMON_1 派閥内対決 | **65** | 2.17 |
| F07 派閥動向 | 35 | 1.17 |
| F01 結成 | 11 | 0.37 |
| F03 リーダー喪失 | 7 | 0.23 |
| F06 和解の兆し | 6 | 0.20 |
| F02 抗争勃発 | 4 | 0.13 |
| COMMON_4 合宿 | 2 | 0.07 |
| **F04 寝返り / F05 亀裂 / F08 ヒートアップ** | **0** | — |
| **COMMON_5 取材 / COMMON_7 合同企画** | **0** | — |

**共通イベント67件中65件（97%）が COMMON_1。**

### 2. 根本原因は発生率ではなく「1種類が枠を食い尽くしている」

コードで確認した2点。

1. **COMMON_1 だけ個別クールダウンが効いていなかった。**
   `FACTION_CONFIG.commonEventIndividualCooldowns.COMMON_1: 16` は定義されているのに
   `checkCommon1Conditions` が読んでいなかった（コード中に「Common-1 個別 CD は無効」と明記）。
   `_isCommonIndividualCooldownActive` を呼んでいたのは COMMON_4 だけ。

2. **共通イベントは派閥ごとに24週の枠を共有する**（`commonEventFactionCooldown: 24`）。
   1シーズン53週なので1派閥あたり年2.2回。COMMON_1 は抽選順の**先頭**にいて CD も無いので、
   その枠を毎回先に取る。実測 2.17/season = 53÷24 がぴったり一致する。

つまり「ネガティブが多い」のではなく **一番ネガティブな1種類が独占していて、
書いてある日常イベントが飢えていた**。発生率を一律に下げても独占構造は残る。

### 3. 訂正：16 のまま配線しても何も変わらない

当初「死に設定を生かす」と提案したが、**16 は枠CD 24 以下なので配線しても枠CDに飲まれて無効**。
効かせるには枠CDより長い値が要る。**48 に変えたうえで配線した。**

> 不変条件: `commonEventIndividualCooldowns.COMMON_1 > commonEventFactionCooldown`
> 崩れると個別CDは完全に無効化される。安全網 1-a が守る。

### 4. 変更後の実測（同条件）

| | 前 | 後 |
|---|---|---|
| COMMON_1 | 65 (2.17/s) | **34 (1.13/s)** |
| COMMON_5 取材 | **0** | **5** ← 初めて出た |
| COMMON_7 合同企画 | **0** | **2** ← 初めて出た |
| 共通イベント中の COMMON_1 比率 | **97%** | **79%** |
| 全イベント中の COMMON_1 比率 | 50% | 33% |

性質別（n=103、標本が小さいので±数ポイントは誤差）:

| | 前 | 後 |
|---|---|---|
| 揉め事系 | 70% | **62%** |
| 中立・観察系 | 19% | **28%** |
| 良い方向 | 11% | **10%** |

**独占は解けたが、「良い方向」の比率は改善していない。**
これは正直に書いておく。F06（和解）以外にまとまった正の出来事が書かれていないため、
枠が空いても入るのは中立系（取材・観察）になる。
**種類を増やす話は依然として必要**で、今回の修正はその前提を整えたにすぎない。

なお F04/F05/F08 が0なのは F02（抗争勃発）が年0.13回しか起きずその下流だから。
揉め事の種類も、カタログが示すより実際は狭い。

### 5. 派閥のオフ機能（社長室 決裁書）

設定トグルではなく**決裁書**にした。社長の権限行使という既存の語彙に乗るため。
仕様は `specs/faction-decree-spec-v1.0.md`。

- `DECISION_DOCS.faction_decree`（人事 / 費用0 / 決裁枠2）、`effect.target: 'faction'` を新設
- 処置は状況で出し分け: 封印中→**解除**のみ / 派閥あり→**解散** or **解散して以後認めない** /
  派閥なし→**以後認めない**のみ
- UIは新規に作らず、ボーナス起案4案と同じ `mdl-a-decision-card` グリッドを流用

**代償の設計 — 封印そのものは無料。払うのは「今ある派閥を潰すとき」だけ。**

派閥を煩わしいと感じる人が、何も起きていないうちに先回りして封じるのを罰しない。
一方、育った派閥を上から畳めば払う。

| 対象 | 変動 |
|---|---|
| 元メンバー | trust −6 / 相互 bond −5〜−10（既存の自然解散と同じ実費） |
| リーダー（追加） | −(2 + 6 × momentum/100)。**勢いに乗っていた派閥ほど深い** |
| ロッカーの空気 | −(2 + 5 × 畳まれた人数/在籍数) |

リーダーへの追撃を固定値にしなかったのは、「潰されたタイミング」に説得力を持たせるため。

**封印の効き方は `state.factionsSealed` 1フラグ**。tickWeek の派閥ブロックを丸ごとスキップする。
派閥を読む箇所は例外なく `factions.length > 0` で守られているので、
`factions` を空にすれば系全体が静止する。個別の分岐を各所に撒く必要はなかった。

進行中の予約（`_pendingF09` など8種）は畳む。残すと派閥が消えた後にモーダルだけ出る。
**`factionTimeline`（履歴）は消さない。起きたことは残す。**

### 6. 実機で確認した経路（音は無効化して実施）

| 経路 | 結果 |
|---|---|
| 派閥あり → 解散して封印 | factions 0 / sealed true / ロッカー 60→56.9 / DP 6→4 |
| 　リーダー 八重樫舞 | trust 50→**32.9**、メンバー 50→41（リーダーが深い） |
| 　セリフ | 「……そう。決めたのなら、それでいいよ」（鷹揚） |
| 派閥なし → 先回りで禁止 | sealed true / **ロッカー据え置き60 / trust 全員据え置き50** |
| 　セリフ | 「……了解。そういう決まりなら、それで」（鷹揚） |
| 封印中 → 解除 | sealed false / セリフ「へえ。急にどうしたんだよ」（不良） |
| データベース派閥タブ | 「派閥の結成を認めていません」＋解除導線 |

コンソールエラーなし。

当事者がいない通達（先回りの禁止・解除）でも**必ず1人を立てる**ようにした。
団体書類の「参加者◯名」レイアウトに流すと合宿や慰労会と同じ見た目になり、
通達が催しのように見えてしまうため。

### 7. 安全網

`test/faction-decree-and-common-cd-test.js`（10項目・QUICK 入り・699ms）

**5通りの故意の破壊がすべて検出されることを確認した。**

| 壊した内容 | 落ちた項目 |
|---|---|
| COMMON_1 CD を 16 に戻す | 1-a, 1-c |
| 個別CDの呼び出しを外す | 1-b |
| リーダーへの追い打ちを消す | 2-d, 2-e |
| 進行中予約の掃除をやめる | 2-c |
| tickWeek の封印ゲートを外す | 3 |

項目3は実物の `tickWeek` を40週回して確認する。
**対照として「封印なしなら派閥の動きが起きる」ことも同時に見る**ので、検査が空振りしない。

### 8. 音量をミキサーの書き出しに差し替えた

Keisuke が `bgm/audio-mixer.html` で実聴して決めた値を `SE_MIX` / `SUNO_BGM` に反映。

これで既存テスト2本が落ちた。**どちらもテスト側が SE_MIX の数値を焼き付けていたため。**

| テスト | 内容 | 対応 |
|---|---|---|
| special-tournament-fanfare | `matchVictoryFanfare:.50` を文字列で固定 | 「枠があること」の検査に緩めた。数値は耳で決めるものなので焼き付けない |
| match-next-label #10 | `boutWin < matchVictoryFanfare` を数値比較 | 検査内容を変更（下記） |

**#10 について**: 元は「1試合ごとの音は大会ファンファーレより控えめ」を数値比較で強制していた。
この比較は両方が合成音で振幅が揃っていた頃には成立したが、U8 で別々の `.ogg` に移った今は
**音源ごとに素の音量が違う**ため、SE_MIX の数字を並べてもどちらが大きく聞こえるかは決まらない。
実際ミキサーの書き出しは boutWin .34 / matchVictoryFanfare .33 で、耳では意図どおりなのに
ここだけが落ちた。大小関係の判断はミキサーに委ね、コード側は「両方が独立した枠を持つこと」だけ見る。

→ **この判断は Keisuke の裁定待ち。** 数値ルールを復活させたい場合は言ってください。

**未処理**: ミキサーの「まだ割り当てていない音（参考）」に、実際には `STAGE_BGM` で
**使われている**曲が12本ある（M03因縁戦 / M04ビッグマッチ / SP01〜SP09 / M05）。
現在すべて仮の `vol: 0.15` のまま。書き出しには 0.22〜0.41 の値がある。
今回は指示のあった `SE_MIX` / `SUNO_BGM` だけに留めた。**適用するか要判断。**

### 9. 検証

- 全テスト **113/113 PASS**
- auto-sim 25シーズン **ALL CLEAR**（fixture なし・通常構成）

---

## 派閥まわりの調査と新聞の再構成（2026-07-27）

### 1. イベント試合の決着音とBGM復帰

Keisuke「派閥内対決の決着後にも試合の音から切り替わらないし、勝敗決着の気持ちいい音もならない」

全数走査したところ、**イベント試合3種すべて**が同じ状態だった（派閥内対決 / B3元同僚初対戦 / B2大型イベント）。

- 決着音のかわりに **`Audio.play('coin')`** — お金の音が鳴っていた
- BGM は `fileBgm.fadeOut` するだけで、**元に戻していなかった**

U8 で入れた「あらゆる試合の試合後に音」は `showEventMatchResultPopup`（共通の入口）に置いたが、**この3つは共通の入口を通っていない**ため届いていなかった。

音の規則を2箇所に書かないよう `playMatchResultSe()` を新設して3箇所から呼び、`restoreBgmForState` でBGMを戻した。

**残**: この3つは結果画面そのものも独自レイアウト。表示の統一は別途。

### 2. 新聞の実測（40シーズン・1920週・記事1779件）

当初「新聞が試合結果で埋まる」と読んだが**間違いだった**。新聞は既に「試合系は最大1件」に絞る仕組みを持っている。

代わりに、もっと大きな穴が見つかった。

| | 内容 |
|---|---|
| ❌ | **自団体の王座移動が一度も載っていなかった**。`playerTitleChange` は優先度180・大ニュース指定まであるのに、**記事を作るコードがどこにも無かった** |
| ❌ | `titleChange` テンプレート（見出し3本）は書かれているだけで積む場所が無かった |
| ❌ | `hatredContagion`（嫌悪の伝染）も同様。ログに流れて消えるだけだった |

一方、「載っていない」と思われた6種（夏ジュニア結果／派閥クーデター／PPVサミット／逸材デビュー／宿命の再会／業界底上げ）は**配線されており、auto-sim が UI を通らないため測れなかっただけ**。憶測で作り直さずに済んだ。

**派閥18種のうち17種は既に新聞へ積まれていた**（未接続は `factionCoup` のみ…と思われたが、これも `factions.js` に配線あり）。

### 3. 優先度の調整

| 種別 | 前 | 後 |
|---|---|---|
| 自団体の一般試合 | 90 | **50** |
| 他団体の一般試合 | 80 | **45** |
| 自団体のタイトル戦 | 120 | 120（据え置き） |
| 派閥内対決 | 58 | **100** |
| 派閥の対決／分裂／継承／解散 | 95/88/87/85 | 108/102/100/98 |
| 派閥の日常系（合宿/合同企画/取材） | 48/50/52 | 60/62/64 |
| 和解／和解の兆し | 84/82 | 86/84（揉め事より上にしない） |
| 嫌悪の伝染 | 50 | 70 |

### 4. 死んでいた記事を繋いだ

**王座移動**: `crownChampion` が記事そのものを組んで返すようにした。呼び出し元は2箇所（エンジンの週次処理／UIの興行実行）あり、呼び出し元ごとに組むと必ず片方を忘れるため。

**嫌悪の伝染**: `relationships.js` の発生地点から `industryNews` へ積む。テンプレートの差し込み名と渡す側を突き合わせ済み。

### 実測（調整後）

- `hatredContagion` 37件 / トップ記事24回 ← **0件から**
- `aiShowHighlight` トップ記事 289→258回 ← 一般試合がトップを取りにくくなった

### 残っている相談事項

- 派閥のオフ機能（解散させる／認めない／作らせない）
- 派閥のネガティブイベントの**発生率**調整（種類が少ないので余計に繰り返して見える）

---

## 消耗は天井ごと削る／失われた伸びしろの可視化（2026-07-27）

Keisuke「WEAR効果でのダメージは trainCap ごと減る能力の減衰という形で残酷に見せたい。下がった分を育成画面の減退分として目立つように見せると衰えが可視化されていい」

### それまで

- 現在値だけが下がり、練習すれば元の天井まで戻せた（消耗戦）
- **衰えがどこにも記録されていなかった**。`growthLog` にも残らず、「今シーズン累計」はプラスしか出さないので、削られた事実が消えていた

### 変更

衰退が **`trainCap`（天井）も削る**。一度落ちた天井は戻らない。

削り幅は現在値と同じにせず**半分**（`GROWTH_CONFIG.wearCapDecayRatio = 0.5`）。`trainCap` は成長速度の分母（`convergenceFactor`）でもあるため、同じ幅で削ると伸びしろがゼロのまま一直線に落ちる。天井は現在値を下回らせない。

元の天井（`trainCapOrigin`）は**初めて衰退したとき**に控える。生成時に持たせないので既存セーブの移行が要らず、**まだ衰えていない選手や既存セーブに衰えの履歴を捏造しない**。

### 見せ方

能力値バーの右端から「失われた伸びしろ」を食い込ませ、**バーの満タンが年々縮んでいく**のを見せる。数字でも `▼6` のように出す。

```
[■■■■■■■■□□▒▒▒]  69  ▼6
 現在値      伸び 失われた天井
```

色は **くすんだ藤色 `--stat-decayed #8a7f9c`**。紫のご指定だったが **MN（メンタル）が既に紫 `#7040a0`** を使っているため、彩度を落として「生きている色」ではなく「抜け殻」に見えるようにした。斜線パターンを重ねて他のバーと見分けをつけている。

出す場所は**団体画面のロスター詳細**と**選手詳細ポップアップ**の両方。今季伸びた選手は「+2」が優先で、伸びていないときだけ「▼6」を出す。

### バランスを実測した（40シーズン・seed 7919）

| | 平均引退年齢 | 中央値 | 30歳以上 |
|---|---|---|---|
| 天井減衰なし | 28.06 | 29 | 33.3% |
| 天井減衰あり | **27.39** | 28 | **16.7%** |

差は **−0.67歳**。仕様書 §4-1 の不変条件（26〜27歳 ±1.5歳）の範囲内。30歳以上の居座りが半減し、狙いどおり「天井が落ちた選手は長く続かない」方向に動いた。auto-sim ALL CLEAR。

n=18 と標本は小さいので、**実機で長く回したときの体感は Keisuke 確認待ち**。削り幅は `wearCapDecayRatio` 一箇所で調整できる。

---

## シーズン末の順序を変更（2026-07-27）

### 変更後

```
引退の【判断】 → 新聞 → エンディング判定 → 年末表彰式 → 引退の【あいさつ】 → シーズンレポート
```

### 調べたこと：引退の確定は表彰式より前でなければならない

Keisuke「表彰式より前に引退の処理をしておかないと、表彰式で問題が発生しないか」→ **発生する**。

殿堂入りの判定は `retiredFighters`（引退が**確定した**選手）だけを見ている。

```js
checkHallOfFame(state) {
  return (state.retiredFighters || [])     // ← ここだけ
    .filter(f => calcHofPoints(f.careerRecord) >= 15) ...
}
```

実測（殿堂入り相当36ポイント／基準15の選手）:

| | 殿堂候補 |
|---|---|
| 引退を確定しないまま判定 | **0人** |
| 引退を確定してから判定 | **1人** |

MVP・新人王は在籍者から選ぶので影響しないが、**殿堂入りだけが丸ごと空になる**。しかも例外は出ず静かに0件になるので気づけない。

さらに `commitRetirements` の中に「9. pendingAwards.hallOfFame 再計算（引退者を含めて）」という工程があり、**引退確定が殿堂リストを作り直す前提**で設計されている（引き留めで引退が取り消された場合もここで反映される）。

### 引退の一枚を2段に割った

「あいさつ」と「引き留めるかの判断」が同じ画面だったので分けた。**枠はどちらも既存の `mdl-b`。新しい画面は作っていない。**

| 段 | 見出し | 中身 | ボタン |
|---|---|---|---|
| 判断（表彰式の前） | 引 退 の 申 し 出 | 顔・年齢・戦績・現役期間・自己最高OVR。**セリフは出さない** | 引退を認める／🤝引き留める |
| あいさつ（表彰式の後） | 旅 　 立 ち | 顔＋セリフ＋型別の地の文＋N年間の軌跡 | 見送る（**引き留めは出さない**） |

あいさつは**実際に引退した人だけ**。引き留めた選手が旅立ちを語ることはない。

### シーズンレポートを最後へ

演出中は `App._seasonEndChainActive` を立ててシーズン総括の描画を伏せ、あいさつが終わったところで下ろして描き直す。

---

## 遠征メンバーの呼び戻し / 音の手当（2026-07-27）

### 1. 遠征メンバーが通常興行に呼び戻されていた

Keisuke 報告:
- 挑戦試合の興行週におすすめ編成すると、遠征選手が戻ってきて**挑戦試合が中止**になる
- 挑戦試合の後に通常興行があると、おすすめで遠征隊も再登場でき**二重出場**できる

実測したところ、**除外セットが空になる場面が2つ**あった。

| ケース | `isEligibleHomeShow` | 除外セット | 結果 |
|---|---|---|---|
| 特別興行週(W12) | false | 空 | 遠征3名がカードに載る → 挑戦試合が中止 |
| PPV週(W48) | false | 空 | 同上 |
| 遠征が終わった後 | true | 空（予約が消える） | 同じ選手が通常興行に二重出場 |

`isEligibleHomeShow` は「**この興行が挑戦試合を開催できるか**」の判定であって、「選手が空いているか」とは別。除外の条件に混ぜていたのが誤り。

**直し方**: 「これから出る（予約）」と「今週すでに出た（事実）」の**両方**を見る。予約は週の種類を問わず除外し、遠征開始時に `_awayChallengeUsedIds { season, week, ids }` を記録して同じ週のあいだ除外する。**週が変われば解ける**。

除外セットの出どころは `_preserveTagSlots` 1本で、おまかせ編成3種すべてが通る。手動の一覧も同じセットを使うので、手で並べても入らない。

### 2. 通常興行で右が勝つと敗北音が鳴っていた

自団体から見た勝敗で判定するようにしたが、**両方とも自団体の場合**を考えていなかった。通常興行はほとんどこれなので、左が勝てば勝利音・右が勝てば敗北音になっていた（Keisuke 報告）。

両方とも自団体なら**どちらが勝っても勝利音**。引き分けだけは勝利音を鳴らさない。

### 3. 反応するボタンとしないボタンが混在していた

「反応のあるボタンと反応のないボタンがあるのは気持ちが悪い」（Keisuke）。興行準備画面を全数走査したところ、**失敗時の `error` だけ鳴って成功時が無音**という手当が各所に残っていた。

| 操作 | 前 | 後 |
|---|---|---|
| 枠を開く／閉じる | 無音 | `switch` / `deselect` |
| 選手を差し替える | 無音 | `switch` |
| タッグ化・解除 | 無音 | `switch` |
| カードを空にする | 無音 | `deselect` |
| 会場を変える | 無音 | `venue`（SH02 会場決定） |
| おまかせ編成3種 | 無音 | `select` |

カキッとした UI04「設定切替」を `switch` として新設した（Keisuke「これは結構いろんなところで対応できる」）。会場決定は台帳に専用の SH02 があったのでそちらを当てた。

また `select` が UI03「移動」だったのを **UI01「決定」**へ。おまかせ／確定／タイトル操作に使われており「移動」は合わない。

---

## U8 音: 効果音を本番音源へ（2026-07-27）

### これまで

用意された効果音**46本のうち、鳴っていたのは1本だけ**だった（最高栄誉ジングル）。しかもそれは `playJingle` の中の一点物のハックで、汎用の仕組みではなかった。残り45本は「あるのに使われていない」状態。

### 土台

`Audio.play(キー)` が本番音源を鳴らせるようにした。設計は3点。

1. **1本ずつ移せる** — `SE_FILES` に載せたキーだけファイル、残りは合成音のまま。一括置換にすると途中で音が消えたとき戻せない
2. **読めなくても止まらない** — 音源が無ければ黙って合成音へ落ちる
3. **長い音は重ねない** — 2.0秒超は前が鳴り終わる前に次が始まると濁る

### 対応は名前ではなく「長さ」で決めた

まず全46本の長さを実測した（ogg のヘッダから直接。ブラウザ実測3本と一致）。0.25秒〜9.77秒と幅があり、**用途との相性は長さで決まる**。

| 帯 | 用途 | 例 |
|---|---|---|
| 0.25〜0.51s | 操作に即返る | click / select / error / notify |
| 1.0〜1.4s | 情報が出る・金が動く | reveal / event / coin |
| 2.6〜8.6s | 決着・区切り | defeat / fanfare / bignews |

`click` は92箇所、`error` は59箇所で鳴る。ここに1秒超を当てると操作が重くなるので、高頻度キーには0.5秒前後だけを当てた。

**載せたキー21**: click UI01 / select UI03 / deselect UI02 / error UI07 / notify UI06 / tick SH05 / save UI04 / paper UI09 / spend MG04 / reveal・event UI05 / coin MG03 / transfer HR08 / defeat RS06 / fanfare・matchVictoryFanfare RS05 / crowd CR03 / bignews EV05 / boutWin RS01 / boutLose RS02 / boutOther CR03

### 意図的に合成音のまま残したキー（消し忘れではない）

| キー | 理由 |
|---|---|
| hover | ホバーのたびにファイルは重い。台帳にも相当する音が無い |
| bell / bellx3 | 台帳にゴングが無い。BTA01「実音カウント」は3カウントで別物 |
| war | 該当なし。EV04「裏切り」EV05「新時代」はどちらも文脈が違う |
| tension_hit | CR06「驚き」4.80s は試合中の一撃には長すぎる |
| award | 0.6秒の朱印アニメに合わせた短いバーストを意図して使っている |
| victory | `Audio.bgm.playJingle('victory')` と紛らわしいので保留 |
| **stamp** | **呼び出し元がばらばら**（セーブ名変更 / 契約成立 / 団体名決定）。1つの音で全部を賄えないので、先に呼び分けを整理する必要がある |

### A-3b: あらゆる試合の試合後に音を付ける

**「勝者が誰であれ勝利音」をやめた。** それまでは自団体が負けても勝利音が鳴り、他団体どうしの試合（ジュニア・天頂戦・PPVでは大半）でも勝利音が鳴っていた。

| 場面 | 音 |
|---|---|
| 自団体の勝ち | RS01「通常勝利」 |
| 自団体の負け・引き分け | RS02「敗北」 |
| 自団体が絡まない試合 | CR03「歓声」（勝ち負けを名乗らない） |

判定は全大会の共通入口 `showEventMatchResultPopup` に置いた。所属が分からない画面は従来どおり決着音にしておく（嘘をつかない側へ倒す）。5大会すべてが所属を渡していることを確認済み（天頂戦は呼び出しの手前で組んでいた）。

### 安全網が音源に追随する

テストが **ogg のヘッダから秒数を読んで**検査する。音源を差し替えたら判定も追随するので、「短い音に替えたのに重ねない扱いが残っている」「高頻度キーに長い音を当てた」のどちらも気づける。

---

## 大会前の全体像 / 天頂戦週の二重興行 / 因縁の判定向き（2026-07-27）

### 1. 大会前に「これから始まる」全体像を見せた（5大会）

Keisuke 選択: トーナメント感の補完 =「大会前に全体像を見せる」。

「始まる前に当日のカードを一枚で見せる」演出（`ppvmc-*`）は PPV に前から入っていた。
**新しく作らず、これを共通化して他の4大会にも回した。**

| 大会 | 見せるもの |
|---|---|
| 夏ジュニア・冬天頂戦 | 1回戦の全カード（＝出場者全員） |
| 冬PPV | 当日の全カード（従来どおり） |
| 秋4団体戦 | 準決勝2つ。団体 vs 団体、顔は大将、下段にメンバー3名 |
| 春タッグ | 第1節。チーム vs チーム、顔は1人目、下段に所属 |

位置は **導入 → [選定] → バス → 開幕カード紹介 → 本編**。
ジュニアは招集あり/なしで経路が割れるので `App._jtOpenBracketWithCardIntro()` に寄せ、フラグで1回に抑えた。

### 2. 天頂戦の後に通常興行がもう一度起きていた

Keisuke 報告:「天頂戦の後に通常興行が必ず発火する。しかもその時だけ題名がPPVになる」。

通常興行を塞ぐ判定が **3大会ぶんしか無く、天頂戦だけ抜けていた**。

```js
const specialEventBlocked = stlBlocked || agwBlocked || jtBlocked;   // ← 天頂戦が無い
```

天頂戦の年の Week48 はエンジンが `weekPhase` を `manage` に戻すので、塞がないと通常の興行週として残る。
題名のほうは別口で、`isPPV(w)` が**週番号しか見ていない**ため Week48 で無条件に true になっていた。

他3大会とまったく同じ形で `_tcIsEventWeek()` を足し、**3箇所すべて**（週の見出し／通常興行のブロック／興行準備タブ）に通した。
シーズンも見る（毎年塞ぐと PPV が消える）。不開催の年は塞がない。

### 3. 因縁セリフが「弱いほうの向き」で判定されていた

Keisuke 報告:「天頂戦で1回戦・2回戦は出たが、それより上が出なかった」。

描画は無罪だった（1回戦〜決勝すべてで出ることを実機確認）。原因は `getRivalryLevel` が**相互の因縁を弱いほうの向きで評価する**こと。

| A→B / B→A | ラベル | 判定値 | セリフ |
|---|---|---|---|
| 80 / 80 | 宿命 | 80 | 出る |
| 80 / 60 | 宿敵 | 60 | 出る |
| **80 / 45** | 因縁 | **45** | **出ない** |
| **80 / 30** | 因縁 | **30** | **出ない** |
| 80 / 10 | 片側因縁 | **80** | 出る |
| 45 / 45 | 因縁 | 45 | 出ない |

**相手が少し因縁を持っているほうが、まったく持っていない場合より出にくい**という逆転が起きていた。

なお報告にあった「35」は**宿怨（BITTER）の固定値**。数値ではなく関係の種類。

裁定: セリフは**強いほうの向き**で出す（誰か一人が本気なら宣戦布告する）。しきい値50は据え置き、**数値評価には触れない**。
修正後は 80/45・80/30 も出るようになり、80/10 との逆転が消えた。49/49 は従来どおり沈黙する。

**宿怨は保留** —「今日こそ決着をつける」は決着済みの関係に合わない。専用セリフを書いてから入れる。

---

## 因縁の宣戦布告を対外戦・特別興行に開通（2026-07-26）

### 資産はあったのに、ほぼどこにも出ていなかった

性格別に数百本ある宣戦布告セリフ（`RIVALRY_CONFRONTATION_LINES` / `_70` / `_90`）は、
**通常興行の自団体どうしの試合でしか出ていなかった**。しかも通常興行ですら:

```js
const cl = G.roster.find(c => c.id === m.left);
const cr = G.roster.find(c => c.id === m.right);
if (cl && cr) { ... }          // ← 両方が自団体のときだけ
```

この条件のため、**対外戦では一度も出たことがなかった**。
特別興行（春/夏/秋/冬）は全部が対外戦なので、年5回の大舞台すべてで因縁が黙っていたことになる。
因縁データ自体は選手IDで引くので他団体でも問題なく引ける。**見せていなかっただけ**。

### 判定を1本に寄せた

| 関数 | 役割 |
|---|---|
| `_rivalryPreMatchLines(l, r)` | 因縁があればセリフ組、無ければ null |
| `_rivalryBubblePairHtml(...)` | それを既存の `jt-bub-pair` の形にする |

基準は通常興行と揃えて **rivalry 50以上**、好敵手・宿怨は対象外（決着済みの関係）。
**大会の格では出し分けない** — 準々決勝の名勝負を取りこぼしたくない（Keisuke 裁定 2026-07-26）。

5画面に条件を散らすと必ずどれかが古い基準で取り残されるので、各画面は「出すかどうか」を判断せず、返ってきたものを置くだけにした。

### 入った場所

| 場面 | 扱い |
|---|---|
| 通常興行の対外戦 | 所属を問わず名前が引ければ出す（挑戦試合・遠征・ゲスト参戦） |
| 夏ジュニア | 既存の吹き出し枠。因縁があれば汎用セリフより優先 |
| 冬天頂戦 | これまでセリフ無し。**因縁のときだけ**口を開く |
| 秋4団体戦 | 抽選を通さず必ず出す（年1回の対抗戦で宿敵が確率で黙るのは不自然） |
| 冬PPV | 吹き出しはPPVのものを使い、セリフの出どころだけ差し替え |

春タッグは対象外。タッグなので通常興行でも宣戦布告しない。

### 見た目は作っていない

`jt-bub-pair` / `jt-bub` はジュニアも秋も既に使っている共通部品。
吹き出しの中身は**話者名とセリフだけ**で、バッジのような飾りは足していない（因縁であることはセリフ自体が言っている）。

### 飾りが盤面を落とせないようにした

追加直後に既存テスト2本が `ReferenceError` で落ちた。セリフは飾りなので、解決に失敗したら黙って `''` を返す。
呼び出し側もヘルパー不在で落ちないようにした。

### 実機で確認した（localhost:3002・音は無効化して実行）

因縁75→出る／30→出ない／95→90段の別セリフ。同じ対戦を2回描いても同じセリフ（`Math.random` ではなくペアと日付から種を作る）。
ジュニアは因縁が汎用セリフを置き換え、天頂戦は因縁のときだけ出る。

---

## 特別興行の導入シーンと会場入り（2026-07-26）

いきなり興行画面へ飛ばさず、**コーチ1人 → 選手1人 → 選定 → バス → 本編**の順で入るようにした。4大会すべて。

### 新しい画面は1つも作っていない

Keisuke「ちゃんとこれは他のイベントを参考にしてますか？いきなり全く新しい形を考え出しちゃダメですよ」
「毎回ゼロから考え出すと、統一感というものがなくなっちゃう」。

| 場面 | 使い回した部品 |
|---|---|
| 1枚目・2枚目 | 直訴のYES直後と同じ `mdl-a` 枠 + `_mdlASubjectStage`（1人がアッパー画像で立ち、頭上に吹き出し） |
| バス移動 | 他団体への遠征で使っている `showTravelScene` そのまま |

**2人並べない**（Keisuke）。選ばれなかった側の扱いが要らなくなる。
どちらの枚もボタン1つで先へ進める（B案＝毎回出すが即スキップ可）。

### 2枚目に誰が出るか

語れる文脈が濃い人から順に **去年この大会に出た選手 → 現王者 → いちばん人気 → 出さない**。
誰も当てはまらなければ2枚目を省く。言うことのない選手に喋らせると、そこだけ薄いセリフになる。
怪我人とレンタルは選ばない。

### コーチも同じ helper を通した

`_mdlASubjectStage` に `portraitUrl` / `name` / `meta` を足し、選手以外も同じ見た目で立たせられるようにした。
コーチ側だけHTMLを手書きすると、選手側を直したときコーチが取り残される。

### 会場名は二重管理しない

バスの行き先は `VENUES[8]`「大会場」。`Engine.specialEventFinance.VENUE_INDEX` と同じ値を data 側に持たせ、名前は `VENUES` から引く。
文字列で書き写すと、興行側だけ変えたときに嘘になる。

### 入った場所

| 大会 | 流れ |
|---|---|
| 秋4団体戦 | 導入 → ルール説明 → 代表選定 → バス → 本編 |
| 春タッグ | 導入 → 編成(週11) … 週12 → バス → リーグ本編 |
| 夏ジュニア | 導入 → 招集(既存) → バス → トーナメント表 |
| 冬天頂戦 | 導入 → バス → トーナメント表 |
| 冬PPV | 導入 → バス → 既存のカード紹介 → 本編（天頂戦の**無い**年） |

春だけ編成と本編が週をまたぐので、バスは週12側に置いた。
導入フラグはシーズン単位（セッション単位だと2年目以降ずっと出なくなる）。

### 実機で確認した（localhost:3002）

コーチ枚 → 選手枚 → onDone が順に走る。吹き出しは画像の**上**、中身は**セリフだけ**（名前・所属は枠の外）。
コーチ・選手ともアッパー画像が読めている。バスは「テスト団体 → 大会場」・顔3つ・2行。

### PPV を忘れていた（同日中に追加）

Week48 は **4年に一度が天頂戦、それ以外の年は PPV GRAND FINAL**。天頂戦だけ入れていたので、
**4年のうち3年は導入が出なかった**（Keisuke 指摘）。PPV も同じ流れに乗せた。

出場者は Week43 に決まっているので選定は挟まらない。`historyType` は `ppvMainEvent`（去年メインに立った選手＝いちばん語れる人）。
バスに乗る顔は `G.ppvEntries.player` から取る。

### 2枚目のボタンが嘘をついていた

全大会で「— 代 表 を 選 ぶ —」固定だったが、**PPV と天頂戦に選定は無い**。押した先で実際に起きることを書くよう、大会ごとの `nextLabel` にした。

| 大会 | 2枚目のボタン |
|---|---|
| 秋4団体戦 | 代 表 を 選 ぶ |
| 春タッグ | チ ー ム を 組 む |
| 夏ジュニア | 出 場 者 を 呼 ぶ |
| 冬天頂戦 | 会 場 へ 向 か う |
| 冬PPV | 会 場 へ 向 か う |

### セリフ修正（Keisuke）

天頂戦・去年出場: 旧「四年前は届きませんでした。……次は、四年後じゃない。今です。」→ 新「四年前は届きませんでした。……今年こそは！」

### 残り

2枚目のパターン追加（セリフは Keisuke の全文レビュー待ち）／対外戦の因縁セリフ。

---

## ⚡追い込みボタンが無反応だった不具合（2026-07-26）

### 症状

週画面・団体タブの ⚡追い込みボタンを押しても何も起きない。

### 原因 — 説明文を足したことが原因だった

ツールチップ（`data-tip`）のタップ表示リスナーが、capture 段階で
**`data-tip` を持つ要素のクリックを無条件に飲み込んでいた**。

```js
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-tip]');
  if (el) { e.stopPropagation(); showCustomTooltip(...); }   // ← ボタン自身でも止まる
}, true);
```

`ced7d7d`「追い込みボタンとヘルプの文言をツケの構造に合わせる」で、押す前に代償が分かるよう ⚡ボタンに `data-tip` を付けた。
**その瞬間にボタンが死んだ**。`onclick` も handler も無傷で、click がハンドラまで到達していなかった。

「説明を足しただけで機能が壊れる」という、静かで気づきにくい壊れ方。

### 修正

止めてよいのは「ℹ️ や見出しの `?` のように、押しても何も起きない印」だけ。
`data-tip` の**内側**に押せる部品（`button` / `a` / `input` / `select` / `[onclick]`）があるなら、その click は本人のものなので通す。
祖先まで通すと今度は「見出しの `?` を押しただけで列ソートが走る」ので、`ctrl === el || el.contains(ctrl)` で内側に限定した。

### 実機で辿った

Node の静的検査では原理的に捕まらない種類（イベント伝播）なので、ローカルサーバを立てて実際に押した。
祖先チェーンに capture/bubble リスナーを仕込んだところ、**document の capture だけが発火して以降が全部止まっていた**ことで場所が確定した。

ついでに全画面を走査し、巻き添えは ⚡ だけ・参照先の無い死にハンドラは0件と確認した。

### 反省

前回（興行開催ボタン）と同じ「押していなかった」を繰り返した。UI の配線を変えたら実機で押す。

---
## 創作作品の魅せ方 v0.1 — 紙面棚 × 縦スクロール実況譜（2026-07-26）

ゲーム本体ではなく、**レッスルマネージャーで培った HTML の作法を「女子プロ創作作品を web でどう読ませるか」に転用する実験**。`docs/creative-showcase/` に新設。ゲーム画面ではないので `docs/ui/03-screens/` の画面仕様フローには乗せていない（Foundations の色トークン・3カテゴリ・左右対置ルールには従う）。

### 5案を並べて、器＋目玉の構成を採った

1 架空専門誌のバックナンバー棚 / 2 一試合を縦スクロールで読む実況譜 / 3 関係性から入るトップ / 4 同じ子を何度も照らす目次 / 5 引退式から遡る。

**案1を器にして案2を中の一記事として通す**。紙面棚を歩いていると、ある一戦だけ「全文実況譜あり」のリンクがある。器で実在感を作り、一点で殴る。記事を1本ずつ足して育てられるのを買った。案3〜5は未着手のまま README に残した。

### 3カテゴリの原則を「遷移の演出」に使った

棚と紙面は Office（暖茶＋クリーム）、実況譜は Stage（純黒）。**Office と Stage は画面内で同居しない**という原則を守るだけでなく、クリーム↔純黒の切替に **520ms の暗転**を挟んだ。「照明が落ちて試合が始まる」になり、原則がそのまま演出になった。実況譜に Cream Panel は一つも置いていない。

左右対置は原則9・10 のまま。HPバーは側で色分けせず（同色・危険域のみ変色）、左は左端から右へ・右は右端から左へ伸びる鏡映し。アッパーは対面でも反転させない。

### 案2の核: スクロール位置＝試合経過時間

読み位置（viewport 46%）にいるビートと次のビートの間を補間して、固定ヘッダの HP・観客熱・フェーズラベルを連続で動かす。観客熱は背景グロウの opacity を `h*h` で押し上げる（低域は控えめ、高域で一気に来る）。技は**出し手の側からカットイン**する。決着ビートに入ると `body.is-finale` でレターボックスが降り、livebar が退場して Ceremony 側に切り替わる。

### ダメージセリフのHP帯ルールを演出型として独立させた

CLAUDE.md の発動ルールをそのまま反映。HP74%は通常セリフ、58%は悲鳴、**29%は `.beat-cry`（ボイスのみ・`Voice only` 表記）で長文セリフを出さない**。「言葉にならない」ことをそれ自体で見せるビート型を作った。

モック用の一戦は既存キャラを流用。王者 阿武隈塔子（`composed`＝鷹揚、`specs/oyou-style-guide.md` の「ノーマル鷹揚＝動じないベテラン」に沿って短く切る・「…」で間を作る）vs 挑戦者 高津小春（`bold`・番狂わせ体質・反骨心、`te:47`/`mn:91` から「技巧が無く心臓だけある子」の筋を立てた）。全26ビート。

### 検証

Chromium で機械確認: JSエラー0 / 画像失敗0 / 3ビュー往復可 / HP 100→93/58→78/39→44/29→19/29 の補間と危険域クラス切替 / 観客熱 10→98% とグロウ 0.009→0.823 の追従 / フェーズ Opening→Late / 決着でレターボックス67.5px・離脱で解除 / 375px 3ビューとも横はみ出し無し。**見た目は未確認（Keisuke 実機確認待ち）**。

## U7 選手カード／一覧の統一（2026-07-26）

### 素材が2系統あることを明文化した（ベースライン v0.7 §2-C 新設）

全数調査で「画像サイズが実測40通り以上」と出たが、段が多いのではなく**素材が2系統ある事実がどこにも書かれていなかった**のが原因。

| 素材 | 縦横比 | 用途 |
|---|---|---|
| アッパー（`getUpperUrl`） | **2:3** | 主役として顔と体を見せる。§2 の梯子 |
| face（`portraitImg`） | **1:1** | 一覧の行・チップに差し込む。§2-C の梯子 |

§2 の梯子は 2:3 専用なので、正方形に当てはめると顔が切れる。だから正方形は梯子の外で場当たりに書かれ続けていた。

**正方形は `card` 52 / `row` 40 / `row-sm` 24 の3段**（当初2段で作り、団体タブを 52→40 にしたが「52 のままの方がいい」という Keisuke 判断で card を追加。団体タブは最も長く見る画面で、カードは行ではなく1人ぶんの区画）。実測11通りのうち 40px以下の8通りは並べても区別がつかない（32→34 が6%）。

**もっと大きく見せたい画面は正方形を拡大せず 2:3 に乗せ替える**。引き抜き交渉は `S` 108×162 へ。

### 「顔が出ているなら押せば開く」を通した — 原因は毎回違う場所だった

顔があるのに押せない一覧が12箇所あり、直す過程で**同じ症状の別原因が5つ**出てきた。

1. **配線されていない** — 引き抜きオファー／契約更改の結果／春タッグ順位表／天頂戦の特別招待／社長室のレンタル中／年代記／ブラケット全段
2. **開けるデータが無いのにクリックを付けてしまった（自分の失敗）** — 年代記の退団者は `chronicle.fighterArchive` にしか残らず、旗揚げドラフトの候補は `ALL_CHARS` からその場生成。`canOpenFighterPopup()` を新設して**居る選手だけ**押せるようにし、旗揚げは撤去（カード自体が全ステータス＋寸評を載せた詳細表示なので不要）
3. **ポップアップのキューに握り潰されていた** — `showFighterPopup` は「他のポップアップが開いていたらキューに積んで return」していた。**呼び出し元は全部ユーザーの操作**なので、これは新聞・トーナメント表・式典など**オーバーレイの中から押したクリックを黙って捨てるだけ**の存在だった。判定ごと削除。新聞の写真は onclick が最初から書かれていたのに、これで捨てられていた
4. **`findFighter` が source 決め打ちで諦めていた** — `'roster'` を渡した画面に他団体の選手が並ぶ（試合カードのメイン・対抗戦・ゲスト参戦）と引けずに無反応。source は「まずここを見ろ」というヒントなので、見つからなければ自動探索へ落とす
5. **引数の口はあるのに誰も渡していなかった** — `_jtcFcCore` の `onLeftDetail`/`onRightDetail`。ジュニアTも天頂戦も**次戦カードが一切押せなかった**。渡されなければ id から組む既定を入れた

**z-index**: 選手詳細は 200 でトーナメント表(200)や式典(400)の下に隠れていた。どこからでも開ける参照ビューなので最上位(500)へ。

**私の読み違い1件**: 「引き抜きのアイコンが小さい」の指摘に対し、移籍ウィンドウの `pendingPoach` 一覧を直していたが、実際に見られていたのは**選手詳細→「🤝 選手を引き抜く」から入る `showNegotiatePopup`**だった。「丸アイコンじゃなくて」という言葉がまさにこの画面を指していた。

**もう1件の誤報告**: 「新聞と因縁列伝が死んでいる」と読める報告をしたが誤り。生きているのは新聞タブの `renderNewspaper()`（3面が因縁列伝）で、到達不能なのはデータベースタブ側の**古い複製**だけ。

### ◆2 興行開催の最終確認

カードを1枠いじるたびの確認は入れない（煩わしい）。ただし**開催は取り消せない**ので、`confirmExecuteShow()` で最後に一度だけ確かめる。会場・試合数・メインイベントを出す。

**検証**: 新規テスト `test/u7-roster-list-safety-net-test.js`（29セクション）。既に詳細が開く5画面を回帰として固定（U3-B で profile リンクを全消しした事故の再発防止）。除外リストは**行番号ではなく呼び出しの字面**で持つ。96/96 緑。**Keisuke 実機確認済み（全項目OK）**。

## 「秋の4団体対抗戦で画面が止まる」の原因2件（2026-07-26）

Keisuke 報告のスクリーンショット（ヘッダーは**冬第4週=Week40**なのに、興行準備タブには**第36週の対抗戦ブロック表示**が出ていてボタンが無い）を再現し、独立した2つの欠陥を特定した。

### 原因1: `showScreen()` が興行準備タブだけ再描画しない（本体のバグ）

`showScreen()` は ranking / roster / coach / scoutEvent / database / newspaper / shachoshitsu / week を再描画するが、**`show`（興行準備）だけ対象外**だった。`#showPrepContent` は `App.startShowPrep` 等が呼ばれたときにしか書き換わらないため、**週が進んでも前の週の内容が残り続ける**。

通常週なら次の興行準備で上書きされるので目立たないが、**特別興行週のブロック表示（春タッグ / 秋4団体戦 / ジュニア）はボタンを一切持たない**ため、これが残ると「操作先が無い＝進めなくなった」ように見える。

ブラウザで完全再現（Week40 に進めたあと `showScreen('show')` を呼んでも中身が Week36 のまま）。`renderShowPrep()` を直接呼べば正しい会場選択に変わることも確認。

**修正**: `showScreen` に `id === 'show'` の分岐を追加。ただし `weekPhase` が `manage` / `showPrep` のときだけ。showExec 中に `#showPrepContent` を上書きすると興行進行のUIを壊すため。

### 原因2: 開発ツールの早送りが対抗戦を実行せずに捨てる

`src/dev-tools.js` の `resolveDefaultBlockingPhase` に

```js
if (next._pendingAutumnWarReplay) { delete next._pendingAutumnWarReplay; next = { ...next, autumnWarPhase: 'result', ... }; }
```

があった。**秋4団体対抗戦は `tickWeek`/`advanceWeek` の中では実行されない** — エンジンは `_pendingAutumnWarReplay` を立てて処理をUIに委ねるだけ。したがってフラグを捨てると**大会が丸ごと行われないまま週だけ進み**、`champion` も `results` も空のまま `autumnWarPhase` だけ `'result'` になる。ジュニアトーナメント（すぐ上の分岐）は正しく `run()`→`apply()` していたのに、対抗戦だけ「捨てるだけ」だった。

ブラウザで確認: 修正前は Week36 を越えると `champion: null / results: 0`。修正後は `champion: 'org_s' / results: 3` で battlePoints も反映される。

**修正**: auto-sim と同じ手順（`confirmPlayerTeam` → `startSession` → `simulateNextBout`/`reorderForFinal` を complete まで → `apply`）を `resolveAutumnWarHeadless()` として実装し、`advanceWeek` の直後に呼ぶ。**目標週の停止判定より前**に消化しないと、目標週で止まったときフラグが残る。

**検証**: 新規テスト `test/stuck-screen-regression-test.js`（10セクション。エンジンを実際に Week36 まで回して champion 確定まで完走することも確認）。95/95 緑。

**未検証**: 原因1の修正のブラウザ実機確認は、プレビューが `ui-common.js` を強くキャッシュしていて反映できなかった（`const` 再宣言のため再注入も不可）。再現とパッチ後の期待動作（`renderShowPrep()` 直接呼び出し）は個別に確認済み。**Keisuke の実機で最終確認をお願いしたい**。

## 成長リバランス: 係数の較正確定 + 「見せ方の層」（2026-07-26）

追い込みの代償を「選手の消耗」で払わせる実装（先行コミット 278cff5、係数は未確定のまま）に、**較正した数値**と**プレイヤーへ伝わる経路**を入れて完成させた。

### 1. 係数の較正（323c612）

`test/auto-sim.js` を土台に較正ハーネスを組み直し、**40シーズン×2シード×4候補**をフル実行。全候補で `gameOverCount=0`・不変条件違反0。
全員を毎週追い込み続ける「最大乱用コホート」での引退年齢の中央値:

| 候補 | wear/週, ツケ/週 | 引退年齢 | キャリア長 |
|---|---|---|---|
| 変更前 | 0 / 0 | 26.6歳 | 9.0シーズン |
| **採用** | **0.15 / 0.25** | **24.5歳** | **7.0シーズン（−22%）** |
| 旧暫定 | 0.35 / 0.6 | 23.4歳 | 5.9シーズン |
| 強 | 0.5 / 0.85 | 23.1歳 | 5.5シーズン |

**0.35/0.6 以上は飽和していた。** 0.5/0.85 と統計的に区別がつかず（wear80到達率はどちらも78%）、全員が衰えの入口に立った瞬間に引退している状態。効きの天井に張り付いた値は後から調整する余地を失うので採らない。

### 2. 較正の過程で、指示書の前提が2つとも誤りだと判明した

- **`decayStartAge` は約28歳ではなく 20〜26歳（中央値24）だった。** `getEffectiveDurability` が **−3〜+3 に丸める**ため `23 + 耐久` は最大でも26。設計指示書 v0.1 は「十年以上の成長期間ののちに消耗が来る」前提で書かれているが、実際の猶予は6〜7年しかない。
- **`test/growth-intensive-projection.js` は decay/retirement を一度も呼ばない。** `calcGrowth` だけの手書きループなので、既存実測の「カンスト率92.1%」「エースの65%がOVR100+」は**摩耗を無視した数字**。摩耗込みの実測とは別物として扱う必要がある。

**併せて: 全盛期の窓がほとんど無い。** 成長は3〜5年でカンスト（17〜20歳入団 → 22〜25歳で上限）する一方、摩耗の蓄積は20〜26歳から始まる。伸び切った直後、あるいは伸びている最中に衰えが始まっている。→ ロードマップに宿題として起票。

なお計測では OVR100+ が同時に5人揃う状態が変更前を含む全候補で一度も出なかった（最大2人）が、**Keisuke の実プレイでは OVR100+ が多数出る**との報告があり、auto-sim のロスター運用が人間の最適化を再現できていない（コーチの雇い方・追い込みの使い方が下手）ためと判断。不変条件4「5人カンストを構造的に不可能にしない」は**この計測では判定できない**。

### 3. 見せ方の層（このコミット）

較正だけでは**プレイヤーに何も伝わらない**（消耗は画面に出ないので「気づいたら早く引退した」だけになる）。3点を追加した。

**(a) バグ修正: 自団体の追い込み負傷が消耗に載っていなかった** — `management.js` の自団体パスは `seasonInjuries` を数えておらず、AI団体パス（8771行）は数えていた。`applySeasonEnd` の `wearBonus` は `seasonInjuries*2` を見るため、**自団体の追い込みでの怪我だけが先々に響かない**状態だった。追い込みの代償の主軸が「怪我は治っても体に残る」ことなので、ここが抜けていると設計そのものが成立しない。

**(b) コーチの匂わせセリフ 48本** — `COACH_VOICE_REPORT_LINES` に `strain_vague` / `strain_named` / `strain_injured` を**8系統ぶん**追加（Keisuke は「コーチの性格分けは作っていない」と認識されていたが、`COACH_VOICE_MAP` の8系統は既に存在していたので活用した）。`_buildReportText` で、対象選手がシーズン8週以上追い込まれているか練習負傷中のとき35%で差し替える。既存のコーチ観察レポート経路をそのまま使うので、**道場バナーの頭上吹き出しに出る**（新しいポップアップは作っていない — 「さらりと言う」に反するため）。

観察眼の誤認（`isInaccurate`）は適用しない。消耗は隠れステータスの推測ではなく目の前の疲労なので、ここで嘘をつくと理不尽になるだけ。

**発生頻度の実測**（48週×50シード）:

| 状況 | 1シーズンあたり |
|---|---|
| 最悪ケース（コーチ1人・担当1人・その1人を常用） | 2.36回 |
| コーチ1人・担当3人・1人だけ常用 | 0.94回 |
| コーチ2人・担当8人・3人が常用 | 1.04回 |
| **誰も追い込んでいない（対照）** | **0.00回** |

Keisuke の「忘れた頃に一回くらいでいい／毎週小言は絶対に嫌」を満たす。常用していないときは一度も鳴らない。

**(c) 文言** — ⚡ボタンにツールチップを追加（「重ねた無理は消えず、峠にさしかかった年にまとめて返ってきます」）。ヘルプ「峠と引退」の追込の一行が「シーズンの終わりに答え合わせ」だったのを、実装（`decayStartAge` 到達年に `strainDebt` を一括清算）に合わせて「若いうちは何も起きません。表に出ないまま溜まり、峠にさしかかった年に一度に返ってきます」へ修正。どちらも数値は出さない。

**検証**: 新規テスト `test/growth-strain-presentation-test.js`（22セクション。係数の値は固定せず「経路が消えていないこと」だけを守る）。94/94 緑、auto-sim 30シーズン ALL CLEAR。
## タイトル曲 WM-C01 が1画面ぶん後ろへズレていた不具合の修正（2026-07-26）

Keisuke 報告「タイトルオープニングに設定してある曲がタイトル画面で鳴らず、ニューゲームを始めた後に鳴り始める」。

**原因は2つ重なっていた**。(1) タイトル画面は BGM を一切鳴らしておらず、`confirmDifficulty()`（難易度確定＝ゲーム開始）で初めて `play('kaimaku')` していた。(2) `G` は読み込み時に `let G = Engine.createInitialState()` で **`weekPhase:'draft'` として初期化される**ため、`playForState()` の `if (!G) return` は事実上一度も効かず、index.html の初回クリックフックが走ると**タイトル画面でドラフト曲 WM-C08 が鳴りうる**状態だった。さらに `_finishOpening()` は `refreshAll()` しか呼ばず、`refreshAll()` は BGM に触れないため、**初回ドラフト画面は C01 が鳴りっぱなしで C08 が一度も鳴らなかった**。

**確定した進行**（Keisuke 裁定: 設定画面までは鳴らし続ける）:

| 区間 | BGM |
|---|---|
| タイトル / 団体名入力 / 難易度選択 | WM-C01 タイトル・オープニング（通しで継続） |
| 「ゲーム開始」→ オープニング4幕 | **無音**（1.2秒フェードアウトで幕を下ろす） |
| ドラフト（旗揚げメンバー選択） | WM-C08 ドラフト選択 |
| 集合写真から本編へ | WM-S00 メインメニュー（従来どおり） |

**実装**: `_isTitleFlowVisible()`（titleScreen / orgSetupScreen / difficultyScreen のいずれかが表示中か）を新設し、`playForState()` の**先頭**——`weekPhase` を見るより前、`!G` ガードより前——に置いた。この3枚を「ゲーム開始前の同一シーケンス」として扱う。`weekPhase === 'opening'` の分岐は `play('kaimaku')` から `BGM.stop()` へ。`showTitleScreen()` に C01 の開始、`confirmDifficulty()` に `fadeOutStop(1200)`、`_finishOpening()` に `playForState()` を追加した。

**自動再生ポリシーへの対処**: タイトル画面はページ読み込み直後に出るのでユーザー操作が一度も無く、環境によっては `play()` が蹴られる。しかも `FileBGM._audio` は蹴られても残るため、`BGM.play()` の重複ガード（`trackName === _current && _playing && _audio`）に阻まれて**二度と鳴らせなくなる**経路があった。`FileBGM.play()` の `catch` で `_armGestureRetry()` を張り、最初の pointerdown / keydown で鳴らし直す（ミュート設定は尊重）。既存の index.html 初回クリックフックより手前で効く。

**検証**: ブラウザ実機（`localhost:3002/src/`）で全区間を通し、`Audio.bgm._current` と `FileBGM._audio.paused/currentTime` を実測。タイトル=c01 再生中（本環境では自動再生が通り、フェッチも 206 で確認）→ 団体設定・難易度=c01 継続 → ゲーム開始1.2秒後に `_current:null` / `_audio:null`＝完全無音・オープニング overlay 表示 → ドラフト遷移で c08 再生開始。コンソールエラーなし。安全網 `test/title-opening-bgm-test.js` を新規追加（判定順序・無音区間・3画面の網羅・gesture retry の存在を機械的に検査）。`npm test` 94/94 緑。

**Keisuke に確認してほしい点**: (1) 起動直後のタイトル画面で C01 が鳴るか（鳴らなければ最初のクリックで鳴り出すか）、(2) 「ゲーム開始」でのフェードの長さ（1.2秒）が自然か、(3) オープニング4幕の無音が意図どおりの間か、(4) ドラフト画面に入った瞬間に C08 が立ち上がるか。

## 「中途半端に終わっていたもの」の一斉監査と是正 4件（2026-07-26）

Keisuke の「急に中途半端に終わっているものが他にも無いか心配」を受けた全数監査と、見つかった分の是正。

**監査方法**（仕様書ではなく実装を機械的に走査）: (1) data.js のトップレベル定数で定義以外に一度も出現しないもの、(2) 定義されただけで呼ばれていない関数、(3) src からファイル名で参照されていないアセット、(4) `npm test` / `npm run test:stale`。**image/ の743本「未参照」は PORTRAIT 辞書からの動的組み立てによる誤検知、stale-lint の2件は「消えたことを確認する」negative assertion による誤検知**と切り分けた。

**是正1: 因縁マッチの試合後セリフを復活（番狂わせ71本を含む）** — 2026-07-21 の興行結果画面リデザイン(e03804b)で結果一覧に埋め込まれていた勝敗セリフが丸ごと消え、`UPSET_RIVALRY_LINES`(格下が格上を倒したとき専用・71本)が一度も引かれない状態だった。`_queueRivalryMatchDialogue()` を新設して通常興行とPPVの両方で rivalry 30+ のカードを予約し、`App.closePPVResult` にも消化を追加。表示は U3グループBの共通コンポーネント(`_rivalryCol`/`_u3bSideHtml`)へ移し、旧実装の「名前「セリフ」」の地の文をやめて頭上の吹き出しに入れた。番狂わせは tone-fate＋見出し「番狂わせ」で見分ける。

**是正2: U6のエンブレムを実際に見える画面へ入れ直し** — U6(269c740)の5画面のうち3画面が呼び出し元ゼロだった（`showPPVVSDetail` は3月から、`_renderB3MatchPreview` は挑戦試合の興行統合で、`_renderDbOrgCompare` は既知）。後継の生きている画面へ同じ規則を適用: PPV VS比較→`renderPPVMatchPreview`、B3プレビュー→`renderMatchPreview`（`_awayOrgLabel` を `_matchOrgLabel` へ広げ、敵地遠征に加えてゲスト選手のいるカードでも所属＋実エンブレムを出す）。共通ヘルパー `guestOrgIdOf()` / `crossOrgEmblemHtml()` を追加。

**是正3: WM-D03「引退」を配線** — 引退セレモニーで `wm_bgm_d03_v01.ogg` をループ再生し、連続引退では鳴らし直さず、全員分を閉じたらフェードアウトして通常BGMへ戻す。**D02復帰・D04世代交代は曲が完成しているのに繋げなかった**: 復帰は専用の演出がゲームに存在せず（D層セレモニーも初興行/人気20/初因縁/初ドーム/ドーム満員の5件のみ）、世代交代は年代記の章見出しと新聞リードにしかなく、どちらも「閲覧画面ではBGMを切り替えない」(2026-07-23裁定)に該当する。演出を作るか枠を廃止するかの判断待ちとして台帳に明記した。

**是正4: 死にコードの掃除** — 到達不能な関数 **40件**（3〜5月起源の堆積33件＋削除で連鎖的に死んだ5件＋U6の2件）と `_renderDbOrgCompare`(578行・`_dbSubTab===2` は冒頭で0へ正規化されるため到達不能)を削除。仕様上すでに廃止済みの定数 `MQ_EXTERNAL_CAP`(MQ再設計で「外部+12キャップの世代」ごと置換)と `PPV_CARD_MULT`(PPV出演料は `Engine.specialEventFinance` の団体収益へ一本化済み)も削除。差し替え済みの旧音源7本(計15.4MB)を削除。**残る未参照定数8件(STYLE_GROWTH/STAR_POWER/WEAR_TABLE/CONTRACT_NEGOTIATION_CONFIG/AI_*_NEWS/BESTMATCH_FLAVOR)は削除していない** — いずれも3月起源の実質的な調整テーブルで、「機能が設定を読まなくなっている」可能性の証拠になるため、消すと問題が隠れる。要 Keisuke 判断。

**あわせて**: 前コミットで `stage-bgm-state-test.js` を壊していた（コミット前に `npm test` を回していなかった）。修正のうえ、未配線・パス誤り・存在しないトーンクラスを機械的に落とす検査を各安全網へ追加した。新規テスト2本（`rivalry-match-dialogue-test.js` / `cross-org-emblem-live-screens-test.js`）。**後者は「関数の挙動」だけでなく「呼び出し元が存在すること」を必ず対で検査する** — 既存の u6 テストは関数を単体評価していたため死んだ関数でも緑になっていた。

**検証**: 93/93 緑。全JS構文チェック、ブラウザ実機でロード・コンソールエラーなし・削除済み関数が消えていることを確認。

## 音響刷新 実装接続 Phase 2（選定ボードの割当をゲームへ全面配線）+ ヘッダーのミュートボタン重なり修正（2026-07-26）

Keisuke指摘「オーディオミキサーで音楽の設定は全部見直したはずだが、ゲーム側もそうなっているのか」を受けた実装監査と是正。

**監査結果（仕様書ではなく src 全体の grep で確認）**: 加工済み音源74本（BGM 28／SE 46）に対し、`src/` が実際に参照していたのは**7本だけ**だった。Phase 1（`f4dd425`）で配線されたのは C01／S00／M01／M04／M05／SP07／SE-RS04 のみで、Phase 2 以降が未着手のまま残っていた。選定ボード（`audio-review/wm-audio-selections-2026-07-23.json`）は83枠全判断済みで、**選定は完了・配線が欠落**という状態。

**配線した内容**:
- **特別興行の進行曲を大会別に分岐** — `STAGE_BGM.tournament`（MusMus-052 1本で春夏冬＋天頂戦を兼用）と `war`（MusMus-125）を廃止し、春=SP01/SP02／夏=SP03/SP04／秋=SP05/SP06／冬=SP07/SP08／天頂戦=SP09 へ。A/B は Keisuke裁定で「**決勝・大将戦・ラストマッチに入ったら B**」に統一。判定は純粋関数 `_stlStageTrack` / `_awStageTrack` / `_ppvStageTrack` / `_jtBoardTrack` に集約し、`resolveActiveStageBgm` と各 `playStage()` 呼び出しの両方が同じ判断を通るようにした（復帰経路のズレ防止）
- **WM-M03 因縁戦を新規発動** — 通常興行の観戦中、タイトル戦でもタッグでもないカードで `getRivalryLevel` の tier が2（宿敵・相互 rivalry 50+）以上なら通常試合曲 M01 → M03 へ差し替え。閾値は Claude 判断。tier1「因縁」(30+) は OVR近接だけでも自然に溜まり大半のカードが該当してしまうため、MQボーナスが1→2に上がる節目でもある 50 を採用
- **セレモニー2枠** — 表彰式 → WM-H05、エンディング → WM-H04。D層セレモニー（`_ceremAudioOpen`）の triumph も H05 を共用
- **経営画面3枠** — 契約交渉 → WM-C07（従来 tension）、ドラフト選択 → WM-C08（従来 C01 流用）、ドラフト入札 → WM-C09（従来 tension）
- **他団体抗争イベント** — 台帳に専用枠がないため、同じ「団体 vs 団体」の秋A（SP05）を共用

**据え置き（理由つき）**: (1) S01好調／S02資金難／S03不穏／S05団体危機の団体状況分岐は**しきい値の数値設計が未確定**のため未配線（Keisuke判断で別途設計相談）。tension／season_end も同じ理由で旧ファイル継続。(2) WM-M06 は前提の煽りミニイベントが未実装。(3) SE 45本の載せ替えはBGMと同規模の別工程。

**クレジット整理**: フリー素材6件のうち5件（MOMIZizm×2／MusMus×2／イワシロ elevate_perfect）がゲームから完全に外れたため `CREDITS.music` から削除。残るのは `iwa_gameover001.mp3` 1件のみ。ゲームオーバー曲は台帳で保守枠のまま後継が無かったため、**正式枠 WM-H06「ゲームオーバー（団体解散）」を新設**し Suno プロンプトを起草（H04エンディングの暗い対・恐怖ではなく「別れ」）。H06 完成でフリー素材の使用はゼロになる。

**あわせて修正（別件・ヘッダー）**: 「音声・効果音ミュートボタンが他パラメータにかぶる場合がある」の根本原因は**王座が埋まったとき**。`王座` 項目がポートレート28px＋選手名＋防衛数まで伸びて222pxになり、`.top-bar-info` の等幅グリッド（`repeat(5,minmax(max-content,1fr))`）が列からあふれてボタンに重なっていた（実測: 中身627px vs 列430px＝197pxはみ出し）。王座が空位のうちは起きないため「場合がある」だった。日付列を内容ぶんだけに変更（余白は情報列へ）、`.top-bar-info` を**折り返す flex** に変更、1100px以下はスマホ版と同じ2段組（上段=日付｜音声ボタン、下段=情報行）にした。

**検証**: (1) 静的検査 — `playStage()` / `bgmTrack` リテラル / シーン `bgm:` / `BGM.play()` の全キーが `STAGE_BGM` / `SUNO_BGM` に解決、参照音源23本すべて実在。(2) ブラウザ実機（`localhost:3002/src/`） — 音源24本すべて HTTP 200、新BGM 20本すべて `loadedmetadata` 成功（A/Bペアの尺一致も確認: sp01=sp02=29.3秒 等）。(3) 進行曲A/B判定 15ケース全通過。(4) M03発動 — rivalry 0/29/35→battle、55/75→rivalry、タイトル戦→bigMatch、タッグ→battle。(5) クレジット画面 — 1件のみ表示・リンク1本。(6) ヘッダー — 王座保持＋赤字＋補助金バッジの最悪ケースで 1440/1280/1101/1099/900/760/375px すべて重なり0・はみ出し0。コンソールエラーなし。**BGMの聴感（曲の切り替わり方・ループの継ぎ目）はKeisuke実機確認に委任**。

## UI統一リデザイン U6: 団体の識別表示（2026-07-26）

`docs/ui/mockup-baseline-v0.1.md`（v0.4）§5「団体バッジ」の承認済みルール（実エンブレム必須・頭文字の代用禁止・他団体戦のみ表示）を全画面に適用する作業。全数調査を先に行い、`_emrOrgBadgeHtml` / `_u3bOrgBadgeHtml` / `_awOrgEmblem` / `_chOrgEmblemInner` / `_npOrgEmblem` / ランキング画面の `.rp-rank-fallback` / ドラフト画面の `dn-emblem-player` は**いずれも既に実画像優先＋orgId未解決時のみ頭文字フォールバック**という正しい実装で、「頭文字1文字を色丸で代用している」是正対象は0件だった。

代わりに見つかった実際の欠落は「エンブレムそのものが一切出ていない」5画面:
1. `showPPVVSDetail`（PPV VS比較ポップアップ, ui-common.js） — 団体はリング枠の色とテキストのみで識別、実画像なし
2. `_renderB3MatchPreview`（挑戦状B3プレビュー, ui-common.js） — 同上
3. `renderPPVTvBroadcast`（PPV GRAND FINALテレビ中継, ui-common.js） — 対戦カード一覧・試合速報・頂上決戦VSの3箇所とも団体名テキストのみ
4. `_npRenderPage2`（新聞2面「団体比較」, ui-render.js） — カード見出しが名前+ティアバッジのみ
5. `_renderDbOrgCompare`（database タブ旧「団体比較」, ui-render.js） — `_npRenderPage2` と同じ構造の重複実装。specs/newspaper-and-orgcompare-spec-v2.0.md §7 で**呼び出し元なし(dead code)と既に明記済み**と判明（`_dbSubTab` を2/5/8にする経路がどこにも無い）。プレイヤーには見えない画面だが、ついでに直っていて害はないため据え置いた

4画面（5含む）に `orgIconHtml()` 経由の実エンブレムを追加。他団体が絡む対戦だけに出す条件（GRAND FINALは複数団体混成のため同一団体どうしの組み合わせも起こり得る）を `_ppvOrgId` 比較で判定し、該当なしなら配置を変えずバッジだけ省く形にした。ついでに `_renderB3MatchPreview` と `renderPPVTvBroadcast` の団体名がそれまで一度も `escHtml()` を通っていなかった箇所も直した。

**判断が要る点（据え置き・未決）**: `--pb-enemy-color`（War対抗戦ポップアップ）や `showPPVVSDetail`/`_renderB3MatchPreview` の団体固有色（`RIVAL_ORGS.color`）は、過去に War敵将エースコメントで一度消して復元する羽目になった経緯があるため、今回は削除せず残置した。標準の敵陣色（`--accent-hostility`）へ統一するかどうかは Keisuke 判断待ち。

安全網テスト `test/u6-org-identity-safety-net-test.js`（20セクション）を新設。test: 89/89 緑。

## UI統一リデザイン U3 完了 + Glimpse のヒステリシス（2026-07-26）

### U3: 顔出し＋セリフ吹き出し（27系統）

全数調査で 27系統が見つかり、うち5系統は呼び出し元ゼロの死んだコードだった。稼働22系統のうち19に高さの予約枠が無く、18は吹き出しの中に名前が同居していた。用途で4グループに畳み、**安全網テストを先に張ってから**グループごとに統一した（Keisuke指示）。この順序が効いて、統一の過程で実バグが複数見つかった。

**グループB（2人が対置・5系統8画面, 00f81f0）**: 共通ヘルパー `_u3bSideHtml` / `.u3b-*` を新設。構造だけ共通化し、配色は Office / Stage のカテゴリごとにテーマスコープで切り替える形にした。指示書では「`.fevt-*` は Office」としていたが、実装を読むと `.fevt-arena-bubble` と `.fevt-dialogue-bubble` は既に Stage（純黒＋stageトークン）で、指示のほうが誤りだった。安全網で見つかった3件（全系統のエスケープ欠落／`Audio` の未ガード／死んだ関数3つ）も同時に修正。レビューで、因縁ポップアップの4トーンが16進の撤去にあたって基調色・明色・タグ色の3段階すべて同じ値に潰れていたのを発見し、`color-mix` で階調を復元した。**16進を消すために設計を削るのは筋が違う。**

**グループA（1人が語る・8画面, 9c0c555）**: `_u3bSideHtml` を1人用に拡張して流用。安全網で見つかった4件を修正した。特に**解雇面談とチャンピオン故障引退の一言でセリフのフォールバックが無く、値が無いとプレイヤーに「undefined」と表示される**状態だった。また War敵将のエースコメントと引退2画面は画像URLが空のとき画像もフォールバックも出さず、顔が消えていた。レビュー中に War勝者コメント連鎖の分類ミス（一覧的な演出だと思っていたが、実際は1人ずつ全画面モーダルを ▶ で送る構造でグループAそのもの）も訂正し、同じクラスを使う JT成績コメントのエスケープ漏れも見つけた。

**グループC（隊列, cd4663c）**: 3人がそれぞれ独立した額縁に入っており「団体戦なのに個人の表彰が3回並んでいる」ように見えていた。群の外枠を1つにし、18px重ねる案Cへ。**アッパーは切り抜きの透過画像（webpのALPHAチャンクで確認）なので、1枚ごとの背景・枠・境目は付けず、落ち影は `box-shadow` ではなく `drop-shadow` を使う**。あわせてサイズ梯子を6段→5段に整理（M→S が4.5%しか違わず差が読めなかったため統合）。トロフィーを個人から群の見出しへ移した（全員が主役なのに個人を選んで飾るのは筋が通らない）。

**グループD（道場バナー・Glimpse, bcf899b）**: 分類を3回外したのち、実装を全部読み直して整理し直した。「一覧の行が並ぶ形」は**この game のどこにも存在しなかった**。道場バナーは1枚の200px画像に3種類の発話（コーチ48px常設／選手の掛け声40px・14秒周期／ログ24px・5秒巡回）が同居しており、大きさ・出方・情報量で階層が既に設計されていて競合していなかった。Keisuke 判断で右下の情報フィードを全廃し、**練習の合間に一息ついている選手を1〜2人ランダムで出す**形へ差し替え（18%・最大2人・22秒周期、心情と人間関係のものだけ）。セリフの吹き出しは白＋黒文字に統一、コーチ名を吹き出しの外へ。Glimpse Cascade は丸96px → アッパー S(108×162) の2人組へ。派閥イベント6箇所の `.fevt-quote` は**地の文ではなく本物のセリフだった**という分類の訂正を反映して頭上の吹き出しへ移した。

### Glimpse のヒステリシス（bec2809）

Keisuke の「表示件数が多すぎる」という指摘から実測（20シーズン×2シード）したところ、**件数以前に同じペアが同じ閾値で何度も鳴っていた**。cdKey の半数以上が2回以上、最多24回。クールダウン8週だけで、値が閾値付近を行き来するたびに再発火していた。

一度跨いだ閾値は値が10ぶん戻るまで再武装しない形に変更（`GLIMPSE_A_REARM_MARGIN`）。「80に届いた → 70を下回った → また80に届いた」なら鳴らす。副産物として表示件数も収まり、カスケード発火率 40.7%→21.6%、最大12件→6〜7件、6件以上が 8.5%→0.9%（2シードで再現）。**表示側の上限（足切り）は入れない** — 上限は「珍しくて重要なものが切られるかも」という不安を構造的に抱えるため、生成側で根本を潰す方針を採った（Keisuke指摘）。

検討して不採用にした案: 接点のない相手を除外する案は**仮説が外れた**（他団体target候補398件のうち対戦履歴が無いのは12件=3%だけ）。rate を一律で下げる案は gold/danger を490件巻き添えにするため論外。

test: 88/88 緑 / auto-sim 30シーズン ALL CLEAR

## UI統一リデザイン U1・U2（2026-07-25 優勝発表と試合結果表示を統一）

「用途は同じなのに実装が割れている」箇所を用途ごとに一括改変する方針（`docs/ui/ui-unification-plan-v0.1.md`）に沿って、U2（大会の優勝発表）とU1（単発試合の結果表示）を完了した。

**U2（238e30b）**: 3つに割れていた優勝発表（`.pb-champion-*` / `.agw-champion-*` / `.tcwn-*`）を共通コンポーネント `.champ` / `.ch-*` に統合。大会ごとの差分はテーマ色の変数だけにした。縦の並び順は 大会ヘッダー→吹き出し→画像→名前→役割→団体バッジ→数値 で固定。主役の出し方は大会の性格に合わせ、JT・天頂戦は1名を大きく、春タッグリーグは2名を横一列、秋4団体対抗戦は3名を横一列（先鋒左・大将中央・中堅右）とした。複数人が並ぶ行は `flex-wrap:nowrap` にして狭い幅で縦積みに崩れる事故を防ぐ。併せて、秋は3名中1名にしか吹き出しが出ず高さが揃わなかった不具合、JT・春タッグの吹き出し内に話者名が同居していた違反、天頂戦の優勝者が一言も発しなかった欠落、団体バッジが頭文字の色丸だった代用を直した。レビューで大会MVPの画像が230×330と優勝3名の大将（150×224）より大きく格が逆転していたのを発見し、120×180へ落として縦積みに揃えた（音の二段構成には触れていない）。

**U1（f6a4d7c）**: 承認済みの `.emr-*` 配置バランスを残り3系統へ展開。`.c1r-*`（派閥内対決）は独自の2カラムを廃して `_emrSingleSide` / `.emr-bout` / `.emr-hp` をそのまま流用。`.crrm-*`（挑戦試合の結果）は吹き出しを画像の上の予約枠へ移し、中の話者名を撤去した。`.pb-mrow`（8画面共有）は話者名の撤去・敗者のグレースケール統一・行数制限のみとし、画像サイズの統一はU3へ送った。あわせて通常興行のテーマ色を自団体の金で正式に定義した（従来は既定の `--ev-winter` を継承して冬の大会と同色に見えていた。`.pb-event-summary` は `--gold` 自体をローカルで上書きしており、勝者ハイライトとMQの星が冬の灰色で出ていた）。レビューで、派閥内対決の結果から選手プロフィールへの導線が4箇所とも消えていたのを発見し、`_emrSingleSide` に `opts.profileContext` を足して復活させ回帰テストで固定した。挑戦試合の勝者画像が敗者と同サイズになっていたのも差し戻した（この画面は1人ずつ表示するため左右対称性の制約がなく、「勝ったんだから真ん中でもっと大きく」の指示を優先する）。

**ベースライン v0.2（95cc33a）**: U3の全数調査で、顔出し実装だけで28通りのサイズが使われている一方、実装済みのものは全部2:3の縦横比で揃っていたことが判明。体系は既に一貫しており違いは主役度の段だけだったため、3段階から6段の梯子（XL/L/M/S/XS/chip）へ差し替えた。v0.1 の `hero 172×200` は実装（172×258）と一致しない誤記だったので訂正した。

テストは 86/86 緑。新規テスト2本（`champion-announcement-unified-design-test.js` / `u1-match-result-unification-test.js`）を追加した。

## 直近の調整（2026-07-22 失効した敵地遠征予約で選手が戻らない問題を修正）

旧来の遠征対抗戦予約が直接実行方式への移行後も残ると、予約された3名が通常興行カードから無期限に除外され続ける経路があった。予約自体はロスター移籍ではないため、受諾から8週（固定興行との衝突を考慮した猶予）を超えた未実行予約だけを自動失効し、選手を即時に再編成可能にする。セーブ読込時にも同じ救済を実行するため、既に数か月詰まっているセーブも再読み込みだけで復旧する。正しく進行中の新規予約は8週未満なら保持する。回帰テストで猶予内保持と8週時の解除を固定した。

## 直近の調整（2026-07-22 天頂戦年の開発者モード早送りで通常興行が重複する不具合を修正）

隠し開発者モードの既定値早送りは、天頂戦年の第48週に `Engine.advanceWeek()` が天頂戦を自動決着した後、同じ第48週を通常興行としてもう一度処理していた。そのため実機確認用に年末を通過させると、天頂戦と普通の興行が同一週に重複する。早送りの通常興行生成から、`season % 4 === 0` の第48週を明示的に除外した。通常プレイの開催判定は従来から天頂戦を優先しており変更していない。`dev-tools-static-test` に回帰条件を追加した。

> 完了した作業の詳細ログ置き場（新しい順）。2026-07-08 に docs/game-system-roadmap.md から分離した。
> ロードマップは「これから何をやるか」専用、こちらは「何をどうやったか」の記録。
> **作業完了時は、このマーカーの直後に既存項と同じ書式（`## 直近の調整（日付 タイトル）`）で追記する。**

<!-- ▼▼ 新しいログはこの行の直後に追記（新しい順） ▼▼ -->

## 2026-07-25 セリフ軸の archetype×personality 化 第1波・第2弾(計1,516セル補完・欠落ゼロ)

### 発端
Keisuke の実際の編集手順が「**その属性×性格の一人を想像して、その人の全セリフを通しで直す**」であることが判明。ところがセリフの多くが **personality 単軸**で分岐しており、長文をそれで割ると **archetype(口調)の支配力が勝って破綻**していた（例: `SCOUT_SIGNING_LINES.direct.earnest` を真面目なお嬢様も真面目なヤンキーも同じ「よろしくお願いします！」で喋る）。短文の掛け声・ダメージボイスは archetype だけ押さえれば足りる、という裁定。

### 方式
ゼロからの新規創作ではなく**穴埋め**。対象テーブルは既に `personality → archetype` の二層構造を持ち、`_default`(口調未指定のフォールバック)しか無いセルが穴として残っていた。各スロットには**既に書かれた他 archetype のセリフが手本として存在する**ため、意味は `_default` が決め、**口調だけを載せ替える**作業。既存セリフは無改変・**純粋な追加のみ**。

### 成果
- **第1波 561セル**: `GLIMPSE_A_LINES` 282(→462/462) / `CHOICE_EVENT_DIALOGUES` 279(→516/516)
- **第2弾 955セル**: 契約更改253 / 大型イベント177 / 経歴イベント176 / 引退154 / 週次通知102 / 引き抜き93。いずれも欠落ゼロ
- 合計 **1,516セル**、`src/data.js` に 1,516 行の insertion / 0 deletion

### 実装上の罠（2件、いずれも安全弁が検出）
1. **後付け代入による二重定義**: `GLIMPSE_A_LINES` は `const ... = {}` の後に `GLIMPSE_A_LINES.bond_80_up = {...}` で上書きされており、**本体リテラル側は実行時に死んでいる**。反映スクリプトが最初その死んだ側に書き込もうとして、重複キー検出で停止。後付け代入(後勝ち)を優先する実装に修正
2. **エイリアステーブル**: `EVENT_LINES_BY_KEY` は `titleWin: EVENT_TITLE_WIN_LINES` のような**参照のみ**で実体が無い。fills をエイリアス先8テーブルへ振り替えて反映

### 執筆方針（全バッチ共通）
`default_lines` の意味は動かさず口調だけ載せ替え／ト書きスロットは形式維持し所作の描写で口調差を出す／固有名詞禁止・プレースホルダ原形維持／**ojousama は語彙で品格を作り「ですわ・ですの」はアクセント程度**（禁止ではなく頻度と自然さの問題、という Keisuke 裁定）／polite と衝突するセルは お嬢様=和語・書き言葉 / 丁寧=話し言葉の敬体 で分離／引退セリフは決め台詞と説教臭さを避ける／composed は全行「!」ゼロ・40字以内(oyou-style-guide 準拠)。

### 残件
`CARE_REACTION_DIALOGUES` 217セルは `special_treatment` キー重複バグの修正待ちで保留。**本来の第1弾**(性格のみ・長文605行を7属性へ展開)は未着手。第3弾(性格のみ・短文1,375本)は優先度低でロードマップへ。

## 2026-07-25 セリフ編集基盤の整備(抽出16,682本・Excel往復ツール・キャラタイプ別再編)

- **`tools/extract-dialogue.js`**: `src/*.js` を静的パース＋`vm`評価し、**192テーブル・16,682本**のセリフを `docs/dialogue/*.md` へ抽出(20カテゴリ・全行にID付与)。再実行可能
- **`tools/dialogue-workbook.js`**: 同基盤を再利用し `export`(xlsx生成) / `apply`(「改訂」列を `src/*.js` へ書き戻し)の**往復ツール**。外部npm依存なし(zlibでxlsxを手組み)。安全機構=「現在」列とソースの一致検証／`--dry-run`／`.bak`退避／書き戻し後の `run-all.js` 自動実行と失敗時ロールバック。往復実測で1行の外科的差分・CRLF/コメント/整形を保持
- **分割軸の再編**: 当初カテゴリ別20分割で出したが、実際の編集単位は archetype×personality の「一人格」だったため**キャラタイプ別34ファイル**へ作り直し。各ファイル1枚目に**在籍キャラ一覧**(名前/スタイル/ロール/特性)を置き「誰の声か」を想像できるように。属性なし6,428本は話者性質で ナレーション・記事/コーチ/その他セリフ に分離し人格別ファイルに混ざらないようにした。`_キャラ対応表.xlsx`(7×7マトリクス＋49組の内訳＋キャラ一覧127名)を新設(旧世代 `gatherComboMap` 相当の復活)
- **`セリフ編集/` をリポジトリ直下に新設**し、バッチ3本(`1_エクセルに書き出し` / `2_変更内容を確認` / `3_ゲームに反映`)を配置。ダブルクリックで完結。**CP932+CRLF**で作成(LF改行だと cmd がコマンドを分断して起動不能。実際に踏んで修正)。`3_反映` は実行前に Y/N 確認
- 古いExcel 12個 → `docs/archive/xlsx-old/`、完了済み handoff/指示書 10件 → `docs/archive/` へ移動(54→44)

## 2026-07-25 開発者モードに「イベント即時発火」を追加

`Ctrl+Shift+D` の開発者パネルに、条件を迂回してイベントを即表示するセクションを新設。第一弾として**挑戦の直訴(自団体→他団体/他団体→自団体の双方向)**。heat≥90 等の週次抽選条件を通さず、ロスターから `buildMatchCard` が成立するペアを自前で選んで payload を組み `App.handleChallengeRequest` を直接呼ぶ。関係性が既にあるペアを優先採用。健康な選手が3名未満なら理由を表示して中断。ゲーム本体は無改変・`dev-tools.js` のみ。実ブラウザで往復動作確認済み。
## 2026-07-25 favicon.ico の404を解消(空 data URI でリクエスト自体を止める)

配布版404修正の実機確認で、dev-tools.js の404が消えた後もコンソールに `favicon.ico` の404が2件残っていた。ページに icon 指定が無いとブラウザが `/favicon.ico` を自動要求するため。**ファビコン画像は用意せず、`<link rel="icon" href="data:,">` で「アイコンは無い」と明示してリクエスト自体を止める方針を採用**(Keisuke裁定: 画像用意は面倒)。タブのアイコンは無地のままになる。

- 対象は**ユーザーが直接開くトップレベル文書のみ**: `src/index.html`、生成物の `START.html`(`package-release.ps1` のヒアドキュメント)、ガイド3種。
- `battle-engine.html` / `tag-battle.html` は `iframe.src` 専用(`src/app.js` で確認)で、**サブフレームはファビコンを要求しない**ため対象外。
- 検証: dev サーバーのアクセスログで、修正前は `GET /favicon.ico` が記録され、修正後のリロードでは**リクエストが発生しないこと**を確認(DOM 側も `link[rel~=icon]` の href が `data:,` であることを確認)。zip を再生成し、5つのトップレベル文書すべてに favicon 指定が入り dev-tools 参照が0件であることを確認。`node test/run-all.js` 84/84 PASS。
- 余談: dev プレビューを `serve src` で起動すると `image/` が大量に404になるが、これは `src/` をWebルートにしたことで `../image/...`(正しい規約)がルート外に出るためで、ゲーム側の不具合ではない。ローカルで通しで見るなら `.claude/launch.json` の `root`(port 3002)を使う。
- 対象: `src/index.html`、`release/package-release.ps1`、`ガイド01-はじめの一歩.html`、`ガイド02-さらに先へ.html`、`ガイド03-パラメータ解説.html`。

## 2026-07-25 開発者モードが Ctrl+Shift+D で開かない問題を修正(Alt+Shift+D を併設)

配布版404修正の実機確認中に発覚。**Chrome は `Ctrl+Shift+D` を「全てのタブをブックマークに追加」へ割り当てており、ブラウザ側が先に処理するためページの keydown ハンドラまで届かない**(押すとブックマークのダイアログが出る)。`event.preventDefault()` を書いてあっても、ブラウザ予約ショートカットには効かない。前段の404修正とは無関係の既存不具合。

- **Alt+Shift+D を同義キーとして併設**(Chrome 未割り当て)。既存の `Ctrl+Shift+D` は削除せず残したので、キーを奪われない環境・他ブラウザでは従来どおり開く。判定は `(event.ctrlKey || event.altKey) && event.shiftKey` + Dキー。
- **キー判定を `event.code === 'KeyD'` 優先に変更**。Alt 併用時はキーボードレイアウト次第で `event.key` が別文字になりうるため、レイアウト非依存の `code` を先に見て `key` はフォールバックに落とした。
- **誤爆しないことを実機確認**: `Ctrl+D`(このページをブックマーク)・`Alt+D`(アドレスバー)は Shift 無しなので発火せず、`Shift+D` 単独(大文字D入力)でも発火しない。開く→閉じる→再度開くのサイクルも正常。
- `docs/developer-mode.md` の起動手順を更新し、Chrome の競合と `WrestleManagerDev.open()` の逃げ道を明記。
- **配布への影響なし**。`src/dev-tools.js` は `devOnlyFiles` で配布対象外のため製品版のファイルは1バイトも変わらない。
- 検証: `node test/run-all.js` 84/84 PASS、`node test/stale-lint.js` 陳腐化ゼロ。
- 対象: `src/dev-tools.js`、`docs/developer-mode.md`、`test/dev-tools-static-test.js`。

## 2026-07-25 配布版で dev-tools.js の 404 が出る問題を修正(梱包時に参照を除去)

`src/index.html:10045` の `<script src="dev-tools.js"></script>` は開発者パネル用で、`release/manifest.json` は意図的に `src/dev-tools.js` を配布対象から外している。しかし梱包スクリプトに参照を落とす処理が無く、DLsite/BOOTH 配布版を起動すると毎回コンソールに 404 が出ていた(機能的な実害は無く、開発者パネルが無いだけ)。**対応案A(梱包時に除去)を採用**。案B(`onerror` 握り潰し/動的挿入)は製品版のためだけに開発側コードを歪めるので不採用、案C(配布に含める)は「開発者パネルは配布版に入れない」方針に反するため不採用。

- **manifest 駆動にした**: `release/manifest.json` に `devOnlyFiles: ["src/dev-tools.js"]` を新設し、「配布しない開発専用ファイル」の単一の真実の情報源にした。除去対象をスクリプトへ直書きしていない。
- **既存の「manifest 未記載ファイル検出」と整合**: `package-release.ps1` の未記載警告は `devOnlyFiles` を対象外にした。従来は毎回 `! src/dev-tools.js` が出ており、**意図的な除外が「記載忘れ」と同じ見た目で警告に混ざっていた**。これで警告に残るのは本当の記載漏れだけになる。逆に `devOnlyFiles` にあるのに実体が無い場合は「除去ルールが古い」警告を出す。`sourceFiles` と `devOnlyFiles` の両方に載っていたらビルドを停止。
- **除去処理**: ステージング後、配布用 HTML(`sourceFiles` の `*.html` 全部)から該当ファイルへの `<script src>` / `<link href>` をタグ行ごと除去。**`src/` は一切書き換えない**ので、開発時は従来どおり Ctrl+Shift+D で開発者パネルが開く。除去しきれない参照(動的 `s.src = '...'` 等)が残った場合はステージングを片付けた上でビルドを停止する — 404 を出す zip を作らないため。
- **検証側にも同じ不変条件**: `verify-package.ps1` に「devOnlyFiles が zip に入っていないこと」「配布 HTML から参照されていないこと」の検査を追加。梱包側が壊れても検証で捕まる二重化。
- **`-CheckOnly` を追加**: `verify-package.ps1` は末尾が `Read-Host` の手動ブラウザチェックリストのため非対話環境で完走できなかった。自動検証([1/3]〜[2/3])だけ回して終了するスイッチを追加(既定動作は変更なし)。**配布前は従来どおり `-CheckOnly` 無しで手動チェックリストまで通すこと。**
- **検証**: 実際に `package-release.ps1` → `verify-package.ps1 -CheckOnly` を通し合格。配布版 index.html を zip から取り出して `src/index.html` と diff し、**差分が該当1行の削除のみ**(710,335→710,297 バイト = タグ36字+CRLF)であること、BOM 混入・改行コード変化が無いこと、zip 内に dev-tools エントリが0件であることを確認。正規表現は CRLF/LF/インデント/`defer`付き/シングルクォート/相対パス/末尾改行なしの7形を除去し、`vendor-dev-tools.js`・`dev-tools-extra.js` を誤爆しないことを個別に確認済み。`node test/run-all.js` 84/84 PASS(変更前後で同数)。
- **`dev-tools-static-test.js` を拡張**: 「配布に含めない」「`devOnlyFiles` に宣言済み」「梱包・検証スクリプトが除去/検査を持つ」を静的アサートに追加し、将来この 404 が再発しないよう固定した(テストファイル数は増やしていない)。
- 残: 配布版 index.html には開発者パネル用のインライン `<style>#wmDevPanel{...}` が残っている(約1KB)。**インライン CSS のため 404 にはならず**今回は未対応。気になるなら別途。
- 対象: `release/manifest.json`、`release/package-release.ps1`、`release/verify-package.ps1`、`test/dev-tools-static-test.js`。
## 2026-07-25 CARE_REACTION_DIALOGUES の重複キー `special_treatment` を解消(死んでいたセリフ40行超を救出)

`src/data.js` の `CARE_REACTION_DIALOGUES` 直下に `special_treatment:` が2回書かれており、JSのオブジェクトリテラルは後勝ちのため先行ブロック(約97行)が**まるごと実行されない死にコード**になっていた。セリフ編集Excelツール(`tools/dialogue-workbook.js`)の作業中に発覚。構文エラーにならないため誰も気づけない類のバグ。

- **経緯**: 先行ブロックは 2026-03-04 `caa648a` で旧ケア団体アクション用に追加され、2026-04-12 `d12bb24`(Tier3B shy/polite 補完)で加筆されていた。後続ブロックは 2026-04-23 `0fb97d2`(特別治療を怪我ポップアップ→社長室指示書へ移管)が「新規追加」のつもりで書いたもの。結果、11日前に補完したばかりの shy 系セリフが無言で失われていた。
- **裁定**: 文面が現行文脈(専門医招聘)に沿う**後続ブロックを正**とし、先行ブロックにしか無いスロットだけを移植。既存スロットの文面は一切変更していないため、実行時の挙動は**従来の厳密な上位互換**。
  - 移植: `shy`(personality まるごと・`_default`/`polite`)、`normal.delinquent`、`normal.seductive`、`bold.ojousama`、`bold.seductive`、`earnest.seductive`
  - 破棄: 両ブロックに存在するスロットの旧文面(19スロット分)。後続ブロックの文面が「専門の先生」を受けた内容で指示書の文脈に合うため。
- **効果**: これまで shy の選手は `pickDialogueLine` のフォールバック(`lineObj[p] || lineObj._default || lineObj.normal`)で `normal` の文面を喋っていた。7性格すべてが揃い、shy 固有の言葉が出るようになる。
- **横展開調査**: 波括弧インスタンス単位で重複キーを検出するスクリプトを書いて `src/` `tools/` `test/` の全JSを走査。テンプレートリテラル内のCSSや同一関数内の別オブジェクトを誤検出しないことを自己テストで確認済み。**重複キーは本件1件のみ**で、他の大型手書きテーブルは健全だった。
- 検証: `node test/run-all.js` 84/84 PASS。`node --check src/data.js` OK。実行時の `special_treatment` 全スロットを列挙して7性格×archetype の解決を確認。セリフ本文の追加・改変は無く試合数値にも触れないため auto-sim は不要と判断。
- 対象: `src/data.js` のみ(+97行の死にコード削除、-9行の移植)。
- 確認してほしい点: 社長室「🏥 特別治療指示書」を **shy 性格の負傷選手**に発行したときのリアクション(専用セリフが出るか)。ほか delinquent/seductive アーキタイプの選手でも文面が性格に合っているか。

## 2026-07-25 挑戦試合セリフを全面刷新(CHALLENGE_LINES 34セル・sendoff新設)

CH-5実装ログ(下記)で保留していた「Keisuke書き直し方針のセリフ」が確定納品されたため接続。Keisuke承認済み・archetype×personality 34セル×4場面(petition/直訴・sendoff/YES直後の返事・win/勝利報告・lose/敗戦報告)＝408本を `src/data.js` に `CHALLENGE_LINES` として追加し、旧 `CHALLENGE_REQUEST_LINES`(archetype×hostile/respectful・42本)と `CHALLENGE_REQUEST_LINES_STYLE`(style×archetype×hostile/respectful・84本)を削除。bond閾値によるhostile/respectful分岐とstyle分岐は廃止し、archetype×personalityの直接キー(`${archetype}_${personality}`)に統一。未定義セルは `${archetype}_normal` → `normal_normal` の順でフォールバック。

- **抽選ロジック**: `src/relationships.js` の `Engine.challengeRequest` に汎用 `pickLine(fighter, scene, rng, orgName)` を新設(フォールバック探索＋本文中 `{org}` を相手団体名へ置換、未指定時は「相手団体」で安全に埋める)。既存 `pickRequesterLine` はこれの petition 場面ショートハンドに縮小(シグネチャは `(requester, rng, orgName)` に変更、呼び出し元1箇所を追随)。
- **sendoff新設**: 直訴YES直後、`src/app.js` `handleChallengeRequest` の該当分岐から `showChallengeSendoffModal`(`src/ui-common.js` 新設)を呼び、直訴した本人の返事を頭上吹き出しで見せてから従来の受理通知(showEventPopup)に進む。独自モーダルは作らず、卒業レポート等と同じ `_mdlASubjectStage(fighter, '', {small:true, speech:line})` を流用(mdl-a型・頭上吹き出し・「戻る禁止」原則に準拠)。
- **win/lose接続**: `_challengeRequestResultReaction`(`src/ui-common.js`)の自団体勝利セリフを、汎用 `VICTORY_LINES`/`fighter.voiceLines` から `CHALLENGE_LINES` の `win` 場面へ切替。AI代表が喋るケース(`CHALLENGE_REQUEST_OPPONENT_REACTIONS`)は既存のまま(対象外)。引き分けの挙動も既存のまま。
- **検証**: `node test/run-all.js` 84/84 PASS(既存の`challenge-request-result-reaction-test.js`はVICTORY_LINES依存だった箇所をCHALLENGE_LINES期待値に更新)。`node test/stale-lint.js` 陳腐化ゼロ。`node test/auto-sim.js 20 42` ALL CLEAR(0 violations)。追加のNode検証スクリプトで全34セル×4場面=136通りの解決・フォールバック2パターン・`{org}`置換漏れゼロを個別確認。
- 対象: `src/data.js`(旧テーブル削除+新テーブル追加+export列挙更新)、`src/relationships.js`、`src/ui-common.js`、`src/app.js`、`test/challenge-request-result-reaction-test.js`。
- 実機確認待ち: petition/sendoff/win/loseの4場面すべて(特にsendoffの頭上吹き出し表示と、forward/inverse両方向での{org}置換)。

## 2026-07-25 挑戦UI再設計 CH-4(団体エンブレム)/CH-5(勝利代表の拡大) 実装

モックアップ承認(rev.2)を受けて、セリフに依存しないビジュアル2点を先行実装。対象 `src/ui-common.js`＋`src/index.html`。
- **CH-4**: 直訴モーダル(`showChallengeRequestModal`)の両サイドに `.fc1m-org`(エンブレム＋団体名)を追加、結果モーダル(`showChallengeRequestResultModal`)のスコアバナー両脇にも同様。`_awOrgEmblem(orgName,isPlayerOrg,20)` 流用。isPlayerOrg は forward:左=自団体/右=相手、inverse:左=相手/右=自団体。エンブレム未解決時は `orgIconHtml` が空文字を返すためレイアウト非破壊。
- **CH-5**: 空だった `.crrm-reaction-scene.is-victorious` を実装(中央寄せ＋ポートレート172×196＋金グロー、モバイル140×160)。`.is-defeated` は不変。CSSは既存命名慣習に合わせ `.fc1m-*`=index.html / `.crrm-*`=ui-common.js内`<style>`、色は全てトークン。
- 検証: `node test/run-all.js` 84/84 PASS。CSS/markupのみでauto-sim不要。
- CH-5の**勝利セリフ差し替えは保留**(Keisukeが挑戦セリフ全体を書き直す方針。棚卸しを `docs/draft-notes/challenge-dialogue-inventory.md` に作成)。
## 2026-07-25 遠征挑戦後の「進行不具合(showPrep)」復旧UI落ちを修正(自団体興行が中止に見える問題の正体)

敵地遠征(挑戦状・自団体発)の試合後、`App._finalizeAwayChallengeShow` の `continueClose()`(app.js:9124-9130)が `showScreen('week')` を呼びつつ `weekPhase` は `showPrep` のまま `renderShowPrep()` していた。`renderWeekScreen`(今週タブ)には showPrep 分岐が無いため html が空になり「⚠ 進行不具合が発生しました(showPrep)」の復旧UIに落ちていた。ユーザーには自団体の興行が中止されたように見えていたが、実際は遠征後に同じ週の自団体興行準備へ戻る設計(遠征選手は `removeFightersFromCard` でカードから除外済み・中止はしていない)で、着地先の画面指定が誤っていただけ。`showScreen('week')`→`showScreen('show')` に修正(`startShowPrep` と同じ着地)。これで遠征後は自団体興行準備画面(カードエディタ)に正しく着地し、遠征に出た選手を除いて通常どおり興行を組める。対象: `src/app.js` 1箇所。挑戦系テスト8本 PASS。実プレイ確認(遠征→自団体興行の一連)はユーザーに委任。

## 2026-07-25 興行後「SHOW AFTERMATH(興行のあとで…)」glimpse cascade の二重表示を修正

通常興行後、Tier1 glimpse を集約する「SHOW AFTERMATH」オーバーレイが2回出ていた(結果画面プレビュー経路 + closeShowResult 本tick経路)。設計上は `_showResultInlinePreview.shownSignatures` で dedup する想定だったが、`App._glimpseSignature`(app.js:8862)が署名に **`dialogue`(pickDialogueLineがMath.randomで選ぶ非決定的セリフ)** と派生値 `tone`/`label` を含んでいたため、プレビューtickと本tickで別々にRNGを消費して同一glimpseでもセリフ違いで署名が変わり、dedupが全滅していた。glimpseのペア選択自体は `Engine.rng.derive(rngSeed,season,week,opcode)` で決定的(relationships.js:4625/4751)なので、署名を **安定識別子のみ(layer/type/axis/speakerId/targetId)** に変更してdedupを機能させた。加えて `App._glimpseCascadeShownThisShow` ガードを両経路に入れ、レース時も二度目を弾く二重の保険とした。対象: `src/app.js` のみ。npm test 84/84 / auto-sim 20年 ALL CLEAR。他興行(遠征挑戦は同一結果画面経路で自動的にカバー、PPV/PPV-TV/非興行週は別経路で無影響)を確認。

## 2026-07-24 全体バグチェックで確定したゲーム本体バグ5件を修正(C/F/G/J/K)

セッションのバグ監査(auto-sim + 静的監査4エージェント)で確定した本体バグのうち、安全に直せる5件を修正。auto-sim 40年 ALL CLEAR / npm test 84/84。

- **C 春タッグ順位ソートの非推移的比較子** (`src/management.js` §25529付近): 直接対決をsort内でpairwise比較していたため3すくみ同点で `Array.sort` の結果が不定→決勝進出2チームが不確定だった。同点グループ内のミニリーグ勝ち数 `h2hMiniWins` をスカラーで事前計算し、points→h2hMiniWins→mqTotal→tieRandom の全スカラー比較に変更(推移的)。2チーム同点は従来同値、3すくみはmqTotalで決定論的決着。
- **F 業界底上げ式典の閉じ遷移** (`src/ui-common.js` leCloseBtn): フェード完了後の setTimeout 内で `onDone()`(refreshAll)を呼んでいたため、600msフェード中に背後の演出前画面が透けていた。オーバーレイが不透明なうちに `onDone()` を先に呼んで背景を差し替える順に変更(App.completeDraftと同型)。二重発火ガード `_leClosing` も追加。
- **G ロード時の王者再検証漏れ** (`src/app.js` repairOnLoad直後): 王者在籍の安全弁が repair の前に走るため、repair がロスターを間引くと `titles.world.championId` が不在者を指したまま残りえた。repair直後に既存ヘルパー `Engine.title.validateChampion` を呼んで再検証(worldティアのみ実データありを確認)。
- **J dev早送りの通常興行二重開催** (`src/dev-tools.js`): 天頂戦(週48)だけ除外されていた通常興行ビルドを、春タッグ(週12)・秋対抗戦(週36)・ジュニア(週24・成立時)にも拡張除外。実プレイでも各 *IsEventWeek() で通常興行ボタンはブロックされ専用イベントが興行を代替する挙動に一致。
- **K dev早送りでジュニア週の tickWeek スキップ** (`src/dev-tools.js`): `juniorTournament.apply` の非キャンセル分岐が weekPhase を 'manage' に戻さず(実UIは finishUp で戻す)、週24の tickWeek がスキップされていた。apply後に weekPhase:'manage' を復元。これで週24が J のガード対象に入るため isJuniorTournamentWeek も追加。
- 付随: `test/dev-tools-static-test.js` の旧ガード文字列アサーションを新ガード節に追従更新。
- 未対応(別タスク): A(MQ二重クランプ)・B(天頂戦リング内化欠落)は balance-sensitive のため100年auto-sim前後比較つきで別途。I(dev早送りの秋対抗戦が実シミュレーションされず結果偽装)・D(天頂戦の無効エントリで全ブラケット再抽選)・E(秋対抗戦の同週引き抜きで大会報酬消失)・H(引退時の派閥memberIds掃除漏れ)は要相談で保留。

## 2026-07-24 検査体制の立て直し（統合テストランナー+陳腐化リンター+CRLF耐性ヘルパー）

大量アップデートで既存テストが本体進化に追従できず陳腐化する問題への恒久対処。根因は「テストが振る舞いでなくソース文字列を検査している」こと(クラス名変更/バージョンハードコード/CRLF/モック未更新で、動作が正しくてもFAIL)。対象: `test/` + `package.json`(ゲームコード無改変)。

- **新規 `test/run-all.js`**: 全 `*-test.js` を子プロセスで実行しPASS/FAIL集計・失敗末尾表示・非ゼロ終了。`--quick`(実測3秒未満サブセット)/`--engine`(auto-sim 20年ステージ)/名前フィルタ対応。assert無しプロファイラ(`decay-longevity-test.js`)は EXCLUDE で除外。
- **新規 `test/stale-lint.js`**: `VAR.includes('literal')` 型のソース文字列アサーションを静的走査し、対象文字列が現ソースに存在しないものを "stale" として可視化。silent rot を検出可能に。
- **新規 `test/helpers/source.js`**: `readSource()`(CRLF吸収・テストのソース読取はこれ経由に統一)/`manifestVersion()`(バージョンの単一真実源)。
- **新規 `test/README.md`**: 陳腐化を避ける執筆規約(振る舞い検査優先/readSource必須/バージョン非ハードコード/モックは実Engineと形を合わせる)。
- **npm scripts**: `test`/`test:quick`/`test:stale`/`test:engine` を追加(既存は温存)。
- **壊れていた4本を修正**: version-consistency(manifest真実源化)/opening-scene-ui(team-bubble追従)/event-match-result-popup(readSourceでCRLF吸収)/junior-tournament-watch-fix(モックEngineに mq.finalize スタブ追加)。全PASS確認。
- **検証**: `node test/run-all.js` = 85本中 81 PASS / 3 FAIL(=音声・PPV-TV改修による既知の陳腐化、実バグではない) / 0 TIMEOUT。stale-lint = 466アサーション中 stale 0。auto-sim 60年 ALL CLEAR。
- 未了(次工程): stale-lint の被覆拡張(`section()` 抽出・`.strictEqual` マッピング idiom を見逃す盲点あり)、音声/PPV陳腐化3本の現状追従(再生実確認込み)。→ **下記の続きで完了**。

## 2026-07-24 検査体制 続き: stale-lint 被覆拡張 + 音声/PPV陳腐化3本の追従(→ npm test 完全緑)

上記の未了2件を処理。対象: `test/` のみ(ゲームコード無改変)。3本は機能確認のうえ陳腐化リテラルのみ追従、実バグなし。

- **show-result-summary-theme**: `renderPPVTVResult`→`renderPPVTvBroadcast`(ui-common.js:6233、同一シグネチャ・PPV-TV五幕中継リビルドでの改名)へ追従。テーマ/CSSアサーションは現状維持を確認。readSource化。
- **special-tournament-fanfare**: 優勝ファンファーレのファイルが音声改修phase1で `f10_victory_fanfare_v5.mp3`→`production-ogg/wm_se_rs04_v01.ogg`(WM-SE-RS04)へ差替。`playJingle('championship')`(app.js:692、_playAutumnWarChampionFanfareから)/MVPの`matchVictoryFanfare`分離は健在を確認。現行ファイルへ追従、readSource化。
- **stage-bgm-state**: `resolveActiveStageBgm` ロジックは不変、`STAGE_BGM.bigMatch` のマッピングが `iwashiro_elevate_perfect.ogg`→`production-ogg/wm_bgm_m04_v01.ogg`(WM-M04)へdrift(wm-audio-map.jsonと一致確認)。リテラル追従、readSource/readJSON化。
- **stale-lint 拡張**: (1)section抽出idiom(`section(src,start,end)`/`extractFunction`/`VAR.indexOf('literal')`)の開始マーカー不在検出、(2)equality-vs-source(`assert.strictEqual(x,'path-like')` でファイル不在のパス文字列を検出)。既存 `.includes()` 検出は温存。85本に誤検出なしを確認。
- **検証**: `node test/run-all.js` = 84/84 PASS・0 FAIL・0 TIMEOUT。`node test/stale-lint.js` = 315検査/87スキップ/stale 0。これで `npm test` がゲーム健全性の信頼できる単一シグナルになった。

## 2026-07-24 オープニング完了演出→メインメニュー遷移の引っかかりを修正

旗揚げ5人の集合写真オーバーレイをクリックして本編へ移る際、`refreshAll()`(メインメニュー描画)がフェード完了後の`setTimeout`内にあったため、1秒のフェードアウト中は背後に残った旗揚げメンバー選択画面が透けて見え、「選ぶ前の画面が一瞬出てからメニューへ移る」引っかかりになっていた。対象: `src/app.js`(完了演出クリック処理)。修正: オーバーレイがまだ不透明なうちに`Audio.bgm.play('management')`/`Storage.autoSave()`/`refreshAll()`を先に実行して背景をメインメニューへ差し替えてからフェードアウトさせる順に入れ替え。透けて見えるのが本編になり滑らかに切り替わる。あわせて連打による二重遷移防止ガード`_leaving`を追加。UI-onlyのためauto-sim不要。実機確認(通しプレイ)はKeisukeに委任。

## 2026-07-24 Cloudflare版Patreon認証: クリエイター本人が締め出される設計穴を修正

7/17実装のPatreonゲートはセッション7日で失効し再ログイン時に「有効な支援メンバーシップ」を要求するが、**クリエイター本人は自分のキャンペーンの支援者ではない**ため本人が弾かれる(7/24にちょうど7日で顕在化。当日のMQ再設計pushとは無関係と切り分け済み)。恒久修正: OAuthスコープに campaigns を追加し、identity の所有キャンペーンが PATREON_CAMPAIGN_ID と一致すれば本人として自動通過(functions/_lib/auth.js)。保険として PATREON_ALLOW_USER_IDS(カンマ区切り許可リスト)を新設し、ログイン失敗画面に本人のPatreonユーザーIDを表示するようにした(callback.js)。既存の ADMIN_PASSWORD 非常口は維持。支援者側の判定ロジックは不変。修正デプロイ後、本人ログイン復旧を実機確認済み。

## 2026-07-24 MQ再設計 全工程完了 — specs/mq-system-spec-v1.0.md へ昇格・push

朝の設計対話から始めたMQ回収の全工程(P1経路一本化/P2上限撤廃+記録制/P3a超過レイヤー/P3bリング内化/P3c観客帯×注目度+会場の器+ドームメイン大一番+OV100超減衰/P3d物差し再較正/P3e記録シングル・タッグ分離/P4大ニュース基盤/P5新記事3種/P6記事文面5種承認)が**1日で完了**。確定仕様を `specs/mq-system-spec-v1.0.md` に昇格(§9不変条件表は最終実測で確定: 11本中、実測達成9・合成検証達成1・実機確認事項1[王座戦優位])し、CLAUDE.mdのspecs索引に追記。設計経緯の正は docs/mq-redesign-proposal-v0.5.md。実装体制: 設計・数値=フェーブル/実装=Codex(P1-P2)+Sonnetエージェント(P3以降)/記事=Opus+Keisuke全文レビュー。Keisuke指示により本コミットで**push実施**(Cloudflare Pages自動デプロイ)。実機確認事項: P4週頭通知一式(SE/モーダル/バッジ)・一面レイアウト(ぶち抜きタッグ/2人並びfatedRivals)・王座戦MQ優位の体感。

## 2026-07-24 MQ再設計 P5補: fatedRivals一面の2人並び写真

前提HEAD=d29cb9c(P5着地時点。fatedRivalsはnp-top-story単数写真流用のためKeisuke確認項目として2人並びが宿題化していた)。対象: `src/ui-render.js`。

- `_npSpringTagStoryIds`(既存、springTagResult優勝ペア用の2人ID解決関数)のガードを`fatedRivals`にも拡張。`story.characterIds`から直接2件取得できる場合はそのまま返し、springTagLeague/bestTagTeamからの旧セーブ救済ロジックは`springTagResult`専用のまま維持(fatedRivalsは常にcharacterIdsを保持しているため不要)。
- 描画側(`np-top-story`の`else if`分岐)は元々`isTagPhoto = tagPhotoIds.length >= 2`で`_npTopTagPhotoHtml`に切り替える設計だったため、上記1点の変更だけでfatedRivalsも自動的に2人並び(58%幅・中央重ね、`.np-top-tag-photo-member-1/2`)になる。新規CSSは追加していない。
- **流用元の選択**: `_npRenderBignewsTag`(mqTagRecord専用の上下ぶち抜き大記事)ではなく、`springTagResult`が使う通常`np-top-story`内の2人並び写真枠を流用。理由: fatedRivalsは元々P4/P5でも通常`np-top-story`分岐(単数写真)で描画される設計であり、`_npRenderBignewsTag`はmqTagRecord固有の「記録更新」専用レイアウトとして新設されたもの(P4 worklog参照)。既存の設計意図(fatedRivalsは通常一面枠+2人写真)に沿う前者を選んだ。
- **反転の扱い**: 反転は行わない。`_npTopTagPhotoHtml`が使う画像は`getUpperUrl`(アッパー)→`getPortraitUrl`(顔)のみで、2026-07-18裁定によりアッパー/顔画像の反転は禁止のため、springTagResultの前例と同様に非反転のまま採用。

**検証**: `node --check src/ui-render.js` pass。`test/spring-tag-newspaper-team-photo-test.js`(既存、`_npSpringTagStoryIds`の文字列抽出テスト)PASS維持——関数名・シグネチャは変更していないため影響なし。`test/mq-bignews-templates.js` ALL CLEAR。シミュレーション系(auto-sim)は表示層のみの変更のため未実施。

**Keisuke確認項目**: fatedRivalsは「trainCapOVR≥117の新人2名(年齢差1歳以内)が入団し、後発側がデビュー戦(初勝敗)を迎える」という条件でのみ発火する稀イベントのため、最短の実機確認手順は無い(自然発生を待つか、該当条件のロスターを意図的に用意してプレイする形になる)。見た目確認は一面の2人並び写真(springTagResult優勝ペアと同じレイアウト)が意図通りか。

コミット: (このログ追記後にローカルコミット。ハッシュは完了報告参照)

## 2026-07-24 MQ再設計 P5: 大ニュース新記事3種(大物ルーキー/期待のライバル/トップ王者重傷)+ドキュメント整合

`docs/mq-redesign-proposal-v0.5.md` §5.1/§5.4 / `docs/bignews-article-drafts-v1.0.md`(正本、§2-4)。前提HEAD=408aad7(P4着地: BIG_NEWS_TYPES/industryNewsキュー/週頭PU/一面ジャック稼働中)。対象: `src/data.js`/`src/management.js`/`src/app.js`/`src/ui-common.js`/`test/auto-sim.js`/`test/mq-bignews-templates.js`/`docs/design-decisions.md`/`docs/game-system-roadmap.md`。

**1. 記事テンプレ・大ニュース判定集合（`src/data.js`）**:
- `NEWS_HEADLINE_TEMPLATES`に`hotProspectDebut`/`fatedRivals`/`topChampionInjury`を`bignews-article-drafts-v1.0.md`から一字一句そのまま追加(各3バリエーション)。
- `BIG_NEWS_TYPES`に3種を追加(計5種)。`BIG_NEWS_LEAD_LINES`に週頭ポップアップの号外リード(各2バリエーション)を追加。

**2. hotProspectDebut/fatedRivals — 「入団時フラグ→デビュー戦検出」方式（`src/management.js` `Engine.mq`）**:
- 設計の要点: 既存ロスター(旧セーブ・AI団体の経歴事前史)を誤ってデビュー扱いしないよう、フラグは**入団コミット直後にのみ**新設`registerBignewsHire(state, fighter)`で立て、「wins+losses+draws===0 かつ careerSeasons===0」の正真正銘の未経験者だけを対象にする(移籍・戦力外復帰などの経験者はこのガードで自然に除外される)。trainCapOVR>=117(`FATED_RIVAL_TCOVR`)で`_bignewsProspect`フラグ、>=125(`HOT_PROSPECT_TCOVR`)かどうかは発火時に再判定。
- fatedRivalsのペア候補プールは`state._fatedTalentPool`(`{id,age}`配列)。入団時、年齢差1歳以内(`FATED_RIVAL_AGE_DIFF`)の未ペア候補がいれば即ペア形成し`_fatedRivalPartnerId`を後発側に付与、プールから相方を除去。ペア形成は`state._fatedRivalsFormedSeason`で年1回に制限(§5.4「同年に複数ペア成立なら最初の1組のみ」)——ペア不成立の候補はプールに残り翌シーズン以降に持ち越せる。
- 毎週`tickWeek`末尾(新聞生成直前)で新設`scanBignewsDebuts(state)`が全ロスター(プレイヤー+AI団体)を横断走査し、`_bignewsProspect`かつ総試合数(wins+losses+draws)が1以上に転じた選手を「デビュー戦を終えた」と判定。tcOvr>=125なら`hotProspectDebut`、`_fatedRivalPartnerId`が設定されていれば相方を`_findFighter`で解決して`fatedRivals`を記事化。発火有無に関わらずフラグは消費(一度限り)。
- 入団コミット箇所への配線: `src/app.js`(初期ドラフト/FA署名/ロスター超過時FA・スカウト解決/スカウト成立/スカウト競り負けAI移籍)、`src/ui-common.js`(ドラフト交渉プレイヤー落札/AI落札、非選択候補のバックグラウンド自動セリ2箇所)。AI団体のFA自動獲得(`Engine.rival.aiFAAcquire`/`aiMidseasonFAAcquire`)は戻り値契約の変更が必要になるため**今回は対象外**(スコープ限定。ドラフト/スカウトが主要チャネルのため実害は小さいと判断)。
- `{result}`(白星/黒星)は`lastMatchResult`から、`{orgName2}`の「同門」置換(fatedRivals同一団体時)はdata生成時点で文字列を直接「同門」にすることで実現(テンプレ側は無変更)。

**3. topChampionInjury — スナップショット差分方式（`src/management.js` `Engine.mq`）**:
- **調査結果**: 王座保持は`state.titles.world.championId`(プレイヤー)/`state.aiOrgs[orgId].titles.world.championId`(AI、既存構造)で追跡済み。怪我の重篤度は`INJURY_TABLE`(軽傷/中傷/重傷、既存)の3段階のみ存在し、「重傷以上」=最重段階の「重傷」(6〜8週欠場)がそのまま閾値になる。ただし怪我判定自体は**通常興行(プレイヤー画面`App._finalizeShowImpl`系+AI週次`Engine.rival.processAIWeek`)の試合内負傷のみ**実装されており、PPV/ジュニア/春タッグ/秋勝ち残り/天頂戦には怪我判定のコードが元々存在しない(既存実装の制約であり今回新設していない)。よって追跡範囲は「プレイヤー/AI団体とも通常興行の試合内重傷」に限定される。
- 実装: `tickWeek`冒頭で新設`snapshotChampionInjuries(state)`が週内処理前の各団体(プレイヤー+AI全団体)の現王者の怪我typeを記録。週末(新聞生成直前)で新設`checkTopChampionInjury(state, snapshot)`が、`state.rankings`のrank1/2の団体について「王座保持者が同一(交代週は同定不能として対象外)かつ現在injury.type==='重傷'かつスナップショット時点では重傷でなかった(新規発生)」を判定して記事化。継続中の重傷での再発火は起きない。

**4. ドキュメント整合**:
- `src/data.js`の「名勝負製造機」説明文「MQ+1〜5」は**既に前コミット(714834c)で修正済み**と確認(現況「試合がたまに大化けする。キックアウトやカウンターが生まれやすい」で実装実態と一致)。追加修正は不要と判断。
- `docs/design-decisions.md`の「MQスコア」節を全面書き換え: 旧v2.0(2経路併存+固定加算+外部+12キャップ)の記述を、MQ再設計P1〜P4後の実態(`Engine.mq.finalize`一本化/profile方式/外部加算はcrowd(観客の熱×注目度)のみ・因縁・タイトル・trust・バフ・ラストランは全てリング内化またはコンディション化/上限撤廃+`mqRecord`/`mqRecordTag`記録制/OV100超減衰シーリング/超過レイヤー)に合わせて置換。因縁節・引退勧告(ラストラン)節も連動更新。mq-inventory-report.md §5の食い違い一覧のうち現在も参照可能な項目は本改訂で解消。
- `docs/game-system-roadmap.md`: MQ再設計サマリをP5完了に更新。「大物ルーキー&期待のライバル一面演出」起案節を実装完了ステータスへ短縮。

**検証**: `node --check`全対象pass。`test/mq-bignews-templates.js`拡張(新設3種のテンプレ変数展開・未置換なし/同門置換/registerBignewsHire→scanBignewsDebutsの発火経路(初回スキップ→デビュー戦発火→フラグ消費→再発火なし)/経験者ガード/fatedRivalsペア形成・年1回制限・同一団体判定/checkTopChampionInjuryの新規発火・継続中不発火・低ランク対象外、全項目PASS)。`node test/auto-sim.js 40 42`×2回 ALL CLEAR(violations 0/errors 0)、新設3種は40シーズンでは0件(稀イベントのため想定内。合成イベントテストで発火経路を検証済み)。`test/auto-sim.js`に3種の生成回数カウンタを追加(既存mqAllTimeRecord/mqTagRecordカウンタと同じ形式)。

**Keisuke確認項目**:
- UIの見た目は未確認(委任): 新設3種の一面記事レイアウトはP4の`np-top-story`(単数/写真1枚)をそのまま流用しており専用レイアウトは無い。fatedRivalsは2名関係の記事だが現状写真は`characterId`(後発側)1枚のみ表示される可能性がある(春タッグ写真枠の2名表示ロジックは`springTagResult`専用のため今回は流用していない)。見た目が要件と合うか確認をお願いしたい。
- 週頭ポップアップ(号外)・一面ジャックの実機表示、SE`bignews`の鳴動を各type 1回ずつ確認いただきたい(合成データでの確認のみで、実プレイでの発生頻度は「稀」設計のため長期プレイでないと自然発生を見られない可能性が高い)。

コミット: (このログ追記後にローカルコミット。ハッシュは完了報告参照)

## 2026-07-24 MQ再設計 P4: 大ニュース新聞システム基盤

`docs/mq-redesign-proposal-v0.5.md` §5 / `docs/bignews-article-drafts-v1.0.md`(正本) / `specs/newspaper-and-orgcompare-spec-v2.0.md`。前提HEAD=58c7c2a(P1〜P3e着地済み)。対象: `src/data.js`/`src/management.js`/`src/app.js`/`src/ui-common.js`/`src/ui-render.js`/`src/index.html`/`test/auto-sim.js`/新規`test/mq-bignews-templates.js`。

**1. BIG_NEWS_TYPES・記事テンプレ（`src/data.js`）**:
- `BIG_NEWS_TYPES = new Set(['mqAllTimeRecord', 'mqTagRecord'])`。P5で`hotProspectDebut`等を追加する前提のコメント付き。
- `NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord`/`.mqTagRecord`を`bignews-article-drafts-v1.0.md`から一字一句そのまま追加(各3バリエーション)。`mqTagRecord`の`｜`区切りはテンプレ文字列側は変更せず、描画側で段落展開。
- `BIG_NEWS_LEAD_LINES`(週頭ポップアップの号外リード、正本の2バリエーション×2type)を新設。

**2. 記録更新→記事化キュー（`src/management.js` `Engine.mq`）**:
- `updateRecord`を「数値記録更新」と「記事化」に分離。数値更新(`state.mqRecord`/`mqRecordTag`書き換え)は既存のまま、成立時に新設`_pushRecordNews`を呼んで`Engine.industryNews.push`経由でキューへ積む。**旧記録値(prevRecord)は上書き前の`current.value`から捕捉**。
- `_pushRecordNews`はシングル/タッグで分岐: シングルは`metadata.winnerId`必須、タッグは`metadata.winnerIds`(2件)必須。**いずれも解決できない場合(ドロー等)は数値記録のみ更新し記事化を静かにスキップ**する設計(記事は書けないが記録は嘘をつかない)。
- タッグの変数充填規則(`{nameA1}`=勝者組OVR上位)を`_sortByOvrDesc`で実装。名前解決は`_findFighter`(roster/aiOrgs/freeAgents/retiredFighters を順に走査)経由、`{stage}`は`STAGE_LABELS`(normal/ai/ppv/junior/tenchosen/springTag/autumnWar→日本語)、`{orgName}`は勝者(タッグはエース)の所属組織名。
- 全10箇所の`Engine.mq.updateRecord`呼び出し(aiWar/aiB3Challenge/B2団体内紛/AI週次_lastMatchResults/通常興行/PPV/ジュニア/天頂戦/春タッグ/秋勝ち残り)に`winnerId`(シングル)または`winnerIds`(タッグ)を追加。各呼び出し元の既存`matchResult.winner`(またはjunior/tenchosen/autumnWarの`match.winnerId`)からその場で導出するのみで、新規シミュレーションは行わない。
- `Engine.newspaper.PRIORITY`に`mqAllTimeRecord:320`/`mqTagRecord:310`を追加(leagueElevation 300より上=一面保証)。
- `Engine.newspaper.generate`の`industryEvents.forEach`が積むstoryに`newsData: data`(テンプレ変数の生値)を追加(既存呼び出しへの副作用なし、週頭PUの号外リード{mq}展開に使用)。
- `generate()`の返却値に`isBigNews: topStory.type ∈ BIG_NEWS_TYPES`を追加。

**3. 一面ジャック描画（`src/ui-render.js`/`src/index.html`）**:
- `mqAllTimeRecord`は既存`np-top-story`型(勝者1名upper写真)をそのまま流用(`ts.characterId`=winnerId)。
- `mqTagRecord`は新設`_npRenderBignewsTag`で「上下ぶち抜き大記事」を描画: `springTagResult`の優勝ペア写真(58%幅・中央重ね)の実装パターンを流用した全幅フォトバー(`np-bignews-photobar`)+`np-sec-gold`ラベル+2段落本文(`_npSplitBignewsBody`で`｜`をパラグラフ配列へ展開、後半に`np-bignews-praise`装飾)。CSSは`np-bignews-*`接頭辞で新規、既存の新聞ハードコード配色(#8b1a1a/#d4a82a等)に合わせて統一(新聞画面は階層1確立前からハードコード配色が既定のため、既存トークンに追随)。

**4. 週頭通知（`src/app.js`/`src/ui-common.js`/`src/index.html`）**:
- SFX`bignews`を新設: 既存`notify`(C6→F6 2音)にベル系スパークル(`bellPartial`2発+`noiseHP`)を重ねた合成。`SE_MIX.bignews=.58`。
- `App._maybeShowBigNewsPopup(delay)`: `weeklyNewspaper.isBigNews`かつ週単位で未通知の場合のみ`G._bigNewsNotifiedWeek`を立てて1回発火。`closeShowResult`(興行後)/`processWeek`(非興行週)双方の末尾、他ポップアップの後段に追加(`_isPopupActive`/`_popupQueue`パターンに乗る`showBigNewsPopup`側が実際の順序調整を担う)。
- `showBigNewsPopup`(`src/ui-common.js`): 既存の汎用D型モーダル(`_mdlDOpen`/`.mdl-d-box.cream`、Office Cream Panel)に新聞アイコンドロップインアニメ(`.bignews-icon-dropin`)+号外リード1行+「紙面を読む」(→`showScreen('newspaper')`)/「あとで」の2ボタン。
- 未読バッジ: ナビ📰ボタンに`#newspaperBadge`(`.nav-badge-dot`、`var(--red)`)を追加。`refreshTopBar()`で`G._bigNewsUnread`に応じて表示切替、`showScreen('newspaper')`で消灯。既存セーブにフィールドが無い場合はfalsy判定で自然に非表示(不在データ説明文は出さない)。

**5. 検証**:
- `node --check`全対象pass。
- 新規`test/mq-bignews-templates.js`: 合成の記録更新イベント→`Engine.mq.updateRecord`→`NEWS_HEADLINE_TEMPLATES`展開まで通し、全stage×全バリエーションで未置換`{変数}`が残らないことを確認。タッグのエース優先充填規則(勝者組OVR上位が`{nameA1}`)、winnerId不明時の記事化スキップも回帰化。
- `test/auto-sim.js`に大ニュース記事生成カウンタ(`mqAllTimeRecordNewsCount`/`mqTagRecordNewsCount`、topStory.type基準)を追加。
- `node test/auto-sim.js 40 42`: **ALL CLEAR**(violations=0/errors=0)。大ニュース記事生成=シングル4件/タッグ2件(既存`mqRecordProbe`の更新回数4/2と完全一致=全経路でwinnerId/winnerIds解決が機能している確認)。

## 2026-07-24 MQ再設計 P3e: 記録のシングル/タッグ分離+スタート値

`docs/mq-redesign-proposal-v0.5.md` §2.2/§3.9不変条件8。P3d-2の直後に着手。対象は`src/management.js`(`Engine.mq`)/`src/app.js`/`test/auto-sim.js`。

**1. 記録の分離**（`src/management.js` `Engine.mq`）:
- `SINGLE_RECORD_START=90`/`TAG_RECORD_START=94`を新設。
- `createRecord(startValue=SINGLE_RECORD_START, value)`にシグネチャ変更(旧: `createRecord(value=100)`、フロア100固定)。
- `updateRecord`は`metadata.matchType==='tag'`で`mqRecordTag`、それ以外(既定)で`mqRecord`に振り分け。フロアもキーに応じてSINGLE/TAG_RECORD_STARTを使用。
- 全10箇所の`Engine.mq.updateRecord`呼び出し(aiWar/aiB3Challenge/B2団体内紛/AI週次/通常興行/PPV/ジュニア/天頂戦/春タッグ/秋勝ち残り)に`matchType`を明示付与。通常興行のみ`result.matchType==='tag'?'tag':'singles'`で動的判定(既存の`holderIds`分岐と同じ条件式)、春タッグのみ`'tag'`固定、他は全て`'singles'`固定(タッグ形式が存在しない経路のため)。

**2. セーブ移行**（`Engine.mq.migrateRecordV2`、`src/app.js`で`migrateRecord`の直後に実行）: 新フラグ`_migrated_mq_record_v2`で1回限り。
- 既存`mqRecord`が更新済み(value>100 かつ holderIds あり)かつ`holderIds.length>=3`→実はタッグの更新だったとみなし`mqRecordTag`へ移設(floor=max(94,value))、`mqRecord`は全キャラ`careerBestMQ`実測値からシングルfloor(90)で再初期化。
- 更新済みかつ`holderIds.length<=2`→`mqRecord`はそのまま(90へのフロア引き上げはしない)、`mqRecordTag`は実測値からタッグfloor(94)で新規初期化。
- 未更新→両方とも実測値(共通の走査値)から各floorで再初期化。
- 新規ゲーム(`createInitialState`)は`mqRecord`/`mqRecordTag`を最初からfloor通りに生成し、両マイグレーションフラグをtrueで初期化(移行不要)。

**3. 計測系の追随**:
- `test/auto-sim.js`の`mqRecordProbe`を`updatesSingle`/`updatesTag`に分離収集し、ログ出力(`MQ All-Time Record Probe`/`mqRecord更新回数`)をシングル/タッグ別+合算の両方で表示するよう変更。
- `test/mq-record-trajectory.js`は変更なし(元々`Engine.mq.updateRecord`をフックしてmatchTypeを独自分類する完全独立スクリプトのため、分離後もそのまま利用可能)。

**4. 軌跡再計測**（`node test/mq-record-trajectory.js`、40シーズン×5シード: 42/7919/15838/23757/31676、P3後の現行コードで再実行）:

シングル(start=90): 初更新シーズン S5/S7/S10/S7/S5 → **中央値S7**。10年区間別更新回数(5シード平均): S1-10=1.80 / S11-20=1.40 / S21-30=0.20 / S31-40=0.00。

タッグ(start=94): 初更新シーズン S13/S17/S14/S14/S10 → **中央値S14**。10年区間別更新回数(5シード平均): S1-10=0.20 / S11-20=0.80 / S21-30=0.00 / S31-40=0.20。

不変条件8(初更新中央値S4〜8/最初の20年で10年あたり0.5〜1.5回/以後逓減)との対比(**報告のみ・数値変更なし**):
- シングル: 中央値S7は範囲内。ただしS1-10の更新回数1.80/10年は上限1.5をやや超過。S21-30以降は0.20→0.00と逓減し条件を満たす。
- タッグ: 中央値S14は範囲(S4-8)から外れて後ろ倒し。S1-10の更新回数0.20/10年は下限0.5を下回り、S11-20で0.80に上がってから0.00/0.20と不規則。タッグのスタート値94は不変条件8の想定より「更新が遅く・少ない」方向にずれている。判断は設計側(Keisuke)に委ねる。

**5. 検証**: `node --check`全対象pass。`node test/auto-sim.js 100 42`(フォアグラウンド)→**ALL CLEAR ✓**、★分布は前段(P3d-2)の採用値と一致(★1=0.2%/★2=1.4%/★3=14.3%/★4=66.0%/★5=18.0%、n=2005)、mqRecord更新内訳=シングル4件/タッグ2件(合算6件/100季)。P3e自体はmqRecord/mqRecordTagへの書き込み先を変えるだけの副作用のない変更(RNG消費なし・他コードから未参照)のため、★分布・fp帯はP3d-2確定時の実測をそのまま流用可能と判断し重複実行はしていない。

別シード再現性チェック(`node test/auto-sim.js 40 7919`、P3d-2のグリッド探索中に採取した同一コード相当の実測値を流用):
- fp最上位帯(+1.0): seed42(100季,n=2005)=4.79% / seed7919(40季,n=803)=7.35% → 差2.56pt(±5pt内)
- ★5: seed42=18.0% / seed7919=13.2% → 差4.8pt(±5pt内)
- ★3: seed42=14.3% / seed7919=20.3% → **差6.0pt(±5pt をやや超過)**。40季(n≈800)のサンプルサイズによる振れと判断されるが、数値は変更せず報告のみ

## 2026-07-24 MQ再設計 P3d-2: ★評価の微調整(expectedMQTotal再々較正+星5カット追加ノブ)

P3d直後の実測で★5=31.9%(目標21%)が過多だった件の是正。`docs/mq-redesign-proposal-v0.5.md`は変更なし(§3.8a後の追加チューニングのため本作業はworklogのみで報告)。対象は`src/data.js`(`SHOW_RATING_CONFIG`)と`test/mq-p3c-unit.js`。

**1. グリッド計測**(`node test/auto-sim.js 100 42`、`expectedMQTotal`を6試合基準200/205/210/215で同率スケール・丸めして4本測定):

| 基準値(6試合) | ★2 | ★3 | ★4 | ★5 | 備考 |
|---:|---:|---:|---:|---:|---|
| 200(現状) | 1.2% | 10.1% | 56.8% | 31.9% | ★5過多 |
| 205 | 1.3% | 21.6% | 63.2% | 13.9% | ★3過多・★5過小 |
| 210 | 1.2% | 11.3% | 59.0% | 28.5% | ★5のみ超過、他3帯はボックス内 |
| 215 | 1.5% | 19.0% | 60.0% | 19.4% | ★5はボックス内だが★3過多 |

目標ボックス(★5=19〜23%/★3≤15%/★4≥57%/★2≤2%)にexpectedMQTotal単独で収まる値はグリッド内に無し。回収前基準(★2 0.9/★3 11.0/★4 67.0/★5 21.0)との絶対差合計は210が最小(16.1、次点215=17.2)、かつ210はボックス違反が★5のみに限られる(★2/★3/★4は既にボックス内)ため210を土台に採用。

**2. 追加ノブ(★5側カット比率)**: `starThresholds`の★5閾値(既定82、venue階層オフセット加算前の基準)をexpectedMQTotal=210のまま動かして再測定。

| 星5閾値 | ★2 | ★3 | ★4 | ★5 |
|---:|---:|---:|---:|---:|
| 82(既定) | 1.2% | 11.3% | 59.0% | 28.5% |
| 82.5 | 1.0% | 14.1% | 56.8% | 28.0% |
| 83 | 1.4% | 14.3% | 66.0% | 18.0% |
| 85 | 1.0% | 15.5% | 74.1% | 9.3% |

82→82.5間はほぼ横ばいだが82.5→83間で★5が28.0%→18.0%へ急落する非線形な転移が見られた(★評価→orgPop→翌週以降のカード品質という長期フィードバックループによる感度と考えられる)。83は★2/★3/★4が全てボックス内に収まり、★5(18.0%)のみ目標下限19%をわずか1pt下回る、グリッド全体で最も近い着地点のため採用。

**採用値**: `expectedMQTotal: [0,0,105,143,172,191,210,229,248]`(6試合基準210)、`starThresholds[0].min: 82→83`。

**3. mq-p3c-unit.js の合格基準修正**: 不変条件1合成カード検証のσ厳密一致判定(`Math.abs(sigma-0.9428...)<1e-9`)を、crowd値が`round(venueHeat×engagement)`の整数丸めを経るため理論上限が0.9428であり、これは特定のfighter構成が理論上限ちょうどを叩く偶然に依存した過剰に厳しい基準だったため、`sigma>=0.9`に緩和。コメントに丸め制約の理由を明記。

**4. 最終検証**: `node --check`全対象pass。`node test/auto-sim.js 100 42`(フォアグラウンド)→**ALL CLEAR ✓**、★1=0.2%/★2=1.4%/★3=14.3%/★4=66.0%/★5=18.0%(n=2005)。`node test/mq-p3c-unit.js`→PASS(64アサーション)。

## 2026-07-24 MQ再設計 P3d: 物差し再較正（§3.8a確定数値の適用）

`docs/mq-redesign-proposal-v0.5.md` §3.8a(フェーブル確定・数値変更なし)を適用。対象は`src/data.js`/`src/ui-render.js`/`test/`のみ、`management.js`/`match-engine.js`は未変更。

**1. fp帯の最終値**（`src/data.js` `FILL_PRESSURE_BANDS`）: 実測percentile(p90=2.233/p10=1.041/p5=0.914)に基づき閾値を全面更新。+1.0:≥2.25 / +0.5:1.90〜2.25 / 0:0.95〜1.90 / -0.5:0.70〜0.95 / -1.0:<0.70(旧: 1.30/1.05/0.85/0.55)。

**2. 表示系の再較正**:
- `SHOW_RATING_CONFIG.expectedMQTotal`(`src/data.js`): 220→200(6試合基準)。他試合数(index2〜8)も同率×(200/220)で丸めて再較正: `[0,0,100,136,164,182,200,218,236]`(旧`[0,0,110,150,180,200,220,240,260]`)。
- `EXPECTED_MQ_BY_VENUE`(`src/ui-render.js`): 全段base -4(26〜61)、cap 80→76。popCoefは不変。

**3. 経路一致テストの更新**(`test/mq-finalize-parity-test.js`): 旧契約(`crowdVenueBonus`直読み・milestoneBuffs直接加算)を前提にした期待値が、P3b/P3c以降の新契約(因縁/タイトル/trust/バフ/ラストランはリング内化済み・finalize外部加算はcrowd=venueHeat×engagementのみ)と乖離し全滅していたため、新契約に合わせて5シナリオ(通常シングル・次戦バフ消費・下限クランプ・タッグ・ppv/ai-show/raw)を書き直し、UI経路(`App._finalizeShowImpl`)とheadless経路(`Engine.executeShow`)の同一入力→同一MQ/inventoryを再び固定。

**4. 不変条件1の合成カード検証**(`test/mq-p3c-unit.js`に追加): 中規模会場(venueIdx4)・fp=2.30(≥2.25の最上位帯)で「スターのメイン(人気85・タイトル戦)/中堅のセミ(人気65)/新人の前座(人気40)」の3試合カードを合成し、①同一値が全試合に乗る旧バグが解消していること(crowd値がバラける)②メインが最高の観客寄与を得ること③このカード規模(3試合・crowdは整数丸め)での population σ が到達可能な理論上限0.9428(crowdVals=[4,2,2])に一致することを固定。整数丸めの制約上、この最小カードではσ=1.0ちょうどには届かない(auto-sim側の集計値は別途本体で計測)。
- fp帯の境界値テスト(同ファイル既存分)も新§3.8a閾値(2.25/1.90/0.95/0.70)に合わせて更新。

**5. 検証・計測**(`node test/auto-sim.js 100 42`、フォアグラウンド実行、**Result: ALL CLEAR ✓・不変条件違反0**):

| ★帯 | 回収前基準 | 今回実測 | 差分 | ±5pt以内 |
|---|---:|---:|---:|:---:|
| ★2 | 0.9% | 1.2% | +0.3pt | ✅ |
| ★3 | 11.0% | 10.1% | -0.9pt | ✅ |
| ★4 | 67.0% | 56.8% | -10.2pt | ❌ |
| ★5 | 21.0% | 31.9% | +10.9pt | ❌ |

★3の歪みは狙いどおり大幅是正(19.7%→10.1%、目標11.0%にほぼ一致)されたが、★4→★5側へ質量が想定以上に移動し、★4/★5は逆方向に±5ptを超過。**§3.8aの数値は変更せず、実測結果としてそのまま報告**(フェーブル決定値のため調整は次工程の判断)。

- fp帯別興行割合(n=2005): +1.0=8.88% +0.5=18.35% 0=67.93% -0.5=3.44% -1.0=1.40%。最上位帯8.88%は不変条件10(≤15%)を満たす
- 通常興行平均MQ: 52.98(想定54±1.5の範囲内)
- mqRecord更新回数: 1/100シーズン(0.10/10シーズン)
- 不変条件1(興行内・試合間の観客寄与σ): mean=0.120(目標≥1.0、NG)。**P3d適用前(HEAD時点、fp帯変更前)でも同条件でmean=0.292のNGを確認済みで、今回変更による新規劣化ではない**。engagementの振れ幅設計(calcEngagement/management.js)自体の課題であり、本タスクのスコープ外(management.js不変更方針)として報告のみ
- 不変条件4(因縁MQ優位): 1.098(目標+1.0〜+2.5、達成)。不変条件6の観察比較(-9.217pt)は選択バイアスを含むため判定不使用(§3.9注記どおり)。回帰テスト`test/mq-ring-calibration.js`(同一seed対照)は全条件±0.5pt以内でPASS

**検証コマンド**: `node --check` 全対象pass / `test/mq-p3c-unit.js`(65アサーション)・`test/mq-finalize-parity-test.js`・`test/mq-ring-calibration.js` 全PASS。

## 2026-07-24 MQ再設計 P3c: 観客帯×注目度+会場の器+OV100超減衰+付随5項目（本丸実装）

`docs/mq-redesign-proposal-v0.5.md` §3.2/§3.2b/§3.4/§3.4b/§3.7b・§3.9不変条件に基づき、P3b着地後の残り7項目(A〜G)を実装した。

**A. OV100超の減衰シーリング**（`src/match-engine.js`）: シングル/タッグで重複していたceiling計算を`Engine.battle.ovCeiling(avgOV)`へ共通化し、第4セグメント`avgOV>100: 100 + 0.25×(avgOV-100)`を追加。avgOV<=100の3セグメントは既存式のまま(境界100で連続、単体テストで固定)。

**B. タイトル戦カウンター補強**（`src/match-engine.js`）: `TITLE_RING_COUNTER_BONUS=4`を追加し、`ringCounterBonus`にタイトル戦分を合算（名勝負製造機・因縁と同じ既存キャップ共有）。`test/mq-ring-calibration.js`を現行実装で再実行し、実装経路(`titleMatch:true`)の勝率歪みは-0.3pt(目標±2pt内、MQ寄与+1.55はescape単独時の約60倍相当)。

**C. ラストランの解体**（`src/management.js` `Engine.mq`）: `finalize`の`contributions.lastRun`を撤廃。代わりに`buildRingInOpts`へ`normalShowRingExtras`/`isMainEvent`オプションを追加し、`fighter.lastRun`が立つ選手にovBuffチャネルで実効OV+1を与える（通常興行のみ有効、PPV/AI興行はスコープ外のまま）。

**D. メイン気迫**（同上）: 通常興行メイン(matchIndex 0)の両選手にも同じovBuffチャネルで実効OV+1。ラストラン+メインが重なると+2で自然に積み上がる。

**E. 観客帯×試合注目度（本丸）**: `Engine.attendanceV2.calcAttendanceV2`に`rawDemand`(キャパクランプ前のソフトキャップ後需要)を追加し、`fp = rawDemand / capacity`として`Engine.economy.calcVenueHeat(venueIdx, fp)`を新設(`VENUE_HEAT_TIER_AMP=[2,2,2,3,3,3,4,5,5,7]`×`FILL_PRESSURE_BANDS`のpressureFactor、`src/data.js`)。旧`calcCrowdMQBonus`/`CROWD_HEAT_MQ`/`VENUE_SCALE_MQ`(会場格0〜+3の下駄)は完全廃止。`Engine.mq.calcEngagement(participantFighters, opts)`を新設し、`0.5+0.5×normPop+0.15×因縁+0.2×タイトル+0.12×メイン+0.25×ラストラン`をcap 1.25(ラストラン主演メインのみ1.4)でクランプ。`finalize`の`contributions.crowd`は`round(venueHeat×engagement)`で試合ごとに算出する形へ全面書き換え(旧: 興行一律のflat値)。`Engine.executeShow`(headless)と`App._finalizeShowImpl`(UI)の両経路で同じ計算になるよう並行改修。

**F. ドームメインの大一番化**: 通常興行が会場idx9(ドーム)のとき、メイン(idx0)の非タイトルシングル戦もmatchTier=2(ビッグマッチルール)でシミュレーションするよう、headless(`Engine.executeShow`)とUI(`App._normalShowMatchTier`、skip/watch/skipAll全経路)に実装。

**G. 鮮度の集客移管**: `Engine.freshness.attendanceMult(bonus)`を新設(+2→×1.04/-1→×0.97/-2→×0.94/-3→×0.90/-5→×0.84、-4は指示テーブルに無いため-3と-5の中間0.87で補間、bonus0は×1.0)。`Engine.attendanceV2.calcMatchAppeal`/`calcMatchAppealBreakdown`が`context.freshnessRawBonus`を受け取り、appeal合計の末尾に係数を掛けるよう変更。呼び出し元8箇所(management.js 3・app.js 1・ui-render.js 3・ui-common.js 1)に`freshnessRawBonus`を配線し、UI上の「MQ+x」表記(頭上プレビュー・鮮度タグ)も「会場の熱」「動員×倍率」表記へ更新して実態と合わせた。

**計測**（`node test/auto-sim.js 100 42`、フォアグラウンド実行411.1s、ALL CLEAR・違反0・エラー0）:
- 計測1 fp分布: p10=1.041〜p99=2.660、pressureFactor最上位帯(+1.0)が73.27%(目標10〜15%を大きく超過)。auto-simのランダムカード編成は会場規模に対して需要が過剰になりやすい母集団のため。**係数は変更せず報告のみ**
- 計測2/不変条件1 興行内・試合間の観客寄与σ: mean=0.386(目標≥1.0未達)。venueHeatは興行1本につき1値、engagementの実際の振れ幅(因縁/タイトル/メイン/ラストラン/人気差)が小さい母集団だとσが伸びにくい。**報告のみ**
- 計測3 通常興行の平均MQ着地: 55.03(想定54±1.5に収まった)
- 計測4/不変条件9 OV100超ペア発生率: 0.503%(n=213/42371)、平均上振れ+1.23・最大+3.00。avgOV<=100は式レベルで不変(単体テストで境界確認済み)
- 計測5 ドーム興行: auto-sim 100年では0件(到達せず)。`test/mq-p3c-unit.js`(新規、60アサーション)でtierAmp配列・pressureFactor帯・engagement cap(1.25/1.4)・ドームメインmatchTier=2を合成データで直接検証
- 計測6 鮮度→集客の動員影響: appeal合計ベースの近似値でmean-0.576%(想定±2%内)。マンネリ/初顔合わせ係数が実際に効いた試合は20.00%(4040/20199)

**パフォーマンス注記**: 計測6の初期実装(`Engine.freshness.calc`/`calcMatchAppeal`を横で再呼び出し)は、matchupLogが興行を重ねるほど伸びる既存の超線形コストを2重・3重にし、100シーズンの実行時間が600s予算を超過した(元コードでも100シーズンで425.8s要していたところにさらに乗った)。本番の`calcMatchAppeal`呼び出しにモンキーパッチで相乗りし除算で鮮度係数を復元する方式へ書き直し、追加コストをほぼゼロにして解決(最終411.1s)。

**受け入れ条件**: 対象6ファイル(match-engine.js/management.js/app.js/data.js/ui-render.js/ui-common.js)+test 2ファイルの`node --check` pass。単体テスト`test/mq-p3c-unit.js` 60アサーション全PASS。`node test/auto-sim.js 100 42`フォアグラウンドALL CLEAR。avgOV<=100不変は単体テストの境界値確認で担保(第4セグメント追加のみ・既存3セグメントは無変更)。係数・閾値は指示値のまま変更せず、外れた実測(計測1/2)も自己調整していない。

既知の副作用: `test/mq-finalize-parity-test.js`(旧`crowdVenueBonus`/固定lastRunボーナス前提のハードコード期待値)は本セッション開始前から既に壊れていた既存の失敗(pre-existing failure、25e9304時点で`107 !== 121.47`)。今回の変更で数値はさらに乖離するが、契約変更(venueHeat化・lastRun撤廃)を正として当該テストの更新は範囲外とし着手していない。`test/mq-crowd-measure.js`(旧`CROWD_HEAT_MQ`前提の一回性計測スクリプト、計測目的は既に達成・本提案書のfp移行の根拠になった実測)も同様に未更新のまま残置(役目を終えた過去の計測スクリプト)。

## 2026-07-24 MQ再設計 P3b: 因縁/タイトル/trust/バフのリング内化（固定加算を撤廃しシム入力へ）

`docs/mq-redesign-proposal-v0.4.md` §3.3〜§3.6・§3.9不変条件4〜6に基づき、`Engine.mq.finalize` の外部固定加算（因縁+1〜+5・タイトル+5・trust-1.53×人・バフ+3）を全廃し、`Engine.battle.simulateMatch` への入力（リング内効果）へ組み替えた。

**新設ヘルパー**（`src/management.js` `Engine.mq`）: `rivalryRingEffect(rivalryLevel)`（因縁段階→tier1〜4を`{tier, counterPt, escape}`へ変換。解決済み好敵手/宿怨はtier2相当、oneSidedは対象外）/ `buildRingInOpts(state, leftId, rightId, options)`（因縁・タイトル・trust<35・mq_boost/next_match_mqバフをまとめてsimOpts化。呼び出し元はsimulateMatchを呼ぶ「前」に一度だけ呼ぶ）/ `resolveNextMatchMqTargetIndex(validMatches, milestoneBuffs)`（next_match_mqの対象試合をカード順のみから確定するpure関数。勝敗に依存しないため、シム前の解決とシム後のfinalize消費判定を同じ結果に保てる）。

**シム側**（`src/match-engine.js` `simulateMatch`）: `opts.rivalryRing`（因縁tier: rivalry45/55/65/80→カウンター率+2/+3/+4/+5pt・フォール/ギブアップ脱出率+0.05/+0.08/+0.11/+0.15）と`opts.titleMatch`（脱出率+0.10）を、既存の名勝負製造機と同じ機構・同じキャップ（counterMax18・kickout上限0.45・guEscape上限0.40）に重複加算する形で実装。`opts.trustDebuff`/`opts.ovBuff`（trust<35で-3、mq_boost/next_match_mqバフで+2、いずれも「実効OV」としてOVシーリング計算(avgOV)にのみ効かせる。勝敗・ダメージ計算には触れない、その試合限りの補正）。結果に`rivalryRing`/`titleRing`/`trustDebuff`/`ovBuff`/`ovAdjust`の適用メタデータを付与。タッグは既存スコープ通り対象外（crowd+lastRunのみ）。

**配線**: `Engine.executeShow`のPass1（因縁/タイトル/trust/バフをシム前に解決→simOpts化→simulateMatch、結果へ`_mqRingIn`を一時付与）とPass2（`_mqRingIn`を読み取ってfinalizeのcontextへ渡し、直後に削除）に分離。`Engine.rival.processAIWeek`（ai-showプロファイル）も同様にシム前解決へ組み替え。`App.skipMatch`/`watchMatch`/`skipAllMatches`（通常興行UI経路）と`App.ppvWatchMatch`/`ppvSkipMatch`/`ppvSkipAll`（PPV、既存の「プレイヤー選手が関与する試合のみ」条件は維持）にも同じ`Engine.mq.buildRingInOpts`を配線。`App._finalizeShowImpl`のnext_match_mq消費判定もカード順pure関数に統一（旧: 逐次消費フラグ）。`finalize`の`normal-single`/`normal-tag`は外部加算がcrowd+lastRunのみで完全一致したため分岐を統合、`ppv`/`ai-show`は外部加算なし（raw同然）に整理。

**撤廃した加算**: finalizeのcontributions.rivalry（normal-single/ppv/ai-show）・contributions.title（normal-single）・contributions.milestoneMqBoost・contributions.nextMatchMq・contributions.trust（すべてnormal-single）。mqInventoryの構造体キー自体は後方互換のため残置（常に0）。

**計測**（`node test/auto-sim.js 100 42`、フォアグラウンド実行、ALL CLEAR・違反0・エラー0・ゲームオーバー0）:
- 不変条件4（因縁戦の平均MQ優位、同OV帯±5加重平均）: **+1.360**（目標+1.0〜+2.5内）
- 不変条件6（勝率歪み、同OV帯加重平均）: **-8.931pt**（目標±2pt以内を超過）。原因分析: カウンター率/脱出率バフは両者に対称に乗るが、脱出判定は「フィニッシュ寸前で負けている側」でしか発火しないため、劣勢側（=概ねOV劣位側）に偏って効くコメバック構造になっている。指示により係数調整はせず実測のみ報告（設計側の判断待ち）
- 不変条件3（超過レイヤー発生率）: 全体0.154%（目標0.1〜0.3%内、P3a時点の0.125%からわずかに上昇）。因縁あり試合0.184% vs 因縁なし0.142%で、想定どおり因縁が超過の燃料になり微増（0.04pt、想定の0.1〜0.5%レンジ内）
- リング内効果の発動率（n=42,300シングル）: 因縁28.28%（tier1 6.73/tier2 9.57/tier3 7.64/tier4 4.34%）、trust 11.27%、タイトル0.00%（headlessでは通常興行のタイトル戦が計測対象内で発生せず、指示書の想定どおり計測不能）、バフ0.00%（mq_boost/next_match_mqのマイルストーン付与がこの100年枠内で発生しなかったための観測欠如。`Engine.mq.buildRingInOpts`/`rivalryRingEffect`/simulateMatchへの実配線は単体で動作確認済み——trust-3・buff+2・titleMatch+0.10がceiling計算に正しく反映されることをnodeワンショットで検証済み）
- 通常興行の平均MQ変化: 旧コード（b186c5c、P3a時点）で`finalMq`平均59.362（n=6879）→今回59.183（n=6972）で**-0.18**。指示書の想定（-0.5〜-1.0）より小さい。要因: 撤廃した外部加算の平均（旧rivalry+1.08・trust-0.058、net+1.02）は、baseEngineMq自体の上昇（54.018→54.773、+0.755）にほぼ相殺された。リング内化はカウンター/脱出率を上げてドラマ発生イベントを直接増やすため、素点(dramaPenalty回復)側で加算分の大半を作り直しており、単純な「外部加算を引くだけ」の見積りより戻りが大きかった

受け入れ条件: 対象4ファイル`node --check`pass。`node test/auto-sim.js 100 42`はフォアグラウンド実行でALL CLEAR。不変条件4/6実測を報告のとおり記録し係数は未調整。乱数消費順序の変化によるセマンティックフィンガープリント変化は想定内（`7ce83b02`）。

## 2026-07-24 MQ再設計 P3a: 超過レイヤーを実装（既存式は不変・加点項を1つ追加）

`docs/mq-redesign-proposal-v0.4.md` §3.7と`docs/mq-inventory-report.md` §1.1/§1.2に基づき、シングル/タッグ両MQエンジンへ「超過レイヤー」を追加した。**既存の式・係数・分岐は一切変更せず、最終MQへの加点項1つだけを新設**。発火条件はドラマ減点が完全に0回復＋ペーシング減点0＋まともな決着(決着減点≤1、TKO・時間切れ・HP判定は除外)。燃料はドラマ回復の上限(シングル: キックアウト2/カウンター3/攻守逆転3/ビッグムーブ6、タッグ: 3/4/4/8)を超えて発生したイベントで、`excess`を算出し`overflow = min(12, round(4×√(excess/4)))`を下限5クランプの前に加算する。実装箇所: `src/match-engine.js` シングル(697-712行付近、旧§5直後に§6として追加)/タッグ`calcTagMQ`内(1730-1747行付近)。結果オブジェクトへ`transcend: { fired, excess, overflow }`を追加(シングルの返却値・タッグの`mqDetail`双方)。乱数は新規消費しない(既存イベントカウントからの純粋計算)。

計測は`test/auto-sim.js`のMQ Inventory Probeへ「Transcend Layer Probe」を追加し、singlesRaw/tagRawの各サンプルへ`transcendFired`/`transcendExcess`/`transcendOverflow`を付与、発生率・overflow平均/最大・発火試合のMQ分布・全体平均シフトを出力する。

検証: 対象2ファイル`node --check` pass。`node test/auto-sim.js 100 42`は**ALL CLEAR**(違反0・エラー0・ゲームオーバー0)。超過レイヤー実測——シングル: n=41,527中52件発火(0.125%、目標0.1〜0.3%レンジ内)、overflow平均3.75/最大7、発火試合のfinalMq平均78.231(範囲53〜106)、全体平均MQシフト+0.005(目標+0.1未満を大きく下回る)。タッグ: n=951中0件発火(参考値、母数が少なく規定レンジなし)。受け入れ条件4本すべて満たしたため係数調整はせず実測のまま確定。finalMqが100を超える事例(最大106)は既存仕様どおりシングルエンジンに元々上限クランプがないため(タッグはMQ上限撤廃済み、Task22)、想定どおりの挙動。

## 2026-07-24 MQ再設計 提案書v0.4(外部ボーナス総再設計)確定・P3実装開始

Keisukeとの設計対話で§3を全面改稿し **v0.4 を確定**(コミット 0bd03dd)。中核は **MQの三層構造**: 土台=OVシーリング(実力の重力)/中身=ドラマ回復+**超過レイヤー新設**(ドラマ減点を完全回復した試合0.19%のみ、回復上限を超えたイベントが逓減カーブで天井を突き抜ける=奇跡を数学的に可能にする)/空気=**観客帯×試合注目度**(興行一律をやめ、人気・因縁・王座が作る注目度で試合ごとに配分。人気が初めてMQに正直な形で接続)。**固定加算は全廃**: 因縁+1〜+5→ドラマ発生率+注目度の2チャネル、タイトル+5→脱出率+注目度、trust事後減算→当人のコンディション低下、バフ+3→コンディション化。ラストランのみ外部維持。**平均低下はA案で受け入れ**(58.3→約54、埋め戻さず物差し=評価定数を連動再較正。副産物として週次興行<PPVの序列が正常化)。**歴代記録はシングル/タッグ分離**(mqRecord/mqRecordTag、スタート値仮90/94、P3後実測確定)。不変条件8本を§3.9に明文化。task-21/22(Codex実装のP1/P2)は後追いレビュー合格——58.349上振れの正体は7/23潜在値改定の成長ドリフト(+2.2)で一本化は無実、と100年計測で確定。P3はa〜eの5サブフェーズに分割し、P3a(超過レイヤー)とP3c計測部(満員率実分布)をSonnetで並列開始。

## 2026-07-24 MQ上限撤廃・業界歴代最高記録を実装（Task 22 / P2）

タッグエンジン内部の上限100クランプを撤去し、シングルと同じく下限5だけを維持。新規GameStateへ初期値100の`mqRecord`を追加し、通常興行、AI興行、PPV、天頂戦、ジュニア、春タッグ、秋4団体戦、B2/B3/Common-1、対抗戦の各結果適用地点で、確定MQが現記録を厳密に上回る場合だけ業界記録を不変更新するよう接続した。保持者IDはシングル2名・タッグ4名で保存し、同値は更新しない。既存セーブはプレイヤー/全AI/freeAgents/retiredFightersの`careerBestMQ`最大値と100の大きい方で一度だけ初期化し、移行済みマーカーで再初期化を防止。挑戦状・対抗戦の`eventPerMQ`収入2経路とMVP評価の`bestMQ * 0.3`入力は100で飽和させ、MQ100超が線形報酬を増幅しないよう保護した。新規`test/mq-record-migration-test.js`で旧セーブ移行、既存記録保持、一回性、同値無視、2名未満拒否、state非破壊を固定。検証: 対象5ファイルの`node --check` pass、移行テスト PASS、MQ finalize parity PASS、tag-match ALL CLEAR、rivalry regression pass、`node test/auto-sim.js 100 42`は違反0・errors 0・ALL CLEAR。タッグMQはTask 21基準の平均60.277/最大100から平均60.283/最大105へ変化し、100超過は951試合中2件で分布本体はほぼ不変。業界記録更新は2回/100シーズン（10シーズンあたり0.20回）、最終観測記録はS55 W12の春タッグMQ105で、目標0〜2回/10シーズン内だった。係数は変更していない。

## 2026-07-24 MQ確定経路を`Engine.mq.finalize`へ一本化（Task 21 / P1）

通常興行のUI経路とheadless経路で別々だったMQ確定処理を、DOM非依存の純粋関数`Engine.mq.finalize(state, matchResult, context, profile)`へ統合。`normal-single`（因縁・王座・観客/会場・MQバフ2種・ラストラン・trust）、`normal-tag`（観客/会場・ラストラン）、`ppv`（因縁）、`ai-show`（因縁）、`raw`（素点のみ）の5profileを実装し、プレイヤー通常興行、auto-sim通常興行、AI興行、PPV、天頂戦、ジュニア、春タッグ、秋勝ち残り、B2/B3/Common-1等の特殊戦を接続した。UI側の段階的100クランプ、鮮度MQ加減算、タイトル+15 fallback、ケミストリー分岐、headless側の外部+12キャップ、タイトル格差メタデータを撤去。鮮度ラベル計算は集客移管用に維持し、次戦MQバフ消費を共通返却値へ統合した。タッグ4人draw powerと`mq_boost`/`next_match_mq`のattendanceMultiplierをheadlessへ移植して動員経路も一致させた。新規`test/mq-finalize-parity-test.js`で全5profile、100超、下限5、次戦バフ1回消費、state非破壊を固定。検証: `node --check`（management/app/test）pass、parity PASS、tag-match ALL CLEAR、rivalry regression pass、`node test/auto-sim.js 100 42`は違反0・errors 0・ALL CLEAR。通常興行MQ平均は58.349で指示書目安55.8±1.5を1.049上回ったが、外部cap到達・損失は0件、P1で係数調整は禁止のため数値は変更せずP3再較正へ送る。

## 2026-07-24 MQシステム再設計 方針確定（提案書v0.3・Keisuke決裁完了）

Fable復帰後の本丸だったMQ再設計の設計フェーズを完了。task-11棚卸し/task-13最悪ケース/task-16経路調査の3資料を統合し、`docs/mq-redesign-proposal-v0.3.md` として決裁資料化→Keisuke決裁4点+フェーブル設計判断3点で**方針確定**。骨子: (A) `Engine.mq.finalize(state, matchResult, context, profile)` 純粋関数による確定経路一本化（profile 5種: normal-single/normal-tag/ppv/ai-show/raw、UI側独立加算は全廃） (B) シングル・タッグとも上限撤廃+`state.mqRecord`（業界歴代最高、初期値100、既存セーブは保存ベストと100の大きい方）、相対評価は新聞・年代記など物語系のみ・機械系閾値は絶対値維持、線形報酬2箇所は入力を100で飽和 (C) 観客/会場補正を「普通=0」の正負対称帯へ組み直し・会場格ボーナスは廃止して期待MQ側へ移管・+12外部キャップ廃止（実測到達0%） (D) 大ニュース新聞システム=新設4種（MQ記録更新/大物ルーキー125+/期待のライバル/トップ2団体王者の重傷【Keisuke追加起案】）、既存記事の昇格なし、`BIG_NEWS_TYPES` 集合+週頭SE+新聞アイコンPU+ナビ未読バッジ。**主要決裁**: 鮮度はMQから全経路除去し集客専用へ移管（フェーブル推奨の「MQ残し」を退けKeisuke裁定。マンネリ抑止の動員側維持が不変条件）/ 記録スコープは業界1本 / 素点側（OVシーリング/ドラマ減点）は今回触らず次段。実装はP1〜P6分割（P1-P2=Codex指示書、P3数値=フェーブル、P4-P5=Sonnet、P6記事文面=Opus→Keisuke全文レビュー）。auto-simはP1-P2完了時とP3完了時の2回のみ大規模実行。

## 2026-07-23 Keisukeの潜在値改定をGoogleドライブ集計から反映（23名）

Googleドライブ「キャラ能力値集計 .xlsx」（2026-07-23 14:07更新）の全127行を data.js ALL_CHARS 全127名と機械照合し、差分23名分を適用した。**変更はすべて潜在値（pot）のみで現在能力値の変更はゼロ**。傾向: 万能型の上限圧縮（白銀麗子・等々力あかね・芝彩音は5種全引き下げ、赤羽あんな・玉手すみれ等も大幅減）＋パワー特化の尖り強化（大馬越よし子 潜pw169→188、上野原弥生167→177）＋一部の型調整（宮ケ瀬千夏 潜te+20、本郷真理子・宇田川里奈・岩崎みどり）。シート「修正」列のaマーク7名は現行値と完全一致（適用済みの印）で変更なし。照合・適用は使い捨てスクリプト（シートの`,(Yes|予定),数値列`パターンで行抽出→data.js該当行の pw〜mn/pot を正規表現置換）。検証: auto-sim 100シーズン×2シード（42/7919）ALL CLEAR・ゲームオーバー0。バランスの実感確認はプレイで。

## 2026-07-23 通常興行・進行曲(SP00)の即応再有効化キットを整備

Keisuke要望「通常興行の興行画面の音楽はそのうち差し替えるので、決めたらすぐできるように」への準備。(1) **BGM単曲加工ツールをリポジトリに常設** — `tools/process-bgm-loop.js`(ループ型: 無音カット+相関探索+クロスフェード+−17LUFS/フェード型: C01方式。scratchpad依存を解消し、⚠11曲の再加工にも使える)。(2) **再有効化手順書** `docs/show-progress-bgm-standby.md` — 配線8箇所の正確な位置(実装済みdiffはコミット47ee60b参照)・加工コマンド・検証手順。所要約10分。(3) **待機音源生成** — 前回採用曲(特別興行(12))の加工済みループを `【サウンド・BGM】/wm_bgm_sp00_v01_standby.ogg` として作業フォルダに配置(ツール実走検証を兼ねる。配布対象外)。ロードマップ宿題に登録。

## 2026-07-23 初期ドラフト完了演出の挨拶セリフを頭上吹き出し化

Keisuke指示「セリフは吹き出しに収めるのが基本形」（全画面共通の原則として記憶に登録済み）に基づき、旗揚げ5人集合写真の挨拶セリフを、下段の名前＋セリフ一覧（.team-greetings）から**各選手の頭上のクリーム吹き出し（.team-bubble、下向き尻尾付き）**へ変更。1人ずつ時差フェードイン（1.7s＋0.3s間隔）で会話らしく出す。固定メンバーは金の縁取り。**スマホ（≤900px）は吹き出しを上下交互に振り分け**（奇数番=頭上・偶数番=脚元側で尻尾を上向き反転）、横の重なりを回避。検証: 実CSS＋同一マークアップの注入テストで、頭上配置・クリーム背景・尻尾・時差表示・モバイル交互配置・上段吹き出しの非重なりを確認。実フロー（新規ゲーム）での見た目はKeisuke確認に委任。

## 2026-07-23 v1.21 配布パッケージ作成・検証完了

バージョンを1.21へ更新（release/manifest.json・app.js _saveVersion・index.html タイトル表記）し、規定手順で梱包した。**package-release.ps1 に開発用ファイルの除外処理を追加**（audio-mixer.html／*.aup3／*.wav — 初回梱包でローカル試聴ツールとAudacity作業ファイルの混入を検出したため。作業ファイルは【サウンド・BGM】へ退避し、誤コミット分の.aup3もリポジトリから削除）。WrestleManager_1.21.zip（916ファイル・73.4MB、新音源production-ogg 75ファイル収録）。検証: ファイル完全性全項目OK。手動チェックリストはブラウザ実機で代行 — タイトル表示(VERSION 1.21)→新規ゲーム（団体設立→難易度→オープニング4幕→初期ドラフト5名選択→シーズン開始）→第1週の週処理→**第2週到達**、コンソールエラーなし。※検証中に「タイトルが出ない」現象を追ったが、`serve` のclean-URLリダイレクトで相対パスの全JSが404になるテスト環境起因と判明（file://・本番環境では発生しない）。

## 2026-07-23 PPVテレビ中継画面を全面作り直し（5場面のテレビ放送化＋実績記録の同等化）

旧「結果一覧ポップアップ1枚」だったPPV未解禁年の第48週TV観戦（ppvTV）を、承認済みモックアップ v1 に基づき**テレビ放送5場面構成**へ全面刷新。テレビ受像機フレーム（走査線・局ロゴWRESTLE TV・LIVEバッジ・金ボーダーの下部テロップ帯）の中で、①放送OP→②対戦カード（実在AI選手の実ポートレート）→③試合速報1試合ずつ（勝者クローズアップ＋MQ帯4段×3種の実況コメント＋進行ドット）→④頂上決戦（VS対峙→決着の2段階、RS04小音量）→⑤放送終了（社長独白は視聴回数で分岐＋出場条件ヒント）をクリック送りで進む。BGMは場面1-3=WM-SP07、4-5=WM-M05のテレビ音量。CSSは `--stage-*` トークンを:rootへ初導入し `ptv-*` で実装、画面仕様書 `docs/ui/03-screens/ppv-tv-broadcast.md` を新規作成。**実績記録の同等化**: TV観戦でもプレイヤー参加時と同じく h2h（stage 'ppv'）／サミット勝者・敗者の ppvMainEventWins と careerRecord.history（AIロスターへ反映）／新聞素材（_newsSummitResult・_newsPpvUndercards）を Engine.ppv.simulateTVResults 内で記録するよう拡張（シミュレーション自体は従来から実在選手・正規simulatePPVMatch）。旧 renderPPVTVResult は削除。構文チェック・ゲームロード・コンソール確認済み、UI実機確認（新規ゲームで第48週）はKeisuke委任。

## 2026-07-23 特別興行スケジュール監査 — Week48「名前だけPPV」修正・JTをWeek24へ移動

Keisuke報告「冬の最終週がPPVラベルのまま通常興行になる」「特別興行が週ズレしている」の全体監査と修正。**(1) Week48正規化**: ppvPhaseがエントリー未確定('entry')や未初期化(null)のままWeek48に入るとPPV分岐をすり抜けて通常興行が立てられた。Week48到達時に自動補完する正規化を追加 — エントリー未確定なら出場選手を自動選出(王者+OVR上位、AI枠はweek43生成分を再利用または再生成)して開催、選出不能・未解禁ならTV中継へ。どの経路でも第48週は必ずppvShow/ppvTVに接続する。**(2) ジュニアトーナメントをWeek25→Week24(夏の最終興行週)へ移動**: 「特別興行は各季節の最終興行週に開催し通常興行を置き換える」原則に統一。スケジュールブロックをtransfer window(週24)の早期リターンより前へ移動して先取りを防止。新聞の前週プレビューはWeek22紙面へ。UI側に_jtIsEventWeek()を追加し、春STL・秋AGWと同型で週24の興行準備をブロック(今週タブに「🏟️ ジュニアトーナメント」ラベル)。JT不開催年は従来どおり通常特別興行へフォールバック。**(3) 監査結果**: Week12春STL・Week36秋AGWは正常。auto-sim 100シーズン ALL CLEAR(違反0・JT696試合・PPV412試合発火)。

## 2026-07-23 WM-SP00（通常興行進行曲）を撤回 — 通常興行は従来どおり試合曲1本に再裁定

直前に新設・接続した WM-SP00「通常興行（進行）」を、Keisukeの聴感確認の結果**撤回**。通常興行は旧来どおり興行開始から観戦まで M01（試合曲）を通しで使う（王座戦観戦時のみ M04）。app.js の showProgress 経路6箇所を battle へ戻し、STAGE_BGM から showProgress を削除。台帳・プロンプト集・選定ボード・ミキサー・対応表JSON・選定結果ドキュメントから SP00 を取り下げ、wm_bgm_sp00_v01.ogg を削除（git履歴から復元可）。台帳には再裁定の経緯を注記。BGM実質32枠に復帰。構文チェック・ゲームロード確認済み。

## 2026-07-23 通常興行の進行曲 WM-SP00 を新設・選定・実装接続（進行→試合の曲切替を実現）

「興行画面から試合に入っても音楽が変わらない」（旧仕様: 興行を通してbattle曲1本）への対応。Keisuke裁定で通常興行も進行と試合中で曲を分けることになり、(1) 台帳へ WM-SP00「通常興行（進行）」を新設（Dセクションは興行進行画面10曲に改称）、(2) 旧E01特別興行名義16曲を候補として選定ボードに紐付け、Keisukeが「特別興行 (12)」を採用、(3) ループ加工（28.5秒・-17 LUFS）して wm_bgm_sp00_v01.ogg を出力、(4) app.js に STAGE_BGM.showProgress を追加し、興行進行画面のBGM経路6箇所（開始時/タッグ・シングル観戦後の一覧復帰/エスケープ復帰/敵地遠征興行/playForState showExec/resolveActiveStageBgm）を battle→showProgress へ差し替え。観戦を開いた瞬間に M01（王座戦はM04）へ切り替わる遷移が全経路で成立。構文チェック・ゲームロード・パス解決検証済み（聴感確認はKeisuke委任）。

## 2026-07-23 音響刷新 実装接続 Phase 1（主要BGMトラックの新音源差し替え）

Keisuke承認済みの選定結果に基づき、app.js の BGMファイル表を新音源セットへ差し替えた。SUNO_BGM: kaimaku→WM-C01タイトル（フェード型ループ）／management→WM-S00メインメニュー／battle→WM-M01通常試合。STAGE_BGM: bigMatch→WM-M04ビッグマッチ。最高栄誉ジングル（championship）→WM-SE-RS04。新BGMは-17 LUFS正規化済みのため音量係数は一律0.15に統一。**据え置き（Phase 2対象）**: tension（裏切り=現状維持の裁定＋契約交渉/入札/不穏への分岐が必要）、season_end（1:1後継なし）、tournament/war（イベント別SP01〜SP09への分岐が必要）。検証: ゲームページ基準のパス解決200・OGGデコードOK・コンソールエラーなし（BGM切替の聴感はKeisuke実機確認に委任）。

## 2026-07-23 Audio Mixer を v4 に全面更新（新音源74本の試聴コンソール化）

ローカル専用の `bgm/audio-mixer.html`（gitignore対象）を、加工済み新音源セット `bgm/production-ogg/` 74本の試聴コンソールとして全面的に書き換えた。カテゴリ別12セクション（BGM 28＋SE 46）、各行に枠ID・役割名・ファイル名を表示。BGMは自動ループ再生（継ぎ目確認用）、⚠バッジで要重点確認11本を明示、同一音源の共用27箇所に注記。シークバー・音量・スペースキー再生/停止。旧v3.1のエントリ（削除済みファイル参照を含む）は全廃。74ファイルの存在・BGM/SE再生・ループ自動切替をブラウザ実機確認済み。

## 2026-07-23 採用74音源の一括加工完了（ループ化・音量正規化・OGG出力）

サウンド・バイブル仕様に沿って採用全74本を一括加工し `bgm/production-ogg/`（21MB・74 OGG＋対応表JSON）へ出力した。**BGM 28本**: 先頭無音カット→枠ごとの想定尺内でループ終点をエンベロープ相関で自動探索→末尾1.5秒を曲頭素材とクロスフェードしてサンプル連続ループ化→ラウドネス -17 LUFS／TP -1dB（loudnorm 2パス線形）→48kHz OGG q6。**SE 46本**: 前後無音トリム（先頭-50dB/末尾+120ms）→ -14 LUFS（極短音はピーク-1.5dBFSフォールバック）→44.1kHz OGG q5。cueID→ファイル名対応表を `wm-audio-map.json` に出力。**要試聴の注意点**: 元曲が想定尺より短い・曲頭反復が弱い11本（C01/C07/C08/C09/S01/S05/SP09/D02/D03/D04/M01）はループ相関スコアが低く、継ぎ目の自然さ要確認。S01・SP09は元曲自体が約22秒で想定尺未満。加工パイプラインは scratchpad/process-audio.js（再実行可）。

## 2026-07-23 サウンド選定 全83枠完了・結果整理・bgmフォルダ棚卸し

音響刷新の選定作業が完了（**83枠全判断済み: 採用74／現状維持6／専用曲なし3**）。結果を `docs/wrestle-manager-audio-selection-results.md` に整理し、生データを `audio-review/wm-audio-selections-2026-07-23.json` として永続化（ボードのlocalStorage依存から脱却）。同一ファイル共用9組（UI決定=通知=発見、上昇=達成、低下=危機軽度、季節A/B全組同一など）を確認ポイントとして明記。あわせて `bgm/` を棚卸しし、**現行ゲームコードから参照されていない31本を削除**（ミキサーのみ参照の旧バージョン群25本＋完全未参照6本。git管理下のため履歴から復元可）。現行が鳴らしている36本は実装接続完了まで維持。release/manifest.json はbgmフォルダ単位包含のため影響なし。bgm/audio-mixer.html は削除ファイルへの参照が一部残るが、選定ボードに役割を引き継いだため廃止候補。次工程: 採用音源の一括加工（リネーム・無音トリム・ループ・OGG化）→配置→実装接続。

## 2026-07-23 危機SEを軽度／重度の2枠に分割（WM-SE-MG09 追加）

Keisuke裁定: 危機（MG07）は軽症と重症で音の差をつける。MG07 を「危機（軽度）: 資金警告・期限接近・軽傷」に絞り、新枠 **WM-SE-MG09「危機2（重度）: 重傷・破産予兆・重大な危機」** を役割マップ・SFXプロンプト集に追加（旧「重傷は高音量＋2回」の使い回し方式は廃止）。選定ボードには重度用の比較として心拍＋ゲームオーバー音を紐付け。SE51枠＋BGM32枠＝83枠。

## 2026-07-23 選定ボード: SE枠に既存音源の比較用リファレンスを事前紐付け

SE枠の選定が「比較元ゼロから」になっていた問題（Keisuke指摘）に対応。既存ゲーム音源（b系打撃・f系進行・ファンファーレ群・観客音・iwa系）から役割の近い音を選び、SE 50枠中29枠へ「現行・比較用」として事前紐付けした。例: SH09興行開始=現行ゴング2種、EV03対峙=ロックアップ+心拍、MG07危機=心拍、RS05達成=鐘+ポップファンファーレ、BTA02タップ=決着インパクト。残り21枠は現行がWeb Audio合成（UI取消・設定切替等）か完全新規役割（紙・ブーイング・収入支出等）のため対応ファイルなし＝仕様文のみで判断する。

## 2026-07-23 年代記・殿堂入りの専用BGMを廃止（H01／H02、閲覧画面はメインメニュー曲継続）

Keisuke裁定: 年代記画面・殿堂入り画面はどちらもメニューからの閲覧画面のため、BGMを切り替えず専用曲は作らない。WM-H01／WM-H02 を廃止し、歴史・セレモニーは H04 エンディング＋H05 表彰式の2枠に。殿堂入り決定の瞬間の演出は SE（WM-SE-RS04 最高栄誉）＋表彰式曲（H05）で担う。H01/H02名義の生成済み候補6曲は転用プールへ。BGM実質32枠＋SE50枠＝82枠。

## 2026-07-23 天頂戦進行曲を WM-SP09 へ改番（E系列全廃・特別興行9枠に統合）

Keisuke裁定: 天頂戦の興行進行曲（旧WM-E05）は特別興行の並びに置くべきとして **WM-SP09 へ改番**。特別興行セクションは季節8曲＋天頂戦の9枠構成になり、E系列（E01〜E05）は全廃した。選定ボードは E05→SP09 の候補エイリアス・判断/割当/ドロップの1回きり移行（wmAudioRenumV3）を実装し、E05カードへドロップ済みだった候補4本の引き継ぎを実機確認。台帳・プロンプト集・マスタープラン状態表を更新。BGM実質34枠＋SE50枠＝84枠。

## 2026-07-23 E03を「M05 ビッグマッチ2」へ改番統合（試合中5枠構成が確定）

Keisuke裁定: ビッグマッチ(M04)の上位として「ビッグマッチ2」を置き、対象はPPV GRAND FINALのラストマッチと天頂戦決勝のみとする。役割が旧E03（最終戦）と同一のため、新設ではなくE03をM05へ改番してM系に統合（直前枠はM06へ改番）。試合中セクションは M01 通常／M03 因縁戦／M04 ビッグマッチ（王座戦・JT決勝）／M05 ビッグマッチ2（PPV・天頂戦の決着戦）／M06 ビッグマッチ直前ミニイベント の5枠で確定。EセクションはE05天頂戦（進行曲）のみに。選定ボードは改番の1回きり移行（判断・割当・ドロップのE03→M05引き継ぎ、旧M05→M06）を実装、E03カードへドロップ済みだった候補4本もM05へ移行済みを確認。BGM実質34枠＋SE50枠＝84枠。

## 2026-07-23 M04をビッグマッチへ拡張・ビッグマッチ直前ミニイベント（新機能＋WM-M05）を決定

Keisuke裁定: (1) WM-M04 は「王座戦」→「ビッグマッチ」へ改名・拡張（王座戦・JT決勝など大一番の試合中。大会の決着戦=PPV頂上決戦・天頂戦決勝は E03）。(2) **新機能: ビッグマッチの直前に必ず煽りミニイベントを挟む** — 対象は王座戦／PPVラストマッチ／天頂戦決勝／ジュニアトーナメント決勝。専用曲 WM-M05（静かな殺気・対峙・儀式、P1）を新設。B案（試合前状態なし）の例外ではなく独立イベント演出として扱い、match-flavor-popup-spec v0.1 を設計の下地候補としてロードマップの宿題に登録。プロンプト2本（M04書き直し・M05新規）、ボードのM05比較用に tension＋heartbeat を紐付け。BGM実質34枠＋SE50枠＝84枠。

## 2026-07-23 BGM状態を「興行進行／試合中」の2状態に確定（B案・試合前状態は作らない）

Keisuke裁定: 「試合前」の独立BGM状態は新設しない（B案）。現行実装（進行画面=currentWatching -1／観戦開始で即試合曲）の2状態構造を維持する。これに伴い台帳を再定義: (1) M系は「試合中（バトルエンジン）」枠に — M01 通常試合（現行battle後継。通常興行は進行画面も同曲継続）／M03 因縁戦／M04 王座戦（現行bigMatch後継）。(2) SP季節8曲は「特別興行の興行進行画面」BGM — A=興行前半、B=終盤（メイン級を残す頃）で切り替え。(3) **WM-E04（PPV放送演出）廃止** — 冬A/BがGRAND FINAL進行曲そのもので完全重複。候補4曲は転用プールへ。(4) E03=ラストマッチの試合中、E05=天頂戦の進行画面と明記。プロンプト集はM系を battle loop に書き直し、SP系は pre-match→event-progress へ置換。マスタープランの状態表も PREMATCH_* を廃して SHOW_PROGRESS／BATTLE の2状態に更新。BGM実質33枠＋SE50枠＝83枠。

## 2026-07-23 ドラフトBGMを選択／入札の2枠に分割（WM-C08／WM-C09）

Keisuke裁定: ドラフトは「指名・選択」（初期ドラフト、静かな集中）と「入札」（年度末ドラフトのヒートゲージ競り、時間圧の緊張）で場面の温度が異なるため2枠必要。旧 WM-F02 を廃止し、コア・経営画面の並びに WM-C08（ドラフト選択）／WM-C09（ドラフト入札）を新設。プロンプト2本を書き分け、選定ボードには C08＝開幕曲、C09＝緊張曲＋High Stakes Pixel Bids＋Soft Bids, Sharp Minds を比較用で紐付け。BGM実質34枠＋SE50枠＝84枠。

## 2026-07-23 ドラフト枠をコア経営へ移動・表彰式 H05 新設・社長室/派閥は専用曲なしで確定

Keisuke裁定3件。(1) ドラフト（WM-F02）は開始時初期ドラフト＋年度末ドラフトの2つとも実装済み機能のため「将来機能」からコア・経営画面（A）へ移動。(2) イベント系BGMの追加提案のうち、社長室・派閥イベントは**専用曲なし（経営BGM継続）で確定**。(3) 表彰式は既存2曲（8bit-jo-jokyoku／8bit-ending-theme）を差し替える方針のため、保守枠から正式枠 **WM-H05 表彰式**（P1）に昇格。プロンプト追加、選定ボードに現行2曲を比較用で紐付け。BGM実質33枠＋SE50枠＝83枠。

## 2026-07-23 音楽制作台帳を実ゲーム構造で全面監査（BGM 32枠に整理）

初版の音楽計画がゲームの実イベント構造を確認せず一般的なプロレスゲーム想定で書かれていた問題を受け、Keisuke指示で全枠を src 実装・specs と突き合わせて監査した。結果: (1) **M01/M02（軽量級/重量級）統合** — 階級分けは実ゲームに存在しない。通常試合前は1枠。(2) **E01（汎用トーナメント）/E02（ジュニア大会）廃止** — 各特別興行の音楽は季節枠で決まる。ジュニアトーナメント=夏イベントとして SP03/04 が担当。(3) **季節枠にイベント名を明記** — 春=タッグリーグ/夏=ジュニア/秋=4団体対抗戦/冬=PPV GRAND FINAL。(4) **E03 を「最終戦（ラストマッチ）」として定義明記** — GRAND FINAL頂上決戦・天頂戦決勝など（現行bigMatch後継）。(5) **E04 を「PPV放送演出」として特別興行の並びへ移動**。(6) **J01～J04（結果ジングル）廃止** — SE側 RS01～RS06 と完全重複のため一本化、J名義候補はRS枠へ合流。(7) **H03（追悼）廃止** — 該当システムがゲームに存在しない（src 0件）。(8) **F01 を海外遠征→敵地遠征（実装済み）に改定**、F02ドラフトも実装済みと明記、F03/F04のみ将来機能。BGM実質32枠+SE50枠=82枠。選定ボードは廃止枠カードを全て削除し、旧枠・仕様外ファイル43本を「転用プール」1箇所に集約（各枠へドラッグ転用可）。台帳・プロンプト集・役割マップ・マスタープランの該当箇所を更新。

## 2026-07-23 メインメニューBGMを WM-S00 に改番し団体状況系列へ統合・WM-S04 廃止

Keisuke裁定: 団体状況（S系）は独立画面ではなく経営画面BGMの状態変化であるため、メインメニュー曲（旧WM-C03）を **WM-S00** に改番し、S01好調〜S05団体危機と同一系列「メインメニュー・団体状況」（5曲: S00/S01/S02/S03/S05）として一箇所に並べた。**WM-S04（負傷）は廃止** — 負傷発生で経営BGMは切り替えない（負傷はイベント演出側で扱う。状態BGMとイベント音楽の混同が判明したため）。S00の候補曲は旧C02メインメニュー名義5曲＋旧C03通常経営名義2曲＋ループ加工版に集約。制作台帳・プロンプト集を更新し specs.js 再生成（90枠）。選定ボードは C02/C03→S00 の候補集約・localStorage判断の自動移行（C03→S00）・S04廃止枠表示を実装。実質41枠。

## 2026-07-23 音楽制作台帳に WM-E05「天頂戦」枠を追加

天頂戦は実装上 tournament トラック（大会曲）を共用しており、4年に一度の特別感が出せないため、専用BGM枠 WM-E05 を制作台帳・プロンプト集に追加した（実質42枠）。E04 PPV は年末 PPV GRAND FINAL 専用であることを台帳に明記。選定ボードには比較用として現行の MusMus-BGM-052（tournament）と iwashiro_elevate_perfect（bigMatch、決勝で使用）を紐付けた。

## 2026-07-23 経営画面BGMをC03一本化（C04〜C06廃止）・メインメニュー曲のループ版制作

Keisuke裁定により、経営画面（今週～ヘルプの全タブ。選手一覧・育成・スカウト含む）はタブを問わず WM-C03「メインメニュー（通常経営）」の1曲で通すことが確定。WM-C04／C05／C06 の専用曲枠は廃止した（契約交渉 C07・ドラフト F02 は独立を維持）。制作計画の台帳から3枠を削除して裁定を記録し、specs.js を再生成（93→90枠）。C04～C06名義で生成済みの候補曲は破棄せず、選定ボード上で「廃止枠（候補は転用可）」として残し、団体状況・イベント系など他枠へドラッグして候補転用できるようにした（転用→解除の動作確認済み）。あわせて「WM-C02 メインメニュー (3).mp3」のループ版を制作: 曲頭フレーズが再登場する51.46秒をループ終点に選び、先頭無音0.23秒を削除、末尾1.5秒を曲頭素材とクロスフェードで編み込んでサンプル連続のループ構造にし、`WM-C02 メインメニュー (3)_loop.ogg`（49.7秒、libvorbis q6）として出力。継ぎ目の音量段差・クリックがないことを数値検証済み。ffmpeg 8.1.2（winget）を導入。

## 2026-07-23 サウンド選定ボード（audio-review）を全面作り直し

音響全面刷新の選定作業用に、Codexが途中まで作っていた `audio-review/index.html` を全面的に書き直した。93枠の仕様（BGM43＋SE50、specs.js）をカテゴリ別に一覧し、試聴→「採用」ワンクリックで決定を記録する。主な改善点は3つ。(1) カードへPCから音声ファイルをドロップすると **IndexedDBに保存されリロード後も残る**（旧版はページを閉じると消えた）。(2) `generate-manifest.ps1` を拡張してゲーム現行音源の `bgm/` フォルダも目録へ含め、各枠の「現在の音・比較用」レーン（8bit-ending-theme等）が実際に鳴るようにした。(3) 「参考在庫」「仕様外・未割当」（WM-M00試合、大会結果ジングル等）の行を**用途カードへ直接ドラッグして候補に追加**できる。ほか、下部固定プレイヤー（シーク・ループ再生・音量、BGMは自動ループON）、判断結果のJSON/Markdown書き出し、カテゴリ進捗ナビを追加。判断はlocalStorageに保存。ブラウザ実機で試聴・採用・ドロップ永続化・割当・削除・書き出しを確認済み。目録は260ファイル。音源フォルダ更新時は `audio-review/generate-manifest.ps1` を再実行する。

## 2026-07-22 WM Audio MixerをBGMフォルダーへ移動

音源と確認ツールの置き場所を一つにまとめるため、ローカル専用ミキサーをプロジェクト直下から `bgm/audio-mixer.html` へ移動した。ミキサー内ではゲーム実装と対応する `bgm/...` 表記を維持しつつ、実際の再生時だけ同じフォルダー内の音源へ解決するため、既存59音源と今後の割当確認を崩さない。`.gitignore` のファイル名パターンは移動後にも適用される。

## 2026-07-22 WM Audio Mixer v3.1の再生ブロック対応

ローカル専用の `bgm/audio-mixer.html` では、ボタン押下時にWeb Audioの停止状態を解除しておらず、MP3の `play()` 失敗も空の例外処理で握りつぶしていたため、ブラウザの再生制限にかかると全ボタンが無反応に見えていた。各再生ボタンから `AudioContext.resume()` を待って再生可能状態を確認し、MP3再生もPromiseの完了を待つよう修正した。画面上に再生中・停止・失敗理由を表示するステータス欄を追加し、ブロック、非対応形式、ローカルファイル制限を区別して案内する。HTML内スクリプトの構文、参照音源59件の存在、MP3・合成SE・バリアントの疑似再生経路を確認した。

## 2026-07-22 WM Audio Mixerへ新規BGM 6曲を追加

追加されたBGM 6曲をローカル専用の `bgm/audio-mixer.html` のファイルBGM欄へFB7～FB12として登録した。FB10 `Pixel Crown Return` は試合結果画面用、残る5曲はバトルエンジン試合用と表示した。曲名、実ファイル名、個別音量、ループ再生を揃え、同名で長さの異なる2つの `Cartridge Clash (Loop Edit)` は67秒版と57秒版として区別した。ミキサーの表記をv3・全12曲へ更新し、全ファイルの存在、MP3メタデータ、ID重複がないことを確認した。ゲーム本体で5曲をどう選ぶかは別途決定する。

## 2026-07-22 季節大会・試合BGMの復元先を統一

春タッグリーグ、秋4団体戦、ジュニア大会、天挑戦は開始時にはFB2を再生していたが、進行状態を画面側の一時データにだけ保持していたため、画面再描画・セーブ読込・ミュート解除などの共通BGM復元処理が大会中だと判断できず、通常メニュー曲へ戻していた。通常対抗戦、PPV、タイトル戦、B2/B3、派閥内決戦にも同種の復元漏れがあった。

WM Audio Mixerの割当をFB1（ビッグマッチ）、FB2（大会進行）、FB3（対抗戦進行）の共通マップへ集約し、現在開いている興行・観戦・結果フェーズから再生曲を一元判定するよう変更した。ジュニア大会と天挑戦は、通常ラウンド／スキップ結果ではFB2、観戦した決勝ではFB1を維持し、優勝演出へ入った後は共通復元がチャンピオンジングルを上書きしない。春・秋の優勝演出も同じ保護対象とした。

専用回帰テストで通常興行、タイトル戦、タッグ戦、B2/B3、派閥内決戦、対抗戦、PPV、春・夏・秋・冬大会、TV観戦、全スキップ、決勝結果、優勝ジングルの復元先を固定した。季節大会BGM連続性、春タッグ、秋4団体戦、ジュニア、天挑戦、B3の既存テストと構文検査も通過した。

## 2026-07-22 遠征対抗戦を後回しにした際のゲスト複製経路を閉鎖

自団体発信の遠征対抗戦を予約した状態で、専用の実行ボタンを使わず残った選手だけで通常興行を先に終えると、終了処理から遠征画面へ再入場する旧経路が残っていた。この経路で結果処理が例外になると、試合表示用に一時追加した相手選手が自団体ロスターへ残り、進行復旧後のセーブにも複製され得た。通常興行の実行時に未処理の遠征予約を検出し、必ず通常興行より先に専用遠征フローへ自動誘導するよう統一し、興行終了後に遠征へ再入場する分岐を撤去した。

さらに、一時ゲスト3種を毎回のセーブ直前に除外し、ロード時も過去の修復済みマーカーにかかわらず毎回除去する。遠征結果処理そのものが例外になった場合も、開始前の自団体ロスター境界へ戻して予約を解除する専用復旧を追加した。検証は挑戦状オーケストレーション、遠征起動・ゲスト保護、予約カード、構文検査で行う。

## 2026-07-21 迎撃側の挑戦シリーズで自団体選手を消さないよう修正

相手団体からの挑戦を受ける3対3シリーズでは、試合後に相手ゲストをIDだけで除去していた。ID情報が競合・不整合になった場合、自団体選手まで削除し得るため、シリーズ開始前の自団体ロスターIDと一時ゲスト印を保存して照合する方式へ変更した。遠征側・迎撃側ともに自団体選手は開始前のロスター境界で保護し、ロード時の修復も遠征・迎撃・B3ゲストを対象にする。検証: 挑戦状の遠征・迎撃予約・結果フロー、契約枠保護の回帰テスト、構文検査。

## 2026-07-21 遠征対抗戦による契約枠16名への誤解放を修正

遠征対抗戦の一時ゲストでロスター数が13名を超えると、旧来の「13名超なら16名枠を恒久解放」という条件が誤発火していた。人数による16名解放条件と、`rosterCap=16` 自身を解放条件とみなす循環条件を削除した。遠征ゲストは団体ランキングの戦力計算からも除外し、既存セーブのロード時には一時ゲストを除去して契約枠を人気・実際のランキング実績から再計算する。検証: 契約枠と遠征ゲストの回帰テスト、挑戦状フローの既存テスト群、構文検査。

## 2026-07-21 遠征対抗戦の相手選手が残る不具合を防止

遠征対抗戦では相手団体の選手を試合表示のため一時的に自団体ロスターへ加える。結果反映の途中でその一時選手が残る可能性があったため、遠征開始前の自団体ロスターIDを保存し、結果反映の前後で許可リスト外・一時ゲスト印の選手を除去する二重の防御を追加した。これにより、挑戦先の選手が自団体に複製・加入することはない。検証: 挑戦状の遠征開始・結果処理・予約カードのテスト、構文検査。

## 2026-07-21 遠征対抗戦の結果確認導線

挑戦状を受諾した遠征対抗戦は、従来は自団体興行の結果画面を閉じた後にしか開始されず、選手3名だけが興行選択から消えて結果が見えない状態になり得た。興行編成画面に「遠征対抗戦を実行」を追加し、対抗戦を直接開始して結果を確認した後、同じ週の自団体興行編成へ戻れるようにした。通常の「自団体興行終了後に遠征を実行」の流れも維持する。検証: `challenge-request-away-launch-test`、挑戦状予約・結果モーダル・オーケストレーションの既存テスト群、および構文検査。

## 2026-07-21 開発者モードと検証用チェックポイント

通常プレイを最初からやり直さずにイベント画面を確認できるよう、`Ctrl + Shift + D` でだけ開く隠し開発者モードを追加した。指定したシーズン・週、または春タッグ編成／夏ジュニア大会／秋4団体対抗戦／冬・天頂戦のプリセットまで、興行と選択イベントを既定値で高速処理して停止する。到達時と任意の現在地はブラウザ内の開発用チェックポイントとして保存・復元でき、開発モード中のオートセーブは通常のオートセーブ／手動セーブを上書きしない。これにより、検証で作った状況を後の修正確認にも再利用できる。

## 直近の調整（2026-07-21 ドラフト操作停止の修正）

オフシーズン第3週のドラフトで候補選択後に「交渉開始」を押すと、共通の `refreshAll()` が週画面も再描画した際に `weekLabel is not defined` が発生し、交渉開始処理が途中で止まっていた。ドラフト中に同じ再描画を通る関連ボタンにも影響する状態だった。

`renderWeekScreen()` の `scoutEvent` 分岐で、オフシーズンと通常週の双方に対応する `weekLabel` を明示的に生成するよう修正した。実ブラウザーで候補選択、交渉開始、単独指名の契約確定、ドラフト完了画面まで通し、専用の `draft-week-render-refresh-test` と既存の `draft-offseason-flow-guard-test`、構文確認、`git diff --check` を通過した。

## 直近の調整（2026-07-21 タイトル挑戦資格のプレイヤー／AI分離）

タイトル挑戦資格の画面説明は「OVR上位5位以内または最高OVRとの差8以内」だった一方、共通エンジン判定がAI王者の適正化時に「上位3位以内または差5以内」へ厳格化され、プレイヤーのカード編成にも意図せず適用されていた。`Engine.title.getEligibleChallengers()` に運用ポリシーを追加し、既定のプレイヤー運用を上位5位／差8、AI団体のカード生成と王座戦成立判定だけを上位3位／差5に分離した。怪我・レンタル除外は両者で維持する。

境界テストを追加し、プレイヤーでは5位と差8、AIでは3位と差5がそれぞれ通り、その外側と怪我・レンタルが拒否されることを固定した。タイトル関連6本、季節ヘッダー、秋大会UI、モバイル回帰が成功し、auto-sim 100シーズン（seed 42）も5300週完走・違反0・エラー0・`ALL CLEAR`。あわせてKeisuke実機確認済みの季節ヘッダーと秋4団体戦について、階層2レイアウト、個別画面仕様、秋大会仕様、ロードマップの確認待ち表記を確定状態へ同期した。MQ経路統一は方針どおり保留し、秋大会の殿堂インフレ／報酬値とニュース文言、春夏冬BGM・秋台詞品質・春新聞写真の実機確認は別件として残す。

## 直近の調整（2026-07-21 春タッグリーグ新聞1面・優勝ペア写真）

春のタッグリーグ結果記事は見出しと本文に優勝2選手の名前を持つ一方、新聞写真用の `characterId` を一切保持しておらず、一面の200×240写真枠が空欄になっていた。大会結果の業界ニュースイベントへ代表IDと優勝ペア2名の `characterIds` を追加し、`Engine.newspaper.generate()` が生成後の新聞・バックナンバーへ2名分を保存するよう修正した。

一面描画では春タッグ優勝記事だけを対象に、2名のupper画像を枠の左右58%幅へ置き、中央16%分を少し重ねて表示する。スタンプと団体名・2選手名のキャプションは前面へ維持し、各画像から選手詳細を開ける。修正前にすでに生成済みの記事は、記事と同じシーズンの `springTagLeague` または `bestTagTeam` から優勝ペアIDを補完する。シーズン一致を必須として、翌年のペアを古いバックナンバーへ誤表示しない。

`spring-tag-league-result-placement-test` にイベントキューから完成新聞までの2ID保持を追加し、新規 `spring-tag-newspaper-team-photo-test` で新形式・旧セーブ補完・別シーズン拒否・左右重なりCSSを固定した。構文、春大会結果配置、新聞ペア写真、モバイル新聞、新聞画像スキャンの回帰と `git diff --check` を実行する。実機では新聞1面のDesktop／375pxで、2人の顔が隠れすぎず中央だけ自然に重なることを確認する。

## 直近の調整（2026-07-21 ロードマップ同期・v1.20リリース）

ロードマップに残っていた旧状態を直近実装へ同期した。アーク5は春タッグリーグ・秋4団体勝ち残り対抗戦・天頂戦まで完了、アーク3の見せ方改修もC-4/C-5/季節ヘッダーまで完了として整理。秋大会task-20、季節大会BGM連続再生、週画面おまかせ通知撤去を現在地へ反映した。成長リバランスは3系統実測に基づき「基本カーブの一律ナーフ」から「放置層を落とさず、収束ブレーキと追い込み連用を調整」へ論点を更新し、MQはtask-16調査完了後の経路一本化判断を次工程とした。

配布バージョンを `1.20` とし、`release/manifest.json`、タイトル画面、セーブメタデータ、バージョン整合テスト、READMEを同じ表記へ統一した。

検証は `version-consistency-test`、季節大会BGM、秋大会専用台詞／UI、週画面おまかせ通知、季節ヘッダー、モバイルレイアウトの回帰と `git diff --check` を通過。新規ランタイムファイルはないため、配布manifestのファイル一覧は変更せずバージョン値だけを更新した。

## 直近の調整（2026-07-21 春夏冬・大会観戦BGMの連続再生）

春タッグリーグは観戦開始時の大会曲停止と通常バトルBGMへの切替を撤去し、春大会曲を試合中・決着・結果画面までそのまま継続するよう変更した。タッグ用iframeの `BATTLE_FINISH_CUE` にも `preserveParentFileBgm` を引き継ぎ、親画面の共通終了処理が大会曲を止めないようにした。観戦終了後に同じファイルを曲頭から再生し直す処理も撤去した。

夏ジュニア大会と冬天頂戦も全観戦へ同じ保持フラグを付け、決着受信時の `fadeOut(1500)` と結果後の大会曲再起動を撤去した。通常ラウンドは大会曲を継続し、決勝だけは現行仕様どおり `iwashiro_elevate_perfect.ogg` へ切り替える。その決勝専用曲も結果画面まで途切れず、優勝演出へ進む時だけ従来どおり特別大会共通 `ff07` へ切り替わる。非常用の観戦終了でも季節大会4種は現在曲を保持し、通常興行などフラグを持たない試合の停止処理には影響させていない。保持対象はファイル名ではなく「現在再生中の大会FileBGM」なので、将来大会別音源へ差し替えても同じ経路を利用できる。

専用 `seasonal-tournament-bgm-continuity-test` で春の通常BGM切替撤去、春夏冬の決着・結果継続、夏冬決勝専用曲、優勝ファンファーレ遷移、タッグiframe伝播、非常用終了、通常試合の従来停止を固定した。春観戦、ジュニア観戦、天頂戦結果、秋大会、共通試合結果、特別大会ファンファーレの既存回帰も通過。実機では各大会で「観戦開始→決着ゴング→結果→次戦」の曲位置が連続することと、夏冬決勝だけ専用曲へ切り替わることを確認する。

## 直近の調整（2026-07-21 秋4団体戦・試合中セリフ確定稿の実装）

task-20に従い、`docs/autumn-war-match-dialogue-draft-v0.1.md` の3つのJavaScriptコードブロックを無改変で `AUTUMN_WAR_MATCH_LINES.preMatch / preFinal / survivor` として `src/data.js` へ収録した。専用 `getAutumnWarMatchLine()` は既存ジュニア取得関数と同じ `archetype → _default` フォールバックを持つ。秋大会の試合前・決勝前・勝ち残り後だけを新テーブルへ接続し、ジュニア側、`AUTUMN_WAR_MVP_LINES`、決定的seed抽選、表示確率55%／60%／75%は変更していない。

確定稿と実装オブジェクトを深い一致で比較する `autumn-war-match-dialogue-test` を追加し、秋大会UI／ライブ進行／既存MVP315本の回帰も通過。auto-simは `200 42` と `200 7919` がともに `ALL CLEAR`（違反0・エラー0・Game Over 0・秋大会200/200完走）。実機では1大会を通し、試合前と勝ち残り後に会話あり／なしが混在すること、準決勝と決勝で文脈が変わること、各選手のpersonality × archetypeに沿う口調を確認する。

## 直近の調整（2026-07-21 今週画面・おまかせ完了通知の撤去）

今週画面の `App.autoManage()` から「おまかせ完了 — 内容を確認してください」のトースト表示を撤去した。おまかせによる休養・方針設定、GameStateへの反映、`refreshAll()` による画面更新は変更していない。`weekly-auto-manage-toast-test` を追加し、完了トーストがないことと、設定反映・画面更新が残っていることを固定した。

## 直近の調整（2026-07-21 特別大会結果ファンファーレ・秋MVP演出）

特別大会の優勝結果で使う `championship` ジングルを、旧ブラス音源からオーディオミキサー `ff07` の `f10_victory_fanfare_v5.mp3` へ変更し、音量をミキサー値29%へ合わせた。ジュニア大会・春タッグリーグ・天頂戦など既存の `playJingle('championship')` 経路へ共通反映する。試合中の特別試合勝利音 `f10_v8` は別用途なので変更していない。

秋4団体戦は大会完了時に秋大会BGMをフェードし、優勝結果画面でff07を1回鳴らす経路を追加した。MVPへ進む際は優勝ファンファーレを停止し、バトル画面f10と同じ合成シーケンスを親画面の `matchVictoryFanfare` として再現してff04を鳴らす。これにより、価値の高い優勝結果が無音でMVPだけに優勝ジングルが鳴る逆転を解消した。

MVP台詞は右側の横長引用欄から撤去し、選手画像の頭上にクリーム色・尻尾付きの吹き出しとして配置した。Desktopは吹き出し→選手画像を縦に積み、375pxも中央揃えで同じ上下関係を維持する。`special-tournament-fanfare-test` を追加し、ff07実ファイル、秋優勝/MVPの音源分離、台詞が画像より先に描画されることを固定した。構文・秋UI・モバイル・音響回帰と `git diff --check` を通過。実機ではff07/ff04の聞き分け、二重再生がないこと、吹き出し位置を確認待ち。

## 直近の調整（2026-07-21 秋4団体戦・決勝前布陣UI統一）

決勝進出時だけ使っていた顔アイコン中心の専用縦リストを撤去し、初回代表編成と同じ画面形式へ統一した。Desktopは自団体3名を同一サイズの全身画像で三角配置し、対面側に決勝相手の空シルエットと空欄3枠を表示。375pxは先鋒→中堅→大将のL1縦カードをそのまま再利用する。決勝相手の団体名・平均OVR・OVR幅は両方で保持し、相手の最終順だけを開戦まで伏せる。

決勝前は準決勝を戦った同じ3名だけを中央寄せの候補棚へ並べ、役割枠を選んで選手カードを押すと指定位置へ交換する。上下移動とコンディション順の「おまかせ」も追加し、OVRと準決勝後の回復済みCONDITIONを人物カード・候補棚の双方へ表示する。メンバー交代は許可せず、従来どおり3名の順番だけを `reorderForFinal` へ確定する。

検証は `node --check`（app/ui-common/UIテスト）、`autumn-war-ui-flow-test`（初回Stage/L1/候補棚再利用、決勝用交換操作、旧縦リスト撤去、COND表示）、`mobile-layout-test`、`autumn-war-live-engine-test`、`git diff --check` を通過。実機ではDesktop三角配置、375px L1、役割枠→候補選手の交換、上下移動、おまかせ、回復後CONDの見え方を確認待ち。

## 直近の調整（2026-07-21 秋4団体戦・観戦BGMと結果左右固定）

4団体勝ち残り対抗戦の観戦開始時に秋大会BGMを停止して通常バトルBGMへ切り替え、観戦終了後に秋大会BGMを再生し直していた経路を撤去した。秋大会の観戦メッセージへ `preserveParentFileBgm` を付け、バトル画面からの終了ゴング通知にも同フラグを引き継ぐことで、観戦開始から結果復帰まで大会曲を途切れさせず継続する。他の通常試合は従来どおり終了通知でBGMを停止する。

フォール結果ポップアップはエンジン内部の `orgA / orgB` 順を直接使わず、戦況ボード共通の表示順へ変換するよう修正した。プレイヤー参加戦では相手団体を左、自団体を右に保ち、団体名・スコア・選手画像・役割・勝者側・コンディション表示が一斉に入れ替わるため、戦況ボードから結果へ進んでも左右が反転しない。

検証は `node --check`（app/ui-common/battle-engine/UIテスト）、`autumn-war-ui-flow-test`（大会BGM保持フラグ、通常BGM切替の不在、終了通知伝播、結果表示順）、`event-match-result-popup-test`、`autumn-war-live-engine-test`、`mobile-layout-test`、`git diff --check` を通過。実機では観戦開始・決着ゴング・結果復帰を通じて大会曲が継続することと、結果画面でも相手左・自団体右が維持されることを確認待ち。

## 直近の調整（2026-07-21 秋4団体戦・編成操作と中央6名戦況ボード）

ユーザー承認済み `autumn-gauntlet-war-entry-live-board-v0.2.html` を実画面へ反映した。Desktop代表編成で、幅48%の人物ボタン3枚が重なり、子要素の役割ボタンを覆っていた構造を撤去。人物画像はクリック判定を持たない表示レイヤー、先鋒／中堅／大将の名前・OVR枠は `z-index:30` の独立操作レイヤーに分け、自団体側の右半分・各人物直下だけに収めた。相手側には文字も操作もない空欄3枠を追加。375pxは承認済みL1縦カードを維持する。

試合状況は4団体同格カード＋2名フォーカスから、現在対戦中の2団体・計6名を中央に大きく映す全身画像ボードへ変更した。プレイヤー参加戦は相手を左、自団体を右へ固定し、元画像の向きに合わせて左側だけ反転して中央へ対面させる。役割・名前・RING/WAIT/OUTを人物直下に対応させ、現在フォールの2名とコンディションを下段へ集約。4団体全体は小型ステータスレール、勝ち上がりは従来の小型クライムラインで残した。

操作は `[観戦する] [この試合の結果を見る] [まとめてスキップ]` の3つをDesktop 48px高・375px 54px高の同寸に統一。「まとめてスキップ」は確認後、現在団体戦の残りだけを既存 `Engine.autumnWar.simulateNextBout` で最大5フォールまで順次処理し、団体戦決着画面で停止する。legacy一括計算や次の団体戦への自動遷移は使わず、GameState・大会RNG・消耗計算・オートセーブは通常の逐次経路を維持する。

検証は `node --check`（app/ui-common/UIテスト）、`autumn-war-ui-flow-test`（右側自団体、左側のみ反転、役割ボタン分離、中央6名、同寸3操作、確認付き逐次スキップ）、`autumn-war-live-engine-test`、`autumn-war-mvp-lines-test`、`mobile-layout-test`、`git diff --check` を通過。実機ではDesktop/375pxの人物と名前枠の対応、全役割ボタンの1回押下、両陣営の向き、3操作ボタンの寸法、現在団体戦だけがスキップされることを確認待ち。

## 直近の調整（2026-07-21 秋4団体戦の確率会話・優勝スピーチ）

4団体勝ち残り対抗戦に、毎回固定で出さない会話演出を追加した。各フォール開始前は55%で左右2選手の掛け合い、結果は60%で勝ち残り選手の一言、優勝結果は75%で優勝3名のうち最多勝ち抜き選手による代表スピーチを表示する。前後の試合会話はジュニア大会で確立済みの `preMatch / preFinal / postMatchWin` personality × archetype ルーターを再利用し、優勝スピーチは秋大会 `champion` 文脈の完全マトリクスを使う。

会話の有無と文面は `rngSeed / season / week / round / org / fall / fighterId` から作るローカルseedで決めるため、大会進行RNGを消費せず、再読込・再描画でも変化しない。共通1試合結果ポップアップには勝者吹き出しを明示的に省略できるオプションを追加し、他大会は従来どおり表示する。`autumn-war-ui-flow-test`、`event-match-result-popup-test`、`autumn-war-live-engine-test`、MVP315本検証、モバイル検証を通過。実機では「会話が出る試合と出ない試合が混在すること」と優勝スピーチの見え方を確認待ち。

## 直近の調整（2026-07-21 グローバルヘッダー／季節表示 task-18）

task-17で承認された日付A案を実装。`Engine.util.getSeasonInfo()` に48週・12週季節・4週月の定数と季節メタデータを集約し、完全日付を `{年目} {季節} 第{季節内週}週` へ統一した。社長室の季節背景も同じ情報源へ統合し、重複判定関数と未使用の四半期変数を削除した。

グローバルヘッダーはH1を採用し、団体アイコンと最大サイズの日付を左、資金・人気・Heat・順位・王座を中央、音声操作を右端へ配置した。`WRESTLE MANAGER` 表示を撤去し、375pxでは日付と音声を1段目、5指標を下段へ再配置する。`#weekTitle` は日付を持たず週種別だけとし、年間バー上部の重複日付も削除した。

年間バーは48セルのCSS gridへ再実装し、12本の月境界、4本の季節境界、4区間の月表示、現在週マーカーをクラスだけで描画する。オフシーズンは48週完了状態と年度末ブリッジを表示する。`header-season-redesign-test` と拡張した `mobile-layout-test` で季節境界、A表記、単一情報源、日付重複の不在、375px構造、CSSトークン使用を検証した。実機のデスクトップ / 375px表示確認はKeisuke確認待ち。

## 直近の調整（2026-07-21 4団体勝ち残り対抗戦 Phase 2）

Codex task-19 Phase 2を実装。Week 35の事前編成を撤去し、Week 36到達時に「導入 → 代表編成 → 準決勝 → 決勝前采配 → 決勝 → 結果 → MVP」をAGW専用の全画面Stageで連続進行する形へ変更した。通常興行の `#showResultOverlay` は使わず、`#autumnWarOverlay` / `#autumnWarScreen` と `data-phase="intro|entry|board|reorder|result|mvp"` で管理する。大会中はOfficeへ戻る入口を持たず、セーブ／再読込時はライブsessionから再開する。

代表編成は承認済みモックアップを反映。Desktopは同サイズのフル画像3名を、先鋒・大将が前、中堅が背後上の三角配置にした。対面側は未確定の3枠を低彩度で示す。375pxはL1縦カードを先鋒→中堅→大将で並べ、候補棚を横スクロールにした。初戦相手の平均OVR・OVR幅はモバイルでも保持する。OVRは数字だけを強調し、選手データベース共通の100/95/90/85/80/70/60閾値色を使用。主要な選手画像・名前から選手詳細を開ける。

大会進行は1フォール逐次確定を維持し、`[観戦する]` を追加した。観戦時は同じ `simulateNextBout` を `recordFrames` 付きで一度だけ実行し、確定した勝敗・消耗をGameStateへ保存してからframesをバトル画面へ渡す。観戦完了／中断時は再シミュレートせず、同じ結果を戦況ボードへ表示する。`[結果を見る]` と観戦の同一シード結果・大会状態が一致する回帰テストを追加した。

R-2は独立コミットで、秋大会を大一番tier 2／`BIGMATCH_ENG` から通常試合tier 1／`ENG`へ変更した。wear式、初期80、floor 40、準決勝→決勝の回復+15は据え置き。2,000ペアシード（各fall 6,000試合）の比較では、勝者コンディション平均が第1フォール54.31→58.35、第2 44.85→46.57、第3 44.93→46.59。勝者残HP率は34.01%→53.68%、26.62%→44.32%、21.81%→36.62%。

検証は `autumn-war-live-engine-test`（観戦／スキップ決定論、通常HP基準）、`autumn-war-ui-flow-test`（専用DOM、Week 35撤去、全phase、レスポンシブ、詳細導線、トークン）、`autumn-war-mvp-lines-test`（147セル315本）、`agw-tier-comparison` 2,000ペアを通過。`node test/auto-sim.js 200 42` と `... 200 7919` は両方ALL CLEARで、各シードとも違反0・エラー0・秋大会200完走/中止0。合計400シーズンで秋大会400回が完走した。

ローカルコミットは `58d6add`（専用ライブ画面・観戦・編成UI）と `0756e64`（通常試合tier）。pushは未実施。残件は実機でのDesktop/375px表示、観戦復帰、決勝前並び替え、結果→MVPの目視確認と、確定仕様差分の確認。

## 直近の調整（2026-07-21 挑戦試合を興行へ統合・開催地分離・信頼値の非表示化）

挑戦状・直訴・B3の試合を、受諾した場で即時実行せず必ず興行の中で行う形へ統一した。AI側から届く挑戦は次の通常自団体興行の上位枠へ入り、自団体選手からの直訴は次の通常自団体興行終了後、相手団体興行へ遠征した立て付けで3試合だけを実行する。固定季節興行とPPVは予約を消費せず、遠征選手は同日の自団体カードから外れる。遠征分には自団体の会場・入場料収入を計上せず、消耗・成長・負傷・キャリア・H2H・選手間関係は反映する。

挑戦試合の選手間関係は方向別に専用化。勝者側は因縁+2〜+6・相手との関係-1〜-3、敗者側は逆恨みとして因縁+20〜+30・相手との関係-8〜-14。引き分けは双方の因縁+10〜+16・相手との関係-4〜-7。高MQと格下勝利では敗者側の因縁を追加し、通常の「宿命の決着」や因縁リセットは抑止する。結果画面ではこの2軸だけ方向別数値を表示する。

所属団体への信頼は内部パラメータのまま維持し、UI上の数値・差分・バー・矢印・直接的な上昇下降表現を撤去した。選手の表情、態度、噂、会話から推測する。挑戦試合で表示する「相手との関係」は選手間Bondであり、団体信頼とは別物として扱う。

あわせて、通常試合結果ポップアップの試合番号逆転、タッグ残HPの参照先、引き分け時の偽勝者表示を修正。挑戦状の直近対戦・CD計算に残っていた20週換算を48興行週の共通カレンダーへ統一した。関連する予約・開催経路・関係値・B3音声・信頼露出ガード・結果UI・カレンダー回帰テストを追加・更新した。

## 直近の調整（2026-07-20 defStaScale復元・MQ上限の実測・能力値寄与の計測・解禁閾値の復帰）

Codex が task-12 / 13 / 14 / 15 を実施（`618ebb5` / `45f528d` / `0e0aeb9` / `69a67aa`）。

**task-12: `defStaScale` を 0.025 へ復元**。task-10 で HP寄与の復元との二重加算を避けるため 0.0125 へ半減されていたが、`defMntScale` を 0.06 のまま据え置いたため防御の ST:MN 比が 1:2.4 → 1:4.8 へ変化し、検証済みの状態から MN が相対的に有利な方向へずれていた。復元に伴うずれは Climax 倍率で吸収（通常 1.45→1.54、大一番 1.70→1.79）。統制比較の目標値は維持、平均MQ 53.07、勝率は全帯許容差内。

**task-13: MQ上限の最悪ケース計測**（`test/mq-ceiling-worstcase-report.md`）。**task-11 の「クランプ0件・最大96」を覆す結果**。あれは auto-sim のカード構成（タイトル戦0件・並のOVR）を映したもので上位カードを覆っていなかった。OVR95の現実寄りカードでは +12外部キャップに 20,000/20,000（100%）到達し平均2.428点を切り捨て、それでも最終MQの5.32%が100超（最大108）。同カードを画面経路で再構成すると14.35%が100クランプに掛かり平均5.347点・最大14点が失われる。人工最大では上限が無ければ127まで伸びる。タッグはエンジン内部で素点を100へ丸めた後に headless が会場+6・ラストラン+5 を加えるため最終23.665%が再び100超（最大111）。**問題は「100に届くか」ではなく経路ごとに上限処理が違うこと。**到達条件も人工的とは言えず、王座+5・通常因縁最大+5・上位会場+3〜6 だけでキャップに到達する（ただし本計測の割合を通常興行全体へ外挿してはいけない）。

**task-14: 能力値の限界寄与を表として整理**（`docs/stat-contribution-report.md`）。基準90・通常戦で +10 したときの勝率上昇は SP+4.79 / TE+4.57 / ST+4.40 / PW+4.33 / **MN+1.96**。**4能力のばらつきは0.46ptで、1万試合の統計誤差（±1pt前後）を下回るため実質的に区別がつかない**——狙いどおり拮抗している。MN は4能力平均の43%で、誤差をはるかに超えた差。「一段落ちる」設計意図が数字で確認された。**基準値が高いほど限界寄与が小さくなる**（4能力平均: 基準60で約5.9pt → 75で約5.0pt → 90で約4.5pt、60→90で約24%減衰）。また大一番では SP/TE の価値が上がる（SP 4.79→5.44、TE 4.57→5.33）一方 PW/ST はほぼ横ばいで、長い試合ほど命中・カウンターが積み重なる挙動になっている。

**task-15: フィニッシュ級の解禁閾値を設計値へ復帰**。通常戦 0.75→**0.50**、大一番 0.80→**0.40**。task-09 で頻度目標（0.8〜1.5回/試合）を満たすために緩められ、終盤の二段構造が壊れていたうえ、大一番のほうが早く解禁される逆転状態になっていた。**頻度目標そのものを撤回**（Keisuke 判断: 出ないなら出なくてよい、数試合に一度でよい）したため、頻度補填やフェーズ倍率の追加調整は一切なし。実測は通常戦 0.444回/試合（0回率64.5%）、大一番 0.341回/試合（0回率72.0%）で、**大一番のほうが出にくいという設計上の順序も復活**。平均MQ 53.61（task-12比 +0.54）、勝率は全帯 ±1.5pt 以内、auto-sim 100シーズン ALL CLEAR。

**成長リバランスへの申し送り**: task-14 の減衰カーブより、OVR90帯は**すでに能力を伸ばしても効きにくい**帯である。成長カーブを渋くする際に全帯一律で適用すると、高OVR帯が「伸びない上に伸ばしても効かない」二重苦になりうる。渋くする対象を低〜中OVR帯へ寄せるかどうかが論点。

変更: Codex側 `src/data.js` / `test/` 各種 / `docs/stat-contribution-report.md` / `test/mq-ceiling-worstcase-report.md`、こちら側 `docs/design-decisions.md` / `docs/game-system-roadmap.md` / `specs/move-selection-spec-v0.1.md` / `docs/codex-tasks/task-12〜15` / 本項。

## 直近の調整（2026-07-20 セーブスロット名の設定機能）

手動セーブスロットに任意の名前を付けられるようにし、書き出しファイル名に反映するようにした。

**書き出しファイル名**: 従来 `wm_save_slot1_S4W3_2026-07-20.json` の `wm_save_slot1` 部分が、設定した名前に置き換わる（`メインセーブ_S4W3_2026-07-20.json`）。シーズン・週（`S4W3`）と日付は従来どおり残す。名前が未設定なら従来形式にフォールバック。

**保存先**: セーブデータ内の `_saveName` フィールド。別の localStorage キーにすると書き出し・読み込みで名前が失われるため、データと一緒に持たせた。`_saveName` を持たない旧セーブは名前なしとして正常動作する。

**サニタイズ**: 制御文字の除去 → トリム → コードポイント基準で32文字に切り詰め（サロゲートペア対応）。ファイル名生成時はさらに `/ \ : * ? " < > |` を `_` に置換。サニタイズ後に空になれば従来形式へフォールバック。

**UI**: スロットのボタン列に「✏️ 名前」を追加（データのあるスロットのみ。オートセーブと空きスロットには付けない）。押すと既存のD型モーダル（`showConfirm` と同系統の `_mdlDOpen`/`_mdlDClose`）を流用した入力モーダルが開く。Enterで決定、空欄決定で名前を解除。名前が設定されていればスロットのタイトルがその名前になり「スロット N」は小さな副次表示に回る。表示・入力値とも `_escapeHtml` を通している。

**名前の伝播について（設計判断）**: セーブ名は `G`（単一のゲーム状態）には載せず、各スロットの保存データにのみ持たせた。上書きセーブ時は「そのスロット自身に既に付いている名前」を読み直して引き継ぐ。`G` 経由にすると、名前Aのスロットからロードして名前Bのスロットにセーブした際にBの名前がAで上書きされる汚染が起きるため。副作用として、名前付きセーブをファイルから読み込んで別の空きスロットにセーブした場合、名前は自動では引き継がれない（ファイル内の `_saveName` 自体は往復で保持される）。

変更: `src/app.js` / `src/ui-common.js` / `src/ui-render.js` / `src/index.html` / 本項。新規ファイルなしのため `release/manifest.json` の更新は不要。

## 直近の調整（2026-07-20 フェーズ構成とHPの同時較正、HP式の配分是正へ）

Codex が task-09 を実装（`7ebd123`）。フェーズ境界とHPを一体で探索し較正。

**採用値**: 通常戦 `MAX_T` 16→21・Climax開始 13→12T・HP `100+ST×1.8` → `198+ST×1.55`・Climax mult 1.30→1.38・Climax tierW big 65→55。大一番 `BIGMATCH_MAX_T` 24→33・Climax開始 19→18T・HP `170+ST×2.2` → `401+ST×1.35`。End フェーズは 9-12T から 9-11T へ短縮。あわせて**フィニッシュ級（d14〜16）をクールダウンの対象外**とし（通常大技 d11〜13 のクールダウンは維持）、「大技で解禁→中技→ようやくフィニッシュ級」の2ターン遅延を解消。`test/phase-hp-calibration-search.js` と `test/finisher-cooldown-test.js` を新設。

**統制比較（OVR差5帯×各10,000試合）**: 平均ターン数 通常14.27 / 大一番21.85、Climax到達率 87.22% / 94.34%、Climax平均滞在 3.41T / 4.98T、フィニッシュ級 0.90回 / 1.54回、時間切れ率 1.73% / 0.25%。**目標をほぼ全項目で達成**。通常戦が目標15Tに対し14.27Tなのは、Climax開始12Tと滞在上限3.5Tを同時に守ると理論上14.5T以下になるため（トレードオフとして許容）。

**回帰**: 100シーズン42,049試合 ALL CLEAR。**格上勝率は全帯 ±0.3pt 以内**（49.45/67.19/78.29/86.64/95.18）。MQ 53.38→54.65（+1.27、Climax決着増による予告どおりの上昇）。小技フォール／ギブアップ0件・通常大技2連続0件を維持。実興行の大一番は全快群19.28T・Climax到達78.34%、疲労持越し群14.46T・到達29.48%。依存監査では持越しHP・消耗がHP比率で追従しセーブ互換も維持。観戦時間は通常+3秒・大一番+6秒程度の見込み。

**発覚した副作用: HP式の形が変わり ST の寄与が激減した。** ベースが大きく増えて傾きが減ったため、高ST選手の優位が通常戦 +52%→+30%、**大一番 +43%→+15%** に縮小。大一番でST90の選手がST40より15%しかHPが多くない状態。スタミナ型というキャラクターの個性がデータ上ほぼ無意味になり、次に控える成長リバランスで ST を伸ばす価値の前提も狂う。**原因は task-09 の指示書が「ST による差は維持すること」を制約に入れ忘れたことで、実装の落ち度ではない。**

**残った宿題2点**: ①怪我判定が `matchResult.turns × 0.0015` を含むため試合長の伸びで怪我が増える（1試合あたり通常+0.3pt / 大一番+0.6pt と報告されたが**シーズン単位が未計測**）。②ペーシング減点の理想下限が大一番13T・通常7Tのままで、平均21.85T / 14.27T となった今**全試合が減点0になり機能停止**している。

`docs/codex-tasks/task-10-hp-shape-and-followups.md` を作成。①HP式の配分是正（平均HPを維持したまま `ENG: 141+ST×2.50` / `BIGMATCH_ENG: 272+ST×3.50` へ。ST60時点のHPが現状と一致するため較正結果は中心値として維持される見込み。高ST優位を通常1.50倍以上・大一番1.40倍以上に保つことを制約として明記）、②年間怪我件数の計測（`3e9ca50` 時点との対比・対処は判断待ち）、③ペーシング閾値の引き上げ（大一番 13/10→18/14T、通常 7/5→8/6T）を1本にまとめた。③により連戦消耗系（秋の勝ち残り戦等）のMQが下がるため、影響量を分離集計で報告させる。

変更: `docs/codex-tasks/task-10-hp-shape-and-followups.md`（新設）/ ロードマップ / 本項。

## 直近の調整（2026-07-20 大一番の試合長を診断、フェーズ＋HP同時較正へ）

Codex が task-08（診断専用・`src/` 変更なし）を実施（`399ab85`）。`test/bigmatch-length-diagnosis.js` を新設。

**結論: エンジンは正常だった。** 統制比較（同一カード・全員全快・同一シード・OVR差5帯×各10,000試合）で、大一番は全帯で **+37〜40%長い**（差0: 12.847→18.072T、差20: 11.674→16.045T）。最大HP比は実測1.418〜1.434倍で設計どおり効いており、これを打ち消すダメージ過多も無い（1ターン平均ダメージは Opening のみ大一番が16〜20%高く、Mid はほぼ同等、End/Climax はむしろ低い）。

**前回の「大一番に起承転結が存在しない」は誤読だった。** 実運用サンプル2,283試合のうち **66.75%（1,524試合）が連戦疲労で開始HPが減った試合**で、これが平均を押し下げていた。由来別の内訳は秋の4団体勝ち残り戦1,249試合（開始HP平均66.31%）/ 天頂戦175試合（89.18%）/ ジュニア大会100試合（62.35%）。勝ち抜き戦は1フォールごとに1試合としてシミュレートされるため年12.5試合が量産され、**大一番サンプル全体の54.7%を単一イベントが占めていた**。消耗持ち越しは E-4 の設計の本体であり、短くて当然だった。

**教訓（一般化して記録）**: バランスを測るときは**比較する群の条件を揃えたシミュレーションを組む**こと。実運用サンプルをそのまま並べて比較しない。「秋の勝ち残り戦を除外する」は今回の一例にすぎず、原則は開始HP・カード構成・試合ルールを揃えること。

**残る問題**: 全快だけを見ても、通常試合は Climax到達50.43%・滞在1.13T、大一番（全快759試合）は平均15.51T・Climax到達27.01%・滞在0.66T。フェーズ表（通常16ターン想定 / 大一番24ターン想定）が実際の試合長と噛み合っておらず、Climax が段階として体験されていない。

**対処方針の転換**: task-08 以前は「フェーズ境界を実測に合わせる案（①）は大一番が通常試合と同じ長さになるため却下」としていたが、それは汚染データで大一番を12.5ターンと誤認していたためだった。実際は17.5ターンあるため、**①を行っても試合は1ターンも短くならない**。ただし **①だけでは成立しない** — Climax の高倍率と大技重みが前倒しされて試合がさらに短くなり、到達率が再び下がるフィードバックループがあるため、**HP調整（②）と一体で較正する必要がある**（Keisuke 指摘）。

`docs/codex-tasks/task-09-phase-and-hp-calibration.md` を作成。目標値は通常15ターン前後 / 大一番22ターン前後、Climax到達70%以上、Climax滞在2.5〜3.5T（大一番3.5〜5.0T）、フィニッシュ級0.8〜1.5回/試合。回帰として小技決着0件・大技2連続0件・格上勝率±1.5pt・MQ±1.5を維持させる。残課題A'（フィニッシュ級をクールダウン対象外にして2ターン遅延を解消）と残課題B（大技の実効上限に合わせた `tierW` の書き換え）も同タスクに統合。`MAX_T`・HP係数の変更は試合シミュレーション外へ波及しうるため、MQ算出・怪我判定・タッグ・セーブ互換への依存を**実装前に調査して報告**させる手順を組み込んだ。

変更: `docs/codex-tasks/task-09-phase-and-hp-calibration.md`（新設）/ `specs/move-selection-spec-v0.1.md` / ロードマップ / 本項。

## 直近の調整（2026-07-20 フィニッシュ級の解禁改訂とフェーズ構成の乖離判明）

Codex が task-07 を実装（`3e9ca50`）。フィニッシュ級の解禁閾値を `pinAttemptHpThreshold` の流用から専用定数 `finisherUnlockHpThreshold`（通常0.50 / ビッグ0.40）へ改訂。

**効果**: フィニッシュ級 0.115→**0.203回/試合**、0回率 89.09%→**81.28%**（1.77倍）。平均ターン数12.27→12.22、時間切れ率5.96→5.93%、平均MQ 53.70→53.38。小技フォール／ギブアップは引き続き0件、大技2連続も0件。格上勝率は差20以上で93.36%→**95.02%**（変更前95.48%）まで戻り、前回懸念した番狂わせ増加は解消した。

**ただし想定（1〜2回/試合）には届かず**、新たな律速が判明した。フィニッシュ級の解禁判定は攻撃前に行われるため**HPを50%以下に落とす一撃そのものには使えず**、かつその一撃はたいてい大技なので**クールダウンが立って次ターンも使えない**。「大技で解禁→中技→ようやくフィニッシュ級」で最短2ターンの遅れが構造的に発生する。Climax の平均滞在が1.13ターンしかないため、この2ターンが確保できない。→ **フィニッシュ級をクールダウンの対象外とする**案が有力（較正タスクで扱う）。

**フェーズ構成の乖離が判明（本日の最大の発見）**: 通常試合の Climax到達率50.43%・平均滞在1.13ターン、決着ターンに **T13（Climax開始ターン）の18.50%** という突出したピーク。倍率1.05→1.30・大技重み30→65 が跳ねた瞬間に試合が終わっており、**Climax が「段階」ではなく「終わる瞬間」になっている**。ビッグマッチはさらに深刻で、Climax到達率**11.85%**・平均滞在**0.28ターン**・最多終了フェーズが**Mid（44.10%）**。現状**大舞台は通常試合よりも構造的に盛り上がらない**状態にある。

**対処方針**: フェーズ境界を実態に合わせて圧縮するA案は、ビッグマッチが通常試合と同じ長さになり大舞台として成立しないため**却下**（Keisuke 判断）。**ビッグマッチを本当に長くするB案**を採用する。ただし着手前に診断が必要——ビッグマッチの最大HPは通常の約1.45倍（302 vs 208）でフォール閾値もキックアウト回数も厳しいのに平均ターン数がほぼ同じ（12.5 vs 12.22）で、**計算より4〜5ターン短い**。ジュニアトーナメント／秋の勝ち残り戦／天頂戦はいずれもビッグマッチ扱いかつ `_hpOverride` で開始HPが削られるため、**消耗持ち越し試合の混入がサンプルを歪めている疑い**がある（決着ターンのT7に7.81%の不自然なピーク）。切り分けないままHPを増やすと全快の試合が無用に長くなる。

`docs/codex-tasks/task-08-bigmatch-length-diagnosis.md` を作成（**計測のみ・`src/` 変更禁止**）。実戦サンプルを全快／消耗持ち越しの2群に分離した再計測に加え、**同一固定カード・全快・同一シードで通常ルールとビッグマッチルールを走らせる統制比較**（OVR差5帯 × 各10,000試合以上）を中核に据えた。サンプル構成の違いを排除しないと「同じ条件ならビッグマッチは何ターン長いのか」に答えられないため。あわせて最大HPの実測とフェーズ別の平均ダメージも計測させ、HPが1.45倍あるのに試合が伸びていない原因を特定する。

変更: `specs/move-selection-spec-v0.1.md`（§12 に残課題A'・C を追記、旧Cを統合）/ `docs/codex-tasks/task-08-bigmatch-length-diagnosis.md`（新設）/ ロードマップ / 本項。

## 直近の調整（2026-07-20 技選択3ティア制・開幕大技の実装完了＋較正課題の洗い出し）

Codex が task-05（技選択再設計）と task-06（開幕大技）を別コミットで実装（`1bb55ed` / `610037a`）。変更は `src/data.js` / `src/match-engine.js` / `test/auto-sim.js` の3ファイルのみ。実装内容が仕様に忠実であることをコードレビューで確認済み。

**達成**: 小技によるフォール／ギブアップ決着が **0件**（本件の主目的）。小技TKOは321件で許可どおり。通常大技の2連続は0件でクールダウンが正常動作。平均ターン数 11.94→12.27、時間切れ率 5.99%→5.96%、平均MQ 54.19→53.70 で、懸念していた長期化は起きなかった。task-06 は **OVR差15未満の固定500試合が実装前後でハッシュ完全一致**し、既存試合への非侵襲を証明。全快固定カード各50,000試合での開幕決着率は 0.026%/0.332%/1.668%/7.474% と設計値 0.03%/0.4%/1.8%/8.0% に収束。ダメージ帯分布も設計値どおり。反撃倍率1.4は1.0との対照計測で格下逆転率を最大+1.32ptしか動かさず維持。開幕決着は年1.30件、MQ平均33.89（低MQで興行に跳ね返る設計意図どおり）。なおシーズン計測での発動率（差30以上12.53%）が全快固定（7.47%）より高いのは連戦で開始HPが減った選手が開幕決着されやすいためで、トーナメント・勝ち残り戦で連戦の危険性が自然に表現される良い副産物として維持する。

**発覚した課題3点**（いずれも実装の不備ではなく設計数値の問題）:

- **A: フィニッシュ級がほぼ死んでいた** — 0.115回/試合、89.09%の試合で一度も出現せず（想定1〜2回/試合の10分の1）。原因は解禁閾値に `pinAttemptHpThreshold`（0.35）を流用したこと。同じ35%はフォールが飛び始める閾値でもあるため、解禁と同時に試合が終わりへ走り出し窓が1〜2ターンしか開かない。順序としても「大技で削り切る→フォール圏→決めにいく」であるべきところ、両方が同時解禁になっていた。**専用定数 `finisherUnlockHpThreshold`（通常0.50 / ビッグ0.40）を新設して前倒しすることを決定**（Keisuke 承認）。フォール閾値との間に15ptの帯を作り終盤を二段階に分節する。
- **B: 大技の実効上限がクールダウンで約50%** — Climax の設定65%に対し実測45.12%、End も30%に対し24.25%。設定値が挙動を表しておらず今後の較正で誤解を生むため、実態に合わせた書き換えが必要。残課題Cと合わせて判断。
- **C: Climax到達率が未計測** — 平均12.27ターンに対し Climax は13ターン目開始（`MAX_T`=16）。平均的な試合が Climax 直前で終わっている疑いがあり、事実ならAの一因でもある。フェーズ境界の前倒しを検討する前に実測が必要。

**格上勝率**は差20以上で 95.48%→93.36%（−2.12pt、番狂わせが4.5%→6.6%と相対5割増）。方向は「実力差を残酷に」の意図と逆だが、開幕大技が約+1pt戻すため実質−1pt程度として現時点は許容。

`docs/codex-tasks/task-07-finisher-unlock-and-phase-measurement.md` を作成。①解禁閾値の改訂（実装）と②フェーズ到達率の計測（計測のみ・修正禁止）を1本にまとめた。B・Cの対処は②の結果を見てから別途較正する方針。

変更: `specs/move-selection-spec-v0.1.md`（§5改訂・§12実測結果と残課題を新設・以降の節番号繰り下げ）/ `docs/codex-tasks/task-07-finisher-unlock-and-phase-measurement.md`（新設）/ ロードマップ / 本項。

## 直近の調整（2026-07-20 技選択再設計・開幕大技の仕様策定／フィニッシャー整理）

試合演出まわりの設計セッション。実装は未着手で、仕様書2本とCodex指示書1本を起こした。

**① 技選択ロジックの問題を特定**。「終盤でも地味な小技が決着技になる」症状の原因を `Engine.battle.selMove` に特定した。フェーズ進行で大技プールを引く確率（`sCh`）は上がるが、共通プールの中身が不変のため、クライマックスでも30%の確率で d2 の技（ストンピング等）が候補に入る。共通プール73技のうち約34技が d≤5 のため、クライマックスのターンの約14%が d≤5 の小技になる計算。副次的に、カテゴリを `catW` から引いてからプールを絞る順序のため `styleMoves`（各12技・全カテゴリ非網羅）で該当なしとなり、プール全体からの完全ランダムにフォールバックしてスタイル別重みが効いていない不具合も発見。`specs/move-selection-spec-v0.1.md` として再設計（威力ベース3ティア制／フェーズ別ティア重み／フィニッシュ級 d14+ を既存 `pinAttemptHpThreshold` で解禁／丸め込みはティア制対象外の独立経路／大技クールダウン1ターン／カテゴリ抽選の正規化）。技データは一切変更しない設計。`docs/codex-tasks/task-05-move-selection-rework.md` に実装指示書を作成（変更可能ファイルを3つに限定、実装前のベースライン計測を必須化）。

**② 開幕大技システムを新規設計**。OVR差15以上のカードで、格上のみが Opening に高威力の一撃を放ちうる仕組みを `specs/opening-execution-spec-v0.1.md` として起草。発動率は差に応じて 5〜40%、命中率 50〜80%。命中時のダメージは最大HP比 20〜105% の共通帯で、OVR差は出目の偏りだけを動かす（差が大きくても浅く入りうる）。決着可否を別のサイコロで決めず、振ったダメージがHPを削り切ればそのまま決着とすることで「数値は嘘をつかない」を担保。透かし時は反撃補正 ×1.4、キックアウトは無効。差30以上でも開幕決着は約8%。

**③ フィニッシャーシステムの位置づけを整理**。`specs/archive/` に誤って置かれていた `finisher-system-spec-v1.0.md` を `specs/` 直下へ戻した（実装未着手のためアーカイブは不適切、CLAUDE.md索引にも未掲載でロードマップの参照がリンク切れだった）。議論の結果、固有フィニッシャーは「決め技が1つに固定される」「技名を設定したキャラだけ特別扱いになる」問題があるため**優先順位を大きく下げ**、代わりに全キャラ共通の「決着演出の強化」を優先する方針に変更。実装順は 技選択是正 → 決着演出強化 → 開幕大技 と決定。

**④ 開幕大技のCodex指示書を追加**（同日追記）。`docs/codex-tasks/task-06-opening-execution.md` を作成。あわせて仕様書に §4.3「使用する技の選択」を追加した——開幕大技が発動したターンにどのプールから技を選ぶかが未定義で、放置すると一撃が「ストンピング」になりかねなかったため。発動ターンは通常のティア抽選を行わず大技ティア（d11〜16、フィニッシュ級のHP解禁を無視して含む）から抽選し、選ばれた技の `d` 値はダメージ計算に使わず名称・カテゴリ・決着タイプのみを供給する形とした。これにより本タスクは①（技選択再設計）への依存が確定したため、指示書冒頭に前提タスクとして明記し、同一ファイルを触ることによる並行実行禁止も併記した。回帰確認の最重要項目として「OVR差15未満の試合は同一シードで変更前後が完全一致すること」を指定。

**⑤ ティア重みの調整と「小技では決着しない」規則の追加**（同日追記・Keisuke 決定）。フェーズ別ティア重みを Opening 70/25/5・Mid 35/45/20・End 15/55/30・Climax 0/35/65 に変更（序盤をより探り合いに、End の大技を 40→30 に抑制）。あわせて **小技（d2〜5）ではフォール決着・ギブアップ決着が発生しない**規則を §4.5 として追加した。ティア重みの調整と違い抜け道がないため、これが地味決着対策の要となる。TKO は許可（小技を浴び続けて壊れる展開はドラマであり、既存条件が十分厳しい）。丸め込みはフォール決着が本体のため対象外。小技ダメージでは防御側HPが1を下回らないよう下限クランプを設け、HP0のまま決着せず膠着する事態を防ぐ。なお本変更は3要因（Opening小技増／End大技減／小技で決着しない）がいずれも試合を長くする方向に働き、`MAX_T`=16 超過の時間切れ判定が増える可能性がある。**実測してから対処する方針**とし、Codex には数値報告のみを指示（対処は禁止）。

変更: `specs/move-selection-spec-v0.1.md`（新設）/ `specs/opening-execution-spec-v0.1.md`（新設）/ `specs/finisher-system-spec-v1.0.md`（archive から移動）/ `docs/codex-tasks/task-05-move-selection-rework.md`（新設）/ `docs/codex-tasks/task-06-opening-execution.md`（新設）/ `CLAUDE.md` / ロードマップ / 本項。

## 直近の調整（2026-07-19 相関図停止修正・端末互換確認・v1.14b表記統一）

データベースの相関図で「ネットワーク」「フォーカス」「派閥」が表示されず、「勢力図」でも選手の選択・右クリック詳細が動かない不具合を修正。Chromeで実機再現し、描画開始時の `history.forEach is not a function` を確認した。原因は `relationshipHistory` が、引退因縁では配列、裏切り履歴ではオブジェクトという二つの形式で使われていたこと。保存形式を `{ betrayalRecord, retiredRivalries }` に統一し、旧配列セーブを記録を失わず自動変換するマイグレーションを追加した。新規ゲーム、旧セーブ変換、裏切り履歴保持、引退因縁アーカイブ、相関図の参照形式を回帰テストで固定。Chrome実機ではネットワーク37名・フォーカス2名・勢力図44名の描画と、左クリック選択・右クリック詳細を確認。端末別監査では、700px以下のスマホは検索可能な人物中心リスト、タブレット／PCはマウスとPointer Events対応のネットワーク図へ分岐することを契約テストで固定した。配布manifest・タイトル画面・セーブ情報のバージョン表記も `1.14b` に統一。5シード×20シーズン（計100シーズン）のauto-simは violations 0 / errors 0 / 全件ALL CLEAR。変更: `release/manifest.json` / `src/index.html` / `src/relationships.js` / `src/management.js` / `src/app.js` / `src/ui-render.js` / 相関図・端末・バージョン回帰テスト3本 / `package.json` / 関係性仕様書 / 相関図採用メモ / ロードマップ / 本項。

## 直近の調整（2026-07-19 春のタッグリーグ・決勝逆転時の実績順位修正）

春のタッグリーグでリーグ2位ペアが決勝を制した際、優勝ペアの `careerRecord.history` が準優勝として記録される不具合を修正。原因は、決勝後の実績とプレイヤー賞金だけが最終結果ではなく総当たりリーグの `standings.rank` を参照していたこと。`champion / runnerUp / third / fourth` から大会最終順位マップを作り、実績ラベル・賞金・賞金ログをすべて同じ最終順位に統一した。リーグ2位のプレイヤーが決勝でリーグ1位のAI団体を破る固定ケースを回帰テストとして新設し、優勝ペア2名の `champion`、敗者ペア2名の `runnerUp`、優勝賞金1500万円を検証。既存の春リーグ観戦テストも通過し、5シード×20シーズン（計100シーズン）のauto-simは春リーグ完走率1.00、violations 0 / errors 0 / 全件ALL CLEAR。変更: `src/management.js` / `test/spring-tag-league-result-placement-test.js` / `package.json` / 春リーグ仕様書 / ロードマップ / 本項。

## 直近の調整（2026-07-19 4団体勝ち残り対抗戦・MVP台詞パック全147セル実装）

MVP一言シーン用の台詞テーブル `AUTUMN_WAR_MVP_LINES` を基礎21本から全147セル（3 context × 7 personality × 7 archetype）315本へ拡張。①gauntlet（3勝以上の連戦耐久）、champion（団体優勝・本人3勝未満）、defiant（個人MVPだが団体敗退）の3文脈それぞれに、7 personality × 7 archetype（_default/composed/ojousama/polite/seductive/delinquent/cool）の全セルを各2〜3本で埋めた。②既存の基礎21本は各 `_default` の1本目として保持。③契約テスト `test/autumn-war-mvp-lines-test.js` を新設し、構造完全性（3 context/7 personality/7 archetype/配列・2本以上）、品質チェック（string・非空・12〜90文字・許可外プレースホルダー排除・ASCII `...` 排除・完全一致重複排除・294本以上）の10項目を自動検証。④ `package.json` に専用script `test:data:autumn-war-mvp` を追加。⑤既存テスト `autumn-war-ui-flow-test.js` も通過、auto-sim 20シーズン ALL CLEAR。⑥画面仕様書の実装状況を更新。変更: src/data.js、test/autumn-war-mvp-lines-test.js（新設）、package.json、docs/ui/03-screens/autumn-gauntlet-war.md、本項。

## 直近の調整（2026-07-19 4団体勝ち残り対抗戦・1フォール逐次シミュレーション化）

季節を代表する年次大会として、初版UIの「大会全体を先にシミュレートして結果を順番に見せる」方式を廃止し、現在リング上にいる2選手だけを操作時に解決するライブ進行へ変更。①Week36開始時は代表・組み合わせ・初期condition・seeded RNG状態のみを `autumnWar.session` に作り、勝敗は未生成。②`simulateNextBout` は1回の操作につき `simulateMatch` をちょうど1回だけ呼び、勝敗、実HP由来wear、脱落位置、団体スコア、個人勝ち抜き数、更新後RNGをGameStateへ保存。③各団体戦終了時に次の準決勝へ遷移し、全準決勝終了後のみ+15回復を適用。プレイヤーが決勝進出した場合は `finalOrder` で停止し、回復後conditionを見て布陣確定後に初めて決勝カードを生成するため、準決勝の再計算と未来の決勝結果保持がなくなった。④途中セーブ・リロードは保存済みactiveMatch/RNGから再開し、最終フォール後にのみ報酬・経歴・MVPを1回適用。⑤auto-simも本番同様に1フォールずつ進めるよう変更。新規エンジンテストで大会開始時0フォール、1操作後1フォール、JSON保存・再開後の次フォール/RNG一致、決勝布陣確定時点でも決勝0フォール、最大15フォール完走を実動検証し、UIソース回帰では1ステップに `simulateMatch` 1回・未来フォールのwhile実行なしを固定。5シード×20シーズン（計100）で violations 0 / errors 0 / frequency warnings 0 / 全ALL CLEAR。変更: src/management.js / app.js / ui-common.js、test/auto-sim.js / autumn-war-ui-flow-test.js / autumn-war-live-engine-test.js、package.json、画面仕様・本体仕様・ロードマップ・本項。

## 直近の調整（2026-07-19 4団体勝ち残り対抗戦・推奨ハイブリッドUI実装）

比較モックアップ3案のレビュー結果を受け、案1「4団体布陣ボード」を主画面、案2「小型クライムライン」を勝ち上がり補助、案3「リングサイド」を現在試合のフォーカス部として統合し、実ゲームへ接続。①Week34告知、Week35の代表3名・先鋒/中堅/大将編成（春タッグ準拠Cream Panel）、Week36の通常興行ブロックと大会自動起動を追加。②4団体×3名の生存/脱落/消耗、フォール逐次開示、準決勝→決勝進行を専用Stageで表示。③プレイヤー決勝進出時だけ回復後の状態を見せて最終布陣を変更可能にし、同一seed再計算で準決勝を保持したまま決勝へ反映。結果applyは確定時の1回に限定し、UIなしauto-simはプレビューを即時確定する互換処理を追加。④優勝画面の後にMVP選手だけを映す独立一言シーンを追加し、`gauntlet/champion/defiant × personality × archetype` ルーターと基礎21本を実装。全147セル・294本以上の台詞量産はClaude Code Opus 4.6へそのまま渡せる指示書へ分離。⑤構文チェックと専用回帰テストを通過し、100シーズンauto-simを実施。実機では代表編成、大会逐次進行、決勝再配置、優勝→MVP→今週画面復帰の確認をユーザーへ委任。変更: src/management.js / app.js / ui-common.js / ui-render.js / data.js / index.html、test/auto-sim.js / autumn-war-ui-flow-test.js、package.json、画面仕様・本体仕様・ロードマップ・CLAUDE.md、Opus指示書、本項。

## 直近の調整（2026-07-19 4団体勝ち残り対抗戦・UI比較モックアップ3案）

エンジン実装済みだがUI未実装だった「4団体勝ち残り対抗戦」について、既存ゲームのジュニアトーナメント、天頂戦、春のタッグリーグ、各大会の代表選出モーダルを基準に、比較可能なインタラクティブモックアップを3案作成。案1「布陣ボード」は4団体×3名の生存・脱落・消耗を一覧化し、中央にNEXT MATCHを置く大会固有型（推奨）。案2「クライムライン」はJT・天頂戦の縦型勝ち上がり表現を3人組セルへ拡張。案3「リングサイド」はリング上の選手と左右ベンチを強調する観戦ドラマ型。各案に代表選出、大会進行、決勝前の再配置、大会結果の4状態（計12画面）を実装し、上部タブで比較可能にした。代表選出には春タッグのCream Panel・上半身候補カード・選択金枠を、大会画面には純黒Stage・秋エンブレム・緋色＋金のイベント色を継承。画面仕様書を新設し、案1を主画面、案3を観戦直前フォーカス、案2を小型進行表示として組み合わせる推奨方針を記録。ブラウザで全タブを操作し、画像98点の欠けなし、横はみ出しなし、console warning/errorなしを確認。実ゲームへの組み込みは採用案レビュー後。変更: docs/ui/mockups/autumn-gauntlet-war-ui-3patterns-v0.1.html / docs/ui/03-screens/autumn-gauntlet-war.md / docs/game-system-roadmap.md / 本項。

## 直近の調整（2026-07-19 天頂戦・個別試合進行の経営画面戻り修正）

天頂戦で個別に「観戦する」または「スキップ」を選び、試合結果から次の試合へ進むと経営画面へ戻される問題を修正。原因は、個別結果画面の「次の試合へ」ボタンが天頂戦専用の `tcAdvanceAfterResult` を実行した後、同じクリックを通常興行用の委譲 `closeShowResult` も拾っていたこと。既存のJTだけが共通クローズ処理の除外対象で、後から追加された天頂戦の `_tcPreview` が条件から漏れていた。共通ハンドラをテスト可能な名前付き関数へ整理し、JTまたは天頂戦の進行中は通常興行のクローズ処理へ渡さないよう修正。新規回帰テストで①天頂戦中は専用進行を妨げない、②通常興行は従来どおり閉じる、の両方を検証。JT観戦・HP UI・挑戦試合フローの既存テスト、構文チェック、`git diff --check` も通過。UIイベント制御のみの変更のためauto-simは不要。変更: src/ui-common.js / test/tenchosen-result-flow-guard-test.js / docs/game-system-roadmap.md / 本項。

## 直近の調整（2026-07-19 年間表彰式・タイトル王者3人の均等割レイアウト）

年間表彰式「タイトル王者」で、各選手の台詞長に応じてflex列幅が変化し、1位の選手と吹き出しが画面中央から左右へずれる問題を修正。①3人欄を可変幅flexから `repeat(3, minmax(0, 1fr))` の均等3列gridへ変更。②2位・1位・3位それぞれに常設スロットを設け、欠員があっても1位は必ず中央列を維持。③各列と吹き出しを幅100%に固定し、長い台詞は自列内で折り返して隣列の中心位置へ影響しないようにした。④ソース回帰テストで均等3列・3スロット・1位中央・吹き出し幅固定を検証。`node --check src/ui-common.js` と新規テストを通過。UIのみの変更のためauto-simは不要。変更: src/index.html / src/ui-common.js / test/awards-champions-layout-test.js / package.json / 本項。

## 直近の調整（2026-07-19 因縁決着の確定値統一・宿怨演出明確化・表彰式台詞調整）

宿怨決着画面が「決着したのに宿怨になった」と読める違和感を調査し、表示だけでなく内部値の経路差も修正。①因縁決着時に `checkResolution` が算出した値（1回目10〜20/25〜35、好敵手0〜5、宿怨30〜40）が、その後の `applyMatchResult` の旧M-10汎用リセット（0〜10）や通常試合効果に上書きされていたため、決着種別・確定値を試合結果へ保持し、通常興行・エンジン内興行・PPVの3経路すべてで最終値として再確定。②宿怨は「勝敗は決したが遺恨が残った」ルートなので、従来の和解bondボーナスを適用しないよう修正。③ポップアップを「決着。しかし、宿怨は消えず」/「勝敗は決した。しかし、遺恨は消えなかった」へ変更。④年間表彰式の台詞「すっげー楽しかった！」を「すっごく楽しかった！」へ変更。⑤回帰テストを新設し、3種の決着値固定・宿怨の和解ボーナス不発火・表示/台詞を検証。⑥構文チェック5ファイル、関係性既存テスト、新規回帰テストを通過。auto-simは5シード×20シーズン（計100シーズン）で全シード violations 0 / errors 0 / ALL CLEAR。変更: src/app.js / data.js / management.js / relationships.js / ui-common.js、test/rivalry-resolution-regression-test.js、package.json、仕様書、本項。

## 直近の調整（2026-07-19 挑戦試合を興行上位3枠へ固定・二重出場防止・集客ボーナス追加）

v1.12の選手発信「挑戦試合」で、受諾後の3試合が会場上限の外に追加されるうえ、同じ選手を通常カードにも編成できた問題を再設計。①受諾済み3シングルを次回興行のメイン・セミ・第3試合（showCard index 0〜2）へ先に固定し、会場上限の内数に変更。7試合会場は挑戦3+通常4、3試合会場は挑戦3のみ。②挑戦出場6名を通常シングル/タッグの手動ピッカー・スワップ・自動編成から除外し、カード再描画や会場変更でも予約を冪等に再適用。固定枠の移動・選手差替え・タッグ化・タイトル戦化も禁止。③興行準備画面に対戦団体名、全枠/通常残り枠数、固定バッジを表示。④因縁が薄い組み合わせを補うため、MQではなく集客評価へ各試合+12の「他団体挑戦」ボーナスを追加し、予測・ツールチップ・実集客精算の全経路に反映。⑤試合後にゲストを一時ロスターから外した後も、解決済み試合結果をフォールバックして実集客計算からボーナスが欠落しないよう修正。⑥別の強制試合（王座奪還）が同時発生した場合は挑戦3枠を優先し、その直下の通常枠を使用。3枠会場で空きがなければ奪還戦を次回へ持ち越す。⑦新規回帰テストで7枠上限・3枠上限・6名の一試合限定・予約冪等性・欠場解除・+12を検証。関連する興行/タッグ/タイトル/挑戦テスト12本も全通過。変更: src/data.js / management.js / relationships.js / ui-common.js / ui-render.js / app.js、test/challenge-request-card-reservation-test.js、仕様書、本項。

## 直近の調整（2026-07-18 v1.13追加バッチ: JT改修一式+相関図派閥円修正+診断ログゲート化 — 全てSonnet/Explore委譲）

v1.13初回梱包後のKeisuke実機フィードバック対応(調査・実装は全てサブエージェント委譲、メインはレビューと指揮のみ)。①**JT頂上の間延び修正**(59f90f6): 「タップして結果を見る」が目立たず無期限待ち→天頂戦と同方式(1.6秒自動遷移+タップ即時+先頭スクロール+文言「タップして表彰へ」)。②**JTリスタイル**(モックv0.1承認→602aa0f実装): クライムラインをサイズ勾配化(準々/準決=sm76px→決勝=lg132px→頂上peak150×225、md112px廃止)、試合前フォーカスカードをスタンド反転対面→**アッパー2:3非反転対面+開始HPバー**(セリフ吹き出し維持)、試合結果をヒーロー構図化。**JT⇔天頂戦の部品共通化**(_jtcFcCore/_jtcOwnPill/頂上CTA、CSSは--jtc-color/--jtc-color-rgb変数駆動でtc-fc*系を統合)。③**天頂戦結果画面のJTブランディング除去**(f528436): pb-mrow.is-jt流用で出ていた「🥇 JT MATCH」タグ/青グローを is-tenchosen モディファイア(👑 天頂戦/金)で分離(is-b2/is-b3の既存慣習準拠)。④**相関図の派閥円消失修正**(7677dfa): 原因=相関図の派閥フィルタだけがAIロスターを**存在しないG.rivalOrgs**(常に空)から参照+5月の孤児派閥フィルタ(リーダー現存必須)の合成で、AI団体所属リーダーの派閥が全滅し🎭ボタンも無効化→G.aiOrgsに修正+「メンバー生存で救済」に緩和(派閥タブとの表示不整合も解消)。⑤**診断ログのwmDiagゲート化**(76c5144): コンソール大量出力の正体は実バグゼロ・全てデバッグ残骸(引退ポップアップ診断8=2026-05-05残骸/派閥トレース25/ドラフト想定内warn1)。フラグ基盤が無かったためdata.js冒頭にwmDiag(既定OFF・window.WM_DIAG=trueで復活)を新設し34箇所を置換。[WM Debug]系(異常時のみ)とフォールバック救済warnは維持。⑥検証: node --check全通過+5シード×20auto-sim ALL CLEAR(diag)+vmスモーク(JT4名/8名+天頂戦全ラウンド、旧クラス名リーク無し)。実機確認はKeisuke委任: JTの3画面/天頂戦の見た目不変+結果画面タグ/相関図の派閥円(特にAI団体)/コンソールが静かなこと。変更: src4ファイル+モック1+本項。この後v1.13を再梱包。

## 直近の調整（2026-07-18 C-6「天頂戦」実装完了: P3ミニイベント+間延び修正+コーチ整合性 — 実機確認待ち）

C-6の実装フェーズ完了(全てSonnet委譲・メイン側diffレビュー)。①**間延び修正**(5215804): 決勝後の頂上ブロックが無期限タップ待ち+スクロール位置次第でヒント画面外+BGMフェード無音が重なりフリーズに見えていた→タップ待ち廃止・先頭へ自動スクロール・0.5sせり上がり→1.6sで優勝画面へ自動遷移(タップで即時スキップ可)。②**P3 開催前ミニイベント**: エンジン側(a25ad3f)=Week42トリガー(開催年+ppvUnlocked・weekPhase非占有・数値効果なし)+buildPreEvent純関数(雇用コーチからrng1名→coachingTypeでセリフ/OVR上位3名→archetypeでセリフ、veteran優先・前回出場者除外・3人重複回避)+セリフ31本定数化(草案に一字一句忠実)。UI側(1f87c79)=advanceWeek後に未読検知→既存ポップアップキュー経由で表示(エンブレム52px+見出し+コーチ頭上白吹き出し+選手3名2:3矩形非反転+閉じで markPreEventSeen+保存)。③**コーチ招聘×雇用の整合性**(調査はExplore委譲): 「設定欄が消える」報告は§3.5の仕様挙動(招聘中の自動アンアサイン+ラベル置換)だが表示が不親切→「招聘中: ○○(残N週)」に改善。実バグ3件を修正: 育成タブの二重指導ガード漏れ(a74eef5)/招聘中コーチが募集プール・雇用に乗る二重登録(UI側a74eef5+プール側1f87c79)/招聘終了・打ち切り時の復帰失敗が無通知(1f87c79で理由つき通知、resolveInviteConflictにevents返却を追加しapp.js側で合流)。④検証: node --check全通過+auto-simフック5シード×20シーズンALL CLEAR(手動再実行含む)+P3込み20シーズン(31337)ALL CLEAR。⑤**インシデント**: いずれかのサブエージェントがgit checkout HEADを実行しdetached HEAD化→最終コミットが迷子になりかけたが、mainがa25ad3fのままだったためff-onlyマージで復旧(1f87c79)。今後のエージェント指示に「git checkout禁止」を含める。⑥`image/upper/upper_hayakawa_m.webp`の未コミット変更はセッション外由来(おそらくKeisukeの差し替え)のため未コミットで保全・要確認。**ブラウザ実機確認はKeisuke委任**(チェックリストは完了報告に記載)。変更: src4ファイル+docs+本項。

## 直近の調整（2026-07-18 C-6 天頂戦 P2 UI実装 — Sonnet委譲・レビュー合格）

実装はSonnet委譲、メイン側で差分レビュー(+1,161行/4ファイル: index.html +183 CSS / ui-common.js +624 / app.js +325 / ui-render.js +31)。①**エントリーUI**: 週次画面に金バナー(phase='entry'中)→モーダルで特別招待2名発表ブロック+王者ロック付き団体枠選択+おまかせ/確定(Engine.ppvTournament.confirmPlayerEntries経由)。確定後は非操作バナー、未確定でもensureReadyが自己修復。②**クライムライン**: JTのjtc-*を--jtc-color金で流用し、差分をtc-*で追加。段別画像文法(1回戦8セル縮小+シードチップ+横スクロール/準々=丸/準決md・決勝lg=2:3矩形/勝者金下ボーダー・敗者モノクロ)、次戦タグ、フォーカスカード=アッパー対面**非反転**+開始HP右ミラー+持ち越し注記。③**観戦**: frames事前計算をbattle-engine iframeにreplay送信(jtWatchMatch同型・決勝専用BGM)。④**優勝演出**(エンブレム/冠2段/2:3矩形金枠/称号線/光条/プレイヤー優勝時のみ賞金)+**ドラマモーダル**(0件なら非表示・頭上白吹き出し・関係変化チップ、ナレーション4本は事実記述)+**TV観戦簡易リザルト**+**殿堂内訳に「天頂戦 優勝8・準優勝5・ベスト4 3」追記**。⑤レビュー観点: scaleX(反転)ゼロ・G直接代入ゼロ・新規16進は既存JT吹き出し文法と同値+PPV深紅#e94560(tenchosen.md裁定どおり)のみ・エンブレム参照2箇所。⑥設計判断(妥当と認めた差分): 決勝行のTBD表示はJTのprogressive revealと両立しないため不採用(頂上👑空位で目標可視化を維持)/試合結果画面の勝者セリフは省略しドラマモーダルに集約。⑦検証: node --check全通過+Nodeスタブスモーク15項目(Sonnet側)。**ブラウザ実機確認はKeisuke委任**(確認ポイントは完了報告に記載)。変更: 4ファイル+本項。コミットeca285d。

## 直近の調整（2026-07-18 天頂戦エンジン: Codex task-04着地レビュー合格 + 実測較正）

①**Codex後追いレビュー**(コミット178954e、許可3ファイルちょうど・management.js +632/data.js +187/auto-sim +98): GameStateコントラクト完全準拠(+UI観戦用にfinType/log/framesも保存)、特別招待の「個人ランキング」参照実体=**MVPレースのシーズンポイント**(フォールバックOVR)、団体枠5/4/3/2+capacity繰り上げ、王者必須バリデーション、標準ブラケット+1回戦同団体近傍スワップ、tier2+_hpOverride消耗持ち越し、決勝±7/ppvT 20pt/殿堂+8/賞金player限定/careerRecord 5段/summit完全スキップ/TV観戦/ニュースpriority 270・150。指摘は「ニュース本文にMQ表記」1件のみで、Codex自身がamendで「決勝の試合評価は{mq}点」に日本語化済み。関係キー形式(`a>b`)・_clampAxisValue存在・Week48早期return(通常PPVと同型)も確認。**通常PPVとの排他**を実測確認(天頂戦12/12・通常年PPV36/36で完全排他)。②**検証ゲート**: node --check 3ファイル + auto-sim 100シーズン×2シード(42/7919) **ALL CLEAR**。③**実測較正2件**(48シーズン計測で判明): (a)関係性ドラマが平均1.42件/0件率0%と過剰(auto-simの常時発火検知も点灯)→発火率を0.8/0.7/0.25→**0.5/0.35/0.15**に半減。再計測(5シード×20シーズン)で平均0.40〜1.20件・0件率0.20〜0.60となり「あったりなかったり」の設計意図(Keisuke裁定・下限0)に適合。(b)決勝MQ50点台の凡戦が12回中2回→**floor 50→55**。較正後は25大会中1回まで減少、決勝MQ平均70.0〜82.2で通常年PPV(72.0〜77.5)と同等圏。④auto-simの常時発火検知は完走8大会未満(32シーズン未満)では統計ブレで誤検知するため発動閾値を4→8に修正(編集フックの20シーズンランで無用に落ちない)。⑤P2 UI実装はSonnet委譲で進行中(別項で報告)。変更: src/management.js(較正2行) + test/auto-sim.js(閾値1行) + 本項。

## 直近の調整（2026-07-18 C-6「天頂戦」実装着手: 画面仕様書 + Codex task-04 発行）

実装フェーズ開始。Codex併用方針(仕様確定済み・衝突しないタスクをCodexへ)に従い2分割: **P1エンジン=Codex / P2 UI=メイン側(Sonnet委譲)**。①**画面仕様書** `docs/ui/03-screens/tenchosen.md` 新規(テンプレート準拠): Stage/P7クライムライン/S2×S4継承、確定ビジュアルはモックv0.3を正とし、段別画像文法・アッパー非反転・ドラマモーダル(0件なら非表示)・エントリー画面(特別招待発表ブロック)・TV観戦を記載。②**Codex指示書** `docs/codex-tasks/task-04-tenchosen-engine.md` 新規(task-03書式踏襲): 許可3ファイル(management.js/data.js/auto-sim)、開催判定〜エントリー(特別招待2+団体枠5/4/3/2・confirmPlayerEntries・未確定自己修復)〜16名15試合一括シム(tier2/wear持ち越し回復2/3 floor50/JT方式)〜報酬配線(決勝±7/ppvT 20pt/殿堂+8/賞金3000-1200-500×2/careerRecord 5段result/頂上決戦スキップ分岐)〜**関係性ドラマ判定エンジン**(3分類の発火暫定値🔧: epic=SF以上MQ≥90+文脈/humiliation=シード差6+上位シード敗北/stablemate=同団体対決、上限2件・下限0・同一選手1件)〜セリフ91本のdata.js定数化(承認版から文言改変禁止・年齢条件タグのフラグ化=話者or相手30歳超で除外)〜TV観戦〜auto-sim(エントリー自動化+開催率+決勝MQ分布vs通常年比較レポート)。**GameStateコントラクト**(ppvTournament: specialInvites/entries/rounds/dramaEvents/championId)を明文化しUI側の依存先として固定。ニュース2種各2案は全文報告(レビュー)指定。③**次工程**: Keisuke が task-04 を Codex アプリで実行 → 着地したらメイン側で git show 後追いレビュー(fix-forward) → P2 UI 実装(Sonnet委譲、tenchosen.md+モックv0.3参照)。変更: docs/ui/03-screens/tenchosen.md(新規) + docs/codex-tasks/task-04-tenchosen-engine.md(新規) + docs/game-system-roadmap.md(C-6行) + 本項。

## 直近の調整（2026-07-18 C-6「天頂戦」設計確定 — Keisuke全項目追認・設計フェーズ完了）

残項目(セリフEの同門ポジティブ言及の残置を含む)をKeisukeが全て追認し、**C-6の設計フェーズが完了**。specステータスを🟢設計確定に更新(§8は「実装時確認」のみ残る整理に)、セリフ草案を✅承認済みv0.2に、ロードマップC-6行を✅設計確定に更新。**確定内容の総括**: 大会名「天頂戦」(冠: 全国女子プロレス最強王者決定戦/称号: 第N回天頂戦覇者) / season%4==0開催・Week48のPPV GRAND FINAL置き換え / エントリー=特別招待2名(個人ランキング1位+人気1位・団体枠消費なし)+団体枠14名(5/4/3/2) / 16名シングルエリミ15試合・全試合ビッグマッチルール・消耗全ラウンド持ち越し(回復2/3・floor50はauto-sim較正) / 優勝は記録と名誉のみ(数値効果なし・殿堂+8/実績20pt/賞金3000-1200-500万) / UIはクライムライン型(1回戦・準々=丸アイコン、準決勝以上=2:3矩形アッパー、アッパー非反転、仮エンブレムimage/emblem-tenchosen.png) / 関係性ドラマ(文脈前提・下限0・上限1〜2件、セリフ91本承認済み)。**次工程**: docs/ui/03-screens/ に画面仕様書(tenchosen)を起こしてレビュー → 実装(Sonnet委譲予定)。実装時の主な参照: spec v0.5全§ + セリフ承認版 + JTクライムライン実装(ui-common.js 14342〜)。変更: specs/quadrennial-ppv-tournament-spec-v0.1.md(ステータス/§8/変更履歴) + docs/quadrennial-drama-lines-draft-v0.1.md(承認済み化) + CLAUDE.md(索引) + docs/game-system-roadmap.md(C-6行) + 本項。

## 直近の調整（2026-07-18 C-6 大会名「天頂戦」確定+仮エンブレム実ファイル化 → spec v0.5）

Keisuke裁定2件を反映。①**大会名確定**: 「天頂戦」。正式表記は冠付き2段 — 「全国女子プロレス最強王者決定戦」(小さめフォント)の下に「天頂戦」(大・金グラデ・Noto Sans JP 900)。称号「第N回 天頂戦 覇者」。spec §4.4/§6/§8/変更履歴とCLAUDE.md索引を同期し、モックv0.3は名称プルダウンを廃止して確定表記に(クライムラインヘッダーと優勝演出の両方に冠ラインを追加)。②**仮エンブレムの実ファイル化**: モック内インラインSVGだった仮エンブレムを、PowerShellの.NET System.Drawing描画で **`image/emblem-tenchosen.png`(512×512透過・王冠+月桂樹+IV・金グラデ)** として生成し配置。モック2箇所の参照をPNGに差し替え。本番はKeisukeが**同ファイル名で上書き**すれば差し替え完了する運用。release/manifest.jsonは`image`ディレクトリ丸ごと対象のため追記不要と確認。変更: image/emblem-tenchosen.png(新規) + docs/ui/mockups/mockup-ppv-tournament-v0.3.html(ヘッダー2段化/プルダウン廃止/PNG参照) + specs/quadrennial-ppv-tournament-spec-v0.1.md(v0.5) + CLAUDE.md(索引1行) + 本項。

## 直近の調整（2026-07-18 C-6 エントリー方式確定 → spec v0.4）

Keisuke裁定を反映し spec v0.4 に更新。①**エントリー方式**(§2.1全面書き換え): **特別招待2名+団体枠14名=16名**の2段構成。特別招待=個人ランキング1位+人気1位(全団体横断・団体枠消費なし・団体枠選出より先に確定)。同一人物なら人気2位繰り下げ🔧、怪我等除外なら次点繰り上げ。団体枠=通常年PPVと同じ5/4/3/2で、特別招待2名を除いた選手から選出(王者自動/プレイヤー選択/AI OVR順は通常PPV準拠)。**v0.2の5/4/4/3案は破棄**。「個人ランキング1位」の参照データ実体(RP/バトルポイント系)は実装時確定🔧として§8に残置。②大会名は和名候補4案の方向をKeisukeが承認(具体名の最終選定は残)。③§5差分表・§8未決定事項・変更履歴を同期。変更: specs/quadrennial-ppv-tournament-spec-v0.1.md(v0.4) + CLAUDE.md(索引1行) + 本項。

## 直近の調整（2026-07-18 C-6 セリフ草案 v0.2: Keisuke 1次レビュー反映）

セリフ91本へのKeisuke指摘を反映。①**B個別修正3+1本**: B delinquent1「勝ったけど全然スッキリしねぇ」(勝者の実感として不自然)→「うっしゃあ、勝ったぜ…! あんたみてぇな強いのに勝てたんだ、今日は祝わせろよ」/ B delinquent2「組めて」→「戦えて」(誤用) / B cool2「次も、そうであれ」(芝居がかりすぎ)→「次も、よろしく」(Keisuke案どおり) / B seductive3「4年後まで、退屈させないでね?」(4年間ずっと会っている前提になり不自然)→「4年後も、期待しているわ」(Keisuke案どおり)。②**年齢条件ルール新設**: 「4年後の再戦」を前提とするセリフは話者または相手が30歳超🔧なら選択肢から除外(4年後に現役でいる保証がない)。該当13本に【年齢条件】タグを付与し、草案冒頭に選択条件ルール節を追加、spec §6.5にも明記。③**D同門・亀裂の全面書き換え(7本)**: 「同じ団体なのに」「仲間だと思ってた」系のメタ言及は「同門でも大会で当たれば本気で戦うのが礼儀」に反するため全廃(Keisuke裁定)。亀裂は「祝いの言葉が上滑りする気まずさ」だけで表現(例: normal「おめでとうって、ちゃんと言えたかな。…自分の声じゃないみたいだった」/ polite「おめでとうございます、心からそう思っています。…思って、いるんです」)。各archetypeの1本目(気まずい距離感のみの行)は言及なしのため維持。④**E同門・深化は未改稿**: Eの「仲間で良かった」系はポジティブな誇りでありDへの指摘(泣き言としての同門言及)とは性質が異なると判断して残置——**Keisukeに要確認として報告**。変更: docs/quadrennial-drama-lines-draft-v0.1.md(v0.2) + specs/quadrennial-ppv-tournament-spec-v0.1.md(§6.5 2項) + 本項。

## 直近の調整（2026-07-18 C-6 関係性ドラマ: 発生条件を「関係性文脈のあるペアのみ・下限0」に確定）

Keisuke裁定を spec §6.5 に反映: ドラマのセリフ演出が出るのは「**すでに因縁/絆の文脈があるペア**」か「**この試合で因縁が生まれる条件を強く満たしたペア**」だけ。文脈がなければ何も出さない(不在の説明も出さない=静かにスキップ、既存の不在データ方針と同じ)。**下限0・上限1〜2件**——毎大会必ず出るものではなく、「あったりなかったり」のランダム性・希少性が「ドラマがあった」という実感を生む、という設計思想を明文化。トリガー分類表に前提条件の注記を追加し、閾値は実装時にauto-simで発生頻度を実測して較正(体感「2大会に1〜2回」目安🔧)とした。変更: specs/quadrennial-ppv-tournament-spec-v0.1.md(§6.5 方針+注記) + 本項。

## 直近の調整（2026-07-18 C-6 関係性ドラマ: セリフコーパス草案91本 — Opus執筆）

モックv0.3のKeisukeレビュー結果: 確認ポイント1〜3(矩形サイズ/和名候補+タイポ/ドラマタブ構成)は承認、仮セリフは「雰囲気OK・かなりバリエーションを増やして全属性でパターンを作る」裁定。①spec §6.5に裁定を反映: **全archetype 7種(normal/composed/ojousama/delinquent/cool/seductive/polite)×役割5種でパターン化・各複数本**。役割構成=名勝負・敗者(認める)/名勝負・勝者(返し)/屈辱・敗者(因縁を刻む)/同門・亀裂(敗者)/同門・深化(敗者)。②**セリフ草案91本**(A/B/C各3本+D/E各2本×7archetype)を`docs/quadrennial-drama-lines-draft-v0.1.md`に新規作成。執筆はOpus委譲(メモリ運用どおり)、メイン側で全文レビューし1本修正(屈辱C composed 1本目「そういうことするんだ」が相手の反則を示唆→番狂わせの文脈「…あんたが、ね。」に差し替え)。執筆ルール: 名指しなし汎用テンプレ/テンプレ表現禁止・同archetype内も切り口分散/composedはoyou-style-guideチェックリスト全通し/「4年」モチーフは約13%に抑制/Cの毒はarchetypeの品格維持(ojousama=優雅な脅し・polite=慇懃な宣戦・cool&composed=低温)。③**全文はKeisukeレビュー待ち**(完了報告に全文掲載)。採用後の実装時はdata.jsの定数化+発火判定・モーダルUI設計(§6.5 DRAFT項目)とセットで。変更: docs/quadrennial-drama-lines-draft-v0.1.md(新規91本) + specs/quadrennial-ppv-tournament-spec-v0.1.md(§6.5 1項) + 本項。

## 直近の調整（2026-07-18 C-6 PPVトーナメント: 和名化+画像文法+関係性ドラマ → spec v0.3 + モックv0.3）

モックv0.2へのKeisuke裁定4件を反映。①**大会名の和名化**: 英語候補4案を破棄し、和名候補4案(天頂戦/王冠祭/四年の頂/覇天祭)をモックのプルダウンに差し替え。タイトルはBebas→Noto Sans JP 900+金グラデに変更(Bebasは和文非対応)。称号線「第N回 ○○ 覇者」も連動。②**段別画像文法**(spec §6に確定記載): JTクライムラインの実装を精査した結果、JTは丸アイコンではなく**2:3矩形アッパー**(jtc-up: aspect-ratio 2/3・sm76/md112/lg132/頂上150×225・勝者=大会色下ボーダー/敗者=モノクロ)だったため、Keisuke裁定「準決勝以上はJTみたいに大きなアッパーで」をこの文法で実装: 1回戦・準々=丸アイコン(小)/準決勝=md 104px矩形/決勝=lg 132px矩形/優勝画面=頂上様式金枠矩形。③**アッパー画像の反転全廃**: フォーカスカード左側のscaleX(-1)を削除(顔が崩れるため。反転はスタンド画像対面のみ — **全画面共通ルールとしてspec明記+メモリ保存** feedback_no_upper_image_flip.md)。④**§6.5 関係性ドラマ新設**(spec): 大会の試合起点でbond/rivalryが動きセリフドラマが発生する方針を確定。トリガー分類の叩き台3種(名勝負→好敵手相互/番狂わせ・屈辱→片方向rivalry激発展/同門対決の後遺症)、1大会1〜2件のスポットライト方式、archetype 6種×立場×分類でセリフ書き分け(草案Opus→Keisuke全文レビュー)、glimpse系・relationship-flags(M-CO1)との接続検討、詳細は実装前に別途詰めるDRAFT。エントリーイベントを「大会約1ヶ月前(Week 43〜44🔧)・通常PPVより一段重い演出」として§6に明記。⑤**モックv0.3新規**(docs/ui/mockups/mockup-ppv-tournament-v0.3.html): タブ3枚=クライムライン(16名・矩形文法反映)/大会後ドラマ(仮)/優勝演出。ドラマタブは§6.5のイメージモックで2カード(橘seductive→深町の因縁激発展/阿武隈composed⇔深町の好敵手認定、頭上白吹き出し+関係変化チップ)。**セリフは全て仮**(composedはoyou-style-guide準拠で執筆、完了報告に全文掲載しKeisukeレビュー待ち)。実機確認はKeisuke委任。変更: specs/quadrennial-ppv-tournament-spec-v0.1.md(v0.3) + docs/ui/mockups/mockup-ppv-tournament-v0.3.html(新規) + CLAUDE.md(索引1行) + docs/game-system-roadmap.md(C-6行) + メモリ1件 + 本項。

## 直近の調整（2026-07-18 C-6 PPVトーナメント: Keisuke裁定反映 → spec v0.2 + モックアップ v0.2）

モックv0.1へのKeisuke裁定(クライムライン採用/16名化/ビッグマッチルール/消耗持ち越し/アッパー画像対面/仮エンブレム)を反映。①**spec v0.2 全面改訂**(specs/quadrennial-ppv-tournament-spec-v0.1.md、ファイル名は据え置き・spring-tag-league方式): 16名シングルエリミ15試合(1回戦8+準々4+準決2+決勝1)、設計原則2「通常PPVの尺を守る」→「業界総力戦の尺」に書き換え・原則4を「実力がものを言う」(全試合ビッグマッチルール=matchTier2固定、長尺で乱数収束→実力差シビア)に差し替え。エントリー枠は5/4/4/3=16名案🔧(通常年5/4/3/2の下位厚め+2、Keisuke最終確認待ち)。標準シード1vs16/8vs9/…、1回戦同団体回避はシード近傍スワップ。careerRecord resultに'quarterFinal'追加。賞金ベスト4は2名明記・ベスト8以下なし。消耗パラメータ(回復2/3・floor50)は最大4連戦前提で再較正が必要とauto-sim項目に明記。②**モックアップ v0.2 新規**(docs/ui/mockups/mockup-ppv-tournament-v0.2.html): タブをクライムライン(16名)+優勝演出の2枚に絞り込み。1回戦8セルは縮小ミニセル(38px円・団体名省略・MQのみ・シードチップ1·16等)、min-width 940px+モバイル横スクロール(段組みは詰めポイントとして注記: 2段折り4+4案あり)。フォーカスカードをスタンド画像対面→**アッパー画像対面**(128px角丸2枚・左鏡映し+VS)に変更、開始HPに「(2試合分持ち越し)」注記。ヘッダー最上部に**仮エンブレム**(インラインSVG: 王冠+月桂樹+IV、「仮」タグ付き。本番はKeisuke作画→image/emblem-ppvt.png仮名でjtc-header-emblem様式)。ビッグマッチルールは決着時間長尺化(14〜21分台)+ヘッダー明記で表現。出場16名は5/4/4/3配分で実在キャラ(1回戦追加8名: 楠木なぎさ/高津小春/木ノ内幸音/高階まさみ/副沢たまき/澤出みずき/林真尋/宇田川里奈、アッパー画像8枚の存在をディスク確認済み)。③大会名称は未決のままプルダウン4候補(GRAND CROWN/ZENITH/GREAT EIGHT/SOVEREIGN)を維持。④ブラウザペインがfile://スナップショット固定でv0.2への遷移不可のため、**実機確認(v0.2をブラウザで開く)はKeisuke委任**。確認ポイント: (a)1回戦8セルの見え方(縮小しすぎないか・横スクロール許容か) (b)アッパー対面フォーカスカードの迫力 (c)仮エンブレムのサイズ感 (d)名称4候補の比較。変更: specs/quadrennial-ppv-tournament-spec-v0.1.md(v0.2全面改訂) + docs/ui/mockups/mockup-ppv-tournament-v0.2.html(新規) + CLAUDE.md(索引1行) + docs/game-system-roadmap.md(C-6行) + 本項。

## 直近の調整（2026-07-18 C-6 PPVトーナメント: 残設計の整理 + ブラケットUIモックアップ v0.1）

アーク5 C-6の実装前工程。①**残設計の棚卸し**(spec v0.1 §8): 未決定5件のうち「JT流用範囲」を確定提案(クライムラインjtc-*一式+フォーカスカードjt-mf+消耗持ち越しjtCarryHpPctの流儀を`--tourney-color`金差し替えで流用)、「賞金額」は実装実態と突き合わせて整合確認(通常PPVの実装値PPV_PRIZE={champion:2000,runnerUp:1000,semiFinal:500}に対し優勝3,000/準優勝1,200/ベスト4 500は1.5倍系で妥当。spec §6.1の順位賞100〜300万は別系統の順位賞でありトーナメント賞金とは競合しない)。floor50/回復2/3の実測・殿堂ptインフレ測定は実装時のauto-sim項目として残置。②**大会名称候補4案**をモックアップ内プルダウンで切替可能に: GRAND CROWN/ZENITH/GREAT EIGHT/SOVEREIGN(称号線「第N回 ○○ 覇者」も連動)。③**モックアップ**: `docs/ui/mockups/mockup-ppv-tournament-v0.1.html`(単体HTML・実画像参照・Stage純黒+金/深紅)。4タブ構成 — A案:クライムライン型(JT流用最小コスト・頂上👑空位+シードチップ)/B案:左右対称横型ブラケット(中央クレスト+覇者スロット、特別感最大だがスマホ横スクロール必須・二重実装)/C案:カード進行型(既存ppvmc文法+ミニブラケットストリップ、スマホ完全対応だが一覧性劣る)/D案:優勝演出(頂上ブロック→称号線セリフ書体+CSS光条)。モック状態は準々4試合消化+準決1/2消化+次戦フォーカスカード(深町vs橘、開始HP持ち越し表示、UI原則9/10準拠で左右同色・右側ミラー)。ブラウザで画像読込・レイアウト崩れなしを確認済み、**バリアント選定と詰めはKeisuke委任**。選定後に docs/ui/03-screens/ 画面仕様書を起こしてから実装に入る。変更: docs/ui/mockups/mockup-ppv-tournament-v0.1.html(新規) + docs/game-system-roadmap.md(C-6行) + 本項。

## 直近の調整（2026-07-18 キャラ能力値修正: XLSX「修正=a」7名を反映）

Keisuke さん管理の Google ドライブ「キャラ能力値集計.xlsx」で修正列に a が付いた7名の能力値・潜在値を data.js の ALL_CHARS に反映。①**対象と差分**: 深町真琴(pot.sp 185→194)/橘玲美(pot.te 178→186)/梅ヶ丘みのり(pw78→70,sp71→68,te76→72,st80→75 + pot.pw161→144,sp152→148,te159→152,st164→157)/片桐ありさ(pw63→69,te80→85 + pot.pw142→152,sp148→152,te164→171)/長谷川レオナ(pw78→75,te78→75 + pot.pw161→155)/高島さや(pot.pw129→146,te166→153,st132→144,mn85→153)/三浦早紀(pw76→73,te74→67 + pot.pw159→155,te156→145)。②シートと data.js で戦闘スタイル・特性・変更対象外の値が一致していることを突き合わせ確認。③正常レンジ内の値差し替えのみでロジック非接触のため auto-sim はスキップ(Keisuke さん裁定)。変更: src/data.js(7行) + 本項。

## 直近の調整（2026-07-17 残タスク4件: 修復費用の給与連動化 / CR Phase3 in-show挿入 / firedReturn配線拡張 / CR Phase5リアクション細分化）

実装はSonnet委譲、メイン側でdiffレビュー。①**タスクa 関係修復あっせん書の費用給与連動**(relationship-system-spec-v2.3 P-6): `Engine.shachoshitsu.calcCost(doc, state, pairKey)`にペアキー引数を追加、`target:'pair'`のとき`費用=基本額90万+(給与A+給与B)×係数0.4`(10万単位丸め)を返す。実測給与レンジ(SALARY_PARAMS: 新人9〜13万/中堅38万/エース124万/トップ王者185〜227万)から較正し、新人ペア(給与和20〜26万)→約100万(現行固定額とほぼ一致)、トップ選手ペア(給与和370〜454万)→238〜272万(2.4〜2.7倍)を確認。`showDecisionPairModal`(ui-common.js)はペア選択のたびにコスト・残金パネルを再描画するよう改修(`_renderCostPanel`分離)、一覧行にもペアごとの費用を表示、「当事者の格に応じて費用が変わる」一言を追加。`execute()`(management.js)は`fighterId`(ペアキー)をそのまま`calcCost`に渡すよう修正。②**タスクb CR Phase3興行枠in-show挿入**: 打診YES時の即時解決(`resolveMatchCard`即時呼び出し)を廃止し、`_pendingReclaim`(タイトル奪還)と同じ「予約→`App.executeShow()`直前に3シングル分のshowCardスロットを注入→通常興行と同じ解決パイプラインを通す→`_finalizeShowImpl`内の専用ブロックで結果を`_applyChallengeRequestResult`に渡す→F08/F09と同じdrainパターンで結果モーダル表示」に変更。相手陣(他団体ロスター)は一時ゲスト注入(`isCRGuest`)、guest除去は奪還挑戦と同じタイミング(injury/growth処理前)。**設計判断**: 仕様書2.2「興行画面のカードに『果たし状』バッジ表示」はCRスロットがexecuteShow直前に注入される都合上プレイヤーには興行準備画面で見えない(打診自体がサプライズイベントのため)ため、バッジDOM実装は見送り、事前の`showEventPopup`通知+事後の結果モーダルで「最低限の演出」(spec 3.2が許容する表現)とした。副次効果として、CR試合が実際のshowCardパイプラインを通るため今まで0だった興行経済(チケット/メディア収入)が自然に発生するようになった(economy-spec上の専用収入枠は元々存在しなかったため二重計上なし)。同一週内に複数の`_pendingChallengeMatch`が積み重なるケースは1件のみ保持(上書き)の簡易実装、レアケースのため許容。③**タスクc firedReturn配線拡張**: `App._maybeEmitFiredReturn(state, fighter, foeOrgId, sideOrgId)`を`_applyChallengeRequestResult`内`_emitFiredReturn`から抽出・共有ヘルパー化。新たに(a)奪還挑戦(`App._reclaimData`結果処理ブロック、防衛者→'player'向き/挑戦者→rd.orgId向きの双方向判定)、(b)対抗戦(war)結果ループ、(c)PPV結果ループ(合同興行で所属org判定済みの`lOrg`/`rOrg`を利用)に接続。同一org内の通常興行(B-3 `firstMeetSinceDeparture`が既存発火する箇所)は「元同僚が現在も同僚」という文脈のためfiredReturnの意味が成立せず対象外と判断。文面プールに2案追加(`data.js` NEWS_HEADLINE_TEMPLATES.firedReturn、既存5本+新規2本の計7本、全文はKeisukeレビュー依頼)。CRのshowCard注入(タスクb)により通常のh2h記録ループがCRスロットを二重記録しないよう`m.isCRMatch`ガードも追加(整合性バグの予防)。④**タスクd CR Phase5リアクション細分化**: `CHALLENGE_REQUEST_OPPONENT_REACTIONS`をarchetype(6種:normal/polite/seductive/delinquent/ojousama/cool)×結果(win/lose/draw、teamB=相手陣視点)の構造に再設計、各2本=36本+受諾スタンス用`_accept`(旧仕様のまま3本×6=18本)を保持。`showChallengeRequestResultModal`(ui-common.js)は`teamWin`から相手陣の勝敗を判定してプールを選択し、吹き出しラベルも「受けて立つ側」→「受けて、勝った側/敗れた側/決着つかずの側」に変更。性格(personality)軸ではなくarchetype軸で統一(タスク指示通り)。文面拡充(セリフ本数の大幅増)は別途Opusタスク候補として保留。⑤**検証**: node --check 5ファイル(app.js/data.js/management.js/relationships.js/ui-common.js)全通過。management.js/data.js編集でauto-simフック発火、`node test/auto-sim.js 100 42`(手動再実行)もALL CLEAR(violations 0, errors 0)。CR Phase3/firedReturn配線はapp.js/ui-common.js側の変更でauto-simのvmローダー対象外(既存の挑戦状フローもauto-simは元々未カバー)のため、実プレイでの動作確認はKeisuke委任。⑥**実機確認推奨**: (a)社長室で関係修復斡旋書を開き、ペアを切り替えるたびにコスト・残金が変わること(新人ペア=ほぼ100万/ベテランペア=200万超) (b)挑戦試合の直訴でYESを選んだ後、即座に試合が起きず「次の興行で舞台が組まれる」通知が出ること→次の興行を実行すると直訴試合が3試合分カードに追加されて解決され、興行結果後に専用の結果モーダルが出ること (c)結果モーダルの相手選手セリフが勝敗に応じて変わっていること (d)解雇して他団体に渡った選手が対抗戦/PPV/奪還挑戦で自団体と対戦したとき「あの解雇から○週」系ニュースが出ること。変更: src/app.js(+238/-?) + src/data.js(+109/-?) + src/management.js(+29) + src/relationships.js(+4) + src/ui-common.js(+45) + docs/game-system-roadmap.md(該当2行更新) + 本項。

## 直近の調整（2026-07-17 4団体勝ち残り対抗戦 エンジン実装 — Codex task-03 着地・後追いレビュー合格）

Codex(task-03指示書)実装、コミット97622fa、メイン側でgit show後追いレビュー(fix-forward運用)。**許可3ファイル(management.js +438/data.js +15/auto-sim +36)ちょうど・レビュー指摘0で合格**。①**Engine.autumnWar**: 週34シード発表(ランキング1vs4・2vs3、AI代表=OVR上位3名・並びは昇順+40%で中堅⇔大将入替の揺らぎ)→週35編成(autumnWarPhase='entry'、weekPhase非占有)→週36準決勝2+決勝一括実行。勝ち抜き=敗者脱落・勝者残留、引き分け=両者脱落、同時全滅は勝ち抜き数→決定論的乱数のタイブレーク(ニュースに「同時全滅、抽選決着」明記)。決勝は3名全員復帰+15回復(上限80)、プレイヤーはreorderForFinal(並び替え予約)、AIは残存condition降順。消耗はEngine.wear(フォール間回復0/floor40)を_hpOverride+BIGMATCH_ENG満タンHPで適用。②**ポイント配線**: 対戦pt(準決±6/決勝勝者+8)、実績pt autumnWar_${season}=10、殿堂pt(1勝1.5+優勝在籍2+3人抜き2)、orgPop(優勝+4/準優勝+1/準決敗退-2、プレイヤーのみ)、賞金1200/500万、MVP(最多勝ち抜き→優勝チーム→決勝勝ち抜き→乱数タイ)人気+5、careerRecord type'autumnWar'{result,wins}。③**ロスター2/3団体エッジ**: 3団体=1位シード不戦勝、2団体=決勝のみ、2未満=不開催。旧セーブは週35/36で自己修復announce。④**auto-sim**: 週35編成自動化+週36通常興行スキップガード+完走統計。Codex側2シード×100+メイン側100シーズン(seed42)ゲートALL CLEAR。⑤**残**: E-4のUI(布陣ボードのクライムライン流用)は次アーク作業。orgWarRecord未接続(指示どおりスキップ、将来判断)。ニュース文言2種はKeisukeレビュー待ち(完了報告に全文掲載)。変更: Codexコミット97622fa + 本項。

## 直近の調整（2026-07-17 UIバッチ3件: 大会画面バー色統一+相関図ティップス+修復あっせん書改善）

Sonnet委譲・メイン側diffレビュー(新規16進は--hp-teal/--hp-teal-lightの2トークンのみ・G直接変更0)。①**大会画面のバー色統一**(UI原則9の大会側適用): pb-hp-miniのis-healthy/warning/danger色替え廃止→ティール単色グラデ(右側は270度ミラー)、JT開始前HPバー→var(--ev-summer)単色、春リーグ消耗3段ドット→var(--ev-spring)単色(点灯数のみで消耗度を表現)。勝者リング・1位色・MQ金など「意味の色」は維持。②**相関図ティップス**(C-4宿題完了): 相関図詳細パネル(親/競ラベル×4)+比較ポップアップ(親密度/競争意識×4)の計8箇所に_tipAttr(data-tip、スマホタップ対応)。文言=絆「一緒に過ごした時間や共闘で深まる、相手への信頼と親愛。高いほど息が合いやすくなります」/因縁「対戦の因縁や敵意。高いほど試合が激しくなります」。③**関係修復あっせん書**(Keisuke指摘反映・前半): ペア行に2人の重ね顔画像(30px円形、👤フォールバック)、「平均bond N」を廃止し「二人の関係: 冷え切っている(≤15)/険悪(≤25)/ぎくしゃくしている(≤35)/わだかまりが残る」の定性表示に。対立累計N回は維持。**残: 費用の給与連動化**(management.js、Codex task-03着地後)。④検証: node --check 2ファイル通過、UIのみでauto-sim不要。実機確認はKeisuke委任(相関図バーのタップティップス/あっせん書モーダル/JT・春リーグのバー色)。変更: src/index.html(±35)+src/ui-common.js(+19/-4)+src/ui-render.js(+13/-5) + 本項。

## 直近の調整（2026-07-17 春のタッグリーグ P3: 記録・称号の消費側 — 春パート完結）

実装はSonnet委譲、メイン側でdiffレビュー。**Codex task-03(4団体勝ち残り対抗戦)が同一作業コピーで並行編集していたため、git apply --cachedでP3のハンク(management.js 12個+data.js 1個)だけを仕分けてコミット**(ステージ版の構文チェック済み。Codex分は未ステージのまま保全)。①**経歴年表**: type'springTagLeague'を4結果(優勝/準優勝/3位/4位)とも表示(JTの流儀準拠)、🌸アイコン、`Engine.career.resolveFighterName(state,id)`新設(roster→aiOrgs→FA→retired→fighterArchive→ALL_CHARSの順でpartnerId解決)。②**殿堂ハイライト文**: buildCareerHighlightsに任意第3引数state追加(後方互換)、優勝のみ「第N回 春のタッグリーグ優勝（○○と）」。③**殿堂タブ内訳**: 「春タッグ優勝3pt」追記で全10種に。④**称号バッジ**: 選手詳細ポップアップヘッダに「🌸 総合ベストタッグ（第N回・○○と）」、選手一覧/ランキングに🌸(👑と同流儀)。getActiveBestTagTeamの遅延失効判定で自動消滅。⑤**年代記/シーズン総括**: 章ハイライトに優勝(金帯・連覇集約)/準優勝(銀帯)、シーズン総括に「春タッグ優勝」レコードカード+ナレーション2本(data.js)。**見送り2件(妥当と判断)**: 記者の目(分類器がタイトル/OVR/人気駆動で不自然な増築になる)/年末表彰式スライド(新スライドUI+実績pt二重加算リスク)。⑥**検証**: node --check(ステージ版含む)+auto-sim 50シーズンALL CLEAR+ブラウザ実機でポップアップ/一覧/殿堂/総括/年代記の表示確認(コンソールエラー0、Sonnet側)。⑦**実機確認推奨**: (a)選手詳細ヘッダの🌸バッジ(👑・派閥バッジと並んだ時の混み具合) (b)ランキング表の🌸の視覚ウェイト (c)殿堂タブ内訳10種の折り返し (d)シーズン総括の春タッグカード。これで**アーク5春パート(P1エンジン/P2a UI/P2b JT改修/P3消費側)完結**。変更: src/management.js(+92)+src/ui-render.js(+15)+src/ui-common.js(+8)+src/data.js(+4)+src/app.js(1行) + 本項。

## 直近の調整（2026-07-17 JTクライムライン改修 P2b: ブラケット縦型化+試合結果リデザイン）

承認済み棚卸し(`docs/jt-climbline-rework-inventory-v0.1.md`)を憲法にSonnet委譲、メイン側diffレビュー。①**ブラケット置換**: 横型SVG(.jt-bk系)→クライムライン縦型(.jtc-*)。下段=1回戦、勝者確定で上段がフェード+上昇せり上がり出現(TBD表示は廃止=枠自体が未出現)、アッパー画像(勝者=--ev-summerリング/敗者=モノクロ)、消化済み試合に決着時間チップ(_npTurnsToTime)、エンブレムは最上部1個(../image/emblem-summer.png)。合流線はSVG手動座標でなく**CSS Grid等分割センタリング**(段の試合数非依存の汎用式=C-6で無改修再利用可)、勝者ラインのみ大会色点灯(親未決着はグレー)。②**演出12項目の継承**: 取りやめゼロ。召集通知/フォーカスカード(_jtFocusCard無変更・開始HPバー継続)/観戦iframe/HP持ち越し/感想戦チェーン/BGM/不開催=無変更。決勝決着→**頂上に王者せり上がり(「第N回大会ジュニアチャンピオン」日本語表記)→タップで既存pb優勝発表**の二段構え(App.jtGoToFinalResult新設、_jtAdvanceInternalはcurrentRound=範囲外を「全段せり上がり済み」ポインタに)。**全試合スキップも1段ずつ段階せり上げ**(500ms/段、Keisuke裁定)→自動で優勝発表へ。③**試合結果画面リデザイン**(追加裁定): クライムラインと同じヘッダー(_jtHeader: エンブレム+金二重罫)を冒頭に、ラウンド表記を完全日本語化(「第1試合 / 全3試合 · 決勝」)、決着時間チップ追加、アッパー画像の勝敗表現統一。既存要素(MQ星/Finish技名/HP回復アニメ/postMatchWinセリフ)は全維持。pb-*共通クラスは非変更で`.pb-mrow.is-jt`スコープのみ追加=他画面(PPV/対抗戦等)に影響なし。④**メイン側レビュー**: 生16進の新規追加0件(全てvar()参照)・旧.jt-bk系クラスの残存参照0・デバッグ残骸0・G直接変更0・node --check通過を確認。エンジン非接触のためauto-sim不要(規約準拠)。⑤**実機**: Sonnet側で4名ブラケットの全パス(せり上がり/観戦/スキップ/段階スキップ/頂上タップ→優勝発表/リロード復帰)をコンソールエラー0で確認済み。**8名ブラケットのみ実機未確認**(テストセーブにU-20が8名未満。ロジックは段数非依存の同一コードパス)。⑥**実機確認推奨(Keisukeさん)**: (a)週25のJTで下段のみ→せり上がりの一連 (b)全試合スキップの段階演出のテンポ(500ms/段) (c)試合結果画面の新デザイン(色味・情報量) (d)頂上の王者タップ→優勝発表 (e)可能ならU-20が8名以上いるセーブで8名ブラケットの横幅・合流線。変更: src/ui-common.js(+175/-156)+src/app.js(+43/-10)+src/index.html(+80/-33) + docs(棚卸しステータス/仕様書/ロードマップ/本項)。

## 直近の調整（2026-07-17 春のタッグリーグ P2a: UI実装 + 特別大会デザイン言語確定）

実装はSonnet委譲、メイン側でdiffレビュー+トークン修正。①**デザイン確定の経緯**(モック3本・全てKeisuke裁定): v1=共通言語(フォント階層/-12°/金二重罫/カラーキー1色: 春桜#e07a9a・夏空#56b1d8・秋緋#c1503c・冬白金#cfc4a2)+方向性3案→**B案エンブレム採用**。v2=B案確定版(エンブレムは`image/emblem-*.png`参照・同名上書き差し替え運用、仮画像4枚をSystem.Drawingで生成済み、本物はKeisukeさん制作)。v3=トーナメント表比較3案→**案2クライムライン採用**(下から上へ勝ち上がる/開幕時は下段のみ・勝者確定で上段せり上がり出現/アッパー画像/決着時間表示/エンブレムは最上部1個のみ/称号は「第N回大会ジュニアチャンピオン」日本語表記)。②**P2a実装**: 今週バナー(週10発表/週11編成導線/編成済み)+編成モーダル(mdl-a流用・候補グリッド+サジェスト3件◎◯△・confirmPlayerTeam経由)+週12リーグ興行画面(showResultOverlay共用・リーグ表FLIP順位入替→試合ストリップ→FINAL対峙→決勝→優勝発表pb流用2名対応)+週12通常興行ブロック(renderShowPrep差し替え+今週typeLabel「🌸春のタッグリーグ」)+リロード再開(resumeLoadedSpecialPhase)。発火はapply()が立てるtransientフラグ`_pendingSpringTagLeagueReplay`(他_pending*系と同規約、リプレイ表示後に除去)。turnsはsimulateTagMatchが元々返却しておりrun()のmatches/finalMatchに記録追加のみ(+7行)。時間表示は既存`_npTurnsToTime`(1ターン=90秒)流用。manifest.jsonは`assetDirectories:"image"`で丸ごと包含のため変更不要と確認。③**メイン側レビュー修正**: 新規.stl-* CSSの生16進8箇所をトークン化(#d4a843→var(--gold)/#6fa28c→var(--accent-faction-4)/#c0524a→var(--red)/#1c1a17→var(--panel-bg)/#f4eed8→var(--cream-bg-card)/#beb6a4→var(--cream-panel-bg)/#fff→var(--text-main))。新規16進は:rootの--ev-*4色定義のみに。エンブレムパス`../image/`は既存getPortraitUrl規約と一致を確認(懸念は杞憂)。ui-common描画関数のG直接変更なし・escHtml適切を確認。④**検証**: node --check通過、Sonnet側でブラウザ実機(週10→12進行・編成モーダル・リーグ演出・コンソールエラー0、表示バグ1件[時間とMQの連結表示]発見修正済み)、auto-sim 100シーズン(seed42) ALL CLEAR。⑤**実機確認推奨(Keisukeさん)**: (a)週10-11の今週バナーと編成モーダル(編成する→組み直す) (b)週12でリーグ演出が自動開始しリーグ表の順位入替アニメが見えること (c)週12の興行準備がブロック表示になること (d)優勝発表の「第N回大会 総合ベストタッグ」表記と人気+10/賞金 (e)エンブレム(仮画像・春)表示 (f)BGM鳴り分け(リーグ中→決勝→ファンファーレ)。⑥**関連ドキュメント**: P2b用のJT演出棚卸し`docs/jt-climbline-rework-inventory-v0.1.md`承認済み(取りやめ演出ゼロ/スキップ時も1段ずつ段階せり上げ/8名時は下段縮小)。次: P2b実装。変更: src/index.html(+123)+src/ui-common.js(+422)+src/app.js(+137)+src/ui-render.js(+81)+src/management.js(+7) + docs(仕様書/ロードマップ/本項)。

## 直近の調整（2026-07-17 春のタッグリーグ P1: エンジン基盤 + 連戦消耗モジュール実装）

アーク5実装第1弾。実装はSonnet委譲、メイン側でdiffレビュー+3件修正。①**連戦消耗モジュール `Engine.wear`**(match-engine.js新設・秋/C-6と共用): `calc(hpRatio)`=12+(1-残HP率)×20 / `nextCondition` / `toHpOverride`。調査の結果 `condition` フィールドは戦闘計算に不使用(PPVの condition:80 も実質無効値)で、実体はJTの `_hpOverride`(開始HP%)方式と判明→consition値を開始HPに変換する形で実装。タッグ戦の `initFighter` に `_hpOverride` 対応を追加(未指定時は従来通り満タン、既存呼び出し無影響)、`perFighter` に `hpMax` を追加。②**`Engine.springTagLeague`**(management.js +483行): announce(週10・AI3団体はOVR+ケミストリー上位ペア自動選出)→entry(週11・`springTagPhase='entry'`)→run/apply(週12・総当たり6試合+決勝)。勝ち点3/1/0+MQ60+ボーナス1点、タイブレークは直接対決→合計MQ→決定論的乱数。チームは週12時点で再解決(負傷等で無効ならbestPairで自己修復)。消耗は両チームとも自チーム残HP(2名計)から算出・回復1/2・floor40(総当たりなので勝者限定でなく一般化)。③**ポイント配線**: BATTLE_POINT_CFG.springTag(+12/+5/0/-8)/ACHIEVEMENT_CONFIG.pt.springTag=8(`springTag_${season}`)/calcHofPoints優勝+3/careerRecord.history `type:'springTagLeague'`(全8選手・partnerId付き)/優勝2名人気+10/賞金(プレイヤーのみ1500/800/400/200万)/称号`bestTagTeam`は遅延判定(`getActiveBestTagTeam`—引退退団処理10箇所に失効フックを差す代わりに都度ロスター現存確認)。④**既存対抗戦の窓移動**: checkRivalryWar 12/24/36→10/22/34(週依存判定はこの1箇所のみをgrep確認、対抗戦頻度0.87-1.00で従来レンジ維持)。⑤**メイン側レビュー修正3件**: (a)週11の `weekPhase:'springTagEntry'` 早期returnを撤回—'manage'以外が残留すると今週画面の操作(canManage系)が1週ロックされるため、weekPhaseは奪わず `springTagPhase==='entry'` だけで編成期間を表現する設計に変更(validateGameStateの追加フェーズも撤去、auto-simも追随) (b)ニュース文面の「Week11/Week12」→「第12週」(プレイヤー向け週表記の慣例準拠)+見出し「来週開幕」→「開幕迫る」(週10告知なので) (c)Engine.achievement.add の返り値破棄はOKと確認(破壊的更新ヘルパの既存流儀)。⑥**auto-sim**: 週11編成自動化+週12通常興行スキップガードを追加。Sonnet側190シーズン+修正後 `node test/auto-sim.js 100 42` ALL CLEAR(完走1.00/シーズン・不開催0)。⑦**残タスク(P2)**: UI一式(週11編成導線[springTagPhase==='entry'起点]/週12リーグ表進行演出/週12通常カード編成のブロック導線[PPV週48バイパスと同型]/称号表示)—docs/ui手順に従い画面仕様書を先に起こす。P3: 経歴年表・殿堂ハイライト・年代記の消費側で `springTagLeague` type対応。ついで: E-4エンジンのCodex指示書 `docs/codex-tasks/task-03-autumn-gauntlet-war-engine.md` を作成(投入はKeisukeさん)。変更: src/management.js(+490/-12) + src/match-engine.js(+51) + src/data.js(+15) + test/auto-sim.js(+33) + 本項。

## 直近の調整（2026-07-17 アーク5 設計確定 — 年間カレンダー3企画のドラフト仕様書き起こし）

Keisuke さんとの設計議論でアーク5のスコープと主要方針を確定し、ドラフト仕様3本に書き起こした（実装なし・設計のみ）。①**スコープ裁定**: アーク4（E-1/E-6 イベント系）は重いため見送り→アーク5へ。四季それぞれに年次イベントを置く「年間カレンダー完成」を軸に、**春タッグリーグ + 秋の陣（E-4 勝ち残り対抗戦）+ C-6 4年に一度PPVトーナメント**を採用。統一王座+秋挑戦権トーナメント（autumn-unified-qualifier）は統一王座新設が重く**保留**、E-2 特殊試合形式・E-5 殴り込みは後回し。四季の色分け=春:チームの祭典/夏:若手の登竜門(既存JT)/秋:団体の全面戦争/冬:頂点(PPV+4年に一度の特別イヤー)。②**主要決定**: 消耗=B案・実測連動（`wear = 12 + (1-残HP率)×20`、シミュレーションの実ダメージが次戦のドラマを作る。回復は秋0/春1/2/C-6 2/3のイベント性格差）/ E-4は3名制（先鋒・中堅・大将、決勝は全員復帰+消耗持ち越し、決勝前の並び替え=社長の采配）/ C-6は4年周期（season%4==0）・8名7試合（通常PPVと同尺）・優勝称号は記録と名誉のみ効果なし / タッグ王座は作らない（案C・称号のみ、ベストタッグの常時バフも見送り）。③**ポイント接続（仮確定→実装後auto-sim実測で最終調整）**: 対戦pt=春+12/+5/0/-8・秋+6/-6+決勝+8・C-6決勝±7（summit載せ替え）。※対戦ptはシーズン開幕全リセット（advanceWeek）のため非ゼロサム配点でも累積ドリフトなしを確認（Keisuke さん懸念に回答）/ シーズン実績pt=春8・秋10・C-6年20（通常15の代替）/ 殿堂pt=春優勝+3・秋1勝+1.5&優勝+2&**3人抜き偉業+2**・C-6優勝+8。**殿堂インフレ懸念**（閾値15/22/35の据え置き可否）はauto-simでbefore/after実測してから裁定。④**既存システムとの整理**: 既存対抗戦（rivalry war）は存続（日常の抗争vs年次の祭典）、checkRivalryWarの窓W12/24/36→W10/22/34へ移動予定（特別興行との同週衝突回避）/ C-6年は頂上決戦を決勝が代替、因縁優先マッチメイクは非適用（ブラケット準拠）。⑤**成果物**: `specs/autumn-gauntlet-war-spec-v0.1.md`（新規・連戦消耗モジュール定義元）+ `specs/quadrennial-ppv-tournament-spec-v0.1.md`（新規）+ `specs/spring-tag-league-spec-v0.1.md`（v0.2決定反映: 王座案C/バフ見送り/消耗B案/§12ポイント接続追加）+ CLAUDE.md索引4行追加 + ロードマップ（現在地/アーク5/C-6/E-4/カレンダー計画セクション刷新・実装順=春→秋→C-6）。⑥**次**: 3本の仕様レビュー（Keisuke さん）→ 承認後に春タッグリーグから実装着手（連戦消耗モジュールも春で先行実装）。ついで発見: CLAUDE.md specs索引の「全39ファイル」表記が実態（65ファイル・索引51行）と乖離していたため件数表記を撤去（索引の棚卸しは別途）。

## 直近の調整（2026-07-17 C-4 P3+P4: 残り画面のティップス data-tip 転換 — C-4 完結）

P2 で作った data-tip 機構を残り画面に展開し、C-4 が実装完結。①**転換した非アクション説明**(title→data-tip、スマホ対応): 社長室=決裁済み書類の「なぜ押せないか」説明(is-approved 時は CSS ツールチップが opacity:0 になるため競合なしを確認) / スカウト=契約不可ボタン3種(オフシーズン・知名度不足・枠上限。**disabled ボタンはマウスイベント不発のためラッパー span に data-tip + ボタン側 pointer-events:none** の `_disBtn` ヘルパー) / 団体ロスター=PW/SP/TE/ST/MN ステータスラベル(STAT_TIPS)10箇所+招聘バッジ+💔信頼低下バッジ / 選手詳細ポップアップ=ステータスラベル(3246)+特性バッジ(td.desc) / 団体詳細パネル=ステータスラベル(1815) / サバイバルゲージ=マイルストーン説明(965)。②**据え置き(方針どおり title 維持)**: アクション付き要素(派閥バッジ・声かけボタン・ドラフト3ボタン[可視 hint 併記あり]・タッグ変換・おまかせ編成)と冗長情報(「クリックで選手詳細」×12・名前 title・音量ボタン)。③**ついで**: ドラフト「強気で押す」title の内部係数「降り確率3倍」→「相手が降りやすくなる」に定性化(数値方針)。④**検証**: node --check 2ファイル + プレビュー起動でコンソールエラー0。UIのみで auto-sim 不要。⑤**実機確認推奨**: (a) 団体タブの PW/SP 等の文字タップで説明が出ること・行タップの選手詳細が引き続き開くこと、(b) スカウトの⛔ボタンで理由が出ること、(c) 社長室の決裁済み書類タップで説明が出ること、(d) 選手詳細のステータスラベル・特性バッジ。⑥**C-4 はこれで完結**(P1 ガイド14節 / P2 機構+今週+興行準備 / P3+P4 残り画面)。データベース相関図の絆/因縁バー等への「新規」ティップス追加は必要が出たら別途(小さな宿題)。変更: src/ui-render.js(9箇所) + src/ui-common.js(2箇所) + docs/game-system-roadmap.md(C-4 完了+現在地) + 本項。

## 直近の調整（2026-07-17 C-4 P2: 今週+興行準備のツールチップ customTooltip 統一）

C-4 方針①(customTooltip統一)の雛形実装。①**宣言的ツールチップ機構を新設**(`ui-common.js` showCustomTooltip直下): `_tipAttr(html)`=任意要素にdata-tip属性(escHtml済)を付ける / `_tipIcon(html)`=既存 `.tt` CSSを使う「?」丸アイコン / document委譲リスナー3本(mouseover表示・mouseout非表示[relatedTargetガードで子要素間ちらつき防止]・**click はcapture段階で拾いstopPropagation**=列ソートthの中のアイコンをタップしてもソートが発火しない)。title属性はスマホ非表示のため、説明系はすべてdata-tipへ、titleは「なくても困らない冗長情報」限定に格下げ。②**今週画面**(`ui-render.js`): スケジュール列見出しℹ→方針4種+体調60自動休養のリッチtip / ⚡列見出しに追込tip新設(効果・条件、幅46→60px) / 🤖おまかせボタン隣に?アイコン / 休暇バッジ(+衰え回復も追記)・レンタル自律・トレーナー/招聘バッジをdata-tip化。**招聘/トレーナーバッジのtitleにあった内部倍率(×1.35等)の露出を「練習効果アップ」に置換**(数値方針準拠)。③**興行準備**: Match Cardヘッダに?アイコン(おまかせ編成3種の説明) / 予想MQメトリクス・カード魅力ラベルにtip新設 / 派閥抗争・直接対決・派閥内序列戦バッジをdata-tip化。**「F08 直接対決」の内部イベントコードF08をバッジ(3039)とトースト(2249)から除去**。④**検証**: node --check 2ファイル通過。プレビュー(serve root :3002 → /src/)で main world 注入テストによる機構のend-to-end検証(hover表示/離脱消去/タップ表示/外タップ消去 全✓)+コンソールエラー0+タイトル画面表示正常。※ブラウザペインにセーブがなくゲーム内画面の実表示は未確認→実機委任。UIのみでauto-sim不要。⑤**実機確認推奨**: (a) 今週タブのスケジュール/⚡列見出しの「?」をホバー・タップして説明が出ること、(b) スマホ(タッチ)でも出ること・「?」タップで列ソートが発動しないこと、(c) 休暇/招聘バッジのタップで説明が出ること、(d) 興行準備のMatch Card「?」・予想MQ・カード魅力・派閥バッジ、(e) 派閥の直接対決バッジに「F08」表記が出ないこと。⑥残り: P3(社長室・スカウト・ドラフト交渉)/P4(データベース・経営ほか)のtitle転換。変更: src/ui-common.js(+28) + src/ui-render.js(11箇所) + 本項。

## 直近の調整（2026-07-17 C-4 P1: 遊び方ガイド全面改訂 実装完了）

草案v0.1(同日起草・全文レビュー済)を `src/index.html` screen-help に実装し、C-4 P1 が完結。①**レビュー反映**: Keisuke さん指摘「ウェアが何で貯まるのかをダメージの蓄積として語ってほしい/専属トレーナーで貯まるのか?」を受けてコード再確認——**練習・招聘バフはウェア加算要因でない**(蓄積はシーズン末年次精算: 加齢[23±実効耐久から]+キャリア平均40戦以上+3+怪我×2+追込年12週以上+2、management.js 6382-6402)ことを確定し、節11を「リングで受けたダメージが刻まれる/削るのは試合の詰め込み・怪我・追込の使いすぎ/指導そのものは体を削らない」の語りに改稿(21b5d5b)。他13節は指摘なしで確定。②**実装(Sonnet委譲・メイン側diffレビュー)**: 現行11節を新14節に完全置換(index.html 8717-8974、-134/+161行)。help-content 外(panel/Credits/toggleHelp)は非変更、コメントを v2.0 C-4 に更新。転記規約=gold見出し/red警告/text-subヒント行の現行慣例踏襲、ハードコード16進0件。③**検証**: help-section ちょうど14個 / div開閉216対で均衡 / script行の変更0(git diffで確認) / 置換範囲内16進カラー0件。HTML内容のみの変更のため auto-sim 不要。④**実機確認推奨**: (a) ヘルプ画面で14節のアコーディオンが全て開閉できること、(b) 節見出しと本文の絵文字・強調表示が崩れていないこと、(c) 長い節(社長室/補強)がスマホ幅で読めること。⑤次は P2: 今週画面+興行準備のツールチップ customTooltip 統一(title属性はスマホで見えない問題の解消、雛形づくり)。変更: src/index.html(+161/-134) + docs/help-guide-draft-v0.1.md(ステータス更新) + docs/game-system-roadmap.md(C-4→P1完了) + 本項。

## 直近の調整（2026-07-17 C-4 P1: 遊び方ガイド全面改訂 草案v0.1）

同日の棚卸し(次項)を受けた4論点の裁定(①機構はcustomTooltip統一 ②ガイドは節構成から全面再設計 ③MQは公認用語・初出注釈 ④数値は条件は書く・式は書かない)に基づき、遊び方ガイドの新全文を `docs/help-guide-draft-v0.1.md` に起草。①**現行11節→新14節**: 王座とビッグマッチ/絆と因縁/派閥/読みもの の4節を新設、信頼・士気・ケアを「選手の心」と「社長室」に分割、スカウト・レンタル・引き抜きを「補強」に統合。②**執筆前に全数値・条件をコード照合**(付録Bに根拠行番号つきで記録)し、陳腐化を多数確定——倒産-1000万(→資金危機: 資金<0で猶予4週・-1500即死)/追込×1.5怪我5%(→×1.8・3%)/コーチ枠人気連動3枠(→購入制4枠)/ドーム30,000人(→22,500)/引退35〜39歳(→30〜33歳)/対抗戦5対5(→3or5本勝負)/専属トレーナー手配書(→外部コーチ招聘状)/引き抜き導線「全選手を見る」(→選手詳細ポップアップ)。③**数値方針の適用**: 内部倍率・確率(×1.8/成功率15%/連敗-5等)は定性表現に置換、操作条件(体調60自動休養/追込2週連続・体調50/決裁枠4週+2上限6/タイトル12週CD/JT week25/PPV人気30・week43/48)は明記。引退実年齢も「30歳を過ぎると進退を考え始める」に婉曲。④ステータス: **Keisuke さん全文レビュー待ち**。承認後にHTML実装(実装はSonnet委譲予定)→その後P2以降(今週+興行準備のティップスcustomTooltip統一)へ。変更: docs/help-guide-draft-v0.1.md(新規) + 本項。

## 直近の調整（2026-07-17 C-4 ヘルプ・ホバーティップス 全画面横断棚卸し）

アーク3残り C-4 の第一歩として、ヘルプ・ツールチップ類の現状を全画面横断で棚卸しし `docs/c4-help-tips-inventory-v0.1.md` にまとめた(実装なし・調査のみ)。①**機構が6系統に分裂**: 遊び方ガイド(静的11節) / ネイティブ title 属性(説明文級 約40箇所、**スマホで効かない**) / showCustomTooltip(PC+タップ両対応なのに使用2箇所のみ) / info-tip ℹ️(1箇所、実体title) / rank-metric-tooltip(ランキング専用、最も整備された見本) / 選択イベント choice hint(健全)。②**遊び方ガイドの陳腐化を確認**: 「🤝信頼・士気・ケア」節が社長室ケア再設計(07-06〜07 P1〜P4)前の記述のまま——ボーナス50万固定(現行は交渉型4案)・休暇辞令スランプ限定(現行は常時可・週数4案・欠場)・専属トレーナー手配書(現行は外部コーチ招聘状に置換済)。「📋引き抜き交渉」節の導線「ランキング画面の📋全選手を見る」は現存せず(現行は選手詳細ポップアップの「🤝選手を引き抜く」)。「衰え(wear)」の内部変数名露出も発見。③**未掲載システムの列挙**: 派閥/タイトル・PPV・JT/ドラフト交渉/絆・因縁/タッグ/読む系(新聞・年代記・因縁列伝・経歴)/招聘/シーズン総括ほか、ガイドに1節もない実装済みシステム多数。④**論点5件を整理して裁定待ち**: 機構統一方針(customTooltipベースへ寄せるか) / ヘルプ改訂範囲 / 「MQ」表記の公認可否 / 数値露出基準 / フェーズ分割案(P1ヘルプ改訂→P2今週+興行準備→P3社長室系→P4残り)。変更: docs/c4-help-tips-inventory-v0.1.md(新規) + docs/game-system-roadmap.md(C-4状態更新) + 本項。

## 直近の調整（2026-07-16 ニューステンプレ名指し選手セリフの一掃）

前項⑤で記録した残存分について Keisuke さんから「同じ方針で一掃」の指示を受け、`src/data.js` の汎用テンプレートから名指し選手({name}/{requesterName}/{prevChamp} 等)に帰属する鉤括弧セリフを全除去し地の文(間接叙述)に畳み込んだ。①**対象26カ所**: ティッカー王者コメント(13370) / 挑戦試合打診系 勝敗ニュース(13917 直訴の一言+一区切り・13923・13927) / firedReturn(13955) / 王座交代(13973・13975) / 覚醒(13989) / モチベ喪失(14005 又聞き型・14007) / 殿堂入り(14011・14013・14015) / 引退3本(14019・14021・14023) / 引き抜き(14057・14059) / 嫌悪伝染(14093) / 修復成功 見出し+本文(14098-14099)・修復失敗(14103) / 週次イベント体調(14385)・浮かない顔(14402) / 怪我予兆2本(17946・17947)。②**残置(匿名・集団声、特定キャラの口調に紐づかない)**: ファンの声(13319/13362/13991/14003/14047/14394)・業界関係者/業界紙(13981/13987/14061)・チームメイト/仲間たち(13995/13999)・陣営/両派/選手たち(13935/13943/14029/14067/14113)・怒号(14039)・若手(14083)・関係者(14075/14085)・スパー相手(14369)・メディア企業(17965-18009)・ライバル団体(17957-17961)。③**判断待ちで未変更**: コーチ観察レポート6本(14426-14431、コーチは選手でないが35名に個別の声がある=同種の問題を孕む。直すなら coach-lines.js の voice 経由が筋) / 派閥F07観察線 {targetName} セリフ1本(2898「次は、呼んでくれるかな」) / Common-1 コーチ報告内のリーダー又聞き(3020)。④**ついで修正**: 14083/14099 の本文に内部変数名 `bond` が露出していたため「絆」に修正(プレイヤー向け表記ルール準拠)。性格・アーキタイプ分岐済みテーブル(待遇不満/SNS 17777-17870 等)は口調がキャラに紐づくため対象外と確認。⑤**検証**: node --check 通過、名指し帰属パターンの grep 残存0。データのみで auto-sim 不要。全文は完了報告に掲載し Keisuke さんレビュー。⑥**判断待ち3件の裁定(Keisuke さん)**: コーチ観察レポート6本(14426-14431)=直さなくてよい / F07 resultTarget の {targetName} セリフ(2898「次は、呼んでくれるかな」)=兄弟行と同じ仕草描写に置換(「少しだけ顔を上げて、遠くの輪を見ていた」) / Common-1 権威型コーチ報告のリーダー直接引用(3020「実力で示せ」)=間接化(「リーダーは実力で示させる構えです」)。これで本件クローズ。変更: src/data.js(26カ所+bond表記2カ所+裁定分2カ所) + 本項。

## 直近の調整（2026-07-16 ニューステンプレートの「世界王座」表記統一）

Keisuke さん方針「世界王座は大げさ(自団体のトップベルトに過ぎない、正式名は TITLES 定義の『団体王座』)」に基づき、シーズン総括画面(c876818 で修正済)に続いて `src/data.js` のニューステンプレート残存分を統一。①**対象**: 離脱・裏切り A-1系(contractBetrayalChampCarry/ChampLeave)+奪還挑戦 B-3系(reclaimChallenge/Success/Failure)の「世界王座」9カ所+見出しの「世界ベルト」1カ所(14200行、grep 指定外だが同方針違反のため合わせて修正)。②**書き換え方針**: 機械置換でなく各文の読みやすさ優先——記事 body の初出は正式名「団体王座」(14027/14035/14195/14201)、見出しは短く「王座」(14194/14206)、返上の文脈は「王座は返上」(14033)、物としてのベルトを指す文脈は「ベルト」(14197「王座のベルトを抱えて」/14200 見出し/14203「持ち去られていたベルトが手元に帰ってきた」)。黒田トーンの文体は非変更、王座表記の語だけ差し替え。③**確認**: `grep '世界王座\|世界ベルト\|世界の看板' src/data.js` 0件(他の「世界」はキャラプロフィール等の無関係文脈のみ)、node --check 通過。データのみの変更のため auto-sim 不要。④**実機確認**: 該当ニュースは離脱・裏切り/奪還挑戦イベント発火時のみ表示されるレアイベントのため、書き換え後全文の文面レビューで代替(完了報告に全文掲載)。⑤**レビュー指摘対応: 名指し選手のセリフ除去**——Keisuke さん指摘「選手のセリフは属性・性格に合わせる必要があり、汎用テンプレでは合わせられないので省略した形にする」を受け、A-1/B-3 群で {name}/{challengerName} に帰属する鉤括弧セリフ9カ所(本文8+見出し1「ベルトを取り戻す」)を地の文に畳み込み。匿名の集団声(「残された選手たち」「ファン」「怒号」3カ所)は特定キャラの口調に紐づかないため残置。**同パターン(名指しセリフ)は範囲外のテンプレにも多数残存**(挑戦試合打診系 13917-13943/王座戦 13973-13975/成長 13989/スランプ・モチベ 13995-14007/殿堂 14011-14015/引退 14019-14023/引き抜き 14057-14059/修復 14099-14103 ほか)——一掃するかは別途判断待ち。変更: src/data.js(表記10カ所+セリフ除去9カ所) + 本項。

## 直近の調整（2026-07-16 personality単軸セリフ7本の [personality][archetype] 二軸化 — 組み替えプロジェクト完結）

残走査(同日worklog参照)で発見した未変換7本を全て二軸化し、personality単軸テーブルの archetype 組み替えプロジェクトを完結。①**対象**: tag-battle-lines.js の6本(HOT_TAG_LINES/DOUBLE_TEAM_LINES/CUTIN_SAVE_LINES/BETRAYAL_LINES=掛け声、TAG_MATCH_WIN_LINES/TAG_MATCH_LOSS_LINES={partner}言及の勝敗セリフ) + victory-lines.js の VS_EX_EMPLOYER_LINES(元雇用主戦 win/hit、**boldに一人称「俺」2行が混入していた問題も同時解消**)。②**執筆(Opus 3並列)**: CUTIN_LINES(7×7の既存手本)と oyou-style-guide を規範に、性格7種(感情の中身)×アーキタイプ7種(口調)のフルマトリクスで執筆。掛け声4表=各セル3本(588本)、勝敗2表=各セル2本(196本)、VS_EX=各セル win2+hit2(196本)、計980本。草案: `docs/tag-shout-lines-draft-v0.1.md` / `docs/tag-winloss-lines-draft-v0.1.md` / `docs/vs-ex-employer-lines-draft-v0.1.md`。delinquent の一人称「あたし」固定、勝敗セリフ全行 {partner} 必須(草案の欠落2行はメイン側で名前を足して補正)。③**配線(Sonnet、メイン側で機械チェック+diffレビュー)**: 6+1テーブルを `{personality:{archetype:[...]}}` 構造に置換、共通ヘルパー `_tagLineArrFor` で `_getCutinLines` と同じフォールバック連鎖([p]||normal→[a]||normal)。pick系4関数のシグネチャを `(fighter)` に変更し tag-battle-main.js の呼び出し5箇所を修正、`getVsExEmployerLine` と app.js の直接参照2箇所も二軸化。pickDoubleTeamLine は呼び出し元なしの死にコードと判明(シグネチャだけ揃えて残置)。④**検証**: node --check 4ファイル + 全343セル×980本の機械列挙(非空/won-loss全行{partner}/win-hit各2本/「俺・僕」0件) + 境界3ケース+未知キー1ケースのフォールバック動作 + auto-sim 100季×seed42 ALL CLEAR。⑤**実機確認推奨**: (a) タッグ戦でお嬢様/クール/不良/鷹揚キャラのホットタッグ・カット・敗戦セリフが口調通りか、(b) 解雇→他団体移籍選手との対戦で遺恨セリフ(勝利マイク/被弾カットイン)が出るか、(c) 「俺」が出ないこと。⑥文面980本は Keisuke 全文レビュー中(修正はテーブルのセル直しで即応可)。変更: src/tag-battle-lines.js(+812/-188) + src/victory-lines.js(+566/-121) + src/tag-battle-main.js(±10) + src/app.js(±10) + docs/ 草案3ファイル + docs/game-system-roadmap.md + 本項。

## 直近の調整（2026-07-16 C-5 フェーズ3: シーズン総括ナレーション執筆+配線 — C-5 完結）

シーズン総括(ANNUAL RECORD)画面の仮文ナレーションを確定文面に差し替え。①**執筆(Opus エージェント)**: `docs/season-review-narration-draft-v0.1.md` に文面表を起草。黒田トーンの「年次記録」レジスタ(コラムより固く・短く・断定調、「本紙」「〜と書いておく」等の署名的口癖は不使用)。リード総括8キー×3案(戴冠は年間1位/王座奪取で分割)+主役文2キー×3案+記録カード一言(新人王3/王者4帯×2/JT3/メディア3)+締めナレ4キー×3案=計59本。②**Keisuke 全文レビュー(v0.1→v0.2)**: (a)「数字がそれを認めている」はOK維持、(b) 船出案2の評価句「その一歩は小さくない」削除→事実のみ、(c) **「格言的なことは言わず事実を述べる場」の原則確定**——一般論・箴言調の7本(taikan_belt3/shifuku2/jigatame3/shiren2/funade3/media3/closing top1)を事実記述に書き換え。③**配線(Sonnet エージェント、メイン側diff+転記全文レビュー)**: `SEASON_REVIEW_LINES` 定数を `src/data.js` に新設(+117行、module.exports 追記込み)、`Engine.seasonReview.build` にキー選択+シード固定バリアント選択を配線(`src/management.js` +80/-18行)。`_pickLine`/`_fillLine` ヘルパー新設、シードは `(season*7919)|0` +スロット別オフセット(**Engine.rng 非消費**=build純関数維持、renderRanking の `_pickSeed` と同流儀。同一シーズン内は同文面・翌シーズンで変化)。見出し語→キー変換で戴冠のみ `rank===1` 二分岐、王者は防衛数4帯(0/1-2/3-4/5+)、締めは top/chase_close(**gap≤40 🔧射程圏閾値**)/chase_far/fallback。全パスに旧仮文の defensive フォールバック残置、`build()` の返却構造は不変。`TODO: Phase3 narration` マーカー全除去。④**検証**: node --check 2ファイル + 強制分岐スモーク24シナリオ(全キー網羅・プレースホルダ埋め漏れ0・undefined 0・決定性OK) + 有機スモーク(auto-sim流用 30季×seed42+60季×seed12345=450サンプル、エラー0) + 編集フックの auto-sim ALL CLEAR。⑤**実機確認推奨**: (a) シーズン終了後の総括画面でリード文が見出し語(戴冠/飛躍/試練等)に応じた文面になること、(b) §I記録カードの一言が防衛数・賞に応じて変わること、(c) 締めナレが順位と上位との差に応じて変わること、(d) 同じオフシーズン中に画面を開き直しても文面が変わらないこと。⑥C-5 はこれで完結(フェーズ2 顔ぶれ集計精緻化は必要が出たら)。次はアーク3残りの C-4 ヘルプ・ティップス見直し。変更: src/data.js(+117行) + src/management.js(+80/-18行) + docs/season-review-narration-draft-v0.1.md(v0.2化) + docs/ui/03-screens/season-retrospective.md(実装状況更新) + docs/game-system-roadmap.md(C-5完了+現在地07-16化) + 本項。

## 直近の調整（2026-07-16 ランキング画面 v1.0 A案「Office標準」実装）

同日のモックアップ3案比較で **A案(Office標準・ゴールド一元)採用が確定**(当初B案クリーム台帳が有力だったが、データベース等の隣接画面との色調連続性・OVR階調の共通言語維持・切り抜き画像の映えからA案に転換。役割バッジ復活の修正はA案に移植済み)。実装は Sonnet エージェントに委譲し、メイン側で diff レビュー。①**CSSのみの差し替え**(`src/index.html` ランキングブロック 6699〜7439行、旧6713〜7813): `renderRanking()`(`src/ui-render.js`)は無変更(git diff ゼロ確認)。clip-path切り角→角丸`--radius-md`、`--th-*`参照全廃→`--panel-bg`/`--card-bg`/`--border`/`--text-*`、金銀銅鋼(`--rank-1〜4`)参照全廃→1位のみ白→金グラデ+金枠・2〜4位は中立、is-player銀枠→金枠+薄金グラデ背景、tier-pillメタリックグラデ→ゴールド枠チップ、マスト30px金ベタ+4px二重罫→22px白金グラデ+1px `--border`、床ライト/王者スポット全順位金統一、履歴テーブル`.data-table`様式化(h-rank-1のみ`--gold-light`)。②**live DOM都合の対応**: `.section-marker .text`をflex化して1行見出し化(kicker+title、JSの入れ子構造は非変更)、`.victory-bar.is-top`/`.vb-top`(1位プレイヤー時)を金系で維持、`.orgcell-fcell .role-badges`(top:-16px)と`.rp-face .role-badges`(左上7px)の配置維持+後者に背景`rgba(18,17,14,0.85)`で視認性確保、1位評価値グラデ内の単位`pt`は`-webkit-text-fill-color:currentColor`で復元。③**死にCSS削除**: 03旧レイアウト一式(`.org-card`/`.org-banner`/`.ace-stand`/`.ace-name-plate`/`.org-body`系/`.fcell`系/`.formation-*`/`.champ-row`/`.footer-actions`/`.roster-toggle`/`.roster-list`ほか、JS出力なしをgrep確認済み。現役の`.orgcell-fcell`/`.orgcell-formation`は残置)。`--th-*`定義9行も参照ゼロ確認のうえ:rootから削除。`--rank-*`/`--v-*`/`--board-*`/`--office-*`定義は残置(--office-text-on-dark-*はドラフト画面が使用中)。④**維持したもの**: `.v-mythic`〜`.v-poor` OVR階調(トークン・黒縁取りルール含む)、`.rank-metric-tooltip`(teleport型)、`.rp-rank-fallback`、nm-tagの黒縁取り白文字。⑤**spec更新**: `docs/ui/03-screens/ranking.md` を v1.0(A案)に全面改訂(モックアップ正本=`docs/ui/mockups/ranking-restyle-A-office.html`、v0.9→v1.0差分表・ゴールドの当て方マトリクス付き)。⑥**検証**: `var(--th-` 0件 / ランキング内 `var(--rank-` 0件 / index.html全体 clip-path 0件 / 波括弧157対 / 新聞タブ・`--sr-*`無差分 / ui-render.js無差分。UIのみのためauto-sim不要。⑦**実機確認推奨**: (a) ランキング画面全体が暖茶+ゴールドのOffice標準トーンで表示され、切り角が角丸になっていること、(b) 1位カードの拡大+金グラデ数字、自団体の金枠強調、(c) 02フォーメーションの役割バッジ(王者/看板/主力)が画像上部に出ること、(d) 03主力層サムネイル左上の看板/主力バッジ、(e) 1位プレイヤー時の勝利条件バー(👑業界1位)、(f) 指標ホバーのツールチップ、(g) シーズン履歴テーブルの様式。変更: src/index.html(-539/+165行) + docs/ui/03-screens/ranking.md(v1.0全面改訂) + 本項。

## 直近の調整（2026-07-16 ランキング画面 再スタイル モックアップ3案作成）

ユーザー指摘「ランキング画面だけ他画面とデザインが乖離している」を受け、**機能・文章・画像・セクション構造は現行実装(v0.9)のまま、フォント運用・色使い・角の処理だけを他画面に合わせた**再スタイル案を3種モックアップ化。実装は未着手(案の比較・選定待ち)。①**乖離の診断**: 現行ランキング画面は (a) clip-path による切り角(他画面は角丸4〜6px)、(b) 金銀銅鋼のメタリック順位カラーが見出し・ピル・団体名グラデ文字まで支配、(c) `--th-*` という独自の寒色寄り黒トークン(他Officeは暖茶 `--panel-bg`/`--card-bg`)、(d) 30px Bebas の巨大マスト+4px二重金罫(TV番組様式)、が主因。②**3案**: **A案 Office標準**(`docs/ui/mockups/ranking-restyle-A-office.html`) = メタリック廃止・ゴールド一元。`.panel`/`.panel-title`/`.data-table` 準拠、順位は数字とレイアウト(1位拡大)で表現、マストはトップバー様式の白→金グラデ22px。**B案 クリーム台帳**(`ranking-restyle-B-cream.html`) = ロスター/新聞と同じ「机の上の書類」メタファー。外枠Officeダーク+中身クリーム紙、順位カラーは金インク/墨、看板は朱(cream-red)、OVR階調はクリーム用インク階調に再着色、フォーメーションは台紙(集合写真パネル)方式。**C案 格式チューニング**(`ranking-restyle-C-tuned.html`) = 金銀銅鋼と1位拡大の格式は維持し、乖離要因だけ除去(切り角→角丸6px、寒色黒→暖茶トークン、マスト縮小26px白金グラデ、団体名メタリックグラデ文字→白)。順位カラーの適用先を「順位数字・ピル・左/上ボーダー・履歴順位列」に限定。③**共通仕様**: 3案ともHTML構造・サンプルデータ・実画像(upper/stand/org紋章、相対パス `../../../image/`)は同一で、CSSだけ差し替え。各ページ冒頭に案の説明+3案間の相互リンク付き。④**検証**: 3案ともブラウザで全38画像の読み込み成功を確認(broken 0)。レイアウトの目視確認はユーザーに委任。⑤**次ステップ**: Keisuke が3案を比較→採用案決定→`docs/ui/03-screens/ranking.md` を改訂して実装へ。変更: docs/ui/mockups/ 新規3ファイル + 本項。

## 直近の調整（2026-07-08 C-5 シーズン総括レポート フェーズ1実装）

`docs/ui/03-screens/season-retrospective.md`（確定仕様）+ `docs/ui/mockups/season-retrospective-ceremony.html`（確定モック）に基づき、オフシーズン週画面のシーズン終了レポートを寒色黒金の「ANNUAL RECORD」様式へ全面リデザイン。①**`Engine.seasonReview.build(state)` 新設**（`src/management.js`、純粋関数）: 最終順位＋前年比（`Engine.ranking.updateRankings` 再計算＋`seasonHistory` 末尾）、見出し語（`_decideHeadline`：戴冠/世代交代/飛躍/雌伏/試練/地固め/船出/奮闘を rank・prevRank・収支・受賞数・引退数・タイトル獲得の複数条件組み合わせで決定）、HERO（自団体MVP優先→OVRトップへフォールバック）、§I記録（新人王/王者/JT優勝/メディア功労賞のうち自団体該当分のみ、ベストマッチ・勝敗記録は含めない）、§II経営（団体人気=旗揚げからの年次推移／資金=今季週次を12点間引き／収支バー）、§III顔ぶれ（退団・加入・最も伸びた/陰りの見えた選手）、§IVランキングを1オブジェクトで返す。②**データ取得のタイミング問題への対処**: `retiredFighters`（今季分）は年末表彰式完了後に空へリセットされる transient フィールドのため、恒久フィールド `retiredSeasons`＋`chronicle.fighterArchive` からのフォールバック復元経路を追加（`_getDepartures`）。`fighterArchive` に選手の `age` フィールドを追加（既存消費側に影響しない追加のみ）。同様に `seasonGrowth` はシーズン末処理で即リセットされ「最も伸びた/陰りの見えた選手」の実数が消えてしまうため、`Engine.growth.applySeasonEnd` の返り値に `growthSummary`（id/name/age/net、リセット直前の退避値）を追加し、`advanceWeek` 側で `state.lastSeasonGrowthSummary` として保存する新しい「退避フィールド」パターンを導入（`lastAwards` と同型）。③**`renderWeekScreen` offseason 分岐の描画差し替え**（`src/ui-render.js`）: 既存の数値グリッド＋gameLogフィルタ＋ランキング表（`offWeek<=1`）を `_renderSeasonReview` に置換。進捗バーと advanceWeek 導線はそのまま維持。**`offWeek>=2`（ドラフト/移籍週）の旧gameLog+ランキング表示は else 分岐として無変更のまま温存**（元コードは offWeek 分岐なしで全オフ週に表示されていたが、仕様の「offWeek>=2は一切触らない」を守るため明示的にガード）。単一系列ゴールドの折れ線チャート用SVG生成ヘルパー `_srChartSvg` を新設（dataviz準拠：凡例なし・最新点強調・低コントラストグリッド）。画像は `getStandUrl`/`getUpperUrl` を使用し全て `onerror="this.style.display='none'"` でフォールバック。④**CSS**（`src/index.html`）: `:root` に `--sr-*` トークン12種＋銀/銅（`--sr-silver`/`--sr-bronze`）を新設し金は既存 `--gold`/`--gold-light`/`--gold-deep` を流用。モックのCSSを `.sr-` プレフィックスで全面ネームスペースして移植（`.card`/`.stage` 等の汎用名衝突を回避）、640px以下の1カラム化メディアクエリを追加。Cormorant Garamond を既存の Google Fonts link に追加（他画面と同じCDN方式）。⑤**見出し語ロジックの設計判断**: 単純な1変数閾値を避けるため、戴冠=年間1位or今季タイトル奪取／世代交代=引退3名以上／飛躍=順位上昇+黒字+受賞2件以上／雌伏=順位下降+赤字／地固め=順位維持+収支ほぼ均衡(収入比±8%以内)／試練=それ以外の赤字or順位下降／1年目は船出or試練、の優先順位付き分岐で決定。⑥**ナレーションはPhase1につき仮文**: lead/closing/records各narrは事実ベースの短文（例:「前年4位から3位に浮上した。」）。全生成箇所に `// TODO: Phase3 narration table` コメントを付与済み（Phase3でOpus 4.6が執筆・Keisukeレビュー後に差し替え）。⑦**検証**: `node --check` 2ファイル通過。management.js編集でauto-simフック相当の検証を実施——`test/auto-sim.js` を seed 42(100季)/7919(60季)/999(30季) の3本で実行し全て ALL CLEAR ✓(violations 0 / errors 0)。加えて実際のゲームプレイパイプライン(tickWeek/advanceWeek)経由で `Engine.seasonReview.build` を計280回(offWeek 0/1 到達ごと)呼び出すスモークテストをスクラッチスクリプトで実施し例外・NaN 0件を確認(1年目/多年目/引退多数/受賞複数など多様な状態を横断)。実機ブラウザでの目視確認はプレビュー環境の制約(JS実行がisolated worldでApp/Gの内部closureに届かない、既知のMEMORY記載の制約と同種)により完遂できず、ユーザーに委任。⑧**実機確認推奨**: (a) シーズン終了後のオフシーズン週(offWeek 0→1)でANNUAL RECORD画面が正しいレイアウトで表示されること、(b) HERO主役スタンド画像・§I記録カードのアッパー画像が正しく表示され画像欠損時にフォールバックすること、(c) 団体人気/資金の折れ線グラフが実データで正しく描かれること、(d) 退団/加入/成長/陰りの顔ぶれ欄が実名で表示されること(陰りの選手が婉曲されず出ること)、(e) offWeek 2以降(ドラフト/移籍)の表示が従来通り変化していないこと、(f) 1年目セーブで前年比矢印・人気推移グラフが自然に省略されること。変更: src/management.js(+258行、`Engine.seasonReview` 新設+`applySeasonEnd`/`archiveFighter`拡張) + src/ui-render.js(+295/-79行、`_renderSeasonReview`等ヘルパー新設+offseason分岐差し替え) + src/index.html(+174行、`--sr-*`トークン+`.sr-`スコープCSS+フォントlink追記) + docs/ui/03-screens/season-retrospective.md(実装状況更新) + 本項。フェーズ3(ナレーション文面のOpus執筆+Keisukeレビュー)は次セッション以降。

## 直近の調整（2026-07-07 社長室ケア再設計 P4: 招聘過程イベント — アーク2実装完結）

docs/shachoshitsu-care-rework-spec-v0.1.md §3.4+§7(voice版・承認済)を実装(Sonnet エージェント、メイン側で diff レビュー)。①**新規 `src/coach-lines.js`**: コーチセリフの新しい住処。`COACH_VOICE_MAP`(35名→8 voice: sparta_roshi/sparta_tosho/theorist/artisan_bukotsu/artisan_seihitsu/mentor/bigheart_oyaji/bigheart_anego)+招聘イベント全セリフ(§7 一字一句)+選手卒業セリフ(アーキタイプ7種+並2本)+化ける演出。**index.html 読み込みと release/manifest.json 追記済み**(配布漏れ防止)。②**過程イベント4種+化ける** (`management.js tickInviteBuffs` 拡張): 中間報告=2週目50% / 衝突=相性✕のみ2週目20%(発火時は延長判定をスキップ、A続行=信頼-2〜-4でバフ維持・B打ち切り=返金なし+バフ即除去+雇用コーチ即復帰) / 延長打診=相性◎のみ2週目25%(受諾で+2週・費用=週給×2×1.5、済フラグで再判定なし) / 卒業レポート=満了時必ず(発令時スナップショット `statsAtStart` との差分で伸び幅算出、成果大=相性◎ or 伸び合計≥閾値🔧) / 化ける=相性◎+残余地10%+5%で trainCap 全stat+1。全判定 `Engine.rng.derive` シード固定(0x1CE1〜0x1CE5)でリプレイ安全。`resolveInviteConflict`/`resolveInviteExtension` は純粋関数。③**UI** (`app.js _drainInviteEvents` + `ui-common.js` モーダル4種): 週次ポップアップ drain 系統に接続、中間報告=1クリックトースト、衝突/延長=選択モーダル(資金不足はグレーアウト)、卒業=コーチ総評(voice別)+選手の一言(頭上吹き出し)+伸び幅表示、化ける時は金枠演出。モーダル連鎖で _mdlAClose を挟まない(a66c9d6 の教訓を全所で遵守)。旧セーブ互換(statsAtStart 不在は「記録なし」文言)。④**検証**: node --check 4ファイル + auto-sim 50×seed42 ALL CLEAR + 招聘ライフサイクル600回超の単体テスト(発火率実測: 中間~52%/衝突20.3%/延長~23%/化ける5.0%、打ち切り時のコーチ復帰・資金不足拒否も確認)。⑤**実機確認推奨**: (a) 招聘2週目の中間報告トースト、(b) 相性の悪い組み合わせでの衝突モーダルと A/B 両選択の挙動、(c) 相性の良い組み合わせでの延長打診(受諾で残り週数+2)、(d) 満了時の卒業レポート(コーチの口調がその人らしいか・選手の一言がアーキタイプ相応か)、(e) 化ける演出(低確率のため出れば儲けもの)。⑥**アーク2はこれで実装完結**(P1 ボーナス交渉化 / P2 休暇辞令v2 / P3 招聘コア / P4 過程イベント)。specs/ への確定仕様転記は実機確認が済んでから(docs/shachoshitsu-care-rework-spec-v0.1.md を specs/ へ昇格予定)。変更: src/coach-lines.js(新規 約150行) + src/management.js(+157行) + src/ui-common.js(+201行) + src/app.js(+54行) + src/index.html(1行) + release/manifest.json(1行) + 本項。

## 直近の調整（2026-07-07 社長室ケア再設計 P3: 外部コーチ招聘制コア）

docs/shachoshitsu-care-rework-spec-v0.1.md §3(§3.4 の過程イベントは P4 で別途)+§6 を実装(Sonnet エージェント、メイン側で diff レビュー)。①**コーチデータ拡張** (`data.js`): ALL_COACHES 全35名に `coachingType`(sparta/theorist/artisan/mentor/bigheart、§6.2 の確定割り付けどおり)+ `COACHING_TYPE_LABELS` + `COACHING_COMPAT_MATRIX`(§6.3)。`DECISION_DOCS.trainer` を「外部コーチ招聘状」に再定義(cost動的・枠2・常時可)。②**招聘エンジン** (`management.js`): 候補市場 `G.inviteMarket`(四半期=12週ごとにシード再抽選、未雇用コーチから2〜3名、直前招聘コーチは1回休み、minOrgPop ≤ orgPop でゲート)/ 招聘費 = 週給×4×1.5×(0.9〜1.1シードノイズ) / 効果倍率 = 格基礎(C1.25/B1.30/A1.35)+スタイル一致(+0.08/+0.05)+指導相性(±0.10)、**消化力逓減**(前回招聘終了から12週以内は超過分半減)。**`getCharCoach` の解決を「招聘中は招聘コーチを返す」に拡張**したことで、既存のコーチ能力配管(gMult/限界突破/延命術/弱点克服/ステ特化/怪我耐性ほか全部)が追加コードゼロで招聘コーチに切り替わる。二重指導なし(発令時に雇用コーチのアサインを外し prevCoachId 退避→終了週に枠が空いていれば自動復帰)。同時招聘1件ガード。信頼は旧トレーナー同様4週並走の遅延発現。旧 `_trainerBuff` 経路は camp 用に残置(旧セーブ完走)。③**UI** (`ui-common.js`/`app.js`/`ui-render.js`): 書類クリック→コーチ候補モーダル(格/指導タイプ/得意スタイル/能力/費用)→対象選手モーダル(スタイル一致のみ表示、**指導相性は事前に見せない**、12週以内は「詰め込み注意」)の2段フロー。選手詳細のコーチ欄は招聘中「コーチ: 招聘中」表示、週画面バッジにコーチ名 tooltip。④**検証**: node --check 5ファイル + auto-sim 50×seed42 / 60×seed7919 / 30×seed2024 全て ALL CLEAR ✓ + エンジンレベルのスモークテスト(市場ローテ/同時1件拒否/getCharCoach 解決/4週満了/逓減計算/退避復帰)。⑤**実機確認推奨**: (a) 社長室の招聘状→候補2〜3名→選手選択の2段フロー、(b) 招聘中の選手詳細でコーチ欄が「招聘中」になり雇用コーチから外れること、(c) 4週後に自動で雇用コーチへ戻ること、(d) 12週経つと候補の顔ぶれが替わること。⑥**残タスク**: P4(中間報告/衝突/延長打診/卒業レポート/化ける — セリフ草案は Keisuke レビュー中)。変更: src/data.js(約107行) + src/management.js(約207行) + src/ui-common.js(約186行) + src/app.js(11行) + src/ui-render.js(15行) + 本項。

## 直近の調整（2026-07-06 社長室ケア再設計 P1+P2: ボーナス交渉化 + 休暇辞令v2）

docs/shachoshitsu-care-rework-spec-v0.1.md(承認済)の §1・§2 を実装。エンジン部は Sonnet エージェント、UI・欠場配線・検証はメイン側で仕上げた(エージェントがセッション上限で2度停止したため)。①**P1 ボーナス交渉化** (`data.js` / `management.js` / `ui-common.js` / `app.js`): 50万固定を廃止し、対象選手選択→**起案4案**(基準額×0.5/1.0/2.0/3.0、50万〜100万単位丸め+±10%シード固定ノイズで式を隠蔽)→決裁の2段フロー。基準額 = max(週給×6, 査定額×25%)、`Engine.shachoshitsu.getBonusProposals` / `getBonusBaseAmount` / `calcBonusTrustDelta` 新設。効果は r=支給額÷基準額 の5帯(侮辱0 or プライド高↦-2〜-5 / 気持ち+2〜4 / 相場+8〜12 / 誠意+14〜18 / 破格+18〜22、表示値スケール。基礎値は×0.5 で既存 applyTrust パイプラインに整合)。**プライド高い判定 = personality:bold または archetype:ojousama**(既存不確実性マトリクスの「金では動じない」定義 bold 0.80 / ojousama 0.70 に根拠)。プライド高い選手は侮辱帯が r<0.8 に拡大(=最安案が地雷化)し、最安案の起案メモが警告文に差し替わる。逓減は効果半減→**再支給ごとに基準額×1.5 吊り上げ**(×1.5^回、6回でキャップ)に変更、CD 1→4週。侮辱帯は `bonus_insult` 専用リアクション(性格×アーキタイプ別、data.js)+トーンマーカー抑制。②**P2 休暇辞令v2**: スランプ限定→**常時可**、対象選択→**週数4案(1〜4週)**の2段フロー。費用 = 週給×週数+手配費50万(`getLeaveCost`)。効果は休暇期間中に週次発現: 体調+10/週、**消耗(wear)が2週目・4週目に-1(1回の休暇で最大-2、ゲーム初の wear 回復手段)**、信頼は発令時に基本(3+週数)×0.5×不確実性。スランプ/モチベ喪失中なら回復モーメンタム継承。CD 4→12週。③**休暇=欠場の配線**: `onLeave={weeksLeft,totalWeeks}` フィールド+**既存 forcedRest(S3休養願い)の除外経路に相乗り**——発令時に forcedRest 即セット、tickWeek の休暇ブランチで毎週張り直し(興行後クリアされるため)、休暇明けに両フラグ除去。これで編成候補・スワップ・おまかせ・内部挑戦・F08/F09・B3 の既存除外がすべて自動適用。加えて 社長室書類の発動条件/候補/宴席/合宿/追い込み一括/道場雰囲気演出/週画面(スケジュール無効化+行減光+「🏖️休暇 あとN週」バッジ) に onLeave 除外を追加。週数選択モーダルに確定文言**「※ 休暇中の試合には欠場します」**を明記(Keisuke 指定)。④**仕様からの逸脱1点**: 起案メモは spec の「ホバー表示」でなく**カード内常時表示**(A型モーダルにホバーUIの前例がなく、4案比較の判断材料を隠す理由がないため)。⑤**検証**: node --check 5ファイル通過、auto-sim 50シーズン×seed42 ALL CLEAR ✓(errors 0 / Game overs 0)。⑥**実機確認推奨**: (a) ボーナス書類で4案が出て金額が選手の格で変わること・開き直しても同額なこと、(b) trust<60 の熱血/お嬢様選手に最安案→警告メモ+信頼低下、(c) 休暇1〜4週で費用が週給連動すること、(d) 休暇中の選手が興行編成・おまかせに出ないこと、(e) 休暇明けに編成へ戻ること、(f) 週画面の休暇バッジと「休暇」アクション表示。⑦**残タスク**: P3(招聘制コア)+P4(招聘イベント) — spec §3 と §6(指導タイプ承認済)に基づき次セッションで実装(Sonnet 上限リセット後)。変更: src/data.js(書類定義2種+起案メモ定数+bonus_insult リアクション 約100行) + src/management.js(交渉ヘルパー4関数+execute 2ブランチ書き換え+休暇週次処理+除外4箇所 約210行) + src/ui-common.js(対象モーダル改修+第2ステップモーダル2種 約190行) + src/ui-render.js(週画面バッジ/無効化+除外2箇所 約15行) + src/app.js(executeDecision options+エラー3種+代表選出除外 約10行) + 本項。

## 直近の調整（2026-07-06 C-2 経営画面グラフ表示修正）

バックログ C-2(アーク1)。ユーザー報告「季節の表記を変えると、それが反映されていないグラフがいくつもある」を受けて経営画面(renderFinance)の全グラフを監査し、2系統の問題を修正。①**資金推移チャートが期間フィルタ(今月/年間/全期間)を無視**: `G.fundsHistory` を期間で絞らず常に全量描画していた。しかも fundsHistory はシーズン開幕でリセットされる今シーズン週次スナップショットのため、「今月」で今シーズン全部が出る／「年間」と「全期間」が同一表示になる、の二重の不整合。修正後: **今月=直近4週(週次)** / **年間=今シーズンの月末スナップショット** / **全期間=seasonHistory の各シーズン末 funds + 現在値(1年目でシーズン末データが無い間は年間表示に自動フォールバック)**。ラベルも「(直近N週)／(今シーズン Nヶ月)／(シーズン末値・N年分)」に描き分け。②**旧「S5」表記の残存(正式表記は「N年目 M月 第X週」のカレンダー式)**: 団体人気推移グラフの X軸「S5」→「5年」・ホバー「S5: 72」→「5年目: 72」、選手詳細の成長ログ区切り「S3 末」→「3年目 末」(直後の行が「シーズン3終了」なのに区切りだけ S 表記で混在していた)。③**ついで**: orgpop タブ凡例の内部変数名露出「各シーズン末のorgPop」→「各シーズン末の団体人気」(プレイヤー向け表記ルール準拠)。④**触らないもの**: 収入/支出/給与タブのグラフ(既に `_getFilteredFinance` で期間追従済み)、新聞3面/年代記/殿堂などの「S3 W12」バッジ表記(紙面デザインの一部。全域の表記統一は C-4 ヘルプ・表記オーバーホールで別途判断)。⑤**検証**: node --check 通過。UI のみで試合数値・判定に影響なし(auto-sim 不要)。⑥**実機確認推奨**: (a) 経営画面 総合タブで 今月/年間/全期間 を切り替えて資金推移グラフの形とラベルが3様に変わること(2年目以降のセーブで全期間がシーズン末値の折れ線になること)、(b) 団体人気タブの軸ラベルが「5年」表記・ホバーが「5年目: XX」になること、(c) 選手詳細→成長経過タブのシーズン区切りが「3年目 末」になること。変更: src/ui-render.js(資金推移チャート期間分岐 約12行 + orgPopChart 2箇所 + 凡例1箇所 + 成長ログ1箇所) + docs/game-system-roadmap.md(本項)。

## 直近の調整（2026-07-05 battle-engine-main.js 重複定義の死にコード除去）

カウンター技名修正時（同日 B-1 の項 ⑤備考）に発見した `src/battle-engine-main.js` 末尾の重複関数定義を整理。①**除去対象**: `_narrationHtml`/`_narrateFrame`/`_updateCenter` の3関数が末尾付近に二重定義され（`_updateCenter` はファイル中盤にも旧版があり三重）、JS の後勝ちルールで最後の定義のみ有効・手前は全て死にコードだった。うち末尾側の1組（旧1414〜1462行）は日本語文字列が Shift_JIS 誤変換で文字化けした残骸。②**残した定義**: 最後の有効版（counterMove 帰属修正済み・ナレーションボックス更新入り）のみ。中盤の旧 `_updateCenter`（ナレーション呼び出しなし版）も削除し、機能は最終版に包含されていることを確認。計64行削減（1519→1455行）。③**挙動変化なし**: 削除したのは元々実行されていなかったコードのみ。エンジン・試合数値に無関係のため auto-sim 不要、node --check 通過 + 各関数の定義が1箇所ずつであることを grep で確認済み。変更: src/battle-engine-main.js（-64行）+ 本項。

## 直近の調整（2026-07-05 C-1 派閥イベントの新聞掲載）

バックログ C-1(アーク1)を実装。既存の業界ニュースキュー(`Engine.industryNews.push` → 1面 業界ニュース欄)に未配線だった派閥イベント13種を配線した。①**設計原則**: 「外から見える出来事」だけ記事化(慰留成功・告げ口などの未遂、社長の内々の決裁は載せない = 新聞は世間の視点)。②**Tier A 大ネタ(9種・発生したら必ず紙面候補)**: `factionCoup:118` 下剋上成立(`factions.js applyInternalChallengeResult` 禅譲ブランチ、エンジン内フック) / `factionWarSettled:115` F09 対抗戦決着(`app.js` sweep 決着ブロック、勝敗スコア付き) / `factionEndless:112` 無限抗争 / `factionDefection:105` F04 寝返り成立(A択のみ) / `factionShowdown:95` F08 リーダー直接対決決定(A択) / `factionSuccession:87` F03 後継就任(succession/turmoil 両方) / `factionPeace:84` 沈静化 / `factionReconcile:82` F06 和解(A択) / `factionHiatus:78` F05H 活動休止。③**Tier B 日常ネタ(4種・閑散週の埋め草)**: `factionInternalBout:58` Common-1 同門対決(A択) / `factionMediaFeature:52` Common-5 取材(A択) / `factionJointProject:50` Common-7 合同企画(A択) / `factionCamp:48` Common-4 合宿。低 priority に置くことで既存の「priority ソート+サブ記事3枠」が大ニュース週は自動で弾き、静かな週だけ紙面に上げる——新規制御ロジックなし。④**テンプレ**: `data.js NEWS_HEADLINE_TEMPLATES` に黒田トーンで計18本(大ネタ 1〜2本/種)。ついでに `factionFormed` 旧表記「{leaderName}組が動き出した」を「{leaderName}が旗を掲げた」に修正(5/3 派閥名「○○派」改名の追従漏れ)。⑤**検証**: node --check 4ファイル通過 + auto-sim 50シーズン × seed 42 ALL CLEAR ✓(violations 0 / errors 0)。⑥**実機確認推奨**: (a) 派閥イベント(F03後継・F04寝返りA・F08直接対決A など)を踏んだ週の新聞1面 業界ニュース欄に記事が出ること、(b) 大ニュースのある週に合宿・取材などの小ネタが紙面から落ちること、(c) 派閥成立記事に「○○組」表記が出ないこと。変更: src/management.js(PRIORITY 13種追加) + src/data.js(テンプレ 13 type 追加 + factionFormed 1箇所修正) + src/app.js(handleFactionEvent 10箇所 + F09 決着ブロック 1箇所) + src/factions.js(applyInternalChallengeResult 1箇所) + specs/newspaper-and-orgcompare-spec-v2.0.md(type 一覧+フックポイント更新) + 本項。

## 直近の調整（2026-07-05 カウンター技名の帰属バグ修正 + 要望バックログ登録）

ユーザー要望リスト（バグ1件 + 変更希望6件 + 要設計相談2件 + 中量〜大型7件）を「次の実装予定 > ユーザー要望バックログ」として一括登録し、最優先の B-1 を即修正。**B-1: シングルマッチのカウンターで、返した側が「相手の返された技」を使ったことになる表示バグ。** ①**原因**: シングルのカウンターフレームは `move`=返された元の技 / `counterMove`=反撃技 という構造だが、ナレーションボックスの `_narrateFrame` カウンター分岐 (`src/battle-engine-main.js`) が `action.move` を使っており、「○○がカウンター！ 〈相手の技〉 → ××にダメージ」と表示されていた（技名カットイン `_updateCenter` と2段矢印 `_spawnAttackArrow` は `counterMove` を正しく使用済みで無事）。`counterMove || move` に修正。②**同族バグ2件も併修**: (a) クリティカル時のビッグムーブスプラッシュ `_showBigMoveSplash(action.move)` がカウンター時に元の技名を出していた → counter 時は `counterMove` を使用。(b) タッグのカウンター2段矢印は段階1（元の攻撃）のラベルに反撃技名を出していた（タッグフレームは `move`=反撃技で元技名を未記録） → エンジン側タッグカウンターフレームに `origMove`（返された元の技）を追加し (`src/match-engine.js`)、段階1矢印で `origMove || '攻撃'` を使用 (`src/tag-battle-main.js`)。③**エンジンの試合ロジックは無変更**（フレームへのフィールド追加のみ、RNG消費なし）。auto-sim 20シーズン × seed 42 で violations 0 / errors 0 ALL CLEAR ✓ + 3ファイル node --check 通過。④**実機確認推奨**: (a) シングル試合でカウンター発生時、ナレーションの技名が反撃側の技になっていること、(b) カウンターがクリティカル（dmg≥15）のときのスプラッシュ技名、(c) タッグ試合のカウンター2段矢印で段階1=元の技/段階2=反撃技と出ること。⑤**備考**: `battle-engine-main.js` 末尾に `_narrateFrame`/`_updateCenter`/`_narrationHtml` の重複定義（うち1組は文字化けした死にコード）が残存しており、有効なのは最後の定義。今回は有効な定義のみ修正、重複除去は別タスク。変更: src/battle-engine-main.js(2箇所) + src/match-engine.js(タッグカウンターフレームに origMove 1フィールド) + src/tag-battle-main.js(段階1矢印ラベル 1行) + docs/game-system-roadmap.md(本項 + バックログ登録)。

## 直近の調整（2026-05-13 バトル演出 4 バグ修正）

プレイヤー報告の試合中4バグを一括修正。①**MISS でダメージが入る誤認**: engine 側 `pushFrame` (シングル/タッグ共) に「MISS フレームで HP が前フレームから減っていたら `[WM Debug]` 警告」を追加。viewer 側 `_renderActionImpact` 冒頭に `action.kind === 'miss'` の早期 return ガードを追加（`src/battle-engine-main.js`, `src/tag-battle-main.js`）。多層防御で上流が壊れても damage pop/shake が出ない。auto-sim 50 シーズンで違反 0 を確認。②**ターン12 フェーズ導入カットインで進行不能**: `dismissCutin` を「DOM 異常時もフラグだけは必ず落とす」設計に変更。`S._phaseIntroSafetyTimer` (8秒) で自動 dismiss するセーフティを追加。フェーズ導入時は `nBtn`（次へボタン）にも一時的に `dismissCutin` をバインドし、解除後 `_bindNextButton()` で通常導線へ戻す（`src/battle-engine-main.js`）。③**「…」finishClick ラベルが結末をネタバレ**: 「スリーカウント…！？／カウント…！？／ギブアップ…！？／レフェリー…！？」を全て「**…！？**」に統一（singles/tag 両方）。クリック前にピン/サブ/TKO のいずれか分からない。④**ニアフォール／カットイン／キックアウト等のログがピンシーケンスより先に表示される**: 既存 `S.heldWinLogs`（★決着行のみ保留）を `_SPOILER_LINE_RE` 正規表現で拡張。「カウント2で返した／振りほどいた／キックアウト／ロープエスケープ／カットイン／見殺し／丸め込み／タップ／なんとか阻止／返した」をピン seq フレームで一律 hold し、`_finishPinSeq` で seq 完了後にまとめて DOM 追記。singles/tag 両方適用。⑤**検証**: auto-sim 50 シーズン Result: ALL CLEAR ✓ / Total violations: 0。UI 検証はユーザーに委任（preview_eval は app.js クロージャに届かないため）。確認してほしい項目: (a) シングル試合で MISS 時にダメージ数字が出ないこと、(b) ターン12-13 フェーズ境界でカットインが出ても次へボタンで進めること（8秒経つと自動解除も）、(c) finishClick ボタンに結末示唆文が出ないこと、(d) カウント2/ロープエスケープ/TKO ログがピンシーケンス完了後にまとめて出ること、(e) タッグ試合のカットイン/見殺し/丸め込みのログ遅延。変更: `src/match-engine.js`（pushFrame ガード 約 18 行）+ `src/battle-engine-main.js`（spoiler regex + dismissCutin 改修 + phaseIntro セーフティ + 5箇所のラベル変更 + renderActionImpact ガード 約 30 行）+ `src/tag-battle-main.js`（spoiler regex + FINISH_LABELS 統一 + renderActionImpact ガード 約 15 行）+ 本項。

## 直近の調整（2026-05-09 引退試合後の進行不具合 復旧パス追加）

製品版 1.09 でユーザー報告「選手の引退試合後に『今週』タブが空、『興行準備』タブも『興行週ではありません』で操作不能、翌週へ進めない」を受けて、引退試合処理の例外で `weekPhase='showExec'` のまま停止する経路に対して四段の防衛策を追加。①**`finalizeShow` try/catch 全面ラップ** (`src/app.js`): 本体を `_finalizeShowImpl` に切り出し、`finalizeShow` 側で try/catch。例外時 `weekPhase==='showExec'` なら `manage` に戻して overlay 撤去・トースト・autoSave・showScreen('week') で復旧。ラストラン引退処理 (chronicle archive / freezeRelationships / validateChampion / applyDepartureTrustImpact) のいずれかが投げても自動復帰。②**`closeShowResult` catch 内の自己復旧**: catch 突入時に `weekPhase==='showExec'` のままなら `Engine.tickWeek(G)` を再試行し、'settled'/'weekSummary' へ進める。tickWeek 自体が失敗する場合は `weekPhase='manage' + lastShowResults=[] + weeklyFinance` で最終退避。③**`renderWeekScreen` 防御フォールバック** (`src/ui-render.js`): `html` が空のまま末尾まで来た場合に「⚠️ 進行不具合が発生しました — 🔧 状態を復元して今週へ」リカバリ UI を表示。④**ロード時の過渡 phase 退避** (`src/app.js` `Storage.load` / `loadAutoSave` / ファイルインポートの 3 経路): 既存の `showPrep → manage` に `showExec → manage` を併記。万一過渡状態のセーブが残っていても無限ロックを回避。⑤**触らない領域**: 引退処理本体・popupActions チェーン・tickWeek の正常パスは無変更。例外が出ない限り従来挙動と完全一致。⑥**検証**: auto-sim 不要（例外復旧パスと防御 UI のみで試合数値・判定に影響なし）。実機確認推奨: (a) 通常興行→翌週遷移が変わらないこと、(b) 引退試合を含む興行後にもタブが空にならないこと、(c) 既存セーブのロードが従来通り動くこと。変更: src/app.js(finalizeShow 分割 + catch + load 経路 3 箇所 約 35 行) + src/ui-render.js(renderWeekScreen 末尾フォールバック 約 12 行) + docs/game-system-roadmap.md(本項)。

## 直近の調整（2026-05-05 ランキング実績軸 新人賞・メディア厚労賞 配線）

ユーザ指摘「ランキング画面の実績ポイントが PPV/年末MVP/ベストマッチ/JT 優勝しか加点されておらず、新人賞・メディア厚労賞も乗るべき」を受けて、表彰式で既に選定されているのに加点未配線だった 2 賞を `Engine.achievement.add` 経由で実績軸に乗せた。①**配点追加** (`src/data.js:ACHIEVEMENT_CONFIG.pt`): `rookie: 5`(新人賞・bestMatch と同格)、`mediaAward: 4`(メディア厚労賞・露出貢献勲章)。既存 PPV15/MVP10/JT8/bestMatch5 との序列を保つ位置取り。②**`selectRookie`/`selectMediaAward` 返り値に `orgId` 追加** (`src/management.js:16175+ / 16406+`): 既存実装は `orgName`/`isPlayerOrg` のみ返却していたため `Engine.achievement.add` から所属団体が引けなかった。各 1 行追加で解決。③**加点配線** (`src/management.js` offWeek1 表彰式パイプライン JT 加点直後): `pendingAwards.rookieOfYear` / `pendingAwards.mediaAward` の `orgId` 存在チェックで `Engine.achievement.add` を呼出。id は `rookie_${season}` / `media_${season}` で重複ガードと整合。④**ツールチップ空状態** (`src/ui-render.js:3861`): 「PPV優勝/MVP/ベストマッチ賞/ジュニアトーナメント優勝」の例示に「新人賞/メディア厚労賞」を追記。実装本体はラベル分岐ではなく `it.label` 直接表示なので追加分岐は不要。⑤**スコープ外(ユーザ確認済)**: 団体対抗戦/挑戦状 3vs3 → 既に `battlePoints` 軸で評価済みのため実績軸への二重加点なし、敢闘賞・技能賞 → メディア厚労賞 1 本に集約、統一トーナメント・最大動員 → 本体未実装で据え置き。⑥**仕様書更新** (`specs/org-ranking-spec-v2.0.md`): 配点表に新 2 行追加 + 6 章 ACHIEVEMENT_CONFIG ブロック追従。⑦**検証**: auto-sim 100 シーズン × seed 12345 で violations 0 / errors 0 / weeks 5300 ALL CLEAR ✓。⑧**実機確認推奨**: シーズン末まで進めてランキング画面の実績ツールチップに **新人賞 +5** / **メディア厚労賞 +4** が出ること、既存 PPV/MVP/JT/bestMatch も併存すること、翌シーズン開幕で age=1 のまま満額維持・age=2 で半減することを確認。変更: src/data.js(ACHIEVEMENT_CONFIG.pt 2 キー追加) + src/management.js(selectRookie/selectMediaAward に orgId 追加 + 表彰式 add 呼出 2 ブロック 約 18 行) + src/ui-render.js(空状態文言 1 行) + specs/org-ranking-spec-v2.0.md(配点表 2 行追加 + ACHIEVEMENT_CONFIG ブロック更新) + docs/game-system-roadmap.md(本項)。

## 直近の調整（2026-05-05 シーズン中引退ポップアップ 診断補強）

ユーザー報告「シーズン中の引退ポップアップが出なくなっているかもしれない」(再現セーブなし)を受け、3 経路あるシーズン中引退ポップアップの取りこぼし防止を強化。①**モチベ喪失引退に第2層フォールバック追加** (src/app.js): 怪我引退/ラストラン引退には既に retiredFighters の最新 retire イベントから復元する fallback があるが、モチベ喪失引退ルート (`_pendingMotivationRetirements`) には fallback が無く、transient フィールドが何らかの事情で消えると本人ポップアップがゼロになる構造だった。同シーズン+`reason='motivation'` の retire イベントを走査して `_recoveredFighter` 経由でセリフ生成・showRetirementPopups だけ走らせる救済を追加。②**3 経路の診断ログを揃える**: 既存のラストラン (`[WM][lastrun-diag]`) と同形で、怪我引退エントリ (`[WM][injury-retire-diag]`) とモチベ喪失引退エントリ + 発火直前 (`[WM][motiv-retire-diag]`) にも console.warn を追加。次回再発時にエンジン側で積まれていないのか・受け取り側で消えたのか・popup が enqueue されたのに UI が描画しないのかを切り分けられるようにする。③**`_renderRetirementPopup` 診断** (src/ui-common.js): 描画関数の冒頭で `queueLen` を console.warn し、空キューで即 done に流れるケースを把握。④**触らない領域**: popupActions チェーン構造、_enqueuePopup/_drainPopupQueue、エンジン側の pending フィールド生成ロジック、ラストラン引退の既存 3 段 fallback (74bf69d で修正済み) は無変更。⑤**検証**: ログ追加 + 異常時のみ発火する fallback で通常プレイの挙動は不変、auto-sim はスキップ (UI/演出のみで試合数値・判定に影響しないため)。変更: src/app.js(モチベ喪失引退フォールバック + 3 種診断ログ 約 50 行) + src/ui-common.js(_renderRetirementPopup 診断ログ 3 行) + docs/game-system-roadmap.md(本項)。

## 直近の調整（2026-05-04 年代記 駆け出し章アンカー + era-OVR 補間）

**Phase A 直後の追加修正 2 件 (ユーザー実機検証で発覚)。** ①**駆け出し章アンカー**: `_segmentChapters` の局所最大検出を半径 3 → **半径 1 + near-tie 0.05** に緩めた上で、currentSeason ≥ 2 のとき S1-3 (currentSeason に応じて短縮) を覆う章が無ければ専用「駆け出し章」を `focusSeason=2 / halfWidth=1 / window=[1,3] / _fledgling=true` で先頭に挿入。後年の高密度ピーク (例: s20 で weighted=2.5) に抑えられて旗揚げ世代の章が消える挙動を解消。②**era-OVR 線形補間**: 各シーズンの実 OVR は記録されていないため、`_estimatedOVRAt(fighter, focusSeason)` でデビューシーズン (rookie OVR ≈ peakOVR-22, 下限 60) → peakOVRSeason (= peakOVR) を直線補間して近似。`_baseScore(f, chapter)` は chapter コンテキストがある場合この era-OVR を使い、無い場合 (= `_heroDensity` の境界決定用途) は lifetime peakOVR で密度を作る。これにより rising 候補が「未来のピーク」で評価されなくなり、CH.1 駆け出し章の ace が「その時代相応の OVR」で点数化される (例: peakOVR=95 が S7 到達予定でも S2 時点では推定 OVR ≈ 78 で評価)。③**修正前の挙動**: 局所最大半径 3 で隣接ピーク同士が互いを抑え合い、「ピークが密集する時代でも章が 1 個」になってしまう / 駆け出しが消えると「年代記を再構築したら消えた」とユーザー報告。修正後 20 シーズンで章数 7 → 9 (CH.1=駆け出し追加 + 中後期も適切に分散)、6 シーズンで 1 → 2 (CH.1=[1,3] 駆け出し + CH.2=[3,7] 第二期)。④**検証**: auto-sim 100 シーズン × seed 42 で violations 0 / errors 0 / weeks 5300 ALL CLEAR ✓。⑤**残課題**: 駆け出し章の peer 候補が少ないケースあり (S1-3 に prime が掛かる候補が rising/cameo しか居ない) — Phase B で peer 選定を stage 別 4 枠化するときに `cameo` 枠で吸収予定。⑥**実機確認推奨**: (1) 既存セーブで CH.1 が `focus=2 [1,3]` で立つか、(2) CH.1 の ace が `aceAsRising` で表示されるか、(3) 後年章 (例: 中盤・後半) でも複数章が並んで重複窓を持つか、(4) 同一選手が CH.1 (rising) → CH.3 (prime) のように出現するケースが発生するか。変更: src/management.js(`_estimatedOVRAt` 新設 + `_baseScore` シグネチャ拡張 + `_aceScore` で era-OVR 経由に切替 + `_segmentChapters` に LOCAL_RADIUS=1/NEAR_TIE=0.05/駆け出し章先頭挿入 約 30 行) + docs/game-system-roadmap.md(本項) + docs/chronicle-chapter-overlap-spec-v0.1.md(駆け出し章 + era-OVR 補間メモ追記)。

## 直近の調整（2026-05-04 年代記 章重複リデザイン Phase A）

**`docs/chronicle-chapter-overlap-spec-v0.1.md` Phase A (A-1〜A-8) 実装。** 章境界を「focusSeason ± halfWidth=3 の重複可能な視点窓」に作り変え、英雄値を「素地 50% + 章内実績 50%」の `_aceScore(fighter, chapter, state)` に再定義した第一段階。①**`Engine.chronicle.ACE_ACH_WEIGHTS` 新設**: 戴冠 0.05 / 防衛 0.06 / PPV メイン 0.15 / ドーム 0.12 / war 勝 0.07 / war 敗 0.02 / 挑戦撃退 0.06 / 挑戦発信 0.05 / MVP 0.12 / ベストマッチ 0.04 / JT 優勝 0.08 / 章末王者 +0.10。②**素地スコア再正規化**: peakOVR/110*0.6 + peakPop/100*0.4 を 0〜1 にクランプ。`_baseScore` / `_heroDensity`(境界決定用) を新設。旧 `_heroScore` は後方互換のため残存(現状未参照)。③**実績集計 `_achievementRaw`**: history を章窓 `[seasonStart, seasonEnd]` で filter し、種別ごとに重み合算。防衛は既存 `_countChapterDefensesForAce` のレイン単位 max 合算ロジックを流用。章末時点で在位中ベルトがあれば +0.10。`challenge_request_match` は `isRequester` フィールドで defender 撃退/自団体発信を判定。④**`_aceScore = base*0.5 + clamp(raw/1.5)*0.5`** (両 0〜1)。⑤**`_classifyCareerStage`**: focus < primeStart → rising / focus > primeEnd → veteran / それ以外 prime。`aceAsRising` は `_selectAceAndPeers` 内で派生決定。⑥**`_segmentChapters` 全面書き換え**: 旧 cursor+bestEnd 非重複切り出しを廃止。各 season の `weighted[s] = Σ _heroDensity(c)` (peakOVRSeason==s) を計算し、前後 HALF=3 シーズン以内に自分より大きい値が無い局所最大を `focusSeason` に採用。窓は `[max(1,f-3), min(currentSeason,f+3)]`。章数上限なし、序章との重複も許容。⑦**`_selectAceAndPeers` 改修**: 各候補に `_stage`/`_ace` 付与、prime 候補ソートで上位 1 名 ace、差 ≤ 0.20 かつ prime 重複 ≥ 3 で二枚看板 (旧閾値 0.04 から緩和)。prime 候補が皆無なら rising 最上位を `_stage='aceAsRising'` で ace 昇格。peer 選定は Phase A スコープ外で現行ロジック流用 (英雄値上位 3 + idol 1)、ただし stage タグだけは付与。⑧**`buildChapters` 拡張**: chapter id を `ch_focus${focusSeason}_${seasonStart}_${seasonEnd}` に変更 (近接 focus でも一意)、シリアライズに `focusSeason`/`halfWidth`/各 ace の `stage`/`aceScore`/各 peer の `stage`/`aceScore` を追加、cache 互換チェックで focusSeason 未定義キャッシュは強制リビルド。⑨**3 章上限 post-process**: chapters 確定後に同一選手を集計し、4 章以上に登場する選手の peer 枠だけを `aceScore` 下位 4 章目以降から除去 (ace 枠は安全側で不変、伝説級が ace で 4 章登場するケースはそのまま)。⑩**触らないもの**: `_buildAceNarrative` / `_buildPeerNarrative` / `QUOTE_TEMPLATES` / `_classifyAceQuoteCategory` / UI 章ヘッダ表示 (Phase B〜D で対応)。`specs/chronicle-system-spec-v0.1.md` 更新も Phase A 単独では行わず、Phase B〜D 完了後にまとめる方針。⑪**検証**: auto-sim 100 シーズン × seed 42 で violations 0 / errors 0 ALL CLEAR ✓。⑫**実機確認推奨**: (1) 既存セーブを開いて年代記タブの章数が増えているか (旧 N=2-3 → 新 N=4-7 程度)、(2) 章ヘッダの期間表示で章間に重複があるか、(3) 1 選手が CH.1 (rising) と CH.2 (prime) に両方登場するケースが出るか、(4) prime 候補が皆無な序盤章で aceAsRising 昇格が動くか、(5) 章詳細の narrative が現行のままレンダリングされるか (Phase B 以降で stage 別テンプレ化予定)。⑬**残タスク**: Phase B (peer 枠 stage 別再設計: 実力副官/若手ホープ/看板スター/ベテラン)、Phase C (記者の目 3 段構成テンプレ)、Phase D (UI 重複バンド + stage チップ)。変更: src/management.js(`_baseScore`/`_heroDensity`/`_achievementRaw`/`_achievementScore`/`_aceScore`/`_classifyCareerStage`/`ACE_ACH_WEIGHTS` 新設 約 130 行 + `_segmentChapters` 全面書き換え 約 30 行 + `_selectAceAndPeers` 全面書き換え 約 60 行 + `buildChapters` シリアライズ拡張・cache 互換・3 章上限 post-process 約 35 行) + docs/game-system-roadmap.md(本項) + docs/chronicle-chapter-overlap-spec-v0.1.md(Phase A チェックリスト埋め)。

## 直近の調整（2026-05-04 派閥イベント bond/rivalry 連動 v1.0）

**派閥イベント(F03/F04/F05/F07)の選択結果が、関わる選手間の bond/rivalry に痕跡を残すようにした + 派閥の壁モーダルの UI 修正(rebuke→注意累積 表記 + 結果文重複除去)。** ユーザー指摘「派閥系イベントで trust は動くけど、選手間の温度(bond/rivalry)も動かないと派閥が h2h ネットワークから切り離される」を起点に、F01〜F08 の選択結果を全数監査して bond/rivalry 連動の穴を埋めた。①**設計原則**: (a) 2 者が特定できるイベントだけ動かす(派閥対全体は trust、派閥対派閥は hostility に任せる)、(b) スケールは試合 1 回の 1/3〜1/2 = bond ±2〜4 / rivalry ±3〜8、(c) 同一イベントで bond と rivalry を両軸動かさない、(d) 動かさないイベント: F02 全般 / F05 据え置き / F07 リーダー単独系 6 種(DEMAND_MAIN/MONEY/RECOGNITION + OBSERVE_ABSENCE/FAN_PRESSURE + INCIDENT_HEEL_PROVOKE)。②**新ヘルパー**: `_applyAxisBetweenGroups(state, groupAIds, groupBIds, axis, delta, sampleSize=4)` を `factions.js` に追加。2 グループ間の bond|rivalry を両方向で動かし、各グループ最大 4 名サンプルでノイズ抑制。③**F07 6 incidentType に bond/rivalry 注入**: INCIDENT_BOUNDARY / OBSERVE_RIVAL_HEAT / OBSERVE_INTERNAL_RANK / OBSERVE_TRAINING_HARD / INCIDENT_BONDING / DEMAND_ABSTRACT。各 choice ごとに方向(注意=rivalry微減、黙認=rivalry微増、個別ケア=bond微増 等) とレンジを spec 表で確定。④**F04 寝返り誘い**: A 寝返らせる→対象→旧リーダー rivalry +5〜+8 / 残留→対象 bond -3〜-5 / 対象→敵対派閥リーダー bond +2〜+4、B 慰留→対象→旧リーダー bond +1〜+3、C 告げ口→旧リーダー→対象 rivalry +3〜+5(失望) を新規追加(既存 C の対象→旧リーダー rivalry +10〜+15 は維持)。⑤**F05 自然分裂**: 離脱組⇄残留組 bond -2〜-4(両方向、各最大 4 名サンプル) + 首謀者→旧リーダー rivalry +3〜+5 を新規追加。⑥**F03 はスキップ**: 既存実装に `_applyBondDirected`/`_applyBondBetweenMembers` が既に組み込まれており、succession (後継→旧リーダー bond +3〜+5) / turmoil (メンバー間 bond -5〜-10、後継→旧リーダー bond +10〜+15「残像の美化」) で十分カバー済み。⑦**impactSummary 表記統一**: プレイヤー向け文言には内部変数名 bond/rivalry を出さず **絆 / 因縁** で統一。⑧**派閥の壁 UI バグ修正**: (a) `ui-common.js` の F07 ヒント文 10 箇所「rebuke カウント進行」→「注意累積 +1」(プレイヤーに英単語を見せない)、(b) `factions.js:4065` INCIDENT_BOUNDARY A の resultText から `${tName}の表情がわずかに緩んだ。` を削除(直後に `data.js:2857` の resultTarget セリフ「{targetName}の表情が、わずかに緩んだ。」が出るため重複していた)。⑨**検証**: auto-sim 50 シーズン × seed 1, 2 で実施 → 両シードとも違反 0 件 / errors 0 / weeks 2650 ALL CLEAR ✓、orgPop/funds 推移にも異常傾向なし、関係性フラグ(F-1〜F-7)頻度に変化なし。⑩**仕様書化**: `specs/faction-bond-rivalry-spec-v1.0.md` 新設(設計原則 + イベント別レンジ表 + impactSummary 表記 + 既知の限界)、CLAUDE.md specs/ 索引に追記。⑪**実機確認推奨**: (1) 派閥の壁モーダル A/B のヒント文が日本語、(2) A「注意する」結果画面で「表情が緩んだ」が 1 回のみ、(3) F04/F05/F07 イベント発火後に相関図 v2 で当事者ペアの 絆/因縁 が動いているか。⑫**残課題(任意)**: 大集団ペアサンプリングを roster 順から OVR ベース or ランダム抽選に変える / F03 turmoil の bond+ ロジック(残像の美化)が下克上の感情として正しいか別途デザイン議論。変更: src/factions.js(_applyAxisBetweenGroups ヘルパー新設 + F07 6 incidentType 拡張 + F04 A/B/C 拡張 + F05 自然分裂拡張 約 100 行) + src/ui-common.js(rebuke→注意累積 10 箇所) + docs/faction-bond-rivalry-rebalance-spec-v0.1.md(設計起案 DRAFT) + specs/faction-bond-rivalry-spec-v1.0.md(確定仕様) + CLAUDE.md(specs 索引追記) + docs/game-system-roadmap.md(本項)。

## 直近の調整（2026-05-04 B3 挑戦状）

**B3 挑戦状の RNG シードに代表選手 ID を混合 + 試合結果に影響しない `condition: 80` 上書きを除去 + 勝率実測。** ユーザー報告「OVR91 の挑戦者に対し OVR100 級の選手を出しても勝てない、シミュレーション外で勝敗が事前確定するロジックが入っていないか調査してほしい」を起点に B3 試合パスを全面監査。①**結論: 事前確定ロジックは存在しない**（[src/app.js:9749](src/app.js:9749) は通常通り `Engine.battle.simulateMatch` を呼ぶだけ、勝敗を上書きする分岐は無い、`selectedFighterId` は [src/management.js:18837](src/management.js:18837) → [src/app.js:9710](src/app.js:9710) を経由して `pf` に正しく反映される）。②**勝率実測** (`test/b3-winrate-probe.js` 新設): matchTier=2 で OVR99 vs OVR91 を 500 試合 → **69.0% 勝率**、OVR95 vs OVR91 で 56.8%、OVR91 vs OVR91 で 46.8%。**構造的バイアスは無く OVR 差通り**。「絶対に勝てない」は本来統計的に起こり得ない（OVR99 で 5 連敗の確率は 0.31^5 ≈ 0.3%）。③**真因: シード固定 + 同じ stats 近傍で展開がコピーされる**。旧コードは `(G.rngSeed, G.season, G.week, 0xB1B4)` の 4 引数派生で、同じ週内では RNG 列が完全固定。代表選手を変えても stats が近接（pw99/sp99/te99/st99/mn99 と pw98/sp98/te98/st98/mn98 等）だと、damage/hit/counter の roll がほぼ同じ閾値を踏み、展開と結末が酷似してしまう。実測: 同一シードで OVR99 を 50 人分（id だけ変えて stats 同一）試すと **50/50 で左勝ち**（決定論的）。④**`condition: 80` 上書きは死コード**: `match-engine.js` と `battle-engine.html` を `condition` で grep してもヒット 0 件、試合エンジンは condition を計算に使っていない。app.js:9749 の `{ ...pf, condition: 80 }` は過去の名残で結果に影響しないが、コードリーディング時に「コンディションが効いている錯覚」を与えるため除去。⑤**シード派生に代表選手 ID を混合** (`src/app.js:9748, 9790`): `Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4)` を `derive(..., 0xB1B4, pf.id)` に変更（`b3WatchMatch` と `b3SkipMatch` の両方）。`Engine.rng.derive(baseSeed, ...keys)` は可変長対応 ([management.js:57](src/management.js:57))。同じ選手で再観戦しても結果不変（=ズル防止）は維持しつつ、別の代表を選んだとき乱数列も変わるので「選択の重み」が結果に出る。実測: 修正後 OVR99 vs OVR91 を 50 試合（fighter.id を変えながら）→ 左勝ち 33/50 (66%)、期待値 69% と整合。⑥**触らないもの**: `Engine.battle.simulateMatch` のロジック、挑戦者 OVR 上限ガード（specs/challenge-request-spec-v0.1.md は触らず）、prevResult.selectedFighterId のフロー。⑦**実機確認推奨**: 修正後セーブで挑戦状を受け、代表 A/B/C で結果が変わることを目視。⑧**残課題（任意）**: 挑戦者 OVR と自団体トップ OVR の差を制限する spec 改訂は別議論。変更: src/app.js(b3WatchMatch + b3SkipMatch シード派生に pf.id 混合 + `{ ...pf, condition: 80 }` × 4 箇所除去 約 6 行) + test/b3-winrate-probe.js(新設・勝率検証スクリプト 約 70 行) + docs/game-system-roadmap.md(本項)。

## 直近の調整（2026-05-03 派閥名表記変更）

**派閥名 `${leader.name}組` → `${leader.surname}派` に変更 + 相関図 v2 に孤児派閥フィルタ追加。** ユーザー指摘「派閥名がフルネーム+組で重い、リーダー離団直後に派閥リストには出ないのに相関図には残る」を解消。①**苗字データ追加** (`src/data.js`): `ALL_CHARS` 全127エントリに `surname` フィールドを追記（漢字・かな・カナ混在のため自動分割不可、手動マッピング1件1件、外人勢=シュタインフェルト/モーガン、リングネーム=毒島）。②**苗字解決ヘルパ汎用化** (`src/management.js`): 既存 `Engine.chronicle._getSurname()` を `(name)→(arg)` シグネチャに変更し、object 渡しなら `arg.surname` 優先、文字列 fallback で従来の whitespace 分割を残す。これで年代記ナラティブの `{surname}` テンプレも初めて実機能化。③**派閥名生成テンプレ置換** (`src/factions.js`): createFaction 初期作成 / handleLeaderLoss 後継 / F03 succession / F05 自然分裂 / F08 内部挑戦戦勝者更新 / 4634挑戦由来継承 の計12箇所で `${...name}組` → `${... .surname || ... .name}派`、F01 applyChoice では payload.leaderName しか手元にないため state.roster 経由で leader を引き直し `leaderSurname` ローカルに束ねる。④**旧セーブマイグレーション** (`src/factions.js:reconcileRoster`): 冒頭に「`/組$/` で終わる faction.name を現リーダーから `${surname}派` に再導出」する1回限り処理を追加（既存リーダーが居る派閥のみ書き換え、孤児派閥は触らず孤児フィルタ側に委譲）。⑤**孤児派閥フィルタ** (`src/ui-render.js:_relmapGetFilteredFactions`): 「player+全rivalOrgs+freeAgents の和集合に leaderId が居ない派閥は隠す」を追加し、_dfcRenderCard が leader-in-roster 判定で派閥リストから外していた派閥が相関図 v2 に取り残される非対称を解消。⑥**仕様書更新** (`specs/faction-system-spec-v0.1.md`): 「○○組」表記を「○○派（リーダー苗字ベース）」に修正（命名規則・派閥所属タグ表記・サンプル文言の計6箇所）。⑦**検証**: auto-sim 100シーズン × seed42 で violations 0 / errors 0 / weeks 5300 / Game overs 0 ALL CLEAR ✓。⑧**実機確認推奨**: (1) 既存セーブをロードして派閥名が `○○派` に書き換わっているか、(2) 新規ゲームの派閥成立イベントで「○○を中心に派閥「○○派」が旗揚げされた」になっているか、(3) F09 試合のニュース・モーダルで派閥名が新形式か、(4) リーダー引退直後（オフシーズン後継イベント前）に DB 派閥タブと相関図 v2 の両方で当該派閥が**揃って消えている**か。⑨**残タスク**: 苗字の誤判定があれば data.js の surname を直接書き換え（自動判定不可だったケース: id:18 出羽鷹子→出羽 / id:38 芝彩音→芝 / id:43 金沢文→金沢 / id:46 井沢遥→井沢 / id:84 南谷杏→南谷 / id:120 蔵前静→蔵前 / id:117 クラッシャー毒島→毒島 / id:87 レオナ・O・シュタインフェルト→シュタインフェルト / id:116 リナ・モーガン→モーガン）。変更: src/data.js(127件 surname 追記) + src/factions.js(12箇所 派閥名置換 + applyF01Choice の leaderSurname 導出 + reconcileRoster マイグレーション 約 15 行) + src/management.js(_getSurname シグネチャ拡張) + src/ui-render.js(_relmapGetFilteredFactions 孤児フィルタ 約 9 行) + specs/faction-system-spec-v0.1.md(命名規則 6 箇所) + docs/game-system-roadmap.md(本項)。

## 直近の調整（2026-05-03）

**派閥内ポイント制 数値調整（spec v0.2 → v0.3 相当）。** 初期実装ではリーダー 0pt スタート + 非リーダー [8,5,2,0] OVR 順位だったが、これだと「リーダーが最初から抜かされている」見た目で派閥序列の物語性が崩れる。設計思想を「リーダーは就任時点で派閥最強の地位を持つ。50〜100 週かけて非リーダーが追いつき・追い抜く」に転換。①**FACTION_CONFIG 数値変更**: `internalChallengeGraceWeeksAfterEnthronement` 52→38 / `internalPointsAllocationByOvrRank` [8,5,2,0]→[4,2,1,0] / `internalChallengeLeaderInitialPoints: 12` 新設。②**`_allocateInternalPointsByOvrRank` ヘルパ改修**: 候補計算から現リーダーを常時除外（excludeFighterIds に含まれていなくても）、最後に `f.leaderId` に初期値 12pt を上書き。これで全呼び出し箇所（マイグレーション/createFaction/F03 succession/F05 分裂/applyInternalChallengeResult/_applyArchetypeTransition）が一律に「リーダーは初期値、非リーダーは OVR 順位、除外メンバーは 0pt」になる。③**`createFaction` 修正**: 派閥オブジェクト push 直後にヘルパを呼び、新規派閥誕生時から「リーダー 12pt + 非リーダー OVR 順位」状態に。`internalChallengeCooldownUntilWeek: 0` も初期化に集約。④**マイグレーション v3 追加** (`src/app.js`): `_migrated_factions_internal_points_v3` で既存セーブに新ルールをバックフィル。v2（[8,5,2,0] + リーダー 0pt）から v3（[4,2,1,0] + リーダー 12pt）にスイッチ。⑤**バランス想定**: リーダー 12pt vs 非リーダー 1位 4pt = 8pt 差。挑戦圏内（差 ≥10pt）に入るには非リーダーが +18pt 必要 = 22pt 到達。Common-1 +6pt × 3回 + 派閥外 +2pt × 数回で 50〜80 週で到達想定。猶予 38 週ガード後、最速 38 週・理想 50 週・遅くて 100 週で発火するカーブ。⑥**仕様書 v0.3 化は次セッション以降**: 本コミットは数値調整のみ。実プレイでカーブを観測してから仕様書を確定する。変更: src/data.js(3 項目) + src/factions.js(_allocateInternalPointsByOvrRank ロジック改修 + createFaction 初期割り振り 約 25 行) + src/app.js(マイグレーション v3 約 17 行) + docs/game-system-roadmap.md(本項)。


## 現在の状態

**派閥内ポイント制 + F-INTERNAL-CHALLENGE Phase 1〜7 全実装完了（2026-05-03）。**

## 現在の状態

**派閥内ポイント制 + F-INTERNAL-CHALLENGE 派閥内序列戦 Phase 1〜7 全実装完了（2026-05-03）。** `specs/faction-internal-rank-spec-v0.2.md` と `plans/faction-internal-rank-implementation-task.md` に基づき、`factions.js:2849` の長らくコメントだけで残っていた「リーダー交代の伏線フラグ（v0.2 で交代イベントに連結予定）」を実コードに接続。F09（外抗争）の対称構造として F-INTERNAL-CHALLENGE（内抗争）を完成させ、派閥リーダーが在籍中のまま座を奪われる経路を新設。①**Phase 1 基盤** (`src/data.js` + `src/factions.js` + `src/management.js` + `src/app.js`): `FACTION_CONFIG` に内部ポイント関連 19 項目（Common-1 結果ポイント 5+派閥外 3+発火条件 5+割り振り 1+効果 5）追加、`Engine.factions` に `_ensureInternalPointsInit/_getInternalPoints/_setInternalPoints/_addInternalPoints` 4 ヘルパ新設、tickWeek 派閥 lazy init ブロックに `_ensureInternalPointsInit` 呼出、app.js セーブロード時に `_migrated_factions_internal_points_v1` フラグで `factionInternalPoints={}` と全派閥の `internalChallengeCooldownUntilWeek=0` を補填。**重要設計判断**: 仕様書 §2.2 の `leaderEnthronedSeason/Week` は既存 `lastLeaderChangeSeason/Week` を流用（重複フィールド回避）、Phase 1 段階では既存派閥への OVR 順位ベース初期割り振りはせず実プレイで自然蓄積に任せる方針（数字は嘘をつかない原則）。②**Phase 2 ポイント加算** (`src/factions.js` + `src/management.js`): `accrueInternalPointsFromCommon1` を `applyCommon1MatchResult` 末尾フックで発火（非リーダー同士勝者+6/敗者-3、リーダー順当±0/敗者-3、下克上勝者+12/リーダー-8）、`accrueInternalPointsFromExternalMatch` を `finalizeShow` の `accrueRivalryPointsFromMatch` 直後でフック（タイトル+3/メイン+2、F09 試合は×1.5、リーダー本人には加算しない）、BOND archetype/legacy `bond_first` flavor は両ルートで完全スキップ（archetype 思想と矛盾するため）。下限0クランプ。③**Phase 3 挑戦権検出 + ショウカード強制注入** (`src/factions.js` + `src/management.js` + `src/ui-render.js`): `checkInternalChallengeConditions` 9 条件全チェック（active/非BOND/メンバー≥4/個別CD/リーダー就任52週猶予/リーダー在籍/ポイント差≥10pt または FACE は ≥15pt/F09 排他（`_pendingF09` + `factionRivalryPoints[*].f09Active`）/挑戦戦未予約）、同条件で複数候補時はポイント最高位→OVR 上位タイブレーク、`registerInternalChallenge` で `_pendingInternalChallenge={factionId,challengerId,leaderId,registeredSeason,registeredWeek}` を立て `factionTimeline` に `INTERNAL_CHALLENGE_REGISTERED` 追記、tickWeek の F09 判定直後に組込み（RNG `0xFA20`、興行週限定）、`renderShowPrep` で挑戦者 vs リーダーを slot 0 に強制注入し他 slot から自動除去（tag slot は単発に置換）、各 slot に `_internalChallengeLocked:true` をマーク、`_spOpenPicker` ロックハンドリング追加（トースト「⚔ 派閥内序列戦は固定です」）、ショウカードバッジ「⚔ 派閥内序列戦（固定）」紫系配色で追加。F09 ロックバッジハンドリングも同所で同時補完。④**Phase 4 試合結果反映 + リーダー交代** (`src/factions.js` + `src/app.js`): `_allocateInternalPointsByOvrRank(state, factionId, excludeFighterIds)` 新設（excludeIds は 0pt のまま、それ以外は OVR 順位で 8/5/2/0 配分）、`applyInternalChallengeResult(state, matchResult, rng)` がリーダー敗北時に派閥の leaderId/name（`〇〇組`）/lastLeaderChangeSeason・Week/CD（+24週）を更新+OVR 順位再配分（新旧リーダー除外）+effect（旧リーダー trust -5〜-8 / 新リーダー trust +5〜+8 / 新リーダー pop +3〜+5 / momentum +5〜+10 / 旧→新 rivalry +15〜+20 / メンバー→新リーダー bond +2〜+3）+ AUTHORITY のみ `_decideAuthoritySuccessorArchetype`（後継 OVR 上位3名の性格多数決）で MERIT/BOND 遷移を `_applyArchetypeTransition` 経由で発火、リーダー勝利時は CD 更新+OVR 順位再配分（リーダー・挑戦者除外）+effect（リーダー trust+pop+/momentum +10〜+15/挑戦者 trust-/挑戦者→リーダー rivalry-（沈静化））+ AUTHORITY 派閥のみメンバー→リーダー bond+。`_pendingInternalChallengePostModal` を立て pending クリア、`factionTimeline` に `INTERNAL_CHALLENGE_RESOLVED` 追記。`finalizeShow` の F08 後処理直前に `_internalChallengeLocked` 試合の結果反映フックを追加（RNG `0xFA21`、validMatches ループから winnerId/loserId/winner+loser HpPct を渡す）。⑤**Phase 5 UI モーダル + セリフ + 派閥詳細表示** (`src/data-faction-dialogue.js` + `src/factions.js` + `src/ui-common.js` + `src/index.html` + `src/ui-render.js` + `src/app.js`): `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES` / `PRE_LEADER_LINES` / `POST_WINNER_LINES` / `POST_LOSER_LINES`（loser のみ HP帯 hp_high/hp_mid/hp_low 分岐）を 7 性格×normal アーキタイプで定義（normal フォールバック規則は既存 `_getF08LineByBand` 流用）、window/module 両エクスポート、`getInternalChallengePreData(state, matchSlot)` が pending から challenger/leader を引き narration「{派閥名}――派閥内の力学が今夜、リング上で決着する。」+両者セリフ＋OVR を返却、`getInternalChallengePostData(state, postModal)` が leaderWon に応じて winner/loser を入替、HP帯で loser セリフ抽選、AUTHORITY 敗北時は `lastArchetypeTransition` を当週検出して archetype 遷移情報を併記、`showInternalChallengePreModal` / `showInternalChallengePostModal` を F08 流用ベースで新設（紫〜深青グラデ `internal-challenge-pre/post` クラス、BGM tension ループ + 150ms gong stinger、結びチャイム）、index.html に紫系 CSS フルセット + `.dfc-internal-rank` 序列行 CSS 追加、`_dfcRenderCard` の foot 後に「序列」行（👑リーダー名 Npt → 挑戦者名 Npt + 「就任 N 週目」表記）を非 BOND 派閥のみ表示、挑戦圏内のときは ⚔ アイコン active 強調、app.js `_runPreMatchFlavorForMatch` で F08/F09 と並列の最優先トリガーとして `_internalChallengeLocked` 試合に pre モーダルを発火（matchId 重複防止）、`_runPostMatchFlavorForMatch` で `runPostInternalChallenge` を `runPostF09` の前にネスト（pending 消費は1試合1回）、archetype 遷移ナレーション「― 〇〇組は《権威型》から《結束型》へ気風を変えた ―」を post モーダルに併記。⑥**Phase 6 既存システム連携** (`src/factions.js`): `_dissolveFaction` に `factionInternalPoints[factionId]` 削除 + 当該派閥が `_pendingInternalChallenge` 対象なら解除を集約（F03 dissolution 全 3 経路 + leader_lost_no_successor を一括カバー）、F03 succession/turmoil 共通更新で新派閥 `internalChallengeCooldownUntilWeek=絶対週+24` をセット + `_allocateInternalPointsByOvrRank(s, factionId, [successor.id])` で OVR 順位ベース再構成（successor は 0pt スタート）、F05 leader-lost succession 経路にも同処理を適用、F04-A 寝返り選択時は元派閥の internalPoints から targetId エントリ削除 + `_pendingInternalChallenge.challengerId === targetId` なら pending クリア、F05 自然分裂時は離脱メンバーの internalPoints エントリ削除→新派閥 createFaction→旧派閥 OVR 順位ベース再構成（旧リーダー除外）→新派閥 OVR 順位ベース初期割り振り（新リーダー除外）、`_applyArchetypeTransition` で BOND 遷移時は internalPoints エントリ削除、BOND からの遷移時は OVR 順位ベース割り振りで初期化。⑦**Phase 7 検証**: auto-sim 100 シーズン × seed 42 で violations 0 / errors 0 / weeks 5300 / Game overs 0 ALL CLEAR ✓。仕様書 §11.2 の期待値（AUTHORITY 3〜5 シーズン/回・リーダー勝率 60〜70%・AUTHORITY 遷移率 30〜50%・最初の挑戦戦まで平均 80〜130 週）の精密マッチングは実プレイ確認 + 大規模 200×5 シード測定で要追跡（`internalChallengeThresholdGap` / Common-1 ポイント値で再調整可能）。⑧**残タスク（任意・次セッション以降）**: (a) 仕様書 v0.3 化（`lastLeaderChangeSeason/Week` 流用 / Phase 4 完成後 v2 マイグレーションで既存派閥 OVR 初期割り振りバックフィル方針を反映）、(b) 大規模 auto-sim 200×5 シードで仕様書期待値との比較・乖離あれば config 調整、(c) セリフテーブルの AUTHORITY/MERIT 個別アーキタイプ拡張（現状 normal フォールバック中心、archetype × personality マトリクスは仕様書 §11.3 の実プレイ検証フェーズで増強）、(d) specs/ ファイル索引のステータス 🟡 → 🟢 更新。⑨**実機確認推奨**: (1) AUTHORITY 派閥（authoritarian）の挑戦戦が極端に早く/遅く発火しないか、(2) リーダー敗北時に派閥名が新リーダー名（〇〇組）に切替わるか、(3) AUTHORITY → MERIT/BOND 遷移がコンソール `[WM Faction] Archetype transition:` で確認できるか、(4) ショウカードに「⚔ 派閥内序列戦（固定）」バッジが立ち picker でロックされるか、(5) F09 と内部挑戦戦が同興行で同時発火しないか、(6) 派閥詳細画面の「序列」行・「就任 N 週目」表記がポイント差≥10pt のとき ⚔ アイコンで強調されるか、(7) pre/post モーダルの紫グラデ配色がドラマ性を出せているか。変更: src/data.js(FACTION_CONFIG 19 項目 約 30 行) + src/factions.js(_ensureInternalPointsInit/_get/_set/_addInternalPoints/_allocateInternalPointsByOvrRank/accrueInternalPointsFromCommon1/accrueInternalPointsFromExternalMatch/checkInternalChallengeConditions/registerInternalChallenge/applyInternalChallengeResult/getInternalChallengePreData/getInternalChallengePostData ほか F03/F04/F05/_dissolveFaction/_applyArchetypeTransition への連携注入 約 380 行) + src/management.js(tickWeek lazy init + 挑戦戦判定 + finalizeShow 外試合フック 約 15 行) + src/app.js(マイグレーション + pre/post モーダル起動トリガー + finalizeShow 結果反映フック 約 50 行) + src/ui-render.js(_pendingInternalChallenge 強制注入 + picker ロック + バッジ + 派閥詳細「序列」行 約 95 行) + src/ui-common.js(showInternalChallengePreModal + showInternalChallengePostModal 約 150 行) + src/index.html(紫グラデ CSS フルセット + .dfc-internal-rank CSS 約 100 行) + src/data-faction-dialogue.js(セリフテーブル4種 約 200 行) + specs/faction-internal-rank-spec-v0.2.md(参照のみ・🟢 化は次セッション) + plans/faction-internal-rank-implementation-task.md(参照のみ) + docs/game-system-roadmap.md(本項)。

## 現在の状態（過去）

**破産再設計 v1.1 全Phase実装完了（2026-05-03）。** `specs/bankruptcy-redesign-spec-v1.1.md` に基づき、旧来「`funds<=0` の瞬間に成績表1画面で終了」だった破産処理を「予兆 → 抵抗 → 別れ」の3段ドラマに置き換え。①**Phase 1-A 状態+判定** (`src/management.js` + `src/app.js`): `crisisActive` / `crisisEnteredWeek` / `crisisWeeksRemaining` / `crisisHistoryCount` / `gameOverReason` の5フィールドを `createInitialState` 追加 + ロード時後方互換補完、`tickWeek` の旧破産判定を `!s.offSeason` ガード下の危機フェーズ4分岐（突入/即死≤-1500/復帰≥0/猶予継続）に置換、`advanceWeek` の `week>48` 分岐冒頭にシーズン末強制判定を挿入し `season_end` 経路で early return、Survival 燃料ゲージの閾値・コメントを -1000 → -1500 に整合。②**Phase 1-B 危機フェーズ演出** (`src/index.html` + `src/ui-render.js` + `src/data.js` + `src/kuroda-text.js` + `src/app.js`): 画面上部に `#crisisBar` 警告バー（赤帯+パルスアニメ、`crisisActive && !offSeason && weekPhase非draft/opening/gameover` で表示）、`KURODA_CRISIS.{enter,ongoing,recovered}` を新設して新聞 Page1 冒頭に黒田 editorial コラムを優先掲載（`G._crisisColumnTag` で文面切替、`{orgName}/{weeksRemaining}` 置換）、`CRISIS_DIALOGUE.enter` を archetype 6プール×2セリフで定義し `App.checkCrisisEnteredPopup` ヘルパーで突入週にトラスト最上位（同値時人気タイブレーク）の選手不安発言ポップアップを発火（tickWeek/advanceWeek 両経路に注入）、`_crisisJustEntered` フラグは消費後クリア。③**Phase 1-C 解散セレモニー(5スライド)** (`src/data.js` + `src/management.js` + `src/ui-common.js` + `src/app.js`): `GAMEOVER_LINES.fighter` を `archetype × trust(high/mid/low)` = 18プール × 各3セリフ + コーチ6セリフで spec §3.3 をそのまま定義、`KURODA_GAMEOVER.{timeout,collapse,season_end}` を3経路×2パターンで spec §3.5 をそのまま定義、`Engine.ending.buildGameOverData` を新設し `top3Lines` を archetype × trust × 重複なし選出、`_pickGameOverLinesForTop3` / `_pickCoachGameOverLines` ヘルパー実装、`showGameOverCeremony(data, onDone)` を `showEndingCeremony` の DOM・スライド遷移パターンを完全踏襲してダウントーン配色（背景 `#1a0808→#100404`、アクセント `#aa6666`）で新設、スライド構成は **1**: 解散告知+黒田コラム / **2**: 団体の足跡 / **3**: 選手3名×archetype×trust セリフ / **4**: コーチ陣（0人時スキップ→4スライド化） / **5**: 🥀 + THE END + 「だが選手たちの戦いは続く——どこか別の団体の下で。」、BGM `bgm/iwa_gameover001.mp3` を loop:true / volume:0.13 で再生→最終スライド「タイトルへ ▶」で `fadeOut(2000)`→`App.showTitleScreen()` 復帰、`app.js` の旧 `showGameOverScreen(summary)` 呼び出しを `showGameOverCeremony(buildGameOverData(G), …)` に置換。④**重要設計判断**: archetype を主軸（personality は Phase 2）、trust レベルは「同 archetype 内の感情の方向（誇り/動揺/怒り）」を制御、黒田は editorial モード固定（宣言調・「本紙は」・対比構造）、トラスト・モラル数値減衰は控えめに留める原則を維持（数値でドラマを作らない / セリフと黒田で作る）。⑤**検証**: Phase 1-A 完了時 auto-sim 50シーズン×seed42 で violations 0 / errors 0 / weeks 2650 / ALL CLEAR ✓、Phase 1-B/1-C は preview_eval ベースで `KURODA_CRISIS`/`CRISIS_DIALOGUE`/`GAMEOVER_LINES`/`KURODA_GAMEOVER` 全グローバルロード確認、警告バー DOM 切替・新聞 Page1 危機コラム3タグ（enter/ongoing/recovered）切替・`{orgName}` 置換・`buildGameOverData` 3経路×ojousama×T80/delinquent×T25 のセリフ整合・`showGameOverCeremony` 5スライド DOM 生成・コーチ0人スキップで4スライド化・スライド1の黒田編集記事ブロック・スライド5の 🥀 + 「どこか別の団体の下で」を全て確認。⑥**Phase 2 後回し候補（empirical tuning に基づく拡張）**: (A) personality タグでセリフサブセット選択（同 archetype 内バリエーション不足が気になったとき）、(B) 残資金深さでセリフトーン段階変化（軽赤字=再起 / 深赤字=諦観）、(C) 解散後の後日談（「○○は△△団体に移籍した」を成績表下に1〜2行）、(D) `crisisHistoryCount >= 3` で黒田の論調変化（「またか」）、(E) 緊急救済イベント（融資・スポンサー・ロスター放出）。いずれも実機プレイで違和感が出たら拾う候補。⑦**実機確認推奨**: (1) 資金<0 突入で警告バー表示・新聞コラム・選手不安発言、(2) 4週放置 `timeout` 経路の5スライド、(3) -1500割れ `collapse` 経路、(4) 第48週マイナス維持 `season_end` 経路、(5) 危機脱出時 `recovered` コラム + 警告バー消去。変更: src/management.js(crisis 判定 + season_end 強制判定 + buildGameOverData + ヘルパー2種 約 130 行) + src/app.js(state 補完 + Survival 閾値 + checkCrisisEnteredPopup + 呼出3箇所 + showGameOverCeremony 切替 約 50 行) + src/data.js(CRISIS_DIALOGUE 12 + GAMEOVER_LINES 18×3+6 約 130 行) + src/kuroda-text.js(KURODA_CRISIS + KURODA_GAMEOVER 約 65 行) + src/ui-render.js(refreshTopBar 危機バー制御 + Page1 黒田コラム差込 約 36 行) + src/ui-common.js(showGameOverCeremony 新設 約 200 行) + src/index.html(.crisis-bar CSS + 要素 約 25 行) + specs/bankruptcy-redesign-spec-v1.0.md(初版) + specs/bankruptcy-redesign-spec-v1.1.md(本実装の確定仕様) + plans/bankruptcy-redesign-implementation-task.md(Phase 1-A/B/C タスク表) + docs/game-system-roadmap.md(本項)。

## 現在の状態（過去）

**年代記モード 事実性監査 + 外部ライバル枠 + エース/同期 叙述追加（2026-05-03）。** ユーザ指摘「年代記の『この時代の主な出来事』に実際には起きていないことが含まれている気がする、この時代で戦った主な外敵を入れたい、エースと同期について残されたデータをもとに事実ベースでもっと詳しく書いてほしい」を起点に年代記生成を全面監査+拡張。①**事実性監査**: career history に push される type を全列挙し `_buildHighlights` の対応漏れを特定。`titleDefense` の `count` が累積値のまま使われており、長期在位だと前章の防衛数まで「この章で」と表示される構造的誇張を発見。新type `titleLoss`/`summit`/`challenge_request_match`/`awardMedia` 未対応、`juniorTournament.runnerUp` 切り捨て、`war` の集約なしで複数戦が単発で並ぶ等の漏れも列挙。②**修正** (`src/management.js:_buildHighlights`): 章境界差し引きを導入(同 beltId の章開始前最大 count を引いた増分が 3 以上で防衛採用)、`titleLoss` を赤 tier で「`5度防衛の末に陥落（◯◯に敗北）`」形式で追加、`summit`/`challenge_request_match` を grouped 化、`war`/`awardRookie`/`awardMedia` を集約「対抗戦2戦1勝1敗（vs ◯◯）」形式に強化、`juniorTournament.runnerUp` を silver 単発で追加、`addGrouped` に `wins/losses/opponents` を導入。③**記者コメント抑制** (`QUOTE_TEMPLATES`): `peakDefender` の最も誇張の強い 3 文(「誰にも玉座を譲らない」等)を事実寄りに差し替え、`champion` カテゴリ閾値を `titleReigns >= 2` → `>= 3` に引き上げ。④**外部ライバル枠新設** (`Engine.chronicle._buildExternalRivals` + `src/ui-render.js`): 章期間内の `war`/`summit`/`challenge_request_match` の `opponentOrg` を集計し、上位4団体を「総戦数 / W-L / 主な相手1〜2名」で表示。`chapter.externalRivals` フィールドを追加。⑤**エース叙述** (`Engine.chronicle._buildAceNarrative`): 記者コメント直下に「事実」見出しブロックを新設、デビューS年・ピークOVR&S年・章内戴冠/防衛/受賞・対外戦績・章ラスト陥落相手などを事実ベースの2〜3文で組成。テンプレ穴埋めではなく事実フィールドの動的組み合わせ。⑥**同期叙述** (`Engine.chronicle._buildPeerNarrative`): peer カードの名前下に小さく「S{n}デビュー / ピークOVR{n} / 戴冠経験あり / MVP / …」の事実列挙行を追加。⑦**CSS 追加** (`src/ui-render.js:_chronicleStyleBlock`): `.chron-ace-narrative` / `.chron-gen-narrative` / `.chron-rivals` / `.chron-rival` 系。⑧**検証**: 合成データで `_buildHighlights`/`_buildExternalRivals`/`_buildAceNarrative`/`_buildPeerNarrative` を直接叩いて出力を確認(章境界差し引きで `count=9` を `prior=4` 引いて「5度防衛」表記、対抗戦2戦1勝1敗、外部ライバル集計、エース叙述「S1デビュー、S4にOVR92でピーク到達。…影狼プロを中心とした対外戦で2勝1敗、世界王座は◯◯に明け渡した」)。auto-sim 30 シーズン × seed 7919 で violations 0 / errors 0 / weeks 1590 / ALL CLEAR ✓。⑨**やらないこと**: `injury_retirement`/`firedReturn`/`reclaimSuccess` 等の career history に乗らないイベント(industryNews/careerHistory別配列)の章組込はスコープ外、サブタイトル(`SUBTITLE_TEMPLATES`)・章末フレーバー(`CLOSING_TEMPLATES`)は今回触れず。変更: src/management.js(_buildHighlights 改修 / _buildExternalRivals 新設 / _buildAceNarrative 新設 / _buildPeerNarrative 新設 / buildChapters 連携 / QUOTE_TEMPLATES 抑制 / champion 閾値変更 約 230 行) + src/ui-render.js(narrative 描画 2 箇所 + peer narrative + 外部ライバルセクション + CSS 約 60 行) + docs/game-system-roadmap.md(本項)。

## 現在の状態（過去）

**挑戦試合打診 + 解雇遺恨システム 全フェーズ実装完了（2026-05-03 早朝）。** `specs/challenge-request-spec-v0.1.md` と `specs/firing-grudge-spec-v0.1.md` の両方を Phase 1〜5 まで一括実装。①**Challenge Request P3** (`src/relationships.js` + `src/app.js` + `src/ui-common.js`): YES 選択時に `Engine.challengeRequest.buildMatchCard(state)` で 3シングル連戦カード生成（打診者+味方2 vs 相手+相手陣2、bond/OVR で味方選出）、`resolveMatchCard(card, rng)` で `Engine.battle.simulateMatch` x3 即時実行、`App._applyChallengeRequestResult` が h2h.update x3 / `Engine.career.addEvent` x6 / Engine.industryNews.push を反映、`showChallengeRequestResultModal` がクリームOfficeトーンで結果表示（タイトル/トーン/相手リアクション吹き出し/3行スコア表/コーチ寸評）。**設計判断**: 2vs2 専用の既存タッグ基盤を 3vs3 化する規模リファクタを避け **シングル3連戦** に着地、興行枠への in-show 挿入も finalizeShow の rivalry/title/attendance/coach 多分岐ガードがスコープ超過のため **post-show 即時解決** に着地。②**Challenge Request P4** (`src/data.js` + `src/app.js`): NO 選択時の打診者ティッカーセリフ `CHALLENGE_REQUEST_NO_LINES` 7性格×2=14 を data.js に追加、handleChallengeRequest NO 分岐で性格別抽選+condition -8 を維持。③**Challenge Request P5** (`src/data.js` + `src/ui-common.js`): 相手リアクションセリフ `CHALLENGE_REQUEST_OPPONENT_REACTIONS` 7性格×3=21 を data.js に追加、結果モーダルに `crrm-opp-reaction` 吹き出し（warm 左ボーダー / italic）を組込。新聞ヘッドライン `NEWS_HEADLINE_TEMPLATES.challengeRequestWin/Lose/Draw` 各2-3バリアント。④**Firing Grudge P3a (forward)** (`src/relationships.js`): processWeekly の player→AI 候補抽選で打診者の `grudge.vsOrgId === orgId` のとき heat += intensity*0.3（出戻り想定）。⑤**Firing Grudge P3b (inverse)** (`src/relationships.js` + `src/ui-common.js` + `src/app.js` + `src/data.js`): 逆方向 AI→player 打診インフラ完備。processWeekly に逆方向スキャン（AI org の grudge.vsOrgId='player' 保持者 → player roster）、acceptPending が `requesterOrgId` 起源クォータキー判定、`buildMatchCard` を _inverse 分岐（teamA=打診者陣 / teamB=相手陣の役割は両方向で統一、payload に `requesterOrgId/opponentOrgId/requesterOrgName/opponentOrgName/isInverse` を保持）、`showChallengeRequestModal` を _inverse 対応（取次セリフ「古巣の○○選手とリングで決着をつけたい」、サイドラベル「打診者(古巣に挑む)/名指しされた側」、ポートレートクリッカブル側を反転、選択肢を「受けて立つ/お引き取り願う」に書き換え）、`handleChallengeRequest` に `_findRequester` ヘルパ + NO condition 悪化を AI ロスター側にも適用、`_applyChallengeRequestResult` を双方向対応（h2h org キー / career roster 書き戻し / news タイプを player POV で分岐）、`showChallengeRequestResultModal` を player POV 表示に統一（左=自陣 / score=自陣スコア-AI スコア / 行表示も player 左揃え）。新聞テンプレ `challengeRequestInverseDefend/Fall/Draw` を 3+3+2=8 バリアント追加。⑥**Firing Grudge P4** (`src/data.js` + `src/app.js`): 新聞ヘッドライン `NEWS_HEADLINE_TEMPLATES.firedReturn` 5バリアント追加、`_applyChallengeRequestResult` で相手陣に grudge.vsOrgId='player' & intensity≥60 & 解雇24週以内のキャラがいたら firedReturn ニュースを追加発信。⑦**Firing Grudge P5 victory-lines** (`src/victory-lines.js`): `VS_EX_EMPLOYER_LINES` 7性格×{win,hit}×2=28パターン + `getVsExEmployerLine(fighter, mode)` ヘルパ追加。⑧**Firing Grudge P5 iframe 配信** (`src/app.js` + `src/ui-common.js` + `src/battle-engine-main.js` + `src/tag-battle-main.js`): `App._vsExEmployeeFires` 共通条件判定ヘルパ + `_buildVlVsPlayerForExEmployee` (vl 先頭 prepend) + `_buildVsExHitLines` (hit 配列) を新設。標準興行/B3挑戦状/対抗戦/PPV の4箇所の iframe 送信で各 fighter に `vl: ...prepended, vsExHit: [...]` を付与。`battle-engine-main.js` `tryDamageLine` + `_buildPinCtrl` の被弾セリフロジック、`tag-battle-main.js` の シングル+pin の被弾セリフロジック計4箇所に `vsExHit` 50% bias（HP 33%超のみ、既存「言葉にならない帯」尊重）。`ui-common.js` `_getWarVictoryLine(fighter, state)` を拡張し war 試合 50% で `getVsExEmployerLine` から bias、app.js 全呼出を `(fighter, G)` に更新。⑨**両 spec を全Phase完了表記に更新**。⑩**検証**: auto-sim 100 シーズン × seed 42 (各実装段階で計5回) で violations 0 / errors 0 / weeks 5300 / Game overs 0 ALL CLEAR ✓。プレビューロード時のコンソールエラーなし、helper/テンプレ全API正常エクスポート確認。⑪**残タスク（任意・次セッション以降）**: (a) CR Phase 3 の興行枠 in-show 挿入（finalizeShow の rivalry/title/attendance 多分岐ガードを各 subsystem に追加する大規模改修）、(b) CR Phase 5 の相手リアクションセリフのアーキタイプ × 関係性タイプ × 格差軸の細分化（spec §4.2 の最低 21 → 拡張）、(c) firedReturn news の B3挑戦状/奪還挑戦パスへの拡張（現状 challenge-request 経路のみ）。変更: src/relationships.js(Engine.challengeRequest.buildMatchCard / resolveMatchCard / 双方向 processWeekly / acceptPending クォータ / heat バイアス 約 200 行) + src/app.js(handleChallengeRequest 双方向対応 / _applyChallengeRequestResult 双方向 / _vsExEmployeeFires / _buildVlVsPlayerForExEmployee / _buildVsExHitLines / iframe 4箇所 vl 置換 / war helper 呼出 3箇所 約 250 行) + src/ui-common.js(showChallengeRequestModal 双方向 / showChallengeRequestResultModal 新設+player POV / _getWarVictoryLine 拡張 約 200 行) + src/data.js(CHALLENGE_REQUEST_NO_LINES 14 / OPPONENT_REACTIONS 21 / NEWS_HEADLINE_TEMPLATES 5+5+2+5+3+3+2=25 約 80 行) + src/victory-lines.js(VS_EX_EMPLOYER_LINES 28 + getVsExEmployerLine 約 90 行) + src/battle-engine-main.js(tryDamageLine + _buildPinCtrl の vsExHit bias 2箇所) + src/tag-battle-main.js(シングル + pin の vsExHit bias 2箇所) + specs/challenge-request-spec-v0.1.md(全Phase完了表記) + specs/firing-grudge-spec-v0.1.md(全Phase完了表記) + docs/game-system-roadmap.md(本項)。

## 現在の状態（過去）

**ダイジェスト寸評 期待MQ式リバランス（2026-05-03）。** ユーザ指摘「ダイジェストのMQレベルがかなり高いのに黒田記者のコメントが辛辣すぎる、ボロクソに言っている」を起点に新聞1面ダイジェスト寸評の選択ロジックを調査。①**根本原因の特定**: プロジェクト内に「期待MQ」が二系統あり、ショー評価系 (`data.js` `SHOW_RATING_CONFIG.expectedMQTotal[6]=220` → per-match 平均≒37〜50) とダイジェスト寸評系 (`src/ui-render.js:7951` `EXPECTED_MQ_BY_VENUE` → 旧 base 18〜60 + popCoef 0.30〜0.80・cap95) が乖離。旧式ではドーム×orgPop50で expectedMQ=95 に張り付き、`bad` 閾値 (diff<-15) 換算で MQ ≤ 79 はすべて `bad` プール（「退屈な試合。ファンの時間を返してほしいレベル」「興行のテンポを完全に殺した」）に落ち、観客満足度4★の興行で undercard が全部「クソ試合」と評される自己矛盾が発生。②**修正** (`src/ui-render.js:7951-7966`): `EXPECTED_MQ_BY_VENUE` テーブルを base 30/33/36/40/44/48/52/56/60/65・popCoef 0.15/0.18/0.20/0.22/0.25/0.28/0.32/0.35/0.38/0.40 に圧縮、`_calcExpectedMQ` の cap を 95→80 に引き下げ。新値ではドーム×orgPop50 で expectedMQ≒80、MQ77 → diff -3 → `average` プール「無難にまとめた一戦」として再判定される。③**触らないもの**: 黒田の `bad` プール文言（トーン維持）、`SHOW_RATING_CONFIG.expectedMQTotal`、`diff` 閾値 (+15/+5/-4/-15)、`NEWSPAPER_DIGEST_COMMENTS` 全プール、新聞ダイジェスト ★評価ロジック (`ui-render.js:8024-8025` で同 expectedMQ を使うため期待値だけ底上げされ意図通り)。④**検証**: auto-sim 30 シーズン × seed 42 で violations 0 / errors 0 / Result: ALL CLEAR ✓。⑤**スコープ外**: ローカルプレイでの目視確認 (4★以上の興行で `bad` が出ないこと、1〜2★の不出来な興行で辛辣コメントが維持されること、MQ70台が `bad` に落ちないこと) はユーザ委任。新テーブル数値はチューニング前提の初期値。⑥**spec 反映**: `specs/newspaper-and-orgcompare-spec-v2.0.md` §3 に期待MQ算出ルールを追記、変更履歴に v3.2 を追加。変更: src/ui-render.js(`EXPECTED_MQ_BY_VENUE` テーブル全置換 + cap95→80 約15行) + specs/newspaper-and-orgcompare-spec-v2.0.md(§3 追記 + v3.2 履歴) + docs/game-system-roadmap.md(本項)。


前回: **Common-1 派閥内対決 リデザイン v0.2（2026-05-02）。** 「打診モーダルが OVR も比較材料も無くテキスト羅列で、A 選択しても実試合に遷移せず即時結果が出る」というユーザー指摘を起点に Common-1 を全面リデザイン。①**打診モーダル比較レイアウト化** (`src/ui-common.js` `showFactionCommon1Modal` + `src/index.html` `.fc1m-*` CSS): 2 名を左右に並べポートレート 120×144、OVR バッジ、PW/SP/TE/ST/MN の 5 ステータス比較（高い側 `.fc1m-higher` でオレンジハイライト）、リーダー側ポートレート頭上に **白吹き出し**（UI 共通ルール準拠：`#f0f0f0` 背景 + 黒文字 + 中央寄せ + 8px 三角尻尾）でリーダーセリフを表示、名前・ポートレート両方クリックで `showFighterPopup(id, 'roster')` 経由の選手詳細へ遷移。「rivalry 72.4 / 100」を「2 名間の因縁 X / 100」に言い換え（内部変数名を画面に出さない原則準拠）。②**リーダーセリフを personality × archetype 36 パターン化** (`src/data.js` `COMMON1_LINES.leaderDemand` + `src/factions.js` `getCommon1Line`): 旧形式（archetype 単位 6 行）から **6 アーキタイプ × 6 性格 = 36 マトリクス**へ拡張、`Engine.contract.getPersonalityType(leader)` で fiery/composed/grudging/airy/earnest/flippant を判定して引き当て。一人称・語尾・温度をリーダー本人で書き分け（例：MERIT × composed「序列の話、リングで片付ける。組んでくれ」、AUTHORITY × fiery「揉めるなら、リングで決める。うちじゃそれが筋だ」、HEEL × airy「うふふ、二人の喧嘩、客に見せちゃおうよ?」）。`getCommon1Line` は新形式（personality マップ）と旧形式（配列）の両対応で後方互換。③**A 選択時をビッグマッチ実試合フローへ** (`src/factions.js` 分割 + `src/app.js` 新規フロー): 旧実装は `applyCommon1Choice` 内で OVR + ノイズの簡易勝敗判定 → 即結果通知だったのを、`pendingMatch:true` 返しのみに変更し試合は app.js 側で実行。`_renderCommon1MatchPreview` (B3 流用) で観戦/スキップ二択のプレビュー表示 → `App.common1WatchMatch` / `common1SkipMatch` から `Engine.battle.simulateMatch(fA, fB, rng, 2, {recordFrames:true})` を **matchTier=2（ビッグマッチ）**で実行（HP base 85 / scale 1.10 / Climax BGM 切替 / BIG MATCH バッジ）。iframe header は `⚔ {factionName} 派閥内対決`、isSpecialMatch:true。`App._receiveCommon1BattleResult` → `App._finalizeCommon1Match` で `Engine.relationships.applyMatchResult` (同団体ペア・isCrossOrg:false) と新設 `Engine.factions.applyCommon1MatchResult(state, payload, winnerId, loserId, rng)` で trust/rivalry を反映してから `showFactionEventResult` で結果通知。seed: 試合 0xC0F1 / 関係性 0xC0FE / trust-rivalry 0xC0FA。④**iframe メッセージルーティング**: `src/app.js` の battle iframe 受信ハンドラに Common-1 分岐（PPV/War/B3 の後段、B2 の前段）を追加。⑤**spec/モックアップ更新**: `specs/faction-common-events-spec-v0.1.md` §3.3-3.5 を v0.2 リデザインで全面書き直し（実装分割・試合規格・seed・36 パターン明記）、`docs/ui/mockups/faction-common1-revamp-v0.1.html` 新規（吹き出し版・比較レイアウト確認用）。⑥**検証**: auto-sim 30 シーズン × seed 42 で violations 0 / errors 0 / weeks 1590 / Game overs 0 ALL CLEAR。実機の UI 動作確認（打診モーダルで OVR 比較が見える / 名前クリックで選手詳細が開く / 頭上吹き出しがリーダーの口調になっている / A 選択でプレビュー画面 → 観戦遷移 → ビッグマッチ規格で試合 → 結果モーダルで trust/rivalry 反映確認）はユーザー委任。⑦**やらないこと**: 他の派閥モーダル（F08/Common-3/4/5/7）の比較レイアウト化、興行カードへの組み込み、他派閥イベントの 36 パターン化。変更: src/data.js(COMMON1_LINES.leaderDemand 6×6 マトリクス展開 約 60 行) + src/factions.js(applyCommon1Choice 分割 + applyCommon1MatchResult 新設 + getCommon1Line personality 引数対応 約 50 行) + src/ui-common.js(showFactionCommon1Modal 比較レイアウト + 頭上吹き出し化 + _renderCommon1MatchPreview 新設 約 130 行) + src/index.html(.fc1m-* CSS 約 30 行) + src/app.js(COMMON_1 onChoice 分岐拡張 + common1WatchMatch/common1SkipMatch/_receiveCommon1BattleResult/_finalizeCommon1Match 新設 + iframe ルーティング 約 130 行) + specs/faction-common-events-spec-v0.1.md(§3.3-3.5 v0.2 リデザイン 約 30 行) + docs/ui/mockups/faction-common1-revamp-v0.1.html(新規) + docs/game-system-roadmap.md(本項)。

前回: **Glimpse Cascade 実装（2026-05-02）。**
> セッション履歴: `docs/archive/session-history.md`
> 完了済みタスク: `docs/archive/completed-tasks.md`
> 設計決定ログ: `docs/design-decisions.md`

---

**Glimpse Cascade 実装（2026-05-02）。** 興行後に Tier1 Relationship Glimpse が複数発火するとき、ポップアップを 1 件ずつ「見届ける」連打させていたのを廃止し、1 枚のオーバーレイに集約して上から「ポンポンポン」と順次降ってくる演出にまとめた。①**Variant A 採用**: docs/ui/mockups/glimpse-cascade-concepts-v0.1.html で 4 案検討の結果、縦リスト・順次降臨を採用。各カードは「白吹き出し(speech-bubble 既存スタイル準拠 #f0f0f0/#222・左下尖り角)→アバター対(96px・from に光る矢印 ➜ / to の右下に感情アイコンバッジ)→関係ラベル」の縦構成、tail は吹き出し左下から下方向に出て from-avatar の真上を指す。②**発動条件**: `GLIMPSE_CASCADE_MIN = 2`。1 件のみは既存 `showGlimpseAModal` にフォールバック(連打感がないと演出オーバーヘッドが大袈裟)。③**SE**: Web Audio API でベル系を合成(主音 sine 740Hz + 5度 triangle、1 枚ごとに +2 半音上昇)。フィニッシュ音は廃止(連打の余韻だけで自然に締める)。AudioContext は lazy init + suspended なら resume。④**実装**: `src/ui-common.js` に `showGlimpseCascade(glimpses, opts)` / `_renderGlimpseCascade` / `closeGlimpseCascade` / `_glimpseToneClass` / `_glimpseEmoIcon` / `_renderGlimpseCardHtml` / `_gcAudioCtx` / `_gcSePop` 新設、`_POPUP_OVERLAY_IDS` に `glimpseCascadeOverlay` 追加。`src/index.html` に `#glimpseCascadeOverlay`/`#glimpseCascadeBox` の DOM 要素 + `.glimpse-cascade-*` / `.gc-card` / `.gc-bubble` / `.gc-pair` / `.gc-avatar` / `.gc-emo` / `.gc-rel` の CSS 約 80 行追加(.gc-card.in に gcPop 0.42s バウンスアニメ)。⑤**呼び出し置換**: `src/app.js` の 5 箇所(prepareShowResultInlinePopups/closeShowResult/advanceWeek/PPV後/PPV TV後)で `tier1.forEach(g => showGlimpseAModal(g))` → `showGlimpseCascade(tier1, opts)` に置き換え、prepareShowResultInlinePopups は signature 登録を先に済ませてから cascade 呼び出し。⑥**spec/索引**: `specs/glimpse-cascade-spec-v1.0.md` 新規作成、CLAUDE.md ファイル索引にも追記。⑦**やらないこと**: Glimpse の発火ロジック・Tier1 判定 (`_isGlimpseTier1`)・Tier2 ログフィードは未変更。MP3 アセット追加は見送り(Web Audio で十分)。⑧**検証残**: auto-sim は relationships.js を変更していないため自動フックでは走らないが、UI 動作確認(興行後に複数 glimpse が出るセーブで cascade が表示されること、SE が鳴ること、1 件のみのときは従来単発が出ること)はユーザー委任。変更: src/index.html(オーバーレイ DOM 4 行 + CSS 約 80 行) + src/ui-common.js(`_POPUP_OVERLAY_IDS` 追加 + cascade 関数群 約 130 行) + src/app.js(5 箇所置換) + specs/glimpse-cascade-spec-v1.0.md(新規) + CLAUDE.md(索引追記) + docs/ui/mockups/glimpse-cascade-concepts-v0.1.html(4 案モック) + docs/game-system-roadmap.md(本項)。

前回: **序章システム + ミッション撤去（2026-05-02）。** `plans/chronicle-prologue-plan-v1.0.md` に基づき Phase 1-5 を一括実装。①**Phase 1 ミッション撤去**: `src/app.js` の MISSIONS 14項目 / Mission オブジェクト / Mission.updateCompleted 呼び出し 2箇所 / App.toggleMission / App.checkMissionUpdate / 旧バージョン互換初期化、`src/management.js` の missionEnabled/missionsCompleted/missionNewClears 初期 state、`src/ui-render.js` 今週画面のミッションパネル描画、`src/ui-common.js` の dismissMissionClear、`src/index.html` の .mission-* CSS 全般を削除。CLAUDE.md 三本柱に整合せず機能的にも経営サバイバル+年代記と重複していたため。②**Phase 2 データ層**: `Engine.prologue` モジュール新設 (`createEmpty`/`create`/`addHighlight`/`founderState`/`checkAndConfirm`/`confirm`)、`G.prologue = {founderIds, startSeason, startWeek, endSeason, endWeek, status, highlights[], closing}` を初期 state に追加。`completeDraft()` および `createInitialState(seed, skipDraft=true)` 末尾で `Engine.prologue.create()` を呼び出し旗揚げ5人を確定。③**Phase 3 ハイライト発火**: `App.checkPrologueHighlights()` を tickWeek 後段 4 箇所に配置、状態ベース冪等で `org_founded`/`first_show`/`first_title_setup`/`first_title_winner`/`first_mq50/70/80`/`pop_25/50`/`survival_clear` を拾う。`addHighlight` 内で id 重複ガード、`status === 'in_progress'` のときのみ刻まれる。④**Phase 4 引退時確定**: 同 `checkPrologueHighlights` 内で各 founder の `Engine.prologue.founderState` を判定、`retired` 検出で `founder_first_retire_${id}` ハイライト + 末尾で `Engine.prologue.checkAndConfirm` 実行。全 founder retired で `confirm()` が走り `endSeason/endWeek` 確定 + `prologue_end` ハイライト + closing 生成。移籍・解雇・契約満了では閉じない (departed 扱い)。既存 retire パスには触らない設計。⑤**Phase 5 UI**: `_renderPrologueBlock(prologue, chapters)` 新規実装 (VARIANT B)、`docs/ui/mockups/chronicle-prologue-mockup-v0.1.html` 準拠。年代記タブの `_renderDbChronicle` を拡張: idx=0 で序章ブロック / idx>=1 で確定章 (既存)。Timeline は先頭に "序" tic + 確定章。Founder Grid は 5 人カード (ポートレート 72×90 / 名前 / スタイル+ロール / 状態バッジ「初代王者」「看板」「引退」「退団」)。退団/引退カードは saturate(0.4) + opacity 0.7。Two-col body は左に主な出来事 (highlights tier 色分け)、右に通算 stats (TITLES/PEAK MQ/PEAK POP/STATUS)。Closing と Nav (前章なし / 次章 → CH.1) を配置。CSS は `_chronicleStyleBlock` 内に `.chron-prologue-roster / -card / -portrait / -name / -style / -badge / -quote` を追加 (var(--chr-*) トークン経由)。⑥**spec 更新**: `specs/chronicle-prologue-spec-v1.0.md` 新規作成、CLAUDE.md ファイル索引に追記 (全43ファイル)。⑦**検証**: auto-sim 100 シーズン × seed 42 で violations 0 / errors 0 / weeks 5300 / Game overs 0 ALL CLEAR。実機 UI 確認 (新規ゲーム → ドラフト完了 → 年代記タブで序章ブロック / 5 人カード表示 / org_founded ハイライト / 興行・王座・MQ閾値・人気閾値到達でハイライト追加 / 既存セーブのロードでクラッシュなし) はユーザー委任。⑧**やらないこと**: `Engine.chronicle` 既存ロジックの変更なし (純粋追加実装)、序章への番号付与なし、暫定エースなし、既存セーブの旗揚げ世代の遡及生成なし、序章ハイライトの新聞ティッカー通知なし。変更: `src/app.js`(Phase 1 削除 + completeDraft フック + checkPrologueHighlights + tickWeek 4箇所配線 約 60 行追加 - 1278 行削除) + `src/management.js`(Engine.prologue モジュール 約 95 行 + 初期 state 1 行 + createInitialState skipDraft フック 3 行 + initState const→let 1 行) + `src/ui-render.js`(_renderPrologueBlock 約 130 行 + _renderDbChronicle idx=0 分岐 + Timeline/Nav 改修 + CSS 約 70 行) + `src/index.html`(.mission-* CSS 削除 54 行) + `src/ui-common.js`(dismissMissionClear 削除) + `specs/chronicle-prologue-spec-v1.0.md`(新規) + `CLAUDE.md`(索引追記) + `docs/game-system-roadmap.md`(本項)。

前回: **ラストラン引退 本人ポップアップ欠落バグ修正（2026-05-02）。** ユーザー報告「ラストマッチ終わった後に引退戦士の一言が一切出ず、bond 75+の仲間（深町真琴）の R3 リアクションモーダルだけ出る」を発端に調査。①**症状**: シーズン9 第42週で椿山みさきのラストラン試合消化後、本来出るはずの本人引退ポップアップ（顔・「○○年間の軌跡」・通算戦績・性格別セリフ — `specs/archive/v1.3-3-retirement-presentation-spec.md` 確定仕様）が完全に欠落。②**原因仮説 H1（タイミング競合）**: 旧実装は本人引退ポップアップを `popupActions` チェーン（200ms 後発火）に積む一方、R3 モーダルは独立した `setTimeout(800ms)` で発火。`hasEventPopups` true 時に popupActions が `_chainEventPopupQueueEmpty` で待機すると 800ms を超えて R3 が先に開き、`_isPopupActive()` チェーンの整合崩れで本人ポップアップが出ないケースが発生し得る構造。③**修正1: R3 モーダルを popupActions チェーンに統合** (`src/app.js` closeShowResult): 旧 `setTimeout(800)` 経路を撤去し、`pendingR3Spec` を popupActions 末尾に push（本人引退 → 怪我引退 → 成長 → 因縁決着 → R3 の順を保証）。R3 は単発モーダルで `done` を持たないため、showR3Modal 直後に即 `done()` を呼んで次へ繋ぐ。④**修正2: 第3層フォールバック追加** (`src/app.js`): 既存の2層（processShowResult 検出 / closeShowResult roster.lastRun スキャン）で漏れた場合に備え、`G.retiredFighters` 末尾の `careerRecord.history` を走査して `type:'retire' & reason:'lastrun' & 同 season&week` のエントリから本人ポップアップを復元。怪我引退の救済（`src/app.js:7095-7120`）と同パターン、`reason:'wearInjury'/'careerEnding'` を `lastrun` に置換しただけの mirror 実装。`console.warn('[WM] lastrun retirement recovered via 3rd-tier fallback', ...)` で発火を可視化。⑤**修正3: 診断ログ3点**: `processShowResult:lastRunRetirees`（検出時点 `count`/`names`/`resultsLen`/`validMatchesLen`）、`closeShowResult:entry`（受取時点 `pendingLastRunCount`/`names`/`hasPendingR3`/`r3Reason`）、`closeShowResult:popupActions`（チェーン構築時点 `actionCount`/`pendingLastRun`/`pendingInjury`/`pendingGrowth`/`pendingResolutions`/`hasR3`/`hasEventPopups`）を `console.warn('[WM][lastrun-diag]', ...)` で常時出力。次回再現時に H1 タイミング以外の真因（参加者ID拾い漏れ、状態前後ずれ等）が浮上した場合に切り分け可能。⑥**スコープ外**: `src/app.js:6340-6342` のラストラン参加者ID抽出ロジック（singles=`match.left/right`、tag=`teamA/B.fighter1/2`）は据え置き。3way・4人タッグ・特殊フォーマットでの拾い漏れ可能性は仮説 H2 として残るが、第3層フォールバックで `retiredFighters` 経由で救済されるため実害ゼロ化済み。⑦**検証**: `node --check src/app.js` 構文OK、UI のみの変更（試合数値・判定ロジック非変更）のため auto-sim 不要（CLAUDE.md「app.js や UI のみの変更 → 不要」準拠）。実機の体感確認（再現セーブから引退試合リプレイ → 本人ポップアップ → R3 の順に出ること、`[WM][lastrun-diag]` ログの中身）はユーザー委任。変更: `src/app.js`(R3 モーダル popupActions 統合 約25行 + 第3層フォールバック 約25行 + 診断ログ3点 約20行) + `docs/game-system-roadmap.md`(本項)。

前回: **Heatシステム 乱入ペナルティ再設計 + 遺物バグ修正（2026-05-02）。** ユーザー報告「ヒートが最高潮(On Fire)なのに翌週ニュートラルに戻ってる事例が結構多い」を発端に Heat 系 (heatScore 値域[-10,+10]) を全面調査。①**遺物バグ発見** (`src/app.js:5321`): 乱入処理で `heatScore: Math.max(0, (s.heatScore || 50) + penalty)` という旧0-100スケール時代のコードが残存。`s.heatScore || 50` は heatScore=0(Neutral) のとき falsy 判定で 50 に化け、`Math.max(0, …)` は下限 0 で floor して負側帯(Cold/Ice Cold)を破壊。さらに penalty=-7〜-20 が値域[-10,+10]に対し過大で、On Fire(10) + penalty=-15 → `Math.max(0, -5)`=0(Neutral) となり「最高潮→ニュートラル」一撃ドロップが発生していた。②**修正** (`src/app.js`): `Engine.util.clamp((s.heatScore ?? 0) + penalty, -10, 10)` で正しくクランプ + penalty 振れ幅を再設計。基本 -3〜-6、現在 Hot/On Fire(hs≥6)帯では追加 -1〜-2(冷めやすい原則と整合)。最大ドロップでも On Fire(10)→Warm(2)程度で止まり、Neutral 一撃は不可能に。③**Engine.intrusion.applyResult 同期** (`src/management.js:1923-1936`): 同等処理が Engine 側にも存在(現状未使用)。将来 app.js から呼び出される可能性に備え、ペナルティ計算ロジックを app.js と完全同形に統一。④**occHeatDelta クランプ追加** (`src/management.js`): `s = { ...s, heatScore: s.heatScore + settle.occHeatDelta }` にクランプ無しだったため -10..+10 突破リスクあり。`Engine.util.clamp(..., -10, 10)` を追加。⑤**設計哲学整合**: CLAUDE.md「数字は繊細に使え」「安易な加減算で物事を処理しない」に反していた -7〜-20 一撃減衰を、現在 heat 帯に応じた相対減衰へ。「最高潮の余韻が一撃で消える」体験はユーザー観察通り破綻していた。⑥**検証**: auto-sim 100 シーズン × seed 42 で violations 0 / errors 0 / weeks 5300 / Game overs 0 ALL CLEAR。実機の体感(乱入で王座を奪われたとき heat バーが帯1〜2段降程度で済むか)はユーザー委任。変更: `src/app.js`(乱入結果 heat 計算 約7行修正) + `src/management.js`(`Engine.intrusion.applyResult` 約10行 + occHeatDelta クランプ 約1行) + `docs/game-system-roadmap.md`(本項)。

前回: **戦績・経歴タブ「入団以降のみ表示」+ 転生前データ別人扱い（2026-05-02）。** 選手ポップアップの「戦績・経歴」タブで、NPC 生成時の事前史（フィクションの転生前デビュー・タイトル歴・怪我など `season:1〜N`）まで表示されていた違和感を解消。「6年目にスカウトで入団した選手」が、なぜか1〜5年目に「特記事項なし」と並ぶ問題を修正し、表記も**キャリア相対年数**（入団年=キャリア1年目）に変更。さらに殿堂入り判定・クロニクル・引退ハイライトでも転生前を「別人」として扱うよう、参照側を全て post-join フィルタに統一。①**ヘルパ新設** (`src/management.js` `Engine.career`): `joinSeason(fighter)` / `filterPostJoin(history, joinSeason)` / `relSeason(absSeason, joinSeason)` を追加。joinSeason は `transfer(toOrg=player)` → `rentalIn` → `debut` の順で起点を決定。②**戦績・経歴タブ表示** (`src/management.js` `Engine.milestone.get` + `src/ui-common.js`): post-join のみマイルストーン化、シーズン見出しを `[キャリア${s}年目]` に、debut テキストを `${orgName} に${via}入団`、transfer テキストを `${fromOrg} から ${toOrg} へ移籍`（`'player'` は `G.orgName` に解決）。怪我・重大事項セクションも post-join + キャリア相対年数。③**戦績ヘッダ集計** (`Engine.career.buildSummary`): `cr.history` を post-join してから titleWins/totalDefenses/JT/PPV を再カウント（事前集計値 `cr.totalTitleWins` は使わない）。対抗戦・MVP・新人王・ベストマッチ・メディア功労賞の inline filter (`src/ui-common.js`) も post-join 化。④**殿堂入り判定** (`Engine.awards.calcHofPoints` / `_buildHofEntry` / `buildCareerHighlights` / `generateEpithet`): すべて post-join で再カウント。NPC 引退者の架空タイトル戴冠で HOF が水増しされる問題を解消。⑤**クロニクル**: `_collectCandidates` (active roster) と `archiveFighter` (`fighterArchive` 登録) で post-join のみコピー、`_classifyAceQuoteCategory` / `buildAceQuote` の章フィルタにも joinSeason を被せる。`buildCareerSummary`（引退時）も post-join 化。⑥**ui-render.js**: `_isContestedBelt` / `_titleWinCount` / HOF 詳細の対抗戦戦績フォールバックを post-join 化。⑦**「タイトルを獲ったことがある選手か」判定** (`management.js`): 引退勧告レート・スカウトカテゴリ等の `hasWonTitle` 全箇所も post-join 化。⑧**spec 更新**: `specs/career-history-spec-v1.0.md` §0 に「入団以降のみ表示・集計（転生前は別人扱い）」を追加、joinSeason API・適用範囲・表記ルール・データ保持方針を明記。⑨**後方互換**: セーブデータ形式は変更なし、転生前データは保持され表示・集計時にフィルタするだけ。既存 HOF エントリは再計算しない（新規引退者から新ロジック適用）。⑩**検証**: auto-sim 100 シーズン × seed 7919 で violations 0 / errors 0 / weeks 5300 / Game overs 0 ALL CLEAR、20 シーズン × seed 42 でも ALL CLEAR。実機の UI 確認（スカウト入団選手の `[キャリア1年目]` 表示、入団行の「たこ焼き団 にスカウト入団」、移籍行の「前所属 から 新所属 へ移籍」、クロニクルや殿堂入りに転生前タイトルが混ざらないこと）はユーザー委任。変更: src/management.js(Engine.career ヘルパ + buildSummary + milestone.get + chronicle 候補/archive + retirement.buildCareerSummary + awards 4 箇所 + hasWonTitle 3 箇所 約 200 行) + src/ui-common.js(戦績タブ表記 + inline filter 約 8 行) + src/ui-render.js(_isContestedBelt + _titleWinCount + 対抗戦フォールバック 約 5 行) + specs/career-history-spec-v1.0.md(§0 入団以降のみ仕様 約 35 行追加) + docs/game-system-roadmap.md(本項)。

前回: **F07 DEMAND_MAIN メインカード縛り 6 興行拡張（2026-05-02）。** F07 リーダーの横暴の DEMAND_MAIN incident で「権威を認めて派閥のメンバーをメインに推す」を選んだ後、現状は次の 1 興行のみ評価対象だった directive を **6 興行縛り**に拡張。プレイヤーの選択が「内政メーターの数字遷移」だけでなく「向こう 6 興行ぶん編成に縛りが入る」という運営面の体感に拡張される。①**FACTION_CONFIG 追加** (`src/data.js`): `f07DemandMainShows: 6`。②**directive 構造拡張** (`src/factions.js` `applyF07Choice` の `DEMAND_MAIN` A): 旧 `{factionId, type, expiresAfterShows:1}` → 新 `{factionId, type, remainingShows:6, totalShows:6}`。impactSummary にも「メインカード推薦期間 +6 興行」を表示、resultText も「向こう 6 興行のメインに推す」に書き換え。③**興行精算ロジック書き換え** (`src/app.js`): 各興行の精算で main にメンバーが含まれれば members trust +1、含まれなければ leader trust -2 を発火し、`remainingShows -= 1`。0 で directive 解除。④**バナー UI 拡張** (`src/ui-render.js`): 興行編成画面のバナーに「残り N/6 興行」を表記、緑（✓ 含まれる）/橙（⚠ 含まれない）の二状態は維持。⑤**spec/モックアップ同期**: `specs/faction-system-spec-v0.1.md` §9.7 に「DEMAND_MAIN incident の A 選択（メインカード縛り 6 興行）」節を追記、`docs/ui/mockups/faction-events-f05-f08-rework.html` の F07 注釈を v2.2 に改訂。⑥**検証**: auto-sim 50 シーズン×seed42 で violations 0 / errors 0 / Game overs 0 ALL CLEAR（2650 週）。実機の体感（残り興行数の表示・6 興行縛りで編成が窮屈になりすぎないか）はユーザー委任。変更: src/data.js(`f07DemandMainShows:6`) + src/factions.js(directive 構造拡張 + impactSummary 文面 約 5 行) + src/app.js(精算 decrement ロジック 約 10 行) + src/ui-render.js(バナー残り表示 約 5 行) + specs/faction-system-spec-v0.1.md(§9.7 追記) + docs/ui/mockups/faction-events-f05-f08-rework.html(注釈 v2.2) + docs/game-system-roadmap.md(本項)。

前回: **派閥イベント結果モーダル impactSummary 全箇所展開（2026-05-01）。** F07 のみ実装済だった `impactSummary`（結果モーダルの数値変動可視化）を F01/F02/F02_PEACE/F02_IGNITE/F02_RESOLUTION/F02_ENDLESS/F03/F04/F05/F05H/F06/F08 の全 12 箇所へ横展開。①**factions.js**: 各 `apply*` 関数の戻り値 `{state, resultText}` に `impactSummary: [{label, delta}, ...]` を追加。F01 A/B/C は派閥成立/拒否/静観で trust・bond・morale・CD を分けて表示、F02 A/B/C は対立度・勢い・士気・仲裁監視を、F03 dissolution/succession/turmoil は新リーダー・trust・bond・対立派閥勢いを、F04 A/B/C は転籍・寝返り判定・内紛フラグを、F05/F05H は分裂・活動休止を、F06 A/B は対立度減・bond・リーダー trust を、F08 A/C は次興行メイン・介入なしを、F02_RESOLUTION は勝者敗者の momentum/trust/求心力 bond/対立度/下位メンバー trust の 7-8 行を表示。乱数で決まる値はローカル変数に格納してから impactSummary へ転記し、表示と実効値の乖離を防ぐ。②**app.js**: `handleFactionEvent` 内 11 箇所の `showFactionEventResult` 呼び出しに `impactSummary: result.impactSummary || []` を配線（F07 のみ既配線）。③**検証**: auto-sim 100 シーズン × seed 42 で violations 0 / errors 0 / weeks 5300 / Game overs 0 ALL CLEAR。④**スコープ外**: §6 FACE⇄HEEL 遷移（character-data に heelAlignment フィールドが未実装で別 Phase）、Common-1/4/5/7 共通イベント（次タスク）。⑤**docs/ui/03-screens/faction-event-result.md** 既記の表（11 箇所が「impactSummary なし」）は今回の展開で全て解消、表示は実装側で先行。変更: src/factions.js(F01-F08 各 apply* 関数の戻り値に impactSummary 約 60 行追加) + src/app.js(11 箇所配線) + docs/game-system-roadmap.md(本項)。

前回（§6 アーキタイプ遷移）: spec `faction-archetype-rework-spec-v0.1.md` §6 のうち、heelAlignment フィールド未導入の FACE⇄HEEL を除く 3 遷移パターンを実装。①**flavor⇄archetypeId マッピング**: `Engine.factions._archetypeFromFlavor / _flavorFromArchetype` 新設、`createFaction` で `options.archetypeId || _archetypeFromFlavor(flavor)` を必ず faction に格納。既存 F07 ロジックは `f.archetypeId || _archetypeFromFlavor(f.flavor)` で後方互換。②**遷移ヘルパー** `Engine.factions._applyArchetypeTransition(state, factionId, toArchetype, ctx)`: flavor / archetypeId / 6 タグ群（authoritativeTag/bondTag/meritTag/heelTag/faceTag/combatTag）を一括書き換え、`lastArchetypeTransition` を faction に記録、`state._pendingArchetypeTransitions` キューに push。③**F07 rebuke 4 累積 → AUTHORITY → BOND/MERIT**: `advanceRebuke` を再構築し、threshold 到達 + AUTHORITY なら後継幹部候補（OVR 上位 3 名から fiery/grudging/bold/emotional 多数なら MERIT、それ以外 BOND）で分岐遷移。reasonKey は `AUTHORITY_TO_BOND_REBUKE` / `AUTHORITY_TO_MERIT_LEADER`。④**F02 完全敗北 → COMBAT → BOND**: `applyF02ResolutionResult` の決着処理に敗者 archetype チェックを追加、COMBAT なら BOND へ遷移（reasonKey: `COMBAT_TO_BOND_DEFEAT`）。⑤**遷移ナレーション**: `FACTION_TRANSITION_LINES`（reasonKey 4 種 × 性格 6 種 × {leaderLine, narration} = 48 行）を `src/data.js` に新設、`Engine.factions.getTransitionLine(reasonKey, leader, vars)` で引く。`{leader}` `{org}` 置換対応、テンプレ表現禁止で性格×遷移種別の温度を書き分け。⑥**UI モーダル**: `src/ui-common.js` に `showFactionArchetypeTransitionModal` 新設（fevt-overlay-office テーマ、from/to ラベル日本語化、リーダー直接セリフ + 黒田ナレーション）。⑦**消化フック**: `App._drainArchetypeTransitions` を `_drainFactionJoinNotices` と同パターンで新設、processWeek（F07 経路）/ finalizeShow（F02 完敗経路）双方から呼び出し。⑧**スコープ外**: FACE⇄HEEL 遷移は heelAlignment が character フィールドとして未実装のため別 Phase に切り出し（character-data-spec の改訂を伴う）。⑨**spec 更新**: `specs/faction-archetype-rework-spec-v0.1.md` を v0.3 に昇格、§6 に実装済/後送り明記、実装関数名（`_applyArchetypeTransition` / `getTransitionLine` / `_drainArchetypeTransitions`）を記載。⑩**検証**: auto-sim 自動フックで 100 シーズン × 5 シードを実行。手動 200 シーズン × seed 42 完走確認。UI 確認はユーザー委任（遷移モーダルの文面温度、F07-B 4 累積後の派閥が BOND 系イベントを引き始めるか、F02 完全敗北で COMBAT→BOND になった派閥が攻撃イベントを出さなくなるか）。変更: `src/data.js`(FACTION_CONFIG.archetypeTransition + FACTION_TRANSITION_LINES 約 130 行) + `src/factions.js`(`_archetypeFromFlavor`/`_flavorFromArchetype`/`_applyArchetypeTransition`/`_decideAuthoritySuccessorArchetype`/`getTransitionLine` 新設 + `createFaction` archetypeId 格納 + `checkF07Conditions` archetypeId フォールバック対応 + `advanceRebuke` 遷移トリガ追加 + `applyF02ResolutionResult` COMBAT→BOND フック 計約 130 行) + `src/ui-common.js`(`showFactionArchetypeTransitionModal` 約 70 行) + `src/app.js`(`_drainArchetypeTransitions` + processWeek/finalizeShow 接続 約 25 行) + `specs/faction-archetype-rework-spec-v0.1.md`(v0.2→v0.3 §6 実装完了反映) + `docs/game-system-roadmap.md`(本項)。

前回: **派閥アーキタイプ拡張 Phase B — F07 v0.4 共通フレーム化（2026-05-01）。** Phase A の 6 種アーキタイプ判定基盤の上に、F07「リーダーの横暴」を「全アーキタイプ共通の派閥動向イベント」へ刷新。①**FACTION_CONFIG 9 項目追加** (`src/data.js`): `f07TeamCooldown:12 / f07FactionCooldown:36 / f07IncidentMatrix`(6×7-12 重み) / `f07RecentIncidentKeep:2 / f07DemandSubCooldown:32 / f07DemandMoneyCooldown:48 / f07PostRebukeQuiet:24 / f07ArchetypeBias` / `f07DemandMoneyMultiplier:1.10`。②**F07 抽選ロジック再構成** (`src/factions.js` `checkF07Conditions`): `authoritativeTag === true` 制約を撤廃し `archetypeId` ベースに刷新、チーム全体 12 週 CD で総量抑制、テンションスコア(`leader.trust*0.3 + 経過週*0.5 + アーキタイプバイアス`)による発動派閥重み付き抽選、アーキタイプ × incidentType マトリクスから連続出現禁止 + サブ CD 反映で incidentType 抽選、`_selectF07IncidentPayload` で対象選手を簡易選定(rivalry 高め・OVR 順・全員)、`_markF07Trigger` で履歴とチーム/派閥/サブ CD を一括更新。③**applyF07Choice 拡張**: 旧 3 択 (A/B/C) を **12 種 incidentType × choice (2-3)** の分岐に拡張。新規 incidentType 5 種(DEMAND_RECOGNITION / OBSERVE_INTERNAL_RANK / OBSERVE_FAN_PRESSURE / OBSERVE_TRAINING_HARD / INCIDENT_HEEL_PROVOKE)を実装、rebukeCount 進行を観察型 C・INCIDENT_BOUNDARY A 等に拡張、4 累積で AUTHORITY のみ authoritativeTag 剥がし + 24 週 quiet。DEMAND_MAIN A は `state._pendingF07Directive` フラグ立てのみ(Phase C 分離)、DEMAND_MONEY A は trust ボーナス + 結果モーダルにスタブ表記のみ(Phase D 分離)。返り値に `impactSummary` 配列を追加。④**F07_LINES セリフテーブル新設** (`src/data.js`): `leaderDemand / coachReport / resultLeader / resultTarget` の 4 カテゴリ、性格 6 種(bold/introverted/carefree/earnest/emotional/shy)対応。`DEMAND_MAIN / OBSERVE_RIVAL_HEAT / INCIDENT_BOUNDARY` の 3 種をフル品質、残り 9 種は `_any` プレースホルダ。`Engine.factions.getF07Line(category, ctx)` ヘルパ追加。⑤**showFactionF07Modal 刷新** (`src/ui-common.js`): `_F07_INCIDENT_META` テーブルで 12 種 incidentType の(タイトル/絵文字/源/選択肢ラベル+ヒント)を一元管理、`modalShape='choice2'` (INCIDENT_*) と `'choice3'` を出し分け、観察・インシデント型はコーチ報告ナレーション主軸、要求型はリーダー直接セリフ。⑥**showFactionEventResult 新シグネチャ** (`src/ui-common.js`): 旧 `(resultText:string, onClose)` から `({eventId, category, resultText, charId, charName, charLine, impactSummary, weekLabel}, onClose)` へ拡張、第 1 引数が string なら旧表示で動く後方互換維持。F07 のみ新シグネチャに移行(他 12 箇所は旧シグネチャのまま)。`charLine` (リーダー反応セリフ) と `impactSummary` (影響行リスト) を追加表示。⑦**app.js F07 結果連携**: `app.js:8855` の F07 結果モーダル呼び出しを新シグネチャへ移行、`getF07Line('resultLeader')` でリーダー反応セリフ、`getF07Line('resultTarget')` で対象選手反応セリフを引いて結合。⑧**検証**: auto-sim 200 シーズン × seed 42 で violations 0 / errors 0 / Game overs 0 ALL CLEAR。⑨**やらないこと（次フェーズ送り）**: F01 入口モーダルのアーキタイプ別前置き文、Common-3 加入通知モーダル、結果モーダル他 12 箇所(F08/F01/F04/F06/F02/F03/F05)の段階移行、F07_LINES 残 9 種の品質投入、アーキタイプ遷移ロジック(F07 B 4 回 / F07 C / F02 完敗)、Phase C(DEMAND_MAIN 興行編成連動)、Phase D(DEMAND_MONEY 給与改定 economy 接続)。変更: `src/data.js`(FACTION_CONFIG 9 項目 + F07_LINES 約 200 行) + `src/factions.js`(`checkF07Conditions` 全面書き直し + `_selectF07IncidentPayload`/`_markF07Trigger` 新設 + `applyF07Choice` 12×choice 分岐 + `getF07Line` ヘルパ 計約 350 行) + `src/ui-common.js`(`_F07_INCIDENT_META` テーブル + `showFactionF07Modal` 刷新 + `showFactionEventResult` 新シグネチャ 計約 180 行) + `src/app.js`(F07 結果連携 約 25 行) + `specs/faction-f07-variation-spec-v0.1.md`(v0.4→v0.5 実装完了昇格) + `docs/game-system-roadmap.md`(本項)。

前回: **派閥アーキタイプ拡張 Phase A — 6種フレーバー判定（2026-05-01）。** F07「リーダーの横暴」が権威型派閥にしか発動しない問題と、結果モーダルの殺風景表示を発端とした派閥システム再設計の足場として、F01 派閥成立時のアーキタイプ判定を 3 種（bond_first / meritocratic / neutral）から **6 種**（authoritarian / bond_first / meritocratic / heel / face / combat）に拡張。①**仕様書 3 本起票**: `specs/faction-archetype-rework-spec-v0.1.md` v0.2（6 アーキタイプ・属性は確率バイアスでハード足切りなし・実力主義は OVR 偏重抑制）/ `specs/faction-f07-variation-spec-v0.1.md` v0.4（F07 を全アーキタイプ共通フレーム化・チーム全体12週CD・アーキタイプ × incidentType マトリクス）/ `specs/faction-common-events-spec-v0.1.md`（共通イベント Common-1/3/4/5/7・既存 F01〜F08 と被らない日常軸）/ `docs/ui/03-screens/faction-event-result.md`（結果モーダル新仕様）。②**Phase A 実装範囲**: `src/factions.js` `_scoreFactionFlavor` を 6 アーキタイプ採点に拡張（OVR 分散・bond 非対称性・role 集計（Heel/Babyface ratio）・性格 archetype 集計（fiery/flippant/bold ratio）の指標を導入）、`_decideFactionFlavor` の優先順位ロジック（HEEL/FACE > MERIT > COMBAT > AUTHORITY > BOND）、`createFaction` に 5 種の archetype タグ（bondTag/meritTag/heelTag/faceTag/combatTag）を追加、`rollWeeklyEvent` F01 で archetype を payload に同梱、`applyF01Choice` で payload.archetype に基づいて適切なタグを設定（A 選択時の bond/士気増減もアーキタイプ別に分岐）、`_archetypeToTagOptions` / `_archetypeF01Effect` / `_archetypeLabel` ヘルパ新設。③**マイグレーション**: `src/app.js` で旧 `flavor='neutral'` を再判定（authoritativeTag 持ちは authoritarian へ、それ以外は bond_first へ）+ archetype タグの整合化（`_migrated_archetype_v2` フラグで一回限り実行）。④**UI**: `src/ui-render.js` `_dfcFlavorTag` を 6 種ラベルに対応（権威型/結束型/実力主義/ヒール派閥/正統派/武闘派、自然型は廃止）、`src/index.html` `.db-faction-flavor-badge` に 6 種のアクセントカラー（authoritarian:gold / bond_first:teal / meritocratic:yellow / heel:purple / face:blue / combat:orange）を CSS 追加。⑤**検証**: auto-sim 50シーズン×seed42 + 30シーズン×seed12345 すべて ALL CLEAR（violations:0, errors:0）。⑥**やらないこと（次フェーズ送り）**: F01 入口モーダルのアーキタイプ別前置き文（spec §5.1）、F07 v0.4 マトリクス実装、Common-1/3/4/5/7 共通イベント実装、アーキタイプ別専用イベント、結果モーダル `showFactionEventResult` 全面刷新（13箇所の呼び出し移行）、Phase B 加入判定への属性適合度バイアス適用、アーキタイプ遷移ロジック。⑦**残課題**: (a) F01 入口モーダルでアーキタイプを開示する文面整備、(b) F07 v0.4 共通フレーム実装（チーム全体 12 週 CD + テンションスコア発動派閥選定 + アーキタイプ × incidentType マトリクス抽選 + 性格別セリフテーブル）、(c) Common-3 加入通知モーダル（最小スコープ・既存自動加入処理に通知フックを足すだけで成立、セリフテーブル 48 件投入）、(d) 結果モーダル新仕様適用、(e) アーキタイプ別 F02 抗争・F08 直接対決の組み合わせフィルタ。変更: specs/faction-archetype-rework-spec-v0.1.md(全面書き直し v0.2) + specs/faction-f07-variation-spec-v0.1.md(v0.4 全面書き直し・アーキタイプマトリクス対応) + specs/faction-common-events-spec-v0.1.md(新規) + docs/ui/03-screens/faction-event-result.md(新規) + src/factions.js(`_scoreFactionFlavor` 6 種採点 + `_decideFactionFlavor` 優先順位 + `createFaction` archetype タグ + `rollWeeklyEvent` F01 archetype 同梱 + `applyF01Choice` archetype 別効果 + `_archetypeToTagOptions`/`_archetypeF01Effect`/`_archetypeLabel` 新設 約120行) + src/app.js(`_migrated_archetype_v2` マイグレーション 約25行) + src/ui-render.js(`_dfcFlavorTag` 6 種対応) + src/index.html(`.db-faction-flavor-badge.flv-*` 6 種カラー) + CLAUDE.md(specs 索引 3 件追加) + docs/game-system-roadmap.md(本項)。

前回: **戦闘エンジン v5.2 — Tier1 ダメージカーブ再調整（2026-05-01）。** Replay 統一(commit 8221b3a)以降、Tier1 Opening で dmg≥15 クリティカルが連発し「ミスか大ダメか」の二択的展開で起承転結が消失していた問題を解消。①**変更点**: `src/data.js` `PHASES.mult` を `0.90/1.05/1.20/1.40` (Opening/Mid/End/Climax) → **`0.60/0.85/1.05/1.30`** に変更。Opening を 0.60 に下げて序盤を「ジャブ・応酬」中心の小競り合いに、Mid/End/Climax は段階的に上昇させて起承転結を回復。②**据え置き範囲**: BIGMATCH_PHASES (Tier2)、フェーズ閾値(min/max/sCh/counterBonus)、ENG 定数、`dmgRandMin/Range`、すべて `mult` 以外は触らない。③**実測値（OVR 80互角・Tier1 通常マッチ・2000試合）**: 平均ターン数 11.8T→**12.65T**(+0.85T)、TO率 5.4%→**8.5%**(+3.1pp)、ヘボ率(≤5T) 0.3%→**0.0%**、OVR差20番狂わせ率 12.0%→**10.3%**(-1.7pp)。④**TO率 8.5% の設計判断**: Opening 火力低下で MAX_T=16 内決着できない試合が増えた結果。「メインイベント・ビッグマッチ以外は引き分けが増える」というドラマ的演出として許容、ビッグマッチ(Tier2 / MAX_T=24)は決着重視で従前通り。⑤**検証**: auto-sim 50シーズン×seed42 + 30シーズン×追加3シード(12345/54321/99999) すべて ALL CLEAR(violations:0, errors:0)。⑥**別ブランチ作業**: `feature/damage-curve-rebalance` で実装、main にマージ。実機での体感確認（Opening のジャブ感 / Climax での決着の重み）はユーザー委任。変更: src/data.js(PHASES.mult のみ) + specs/battle-engine-spec-v4.2.md(変更履歴 v5.2 追加) + test/_damage-curve-v5_2.js(新規・プロファイリング) + docs/game-system-roadmap.md(本項)。

前回: **派閥対決強化 Phase B-2 — 派閥画面 v0.9 完全リデザイン + F09 演出モーダル4種（2026-05-01）。** Phase B (commit d10754c) で残課題化していた v0.9 完全リデザインと F09 演出を実装。①**派閥画面 v0.9 完全書き換え**: `src/index.html` の Phase B 暫定 CSS (`.feud-section` 等) を撤去し、mockup-faction-screen-v0.9.html 準拠の Faction Tab v0.9 CSS 約400行を新設（`.dfc` ダークカード / `.dfc-hero` Hero 78×96px + 派閥名22px + OVR/POP / `.dfc-pp` RIVALRY POINTS バー / `.dfc-roster-row` 2ND/3RD 対比配置 / `.dfc-rankfile-tiles` 50×64px タイル+OVRオーバーレイ / `.dfc-narrative` FACTION CHRONICLE / `.dfc-stats` 2列 / `.dfc-foot` メーター / `.feud-duel` 1fr|96px|1fr グリッド / `.feud-axis` VS+GOAL+spine+HISTORY / `.feud-timeline` HISTORY 展開部 / `.dfx-grid-neutral` 中立 3列）。②**`_renderDbFactions` 全面書き換え**: 旧 `renderFactionCard` (db-faction-card 系) を撤去し、サブ関数群 `_dfcRenderCard` (in-feud / left-right / 中立 で分岐)、`_dfcChronicle`（黒田ナレーション・テンプレ駆動）、`_dfcRenderFeudAxis`（VS/WEEK/GOAL/F09バッジ/HISTORY トグル）、`_dfcRenderFeudTimeline`（factionTimeline から F02/Match/F08/F09/RIVALRY_CLOSED マーカーを直近6件 + NOW で時系列表示）、`_dfcRenderFeudDuel`（左右カード + 中央軸 + HISTORY 展開）に分離。抗争中ペアは中央 96px VS 軸対称配置、左カードは右端起点 / 右カードは左端起点で pt バーが中央軸に向かって伸びる構造。中立派閥は3列グリッドで縮小版（pt bar / CHRONICLE なし、Stats 1列）。F09 接近バッジ (hostility ≥60) / F09 発火圏バッジ (hostility ≥65) を中央軸 VS の下に配置。レスポンシブ: 900px 以下で対決グリッドが縦積み + 中立 2列に。③**F09 セリフテーブル 7種**: `data-faction-dialogue.js` に `FACTION_F09_OPENING_LINES_A/B`（リーダー宣戦・性格6×アーキタイプ別）、`FACTION_F09_MATCH_PRE_LINES`（軽量試合前）、`FACTION_F09_MATCH_POST_WIN_LINES`/`LOSE_LINES`（試合後勝者敗者・軽量）、`FACTION_F09_ENDING_WIN_LINES`/`LOSE_LINES`（総括・性格別）を新設。F08 と同じ hostility 帯 (high/mid/low) 形式で `_getF08LineByBand` 流用可能な構造。④**F09 演出モーダル4種**: `ui-common.js` に `showFactionF09OpeningModal` (両派閥全メンバー並列ポートレイト + 両リーダー宣戦)、`showFactionF09MatchPreModal` (各試合の軽量 confrontation・「第N試合 / 全M試合」表示)、`showFactionF09MatchPostModal` (勝者大ポートレイト + 敗者小 + 現在スコア表示)、`showFactionF09EndingModal` (勝ち越し派閥スポット + 両リーダー総括 + 勝ち越しボーナス +15PT 表示) を新設。F08 ダークアリーナテーマ（`fevt-overlay-arena` / `fevt-arena-card`）を流用、tension BGM + gong SFX で連結。⑤**興行フロー組込**: `app.js` finalizeShow で sweep ボーナス計算後に `_pendingF09Ending` をセット → showResult 直前に `drainF09Ending` → `drainF08Aftermath` → `renderShowResult` の順で消化。試合前フローでは _f09Locked 試合の手前で MatchPre モーダル発火、興行内最初の F09 試合では Opening を先行連結。試合後フローでは `_runPostMatchFlavorForMatch` 冒頭で F09 MatchPost を popup 群より先に表示。`App._buildF09OpeningData` / `_buildF09MatchPreData` / `_buildF09MatchPostData` / `_f09PickLine` ヘルパ新設、性格×アーキタイプ×high/mid/low の3階層フォールバックでセリフ抽選。⑥**検証**: auto-sim 30シーズン×seed42 走行で破綻無し。UI 実機検証はユーザー委任。⑦**残課題**: (a) F11 派閥宣戦布告 (Phase C)、(b) FACTION CHRONICLE 黒田ナレーションのテンプレ本数拡充（現状2パターン、推奨10）、(c) HISTORY タイムラインの最大表示マーカー数調整（現状直近6件）、(d) F09 演出の BGM 音源（試合系ダーク BGM の専用化）、(e) MatchPost モーダルの ptDelta 算出（現状0表示）。変更: src/index.html(Faction Tab v0.9 CSS 約400行/`--pop-pink`既存維持) + src/ui-render.js(`_renderDbFactions` 全面書き換え + サブ関数 `_dfcRenderCard` / `_dfcChronicle` / `_dfcRenderFeudAxis` / `_dfcRenderFeudTimeline` / `_dfcRenderFeudDuel` 等 約350行) + src/data-faction-dialogue.js(F09 セリフテーブル 7種 約240行) + src/ui-common.js(F09 モーダル4種 約240行) + src/app.js(F09 Opening/MatchPre/MatchPost/Ending フック + ヘルパ群 約130行) + docs/ui/03-screens/factions.md(実装状況更新) + docs/game-system-roadmap.md(本項)。

前回: **PPV 頂上決戦 新聞記事リッチ化（2026-05-02）。** ユーザ指摘「頂上決戦の新聞見出しが『vs 相手団体』だけで誰が誰と戦ったか伝わらない」「本文が『○○の勝利に終わった。MQ81』とスタッツ羅列で軽く、メインイベントの記事として薄い」を一括対応。①**ペイロード拡張**: `app.js` finalizePPV の `_newsSummitResult` に `playerInvolved/winnerName/winnerId/loserName/loserId/playerOrgName/aiOrgName/finType/finMove/finishPhase/turns/winnerHpFinal/winnerHpMax/loserHpFinal/loserHpMax/playerRank/aiRank/priorH2h/winnerLine` を追加（h2h更新前のタイミングで `Engine.h2h.getRecordFor` から prior 記録取得、`PPV_SUMMIT_VICTORY_LINES` から勝者セリフ抽選）。後方互換のため `opponentName/playerName/aiName/won/mq` は残置。②**見出し7パターン**: 因縁(過去3戦+MQ80+) / 死闘(HP残<18%+MQ80+) / 名勝負(MQ80+) / 圧勝(HP残≥55%) / 接戦(HP残<18%) / 自団体敗北 / 通常 — 全パターンで両選手名を必ず明示、「vs 相手団体」表記を廃止。③**本文5要素**: 舞台設定(ランキング順位付きカード)→試合内容(ターン数+接戦/圧勝の文体スイッチ+フェーズ+`Engine.formatFinish`+HP残量演出)→格付け(MQ別4段階)→因縁(priorH2h.matchesで分岐)→勝者セリフ(自団体勝利時のみ)。④**仕様書反映**: `specs/ppv-grand-final-spec-v2.0.md` に §13「新聞記事生成（頂上決戦）」を追加（ペイロード表/見出しテンプレート表/本文構成/設計原則対応）。⑤**スコープ外**: 試合数値ロジックには触らないため auto-sim 不要。`node --check` で構文エラーなし確認。残: ブラウザ実機で実際の頂上決戦記事が新しい見出し・本文構成で表示されること、特に接戦/圧勝/因縁分岐の文体差をユーザに目視確認依頼。変更: src/app.js(`_newsSummitResult` ペイロード拡張) + src/management.js(storyMaker §頂上決戦結果 リライト・約100行) + specs/ppv-grand-final-spec-v2.0.md(§13 追加) + docs/game-system-roadmap.md(本項)。

前回: **派閥対決強化 Phase B — 抗争ポイント制 + F09 派閥対抗戦（2026-05-01）。** `docs/handoff-faction-confrontation-plan-v0.2.md` §5 Phase B のスコープを実装。①**仕様書 v0.3 確定**: `specs/faction-rivalry-points-spec-v0.1.md` を3版改訂（v0.1初版→v0.2 補正を加算式化＆派閥規模倍率廃止＆1興行ペア試合上限2＆週次キャップ20pt 追加→v0.3 決着優先順位「先取100最優先」確定 / F06 を A/B 2択化（C 棚上げ削除）/ F09 hostility 70→65緩和 / F09 後半補正1年目 1.0→1.1 / 敗者ペナルティ緩和 momentum-30→-25, trust リーダー-8/末端-3 差別化, F04F05確率×2→×1.5 / F09 接近バッジ閾値65→60）。②**データモデル + ポイント計算**: `data.js` `FACTION_CONFIG` に Phase B パラメータ約30項目追加（pointsByRank top10/second6/third4/filler2、補正加算 メイン+0.3/タイトル+0.2/下剋上+0.2/タッグ-0.5、pointsResolutionThreshold:100、pointsForceCloseWeeks:40、pointsNaturalCalmWeeks:4、f09HostilityMin:65、f09Cooldown:52、f09PointsMult:1.8、f09SweepBonus:15、勝者敗者効果一式）。`factions.js` に `_pairKey` / `_ensureRivalryPointsEntry` / `accrueRivalryPointsFromMatch`（素点×加算式補正×F09倍率、週次20ptキャップ）/ `_getFactionMatchRank` / `checkRivalryResolution`（先取100最優先→消滅→40週→自然沈静化）/ `applyRivalryVictory`（reason別 POINTS/CALM/CONSOLATION）/ `checkF09Conditions`（hostility65/OVR上位5名差15%/momentum-20/cooldown52）/ `_topNOvrSum` / `_f09LateGameMult` / `buildF09MatchPairs`（OVR順位マッチ・3〜5試合）/ `applyF09SweepBonus`（勝ち越し+15pt）を追加。③**興行配線**: `management.js` tickWeek 派閥パイプラインに `checkRivalryResolution` 組込み（pending イベント無時のみ）+ 興行週・F09条件成立時に baseChance 0.25×後半補正 で `_pendingF09` 設定。`finalizeShow` から `accrueRivalryPointsFromMatch` を全試合に対して呼出（タッグはチーム代表fighter1）。④**F09 showCard hijack**: `ui-render.js` 興行準備画面で `_pendingF09` 検出時に `buildF09MatchPairs` でメインから順に3〜5枠を `_f09Locked: true` で強制ロック、ロック対象選手を他枠から自動除去。`app.js` finalizeShow F08 directive 直後に F09 sweep ボーナス適用 + `factionTimeline` に F09_RESOLVED エントリ + `_pendingF09` クリア。⑤**派閥画面 Phase B 最低限可視化**（B案実装 — 完全 v0.9 リデザインは別タスク）: `index.html` `:root` に `--pop-pink:#d4538a` / `--pop-pink-light:#f0a0bf` / `--accent-blood:#8a1f1f` / `--accent-hostility-deep:#6a2818` 追加、Faction Tab v0.9 用 CSS 約100行新設（.feud-section / .feud-pair / .feud-axis / .feud-pt-bar / .feud-spine / .feud-near-badge）。`ui-render.js` `_renderDbFactions` 冒頭に「⚔ 抗争中」セクション挿入: 左右ダーク派閥カード（リーダー名 + ptバー + ptテキスト）+ 中央軸（VS / W週数 / 血のspine / GOAL 100 / F09接近中バッジ hostility60+ / F09発火圏バッジ hostility65+）。⑥**検証**: auto-sim 50シーズン×シード42 ALL CLEAR (violations:0 / errors:0 / weeks:2650 / elapsed:193s)。⑦**やらないこと（Phase B 範囲外）**: F09 セリフテーブル新設、F09 オープニング/各試合前後/エンディングモーダル4種、派閥画面の v0.9 完全リデザイン（FeudDuelGrid / FactionCard 対比配置 / 2ND・3RD ミラー / RANK&FILE タイル / FACTION CHRONICLE 黒田ナレーション / Timeline 展開 / 中立カード3列グリッドの v0.9 化）— これらは「Phase B-2 完全リデザイン」として下記次セッション予定に記載。⑧**残課題**: (a) 派閥画面 v0.9 完全リデザイン（mockup-faction-screen-v0.9.html / docs/ui/03-screens/factions.md 準拠）、(b) F09 演出モーダル4種、(c) F11 派閥宣戦布告 (Phase C)。変更: specs/faction-rivalry-points-spec-v0.1.md(新規・v0.3確定) + src/data.js(FACTION_CONFIG Phase B項目) + src/factions.js(_pairKey/accrueRivalryPointsFromMatch/checkRivalryResolution/applyRivalryVictory/checkF09Conditions/buildF09MatchPairs/applyF09SweepBonus 等 約290行) + src/management.js(tickWeek+F09発火検出) + src/app.js(finalizeShow F09 sweep ボーナス) + src/ui-render.js(F09 showCard hijack + 派閥画面抗争中セクション) + src/index.html(--pop-pink トークン+Faction Tab v0.9 CSS) + docs/game-system-roadmap.md(本項)。

前回: **派閥画面リデザイン Phase A' — Mockup 確定 + 階層3 画面仕様書化（2026-05-01）。** `docs/handoff-faction-confrontation-plan-v0.2.md` §4 Phase A' のスコープ（Mockup → 仕様化、実装は Phase B）を完了。①**Mockup 反復**: v0.1（初版・Office Cream基調）→ v0.2（フラット縦リスト/2層グリッド/マスター・ディテールの3案比較）→ v0.3（ダーク化＋対決感3案＋一覧B派生3案）→ v0.4（PAIR-A確定・強制和解残バー削除・中央飾り削除・実画像入り）→ v0.5（中央軸揃え/OVR大/人気値追加/ダーク派生）→ v0.6（中央対比構造/カード内ptバー/中央軸spine）→ v0.7（B1-A Part4 ベース・2カード横並び+96px中央VS軸）→ v0.8（2ND/3RD対比配置/RANK&FILE画像タイル+OVRオーバーレイ/解説テキスト4バリエーション A:派閥叙述・B:直近試合フィード・C:注目選手スポットライト・D:戦略レポート）→ **v0.9 確定版**（VAR A 黒田ナレーションのみ・キャラ台詞除去で量産コスト最小化＋中立派閥は v0.7 構造踏襲）。②**確定構造**: 抗争中ペア=左右ダークカード+中央96px VS軸（VS/GOAL 100/血のspine/HISTORY展開トグル）、各カードに RIVALRY POINTS バーを内蔵（左カードは右端起点で左、右カードは左端起点で右へ伸びて中央軸でぶつかる）、Hero（リーダー画像78×96+派閥名22px+OVR/POP）→ pt bar → 2ND/3RD（中央軸側 portrait・中央 stats・外側 name の対比配置）→ RANK&FILE（画像タイル50×64+右下OVRオーバーレイ・能力値詳細省略）→ FACTION CHRONICLE（黒田ナレーション2-3段落、台詞なし）→ Stats 4項目 → Foot メーター。中立派閥は3列グリッド（同構造の情報量縮小版・pt bar/CHRONICLE なし）。③**派閥3つ以上の表記論点**: 抗争ペアは Phase B 仕様で1組のみ前提と確認、中立派閥は3列グリッドで折り返し対応。④**仕様化**: `docs/ui/03-screens/factions.md` 新規作成 — 階層3テンプレート準拠（基本属性/目的/遷移/骨格ワイヤー/構成要素/情報階層/特有ルール/状態バリエーション/関連トークン/階層1・2参照/実装段取り/未決事項）。FACTION CHRONICLE の黒田ナレーション量産戦略（派閥状態スロットを埋めるテンプレ駆動・キャラ性格×アーキタイプの組合せ膨張を回避）を明文化。⑤**Foundations 更新**: `docs/ui/01-foundations.md` §1-8 アクセントカラー表に新規 `--pop-pink: #d4538a`（人気値数値色・Bebas Neue）/ `--pop-pink-light: #f0a0bf`（★アイコン薄色版）を追記。⑥**Phase B 接続点を明文化**: `G.factionRivalryPoints[pairKey].pointsA/B` を pt バーに、`FACTION_CONFIG.pointsResolutionThreshold` を GOAL に、`G.factionTimeline[factionId]` を HISTORY タイムラインに紐付け。F09 接近中バッジは hostility 両方向 ≥ 65 仮置き（Phase B で確定）。⑦**未決事項**: 黒田ナレーションテンプレ本数（最低5/推奨10）/ F09 接近バッジ閾値 / HISTORY タイムライン最大表示数 / 中立カードクリック時の詳細パネル設計 / RANK&FILE タイル最大数 / 決着間際演出案 — いずれも Phase B 着手時に詰める。⑧**スコープ外**: 実装は Phase B、本セッションでは src/ コードに触れない（コード変更は `docs/ui/01-foundations.md` トークン定義表のみ）。`handoff-faction-confrontation-plan-v0.2.md` は Phase B/C も含むため引き続きアクティブ、アーカイブ移動はしない。次セッション着手予定の Phase B = `factionRivalryPoints` データモデル + `accrueRivalryPointsFromMatch` + 決着判定 + 派閥画面リデザイン実装 + F09 派閥対抗戦。変更: docs/ui/mockups/mockup-faction-screen-v0.1〜v0.9.html(9版・v0.9が確定版)+docs/ui/03-screens/factions.md(新規・階層3テンプレ準拠)+docs/ui/01-foundations.md(§1-8 `--pop-pink`/`--pop-pink-light` 追記)+docs/game-system-roadmap.md(本項)。

前回: **新聞 業界ニュース拡充 + 因縁列伝 v1.1 — bond/rivalry/派閥/奪還を新聞と因縁列伝に立体化（2026-04-30）。** 「業界ニュース欄が興行関連ばかりで関係性ドラマが流れない」「因縁列伝の語り口が静的で、v2.2/v2.3 のイベントが反映されていない」というユーザ指摘を一括対応。①**業界ニュースキュー新設**: `state._industryNewsEvents` を導入し `Engine.industryNews.push(state, ev)` (engine 側) / `App._pushIndustryNews(ev)` (UI 側) でキュー投入。`Engine.newspaper.generate` の末尾でキューを stories に変換、`NEWS_HEADLINE_TEMPLATES` から黒田トーンの本文を抽選。`_industryNewsEvents: []` を tickWeek 内 `weeklyNewspaper` 生成直後にクリア(週次消化)。②**新type追加 (12種)**: `lockerRoomCrisis` / `hatredContagion` / `relationshipRepair` / `relationshipRepairFail` / `factionFormed` / `factionEscalation` / `factionResolution` / `factionDissolution` / `factionSplit` / `reclaimChallenge` / `reclaimSuccess` / `reclaimFailure` / `firstMeetSinceDeparture` をテンプレ化、PRIORITY 表に追加(派閥抗争=125 / 奪還成功=120 / 派閥成立=90 / ロッカー荒廃=75 / 修復=68 / 嫌悪伝染=50 等、王座交代=130 と興行=120 の中位帯に配置)。③**フックポイント**: `relationships.js` P-4 ロッカー荒廃直後 / `management.js` P-6 修復チャネル成功・失敗 / `app.js` handleFactionEvent 各 applyFXX 後 / `app.js` confirmReclaim・奪還試合結果 / 試合 h2h.update 直前(B-3 元同僚初対面検出時)。④**因縁列伝 v1.1 — h2h.history メタデータ拡張**: `Engine.h2h.update` に第13引数 `meta = { betrayal, factionWar, lockerStress, reclaim }` を追加、history entry に `bt/fc/lc/rc` フラグを刻む。`App._buildMatchMeta(state, idA, idB, isReclaim)` ヘルパーが `Engine.orgTimeline.checkFirstMeetSinceDeparture` / `Engine.factions.getFactionByFighterId` / `state._lockerCrisisWeek` を参照して meta を構築、player show / war / ppv の3経路から渡す。⑤**因縁列伝 v1.1 — context-aware narrative**: `KURODA_RELATION_NARRATIVE[tag].contexts[ctxTag]` の2階層化、5 context (`betrayed/factionWar/lockerStress/repaired/reclaiming`) × 9象限のうち意味的に成立する組合せに語り口プールを追加(計 23 セル / headlines・bodies 各 ~3本ずつ / 約100文)。例: `pure_hatred.betrayed` 「ベルトを抱えて去った日から、戻れない関係」/ `fated_admiration.repaired` 「一度断ち切れた糸を、結び直した二人」/ `destined_rival.reclaiming` 「奪われたベルト、奪い返す夜」。`ui-render.js` の `_renderRivalryFeatured` で context 優先・ない場合は default tag pool にフォールバック。⑥**因縁列伝 v1.1 — featured 選出 event boost**: `_pickRivalryFeatured` の `dramaTagBonus` に加えて `contextBoost = { betrayed: 25, reclaiming: 20, factionWar: 15, repaired: 10, lockerStress: 5 }` を score 加算。裏切り離脱直後・奪還挑戦中のペアが featured に上がりやすくなる。⑦**因縁列伝 v1.1 — 視覚キュー**: featured panel の facts 行に context バッジ(⚠ 元同僚 / ⚔ 派閥抗争中 / ❄ ロッカー荒廃中 / 🤝 修復後 / 🏆 奪還挑戦戦線)、history rows に対戦個別バッジ(bt/fc/lc/rc)を `stageBadge`/`titleBadge` と並べて表示。⑧**`_repairedAt` ペア記録**: 修復チャネル成功時 `state.h2h[key]._repairedAt = { season, week }` を刻む(`_deriveRelationContext` が直近2シーズン以内なら `repaired` を返す)。⑨**スコープ外**: P-2 中間嫌悪帯成立 / P-7 険悪可視化の毎週ニュース化(snapshot で十分)、AI団体内派閥イベントの news 化(`factions.js` は player org のみ)、tag-match の B-3 個別判定、修復後の bond/rivalry 自動再分類(featured boost のみで対応)。検証: 各JSのシンタックスチェック OK、auto-sim 100シーズン(seed=7919) ALL CLEAR (violations:0, errors:0, weeks:5300, elapsed:574s)、ブラウザロード後 `Engine.industryNews` / `NEWS_HEADLINE_TEMPLATES.firstMeetSinceDeparture` / `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.betrayed` が存在することを確認。残: ブラウザ実機で(a)派閥や奪還、修復のイベント発生後に新聞1面の業界ニュース欄に該当記事が出ること、(b)因縁列伝3面の featured が context 別の語り口に切り替わること、(c)history バッジ(⚠/⚔/❄/🏆) が正しく出ること、をユーザに目視確認依頼。変更: src/data.js(`NEWS_HEADLINE_TEMPLATES` 12種追加・約60エントリ)+src/management.js(`Engine.industryNews` 新設+`Engine.newspaper.PRIORITY` 13種追加+`Engine.newspaper.generate` キュー消費+ tickWeek `_industryNewsEvents` clear+`_repairedAt` 刻印+execute 結果に `_industryNewsEvents`/`h2h` propagate)+src/relationships.js(`Engine.h2h.update` meta 引数追加+P-4 ロッカー荒廃フック)+src/app.js(`App._pushIndustryNews`/`App._buildMatchMeta`+ handleFactionEvent F01/F02/F02_RESOLUTION/F03/F05 フック+ confirmReclaim/奪還結果フック+ player/war/ppv h2h.update に meta 渡し+ executeDecision に h2h/`_industryNewsEvents` マージ)+src/kuroda-text.js(`KURODA_RELATION_NARRATIVE` に `contexts` ブロック 9象限分追加・約23セル/100文)+src/ui-render.js(`_deriveRelationContext` ヘルパー+`_classifyRelation` の score に contextBoost+`_renderRivalryFeatured` で context narrative 優先+context バッジ+history `eventBadges`)+docs/game-system-roadmap.md(本項)。

前回: **戦闘エンジン v5.1 — 能力値バランス調整（パターンB導入、2026-04-30）。** v5.0 直後の検証で「ST が突出（+30勝率68.4%、PW 66.2%より+2.2pp）」「PW/SP/TE/ST の標準偏差1.36pp」「SP/TE の効果が試合長依存で薄れる」「MN が60.0% で防御役として一段下」という非対称が判明。①対応1: ダメージ係数微増（dmgPwrScale 0.24→0.27、dmgTec/SpdScale 0.10→0.115）、defStaScale 0.03→0.025 で ST 防御寄与抑制。②対応2: **MN 終盤粘り** — End/Climax フェーズで MN50超過分から `dmg × (1 - max(0,(def.mn-50)/100) × 0.08/0.12)` を乗算（シングル・タッグ両方）。③対応3: **パターンB（試合開始時ボーナス）** — SP/TE の毎ターン積算効果は試合長依存で薄れる構造的問題を解決するため、シングルマッチ開始時に `mom += (teGap+spGap)×10 + pwGap×8`、先攻3ターンで命中率に `±(teGap+spGap)×15`、PW優位側攻撃時の相手カウンター率に `-pwGap×10`。④検証実測値（5,000試合）：1能力=100/他=80（差+20、通常）— PW 59.0% / SP 60.4% / TE 60.5% / ST 60.2% / MN 56.5%（PW/SP/TE/ST 標準偏差 0.49pp、レンジ 1.5pp で密集）。1能力=120/他=80（差+40、ビッグ）— PW 70.1% / SP 72.2% / TE 71.4% / ST 70.4%（4能力レンジ 2.2pp）。試合長 通常10.8T/TO率2.6%/ヘボ率1.0%、ビッグ17.7T/TO率2.2%/ヘボ率0.0%。番狂わせ率 OVR差20通常12.0%/ビッグ7.3%（v5.0 12.2/7.8% から微減）。popularity効果 pop差99通常+18.5pp/ビッグ+38.5pp（v5.0と同一）。⑤副作用なし: タッグマッチには MN終盤粘り のみ反映、パターンB（mom/hit/counter 開始ボーナス）はシングルのみ。試合長は v5.0 と完全同一（パターンBは命中・カウンター・mom のみ動かしHPには触らない）。⑥仕様書 specs/battle-engine-spec-v4.2.md を v5.1 として変更履歴追加＋§7.1 ダメージ計算（係数+ポストプロセス記述更新）＋§13 ENG定数（係数同期、MN終盤粘り＋パターンB ポストプロセス記述追加）。⑦設計意図: 「テクニックがある選手は試合の入りが上手い」「スピードがある選手は出だしから流れを握る」「パワー押しの選手は試合の入りで圧をかけ相手はカウンターを返しにくい」「精神力の高い選手は終盤に粘れる」を能力値ごとの個性として表現。能力値=ダメージ係数の単一軸ではなく、複数経路の重ね合わせで試合に効くデザインに移行。auto-sim 100シーズン(seed=12345) ALL CLEAR（violations:0, errors:0, weeks:5,300, game_overs:0, elapsed:413.8s）。残: docs/master-spec.md の同期確認、ブラウザ実機での体感確認はユーザー委任。変更：src/data.js+src/match-engine.js+specs/battle-engine-spec-v4.2.md+test/_match-system-v5-validation.js(継続使用)+test/_stat-100vs80-and-120vs80.js(新規)+test/_stat-contribution-detail.js(新規)+test/_pop-60-vs-90.js(新規)+docs/game-system-roadmap.md(本項)。

前回: **戦闘エンジン v5.0 — 試合システム全面再調整（2026-04-30）。** `plans/match-system-v5-rebalance-plan.md` の確定案実装。①現状調査で「OVR差20でも下位勝率22%」「通常マッチで5T以下のヘボ試合15%発生」「人気は試合に未反映」と判明。②方針：能力値差を貫通的に試合結果に反映する新メカニズム M1（OVR比ダメージ補正、ovrMult = (atkOvr/defOvr)^0.50）を主役に、HP×2.0延長＋MAX_T短縮で試合長と TO率を調整、popularity 反映を tier別倍率（通常×1.0、ビッグ×2.0）で導入。③変更：data.js（hpBase 50→100, hpScale 0.90→1.80, hpBase_t2 85→170, hpScale_t2 1.10→2.20, MAX_T 20→16, BIGMATCH_MAX_T 24据置, momDmgScale 0.0003→0.001, pinAttemptMomBonus 0.015→0.03, dmgPwrScale 0.20→0.24, dmgTec/SpdScale 0.08→0.10, defStaScale 0.02→0.03, defMntScale 0.055→0.06, counterBase 4→3, counterMax 22→18, rollupBaseSuccess 16→10/11→10）、match-engine.js（leftChance に popAdv×6×tierMult を追加(mom×0.05は据置、B案で先行適用済み), atkRoll(タッグ)も同0.05据置, calcKickoutChance/calcGuEscapeChance に popAdv/popMult 引数追加(popAdv×0.07×tierMult を加算), シングル calcDamage後 にM1 (ovrMult) +pop補正 (1-popAdv×0.06×tierMult)、タッグ calcDamage後にM1のみ補正、タッグ式合体技にもM1補正）。④検証実測値（5,000試合 N=5,000、各シード変更で再現）：通常マッチ 80vs80 平均ターン 11.8 / TO率 5.4% / ヘボ率 0.3%、ビッグ 平均 19.2 / TO率 6.1% / ヘボ率 0.0%、OVR差20番狂わせ 通常 12.2% / ビッグ 7.8%、OVR差30 通常 3.0% / ビッグ 0.9%、能力値貢献度 PW+30 66.2% / SP+30 65.4% / TE+30 64.8% / ST+30 68.4% / MN+30 60.0%（PW/SP/TE/ST 標準偏差 1.36pp）、popularity効果 pop差99 通常 +18.5pp / ビッグ +38.7pp（計画書想定 +5.5/+10.7pp より強く出ているが、能力値差を覆さない範囲で機能している）、互角バランス 49.6/50.4 維持、OVR差5 ビッグ 60.1%。⑤副作用なし：タッグマッチはHP/MAX_T/popularity反映なし（M1とmom縮小のみ適用）、セーブ互換性影響なし、MQ算出は内部で平均ターン参照のため自動追従。⑥仕様書 specs/battle-engine-spec-v4.2.md を v5.0 として変更履歴追加＋§3 leftChance／§7.1 ダメージ計算（M1+popularity ポストプロセス記述追加）／§13 ENG定数／§16.3 BIGMATCH_ENG定数を実装に同期。⑦検証：test/_match-system-v5-validation.js で番狂わせ率/平均ターン/ヘボ率/能力値貢献度/popularity効果/互角試合カーブを測定、auto-sim 100シーズン(seed=12345) ALL CLEAR（violations:0, errors:0, weeks:5300, elapsed:639.9s）、stat-contribution-test で ST特化 54.8% / PW特化 52.0% / SP特化 50.0% / TE特化 49.3% / MN特化 43.7% — STが M1+HP延長で若干強くなったが大きな歪みなし。⑧残タスク：仕様書のSPD項（leftChance内 spd差×0.15項）と clamp(20,80) の復活は別計画として未着手、シングル match counter は `mv.d × counterDmgMult` のままでM1非適用（計画書記述の "L.758 calcDamage後" は単独のpre-edit lineに該当する calcDamage コールなしで省略）、popularity効果が想定より強い件は次セッションで微調整候補。変更：src/data.js+src/match-engine.js+specs/battle-engine-spec-v4.2.md+plans/match-system-v5-rebalance-plan.md+plans/archive/match-system-v5-rebalance-task.md(移動)+test/_match-system-v5-validation.js+docs/game-system-roadmap.md(本項)。

前回: **新聞4面 年間MVPレース リッチ化 + 英字日本語化（2026-04-29）。** 「4面のタブを MVPレースに改名」「文章がまだ貧しい — ゲーム内の記録情報を活かしてボリュームを増やす」「ベイビーフェイスや英字表記をやめてカタカナ/日本語に統一」というユーザ要望を一括投入。①**改名**: タブ表記=「📊 4面 MVPレース」、紙面内見出し=「📊 4面 ・ 年間MVPレース」(タブは短く、紙面は正式名称)。集計待ち見出しと PPV ナラティブの「年間レース」も「年間MVPレース」に統一。②**英字→日本語**: `RANK`→「順位」、`POINTS`/`PT`→「ポイント」、`NEW`→「初登場」、`TOP3/TOP10`→「三傑/十傑/上位N」、ページメタ「注目選手 TOP3」→「注目選手 上位三傑」、4位以下divider「以 下 追 走」→「4 位 以 下 ・ 追 走 集 団」。`OVR / MQ / PPV / pt` は業界略号として維持。③**リッチ叙述**: `Engine.mvpRace.generateRichBlocks(entry, state)` を新設し、`careerRecord.history`(当シーズン filter)/`state.h2h`/`state.relationships`/`G.snapshots`/`fighter.traits` から3要素 `{headlineLine, factChips, flavorLine}` を返却。`_pickSignatureMatch` は h2h.history 全件走査で MQ最高 or 直近の特筆試合を抽出、`_pickArchRival` は rivalry≥60 の宿敵を返す、`_composeFlavorLine` は MQ85+名勝負→宿敵→snapshot(careerBestMQ/breakthrough)→特性+役職+年齢の優先度でフレーバー1行を生成。④**UI 3層構造**: 1位カードに `.np-mvprace-rich-line`(◇付き直近名勝負ファクト)、2/3位ミニカードに `.np-mvprace-fact-chips`(王座/PPV/対抗戦/ドーム/名勝負を最大4件)+`.np-mvprace-flavor` を追加、4位以下を `.np-mvprace-list-row--rich` に再構築 — 1段目=順位ヘッダ(順位/矢印/サムネ/エンブレム/名前+所属+👑現王者バッジ+役職/年齢メタ/OVR/pt) + 2段目=事績チップ + 3段目=フレーバー1行。⑤**スコープ外**: snapshot 全件走査の正規化、achievement-system 実装、tagline 関数の段階的削除は別タスク。`Engine.mvpRace.generateNarrative`/`generateTagline` は破壊せず共存。検証: auto-sim 5シーズン(seed=42) ALL CLEAR (violations:0, errors:0, weeks:265, elapsed:4.6s) — 試合判定/経済/成長などコア数値ロジックには影響なしを確認。残: ブラウザ実機で(a)タブ「📊 4面 MVPレース」と紙面見出し「年間MVPレース」が表示されること、(b)1位カードに直近名勝負の◇行が出ること、(c)4位以下の3段リッチ行(順位ヘッダ+事績チップ+フレーバー)が改行で潰れないこと、(d)英字ラベルが画面から消えていること、を目視確認。変更: src/management.js(`Engine.mvpRace.generateRichBlocks` 新設 + `_resolveFighter`/`_resolveName`/`_traitFlavor`/`_collectFactChips`/`_pickSignatureMatch`/`_pickArchRival`/`_composeFlavorLine` 補助関数群、generateNarrative/Tagline/PageHeadline/集計待ちラベル の英字日本語化)+src/ui-render.js(タブ/見出し改名、`_npMvpRaceArrowText`/`_npMvpRaceArrow1ChipText` の NEW→初登場、`_npMvpRaceRank1Card` に rich.headlineLine 注入、`_npMvpRaceMinorCard` に factChips+flavor 注入、`_npMvpRaceListRow` を3段構造に書き直し)+src/index.html(`.np-mvprace-list-row--rich`/`.np-mvprace-fact-chips`/`.np-mvprace-fact-chip`/`.np-mvprace-flavor`/`.np-mvprace-list-flavor`/`.np-mvprace-rich-line`/`.np-mvprace-list-champ`/`.np-mvprace-list-metaline` の CSS 追加 + レスポンシブ調整)+specs/newspaper-and-orgcompare-spec-v2.0.md(v3.1 4面追記)+docs/game-system-roadmap.md(本項)。

前回: **戦闘エンジン v4.3b — モメンタム係数追加縮小＋ダメージ乱数幅縮小（2026-04-29）。** モメンタム実効効果のさらなる縮小として、`leftChance` 係数 `0.05 → 0.03`・`momDmgScale: 0.001 → 0.0003`・`pinAttemptMomBonus: 0.03 → 0.015`（各元値の1/10）に変更。加えて「番狂わせ確率低減」施策として `dmgRandMin: 0.85 → 0.90`・`dmgRandRange: 0.30 → 0.20` に変更（ダメージ乱数幅を±15%→±10%に縮小、平均ダメージ1.00倍維持）。低ダメージ技のクリティカルヒット連打による番狂わせを抑制。auto-sim 100シーズン(seed=12345) ALL CLEAR (violations:0, errors:0, weeks:5300, elapsed:374s)。変更：src/data.js(momDmgScale/pinAttemptMomBonus/dmgRandMin/dmgRandRange)+src/match-engine.js(L.176/L.730 leftChance係数)+specs/battle-engine-spec-v4.2.md(変更履歴v4.3b+§7.1乱数幅+ENG定数)+docs/game-system-roadmap.md(本項)。

前回: **bond/rivalry ネガティブイベント拡張 残り項目実装完了（2026-04-29）。** `docs/bond-rivalry-negative-events-instructions-2026-04-29.md` の P-1/P-3/P-4/P-6/P-7 を実装。①**P-1 タッグ編成 Bond ペナルティ**: bond ≤ 20 のパートナー同士で組ませた場合、power/speed/technique/spirit を各 -3、`calcCutinRate` で連携(cut-in救援)を完全停止、試合後 trust -1。タッグ編成プレビューに赤色マーカー「⚠ 不仲」+ 警告(`src/app.js`/`src/match-engine.js`/`src/ui-common.js`)。②**P-3 興行波及**: 動員ボーナスは `pure_hatred`/`bitter_feud` ペア入りカード 1枚目+5%/2枚目+3%/3枚目+2%/4枚目以降+1%、上限+12%。`Engine.economy.calcHostileCardBonus` 新設。シングル戦で対象ペアの場合は `Engine.injury.check` の `injuryMult` を 2.0 倍化(派閥未実装のため代替)(`src/management.js`)。③**P-4 派閥的険悪閾値 + 嫌悪伝染**: 同団体 `bond ≤ 30` ペアが 3 組以上で `M-24` ロッカー荒廃モーダル発火、`lockerRoomMorale -2` / `orgPop -1`、シーズン1回(13週クールダウン)。5 組派閥スピンオフは `faction-system` 未実装のため `TODO` 保留。`'emotional'` 性格選手が親友(bond ≥ 60)の嫌悪相手(bond ≤ 15)へ bond -1〜-2 を月1回伝染(4週クールダウン/(carrier,target)ペア)(`src/relationships.js`/`src/ui-common.js`)。④**P-6 社長室 修復チャネル**: 新書類 `relationship_repair`(関係修復斡旋書、決裁枠2pt + 100万、回数無制限、成功率70%)。W-1 累計 4 回以上のペア対象、成功時 双方向 bond +5〜+10。`state.w1FireCount` per-pair で積算。新 UI `showDecisionPairModal` でペア一覧から選択(`src/data.js`/`src/management.js`/`src/ui-common.js`/`src/app.js`)。⑤**P-7 険悪可視化**: 相関図の `pure_hatred` ペアに 😠、`bitter_feud` ペアに 😤 を hostileLabel 直下に描画。`GL-02-hostile` フレーズプール(7 personality 分)を新設し、`rivalry ≥ 50 ∧ bond ≤ 30` 持ちの選手の練習中セリフを「練習中の敵意」に切替(`src/ui-render.js`/`src/data.js`/`src/relationships.js`)。検証: auto-sim 50 シーズン ALL CLEAR (violations:0, errors:0, weeks:2650, elapsed:120s)。`'empathic'` 性格は実在しないため最も近い `'emotional'` で代替(設計判断)。残: 派閥システム実装後に P-4 5組スピンオフを差し戻し / M-24 personality 別フラグダイアログ拡充。変更: src/data.js(GL-02-hostile/relationship_repair) + src/relationships.js(GL-02分岐/W-1カウンタ/ロッカー荒廃/嫌悪伝染) + src/management.js(動員/アクシデント/checkActivation/execute pair分岐) + src/app.js(タッグstat-3 + ペア書類ルーティング) + src/match-engine.js(calcCutinRate ガード) + src/ui-render.js(険悪アイコン) + src/ui-common.js(タッグ警告/M-24/showDecisionPairModal) + specs/relationship-system-spec-v2.3.md(§D追記) + docs/game-system-roadmap.md(本項)。

前回: **bond/rivalry ネガティブイベント拡張 先行実装（2026-04-29）。** `docs/bond-rivalry-negative-events-plan-2026-04-29.md` のうち、影響範囲の小さい先行5項目を実装。①**W-4 (M-07) クロス非対称・覚醒イベントに生涯1回キャップ**: 1.5%/週独立判定で2年経過時に約80%発火していた問題を解消。覚醒した選手に `_awakened: true` フラグを付け、以後発火しない（`src/relationships.js`）。②**P-2 中間嫌悪帯スナップショット (GL-11 coldness)**: `bond ≤ 25 ∧ rivalry < 30` のペアで 6%/週 発火、最低 bond ペアを抽選、tone='negative' label='冷たい距離'。中間帯のドラマ空白を埋める純演出。③**P-8 完全断絶 (Cold Severance)**: `bond ≤ 10 ∧ rivalry < 30` の方向別判定で 25%/週、当該主体に trust −0.5(月平均1回相当)。スナップショットは GL-11 で代替、派閥またぎ強化は不採用（冷たい関係は派閥対立とは別軸）。④**P-9 ナレーション型グリンプス (GL-12)**: `min(bond) ≤ 15` の同興行参加ペアに対し 25%/週、第三者視点の三人称ナレーション5本（`{nameA}` `{nameB}` 置換）。`state.lastShowResults` から参加者集計。tone='narration' label='第三者の証言'。⑤**1-C UI 強化: 相関図に極端ペア日本語ラベル**: `pure_hatred` → 「憎悪」(色 #ff7675) / `bitter_feud` → 「因縁」(色 #e17055) を相関図のペア線の上に表示。`rivalTitle`(因縁称号バッジ)が付いている場合はそちらを優先、hostile ラベルは出さない。中間帯はラベルなしで存在感のある関係だけ可視化（`src/ui-render.js`）。検証: auto-sim 20シーズン × 5シード = 100シーズン ALL CLEAR (2026-04-29)。残: P-1 タッグ Bond ペナルティ / P-3 興行波及 / P-4 派閥的険悪閾値 / P-6 修復チャネル / P-7 険悪可視化(人物アイコン+練習中セリフ) は `docs/bond-rivalry-negative-events-instructions-2026-04-29.md` に指示書化済み、別セッションで実装予定。変更: src/relationships.js(W-4キャップ/P-8/GL-11/GL-12) + src/data.js(GL-11/GL-12 台詞プール) + src/ui-render.js(hostileLabel + 相関図描画) + specs/relationship-system-spec-v2.3.md(新規) + CLAUDE.md(specs索引追記) + docs/game-system-roadmap.md(本項)。

前回: **戦闘エンジン v4.3 — モメンタム実効効果の縮小（2026-04-29）。** `plans/momentum-effect-reduction-plan.md` の B案実装。①現状調査で「同格70vs70でも序盤4ターンのモメンタムリーダーが79%で勝つ」「先制ヒット被弾側の勝率36%」「同格でも86%が中盤8ターン時点で勝者確定」というスノーボール現象を測定で確認、`leftChance = 50 + mom × 0.3` の攻撃機会偏重が主因と特定。②`mom` のゲージ動き（ヒット±8/ミス±5/カウンター±18/威圧感±3）は据え置き、ゲーム上の実効効果を縮小する方向で B案を採用。③変更：`src/match-engine.js` L.176/L.730 の `leftChance` 係数 `0.3 → 0.05`、`src/data.js` L.715 `momDmgScale: 0.003 → 0.001`、L.719 `pinAttemptMomBonus: 0.15 → 0.03`。タッグマッチ(L.730)も同係数に統一。④期待効果（測定済）：同格 T4リーダー的中率 79.4% → 73.8%、T8 86.3% → 83.6%、ビッグマッチ T4 76.6% → 68.8%、T8 81.0% → 72.1%、80vs60 下位勝率（番狂わせ）通常 27.8% → 25.4% / ビッグ 23.8% → 20.0%、80vs80 同格バランス 49.9/50.1 維持。平均ターン数は通常 8.1 → 8.2、ビッグ 13.2 → 13.8 と僅かに伸長（許容範囲）。⑤副作用なし：MQ算出は `mom` 非参照、丸め込み判定の `pinAttemptMomBonus` は `pinAttempt` 関数のみで使用、セーブ互換性影響なし。⑥`specs/battle-engine-spec-v4.2.md` を v4.3 に変更履歴追記＋§3/§7.1/§フォール狙い/§ENG定数の数値同期。仕様書に記載のあった `(eff(L.spd) - eff(R.spd)) × 0.15` SPD項とclamp(20,80)は実コードで脱落していたため、実装を正として仕様書側を実装に合わせた（SPD項復活は別計画として残す）。⑦検証：auto-sim 100シーズン(seed=12345) ALL CLEAR、`test/_momentum-whatif.js` の B案数値が計画書の表と一致。⑧残タスク：仕様書のSPD項復活、番狂わせの絶対頻度調整（`counterBase` `rollupBaseSuccess` `hitMin/hitMax`）は別計画として未着手。変更：src/match-engine.js(L.176/L.730 mom係数)+src/data.js(L.715/L.719 ENG定数)+specs/battle-engine-spec-v4.2.md(変更履歴v4.3+§3/§7.1/§フォール狙い/§ENG定数)+docs/game-system-roadmap.md(本項)。

前回: **怪我引退セリフ silent retirement バグ修正（2026-04-29）。** 「キャラクターが一切セリフも出ず引退してしまう場合がある」という再報告を受け、6つある引退発生経路を再走査。**怪我引退経路だけが構造的に脆い**ことを特定: `injuryResults.push({ name, ... })` で id を保存せず、後段 `(s.retiredFighters || []).find(f => f.name === ir.name)` の name ベース lookup が、長期プレイで `retiredFighters` に同名キャラが累積した場合に①誤マッチ(別人セリフ)②null(`.filter(Boolean)` で消滅 → silent retirement) を起こしうる。①**id ベース lookup へ変更**: `src/management.js:9625/9652` の `injuryResults.push` に `id: lc.id/rc.id` を追加し、`:9667/:9689/:10040` の `find` を id 優先(name は後方互換用フォールバック)に。`:10040` には lookup 失敗時の `console.warn` を仕込み再発検知用に。②**怪我引退ポップアップ fallback**: `src/app.js:6685` 付近に、`G.retiredFighters` から「今シーズン×今週に `reason='wearInjury'/'careerEnding'` で引退したが `_pendingInjuryRetirements` に載っていない選手」を救出して `Engine.retirement.selectLine` でセリフ生成し合流させる「最後の砦」ロジックを追加。ラストラン経路の既存 fallback (`:6701-6730`) と同じパターン。③**route='lastrun_expired' 専用カテゴリ分岐**: `src/management.js:3887` の `selectLine` で `lastrun_expired` を `A4_veteran`(在籍長＆静かな別れ)に固定し、汎用シーズン末セリフ感を緩和。専用セリフ群追加は別タスクへ。④**スコープ外**: シーズン末引退・ラストラン即引退・モチベ自主引退は fighter オブジェクトを closure で持ち回す設計のため対象外 / AI団体引退は仕様通りプレイヤー非可視 / `lastrun_expired` 専用セリフ群と specs 追記は次回。検証: auto-sim 100シーズン(seed 12345) ALL CLEAR (violations:0, errors:0, weeks:5300, elapsed:356s)。残: ブラウザ実機で(a)wear 75+ の選手で重傷発動時にセリフが出るか、(b)retiredFighters が肥大した状態で同名キャラがいても正しい本人のセリフが出るか、(c)ラストラン期限切れ引退で A4 系の落ち着いたトーンになるか、をユーザに確認依頼。変更: src/management.js(injuryResults に id 追加 / 3 箇所の retiredFighters lookup を id 優先 / selectLine の lastrun_expired 分岐)+src/app.js(怪我引退 fallback 復元ロジック)+docs/game-system-roadmap.md(本項)。

前回: **Bond/Rivalry リバランス v2.3 + 低Bond決定的事件 + 性格×アーキタイプ ポップアップ（2026-04-28）。** 「Bondの高い値も低い値もゲーム中ほぼ見えない」ユーザ指摘を受け、構造緩和3点 + 既存ネガティブ調整4点 + 新規低Bond事件2種 + 既存フラグモーダル枠でのポップアップ演出を一括投入。①**構造緩和**: ⓐ`Engine.relationships._getPositiveGainScale`(bond)を`90+:0.08→0.20 / 75+:0.18→0.40 / 60+:0.35→0.60 / 40+:0.6→0.8 / 20+:0.8→0.9`に緩和(高bond帯の上昇逓減を弱め、試合イベントで積んだ+10が実効反映されるように)、ⓑ`_affinity.target`を`50+10cos`(40〜60レンジ)→`50+20cos`(30〜70レンジ)に拡張し、相性◎ペアは bond70 を自然な行き先に、相性✕ペアは 30 を行き先に、ⓒ`processWeeklyDecay`の bondPull を`0.08+rng×0.06`→`0.03+rng×0.03`に弱め、ⓓ同団体ボーナス天井を bond60→bond70 に引き上げ。これらにより「相性◎+同団体長期+名勝負を経たペア」が bond80+ に自然到達できる。②**既存ネガティブ調整**: M-15 番狂わせ逆恨み を bond `-4〜-2`→`-7〜-4`、M-17 凡戦敗者を `-4〜-2`→`-5〜-3` に微増、N-03 BF×Heel 衝突 確率を `4%→6%/週` に引き上げ、N-05 スランプ八つ当たり を `-4〜-7`→`-7〜-12`、N-01 ポジション競合は太さは据置で発火条件を絞り(per-pair 16週クールダウン `state.n01CooldownWeeks`)タイトル戦不出場による多発を抑止。③**新規低Bond事件**: ⓐ**N-06 共闘ペアの裏切り選択** — 同興行で片方タイトル戦・片方前座 + bond≥60 + 25%発火 + per-pair 24週クールダウン(`state.n06CooldownWeeks`)、前座→タイトル方向に bond `-12〜-18`/rivalry `+5〜+10`。`applyShowContextEffects` 内 C-10 直後で発火。ⓑ**N-07 価値観の決裂** — 同団体 + 性格相性+アーキタイプ相性≤-3 + bond<35 + per-pair 1回限り(rel.valueRift フラグ) + per-org シーズン1回限り(`state.valueRiftSeasonByOrg`)、双方向 bond `-8〜-12`/rivalry `+3〜+6`。`processWeeklyDecay` 内 N-03 直後で発火。④**ポップアップ演出**: 既存`FLAG_MODAL_META`(M-1〜M-14)に `M-15 番狂わせ・逆恨み / M-16 スランプの八つ当たり / M-17 共闘ペアの裏切り / M-18 価値観の決裂` の4種を追加。各イベント発火直後に `Engine.relationships.flags._enqueueModal(state, 'M-15'..'M-18', {fromId, toId})` で `state._modalQueue` にエンキュー、`_drainFlagModalQueue` で順次表示。⑤**性格×アーキタイプ二段セリフ**: `flag-dialogue.js` の `_pickLine(modalKey, personality, idLike, archetype)` を二段検索(`block[personality_archetype] → block[personality] → block.normal`)に拡張、M-15〜M-18 各イベントについて性格7種×3行ベース + 印象的な性格×アーキタイプ組合せ(bold_ojousama / emotional_delinquent / quiet_cool / earnest_polite / earnest_ojousama / bold_delinquent / emotional_normal 等 各3行)を追加。`_flagBuildPopupOpts` から speaker.archetype を渡すよう更新。⑥**スコープ外**: Trust 側の調整 / rivalry 値域変更 / 既存 N-02 など発火条件は据置 / N-06/N-07 以外の新規低Bond事件は分布見て次回判断。検証: auto-sim 20シーズン(seed 42) ALL CLEAR (violations:0, errors:0, weeks:1060, elapsed:24.4s)、100シーズン×複数シードで Bond分布の体感確認はユーザに委任。残: ブラウザ実機で(a)1団体に1〜2ペア程度の bond80+ や bond<25 が見えること、(b)M-15〜M-18 ポップアップが性格別セリフで正しく出ること、(c)N-06/N-07 が何シーズンで初発火するか、を目視確認。変更: src/relationships.js(`_getPositiveGainScale`+`_affinity.target`+`processWeeklyDecay` bondPull/同団体天井/N-03確率/N-07新規 + `applyMatchResult` M-15逆恨み太さ・modal enqueue + `applyShowContextEffects` N-01クールダウン・N-06新規 + `applySlumpLashout` -7〜-12/M-16 enqueue + M-17 凡戦微増)+src/ui-common.js(`FLAG_MODAL_META` M-15〜M-18 追加 + `_flagBuildPopupOpts` archetype 渡し)+src/flag-dialogue.js(`_pickLine` 二段検索 + M-15〜M-18 セリフ約100行)+docs/game-system-roadmap.md(本項)。

前回: **戦歴の受賞歴・団体別王座記録 v1.0（2026-04-28）。** 「選手詳細の戦歴欄に受賞歴(MVP/年間各賞)を並べて箔をつけたい」「過去どの団体での王座か・防衛回数も記録すべき」というユーザ要望を受け、戦歴サマリーと表彰記録を団体横断で整備。①**buildSummary 団体別ブレークダウン**: `Engine.career.buildSummary` ([src/management.js:2074-2122](src/management.js:2074)) で `titleWin`/`titleDefense`/`titleLoss` を `orgName` 単位にグルーピングし `titleByOrg = [{orgName, wins, defenses}]` を返却。`titleDefense.count` は累計値のためベルト×シーズン単位で `max(count)` を取り合算、`titleLoss.defenses` で在位最終値を確定。`totalTitleWins`/`totalDefenses` は据え置き(殿堂入り計算は合算)。②**戦歴UI複数行化**: [src/ui-common.js:3128](src/ui-common.js:3128) の `summary.titleSummary` 単行を `titleByOrg.map` に差し替え、複数団体の場合は団体ごとに 1 行ずつ「🏆 元○○団体王座 N度戴冠・通算M度防衛」を縦並びで表示。`var(--gold)` のみ使用しトークン遵守。③**NPC団体ごとの年間表彰選出**: `Engine.awards.selectRookieForOrg` / `selectMVPForOrg` / `selectBestMatchForOrg` を新設 ([src/management.js:13568-13640](src/management.js:13568))、`Engine.awards.generate` で `pendingAwards.npcAwards[orgId] = { rookie, mvp, bestMatch }` を生成。MVP は `state.mvpRace.rankings` を `orgId` で絞った1位、新人王は `careerSeasons===1` から OVR最高、ベストマッチは `aiOrgs[orgId].seasonBestMQ`(無ければ OVRトップ2推定)。④**受賞記録を全団体対象に拡張**: [src/app.js:7488-7568](src/app.js:7488) の `_checkAndShowAwards` から `isPlayerOrg` ガードを撤去し、`recordOnAllOrgs(predicate, ev)` ヘルパーで `G.roster` と `G.aiOrgs[*].roster` の双方に `Engine.career.addEvent` を適用。プレイヤー団体ぶんのグローバル受賞 + NPC団体ぶんの内部表彰の両方を順次記録。NPC選出ぶんは表彰式画面には載せず、選手詳細の戦歴・キャリア年表からのみ参照できる暗黙の事実として残る(将来 NPC からスカウト/獲得した際にドラマが立ち上がる)。各イベントに `orgName` を保持。メディア功労賞は団体横断のグローバル単独選出のまま据え置き。⑤**スコープ外**: 関係値反映(E-05)はプレイヤー団体内のままで NPC側へは広げない / titleWin/Loss/Defense の発火点は既に `orgName` 記録済みのため新規データ追加不要。検証: auto-sim 20シーズン(seed 42) ALL CLEAR (violations:0, errors:0, weeks:1060, elapsed:28s)。残: ブラウザ実機で(a)複数団体を渡り歩いた選手の戦歴に王座が団体別に並ぶこと、(b)NPC団体所属時代に MVP を獲った選手をプレイヤー団体に獲得した後、選手詳細の戦歴・キャリア年表に「○○団体時代に MVP 受賞」が残ること、(c)既存セーブのリグレッション(プレイヤー団体内の戦歴表示が崩れない)、の3点を目視確認。変更: src/management.js(buildSummary 刷新 + selectRookieForOrg/selectMVPForOrg/selectBestMatchForOrg 新設 + generate に npcAwards 追加)+src/ui-common.js(戦歴パネル王座行の複数行化)+src/app.js(_checkAndShowAwards を全団体対象に)+specs/career-history-spec-v1.0.md(§2.2 団体別ブレークダウン追記 + §2.4 NPC受賞対象範囲追記)+docs/game-system-roadmap.md(本項)。

前回: **NPC団体 対抗戦・挑戦状の公平化 v1.0（2026-04-27）。** 「NPC団体に対抗戦が発生していないと、選手のMVP争いにも不公平」というユーザ指摘を受け、AI団体間でも B3挑戦状が自動発生するようにし、加えて対抗戦の機会分配と AI 大型イベントの経歴記録を整備。①**Step 1 AI vs AI B3挑戦状**: `Engine.rival.processAIB3Challenge(rng, state)` を [src/management.js](src/management.js) に新設、`tickWeek` の `processAIWar` 直後で呼ぶ。週次 `week % 4 === 0` 判定 + ペアあたり 5% 発生率 + 6週クールダウン(`lastB3Week`) + ランキング±1〜±2位ペア(プレイヤー除外)。挑戦側=OVRトップ5から1名、受諾側=OVRトップ3+チャンピオン50%優先。受諾判定は格関係依存(挑戦=格下→85%/同格→75%/挑戦=格上→45%)。試合は `Engine.battle.simulateMatch(matchTier=2)` ビッグマッチ扱い。勝者: orgPop+3/popularity+3/trust+5、敗者: orgPop-1/trust-3、引分: 両orgPop+1/trust+2。両者に `careerRecord.history.push({type:'b3Challenge', won, opponentOrgName, opponentName})` を残し MVP計算に直接反映、`isCrossOrg=true` で `Engine.relationships.applyMatchResult` 起動 + h2h 更新。辞退時は受諾側OVRトップ3に `b3Decline`(MVP -4pt)、挑戦側に `b3Rejected`(MVP +4pt)、orgPop -1。②**Step 2 対抗戦機会拡張**: `processAIWar` を ⓐ 隣接縛りを ±1位 → ±1〜±2位、ⓑ 発生率 2.5% → 3.5%、ⓒ 代表選出を OVRトップ3 → トップ5 + シーズン中 war/b3 出場履歴ペナルティ(出場0回→1.0/1回→0.4/2回→0.25)で重み付き選択、ⓓ チャンピオン即選率を 50% → 35% に変更。中堅選手にも対抗戦機会が回り、エースだけが warWins を独占しない。`isRental` 除外も追加。③**Step 3 AI大型イベント経歴記録**: `processAIWeeklyEvent` の B1/B2/B4 ブランチで `careerRecord.history.push` を追加 — `practiceInjury`(severity/weeksOut)、`feud`(resolution: 'talk'|'ignore'|'match' / won)、`talentActivity`(activityType/multiplier)、`mediaSpotlight`(outletName/subType)。NPC選手の経歴年表が空白にならないように。④**Step 4 新聞**: `Engine.newspaper.PRIORITY` に `aiB3Result:138 / aiB3Decline:105` を追加、`generate()` 内でAI B3結果(MQ90+で priority+20)/辞退/引分の3パターン文面、`clearAINewsFlags` で `_newsAIB3Result` 掃除。⑤**MVP計算は無変更** — 既存の `Engine.mvpRace.calcSeasonPoints` が `'war' || 'b3Challenge'` を warWins/Losses として集計済みのため、history 記録だけで自動的に MVP に反映される。⑥**スコープ外**: `seasonBestMQ` の団体独立計算は今回触らない / NPC団体間PPV や AI団体独自JTは作らない(既存システムでNPCも参加済み) / 対抗戦・B3 の頻度大幅増は見送り(プレイヤー側体感バランス保護)。検証: auto-sim 100シーズン(seed ランダム) ALL CLEAR (violations:0, errors:0, weeks:5300, elapsed:402s)。残: ブラウザ実機で AI B3 ニュースが新聞に流れること、データベース→経歴年表でNPC選手にB3記録があることの目視確認。変更: src/management.js(processAIB3Challenge新設 + processAIWar拡張 + processAIWeeklyEvent B1/B2/B4 history + 新聞PRIORITY/generate/clearAINewsFlags + tickWeek フック)+specs/large-event-spec-v1.0.md(§4.4 AI vs AI B3 追記)+docs/game-system-roadmap.md(本項)。

前回: **今週画面ロスターテーブル リデザイン v1.0（2026-04-27）。** 今週画面 (`weekPhase==='manage'`) のロスターテーブル本体を `docs/handoff-week-roster-redesign.md` / `docs/mockup-week-roster.html` に従って刷新。①顔アイコン40px(角丸正方形, クリックで `showFighterPopup` 起動)を名前左に追加。②名前を点線下線のクリッカブルテキスト化(`showFighterPopup(id,'roster')`)。③人気列を新規追加(`Engine.util.dispPop` × `_popColor` の色階調、ソート対応)。④OVRを大型26pxフォント+CSS変数 `--v-mythic`〜`--v-poor` の色階調+ティアラベル(SS/S+/S/A/B/C/D/E、`OVR_TIER_THRESHOLDS` 準拠)に強化。⑤カラム順を【☑/名前/総合/人気/状態/体調/スケジュール/⚡/今週の行動/埋め】の10列構成に変更、名前列210px固定+末尾auto埋めセルで右側に余白を確保。⑥スケジュール`<select>`を列幅130pxに合わせて font-size 13px / padding 6px 10px / width 100% に縮小。⑦テーブルクラスを `.data-table` → 新規 `.week-roster-table` として独立、レンタル区切り行 colspan 8→10。スコープ厳守: ダッシュボード(シーズン進捗/ランキング/月次収支/ニュースティッカー/Heat/コーチ数)、興行準備へボタン、おまかせボタン、一括操作パネル(練習優先/プロモ優先/バランス/休養重視/⚡全ON/⚡全OFF)は一切変更なし。Engine 側変更なし(純粋UI)。新ヘルパー `_wrOvrTier(v)` を `src/ui-render.js` に追加、既存 `_imgOrInitial`/`getPortraitUrl`/`_popColor`/`Engine.util.dispPop` を再利用。auto-sim 不要(UIのみ)。変更: src/index.html(`.week-roster-table` 一式 約30行追加)+src/ui-render.js(`_wrOvrTier` 追加+`_renderWeekRow` レンタル/通常分岐の `<tr>` HTML 差し替え+ヘッダー10列化+colspan 10)+docs/game-system-roadmap.md(本項)。

**経歴年表 Phase E — 退団・再契約経緯の記録 / 経歴年表 Phase A〜E 全完了（2026-04-27）。** 「解雇されたのか、契約満了で去ったのか、突然消えたのか、引き抜きで他団体へ行ったのか、レンタルで来てまた帰ったのか、引退を撤回して戻ってきたのか」が年表に時系列で読める形に。①新 history.type を 6種追加: `release`(解雇)/`contractEnd`(契約満了退団)/`suddenDeparture`(突然退団)/`retireRetracted`(引退撤回)/`rentalIn`(レンタル加入)/`rentalOut`(レンタル帰団)。②発火点: `App.releaseFighter` / `App.doRetainFighter` / `Engine.contract.processDeparture(rng, fighter, state, cause='sudden'|'contractEnd')` / `processAIWeek` 内の trust 経由突然退団 / `Engine.rental.requestRental` / `Engine.rental.processWeeklyRental`。③`processDeparture` を全経路(starClaim/rival/freeAgent/dormant)で `fighterWithHist` を引き渡すよう修正し、history が確実に新所属先まで運ばれるよう統一。④`Engine.milestone.get` switch に 6 case + transfer の via 別「引き抜きで加入/強制引き抜きで加入/交渉成立で加入」日本語化。⑤`_typeStyle` に 6 種のアイコン/カラー追加(🚪解雇/📄契約満了/💨突然退団/↩️引退撤回/🤝レンタル加入/↩レンタル帰団)。⑥`specs/career-history-spec-v1.0.md` 新規作成 — 全 type カタログ + 表示ルール + Phase A〜E 履歴を記載、ファイル索引にも追記(全37ファイルに増)。検証: 10 イベント注入で全パターン日本語表示、auto-sim 100シーズン(seed 7919) ALL CLEAR (violations:0, errors:0, weeks:5300)。Phase A〜E 全完了。変更: src/management.js(processDeparture/レンタル/milestone/typeStyle)+src/app.js(releaseFighter/doRetainFighter)+specs/career-history-spec-v1.0.md(新規)+CLAUDE.md(specs索引)+docs/game-system-roadmap.md(本項)。

**経歴年表 Phase D — PPV 出場履歴に対戦相手名と勝敗（2026-04-27）。** Phase B で `isSummit` のみ年表化していた `ppvMainEvent` を、サミット決勝/準決勝以下の出場戦すべてに拡張。①`finalizePPV` 内で push される ppvMainEvent イベントに `opponentName` フィールドを追加: サミット勝者は敗者名、サミット敗者は勝者名、非サミット参加者は同じ試合の相手選手名。②非サミット試合の `won` フィールドも実際の勝敗(`r.winner`)を反映するよう修正(以前は全員 false)。③`Engine.milestone.get` の ppvMainEvent case を 4分岐に拡張: サミット優勝(「決勝で 美鈴 を破る」)、サミット準優勝(「決勝で 白井 に敗れる」)、非サミット勝利(「PPV GRAND FINAL 出場 / 愛 に勝利」)、非サミット敗退(「玲奈 に敗れる」)。レガシー(opponentName なし)は出場のみ表示。検証: 5パターン注入で全描画確認、auto-sim 100シーズン(seed 7919) ALL CLEAR (violations:0, errors:0)。残: Phase E(退団・再契約経緯)。変更: src/management.js(finalizePPV + milestone.get ppvMainEvent case)+docs/game-system-roadmap.md(本項)。

**経歴年表 Phase C — 対戦相手名の記録（2026-04-27）。** 「誰に勝って王座を獲り、誰に敗れて陥落したか」「対抗戦で誰と当たったか」「JTで誰に敗れて敗退したか」を年表に表示。①`Engine.career.recordTitle{Win,Loss,Defense}` のシグネチャに opts={ orgName, defeatedName/dethronedByName/lastChallengerName } を追加。②`Engine.title.crownChampion` 内部で前王者名/新王者名を自動算出して record に渡す。`Engine.title.recordDefense(G, opts)` は呼び出し側から `challengerName` を受け取る。③タイトル戦呼び出し全7経路を更新: toggleTitle / 興行(management.js + app.js) / AI団体(空位戴冠 + 防衛 + 王座交代の旧王者と新王者)。orgName は `${G.orgName}王座` または `${org.name}王座` を自動生成。④対抗戦 history に `opponentName`(相手選手名)を追加: プレイヤー側 finalizeWar、AI側 finalizeWar、AI vs AI processAIWeek の3経路。⑤ドーム history(domeMain) に `opponentName` 追加(シングル戦のみ、タッグはスキップ) + week フィールドも追加。⑥JT `Engine.juniorTournament.apply` に findEliminator ヘルパー追加、各カテゴリに opponent を付与: champion/runnerUp は finalOpponentName、semiFinal/quarterFinal は eliminatedByName。⑦`Engine.milestone.get` の表示更新: 防衛閾値を `3, 5, 7, 10, 15, 20...` に細分化し挑戦者名併記、タイトル獲得は「美鈴 を破ってチャンピオンに」、陥落は「白井 に敗れ陥落・12度防衛の末に陥落」、対抗戦は「対抗戦 vs TOKYO 勝利（黒澤 戦）」、ドームは「ドーム大会 メインイベント 勝利（vs 黒澤）」、JT 4種は結果別に「決勝で 玲奈 を破る」「決勝で 小百合 に敗れる」「美鈴 に敗れて敗退」「舞 に敗れて敗退」を出し分け。検証: テスト履歴14件注入で全パス相手名表示確認、auto-sim 100シーズン(seed 7919) ALL CLEAR (violations:0, errors:0)。残: Phase D(PPV/JT ラウンド統合)/E(退団・再契約経緯)。変更: src/management.js(record系/title系/JT/milestone)+src/app.js(finalizeShowタイトル/対抗戦/ドーム)+docs/game-system-roadmap.md(本項)。

**経歴年表 Phase A+B — 日本語化 + history 抜け漏れ拾い上げ（2026-04-27）。** 選手ポップアップ「戦績・経歴」タブで PPV メインイベント・ジュニアトーナメント結果(優勝/準優勝/準決勝敗退/出場)・ドーム大会・B3ファン期待カード(挑戦/辞退/拒絶)が年表に出ていなかった問題を修正。①`Engine.milestone.get` ([src/management.js](src/management.js)) の switch に `ppvMainEvent`(決勝のみ — 準決勝以下は Phase D で再設計)/`juniorTournament`(全 result 日本語マップ)/`domeMain`/`b3Challenge`/`b3Decline`/`b3Rejected` の case を追加。`breakthrough` は `peakOVR` と重複するため年表非表示に統一。②default fallback を「未知 type 読み捨て」に変更し、英字 type 名が UI に漏れることを防止。③ベストマッチ賞行を「MQ N」→「試合評価 N」に言い換え。④`_typeStyle` に `ppv_main / jt_round / dome_main / b3_event` のアイコン・カラー追加。⑤[src/ui-common.js](src/ui-common.js) の年表行 `S2W18` 表記を `18週` 形式に、怪我セクションの `Season X, Week Y` を `${season}年目 ${week}週` に日本語化。検証: テスト履歴24件注入 → milestone 21件描画(breakthrough/非summit PPV/未知 type の3件は意図通り抑制)、実画面でも英字漏れ無く全項目日本語表示確認。auto-sim 不要(UIのみ)。残: Phase C(相手選手名)/D(PPV/JT ラウンド統合)/E(退団・再契約経緯) は計画策定済み・着手前。変更: src/management.js(milestone.get switch + _typeStyle)+src/ui-common.js(年表/怪我セクション表記)+docs/game-system-roadmap.md(本項)。

**新聞タブ v3.1 — 情報量増 + UX改善（2026-04-26）。** v3.0 リリース後のユーザフィードバック「情報量が足りない」を受けた拡張。①**1面**: 不要な「次回展望」セクション削除。subStories 空時にプレースホルダー(「今週は他団体動向の特筆事項なし」)を常時表示。②**2面 戦力レーダー強化**: power-row レイアウトを `38/80/1fr/38/40` 5列に変更、バー両端にプレイヤー実値・ライバル実値(Bebas 14px、金/赤色分け)を表示、heading-note で業界基準計算式(エース力=TOP5平均OVR÷90 等)を明示。③**2面 主力対決の文章復活**: 各 matchup-row に `.np-matchup-comment`(KURODA_MATCHUP_FLAVOR.h2h.firstMeet + style.differentStyle 混合プールから seeded pick、不在時はOVR差ベースのフォールバック)。④**2面 注目選手拡張**: spotlight タグを「ACE/STAR/THREAT」→「エース級/主力級/中堅級」日本語化、各カードに KURODA_SPOTLIGHT(star/star/youngThreat) 寸評+年齢追加、セクション見出しを「ライバル団体 注目選手」→「○○団体 注目選手」(ライバル団体名 + エンブレム)。⑤**2面 ファンの声復活**: `.np-fan-section` 新設、FAN_OPINIONS の 5tier(devastating/behind/even/ahead/dominant) × 4tone(neutral/hardcore/troll/hopeful) から 3 件 pick(@熱狂派/@辛口派/@分析派)。⑥**3面 H2H表記**: 「4-3」→「4勝-3勝」+ 引分時「(N分)」、「N戦」→「通算N戦」。⑦**3面 narrative増量**: featured narrative を 2本 pick して連結(seed派生 0xC1A1/0xC1A2/0xC1A3 で 3候補から重複排除して 2本確保)、不在時は通算戦績ベースのフォールバック2段落。⑧**3面 history空時案内**: h2h.history 空時に「通算N戦の記録はあるが、各試合の詳細データはまだ蓄積中」プレースホルダー。⑨**3面 関係カード拡張**: 9象限 TAG_DESC テーブル(label/desc/cls)で各タグの意味を `.np-relation-tag-desc`(「冷」: 言葉なき戦い、静かな確執 等)で表示、`.np-relation-org-line`(団体エンブレム × 名前 × vs)、`.np-relation-stats`(通算N戦/N勝-N勝/最高MQ)、選手名クリック可化。⑩**画像サイズ1段アップ**: `.np-digest-thumb` 36→44px / `.np-sub-photo` 56→72px / `.np-matchup-photo` 50→64px / `.np-spotlight-photo` 48→64px / `.np-relation-photo` 32→44px。⑪**新規ヘルパー**: `_npOrgEmblem(state, orgKey, size)`(player/AI団体エンブレム取得、ui-common.js の orgIconHtml 流用)、`_npFindFighterOrgKey(state, charId)`(roster/aiOrgs 検索で 'player'/'org_s'/'org_a'/'org_b' 返却)。検証: 2面 matchupComment=2件、powerVal=8件(4軸×2)、spotlightComment=3件、ファンコメント=3件、spotlightTag=「エース級/主力級/中堅級」、見出し「皇武館 注目選手」 / 3面 H2Hバッジ「17勝-12勝」「通算29戦」、narrative paragraph=2、historyEmpty placeholder=表示、relation card に「宿」タグ desc + 通算17戦 + 13勝-4勝 + 最高MQ79 + 団体エンブレム×12(6カード×2) を確認、コンソールエラー 0。auto-sim 不要(UIのみ)。変更: src/index.html(`.np-matchup-comment / .np-power-val / .np-power-row新レイアウト / .np-spotlight-comment / .np-fan-* / .np-empty-substory / .np-relation-org-line / .np-relation-stats / .np-relation-tag-desc / .np-rivalry-emblem` 約50行追加 + 各画像サイズ調整)+src/ui-render.js(`_npOrgEmblem / _npFindFighterOrgKey` ヘルパー追加 + 1面subStories常時表示+次回展望削除 + 2面matchup寸評/spotlight寸評/spotlight日本語化/ファンの声 + 3面 H2H表記/narrative複数pick/historyプレースホルダー/relations 9象限desc+エンブレム+戦績、約350行差分)+docs/game-system-roadmap.md(本項)。

前回: **新聞タブ独立化 v3.0 — モックアップv8準拠 全面リデザイン（2026-04-26）。** Phase 2/3 の DBサブタブ実装が `docs/ui/mockups/newspaper-mockup-v8.html` と乖離していた指摘を受け、新聞・団体比較・因縁列伝を**独立トップタブ「📰 新聞」**に統合し、v8 モックアップ準拠で全面書き直し。①**Phase A タブ独立化**: ナビバーに「📰 新聞」追加(showScreen('newspaper'))、`#screen-newspaper` 新設(`#newspaperContent` を内包)、`renderNewspaper()` + `setNewspaperSubPage(1|2|3)` で 1面/2面/3面 切替。DBサブタブから `2 (団体比較) / 5 (新聞) / 8 (因縁列伝)` を撤去し残り順序を `0 全選手 / 1 全コーチ / 4 相関図 / (7 派閥) / 3 殿堂 / 6 年代記` に再構築。`renderDatabase()` 冒頭で旧 `_dbSubTab=2/5/8` を 0 にフォールバック。②**Phase B 共通CSS新設**: `src/index.html` に `.np-*` namespace で約400行追加 — `.np-paper(max-width:780px 統一)` / `.np-paper-header(赤グラデ + 週刊グラップル + シーズン/週)` / `.np-archive-nav(バックナンバー)` / `.np-sec(赤ピル inline-block + width:fit-content + justify-self:start)` / `.np-sec-gold(金グラデピル)` / `.np-kuroda(顔40px + 引用 + byline)` 等。③**Phase C 1面**: `_npRenderPage1` + `_npRenderPlayerShow` + `_npRenderDigest` 新設。`.np-top-story` 200×240額装(EXCLUSIVEスタンプ + キャプションoverlay) + 24px見出し + sub バー + justify本文。`.np-show-result` 130×130 fighter-card×2 + WINスタンプ + result-line(MQ大) + show-article + rating-block(★+黒田コメント)。`.np-digest-table` 4列(#/badge/カード/MQ右寄せ)、寸評 colspan。`.np-sub-stories` 2col グリッド + まとめ末尾黒田寸評 + preview。④**Phase D 2面**: `_npRenderPage2` 新設。`Engine.database.getOrgCompareAnalysis` を再利用。`.np-cmp-select`(ライバル選択) → `.np-headline-section`(黒田顔 + summaryText + GRADE 36px Bebas) → `.np-org-summary` 3列(player/VS/rival 各カードに stats grid + 王者) → **`.np-ace-confront` 280px upper画像対峙(右側 scaleX(-1) flip) + 中央 VS+OVRメトリクス + 名前バー2col中央寄せ(団体/名前/OVR/人気) + フレーバー** → `.np-matchup-list` 主力対決2件 → **`.np-power-section` 4軸単色バー(player=#9a7020 単色、rival=#8b1a1a 単色、中央1pxライン)** → `.np-editorial`(黒田コラム) → `.np-spotlight-grid` 3件(ace/star/threat タグ)。⑤**Phase E 3面**: `_npRenderPage3` + `_npFindRuntimeFighter` 新設。featured と relations を `_pickRivalryFeatured` から取得。`.np-rivalry-headline`(9象限タグ別 9種 headlineMap で pre/title/sub) → **`.np-rivalry-main` 暗背景 + 320px stand画像対峙(`background-size:contain;background-position:center bottom` で引き気味、ユーザ指摘の「途切れ気味」解消) + VS+H2H W-L-D + N戦バッジ + `.np-rivalry-info` 完全中央寄せ(団体/名前/役割/OVR(runtime値)/年齢/勝数すべて表示)** + narrative(`KURODA_RELATION_NARRATIVE[tag]` seeded pick) → `.np-history-row` h2h.history直近10戦時系列 → `.np-relations-grid` 6件 9象限タグ別カラー。`_npFindRuntimeFighter` で `roster / aiOrgs / freeAgents / retiredFighters` から runtime fighter を取得し、age や trained OVR を反映(ALL_CHARS では age 不在のため重要)。⑥**Phase F 検証**: `chronicle-demo-30seasons-seed4242.json` ロード → 各面巡回。`.np-paper max-width=780px` / `.np-rivalry-stand height=320px` / `.np-stand-wrap height=280px (2面ace)` / `.np-power-bar-wrap .player-side bg=rgb(154,112,32)` / `.np-power-bar-wrap .rival-side bg=rgb(139,26,26)` / `.np-rivalry-side text-align=center + OVR79・年齢31・勝17 表示` / `.np-sec width=80px(fit-content適用後)` / 1面 photoFrame=1, fphoto=2, digestRows=6, kuroda=2 / 2面 aceConfront=1, standImg=2, matchupRows=2, powerRows=4, spotlight=3 / 3面 sides=2, relations=6 を確認、コンソールエラー 0。auto-sim 不要(UIのみ)。残: `_renderDbNewspaper / _renderDbOrgCompare / _renderDbRivalry` は dead code として残置(将来削除候補)。h2h.history が空のセーブでは history セクション非表示(意図通り)。変更: src/index.html(ナビボタン追加 + `#screen-newspaper` + `.np-*` CSS 約400行)+src/ui-render.js(`renderNewspaper / setNewspaperSubPage / _npRenderPage1/2/3 / _npRenderPlayerShow / _npRenderDigest / _npFindOrgChampion / _npFindRuntimeFighter` 等 約750行追加 + `_dbSubTab` 配列縮小)+src/ui-common.js(showScreen newspaper 分岐)+specs/newspaper-and-orgcompare-spec-v2.0.md(v3.0 全面書き直し)+docs/game-system-roadmap.md(本項)。

前回: **新聞・団体比較リデザイン Phase 3（2026-04-26）。** `docs/handoff-newspaper-rivalry-redesign-v3.md` の作業範囲を消化。Phase 2 の実装(額装200×240/4軸バーレーダー/`.ndt-port` 48px/KURODA +120本)を実機(`test/fixtures/chronicle-demo-30seasons-seed4242.json` ロード→DBサブタブ巡回)で視覚回帰確認 → 全エッジケース問題なし。①**`.ndt-port` サイズ最終判断** — 実機で 48×48px のテーブル幅と名前列バランスを inspect、画面幅圧迫なし(table 幅 518px、名前 60px、★列 70px)→ Option A(48px 維持)を採用、CSS 変更なし。Option B(80px) / Option C(130px+カードレイアウト化) は将来タスク化。②**`.sec-label` 重複定義整理** — `src/index.html` L1218 `.rivalry-history .sec-label` と L1233 `.rivalry-relations .sec-label-gold` のスコープ付き2行を削除し、Phase 2 で追加したグローバル定義に統一。削除後の `_renderDbRivalry` 配下要素の computed style(font-size:11px / letter-spacing:2px / color:#5b4b34 / border-left:3px solid #8b1a1a / padding-left:8px / margin-bottom:8px / font-weight:700 / text-transform:uppercase)がグローバルと完全同値であることを `preview_inspect` で確認。リグレッションなし。③**`db-cmp-vs-mark-circle` 動作確認** — desktop(1280px) で position:absolute / 64×64 / 中央オーバーレイ、tablet(709px ≤900px) で position:relative / 48×48 縦並びフォールバック、両モード OK。④**specs 反映** — `specs/newspaper-and-orgcompare-spec-v2.0.md` を新規作成(共通CSSトークン9種/新聞1面構造/ダイジェストテーブル5列/4軸バー軸定義/KURODAテキストseed pick4種/Phase 3整理結果/見送り拡張3点/実装ファイル4種を記載)、`CLAUDE.md` ファイル索引(全35→36)に追記。検証: preview_inspect で `.ndt-port`(48×48)/`.newspaper-photo-frame`(200×240)/`.org-bar-radar`(grid 4行)/`.db-cmp-vs-mark-circle`(absolute←→relative 切替)/`.rivalry-history .sec-label`(削除後同値) を確認、コンソールエラー 0。auto-sim 不要(UI のみの変更、試合数値・判定に無影響)。残タスク: スコープ外と明記した `.ndt-port` 130px化(別タスク) / `starPower` 計算式刷新(別タスク)。変更: src/index.html(`.rivalry-history .sec-label` + `.rivalry-relations .sec-label-gold` 2行削除)+specs/newspaper-and-orgcompare-spec-v2.0.md(新規)+CLAUDE.md(索引追記、全36ファイル)+docs/game-system-roadmap.md(本項)+docs/handoff-newspaper-rivalry-redesign-v3.md→docs/archive/。

前回: **新聞・団体比較リデザイン Phase 2（2026-04-26）。** `docs/handoff-newspaper-rivalry-redesign-v2.md` の作業範囲を実装。①**Step 1 共通CSS基盤** — `src/index.html` に `.paper-header / .page-nav / .sec-label / .sec-label-gold（グローバル昇格、因縁列伝のスコープ付き既存定義と同値）/ .kuroda-block + .kuroda-face / .newspaper-photo-frame（200×240 額装風）/ .other-org-news-grid（2カラム + ≤600px 1カラム）/ .ndt-rating（★列）/ .org-bar-radar + .bar-row + .bar-fill.left/right + .bar-axis-label / .db-cmp-vs-mark-circle（absolute 中央重ね、≤900px は relative）` を追加（約60行）。`.ndt-port` を 28×28 → 48×48（≤600px は 36×36）に拡大。②**Step 2 新聞1面豪華化** — `_renderDbNewspaper` の一面記事写真を 64×64 portrait → 200×240 額装写真（`.newspaper-photo-frame` + `getUpperUrl(id) → getPortraitUrl(id)` フォールバック）に置換、`_renderNewspaperDigest` のテーブル各行に ★列 (`.ndt-rating`) 追加（`MQ - expectedMQ` 差分から ★1〜5 を算出、`isDraw` は ★3 固定）、他団体ニュース部を 1カラム積み → `.other-org-news-grid` 2カラム + 各カードに `.kuroda-block`（取材モード `KURODA_NEWS_COMMENT[ss.type]` を `Engine.rng.derive(season, week, idx, 0xC0DC)` で seeded pick）追加。③**Step 3 団体比較2面刷新** — `_renderDbOrgCompare` のSVG放射状レーダー(7806–7828) + `.db-cmp-meter` 4本バー(7830–7841) を完全に削除し、左右対称バー型レーダー4軸 (`エース力 / 層の厚み / 集客力 / タイトル力` = 既存 `playerScores.{ace, depth, popularity, starPower}` に一対一マッピング、計算式変更なし) + 軸名+差分(`+N`/`-N`) 中央表示の `.org-bar-radar` に置換。`.db-cmp-org-summary-row` の `1fr auto 1fr` → inline `1fr 1fr;position:relative` 化、中央 `<div class="db-cmp-org-summary-grade">` ブロック削除、代わりに `<div class="db-cmp-vs-mark-circle">VS</div>` を absolute 中央重ね（≤900px はカード間 relative フォールバック）。`.db-cmp-match-featured` ace対決および `.ace-char.left img { transform:scaleX(-1) }` は touch しない。④**Step 4 KURODA配列文面拡充** — `src/kuroda-text.js` 既存7配列に約120本追加。`KURODA_HEADLINES` 各tier+5本 / `KURODA_EDITORIAL` 各tier+5本 / `KURODA_WAR_RECORD.{evenRecord, winStreak, loseStreak}` 各+3本 / `KURODA_MATCHUP_FLAVOR.style/age/h2h` の各サブキー+3本 / `KURODA_SPOTLIGHT.{star, growth, youngThreat}` 各+3本 / `FAN_OPINIONS` 各tier×各型+2本 / `KURODA_NEWS_COMMENT` 各カテゴリ+3本（こちらのみ取材モード、他は論評モード）。文体は v1 handoff「黒田幸子の文体設計」厳守、お決まりフレーズ「本紙は」「〜と書いておく」「数字は嘘をつかない」「40年見てきた中で」を 2〜3割で散布、断定形語尾統一。検証: `preview_eval` で `KURODA_HEADLINES.dominant.length=18` / `FAN_OPINIONS.dominant.hopeful.length=9` 等の実測ロード確認、`.org-bar-radar` 4行レンダリング、`.newspaper-photo-frame` 200×240 実測、`.other-org-news-grid grid-template-columns="254px 254px"` 2カラム成立、`.kuroda-block` 3個レンダリング、`.db-cmp-org-summary-row grid-template-columns="300px 300px"`、コンソールエラー 0、因縁列伝3面のリグレッション無し（v1 で確定済み `.rivalry-history .sec-label` スコープ付き定義は残置・グローバル定義と共存）。auto-sim 不要（UI のみの変更、軸スコア計算式は触らず）。変更: src/index.html(共通CSS約60行追加 + .ndt-port サイズ調整)+src/ui-render.js(_renderDbNewspaper 一面写真額装 + 他団体2カラム+寸評、_renderNewspaperDigest ★列、_renderDbOrgCompare SVGレーダー→バー型置換 + VS円章中央化、計約180行差分)+src/kuroda-text.js(7配列に約120本追加、約160行)+docs/game-system-roadmap.md(本項)+docs/handoff-newspaper-rivalry-redesign-v2.md→docs/archive/。

前回: **因縁列伝(3面)実装 + 新聞・団体比較リデザイン Phase 1（2026-04-25）。** `docs/handoff-newspaper-rivalry-redesign-v1.md` の Step 1/2/4 を一括実装。①**Step 1 派閥タブ位置移動 + 非表示制御** — `_dbSubTab` のサブタブ配列を `全選手 / 全コーチ / 相関図 / (派閥) / 団体比較 / 新聞 / 因縁列伝 / 殿堂 / 年代記` に再順序、派閥タブを `G.factions && G.factions.length > 0` 条件付き表示に変更（スプレッド構文）。②**Step 2 MQ会場補正** — `_renderNewspaperDigest` の `expectedMQ` を会場レベル別 10 段ベースライン（`EXPECTED_MQ_BY_VENUE` 公民館 base:18 popCoef:0.30 〜 ドーム base:60 popCoef:0.80）+ Max:95 cap で計算する `_calcExpectedMQ` ヘルパーに置換、`d.venueIdx` を `App.buildShowResultData` 戻り値（src/app.js）に追加。③**Step 4-1 H2H拡張** — `Engine.h2h.update` (relationships.js L2200) に末尾 `stage='show'` 引数追加 + `entry.history` 配列（`{s,w,st,win:'A'|'B'|'d',mq,t?,p?}`、上限50件で先頭シフト）追加。呼び出し7箇所に stage 引数追加（app.js: タッグ/シングル='show', 対抗戦='war', PPV='ppv'、management.js: AI団体内='show', auto-sim タッグ/シングル='show'）。AI vs AI 対抗戦の h2h 記録ロジックが欠落していたため `processAIWar` (management.js L6498 付近) に `Engine.h2h.update` を追加（stage='war'）。④**Step 4-2 SAVE_TRIM** — `app.js` の `SAVE_TRIM` に `h2hHistoryMax: 50` 追加、`Storage.serialize` でペア毎 history トリミング処理を追加。⑤**Step 4-4 KURODA_RELATION_NARRATIVE** — `kuroda-text.js` 末尾に新規追加。9象限タグ全網羅（主要4象限 `fated_admiration / pure_hatred / bitter_feud / allied_rivalry` 各5本以上 / 残り5象限 `destined_rival / standard_rivalry / mutual_respect / cold_rivalry / casual_rivalry` 各2本）、handoff §冒頭「黒田幸子の文体設計」セクション準拠の取材モード（深め）、お決まりフレーズ「本紙は」「〜と書いておく」「数字は嘘をつかない」「N年の付き合い」を散りばめ。⑥**Step 4-3 _renderDbRivalry** — ui-render.js に新規 `_dbSubTab === 8` ルート追加。`_classifyRelation(bond,rivalry)` で 9象限分類（rivalry < 40 は null=非表示）、`_pickRivalryFeatured(state)` で featured 1件 + relations 6件をスコア（rivalry×0.4 + matches×0.2 + bestMQ×0.2 + |bond-50|×0.3 + プレイヤー絡み+15 + 濃い象限ボーナス）でソート、双方向平均 bond/rivalry。featured セクションは v8 モックアップ準拠の暗背景 + スタンド画像対峙（左 flip）+ 戦績バッジ + 黒田 narrative + ファクトフッター、history セクションは history[] 直近10戦を時系列で stage バッジ（対抗戦/PPV/タイトル戦）+ 結果列付きで表示、relations セクションは 6 枠 2カラムグリッド + 9象限別 border-left-color。`_findFighterOrgName` ヘルパーで AI団体名解決。`_isPlayerSide` で勝者色分け（win-player/win-rival）。⑦**Step 4-5 CSS** — `index.html` に `.rivalry-headline / .rivalry-main / .rivalry-featured-* / .rivalry-history / .relation-card[data-tag=*] / .db-cmp-rivalry-empty` 等を v8 mockup から抽出して追加（約80行）。`.db-cmp-wrap` を `max-width:780px;margin:0 auto` に統一（780px 紙面統一 Phase 1）。検証: auto-sim 30シーズン(seed=4242, 1590週) ALL CLEAR / preview_eval で因縁列伝タブ render OK / サブタブ並び順確認 / コンソールエラー 0。残タスク: Step 3 完全実装（_renderDbNewspaper/_renderDbOrgCompare の写真拡大・寸評列・SVGレーダー廃止→左右対称バー型レーダー置換）と既存配列の文面拡充は別セッションで段階実装推奨（範囲が大きいため）。新規 spec: `specs/rivalry-chronicle-spec-v1.0.md`。変更: src/relationships.js(Engine.h2h.update 拡張)+src/app.js(SAVE_TRIM h2hHistoryMax + venueIdx 付与 + 4箇所 stage 引数)+src/management.js(3箇所 stage 引数 + processAIWar h2h 記録追加)+src/ui-render.js(subTabs 再順序 + faction 条件 + EXPECTED_MQ_BY_VENUE + _renderDbRivalry 関連 6 関数追加 約220行)+src/kuroda-text.js(KURODA_RELATION_NARRATIVE 新規 約100行)+src/index.html(rivalry CSS 追加 約80行)+specs/rivalry-chronicle-spec-v1.0.md(新規)+docs/handoff-newspaper-rivalry-redesign-v1.md→docs/archive/+docs/game-system-roadmap.md(本項)。

前回: **団体ランキング画面 v0.9 リデザイン完了（2026-04-25）。** `plans/ranking-screen-redesign-v0.9-task.md` のハンドオフに基づき `#screen-ranking` をモックアップ `docs/ui/mockups/ranking-redesign-v0.9-for-mockups-dir.html` 準拠の **マスト + 勝利条件バー + 4団体グリッド + 団体プロファイル + シーズン履歴** 4セクション構造へ全面置換。Phase 1: `:root` に順位カラー（`--rank-1〜4` 金/銀/銅/鋼 各 base/light/deep）+ OVR階調 8段階（`--v-mythic`〜`--v-poor`、80以上で黄色味スタート）+ 看板赤（`--board-red*`）+ 中性アクセント（`--th-*`）+ `--office-bg-deep` を追加、`OVR_TIER_THRESHOLDS`（`src/data.js`）+ `valueClassOvr(ovr)`（`src/ui-common.js`）で OVR 数字専用クラス決定を集中管理。`#screen-ranking` の DOM を `.ranking-popup > .popup-header / #rankingMast / #rankingVictoryBar / #rankingContent` へ再構築、マスト「INDUSTRY STANDINGS / 第N シーズン・全4団体 / Y{N} W{N}」+ 勝利条件バー（▲1位・中央−Npt・▼自団体、1位プレイヤー時は `.is-top` で👑業界1位フォールバック）。Phase 2: 02 全団体ロースター — `.orgs-grid` 1.3fr/1fr/1fr/1fr で1位カードのみ拡大、`.orgcell-formation` T字配置（pos-1 中央前面 130〜150×165〜195px / pos-2 左後ろ / pos-3 右後ろ）、主力はトップ3固定（順位連動なし）、`margin-top:auto` でフッター直上押し付けにより全カードのキャラ下端揃え、レンタル・怪我・休養を主力から除外、tier-pill（rank-color グラデ）/ 看板赤バッジ / 王冠リングライト。Phase 3: 03 団体プロファイル — `.org-card grid: 320px/1fr`、偶数位（2位・4位）に `.flip` で grid 反転、`.org-card:not(.flip) .org-banner .ace-stand img { transform: scaleX(-1); }` で左バナー stand 画像を右向きに反転、フォーメーション 5/4/3/2 名（順位連動）+ pos-1〜pos-5 の重畳配置、`.stats-bar` 5列（RATING gold / BASE / LEGACY / BATTLE +/- / POPULARITY）、`.champ-row`（不在時は empty バリアント）、`.roster-toggle` ボタン + `.roster-list` で「全選手を見る」展開（既存 `<details>` から書換）、選手クリックで `showFighterPopup` 既存ポップアップ起動。Phase 4: 04 シーズン履歴 — `.history-wrap table` 化、順位カラム `.h-rank-1〜4` をトークン化、利益増減を `.profit-pos/.profit-neg` (`--signal-up`/`--signal-down`) 化、`section-marker` から番号を排除して kicker のみ表示、透かし「04」は実装せず（v0.9.1 確定方針）。`Engine.ranking.updateRankings(G)` のロジックは非変更（UI のみのリファクタ）。検証は `preview_inspect` で DOM/CSS 構造（grid-template-columns 192.875/148.375/148.375/148.359 = 1.3:1:1:1 / `.flip` 反転 / `.is-rank-1` border-top: rgb(212,168,67) / OVR 階調色 / `.victory-bar.is-top` フォールバック表示 / `.roster-toggle` トグル動作 / fcell クリックで `fighterPopupOverlay` 表示 / 4 orgcell + 4 org-card + 14 fcell の構造）を確認、コンソールエラー 0、auto-sim 不要（UI 変更のみで試合数値・判定に無影響）。新規 spec: `docs/ui/03-screens/ranking.md`。変更: src/index.html(`:root` トークン約60行 + ranking 専用 CSS 約700行 + `#screen-ranking` HTML)+src/ui-render.js(renderRanking 全面書換、約220行→約230行)+src/data.js(OVR_TIER_THRESHOLDS 追加)+src/ui-common.js(valueClassOvr ヘルパー追加)+docs/ui/03-screens/ranking.md(新規)+docs/game-system-roadmap.md(本項)。

前回: **勝利セリフ補完（2026-04-25）。** ID 100〜128 の後期追加キャラ18名（土岐山乃ノ佳/沢登鮎/大山たかみ/財津琴美/黒岩千晶/赤沼紗稀/結城玲奈/戸塚ゆかり/若林美佐子/朝比奈ひかり/綿貫すず/リナ・モーガン/クラッシャー毒島/割田久美/岩小路志摩子/蔵前静/柳沼英子/西園百合香）の `VICTORY_LINES` が未定義で試合結果画面にセリフが表示されていなかった問題を修正。各キャラの personality/archetype/style/traits を参照し、3行セリフを個別執筆（composed=鷹揚スタイルガイド準拠、delinquent=喧嘩口調、ojousama=お嬢様言葉、quiet=寡黙など口調統一）。auto-sim 不要（UI/演出のみの変更、試合数値・判定に無影響）。変更: src/victory-lines.js(18エントリ追加)。

前回: **モーダル統一 Phase 4 完了（2026-04-24）。** `feature/modal-unification` ブランチで Phase 0〜4 を完走し main にマージ。D型(軽量ダイアログ)として対象 6 モーダルを `#mdlDOverlay` / `mdl-d-*` CSS クラスに移行した。①**D-1 確認ダイアログ** (`showConfirm`): `#confirmOverlay` → `#mdlDOverlay`。inline の `.btn-gold/.btn-blue` を `mdl-d-btn primary/secondary` に。②**D-2 通知トースト** (`showNotifEventToast`): `notifModalOverlay` → `#mdlDOverlay`。顔画像を `notif-modal-face` (img タグ) から `mdl-d-face` (background-image) に移行。`mdl-d-body/detail/italic` でテキスト3段構造。③**D-3a Glimpse A/B** (`_renderGlimpseA/_renderGlimpseB`): 同上。2人構図は inline flex + `mdl-d-face` で構成、tone→`positive/urgent` バリアントに変換。④**D-3b 試合後対話** (`_renderNextMatchDialogue`): 同上。`mdl-d-detail warn` で敗者セリフを赤左ボーダー強調。⑤**D-5 スカウト競合** (`renderScoutCompetitionModal`): 動的 DOM + 全 inline style を廃止、`#mdlDOverlay` + `mdl-d-title urgent/detail/actions` に置換（`ui-render.js`）。⑥**D-6 R3 モーダル** (`showR3Modal`): `document.createElement/body.appendChild` 動的 DOM を廃止、`_mdlDOpen/_mdlDClose` ヘルパー経由に統一。⑦**共通ヘルパー** `_mdlDOpen(html)` / `_mdlDClose()` を `_mdlCClose` 直後（`ui-common.js` L272）に追加。⑧**D-4 careOverlay** はスキップ — `careOverlay` が `_factionModalOverlay`(L6876) と `showLargeEventModal`(L8242) に現役使用中の B 型モーダルのため対象外。⑨**closeNotifModal / closeMatchDialogue** を `_mdlDClose()` 呼び出しに統一。D-2/D-3a/D-3b/D-3b が同一コンテナを使うキュー処理は変更なし。⑩`notifModalOverlay`/`confirmOverlay` コンテナは HTML に残置（削除しない）。auto-sim 不要（試合数値・判定に無影響の UI 変更）。検証: preview_eval で D-1〜D-6 全 6 モーダルの DOM 構造・className・innerHTML を確認（`mdl-d-*` クラス正常適用、コンソールエラー 0）。変更: src/ui-common.js(_mdlDOpen/_mdlDClose ヘルパー + showR3Modal + showConfirm + showNotifEventToast + _renderGlimpseA/B + _renderNextMatchDialogue + closeNotifModal/closeMatchDialogue)+src/ui-render.js(renderScoutCompetitionModal)+docs/game-system-roadmap.md(本項)。

前回: **試合観戦バグ修正（2026-04-23）。** ①**ダメージセリフ cutin がオートで詰まる**: ピンシーケンス中の `damage` ステップ（クリティカルヒット時にフィニッシュと同ターンで表示されるダメージ反応 cutin）に auto-dismiss タイマーが設定されていなかった。通常試合中のダメージ反応（L738）には `setTimeout(() => { if (S.pendingCutin) dismissCutin(); }, 1500)` が存在するが、`_executePinStep` の `damage` ブランチには未設定だった。同じ 1500ms タイマーを追加することで、オートモード時に自動 dismiss → `_advancePinStep()` の流れが繋がる。変更: `src/battle-engine-main.js`（1 行追加）。②**`checkPinAttempt` 経由の関節技がフォール演出になる**: HP が残っている状態でサブミッション技のピン試み(`checkPinAttempt`)が成功した場合、`_turnPinAttempt = 'success'` は設定されるが `_turnKickout` が null のまま。`_buildPinCtrl` のギブアップ分岐は `fr.kickout.escapeType === 'gu'` を判定するため null では通過できず、フォール演出に落ちていた。HP<=0 サブミッション経路は正しく `_turnKickout = { count, escapeType: 'gu' }` を設定していた。`isSubPin` が true の場合に `_turnKickout = { count: 0, escapeType: 'gu' }` を追加設定することで `_buildPinCtrl` がギブアップ演出を選択するようになる。変更: `src/match-engine.js`（3 行追加）。いずれも `recordFrames=true` 時のみ動く演出系のため auto-sim 不要。結果データへの影響なし（管理側の finType は元から正しい）。

前回: **派閥システム Phase 1b — 人数偏り対策（v0.8, 2026-04-23）。** `plans/faction-phase1b-task.md` の実装。派閥 v1.0 運用中に判明した「1 派閥が 9〜10 人規模まで肥大化→第二派閥が生まれず停滞」問題への構造的ブレーキを §2.2 メンバー加入に 2 本追加。①**サイズベース加入率減衰** — `FACTION_CONFIG.joinSizeMult: {4:1.0, 6:0.6, 7:0.3, 8:0.0}` を追加、既存の勢い修正（`joinMomentumHighMult`/`joinMomentumLowMult`）の**後**に乗算。8 人以上で実質ストップ。②**単独派閥の加入凍結** — `FACTION_CONFIG.soloFactionFreezeSize:5`、派閥数 === 1 かつ サイズ ≥5 で新規加入判定スキップ。解除条件は「第二派閥誕生（F01 再発火/F02/F05-B 分裂）/ 当該派閥が F05-B で分裂 / 脱退でサイズ 4 以下」のいずれかで、状態フラグは持たず毎週評価。③**実装**: `src/factions.js` に `_getJoinSizeMult(size)` ヘルパー追加（`_isHostile` 近辺、昇順 threshold チェック）、`processWeeklyMemberChanges` の加入判定ブロック冒頭で `soloFreeze` 評価 + ループ先頭 `if (soloFreeze) continue` + 既存 rate 計算の末尾に `rate *= this._getJoinSizeMult(f.memberIds.length)` を追加。離脱判定・trust 更新・§2.6 80% 解散・F05-B 分裂・RNG は一切変更なし。④**検証**: auto-sim 5 シード × 100 シーズン ALL CLEAR（engine-integrity）。分布実測は **auto-sim で不可能**（auto-sim 初期プレイヤーロスター 5 名、`minRosterSize:10` 未満で派閥が形成されない — MEASURE_FACTION 計測試行で 5300 週中 faction 0 件を確認）→ 分布 3 指標検証は実機プレイに委任。⑤spec 更新: `specs/faction-system-spec-v0.1.md` §2.2 にサイズ倍率 + 単独凍結ブロック追加、v0.8 履歴追記、§17 に Phase 1b 完了エントリ追加、ステータス表記を「🟢 Phase 1〜3d + Phase 1b 実装済み（v0.8 / v1.0 機能完成 + 人数偏り対策）」に更新。変更: src/data.js(FACTION_CONFIG に 2 値追加)+src/factions.js(_getJoinSizeMult + processWeeklyMemberChanges 加入ブロック)+specs/faction-system-spec-v0.1.md(§2.2/§17/変更履歴 v0.8)+docs/game-system-roadmap.md(本項)。

前回: **試合後画面 Pattern B 統一 Phase 1-4 完了（2026-04-23）。** `docs/ui/03-screens/show-result-spec.md` と `docs/ui/mockups/show-result-pattern-b.html` に基づき、試合後オーバーレイ全10画面を Stage カテゴリ（P7 Theatrical）の `.pb-container` 構造に統一。Phase 1: 通常/特別興行 (`renderShowResult`) `93868a8` / Phase 2: PPV GRAND FINAL + PPV TV観戦 (`renderPPVResult`/`renderPPVTVResult`) `5d3590d` / Phase 3: 対抗戦最終/進行 (`renderWarFinalResult`/`renderWarMatchPreview`) `287b43a`（敵エースセリフは `.pb-ace-area` 独立セクション + 160px 肖像に敵団体色左ボーダー / 敗北時 `.is-defeated` で grayscale / 進行画面は `.pb-mrow.is-resolved|.is-upcoming|.is-pending` の3状態で次試合カードに「🎬観る/≫スキップ」ボタン内包） / Phase 4a: JT 各試合結果 (`renderJuniorTournamentMatchResult`) `be04ec9`（Scoreboard: Round/Match N/M/MQ★/Finish、`_jtFighterShim` ヘルパーで trimmed fighter に等配 stat を付けて `Engine.util.ov` 透過） / Phase 4b: JT 優勝発表 (`renderJuniorTournamentResult`) `04a71d2`（Scoreboard: Path(QF→SF→F)/Total MQ★/Final MQ★/Prize/OVR、`.pb-champion-card` 200×300 肖像 + 3重金ボーダー + 右上🏆 + スピーチバブル金縁、CHAMPION ラベル Bebas 44px gold gradient、`.pb-champion-sub` 準優勝(銀)/Semifinalist(銅)、プレイヤー団体賞金サマリー `.pb-champion-prizebox` で合計金額大表示。Ceremony化せず Stage のまま金強調のみ） / Phase 4c: B3 挑戦状結果 (`_renderB3MatchResult`) `8bdc96e`（Scoreboard: Opponent/Result/MQ★/Finish、単一 `.pb-mrow.is-main.is-b3` + side accent + 勝敗両者セリフ） / Phase 4d: B2 対立決着 (`_renderB2MatchResult`) `e5ffcef`（Scoreboard: Intervention/Result/MQ★/Relationship質的表現、`.pb-b2-resolution` で信頼/士気を数値非表示の質的テキストのみ — CLAUDE.md 数値哲学準拠）。全画面に `.pb-live.is-*` バッジ + `.pb-banner-title.is-*` グラデテキストで識別性確保、`--pb-enemy-color` CSS 変数で敵団体色をインライン注入、`_pbFighterBlock`/`_pbResultColumn`/`_pbHpMini`/`_pbStars`/`escHtml` の共通ヘルパーで DRY 化、`:has(.pb-container)` セレクタで overlay 側を自動 Stage トーン化（pb-mode クラス管理不要）。検証は `preview_eval` で DOM 構造レベル確認（screenshot は巨大ページで timeout 頻発するため）。残タスク: 旧 CSS（`.war-header`/`.war-mc`/`.mc-*`/`.ace-*`/`.jt-ch`/`.jt-mf-stands`/`.ppvtv-*` 等）の `grep -rn` 未使用確認後まとめ削除は別セッションで。`_warHeader` ヘルパーは Phase 3 完了時点で未使用だが `_warStatRow` は B3/B2 *試合前* preview でまだ使用中のため保持。変更: src/ui-common.js(renderShowResult/renderPPVResult/renderPPVTVResult/renderWarFinalResult/renderWarMatchPreview/renderJuniorTournamentMatchResult/renderJuniorTournamentResult/_renderB3MatchResult/_renderB2MatchResult 全8関数を pb-container 化 + `_pbFighterBlock` 等 6 共通ヘルパー追加 + `_jtFighterShim`)+src/index.html(`.pb-*` CSS 全追加 / Phase 3 War variant / Phase 4a JT match / Phase 4b JT champion / Phase 4c B3 / Phase 4d B2 variant)+docs/ui/03-screens/show-result-spec.md(実装状況=完了 / U-03 決着記述)+plans/post-match-redesign-session-handoff.md(Phase 3-4 完了記録)+docs/game-system-roadmap.md(本項)。

前回: **派閥イベント F05-F08 リワーク — Office クリーム型統一 + F05 通知化 / F06 2択化 / F07 独裁化日本語化 / F08 duel レイアウト（2026-04-23）。** `docs/ui/mockups/faction-events-f05-f08-rework.html` と `docs/faction-events-f05-f08-rework-handoff.md` の仕様を実装に落とし、F01〜F08 モーダル全体を Office クリーム panel（`.fevt-overlay-office` / `.fevt-report-card`）でビジュアル統一。①**F05 派閥内に火種** — 3択モーダル（焚きつける/止めにいく/見守る）を廃し、通知ワンボタン「見守る ✓」に変更。`applyF05Choice` は choiceId を無視して 70% 自然分裂（`createFaction(ringleaderId, dissidentIds, { type:'loyal' })`）／30% 維持の invisible dice を回し、CD 12 週は常時マーク。dispatcher 互換のため `onChoice('X')` のコールバックは残存。②**F06 和解の兆し** — 旧 3択 A(1,000,000)後押し/B 自然/C 煽る を削除し、A 「そっと結束を後押しする」（コストなし、hostility -15〜-25 / bond +3〜+5 / trust +3〜+5）+ B 「何もしない」（CD 16 週、natural decay に委譲）の 2 択へ簡素化。モーダルは `.fevt-subject-pair`（両リーダー portrait + `.fevt-pair-bridge` ↔）+ HOSTILITY 平均 marker + `.fevt-quote.peace`（`FACTION_F06_AMBIENT_LINES` RNG 0xFA61）+ `.fevt-decision-tray.two` で 2 カード配置。③**F07 リーダーの要求** — spec §9.7 3択ロジック（A 独裁容認 / B 釘を刺す / C 別幹部を立てる）は維持しつつ、プレイヤー向けテキストで internal "dictator" を「独裁化」に全言い換え、選択肢に具体的数値ヒント（「リーダー trust +5、メンバー trust -3〜-6、ロッカー士気 -3〜-5」等）を明記。モーダルは `.fevt-quote.leader`（`FACTION_F07_LEADER_LINES` RNG 0xFA71）+ 三者（follower + leader + follower、OVR 上位から抽選）レイアウト、独裁化カードは `.label-strong.red` で強調。④**F08 対立ヒートアップ** — ロジック（A 直接対決カード強制 / B 仲裁 / C 静観）維持で UI を subject-duel に刷新。`.fevt-subject-duel` は 1fr/auto/1fr グリッドで VS バッジ + 左右 portrait + faction + name + OVR + `.fevt-bubble.left`/`.right`（`FACTION_F08_LEADER_LINES` RNG 0xFA81 で性格×アーキタイプ別）。B「仲裁する」は `funds < f08AlternativeCost` でも常時 `.label-disabled`（「条件未達」表示、クリック早期 return、`applyF08Choice` 側も防御的 no-op）。C「静観する」は `_markCooldown` を通さず hostility 維持で次週も再発火可能に変更（`applyF08Choice` 内で C 分岐のみ CD スキップ）。A 選択時のみ CD 24 週 + `_pendingF08Directive` 設定。⑤**ディスパッチャ統一** — `showFactionEventResult` callback は従来通り。`_factionAudioOpen`/`Close` は v7 セッションで配線済み、今回は UI 書換のみで音響系は無変更。⑥spec 更新: §9.5（F05 通知化 + invisible dice + CD 12 週）/ §9.6（2択テーブル）/ §9.8（A CD24週 / B disabled 表示 / C CDなし）+ §10 flow diagram の F05-B 参照を「F05 自然分裂」に置換、F08-A/F08-C 分岐追記。⑦検証: preview_start `root` 経由で F06/F07/F08 モーダルを DOM 構造レベルで確認（`.fevt-subject-pair` / `.fevt-subject-duel` / `.fevt-decision-card.label-disabled` / `.fevt-quote.peace`/`.leader` / bubble left/right 各セレクタすべて期待通り）。スクショは timeout で失敗したため構造検証で代替。auto-sim はスキップ（試合数値/判定に無影響）。⑧handoff: `docs/faction-events-f05-f08-rework-handoff.md` を `docs/archive/` へ移動。変更: src/ui-common.js(showFactionF06Modal/F07Modal/F08Modal 全書換 + F05 通知化対応)+src/factions.js(applyF05Choice 簡素化 + applyF06Choice A/B 2択化 + applyF08Choice C 非 CD 化)+specs/faction-system-spec-v0.1.md(§9.5/§9.6/§9.8 + §10 diagram)+docs/faction-events-f05-f08-rework-handoff.md→docs/archive/+docs/game-system-roadmap.md(本項)。

前回: **派閥イベント演出 v7 — §2-1 UI モーダル通し確認完了 + §2-3 F05-F08 BGM 仕様確定（2026-04-23）。** handoff v7 の残タスクを消化して派閥イベント演出一式の v1.0 を完成。①§2-1 手動通し確認: 検証用デバッグパネル（URL ハッシュ `#debug-faction` で右下に表示、`_factionAudioOpen(id)` → 4 秒後に自動 `_factionAudioClose(id)` を 13 イベント分ボタン化、state 非変更）を `src/app.js` 末尾に一時追加し、全 13 エントリ（F01-F08 + F02 進展 4 種 + F05H）の BGM 切替 / openStinger / closeStinger / management BGM 復帰を実機聴き取りで確認、音量・stinger タイミング・復帰の間すべて違和感なく確定。確認後デバッグパネルは削除、`f02EndlessStreakWeeks` を 52 に戻して本番値に復元。途中、preview サーバー `dev`（port 3000、src/ 配信）では `../bgm/` 相対パスが 404 する問題を発見、`root` preview（port 3002、repo root 配信）経由 [http://localhost:3002/src/](http://localhost:3002/src/) に切替えて解決（handoff v7 §3 の落とし穴として追記対象）。②§2-3 F05-F08 BGM 仕様確定: handoff v7 §2-3 の叩き台どおり `FACTION_AUDIO_MAP` の 4 エントリを本仕様化。F05（派閥内亀裂）は `Soft Bids, Sharp Minds.mp3` × 0.14 で穏やかトーン据え置き / F06（和解の兆し）は Soft × 0.16 + 終止 `f06_fin_chime_v1.mp3` × 0.10 closeStinger で「終わりの合図」添え / F07（リーダー横暴）は `bgm_tension_v1.mp3` × 0.15 で内面的重苦しさの tension 抑えめ / F08（対立ヒートアップ）は tension × 0.17 + 冒頭 `f07_gong_v1.mp3` × 0.15 openStinger で F02/ignite 系との統一感。③`docs/ui/03-screens/faction-events.md §音響設計` の表を F04 止まり→全 13 イベント分（F01-F08 + F05H + F02 進展 4 種）に拡張、各行に演出意図（「和解なので chime で終わりの合図」「F08 は F02 系と統一感」等）メモ添え、表冒頭に「実装側は FACTION_AUDIO_MAP に準拠」の参照リンク追記。④handoff v7 §5 ゴール手順すべて完了、次セッション本体タスクは解消。残は §2-3 optional 相当の F05H 活動休止の演出指定 spec 反映（既に v7 §1-2 で済）のみ。変更: src/app.js(FACTION_AUDIO_MAP 4 エントリ F06/F07/F08 本仕様化 + F05 コメント更新、検証用デバッグパネルは追加→削除で結果無変更)+src/data.js(f02EndlessStreakWeeks 戻し)+docs/ui/03-screens/faction-events.md(§音響設計 表拡張 F05-F08 + F05H + F02 進展 4 種 + 意図メモ)+docs/game-system-roadmap.md(本項)。

前回: **派閥イベント演出 §2-1 — Audio hooks 実装完了 + §2-3 F05H specs 反映（2026-04-23）。** handoff v6 §2-1 の BGM/stinger 登録マップを実装。①`src/app.js` Audio 公開 API に `stinger(src, volume)` ワンショットヘルパーを追加（`HTMLAudioElement` で BGM に触れずに再生、全体 mute 時は無音、SE マスターボリューム適用）。②`FACTION_AUDIO_MAP` を新設し F01〜F08 + F02 進展 4 種 + F05H の 13 種について `{ src, volume, openStinger?, closeStinger? }` を定数化。登録値: F01/F04 は `Soft Bids, Sharp Minds.mp3` × 0.14 / F02 act2 + F02_RESOLUTION は `bgm_tension_v1.mp3` × 0.17 / F02_IGNITE は tension × 0.18 + 冒頭 `f07_gong_v1.mp3` × 0.15 stinger（150ms 遅延で BGM と重ならず）/ F02_PEACE は Soft Bids × 0.12 + 終止 `f06_fin_chime_v1.mp3` × 0.10 stinger / F02_ENDLESS は tension × 0.10（諦念トーン用の控えめ）/ F03 / F05H は Soft Bids × 0.10 + 終止 chime × 0.09 / F05/F06/F07/F08 は未規定のため Soft Bids × 0.14 フォールバック。③`_factionAudioOpen(eventId)` / `_factionAudioClose(eventId)` 補助関数: Open では `Audio.fileBgm.play(src, {loop:true, volume})` で既存 management/tension チップチューンを自動停止しつつ BGM 切替、openStinger があれば 150ms 遅延で1発。Close では closeStinger → `Audio.fileBgm.fadeOut(1500)` → 1600ms 後に `Audio.bgm.playForState()` で状態に応じた通常 BGM（management/tension 等）を復帰。④`App.handleFactionEvent` の 13 分岐それぞれで先頭に `_factionAudioOpen(eventId)` を呼び、`showFactionEventResult` の onClose に `finalizeAudio = () => _factionAudioClose(eventId)` クロージャを渡して結果モーダル「閉じる」クリック時に閉幕演出が走るように配線（旧 `() => {}` を全箇所差し替え）。⑤handoff v6 §3-2 の BGM 二重再生回避要件は `FileBGM.play` が内部で `BGM.stop()` を呼ぶ既存仕様でカバー、fadeOut→playForState の 1600ms オフセットで無音区間を確保。⑥§2-3: `specs/faction-system-spec-v0.1.md` に §9.10「F05H 活動休止（リーダー長期離脱）」セクションを追加（発火条件 `injury.weeksLeft >= 8` + active status / 影響 status='hiatus'+inHostility=false+momentum=0 / 自動復帰 `applyHiatusRecovery` / F03 との区別 旗を畳む vs 旗を降ろす / 演出 Soft Bids × 0.7 + chime × 0.6 / 実装参照 `detectHiatusTrigger` `applyF05HResult` `applyHiatusRecovery` + `showFactionHiatusModal` + handleFactionEvent `'F05H'`）。⑦auto-sim はスキップ（handoff v6 §2-1 検証方針: 試合数値・判定に無影響）。残タスク: §2-2 UI モーダル手動通し確認（Keisuke 手元で F02① ignite / F02② peace / F02③ resolution / F02④ endless 発火確認、F02④ は `FACTION_CONFIG.f02EndlessStreakWeeks` を一時 10〜20 に下げての検証推奨）。変更: src/app.js(Audio.stinger + FACTION_AUDIO + FACTION_AUDIO_MAP + _factionAudioOpen/Close + handleFactionEvent 13 分岐 onClose 配線)+specs/faction-system-spec-v0.1.md(§9.10 F05H 追加)+docs/game-system-roadmap.md(本項)。

前回: **派閥イベント演出 §3-2 — F02 進展 4 種（ignite / peace / resolution / endless）実装完了（2026-04-23）。** F02「派閥抗争の勃発」発火後の 4 進展経路をエンジン側で全配線。①F02① **ignite（発火）** — `factionPendingIgnite`（F02 で A=煽る を選択時登録）と興行カード両リーダーのシングル試合マッチで発火。hostility +12 両方向 + `factionTimeline` IGNITE エントリ + 登録消費。興行実行直後（validMatches 確定後）に `checkF02IgniteTrigger` を `finalizeShow` / `executeShow` から呼ぶ。`expireF02PendingIgnite` で `expireWeek = 登録週+4` 超過分を派閥パイプライン冒頭でサイレントクリア。②F02② **peace（沈静化）** — `f02MediationWatches`（F02 で B=仲裁 を選択時 `deadlineWeek = 登録週+12` で登録）+ 両方向 hostility が base から -20 以上減衰 + `state.lockerRoomMorale ≥ 55` で発火。hostility -40 両方向 / momentum 0 両派閥 / `inHostility=false` 解除 / 両リーダー間 bond +3 / watch 削除 / `factionTimeline` PEACE。`sweepF02PeaceWatches` で deadline 超過分をパイプラインでサイレント削除。`pickWeeklyEvent` 優先順に `F02_PEACE` を挿入（F08 より前）。③F02③ **resolution（決着）** — 両派閥リーダー同士のシングル試合でドロー以外 + 両方向 hostility ≥60 で発火。試合結果フック 4 パス（finalizeShow/executeShow/finalizeWar/finalizePPV）で `rollResolutionAfterMatch` を呼び `applyF02ResolutionResult` に委譲。勝者 momentum +18〜+25 / 敗者 -22〜-25 / 勝者リーダー trust +6〜+8 / 敗者 -3〜-5 / メンバー→リーダー bond 勝者 +5〜+8 / 敗者 -6〜-9 / hostility -40 両方向 / 敗者派閥下位 2〜3 名 trust -4〜-6 / `factionTimeline` RESOLVED。敗者派閥は F03 消滅経路へ自然フォールスルー（専用モーダルなし）。④F02④ **endless（無限抗争）** — 両方向 hostility 平均 ≥55 が 52 週連続 で発火（`factionEndlessStreak[pairKey]` で週次更新、CD 52 週）。両派閥メンバーの `mentalCoeff` -0.02（0.85 床）+ `factionTimeline` ENDLESS + streak リセット。`pickWeeklyEvent` に `F02_ENDLESS` を `F05H` の次（`F08` より前）に挿入。⑤UI モーダル（`showFactionF02IgniteModal` / `PeaceModal` / `ResolutionModal` / `EndlessModal`）は v3 で ui-common.js 実装済み、本セッションはエンジン配線のみ。`handleFactionEvent` に 4 分岐（RNG seed 0xFA24〜0xFA27）追加。⑥定数: `FACTION_CONFIG.f02EndlessHostilityMinAverage: 55` / `f02EndlessStreakWeeks: 52` / `f02EndlessCooldown: 52`。⑦state 初期化: 派閥パイプライン冒頭で `factionEndlessStreak: {}` / `f02MediationWatches: []` 未初期化セーブ対応を追加。⑧applyF02Choice を 4 択 → 3 択に refactor（UI モック `A=煽る / B=仲裁 / C=介入しない` との齟齬解消、v4 handoff の 4 択記述は誤り）。⑨優先順（pickWeeklyEvent 最新）: `F03 > F05H > F02_ENDLESS > F02_PEACE > F08 > F04 > F05 > F07 > F06 > F02 > F01`、試合フック経由は `!s._pendingFactionEvent` ガードで早い者勝ち。検証: auto-sim 20シーズン(seed=42) + 100シーズン(seed=7919) ALL CLEAR。変更: factions.js(+~250行 F02 検出/適用 7 関数)+data.js(+3 定数)+management.js(+state 初期化 + 派閥パイプライン 4 関数呼び出し + executeShow ignite/resolution フック)+app.js(+handleFactionEvent 4 分岐 + finalizeShow/finalizeWar フック)+test/auto-sim.js(+autoHandleFactionEvent 4 分岐)+specs/faction-system-spec-v0.1.md(§9.11 F02 進展 4 種 追記 + §9.2 F02 選択肢 3 択化)+docs/faction-events-handoff-v5.md(新設)。残タスク: Audio hooks（v4 §2-2 継続、未着手）+ UI モーダル通し確認（手動）。

前回: **派閥システム Phase 3d — bond/rivalry 連動カタログ（2026-04-22）→ 派閥 v1.0 完成。** spec v0.7。派閥構造が関係性ネットワークに還元されない「飾り」だった状態を解消し、派閥成立後にメンバー間・敵対派閥間の bond/rivalry が**派閥構造によって自走**するようにした。①`src/factions.js` に新関数 `processFactionInfluenceOnRelationships(state, rng)` を追加、tickWeek 派閥パイプラインの `processWeeklyMemberChanges` の後・`processWeeklyHostilityDecay` の前に挿入。②6 効果を実装（**既存 `processWeeklyDecay` は素通しで加算重ね**）: (1) 派閥内結束 bond +0.15/週 全ペア / (2) 抗争越境敵意 rivalry +0.3/週 敵対派閥メンバー全組み合わせ双方向 / (3) 寝返り磁力 rivalry +0.5/週 敵メンバーとの bond 平均 60+ な選手 → 敵リーダー方向 / (4) 権威化の下向き圧 bond +0.1/週 `authoritativeTag` リーダー → メンバー一方向（逆向き ±0） / (5) 独裁化の亀裂 rivalry +0.2/週 `dictatorTag` 派閥メンバー全ペア / (6) 消滅余波 bond -5〜-10 を `_dissolveFaction` で元メンバー全ペアに一律適用（1 派閥 1 回ロール）。③ヘルパー追加: `_applyRivalryDirected` / `_applyRivalryBetweenMembers` / `_collectHostilePairs`（`state.factionHostility` 走査で無向ペア列挙）/ `_applyTurncoatMagnetism`（`_avgBond` 経由で敵メンバー bond 平均 60+ を検出し敵リーダー方向 rivalry 加算）。④RNG `0xFA19`（週次派閥効果用、将来の randomization 拡張予約）/ `0xFA1A`（消滅余波 bond ロール用、`rngSeed⊕factionId` で派閥ごとに独立）。⑤数値感（52 週/季）: 結束 +7.8/季（減衰と相殺で実効 +3〜+5）/ 越境敵意 +15.6/季 / 寝返り磁力 +26/季 / 権威化圧 +5.2/季 / 独裁亀裂 +10.4/季。⑥spec v0.7 追記 + §17 Phase 3d 完了記録（§17 を Phase 3d 先頭に並べ替え）、spec ステータスを「🟢 Phase 1〜3d 実装済み（v1.0 機能完成）」に更新。触らなかった場所: `Engine.relationships.*` のシグネチャ / `processWeeklyDecay` 挙動 / `calcMatchAppeal` factionAppeal 分岐 / F01〜F08 UI。検証: auto-sim 10 シード × 100 シーズン ALL CLEAR（違反 0 / エラー 0）。**派閥 v1.0 完成宣言**。残タスク: Phase 4（§10 ロスター運営への波及、未計画）+ v0.x 履歴統合の spec 整理。変更: src/factions.js(新関数 + ヘルパー 4 + `_dissolveFaction` 余波) + src/management.js(tickWeek 派閥パイプラインに新関数挿入 2 箇所) + specs/faction-system-spec-v0.1.md(ステータス更新 + §17 Phase 3d 節追加 + 変更履歴 v0.7) + docs/game-system-roadmap.md(本項) + plans/faction-phase3d-task.md → plans/archive/(アーカイブ予定)。

前回: **派閥システム Phase 3c — 相関図 派閥オーバーレイ + 重複所属修復（2026-04-22）。** spec v0.6。当初「第4ビューモード」方式で実装したが、実機検証で (1) 他リンク引力に負けて円が巨大化 (2) 全体表示でアイコンが中央に集中しうるさい (3) 派閥重複所属のデータ破綻で円が跨って破綻、の 3 問題を確認し**団体フィルタ連動型の軽量トグル**に再設計。①UI 実装: 状態 `_relmapFactionOverlay`/`_relmapSavedCenterId`/`_relmapFactionCenters:{x,y,keepR}`、`.rm-view-toggle` に 🎭 派閥ボタン（団体フィルタ OFF/派閥 0 時 disabled）、`_relmapToggleFactionOverlay()`（ON 時 CENTER 選手を退避 `_relmapCenterId=null` でフラット表示、OFF 時 CENTER 復元）、`_relmapFocusOrg` が団体切替時にオーバーレイ自動解除 + 🎭 ボタン disabled/active/title 動的更新、`_relmapGetFilteredFactions()` でフィルタ団体のメンバーを含む派閥列挙、`_relmapComputeFactionCenters(list)` で派閥数別配置（N=1:中央/N=2:`W*0.35+W*0.65`/N=3:三角 R=min(W,H)*0.22/N=4+:円周 R=min(W,H)*0.26）+ 各派閥に `keepR=70+max(0,memberCount-3)*15` 保存。②`_relmapTick` の network/orgFilter 分岐: 団体 ON + 🎭 ON で派閥メンバーは派閥中心へ 0.02、非メンバーは画面中央 0.008、非派閥メンバーは `keepR` 以内で各派閥中心から外向き斥力 0.03（円内侵入防止）。団体 ON + 🎭 OFF は既存挙動（全員中央 0.008）。③`_relmapDrawFactionLayer()` は `_relmapOrgFilter && _relmapFactionOverlay` のときのみ描画、(1) 抗争破線（両派閥ともフィルタ内のみ、太さ 1.5〜3.5px、dasharray 6,4、数値なし）(2) 派閥外接円（重心→最遠+24px、`--accent-faction-{(idx%4)+1}`）(3) 派閥名ラベル（Oswald 16px 700、円上辺外側）(4) 👑 18px / ⭐ 15px を別レイヤー `relmapFactionMarkerLayer`（nodeLayer の後）に描画しノード上に確実表示。SVG 3 箇所の innerHTML 初期化に `<g id="relmapFactionMarkerLayer">` 追加。④**派閥重複所属修復**: `Engine.factions._dedupeFactionMembers(state)` 新設で同一 fighterId が複数 memberIds に入っていたら先着派閥に寄せる（リーダー絶対優先、除外時 `console.warn`）、`reconcileRoster` 末尾に組み込みで週次自動修復、`app.js` マイグレーション `_migrated_faction_dedupe_v1` でセーブロード時 1 回修復。実機検証（13年目セーブ）で fighter#9/16/48（宇田川里奈/大河内紗代子/菊池璃子）の複数派閥重複を検出・修復、コンソールヘルパ `__makeFaction` で重複チェック付き派閥再生成を Keisuke が実行し視覚確認完了（富岡加奈子組/大河内紗代子組/三浦早紀組が独立円で描画、👑/⭐ マーカー + 抗争破線正常）。検証: auto-sim 30 シーズン ALL CLEAR。変更: src/ui-render.js(state+button+toggle+focusOrg更新+tick 派閥重力/斥力+drawFactionLayer+markerLayer 3箇所)+src/factions.js(_dedupeFactionMembers+reconcileRoster 組込み)+src/app.js(_migrated_faction_dedupe_v1)+specs/faction-system-spec-v0.1.md(§17 Phase 3c 書換+変更履歴 v0.6)+plans/faction-phase3c-task.md→plans/archive/(アーカイブ予定)。

前回: **派閥システム Phase 3b — F04 寝返り / F05 派閥内亀裂 / F06 和解の兆し / F07 リーダーの横暴 / F08 対立ヒートアップ 演出 + セリフ 6×6 + F08 直接対決ディレクティブ（2026-04-22）。** `specs/faction-system-spec-v0.1.md` Phase 3 の 2 つ目（3b）。①`src/factions.js` に Phase 3b API 追加（~400行）: `checkF04Conditions`（敵対派閥メンバーbond平均70+ & 自派閥リーダーbond40-、score=ally-leader最大で1名特定、CDキー `F04:<targetId>:<toFactionId>`）、`checkF05Conditions`（忠誠型5+人・リーダーbond<35不満分子2+・相互bond>=60でclique形成、ringleader=clique内OVR最上位）、`checkF06Conditions`（抗争中2派閥の両方向hostility平均<25が8週継続）、`updateF06Streaks`（週次で `G.factionReconciliationStreak` を更新、抗争解消ペアキーを自動削除）、`checkF07Conditions`（authoritativeTag + leader.trust>=60）、`checkF08Conditions`（抗争中ペア片方向hostility>=80の最大ペア選出）。`pickWeeklyEvent` を §8.3 優先順 F03>F08>F04>F05>F07>F06>F02>F01 で再編。`applyF04Choice`（A=転籍+元派閥trust-3〜-6+勢い/対立度非対称変動、B=target trust+5、C=告げ口 trust-5〜-8+rivalry+10〜+15+`faction.tensionTag`）、`applyF05Choice`（A=助言 60%で回避、B=分裂 即時createFaction+元leader trust-8〜-12、C=静観 70%で自然分裂）、`applyF06Choice`（A=後押し ¥1,000,000+対立度-15〜-25+bond+3〜+5+trust+3〜+5、B=自然 -5〜-10、C=煽る 士気-3〜-5）、`applyF07Choice`（A=認める dictatorTag+leader trust+5/非メンバー trust-3〜-6/士気-3〜-5、B=釘刺し leader trust-8〜-12+`f07RebukeCount++`、4回で authoritativeTag 除去+カウントリセット、C=別幹部 authTag除去+別幹部 trust+5〜+8+tensionTag）、`applyF08Choice`（A=直接対決 `_pendingF08Directive` 設定、B=別興行 ¥2,000,000+対立度-5〜-10、C=警告 両leader trust-3〜-5+対立度-10〜-15+相互bond+2〜+3）。`applyMatchResult` に `opts.variationMultiplier` 追加（F08 で 1.5×）、`isF08DirectiveMatch` ヘルパ。クールダウン管理: `_f0XKey` + `_isCooldownReady` + `_markCooldown`。`pickRandomChoice` に F04-F08（A/B/C）対応。②`src/data.js FACTION_CONFIG` に F04-F08 関連定数追加（`f04BondAllyThreshold:70`/`f04BondLeaderMaxThreshold:40`/`f05MinFactionSize:5`/`f05DissidentBondMaxThreshold:35`/`f05DissidentCliqueBondThreshold:60`/`f06HostilityMaxAverage:25`/`f06StreakWeeks:8`/`f06Cost:1_000_000`/`f07TrustMinThreshold:60`/`f07RebukeMaxCount:4`/`f08HostilityMinThreshold:80`/`f08AlternativeCost:2_000_000`/`f08MatchResultMultiplier:1.5`）。③`src/data-faction-dialogue.js` に `FACTION_F04_TARGET_LINES`/`FACTION_F05_DISSIDENT_LINES`/`FACTION_F06_AMBIENT_LINES`/`FACTION_F07_LEADER_LINES`/`FACTION_F08_LEADER_LINES` を性格6×アーキタイプ6（normal/ojousama/delinquent/cool/seductive/polite）で追加、normal フォールバック。テンプレセリフ禁止に従い一人称/語尾/感情を性格別に分離。④`src/management.js` 派閥パイプラインに `updateF06Streaks` を `pickWeeklyEvent` 前に挿入、`factionReconciliationStreak` 未初期化セーブ対応。⑤`src/ui-common.js` に `showFactionF04Modal`〜`showFactionF08Modal` 追加（F01/F02 同系の careOverlay ベース4/3シーン構成）。F06-A は `funds<f06Cost` で disabled 表示＋hint「資金不足」、F08-B は `funds<f08AlternativeCost` で同様に disabled 化。グローバル公開に 5 関数追加。⑥`src/app.js handleFactionEvent` に F04-F08 分岐追加（各 RNG シード 0xFA14〜0xFA18）。⑦`src/ui-render.js renderShowPrep` に F08 ディレクティブ注入ロジック: `G._pendingF08Directive` が立っていればリーダー2名を showCard slot 0 に強制組込み（他 slot に該当選手がいれば除去）、`slot._f08Locked=true` マーク。`_spOpenPicker` でロック slot はトースト表示して picker ブロック。試合タグに「🔥 F08 直接対決（固定）」バッジ追加。ディレクティブ無のときは showCard から `_f08Locked` 自動クリア。リーダーがロスター外/欠場ならディレクティブ自動無効化。⑧`src/app.js finalizeShow` に F08 試合結果反映: `isF08Match` を calcMatchAppeal context に渡し（既存 infra 活用）+ ディレクティブ該当試合に `Engine.factions.applyMatchResult` を `variationMultiplier:1.5` で呼び出し＋ `_pendingF08Directive` クリア（RNG seed 0xFA88）。⑨`test/auto-sim.js autoHandleFactionEvent` に F04-F08 ランダム A/B/C 応答追加、TRANSIENT_KEYS に `_pendingF08Directive` 追加。⑩spec §12 RNG シード追加（0xFA14〜0xFA18/0xFA41〜0xFA81/0xFA88）、§17 に Phase 3b 完了記録、変更履歴 v0.5 追記。検証: auto-sim 2 シード × 100 シーズン ALL CLEAR。変更: factions.js(+~450行)+data.js(FACTION_CONFIG追記)+data-faction-dialogue.js(5テーブル追加)+management.js(updateF06Streaks挿入)+ui-common.js(5モーダル関数)+app.js(handleFactionEvent分岐+finalizeShow F08処理)+ui-render.js(F08注入+ロック+バッジ)+test/auto-sim.js(F04-F08対応+TRANSIENT_KEYS)+specs/faction-system-spec-v0.1.md(§12/§17/変更履歴v0.5)+plans/faction-phase3b-handoff.md→plans/archive/(アーカイブ予定)。

前回: **派閥システム Phase 3a — F01/F02/F03 結成・消滅演出 + セリフ叩き台（2026-04-22）。** `specs/faction-system-spec-v0.1.md` の Phase 3 を4分割（3a:F01/F02/F03、3b:F04-F08、3c:相関図派閥ビュー、3d:bond/rivalryカタログ）した最初のフェーズ。演出本体＋セリフ＋ディスパッチャ＋auto-sim の一式を実装。①`src/factions.js` に Phase 3a APIs 追加（~320行）: `pickWeeklyEvent(state, rng)`（F03→F02→F01 優先度で1件選出）、`detectLeaderLoss`（退団/引退/8週以上の長期怪我）、`resolveF03Branch`（後継OVR比で succession/turmoil/dissolution 分岐）、`applyF01Choice(state, payload, choiceId, rng)`（A=権威化 trust+5〜8/bond+3〜5/士気-2〜-4, B=拒否 trust-5〜-8/bond-5〜-8/12週クールダウン, C=静観成立）、`applyF02Choice`（A/B偏重=対立度55〜80非対称+勢い±20/10、C=調停 対立度30〜45、D=静観 rivalry継承）、`applyF03Result`（succession: trust-3〜-6+後継bond+3〜5 / turmoil: trust-8〜-12+対抗派閥momentum+15〜+25 / dissolution: `_dissolveFaction`）+ 補助 `_absWeek`/`_applyBondDirected`/`_applyBondBetweenMembers`/`_applyLockerRoomMorale`/`getFactionLine`。②`src/data-faction-dialogue.js` 新設: `FACTION_F01_LEADER_LINES`/`FACTION_F01_FOLLOWER_LINES`/`FACTION_F02_LEADER_LINES`/`FACTION_F03_SURVIVOR_LINES`（形式: `{[personality]:{[archetype]:[lines]}}`、性格6×アーキタイプ normal/ojousama/delinquent/cool/polite、normal フォールバック、spec §11 4ペア例を種に叩き台量産）。③`src/management.js` tickWeek の派閥パイプライン改修: `_pendingFactionEvent` があれば全パイプラインスキップ、なければ `pickWeeklyEvent` を呼び F01/F02 pending ならメンバー変更・減衰・解散のみ実行（`reconcileRoster` はスキップしてF03のターゲット派閥を保護）、F03 pending なら全スキップ、null なら通常パイプライン。RNG seed 0xFA11。④`src/ui-common.js` モーダルUI: `showFactionF01Modal`（4シーン「次へ」遷移→選択肢A/B/C）、`showFactionF02Modal`（4シーン→A/B/C/D）、`showFactionF03Modal`（軽量1シーン、「続ける」）、`showFactionEventResult`（共通結果画面）。careOverlay/careBox DOM 流用、`innerHTML` 差し替えでシーン遷移。セリフ解決は `Engine.factions.getFactionLine` 経由で personality×archetype マトリクスから決定論的抽選。⑤`src/app.js` ディスパッチャ: advanceWeek 完了後の `_pendingLargeEvent` 直後に `_pendingFactionEvent` 検出ブロック追加、`App.handleFactionEvent(event)` でイベントIDごとにモーダル呼び出し→選択コールバックで `applyF0XChoice/Result` を RNG 0xFA13/23/33 付きで実行→`showFactionEventResult`。⑥`test/auto-sim.js`: `autoHandleFactionEvent(G, simRng)`（A/B/C/D をランダム抽選して applyF0XChoice を直接呼ぶ）、tickWeek 直後・clearTransients 前に実行。TRANSIENT_KEYS に `_pendingFactionEvent` 追加。`loadAsGlobal('data-faction-dialogue.js')` 追加。⑦`src/index.html` に `<script src="data-faction-dialogue.js">` を data.js 直後に追加。⑧spec §12 に RNG 0xFA11/0xFA13/0xFA23/0xFA33/0xFA90 追加、§17 に Phase 3a 完了記録、変更履歴 v0.3 追記。Phase 3b/3c/3d は別セッション。検証: auto-sim 2シード × 100シーズン ALL CLEAR 予定（実行中）。変更: factions.js(~320行追加)+data-faction-dialogue.js(新設)+management.js(tickWeek改修)+ui-common.js(4モーダル関数)+app.js(handleFactionEvent+ディスパッチャ)+test/auto-sim.js(autoHandleFactionEvent+TRANSIENT_KEYS+loader)+index.html(script読込)+specs/faction-system-spec-v0.1.md(§12/§17/変更履歴)+plans/faction-phase3a-task.md→plans/archive/(アーカイブ)。

前回: **派閥システム Phase 2 — UI 実装（2026-04-21〜22）。** `specs/faction-system-spec-v0.1.md` §7 の UI 仕様のうち相関図レイヤーを除く3点を実装、相関図レイヤーは Phase 3 へ延期。Phase 1 バックエンドを可視化する段階で、演出イベント・セリフはまだ作らない（Phase 3/4 の範疇）。①`ui-render.js` `renderDatabase` に「🎭 派閥」サブタブ（`_dbSubTab=7`）を追加、`_renderDbFactions()` で忠誠型／対立型でセクション分け。各派閥カードは識別色の左ボーダー（`--accent-faction-1〜4` 循環割当、rivalrous は破線）+ リーダー顔 72×96px（👑マーカー）+ 幹部顔 52×68px（⭐マーカー）+ その他メンバー顔 36×48px + 結束/勢い/対立の3つのフレーバーメーター（数値は非表示）。認識タグ（権威型/独裁化）も表示。②`ui-common.js` `showFighterPopup` の名前行直下に派閥バッジ（リーダー/幹部/メンバー別、役割アイコン付き）を追加、新関数 `openFactionPanel(factionId)` で DB 派閥タブへ遷移し該当カードを1.5秒ハイライト。無派閥選手にはバッジを出さない。③`ui-render.js` `renderShowPrep` カードタグに `Engine.factions.isFactionFeudMatch` が true の試合のみ「🏴vs🏴 ○○組 vs △△組」バッジを rivalry タグ直前に挿入。④CSS トークン `--accent-faction-1/2/3/4`（琥珀#c38c54/群青#6d94b8/藤紫#8a7aa8/鶯緑#6fa28c）+ `--accent-hostility` #d07a3e + `--accent-faction-feud` を `index.html :root` に追加し、`docs/ui/01-foundations.md §1-8` にドキュメント化（ハードコード色は新規追加なし）。⑤**相関図レイヤー（§7.4）は Phase 2 では描画なし**: 実機検証で「派閥メンバーはフォースシミュで集約されないため、メンバー位置から描いた円は非メンバーを巻き込む巨大な円になり地理的に嘘をつく」「円を外して 👑/⭐ だけ残すと『囲まれていないのに星だけ付いている』状態で逆に混乱を招く」と判断し、Phase 2 では相関図側は一旦描画ゼロに。`_relmapDrawFactionLayer()` 関数本体と `<g id="relmapFactionLayer">` レイヤー要素は Phase 3 の差し込み点として残存（no-op）。Phase 3 で派閥ビューモード（ネットワーク/フォーカス/勢力図に続く第4モード）を新設し物理シムに派閥重力項を追加して描画する方針。触ってはいけない領域（`src/factions.js` の関数シグネチャ・`calcMatchAppeal` の factionAppeal 分岐・`G.factions` の書き換え・既存サブタブの HTML 構造・相関図フォースシミュレーション本体）はすべて無変更。検証: preview_* で DB派閥タブ（忠誠型/対立型セクション+結束/勢い/対立フレーバー+権威型バッジ+リーダー👑/幹部⭐）/ポップアップバッジ＋クリック遷移＋1.5秒ハイライト/試合カード🏴vs🏴バッジの3ポイントを動作確認。auto-sim 1シード×20シーズン ALL CLEAR（violations:0/errors:0/gameOvers:0/1060週/42.2s）。変更: ui-render.js(_dbSubTab=7追加/_renderDbFactions新設/_relmapDrawFactionLayer は Phase 3 差し込み点として no-op 化/renderShowPrepバッジ/SVG構造にrelmapFactionLayer追加×2箇所)+ui-common.js(ポップアップバッジ挿入/openFactionPanel新設)+index.html(派閥トークン追加/DB派閥カードCSS/ポップアップバッジCSS/sp-tag-faction CSS)+docs/ui/01-foundations.md(§1-8トークン追記)+specs/faction-system-spec-v0.1.md(§17 Phase 2完了記録+§7.4 Phase 3延期理由)+plans/faction-phase2-task.md→plans/archive/(アーカイブ)。

前回: **派閥システム Phase 1 — バックエンド実装 + 閾値 v0.2 調整（2026-04-21）。** `specs/faction-system-spec-v0.1.md` の Phase 1 範囲（検出/生成/加入離脱/週次勢い・対立度減衰/解散/calcMatchAppeal統合/validateGameState検証）をバックエンドのみで実装。`feature/faction-system` ブランチで作業。①`src/factions.js` 新設（~600行、27関数の `Engine.factions` ネームスペース）: `reconcileRoster`（週次で在籍外リーダー/メンバーを検出し `handleLeaderLoss` + `memberIds` フィルタで一括解消、5+箇所の退団フックをパッチするより1箇所集約が綺麗）・`checkLoyalFormationConditions`/`checkRivalrousFormationConditions`（ロスター10人＋bond/rivalry閾値）・`createFaction`（loyal/rivalrous）・`processWeeklyMemberChanges`（加入 bond帯別 joinRate 20/40/60% / 離脱 10%）・`processWeeklyHostilityDecay`（-0.3/週）・`processWeeklyMomentumDecay`（-1.0/週）・`checkDissolutionConditions`（memberIds<3 または OVR比 <0.80 で解散）・`handleLeaderLoss`（後継 OVR 0.83以上で継承 / 0.70以上で部分継承 / それ未満で解散）。②`src/data.js` に `FACTION_CONFIG` 追加（minRosterSize:10, loyalBondThreshold:60[v0.2で65→60引下], loyalMinFollowers:2, rivalrousBondThreshold:55[v0.2で60→55], joinRate{60:0.20/70:0.40/80:0.60}, leaveRate:0.10, minFactionSize:3, dissolveRatioThreshold:0.80, successionOvrRatioFull:0.83/Partial:0.70, hostilityDecayPerWeek:-0.3, momentumDecayPerWeek:-1.0, feudSumCap:30, eventProbability/eventCooldown maps for F01-F08）。③`src/management.js` 統合: `calcMatchAppealBreakdown`/`calcMatchAppeal` に factionAppeal 分岐追加し `feudSum = max(rivalryAppeal, factionAppeal)`（排他）を feudSumCap:30 でクランプ → spec §6.3 の「ライバル対立と派閥対立は排他、合計30上限」を実装。`tickWeek` の `processWeeklyDecay` 直後に派閥週次パイプライン挿入（RNG seed 0xFA0B で reconcileRoster → 形成チェック(loyal優先) → processWeeklyMemberChanges → hostility/momentumDecay → checkDissolutionConditions）。`validateGameState` に派閥整合性ブロック追加（配列/memberIds≥3/leaderInMembers/momentum -100~+100/重複所属/hostility 0-100/hostilityキー参照整合）。④`src/app.js` にマイグレーション `_migrated_factions_v1` 追加（`G.factions=[]`/`G.factionHostility={}`/`G.factionEventCooldowns={}` 空初期化）。⑤`src/index.html` に `<script src="factions.js">` 追加（relationships.js 直後）。⑥`test/auto-sim.js` の `loadAsGlobal('factions.js')` 追加（auto-sim 環境でもモジュール読み込み）。⑦v0.2 閾値調整: ユーザー13年目セーブ実測（bond TOP5が52-59クラスタ・誰も65未満到達）を受け、loyal 65→60 / rivalrous 60→55 に引き下げ。spec §2.1 に v0.2 改訂メモ追記。⑧F01-F08 演出系イベントは Phase 3/4 に延期、UI は Phase 2 に延期（本 Phase はバックエンドのみ）。検証: auto-sim 100シーズン(seed=42) ALL CLEAR（違反0/エラー0）。実プレイ検証: 13年目セーブで Y13W24 に「梅ヶ丘みのり組」(memberIds:[33,48,82]) が loyal 型で成立することをコンソール `[WM Faction]` 出力で確認。変更: factions.js(新設)+data.js(FACTION_CONFIG)+management.js(calcMatchAppeal統合/tickWeek/validateGameState)+app.js(マイグレーション)+index.html(script読込)+test/auto-sim.js(loadAsGlobal)+specs/faction-system-spec-v0.1.md(§2.1 v0.2改訂+実装状況セクション追記)+plans/faction-phase1-task.md→plans/archive/(アーカイブ)。

前回: **タッグマッチ ブラッシュアップ v0.1 + バージョン 1.06 梱包（2026-04-19）。** commit a22c686。タッグマッチの粗を取り除く T1-T5 + 追加修正 D1-D5 + big-intro 演出を実装。T1: `STYLE_TAG_MOVES` を 26件単一文字列から 89件の配列化に拡張（スタイル別6カテゴリ×複数バリエーション、フィニッシュ/繋ぎ/カウンターで多彩化）。T2: `TAG_MATCH_WIN_LINES`/`LOSS_LINES`（性格7種×3パターン）+ `TAG_MATCH_COMMENTARY`（7件）を `tag-battle-lines.js` に新設、試合終了時の勝敗セリフと中間コメンタリーを性格依存で出し分け。T3: 丸め込み（pin attempt）時の主体明示（「○○が△△を抑え込んだ！」）。T4: カウント文言を single battle-engine 準拠に統一（ONE! TWO! THREE! / kickout はラインごとに差分）。T5: `attack-arrow` CSS を `battle-shared.css` に集約し ltr/rtl/counter-reversal/miss の4バリアント整備。追加修正 D1-D5 + big-intro: D1 カウンター時のタッグ選手立ち位置補正、D2 ビッグムーブ時の背景演出整合、D3 フィニッシュ判定時のタグパートナー表示、D4 SE 呼び出しを single 準拠に整理（Phase 4b 積み残し）、D5 ピンカウント3段タイミングを single 準拠（Phase 4b 積み残し）、big-intro: ビッグマッチ冒頭のタッグ入場演出シーケンス新設。バージョン: `src/index.html` VERSION 1.05→1.06、`build-zip.sh` VERSION 1.06 + cp リストに 7新ファイル（battle-sfx.js/battle-shared.css/battle-anim.js/battle-lines.js/tag-battle.html/tag-battle-main.js/tag-battle-lines.js）追加 + ガイド loop で 3本（ガイド01-はじめの一歩/ガイド02-さらに先へ/ガイド03-パラメータ解説）同梱。検証: auto-sim 30 シーズン ALL CLEAR、WrestleManager_1.06.zip 55M src:20 img:156 同梱確認。変更: data.js(STYLE_TAG_MOVES配列化)+tag-battle-lines.js(新設 勝敗セリフ+コメンタリー)+tag-battle.html/main.js(T3-T5+D1-D5+big-intro)+battle-shared.css(attack-arrow集約)+src/index.html(VERSION)+build-zip.sh(cp拡張+ガイドloop)+specs/tag-match-system-spec-v0.1.md(§12 ブラッシュアップ v0.1 反映)+docs/archive/tag-match-brushup-design-v0.1.md(指示書アーカイブ)。

前回: **ドーム会場コスト再調整 + 月次収支UIバグ修正（2026-04-18）。** ユーザー実プレイFB(30年目 orgPop100 王者ロスター、ドーム満員でも月次-2,856万)から2点対応。①data.js `VENUES[9]` cost 11000→7000万。spec v1.1 §3.3 の「per-show net +2,440」想定は per-show 単体計算だが、プレイヤーは月次UIで成果を見るため体感ズレ発生。Dome級ロスター(高給必須)の月次ベースで「満員+2,800万ご褒美」を実現する値として 7,000万 に再調整。per-show net は +6,440万相当だが月次の選手給与(10,000万+)で相殺される設計。②ui-render.js `_normalizeFinanceLabel` の会場費条項修正。旧実装は `会場費（◯◯）` を一律 `"会場費"` キーに正規化し count 集計していたため、異会場で興行した月が「会場費（ドーム）×2週」のように最後の会場名で誤表示されていた(実金額は正しい)。ラベル全文をキー化するよう変更して会場別に別行表示。spec v1.1 §3.2 に cost 7000 の改訂履歴追記。§5 年1回制限(`domeShowsThisSeason`)は既に実装済み確認。auto-sim スキップ(試合数値・判定に非影響)。変更: data.js(VENUES[9] cost)+ui-render.js(_normalizeFinanceLabel)+specs/orgpop-rebalance-spec-v1.1.md(§3.2 cost改訂履歴)。

前回: **社長室統合 Phase C — スカウト/レンタルの机上統合（2026-04-16）。** トップバーの「🔍 スカウト」タブを廃止し、社長室に内部タブ（📋 決裁 / 🔍 スカウト / 🤝 レンタル）を追加。①`renderShachoshitsu()` を全面書換: タブ状態 `G._shachoshitsuTab`（decision/scout/rental）に基づいて HUD右側・サマリーバー・壁・机コンテンツを出し分け。交渉中・面談中は専用レンダラーに委譲する early return を追加。②`_renderShachoshitsuHudForTab(tab)` 新設: 決裁→印鑑6本+DP、スカウト→所属N/M名+紹介枠N名、レンタル→枠N/M+残りN枠。③`_renderShachoshitsuSummary(tab)` 新設: タブ直下のサマリーバー。④`_renderShachoshitsuDecisionDesk()` に旧 renderShachoshitsu の書類グリッドロジックを分離。⑤`_renderShachoshitsuScoutDesk()` 新設: FA候補を3列履歴書カード（`document-resume-blank.webp` 264×460px背景、アッパー画像+名前+OVR+5stat棒グラフ+契約金/給与+詳細/契約ボタン）で表示。契約可能候補を先に、知名度不足候補を末尾に配置（グレーオーバーレイ+「契約不可」朱印スタンプ+disabled ボタン）。3枚ずつページ送り（`G._shachoshitsuScoutPage`）。ドラフト開催週は新聞通知+「⚖ ドラフトへ」ボタンを表示（scoutEvent画面への遷移、既存ドラフトフローは無変更）。オフシーズン中は閲覧可能だが契約ボタン disabled。⑥`_renderShachoshitsuRentalDesk()` 新設: レンタル候補を4列×2行の小型カード（`document-mini-blank.webp` 196×148px背景、ポートレイト32px+名前+OVR+費用+期間セレクト+契約ボタン）で表示。金額ソート（安い順/高い順切替）。オフシーズン/枠上限時は制限メモ表示。⑦`_renderShachoshitsuWallRentals()` 新設: 契約中レンタルの壁ミニカード（レンタルタブ表示中のみ壁右下に表示、名前・供給元・残り週数）。⑧タブバッジ: スカウト→ドラフト開催週のみ📰、レンタル→契約中ありのみゴールドドット。⑨`App.switchShachoshitsuTab(tabId)` / `App.shachoshitsuScoutPage(page)` 新設。⑩トップバーからスカウトボタン削除（11→10個）。`showScreen('scout')` に互換処理追加（shachoshitsu+スカウトタブ選択にリダイレクト）。`refreshAll` から `renderScout()` 除去、代わりに shachoshitsu 表示中なら `renderShachoshitsu()` を呼ぶ条件追加。`sortRentalTable` の `renderScout()` 呼び出しを `renderShachoshitsu()` に変更。⑪CSS: `.shachoshitsu-tabs`/`.shachoshitsu-tab`/`.shachoshitsu-summary` タブUI + `.shachoshitsu-scout-grid`/`.shachoshitsu-resume`/`.shachoshitsu-resume-stamp` 履歴書カード + `.shachoshitsu-rental-grid`/`.shachoshitsu-rental-mini` 小型カード + `.shachoshitsu-wall-rental-strip`/`.shachoshitsu-wall-rental-card` 壁ミニカード + `.shachoshitsu-page-nav` ページ送り + `.shachoshitsu-draft-notice` ドラフト通知 を追加。既存 `shachoshitsu-doc-enter` アニメを再利用、stagger delay 付与。⑫`screen-scout` DOM要素は安全のため残存（display:none 固定、将来削除予定）。`renderScout()` 関数定義も残存（呼び出し箇所はすべて除去済み）。Engine.scout / Engine.rental のロジックは一切変更なし。変更: ui-render.js(renderShachoshitsu全面書換+6新関数+refreshAll修正)+index.html(スカウトボタン削除+Phase C CSS追加)+ui-common.js(showScreen互換+sortRentalTable修正)+app.js(switchShachoshitsuTab+shachoshitsuScoutPage追加)。検証: auto-sim 100シーズン(seed=42) ALL CLEAR(violations:0/errors:0/gameOvers:0/5300週)。

前回: **社長室統合 Phase B — 解雇の社長室化（2026-04-16）。** 選手ポップアップの解雇ボタンを、社長室への遷移+「最後の面談」シーンに変更。①`RELEASE_INTERVIEW_LINES` を `data.js` に追加（性格6種×3パターン、bold/quiet/easygoing/earnest/emotional/normal）。②`renderShachoshitsuReleaseInterview(fighter, dialogue)` を `ui-render.js` に追加 — 現在の季節（`getShachoshitsuSeasonId`）の壁+窓背景上に選手ポートレイト96px+吹き出し（`.negotiation-speaker`/`.negotiation-bubble`）、机に `.negotiation-card` として「🚪 解雇の確認」カードを表示。カード内には選手名・取り消し不可警告・「解雇を実行する（赤）」「やっぱりやめる（灰）」の2ボタン。③`ui-common.js` の解雇ボタン onclick を `releaseFighter()` → `App.startReleaseInterview()` に変更（inCard 条件・disabled 表示は維持）。④`app.js` に `startReleaseInterview` / `confirmRelease` / `cancelReleaseInterview` の3メソッドを新設。startReleaseInterview は決定論的RNG（seed=rngSeed×season×week×0xF1E2×charId）でセリフを選択し `G._releaseInterviewTarget` をセットして社長室に遷移。confirmRelease は `_releaseInterviewTarget` をクリアしてから既存 `releaseFighter` を呼び出し（ロジック無変更）、その後 `renderShachoshitsu()` で通常モードに戻る。cancelReleaseInterview はフラグをクリアして `renderShachoshitsu()` を呼ぶ。⑤`showScreen` に `G._releaseInterviewTarget` によるナビゲーションロックを追加（既存の contractNegotiation ロックと並列）。⑥CSS は `index.html` に `.release-card-fighter-name` / `.release-card-warning` / `.release-confirm-btn（赤系）` / `.release-cancel-btn（灰系）` を追加。`_releaseFighterForOverflow` は変更せず面談を挟まない。変更: data.js(RELEASE_INTERVIEW_LINES追加+exports追記)+ui-render.js(renderShachoshitsuReleaseInterview追加)+index.html(解雇面談CSS)+ui-common.js(解雇ボタンonclick変更+ナビロック追加)+app.js(3メソッド追加)。検証: auto-sim 100シーズン(seed=42) ALL CLEAR(violations:0/errors:0/gameOvers:0/5300週)。

前回: **社長室統合 Phase A — 契約交渉の社長室化（2026-04-15）。** offWeek 2 の契約交渉を `careOverlay` モーダルから社長室画面内に移設。壁+窓（冬景色）+机の背景の中で選手と対面して交渉するレイアウトに変更。①`renderShachoshitsuNegotiation(wallHtml, deskHtml)` を `ui-render.js` に新設 — HUDは「シーズンN 契約更新」ラベルに変更（印鑑非表示）、壁エリアは winter 画像を固定、机エリアは `.negotiation-card` に contentHtml を配置。②`_negSpeakerHtml(neg, dialogue, badgeCls, badgeLabel)` ヘルパーを新設 — 壁前に選手ポートレイト 96px + 吹き出しセリフ + 態度バッジ（💰昇給/🚪移籍/⚡突発）をフェードインアニメで表示。③6つの Contract モーダル関数（showContractSummaryModal / showContractNegotiationModal / showContractReactionModal / showContractListenModal / showContractSuddenDepartureModal / showContractResultModal）を careOverlay 不使用の社長室内レンダリングに全面書換。各関数は `renderShachoshitsuNegotiation` を呼び出して画面を描画後、同一 `shachoshitsuContent` 要素内の要素にイベントリスナーを付与。④SE（Audio.play）はすべて維持（paper/tension_hit/event/fanfare/coin/defeat/select/notify/click/transfer/save/stamp）。⑤`showScreen` の先頭に「contractNegotiation 中は shachoshitsu 以外への遷移をブロック」ガードを追加。⑥`App.handleContractNegotiations` の先頭に `showScreen('shachoshitsu')` を追加して遷移を確立。⑦CSS に交渉モード専用クラス群を追加（`.negotiation-wall`/`.negotiation-speaker`/`.negotiation-bubble`/`.neg-badge-*`/`.negotiation-card`/`.neg-card-title`/`.neg-card-info-*`/`.neg-btn`/`.neg-result-section` 等、`var(--paper)` など既存トークンを活用）。careOverlay を使う他のモーダル（選択型イベント・対抗戦・挑戦状等）は一切変更していない。変更: ui-render.js(renderShachoshitsuNegotiation/_negSpeakerHtml 追加)+ui-common.js(showScreen ナビロック追加 / 6モーダル関数書換)+app.js(handleContractNegotiations に showScreen 追加)+index.html(交渉モード CSS 追加)。検証: auto-sim 100シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0)。

前回: **社長室 Phase 9 — ビジュアル磨きとヘルプ + spec v1.1 リライト（2026-04-15、Phase 1-9 全完了）。** Phase 5-8 で社長室の機能はすべて完成しており、Phase 9 は磨き込みの仕上げセッション。①書類の微回転 (±3°、週+docId で決定論的シード、同じ週内は同じ角度で再レンダーしても変わらない、週が変わるとわずかにずれる) — `renderShachoshitsu` で inline `style="--doc-rotate:Xdeg"` を注入、CSS で `.shachoshitsu-doc { transform: rotate(var(--doc-rotate, 0deg)) }` とし、hover ルールも `rotate(var(--doc-rotate, 0deg)) translateY(-4px)` に書換 (既存の is-approving 朱印アニメや is-approved 状態とも衝突しない)。②壁画像フェードイン (`@keyframes shachoshitsu-wall-fade` 0.6s ease-out、opacity 0.35→1.0) — 社長室画面を開く度に場面が立ち上がる感じを演出、季節切替週でも自然に馴染む。③書類フェードイン (`@keyframes shachoshitsu-doc-enter` 0.5s、opacity 0→1 + `filter: blur(1px)→blur(0)`) — 机に書類が並べられる際の立ち上がり演出、翌週の「決裁済みリセット」のビジュアルケアも兼ねる (同じアニメが再レンダー時にも走るので自然に馴染む)。④朱印サウンド追加 — `App.executeDecision` の演出フック冒頭で `Audio.play('stamp')` を呼び、既存のコスト別サウンド (fanfare/award/event/notify) と並列で鳴らす。stamp は既存の Web Audio 合成音で短いバーストなので重ならない。⑤ヘルプ画面の「信頼・士気・ケア」セクションに Phase 7/8 の説明を追記 — 「書類の効き方は選手によって変わる」(不確実性、🌟 深く刺さった / 💤 あまり響かなかった の2段階表現を言及)、「成長バフと並走する信頼」(trainer 4週 / camp 2週の遅延発現を narrative 的に説明)、「社長の自発的行動」(声かけの2段階温度感 gentle/urgent を明記)。⑥spec v1.1 リライト — `specs/shachoshitsu-spec-v1.0.md` の冒頭タイトルを v1.1 に、ステータスを「作成中 → 実装完了 (Phase 1-9)」に更新。§1.2 アクション分類表を 6書類 + 机外 2アクション構成に書換 (encourage を机外に分離、各書類の trust 発現タイミングを「即時」「4週遅延(バフ並走)」「2週遅延(バフ並走)」に明記)。§4.3 即時/遅延発現セクションを trainer/camp のみ遅延・narrative 変更理由(ボーナス/休暇/宴席は即時が自然) + 「即時万能感の排除」を Phase 8 の不確実性に全面移行した旨を明記。§5 遅延発現メカニズム全面書換 (対象 trainer/camp のみ、期間 `_trainerBuff.weeksLeft` と同期、データ構造に finalMult 追加、UI表現を選手ポップアップバッジ + 週次ミニ通知トーストに)。§6.1 不確実性基本方針に「v1.0 から v1.1 で即時万能感の排除手段を遅延発現から不確実性へ移行」明記。§6.3 性格マトリクスから `shy` 行削除 (プロジェクトに存在しない、6性格構成) + camp 列追加。§6.4 アーキタイプマトリクスを全書類に拡張 (ojousama×camp=0.80 / delinquent×trainer=1.10 / cool×encourage=0.80 / seductive×refresh_leave=1.10 を追加)。§6.6 UI表現をトーンマーカー (🌟/💤) と trainer 予告文言3段階に更新、team 書類でトーンマーカー非表示の旨を明記。末尾の変更履歴に v1.1 (2026-04-15) エントリを追加し、Phase 5-9 で判明した設計変更8項目を一覧化。変更: ui-render.js(renderShachoshitsu docRotation 関数 + inline style 注入)+index.html(.shachoshitsu-wall animation + .shachoshitsu-doc transform + hover 書換 + is-approved transform 保持 + @keyframes shachoshitsu-wall-fade/shachoshitsu-doc-enter + ヘルプセクション追記)+app.js(executeDecision 演出フックに Audio.play('stamp') 追加)+specs/shachoshitsu-spec-v1.0.md(v1.1 逆輸入 全面リライト)。検証: auto-sim 50シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0/2650週)。実機: 書類3枚にそれぞれ異なる rotation (bonus:0.28° / trainer:-2.12° / camp:-2.74°) が inline style で付与、週2に進めると 3枚とも別値に変化(bonus:-2.06° / trainer:0.32° / camp:-1.28°)。壁の animation-name が shachoshitsu-wall-fade、書類の animation-name が shachoshitsu-doc-enter、hover で rotation 保持。bonus 実行で Audio.play 呼出履歴が ['stamp','notify']、.is-approving と .hanko.falling クラス付与を確認。ヘルプセクションに不確実性/遅延発現/声かけ2段階の説明が含有 (1478 文字)。仕様: specs/shachoshitsu-spec-v1.0.md v1.1 (全面リライト)。指示書: plans/archive/shachoshitsu-phase9-task.md(未作成、Phase 9 は指示書なしで実装)。

前回: **社長室 Phase 8 — 性格×アーキタイプで決裁効果が±50%変動（2026-04-15）。** spec v1.0 §6 の2マトリクス(性格×書類, アーキタイプ×書類)を採用し、`finalMult = clamp(personalityMult × archetypeMult, 0.5, 1.5)` を各書類の trust 効果に乗算。同じ書類でも選手の性格・アーキタイプで効き目が ±50% 変動するようになり、「刺せば必ず望み通りに効く」万能感が崩れた。「即時万能感の排除」を Phase 7 の遅延発現から Phase 8 の不確実性に完全移行(遅延発現は trainer/camp のみで成長バフ並走、ボーナス等は narrative の時間軸を優先して即時維持)。実装: `src/data.js` に `DECISION_PERSONALITY_MULT` (6性格×7書類: normal/bold/quiet/easygoing/earnest/emotional — spec §6.3 の shy はプロジェクトに存在しないため除外) と `DECISION_ARCHETYPE_MULT` (4非normal × 書類: ojousama/delinquent/cool/seductive、記載なしは 1.00) を追加。spec §6.4 を拡張して camp/encourage/refresh_leave/trainer の組合せを narrative から補完(ojousama×camp=0.80, delinquent×trainer=1.10, cool×encourage=0.80, seductive×refresh_leave=1.10)。`Engine.shachoshitsu.calcUncertainty(docId, fighter)` 新設: personalityMult × archetypeMult を算出、`Math.max(0.5, Math.min(1.5, mult))` で clamp。`Engine.shachoshitsu.classifyTone(finalMult)` 新設: ≥1.2='high' / <0.8='low' / それ以外=null を返す。`execute` 内 `queueTrust` のシグネチャに `finalMult` パラメータ追加(Phase 7 の `pendingTrustDeltas.finalMult` フィールドに保存され、`applyPendingTrustDeltas` で毎週 `perWeekDelta × finalMult` として適用される)。各書類分岐で `calcUncertainty` を呼んで trust 効果に適用 — bonus/refresh_leave/encourage/media は `applyTrust(f, delta * mult)`、trainer は `queueTrust(f, delta, 'trainer', weeks, mult)`、party/camp は選手ごとに `calcUncertainty` 呼出。`condition`/`slumpMomentum`/`growthBoost`/`orgPopDelta` は不確実性対象外(固定効果のまま)。個人書類の `execute` 返り値に `reactionTone` / `finalMult` を追加(team書類は選手ごとに mult が異なるため含めない)。`showDecisionResultModal` に `displayData.reactionTone` を読み取ってトーンマーカーを表示(🌟 深く刺さった / 💤 あまり響かなかったようだ、普通は無表示)。trainer の予告文言を3段階に出し分け: high→「今後4週にわたって、予想以上に深く響いていきそうだ」/ low→「今後4週にわたって、わずかに効いていくだけかもしれない」/ normal→「今後4週にわたって、じわじわと育っていく」。`app.js` の `executeDecision` / `encourageFighter` の displayData 構築に `reactionTone: result.reactionTone || null` を追加。CSS `.decision-result-tone.high`/`.low` を `src/index.html` に追加(high: rgba(212,168,67,0.18) 背景 + #e8c35c テキスト + 金色発光、low: rgba(160,160,160,0.10) 背景 + #a8a8a8 テキスト)。検証: auto-sim 100シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0/5300週)。実機 (preview_eval 経由): calcUncertainty 13パターン検証で normal/normal=1.0/tone=null, emotional=1.3/high, ojousama×bonus=0.7/low, emotional×delinquent clamp 1.5, bold×cool×bonus=0.56/low を全て確認。execute 経由の bonus trust 上昇差を4パターン検証: emotional/delinquent +9.28/🌟, normal/normal +6.19/無印, bold/cool +3.46/💤, normal/ojousama +4.33/💤 (同じ書類で 3倍差)。trainer 遅延型4週シミュレーションで finalMult が perWeekDelta に正確に乗算され trustDelta が 8.04×mult で累積することを確認。camp (team書類) 3選手に別々の mult (1.1/1.2/0.72) を適用、返り値に reactionTone/finalMult 非含有を確認。結果モーダル DOM で high/low マーカーの class と text 表示、team書類で非表示を確認。変更: data.js(DECISION_PERSONALITY_MULT/DECISION_ARCHETYPE_MULT)+management.js(calcUncertainty/classifyTone/queueTrust シグネチャ拡張/execute 各書類分岐 6箇所/execute 返り値 reactionTone/trainer 予告文言3段階)+ui-common.js(showDecisionResultModal トーンマーカー HTML)+app.js(executeDecision/encourageFighter displayData)+index.html(.decision-result-tone CSS)。仕様: specs/shachoshitsu-spec-v1.0.md §6 (設計意図そのまま採用、matrix 数値は spec §6.3/§6.4 の叩き台を継承、実機プレイで尖りすぎたら後で調整)。指示書: plans/shachoshitsu-phase8-task.md。

前回: **社長室 Phase 7 — trainer/camp の信頼度遅延発現 + 可視化（2026-04-15）。** spec v1.0 の「全書類3週遅延」方針を narrative 不整合により修正(Keisuke 指摘: ボーナスや休暇は金や休みをもらったその瞬間が嬉しさのピーク、遅延発現にすると感情の時間軸が壊れる)。Phase 7 で遅延発現するのは成長バフが並走する2書類のみ — `trainer` (4週、`_trainerBuff.weeksLeft` と完全同期) / `camp` (2週、全員同期)。残り5書類(bonus/refresh_leave/party/encourage/media)は即時維持、既存動作を一切変更せず。「即時万能感の排除」は Phase 8 の不確実性(性格×アーキタイプ ±50%)に全面委譲。実装: `fighter.pendingTrustDeltas: [{source, totalDelta, perWeekDelta, weeksRemaining, startedWeek, finalMult}]` を全選手マイグレーション + `makeChar`/`makeAIFighter` で初期化。`Engine.shachoshitsu.execute` 内に `queueTrust` ローカルヘルパー新設(`applyTrust` はそのまま残し即時型書類が使い続ける)、trainer/camp 分岐だけ `queueTrust` 経由に変更。`Engine.shachoshitsu.applyPendingTrustDeltas(roster)` 新設、`processManage` 内 `tickTrainerBuffs` 直後で呼び出し(同タイミング実行でバフと発現が同期)。processManage 返り値に `_pendingTrustReveals`、`tickWeek` で state 転送、`processWeek()` で `perWeekDelta` 降順で1件だけピックしてミニ通知トースト表示(「🤝 専属トレーナーとの練習で○○の気持ちが前向きになってきた」、camp 全員分の reveal 過剰を防ぐため上限1件)。結果モーダル: trainer/camp の changes を「今後◯週にわたって、じわじわと育っていく」文言に書換(個人書類の信頼度 changes 構築で `docId === 'trainer'` 分岐を優先、bonus/refresh_leave/encourage/media は従来の `Engine.trust.describeChange` 質的表現を維持)。`showFighterPopup` ステータスバッジ群に `_trainerBuff` 表示追加 — 「🏋️ 専属トレーナー 残り4週 — 信頼もじわじわ育つ」(source='camp' なら「合宿」)、数値は出さず残り週数のみ、ゴールド系 `#d4a843`。`validateGameState` に `pendingTrustDeltas` 型チェック追加(配列型 + entry の `perWeekDelta`/`weeksRemaining` 検証 + 無効エントリ自動削除)。マイグレーション: 既存セーブに `pendingTrustDeltas: []` を全選手付与、`_costumeDebut` 削除直後のブロックに配置。Phase 6 (閾値最終確認) は Phase 7 に統合吸収 — Phase 4 時点の `trust_unstable<60` / `morale_low<60` は auto-sim 100シーズンで違反ゼロなので現状維持確定。検証: auto-sim 100シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0/5300週)。実機: trainer 実行 → trust 53→53 即時変化なし + `_trainerBuff.weeksLeft=4` + `pendingTrustDeltas[0].weeksRemaining=4` 同期、1週進行 → trust 53→55.57 (perWeekDelta 通り) + buffLeft 4→3 + ptdRem 4→3、ポップアップバッジ「残り3週」に更新、ミニ通知トースト表示確認。camp 実行で全員に pending 積み + weeksRemaining=2 全員同期も確認済。bonus/refresh_leave は従来通り即時で上がる(trust 40→46.19)。変更: management.js(makeChar/makeAIFighter 初期化 / Engine.shachoshitsu.execute queueTrust 分岐 / applyPendingTrustDeltas 新設 / processManage 呼び出し追加 / tickWeek 転送 / validateGameState 型チェック)+app.js(マイグレーション / processWeek 週次ミニ通知)+ui-common.js(showFighterPopup 成長バフバッジ)。仕様: specs/shachoshitsu-spec-v1.0.md §4, §5 (設計変更あり、v1.1 で逆輸入予定)。指示書: plans/shachoshitsu-phase7-task.md。

前回: **社長室 Phase 5 — 旧ケアシステム廃止（2026-04-15）。** 旧ケアモーダル(💝 ケア)を完全に廃止し、社長室 🏛️ が唯一の決裁入口になった。今週画面の「💝 ケア」ボタン削除 / `showCareActionModal`(~360行)削除 / `App.openCareModal` + `App.executeCareAction` 削除 / `Engine.careActions` 丸ごと削除。`Engine.careActions` のヘルパー関数群(`tickTrainerBuffs` / `getTrainerMult` / `resetSeasonalCounters` / `isInSlump` / `getBonusRepeatCount`)は `Engine.shachoshitsu` に移植、`processManage` / `tickWeek` / シーズン末処理の呼び出し元を全置換。`CARE_ACTIONS` データ定義と `module.exports` も削除。`costume` 関連を完全削除(`CARE_REACTION_DIALOGUES.costume` 初期化ブロック+全 `.push(...)` 行+`_costumeDebut` フラグ消費ロジック)。`special_treatment` は怪我発生ポップアップに統合: `showEventPopup` に二次アクションボタン(`action: { label, disabled, disabledHint, onClick }`)を生やし、`App.executeSpecialTreatment` + `Engine.shachoshitsu.executeSpecialTreatment` を新設(決裁枠消費なし、資金200万のみ)。`hireCoach` にコーチ画面の決裁枠チェック追加(決裁枠-2消費、雇用ボタンに ⚡2 表示)。選手フィールド `_careWeekUsed` → `_decisionWeekUsed` を統合するマイグレーション追加。旧 `G.careStock` / `careStockMax` / `careStockLastRecovery` / `_teamCareWeekUsed` を削除するマイグレーション追加。`createInitialState` の careStock 初期化と `tickWeek` の回復ロジック削除。`validateGameState` に旧フィールド検出の安全弁追加。ケア専用 CSS を削除。ただし `.care-overlay` / `.care-box` / `.care-title` / `.care-reaction*` / `.care-result-header` / `.care-result-action-*` / `.care-result-portrait*` / `.care-result-name` は選択型イベント / 対抗戦 / 挑戦状 / 契約交渉 / 練習アクシデント等 10+箇所の他モーダルで再利用中のため残存(spec §9.3 の「全削除」指示は実コード調査で否定)。auto-sim 100シーズン(seed=42) ALL CLEAR(違反0/エラー0/ゲームオーバー0/5300週)。変更: management.js(Engine.shachoshitsu拡張/Engine.careActions削除/createInitialState/tickWeek/validateGameState)+app.js(マイグレーション/hireCoach/executeSpecialTreatment/怪我ポップアップ改修/openCareModal+executeCareAction削除)+ui-common.js(showCareActionModal削除/showEventPopup 二次アクション対応)+ui-render.js(ケアボタン削除/hireCoach ボタン⚡2表示)+data.js(CARE_ACTIONS削除/costume dialogues削除/module.exports)+index.html(ケア専用CSS削除/event-popup-action CSS追加)。仕様: specs/shachoshitsu-spec-v1.0.md §9 §11(Phase 5)。指示書: plans/shachoshitsu-phase5-task.md。

前回: **社長室 Phase 4 — 決裁実行ロジック（2026-04-15）。** 社長室の机に並ぶ7書類(bonus/encourage/refresh_leave/party/trainer/camp/media)をクリックして実際に決裁を実行できるようにした。`Engine.shachoshitsu` に `calcCost` / `execute` / `getReactionText` を追加し既存 `Engine.careActions.execute` から 7 書類分のロジックを移植(costume/special_treatment/hireCoach は Phase 5 で統合/削除)。`App.executeDecision` / `App.onShachoshitsuDocClick` エントリポイント追加。対象選手選択モーダル(個人書類: 書類別に候補絞込)+団体確認モーダル(party/camp: 対象人数・コスト内訳・残金・効果サマリ表示)。朱印演出(.is-approving → stamp-slam 0.6s → is-approved 再レンダ)+印鑑倒れアニメ(.hanko.falling → hanko-fall 0.5s)+決裁済み書類は document-stamped.webp 背景差し替え+onclick除去。週進行時に `_decisionDoneThisWeek` を tickWeek でリセット(`_decisionWeekUsed` は cooldown 管理のため維持)。validateGameState に型チェック追加。Phase 3 セーブからのマイグレーション(`_decisionWeekUsed: {}` / `_decisionDoneThisWeek: []` 空初期化)。既存ケアモーダルは Phase 5 まで並行稼働。auto-sim 100 シーズン ALL CLEAR、ブラウザ実機で bonus/camp/trainer 実行 + cooldown + DP不足トースト + 週進行リセットを確認。変更: management.js(Engine.shachoshitsu拡張/tickWeek/validateGameState/createInitialState)+app.js(executeDecision/onShachoshitsuDocClick/マイグレーション)+ui-common.js(showDecisionTargetModal/showDecisionConfirmModal/showDecisionResultToast)+ui-render.js(renderShachoshitsu書類クリックハンドラ+is-approved判定)+index.html(Phase4 CSS+決裁モーダルDOM)。仕様: specs/shachoshitsu-spec-v1.0.md §4 §8 §11(Phase 4)。指示書: plans/shachoshitsu-phase4-task.md。

前回: **orgPop リバランス v1.1（2026-04-14）。** 「70の壁」（orgPop が S20-S30 でも 64 付近に張り付く）を完全解消。§2 逓減カーブ見直し: getDiminishingMultiplier を 70-84:0.12→0.22、85-94 の新 tier 0.15、95+:0.06 に変更。calcAnnualDecay を 79-:3（旧4）、80-89:3（旧7、specの5→さらに緩和）、90-94 の新 tier 7、95+:10（旧15）に変更。§3 ドーム会場リサイズ: cap 30000→22500、cost 12000→11000（理論天井に合わせた満員設計）。§4 殿堂 domeMain ポイント新設: calcHofPoints に domeMain イベント対応追加（メイン勝利+3/敗北+1）、buildCareerHighlights にも case 追加。§5 ドーム年 1 回制限: domeShowsThisSeason フィールド追加（createInitialState + season-reset）、setShowVenue に guard (≥1 で却下)、finalizeShow でカウントアップ + domeMain キャリア記録プッシュ。§6 収支→経営リネーム: ナビボタン「💰 収支」→「🏢 経営」、パネルタイトル変更、収支サブタブに「📣 団体人気」タブ追加 + _orgPopChart 関数新設（SVG折れ線グラフ、Y固定0-100、ドーム解禁ライン90、シーズンラベル、pop 帯別カラー）。§7 シーズン開幕通知: _prevSeasonEndOrgPop 保存 + _pendingSeasonStartNotif transient フィールド → advanceFromWeekSummary でトースト表示（decay > 0 のみ）。検証: auto-sim 5 シード×20 シーズン ALL CLEAR。旧 S30=64.2 → 新 S30=79-86（seed 依存）。変更: management.js(getDiminishingMultiplier/calcAnnualDecay/calcHofPoints/buildCareerHighlights/createInitialState/processSeasonEnd)、data.js(VENUES[9])、app.js(finalizeShow/setShowVenue/advanceFromWeekSummary)、ui-render.js(renderShowPrep/renderFinance/_orgPopChart)、index.html(ナビラベル)。

前回: **選手循環システム修正 + FA膨張解消（2026-04-10）。** 初期dormantPool設計変更: 78人全員age17→20人（age17-20分散）+58人retiredIdsスタート（retiredSeasons -4〜+5ばらけ、年6人ずつ復帰可能に）。FA膨張解消: Engine.util.canAddToFA/redirectToDormantPoolヘルパー新設、全6箇所のFA流入ルート（AI契約退団/プレイヤー契約退団/突然離脱/レンタル帰還/解雇/オーバーフロー解雇）にROSTER_CFG.faキャップ追加、超過分はdormantPoolへ退避。scoutEventFinish 30% FA流入を廃止（100% dormantPool返却）。初期FA年齢を19-20に固定（ドラフト17-18との棲み分け）。pool-stats計測ツール修正（auto-sim互換ループ）。検証: pool-stats 2シード×20シーズンで安定（Pool=20-24/FA=0-2/age17-18=10-13）、auto-sim 2シード×20シーズン ALL CLEAR。変更: management.js(initRandomRoster/createInitialState/canAddToFA/redirectToDormantPool/processAIContracts/resolveNegotiation/executeShow/processWeeklyRental)、app.js(releaseFighter/_releaseFighterForOverflow/scoutEventFinish)、test/pool-stats.js。

前回: **ドラフト価値向上リバランス（2026-04-10）。** 施策0: ドラフト候補数縮小(14-18→6-8, maxPicks 4→3)、ミッドシーズン候補(8-10→4-6)、FA枠縮小(22→10人)、FA表示枠6→10(全員表示)。施策1: 年齢ベースでドラフト/FA棲み分け（ドラフト=age17-18、FA=age19-20のドラフト漏れ世代）、age振り直し廃止(dormantPool実年齢使用)、FA選手に待機微成長(年3%×待機年数)。施策2: AI団体がシーズン中にFAを取りに来る(aiMidseasonFAAcquire新設、四半期判定、S:35%/A:25%/B:15%、年間最大1人/団体、OVR差閾値制)。施策3: ドラフト指名ボーナス(trust +5〜+15ラウンド連動、bond +1〜+5)。変更: data.js(SCOUT_EVENT_CFG/ROSTER_CFG/AI_MIDSEASON_FA_CFG/DRAFT_SIGNING_BONUS)、management.js(generateScoutReport年齢フィルタ/FAローテーション年齢フィルタ+微成長/getVisibleFAIds/aiMidseasonFAAcquire/tickWeekフック/_midseasonFAGrabsリセット)、ui-common.js(draftNextCandidate trust+bond付与)。auto-sim 100シーズン ALL CLEAR。

前回: **引き抜きtrust連動+予兆可視化（2026-04-09）。** specs/poach-trust-spec-v1.0.md に基づきA→B-2→B-1の順で実装。A-1: processTransferWindowにtrust補正追加（trust75+→×0.30/trust30-→×2.00、忠誠心と乗算）。A-2: resolvePoachの防衛率をtrust連動関数化（trust70+→95%/trust30-→35%）。B-2: 移籍ウィンドウ前週（11/23/35/47週）にリスク選手の予兆通知モーダル（trust帯別mild/moderate/seriousテキスト、最大2名、忠誠心持ちは対象外）。B-1: 週次ロッカールーム空気ログ（2週に1度、非興行週、morale/trust状態でgood/warning/dangerフレーバーをgameLog出力）。変更: data.js(TRANSFER_CONFIG拡張+PRE_WINDOW_TEXTS+LOCKER_AIR_TEXTS)、management.js(processTransferWindow/resolvePoach/processWeekPhase/processWeek)、app.js(_pendingPreWindowWarning回収)、ui-common.js(N_pre_window警告スタイル)。auto-sim 200シーズン ALL CLEAR。

前回: **Session F nested セリフ拡張（2026-04-12）。** dialogue-expansion-worksheet.xlsx 全394行を6種のnested sourceに反映。NOTIF_DIALOGUES(36行)+CARE_REACTION_DIALOGUES(66行)+CHOICE_EVENT_DIALOGUES(61行)+LARGE_EVENT_DIALOGUES(60行)+GLIMPSE_B_LINES(84行, dialogue+scene)+SNAPSHOT_TEXTS(87行, voice+scene deduped)。polite/cool/seductive/ojousama/composed等のarchetype別セリフを各personality×event_idスロットに追加。GLIMPSE_Bに_scene並列構造を新設。auto-sim 100シーズン(10シード×10) ALL CLEAR。

前回: **新キャラ29名追加+既存キャラデータ更新（2026-04-09）。** Notion DBから新キャラ29名（ID 100〜128）をALL_CHARS/CHAR_PROFILES/PORTRAITに追加。土岐山乃ノ佳, 沢登鮎, 大山たかみ, 財津琴美, 吉野萌子, 黒岩千晶, 赤沼紗稀, 松岡綾乃, 結城玲奈, 戸塚ゆかり, 若林美佐子, 相模あずみ, 朝比奈ひかり, 綿貫すず, 木村レイカ, 豊田いすず, リナ・モーガン, クラッシャー毒島, 割田久美, 岩小路志摩子, 蔵前静, 山本理香, 宮沢ひかる, 柳沼英子, 清川怜, 藤代絵麻, 西園百合香, 榊原菜摘, 巳沼紗霧。既存キャラ12名のデータ更新: スタイル変更(高津小春→Allround, 生駒エリカ→Brawler)、性格変更(大河内紗代子→bold, 芝彩音→earnest)、特性変更8名。登録キャラ総数: 98→127名。auto-sim 100シーズン ALL CLEAR。

前回: **ドラフト画面リニューアル+PPVポスター修正（2026-04-07）。** ドラフトフローの「スカウト」呼称を「ドラフト」に統一。ドラフト開幕前画面を号外紙面型(A1)に刷新。ドラフト完了画面をトレーディングカード型(B1)に新設（超逸材ヒーロー表示/逸材大カード/標準カードのティア別サイズ差別化）。獲得時リアクション復活(getSigningLine+showEventPopup)。ドラフトまとめ記事にポートレート付きチップ表示。バグ修正: _draftInterestsオリジナル破壊によるAI団体不参加問題+バックグラウンド処理のロスター枠温存(idealRosterキャップ)。PPVポスター画面: カード背景分離(ppvmc-card-bg)+fighter絶対配置+z-index重なり演出復元+center暗影修正。auto-sim 2シード×30シーズン ALL CLEAR。

前回: **dormantPool枯渇バグ修正（2026-04-06）。** 長期プレイでスカウト候補が0名になる致命的バグを修正。ドラフト交渉システム実装+修正完了済み。

**実装内容:**
- src/draft-negotiation.js新規作成(~780行): セリエンジン(assignInterest/runDropCheck/stepRound/runNegotiation/runFullDraft/empressReinforce)
- 旧スカウトシステム(aiScout/aiSeasonReinforce/resolveCompetition)を廃止、共通プール+セリ参加に統合
- 候補プール拡張(14-18名/8-10名)、事前選択制(★星トグル最大4名+5分岐ロジック)
- 候補一覧UI(週刊グラップル「ドラフト速報」新聞風)、交渉画面UI(会場バナー+入札カード4枚+ヒートゲージ+ナレーション30+パターン)
- BGM/SFX統合(tension BGM+7トリガーSE)、EMPRESS安全網、業界紙まとめ記事

**修正内容(ユーザー実機FB対応):**
- 観戦モード廃止→降りる即決着の2クリックフロー
- 推定契約金をassessedValue統一(getSigningCostのorgPop割引除去)
- 団体名をRIVAL_ORGS.nameから動的取得(ハードコード廃止)、ナレーション{ORG}プレースホルダ方式
- エンブレム画像パス修正(../image/org/)、外枠ダークテーマ切替
- ★ボタン視認性(draft-star-btn CSS統一+行/カードハイライト)、獲得上限日本語化
- BGM切替: showScreen経由のplayForStateがtensionを毎回再生し直す問題→_showScreenNoBgm導入で交渉中はBGM不干渉
- SFX: 入札音→Audio.play('select')、ファンファーレ→v5、競り負け→Audio.play('defeat')
- 粘り度ゲージ: ラベルのbackground漏れ修正(太い謎バー根絶)、プレイヤーカードのゲージ廃止
- 並び順をassessedValue純粋順位ベースに(ティア区分廃止)
- AI全同時離脱→流札バグ修正(最後の1社は降りないガード)
- AI団体ロスター上限制御: _getRosterFillMul厳格化(理想+2以上→不参加強制)+落札時idealRoster+2チェック+ドラフト中獲得数リアルタイム追跡

引き継ぎ: docs/draft-notes/。仕様: specs/draft-negotiation-spec-v1.0.md。auto-sim 100シーズンALL CLEAR。

前回: **dormantPool FIFOキュー化 — 同じ選手の即リサイクル防止（2026-04-05）。** dormantPoolの選抜が全箇所ランダムシャッフルだったため、リサイクルされた選手が即座に再登場し「同じ選手ばかり回る」問題があった。(1)Engine.util.drawFromFrontヘルパー追加: キュー先頭ウィンドウ(count×3, min12)からランダム抽出。古い選手優先+バリエーション確保。(2)選抜4箇所FIFO化: generateScoutReport/aiScout/aiSeasonReinforce(先頭15件内最強)/FA市場ローテ。(3)フィルタバグ修正(L9286/L9546): {id,age}オブジェクトとstring IDの.includes()比較が常にfalseで使用済み選手がプールから除去されなかった。(4)エントリ形式統一: 全てを{id,age}オブジェクトに統一、typeof分岐ガード12箇所除去。(5)セーブマイグレーション: レガシーstring ID→{id,age:17}変換。リサイクル投入は全て末尾追加(変更不要)、年次加齢は配列位置維持(変更不要)。変更: management.js(drawFromFront+選抜4箇所+フィルタ2箇所+typeof除去)+app.js(マイグレーション)。auto-sim 100シーズン×2シード ALL CLEAR。

前回: **AI引退選手の即リサイクル修正（2026-04-04）。** AI団体の引退選手(怪我引退・シーズン末引退・契約退団引退)のIDがretiredIds/retiredSeasonsに登録されず、dormantPool補充時にクールダウンなしで即復活していた問題を修正。processAIWeek内の怪我引退時に_weekRetiredIdsへ一時記録→tickWeekで回収、processSeasonEndで全AI引退者IDを集約して返却→offWeek1でstateに反映。プレイヤー側と同じ5シーズンクールダウンがAI引退者にも適用されるようになった。変更: management.js(6箇所、29行追加)。auto-sim 100シーズン×2シード ALL CLEAR。

前回: **対抗戦発生確率改善（2026-04-02）。** ランキング上位プレイヤーで対抗戦が極端に少ない問題を修正。(1)チェック窓追加: checkRivalryWarの判定をWeek24/36の2回→Week12/24/36の3回に拡大（Q1末追加）。(2)基本確率微増: warChancePerSeason 0.50→0.55。(3)干ばつ防止: 前シーズン対抗戦なし時に各チェック+15%ボーナス（lastWarSeasonフィールド新設、蓄積なし）。(4)B3挑戦状競合緩和: B4(メディア)weight 3→2でB3が高orgPopでも50%選出に。P(0回/シーズン)が25%→9.1%（干ばつ後2.7%）に改善。変更: data.js(EVENT_CONFIG)/management.js(checkRivalryWar/advanceWeek/初期状態/B4 weight)。auto-sim 100シーズンALL CLEAR。

前回: **ロッカールーム士気リデザイン v3.0（2026-04-02）。** morale=100張り付き問題を根本解決。(1)平均回帰: baseline=55への12%/週回帰を導入、100に留まれない設計に。(2)ムードメーカー条件付き化: 無条件+2.53→+1.5/週(morale70超で半減+0.75)。(3)人望条件付き化: 無条件+1.84→trust<50の選手数に比例(0.3×人数, max+1.2)。(4)興行双方向化: MQ<45で-1.5/MQ<55で-0.5追加。(5)ロスターサイズ税: 8人超-0.15/人/週。(6)負傷者負荷: 3人以上-0.5, 5人以上追加-0.5。(7)敵対ペア強化: 0.5→0.7/組, cap2→3。(8)morale→condition回復速度: 75+で×1.15/40未満で×0.80。(9)morale→成長ゼロ化: 40未満15%/40-50 5%。(10)morale→trust侵食: 45未満で追加減衰(45-morale)/100。(11)morale→スランプ/モチベ喪失回復: 70+で×1.3/35未満で×0.5。均衡帯38-76。変更: management.js/relationships.js/data.js。auto-sim 5シード×100シーズン ALL CLEAR。

前回: **プロモシステム再設計 v2.0（2026-03-31）。** プロモ活動による人気成長を全面見直し。(1)PROMO_POP_CAP 70→100（実質撤廃、diminishingで自然鈍化）。(2)getDiminishingMultiplierカーブ緩和（pop20-34:0.60→0.75/pop35-49:0.35→0.55/pop50-64:0.18→0.35/pop65-79:0.13→0.22/pop90+:0.05新追加）。(3)balanceスケジュールのpopBenefit条件削除（stackBenefitのみで判定）。(4)プロモrawGainをMNT連動に変更（mnRawGain=1.0+(mn-40)/40）+スター製造コーチ(getPopGainMult)をプロモにも適用。変更: data.js/management.js。auto-sim 100シーズン×2シード ALL CLEAR。

前回: **数値カラースケール再設計（2026-03-30）。** 全パラメーター統一6段階カラースケール導入。_scale6ヘルパー+8パラメーター別ラッパー関数をui-common.jsに追加。S帯(金+glow)→A帯(金)→B帯(琥珀)→C帯(くすんだ暖色)→D帯(スチールブルー)→E帯(冷灰)の色温度スケール。適用: MQ(6箇所)/OVR(3箇所)/Condition(2箇所)/Bond(2箇所)/Rivalry(1箇所)/Popularity(8箇所新規)/orgPop(4箇所新規)。Rivalryのみ赤系専用パレット。新聞パネル(ライト背景)・Trust(隠しパラメータ)・HPバー・スタイルバッジ等は除外。変更: ui-common.js/ui-render.js。

前回: **興行準備画面 v7 デザイン全面実装（2026-03-29）。** showprep-v7.htmlモックアップ準拠で興行準備画面を全面書き換え。(1)集客予測パネル: ムードアイコン+テキスト+5ドットゲージ+メトリクス行(Heat/予想MQ/タイトル/会場席数/会場費)。(2)ファンの声: コンパクト中央揃えパネル。(3)マッチカード: 7列グリッド(80px params | 1fr fighter | auto portrait | 110px center | auto portrait | 1fr fighter | 80px params)。ティア別スタイル(main-event金ボーダー+上ライン/mid-card/undercard薄め/empty-slot破線)。(4)ピッカーUI: `<select>`廃止→選手名クリックで下展開パネル、配置済み選手ホバーでスワップハイライト、クリックでスワップ自動処理。(5)中央タグ: 因縁/マンネリ/新鮮/タイトル/ファン期待/ラストマッチをsp-match-tagクラスで統一表示。変更: src/index.html(sp-*CSS追加)、src/ui-render.js(_spActivePicker状態+ピッカー関数群+renderShowPrep全面書換)。

前回: **集客v2 Phase 4完了 + チューニング + UI改修（2026-03-29）。** 新集客モデル本接続+バランスチューニング+興行準備画面UI改修。(A)Phase4本切り替え: (1)集客計算を旧calcAttendance（orgPopベース）→calcAttendanceV2（reach×draw×heat×揺らぎ→softCap）に差し替え、カード内容（drawPower/matchAppeal）が集客に直結。(2)heat更新をavgMQ閾値→★ベース（heatDeltaByStars）に変更。(3)orgPop変動をavgMQ+VENUE_MQ_THRESHOLD→★ベース（orgPopDeltaByStars）に変更、序盤保護（orgPop<15ペナルティなし、<30半減+成長ブースト）追加。(4)メディア放映収入をavgMQ×showPerMQ→baseBroadcast×mediaMult[stars]に変更。(5)showRating（★1-5）をengine側calcShowRating（mqScore+occScore+bonusScore）で統一算出。(6)AI団体にも★ベースorgPop変動追加。(7)PPV/対抗戦のheat更新も★ベースに統一。影響範囲: engine.js/app.js/ui-render.js全面。(B)チューニング: 会場階層別★評価基準(小規模-18/中規模-8/大規模±0/ドーム+3)、★3微正デルタ(+0.3)、負方向逓減(orgPop40+で×0.7)、reachカーブ大幅引き上げ(旧集客同等)、expectedDrawCurve再キャリブレーション、drawPowerをmatchAppealに統合、promoStackをdrawPowerに反映。(C)UI改修: 集客予測6段階化、カード評価ツールチップ(drawPowerBreakdown/matchAppealBreakdown)、興行準備画面レイアウト全面改修(集客予測上部移動/左右対称レイアウト/興行順番号)。(D)次ステップ: 興行準備画面デザインのモックアップ詰め(docs/showprep-mockup.html)→本体反映。auto-sim 3シード×20シーズン ALL CLEAR。

前回: **ステ特化コーチのcap到達済みステ空振りバグ修正（2026-03-29）。** pickGrowthStatがtrainCap到達済みステのウェイトを0にせず、ステ特化コーチの×1.40ウェイトによりcap到達済みステが高確率で選ばれてcalcGrowthが0を返し、他ステの成長機会が最大35%失われていたバグを修正。ステ選択時にtrainCap（限界突破・弱点克服ボーナス含む）をチェックしcap到達済みステのウェイトを0にして再分配。auto-sim 100シーズン×2シードALL CLEAR。

前回: **因縁放置ペナルティ修正（2026-03-27）。** orgPopが中盤以降0に向かって不可逆的に下落するバグを修正。原因: getNeglectedRivalryPenaltyが①暦週ベース(3週)で判定されるため非興行週にもペナルティ発生、②recordRivalryでlastAbsWeekが更新されず通常対戦でペナルティがリセットされない、③全因縁ペア対象で上限-1.0/週と過大。修正: ①興行週のみ判定+興行回数ベース(3興行未対戦)に変更、②recordRivalryにlastAbsWeek/lastShowNumber更新追加、③上位2ペア限定+ペナ-0.15/ペア+上限-0.3に軽減。auto-sim 20シーズン×5シード ALL CLEAR、orgPop 40-55帯で安定推移。

前回: **stat小数点バグ根本修正+画像フォールバック（2026-03-26）。** 練習成長3箇所(追い込み/通常練習/AI週次)でtrainGrowthがMath.round(…*10)/10の小数値のままstatに加算されfloat蓄積していたバグを修正。statに加算する直前にMath.round()を適用し整数を保証。validateGameStateに非整数検出+自動修正チェック追加。既存セーブデータ向けマイグレーション(_migrated_stat_round_v1)で全キャラstat一括丸め。画像フォールバック: _imgOrInitialヘルパー新設(onerror時にスタイル色イニシャル表示)、PPVカード対戦画像/対抗戦勝利演出/JT結果ポップアップ/選手詳細ポートレートの4箇所に適用。auto-sim 100シーズンALL CLEAR。

前回: **年間表彰式全面リファクタ（2026-03-26）。** モックアップ(awards-mockup-final-v2.html)準拠で表彰式UIを全面書き換え。TASK-1:メディア功労賞を全団体対象に拡張(AI団体processAIWeek内で興行出場選手のmediaRevSeasonトラッキング追加+PPV/JT/対抗戦でAI選手のmediaRevSeason加算+processSeasonEndに3フィールドリセット追加+selectMediaAward候補を全団体に拡張+返り値にorgName追加)。TASK-2:CSS全面置換(ステージ背景+スポットライト3灯+パーティクル+ファンファーレオーバーレイ+セレモニーヘッダー+スライド制御+award-card+各賞固有レイアウト+ナビゲーション+コーチFG+紙吹雪、枠画像フレームa-g完全廃止)+Google Fonts追加(Noto Serif JP)+HTML構造書換(#stage/#aw-particles/#aw-fanfare-overlay/#aw-ceremony/#hof-coach-fg)。TASK-3:全7スライドビルダー関数をモックアップ準拠で書換(メディア功労賞→新人王→ベストマッチ→タイトル王者→MVP→殿堂→一覧、該当なしスキップ)。TASK-4:スライド制御(goToSlide/nextSlide+ドットインジケータ動的生成+ファンファーレ冒頭3秒演出)+タイトル王者順番登場(3位→2位→1位各700ms)+MVPスタッツバーアニメーション(data-width→style.width遅延適用)+殿堂紙吹雪(80個5色)+SE4種(Web Audio: playChime/playMvpFanfare/playHofChime/playFanfare)+パーティクル30個動的生成。TASK-5:殿堂入りコーチFG演出(自団体殿堂入り時のみ+coachAssign逆引きで担当コーチ特定+1.4秒後スライドイン+AWARD_LINES.hofCoach5パターン+他スライド移動で非表示)。auto-sim 200シーズン(2 seeds)ALL CLEAR。

前回: **バグ修正追補（2026-03-26）。** ④_pendingPromoIncomes/_pendingPromoGoods毎週重複計上: _pendingMediaIncomesと同様にtickWeek内processSettlement後にdelete。⑤メディア功労賞の金額表示が/10000で極小値: 値はすでに万単位のため除算を削除しtoLocaleString()整形に変更。⑥fanExpectation参照は前回修正で全箇所解消済み(grep確認)。auto-sim 100シーズンALL CLEAR（funds正常化: プロモ重複解消で約40%減）。

前回: **バグ修正3件（2026-03-26）。** ①メディア功労賞が選出されない: applySeasonEndがmediaRevSeason等を先にリセットしていたため、awards.generate()をapplySeasonEndの前に移動。②_pendingMediaIncomes毎週重複計上: processSettlement後にtickWeek内でdelete実行し1回限りの消費に。③新聞プレビューのファン期待カードが空: buildPreview/app.jsのstate.fanExpectation参照をEngine.fanExpect.generate()動的生成に置換。auto-sim 200シーズンALL CLEAR。

前回: **受賞歴キャリア記録追加（2026-03-26）。** 年間表彰式の受賞結果を個人のcareerRecord.historyに永続記録。対象4賞:新人王(awardRookie)/MVP(awardMVP)/メディア功労賞(awardMedia)/ベストマッチ賞(awardBestMatch)。_checkAndShowAwardsでEngine.career.addEvent呼び出し(プレイヤー団体受賞者のみ)。milestone.getに4case追加→キャリア年表に受賞歴表示。_typeStyleに4スタイル追加(アイコン+カラー)。buildCareerHighlightsに4case追加→殿堂入り時のハイライトにも反映。auto-sim 100シーズンALL CLEAR。

前回: **メディア功労賞実装（2026-03-26）。** 年間表彰式にメディア功労賞を追加。選考基準:mediaRevSeason+talentRevSeasonの合計最大のプレイヤー団体選手。TASK-1:選手フィールド追加(mediaRevSeason/talentRevSeason/talentCountSeason)+resetSeasonalCountersでリセット。TASK-2:収入発生時の個人別累計加算(processSettlement内プロモ連動+タレント活動バフ→Map蓄積+roster反映、app.js PPV出演料/JT出演料/対抗戦JT出演料→s.roster/G.roster反映、B4全6activityTypeでtalentCountSeason+1)。TASK-3:Engine.awards.selectMediaAward新設(score>0の候補をソート、タイブレーカー=talentCountSeason)。TASK-4:表彰式UIにMVP直後スライド追加(_buildMediaAward:顔写真+名前+年間メディア貢献額+出演料/タレント活動内訳+活動回数)+AWARD_LINES mediaAwardセリフ(5personality×archetype)。auto-sim 100シーズンALL CLEAR。

前回: **B4タレント活動イベント拡充（2026-03-26）。** 既存B4メディア密着取材に6種の新タレント活動サブタイプ追加(CM出演/グラビア撮影/バラエティ出演/ブランドコラボ/ファッションショー/ファンイベント)。B4発生時7択均等抽選(null=既存spotlight,6種=新活動)。名前プール6配列。personality×activityType相性テーブル(得意1.5/普通1.0/苦手0.5)+archetype追加補正(+0.2)。効果:cm/variety→メディア週次収入(pop×0.6万×mult,1週),gravure/brand→グッズ週次収入(brand2週),fashion→即時人気+1~3,fan→即時trust+2~6。talentActivityBuffフィールド+processSettlementカウントダウン。LARGE_EVENT_TEXTS/DIALOGUES各6種追加。UI:モーダルにactivityType別ヘッダ/適性タグ/おすすめ推薦。AI団体B4同等処理。§13:チャンピオン怪我引退時trust85+30%で社長への一言ポップアップ。auto-sim 100シーズンALL CLEAR。

前回: **旧収入関数参照修正 hotfix（2026-03-26）。** 金銭バランス改善で削除されたgetSponsorIncome/getBroadcastIncomeがapp.js(Survival.estimateWeeklyNet)とui-render.js(収支画面推定コスト)で残参照→calcWeeklyGoodsRev/calcWeeklyMediaRevに置換。titleLoadGameでcreateInitialState(skipDraft=true)に修正しドラフト画面誤表示も解消。data.jsのexportから削除済みSPONSOR_TABLE/BROADCAST_TABLE除去。auto-sim 100シーズンALL CLEAR。

前回: **金銭バランス改善 TASK1-4（2026-03-26）。** 収入を興行収入(チケット)+ブランド収入(グッズ+メディア+プロモ)の2軸に再編。TASK-1:グッズ収入再設計(GOODS_PRICE廃止→GOODS_CONFIG/週次ベース全選手pop×0.2万+興行ブースト出場者pop×0.25万×占有率+プロモ連動pop×0.6万)。calcRosterPopScore廃止。TASK-2:メディア収入新設(SPONSOR_TABLE/BROADCAST_TABLE廃止→MEDIA_CONFIG/MEDIA_ORGPOP_CURVE区間線形補間/7発生源:①週次orgPop×1.5万②興行放映avgMQ×1.1万×VENUE_MEDIA_MULT×タイトル1.5×orgPopMult③PPV出演pop×0.9万×PPV_CARD_MULT④JT出演pop×0.9万⑤対抗戦MQ×1.1万×venueMult×1.5⑥プロモ連動pop×0.6万⑦ファン期待priority×30万×(MQ/70)×orgPopMult⑧ライバル抗争rivalry×MQ×0.016万×orgPopMult)。processSettlement全面改修。app.jsにPPV/JT/War/B3メディア収入フック(_pendingMediaIncomes)。TASK-3:月次報告UI再設計(収入タブをカテゴリ別グルーピング表示:興行収入/ブランド収入(グッズ▼折畳/メディア▼折畳/プロモ)/その他、内訳デフォルト折畳)。TASK-4:trustによる昇給要求減額(trust40→0%,trust100→8%線形補間)。auto-sim 100シーズンALL CLEAR。

前回: **MQ改修 Phase 1-3（2026-03-26）。** MQシステム全面リバランス。Phase 1: キックアウトバグ修正(fall/tkoでtotalKickouts++漏れ)、ペーシング「長すぎ」ペナルティ撤廃(短すぎのみ維持)、外部MQソース値変更(タイトル+10→+5/ファン期待+5→+2.5/宿怨+3→+2/ライバルカーブ圧縮)、外部MQソース6件削除(一方的因縁MQ/ケミストリー/ラストラン因縁相手/見返しモード/コスチュームデビュー/野心)。Phase 2: タイトルマッチ集客+0.15→+0.20、ファン期待カード集客+0.08/件新設、マンネリペナルティ固定値→ランダム幅(-8max→-5max)、マンネリウィンドウロスターサイズ連動(≤8:8興行/9-12:10興行/13+:12興行)。Phase 3: OV帯別MQ分布検証(全帯目標範囲内)、ドラマ減点パラメータ据置(初期値30が適正)。auto-sim 100シーズンALL CLEAR。

前回: **AI団体タイトルマッチ適正化（2026-03-26）。** 弱い選手が王者に居座る問題を修正。Fix1:AI団体に12週タイトルマッチクールダウン導入(createAITitles.lastTitleMatchWeek+processAIWeek判定)。Fix2:挑戦資格厳格化(Top5→Top3,OVR差8→5)。Fix3:AIマッチカード生成時にトップ挑戦者を王者の対戦相手に優先配置。Fix4:AI選手にrecordTitleWin/Loss/Defense経歴記録追加。診断結果:タイトル変動20.7→7.88回/シーズン(-62%),OVRギャップ>5割合46.2%→25.5%(-45%),奪取時ギャップ>5率50%→23%(-54%)。auto-sim 100シーズンALL CLEAR。

前回: **開発率ラベル化（2026-03-25）。** getPotentialPct数値%表示を5段階ファジーラベル（未開花/成長期/開花中/充実期/完成形）に置換。選手固定devLabelOffset(-7〜+7)でファジーバウンダリ実現。既存セーブはIDハッシュで互換。バー色はstage別5色。ロスターポップアップ(ui-common.js)+詳細画面育成タブ(ui-render.js)の2箇所を変更。UIのみ(engine.js変更はutil関数追加+新規選手生成時offset付与のみ)。

前回: **タスクキュー6件一括実装（2026-03-25）。** BUG-02:ティッカー虚偽情報修正(AI負傷→実データ/フレーバー無害化/スカウトFA連動/経済orgPop参照)。TASK-03:ファン希望カードにfreshnessチェック(MQ-5以上除外/MQ-3以上priority降格)。TASK-01:ジュニアトーナメントシード配置(_seedBracket新設/1位2位決勝まで非対戦/5-8位ランダム)。BUG-01:showSp堅牢化(タイマー管理+勝者決定時強制消去/予防的修正)。TASK-02:今週画面ソート&一括操作(thクリックソート/全選択チェック/プリセット一括適用/強化一括ON/OFF)。TASK-04:給料交渉から勝率撤去(record判定をOVR/人気/タイトル歴ベースに/セリフテンプレート刷新)。auto-sim 100シーズンALL CLEAR。

前回: **AI契約交渉パリティ（2026-03-25）。** processAIContracts新設。trust<40で退団判定（30-39:15%/15-29:40%/<15:70%）。特性補正（忠誠心×0.5/反骨心+20%/野心±15%）+tier補正。退団先: 50%他AI団体移籍/30%FA/20%引退(28歳+)。移籍先でO-02 bond変動+orgTimeline更新。最低5名ガード。新聞にaiContractDeparture(priority95、大量退団+30、エース級+20)。設計書: `docs/ai-parity-07-contract-negotiation.md`。auto-sim 50シーズンALL CLEAR。

前回: **AIメディア密着B4パリティ（2026-03-25）。** processAIWeeklyEventでB4許可。tier別対象選出（S:50%若手/30%エース/20%ベテラン等）。aiData.mediaSpotlight新設で3興行MQ追跡→avgMQ≥60:orgPop+3/popularity+5/trust+3、≥45:orgPop+1/popularity+2。E-04関係性効果（bond+1~2/rivalry+1~3）。新聞に密着開始(aiMediaStart:45)+結果記事(aiMediaSpotlight:65)。設計書: `docs/ai-parity-04-media-spotlight.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI怪我引退パリティ（2026-03-25）。** processAIWeek内のAI怪我処理を拡張し重傷→retireType判定追加。wearInjury(wear+25>80)とcareerEnding(wear≥40で6.5%/他2.5%)の引退パス。引退時はロスター除去+departureTrustImpact+orgTimeline close+_midSeasonRetirees蓄積（シーズン末HOF判定用）。新聞にAI怪我引退記事(aiInjuryRetirement:150、エース級+20)。最低ロスター4名ガード。設計書: `docs/ai-parity-05-injury-retirement.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI選手間対立B2パリティ（2026-03-25）。** processAIWeeklyEventのB2処理にニュース連携を完成。_pickAIChoiceにB2 tier別自動選択（S:60%話し合い/35%試合/5%放置、A:40%/45%/15%、B:20%/40%/40%）追加。processAIWeekで_newsTeamConflict蓄積+_b2Relationships関係値マージ。新聞にAI選手間対立記事追加（aiTeamConflict priority110、名勝負MQ70+で+15）。設計書: `docs/ai-parity-02-team-conflict.md`。auto-sim 50シーズンALL CLEAR。

前回: **AI練習怪我B1パリティ（2026-03-25）。** processAIWeeklyEventでB1（練習怪我）をAI団体にも許可。設計書: `docs/ai-parity-01-practice-injury.md`。

前回: **殿堂語り文（biography）リデザイン 実装完了（2026-03-30）。** 固定3文テンプレート→導入文×核心文×余韻文の3プール構成に全書き換え。導入文6分岐(無敗退場/長期政権/長キャリア/複数戴冠/短命/通常)、核心文19分岐(防衛数20+/グランドスラム/MVP3回/JT三連覇/PPV連覇等を優先度順で選出)、余韻文3系統(trust80+ファン信頼バリアント/メディア受賞/スタイル別3候補)。ID×シーズン数ハッシュで安定選出(ロード後も同文)。_buildHofEntryにコンテキスト8フィールド追加(mvpCount/bestMatchCount/hasRookie/mediaCount/maxSingleReign/retiredAsChamp/maxConsecutiveJT/maxConsecutivePPV)。変更:management.jsのみ。auto-sim 100シーズンALL CLEAR。

前回: **殿堂異名（エピテット）システム v2.0 実装完了（2026-03-30）。** 固定10パターン→実績タグ30種×重み付きランダム選出（全104テンプレート）に改修。buildEpithetContext(連覇/MVP/ベストマッチ等コンテキスト算出)、EPITHET_TAGS(rarity10-100の30タグ)、EPITHET_TEMPLATES(104異名)、resolvePlaceholders({n}防衛数等)。generateEpithet(rec,fighter,rng)に署名変更、最高rarityタグ群のみからプール構築+均等ランダム選出。_buildHofEntryにepithetRng(seed:0xEF17)+careerBestMQ/trustフィールド追加。仕様書: `docs/epithet-system-spec-v2.0.md`。auto-sim 100シーズンALL CLEAR。

前回: **AI団体ケアアクション統一（2026-03-25）。** processAICare全面改修。設計書: `docs/ai-parity-06-care-unification.md`。

前回: **サウンドシステム実装完了（2026-03-23）。** ■SE_MIX(app.js): 演出系SE個別音量ミキシング追加(bell56%/impact61%/tension_hit66%/rivalry系64-57%/war60%/transfer52%)、play()でsfxGain.gain.value自動設定。■MP3 SE優先再生(battle-engine.html): AudioBufferプリロードシステム新設(_SE_FILES 17ファイル定義/postMessage受信時_preloadSEBuffers開始/_playSample+getSfxGain経由再生)。試合SE11種(b01-b09,b11-b12)+フィニッシュSE7種(f02-f05,f11-f13)をMP3優先+Web Audioフォールバック。■ドローンd02音量42%(dMix=0.84スケーリング)。■セーブ画面BGM/SE音量スライダー10段階(前回実装済み反映)。

前回: **新聞タブ見た目パッチ 実装完了（2026-03-22）。** 新聞タブのデザインを団体比較タブと統一。■1赤帯ヘッダー(WEEKLY GRAPPLE→週刊グラップル、赤グラデーション帯+白文字)。■2セクションラベル日本語化(TOP STORY→一面記事、OTHER NEWS→他団体ニュース、次回展望、興行ダイジェスト、赤/金の縦線色分け)。■3画像アイコン派手化(一面記事:金枠+金グロウ、他団体:紫ダーク+紫枠+紫グロウ)。■4ダイジェストテーブル形式化(カード風→table1行/試合、勝者ダーク金グロウ/敗者グレーアウト、MQ色分け3段階、バッジ王座戦/番狂わせ日本語化)。■5星評価+黒田コメント微調整(星+観客満足度1行化、黒田アイコンダーク背景+赤ボーダー)。■6特集ページヘッダーも赤帯統一。UIのみ(engine.js変更なし)。auto-sim 500シーズンALL CLEAR。

前回: **タッグマッチ Phase 4b 積み残し (大技3段タイミング構築 + pin count single 準拠) 実装完了（2026-04-19）。** Step 5 で SE 呼び出しは align したが、実プレイ確認で「溜めの途中に技が炸裂する」「相手のダメージセリフが先に出る」「表示が先に終わる」「1,2,3 のカウント表記がシングルと全然違う」の 4 点が残っていた。single L1939-2002 の `t=0 charge / t=1.8 技名表示 / t=2.3 衝撃 / t=2.7 セリフ / t=3.3 cleanup` 5 段タイミングを tag にも完全移植 + pin count 表記を single の `.finish-count-text` と bit-identical に統一。■applyFrame の 2 段化: 定数 `BIGMOVE_CHARGE_MS=1800` 導入。`applyFrame` を「JS 状態更新 (HP/pos/mom)」と「DOM/ログ/演出発火」に分離し、後者を新関数 `_applyFrameVisuals(fr, touchA, touchB, isBigMove)` に抽出。大技フレーム (`action.kind!=='miss' && action.dmg>=20`) 検出時は t=0 で `sfx.bigmoveCharge()` のみ再生、HUD/ナレーション/ログ/イベント/タッチ演出を **1800ms 完全停止**。t=1800 で `_applyFrameVisuals` が一斉解禁 → 技名表示 (`_updateCenter`) → 500ms 後 (t=2300) に `_renderActionImpact` で衝撃演出一式 → 900ms 後 (t=2700) にダメージセリフ/ボイスカットイン。非大技フレームは `chargeDelay=0` で即時呼び出しなので挙動不変。■`_frameMinDelay` 調整: 大技加算 `+1200→+2000` で最低 3300ms 確保 (溜め1800 + 技名見せ500 + 衝撃演出400 + セリフ余白400 の吸収)。■`animateAction` 引数に `isBigMove` 追加し、applyFrame 側で計算した判定を再利用 (二重 charge 発火回避)。■pin count CSS 統一 (`src/tag-battle.html`): `.pin-count` を single `.finish-count-text` と同一仕様に書き換え — font-size 180→72px / letter-spacing 6→8px / `@keyframes pinCountPop` を countPop と同じ scale 2→1→0.9 の drop-in アニメに (旧 0.3→1.15 overshoot を破棄) / 色バリアント gold (1カウント) / red-gold #ff6b4a (ツー/tap/TKO) / white (3/kickout/escape/rollup) に統一。サブミッション導入ステップ (tag 固有 lock/agony) は 40-44px Noto Sans JP の小さめスタイルに切り分けメインカウントと視覚ヒエラルキー確保。getComputedStyle による tag `.pin-count` と single `.finish-count-text` の比較で fontSize/fontFamily/letterSpacing/color/animation が bit-identical を確認。specs §11.5d Step 6 追加。auto-sim 不要 (演出タイミング + CSS のみ)。

前回: **タッグマッチ Phase 4b 積み残し (SE 呼び出しの single 準拠 align) 実装完了（2026-04-19）。** Phase 4b で SFX **定義**は superset 共通化したが、tag 側の**呼び出し箇所**が tag 実装時点のまま据え置かれていて 5 点 single と drift していた状態を解消。■修正1: 試合開始ゴング `sfx.gong()` (tag L84、bell 0.14/0.09/0.05) → `sfx.gongStart()` (bell 0.2/0.13/0.07) に強化。■修正2: 毎ターン頭の準備音 `sfx.ready()` が tag では未発火 → `animateAction` 冒頭で鳴らす (single L1781/1814/1876/2007 準拠)。■修正3: 大技溜め演出が無く `bigmoveImpact()` 即時のみ → `action.dmg>=20` で `sfx.bigmoveCharge()` 先行 + `setTimeout(() => _renderActionImpact(action), 1100)` で衝撃演出 (ダメージポップ/シェイク/bigmoveImpact/hitSE/フラッシュ) ごと 1100ms 後ろにずらし、溜め→衝撃の視聴同期を担保。`_frameMinDelay(fr)` に `if (fr.action.dmg>=20) base+=1200` を追加して big move frame は 2500ms 確保。`tryDamageLine` の delay も big move 時 1700ms / 通常 600ms に切替。■修正4: カウンター SE フル音量 `sfx.counterSE()` → single L1881 準拠の half-volume 形 `getSfxGain().gain.value=SE_MIX.counterSE*0.5; _playSample('counterSE',0.5)` に変更。■修正5: hitSE volMul `action.isCrit?1.2:1` → `action.dmg>=20?1.3:1` (single L1839/1883/1961 が 1.3 / L2023 が無指定=1.0 準拠)。■リファクタ: `animateAction` を `ready()+miss/bigmove 分岐` と `_renderActionImpact(action)` に分割。single L2510 / L1781 / L1821 / L1881 / L2023 の SE 呼び出しと 1:1 対応する構造になった。スコープ外 (Phase 4c 送り): setTimeout ツリーのシーケンス共通化、ギブアップ進行音 (tag の lock/agony は `dmgVoice`、single は `heartbeatSE`)。specs/tag-match-system-spec-v0.1.md §11.5c Step 5 を追加。auto-sim は不要 (SE 呼び出しのみ、試合数値/判定に影響なし)。

前回: **タッグマッチ Phase 4b 積み残し (基本セリフ共通化) 実装完了（2026-04-19）。** Phase 4b で未対応だったセリフデータ層のドリフトリスクを解消。`DAMAGE_SERIF_LINES` (7 personality × 6 archetype / 58行) と `DAMAGE_VOICE_LINES` (7 archetype / 9行) が `src/battle-engine.html` と `src/tag-battle-lines.js` に bit-identical でコピペされていた状態を単一ソース化。■新規: `src/battle-lines.js` — 2定数 + `pickDamageLine(fighter, dmg, hpRatio, rng?)` (tag の HP帯別 serif/voice 振り分けヘルパー、dmg<15 ガード内蔵) + 内部ヘルパー `_pickSerif` / `_pickVoice` を集約。両 iframe が `<script src="battle-lines.js"></script>` でグローバル読込。■battle-engine.html: L895 の `DAMAGE_SERIF_LINES` / L955 の `DAMAGE_VOICE_LINES` を削除し script タグを `battle-sfx.js`/`battle-anim.js` の隣に追加。既存の `tryDamageCutin` / `showDamageSpeech` / `showDamageVoice` は RNG ソース (`RNG.float()` — streaming 権威モデルの seed 付き) を維持するため共通定数参照のまま据え置き。`CUTIN_LINES` (ライバリー戦 atk/def/climax カットイン) は single 専用のため触らない。■tag-battle-lines.js: 共通化済み定数 + `pickDamageLine`/`_pickSerif`/`_pickVoice` を削除し、タッグ固有の `HOT_TAG_LINES` / `DOUBLE_TEAM_LINES` / `CUTIN_SAVE_LINES` / `BETRAYAL_LINES` + 各 pick ヘルパーのみ残す。■tag-battle.html: script タグに `battle-lines.js` を `tag-battle-lines.js` の前に挿入 (読み込み順重要)。specs/tag-match-system-spec-v0.1.md §11.2 表に追記 + §11.5b Step 4 を追加。auto-sim は不要 (セリフ定数のみ、試合数値/判定に影響なし)。

前回: **タッグマッチ Phase 4b 実装完了（2026-04-19）。** 演出層 (SFX / CSS トークン+キーフレーム / カットイン) を single battle-engine と共通化し、single 側で演出を改修したとき tag 側にも自動反映される状態を作った。■新規: `src/battle-sfx.js` (約90%重複していた SFX 定義を superset で集約、drone state は module-local 化) / `src/battle-shared.css` (`:root` tokens + reset + 共有キーフレーム 9種、drift 補正: counterFlash/cutinSlideIn/movePop/flashScreen/dmgNumPop) / `src/battle-anim.js` (`BattleAnim.renderCutin/dismissCutin`)。■削除: `src/tag-battle-audio.js` (battle-sfx.js にリネーム相当)。■名称統一: tag 側 dmgPop→dmgNumPop / flashScr→flashScreen。■副産物: single の showDamageVoice で SE が鳴っていなかった不整合が自動解消。両 iframe 単体ロードでエラー0、全シンボル・トークン・keyframe・variant 付与を検証。スコープ外: 演出シーケンス単位 (bigmove/counter/touch の setTimeout ツリー) の共通化は streaming vs Replay の権威モデル差に絡むため Phase 4c 送り。specs/tag-match-system-spec-v0.1.md §11 追加。

前回: **団体比較 見せ場パッチ 実装完了（2026-03-22）。** セピア紙面の「おとなしすぎる」問題を解消。■1エース対決アリーナ:ダーク背景+赤ラジアル照明+赤金ライン+VS48px発光(text-shadow3層)+メトリクス白文字化+名前バーグラデーション。■2相性グレードボックス:赤ベタ塗り(#8b1a1a)+白文字。■3 No.2/No.3アバター:プレイヤー金ダーク(#5a4020→#3a2810)+金枠+金グロウ、ライバル暗色グラデ+白枠+紫グロウ。■4注目選手アバター:52px拡大+紫枠+紫グロウ。■5バッジ/タグ全ベタ塗り白文字化(要警戒赤/スター候補金/急務赤/検討緑/注意金/ロールチップ赤)。■6通算成績赤太字化。UIのみ(engine.js変更なし)。

前回: **団体比較スポーツ新聞風リデザイン 実装完了（2026-03-22）。** データベースタブ「団体比較」サブタブの全面リデザイン。■1カラースキーム変更(ダーク→セピア紙風、.db-cmp-wrapコンテナ+新聞タブ同系統パレット)。■2英語ラベル全日本語化(Compare with→比較対象/Matchup→相性/Head to Head→対戦成績/Top 3 Matchups→主力対決/Power Snapshot→戦力レーダー/Column→記者コラム/Scouting Report→{団体名}注目選手/Fan Voice→ファンの声/Player→プレイヤー/Tier→ティア/ACE→エース対決/No.2→No.2対決/No.3→No.3対決)。■3テキストロジック修正(getPopularityTail slotIndex別3バリエーション×5帯=15パターン、OVR優勢+人気劣勢時の逆接表現)。■4VS表示強調(36px赤色VS+グラデーション区切り線、ライバルemoji削除)。■5エース対決アリーナレイアウト(getStandUrlスタンド画像向かい合わせ+中央VS+名前バー、No.2/No.3は従来形式維持)。■6赤帯ヘッダー(週刊グラップル──団体比較)。■セクションタイトル縦線色分け(金=自陣営・中立/赤=相手情報)。UIのみ変更(engine.js変更なし)。auto-sim 500シーズンALL CLEAR。

前回: **殿堂入り画面追加修正 A-E 実装完了（2026-03-22）。** ■修正A:hofPointsバグ(applyHallOfFameにhofPoints/hofLevelガード追加)。■修正B:グリッドカードレイアウト変更(2列grid→flex-wrap 130pxコンパクトカード)。■修正C:詳細ポップアップ情報密度強化(C-0異名自動生成generateEpithet10条件、C-0b語り文自動生成generateBiography3文テンプレート、C-2 _buildHofEntryにepithet/biography保存、C-4/C-5ポップアップ全面書き換え:全身画像+異名+語り文+レジェンドグロー)。■修正D:レガシーポイント計算方式変更(初期値S50/A30/B15/P0+殿堂★8/★★10/★★★13pt+対抗戦5勝ごとに1pt、上限50、battleWinsTotal追加)。■修正E:pickGrowthStat STYLE_WEIGHTS緩和(最大-最小差8%、全スタイル最低22%)。auto-sim 500シーズンALL CLEAR。

前回: **新聞記事追加+キャラ名クリック対応 実装完了（2026-03-21）。** ■タスク1:対抗戦・頂上決戦の結果を新聞に掲載(finalizeWar→_newsWarResult/finalizePPV→_newsSummitResult保存、newspaper.generate story追加、tickWeekクリア)。■タスク2:新聞画面のキャラクター名をクリック可能に(_newsClickableName/\_newsStoryClickableヘルパー、topStory/subStories/playerShowData/次回展望/特集ページ全箇所適用、対抗戦記事の個別試合結果表示)。■タスク3:団体比較画面のキャラクター名をクリック可能に(王者名/Top3 Matchups選手名+アバター/Scouting Report選手名+顔写真)。preview buildPreviewにID追加。auto-sim 500シーズンALL CLEAR。

前回: **殿堂入りシステム拡張 v2.0 実装完了（2026-03-21）。** allHallOfFame統合管理(player/org_s/org_a/org_b)、NPC団体殿堂入り判定(processSeasonEnd+advanceWeek回収)、レガシーポイント動的化(全団体HOF×10上限50)、DB殿堂タブリッチ化(団体フィルタ+盾グリッド+詳細ポップアップ+キャリアハイライト年表)、表彰式スライドリッチ化(盾+ハイライト+サマリー+NPC殿堂表示)、新聞NPC殿堂ニュース。設計書: `docs/hall-of-fame-expansion-v2.0.md`。auto-sim 500シーズンALL CLEAR。

前回: **6件バグ修正・改善パッチ 実装完了（2026-03-21）。** ■1新聞JT記事残留クリア(既適用)、■2興行中BGM漏れ(全試合完了時のみmanagement BGM)、■3タイトル挑戦資格(getEligibleChallengers+UI/AI/S1/期待カード5箇所適用)、■4収支チャート(既適用)、■5JT勝敗逆転バグ(iframe結果でmatch上書き+後続ラウンド再計算)、■6コーチ画面視認性(未雇用背景色+バッジコントラスト向上)。auto-sim 100シーズンALL CLEAR。

前回: **B3/B2 試合観戦UI統一化 実装完了（2026-03-21）。** B3（名称「対抗戦」→「挑戦状」に変更）とB2（対立解決マッチ）に、通常興行・War・PPVと同等の試合観戦UI（VS対峙画面+battle-engine iframe観戦+フル結果カード）を追加。仕様書: `docs/impl-b3-b2-match-viewing.md`。auto-sim 200シーズンALL CLEAR。

前回: 浮動小数点表示バグ根絶+JT体力バーアニメ復活+BGM演出+新聞タイミング+WAR/JTアイコン統一（2026-03-21）。 JT試合結果画面に勝者体力バー減少→回復アニメーション復活（準々決勝・準決勝のみ）。優勝決定時BGMフェードアウト→チャンピオンジングル。JT終了後に新聞を再生成し結果記事を即座に反映（出場選手発表→結果特集に切替）。WAR勝利セリフ+JT感想チェーンの画像をupper→80pxポートレートアイコン（丸枠）に統一。

### 直近の完了セッション

| 日付 | 内容 |
|------|------|
| 04-30 | 団体ランキング v2.0 (specs/org-ranking-spec-v2.0.md): 評価/基礎力 算出ロジックの再設計。**基礎力を3軸合算化** (Force コア戦力: TOP8加重OVR×1.2 + 加重人気×0.6 / Depth 層の厚み: 11位以下のOVR70+/75+を加点 上限30 / Marquee 看板スター: TOP3人気の突出加重×0.45)、引退者除外。**第4の評価軸「シーズン実績」(Achievement)** を新設: PPV GRAND FINAL+15 / 統一トーナメント+10(未実装) / ジュニアトーナメント+8 / 年末MVP+10 / ベストマッチ賞+5 / 最大動員+3(tracker未実装、保留)。アイテム単位で個別保持し、age に基づく減衰 (1年満額→×0.5/年、1pt未満で除去) で「翌年は王者の余韻に満額浸れる、その次の年から色褪せる」ナラティブ。`Engine.achievement` 新設 (currentPt/totalPt/add/tickAge/ensureInit)、シーズン跨ぎフックで tickAge、PPV applyPPVResults / awards.generate 直後に各 add 呼び出し。**年間王者 (annualChampion)** を seasonHistory に記録 (加点なし、最高位の称号、ランキング1位を全評価確定後に決定)。UI: ランキング画面メトリクスを6→7個化 (実績追加)、基礎力ツールチップに3軸内訳、実績ツールチップにアイテム時系列一覧 (当シーズン/N年前 グルーピング、現在ptと減衰表示)。RANKING_CONFIG 拡張 + ACHIEVEMENT_CONFIG 新設 (data.js)、selectMVP/selectBestMatch/jtChampion に orgId 露出。auto-sim 30シーズン×複数シード ALL CLEAR ✓。変更: src/data.js + src/management.js + src/ui-render.js + specs/org-ranking-spec-v2.0.md (新規) + CLAUDE.md ファイル索引追記。残課題: 統一トーナメント本実装、最大動員 tracker 実装、年間王者表彰式 UI 演出 (rp-ace の3人並び流用予定)、タッグ戦力評価 (specs/tag-match-system-spec-v0.1.md と連動) |
| 04-29 | 配布パッケージング自動化（v1）完了: DLsite/BOOTH 配布 zip への 5 ファイル欠落（data-faction-dialogue.js / flag-dialogue.js / factions.js / battle-replay-core.js / battle-engine-main.js）を根本解消。手動梱包・GUIツール梱包を廃止し、ホワイトリスト方式の PowerShell スクリプトに移行。`release/manifest.json`（配布対象 25 src ファイル + 3 ガイド HTML + image/ bgm/ ディレクトリを明示列挙）、`release/package-release.ps1`（manifest 検証→ステージング→zip 生成）、`release/verify-package.ps1`（zip 解凍→完全性検証→HTTP サーバー起動→手動チェックリスト表示）を新設。合わせて `build-zip.sh` の cp 列挙にも同 5 ファイルを追記。`.gitignore` に release/dist/ / release/staging/ / release/verify-tmp/ を追加。CLAUDE.md に「配布手順」セクション追加（手動梱包禁止・manifest 更新ルール明記）。ゲームコード変更なし。 |
| 04-27 | 離脱・裏切りイベントパッケージ Phase 1-6 全実装 (plans/relationship-events-betrayal-task.md → specs/relationship-system-spec-v2.2.md / specs/title-system-spec-v1.0.md §X)。**Phase 1**: `Engine.relationships.applyContractDepartureBetrayal` + `_recentlyClashedWith` 新設、`processDeparture` を行き先(rival/freeAgent/retire)で分岐し AI団体行きのみ A-1〜A-4 加算モデル発火。A-1 ベース(bond -20〜-12 / rivalry +8〜+15) + A-2 エース(=ロスター内OVR1位、bond -5〜-3 / rivalry +4〜+5 / morale -12〜-8) + A-3 宿敵団体(`Engine.orgWar.lastResult` 24週以内、bond -6〜-5 / rivalry +7〜+10) + A-4 王者(bond -10 / rivalry +12〜+15 / orgPop -5〜-3 / morale -15〜-10) のサーチャージ加算、内部50%でベルト持ち出し追加rivalry +5〜+10。キャップ bond≥-35 / rivalry≤+35。残留選手全員に同一 delta 適用(min/max 同値)。RNG 0xBE71/0xBE73。**Phase 2**: `Engine.title.transferTitleToOrg` 新設、A-4 持ち出し時に championId=null + externalHolder セット、AI団体側 `aiOrgs[id].externalTitles[]` にエントリ追加。簡略案: AI同士のタイトル移動なし。**Phase 3**: `Engine.orgTimeline.checkFirstMeetSinceDeparture` 新設(timeline overlap end の最大値=離脱週、h2h.history で離脱以降の対戦が0件なら true)、`applyMatchResult` の cross-org キャップ直前で B-3 適用(bond -3〜-1 / rivalry +6〜+10 双方向、`skipCrossOrgBondMult: true` で v2.1 乗数対象外)。**Phase 4**: 奪還挑戦システム — `Engine.title.canIssueReclaim` / `recordReclaimAttempt` / `resolveReclaimWin` / `resolveReclaimLoss` + `RECLAIM_COOLDOWN_WEEKS:12`、`G.reclaimChallenges[]` + `G._pendingReclaim` 状態管理(lazy init)。UI: 興行準備画面に「🏆 持ち出された王座」バナー(発行可/発行済み/CD中の3状態)+ 挑戦者選択モーダル(OVR降順)、`App.openReclaimDialog`/`confirmReclaim`/`cancelReclaim`。試合フロー: executeShow 冒頭で `_pendingReclaim` 消費 → AI defender を `isReclaim` 印で player roster に一時注入 → showCard slot 0 を奪還試合に置換、通常 title outcome で isReclaim をスキップ、context に `isCrossOrg: !!m.isReclaim`、finalizeShow 専用ブロックで勝敗ディスパッチ → `resolveReclaimWin/Loss` + roster cleanup + `_pendingReclaim` クリア。**Phase 5**: 王座空位中(championId=null && externalHolder=null && titleEstablished)に `getEligibleChallengers` 上位2名を提示する「👑 世界王座 空位中」バナー、既存 `crownChampion` 流用。**Phase 6**: NEWS_HEADLINE_TEMPLATES に 5 種追加 (contractBetrayalChampCarry / ChampLeave / RivalOrg / Ace / Generic 各2バリエーション)、`App._consumeBetrayalNews` で `_lastBetrayalSummary` のフラグから優先順位 ChampCarry > ChampLeave > RivalOrg > Ace > Generic で振り分け、`_resolveContractChoice` / sudden_departure / listen サブ選択の3経路から発火。auto-sim 100シーズン (5300週) ALL CLEAR ✓ 違反0/エラー0/ゲームオーバー0。ブラウザ検証: 持ち出しバナー描画 + 空位バナー描画 + ダイアログ展開 + 挑戦者OVR降順表示 + 5 news type 振り分け確認。変更ファイル: src/relationships.js + src/management.js + src/app.js + src/ui-render.js + src/data.js + specs/relationship-system-spec-v2.2.md (新規) + specs/title-system-spec-v1.0.md §X (追記) + CLAUDE.md 索引。残課題: A-4 ベルト持ち出し50/50分布の長期統計(明示集計未実装)、奪還試合での AI defender 状態を AI org 側に反映する是非、A-1 単独実測値の数値プロファイリング |
| 04-26 | 年度MVPレース v2 + 新聞4面新設 (plans/mvp-race-and-page4-plan-v2.md): 年度MVP決定を「結果ベースのポイント争い」へ全面切替、シーズン中の経過を新聞4面で常時可視化。**履歴記録**: ppvMainEvent(勝者/敗者/サミット非参加者) + b3Challenge(won)/b3Decline/b3Rejected + bigMatch(MQ85超) + AI vs AI war(won) を追加、二重カウント防止 (summitParticipants チェック) と aiOrgs 不変性維持。**Engine.mvpRace 新設**: POINTS定数 (PPV優勝42/準V15/出場10/王座奪取11/防衛13/期末保持8/ドーム4/大試合5/対抗戦勝16敗-12/B3辞退-4拒否+4/団体ランク1位+10 2位+5)、calcSeasonPoints(fighter,orgId,season,state) で内訳付きポイント算出 (ovr/ppv/title/dome/mq/war/b3/orgRank + meta)、recalcRanking(state) で全団体合同 TOP10 算出 (前週順位引き継ぎ→arrow{up,down,same,new}+arrowDelta)、generateNarrative/generateTagline/generatePageHeadline/generatePageLead/generateKurodaComment 自動文言生成 (TOP3=ナラティブ、4-10位=タグライン、王者防衛/PPV優勝/対抗戦英雄/MQ職人/新人台頭/フォールバックの優先順位、決定論的RNG)。advanceWeek 末尾2箇所(通常週確定+オフ週進行)で `s.mvpRace = recalcRanking(s)` フック、早期リターン分岐(pendingEvent等)では呼ばない。**selectMVP 置換**: MVPレース1位をそのままMVP化、mvpScore互換 + mvpPoints/mvpBreakdown 追加、引退選手も対象 (retiredFighters + retiredSeasons)。旧 OVR支配的ロジックは _legacySelectMVP として残置。**新聞4面 (📊 4面 年間レース)**: docs/ui/mockups/mvp-race-page4-final.html 準拠、p2-* → np-mvprace-* リネーム、紙面ヘッダ + セクションラベル + H2大見出し + リード解説段落 + メタ行 + 1位カード(200×267画像+OVR/PTS 32px+ナラティブ+王者/PPV/対抗戦/ドーム内訳バッジ4枚) + 2位カード(銀ボーダー)+3位カード(銅ボーダー)+黒田寸評+「— 4 位 ・ 以 下 追 走 —」ディバイダ+4-10位リスト(矢印+顔36px+団体エンブレム+名前+タグライン+OVRボックス+pt)。発光/グロー禁止徹底 (1位カード 2px solid #c8a040 + 通常ドロップシャドウのみ)。CSS約400行を index.html に配置。**変更ファイル**: src/management.js + src/app.js + src/ui-render.js + src/index.html。auto-sim 5シーズン ALL CLEAR、validateGameState 維持、save/load 互換 (state.mvpRace は新規フィールドのため undefined セーブも防御済み) |
| 04-19 | タッグマッチ ブラッシュアップ v0.1 (docs/tag-match-brushup-design-v0.1.md) 全 T1-T5 + D1-D5 + big-intro 実装完了。**T4** シングル準拠文言 (3ーーーーっ！！！/返したーーーーっ！！/タップ！！/ロープ！ ロープブレイクーーっ！！) + Space/Enter キー + autoAdvance。**T3** 丸め込み主体/対象明示: narration `{subj}が{obj}を丸め込んだ！` + パネル glow/dim + カウント中 moveNarration に `{subj}が押さえ込んでいる！` 継続表示。**T5** 攻撃方向矢印 (CSS in battle-shared.css / single+tag 共通): ltr/rtl 金矢印、カウンター 2段階 (元攻撃 → 1000ms間 → 返し太オレンジグラデ + 頭 54px)、MISS グレー矢印、技名 label 非表示 (move-name/moveV が兼ねる)、arrowLayer を move-display / move-box 内に収める。**T1** ダブルチーム技バリエーション 26→89 技 (STYLE_TAG_MOVES 配列化、_lastTagMoveName で試合内連続回避)、実況文 5 カテゴリ × 5-7 件 = 28 件 (strike/throw/submission/aerial/finish)、moveCat をフレームシリアライザに追加。**T2** 試合完了セリフ 49 件 (TAG_MATCH_WIN_LINES 性格7×3 + TAG_MATCH_LOSS_LINES 性格7×3 + TAG_MATCH_COMMENTARY_WIN_LINES 7、{partner}/{winner}/{move} プレースホルダ)、showResult に vicLines 枠追加 (決め技打った勝者コメント + pin/tap された敗者コメント + 実況締め)。**D5** シングル showFinishClickBtn 準拠のボックス型クリック待機 (finish-click CSS を battle-shared に集約、#finishOverlay + #finishBtn タッグに追加、_showFinishClickBox 新設、seq 順序 ワン/ツー → finishClick box → 最終カウント)。**D4** カウント前導入 narration (fall/pin 3種/tko 3種 ランダム選択)。**D3** 溜め攻撃中に攻撃者パネル charging glow + CHARGING テキスト pulse。**D2** MISS 矢印グレー (.attack-arrow.miss)。**big-intro** 追加: フォールに入った/押さえ込んだ/ロック/極まっている/{subj}が{obj}を丸め込んだ 等の決着寸前導入を別枠 48px 大文字で pop表示 (2.2s アニメ、長文は 40px .long)。auto-sim 30シーズン ALL CLEAR。モックアップ: archive/prototype/tag-battle-arrow-mockup.html |
| 04-19 | タッグマッチ Phase 4b 積み残し (大技3段タイミング構築 + pin count single 準拠) 実装完了: Step 5 の SE align 後も「溜めの途中で技が炸裂」「セリフ先出し」「表示が先に終わる」「カウント 1,2,3 の表記が single と全然違う」の 4 点が残っていた。single L1939-2002 の 3 段タイミング (0/1.8/2.3/2.7/3.3s) を tag に移植: 定数 `BIGMOVE_CHARGE_MS=1800` 導入、`applyFrame` を「JS 状態更新」と `_applyFrameVisuals` 関数に分離、大技フレームは t=0 で `sfx.bigmoveCharge()` のみ + HUD/ナレーション/ログ/イベント/タッチ演出を 1800ms 完全停止、t=1800 で全解禁 → t=2300 で `_renderActionImpact` → t=2700 で damage line。`_frameMinDelay` の大技加算を `+2000` に (計 3300ms)、`animateAction` に `isBigMove` 引数追加で二重 charge 回避。pin-count CSS を single の `.finish-count-text` と同一仕様 (72px Bebas Neue / scale 2→1 / 0.8s / gold-red-white 3色) に書き換え、getComputedStyle で bit-identical 確認。サブミッション導入 (tag 固有 lock/agony) は 40-44px Noto Sans JP 控えめに切り分け。specs §11.5d Step 6 追加 |
| 04-19 | タッグマッチ Phase 4b 積み残し (SE 呼び出しの single 準拠 align) 実装完了: tag-battle-main.js の SE 呼び出し 5 点が single と drift していた状態を修正。(1) 試合開始 `sfx.gong()` → `sfx.gongStart()`、(2) `animateAction` 冒頭に `sfx.ready()` 追加 (毎ターン準備音)、(3) 大技 (`action.dmg>=20`) で `sfx.bigmoveCharge()` 先行 + 衝撃演出を 1100ms 遅延発火 (`_renderActionImpact` に切り出し + `_frameMinDelay` に +1200 加算 + `tryDamageLine` delay 切替)、(4) カウンター SE を `SE_MIX.counterSE*0.5` の half-volume 形に (single L1881 準拠)、(5) hitSE volMul を `action.dmg>=20?1.3:1` に (single の大技 1.3 / 通常 1.0 準拠)。Phase 4b の SFX 定義共通化はそのまま、今回は呼び出し側 align のみ。specs §11.5c Step 5 追加。auto-sim 不要 |
| 04-25 | 団体年代記 vNext (chronicle-system-spec-v0.2.md): 章 mode 判定 + 記者の目8カテゴリ拡充。Phase A: `Engine.chronicle._classifyChapterMode(chapter, state)` 新設 (seasonHistory.rank → ascend/decline → 最頻ティア(タイブレーク章末優先)で summit/defense/contention/challenge 判定、12ケース全通過)。`_buildEraStats` 拡張 — `totalTitleDefenses` 追加(count が累積値の事実を踏まえ、選手×ベルト単位で「章期間内最大count − 章開始直前最大count」の差分集計、NPC backstoryのcount:3集約も正しく扱える)、`_titleLossInChapter` 内部フラグ。`_buildCompetitiveRecord(chapter, mode, eraStats)` 新設 (mode別 {label, valueText} 整形、decline は titleLoss 有無で「・王座失陥」付与)。`buildChapters` 内で `eraStats.competitiveRecord` 派生計算+内部フラグ削除。Phase B: ui-render.js era stats 2番目ボックス (旧 VS S-TIER) を `competitiveRecord.label/valueText` 参照に変更、`_chronicleCompetitiveValueHtml(text)` ヘルパーで「X度防衛(・王座失陥)」「X勝Y敗」を `<span class="small">` で装飾。古いセーブは `competitiveRecord` 未生成でも三項演算子で VS S-TIER フォールバック。Phase C: `Engine.chronicle.QUOTE_TEMPLATES` 8カテゴリ × 各4本 (peakDefender/defender/champion/popStar/generationShift/struggle/craftsman/uncrowned)。`_classifyAceQuoteCategory(ace, chapter, state)` 新設 (上から順、章mode + ace戦績 + 前章peers含有判定)。`buildAceQuote(ace, chapter, state)` 新設 (テンプレ選択は `Engine.rng.derive(rngSeed, chapter.number, ace.id, 0xCB02)` で決定論的、{surname}/{styleJa}/{titleReigns}/{defenses}/{peakOVR}/{peakPop} 値埋め)。ui-render.js の `_chronicleAceQuote` を `Engine.chronicle.buildAceQuote` 呼び出しシムに置換。auto-sim 50シーズン(2650 weeks) ALL CLEAR。実機検証: spec §A.3 12ケース全通過、buildAceQuote 7カテゴリ(peakDefender/defender/champion/popStar/craftsman/struggle/uncrowned) 全動作確認、決定論性(再呼び出しで同一)、`_chronicleCompetitiveValueHtml` 5パターン正常装飾、コンソールエラー0。変更: src/management.js + src/ui-render.js |
| 04-19 | タッグマッチ Phase 4b 積み残し (基本セリフ共通化) 実装完了: `DAMAGE_SERIF_LINES` / `DAMAGE_VOICE_LINES` が battle-engine.html と tag-battle-lines.js に bit-identical でコピペされていた drift リスクを解消。新規 `src/battle-lines.js` に 2定数 + `pickDamageLine` を集約、両 iframe が `<script src>` でグローバル読込。battle-engine.html の既存 `tryDamageCutin`/`showDamageSpeech`/`showDamageVoice` は RNG.float (streaming 権威モデル) 維持のため共通定数参照のまま据え置き。tag-battle-lines.js にはタッグ固有 (`HOT_TAG_LINES`/`DOUBLE_TEAM_LINES`/`CUTIN_SAVE_LINES`/`BETRAYAL_LINES` + 各 picker) のみ残す。`CUTIN_LINES` (ライバリー戦 cutin) は single 専用のため touch しない。specs §11.2 表追記 + §11.5b Step 4 追加。auto-sim 不要 (セリフ定数のみ) |
| 04-19 | タッグマッチ Phase 4b 実装完了: 演出層 (SFX / CSS トークン+キーフレーム / カットイン) を single battle-engine と共通化。目的: single 側で演出を改修したとき tag 側にも自動反映される状態を作りドリフトを止める (「見た目 = 音とタイミング含めた体験全部」前提)。変更: ①`src/battle-sfx.js` 新規 — 約90%重複していた SFX 定義を superset で集約 (single 専用: lockIn/bigmoveCharge/gongStart/hover/select/deselect/特殊マッチ victoryFanfare、tag 専用: hotTag/doubleTeam/touch/betrayal/friendlyFire、共通: hit*×6/miss/counter/cutinSlide/dmgVoice/count/kickout/finChime/gong 等、+ drone + guessCategory)。drone state を `S.droneNodes` から module-local `_droneNodes` に逃がして衝突回避。`src/tag-battle-audio.js` は削除 (battle-sfx.js にリネーム相当)。②`src/battle-shared.css` 新規 — `:root` デザイントークン superset (tag の text-sub/dim を hex #888/#555 → rgba(232,230,224,0.5/0.25) に single 準拠で統一) + リセット + ::-webkit-scrollbar + 共有キーフレーム 9種 (waitSpin/shakePanel/shakeHard/movePop/counterFlash/cutinSlideIn/cutinSlideInR/flashScreen/dmgNumPop)。drift 補正: counterFlash を tag 「2段階」→ single 「0→30%ピーク→100% 3段階」に、cutinSlideIn/R を -40px → -50px に、movePop を scale(1.15) → scale(1.20) に、flashScreen (旧 tag flashScr) を opacity 0.15 → 0.18 に。tag 側 @keyframes dmgPop → dmgNumPop / flashScr → flashScreen の名称統一で参照更新。③`src/battle-anim.js` 新規 — `BattleAnim.renderCutin({overlay, fighter, side, text, variant})` と `BattleAnim.dismissCutin(overlay, onAfterClear?)` に DOM 組立と SE 再生を集約 (variant='damage-voice' 時のみ sfx.dmgVoice、他は sfx.cutinSlide)。両 iframe の showCutin/showDamageSpeech/showDamageVoice/dismissCutin を BattleAnim 経由に移行、tag 固有 state (S.pendingCutin / nBtn disabled / pin seq 連動) はラッパ側に残す。副産物として single の showDamageVoice で SE が鳴っていなかった不整合が自動解消。検証: 両 iframe 単体ロードでコンソールエラー0、sfx 36関数 + BattleAnim.renderCutin/dismissCutin 全バインド、var(--*) 展開 (bg-dark/gold/text-main/red/blue)、shakePanel keyframe 解決、variant 付与 + side='right' dir 付与 + textContent + dismiss の class/innerHTML クリア動作確認。スコープ外 (Phase 4c 送り): 演出シーケンス単位 (bigmove 溜め→技名→フラッシュ→ダメージ / counter スライドイン / touch swap) の setTimeout ツリー共通化、ダメージ数字ポップ (single=固定要素再利用 / tag=動的 append の DOM 戦略差)、shake/banner/pin-count の共通ヘルパー化 — これらは streaming (single) vs Replay (tag) の権威モデル差に絡むため権威モデル統一議論と合わせて設計する必要あり。specs/tag-match-system-spec-v0.1.md §11 追加 |
| 04-17 | タッグマッチ Phase 4a 追従修正: (1) 試合プレビュー UI(ui-common.js:renderMatchPreview)でタッグ枠に「🎬 試合を観る」ボタンが欠落していた(Phase 1-3 実装時の名残) → シングルと同じく watchMatch/skipMatch 両ボタンを表示するよう修正。(2) tag-battle 実プレイ確認で指摘された 4点を修正 — 最新ターン情報が narration(中央上段)に反映されないバグ(renderMatch が frameIdx-1 を参照していたが applyFrame 時点で frameIdx 未増加で 1ターン古いフレームを描画していた → nextFrame で applyFrame 前に frameIdx++)、ログ順序の反転(slice(-60).reverse() で新しい順、scrollTop=0 で頭出し)、CHEM A/B → 連携 A/B + TEAM A/B → Aチーム/Bチーム 日本語化(HP と混同表記を解消)、ペーシング追加(FRAME_DELAYS: miss 700ms/hit 900ms/counter 1100ms/crit 1300ms、ドラマイベント+500ms、決着 2200ms、S.anim と S.pendingCutin 中はボタン disabled で連打完全ブロック、AUTO 次フレーム delay を minDelay+400ms に)。モックアップ(archive/prototype/tag-match-prototype-v0.1/match-screen-tag.html)との完全なデザイン合わせ込み(ステータスバー/速度ドット/ターンスライダー/Current Move ブロック/Victory overlay vic-portraits 等)は別タスクに切り出し済み |
| 04-17 | タッグマッチ Phase 4a ビジュアル観戦: Replay 方式採用(Port 方式=シングル踏襲 はエンジン重複 600+行のため不採用)。Engine.tagMatch.simulateTagMatch に recordFrames オプション追加(ターンごとの snapshot 配列を副産物として返却、デフォルト off で auto-sim/AI団体処理は無影響)。snapshot 構造: turn/phase/legalA-B/apronA-B/hp(×4)/grit/hotTagBuff/mom/logLines/events/action{attackerId,defenderId,move,moveD,kind,dmg,isCrit}/segmentIdx/winner/finType/finMove/pinnedBy/pinnedWho。src/tag-battle.html(レイアウト)+ src/tag-battle-main.js(State/postMessage/renderMatch/nextFrame/applyFrame/演出群)+ src/tag-battle-audio.js(SE 抜粋 + タッグ固有 hotTagSE/doubleTeamSE/touchSE/betrayalSE/friendlyFireSE)+ src/tag-battle-lines.js(ダメージセリフ/ボイス + HOT_TAG_LINES/DOUBLE_TEAM_LINES/CUTIN_SAVE_LINES/BETRAYAL_LINES) 新規作成。app.js watchMatch に matchType==='tag' 分岐追加(_watchTagMatch 新設、事前に simulateTagMatch 実行→sp.results[idx]格納→iframe src を tag-battle.html に切替→postMessage 送信)、receiveBattleResult にタッグ経路(事前計算結果を尊重して iframe を閉じるだけ、決定論保証)、他 iframe.src 5箇所を 'battle-engine.html?t=' にハードコード(直前タッグ観戦後の復帰保証)。2x2 レイアウト(リング内リーガル=縦長 stand 画像、エプロン=横長 face 画像+brightness(0.68))、シングル並み磨き込み(ダメージ数字ポップ/パネル shake/flash-atk/カウンター counter-flash/クリット 52px ゴールド/ダメージセリフ・ボイスカットイン/タッチ swap アニメ/ホットタグバナー金+カットイン/ダブルチームバナー赤+両パネル flash/カットイン救出バナー+カットイン/同士討ち黄 flash/見殺し grayscale+カットイン/DANGER overlay HP25%以下)。Phase 4b(シングル battle-engine.html の Replay 移植)は別タスク。auto-sim 100シーズン + 50シーズン ALL CLEAR |
| 04-16 | 人気システムリバランス: 逓減カーブ平滑化(80帯0.10→0.15/90+帯0.05→0.08)、活動ベース自然減衰(試合/プロモ週は半減)、スキャンダル-20~-35→-14~-25、連敗-5/-10/-15→-2/-4/-7、プロモ基礎値1.8→2.0、連続プロモキャンペーン(2週目×1.25/3週+×1.5/自動検知)、メディア露出手配に選手人気+4(逓減適用)追加。auto-sim 100シーズンALL CLEAR |
| 04-15 | 団体年代記 Phase 4 (chronicle-system-spec-v0.1.md §9 Phase 4 — 気風の新人生成への適用): Engine.chronicle.applySpiritToFighter(fighter, chronicle) 追加 (純粋関数。スタイル軸 spirit → calcPotBonus → SPIRIT_STAT_DIST 配分で trainCap を加算。pot・UI 表示には一切変更なし)。SPIRIT_STAT_DIST 5スタイル定義 (striker:pw0.6/sp0.4、grappler:te0.5/st0.5、submission:te0.6/mn0.4、brawler:pw0.5/st0.5、allround:全軸0.2)。適用5パス: completeDraft(management.js)/FA直接/FA溢れ/Scout直接/Scout溢れ (app.js 4箇所)。引き抜き・移籍(negotiation)・レンタルには非適用(既存プロのため)。auto-sim 3シード×100シーズン ALL CLEAR |
| 04-15 | 団体年代記 Phase 3 (chronicle-system-spec-v0.1.md §9 Phase 3 — 細部調整): 2枚看板専用レイアウト: `.chron-dual-wrap` (grid 1fr/28px/1fr) + `.chron-dual-card` (縦積み、portrait 130×168px + 個別タグライン/名前/4統計/記者コメント) + `.chron-dual-divider` (中央縦線 + `＆` マーク)。HoF 相互リンク: エース・同期に `🏅` バッジ (`.chron-hof-badge`) + `.chron-hof-link` (クリックで `openHofDetailById(id)`)。HoF 詳細モーダルに「📖 年代記で見る」ボタン (`hasChronicleChapter` 判定、`openChronicleForFighter(id)` で _dbSubTab=6 + _dbChronicleIdx=N + renderDatabase())。手動再構築ボタンは Phase 1 実装済み確認。**確定済み章のみ表示** (`confirmed` のみ、`in_progress` は非表示): 進行中章を見せるとプレイヤーが現在のエース候補を意識して最適化行動に走るため、「振り返るためのもの」という設計原則に従い世代が完全に確定してから初めて刻まれる方針に変更。UI 層のみ変更のため engine auto-sim 不要。変更: ui-render.js |
| 04-16 | タッグマッチ Phase 3 結果処理統合: TAG_REL_SCALE定数(data.js)+Engine.tagExp(match-engine.js)+Engine.relationships.applyTagMatchResult(relationships.js、対戦相手4組+チームメイト2組のbond/rivalry変動、ドラマイベント連動)。executeShow全面タッグ対応(validMatchesフィルタ/Pass1バトル生成/Pass2 MQ/MQ人気/関係値/成長/h2h/matchupLog/tagExp/trust/showContextEffects)。auto-simに8興行に1回タッグ試合生成。全r.left.id/r.right.id参照箇所をタッグ対応ガード。auto-sim 100シーズン+タッグ500試合 ALL CLEAR |
| 04-16 | タッグマッチ Phase 1 エンジン統合: Engine.tagMatch.simulateTagMatch を match-engine.js に追加(+650行)。TAG_MATCH_CONFIG/STYLE_COMPAT_MATRIX/STYLE_TAG_MOVES/getStyleCompat/getTagMove を data.js に追加。Engine.battle の共通関数(selMove/calcHitRate/calcDamage等)を流用しつつ、タッグ固有処理(セグメント進行/タッチ判定/エプロン回復/カットイン/ケミストリー/ドラマイベント/タッグMQ)を新規実装。test/tag-match-test.js 新設。auto-sim 100シーズン ALL CLEAR + タッグ1000試合 ALL CLEAR (勝率49:51、平均T32.3、平均Seg7.5、平均MQ55.9) |
| 04-15 | 団体年代記 Phase 2 (chronicle-system-spec-v0.1.md §9 Phase 2 — 表現の充実): サブタイトルテンプレ拡充 (SUBTITLE_TEMPLATES 7カテゴリ × 3-5バリエーション = 27 文、early/golden/almostThere/challenge/idol/enduring/other)、章末フレーバー拡充 (CLOSING_TEMPLATES slight/moderate/strong × 4バリエーション = 12 パターン × 5軸 = 60 組合せ、{org}/{axis} トークン置換)、_pickTemplate 決定論的選択ヘルパー (seasonStart/seasonEnd/axisSeed でシード化、同じ章は毎回同じ文面)。_generateSubtitle をカテゴリ分岐 → テンプレ選択に書換、_generateClosing も magnitude 判定後テンプレ選択に書換。進行中章バッジ強化: chron-header に in-progress クラス (斜めストライプ背景 repeating-linear-gradient)、「CHAPTER II — WRITING —」マーク (ゴールド点滅 animation 2.4s)、章扉下の書きかけ注釈「この章はまだ書きかけです。選手たちが引退して数年が経つと、章が確定します。」、章末を「— 書きかけの章末 —」に書換 + 注釈「この気風はまだ動いています。…」、closing が空でも in_progress 時はフォールバック文「この世代が団体に残す色は、まだ定まっていない。」を出す。空状態 UI 強化: 白紙期間 (SEASON 1 — SEASON N) + 在籍する書き手 N名 + 筆頭の者たち 3名 (OVR トップ) + flavor「今いるこの選手たちが、この白紙を物語にしていく。」を empty-meta ブロックで表示。auto-sim 50シーズン ALL CLEAR (2650 weeks / 0 violations)。実機: 章1 "残された者たち" + 「わずかに 打撃 へと寄せた。」、章2 (in_progress) "一歩、届かず" + WRITING マーク + 書きかけ注釈 + 「関節技 の色を残していった。」+ 気風動いています注釈、ストライプ背景+動的 animation を全要素 DOM 検証済み。Phase 3-4 未着手 |
| 04-15 | 団体年代記 Phase 1 (chronicle-system-spec-v0.1.md): Engine.chronicle モジュール新設(archiveFighter/applySpiritContribution/calcSpiritContribution/calcPotBonus/buildChapters ほか全 20 メソッド)、G.chronicle = {spirit, chaptersCache, fighterArchive}、引退フック 4パス設置(ラストラン/モチベ喪失/怪我引退 L+R/シーズン末自然引退)、マイグレーション _migrated_chronicle_v1 (HoF player + retiredFighters → fighterArchive 変換 + spirit 遡及積算 + 初回章生成)、DB サブタブ「📖 年代記」追加 + _renderDbChronicle (Cream Paper スコープ CSS トークン、タイムライン、2枚看板対応エース枠、人気派 idol バッジ、章末フレーバー、前章/次章ナビ、再構築ボタン)。auto-sim 100シーズン ALL CLEAR (5300 weeks / 0 violations)。気風は Phase 4 まで dry run (新人生成未適用) |
| 04-15 | 社長室 Phase 3 (書類の動的生成と表示): data.js に DECISION_DOC_ORDER + DECISION_DOCS(8種類、hireCoach 含む)、management.js に Engine.shachoshitsu(getDoc/getDocOrder/checkActivation/getAvailableDocs) を追加。renderShachoshitsu を placeholder から動的描画に差し替え、grid-column/grid-row を各書類に直接付与して §7.2 「穴は空いたまま」を保証。CSS ツールチップ位置補正を nth-child → [data-col] に切替。4シナリオ検証 ALL PASS(初期3枚/orgPop25で+media/+スランプで+encourage+refresh_leave/+morale<50で全7枚)。auto-sim 20シーズン ALL CLEAR。保留事項: 慰労会の発動条件(morale<50限定)の再検討は Phase 4 実装後 |
| 04-12 | Tier3B大穴埋め370行: シャイ/丁寧+感情的/蠱惑の欠落セリフ一括反映。37ソース対象(GLIMPSE_B40/JUNIOR28/CHOICE25/CARE22/CONTRACT20/EMOTION20/GLIMPSE_A20/LARGE20/SNAPSHOT18/RETIREMENT16/NOTIF13他)。304スロット新規挿入+26既存スキップ(EMOTION_TEXTS20+SCOUT6)。data.js +996行。auto-sim 100シーズンALL CLEAR |
| 04-12 | Tier3A大穴埋め124行: RETIREMENT_CHAMPION_WORRY_LINES性格別→archetype別に設計変更(_ARCHETYPEに統合、management.jsルックアップ簡素化)。5ソース欠落補完: VOLUNTARY_STAY_LINES+15/RIVALRY_CONFRONTATION_LINES_90+18/PPV_SUMMIT_VICTORY_LINES+13/FAN_EXPECT_REACTIONS+32/SCOUT_SIGNING_LINES+39。auto-sim 100シーズンALL CLEAR |
| 04-12 | バトル系セリフ穴埋め91行: DAMAGE_VOICE_LINESにcomposed追加(battle-engine.html)。CUTIN_LINES atk/def/climaxにshy性格×7archetype追加(2Dネスト、既存ルックアップ互換)。RIVALRY_MATCH_REACTION 69行追加(winnerLines/loserLines欠落組合せ+2本目バリエーション)。auto-sim 100シーズンALL CLEAR |
| 04-12 | Session F nested セリフ拡張+TIER2穴埋め: worksheet.xlsx 394行→6種nested source反映(NOTIF36+CARE66+CHOICE61+LARGE60+GLIMPSE_B 84+SNAPSHOT 87)。TIER2: EMOTION_TEXTS全10感情にcomposed archetype追加(ui-render.js)。RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPEに_default/cool/delinquent追加+ルックアップ汎用化(management.js)。auto-sim 100シーズンALL CLEAR |
| 04-06 | ドラフト交渉システム step1-5実装+修正16件: セリエンジン(draft-negotiation.js ~780行)/旧スカウト廃止/候補プール拡張/事前選択制/候補一覧UI(新聞風)/交渉画面UI(入札カード+ヒートゲージ+ナレーション)/BGM・SFX統合/EMPRESS安全網/観戦モード廃止/団体名動的化/エンブレム修正/★視認性改善/BGM_showScreenNoBgm導入/AI全同時離脱バグ修正/ロスター上限制御(理想+2超で不参加)。引き継ぎ: docs/draft-notes/ |
| 04-06 | specs/再同期全完了: カテゴリA(7件)+カテゴリC(6件)、specs/全20ファイル |
| 04-05 | dormantPool FIFOキュー化: drawFromFrontヘルパー+選抜4箇所FIFO化+フィルタバグ修正+エントリ形式統一 |
| 04-04 | AI引退選手即リサイクル修正: _weekRetiredIds→retiredIds反映+5シーズンクールダウン適用 |
| 04-02 | 殿堂ポイント調整: ジュニア優勝6→4pt/PPV勝利7→5pt/対抗戦勝利2→1.5pt。表彰歴4種を新規加算(MVP2pt/新人王1.5pt/ベストマッチ1pt/メディア功労賞1.5pt)。殿堂タブ説明文を全9種内訳に更新。既存セーブの殿堂入り済み選手は再計算せず維持。auto-sim 100シーズンALL CLEAR |
| 04-02 | プロモ人気増加の可視化: seasonPopGrowthフィールド追加→団体タブ成長ログに「人気+X.X」（オレンジ）表示。精算レポートのプロモ収入行に「人気+X.X」追記。シーズン末リセット。auto-sim 100シーズンALL CLEAR |
| 04-01 | ポップアップ通知追加6件: P1スキャンダル→showNotifEventToast(N_scandal警告スタイル+portrait)/O2空席新聞記事(emptyVenue newspaper)/T4-T7不満ティッカー(G1-G4 grievanceフラグをprocessWeeklyStoryEventsで最大2件/週)/M1対立ペアティッカー強化(ペア名表示)/P5怪我離脱人気低下→showToast(4週毎)/P6メディア密着終了→showToast。data.js+management.js+relationships.js+app.js+ui-common.js変更。auto-sim 100シーズンALL CLEAR |
| 03-30 | MQ上限撤廃&特性MQリデザイン: MQ clamp上限100を5箇所で撤廃(match-engine.js×1+management.js×4)。名勝負製造機:MQ直接+1~5廃止→キックアウト+0.15/ギブアップ脱出+0.15/カウンター+5%の間接効果に。引き出し上手:MQ直接+max4廃止→ペーシング減点の適正ターン閾値緩和(Tier2:13→10/10→7、Tier1:7→5/5→3)に。auto-sim 100シーズンALL CLEAR |
| 03-28 | 関節技決着の勝利方法表示修正: checkPinAttempt成功時にmv.c==='submission'でfinType='ギブアップ'に分岐（従来はすべて'ピン'→3カウント表示になっていた）。auto-sim 100シーズンALL CLEAR |
| 03-28 | 殿堂入りスライド修正: セリフタイミング制御(選手セリフ→タップでコーチセリフに切替、次へボタン無効化)+コーチ画像パス修正(getPortraitUrl→getCoachPortraitUrl)+タップヒントUI追加 |
| 03-26 | B4タレント活動拡充設計: 6種サブタイプ(cm/gravure/variety/brand/fashion/fan)+personality相性倍率+archetype追加補正+名前配列6種+LARGE_EVENT_TEXTS/DIALOGUES全セリフ+週次収入組み込み+推薦ヒントUI。実装依頼書: docs/b4-talent-activity-impl.md |
| 03-26 | 引退セリフ修正設計: B4_champion_injury全パターンをネガティブ→誇り・優秀の美ベースに書き直し。trust≥85+30%抽選で社長気遣い追加ポップアップ（クリックで閉じる）。セリフ管理: dialogue-rewrite-master_5.xlsx |
| 03-26 | メディア功労賞実装完了。mediaRevSeason+talentRevSeason合計最大の選手を選出。表彰式MVP直後にスライド表示。AWARD_LINESにmediaAwardセリフ追加 |
| 03-26 | 団体画面ブラッシュアップ完了済み確認 |
| 03-26 | MQ改修Phase1-3: キックアウトバグ修正+ペーシング長すぎ撤廃+外部MQ6件削除+値圧縮+集客ボーナス変更+マンネリ緩和(ランダム幅+ロスターサイズ連動ウィンドウ)+OV帯別分布検証ALL CLEAR |
| 03-25 | 直近5戦表示: recentMatches配列(FIFO max5)をプレイヤー興行/AI興行/PPV/対抗戦の全4パスで記録。Engine.pushRecentMatch新設。選手ポップアップ通算戦績の下に「直近: ○山田 ×鈴木...」横1列表示。auto-sim 100シーズンALL CLEAR |
| 03-25 | 新聞バックナンバー: G.newspaperArchive(最大24週分)蓄積+バックナンバーナビUI(◀次の号/前の号▶/最新号)+日付表示大型化(シーズンN 第M週)。engine.js+ui-render.js |
| 03-25 | 開発率ラベル化: getPotentialPct数値→5段階ファジーラベル(未開花/成長期/開花中/充実期/完成形)+devLabelOffset(-7~+7)+stage別バー色。UIのみ |
| 03-25 | タスクキュー6件一括実装: BUG-02ティッカー虚偽修正+TASK-03ファン希望カードfreshness+TASK-01 JTシード配置+BUG-01 showSp堅牢化+TASK-02今週画面ソート&一括+TASK-04給料交渉勝率撤去。auto-sim 100シーズンALL CLEAR |
| 03-25 | AI契約交渉パリティ: processAIContracts新設。trust<40退団判定+特性/tier補正+退団先3種(移籍/FA/引退)+O-02 bond変動+新聞(aiContractDeparture:95)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AIメディア密着B4パリティ: processAIWeeklyEvent B4許可。tier別対象選出+mediaSpotlight 3興行追跡+avgMQ報酬+E-04関係性効果+新聞(aiMediaStart:45/aiMediaSpotlight:65)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AI怪我引退パリティ: processAIWeek怪我処理拡張。重傷→retireType判定+引退処理+departureTrustImpact+_midSeasonRetirees HOF判定+新聞記事(aiInjuryRetirement:150)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AI選手間対立B2パリティ: processAIWeeklyEvent B2ニュース連携完成。_pickAIChoice B2追加+_newsTeamConflict蓄積+_b2Relマージ+新聞記事(aiTeamConflict:110)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AI練習怪我B1パリティ: processAIWeeklyEventでB1許可。tier別自動選択+applyLargeEventEffect+新聞記事(aiPracticeInjury:55)。auto-sim 50シーズンALL CLEAR |
| 03-25 | AI団体ケアアクション統一: processAICare全面改修。状況ベース4種ケア自動選択(休暇/メディア/激励/合宿)+OVR傾斜+C系関係性効果簡易版(bond変動)。tickWeekでrelationshipsマージ。auto-sim 500シーズンALL CLEAR |
| 03-24 | ダメージセリフ/ボイス HP残量ベース発動ルール修正: フェーズ→HP残量基準に変更。tryDamageCutin関数追加(HP66%超:セリフ40%/HP34-66%:セリフ15%+ボイス50%/HP33%以下:ボイス60%のみ)。defenderReactionと同一閾値。battle-engine.html 3箇所修正+CLAUDE.mdルール追記。auto-sim 100シーズンALL CLEAR |
| 03-24 | タイトル画面SNSリンク追加(X/Patreon/FANBOX)+体験版終了画面改修(BOOTH URL修正/DLsiteボタン削除/FANBOX導線追加/SNSリンク追加)+showTrialLimitMessageテキスト修正(DLsite一時削除) |
| 03-22 | 新聞タブ見た目パッチ: 赤帯ヘッダー(週刊グラップル)、セクションラベル日本語化(一面記事/興行結果/他団体ニュース/次回展望+赤金縦線)、画像アイコン派手化(一面金枠+金グロウ/他団体紫ダーク+紫枠)、ダイジェストテーブル形式化(table1行/試合+勝者金グロウ/敗者グレー+MQ3色+バッジ日本語化)、星評価1行化+黒田アイコンダーク赤。UIのみ |
| 03-22 | 団体比較 見せ場パッチ: エース対決アリーナ(ダーク背景+赤照明+VS発光48px+名前バーグラデ)、相性グレード(赤ベタ白文字)、No.2/No.3アバター(金/紫ダーク+枠+グロウ)、注目選手アバター(52px+紫枠+グロウ)、バッジ/タグ全種ベタ塗り白文字、通算成績赤太字。UIのみ(engine.js変更なし) |
| 03-25 | AI団体間対抗戦B3パリティ: processAIWar既存実装(4週クールダウン/orgPop>20/2.5%発生率/OVRトップ3代表選出/simulateMatch matchTier2/勝者orgPop+2 trust+3 battleWins+1/敗者orgPop-0.5 trust-1/関係性rivalry/ニュースフラグ蓄積)に新聞記事生成(aiWarResult priority135、MQ90+で+20格上げ、勝利/引分テキスト分岐)+clearAINewsFlags(_newsAIWarResult削除)を追加。設計書: `docs/ai-parity-03-inter-org-war.md` |
| 03-25 | 対抗戦勝利報酬体感化: 5勝マイルストーンで新聞記事(warMilestone priority145)+士気ブースト(+3〜+5)。選手ポップアップTAB1に対抗戦個人戦績(🏴 N勝M敗)表示。殿堂ポイントにwarPt(1勝=2pt)加算+buildCareerHighlightsに「対抗戦通算N勝」。auto-sim 500シーズンALL CLEAR |
| 03-22 | 団体比較スポーツ新聞風リデザイン: カラースキームをダーク→セピア紙風に全面変更(.db-cmp-wrapコンテナ+新聞タブ同系統パレット)。英語ラベル全14箇所を日本語化。getPopularityTail slotIndex別バリエーション化(15パターン、OVR優勢+人気劣勢時の逆接表現)。VS表示強調(36px赤色+グラデーション区切り線)。エース対決アリーナレイアウト(スタンド画像向かい合わせ+名前バー)。赤帯ヘッダー追加。セクションタイトル縦線色分け(金=自陣営・中立/赤=相手情報)。UIのみ(engine.js変更なし)。auto-sim 50シーズンALL CLEAR |
| 03-21 | 6件バグ修正・改善: ■2興行中BGM漏れ修正(全試合完了時のみmanagement復帰)、■3タイトル挑戦資格(Engine.title.getEligibleChallengers新設+toggleTitle/AI団体/S1イベント/期待カード5箇所適用)、■5JT勝敗逆転修正(_receiveJTBattleResult→iframe結果でmatch上書き+_jtRecomputeSubsequentRoundsで後続ラウンド再シミュレーション)、■6コーチ画面視認性(未雇用背景rgba(0,0,0,0.3)→rgba(200,190,170,0.07)+グレード/特性バッジコントラスト向上)。auto-sim 100シーズンALL CLEAR |
| 03-21 | 収支チャート全サブタブ対応: _financeChart()共通SVGチャート関数新設+_weeklyFinanceValues()週次集計ヘルパー。総合タブの既存チャートをリファクタ、収入(緑#2ecc71)/支出(赤#e74c3c)/給与(橙#e67e22)タブにチャート追加。期間フィルタ連動。UIのみ(engine.js変更なし) |
| 03-21 | B3/B2試合観戦UI統一化 実装: B3「対抗戦」→「挑戦状」名称変更(engine.js/ui-common.js/data.js)、B3/B2にVS対峙画面(stand画像向かい合わせ+能力値対比バー+セリフ+観戦/スキップ)+battle-engine iframe観戦+フル試合結果カード(肖像/決まり手/MQ/HPバー/ターンログ+B2対立解決サマリー)追加。_renderB3MatchPreview/_renderB3MatchResult/_renderB2MatchPreview/_renderB2MatchResult新設、_executeLargeEventMatch→VS画面表示に改修、b3WatchMatch/b3SkipMatch/b2WatchMatch/b2SkipMatch/_finalizeB3Match/_finalizeB2Match新設、receiveBattleResult/escapeBattleにB3/B2ルーティング追加。auto-sim 200シーズンALL CLEAR |
| 03-21 | 浮動小数点表示バグ根絶: 表示整数化原則の確立。sanitizeFloatsにfunds/battlePoints整数化追加、updateRankingsでbaseScore/legacyScore整数化、ui-render.js/ui-common.js/engine.jsの全数値表示箇所にMath.roundガード(rating/funds/profit/収支/サバイバル/セーブスロット等40+箇所)、dispInt()汎用ヘルパー追加。auto-sim 100シーズンALL CLEAR |
| 03-21 | B3/B2試合観戦UI統一化 設計: B3「対抗戦」→「挑戦状」名称変更、B3/B2にVS対峙画面(stand画像向かい合わせ+能力値対比バー+セリフ)+battle-engine iframe観戦+フル試合結果カード(肖像/決まり手/MQ/HPバー/ターンログ)追加。Warパターン(`_warPreview`)踏襲の設計。モックアップ4画面(B3 VS/結果、B2 VS/結果)承認済み。仕様書: impl-b3-b2-match-viewing.md |
| 03-23 | レンタル契約単位修正: seasonsLeft(シーズン末一括減算)→weeksLeft(毎週1減算)に統一。1期=12週で正確に満了。processSeasonEnd→processWeeklyRental(tickWeek内呼出)。UI残週表示簡素化。マイグレーション_migrated_rental_v3(旧seasonsLeft×12→weeksLeft変換)。auto-sim 500シーズンALL CLEAR |
| 03-21 | 殿堂入りシステム拡張v2.0: allHallOfFame統合管理(player/org_s/org_a/org_b)+マイグレーション、buildCareerHighlights(titleWin/Defense/Loss/JT/PPV→固有名詞テキスト)、NPC団体殿堂入り(checkNpcHallOfFame+processSeasonEnd判定+advanceWeek回収)、レガシーポイント動的化(calcLegacyScore全団体HOF×10/cap50)、DB殿堂タブリッチ化(団体フィルタ+盾グリッド2列+詳細ポップアップ+キャリアハイライト年表+upper画像+ソート3種)、表彰式スライド(盾emoji+ハイライト年表+通算実績)、_buildAwardsSummary NPC殿堂表示、新聞npcHallOfFameニュース(priority170)。auto-sim 500シーズンALL CLEAR |
| 03-21 | JT体力バーアニメ復活+BGM演出+新聞タイミング+アイコン統一: 勝者体力バー減少→回復アニメ(準々決勝・準決勝)、優勝時BGMフェードアウト→チャンピオンジングル、JT後新聞再生成で結果記事即反映、WAR勝利+JT感想の画像を80pxポートレートアイコン(丸枠)に統一 |
| 03-21 | ジュニアトーナメントUI V6ビジュアル刷新: 召集画面(カード型全画面演出+face100px+ドット進行)、水平ブラケット(48pxアイコン角丸四角+OVRゴールドバッジ+SVGコネクター+勝者吹き出し)、フォーカスカード(stand画像向かい合わせscaleX(-1)+セリフペア)、勝者画面(upper180px+セリフ上配置)、チャンピオン画面(trophy→upper200×200 cover→CHAMPION→名前→団体→personality×archetypeセリフ)。CSS .jt-*プレフィックス新設。UIのみ(engine.js変更なし)。auto-sim 50シーズンALL CLEAR |
| 03-21 | WAR系3種+VICTORY+JTセリフ personality×archetype化: WAR_CHALLENGER/DECLINE/POST_DIALOGUE新設(200行)、WAR_VICTORY_LINES 47→93行増量、JUNIOR_TOURNAMENT_LINES 250行全属性拡張、旧trait/roleベースダイアログ全廃止、LARGE_EVENT_DIALOGUES.B3系4定数廃止 |
| 03-21 | 対抗戦勝利セリフポップアップ: WAR_VICTORY_LINES新設(personality×archetype 47パターン)+closeWarFinalResult後ポップアップチェーン(顔画像+セリフ)+CSS(.war-victory-overlay/modal)。セリフExcel管理拡張: 対抗戦4カテゴリ+JT全5タイミングの属性別枠497行追加、旧B3行統合、不要タブ削除 |
| 03-20 | U-20ジュニアトーナメント+殿堂ポイント制 全実装: Engine.juniorTournament(select/run/apply)+ブラケットUI+観戦+結果画面+セリフ5タイミング(personality×archetype)+HoFポイント制(12pt殿堂/★★★レジェンド)+PPV賞金+新聞複数ページ化(Week24プレビュー+Week25詳報)+ティッカー統合+auto-sim200シーズンALL CLEAR |
| 03-20 | 3件修正: (1)選手カード身長c.height→c.h+年齢追加、(2)B4密着取材サブタイプ化(youngStar/ace/veteran、候補フィルタ+テキスト分岐+レンタル除外)、(3)オフシーズン処理順変更(契約更新→スカウト→移籍) |
| 03-20 | バグ修正: プレイヤー練習成長(追い込み+通常)にtrainCapクランプ追加。外部乗数適用後のtrainGrowthがtrainCapを超過しうるバグを修正(AI版は既にクランプ済み) |
| 03-20 | バグ修正4件: 特別治療説明文を実ロジックに合わせ修正、B3辞退時の隠しペナルティ削除（UI表記と一致）、勝利条件/ランキング表示の浮動小数点をMath.round整数化、B3挑戦者選択をランキング隣接±1に変更（S級→3位挑戦の不自然さ解消） |
| 03-20 | 統一修正パッチv1.0: (1)黒田上半身画像廃止→28px顔アイコン統一(index.html CSS削除+ui-render.js getNpcPortraitUrl化)、(2)デフォルト比較対象→ランキング上位自動選択(_getDefaultCompareTarget+Engine.ranking.getPlayerRank)、(3)黒田テキスト全文体を記事調に統一(KURODA_HEADLINES/EDITORIAL/WAR_RECORD/MATCHUP_FLAVOR/SHOW_RATING/PREVIEW/SPOTLIGHT 全7定数)、(4)新聞v2(Engine.newspaper.generate/buildPreview/clearAINewsFlags+weeklyNewspaper+AIイベント蓄積4種+優先度ベーストップ記事+レガシー互換_renderDbNewspaperLegacy)。auto-sim 100シーズンALL CLEAR |
| 03-20 | 黒田幸子レポーターシステム Phase 2-3: NPC画像システム(getNpcPortraitUrl/getNpcUpperUrl)、kuroda-text.js新規作成(KURODA_HEADLINES/EDITORIAL/WAR_RECORD/MATCHUP_FLAVOR/SPOTLIGHT/FAN_OPINIONS/NEWSPAPER_DIGEST_COMMENTS/SHOW_RATING/PREVIEW 600+行)、既存テキスト修正(getMatchupCopy/getPopularityTail/getEdgeState/gradeDesc)、団体比較_renderDbOrgCompare()全面リニューアル8セクション、新聞タブ_renderDbNewspaper()拡張3セクション(興行評価★+全試合ダイジェスト+次回展望)、seasonStartOvrフィールド追加(ovrGainThisSeason算出用)、デッドコード削除。auto-sim 100シーズンALL CLEAR |
| 03-20 | orgWarRecord + orgPopHistory データ基盤: Engine.orgWarユーティリティ(getKey/get/getFor/recordWar/recordSummit/recordPPVMatch)、applyWarOutcome/applyPPVResults/simulateTVResultsの3箇所にフック、orgPopHistoryシーズン開幕時スナップショット、initialState初期値設定。auto-sim 500シーズンALL CLEAR |
| 03-19 | 団体画面ブラッシュアップ設計: 選手詳細WP風リデザイン（full画像+3タブ）、G1クリームカラーテーマ決定→本拠地系4画面に展開（団体/スカウト/ランキング/DB）、アイコン角丸四角統一、growthLogデータ構造設計、Mockup v1-v9作成 |
| 03-19 | バグ修正3件: ランキング画面レガシーpt列追加、引退試合後即引退（4週待ちバグ修正）、retiredIds永続化で引退選手の早期再登場防止 |
| 03-19 | 他団体戦ライバリーブースト + knownRival自動付与: isCrossOrgでrivalry×2.0(cap+35)、MQ65+/僅差でknownRival付与、PPV/B3/War全パス対応、B3バグ修正 |
| 03-19 | オフシーズンBGM: 表彰式終了まで（offWeek0-1）はmanagement BGM、offWeek2以降でseason_end BGM再生 |
| 03-18 | バグ修正バッチ: メインイベントボーナス逆転修正、不出場不満バグ、NPC王者王冠、タイトル挑戦条件強化、通常試合BGM、レンタル期日表示、効果残り時間表示 |
| 03-18 | 試合画面UI刷新 Phase 0〜7 全完了 + §1〜§4完了（勝利演出/PPVマッチカード/BGM/SE） + PPV試合進行画面リデザイン |
| 03-16 | 契約交渉v2.0（trust×ギャップ2軸マトリクス/突発退団）、trust欠落バグ修正、序盤orgPop保護 |
| 03-14 | Glimpse P1〜P6全完了、ポップアップUI統一 |
| 03-13 | Bond/Rivalryイベント設計spec + Phase A-E2演出テキスト、S級エース強化 |
| 03-10 | 成長システムリデザインv2.0、h2hデータ蓄積、Trust総合リバランスT1-T3 |

---

## 過去の完了機能ログ（旧ロードマップから移設）

### 他団体戦 Bond/Rivalry リバランス ✅ 実装完了（2026-04-26）

**背景**: 他団体戦は接触機会が極端に少ない（対抗戦は年1回未満、相手は3団体ローテのため特定ペアでは数年に1回レベル）。現状の関係値処理ではrivalryに×2.0倍率しかかからず、bondは同団体戦と同じ扱いのため、「他団体だから自然と距離が出る」「数少ない接触で大きく動く」という設計意図が満たされていない。

**設計方針**:
1. 基調はBond低下、ただし絶対ではない（名勝負を経た「好敵手」ルートを開ける）
2. 接触1回あたりの振れ幅を大きく（頻度差を倍率で補正）
3. 方向別の非対称な倍率（Bond低下は加速、Bond上昇は限定）
4. 結果として他団体間関係は二極化（敵対 or 好敵手）し、中庸帯に留まりにくい

**変更内容（5項目）**:

| # | 変更 | 内容 |
|---|------|------|
| ① | 他団体戦基本Bond税 | applyMatchResult内、isCrossOrg=trueの場合に**両方向 bond -2〜-5**を加算（勝敗・MQ無関係）。**試合参加選手2名のみに適用**、ロスター全体には波及しない |
| ② | Bond方向別乗数 | isCrossOrg時、bondDelta < 0 → **×1.5**、bondDelta > 0 → ×1.0（M-CO1/M-CO2は対象外で固定値） |
| ③-A | M-CO1 好敵手認定（新設） | クロスOrg + MQ≥80（M-04発火条件）→ M-04のbond部分を**両側 +6〜+10**に置換（rivalryは既存M-04値+×2.0乗数を維持） |
| ③-B | M-CO2 抗争和解（新設） | クロスOrg + M-10決着発火 → M-10のbond部分を**両側 +12〜+20**に置換、rivalry → 0〜10にリセット（既存M-10と同様）。乗数対象外で固定 |
| ④ | M-10決着閾値クロスOrg緩和 | クロスOrg判定対戦の場合、相互対戦数閾値を **4+ → 3+** に緩和（rivalry≥60 / MQ≥50は据え置き） |

**保留事項（第二弾以降）**:
- 他団体接触機会の追加施策（メディア共演イベント / スカウト競合rivalry付与 / 他団体エースコメント記事）— §3.1〜④の効果をauto-simで観察してから判断

**期待される関係値分布**:

| 他団体間ペアの最終分布 | 想定割合 |
|--------------------|:------:|
| 嫌悪〜苦手 + 因縁帯（敵対） | 50% |
| 普通帯 + ライバル視〜因縁（単なる対戦相手） | 25% |
| 好意〜深い絆 + 因縁〜宿命（好敵手） | 15% |
| その他 | 10% |

**数値根拠**:
- 基本税 -2〜-5: 同団体週次回帰幅(-0.18〜-0.30/週)の **10〜25倍**。年1試合以下の頻度を想定し、1接触で確実に「帯」を動かす設計
- ×1.5乗数: M-03圧勝(-4〜-2)を-6〜-3に拡大。複数の負イベント同時発火（圧勝＋怪我＋番狂わせ等）でも1試合 **総計-15程度** に収まり、過剰でない
- M-CO1 +6〜+10: 通常M-04(+3〜+6) × ×1.5(+4.5〜+9) を統合・上書き。基本税(-2〜-5)を含めて純増 +1〜+8、つまり**名勝負1回で1帯届く**威力
- M-CO2 +12〜+20: 同団体M-10(+5〜+10)の**約2倍**。「敵対関係を超えた絆」の表現

**実装対象**:
- `src/relationships.js` `applyMatchResult` 内のクロスOrg分岐拡張
- `specs/relationship-system-spec-v2.0.md` → v2.1 または v3.0 に改訂（§4.1拡張、§7.3クロスOrg特例追加）
- 既存 `isCrossOrg` フラグはPPV / B3 / War で既にセット済みのため新規フックは不要

**検証**:
- auto-sim 100シーズン（10seed × 10season）で他団体間ペアの bond/rivalry 分布計測
- 「敵対50% / 中庸25% / 好敵手15%」想定からのズレを評価
- 同団体内の関係値分布に副作用が出ていないか確認（クロスOrg分岐限定変更のため理論上影響なし）


### U-20ジュニアトーナメント + 殿堂ポイント制 ✅ 実装完了（2026-03-20）

設計書: `docs/junior-tournament-hof-points-spec.md`

**実装済み内容:**
- Engine.juniorTournament(select/run/apply) — 全団体U-20からOVR上位8名(4名)選出、3(2)ラウンドトーナメント、決勝ビッグマッチエンジン、コンディション25%回復持ち越し
- ブラケットUI + battle-engine観戦 + 結果画面（専用BGM付き）
- personality×archetypeセリフ5タイミング（召集/試合前/試合後/決勝前/優勝後）
- PPV賞金（国庫支出: 優勝¥2,000万 / 準優勝¥1,000万 / 3-4位¥500万）
- 殿堂ポイント制（タイトル1pt/JT優勝7pt/PPV優勝9pt、12pt殿堂入り、★/★★/★★★）
- 新聞複数ページ化（Week24プレビュー特集 + Week25全試合詳報ページ + ページ送りUI）
- ティッカー統合 + careerRecord拡張 + マイグレーション


### 団体画面ブラッシュアップ + クリームテーマ展開 ✅ 実装完了（2026-03-30頃）

設計書: `tasks/roster-redesign-plan.md`、Mockup: `archive/prototype/roster-detail-redesign-v9.html`

**実装済み内容:**
- 所属選手の詳細パネルをウイニングポスト風に全面リデザイン（full画像 + 3タブ: 能力/成長経過/育成）
- G1クリームテーマを本拠地系画面に展開（団体/スタッフ募集/スカウト/ランキング/DB/収支）
- body背景 `#24221e`（セピアグレー）統一 + ダークパネル暖色化
- `growthLog` データ構造 + 記録ロジック + マイグレーション + 引退時削除
- 選手アイコン角丸四角化
- ダーク維持画面: 今週/興行準備/ログ/セーブ/ヘルプ


### 金銭バランス改善（実装済み 2026-03-26）

設計書: `docs/finance-rebalance-brainstorm.md`

上級プレイヤーのフィードバック（6年目・6000席満員でも月間+94万）を受けた包括改善。チケット収入偏重と給与↔収入の二元論を解消する。

**① グッズ収入再設計**
- popularity連動、毎週発生（オンラインショップ的）、興行週ブースト、プロモ連動
- 月次報告で「グッズ売上トップ3」を選手セリフ付きで発表
- OVR低くてもpopularity高い選手＝「安くて稼げるお得な選手」に居場所を作る

**② メディア収入の新設**
- 放映権とスポンサーを「メディア収入」に統合、7発生源から個別計算→積み上げ
- 発生源: 週次ベース(orgPop×順位×人気) / 興行(来場人数,タイトル戦,MQ) / PPV・特別興行 / 挑戦状・対抗戦 / プロモ(回数×選手人気) / ファン期待カード実現(期待度×MQ) / ライバル抗争カード(rivalry値)
- 月次報告で合計表示＋内訳展開

**③ trust → 昇給交渉に最大8%減額効果**
- 契約交渉v2.0に組み込み。日頃のケアが少しだけ報われる程度

**④ プロモの位置づけ強化**
- プロモ活動がグッズ・メディア両方に直結。試合出場 vs プロモの人気上昇バランス再調整

**⑤ ランダムイベントE2再定義**
- スポンサー提案→「メディアパートナー契約」に。条件付き契約→メディア収入ボーナス

**見送り:** 新パラメータ(集客力等)追加、施設投資経費効率化(将来保留)、独立スポンサー契約システム、放映権ランク制

| Step | タスク | 重さ |
|------|--------|:----:|
| 1 | グッズ収入計算式の数値設計＋シミュレーション | 中 |
| 2 | メディア収入7発生源の金額テーブル設計＋シミュレーション | 大 |
| 3 | プロモ人気上昇量 vs 試合出場人気上昇量のバランス調整 | 中 |
| 4 | trust昇給減額ロジック組み込み（契約交渉v2.0拡張） | 小 |
| 5 | 月次報告UI改修（グッズトップ3演出＋メディア内訳） | 中 |
| 6 | ランダムイベントE2のメディアパートナー契約化 | 小 |
| 7 | auto-sim 100シーズン検証 | 小 |


---

## 実装済みシステム一覧

> 詳細は `docs/design-decisions.md` と `docs/archive/session-history.md` を参照。

| システム | 実装日 | 設計書 |
|---------|--------|--------|
| ドーム到達D層セレモニーイベント（first_dome_show/first_dome_sellout・全画面演出・キャラセリフ・BGM） | 04-24 | `specs/achievement-system-spec.md` |
| オープニングシーン+初期ドラフトUI刷新（4幕儀式演出+クリーム新聞テーマ+5名集合写真完了演出） | 04-07 | `specs/opening-sequence-spec-v1.0.md` |
| 業界底上げシステム（1位達成後A/B団体恒久強化+全画面演出枠+新聞記事） | 04-03 | `docs/league-elevation-mockup-spec.md` |
| 強化メニュー（追込）バランス修正（倍率1.5→1.8/消耗6-13→5-10/怪我5%→3%/鉄人・努力家軽減適用） | 03-28 | — |
| 団体アイコンシステム（NPC自動マッピング+プレイヤー選択UI+ランキング/対抗戦/トップバー表示） | 03-23 | — |
| 絶対週計算48週基準統一（Engine.util.absWeek共通関数+52→48修正+旧セーブマイグレーション） | 03-23 | — |
| B3/B2試合観戦UI統一化（VS対峙画面+iframe観戦+フル結果カード+名称変更） | 03-21 | `docs/impl-b3-b2-match-viewing.md` |
| JT体力バーアニメ+BGM演出+新聞再生成+WAR/JTアイコン統一 | 03-21 | — |
| 対抗戦勝利セリフポップアップ（WAR_VICTORY_LINES + ポップアップチェーン） | 03-21 | — |
| 黒田幸子レポーターシステム（NPC画像+テキスト定数+団体比較8セクション+新聞タブ3セクション+seasonStartOvr） | 03-20 | `docs/impl-orgcompare-ui-restructure.md`, `docs/impl-newspaper-enhance.md`, `docs/kuroda-style-guide.md` |
| セーブデータ圧縮+トリミング（LZ-UTF16圧縮+データ刈り込みでlocalStorage容量超過対策） | 03-20 | — |
| 興行画面ブラッシュアップ（HP対比バー共通化+対抗戦/通常興行UI刷新） | 03-19 | `docs/show-ui-brushup-spec.md` |
| 他団体戦ライバリーブースト + knownRival自動付与 | 03-19 | — |
| PPV試合進行画面リデザイン（upper画像+能力比較バー+白吹き出し） | 03-18 | — |
| 勝利演出+PPVマッチカード+BGM/SE音量（§1〜§4） | 03-18 | `docs/victory-ppv-implementation-guide.md` |
| 試合画面UI刷新 Phase 0〜7 | 03-18 | `specs/archive/battle-ui-spec-v1.0.md` |
| 契約交渉v2.0（trust×ギャップ2軸） | 03-16 | `specs/archive/contract-negotiation-event-spec-v2.0.md` |
| Glimpse P1〜P6 | 03-14 | `specs/archive/glimpse-popup-overhaul-spec-v1.2.md` |
| Bond/Rivalryイベント設計 Phase A-E2 | 03-13 | `specs/archive/relationship-event-design-spec-v1.0.md` |
| S級エース強化 & NPC団体チャンピオン | 03-13 | `specs/archive/s-rank-ace-rebalance-spec-v1.0.md` |
| 成長システムリデザイン v2.0 | 03-10 | `specs/archive/growth-system-redesign-v2.0.md` |
| h2hデータ蓄積・orgTimeline・感情テキスト | 03-10 | — |
| Trust総合リバランス T1-T3 | 03-10 | `specs/archive/trust-redesign-v2.1.md` |
| スナップショット通知 | 03-09 | — |
| 相関図リニューアル Phase 6v2 + UX改善 | 03-09 | `specs/archive/relmap-redesign-spec-v1.0.md` |
| 施設システム廃止 | 03-09 | `docs/archive/coach-lockerroom-redesign-v1.0.md` §4 |
| Trust/Bond/Rivalry包括リバランス Phase 2-5 | 03-08 | `specs/archive/bond-rivalry-balance-spec-v2.0.md` |
| 人間関係データ基盤 Phase 1〜5 + ライバル称号統合 | 03-07 | `specs/archive/relationship-system-spec-v0.2.md` |
| ライフサイクルリデザイン Phase 4 | 03-07 | — |
| NPC記録データ完全統一 v1.0 | 03-06 | `specs/archive/npc-record-unification-spec-v1.0.md` |
| 信頼度リデザイン v2.1 | 03-06 | `specs/archive/trust-redesign-v2.1.md` |
| AI統一成長モデル v1.0 | 03-06 | `specs/archive/ai-unified-growth-spec-v1.0.md` |
| プロモ改修 v1.0 | 03-06 | `specs/archive/promo-redesign-spec-v1.0.md` |
| 契約更新交渉イベント + 性格属性追加 | 03-05 | `specs/archive/contract-negotiation-event-spec-v2.0.md` |
| セリフ personality×archetype 構造化 | 03-05 | — |
| 個別特性リバランス v1.0 + 反骨心 | 03-05 | — |
| コーチスタイル統一 + マッチ演出 | 03-05 | — |
| 成長バランスリバランス v2 | 03-05 | — |
| デバッグ検証システム（auto-sim） | 03-05 | — |
| PPV GRAND FINAL Step 1-6 | 03-04 | `specs/archive/ppv-grand-final-spec-v2.0.md` |
| フィニッシャー設計 + CLAUDE.md策定 | 03-04 | `specs/finisher-system-spec-v1.0.md` |
| 因縁決着システム + MQボーナス半減 | 03-03 | `specs/archive/rivalry-resolution-spec.md` |
| MQスコア減点制 v2.0 | 03-03 | `specs/archive/mq-deduction-redesign-v2.0.md` |
| ランキング計算刷新 + ロスター枠制限 | 03-03 | — |
| ビッグマッチエンジン Tier 2 | 03-08 | — |
| コーチ+ロッカールーム Phase A〜E | 03-01 | `docs/archive/coach-lockerroom-redesign-v1.0.md` |
| L1 会場システム全面再設計 | 03-02 | — |
| レンタルシステム全面リニューアル | 03-02 | — |
| v2.0 イベントシステム Phase 1-7 | 02-28 | `specs/archive/event-system-spec-v2.md` |
| v2.1 エンディング/ゲームオーバー/BGM | 03-02 | `specs/archive/ending-gameover-spec-v1.0.md` |
| データベースタブ + 選手ポップアップ刷新 | 03-02 | — |
## 2026-07-27 v1.23 天頂戦PPVオープニング混入修正

- 天頂戦の結果確定後に `weekPhase: ppvShow` が残る経路で、通常PPVの `GRAND FINAL` カード紹介が先に開いていた。ロード復帰・週サマリー送り・通常週送りの3経路すべてで、天頂戦リプレイ判定を通常PPV判定より前へ移した。
- レンタル消失はセーブ書き込み側を実コード抽出テストで確認。レンタル選手、`rentals` 契約、レンタル選手を含む `showCard` はすべて保存されており、書き込み側に消失経路はなかった。
- バージョン表記、セーブメタデータ、配布manifestを1.23へ統一。
- 検証: `node test/run-all.js` 115/115 PASS、version consistency PASS。

### 追補: 天頂戦の全試合カード紹介を廃止

- 報告対象は通常PPVへの誤分岐だけでなく、天頂戦自身が共通 `_showBracketCardIntro` を使って表示していた「全身画像左右2列・全試合縦並び」の画面だった。
- 天頂戦は専用導入／会場入りの後、カード紹介を挟まずトーナメント表へ直接進む。共通カード紹介は通常年末PPVなど対象4大会に限定した。
## 2026-07-27 年末表彰式にシーズン大会覇者を追加

- 新人王を復帰。旧セーブ／オフシーズン加入で `careerSeasons` が先に1へ進んだ初年度選手も、今季加入なら候補に救済する。
- 春のタッグリーグ優勝タッグを2名並びで表彰。
- 天頂戦開催年は天頂戦覇者、通常年は PPV GRAND FINAL 最終戦勝者を表彰。
- 個別スライドだけでなく「全受賞者一覧」にも同じ結果を掲載。
- `year-end-event-awards-test.js` を追加し、全122テスト成功。
- 表彰式BGMは最新版 WM-H05（volume 0.40）が本体・商品ZIPとも同一ハッシュであることを確認。同名差し替えによる旧キャッシュを避ける `?mix=20260727` を追加。
