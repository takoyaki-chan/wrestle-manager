# ドーム到達マイルストーン実装指示書

> **対象**: Claude Code
> **所要時間目安**: 4〜6時間
> **承認状態**: 設計合意済み（`specs/dome-milestone-spec-v0.3.md`）
> **前提**: `feature/dome-milestone` ブランチを main から切って作業
> **モデル選定**: Opus 推奨（新規関数追加 + 既存フレームワーク拡張 + ダイアログ組み込みの複合タスク）

---

## このタスクの目的

「ドーム会場での初興行」と「ドーム会場での初満員興行」をそれぞれ **全画面セレモニー演出イベント**（D層）として発火させる。選択肢・報酬バフはなく、団体の到達を社長と選手たちで噛みしめる純粋な演出。

既存のA層マイルストーン（旗揚げ興行・初因縁など）とは **別カテゴリの新機構** として実装する。

---

## 実装するもの

1. **新イベント2件** `first_dome_show` / `first_dome_sellout` を `MILESTONE_EVENTS` に追加
2. **興行前マイルストーンフック** `_checkAndShowPreShowMilestone` を新規実装
3. **`_checkMilestones` 拡張** で新トリガータイプ `venue_occupancy` に対応
4. **新規汎用関数** `showCeremonyEvent(evt, speakers, onContinue)`（D層共通基盤）
5. **主力選手選出ヘルパー** `_resolveSpotlightFighters(G)`
6. **ダイアログ解決ヘルパー** `resolveDomeLine(fighter, dialogueKey)`
7. **ダイアログ辞書** `DOME_FIRSTSHOW_LINES` / `DOME_SELLOUT_LINES`（294行、既に執筆済み）
8. **CSS** `cerem-*` クラス群（Mockup v0.6 相当）
9. **BGM切替ロジック** 興行前 `bgm_kaimaku_v1.mp3` / 興行後 `8bit-ending-theme_Loop.ogg`
10. **`achievement-system-spec.md` 更新** D層カテゴリ追加

**実装しないもの**:
- A層マイルストーンフレームワークの構造変更（既存の `first_show` などはそのまま）
- 新規バフ型（D層に報酬バフなし）
- 派閥モーダルなど既存セレモニー系の置換

---

## 事前に必ず読むべきドキュメント

この順序で読むこと：

1. `CLAUDE.md` — アーキテクチャ原則・開発ルール
2. `specs/dome-milestone-spec-v0.3.md` — 今回の仕様（最重要）
3. `docs/ui/mockups/mockup-dome-milestone-v0.6.html` — 確定UIのソース（CSS・JS構造・アニメーションタイミング参照）
4. `specs/venue-attendance-spec-v2.0.md` — `occupancyRate` 計算の元、会場 VENUES[9] = ドーム
5. `specs/personality-archetype-spec-v1.0.md` — personality/archetype の正式定義
6. 既存の派閥イベントモーダル実装（`src/ui-common.js` 内 `fevt-*` 関連）— DOM構造とBGM制御の参考

---

## 既存コードの影響範囲

### 変更するファイル

| ファイル | 変更内容 |
|---|---|
| `src/data.js` | `MILESTONE_EVENTS` に2エントリ追加 / `DOME_FIRSTSHOW_LINES` / `DOME_SELLOUT_LINES` 定数追加 / exports 拡張 |
| `src/app.js` | `_checkMilestones` 拡張 / `_checkAndShowPreShowMilestone` 新規 / `_resolveSpotlightFighters` 新規 / `resolveDomeLine` 新規 / `showCeremonyEvent` 新規 / `showExec` 遷移直前へのフック挿入 |
| `src/index.html` | `cerem-*` CSS 追加（既存 Ceremony 系 CSS の近く） |
| `specs/achievement-system-spec.md` | B層から `dome_show`/`sellout_dome` 削除、D層カテゴリ追加 |

### 触ってはいけない既存コード

- 既存の `MILESTONE_EVENTS` エントリ（`first_show`、`orgpop_20`、`first_rivalry`）
- 既存の `_checkMilestones()` の他の `case` 分岐
- 既存の `showMilestoneEvent`（A層用・今回は新規 `showCeremonyEvent` を作成）
- 派閥モーダルの `fevt-*` CSS クラスと JS 関数
- BGM管理の既存 `Audio.fileBgm` API 呼び出しパターン

