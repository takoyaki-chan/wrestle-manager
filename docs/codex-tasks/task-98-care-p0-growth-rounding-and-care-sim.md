# task-98: care-rework2 P0 丸め修正+ケア計装(auto-sim --care)

- **作業場所**: `C:\Users\nkmrk\Downloads\wrestle-manager-codex`(ブランチ `codex/agent-workspace`)
- **前提**: **task-97完了後に着手**(同じmanagement.jsを触るため)
- **背景**: `docs/care-rework2-plan-v0.1.md` §1.2「丸めの死」。招聘・合宿の成長倍率が `calcGrowth` の `Math.ceil` の**後**に掛かり呼び出し側の `Math.round` で吸収されるため、**倍率1.45未満(C級・B級・A級スタイル一致・相性普通のほぼ全招聘)が成長に1ptも寄与しない**

## 目的

1. 招聘・合宿の成長倍率を量子化(ceil/round)の**前**に適用し、C/B/A級の格・スタイル一致・相性が成長量の期待値で単調に区別できる状態に戻す
2. auto-simに「ケア自動実行モード(--care)」を追加し、以後のバランス較正を「ケアを使う世界/使わない世界」の両方で測れるようにする
3. auto-simの興行後処理2重適用(G13)を是正し、シミュレーションを実プレイ経路に一致させる

## 仕様の正

- `docs/care-rework2-plan-v0.1.md` §1.2 / §3 P0-3・P0-5
- `specs/growth-system-spec-v2.2.md` §1(成長式)
- 現行実装: `calcGrowth` = management.js:8410-8489 / 呼び出し側の倍率連鎖 = management.js:12582-12600(intensive)・12670付近(normal)・10440付近(AI)

## 触ってよいファイル

`src/management.js` / `test/auto-sim.js`

## 触ってはいけないファイル

`src/data.js`(GROWTH_CONFIGの数値は変えない) / `src/match-engine.js` / `src/app.js` / `src/ui-*.js`

## 実装1: trainerMult を calcGrowth 内へ移設(Fable設計。方式の変更禁止)

1. `Engine.growth.calcGrowth` 内で `Engine.shachoshitsu.getTrainerMult(char)` を取得し、**`rawGain` 段階(coachMul等と同じ乗算列)で適用する**:
   `baseGain = baseLearning × ratio × ageMul × coachMul × rookieMul × gritMul × trainerMult`
2. **全呼び出し元を列挙して**(intensive/normal/AIの3系統+他にあれば全部)、呼び出し側の倍率連鎖から `trainerMult` を**除去**する(二重適用の禁止)。`getTrainerMult` の呼び出し箇所をgrepで全数確認し、報告書に一覧を載せること
3. `overrideCoachMul` 経路(AI用オーバーライド)での扱い: AIの `_inviteBuff`(限定トレーナー)が現行どおり効くことを確認する。AI側で `getTrainerMult` 相当が別経路なら、同じく量子化前適用へ揃える
4. ceil(最低1pt保証)・呼び出し側のpenMult/statusMult等**その他の倍率の位置は変えない**(ペナルティ系は現行どおり量子化後で0化が効く)

### 数値目標(受け入れ基準)

作業ツリー内の使い捨てスクリプト(コミットしない)で、22歳・cap=96・current/cap=0.70・通常練習4週・1000試行の期待成長(1ステ)を計測し:

- **T1**: trainerMult 1.00 / 1.25 / 1.30 / 1.35 / 1.53 の期待成長が**この順で単調増加**する
- **T2**: 1.25と1.53の期待成長差が4週合計で **+0.3pt以上**
- **T3**: 同条件でcurrent/cap=0.85(死に帯)でも、1.35の期待成長 > 1.00 の期待成長(差が0でない)

### 不変条件(1つでも破れたら実装を止めてFableに差し戻す)

- **I1**: `trainerMult=1.0`(招聘・合宿なし)のとき、成長結果が**現行実装とビット一致**する(乱数消費の順序・回数を変えないこと。getTrainerMultの呼び出し追加はrngを消費しない)。確認: 同一シードのauto-sim 20季で、ケアなし時の最終ロスターの全ステ値が修正前後で一致
- **I2**: 招聘あり時のインフレ上限: mult 1.53・4週・上記T1条件で、期待成長の増分が従来(丸め死)比 **+4pt/選手以内**。合宿(×1.5全体2週)も同様に全体で確認
- **I3**: 開眼中(brakeGamma=1.0)・怪我ペナルティ(×0.4等)・スランプ0倍の各経路で挙動が破綻しない(スランプ中は依然成長0)

## 実装2: auto-sim --care モード

- `node test/auto-sim.js <seasons> <seed> --care` で、自動プレイヤーが**毎週**、決裁書類を以下の優先順で決裁枠・資金が許す限り実行する: bonus → party → refresh_leave → special_treatment → media → trainer → camp(発動条件を満たすもののみ。対象選手は該当プールからtrust昇順等の決定的規則で選ぶ)
- 乱数は `Engine.rng` のシード導出のみ使用(**Math.random禁止**。再現性必須)
- サマリー出力に追加: ケア総支出 / 実行回数(書類別) / 平均trust / 平均lockerRoomMorale
- **不変条件 I4**: `--care` なしの従来実行の出力は、実装3(G13)の影響を除き不変

## 実装3: G13 興行後処理の2重適用是正

- 現状: `Engine.executeShow`(management.js:15015付近)が内部で `applyShowTrust`+`updateLockerRoomMorale` を適用した後、tickWeek→processSettlement(management.js:13261付近)が同じ `lastShowResults` に再適用する。実プレイはprocessSettlementの1回のみ、auto-sim(とdev-tools)は2回になっている
- 修正方針: **executeShow側の適用を除去**し、全経路をprocessSettlementの1回に統一する。ただし着手前に `executeShow` の呼び出し元を全数列挙し(dev-tools.js:293等)、**それらがtickWeek経由でprocessSettlementを通ることを確認**すること。通らない呼び出し元があれば除去ではなくオプトアウト引数方式に切り替え、理由を報告書に書く
- **不変条件 I5**: 実プレイ経路(app.js→tickWeek)での適用回数は1回のまま(増減なし)

## 検証手順(フォアグラウンド実行。run_in_background禁止。長い場合はシード毎に分割)

1. `node --check src/management.js test/auto-sim.js`
2. I1確認: 修正前後で `node test/auto-sim.js 20 42`(careなし)の最終状態比較 → 全ステ一致
3. 数値目標T1〜T3の計測スクリプト実行 → 表を報告書に貼る
4. `node test/auto-sim.js 40 42` → ALL CLEAR
5. `node test/auto-sim.js 40 42 --care` → ALL CLEAR + ケアあり/なしの平均trust・morale・OVR差を報告(方向: ケアありが上)

## 完了条件

- コミットは3つ(実装1/実装2/実装3)。メッセージに task-98 と実装番号を含める
- 報告書: `docs/codex-tasks/task-98-report.md` に T1〜T3の計測表・I1〜I5の検証結果・getTrainerMult/executeShow呼び出し元の全数リストを記載
- マージはFableがdiffレビュー+**不変条件I1〜I5を1つずつ独立検算**した上で行う
