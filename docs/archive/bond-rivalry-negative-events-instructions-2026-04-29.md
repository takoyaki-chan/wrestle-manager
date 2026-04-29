# Claude Code 指示書: Bond/Rivalry ネガティブイベント拡張(残り項目)

作成日: 2026-04-29

## 経緯

`docs/bond-rivalry-negative-events-plan-2026-04-29.md` に基づく実装の続き。
**前セッションで完了した部分**:
- W-4 (M-07) 覚醒イベント生涯1回キャップ
- P-2 中間嫌悪帯 coldness スナップショット (GL-11)
- P-8 完全断絶 (Cold Severance) 月次 trust −0.5
- P-9 ナレーション型グリンプス 5本 (GL-12)
- 1-C UI 強化: 相関図に「憎悪」「因縁」ラベル

**この指示書で実装する残り項目**:
- P-1 タッグ編成 Bond ペナルティ + 警告
- P-3 興行への波及(逓減動員 + アクシデント率)
- P-4 派閥的険悪閾値(3組ロッカー荒廃 + 嫌悪伝染)+ 5組派閥スピンオフ
- P-6 社長室 修復チャネル決裁メニュー
- P-7 険悪可視化(相関図アイコン + 練習中セリフ)

## 全体方針

- 元プラン `docs/bond-rivalry-negative-events-plan-2026-04-29.md` をまず読み込んで全体像を把握すること
- CLAUDE.md の鉄則(数値哲学、UI 階層、auto-sim フック)に従う
- 派閥システムが未実装の場合、P-4 5組派閥スピンオフは保留マーカーを入れて先送り
- 同一ブランチ(現在 main)で段階的にコミット → auto-sim 検証 → 次へ
- 完了後は `docs/game-system-roadmap.md` 更新 + specs/ 更新 + 索引追記

---

## P-1 タッグ編成 Bond ペナルティ + 警告

### 仕様
- bond ≤ 20 のパートナー同士でタッグを組ませた場合、**試合中の全能力 −3**(設定ステータスを下げる扱い、試合内部ロジック非依存)
- tag-call 演出オフ
- 試合後 trust −1
- 編成画面では赤色マーカーと一言警告

### 実装ポイント
- タッグマッチ仕様は `specs/tag-match-system-spec-v0.1.md`、実装は `src/tag-battle-main.js`
- タッグ実装が動いている前提で、bond 値はペアの最小値(min(bondAB, bondBA))で判定
- ステータス −3 は試合エンジンに渡す前段で fighter オブジェクトの power/speed/technique/spirit を一時的に下げる(関数内 const fighter で複製した上で減算)
- tag-call は match-engine.js 内のタッグ連携演出 → 該当ペアの場合スキップ
- 編成画面 UI は `src/ui-common.js` の編成 modal を確認
- MQ ボーナス/ペナルティは絶対に入れない(MQ 排除方針)

### 受け入れ条件
- bond ≤ 20 ペアでタッグを組ませると編成画面に赤マーカーが出る
- 試合中、対象ペアのステータスが −3 されている(ログまたは内部 state で確認)
- 試合後、対象ペアの trust が各 −1
- auto-sim ALL CLEAR

---

## P-3 興行への波及(逓減動員 + アクシデント率)

### 仕様

#### 動員ボーナス(逓減%)
- 該当タグペア(`pure_hatred` or `bitter_feud` = rivalry ≥ 60 ∧ bond ≤ 30)を含むカードごとに動員 +%
- カード数が増えるほど効果が逓減:
  - 1カード目: +5%
  - 2カード目: +3%
  - 3カード目: +2%
  - 4カード目以降: +1%
  - 上限合計: **+12% 程度**(発散防止のためハードキャップ)

#### アクシデント率(敵対派閥との単発試合のみ)
- 通常ベース率 → **約2倍**
- ベース率は実装時に該当コードを読んで確定(目安は +5pt 〜 +10pt の範囲)
- 「敵対派閥との単発試合」とは、別派閥所属同士のシングル試合を指す。同団体内・タッグマッチ・通常興行は対象外
- 派閥システム未実装時は「タグペアを含む単発試合」で代替してもよい

### 実装ポイント
- 動員計算は `src/management.js` の興行計算ロジック(集客算定)を確認
- カード走査して該当タグの数を数え、`tagCount` 変数で管理
- 加算式: `bonusPct = [0.05, 0.03, 0.02, 0.01, 0.01, ...].slice(0, tagCount).reduce(sum)`、上限 0.12
- アクシデント発生コードはおそらく試合エンジン側 `src/match-engine.js` か `src/management.js` の試合解決処理
- 派閥判定は `src/factions.js` を参照

### 受け入れ条件
- 該当タグペア入りカードを5枚組んでも動員加算が +12% 以下に収まる
- 敵対派閥単発試合のアクシデント率がほぼ2倍になっている
- auto-sim ALL CLEAR(数値リバランス系なので 100×100 推奨)

---

## P-4 派閥的険悪閾値 + 嫌悪伝染

### 仕様

#### 段階発火(同団体内 bond ≤ 30 ペア数で判定)
- **3組**: ロッカー荒廃モーダル発火、orgPop −1、全体 morale −2
- **5組**: 派閥スピンオフイベント抽選(派閥システム接続)
  - 派閥システム未実装の場合は保留(コメントで TODO マーカー)

#### 嫌悪伝染(月1回判定)
- empathic 系性格の選手が、自分の Bond ≥ 60 の親友(A) が誰かを Bond ≤ 15 で嫌っているのを目撃した場合、その対象への Bond −1〜−2
- 月1回上限/伝染元のペア単位