---

## 実装手順

### ステップ1 ・ ダイアログ辞書の組み込み

執筆済みの辞書ファイル（別途提供される `dome-milestone-dialogues-v0.1.js`）から `DOME_FIRSTSHOW_LINES` / `DOME_SELLOUT_LINES` を抽出し、`src/data.js` の以下の位置に追加する：

**配置位置**: `NOTIF_DIALOGUES` 定数定義の直後

```javascript
// 既存:
const NOTIF_DIALOGUES = { ... };

// 追加:
const DOME_FIRSTSHOW_LINES = { ... };  // 147行
const DOME_SELLOUT_LINES = { ... };    // 147行
```

**exports 拡張**: ファイル末尾の `module.exports` 部分に2つの定数名を追加

### ステップ2 ・ MILESTONE_EVENTS エントリ追加

`src/data.js` の `MILESTONE_EVENTS` 配列に以下2エントリを追加（配列末尾に追加）。既存エントリと異なり `choices: []`、新フィールド `trigger.timing` / `dialogueKey` / `continueLabel` / `titleMain` / `titleSub` / `visualVariant` / `narration` / `narrationGaps` を持つ。

仕様書 §2.3 のコード例をそのまま貼り付けて構わない。`choices: []` を明示して空配列にすること（既存フレームワークとの互換のため）。

### ステップ3 ・ `_checkMilestones` に `venue_occupancy` トリガー追加

`src/app.js` の `_checkMilestones()` 関数内の `switch (evt.trigger.type)` に新ケースを追加：

```javascript
case 'venue_occupancy': {
  // preShow タイミングのエントリは post-show チェックではスキップ
  if (evt.trigger.timing === 'preShow') break;
  const t = evt.trigger;
  const cap = VENUES[t.venueIdx]?.cap;
  const occ = cap ? (G.lastShowAttendance || 0) / cap : 0;
  triggered = (G.showVenue === t.venueIdx) && (occ >= t.minOccupancy);
  break;
}
```

また既存の `case 'venue'` にも `timing === 'preShow'` のスキップ処理を追加（preShow は別フックで処理するため post-show チェックには含めない）。

### ステップ4 ・ `_checkAndShowPreShowMilestone` 新規実装

`src/app.js` の `_checkAndShowMilestone` の直後に新規関数を追加。構造は既存とほぼ同じだが、`trigger.timing === 'preShow'` のエントリのみを対象にし、`showCeremonyEvent` を呼ぶ。

```javascript
_checkAndShowPreShowMilestone(onDone) {
  const ms = G.milestones || {};
  for (const evt of MILESTONE_EVENTS) {
    if (evt.trigger.timing !== 'preShow') continue;
    if (ms[evt.id]) continue;
    // トリガー判定
    let triggered = false;
    switch (evt.trigger.type) {
      case 'venue':
        triggered = G.showVenue === evt.trigger.venueIdx;
        break;
      // 他のpreShowトリガーが増えたらここに追加
    }
    if (!triggered) continue;

    // 発火：選手選出 → セレモニー表示
    const speakers = App._resolveSpotlightFighters(G);
    G = { ...G, milestones: { ...G.milestones, [evt.id]: true } };
    App.showCeremonyEvent(evt, speakers, onDone);
    return;
  }
  onDone(); // 該当なしなら即continue
}
```

### ステップ5 ・ `showExec` 遷移直前のフック挿入

`src/app.js` 付近 4691 行（`weekPhase: 'showExec'` へ遷移する箇所）の直前に `_checkAndShowPreShowMilestone` を挟む：

```javascript
// 改修前:
let s = { ...G, totalShows: G.totalShows + 1, weekPhase: 'showExec' };
(以下既存)

// 改修後:
App._checkAndShowPreShowMilestone(() => {
  let s = { ...G, totalShows: G.totalShows + 1, weekPhase: 'showExec' };
  (以下既存ロジックをこのコールバック内に移動)
});
```

**重要**: `_checkAndShowPreShowMilestone` が発火しなかった場合でも即 onDone が呼ばれるため、既存フローは壊れない。既存の `showPrep → showExec` 遷移が複数パスで発生していないか必ず確認すること（grep で `weekPhase.*showExec` を検索）。

### ステップ6 ・ 主力選手選出ヘルパー

