# 派閥内ポイント制 + F-INTERNAL-CHALLENGE 派閥内序列戦 仕様書 v0.2

> **ステータス**: 🟡 v0.2 起案（実装着手前・要レビュー）
> **作成日**: 2026-05-03 / 更新: 2026-05-03 (v0.2)
> **依存仕様**:
> - `specs/faction-system-spec-v0.1.md`（v0.8 / Phase 1〜3d 完了）
> - `specs/faction-archetype-rework-spec-v0.1.md` v0.4（archetype 遷移）
> - `specs/faction-common-events-spec-v0.1.md`（Common-1 派閥内試合）
> - `specs/faction-rivalry-points-spec-v0.1.md`（対称構造の参考）
> **🔧マーク = 調整可能パラメータ**

---

## 0. 改訂履歴

- v0.1（2026-05-03）— 初版起案。Common-1 の `_lastUpset` フラグ未配線（`factions.js:2849` のコメント「v0.2 で交代イベントに連結予定」）を本仕様で蓋する設計
- **v0.2（2026-05-03）** — レビューを受けて以下を改訂:
  - **リーダーをポイント蓄積の枠外に置く**: 「リーダーはドンと構えている」感を出すため、リーダーは試合勝利でポイントを稼がない。試合は基本的に非リーダー同士の「ポイントの奪い合い」
  - **ゼロサム構造に変更**: 勝者+ / 敗者- でポイントを移動（v0.1 の「勝者だけ加算」を改訂）
  - **派閥成立 / リーダー就任からの猶予期間 52週を追加**: 派閥誕生直後に挑戦戦が起きる不自然さを排除
  - **リーダー交代時のポイント割り振り**: v0.1 の「全員ゼロリセット」を改訂し、OVR 順位ベースで序列を反映した値を割り振る

---

## 1. 設計思想

### 1.1 解こうとしている問題

現状、派閥リーダーが交代するのは **F03（リーダー喪失）** のみ — つまり退団・引退・8週以上の長期離脱が起きた場合に限られる。リーダーが団体に在籍し続けている限り、リーダーの座は揺るがない。

しかし `factions.js:2849` には:

```js
// リーダー交代の伏線フラグ（v0.2 で交代イベントに連結予定）
s = this._flagFactionUpset(s, facId, winnerId, leaderId);
```

というコメントが残されており、Common-1 で下克上が起きたときに `_lastUpset` フラグを立てる処理は実装済みだが、**そこから先のリーダー交代演出と実際の `leaderId` 更新が未実装**。これは設計上の未完成箇所。

### 1.2 設計の二原則

1. **数値は嘘をつかない** — リーダー交代も外部抗争（factionRivalryPoints）と同じく、結果の累積で決まる。社長判断で恣意的に動かさない
2. **対外抗争（F09）の対称構造として、対内抗争（F-INTERNAL-CHALLENGE）を置く** — 「外向きの闘いは派閥対抗戦で決着する／内向きの闘いはリーダー戦で決着する」が綺麗に対称化する

### 1.3 設計原則

- ポイントは **試合結果のみがソース**（試合外の数値操作で動かさない、F-RIVALRY-POINTS と同方針）
- **リーダーはポイント蓄積の枠外**: 試合勝利でポイントを稼がない。リーダーは「ドンと構えている」存在であり、下からの突き上げを防ぐ立場
- **試合はゼロサム構造**: 派閥内試合は「ポイントの奪い合い」として、勝者+ / 敗者- で点が移動する
- ポイントの主たるソースは **派閥内試合（Common-1）の非リーダー同士**。派閥外試合は非リーダーの節目勝利のみが微加算
- **archetype による発動可否の差**: BOND は内部序列が archetype 思想と矛盾するため発動しない
- **派閥成立 / リーダー交代から猶予期間**: 直後に挑戦戦が起きるのは不自然なので、52週の猶予を設ける
- **リーダー交代時の割り振り**: 全員ゼロではなく、新派閥序列を OVR 順位で反映する
- **F09 と排他**: F09 は対外抗争のクライマックス。同時発火させない

---

## 2. データモデル

### 2.1 GameState.factionInternalPoints

```
GameState.factionInternalPoints = {
  [factionId]: {
    [fighterId]: number,           // メンバー個人ポイント（初期化規則は §4.4 参照）
    ...
  },
  ...
}
```

