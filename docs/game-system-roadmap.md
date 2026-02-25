# 🎮 Wrestle Manager ロードマップ

> 最終更新: 2026-02-25（セッション22 — バグ修正バッチ）
> 旧ロードマップ（v0.1〜v0.99c開発記録）はアーカイブ済み

---

## 現在の状態

**セッション22: バグ修正バッチ完了。** Bug②（タイトルマッチ12週クールダウンが無効化される）を根本修正（autoFillCard/App.executeShow/toggleTitle/ui-render.jsの4箇所）。Bug③（表彰式ポップアップで選手画像が枠に収まらない）を awards-box CSS修正（padding拡大・aspect-ratio・max-height・overflow-y追加）。

---

## コードベース構成

| ファイル | 行数 | 役割 |
|---------|-----:|------|
| index.html | ~1,110 | HTML+CSS+起動処理（タイトル/団体設立/ヘルプ/PPV/引退/表彰式/成長イベント/toast/fanfare/ティッカー/新聞パネルオーバーレイ） |
| data.js | ~1,370 | 全データ定数（キャラ98名・コーチ8名・ROSTER_CFG・CHAR_GROUP・技160種・引退セリフ・表彰式セリフ・PPVデータ・成長イベントセリフ・ニューステンプレート） |
| engine.js | ~4,860 | ゲームロジック全体（Engine＋milestone＋career＋retirement＋growth＋intrusion＋flavor＋awards＋ppv＋growthEvents＋news） |
| app.js | ~3,090 | Audio+Storage+Mission+Survival+App統合+対抗戦観戦+タイトル画面+PPV開催+マイグレーション+成長イベントフック+_maybeShowSeasonFanfare+ニュースフック |
| ui-common.js | ~2,440 | ヘルパー+ポップアップ+対抗戦演出+交渉UI+引退ポップアップ+表彰式UI+PPVエントリーUI+成長イベントUI+showToast+showSeasonFanfare+showNewspaperPanel |
| ui-render.js | ~2,110 | 全render関数+refreshAll+PPV情報表示+🔥/📉/😞バッジ+ロスターソート+月次収支ウィジェット+ニュースティッカー |
| victory-lines.js | 501 | 勝利台詞データ |
| battle-engine.html | 1,734 | ビジュアル観戦モード（iframe） |
| **合計** | **~17,215** | |

その他: portrait-map.js（102行・ルート）、顔画像107枚＋表彰式フレーム7枚（image/）、build-zip.sh

---

## 設計決定ログ（実装済みルール集）

