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
- **`test/i18n-build-dict.js`**: 台帳の`en`列が非空の行だけを対象に機械検査(D-B4: プレースホルダ`{name}`集合の完全一致/台帳内重複キー検出/en内の日本語残り検出)を通した上で`src/lang-en.js`(`WM_I18N.addDict({...})`)を生成する。違反時はexit 1で`lang-en.js`を書き換えない。**D-P6-5(通貨フィルタ)対応**: プレースホルダ集合の比較は「基底名」で行う(`{cost:man}`と`{cost}`は同一視。`test/i18n-build-template-dict.js`も同じ拡張)
- **`src/lang-en.js`**: 自動生成物(手編集禁止)。index.html/battle-engine.html/tag-battle.htmlの`i18n.js`直後で読み込む(release/manifest.json登録済み)。D-B2により辞書に無いキーは原文のままfail-open表示されるため、翻訳バッチが未完了でも安全にコミットできる
- 運用: 翻訳バッチ(Opus主筆)が`i18n/ui-ledger.json`の`en`列を埋める→`node test/i18n-build-dict.js`で再生成→`node test/ja-golden.js`(ja不変)・`node test/i18n-ratchet.js`(増加なし)・ENモードでのwalkthroughで検証、のループを回す

## 6. テンプレ辞書の生成パイプライン(Stage B P4-2で追加。設計: docs/i18n-stage-b-p4-design-v0.1.md D-P4-1/D-P4-2)

UI文字列(§5)とは別に、data.jsのテンプレ表(ニュース記事・新聞・戦績ログの完全文テンプレート)を対象にした並行パイプライン。台帳・生成物とも§5とは別ファイルで、`WM_I18N.addDict()`は複数回呼んでも既存辞書へマージされる(src/i18n.js実装)ため読み込み順は問わない。

