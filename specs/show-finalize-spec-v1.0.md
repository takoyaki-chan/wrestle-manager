# 通常興行の試合後の処理 仕様 v1.0 — `Engine.show.finalize`

- 確定: 2026-09-26(K-1「興行後の処理を一本化する」第3段。裁定 K-1 = A・段階的)
- 実装: `src/management.js` の `Engine.show.beginShow` / `Engine.show.finalize`、`src/app.js` の `App._finalizeShowImpl` と `App._finalizeHook*`
- 経緯・差の台帳: `docs/fun-audit-v0.1/k1-parity-report.md`(§8 第3段)、常設テスト `npm run test:k1:parity` / `test/k1-stage3-test.js`

## 1. 目的

通常興行の試合後の処理を1本にする。以前は、エンジン(`Engine.executeShow` = auto-sim)と実プレイ(`App._finalizeShowImpl`)が同じ処理を別々に書き写していて、測っている世界と遊ばれている世界が分かれていた(K1 の差分 40 項目)。

- **両経路は同じ関数を、同じ順番で通る。** 経路ごとに残っている違いは、呼び出し側が渡す指定(§4)と、実プレイだけの処理の差し込み口(§5)に閉じ込める。
- 違いは第4段 4-A(実プレイだけの処理をエンジンへ)と第5段(`closeShowResult` の後半を `tickWeek` へ)で1件ずつ消す。消えた指定・差し込み口はこの仕様から外す。

## 2. 入口

| 経路 | 流れ |
|---|---|
| エンジン | `Engine.executeShow(state)` → 修復(`repairProgressionState`)・カードの検査 → `Engine.show.beginShow` → 試合のシミュレーション(Pass 1。シングルは `Engine.battle.simulateMatch`、タッグは `Engine.showTagMatch.simulate`) → `Engine.show.finalize(s, validMatches, rawResults, { roster, preShowLosingStreaks, preShowState: state })` |
| 実プレイ | `App.executeShow`(乱入・奪還・直訴・統一王座・B3 の注入) → 観戦/スキップで試合結果 → `App.finalizeShow` → `App._finalizeShowImpl` → `Engine.show.beginShow(G, validMatches)` → `Engine.show.finalize(begun.state, validMatches, results, { …実プレイの指定・hooks })` → 密着取材・ラストランの即引退・新聞・結果画面 |

- `beginShow(state, validMatches)` → `{ state, roster, preShowLosingStreaks }`。興行数 +1・`weekPhase: 'showExec'`・F02① の火種。`roster` は休養願い(`forcedRest`)を外した**作業用の写し**で、`state.roster` は興行前のロスターのまま。
- `finalize(state, validMatches, results, ctx)` → `{ state, results, injuryResults, events, showRivalryResolutions, titleMatchOutcomes, fp, venueHeat, pressureFactor }`。

## 3. 処理の順番(両経路共通)

1. ファン期待の印に使う期待カード(興行の処理を始める前の状態で作る)
2. (実プレイ `rivalryBeforeTitles`)因縁の印と、決着候補でない組の記録
3. 王座戦の結果(防衛・戴冠・新王者の記事。奪還挑戦の試合は飛ばす) → **hooks.afterTitles**
4. 集客(試合の魅力・動員・バフ・fp・会場の熱)
5. 評価の確定(`Engine.mq.finalize`)・ファン期待の印・鮮度 → 次の試合のバフの消費
6. 歴代最高評価の記録
7. 因縁の記録と決着(1興行1件)
8. 試合評価による人気(`applyMatchPopularity`) → ★(`calcShowRating`) → 団体人気(`applyShowPopularity`・因縁カードの加算) → プロモ蓄積の消費 → 熱
9. 怪我と怪我による引退(`resolveMatchInjury`) → 引退の波及(`applyInjuryRetirementAftermath`)
10. 試合の関係値(`applyMatchResult` / `applyTagMatchResult`)・興行の文脈(`applyShowContextEffects`) → **hooks.afterRelationships**
11. F02③ 決着 → 派閥ポイント(`accrueFactionPoints`)
12. 試合成長(`applyMatchGrowth`) → 季節の統計 → 王座戦の週 → **hooks.afterGrowth**
13. 対戦成績(`recordShowH2h`) → 直近戦績 → 対戦記録(matchupLog)・タッグ経験 → **hooks.beforeKaigan** → 開眼
14. **書き戻し**(`s = { ...s, roster, rivalries, titles, heatScore, orgPop, lastShowResults, lastTitleMatchWeek, matchupLog, tagExp }`) → **hooks.afterWriteback**
15. 歴代最高評価の経歴の刻み直し → 突然の退団(`applySuddenDepartures`)
16. (エンジン)ロスターに混ぜた統一王座の挑戦者の清算 → (エンジン)助成金の知らせ
17. 怪我引退の演出データ → (エンジン)興行結果の新聞データ

**書き戻しまで `state.roster` は興行前のロスター**(両経路の従来どおり。期待カード・興行の文脈・派閥ポイントの序列などが読む)。作業中のロスターは別に持ち、書き戻しで状態に載せる。これを「状態1本」に寄せると派閥の予約が無い興行の数値も動くので、第4段以降で計測してから決める。

### 直近戦績(`recentMatches`、直近5戦)

