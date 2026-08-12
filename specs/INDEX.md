# specs/ ファイル索引

specs/ = 確定仕様(現在の真実)。新規specを作成したら**必ずこの索引に1行追記**する(CLAUDE.md「specs/ 更新ルール」参照)。

| ファイル | 内容 |
|---------|------|
| battle-engine-spec-v4.2.md | 試合シミュレーション(ターン制/MQ計算/ビッグマッチ) |
| battle-presentation-spec-v1.0.md | シングル戦Replay観戦の確定表示仕様（Pattern C v4、実況・技説明・カメラ・既存演出維持） |
| character-data-spec-v1.7.md | キャラクターデータ定義(ステータス/特性/性格) |
| coach-system-spec-v3.0.md | コーチ35名/枠/能力/観察レポート |
| dialogue-tone-spec-v1.0.md | **セリフ口調の確定仕様**(archetype×personality二軸/アンカー制/全セル共通の鉄則10項/口調シート34枚を規範文書化) |
| contract-negotiation-spec-v2.0.md | シーズン開幕の契約交渉イベント |
| economy-spec-v2.0.md | 収支バランス(グッズ/メディア/給与/精算) |
| growth-system-spec-v2.0.md | trainCap距離ベース成長/年齢/追い込み → v2.2 |
| growth-system-spec-v2.1.md | （旧）成長リバランスv2.0。AI活動wearの非対称は v2.2 で撤回 |
| growth-system-spec-v2.2.md | **成長システム確定仕様**（指数ブレーキ/追い込み熱量/AI成長パリティ/共通wear/限定AIトレーナー） |
| large-event-spec-v1.0.md | 大型イベントB1-B4(怪我/対立/挑戦状/メディア) |
| personality-archetype-spec-v1.0.md | 性格6種×アーキタイプ6種の相性マトリクス |
| ppv-grand-final-spec-v2.0.md | PPV GRAND FINAL(エントリー/頂上決戦/報酬) |
| promo-system-spec-v1.0.md | プロモ活動(人気成長/収入/MQスタック) |
| relationship-system-spec-v2.0.md | Bond/Rivalry(非対称2軸/試合影響/因縁称号) |
| relationship-system-spec-v2.1.md | 他団体戦Bond/Rivalryリバランス(bond負値×1.5/基本Bond税/M-CO1好敵手認定/M-CO2抗争和解、確定) |
| relationship-system-spec-v2.2.md | 離脱・裏切りイベント(A-1〜A-4 サーチャージ/B-3 元同僚初対戦/奪還挑戦) |
| relationship-system-spec-v2.3.md | bond/rivalry ネガティブ拡張全項目(先行5項目 + P-1 タッグペナルティ/P-3 興行波及/P-4 ロッカー荒廃+嫌悪伝染/P-6 修復チャネル決裁/P-7 険悪可視化) |
| rental-system-spec-v2.0.md | レンタル移籍(費用/制約/帰団処理) |
| salary-decline-spec-v1.0.md | **給与の下り坂(契約査定)確定仕様**(offWeek3再固定/昇給吸収/下り交渉カード/セリフ7フェーズ/P2較正値) |
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
| newspaper-spec-v1.0.md | **新聞の確定仕様(週刊グラップル)**。面の構成/ニュースバリュー採点(基礎+主役+強度)/資格線/ニュース源/特集の発火条件/静かな週の読み物/写真の優先順/文字のルール。P1〜P6 全実装完了 2026-08-02 |
| newspaper-and-orgcompare-spec-v2.0.md | (旧)新聞+団体比較のUI仕様。**newspaper-spec-v1.0 へ置き換え済み**。業界ニュースキューの type 一覧など細目の参照用に残置 |
| career-history-spec-v1.0.md | 選手経歴年表(Phase A〜E 全実装完了/history type カタログ/PPV・JT 結果分岐/退団 6 type) |
| faction-f07-variation-spec-v0.1.md | F07 派閥動向 共通フレーム化 v0.4(全アーキタイプ共通+チーム全体12週CD+アーキタイプ×incidentTypeマトリクス、DRAFT) |
| faction-archetype-rework-spec-v0.1.md | 派閥アーキタイプ6種(権威型/結束型/実力主義/ヒール派閥/正統派/武闘派) v0.2、F01アーキタイプ自動判定 + 属性確率バイアス制 + アーキタイプ遷移(DRAFT) |
| faction-common-events-spec-v0.1.md | 派閥共通イベント5種(Common-1派閥内試合提案/3加入通知/4合宿/5メディア取材/7合同企画)、既存F01〜F08と被らない日常軸(DRAFT) |
| org-ranking-spec-v2.0.md | 団体ランキング 評価/基礎力 算出仕様(4軸構造: 基礎力+レガシー+対戦PT+シーズン実績、基礎力は Force/Depth/Marquee の3軸合算、Phase 1-4 全実装完了) |
| org-ranking-spec-v2.1.md | 団体ランキング評価/基礎力 算出仕様 v2.1（Depthの業界水準連動・4〜8番手/9〜12番手到達度評価・怪我人の非対称扱い、実装済み） |
| faction-rivalry-points-spec-v0.1.md | 派閥抗争ポイント制 + F09 派閥対抗戦(v0.3 確定 / Phase B 全実装完了 / 試合連動ポイント+先取100決着+F09 ×1.8倍率+勝ち越し+15pt+v0.9 UI+モーダル4種) |
| glimpse-cascade-spec-v1.0.md | Glimpse Cascade(2件以上の興行後 Tier1 Glimpse を1枚集約・Variant A 縦リスト・白吹き出し+from矢印+to感情バッジ+ベル系SE順次再生・1件は単発フォールバック / 実装済 2026-05-02) |
| challenge-request-spec-v0.2.md | 選手発信 挑戦試合(3人制団体戦)。直訴+同行選択の統合2枚/果たし状画面(黒Stage+赤・人数可変)/セリフ102+21本焼き込み。**v0.1は旧設計案(置き換え済み)** |
| firing-grudge-spec-v0.1.md | 解雇キャラの遺恨システム(grudge.intensity・解雇者→残留組の片方向更新・challenge-request連動・DRAFT) |
| faction-bond-rivalry-spec-v1.0.md | 派閥イベント bond/rivalry 連動(F03/F04/F05/F07 の選択結果で当事者間の 絆/因縁 を動かす、_applyAxisBetweenGroups ヘルパー追加、実装完了 2026-05-04) |
| shachoshitsu-care-rework-spec-v1.0.md | 社長室・選手ケア再設計(ボーナス交渉4案/休暇辞令v2/外部コーチ招聘制・指導タイプ5種・voice8系統、全実装済み 2026-07-06〜07、実機確認済 07-17) |
| spring-tag-league-spec-v0.1.md | 春のタッグリーグ(Week12・4チーム総当たり+決勝・称号のみ王座なし・連戦消耗B案、v0.2。**P1〜P3全実装完了 2026-07-17**) |
| spring-tag-league-spec-v0.2.md | 春のタッグリーグ **2ブロック制への作り直し**(4チーム×2ブロック+ブロック1位同士の決勝/出場枠は団体順位で3-2-2-1の計8チーム/賞金・引き分け裁定を改訂、2026-08-01 起票・未実装) |
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
| tournament-coach-wrapup-spec-v1.0.md | 特別興行後のコーチ総括(5大会共通/言及は最大2名/voice 8系統×成績6段/_tcwGate の fail-open と onDone 1回保証。実装完了 2026-08-01) |
| mq-system-spec-v1.0.md | MQシステム確定仕様(三層構造/finalize一本化+profile5種/OVシーリング4セグメント+超過レイヤー/固定加算全廃→リング内化/観客熱×注目度/歴代記録シングル90・タッグ94分離/大ニュース新聞5種+週頭通知。P1〜P5全実装完了 2026-07-24。設計経緯は docs/mq-redesign-proposal-v0.5.md) |
| ai-growth-parity-spec-v0.1.md | AI成長パリティの設計経緯（興行週練習/体調安全弁/熱量/wear共通化/限定トレーナー/intensiveRate再較正）。**実装済み・較正完了 2026-08-02**（40年×10ラン+100年×1本 ALL CLEAR。残はKeisuke実機確認）。確定仕様は growth-system-spec-v2.2、指示書: docs/ai-growth-parity-claude-code-prompt.md |
| kaigan-awakening-spec-v0.1.md | 開眼システム(**第1フェーズ実装・較正済み 2026-08-02**。隠しシード2.9%/生成時capOVR≤100のみ/格上戦で50%発火/着地帯=S級top4のcapOVR中央値相対+mn補正4/開眼期間3季はγ1.0+ageMul下限1.0。専用演出は第2フェーズ) |