`src/app.js` に `_resolveSpotlightFighters` を追加（仕様書 §3.4 のコードをそのまま使用）。

**実装上の注意**:
- `G.fighters.find` で存在確認、見つからない場合は `{fighter: null, roleLabel: '...'}` ではなく、そもそも配列から除外
- ベテラン代表の `.filter()` 条件に注意：`retired` と `contractOrg !== G.orgName` は除外

### ステップ7 ・ ダイアログ解決ヘルパー

`src/app.js` に `resolveDomeLine` を追加（仕様書 §5.3）。RNG シードは `Engine.rng.derive(G.rngSeed, G.season, G.week, 0xD03E, fighter.id)` で決定論化すること。

### ステップ8 ・ `showCeremonyEvent` 本体実装

`src/ui-common.js` または `src/app.js` に新規実装。Mockup v0.6 の HTML/CSS/JS 構造をほぼそのまま移植。主な差分：

- **DOM は JavaScript で動的生成**（Mockupは静的HTML）
- **ポートレート画像**: `_factionUpperUrl(fighter.id)` 相当のパス生成（画像未存在時はシルエットプレースホルダ）
- **BGM制御**: `Audio.fileBgm.play(bgmPath, { loop: true, volume: 0.10 })` で開始、モーダル閉じ時に `fadeOut(1500)`
- **BGMパス**: data.js の `MILESTONE_EVENTS` エントリに `bgm` フィールドを追加して指定するか、または `visualVariant` から決定する（`arrival → bgm_kaimaku_v1.mp3`、`triumph → 8bit-ending-theme_Loop.ogg`）

**クリック進行ロジック**は Mockup の `SceneController` クラスを参考。ナレーション蓄積式 + Phase遷移（1.1秒フェードアウト → 1.0秒フェードイン）+ 選手順次出現 + 続けるボタン自動フェードインの流れを再現。

**モーダル閉じた後の処理**:
- `onContinue` コールバックを呼ぶ
- BGM を `fadeOut(1500)` で消す（次のフローのBGMが上書きで開始する想定）
- DOM 要素を削除

### ステップ9 ・ CSS 追加

`src/index.html` の既存 `speech-bubble` や `opening-act-line` 系 CSS の近く（Ceremony系 CSS 群）に `cerem-*` クラス群を追加。Mockup v0.6 の CSS をほぼそのまま移植可能。ただし：

- Mockup固有の nav/audio-toggle/audio-hint 系 CSS は**除外**
- `.cerem-overlay` の z-index は既存のモーダル系（派閥モーダル等）より上に設定
- CSS変数は既存のトークン（`--font-ceremony`、`--office-panel-cream-card`）を活用

### ステップ10 ・ achievement-system-spec.md 更新

`specs/achievement-system-spec.md` を以下のとおり更新：

1. B層（通知のみ）テーブルから `dome_show` / `sellout_dome` の行を削除
2. 新規「D層：演出イベント」カテゴリセクションを追加（仕様書 §8.1 をコピー）
3. D層リストに `first_dome_show` / `first_dome_sellout` を追加

### ステップ11 ・ 動作確認（手動テスト）

以下5シナリオで挙動確認：

| シナリオ | 期待挙動 |
|---|---|
| 初ドーム興行・不入り（<95%） | 興行前のみ `first_dome_show` 発火 |
| 初ドーム興行・超満員 | 興行前 `first_dome_show` → 興行実行 → 興行後 `first_dome_sellout` の順で連続発火 |
| 2回目ドーム興行・初の超満員 | 興行前は何も起きず、興行後のみ `first_dome_sellout` 発火 |
| 3回目ドーム興行・超満員（過去達成済み） | 何も起きない |
| メイン2名がpop上位だった場合 | ベテラン代表はロスターpop3位選手が選出される |

動作確認にはデバッグコマンド（`debugCheat` など）で G.week や occupancyRate を強制設定すると効率的。

---

## 実装における注意点

### 注意1 ・ pre-show マイルストーンは新機構

既存の `_checkAndShowMilestone` は post-show 専用。新規追加する `_checkAndShowPreShowMilestone` は **trigger.timing === 'preShow'** のエントリのみを対象にすること。両者のフラグ格納先は同じ `G.milestones` を共用する。

### 注意2 ・ BGMは既存のfileBgm APIを使用

