# i18n実行基盤仕様 v1.0(Stage A確定分)

- 確定: 2026-09-02(Stage A P1〜P3a完了時にspecs昇格)。設計経緯は docs/i18n-stage-a-p1-design-v0.1.md / p3a-design-v0.1.md、監査台帳は docs/i18n-stage-a-p2-audit-v0.1.md
- スコープ: **翻訳可能化の実行基盤と構造規約**。英訳そのもの(辞書の中身・トーンバイブル)はStage B(正: docs/en-tone-bible-draft-v0.1.md)

## 1. WM_I18N(src/i18n.js)

- 全スクリプトより先に読み込む(index.html/battle-engine.html/tag-battle.htmlの先頭script。release/manifest.json登録済み)
- `t(text, params?)`: キーは**日本語原文**。ja=辞書非経由の素通し(params時は`{name}`置換のみ)/en=辞書引き・ミス時はfail-openで原文+`[WM] [i18n-miss]`ログ(セッション中1回・フライトレコーダーが拾う)/pseudo=`⟦原文~~⟧`(~は40%長・レイアウト溢れ検査用)
- **プレースホルダフィルタ`{name:filter}`(Stage B P6 D-P6-5、2026-09-02追加)**: `params[name]`をフィルタ関数へ通してから埋め込む。ja側テンプレは常に無フィルタの`{name}`のままでよい(基底名が同じなら同一パラメータとして解決される。t()の`applyParams`とdata.jsの`fillTemplateVars`が同一契約の正規表現実装を独立に持つ — 後者はi18n.js非依存で単体読み込みされるため)。現在の唯一のフィルタは`man`(通貨B方式): 万単位の数値/カンマ区切り数字文字列(符号可)を英語圏標準のk/M表記へ変換する。100万未満(絶対値<100)→整数k(例: 15→150k)、100万以上→小数1桁までのM(末尾.0削除。例: 300→3M、120→1.2M、30000→300M)。符号はk/M表記の頭に付く。数値化できない値・未知のフィルタ名はいずれもfail-open(値をそのまま挿入)
- `setLang('ja'|'en'|'pseudo')`: localStorage `wm_lang`(既定ja)。**セーブ(G)に言語は入れない**。切替UIは開発パネル(Ctrl+Shift+D)のみ(プレイヤー向けUIはStage B/P6)
- `addDict({原文: 訳文})`: Stage Bで英語辞書を登録する入口
- `applyDom(root?)`: 静的HTML用。`data-i18n`要素のtextContent/`data-i18n-attr="title,placeholder"`属性を、原文退避(`data-i18n-orig`)→t()適用。DOMContentLoadedとsetLangで自動実行
- 観戦iframeは自windowに別インスタンス(wm_lang共有で言語は揃う。試合ごとに開き直すため親のsetLangへの追従は不要)
- **名前辞書 PN_EN(Stage B P6 D-P6-1〜D-P6-3、2026-09-03追加)**: 選手・コーチ名等はdata由来の**値**としてUIへ出るため、キー一致のt()では訳せない。`dict`(通常UI辞書)とは別領域`names`を持つ
  - `addNames({原文: 訳文})`: 名前辞書への登録入口。生成元は `test/i18n-build-names.js`(`i18n/names-ledger.json` → `src/lang-en-names.js`)。複数回呼び出し可(既存へマージ)
  - `pn(str)`: `str`が名前辞書に完全一致すればEN訳を返す。無ければ原文のまま(fail-open)。`lang!=='en'`(ja/pseudo)は素通し(t()のpseudo分岐が辞書引きをしないのと対称)。直接補間(`${c.name}`)の表示サイトを段階移行する入口
  - **D-P6-3実装(2026-09-04、P6-3)**: ui-render.js/ui-common.js/app.js/battle-engine-main.js/tag-battle-main.jsの`.name`/`.surname`直接補間サイトを機械列挙・分類し、表示サイトへ`pn()`を497箇所配線(内訳・完走画面はworklog参照)。**除外した箇所**: gameLog/growthLog/`_pending*`等G保存値に焼き込まれる文字列(D-P6-4「セーブ内の名前は日本語のまま」を厳守)、開発診断ログ(`wmDiag`)、`.name.toLowerCase().includes()`等の検索フィルタ(ロジック比較)、kurodaText系テンプレプール(`App._NEWSPAPER_HEADLINES`/`_ARTICLES`。P4-5の`kurodaTemplateOf()`正規化+D-P6-2のt()パラメータ自動変換で別途訳される)。`.charAt(0)`/`.substring()`/`.split()`等の切り詰め表示は`pn()`適用後に切り詰める順序(EN名の頭文字/姓を正しく取るため)。残約634箇所(主にapp.js)は次バッチの長尾対象
  - **t()のパラメータ値自動変換**: `applyParams(str, params, convertNames)`の第3引数が真のとき、挿入する値が文字列かつ名前辞書に完全一致すれば、プレースホルダフィルタ(`{name:man}`等)適用より前段で訳文へ差し替える。`t()`は`en`ブランチのときだけ`convertNames=true`で呼ぶ(ja/pseudoは従来どおり無変換=1バイト不変)。これによりテンプレ経由の名前(`{name}`/`{winner}`等)は配線ゼロで英語化される
  - 姓のみ表示(隊列ラベル・戦績表・派閥名等)向けに、フルネームとは別に姓単独のキーも登録される(例: `"富岡加奈子"→"Kanako Tomioka"`と`"富岡"→"Tomioka"`の両方)。表記の正は `docs/en-proper-nouns-draft-v0.1.md`(2026-09-02 Keisuke裁定確定分)。ID13 堂前ユキ(given name Yuki)とID108 結城玲奈(surname 結城)のローマ字衝突は、ID108を`Rena Yuuki`(結城=Yuuki)へ上書きして回避

## 2. 構造規約(コードを書くときの鉄則)

1. **Engineは WM_I18N を呼ばない**。テンプレ選択・整形はEngine内でよい(データ駆動なら表示時に英語列を引ける)
2. **ロジックキーは日本語のまま維持**(injury.type『重傷』等・セーブ互換)。表示は辞書ヘルパー経由(先例: injuryLabel/seasonHeadlineLabel/FINISH_TEXT)
3. **断片連結禁止**: 文は分岐組み合わせごとの完全文テンプレート(data.jsの*_TEMPLATES表+`{name}`プレースホルダ+fillTemplateVars)
4. **gameLogは`{type, data, s, w}`形式**でGに保存し、表示時にGAMELOG_TEMPLATES(66型)で整形。旧文字列エントリは無変換で共存(string=素通し/object=整形の二刀流)。分類はtypeの族判定(旧エントリのみキーワード判定温存)
5. **完成文の部分一致(.includes)でのUI分岐禁止**(キーワードスニッフィング)。分類はtype/categoryフィールドで
6. **モジュールロード時定数にt()を焼かない**。参照時にt()評価(setLang追従のため。先例: FLAG_MODAL_META)
7. 新規の表示文字列は必ずt()経由 or data-i18n(ラチェットが増加を検知して失敗させる)

## 3. 検証ガード(常設)

| ガード | コマンド | 役割 |
|---|---|---|
| JAゴールデン | `node test/ja-golden.js`(基準更新は`--update`) | 固定シード20季のエンジン生成テキスト11,233行をSHA256照合。**日本語出力の1バイト差を検知**。意図的にJA出力を変える修正のみ基準を採り直す(理由をworklogに書く) |
| ラチェット | `node test/i18n-ratchet.js` | ファイル毎の生日本語文字列本数の増加で失敗(テーブル抽出等の正当な移動のみ--update可・内訳明記) |
| 擬似ロケール | dev panelでpseudoに切替 | 翻訳漏れ(⟦⟧が付かない文字列)とレイアウト溢れの目視検査 |
| gameLog互換 | test/gamelog-compat-test.js | 旧文字列エントリ混在セーブの表示・フィルタ回帰 |

## 4. 移行実績(2026-09-02時点)