- キーは `factionId`（数値）と `fighterId`（数値）の二段ハッシュ
- リーダーも非リーダーも同じ枠組みでエントリを持つ（リーダーは積まれにくいだけ）
- メンバー脱退・離脱・寝返り時はそのエントリを削除

### 2.2 Faction オブジェクト拡張

```js
{
  // 既存フィールド維持（id, name, leaderId, memberIds, ...）
  internalChallengeCooldownUntilWeek: number, // 個別 CD（直近の挑戦戦から24週）
  leaderEnthronedSeason: number,              // 現リーダー就任シーズン（猶予期間判定用）
  leaderEnthronedWeek: number,                // 現リーダー就任週
}
```

### 2.3 GameState 直下フラグ

```js
GameState._pendingInternalChallenge = {
  factionId: number,
  challengerId: number,
  leaderId: number,
  registeredSeason: number,
  registeredWeek: number,
} | null
```

挑戦権が成立した週に登録され、次興行のショウカード編成時に消費される。

### 2.4 マイグレーション

旧セーブには `factionInternalPoints` / `leaderEnthronedSeason` / `leaderEnthronedWeek` が存在しない:

- `G.factionInternalPoints = {}` で初期化
- 既存全派閥の `leaderEnthronedSeason` / `leaderEnthronedWeek` を **派閥の `createdSeason` / `createdWeek` で初期化**（後継継承履歴があってもそこは追わない、現リーダーの就任時期は不明として派閥誕生時とみなす）
- 既存派閥には §4.4 の OVR 順位ベース割り振りで初期ポイントを付与（マイグレーション時の一括処理）
- `_migrated_factions_internal_points_v1` フラグでセーブロード時に1回適用

---

## 3. ポイント計算

### 3.1 派閥内試合（Common-1 の結果）— 主たるソース

Common-1 で試合が組まれた場合（`applyCommon1MatchResult` の末尾フックで処理）:

| 結果 | ポイント変動 |
|---|---|
| 非リーダー同士 | 勝者 **+6pt** 🔧 / 敗者 **-3pt** 🔧 |
| リーダー順当勝ち | リーダー **±0pt** / 非リーダー敗者 **-3pt** 🔧 |
| 下克上（リーダー敗北） | 勝者 **+12pt** 🔧 / リーダー **-8pt** 🔧 |

**設計の含意**:
- リーダーは順当勝ちでもポイントが上がらない（「ドンと構えている」状態の表現）
- リーダーが点を失うのは下克上時のみ
- 非リーダー同士の試合は文字通り「ポイントの奪い合い」（ゼロサム的に+6/-3）
- 下克上時は二重に効く（勝者+12 + リーダー-8 で差は最大20pt動く）

なお、Common-1 の試合相手選定ロジックそのものは本仕様で変更しない（`faction-common-events-spec-v0.1.md` の rivalry 最高ペア選定を維持）。実プレイ上、リーダーは派閥メンバーから bond 集中の対象になる傾向があるため、リーダー絡みの高 rivalry ペアは相対的に少なく、自然と非リーダー同士の試合が多くなることを想定。実装後の auto-sim でリーダー絡み Common-1 の頻度を観測し、必要なら別仕様で Common-1 の選定優先度を調整する。

### 3.2 派閥外試合の節目勝利 — 補助ソース

派閥メンバーが派閥外の試合で勝利した場合、**非リーダーのみ**:

| 条件 | 加算 |
|---|---|
| タイトル戦勝利 | **+3pt** 🔧 |
| 興行のメインカード勝利（タイトル戦兼任時は重複しない） | **+2pt** 🔧 |
| 上記いずれにも該当しない | **+0pt**（加算なし） |

メイン+タイトル戦同時の場合は **+3pt のみ**（高い方を採用、加算しない）。

**リーダーには加算しない**（§1.3 設計原則の一貫性、リーダーは外で活躍してもポイントは増えない）。これは「リーダーの活躍は派閥全体の momentum や trust に反映され、ポイントには反映されない」という棲み分け。

派閥外試合は「日常の練習試合的な勝ち」では動かない。節目だけが内部序列に響く設計。

### 3.3 派閥外抗争試合（F08直接対決・F09派閥対抗戦）