- **ロスターランダム化** — potTotal重み付き配分。S級≥690, A級≥640。シリーズボーナス+0.3。dormant動的計算
- **チャンピオン集客ボーナス** — チャンピオン出場時に集客×1.10
- **乱入マッチ** — チャンピオン3回防衛後、タイトルマッチ当日に20%で発生。隣接団体OVR90%以上の選手が乱入。勝利+2/敗北-15〜-20
- **フレーバーイベント** — チャンピオン or 人気55以上に12%/週。雑誌取材（人気+2〜3）・TV出演（ヒート+2〜3）
- **殿堂入り条件** — 獲得＋防衛合計13回以上、またはグランドスラム
- **衰退・引退はdurability + wear方式** — 年齢ベースの旧テーブルを全廃。durability（正規分布μ=0,σ=2）で個人差。wearは28+durability歳から蓄積。wear 20〜39で軽度衰退、40〜59で本格衰退（引退20%/年）、60〜79で末期（50%/年）、80+で確定引退
- **壊滅的怪我（career-ending injury）** — 重傷時に追加判定。基本2〜3%、ベテラン(wear40+)は5〜8%。年齢・wear問わず即引退。数シーズンに1回程度の稀少イベント
- **怪我引退（wear超過型）** — 重傷発生時にwear+怪我ボーナスが80超で引退確定。ベテランほど起きやすい
- **引退演出** — 全選手共通ポップアップ（顔画像＋経歴＋セリフ）。ボタン「送り出す」/「……」。セリフは引退ルート×キャリア×性格で8カテゴリ分岐（各3パターン＝計24本）
- **PPVは全団体合同大会** — エントリー制（Week44締切）、対戦相手は当日まで不明、枠数はランク依存（S=5,A=4,B=3,4位=2）、エントリー後の怪我は不戦敗
- **PPVマッチメイクは盛り上がり優先** — 因縁最優先、次に盛り上がりスコア（OVR合計+人気-OVR差）
- **PPVに特別なシステム効果なし** — 人気・ヒート変動は通常興行と同じ。体験そのものがご褒美
- **年末表彰式** — 新人王（全団体1年目OVR最高）、ベストマッチ（各団体1試合ずつ計4試合から最高MQ）、MVP（各団体エース1名ずつ計4名からスコア最高）、チャンピオン紹介、殿堂入り
- **MVP/ベストマッチは各団体1枠** — S-tierの数の暴力を防ぐため
- **集客計算は加算方式** — heat/title/champ/charismaのボーナスを加算し上限2.0倍キャップ。旧掛け算スタック（最大2.66倍）を廃止
- **人気の自然減衰** — 毎週-0.5（人気10超の全選手）。試合やプロモで補わないと人気が落ちる
- **orgPop年次減衰** — シーズン末に-3。維持にはランキング上位を保つ必要がある
- **FA年齢保存方式** — dormantPool退場時に{id, age}で保存。再入場時に年齢継続。22歳超はFA参入不可
- **HEAT倍率圧縮（v1.7）** — Warm ×1.1、Hot ×1.2、On Fire ×1.3（旧: 1.2/1.5/2.0）。興行週にも軽減衰-0.3。On Fireは好調でもシーズン終盤にようやく到達するレベル
- **baseAttendance係数2倍（v1.7）** — 5000→10000。高orgPop帯で大会場・ドームが現実的な選択肢に
- **給料テーブル再調整（v1.7）** — OVR80帯:100万/週、OVR90帯:180万/週。旧セッション16値(150/250)から微減、元値(60/100)の1.7倍
- **グッズ単価引き上げ（v1.7）** — 0.08→0.15万/人。チケット:グッズ比率 6:1→3:1に改善
- **育成補助金（v1.7）** — orgPop 40未満の小団体に地域振興助成金を支給（0-19:50万/週、20-29:35万/週、30-39:20万/週）。40到達で打ち切り+通知
- **Engine.milestone（v1.7）** — careerRecord.history + careerHistoryからキャリア年表を動的構築。戦績経歴タブの表示に使用
- **dormantPool年次加齢（v1.7）** — シーズン末にpool内{id,age}エントリも+1歳。永遠の若者バグ修正
- **ニュースティッカー（v1.4w）** — manage画面にスクロールニュースバー。毎週3-5件生成。8カテゴリ（AI興行/連勝連敗/フレーバー/怪我/スカウト/経済/一般）。テンプレート＋{placeholder}置換方式
- **新聞パネル（v1.4w）** — 重大イベント時にスポーツ新聞風ポップアップ。タイトル交代/防衛記録/ブレークスルー/スランプ/モチベ喪失/殿堂入り/引退/引き抜き成功の8種。複数記事ナビゲーション対応
- **防衛記録マイルストーン（v1.4w）** — タイトルマッチ後にpre/post防衛回数比較で5/10/15回のマイルストーンを検出。新聞記事を自動生成
- **タイトルマッチクールダウン修正（セッション22）** — autoFillCard/App.executeShow（最終防衛線）/toggleTitle/ui-render.jsのonchangeの4箇所すべてにEngine.title.canTitleMatch(G)チェックを追加。engine.jsのexecuteShowガードのみでは防げなかった（プレイヤー興行はapp.js系列で処理されるため）

---

## v1.0 — 残タスク

| # | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| 10-2 | ZIP配布パッケージ作成 | 小 | ✅ build-zip.sh修正完了（portrait-map.js + image/*.png対応） |
| 10-3 | チュートリアル/ヘルプ画面 | 中 | ✅ 完了（9セクション実装済み） |
| 10-5 | READMEを配布用に書き換え | 小 | ✅ 完了（61行・GitHub Pages対応） |

---

## v1.2：ランキング・チャンピオンベルト改修 — 全完了

| # | タスク | 状態 |
|---|--------|------|
| 1 | ランキングからchampionScore列を削除 | ✅ |
| 2 | スター・人気計のツールチップ追加 | ✅ |
| 3 | 挑戦状イベントの廃止 | ✅ |
| 4 | 「世界王者」名称の見直し（worldTitleUnlocked / getBeltName） | ✅ |
| 5 | タイトルマッチを12週に1回（クォーター末）に制限 | ✅（セッション22で完全修正） |
| 6 | エース指定廃止・チャンピオンへ統合 | ✅ |
| 7 | チャンピオンの集客ボーナス（×1.10） | ✅ |
| 8 | 乱入マッチイベント | ✅ |
| 9 | フレーバーイベント・雑誌取材・TV出演 | ✅ |

---

## v1.3：選手ライフサイクル改修 — 全完了

| # | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| 1 | 衰退・引退システム改修（durability + wear方式） | 大 | ✅ |
| 2 | 個人実績記録システム（careerRecord + retiredFighters + hallOfFame） | 大 | ✅ |
| 2b | 成長システム改訂・怪我デバフ（試合成長/growthPenalty/careerHistory） | 大 | ✅ |
| 3 | 引退演出（ポップアップ＋セリフ8カテゴリ×3本＝24本） | 中 | ✅ |
| 6 | 殿堂入りシステム（13回以上 → hallOfFame移動） | 大 | ✅ |
| 7 | PPV（全団体合同大会・Week44エントリー・Week48開催） | 大 | ✅ |
| 8 | 年末表彰式（3賞＋チャンピオン紹介＋殿堂入り・フレームa-g） | 大 | ✅ |

### マイグレーション一覧

| フラグ | 対象 |
|--------|------|
| `_migrated_v1_0b` | 旧データ構造の互換性対応 |
| `_migrated_v1_3` | 全選手にcareerRecord付与 + retiredFighters/hallOfFame |
| `_migrated_v1_3_1` | durability/wear後付け |
| `_migrated_v1_3_2` | growthPenalty/seasonInjuries/careerHistory後付け |
| `_migrated_v1_3_3` | float型ステータスのMath.round修正 |
| `_migrated_v1_4` | AI fighters careerSeasons付与 + lastAwards/hallOfFame |
| `_migrated_growth_events` | 全選手にhotStreak/slump/motivationLoss/careerBestMQ後付け |

---

## 今セッション完了済み（セッション22 — バグ修正バッチ）

### Bug② 修正：タイトルマッチ12週クールダウンが毎回無視される

**根本原因の特定**：クールダウンガードが engine.js の `executeShow`（AI用）にしか存在せず、プレイヤー興行処理系（app.js）には一切なかった。さらに「自動編成」ボタンが毎回クールダウン無視でタイトルフラグをONにしていた。

| 修正箇所 | ファイル | 内容 |
|---------|---------|------|
| `autoFillCard()` | ui-common.js | 自動編成時に `Engine.title.canTitleMatch(G).allowed` チェック追加。クールダウン中は `isTitle:false` |
| `App.executeShow()` | app.js | プレイヤー興行実行の最終防衛線としてクールダウンガード追加。違反時はタイトルフラグを自動解除してアラート表示 |
| `toggleTitle()` | ui-common.js | タイトルON操作時にクールダウンチェック追加（OFF操作はスキップ） |
| チェックボックスonchange | ui-render.js | `G.showCard[i].isTitle=this.checked` の直接書き換えを廃止し `toggleTitle(i)` 経由に統一 |

### Bug③ 修正：表彰式ポップアップで選手画像が枠画像に収まらない

