# task-88: 全国統一王座 P1+P2（エンジン基盤+挑戦サイクル）

- 起票: 2026-08-12(Fable) / 設計裁定: 同日Keisuke(全8件確定・提案書に刻印済み)
- 作業場所: `C:\Users\nkmrk\Downloads\wrestle-manager-codex`(ブランチ `codex/agent-workspace`)。mainフォルダは触らない
- 前提: **同ツリーに他タスクのWIPが残っている場合は先にコミットしてから着手**する(未コミット成果の巻き戻し事故防止)
- スコープ外(このタスクでやらない): 返還式・戴冠のセレモニー演出 / 王者バッジの本デザイン / 選手セリフ(Opus起案後の別タスク) / 殿堂pt・年間表彰への組み込み(P4)。**演出は最小限、エンジンと配線を正しく作るのが本タスク**

## 1. 目的

天頂戦の優勝者に授与される業界頂点ベルト「全国統一王座」のエンジン基盤(授与/返還/返上/移動)と、四半期ごとの防衛・挑戦サイクル(AI→プレイヤー/AI間/こちらの番)を実装する。

## 2. 仕様の正(この順に読む。指示書内に仕様を二重記載しない)

1. `docs/unified-championship-proposal-v0.1.md` — **設計の正**(裁定完了版)。§3ライフサイクル/§4サイクル3態/§5裁定8件/§6データ構造と接続ポイント(file:line)/§7不変条件/§9セーブ互換
2. `specs/title-system-spec-v1.0.md` §X — 外部持ち出し/奪還の既存パターン(実装の下敷き)
3. `specs/challenge-request-spec-v0.1.md` — 興行予約への試合挿入の規約(IDのみ保持・fail-open・期限切れ回収)

## 3. 実装項目

### A. データ構造+創設・授与(提案書§6.1)

- `createInitialState` に `unifiedTitle: null` を追加(「既存セーブでは undefined も許容」コメント付き)
- `Engine.ppvTournament.apply()` の最終コミットで優勝者へ授与。初回=創設(新聞は創設文面)、2回目以降=戴冠(前王者と同一人物なら連覇文面)。**tvMode(プレイヤーPPV未解禁)でも授与される**こと
- 授与時: 人気+8(既存 `crownChampion` と同じ逓減機構を流用)、`careerRecord.history` に `{type:'unifiedTitle', result:'won'}` を積む。**既存の団体王座カウント(recordTitleWin等)は加算しない**(殿堂・表彰の既存集計を汚さない。統一王座の表彰系はP4で別設計)

### B. 返還(W47)と不成立年

- 天頂戦年のW47エントリー処理(management.js:17405付近、weekPhaseを奪わない方式)で返還を実施: 王者が現存すれば返還の新聞記事+通知。**データ上の championId クリアは apply() での新王者授与と同時**(返還→不成立の4年空位事故を防ぐ)
- `run()` が `cancelled` を返した年は前王者が保持継続(記事も何も出さなくてよい。稀ケース)
- 天頂戦年のQ4は挑戦サイクルを発生させない

### C. 保持者異動の整合(裁定⑦)

- **引退**: プレイヤー側=`commitRetirements` の `validateChampion` 呼び出し(management.js:6911)の隣 / AI側=`processAIWeek` の `champAlive` 分岐(management.js:10186)と同所で返上→空位(返上記事)
- **移籍・引き抜き**: ベルトごと新所属へ(`unifiedTitle.orgId` を追従更新)。引き抜き処理の `validateChampion` 呼び出し点(management.js:14509)に併設
- **FA化・解雇**: 返上→空位(返上記事・理由は所属喪失)
- **保険**: tickWeek の週次スイープ(`sweepBookedCommon1` の隣、management.js:13132付近)で「championId が全ロスターに現存しなければ静かに空位化」+ `saveDoctor.repairOnLoad` にも同等の修復

### D. 四半期挑戦サイクル(タイマー+抽選)

- tickWeek 内・`ensureInviteMarket`(management.js:12661付近)の隣に periodKey 方式で実装: `challengePeriodKey = ${season}-Q${n}`、不一致なら発火して更新(冪等。週スキップ・リロードに強い)
- **発火は unifiedTitle 非null かつ championId 非null のときのみ**。創設前は判定にも乱数にも一切触れない(I-1)
- 王者が出場不可(負傷 or レンタル中)の四半期は発火記録だけ残してスキップ(持ち越さない)
- **団体の抽選**: 候補=王者所属団体を除く団体(AI保持時はプレイヤー団体も除く——プレイヤーは輪番でのみ挑戦)。`G.rankings` の rank 昇順 idx で **weight = 0.65^idx**(`Engine.rng.weighted`)
- **選手の抽選**: その団体の出場可能選手(負傷/レンタル/乱入除外)のうち **OVR ≥ (団体内最高OVR − 4)** を候補プールにし、OVR降順 idx で **weight = 0.8^idx**

