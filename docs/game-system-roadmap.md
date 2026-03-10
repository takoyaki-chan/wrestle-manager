# Wrestle Manager ロードマップ

> 最終更新: 2026-03-10（成長v2.0: baseLearning 4.0 + trainCap修正 + 試合成長ageMultiplier適用）
> セッション履歴: `docs/archive/session-history.md`
> 完了済みタスク: `docs/archive/completed-tasks.md`

---

## 現在の状態

**成長v2.0チューニング: baseLearning 4.0 + trainCap修正 + 試合成長ageMultiplier適用（2026-03-10）。**

- **baseLearning 2.0→4.0**: GROWTH_CONFIG.baseLearningを倍増。trainCap到達率が改善（avg 74%, median 76%）
- **trainCapチェック修正**: Player興行(executeShow)とPPV(applyPPVResults)の試合成長で`Math.min(100, ...)`のハードキャップ100を使用していた箇所をtrainCap参照に修正。AI団体の試合成長は既にtrainCapチェック済みだった
- **試合成長にageMultiplier適用**: 試合成長(matchGrowth)に年齢倍率が掛かっておらず、25歳以降も年間約5.4ポイントの試合成長がdecayを打ち消していた問題を修正。3箇所(AI週次興行/Player興行/PPV)すべてに`ageMultiplier(age, traits)`を乗算。age25-26の年間試合成長: 5.4→0.54、27歳+は0に。これでdecay（5〜10/年）が確実に上回り、25歳から下降線→27-28歳で引退に向かう設計が機能する
- **検証スクリプト**: `test/growth-v2-verification.js` 新規作成。6セクション出力（年齢別OVR推移/trainCap到達率分布/注目選手軌跡/団体平均OVR/成長イベント頻度/年齢帯別シーズン成長量）
- 変更: data.js, engine.js
- auto-sim 50シーズン ALL CLEAR

**年末表彰式コールバック防御 + closePPVTV tickWeek修正（2026-03-10）。**

- **問題**: シーズン48週経過時の年末表彰式が表示されたりされなかったりする間欠的バグ
- **原因分析**: `_showNewsPanelIfNeeded → _checkAndShowEnding → _checkAndShowAwards` のコールバックチェーンにtry-catchがなく、中間ステップでランタイムエラーが発生すると後続の `_checkAndShowAwards` が呼ばれなくなる
- **修正1 `_safeAwardsChain()`**: 各ステップをtry-catchで包み、中間エラーがあっても必ず表彰式チェックまで到達する防御的ラッパーを新設。`App.advanceWeek()` 内の3箇所のコールバックチェーンをすべて `_safeAwardsChain()` に統一
- **修正2 `closePPVTV` tickWeek追加**: PPV TV観戦（プレイヤー不参加）でweek 48を処理する際、`Engine.tickWeek` が呼ばれていなかった。訓練・給与・関係値更新・バフ効果など週次処理が丸ごとスキップされていた。`closePPVResult` と同等のtickWeek処理を追加
- 変更: app.js
- auto-sim 500シーズン（125シーズン時点で違反0）

**h2hデータ蓄積・orgTimeline・感情テキスト・関係性タグ 実装完了（2026-03-10）。**

- **G.h2h**: ペア別対戦履歴データ蓄積。キー`${min}>${max}`で全対戦ペアの成績（勝敗数/ベストMQ/タイトル戦・PPV有無）を記録。Engine.h2h名前空間（getKey/getRecord/getRecordFor/update）。プレイヤー興行/AI興行/対抗戦/PPV の4パスで記録
- **fighter.orgTimeline**: ファイター個人の所属団体履歴。配列形式（orgId/fromSeason/fromWeek/toSeason/toWeek）。Engine.orgTimeline名前空間（transfer/wereColleagues）。スカウト獲得/引き抜き/解雇/突然退団/契約退団の全移籍パスで記録
- **感情テキストシステム**: bond×rivalry×OVR差→10カテゴリ（trust/rival_friend/destined_rival/acquaintance/intrigued/hostile_competitor/indifferent/contempt/irritation/hatred）判定。archetype別60パターン固定テキスト。比較ポップアップの各キャラ感情メーター下に💭表示
- **関係性タグ**: 比較ポップアップのヘッダーとボディ間に表示。👥同世代（年齢差2以内）/🔰先輩→後輩（年齢差3+、同団体or元同僚）/🤝元同僚（orgTimeline重複判定）/✨名勝負あり（h2h.bestMQ≥85）
- **既存セーブ移行**: `_migrated_h2h_orgTimeline_v1`。h2h={}初期化、全ファイターにorgTimeline初期エントリ生成
- 変更: engine.js, app.js, ui-render.js, index.html
- auto-sim 500シーズン ALL CLEAR

**勢力図v2追加修正 + 比較ポップアップ感情配置改善 実装完了（2026-03-10）。**

- **勢力図v2 全体表示リデザイン**: 旧縦列レイアウト→2×2散布型レイアウトに全面書換。4団体をランキング順に2×2グリッド的エリアに配置。OVR比例ノードサイズ（R_MIN=10〜R_MAX=30、最強が最大3倍の大きさ）。IDハッシュ(`_relmapIdHash`)による決定論的ジッター+6パス衝突回避アルゴリズム（水平優先プッシュアパート）。全ノードを`<g class="rm-node-group">`でラップしクリック対応。
- **勢力図v2 単体団体表示リデザイン**: 旧横一列→有機的散布型に書換。Y軸=OVR（高OVR=上）、X軸=IDハッシュ散らし+衝突回避。R_MIN=12〜R_MAX=35の大きなOVR比例ノード。全選手に名前ラベル表示。
- **勢力図クリック→選手ポップアップ**: パワーモードでノードクリック時に`showFighterPopup(id)`を呼出（他モードでは従来通り`_relmapSetCenter`）。
- **サイドバー「← 全体に戻る」ボタン**: パワーモード+団体フィルタ中にサイドバー先頭に金ボーダー付き戻るボタン表示。
- **データベースサブタブ勢力図(idx=5)削除**: 相関図viewModeとして既に存在するため重複サブタブを削除。`_renderDbPowerMap`/`_drawPowerMapSvg`関数も削除。
- **シーズンレポートバグ修正**: `offW <= 1`時の条件簡素化。常に`G.seasonStats`+`G.season`を使用。
- **勢力図v2追加修正(2026-03-10)**: (1)勢力図→ネットワーク切替時SVG復元修正(defs完全再構築)、(2)全体表示の団体背景円を勢力強度比例サイズに、(3)団体個別表示のはみ出し防止(PAD_X拡大+中心バイアス+8パス衝突回避+パス内境界クランプ)、(4)団体個別OVRサイズ拡大(R_MAX=45)。
- **比較ポップアップ感情配置改善(2026-03-10)**: 親密度・競争意識メーターを各キャラのアイコン直下に配置変更(左右交互→直感的な自キャラ下配置)。ライバル称号バナーを上部中央に移動。`.rm-cmp-rel-inline` CSS追加。
- 変更: ui-render.js, index.html, docs/game-system-roadmap.md

**Trust総合リバランス設計完了（2026-03-09）。** ケアアクション構造問題の調査→trustシミュレーション→パラメータ探索を実施。「trustグラビティ」（anchor以上で追加減衰）方式を採用し、出場のみの均衡を98→64に下げる設計を確定。ケアストック制（最大5・4週回復）、定常マイナス要素5種（M1-M5）、単発ガツン系イベント5種（S_scandal/S_powerstruggle/S_humiliation/S_betrayal/S_fanrevolt）の4層構造でロードマップに追加。実装はClaude Codeでの実機テストを経て数値確定予定。

**相関図UX改善9件 実装完了（2026-03-09）。** Phase 6v2の操作性・視認性を改善。

- **ズーム機能**: マウスホイール+画面右下の＋/−/⊙ボタン。SVG viewBox操作でカーソル中心ズーム。空白ドラッグでパン移動
- **比較ポップアップ自動閉じ**: 他ノードクリックや空白クリックで比較ポップアップが閉じる
- **フィルタ修正**: bondフィルタ閾値15→10に緩和。bond/rivalryフィルタ選択時にリンク上に数値ラベル表示
- **フォーカスモード距離反映**: 等距離円配置→関係強度ベース配置。intensity=max(bondDev×1.2, rivalryMax, bondDev+rivalryMax×0.6)で距離決定。強い関係ほど中心に近い
- **フォーカスモードリンク整理**: center↔peripheral以外のリンクを非表示。表示上限18接続
- **名前テキスト白文字化**: fill=#e8e8e8+stroke=rgba(0,0,0,0.9)で視認性向上
- **団体カードクリック修正**: 団体カードクリックがcenterIdを変更していたバグ修正→団体クラスター中心へパンのみ
- **フィルタ初期値変更**: 関係ありのみ=ON/閾値=14をデフォルトに。プレイヤーが変更したら記憶（_relmapFilterUserSet）
- **bond矢印**: SVG markerによる矢印をbondラインに追加。warm(青)/cold(赤)の2色。方向が一目でわかる
- UI層のみの変更。変更: ui-render.js, index.html

**相関図リニューアル Phase 6v2 実装完了（2026-03-09）。** 旧放射型レイアウト（Phase 6）をforce-directedネットワークグラフに全面置換。データベース画面サブタブ「相関図」のUIを完全刷新。

- **2つの表示モード**: ネットワーク全体表示（全選手を団体別クラスターで配置）とフォーカス表示（選択選手を中心に関係者を展開）
- **物理シミュレーション**: クラスター重力（団体ゾーンへの引力）+ リンク引力（bond/rivalry関係線による引き寄せ）+ ノード間反発力。フレームごとの位置更新
- **団体ゾーン背景**: 各団体の所属選手が集まる領域を半透明の円で視覚化
- **サイドバー**: 団体カード一覧 + 表示フィルタ（all/rivalry/bond）
- **下部詳細パネル**: 選択ノードの選手情報とbond/rivalry上位関係リスト
- **右クリックコンテキストメニュー**: フォーカス切替・比較ポップアップ起動
- **比較ポップアップ**: 2選手のステータスバー並列表示 + bond/rivalryメーター
- **ノードドラッグ**: ドラッグ中は物理シミュレーションから除外、離すと復帰
- **視覚演出**: OVRベースのノードサイズ、rivalryパルスリング、rivalry線アニメーション、ホバーツールチップ
- UI層のみの変更（エンジン変更なし）。変更: ui-render.js, index.html

**スナップショット通知システム本体 実装完了（2026-03-09）。** 選手の感情・不満・人間関係を雰囲気テキストとして週次通知するシステム。Engine.snapshotモジュール新設。15種のスナップショット候補（G1-G4不満系/R1-R5人間関係系/Phase4摩擦・世代・因縁解消/careerBestMQ/breakthrough・warVictory embedded）。tickWeek末尾で候補収集→6週CD除外→重み付き抽選(max2件/週)→personality×archetypeセリフ解決→テキスト生成。R3モーダル演出（bond75+退団/引退時フルスクリーン表示）。gameLog描画拡張（文字列/オブジェクト両対応）。auto-sim 500シーズン ALL CLEAR。

- **SNAPSHOT_TEXTS**: data.jsに15種の通知テキストデータ追加。scene(情景描写)/voice(personality→archetype→_defaultフォールバック)/staff(スタッフ報告)/modal(R3専用)の4タイプ
- **Engine.snapshot.generate()**: 候補収集→CD判定→重み付きサンプリング（非復元）→テキスト生成。R3は保証枠。embedded型はgameLogではなく_pendingGrowthEvents/eventsに付加
- **R3モーダル**: bond75+の退団/引退時にフルスクリーン演出。processWeek（非興行週）/finalizeShow（興行週）の両パスで発火
- **gameLog二重フォーマット**: renderLog()がstring(従来)/object(snapshot)を透過的に描画。💭プレフィクス+イタリック体
- **CSS**: .log-snapshot/.r3-modal-overlay/.r3-modal/@keyframes r3FadeIn
- **補助**: _rivalryResolvedThisWeekフック（因縁解消検知）、Engine.relationships.personalityCompatibility()ヘルパー
- 変更: data.js, engine.js, app.js, ui-common.js, ui-render.js, index.html（7ファイル、875行追加）

**施設システム廃止 Phase E 完了 + スカウト割引orgPop連動（2026-03-09）。** §4の残作業を完了。施設システム関連のデッドコード（facilityMul / facilityReduction / facilityDiscount / dormBonus）を全除去。スカウト契約金にorgPop連動割引を新設（0-19→0% / 20-39→5% / 40-59→10% / 60-79→15% / 80+→20%）。auto-sim 100シーズン ALL CLEAR。

- **デッドコード除去**: data.js RIVAL_ORGSのfacilityMul、engine.js injury.check()のfacilityReductionパラメータ（関数シグネチャ+全4呼び出し箇所）、getOrgInfo()のfacilityMul参照、dormBonus変数（宣言+3参照箇所）、getSigningCost()のfacilityDiscount引数
- **injuryInfo構造変更**: `{ injury, reducedWeeks, originalWeeks }` → `{ injury, weeks }`。`reducedWeeks`/`originalWeeks`の参照を全てweeksに統一
- **スカウト割引orgPop連動**: `getSigningCost(fighter, facilityDiscount)` → `getSigningCost(fighter, orgPop)`。orgPop帯別割引率テーブル内蔵。`getScoutDiscount(orgPop)` ヘルパー新設（UI表示用）
- **UI表示**: FA選手ポップアップ・スカウト候補ポップアップに🔍割引%表示。契約ログに「スカウト網割引N%」表示
- **プロモ効果**: 既存promoStack + PROMO_POP_CAP機構で十分機能。追加のorgPop連動は不要（「強者がさらに強くなる」構造回避）
- 変更: data.js, engine.js, app.js, ui-common.js, ui-render.js

**ライフサイクルリデザイン Phase 4 実装完了（2026-03-07）。** キャリア寿命を大幅短縮し、世代交代のテンポを加速する全面リバランス。A群14箇所（必須調整）+B群16箇所（調整推奨）の計30箇所を変更。auto-sim 500シーズン ALL CLEAR。

- **A-1: ageMultiplier書き換え** — 黄金成長期を19-20歳に前倒し（旧20-22歳）。成長停止を27歳に短縮（旧33歳）。6段→7段テーブル
- **A-2: 特性補正変更** — 早熟/晩成/遅咲きの閾値を全面短縮（早熟: ≤18で+30%/≥23で-30%、晩成: ≤18で-20%/21-27で+40%、遅咲き: ≤20で-20%/21-29で爆発的）
- **A-3: Wear蓄積開始年齢** — 28歳→23歳（プレイヤー・AI共通）
- **A-4: 初期年齢分布** — 全7箇所で最低年齢を16→17歳に引き上げ、範囲を縮小
- **A-5: スカウト候補年齢** — 15-22歳→16-20歳に縮小。より若年層中心
- **A-6: スカウトstartRatio** — ≤17→≤18で低成熟度開始
- **A-7: generateStartValues** — ≤17→≤18、≤29→≤27の区分変更
- **A-8: デフォルト年齢fallback** — 全箇所の`|| 16`/`|| 20`/`|| 18`を`|| 17`に統一
- **A-9: careerSeasons計算** — `age - 16`→`age - 17`（generateBackstory+makeAIFighter）
- **A-10: maturity計算** — `age - 16`→`age - 17`（makeAIFighter）
- **A-11: FA pool除外年齢** — 22歳→21歳。FA auto-retire 20→21歳
- **A-12: リーダー気質ボーナス** — ≤21→≤19歳
- **A-13: 年齢バリデーション上限** — 60歳→40歳
- **A-14: セーブデータ移行** — age fallbackを17基準に修正
- **B-1: reassess年齢トリガー** — 30歳→25歳、35-36歳→28-29歳。case名をage25/age28plusに変更
- **B-2: canAdvise条件** — careerSeasons≥8→≥6、age≥30→≥25
- **B-3: ブレークスルー年齢ボーナス** — ≤25→≤22歳
- **B-4: 引退セリフ年齢分岐** — young≤25→≤22、prime≤30→≤26
- **B-5: 引退セリフcareerSeasons** — ≥10→≥7でベテラン判定
- **B-6: ageMarketMultiplier** — 若手プレミアム≤21→≤19、安定≤25→≤22、減価≤27→≤24
- **B-7: peakAge** — 26+rng(0,4)→21+rng(0,3)
- **B-8: youngSeasons** — 25-16→22-17
- **B-9: backstory移籍/2回目閾値** — ≥5/≥10→≥4/≥7
- **B-10: trust bonus** — careerSeasons≥8→≥6
- **B-12: AI初期Wear付与** — decayStartAge超の初期AI選手にwear蓄積済みで生成（max79）
- **B-13: DECAY_TABLE廃止** — 未使用のDECAY_TABLEをコメントアウト+export除去
- **B-14: ニュース引退判定** — age≥30→≥25
- **B-15: 引退表示careerYears** — fallback 20/18→17/17
- **B-16: FAセーブ移行** — age≤17修正対象に拡大、newAge 17+rng(0,6)
- **determineDeparture** — age≥28→≥25で引退考慮
- 変更: data.js, engine.js, app.js, ui-common.js, ui-render.js
- 設計書: ライフサイクルリデザイン/lifecycle-redesign-phase4.md

**Phase 5: ライバル称号システム統合 実装完了（2026-03-07）。** ライバル称号（因縁/宿敵/宿命の相手/好敵手）の判定を matches カウントのみから、rivalry値 + 対戦実績の複合条件に書き換え。降格ロジック・片側因縁を新設。週次判定関数 `checkRivalryTitles` で昇格/降格を一元管理。auto-sim 500シーズン ALL CLEAR。

