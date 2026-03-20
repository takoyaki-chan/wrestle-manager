# Wrestle Manager ロードマップ

> 最終更新: 2026-03-20（黒田幸子レポーターシステム + 新聞タブ豪華化 + 団体比較リニューアル）
> セッション履歴: `docs/archive/session-history.md`
> 完了済みタスク: `docs/archive/completed-tasks.md`
> 設計決定ログ: `docs/design-decisions.md`

---

## 現在の状態

**統一修正パッチ v1.0 全完了（2026-03-20）。** 4項目: (1)黒田上半身画像廃止→顔アイコン(28px丸)統一、(2)デフォルト比較対象をランキング上位団体に自動切替、(3)黒田テキスト全文体を記事調(〜だ/〜である)に統一変換(KURODA_HEADLINES/EDITORIAL/WAR_RECORD/MATCHUP_FLAVOR/SHOW_RATING/PREVIEW/SPOTLIGHT)、(4)新聞システムv2(Engine.newspaper.generate+weeklyNewspaper+AIイベント蓄積+優先度ベーストップ記事選定+レガシー互換)。変更ファイル: engine.js, ui-render.js, kuroda-text.js, index.html。auto-sim 100シーズン ALL CLEAR。

### 直近の完了セッション

| 日付 | 内容 |
|------|------|
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

## 次の実装予定

### Trust Phase T4: 単発ガツン系イベント（未着手）

bond/rivalryシステムと連携する劇的イベント群。実装順推奨: S_humiliation → S_scandal → S_fanrevolt → S_powerstruggle → S_betrayal

| ID | 名称 | 発火条件 | 主効果 | 重さ |
|----|------|----------|--------|:----:|
| S_scandal | スキャンダル発覚 | pop40+ & trust60+、年1-2回 | trust-12〜-18、orgPop-1〜-3。3択 | 中 |
| S_powerstruggle | 派閥抗争 | roster12+ & trust70+が3人以上 | trust-6〜-10。3択 | 大 |
| S_humiliation | 大一番の惨敗 | タイトル/PPVでMQ35以下（自動発火） | trust-8〜-12。3択 | 中 |
| S_betrayal | 裏切り退団 | trust20-35 & 対抗戦敗北（低確率） | 即退団、全員trust-3〜-5 | 中 |
| S_fanrevolt | ファン離反 | 3興行連続平均MQ50未満 | 全選手trust-3〜-5、orgPop-2〜-4。3択 | 中 |

### 統一トーナメント（未着手）

ランキング・ロスター・団体間対戦リデザイン Phase 4。

- Engine.tournament新規実装、第24週開催、8名シングルエリミネーション、代表選手選択UI
- BATTLE_POINT_CFG: tournament:{champion:20, runnerUp:8, semiFinal:0, firstRound:-14}

### フィニッシャーシステム（未着手、設計完了）

設計書: `specs/finisher-system-spec-v1.0.md`。SE素材＋初期キャラリスト待ち。

| Step | タスク | 重さ |
|------|--------|:----:|
| 1 | data.jsにfinisherフィールド追加（初期10〜20キャラ） | 小 |
| 2 | simulateMatch内フィニッシャー発動判定＋メタデータ付与 | 中 |
| 3 | battle-engine.htmlにカットイン演出＋SE | 中〜大 |
| 4 | 試合結果テキスト・ログに技名差し込み | 小 |
| 5 | テストプレイで発動確率・演出微調整 | 小 |

### 団体画面ブラッシュアップ + クリームテーマ展開（設計確定、未着手）

設計書: `tasks/roster-redesign-plan.md`、Mockup: `archive/prototype/roster-detail-redesign-v9.html`

所属選手の詳細パネルをウイニングポスト風に全面リデザイン。G1クリームテーマを本拠地系画面に展開。道場バナーは変更なし。
承認済み: 信頼・やる気は載せない、開発率はそのまま、growthLog無制限（引退時削除）、G1クリームカラー。
body背景: `#24221e`（セピアグレー）に全画面統一。ダークパネル: `#181614`/`#12110e`（ダークウォーム、旧ネイビーから暖色化）。パネル内でクリーム/ダークを分ける。
クリーム対象: 団体/スタッフ募集/スカウト/ランキング/DB/収支（グラフは黒維持）。ダーク維持: 今週/興行準備/ログ/セーブ/ヘルプ。

| Phase | タスク | 重さ |
|-------|--------|:----:|
| 1 | `growthLog` データ構造追加 + advanceWeek()内に記録ロジック + マイグレーション + 引退時削除 | 中 |
| 2 | body背景 `#24221e` 統一 + ダークパネル `#181614` 暖色化 + G1クリームCSS + 選手アイコン角丸四角化 | 小 |
| 3 | 詳細パネル描画: 左カラムfull画像 + 右カラム3タブ（能力/成長経過/育成） | 大 |
| 4 | クリームテーマ他画面適用: スタッフ募集/スカウト/ランキング/DB/収支（グラフは黒維持） | 中 |
| 5 | 検証: auto-sim 100シーズン + 全画面文字視認性 + モバイル確認 | 小 |

