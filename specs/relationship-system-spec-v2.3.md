# Relationship System Spec v2.3 — Bond/Rivalry ネガティブイベント拡張

策定日: 2026-04-29
更新日: 2026-07-19 (因縁決着の確定値と宿怨ルートの意味を追記)
位置付け: v2.2 の追補。bond/rivalry の値が直接トリガーとなるネガティブイベントの空白地帯を埋める追加施策の確定仕様。

§A は先行実装完了項目(W-4キャップ / P-2 / P-8 / P-9 / 1-C UI)、§D は追加実装した項目(P-1 / P-3 / P-4 / P-6 / P-7 / 因縁決着整合性)。

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

- auto-sim 20シーズン × 5シード = 100シーズン: ALL CLEAR(2026-04-29 §A 確認時)
- auto-sim 50シーズン: ALL CLEAR(2026-04-29 §D 追記時、違反0)
- ブラウザプレビュー: 相関図ラベル表示・タッグ警告・社長室書類はユーザー手動確認

## §D 後続実装(P-1 / P-3 / P-4 / P-6 / P-7)

### §D.1 P-1 タッグ編成 Bond ペナルティ + 警告

**仕様**:
- ペアの bond `min(bondAB, bondBA)` ≤ 20 のとき、試合エンジンに渡す前段で fighter を複製し power/speed/technique/spirit を **各 -3**
- 試合中の連携(cut-in 救援)を完全停止 — `calcCutinRate` で `bond ≤ 20` なら 0 を返す(自然減衰ではなくハードカット)
- 試合後、対象ペア両者の trust **-1**
- タッグ編成プレビューに赤色マーカー「⚠ 不仲 ${bond}」+ 警告テキスト「能力-3 / 連携不可 / 信頼-1」
- MQ ボーナス/ペナルティは入れない(MQ排除方針継続)

**実装場所**:
- `src/app.js` simulateTagMatch 呼び出し2箇所(自動実行 / 観戦実行)
- `src/match-engine.js` `calcCutinRate` ガード
- `src/ui-common.js` タッグマッチプレビュー(`smc-tag-arena`)

### §D.2 P-3 興行波及(逓減動員 + アクシデント率)

**仕様**:
- **動員ボーナス(逓減%)**: `pure_hatred` または `bitter_feud` ペア(rivalry ≥ 60 ∧ avg bond ≤ 30)を含むカードに対し、1枚目+5%, 2枚目+3%, 3枚目+2%, 4枚目以降+1%、上限合計 +12%
  - シングルは `card.left/right`、タッグは敵チーム間ペアで判定
- **アクシデント率2倍**: シングル戦で対象ペアの場合、`Engine.injury.check` の `flavorOpts.injuryMult` を 2.0 倍に上乗せ(派閥未実装のため代替条件)

**実装場所**:
- `src/management.js` `Engine.economy.calcHostileCardBonus` 新設、`calcAttendance` に加算
- `src/management.js` 試合解決ループ内、`_hostileMatchMult` で injury check 引数に乗算

### §D.3 P-4 派閥的険悪閾値 + 嫌悪伝染

**仕様**:
- **ロッカー荒廃モーダル**: 同団体内 `min(bondAB, bondBA) ≤ 30` ペアが 3 組以上で `M-24` 発火、`lockerRoomMorale -2` / `orgPop -1`、シーズン1回(13週クールダウン)
- **5組派閥スピンオフ**: 派閥システム(faction-system-spec-v0.1)未実装のため `TODO` で保留
- **嫌悪伝染**: personality === `'emotional'` の選手が、自分の bond ≥ 60 の親友が誰かを bond ≤ 15 で嫌っているのを目撃した場合、その対象への bond -1〜-2(月1回判定、4週クールダウン/(carrier, target)ペア)

**実装場所**:
- `src/relationships.js` `processWeeklyStoryEvents` 内、ペアループ後ブロックで集計判定 + `_enqueueModal('M-24', ...)` + 伝染パス
- `src/ui-common.js` MODAL_TITLES に M-24 追加

**注**: 指示書記載の「empathic 系」は、現行 personality 一覧(normal/bold/earnest/easygoing/emotional/quiet/shy)に存在しないため、最も近い `'emotional'` で代替。

### §D.4 P-6 社長室 修復チャネル決裁メニュー

