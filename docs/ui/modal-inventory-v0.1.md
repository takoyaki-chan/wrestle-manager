# モーダル・ポップアップ インベントリ v0.1

**目的**: 現状のモーダル/オーバーレイ類を網羅的に列挙し、統一デザインに向けた分類・方針検討の土台にする。
**参考デザイン**: `docs/ui/mockups/faction-events.html`（派閥イベント F01-F08 モックアップ）

---

## 分類の前提（提案）

| 記号 | 区分 | 用途 | 参考テンプレート |
|---|---|---|---|
| **A** | 重大決定・報告（社長室系） | 重要な選択を迫る／重要な報告を受ける | 派閥F01・F04型（クリームパネル＋リポーター帯＋決定トレイ） |
| **B** | 演出・ステージ系 | 主役をフィーチャーする瞬間 | 派閥F02・F03型（暗いステージ＋主役ポートレート） |
| **C** | 情報表示パネル | 詳細閲覧・比較 | クリームカード軽量版（F01の情報部分のみ抜き出し） |
| **D** | 軽量通知・確認 | 短い情報・確認・選択 | ミニダイアログ（新規テンプレート） |
| **E** | 全画面シーン | 独立演出として成立している画面 | 統一対象外（個別に意匠を維持） |

---

## 1. 静的オーバーレイコンテナ（`src/index.html` 定義）