派閥外抗争試合の勝利は §3.2 の通常加算規則を適用（**非リーダーのみ**）。**F09 試合のみは ×1.5 倍** 🔧（外抗争の重みが内部序列に響くべきという設計意図）。

### 3.4 ポイント減衰

ポイントは時間減衰しない（factionRivalryPoints と同方針）。リーダー交代時の割り振り（§4.4）で再構成される。

### 3.5 計算順序

```
finalizeShow 内で、各試合結果ごとに:
1. Common-1 で組まれた試合か？ → §3.1 を適用
2. それ以外の試合で、勝者/敗者が派閥所属か？ → §3.2/§3.3 を適用
3. ポイント差し引きを GameState.factionInternalPoints に反映（下限0でクランプ）
4. 反映後に §4 の挑戦権チェックを実行
```

ポイントは **下限0でクランプ**（マイナスにはならない）。マイナス到達はそれ自体が物語的に意味を持たないため。

---

## 4. 挑戦権発火条件と挑戦戦

### 4.1 発火条件（checkInternalChallengeConditions）

すべて満たすと **挑戦権が成立** する:

1. 派閥が存在する（`status === 'active'`、hiatus は除外）
2. 派閥の archetype が **BOND ではない**（§7.1）
3. 派閥のメンバー数 **≥ 4人** 🔧（リーダー含む）
4. **リーダー就任から 52週経過** 🔧（`leaderEnthronedSeason/Week` から計算）
5. 個別CD `internalChallengeCooldownUntilWeek` を経過
6. リーダーが在籍中（`roster` に存在）
7. 非リーダーメンバーの中で **最高ポイント保持者** のポイントが:
   - リーダーのポイントを **上回り**
   - 差が **≥ 10pt** 🔧（FACE archetype は **≥ 15pt** 🔧）
8. F09 が発火中・進行中でない（`state._pendingF09 == null` かつ進行中の `factionRivalryPoints` ペアエントリで F09 セットアップ済みでない）
9. その派閥に既に `_pendingInternalChallenge` が立っていない

複数の挑戦者候補がいる場合（同点 or 差10pt以上の保持者複数）、ポイント最高位、同点なら OVR 上位を1名選定。

**条件4「リーダー就任から52週」の意味**:
- 派閥誕生直後はリーダー権威が新鮮で、即座の挑戦は不自然
- F03 succession で新リーダーが立った場合も、就任直後は「動揺」期で挑戦が起きる土壌ではない
- 1シーズン（52週）の猶予を置くことで、安定期 → 挑戦期 のリズムが生まれる

### 4.2 挑戦権成立時の処理（registerInternalChallenge）

- `state._pendingInternalChallenge` を立てる
- `factionTimeline` に `INTERNAL_CHALLENGE_REGISTERED` エントリ追加
- 通知モーダルは出さない（次興行のショウカード生成時に演出が走る、§5.1）

### 4.3 挑戦戦のショウカード組込み（F08直接対決と同型）

ショウカード生成時、`_pendingInternalChallenge` がある派閥について:

- showCard slot 0（メイン）に **挑戦者 vs リーダー** のシングル戦を強制注入
- 他の slot に同2名がいた場合は自動除去（F08 と同方針）
- slot に `_internalChallengeLocked: true` をマーク
- slot picker で差し替え不可（トースト「派閥内序列戦は固定です」）
- slot UI に「⚔ 派閥内序列戦（固定）」バッジを表示
- 興行終了時に `_pendingInternalChallenge` を削除

`_spOpenPicker` のロックハンドリング、`finalizeShow` の `_internalChallengeLocked` 検出は F08 の実装パターンを流用。

### 4.4 結果反映と effect

`finalizeShow` で `_internalChallengeLocked` 試合の勝敗が確定した時:

#### リーダー敗北（挑戦者勝利） — 「禅譲」

**派閥構造の更新**:
- 派閥の `leaderId` を挑戦者に更新
- 派閥名を更新（「○○組」のリーダー名差し替え、F03 succession と同型）
- `leaderEnthronedSeason` / `leaderEnthronedWeek` を現在週で更新
- `internalChallengeCooldownUntilWeek = 現在週 + 24週` 🔧 をセット

**ポイント割り振り（OVR 順位ベース）**:

新派閥序列を反映するため、ポイントを以下で割り振る:

| 対象 | ポイント |
|---|---|
| 新リーダー（旧挑戦者） | **0pt** |
| 旧リーダー（敗北者） | **0pt**（敗北のフレッシュな状態） |
| 派閥内 OVR 1位（新旧リーダー除く） | **8pt** 🔧 |
| 派閥内 OVR 2位（新旧リーダー除く） | **5pt** 🔧 |
| 派閥内 OVR 3位（新旧リーダー除く） | **2pt** 🔧 |
| OVR 4位以下（新旧リーダー除く） | **0pt** |

これにより:
- 派閥内に「次の挑戦者候補」の序列が即座に存在する状態が作られる
- 即時挑戦圏内（差10pt以上）には入らない値域（最大8pt vs 0pt の差）
- CD 24週 + リーダー就任から52週の二重ガードで、最低でも 52週は次の挑戦戦が起きない

**effect テーブル**:

| 対象 | 変動量 🔧 |
|---|---|
| 旧リーダー trust | -5〜-8 |
| 旧リーダー → 新リーダー rivalry | +15〜+20 |
| 新リーダー trust | +5〜+8 |
| 新リーダー 人気 | +3〜+5 |
| 派閥 momentum | +5〜+10（新リーダー就任のフレッシュさ） |
| 派閥メンバー全員 → 新リーダー bond | +2〜+3 |

#### リーダー勝利 — 「権威の確認」

**派閥構造の更新**:
- リーダー継続
- `internalChallengeCooldownUntilWeek = 現在週 + 24週` 🔧 をセット
- `leaderEnthronedSeason` / `leaderEnthronedWeek` は **更新しない**（現リーダーの就任時期は変わらないため）

**ポイント割り振り**:

リーダー敗北時と同じ規則で **OVR 順位ベース割り振り**:

| 対象 | ポイント |
|---|---|
| リーダー（勝者） | **0pt** |
| 敗北した挑戦者 | **0pt** |
| 派閥内 OVR 1位（リーダー・挑戦者除く） | **8pt** 🔧 |
| 派閥内 OVR 2位（リーダー・挑戦者除く） | **5pt** 🔧 |
| 派閥内 OVR 3位（リーダー・挑戦者除く） | **2pt** 🔧 |
| OVR 4位以下（リーダー・挑戦者除く） | **0pt** |

「権威の確認」が起きても派閥序列は更新される — 挑戦者は2位陥落、他のメンバーが新たに突き上げ候補として浮上する、という構造。

**effect テーブル**:

| 対象 | 変動量 🔧 |
|---|---|
| リーダー trust | +3〜+5 |
| リーダー 人気 | +2〜+3 |
| 派閥 momentum | +10〜+15 |
| 挑戦者 trust | -3〜-5 |
| 挑戦者 → リーダー rivalry | -10〜-15（決着済みとして沈静化） |
| AUTHORITY archetype の場合: 派閥メンバー全員 → リーダー bond | +2〜+3 |

#### 引き分けの扱い

引き分けは出ないようにする。F08 と同様の処理（試合エンジン側で勝敗確定まで延長）。

### 4.5 archetype 遷移トリガー

リーダー敗北時、派閥の archetype が **AUTHORITY** だった場合:

- §6 archetype 遷移ロジック（faction-archetype-rework-spec-v0.1.md §6 統合）に従う
- 後継幹部（=新リーダー）の性格判定:
  - fiery / grudging / bold / emotional 多数 → **MERIT** に遷移
  - それ以外 → **BOND** に遷移
- `_applyArchetypeTransition(state, factionId, toArchetype, ctx)` を呼び、ナレーション付きで遷移

これは「権威が実力で覆された瞬間に権威ではなくなる」という archetype 思想の自然な帰結。

---

## 5. UI / 演出

### 5.1 挑戦戦試合前モーダル（internal-challenge-pre-match）

F08-A の `f08-pre-match` を流用ベースにし、配色のみ「派閥内対立」用に差し替え:

- レイアウト: `fevt-overlay-arena` + `fevt-arena-card internal-challenge-pre`（新規CSS）
- 配色: 紫〜深青グラデ（外抗争のダーク赤との差別化）
- 構成:
  1. ナレーション: 「○○組――派閥内の力学が今夜、リング上で決着する」
  2. 両者の肖像 + 派閥内ポジション + OVR 並列表示
  3. 挑戦者の宣戦セリフ（性格×アーキタイプ分岐）
  4. リーダーの応答セリフ（性格×アーキタイプ分岐）
  5. 「試合へ進む →」ボタン