**仕様**:
- 新書類 `relationship_repair`(関係修復斡旋書) を `DECISION_DOCS` に追加
- **対象**: W-1(rivalry ≥ 40 ∧ bond < 40)累計発火 4 回以上のペア(両者とも現役・非レンタル・非怪我)
- **コスト**: 決裁枠 2pt、回数無制限。**2026-07-17 改修**: 固定¥1,000,000 から当事者給与連動に変更 — `費用 = 90万 + (給与A+給与B) × 0.4`(10万単位丸め)。実測給与レンジ(新人9〜13万〜トップ王者185〜227万)から較正し、新人ペアはほぼ現行固定額(≈100万)、トップ選手ペアは2.4〜2.7倍(≈240〜270万)になる
- **効果**: 成功率 70%。成功時、双方向 bond +5〜+10。失敗時は据え置き(rivalry には触らない)
- **W-1 カウンタ**: `state.w1FireCount[`${minId}_${maxId}`]` で per-pair に積算。`processWeeklyStoryEvents` の憎い敵ゾーン処理内でインクリメント
- **新 UI**: `target: 'pair'` 書類用に `showDecisionPairModal` を新設(W-1 ≥ 4 のペア一覧から選択)。ペア選択のたびにコスト・残金パネルを再描画し、一覧行にもペアごとの費用を表示(2026-07-17)

**実装場所**:
- `src/data.js` `DECISION_DOCS.relationship_repair` + `DECISION_DOC_ORDER` 追記
- `src/management.js` `checkActivation` の `'hostile_pair_chronic'` 分岐 + `execute()` の `target: 'pair'` 分岐 + relationships 上書き反映 + `Engine.shachoshitsu.calcCost(doc, state, pairKey)` の給与連動コスト算出(2026-07-17)
- `src/ui-common.js` `showDecisionPairModal` 関数
- `src/app.js` `openDecisionDoc` ルーティング(team / pair / individual の3分岐)

### §D.5 P-7 険悪可視化(相関図アイコン + 練習中セリフプール)

**仕様**:
- **相関図アイコン**: `pure_hatred` ペアに 😠、`bitter_feud` ペアに 😤 を hostileLabel の直下に描画。数字は出さない
- **練習中セリフプール**: 既存 GL-02 の選出時、自分が rivalry ≥ 50 ∧ bond ≤ 30 の相手を持っている場合、新規プール `GL-02-hostile` を優先選択。tone を `negative`、ラベルを「練習中の敵意」に切替
- 7 personality(normal含む)分のフレーズを初版 5〜10 本ずつ整備

**実装場所**:
- `src/ui-render.js` リンク描画ループ内、hostileLabel 描画ブロックに icon を追加
- `src/data.js` `GLIMPSE_B_LINES['GL-02-hostile']` 追加
- `src/relationships.js` `Engine.glimpse.checkBLayer` の GL-02 ブロックで hostile 判定 + プール切替

### §D.6 因縁決着の確定値と宿怨ルート

**決着試合直後の rivalry**:
- 1回目: bond 50以上なら 10〜20、50未満なら 25〜35
- 最終決着・好敵手: 0〜5
- 最終決着・宿怨: 30〜40
- `checkResolution` が選んだ値を通常の試合効果と他団体戦上限の適用後に再確定し、通常興行・エンジン内興行・PPVの全経路で同じ結果にする
- 明示値を持たない旧呼び出しだけは、互換動作として従来の M-10（0〜10）を維持する

**宿怨の意味**:
- `resolved: 'bitter'` は「勝敗が決していない」状態ではなく、**勝敗は決したが遺恨が残った**状態
- 宿怨ルートでは M-10 / M-CO2 の和解 bond ボーナスを適用しない
- 決着演出は「決着、なお宿怨」「勝敗は決した。しかし、遺恨は消えなかった」と表示し、「決着したのに新たに宿怨になった」と読める表現を避ける

**実装場所**:
- `src/relationships.js` `applyMatchResult` の M-10 と最終確定処理
- `src/app.js` / `src/management.js` の因縁決着結果メタデータ引き渡し
- `src/ui-common.js` の宿怨決着ポップアップ

## §E 残課題

- 派閥システム(faction-system-spec-v0.1)実装後、P-4 5組派閥スピンオフを差し戻し
- M-24 のフラグダイアログ(personality別セリフ拡充)は後続セッション
