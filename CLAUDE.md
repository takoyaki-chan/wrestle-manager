# CLAUDE.md — Wrestle Manager

## このゲームの魂

女子プロレス団体経営シミュレーション。
プレイヤーは団体の社長として、たくさんの女子プロレスラーたちが
頑張り、苦しみ、時に折れていく姿を「覗き見る」ゲーム。

### 三本柱

1. **キャラクターの人生を覗き見る**
   - セリフ、表情、データ、試合——すべてはキャラクターのドラマを映す窓
   - 大人数の中でスポットライトが当たった瞬間の一言、一つの表情が刺さる
   - テンプレではない、その子だけの言葉と感情を見せる

2. **社長は舞台を作る人**
   - プレイヤーの介入は「社長の手が届く範囲」に限る
   - カード編成、育成方針、興行の場づくり——選手が輝く環境を整えるのが仕事
   - 試合中に技を指示するような直接操作はしない

3. **数値は嘘をつかない**
   - シミュレーションが事実を生み、演出がそれを物語として見せる
   - 数値を捻じ曲げてドラマチックにしない。だから本当に奇跡が起きたとき感動は本物になる
   - エンジンが出した結果を、演出が最大限に活かす

## 感情設計

- **辛さを避けない**。挫折、絶望、リタイアという残酷さがあるから、報われたとき一緒に喜べる
- **鮮烈に見せる**。顔つき、声、セリフの演出で感情を強く伝える
- **スポットライトは自然に巡る**。全キャラ均等ではなく、その瞬間に輝く子を鮮やかに照らす

## 数値哲学:「数字は繊細に使え」

- 「人気+2」「士気+1」のような安易な加減算で物事を処理しない
- 単純計算で済ませると必ずどこかで破綻し、ユーザーにバレる
- 数値設計は常に「この数字の変動に説得力があるか?」を問う
- 数字はドラマの裏で動くもの。表に出すぎてスプレッドシート最適化ゲームにしない

## やらないことリスト

- ❌ 試合中の直接操作(社長の権限を超える介入)
- ❌ テンプレセリフ・画一的な感情表現(「やったー!」「くやしい…」の量産)
- ❌ 全キャラ均等主義(スポットライトは巡るもの、配るものではない)
- ❌ 誰も傷つかない安全な世界(残酷さのない世界に感動はない)
- ❌ 数値の丸見せによるスプレッドシートゲーム化
- ❌ 安易な数値加減算によるイベント処理

## 機能追加の判断基準

新しい機能やシステムを追加するか迷ったら、この順番で問う:

1. **「キャラクターのドラマに見えるか?」** — 単なる数値操作にしか見えないなら再設計
2. **「社長の視点から自然か?」** — 社長が知りえない情報、できない操作を与えていないか
3. **「この数字の動きに説得力があるか?」** — 安易な加減算になっていないか
4. **「演出でどう見せるか?」** — 実装時点で演出イメージが浮かばない機能は時期尚早

---

## アーキテクチャ5原則

v0.85bで確立。すべての実装はこの原則に従う。

1. **Engine純粋関数** — エンジンはDOMに触れない
2. **GameState返却値更新** — 状態変更はGameStateの返却で行う
3. **UIはGameStateを直接変更しない** — UIはエンジン経由でのみ状態を更新
4. **乱数シード管理** — 再現可能なシミュレーションのためシードを一元管理
5. **tickWeek統合パイプライン** — 週次処理はtickWeekに集約し処理順序を保証

## 開発ルール

### 進め方
- 3ステップ以上の複雑な作業では、まず計画を提示してから実装に入る
- 作業が停滞・迷走したら無理に進めず、立ち止まって方針を練り直す
- 大きな方針変更は必ずユーザーに説明し、承認を得てから実装する

### 品質
- 変更は可能な限りシンプルに、影響範囲を最小に保つ
- 対処療法だと感じたら根本原因を探り、洗練された解決策を再設計する
- セリフ・演出にテンプレ表現を使わない。キャラの一人称、語尾、感情の出し方は一人ひとり異なる

