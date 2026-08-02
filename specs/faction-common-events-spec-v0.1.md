# 派閥共通イベント仕様 v0.1

**ファイル**：`specs/faction-common-events-spec-v0.1.md`
**最終更新**：2026-05-02
**実装状況**：Phase A〜D 全実装完了（Common-1/3/4/5/7 すべて稼働）。Common-1 リデザイン v0.2（2026-05-02）：打診モーダルを比較レイアウト化（OVR 表示 / 名前リンク / 頭上吹き出し）。**task-79（2026-08-02）：A 選択を即時試合から興行予約(`G.bookedCommon1`)へ変更**。枠(メイン/セミ/中盤)を強制せず、プレイヤーがカード編成のどこに置くかを決める。auto-sim 20×42 で違反 0 確認済み
**親仕様**：
- `specs/faction-system-spec-v0.1.md`（既存 F01〜F08）
- `specs/faction-archetype-rework-spec-v0.1.md` v0.2
- `specs/faction-f07-variation-spec-v0.1.md` v0.4

---

## 0. 位置付け

既存の派閥イベント F01〜F08 は以下の系統：

| 系統 | イベント |
|---|---|
| 派閥成立・喪失 | F01 結成、F03 喪失 |
| 派閥同士の敵対 | F02 抗争、F06 和解、F08 直接対決 |
| 派閥メンバーの流動 | F04 寝返り |
| 派閥内の崩壊兆候 | F05 亀裂、F07 リーダー動向 |

これらはすべて **重大な節目**（対立・喪失・崩壊・結成）を扱う。日常的な派閥の動きを覗き見る軸が欠けていた。

本仕様で追加する **共通イベント Common-1/3/4/5/7** は：

- 既存 F01〜F08 と被らない
- 派閥の **存続中の日常** を覗き見る
- 全アーキタイプで共通発動（アーキタイプによってトーンが変わる）
- F07（派閥動向）よりさらに頻度低めに、軽めに

## 1. イベント全体像

| ID | 名称 | プレイヤー入力 | 軸 |
|---|---|---|---|
| Common-1 | 派閥内の試合提案 | 3択 | 内部 rivalry を試合に昇華（F05 亀裂と逆向き） |
| **Common-3** | 派閥加入の通知 | **通知のみ** | 自動加入を覗き見る、セリフ付き（F04 流出と対称） |
| Common-4 | 派閥合宿・慰労会 | 通知のみ | 派閥の日常 |
| Common-5 | 派閥代表メディア取材 | 3択 | 対外評価 |
| Common-7 | 派閥間の合同企画 | 3択 | 派閥同士の協力軸（F02/F06/F08 の敵対系の対称） |

Common-2（脱退検討）は F04 と被るため削除。Common-6（派閥内の声援）は試合演出フックに格下げ（§7）。

## 2. 発動レートの設計

派閥共通イベントは **チーム全体で 6 週に 1 回程度** の発動を目指す。F07（12 週に 1 回）よりやや高頻度で、派閥の日常感を出す。

```
Common 全体クールダウン: 6 週（チーム全体）
派閥個別クールダウン: 24 週
個別イベント CD: イベント別（§3〜§7）
```

派閥が増えても、全体 CD があるためプレイヤーの体感は一定。

## 3. Common-1：派閥内の試合提案

### 3.1 概要

派閥内のメンバー2名間で rivalry が高まったとき、その緊張を **試合で解消** することを提案するイベント。

F05（派閥内亀裂）が「分裂への流れ」だとすれば、Common-1 は「内部対立を試合で昇華して維持する」逆向きの選択肢。

### 3.2 発動条件

- 派閥内のメンバー2名間 rivalry ≥40
- 個別 CD 16 週
- 興行カード編成週

### 3.3 プレイヤー提示

