# 🎓 特別興行後のコーチ総括 v1.0

実装完了 2026-08-01（task-73 / commit `af82547`）。
指示書: `docs/codex-tasks/task-73-tournament-coach-wrapup.md`

---

## 設計原則

大会結果画面を閉じて経営画面へ戻る直前に、**コーチ1人が1枚だけ**喋る。
内容は「自団体選手0〜2名への言及」＋「大会全体の総括」。

- **網羅しないのが仕様。** 出場した自団体選手が5人いても、触れるのは1〜2人
- **不出場の回もコーチは喋る。** 他団体の大会を見ての一言。ここが薄いと大会が他人事になる
- コーチには archetype / personality が無い。**分岐は voice 8系統**

---

## §1 対象と発火点

5大会すべて。それぞれの「大会を終える」ハンドラの先頭に割り込む。

| kind | 大会 | 割り込む関数 |
|---|---|---|
| `junior` | ジュニアトーナメント | `App.finalizeJuniorTournament`（選手の感想チェーンの**後**） |
| `springTag` | 春のタッグリーグ | `App.finalizeSpringTagLeagueReplay` |
| `autumnWar` | 秋の4団体勝ち残り対抗戦 | `App.finalizeAutumnWarReplay` |
| `ppv` | PPV GRAND FINAL | `App.closePPVResult` / `App.closePPVTV`（TV観戦の回も出す） |
| `tenchosen` | 天頂戦 | `App.finalizeTenchosen` |

---

## §2 話す内容の組み立て

### §2.1 言及する選手を選ぶ（最大2名）

その大会で**いちばん物語が動いた選手**を優先度順に選ぶ。

| 優先 | reason | 条件 |
|---|---|---|
| 4 | `crown` | 優勝した |
| 3 | `deep` | 決勝・準決勝まで行った |
| 2 | `upset` | 格上を食った（相手OVR − 自分OVR ≥ 8） |
| 1 | `close` | 白星なしだが競った（負け試合の MQ ≥ 60） |
| 0 | — | 該当なし → 誰にも触れず大会全体だけ語る |

- **同点なら直近で触れられていない選手を優先する**（スポットライトは巡るもの）。
  実際に名前を出した選手だけを `G.coachWrapup.recent`（新しい順・最大8件）に覚える
- 2人目は**1人目より下の物語**のときだけ添える。同格を2人並べると、duo の文が
  2人目を実際より低く見せて嘘になる。同格しか居なければ1人だけ触れる
- **3人以上には絶対に触れない**

### §2.2 タッグは例外（春のタッグリーグ）

2人で1つの結果を分け合うので片方だけを主役にしない。**必ず2名まとめて**出す。
上位で終わった回は `together`、下位で終わった回は `togetherPoor`
（最下位なのに「よく噛み合っていた」と言うと嘘になるため語り口を分ける）。

### §2.3 総括（成績6段）

自団体の最高成績。トーナメントにも PPV（勝ち負けだけの興行）にも通る言い方で書く。

| grade | 意味 |
|---|---|
| `champion` | 頂点（優勝 / PPV は頂上決戦に勝利） |
| `finalist` | あと一つ（準優勝 / PPV は頂上決戦で敗北） |
| `semifinal` | 上のほうまで（ベスト4 / 2勝以上） |
| `advanced` | 勝ちはあった（1勝以上） |
| `firstRound` | 白星なし |
| `absent` | 不出場（**繰り返し出やすいので2本ずつ持つ**） |

---

## §3 誰が喋るか

1. **言及する選手（優先度1位）の担当コーチ**（`G.coachAssign`）
2. 担当が付いていない / 自団体が出ていない → **在籍が最も長いコーチ**
   （雇用は末尾追加・解雇は filter なので `G.coaches[0]` が在籍最長）
3. **コーチが1人もいない → この演出を出さない**（無人の吹き出しを作らない）

---

## §4 セリフテーブル

`src/coach-lines.js`。voice は `COACH_VOICE_MAP` / `getCoachVoiceKey(coachId)` で解決。

| テーブル | 構造 |
|---|---|
| `COACH_WRAPUP_VERDICT_LINES` | `[grade][voice]` → 文字列（`absent` のみ配列2本） |
| `COACH_WRAPUP_MENTION_LINES` | `[reason][voice]` → `{ solo, duo }`。`{n1}` `{n2}` が選手名の差し込み枠 |

voice 8系統: `sparta_roshi` / `sparta_tosho` / `theorist` / `artisan_bukotsu` /
`artisan_seihitsu` / `mentor` / `bigheart_oyaji` / `bigheart_anego`

### 文言の縛り

- 吹き出しに入るので `「」` は付けない
- 大会名・会場名は書かない（見出しと地の文が背負う）
- MQ / コンディション / 人気 のような内部語と生の数値を出さない
- **1画面 = コーチ1人 = 1〜2文**。長い総括は読み飛ばされる

---

## §5 進行（`App._tcwGate`）

「大会結果 → コーチ → 経営画面」の連鎖に割り込むので、**詰まると週が進まなくなる**。
そのため次の3点を必ず守る。

```js
// 大会終了ハンドラの先頭で
if (App._tcwGate('kind', args, () => App.同じ関数())) return;
```

1. **二重起動しない** — `G.coachWrapup.lastKey`（`kind:season`）を**先に**立てる。
   resume は自分自身を呼び直すだけでよい（2回目は lastKey で素通りする）
2. **fail-open** — 組み立てが失敗したら `false` を返して呼び出し元をそのまま通す。
   コーチが出ないことはあっても、週が止まることはあってはならない
3. **`onDone` はちょうど1回** — 表示したら、クリック / 背景タップ /
   タイムアウト（30秒）/ 内部例外のどれで抜けても同じ出口（`settle`）を通る

---

## §6 UI

- 演出枠は既存の `.war-victory-overlay`（Stage・z-index 300）を借りる。専用オーバーレイは作らない
- 顔出しは共通部品 **`_u3bSideHtml`**。縦順は 吹き出し → 画像 → 名前 → 役割（`コーチ`）の固定順
- 大会色は `.is-tcw` + `is-spring` / `is-summer` / `is-autumn` で差し替え。
  冬（PPV / 天頂戦）が既定色
- キッカー1行（`JUNIOR CUP · COACH NOTE` など）

---

## §7 GameState

```js
G.coachWrapup = {
  lastKey: 'ppv:12',   // 二重起動防止。kind:season
  recent: [103, 87],   // 直近で名前を出した選手id（新しい順・最大8）
}
```

---

## §8 検証

`test/tournament-coach-wrapup-test.js`（QUICK に登録済み）。

- 5大会すべてに割り込みが配線されている（経路が消えていないこと）
- `onDone` がちょうど1回（連打 / 背景タップ / タイムアウト / 壊れた payload）
- voice 8系統 × 成績6段が全部埋まっている / 言及は最大2人 / 不出場でも無言にならない
- 内部語と生の数値、`「」` が混じっていない

> **注意**: テストのフィクスチャは手作り。5大会の実データ構造（`_orgId` と `orgId`、
> `championId` と `champion`、`results[].mq` の不在など）は `src/management.js` 側と
> 突き合わせて確認すること。フィクスチャが実物とずれていると、テストは通るのに機能は死ぬ。

---

<!-- 新規作成: 2026-08-01, 指示書: docs/codex-tasks/task-73-tournament-coach-wrapup.md -->
