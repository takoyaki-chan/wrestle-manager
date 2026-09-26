'use strict';

// K-1 経路差分テストの許容リスト(= 既知の乖離の台帳)
//
// ■ 使い方(一本化を進めるとき)
//   1. 項目を1つ直して両経路の差が消えたら、`node test/k1-parity/run.js` が
//      「消えた既知差分 K1-xxx」と言って落ちる。その項目をこのリストから削除する。
//      → 以後その場所に差が出ると「未登録の差分」で落ちる(= 差分ゼロに固定される)。
//   2. 新しく差が出たら「未登録の差分」で落ちる。原因を調べ、直すか、ここへ登録する。
//
// ■ 照合のしくみ
//   - checkpoints: A=興行後(tickWeek に渡す状態) / B=tickWeek 直後 / C=実プレイだけの週送り前処理
//                  (closeShowResult の後半) / P=結果画面の先読み tickWeek が G を書き換えた箇所
//   - patterns   : 差分の場所。ID やペアキーは * に畳まれている(例 roster[*].promoStack)。
//                  '*' はドットをまたがない任意文字列、'**' はドットもまたぐ任意文字列
//   - scenarios / modes: その項目を当てはめるシナリオ(省略=全シナリオ)
//   - sides      : checkpoint ごとに許す向き。engOnly=エンジンだけが変えた / appOnly=実プレイだけが
//                  変えた / both=両方変えて値が違う / changed=片側の前後比較(C・P)
//   - mustAppear : true の項目が今回の実行で一度も出なければ「消えた」とみなして落とす
//                  (全シナリオを回したときだけ判定。B の波及・乱数ずれの受け皿は上流が消えれば
//                   一緒に消えるので false にしてある。新しい場所に差が出れば「未登録」で落ちる)
//   - 上から順に最初に当たった項目へ数える(シナリオ限定の項目を先に置いている)
//
// ■ category(差の種類)
//   processing  片方の経路にしか無い処理(処理の有無)
//   formula     両方にあるが式・入力・記録欄が違う
//   rng         処理は同じだが、共有の乱数ストリームを引く回数がずれて結果が変わる
//   leak        結果画面の先読み tickWeek が G を直接書き換える(実プレイだけの副作用)
//   propagation 上流の差が tickWeek を通って広がったもの(B で見える二次的な差)
//   transient   一時キー・表示キュー・ログの形式(数値に効かない)
//
// ■ side(その処理がどちらにあるか): engine=エンジンだけ / app=実プレイだけ / both=両方にあって違う
// ■ impact: 数値=ゲームの数値が動く / 表示=記事・演出・記録の見え方 / 一時=数値にも表示にも残らない
//
// 詳細な説明・数値への影響・移行順は docs/fun-audit-v0.1/k1-parity-report.md を参照。

