# task-100: care-rework2 P2-A〜F「書類の役割再定義」機械的再較正

- 起票: 2026-08-30(Fable)。実装: **Opus(隔離worktree)** → Fableがdiffレビュー+不変条件検算→mainマージ(task-97/98/99と同方式)
- P2-G「起用約束」は**含まない**(task-101で別途)

## 1. 目的

社長室の決裁書類に固有のニッチを与える数値再較正。P2-A(休暇=wear)/P2-B(慰労会=士気)/P2-C(特別治療=長期怪我)/P2-D(メディア純化)/P2-E(ボーナス揺らぎ)/P2-F(倍率テーブル整理)。

## 2. 仕様の正

- **`docs/care-rework2-p2-design-v0.1.md`**(数値・不変条件のすべて。本書に二重記載しない)
- 現行実数の所在(実測済みアンカー): DECISION_DOCS=data.js:19108-19318 / 倍率テーブル=data.js:19333-19352 / 休暇週次処理=management.js:12655-12673 / 季末wear=management.js:8648-8679 / 特別治療=management.js:23519-23532と23941-23974(ポップアップ経路) / 発動条件=management.js:22754-22811 / party実行=management.js:23622-23630 / media実行=management.js:23533-23547 / bonus4案=management.js:22896-22947 / 士気力学=management.js:22582-22632

## 3. 触ってよい / 触ってはいけない

**触ってよい**: src/data.js(DECISION_DOCS・倍率テーブルの宣言リテラル編集のみ。ブラケット代入禁止) / src/management.js / src/app.js / src/ui-common.js / src/ui-render.js(発動条件変更に伴うUI文言・怪我ポップアップの治療ボタン表示条件) / test/(auto-sim --care方針の追随+計測プローブ)

**触ってはいけない**: src/match-engine.js / src/relationships.js / wearの蓄積式(applySeasonTrainingWear)・WEAR_TABLE・decay式 / 怪我の発生率・週数生成 / 士気の力学(平均回帰・敵ペア・MQ項) / trainer・campの効果 / ⚡コスト(全書類現状維持) / 新規srcファイル作成禁止

## 4. 数値目標と不変条件(対で書く。値の正は設計doc)

| # | 目標 | 不変条件 |
|---|---|---|
| A | 休暇中の毎週wear-1(最大-4/回)+**季あたり選手毎-4上限**(`_wearRelievedThisSeason`型のカウンタ、季末リセット) | 引退年齢中央値の変動±1季以内(検証6)/wear蓄積式は不変/回復はプレイヤーの休暇辞令経路のみ(AI側に入れない) |
| B | party: 即時+6+**余韻+1×3週**(週次処理で適用・0..100クランプ)+CD 2週 | --care 40季のmorale平均58〜64/士気力学不変/余韻の週次トースト禁止(通知総量不変) |
| C | 特別治療: 対象=**総週数10以上**の怪我のみ(発動条件`has_longterm_injured`)/短縮=残り週数の40・45・50%roll(round、最低4週)/費用500万/**ポップアップ経路も⚡1**(不整合解消) | 怪我の発生率・週数生成・1〜9週怪我の回復分布は完全不変/軽中傷にはボタン自体を出さない(押せて弾かれる状態を作らない) |
| D | media: trust基礎5.36→2.0/condition+5削除 | 人気+6〜8と逓減カーブ/orgPop+0.4/嫉妬bond-1/費用・⚡・CD・minOrgPopすべて不変 |
| E | bonus4案ノイズ±10%→±22% | 基準倍率{0.5,1.0,2.0,3.0}/帯定義/プライドinsultMax=0.8/丸め規則は不変 |
| F | DECISION_PERSONALITY_MULTのspecial_treatment列を削除+DECISION_ARCHETYPE_MULTにcomposed/polite行を追加(値は設計doc §P2-F) | 既存の全セル値を1つも変えない(追加・削除のみ)/calcUncertaintyの合成・clamp・トーン分類は不変 |

付随: 発動条件の変更に伴うUI文言(書類の効果説明・recommendation等)は現物に合わせて更新。**内部変数名(wear/morale/trust等)をプレイヤー向け文言に出さない**(消耗・雰囲気・信頼などの日本語)。

## 5. auto-sim --care方針の追随(test/auto-sim.js)

- party: CD2週で `cooldown` エラーが出る週はスキップ(エラー扱いにしない)
- special_treatment: 対象を総週数10+の怪我人に変更(いなければスキップ)
- refresh_leave: 現行方針のまま(スランプ条件)。wear回復はエンジン側で勝手に効く
- **計測プローブ追加**: [ケア計装]サマリーに「引退年齢の中央値・平均・件数」を追加(引退イベント発生時に年齢を記録する読み取り専用フック)。--careなしでも記録する

## 6. 検証手順(すべてフォアグラウンド。バックグラウンド起動禁止)

1. 編集した各ファイルに `node --check`
2. `npm test` 全PASS(発動条件・効果値を固定しているテストがあれば、設計docの新値に**振る舞い検査として**追随させる。数値目標だけ満たして不変条件を外す書き換えは禁止)
3. `node test/auto-sim.js 40 42` / `node test/auto-sim.js 40 42 --care` — 両方ALL CLEAR
4. **受け入れゲート**: --careのmorale平均が58〜64に入ること(外れたら設計doc §P2-Bの範囲でparty即時値/余韻を調整し、採用値を報告)
5. **引退年齢の比較**: 同プローブで `WM_SOURCE_REF=<merge前main>` の40季42(なし/あり)を回し、中央値の変動が±1季以内であることを確認(P2-A不変条件)。4本の実測値を報告書に記載
6. `npm run test:ui:walkthrough` 1本(UI文言・ボタン条件を触るため)。環境で動かなければスキップして明記

## 7. 完了条件

- コミットはP2-A〜Fで粒度を分ける(6前後)
- `docs/codex-tasks/task-100-report.md`: 変更点(ファイル:行)/検証結果(§6の実測値全部)/UI文言の変更全文/申し送り
- specs更新・worklog・マージはFableが行う(worktree内でspecs/を触らない)