**打診モーダル（v0.2 リデザイン）**：
- 2 名を左右に並べた比較レイアウト（ポートレート / OVR / PW・SP・TE・ST・MN ステータス・高い側ハイライト）
- 名前・ポートレートをクリックで選手詳細ポップアップ（`showFighterPopup(id, 'roster')`）
- リーダーが対戦者(A/B)本人のときは、その側のポートレート頭上に **白吹き出し**（UI 共通ルール準拠：クリーム背景 + 黒文字 + 中央寄せ + 三角尻尾）でリーダーセリフ
- **リーダーが対戦者でないとき（task-79 A、2026-08-02 修正）**：対戦者の頭上に誤帰属させず、コーチ帯（reporter strip）の下に専用の**リーダー帯**（`.fc1-leader-strip`、chip サイズ 46×66・2:3 のミニ画像 + 頭上吹き出し）を出してそこにリーダーセリフを表示する。吹き出し内には名前・所属を書かない（`.fc1-leader-tag` に外出し）
- リーダーセリフは **アーキタイプ × 性格** の 6×6 マトリクスから生成（personality: fiery/composed/grudging/airy/earnest/flippant）
- 「2 名間の因縁 X / 100」表記（内部変数名 rivalry を出さない）

3 択：
- **A：派閥内対決を組む** — 次の興行への**予約**を作る（枠はカード編成でプレイヤーが決める）
- **B：別カードに置換** — 別の対戦カードに振り替える
- **C：静観** — 自然に任せる

### 3.4 効果

| 選択 | 効果 |
|---|---|
| A | **興行予約(`G.bookedCommon1`)を作る**。試合はその場では行われない。下記 §3.4.1 の予約制で消化された興行の結果処理で §3.4.3 の波及効果を適用。`Engine.relationships.applyMatchResult` も同団体ペアとして経由 |
| B | 当該2名 trust ±0、rivalry が継続。F05 発火確率 +5% |
| C | 自然展開。rivalry はそのまま、F05 発火確率 +10% |

### 3.4.1 興行予約制（v0.3 — task-79、2026-08-02）

**設計原則**：「社長は舞台を作る人」— 対決の格（枠）を決めるのは社長。システムは強制しない。

A を選ぶと即座に試合は行われず、`G.bookedCommon1 = { fighterAId, fighterBId, factionId, factionName, archetypeId, leaderId, createdSeason, createdWeek, createdAbsWeek }` という単一の予約が作られる。

- **興行への組み込み**：次回**通常興行**の編成画面に「予約」バナーが出る（`renderShowPrep`）。プレイヤーが通常のカード編成でこの2名を同じ枠（メイン/セミ/中盤）に組めば、その枠がどこであっても興行結果処理で自動的に検出・清算される。枠は問わない（メインに置けば既存のビッグマッチ/因縁ブースト — `matchIdx===0` のタイトルマッチ相当の tier=2 判定 — が自然に乗るだけで、システム側から特定の枠を強制することはない）
- **試合の規格**：通常興行の Pass-1 シミュレーションにそのまま乗る（`App._normalShowMatchTier` — メイン/タイトル/ドームメインのみ tier=2）。旧・即時試合フロー（`matchTier` 固定2 でのビッグマッチ扱い）は廃止
- **清算処理**：`App._finalizeShowImpl` 内、F08 ディレクティブ処理の直前で `G.bookedCommon1` とカード上の一致ペアを検出し、`Engine.factions.applyCommon1MatchResult` を適用（§3.4.3 は不変）。結果表示は即時試合用モーダルの代わりに、興行結果表示の前段（F09/F08/CR と同じ drain チェーン）で `_renderCommon1MatchResult` を表示する
- **衝突ルール**：
  - 特別興行週（PPV/春タッグ/秋対抗戦/天頂戦/4団体戦 等）には組み込まない → `Engine.challengeRequest.isEligibleHomeShow` が false の週は自動的に見送り、次の通常興行へ繰り越す
  - 挑戦状(CH系)/B3奪還挑戦/F09対抗戦/派閥内序列戦と**同一興行で重ねない**（`Engine.factions.hasCompetingBooking` が `_crMatchLocked`/`isCRMatch`/`_f09Locked`/`_internalChallengeLocked`/`isReclaim` のいずれかを検出したら、その週の Common-1 清算を見送る。1興行に予約消化は1件まで、先着優先）
  - 当事者が負傷/レンタル/forcedRest/退団・引退（ロスターから消失）したら予約は**静かに破棄**（`Engine.factions.isBookedCommon1Valid` が false を返し、週次スイープ `sweepBookedCommon1` が黙って削除。エラー・説明文なし。因縁は残る）
  - 期限：予約から**1シーズン(48週)** 消化できなければ自然消滅（`isBookedCommon1Expired`。因縁は残ったまま）
  - 社長命令による派閥解散（`dissolveAllByDecree`）でも進行中の予約は畳まれる
