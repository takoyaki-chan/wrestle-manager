# MQシステム仕様書 v1.0

> **ステータス**: 🟢 確定(2026-07-24 実装完了・P1〜P5全フェーズ着地)
> **対応コード**: `src/management.js` `Engine.mq`(2120〜2746行) / `src/match-engine.js`(素点計算・リング内効果・超過レイヤー) / `src/data.js`(`FILL_PRESSURE_BANDS`/`VENUE_HEAT_TIER_AMP`/`SHOW_RATING_CONFIG`/`BIG_NEWS_TYPES`/`NEWS_HEADLINE_TEMPLATES`) / `src/app.js`・`src/ui-common.js`・`src/ui-render.js`(週頭通知・一面演出)
> **設計文書**: `docs/mq-redesign-proposal-v0.5.md`(全設計判断・§7決定記録)
> **前身**: `specs/archive/mq-deduction-redesign-v2.0.md`(旧・減点制v2.0。経路2本併存+固定加算+外部+12キャップの世代。本書が置き換え)
> **依存spec**: `battle-engine-spec-v4.2.md`(MQが乗る試合エンジンそのもの) / `org-ranking-spec-v2.0.md`(§7 `topChampionInjury`が参照する業界ランキングrank1/2)
> **作成日**: 2026-07-24
> **🔧マーク = 調整可能パラメータ**

---

## §1 MQの三層構造

MQ(Match Quality)は「その試合がどれだけ良かったか」を表す唯一の指標。全要素を洗い出し、**「その点数はリングの中で実際に起きたことか?」**の一点で再設計した結果、次の三層に組み上がっている。固定加算(御守り型のボーナス)は存在しない。

> **プレイヤー向け表記(2026-08-31確定)**: 「MQ」は内部名であり、プレイヤーに見せる画面・ログ・新聞では**「試合評価」**(短縮ラベルは「評価」、複合語は「平均評価/最高評価/通算評価/決勝評価」)と表記する。旧セーブに焼き込まれた旧表記はロード時マイグレーション(`_migrated_mq_text_v2`, src/app.js。v1はcurrentNewspaper/mvpRaceの漏れ+和文直結パターン未カバーがあり2026-08-31にv2で再走・冪等)で同表記へ書き換える。走破検出器(test/ui-walkthrough/detectors.js)が可視テキスト中のMQトークンを恒常検査する。本spec内の「MQ」は内部システム名としての使用であり変更しない。

| 層 | 中身 | 何が決めるか | 節 |
|---|------|------|---|
| 土台 | OVシーリング(4セグメント) | 選手の実力(重力) | §3.1 |
| 中身 | ドラマ回復(減点からの戻り)+超過レイヤー | その夜リングで実際に起きたこと | §3.2〜3.5 |
| 空気 | 観客帯(venueHeat)×試合注目度(engagement) | 会場の熱と、観客がその試合をどれだけ観たかったか | §5 |

因縁・タイトル・trust・バフ・メイン枠・ラストランは「MQへの固定加算」ではなく、**リング内効果(simulateMatchへの入力になり、素点そのものが動く)**か**注目度への寄与**のどちらか(または両方)に変換されている(§4)。「経路が2本あり結果が食い違う」「観客+4がほぼ定数の下駄」といった旧v2.0の問題は解消済み。

```
MQ = 天井(OVシーリング, §3.1)
     − ドラマ減点(§3.2) − ペーシング減点(§3.3) − 決着減点(§3.4)
     + 超過レイヤー(§3.5、蓋を開けた夜だけ)
     + crowd = round(venueHeat × engagement)  ※通常興行profileのみ(§5)
   → finalMq = max(5, …)   ※上限クランプなし
```

---

## §2 確定経路の一本化

### 2.1 シグネチャ

```js
Engine.mq.finalize(state, matchResult, context = {}, profile = 'raw')
```
`src/management.js:2299`。DOM非依存の純粋関数。headless(`Engine.executeShow`)とプレイヤー画面(`App._finalizeShowImpl`)を含む**全経路がこの1関数を呼ぶ**。`matchResult.mq`(素点。§3で算出済み)に外部加算(profileごとに定義)を足し、`max(5, …)` で下限クランプするだけ。段階的な100クランプは経路のどこにも存在しない。

### 2.2 profile 5種と適用要素

`Engine.mq.PROFILES = new Set(['normal-single', 'normal-tag', 'ppv', 'ai-show', 'raw'])`

| profile | finalize側の外部加算 | 意味 |
|---|---|---|
| `normal-single` | crowd(venueHeat×engagement)のみ | 因縁/タイトル/trust/バフ/メイン/ラストランは全てPass1で**リング内化**済み(§4)。finalizeの責務はcrowdだけ |
| `normal-tag` | crowd(venueHeat×engagement)のみ | 同上(タッグは因縁/タイトル/trust/バフのリング内化は対象外。既存スコープ通り) |
| `ppv` | なし(素点=最終) | PPV GRAND FINAL・天頂戦。因縁のリング内化(§4.1)を**呼び出し側が`rivalryOnly`で渡す**。finalizeの外部加算はゼロ |
| `ai-show` | なし(素点=最終) | AI団体同士の通常興行。同上 |
| `raw` | なし(素点=最終) | ジュニア/春タッグ/秋勝ち残り/B2団体内紛/B3挑戦状/対抗戦/Common-1等のイベント戦。特殊興行に通常会場補正を持ち込まない |