### 拡張候補

| 項目 | 優先度 | 備考 |
|---|---|---|
| フィニッシャー（キャラ固有必殺技） | 高 | 設計完了。SE素材＋初期キャラリスト待ち |
| ライバルストーリー自動生成 | 高 | 未設計 |
| ストーリーアーク（数ヶ月にわたる抗争管理） | 高 | 未設計 |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | ライト案: シングル2試合合算方式 |
| 敵AI団体専用キャラクター | 中 | 固有キャラで世界観を深める |
| マネージャー的存在（説明キャラ） | 中 | チュートリアル・イベントの語り手 |
| マインド依存の成長イベント | 中 | mnの存在感を強化 |

---

## 実装済みシステム一覧

> 詳細は `docs/design-decisions.md` と `docs/archive/session-history.md` を参照。

| システム | 実装日 | 設計書 |
|---------|--------|--------|
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

---

## コードベース構成

| ファイル | 行数 | 役割 |
|---------|-----:|------|
| index.html | ~2,590 | HTML+CSS+起動処理 |
| data.js | ~13,820 | 全データ定数（キャラ98名・コーチ35名・技160種） |
| engine.js | ~14,630 | ゲームロジック全体 |
| app.js | ~6,450 | Audio+Storage+Mission+App統合 |
| ui-common.js | ~6,400 | ヘルパー+ポップアップ+各種UI+レーダーチャート |
| ui-render.js | ~5,910 | 全render関数+データベースタブ+相関図v2 |
| kuroda-text.js | ~780 | 黒田幸子レポーターテキスト定数 |
| victory-lines.js | ~830 | 勝利台詞データ |
| battle-engine.html | ~2,620 | ビジュアル観戦モード（iframe） |
| **合計** | **~54,030** | |

その他: `portrait-map.js`（ルート）、選手顔画像107枚＋表彰式フレーム7枚（`image/`）、コーチ肖像画35枚（`image/coach/`）、NPC画像（`image/npc/`）、build-zip.sh

---

## アーキテクチャ5原則

1. Engine = 純粋関数（DOM禁止）
2. GameState戻り値更新（in-place変更禁止）
3. UIはG直接変更禁止（App経由のみ）
4. 乱数はseed管理で再現可能
5. tickWeek統合パイプライン

---

## 設計書インデックス

### docs/（永続ドキュメント）

| ドキュメント | ファイル |
|---|---|
| ロードマップ（本ファイル） | game-system-roadmap.md |
| ゲームの魂・開発ルール | CLAUDE.md（リポジトリルート） |
| 設計決定ログ | design-decisions.md |
| マスタースペック（現行仕様） | master-spec.md |
| 世界観設定 | world-setting.md |
| 勝利演出+PPVマッチカード+リファクタ 実装指示書 | victory-ppv-implementation-guide.md |

### specs/（現行リファレンス仕様書）

| ドキュメント | ファイル |
|---|---|
| バトルエンジン | battle-engine-spec-v4.1b.md |
| キャラクターデータ（98名） | character-data-spec-v1.4.md |
| フィニッシャーシステム（**未実装**） | finisher-system-spec-v1.0.md |
| ライバル団体AI | rival-org-spec-v1.0.md |
| スカウト | scout-system-spec-v1.0.md |
| タイトル/ベルト | title-system-spec-v1.0.md |
| 週間ゲームループ | weekly-gameloop-spec-v1_0.md |
| 技テーブル（160技） | 技テーブル_全160技_v3_5.md |

### archive/（過去資料）

| ディレクトリ | 内容 |
|---|---|
| docs/archive/ | セッション履歴・完了タスク・旧設計書・分析レポート |
| specs/archive/ | 実装完了済み仕様書・旧バージョン（80+ファイル） |
| archive/prototype/ | HTMLプロトタイプ・UIモックアップ（15ファイル。victory-popup-prototype.html, ppv-matchcard-prototype.html, ppv-progression-prototype.html 追加） |
| archive/scripts/ | セリフ変換スクリプト群 |
| archive/exports/ | Notion/セリフエクスポートデータ |
| archive/tasks/ | 旧タスクメモ |

---

## メモ

- build-zip.shは要確認: `image/award-frame-*.png`（7枚）と `portrait-map.js` が未包含の可能性あり
- README.mdの「120名以上のキャラクター」は固有キャラ98名＋スカウト生成＋コーチ35名の合算
- 会場ロック判定は `Math.round(G.orgPop)` で比較すること（内部小数化対応）
- **立ち絵画像**: stand(256×384 webp) / full(512×768 RGBA webp) / upper(256×384 RGBA webp) / face(256×256 png)。バトル中はstand、対戦カード/PPV/練習詳細ではfull、カットインではupper
