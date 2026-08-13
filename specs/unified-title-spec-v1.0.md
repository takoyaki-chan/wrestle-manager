# 全国統一王座 仕様 v1.0

- 昇格: 2026-08-13(Fable)。P1+P2(task-88)/P3(task-89)/P4(task-92)の全実装マージを受けて確定仕様化
- 設計経緯: `docs/unified-championship-proposal-v0.1.md`(裁定8件) / `docs/unified-title-p3-presentation-plan-v0.1.md` / `docs/unified-title-p4-records-plan-v0.1.md`
- セリフの正: `docs/dialogue/unified-title-lines-draft-v0.1.md`(v0.1a・全文承認) / 記事の正: `docs/unified-title-article-drafts-v0.1.md`(v0.1改・全文承認)

## 1. 概要と原則

- 業界全体で**ただ一本**の頂点ベルト。**天頂戦(4年に一度・`season%4===0`)の優勝者に授与**され、次の天頂戦で返還・再授与される
- ベルトは**団体ではなく選手個人に付く**。奪った選手のものになり、その選手の所属団体へ渡る
- 王者への**常設数値バフはなし**(記録と名誉、および統一王座戦そのものの扱いだけが大きい)
- 既存セーブへは遡及しない。導入後最初の天頂戦から創設される

## 2. データ

```js
G.unifiedTitle = null | {
  championId, orgId,            // 保持選手と現所属('player' | aiOrgId)。空位時はnull
  edition, wonSeason, wonWeek,  // 戴冠情報
  defenses,                     // 現政権の防衛数(移動・再戴冠で0リセット)
  challengePeriodKey,           // `${season}-Q${n}`(四半期の冪等キー)
  aiHolderCycles,               // AI保持中の発火数(こちらの番の輪番カウンタ)
  returnedSeason,               // W47返還済みの季(連覇判定にも使用)
  history: [...]                // creation/crown/repeat/move/defense/return/vacate/playerTurn*
}
```

- lazy-init(`createInitialState`で`null`・旧セーブundefined許容・`_migrated_*`不使用)。`repairOnLoad`/`validateGameState`/tickWeek週次スイープで整合
- 予約: `_pendingUnifiedIncomingMatch`(AI→自団体) / `_pendingUnifiedAIMatch`(AI間) / `_pendingUnifiedPlayerTurn`+`_pendingUnifiedAwayMatch`(こちらの番) / `_pendingUnifiedNotification`・`_pendingUnifiedReturnCeremony`(表示用)。全予約は失効自動回収(8週/四半期末)+fail-open再検証
- ゲスト選手(`isUnifiedTitleGuest`)はセーブに残さない

## 3. ライフサイクル

- **授与**: `Engine.ppvTournament.apply()`で優勝者へ(tvModeでも授与)。創設(初回)/戴冠/連覇(`returnedSeason===season`の同一人物)を自動判別
- **返還**: 天頂戦年W47(エントリー週)。データ上の移動は`apply()`のみ=**出場者不足で不成立の年は前王者が保持継続**
- **返上→次の天頂戦まで空位**: 保持選手の引退(プレイヤー5経路+AI週次/季末)・FA化・解雇
- **移籍・引き抜き**: ベルトごと新所属へ追従(`reconcile`)
- 統一王者は天頂戦へ**自動エントリー**(団体枠選出の先頭・プレイヤーは外せない)

## 4. 挑戦サイクル(四半期)

- tickWeek内のperiodKey方式で**1四半期に最大1回**発火。天頂戦年Q4は対象外。王者が出場不可(負傷/レンタル)の四半期はスキップ(持ち越さない)。**創設前は乱数・状態とも一切触れない**
- **挑戦者選定**: 団体=王者所属を除きランキング順の重み`0.65^idx`で抽選 → 選手=その団体の**最高OVR−4圏内**(負傷/レンタル/乱入除外)をOVR順の重み`0.8^idx`で抽選。乱数は`Engine.rng.derive`のローカル(本流を消費しない)
- **3態**: ①自団体が王者→挑戦者が次の通常興行のメインに固定(§5) ②AI同士→四半期最初の通常興行週に派生RNGでシミュレート+新聞 ③**こちらの番**=AI保持中の発火3回ごとに1回、プレイヤーが自団体の資格者(自団体最高OVR−4圏)から選んで**相手団体へ遠征**(1試合・`showTravelScene`)。見送り/敗北/四半期末失効で輪番リセット
- 挑戦は**断れない**(自団体王者への挑戦)。引き分けは防衛

## 5. 興行への挿入(自団体王者の防衛戦)

- B3型予約でメインイベントに固定(`_unifiedTitleMatch`/`_unifiedTitleLocked`)。移動・差し替え・タッグ化・タイトル戦チェック不可
- 先着優先: CR3試合シリーズ > 統一王座戦 > B3(同一興行に予約消化は1件・`hasCompetingBooking`参加)
- **1興行1タイトル制約に参加**(団体王座戦と同居しない・`sanitizeShowCardTitles`)
- 挑戦者はゲスト注入され、興行の全副作用(消耗・怪我・成長・関係値)を持って所属団体へ帰る

## 6. 数値効果

| 項目 | 値 |
|---|---|
| 集客 | 統一王座戦のある興行は動員**1.25倍**(会場キャパ上限・rawDemandにも反映) |
| 人気 | 戴冠・奪取+8/防衛+3(いずれも既存の逓減機構) |
| MQ | **既存タイトル戦経路をそのまま使用**(TITLE_MQ_BONUS+5・リング内エスケープ0.10・王者はunifiedTitle.championIdで判定)。専用加算式は作らない |
| 王者バフ | なし |