- **対象テーブル(data.js、14個)**: `GAMELOG_TEMPLATES` `FINISH_TEXT` `PPV_SUMMIT_HEADLINE_TEMPLATES` `PPV_SUMMIT_MATCHPART_TEMPLATES` `PPV_SUMMIT_HPNOTE_TEMPLATES` `PPV_UNDERCARD_HEADLINE_TEMPLATES` `PPV_UNDERCARD_BODY_TEMPLATES` `AI_INJURY_RETIREMENT_TEMPLATES` `AI_CONTRACT_DEPARTURE_TEMPLATES` `CROSS_WAR_RESULT_TEXT` `LEAGUE_ELEVATION_TEXT` `NEWSPAPER_SUB_TEMPLATES` `NEWS_HEADLINE_TEMPLATES` `NEWS_TICKER_TEMPLATES`。`PPV_SUMMIT_VICTORY_LINES`(選手個人のセリフ)は対象外(P5のセリフ層で扱う)
- **対象テーブル追加(kuroda-text.js、13個。P4-5で追加)**: `KURODA_HEADLINES` `KURODA_EDITORIAL` `KURODA_WAR_RECORD` `KURODA_MATCHUP_FLAVOR` `FAN_OPINIONS` `NEWSPAPER_DIGEST_COMMENTS` `KURODA_SHOW_RATING` `KURODA_PREVIEW` `KURODA_SPOTLIGHT` `KURODA_NEWS_COMMENT` `KURODA_RELATION_NARRATIVE` `KURODA_CRISIS` `KURODA_GAMEOVER`。`NEWSPAPER_DIGEST_COMMENTS`/`FAN_OPINIONS`は指示書上「data.jsにあれば」だったが実体はkuroda-text.jsのみに存在(2026-09-04確認)。`FAN_HANDLES`(ファンハンドル名の識別子文字列)は日本語を含まないため対象外。`KURODA_PREVIEW`は消費点(呼び出し箇所)がsrc/*.jsのどこにも見つからない死蔵テーブル(docs/archive参照では過去に配線予定だった形跡があるが未実装のまま)— 台帳には抽出するが実配線なし
- **対象テーブル追加(app.js、2個。P4-5で追加)**: `App._NEWSPAPER_HEADLINES` `App._NEWSPAPER_ARTICLES`(自団体新聞の見出し/本文プール)。App.のプロパティでトップレベルconstではないため、`test/i18n-extract-templates.js`が波かっこ深さカウントでapp.jsソースから該当オブジェクトリテラルのテキスト範囲だけを切り出し、`eval()`で単独評価して取得する(app.js全体を読み込まない。DOM依存の副作用を避けるため)
- **`test/i18n-extract-templates.js`**: 上記(data.js 14個 + kuroda-text.js 13個 + app.js 2個)テーブルの値を再帰ウォーカー(文字列/配列/オブジェクト/関数値の任意のネストを辿り、訳出可能な文字列の葉を全て拾う。関数値の扱いは次項)で走査し、`i18n/template-ledger.json`(配布対象外・manifest未登録)を生成する。台帳スキーマは§5のui-ledgerと同一(`{ key, en, files, count, hasPlaceholder, hasProperNoun }`)だが、`files`欄は「参照テーブル名」を意味する(§5では「ソースファイル名」)。data.js/kuroda-text.jsは`test/helpers/load-game.js`の`loadAsGlobal`(const→var変換+vm実行)で読み込む(module.exports未登録のテーブルも取得できる。ソースファイル自体は変更しない)。**台帳の保持マージ(P4-5で追加、P5のdialogue-ledgerと同じ作法)**: 既存台帳のen列(非空)は再生成時に上書きしない(新規行にのみ空文字のenを書く)
- **関数値(`d => \`...${d.x}...\`\`)の正規化(P4-5で追加)**: kuroda-text.js/app.jsのプールの多くは、値がJSテンプレートリテラルで補間まで済ませる関数であり、data.jsの14テーブルが使う「`{name}`プレースホルダ文字列」とは形が異なる。素直には辞書キー(=補間前のJA原文)を取れないため、**`src/kuroda-text.js`に追加した`kurodaTemplateOf(fn)`**が関数ソース(`fn.toString()`)を軽量パースし、`${d.prop}` / `${d.a.b}` / `${d.a.b()}`(引数なしメソッド呼び出しのみ)を`{propName}`形式のプレースホルダへ機械的に正規化する(`kurodaParamName(path)`が`"a.b"→"aB"`のようにcamelCase化)。三項演算子で分岐する関数本体全体・入れ子テンプレートリテラル・`Math.abs()`等の計算式を含む関数は正規化できない(null)ため、台帳に載らず「保留」として`docs/i18n-p4-5-kuroda-holdout-audit.md`(抽出器が実行のたびに再生成)に集計される。0引数関数(補間なしの固定文)は`fn()`の戻り値をそのままJA原文として扱う。**`kurodaText(entry, d, dict)`**が唯一の消費入口: `entry`(関数 or 文字列)を`kurodaTemplateOf`で正規化できればプレースホルダ値を`kurodaEvalPath(d, path)`で解決して`dict(template, params)`(=`WM_I18N.t`と同じ`(text, params)`契約)を呼び、正規化できない(または`dict`省略時)は従来通り`entry(d)`を直接呼ぶ(fail-open。適用前と挙動が完全に同一 = ja出力1バイト不変)。呼び出し元(ui-render.js/app.js)は`kurodaText(pool要素, d, WM_I18N.t)`の形で呼ぶだけでよく、Engine層は一切関与しない(消費点は全てUI層 — ui-render.js/app.jsのみ)
- **`test/i18n-build-template-dict.js`**: 台帳の`en`列が非空の行だけを対象に機械検査(§5のD-B4と同じプレースホルダ完全性/重複キー/日本語残り検出)に加え、**黒田禁止語grep**(docs/en-kuroda-style-draft-v0.1.md §3-6のタブロイド語彙・慨嘆の暴走・スポーツ面常套句・翻訳調等9パターン)を通した上で`src/lang-en-templates.js`(`WM_I18N.addDict({...})`)を生成する。違反時はexit 1で書き換えない
- **`src/lang-en-templates.js`**: 自動生成物(手編集禁止)。index.htmlの`lang-en.js`直後で読み込む(release/manifest.json登録済み)。辞書に無いキーはfail-openで原文表示。`test/i18n-scan.js`のラチェット計測対象からは除外している(`lang-en.js`と同じ理由 — JSON化されたJAキーを生の直書き文字列と誤検出しないため)
- **Engine側のlang糸通し規約**: 構造規約1(Engineは WM_I18N を呼ばない)を保ったまま生成時言語を確定させるため、Engine内でテンプレを充填してGへ焼く関数は**末尾の任意引数として`opts`(`{ lang, dict }`)、または既存の`dict`パラメータ**を受け取り、テンプレ参照直後に`dict(tpl)`を通す形にする(`dict`未指定時は恒等関数と同じ=JA原文のまま)。呼び出し元(app.js等、Engineでないレイヤー)が`WM_I18N.t`を`dict`として渡す。先例: `Engine.formatFinish(finType, finMove, isFinisher, dict)` / `Engine.newspaper.generate(state, rng, opts)` / `Engine.newspaper.publish(state, rng, extra)`(`extra.opts`を`generate`へ転送) / `Engine.news.generateTicker(rng, state, opts)` / `tickWeek(state, opts)` / `Engine.advanceWeek(state, opts)`(いずれも`opts`省略時=auto-sim/ja-goldenの既存呼び出しは無改修でJA不変)。**P5基盤修正(2026-09-03)で追加**: `Engine.factions.getCommon1Line(category, ctx, dict)` / `Engine.factions.getCommon5Line(category, ctx, dict)` / `Engine.factions.getCommon7Line(category, ctx, dict)` / `Engine.factions.getF07Line(category, ctx, dict)` / `Engine.factions.getTransitionLine(reasonKey, leader, vars, dict)` / `pickTagLossLine(fighter, partnerName, dict)` / `pickTagWinCommentary(winnerName, partnerName, moveName, dict)`(§9「既知の限界」で挙げていた7関数の根治。呼び出し元はいずれも`WM_I18N.t`を渡し、戻り値を改めて`WM_I18N.t()`で包み直さない — 包み直すと置換済みの完成文が辞書キー(未置換の原文)と一致せずfail-openするため)。**契約交渉セリフ(2026-09-03)で追加**: `Engine.contract.selectDialogue(rng, fighter, phase, context, dict)` — ホスト文はプールから選んだ直後(プレースホルダ`{tenure}{record}{rivalry}{tenure_farewell}{wins}{losses}{n}{rivalName}`を置換する前)にdictへ通す。差し込み断片(tenure/record/rivalry/tenure_farewell)は共通ヘルパー`Engine.contract._toneFragment(block, fighter, dict)`が断片選択直後(`{n}`/`{rivalName}`置換前)にdictへ通すため、`_insertTenure/_insertRecord/_insertRivalry/_insertTenureFarewell(text, ctx, fighter, dict)`も同じ`dict`を素通しするだけでよい。`Engine.contract.resolveNegotiation(rng, state, neg, choiceIdx, subChoice, dict)`は内部の2箇所の`selectDialogue`呼び出しへ`dict`をそのまま転送する(resolveNegotiation自身はWM_I18Nを直接参照しない)。呼び出し元(ui-common.js/app.js)は`WM_I18N.t`を渡す。**P4-5(2026-09-04)で追加**: `Engine.ending.buildGameOverData(state, dict)`(KURODA_GAMEOVERの`kurodaColumn`を生成時点で確定。呼び出し元app.jsが`WM_I18N.t`を渡す。dict省略時は恒等関数=既存呼び出しは無改修でJA不変)
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
- **`test/i18n-extract-dialogue.js`**: 対象ファイルの全トップレベル`const`宣言名を`_`区切りで走査し、セグメントに`LINES`/`DIALOGUE`/`DIALOGUES`を含むものを「セリフ格納テーブル」として自動抽出する(手動例外は`EXTRA_INCLUDE`/`EXTRA_EXCLUDE`の計3件のみ)。値は再帰ウォーカーで文字列の葉を全て拾い、`i18n/dialogue-ledger.json`を生成する。台帳スキーマは`{ key, en, files, count, hasPlaceholder, hasProperNoun, cell }`(§5/§6と同型+`cell`)。`files`は`ファイル名:テーブル名`形式。`cell`は文字列の祖先オブジェクトキー列をarchetype 7種/personality 7種の語彙と照合したベストエフォート判定(`{archetype, personality}`。判定が割れる場合はnull)。**P5基盤修正(2026-09-03)で追加**: 語彙一致で取れない場合のフォールバックとして、祖先オブジェクトの全キーがALL_CHARSの実在idと一致し閾値(5件)以上のとき「ID軸ノード」とみなし、配下のcharIdをALL_CHARSで引いてcellを解決する(`victory-lines.js:VICTORY_LINES`等のキャラID軸テーブル向け)。また既存`i18n/dialogue-ledger.json`が存在する場合、`en`(非空)と`cell`(非null)は再生成時に上書きしない保持マージ動作を持つ(翻訳バッチ・ネイティブ検品の手作業投入を機械抽出の再実行で消さないため)
- **`test/i18n-build-dialogue-dict.js`**: 台帳の`en`列が非空の行のみを対象に、§5のD-B4(プレースホルダ完全性/重複キー/日本語残り)+吹き出し長110字上限+**D-P5-3セル別検査**(ojousama帯=短縮形禁止・所有格's許可/cool帯=感嘆符禁止+3文超禁止/delinquent帯以外=hell・damn禁止/全帯=f・sワード禁止)を通した上で`src/lang-en-dialogue.js`を生成する。違反時はexit 1で書き換えない
- **`src/lang-en-dialogue.js`**: 自動生成物(手編集禁止)。index.html/battle-engine.html/tag-battle.htmlの`lang-en.js`(index.htmlのみ`lang-en-templates.js`)直後で読み込む(release/manifest.json登録済み)。辞書に無いキーはfail-openで原文表示
- **表示点の配線規約**: セリフ選択ロジック(乱数選択・archetype/personalityフォールバック連鎖)には触れず、選択された生JA文字列を表示直前に`WM_I18N.t()`へ1回通す。プレースホルダを含む行は**t()を`.replace()`系より前に置く**(辞書キーは`{name}`が残った生テンプレートと一致させる必要がある)。data.js/factions.js/victory-lines.js/battle-lines.js/tag-battle-lines.js/ppv-lines.js側のセリフ選択関数(Engine純粋関数)は無改修のまま、呼び出し元(ui-common.js/ui-render.js/battle-engine-main.js/tag-battle-main.js)側でt()を挟む。60箇所超の呼び出し元を持つ`_u3bSideHtml`のような共通レンダラに集約すると高効率
- **既知の限界(2026-09-03のP5基盤修正で解消)**: `Engine.factions.getCommon1Line`/`getCommon5Line`/`getCommon7Line`/`getF07Line`/`getTransitionLine`(factions.js)、`pickTagWinCommentary`/`pickTagLossLine`(tag-battle-lines.js)は選択直後に内部で`{name}`等のプレースホルダを置換してから返す実装のため、これらの戻り値はプレースホルダを含む行に限りt()の辞書キーと一致せずfail-openしていた(プレースホルダを含まない行は正しく効いていた)。§6と同じ「Engine関数へ`dict`optsパラメータを足す」設計を7関数すべてに適用して根治した(先例は§6参照)。呼び出し元(ui-common.js/app.js/tag-battle-main.js)は戻り値を改めて`WM_I18N.t()`で包み直さない — 一部の呼び出し元(`_u3bSideHtml`/`_mdlASubjectStage`等、既に訳された文字列を渡しても内部でt()を呼ぶ共通レンダラ)では二重にt()が呼ばれるが、対象が既に英語のためfail-open(ミスログ)で無害
- 運用: 翻訳バッチ(Opus主筆)が`i18n/dialogue-ledger.json`の`en`列を埋める→`node test/i18n-build-dialogue-dict.js`で再生成→`node test/ja-golden.js`(ja不変)・`npm test`・`npm run test:ui:walkthrough`(EN抜き取り)で検証、のループを回す