module.exports = [
  // ════════════════ シナリオ限定(特定の状況でだけ出る差) ════════════════
  // K1-A14(王座戦への乱入が実プレイだけ)と、その tickWeek 後の受け皿 K1-A14B は K-1 第4段 4-A で解消したので外した
  // (2026-09-26)。両経路が試合の前に Engine.show.rollIntrusion(乱数 8888)で判定・差し替えし、Engine.show.finalize が
  // ctx.intrusion を Engine.show.resolveIntrusion で清算する。
  // K1-X15(因縁の記録の時期 ctx.rivalryBeforeTitles。乱入をそろえて見えた差)は同じ第4段 4-A で ctx を統一して消した。
  // 4-A で両経路にそろえた ctx の指定: rivalryBeforeTitles・f08AttendanceMark(§7 X04)・nextMatchBuffCard・markDomeSellout(§7 X10)・
  // crossOrgRelationshipContext / resolveUnifiedTitle(§7 X06 の統一王座)・buildNewspaper・intruderId。
  // K1-E03(怪我による引退の処理一式が実プレイに無い)は K-1 第4段 4-B-6 で解消したので外した(2026-09-26)。
  // 両経路が Engine.show.resolveMatchInjury / applyInjuryRetirementAftermath / buildInjuryRetirementPresentations を通す。
  // 実プレイで引退が起きるようになって見えた、画面側だけの後始末を次の2項目に数える
  // K1-T04(怪我引退の演出データ _pendingInjuryRetirements をエンジンだけが状態に残す)と K1-A16(引退者の関係値・因縁の整理
  // archiveRetiredRivalryState が実プレイだけ)は K-1 第4段 4-A で解消したので外した(2026-09-26)。演出データは状態に積まず
  // fin.presentations で返し(実プレイは一時キーに載せる)、整理は Engine.relationships.archiveRetiredRivalryState を
  // Engine.show.finalize の最後(新聞データの後)で両経路が通す。
  // K1-E04(突然の退団が実プレイで起きない)は K-1 第4段 4-B-7 で解消したので外した(2026-09-26)。
  // 両経路が Engine.show.applySuddenDepartures を通す(前兆の確認は k1-parity-report.md §8 の 4-B 後半)。
  // K1-E05(派閥抗争ポイント・派閥内ポイントの試合ごとの加点が実プレイに無い)は K-1 第4段 4-B-2 で解消したので
  // 外した(2026-09-26)。両経路が Engine.show.accrueFactionPoints を通す。F09 の試合も ×1.8 で加点される。
  // 残る抗争ポイントの差は F09 のスイープボーナス(+15。実プレイだけ)で、K1-A13 に数える。
  // K1-A13(派閥対抗戦 F09 の決着が実プレイだけ)と K1-A12(F07 メイン推薦の消化が実プレイだけ)は K-1 第4段 4-A で解消したので
  // 外した(2026-09-26)。両経路が Engine.show.finalize の中の Engine.show.settleFactionBookings を通す(Common-1・F08・
  // 派閥内序列戦も。§7 X05)。演出データ(F09 の決着・Common-1 の結果・F08 の試合後)は状態に積まず fin.presentations。
  // K1-E06(実プレイの歴代最高評価の記録に matchType と勝者が渡らない)は K-1 第1段で解消したので外した(2026-09-26)。
  // app.js _finalizeShowImpl がエンジンと同じ引数を渡す。あわせて §7 X09(記録更新の経歴の刻印が roster の書き戻しで
  // 消える)も両経路で直した(Engine.mq.updateRecord の careerStamp を書き戻しの後で applyRecordCareerStamp)。
  // K1-E07(自団体の王座移動記事 titleChange が実プレイで消える)は K-1 第1段で解消したので外した(2026-09-26)。
  // app.js _finalizeShowImpl が記事を G ではなく s に積む(乱入者が奪って即空位にした王座は記事にしない)。
  // K1-A09(ラストラン出場後の即引退が実プレイだけ)は K-1 第4段 4-A で解消したので外した(2026-09-26)。両経路が
  // Engine.show.retireLastRunFighters を通す(新聞データはその後で組む)。
  // K1-A10(ドーム興行の経歴 domeMain・ドーム回数・初ドームの節目が実プレイだけ)は K-1 第4段 4-A で解消したので外した
  // (2026-09-26)。両経路が Engine.show.finalize の中の Engine.show.recordCareerMarks を通す(MVP 用の大試合 bigMatch・§7 X07 も)。
  // K1-A11(メディア密着取材の消化が実プレイだけ)は K-1 第4段 4-A で解消したので外した(2026-09-26)。両経路が
  // Engine.show.finalize の中で Engine.eventSystem.processMediaSpotlight を通す(団体人気は 0〜100 に収める)。
  // K1-A15(タッグ不仲ペアの試合後 信頼−1)は、裁定 K-12 の実装(7ba3738e: Engine.showTagMatch に4経路を
  // 通した)で差が消えたので外した(2026-09-26)。以後この場所に差が出ると「未登録」で落ちる。
  // K1-X03(怪我判定の引数。実プレイは週・季に 0 を渡し、険悪ペアの怪我率×2 と舞台の格を渡していなかった)は
  // K-1 第4段 4-B-3 で解消したので外した(2026-09-26)。両経路が Engine.show.rollMatchInjury で引数を組む。
  // K1-F01(タッグの人気・連敗・勝敗の付け方。実プレイは敗者も勝者扱い)は K-1 第4段 4-B-1 で解消したので外した
  // (2026-09-26)。両経路が Engine.show.applyMatchPopularity を通す。タッグにもメイン低評価の人気減と
  // ヒール適性の加点が掛かる(裁定)。以後この場所に差が出ると「未登録」で落ちる。
  // K1-A07(タッグ試合の直近戦績。実プレイは対角4組・エンジンは記録なし)は K-1 第3段で解消したので外した(2026-09-26)。
  // 両経路が Engine.show.finalize で1試合1枠(A1↔B1・A2↔B2、tag: true の印)を記録する(報告書の推奨③)。
  // K1-E08(因縁決着エントリの記録欄。エンジン=lastShowNumber / 実プレイ=宿怨の勝者ID)は K-1 第2段で解消したので
  // 外した(2026-09-26)。両経路が Engine.show.resolvedRivalryEntry で作り、両方の欄を持つ。

  // ════════════════ 全シナリオ共通(毎回出る差) ════════════════
  // K1-E01(出場選手のプロモ蓄積 promoStack のリセットが実プレイに無い)は K-1 第4段 4-B-5 で解消したので外した
  // (2026-09-26)。両経路が Engine.show.resetPromoStacks を通す。これで B の週次の行動(プロモ/練習)・収入・人気の差と、
  // それを起点にした共有乱数のずれ(K1-B04)も多くのシナリオで消えた。以後この場所に差が出ると「未登録」で落ちる。
  // K1-E02(試合成長の式。実プレイに年齢倍率・関係性倍率が無く、タッグの相手は強い方)は K-1 第4段 4-B-4 で
  // 解消したので外した(2026-09-26)。両経路が Engine.show.applyMatchGrowth を通す(タッグの相手は2人の平均=裁定)。
  // tickWeek 後(B)に残る能力の差は、実プレイだけの処理(K1-A01 の信頼ボーナスなど)の波及で、K1-B06 に数える。
  // K1-A01(キャリア最高評価 careerBestMQ の更新と信頼ボーナス +1.2 が実プレイだけ)と K1-A02(ブレークスルー・敗戦スランプ・
  // スランプ/モチベ喪失のモメンタムが実プレイだけ)は K-1 第4段 4-A で解消したので外した(2026-09-26)。両経路が
  // Engine.show.finalize の中の Engine.show.applyGrowthEvents を通す(乱数 0xB818・0x5C6・0x5C7・0x5C8 を両経路が引く)。
  // 去った選手が K1-A01 の差を持ち出していた K1-A01B も一緒に外した。
  // K1-A03(季節統計 seasonStats: 興行数・勝敗・最高評価)は K-1 第2段で解消したので外した(2026-09-26)。
  // 両経路が Engine.show.accumulateSeasonStats を通す。季の収支合計(seasonStats.total*・peak*)は closeShowResult の
  // 後半にあり、K1-C05 に数える(第5段で tickWeek へ)。
  // K1-A04(興行結果の新聞データ currentNewspaper → 週刊新聞の興行記事)は K-1 第2段で解消したので外した(2026-09-26)。
  // 両経路が Engine.show.buildShowNewspaperData を通す(見出し・本文のテンプレは app.js が読み込み時に登録)。
  // 乱入・ラストラン・F09 の週に残る新聞の差は、それぞれ K1-A14・K1-A09・K1-A13 の写り込み。
  // K1-A06(対戦成績の履歴メタ=元同僚の初対面・派閥抗争中・ロッカー荒廃中・奪還戦と、元同僚初対面の記事)は
  // K-1 第2段で解消したので外した(2026-09-26)。両経路が Engine.show.recordShowH2h(印は Engine.show.buildMatchMeta)を通す。
  // K1-P01(結果画面の先読み tickWeek が G を直接書き換える)は K-1 第1段で解消したので外した(2026-09-26)。
  // エンジン側で逓減カウンター・W-1 回数・伝染のクールダウン・関係フラグのクールダウン・他団体の経歴の区切り・
  // ブレークスルー記録の台詞を「写してから書く」形にし、先読みには G の複製を渡す(app.js prepareShowResultInlinePopups)。
  // 以後、先読み(P)で G が変わると「未登録」で落ちる。
  // K1-T01(_pendingReclaim の null 正規化。エンジンだけ saveDoctor の戻り値を常に採用)は K-1 第2段で解消したので
  // 外した(2026-09-26)。Engine.saveDoctor.repairProgressionState が、予約の無い状態に null の欄を作らない。
  {
    id: 'K1-T02', title: '宣戦布告ポップアップ既読(_rivalryPopupSeen)',
    category: 'transient', side: 'app', impact: '一時', checkpoints: ['A', 'B'],
    patterns: ['_rivalryPopupSeen'], mustAppear: true, refs: 'app.js(興行準備〜試合前の演出)',
  },
  {
    id: 'K1-T03', title: '興行ログ(エンジンは文字列イベントを戻り値で返して捨てる/実プレイは構造化イベントを gameLog に積む)',
    category: 'transient', side: 'both', impact: '表示', checkpoints: ['A', 'B'],
    patterns: ['gameLog'], mustAppear: true, refs: 'management.js:15649(events を返す) / app.js:9248(gameLog に追加)',
    note: '実プレイは applyMQPopularity の popEvents(メイン低評価・連敗の人気減)を捨てていて、ログに出ない。',
  },

  // ════════════════ tickWeek を通った波及(B) ════════════════
  {
    id: 'K1-B01', title: 'お金(週次収支)— 引退/退団者の給与・乱入・密着取材などの波及(プロモ収入の差 K1-E01 は第4段 4-B-5 で解消)',
    category: 'propagation', side: 'both', impact: '数値', checkpoints: ['B'],
    patterns: ['funds', 'weeklyFinance.*', 'weeklyFinance.**'], mustAppear: false, refs: 'K1-E03 / K1-E04 / K1-A09 / K1-A14 / K1-A11 の波及',
  },
  {
    id: 'K1-B02', title: 'ロッカールーム士気',
    category: 'propagation', side: 'both', impact: '数値', checkpoints: ['B'],
    patterns: ['lockerRoomMorale'], mustAppear: false, refs: '信頼・関係値の差の波及',
  },
  {
    id: 'K1-B03', title: 'AI団体選手の信頼の微差(±0.01)— 自団体の信頼ボーナス(K1-A01)の波及',
    category: 'propagation', side: 'both', impact: '数値', checkpoints: ['B'],
    patterns: ['aiOrgs.*.roster[*].trust'], mustAppear: false,
    refs: 'what-if 実験: 実プレイの tickWeek 入力で promoStack と careerBestMQ/_trustBonus をエンジン側に揃えると消える。AI側の処理(乱数 0xA101〜3・0xAC01 の引き数)は両経路で同じ',
  },
  {
    id: 'K1-B04', title: '関係値・因縁帯の週次変動の差(上流の差を起点にした共有乱数のずれ+入力の差。プロモ差 K1-E01 起点の分は 4-B-5 で消えた)',
    category: 'rng', side: 'both', impact: '数値', checkpoints: ['B'],
    patterns: ['relationships.*', 'relationships.*.bond', 'relationships.*.rivalry', 'rivalries.*.lastBand', 'popOvertakeTriggered.*'],
    mustAppear: false,
    refs: 'relationships.js の週次減衰・週次ストーリー(0xBE1B)・N-03/N-04。what-if 実験: promoStack だけ揃えると AI ペアの関係値の差(veteran で48箇所)が消える',
  },
  {
    id: 'K1-B05', title: '週次の語り(Glimpse・スナップショット・節目・新聞既読)の選ばれ方',
    category: 'rng', side: 'both', impact: '表示', checkpoints: ['B'],
    patterns: ['_glimpse*', '_glimpse*.*', '_glimpse*.*.*', '_pendingGlimpse*', '_pendingGlimpse*[*].*', '_snapshotCooldowns.*',
      '_pendingMilestone.*', '_lastMilestoneAbsWeek', 'newsSeen.**'],
    mustAppear: false, refs: 'スナップショット(0x5A30)・Glimpse の抽選。入力と乱数の両方の差',
  },
  {
    id: 'K1-B06', title: '自団体選手の週次状態の波及(練習/プロモ/休養・コンディション・人気・信頼・警告デバフ など)',
    category: 'propagation', side: 'both', impact: '数値', checkpoints: ['B'],
    // _milestoneBaseline: 成長の節目の比較基準(2026-09-25 通知・ログの修正で新設)。週末のロスターの写しなので同じ波及を受ける
    patterns: ['roster[*].*', 'roster[*].*.*', '_milestoneBaseline.**', '_milestoneQueue'], mustAppear: false, refs: 'K1-A01・K1-A02 などの波及(K1-E01・K1-E02 は第4段で解消)',
  },

  // ════════════════ 実プレイだけの週送り前処理(C: closeShowResult の後半) ════════════════
  {
    id: 'K1-C01', title: '王座の設立(titleEstablished)',
    category: 'processing', side: 'app', impact: '数値', checkpoints: ['C'],
    patterns: ['titleEstablished'], mustAppear: true, refs: 'app.js:15277-15288(判定式は Engine.title.checkTitleEstablishment にあるが呼ぶのは画面側だけ)',
  },
  {
    id: 'K1-C02', title: '契約枠の拡大(rosterCap と通知フラグ)',
    category: 'processing', side: 'app', impact: '数値', checkpoints: ['C'],
    patterns: ['rosterCap', 'rosterCapPop25Notified', 'rosterCapPop50Notified', 'rosterCapPop70Notified', 'rosterCapRank1Notified'],
    mustAppear: true, refs: 'app.js:15162-15218',
  },
  {
    id: 'K1-C03', title: 'サバイバル(赤字地獄ゲージ・卒業・直近4週の収支)',
    category: 'processing', side: 'app', impact: '数値', checkpoints: ['C'],
    patterns: ['survivalMilestones', 'recentWeeklyNet', 'rollingNet4Count', 'survivalCleared', 'survival*'],
    mustAppear: true, refs: 'app.js:1885-1915(Survival.updateSurvival), 15143-15155',
  },
  {
    id: 'K1-C04', title: '序章ハイライト(prologue.highlights)',
    category: 'processing', side: 'app', impact: '表示', checkpoints: ['C'],
    patterns: ['prologue.highlights[*](presence)', 'prologue.*'], mustAppear: true, refs: 'app.js:15223-15274',
  },
  {
    id: 'K1-C05', title: '財務履歴・季節の収支合計(financeHistory / fundsHistory / seasonStats.total*)',
    category: 'processing', side: 'app', impact: '表示', checkpoints: ['C'],
    patterns: ['financeHistory', 'fundsHistory', 'seasonStats.*'], mustAppear: true, refs: 'app.js:11041-11050, 11663-11679',
  },
  {
    id: 'K1-C07', title: '節目(マイルストーン)バフの消化(週数・興行数の減算と weekly_funds の資金加算)',
    category: 'processing', side: 'app', impact: '数値', checkpoints: ['C'],
    patterns: ['milestoneBuffs', 'milestoneBuffs[*].*', 'funds'],
    mustAppear: true, refs: 'app.js:11087-11090 → 13219-13244(_tickMilestoneBuffsShow / _applyWeeklyBuffEffects / _tickMilestoneBuffsWeekly)',
    note: 'バフの付与(節目イベントの選択)も画面側だけなので、auto-sim の世界にはバフが存在しない。mq_boost / rivalry_chance_up などがエンジン経路では切れない。',
  },
  {
    id: 'K1-C06', title: '表示キューの消化・週送り準備(Glimpse・週ログ・大ニュース通知・カード初期化・weekPhase)',
    category: 'transient', side: 'app', impact: '一時', checkpoints: ['C'],
    patterns: ['_pendingGlimpseA', '_pendingGlimpseB', 'weekLogFeed', 'gameLog', '_bigNewsNotifiedWeek', '_bigNewsUnread', 'showCard', 'weekPhase',
      '_pendingGrowthEvents',
      // 第4段 4-B-7: 突然の退団の演出データは closeShowResult が tickWeek の後で取り出してトーストにする
      '_pendingSuddenDepartures', '_pendingSuddenDepartures[*](presence)'],
    mustAppear: true, refs: 'app.js:11053-11298',
  },
];