「経路は一本、仕様差はprofileで明示」が原則。

### 2.3 呼び出し経路一覧

| 経路 | 呼び出し元 | profile |
|---|---|---|
| 通常興行(headless) | `Engine.executeShow`(`management.js:12261`) | `normal-single`/`normal-tag`(動的判定) |
| 通常興行(プレイヤー画面) | `App._finalizeShowImpl`(`app.js:6997`) | 同上 |
| PPV GRAND FINAL | `Engine.ppv.applyPPVResults`(`management.js:14310`) | `ppv` |
| 天頂戦(4年に一度) | `Engine.ppvTournament._applyMqBonuses`(`management.js:24900`) | `ppv` |
| AI団体同士の通常興行 | `Engine.rival.processAIWeek`(`management.js:8839`) | `ai-show` |
| B2団体内紛 | `Engine.rival.processAIWeeklyEvent.B2`(`management.js:8441`) | `raw` |
| 対抗戦(遠征) | `Engine.rival.aiWar`(`management.js:9684`) | `raw` |
| B3挑戦状(headless/画面) | `aiB3Challenge`(`management.js:9949`)、`App.b3WatchMatch`/`b3SkipMatch`(`app.js:12088`/`12141`) | `raw` |
| Common-1(派閥内試合提案) | `App.common1WatchMatch`/`common1SkipMatch`(`app.js:12280`/`12330`) | `raw` |
| B2団体内紛(画面) | `App.b2WatchMatch`/`b2SkipMatch`(`app.js:12448`/`12499`) | `raw` |
| イベント戦(汎用) | `Engine.event.resolveEventMatch`(`management.js:14988`) | `raw` |
| ジュニアトーナメント | `Engine.juniorTournament.run`(`management.js:24358`)、`App._jtSimulateMatch`(`app.js:14370`) | `raw` |
| 春のタッグリーグ | `Engine.springTagLeague.run`/`simulateReplay`(`management.js:25459`/`25639`) | `raw` |
| 秋の勝ち残り対抗戦 | `Engine.autumnWar.simulateNextBout`/`legacyRun`(`management.js:26286`/`26429`) | `raw` |

### 2.4 補助関数

- `Engine.mq.buildRingInOpts(state, leftId, rightId, options)` — 因縁/タイトル/trust/バフ/(通常興行限定の)メイン・ラストランを`simOpts`へ組み立てる。**simulateMatchを呼ぶ「前」に一度だけ呼ぶ**(`management.js:2165`)
  - `options.rivalryOnly` — 因縁チャネルだけを返し、タイトル/trust/バフは中立値にする。`ppv`プロファイル(PPV GRAND FINAL・天頂戦)専用。旧v2.0の`profile==='ppv'`が外部加算を「因縁のみ」与えていたスコープに一致させるためのもので、プレイヤーのバフを他団体どうしの試合へ漏らさない役割も持つ
  - **リング内効果はこの関数を呼ばないと一切効かない**(`match-engine.js`は`ringOpts.rivalryRing`等を読むだけで自前計算しない)。旧v2.0では`finalize`が因縁を自前解決して外部加算していたため呼び出し側の責務ではなかった。P3bのリング内化で責務が移った際、`ppv`プロファイルの2経路(天頂戦`ppvTournament.run` / PPVのTV放送`ppv.applyPPVResults`のheadless側)が呼び忘れており、**因縁の効果がゼロに落ちていた**(2026-07-30 修復。回帰テスト`test/tenchosen-rivalry-ringin-test.js`)
  - `raw`プロファイルにも**因縁を効かせる(2026-07-30 Keisuke裁定「当然因縁を効かせます」)**。旧v2.0では外部加算ゼロだったので回帰ではないが、「大舞台ほど因縁が試合内容に出ない」という逆転を解消するため、ジュニア/秋勝ち残り/対抗戦/挑戦状/団体内紛の各経路に `rivalryOnly` で通した。**タッグ(春タッグリーグ)は §4 のスコープどおり対象外**
  - **シングルの全経路が `buildRingInOpts` を通ること**は `test/ringin-coverage-test.js` が守る(simulateMatch をスパイして opts に `rivalryRing` があることを検査)。呼び忘れは症状が出ないままMQだけ静かに下がるため、テストで縛る
- `Engine.mq.buildNormalContext(state, matchResult, slot, options)` — `finalize`へ渡す`context`(participantFighters/rivalryLevel/isTitle/venueHeat/fp/isMainEvent等)を組み立てる(`management.js:2229`)
- `Engine.mq.resolveNextMatchMqTargetIndex(validMatches, milestoneBuffs)` — `next_match_mq`バフの対象試合をカード順のみから確定するpure関数。勝敗に依存しないため、シム前の解決とシム後の消費判定が同じ結果になる(`management.js:2221`)
- 次戦MQバフの消費は`finalize`の返却値(`consumedNextMatchMqBuff`)で一元管理される

---

## §3 素点計算(`src/match-engine.js`)

