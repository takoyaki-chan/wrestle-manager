# 成形済みプレースホルダ棚卸し v1.0(Stage B P4-2)

- 作成: 2026-09-02。docs/i18n-stage-b-p4-design-v0.1.md「黒田英文体プロトタイプで発見された構造穴1」
  および docs/en-kuroda-style-draft-v0.1.md §4-1 で列挙された約20個の「日本語で組み立てられた
  プレースホルダ充填値」について、生成箇所(ファイル:行)・生成式・テンプレ化難易度を1つずつ確認した台帳。
- **本ドキュメントは調査のみ。修正はまだ行っていない**(P4-2の作業範囲は台帳化まで)。
- テンプレ側(このプレースホルダを埋め込んでいる文全体)は既に `i18n/template-ledger.json` に
  抽出済み(NEWS_HEADLINE_TEMPLATES / GAMELOG_TEMPLATES 等)。ここで扱うのは**その中の1変数だけが
  日本語で組み立てられてしまっている**箇所。テンプレを訳しても、この変数の生成式を直さない限り
  紙面は日本語のまま残る(=「テンプレ台帳」と「生成値の言語糸通し」は別の作業)。

## 難易度の基準

- **LOW**: 固定JA語彙が1〜3種類程度の小さなルックアップ/三項演算子1本。ENの小テーブル1つで解決できる
- **MEDIUM**: 固定文が数種類あり、プレースホルダ内挿も伴う(1つのテンプレ表に追加するだけで足りる規模)
- **HIGH**: 複数のJA文断片を条件分岐で連結している(断片連結)、または生成箇所が1箇所に定まらず
  コードベースに散らばっている。テンプレ表1つでは解決できず、構造ごとの見直しが要る

## 台帳