### ダメージセリフ/ボイスの発動ルール
クリティカルヒット(dmg≥15)時のみ発動判定。**HP残量**で使い分ける:
- HP 66%超: セリフ40%(まだ言葉にできる)
- HP 34〜66%: セリフ15% / ボイス50%(効いてきた、主に悲鳴)
- HP 33%以下: ボイス60%のみ(限界、言葉にならない)
ビッグムーブも同じルール。HP33%以下でダメージセリフ(長文)は絶対に出さない。
基準はフェーズ(時間)ではなくHP残量(消耗度)。defenderReactionのHP帯と同じ閾値。

### 完了時
- 作業完了時は **`docs/worklog.md` の先頭**に詳細ログを追記し、`docs/game-system-roadmap.md` は該当項目のステータスを1行更新する（ロードマップに長文ログを書かない — 2026-07-08 分離。ロードマップ=予定と状態、worklog=詳細記録）
- 作業完了時にローカルコミットする(`git commit`)。**pushはしない**(Cloudflare Pagesが自動デプロイするため、pushタイミングはユーザーが判断する)
- UI確認はスクリーンショットではなくユーザーに委任する
- 完了報告時に「確認してほしい画面・操作・表示」を具体的に列挙する

## 自動検証システム(auto-sim)

### 仕組み
- **`Engine.validateGameState(G)`**: tickWeek末尾で毎週実行される不変条件チェッカー。キャラステータス範囲・NaN検出・参照整合性など約20種を検証。違反は `[WM Debug]` でコンソール出力 + `G.debugLog` に記録。ゲーム進行は止めない
- **`test/auto-sim.js`**: UIなし高速シミュレーション。プレイヤー判断をランダム自動化して数千シーズンを数十秒で回し、validateGameStateの違反を収集・報告する

### 自動実行(Claude Codeフック)
- **management.js / match-engine.js / relationships.js / data.js / victory-lines.js を編集すると自動で100シーズン(5シード×20シーズン)のチェックが走る**
- 違反検出時はフィードバックが返り、その場で修正に入る
- フック実体: `.claude/hooks/auto-sim-check.sh`、設定: `.claude/settings.json`

### 手動実行
```bash
node test/auto-sim.js 100         # 100シーズン(ランダムシード)
node test/auto-sim.js 100 42      # 100シーズン(シード指定)
# 拡張テスト(上限): 10シード × 100シーズン ≒ 70分
for i in $(seq 1 10); do node test/auto-sim.js 100 $((i * 7919)); done | grep "Result:"
```

### いつ回すか(2026-07-24 Keisuke裁定: 不必要に長く・何度も回さない)
- **management.js / match-engine.js / relationships.js を変更したとき** → フックが自動実行(追加の手動実行は不要)
- **日常の受け入れ確認** → 20〜40シーズン1本で足りる(30秒〜3分)
- **分布の較正判断が必要なとき(★帯・fp帯などの数値決め)のみ** → 100年を1本。グリッド比較は40年で行い、採用値の最終確認だけ100年
- **複数シード** → 較正値の再現性確認という明確な目的があるときだけ+1本(40年)。10シード×100年級のバッチや100×100は行わない
- 同じ構成の検証を工程ごとに繰り返さない。既存の計測結果を使い回す
- **app.js や UI のみの変更** → 不要

## specs/ 更新ルール (2026-04-05 追加)

### docs/ 指示書の完了フロー
1. 指示書に基づいて実装を完了する
2. **実装完了後、specs/ の該当箇所を更新する**(既存specの変更 or 新規spec作成)
3. **specs/ に新規ファイルを作成した場合、下記の「ファイル索引」テーブルにも追記する**
4. specs/ の更新 diff を Keisuke さんに確認してもらう
5. 承認されたら指示書をアーカイブに移す

**specs/ を更新せずに指示書をアーカイブしてはいけない。**
**新規specを作ったら索引にも追記すること。**

### specs/ の位置づけ
- specs/ = 確定仕様(現在の真実)
- docs/ = 計画・検討・指示書(未来形 or 過去形)
- アーカイブは「完了した指示書」置き場であり、仕様の真実ではない