### E. AI→プレイヤー王者への挑戦(B3型予約)

- 新予約フィールド `G._pendingUnifiedIncomingMatch`(**IDのみ保持**・booking形は `_pendingIncomingB3Match` と同型)。次の通常自団体興行のメイン枠に固定
- **`Engine.factions.hasCompetingBooking`(factions.js:3168)にマーカーを追加**(最頻衝突バグの予防)
- CR抽選の排他リスト(relationships.js:3619)に本フィールドを追加
- 注入は `App.executeShow`(app.js:6454付近)と `renderShowPrep`(ui-render.js:3165付近)の**両方**(二重管理になっている——片方だけ直すと画面と実行が食い違う)。同週にB3注入は見送り(B3がCRに譲る既存分岐と同型)
- 挑戦者はゲスト注入(`isB3ChallengeGuest` と同型の一時フラグ。**セーブに残さない**)
- 注入時に王者・挑戦者の有効性を再検証し、無効なら予約解除+toast(fail-open)。期限切れ回収(8週)は `releaseExpiredAwayBooking` と同型+ロード時にも実行
- 統一王座戦は `sanitizeShowCardTitles` の **1興行1タイトル制約に参加**させる(同一興行に団体王座戦と同居しない。既存関数への追加のみ・既存判定の変更禁止)
- 勝敗→防衛(defenses+1・人気+3逓減・防衛記事) or 奪取(AI挑戦者へ移動・移動記事・defenses=0)

### F. AI間の防衛戦

- `processAIB3Challenge`(management.js:11038)と同じ流儀で、四半期の最初の通常興行週に解決。試合シミュレート→防衛 or 移動→新聞記事
- AI保持中の発火ごとに `cyclesSincePlayerTurn` を加算

### G. こちらの番(裁定④: 遠征)

- AI保持中、発火時に `cyclesSincePlayerTurn >= 3` なら AI抽選を行わず**プレイヤーの番**: 通知を出し、挑戦者選択(自団体の出場可能選手のうち **自団体最高OVR−4以内** のみ選択可)→ 相手団体へ遠征して1試合
- 遠征は `_pendingAwayChallengeMatch` + `showTravelScene` の機構を流用した単試合版(`G._pendingUnifiedAwayMatch`)。同週の自興行との選手重複禁止(`_awayChallengeUsedIds` と同型)
- 選択UIは既存モーダルパターンの流用で最小限(新規ビジュアル設計をしない。本デザインはP3)
- 見送り・敗北・四半期末までの未消化はターン失効し、カウンタ0リセット(次の番はまた3回後)
- 奪取成功でベルトがプレイヤー団体へ(戴冠と同じ人気逓減+8)

### H. 新聞記事(文面はこの表が正。Keisukeレビュー中——マージ前に差し替え指示があり得る)

data.js に定数テーブルとして追加。ナレーション規約: 事実記述・格言禁止・「世界」を冠しない。priority は 移動/戴冠=180、防衛/返還/返上=140(aiChampionChange 130 より上、天頂戦結果 330 より下)。

| 種別 | 見出し | 本文 |
|---|---|---|
| 創設(初回) | 全国統一王座が創設 初代王者は{name} | 第{N}回天頂戦の優勝者{name}({org})に、業界の頂点を示す新設のベルト「全国統一王座」が授与された。防衛戦は約3か月ごとに、団体の垣根を越えて行われる。 |
| 戴冠(2回目以降) | {name}、全国統一王座に戴冠 | 第{N}回天頂戦を制した{name}({org})が全国統一王座の新王者となった。 |
| 連覇(保持のまま優勝) | {name}、全国統一王座を連覇 | 王者のままエントリーした{name}({org})が天頂戦を制し、ベルトを手放さなかった。 |
| 防衛 | {champ}が全国統一王座を防衛({n}度目) | 挑戦者{challenger}({challengerOrg})を退け、{n}度目の防衛に成功した。 |
| 移動(奪取) | 全国統一王座が移動 新王者は{winner} | {winnerOrg}の{winner}が{loserOrg}の{loser}を下し、ベルトを奪取した。 |
| 返上(引退) | {name}が全国統一王座を返上 | 引退にともないベルトは返上された。王座は次回の天頂戦まで空位となる。 |
| 返上(所属喪失) | {name}が全国統一王座を返上 | 所属を失ったためベルトは返上された。王座は次回の天頂戦まで空位となる。 |
| 返還(W47) | {name}が全国統一王座を返還 天頂戦へ | 4年間の防衛戦を戦った{name}が、開幕を翌週に控えた天頂戦にベルトを返還した。新たな王者は16名のトーナメントで決まる。 |