- **二重予約防止**：`G.bookedCommon1` が存在する間は `checkCommon1Conditions` が ineligible を返し、新しい Common-1 は選ばれない

### 3.4.3 試合結果の波及効果（v0.3 — リーダー敗北＝下克上を区別）

`applyCommon1MatchResult(state, payload, winnerId, loserId, rng)` は、敗者がリーダーかどうかでドラマの大きさを切り替える。

**A. 共通効果（誰が勝っても）**
- 勝者 trust +3〜+5
- 敗者 trust -1〜-3
- 2 名間 rivalry -30〜-50（両方向）
- 勝者 popularity +1〜+3

**B. リーダー敗北 = 下克上（loserId === leaderId）**

| 効果 | レンジ | 備考 |
|---|---|---|
| リーダー trust（追加） | -3〜-6 | 共通の -1〜-3 に加算 |
| リーダー popularity | -2〜-4 | 求心力の可視低下 |
| 派閥 momentum | -8〜-15 | hostility 状態を問わず直接 momentum を動かす |
| 派閥メンバー全員 → リーダー rivalry | +5〜+10 | 「あの人もう絶対じゃない」の伝染 |
| 勝者 popularity（追加） | +2〜+4 | 共通の +1〜+3 に加算（一気にスター化） |
| 勝者 → リーダー rivalry | +10〜+20 | 次の標的化 |

**アーキタイプ別倍率**（B の各レンジに掛ける）：

| archetype | mult | ねらい |
|---|---|---|
| AUTHORITY | ×2.0 | 権威構造への致命傷 |
| MERIT | ×0.5 | 想定内（実力で順番が決まる思想） |
| HEEL | ×0.7 | 弱肉強食。下克上は肯定的に受け止められる |
| COMBAT | ×0.7 | 闘争肯定。新たな牙が立っただけ |
| BOND | ×1.0 | 中庸 |
| FACE | ×1.0 | 中庸 |

**C. リーダー順当勝ち（winnerId === leaderId）**
- 派閥 momentum +2〜+5（威信維持）

**D. 非リーダー同士**
- A 共通効果のみ

**E. 下克上フラグ**
- 派閥レコードに `_lastUpset = { winnerId, leaderId, absWeek }` を記録
- v0.4 以降のリーダー交代イベント等のフックに使用

### 3.4.2 実装分割（v0.3 — task-79）

- `Engine.factions.applyCommon1Choice` は choice='A' の場合 `G.bookedCommon1` を作り `booked: true` を返す（trust/rivalry はまだ反映しない）
- `Engine.factions.applyCommon1MatchResult(state, payload, winnerId, loserId, rng)` — 試合結果から trust/rivalry を反映する独立関数（不変）
- `Engine.factions.isBookedCommon1Valid` / `isBookedCommon1Expired` / `sweepBookedCommon1` / `findBookedCommon1CardIndex` / `hasCompetingBooking` — task-79 で追加した予約ヘルパー群
- `App._finalizeShowImpl` 内（F08 ディレクティブ処理の直前）で予約ペアの一致検出・清算・`G._pendingCommon1Result` へのキューイングを行う
- `management.js` の `tickWeek` 週次派閥処理ブロック末尾で `sweepBookedCommon1` を毎週実行（sealed/pending 週でも必ず走る）
- `Engine.validateGameState` に `bookedCommon1` の整合チェック（オブジェクト型/存在しない選手ID参照/season・week 型）を追加
- 旧・即時試合フロー（`App._common1Preview` / `App.common1WatchMatch` / `App.common1SkipMatch` / `App._receiveCommon1BattleResult` / `App._finalizeCommon1Match` / `_renderCommon1MatchPreview`）は呼び出し元を失い未使用（コードは残置、将来の削除候補）

### 3.5 アーキタイプ × 性格マトリクス（リーダーセリフ）

`COMMON1_LINES.leaderDemand[archetype][personality]` で 36 パターン（6 アーキタイプ × 6 性格）。`Engine.contract.getPersonalityType(leader)` で性格を判定し、リーダー本人の口調・語尾・一人称が反映される。