- **称号判定の変更**: matches カウントのみ → `tier` フィールド（0-3）による直接管理。昇格/降格は週次判定 `checkRivalryTitles` が担当
- **昇格条件**:
  - tier 0→1（因縁）: 双方rivalry 30+ OR 片方50+ AND matches 2+
  - tier 1→2（宿敵）: 双方rivalry 50+ AND matchesSinceTier 3+ AND bestMQSinceTier 70+
  - tier 2→3（宿命の相手）: 双方rivalry 70+ AND matchesSinceTier 3+ AND bestMQSinceTier 80+
- **降格条件**:
  - 宿命の相手→宿敵: 双方rivalry 50以下
  - 宿敵→因縁: 双方rivalry 35以下
  - 因縁→消滅: 双方rivalry 20以下 AND 48週以上対戦なし → `relationshipHistory` に記録
- **片側因縁**: 片方rivalry 50+/もう片方30未満 → MQ+1ボーナス。認知イベント（勝利/僅差でrivalry +8~+12ブースト、大敗でrivalry/bond低下）
- **因縁MQボーナス下方修正**: 因縁 +3 → +2。宿敵+4/宿命+6/好敵手+2は据え置き
- **recordRivalry 修正**: `matchMQ` 引数追加。`matchesSinceTier`/`bestMQSinceTier` を対戦ごとに更新。昇格メッセージは週次判定に移譲
- **決着時tierリセット**: 因縁決着成立時に tier/matchesSinceTier/bestMQSinceTier/oneSided をリセット
- **マイグレーション**: `_migrated_rivalry_tier_v1` — 既存 matches から tier を逆算
- **RNGシード**: 認知イベントは applyMatchResult 内の既存 rng を共用
- 変更: data.js, engine.js, app.js

**Phase 4: ケアアクション/成長イベント/大型イベント/表彰式の反映 実装完了（2026-03-07）。** spec §3のイベント影響マトリクスを完成。ケアアクション(C系)、成長イベント(G系)、大型イベント(E系)の残り全トリガーをbond/rivalryに接続。Phase 1〜3と合わせて全イベント種別が関係値に影響するようになった。auto-sim 500シーズン ALL CLEAR。

- **C系（ケアアクション/興行コンテキスト）10種**:
  - C-01/C-02: 激励/リフレッシュ休暇 → target→roster bond +1~+2
  - C-03: 合宿/パーティ → 全ペア bond +2~+4
  - C-04: タイトルマッチ不出場 → 非出場者→タイトル選手 bond -1~-3, rivalry +2~+5
  - C-05: 連敗3+選手を起用 → fighter→roster bond +2~+3
  - C-06: 連敗3+選手を干す → fighter→roster bond -3~-5
  - C-07: 衣装変更 → target→roster bond +1~+2
  - C-08: メディア出演 → target→roster bond +1~+2, roster→target bond -1
  - C-09: 特別待遇 → target→roster bond +2~+3, roster→target bond -2~-3
  - C-10: 前座→メイン → bond -1~-2, rivalry +1~+3
- **G系（成長イベント）8種**:
  - G-01: ブレークスルー → OVR差5以内の全キャラ→本人 rivalry +3~+5
  - G-03: スランプ発症 → bond60+心配(bond +1~+2), rivalry30+低下(rivalry -3~-5)
  - G-04: OVR差10+格差 → 上位者→下位者 rivalry -2~-4/週
  - G-05: OVR差5以内接近 → 両者 rivalry +3~+5（4週毎）
  - G-06: モチベ喪失 → bond60+心配(bond +1~+1), rivalry30+低下
  - G-07: モチベ自動引退 → bond60+→本人 bond -5~-8
  - G-08: prove mode中の試合 → 対戦相手→本人 bond +1~+3, rivalry +2~+4
- **E系（イベント/大型）6種**:
  - E-01: 対抗戦 → 対戦者間 bond 0~+2, rivalry +5~+8; チームメイト間 bond +2~+4
  - E-02: B2対立決着 → loser→winner bond -3~-5, rivalry +8~+12; winner→loser bond 0~-2, rivalry +8~+12
  - E-03: B3対抗戦 → 対戦者間 rivalry +5~+10; 仲間→代表 bond +2
  - E-04: B4メディアスポットライト終了 → target→roster bond +1~+2; OVR近接→target rivalry +1~+3
  - E-05: 表彰式 → winner→roster bond +2~+3; roster→winner bond +1~+2; OVR近接→winner rivalry +2~+4
  - E-06: スキャンダル → roster→対象 bond -2~0
- **新ヘルパー関数**: `applyAllPairs` / `applyShowContextEffects` / `applyBreakthroughEffect` / `applySympathyEffect` / `applyAutoRetireEffect`
- **フック箇所**: careActions.execute, processManage, executeShow, processWeeklyDecay, applyLargeEventEffect, processMediaSpotlight（engine.js）; executeCareAction, finalizeShow, finalizeWar, finalizePPV, _checkAndShowAwards, _applyLargeEventResult（app.js）
- **RNGシード**: 0xBE50〜0xBE5B
- 変更: engine.js, app.js

**Phase 2: 試合結果の反映 実装完了（2026-03-07）。** 毎週の試合結果をbond/rivalryに接続。1試合ごとに13種のイベント分類（M-01〜M-13）を判定し、該当するものすべてを重複適用。通常興行・PPV・AI団体の全試合で関係値が変動。auto-sim 1,000シーズン ALL CLEAR。

- **中核関数**: `Engine.relationships.applyMatchResult(state, charIdA, charIdB, context, rng)` — 1試合ぶんのイベント分類→逓減倍率適用→bond/rivalry変動を一括処理
- **イベント分類13種**:
  - M-01: ベースライン（全試合 bond+0~1, rivalry+0.5~1.5）
  - M-02: 僅差の好勝負（loser HP≥15% or winner HP≤30% → bond+2~4, rivalry+5~8）
  - M-03a/b: 圧勝（turns≤5 or 圧倒的HP差 → 非対称。勝者はrivalry-3~-5で興味喪失、敗者はrivalry+5~+10で強く意識）
  - M-04: 名勝負 MQ80+（bond+3~6, rivalry+8~12）
  - M-05: PPV（rivalry+10~15）
  - M-06: タイトルマッチ（rivalry+8~12）
  - M-10: 因縁決着（bond+5~10, rivalry-10~-15）逓減なし
  - M-11: 怪我（圧勝時/名勝負時/通常で異なる非対称効果）
  - M-12: 連敗ストリーク3+（連敗者→勝者 rivalry+2~4）
  - M-13: キャリアベストMQ更新（bond+2~3, rivalry+3~5）逓減なし
- **フック箇所**: App.finalizeShow（通常興行UI）、Engine.executeShow（auto-sim）、applyPPVResults（PPV）、tickWeek（AI団体）
- **重要**: 実ゲームの興行処理は`App.finalizeShow()`（app.js）が担当。`Engine.executeShow`はauto-sim専用。両方にフックを配置
- **AI団体**: M-01のみの簡易処理、逓減なし（処理負荷軽減）
- **M-13タイミング**: careerBestMQ更新処理（app.js）より前に判定（finalizeShow/executeShow/applyPPVResults内）
- **RNGシード**: 通常興行 0xBE2A、PPV 0xBE2B、AI団体 0xBE2C
- 変更: engine.js, app.js
- 設計書: specs/relationship-system-spec-v0.2.md (§2.3, §3.1)、specs/relationship-system-implementation-plan-v1.0.md (Phase 2)

**Phase 3: 団体運営・契約イベントの反映 実装完了（2026-03-07）。** 入団・退団・引退・解雇・レンタル・引き抜きなど団体運営上の出来事をbond/rivalryに接続。14種イベント分類（O-01〜O-14）の全フックを実装。多対一ヘルパー関数と再接触イベント（reunion/grudge/unfinished）を追加。auto-sim 500シーズン ALL CLEAR。

- **多対一ヘルパー**: `Engine.relationships.applyToRoster(state, charId, roster, opts, rng)` / `applyFromRoster(state, charId, roster, opts, rng)` — 逓減なしで1対全員の関係値を一括変動
- **再接触イベント**: `Engine.relationships.checkRecontact(state, charId, rng)` / `applyRecontactEvents(state, events)` — reunion（久々の再会）/ grudge（禍根の再燃）/ unfinished（因縁の持ち越し）の3種
- **イベント分類14種**:
  - O-01: 試合ベースライン（Phase 1実装済み、追加なし）
  - O-02: 入団（bond -3~+3）— app.js `scoutEventResolve`
  - O-03: 退団（bond -15~-8, rivalry +5~+10）— `Engine.contract.processDeparture`
  - O-04: 引退（bond -10~-5、bond60以上の相手のみ）— season-end + executeShow怪我引退
  - O-05: 残留合意（bond +1~+2）— `Engine.contract.resolveNegotiation`
  - O-06: 対立退団（bond -15~-8, rivalry +5~+10）— `Engine.contract.processDeparture`
  - O-07: 解雇（解雇された側→全員 bond -15~-10、残留者→解雇された側 personality別bond）— app.js `releaseFighter`
  - O-08: 突然離脱（bond -10~-5）— `executeShow`
  - O-09: 引き抜き（bond -15~-8, rivalry +5~+10）— `resolvePoach` + `playerPoach`
  - O-10: レンタル加入（bond -2~+2）— `Engine.rental.requestRental`
  - O-11: レンタル帰団（bond -6~-3）— `Engine.rental.processSeasonEnd`
  - O-12: prove mode（本人→全体 bond -8~-5、同世代→本人 rivalry +3~+5）— `Engine.retirement.advise`
  - O-13: 引退撤回（本人→全体 bond +5~+8、全員→本人 bond +2~+3）— app.js `doRetainFighter`
  - O-14: 週次自然変動（Phase 1実装済み、追加なし）
- **RNGシード**: 0xBE3A〜0xBE46
- 変更: engine.js, app.js
- 設計書: specs/relationship-system-spec-v0.2.md (§3.2)

**Phase 1: 人間関係データ基盤 実装完了（2026-03-07）。** GameStateに非対称2軸（bond/rivalry）の人間関係データ構造を追加。全キャラ間の初期値生成（同団体ボーナス/OVR近接/性格・アーキタイプ相性/バックストーリー初期関係）、接触状態判定、週次自然減衰/凍結処理、逓減カウンター減衰を実装。UI表示なし・MQ等への影響なし。データが裏で動くだけの段階。auto-sim 1,000シーズン ALL CLEAR。

- **データ構造**: `relationships`（"idA>idB": {bond, rivalry}）+ `relationshipCounters`（逓減カウンター）
- **Engine.relationships名前空間**: initialize / isInContact / processWeeklyDecay / getDiminishingMultiplier
- **性格相性マトリクス**: personality 7種 × archetype 6種の bond/rivalry 補正。ガウス散らしσ=2.5で個体差。3点根拠（スケール文脈/相対比較/プレイ体験）をコード内コメントに記載
- **バックストーリー初期関係**: 同団体内から2〜4組をランダム生成（同期入団/元タッグ/過去の遺恨）
- **週次処理**: tickWeek末尾に統合。接触あり→bond50方向微減+rivalry微減。接触なし→bond凍結+rivalry超低速減衰。同団体ボーナス+0.2〜+0.5/週
- **パフォーマンス**: processWeeklyDecay 約1.3ms/週（3,306エントリ）。ルックアップテーブル事前構築で最適化
- **デバッグヘルパー**: inspect(state,idA,idB) / topRelations(state,charId,axis,n) / stats(state)
- **セーブ互換**: `_migrated_relationships_v1` — 既存セーブロード時にinitialize自動実行
- **RNGシード**: 初期化 0xBE1A、週次処理 0xBE1B
- 変更: engine.js, app.js

**Phase0 不整合修正6項目 実装完了（2026-03-07）。** B系大型イベント頻度を実用レベルに引き上げ、trust処理・orgPop処理の不整合を修正。乱入システムにクールダウンと振れ幅を追加。auto-sim 50シーズン ALL CLEAR。

- **修正1: B系大型イベント発火レート引き上げ**（engine.js `generateWeeklyEvent`/`generateLargeEvent`）— 種別重み 通知50/選択40/大型10 → 通知35/選択25/大型40。クールダウン 8週→4週。実効レート 2.5%→10%/週、体感1〜2回/シーズン
- **修正2: B4 trust処理統一**（engine.js `processMediaSpotlight`）— 取材大成功時のtrust +3直接加算を`applyCoeff`+`gainMult`+反骨心×1.3経由に変更。全trust変動経路を統一
- **修正3: 因縁決着orgPopボーナス追加**（engine.js `applyPPVResults`）— 1回目（宿敵決着）+1.5、2回目（宿命の相手 最終決着）+2.5。`applyOrgPopChange`逓減適用。イベントログに表示
- **修正4: B3辞退ペナルティ追加**（engine.js `applyLargeEventEffect`）— 対抗戦オファー辞退時 orgPop -1（逓減適用）。辞退/受諾のジレンマ設計
- **修正5: 乱入クールダウン28週追加**（engine.js `Engine.intrusion.check` + app.js）— `lastIntrusionWeek`フィールド追加。check冒頭でabsWeek差分判定。乱入発生時にapp.jsで記録更新。既存セーブ互換（`|| 0`フォールバック）
- **修正6: 乱入heatペナルティ振れ幅拡大**（engine.js + app.js）— -15〜-20固定 → -7〜-20（下限緩和）。「軽傷で済む可能性」がある緊張感に

**財務タブリデザイン実装完了（2026-03-06）。** 収支画面を「総合/収入/支出/給与」4サブタブ＋「今月/年間/全期間」3期間フィルタに全面刷新。`financeHistory`（永続週次決算履歴）新設・`monthlyFinanceBuffer`廃止。salaryBonus毎シーズン末20%自然減衰（1万以下→0クリーン）。auto-sim 300シーズン ALL CLEAR。

**パッチ3項目実装完了（2026-03-06）。** (1)ケアモーダルのキャラ選択をカード型UI（portraitImg+名前+状態タグ+ピンク枠）に刷新。`<select>`廃止、イベント委譲で選択管理。(2)好敵手ペア（resolved=true）をファン期待カードに復帰。matchupLog+rv.lastWeekを使ったクールダウン判定（4週）、priority1で追加、🤝テキスト。(3)ティッカーニュース全面改修: streak追跡（processSettlement+applyPPVResults双方）、generateTicker8カテゴリ書き換え（aiAce/rivalryActive/rivalryGoodRival/champion/championLongReign/economyGood/economyStruggle新設、economy廃止）、NEWS_TICKER_TEMPLATES完全置換（世界観整合・14カテゴリ）。auto-sim 200シーズン ALL CLEAR。

**プロモ改修 v1.0 実装完了（2026-03-06）。** プロモ＝商売コンセプト全面実装。PROMO_POP_CAP 55→70、プロモイベント収入（pop帯別15-85万/週）、MQ蓄積ボーナス（promoStack最大3回×1.3=+3.9）、お任せロジック最適化。auto-sim 1,000シーズン ALL CLEAR。

- **NPC記録完全統一**: processAIWeek興行週にcheckAndApplyBreakthrough/checkLosingStreak/checkSlump/applyShowTrust/MQ連動人気変動を追加。aiSeasonGrowthEvents/aiSeasonPopularity廃止。ゲーム開始時（ドラフト直後）に全98キャラの過去経歴を自動生成（年齢・OVRから逆算した戦績・タイトル歴・ブレークスルー歴・移籍歴）。AI団体タイトルは団体名を冠する（例: 皇武館王座）。設計書: specs/npc-record-unification-spec-v1.0.md
- **プロモ改修「プロモ＝商売」**: PROMO_POP_CAP 55→70。プロモイベント収入新設（pop帯別15-85万/週、握手会・地域イベント等の直接現金）。MQ蓄積ボーナス（promoStack最大3回×1.3=+3.9）。お任せロジック最適化（pop70+stack3で自動練習切替）。ハードモード序盤の資金難を救済する突破口。設計書: specs/promo-redesign-spec-v1.0.md

**AI統一成長モデル v1.0（2026-03-06）。** `aiSeasonGrowth`の一括計算を廃止し、AI選手もプレイヤーと完全同一の`calcGrowth`+`simulateMatch`を週次で通す統一成長モデルを実装。5フェーズ構成。

- **Phase 5: convergenceMul比率ベース化** — trainCap接近逓減を固定値(remaining<10)から比率ベース(`convergenceRatio=0.15`, trainCapの上位15%で減速開始)に変更。trainCap95→OVR80.8から減速、trainCap65→OVR55.3から減速
- **Phase 1: MATCH_GROWTH_BASE定数化** — ハードコード`0.7`を`GROWTH_CONFIG.matchGrowthBase=0.35`に置き換え。試合成長: ~23.2pt/年→~14.9pt/年
- **Phase 2: makeAIFighterフィールド補完** — processAIWeek用に16フィールド追加(schedule/wins/losses/draws/injury/seasonGrowth/intensive/intensiveWeeks/lastMatchResult/careerRecord/durability/wear/seasonInjuries/careerHistory/growthPenalty/trust)
- **Phase 4: AI_COACH_CONFIG導入** — ティア別コーチ環境定数。S級:エース3名(top1=coachMul1.25/intensive30%/practice85%, top2_3=1.18/20%/85%)、一般(1.12/5%/75%)。A級:エース1名(1.18/20%/75%)、一般(1.12/0%/60%)。B級:エース1名(1.12/0%/55%)、一般(1.08/0%/45%)。`getAceConfig`でOVR順位からエース判定
- **Phase 3: processAIWeek新設** — `Engine.rival.processAIWeek(rng, state, org)`をtickWeekパイプラインに組み込み。練習週: aceConfig.practiceRateで練習/休養判定、calcGrowthにoverrideCoachMul引数追加。興行週: OVR近接ペアリング→simulateMatch→試合成長(プレイヤーと同一ロジック)→怪我判定→勝敗記録。aiSeasonGrowth呼び出し廃止、AI離脱イベント(擬似怪我)廃止、aiSeasonGrowthEventsのフラグをslump/motivationLossに統一。A級elite1名保証(initRandomRoster)
- **設計ターゲット**: S級#1=+5.6 OVR/年(最強)、プレイヤー標準=+5.0/年、A級#1=+4.6/年、B級一般=+3.4/年。プレイヤーの後発逸材がS12-13でS級#1にギリギリ追いつく
- **検証**: auto-sim 2,000シーズン ALL CLEAR
- 変更: data.js(GROWTH_CONFIG+AI_COACH_CONFIG), engine.js(calcGrowth/makeAIFighter/processAIWeek/tickWeek/processSeasonEnd/aiSeasonGrowthEvents/initRandomRoster/validateGameState)
- 設計書: specs/ai-unified-growth-spec-v1.0.md

