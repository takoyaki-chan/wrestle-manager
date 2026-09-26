# 画面：長引く抗争の2択(F06 強制発火 / F06_FORCE)

**ファイル**：`docs/ui/03-screens/faction-f06-force.md`
**最終更新**：2026-09-26
**実装状況**：完了(2026-09-26。Keisuke のレビュー・実機確認待ち — docs/実機確認バックログ.md)

> 仕様の正は `specs/faction-rivalry-points-spec-v0.1.md` §4.3(40週強制和解)・§5.4(reason別の効果)。
> 2026-09-26 総点検 第4回の確認4(Keisuke 裁定):「40週の和解させる/続けさせるの2択を仕様どおり作る。
> 節目の全画面演出にはせず、いつものモーダルの大きさ」。

---

## 基本属性

| 項目 | 値 |
|---|---|
| 所属カテゴリ | Office(応接室型。F06 和解の兆し・F08 対立ヒートアップと同じ報告カード) |
| パネル様式 | Cream Panel(報告カード本体)+ Dark Panel(コーチの報告帯 `.fevt-reporter-strip`) |
| レイアウトパターン | モーダル(A-4 派生。`.fevt-overlay-office` > `.fevt-report-card`) |
| 所属シーケンス | なし(2-D Events の派閥イベント) |
| 使用フォント | Noto Sans JP(本文)+ Bebas Neue(PT の数値・選択肢の記号)+ Oswald(役割ラベル) |
| 実装ファイル | `src/ui-common.js` `showFactionF06ForceModal` / `src/app.js` `App.handleFactionEvent`(F06_FORCE 分岐)・`FACTION_AUDIO_MAP.F06_FORCE` / `src/index.html` `.fevt-report-card.f06f` / `src/data-faction-dialogue.js` `FACTION_F06_FORCE_AHEAD_LINES`・`FACTION_F06_FORCE_BEHIND_LINES` / エンジン `src/factions.js` `buildF06ForcePayload`・`isF06ForceStillValid`・`applyF06ForceChoice` |

---

## 目的

先取100に届かないまま40週続いた派閥抗争について、社長が「ここで幕を引くか、最後までやらせるか」を決める場所。
両リーダーの一言と、いまの抗争ポイント(進行度)を見せて判断させる。**抗争の打ち切りは社長の手が届く範囲**(興行の場づくり)であり、
試合そのものには触れない。

節目ではない(抗争が長引いたという報告)ので、全画面の演出にはしない(01-foundations 原則11)。

---

## 遷移

- **入ってくる経路**：週送り(`processWeek` → `Engine.tickWeek`)の派閥パイプラインで `checkRivalryResolution` が40週(B を選んだ記録は選んだ週から +20週)に達した記録を見つけ、`_pendingFactionEvent = { eventId: 'F06_FORCE', payload }` を立てる → 週の画面に着地したあと、ほかの派閥イベントと同じ経路(app.js の派閥モーダル表示 → `App.handleFactionEvent`)で開く。興行結果の画面を閉じたときの経路(closeShowResult)も同じ
- **出ていく経路**：A または B のカードを押す → 報告カードが閉じる → 結果モーダル(`showFactionEventResult`、A=「抗争の幕引き」/ B=「抗争続行」)→「— 見 届 け る —」で週の画面へ戻る
- **戻る挙動**：戻る・閉じるボタンなし。選択は必須(選択を迫るものは専用ボタンのみ — mockup-baseline §5-C)

---

## 骨格ワイヤーフレーム

