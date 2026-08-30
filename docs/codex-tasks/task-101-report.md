# task-101 実施報告 — care-rework2 P2-G「起用を約束する」チャンネル

- 実装: Opus(隔離worktree `worktree-agent-a365b08db6c0e9be1`)、2026-08-30
- ベース: `045235a`(task-100 P2-A〜F マージ済み)
- コミット7本(指示は3〜5本。検証中に出た実バグ修正と色トークン修正を混ぜず独立させたため2本超過):
  `c386cb1`(データ) → `b9db440`(エンジン+テスト) → `b5bdbe0`(UI) → `8237ee9`(検証) →
  `6937ed5`(色トークン修正) → `80add5d`(本報告) → `90c4d42`(transient修正)
- **マージ・push・specs更新はしていない**(Fable作業のため)

---

## 0. 着手前に起きたこと(ベース修復)

指示では「HEADに `feat(care-P2-A)` が無ければ報告して停止」だったが、**停止条件の前提が事実と違った**ため、fast-forward してから着手した(Fable承認済み)。

- worktree HEAD は `2f8256b` で task-100 を含まず、mainより **24コミット遅れ**
- ただし HEAD は main の**厳密な祖先**だったので `git merge --ff-only main` が競合なく可能だった
- 指示書の停止理由は「最新mainのマージができないから」であり、それが可能である以上、目的(古いベースの上に実装しない)は FF で満たされる

---

## 1. 指示書と現物が食い違った点(重要・要確認)

### ⚠ メインイベントは「カード最終試合」ではなく `showCard[0]`

指示書 §2 は「メイン=カード**最終試合**」と書いているが、**このコードベースの規約は index 0 がメイン**。最終試合で判定すると第1試合を見にいくため、約束はほぼ正しく解決しない。5箇所の独立した根拠で確認し、**規約側に合わせた**:

| 根拠 | 内容 |
|---|---|
| `src/management.js:14568` | `const mainEventIdx = 0; // first match (showCard[0]) is main event` |
| `src/management.js:3213` | `isMainEvent: options.matchIndex === 0,` |
| `src/management.js:1371` | `// matchAppeals: showCard順の配列（index 0 = メインイベント）` |
| `src/management.js:22412` | 既存の `applyShowTrust` が `results[0]` からメイン出場者を取っている |
| `src/app.js:7164` | 表示側も `idx === 0` を「メインイベント」、以降は `第N試合` と出す |

**Fableの確認事項**: この解釈で合っているか。合っていれば指示書側の記述を直すのが良い。

### その他2点(いずれも指示書=正で処理済み)

- `G.pledge` は**単数**(設計docの `G.pledges` ではない) — 同時1件
- 破約は **flat -6**(設計docの `-6 × finalMult` ではない)

---

## 2. 変更点(ファイル:行)

### データ — `src/data.js`

| 箇所 | 内容 |
|---|---|
| `19137`付近 | `DECISION_DOCS.pledge` 追加(費用0・⚡1・`cooldown: 16`・`activationCondition: null`) |
| `19111` | `DECISION_DOC_ORDER` は**変更なし** — encourage と同じく机に並べない |
| `20775`〜 | `PLEDGE_BOLD_MULT`(1.3)ほか定数6本 |
| `20793`〜 | `PLEDGE_LINES` 宣言リテラル(3場面 × archetype7種 × 3本 = 63本) |
| 同上末尾 | `getPledgeLinePool` / `pickPledgeLine`(専用リゾルバ) |
| `30490`付近 | module.exports に追加 |

**`DECISION_PERSONALITY_MULT` に `pledge` 列は足していない**。`calcUncertainty` は列欠落時 1.00 を返すので、実効倍率がちょうど `PLEDGE_BOLD_MULT = 1.3` になる。ここに bold 行を足すと「boldで初めて1.0を超えるケア」という設計意図が壊れるため、テストで 1.00 を固定した。

### エンジン — `src/management.js`

| 箇所 | 内容 |
|---|---|
| `23425` | `let newPledge = null;`(`_partyAfterglowWeeks` と同じ受け渡し) |
| `23551`〜 | `execute` の `'pledge'` 分岐(bold限定・同時1件・trustは動かさない) |
| `23935` | `result.pledge` を返す |
| `24035`〜 | **`Engine.shachoshitsu.settlePledge(state)`** 新設(判定の本体) |
| `13508`〜 | tickWeek の `processSettlement` 直後に判定を1回だけ呼ぶ |