| # | プレースホルダ | 生成箇所(file:line) | 生成式(要約) | 難易度 | 備考 |
|---|---|---|---|---|---|
| 1 | `{milestone}` | src/management.js `Engine.newspaper.generate()` 内(旧: L31868付近、warMilestone分岐) | `` const milestone = `${wm.wins}勝`; `` | LOW | 同じdataに生の`{wins}`も渡っている(NEWS_HEADLINE_TEMPLATES.warMilestone本文で使用済み)。EN側テンプレは`{wins} wins`のように{wins}を直接使う書き方に倒せば、`{milestone}`という別変数自体が不要になる可能性がある |
| 2 | `{recordLine}` | src/management.js:31638-31639(`scanRosterNews`、winStreakMilestone分岐) | `rec === 'broken' ? '団体記録を塗り替えた。' : rec === 'match' ? '団体記録に王手をかけた。' : ''` | LOW〜MEDIUM | 固定文2種+空文字列の3分岐。ENの2エントリ表で解決可 |
| 3 | `{careerLine}` | (生成箇所なし — 未検出) | — | — | NEWS_HEADLINE_TEMPLATES.retirementDeclare(data.js:17488/17490/17492)がこのプレースホルダを持つが、`ev.type === 'retirementDeclare'`は`Engine.newspaper.generate()`内で早期に専用パス(グレード別バリアント選択+`_fillRetirementTemplate`)へ分岐して`return`しており、汎用テンプレ(この`{careerLine}`入りの3本)には到達しない。**死んだテンプレ変種の疑い**。修正時はテンプレ削除 or 専用パスとの統合のどちらにするか要判断(本棚卸しでは指摘のみ) |
| 4 | `{detail}` | 分散(代表例: management.js:1743 / 4272 / 4304・22235 / 4340 / 7065 / 7183 / 7664 / 10964。app.js側は既にWM_I18N.t()化済み箇所あり: app.js:5364等) | 各所で個別のテンプレートリテラル/三項演算子(例: `` `${stat.toUpperCase()} +${gain} のブレークスルー！` ``、`` `${seasons}シーズンの現役生活` ``) | HIGH | 同名プレースホルダが**イベント種別ごとに全く別の生成式**を持つ「関数内実行文のプール」型の穴(design doc「構造穴2」と同型)。1箇所を直しても他イベントには効かない。イベント種別ごとに生成式を洗い出し、種別ごとの小テンプレへ切り出す地道な作業が必要 |
| 5 | `{entrySummary}` | src/management.js:18403-18406(春のタッグリーグ出場枠発表) | `announcement.rankingSnapshot.map(row => \`${row.name} ${count}枠\`).join('、')` | MEDIUM | 1項目テンプレ「{orgName} {count}枠」+ join。ENは"{orgName} {count} slot(s)"+", "join程度で対応可能(単複処理は要検討) |
| 6 | `{preview}` | src/management.js `eventPreviewParagraph()`(旧: L31505-31526) | `` `本紙が挙げる注目は${named.join('、')}。` `` に条件付きで対戦履歴の一文を追記する断片連結 | HIGH | 「注目選手の列挙」+「対戦履歴があれば追記」の2段階連結。件数・対戦履歴有無で分岐が生まれるため、完全文テンプレ化には変種の洗い出しが要る(runtime-spec構造規約3「断片連結禁止」に反する既存コードでもある) |
| 7 | `{championWatch}` | src/management.js:31544-31545(`buildTenchosenAnnouncementData`)/31568-31569(`buildTenchosenFieldData`) | `previousChampion && ... ? \`前回覇者の${previousChampion.name}にも、4年越しの連覇を期待する声がある。\` : ''`(field版は文言が微妙に異なる第2文) | MEDIUM | 2箇所で微妙に異なる2文+空文字列。ENの2〜3エントリ表で解決可 |
| 8 | `{semi1}` / `{semi2}` | src/management.js:30645-30649(`matchSummary`関数)・30665-30666(呼び出し) | `` `${orgName} ${scoreW}-${scoreL} ${orgName2}${note}` ``(noteはタイブレーク種別で3分岐) | HIGH | スコア行の断片連結。`{finalResult}`と生成関数(`matchSummary`)を共有 |
| 9 | `{finalResult}` | src/management.js:30645-30649・30667(同上`matchSummary`) | 同上 | HIGH | #8と同一生成関数。テンプレ化するなら`matchSummary`自体をEN/JA両対応の完全文テンプレへ作り替える必要がある |
| 10 | `{gauntletNote}` | src/management.js:30651-30656(`Engine.autumnWar.apply`) | `teams.flatMap(...).filter(3人抜き以上).map(f => \`${f.name}が${wins}人抜きを達成した。\`).join('')` | HIGH | 0〜複数件の可変長リストを1文ずつ生成して連結。ENは1件用テンプレ+joinへ分解すれば対応できるが、0件時の空文字列仕様も含めて設計が要る |
| 11 | `{tieBreakNote}` | src/management.js:30657(同上`apply`) | `result.results.filter(タイブレークあり).map(m => \`${決勝/準決勝}は${matchSummary(m)}。\`).join('')` | HIGH | #8/#9の`matchSummary`に依存するため、そちらを解決しない限り単独では直せない |
| 12a | `{closing}`(tenchosenBestBout) | src/management.js:29038-29040 | `best.roundKey === 'final' ? '頂点を決める一番が、そのまま大会の白眉となった。' : '決勝より前に、この大会の頂は一度現れていた。'` | LOW | 固定文2種の三項演算子。ENの2エントリ表で解決可 |
| 12b | `{closing}`(composeDraftPlayerResult内・別変数) | src/management.js:31289、値の出所は `DRAFT_PLAYER_RESULT_PARTS.closing`(data.js:18145,18193付近) | `fillCommon(pickAt(parts.closing, 11))` — 別テーブル(DRAFT_PLAYER_RESULT_PARTS)からのプール抽選 | MEDIUM〜HIGH | 12aとは無関係の別ホール。`DRAFT_PLAYER_RESULT_PARTS`は今回のtemplate-ledger抽出対象**外**(P4指示書の対象14テーブルに含まれない、task-77 §5-D確定文言の専用プール)。翻訳するなら別途この専用プールをP4-3以降の対象に加える必要がある |
| 13 | `{names}` | src/management.js:31279,31286(`composeDraftPlayerResult`内`fillCommon`) | `names.join('、')` | LOW | 固有名詞(選手名)の列挙。日本語文法要素は読点「、」のみ。EN側は", "や"and"での連結に置き換えるだけで済む |
| 14 | `{round}` | src/management.js:29010,29017(天頂戦セミファイナル/ベストバウト記事) | `ROUND_JP = { firstRound: '1回戦', quarterFinal: '準々決勝', semiFinal: '準決勝', final: '決勝' }` のインライン定義+参照 | LOW | 4エントリの固定辞書。tenchosen専用の小テーブルとして切り出しやすい |
| 15 | `{stage}` | src/management.js:3477-3485(`Engine.mq.STAGE_LABELS`)、参照は3526 | `Engine.mq.STAGE_LABELS[metadata.stage] \|\| '興行'` | LOW | 7エントリの固定辞書(既存のnamed lookup)。既に構造化されているのでENの対訳表を1つ足すだけで済む |
| 16 | `{what}` | src/management.js:31743(`buildFollowUp`、followUpRecord分岐) | `rec.type === 'titleWin' ? '戴冠' : '歴代に残る一戦'` | LOW | 固定文2種 |
| 17 | `{how}` | src/management.js:31740(`buildFollowUp`、followUpNewcomer分岐) | `nw.type === 'debut' ? 'デビュー' : '移籍'` | LOW | 固定語2種。他画面で既に英訳済みの語彙(デビュー/移籍)と揃える |
| 18 | `{stat}` | src/management.js:31737(`buildFollowUp`、followUpBreakthrough分岐) | `STAT_LABELS_JP[bt.stat] \|\| 'メンタル'` | LOW | 既存の共有ステータス名辞書(data.js STAT_LABELS_JP)経由。stat-notation-v1.0系の既存/計画中の英語ステータス名表と合流させれば追加作業なしで済む可能性がある |
| 19 | `{body}`(draftPlayerResult) | src/management.js:31276-31317(`composeDraftPlayerResult`)。値の出所は `DRAFT_PLAYER_RESULT_PARTS`(data.js:18121〜、lead/featured/closing) | `{ body: [lead, ...featuredLines, closing].join('') }` — lead/closing/featuredLinesはいずれも`DRAFT_PLAYER_RESULT_PARTS`からのプール抽選+プレースホルダ充填 | HIGH | 記事本文全体が丸ごと専用プール(このプールは「task-77 §5-D: 確定版・一字一句変更不可」という凍結指定つき)から組まれる。#12bと同じプールが出所。ドラフト自団体1面記事を英語化するにはこの専用プール自体をP4-3以降の翻訳対象に加える必要がある(今回のtemplate-ledgerには含まれない) |