**全セリフシステム personality×archetype 構造化（2026-03-05）。** 全共有セリフ定数をpersonality(7種)×archetype(6種)の2層ネスト構造に統一。21種の既存組み合わせに対して口調・態度の分離された個別セリフを実装。ヘルパー関数 `getDialoguePool(lineObj, fighter)` / `pickDialogueLine(lineObj, fighter)` で一貫したアクセスを提供。

- **変換対象**: SLUMP_START/END_LINES, MOTIVATION_LOSS/RECOVERY_LINES, BREAKTHROUGH_LINES, RETIREMENT_LINES系4定数, AWARD_LINES, NEGOTIATE_LINES, NOTIF_DIALOGUES, CARE_REACTION_DIALOGUES, CHOICE_EVENT_DIALOGUES, LARGE_EVENT_DIALOGUES, EVENT_QUOTES(8エントリ), PPV_OPPONENT_LINES, RIVALRY_RESOLUTION_LINES, ENDING_LINES.fighter, SCOUT_SIGNING_LINES, CONTRACT_NEGOTIATION_LINES
- **ヘルパー**: `getDialoguePool(lineObj, fighter)` → Engine用(seeded RNG併用)、`pickDialogueLine(lineObj, fighter)` → UI用(Math.random)。personality→archetype→`_default`の3段フォールバック
- **SCOUT_SIGNING_LINES再構築**: 旧role×context×ageGroup → context→personality→archetype。SIGNING_TRAIT_LINES廃止（personality×archetypeに吸収）
- **CONTRACT_NEGOTIATION_LINES拡張**: 旧5性格(bold/introverted/carefree/earnest/emotional) → 7性格×archetype。negotiationオブジェクトにarchetype追加。selectDialogueをfighterオブジェクト受け取りに変更
- **getPersonalityType廃止**: 旧personality→introverted/carefree変換マッピング不要に。negotiation生成時にfighter.personality/archetypeを直接格納
- **検証**: auto-sim 3,000シーズン ALL CLEAR
- 変更: data.js, engine.js, ui-common.js, victory-lines.js

**契約更新交渉イベント＋性格・属性フィールド追加（2026-03-05）。** シーズン開幕時、低trust選手との1対1交渉イベント。5性格タイプ×昇給要求/移籍志願の2態度×選択分岐。コンテキスト差し込み（在籍年数・戦績・初期メンバー・ライバル）で体感バリエーション大幅拡張。Notion DB由来の性格（6種）・属性（5種）を全98名に付与。

- **性格・属性フィールド追加**: ALL_CHARS全98名にpersonality(normal/bold/quiet/easygoing/earnest/emotional)とarchetype(normal/ojousama/delinquent/cool/seductive)を追加。getPersonalityTypeは明示的personality優先（quiet→introverted, easygoing→carefree変換）、normalは特性ベース推論フォールバック。spec v1.6→v1.7（§2.8/§2.9/§3.8新設）
- **Engine.contract モジュール**: generateNegotiations（trust閾値判定+特性補正）、resolveNegotiation（選択→結果判定）、determineDeparture（退団先: 引退/ライバル移籍/FA）、getPersonalityType（明示的personality優先→26特性フォールバック）
- **オフシーズンフロー拡張**: offWeek 4に契約交渉を挿入、旧offWeek 4処理をoffWeek 5に移動
- **金銭システム**: salaryBonusフィールド追加（永続的週給加算）、引き留めボーナス（一時金）
- **セリフ30セット**: CONTRACT_NEGOTIATION_LINES（raise_open/transfer_open/raise_accept/raise_negotiate_accept/raise_negotiate_refuse/raise_refuse/transfer_retain_success/transfer_retain_fail/transfer_release/transfer_listen × 5性格）+ コンテキスト差し込みテンプレート
- **UI**: 3画面構成（サマリー→1対1交渉→結果サマリー）、careOverlay再利用、移籍志願→理由を聞く→サブ選択の多段階フロー
- **退団処理**: roster除外+コーチ解除+タイトル空位化+行き先振り分け+ロッカールームモラール影響
- **検証**: auto-sim 10,000シーズン ALL CLEAR
- 変更: engine.js, data.js, ui-common.js, app.js, test/auto-sim.js

**勝利セリフ全面改定＋spec v1.6 data.js完全適用（2026-03-05）。** Excelマスターデータを元にvictory-lines.js全面更新、data.js潜在値同期完了。

- **勝利セリフ改定**: ID 1〜99のうち約50名分を修正。キャラ個性に沿った一人称・語尾・感情表現に全面刷新。変更ID: 1,2,3,4,5,6,7,8,9,11,12,15,16,17,18,21,22,23,24,33,34,35,36,37,38,41,42,43,44,45,46,47,48,52,65,66,67,70,71,72,76,78,81,82,86,90,91,93,95,96,97,98,99
- **東金沙織 潜在値修正**: 潜PWR 151→145、潜SPD 141→134 (spec v1.6反映)
- **椿山みさき 潜在値修正**: 潜PWR 135→137、潜TEC 126→141 (spec v1.6反映)
- **西川ちあき MNT修正**: 潜MNT 130→135 (§2.2.1手動オーバーライド)
- **久堂梨々花 MNT修正**: 潜MNT 109→133 (§2.2.1手動オーバーライド)
- **高島さや 潜在値大幅修正**: 潜PWR 87→129、潜SPD 102→164、潜TEC 85→166、潜STA 83→132 (§2.2.1 14歳中学生の将来性反映)
- 変更: src/victory-lines.js, src/data.js

**PPVカード生成バグ修正＋UI改善（2026-03-05）。**

- **PPVカード生成修正**: generateCardのマッチング優先度を修正。旧: 全ペアを盛り上がりスコア順にgreedy matching→AI同士が先にマッチされプレイヤー選手が余る場合があった。新: Step 2aでプレイヤー選手を先にAI対戦相手とマッチング→Step 2bで残りAI同士をマッチング。プレイヤーがエントリーした選手が確実にカードに載るように
- **空カードスタック防止**: card.length===0の場合、「カード編成不成立」ポップアップ表示→即finalize。旧: 空オーバーレイでボタンなし=操作不能
- **デバッグログ追加**: preparePPVDayでエントリー消失時にconsole.warn出力（ppvEntries空/全員怪我脱落/AI不在/カード空の各ケース）
- **UI改善3点**: (1)今週タブのスケジュール選択を大型化(15px/padding8px)、(2)団体タブのロスターカード全体クリックで育成パネル開閉(旧:小さい▼ボタンのみ)、(3)選手詳細のコーチスタイルバッジを不一致時グレー表示
- 変更: engine.js, app.js, ui-render.js, ui-common.js

**コーチスタイル統一＋マッチ演出（2026-03-05）。** コーチ得意スタイルを選手と同じ6種に統一し、スタイルマッチ状態を色・グローで視覚化。

- **スタイル統一**: コーチの旧4種(pw/sp/te/all)→選手と同じ6種(Grappler/Striker/Speed/Submission/Brawler/Allround)に変更。COACH_STYLE_MATCH中間マッピング廃止
- **2段階ボーナス**: COACH_STYLE_BONUS 0.05(一律)→専門一致+0.08/万能+0.05。専門型コーチを選ぶ意味が生まれる
- **35名再配分**: Allround 14名(40%)→7名(20%)に削減。新分布: Grappler7/Striker4/Speed6/Submission6/Brawler5/Allround7
- **視覚演出**: 全6箇所にCSS glowバッジ。専門一致=緑枠+✦、万能=金枠+○、不一致=灰色半透明。対象: ロスターカード/コーチアサインDD/スタッフカード/コーチツールチップ/スタッフ募集/選手ポップアップ/DBコーチタブ
- **検証**: auto-sim 100シーズン ALL CLEAR
- 変更: data.js, engine.js, index.html, ui-render.js, ui-common.js

**成長バランスリバランス v2（2026-03-05）。** プレイヤーvs AI成長速度の構造的不公平を解消。旧: Player Top5がS8で84(AI 78を逆転)→S13で93.5(AI 79)と独占。新: S12でPlayer 83=AI 83に到達し、中盤〜後半は拮抗した競争が成立。

- **試合成長の適正化**: matchGrowthBase 1.5→0.7（旧: ~40 OVR/season → 新: ~14）。opponentBonus上限0.8→0.5、closeMatchBonus 0.5→0.3。3箇所(engine.js executeShow/applyPPVResults, app.js finalizeShow)を統一修正
- **ブレークスルー適正化**: ジャンプ量3-6→2-4に縮小
- **trainCap接近時の逓減**: calcGrowthに`convergenceMul = √(remaining/10)`を追加（残り10以内で自然減速）
- **AI成長強化**: aiSeasonGrowthに`aiMatchEquivalent=1.15`を追加（AI団体も興行開催による成長を反映）。AI_TIER_LIMITS growthBonus: S 1.05→1.12, A 1.00→1.05, B 0.95→1.00
- **分析ツール**: test/growth-analysis.js（年次別OVR推移・Top5/Top10分布・AI tier別比較）
- **検証**: 20シード×15シーズン分析 + 10シード×100シーズン(1000シーズン)安定性テスト ALL CLEAR
- 変更: engine.js, app.js, data.js, test/growth-analysis.js（新規）

**デバッグ・検証システム導入（2026-03-05）。** `validateGameState(G)` による常時不変条件チェックと、UIなし高速自動シミュレーション `test/auto-sim.js` を実装。

- **Engine.validateGameState(G)**: tickWeek末尾で毎週実行。キャラステータス(pw/sp/te/st/mn 0-200)、人気(≥0)、コンディション(0-100)、trust(0-100)、年齢(10-60)、ロスター枠上限、キャラID整合性、funds/weeklyFinance NaN検出、観客動員上限、week/season範囲、orgPop(0-100)、weekPhase/ppvPhase列挙値、タイトル王者存在確認、因縁相互参照、AI団体データNaN検出、battlePoints妥当性を網羅チェック。違反は`G.debugLog`に記録+`console.warn`で`[WM Debug]`出力。ゲーム進行は停止しない
- **test/auto-sim.js**: `node test/auto-sim.js [シーズン数] [シード]` で実行。vm.ScriptでブラウザJSをNode.jsグローバルスコープにロード。興行カード自動編成(ランダムシャッフル+タイトルマッチ判定)、選択型/大型イベント自動応答、PPVフェーズ自動遷移、スカウト自動獲得を実装。transientフィールド一括消化。tickWeek+advanceWeek毎にvalidateGameState実行+violation収集。ゲームオーバー時はseed変更で自動再起動。MAX_ITER安全弁
- **module.exports追加**: engine.js, data.js, victory-lines.js に `typeof module` ガード付きexportsブロック追加（ブラウザ動作に影響なし）
- **初回実行結果（100シーズン/seed=42）**: 5,200週シミュレーション完了(0.4秒)。検出: condition NaN違反1件（キャラid:21 "木ノ内幸音", Season 1 Week 29〜）、エラー0件、ゲームオーバー0件
- 変更: engine.js, data.js, victory-lines.js, test/auto-sim.js（新規）

**PPV進行バグ修正＋エンディング繰り返しバグ修正（2026-03-05）。**

- **PPV進行バグ修正**: closePPVResultがApp.advanceWeek()を呼んでいたためweek 48→49に進み、ppvTV判定（week===48 && ppvPhase==='tv'）を完全スキップしていた。advanceWeek呼び出しをppvPhase='tv'+initPPVTV()直接呼び出しに修正。weekは48のまま維持しTV中継フェーズを正常に遷移
- **エンディング繰り返しバグ修正**: _checkAndShowEndingの条件`endingClearedSeason === G.season - 1`が新シーズン中ずっとtrueで、毎週エンディングポップアップが表示されていた。`endingShown`フラグを追加し1回限りの表示に修正
- 変更: app.js

**キャラクターデータ同期＋反骨心セリフ追加（2026-03-05）。** NotionキャラDB→Spec→ゲームデータの全面同期。個別特性リバランスと合わせてキャラ41名のデータ修正を反映。

- **キャラデータ同期（41名57項目）**: 特性変更14名（阿武隈塔子:頑丈さ→ガラスの身体、富岡加奈子:遅咲き→闘志+負けず嫌い、高津小春/生駒エリカ:反骨心追加 他）、スタイル変更11名（園部梨花/芝彩音/斎藤麻衣/本郷真理子/西川ちあき/丹羽穂垂/芹沢亜里紗 他）、潜在値手動オーバーライド14項目/11名、身長変更13名、アライメント変更4名
- **反骨心セリフ実装**: NEGOTIATE_LINES（交渉3場面）、CARE_REACTION_DIALOGUES（10種ケアアクション）、CHOICE_EVENT_DIALOGUES（S1-S6,E1）、EVENT_QUOTES（入団/レンタル/対抗戦）、対抗戦前後セリフ（getWarChallengeDialogue/getWarPostDialogue）
- **Spec更新**: character-data-spec v1.4→v1.5（全テーブル反映）、traits-v2.1→v2.2（26特性＋説明文更新）
- 変更: data.js, ui-common.js, specs/character-data-spec, specs/archive/traits-v2.1.md

**個別特性リバランス v1.0（2026-03-05）。** 全26特性の効果見直し＋新特性「反骨心」追加。試合MQ系を控えめに、試合外効果を強化する方針。

- **数値調整5件**: 名勝負製造機 MQ+5→+3、引き出し上手 max+8→+4(ovDiff×0.15)、負けず嫌い 成長×1.20→×1.10、威圧感 モメンタム+5→+3/命中-3→-2/カウンター-3→-2、野心 タイトルMQ+2→+1
- **効果追加7件**: 努力家+練習cond消耗-1、ムードメーカー 成長×1.05→ロッカールーム士気+5/週、適応力+追い込み練習cond-2軽減、ガラスの身体+怪我復帰時人気+2(ファンの声援演出)、闘志+メインイベント低MQペナルティ半減(説明文修正)、ファンサービス+興行出場で人気+1(MQ不問)、ヒール適性+因縁50%確率で+1加速
- **新特性「反骨心」**: cat:special、trust変動×1.3（上昇・下降とも激しい）、trust≤30で成長×1.15（逆境バフ）、isDirectType判定に追加、スカウトプール追加
- **TRAIT_DEFS説明文全件更新**: 実装と説明のズレを解消（闘志「モメンタム回復」→「瀕死から粘る力」等）
- 変更: data.js, engine.js

**PPV GRAND FINAL Step 1-6 全完了（2026-03-04）。** 年末合同興行PPVの全機能が実装完了。

- **Step 1: データ＋エンジン基盤**: data.jsにPPV定数群（PPV_SLOTS/PPV_REWARD/PPV_NAMES/PPV_OPPONENT_LINES/PPV_HYPE_TEMPLATES）追加。engine.jsにEngine.ppv名前空間を新設（checkUnlock/getSlotCount/getAIEntries/resolveInjuries/calcExcitement/generateCard/pickName/generateHype/getOpponentLine/getSummitPair）。GameStateにppvUnlocked/ppvEntries/ppvPhase/ppvName追加。orgPop変動箇所（tickWeek/applyWarOutcome/applySummitOutcome）にppvUnlocked自動チェック
- **Step 2: Week 43/48フロー**: advanceWeekにWeek 43 PPVエントリー発火を追加（ppvUnlocked→ppvEntry/未解禁→tv）。AI団体エントリー自動生成。既存のD-4サミットチェックをPPV統合時スキップに変更。シーズンリセットでppvPhase/ppvEntries/ppvNameをクリア
- **Step 3: エントリーUI**: renderWeekScreenにppvEntry描画（大会名ヘッダー+枠数+チャンピオン自動エントリー+選手選択リスト+確定ボタン）。togglePPVPick/confirmPPVEntry関数。ppvPhaseをentry→lockedに遷移。セーブデータマイグレーション(_migrated_ppv_v2)
- **Step 4: PPV当日演出＋TV観戦＋結果処理**: Engine.ppv.preparePPVDay/simulatePPVMatch/applyPPVResults/simulateTVResults追加。advanceWeekにWeek48 PPV分岐（ppvShow/ppvTV weekPhase）。App._ppvPreview+9関数（initPPVShow/ppvWatchMatch/ppvSkipMatch/ppvSkipAll/_receivePPVBattleResult/finalizePPV/closePPVResult/initPPVTV/closePPVTV）。UI: renderPPVMatchPreview（カード順次公開+煽り文+VS画面+観る/スキップ）, renderPPVResult（全試合結果+報酬+対戦pt）, renderPPVTVResult（テレビ中継簡略表示）。battle-engine iframe連携
- **Step 5-6: 結果処理完成＋演出仕上げ**: applyPPVResultsに因縁MQボーナス(+3/+5/+8)+コーチMQボーナス(+2)+因縁決着判定(checkResolution)+ヒート更新(calcUpdate)+試合成長(stat+1-2)+matchupLog記録を追加。finalizePPVにブレークスルー判定+careerBestMQ+敗北スランプ+モチベ喪失チェックを追加。closePPVResultにポップアップチェーン(因縁決着+ブレークスルー/スランプ)+バフ消費を追加。結果画面にMQボーナス内訳+因縁決着バッジ+ヒート変動を表示。怪我判定なし(condition=80固定)、orgPop変動なし(合同大会)。RNG seed: 0xBBF6-0xBBFA