### specs/ ファイル索引

| ファイル | 内容 |
|---------|------|
| battle-engine-spec-v4.2.md | 試合シミュレーション(ターン制/MQ計算/ビッグマッチ) |
| character-data-spec-v1.7.md | キャラクターデータ定義(ステータス/特性/性格) |
| coach-system-spec-v3.0.md | コーチ35名/枠/能力/観察レポート |
| contract-negotiation-spec-v2.0.md | シーズン開幕の契約交渉イベント |
| economy-spec-v2.0.md | 収支バランス(グッズ/メディア/給与/精算) |
| growth-system-spec-v2.0.md | trainCap距離ベース成長/年齢/追い込み |
| large-event-spec-v1.0.md | 大型イベントB1-B4(怪我/対立/挑戦状/メディア) |
| personality-archetype-spec-v1.0.md | 性格6種×アーキタイプ6種の相性マトリクス |
| ppv-grand-final-spec-v2.0.md | PPV GRAND FINAL(エントリー/頂上決戦/報酬) |
| promo-system-spec-v1.0.md | プロモ活動(人気成長/収入/MQスタック) |
| relationship-system-spec-v2.0.md | Bond/Rivalry(非対称2軸/試合影響/因縁称号) |
| relationship-system-spec-v2.1.md | 他団体戦Bond/Rivalryリバランス(bond負値×1.5/基本Bond税/M-CO1好敵手認定/M-CO2抗争和解、確定) |
| relationship-system-spec-v2.2.md | 離脱・裏切りイベント(A-1〜A-4 サーチャージ/B-3 元同僚初対戦/奪還挑戦) |
| relationship-system-spec-v2.3.md | bond/rivalry ネガティブ拡張全項目(先行5項目 + P-1 タッグペナルティ/P-3 興行波及/P-4 ロッカー荒廃+嫌悪伝染/P-6 修復チャネル決裁/P-7 険悪可視化) |
| rental-system-spec-v2.0.md | レンタル移籍(費用/制約/帰団処理) |
| rival-org-spec-v1.0.md | AI団体の行動ロジック |
| scout-system-spec-v1.0.md | スカウト/新人獲得 |
| snapshot-notification-spec-v1.0.md | スナップショット通知(G/R系列/テキスト生成) |
| title-system-spec-v1.0.md | タイトル3階級/防衛/挑戦権 |
| trust-system-spec-v2.1.md | 信頼度(出場/ケア/士気/待遇不満) |
| venue-attendance-spec-v2.0.md | 会場10段/集客計算/勢い/予測 |
| venue-attendance-spec-v2.1.md | 会場10段/集客計算/消費枠数による集客ボリューム係数 v1.1/勢い/予測 |
| opening-sequence-spec-v1.0.md | オープニングシーン4幕+初期ドラフトクリームテーマ+完了演出 |
| weekly-gameloop-spec-v1_0.md | 週次ループ/シーズン構成/オフウィーク |
| 技テーブル_全160技_v3_5.md | 全160技のデータテーブル |
| draft-negotiation-spec-v1.0.md | ドラフト交渉システム(入札/ヒートゲージ/AI参加) |
| poach-trust-spec-v1.0.md | 引き抜き・信頼度連動仕様 |
| oyou-style-guide.md | 鷹揚(composed)口調スタイルガイド |
| achievement-system-spec.md | 実績システム リデザイン仕様(未実装叩き台) |
| facility-system-spec.md | 設備投資システム仕様(未実装) |
| league-elevation-mockup-spec.md | 業界底上げイベント仕様(未実装) |
| tag-match-system-spec-v0.1.md | タッグマッチシステム設計(未実装v0.1) |
| chronicle-system-spec-v0.1.md | 団体年代記(気風/章生成/fighterArchive、Phase 1-4 全実装完了) |
| chronicle-system-spec-v0.2.md | 年代記 v0.1 への差分仕様(章mode判定/eraStats拡張+competitiveRecord/記者の目カテゴリ8種) |
| chronicle-system-spec-v0.3.md | 章重複リデザイン(focusSeason 章境界 + 駆け出し章 + era-OVR + peer 4枠 + 記者の目 3段 + 重複バンドUI、Phase A-D 全実装完了 2026-05-04) |
| chronicle-prologue-spec-v1.0.md | 序章システム(旗揚げ世代を独立レイヤーで永久保存、VARIANT B グリッド、Phase 1-5 全実装完了 2026-05-02) |
| shachoshitsu-spec-v1.0.md | 社長室システム(Phase 1-9 全実装完了 2026-04-15) |
| orgpop-rebalance-spec-v1.1.md | orgPopリバランス&ドーム到達設計(DRAFT・未実装) |
| fan-expect-firstmeet-spec-v0.1.md | ファン期待カード「初顔合わせドリーム」(未実装v0.1) |
| match-flavor-popup-spec-v0.1.md | 試合前フレーバーポップアップ(未実装v0.1) |
| match-popup-overview-v0.1.md | 試合演出ポップアップ再設計 全体構想(未実装v0.1) |
| faction-system-spec-v0.1.md | 派閥システム(DRAFT・未実装v0.1) |
| rivalry-chronicle-spec-v1.0.md | 因縁列伝(3面) — 9象限分類 + H2H.history[] + 黒田叙述紙面 |
| newspaper-and-orgcompare-spec-v2.0.md | 新聞画面+団体比較画面の確定UI仕様(共通CSS/4軸バー/ダイジェスト/KURODA接続) |
| career-history-spec-v1.0.md | 選手経歴年表(Phase A〜E 全実装完了/history type カタログ/PPV・JT 結果分岐/退団 6 type) |
| faction-f07-variation-spec-v0.1.md | F07 派閥動向 共通フレーム化 v0.4(全アーキタイプ共通+チーム全体12週CD+アーキタイプ×incidentTypeマトリクス、DRAFT) |
| faction-archetype-rework-spec-v0.1.md | 派閥アーキタイプ6種(権威型/結束型/実力主義/ヒール派閥/正統派/武闘派) v0.2、F01アーキタイプ自動判定 + 属性確率バイアス制 + アーキタイプ遷移(DRAFT) |
| faction-common-events-spec-v0.1.md | 派閥共通イベント5種(Common-1派閥内試合提案/3加入通知/4合宿/5メディア取材/7合同企画)、既存F01〜F08と被らない日常軸(DRAFT) |
| org-ranking-spec-v2.0.md | 団体ランキング 評価/基礎力 算出仕様(4軸構造: 基礎力+レガシー+対戦PT+シーズン実績、基礎力は Force/Depth/Marquee の3軸合算、Phase 1-4 全実装完了) |
| faction-rivalry-points-spec-v0.1.md | 派閥抗争ポイント制 + F09 派閥対抗戦(v0.3 確定 / Phase B 全実装完了 / 試合連動ポイント+先取100決着+F09 ×1.8倍率+勝ち越し+15pt+v0.9 UI+モーダル4種) |
| glimpse-cascade-spec-v1.0.md | Glimpse Cascade(2件以上の興行後 Tier1 Glimpse を1枚集約・Variant A 縦リスト・白吹き出し+from矢印+to感情バッジ+ベル系SE順次再生・1件は単発フォールバック / 実装済 2026-05-02) |
| challenge-request-spec-v0.1.md | 選手発信 挑戦試合打診イベント(自団体→他団体・heat≥90で発火・3vs3団体戦・年1〜2回・DRAFT) |
| firing-grudge-spec-v0.1.md | 解雇キャラの遺恨システム(grudge.intensity・解雇者→残留組の片方向更新・challenge-request連動・DRAFT) |
| faction-bond-rivalry-spec-v1.0.md | 派閥イベント bond/rivalry 連動(F03/F04/F05/F07 の選択結果で当事者間の 絆/因縁 を動かす、_applyAxisBetweenGroups ヘルパー追加、実装完了 2026-05-04) |
| shachoshitsu-care-rework-spec-v1.0.md | 社長室・選手ケア再設計(ボーナス交渉4案/休暇辞令v2/外部コーチ招聘制・指導タイプ5種・voice8系統、全実装済み 2026-07-06〜07、実機確認済 07-17) |
| spring-tag-league-spec-v0.1.md | 春のタッグリーグ(Week12・4チーム総当たり+決勝・称号のみ王座なし・連戦消耗B案、v0.2。**P1〜P3全実装完了 2026-07-17**) |
| autumn-gauntlet-war-spec-v0.1.md | 4団体勝ち残り対抗戦(E-4・Week36・3名制勝ち抜き・**連戦消耗モジュール定義元**、エンジン/UI実装済み・実機確認待ち 2026-07-19) |
| quadrennial-ppv-tournament-spec-v0.1.md | 4年に一度のPPVトーナメント「天頂戦」(C-6・season%4==0・16名シングルエリミ15試合・全試合ビッグマッチルール・消耗持ち越し・称号効果なし・UIクライムライン型・準決勝以上2:3矩形アッパー・§6.5関係性ドラマ(文脈前提/下限0)・エントリー=特別招待2+団体枠5/4/3/2・仮エンブレム=image/emblem-tenchosen.png・セリフ91本承認済み(docs/quadrennial-drama-lines-draft-v0.1.md)、**v0.5・実装完了 2026-07-18(実機確認待ち)**) |
| autumn-unified-qualifier-spec-v0.1.md | 秋の統一王座挑戦権トーナメント(統一王座新設が前提。**保留 2026-07-17**、秋枠は4団体勝ち残り対抗戦を採用) |
| bankruptcy-redesign-spec-v1.0.md | 破産再設計「予兆→抵抗→別れ」3段ドラマ(v1.0初版、v1.1で改訂・提案) |
| bankruptcy-redesign-spec-v1.1.md | 破産再設計 v1.1(archetype主軸への転換+オフシーズン処理+セリフ全面書き直し、提案) |
| dome-milestone-spec-v0.3.md | ドーム到達マイルストーン(first_dome_show/first_dome_sellout・記録的ナレーター型・選択肢報酬なし、確定版) |
| dome-milestone-claude-code-prompt.md | ドーム到達マイルストーン実装用の起動プロンプト(仕様は dome-milestone-spec-v0.3、指示書系) |
| relationship-affinity-spec-v1.0.md | 相性軸システム(キャラ固有360°相性軸+回帰圧緩和でbond分布健全化、承認済ドラフト) |
| relationship-flags-spec-v1.0.md | 関係性フラグ第3層(事件ベース付与・原則永続・キャパ希少性・モーダル14種、実装完了/頻度未達) |
| shachoshitsu-integration-spec-v0.2.md | 社長室統合(契約交渉/解雇面談/スカウト/レンタルを社長室に集約、方針合意済みドラフト) |
| ai-draft-balance-spec-v0.1.md | AI団体ドラフト節度(年間獲得ソフト上限+ティア別調整+leagueElevated連動、構造確定・実装前) |
| faction-internal-rank-spec-v0.2.md | 派閥内ポイント制+派閥内序列戦(ゼロサム移動/リーダーは蓄積枠外/猶予52週、v0.2起案) |
| match-format-options-spec-v0.1.md | 特殊試合形式3種(アイアンマッチ/ハードコア+ケージ/6人タッグエリミネーション、議論用ドラフト) |
| move-selection-spec-v0.1.md | 技選択ロジック再設計(威力ベース3ティア制/フェーズ別重み/フィニッシュ級d14+のHP解禁/丸め込み独立経路/大技クールダウン、実装前レビュー待ち) |
| opening-execution-spec-v0.1.md | 開幕大技システム(OVR差15+で格上のみOpeningに高威力の一撃/ダメージ帯20〜105%/透かし時反撃補正/キックアウト無効、実装前レビュー待ち) |
| finisher-system-spec-v1.0.md | フィニッシャー(キャラ固有必殺技の演出レイヤー。設計完了・**優先順位低**・将来の拡張枠) |
| faction-decree-spec-v1.0.md | 派閥解散命令/封印(社長室 決裁書・effect.target='faction'新設・封印は無料/解散のみ代償・リーダー追撃はmomentum比例・factionsSealed 1フラグでtickWeek派閥ブロック全停止・Common-1個別CD 48週の不変条件・WM_FACTION_FIXTURE計測モード。実装完了 2026-07-27) |
| prospect-assessment-spec-v1.0.md | 見立て評価(ドラフト級/スカウト/初期ドラフトのティア再設計。年齢ブレンド+ブレ、超逸材~2%、FA対象外。実装完了 2026-07-30) |
| mq-system-spec-v1.0.md | MQシステム確定仕様(三層構造/finalize一本化+profile5種/OVシーリング4セグメント+超過レイヤー/固定加算全廃→リング内化/観客熱×注目度/歴代記録シングル90・タッグ94分離/大ニュース新聞5種+週頭通知。P1〜P5全実装完了 2026-07-24。設計経緯は docs/mq-redesign-proposal-v0.5.md) |