- BGM: `bgm_tension_v1.mp3` ループ（TENSION_BED × 0.18）
- Stinger: `f07_gong_v1.mp3` 1打

### 5.2 挑戦戦試合後モーダル（internal-challenge-post-match）

- レイアウト: `fevt-overlay-arena` + `fevt-arena-card internal-challenge-post`
- リーダー敗北時:
  1. ナレーション: 「決着。新たな○○組リーダーが立った」
  2. 新リーダー肖像（中央大）+ セリフ
  3. 旧リーダー肖像(小・暗転気味)+ セリフ（HP残量で出し分け、F08 と同方針）
  4. 派閥名の改称表記（旧 → 新）
  5. AUTHORITY 遷移時は archetype 遷移ナレーション併記
- リーダー勝利時:
  1. ナレーション: 「○○組のリーダーは座を守った」
  2. リーダー肖像 + 勝利セリフ
  3. 挑戦者肖像 + 敗北セリフ

### 5.3 セリフテーブル

`src/data-faction-dialogue.js` に追加:

- `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES` — 性格×アーキタイプ
- `INTERNAL_CHALLENGE_PRE_LEADER_LINES` — 性格×アーキタイプ
- `INTERNAL_CHALLENGE_POST_WINNER_LINES` — 性格×アーキタイプ
- `INTERNAL_CHALLENGE_POST_LOSER_LINES` — 性格×アーキタイプ × HP帯（hp_high / hp_mid / hp_low）

normal フォールバック規則は既存セリフテーブルと同じ。

### 5.4 派閥詳細画面の表示

`ui-render.js` の派閥タブに:

- 各メンバーの内部ポイントをポートレート横に小さく表示（数値）
- 挑戦権成立時はリーダーと挑戦者を「⚔」アイコンで結ぶ視覚的指標
- リーダー就任からの経過週を「○○組（リーダー就任から N 週）」表記（年代記的な味付け、52週未満は「就任○週目」、52週以上は表記なし）

ポイント数値表示は外抗争（factionRivalryPoints）と同じ方針 — 「進行度」として見せる、最適化対象には見せない。

### 5.5 試合前プレビューのバッジ

`renderShowPrep` のカードタグに「⚔ 派閥内序列戦」バッジを追加（`_internalChallengeLocked === true` の試合のみ）。

---

## 6. 既存システムとの相互作用

### 6.1 Common-1 との関係（二層構造）

- Common-1 は引き続き「派閥内試合の入口」として機能（変更なし）
- Common-1 で組まれた試合の結果が `applyCommon1MatchResult` の末尾で §3.1 に従ってポイントに反映
- Common-1 単独では `_lastUpset` フラグを立てる挙動は維持（後方互換）。ただし `_lastUpset` を直接参照する箇所は本仕様で減らない（独立したフックとして残置）

**Common-1 の選定優先度**: 本仕様では Common-1 のペア選定ロジック（rivalry 最高ペア）は変更しない。実プレイ上、リーダーは派閥メンバーから bond 集中の対象になる傾向があるため、リーダー絡みの高 rivalry ペアは相対的に少なく、自然と非リーダー同士の試合が多くなることを想定。実装後の auto-sim で「Common-1 内のリーダー絡み試合の比率」を観測し、明らかにリーダーが過多に出る場合は、別途 `faction-common-events-spec-v0.1.md` の改訂で対処する。

### 6.2 F03（リーダー喪失）との関係

- F03 で **通常継承（succession）/ 動揺継承（turmoil）** が起きた場合 → §4.4「リーダー敗北時」と同じ規則で OVR 順位ベース割り振り、`leaderEnthronedSeason/Week` を更新、`internalChallengeCooldownUntilWeek = 現在週 + 24週` をセット
- F03 で **解散（dissolution）** が起きた場合 → factionInternalPoints[factionId] エントリを削除

### 6.3 F09（派閥対抗戦）との排他制御