### 3.1 OVシーリング(4セグメント)

```js
Engine.battle.ovCeiling(avgOV)   // match-engine.js:57
```

| avgOV帯 | 式 | 備考 |
|---|---|---|
| ≤50 | `20 + avgOV × 0.60` | |
| 50〜80 | `50 + (avgOV−50) × 1.10` | |
| 80〜100 | `83 + (avgOV−80) × 0.85` | OV100で天井100 |
| 100超 | `100 + 0.25 × (avgOV−100)` 🔧 | **2026-07-24追加(第4セグメント)**。傾き0.25=通常帯(0.85)の3割以下 |

丸め後 `clamp(…, 15, Infinity)`。**avgOV≤100の3セグメントは既存式のまま完全不変**(境界100で連続)。100超セグメントの実測: 発生率0.503%、平均上振れ+1.23・最大+3.00(auto-sim 100季)。理論上限は約130(OV110ペアで+2.5、OV120で+5)。

タッグは`avgOV = (ov(fA1)+ov(fA2)+ov(fB1)+ov(fB2))/4`で同じ`ovCeiling`を共通利用する(`calcTagMQ`内、`match-engine.js:1729`)。

trust/バフによる実効OV補正(§4.3〜4.5)は、この`avgOV`計算にのみ加算され(`avgOV = (ov(charL)+ringOvAdjustL+ov(charR)+ringOvAdjustR)/2`)、恒久的なステータス変更ではなくその試合の天井だけをその場で動かす。

### 3.2 ドラマ減点(シングル)

基本30点から、見せ場の発生でリカバー(上限あり)。

| 要素 | 単発回復 | 上限回数 | 最大回復 |
|---|---|---|---|
| キックアウト | ×8 | 2回 | 16 |
| カウンター | ×2.5 | 3回 | 7.5 |
| リード逆転 | ×1.5 | 3回 | 4.5 |
| 大技(10+ダメ) | ×0.4 | 6回 | 2.4 |

`dramaPenalty = max(0, round(30 − 回復合計))`。タッグは基本30・上限回数が3/4/4/8(回復量6/2/1.5/0.4)で別カーブ。

### 3.3 ペーシング減点

`Engine.battle.pacingPenalty(matchTurns, tier, hasHikidashi)`(`match-engine.js:65`)。Tier1(通常)は理想8T以上=0/6〜7T=3/5T以下=12、Tier2(大一番)は理想18T以上=0/14〜17T=3/13T以下=12。特性「引き出し上手」保持時は通常6/4T・大一番14/10Tへ緩和(減点値自体は0/3/12のまま変わらない)。下限のみで上限(だらだらペナルティ)は存在しない。

### 3.4 決着減点

| 決着 | 減点 |
|---|---|
| フォール/ギブアップ(Climaxフェーズ) | 0 |
| フォール/ギブアップ(Endフェーズ) | 1 |
| フォール/ギブアップ(その他フェーズ) | 3 |
| ピン | 0 |
| 丸め込み | 1 |
| TKO | 2 |
| 時間切れ/HP判定 | 10 |

### 3.5 超過レイヤー — 天井の蓋を外す(§3.7)

現行式ではどれだけ完璧な試合をしてもOVシーリングを超えられず「奇跡が数学的に起こらない」問題への対処。**既存の式・係数は一切変更せず、最終MQへの加点項を1つだけ追加**。

**発火条件**: ドラマ減点が完全に0回復(`dramaPenalty === 0`) かつ ペーシング減点0 かつ まともな決着(決着減点≤1)。

**燃料(excess)**: ドラマ回復の上限を超えて発生したイベント分。

```js
// シングル
excess = 4×max(0, kickouts−2) + 1.5×max(0, counters−3)
       + 1×max(0, leadChanges−3) + 0.3×max(0, bigMoves−6)
overflow = min(12, round(4×√(excess/4)))   // excess4→+4, 9→+6, 16→+8

// タッグ(回復上限3/4/4/8基準)
excess = 3×max(0, kickouts−3) + 1×max(0, counters−4)
       + 0.75×max(0, leadChanges−4) + 0.2×max(0, bigMoves−8)
overflow = min(12, round(4×√(excess/4)))
```

`mq += overflow` を下限5クランプの**前**に加算。結果オブジェクトに `transcend: { fired, excess, overflow }` を付与(`match-engine.js:775`/`1815`)。全profile共通で素点内に効くため、PPV・天頂戦・大会でも起こる。

**実測(auto-sim 100季)**: シングル発生率0.125%(目標0.1〜0.3%内)、overflow平均3.75・最大7、平均MQシフト+0.005、通常興行で最大106を観測。タッグは発火0件(ペーシング条件が厳しく構造的に届きにくい。運用を見て将来調整余地)。

---

## §4 リング内効果(固定加算の解体先)

因縁+1〜+5・タイトル+5・trust事後減算・バフ+3・ラストラン+2/+5——旧仕様の固定MQ加算は**全廃**され、`simulateMatch`への入力(カウンター率/脱出率/実効OV)に変換された。名勝負製造機(特性)と全く同じ機構に相乗りする。

### 4.1 因縁のリング内化