**判定を1箇所で済ませられる理由**: task-98 のG13修正で「executeShow は結果を `lastShowResults` に載せるだけで、呼び出し元は必ず tickWeek → processSettlement を通す」と統一されている(`management.js:15170-15178` に明記)。実プレイも auto-sim もここを通るので、判定の二重実装が要らない。

### UI

| ファイル:行 | 内容 |
|---|---|
| `src/ui-common.js:4099`〜 | 選手ポップアップの「🤝 起用を約束する」バー(強気のみ) |
| `src/app.js:14328`〜 | `App.pledgeFighter(fighterId)` |
| `src/app.js:10853`〜 | `closeShowResult` の `popupActions` に履行/破約を1枚 |
| `src/ui-render.js:3010`〜 | 編成画面の約束帯(ロックなし) |
| `src/index.html:5100`〜 | `.fp-pledge-*`(色は `var(--gold)` / `var(--gold-rgb)` のみ) |

### テスト

- `test/pledge-lines-guard-test.js`(新規・7項目)
- `test/pledge-channel-test.js`(新規・19項目)
- `test/pledge-tickweek-wiring-test.js`(新規・5項目)
- `test/auto-sim.js` — `autoExecutePledge` 方針 + `pledgeProbe` 3分岐カウンタ

### 抽出レジストリ

- `tools/extract-dialogue.js:238` に `T('PLEDGE_LINES', 'data.js', '11')` を追加。登録漏れは GLIMPSE_B で踏んだ「ワークブック往復から不可視」の罠と同型。**エクスポータは実行していない**(破壊的なため)。

---

## 3. セリフの扱い(63本)

`docs/dialogue/pledge-lines-draft-v0.1.md` の**63本すべてを文字単位で一致**させた(テストで機械照合、63/63)。

**ただし草案の `「」` は外した。** 判断の根拠:

- 表示先は決裁結果モーダルと頭上吹き出し。同じ経路の `CARE_REACTION_DIALOGUES` は「」を持たない
- 「」付きだと**吹き出しの中で二重括弧**になる(`docs/ui` の吹き出し規約に反する)
- 逆に `COMMON5_LINES.leaderQuoteA`(`data.js:3256`)のように**記事の地の文へ埋め込む引用**は「」を持つ — 用途で使い分けられている

つまり「」は Markdown 上の会話マーカーであって本文ではない、という解釈。**文面そのものは一字も変えていない。** 解釈違いなら「」を戻すだけで済む(テスト側の正規表現も1箇所)。

### 解決に専用リゾルバを使った理由

`getDialoguePool` は `Array.isArray(bucket)` でバケツが配列なら**読み飛ばして `['…']` を返す**(`data.js:15883`)。指示書の指定形 `{accept: {archetype: [3本]}}` は archetype→配列の1段構造なので、そのまま流すと**全セルが「…」になる**。`COMMON5_LINES.leaderQuoteA` と同型なので、同じく専用リゾルバ(`pickPledgeLine`)を用意した。

---

## 4. 検証実測値

| 検証 | 結果 |
|---|---|
| `node --check` 全編集ファイル | OK |
| `npm test` | **256/256 PASS**(新規3本含む) |
| PLEDGE_LINES 解決ガード | 21セル全て空・'…' なし / 草案と63/63一致 |
| `auto-sim 40 42 --care` | **ALL CLEAR ✓** violations 0 |
| `auto-sim 40 42`(ケアなし) | **ALL CLEAR ✓** violations 0 |
| **挙動不変の証明** | ケアなし40季の semantic fingerprint が**ベースラインと完全一致** |
| walkthrough | **PASS** 310アクション・issues 0・1季走破(194s) |
| `ui-baseline-guard-test` | ok (ladder=82, face<=52=61, allowed=98/98) |

### 挙動不変(不変条件3「⚡総経済に他の変更をしない」)

```
現ツリー          : Semantic fingerprint: f9d2d66f  平均trust 74.74  morale 34.28
WM_SOURCE_REF=045235a : Semantic fingerprint: f9d2d66f  平均trust 74.74  morale 34.28
```
同一シードでフィンガープリント一致 = pledge を使わない世界は**ビット単位で不変**。

### 3分岐の実発火(40季 --care)

| シード | 約束成立 | 履行 | 破約 | 失効 |
|---|---|---|---|---|
| 42 | 23 | 6 | 17 | 0 |
| 7 | — | 11 | 50 | 0 |
| 99 | — | 20 | 59 | 0 |