独自のBGM制御を書かず、`Audio.fileBgm.play(path, {loop, volume})` と `Audio.fileBgm.fadeOut(ms)` を使うこと。既存の派閥モーダル `_factionAudioOpen` / `_factionAudioClose` をほぼそのまま流用できる。

### 注意3 ・ 決定論性の保持

`resolveDomeLine` でのセリフ選出は **必ず決定論的に**（RNGシード由来）。`Math.random()` を直接使うとセーブ&ロード時に異なるセリフになってしまう。

### 注意4 ・ onContinueコールバックの確実な実行

`showCeremonyEvent` は必ず `onContinue` を呼んで次のフローに戻す。特に興行前フックで発火した場合、`onContinue` が呼ばれないと `showExec` に遷移せず興行が始まらなくなる。DOMクリック→フェードアウト→コールバック→DOM削除 の順で確実に。

### 注意5 ・ 選手画像パスの互換性

`image/upper/{id}.webp` のパスは既存の派閥モーダル等で使われている規則と揃える。`_factionUpperUrl` に相当する関数を探して、同じ方法で生成すること（画像未存在時の `onerror` フォールバックも含む）。

### 注意6 ・ CSSの z-index

`cerem-overlay` は既存のモーダル群より上に表示される必要がある。派閥モーダル、社長室モーダル、careOverlay などの z-index 値を確認して、それより大きい値を設定すること。

### 注意7 ・ `Engine.rng.derive` のシグネチャ

`Engine.rng.derive(seed, ...args)` は可変長引数。`0xD03E` というマジック値は本ドーム機能の識別用（DOME の数字風綴り）として使用。他の derive 使用箇所と競合しないか grep で確認することが望ましいが、4バイトのうちユニーク領域を使っているので基本的に問題なし。

---

## コミット戦略

ブランチ `feature/dome-milestone` で以下の順にコミット推奨：

1. `feat(dome): add dialogue dictionaries (DOME_FIRSTSHOW_LINES, DOME_SELLOUT_LINES)` — 辞書追加のみ
2. `feat(dome): add MILESTONE_EVENTS entries for dome milestones` — data.js エントリ追加
3. `feat(dome): add venue_occupancy trigger and pre-show milestone hook` — _checkMilestones 拡張 + 新フック
4. `feat(dome): implement spotlight fighter resolver and line resolver` — ヘルパー追加
5. `feat(dome): implement showCeremonyEvent and cerem-* CSS` — モーダル本体
6. `feat(dome): wire pre-show hook into showExec transition` — 既存フローへの組み込み
7. `docs(dome): update achievement-system-spec with D-tier category` — スペック更新

main へのマージは `--no-ff` で一括マージ推奨（仕様通り）。

---

## 完了チェックリスト

- [ ] `DOME_FIRSTSHOW_LINES` / `DOME_SELLOUT_LINES` が data.js に追加され、exports されている
- [ ] `MILESTONE_EVENTS` に `first_dome_show` / `first_dome_sellout` が追加されている
- [ ] `_checkMilestones` が `venue_occupancy` トリガーに対応
- [ ] `_checkAndShowPreShowMilestone` が実装され、preShow トリガーを処理
- [ ] `showExec` 遷移直前に `_checkAndShowPreShowMilestone` フックが挿入されている
- [ ] `_resolveSpotlightFighters` がメイン2名+ベテラン1名を返す
- [ ] `resolveDomeLine` が決定論的にセリフを選ぶ
- [ ] `showCeremonyEvent` が Mockup v0.6 と同等のUIを表示する
- [ ] BGM が興行前 `bgm_kaimaku_v1.mp3` / 興行後 `8bit-ending-theme_Loop.ogg` で切り替わる
- [ ] 5シナリオの動作確認が通る
- [ ] `achievement-system-spec.md` のD層セクションが追加され、B層から該当項目が削除されている
- [ ] `feature/dome-milestone` ブランチで Github push 済

---

## 質問・行き詰まったら

- 設計上の判断が必要になった場合は、**勝手に推測せず** 仕様書 v0.3 を再確認し、仕様書に載っていない判断は Keisuke に照会すること
- 既存コードとの干渉が発生した場合（例: `showPrep → showExec` の遷移が複数パス見つかった等）、実装を止めて報告すること
- BGM が思ったように切り替わらない等の問題は、先に派閥モーダルの実装を読み込んでから真似ること