`Engine.mq.rivalryRingEffect(rivalryLevel)`(`management.js:2146`)が因縁段階をtierへ変換し、`RIVALRY_RING_TABLE`を適用。

| tier | 発火条件 | counterPt | escape |
|---|---|---|---|
| 1 | rivalry 45〜54 | +2pt | +0.05 |
| 2 | rivalry 55〜64、または解決済み(好敵手/宿怨) | +3pt | +0.08 |
| 3 | rivalry 65〜79 | +4pt | +0.11 |
| 4 | rivalry 80+ | +5pt | +0.15 |

一方的な因縁(oneSided)は対象外(旧固定加算も0だった)。

### 4.2 タイトルのリング内化

`titleMatch: true`で以下を付与:
- `TITLE_RING_ESCAPE_BONUS = 0.10` 🔧(フォール/ギブアップ脱出率)
- `TITLE_RING_COUNTER_BONUS = 4` 🔧(カウンター率pt)。**2026-07-24較正で確定**: escape単独ではMQ+0.03〜0.06しか生まず、counterが主レバーと判明したため補強追加

式典としての格はengagement +0.2(§5)へ。

### 4.3 trustのコンディション化

`TRUST_RING_OV_PENALTY = -3` 🔧。trust<35の選手はその試合の実効OVが-3(`buildRingInOpts`内`trustDebuff`配列)。心が離れたエースの塩試合が、数値操作ではなく本人の出来として現れる。

### 4.4 バフのコンディション化

`BUFF_RING_OV_BONUS = 2` 🔧。`milestoneBuffs`の`mq_boost`(全試合対象)/`next_match_mq`(指定ペアの当該試合のみ)が実効OV+2。重複可(両方成立時は+4)。

### 4.5 メイン気迫・ラストランのリング内化

通常興行のみ(`buildRingInOpts`の`options.normalShowRingExtras`経由。PPV/AI興行は対象外)。

- `MAIN_EVENT_RING_OV_BONUS = 1` 🔧: メイン(matchIndex 0)の両選手に実効OV+1
- `LASTRUN_RING_OV_BONUS = 1` 🔧: `fighter.lastRun`が立つ選手に実効OV+1

ラストラン+メインが重なると+2で自然に積み上がる。旧固定+2/+5(「+5は強すぎる」)を撤回し「条件を満たした夜だけ」効く形に転換。engagement側の寄与は§5.2参照。

### 4.6 共有キャップ

因縁・タイトルのring-in効果は名勝負製造機と同じキャップを共有し重複加算される: `counterMax = 18`、kickoutチャンス上限0.45、guEscapeチャンス上限0.40(`src/data.js` ENG設定)。名勝負製造機の固定+5とも合算される。

### 4.7 較正結果(2026-07-24、`docs/mq-ring-calibration-v0.1.md`)

同一seed対照120,000試合で、**リング内効果の勝率への因果効果は全構成±0.3pt以内**(最強escape+0.15でも-0.28pt)。「因縁で番狂わせが起きやすくなるのは不可」という裁定は現行係数のまま満たされている。観察比較(因縁あり試合 vs なし試合)は選択バイアスを含むため判定には使わない(§9不変条件6)。

---

## §5 観客熱×試合注目度(`src/data.js` / `src/management.js`)

興行一律の加算をやめ、試合ごとに配分する。カード編成の妙(誰をメインに置くか)がMQに正しく響く。

```
crowd = round(venueHeat × engagement)   ※normal-single/normal-tagのみ
```

### 5.1 venueHeat = 会場の器 × 需要の圧力

```js
Engine.economy.calcVenueHeat(venueIdx, fp)   // management.js:941
// fp = rawDemand(キャパでクランプする前の需要) / capacity
```

**VENUE_HEAT_TIER_AMP**(会場規模=観客熱の"器"。埋め切ったときだけ他会場より高く跳ねる。ドームは別格) 🔧:

| 会場 | 公民館 | 小ホA | 小ホB | 市民会館 | 中ホA | 中ホB | 大ホール | アリーナ | 大会場 | ドーム |
|---|---|---|---|---|---|---|---|---|---|---|
| tierAmp | 2 | 2 | 2 | 3 | 3 | 3 | 4 | 5 | 5 | **7** |

**FILL_PRESSURE_BANDS**(fp帯。実測percentile p90=2.233/p10=1.041/p5=0.914に基づく最終値) 🔧:

| pressureFactor | fp範囲 | 意味 |
|---|---|---|
| +1.0 | ≥2.25 | 客席が沸き返る超満員 |
| +0.5 | 1.90〜2.25 | 押し寄せる大盛況 |
| 0 | 0.95〜1.90 | (完売〜ほぼ埋まった普通の興行。ラベル無し) |
| -0.5 | 0.70〜0.95 | 空席が目立つ客入り |
| -1.0 | <0.70 | 閑古鳥の会場 |

`venueHeat.total = tierAmp × pressureFactor`。設計判断: 完売(fp≥1.0相当)を負にしない(完売した興行の空気がマイナスは嘘になる)。負帯は本当に埋まらなかった興行だけ。

### 5.2 engagement(試合注目度)