## UI実装ルール(必読)

レッスルマネージャーのUIは段階的にリファクタ中。新しい画面を作るとき、または既存画面に手を入れるときは、必ず以下のドキュメントを順に読んで従うこと。

### 必読ドキュメント

1. **`docs/ui/01-foundations.md`** — カテゴリ(Office / Stage / Ceremony)、CSSトークン、設計原則
2. **`docs/ui/02-layouts.md`** — レイアウトパターン(P1〜P7)、シーケンス(S1〜S7)、グローバルChrome
3. **`docs/ui/03-screens/<該当画面>.md`**(存在すれば) — 個別画面の詳細仕様

### 鉄則

- **ハードコード16進カラー禁止**。色は必ず `var(--*)` トークンを使う
- **3カテゴリの混同禁止**。Office画面に Stage の純黒背景を使ったり、Stage画面に Cream Panel を置いたりしない
- **シーケンス内のビジュアル一貫性**。S1〜S7のいずれかに属する画面を作るとき、そのシーケンスの共通ビジュアルキー(02-layouts.md 参照)を貫くこと
- **既存デザインシステム `wrestle-manager-design-system.html` v1.0** は部品カタログとして継続利用可。ただし「設計図」は階層1〜3のドキュメントが正

### 新しい画面 or 既存画面のリファクタを依頼されたとき