## まとめ

- **今回すぐ(小さなテンプレ表の追加だけで)解決できるLOW群**: `{milestone}` `{recordLine}` `{closing}`(12a) `{names}` `{round}` `{stage}` `{what}` `{how}` `{stat}` — 9件
- **1テンプレ表で足りるがENの語順都合で追加設計が要るMEDIUM群**: `{entrySummary}` `{championWatch}` — 2件
- **断片連結・可変長リスト・別プール依存で構造見直しが要るHIGH群**: `{detail}` `{preview}` `{semi1}` `{semi2}` `{finalResult}` `{gauntletNote}` `{tieBreakNote}` `{closing}`(12b) `{body}`(draftPlayerResult) — 9件
- **生成箇所が見つからない(死んだテンプレ変種の疑い)**: `{careerLine}` — 1件、要Fable裁定

HIGH群のうち `{semi1}`/`{semi2}`/`{finalResult}`/`{tieBreakNote}` は同じ `matchSummary()` 関数(秋の4団体勝ち残り対抗戦)に依存しており、そこを1本直せば4項目まとめて解決する。`{closing}`(12b)と`{body}`(draftPlayerResult)はどちらも `DRAFT_PLAYER_RESULT_PARTS` という専用プールが出所で、これも1つの作業(専用プールの翻訳インフラ整備)でまとめて片付く。実質的な独立ワークアイテムは「detail分散処理」「preview断片連結の再設計」「matchSummary系の完全文テンプレ化」「DRAFT_PLAYER_RESULT_PARTS専用プールの翻訳対応」の4件+careerLineの裁定、という粒度で捉えるとP4-3以降の見積りがしやすい。
