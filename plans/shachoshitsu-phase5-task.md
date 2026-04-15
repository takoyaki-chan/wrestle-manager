# Phase 5: 既存ケアシステム廃止 — 実装指示書

> **対象**: Claude Code (次セッション)
> **所要時間目安**: 2〜4時間(削除中心だが、共有CSS/DOM・ヘルパー関数の扱いで手が止まりやすい)
> **前提コミット**: `614e898` Phase 4 レビュー反映完了
> **目的**: 旧ケアモーダル(💝ケア)を完全に廃止し、社長室 🏛️ を唯一の決裁入口にする
> **承認ポイント**: 実装完了後、Keisuke さんに動作確認依頼 → 承認されたらPhase 6へ

---

## このドキュメント1枚で着手できることを目指す

新しい会話セッションで、このファイルだけを読めば Phase 5 を完了まで進められるよう、コンテキストを自己完結で書く。実コードを読む前にまずこの指示書 → 次に spec → 次にファイル調査の順で進めること。

---

## Phase 4 までで完成している状態(2026-04-15 時点)

### 社長室 🏛️ 側(新システム)
- `DECISION_DOCS` (8書類、うち机に並ぶのは7種)が `src/data.js:11732` に定義済み
- `Engine.shachoshitsu` が `src/management.js:12742` に完成(getDoc / getDocOrder / checkActivation / getAvailableDocs / calcCost / execute / getReactionText)
- `App.executeDecision` / `App.onShachoshitsuDocClick` が `src/app.js:6855` 付近にあり
- `showDecisionTargetModal` / `showDecisionConfirmModal` / `showDecisionResultToast` が `src/ui-common.js:6464` 付近
- `renderShachoshitsu` が `src/ui-render.js:3193` で書類を動的描画+クリックハンドラ付与
- HUD の決裁枠(`G.decisionPoints`, `G.decisionPointsMax`)は Phase 2 で完了、回復は tickWeek で週次処理
- 朱印演出 / 印鑑倒れ / is-approved クラスの CSS は `src/index.html:3020` 付近
- `_decisionDoneThisWeek` は tickWeek で毎週クリア
- `_decisionWeekUsed` はマイグレーション済み(state と fighter 両方)

### 旧ケアシステム側(これを廃止する)
- 今週画面にまだ「💝 ケア」ボタンが存在(`src/ui-render.js:913`)
- `App.openCareModal` / `App.executeCareAction` が `src/app.js:6775` にある
- `showCareActionModal` 関数本体(~360行)が `src/ui-common.js:6104-6462`
- `Engine.careActions` が `src/management.js:12467`
- `CARE_ACTIONS` データ定義が `src/data.js:11667-11719`
- `CARE_REACTION_DIALOGUES.costume` (19288行〜多数)
- `G.careStock` / `G.careStockMax` / `G.careStockLastRecovery` / `G._teamCareWeekUsed` が state に存在
- 選手フィールドに `_careWeekUsed` / `_bonusRepeat` / `_costumeDebut` が残っている

Phase 4 では新旧両方が **並行稼働** しており、既存セーブも動く状態。Phase 5 でこの「旧」を全部消して、新システムに一本化する。

---

## 事前に必ず読むべきファイル(順序厳守)

1. **この指示書**(本ファイル): `plans/shachoshitsu-phase5-task.md`
2. **spec**: `specs/shachoshitsu-spec-v1.0.md` §9(マイグレーションと削除)、§11(Phase 5 セクション)
3. **CLAUDE.md**: 「自動検証システム(auto-sim)」「数値哲学」「やらないことリスト」セクション
4. **memory**: `memory/feedback_player_text_no_internal_tokens.md`(プレイヤー向け表記ルール)
5. **前フェーズの指示書**(アーカイブ価値): `plans/shachoshitsu-phase4-task.md`
6. **実コード**: 上の「Phase 4 までで完成している状態」に載せた行番号から流し読み