| アーキタイプ | トーン |
|---|---|
| AUTHORITY | リーダーが下位メンバーに「実力で示せ」と試合化を要求 |
| BOND | 仲間内の手合わせ。練習の延長として |
| MERIT | 序列を確認するための公式戦 |
| HEEL | 派閥内でも潰し合いを楽しむ。観客向けにも演出 |
| FACE | 切磋琢磨の象徴的試合 |
| COMBAT | 闘争本能の発露。「強い方に従う」 |

## 4. Common-3：派閥加入の通知

### 4.1 概要

派閥への自動加入が発生した瞬間、**通知モーダル** で覗き見るイベント。プレイヤー選択は不要。

現状、派閥加入は背後で自動処理されているだけで、プレイヤーには通知されない。これを補い、加入キャラと派閥側の一言セリフでドラマ化する。

### 4.2 発動条件

- 派閥成立後、無所属または別派閥のメンバーが特定派閥への加入を希望／加入条件を満たす
- 自動加入処理（既存ロジック）が走った瞬間
- 個別 CD なし（自動加入が発生するたびに発動）

### 4.3 プレイヤー提示

**通知型モーダル（プレイヤー選択なし）**

モーダル内容：
- ヘッダー：「○○派へ加入」
- 加入キャラの立ち絵
- **加入キャラの一言セリフ**（性格別ローテ）
- **派閥リーダー or 既存メンバーの反応セリフ**（アーキタイプ別トーン）
- 「閉じる」ボタンのみ

### 4.4 アーキタイプ別の派閥リアクション

| アーキタイプ | 例 |
|---|---|
| AUTHORITY | 「うちの流儀を覚えてもらう」（リーダー） |
| BOND | 「一緒に頑張ろう」（メンバー全員から歓迎） |
| MERIT | 「実力を見せられるならいい」 |
| HEEL | 「うちの色に染まれるか、見てやる」 |
| FACE | 「ようこそ。うちは王道を貫く」 |
| COMBAT | 「強くなりたきゃうちで殴り合え」 |

### 4.5 セリフテーブル

```js
COMMON3_LINES = {
  newcomerSelf: {
    fiery: [...], composed: [...], grudging: [...], airy: [...], earnest: [...], flippant: [...]
  },
  factionReaction: {
    AUTHORITY: { fiery: [...], composed: [...], ... },
    BOND: { ... },
    MERIT: { ... },
    HEEL: { ... },
    FACE: { ... },
    COMBAT: { ... },
  },
}
```

加入キャラ × 性格 6 種 × ローテ 2 件 = 12 件  
派閥リアクション × アーキタイプ 6 種 × 性格 6 種 × ローテ 1 件 = 36 件  
**合計 48 件** のセリフを `src/data.js` に新規追加。

### 4.6 効果

なし（演出のみ）。加入は既存ロジックで完了している。

## 5. Common-4：派閥合宿・慰労会

### 5.1 概要

オフウィーク中などに、派閥でまとまって練習合宿や慰労会を行うイベント。派閥の日常を覗き見る。

### 5.2 発動条件

- オフウィーク中（興行のない週）
- 派閥の士気が中位以上（ロッカー士気 50 以上）
- 個別 CD 24 週

### 5.3 プレイヤー提示

通知（演出）のみ。プレイヤー選択なし。

### 5.4 アーキタイプ別トーン

| アーキタイプ | 内容 |
|---|---|
| AUTHORITY | リーダー主催の研修合宿（やや厳しい） |
| BOND | 合同合宿、ファミリー旅行的 |
| MERIT | 練習合宿（追い込み中心） |
| HEEL | 派閥だけで集まる秘密会合的雰囲気 |
| FACE | 地方ファンサービス込みの遠征合宿 |
| COMBAT | 他団体道場での対外練習 |

### 5.5 効果

- 派閥メンバー間 bond +1〜+2
- 派閥メンバーの condition +3〜+5
- ロッカー士気 微変動（アーキタイプにより方向違う）
  - AUTHORITY/MERIT/COMBAT：±0
  - BOND/FACE：+1〜+2
  - HEEL：派閥外に -1〜-2

### 5.6 セリフ・演出

短い情景描写ナレーション。3〜4 行程度。アーキタイプ別 × 季節バリエーションで 12〜18 パターン。

