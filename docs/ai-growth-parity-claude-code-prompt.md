# AI成長パリティ 実装指示書(Claude Code メインセッション用)

> **作成**: 2026-08-02(設計セッションより)
> **仕様の正**: `specs/ai-growth-parity-spec-v0.1.md`(🟢承認済み 2026-08-02)。**本指示書と食い違ったらspecが正**
> **背景の詳細**: docs/worklog.md 2026-08-01「AI成長パリティ spec v0.1 起案」

## ミッション

成長入力をAI団体/プレイヤーで対称化する(spec P-1〜P-6 + §3 + §4)。
原則は「**公平な対決。差がつくのは采配の質だけ。AI=毎週おまかせを押す社長**」。

## 0. 開始時の注意

- `git status` を確認。2026-08-01時点で src/data.js / src/management.js / test/newspaper-news-value-test.js に**別作業の未コミット変更**があった。取り込み状況を確認し、自分の変更と混ぜないこと
- Keisukeが同じ作業ツリーで実機プレイすることがある。エージェントに委譲する場合は**worktree必須**(mainの作業ツリーを直接編集させない)
- 着手前に **呼び出し元を全列挙**: `aiMatchWearCoef` / `intensiveMult` / `coachMul` / `growthBonus` / processAIWeek内の `isShowWeek`。specの行番号は2026-08-01時点のもので、ズレている前提で必ずgrepし直す

## 1. 実装順序

1. **P-1〜P-3**(processAIWeek 9210-9290近傍): 興行週練習解禁 / 体調安全弁(体調<60強制休養、追い込みは cond≥50 かつ intensiveWeeks<2) / 熱量逓減(`intensiveHeatTable[_heat]` + _heat更新をプレイヤー側 11463 と同規則で)
   - 可能ならプレイヤーの balance 分岐と判定コードを共有する(将来のドリフト防止、spec §0)
2. **P-4**: プレイヤーのシーズン末wear式(7576-7615)を共通関数に抽出し、AI側(9944-9958)から呼ぶ。AIも追い込みで `seasonIntensiveWeeks` を積む。`aiMatchWearCoef` 廃止
3. **§3/§4**(data.js): intensiveRate改定表の適用(normal/elevated両方)。practiceRateは据え置き
4. **P-5**: シーズン開幕処理でAIトレーナー付与。候補=trainCapOVR上位3(ただし wear=0 かつ 衰えステ減少ゼロの選手のみ)からランダム1名。S級50% / elevated A級30%。効果はプレイヤーの外部コーチ招聘(care-rework §3)と同値参照
5. **P-6**: 死に定数の整理(coachMul は 8374 の用途特定後に判断 / growthBonus は削除)
6. **I5**: validateGameState に AI選手の `_heat∈[0,4]` / `seasonIntensiveWeeks≥0` / `strainDebt≥0`(decayStartAge到達済みなら=0) を追加

## 2. 検算義務(マージ前に1つずつ自分で)

spec §5 の G1〜G4 / I1〜I5 を必ず対で確認する。特に:

- **I4(プレイヤー無風)**: 同一シードでプレイヤー選手の練習成長が変更前後で一致すること。AI側は独立乱数ストリーム(aiRng)なので、分離が保たれていれば一致するはず。auto-simのfingerprintで比較
- **I3(AI自壊なし)**: wear対称化後のAI引退年齢中央値が現行比−1.0歳以内
- 計測用fixtureを足す場合、**本編の乱数消費とシーズン推移を変えないこと**。2026-08-01のWM_PPV_FIXTUREはfingerprintが動いて取り下げになった(worklog参照)。必要ならstateのディープコピーで干渉しない形にする

## 3. 計測(spec §6)

- ベースライン: 現行mainで40年×同一5シード(既存計測があれば使い回す)
- 実装後: 同5シードで40年×2構成(通常 / 開幕からelevated強制)
- 比較指標: S/A/Bトップ層到達OVR分布・カンスト率・AI引退年齢・AIロスター人数・I4一致
- 採用値の最終確認だけ100年×1本。**フェーズごとに回さない**(management.js/data.js編集でauto-simフック100季が自動実行される。それで日常の受け入れは足りる)
- §9-3(下位層の底上がり)はこの計測結果で判断。絞る場合は下位枠のpracticeRateを下げる

## 4. 完了処理

1. `growth-system-spec-v2.2` を起票し、v2.1への上書き(spec §8の表: §6.1/§6.2/§6.3/§9/§10.2)を統合
2. rival-org-spec-v1.0 のAI週次処理記述を更新
3. `ai-growth-parity-spec-v0.1.md` のステータスを実装済みへ、CLAUDE.mdファイル索引の該当行を更新
4. docs/worklog.md 先頭に詳細ログ、ローカルコミット(**pushしない**)
5. 完了報告で確認依頼を具体列挙(例: AI団体詳細でのシーズン後OVR推移、覚醒後のA/B強化の体感、AIエースの引退年齢感)

## 5. この指示書のスコープ外(次段)

- **開眼(化ける)システム**: 本実装の較正完了後、トップ実到達帯(G1)を物差しに別specを起票する。設計方向はKeisuke承認済み(隠しシード1〜2%/着地帯方式/開眼期間、経緯はworklog 2026-08-01とメモリ参照)。**この指示書では着手しない**