```js
Engine.mq.calcEngagement(participantFighters, opts)   // management.js:2279
normPop = clamp((avgPop − 35) / 55, 0, 1)
raw = 0.5 + 0.5×normPop + (因縁あり?0.15:0) + (タイトル戦?0.2:0)
        + (メイン枠?0.12:0) + (ラストラン出場?0.25:0)
engagement = clamp(raw, 0.35, cap)
cap = (ラストラン選手が出場するメイン) ? 1.4 : 1.25   🔧
```

人気がここで初めてMQに正直な形で接続する。負側も掛け算が効く——閑古鳥の中のメインイベントが最も冷える(-4×1.25)、前座の新人戦は淡々と(-4×0.4)。

### 5.3 ドームメインの大一番ルール

通常興行が会場idx9(ドーム)のとき、メイン(matchIndex 0)の非タイトルシングル戦もmatchTier=2(ビッグマッチルール)でシミュレーションする。試合が長くドラマの発生余地が大きい=超過レイヤー圏内に届きやすくなる。

- headless: `Engine.executeShow`内 `isDomeMain = isMainEvent && s.showVenue === 9; matchTier = (m.isTitle || isDomeMain) ? 2 : 1`(`management.js:12106-12107`)
- 画面: `App._normalShowMatchTier(idx, m)`(`app.js:6118`)、skip/watch/skipAll全経路で同一判定

---

## §6 歴代最高MQ記録(`state.mqRecord` / `state.mqRecordTag`)

### 6.1 構造

```js
{
  value: Number,
  holderIds: [id, id] | [id,id,id,id] | null,  // シングル2名/タッグ4名
  orgId: null, season: null, week: null, stage: null,
}
```

- **スコープ**: 業界記録(全団体・全経路)を1本ずつ。新聞は業界紙なのでAI団体やPPV・天頂戦で生まれた名勝負も一面になる
- **シングル/タッグ分離**: タッグは構造的にMQが高く出る(タッグ固有ボーナス群による)ため、統一記録だと歴代最高が常にタッグ戦になる。`mqRecord`(シングル)と`mqRecordTag`(タッグ)を分離
- **スタート値**: `SINGLE_RECORD_START = 90` 🔧 / `TAG_RECORD_START = 94` 🔧(`management.js:2382-2383`)

### 6.2 更新判定

`Engine.mq.updateRecord(state, matchResult, metadata)`(`management.js:2472`)。`metadata.matchType==='tag'`で`mqRecordTag`、それ以外で`mqRecord`に振り分け。確定MQが現記録を**厳密に上回る**場合のみ不変更新(同値は更新しない)。`holderIds`は2名未満なら不成立。全10箇所の呼び出し(通常興行/AI興行/PPV/天頂戦/ジュニア/春タッグ/秋勝ち残り/B2/B3/対抗戦)に`matchType`が明示付与されている。

物語系(新聞評価・年代記・実績・「名勝負」ラベル)は`mqRecord.value − 5`以上を「歴代級」として記録連動の相対評価へ。機械系の閾値(trust/人気/成長/関係値の30〜80帯)は絶対値のまま維持(全面相対化は下流破壊が大きすぎるため)。

線形報酬の保護: 対抗戦/挑戦状メディア収入の`MQ×eventPerMQ`、MVP/ランキングの`bestMQ×0.3`は入力側を`min(MQ,100)`で飽和させ、100超が線形報酬を増幅しない。

### 6.3 セーブ移行

- **v1**(`migrateRecord`): 旧セーブ(`mqRecord`未存在)に、全キャラの`careerBestMQ`実測から単一記録を1本補完(フロア100・分離前挙動)
- **v2**(`migrateRecordV2`、§2.2のシングル/タッグ分離に伴う再移行): 既存`mqRecord`が更新済みかつ`holderIds.length>=3`(実はタッグの更新だった)→`mqRecordTag`へ移設・`mqRecord`は実測から再初期化。`holderIds.length<=2`(シングルの更新)→そのまま維持・`mqRecordTag`のみ新規初期化。未更新→両方とも実測から各下限で再初期化。いずれも1回限り(`_migrated_mq_record_v1`/`_migrated_mq_record_v2`フラグ)

### 6.4 実測頻度(P3e、40季×5シード軌跡計測)

| | 初更新シーズン中央値 | S1-10更新回数(5シード平均) | S11-20 | S21-30 | S31-40 |
|---|---|---|---|---|---|
| シングル(start90) | S7 | 1.80 | 1.40 | 0.20 | 0.00 |
| タッグ(start94) | S14 | 0.20 | 0.80 | 0.00 | 0.20 |

シングルは不変条件8(§9)の範囲内、逓減傾向も確認。タッグはタッグ戦自体が稀(数試合/年)なため中央値S14が想定(S4〜8)より後ろ倒しになり、Keisuke裁定で不変条件を「初更新中央値S20以内・凍結しない」へ改定して94のまま採用。

---

## §7 大ニュース新聞システム

### 7.1 BIG_NEWS_TYPES(5種)

```js
const BIG_NEWS_TYPES = new Set([
  'mqAllTimeRecord', 'mqTagRecord', 'hotProspectDebut', 'fatedRivals', 'topChampionInjury'
]);   // src/data.js:15553
```