## 6. Common-5：派閥代表メディア取材

### 6.1 概要

派閥が一定の評価（momentum 上昇中等）を得たとき、外部メディアから派閥取材の打診が入るイベント。

### 6.2 発動条件

- 派閥成立から 24 週以上経過
- 派閥 momentum ≥30 または所属メンバーに pop ≥75 が 1 名以上
- 個別 CD 32 週

### 6.3 プレイヤー提示

3 択：
- **A：リーダーに任せる** — 派閥色が強く出た記事になる（ハイリスクハイリターン）
- **B：コーチ同席で対応** — 無難な記事に
- **C：取材を断る** — メディア関係に微低下

### 6.4 効果

| 選択 | 効果 |
|---|---|
| A | アーキタイプにより記事内容が分岐（§6.5）。興行集客一時+ or 一時- |
| B | 派閥 momentum +2、メディア露出収益（一時収入 ¥5〜10万） |
| C | 派閥 momentum -2、メディア関係微低下 |

### 6.5 アーキタイプ別 A 結果

| アーキタイプ | 記事の内容 | 効果 |
|---|---|---|
| AUTHORITY | リーダーの威圧的発言が記事に。派閥外との緊張高まる | 興行集客一時+、ロッカー士気 -2 |
| BOND | 派閥全員で和やかに対応、ファミリー的な記事 | メディア露出収益（一時 ¥10万） |
| MERIT | リーダーが選別主義を堂々と語る、賛否両論 | 興行集客一時+、若手 trust -2 |
| HEEL | 挑発的発言で記事炎上気味 | 興行集客大きく一時+、orgPop に微減リスク（一時のみ） |
| FACE | 模範的対応、ファン向け記事 | 興行集客一時+、メディア露出収益（一時 ¥15万） |
| COMBAT | 「次はどこと戦う」と宣戦布告調 | 派閥間 rivalry +、F02 発火確率+ |

**注**：すべて一時的な効果。永続的な orgPop ブースト等は付けない。

### 6.6 セリフ・演出

リーダーセリフ（性格別ローテ）+ 記事見出し風のテキスト演出。アーキタイプ × 性格 × choice の組み合わせで約 30 件。

## 7. Common-7：派閥間の合同企画

### 7.1 概要

敵対していない派閥同士で、合同興行・タッグマッチ・合同合宿などの企画を立てるイベント。

既存の F02（敵対）/F06（和解）/F08（直接対決）はすべて敵対軸。Common-7 は **協力軸** の唯一のイベント。

### 7.2 発動条件

- 敵対していない派閥ペア（hostility < 30 双方向）
- 両派閥のリーダー間 bond ≥40
- 派閥ペア個別 CD 32 週
- アーキタイプの組み合わせフィルタ（§7.5）

### 7.3 プレイヤー提示

3 択：
- **A：合同企画を承認** — タッグマッチ or 合同合宿が組まれる
- **B：距離を保つ** — 関係維持、効果なし
- **C：観察** — 自然展開（成功 or 失敗をランダム判定）

### 7.4 効果

| 選択 | 効果 |
|---|---|
| A | 両派閥 momentum +5〜+8、両派閥のメンバー間 bond +1〜+3、興行集客一時+ |
| B | 関係維持、効果なし |
| C | 50% で派閥 momentum +3、50% で何も起きない |

### 7.5 アーキタイプの組み合わせフィルタ

特定の組み合わせは発動しない（自然な敵対関係）：

| 組み合わせ | 発動可否 |
|---|---|
| HEEL × FACE | 発動しない（敵対関係が前提） |
| AUTHORITY × AUTHORITY | 発動しにくい（リーダー同士の対立） |
| 同アーキタイプ同士（AUTHORITY 除く） | 発動しやすい |
| 異アーキタイプ（HEEL × FACE 除く） | 発動可 |

### 7.6 アーキタイプ別トーン

| 組み合わせ | 企画内容 |
|---|---|
| BOND × BOND | 合同合宿・温泉旅行 |
| MERIT × MERIT | 合同練習会・OVR テスト |
| HEEL × HEEL | タッグマッチで観客挑発 |
| FACE × FACE | チャリティイベント・地域貢献 |
| COMBAT × COMBAT | エキシビションマッチ・道場開放 |
| BOND × FACE | チャリティ興行 |
| MERIT × COMBAT | エキシビションマッチで実力比較 |
| AUTHORITY × COMBAT | 双方リーダー戦 |
| その他 | アーキタイプ別の自然な組み合わせで |

