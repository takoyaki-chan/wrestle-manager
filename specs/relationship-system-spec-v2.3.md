# Relationship System Spec v2.3 — Bond/Rivalry ネガティブイベント拡張

策定日: 2026-04-29
位置付け: v2.2 の追補。bond/rivalry の値が直接トリガーとなるネガティブイベントの空白地帯を埋める追加施策のうち、**先行実装が完了した項目**を確定仕様として記録する。

未実装項目(P-1 タッグ Bond ペナルティ / P-3 興行波及 / P-4 派閥的険悪閾値 / P-6 修復チャネル / P-7 険悪可視化)は `docs/bond-rivalry-negative-events-plan-2026-04-29.md` 参照。

## §A 先行実装完了項目

### §A.1 W-4 (M-07) クロス非対称・覚醒イベントの生涯1回キャップ

**背景**: W-4 は 1.5%/週の独立判定で、条件維持期間が長いほど発火確率が指数的に上昇していた(2年で約80%、3年で約90%)。同条件の相手が複数いる場合、覚醒が連発する懸念があった。

**仕様**:
- 覚醒イベントを発火した選手に `_awakened: true` フラグを付与
- 既に覚醒済みの選手(`_awakened === true`)は覚醒トリガー条件から除外
- フラグはキャラ生涯保持(セーブ持ち越し可)

**実装**: `src/relationships.js` `processWeeklyStoryEvents` 内、覚醒判定の if 条件に `&& !right._awakened` / `&& !left._awakened` を追加。発火直後に `updateFighter(id, fighter => ({ ...fighter, _awakened: true }))` でフラグ記録。

### §A.2 P-2 中間嫌悪帯スナップショット(GL-11 coldness)

**背景**: 既存スナップショットは `bond 低 ∧ rivalry 高` 帯(hatred)に偏っており、「bond だけ低い(rivalry は普通)」帯のドラマが空白だった。

**仕様**:
- トリガー: ある選手 → 対象 の `bond ≤ 25 ∧ rivalry < 30`
- 発火率: 候補ペアあり時、6%/週(同一選手の B-Layer クールダウン4週内では1件のみ)
- 候補が複数ある場合は **最低 bond のペア**を選ぶ
- スナップショット種別: `GL-11`、tone `negative`、ラベル「冷たい距離」
- 純演出枠(数値影響なし、orgPop 影響なし)

**実装**: `src/relationships.js` `Engine.glimpse.checkBLayer` 内、ロスター走査ループに追加。台詞プールは `src/data.js` `GLIMPSE_B_LINES['GL-11']` に格納(personality × archetype 構造)。

### §A.3 P-8 完全断絶 (Cold Severance)

**背景**: bond 単独の極低帯(0〜10)で起きるドラマが無かった。

**仕様**:
- トリガー: ペアの一方向 `bond ≤ 10 ∧ rivalry < 30`(無関心の極地)
- 発火: 25%/週、当該方向の主体側に `trust −0.5`(月平均1回相当)
- 方向別判定: `relAB` と `relBA` を独立に評価する(両方向で同時発火する可能性あり)
- スナップショット表示: 既存 GL-11(coldness)が該当帯をカバーするため P-8 専用スナップショットは作成しない
- 派閥またぎ強化は **不採用**(冷たい関係は派閥対立とは別軸のドラマと判断)

**実装**: `src/relationships.js` `processWeeklyStoryEvents` 内、ペアループの覚醒判定の前に追加。

### §A.4 P-9 ナレーション型グリンプス(GL-12)

**背景**: 既存グリンプスはキャラ視点の独白のみで、第三者観察の語り口が無かった。低 bond ペアの「気配」だけを覗き見せる演出窓が欠けていた。

**仕様**:
- トリガー: 同一興行参加者ペアのうち `min(bondAB, bondBA) ≤ 15` のペアが存在
- 発火率: 候補ペアあり時、25%/週(月1回程度の発火頻度)
- 候補が複数ある場合は **最低 bond のペア**を選ぶ
- 視点: 第三者(記者/解説者)の三人称ナレーション
- 文言テンプレート: `{nameA}` `{nameB}` 置換、初版5本(`src/data.js` `GLIMPSE_B_LINES['GL-12']._narration`)
- スナップショット種別: `GL-12`、tone `narration`、ラベル「第三者の証言」
- 数値影響なし、純演出枠

**実装**: `src/relationships.js` `Engine.glimpse.checkBLayer` 内、ロスター走査の外で同興行参加者から判定。`state.lastShowResults` から参加 ID を集計する。

### §A.5 1-C UI 強化: 相関図の極端ペア日本語ラベル

**背景**: `_classifyRelation` が出力する内部分類タグ(`pure_hatred` 等)が相関図(リレーションマップ)上でラベル化されていなかった。記事(因縁列伝)側では既に日本語化されているが、グラフ上では数値しか見えなかった。

**仕様**:
- 相関図のリンク描画時、極端ペアのみ日本語ラベルをペア線の上に表示
  - `pure_hatred`(rivalry ≥ 80 ∧ avg bond ≤ 30): **「憎悪」**(色: `#ff7675`)
  - `bitter_feud`(rivalry ≥ 60 ∧ avg bond ≤ 30): **「因縁」**(色: `#e17055`)
- 中間帯(`cold_rivalry` 等)はラベルなし(存在感を持たせる必要のある関係だけ可視化)
- `rivalTitle`(因縁称号バッジ)が付いている場合はそちらを優先表示し、hostile ラベルは出さない
- 数字は出さず、語感だけで伝える

**実装**: `src/ui-render.js` リンク構築時に `link.hostileLabel` を計算し、`_relmapRender` 内で `rivalTitle` の else 分岐として描画。

## §B 検証

- auto-sim 20シーズン × 5シード = 100シーズン: ALL CLEAR(2026-04-29)
- ブラウザプレビュー: 相関図ラベル表示はユーザー手動確認

## §C 残課題(後続実装)

- P-1 タッグ編成 Bond ペナルティ + 警告
- P-3 興行波及(逓減動員 + アクシデント率)
- P-4 派閥的険悪閾値(3組ロッカー荒廃 + 5組派閥スピンオフ + 嫌悪伝染)
- P-6 社長室 修復チャネル決裁メニュー
- P-7 険悪可視化(相関図人物系アイコン + 練習中セリフプール)

詳細は `docs/bond-rivalry-negative-events-instructions-2026-04-29.md`。