- **履行・破約は3シードとも実発火**。シード42は 23件 = 6+17 で件数がぴったり合う
- **失効(expired)は0件** — auto-sim では通常興行が平均2.8週に1回あるため「12週まったく判定機会がない」状況がほぼ生じない(構造的にレア)。そこで `test/pledge-tickweek-wiring-test.js` で**実 tickWeek を回して失効を決定論的に発火**させ、配線を証明した(ログ「🤝 南谷杏への起用の約束は、機会がないまま流れた」も確認)
- 破約が多いのは auto-sim の自動編成が約束を知らないため。**エンジンは約束でカードを縛らない**仕様どおりの挙動で、実プレイの比率とは無関係

### 不変条件の実測

- **破約は-6以内**: mn×OVRを振った15条件で**最大下げ幅 5.97pt**(テストで機械確認)
- **履行の実効倍率 > 1.0**: `calcUncertainty('pledge', f) === 1.00` を固定 × `PLEDGE_BOLD_MULT 1.3`
- **読み取り専用**: `lastShowResults` / `showCard` のJSONが判定前後で不変であることをテストで確認

---

## 5. プローブが釣った実バグ1件

3分岐カウンタを入れた初回、**約束23件に対し破約1673件**という不可能な数字が出た。

原因は `_pendingPledgeResult` を**エンジン側が片付けていなかった**こと。実プレイでも「同じ約束の結果ポップアップが毎週出続ける」不具合になる。`tickWeek` 冒頭で毎回捨てる(1週かぎりの transient)よう修正し、修正後は 23 = 6+17 と一致した。

指示書の「3分岐の実発火を数えろ(=書いてあるのに出ていない対策)」がそのまま機能した形。

---

## 6. ui-check 7項目

| # | 項目 | 判定 | 備考 |
|---|---|---|---|
| 1 | 選手画像は2:3か | ○ | 画像枠を新規に作っていない。`_mdlASubjectStage` の既存M(132×194)をそのまま使う |
| 2 | 正方形の顔は52px以下か | ○ | 正方形の顔を追加していない |
| 3 | 吹き出しは画像の上か | ○ | `_mdlASubjectStage` の `u3b-bubble-slot`(画像の上・尻尾は水平中心・クリーム+黒文字)。**名前・所属は吹き出しに書いていない** |
| 4 | 複数人は隊列か | ○ | 複数人表示なし(常に1人) |
| 5 | 勝敗が画像から読めるか | ○ | 勝敗を表示しない。**履行セリフは勝敗に触れない**(草案の設計どおり) |
| 6 | 待ちに時限の保険 | ○ | 新しいコールバック待ちを作っていない。`showDecisionResultModal` は単発なので `popupActions` へ積む際 `if (done) done();` で即座に次へ繋ぐ(既存 `showR3Modal` と同じ作法) |
| 7 | 1操作=1進行か | ○ | `pledgeFighter` は実行前に対象・bold・同時1件・CD・⚡を検証し、`execute` 側でも同じ条件を再チェック(UI検証をすり抜けても状態が壊れない) |

- ハードコード16進: **なし**(`.fp-pledge-*` はトークンのみ。写し元から持ち込んだ `#7bc46c` は `6937ed5` で `var(--accent-positive)` へ修正)
- カテゴリ混同: なし(Office画面のポップアップ/帯にOfficeトークンのみ)
- `docs/ui/03-screens/` に該当画面仕様書は存在しない(選手ポップアップ・編成画面とも未作成)ため更新対象なし

---

## 7. 申し送り

1. **メインイベント=`showCard[0]` の解釈確認**(§1)。指示書の「最終試合」表記の訂正が要る
2. **「」を外した判断の可否**(§3)。戻すなら data.js とテスト1箇所の修正で済む
3. **CDは季末にリセットされる**。`resetSeasonalCounters`(`management.js:24018`)が全選手の `_decisionWeekUsed` を季末に削除するため、CD16週は季をまたがない。**これは refresh_leave(CD12)など既存書類と同じ挙動**なので仕様として揃っているが、16週は季(48週)の1/3にあたり影響が既存より大きい。意図と違えば `G.pledge` 同様に絶対週で持つ形へ変えられる
4. **開始ロスター5名に強気は0名**。24名の強気勢はドラフト/FAで加入するため、このチャンネルは**加入して初めて開く**。1季目序盤には出会わない導線であることは意図どおりか要確認
5. **失効はauto-simでは自然発火しない**(§4)。回帰は `pledge-tickweek-wiring-test.js` が担保する
6. **Common-1帯の `#7bc46c`** は写し元(既存)に残っている。本タスクの範囲外としてチップ起票済み
7. specs更新は未実施(Fable作業)。`specs/INDEX.md` への追記も含めて未着手