### 7.7 セリフ・演出

両派閥リーダーの相談シーン。性格 × アーキタイプの組み合わせで複数パターン。実装時は主要組み合わせ 10〜15 種を優先。

## 8. Common-6（試合演出フックへ格下げ）

### 8.1 廃止理由

旧 Common-6「派閥内の声援」は独立イベントではなく、**試合エンジンの試合前演出フック** として実装する方が自然。本仕様では独立イベントから外す。

### 8.2 試合演出フックとして

派閥メンバーが大舞台に挑むとき（タイトル戦・PPV メインなど）、試合前の入場演出に派閥メンバーが映り込む／応援セリフが添えられる。

実装は試合演出仕様（`battle-engine-spec-v4.2.md`）の入場フローに追記。

### 8.3 アーキタイプ別演出

| アーキタイプ | 演出 |
|---|---|
| AUTHORITY | リーダーが背中を押す or 威圧的な激励 |
| BOND | 派閥全員が肩を組んで送り出す |
| MERIT | 「結果で示せ」と冷静な激励 |
| HEEL | 「えげつない試合をしてこい」 |
| FACE | 「うちの代表として頑張れ」 |
| COMBAT | 「殴り倒してこい」 |

### 8.4 効果

当事者の試合 condition 微増（+2〜+3、ささやかなブースト）。

## 9. データ構造

### 9.1 FACTION_CONFIG 追加

```js
commonEventTeamCooldown: 6,
commonEventFactionCooldown: 24,
commonEventIndividualCooldowns: {
  COMMON_1: 16,
  COMMON_3: 0,
  COMMON_4: 24,
  COMMON_5: 32,
  COMMON_7: 32,
},
commonEvent5MediaThresholds: {
  momentumMin: 30,
  popMin: 75,
},
commonEvent7HostilityCap: 30,
commonEvent7BondMin: 40,
```

### 9.2 イベント payload

```js
// Common-1
{ type: 'COMMON_1', factionId, fighterAId, fighterBId, currentRivalry }

// Common-3
{ type: 'COMMON_3', factionId, archetypeId, newcomerId }

// Common-4
{ type: 'COMMON_4', factionId, archetypeId, season }

// Common-5
{ type: 'COMMON_5', factionId, archetypeId, leaderId, mediaOutlet }

// Common-7
{ type: 'COMMON_7', factionAId, factionBId, archetypeAId, archetypeBId, leaderAId, leaderBId, planType }
```

### 9.3 派閥側状態

```js
faction._commonEventCooldowns: { COMMON_1: 234, COMMON_4: 220, COMMON_5: 200, COMMON_7: 218 }
state._commonEventTeamCooldownUntil: 234
```

## 10. 実装スコープ（段階）

### Phase A — Common-3（最小スコープ）

加入通知のみ。既存ロジックに通知フックを追加するだけで成立。プレイヤー入力なし。セリフテーブル投入。

**狙い**：「気づいたら加入していた」問題を最初に解消。

### Phase B — Common-1 + Common-4

派閥内対決と合宿。3択モーダル＋通知モーダルの基本骨格。

**Common-4 実装済み（2026-05-01）**：
- `FACTION_CONFIG` に `commonEventTeamCooldown` / `commonEventFactionCooldown` / `commonEventIndividualCooldowns.COMMON_4` / `commonEvent4MoraleMin` を追加
- `data.js` `COMMON4_LINES`：アーキタイプ 6 種 × 各 2 件 + `_any` フォールバック（{ headline, narration, leaderQuote }）
- `factions.js`：`_isCommonTeamCooldownActive` / `_isCommonFactionCooldownActive` / `_isCommonIndividualCooldownActive` / `_markCommonEventTrigger` / `checkCommon4Conditions` / `applyCommon4Result` / `getCommon4Line`
- `pickWeeklyEvent` 末尾に Common-4 抽選を追加（F01〜F08 より低優先）
- `ui-common.js` `showFactionCommon4Modal`：通知のみ・選択肢なし
- `app.js` `handleFactionEvent` に `COMMON_4` 分岐 + `FACTION_AUDIO_MAP.COMMON_4`（SOFT + close chime）