シングルは左右の2人に1枠ずつ。**タッグは1試合1枠**: 相手は向かい合った1人(A1↔B1・A2↔B2。人気の組と同じ)で、`tag: true` の印を付ける。選手ポップアップの「直近」は印のある枠に「(タッグ)」と出す。(K1-A07。以前はエンジンがタッグを記録せず、実プレイが対角の4組を記録して1試合で2枠使っていた)

## 4. 経路ごとの違いの指定(ctx)

省略時はエンジンの従来どおり。実プレイは全部を渡す。

| 指定 | 実プレイ | 意味 | 寄せる先 |
|---|---|---|---|
| `logStyle` | `'structured'` | ログの型。エンジンは文字列、実プレイは gameLog の型(`venue_heat_crowd` ほか)。人気の増減の知らせ・助成金の知らせは文字列のログだけ | K1-T03(裁定待ち) |
| `mqPath` | `'App._finalizeShowImpl'` | 評価の内訳に残す経路の名札 | 表示のみ |
| `rivalryBeforeTitles` | true | 因縁の印と、決着候補でない組の記録を王座戦・乱入の前に行う(奪還挑戦の防衛者が外れる前の特性で記録) | 4-A |
| `intruderId` | 乱入者の ID | 乱入者が奪った王座は「新王者」の記事にしない | K1-A14 |
| `f08AttendanceMark` | true | 集客の試合の魅力に F08 の印 | §7 X04 |
| `nextMatchBuffCard` | `G.showCard` | 次の試合のバフの集客倍率で「その組がカードにいるか」を見るカード(空き枠を含む) | 4-A |
| `markDomeSellout` | true | 超満員のドームの節目の予約 | §7 X10 |
| `crossOrgRelationshipContext` | true | 試合の関係値の文脈に、統一王座戦の王者(統一王者)・他団体戦・挑戦試合の印 | §7 X06 |
| `resolveUnifiedTitle` | false | 統一王座の清算はここでしない(実プレイは hooks.afterWriteback で自前) | §7 X06 |
| `injuryPresentationDict` | `WM_I18N.t` | 怪我引退の経歴の要約を画面の言語で訳し、団体名を入れる | 表示のみ |
| `buildNewspaper` | false | 新聞データはラストランの即引退の後で実プレイが組む | K1-A09 |

## 5. 実プレイだけの処理の差し込み口(hooks)

`finalize` は作業中の値の入れ物 `w = { s, roster, titles, rivalries, events, titleMatchOutcomes, validMatches, results, common1MatchIdx, … }` を渡し、hook が書き換えた値を以後の処理で使う。hook は状態を写してから書く。各 hook は1回ずつ、§3 の位置で呼ばれる。

| hook | 実プレイの関数 | 中身 |
|---|---|---|
| `afterTitles` | `App._finalizeHookSpecialBouts` | 乱入・奪還挑戦・直訴の3試合の清算(K1-A14・§7 X06) |
| `afterRelationships` | `App._finalizeHookFactionBookings` | 直訴の結果モーダルへ関係値の変化・派閥の予約の清算(Common-1・F08・F07・F09・派閥内序列戦)。`w.common1MatchIdx` を返す(K1-A12・K1-A13・§7 X05) |
| `afterGrowth` | `App._finalizeHookGrowthEvents` | ブレークスルー・キャリア最高評価と信頼ボーナス・敗戦スランプ・モメンタム(K1-A01・K1-A02)。`w.writeback()` でその時点の書き戻しを作れる |
| `beforeKaigan` | `App._finalizeHookCareerMarks` | MVP 用の大試合の経歴・ドームの経歴とドーム回数(§7 X07・K1-A10) |
| `afterWriteback` | `App._finalizeHookGuests` | 成長の演出データ・統一王座戦の清算・挑戦状 B3・直訴のゲストの返却 |

**派閥の予約の清算は、作業中のロスターを状態に載せて渡す**(`{ ...w.s, roster: w.roster }`)。変わったロスターを作業中のロスターとして受け取り、状態の roster は興行前のロスターに戻して返す。以前は興行前のロスターの上で信頼・人気を動かしていて、書き戻しで消えていた(§7 X05、2026-09-26 に解消)。効くようになったもの: F07 メイン推薦(メンバー +1/リーダー −2)、Common-1(勝者の信頼 +3〜5・人気 +1〜3、敗者の信頼 −1〜3、下克上の追撃)、派閥内序列戦(信頼 ±3〜8・人気 +2〜5)、F08 の試合後(負けた派閥の末端の信頼 −2〜4)。信頼はどれも `trustSensitivity` つき。

## 6. 不変条件

- `finalize` / `beginShow` は入力の状態を書き換えない(試合結果の配列には評価と印を書き足す)。同じ入力から同じ結果(乱数は状態の種から derive した系列だけ)。
- エンジンの経路は、切り出しの前後で数値・乱数の引き順が同じ(2026-09-26 に auto-sim 40季の毎週の状態ハッシュ・乱数の引き順ハッシュ・Math.random の回数で確認)。
- 実プレイの経路は、組み替えの前後で状態が同じ(差分テストの `--dump` と `compare-dumps.js` で 16 本の両経路の状態を丸ごと比較)。
- 共通の処理(評価の確定・記録・集客・人気・怪我・関係値・派閥ポイント・成長・対戦成績・直近戦績・開眼・突然の退団)を、`_finalizeShowImpl` と hooks に書き直さない(`test/k1-stage3-test.js` が文面で見る)。
