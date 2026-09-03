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


## P4-3aで発見された追加の成形済み値11種(2026-09-02・見出し族20種とは別系統)

いずれも英文側は「値を文法に埋めない」形で防御済みだが、生成元が日本語を出す:
`{phase}`(序盤/中盤/終盤 management.js:30790) / `{tone}`(名勝負/好勝負/熱戦 31912) / `{stamp}`(第N年度・第M週 31863,31907) / `{result}`(勝ち越し/敗北 31861) / `{crowdLabel}`(data.js:1332 FILL_PRESSURE_BANDS) / `{tierLabel}`(management.js:16170 Engine.scout.TIERS) / `{label}`(1961) / `{outcome}`(ui-common.js:6940) / `{wanted}`(management.js:23387) / `{changes}`(saveDoctor) / `{scoutDiscSuffix}`(app.js:5354)

**即効の2件**: `{tierLabel}`と`{wanted}`は英訳がui-ledgerに既存 — 生成元にt()を1個ずつ足すだけで解決。
確認済みで対処不要: `{oldLabel}`/`{newLabel}`(HEAT_LEVELSは既に英語)/`{ejectedSuffix}`/符号付き数値文字列。

## P4-3bで発見された追加の成形済み値4種(2026-09-02、NEWS見出し英訳作業中に発見)

| # | プレースホルダ | 生成箇所(file:line) | 生成式(要約) | 難易度 | 備考 |
|---|---|---|---|---|---|
| 20 | `{titleName}` | src/management.js `Engine.mq.checkTopChampionInjury()` | `` titleName: `${orgName}王座` `` | LOW | `{orgName}王座`という1個のプレースホルダ付き文字列に還元できる。ENは`{orgName} Championship` |
| 21 | `{injuryType}` | src/data.js:3850 `injuryLabel()`(呼び出し元は`scanRosterNews`のlongInjury分岐など多数) | `INJURY_LABEL[type] \|\| String(type)` の4エントリ固定辞書 | LOW | `injuryLabel()`自体は既存のnamed lookupヘルパー。第2引数dictを足すだけで済む |
| 22 | `{result}` | src/management.js `Engine.mq._resolveBignewsDebut()`(白星/黒星、hotProspectDebut) / `Engine.kaigan.industryEvent()`(勝利/敗戦、kaiganAwakening) | 2箇所とも`勝敗フラグ ? 'A' : 'B'`の2値三項演算子(語彙は箇所ごとに別) | LOW | 生成元2箇所。どちらも既に`won`相当の真偽値をローカルに持っている |
| 23 | `{names}`(draftRoundup版) | src/ui-common.js:6502(`_queueDraftIndustryNews`) | `` top.map(p => `${p.name}（${TIER_LABEL[p.tier]}）`).join('、') `` | LOW | 項目12/13の`{names}`(composeDraftPlayerResult側)とは無関係の別ホール。tierが日本語で混入。ui-common.js内(UI層)なのでWM_I18N.t()を直接呼べる |

## P4-4実装ログ(2026-09-03)