- t()呼び出し: ui-render.js 1,344 / ui-common.js 1,894 / app.js 314 / factions.js 377 / 観戦(battle+tag)79 = **約4,000箇所**+index.html data-i18n 84要素・属性8
- 未移行(意図的スキップ)の族: セリフ・ナレーション・記者文・演出独白(Stage B翻訳対象)/数値+単位語(Stage Bで複数形込み設計)/積み残し台帳(docs/i18n-stage-a-p3a-design-v0.1.md「バッチ4の積み残し台帳」)

## 5. EN辞書の生成パイプライン(Stage B P3b-1で追加。設計: docs/i18n-stage-b-p3b-design-v0.1.md D-B1/D-B4)

- **`test/i18n-extract-ui.js`**: src/{ui-render,ui-common,app,factions,battle-engine-main,tag-battle-main}.js の全`WM_I18N.t()`第1引数リテラル(シングル/ダブルクォート+補間の無い静的テンプレートリテラル)と、src/{index,battle-engine,tag-battle}.html の`[data-i18n]`textContent・`[data-i18n-attr]`対象属性値を機械抽出し、`i18n/ui-ledger.json`(配布対象外・manifest未登録)を生成する。台帳スキーマ: `{ key, en, files, count, hasPlaceholder, hasProperNoun }`。`hasProperNoun`はdata.jsのALL_CHARS(name/surname)・ALL_COACHES(name)・VENUES(name)・RIVAL_ORG_NAME_POOL・TITLES(name)・SPECIAL_EVENT_INTRO(title、絵文字接頭辞除去)+明示リテラル(天頂戦/GRAND FINAL)との部分一致で判定(D-B5: 固有名詞入りの文は名詞辞書確定後に訳す目印)
- **`test/i18n-extract-ui.js` の保全マージ(2026-09-04・P6-4で追加)**: 再実行時に既存台帳の`en`をキーで引き継ぎ、走査で見つからない既存行は`kept:true`を付けて残す(t()に変数で渡る動的キー: 負傷ラベル・勝敗語・成形済み値・データ表の文字列など。P4-4で手追加した42行が該当)。新規キーは`en`空で追加され一覧表示される。**廃止したキーは台帳から手で削る**(抽出器は削らない)。走査に出ないデータ表の文字列(例: `_F01_ARCHETYPE_META`)は`kept:true`+`note`付きで手追加する。※保全マージ導入前の抽出器は再実行で全`en`を消す破壊仕様だった(P3a当時の一回生成想定)
- **`test/i18n-build-dict.js`**: 台帳の`en`列が非空の行だけを対象に機械検査(D-B4: プレースホルダ`{name}`集合の完全一致/台帳内重複キー検出/en内の日本語残り検出)を通した上で`src/lang-en.js`(`WM_I18N.addDict({...})`)を生成する。違反時はexit 1で`lang-en.js`を書き換えない。**D-P6-5(通貨フィルタ)対応**: プレースホルダ集合の比較は「基底名」で行う(`{cost:man}`と`{cost}`は同一視。`test/i18n-build-template-dict.js`も同じ拡張)
- **`src/lang-en.js`**: 自動生成物(手編集禁止)。index.html/battle-engine.html/tag-battle.htmlの`i18n.js`直後で読み込む(release/manifest.json登録済み)。D-B2により辞書に無いキーは原文のままfail-open表示されるため、翻訳バッチが未完了でも安全にコミットできる
- 運用: 翻訳バッチ(Opus主筆)が`i18n/ui-ledger.json`の`en`列を埋める→`node test/i18n-build-dict.js`で再生成→`node test/ja-golden.js`(ja不変)・`node test/i18n-ratchet.js`(増加なし)・ENモードでのwalkthroughで検証、のループを回す

## 6. テンプレ辞書の生成パイプライン(Stage B P4-2で追加。設計: docs/i18n-stage-b-p4-design-v0.1.md D-P4-1/D-P4-2)

UI文字列(§5)とは別に、data.jsのテンプレ表(ニュース記事・新聞・戦績ログの完全文テンプレート)を対象にした並行パイプライン。台帳・生成物とも§5とは別ファイルで、`WM_I18N.addDict()`は複数回呼んでも既存辞書へマージされる(src/i18n.js実装)ため読み込み順は問わない。