**頻度の設計原則: 大ニュースは年に数回まで**(毎週鳴るピロリんは事件ではなく騒音になる)。既存記事タイプの昇格はなし——王座交代・派閥・破産系は見送り(運用後の頻度体感を見て再検討可)。

### 7.2 一面ジャック判定と`PRIORITY`

`Engine.newspaper.generate`が週次新聞を組んだ後、`isBigNews: !!(topStory && BIG_NEWS_TYPES.has(topStory.type))`を結果に付与(`management.js:27349`)。「一面に載る条件」(priority)と「週頭に鳴らす条件」(集合への登録)は分離しているため、既存の紙面バランス(王座交代130帯・興行120帯)は壊れない。

| type | PRIORITY | 発火材料 |
|---|---:|---|
| `mqAllTimeRecord` | 320 | `state.mqRecord`更新(§6.2)。5種中もっとも一面優先度が高い |
| `hotProspectDebut` | 315 | 大物ルーキーのデビュー戦 |
| `mqTagRecord` | 310 | `state.mqRecordTag`更新 |
| `fatedRivals` | 308 | 期待のライバル、2人目のデビュー戦 |
| `topChampionInjury` | 305 | 業界上位2団体の現王者の新規重傷 |
| (参考)`leagueElevation` | 300 | 既存の最上位priority。大ニュース5種は全てこれより上で一面保証 |

### 7.3 記録更新→記事化キュー(`mqAllTimeRecord`/`mqTagRecord`)

`Engine.mq.updateRecord`は「数値記録更新」と「記事化」を分離する。数値更新が成立すると`Engine.mq._pushRecordNews(state, { isTag, prevRecord, record, metadata })`(`management.js:2553`)を呼び、`Engine.industryNews.push`経由でキューへ積む。

- シングルは`metadata.winnerId`必須、タッグは`metadata.winnerIds`(2件)必須。**いずれも解決できない場合(ドロー等)は数値記録のみ更新し記事化を静かにスキップ**する(記録は嘘をつかないが、勝者を名指しできない記事は書けない)
- タッグの変数充填規則: `{nameA1}`=勝者組OVR上位(`_sortByOvrDesc`)。名前解決は`_findFighter`(roster/aiOrgs/freeAgents/retiredFighters を順に走査)、`{stage}`は`STAGE_LABELS`(normal/ai/ppv/junior/tenchosen/springTag/autumnWar→日本語)、`{orgName}`は勝者(タッグはエース)の所属組織名

### 7.4 P5: 大物ルーキー/期待のライバル/トップ王者重傷

**設計**: 「入団時にフラグを立て、本当のデビュー戦(初の総試合数1)で発火する」方式。既存ロスター(旧セーブ/AI団体の経歴事前史)を誤って「デビュー」と誤検知しないよう、フラグは入団時にのみ立て、`wins+losses+draws===0 かつ careerSeasons===0`の正真正銘の未経験者だけを対象にする。

| 定数 | 値 | 用途 |
|---|---:|---|
| `HOT_PROSPECT_TCOVR` | 125 🔧 | 大物ルーキー(`hotProspectDebut`)のtrainCapOVR閾値 |
| `FATED_RIVAL_TCOVR` | 117 🔧 | 期待のライバル(`fatedRivals`)候補フラグのtrainCapOVR閾値 |
| `FATED_RIVAL_AGE_DIFF` | 1歳 🔧 | ペア形成の年齢差上限。ロードマップの「年齢差1歳以内」を採用(コードベースの同世代慣例3歳以内より狭い、"逸材が同時代に現れた"希少事件のため) |

- `Engine.mq.registerBignewsHire(state, fighter)`(`management.js:2601`): 入団コミット直後に呼ぶ純粋関数。trainCapOVR≥117の正真正銘の新人に`_bignewsProspect`フラグを立て、`state._fatedTalentPool`(ペア候補プール)を更新。年齢差1歳以内の未ペア候補がいれば即ペア形成し`_fatedRivalPartnerId`を付与(ペア形成は`state._fatedRivalsFormedSeason`で年1回まで)。配線先: `app.js`(初期ドラフト/FA署名/ロスター超過時解決/スカウト成立/スカウト競り負けAI移籍)、`ui-common.js`(ドラフト交渉プレイヤー/AI落札、非選択候補の自動セリ)
- `Engine.mq.scanBignewsDebuts(state)`(`management.js:2637`): `tickWeek`末尾(新聞生成直前)で全ロスター(プレイヤー+AI団体)を横断走査し、`_bignewsProspect`かつ総試合数が1以上に転じた選手のデビュー戦を検出。tcOvr≥125なら`hotProspectDebut`、`_fatedRivalPartnerId`があれば相方を解決して`fatedRivals`を記事化。発火有無に関わらずフラグは一度限りで消費
- `Engine.mq.snapshotChampionInjuries(state)`(`management.js:2701`)/`checkTopChampionInjury(state, snapshot)`(`management.js:2719`): `tickWeek`冒頭で各団体現王者の怪我typeをスナップショットし、週末に`state.rankings`のrank1/2団体について「王座保持者が同一(交代週は対象外)かつ現在`injury.type==='重傷'`かつスナップショット時点では重傷でなかった(新規発生)」を判定して記事化。継続中の重傷では再発火しない
- **追跡範囲の制約**: 怪我判定自体が「通常興行(プレイヤー/AI)の試合内負傷」のみに実装されている(PPV/ジュニア/春タッグ/秋勝ち残り/天頂戦には怪我判定のコードが元々存在しない、既存実装の制約)。よって`topChampionInjury`の追跡範囲は「プレイヤー/AI団体とも通常興行の試合内重傷」に限定される