spec の §9 には Phase 5 当初設計の「削除/リネーム」表があるが、**実コード調査で判明した重要な修正点**(後述「⚠️ 重要な注意事項」)があるので、spec の記述を鵜呑みにしないこと。

---

## ⚠️ 重要な注意事項(実コード調査で判明)

spec §9 をそのまま実行すると壊れる点が3つある。着手前に必ず頭に入れること。

### 注意1: `careOverlay` / `careBox` DOM は共有されている — 削除禁止

`src/index.html:3670` の `<div id="careOverlay">` / `<div id="careBox">` は、**showCareActionModal 以外にも多数のモーダルが再利用している**:

| 使用箇所 | 関数 |
|---|---|
| `src/ui-common.js:6649` | 選択型イベントモーダル後処理 |
| `src/ui-common.js:6720` | 選択型イベント結果ポップアップ |
| `src/ui-common.js:6779` | 練習中アクシデント/負傷モーダル |
| `src/ui-common.js:8689〜8927` | 対抗戦/挑戦状/代表選手選択など7種 |

→ **`careOverlay` / `careBox` の DOM 要素はそのまま残す**。`<div id="careOverlay">` も `.care-overlay` / `.care-box` の base CSS も削除しない。

spec §9.3 には「.care-overlay, .care-box ... を全削除」と書いてあるが、これは誤り。実装時は base は残し、showCareActionModal 専用の子クラスだけ削除する。

### 注意2: `care-title` / `care-reaction*` / `care-result-*` CSS も共有されている — 削除禁止

これらのクラスは showChoiceEventModal(選択型イベント)、練習中アクシデント、対抗戦モーダル、挑戦状モーダルなど ~10 箇所で再利用されている。具体的には `src/ui-common.js` の 6311 / 6315-6319 / 6378 / 6475-6484 / 6513-6535 / 6558 / 6582 / 6601 / 6615-6626 / 6647 / 6667 行など。

→ **以下のクラスは削除禁止**(他モーダルで再利用):
- `.care-overlay`, `.care-box`
- `.care-title`
- `.care-reaction`, `.care-reaction-bubble`, `.care-reaction-portrait`
- `.care-result-header`, `.care-result-action-emoji`, `.care-result-action-label`, `.care-result-portrait`, `.care-result-name`

→ **以下のクラスは削除OK**(showCareActionModal 専用。grepで再確認すること):
- `.care-section-label`
- `.care-action-row`, `.care-action-emoji`, `.care-action-info`, `.care-action-name`, `.care-action-desc`, `.care-action-cost`
- `.care-fighter-grid`, `.care-fighter-card`, `.care-fighter-card-name`, `.care-fighter-card-status`, `.care-fighter-card-cd`
- `.care-expect`, `.care-expect-label`, `.care-expect-item`
- `.care-result-speech`, `.care-result-changes`, `.care-result-change`, `.care-result-team-row`, `.care-result-team-member`, `.care-result-team-name`, `.care-result-camp-flavor`, `.care-result-cost`, `.care-result-close-btn`
- `.care-rc-label`, `.care-rc-val`, `.care-rc-up`, `.care-rc-down`, `.care-rc-arrow`, `.care-rc-diff`, `.care-rc-animate`
- `.care-close-btn`

**削除前に必ず**: 各クラスを `grep -r "care-xxx" src/` で検索し、`src/ui-common.js:6104-6462`(showCareActionModal 本体)の外で使用されていないことを確認してから消す。ひとつ見落とすとレイアウトが崩れる。

### 注意3: `Engine.careActions` のヘルパー関数は他所から呼ばれている

`Engine.careActions` を丸ごと削除すると、以下の参照が壊れる:

| 呼び出し元 | 行 | 呼ばれているメソッド |
|---|---|---|
| `src/management.js:5788` | `Engine.careActions.getTrainerMult(nc)` |
| `src/management.js:5854` | `Engine.careActions.getTrainerMult(nc)` |
| `src/management.js:5971` | `Engine.careActions.tickTrainerBuffs(roster)` |
| `src/management.js:9663` | `Engine.careActions.resetSeasonalCounters(s.roster)` |
| `src/ui-common.js:6118` | `Engine.careActions.isInSlump(f)` (←showCareActionModal 内、削除予定) |
| `src/ui-common.js:6377` | `Engine.careActions.isInSlump(f)` (←showCareActionModal 内、削除予定) |

→ **対応**: `Engine.careActions` からこれらのヘルパーを `Engine.shachoshitsu` に **移動(移植 or エイリアス)** する。具体的には `tickTrainerBuffs` / `getTrainerMult` / `resetSeasonalCounters` / `isInSlump` / `getBonusRepeatCount` を `Engine.shachoshitsu` のメンバに追加して、呼び出し側を全置換する。

あるいはエイリアス方式: `Engine.shachoshitsu.tickTrainerBuffs = Engine.careActions.tickTrainerBuffs` のようにしてから `Engine.careActions` 本体を削る——でも後で混乱するので、**正式に移動する**のを推奨。

---

## Phase 5 で実施するタスク(順序推奨)

壊れにくい順序で並べている。この順で進めると各ステップで動作確認しながら進められる。

### Task 1: `Engine.shachoshitsu` にヘルパー関数を移動

**目的**: 他所から呼ばれている `Engine.careActions` のヘルパーを先に `Engine.shachoshitsu` に移し、呼び出し元を置換しておく。こうすれば後で `Engine.careActions` を消しても何も壊れない。

**ファイル**: `src/management.js`

1. `Engine.shachoshitsu` の末尾(`getReactionText` の後)に以下を追加:
   - `tickTrainerBuffs(roster)` — `Engine.careActions.tickTrainerBuffs` と同じ実装をコピー
   - `getTrainerMult(fighter)` — 同上
   - `resetSeasonalCounters(roster)` — ただし `_careWeekUsed` → `_decisionWeekUsed` にリネーム
   - `isInSlump(fighter)` — 同上
   - `getBonusRepeatCount(fighter)` — 同上
2. `src/management.js:5788` / `5854` / `5971` / `9663` の呼び出しを `Engine.shachoshitsu.xxx` に書き換え
3. `src/ui-common.js:6118` / `6377` の呼び出しも同様に置換(これらの行は Task 3 で削除予定だが、Task 1 の時点で Engine.careActions から離脱しておく)

**検証**: auto-sim 20シーズン走らせて違反ゼロなら OK。

### Task 2: 選手フィールド `_careWeekUsed` → `_decisionWeekUsed` 統一

**目的**: Phase 4 で `_decisionWeekUsed` を新規フィールドとして追加したが、旧 `_careWeekUsed` はまだ併存している。Phase 5 で一本化する。

**方針**: 今後は `_decisionWeekUsed` のみを使う。`_careWeekUsed` は読み取り互換のためマイグレーション時に `_decisionWeekUsed` へコピー → 削除。

**ファイル**: `src/app.js`

マイグレーションブロック(Phase 4 マイグレの近く、2049 行付近)に追加:
```javascript
// 社長室 Phase 5: _careWeekUsed → _decisionWeekUsed に統合
if (G.roster && G.roster.some(f => f._careWeekUsed)) {
  G = { ...G, roster: G.roster.map(f => {
    if (!f._careWeekUsed) return f;
    const merged = { ...(f._decisionWeekUsed || {}), ...f._careWeekUsed };
    const { _careWeekUsed: _, ...rest } = f;
    return { ...rest, _decisionWeekUsed: merged };
  })};
}
```

**ファイル**: `src/management.js`

`Engine.shachoshitsu.resetSeasonalCounters`(Task 1 で移植したやつ)で `_careWeekUsed` の参照を `_decisionWeekUsed` に書き換え。

