# セリフ軸入れ替え 棚卸し（着手前の全数調査）

作成 2026-08-01。`src/*.js` を実際にパース・評価して数えた実測値であり、仕様書からの転記ではない。
再生成スクリプトは本文末尾に添付。

対象は3件:

1. **軸入れ替え** — `[性格][アーキタイプ]` → `[アーキタイプ][性格]`
2. **旧キー `normal` の改名** — アーキタイプ位置に残った `normal` を `standard` へ
3. **書き出せない4テーブル** — 原因判明。1・2 とは無関係だった

---

## 0. 先に結論

| 件 | 実測 | 前セッションの見積り | 判定 |
|---|---|---|---|
| 1. 軸入れ替え | **234ヶ所**（別名テーブル除外後） / 88テーブル / 11,314本 | 254箇所 | ほぼ一致（数え方の差） |
| 2. 旧キー `normal` | **31テーブル** / 258ヶ所 / 758本 | factions.js の14テーブル | **範囲が違う。派閥だけの話ではない** |
| 3. 書き出せない4テーブル | 4件とも**削除済み定数**。`app.js:1884` とは無関係 | パースエラーと関係の可能性 | **仮説は外れ** |

「ヶ所」の定義 = **キーがすべて性格で、その直下がアーキタイプ辞書になっている辞書オブジェクト1個**。
入れ替え作業の最小単位がこれなので、これを数えている。

---

## 1. 軸入れ替え（本体）

### 1-1. 規模

| ファイル | テーブル | 入替辞書 | 影響セリフ |
|---|---:|---:|---:|
| `src/data.js` | 64 | 206 | 9,343 |
| `src/data-faction-dialogue.js` | 14 | 14 | 241 |
| `src/tag-battle-lines.js` | 6 | 6 | 784 |
| `src/victory-lines.js` | 2 | 4 | 379 |
| `src/battle-engine-main.js` | 1 | 3 | 441 |
| `src/battle-lines.js` | 1 | 1 | 126 |
| **合計** | **88** | **234** | **11,314** |

`EVENT_LINES_BY_KEY`（18ヶ所 / 969本）は上表から除外済み。
中身は `draftJoin: EVENT_DRAFT_JOIN_LINES` のような**参照だけの別名テーブル**で、
実体は個別テーブル側にある。触るのは実体だけでよく、別名は自動的に追従する。

### 1-2. 読み出し側（先に数えた）

データを動かすと同時に、引く側も直す必要がある。実測:

- `[personality]` の形で添字する行 … **50行**（`lz-string.min.js` の1件は無関係の誤検出）
- そのうち実際のセリフ引きヘルパー … `src/factions.js` 12 / `src/tag-battle-lines.js` 9 /
  `src/app.js` 8 / `src/data.js` 7 / `src/management.js` 4 / 他

**234ヶ所のデータ移動に対して、コード側は数十行**。ここが今回いちばん重要な数字で、
データ量に比べて読み出し側は薄い。ヘルパーはほぼ同じ形をしている:

```js
// src/tag-battle-lines.js:762
const byP = table[p] || table.normal;
return byP[a] || byP.normal;
```

```js
// src/battle-engine-main.js:777
const byP = section[personality] || section['normal'];
return byP[archetype] || byP['normal'] || null;
```

同じ流儀が `app.js:8115` / `app.js:9059` / `app.js:10483` / `factions.js:4450` / `factions.js:4544` にもある。
**入れ替え後はこの2行を上下逆にするだけ**で済む形が大半。

### 1-3. 段階分けの提案

1操作あたりの Excel 確認が現実的な粒度で、かつ**読み出しヘルパーが1個で閉じている**順に並べた。

| 段 | 対象 | 入替辞書 | セリフ | 読み出しヘルパー |
|---|---|---:|---:|---|
| S1 | `tag-battle-lines.js`（6テーブル） | 6 | 784 | `_tagLineArrFor` 1個だけ |
| S2 | `battle-lines.js` + `battle-engine-main.js` | 4 | 567 | `_pickSerif` / `_getCutinLines` |
| S3 | `victory-lines.js`（2テーブル） | 4 | 379 | 2ヶ所 |
| S4 | `data-faction-dialogue.js`（14テーブル） | 14 | 241 | `factions.js` の2ヘルパー |
| S5〜 | `data.js`（64テーブル） | 206 | 9,343 | カテゴリ別に分割（下表） |