### 実装ポイント
- `src/relationships.js` の `processWeeklyStoryEvents` 内に追加
- 同団体内ペア集計はループ前に一度だけ計算
- ロッカー荒廃モーダルは既存 modal enqueue パターン(`_enqueueModal`)に従う
- 嫌悪伝染は `personality === 'empathic'` 系のキャラから発火
  - `src/data.js` の personality 一覧を確認すること

### 受け入れ条件
- 同団体内に `bond ≤ 30` ペアが3組以上あると `M-XX` ロッカー荒廃モーダルが発火
- empathic 系の選手で嫌悪伝染が確認できる(auto-sim ログで bond −1/−2 の伝染イベントを観測)
- auto-sim ALL CLEAR

---

## P-6 社長室 修復チャネル決裁メニュー

### 仕様
- **対象**: W-1(`rivalry ≥ 40 ∧ bond < 40`)状態の発火が累計 4 回以上のペア(慢性的険悪)
- **形式**: 社長室の決裁メニューに常駐(回数無制限)
- **コスト**:
  - 社長アクションポイント: 2 pt
  - 金銭コスト: ¥1,000,000
- **効果**: 成功で双方向 bond +5〜+10、失敗で据え置き(rivalry には触らない)

### 実装ポイント
- 社長室仕様は `specs/shachoshitsu-spec-v1.0.md`
- 実装本体は `src/management.js` の社長室処理 + `src/ui-common.js` の社長室 UI
- W-1 累計発火カウントは新たに per-pair で記録する必要あり
  - state.relationshipHistory.w1Count[pairKey] = number など
  - processWeeklyStoryEvents 内で W-1 が成立した時にインクリメント
- 決裁メニューに「関係修復: A vs B」のようにペア指定アクションを追加
- 成功率は固定でよい(例: 70%)

### 受け入れ条件
- W-1 が4回以上発火したペアが社長室メニューに登場する
- 実行で2pt + ¥100万消費、bond が +5〜+10 上がる(成功時)
- auto-sim ALL CLEAR(エンジンレベル変更)
- UI 確認はユーザーに委任

---

## P-7 険悪可視化(相関図アイコン + 練習中セリフ)

### 仕様

#### 相関図アイコン
- **配置**: 相関図のペア線/接続点
- **絵柄**: 火花/稲妻は既存使用済みのため避ける。**人物系の険悪表現**
  - 怒った表情の絵文字、睨み合う2人のシルエット、口論する人物アイコン等
  - 候補(SVG 絵文字): 😠, 👥(背中合わせ風)、もしくは custom SVG path
- **トリガー**: U-1/U-2 タグ持ちペアのみ(`pure_hatred` / `bitter_feud`)
- **数字は出さない、絵のみ**
- 1-C UI ラベル(「憎悪」「因縁」)とは別軸で、視覚的アイコンを追加する

#### 団体画面 練習中セリフに険悪フレーズプール
- **配置**: 既存「練習中セリフ」表示の語彙バリエーションに追加
- **トリガー**: 低 bond / 高 rivalry の選手の練習中セリフ表示時
- **内容**: 恨みつらみ/敵意のこもった「練習中の独り言」風セリフ
  - 例: 「あいつのこと考えると練習に身が入らない…」「次に当たったら絶対…」
- **本数**: 初版5-10本

### 実装ポイント
- 相関図アイコン: `src/ui-render.js` の `_relmapRender` 内、リンク描画ループに hostileLabel と並べて icon を描く
  - 既存 1-C ラベル「憎悪」「因縁」のすぐ近くに <text> for emoji または <path> for shape
- 練習中セリフ: `src/data.js` GLIMPSE_B_LINES['GL-02'] (練習中のひとこと) に低bond/高rivalry 用の特殊プールを追加
  - もしくは新規 'GL-02-hostile' を作って checkBLayer で分岐
- 練習中の選手の中で `_findBestRelPair(f.id, state, 'rivalry', 50)` で対象あり、かつ bond ≤ 30 なら hostile プール優先

### 受け入れ条件
- 相関図で `pure_hatred` / `bitter_feud` ペアに人物系アイコンが表示される
- 該当選手の練習中セリフに恨みつらみ風のものが混ざる
- UI 確認はユーザーに委任(プレビュースクリーンショット推奨)

---

## 完了後の作業

1. `docs/game-system-roadmap.md` を更新(完了項目を追記)
2. `specs/` を更新:
   - `relationship-system-spec-v2.x.md` に P-2/P-4/P-8/P-9 の仕様を追記、または新規 spec 作成
   - 新規 spec を作った場合は CLAUDE.md の「specs/ ファイル索引」テーブルに追記
3. `docs/bond-rivalry-negative-events-plan-2026-04-29.md` と本指示書を `docs/archive/` (存在すれば)に移動
4. 段階的にローカルコミット(push はしない)
5. ユーザーに「確認してほしい画面・操作・表示」を具体的に列挙して報告

## 検証方針

- エンジンレベル: `node test/auto-sim.js 100` (シード指定なし) で ALL CLEAR を確認
- 数値リバランス系 (P-3/P-4): `for i in $(seq 1 100); do node test/auto-sim.js 100 $((i*7919)); done | grep "Result:"` で大規模テスト
- UI 系: ユーザーに委任(preview_screenshot で確認案内)

## 参考ドキュメント

- 元プラン: `docs/bond-rivalry-negative-events-plan-2026-04-29.md`
- CLAUDE.md(プロジェクトルール一式)
- specs/relationship-system-spec-v2.0.md / v2.2.md
- specs/trust-system-spec-v2.1.md
- specs/shachoshitsu-spec-v1.0.md
- specs/tag-match-system-spec-v0.1.md
- specs/faction-system-spec-v0.1.md
- docs/ui/01-foundations.md / 02-layouts.md (UI 鉄則)