```
┌─ Office Backdrop (.fevt-overlay-office) ─────────────────────────────┐
│ ┌─ Report Card (.fevt-report-card.f06f, Cream) ────────────────────┐ │
│ │ ⏳ 長引く抗争                 WEEK 22 ・ 4Y ・ 抗争40週目        │ │ ← 見出し帯: 橙(--accent-hostility)
│ │ ┌─ Reporter Strip (Dark, chip 46×66 + 吹き出し) ───────────────┐ │ │
│ │ │ [コーチ] 「両派閥とも、決着がつかないまま長くなりました。…」 │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │ ┌─ Subject Stage (.u3b-theme-cream / .fevt-subject-duel) ──────┐ │ │
│ │ │   ┌吹き出し(予約枠52px)┐          ┌吹き出し(予約枠52px)┐   │ │ │
│ │ │   └────────▼──────────┘          └────────▼──────────┘   │ │ │
│ │ │   [リーダーA M 132×194]    VS    [リーダーB M 132×194]      │ │ │
│ │ │    名前                              名前                    │ │ │
│ │ │    ○○派 ・ LEADER                    △△派 ・ LEADER          │ │ │
│ │ │    PT 62                             PT 41                   │ │ │
│ │ │  ──────                                                      │ │ │
│ │ │  抗争が始まって、もう40週になる。どちらの派閥も…(地の文)   │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │  この抗争を、社長としてどう扱いますか？                          │ │
│ │ ┌─[A] 和解させる──────────┐  ┌─[B] 続けさせる──────────┐        │ │
│ │ │ ポイントは白紙に戻し…   │  │ ポイントはそのまま持ち越す…│        │ │
│ │ └──────────────────────────┘  └──────────────────────────┘        │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 構成要素（使用コンポーネント）

- 報告カード `.fevt-overlay-office` > `.fevt-report-card.f06f`(F06/F08 と同じ枠。テーマ色だけ `f06f`)
- 報告帯 `_factionReporterStrip(state, line, true)`(コーチ、コーチ不在なら古参選手。chip 46×66)
- 対置の顔出し `_u3bSideHtml` ×2(`.fevt-subject-duel` の中。F08 と同じ M 132×194・`portraitClass: 'fevt-duel-portrait'`)
  - 吹き出し `.u3b-bubble`(co-class `.fevt-bubble left/right`)— 画像の上・予約枠・中身はセリフだけ。`.fc1m-bubble` 系の頭上吹き出しを統一した現行の部品
  - 役割ラベル「{派閥名} ・ LEADER」/ 数値行「PT {抗争ポイント}」
- 観察メモ `.fevt-observation-note`(地の文。吹き出しにしない)
- 2択 `.fevt-decision-tray.two` > `.fevt-decision-card[data-choice="A"|"B"]`
- 結果 `showFactionEventResult`(主役=抗争ポイントの先行側のリーダー。同点なら A 側)

新規コンポーネントなし。新規 CSS は見出し帯の色 `.fevt-report-card.f06f` の2行だけ(トークンのみ)。

---

## 情報階層（視線誘導の優先順位）

1. 両リーダーの顔と一言(どちらが「まだやる」と言い、どちらが疲れているか)
2. 両者の抗争ポイント(PT。どちらが先行しているか)
3. 観察メモ(何週続いているか・ロッカールームの空気)
4. 2択のカード(A 和解させる / B 続けさせる)
5. 見出し・コーチの報告(文脈)

---

## 特有ルール

- **一言は立ち位置で表を分ける**：抗争ポイントが相手より多い側は `FACTION_F06_FORCE_AHEAD_LINES`(先行側)、同点・少ない側は `FACTION_F06_FORCE_BEHIND_LINES`(並んでいる/追う側。同点でも使うので「負けている」とは言い切らない)。第一分岐はアーキタイプ(口調)、欠けた性格は同じ口調の normal へ落ちる(`Engine.factions.getFactionLine`)。乱数は週で決まる(`Engine.rng.derive(rngSeed, season, week, 0xFA6A/0xFA6B)`)
- **数値は進行度だけ**：PT は spec §6 の「ポイント数値を表示」に従う。**強制和解までの残り週数は出さない**(§6/§9 — 決まっている印象を避ける)。B の説明も「当面は口を出さない」までで、+20週 は書かない。「抗争○週目」は出す(§6)
- **いつものモーダル**：全画面の暗転・スライド進行はしない(原則11)。見出し帯の色は常設の対立の橙(赤は開戦級のみ)
- **1操作=1進行**：カードは最初の1回だけ通す(`decided` フラグ)。閉じ始め(600ms)の押し直しで2回選ばれない
- **pending の自浄**：出すまでの間に記録が決着した・派閥が消えた・同じ組の記録が作り直された場合は、説明を出さずに取り下げる(`isF06ForceStillValid`。§5-D 鉄則6)
- **UI は G を直接変えない**：選択の反映は `Engine.factions.applyF06ForceChoice(G, payload, choiceId)` の戻り値だけ
  - A: 記録を閉じる(`factionTimeline` に `RIVALRY_CLOSED` / reason `F06_RECONCILE`)・両方向 hostility −30・勝者敗者の効果なし・F08/F09 のクールダウン(決着後の即時再発火防止)。業界ニュース `factionReconcile`(F06 の和解と同じ型)
  - B: ポイントを残し、次の判定を選んだ週から +20週 後に(`forceCloseDeferredUntil`)
- **BGM**：`TENSION` を低めの音量(0.12。F02_ENDLESS と同系統)。stinger なし
- **auto-sim / headless**：自動プレイヤーは A/B を等確率で選ぶ(ほかの派閥イベントの自動応答と同じ)

---

## 状態バリエーション

| 状態 | 表示 |
|---|---|
| 通常 | 上記レイアウト。両リーダーが吹き出しで一言 |
| 同点 | 両側とも BEHIND の表から一言 |
| リーダーがロスターにいない(同じ週に引退・離脱) | 名前は payload の名前、画像なし、一言は標準の口調(standard×normal)。派閥が残っていれば2択は出す |
| 記録/派閥が消えた | 出さない(静かに取り下げ) |
| 大型イベント(B1〜B4)と同じ週 | 派閥モーダルは翌週へ持ち越し(既存の派閥イベントと同じ)。「抗争○週目」は表示する週で数え直す |

---

## 関連トークン

- `--accent-hostility-rgb` / `--accent-hostility-deep`(見出し帯・見出し文字)
- `--office-panel-cream` / `--cream-text-main` / `--cream-text-sub` / `--cream-text-dim` / `--cream-gold`(既存の報告カード部品が使う)
- `.u3b-theme-cream`(顔出しブロックの配色)

---

## 階層1・2への参照

- 階層1：Office カテゴリ(Cream Panel の報告カード+Dark Panel の報告帯の同居は §1-6 で許可)。原則11「全画面セレモニー級は節目専用」— 本画面は節目ではないのでいつものモーダル。色は常設の対立=橙
- 階層2：2-D Events の派閥イベント(F06/F08 と同じ応接室型)。2-D-X 顔出しの共通ルール(吹き出しは画像の上・予約枠・名前を入れない・縦の並び順固定)
- mockup-baseline：§2 M 132×194(2人を対置)/ §3 吹き出し / §4 縦の並び順 / §5-C 選択を迫るものは専用ボタンのみ / §5-D 鉄則2・6

---

## 未決事項

- 一言(38行)と地の文の文面は Keisuke の全文レビュー待ち(完了報告に全文)
- A の結果で「ロッカールームの空気」などの二次効果を持たせるか(spec §5.4 は hostility −30 のみ。今回は仕様どおり)
- ~~先取100の決着(`applyRivalryVictory` の POINTS)の勢い・信頼・絆・hostility の効果が入っていない既存の不具合~~ → 2026-09-26 修正済み(Keisuke 裁定「仕様どおり効かせる」。specs/faction-rivalry-points-spec-v0.1.md §5.5)。F06_RECONCILE(この画面の A)は従来どおり勝者敗者の効果なし