**S1 を先頭に置く理由**: 6テーブルすべてが `_tagLineArrFor` 1個からしか引かれていない。
ここで手順（データ移動 → ヘルパー反転 → 書き出し → Excel確認）が正しいと分かれば、
残りは同じ手順の反復になる。逆に S1 で壊れれば、壊れた場所は6テーブル + 関数1個に閉じ込められる。

`data.js` のカテゴリ別内訳（段の切りどころ）:

| カテゴリ | 入替辞書 | 主なテーブル |
|---|---:|---|
| 12 選手経歴 | 29 | `EVENT_*_LINES` 11種（1テーブル1辞書ずつ） |
| 13 Glimpse | 27 | `GLIMPSE_A_LINES`(11) / `GLIMPSE_B_LINES`(15) |
| 11 選択・大型・社長室 | 35 | `CHOICE_EVENT_DIALOGUES`(13) / `CARE_REACTION_DIALOGUES`(11) / `LARGE_EVENT_DIALOGUES`(10) |
| 05 引退・引き抜き | 25 | `RETIREMENT_LINES`(8) / `RETIRE_ACCEPT_LINES`(5) |
| 03 因縁・絆 | 23 | `RIVALRY_CONFRONTATION_LINES`(4) / `RIVALRY_RESOLUTION_LINES`(4) |
| 14 PPV・対抗戦 | 20 | `JUNIOR_TOURNAMENT_LINES`(7) |
| 08 成長・スランプ | 18 | `MILESTONE_LINES`(6) |
| 10 ニュース・通知 | 16 | `SNAPSHOT_TEXTS`(10) / `NOTIF_DIALOGUES`(6) |
| 06 契約交渉 | 15 | `CONTRACT_NEGOTIATION_LINES`(11) |
| 09 表彰・ドーム | 8 | `AWARD_LINES`(6) |
| 01 試合本編 | 5 | `POST_MATCH_FLAVOR_LINES` / `FAN_EXPECT_REACTIONS` |
| 07 派閥（data.js側） | 1 | — |
| 18 / 19 | 3 | `ENDING_LINES` / `SCOUT_GREETING_LINES` / `FA_GREETING_LINES` |

---

## 2. 旧キー `normal` の改名 — 前提が違っていた

前セッションの引き継ぎは「`factions.js` の未改名14テーブル」。
実測すると、**アーキタイプ位置に `normal` が残っているのは31テーブル・6ファイル**で、
派閥はそのうちの一部にすぎない。

| ファイル | テーブル | `normal`辞書 | 旧キー配下のセリフ |
|---|---:|---:|---:|
| `src/data-faction-dialogue.js` | 16 | 101 | 235 |
| `src/data.js` | 5 | 65 | 260 |
| `src/tag-battle-lines.js` | 6 | 42 | 112 |
| `src/battle-engine-main.js` | 1 | 21 | 63 |
| `src/flag-dialogue.js` | 1 | 21 | 63 |
| `src/battle-lines.js` | 2 | 8 | 25 |
| **合計** | **31** | **258** | **758** |

`data.js` 側の内訳が特に見落としやすい: `F07_LINES`(37ヶ所/222本) / `FACTION_F02_LINES`(12) /
`COMMON3_LINES`(7) / `FACTION_TRANSITION_LINES`(6) / `AUTUMN_WAR_MATCH_LINES`(3)。
`AUTUMN_WAR_MATCH_LINES` は派閥でもタッグでもないので、「派閥まわりだけ」で括ると取りこぼす。

### 2-1. ゲームは壊れていない（が、Excel は壊れている）