### Task 3: `showCareActionModal` 関数を削除

**ファイル**: `src/ui-common.js`

1. 6104-6462 行の `showCareActionModal` 関数本体を丸ごと削除(~360行)
2. ただし **注意1/2 を必ず確認**してから。`careOverlay` / `careBox` / `.care-title` / `.care-reaction*` / `.care-result-*` 系の「再利用されている」クラスは、この関数を消しても他で使われるので何もしない。
3. `Engine.careActions.isInSlump` 呼び出し(6118 / 6377)は、関数ごと消えるので自動的に消える

**検証**: `grep -n "showCareActionModal" src/` → 自己参照のみ残っていないこと、もしくは全削除されていること。

### Task 4: `App.openCareModal` / `App.executeCareAction` を削除

**ファイル**: `src/app.js`

6775-6836 行の `openCareModal` / `executeCareAction` を削除。

**検証**: `grep -n "openCareModal\|executeCareAction" src/` で呼び出し元がすべて消えていることを確認。

### Task 5: 今週画面の「💝 ケア」ボタン削除

**ファイル**: `src/ui-render.js`

913 行の `💝 ケア` ボタンを丸ごと削除。

### Task 6: `Engine.careActions` 丸ごと削除

**ファイル**: `src/management.js`

12467 行の `Engine.careActions = { ... };` ブロック全体を削除。Task 1 で他所への依存は剥がしてあるので安全。

### Task 7: `CARE_ACTIONS` データを削除

**ファイル**: `src/data.js`

1. 11667-11719 行の `const CARE_ACTIONS = {...};` ブロック全体を削除
2. 21302 行付近の `module.exports` から `CARE_ACTIONS` を除去(ただし `CAMP_FLAVOR_TEXTS` / `CARE_REACTION_DIALOGUES` は残す)

**検証**: `grep -n "CARE_ACTIONS" src/` で参照が一切残っていないこと。

### Task 8: `costume` 関連の完全削除

Phase 5 での costume 廃止は spec §9.2 通り。

**ファイル**: `src/management.js`
- 7125-7126 行: `_costumeDebut` フラグ消費ロジック削除
- Task 6 で `Engine.careActions` は消えているので costume 分岐(12552 / 12621 / 12671)も自動消滅済み

**ファイル**: `src/data.js`
- 12040 行付近の `CARE_REACTION_DIALOGUES.costume` 初期化ブロックを削除
- 19288 行以降の costume の `.push(...)` 行を**個別に**全削除(nested 構造なので慎重に)

**検証**:
- `grep -n "costume" src/` で残存参照チェック。data.js の `CAMP_FLAVOR_TEXTS`(合宿)は名前が似てるが別物なので残す
- auto-sim 20シーズン走らせて違反ゼロ
- 既存セーブ読み込みで `_costumeDebut` が残っているのが見つかっても、mark-sweep 方式で問題ない(読まれなくなる)ので特別なマイグレ不要

### Task 9: `special_treatment` を怪我発生ポップアップに統合

spec §9.2: 「決裁書類ではなくなる。怪我発生モーダルに統合。資金コストは維持、決裁枠消費なし」

**現状の怪我発生フロー**(`src/app.js:5254-5266`):
```javascript
// v0.96: Show injury popups (only non-retirement injuries)
const injuries = App._lastInjuries || [];
injuries.forEach((ir, i) => {
  if (ir.retireType) return;
  const ch = G.roster.find(c => c.name === ir.name);
  if (ch && ir.injury) {
    hasEventPopups = true;
    setTimeout(() => showEventPopup({ type:'fighter', ... }), i * 100);
  }
});
```

これは `showEventPopup`(単純通知)で、今は選択肢がない。Phase 5 ではここに「特別治療を実施する(200万)」選択肢を追加する。