| 修正箇所 | ファイル | 変更内容 |
|---------|---------|---------|
| `.awards-box` | index.html | `padding: 32px 28px 24px` → `60px 48px 44px`（上下左右を拡大）<br>`aspect-ratio: 980/1140`（縦長フレーム画像に合わせたアスペクト比）<br>`max-height: 92vh`（画面高さの上限）<br>`overflow-y: auto`（内容あふれ時スクロール）<br>`box-sizing: border-box` |

---

## 前セッション（セッション21 — Bug④修正）

### Bug④ 修正：PPV後の週送りで TypeError クラッシュ（const nc 再代入）

**根本原因**：`engine.js` `processManage()` の `const nc` → `let nc`（line 2189）。`nc` を `const` 宣言した後、hotStreak/slump/growthPenalty 解除時に `nc = ...` で再代入を試みて `TypeError: Assignment to constant variable` が発生。`_closingShowResult` フラグが `true` のまま残留し以降の週送りが全てブロックされた。PPVで顕著（6試合 → breakthrough多発 → hotStreak付与 → 次のtickWeekでcrash）。

| 修正箇所 | ファイル | 内容 |
|---------|---------|------|
| `processManage()` の `const nc` | engine.js | `const` → `let` に変更 |
| `closeShowResult()` | app.js | try-finally 追加。例外時も `_closingShowResult = false` を保証 |

---

## 前セッション（セッション20 — 世界観演出システム v1.4w）

### 実装内容（6ファイル改修）

| # | タスク | 変更ファイル | 概要 |
|---|--------|-------------|------|
| 1 | ニューステンプレート定数追加 | data.js | NEWS_TICKER_TEMPLATES（8カテゴリ×5-6パターン）+ NEWS_HEADLINE_TEMPLATES（8種×3パターン）。{name}/{org}/{count}等プレースホルダー方式 |
| 2 | Engine.news名前空間 | engine.js | generateTicker(rng,state)→string[3-5]、generateHeadlines(rng,events)→Article[]、checkDefenseMilestone(defenses)→0/5/10/15 |
| 3 | ニュース生成フック | app.js | _refreshTicker()/_pushNewsEvent()/_showNewsPanelIfNeeded()。closeShowResult/processWeek/advanceWeek/_checkAndShowAwards/loadGame各所にフック |
| 4 | 新聞パネルUI | ui-common.js | showNewspaperPanel(articles,onDone)。複数記事prev/nextナビゲーション。スポーツ新聞風デザイン |
| 5 | ティッカーDOM挿入 | ui-render.js | manage画面の月次収支下にスクロールニュースバー。G._tickerItems参照。テキスト2重化でシームレスループ |
| 6 | CSS+DOM追加 | index.html | .news-ticker-bar（40sアニメ・金色背景）、.newspaper-overlay/.newspaper-box（クリーム紙風グラデ・z-index:268）、DOM要素追加 |

### コールバックチェーン（週送り後の表示順序）

```
tickWeek → 引退ポップアップ → AI成長アラート → 新聞パネル → 年末表彰式 → シーズンファンファーレ → refreshAll
```

### バグ修正（2件）

| # | 問題 | 対策 |
|---|------|------|
| 1 | 新聞パネル次ボタンのHTML構文エラー（`>` 欠落） | テンプレートリテラル修正 |
| 2 | Engine.news.generateTickerで未定義フィールド`_winStreak`/`_loseStreak`参照 | 勝率ベース判定に変更（勝率75%以上で好調、敗率70%以上で不調） |

---

## 前セッション（セッション19 — UX改善バッチ v1.9）

### 実装内容（6 UX改善 + 2 ドキュメント）