- F09 セットアップ中（`_pendingF09 != null` または進行中の F09 ペアエントリあり）→ 内部挑戦戦の発火条件チェックをスキップ
- 内部挑戦戦が `_pendingInternalChallenge` で予約済みの派閥は F09 候補から除外
- これにより同興行で F09 ロック試合と内部挑戦戦ロック試合が混在することを防ぐ

### 6.4 F04（寝返り）との関係

- 挑戦者が F04 で敵対派閥に寝返った場合 → `_pendingInternalChallenge` をクリア、internalPoints から該当 fighterId のエントリを削除
- リーダーが F04 で寝返るケースは現状の F04 設計上発生しない（リーダーは寝返り対象から除外されている）が、念のため `_pendingInternalChallenge` クリアは実装側でガード

### 6.5 F05（派閥内亀裂・分裂）との関係

- F05 分裂で新派閥が誕生した場合:
  - 旧派閥の internalPoints を新旧派閥のメンバー所属で分割（メンバーごとのポイントは保持、派閥所属だけ移す）
  - 新派閥の `leaderEnthronedSeason/Week` は F05 発動週で初期化（§4.1 の52週猶予が新派閥に適用される）
  - 新派閥の `internalChallengeCooldownUntilWeek` も同じ週で初期化（つまり24週は新派閥に挑戦戦は来ない）
  - 旧派閥側もメンバー構成が変わったため、§4.4 の OVR 順位ベース割り振りで再構成（「分裂後の新序列」を反映）

### 6.6 archetype 遷移との関係

- §4.5 で AUTHORITY → MERIT/BOND 遷移を組み込み済み
- それ以外の archetype 遷移（FACE⇄HEEL ドリフトなど）は本仕様で触らない
- archetype が **BOND に遷移した場合** → factionInternalPoints[factionId] エントリを削除（BOND は内部ポイント蓄積を行わないため）
- archetype が **BOND から遷移した場合** → §4.4 の OVR 順位ベース割り振りで初期化

---

## 7. archetype 別挙動

### 7.1 BOND — 完全に発動しない

- internalPoints の蓄積を行わない（`finalizeShow` のフックでスキップ）
- 挑戦権チェック対象外
- 派閥詳細画面でもポイント表示しない

理由: BOND は「メンバー間の横の絆、家族的・内向き、内部対立が起きにくい」が archetype 思想（faction-archetype-rework-spec-v0.1.md §2.1 ②）。序列戦という概念自体が archetype に反する。

### 7.2 MERIT / COMBAT / HEEL — 完全に発動

archetype 思想と完全に一致するため、デフォルトの挙動。

- MERIT: 「実力主義」そのもの。挑戦戦は archetype の本懐
- COMBAT: 「強い者が前に出る」闘争志向
- HEEL: 「弱肉強食」

### 7.3 FACE — 発動するが頻度抑制

- §3 のポイント加算は通常通り
- 挑戦権発火条件 §4.1 の閾値を **差 ≥ 15pt** 🔧 にエスカレート（デフォルト10ptより厳しめ）
- 「王道団体は内部争いをむやみに表に出さない」というフレーバー

### 7.4 AUTHORITY — 発動する、敗北時に archetype 遷移

- §3 のポイント加算は通常通り
- 挑戦権発火条件はデフォルト
- §4.5 でリーダー敗北時に MERIT or BOND へ archetype 遷移

---

## 8. FACTION_CONFIG 追加項目