### I. 最小UI

- 選手詳細・ロースター行に統一王者の識別(既存👑と別の記章。仮でよい——本デザインはP3。**プレイヤー向け表記に内部変数名を出さない**)
- 興行準備画面の予約枠ラベル「全国統一王座戦」(B3の表示と同型)
- 集客: 統一王座戦の attendBonus **1.25**(団体王座戦1.15より一段上)
- MQ・リング内効果は**既存のタイトル戦プロファイルをそのまま使う**(新しいMQ加算式を作らない)

## 4. 数値目標と不変条件(対。マージ前にFableが1つずつ検算する)

| 目標 | 不変条件 |
|---|---|
| 天頂戦優勝者への授与 | **I-1**: 創設前(unifiedTitle が null)の期間は乱数消費・状態変更ゼロ。**実装前後で `node test/auto-sim.js 3 42` の出力が完全一致**(3季=初回天頂戦前。実装前にmain HEADで出力を保存して突き合わせる) |
| 四半期に1回の挑戦 | **I-2**: 1四半期最大1回・天頂戦年Q4は0回。CR/B3の既存発生条件・確率は無変更(排他リストへのフィールド追加のみ) |
| 挑戦者の格 | **I-3**: 挑戦者は常に「所属団体の最高OVR−4以内・負傷/レンタル/乱入除外」を満たす(生成箇所にassert+テスト) |
| ベルトは選手個人に付く | **I-4**: championId 非null ⇒ 当該選手が全ロスターのどこかに現存し引退済みでない。orgId は現所属と常時一致。`validateGameState` に検査を追加(見本: bookedCommon1、management.js:25224)し、100季auto-simで違反0 |
| 予約試合として興行に挿入 | **I-5**: 統一王座戦の予約は CR/B3/F09/Common-1/奪還と同一興行に同居しない(`hasCompetingBooking` 経由。テストで担保)。ゲスト選手はセーブに残らない(challenge-guest-save-sanitize-test.js の方式) |
| 団体王座より一段大きい扱い | **I-6**: MQ計算は既存タイトル戦経路の再利用のみ。統一王座戦以外の試合の結果・MQに影響する式変更を行わない |
| 防衛数の管理 | **I-7**: 移動・返上・再戴冠で defenses は必ず0リセット |
| セーブ互換 | **I-8**: 旧セーブ(unifiedTitle undefined)がエラーなくロードでき、次の天頂戦から自然に創設される。lazy-init のみ・`_migrated_*` フラグ不使用(title-system-spec §X の規約) |

## 5. 触ってよい / 触ってはいけないファイル

- **可**: src/management.js / src/data.js(設定+新聞テーブル追加) / src/app.js / src/ui-render.js / src/ui-common.js / src/relationships.js(3619の排他リスト追加のみ) / src/factions.js(hasCompetingBooking追加のみ) / test/(新規+既存の追随)
- **不可**: src/match-engine.js / src/battle-engine.html / src/victory-lines.js / 既存の団体王座(titles.world)のロジック変更(sanitizeShowCardTitles・validateChampion への**追加**は可、既存判定の変更は不可) / release/manifest.json(**新規srcファイルを作らないこと**——全て既存ファイルへ追加する)

## 6. 検証手順(すべてフォアグラウンド。run_in_background禁止)

1. 実装**前**に main HEAD で `node test/auto-sim.js 3 42` の出力を保存(I-1の比較基準)
2. 実装後: `node --check` 対象ファイル全部(フックも走るが自分でも)
3. `npm test` 全PASS(既存テストの回帰0)
4. 新規 `test/unified-title-test.js`: 授与(初回/連覇/tvMode)/W47返還と不成立年の保持継続/引退・FA・解雇の返上/移籍のベルト追従/四半期上限とQ4スキップ/資格ルール/予約排他/こちらの番の輪番(3回後発火・失効リセット)/セーブ互換(undefined→null)
5. `node test/auto-sim.js 3 42` → 手順1の保存出力と**完全一致**(I-1)
6. `node test/auto-sim.js 20 42` → エラー・不変条件違反0
7. 分布計測(較正用・1本のみ): `node test/auto-sim.js 100 7919` → 違反0に加え、**創設回数/移動回数/防衛成功率/こちらの番の発生・消化数/返上回数を集計して報告に含める**(較正判断はFableが行う。シード追加実行は不要)

## 7. 完了条件

- `codex/agent-workspace` に P1(A〜C+H+I)/P2(D〜G)の2コミット(コミットメッセージは日本語・種別プレフィックス)
- 報告に: 触ったファイルと行数規模 / 不変条件I-1〜I-8の自己申告(FableがマージRV前に再検算する) / 手順7の分布計測値
- specs昇格・演出(P3)・表彰(P4)はマージ後に別タスク