**推奨実装**:
1. `src/ui-common.js` に新関数 `showInjuryPopup(fighter, injury, onConfirm)` を追加。既存 `showEventPopup` ベースではなく、「閉じる / 特別治療(200万)」の2択モーダル
2. `showInjuryPopup` は `careOverlay` / `careBox` を再利用してよい(他モーダルと同じパターン)
3. 「特別治療」を選んだら `App.executeSpecialTreatment(fighterId)` を呼ぶ
4. `App.executeSpecialTreatment` は `Engine.shachoshitsu.execute` とは別経路で、**決裁枠を消費せず**、資金200万のみ消費、怪我回復期間を1〜4週短縮(旧 `Engine.careActions.execute` の special_treatment 分岐と同じロジックをコピー移植)
5. マイグレーションは不要(フィールドは変わらない)

**ファイル**:
- `src/ui-common.js`: `showInjuryPopup` 新規追加
- `src/app.js`: `App.executeSpecialTreatment` 新規追加、5254-5266 の怪我通知ループを `showInjuryPopup` 呼び出しに書き換え
- `src/management.js`: `Engine.shachoshitsu.executeSpecialTreatment(fighterId, state)` を新設(入力: state、出力: { roster, funds, events })

**検証**: 怪我が発生した試合後に新モーダルが出ること、「特別治療」ボタンで資金-200万+回復期間短縮が機能すること、キャンセルで何も変わらないこと。

### Task 10: `hireCoach` コーチ画面と決裁枠の連動

spec §9.2: 「`hireCoach`: コーチ画面の既存雇用処理に決裁枠チェックを追加」

**現状**(`src/app.js:3560-3580`): `App.hireCoach(coachId)` は資金チェックのみ、決裁枠チェックなし。

**変更**:
```javascript
hireCoach(coachId) {
  const coach = ALL_COACHES.find(c => c.id === coachId);
  if (!coach) return;
  const maxCoaches = Engine.coach.getMaxCoaches(G);
  if (G.coaches.length >= maxCoaches) { ... return; }
  if (coach.grade === 'A' && (G.coachSlots || 1) < 4) { ... return; }
  const fee = coach.hireFee || COACH_HIRE_FEE;
  if (G.funds < fee) { ... return; }

  // 社長室 Phase 5: 決裁枠チェック (hireCoach = 決裁枠2 消費)
  const dpCost = (DECISION_DOCS.hireCoach?.decisionCost) || 2;
  if ((G.decisionPoints || 0) < dpCost) {
    Audio.play('error');
    alert(`コーチ雇用には決裁枠 ⚡${dpCost} が必要です(現在: ⚡${G.decisionPoints || 0})`);
    return;
  }

  G = {
    ...G,
    funds: G.funds - fee,
    decisionPoints: Math.max(0, (G.decisionPoints || 0) - dpCost),
    ...
  };
  ...
}
```

**UI 側**: コーチ画面の雇用ボタンラベルに `⚡2` を表示しておくと親切。`src/ui-render.js:4286` の雇用ボタン生成箇所を調整。

**検証**: 決裁枠0の状態でコーチ雇用を試すとアラートが出ること、雇用成功で決裁枠-2 されること。

### Task 11: 旧ストックフィールド削除

**方針**: `G.careStock` / `G.careStockMax` / `G.careStockLastRecovery` / `G._teamCareWeekUsed` は読み捨て(削除マイグレーション)。

**ファイル**: `src/management.js`
- `createInitialState`(10261-10263): `careStock` / `careStockMax` / `careStockLastRecovery` の初期値行を削除
- `tickWeek`(6753-6756): ケアストック回復ロジックを削除

**ファイル**: `src/app.js`

マイグレーションブロックに追加:
```javascript
// 社長室 Phase 5: 旧ケアストックフィールドを削除
if (G.careStock !== undefined || G.careStockMax !== undefined
    || G.careStockLastRecovery !== undefined || G._teamCareWeekUsed !== undefined) {
  const { careStock: _a, careStockMax: _b, careStockLastRecovery: _c, _teamCareWeekUsed: _d, ...rest } = G;
  G = rest;
}
```