```js
// §3 ポイント計算（v0.2 改訂）
internalPointsCommon1NonLeaderWinner: 6,  // Common-1 非リーダー同士 勝者
internalPointsCommon1NonLeaderLoser: -3,  // Common-1 非リーダー同士 敗者
internalPointsCommon1LeaderHoldsLoss: -3, // Common-1 リーダー順当勝ち時の敗者減点
internalPointsCommon1UpsetWinner: 12,     // Common-1 下克上 勝者
internalPointsCommon1UpsetLoserPenalty: -8, // Common-1 下克上 リーダー減点
internalPointsExternalTitleWin: 3,        // 派閥外タイトル戦勝利（非リーダーのみ）
internalPointsExternalMainWin: 2,         // 派閥外メイン勝利（非リーダーのみ、タイトル戦と重複しない）
internalPointsF09Multiplier: 1.5,         // F09 試合は ×1.5

// §4 挑戦権発火条件（v0.2 改訂）
internalChallengeMinFactionSize: 4,       // メンバー4人以上
internalChallengeGraceWeeksAfterEnthronement: 52, // リーダー就任から52週猶予
internalChallengeThresholdGap: 10,        // ポイント差 ≥ 10pt
internalChallengeThresholdGapFace: 15,    // FACE archetype は 15pt
internalChallengeCooldownWeeks: 24,       // 個別 CD 24週

// §4.4 リーダー交代/防衛時のポイント割り振り（v0.2 新規）
internalPointsAllocationByOvrRank: [8, 5, 2, 0],
// インデックス0 → OVR 1位、インデックス1 → OVR 2位、...
// 配列長を超えるOVR順位は最後の値（0pt）が適用される

// §4.4 結果効果（既存）
internalChallengeWinnerTrustGain: { min: 5, max: 8 },
internalChallengeWinnerPopGain: { min: 3, max: 5 },
internalChallengeLoserTrustHit: { min: -8, max: -5 },
internalChallengeMomentumOnUpset: { min: 5, max: 10 },
internalChallengeMomentumOnHold: { min: 10, max: 15 },
// ...（他の数値は §4.4 表を参照、実装時に config 化）
```

---

## 9. 実装ファイル

| ファイル | 変更内容 |
|---|---|
| `src/factions.js` | `accrueInternalPointsFromCommon1` / `accrueInternalPointsFromExternalMatch` / `checkInternalChallengeConditions` / `registerInternalChallenge` / `applyInternalChallengeResult` / `_allocateInternalPointsByOvrRank`（OVR順位ベース割り振り）追加。`applyCommon1MatchResult` 末尾にフック追加。F03 succession/turmoil 経路で割り振り処理呼び出し。`reconcileRoster` で internalPoints 整合性チェック追加 |
| `src/management.js` | `tickWeek` 派閥パイプラインに挑戦権チェック組込み（F09 後・Common 系の前）。`finalizeShow` でポイント蓄積と試合後効果実行。ショウカード生成時の `_pendingInternalChallenge` 強制注入フック追加 |
| `src/data.js` | `FACTION_CONFIG` に §8 の項目追加 |
| `src/ui-render.js` | 派閥詳細画面にポイント表示・挑戦権バッジ・「リーダー就任から N 週」表記追加。`renderShowPrep` に「⚔ 派閥内序列戦」バッジ追加 |
| `src/ui-common.js` | `showInternalChallengePreModal` / `showInternalChallengePostModal` 新設 |
| `src/index.html` | `--accent-internal-challenge-bg-from` / `--accent-internal-challenge-bg-to` トークン追加、internal-challenge 用 CSS 新設 |
| `src/data-faction-dialogue.js` | `INTERNAL_CHALLENGE_*_LINES` セリフテーブル追加（性格×アーキタイプ） |
| `src/app.js` | マイグレーション `_migrated_factions_internal_points_v1` 追加（既存派閥に OVR 順位ベース初期割り振り） |

---

## 10. やらないこと

- ❌ ガントレット形式（リーダーが3〜5試合連戦）— 案αで F08 と構造を揃える
- ❌ 試合外イベントでのポイント変動（ポイント源は試合結果のみ、F-RIVALRY-POINTS と同方針）
- ❌ プレイヤーが挑戦戦カードを差し替える（完全ロック）
- ❌ ポイント時間減衰（再構成はリーダー交代/防衛時のOVR順位割り振りのみ）
- ❌ BOND archetype での発動
- ❌ 内部ポイントを集客に反映する（外抗争と違い、内部抗争は集客効果を持たせない — 「身内の話」フレーバー）
- ❌ MQ ボーナス（ユーザールール）
- ❌ リーダーへの試合勝利ポイント加算（v0.2 改訂で削除）
- ❌ 全員ゼロリセット（v0.2 改訂で OVR 順位ベース割り振りに変更）
- ❌ 派閥成立 / リーダー就任直後の挑戦戦発火（52週猶予で抑制）

---

## 11. 検証計画

### 11.1 自動テスト