**Common-1 実装済み（簡易版・2026-05-01）**：
- 派閥内2名 rivalry≥40 で 3 択モーダル発火
- A 選択時：spec の「次の興行カードに組む」を簡易化し、即時 OVR ベース勝敗判定で代替（trust/rivalry 効果は spec 通り）。将来 v0.2 で興行カード差し替え機構と連動予定
- `COMMON1_LINES`：アーキタイプ 6 種 × coachReport/leaderDemand/resultLeader/resultLoser

### Phase C — Common-5（実装済み 2026-05-01）

メディア取材 3 択。アーキタイプ別 A 結果は spec §6.5 表に準拠：
- AUTHORITY/MERIT：勢い+4、副作用（士気-2 / 若手 trust-2）
- BOND/FACE：メディア収入（¥8〜18 万）+ 勢い+3〜4
- HEEL：勢い+7（高リターン）+ 団体知名度 -1（炎上）
- COMBAT：勢い+3 + 対外 rivalry 上昇
- B：コーチ同席で無難（収入 ¥5〜10 万 + 勢い+2）
- C：取材辞退（勢い-2）

`COMMON5_LINES`：coachReport / leaderQuoteA（性格 6 × アーキタイプ 6）/ headlineA / resultLeader

### Phase D — Common-7（実装済み 2026-05-01）

派閥間合同企画 3 択。spec §7.2/§7.5 のフィルタを実装：
- HEEL × FACE / AUTHORITY × AUTHORITY は不発
- 双方向 hostility < 30、両リーダー bond ≥40、ペア CD 32 週
- 効果は spec §7.4 通り（A：両派閥勢い+5〜+8 + 全メンバー間 bond+1〜+3）
- ペア CD は `state._commonEvent7PairCooldowns[pair_X_Y] = absWeek` で管理

`COMMON7_LINES`：coachReport / planType マトリクス（10 種）/ leaderAQuote / leaderBQuote / resultLeader

### auto-sim 拡張

`test/auto-sim.js` の `autoHandleFactionEvent` に COMMON_1/4/5/7 分岐を追加。これにより Common 系 `_pendingFactionEvent` が滞留せず、後続 faction event の発火を阻害しない。

### Phase C — Common-5

メディア取材。3択 + アーキタイプ別記事生成。

### Phase D — Common-7

派閥間合同企画。アーキタイプ組み合わせフィルタ + 演出。

## 11. 検証計画

- auto-sim 200 シーズン × 5 シードで以下を計測：
  - Common 全体発動レートが 6 週に 1 回程度に収まること
  - Common-3 の発動回数が加入回数と一致すること
  - Common-7 の組み合わせフィルタが破綻なく動くこと
  - 既存 F01〜F08 と発動が衝突しないこと

## 12. 関連ファイル

- `specs/faction-system-spec-v0.1.md`（既存 F01〜F08）
- `specs/faction-archetype-rework-spec-v0.1.md` v0.2
- `specs/faction-f07-variation-spec-v0.1.md` v0.4
- `specs/personality-archetype-spec-v1.0.md`
- `specs/character-data-spec-v1.7.md`
- `src/factions.js` rollWeeklyEvent / 各 apply 関数（新規）
- `src/ui-common.js` showCommonEventModal 群（新規）
- `src/data.js` COMMON1_LINES / COMMON3_LINES / COMMON4_LINES / COMMON5_LINES / COMMON7_LINES（新規）
- `docs/ui/03-screens/faction-event-result.md`（結果モーダル共通化）

## 13. 未決事項

- Common-7 の「合同興行」を具体的にどう実装するか（既存の興行カード編成機構との接続）
- Common-5 の「メディア露出収益」金額の具体値
- Common-3 のセリフ投入は重要だが量が多い（48 件）。実装時に性格 6 種 × ローテ 2 件で済ませるか、最初は性格 6 種 × 1 件で簡略化するか
- Common-4 の合宿期間中、所属選手の trainCap や condition 計算をどう扱うか
- Common 全体の発動と F07 の発動の優先順位（同週競合時）
