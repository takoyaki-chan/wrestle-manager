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
  {
    id: 'K1-A14', title: '王座戦への乱入(他団体選手への差し替え・熱/人気/バトルポイント・乱入CD)',
    category: 'processing', side: 'app', impact: '数値', scenarios: ['intrusion'], checkpoints: ['A'],
    patterns: [
      'lastShowResults[*].**', 'h2h.*', 'h2h.*.**', 'rivalries.*', 'rivalries.*.*', 'battlePoints.player',
      'lastIntrusionWeek', 'showCard[*].right', 'matchupLog', 'lastShowAttendance', 'orgPop',
      '_rivalryResolvedThisWeek', 'n01CooldownWeeks.*', 'n06CooldownWeeks.*', 'roster[*].careerRecord.history[*].*',
      'relationships.*', 'relationships.*.*', 'relationshipCounters.*', 'roster[*].*', 'roster[*].*.*', '_modalQueue',
    ],
    mustAppear: true, refs: 'app.js:7004-7047(判定・差し替え), 7845-7890(結果処理) / エンジン側なし',
    note: '乱入は App.executeShow の中でだけ判定される。王座戦の対戦相手そのものが変わるので、この興行の結果は全面的に別物になる。',
  },
  {
    id: 'K1-A14B', title: '乱入シナリオの tickWeek 後(対戦相手が違うので全面的に別物)',
    category: 'propagation', side: 'app', impact: '数値', scenarios: ['intrusion'], checkpoints: ['B'],
    patterns: ['**'], mustAppear: false, refs: 'K1-A14 の波及',
  },
  {
    id: 'K1-E03', title: '怪我による引退(wear 超過の重傷・壮絶な幕切れ)の処理一式',
    category: 'processing', side: 'engine', impact: '数値', scenarios: ['injury'], checkpoints: ['A', 'B'],
    patterns: [
      'roster[*](presence)', 'retiredFighters[*](presence)', 'retiredIds', 'retiredSeasons.*',
      'chronicle.fighterArchive[*](presence)', 'relationships.*.frozen', 'relationships.*.bond', 'relationships.*.rivalry',
      'relationshipCounters.*', '_pendingInjuryRetirements', 'factions[*].memberIds', 'newsSeen.**',
      'roster[*].pw', 'roster[*].sp', 'roster[*].te', 'roster[*].st', 'roster[*].mn', 'roster[*].seasonGrowth.*',
    ],
    sides: { A: ['engOnly', 'appOnly', 'both'] },
    mustAppear: true, refs: 'management.js:15084-15190(引退・O-04・信頼・王座) / app.js:8317-8331(怪我だけ付けて残す)',
    note: '実プレイは retireType を記録するだけで引退させない(ロスターに残って長期離脱になる)。'
      + 'エンジンは引退者をロスターから外すので、以降の試合成長の乱数(1732)の引き数がずれ、他の選手の伸びる能力も入れ替わる(乱数消費のずれ)。',
  },
  {
    id: 'K1-E04', title: '突然の退団(信頼15未満・1興行2.5%)',
    category: 'processing', side: 'engine', impact: '数値', scenarios: ['departure'], checkpoints: ['A', 'B'],
    patterns: [
      'roster[*](presence)', 'freeAgents[*](presence)', '_pendingSuddenDepartures[*](presence)', 'lockerRoomMorale',
      'relationships.*', 'relationships.*.*', 'rivalries.*', 'roster[*].pw', 'roster[*].sp', 'roster[*].te', 'roster[*].st',
      'roster[*].seasonGrowth.*',
    ],
    mustAppear: true, refs: 'management.js:15494-15561 / app.js なし(表示だけ app.js:12045 にある)',
    note: 'Engine.trust.checkSuddenDepartures の呼び出しはエンジンの executeShow だけ。実プレイでは表示コードだけが残っていて、発生源が無い。',
  },
  {
    id: 'K1-E05', title: '派閥抗争ポイント・派閥内ポイントの試合ごとの加点',
    category: 'processing', side: 'engine', impact: '数値', scenarios: ['factions'], checkpoints: ['A', 'B'],
    patterns: ['factionRivalryPoints.*.pointsA', 'factionRivalryPoints.*.pointsB', 'factionInternalPoints.*', '_rivalryPointsWeekly'],
    mustAppear: true, refs: 'management.js:15263-15292 / app.js なし',
    note: 'accrueRivalryPointsFromMatch / accrueInternalPointsFromExternalMatch は実プレイで一度も呼ばれない。'
      + '実プレイ側の値が動くのは F09 のスイープボーナス(K1-A13)だけ。',
  },
  {
    id: 'K1-A13', title: '派閥対抗戦 F09 の決着(スイープボーナス・年表・決着記事・クールダウン・予約の解除)',
    category: 'processing', side: 'app', impact: '数値', scenarios: ['factions'], checkpoints: ['A', 'B'],
    patterns: ['_pendingF09', 'factionTimeline', 'factionEventCooldowns.*', '_industryNewsEvents'],
    mustAppear: true, refs: 'app.js:8530-8618 / エンジン側なし(_f09Locked は加点倍率にだけ使う)',
  },
  {
    id: 'K1-E06', title: '歴代最高評価(MQ記録)のタッグ別記録と記録更新記事',
    category: 'formula', side: 'both', impact: '表示', scenarios: ['mq-record'], checkpoints: ['A', 'B'],
    patterns: ['mqRecordTag.*', '_industryNewsEvents'],
    mustAppear: true, refs: 'management.js:14866-14894(matchType・勝者を渡す) / app.js:8146-8159(渡さない)',
    note: '実プレイは updateRecord に matchType と勝者を渡さないので、タッグの記録はシングルの記録として扱われ(タッグ記録は更新されない)、'
      + '記録更新記事(mqAllTimeRecord / mqTagRecord)も勝者不明で出ない。',
  },
  {
    id: 'K1-E07', title: '自団体の王座移動記事(titleChange)',
    category: 'processing', side: 'engine', impact: '表示', scenarios: ['title-defense'], checkpoints: ['A'],
    patterns: ['_industryNewsEvents'],
    mustAppear: true, refs: 'management.js:14696 / app.js:7836(G に積むが 9248 の G={...s} で上書きされて消える)',
  },
  {
    id: 'K1-A09', title: 'ラストラン出場後の即引退(引退記録・年代記・関係値凍結/整理・信頼)',
    category: 'processing', side: 'app', impact: '数値', scenarios: ['lastrun'], checkpoints: ['A', 'B'],
    patterns: [
      'roster[*](presence)', 'retiredFighters[*](presence)', 'retiredIds', 'retiredSeasons.*',
      'chronicle.fighterArchive[*](presence)', 'relationshipHistory.retiredRivalries', 'relationships.*', 'relationships.*.*',
      'rivalries.*', 'rivalries.*.*', 'roster[*]._departureBondImpact', 'roster[*].trust', 'newsSeen.**',
    ],
    mustAppear: true, refs: 'app.js:9272-9344(finalize)・10867-10970(closeShowResult 前半) / エンジン側なし',
  },
  {
    id: 'K1-A10', title: 'ドーム興行の経歴記録(domeMain)・ドーム回数・初ドームの節目',
    category: 'processing', side: 'app', impact: '数値', scenarios: ['dome'], checkpoints: ['A', 'B'],
    patterns: ['domeShowsThisSeason', 'roster[*].careerRecord.history', 'milestones.first_dome_show'],
    mustAppear: true, refs: 'app.js:9046-9083, 13089-13107(興行前の節目) / エンジン側なし',
  },
  {
    id: 'K1-A11', title: 'メディア密着取材の消化(人気・信頼・団体人気・関係値)',
    category: 'processing', side: 'app', impact: '数値', scenarios: ['directives'], checkpoints: ['A', 'B'],
    patterns: ['mediaSpotlight', 'orgPop', 'relationships.*', 'relationships.*.*', 'rivalries.*', 'rivalries.*.*', 'roster[*].popularity', 'roster[*].trust'],
    mustAppear: true, refs: 'app.js:9250-9270(団体人気は clamp なしで加算) / エンジン側なし',
  },
  {
    id: 'K1-A12', title: 'F07 メイン推薦の消化(残り興行数だけ減る。信頼の増減は上書きで消える)',
    category: 'processing', side: 'app', impact: '数値', scenarios: ['directives'], checkpoints: ['A', 'B'],
    patterns: ['_pendingF07Directive.remainingShows'],
    mustAppear: true, refs: 'app.js:8494-8528(_applyTrustToMembers の結果は 8807 の roster 上書きで失われる)',
  },
  {
    id: 'K1-A15', title: 'タッグ不仲ペアの試合後 信頼−1(1試合ずつスキップ/観戦のときだけ)',
    category: 'processing', side: 'app', impact: '数値', scenarios: ['tag-lowbond'], modes: ['skipEach'], checkpoints: ['A'],
    patterns: ['roster[*].trust'],
    mustAppear: true, refs: 'app.js:7256-7264, 7404-7412 / skipAllMatches(7670-7690)とエンジンにはない',
    note: '能力−3(_penalize)は power/speed 等の存在しないキーを下げていて、どの経路でも試合に効かない。lowBondA/B の指定もエンジンは読まない。',
  },
  {
    id: 'K1-F01', title: 'タッグの人気・連敗・勝敗の付け方(実プレイは敗者も勝者扱い)',
    category: 'formula', side: 'both', impact: '数値', scenarios: ['tag-mixed', 'mq-record', 'tag-lowbond'], checkpoints: ['A', 'B'],
    patterns: ['roster[*].popularity', 'roster[*].losingStreak', 'roster[*].lastMatchResult'],
    mustAppear: true, refs: 'management.js:14990-15010 / app.js:8258-8271(left と right に同じ選手を入れて applyMQPopularity を呼ぶため、どちらが勝っても勝者判定になる)',
  },
  {
    id: 'K1-A07', title: 'タッグ試合の直近戦績(recentMatches・対角4ペア)',
    category: 'processing', side: 'app', impact: '表示', scenarios: ['tag-mixed', 'mq-record', 'tag-lowbond'], checkpoints: ['A', 'B'],
    patterns: ['roster[*].recentMatches'],
    mustAppear: true, refs: 'app.js:8979-8995 / management.js:15450-15455(タッグは飛ばす)',
  },
  {
    id: 'K1-E08', title: '因縁決着エントリの記録欄(エンジン=lastShowNumber / 実プレイ=宿怨の勝者ID)',
    category: 'formula', side: 'both', impact: '表示', scenarios: ['title-defense', 'rivalry'], checkpoints: ['A', 'B'],
    patterns: ['rivalries.*.lastShowNumber', 'rivalries.*.bitterResolutionWinnerId'],
    mustAppear: true, refs: 'management.js:14920-14932 / app.js:8192-8204。lastShowNumber は誰も読まない。bitterResolutionWinnerId は app.js:132 の試合前演出が読む',
  },

  // ════════════════ 全シナリオ共通(毎回出る差) ════════════════
  {
    id: 'K1-E01', title: '出場選手のプロモ蓄積(promoStack)リセット',
    category: 'processing', side: 'engine', impact: '数値', checkpoints: ['A', 'B'],
    patterns: ['roster[*].promoStack'], sides: { A: ['engOnly'] },
    mustAppear: true, refs: 'management.js:15048-15052 / app.js なし',
    note: 'B では週次の行動がプロモ(エンジン)と練習(実プレイ)に分かれ、収入・人気・コンディション・乱数(tickMain)の消費まで変わる(K1-B01〜B05)。',
  },
  {
    id: 'K1-E02', title: '試合成長の式(年齢倍率・関係性倍率・タッグの相手OVRの取り方)',
    category: 'formula', side: 'both', impact: '数値', checkpoints: ['A', 'B'],
    patterns: ['roster[*].pw', 'roster[*].sp', 'roster[*].te', 'roster[*].st', 'roster[*].mn', 'roster[*].seasonGrowth.*', 'roster[*].growthLog', 'roster[*].statPeak.*'],
    mustAppear: true, refs: 'management.js:15294-15420(×_relationshipGrowthMult ×ageMultiplier、タッグは相手2人の平均) / app.js:8715-8805(どちらも無し、タッグは相手の最大)',
  },
  {
    id: 'K1-A01', title: 'キャリア最高評価(careerBestMQ)の更新と信頼ボーナス(+1.2)',
    category: 'processing', side: 'app', impact: '数値', checkpoints: ['A', 'B'],
    patterns: ['roster[*].careerBestMQ', 'roster[*]._trustBonus', 'roster[*]._trustBonusSources'], sides: { A: ['appOnly'] },
    mustAppear: true, refs: 'app.js:8890-8897 / エンジンは更新しない(management.js:15193 のコメントどおり)',
  },
  {
    id: 'K1-A02', title: 'ブレークスルー判定・敗戦スランプ・スランプ/モチベ喪失のモメンタム',
    category: 'processing', side: 'app', impact: '数値', checkpoints: ['A', 'B'],
    patterns: ['roster[*].slump.recoveryMomentum', 'roster[*].slump', 'roster[*].motivationLoss', 'roster[*].hotStreak', '_pendingGrowthEvents'],
    mustAppear: true, refs: 'app.js:8829-8941 / エンジン側なし(乱数ストリーム 0xB818/0x5C6/0x5C7/0x5C8 は実プレイだけが引く)',
  },
  {
    id: 'K1-A03', title: '季節統計(seasonStats: 興行数・勝敗・最高評価)',
    category: 'processing', side: 'app', impact: '表示', checkpoints: ['A', 'B'],
    patterns: ['seasonStats.*'], sides: { A: ['appOnly'] },
    mustAppear: true, refs: 'app.js:8809-8827 / エンジン側なし(序章ハイライトや年間表彰が読む)',
  },
  {
    id: 'K1-A04', title: '興行結果の新聞データ(currentNewspaper)→ 週刊新聞の興行記事',
    category: 'processing', side: 'app', impact: '表示', checkpoints: ['A', 'B'],
    patterns: ['currentNewspaper', 'weeklyNewspaper'],
    mustAppear: true, refs: 'app.js:9355-9363 / エンジン側なし(auto-sim の新聞には自団体の興行記事が載らない)',
  },
  {
    id: 'K1-A06', title: '対戦成績の履歴メタ(裏切り初対面・派閥抗争・ロッカー荒廃)と元同僚初対面ニュース',
    category: 'processing', side: 'app', impact: '表示', checkpoints: ['A', 'B'],
    patterns: ['h2h.*.history[*].lc', 'h2h.*.history[*].bt', 'h2h.*.history[*].fc', 'h2h.*.history[*].rc'],
    mustAppear: true, refs: 'app.js:8957-8975, 11620-11644 / management.js:15445(meta なし)',
  },
  {
    id: 'K1-P01', title: '結果画面の先読み tickWeek が G を直接書き換える(逓減カウンター・W-1回数・モーダル・フラグCD)',
    category: 'leak', side: 'app', impact: '数値', checkpoints: ['A', 'B', 'P'],
    patterns: ['relationshipCounters.*', 'relationshipCounters.*.count', 'relationshipCounters.*.lastWeek',
      'w1FireCount.*', '_modalQueue', 'relationshipFlagCounters.*', 'relationshipFlagCounters.*.lastWeek'],
    sides: { P: ['changed'] },
    mustAppear: true, refs: 'app.js:10286-10288(prepareShowResultInlinePopups) → relationships.js:784-798(カウンターを直接減らす), 886/936(w1FireCount), 2754-2770(_modalQueue / flagCounters)',
    note: 'W-1 回数は実プレイの興行週だけ二重に数えられ、「慢性的険悪ペア(累計4回)」の書類が早く出る。関係性モーダルも1件重複して積まれる。',
  },
  {
    id: 'K1-T01', title: '_pendingReclaim の null 正規化(エンジンだけ saveDoctor の戻り値を常に採用)',
    category: 'transient', side: 'engine', impact: '一時', checkpoints: ['A', 'B'],
    patterns: ['_pendingReclaim'], mustAppear: true, refs: 'management.js:14588-14590, 275-298',
  },
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
    id: 'K1-B01', title: 'お金(週次収支)— 主にプロモ収入の差(K1-E01)と引退/退団者の給与',
    category: 'propagation', side: 'both', impact: '数値', checkpoints: ['B'],
    patterns: ['funds', 'weeklyFinance.*', 'weeklyFinance.**'], mustAppear: false, refs: 'K1-E01 / K1-E03 / K1-E04 / K1-A09 の波及',
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
    id: 'K1-B04', title: '関係値・因縁帯の週次変動の差(プロモ差 K1-E01 を起点にした共有乱数のずれ+入力の差)',
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
    patterns: ['roster[*].*', 'roster[*].*.*'], mustAppear: false, refs: 'K1-E01・K1-A01・K1-E02 などの波及',
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
    patterns: ['_pendingGlimpseA', '_pendingGlimpseB', 'weekLogFeed', 'gameLog', '_bigNewsNotifiedWeek', '_bigNewsUnread', 'showCard', 'weekPhase'],
    mustAppear: true, refs: 'app.js:11053-11298',
  },
];