- auto-sim 200 シーズン × 5 シードで以下を計測:
  - 内部挑戦戦の発火頻度（archetype 別、団体規模別）
  - リーダー敗北率（特に AUTHORITY と MERIT の差）
  - archetype 遷移発生率（AUTHORITY → MERIT/BOND の経路頻度）
  - F09 との同時発火がゼロであること（排他制御の検証）
  - F05 分裂時のポイント分割が正しく動くこと
  - **52週猶予が機能していること**（派閥誕生から52週以内に挑戦戦が起きないこと）
  - **OVR 順位ベース割り振りが正しく動くこと**（リーダー交代後の派閥内ポイント分布が 8/5/2/0 の値域に収まること）

### 11.2 期待値

- **発火頻度**:
  - AUTHORITY 派閥: 3〜5シーズンに1回程度
  - MERIT/COMBAT/HEEL 派閥: 2〜3シーズンに1回程度
  - FACE 派閥: 3〜4シーズンに1回程度
- **AUTHORITY → MERIT/BOND 遷移率**: AUTHORITY 派閥の生涯で 30〜50% 程度
- **リーダー勝率**: 60〜70% 程度
- **派閥成立から最初の挑戦戦までの平均週数**: 80〜130週程度（52週猶予 + ポイント蓄積期間）

### 11.3 実プレイ検証

- 13年目セーブで AUTHORITY 派閥の挑戦戦を観察
- セリフバリエーションの自然さを目視確認
- ポイント表示が「最適化対象」と「進行度」の境界を保てているか感覚チェック
- リーダー勝利時の OVR 順位ベース再割り振りで「2位以下が突き上げ候補に浮上した感」が出ているか確認

---

## 12. 確認してほしいポイント（Keisuke レビュー）

### v0.2 で新規に判断が必要な項目

1. **猶予期間 52週 が適切か**
   - 派閥誕生から最初の挑戦戦まで、52週（1シーズン）の猶予を置く
   - 短くする選択肢: 26週（半年）— 派閥のドラマがより速く転がる
   - 長くする選択肢: 78週（1.5シーズン）— より「派閥が成熟してから」感が強まる
   - 現状の52週は「1シーズン経った安定期」という直感的な切れ目

2. **OVR 順位ベース割り振りの数値（8/5/2/0pt）が適切か**
   - 1位8pt → 挑戦圏内（差10pt以上）には入らない
   - リーダー勝利時の再割り振りで、新2位が次の挑戦候補として浮上する数値関係
   - もっと開く（例: 12/7/3/0）/ もっと寄せる（例: 5/3/1/0）の選択肢あり

3. **派閥外試合のポイント加算をリーダーに対しても 0 にする判断**
   - 一貫性（リーダーは試合勝利でポイントを稼がない）vs フレーバー（外で活躍する派閥リーダーがちゃんと評価される）のトレードオフ
   - 一貫性を優先したのが現状の v0.2

### v0.1 から維持されている既存判断（変更不要なら無視可）

4. **Common-1 ポイント基本値** 非リーダー同士+6/-3 / 下克上+12/-8 のバランス
5. **派閥外節目勝利** タイトル+3/メイン+2 が日常勝利との差別化として適切か
6. **F09 試合 ×1.5 倍率** が外抗争の重みを内部に響かせる装置として適切か
7. **AUTHORITY 敗北時の archetype 遷移条件**（後継性格による分岐）の自然さ
8. **BOND 完全除外** で良いか
9. **FACE の閾値エスカレート（15pt）** が「王道は内部争いを抑える」フレーバーとして効くか
10. **ポイント数値の派閥詳細画面表示** がプレイヤーに「最適化対象」として誤認されないか

---

**変更履歴**

| 版 | 日付 | 内容 |
|---|---|---|
| v0.1 | 2026-05-03 | 初版起案。Common-1 `_lastUpset` 未配線箇所への接続として設計。F-RIVALRY-POINTS の対称構造、Common-1 二層統合、案α（F08同型）、AUTHORITY 敗北時 archetype 遷移、BOND 完全除外、FACE 閾値エスカレート、F09 排他制御、リーダー交代時全員リセット を v0.1 確定 |
| v0.2 | 2026-05-03 | レビュー反映。リーダーをポイント蓄積枠外に（「ドンと構えている」感）、ゼロサム構造に変更（勝者+/敗者-）、派閥成立/リーダー就任から52週猶予を追加、リーダー交代時のリセットを OVR 順位ベース割り振り（8/5/2/0pt）に変更、Common-1 のペア選定は変更せず実装後の観測ベースで判断 |