**検証**: 既存セーブ(Phase 4 時点)を読み込んで、G にこれらのフィールドが残っていないこと。

### Task 12: CSS 削除

**ファイル**: `src/index.html`

`注意2` のリストに従い、**showCareActionModal 専用**の CSS クラスだけ削除。削除対象は以下だが、**各クラスを grep してから消す**こと:

削除リスト(grep で showCareActionModal の外で使われていないことを確認):
- `.care-section-label`
- `.care-action-row`, `.care-action-emoji`, `.care-action-info`, `.care-action-name`, `.care-action-desc`, `.care-action-cost`
- `.care-fighter-grid`, `.care-fighter-card` 系
- `.care-expect`, `.care-expect-label`, `.care-expect-item`
- `.care-result-speech`, `.care-result-changes`, `.care-result-change`
- `.care-result-team-row`, `.care-result-team-member`, `.care-result-team-name`
- `.care-result-camp-flavor`, `.care-result-cost`, `.care-result-close-btn`
- `.care-rc-*` 全部
- `.care-close-btn`

**削除禁止**(他モーダル再利用):
- `.care-overlay`, `.care-box`
- `.care-title`
- `.care-reaction`, `.care-reaction-bubble`, `.care-reaction-portrait`
- `.care-result-header`, `.care-result-action-emoji`, `.care-result-action-label`, `.care-result-portrait`, `.care-result-name`

**検証**: 選択型イベントモーダル、練習中アクシデント、対抗戦モーダル、挑戦状モーダルが正常に描画されること(ブラウザ実機でそれぞれ発動させて見る)。

### Task 13: validateGameState 更新

**ファイル**: `src/management.js`, `Engine.validateGameState` 内

旧ケア関連のフィールドが残っていたら warn して自動削除する(マイグレーション失敗時の安全弁):
```javascript
// 社長室 Phase 5: 旧ケアフィールドが残っていないかチェック
if (G.careStock !== undefined) {
  warn('旧careStockフィールドが残存→削除');
  const { careStock: _a, ...rest } = G;
  G = rest;
}
// 同様に careStockMax / careStockLastRecovery / _teamCareWeekUsed も
```

### Task 14: プレイヤー向け表記ルール遵守チェック

メモリ `feedback_player_text_no_internal_tokens.md` に従い、Phase 5 で新規追加する全テキストに `morale` / `orgPop` / `MQ` / `condition` / `trust` などの英字トークンが混入していないか、自己チェック:

```bash
# 新規ファイルに対してgrep
grep -nE "morale|orgPop|MQ|condition" src/ui-common.js src/app.js | grep -iE "'|`|\"|alert|showToast" | head
```

特に Task 9 で新設する `showInjuryPopup` の文言(「怪我が発生しました」「特別治療を実施しますか?」等)は日本語で書くこと。

### Task 15: 検証

**auto-sim**: `node test/auto-sim.js 100` で違反ゼロを確認。managements.js を編集しているのでフックで自動実行もされるはず。

**ブラウザ実機**(localhost:3000):
1. ゲーム起動 → 今週画面に 💝ケアボタンがないこと
2. 社長室タブ → 書類クリック → 決裁実行 → 既存 Phase 4 と同じ動作
3. 試合後に怪我が発生 → 新しい怪我ポップアップが出て「特別治療」選択肢がある
4. 特別治療実行 → 資金-200万、決裁枠は変化なし、回復週数が短縮される
5. コーチ画面 → 雇用ボタンに `⚡2` 表示、決裁枠0で試すとアラート、通常時は決裁枠-2+雇用成功
6. 既存 Phase 4 セーブを読み込み → エラーなし、`G.careStock` 等が消えている(DevTools console で確認)
7. 選択型イベント(ランダム発動待ち) / 対抗戦(季節的に発動) / 挑戦状(E4) / 練習アクシデントなど、care-title/care-reaction 系 CSS を使う他モーダルがレイアウト崩れしていないこと

### Task 16: spec / roadmap / memory 更新

- `specs/shachoshitsu-spec-v1.0.md` §11 Phase 5 セクションに「✅ 完了(日付)」+実装メモを追加。特に「DOM/CSS は共有のため base は残した」ことを明記
- `docs/game-system-roadmap.md` 冒頭に「社長室 Phase 5 — 旧ケアシステム廃止」の1エントリ追加
- `docs/ui/shachoshitsu.md` の実装状況を「Phase 1-5 完了」に更新
- `plans/shachoshitsu-phase4-task.md` を `plans/archive/` に移動(任意)
- このファイル(`plans/shachoshitsu-phase5-task.md`)は完了後に `plans/archive/` へ移動

### Task 17: コミット

コミットは最後にまとめて1つで OK(ファイル間依存があるので途中コミットで壊れる可能性あり)。

```
feat(shachoshitsu): Phase 5 — 旧ケアシステム廃止