1. `docs/ui/03-screens/<画面名>.md` が存在するか確認
2. **存在しない場合**:`docs/ui/03-screen-template.md` を読み、同テンプレートに沿って新しく1枚書く。書いたら Keisuke にレビュー依頼してから実装に進む
3. **存在する場合 / 書き終えた場合**:階層1・階層2・該当画面仕様書の3つを参照しつつ実装する
4. 実装完了後、画面仕様書の「実装状況」フィールドを更新する

### このルールの目的

過去に「デザインシステムへの参照がなく、新画面追加のたびに色味・余白がドリフトし、古い画面だけ浮いて見える」問題が発生した。この再発を防ぐため、**すべてのUI作業は階層1〜3のドキュメントに必ず立ち返る**こと。

---

## 配布手順

DLsite/BOOTH 向けzip配布は必ず以下のスクリプト経由で行う。**手動梱包・GUIツール梱包は禁止。**

```powershell
# 1. パッケージ生成
.\release\package-release.ps1

# 2. 検証
.\release\verify-package.ps1 -ZipPath .\release\dist\WrestleManager_1.07.zip

# 3. 検証チェックリストすべてOKを確認後、DLsite/BOOTHに差し替え
```

### 配布対象ファイルの追加・削除

新規JS/CSS/アセットを追加した場合は **`release/manifest.json` を必ず更新**する。  
manifest に載っていないファイルは配布されないため、追加忘れは即バグになる。

`package-release.ps1` は manifest 未記載ファイルを自動検出して警告するので、  
「なぜ警告が出ているか」を毎回確認すること。

### バージョン更新時

`release/manifest.json` の `"version"` フィールドを更新する。  
スクリプトはここからバージョン番号を読む（`-Version` 引数で上書きも可）。