**フィニッシャーシステム設計完了 + CLAUDE.md策定（2026-03-04）。** フィニッシャーシステムの設計書v1.0を完成。演出レイヤー専用の差し替え方式（エンジン計算に影響なし）、フェーズ連動確率発動、顔画像切り抜きカットイン演出、5ステップ実装計画を確定。カットインビジュアルプロトタイプ（finisher-cutin-demo.html）で演出検証済み。CLAUDE.mdをリポジトリルートに新設し、ゲームの魂（三本柱・感情設計・数値哲学・やらないことリスト・機能追加判断基準）と開発ルールを統合。

**因縁演出強化 + カード鮮度UI（2026-03-04）。** 宣戦布告・決着ポップアップの専用SE新設（4種: rivalry_confrontation / fate_confrontation / rivalry_resolution / fate_resolution）。ポップアップ表示にタメ演出追加。カード編成画面に鮮度プレビュータグ表示（初顔合わせ/マンネリを事前確認可能）。matchupLogマイグレーション修正（既存対戦ペアの初顔合わせ誤判定を解消）。

**引退勧告・引き留めシステム v1.1（2026-03-03）。** プレイヤーが選手に引退を勧告し、受諾した選手がラストラン状態に入る仕組み。拒否時は信頼低下+見返しモードMQボーナス。シーズン末の引退時に引き留め可（最大2回、wear+10代償）。コーチの観察眼ランクに応じた受諾率アドバイス。

- **Engine.retirement**: canAdvise(wear≥20/age≥30/careerSeasons≥8)、calcAcceptance(wear/isChamp/trust/winRate)、advise(受諾→lastRun=true/拒否→trust-5+proveMode4週or morale-2)
- **ラストラン**: lastRun=true → Pass2 MQ+3(基本)+5(メイン) + 因縁ボーナス+3/+5。4週後にシーズン末と同じ引退処理。ポップアップに「🌅ラストラン」バッジ
- **引き留め**: canRetain(retainCount<2, wear<80)。wear+10, retainCount+1, injuryBonus+0.05。retiredFightersからrosterへ移動
- **コーチアドバイス**: E-D:不明確、C:2段階25%flip、B:3段階15%shift、A:4段階5%shift。COACH_RETIRE_ADVICE_TEXTS

**ロスター枠制限 v1.0（2026-03-03）。** プレイヤー団体にハードキャップ（段階解放6→8→10→12→16）、AI団体はidealRosterでハードキャップ化。

- **段階解放**: ドラフト6→タイトル設立8→サバイバルクリア10→対抗戦初勝利12→ランキング1位16。各トリガーで通知ポップアップ
- **AIハードキャップ**: S:16/A:13/B:10（B tier 9→10に変更）。aiScout: need+1廃止。aiInterTransfer: idealRoster+2→idealRosterに統一
- **全獲得経路チェック**: signFighter/scoutEventResolve/resolveNegotiation の3経路で `ownCount >= rosterCap` ガード
- **UI**: ロスター画面「所属 N/M名」ヘッダー、スカウト画面キャップ警告バナー、ポップアップ獲得ボタン無効化
- **マイグレーション**: 旧セーブ互換（titleEstablished/survivalCleared/warWon/ranking1位から逆算）

**MQスコア減点制リデザイン v2.0（2026-03-03）。** 加点制を廃止し「天井−減点」方式に全面移行。OVが試合品質の上限を決め、ドラマ・ペース・決着不足で減点される設計。

- **天井（OVシーリング）**: avgOV≤50: `20+OV×0.60`（OV40→44）、≤80: `50+(OV-50)×1.10`（OV70→72）、超: `83+(OV-80)×0.85`（OV90→92）。clamp(15,100)
- **ドラマ減点**: 基本-30。KO×8（上限2回）・カウンター×2.5（上限3）・逆転×1.5（上限3）・大技×0.4（上限6）で回復
- **ペーシング減点**: 7-14ターン=0（理想）、5-16=3（許容）、<5=12（瞬殺）、17+=6（だらだら）
- **決着減点**: フォール/ギブアップはフェーズ連動(Climax:0/End:1/他:3)、ピン=0、丸め込み=1、TKO=2、タイムアウト=10
- **`finishPhase`フィールド追加**: simulateMatch戻り値に決着フェーズ名(`'Opening'|'Mid'|'End'|'Climax'|'Timeout'`)を追加
- **`mqDetail`フィールド追加**: デバッグ用内訳 `{ ceiling, dramaPenalty, pacingPenalty, finishPenalty }` を戻り値に追加
- **外部ボーナス・Pass 2は変更なし**: キャップ+15、因縁/タイトル/コーチ等のボーナスは維持
- **シミュレーション結果**: OV40同士avg 43→23、OV80同士avg 57→62（高OVは正当に評価される設計）
- 変更: engine.js のみ（L247, L317-356の各決着箇所, L374-391 MQ計算ブロック, return文）
- 設計書: `specs/mq-deduction-redesign-v2.0.md`

**ランキング計算刷新 Phase 1（2026-03-03）。** ティア固定ハンデ・頭数依存ランキングを廃止し、TOP5ベースの基礎力＋対戦ポイントの新計算式に移行。

- **新ランキング計算式**: `rating = TOP5平均OVR × 1.5 + TOP5平均pop × 1.0 + battlePoints`
- **championScore廃止**: RIVAL_ORGS から championScore プロパティ削除（旧: S=60/A=40/B=20/Player=0or30）
- **summitBonus廃止→battlePoints統合**: `state.summitBonus` を削除し `state.battlePoints: { player:0, org_s:0, org_a:0, org_b:0 }` に移行。シーズンリセット対象
- **対戦ポイント移動**: 対抗戦勝敗で±12pt、頂上決戦勝敗で±10pt のゼロサム移動を実装
- **引き抜きシステム改修（2026-03-08）**: 主力帯ペナルティ追加（OVR1位-20/2-3位-12/4-5位-7）、trust連動（trust60+-18/trust<40+8/trust<25+15）、trust75+で門前払い（isNegotiationBlocked）、成功率→曖昧ラベル表示（getRateLabel）、clampMin 5→3/clampMax 70→65。trust拒否セリフはpersonality×archetype分岐で新設。auto-sim 100シーズン ALL CLEAR
- **BATTLE_POINT_CFG定数**: war:9, summit:7, tournament:{champion:20,runnerUp:8,semiFinal:0,firstRound:-14}, tournamentWeek:24
  - S級-A級ティアバランス調整（2026-03-08）: war 12→9、summit 10→7（S-A間baseScore差~15ptをサミット1敗で逆転できる問題を修正）
  - 同調整で AI_COACH_CONFIG.S.general 強化: coachMul 1.12→1.18、intensiveRate 0.05→0.12、practiceRate 0.75→0.80
- **Engine.ranking全面書換え**: `calcStarPower`/`calcTotalPop` 廃止。`_topNAvg(roster, valueFn, n)`/`calcBaseScore(roster)`/`calcOrgRating(roster, battlePt)` 新設
- **ランキングUIリニューアル**: テーブル列を「⭐スター / 👥人気計」→「基礎力 / 対戦pt」に変更。対戦ptは色分け表示（正=緑/負=赤）。ツールチップ更新
- **団体比較レーダーチャート更新**: 「エース力」→「TOP5実力」（TOP5平均OVR/90×100）、「スター度」→「TOP5人気」（TOP5平均pop/80×100）に変更
- **セーブデータ互換**: `_migrated_ranking_v2`。旧summitBonus→battlePoints.player移行。ランキング再計算
- 設計書: `docs/ranking-roster-redesign-v1.0.md`
- 変更: data.js, engine.js, app.js, ui-render.js

**選手成長リバランス v1.0（2026-03-03）。** プレイヤー(+3 OVR/年)とAI(+8 OVR/年)の構造的不公平を解消。「シーズン予算」モデルに統一。

- **GROWTH_SEASON_BASE = 8.0**: 4ステ合計の1シーズン成長予算（ageMul=1.0時）。プレイヤー・AI共通基盤
- **calcGrowth全面書換え（shareベース）**: convergenceFactor+STYLE_GROWTH方式を廃止。`share = remaining / totalRemaining` で残距離比例配分。`perPractice = (seasonBudget × ageMul × coachMul × practiceShare × share) / 9`。特性ボーナス（ムードメーカー/リーダー気質/負けず嫌い）・variance（努力家/破天荒）・intensiveMul維持
- **×0.4練習補正撤廃**: tickWeek processManage内の `growth * 0.4` を2箇所（intensive/practice）から削除。penMult/statusMult/trainingBoostMult/trainerMultは維持
- **ageMultiplier新カーブ**: ≤17:0.8（新人）、18-19:1.1（急成長期入口）、20-22:1.3（黄金の成長期）、23-25:1.0（安定）、26-28:0.6（仕上げ）、29-30:0.15（ほぼ停止）、31-32:0.05（微成長）、33+:0。早熟/晩成/遅咲き特性修正は維持
- **aiSeasonGrowth書換え**: STYLE_GROWTH×convFactor方式を廃止。`seasonBudget = GROWTH_SEASON_BASE × ageMul × coachMul × tierGrowth` のshare配分に統一。facilityMul参照削除
- **AI離脱イベント（怪我擬似反映）**: processSeasonEndにS級10%/A級12%/B級15%の離脱判定追加。`_aiGrowthHalf=true`で成長50%カット
- **AI_SEASON_CFG整理**: trainWeeks/seasonVariance*/matchGrowthBase/matchesPerSeason/matchVariance*を削除。popConvergeRate/popRandomRange/tierPopBonusのみ残置
- **practiceShare: 0.6**: GROWTH_CONFIGに追加。練習:試合 = 6:4 の予算配分
- **convergenceFactor deprecation**: 関数は残置、非参照化。deprecationコメント追加
- 設計書: `docs/growth-rebalance-design-v1.0.md`
- 変更: data.js, engine.js

**コーチ上半身画像＋データベースコーチタブ（2026-03-03）。** コーチ詳細ポップアップに上半身WebP画像を追加し、データベースタブにコーチ一覧を新設。

- **コーチ上半身画像**: `image/coach/upper_coach_*.webp` — 全35名分のWebPファイルを配置（ユーザーが上書き可能なプレースホルダー）。`getCoachUpperUrl(id)` 関数追加
- **コーチ詳細ポップアップ刷新**: バナー方式→選手ポップアップと同様のサイドバイサイドレイアウト（左: 上半身画像160×240px、右: 名前・グレード・特性・指導力/観察眼/得意/成長倍率）。ポップアップ幅380px→520pxに拡大。画像なし時はフェイス画像にフォールバック
- **データベース「全コーチ」タブ**: サブタブ順を「全選手→全コーチ→団体比較→殿堂」に変更。グレード・名前・指導力・観察眼・得意・特性・給与・雇用費・状態を一覧表示。グレードフィルタ+名前検索+全カラムソート対応。行クリックでコーチ詳細ポップアップ表示
- 変更: data.js, index.html, ui-common.js, ui-render.js, image/coach/upper_*.webp (35枚追加)

**バランス調整 v1.9（2026-03-03）。** AI団体成長バランス・年齢カーブ型契約費用・逸材特別交渉枠の3点を実装。

- **変更C: AI団体成長バランス調整**: RIVAL_ORGS facilityMulを全て1.00に（実質廃止）。AI_TIER_LIMITS growthBonusをS:1.20→1.05、A:1.05→1.00、B:0.90→0.95に再調整。プレイヤーに施設システムがないためfacilityMulが歪めていた問題を解消
- **変更B: 年齢カーブ型契約費用**: ageMarketMultiplier関数追加。21歳以下の逸材+個性2つ以上に若手プレミアム(1.10-1.35)、26-27歳0.95、28-29歳0.85。30歳以降は既存reassessに委譲（二重適用なし）。calcAssessedValueに組み込み
- **変更A: 逸材特別交渉枠（FA専用）**: orgPop≥25到達時にG.eliteTicket=true。FA一覧でeliteティア選手1名のreqPopを無視して交渉可能（1回限り、superElite不可、スカウト不可）。canNegotiateにcontext/state引数追加。🎫バッジ+金枠ボーダー+使用確認メッセージ。tickWeekで検知→_pendingEliteTicket transient→processWeekでgoldポップアップ通知
- 設計書: `specs/balance-adjustment-spec-v1.9.md`
- 変更: data.js, engine.js, app.js, ui-render.js, ui-common.js

**因縁決着システム＋因縁MQボーナス半減（2026-03-03）。** 因縁に「決着」のゴールを追加し「発生→盛り上がり→決着→報酬」のサイクルを完成。2段階演出（試合前の宣戦布告→試合後の決着セリフ）でカタルシスを演出。因縁MQボーナスも約半分に引き下げ。

- **因縁MQボーナス半減**: 因縁+5/宿敵+8/永遠のライバル+12 → +3/+4/+6に引き下げ
- **決着条件**: 宿敵以上(matches>=4)で対戦しMQ>=動的閾値で決着成立。閾値=天井×0.80(下限30,上限50)。matchesゼロリセット+両選手pop+4+orgPop+1.5（永遠のライバル: pop+6, orgPop+2.5）。v2.1で固定50から動的化（低OVR帯の因縁破綻を修正）
- **宣戦布告ポップアップ（試合前）**: 宿敵+ペアの試合開始前に対決前セリフをコール＆レスポンスで表示。通常5パターン+永遠のライバル専用3パターン。SE: Audio.play('war')
- **決着ポップアップ（試合後）**: 勝者/敗者のセリフ＋ボーナス明示。永遠のライバル専用セリフ+赤枠+金枠演出。SE: Audio.play('award')
- **クールダウン**: 決着後lastResolvedWeek記録、同ペアは4週間ファン期待カードに出さない
- **ポップアップ連鎖**: eventPopups → 決着ポップアップ → growthPopups → retirementPopups
- **Engine.title.checkResolution()**: 決着判定ヘルパー。deferredRivalryPairsパターンで宿敵+ペアのrecordRivalryをMQ確定後まで保留
- 変更: data.js, engine.js, index.html, ui-common.js, app.js

**ヘルプ画面全面書き直し（2026-03-03）。** 度重なる更新で古くなっていたヘルプ画面を全11セクションに再構成。

- **誤り修正**: 満員率ボーナス（旧×1.5/×1.2→正×1.2/×1.1）、興行頻度（旧4週に1回→正2週に1回＝偶数週）
- **新セクション追加**: 信頼・士気・ケア、成長・衰え・引退、人気・MQシステム、イベント
- **既存セクション更新**: スカウト→スカウト・レンタルに統合、会場10段階・リスク指標の説明追加、スケジュール4種（バランス/練習優先/プロモ優先/休養重視）の説明追加、コーチシステム詳細化、ゲームオーバー条件の明記
- **セクション構成（全11）**: ゲームの目的/基本の流れ/団体・育成管理/興行の組み方/スカウト・レンタル/引き抜き交渉/信頼・士気・ケア/成長・衰え・引退/人気・MQシステム/イベント/序盤攻略のコツ
- 変更: index.html

**コーチ名フルネーム統一＋道場バナー中央配置（2026-03-02）。**

- **コーチ名統一**: 旧コーチ8名の肩書き付き名前（道場長/トレーナー/師範/フィジカルコーチ/メンタルコーチ/総合アドバイザー/セコンド/マネージャー）をフルネーム形式に変更。新コーチ（ID 9〜）と命名規則を統一
- **道場バナーキャラ配置**: 選手アイコンを右下端→バナー中央（上下左右）に移動。リング上で練習している演出に
- **コーチバッジ簡素化**: 肩書き除去の正規表現→姓のみ表示（`name.split(' ')[0]`）に簡素化
- 変更: data.js, index.html, ui-render.js

**会場規模連動の試合数システム（2026-03-02）。** 固定試合数（通常4/特別興行6）を廃止し、会場規模に応じた動的試合枠に変更。

- **VENUES maxMatches追加**: 公民館3→小ホールA/B 3→市民会館4→中ホールA 4→中ホールB 5→大ホール5→アリーナ6→大会場7→ドーム8。会場が大きいほど試合数が多い自然な成長感
- **特別興行/PPVボーナス**: 全会場で+1試合（上限8でキャップ）。「最大6試合」ハードコードを完全除去
- **Engine.util.getMaxMatches(week, venueIdx)**: 試合数計算の単一ソース。engine.js/ui-render.js/ui-common.js/app.jsの全箇所で使用
- **CARD_DEPTH_MULT拡張**: 6要素→8要素（7,8試合目は1.0）
- **会場カードに試合枠表示**: 「試合枠: N試合」を会場選択UIに表示。特別興行時は「(+1)」も表示
- **showCard動的調整**: 初期値を空配列`[]`に変更。renderShowPrepのpad/trimで会場に応じて自動リサイズ
- 変更: data.js, engine.js, ui-render.js, ui-common.js, app.js

**レンタルシステム全面リニューアル（2026-03-02）。** レンタルシステムを単発→複数枠・シーズン単位契約に刷新。UI大幅改善。