### 7.5 週頭通知(器)

発火点: 週送り後の`popupActions`チェーン(`App._maybeShowBigNewsPopup`、`app.js:9630`)。`weeklyNewspaper.isBigNews`かつ週単位で未通知の場合のみ`G._bigNewsNotifiedWeek`を立てて1回発火。`closeShowResult`(興行後)/`processWeek`(非興行週)双方の末尾、他ポップアップの後段に追加。

- **SE**: `bignews`(`SE_MIX.bignews=.58`)。既存`notify`(C6→F6 2音)にベル系スパークル(`bellPartial`2発+`noiseHP`)を重ねた合成
- **ポップアップ**: `showBigNewsPopup(topStory)`(`ui-common.js:1045`)。汎用D型モーダル(`.mdl-d-box.cream.bignews`)+新聞アイコンドロップイン(`.bignews-icon-dropin`)+号外リード1行(`BIG_NEWS_LEAD_LINES`、type別2バリエーション)+「紙面を読む」(→`showScreen('newspaper')`)/「あとで」
- **未読バッジ**: ナビ📰ボタンの`#newspaperBadge`(`.nav-badge-dot`)。`G._bigNewsUnread`に応じて表示切替、新聞画面を開くと消灯。既存セーブにフィールドが無い場合はfalsy判定で自然に非表示

### 7.6 一面レイアウト

- `mqAllTimeRecord`/`hotProspectDebut`/`fatedRivals`/`topChampionInjury`は既存`np-top-story`型(単数写真)をそのまま流用
- `mqTagRecord`は`_npRenderBignewsTag`(`ui-render.js:6739`)による「上下ぶち抜き大記事」: `springTagResult`の優勝ペア写真パターンを流用した全幅フォトバー(`np-bignews-photobar`)+`np-sec-gold`ラベル+2段落本文(`_npSplitBignewsBody`で本文の`｜`区切りをパラグラフ配列へ展開、後半に`np-bignews-praise`装飾)

### 7.7 記事文面の正本

全5種の見出し・本文は`docs/bignews-article-drafts-v1.0.md`が正本(Opus執筆・Keisuke全文レビュー承認済み)。`src/data.js`の`NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord`/`.mqTagRecord`/`.hotProspectDebut`/`.fatedRivals`/`.topChampionInjury`(各3バリエーション)は正本から一字一句そのまま実装されている。テンプレ文言そのものの変更は正本ドキュメントの改訂を経由すること。

---

## §8 物差し(評価定数)の再較正

観客下駄の撤去により通常興行平均MQは約-4(58.3→約54)下がった。**埋め戻さない**(A案。素点カーブへの埋め戻しはPPV・大会まで一律持ち上げてしまうため却下)。副産物として「週次興行<特別興行」の序列が正しく開いた(旧仕様は下駄でPPV平均68に不当接近していた)。

### 8.1 表示・演出系(連動再較正済み)

`SHOW_RATING_CONFIG`(`src/data.js`):
```js
expectedMQTotal: [0, 0, 105, 143, 172, 191, 210, 229, 248]  // 6試合基準210(index=試合数)
starThresholds: [
  { min: 83, stars: 5 },   // 🔧 星5カット比率。82.5→83間で28.0%→18.0%へ急落する非線形転移を実測
  { min: 70, stars: 4 },
  { min: 50, stars: 3 },
  { min: 30, stars: 2 },
  { min: 0,  stars: 1 },
]
venueTierOffset: [-18, -18, -18, -8, -8, -8, 0, 0, 0, 3]
```
着地(auto-sim 100季/n=2005): ★1 0.2% / ★2 1.4% / ★3 14.3% / ★4 66.0% / ★5 18.0%(目標19〜23%を1pt下回るが、他3帯は目標帯内。閾値感度の制約下で最良点として採用)。

`EXPECTED_MQ_BY_VENUE`(`src/ui-render.js:8764`、全段base-4・cap 80→76、popCoefは不変):
```js
[
  { base: 26, popCoef: 0.15 }, { base: 29, popCoef: 0.18 }, { base: 32, popCoef: 0.20 },
  { base: 36, popCoef: 0.22 }, { base: 40, popCoef: 0.25 }, { base: 44, popCoef: 0.28 },
  { base: 48, popCoef: 0.32 }, { base: 52, popCoef: 0.35 }, { base: 56, popCoef: 0.38 },
  { base: 61, popCoef: 0.40 },   // ドーム
]
// _calcExpectedMQ = min(76, base + orgPop × popCoef)
```

### 8.2 経済・成長系(据え置き)