| # | タスク | 変更ファイル | 概要 |
|---|--------|-------------|------|
| C1 | 戦績ポップアップ コンパクト化 | ui-common.js | 4グリッド大ボックス→1行インライン（勝/敗/分/勝率/ベストMQ/王者）。冗長なCareer Summaryブロック削除 |
| C3 | ロスターソート機能 | ui-render.js | `_rosterSortKey` + `setRosterSort()` + ソートボタン行（OVR/名前/体調/人気） |
| C4 | 週送りトースト通知 | ui-common.js + app.js + index.html | `showToast()` + `.toast` CSS + DOM + `_tryAutoAdvance`フック |
| C5 | 新シーズン開幕ファンファーレ | ui-common.js + app.js + index.html | `showSeasonFanfare()` + `_maybeShowSeasonFanfare()` + `.season-fanfare-overlay` CSS + DOM |
| C6 | 月次収支表示 | ui-render.js | manage画面のダッシュボード下に `monthlyFinanceBuffer` 集計バー表示 |
| C7 | build-zip.sh修正 | build-zip.sh | `portrait-map.js`コピー追加、`image/*.png`で全画像一括コピー |
| A | docs/master-spec.md 新規作成 | docs/master-spec.md | 現行仕様のみのマスタードキュメント（変更履歴なし）|
| B | 特性コード照合レポート | — | 25種中21種は実装済み。未実装4種: 適応力/人望/忠誠心/野心（「将来用」） |

### 特性未実装一覧（将来用）
| # | 特性名 | spec記載効果 | 現在の状態 |
|---|--------|------------|---------|
| 12 | 適応力 | 新しいスタイルの技を覚えやすい | コード上の分岐・効果なし |
| 18 | 人望 | 団体士気にボーナス | コード上の分岐・効果なし |
| 21 | 忠誠心 | 引き抜かれにくい | コード上の分岐・効果なし |
| 22 | 野心 | チャンピオンを狙いたがる | コード上の分岐・効果なし |

---

## 次セッション予定

### 残バグ・改善タスク（優先順）

| # | タスク | 重さ | 備考 |
|---|--------|:----:|------|
| 1 | **試合表示順を逆順に**（メインイベントを上部表示） | 小 | 興行結果ポップアップの試合リストをreverse |
| 2 | **trainCap旧式→新式書き換え** | 中 | `Engine.rival.generateTrainCap` / `Engine.makeChar` を `factor×Pot`（factor 0.50〜0.80）に変更 |
| 3 | **フィニッシャー（キャラ固有必殺技）** | 高 | 設計書 第3部 3.11 |
| 4 | **ライバルストーリー自動生成** | 高 | 未設計 |

---

## v1.4w：世界観演出システム — 全完了

| # | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| 1 | 業界誌・新聞フレーバーテキスト拡充（NEWS_TICKER_TEMPLATES 8カテゴリ + NEWS_HEADLINE_TEMPLATES 8種） | 大 | ✅ |
| 2 | 週次「業界ニュース」ティッカー表示（manage画面スクロールバー、毎週3-5件） | 中 | ✅ |
| 3 | 長期政権王者の「伝説」記録（防衛5/10/15回マイルストーン → 新聞記事） | 中 | ✅ |
| 4 | 引き抜き成功時の業界反響演出（新聞パネル poachSuccess記事） | 小 | ✅ |
| 5 | 殿堂入り選手の業界誌掲載（新聞パネル hallOfFame記事） | 中 | ✅ |

---

## 拡張候補（v1.1以降）

| 項目 | 優先度 | 備考 |
|---|---|---|
| ~~成長イベントシステム（ブレークスルー・スランプ等）~~ | ~~最高~~ | ✅ セッション18で実装完了 |
| フィニッシャー（キャラ固有必殺技） | 高 | 設計書 第3部 3.11 |
| イベントシステム（覚醒・スランプ・引退試合） | 高 | 成長イベントに統合済み |
| ライバルストーリー自動生成 | 高 | 未設計 |
| エンディング/ゲームオーバー演出 | 中 | 未設計 |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | — |

---

## 後回しタスク（記録）

- 弱い相手とのタイトルマッチにマイナス要素
- ~~人気バランス全体の精査（増加要因が多すぎる問題）~~ → セッション16で対策済み（自然減衰-0.5/週）
- SP上限バランスの検証
- 各団体社長・プレイヤーキャラの顔画像（フレーバー演出強化時に検討）
- UX-2: 時間経過の可視化（ヘッダー常時表示・季節アイコン） — UX-1と連動
- UX-4: ランキング画面のカスタムツールチップ（モバイル対応） — 優先度低