- 今週画面の「💝 ケア」ボタン削除
- showCareActionModal / App.openCareModal / App.executeCareAction 削除
- Engine.careActions 削除 (ヘルパーは Engine.shachoshitsu に移動)
  - tickTrainerBuffs / getTrainerMult / resetSeasonalCounters
  - isInSlump / getBonusRepeatCount
- CARE_ACTIONS データ削除 (data.js)
- CARE_REACTION_DIALOGUES.costume 関連行を個別削除
- costume 書類完全廃止 (_costumeDebut フラグ消費ロジックも削除)
- special_treatment を怪我発生ポップアップに統合
  - showInjuryPopup 新設 / App.executeSpecialTreatment 新設
  - 決裁枠消費なし、資金 200万のみ
- hireCoach にコーチ画面で決裁枠チェック追加 (決裁枠 -2 消費)
- 選手フィールド _careWeekUsed → _decisionWeekUsed 統合 (マイグレ)
- G.careStock / careStockMax / careStockLastRecovery / _teamCareWeekUsed
  を削除 (マイグレで読み捨て)
- ケア専用 CSS クラス削除 (共有される .care-overlay/.care-box/.care-title/
  .care-reaction*/.care-result-header 等は他モーダル再利用のため残存)
- validateGameState に旧フィールド検出+自動削除の安全弁追加

既存セーブ互換(Phase 4 時点のセーブから読み込み可能)

仕様: specs/shachoshitsu-spec-v1.0.md §9, §11 (Phase 5)
指示書: plans/shachoshitsu-phase5-task.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

push はしない。Cloudflare Pages が push タイミングで自動デプロイするので、ユーザー判断に委ねる。

---

## 完了の定義チェックリスト

- [ ] 今週画面から 💝 ケアボタンが消えている
- [ ] `showCareActionModal` / `App.openCareModal` / `App.executeCareAction` 全削除
- [ ] `Engine.careActions` 削除、ヘルパーは `Engine.shachoshitsu` に移動済み
- [ ] `CARE_ACTIONS` / `costume` データと dialogues 削除
- [ ] `_costumeDebut` 消費ロジック削除
- [ ] 怪我発生時に `showInjuryPopup` が出て特別治療が選べる
- [ ] コーチ画面でコーチ雇用時に決裁枠 -2 消費
- [ ] 旧フィールド(`careStock` 等)がマイグレーションで削除される
- [ ] ケア専用 CSS のみ削除、共有 CSS は残存
- [ ] `validateGameState` に旧フィールド検出が追加
- [ ] `Engine.validateGameState` 違反ゼロ(auto-sim 100 シーズン)
- [ ] 既存セーブ(Phase 4 時点)が読み込めてエラーなし
- [ ] 選択型イベント / 対抗戦 / 挑戦状 / 練習アクシデント等のモーダルがレイアウト崩れしていない
- [ ] spec / roadmap / screen spec 更新済み
- [ ] Phase 5 アーカイブ先にこの指示書を移動
- [ ] ローカルコミット完了(push はしない)