上記のLOW全件+MEDIUM2件を実装した。HIGH群(#4 detail / #6 preview / #8 semi1・semi2 / #9 finalResult /
#10 gauntletNote / #11 tieBreakNote / #12b closing(draftPlayerResult) / #19 body(draftPlayerResult))は
台帳どおり保留。`{careerLine}`(#3)は死んだテンプレ変種の疑いのままFable裁定待ちで保留。

### 実装した項目と方式

**Engine層(management.js/data.js)は既存の`opts.dict`/`opts.lang`糸通し(i18n-runtime-spec §6)に
沿って`dict`引数を足す方式**。**UI層(app.js/ui-common.js)はWM_I18N.t()を直接呼ぶ方式**
(runtime-spec §2構造規約1どおり、Engineは引き続きWM_I18Nを直接参照しない)。

- **#1 `{milestone}`**: `dict('{wins}勝')`+fillTemplateVars化(generate()内、dict直接利用)
- **#2 `{recordLine}`**: push時点(scanRosterNews)では従来どおりJAを焼くが、render時点
  (generate()内の業界ニュース汎用パス)で`data.recordState`('broken'/'match')から
  dict経由で改めて組み立て直す方式に変更(下記「アーキテクチャ」参照)
- **#5 `{entrySummary}`**: JA「Name N枠」/EN「Name: N slot(s)」で区切り文字・単複処理まで
  異なるため、advanceWeek内で`opts.lang`による構造分岐(dict()の単純な語彙差し替えでは
  対応しきれないMEDIUM項目として、audit記載どおりの設計判断)
  ※ 単複語尾(`slot`/`slots`)は実装したが、"3 slots"のような基数詞側の言語規則(a/anや
  可算/不可算)までは踏み込んでいない(既存の{v:man}通貨フィルタと同様、最低限の単複のみ)
- **#7 `{championWatch}`**: `buildTenchosenAnnouncementData`/`buildTenchosenFieldData`に
  dict引数を追加、`fillTemplateVars(dict('前回覇者の{name}に...'), {name})`化
- **#12a `{closing}`(tenchosenBestBout)**: #14と同じrender時点再構築方式(下記参照)
- **#13 `{names}`(composeDraftPlayerResult側)**: **実装保留**。当初LOW判定だったが、
  この関数の出力(`body`)全体が`DRAFT_PLAYER_RESULT_PARTS`という未翻訳の凍結専用プール
  (#12b/#19と同一ホール)に依存しており、`{names}`の区切り文字だけ直しても本文全体が
  日本語のまま残るため実質的な効果が無い。#12b/#19とまとめて「専用プール翻訳インフラ整備」
  という1つの作業に先送りする(台帳の元々の記述どおり)
- **#14 `{round}`**: render時点再構築方式(下記参照)
- **#15 `{stage}`**: `Engine.mq.STAGE_LABELS`は既存のnamed lookupのまま、
  `_pushRecordNews`のpush dataに`stageKey`(生キー)を追加し、render時点で
  `Engine.mq.STAGE_LABELS[stageKey]`をdict経由で引き直す
- **#16〜18 `{what}`/`{how}`/`{stat}`**: `buildFollowUp(state, dict)`に統一、
  generate()内の呼び出し元からdictを渡す
- **#20 `{titleName}`**: render時点再構築方式(下記参照)
- **#21 `{injuryType}`**: `injuryLabel(type, dict)`に第2引数を追加(既定省略時はJA原文のまま、
  11箇所ある既存呼び出し元は無改修で不変)。longInjuryのpushで`injuryTypeRaw`(生キー)を
  追加し、render時点で`injuryLabel(injuryTypeRaw, dict)`を呼び直す
- **#22 `{result}`**: hotProspectDebut/kaiganAwakeningのpush dataに`won`(真偽値)を追加し、
  render時点でdict経由の値へ組み立て直す
- **#23 `{names}`(draftRoundup版)**: ui-common.js内でWM_I18N.lang分岐(JA:「name（tier）」
  読点区切り/EN:「name (tier)」カンマ区切り、全角/半角括弧も言語で揃える)

### アーキテクチャ: industryNewsキューの「render時点再構築」パターン

`{titleName}`(#20)/`{injuryType}`(#21)/`{recordLine}`(#2)/`{round}`+`{closing}`(#14/#12a)/
`{result}`(#22)/`{stage}`(#15、mqAllTimeRecord・mqTagRecord)は、いずれも
`Engine.industryNews.push()`で**発生した週にキューへ積まれ、掲載枠(一面1+サブ数本)の
空きが出るまで最大数週間キューに滞留してから紙面化される**という共通の構造を持つ
(2026-07-27の持ち越し実装以降)。push側の関数(`checkTopChampionInjury`/`scanRosterNews`/
`Engine.ppvTournament.apply`/`Engine.mq._resolveBignewsDebut`/`Engine.kaigan.industryEvent`/
`_pushRecordNews`)は`opts`/`dict`を持たない深いtickWeek内から呼ばれるため、
そこでJA/EN確定の値を焼くとpush時点のlangに固定されてしまう(将来プレイヤー向け言語切替が
入ったとき、切替前に積まれたキューが古い言語のまま紙面に出る不整合の芽になる)。

このため、push側では**加工前の生キー**(`orgName`・`injuryTypeRaw`・`recordState`・
`roundKey`・`won`・`stageKey`)を`data`に追加で持たせ、実際に紙面へ載る瞬間
(`Engine.newspaper.generate()`内、dictが揃っている場所)で新設の
`_wmResolvePreformattedIndustryData(ev, dict)`が生キーから改めて言語別の値を組み立て直す。
生キーが無い(=このコミットより前に積まれた旧セーブのキュー)場合は、pushされた時点の
値をそのまま使う(fail-open、後方互換。1〜数週間で消化されるキューなので実害は限定的)。

### `formatCoachRequest`(`{wanted}`即効2件のうち)の実装範囲

`Engine.shachoshitsu.formatCoachRequest(req, dict)`にdict引数を追加し、
`{g}級のコーチ`/`{label}に強いコーチ`(いずれもui-ledgerに既存訳あり)へfillTemplateVars化した。
**呼び出し元3箇所のうち app.js:14679 のみ`WM_I18N.t`を渡すよう修正した**。
management.js:13607(旧文字列`events.push()`、i18n-runtime-spec構造規約4の「旧文字列エントリは
無変換で共存」の対象)と ui-render.js:5284 は今回のタスク範囲外(前者は仕様上グランドファーザー、
後者は本タスクの「触ってよいファイル」リストにui-render.jsが含まれないため未修正)。
ui-render.js側の秘書パネル表示は、EN切替後もこの1箇所だけJAのまま残る**既知の残課題**。

### `{tierLabel}`実装範囲

`Engine.scout.getTierConfig(...).label`の値をgameLogの`data.tierLabel`として積む6箇所のうち、
app.js側4箇所(fighter_signed/fighter_signed_overflow/scout_signed/scout_acquired)を
`WM_I18N.t(tierCfg.label)`化した。ui-common.js側2箇所(draft_player_acquired等、
composeDraftPlayerResult系のgameLog)は今回未着手(「ui-common.js:6501等」の指示範囲は
draftRoundupの`{names}`を指しており、この6箇所は含めていない)。

### `{label}`(1961)/`{changes}`(saveDoctor)は「確認済み・対処不要」に変更

P4-3aでは要調査のまま11種の一部として残っていたが、本セッションで生成元を確認した結果:
- `{label}`(management.js:1961・1974付近、rivalry resolution): 消費先(14716/16894付近)が
  いずれも`events.push(`...`)`の**旧文字列イベント**であり、i18n-runtime-spec構造規約4の
  「旧文字列エントリは無変換で共存」の対象。新形式`{type,data}`のgameLog/紙面テンプレへは
  一切到達しないため、対処不要と判断した
- `{changes}`(saveDoctor、`repair.changes`): 値はJAではなく`weekPhase_invalid:xxx`
  `showCard_stale_refs_removed`のような**開発者向け診断用スネークケーストークン**(既に英語)。
  出力テンプレ`セーブデータ自動修復: {changes}`(GAMELOG_TEMPLATES)自体は翻訳済みだが、
  値そのものに翻訳すべき日本語が存在しないため対処不要と判断した

これで元々の11種は「実装7件(phase/tone/stamp/result/crowdLabel/tierLabel(部分)/outcome/
wanted(部分))+対処不要2件(label/changes)」に整理された(tierLabel/wantedの「部分」は
上記の未対応箇所を参照)。

### 辞書追加

`i18n/ui-ledger.json`へ39行追加(値語彙・stampテンプレ・closing/championWatch文・
crowdLabel・PPV GRAND FINALの恒等エントリなど)。`node test/i18n-build-dict.js`で
`src/lang-en.js`を再生成し、機械検査(プレースホルダ完全性・重複キー・en内日本語残り)通過。

### 検証結果

- `node test/ja-golden.js`: 完全一致(基準未更新)
- `node test/i18n-build-dict.js` / `node test/i18n-build-template-dict.js`: green
- `node --check` (data.js/management.js/app.js/ui-common.js): 全OK
- `npm test`: 260/260 PASS
- `node test/auto-sim.js 40 42`: ALL CLEAR(violations 0)
- `npm run test:ui:walkthrough`: PASS(issues 0)
- `node test/i18n-ratchet.js`: management.jsで+14件検出 → `--update`で基準更新
  (内訳: 新設した`_wmResolvePreformattedIndustryData`/`_wmNewsStamp`/`formatCoachRequest`の
  辞書キー用ラベル表と、既存のstamp用テンプレートリテラルをdict()呼び出し向けに分割したことに
  よる増加。いずれも出力へ直接漏れる生JAではなく、dict()の引数として使われる翻訳キー材料)
- ENスモーク(vm・固定シード・lang=en+dict): `Engine.newspaper.generate()`単体呼び出しで
  topChampionInjury/longInjury/winStreakMilestone×2/tenchosenBestBout×2/hotProspectDebut×2/
  fatedRivals/kaiganAwakening/mqAllTimeRecord/mqTagRecord/warMilestoneの13ケースを生成、
  **日本語残数0**(`[WM] [i18n-miss]`ログも0件)。`buildFollowUp`/`formatCoachRequest`/
  `buildTenchosenAnnouncementData`/`buildTenchosenFieldData`/`gameLogEntryText`
  (venue_heat_crowd/challenge_event_result/fighter_signed/secretary_request_sent)も個別に
  同条件で検証し、いずれも日本語残数0。HIGH保留分(`{detail}`/`{preview}`/`matchSummary`系/
  `DRAFT_PLAYER_RESULT_PARTS`系)は元よりスコープ外のため、これらのテンプレ自体を含む号は
  スモーク対象から除外している(そこは既知の残存日本語)