- **データモデル変更**: G.rental(単体)→G.rentals(配列)。契約: {fighterId, fromSource:'rival'|'fa', fromOrgId, seasonsLeft, fee}
- **RENTAL_CONFIG**: minSeasons:1, maxSeasons:4, topExclude:3, faTierMul:0.85, tierMul:{S/A/B}, getMaxConcurrent(rosterSize)
- **費用**: 前払い一括。calcSeasonFee = pow(ovr/50,2.5)*25*tierMul*12*seasons
- **供給元**: ライバル団体(OVR上位3名除外) + フリーエージェント(制限なし)。表示候補20名に拡大
- **シーズン末処理**: advanceWeek offWeek1でEngine.rental.processSeasonEnd。seasonsLeft--→0で帰団
- **確認ダイアログ**: レンタル実行前にshowConfirmで顔アイコン+費用+期間+残り資金を確認表示
- **ソート機能**: レンタル候補テーブルの名前/総合/費用カラムをクリックで昇降順ソート（▲/▼表示）
- **期間表記変更**: 「シーズン/季」→「期(N週)」に統一（12週=1期）
- **タイトル制限**: レンタル選手はタイトルマッチ出場不可（3箇所チェック）
- **orgPop貢献50%**: レンタル参加試合のMQ重み付け=0.5
- **ロスター分離表示**: 金枠セクション「🤝 レンタル枠（N/M）」で区分表示
- **マイグレーション**: _migrated_rental_v2。旧G.rental→G.rentals変換
- 変更: data.js, engine.js, ui-render.js, ui-common.js, app.js

**道場バナーシーン化＋「スタッフ室」改名（2026-03-02）。** 道場ヘッダーをシーン風に演出。「スタッフ室」→「スタッフ募集」に改名。

- **道場バナーシーン化**: dojo-headerをposition:relativeコンテナ化。バナー画像上にグラデーションオーバーレイ（下部→半透明黒）を重ねる。左下にコーチ吹き出し（報告あり:コーチアバター+報告テキスト、報告なし:先頭コーチ+雰囲気テキスト、未雇用:emoji+テキストのみ）。右下に雰囲気レベル連動の選手アイコン（level1:0人、level2:0-1人、level3:1人、level4:1-2人、level5:2-3人）をseedRNGで週固定選出、±5pxのY軸揺らぎ。選手アイコンは全員吹き出し付き（15種の掛け声テキスト、13-19sサイクルでループ、毎サイクル被りなしランダム差し替え）。クリックで選手ポップアップ連携
- **CSS新規11クラス**: .dojo-header-overlay, .dojo-scene-coach, .dojo-scene-coach-avatar, .dojo-scene-bubble, .dojo-scene-bubble .coach-name, .dojo-scene-fighters, .dojo-scene-fighter
- **「スタッフ室」→「スタッフ募集」改名**: 5箇所（index.html×3: ボタン/パネルタイトル/ヘルプ文、ui-render.js×1: 未雇用案内、app.js×1: ミッション説明）
- 変更: index.html, ui-render.js, app.js

**タブ統合＆並び替え（2026-03-02）。** 育成タブを廃止し団体タブに統合。ナビバー並び替え。

- **育成タブ廃止**: `screen-training` HTML・`renderTraining()` 関数・ナビボタンを完全削除
- **団体タブに統合**: 道場ヘッダー（雰囲気テキスト+コーチ報告）を団体タブ冒頭に移植。選手カードに▼展開ボタンを追加し、ステータスバー+伸びしろ+コーチアサインドロップダウンを展開表示。成長ログパネルを団体タブ末尾に配置。カード内にコーチバッジ+成長傾向矢印をインライン表示
- **今週タブに⚡追込ボタン追加**: スケジュールテーブルに⚡列を追加。manageフェーズ中のみ操作可能。負傷/体調不足/連続上限でdisabled
- **ナビバー並び替え**: 今週→興行準備→団体→スカウト→ランキング→データベース→収支→ログ→セーブ→ヘルプ（10ボタン）
- **互換性**: `showScreen('training')` → `'roster'` にフォールバック（セーブデータ互換）
- **テキスト更新**: クエスト2件の「育成画面で」→「団体画面で」、コーチツールチップ「育成画面で」→「団体画面で」、ヘルプ画面を団体タブ/今週タブベースの説明に書き換え
- **選手カードレイアウト変更**: 2列グリッド→1列フレックス（展開パネル収容のため）
- 変更: index.html, ui-render.js, ui-common.js, app.js

**L1: 会場システム全面再設計（2026-03-02）。** 会場自動昇格制を廃止し、プレイヤーが毎週自分で会場を選ぶシステムに変更。

- **VENUES 10段化**: 旧7段（公民館〜ドーム, popReqロック制）→ 新10段（公民館〜ドーム, 全会場選択可能）。序盤帯を細かく刻み（小ホールA/B、中ホールA/B、大ホール追加）、段階的ステップアップの選択肢を拡充
- **基礎集客カーブ刷新**: 旧`(orgPop/100)²×10000` → 新`BASE_ATTENDANCE_CURVE`（21点区間線形補間）。orgPop 5で60人〜orgPop 100で30,000人の滑らかなカーブ。相応の会場で70-90%埋まる設計
- **週次揺らぎ**: ±17%ランダム係数（seed 0xA77E で再現可能）。プレビューでは揺らぎなし（rng=null）、実行時のみ適用
- **勢い補正（momentum）**: 満員(95%+)→+4%、大入り(80%+)→+2%、空席(30-60%)→-3%、ガラガラ(<30%)→-5%+orgPop-0.5。上限±15%。連続満員で好循環、ガラガラで悪循環
- **ざっくり予測**: 正確な集客数を非表示に。3段階テキスト（盛り上がりそう/まずまず/客足が心配）で手応えだけ表示
- **リスク指標UI**: 会場カードにbaseAtt/cap比率で◎安全/△挑戦/✕危険を色分け表示（緑/橙/赤ボーダー）
- **セーブマイグレーション**: 旧7段venueIdx→新10段へ自動変換（venueMap）。attendanceMomentum初期化
- 変更: data.js, engine.js, app.js, ui-common.js, ui-render.js, index.html

**バグ修正バッチ+画像拡大パス+給料連続関数化+ファン期待リアクション（2026-03-02）。**

- **バグ修正バッチ(R2/B1/B3)**: AUTO_DELAY 3000→2500ms（battle-engine.html）、showFinishClickBtn AUTO自動送り対応、イベントポップアップ拡大（max-width 340→450px、顔画像 72→120px）
- **画像拡大パス(R1)**: ケア反応トースト 40→120px（縦レイアウト化）、試合結果 勝者90→180px/敗者70→110px/ドロー80→140px、選択/大型イベント 52→88px、育成画面 80→100px。`.care-reaction-toast` CSS新設
- **給料連続関数化(R4)**: SALARY_TABLE（7段テーブル）→ SALARY_PARAMS 連続指数関数。base = A*exp(B*OVR) + popMax*(pop/100)^popExp + titleBonus。OVR35:5万〜OVR95:194万の滑らかなカーブ
- **ファン期待リアクション(R3)**: ファン期待カードの試合後にMQ分岐リアクションポップアップ表示。MQ≥55:好試合（gold tone + 歓声5パターン + 勝者セリフ5パターン）、MQ<55:凡戦（neutral tone + 残念4パターン + 勝者セリフ4パターン）。autoCloseMs 2500対応。FAN_EXPECT_REACTIONS定数（data.js）、fanExpectMatchフラグ（engine.js/app.js両パス）

**コーチ新キャラクター27名反映+画像フォルダ分離（2026-03-02）。**

- **コーチキャラクター全面刷新**: ALL_COACHES id 9-35 の27名を新規キャラクターに差し替え。name（フルネーム形式）・emoji・desc・profile・age・gender・origin を更新。機械的パラメータ（grade/teaching/observation/style/trait/salary/hireFee/minOrgPop）は変更なし
- **世界観整合**: 「元プロレスラー」経歴4名を別スポーツに変更（id30:BJJ黒帯、id31:バレー代表監督、id33:テコンドー五輪銀、id34:柔道五輪金）。女子プロレスが国民的スポーツの世界観に合致
- **名前修正**: id33 葉月レナ→葉月レミ（実在人物との重複回避）
- **画像フォルダ分離**: コーチ肖像画を `image/coach/` サブフォルダに移動。既存8枚を移動＋新規27名の仮画像を配置（全35枚）
- **COACH_PORTRAIT拡張**: id 1-8 のみ → id 1-35 の全35名にマッピング追加。`getCoachPortraitUrl` パスを `../image/coach/` に変更
- **肖像画プロンプト文書**: `docs/coach-portrait-prompts.md` を27名分の新キャラに全面更新（Danbooru形式プロンプト+格納フォルダ記載）

**リデザイン Phase C+D 実装完了（2026-03-01）。** 観察眼システム（§2）+ ロッカールーム可視化（§3）+ バグ修正2件。

- **§2 観察眼システム**: Engine.coach.generateReport — 非興行週に25%/週でコーチ報告生成。観察眼ランク別テキスト（E-D:漠然、C:選手名+ムード、B:選手名+ステータス名、A:天井接近ヒント）。COACH_OBS_INACCURACY揺らぎ（的外れ時に報告方向が反転）。_pendingCoachReport transient → currentCoachReport（1週持続、育成画面インライン表示）
- **§3 ロッカールーム可視化**: Engine.lockerRoom.getAtmosphereText — lockerRoomMorale±10ノイズ→5段階雰囲気テキスト。render時生成（Date.now()ソルトで意図的非決定性）。育成画面冒頭に道場ヘッダー+雰囲気テキスト常時表示
- **バグ修正**: _pendingTeamSpirit がtickWeekで未転送（チームスピリットトースト未発火）を修正。renderWeekScreen L641 の streak未定義エラーを修正
- **UI**: .dojo-atmosphere（level-1~5色分け）、.coach-report-bubble（ゴールド枠吹き出し、クリックでコーチツールチップ連携）

**リデザイン Phase A〜E 全完了。** 設計書: `docs/coach-lockerroom-redesign-v1.0.md`

**Phase1-7 セリフバリエーション拡充+バランス調整セッション完了。** セリフ73個追加+バランス微調整4点。

- **セリフ拡充（data.js）**: LARGE_EVENT_TEXTS +12（B1:3→6, B2:2→5, B3:2→5, B4:2→5）、LARGE_EVENT_DIALOGUES +17（B3_challenger:8→13, B3_decline:3→7, B3_result_lose:3→7, B3_result_win:3→7）、CHOICE_EVENT_DIALOGUES +11（E1特性別4行+default2行, S4_silent:1→3, E6:+2）、NOTIF_EVENT_TEXTS +12（全タイプ4→6）、NOTIF_DIALOGUES新設 N2/N5_warning キー各6行、ENDING_LINES +9（fighter:10→15, coach:6→10）
- **N1ウェイト増**: w:2→3（trust管理の報酬感強化）
- **N2/N5_warningセリフ有効化**: getNotifDialogue の早期リターン条件削除
- **S4 低コスト第4選択肢**: funds<200時「励ましの言葉をかける」（信頼度+3、無料）
- **逆境チームスピリットバフ**: funds<300 && morale>=50 && week%4===0 でランダム1名trust+1、トースト表示
- **トースト表示時間動的化**: 固定7秒→テキスト長に応じて9〜15秒（ui-common.js）
- **TEAM_SPIRIT_TEXTS**: 4パターン新設（data.js）
- 変更: data.js, engine.js, app.js, ui-common.js

**大型イベントB1〜B4セッション完了。** v2.0イベントシステム Phase1-6 を実装。

- **B1 練習中の怪我**: 単発3択モーダル（特別治療-200万/通常/無理させる）。injury+growthPenalty適用
- **B2 選手間の深刻対立**: 3段階フロー（対立報告→秘密介入→試合結果）。trust低い2選手が対立、試合で決着
- **B3 他団体対抗戦**: 3段階フロー（挑発オファー→代表選手選択→試合結果）。AI団体から憎たらしい態度の挑戦者
- **B4 メディア密着取材**: 選手選択→3興行追跡→avgMQ評価。興行準備画面にスポットライトバナー表示
- 発生率: 2.5%/週（非興行週のみ）、8週間クールダウン
- 変更: data.js, engine.js, app.js, ui-common.js, ui-render.js, index.html

**データベースタブセッション完了。** データベースタブ・選手ポップアップ刷新・5能力値カラム・プロフィール拡充を実装。

- **データベースタブ（3サブタブ）**: 全選手一覧（ソート・フィルター対応）/ 殿堂一覧 / 団体比較（デュアルレーダーチャート）
- **選手ポップアップ刷新**: 上半身画像（200×300 webp + onerror fallback）+ レーダーチャート + ステータスバー並列表示。因縁・ファン期待・戦績セクション追加
- **drawRadarChart()汎用関数**: Canvas 2D 5角形レーダー。単一/デュアルデータセット対応。ポップアップ・団体比較で共用
- **5能力値カラム**: 全選手一覧テーブルにPW/SP/TE/ST/MNカラム追加。各カラムでソート可能。色分け表示（75以上=固有色、60以上=白、未満=薄色）
- **CHAR_PROFILES拡充**: 主要キャラ約85名のプロフィールを1-2行→3-4行（200-280文字）に拡充。戦闘スタイル・性格・強み弱みの掘り下げ

**v2.1 BGMセッション完了。** エンディング/ゲームオーバー/BGMファイル再生を実装。

- **クリア演出**: 年間1位でシーズン終了時に5スライドのエンディング（awardsOverlay再利用）
- **ゲームオーバー**: funds≤0 で weekPhase:'gameover' → gameoverOverlay 表示。autoSave 上書きなし
- **BGMファイル再生**: FileBGM（HTMLAudioElement ベース）。`Audio.fileBgm` として公開
- **クレジット画面**: タイトルに Credits リンク追加。楽曲クレジット（序・序曲 / MOMIZizm MUSiC）表示
- **BGM Autoplay対応**: `_endingNext()` 内 idx===0（「開始▶」クリック直後）でBGM開始

**セッション33完了。** ビジュアル観戦バトルエンジン品質改善。

- **バトルエンジン耐久性調整**: hpScale 0.90→1.20、defStaScale 0.02→0.06、pinAttemptHpThreshold 0.35→0.28、pinAttemptMinDmg 9→10。OVR80同士の試合が3ターンで終わる問題を解消
- **状況依存技選択**: selMoveにHP比率を導入。相手HP<30%で65%フィニッシャー(d≥12)優先、自分HP<25%で40%逃げ技(rollup/弱サブミッション)優先
- **フィニッシュ確率傾斜**: End/Climaxで低d技(d<10)のフォール試行率をd/10に低減（ハードゲートではなく傾向）。アームドラッグ(d=4)での決着確率が大幅低下

**セッション32完了分。** バグ修正2件 + UX改善1件 + 難易度微調整1件。

- **UX改善**: ロスターソートに「育成」ソート追加 — 強化練習→練習→バランス→プロモ→休養の順で整列。同タグ内はOVR降順
- **Bug修正**: 補助金が「推定週間収支」に反映されていない表示バグ — `Survival.estimateWeeklyNet` の `totalBaseIncome` に `getSubsidy()` を追加。「固定収入」表示も正確に（orgPop 32なら+10万→+30万）
- **難易度調整**: SUBSIDY_TABLE に orgPop 30〜34 帯（45万/週）を新設 — 30の崖（65万→20万、-45万落差）を（65万→45万→20万）の2段に緩和
- **Bug修正**: 育成画面の「今週の行動」が前週の行動を表示し続けるバグ — `previewAction` が `c._weekAction`（前週記録）を優先参照していた。常に現在の `c.schedule` から算出するよう修正。「休養を選択済みなのに反応しない」問題も解消

**セッション31完了分**: バグ修正1件＋UX改善5件＋難易度崖緩和3件。ケアモーダルCSS修正・ケアアクション確認ダイアログ・おまかせボタン両週対応・getMQAdjust 4段階化・逓減×0.70・補助金20-29帯65万。NPC選手戦績非表示・ランキング画面「選手を見る」構造改修・NPC特性表示（_migrated_npc_traits）・FA初期年齢16-20修正・収支報告過去4週集計。

セッション30完了分: 月末再試合バグ修正・ケアシステム週次制限・getMQAdjust導入。セッション29完了分: タイトルマッチ格差ペナルティ＋特性4種実装（適応力/人望/忠誠心/野心）。v2.0イベントシステム Phase 1（Step 1〜5）完了。

---

## 次の実装予定

### Trust総合リバランス + ケアストック制 + マイナスイベント群（設計: 2026-03-09チャット）

> シミュレーション検証ファイル: `trust-catalog-sim.js` / `trust-param-search.js`（チャットで作成）
> 設計根拠: 現行trustは出場さえすれば均衡98で全員自発残留(75+) → ケアアクションが信頼面で無意味。
> 目標: 出場のみの均衡を60-70に下げ、ケアを「状況への対処」に戻す。

#### Phase T1: Trustグラビティ導入 ✅ 実装済み（2026-03-10）

確定パラメータ: gravity=0.04, anchor=60。auto-sim 500シーズンALL CLEAR。

#### Phase T2: 定常マイナス要素 ✅ 一部実装済み（2026-03-10）

M3（低MQ不満）のみ実装。M1/M2/M4/M5は設計検証の結果廃止（不要と判断）。

| ID | 名称 | 状態 |
|----|------|------|
| M3 | 低MQ不満（MQ<40で-0.46/興行） | ✅ 実装済み |
| M1/M2/M4/M5 | マンネリ/連勝慢心/シーズン疲弊/世代交代 | 廃止 |

#### Phase T3: ケアアクション・ストック制リデザイン ✅ 実装済み（2026-03-10）

| タスク | 状態 |
|--------|------|
| ストック管理: 最大5、4週ごとに+1回復、オフシーズン中も回復 | ✅ 実装済み |
| 合宿=2ストック消費、打ち上げ=1ストック消費 | ✅ 実装済み |
| 声かけ=ストック消費なし、週1回制限維持 | ✅ 実装済み |
| ボーナス: trust上昇のみ（変更なし） | ✅ 実装済み |
| コスチューム: pop永続上昇廃止 → 次試合MQ+2一時バフ | ✅ 実装済み |
| メディア: pop+4廃止 → orgPop +0.4（逓減適用） | ✅ 実装済み |
| トレーナー: 変更なし | — |
| 特別治療: 確率ベース短縮(1週50%/2週35%/3週15%、8週+で+1週) | ✅ 実装済み |
| リフレッシュ休暇・打ち上げ・合宿: 据え置き | — |
| UI: ストック残量表示⚡ N/M、各アクション消費量表示、ストック不足disabled | ✅ 実装済み |