---

## アーキテクチャ5原則（全達成済み）

1. Engine = 純粋関数（DOM禁止）
2. GameState戻り値更新（in-place変更禁止）
3. UIはG直接変更禁止（App経由のみ）
4. 乱数はseed管理で再現可能
5. tickWeek統合パイプライン

---

## 設計書インデックス

| ドキュメント | ファイル | 場所 |
|---|---|---|
| ゲームデザイン総覧 | wrestle-manager-game-design-current.md | docs/ |
| ファイル分割計画 | plan-split-and-features.md | docs/ |
| ロスターランダム化（設計メモ） | roster-randomization-design.md | docs/ |
| バトルエンジン | battle-engine-spec-v4.1b.md | specs/ |
| キャラクターデータ（98名） | character-data-spec-v1.4.md | specs/ |
| 経済システム | economy-system-spec-v1_0.md | specs/ |
| コンディション/怪我 | condition-system-spec-v1.0.md | specs/ |
| 週間ゲームループ | weekly-gameloop-spec-v1_0.md | specs/ |
| 育成/トレーニング | training-system-spec-v1_0.md | specs/ |
| MQスコア＋人気 | mq-popularity-spec-v1.0.md | specs/ |
| 団体ランキング/勝利条件 | org-ranking-spec-v1_0.md | specs/ |
| タイトル/ベルト | title-system-spec-v1.0.md | specs/ |
| スカウト | scout-system-spec-v1.0.md | specs/ |
| ライバル団体AI | rival-org-spec-v1.0.md | specs/ |
| 価格バランス | pricing-balance-spec-v0.99.md | specs/ |
| 特性リスト（25種） | traits-v2.1.md | specs/ |
| 技テーブル（160技） | 技テーブル_全160技_v3_5.md | specs/ |
| 興行＋観客動員改修 | card-attendance-redesign-spec-v1.0.md | specs/ |
| 人気・会場再設計 | popularity-venue-redesign-spec-v1.0b.md | specs/ |
| ライバルシステム旧版 | rival-system-spec-v0_9.md | specs/ |
| 衰退・引退システム改修 | v1.3-1-decay-retirement-spec.md | specs/ |
| 成長システム改訂・怪我デバフ | v1.3-2-growth-injury-spec.md | specs/ |
| 引退演出 | v1.3-3-retirement-presentation-spec.md | specs/ |
| PPV＋年末表彰式 | ppv-awards-spec.md | specs/ |
| **成長イベントシステム** | **growth-event-spec-v1.0.md** | **specs/** |
| **世界観演出システム** | **world-presentation-spec-v1.4.md** | **specs/** |
| バランステスト仕様書 | balance-test-spec.md | docs/（作業用） |

---

## セッション履歴

| # | 日付 | 内容 |
|---|------|------|
| 1 | 02-22 | 新ロードマップ作成。旧ロードマップアーカイブ |
| 2 | 02-22 | 対抗戦演出全面改修、スカウト生成廃止、ランキングカラー、QoLバッチ |
| 3 | 02-22 | v1.0a オープニング画面実装 |
| 4 | 02-22 | v1.0b F1/F2/F3全面改修。社長削除→エース演出。交渉制。団体名ランダム化 |
| 5 | 02-23 | v1.0c サウンドデザイン全面刷新。SFX47種v3。BGM3曲 |
| 6 | 02-23 | v1.0d バトルUI改修。ランキングUI改修 |
| 7 | 02-23 | v1.0e ロスターランダム化実装完了 |
| 8 | 02-23 | trainCap式確定＋成長モデル方針転換 |
| 9 | 02-24 | ランキングchampionScore削除、タイトルマッチ12週制限、worldTitleUnlocked |
| 10 | 02-24 | 年末表彰式・殿堂入り・乱入マッチ・フレーバーイベントの詳細設計完了 |
| 11 | 02-24 | v1.2-6〜9全完了（エース廃止・集客ボーナス・乱入マッチ・フレーバーイベント） |
| 12 | 02-25 | v1.3-2 careerRecord実装。v1.3-1/v1.3-3設計。PPV＋表彰式設計 |
| 13 | 02-25 | v1.3-1 衰退・引退システム実装。成長改訂・怪我デバフ実装 |
| 14 | 02-25 | 年末表彰式UI大改修（AWARD_LINES40セリフ、フレームa-g、殿堂金文字） |
| 15+ | 02-25 | v1.3-3引退演出実装。PPV全実装。殿堂入り統合。ヘルプ画面。README。build-zip.sh |
| 16 | 02-25 | ロードマップ全面改訂（コード監査）。バランス調整6項目（HEAT decay強化・集客加算方式化・給料引き上げ・人気自然減衰・orgPop減衰・FA若返りバグ修正）。成長イベントシステム設計完了（ブレークスルー・絶好調・スランプ・モチベ喪失・AI団体適用+脅威通知） |
| 17 | 02-25 | バグ修正2件（Engine.milestone実装・スカウト見送り修正）。経済リバランス（baseAttendance×2・SALARY再調整・グッズ単価UP・育成補助金導入）。HEAT倍率圧縮（On Fire 2.0→1.3）+興行週軽減衰。heatScoreバグ修正2件。dormantPool年次加齢。シミュレーション検証完了 |
| 18 | 02-25 | 成長イベントシステム実装完了（ブレークスルー・絶好調・スランプ・モチベ喪失・AI団体適用）。6ファイル改修。無効hexリテラルバグ修正 |
| 19 | 02-25 | UX改善バッチ v1.9（ロスターソート・戦績コンパクト化・トースト・ファンファーレ・月次収支・build-zip.sh修正）。docs/master-spec.md新規作成。特性コード照合（未実装4種特定） |
| 20 | 02-25 | 世界観演出システム v1.4w 実装完了（ニュースティッカー+新聞パネル+防衛記録マイルストーン）。Engine.news名前空間追加。テンプレート16カテゴリ。6ファイル改修。バグ修正2件 |
| 21 | 02-25 | Bug④修正（engine.js processManage `const nc`→`let nc`。app.js closeShowResult に try-finally追加） |
| 22 | 02-25 | Bug②修正（タイトルマッチ12週クールダウンが毎回無視される問題：autoFillCard/App.executeShow/toggleTitle/ui-render.jsの4箇所を修正）。Bug③修正（表彰式awards-box CSS：padding拡大・aspect-ratio/max-height/overflow-y追加） |

---

## メモ

- build-zip.shは古い: `image/award-frame-*.png`（7枚）と `portrait-map.js` が未包含
- README.mdの「120名以上のキャラクター」は固有キャラ98名＋スカウト生成＋コーチ8名の合算
- 引退セリフは当初「98名キャラ固有」想定だったが、汎用8カテゴリ方式で十分なバリエーションが出るため方針転換
- バランス調整（セッション16+17）はローカルで修正済み、push待ち
- セッション17のバランスシミュレーション結果: test/balance-sim.jsで再現可能（node test/balance-sim.js）
- 成長イベントシステム（セッション18）実装済み。growth-event-spec-v1.0.md準拠
- **修正済み(v1.9)**: 放置68週でorgPop99問題 → applyShowPopularity閾値引き上げ（70/55/40→80/65/45、最大+3→最大+2）
- 世界観演出システム（セッション20）実装済み。world-presentation-spec-v1.4.md準拠。transientフィールド（_tickerItems/_newsEvents）はsave時に除去済み
- タイトルマッチクールダウンバグ（Bug②）は「UIは正しくグレーアウトするが実際の処理では素通りしていた」パターン。engine.js側のガードはAI用executeShow経由でしか発動せず、プレイヤー用（app.js系列）は完全に素通りだった