---

## 禁止事項

- ❌ `careOverlay` / `careBox` DOM 要素の削除(他モーダル再利用)
- ❌ `.care-overlay` / `.care-box` / `.care-title` / `.care-reaction*` / `.care-result-header` 系 CSS の削除(他モーダル再利用)
- ❌ `CARE_REACTION_DIALOGUES` 辞書丸ごと削除(Phase 4 以降 `Engine.shachoshitsu.getReactionText` が参照中)— costume エントリのみ削除
- ❌ `CAMP_FLAVOR_TEXTS` 削除(`renderShachoshitsu` → `showDecisionConfirmModal` では未使用だが、将来の合宿結果演出で再利用予定)
- ❌ `_bonusRepeat` フィールド削除(Phase 4 の Engine.shachoshitsu.execute で継続利用)
- ❌ プレイヤー向けテキストに英字内部トークン混入(`morale` / `orgPop` / `MQ` / `condition` など、`feedback_player_text_no_internal_tokens.md` 参照)
- ❌ ハードコード16進色(新規 CSS を書く場合は `var(--*)` トークンを使う)
- ❌ push(Cloudflare Pages 自動デプロイ発動回避のため、ユーザー判断待ち)
- ❌ コミット時の `--no-verify`(pre-commit フックはそのまま通す)

---

## トラブルシュート

### レイアウトが崩れた
`.care-xxx` CSS を消しすぎた可能性。注意1/2 の「削除禁止」リストを再確認。`git diff src/index.html` で直近の CSS 削除箇所を確認し、疑わしいクラスを戻す。

### 怪我選手に対する特別治療ボタンが出ない
`showInjuryPopup` の発火パスを確認。`App._lastInjuries` にデータが入っているか、5254-5266 行の書き換えが正しいか。

### auto-sim で `Engine.careActions is undefined` エラー
Task 1 のヘルパー移動 + 呼び出し元置換が不完全。`grep -n "Engine.careActions" src/` でゼロになるまで置換。

### 既存セーブを読み込むと `_careWeekUsed` が残っている
Task 2 のマイグレーションブロックが走っていない可能性。マイグレーション関数が呼ばれる順序(Phase 4 の `_migrated_decisionPoints_v1` の近く)に追加されているか確認。

### コーチ雇用時に決裁枠アラートが出ない
Task 10 の `hireCoach` 改修で `DECISION_DOCS.hireCoach` 参照が機能しているか確認。`DECISION_DOCS` はグローバルなので直接参照できる。

### プレイヤー向け表記のチェック
`feedback_player_text_no_internal_tokens.md` を必ず読むこと。英字トークンを grep して混入を洗い出す:
```bash
grep -nE "(alert|showToast|innerHTML.*=|textContent.*=).*(morale|orgPop|MQ[^a-z]|condition[^a-z])" src/app.js src/ui-common.js src/ui-render.js
```

---

## Phase 6 以降の予告(Phase 5 完了後にユーザー確認)

spec §11 より:
- **Phase 6**: 発動条件の微調整(Phase 3 でほぼ完了、Phase 5 完了後の実機プレイで最終調整)
- **Phase 7**: 遅延発現メカニズム(trust上昇を3週かけて反映)
- **Phase 8**: 不確実性メカニズム(性格×書類マトリクス)
- **Phase 9**: 磨き込み(演出、選手詳細画面での pendingTrustDeltas 可視化など)

Phase 5 が承認されたら、次は Phase 7(遅延発現)か Phase 6(微調整)を選ぶかユーザーに確認すること。

---

以上、Phase 5 実装指示書終わり。