#### Phase T4: 単発ガツン系イベント（bond/rivalryシステムと連携）

1つずつ段階実装。各イベントはrelationshipsのbond/rivalry変動を伴う。

| ID | 名称 | 発火条件 | 主効果 | 関係値連携 | 重さ | 状態 |
|----|------|----------|--------|------------|:----:|------|
| S_scandal | スキャンダル発覚 | pop40+ & trust60+、年1-2回 | 本人trust -12〜-18、orgPop -1〜-3。選択肢: かばう/厳正処分/放置 | roster→本人 bond -2〜-5。処分選択でrivalry変動 | 中 | 未着手 |
| S_powerstruggle | 派閥抗争 | roster12+ & trust70+が3人以上 | 関係者2-3人のtrust -6〜-10。選択肢: 一方支持/中立/全体MT | 関係者間 bond -15〜-20、rivalry +5〜+10。支持された側→不支持側 rivalry +8〜+15 | 大 | 未着手 |
| S_humiliation | 大一番の惨敗 | タイトルマッチ/PPVでMQ35以下（自動発火） | 敗者trust -8〜-12。選択肢: 励ます/敗因分析/触れない | 対戦相手→敗者 rivalry +5〜+8。roster→敗者のbond変動は選択依存 | 中 | 未着手 |
| S_betrayal | 裏切り退団 | trust20-35 & 対抗戦出場 & 敗北（低確率） | 本人即退団、全員trust -3〜-5。選択肢なし | 全ペア→裏切者 bond大幅低下、rivalry大幅上昇（将来の因縁フラグ） | 中 | 未着手 |
| S_fanrevolt | ファン離反 | 3興行連続で平均MQ50未満 | 全選手trust -3〜-5、orgPop -2〜-4。選択肢: 感謝イベント/カード改革/無視 | 全ペア bond微減（チーム全体の空気悪化） | 中 | 未着手 |

実装順の推奨: S_humiliation（自動発火で実装シンプル）→ S_scandal → S_fanrevolt → S_powerstruggle → S_betrayal

### NPC記録データ完全統一（設計書: `specs/npc-record-unification-spec-v1.0.md`）

| Step | タスク | 重さ | 状態 |
|------|--------|:----:|------|
| 1 | **Part A+B: processAIWeek統一 + 旧コード廃止** processAIWeek興行週に全試合後処理追加(BT/careerBestMQ/losingStreak/slump/motivationLoss/momentum/trust/MQ連動pop)。aiSeasonGrowthEvents廃止、aiSeasonPopularity廃止、脅威通知をseasonBreakthroughsに切替、processSeasonEndにpeakOVR更新追加 | 大 | 未着手 |
| 2 | **Part C: 経歴自動生成** Engine.career.generateBackstory/generateAllBackstories実装。ドラフト直後に全98キャラの過去経歴生成（peakOVR/careerBestMQ/ブレークスルー/団体名タイトル歴/移籍歴/怪我歴/trust初期値）。seedベースRNG再現性 | 大 | 未着手 |
| 3 | **Part D: 表示統一** milestone.get/buildSummaryのAI団体検索追加、スカウト画面に戦績・タイトル歴表示、対抗戦・PPVパネル表示統一、マイルストーン年表のAI選手対応 | 中 | 未着手 |

### プロモ改修「プロモ＝商売」（設計書: `specs/promo-redesign-spec-v1.0.md`）

| タスク | 重さ | 状態 |
|--------|:----:|------|
| **§1 人気上限引き上げ** PROMO_POP_CAP 55→70 | 小 | **実装済み** |
| **§2 プロモイベント収入** PROMO_EVENT_INCOME テーブル(pop帯別15-85万)、PROMO_EVENT_NAMES(演出用イベント名プール)、calcWeeklyFinanceに計上、週次精算表示 | 中 | **実装済み** |
| **§3 MQ蓄積ボーナス** promoStackフィールド(0-3)、プロモ実行で+1、試合出場で0リセット、PROMO_MQ_PER_STACK=1.3、simulateMatch Pass2で加算 | 中 | **実装済み** |
| **§4 お任せロジック最適化** balance判定: pop≥70 かつ promoStack≥3 なら練習に自動切替 | 小 | **実装済み** |

### ランキング・ロスター・団体間対戦 リデザイン（設計書: `docs/ranking-roster-redesign-v1.0.md`）

| Phase | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| 1 | **ランキング計算の刷新** championScore廃止、TOP5基礎力+対戦pt計算式、ランキングUI更新、団体比較連動 | 中 | **実装済み** |
| 2 | **ロスター人数制限** プレイヤー段階解放6→16、AI:idealRosterハードキャップ化(S:16/A:13/B:10)、全獲得経路チェック、UI表示 | 中 | **実装済み** |
| 3 | **対戦ポイントシステム** battlePointsフィールド運用開始、AI同士の対抗戦ポイント処理、サミット条件緩和(ランク3位以上) | 中 | **実装済み**（warChance 50%化のみ。AI同士のポイント処理はトーナメント/PPVに委任。summitMinRankは2を維持） |
| 4 | **統一トーナメント** Engine.tournament新規実装、第24週開催、8名シングルエリミネーション、代表選手選択UI | 大 | 未着手 |

### コーチ＋ロッカールーム統合リデザイン（設計書: `docs/coach-lockerroom-redesign-v1.0.md`）

| Phase | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| A | **独立3タスク先行実装** 努力家変更・表彰式画像パス修正・ケアアクション制限変更 | 小 | **実装済み** |
| B | **§1 コーチシステム** 格C/B/A・指導力/観察眼・得意スタイル・コーチ特性6種・枠(orgPop連動1-3枠)・コスト・プール30-40人 | 大 | **実装済み** |
| C | **§2 観察眼システム** コーチ報告（25%/週）・ランク別情報レベル(E-A)・揺らぎ(的外れ)・インライン表示 | 中 | **実装済み** |
| D | **§3 ロッカールーム可視化** 道場ヘッダー・雰囲気テキスト5段階+ノイズ揺らぎ | 中 | **実装済み** |
| E | **§4 施設システム廃止** 成長速度→コーチ吸収・施設UI削除・デッドコード除去・スカウト割引orgPop連動 | 中 | **実装済み** |

### 因縁リデザイン＋カード鮮度システム（設計書: `specs/rivalry-resolution-spec.md` v2.0）

| タスク | 重さ | 状態 |
|--------|:----:|------|
| **A. 因縁ラベル変更** 永遠のライバル→宿命の相手。RIVALRY_THRESHOLDS + セリフデータ + UI表示 | 小 | **実装済み** |
| **B. 決着2回上限** resolutionCount追加、1回目=宿敵(4戦)、2回目=宿命の相手(7戦)、以降不可 | 中 | **実装済み** |
| **C. 好敵手ステータス** resolved=true後はMQ+2永続、決着なし、🤝ラベル表示 | 小 | **実装済み** |
| **D. カード鮮度システム** matchupLog記録、初顔合わせMQ+2、マンネリMQ-3/-5/-8（12興行ウィンドウ） | 中 | **実装済み** |
| **E. 演出・UI** 鮮度メッセージ、好敵手表示、最終決着ポップアップ | 小 | **実装済み** |
| **F. マイグレーション** resolutionCount/matchupLog初期化、ラベル参照更新 | 小 | **実装済み** |

### PPV GRAND FINAL 合同興行（設計書: `specs/ppv-grand-final-spec-v2.0.md`）

| Step | タスク | 重さ | 状態 |
|------|--------|:----:|------|
| 1 | **データ＋エンジン基盤** PPV定数 + Engine.ppv名前空間 | 中 | **実装済み** |
| 2 | **Week 43/48 フロー** advanceWeek連携 + ppvPhase管理 | 中 | **実装済み** |
| 3 | **エントリーUI** 選手選択画面 + AI自動選出 | 中 | **実装済み** |
| 4 | **PPV当日演出＋結果処理** 試合発表+観戦+TV+報酬+ポイント+人気 | 大 | **実装済み** |
| 5-6 | **結果処理完成＋演出仕上げ** MQボーナス+因縁決着+ヒート+成長+ブレークスルー+UI改善 | 中 | **実装済み** |

### 信頼度システム リデザイン（設計書: `specs/trust-redesign-v2.1.md`）

| Step | タスク | 重さ | 状態 |
|------|--------|:----:|------|
| 1 | **基本値差し替え** applyShowTrust全面書き換え: 勝敗削除→出場/不出場基本値(+1.53/-2.64)、舞台追加、連続不出場蓄積、noAppearStreakステート追加 | 大 | 未着手 |
| 2 | **low帯回復減衰** trust<40で出場回復に減衰係数。ケアアクションは減衰なし | 小 | 未着手 |
| 3 | **ケアアクション差し替え** CARE_ACTIONS trust値を小数化 + OVR傾斜係数適用 | 中 | 未着手 |
| 4 | **選択型イベント値差し替え** S1/S3/S4/S5/E1/E6の整数trust値を小数化 | 中 | 未着手 |
| 5 | **ロッカールーム士気差し替え** 連続関数化+人望×ムードメーカー重複処理 | 小 | 未着手 |
| 6 | **自然変動連続関数化** calcMonthlyNatural差し替え | 小 | 未着手 |
| 7 | **Math.round除去+dispTrust追加** 内部float化、表示用ヘルパー追加 | 小 | 未着手 |
| 8 | **信頼低下イベント見直し** S4/E6の発火条件・選択肢・効果の再設計（後続spec） | 中 | 設計待ち |

### フィニッシャーシステム（設計書: `specs/finisher-system-spec-v1.0.md`）

| Step | タスク | 重さ | 状態 |
|------|--------|:----:|------|
| 1 | **データ追加** data.jsにfinisherフィールド追加（初期10〜20キャラ分） | 小 | 未着手（キャラリスト＋技名待ち） |
| 2 | **エンジン判定** simulateMatch内で高ダメージ技選択時にフィニッシャー発動判定。matchResultにメタデータ付与 | 中 | 未着手 |
| 3 | **観戦モード演出** battle-engine.htmlにカットインHTML/CSS/アニメーション＋SE再生 | 中〜大 | プロトタイプ検証済み（SE素材待ち） |
| 4 | **試合ログ反映** 試合結果テキスト・ログにフィニッシャー技名差し込み | 小 | 未着手 |
| 5 | **調整** テストプレイで発動確率・顔切り抜き位置の微調整 | 小 | 未着手 |

### 成長バランスリバランス v2（★高優先）→ **実装済み**

| タスク | 重さ | 状態 |
|--------|:----:|------|
| **A. 現状分析** auto-simで年次別OVR推移・AI比較データ収集。プレイヤーvs AI成長速度の定量比較 | 小 | **実装済み** |
| **B. プレイヤー成長速度の調整** 週次成長・試合成長・ブレークスルー確率・コーチ補正の複合効果を見直し。成長天井の逓減カーブ強化 | 中 | **実装済み** |
| **C. AI団体の成長強化** AI側の成長手段拡充（FA補強の質向上・成長イベント相当の仕組み等）。tierGrowth倍率見直し | 中 | **実装済み** |
| **D. 長期ゲームバランス検証** 10年・15年スパンでの勢力図推移を確認。中盤以降もAI団体が脅威であり続けるか | 小 | **実装済み** |

### ビッグマッチエンジン Tier 2（設計書: `specs/bigmatch-engine-spec-v1.0.md`）

PPV・タイトル戦・トーナメント・対抗戦で使用する長期戦＋低偶然性モード。現行エンジンのロジックは変えず、パラメータのみ変更。10,000試合シミュレーション検証済み（Tier 2b採用）。

| Step | タスク | 重さ | 状態 |
|------|--------|:----:|------|
| 1 | **定数追加** data.jsに`BIGMATCH_MAX_T`(24), `BIGMATCH_PHASES`(6T×4phase), `BIGMATCH_ENG`(hpBase:85等) | 小 | **実装済み** |
| 2 | **エンジン分岐** simulateMatchに`matchTier`引数追加、Tier別の定数切り替え（ロジック変更ゼロ） | 中 | **実装済み** |
| 3 | **MQ対応** ペーシング減点の適正ターン帯をTier分岐（Tier2: 13-21が適正） | 小 | **実装済み** |
| 4 | **呼び出し側更新** 全simulateMatch呼び出しにmatchTier渡し。PPV/タイトル/トーナメント/対抗戦→Tier 2 | 中 | **実装済み** |
| 5 | **BGM連携** bigmatch.mp3をFileBGMで再生（タイトル戦/PPV/対抗戦開始時→fadeOut終了時） | 小 | **実装済み** |
| 6 | **演出: ライバリー台詞カットイン** 観戦モードでフェーズ切替+フィニッシュ時にカットイン。rivalryTier別発動率(30/50/80%) | 中 | **実装済み** |
| 7 | **演出: ブレイクスルー兆し** BT成功時にpersonality別モノローグをポップアップに表示 | 中 | **実装済み** |
| 8 | **観戦モード対応** battle-engine.htmlにTier 2定数・フェーズ切替・カットインUI・BIG MATCHバッジ | 中 | **実装済み** |

**検証データ（Tier 2b / 10,000試合）:**
- 平均ターン: 15.7〜17.6（Tier 1: 9.7〜10.7）
- 番狂わせ率（OVR差20）: 21.2%（Tier 1: 24.4%、-3.2pt改善）
- 決着分布: フォール61.6% / ギブアップ18.1% / TKO10.8% / ピン7.4%（健全）
- タイムアウト率: 約2%（許容範囲）

### 拡張候補

| 項目 | 優先度 | 備考 |
|---|---|---|
| フィニッシャー（キャラ固有必殺技） | 高 | **設計完了** specs/finisher-system-spec-v1.0.md。SE素材＋初期キャラリスト待ち |
| 選手間関係性システム（bond/rivalry） | 高 | **Phase 1〜6v2+UX改善 実装済み**（データ基盤・試合結果反映・団体運営・ケアアクション反映・ライバル称号統合・相関図UI・相関図リニューアル・UX改善6件）。specs/relationship-system-spec-v0.2.md |
| ライバルストーリー自動生成 | 高 | 未設計 |
| ストーリーアーク（数ヶ月にわたる抗争管理） | 高 | 未設計 |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | ライト案: シングル2試合合算方式（エンジン変更不要）。本格エンジンは工数大。優先度低 |
| 敵AI団体専用キャラクター | 中 | 固有キャラで世界観を深める |
| マネージャー的存在（説明キャラ） | 中 | チュートリアル・イベントの語り手 |
| マインド依存の成長イベント | 中 | mnの存在感を強化 |
| エンディング/ゲームオーバー演出 | — | **v2.1実装済み** |
| 選手/団体の情報一覧タブ | — | **データベースタブとして実装済み** |

---

## コードベース構成

| ファイル | 行数 | 役割 |
|---------|-----:|------|
| index.html | ~1,320 | HTML+CSS+起動処理 |
| data.js | ~2,000 | 全データ定数（キャラ98名・コーチ35名・技160種） |
| engine.js | ~10,100 | ゲームロジック全体 |
| app.js | ~3,530 | Audio+Storage+Mission+App統合 |
| ui-common.js | ~3,200 | ヘルパー+ポップアップ+各種UI+レーダーチャート |
| ui-render.js | ~3,960 | 全render関数+データベースタブ+相関図v2 |
| victory-lines.js | 501 | 勝利台詞データ |
| battle-engine.html | 1,734 | ビジュアル観戦モード（iframe） |
| **合計** | **~20,605** | |

その他: `portrait-map.js`（ルート）、選手顔画像107枚＋表彰式フレーム7枚（`image/`）、コーチ肖像画35枚（`image/coach/`）、build-zip.sh

---

## 設計決定ログ（実装済みルール集）

- **Trust総合リバランス + ケアストック制 Phase T1-T3 実装（2026-03-10）** — 確定パラメータ: Trustグラビティ gravity=0.04/anchor=60。M3低MQ不満(-0.46/興行、MQ<40)。M1/M2/M4/M5は廃止。ケアストック制: 最大5、4週ごとに+1回復、合宿=2消費、打ち上げ=1消費、声かけ=ストック不要。コスチューム: pop永続上昇廃止→次試合MQ+2一時バフ(`_costumeDebut`フラグ、Pass2で消費後クリア)。メディア: pop+4廃止→orgPop+0.4(逓減適用)。特別治療: 確定半減→確率ベース(50%:1週/35%:2週/15%:3週、8週+で+1週)。UI: ケアモーダルにストック残量⚡N/M表示、各アクションに消費量表示、ストック不足時disabled化。セーブデータマイグレーション(careStock=5/careStockMax=5/careStockLastRecovery)。auto-sim 500シーズンALL CLEAR

- **相関図UX改善9件** — ズーム機能（マウスホイール+＋/−/⊙ボタン、SVG viewBoxカーソル中心ズーム+空白ドラッグパン）。比較ポップアップ自動閉じ（他ノード/空白クリック）。bondフィルタ閾値15→10緩和+リンク上数値ラベル表示（bond/rivalryフィルタ時）。フォーカスモード距離反映（intensity=max(bondDev×1.2,rivalryMax,bondDev+rivalryMax×0.6)で関係強度→距離変換）。フォーカスモードリンク整理（center↔peripheral限定+上限18接続）。名前テキスト白文字化（fill=#e8e8e8+stroke=rgba(0,0,0,0.9)）。団体カードクリック修正（centerIdを変更→パンのみに修正）。フィルタ初期値（関係ありのみ=ON/閾値=14+ユーザー変更記憶）。bond矢印（SVG marker warm青/cold赤をbondラインに付加）。UI層のみ