- **対象テーブル(data.js、14個)**: `GAMELOG_TEMPLATES` `FINISH_TEXT` `PPV_SUMMIT_HEADLINE_TEMPLATES` `PPV_SUMMIT_MATCHPART_TEMPLATES` `PPV_SUMMIT_HPNOTE_TEMPLATES` `PPV_UNDERCARD_HEADLINE_TEMPLATES` `PPV_UNDERCARD_BODY_TEMPLATES` `AI_INJURY_RETIREMENT_TEMPLATES` `AI_CONTRACT_DEPARTURE_TEMPLATES` `CROSS_WAR_RESULT_TEXT` `LEAGUE_ELEVATION_TEXT` `NEWSPAPER_SUB_TEMPLATES` `NEWS_HEADLINE_TEMPLATES` `NEWS_TICKER_TEMPLATES`。`PPV_SUMMIT_VICTORY_LINES`(選手個人のセリフ)は対象外(P5のセリフ層で扱う)
- **対象テーブル追加(kuroda-text.js、13個。P4-5で追加)**: `KURODA_HEADLINES` `KURODA_EDITORIAL` `KURODA_WAR_RECORD` `KURODA_MATCHUP_FLAVOR` `FAN_OPINIONS` `NEWSPAPER_DIGEST_COMMENTS` `KURODA_SHOW_RATING` `KURODA_PREVIEW` `KURODA_SPOTLIGHT` `KURODA_NEWS_COMMENT` `KURODA_RELATION_NARRATIVE` `KURODA_CRISIS` `KURODA_GAMEOVER`。`NEWSPAPER_DIGEST_COMMENTS`/`FAN_OPINIONS`は指示書上「data.jsにあれば」だったが実体はkuroda-text.jsのみに存在(2026-09-04確認)。`FAN_HANDLES`(ファンハンドル名の識別子文字列)は日本語を含まないため対象外。`KURODA_PREVIEW`は消費点(呼び出し箇所)がsrc/*.jsのどこにも見つからない死蔵テーブル(docs/archive参照では過去に配線予定だった形跡があるが未実装のまま)— 台帳には抽出するが実配線なし
- **対象テーブル追加(app.js、2個。P4-5で追加)**: `App._NEWSPAPER_HEADLINES` `App._NEWSPAPER_ARTICLES`(自団体新聞の見出し/本文プール)。App.のプロパティでトップレベルconstではないため、`test/i18n-extract-templates.js`が波かっこ深さカウントでapp.jsソースから該当オブジェクトリテラルのテキスト範囲だけを切り出し、`eval()`で単独評価して取得する(app.js全体を読み込まない。DOM依存の副作用を避けるため)
- **`test/i18n-extract-templates.js`**: 上記(data.js 14個 + kuroda-text.js 13個 + app.js 2個)テーブルの値を再帰ウォーカー(文字列/配列/オブジェクト/関数値の任意のネストを辿り、訳出可能な文字列の葉を全て拾う。関数値の扱いは次項)で走査し、`i18n/template-ledger.json`(配布対象外・manifest未登録)を生成する。台帳スキーマは§5のui-ledgerと同一(`{ key, en, files, count, hasPlaceholder, hasProperNoun }`)だが、`files`欄は「参照テーブル名」を意味する(§5では「ソースファイル名」)。data.js/kuroda-text.jsは`test/helpers/load-game.js`の`loadAsGlobal`(const→var変換+vm実行)で読み込む(module.exports未登録のテーブルも取得できる。ソースファイル自体は変更しない)。**台帳の保持マージ(P4-5で追加、P5のdialogue-ledgerと同じ作法)**: 既存台帳のen列(非空)は再生成時に上書きしない(新規行にのみ空文字のenを書く)
- **関数値(`d => \`...${d.x}...\`\`)の正規化(P4-5で追加)**: kuroda-text.js/app.jsのプールの多くは、値がJSテンプレートリテラルで補間まで済ませる関数であり、data.jsの14テーブルが使う「`{name}`プレースホルダ文字列」とは形が異なる。素直には辞書キー(=補間前のJA原文)を取れないため、**`src/kuroda-text.js`に追加した`kurodaTemplateOf(fn)`**が関数ソース(`fn.toString()`)を軽量パースし、`${d.prop}` / `${d.a.b}` / `${d.a.b()}`(引数なしメソッド呼び出しのみ)を`{propName}`形式のプレースホルダへ機械的に正規化する(`kurodaParamName(path)`が`"a.b"→"aB"`のようにcamelCase化)。三項演算子で分岐する関数本体全体・入れ子テンプレートリテラル・`Math.abs()`等の計算式を含む関数は正規化できない(null)ため、台帳に載らず「保留」として`docs/i18n-p4-5-kuroda-holdout-audit.md`(抽出器が実行のたびに再生成)に集計される。0引数関数(補間なしの固定文)は`fn()`の戻り値をそのままJA原文として扱う。**プール要素は「分岐を関数本体に書かない」のが規約(P4-7で確立)** — 正規化できない形はfail-openでENでもJA文が出るため、条件分岐は次の2手のどちらかでデータ側へ出す: (a)**条件ごとに独立プールへ分割し、選択を消費点または薄いヘルパへ寄せる**(先例: `KURODA_SPOTLIGHT`の`star`を総合力帯ごとに`starAce`/`starSolid`/`starPopular`へ分割し、帯の解決を`kurodaSpotlightStarKey(ovr)`に集約)、(b)**`kurodaVariants([{when, text}, …])`でラップする**(`when`省略の枝がelse相当。返り値は従来どおり呼び出し可能な関数で、`entry.pickVariant(d)`が枝を返し、`entry.variants`が全枝を列挙する。`kurodaText`は枝を解決してから通常のプール要素として訳出し、抽出器の`walkStrings`は全枝を台帳へ載せる。`toString()`は全枝のソースを連結して返す — ui-render.jsの`_filterPraiseByMQ`等がプール要素の`fn.toString()`を正規表現で検査して本文を選別しているため)。**どちらの手でも配列長を変えないこと**(`Engine.rng.pick`が引く添字と`_npRivalryPairIndex % pool.length`が長さに依存しており、長さが変わるとJA出力が変わる)。計算式(`Math.abs()`等)は消費点で先に算出して`d`へ渡す(先例: `KURODA_WAR_RECORD.loseStreak`の`{streakAbs}`)。P4-5時点の保留16件はP4-7(2026-09-04)でこの規約に沿って全件解消され、**保留は0件**になった。**`kurodaText(entry, d, dict)`**が唯一の消費入口: `entry`(関数 or 文字列)を`kurodaTemplateOf`で正規化できればプレースホルダ値を`kurodaEvalPath(d, path)`で解決して`dict(template, params)`(=`WM_I18N.t`と同じ`(text, params)`契約)を呼び、正規化できない(または`dict`省略時)は従来通り`entry(d)`を直接呼ぶ(fail-open。適用前と挙動が完全に同一 = ja出力1バイト不変)。呼び出し元(ui-render.js/app.js)は`kurodaText(pool要素, d, WM_I18N.t)`の形で呼ぶだけでよく、Engine層は一切関与しない(消費点は全てUI層 — ui-render.js/app.jsのみ)
- **`test/i18n-build-template-dict.js`**: 台帳の`en`列が非空の行だけを対象に機械検査(§5のD-B4と同じプレースホルダ完全性/重複キー/日本語残り検出)に加え、**黒田禁止語grep**(docs/en-kuroda-style-draft-v0.1.md §3-6のタブロイド語彙・慨嘆の暴走・スポーツ面常套句・翻訳調等9パターン)を通した上で`src/lang-en-templates.js`(`WM_I18N.addDict({...})`)を生成する。違反時はexit 1で書き換えない
- **`src/lang-en-templates.js`**: 自動生成物(手編集禁止)。index.htmlの`lang-en.js`直後で読み込む(release/manifest.json登録済み)。辞書に無いキーはfail-openで原文表示。`test/i18n-scan.js`のラチェット計測対象からは除外している(`lang-en.js`と同じ理由 — JSON化されたJAキーを生の直書き文字列と誤検出しないため)
- **Engine側のlang糸通し規約**: 構造規約1(Engineは WM_I18N を呼ばない)を保ったまま生成時言語を確定させるため、Engine内でテンプレを充填してGへ焼く関数は**末尾の任意引数として`opts`(`{ lang, dict }`)、または既存の`dict`パラメータ**を受け取り、テンプレ参照直後に`dict(tpl)`を通す形にする(`dict`未指定時は恒等関数と同じ=JA原文のまま)。呼び出し元(app.js等、Engineでないレイヤー)が`WM_I18N.t`を`dict`として渡す。先例: `Engine.formatFinish(finType, finMove, isFinisher, dict)` / `Engine.newspaper.generate(state, rng, opts)` / `Engine.newspaper.publish(state, rng, extra)`(`extra.opts`を`generate`へ転送) / `Engine.news.generateTicker(rng, state, opts)` / `tickWeek(state, opts)` / `Engine.advanceWeek(state, opts)`(いずれも`opts`省略時=auto-sim/ja-goldenの既存呼び出しは無改修でJA不変)。**P5基盤修正(2026-09-03)で追加**: `Engine.factions.getCommon1Line(category, ctx, dict)` / `Engine.factions.getCommon5Line(category, ctx, dict)` / `Engine.factions.getCommon7Line(category, ctx, dict)` / `Engine.factions.getF07Line(category, ctx, dict)` / `Engine.factions.getTransitionLine(reasonKey, leader, vars, dict)` / `pickTagLossLine(fighter, partnerName, dict)` / `pickTagWinCommentary(winnerName, partnerName, moveName, dict)`(§9「既知の限界」で挙げていた7関数の根治。呼び出し元はいずれも`WM_I18N.t`を渡し、戻り値を改めて`WM_I18N.t()`で包み直さない — 包み直すと置換済みの完成文が辞書キー(未置換の原文)と一致せずfail-openするため)。**契約交渉セリフ(2026-09-03)で追加**: `Engine.contract.selectDialogue(rng, fighter, phase, context, dict)` — ホスト文はプールから選んだ直後(プレースホルダ`{tenure}{record}{rivalry}{tenure_farewell}{wins}{losses}{n}{rivalName}`を置換する前)にdictへ通す。差し込み断片(tenure/record/rivalry/tenure_farewell)は共通ヘルパー`Engine.contract._toneFragment(block, fighter, dict)`が断片選択直後(`{n}`/`{rivalName}`置換前)にdictへ通すため、`_insertTenure/_insertRecord/_insertRivalry/_insertTenureFarewell(text, ctx, fighter, dict)`も同じ`dict`を素通しするだけでよい。`Engine.contract.resolveNegotiation(rng, state, neg, choiceIdx, subChoice, dict)`は内部の2箇所の`selectDialogue`呼び出しへ`dict`をそのまま転送する(resolveNegotiation自身はWM_I18Nを直接参照しない)。呼び出し元(ui-common.js/app.js)は`WM_I18N.t`を渡す。**P4-5(2026-09-04)で追加**: `Engine.ending.buildGameOverData(state, dict)`(KURODA_GAMEOVERの`kurodaColumn`を生成時点で確定。呼び出し元app.jsが`WM_I18N.t`を渡す。dict省略時は恒等関数=既存呼び出しは無改修でJA不変)。**`Engine.news.generateTicker`の値置換契約を修正(2026-09-04 P6-6)**: 従来は`dict(template)`でテンプレ本文だけを翻訳し、プレースホルダの値(選手名・団体名)は呼び出し側の`.replace()`で生JAのまま挿入していたため、EN走破で選手名・団体名(ブレイクスルー等のRIVAL_ORGS名を含む。名前辞書は`i18n/names-ledger.json`の`orgs`セクションに選手・コーチ名と同様に登録済み)が翻訳されずに残る実害があった。`dict(template, item.data)`(=`WM_I18N.t`の`(text, params)`契約そのもの)へ一本化し、値の変換もdict任せにした。`opts.dict`未指定時(test/ja-golden.js等)のフォールバックは、翻訳はしないが**プレースホルダの充填だけは行う**恒等関数(`(s, params) => 手動置換`)にすること — 単純な`(s) => s`にすると無指定呼び出しで`{name}`等が生のまま出力されてしまう(ja-goldenが検知する)
- **UI層(ui-render.js/app.js)からの直接t()配線(P4-5で追加)**: kuroda-text.js/app.jsの新聞プールの消費点は全てui-render.js/app.jsというUI層(Engineではない)にあるため、opts/dict糸通しは不要で、消費点で直接`kurodaText(entry, d, WM_I18N.t)`を呼ぶだけでよい(app.jsが直接WM_I18Nを呼んでよいレイヤーである規約はD-P4-2で既出)。ただし`App._buildShowResultNewspaperData`(app.js)が組み立てる`d.finishLabel`は`Engine.formatFinish(...)`の戻り値(=Engine内テーブル参照によるJA成形済み値)であり、dictを渡さず呼ぶと新聞テンプレの中だけJA原文が混入する「成形済み値の構造穴」になる(§8と同型)。P4-5で発見し、app.js側の3箇所の`Engine.formatFinish(finType, finMove)`呼び出しを`Engine.formatFinish(finType, finMove, undefined, WM_I18N.t)`に修正して解消した
- 運用: 翻訳バッチが`i18n/template-ledger.json`の`en`列を埋める→`node test/i18n-build-template-dict.js`で再生成→`node test/ja-golden.js`(ja不変)・`node test/i18n-ratchet.js`(増加なし)・lang糸通し先(Engine.newspaper.generate等)をopts.dict='en'相当で呼ぶスモークテストで検証、のループを回す
- **成形済み値の棚卸し**: テンプレの一部プレースホルダ(`{milestone}`等)がJAで組み立てられた値で充填される「構造穴」の台帳は`i18n/preformatted-values-audit.md`(生成箇所file:line・生成式・テンプレ化難易度LOW/MEDIUM/HIGH)。**P4-4(2026-09-03)でLOW全件+MEDIUM2件を実装済み**(詳細・残課題は台帳の「P4-4実装ログ」節)。HIGH群と`{careerLine}`は引き続き保留。**P4-5(2026-09-04)で発見・実装**: `App._buildShowResultNewspaperData`の`finishLabel`(上述)
- **関数内実行文プール(pool③、P4-5で保留)**: `Engine.mvpRace.generateKurodaComment`(management.js)はKURODA_HEADLINES等と同じ`d => \`...${d.x}...\`\``形式の配列だが、**トップレベルconstテーブルではなくメソッド本体に直書き**された配列リテラルであり、かつ兄弟の`generateNarrative`/`generateTagline`/`generatePageHeadline`/`generatePageLead`(同じEngine.mvpRaceの戻り値オブジェクトの他フィールドを埋める、同種の実行文プール)が今回のP4-5対象外のままのため、`kurodaComment`だけを配線すると同一スナップショット内でJA/EN混在になる。今回はテーブル化・配線ともに見送り、Engine.mvpRaceの叙述生成family全体をまとめて次回対応する対象として記録するに留める

## 7. 通貨表記(Stage B P6 D-P6-5、2026-09-02確定・実装)

- **裁定: B方式(英語圏標準)**。300万→**¥3M** / 15万→**¥150k** / 120万→**¥1.2M** / 3億(30000万)→**¥300M**(k/Mの閾値・小数桁は§1の`man`フィルタ定義を参照)
- `i18n/ui-ledger.json`の既存訳のうち、旧・素朴x10変換(`¥{v}0k`のように「0kを後置」するだけの実装)を使っていた**43エントリ**を`¥{name:man}`形へ書き換えた(うち40件はプレースホルダ経由、3件はプレースホルダの無い直値文——例: `特別治療（-200万）`→`Special treatment (-¥2M)`)。書き換え後は`node test/i18n-build-dict.js`で`src/lang-en.js`を再生成する
- **対象外(意図的に据え置き)**: `万`単位の値を**フィルタを通さない生の数字**と組み合わせて表示する5エントリ(`資金 (万)`→`Funds (×10k)`等の列見出し・単位ラベル)。これらは呼び出し元(ui-render.js/ui-common.js)がプレースホルダ無しで`${num}${t('万')}`のように連結しており、`{name:man}`化には表示側の数値生成ロジックそのものの改修が要る。現状は「万」→「×10k」という一貫した対訳のまま(誤りではないが、他のB方式表示とは体裁が異なる)。B方式へ揃えるなら別issueとして呼び出し元を洗い出すこと
- **実装時に発見・修正した副次バグ**: `{sign}{v}万`パターン(純益/週次収支など7箇所、ui-render.js)は元々「符号は`sign`パラメータで'+'のみ付与し、負値は`v`自身に埋め込まれた"-"に委ねる」設計だった。これは`{sign}¥{v:man}`テンプレでは`¥`と符号の順序が壊れる(`¥-2M`になってしまう)。**7箇所すべてを「`sign`は'+'/'-'を明示・`v`は絶対値」の形に統一**した(ja側の出力は`sign+v`の文字列結合として計算上同一のため1バイト不変。ja-goldenで確認済み)

## 8. industryNewsキューの「render時点再構築」パターン(Stage B P4-4、2026-09-03確定・実装)

`Engine.industryNews.push()`で発生週にキューへ積まれた業界ニュースイベント(`state._industryNewsEvents`)は、
掲載枠(一面1+サブ数本)の空きが出るまで**最大数週間キューに滞留してから紙面化される**
(2026-07-27の持ち越し実装)。push側の関数(`checkTopChampionInjury`/`scanRosterNews`/
`Engine.ppvTournament.apply`/`Engine.mq._resolveBignewsDebut`/`Engine.kaigan.industryEvent`/
`_pushRecordNews`等)は`opts`/`dict`を持たない深いtickWeek内から呼ばれるものが多く、
§6の「opts糸通し」をpush側まで伸ばすと影響範囲が広がりすぎる。

代わりに、push側では**加工前の生キー**(例: `orgName`・`injuryTypeRaw`・`recordState`・
`roundKey`・`won`・`stageKey`)を`data`に追加で持たせておき、実際に紙面へ載る瞬間
(`Engine.newspaper.generate()`内、dictが揃っている場所)で
`_wmResolvePreformattedIndustryData(ev, dict)`(management.js)が生キーから改めて
言語別の値を組み立て直す。生キーが無い(=この機構より前に積まれた旧セーブのキュー)場合は
pushされた時点の値をそのまま使う(fail-open、後方互換。1〜数週間で消化されるキューなので
実害は限定的)。

先例(P4-4で対応): `{titleName}`(topChampionInjury) `{injuryType}`(longInjury)
`{recordLine}`(winStreakMilestone) `{round}`+`{closing}`(tenchosenBestBout)
`{result}`(hotProspectDebut/kaiganAwakening) `{stage}`(mqAllTimeRecord/mqTagRecord)。
新規のindustryNewsイベント型で同種の「値がJAで組み立てられる」構造を作るときは、
この生キー+render時点再構築パターンをまず検討すること。

## 9. セリフ層(ダイアログ)の生成パイプライン(Stage B P5-1で追加。設計: docs/i18n-stage-b-p5-design-v0.1.md)

UI文字列(§5)・テンプレ(§6)とは別に、キャラクターの発話(セリフ)を対象にした第3の並行パイプライン。台帳・生成物とも§5/§6とは別ファイルで、`WM_I18N.addDict()`は複数回呼んでも既存辞書へマージされるため読み込み順は問わない。

- **対象**: `src/data.js` のセリフ系テーブル + セリフ専用ファイル8本(`victory-lines.js` `battle-lines.js` `coach-lines.js` `data-faction-dialogue.js` `flag-dialogue.js` `ppv-lines.js` `tag-battle-lines.js` `tenchosen-final-lines.js`)。`kuroda-text.js`(黒田記事・ナレーション層)・`CHAR_PROFILES`(プロフィール文)は対象外(dialogue-tone-spec-v1.0 §5、いずれもP5末尾または別工程)
- **`test/i18n-extract-dialogue.js`**: 対象ファイルの全トップレベル`const`宣言名を`_`区切りで走査し、セグメントに`LINES`/`DIALOGUE`/`DIALOGUES`を含むものを「セリフ格納テーブル」として自動抽出する(手動例外は`EXTRA_INCLUDE` 4件+`EXTRA_EXCLUDE` 1件。P5-2pで`FAN_EXPECT_REACTIONS`/`SPECIAL_EVENT_INTRO`を`EXTRA_INCLUDE`へ追加=下記§10-2)。値は再帰ウォーカーで文字列の葉を全て拾い、`i18n/dialogue-ledger.json`を生成する。
  - **`INCLUDE_PATH_FILTER`(2026-09-04 P5-2pで追加)**: テーブル全体ではなく特定の部分木だけをセリフ層として扱う。`{ テーブル名: (pathKeys) => boolean }` の形で、`pathKeys`はテーブル直下から数えたオブジェクトキー列(配列インデックスは含まない)。現在の唯一の登録は`SPECIAL_EVENT_INTRO`で、`coach`/`fighter`配下のみを拾う(同テーブルは大会タイトル・会場入りナレーション・ボタンラベルというUI層=`i18n/ui-ledger.json`の領分の文字列と選手/コーチのセリフが同居する)。**両台帳へ同じキーを二重登録してはいけない** — `addDict`のマージで後勝ちになり、どちらの訳が出るかがスクリプト読み込み順に依存するため
  - **`CELL_SUPPRESS_PATHS`(2026-09-04 P5-2pで追加)**: 「軸キーはあるが、それは**話者**のarchetypeではない」パスで`cell`を強制的に`null`にする。現在の唯一の登録は`COMMON3_LINES.reaction`で、`reaction.<派閥アーキ>.<archetype>`の末端キーは**迎えられる新人の口調**(data.js:3052-3053のコメント)であり喋っているのは**派閥リーダー**。素直に拾うと`test/i18n-build-dialogue-dict.js`のセル別検査がリーダーの発話へ新人の属性規約(ojousamaの短縮形禁止・coolの感嘆符禁止)を掛けてしまう。**この抑止は下記の保持マージより強く、既に`cell`が入っている行も`null`へ戻す**(誤ったセルを残さないため)。ただしそのパス**以外**でも同じ原文が出現して`cell`が解決できる場合はそちらを優先する台帳スキーマは`{ key, en, files, count, hasPlaceholder, hasProperNoun, cell }`(§5/§6と同型+`cell`)。`files`は`ファイル名:テーブル名`形式。`cell`は文字列の祖先オブジェクトキー列をarchetype 7種/personality 7種の語彙と照合したベストエフォート判定(`{archetype, personality}`。判定が割れる場合はnull)。**P5基盤修正(2026-09-03)で追加**: 語彙一致で取れない場合のフォールバックとして、祖先オブジェクトの全キーがALL_CHARSの実在idと一致し閾値(5件)以上のとき「ID軸ノード」とみなし、配下のcharIdをALL_CHARSで引いてcellを解決する(`victory-lines.js:VICTORY_LINES`等のキャラID軸テーブル向け)。また既存`i18n/dialogue-ledger.json`が存在する場合、`en`(非空)と`cell`(非null)は再生成時に上書きしない保持マージ動作を持つ(翻訳バッチ・ネイティブ検品の手作業投入を機械抽出の再実行で消さないため)
- **`test/i18n-build-dialogue-dict.js`**: 台帳の`en`列が非空の行のみを対象に、§5のD-B4(プレースホルダ完全性/重複キー/日本語残り)+吹き出し長110字上限+**D-P5-3セル別検査**(ojousama帯=短縮形禁止・所有格's許可・**文末の付加疑問(", won't you?" / ", did it not?")は例外**(2026-09-04 ネイティブ検品②: 「〜かしら？」を付加疑問で受けるのがお嬢様帯の礼節表現)/cool帯=感嘆符禁止+3文超禁止/delinquent帯以外=hell・damn禁止/全帯=f・sワード禁止)を通した上で`src/lang-en-dialogue.js`を生成する。違反時はexit 1で書き換えない
- **`src/lang-en-dialogue.js`**: 自動生成物(手編集禁止)。index.html/battle-engine.html/tag-battle.htmlの`lang-en.js`(index.htmlのみ`lang-en-templates.js`)直後で読み込む(release/manifest.json登録済み)。辞書に無いキーはfail-openで原文表示
- **表示点の配線規約**: セリフ選択ロジック(乱数選択・archetype/personalityフォールバック連鎖)には触れず、選択された生JA文字列を表示直前に`WM_I18N.t()`へ1回通す。プレースホルダを含む行は**t()を`.replace()`系より前に置く**(辞書キーは`{name}`が残った生テンプレートと一致させる必要がある)。data.js/factions.js/victory-lines.js/battle-lines.js/tag-battle-lines.js/ppv-lines.js側のセリフ選択関数(Engine純粋関数)は無改修のまま、呼び出し元(ui-common.js/ui-render.js/battle-engine-main.js/tag-battle-main.js)側でt()を挟む。60箇所超の呼び出し元を持つ`_u3bSideHtml`のような共通レンダラに集約すると高効率
- **既知の限界(2026-09-03のP5基盤修正で解消)**: `Engine.factions.getCommon1Line`/`getCommon5Line`/`getCommon7Line`/`getF07Line`/`getTransitionLine`(factions.js)、`pickTagWinCommentary`/`pickTagLossLine`(tag-battle-lines.js)は選択直後に内部で`{name}`等のプレースホルダを置換してから返す実装のため、これらの戻り値はプレースホルダを含む行に限りt()の辞書キーと一致せずfail-openしていた(プレースホルダを含まない行は正しく効いていた)。§6と同じ「Engine関数へ`dict`optsパラメータを足す」設計を7関数すべてに適用して根治した(先例は§6参照)。呼び出し元(ui-common.js/app.js/tag-battle-main.js)は戻り値を改めて`WM_I18N.t()`で包み直さない
- **二重t()適用は「無害」ではなかった(2026-09-04 P6-5で訂正)**: 上の設計メモは「一部の呼び出し元では二重にt()が呼ばれるが、対象が既に英語のためfail-open(ミスログ)で無害」としていたが、実際にはEN走破の`[WM][i18n-miss]`ログを大量に汚染し、本当の未訳(P5バッチ待ち)と配線穴の区別を困難にしていた(P6-5棚卸しの96件中、実測トレースで約30件がこの二重適用起因と判明・原文が最初から英語のケースは0件だった)。呼び出し元でt()済みの完成文を渡す必要があるケース(変数埋め込みの都合で「先に翻訳してから置換」が必須なdict-opts系の戻り値)向けに、共通表示点`_u3bSideHtml`/`_factionReporterStrip`/`_mdlAReporterStrip`/`_mdlASubjectStage`/`_chBubbleSlot`/`_negSpeakerHtml`(P6-6で追加。契約交渉の4画面が対象)へ**`lineTranslated`/`speechTranslated`/`translated`という opt-in の第3〜5引数(またはoptsフィールド)**を追加した。既定値は`false`(=従来どおり内部で1回t()する)なので既存60箇所超の呼び出し元は無変更・無影響。`true`を渡すのは呼び出し元が確実に訳し済みの完成文を渡すことを明示するときだけ(F07のgetF07Line経由・`_agwChampionSpeech`の`{wins}`/`{org}`置換後・`getTraitQuote`常時訳し済み系・`Engine.contract.selectDialogue`/`resolveNegotiation`経由の契約交渉セリフなど)。単純なpickDialogueLine選択(変数埋め込みなし)で「表示側に先んじてt()していた」だけの箇所は、t()呼び出しを表示側の1回だけへ削るほうを優先した(フラグに頼らず生JAを渡す設計に戻す)
- **文字列連結してから表示点のt()に通す「PH先埋め込み」型の穴は網羅的に踏みやすい(2026-09-04 P6-6で追加発見・全修正)**: `_factionReporterStrip`/`_mdlAReporterStrip`の呼び出し元でJS`` `${a}が${b}...` ``のようにテンプレートリテラルを直接組み立ててから渡すと、その完成済みJA文字列が(t()の内部で)辞書キーと一致せずfail-openする(selectDialogue/`_flagFormatLine`と同型)。`getCommonXLine`/`getTransitionLine`等のdict-opts関数から返る**既に訳し済みの文字列**を`_u3bSideHtml`/`_factionReporterStrip`へ渡す側でも、`lineTranslated`を付け忘れると同じ症状になる(表示は無害だがi18n-missを汚染)。P6-6で`_factionReporterStrip`3箇所+`_mdlAReporterStrip`3箇所+Common1/5/7のcoachLine計4箇所+団体戦挑戦直訴のcoachLine1箇所を修正。**新しい表示文字列をこの系統の関数へ渡すときは、必ず「テンプレ+params」か「dict-opts関数の戻り値+translated:true」のどちらかにし、素の文字列連結を挟まないこと**
- 運用: 翻訳バッチ(Opus主筆)が`i18n/dialogue-ledger.json`の`en`列を埋める→`node test/i18n-build-dialogue-dict.js`で再生成→`node test/ja-golden.js`(ja不変)・`npm test`・`npm run test:ui:walkthrough`(EN抜き取り)で検証、のループを回す

## 10. 吹き出しの「」の言語別化(Stage B P6-7、2026-09-04追加)

- **`_quoteLine(text)`(ui-common.js、escHtml直後に定義)**: レンダラ側が吹き出しHTMLを組み立てる際に固定装飾として直書きしていた`` `「${line}」` ``(35箇所)を置き換える共通ヘルパー。引数は表示直前でt()/escHtml等を済ませた完成文字列。`WM_I18N.lang === 'en'`のときは引用符を落として本文のみ返す(バッチ⑬(P5-2m)で確立した「吹き出しの中は台詞そのもの」方針をレンダラ側にも適用)。ja/pseudo/未定義環境(テストスタブ等)は`「${text}」`のまま=1バイト不変。**吹き出し(セリフ)専用**——地の文の引用には使わない
- **`_quoteVal(value)`**: 吹き出しでない地の文(ナレーション・見出し等)で固有名詞を「」引用する6箇所(PPV開幕演出のppvName・F02モーダル前段ナレーションのfactionA/B名・業界制覇/ゲームオーバー各セレモニーのorgName×4)向け。`WM_I18N.t('「{line}」', { line: value })`を内部で呼ぶテンプレヘルパーで、ja出力は`applyParams`による`{line}`置換のみ(1バイト不変)、enは`"{line}"`(ダブルクォート)。地の文自体がt()を通っていない画面(ceremony系スライド・F02前段ナレーション、いずれも既存の別の未解決課題)でも、引用符の様式だけは崩れないようにする
- **`i18n/ui-ledger.json`の新規キー2件**: `「{line}」`(→`"{line}"`)・`{surname}派`(→`{surname} Group`、既訳`{name}派（{arch}）`等と表記を統一)。いずれも`test/i18n-extract-ui.js`が静的literal引数として自動抽出する(手動kept追加は不要)
- **動的キーの手追加(kept:true、14件)**: `renderPPVResult`(ui-common.js)ローカルの実況コメントプール`LIVE_LINES`(epic/good/mid/low/draw、計14行)は`pool[index]`経由でt()へ渡る動的キーのため走査に出ない。表示直前で`WM_I18N.t()`を通す配線を追加(§8「同型の穴」参照)し、台帳へ`kept:true`+note付きで手追加した
- **`_factionDisplayName(name)`(ui-common.js、`_factionSurname`直後)**: 派閥名は生成時に`` `${surname}派` `` という平文字列としてfactions.js側で組み立てられG(セーブ)へ焼き込まれる(D-P6-4「セーブ内の名前はJAのまま」を守るため生成ロジックは無改修)。表示直前で`/^(.+)派$/`を検出し、姓だけ`pn()`経由で英語化してから`{surname}派`テンプレへ通す。「派」で終わらない値(F02payloadの`factionAName`等、既に固有ラベルのもの)はそのまま返す。`showFactionArchetypeTransitionModal`が生成する`factionName`を含む9箇所の`const factionName = ...`宣言に適用(表示・`getTransitionLine`の`{org}`param・`_factionReporterStrip`の`{faction}`paramなど、当該関数内の全用途に波及)。派閥名を持つ他の約15箇所の同型宣言(表示専用・テンプレ変数化されていないもの)は今回未着手(次バッチの長尾対象)

### 10-1. 「二重t()適用」の新規事例2件(2026-09-04 P6-7で発見・修正)

- **`_awSpeech`/`_awSpeechSlot`(年間表彰式award-*系、ui-common.js)**: `_awardLine(key, fighter)`(2751行)が`WM_I18N.t(pickDialogueLine(...))`で選択直後に翻訳した完成文を返す設計だったが、その戻り値を渡す`_awSpeechSlot`側に`translated`opt-inが無く、内部の`_awSpeech`が無条件でもう一度`WM_I18N.t()`を適用していた(§9の`_u3bSideHtml`等と同型)。EN走破のi18n-missをAWARD_LINES由来の完成英文12件で汚染していた。`_awSpeech(line, translated)`/`_awSpeechSlot(line, translated)`に第2引数を追加(既定false=従来どおり)。`_awardLine()`経由で値を受け取る7箇所(`_awWinnerBlock`内部+`_buildSeasonEventChampionAward`の隊列+`_buildBestMatchAward`の両サイド+`_buildChampionsAward`の`buildCol`+`_buildHallOfFame`+選手たちの声スライド)に`true`を配線。`_pickLines()`(シャッフル選択のみ・t()を経由しない生JA)や`Engine.ending._pickGameOverLinesForTop3`/`_pickCoachGameOverLines`(同じく生JA)を渡す3箇所は既定のまま(単発翻訳が正しい経路)
- **`_showWarVictoryChain`/`_showWarEnemyAceStatement`(対抗戦の勝利/敵陣エース発言、ui-common.js)**: `_getWarVictoryLine()`/`getWarPostDialogue()`がいずれも内部で`WM_I18N.t()`を適用した完成文を返すのに、`_u3bSideHtml({..., line, ...})`へ`lineTranslated`を付けずに渡していた(§9で確立済みのopt-inパターンの単純な付け忘れ)。両箇所に`lineTranslated: true`を追加

### 10-2. 3パイプラインいずれからも見えないテーブルが3つ見つかった(2026-09-04 P6-7で発見 → **P5-2pで全件解決**)

EN走破のi18n-miss実測トレースで残る24件のうち11件が「台帳に存在すらしない」ことが判明した(残りは台帳に`en:""`で存在する通常の翻訳待ち)。原因はいずれも「対象テーブル一覧に載っていない」という構造的な穴で、実コールサイト側の配線は単発t()で正しい(二重適用ではない)。

- **`data.js:FAN_EXPECT_REACTIONS`(8件)**: ファン期待への反応セリフ(`_renderEventPopupAsC3`経由)。定数名に`LINES`/`DIALOGUE`/`DIALOGUES`のいずれも含まないため、§9の`test/i18n-extract-dialogue.js`の自動判定(セグメント一致)から漏れている
- **`data.js:SPECIAL_EVENT_INTRO`(2件)**: `showSpecialEventIntro`/`showFighterScene`/`_mdlASubjectStage`経由の選手セリフ。§5のui-ledger抽出器では`hasProperNoun`判定用の固有名詞リストとしてテーブル名は参照されているが、テーブル自体の中身は§5(literal t()呼び出しのみ抽出)・§6(data.js対象14テーブルに非該当)・§9(LINES/DIALOGUE命名パターン非該当)のいずれの抽出対象にも入っていない
- **`ui-render.js:_getKurodaNewsComment`のインラインフォールバック配列(3件)**: `KURODA_NEWS_COMMENT[storyType]`が未定義のときに使う汎用コメント3本(`() => '...'`)。kuroda-text.js側の名前付きテーブルではなくui-render.js内の関数ローカルなリテラル配列のため、§6のテンプレ抽出器(対象13テーブルの外)にも入らない

**解決(2026-09-04 P5-2p)**:

- `FAN_EXPECT_REACTIONS`(89行) → `test/i18n-extract-dialogue.js`の**`EXTRA_INCLUDE`へ追加**。goodWinner/badWinnerはarchetype×personality軸の選手セリフ、goodCrowd/badCrowdは話者不特定の観客の声(cell=null)
- `SPECIAL_EVENT_INTRO`(43行) → **`EXTRA_INCLUDE` + `INCLUDE_PATH_FILTER`** で`coach`/`fighter`配下のみ抽出(§9参照)。同テーブルの`title`/`travelLine`/`nextLabel` 15行はUI層のため**あえて拾わない**(ui-ledgerの領分。二重登録の禁止理由は§9)
- `_getKurodaNewsComment`のインライン配列(3行) → **`kuroda-text.js`の`KURODA_NEWS_COMMENT._default`へ移設**し、`ui-render.js`側はそれを返すだけにした。文面・並び順・配列長(3本)は不変(`Engine.rng.pick`が引く添字を変えないため)。template-ledgerが1,490→1,493行になり黒田英文体で訳出済み。**プール要素をトップレベルのテーブルへ置くのが規約** — 関数ローカルのリテラル配列は§6のテンプレ抽出器(トップレベル`const`のみ走査)から永久に見えない

同型の穴を作らないための規約: **新しいセリフ/テンプレのプールは必ずトップレベルの`const`テーブルへ置き、命名は`*_LINES`/`*_DIALOGUE(S)`に従う**。従えない場合(既存テーブルへの相乗り等)は`EXTRA_INCLUDE`(セリフ層)または§6の対象テーブル一覧(テンプレ層)へ**明示追加する**。関数の中に直書きした配列は、消費点が正しくt()を通していても辞書へ入らないため英語モードで日本語のまま出る。
3件とも`i18n/dialogue-ledger.json`/`i18n/template-ledger.json`の対象テーブル一覧・抽出器の走査パターンを変更しないと台帳に載らない(=本バッチの厳守事項「dialogue-ledger.json/lang-en-dialogue.jsは触らない」と衝突するため未着手)。次にこれらの抽出器へ触れるバッチで、`FAN_EXPECT_REACTIONS`を`test/i18n-extract-dialogue.js`の対象命名パターンへ追加するか`EXTRA_INCLUDE`に足す、`SPECIAL_EVENT_INTRO`を§6の対象データテーブルへ追加するか同様に`EXTRA_INCLUDE`扱いにする、`_getKurodaNewsComment`のフォールバック配列を`KURODA_NEWS_COMMENT`本体(kuroda-text.js)へ移すかフォールバック自体を廃す、のいずれかを検討すること。**`_getKurodaNewsComment`のフォールバック3件はP6-8でi18n/ui-ledger.json(kept:true)へ暫定登録し訳出した**(§11参照。テーブル自体の移設はしていないため、本項の「未着手」判定はテーブル整理そのものについては変わらない)。

## 11. Stage B P6-8 — 残存「」ハードコードの全数消化+季総括カードのテンプレ化+新規発見4件(2026-09-04追加)

### 11-1. `_awSpeech`の「」ハードコードはP6-7で既に解決済みだった

指示書はバッチ⑮(P5-2o)§8-4が起票した「`GAMEOVER_LINES`58行+`ENDING_LINES`52行が`_awSpeech`の「」ハードコードで英語モードでも`「English line」`のまま」を最優先項目としていたが、実際にはP6-7(本バッチの直前)が`_awSpeech`を`_quoteLine`へ移行済みで(§10「吹き出し29箇所」の内訳に`_awSpeech`(award系)を含む)、GAMEOVER/ENDING経由の`_awSpeechSlot`呼び出し(`translated`引数なし=生JAを渡す経路)は`_awSpeech`内部の`WM_I18N.t()`→`_quoteLine()`で正しく言語別化されていることをコード読解で確認した。⑮の起票はP6-7着手前の状態を見て書かれたもので、本バッチ開始前fast-forward(P6-7=d6cbb9eまでmain入り)の時点で既に解消済みだった。指示書のとおり`grep -n '「\${' src/*.js`で全数確認したところ、`_awSpeech`以外に**同型のハードコードが14箇所**(ui-common.js/ui-render.js以外にも波及)残っていたため、そちらを本バッチで解消した(§11-2)。

### 11-2. 同型「」ハードコード14箇所の解消(全ファイル横断)

P6-7はスコープを`ui-common.js`の35箇所に限定していたが、`grep -n '「\${' src/*.js`を走らせると他のファイルにも同型の未処理が残っていた。吹き出し(セリフ)系は`_quoteLine`相当、地の文の引用系は`_quoteVal`相当で言語別化した。

- **`src/battle-anim.js`**: 観戦iframe(battle-engine.html/tag-battle.html)はメイン画面とは別インスタンスのWM_I18Nを持つため、ui-common.jsの`_quoteLine`を直接参照できない。同じロジック(`WM_I18N.lang==='en'`で引用符を落とす)をIIFE外のグローバル関数として複製し、`BattleAnim.renderCutin`のカットインテキストへ適用。両iframe(battle-anim.jsを読むbattle-engine.html/tag-battle.html)から後読みのtag-battle-main.js/battle-engine-main.jsも参照できる位置に置いた
- **`src/tag-battle-main.js`**: タッグ勝利画面の`vic-win-line`(既に`WM_I18N.t(pickTagWinLine(...))`で翻訳済みの`winLine`を「」でハードコード包装していた)を、上記のbattle-anim.js側`_quoteLine`で置き換え
- **`src/app.js`**: `CHALLENGE_REQUEST_NO_LINES`(直訴を見送ったときのアーキタイプ別ティッカーセリフ)が、選択した`line`を**t()に一度も通さず**`reqName`も`pn()`を経由せずに直接文字列連結していた(同型の配線穴・セリフ本体が未訳のためi18n-missにも出ない「サイレントな穴」)。`` `${WM_I18N.pn(reqName)}: ${_quoteLine(WM_I18N.t(line))}` ``へ修正
- **`src/ui-render.js`**: 吹き出し系2箇所(道場ヘッダーのコーチ報告バブル`dojo-scene-bubble`・休憇中選手の`dojo-rest-bubble`)を`_quoteLine`へ、黒田記事の引用系9箇所(`np-kuroda-text`×2・`np-v3-kuroda-text`・`np-rating-comment`・`np-digest-comment`・`np-headline-quote`・`np-war-record`のkuroda byline行・`np-fan-text`・因縁カードの`np-relation-tag-desc`)を`_quoteVal`へ(いずれも表示直前で`kurodaText(...,WM_I18N.t)`または`WM_I18N.t()`により既に翻訳済みの値を、装飾の「」だけがハードコードで包んでいた——`_quoteLine`/`_quoteVal`が対象とする症状そのもの)
- **`src/management.js`**: `_buildPpvSummitStory`の勝者/敗者の言葉(winnerLine/loserLine、新聞記事本文)。`T(sr.winnerLine)`(dict-opts経由で既に翻訳済み)を「」でハードコード包装していた。Engineコードで`WM_I18N`を直接呼べない制約があるため、`T('「{line}」', {line})`の2引数呼び出しに頼らず(`dict`未指定時のフォールバック`T=(s)=>s`は1引数しか扱わないため`{line}`が置換されず壊れる)、`T('「{line}」').replace('{line}', T(line))`という「テンプレ自体をT()に通してから手動で差し込む」形の局所ヘルパー`_quoted`を新設して安全に対応した

いずれも既存キー`「{line}」`(P6-7で新設・ui-ledger)を再利用し、新規のui-ledgerキー追加は不要だった。

### 11-3. シーズン総括カード(§I 今季を彩った記録)の`tag`/`meta`テンプレ化

`Engine.seasonReview.build`(management.js)の4種の記録カード(王座/JT優勝・新人王/メディア功労/春タッグ優勝)が組む`tag`/`meta`が実行時のJS文字列連結による生JAで、英語モードの季総括画面(年1回・オフシーズンで必ず見る画面)に日本語のまま出ていた(P5-2o §8-5で発見済みの残課題)。`build()`内の既存`_line(line, vars)`(dict-opts、P5-2oでnarr向けに導入済み)を`tag`/`meta`にも適用し、以下のテンプレへ分解した。

| 旧(JS連結) | 新テンプレ(ui-ledgerキー) | 備考 |
|---|---|---|
| `tag: '王者'` | `_line('王者')` | 既存キー(→"Champion") |
| `meta: `団体王座 / V${defenses}`` | `_line('団体王座 / V{n}', {n:defenses})` | 新規キー→"Promotion Title / Defense #{n}" |
| `tag: 'JT優勝・新人王'` | `_line('JT優勝・新人王')` | 既存キー(→"JT winner · Rookie of the Year") |
| `meta: 年齢分岐+OVR` | `_line('{age}歳 / OVR {ovr}', ...)` or `_line('OVR {ovr}', ...)` | 新規キー2件 |
| `tag: 'メディア功労'` | `_line('メディア功労')` | 新規キー→"Media Award"(既存の"メディア功労賞"→"Media Merit Award"とは別語彙。カード上の短縮タグ) |
| `meta: `${m.age}歳`` | `_line('{age}歳', {age})` | 既存キー(→"Age {age}") |
| `tag: '春タッグ優勝'` | `_line('春タッグ優勝')` | 既存キー(→"Spring Tag League Winners") |
| `meta: `${f2.name}と組んで`` | `_line('{name}と組んで', {name:f2.name})` | 新規キー→"with {name}"(`{name}`はt()のconvertNamesで自動pn()化) |

新規5キーは`test/i18n-extract-ui.js`の走査対象外(management.jsはui-ledgerのJS_FILES一覧に含まれない——Engineは`_line`/`T`等のdict-opts経由でWM_I18N.tを間接的に呼ぶため、リテラル引数の静的抽出では原理的に拾えない)なので、`i18n/ui-ledger.json`へ`kept:true`+`note`で手追加した。ja側は`_line`が`dict`未指定時に`_fillLine`(旧来の`{key}`置換のみ)にフォールバックするため1バイト不変。

**副作用: ラチェット+1(management.js)**。旧コードは`meta`の一部リテラル(例: `\`${j.age != null ? \`${j.age}歳 / \` : ''}OVR ${j.ovr}\``)がテンプレートリテラルの`${}`補間の中に**さらにネストしたテンプレートリテラル**として書かれており、`test/i18n-scan.js`の走査器がこの入れ子を深さカウントで読み飛ばす(=JA文字列として検出しない)構造だった。テンプレ化後は同じ日本語が独立したトップレベルの文字列リテラル(`'{age}歳 / OVR {ovr}'`等)として現れるため、ラチェットの計測に正しく載るようになった(検出漏れの解消であって新規の直書きではない)。`node test/i18n-ratchet.js --update`で基準を28083→28084に更新(management.js: 2325→2326)。

### 11-4. 残i18n-miss 16件の実コールサイト追跡

fast-forward後の`npm run test:ui:walkthrough:en`(seed42)でi18n-miss 16件(指示書記載どおり)を確認し、全件の出典テーブル・翻訳状態をコードとi18n/dialogue-ledger.jsonの直接照合で特定した(スタックトレース手法は今回不要だった——全16件が単発t()の正しい配線で、二重適用の兆候が無かったため)。

| 分類 | 件数 | 内訳 |
|---|---|---|
| (A) 未訳セリフ=バッチ⑯の対象・対象外 | 15件 | `data.js:FAN_EXPECT_REACTIONS`7件(goodWinner/badWinner各archetype)・`data.js:SPECIAL_EVENT_INTRO`2件(autumnWar.fighter.champion/ppvGrandFinal.fighter.popular)・`data.js:PPV_OPPONENT_LINES`4件・`data.js:BREAKTHROUGH_LINES`1件・`data.js:MOTIVATION_LOSS_LINES`1件。いずれも`i18n/dialogue-ledger.json`に`en:""`で存在(台帳には正しく載っている=構造的な穴ではない)、表示点の配線も単発t()で正しい |
| (B) 配線穴=修正 | 0件 | 該当なし(全16件が単発t()で正しく配線されていた) |
| (C) 動的キー=ui-ledgerへkept行+英訳 | 1件 | `ui-render.js:_getKurodaNewsComment`のインラインフォールバック配列3行のうち1行(`業界の動きは速い。目を離す暇はない`)が実際にヒット。§10-2で「3パイプラインいずれからも見えない」と記録済みの構造穴の実例。残る2行(`他団体の動向は、回り回って我々にも影響する`/`注視すべきニュースだ`)は今回の走破では引かなかったが、同じ構造的欠落のため合わせて3行ともui-ledgerへ`kept:true`で追加・英訳した |

(B)が0件だったため「Bは全部潰す」は該当作業なし(=既に0)。EN走破再実行での実測は§11-6参照。

### 11-5. 新規発見4件(未着手・次バッチ検討事項)

`「${`の全数確認・i18n-miss追跡の過程で、季総括カード以外にも構造的に未配線の箇所が4件見つかった。いずれも**Engine関数がdict/opts自体を持たない**か**生成内容がG(セーブ)へ焼き込まれる持続的コンテンツ**であり、単純な「「」の言語別化」では直せない(周囲の文自体が生JAのままEN画面に残るため、引用符だけ直しても実益が無い)。指示書のスコープ外と判断し、実装には着手していない。

1. **`Engine.flavor`のMAGAZINE_HEADLINES/TV_HEADLINES(management.js:3821-3836、計12テンプレ)**: 雑誌取材・TV出演イベント(週1件・人気選手/王者向けフレーバーイベント)の見出しが`(name) => \`📰 ... 「${name}、...」\``という関数プールで、`Engine.flavor.check(state, rng)`がdict/optsを一切持たずに直接文字列化する。表示点(app.js `showEventPopup({message: ev.headline, ...})`)もt()を通さない。プレイヤーに毎週見える可能性のあるポップアップだが、Engine層の関数シグネチャ変更(dict-opts追加)+テンプレの正規化(`kurodaTemplateOf`的な処理か、テーブルをdata.js/kuroda-text.js側へ移設)が要る中規模タスク
2. **gameLog文字列エントリ内の「」(management.js `advanceWeek`内、6箇所)**: `events.push(\`🏆 「${s.orgName}」が...\`)`等は、アーキテクチャ規約2(`specs/i18n-runtime-spec-v1.0.md` §2-4「旧文字列エントリは無変換で共存」)が定める**gameLogのレガシー文字列形式**そのもの(`G.gameLog`へ直接concatされ永続化される)。この形式は仕様上EN化の対象外(新形式`{type,data}`への移行はgameLog全体の再設計を要する別工程)と判断し、「」の言語別化だけを単独で行っても文全体はJAのまま残るため見送った
3. **`Engine.awards.generateEpithet`(殿堂入り選手の異名、management.js)**: `hofEntry.epithet`/`h.epithet`として**生成時にG(殿堂入りエントリ)へ永続化される**JA文字列で、dict/opts無し。ui-render.js(殿堂detail modal、10319行)とmanagement.js(殿堂入り引退の特別号記事、31221行)の両方で「」ハードコードごしに消費されるが、いずれも中身が100%生JAのため引用符だけ直しても意味が無い。`Engine.awards.composeHallOfFameRetirement`自体もdict/optsを持たない未配線関数
4. **`EMOTION_TEXTS`(ui-render.js、`getEmotionText`が参照するローカル定数)**: 相関図モバイル版(`rm-mobile-emotion`、13050行)が表示する関係性の一人称セリフ表(trust/rival_friend/destined_rival等12カテゴリ×7属性≈84行)。ui-render.js内のローカル`const`でLINES/DIALOGUE命名規則にも合致せず、§5/§6/§9いずれの抽出パイプラインからも見えない**4件目の構造的欠落**(§10-2の3件と同型)。セリフ量・性質(キャラの一人称)から見て本来はdialogue-ledgerの管轄であり、バッチ⑯の領分と判断し未着手

### 11-6. 検証

`node --check`(battle-anim.js/tag-battle-main.js/app.js/ui-render.js/management.js/lang-en.js)全OK。`node test/ja-golden.js`基準と完全一致(hash=6b3d05c8...)。`node test/i18n-build-dict.js`台帳3,321キー全訳。`npm test`260/260 green(newspaper-front-v3-test.js/u5-winloss-safety-net-test.jsの2ファイルへ`_quoteVal`のjaスタブを追加)。`node test/auto-sim.js 20 42` ALL CLEAR(semantic fingerprint 37bbd0cd、P6-7時点と同一)。