| # | ID | CSSクラス | 用途 | 呼び出し元関数 | 現状デザイン | 分類案 | メモ |
|---|---|---|---|---|---|---|---|
| 1 | `showResultOverlay` | `.show-result-box` | 汎用結果枠（試合プレビュー／試合結果／契約交渉／ロスター超過／Jr.トーナメント） | 20以上の関数で使い回し | `--panel-bg` / border gold 0.3 / radius 8px / alignItemsTop | **分解が必要**（用途別にA・B・Dに振り分け） | 最大の問題児。1つの枠に用途が集まりすぎ |
| 2 | `ppvMatchCardOverlay` | `.ppvmc-overlay` | PPVマッチカード紹介画面 | `renderPPVMatchCard` 系 | 暗背景 #0a0a14 / 全画面 / z:5000 | **B** | PPV専用の演出画面 |
| 3 | `battleOverlay` | (iframe) | 試合本体（battle-engine.html） | `App.startBattle` | 完全別iframe | **E** | 統一対象外 |
| 4 | `confirmOverlay` | `.confirm-box` | 汎用確認ダイアログ（はい／いいえ） | 全域で使用 | `--panel-bg` / border gold 0.3 / radius 8px / max 400px | **D** | 基本はそのまま、デザイントークンだけ揃える |
| 5 | `coachTooltipOverlay` | `.coach-tooltip-box` | コーチ情報ツールチップ | `showCoachTooltip` | `--panel-bg` / border gold 0.3 / radius 10px / max 520px | **C** | 実質ツールチップだが、全画面オーバーレイ型 |
| 6 | `fighterPopupOverlay` | `.fighter-popup-box` | 選手詳細ポップアップ | `showFighterPopup` | #181614 / border 200,190,170,0.12 / radius 10px / max 640px | **C** | 使用頻度が最も高い情報パネル |
| 7 | `eventPopupOverlay` | `.event-popup` | 汎用イベントポップアップ（positive/negative/gold） | `showEventPopup` | `--panel-bg` / radius 12px / max 450px / 顔写真マイナスマージン | **要分割** | 選択肢付きなら**A**、コメント表示のみなら**C**/**D** |
| 8 | `rivalryPopupOverlay` | `.rivalry-popup` | 因縁宣戦布告／決着演出 | `showRivalryPopups` | 暗いグラデ 12,8,20→22,16,34 / fate=赤グロー / resolution=ゴールドグロー | **B** | 既に演出志向。F02/F03 のステージ型に寄せられる |
| 9 | `retirementPopupOverlay` | `.retirement-popup` | 引退告知／引退勧告結果（兼用） | `showRetirementPopups` / `showRetireAdviseResultPopup` | `--panel-bg` / radius 14px / max 380px | **B** | 現状2用途の兼用。分離して両方とも B に |
| 10 | `newspaperOverlay` | `.newspaper-box` | 週末の業界ニュース紙面 | `showNewspaperPanel` | クリーム紙 #f5ecd7→#ede2c6 / 新聞紙風意匠 | **E** | 新聞というメタファーが強く、統一テンプレに吸収は困難 |
| 11 | `awardsOverlay` + `aw-fanfare-overlay` | `.awards-overlay` / `#stage` / `#aw-ceremony` | 年間表彰式 | `App.showAwardsCeremony` | ステージ演出（スポットライト／カーテン／スライド切替） | **E** | 独立演出として完成度が高い。B共通テンプレに寄せるより独立維持 |
| 12 | `milestoneOverlay` | `.milestone-box` | マイルストーンイベント（初戴冠／初防衛等） | `showMilestone` | `--bg-card` / border gold 2px / radius 12px | **B** | ステージ型にアップグレード可 |
| 13 | `growthEventOverlay` | `.growth-event-box` | 成長イベント演出 | `showGrowthEventPopups` | `--panel-bg` / radius 14px / max 420px | **B** | 主役をフィーチャーする演出 |
| 14 | `careModalOverlay` | `.care-modal-box` | ケアリアクションモーダル | ケア行動系 | `--panel-bg` / radius 14px / max 440px | **D** | 選手ひとりのリアクション、軽め |
| 15 | `notifModalOverlay` | `.notif-modal-box` | 通知イベント／Glimpse（覗き見）／試合後対話 | `showPostMatchDialogues` / `showGlimpseA/BModal` 等 | `--panel-bg` / radius 14px / max 440px | **D** | 日常の小さな瞬間を伝える枠 |
| 16 | `careOverlay` | `.care-box` | ケアアクション／選択イベント／大型イベント（多目的） | `showChoiceEventModal` / `showLargeEventModal` 等 | `--bg-card` / border `--border` / radius 10px | **要分割** | 選択イベントは**A**、ケアアクションは**D** |
| 17 | `shachoshitsuDecisionOverlay` | `.shachoshitsu-decision-modal` | 社長室決裁（対象選択→確認→結果） | `showDecisionTarget/Confirm/ResultModal` | 8,6,4,0.82 暗背景 / max 560px | **A** | 社長室系の本丸。F01派生テンプレを適用しやすい |
| 18 | `seasonFanfareOverlay` | `.season-fanfare-box` | シーズン切り替わりファンファーレ | `App.showSeasonFanfare` | 中央大文字演出 | **E** or **B** | 短い遷移演出。独立維持でも可 |
| 19 | `gameoverOverlay` | `.gameover-box` | ゲームオーバー | `App.showGameover` | #0a0a0f / radius 14px / max 440px | **E** | 独立エンディング画面 |
| 20 | `creditsOverlay` | `.credits-box` | クレジット | `App.showCredits` | `--panel-bg` / radius 14px / max 400px | **E** | 独立エンディング画面 |

---

## 2. 動的挿入オーバーレイ（`document.createElement` 等で生成）

| # | クラス名 | 用途 | 呼び出し元 | 現状デザイン | 分類案 | メモ |
|---|---|---|---|---|---|---|
| 21 | `.r3-modal-overlay` / `.r3-modal` | 引退時の他選手リアクション（離脱連鎖） | `showR3Modal` | #1a1a2e / radius 8px / 中央 | **B** | 演出色が強い。ステージ型へ |
| 22 | `.war-victory-overlay` / `.war-victory-modal` | 団体戦勝利／Jr.トーナメント勝利 | `showWarVictory`（2箇所） | グラデ #1a1a2e→#16213e / radius 12px | **B** | 勝利演出 |
| 23 | `.opening-overlay` | オープニング演出 | オープニングシーケンス | 暗いラジアルグラデ | **E** | 独立シーケンス |
| 24 | `.completion-overlay` | 完走（エンディング） | `App.showCompletion` | 独立レイアウト | **E** | 独立シーケンス |
| 25 | `.rm-popup-overlay` / `.rm-popup-card` | リレーションマップ内の比較ポップアップ | `_relmapShowComparePopup` | 暗背景0.7 / backdrop-filter blur | **C** | 比較情報を淡く表示 |
| 26 | `.db-hof-detail-overlay` / `.db-hof-detail-modal` | HoF（殿堂入り）詳細 | `showHofDetail` | `--bg-card` / radius 12px / max 500px | **C** | 情報詳細 |
| 27 | `#scoutCompModal` | スカウト競合発生 | `renderScoutCompetitionModal` | `--bg-panel` / radius 12px / max 360px / インラインスタイル | **A** or **D** | 決定を迫る短いモーダル |
| 28 | `.faction-event-modal` / `.fevt-overlay-office` / `.fevt-overlay-stage` | 派閥イベント F01-F08 | `showFactionF01-F08Modal` 系 14関数 | **参照元デザイン** | **A**(F01/F04) / **B**(F02/F03他) | これが統一の基準 |

---

## 3. 動的モーダル関数 → オーバーレイ使用マップ

`showResultOverlay` の使い回しを整理する。これを分解するのが統一の第一歩。

### 3-1. `showResultOverlay` を使う関数群（20+）

| 関数 | 用途 | 分類案 | 差し替え先テンプレート |
|---|---|---|---|
| `renderMatchPreview` | 通常試合プレビュー（対戦カード紹介） | **B** | ステージ型（対峙画面） |
| `renderShowResult` | 通常ショー結果 | **B** | ステージ型（結果） |
| `renderPPVMatchPreview` | PPV試合プレビュー | **B** | ステージ型（大規模版） |
| `renderPPVResult` | PPV結果 | **B** | ステージ型（大規模版） |
| `renderPPVTVResult` | PPV（TV版）結果 | **B** | ステージ型（大規模版） |
| `_renderB2MatchPreview` / `_renderB2MatchResult` | 団体戦B2プレビュー／結果 | **B** | ステージ型 |
| `_renderB3MatchPreview` / `_renderB3MatchResult` / `_buildB3Step3` | 団体戦B3プレビュー／結果／Step3 | **B** | ステージ型 |
| `renderWarFinalResult` | 団体戦決着 | **B** | ステージ型（大規模版） |
| `renderJuniorTournamentSummon` | Jr.トーナメント招集 | **A** | 社長室報告型 |
| `renderJuniorTournamentBracket` | Jr.トーナメントブラケット表示 | **C** | 情報パネル型 |
| `renderJuniorTournamentMatchResult` | Jr.トーナメント試合結果 | **B** | ステージ型（小規模版） |
| `renderJuniorTournamentResult` | Jr.トーナメント総合結果 | **B** | ステージ型 |
| `showNegotiatePopup` / `confirmNegotiation` / `showNegotiationResult` / `showSigningCeremony` | ドラフト交渉（旧UI？） | **A** | 社長室決定型 |
| `showRosterOverflowSigningModal` / `confirmRosterOverflowSigning` | ロスター超過時の契約確認 | **A** | 社長室決定型 |

**備考**: ドラフト交渉は `specs/draft-negotiation-spec-v1.0.md` 準拠の新システムが実装済み（コミット `2a858e1`）。UI がどこに出ているか要確認。

### 3-2. `careOverlay` を使う関数群

| 関数 | 用途 | 分類案 | 差し替え先テンプレート |
|---|---|---|---|
| `showChoiceEventModal` | 選択肢付きイベント | **A** | 社長室決定型（決定トレイ） |
| `showLargeEventModal` | 大型イベント（選択肢付き） | **A** | 社長室決定型 |
| ケアアクション系 | 練習相手の選択等 | **D** | 軽量選択型 |

### 3-3. `notifModalOverlay` を使う関数群

| 関数 | 用途 | 分類案 | 差し替え先テンプレート |
|---|---|---|---|
| `showPostMatchDialogues` | 試合後対話 | **D** | 軽量通知型 |
| `showGlimpseAModal` / `showGlimpseBModal` | 覗き見イベント（A/B 2種） | **D** | 軽量通知型 |
| 通知イベント | バッジイベント等 | **D** | 軽量通知型 |

### 3-4. `shachoshitsuDecisionOverlay` を使う関数群

| 関数 | 用途 | 分類案 | 差し替え先テンプレート |
|---|---|---|---|
| `showDecisionTargetModal` | 決裁の対象選手選択 | **A** | 社長室決定型 |
| `showDecisionConfirmModal` | 決裁の最終確認 | **A** | 社長室決定型（確認フェーズ） |
| `showDecisionResultModal` | 決裁の結果表示 | **A** | 社長室報告型 |

### 3-5. 契約交渉系（`shachoshitsuContent` 経由 = 社長室画面内に描画）

| 関数 | 用途 | 分類案 | メモ |
|---|---|---|---|
| `showContractSummaryModal` | 交渉サマリー | **A** | 社長室「画面内」ではなくモーダルなら A |
| `showContractNegotiationModal` | 各交渉ステップ | **A** | 社長室画面の一部として描画されている |
| `showContractReactionModal` | 相手のリアクション | **A** | 同上 |
| `showContractListenModal` | じっくり聞く | **A** | 同上 |
| `showContractSuddenDepartureModal` | 突発離脱 | **B** | ショッキングな演出が欲しい |
| `showContractResultModal` | 交渉結果 | **A** | 同上 |

**要確認**: 社長室画面（`shachoshitsu*`）内に描画される要素は「モーダル」と呼ぶのか？ 画面自体がシーン。ここはユーザー判断。

### 3-6. 派閥イベント系（既に統一デザイン適用済み）

| 関数 | 用途 | 分類（確定） |
|---|---|---|
| `showFactionF01Modal` | 派閥結成の判断 | **A**（社長室型） |
| `showFactionF02Modal` + Ignite/Peace/Resolution/Endless | 派閥抗争発生とその後 | **B**（ステージ型） |
| `showFactionF03Modal` / `showFactionHiatusModal` | 派閥休止 | **B**（ステージ型） |
| `showFactionF04Modal` | 脱退判断 | **A**（社長室型） |
| `showFactionF05Modal` / F06 / F07 / F08 | その他派閥イベント | （F05-F08 は rework モックアップに準拠） |

---

## 4. トースト／ツールチップ（モーダルではない＝対象外）

| ID / クラス | 用途 |
|---|---|
| `toastEl` | 汎用トースト |
| `notifEventToast` | 通知型イベントトースト |
| `customTooltip` | ホバーツールチップ |

---

## 5. 分類別集計（まとめ）

### 【A】重大決定・報告系 → F01/F04型（クリームパネル）

- `showResultOverlay` のうち: `renderJuniorTournamentSummon` / ドラフト交渉（旧）／ ロスター超過
- `shachoshitsuDecisionOverlay` 系 3関数
- `careOverlay` のうち: 選択イベント・大型イベント
- `#scoutCompModal`
- `eventPopupOverlay` のうち: 選択肢付きイベント
- 契約交渉系 5関数（画面内描画の扱い要確認）
- 派閥 F01 / F04 （参照デザイン）

**合計: 約 12〜15 画面**

### 【B】演出・ステージ系 → F02/F03型（暗ステージ）

- `showResultOverlay` のうち: 試合プレビュー／試合結果 全種（通常／PPV／PPV-TV／B2／B3／団体戦決着／Jr.トーナメント結果）
- `ppvMatchCardOverlay`
- `rivalryPopupOverlay`（fate/resolution）
- `retirementPopupOverlay`（引退告知・引退勧告結果）
- `milestoneOverlay`
- `growthEventOverlay`
- `.r3-modal-overlay`
- `.war-victory-overlay`
- 派閥 F02 / F03（参照デザイン）
- 契約交渉の突発離脱

**合計: 約 15〜20 画面**

### 【C】情報表示パネル → クリームカード軽量版

- `fighterPopupOverlay`
- `coachTooltipOverlay`
- `eventPopupOverlay` のうち: コメント表示のみ
- `.db-hof-detail-overlay`
- `.rm-popup-overlay`
- `renderJuniorTournamentBracket`

**合計: 約 6 画面**

### 【D】軽量通知・確認 → ミニダイアログ（新規）

- `confirmOverlay`
- `notifModalOverlay` 系（Glimpse A/B、試合後対話、通知イベント）
- `careModalOverlay`
- `careOverlay` のうち: ケアアクション

**合計: 約 6〜8 画面**

### 【E】全画面シーン（統一対象外、個別維持）

- `battleOverlay`
- `newspaperOverlay`
- `awardsOverlay`
- `gameoverOverlay`
- `creditsOverlay`
- `.opening-overlay`
- `.completion-overlay`
- `seasonFanfareOverlay`（短い遷移のみ）

**合計: 約 8 画面**

---

## 6. 要議論項目（ユーザー判断が必要）

1. **`eventPopupOverlay` の分割**: 選択肢付き（A）と表示のみ（C/D）で用途が違う。現状は1コンテナ。分離する／しない？
2. **`careOverlay` の分割**: 選択イベント（A）とケアアクション（D）で用途が違う。分離する／しない？
3. **`retirementPopupOverlay` の分離**: 引退告知と引退勧告結果の兼用。別テンプレにする？
4. **契約交渉系（`shachoshitsuContent` 内描画）の扱い**: これは「社長室画面」のコンテンツであってモーダルではない。このインベントリの対象外にする？ それともモーダル化する？
5. **`newspaperOverlay` の扱い**: 新聞紙というメタファーは統一テンプレに馴染みにくい。E（独立維持）で確定で良い？
6. **`awardsOverlay` の扱い**: 既に完成度の高い独立演出。E で確定で良い？
7. **`seasonFanfareOverlay`**: 短い遷移なので E にするか、B の小型版にするか。
8. **Jr.トーナメント画面の扱い**: 実質的に「シーン」として画面遷移しているので、個別モーダルというより連続シーン。モックアップでは A / B / C に切り分けるが、実装的には統合画面として作り直すべきかも（設計判断必要）。
9. **`showResultOverlay` 自体の扱い**: 用途別に分解していくと、この汎用枠は空になる。削除するか、最後のフォールバック枠として残すか。
10. **ドラフト交渉UIの実体**: コミット `2a858e1` で実装完了とのことだが、ソース上は旧 `showNegotiatePopup` 等も残っている。新UIの実装箇所と旧関数の生存状態を確認する必要あり。

---

## 7. 次のステップ

1. 本インベントリを元に、上記「要議論項目」をユーザーと確認
2. 分類を確定
3. フェーズ3: 統一モックアップ HTML の作成（`docs/ui/mockups/modal-unified-v0.1.html`）
   - 派閥イベントモックアップと同形式（上部 dev-switcher で切替）
   - A / B / C / D の4テンプレート＋主要バリエーション
4. フェーズ4: 差し替え優先順位付け・タスクファイル化