`ALL_CHARS` の archetype 分布は `standard:33 / polite:30 / composed:20 / seductive:19 / delinquent:13 / cool:7 / ojousama:5`。
**最大勢力の33名が `standard`** なのに、31テーブルのキーは `normal` のまま。

ただし引く側がすべて `byP[archetype] || byP.normal` の形でフォールバックを持っているため、
`standard` の子は `normal` バケツに落ちて**正しい内容が出ている**。中身は同じものなので実害はない。

実害が出ているのは Excel 側。`detectMeta`（`tools/dialogue-workbook.js:113`）は task-68 以降
`normal` を**性格キーとしてのみ**認識する。その結果:

- `HOT_TAG_LINES.bold.normal[1]` → 性格=強気 / **アーキタイプ=空**
- `HOT_TAG_LINES.bold.delinquent[1]` → 性格=強気 / アーキタイプ=ヤンキー

**同じテーブルの中で、標準アーキタイプの行だけが `キャラタイプ別/` に振り分けられず落ちる**。
これが「アーキタイプ列が空のまま」の正体。

### 2-2. 順序の提案 — 改名を先にやりたい

引き継ぎでは 1（入替）が本体、2（改名）が付随という並びだったが、**逆を勧める**。理由:

- 改名は純粋なキー名置換で、フォールバックがあるため**ゲーム挙動がまったく変わらない**。
  「書き出し直して、標準アーキタイプの行が `キャラタイプ別/` に現れるか」だけで検証が閉じる
- 改名を済ませてから入れ替えれば、入替後の Excel を見たとき
  「アーキタイプ列が空 = 入替の失敗」と一意に読める。今のままだと空欄が2つの原因を持つ
- 逆順（入替→改名）にすると同じ行を2度書き換えることになり、Excel の再書き出しも2周

---

## 3. 書き出せない4テーブル — 原因判明

`BESTMATCH_FLAVOR` / `AI_BREAKTHROUGH_NEWS` / `AI_SLUMP_NEWS` / `AI_MOTIVATION_LOSS_NEWS`。

**4件とも `src/` にもう存在しない。** コミット `c79a3ba`（2026-07-26,「AI団体の覚醒を新聞に載せた + 役目を終えた定数7件を削除」）で
`STYLE_GROWTH` / `STAR_POWER` / `CONTRACT_NEGOTIATION_CONFIG` と一緒に削除された。
`tools/extract-dialogue.js` の `TABLE_MANIFEST` に登録行だけが残っている。

**対処**: `TABLE_MANIFEST` から4行削除するだけ（`extract-dialogue.js:99, 204, 205, 206`）。
`docs/dialogue/` に残っている該当節も次回の書き出しで自動的に消える。

### 3-1. `app.js:1884` は別件（ただし本物のバグ）

`[WARN] parse error in app.js for "Storage" (line 1884): unterminated` の原因は、
`tools/extract-dialogue-parser.js` の `scanExpr` が**正規表現リテラルを理解しない**こと。

```js
// src/app.js:1902（Storage._sanitizeFilenamePart 内）
const safe = label.replace(/[\/\\:*?"<>|]/g, '_').trim();
```

この正規表現の中の `"` をスキャナが文字列の開始と誤認し、そこから括弧の対応が崩れて
`const Storage = {` の閉じ括弧を見つけられなくなる。

**現時点の実害はゼロ**。`Storage` はセリフテーブルではないし、エラー時に `declRe.lastIndex` を進めないため
後続の宣言（`App._NEWSPAPER_HEADLINES` など）は正常に拾えている。実測でも評価エラーは0件。

ただし**将来のセリフテーブルが同じ形の正規表現をまたいだ瞬間、そのテーブルは黙って消える**。
今回のように「なぜか Excel に出てこない」として現れるので、`scanExpr` に正規表現リテラルの
判定を足しておくのが安い。4テーブルの削除とセットで片付けたい。

---

## 3.5. 進捗（2026-08-01 深夜）