## 7. 記録・表彰(P4)

- **careerRecord**: `{type:'unifiedTitle', result:'won'(天頂戦戴冠)|'captured'(防衛戦で奪取)|'defense'}`
- **殿堂pt**: captured **+2**・defense **+2**(1勝対称=「取ったり返したり」に旨みなし)・won **+0**(天頂戦優勝8ptが兼ねる・二重取りなし)。実績リスト(`buildCareerHighlights`)は同じ集計経路で「戴冠(第N代)/奪取/防衛N度」
- **MVPレース**: UNIFIED_DEFENSE **+20**・UNIFIED_CAPTURE **+20**(対称)・年末保持 **+12**・won +0。100季実測: MVP中の統一王者比率38%→56%(較正条項9割は未発動)、殿堂★★★ 45→50(2倍条項未発動)
- **年間表彰**: **非天頂戦年のみ**「全国統一王者」スライド1枚(年末保持者・在位・今季防衛数・オーロラ帯)。天頂戦年・空位年は出さない。団体実績ptへの加点なし
- **記録タブ(📜)**: 歴代王者リスト(第N代・団体・在位期間・防衛数・終わり方=返還/陥落/返上/在位中)+最多防衛・最長在位。未創設セーブでは非表示
- **代数(第N代)の定義**: `history`の creation/crown/repeat/**move** の通し番号(戴冠式・記録タブ・実績リストで共通)

## 8. 演出(P3)

- **アイデンティティカラー=オーロラ**(`--unified`系トークン・index.html :root)。ベルト画像はKeisuke制作までベルト帯+🌐で仮運用
- **戴冠式**(4年に1回・セレモニー級全画面・案B): 暗転+オーロラ光柱+粒子・「頂 点」・優勝者XL 172×258+頭上セリフ・ベルト帯「初代/第N代(連覇)」。AI優勝年も表示。**ファンファーレ=WM-SE-RS04**(最高栄誉ジングル)。タイムアウト30秒+onDone1回
- **決勝後の順序**: 敗者の決着後コメント1枚(勝者カードは出さない=戴冠式が兼ねる) → 優勝画面 → 戴冠式 → コーチ総括(task-73)
- **返還式**(W47・自団体王者のみ): Stageモーダル・在位/防衛/保持者数はhistory実データ。AI王者は新聞のみ
- **挑戦表明**(年3回・常設): `showHostileArrivalStage`の`variant:'unifiedTitle'`(黒Stage+オーロラ・静か版・赤不使用)・挑戦者の口上・「受けて立つ」1択
- **こちらの番**: Office書式(相手王者upper M+候補face52pxチップ+見送り)。タイムアウトは挑戦権を消費せず翌週再提示(defer)
- **結果セリフ**: 統一王座戦の結果画面で defenseWin/beltLost/captureWin/challengeFailed(話者のarchetype)

## 9. 新聞・セリフ

- 記事8種(創設/戴冠/連覇/防衛/移動/返上×2/返還)=`UNIFIED_TITLE_TEMPLATES`・**組み立て式**(リード→経緯→来歴→人物→締め。人物はCHAMPION_CHANGE_TEMPLATESの年齢帯4分割を参照共用)。priority: 移動/戴冠系180・防衛/返還/返上140。大仰トーン許可(2026-08-13裁定・この記事群限定)
- セリフ=`UNIFIED_TITLE_LINES` 7場面×口調7種×3本=147本(v0.1a・Opus稿+Keisuke直し5本)。`EVENT_LINES_BY_KEY`登録済み(ブック往復対象)。選択はderiveローカル

## 10. 不変条件(テスト固定済み)

1. 王者IDは常に現役ロスターに実在し、orgIdは現所属と一致(`validateGameState`+週次スイープ)
2. 創設前は乱数・状態とも不変(旧セーブ・序盤プレイに無影響)
3. 挑戦は1四半期最大1回・天頂戦年Q4は0回。挑戦者は常に資格ルールを満たす
4. 予約はCR/B3/F09/Common-1/奪還と同一興行で衝突しない。ゲストはセーブ非残留
5. defensesは政権交代で必ず0リセット
6. 既存の団体王座カウント・殿堂係数・MVP既存キーは無変更(フィクスチャテスト)
7. 全演出モーダルはタイムアウト保険+二重起動防止+onDone1回

## 11. ファイルマップ

- エンジン: `src/management.js`(`Engine.unifiedTitle` 2350付近〜/mvpRace/awards/newspaper) / 排他: `src/factions.js hasCompetingBooking`・`src/relationships.js processWeekly`
- UI: `src/app.js`(注入・遠征・戴冠式呼出・週次通知) / `src/ui-common.js`(演出4画面・表彰スライド・結果セリフ) / `src/ui-render.js`(バッジ・興行準備・記録タブ) / `src/index.html`(トークン+CSS)
- データ: `src/data.js`(`UNIFIED_TITLE_LINES`/`UNIFIED_TITLE_TEMPLATES`/TITLES)
- テスト: `test/unified-title-test.js`(エンジン)/`unified-title-lines-test.js`(セリフ突き合わせ)/`unified-title-presentation-test.js`(演出)/`unified-title-p4-test.js`(記録)/`tenchosen-final-dialogue-test.js`(決勝後の流れ)。auto-simに分布+I-6計測を常設