- **相関図リニューアル Phase 6v2** — 旧放射型レイアウト（Phase 6）をforce-directedネットワークグラフに全面置換。2つの表示モード（ネットワーク全体/フォーカス）。物理シミュレーション（クラスター重力+リンク引力+反発力）。団体ゾーン背景表示。サイドバー（団体カード+表示フィルタ）。下部詳細パネル。右クリックコンテキストメニュー。比較ポップアップ（ステータスバー+関係メーター）。ノードドラッグ。リンクフィルタリング（all/rivalry/bond）。OVRベースのノードサイズ。rivalryパルスリング。rivalry線アニメーション。ホバーツールチップ。UI層のみの変更（エンジン変更なし）

- **スナップショット通知システム本体** — Engine.snapshotモジュール新設。SNAPSHOT_TEXTSデータ（G1-G4給与/タイトル/過密不満、R1-R5人間関係系、friction/generation/rivalryResolved Phase4系、careerBestMQ、breakthrough/warVictory embedded）。tickWeek末尾で候補収集→クールダウン除外→重み付き抽選（最大2件/週）→テキスト生成。personality×archetypeセリフ解決。6週クールダウン。R3モーダル演出（bond75+退団/引退時）。ブレイクスルーポップアップへのembedded追記。gameLog描画拡張（文字列/オブジェクト両対応）。因縁解消フック（`_rivalryResolvedThisWeek`）。`personalityCompatibility`ヘルパー追加。auto-sim 500シーズンALL CLEAR

- **AI団体同等処理化 Phase 5** — Trust/Bond/Rivalry包括リバランスのPhase 5。AI団体をプレイヤー団体と同等の処理レベルに引き上げ。変更1:AI団体にタイトル情報を正確に引き渡し（`orgData.titles || {}`→`applyShowTrust`）。変更2:AI試合結果にフル`applyMatchResult`適用（M-01のみの簡易処理→13種全分類判定、`_lastMatchResults`経由でtickWeek AI処理ブロックで一括適用）。変更3:AI選手の引退時に`applyDepartureTrustImpact`適用。変更4:AI選択型イベント処理（`processAIChoiceEvent`新設、`generateChoiceEvent`+`_pickAIChoice`でティア依存AI判断）。変更5:AIケアアクション処理（`processAICare`新設、trust<60の選手に個別ケア+チーム全体trust微増、ティア依存頻度）。変更6:`initAIOrgs`に`lockerRoomMorale:60`追加。変更7:スナップショット通知フック準備（`calcGrievanceDelta`→`{delta,flags}`返却+`_grievanceFlags`、`calcRelationshipTrustDelta`→`{delta,flags}`返却+`_relationshipFlags`、`applyDepartureTrustImpact`に`meta`引数追加+`_departureBondImpact:{departedId,departedName,bond,reason}`、`_trustBonusSources`→`_snapshotBonusSources`転写、`_snapshotCooldowns`初期状態フィールド、`Engine.snapshot`未実装時のsafety valve）。ヘルパー:`_estimateAIFunds(tier)`/`_pickAIChoice(rng,event,tier,aiState)`。auto-sim 500シーズンALL CLEAR

- **Bond/Rivalry自体の調整 Phase 4** — Trust/Bond/Rivalry包括リバランスのPhase 4。同団体ボーナスbond60天井（bond55から減衰し60で停止。60超は試合/イベントでのみ到達可能）。性格不一致の週次摩擦（相性≤-3で-0.15/週）。世代近接ボーナス（年齢差3以内で+0.1/週、別枠で実質65天井）。試合外rivalry拡張（D-1:同スタイルOVR近接+1〜+2/4週、D-2:タイトル圏top5同士+0.5〜+1.0/4週）。M-01ベースラインrivalry抑制（+0.5〜+1.5→+0.3〜+1.0）。接触中rivalry自然減衰強化（-0.1〜-0.2→-0.15〜-0.3）。因縁解消時rivalry緩和を穏やかに（-15〜-10→-8〜-5、リセットではなく緩和）。G-05基本値微減（+3〜+5→+2〜+4）。`charInfoMap`/`orgTopRankMap`事前構築。auto-sim 500シーズンALL CLEAR

- **Bond/Rivalry→Trust連動 Phase 3** — Trust/Bond/Rivalry包括リバランスのPhase 3。選手間の人間関係がtrust（団体への信頼度）に影響する経路を追加。R1:低bond同興行出場（bond27以下で-0.3/ペア）。R2:ロッカールーム内孤立（在籍8週以上でbond50+の相手が1人以下なら-0.4/興行）。R3:仲の良い選手の退団/引退時trust直接低下（bond65+で-(bond-50)×0.2、bond65=-3.0/bond75=-5.0/bond85=-7.0）。R4/R5:rivalry40+の相手との勝敗（勝利+0.2/敗北-0.3）。`calcRelationshipTrustDelta`新設。`applyDepartureTrustImpact`新設（突然退団/怪我引退/引き抜き承諾/防衛失敗/シーズン末引退の5箇所にフック）。`orgJoinWeek`フィールド追加（makeChar/makeAIFighter/全加入箇所9箇所）。AI団体はapplyShowTrust共用で自動適用。auto-sim 500シーズンALL CLEAR

- **待遇不満・成功体験 Trust連動 Phase 2** — Trust/Bond/Rivalry包括リバランスのPhase 2。即時型: ブレイクスルー達成(+3.5)/自己ベストMQ更新(+1.2)/対抗戦勝利(+2.3)を`_trustBonus`パターンで`applyShowTrust`内回収。蓄積型: 給与不公平(-0.4/興行)/後輩高給(-0.6/興行)/タイトル機会なし(-0.5/興行)/ロスター過密(-0.35/興行)を`calcGrievanceDelta`で毎興行判定・重複加算。`lastTitleShowWeek`フィールド追加。AI団体も`applyShowTrust`共用で自動適用。auto-sim 500シーズンALL CLEAR