| 段 | 内容 | 状態 |
|---|---|---|
| — | ツール土台（正規表現リテラル対応 / 削除済み定数4件） | 完了 `71aea14` |
| — | 旧キー `normal` → `standard`（31テーブル / 258ヶ所） | 完了 `638f247` |
| S1 | タッグ6テーブル（6ヶ所 / 784本） | 完了 `8a5e805` |
| S2 | ダメージセリフ・カットイン（4ヶ所 / 567本） | 完了 `916a261` |
| S3 | 元雇用団体戦（1ヶ所 / 196本） | 完了 `0593d8a` |
| S4 | 派閥セリフ24テーブル（24ヶ所 / 314セル） | 完了 `f0be764` |
| S5 | 残り 211ヶ所 / 65テーブル | 完了 `625bbde` |
| Q3 | 読み手のいない派閥6テーブルを削除（104本） | 完了 `aeb0102` |
| Q4 | 旧語彙 594ヶ所を現行の性格7種へ | 完了 `277ac2f` |
| Q6 | 黒田記者の目16件を反映 + Excel 再書き出し | 完了 `f42a53d` / `21b0752` |

**軸入れ替えは全完了（2026-08-01）。** 残は Keisuke 実機確認。

### S5 を分割できなかった理由（記録）

読み手を数え直したところ、**`getDialoguePool`（`src/data.js:14879`）が中心にいた**。
`data.js` / `management.js` / `relationships.js` / `ui-common.js` / `app.js` の23ヶ所以上が
この1関数を通っており、残り65テーブルの大半がここに集まる。

この関数を反転させた瞬間、それが serve している全テーブルが同時に切り替わる。
つまり「テーブル1つずつ確認しながら」は物理的にできない。S1〜S4 のように
系統ごとに切れたのは、それぞれ専用の読み手を持っていたから。

### S5 で反転が必要な読み手（全数）

| # | 読み手 | 場所 | 対象 |
|---|---|---|---|
| 1 | `getDialoguePool` | `data.js:14879` | 大半のテーブル（23ヶ所以上から呼ばれる中心） |
| 2 | `getJuniorTournamentLine` | `data.js:16221` | `JUNIOR_TOURNAMENT_LINES` |
| 3 | `getAutumnWarMatchLine` | `data.js:16233` | `AUTUMN_WAR_MATCH_LINES` |
| 4 | `App.resolveDomeLine` | `app.js:11964` | `DOME_FIRSTSHOW_LINES` / `DOME_SELLOUT_LINES` |
| 5 | `_warVictoryLine` | `ui-common.js:1069` | `WAR_VICTORY_LINES` |
| 6 | `Engine.relationships._resolveVoice` | `relationships.js:4401` | 汎用（Glimpse 等） |

`factions.js` の `getCommon1Line` / `getCommon5Line` / `getF02Line`（3189 / 3354 / 5528 行）は
旧語彙（`fiery` / `grudging` / `flippant` / `introverted` / `carefree`）で分岐しており、
性格7種・アーキタイプ7種のどちらの体系にも乗っていない。**S5 の対象外**とし、
別途「語彙を現行体系に寄せるか」を決める必要がある。
`F07_LINES` は既に `[archetype][personality]`（新形式）なので対象外。

### S5 の検証計画（S1〜S4 と同じ）

1. 入れ替え前に、全 swap 対象辞書 × 全（性格8 × アーキタイプ8）で読み手の出力を記録
2. データ組み替え（`tools/axis-rewrite.js swap --write`）+ 上表6ヶ所の反転
3. 同じ probe を回し、差分を1件ずつ確認する

S1〜S4 ではこの手順で 2,112 エントリ中 12件の差分に絞り込め、その12件が
すべて意図した方向であることを確認できた。

---

## 4. 実測の再現方法

本ドキュメントの数値を出したスクリプトは
`%TEMP%\claude\...\scratchpad\` 配下に置いてある（`axis-inventory.js` / `swaplist.js` / `unrenamed.js` / `probe.js`）。
いずれも `src/` を読むだけで書き込まない。恒久的に使うなら `tools/` に移して、
各段階の作業後に「入替辞書が減っているか」「`normal` 辞書が減っているか」の検算に使える。