trust好試合閾値70/人気成長閾値30・50・70/成長閾値65・80/メディア閾値45・60は**全て現行値のまま据え置き**。閾値越え率は大幅低下した(MQ≥70で-42.8%)が、結果指標(trust週次収支・人気成長率・ブレイクスルー率・興行収入)はいずれも±10%以内(trust -1.45%/人気 -1.88%/ブレイクスルー +1.71%/興行収入 -8.26%)で確定。下流システムは多入力で頑健と実測確定済みのため調整不要。

### 8.3 記録系

`SINGLE_RECORD_START`/`TAG_RECORD_START`は§6参照(P3着地後の分布実測を経て90/94で確定)。

---

## §9 検証基盤

### 9.1 回帰テスト一覧(`test/`)

| ファイル | 検証対象 |
|---|---|
| `mq-finalize-parity-test.js` | UI経路(`App._finalizeShowImpl`)とheadless経路(`Engine.executeShow`)の同一入力→同一MQ/inventory一致。全5profile・100超・下限5クランプ・次戦バフ1回消費・state非破壊 |
| `mq-p3c-unit.js` | 合成データによる直接検証(auto-simのランダムカード編成では到達しない条件): tierAmp配列/pressureFactor帯/engagement cap(1.25/1.4)/ドームメインmatchTier=2/不変条件1の合成カードσ |
| `mq-ring-calibration.js` | 因縁/タイトルのリング内効果(counterPt/escape)による勝率歪みを同一seed対照で計測(不変条件6) |
| `mq-bignews-templates.js` | 5種の記事テンプレ変数展開(未置換`{変数}`なし)、`registerBignewsHire`→`scanBignewsDebuts`の発火経路、経験者ガード、ペア形成年1回制限、`checkTopChampionInjury`の新規/継続判定 |
| `mq-record-migration-test.js` | v1/v2セーブ移行、既存記録保持、一回性、同値無視、2名未満拒否、state非破壊 |
| `mq-record-trajectory.js` | 記録スタート値候補の軌跡計測(独立スクリプト。§6.4の実測に使用) |

### 9.2 不変条件(合格基準)

| # | 不変条件 | 実装時の実測 |
|---|---|---|
| 1 | 観客補正の「同一値が全試合に乗る」旧バグの解消: 興行内・試合間で観客寄与に差がつくこと。**基準は合成カード(スターのメイン/中堅セミ/新人前座)でσ≥0.9**(整数丸めによる理論上限0.9428のため1.0から改定) | **達成**(`mq-p3c-unit.js`で理論上限まで到達確認)。auto-simのランダム編成ではσ0.12〜0.39に留まるが、これは全スロットの参加者人気がほぼ均一という計測環境の特性であり、人為的なカード編成(スター+前座)では設計どおり差がつく |
| 2 | 超満員興行と閑古鳥興行の同カードMQ差が平均5点以上 | 会場tierAmp×pressureFactorの構造上、上限帯で保証される設計 |
| 3 | 超過レイヤー発生率0.1〜0.3%(シングル)、平均MQシフト+0.1未満、overflow上限12 | シングル0.125〜0.154%で達成。タッグは0件(参考値・規定レンジなし) |
| 4 | 因縁戦の平均MQ優位(同OV帯比)+1.0〜+2.5を維持 | +1.098〜+1.360で達成 |
| 5 | 王座戦の平均MQ優位(同OV帯比)+2〜+4 | **設計値ベースで帯内見込み**(リング内counter+4≒+1.0[較正実測]+engagement+0.2×会場の熱≒+1〜2)。headlessでは通常興行のタイトル戦が発生せず統計実測不能のため、**実機プレイでの確認事項** |
| 6 | 因縁/タイトルのリング内化による勝率歪みは**同一seed対照**で±2pt以内 | 実測±0.3pt(最強escape+0.15で-0.28pt)。観察比較は選択バイアスを含むため判定に使わない |
| 7 | 物差し再較正後: ★分布の各帯比率が現行±5pt/trust週次収支・人気成長率・ブレイクスルー率が現行±10% | ★分布・経済指標とも達成(§8) |
| 8 | 記録更新頻度: シングル初更新中央値S4〜8/タッグは「初更新中央値S20以内・凍結しない」(改定後) | シングルS7で達成。タッグS14で改定後基準を達成(§6.4) |
| 9 | OV100超減衰(§3.1第4セグメント): avgOV≤100ペアの素点が完全不変 | 単体テストで境界確認済み。発生率0.503%、平均上振れ+1.23・最大+3.00 |
| 10 | venueHeat: fill pressure最上位帯が興行の10〜15%以下。会場帯ごとの熱上限が単調増加 | **達成**。P3d最終閾値(fp≥2.25)で最上位帯8.88%(auto-sim 100季実測。73.27%はP3d較正前の仮閾値fp≥1.30時点の数字であり最終値ではない) |
| 11 | メイン気迫・ドーム大一番による勝率歪みは同OV帯で±2pt以内 | タイトル戦カウンター補強経路で-0.3pt(達成) |

**既知の未達・保留項目(#1・#10)**は数値を捻じ曲げて帳尻を合わせず、実測のまま報告する運用方針(このゲームの数値哲学に基づく)。合成データでの理論上限確認・auto-sim母集団特性の分析はいずれも完了しており、追加係数調整は行っていない。