- **対抗戦進行不能バグ修正** — 対抗戦(D-2 rivalry war)受諾後にゲームが進行不能になる問題。finalizeWar内のEngine.relationships.applyToRoster呼び出しで引数の順序が逆（sourceId/targetIds[]を[sourceIds]/targetIdとして渡していた）。for...ofで数値をイテレートしようとしてTypeError→finalizeWar中断→オーバーレイが閉じず操作不能に。同じパターンがengine.jsのE-02(B2対立決着)とE-03(B3対抗戦)にも存在したため全6箇所を修正
- **殿堂入り引き止めバグ修正** — 殿堂入り条件を満たした選手の引き止めに成功すると、rosterに戻ったにもかかわらず殿堂入りしてしまう問題。pendingAwardsはtickWeek内で事前計算されるため、引き止め後もhallOfFameリストに残っていた。_checkAndShowAwardsで表彰式UI表示前にG.rosterと照合し、引き止め済み選手をhallOfFameから除外するフィルタを追加
- **PPV参加後TV遷移バグ修正** — closePPVResultがppvPhase='tv'に遷移しTV中継画面を表示していたため、参加済みの自団体エースが結果から消える問題。ppvPhase=null+advanceWeek()直接呼び出しに修正し、PPV参加後はTV画面をスキップしてオフシーズンへ直行
- **PPV試合表示順修正** — card[0]=前座/card[total-1]=メインの構造に合わせ、表示順をメインイベント上→前座下に逆転。matchNum=idx+1に修正。nextIdx探索も前座→メイン順に変更。renderPPVMatchPreview/renderPPVResult/renderPPVTVResult全3箇所を修正
- **PPV開催中画面進行不能修正** — renderWeekScreen ppvShow状態にカード表示ボタンを追加。オーバーレイが閉じた場合でも再表示可能に
- **PPV選手詳細＋セリフ演出** — 試合カードの選手名クリックでshowFighterPopup表示。自団体選手がいる試合ではVICTORY_LINESベースのキャラ固有セリフを両者表示
- **エンディング繰り返しバグ** — `endingClearedSeason === G.season - 1`が新シーズン全52週でtrue。`endingShown`永続フラグで1回限りに
- **matchGrowth欠落バグ修正** — App.finalizeShow（ビジュアル観戦モード）に試合成長処理が欠落していた。Engine.executeShow/applyPPVResultsにはあったがApp側にミラーされておらず、通常興行で選手の試合成長が一切発生していなかった。seed 1732でEngine.executeShowと同一のRNG系列を使用。怪我処理後・ブレークスルー判定前に配置
- **ロスターランダム化** — potTotal重み付き配分。S級≥690, A級≥640。シリーズボーナス+0.3。dormant動的計算
- **チャンピオン集客ボーナス** — チャンピオン出場時に集客×1.10
- **乱入マッチ** — チャンピオン3回防衛後、タイトルマッチ当日に20%で発生。隣接団体OVR90%以上の選手が乱入。勝利+2/敗北-15〜-20
- **フレーバーイベント** — チャンピオン or 人気55以上に12%/週。雑誌取材（人気+2〜3）・TV出演（ヒート+2〜3）
- **殿堂入り条件** — 獲得＋防衛合計13回以上、またはグランドスラム
- **衰退・引退はdurability + wear方式** — wearは28+durability歳から蓄積。wear 20〜39で軽度衰退、40〜59で本格衰退（引退20%/年）、60〜79で末期（50%/年）、80+で確定引退
- **壊滅的怪我** — 重傷時に追加判定。基本2〜3%、ベテラン(wear40+)は5〜8%。即引退
- **PPV GRAND FINAL** — orgPop≥30で永続解禁(ppvUnlocked)。Week43エントリー受付(ppvPhase:'entry'→'locked')、Week48開催。枠数ランク依存(1位:5/2位:4/3位:3/4位:2名)。チャンピオン自動エントリー。AI団体OVR上位自動選出。未解禁時はTV観戦モード(ppvPhase:'tv')。出場報酬ランク依存(1位:300/2位:200/3位:150/4位:100万円)
- **PPVマッチメイクは盛り上がり優先** — 因縁最優先(宿敵以上+異団体制約)、次にcalcExcitement貪欲法。サミット(ランク1位vs2位エース)はメインイベント固定。同団体対戦禁止
- **PPV当日は専用実行パス** — App._ppvPreview+9関数。通常興行（executeShow/finalizeShow）とは独立。対抗戦(war)パターン踏襲。会場/集客/チケット収益なし、固定報酬PPV_REWARD[rank]。condition=80固定。RNG seed: 0xBBF2(hype)/0xBBF3(battle)/0xBBF6(成長)/0xBBF7(BT)/0xBBF8(スランプ)/0xBBF9(momentum)/0xBBFA(モチベ喪失)/0xBBF5(TV)。カード順次公開（前座→メイン、card末尾→先頭）。TV観戦モード: AI全自動+battlePoints更新のみ
- **PPV事後効果** — 因縁MQボーナス(+3/+5/+8)+コーチMQボーナス+因縁決着判定+ヒート更新+試合成長+matchupLog+ブレークスルー+careerBestMQ+スランプ+モチベ喪失。怪我なし(condition=80人工的)、orgPop変動なし(合同大会)、会場熱気/カード鮮度/ファン期待度は非適用
- **年末表彰式** — 新人王・ベストマッチ・MVP・チャンピオン紹介・殿堂入り
- **集客計算は加算方式** — heat/title/champ/charismaのボーナスを加算し上限2.0倍キャップ
- **人気の自然減衰** — 毎週-0.5（人気10超の全選手）
- **orgPop年次減衰** — シーズン末にorgPop比例（-2/-3/-5/-7/-10）
- **FA年齢保存方式** — dormantPool退場時に{id, age}で保存。22歳超はFA参入不可
- **HEAT倍率圧縮** — Warm ×1.1、Hot ×1.2、On Fire ×1.3。興行週にも軽減衰-0.3
- **baseAttendance係数** — ~~(orgPop/100)² × 10000~~ L1で廃止 → BASE_ATTENDANCE_CURVE（21点区間線形補間、orgPop 0:20人〜100:30000人）
- **会場システム（L1）** — 全10段（公民館150〜ドーム30000）、popReq撤廃で全会場選択可能。~~週次揺らぎ±17%~~→L1rで会場スケール揺らぎVENUE_FLUCTUATIONに置換（seed 0xA77E）。勢い補正attendanceMomentum（±15%上限、ガラガラ<30%でorgPop-0.5）。ざっくり予測3段階テキスト。リスク指標（◎安全/△挑戦/✕危険）
- **給料連続関数** — base=~~0.65~~0.55*exp(~~0.06~~0.062*OVR) + 80*(pop/100)²人気加算 + タイトル保持者+20万。SALARY_TABLE廃止→SALARY_PARAMS（L1rで中間層微調整）
- **グッズ単価** — 0.15万/人（チケット:グッズ比率 3:1）
- **育成補助金** — orgPop 40未満に地域振興助成金（0-19:80万/週、20-29:65万/週、30-34:45万/週、35-39:20万/週）。推定週間収支にも反映
- **orgPop逓減カーブ** — 0→×1.0, 20→×0.70, 40→×0.35, 55→×0.20, 70→×0.12, 85→×0.08
- **orgPop帯別MQ閾値シフト** — orgPop<20:shift=-10/negMult=0.4、orgPop<30:shift=-7/negMult=0.5、orgPop<45:shift=-3/negMult=0.85、45以上:変更なし（Engine.orgPop.getMQAdjust）
- **ケアシステム2週間隔制限** — costume/mediaは2週に1回/選手/アクション（state.week - _careWeekUsed[actionId] < 2 で管理）。orgPopゲート: costume/media≥20、special_treatment≥40。ロック時はUI上で「知名度XXで解放」表示
- **Heat維持困難化** — HOT以上（heatScore≥6）で上昇×0.5、冷め速度1.5倍
- **内部小数化** — popularity/orgPopを小数のまま保持。表示はdispPop/dispOrgPop（Math.round）
- **MQ外部ボーナスキャップ** — 外部ボーナス合計+15上限。因縁+3/+4/+6、タイトル+5、コーチ+2、超満員+3/大入り+2、会場0-2
- **タイトルマッチ格差ペナルティ** — OVR差>10:MQ-3、>20:MQ-6（キャップ後別途減算）
- **特性リバランスv1.0** — 試合MQ系は控えめ(名勝負+3/引き出し+4max/野心+1)、試合外効果は強め(ファンサービス人気+1/ムードメーカー士気+5/ガラスの身体復帰人気+2)。威圧感+3/-2/-2。負けず嫌い×1.10。努力家cond-1。適応力+追い込みcond-2。闘志+メインペナ半減。ヒール適性+因縁50%加速。新特性「反骨心」(trust×1.3/trust≤30で成長×1.15)
- **trustパラメータ** — レスラーに trust(0-100) 追加。mentalCoeffの変動係数。自然減衰(-1/月)
- **ファン期待度** — 因縁ペア(priority3) → 王者挑戦者(priority2) → 人気上位(priority1)。最大3件。実現時MQ+5。試合後リアクションポップアップ（MQ≥55:好試合gold/MQ<55:凡戦neutral、観客+勝者セリフ各4-5パターン、autoCloseMs 2500）
- **ニュースティッカー** — manage画面スクロールバー。毎週3-5件生成。8カテゴリ
- **新聞パネル** — 重大イベント時にスポーツ新聞風ポップアップ。8種×複数パターン
- **autoFillCardのタイトルマッチチェック** — autoFillCard()でEngine.title.canTitleMatch()を確認
- **エンディング条件** — offWeek4: pRank===1 && !endingCleared → endingCleared=true/endingClearedSeason=season。翌シーズン offWeek1 に演出（endingClearedSeason===season-1 で1回のみ）
- **ゲームオーバー条件** — tickWeek settlement後に funds≤0 → weekPhase:'gameover'。autoSave上書きなし。processWeekで検知→showGameOverScreen
- **FileBGM** — HTMLAudioElement ベース。Audio IIFE 内 FileBGM オブジェクト。Audio.fileBgm として公開。BGM再生は必ずユーザー操作直後（Autoplay Policy対応）
- **逆境チームスピリットバフ** — funds<300 && lockerRoomMorale>=50 && week%4===0 でランダム1名にtrust+1。_pendingTeamSpirit transientフィールドでトースト表示
- **S4低コスト第4選択肢** — funds<200時のみ表示。「励ましの言葉をかける」信頼度+3、morale+2、無料
- **通知イベントトースト動的表示時間** — テキスト長に応じて9〜15秒（baseDuration + max(0, textLen-40)*40ms、上限15秒）
- **大型イベントB1〜B4** — 非興行週に2.5%/週で発生。8週クールダウン。B1:怪我3択、B2:対立3段階+介入+試合、B3:他団体対抗戦3段階+試合、B4:メディア密着3興行追跡。_pendingLargeEvent transientフィールドでadvanceWeekへ連携
- **努力家特性** — baseGain×1.15乗算を廃止。weeklyVariance下限を0.5→0.75に引き上げ（通常:0.5-1.5、努力家:0.75-1.5）。破天荒(0.0-2.5)との対極構造。v1.0リバランスで練習cond消耗-1を追加（効率的に練習する子のイメージ）
- **コーチ報告（観察眼システム）** — 非興行週に25%/週で発生。担当選手がいるコーチからランダム1人→担当選手からランダム1人。ランク別テキスト: E-D=vague(名前なし), C=named+mood(positive/negative/neutral), B=named+stat(growing/stagnant), A=trainCap接近ヒント(near_cap/far_from_cap)。COACH_OBS_INACCURACY揺らぎ(C:20%,B:20%,A:8%)で方向反転。_pendingCoachReport→currentCoachReport（1週持続インライン表示）
- **雰囲気テキスト（ロッカールーム可視化）** — lockerRoomMorale±10ノイズ→displayScore→5段階(0-20/21-40/41-60/61-80/81-100)。render時にDate.now()ソルトで意図的非決定性（装飾表示のみ、ゲーム状態に影響なし）。ATMOSPHERE_TEXTS各段階3-4パターン
- **データベースタブ** — Engine.database.getAllFighters()でdormantPool除外の全選手を収集。3サブタブ構成（全選手/殿堂/団体比較）。モジュールレベル変数（_dbSubTab/_dbSortKey等）で状態管理
- **drawRadarChart()** — Canvas innerHTML設定後にdocument.getElementByIdで取得して描画。5角形レーダー、単一/デュアルデータセット対応。hexToRgba()ヘルパー併用
- **選手ポップアップ上半身画像** — getUpperUrl(id)でwebpパス取得。onerrorで従来のface PNGにフォールバック
- **5能力値カラム色分け** — PW=#e74c3c, SP=#3498db, TE=#2ecc71, ST=#f39c12, MN=#9b59b6。75以上=固有色、60以上=白、未満=薄色
- **イベントポップアップautoCloseMs** — showEventPopup opts.autoCloseMs指定時にsetTimeout(closeEventPopup, ms)で自動閉じ。closeEventPopup内でclearTimeout。ファン期待リアクションで使用（2500ms）
- **会場規模連動の試合数** — VENUES.maxMatches（公民館3〜ドーム8）。Engine.util.getMaxMatches(week,venueIdx)で一元管理。特別興行/PPVは+1（上限8）。CARD_DEPTH_MULT 8要素。showCardは空配列初期化→pad/trimで動的調整
- **レンタルシステム** — G.rentals配列。シーズン(期)単位契約(1-4期,12週/期)。前払い一括。FA+ライバル団体2ソース。同時2-3枠(ロスターサイズ連動)。タイトル戦出場不可。orgPop貢献50%。確認ダイアログ(顔アイコン+費用)。ソート(名前/OVR/費用)対応。ロスター金枠分離表示
- **AI団体成長バランス（v1.9→v2）** — facilityMul全団体1.00（実質廃止）。growthBonus: S=1.12, A=1.05, B=1.00。aiMatchEquivalent=1.15を追加（AI興行による試合成長相当）
- **成長バランスリバランスv2** — matchGrowthBase 1.5→0.7、opponentBonus上限0.8→0.5、closeMatchBonus 0.5→0.3、ブレークスルー3-6→2-4。calcGrowthにtrainCap接近逓減(convergenceMul=√(remaining/10))追加。旧: Player Top5がS8で84/AI78→S13で93.5/AI79（一方的独占）。新: S12でPlayer 83=AI 83に到達し中盤以降拮抗
- **年齢カーブ型契約費用（v1.9）** — ageMarketMultiplier: 21歳以下の逸材+個性2つ以上で1.10-1.35プレミアム、22-25歳=1.0、26-27歳=0.95、28-29歳=0.85、30歳以降=1.0（既存reassessに委譲）。calcAssessedValueでbaseValue*variance*ageMulとして適用
- **逸材特別交渉枠（v1.9）** — orgPop≥25到達時にG.eliteTicket=true（1回限り）。canNegotiate(orgPop, fighter, context, state)の第3-4引数で判定。context='fa'かつeliteTicket=trueかつtierId='elite'でreqPop無視。superElite不可、スカウト不可。契約成功時にeliteTicket=false,eliteTicketUsed=true。isEliteTicketRequired()ヘルパーでUI表示判定。_pendingEliteTicket transientフィールドでgoldポップアップ通知
- **選手成長リバランス v1.0** — GROWTH_SEASON_BASE=8.0の「シーズン予算」モデル。calcGrowthをshare(残距離比例)ベースに全面書換え。×0.4練習補正撤廃。aiSeasonGrowthも同モデルに統一。ageMultiplier新カーブ（20-22歳ピーク1.3、33歳以上0）。AI離脱イベント（S:10%/A:12%/B:15%で成長50%カット）。convergenceFactor+STYLE_GROWTHは非参照化（残置）。practiceShare=0.6（練習:試合=6:4）。設計書: docs/growth-rebalance-design-v1.0.md
- **ランキング計算（v2: ranking-roster-redesign Phase 1）** — 旧: `championScore + calcStarPower(全員合算) + calcTotalPop(全員合算) + summitBonus`。新: `TOP5平均OVR × 1.5 + TOP5平均pop × 1.0 + battlePoints[orgId]`。TOP5は各指標で独立に上位5名を選出し平均（5名未満はある分だけ平均）。battlePointsはシーズンリセット。対抗戦±12pt、頂上決戦±10ptのゼロサム移動。BATTLE_POINT_CFG定数で管理。団体比較レーダーも連動（TOP5実力/TOP5人気）。設計書: docs/ranking-roster-redesign-v1.0.md
- **MQスコア減点制（v2.0）** — 旧加点制(Base+Drama+Pacing+Finish)を廃止。新: `天井(OVシーリング) − ドラマ減点 − ペース減点 − 決着減点`。天井=OV依存曲線(15-100)。ドラマ減点=基本30からKO/カウンター/逆転/大技で回復。ペース減点=7-14ターン理想帯(0)、<5ターン=-12。決着減点=フォールはClimaxで0〜3、ピン=0、タイムアウト=-10。特性ボーナス（名勝負製造機/引き出し上手）は天井超え加点として維持。外部ボーナス(Pass2, cap+15)は変更なし。simulateMatch戻り値に `finishPhase`・`mqDetail` を追加。設計書: specs/mq-deduction-redesign-v2.0.md
- **引退勧告・引き留めシステム v1.1** — Engine.retirement: canAdvise(wear≥20/age≥30/careerSeasons≥8)、calcAcceptance(50±wear±champ±trust±winRate, clamp 5-95)。受諾→lastRun=true(4週)、Pass2 MQ+3(基本)+5(メイン)+因縁+3/+5。拒否→trust-5, retireAdviceCooldown=48週, 70%でproveMode4週(MQ+2)/30%でmorale-2。引き留め→retiredFighters→roster, wear+10, retainCount+1(最大2回), injuryBonus+0.05。コーチアドバイス: Engine.coach.getRetireAdvice(obsRank別4段階+COACH_OBS_INACCURACY flip)。UI: ポップアップTab2引退セクション+ラストランバッジ+ラストマッチ金枠表示。設計書: specs/retirement-advisory-spec-v1_1.md
- **ロスター枠制限 v1.0** — G.rosterCap(初期6)段階解放: タイトル設立→8、サバイバルクリア→10、対抗戦初勝利(warWon)→12、ランキング1位→16。レンタル別枠(isRental除外)。AIハードキャップ: AI_SCOUT_CFG.idealRoster(S:16/A:13/B:10)。aiScout: need+1→need、aiInterTransfer: idealRoster+2→idealRoster。全獲得経路チェック: signFighter/scoutEventResolve/resolveNegotiation。UI: renderRoster「所属 N/M名」ヘッダー、renderScoutキャップ警告バナー、ポップアップ獲得ボタン無効化。マイグレーション: 旧セーブは達成状況から逆算。設計書: specs/roster-cap-design-v1.0.md
- **AI統一成長モデル v1.0** — aiSeasonGrowth一括計算を廃止。processAIWeek(rng,state,org)で毎週calcGrowth+simulateMatchを実行。AI_COACH_CONFIG: S/A/Bティア別×エース/一般のcoachMul+intensiveRate+practiceRate。convergenceMul比率ベース化(convergenceRatio=0.15)。matchGrowthBase 0.7→0.35。makeAIFighterに16フィールド追加。initRandomRosterでA級elite1名保証。設計書: specs/ai-unified-growth-spec-v1.0.md → **成長システムリデザイン v2.0 で発展的置換**
- **成長システムリデザイン v2.0（2026-03-10）** — 予算配給型(GROWTH_SEASON_BASE)を廃止し、trainCap距離ベース成長に全面移行。核心式: `baseLearning(2.0) × (remaining/trainCap) × ageMul × coachMul × variance`。GROWTH_SEASON_BASE・practiceShare・convergenceRatio廃止。aiSeasonGrowth関数削除（既にprocessAIWeek週次化済みで未呼び出し）。距離比率の自然な逓減により、trainCap高低に関わらず到達率91-92%で横並び。変更: data.js(GROWTH_CONFIG baseLearning追加/3定数削除), engine.js(calcGrowth書換え/aiSeasonGrowth削除)。auto-sim 500シーズンALL CLEAR。設計書: specs/growth-system-redesign-v2.0.md
- **NPC記録データ完全統一（設計確定）** — AI選手にプレイヤーと完全同一の試合後処理を適用。processAIWeek興行週にcheckAndApplyBreakthrough/checkLosingStreak/checkSlump/checkMotivationLoss/updateMomentum/applyShowTrust/MQ連動人気変動を追加。aiSeasonGrowthEvents+aiSeasonPopularity廃止。ゲーム開始時（ドラフト直後）に全98キャラの過去経歴自動生成: peakOVR/careerBestMQ/ブレークスルー/団体名タイトル歴(皇武館王座等)/移籍歴/怪我歴/trust初期値。AI団体matchupLog新設+カード鮮度考慮。milestone.get/buildSummaryのAI団体検索追加。設計書: specs/npc-record-unification-spec-v1.0.md
- **プロモ改修「プロモ＝商売」（設計確定）** — プロモ＝リング外の営業活動（握手会・地域イベント・SNS配信・グッズ販売会）。①PROMO_POP_CAP 55→70（逓減で自然に頭打ち）。②プロモイベント収入PROMO_EVENT_INCOME: pop帯別15-85万/週の直接現金（低人気帯15万でもゼロではない=頑張る子にお金を出す世界観）。③MQ蓄積ボーナス: promoStack最大3回×1.3=+3.9（因縁「宿敵」並み、ただし練習3週犠牲）。④お任せロジック: pop≥70+stack≥3で自動練習切替。ハードモード序盤（orgPop 10-25、補助金なし）の資金難救済が主目的。高人気帯は控えめ設計で終盤は自然にプロモ卒業。設計書: specs/promo-redesign-spec-v1.0.md
- **経済リバランスL1r（実装済み）** — ドームを「収益装置」から「聖地」に再設計。①会場スケール集客揺らぎ: WEEKLY_FLUCTUATION(一律±17%)をVENUE_FLUCTUATION(会場別±10%〜±40%)に置換。公民館±10%(地元常連で安定)→ドーム±40%(超ハイリスク)の段階的リスク勾配。②BASE_ATTENDANCE_CURVE上位2点引き下げ: [95,20000→16000],[100,30000→20000]。orgPop=100でも基礎集客20000=ドーム67%。超満員には好揺らぎ+勢い+ヒート全好条件が必要。③ドーム会場費: 9000→12000万。稼働率60%以下で赤字確定。④給与カーブ中間層微調整: baseA 0.65→0.55, baseB 0.06→0.062。OVR50-60は-5〜7%減、OVR80以上は実質変化なし。ドーム50回シミュレーション: 赤字率48%、大当たり(5000万+)14%、平均純利益+176万。変更: src/data.js(VENUE_FLUCTUATION/BASE_ATTENDANCE_CURVE/VENUES[9]/SALARY_PARAMS) + src/engine.js(calcAttendance揺らぎ計算)
- **因縁決着システム（実装済み）** — 因縁を「発生→盛り上がり→決着→報酬」のサイクルにする。2段階演出: 試合前に宣戦布告ポップアップ（ペア台詞コール＆レスポンス、通常5パターン+永遠3パターン、SE:'war'）→ 試合後に決着ポップアップ（勝者/敗者セリフ+ボーナス明示、SE:'award'）。決着条件: 宿敵以上(matches≥4)で試合しMQ≥50。決着成立時: matchesをゼロリセット、両選手pop+4、orgPop+1.5。永遠のライバル(matches≥7)からの決着はpop+6、orgPop+2.5、赤枠+金枠演出強化。クールダウン: 決着後lastResolvedWeekを記録、同ペアは4週間ファン期待カードに出さない。MQ<50の試合は「不完全燃焼」として因縁残存。deferredRivalryPairsパターン: 宿敵+ペアのrecordRivalryをMQ確定後まで保留し、レベルアップメッセージと決着リセットの矛盾を防止。因縁MQボーナス半減: +5/+8/+12→+3/+4/+6。ポップアップ連鎖: eventPopups→決着→growth→retirement。詳細: specs/rivalry-resolution-spec.md

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
| コーチ＋ロッカールーム統合リデザイン | coach-lockerroom-redesign-v1.0.md |
| マスタースペック（現行仕様） | master-spec.md |
| 世界観設定 | world-setting.md |
| ロスターランダム化 v2 | roster-randomization-design-v2.md |
| 難易度リバランス設計 | difficulty-rebalance-design-v1.0.md |
| 選手成長リバランス v1.0 | growth-rebalance-design-v1.0.md |
| ランキング・ロスター・団体間対戦 リデザイン v1.0 | ranking-roster-redesign-v1.0.md |

### specs/（現行仕様書）

| ドキュメント | ファイル |
|---|---|
| バトルエンジン | battle-engine-spec-v4.1b.md |
| キャラクターデータ（98名） | character-data-spec-v1.4.md |
| 経済システム | economy-system-spec-v1_0.md |
| コンディション/怪我 | condition-system-spec-v1.0.md |
| 週間ゲームループ | weekly-gameloop-spec-v1_0.md |
| 育成/トレーニング v1.2 | training-system-spec-v1_2.md |
| MQスコア＋人気（旧加点制） | mq-popularity-spec-v1.0.md |
| MQスコア減点制 v2.0 | mq-deduction-redesign-v2.0.md |
| 団体ランキング/勝利条件 | org-ranking-spec-v1_0.md |
| タイトル/ベルト | title-system-spec-v1.0.md |
| スカウト | scout-system-spec-v1.0.md |
| ライバル団体AI | rival-org-spec-v1.0.md |
| 特性リスト（25種） | traits-v2.1.md |
| 技テーブル（160技） | 技テーブル_全160技_v3_5.md |
| エンディング/ゲームオーバー v1.0 | ending-gameover-spec-v1.0.md |
| イベントシステム v2 | event-system-spec-v2.md |
| 成長イベントシステム | growth-event-spec-v1.0.md |
| 世界観演出システム | world-presentation-spec-v1.4.md |
| データベースタブ | database-tab-spec-v1.0.md |
| 因縁決着システム | rivalry-resolution-spec.md |
| バランス調整 v1.9 | balance-adjustment-spec-v1.9.md |
| レンタルシステム | rental-system-spec.md |
| ロスター枠制限 v1.0 | roster-cap-design-v1.0.md |
| 引退勧告・引き留め v1.1 | retirement-advisory-spec-v1_1.md |
| フィニッシャーシステム v1.0 | finisher-system-spec-v1.0.md |
| PPV GRAND FINAL 合同興行 v2.0 | ppv-grand-final-spec-v2.0.md |
| ビッグマッチエンジン v1.0 | bigmatch-engine-spec-v1.0.md |
| 人間関係システム v0.2 | relationship-system-spec-v0.2.md |

### docs/（実装ガイド）

| ドキュメント | ファイル |
|---|---|
| PPV実装指示書 | ppv-implementation-guide.md |

### docs/archive/（旧版・完了済み）

| ファイル | 内容 |
|---|---|
| docs/archive/session-history.md | セッション1〜29の開発記録 |
| docs/archive/completed-tasks.md | v1.0〜v2.0の完了済みタスク一覧・マイグレーション一覧 |

### specs/archive/（完了済み実装仕様・旧版）

| ファイル | 内容 |
|---|---|
| v1.3-1-decay-retirement-spec.md | 衰退・引退システム（v1.3-1実装済み） |
| v1.3-2-growth-injury-spec.md | 成長システム改訂＋怪我デバフ（v1.3-2実装済み） |
| v1.3-3-retirement-presentation-spec.md | 引退演出（v1.3-3実装済み） |
| v1.4-awards-impl-spec.md | 年末表彰式（v1.4実装済み） |
| v1.4-awards-ui-revision-spec.md | 年末表彰式UI修正（v1.4実装済み） |
| session25-impl-spec.md | 内部小数化＋MQボーナス見直し（v1.5s25実装済み） |
| session25b-milestone-spec.md | rawDeltaカーブ＋節目イベント（v1.5s25b実装済み） |
| economy-rebalance-spec-v5b.md | 経済リバランス設計書（v1.5として実装済み） |
| card-attendance-redesign-spec-v1.0.md | 集客計算リデザイン設計書（実装済み） |
| popularity-venue-redesign-spec-v1.0b.md | 人気・会場再設計仕様書（実装済み） |
| ppv-awards-spec.md | PPV＋年末表彰式仕様書（実装済み） |
| pricing-balance-spec-v0.99.md | 価格バランス設計書 v0.99（旧版） |
| balance-test-spec.md | バランステスト仕様書（旧版） |
| training-system-spec-v1_0.md | 育成システム v1.0（旧版、v1_2が現行） |
| rival-system-spec-v0_9.md | ライバル団体システム v0.9（旧版） |

---

## メモ

- build-zip.shは要確認: `image/award-frame-*.png`（7枚）と `portrait-map.js` が未包含の可能性あり
- README.mdの「120名以上のキャラクター」は固有キャラ98名＋スカウト生成＋コーチ35名の合算
- セッション17のバランスシミュレーション結果: `tests/balance-sim.js` で再現可能
- 会場ロック判定は `Math.round(G.orgPop)` で比較すること（内部小数化対応）
- **立ち絵画像**: `image/stand/stand_{charId}.webp`（512×768, 2:3）に98枚プレースホルダー配置済み。本番画像で上書きするだけで差し替え可能。観戦モードのCSS `aspect-ratio:2/3` をそのまま利用可能

- 2026-03-10: Fixed missing faction-map portraits in the relationship map by switching power-view SVG portraits from direct <image>+clipPath rendering to inline face patterns.

- 2026-03-10: Tuned relationship-map power-view layout to feel less rigid by loosening org cluster placement, adding more organic polar spread, and softening collision movement in both overview and single-org views.
