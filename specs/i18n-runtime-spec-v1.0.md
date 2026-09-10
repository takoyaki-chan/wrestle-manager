# i18n実行基盤仕様 v1.0(Stage A確定分)

- 確定: 2026-09-02(Stage A P1〜P3a完了時にspecs昇格)。設計経緯は docs/i18n-stage-a-p1-design-v0.1.md / p3a-design-v0.1.md、監査台帳は docs/i18n-stage-a-p2-audit-v0.1.md
- スコープ: **翻訳可能化の実行基盤と構造規約**。英訳そのもの(辞書の中身・トーンバイブル)はStage B(正: docs/en-tone-bible-draft-v0.1.md)

## 1. WM_I18N(src/i18n.js)

- 全スクリプトより先に読み込む(index.html/battle-engine.html/tag-battle.htmlの先頭script。release/manifest.json登録済み)
- `t(text, params?)`: キーは**日本語原文**。ja=辞書非経由の素通し(params時は`{name}`置換のみ)/en=辞書引き・ミス時はfail-openで原文+`[WM] [i18n-miss]`ログ(セッション中1回・フライトレコーダーが拾う)/pseudo=`⟦原文~~⟧`(~は40%長・レイアウト溢れ検査用)
- **プレースホルダフィルタ`{name:filter}`(Stage B P6 D-P6-5、2026-09-02追加)**: `params[name]`をフィルタ関数へ通してから埋め込む。ja側テンプレは常に無フィルタの`{name}`のままでよい(基底名が同じなら同一パラメータとして解決される。t()の`applyParams`とdata.jsの`fillTemplateVars`が同一契約の正規表現実装を独立に持つ — 後者はi18n.js非依存で単体読み込みされるため)。現在の唯一のフィルタは`man`(通貨B方式): 万単位の数値/カンマ区切り数字文字列(符号可)を英語圏標準のk/M表記へ変換する。100万未満(絶対値<100)→整数k(例: 15→150k)、100万以上→小数1桁までのM(末尾.0削除。例: 300→3M、120→1.2M、30000→300M)。符号はk/M表記の頭に付く。数値化できない値・未知のフィルタ名はいずれもfail-open(値をそのまま挿入)
- `setLang('ja'|'en'|'pseudo')`: localStorage `wm_lang`(既定ja)。**セーブ(G)に言語は入れない**。切替UIは開発パネル(Ctrl+Shift+D)に加え、タイトル画面の言語トグル(Stage B/P6-12、`App.setTitleLanguage()`)からも変更できる
- **言語の決まり方(`readStoredLang()`、P6-12で確定)**: 起動時は毎回 1) `localStorage.wm_lang` が**保存済み**ならそれを常に尊重(不正値でも既定`ja`に落とすだけでブラウザ言語は見ない) → 2) **未設定**(そのブラウザで一度も選ばれたことがない=初回起動)のときだけ`navigator.language`(**最優先の1言語のみ**。取得できない稀な環境でだけ`navigator.languages[0]`で代替)を見て、`en`で始まればEN、それ以外はJAを初期既定にする → 3) `navigator`不在・取得失敗はいずれもfail-openで`ja`。**`navigator.languages`の2番目以降(副次的な言語プリファレンス)は見ない**——主言語がjaでも配列に`en-US`等が混じる環境は珍しくなく、そこまで見ると「ブラウザの主言語はjaなのにENが既定になる」誤判定になる(実装時にPlaywright環境で実測)。この既定判定はwm_lang書き込みを伴わない(次回起動時も同じロジックで再計算されるだけで、ブラウザ言語が変われば既定も追従する)。タイトル画面の言語トグルで明示的に選んだ後は1)が常に優先されるため、既定判定は二度と発火しない
- `addDict({原文: 訳文})`: Stage Bで英語辞書を登録する入口
- `applyDom(root?)`: 静的HTML用。`data-i18n`要素のtextContent/`data-i18n-attr="title,placeholder"`属性を、原文退避(`data-i18n-orig`)→t()適用。DOMContentLoadedとsetLangで自動実行
- 観戦iframeは自windowに別インスタンス(wm_lang共有で言語は揃う。試合ごとに開き直すため親のsetLangへの追従は不要)
- **名前辞書 PN_EN(Stage B P6 D-P6-1〜D-P6-3、2026-09-03追加)**: 選手・コーチ名等はdata由来の**値**としてUIへ出るため、キー一致のt()では訳せない。`dict`(通常UI辞書)とは別領域`names`を持つ
  - `addNames({原文: 訳文})`: 名前辞書への登録入口。生成元は `test/i18n-build-names.js`(`i18n/names-ledger.json` → `src/lang-en-names.js`)。複数回呼び出し可(既存へマージ)
  - `pn(str)`: `str`が名前辞書に完全一致すればEN訳を返す。無ければ原文のまま(fail-open)。`lang!=='en'`(ja/pseudo)は素通し(t()のpseudo分岐が辞書引きをしないのと対称)。直接補間(`${c.name}`)の表示サイトを段階移行する入口
  - **D-P6-3実装(2026-09-04、P6-3)**: ui-render.js/ui-common.js/app.js/battle-engine-main.js/tag-battle-main.jsの`.name`/`.surname`直接補間サイトを機械列挙・分類し、表示サイトへ`pn()`を497箇所配線(内訳・完走画面はworklog参照)。**除外した箇所**: gameLog/growthLog/`_pending*`等G保存値に焼き込まれる文字列(D-P6-4「セーブ内の名前は日本語のまま」を厳守)、開発診断ログ(`wmDiag`)、`.name.toLowerCase().includes()`等の検索フィルタ(ロジック比較)、kurodaText系テンプレプール(`App._NEWSPAPER_HEADLINES`/`_ARTICLES`。P4-5の`kurodaTemplateOf()`正規化+D-P6-2のt()パラメータ自動変換で別途訳される)。`.charAt(0)`/`.substring()`/`.split()`等の切り詰め表示は`pn()`適用後に切り詰める順序(EN名の頭文字/姓を正しく取るため)。残約634箇所(主にapp.js)は次バッチの長尾対象
  - **t()のパラメータ値自動変換**: `applyParams(str, params, convertNames)`の第3引数が真のとき、挿入する値が文字列かつ名前辞書に完全一致すれば、プレースホルダフィルタ(`{name:man}`等)適用より前段で訳文へ差し替える。`t()`は`en`ブランチのときだけ`convertNames=true`で呼ぶ(ja/pseudoは従来どおり無変換=1バイト不変)。これによりテンプレ経由の名前(`{name}`/`{winner}`等)は配線ゼロで英語化される
  - 姓のみ表示(隊列ラベル・戦績表・派閥名等)向けに、フルネームとは別に姓単独のキーも登録される(例: `"富岡加奈子"→"Kanako Tomioka"`と`"富岡"→"Tomioka"`の両方)。表記の正は `docs/en-proper-nouns-draft-v0.1.md`(2026-09-02 Keisuke裁定確定分)。ID13 堂前ユキ(given name Yuki)とID108 結城玲奈(surname 結城)のローマ字衝突は、ID108を`Rena Yuuki`(結城=Yuuki)へ上書きして回避
  - **姓のみ辞書 pnSurname(Stage B P6-11、2026-09-04追加)**: `names`(pn)とは別領域`surnames`を持つ。キーは**フルネームJA**(pn()と同じ入力形)、値は**姓のみEN**。`addSurnames({フルネームJA: 姓のみEN})`が登録入口(生成元は`test/i18n-build-names.js`が`i18n/names-ledger.json`のcharacters/coaches各行の`ja`→`enSurname`を突合して`src/lang-en-names.js`へ出力。`addNames`呼び出しの直後に`addSurnames`も呼ばれる)。`pnSurname(str)`は姓のみ辞書に完全一致すればEN姓を返し、無ければ`pn(str)`(フルネーム訳、それも無ければ原文)へfail-open。ja/pseudo時は素通し(pn()と対称)。`.flink`/`.jtc-fn`/`.tc-fn`/`.nm-tag`のような固定幅1行枠(ブラケット表・ランキングタグ)で、英語フルネームだと折り返し無しでは収まらない箇所向け(docs/i18n-en-layout-overflow-report-v0.1.md §5-B/§9)
- **`<html lang>`属性の同期(Stage B P6-11、2026-09-04追加)**: `syncHtmlLangAttr()`が`document.documentElement.lang`を`setLang()`呼び出し時と読み込み時に`'en'`(currentLang==='en')/`'ja'`(それ以外、pseudo含む)へ同期する。静的HTML(`src/index.html`等)は`<html lang="ja">`固定のため、これが無いとEN専用CSS(`html[lang="en"] .foo{...}`)がJAの見た目に一切触れずにレイアウトだけ言語別に出し分けるという設計が成立しない。§12参照

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

- **対象テーブル(data.js、16個)**: `GAMELOG_TEMPLATES` `FINISH_TEXT` `PPV_SUMMIT_HEADLINE_TEMPLATES` `PPV_SUMMIT_MATCHPART_TEMPLATES` `PPV_SUMMIT_HPNOTE_TEMPLATES` `PPV_UNDERCARD_HEADLINE_TEMPLATES` `PPV_UNDERCARD_BODY_TEMPLATES` `AI_INJURY_RETIREMENT_TEMPLATES` `AI_CONTRACT_DEPARTURE_TEMPLATES` `CROSS_WAR_RESULT_TEXT` `LEAGUE_ELEVATION_TEXT` `NEWSPAPER_SUB_TEMPLATES` `NEWS_HEADLINE_TEMPLATES` `NEWS_TICKER_TEMPLATES` `RETIREMENT_TEMPLATES`(**P6-10で追加**。通常引退記事のティア別テンプレ{L,A,B,C}×3変種×headline/body=24本。兄弟の`AI_INJURY_RETIREMENT_TEMPLATES`は最初から対象だったのに本表だけが一覧から漏れており、ENでも引退記事がJAのまま出ていた — §11-5の`EMOTION_TEXTS`と同型の構造穴。消費点は`Engine.newspaper._fillRetirementTemplate(t, d, dict)`でP6-10にdict-opts化済み) `HOF_BIOGRAPHY_TEMPLATES`(**P6-14で追加**。殿堂入り選手の語り文。導入6分岐×3 + 核心19分岐×2〜3 + 余韻3系統 + 連結様式`join` = 85本。P6-10までは`Engine.awards.generateBiography()`の**関数本体に直書きされた配列リテラル**で、§10-2が禁じた「関数の中の配列はどの抽出器からも永久に見えない」型だった。消費点は`generateBiography(entry, dict)`でP6-14にdict-opts化済み。詳細は§13)。`PPV_SUMMIT_VICTORY_LINES`(選手個人のセリフ)は対象外(P5のセリフ層で扱う)
- **対象テーブル追加(data.js、7個。P7-2で追加)**: `SNAPSHOT_TEXTS` `ATMOSPHERE_TEXTS` `FAREWELL_KIND_TEXT` `LOCKER_AIR_TEXTS` `CAMP_FLAVOR_TEXTS` `PRE_WINDOW_TEXTS` `TEAM_SPIRIT_TEXTS`(§13-2 B の分類A「地の文プール」前半373行。Engine/UIが直に読む状況描写・演出文で、消費点がt()もdictも持たなかった層)。`ATMOSPHERE_TEXTS`の`emoji`フィールドだけは抽出器の`TABLE_PATH_FILTER`で除外する。配線は§15
- **対象テーブル追加(data.js、2個。P6-18で追加)**: `PROLOGUE_TEMPLATES`(序章の章題/記者の見立て/章末/ハイライト12種=17行。`Engine.prologue` が `G.prologue` へ焼く文と、ui-render.js の静的文をまとめて置く表。UIの静的文も**あえて本表に置く**ことで `WM_I18N.t()` の引数が非リテラルになり、extract-ui からは見えない=二重登録が起きない) `CHRONICLE_UNIT_TEXTS`(年代記カードの「数値+単位語」12行。`<span class="small">` 込みのテンプレで、ENは充填値で単複が変わらない形にする)。配線は§23
- **対象テーブル追加(data.js、2個。P6-17で追加)**: `CHRONICLE_CHAPTER_TEMPLATES`(年代記の章タイトル3 / サブタイトル29 / 章末12 / ハイライト行49=93行。`Engine.chronicle.SUBTITLE_TEMPLATES`/`CLOSING_TEMPLATES` のプロパティと `_generateTitle`/`_buildHighlights` の関数内直書きの移設先) `WEEKLY_STORY_EVENT_TEXTS`(週次ストーリーイベントの `[grievance]`/`[hostile-pairs]` 8行。gameLogレガシー文字列専用で**表示はJA固定**)。配線は§21
- **対象テーブル追加(kuroda-text.js、13個。P4-5で追加)**: `KURODA_HEADLINES` `KURODA_EDITORIAL` `KURODA_WAR_RECORD` `KURODA_MATCHUP_FLAVOR` `FAN_OPINIONS` `NEWSPAPER_DIGEST_COMMENTS` `KURODA_SHOW_RATING` `KURODA_PREVIEW` `KURODA_SPOTLIGHT` `KURODA_NEWS_COMMENT` `KURODA_RELATION_NARRATIVE` `KURODA_CRISIS` `KURODA_GAMEOVER`。`NEWSPAPER_DIGEST_COMMENTS`/`FAN_OPINIONS`は指示書上「data.jsにあれば」だったが実体はkuroda-text.jsのみに存在(2026-09-04確認)。`FAN_HANDLES`(ファンハンドル名の識別子文字列)は日本語を含まないため対象外。`KURODA_PREVIEW`は消費点(呼び出し箇所)がsrc/*.jsのどこにも見つからない死蔵テーブル(docs/archive参照では過去に配線予定だった形跡があるが未実装のまま)— 台帳には抽出するが実配線なし
- **対象テーブル追加(app.js、2個。P4-5で追加)**: `App._NEWSPAPER_HEADLINES` `App._NEWSPAPER_ARTICLES`(自団体新聞の見出し/本文プール)。App.のプロパティでトップレベルconstではないため、`test/i18n-extract-templates.js`が波かっこ深さカウントでapp.jsソースから該当オブジェクトリテラルのテキスト範囲だけを切り出し、`eval()`で単独評価して取得する(app.js全体を読み込まない。DOM依存の副作用を避けるため)
- **対象テーブル追加(management.js、2個。P6-10で追加)**: `Engine.flavor.MAGAZINE_HEADLINES` `Engine.flavor.TV_HEADLINES`(雑誌取材・TV出演フレーバーイベントの見出しプール各6本)。app.jsの2プールと同じ理由(トップレベルconstではない)で、抽出器の`extractArrayLiteralProp()`(`extractAppObjectLiteral`の**角かっこ版**)がmanagement.jsソースから当該配列リテラルの範囲だけを切り出して単独評価する(management.js全体は読み込まない)。台帳の`files`欄は`management.js:MAGAZINE_HEADLINES` / `:TV_HEADLINES`
- **`test/i18n-extract-templates.js`**: 上記(data.js 14個 + kuroda-text.js 13個 + app.js 2個)テーブルの値を再帰ウォーカー(文字列/配列/オブジェクト/関数値の任意のネストを辿り、訳出可能な文字列の葉を全て拾う。関数値の扱いは次項)で走査し、`i18n/template-ledger.json`(配布対象外・manifest未登録)を生成する。台帳スキーマは§5のui-ledgerと同一(`{ key, en, files, count, hasPlaceholder, hasProperNoun }`)だが、`files`欄は「参照テーブル名」を意味する(§5では「ソースファイル名」)。data.js/kuroda-text.jsは`test/helpers/load-game.js`の`loadAsGlobal`(const→var変換+vm実行)で読み込む(module.exports未登録のテーブルも取得できる。ソースファイル自体は変更しない)。**台帳の保持マージ(P4-5で追加、P5のdialogue-ledgerと同じ作法)**: 既存台帳のen列(非空)は再生成時に上書きしない(新規行にのみ空文字のenを書く)
- **関数値(`d => \`...${d.x}...\`\`)の正規化(P4-5で追加)**: kuroda-text.js/app.jsのプールの多くは、値がJSテンプレートリテラルで補間まで済ませる関数であり、data.jsの14テーブルが使う「`{name}`プレースホルダ文字列」とは形が異なる。素直には辞書キー(=補間前のJA原文)を取れないため、**`src/kuroda-text.js`に追加した`kurodaTemplateOf(fn)`**が関数ソース(`fn.toString()`)を軽量パースし、`${d.prop}` / `${d.a.b}` / `${d.a.b()}`(引数なしメソッド呼び出しのみ)を`{propName}`形式のプレースホルダへ機械的に正規化する(`kurodaParamName(path)`が`"a.b"→"aB"`のようにcamelCase化)。三項演算子で分岐する関数本体全体・入れ子テンプレートリテラル・`Math.abs()`等の計算式を含む関数は正規化できない(null)ため、台帳に載らず「保留」として`docs/i18n-p4-5-kuroda-holdout-audit.md`(抽出器が実行のたびに再生成)に集計される。0引数関数(補間なしの固定文)は`fn()`の戻り値をそのままJA原文として扱う。**プール要素は「分岐を関数本体に書かない」のが規約(P4-7で確立)** — 正規化できない形はfail-openでENでもJA文が出るため、条件分岐は次の2手のどちらかでデータ側へ出す: (a)**条件ごとに独立プールへ分割し、選択を消費点または薄いヘルパへ寄せる**(先例: `KURODA_SPOTLIGHT`の`star`を総合力帯ごとに`starAce`/`starSolid`/`starPopular`へ分割し、帯の解決を`kurodaSpotlightStarKey(ovr)`に集約)、(b)**`kurodaVariants([{when, text}, …])`でラップする**(`when`省略の枝がelse相当。返り値は従来どおり呼び出し可能な関数で、`entry.pickVariant(d)`が枝を返し、`entry.variants`が全枝を列挙する。`kurodaText`は枝を解決してから通常のプール要素として訳出し、抽出器の`walkStrings`は全枝を台帳へ載せる。`toString()`は全枝のソースを連結して返す — ui-render.jsの`_filterPraiseByMQ`等がプール要素の`fn.toString()`を正規表現で検査して本文を選別しているため)。**どちらの手でも配列長を変えないこと**(`Engine.rng.pick`が引く添字と`_npRivalryPairIndex % pool.length`が長さに依存しており、長さが変わるとJA出力が変わる)。計算式(`Math.abs()`等)は消費点で先に算出して`d`へ渡す(先例: `KURODA_WAR_RECORD.loseStreak`の`{streakAbs}`)。P4-5時点の保留16件はP4-7(2026-09-04)でこの規約に沿って全件解消され、**保留は0件**になった。**`kurodaText(entry, d, dict)`**が唯一の消費入口: `entry`(関数 or 文字列)を`kurodaTemplateOf`で正規化できればプレースホルダ値を`kurodaEvalPath(d, path)`で解決して`dict(template, params)`(=`WM_I18N.t`と同じ`(text, params)`契約)を呼び、正規化できない(または`dict`省略時)は従来通り`entry(d)`を直接呼ぶ(fail-open。適用前と挙動が完全に同一 = ja出力1バイト不変)。呼び出し元(ui-render.js/app.js)は`kurodaText(pool要素, d, WM_I18N.t)`の形で呼ぶだけでよく、Engine層は一切関与しない(消費点は全てUI層 — ui-render.js/app.jsのみ)
- **`test/i18n-build-template-dict.js`**: 台帳の`en`列が非空の行だけを対象に機械検査(§5のD-B4と同じプレースホルダ完全性/重複キー/日本語残り検出)に加え、**黒田禁止語grep**(docs/en-kuroda-style-draft-v0.1.md §3-6のタブロイド語彙・慨嘆の暴走・スポーツ面常套句・翻訳調等9パターン)を通した上で`src/lang-en-templates.js`(`WM_I18N.addDict({...})`)を生成する。違反時はexit 1で書き換えない
- **`src/lang-en-templates.js`**: 自動生成物(手編集禁止)。index.htmlの`lang-en.js`直後で読み込む(release/manifest.json登録済み)。辞書に無いキーはfail-openで原文表示。`test/i18n-scan.js`のラチェット計測対象からは除外している(`lang-en.js`と同じ理由 — JSON化されたJAキーを生の直書き文字列と誤検出しないため)
- **Engine側のlang糸通し規約**: 構造規約1(Engineは WM_I18N を呼ばない)を保ったまま生成時言語を確定させるため、Engine内でテンプレを充填してGへ焼く関数は**末尾の任意引数として`opts`(`{ lang, dict }`)、または既存の`dict`パラメータ**を受け取り、テンプレ参照直後に`dict(tpl)`を通す形にする(`dict`未指定時は恒等関数と同じ=JA原文のまま)。呼び出し元(app.js等、Engineでないレイヤー)が`WM_I18N.t`を`dict`として渡す。先例: `Engine.formatFinish(finType, finMove, isFinisher, dict)` / `Engine.newspaper.generate(state, rng, opts)` / `Engine.newspaper.publish(state, rng, extra)`(`extra.opts`を`generate`へ転送) / `Engine.news.generateTicker(rng, state, opts)`(**2026-09-06 P7-36で削除**。📰ティッカー廃止に伴い関数ごと撤去。パターン自体は他の先例で健在) / `tickWeek(state, opts)` / `Engine.advanceWeek(state, opts)`(いずれも`opts`省略時=auto-sim/ja-goldenの既存呼び出しは無改修でJA不変)。**P5基盤修正(2026-09-03)で追加**: `Engine.factions.getCommon1Line(category, ctx, dict)` / `Engine.factions.getCommon5Line(category, ctx, dict)` / `Engine.factions.getCommon7Line(category, ctx, dict)` / `Engine.factions.getF07Line(category, ctx, dict)` / `Engine.factions.getTransitionLine(reasonKey, leader, vars, dict)` / `pickTagLossLine(fighter, partnerName, dict)` / `pickTagWinCommentary(winnerName, partnerName, moveName, dict)`(§9「既知の限界」で挙げていた7関数の根治。呼び出し元はいずれも`WM_I18N.t`を渡し、戻り値を改めて`WM_I18N.t()`で包み直さない — 包み直すと置換済みの完成文が辞書キー(未置換の原文)と一致せずfail-openするため)。**契約交渉セリフ(2026-09-03)で追加**: `Engine.contract.selectDialogue(rng, fighter, phase, context, dict)` — ホスト文はプールから選んだ直後(プレースホルダ`{tenure}{record}{rivalry}{tenure_farewell}{wins}{losses}{n}{rivalName}`を置換する前)にdictへ通す。差し込み断片(tenure/record/rivalry/tenure_farewell)は共通ヘルパー`Engine.contract._toneFragment(block, fighter, dict)`が断片選択直後(`{n}`/`{rivalName}`置換前)にdictへ通すため、`_insertTenure/_insertRecord/_insertRivalry/_insertTenureFarewell(text, ctx, fighter, dict)`も同じ`dict`を素通しするだけでよい。`Engine.contract.resolveNegotiation(rng, state, neg, choiceIdx, subChoice, dict)`は内部の2箇所の`selectDialogue`呼び出しへ`dict`をそのまま転送する(resolveNegotiation自身はWM_I18Nを直接参照しない)。呼び出し元(ui-common.js/app.js)は`WM_I18N.t`を渡す。**P4-5(2026-09-04)で追加**: `Engine.ending.buildGameOverData(state, dict)`(KURODA_GAMEOVERの`kurodaColumn`を生成時点で確定。呼び出し元app.jsが`WM_I18N.t`を渡す。dict省略時は恒等関数=既存呼び出しは無改修でJA不変)。**`Engine.news.generateTicker`の値置換契約を修正(2026-09-04 P6-6)**: 従来は`dict(template)`でテンプレ本文だけを翻訳し、プレースホルダの値(選手名・団体名)は呼び出し側の`.replace()`で生JAのまま挿入していたため、EN走破で選手名・団体名(ブレイクスルー等のRIVAL_ORGS名を含む。名前辞書は`i18n/names-ledger.json`の`orgs`セクションに選手・コーチ名と同様に登録済み)が翻訳されずに残る実害があった。`dict(template, item.data)`(=`WM_I18N.t`の`(text, params)`契約そのもの)へ一本化し、値の変換もdict任せにした。`opts.dict`未指定時(test/ja-golden.js等)のフォールバックは、翻訳はしないが**プレースホルダの充填だけは行う**恒等関数(`(s, params) => 手動置換`)にすること — 単純な`(s) => s`にすると無指定呼び出しで`{name}`等が生のまま出力されてしまう(ja-goldenが検知する)。**この段落全体は2026-09-06 P7-36(ティッカー廃止)で歴史的記録となった** — `generateTicker`関数・`NEWS_TICKER_TEMPLATES`・`.news-ticker-bar`はいずれも削除済み。dict-opts契約自体は他の関数群(上記)に引き継がれている
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

- **対象**: `src/data.js` のセリフ系テーブル + セリフ専用ファイル8本(`victory-lines.js` `battle-lines.js` `coach-lines.js` `data-faction-dialogue.js` `flag-dialogue.js` `ppv-lines.js` `tag-battle-lines.js` `tenchosen-final-lines.js`)。`kuroda-text.js`(黒田記事・ナレーション層)・`CHAR_PROFILES`(プロフィール文)は対象外(dialogue-tone-spec-v1.0 §5、いずれもP5末尾または別工程)。**`CHAR_PROFILES`は最終的にセリフ台帳ではなくテンプレ台帳で処理した(P7-4・§16)** — セリフではなく三人称の人物紹介文であり、声の設計もアーキタイプ軸ではないため
- **`test/i18n-extract-dialogue.js`**: 対象ファイルの全トップレベル`const`宣言名を`_`区切りで走査し、セグメントに`LINES`/`DIALOGUE`/`DIALOGUES`を含むものを「セリフ格納テーブル」として自動抽出する(手動例外は`EXTRA_INCLUDE` 4件+`EXTRA_EXCLUDE` 1件。P5-2pで`FAN_EXPECT_REACTIONS`/`SPECIAL_EVENT_INTRO`を`EXTRA_INCLUDE`へ追加=下記§10-2)。値は再帰ウォーカーで文字列の葉を全て拾い、`i18n/dialogue-ledger.json`を生成する。
  - **`INCLUDE_PATH_FILTER`(2026-09-04 P5-2pで追加)**: テーブル全体ではなく特定の部分木だけをセリフ層として扱う。`{ テーブル名: (pathKeys) => boolean }` の形で、`pathKeys`はテーブル直下から数えたオブジェクトキー列(配列インデックスは含まない)。現在の唯一の登録は`SPECIAL_EVENT_INTRO`で、`coach`/`fighter`配下のみを拾う(同テーブルは大会タイトル・会場入りナレーション・ボタンラベルというUI層=`i18n/ui-ledger.json`の領分の文字列と選手/コーチのセリフが同居する)。**両台帳へ同じキーを二重登録してはいけない** — `addDict`のマージで後勝ちになり、どちらの訳が出るかがスクリプト読み込み順に依存するため
  - **`CELL_SUPPRESS_PATHS`(2026-09-04 P5-2pで追加)**: 「軸キーはあるが、それは**話者**のarchetypeではない」パスで`cell`を強制的に`null`にする。現在の唯一の登録は`COMMON3_LINES.reaction`で、`reaction.<派閥アーキ>.<archetype>`の末端キーは**迎えられる新人の口調**(data.js:3052-3053のコメント)であり喋っているのは**派閥リーダー**。素直に拾うと`test/i18n-build-dialogue-dict.js`のセル別検査がリーダーの発話へ新人の属性規約(ojousamaの短縮形禁止・coolの感嘆符禁止)を掛けてしまう。**この抑止は下記の保持マージより強く、既に`cell`が入っている行も`null`へ戻す**(誤ったセルを残さないため)。ただしそのパス**以外**でも同じ原文が出現して`cell`が解決できる場合はそちらを優先する台帳スキーマは`{ key, en, files, count, hasPlaceholder, hasProperNoun, cell }`(§5/§6と同型+`cell`)。`files`は`ファイル名:テーブル名`形式。`cell`は文字列の祖先オブジェクトキー列をarchetype 7種/personality 7種の語彙と照合したベストエフォート判定(`{archetype, personality}`。判定が割れる場合はnull)。**P5基盤修正(2026-09-03)で追加**: 語彙一致で取れない場合のフォールバックとして、祖先オブジェクトの全キーがALL_CHARSの実在idと一致し閾値(5件)以上のとき「ID軸ノード」とみなし、配下のcharIdをALL_CHARSで引いてcellを解決する(`victory-lines.js:VICTORY_LINES`等のキャラID軸テーブル向け)。また既存`i18n/dialogue-ledger.json`が存在する場合、`en`(非空)と`cell`(非null)は再生成時に上書きしない保持マージ動作を持つ(翻訳バッチ・ネイティブ検品の手作業投入を機械抽出の再実行で消さないため)
- **`test/i18n-build-dialogue-dict.js`**: 台帳の`en`列が非空の行のみを対象に、§5のD-B4(プレースホルダ完全性/重複キー/日本語残り)+吹き出し長110字上限+**D-P5-3セル別検査**(ojousama帯=短縮形禁止・所有格's許可・**文末の付加疑問(", won't you?" / ", did it not?")は例外**(2026-09-04 ネイティブ検品②: 「〜かしら？」を付加疑問で受けるのがお嬢様帯の礼節表現)/cool帯=感嘆符禁止+3文超禁止/delinquent帯以外=hell・damn禁止/全帯=f・sワード禁止)を通した上で`src/lang-en-dialogue.js`を生成する。違反時はexit 1で書き換えない
  - **セル別検査 9〜17(2026-09-07 P7-57 内部レビュー第5弾で追加)**: ネイティブ検品が届いていない3帯(丁寧/蠱惑/鷹揚)を仕上げるにあたり、`docs/en-tone-bible-draft-v0.1.md` §2-5/§2-6/§2-7 の「NG」と §4-6 検品①④のルールのうちgrepで判定できるものを昇格させた。**delinquent帯確定以外**=g落とし(`-in'`)禁止・`ain't`禁止(検品④「ヤンキー限定」。既存の規則7 hell/damn と同じ厳格運用で**cell不明の行も禁止側へ倒す**)/**seductive帯**=少女的感嘆詞(yay/hooray/woohoo等)禁止・キャンプな呼びかけ(darling/dearie/sweetie/sweetheart)禁止・露骨な性的語彙禁止/**composed帯**=若者スラング禁止/**全帯**=文末の"maybe"禁止(検品①「文末の『かも』= "... I think."。maybeは文頭専用」。**独立した1文としての "...Maybe." は文頭扱いで許可**するため、コンマ+maybe と「…」+**小文字**maybe が行末に来る形だけを違反とする)・比喩の「武器」をweaponと直訳しない(検品④。**限定詞+weapon / be+冠詞+weapon の形だけ**を捕まえ、リング上の実物の凶器をweaponと書く道は残す)・翻訳調定型句禁止("It can't be helped" / "As expected of" / "I'll do my best"、§1-5)。追加時点の台帳17,096行に対する違反は**全規則0件**(9〜14と17は元から0件、15・16は同タスクで計12行を改稿して0件にした)。**2026-09-10 改定(ネイティブ検品⑦)**: 検査15の疑問形除外——疑問文末の `maybe?`(「〜かな？」)は検品⑦が変更なしで通したため違反にしない(検品①の禁止は平叙の「…かも」= `... maybe.`)。検査16は例外なし——馬入橋「精神的な強さが一番の武器」= "my best weapon" を検品⑦が変更なしで通し検品④⑥の「武器は訳さない」と割れたが、同日の Keisuke 裁定「④⑥側に寄せる」で行を "my strongest suit" に差し替え、一時的に設けたキー例外集合は撤去した
  - **計測して規則化を見送ったもの(同 P7-57)**: 蠱惑の「"..."は1行1回まで」は559件で、§2-7が「余韻の"..."」を帯の道具として指定している以上**規則の方が誤り**。感嘆符の絶対閾値(蠱惑21件/鷹揚20件)と「ENの"!"数 > JAの「！」数」の比較則(107件)は、**大半がJA原文の「…っ」(詰まった息)を"...!"で受けた正当な処理**で、英語に「っ」の句読点等価物がない以上この写し方は正しい。閾値では切り分けられないため不採用
- **`src/lang-en-dialogue.js`**: 自動生成物(手編集禁止)。index.html/battle-engine.html/tag-battle.htmlの`lang-en.js`(index.htmlのみ`lang-en-templates.js`)直後で読み込む(release/manifest.json登録済み)。辞書に無いキーはfail-openで原文表示
- **表示点の配線規約**: セリフ選択ロジック(乱数選択・archetype/personalityフォールバック連鎖)には触れず、選択された生JA文字列を表示直前に`WM_I18N.t()`へ1回通す。プレースホルダを含む行は**t()を`.replace()`系より前に置く**(辞書キーは`{name}`が残った生テンプレートと一致させる必要がある)。data.js/factions.js/victory-lines.js/battle-lines.js/tag-battle-lines.js/ppv-lines.js側のセリフ選択関数(Engine純粋関数)は無改修のまま、呼び出し元(ui-common.js/ui-render.js/battle-engine-main.js/tag-battle-main.js)側でt()を挟む。60箇所超の呼び出し元を持つ`_u3bSideHtml`のような共通レンダラに集約すると高効率
- **既知の限界(2026-09-03のP5基盤修正で解消)**: `Engine.factions.getCommon1Line`/`getCommon5Line`/`getCommon7Line`/`getF07Line`/`getTransitionLine`(factions.js)、`pickTagWinCommentary`/`pickTagLossLine`(tag-battle-lines.js)は選択直後に内部で`{name}`等のプレースホルダを置換してから返す実装のため、これらの戻り値はプレースホルダを含む行に限りt()の辞書キーと一致せずfail-openしていた(プレースホルダを含まない行は正しく効いていた)。§6と同じ「Engine関数へ`dict`optsパラメータを足す」設計を7関数すべてに適用して根治した(先例は§6参照)。呼び出し元(ui-common.js/app.js/tag-battle-main.js)は戻り値を改めて`WM_I18N.t()`で包み直さない
- **二重t()適用は「無害」ではなかった(2026-09-04 P6-5で訂正)**: 上の設計メモは「一部の呼び出し元では二重にt()が呼ばれるが、対象が既に英語のためfail-open(ミスログ)で無害」としていたが、実際にはEN走破の`[WM][i18n-miss]`ログを大量に汚染し、本当の未訳(P5バッチ待ち)と配線穴の区別を困難にしていた(P6-5棚卸しの96件中、実測トレースで約30件がこの二重適用起因と判明・原文が最初から英語のケースは0件だった)。呼び出し元でt()済みの完成文を渡す必要があるケース(変数埋め込みの都合で「先に翻訳してから置換」が必須なdict-opts系の戻り値)向けに、共通表示点`_u3bSideHtml`/`_factionReporterStrip`/`_mdlAReporterStrip`/`_mdlASubjectStage`/`_chBubbleSlot`/`_negSpeakerHtml`(P6-6で追加。契約交渉の4画面が対象)へ**`lineTranslated`/`speechTranslated`/`translated`という opt-in の第3〜5引数(またはoptsフィールド)**を追加した。既定値は`false`(=従来どおり内部で1回t()する)なので既存60箇所超の呼び出し元は無変更・無影響。`true`を渡すのは呼び出し元が確実に訳し済みの完成文を渡すことを明示するときだけ(F07のgetF07Line経由・`_agwChampionSpeech`の`{wins}`/`{org}`置換後・`getTraitQuote`常時訳し済み系・`Engine.contract.selectDialogue`/`resolveNegotiation`経由の契約交渉セリフなど)。単純なpickDialogueLine選択(変数埋め込みなし)で「表示側に先んじてt()していた」だけの箇所は、t()呼び出しを表示側の1回だけへ削るほうを優先した(フラグに頼らず生JAを渡す設計に戻す)
- **文字列連結してから表示点のt()に通す「PH先埋め込み」型の穴は網羅的に踏みやすい(2026-09-04 P6-6で追加発見・全修正)**: `_factionReporterStrip`/`_mdlAReporterStrip`の呼び出し元でJS`` `${a}が${b}...` ``のようにテンプレートリテラルを直接組み立ててから渡すと、その完成済みJA文字列が(t()の内部で)辞書キーと一致せずfail-openする(selectDialogue/`_flagFormatLine`と同型)。`getCommonXLine`/`getTransitionLine`等のdict-opts関数から返る**既に訳し済みの文字列**を`_u3bSideHtml`/`_factionReporterStrip`へ渡す側でも、`lineTranslated`を付け忘れると同じ症状になる(表示は無害だがi18n-missを汚染)。P6-6で`_factionReporterStrip`3箇所+`_mdlAReporterStrip`3箇所+Common1/5/7のcoachLine計4箇所+団体戦挑戦直訴のcoachLine1箇所を修正。**新しい表示文字列をこの系統の関数へ渡すときは、必ず「テンプレ+params」か「dict-opts関数の戻り値+translated:true」のどちらかにし、素の文字列連結を挟まないこと**
- 運用: 翻訳バッチ(Opus主筆)が`i18n/dialogue-ledger.json`の`en`列を埋める→`node test/i18n-build-dialogue-dict.js`で再生成→`node test/ja-golden.js`(ja不変)・`npm test`・`npm run test:ui:walkthrough`(EN抜き取り)で検証、のループを回す
- **「両台帳へ同じキーを二重登録してはいけない」は`npm test`で機械検査される(2026-09-04 P7-12で追加)**: `test/i18n-ledger-consistency-test.js`がui-ledger/template-ledger/dialogue-ledgerの3本を突合し、同一キーが2台帳以上に存在する行の`en`が食い違っていればexit 1にする。詳細と所有判定の作法は§15-3・§31参照

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

同型の穴を作らないための規約: **新しいセリフ/テンプレのプールは必ずトップレベルの`const`テーブルへ置き、命名は`*_LINES`/`*_DIALOGUE(S)`に従う**。従えない場合(既存テーブルへの相乗り等)は`EXTRA_INCLUDE`(セリフ層)または§6の対象テーブル一覧(テンプレ層)へ**明示追加する**。関数の中に直書きした配列は、消費点が正しくt()を通していても辞書へ入らないため英語モードで日本語のまま出る。**この規約には「置き場所」の条件も要る(P7-21で判明・§37)**: トップレベル`const`で`*_LINES`命名でも、**ファイルが`DIALOGUE_FILES`(data.js+セリフ専用ファイル群)の外なら抽出器から見えない**。`CUTIN_LINES`(441スロット)は表示点が最初からt()に乗っていたのに`battle-engine-main.js`に置かれていたため辞書が空のままだった。**観戦系(single/tag共通)のセリフの置き場は`src/battle-lines.js`**、タッグ固有は`src/tag-battle-lines.js`。
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

### 11-5. 新規発見4件(**うち3件はP6-10で解決済み**)

`「${`の全数確認・i18n-miss追跡の過程で、季総括カード以外にも構造的に未配線の箇所が4件見つかった。いずれも**Engine関数がdict/opts自体を持たない**か**生成内容がG(セーブ)へ焼き込まれる持続的コンテンツ**であり、単純な「「」の言語別化」では直せない(周囲の文自体が生JAのままEN画面に残るため、引用符だけ直しても実益が無い)。P6-8のスコープ外として起票し、**P6-10(2026-09-04)で1・3・4を実装・英訳した**(実装詳細は§12)。

1. **✅解決(P6-10)** — **`Engine.flavor`のMAGAZINE_HEADLINES/TV_HEADLINES(management.js、計12テンプレ)**: 雑誌取材・TV出演イベント(週1件・人気選手/王者向けフレーバーイベント)の見出しが`(name) => \`📰 ... 「${name}、...」\``という関数プールで、`Engine.flavor.check(state, rng)`がdict/optsを一切持たずに直接文字列化していた。表示点(app.js `showEventPopup({message: ev.headline, ...})`)もt()を通さない。→ プレースホルダ文字列化+`check(state, rng, opts)`のdict-opts化+抽出器への追加で解決(§12-1)
2. **見送り継続** — **gameLog文字列エントリ内の「」(management.js `advanceWeek`内、6箇所)**: `events.push(\`🏆 「${s.orgName}」が...\`)`等は、アーキテクチャ規約2(§2-4「旧文字列エントリは無変換で共存」)が定める**gameLogのレガシー文字列形式**そのもの(`G.gameLog`へ直接concatされ永続化される)。この形式は仕様上EN化の対象外(新形式`{type,data}`への移行はgameLog全体の再設計を要する別工程)と判断し、「」の言語別化だけを単独で行っても文全体はJAのまま残るため見送った。**P6-10でも同じ判断**(むしろ§12-1で「gameLogへはJAを積み続ける」ことを明示的な設計として固めた)
3. **✅解決(P6-10)** — **`Engine.awards.generateEpithet`(殿堂入り選手の異名、management.js)**: `hofEntry.epithet`/`h.epithet`として**生成時にG(殿堂入りエントリ)へ永続化される**JA文字列で、dict/opts無し。ui-render.js(殿堂detail modal)とmanagement.js(殿堂入り引退の特別号記事)の両方で「」ハードコードごしに消費されるが、いずれも中身が100%生JAだった。`Engine.newspaper.composeHallOfFameRetirement`自体もdict/optsを持たない未配線関数だった。→ 永続値は生JAのまま据え置き、表示点で引く`Engine.awards.epithetText()`の新設+`composeHallOfFameRetirement`のdict-opts化で解決(§12-2/§12-3)
4. **✅解決(P6-10)** — **`EMOTION_TEXTS`(ui-render.js、`getEmotionText`が参照するローカル定数)**: 相関図が表示する関係性の一人称セリフ表(13カテゴリ×7属性=**91行**)。ui-render.js内のローカル`const`でLINES/DIALOGUE命名規則にも合致せず、§5/§6/§9いずれの抽出パイプラインからも見えない**4件目の構造的欠落**(§10-2の3件と同型)。→ dialogue側の抽出器・台帳は触らず`i18n/ui-ledger.json`へ`kept:true`で91行を追加し、唯一の消費入口`getEmotionText()`でt()を通して解決(§12-4)

### 11-6. 検証

`node --check`(battle-anim.js/tag-battle-main.js/app.js/ui-render.js/management.js/lang-en.js)全OK。`node test/ja-golden.js`基準と完全一致(hash=6b3d05c8...)。`node test/i18n-build-dict.js`台帳3,321キー全訳。`npm test`260/260 green(newspaper-front-v3-test.js/u5-winloss-safety-net-test.jsの2ファイルへ`_quoteVal`のjaスタブを追加)。`node test/auto-sim.js 20 42` ALL CLEAR(semantic fingerprint 37bbd0cd、P6-7時点と同一)。

## 12. ENレイアウト溢れ修正(Stage B P6-11、2026-09-04追加)

P6-9(`docs/i18n-en-layout-overflow-report-v0.1.md`)が計測したEN溢れ87〜89件(JA基準31件比+56件)への対処。**src側の変更は表示層(CSS・JS呼び出し先の切替)のみ**で、セリフ・テンプレの訳文そのものは対象外(i18n/ui-ledgerの短縮訳12キーを除く)。

- **`html[lang="en"]`言語別CSS分岐**: §1の`<html lang>`属性同期を前提に、`.pb-fighter-name`(試合結果カードの選手名)と`.aw-team-name`(表彰式・隊列の選手名)へ「名/姓の2行折り返しを許可し、枠は常に2行分確保する」EN専用ルールを追加。`display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.3em`(line-height 1.15基準)というem相対の指定にし、メインイベント18px/通常16px/縮小14pxいずれのフォントサイズ文脈でも比率が保たれるようにした。JAは`white-space:nowrap`のまま(セレクタごと分岐するため1バイトも変わらない)
- **姓のみ辞書(pnSurname)**: `.jtc-fn`/`.tc-fn`(トーナメントブラケットの選手名セル、40〜132px幅の固定枠)と`.nm-tag`(ランキング画面の肖像下タグ)の表示点を、`WM_I18N.pn(f.name)`から`WM_I18N.pnSurname(f.name)`へ切替。§1参照
- **最後の手段(フォントサイズ1段)**: `.emr-foot-note`(試合結果ポップアップの脚注)をEN限定で9px→8px(タイプスケールのmicro段)。任意pxは発明せず既存スケールから選んだ
- **短縮訳**: `i18n/ui-ledger.json`の12キー(`.sp-appeal-bonuses`のバフ内訳5種+`.neg-btn-hint`契約交渉ヒット7種)を意味を保ったまま短縮。例: `📣Expectation +{n}`→`📣Hype+{n}`、`She feels genuinely rewarded — salary +¥{n:man}/week`→`Feels rewarded — pay +¥{n:man}/wk`
- **検出器側の是正**: `test/ui-walkthrough/detectors.js`の`wrap-height`グルーピングが`[class*="tab"]`で「タブの中身のパネル」(`.rd-tab-content`)まで拾ってしまう疑陽性を、`-content`/`-panel`で終わるクラスを除外する形で解消(P6-9報告書§6の申し送りに対応)
- **テストスタブの機械追加**: `pnSurname`新設に伴い、`pn(str){return str;}`という前方互換スタブを持つtest/配下47ファイル67箇所へ`pnSurname(str){return str;}`を同様に機械追加した(P6-3が確立した前例と同じ作法)
- **結果**: EN溢れ87〜89件→**34件**(直近実走)、JA溢れは30〜31件→**32件**(walkthrough digest `1052faa82eaf7991`不変)。EN固有の増分は+56〜58件→**+2件**(目標10件以下を達成)。詳細はdocs/i18n-en-layout-overflow-report-v0.1.md §9
## 13. ENモードのJA露出全数棚卸し(Stage B P6-13、2026-09-04追加)

i18n-miss=0のままJA exposure(informational計測)が画面別で高止まりしていた(合計308)ことの原因究明。**「t()に一度も渡っていない」構造的な配線穴**を6系統発見・解消した。詳細は`docs/worklog.md`冒頭のP6-13エントリ、ここでは今後のバッチが再発を避けるための規約・チェックリストとして要点のみ記す。

### 13-1. 棚卸しツール: `scanJaExposureDetail()`

`test/ui-walkthrough/detectors.js`に、既存の`jaExposureByScreen`(画面ごとの最大値のみ)を補う一覧モードを追加。要素ごとの`{screen, selector, text先頭60字}`を`(screen,selector,text)`で重複排除して`jaExposureRecords`へ蓄積する(`scanOverflow`と同じ設計)。`run.js`の`--ja-exposure-log <file>`で全量をJSONダンプできる。ja側の行動選択・digestには一切影響しない(`scanOverflow`同様、副作用のない情報収集のみ)。**新しいEN露出調査をするときはこれを使う**(個々の要素のtext/selectorが無いと「どのテーブル/どの表示点か」を特定できず、jaExposureByScreenの数字だけでは対策が立てられない)。

### 13-2. 発見した配線穴の型カタログ(次バッチで同型を探すときのチェックリスト)

1. **`X.field || WM_I18N.t(fallback)`死コード**: `X.field`がEngineから常に非空文字列で返る設計だと、右辺のt()に永久に到達しない。`WM_I18N.t(X.field || fallback)`(または名前なら`pn()`)に直すのが正しい形。P6-13で9型・のべ40箇所以上発見(§2-4参照)。**新しくこのパターンを書かないこと** — フォールバック値は「Xが空文字/nullのときだけ」使われる設計を意識する
2. **Engine関数のdict引数が「存在するのに」呼び出し元が渡していない**: `Engine.formatFinish`(P4-5でdict引数実装済み)が24箇所中21箇所で未指定、`injuryLabel`/`injuryLabelShort`(P4-4でdict引数実装済み)が9箇所で未指定だった。**dict-opts化された関数を新しい呼び出し元から呼ぶときは、既存の類似呼び出しをコピペせず必ずdict引数の有無を確認すること**
3. **3抽出パイプラインいずれにも無い「5件目・6件目の構造的欠落」**: DECISION_DOCS(data.js、社長室書類67文字列)がui-ledger/template-ledger/dialogue-ledgerいずれの走査にも入っていなかった(§10-2の4件+P6-10の1件に続く事例)。判定基準は「`escHtml(X)`や`${X}`で直接出力しているのにXの生成元をgrepしても`WM_I18N.t(`/`WM_I18N.pn(`が1件も無い」こと
4. **`_pickSeed(pool, seed)`のプールが1本しかない**: `seed % 1`は常に0を返すため、同じ状況に複数エンティティが同時に陥ると必ず同一文になる(JA側のバグ、§2-6参照)。新しいプールを作るときは**最低2〜3本**を用意する
5. **PH先埋め込み(specs §9-10-1と同型)**: `.replace(/\{x\}/g, value)`をt()より先に呼ぶと完成文が辞書キー(未置換の原文)と一致せずfail-openする。今回`pickText()`(NOTIF_EVENT_TEXTS/LARGE_EVENT_TEXTS、94件超)と`CAMP_FLAVOR_TEXTS`で発見。**新しいテキストプール選択関数を書くときは、選択直後・PH充填前にdictへ通す(`_wmFillWithDict`を使う)のを既定形にすること**
6. **`WM_I18N.pn()`と`WM_I18N.t()`の取り違え**: `_renderWeekSeasonTrack`の季節名(春/夏/秋/冬)表示が`pn()`(名前辞書)を呼んでいたが、季節名は一般語彙でありt()(UI辞書)が正しい。pn()はfail-open(未登録なら原文のまま)なので、間違えて呼んでも例外にはならず**サイレントに訳が出ないだけ**という点で気づきにくい

### 13-3. 未着手(次バッチ検討事項)

1. **NOTIF_EVENT_TEXTS/LARGE_EVENT_TEXTS本体の英訳(94件超)**: `pickText()`のdict-opts化(P6-13)で配線は完了。翻訳バッチの規模はP5-2xの1バッチ相当
2. **Autumn War(`agw-*`)団体名ロングテール**: `X?.orgName || WM_I18N.t(fallback)`型が約15箇所未修正。D-P6-3の選手名ロングテール(≈634件)と同型の団体名版
3. **`Engine.fanExpect.generate()`(ファン期待カード理由文、7〜8テンプレ)**: 名前直接埋め込み+`.replace('期待の声', ...)`という2段階の文字列加工のため単純なdict-opts化では済まない
4. **キャラクター特性(Traits)バッジ・道場シーン(dojo-scene-atmosphere/shout)**: 固定語彙(特性は約20〜30種)の新規登録が必要。roster画面の残存の主因
5. **社長室招聘市場パネルのコーチ格付け表記**(Class A/職人気質等)
## 14. Stage B P6-15 — 新聞composer3本+PPV煽りのdict-opts化(§13-2 A表の4件を全解決、2026-09-04追加)

§13-2の突合表Aが起票した4表(146行)を「①composerのdict-opts化 ②断片連結の`join`テンプレ化 ③英訳」の3点セットで解決した。新規訳出は**135キー**(146行のうち15行はプロフィール4プールを`UNIFIED_TITLE_TEMPLATES`と`CHAMPION_CHANGE_TEMPLATES`が**同じ配列参照で共有**しているため台帳では1行に畳まれる。加えて連結様式+差し込みラベル4行)。台帳3本とも未訳0を維持(ui 3,530 / template **1,749** / dialogue 16,674)。

### 14-1. 承認済み本文プールに手を入れず`join`を持たせる — `ARTICLE_COMPOSE_TEMPLATES`

`UNIFIED_TITLE_TEMPLATES`(「承認済み正本。文面変更禁止」)・`CHAMPION_CHANGE_TEMPLATES`/`DRAFT_PLAYER_RESULT_PARTS`(「確定版・一字一句変更不可」)はいずれも表そのものに但し書きが付いている。P6-14が`HOF_BIOGRAPHY_TEMPLATES.join`を表の中に置いたのと違い、**i18n配線のために足す文字列は data.js の別テーブル`ARTICLE_COMPOSE_TEMPLATES`へ集約**した(`test/i18n-extract-templates.js`の`TARGET_TABLES`へ4表と共に追加)。

| キー | JA | EN | 用途 |
|---|---|---|---|
| `join` | `{a}{b}` | `{a} {b}` | 断片数が可変な連結の**2スロット畳み込み**(統一王座3〜5本・ドラフト2〜4本) |
| `champChangeJoin` | `{lead}{profile}{reign}{closing}` | `{lead} {profile} {reign} {closing}` | 王座交代は常に4断片固定 |
| `nameList` | `{a}、{b}` | `{a}, {b}` | ドラフト指名選手名の列挙 |
| `prevChampFallback` | `前王者` | `the previous champion` | 前王者名が取れないときの差し込みラベル |

- **断片数が可変な族は固定スロットの`join`が使えない**。空の枠の分だけENに二重スペースが出るため、**2スロットのテンプレを初期値なしの`reduce`で畳み込む**。JA(dict省略/ja素通し)では`join('')`と1バイト同一
- **`nameList`の畳み込みは区切り文字だけでなく名前辞書(pn)の変換も効かせる**。各段で選手名が`dict(tpl, params)`のパラメータを通るため、D-P6-2のパラメータ値自動変換が働く。1名のときは畳み込みが起きないが、その場合`{names}`の値が選手名そのものなので記事テンプレ側の充填で変換される
- **`prevChampFallback`のJA文字列は data.js 側にだけ置く**。management.js に防御的フォールバックとして同じ literal を残すと`i18n-ratchet`が「直書き再発」として拾うため、`ARTICLE_COMPOSE_TEMPLATES`が取れない場合は**composerがnullを返す**(呼び出し元が旧・単文テンプレへフォールバックする)構造にした

### 14-2. 「テンプレは訳されるが差し込む値が生JA」を1語ラベルとして引く — `_wmDictLabel`

`{styleJa}`(グラップラー/ストライカー/…)は上流の`Engine.newspaper.STYLE_JA`がJAで組み立てた**成形済み値**で、テンプレだけ訳しても本文にJAが残る(§6「成形済み値の構造穴」)。**新設`_wmDictLabel(dict, jaLabel)`**(management.js、`_wmNewsStamp`の直前)が差し込む直前に辞書を引き直す。テンプレ本文ではなく**値**を引く点が`_wmFillWithDict`との違い(`_wmNewsStamp`の`suffixJa`と同じ流儀)。既訳は`i18n/ui-ledger.json`側に既にあり(グラップラー→Grappler 他5語)、新規行は不要だった。

EN本文では`{styleJa}`が大文字始まりの名詞として入るため、**`a {styleJa}`型の枠(規則25違反でもある)は使わず`her {styleJa} work / game / form`へ寄せる**(`Submission`/`Aerial`/`All-round`は人を指す名詞にならないため、この枠でないと英文が壊れる)。

### 14-3. `Math.random()`で選ぶ族は「表示時再生成」が使えない — 追加フィールド方式

`PPV_HYPE_TEMPLATES`はP6-14が「表示時再生成が効かない唯一の族」と特定したとおり、選出が`Math.random()`で決定的でない。**`Engine.ppv.buildHype(match, rivalries)`**を新設し、`{ text, tpl, vars }`を返す(選出ロジックは移設のみ・`Math.random()`は不変)。カード生成の2箇所が`match.hype`(JA完成文=**セーブに書く既存値は不変**)に加えて`match.hypeTpl`/`match.hypeVars`を併記し、表示点(`ui-common.js`のPPVプログラム、grepで消費点は1箇所)が`match.hypeTpl ? WM_I18N.t(match.hypeTpl, match.hypeVars) : match.hype`でfail-openする(§12-1の`headlineJa`と同型)。従来の`generateHype(match)`は`buildHype(...).text`を返す薄いラッパとして残し、呼び出し契約を壊さない。

**`Engine.ppv.generateHype`の`Math.random()`はアーキテクチャ5原則の「乱数シード管理」に反する**(同じシードでも煽り文が変わる)。本タスクの範囲外として据え置いた — 直すとJAの出目が変わるため、別途`Engine.rng`ストリームの選定と`ja-golden`基準の更新をセットで行うこと。

### 14-4. JA同一性の証明

P6-14の作法①(凍結コピーとの全数突合)を4族すべてに適用した。着手前の`composeChampionChangeBody`/`composeUnifiedTitleArticle`/`composeDraftPlayerResult`/`generateHype`を凍結コピーとして切り出し、代表値・境界値の直積(年齢帯4分割の境界21/22/24/25/29/30、戴冠回数0/1/2、8種別×分岐フラグ、ティア5種×人数1〜3、`Math.random()`固定3値ほか)を回して**1,505,127通り**を新旧突合 → **不一致0**。dict省略経路と「ja素通しdict」経路の両方を同時に比較している。

- **`fill()`の「値がnullならPHを残す」挙動に注意**。`composeUnifiedTitleArticle`の旧`fill`は`data[name] != null`でなければ`{name}`をそのまま残していたが、`fillTemplateVars`は**paramsに積んだキーを無条件に置換する**(nullを積むと`"null"`が出る)。**非nullのキーだけをparamsへ積む**こと
- **可変長の畳み込みは初期値なしの`reduce`で**。初期値`''`を与えるとENで先頭に空白が1つ入る

### 14-5. P6-15で新たに見つかった同型(**✅P6-16で1〜4を全解決**、2026-09-04。詳細は§15)

1. **✅解決(P6-16)** — **`_buildPpvSummitStory`(management.js)** — PPV頂上決戦の紙面本文。**dict糸通しは済んでいる**のに、(a)`bodyParts.join('')`に連結様式テンプレが無くENでは文が空白なしで直結する、(b)本文の大半(舞台説明文・試合経過文・試合評価文4変種・通算戦績2文・勝者/敗者コメントの地の文2文)が**生JAのJSテンプレートリテラルで`T()`を通っていない**。P6-8が`_quoted`だけを直したため「一部だけ英語になる」状態で残っていた
2. **✅解決(P6-16)** — **`Engine.chronicle`の年代記叙述4関数** — dictを一切持たない断片連結。`QUOTE_TEMPLATES_DUAL`はEngineオブジェクトのプロパティで抽出器から見えない(§10-2型)。加えて`_buildPeerNarrative`等は分岐ごとの実行文プールで、§6 pool③(`Engine.mvpRace`の叙述family)と同じ性格
3. **✅解決(P6-16)** — **`Engine.autumnWar`の結果ニュース** — `_orgName`+勝敗数の生JA組み立てを`industryNews.push`のdataへ焼く。§8の「生キー+render時点再構築」が要る型
4. **✅解決(P6-16)** — **composerがnullを返したときの直書きJAフォールバック2箇所** — `management.js`のAIチャンピオン交代(`${ev.orgName}の王座が動いた。…`)と`ui-common.js`のドラフト自団体1面(`${names}。新シーズンの陣容がひとつ厚くなった。`)。どちらもdictを通らないので、本体が英語になった今はフォールバックだけJAで出ていた

## 15. Stage B P6-16 — §14-5の同型4件の配線と英訳(2026-09-04追加)

訳出**195キー**(template-ledger 1,749→**1,944**・未訳0 / ui-ledger 3,530→**3,536**・未訳0)。ラチェット総数28,085不変(移設は差引ゼロ)。

### 15-1. 「連結後の完成文が永続し、かつ表示点で再生成もできない」族は**追加フィールド**で解く

年代記の叙述文(`_buildAceNarrative`/`_buildPeerNarrative`)は`G.chronicle.chaptersCache.chapters[].aces[]/peers[].narrative`へ**完成文が永続**する。§13-1(殿堂入り語り文)の「表示点で再生成して保存値と1バイト照合」は、**キャッシュ側のace/peerが`careerRecord`を持たない縮約オブジェクト**であるため使えない(再生成しても保存値と一致せず、常にフォールバックへ落ちる)。

そこで §14-3(PPV煽りの`hypeTpl`/`hypeVars`)と同じ**追加フィールド方式**を採る。**同型(完成文がGへ焼かれ、かつ素材がキャッシュに残っていない族)には今後これを使う。**

- `narrative` … 従来どおり**JAの完成文**。`buildChapters`は**dictを渡さない**ので**セーブに書く既存値は不変**(D-P6-4)
- **`narrativeParts`** … 新規フィールド。`{ t, v }`(単文) / `{ t, v, items:[パーツ], sep }`(列挙を内側に持つ文)の配列。`sep`は`'listComma'`(読点)/`'listDot'`(中黒)
- 描画は`Engine.chronicle.narrativeText(parts, dict)`(+内部の`_narrativePartText`)。`_build*NarrativeParts()`が素材だけを返し、`_build*Narrative()`はそれを描画する薄いラッパ
- 表示点は`ui-render.js`の**`_chronicleNarrative(entry)`1関数に集約**(ace単独/二枚看板/同期の3箇所)。`narrativeParts`が無い旧セーブは**保存値をそのまま出す**(fail-open)。**保存値を`t()`に通さないこと** — 完成文は辞書キーと一致せずi18n-missを汚染する
- **auto-simのsemantic fingerprintは追加フィールドの分だけ動く**。指紋のreplacerで新フィールドを除外して再計測し、HEADと一致することを実測で確かめること(P6-16では 82823ea9 → 除外して 37bbd0cd = HEAD実測値)

記者の目(`buildAceQuote`/`buildDualAceQuote`)は**表示時に生成**され保存されないので、第4引数`dict`を足すだけでよい(呼び出し元はui-render.jsの2箇所)。

### 15-2. ENの空白規約 — 差し込み句(clause)の訳文は**先頭に半角スペース**を持つ

記者の目テンプレは`{topRivalClause}`のような**条件次第で空文字になる差し込み句**を持つ。JAは直結なのでテンプレ側にもクラウス側にも空白が要らないが、ENは文間に空白が要る。テンプレ側に空白を置くと**空のときだけ二重スペース・末尾スペース**になる。

- **ENのクラウス訳文の側に先頭スペースを持たせる**(JA訳文は持たない)。テンプレは`…した。{topRivalClause}{topVenueClause}`のまま
- 節の先頭にクラウスが来る型では先頭スペースが残るので、**`Engine.chronicle._joinQuoteSections`が節ごとに`trim()`してから連結**する。JAは空白を含まないので trim は no-op(1バイト不変)
- 同法を`PPV_SUMMIT_STORY_TEMPLATES.orgParen`(`（{org}）`→` ({org})`)と`AUTUMN_WAR_NEWS_PARTS`の`（同時全滅…）`にも適用した

### 15-3. **同じキーを2つの台帳へ載せない**(§9)ための実装作法

`王座` `団体` `決勝` `準決勝` `該当選手` は **ui-ledger に既訳がある**。data.js のテンプレ表へ入れると template-ledger と ui-ledger で同じキーが二重登録され、どちらの訳が出るかがスクリプト読み込み順に依存する。**JA原文は management.js 側に1本だけ置き、`_wmDictLabel`で引く。**

- `Engine.chronicle._orgLabel(state, dict)` / `_beltLabel(orgName, dict)` — `_buildQuoteContext`と叙述2関数で共用
- `_AW_ROUND_JA` / `_AW_MVP_FALLBACK_JA` — management.js のトップレベル定数

**`_wmTitleName(dict, orgName)`(management.js、新設)**: 保存値の`○○王座`は「団体名+様式」のJA成形済み値(§6の構造穴)で、テンプレだけ訳しても本文にJAが残る。`/^(.+)王座$/`で団体名を取り出し、既存キー`{orgName}王座`(→`{orgName} Championship`)へ**params経由で**通すので団体名は名前辞書(pn)で英語化される。ui-common.js の`_factionDisplayName`が「○○派」に対してやっているのと同法(§10)。`_wmResolvePreformattedIndustryData`の`topChampionInjury`も同ヘルパーへ寄せ、JA literal を1箇所に保っている。

**運用: 「同じキーを2つの台帳へ載せない」の例外と機械検査(2026-09-04 P7-12で追加)**。上の作法は「JA原文を1箇所に集約して二重登録そのものを避ける」やり方だが、それでも避けられない二重登録が2種類ある。

- **(a) 所有権の取り違え**: データ表(data.js等)由来の文字列を、動的キー(`t(変数)`で辞書を引くため機械抽出できない箇所向け)としてui-ledgerへも手作業で複製しただけの行。本物の二重出現ではない。P7-9で発見した12件(合宿フレーバー`CAMP_FLAVOR_TEXTS`)がこれで、所有台帳(この例ではtemplate-ledger)へ一本化し、ui-ledger側は削除した。**`test/i18n-extract-ui.js`は再実行のたびtemplate-ledger.json/dialogue-ledger.jsonを読み、「今回のスキャンでは見つからず(=kept:trueでしか残っていない)、かつ他台帳が非空`en`で持っている」行を自動的に除外する**(`loadOtherLedgerOwnedKeys`)ので、削除した行は次回抽出で空`en`の新規キーとして復活しない。今回のスキャンで実際に見つかった行(=UI側コードが独立してその文字列を呼んでいる)は無条件で残る — 除外はあくまで「前回の`kept:true`だけで生き延びていた行」が対象
- **(c) 本物の二重出現**: UI側のコード自身が独立して`WM_I18N.t('…')`を呼んでおり(多くはEngine関数の防御的フォールバック値。例: `ui-common.js`の`_factionLine`が空を返したときの`……もう、ついていけない。`)、たまたまデータ表側の文言と一致しているだけの行。こちらは両台帳に残してよい——ただし`addDict()`のマージは「後勝ち」(読み込み順依存)なので、**訳文を一致させておけば読み込み順に依存しなくなる**(=どちらが後に読み込まれても同じ英語が出る)。P7-9で見つけた22件(ui∩template 16件・ui∩dialogue 6件)のうち10件がこの型で、うち4件(`……もう、ついていけない。`/`……わかった`/`よろしく。`/`合同企画`)は訳文が食い違っていたため揃えた
- **`test/i18n-ledger-consistency-test.js`(npm testに組み込み済み)**: ui-ledger/template-ledger/dialogue-ledgerの3本を突合し、`en`が非空の同一キーが2台帳以上に存在する行を全て集め、訳文が食い違っていればexit 1にする回帰ガード。新しい重複が生まれた/既存の重複の片方だけ訳文を直し忘れた、をその場で検出する。未訳(`en`が空)の行は対象外(各台帳の`i18n-build-*.js`が別途担当)

### 15-4. 記事テンプレ末尾の「2つの任意の注記が直結する」枠

`NEWS_HEADLINE_TEMPLATES.autumnWarResult`の本文末尾は`{gauntletNote}{tieBreakNote}`の直結で、ENでは2文が空白なしでくっつく。**2本を`join`テンプレで畳んで1つの値にまとめ、もう一方を空にする**のが最小の解(JAでは`join='{a}{b}'`なので連結結果は1バイト不変)。片方が空のときに空白が余らないよう、**畳み込み前に`filter(Boolean)`**すること。

### 15-5. JA同一性の証明(4,388,545通り・不一致0)

§13-1の作法①(凍結コピーとの全数突合)を全族へ適用。HEADの6関数をソースから機械抽出し、`Object.create(Engine.chronicle)`のプロトタイプ経由で未変更ヘルパを共有させて新旧を突合する。

- `_buildPpvSummitStory` **4,199,040通り** / 年代記5関数 **188,800通り** / 秋対抗戦+`joinNameList`+フォールバック **705通り** — いずれも不一致0
- 移設した3表(V2/V1/DUAL)は`JSON.stringify`で凍結コピーと**完全一致**を別途確認
- **叙述テンプレ83本すべてが実際に選択されたことを網羅計測**する。実seedでは`Engine.rng.derive`の戻り値が偶数に偏るらしく**長さ4のプールの奇数添字に到達しない**ため、`derive`を固定値へ差し替える強制パスを足して全プール全添字を新旧同条件で踏ませた
- dict省略経路と「ja素通しdict」経路の**両方**を同時に比較する

### 15-6. P6-16で新たに見つかった穴(未着手)

1. **`ui-ledger`の抽出器が main に対して4行ぶん古い**。`test/i18n-extract-ui.js`を再実行すると`ui-common.js`の`WM_I18N.t()`literal 4件(派閥離脱系セリフ)が新規行として増え、うち`……もう、ついていけない。`は**dialogue-ledgerに既訳がある**(=ui-ledgerへ載せると二重登録)。P6-16は台帳をHEADへ戻し、必要な1行だけ手挿入した。**次にextract-uiへ触るバッチで、この4件をどちらの台帳の領分にするか決めること**
2. **`Engine.chronicle.AXIS_LABELS`の`喧嘩`が ui-ledger で "Quarrel"**。スタイル軸のラベルとしては`Brawling`が正しい。`{styleJa}`/`{spiritAxis}`の枠に入るため年代記のEN本文に出る
3. **✅解決(P6-17)** — **`該当選手`の既訳 "Matching Wrestlers" が文脈違い**。秋対抗戦MVPが解決できないときの人名スロットのフォールバックで、`ui-common.js:19902`の同じ場面と同一キーなのに検索フィルタ語として訳されている。→ 台帳の`files`/`count`を確認したところ**この人名スロットが唯一の消費点**(count=1)で、検索フィルタ語は別キー(`該当する選手がいません`)だったため、キー分割はせず`en`を`Unnamed wrestler`へ訂正した(§21-4)
4. **✅解決(P6-17)** — **`Engine.chronicle._generateTitle`/`_generateSubtitle`/`_generateClosing`/`_buildHighlights`は未着手**。年代記画面の章タイトル・サブタイトル・締め・ハイライト行はまだ生JA(§13-2 B表と同じ層)。→ §21
5. **`Engine.chronicle._getSurname`の`名無し`フォールバック**は他のchronicleコードからも共用されるためdict化していない(実質到達不能)
1. **`_buildPpvSummitStory`(management.js)** — PPV頂上決戦の紙面本文。**dict糸通しは済んでいる**のに、(a)`bodyParts.join('')`に連結様式テンプレが無くENでは文が空白なしで直結する、(b)本文の大半(舞台説明文・試合経過文・試合評価文4変種・通算戦績2文・勝者/敗者コメントの地の文2文)が**生JAのJSテンプレートリテラルで`T()`を通っていない**。P6-8が`_quoted`だけを直したため「一部だけ英語になる」状態で残っている。**次バッチの筆頭候補**
2. **`Engine.chronicle`の年代記叙述4関数**(management.js:5201/5253/6391/6641) — dictを一切持たない断片連結。`QUOTE_TEMPLATES_DUAL`はEngineオブジェクトのプロパティで抽出器から見えない(§10-2型)。加えて`_buildPeerNarrative`等は分岐ごとの実行文プールで、§6 pool③(`Engine.mvpRace`の叙述family)と同じ性格
3. **`Engine.autumnWar`の結果ニュース**(management.js:30729/30730) — `_orgName`+勝敗数の生JA組み立てを`industryNews.push`のdataへ焼く。§8の「生キー+render時点再構築」が要る型
4. **composerがnullを返したときの直書きJAフォールバック2箇所** — `management.js`のAIチャンピオン交代(`${ev.orgName}の王座が動いた。…`)と`ui-common.js`のドラフト自団体1面(`${names}。新シーズンの陣容がひとつ厚くなった。`)。どちらもdictを通らないので、本体が英語になった今はフォールバックだけJAで出る

## 16. Stage B P7-2 — 地の文プール前半7表(t()を一度も通らない層)の配線(2026-09-04追加)

§13-2 B の突合表のうち分類A「地の文プール」前半7表(`SNAPSHOT_TEXTS` 282 / `ATMOSPHERE_TEXTS` 33 / `FAREWELL_KIND_TEXT` 15 / `LOCKER_AIR_TEXTS` 14 / `CAMP_FLAVOR_TEXTS` 12 / `PRE_WINDOW_TEXTS` 9 / `TEAM_SPIRIT_TEXTS` 8 = 373行)を台帳へ載せ、消費点を配線し、374キー(連結様式1件を含む)を英訳した。台帳はテンプレ層(§6)。

### 16-1. 「乱数で選んだテンプレを名前で充填した完成文をGへ焼く」族 — `composedSnapshotText`

`Engine.snapshot`の垣間見え / ロッカールームの空気ログ / 移籍ウィンドウ前週の予兆は、いずれも**選出が消費済みの乱数ストリームに依存する**ため §13-1 の「表示時に再生成」が使えない。§14-3 の`PPV_HYPE_TEMPLATES`(`hypeTpl`/`hypeVars`)と同じ**追加フィールド方式**へ寄せ、正規化を1箇所へ集約した。

- **`composedSnapshotText(entry)`(data.js、`_gameLogT`の直後)** — `{ text, tpl, vars, voiceLead, labelVars }` を受け、`tpl`が無い旧セーブは`text`をそのまま返す(fail-open)。`_gameLogT(text, params)`に params 対応を足してあり、WM_I18N不在(Node単体・auto-sim)では`fillTemplateVars`へ落ちる。**ja/WM_I18N不在では戻り値が`text`と1バイト一致する**
- **完成文`text`はセーブ値として不変**(D-P6-4)。`tpl`/`vars`は**追加**するだけで、既存フィールドの意味は変えない
- **`gameLogEntryText`(data.js)** は`entry.tpl`があるときだけこの新経路へ入る(既存の`entry.text`早期returnより**前**に置く)。`renderLog`のスナップショット枝も`l.text`直参照をやめ`getLogText(l)`へ統一した
- **`_snapshotLine(entry)`(ui-common.js、`_epithetLabel`の直後)** はそこへ委譲するだけ(`_epithetLabel`が`Engine.awards.epithetText`へ委譲するのと同じ作法。**正規化を二重実装しない**)
- **gameLogへ積む生文字列は`{type, text, tpl, vars}`のオブジェクトへ移す**(§2-4の推奨形)。`gameLogEntryCategory`は`entry.text`を持つ行に`[]`を返すため、旧・生文字列がキーワード判定でどのカテゴリにも一致しなかった族(ロッカー空気14行・移籍予兆9行はいずれも非該当)は**フィルタ挙動が変わらない**。移す前に必ずキーワード表と突き合わせること
- **断片連結は`join`テンプレ化**。タイプB「話者名+全角スペース+セリフ」は`ARTICLE_COMPOSE_TEMPLATES.snapshotVoice`(`{name}　{line}` → `{name}: {line}`)。§14-1で決めた「i18n配線のために足す文字列は本表へ集約する」流儀に従い、`SNAPSHOT_TEXTS`の中には入れない
- **`labelVars`(新設)** — 「値そのものが成形済みJAラベルで、値としても辞書を引く必要がある」パラメータ名の配列(§14-2 `_wmDictLabel`と同趣旨。`gameLogEntryText`の`crowdLabel`/`tierLabel`の先例と同型)。`PRE_WINDOW_TEXTS`の`{rival}`は実在団体名なら名前辞書のパラメータ値自動変換で訳されるが、フォールバックの`'他団体'`だけは辞書を引き直す必要がある。**フォールバックのときだけ付ける** — 実在団体名に付けるとUI辞書側でミスログを量産する

### 16-2. UI直読み4表は表示直前でt()1回

`ATMOSPHERE_TEXTS`(ui-render.js `_renderRosterDojoHeader`の2箇所)・`FAREWELL_KIND_TEXT`(ui-common.jsの引退セレモニー title/lead/body)・`CAMP_FLAVOR_TEXTS`(app.jsの合宿書類 → ui-common.jsの`flavorHtml`。**PH置換より前に**`t(tmpl, {name1,name2})`)・`TEAM_SPIRIT_TEXTS`(app.jsのトースト組み立て)。いずれもGへ焼かないか、PHを持たないため追加フィールドは不要。

**`showNotifEventToast`(ui-common.js)では訳さない。** これは`event.text`/`event.detail`を無変換で出す**共通表示点**で、`NOTIF_EVENT_TEXTS`/`LARGE_EVENT_TEXTS`(P7-3)など他系統の未訳文も同じ入口を通る。ここで一律t()を掛けると二重t()(§9)になる系統が出るため、**系統ごとの入口(app.js側)で訳して渡す**。P7-3がこの入口へ触るときは、系統別に訳すか`textTranslated` opt-in(§9の`lineTranslated`と同型)を足すかを決めること。

### 16-3. 抽出器のパスフィルタ(`TABLE_PATH_FILTER`)

`test/i18n-extract-templates.js`に、テーブルの特定の部分木だけを台帳から外すためのパスフィルタを追加した(`test/i18n-extract-dialogue.js`の`INCLUDE_PATH_FILTER`と同じ作法)。`walkStrings`が「テーブル直下から数えたオブジェクトキー列」(配列インデックスは含まない)を持ち回る。現在の唯一の登録は`ATMOSPHERE_TEXTS`で、`{ emoji, text }`の`emoji`葉(絵文字1文字・表示側も`${atmo.emoji} ${t(atmo.text)}`と分けて出す)を除外する。

### 16-4. JA同一性の証明の作法(§13-1の作法①を実コードで回す形に変えた版)

凍結コピーとの突合(§13-1)ではなく、**実物の生成関数を全到達分岐で回し、その場で「表示点の再構築 == 生成された完成文」を照合**した。生成側と表示側が同じ実装から出ているため、凍結コピーの取り違えが起きない。

- `Engine.snapshot._buildSnapshotText` を 全15ソース × 7アーキタイプ × 7性格 × 40シード × name2有無 × bond 2値 で回し、毎回`composedSnapshotText(res) === res.text`(実測117,696件・不一致0)
- ロッカー空気・移籍予兆・合宿は**旧実装の`.replace()`直列**と`t(tpl, vars)`を全行×代表値で照合する。`.replace(str, …)`は**最初の1つ**しか置換しないが`applyParams`は全置換するため、同じPHが2回出るテンプレがあれば出力が割れる — 実データに無いことをこの突合で確認する
- **表の網羅率を必ず出す**。7表の全373文字列のうち372に到達し、未到達1件(`SNAPSHOT_TEXTS.breakthrough.scene`)は`_collectCandidates`がブレイクスルーを常に`type:'embedded'`で積むため`voice`しか読まれない**死蔵行**だと特定できた
- EN側は実物の`src/i18n.js`+生成辞書3本を読み込み`setLang('en')`して同じ全経路を再走し、**日本語残り0・i18n-miss 0**を確認する(`voiceLead`の連結・`labelVars`の値引き・名前のpn変換を含む。実測35,380件)

## 17. Stage B P6-10 — 未配線3系統(雑誌/TV見出し・殿堂入り異名・EMOTION_TEXTS)の配線と英訳(2026-09-04追加)

§11-5が起票した4件のうち3件(1・3・4)を実装・英訳した。訳出合計251行(template-ledger 36 / ui-ledger 215)。

### 17-1. `Engine.flavor` のフレーバー見出し(dict-opts + gameLogはJA固定)

- **関数プール → `{name}` プレースホルダ文字列**へ移行(JA出力1バイト不変)。**配列の並び順を変えないこと** — `Engine.rng.int(rng, 0, len-1)`が引く添字が変わるとJA出力が変わる
- `Engine.flavor.check(state, rng, opts)`。`_headline(tpl, params, opts)`が**PH置換前に**`dict(tpl, params)`を通し、`_fillHeadline(tpl, params)`がJA充填のみを行う。`opts.dict`未指定(auto-sim / ja-golden / app.js:10166の`previewTick`)のフォールバックは「翻訳しないが**充填はする**」形にすること — 単純な`(s)=>s`だと`{name}`が生で残る(§6 `generateTicker`と同じ落とし穴)
- **gameLogへは生JA(`ev.headlineJa`)を積む**。`tickWeek`の`events.push(\`${headline}（${fighterName} 人気+${popGain}）\`)`はレガシー文字列エントリ(§2-4)で周囲の装飾がJAのため、見出しだけENにすると1行の中で言語が混ざる。`check()`が`headline`(dict適用済み・ポップアップ表示用)と`headlineJa`(JA充填のみ・gameLog用)の**両方**を返し、tickWeekは`ev.headlineJa || ev.headline`で読む(旧セーブ互換)。**セーブに書く値は不変**
- 台帳: `test/i18n-extract-templates.js`の`MANAGEMENT_FLAVOR_PROPS` + `extractArrayLiteralProp()`(§6参照)

### 17-2. 殿堂入り異名は「永続値はJA・表示点で引く」

- 生成側(`generateEpithet`)は**無改修**。`hofEntry.epithet`はG(殿堂入りエントリ)へ生JAで永続する(D-P6-4)
- **`Engine.awards.epithetText(epithet, dict)`**(management.js、純粋関数)が表示用変換の唯一の入口。`_EPITHET_TEMPLATES`で唯一プレースホルダを持つ`{n}人切り`は`_resolvePlaceholders`が生成時点で数値を埋めるため、保存値`"23人切り"`から`/^(\d+)人切り$/`で数値を読み戻し、テンプレのキー`{n}人切り`で辞書を引き直す。未知の値はfail-open
- UI層は**`_epithetLabel(epithet)`**(ui-common.js、`_quoteVal`直後)が`Engine.awards.epithetText(ep, WM_I18N.t)`を呼ぶだけ(正規化ロジックを二重実装しない)
- **表示箇所は2箇所のみ**(2026-09-04 grep全数確認): `ui-render.js:showHofDetail`(殿堂詳細モーダル。`── 「{epithet}」──`をui-ledgerキー化)と`management.js:composeHallOfFameRetirement`(新聞特別号)。殿堂リストのカード・選手詳細・年代記に異名は出ていない。`generateBiography({...h, epithet})`へは**生JAのepithetを渡したまま**(語り文自体が未英訳のため。§12-5)
- 台帳: `i18n/ui-ledger.json`へ`kept:true`+`note`で111行(`新人王`は既訳を再利用)

### 17-3. `composeHallOfFameRetirement` のdict-opts化 + `_wmFillWithDict`

- `composeHallOfFameRetirement(d, hofEntry, dict)`。呼び出し元は`Engine.newspaper.generate()`内の2箇所のみで、いずれもgenerateのローカル`dict`を渡す
- 実績の列挙(`achievement.join('、')`)は**分岐ごとの完全文テンプレ4本**へ分解した(構造規約3「断片連結禁止」。JA出力は連結時と同一)
- 見出しキー`{name}、殿堂入り——{org}の一時代に幕`は`ui-render.js:7845`(殿堂入りティッカー)と**同一キーで既訳を共有**するため、パラメータ名を`{orgName}`ではなく`{org}`に揃えてある。levelLabel 3種も既訳を再利用
- `newsData.epithet`は**保存値として生JAのまま**返す
- **新設ヘルパー`_wmFillWithDict(dict, tpl, params)`**(management.js、`_wmNewsStamp`の直前): テンプレを**PH置換前に**dictへ通してから`fillTemplateVars`で残PHを埋める冪等な二段構え。`WM_I18N.t`(2引数・名前辞書変換つき)でも、Engine内フォールバック`(s)=>s`(1引数)でも壊れない。P6-8が`_buildPpvSummitStory`にローカルで書いた`_quoted`と同じ問題への恒久版で、**Engine内でテンプレ+paramsを扱う新規コードはこれを使う**

### 17-4. `EMOTION_TEXTS` は消費入口1点でt()

- 配線は**唯一の消費入口`getEmotionText()`(ui-render.js)で1回だけ**。呼び出し元3箇所(モバイル相関図カード / 比較ビューA→B / B→A)は無改修 — **呼び出し側で改めてt()に包み直さないこと**(二重t()がi18n-missを汚染する。§9「二重t()適用は無害ではなかった」)
- モバイルカードの`「${emotion}」`は`_quoteLine()`へ(ENでは引用符を落とす。§10)
- 台帳は`i18n/ui-ledger.json`へ`kept:true`+`note`で91行。**dialogue-ledger側の抽出器・台帳は使っていない**(P6-10時点でバッチ⑯が並行作業中だったため)。将来テーブルを整理するなら、セリフの性質からは`test/i18n-extract-dialogue.js`の`EXTRA_INCLUDE`へ移すのが本筋
- 英訳は`docs/en-tone-bible-draft-v0.1.md` §2の**属性レシピ準拠**。EMOTION_TEXTSは13カテゴリ×7属性の軸を持つのでstandard一律にはしていない

### 17-5. P6-10で新たに見つかった穴

1. **✅解決(P6-14)** — **`Engine.awards.generateBiography`(殿堂入り選手の語り文、management.js)**: 導入文6分岐×3 + 核心文19分岐×2〜3 + 余韻文(trust/media/style別)= **84文**を連結した1本の文字列を`entry.biography`としてG(殿堂入りエントリ)へ**永続化**する。異名と同じ「永続JA」族だが、**連結後の完成文が保存される**ため異名のような「表示点で辞書を1回引く」形が使えない(辞書キーは分解前の各文であり、完成文と一致しない)。→ 文プールをdata.jsのトップレベル表へ移設+`generateBiography(entry, dict)`のdict-opts化+**表示点での再生成**で解決(§13-1)
2. **✅棚卸し完了(P6-14)** — **`RETIREMENT_TEMPLATES`の穴はP6-10で解消済み**(§6の対象テーブル一覧に追加)。同型が他に無いかの機械列挙をP6-14で実施し、`*_TEMPLATES`族3件+近縁1件を検出した(§13-2)
3. **相関図の選手名pn()ロングテール**: P6-10でモバイル版の5箇所を配線したが、デスクトップ版(`rm-compare-*`等)や派閥オーバーレイには未通過の`${c.name}`が残る(D-P6-3の残≈634件の一部)

## 18. Stage B P6-14 — 殿堂入り語り文のEN化+`*_TEMPLATES`全数突合+不定冠詞の機械検査(2026-09-04追加)

### 18-1. 「連結後の完成文が永続する」族は**表示点で再生成する**

異名(§12-2)は「永続値はJAのまま・表示点で辞書を1回引く」で足りたが、語り文は3文を連結し終えた完成文が保存されるため同じ手が使えない。P6-14で確立した型は次のとおりで、**同型(完成文がGへ焼かれる紙面/記録テキスト)には今後これを使う**。

- **文プールは必ずトップレベルの`const`テーブルへ**。`HOF_BIOGRAPHY_TEMPLATES`(data.js)。関数本体に直書きされた配列は§10-2のとおりどの抽出器からも見えない
- **配列の並び順・要素数は変更不可**。`pick()`が`(entry.id * 31 + seasons) % arr.length`で添字を引くため、並びが変わると**保存済みの語り文と一致しなくなり、表示時再生成がフォールバックへ落ちる**
- **`generateBiography(entry, dict)`**。各文を**PH置換前に**`_wmFillWithDict(dict, tpl, vars)`(§12-3)へ通してから連結する
- **連結様式そのものをテンプレにする**: `join: '{intro}{core}{closing}'` → EN `'{intro} {core} {closing}'`。JAは区切り無しで直結、ENは文間に半角スペースが要る。3文の直積(6×19×3系統)を1本の完全文テンプレへ畳むことはできないため、**様式を1キーにするのが構造規約3(断片連結禁止)を満たす唯一の形**
- **保存するのは常にdict無し(JA)の戻り値**。`_buildHofEntry`はdictを渡さない(D-P6-4)
- **表示点(`ui-render.js: showHofDetail`。grepで消費点は1箇所のみ)は自己検証型のfail-open**:
  1. dict無し(JA)で再生成する
  2. 保存値と**1バイト一致**するか確かめる(=素材が揃っていて、テンプレも保存当時と同一である証拠)
  3. 一致したときだけ`WM_I18N.t`+**英訳済みの異名**(`_epithetLabel()`の戻り値でentryを浅くコピーして差し替える)で作り直した文を出す
  4. 一致しない(旧セーブで素材が欠けている/テンプレが変わった)なら**保存値を優先**する
  - JAモードでは3の結果が1と同一(t()はja素通し+PH置換のみ、`_epithetLabel`もja素通し)なので**日本語版の表示は1バイト不変**
  - **同一性チェックは異名を差し替える前の生JAで行う**。差し替え後で比較するとENモードでは必ず不一致になり、常に保存値フォールバックへ落ちてしまう
- **JA同一性の証明の作法**: ①着手前の実装を凍結コピーとして切り出し、全分岐を代表値・境界値の直積で回して新旧突合(P6-14では606,256通り・不一致0) ②`auto-sim`に`_buildHofEntry`のフックを挿して**実際に生成された殿堂エントリ**を収集し、本物の`src/i18n.js`+生成済み辞書で表示点の手順を再現(P6-14では38件・JA再生成==保存値 38/38、EN日本語残り0・i18n-miss 0)

### 18-2. `*_TEMPLATES`全数突合の結果(§12-5-2の宿題)

data.js/kuroda-text.js/セリフ専用ファイルの**トップレベル`const`を全件列挙して実値を評価**し、3台帳の収録キー+固有名詞辞書(`src/lang-en-names.js`)と突き合わせた。

**A. 「兄弟表は対象なのに本表だけ漏れている」型 — 4件(✅**P6-15で全件解決**、2026-09-04。詳細は§14)**

| 表 | 未収録行数 | 消費点 | 状態 |
|---|---|---|---|
| `UNIFIED_TITLE_TEMPLATES` | 96 | `Engine.newspaper.composeUnifiedTitleArticle(type, data, seed, dict)` | ✅dict-opts化+`join`畳み込み(P6-15) |
| `CHAMPION_CHANGE_TEMPLATES` | 26 | `Engine.newspaper.composeChampionChangeBody(ev, seed, dict)` | ✅dict-opts化+4スロット`champChangeJoin`(P6-15) |
| `PPV_HYPE_TEMPLATES` | 10 | `Engine.ppv.buildHype(match)` → `match.hype`+`hypeTpl`+`hypeVars` | ✅追加フィールド方式(P6-15)。`Math.random()`は据え置き |
| `DRAFT_PLAYER_RESULT_PARTS` | 14 | `Engine.newspaper.composeDraftPlayerResult(org, fighters, seed, dict)` | ✅dict-opts化+`join`/`nameList`畳み込み(P6-15) |

**この4件は台帳へ載せるだけでは無意味**(消費点がdictを持たないので辞書を引く機会が無い)。必要だったのは①composerのdict-opts化 ②断片連結の`join`テンプレ化(§13-1と同型) ③146行の英訳、の3点セットで、P6-15がこれを実施した。

**B. 3台帳・固有名詞辞書のいずれにも載っていない表 — 54表・約1,445行(→ P7-2で7表367行を解決、残**37表・約1,053行**)**

Engine/UIが直に読む地の文・ラベルのプール。大物は`SNAPSHOT_TEXTS` 276 / `CHAR_PROFILES` 127(dialogue-tone-spec §5でP5末尾送りと明示済み) / `ALL_COACHES`のflavor 125 / `NOTIF_EVENT_TEXTS` 102 / `LARGE_EVENT_TEXTS` 86 / `STYLE_TAG_MOVES` 82 / `WEEKLY_STORY_TICKER` 65 / ~~`DECISION_DOCS` 63~~✅ / ~~`TRAIT_DEFS` 50~~✅ / ~~`MILESTONE_EVENTS` 49~~✅ / `ATMOSPHERE_TEXTS` 33、以下中小の表が続く。
Engine/UIが直に読む地の文・ラベルのプール。大物は`SNAPSHOT_TEXTS` 276 / `CHAR_PROFILES` 127(dialogue-tone-spec §5でP5末尾送りと明示済み) / `ALL_COACHES`のflavor 125 / `NOTIF_EVENT_TEXTS` 102 **✅P7-3** / `LARGE_EVENT_TEXTS` 86 **✅P7-3** / `STYLE_TAG_MOVES` 82 / `WEEKLY_STORY_TICKER` 65 **✅P7-3(台帳のみ・表示はJA固定。§15-2)** / `DECISION_DOCS` 63 / `TRAIT_DEFS` 50 / `MILESTONE_EVENTS` 49 / `ATMOSPHERE_TEXTS` 33、以下中小の表が続く。
Engine/UIが直に読む地の文・ラベルのプール。大物は~~`SNAPSHOT_TEXTS` 276~~(**✅P7-2**) / `CHAR_PROFILES` 127(dialogue-tone-spec §5でP5末尾送りと明示済み) / `ALL_COACHES`のflavor 125 / `NOTIF_EVENT_TEXTS` 102 / `LARGE_EVENT_TEXTS` 86 / `STYLE_TAG_MOVES` 82 / `WEEKLY_STORY_TICKER` 65 / `DECISION_DOCS` 63 / `TRAIT_DEFS` 50 / `MILESTONE_EVENTS` 49 / ~~`ATMOSPHERE_TEXTS` 33~~(**✅P7-2**)、以下中小の表が続く。

**✅P7-2(2026-09-04)で解決した7表**: `SNAPSHOT_TEXTS` 282 / `ATMOSPHERE_TEXTS` 33 / `FAREWELL_KIND_TEXT` 15 / `LOCKER_AIR_TEXTS` 14 / `CAMP_FLAVOR_TEXTS` 12 / `PRE_WINDOW_TEXTS` 9 / `TEAM_SPIRIT_TEXTS` 8(詳細は§15)。

**✅P7-1で「C. ラベル・短い定義の表」分類を全解決(2026-09-04、詳細は§15)**: `TRAIT_DEFS`(50) / `MILESTONE_EVENTS`(49) / `COACH_ABILITY_CATALOG`(13) / `SPECIAL_EVENT_INTRO`のUI部分(13、P6-13のkept:true手追加から走査対象へ昇格) / `PROMO_EVENT_NAMES`(12) / `GLIMPSE_A_THRESHOLDS`(11) / `DECISION_DOCS`(63、同じくP6-13から昇格) / `COACHING_TYPE_LABELS`(5) / `COACH_STYLE_MAP`(6、既訳5+新規1) / `STAT_TIPS`(5) / `QUARTER_LABELS`(4) / `SCANDAL_CONFIG.messages`(3、消費点は§2-4のgameLogレガシー文字列のみで実質対象外だが台帳は完備) / `LOSING_STREAK_PENALTIES.msg`(3、同upper)。残る大物6表(SNAPSHOT_TEXTS/CHAR_PROFILES/ALL_COACHES flavor/NOTIF_EVENT_TEXTS/LARGE_EVENT_TEXTS/STYLE_TAG_MOVES/WEEKLY_STORY_TICKER/ATMOSPHERE_TEXTS等)はP7-2〜P7-5が担当。

**⚠ `i18n-miss 0` は「英語化が終わった」の指標ではない。** missは「t()を通ったが辞書に無い」ときにしか出ないので、**そもそもt()を通っていないこの層は永久にmissへ出ない**。進捗はEN走破の「JA exposure by screen」(P6-14時点: screen-week=56 / screen-shachoshitsu=55 / screen-log=51 / screen-show=39 / screen-newspaper=33 … / P7-1後: screen-log=48 / screen-week=29 / screen-newspaper=29 / screen-roster=25 / screen-shachoshitsu=13 / screen-show=7 / titleScreen=6 / screen-finance=5 / screen-ranking=4、合計186→166)と本突合表を併読して測る。

### 18-3. プレースホルダ直前の不定冠詞の機械検査(黒田英文体 §3-4 規則25)

`test/i18n-build-dict.js` / `i18n-build-template-dict.js` / `i18n-build-dialogue-dict.js` の3本が同一定義の
`ARTICLE_BEFORE_PLACEHOLDER_RE = /\b(a|an)\s+\{[^}]+\}(?!-)/i` を持ち、違反があれば**exit 1・辞書を生成しない**。

- `a {n}` は充填値が8/11/18のとき"an"が正しくなり、`a {name}` は名前の頭音で割れる
- **ハイフン付きの限定用法(`a {n}-match history` = 規則24の逃がし方)は常に"a"で正しいので許可**する。`}`の直後がハイフンかどうかで機械的に区別する
- 導入時点の既存違反は6件(ui 1 / template 5)。いずれも`{label} offer from {outlet}`(冠詞を落とす) / `a match rated {bestMQ}`(§1-7の固定対訳へ寄せる) / `{playerName}'s matches`(規則26の所有格へ逃がす)の形で書き直した

## 19. Stage B P7-3 — 地の文プール後半3表(253行)の台帳化・英訳(2026-09-04追加)

`docs/i18n-stage-b-p7-design-v0.1.md` §1分類A(地の文プール)の後半3表を `test/i18n-extract-templates.js` の
`TARGET_TABLES` へ追加し、全253行を英訳した。template-ledger は 1,749 → **2,002キー・未訳0**。

| 表 | 行 | 消費点 | 配線 |
|---|---:|---|---|
| `NOTIF_EVENT_TEXTS` | 102 | `Engine.eventSystem.pickText(rng, key, vars, dict)` | ✅**P6-13で配線済み**。本バッチは英訳のみ |
| `LARGE_EVENT_TEXTS` | 86 | 同上(`B4_{activityType}` サブプールを含む) | ✅同上 |
| `WEEKLY_STORY_TICKER` | 65 | `Engine.relationships.processWeeklyStoryEvents()` → gameLogのレガシー文字列 | ⚠台帳のみ(§15-2) |

### 19-1. 「配線済み・辞書だけ無い」表はEN走破の `i18n-miss` にそのまま出る

P6-13が `pickText()` のPH先埋め(§9-10-1型)を直した結果、NOTIF/LARGE の2表は**t()を通るのに辞書に無い**状態
= §13-2 Bの中で唯一 `i18n-miss` として可視化される族になっていた。着手前のEN走破の miss 7件のうち6件がこの2表。
**§13-2 Bの表でも、消費点がdict化された瞬間からmissに出る**ので、missが0でないときは「未配線」ではなく
「配線済み・未訳」の可能性を先に疑うこと。

### 19-2. `WEEKLY_STORY_TICKER`(2026-09-06 P7-36で`RELATION_EVENT_LINES`へ改名)は gameLog専用プール — 表示はJA固定(§2-4/§12-1)

名前に反して**ティッカーには一切出ない**(`Engine.news.generateTicker` が読むのは `NEWS_TICKER_TEMPLATES`)。
この「名前と実体の不一致」自体はP7-36の改名で解消済み(下記の解消メモ参照)。以下は改名前の当時の分析記録:
実際の消費点は `processWeeklyStoryEvents()` が `events.push('[trust-warning] …')` の形で積む
**gameLogのレガシー文字列エントリ**(`renderLog` が `gameLogEntryText()` 経由で無変換に素通しする族)1点のみ。

- 文字列エントリをEN化するには `{type, data}` オブジェクトエントリへ移行するしかなく、それは
  **セーブに書く値の変更**にあたる(§2-4「旧文字列エントリは無変換で共存」/ D-P6-4)。§11-2で
  「gameLog全体の再設計を要する別工程」として既に見送りが確定している族と同一
- したがって本バッチは**台帳化と英訳のみ**を行い、消費点は無改修とした。§13-2 Bの突合表を閉じることと、
  gameLog再設計時に訳が揃っている状態を作ることが目的
- **13キー中、実際に読まれているのは `clash`(5) / `trustWarning`(4) / `awakening`(27) の36行だけ**。
  残り10キー29行(`bestFriends` / `hostileEnemy` / `goodRivalZone` / `unrequitedBond` / `onesidedHostility` /
  `temperatureDiff` / `crossAsymmetry` / `highRivalryAwareness` / `goodRivalTicker` / `bitterRivalTicker`)は
  **参照0の死蔵**(2026-09-04 全数grep)
- **✅ 2026-09-06 P7-36で解消**: 📰週次ティッカー(`.news-ticker-bar`/`Engine.news.generateTicker`/
  `NEWS_TICKER_TEMPLATES`)そのものをKeisuke裁定で廃止したのに合わせ、この節が指摘していた
  「名前と実体が一致しない」問題を解消する形で `WEEKLY_STORY_TICKER` を `RELATION_EVENT_LINES` へ改名し、
  死蔵の29行(上記10キー)を削除した(現存は`clash`/`trustWarning`/`awakening`の3キー36行のみ)。
  消費点(`processWeeklyStoryEvents()`のgameLogレガシー文字列エントリ)自体は無改修 — 上記の
  「台帳化と英訳のみ」の判断は変わらない

### 19-3. 会場名は「本文辞書」ではなく「名前辞書」の住人

`management.js` の会場費行が `dict(VENUES[...].name)` と**本文辞書**を引いており、会場名は
`lang-en-names.js`(pn/名前辞書)側にしか無いため必ず外れて `[i18n-miss] 中ホールB` になっていた
(EN走破の miss 7件の残り1件)。**値をそのままパラメータで渡す**のが正解 — `t()` のenブランチが持つ
パラメータ値の名前自動変換(D-P6-2 `convertNames`)が引き当てる。`dict` で先に訳そうとしないこと。

### 19-4. P7-3で新たに見つかった同型(未着手)

1. **✅解決(P6-17)** — **`processWeeklyStoryEvents` の直書きJA 6本** — `[grievance]`4本(給料/後輩の待遇/タイトル挑戦/出場機会)と
   `[hostile-pairs]`1本+ペア名の連結様式。`WEEKLY_STORY_TICKER` と**同じ関数の中で同じgameLogへ積まれる**のに、
   どの表にも入っていない実行文直書き(§10-2型)。→ `WEEKLY_STORY_EVENT_TEXTS`(data.js)へ移設し台帳化・英訳した。
   **表示はJA固定のまま**(§19-2と同じ判断・§21-3)
2. **EN走破の `screen-log` のJA露出48件は、ほぼ全部がこのgameLogレガシー文字列族**。§13-2の完了指標
   「各画面1桁」を screen-log に適用するには gameLog の `{type,data}` 全面移行が前提になる

## 20. Stage B P7-1 — データ表の値層「C. ラベル・短い定義の表」を`DATA_TABLES`モードで台帳化・配線・英訳(2026-09-04追加)

設計はdocs/i18n-stage-b-p7-design-v0.1.md §1-C。§13-2 Bの54表のうち、地の文プール(P7-2/P7-3)・プロフィール文(P7-4)・技名(P7-5)を除いた「ラベル・短い定義の表」13表と、P6-13が積み残した4件(秋対抗戦の団体名ロングテール/fanExpect理由テンプレ/特性バッジ/招聘市場パネルのラベル)を解決した。

### 20-1. `test/i18n-extract-ui.js` に `DATA_TABLES` モードを新設

既存の`test/i18n-extract-templates.js`の汎用再帰ウォーカー(`walkStrings`、値を無差別に拾う)とは別に、**表ごとに専用の抽出器を書く**方式にした。理由: このC分類の表は「オブジェクトのキー自体がラベル」(`TRAIT_DEFS`/`COACH_ABILITY_CATALOG`)・「特定フィールドだけが訳出対象で他は英語enum/数値」(`MILESTONE_EVENTS`/`GLIMPSE_A_THRESHOLDS`/`DECISION_DOCS`)・「値がそのまま訳出対象」(`PROMO_EVENT_NAMES`/`COACHING_TYPE_LABELS`/`COACH_STYLE_MAP`/`STAT_TIPS`/`QUARTER_LABELS`)の3系統が混在し、汎用ウォーカーでは`color`(hex)・`grade`(単一英字)・`cat`(enum)等の非翻訳フィールドまで拾って台帳を汚してしまうため。

- `DATA_TABLES`配列の各エントリは`{ name, extract(table, onEntry) }`。`onEntry(text, tablePath)`で`source:'TABLE.path'`(例: `TRAIT_DEFS.華.desc`、キー自体を拾うときは`TRAIT_DEFS.華.$key`)付きの行を記録する
- 表アクセスは`require()`ではなく`test/helpers/load-game.js`の`loadAsGlobal('data.js')`(vm経由)。`DECISION_DOCS`/`COACHING_TYPE_LABELS`はdata.jsの`module.exports`に載っていない(exportされているのはゲーム内で他ファイルから直接参照される表のみ)ため、requireでは見えない
- 保全マージ(既存en非破壊)は既存のロジックをそのまま使う。**`SPECIAL_EVENT_INTRO`/`DECISION_DOCS`はP6-13が「走査対象外につき手追加」の`kept:true`で登録していたが、DATA_TABLESが両表を対象に加えたことで次回抽出時に自動的に`kept`が外れ`source`が付く**(設計§1-Cの「kept扱いではなく走査対象として再現可能に」を達成)。この移行時、両表に付いていた「走査対象外につき手追加」のnoteは事実と異なるため、`source`が付いた行に限り引き継がない機械判定を追加した

### 20-2. 対象13表・訳出内訳

| 表 | 行数 | 内訳 |
|---|---:|---|
| `TRAIT_DEFS` | 50 | キー25(既存の`en:`フィールドをそのまま採用) + desc25(新規) |
| `MILESTONE_EVENTS` | 51 | title/titleMain/titleSub/narration(文字列 or 配列)/continueLabel/choices[].{label,result,effectLabel} |
| `COACH_ABILITY_CATALOG` | 26 | キー13(新規) + desc13(新規) |
| `SPECIAL_EVENT_INTRO` | 15 | title/travelLine/nextLabel(P6-13で訳出済み・今回は走査対象への昇格のみ) |
| `DECISION_DOCS` | 75 | label/categoryLabel/costLabel/body/detailText/effectSummary/recommendation(P6-13で大半訳出済み。今回`relationship_repair.recommendation`と`encourage.effectSummary`の全角括弧版2件が新規) |
| `PROMO_EVENT_NAMES` | 12 | low/mid/highの3プール×4件 |
| `GLIMPSE_A_THRESHOLDS` | 11 | `.label`のみ |
| `COACHING_TYPE_LABELS` | 5 | 全件新規(非export) |
| `COACH_STYLE_MAP` | 6 | 5件は既存訳(選手スタイル表示と共用)、`ブローラー`のみ新規 |
| `STAT_TIPS` | 5 | 全件新規 |
| `QUARTER_LABELS` | 4 | 全件新規 |
| `SCANDAL_CONFIG.messages` | 3 | 全件新規(§15-4参照。実消費点は現状gameLog専用) |
| `LOSING_STREAK_PENALTIES.msg` | 3 | 全件新規(同上) |

新規訳出170行(台帳の新規キー174件のうち4件はP7-1と無関係の既存drift)。加えて配線中に発見した「表に無いがdata.js外(management.js/app.js/ui-common.js)の関数内リテラル」8+1+6=15件を`kept:true`で手追加(§15-3)。

### 20-3. DATA_TABLESの走査対象外だが配線した3件

1. **`Engine.fanExpect.generate(state, dict)`(management.js)** — ファン期待カード理由文。旧実装は`` `🤝 ${f1.name} vs ${f2.name}の名勝負再現に期待の声` ``のようにJS template literalで選手名を先に埋め込んでいたため、辞書キー(埋め込み前の原文)と一致せず翻訳不能だった(P6-13 §8で「単純なdict-opts化では済まない」と指摘)。`addCandidate(f1, f2, tpl, priority)`のシグネチャを`reason`(完成文)から`tpl`(`{left}`/`{right}`プレースホルダ入りテンプレ)へ変更し、freshness降格時の`.replace('期待の声', ...)`もテンプレ段階(埋め込み前)で行うよう移した。表示点(`ui-render.js`)は`Engine.fanExpect.generate(G, WM_I18N.t)`とdictを渡す。テンプレ7本+freshness降格の差し替え変種1本、計8件を`i18n/ui-ledger.json`へ手追加
2. **`app.js` の`first_rivalry`マイルストーンの動的ナレーション** — `MILESTONE_EVENTS`表の`narration`はbase値が`null`(選手名を後から埋め込むため)。旧実装は選手名埋め込み後の完成文をそのまま`narration`へ入れていたため、`showMilestoneEvent`(ui-common.js)が単純に`WM_I18N.t(evt.narration)`しても翻訳できなかった。`narration`をPH入りの原文のまま保ち、埋め込み値を新設`narrationVars`フィールドへ分離、`showMilestoneEvent`側で`WM_I18N.t(evt.narration, evt.narrationVars)`(訳してから埋める)を行うよう修正。1件を手追加
3. **秋対抗戦(Autumn War、`ui-common.js`)の団体名ロングテール(P6-13 §8の積み残し)** — `_agwTeam(id)?.orgName || ''`型の未`pn()`箇所を全数(約18箇所)`WM_I18N.pn()`配線。共有ヘルパー`_chTeamlineHtml`/`_chOrgBadgeHtml`/`_chOrgEmblemInner`/`_chSubCardHtml`(春季タッグ/JT等でも使われる団体名表示部品)は関数内で`pn()`を1回適用する形にして呼び出し側の重複配線を避けた。同じ画面で見つかった副次的な未配線(`_agwTeamViewState`の状態ラベル`敗退/決勝進出/出番待ち/優勝/対戦中`、`_agwRoleLabel`の役割ラベル`先鋒/中堅/大将/代表`)も合わせて配線・6件を手追加

### 20-4. 発見: gameLogレガシー文字列専用の表は配線不要(§2-4の適用確認)

`SCANDAL_CONFIG.messages`(スキャンダル発生時の見出し)と`LOSING_STREAK_PENALTIES.msg`(連敗ペナルティ通知)は、消費点`Engine.popularity.checkScandal`/`checkLosingStreak`の戻り値`.msg`を全呼び出し元で追跡した結果、**唯一の表示経路が`events.push(...)`→`tickWeek`の戻り値`events`→`G.gameLog`への直接concat**(§2規約4「旧文字列エントリは無変換で共存」)であることを確認した。実際にプレイヤーへ通知される内容(`app.js`の`showNotifEventToast`)は`scandal.msg`を使わず別の固定テンプレ(`📰 {name}のスキャンダルが週刊誌に掲載された！`、既訳済み)を組み立てており、`scandal.msg`自体はgameLog行にしか現れない。したがって**この2表はDATA_TABLESで台帳化・英訳したが、コード側の配線(t()呼び出し)は行っていない**(spec §2-4の仕様どおり、gameLogは意図的にJA固定)。将来gameLogが`{type,data}`形式へ移行する際に訳文を再利用できるよう、台帳には残す。

### 20-5. 検証

`node --check`全触りファイルOK。`node test/ja-golden.js`**完全一致**(hash `6b3d05c8…`、全編集を通じて不変)。`node test/i18n-build-dict.js`台帳4,022キー・未訳4件(すべてP7-1と無関係の既存drift、ui-common.js内のセリフ的文字列でsourceタグなし)。`npm test` **260/260 green**(`stat-notation-backport-test.js`が抽出評価するvmサンドボックスに`WM_I18N`スタブが無く1件red化→スタブ追加で解消、既存47ファイルへの機械追加と同型の対応)。`node test/auto-sim.js 20 42` **ALL CLEAR**、semantic fingerprint `37bbd0cd`(P6-7/8/10/13と同一)。`npm run test:ui:walkthrough` **PASS**、ja digest **`1052faa82eaf7991`不変**。`npm run test:ui:walkthrough:en` **PASS**、i18n-miss **7件で不変**(全てNOTIF_EVENT_TEXTS/LARGE_EVENT_TEXTS由来、P7-3の担当領域で本バッチでは意図的に不触)。JA exposure合計は**186→166**(−11%)。`node test/i18n-ratchet.js`増加なし(28,089不変)。
## 21. Stage B P6-17 — 年代記の章タイトル/副題/締め/ハイライトと週次ストーリー直書き6本(2026-09-04追加)

§15-6 が起票した4件(発見3・4)と §19-4 の1件を解決した。訳出**103キー**(template-ledger 2,571→**2,672**・未訳0 / ui-ledger 4,028→**4,027**・未訳0)。

### 21-1. 「保存される完成文」は追加フィールド、「保存値が辞書キーそのもの」は表示点で1回引く

年代記の章は `G.chronicle.chaptersCache.chapters[]` へ**完成文が永続**する。4つとも同じ層だが、充填値の有無で解き方が割れる。

| 対象 | 保存値 | 配線 |
|---|---|---|
| `title`(○○世代) | 姓を埋めた完成文 | **追加フィールド `titleParts`**(§15-1) |
| `subtitle`(黄金期 等) | **充填値を持たない素のプール文字列** | 追加フィールドを持たず、表示点で `WM_I18N.t(subtitle)` を1回引く(§17-2 の異名と同型) |
| `closing`(章末) | 団体名・軸ラベルを埋めた完成文 | **追加フィールド `closingParts`** |
| `highlights[].text` | 選手名・ベルト名・年次を埋めた完成文(HTML) | **追加フィールド `highlights[].textParts`** |

- プールは `CHRONICLE_CHAPTER_TEMPLATES`(data.js、`title`/`subtitle`/`closing`/`highlight`)へ移設した。`SUBTITLE_TEMPLATES`/`CLOSING_TEMPLATES` は Engine のプロパティ(§10-2型で抽出器から不可視)だったので `Engine.chronicle` からは削除している。**配列の順序・要素数は変更不可**(`_pickTemplate` が章境界のシードから添字を引く)
- 完成文は必ず `narrativeText(parts)`(dict省略=JA)から作る。手組みの文字列を残さないので「保存値とパーツが食い違う」経路が構造的に生じない
- 表示点は `ui-render.js` の **`_chronicleParted(parts, savedText)`** 1関数へ集約(章タイトル3箇所・章末・ハイライト)。パーツが無い旧セーブは**保存値をそのまま出す**(fail-open)。**保存値を`t()`に通さないこと**
- **ハイライトは断片連結をやめ、分岐ごとの完全文48本にした**(構造規約3)。`<strong>` は文中の位置が言語で変わるためテンプレ側に置く。文末にだけ付く対戦相手の差し込み句(`（vs …）`)だけは §15-2 のクラウス方式(EN訳文は先頭スペースを持たず、連結様式 `join` が空白を入れる)

### 21-2. パーツの値マーカー `L` / `B` — 「値そのものが辞書を引く必要のあるJAラベル」

`_narrativePartText` に2つの任意フィールドを足した。**どちらも `v` の値に対して働く**(テンプレ本文ではなく値を引く点で `_wmDictLabel` と同趣旨・§14-2)。

- **`L: [vキー…]`** … 値がJAの1語ラベル(`打撃`/`団体`/`団体王座` 等)。`_wmDictLabel(dict, 値)` で引き直す
- **`B: [vキー…]`** … 値がJAのベルト名(`○○王座`)。`Engine.chronicle._beltLabel(値, dict)` で組み直すので、団体名だけが**パラメータ**を通り名前辞書(pn)が効く。`王座`単独(orgName不明)は "Title" へ落ちる
- **実在の団体名・選手名には付けない** — `_wmDictLabel` はUI辞書を引くので、名前を渡すと `[i18n-miss]` を量産する。名前はマーカー無しの素の値のまま渡し、`t()` のパラメータ値自動変換(D-P6-2)に任せる。マーカーを付けるかどうかは**生成時に決まる**(`ev.orgName` が取れたかどうか)ので、保存されるパーツに分岐が焼き付く
- **`items` の中のパーツにも同じ手順を適用すること**。P6-16の`_narrativePartText`は `items` を `_wmFillWithDict(dict, it.t, it.v)` で直接埋めていたため、内側に入ったベルト名がマーカーを通らずJAのまま残った(**P6-17のEN検品で発見した実バグ**。`_buildAceNarrativeParts` の2文目「{belt}を{count}度戴冠」がENでも`凰翔プロレス王座`のまま出ていた)。内側も `_narrativePartText` を再帰で呼ぶ形に直した
- **`items` の要素は素の文字列でもよい**(P6-17で追加)。連結様式のパラメータとして渡るので名前辞書の変換が効く。1件のときは畳み込みが起きないが、その場合は `{items}` の値として外側テンプレのパラメータを通るのでそこで変換される(`joinNameList` と同じ理屈・§14-1)

### 21-3. `WEEKLY_STORY_EVENT_TEXTS` — gameLog専用プールの2つ目

`processWeeklyStoryEvents`(relationships.js)の `[grievance]`5本+`[hostile-pairs]`2本+ペア連結1本を `WEEKLY_STORY_EVENT_TEXTS`(data.js)へ移設した。**消費点は無改修=表示はJA固定**(§19-2 の `WEEKLY_STORY_TICKER` と同じ関数・同じgameLogレガシー文字列エントリなので判断も同じ)。`[grievance]` 等の接頭辞は機械タグなので消費点に残す。ペア名の列挙は `ARTICLE_COMPOSE_TEMPLATES.nameList` の畳み込みへ寄せた(§14-1)。

### 21-4. 同じキーを2つの台帳へ載せない(§15-3)の実運用 — 衝突3件の裁き方

`CHRONICLE_CHAPTER_TEMPLATES` を template-ledger の走査対象に足すと、ui-ledger と**同じキー**になる行が3つ出た。読み込み順(lang-en.js → lang-en-templates.js)でテンプレ側が後勝ちするため、放置すると訳が入れ替わる。

- `黄金期` / `端境期` … P6-16が management.js の `_wmDictLabel(dict, …)`(記者の目の`{eraTag}`枠)向けに **`kept:true` で手追加**した行。**ui-ledger 側を削除**し、template-ledger に一本化した(`_wmDictLabel` は合成済み辞書を引くので配線は不変)。訳文は既訳(`a golden age` / `a lean spell`)を踏襲する — `{eraTag}` は "were nothing other than {eraTag}." のように文中へ入るため、この2つだけは**サブタイトルでも小文字の名詞句**になる
- `旗揚げ世代` … ui-render.js の `WM_I18N.t('旗揚げ世代')`(序章のロースター見出し)から**自動抽出される**行なので消せない。意味が同一なので**両台帳に同じ訳**(`The Founding Generation`)を置く。**訳が一致している限り読み込み順に依存しない**ので、これは許容できる唯一の重複形

`該当選手` は「文脈違い」と起票されていたが(§15-6-3)、台帳の `count=1` / `files=[ui-common.js]` から**秋対抗戦MVPの人名スロットが唯一の消費点**と判明した(検索フィルタ語は別キー `該当する選手がいません` → "No wrestlers match")。キー分割はせず `en` を `Unnamed wrestler` へ訂正した。

### 21-5. JA同一性の証明(109,956通り・不一致0)

§15-5 の作法(凍結コピーとの全数突合)を5関数へ適用。HEADの `_generateTitle`/`_generateSubtitle`/`_generateClosing`/`_buildHighlights`/`_buildAceNarrativeParts` をソースから機械抽出し、`Object.create(Engine.chronicle)` のプロトタイプ経由で未変更ヘルパを共有して突合した。

- 移設した2表(`SUBTITLE_TEMPLATES`/`CLOSING_TEMPLATES`)は `JSON.stringify` で凍結コピーと**完全一致**
- サブタイトル**29/29**・章末**12/12**・ハイライト**48/48**の全テンプレに到達(章境界グリッド+全イベント型の直積+乱数fixture 4,000本)
- ハイライトは1行ごとに「保存文 == `narrativeText(textParts)`(dict省略)」「保存文 == `narrativeText(textParts, ja素通しdict)`」も同時に照合する(20,423行)
- **auto-simのsemantic fingerprintは追加フィールドの分だけ動く**(`c52c116c` → `afda03f8`)。指紋のreplacerで `titleParts`/`closingParts`/`textParts`/`B` を除外して**HEADと新実装の両方を再計測**し、**どちらも `a8641a5a`** になることを実測した(HEADで同じ除外を掛けても値が変わるのは、指紋対象に別の `B` キーが元から存在するため。両者に同じ除外を掛けている以上、比較としては成立している)

### 21-6. P6-17で新たに見つかった穴

1. **✅解決(P6-18)** — **序章(`Engine.prologue`)のハイライト・記者の見立て・章末が生JAのまま**。`ui-render.js` の序章描画は `h.text` を直参照し、「この章の主役が誰になるかは、まだ確定していない。…」「この世代の物語は、まだ始まったばかりだ。」がt()を通っていない。`Engine.chronicle` とは別レイヤー(`G.prologue`)で、ハイライトの生成側(`Engine.prologue`)も同型のテンプレ化が要る → §23-1
2. **✅解決(P6-18)** — **年代記のエース/同期カードに単位語の生JAが残る**(`${a.seasons}<span class="small">期</span>` / `${a.titleReigns}<span class="small">戴冠</span>` / peer行の `${p.titleReigns}度戴冠`)。数値+単位語は §4 の「Stage Bで複数形込みで設計する」族 → §23-2・§23-3
3. **`Engine.chronicle._getSurname` の `名無し` フォールバック**(§15-6-5)は引き続きdict化していない(実質到達不能)
4. **✅解決(P6-18)** — **年代記画面はUI走破ハーネスが踏まない**(1季走破では章がまだ生成されない)。レア画面強制点火カタログ(`test:ui:ignite`)へ年代記シナリオを足す候補 → §23-4(`--scenario chronicle`、JA/ENの2本)
## 22. Stage B P7-4 — プロフィール文3表(§13-2 B の分類B)の配線(2026-09-04追加)

§13-2 B の分類B「プロフィール文」3表(`CHAR_PROFILES` 127 / `ALL_COACHES` 112 / `COACH_FLAVOR_DEFS` 11)を台帳へ載せ、消費点を配線し、251キー(連結様式1件を含む)を英訳した。台帳はテンプレ層(§6)。

### 22-1. 「Gに焼かず、表示のたびに表から読み直す」族 — 追加フィールドも再生成も要らない

`CHAR_PROFILES` は §13-1 の「表示時に再生成」も §14-3 の「追加フィールド方式」も要らない**最も素直な型**だった。理由を残しておく(同型を見分けるため):

- **永続しない**。app.js の17箇所の `profile:` はすべて `postMessage` 用のローカル `const msg` に積まれるだけで、`G` にも `Storage.serialize` の対象にも入らない。iframe からの戻り(`MATCH_RESULT` / タッグ版)にも profile は含まれない
- **選出に乱数が絡まない**。キーは `char.id` なので、表示のたびに表から引き直せば必ず同じ行が取れる
- したがって**表示点で `t()` を1回**呼ぶだけでよい。**表示点は grep で4箇所のみ**:
  `ui-common.js` の `showFighterPopup`(表を直読み) / `app.js` の `_fighterFileDetailHtml` / `battle-engine-main.js` の `openBp` / `tag-battle-main.js` の `openBp`
- **iframe 2本(battle-engine / tag-battle)にも `WM_I18N` が読み込まれている**ので、ペイロードはJAのまま渡して表示側で訳す。ペイロードを訳して渡すと「親でも子でも t()」の二重t()(§10-1)になる

**この型を見分ける手順**: producer(`X[id]` を読んでオブジェクトへ積む箇所)を全数列挙し、**そのオブジェクトが `G`/`Storage`/スナップショットへ入るか**を追う。入らないなら表示点t()で足りる。入るなら §13-1(再生成) か §14-3(追加フィールド) を検討する。

### 22-2. オブジェクト配列の一部プロパティだけを台帳へ載せる — `TABLE_PATH_FILTER`

`ALL_COACHES` はオブジェクト配列で、1要素の中に**訳出対象(desc/profile/origin/gender/flavor)・名前辞書の領分(name)・別台帳の領分(abilities)・日本語を含まない識別子(grade/style/coachingType/observation/emoji)**が同居する。

P6-10 の `extractArrayLiteralProp`(ソース文字列から `prop: [ … ]` を切り出して孤立評価する)と目的は同じだが、**`ALL_COACHES` はトップレベル`const`で評価済みの値がそのまま取れる**ため、ソース切り出しではなく `TABLE_PATH_FILTER`(P7-2で導入したパスフィルタ)で対象キーを絞った。配列インデックスは `pathKeys` に含まれないので、要素直下のキー名がそのまま最後の要素になる。

- **`extractArrayLiteralProp` を使うのは「その配列がトップレベルconstではなくオブジェクトのプロパティで、loadAsGlobal では取れない」ときだけ**(app.js/management.js のプール)。取れるならフィルタのほうが安全(evalしない・構造変化に強い)

### 22-3. 「キーが表示される表」は値の走査では拾えない

`walkStrings` は**値の葉だけ**を拾うので、`COACH_FLAVOR_DEFS` のような `{ '頑健指導': { desc: '…' } }` 型の表では**キー(能力名)が台帳に載らない**。ところが表示点は `🌿 ${c.flavor}: ${DEFS[c.flavor].desc}` のように**キーも画面に出す**。

- 本バッチは `ALL_COACHES.flavor`(同じ文字列が**値として**実在する)を拾うことで塞いだ
- **同型が `COACH_ABILITY_CATALOG` に残っている**。13個の能力名は `ALL_COACHES.abilities` の値でもあるが、そちらは別台帳(ui-ledger/P7-1)の領分として本バッチの対象外にしたため、**どちらの抽出器からも「キー」としては見えない**状態が続く。ラベル表を `DATA_TABLES` モードで台帳化するときは**キーを載せるかどうかを表ごとに決める**こと
- **`t('')` を呼ばない**。定義が引けないときに空文字を辞書に通すと EN で空キーの `i18n-miss` を量産する。`ui-common.js` の `_coachFlavorDesc(flavorKey)` は非空のときだけ辞書を引く

### 22-4. 直書き連結のメタ行は1テンプレへ畳み、値も引き直す

コーチのプロフィール欄は `${c.age}歳 ｜ ${c.gender}性 ｜ ${c.origin}出身` の直書き連結で、**3つの接尾辞(歳/性/出身)がt()を一度も通らなかった**。§14-1 の流儀(i18n配線のために足す文字列は data.js の `ARTICLE_COMPOSE_TEMPLATES` へ集約)に従い `coachProfileMeta` を新設し、**値(男/女・出身地)は差し込む前に辞書を引き直す**(§14-2 `_wmDictLabel` と同趣旨)。

- `ALL_COACHES` 35名は全員 age/gender/origin を持つため、**JAの出力は畳み込み前と1バイト一致**(35名で実測)
- EN: `Age 58 | Male | From Hokkaido`。`{gender}性` の「性」は EN 訳(`{gender}` のみ)が吸収する

### 22-5. `CHAR_PROFILES` の英語の声

**抑えた三人称・現在形の人物紹介**。選手ファイルの紹介文であって黒田署名ではない(§14 の紙面本文とは別の声)。en-tone-bible §1・§4-6 に従い温度を上げない・格言化しない・身体/抽象メタファーを足さない。JAの構文をなぞる義務はない(バイブル最重要則2)。

- **紹介文の地の文に埋まった人名・校名は静的に英語表記で書く**(PHではないので名前辞書の自動変換が効かない)。したがって**固有名詞ドラフトの「要読み確認49件」の裁定で表記が変わったら、辞書1行の差し替えでは済まず該当する紹介文の行も直す**必要がある
- **build-dict の黒田禁止語検査はテンプレ台帳全体に効く**。人物紹介で自然に出る `legendary` が2件引っかかった(`legend` / `living legend` は禁止語ではない)。紙面向けの禁止語リストが人物紹介にも適用される点は仕様どおり

### 22-6. 到達不能な表示枝を台帳へ載せたときの扱い

`ui-common.js` のコーチツールチップは `if (c.profile) … else if (c.desc) …` で、**`ALL_COACHES` 35名は全員 `profile` を持つ**(`Engine.coach.generateSeasonalPool()` は `.map(c => c.id)` でIDしか返さず、オブジェクトの複製・push・`profile` 削除はコード全体で0箇所)。したがって `desc` 枝は現状**到達不能**。

- 防御的フォールバックとして枝は残し、`desc` 35行も**台帳へ載せて訳した**。表の全行が台帳に載っている状態(§13-2 Bの完了指標)を優先する
- ただし**「訳したのに出ない行」がある**ことは記録しておく。枝を消すか `desc` を短縮表示として実際に使うかはKeisuke裁定

## 23. Stage B P6-18 — 序章のテンプレ化 / 年代記カードの単位語 / 年代記の強制点火シナリオ(2026-09-04追加)

§21-6 が起票した3件(発見1〜3)を解決した。訳出**29キー**(template-ledger 2,923→**2,952**・未訳0 / ui-ledger 4,027→**4,032**・未訳0 / dialogue-ledger 16,674 は不触)。

### 23-1. 序章(`G.prologue`)は年代記と同じ層 — 解き方も同じ3通りに割れる

`Engine.prologue` は `Engine.chronicle` とは別レイヤーだが、抱えている構造は同じ(完成文が `G` へ永続する)。文面プールは `PROLOGUE_TEMPLATES`(data.js トップレベル)へ移設し、§21-1 の表と同じ基準で解いた。

| 対象 | 保存値 | 配線 |
|---|---|---|
| `highlights[].text`(12種) | 団体名・選手名を埋めた完成文 | **追加フィールド `textParts`**(§15-1)。`Engine.prologue.addHighlight` は `textParts` を受け取ったとき `text` を必ず `Engine.chronicle.narrativeText(parts)`(dict省略=JA)から作るので、手組みの文字列が1本も残らない |
| `closing`(確定時) | **充填値を持たない素のプール文字列** | 追加フィールドを持たず、表示点で `WM_I18N.t(closing)` を1回引く(§21-1 のサブタイトルと同型) |
| 章題 / 記者の見立て / 書きかけの章末 | `G` に入らないUIの静的文 | 同じ表に置き、ui-render.js が `WM_I18N.t(PROLOGUE_TEMPLATES.…)` で引く |

- **UIの静的文もテンプレ表へ入れた**のは、`t()` の引数が非リテラル(`PROLOGUE_TEMPLATES.title`)になり `extract-ui` から見えないため。ui-ledger と template-ledger の二重登録が起きず(§15-3)、序章の文面が1つの表に集まる
- 記者の見立ての2文は**別の `t()` 呼び出しのまま2行に分けて**置く。1キーに畳むとJAの改行(=HTMLの空白1つ)が消えて表示が1バイト変わる
- 発火側(`App.checkPrologueHighlights`)は**完成文を組まず素材(`textParts`)だけを渡す**。初代王者が引けないときの既定ラベル(`初代王者`)にだけ `L` マーカーを付ける(§21-2)
- **`Engine.prologue.firstChampionId` は旧セーブ向けに `text.startsWith(\`${name}が初代王者に\`)` という完成文の前方一致を持つ**(構造規約5の例外)。`text` はJAのまま不変なのでこの経路は壊れない。新しいハイライトは `characterId` を持つので前方一致は旧セーブ専用

### 23-2. 「数値+単位語」は枠(キー)が単位を名乗るかどうかで訳が変わる

§4 が「Stage Bで複数形込みで設計する」として積み残していた族。表示はすべてUI層で `G` には焼かないので、`CHRONICLE_UNIT_TEXTS`(data.js)のテンプレを表示点(`_chronicleUnit`)で引くだけでよい。

- **`<span class="small">` はテンプレ側に置く**。単位語の位置・有無が言語で変わるため(ハイライト行の `<strong>` と同じ理屈・§21-1)
- **ENは充填値で単複・冠詞が変わらない形にする**(黒田英文体 規則23/24)。`{n}期`/`{n}戴冠` のようにタイル側のキー(`ERA RUN` / `TITLES`)が既に英語で単位を名乗っている枠は、**ENでは数値だけを出す**(JAの単位語は英語キーとの重複表示を避けるためのもので、ENでは冗語)。キーが単位を名乗らない枠(競争記録タイルの値・同期カードのメタ行・外敵の成績)は値の側に単位を持たせる: `{n}<span class="small">def.</span>` / `{w}<span class="small">W</span>{l}<span class="small">L</span>` / `reigns: {n}` / `{wins}-{losses}`
- **JAが0の側を省く枠は分岐ごとの完全文にする**(構造規約3)。外敵の成績は `{wins}勝{losses}敗` / `{wins}勝` / `{losses}敗` / `{total}戦` の4本。最後の1本は勝敗が付かなかった枠=全て引き分け(`total = wins+losses+draws`)なので EN は `{total} drawn`
- **`{wins}勝` は ui-ledger に既訳("{wins} wins" = 対抗戦マイルストーンのラベル・5の倍数専用)がある**。ENで採りたい形(`{wins}-0`)が違うので、外敵の4本は**枠(`<div class="chron-rival-record">`)ごとテンプレに入れてキーを分けた**。素のキーにすると二重登録で訳が読み込み順に入れ替わる(§15-3)。逆に `{n}名`(在籍選手数)は既訳 "{n} wrestlers" と意味が同じなので**テンプレ表へ入れず ui-ledger の既存キーを共用する**(`WM_I18N.t('{n}名', …)` を表示点に直書き)

### 23-3. 逆方向の正規表現をやめる — 構造化値を先に持ち、表示時に整形する

`_chronicleCompetitiveValueHtml` は保存済みの完成文(`eraStats.competitiveRecord.valueText`)を `/^(\d+)度防衛(.*)$/` で**読み直して**装飾していた。JA文字列の形に依存する逆方向パターンで、ENでは成立しない。

- `_buildCompetitiveRecord` に**追加フィールド `value`**(`{ kind:'defenses'|'defensesTitleLost'|'winLoss', defenses|wins,losses }`)を持たせる。`valueText`(セーブに書く既存値)は1バイトも変えない
- 表示点は `value` から現在の言語で整形する。`value` を持たない旧セーブだけ従来の逆方向パーサへ fail-open する(JA表示のみ)
- **mode ラベル(`君臨`/`防衛戦`/…)は充填値を持たない素のラベル**なので追加フィールドを持たず表示点で `t()` を1回引く。ただし `陥落` は ui-ledger に既訳("Dethroned")があるため、**JA原文は management.js のトップレベル定数 `_CHRONICLE_MODE_LABEL_JA` に1本だけ置き**(`_AW_ROUND_JA` と同じ流儀・§15-3)、残る5つを ui-ledger へ `kept:true` の手追加行として登録した

### 23-4. 走破が構造的に踏めない画面のための「画面ツアー」(`tour`)

年代記画面は **データベースタブ → 年代記サブタブ → 各章** という自由閲覧画面の奥にあり、走破ハーネスは**ナビタブをランダム走のスコアラーから外す設計**(driver.js `NAVIGATION_TEXT`)なので永久に到達できない。ignite モード(walkモードのナビ巡回は対象外)へ `tour` を足して解いた。

### 23-6. P7-5で新たに見つかった穴(1/2/5は**P7-9で解決**・§26)

1. **✅解決(P7-9)** — **観戦iframeは `lang-en-templates.js` を読み込まない**。`{move} → 3カウント` の訳は template-ledger 側にしか無いため、`battle-engine-main.js` の `_localFormatFinish`(`FINISH_TEXT` のローカル複製)は**テンプレだけENにできない**。P7-5は技名だけ `mv()` で訳しテンプレはJAのまま残した(`t()` に通すと必ず `[i18n-miss]` になる)。→ P7-9で両iframeの `lang-en-names.js` 直後(index.htmlと同じ順序)へ `lang-en-templates.js` を追加して解決
2. **✅解決(P7-9)** — **観戦画面の地の文が丸ごと未配線**。実況ナレーション5型・攻撃矢印の `'攻撃'`/`'カウンター！'`・ギブアップ導入文・`MOVE_PRESENTATION.guide` 13本(6カテゴリ+7上書き)・タッグ勝利オーバーレイの `finType`/`finishPhase` は `t()` を一度も通っていない。技名だけENの混成文になっている。→ P7-9で66キーを台帳化・英訳し配線(§26)
3. **未着手** — **試合ログ行は表示とセーブを兼ねている**。`match-engine.js` が `${mv.n}` を埋めて組む19本のログ文は観戦画面のログパネルに出ると同時に `result.log` として `G` へ永続する。生成時に訳すとセーブが汚れるので、`{type,data}` 化(§2-4)が前提。**P7-9で症状を1つ実測**: タッグの `_narrateFrame` は action を持たないフレーム(タッチ等)で `(fr.logLines||[]).join(' ')` を実況ストリップへそのまま出すため、EN画面の実況に `↔ タッチ(消耗): 阿武隈塔子 → 富岡加奈子` がJAのまま出る。構造化データが無い(タッチは `dramaSummary` に積まれず `pushLog` の文字列だけ)ので、`{type,data}` 化と同時にしか直せない
4. **未着手・ただし前提が誤り(P7-9で訂正)** — `management.js:31053` / `32263` の `else` 分岐は**死コードではない**。条件は `Engine.formatFinish && sr.finMove` なので、**`finMove` が `null` の決着(タイムアウト=`finType:'HP判定'`)で到達する**。到達時の出力はロジックキーそのままの `HP判定` で、`Engine.formatFinish('HP判定', null, …)` が返す `判定勝ち`(EN: "Win by decision")とは別物 — つまり**JA側でも内部キーがそのまま紙面に出る**(feedback「プレイヤー向け表記に内部変数名を使わない」違反)。条件を `Engine.formatFinish` だけにすれば1行で直るが**JA出力が変わる**(`HP判定`→`判定勝ち`)ため ja-golden の採り直しが要る。JA不変を守るP7-9のスコープ外として据え置き、**Keisuke裁定待ち**(直すなら「JAの表示バグ修正」として基準更新)
5. **✅解決(P7-9)** — **`tag-battle-lines.js` の `_tplTagLine` は `dict(str)` だけでPHの値を素通しする**。`{move}` は呼び出し側(`tag-battle-main.js`)で先に `mv()` を掛けて回避したが、同関数の `{winner}`/`{partner}` は依然として生JA名。→ P7-9で `dict(str, vars)` 形へ変更し、呼び出し側の先回り `mv()` も撤去(§26-3)
6. **未着手** — **選手ごとの「得意技」UIは存在しない**。P7設計が挙げていた表示点だが、`.moves` のような選手所有の技リストはコード上に無く(技はスタイルから毎試合抽選される)、`得意技` は紹介文の地の文にしか出ない。記録タブ・ランキング・年代記ハイライトにも決着技は出ない
- `scenarios.js` の `tour.steps[]` = `{ label, selector, expectScreen?, probe?, required? }` を走破の**後**に決定論クリックで巡回する(`driver.js` `runScreenTour`)。各停車点で D1/D3 走査・レイアウト/JA露出集計・点火マーカー観測・`probe` 収集を行う
- **クリックが遮蔽されたら走破と同じスコアラーで安全な前進コントロールを1つ押してから再挑戦する**(最大6回)。週送り直後はポップアップ列が残っていることがあり、ナビを力ずくで押すのではなく実プレイと同じ順序で前進させる
- `tourAssert(probes, lang)` が中身の不発を検出する(「章題が空」「`.chron-wrap` が描画されていない」など)。**`tour.jaExposureScreens` に画面idを並べると、ENモードのときだけその画面のJA露出0が失敗条件になる**(他画面の `JA exposure by screen` は従来どおり情報集計)
- `fixture.maxWeeks` で headless 進行の上限週(既定600=約11季)を引き上げられるようにした。年代記は章の確定に十数季かかる

### 23-5. 「点火シナリオが踏める分岐」と「テンプレの全分岐」は別物

`chronicle` fixture(seed42/S18)は自然生成なので、**外敵の対戦成績・同期カードの戴冠回数・`度防衛`/`王座失陥` の枝には到達しない**(このセーブでは王座戴冠も対外戦も0)。点火シナリオは「実UIで描画が壊れないこと・EN表示に日本語が残らないこと」のゲートであって、**テンプレの網羅は別途VM検品で測る**(§21-5 と同じ分担)。P6-18 は VM検品113件で全35テンプレへ到達し、日本語残り0・i18n-miss 0 を確認した。

### 23-6. P6-18 で新たに見つかった穴(未着手)

1. **`_u3bSideHtml` の二重t()が派閥COMMON3(加入挨拶)にも残っていた**(§10-1と同型)。`ui-common.js` の加入モーダルが `WM_I18N.t(getCommon3Line(...))` で訳した文字列を `lineTranslated` 無しで渡していたため、EN訳文が辞書キーとして引かれて `[i18n-miss]` を12件量産していた。**P6-18で `lineTranslated: true` を付けて根治**(JAは t() が素通しなので二重適用でも表示不変=1バイト不変)。**この型は「呼び出し元が先に訳す共通レンダラ」全部に潜む** — `_u3bSideHtml` の全呼び出し元を一度洗い直すこと
2. **`{n}名`→"{n} wrestlers" / `{wins}勝`→"{wins} wins" は規則23違反**(充填値が1のとき "1 wrestlers")。どちらも P6-18 以前からある ui-ledger の行で、前者は9箇所・後者は5の倍数専用のため実害は限定的だが、規則を機械検査に載せるなら最初に落ちる行
3. **`Engine.chronicle._getSurname` が姓を取れず氏名を返している**。年代記の章タイトルが「木村レイカ世代」のように**フルネーム+世代**になる(章キャッシュの ace/peer は `surname` を持たない縮約オブジェクトのため)。JAの既存挙動なので P6-18 では触っていないが、ENでは "The Reika Kimura Generation" と長くなり h2 の折り返しリスクがある
4. **序章の初代王者フォールバックが「初代王者が初代王者に。」になる**(`ch?.name` が引けないとき)。JAも同じ文になる既存挙動で、実質到達不能(champId が立っている週にその選手がロスターから消えた場合のみ)
## 24. Stage B P6-14 — 殿堂入り語り文のEN化+`*_TEMPLATES`全数突合+不定冠詞の機械検査(2026-09-04追加)

### 24-1. 「連結後の完成文が永続する」族は**表示点で再生成する**

異名(§12-2)は「永続値はJAのまま・表示点で辞書を1回引く」で足りたが、語り文は3文を連結し終えた完成文が保存されるため同じ手が使えない。P6-14で確立した型は次のとおりで、**同型(完成文がGへ焼かれる紙面/記録テキスト)には今後これを使う**。

- **文プールは必ずトップレベルの`const`テーブルへ**。`HOF_BIOGRAPHY_TEMPLATES`(data.js)。関数本体に直書きされた配列は§10-2のとおりどの抽出器からも見えない
- **配列の並び順・要素数は変更不可**。`pick()`が`(entry.id * 31 + seasons) % arr.length`で添字を引くため、並びが変わると**保存済みの語り文と一致しなくなり、表示時再生成がフォールバックへ落ちる**
- **`generateBiography(entry, dict)`**。各文を**PH置換前に**`_wmFillWithDict(dict, tpl, vars)`(§12-3)へ通してから連結する
- **連結様式そのものをテンプレにする**: `join: '{intro}{core}{closing}'` → EN `'{intro} {core} {closing}'`。JAは区切り無しで直結、ENは文間に半角スペースが要る。3文の直積(6×19×3系統)を1本の完全文テンプレへ畳むことはできないため、**様式を1キーにするのが構造規約3(断片連結禁止)を満たす唯一の形**
- **保存するのは常にdict無し(JA)の戻り値**。`_buildHofEntry`はdictを渡さない(D-P6-4)
- **表示点(`ui-render.js: showHofDetail`。grepで消費点は1箇所のみ)は自己検証型のfail-open**:
  1. dict無し(JA)で再生成する
  2. 保存値と**1バイト一致**するか確かめる(=素材が揃っていて、テンプレも保存当時と同一である証拠)
  3. 一致したときだけ`WM_I18N.t`+**英訳済みの異名**(`_epithetLabel()`の戻り値でentryを浅くコピーして差し替える)で作り直した文を出す
  4. 一致しない(旧セーブで素材が欠けている/テンプレが変わった)なら**保存値を優先**する
  - JAモードでは3の結果が1と同一(t()はja素通し+PH置換のみ、`_epithetLabel`もja素通し)なので**日本語版の表示は1バイト不変**
  - **同一性チェックは異名を差し替える前の生JAで行う**。差し替え後で比較するとENモードでは必ず不一致になり、常に保存値フォールバックへ落ちてしまう
- **JA同一性の証明の作法**: ①着手前の実装を凍結コピーとして切り出し、全分岐を代表値・境界値の直積で回して新旧突合(P6-14では606,256通り・不一致0) ②`auto-sim`に`_buildHofEntry`のフックを挿して**実際に生成された殿堂エントリ**を収集し、本物の`src/i18n.js`+生成済み辞書で表示点の手順を再現(P6-14では38件・JA再生成==保存値 38/38、EN日本語残り0・i18n-miss 0)

### 24-2. `*_TEMPLATES`全数突合の結果(§12-5-2の宿題)

data.js/kuroda-text.js/セリフ専用ファイルの**トップレベル`const`を全件列挙して実値を評価**し、3台帳の収録キー+固有名詞辞書(`src/lang-en-names.js`)と突き合わせた。

**A. 「兄弟表は対象なのに本表だけ漏れている」型 — 4件(✅**P6-15で全件解決**、2026-09-04。詳細は§14)**

| 表 | 未収録行数 | 消費点 | 状態 |
|---|---|---|---|
| `UNIFIED_TITLE_TEMPLATES` | 96 | `Engine.newspaper.composeUnifiedTitleArticle(type, data, seed, dict)` | ✅dict-opts化+`join`畳み込み(P6-15) |
| `CHAMPION_CHANGE_TEMPLATES` | 26 | `Engine.newspaper.composeChampionChangeBody(ev, seed, dict)` | ✅dict-opts化+4スロット`champChangeJoin`(P6-15) |
| `PPV_HYPE_TEMPLATES` | 10 | `Engine.ppv.buildHype(match)` → `match.hype`+`hypeTpl`+`hypeVars` | ✅追加フィールド方式(P6-15)。`Math.random()`は据え置き |
| `DRAFT_PLAYER_RESULT_PARTS` | 14 | `Engine.newspaper.composeDraftPlayerResult(org, fighters, seed, dict)` | ✅dict-opts化+`join`/`nameList`畳み込み(P6-15) |

**この4件は台帳へ載せるだけでは無意味**(消費点がdictを持たないので辞書を引く機会が無い)。必要だったのは①composerのdict-opts化 ②断片連結の`join`テンプレ化(§13-1と同型) ③146行の英訳、の3点セットで、P6-15がこれを実施した。

**B. 3台帳・固有名詞辞書のいずれにも載っていない表 — 54表・約1,445行(→ P7-2で7表367行、P7-4で3表250行を解決、残**34表・約816行**)**

Engine/UIが直に読む地の文・ラベルのプール。大物は~~`SNAPSHOT_TEXTS` 276~~(**✅P7-2**) / ~~`CHAR_PROFILES` 127~~(**✅P7-4**。dialogue-tone-spec §5でP5末尾送りと明示済みだった) / ~~`ALL_COACHES`のflavor 125~~(**✅P7-4で112行**。残13＝特殊能力名は`COACH_ABILITY_CATALOG`と同一文字列でP7-1側) / `NOTIF_EVENT_TEXTS` 102 / `LARGE_EVENT_TEXTS` 86 / `STYLE_TAG_MOVES` 82 / `WEEKLY_STORY_TICKER` 65 / `DECISION_DOCS` 63 / `TRAIT_DEFS` 50 / `MILESTONE_EVENTS` 49 / ~~`ATMOSPHERE_TEXTS` 33~~(**✅P7-2**) / ~~`COACH_FLAVOR_DEFS` 11~~(**✅P7-4**)、以下中小の表が続く。

**✅P7-2(2026-09-04)で解決した7表**: `SNAPSHOT_TEXTS` 282 / `ATMOSPHERE_TEXTS` 33 / `FAREWELL_KIND_TEXT` 15 / `LOCKER_AIR_TEXTS` 14 / `CAMP_FLAVOR_TEXTS` 12 / `PRE_WINDOW_TEXTS` 9 / `TEAM_SPIRIT_TEXTS` 8(詳細は§15)。

**✅P7-4(2026-09-04)で解決した3表**: `CHAR_PROFILES` 127 / `ALL_COACHES`の`desc`+`profile`+`origin`+`gender`+`flavor` 112 / `COACH_FLAVOR_DEFS` 11(＋連結様式1)(詳細は§16)。

**⚠ `i18n-miss 0` は「英語化が終わった」の指標ではない。** missは「t()を通ったが辞書に無い」ときにしか出ないので、**そもそもt()を通っていないこの層は永久にmissへ出ない**。進捗はEN走破の「JA exposure by screen」(P6-14時点: screen-week=56 / screen-shachoshitsu=55 / screen-log=51 / screen-show=39 / screen-newspaper=33 …)と本突合表を併読して測る。

### 24-3. プレースホルダ直前の不定冠詞の機械検査(黒田英文体 §3-4 規則25)

`test/i18n-build-dict.js` / `i18n-build-template-dict.js` / `i18n-build-dialogue-dict.js` の3本が同一定義の
`ARTICLE_BEFORE_PLACEHOLDER_RE = /\b(a|an)\s+\{[^}]+\}(?!-)/i` を持ち、違反があれば**exit 1・辞書を生成しない**。

- `a {n}` は充填値が8/11/18のとき"an"が正しくなり、`a {name}` は名前の頭音で割れる
- **ハイフン付きの限定用法(`a {n}-match history` = 規則24の逃がし方)は常に"a"で正しいので許可**する。`}`の直後がハイフンかどうかで機械的に区別する
- 導入時点の既存違反は6件(ui 1 / template 5)。いずれも`{label} offer from {outlet}`(冠詞を落とす) / `a match rated {bestMQ}`(§1-7の固定対訳へ寄せる) / `{playerName}'s matches`(規則26の所有格へ逃がす)の形で書き直した


## 25. Stage B P7-7b — 新聞/ロスター画面のJA露出修正(2026-09-04追加)

P7-7a(§前掲・調査のみ)が分類した根本原因のうち、技名(finishLabel、P7-5裁定待ち)を除く9件を修正した。EN走破のJA露出(`--ja-exposure-log`)は newspaper 28→8(残8件は全て決着技名=finishLabel絡み。技名以外は0)/ roster 25→0。

### 25-1. `NP_KURODA_BYLINE` はgetter化できない — `tools/extract-dialogue.js` TABLE_MANIFEST の落とし穴

黒田署名(`——黒田幸子(週刊グラップル)` 等)を「値そのものをgetterにしてWM_I18N.t()を仕込む」形で直そうとしたところ、`test/archetype-key-rename-test.js` が `ReferenceError: WM_I18N is not defined` で壊れた。原因: `NP_KURODA_BYLINE` は `tools/extract-dialogue.js` の `TABLE_MANIFEST` に `KURODA_HEADLINES`/`KURODA_EDITORIAL` 等と同列で直接登録された「セリフ系テーブル」で、`tools/axis-rewrite.js` の構造走査(`Object.keys(node)` → `node[k]`)が**vm評価サンドボックス(WM_I18Nが存在しない)でプロパティへ実アクセスする**。getterにすると即座に例外化する。

- **教訓**: `TABLE_MANIFEST` に載っているテーブル(`grep NP_KURODA_BYLINE tools/extract-dialogue.js` 等で確認可能)は、値を生JA文字列のまま維持し、**参照側で`WM_I18N.t(TABLE.key)`を呼ぶ**(`kurodaText(entry, d, dict)` と同じ「dictは呼び出し側が持ち込む」流儀)。テーブル自体をi18n化しない
- 5プロパティ×10箇所の参照サイトはすべて `${NP_KURODA_BYLINE.xxx}` → `${WM_I18N.t(NP_KURODA_BYLINE.xxx)}` の機械的な置換で足りた
- 新規3キー(news用/rating用/editorial用の署名文字列)はui-ledgerへ追加。書式は `docs/en-kuroda-style-draft-v0.1.md` §4-3の推奨(`— Sachiko Kuroda, Weekly Grapple` 型、em dash+半角スペース)と `docs/en-proper-nouns-draft-v0.1.md` 付録Bの裁定に合わせた(news/warRecord→`, Weekly Grapple`、rating→`, staff writer`、editorial→`, editorial desk`)

### 25-2. 「headline/MVP小窓は直したのに、同じ選手名が別の`<strong>`で漏れる」— ALL_CHARS直読みが3箇所

MVP小窓(`_npV3MvpBox`)の`fighterName`は直したが、EN走破で再検査すると一面トップ記事の写真キャプション(`<strong>${tsName}</strong>`)にも同じ穴があった。`tsName`は`ALL_CHARS.find(...).name`を`pn()`を通さず直接`join()`していた——3箇所(`_npRenderBignewsTag`/`_npV3Top`相当2箇所)が同型。**「該当関数だけ直して終わり」にせず、同じ変数名(`tsName`)・同じ生成パターンで`grep`し直したことで発見**。合わせてダイジェスト表(`_npRenderDigest`)の`wName`/`lName`も`m.isDraw`分岐でしか`pn()`を通していなかった(引き分け以外の通常勝敗行が漏れる)ことが判明し、同じバッチで根治した。

- **教訓**: 「生名前をpn()に通す」修正は、P7-7aの分類が拾った1箇所だけでなく、**同じ生成元(`ALL_CHARS.find().name`・`m.left.name`/`m.right.name`)を持つ他の表示点をgrepで洗い出す**ことでEN走破の再検証時に0件へ落ちる。1箇所だけ直すと「直したのにEN走破でまだ引っかかる」を繰り返す

### 25-3. `DOJO_SHOUTS`(気合の掛け声26種、実測27種)はUIファイルからdata.jsへ移設して`DATA_TABLES`台帳化

Fable裁定により演出として残さず英訳する方針が確定していたため、`test/i18n-extract-ui.js`の`DATA_TABLES`モード(P7-1で確立)に載せる必要があった。`DATA_TABLES`は`loadAsGlobal('data.js')`でdata.jsのトップレベル宣言だけを対象にするため、**元々`ui-render.js`内のローカル`const`だったものをdata.jsのトップレベルへ移設**した(ブラウザではdata.jsの`<script>`がui-render.jsより先に読み込まれるため、非exportのトップレベル`const`でも後続scriptから参照できる——`TRAIT_DEFS`等の既存表と同じ運用)。乱数抽選の「前回と同じ掛け声を連続させない」比較は生JAのまま行い(`s.dataset.shoutRaw`に保持)、`textContent`へ書く瞬間だけ`WM_I18N.t()`を通す。

- 英訳はFable裁定の「実際にジムで飛ぶ短い掛け声」方針+en-tone-bible §1(感嘆符1つまで・ALL CAPS禁止)に従った27本。効果音的な純粋な気合(はぁっ/ふっ/うぅっ 等13本)は英語の対応語彙が薄いため`Hah!`/`Ngh...!`/`Hup!`型の短い間投詞へ、意味を持つ掛け声(もう一本!/まだまだ!/ラスト! 等14本)は`One more!`/`Not done yet!`/`Last one!`のように直訳した
- **件数の実測訂正**: P7-7aの調査時点の呼称「26種」は配列の目視カウント誤り。`node`で`eval`実測したところ**実際は27種**だった(以後この表を参照するときは27で数える)

### 25-4. `buildFollowUp`の名前配線は既存共通ヘルパー`_wmFillWithDict`への乗り換えで解決(新規実装ゼロ)

消費側(`management.js`)が`dict(pick.headline)`で訳文だけ取ってから手動`fill()`(split/join)で`{name}`等を生値のまま置換していたため、`t()`のparams経由`convertNames`(D-P6-2)を素通りしていた。P6-10で確立済みの共通ヘルパー`_wmFillWithDict(dict, tpl, params)`(`dict(String(tpl), params)`を1回呼ぶだけで翻訳+PH充填+名前自動変換を済ませる)に乗り換えるだけで解決し、新規の翻訳コンテンツもロジックも増えていない。

### 25-5. `決着時間`/`ターン数`の書式はJA固有の数値組み立てなのでlang分岐が要る

`_npTurnsToTime(turns)`は「Xターン=90秒」から`○分○秒`を**文字列組み立てで生成**しており、辞書引き(t())だけでは訳せない型(§2-4「成形済み値」と同族)。EN側は`mm:ss`(コロン区切り・常に秒2桁)を採用した——「24m30s」のような単位語連続よりレイアウト幅を食わない(P6-9/P6-11のEN溢れ対策と同じ配慮)。「決着時間 」「ターン」の直書きラベルは通常のt()化(`決着時間 {time}` → `Time: {time}`、`{n}ターン` → `{n} turns`)で足りた。

### 25-6. 範囲外の新規発見(P7-7bでは修正していない)

- **✅解決(P7-8、2026-09-04)** — **`div.np-show-article`の生JAフォールバック記事**(`ui-render.js` `_npRenderPlayerShow`内、`App._NEWSPAPER_ARTICLES`のプールが空のときのフォールバック文字列組み立て)。数文からなる長文テンプレをt()もpn()も通さず直接組み立てており、technique名だけでなく地の文全体がJAのまま出る。P7-5(技名)より大きい別枠の作業(複数文のテンプレ台帳化)が要るため、P7-7bのスコープ外として記録のみ → **実コールサイトを追ったところ真因はフォールバックではなく本体側だった**(§24)
- **`App._generateNewspaperTexts`のMath.random()非決定性**(P7-7aで指摘済み・据え置き継続。generateHypeと同族の乱数シード原則からの逸脱)

## 26. Stage B P7-9 — 観戦画面(iframe)の地の文層(2026-09-04追加)

§23-6が起票した P7-5 の発見のうち **1(テンプレ辞書未読込)・2(地の文未配線)・5(`_tplTagLine`のPH値素通し)** を解決した。新規訳出は **ui-ledger 66キー**(テンプレ台帳・セリフ台帳は1キーも増えていない)。台帳は ui 4,061→**4,127**、未訳0を維持。

### 26-1. 観戦iframeへ `lang-en-templates.js` を追加した(発見1)

`src/battle-engine.html` / `src/tag-battle.html` の `lang-en-names.js` 直後(index.htmlと同じ順序)に1行追加しただけ。`release/manifest.json` は登録済みで変更不要。これで `_localFormatFinish` が `{move} → 3カウント` 等の**テンプレ側キー**を引けるようになり、技名は `t()` のパラメータ値自動変換(D-P6-2 / P7-5)に任せられる:

```js
if (tmpl) return WM_I18N.t(tmpl, { move: finMove });   // dictで先に訳さない(§19-3/§23-2と同型)
```

**二重登録の禁止(§9)に注意**: `激闘決着` は template-ledger 側にあるキーなので、`WM_I18N.t('激闘決着')` と静的リテラルで書くと `test/i18n-extract-ui.js` が拾って ui-ledger にも同じキーが載り、どちらの訳が出るかが `addDict` の読み込み順に依存する。**変数(`_LOCAL_FINISH_FALLBACK`)経由で渡して抽出器から隠す**のが正しい形。※既存の ui∩(template|dialogue) 重複キーは22件あり(合宿フレーバー6・年代記見出し3・セリフ短句4ほか)、いずれも訳文がほぼ同文のため実害は出ていないが、**同じ穴が増えないよう新規キーでは必ず突合すること**。

### 26-2. 「選択はJA・表示だけEN」を関数の境界で守る(発見2)

P7-5の `_mvDisp`/`_mvFull`(技名)と同じ設計を地の文にも広げた。**`_movePresentation()` は判定層**(JA技名の正規表現で解説文を選ぶ)なので**戻り値の `guide` は日本語のまま**返し、英訳は表示直前の `WM_I18N.t(meta.guide)` が行う。これで `test/ui-walkthrough/spectator-move-i18n-check.js` の「全フレームの `_movePresentation().guide` 列が JA と EN で完全一致」という判定層の機械証明がそのまま生き続ける。

| 層 | 実装 |
|---|---|
| 実況ナレーション(single 6型 / tag 9型) | `WM_I18N.t(テンプレ, { atk, def, move, n })`。**プレースホルダ置換より前にt()**(§9)。名前・技名は値として渡すだけで en ブランチの `convertNames` が名前辞書→技名辞書の順に引く |
| 技の解説文 `guide`(14本ユニーク) | 表示点(`_centerHtml`/`_updateMoveDetail`、tagは`_moveDisplayHtml`)で `t()` |
| 攻撃矢印ラベル | `_mvDisp(move) \|\| WM_I18N.t('攻撃')` / `WM_I18N.t('カウンター！ {move}', { move: _mvDisp(…) })` |
| ピンシーケンス(導入9本+極め技3本+カウント/タップ/ロープブレイク等) | `seq.push()` の**push時点**で `t()`(既存の `damage` ステップと同じ作法。観戦iframeは試合ごとに開き直すので試合中に言語は変わらない) |
| `finType`(フォール/ピン/ギブアップ/TKO/丸め込み/HP判定) | 新設 `_finTypeLabel(finType)`。**`switch` + 静的リテラル**で書くのは `test/i18n-extract-ui.js` が `WM_I18N.t()` の静的第1引数を機械抽出するため(変数を渡すと台帳に載らず kept:true の手追加が要る)。ja では t() が素通しして finType そのものが返る=1バイト不変 |
| `finishPhase` | **変換不要**。`Opening`/`Mid`/`End`/`Climax`/`Timeout` は data.js の `PHASES`/`BIGMATCH_PHASES` の `name` がそのまま流れてくる元から英語の値 |
| 実況ストリップの見出し `実況` | **CSSの `::after { content:'実況' }`** でt()を通せない。§12(P6-11)の `html[lang="en"]` 分岐で `content:'COMMENTARY'` に出し分ける(JA側のセレクタには触れない) |

**プールはトップレベル表へ出した(§10-2の規約)**: `_movePresentation` の if/else連鎖に直書きされていた解説文上書き7本を `MOVE_GUIDE_OVERRIDES`(順序・`cat` 条件つきフォールスルーまで元と同義)へ、`_buildPinCtrl` 内の `INTRO`/`INTRO_NARRATIONS`/`SUB_INTRO` を `PIN_INTRO_TEXTS`/`SUB_ATTEMPT_INTRO_TEXTS` へ。**表の値は日本語原文のまま**で、英訳は表示直前の `t()` が引く。

### 26-3. `_tplTagLine` を `dict(tpl, params)` 形へ(発見5)

`String(T(str)).replace(…)` → `String(T(str, vars)).replace(…)`。これだけで `{winner}`/`{partner}` の生JA名が解決する(`t()` の `convertNames` が名前辞書を引く)。後段の `.replace()` は dict 省略時と params 非対応 dict のフォールバックとして残すので **ja出力は1バイト不変**(`Engine.formatFinish` / `_wmFillWithDict` と同じ二段構え)。呼び出し側 `tag-battle-main.js` が P7-5 で入れていた先回りの `_mvFull(finMove)` は不要になったので撤去した(生JAを渡す形に戻す — §9の「フラグに頼らず生JAを渡す設計に戻す」と同じ判断)。

### 26-4. `test/i18n-extract-ui.js` に **JS_TABLES モード**を追加した

観戦iframeの地の文プールは `pk(pool)` で選ばれてから `t()` に渡る**動的キー**なので、`WM_I18N.t()` の静的第1引数だけを見る `extractJsCalls` には原理的に載らない。P6-8/P6-10 の `LIVE_LINES`・`EMOTION_TEXTS` は `kept:true` の手追加で凌いだが、P7-1 が確立した方針(「kept扱いではなく走査対象として再現可能にする」)に従い、**ソースからトップレベル `const NAME = {…}` / `= […]` の値リテラルだけを切り出して評価する**モードを足した(DATA_TABLES が data.js に対してやっていることの iframe用JS版)。

- ファイル全体は読み込まない(iframeのJSは document/window 依存の副作用を持つ)。波かっこ/角かっこの深さカウントで範囲を切り出し、`new Function('WM_I18N', …)` に **`{ t: s => s }` のスタブだけを与えた孤立スコープ**で評価する(`MOVE_PRESENTATION` の `label` が `WM_I18N.t('打撃技')` を呼ぶため)
- 対象7表(single 4 / tag 3): `MOVE_PRESENTATION.guide` `MOVE_GUIDE_OVERRIDES[].guide` `PIN_INTRO_TEXTS` `SUB_ATTEMPT_INTRO_TEXTS` / `TAG_MOVE_PRESENTATION.guide` `MOVE_GUIDE_OVERRIDES[].guide` `PIN_INTRO_TEXTS`
- 台帳行には `source: ["battle-engine-main.js:PIN_INTRO_TEXTS.tko[0]", …]` が付く(DATA_TABLES と同じ体裁)
- **`_LOCAL_FINISH_TEXT` は対象に入れない** — 同じキーが template-ledger にあるため(§26-1の二重登録禁止)

### 26-5. 死蔵プールの削除

`FINISH_SUSPENSE`(battle-engine-main.js、finishClickボックス表示中の実況プール5種17行)は **`src/` 全体で参照が宣言1箇所のみ**の死蔵だった。「結末ネタバレ防止: 全 attemptType で結末を示唆しない汎用文に統一」(finishClick label を `…！？` へ一本化)した際に消費点が消えたまま残っていたもの。訳出対象を実際に画面へ出るものだけに保つため削除した(§10-2の `KURODA_PREVIEW` と違い、**同じ機能の後継(`PIN_INTRO_TEXTS`)が現役で動いている**ため復活の余地がない)。

### 26-6. 検証: 観戦ハーネスを「地の文まで」拡張した

`test/ui-walkthrough/spectator-move-i18n-check.js`(手動実行)を4点拡張した。

1. **worktreeパス直書きを廃止** — `ROOT` を `path.resolve(__dirname, '..', '..')` に。worktreeを移すたび書き換えが要る状態だった
2. **地の文の採取**: 実況ストリップ(`#narBox`/`#moveNarration`)・解説文(`#moveGuide`)・ビッグ導入(`.big-intro`)・ピンカウント(`.pin-count`)・finishClickラベル(`#finishBtn`)・決着表記。**EN側の全表示文字列に日本語残り0** と **JA側は日本語のまま** を両方見る
3. **ピンシーケンス全分岐のカバレッジ**: 実時間再生では1試合で1分岐しか踏めず決着まで数十秒かかるので、`_buildPinCtrl` を**直接**叩いて TKO / 丸め込み(成功・返し) / ギブアップ(タップ・ロープブレイク) / 極め技脱出 / フォール(3カウント・返し) の全分岐の seq テキストを採取する(single 37行 / tag 32行)。`isCrit:false` 固定でダメージセリフの乱数を混ぜない
4. **`WM_I18N._misses` を直接読む** — `console.warn` を後から差し替える方式ではスクリプト読み込み中に出た miss を取り逃す

**SFX列の突合は「共通接頭」比較に変えた**。JA/ENで到達フレーム数が1つずれることがある(実時間サンプリングのため)。全フレームの決定的な突合は従来どおり `presentSeq`(`[内部技名|解説文|効果音カテゴリ|moveCat]`)が担う。

**試合ログ行の実況ストリップ落ち込み**(§23-6-3)は、`action` を持たないフレームの `logLines` を機械的に集めて**既知の繰り越しとして判定から除外**し、件数と実文を必ず表示する(黙って消さない)。

結果: **ALL CHECKS PASS**(single 20項目 / tag 20項目)。繰り越し1種(`↔ タッチ(消耗): …`)。
## 27. Stage B P6-14 — 殿堂入り語り文のEN化+`*_TEMPLATES`全数突合+不定冠詞の機械検査(2026-09-04追加)

### 27-1. 「連結後の完成文が永続する」族は**表示点で再生成する**

異名(§12-2)は「永続値はJAのまま・表示点で辞書を1回引く」で足りたが、語り文は3文を連結し終えた完成文が保存されるため同じ手が使えない。P6-14で確立した型は次のとおりで、**同型(完成文がGへ焼かれる紙面/記録テキスト)には今後これを使う**。

- **文プールは必ずトップレベルの`const`テーブルへ**。`HOF_BIOGRAPHY_TEMPLATES`(data.js)。関数本体に直書きされた配列は§10-2のとおりどの抽出器からも見えない
- **配列の並び順・要素数は変更不可**。`pick()`が`(entry.id * 31 + seasons) % arr.length`で添字を引くため、並びが変わると**保存済みの語り文と一致しなくなり、表示時再生成がフォールバックへ落ちる**
- **`generateBiography(entry, dict)`**。各文を**PH置換前に**`_wmFillWithDict(dict, tpl, vars)`(§12-3)へ通してから連結する
- **連結様式そのものをテンプレにする**: `join: '{intro}{core}{closing}'` → EN `'{intro} {core} {closing}'`。JAは区切り無しで直結、ENは文間に半角スペースが要る。3文の直積(6×19×3系統)を1本の完全文テンプレへ畳むことはできないため、**様式を1キーにするのが構造規約3(断片連結禁止)を満たす唯一の形**
- **保存するのは常にdict無し(JA)の戻り値**。`_buildHofEntry`はdictを渡さない(D-P6-4)
- **表示点(`ui-render.js: showHofDetail`。grepで消費点は1箇所のみ)は自己検証型のfail-open**:
  1. dict無し(JA)で再生成する
  2. 保存値と**1バイト一致**するか確かめる(=素材が揃っていて、テンプレも保存当時と同一である証拠)
  3. 一致したときだけ`WM_I18N.t`+**英訳済みの異名**(`_epithetLabel()`の戻り値でentryを浅くコピーして差し替える)で作り直した文を出す
  4. 一致しない(旧セーブで素材が欠けている/テンプレが変わった)なら**保存値を優先**する
  - JAモードでは3の結果が1と同一(t()はja素通し+PH置換のみ、`_epithetLabel`もja素通し)なので**日本語版の表示は1バイト不変**
  - **同一性チェックは異名を差し替える前の生JAで行う**。差し替え後で比較するとENモードでは必ず不一致になり、常に保存値フォールバックへ落ちてしまう
- **JA同一性の証明の作法**: ①着手前の実装を凍結コピーとして切り出し、全分岐を代表値・境界値の直積で回して新旧突合(P6-14では606,256通り・不一致0) ②`auto-sim`に`_buildHofEntry`のフックを挿して**実際に生成された殿堂エントリ**を収集し、本物の`src/i18n.js`+生成済み辞書で表示点の手順を再現(P6-14では38件・JA再生成==保存値 38/38、EN日本語残り0・i18n-miss 0)

### 27-2. `*_TEMPLATES`全数突合の結果(§12-5-2の宿題)

data.js/kuroda-text.js/セリフ専用ファイルの**トップレベル`const`を全件列挙して実値を評価**し、3台帳の収録キー+固有名詞辞書(`src/lang-en-names.js`)と突き合わせた。

**A. 「兄弟表は対象なのに本表だけ漏れている」型 — 4件(✅**P6-15で全件解決**、2026-09-04。詳細は§14)**

| 表 | 未収録行数 | 消費点 | 状態 |
|---|---|---|---|
| `UNIFIED_TITLE_TEMPLATES` | 96 | `Engine.newspaper.composeUnifiedTitleArticle(type, data, seed, dict)` | ✅dict-opts化+`join`畳み込み(P6-15) |
| `CHAMPION_CHANGE_TEMPLATES` | 26 | `Engine.newspaper.composeChampionChangeBody(ev, seed, dict)` | ✅dict-opts化+4スロット`champChangeJoin`(P6-15) |
| `PPV_HYPE_TEMPLATES` | 10 | `Engine.ppv.buildHype(match)` → `match.hype`+`hypeTpl`+`hypeVars` | ✅追加フィールド方式(P6-15)。`Math.random()`は据え置き |
| `DRAFT_PLAYER_RESULT_PARTS` | 14 | `Engine.newspaper.composeDraftPlayerResult(org, fighters, seed, dict)` | ✅dict-opts化+`join`/`nameList`畳み込み(P6-15) |

**この4件は台帳へ載せるだけでは無意味**(消費点がdictを持たないので辞書を引く機会が無い)。必要だったのは①composerのdict-opts化 ②断片連結の`join`テンプレ化(§13-1と同型) ③146行の英訳、の3点セットで、P6-15がこれを実施した。

**B. 3台帳・固有名詞辞書のいずれにも載っていない表 — 54表・約1,445行(→ P7-2で7表367行、P7-4で3表250行を解決、残**34表・約816行**)**

Engine/UIが直に読む地の文・ラベルのプール。大物は~~`SNAPSHOT_TEXTS` 276~~(**✅P7-2**) / ~~`CHAR_PROFILES` 127~~(**✅P7-4**。dialogue-tone-spec §5でP5末尾送りと明示済みだった) / ~~`ALL_COACHES`のflavor 125~~(**✅P7-4で112行**。残13＝特殊能力名は`COACH_ABILITY_CATALOG`と同一文字列でP7-1側) / `NOTIF_EVENT_TEXTS` 102 / `LARGE_EVENT_TEXTS` 86 / `STYLE_TAG_MOVES` 82 / `WEEKLY_STORY_TICKER` 65 / `DECISION_DOCS` 63 / `TRAIT_DEFS` 50 / `MILESTONE_EVENTS` 49 / ~~`ATMOSPHERE_TEXTS` 33~~(**✅P7-2**) / ~~`COACH_FLAVOR_DEFS` 11~~(**✅P7-4**)、以下中小の表が続く。

**✅P7-2(2026-09-04)で解決した7表**: `SNAPSHOT_TEXTS` 282 / `ATMOSPHERE_TEXTS` 33 / `FAREWELL_KIND_TEXT` 15 / `LOCKER_AIR_TEXTS` 14 / `CAMP_FLAVOR_TEXTS` 12 / `PRE_WINDOW_TEXTS` 9 / `TEAM_SPIRIT_TEXTS` 8(詳細は§15)。

**✅P7-4(2026-09-04)で解決した3表**: `CHAR_PROFILES` 127 / `ALL_COACHES`の`desc`+`profile`+`origin`+`gender`+`flavor` 112 / `COACH_FLAVOR_DEFS` 11(＋連結様式1)(詳細は§16)。

**⚠ `i18n-miss 0` は「英語化が終わった」の指標ではない。** missは「t()を通ったが辞書に無い」ときにしか出ないので、**そもそもt()を通っていないこの層は永久にmissへ出ない**。進捗はEN走破の「JA exposure by screen」(P6-14時点: screen-week=56 / screen-shachoshitsu=55 / screen-log=51 / screen-show=39 / screen-newspaper=33 …)と本突合表を併読して測る。

### 27-3. プレースホルダ直前の不定冠詞の機械検査(黒田英文体 §3-4 規則25)

`test/i18n-build-dict.js` / `i18n-build-template-dict.js` / `i18n-build-dialogue-dict.js` の3本が同一定義の
`ARTICLE_BEFORE_PLACEHOLDER_RE = /\b(a|an)\s+\{[^}]+\}(?!-)/i` を持ち、違反があれば**exit 1・辞書を生成しない**。

- `a {n}` は充填値が8/11/18のとき"an"が正しくなり、`a {name}` は名前の頭音で割れる
- **ハイフン付きの限定用法(`a {n}-match history` = 規則24の逃がし方)は常に"a"で正しいので許可**する。`}`の直後がハイフンかどうかで機械的に区別する
- 導入時点の既存違反は6件(ui 1 / template 5)。いずれも`{label} offer from {outlet}`(冠詞を落とす) / `a match rated {bestMQ}`(§1-7の固定対訳へ寄せる) / `{playerName}'s matches`(規則26の所有格へ逃がす)の形で書き直した



## 28. Stage B P7-5 — 技名242件の名前辞書化と表示時翻訳(2026-09-04追加)

技名(`commonMoves` 76 / `styleMoves` 83 / `STYLE_TAG_MOVES` ユニーク82 / `getTagMove` の既定値1 = **242件**)を英語化した。表記の正は `docs/en-move-names-draft-v0.1.md`(2026-09-04 Keisuke裁定確定)。

### 28-1. 技名は「名前辞書」の住人。ただし `pn()` とは別領域にする

選手名・会場名と同じく **data由来の「値」** なのでキー一致の `t()` では訳せない(§19-3の会場名と同型)。台帳は `i18n/names-ledger.json` の **`moves` 節**(`[{ ja, en, short?, confirmed }]`)、生成器は既存の `test/i18n-build-names.js`、出力先も `src/lang-en-names.js`。

**しかし `names`(pn/pnSurname)には混ぜない。** 技名の日本語文字列は英語化した後も

| 用途 | 実装 |
|---|---|
| 効果音の種類選択 | `src/battle-sfx.js` `guessCategory(moveName)` の6正規表現 |
| 技の解説文(guide)選択 | `battle-engine-main.js` / `tag-battle-main.js` の `_movePresentation` の7分岐 |
| 同試合内の連続回避 | `data.js` `getTagMove(..., avoidMoveName)` の `m.n !== avoidMoveName` |
| 威力・ティア逆引き | `match-engine.js` `B.findMoveByName(finMove)` |
| セーブ値 | `result.finMove` → `sp.results[]` → `G`(§13-1「永続値は変えない」) |

で**安定キーとして生き続ける**。人名(pn)の守備範囲と混ぜると「どこまで英語にしてよいか」の線が引けなくなるため、専用領域にした。

- `addMoves(map)` / `addMoveShorts(map)`: 登録入口。`addNames`/`addSurnames` の直後に呼ばれる
- `mv(str)`: 技名辞書に完全一致すればEN訳、無ければ原文(fail-open)。ja/pseudoは素通し
- `mvShort(str)`: 狭い枠向け短縮形(19件)。未登録なら `mv(str)` へfail-openするので、呼び出し側は**枠の狭さだけを見て選べばよい**
- **`t()` のパラメータ値自動変換(D-P6-2)は `names` → `moves` の順で引く**。これで `{move}` のようなPHは配線ゼロで英語化される

### 28-2. `Engine.formatFinish` の `{move}` は「値をパラメータで渡す」だけで解ける

P4-2でテンプレ側(`FINISH_TEXT`)だけ `dict` を通していたので、決着文の技名だけJAで残っていた(§13-2-2 と同じ「dict-optsはあるのに使い切れていない」型)。修正は1行:

```js
return prefix + String(T(tmpl, { move: finMove })).replace('{move}', finMove);
```

`dict` に `WM_I18N.t` が渡っていれば en ブランチの `convertNames` が技名辞書を引き当てる。**dict で先に訳そうとしないこと**(§19-3)。後段の `.replace()` は dict 省略時(恒等関数)や params 非対応の dict 向けのフォールバックで、これがあるので**JA出力は1バイト不変**(ja-golden hash `6b3d05c8…` 不変で実証)。先例は `management.js` の `_wmFillWithDict`(`dict(tpl, params)` → `fill` の二段構え)。

これで `formatFinish` を呼ぶ29箇所(興行結果・PPV・派閥・ジュニアトーナメント・春タッグ・秋対抗戦・天頂戦・新聞の `finishLabel`)が**配線ゼロで**英語化された。

### 28-3. 表示点は「判定に使う値」と「画面に出す値」を関数レベルで分ける

観戦画面の `_actionMoveName(action)` は `_movePresentation` の正規表現入力でもあるので**戻り値をそのまま英訳できない**。両iframeに表示専用ヘルパー `_mvDisp()`(=`mvShort`)/`_mvFull()`(=`mv`)を置き、**描画の直前でだけ**通す形にした。

| 枠 | ヘルパー | 理由 |
|---|---|---|
| 技名パネル(`#moveV`/`#moveName`)・攻撃矢印ラベル・ビッグムーブ演出 | `_mvDisp`(短縮形優先) | 最狭は `.move-value` 内寸 約212px ≒ **EN 27字**。27字超の6件+予防的13件に短縮形を用意した |
| 実況ナレーション・ギブアップ導入文・決着ラベル・タッグ勝利オーバーレイ | `_mvFull`(フルEN名) | 折り返しが効く地の文 |

`tag-battle-main.js` の技名パネルは **`WM_I18N.pn()` を呼んでいて訳が出ていなかった**(§13-2-6「pn()とt()の取り違え」の技名版。pn はfail-openなので**サイレントに素通しするだけ**で気づけない)。`mvShort()` へ差し替えた。

### 28-4. 表の外に落ちていた技を表へ戻す

`getTagMove` の関数本体に直書きされていた `{ n: '合体スラム', d: 16, c: 'throw' }` を `STYLE_TAG_MOVES['__default__']` へ移設した(§10-2「3パイプラインいずれからも見えないテーブル」と同型。キーはスタイル名の組 `[a,b].sort().join('+')` と衝突しない形)。**JAの挙動は不変**(唯一の呼び出し元が `.n/.d/.c` を読むだけで、返却オブジェクトを書き換えない)。

`test/i18n-build-names.js` に技名の全数突合検査を足したので、以後 data.js 側で技を足す・改名するとビルドが落ちる:

1. data.js の全技名(既定値を含む)が `moves` 節に存在し、逆に台帳にあって data.js に無い技も無い
2. `moves` 節内で `ja` / `en` がそれぞれ一意(§5-D の英語衝突 — Diving Splash / Top-Rope Splash 等 — の再発防止)
3. `moves` の `ja` が `names` 側と衝突しない(衝突すると `convertNames` が技名を人名として訳す)

なお `data.js` の `module.exports` に `commonMoves` / `styleMoves` / `STYLE_TAG_MOVES` を追加した(この突合のためのnode側公開。ブラウザ側の参照経路は不変)。

### 28-5. 検証: 「英語が判定層へ漏れていない」ことの機械証明

`test/ui-walkthrough/spectator-move-i18n-check.js`(**手動実行**。`run-all` は `*-test.js` しか拾わないので自動実行には入らない)。実試合を1本シミュして観戦iframeへ `START_MATCH` を投げ、JA/EN 両方で走らせて突き合わせる。

- **全フレームの `[_actionMoveName | _movePresentation().guide | guessCategory() | moveCat]` 列が JA と EN で完全一致**(single 23フレーム / tag 24フレーム)。DOMポーリングではなく全フレームを直接走査するのでアニメのタイミングに揺れない(最初はDOMポーリングで書いて、サンプリング位置のずれで3/201件が偽陽性になった)
- `sfx.hit*` を包んだ**効果音呼び出し列も JA/EN 完全一致**
- ENの技名パネル・ビッグムーブに日本語が1文字も無い / JA側は日本語のまま

### 28-6. P7-5で新たに見つかった穴(未着手)

1. **観戦iframeは `lang-en-templates.js` を読み込まない**。`{move} → 3カウント` の訳は template-ledger 側にしか無いため、`battle-engine-main.js` の `_localFormatFinish`(`FINISH_TEXT` のローカル複製)は**テンプレだけENにできない**。今回は技名だけ `mv()` で訳し、テンプレはJAのまま残した(`t()` に通すと必ず `[i18n-miss]` になる)。解くにはiframeへ `lang-en-templates.js` を足すか、当該5キーを ui-ledger へ移す
2. **観戦画面の地の文が丸ごと未配線**。実況ナレーション5型・攻撃矢印の `'攻撃'`/`'カウンター！'`・ギブアップ導入文・`MOVE_PRESENTATION.guide` 13本(6カテゴリ+7上書き)・タッグ勝利オーバーレイの `finType`/`finishPhase` は `t()` を一度も通っていない。技名だけENの混成文になっている
3. **試合ログ行は表示とセーブを兼ねている**。`match-engine.js` が `${mv.n}` を埋めて組む19本のログ文は観戦画面のログパネルに出ると同時に `result.log` として `G` へ永続する。生成時に訳すとセーブが汚れるので、`{type,data}` 化(§2-4)が前提
4. **`management.js:31053` / `32263` の `else` 分岐が生の `finMove` を出す**。ただし条件が `Engine.formatFinish &&` なので `formatFinish` が存在する限り到達しない死コード(§13-2-1型)
5. **`tag-battle-lines.js` の `_tplTagLine` は `dict(str)` だけでPHの値を素通しする**。`{move}` は呼び出し側(`tag-battle-main.js`)で先に `mv()` を掛けて回避したが、同関数の `{winner}`/`{partner}` は依然として生JA名(P7-7b/P6-3ロングテールの領分)
6. **選手ごとの「得意技」UIは存在しない**。P7設計が挙げていた表示点だが、`.moves` のような選手所有の技リストはコード上に無く(技はスタイルから毎試合抽選される)、`得意技` は紹介文の地の文にしか出ない。記録タブ・ランキング・年代記ハイライトにも決着技は出ない

## 29. Stage B P7-10 — 共通レンダラの二重t()全数洗い直し+規則23機械検査+`_getSurname`調査(2026-09-04追加)

P6-18(§23-10-1)が見つけた型を`_u3bSideHtml`の全61呼び出し元と、同系統の共通レンダラ`_mdlASubjectStage`/`_mdlBSoloStage`/`_emrBubbleHtml`/`_chBubbleSlot`/`_pbFighterBlock`/`_awSpeech`系/`_negSpeakerHtml`/`_mdlAFlowPortraitHtml`/`_tcFinalPick`の全消費先まで対象を広げて洗い直した。実バグ9箇所(§10-1と同型)を発見・修正。

### 29-1. `_pbFighterBlock`/`_mdlAFlowPortraitHtml`は§9の`lineTranslated`opt-inパターンが存在しなかった

`_u3bSideHtml`(§9)・`_awSpeech`(§10-1)は最初から`lineTranslated`/`translated`引数を持つ設計だったが、`_pbFighterBlock(side, fighter, stateCls, metaText, dialogueLine)`と`_mdlAFlowPortraitHtml(opts)`は**エスケープ機構そのものが無く**、`dialogueLine`/`o.line`を常に無条件で`WM_I18N.t()`していた。それぞれ`dialogueTranslated`(第6引数)・`o.lineTranslated`を新規追加し、二重t()になっていた呼び出し元へ`true`を配線した:

- `_pbFighterBlock`: 対抗戦勝利プレビュー(`renderWarMatchPreview`)の左右2枠。渡していた`result.victoryLine`は`_getWarVictoryLine()`(§10-1で既に「内部でt()済み」と確立している関数)の戻り値だった
- `_mdlAFlowPortraitHtml`: B2対立決着(`_buildB2Step3`勝者コマ/`_buildB2Step3b`敗者コマ)・B3挑戦状決着(`_buildB3Step3b`/`showB3OpponentAftermath`、いずれも`WM_I18N.t(pickDialogueLine(...) || 'フォールバック文')`型)の計4箇所

他に`_u3bSideHtml`直呼びで2箇所(派閥抗争クラッシュ`_factionF02RenderClash`の左右)・`_snapshotLine`経由(R3別れモーダル`showR3Modal`)・`getSigningQuote`経由(契約セレモニー`showSigningCeremony`)・`_tcFinalPick`経由(天頂戦決勝アフターマス`_showTcFinalAftermath`)の計4箇所も同型で未フラグだった。修正後は`lineTranslated: true`を渡す。

**残り80箇所超はすべて生JA+単一t()の正しい配線**であることをソースまで遡って確認した。生成元がEngine層関数(`pickDialogueLine`/`Engine.negotiate.getDialogue`/`Engine.factions._getF08LineByBand`/`Engine.retirement.selectLine`/`Engine.eventSystem.get*Dialogue`等)であれば必ず生JA(Engineは`WM_I18N`を直接呼ばない設計のため)、UI層のヘルパー(`_awardLine`/`_getWarVictoryLine`/`_snapshotLine`/`getSigningQuote`/`_tcFinalPick`/`Engine.shachoshitsu.getReactionText`)であれば個別に確認が要る、という判別ルールが実務上そのまま使える。

### 29-2. 規則23(黒田英文体§3-4)の機械検査を3本のbuild-dictに追加

`\{[a-z]+\}\s+(wrestlers|wins|losses|defenses|reigns|matches|times|seasons|years|weeks|days|points)\b`(数値プレースホルダ直後の可算名詞複数形)をwarning専用(exit 1にしない)で検出する。ui-ledger 73件/template-ledger 61件/dialogue-ledger 30件=計164件がヒットする現状(大半は「{n} weeks left」のような実際に1になりうる値)。既訳2キー(`{n}名`→`Wrestlers: {n}`、`{wins}勝`→`wins: {wins}`)のみ本バッチで修正し、残りは次の掃討バッチへ。exit 1化の判断はそのバッチで違反一覧を見てから行う。

**→ §35(P7-13)で残存分を全件書き直し、検査をexit 1へ格上げ済み。**

### 29-3. `Engine.chronicle._getSurname`は文字列引数では日本語名を分割できない(未修正・裁定待ち)

```js
_getSurname(arg) {
  if (!arg) return '名無し';
  if (typeof arg === 'object') {
    if (arg.surname) return arg.surname;
    return Engine.chronicle._getSurname(arg.name);
  }
  const parts = String(arg).split(/[\s　]+/);
  return parts[0] || String(arg);
},
```

オブジェクト引数は`.surname`優先、文字列引数は空白区切りの先頭。日本語氏名(`name`)は空白を含まないため、**文字列で呼ぶと氏名全体が返る**。2つの経路が影響する: (1) `_getSurname(ace.name)`のように`.name`を先に取り出してから呼ぶ箇所(`_buildQuoteContext`/`_buildAceNarrativeParts`/`_generateTitleParts`)は`.surname`の有無に関わらずこの経路には入らない、(2) 章キャッシュの縮約ace/peer(management.js約6710〜6742行の`aces:`/`peers:`構築で`id/name/style/...`は複写するが`surname`は複写していない)をオブジェクトのまま渡す箇所(`_getSurname(top)`等)はオブジェクト分岐に入るが`.surname`が無く文字列分岐へフォールスルーする。`state.roster`/`ALL_CHARS`の生キャラクターを直接渡す箇所は`.surname`を持つため正しく動作する。

章タイトル(例:「木村レイカ世代」がフルネーム+世代になる)・叙述文・記者の目の一部が影響を受ける。修正案は(a)縮約キャッシュへ`surname`を追加コピーし呼び出し元をオブジェクト渡しへ統一、(b)`_getSurname`内でALL_CHARS/roster逆引きの補完、のいずれか。**完成文がGへ永続する層のため、JA出力が変わる=Keisuke裁定待ち・本バッチでは不触**。
## 30. Stage B P7-1 — データ表の値層「C. ラベル・短い定義の表」を`DATA_TABLES`モードで台帳化・配線・英訳(2026-09-04追加)

設計はdocs/i18n-stage-b-p7-design-v0.1.md §1-C。§13-2 Bの54表のうち、地の文プール(P7-2/P7-3)・プロフィール文(P7-4)・技名(P7-5)を除いた「ラベル・短い定義の表」13表と、P6-13が積み残した4件(秋対抗戦の団体名ロングテール/fanExpect理由テンプレ/特性バッジ/招聘市場パネルのラベル)を解決した。

### 30-1. `test/i18n-extract-ui.js` に `DATA_TABLES` モードを新設

既存の`test/i18n-extract-templates.js`の汎用再帰ウォーカー(`walkStrings`、値を無差別に拾う)とは別に、**表ごとに専用の抽出器を書く**方式にした。理由: このC分類の表は「オブジェクトのキー自体がラベル」(`TRAIT_DEFS`/`COACH_ABILITY_CATALOG`)・「特定フィールドだけが訳出対象で他は英語enum/数値」(`MILESTONE_EVENTS`/`GLIMPSE_A_THRESHOLDS`/`DECISION_DOCS`)・「値がそのまま訳出対象」(`PROMO_EVENT_NAMES`/`COACHING_TYPE_LABELS`/`COACH_STYLE_MAP`/`STAT_TIPS`/`QUARTER_LABELS`)の3系統が混在し、汎用ウォーカーでは`color`(hex)・`grade`(単一英字)・`cat`(enum)等の非翻訳フィールドまで拾って台帳を汚してしまうため。

- `DATA_TABLES`配列の各エントリは`{ name, extract(table, onEntry) }`。`onEntry(text, tablePath)`で`source:'TABLE.path'`(例: `TRAIT_DEFS.華.desc`、キー自体を拾うときは`TRAIT_DEFS.華.$key`)付きの行を記録する
- 表アクセスは`require()`ではなく`test/helpers/load-game.js`の`loadAsGlobal('data.js')`(vm経由)。`DECISION_DOCS`/`COACHING_TYPE_LABELS`はdata.jsの`module.exports`に載っていない(exportされているのはゲーム内で他ファイルから直接参照される表のみ)ため、requireでは見えない
- 保全マージ(既存en非破壊)は既存のロジックをそのまま使う。**`SPECIAL_EVENT_INTRO`/`DECISION_DOCS`はP6-13が「走査対象外につき手追加」の`kept:true`で登録していたが、DATA_TABLESが両表を対象に加えたことで次回抽出時に自動的に`kept`が外れ`source`が付く**(設計§1-Cの「kept扱いではなく走査対象として再現可能に」を達成)。この移行時、両表に付いていた「走査対象外につき手追加」のnoteは事実と異なるため、`source`が付いた行に限り引き継がない機械判定を追加した

### 30-2. 対象13表・訳出内訳

| 表 | 行数 | 内訳 |
|---|---:|---|
| `TRAIT_DEFS` | 50 | キー25(既存の`en:`フィールドをそのまま採用) + desc25(新規) |
| `MILESTONE_EVENTS` | 51 | title/titleMain/titleSub/narration(文字列 or 配列)/continueLabel/choices[].{label,result,effectLabel} |
| `COACH_ABILITY_CATALOG` | 26 | キー13(新規) + desc13(新規) |
| `SPECIAL_EVENT_INTRO` | 15 | title/travelLine/nextLabel(P6-13で訳出済み・今回は走査対象への昇格のみ) |
| `DECISION_DOCS` | 75 | label/categoryLabel/costLabel/body/detailText/effectSummary/recommendation(P6-13で大半訳出済み。今回`relationship_repair.recommendation`と`encourage.effectSummary`の全角括弧版2件が新規) |
| `PROMO_EVENT_NAMES` | 12 | low/mid/highの3プール×4件 |
| `GLIMPSE_A_THRESHOLDS` | 11 | `.label`のみ |
| `COACHING_TYPE_LABELS` | 5 | 全件新規(非export) |
| `COACH_STYLE_MAP` | 6 | 5件は既存訳(選手スタイル表示と共用)、`ブローラー`のみ新規 |
| `STAT_TIPS` | 5 | 全件新規 |
| `QUARTER_LABELS` | 4 | 全件新規 |
| `SCANDAL_CONFIG.messages` | 3 | 全件新規(§15-4参照。実消費点は現状gameLog専用) |
| `LOSING_STREAK_PENALTIES.msg` | 3 | 全件新規(同上) |

新規訳出170行(台帳の新規キー174件のうち4件はP7-1と無関係の既存drift)。加えて配線中に発見した「表に無いがdata.js外(management.js/app.js/ui-common.js)の関数内リテラル」8+1+6=15件を`kept:true`で手追加(§15-3)。

### 30-3. DATA_TABLESの走査対象外だが配線した3件

1. **`Engine.fanExpect.generate(state, dict)`(management.js)** — ファン期待カード理由文。旧実装は`` `🤝 ${f1.name} vs ${f2.name}の名勝負再現に期待の声` ``のようにJS template literalで選手名を先に埋め込んでいたため、辞書キー(埋め込み前の原文)と一致せず翻訳不能だった(P6-13 §8で「単純なdict-opts化では済まない」と指摘)。`addCandidate(f1, f2, tpl, priority)`のシグネチャを`reason`(完成文)から`tpl`(`{left}`/`{right}`プレースホルダ入りテンプレ)へ変更し、freshness降格時の`.replace('期待の声', ...)`もテンプレ段階(埋め込み前)で行うよう移した。表示点(`ui-render.js`)は`Engine.fanExpect.generate(G, WM_I18N.t)`とdictを渡す。テンプレ7本+freshness降格の差し替え変種1本、計8件を`i18n/ui-ledger.json`へ手追加
2. **`app.js` の`first_rivalry`マイルストーンの動的ナレーション** — `MILESTONE_EVENTS`表の`narration`はbase値が`null`(選手名を後から埋め込むため)。旧実装は選手名埋め込み後の完成文をそのまま`narration`へ入れていたため、`showMilestoneEvent`(ui-common.js)が単純に`WM_I18N.t(evt.narration)`しても翻訳できなかった。`narration`をPH入りの原文のまま保ち、埋め込み値を新設`narrationVars`フィールドへ分離、`showMilestoneEvent`側で`WM_I18N.t(evt.narration, evt.narrationVars)`(訳してから埋める)を行うよう修正。1件を手追加
3. **秋対抗戦(Autumn War、`ui-common.js`)の団体名ロングテール(P6-13 §8の積み残し)** — `_agwTeam(id)?.orgName || ''`型の未`pn()`箇所を全数(約18箇所)`WM_I18N.pn()`配線。共有ヘルパー`_chTeamlineHtml`/`_chOrgBadgeHtml`/`_chOrgEmblemInner`/`_chSubCardHtml`(春季タッグ/JT等でも使われる団体名表示部品)は関数内で`pn()`を1回適用する形にして呼び出し側の重複配線を避けた。同じ画面で見つかった副次的な未配線(`_agwTeamViewState`の状態ラベル`敗退/決勝進出/出番待ち/優勝/対戦中`、`_agwRoleLabel`の役割ラベル`先鋒/中堅/大将/代表`)も合わせて配線・6件を手追加

### 30-4. 発見: gameLogレガシー文字列専用の表は配線不要(§2-4の適用確認)

`SCANDAL_CONFIG.messages`(スキャンダル発生時の見出し)と`LOSING_STREAK_PENALTIES.msg`(連敗ペナルティ通知)は、消費点`Engine.popularity.checkScandal`/`checkLosingStreak`の戻り値`.msg`を全呼び出し元で追跡した結果、**唯一の表示経路が`events.push(...)`→`tickWeek`の戻り値`events`→`G.gameLog`への直接concat**(§2規約4「旧文字列エントリは無変換で共存」)であることを確認した。実際にプレイヤーへ通知される内容(`app.js`の`showNotifEventToast`)は`scandal.msg`を使わず別の固定テンプレ(`📰 {name}のスキャンダルが週刊誌に掲載された！`、既訳済み)を組み立てており、`scandal.msg`自体はgameLog行にしか現れない。したがって**この2表はDATA_TABLESで台帳化・英訳したが、コード側の配線(t()呼び出し)は行っていない**(spec §2-4の仕様どおり、gameLogは意図的にJA固定)。将来gameLogが`{type,data}`形式へ移行する際に訳文を再利用できるよう、台帳には残す。

### 30-5. 検証(P7-1)

`node --check`全触りファイルOK。`node test/ja-golden.js`**完全一致**(hash `6b3d05c8…`、全編集を通じて不変)。`node test/i18n-build-dict.js`台帳4,022キー・未訳4件(すべてP7-1と無関係の既存drift、ui-common.js内のセリフ的文字列でsourceタグなし)。`npm test` **260/260 green**(`stat-notation-backport-test.js`が抽出評価するvmサンドボックスに`WM_I18N`スタブが無く1件red化→スタブ追加で解消、既存47ファイルへの機械追加と同型の対応)。`node test/auto-sim.js 20 42` **ALL CLEAR**、semantic fingerprint `37bbd0cd`(P6-7/8/10/13と同一)。`npm run test:ui:walkthrough` **PASS**、ja digest **`1052faa82eaf7991`不変**。`npm run test:ui:walkthrough:en` **PASS**、i18n-miss **7件で不変**(全てNOTIF_EVENT_TEXTS/LARGE_EVENT_TEXTS由来、P7-3の担当領域で本バッチでは意図的に不触)。JA exposure合計は**186→166**(−11%)。`node test/i18n-ratchet.js`増加なし(28,089不変)。

---

## 31. Stage B P7-12 — ui∩(template|dialogue)重複キー22件の一本化+一致検査新設、観戦ビッグムーブ`.long`判定の言語別化(2026-09-04追加)

P7-9(87a6600)が「新たな発見」として起票した5件のうち3(ui∩(template|dialogue)重複キー22件)・5(`_spawnBigIntro`の`.long`判定16文字固定)を解決した。1(`HP判定`のJAロジックキー露出。JA出力を変える=golden採り直しが要るためKeisuke裁定待ち)・2(タッグの`↔ タッチ`実況行、{type,data}化待ち)は今回のスコープ外として据え置き(2は記録のみ・変更なし)。開始前にworktreeブランチをmain先端(86e4a540、P7-9マージまで)へfast-forward済み。

### 31-1. 重複キー22件の裁き — 所有台帳を1つに決める

`ui-ledger.json`と`template-ledger.json`/`dialogue-ledger.json`の全キーを突合すると、ui∩template 16件・ui∩dialogue 6件=22件が重複していた。内訳を1件ずつコード上で追跡すると2種類に分かれた。

**(a) 所有権の取り違え(12件、すべてtemplate側)**: `data.js:CAMP_FLAVOR_TEXTS`(合宿決裁結果のフレーバー12行、`{name1}が{name2}に技の受け身を教えている場面が見られた`等)。P6-13で`app.js`の消費点(`WM_I18N.t(tmpl, {name1,name2})`、`tmpl`はプールからのランダム選択=動的キー)が「t()を一度も通っていない配線穴」として修正された際、静的抽出できない動的キー向けに`kept:true`でui-ledgerへも手作業複製されたが、その後P7-1でtemplate-ledger側がDATA_TABLESモードでCAMP_FLAVOR_TEXTSを正式に走査対象化したため、ui-ledger側の複製が死んだ重複として残っていた。`grep`で全12キーの原文を`src/`全体から検索し、**data.js(CAMP_FLAVOR_TEXTS)以外に出現箇所が無い**(=ui側の独立したコードは存在しない)ことを1件ずつ確認した上で、template-ledgerへ一本化してui-ledgerから削除した。

**(c) 本物の二重出現(10件)**: UI側のコード自身が独立して`WM_I18N.t('…')`を呼んでおり、たまたまデータ表側の文言と一致しているだけの行。全件`grep`でui-ledger側の呼び出し元を特定し、「防御的フォールバック値」または「たまたま同じ短句を使う独立したUI要素」であることを確認した。

| キー | ui側の実体 | データ表側の実体 | 措置 |
|---|---|---|---|
| `……もう、ついていけない。` | `ui-common.js` F05モーダルの`_factionLine`空返り時フォールバック | `data-faction-dialogue.js:FACTION_F05_DISSIDENT_LINES`(quiet帯の脱退予備軍セリフ) | en を dialogue側の`"...I can't follow anymore."`へ統一(quiet=抑えた諦観のトーンに合わせた) |
| `……わかった` | `ui-common.js` 突発退団モーダルのOKボタンラベル | `CARE_REACTION_DIALOGUES`/`JUNIOR_TOURNAMENT_LINES`/`WAR_DECLINE_DIALOGUE`(複数キャラの短い相槌) | en を dialogue側の`"...All right."`へ統一 |
| `よろしく。` | `ui-common.js` Common-3モーダルの`getCommon3Line`未定義時フォールバック(新加入への**reaction**側=既存メンバーの反応) | `COMMON3_LINES`/`FLAG_DIALOGUE` | en を dialogue側の`"Good to have you."`へ統一(reaction文脈=「よろしく」ではなく「迎える側の一言」と確認したため`"Good to be here."`ではなくこちらを採用) |
| `よろしくお願いします！` | `ui-common.js` `getJoinGreeting`最終フォールバック | `CARE_REACTION_DIALOGUES`/`FIRST_MEET_LINES` | 訳文が最初から一致(`"Looking forward to working with you!"`)。変更なし |
| `友情と闘志、矛盾しない関係` | `ui-render.js` 相関図バッジ`allied_rivalry.desc` | `kuroda-text.js:KURODA_RELATION_NARRATIVE`(新聞の関係性語り) | 訳文が最初から一致。変更なし |
| `合同企画` | `factions.js` Common-7 `planType`未定義時フォールバック(`fevt-subject-org`表示用の短いラベル) | `data.js:COMMON7_LINES._any`(企画名プールの既定値) | en を dialogue側の`"Joint Project"`(Title Case)へ統一(`派閥合同企画`="Joint Faction Project"等、姉妹ラベルの表記と揃える) |
| `拮抗する数字、燃える夜` | `ui-render.js` 相関図バッジ`standard_rivalry.desc` | `kuroda-text.js:KURODA_RELATION_NARRATIVE` | 訳文が最初から一致。変更なし |
| `旗揚げ世代` | `ui-render.js` 年代記画面のセクション見出し(固定文言) | `data.js:CHRONICLE_CHAPTER_TEMPLATES.early`(章タイトル抽選プールの1候補) | 訳文が最初から一致。変更なし |
| `水と油、リングでも楽屋でも` | `ui-render.js` 相関図バッジ`bitter_feud.desc` | `kuroda-text.js:KURODA_RELATION_NARRATIVE` | 訳文が最初から一致。変更なし |
| `派閥合宿` | `app.js`/`factions.js` Common-4のイベントカテゴリラベル/`getCommon4Line`未定義時フォールバック | `data.js:COMMON4_LINES._any[0].headline` | 訳文が最初から一致。変更なし |

**内訳**: 22件 = (a)所有権の取り違え12件(削除) + (c)本物の二重出現10件(維持、うち4件は訳文を統一・6件は既に一致)。

### 31-2. `test/i18n-extract-ui.js`: 他台帳所有キーの自動除外(復活防止)

(a)を手作業でui-ledger.jsonから削るだけでは、再度誰かが同じ動的キーを`kept:true`で複製してしまえば同じ穴が再発する。`loadOtherLedgerOwnedKeys()`を新設し、抽出→保全マージの最終段で「**今回のスキャンでは見つからず**(=前回台帳の`kept:true`だけで生き延びていた行)、かつ**template-ledger.json/dialogue-ledger.jsonのいずれかが非空`en`で同じキーを持っている**」行を`kept`集合から除外するようにした。

- 判定は台帳の`source`/`kept`区分そのもの(=「今回のスキャンで実際に見つかったか」)を使う。**今回のスキャンで見つかった行(=(c)のような本物の二重出現)は無条件で残る** — 除外はあくまで「前回の`kept:true`だけで残っていた行」が対象なので、(c)の10件を誤って消すことはない
- 他台帳側に専用のマーカーは追加していない(既存の`en`列だけで判定できるため)
- 実行結果: `node test/i18n-extract-ui.js`を再実行すると`他台帳所有で除外=12`件(初回)と表示され、ui-ledgerが4,135→**4,123**(−12)になった。**再度実行しても除外0件**(=削除済みキーは動的キーゆえ静的スキャンでは二度と見つからず、復活しない)ことを確認した

### 31-3. `test/i18n-ledger-consistency-test.js`(新設・npm test組み込み)

3台帳(ui-ledger/template-ledger/dialogue-ledger)を読み込み、`en`が非空の同一キーが2台帳以上に存在する行を全て集めて、訳文が食い違っていれば`exit 1`にする回帰ガード。`test/i18n-build-dict.js`への追加ではなく**独立ファイル**にした理由: `i18n-build-dict.js`系(build-dict/build-template-dict/build-dialogue-dict)は`npm test`に組み込まれておらず(`test/*-test.js`の命名規則で`test/run-all.js`が自動discoverする方式のため)、単体ではCIの回帰ガードにならない。ファイル名を`-test.js`サフィックス付きにすることで`npm test`実行時に自動的に含まれる。

- 未訳(`en`が空)の行は対象外(各台帳の`i18n-build-*.js`が別途「未訳0」を検査する担当)
- 実行結果: 現時点で2台帳以上に存在するキーは**15件**(本バッチで裁いた(c)10件 + 既存のtemplate∩dialogue重複5件`……`/`……さよなら、ね`/`…っ…勝った。…みんなのおかげだ`/`…っ…次は、こうはいかない`/`…当然の結果だ`。これらはui-ledgerと無関係でP7-12のスコープ外だが、汎用の3台帳横断チェックのため副次的に検出された)。**全15件が訳文一致**、違反0

### 31-4. `_spawnBigIntro`の`.long`判定を言語別化

シングル/タッグ両観戦iframe(`battle-engine-main.js`/`tag-battle-main.js`)の`_spawnBigIntro(text)`は、決着直前の大きな導入テキスト(`PIN_INTRO_TEXTS`/`SUB_ATTEMPT_INTRO_TEXTS`のプール文、または`{atk}`/`{move}`等のPH入りテンプレ)を画面中央へポップさせる。文字数`>=16`で`.long`クラス(フォントを一段小さく)を付けていたが、この閾値はJA前提で決め打ちされており、EN文はJAより長いため「短文=大きく見せる」という演出意図がENでほぼ崩れていた(EN文がほぼ全て`.long`扱い)。

**実測による閾値算出**: `PIN_INTRO_TEXTS`(fall/pin/tko各3種)+`SUB_ATTEMPT_INTRO_TEXTS`(3種)=計12件の英訳を全数採取したところ、JA文字数は13〜26字(閾値16でJA10件がlong・2件が通常)、対応するEN文字数は28〜61字だった。EN側の閾値を37字にすると、この12件が**1件も食い違わずJAと同じ long/通常の分かれ方**になることを確認した(36字以下2件が通常、37字以上10件がlong)。閾値38(指示書が概算として示した`16×2.4`)では境界上の2件(EN 37字)がJAでlongなのにENで通常になる食い違いが出るため採用せず、37字を採用した。

```js
// JA長: 20 22 13 20 17 14 26 17 21 19 17 18 字 → JA閾値16でlong/通常 = 10件long・2件通常
// EN長: 46 46 28 37 48 36 61 39 50 43 37 49 字 → EN閾値37でlong/通常 = 10件long・2件通常(1件も不一致なし)
const BIG_INTRO_LONG_THRESHOLD_EN = 37;
function _spawnBigIntro(text){
  const isEn = (typeof WM_I18N !== 'undefined' && WM_I18N.lang === 'en');
  const long = String(text).length >= (isEn ? BIG_INTRO_LONG_THRESHOLD_EN : 16);
  ...
}
```

JA側は閾値16のまま1文字も変えていない(1バイト不変)。`{atk}が{def}に{move}をがっちりロック！`のようなPH入りテンプレは、選手名・技名を埋め込んだ**後**の完成文字列に対して長さ判定するため、実際の選手名・技名次第で変動するが、これはJA版でも元から同じ挙動(閾値16でPH埋め込み後の文字列を判定)であり、今回変更していない。

`src/battle-anim.js`には`.long`判定ロジックは存在しない(確認のみ、変更なし)。

### 31-5. `test/ui-walkthrough/spectator-move-i18n-check.js`の拡張

1. **実試合の`.long`発生記録**: `MutationObserver`が捕捉する`.big-intro`要素ごとに`classList.contains('long')`を`rec.bigIntroLong`(`rec.bigIntros`と対の配列)へ記録し、レポート出力に追加した(`ピン導入の.long有無`行)
2. **境界の決定的検査**: 実試合はプールからのランダム選択なので「短文がlongにならない」ことを1回の実行で確実に踏めるとは限らない。そこで`_spawnBigIntro`を合成文字列(閾値-1字/閾値ちょうど)で直接2回呼び出し、`classList`を検査する決定的テストを追加した(`rec.bigIntroBoundary`)。`MutationObserver`は一時的に`disconnect()`して実試合側の`bigIntros`/`bigIntroLong`を汚さないようにし、検査後に生成した2要素は`el.remove()`で即座に片付けてから`observe()`を再開する
3. **受け入れ基準に2件追加**: `JA: .long閾値16の境界が正しい(15字=通常/16字=long)`・`EN: .long閾値37の境界が正しい(36字=通常/37字=long)`。single/tag両方×JA/EN両方で検査(計4箇所)

### 31-6. 検証

`node --check`(battle-engine-main.js/tag-battle-main.js/test/i18n-extract-ui.js/test/i18n-ledger-consistency-test.js/test/ui-walkthrough/spectator-move-i18n-check.js)全OK。`node test/ja-golden.js`基準と**完全一致**(hash`6b3d05c8…`不変)。`node test/i18n-build-dict.js`/`-template-dict`/`-dialogue-dict`/`-names`いずれも**未訳0**(ui 4,135→**4,123**、template 2,958・dialogue 16,674は不変)。`node test/i18n-ledger-consistency-test.js`**green**(15件、訳文食い違い0)。`npm test` **261/261 green**(既存260本+新設1本)。`node test/i18n-ratchet.js`**増加なし**(28,109不変)。`npm run test:ui:walkthrough`(JA) **PASS**(Actions 328、digest**`1052faa82eaf7991`不変**)、Issues 0。`npm run test:ui:walkthrough:en`(EN) **PASS**(Actions 419、digest`ae3f036b2efc97c5`)、Issues 0、i18n-miss 0(1回目のみ年間表彰式コールバック待ちの既知タイミングフレーク`[WM] awards chain callback lost`でD1_CONSOLE 1件が出たが、本バッチの変更範囲外・直後2回の再実行はいずれもクリーン)。`node test/ui-walkthrough/spectator-move-i18n-check.js` **ALL CHECKS PASS**(single 20項目/tag 20項目。新設の`.long`境界検査4項目含む、全てJA`[false,true]`・EN`[false,true]`で一致)。
## 32. Stage B P7-8 — 自団体興行記事(繰り上げ記事)のdict配線とフォールバック本文のテンプレ化(2026-09-04追加)

訳出**9キー**(template-ledger 2,923→**2,929**・未訳0 / ui-ledger 4,061→**4,064**・未訳0 / dialogue-ledgerは不触)。

### 32-1. 「フォールバックがJA」だと思ったら、**本体側がJA**だった

§23-6の起票は「`App._NEWSPAPER_ARTICLES` のプールが空のときのフォールバック文字列組み立て」だったが、EN走破の`--ja-exposure-log`が拾っていた実際の文
(`正直に言えば、メインイベントは物足りなさが残った。…`)は**`_NEWSPAPER_ARTICLES.lowMQ` の正規のプール要素**だった。
真因は `ui-render.js` `_npSwapMainToSecondCard`(一面トップと興行メインが同じ試合になった週に第2試合をメイン枠へ繰り上げる関数)が、
**同じプールを `kurodaText` ではなく素の `fn(promotedCtx)` で呼んでいた**こと。
本体の `App._generateNewspaperTexts` はP4-5で `kurodaText(entry, d, WM_I18N.t)` に配線済みだったのに、
**同じプールの第2の消費点だけが取り残されていた**(§6「UI層からの直接t()配線」の適用漏れ)。

- **教訓**: 露出した文字列を辞書で引いて「どの表の何行目か」を先に確定させる。表が既に訳出済みなら、
  疑うべきはテーブルではなく**その表の消費点が複数ある**こと。`grep <TABLE名>` で消費点を全部数える(§23-2と同じ作法)
- フォールバック(プールが空/例外時)は実際には防御的な到達不能枝だったが、**本体が英語になった今フォールバックだけJAで出る**
  状態(§14-5-4と同型)になるため、同バッチでテンプレ化した

### 32-2. `kurodaText`は未定義プロパティを `"undefined"` として本文へ出す — 既存の try/catch の保険を殺さない

素の `fn(d)` は `d.winner.name` のような未解決パスで**例外を投げ**、呼び出し側の `catch` が空文字にしてフォールバックへ委ねていた。
`kurodaText` は `kurodaEvalPath` が `undefined` を返しても `String(undefined)` を本文へ差し込むだけで**例外にならない**ため、
素直に差し替えると「壊れたときフォールバックへ落ちる」という既存の保険が消え、JA出力が変わる(`undefinedが…`)。

```js
try {
  const raw = fn(promotedCtx);                                   // 従来どおり素で呼んで成否を確かめ
  promotedArticle = raw ? kurodaText(fn, promotedCtx, WM_I18N.t) : raw;  // そのうえで訳出
} catch (e) { promotedArticle = ''; }
```

- `Engine.rng.pick` の位置(try の内/外)は**元のまま動かさない** — 乱数の消費順が変わると出目が変わる
- 同型(`kurodaText`へ後付けで乗り換える消費点)では毎回この「素で呼んで確かめてから訳す」形を使う

### 32-3. 末尾に直結する注記2変種は`{closing}`スロット+**EN訳文側の先頭スペース**

`decisive` 本文の末尾は、元コードでは三項演算子で「王座戦だった」/「敗者も意地を見せた」のどちらかが**空白なしで直結**していた。
§15-2のクラウス規約をそのまま適用し、テンプレは `…紙面に残った。{closing}` のまま、**EN訳文の側が先頭に半角スペースを持つ**。
`closing` は先に `t()` で確定させてから本文の params に載せる(充填済みなので後段の置換で壊れない)。

### 32-4. 同型の掃討 — 主力対決の黒田寸評フォールバック

`grep 'if (!comment)' / 'if (!txt)'` 系で新聞セクションの「プール空振り時の直書きJA」を全数当たったところ、
P4-5が配線した3件(`KURODA_WAR_RECORD` / `KURODA_SPOTLIGHT` / `KURODA_RELATION_NARRATIVE`)の隣に**1件だけ未配線が残っていた**
(`_npMatchupFlavorText` 空振り時の主力対決寸評3分岐)。1〜2文の短文なので、兄弟3件と同じく**インライン`WM_I18N.t()`+ui-ledger**へ寄せた
(数文の地の文である興行記事フォールバックだけを data.js のテンプレ表にする、という置き場の使い分け)。
差し込む `m.role`(`エース`/`主力`/`中堅`)は ui-ledger に既訳のある1語ラベルなので、**値として `WM_I18N.t()` で引き直す**(§14-2 `_wmDictLabel` と同じ流儀)。

### 32-5. JA同一性の証明(27,657通り+128通り・不一致0)

§15-5の作法①(凍結コピーとの全数突合)。`git show <BASE>:src/ui-render.js` から旧 `_npSwapMainToSecondCard` を切り出し、
新旧を同じサンドボックス(ja素通しdict)で回して戻り値オブジェクト全体を `JSON.stringify` で突合した。

- 実プール / **空プール(=フォールバック3分岐を強制)** / `App`なし の3系統 × 選手2組 × 勝敗4種(left/right/draw/勝敗不明) ×
  王座戦2 × MQ 6値 × ターン 4値 × 決着技2 × 観客2値 × 会場2 × season/week 3組 = **27,657通り・不一致0**
- 分岐名つきの読める形でも別途突合(draw/decisive+title/decisive+normal/noWinner × 32ケース = **128通り・不一致0**)
- `npm run test:ui:walkthrough` の **`--action-log` が旧実装と1バイト一致**(151,329 bytes・digest `1052faa82eaf7991`・328 actions)
- **走破のOverflow件数は実行ごとにブレる**(27/29/30/32を実測)。`App._generateNewspaperTexts`のMath.random()由来のノイズで、
  digest(=行動ログ)は安定している。**まれに1手ズレる実行がある**(1回だけ327手 digest `e603d4e2…` を観測。
  同一コードで再実行すると328手・digest一致に戻った)ので、**digestが違ったら再実行して再現するか先に確かめる**こと

### 32-6. P7-8で新たに見つかった穴(未着手)

- **✅解決(P7-14、2026-09-04)** — **`_buildDepthNoteV2` / `_buildLeadSentences`(ui-render.js:4863付近)の生JA組み立て** — ランキング画面(団体紹介パネル)の選手層寸評。
  条件分岐ごとの断片を `[first, second, third].join('')` で連結する型で、t()を一度も通らない。P7-6(ランキング画面)の領分として記録のみ
  → **文そのものはP6-13(`_buildLeadSentences`)とP7-6(`_buildDepthNoteV2`)で既にt()を通っており、残っていたのは「連結の様式」だった**(§32)
- **団体比較号の `d.opportunity` / `actionDescs` 等(management.js:26300付近)** — Engine内の関数に直書きされた紹介文プール(§10-2型)。
  `_npRenderOrgCompare` の紙面に出るが、テーブル化+dict糸通しが要る別枠

---

## 33. Stage B P7-14 — ランキング画面の選手層寸評「連結の様式」のテンプレ化(2026-09-04追加)

### 33-1. 何が残っていたか(P7-8 発見1の実体)

P7-8の「未着手」欄には `_buildDepthNoteV2` / `_buildLeadSentences` が **「t()を一度も通らない生JA組み立て」** として
記録されていたが、実コードを追うと**文そのものは既にt()を通っていた**:

| 関数 | 文プールのt()配線 | 残っていた穴 |
|---|---|---|
| `_buildLeadSentences`(ui-render.js) | P6-13で配線済み(pick→t()→params) | **連結様式** `join('。') + '。'` |
| `_orgContextSentences`(同上) | P6-13で配線済み | 同上(呼び出し元で連結) |
| `_buildDepthNoteV2`(同上) | P7-6で配線済み(PH入りt()+`pnSurname`) | **連結様式** `join('')` |

つまり P7-8 の分類は「断片がJA」ではなく **「断片は訳せているが、断片をつなぐ句読点作法がJA固定」** が正しい。
EN画面での実害は次の2つだった:

1. リード文が `Running away with the top of the industry。The title stays vacant…。` — **全角の「。」がEN紙面に出る**
2. 選手層寸評が `Nothing follows behind Tomioka.Below the second string…` — **文間の半角スペースが無く詰まる**

### 33-2. 直し方(構造規約3「断片連結禁止」の既定形)

断片を連結する族は **連結の様式そのものを1キーのテンプレにする**(P6-14 `HOF_BIOGRAPHY_TEMPLATES.join` /
P6-15 `ARTICLE_COMPOSE_TEMPLATES.join` / P6-16 章クラウスと同型)。本件は
**「句点を持たない文断片」を並べる**新しい型だったので、`ARTICLE_COMPOSE_TEMPLATES` へ2キーを追加した。

| キー | JA | EN | 用途 |
|---|---|---|---|
| `sentenceJoin` | `{a}。{b}` | `{a}. {b}` | 句点を持たない文断片の畳み込み(可変本数) |
| `sentenceEnd` | `{s}。` | `{s}.` | 畳み込んだ本文の末尾に句点を打つ |
| `join`(既存) | `{a}{b}` | `{a} {b}` | **句点を持つ**完成文どうしの連結 |

消費点(`ui-render.js` `renderRanking`)には `_joinSentences`(句点なし断片用)と `_concatParts`(完成文用)の
2ヘルパーを置き、`_JOINT` が取れないときは従来の直書き連結へfail-openする。

- `_buildLeadSentences`: リード3文 → `_joinSentences` / 周辺コンテキスト1〜2文 → `_joinSentences` /
  両者の結合 → `_concatParts`
- `_buildDepthNoteV2`: 各文が句点まで持つ完成文なので `_concatParts` のみ

なお、文プール側の訳文は**この様式を前提に書かれている**(リード/コンテキストのEN 82本はいずれも
末尾に句読点を持たない節、選手層寸評のEN 13本はいずれも末尾に `.` を持つ完成文)。
プールに文を足すときはこの規約を守ること。

### 33-3. JA 1バイト不変の担保

`sentenceJoin`/`sentenceEnd`/`join` のJA値はいずれも従来の直書き連結と同じ字面なので、JA出力は不変。
凍結コピー(変更前HEAD)と新実装を**全分岐の直積**で突合して確認した(不一致0):

- `_buildLeadSentences`: 順位5 × トレンド8 × 王座4 × 人気3 × 戦力層4 × `r`変種27(年間王者歴3×実績3×レガシー2×対戦PT3) × seed24 = **2,488,320件**
- `_buildDepthNoteV2`: ロースター規模9 × OVR基準6 × 傾斜4 × 欠場3 × 若手3 × レンタル2 × readyOvr5 = **19,440件**(相異なるJA出力417種)

### 33-4. 同画面の残り(P7-14で確認)

`renderRanking`(ui-render.js:4426〜5071)の `_build*`/`_org*` 系を機械列挙した結果、**生JAの断片連結は残っていない**。
ただし**呼び出し元のない死蔵ヘルパー**が4つある(出力に出ないためEN露出ではない):

- `_aceFlavorByPersona` — archetype 7分岐 × personality 5分岐の**生JA文プール約30本**(実数28本)。定義のみで参照0 → **✅解決(P7-45・§46)**
- `_isContestedBelt` / `_titleWinCount` / `_hasTrait` — ロジックのみ(セリフなし)。参照0

`_aceFlavorByPersona` は「書いてあるのに出ていない」型なので、**配線して活かすか削るか**をKeisukeの判断で決める
(配線する場合は文プールの台帳化が同時に要る)。P7-14では出力を変えないため無改修。
→ **裁定C-3=①「配線して出す」。P7-45(§46)でエース欄へ1文足し、28本を台帳化・英訳した。**
- **✅解決(P7-11)** — **団体比較号の `d.opportunity` / `actionDescs` 等(management.js:26300付近)** — Engine内の関数に直書きされた紹介文プール(§10-2型)。
  `_npRenderPage2` の紙面に出るが、テーブル化+dict糸通しが要る別枠 → §30

## 34. Stage B P7-11 — 団体比較号(新聞2面)のEngine内直書き紹介文プールのテーブル化・英訳(2026-09-04追加)

訳出**101キー**(template-ledger 2,958→**3,057**・未訳0 / ui-ledger 4,069→**4,071**・未訳0 / dialogue-ledger 16,674 は不触)。
ラチェット総数 28,108→**28,102**(data.js +95 / management.js -101 = 移設と重複解消の差引)。

### 34-1. 「Gへ焼かず、表示のたびにEngineを呼び直す」族は **dict引数** だけで解ける

`Engine.database.getOrgCompareAnalysis(state, orgId)` は消費点が `ui-render.js:_npRenderPage2` の**1箇所だけ**で、
戻り値はGへ一切保存されない(§22-1のプロフィール文と同じ族)。したがって §15-1 の追加フィールドも §18-1 の表示点再生成も要らず、
**第3引数 `dict` を足して、テンプレ参照直後(=PH置換前)に引く**だけでよい(§6のlang糸通し規約)。

- 移設先は data.js のトップレベル7表 `ORG_COMPARE_GRADE_DESCS`(5) / `_AXIS_TEXTS`(20) / `_SUMMARY_TEMPLATES`(7) /
  `_EDITORIAL_TEXTS`(36) / `_TAG_TEMPLATES`(6) / `_ACTION_TEXTS`(20) / `_ORG_TEMPLATES`(2)。加えて `RIVAL_ORGS.desc`(3)
- Engine側の入口は既存の共通ヘルパー2本だけ。**新規実装ゼロ**:
  `T = (tpl, params) => _wmFillWithDict(dict, tpl, params)`(本文) / `L = (ja) => _wmDictLabel(dict, ja)`(値としての1語ラベル)
- `dict` 省略時(auto-sim / ja-golden / 既存テスト / u5安全網)は `_wmFillWithDict` が PH置換だけを行うので**JA出力1バイト不変**

### 34-2. 軸ラベルは「表へ入れず management.js に1本だけ置く」— §15-3 の実運用2例目

`AXIS_META` の4ラベルのうち `TOP5実力` `団体人気` は **ui-ledger に既訳がある**。テンプレ表へ入れると
template-ledger と ui-ledger で同じキーが二重登録になる(§15-3)。そこで:

- **JA原文は management.js の `AXIS_META` に1本だけ置き、5段の文面だけを表から `...ORG_COMPARE_AXIS_TEXTS[ax.key]` で合成する**
- 差し込みは `L()`(=`_wmDictLabel`)で値として引き直す。`summaryText` の `{evenLabel}` と、
  **`leadAxisLabel` / `chaseAxisLabel`**(KURODA_HEADLINES / KURODA_EDITORIAL が `{leadAxisLabel}` として差し込む=§14-2の構造穴)の3箇所
- ui-ledger に無かった `選手層` `TOP5人気` の2件だけ **`kept:true` + note で手追加**した(§10の動的キー手追加と同じ扱い)
- 同型の1語ラベル: `playerSubtitle` の `プレイヤー団体`(ui-ledger/名前辞書の双方に既訳あり)、`matchups[].role`(`エース`/`主力`/`中堅`)。
  role は Engine が返す成形済みJA値なので、**UI側の2つの表示点**(`_npMatchupFlavorText` の `{role}` param と `.np-matchup-vs .role`)で `WM_I18N.t()` を通す

### 34-3. 「JAは全角14字で切る」ような**文字数勘定はlang分岐が要る**

GRADE脇の短評(92px枠)は `d.gradeDesc.slice(0, 14)` で先頭14字だけを出していた。全角前提の目分量なので、
英語に当てると単語の途中で切れる(`Outclassed on every`)。§25-5(`決着時間`/`ターン数`の書式)と同じ型。

- `_npGradeDescShort(desc)`(ui-render.js): **ja/pseudoは従来どおり14字で切り(1バイト不変)、enは切らない**
- EN訳文は台帳側でこの枠に収まる短さ(≦32半角)に揃える。**JAの切り詰めをEN訳文の長さ制約へ翻訳するのが正**

### 34-4. 断片連結の畳み込みと、接続詞の空白規約(§15-2の裏返し)

`summaryText` は「軸の断片2本 + 接続詞」を1文へ連結する型。連結様式を `ORG_COMPARE_SUMMARY_TEMPLATES` の3キー
(`base` / `noPositive` / `noNegative`)へ出し、断片・接続詞・軸ラベルは**先に確定させてから params で差し込む**(§29-3と同じ作法)。

- 接続詞は `{connector}{second}` と**直結**する。§15-2 のクラウスは文の後ろに付くので**先頭**スペースだったが、
  ここは前に付くので **EN訳文の側が末尾に半角スペース**を持つ(`'一方で'` → `'Against that, '`)。JA訳文は持たない
- 軸の5段断片は**末尾に句点を持たない**(テンプレ側の `。` / `.` が付ける)

### 34-5. `HP判定` が紙面に素で出ていた(P7-9の発見・**意図的なJA修正**)

`_buildPpvSummitStory`(頂上決戦の紙面本文)と PPVアンダーカードの2箇所が
`Engine.formatFinish` を **`finMove` があるときだけ**通し、無いときは `finType` を素で出していた。
この else 分岐は死コードではなく、**時間切れ決着**(`finType:'HP判定'` / `finMove` なし)で必ず到達し、
ロジックキー `HP判定` がそのまま日本語の紙面に出ていた。

- 分岐条件を `finMove` の有無から**決着情報の有無**(`finMove || finType`)へ変える。`formatFinish` は
  `finType === 'HP判定'` のとき `FINISH_TEXT` を引いて `判定勝ち` を返すので、ENも同じ dict 経由で既訳に乗る
- `finMove` があるとき / `finType` が表に無いとき / 決着情報が無いときの出力は**すべて従来と同一**(旧実装との突合で確認)
- ja-golden の基準は**動かない**(固定シード20季の corpus に `HP判定` 決着の紙面が1件も無く、ハッシュ不変)

### 34-6. 検証

- **JA同一性**: 凍結コピー(68a17d06)の `getOrgCompareAnalysis` をVMで復元し、
  4軸×9段の差分グリッド(6,561)+団体4種×ロスター/勢い/名前の変種19×縮小グリッド(81)+素のスコア計算12
  = **24,393通り**を、`dict`省略経路と ja素通しdict 経路の**両方**(計48,786比較)で `JSON.stringify` 突合 → **不一致0**
- **EN全分岐スキャン**: 同じ6,561通りを EN 辞書ロード済みの実 `WM_I18N` で回し、
  返却15フィールド(+タグ+アクション)に**日本語が1文字も残らないこと**と **i18n-miss 0件**を機械確認
- ja-golden 完全一致 / npm test 260 PASS / auto-sim 20季 seed42 ALL CLEAR /
  走破 ja PASS(328手・digest `1052faa82eaf7991` 不変)/ EN走破 PASS・i18n-miss 0 維持

### 34-7. 横展開の棚卸し — `Engine.newspaper` にはまだ **83行**の生JAが残る(本バッチ範囲外・**✅P7-16で解消 → §35**)

`Engine.newspaper = { … }`(management.js:31167〜33094)の全行を機械列挙し、
`T(` / `dict` / `_wmNewsStamp` / `injuryLabel` / `fillTemplateVars` のいずれも通らない生JA行を数えた(コメント行・gameLog系は除外)。

| 関数 | 行数 | 中身 |
|---|---|---|
| `generate` | 61 | ジュニアトーナメント結果/全試合詳報/ベストバウト/展望、AI団体の引退・大量退団・殿堂入り・定期興行・ブレイクスルー・確執3分岐・練習中負傷・密着取材、対抗戦2分岐、挑戦状3分岐 の headline/body |
| `eventContenders` | 10 | 注目選手の選出理由(`現王者`/`MVPレース{n}位`/`{label}の優勝経験`/`{n}連勝中`)と `・` 連結 |
| `scanRosterNews` | 4 | `プレイヤー団体`フォールバック×2、`団体記録を塗り替えた。`/`王手をかけた。` |
| `eventPreviewParagraph` | 3 | `本紙が挙げる注目は…` の断片連結 |
| `STYLE_JA` | 2 | スタイル名6種(値としてテンプレへ差し込まれる) |
| `composeHallOfFameRetirement` / `buildTenchosenFieldData` / `intensityBonus` | 3 | `所属団体` / `選考通過者` フォールバックと正規表現内の `怪我`(訳出対象外) |

**83行は本バッチの上限(≦40行)を大きく超えるため、報告のみ**。次バッチの筆頭候補は `generate` の61行で、
うち大半は「AI団体の業界ニュース」= §8 の生キー+render時点再構築が既に効いている枠の**隣**にある直書きなので、
`NEWS_HEADLINE_TEMPLATES` へ寄せるのが素直な形になる。

---

## 35. `Engine.newspaper` の直書きJAをテンプレ化(Stage B P7-16、2026-09-05確定・実装)

§34-7 が起票した83行(再計測で82行)の解消。訳出 **82キー**(template-ledger 3,059→**3,141**・未訳0)。
ラチェット総数 28,053→**28,045**(data.js +82 / management.js −84 = 移設と literal 共有の差引。`--update` 済み)。

### 35-1. 3つの配線方式を出どころで使い分ける

同じ「生JA」でも**どこで文字列が確定するか**で必要な処置が違う。P7-16 は3種類が同居していた。

| # | 出どころ | 方式 | 対象 |
|---|---|---|---|
| A | `generate()` の中(dictが揃っている) | data.js のテンプレ表へ移設 + `_wmFillWithDict` | ジュニアTN / AI団体ニュース / 対抗戦 / 挑戦状 の headline・body |
| B | ui-ledger に既訳がある**1語ラベル** | JA原文を management.js に1本だけ置き `_wmDictLabel` で引く(§15-3) | `現王者` `決勝` `準決勝` `準々決勝` `殿堂入り` `勝者` `決勝の相手` `プレイヤー団体` `STYLE_JA` 6種 と大会名4種 |
| C | `push` 時に完成文が**キューへ焼かれる** | 生キーを併記して**載る瞬間**に再構築(§8) | 事前記事の一段落(`preview`)・`プレイヤー団体` フォールバック |

**Aの実装**: `generate()` の冒頭に `T`(=`_wmFillWithDict`)/`L`(=`_wmDictLabel`)の短縮参照と
`NJT`/`NAI`/`NFB`(表の参照)を置き、以降の `stories.push` がそれを使う。
Engine から `WM_I18N` は呼ばない(§2-1)——`dict` は `generate(state, rng, { dict })` の糸通しのまま。

新規テーブル(いずれも `test/i18n-extract-templates.js` の `TARGET_TABLES` へ登録):

| テーブル | 行数 | 中身 |
|---|---:|---|
| `NEWS_CONTENDER_TEXTS` | 12 | 優勝候補の選出理由7種 + 連結様式 + 事前記事の一段落3本 |
| `NEWS_JUNIOR_TOURNAMENT_TEXTS` | 25 | ジュニアTNの結果面/特集面(全試合詳報・ベストバウト・準決勝敗退者)/前週プレビュー面(出場選手決定・黒田記者の展望) |
| `NEWS_AI_ORG_TEXTS` | 45 | AI団体の引退・大量退団・殿堂入り・定期興行・ブレイクスルー・確執3分岐・練習中負傷・密着取材2種・対抗戦2分岐・挑戦状3分岐 |
| `NEWS_FALLBACK_TEMPLATES`(既存表へ追加) | +3 | `所属団体` / `選考通過者` / `定期興行開催` の「値が無いときだけ出る」フォールバック |

### 35-2. `STYLE_JA` は**既に配線済みだった**(棚卸しの数え方の限界)

§34-7 が数えた2行は `Engine.newspaper.STYLE_JA` の**表の宣言そのもの**で、
消費点(`composeChampionChangeBody` / `composeUnifiedTitleArticle`)は P6-15 の時点で
`_wmDictLabel(dict, ev.styleJa)` を通していた。産出側4箇所(`titleChange` / `_newsChampionChange` /
`unifiedTitle*` 2種)が `styleJa` をJA完成値でキューへ焼いても、**載る瞬間に1語ラベルとして引き直す**
形になっているため EN でJAは出ない。**無改修**。
同様に `intensityBonus` の `/[Ii]njury|怪我/` はイベント種別を判定する正規表現で、表示文字列ではない。

→ **「生JA行の機械カウント」は上限の目安にはなるが、そのうち何行が実際にEN画面へ出るかとは一致しない。**
表の宣言(JAが正本の場所)と判定用リテラルは残るのが正しい姿。

### 35-3. 事前記事の一段落は「生キー+render時点再構築」が要る唯一の族

`eventPreviewParagraph(state, ids)` が返す完成文は
`springTagAnnounce` / `autumnWarAnnounce` / `tenchosenAnnounce` / `tenchosenFieldSet` の
`data.preview` へ**焼かれてキューに数週間滞留する**(§8 の典型)。

- `eventContenders` は `reason`(完成文)に加えて **`reasonRaw`**(`{k:'mvpRank', rank:2}` 等の生キー配列)を返す
- `eventPreviewParagraphRaw(state, ids)` を新設し、`{ picks:[{name,orgName,reasonRaw}], rematch }` を返す
- push 側は `preview`(旧セーブ互換の完成文)と **`previewRaw`(追加フィールド)** を**併記**する
- `_wmResolvePreviewParagraph`(`_wmResolvePreformattedIndustryData` の前段)が
  `previewRaw` があれば `_composePreviewParagraph(raw, dict)` で組み直す。無ければ焼かれた値のまま(fail-open)

`プレイヤー団体` も同型。`scanRosterNews` は dict を持たない深い tickWeek から押すので、
**値ではなく `*Missing` フラグ**(`orgNameMissing` / `orgMissing` / `fromOrgMissing` / `toOrgMissing`)を
`data` へ併記し、`_wmResolvePlayerOrgFallback` が載る瞬間に `_wmDictLabel` で引き直す。
`retirementDeclare` は `NEWS_HEADLINE_TEMPLATES` を通らない専用分岐なので、
その枝でも `_wmResolvePreformattedIndustryData(ev, dict)` を明示的に通すよう変えた。

### 35-4. 連結様式は既存キーへ寄せる(新しい区切りを発明しない)

- 選出理由の `・` 連結 → `NEWS_CONTENDER_TEXTS.reasonJoin`(`{a}・{b}` → `{a}, {b}`。
  `CHRONICLE_NARRATIVE_TEMPLATES` の同一キーと訳文一致・consistency-test で担保)
- 注目選手の列挙・退団者の列挙・準決勝敗退者の列挙 → `Engine.newspaper.joinNameList`(`ARTICLE_COMPOSE_TEMPLATES.nameList`)
- 事前記事の「一段落+注目カード」/ 黒田の展望3文 → `ARTICLE_COMPOSE_TEMPLATES.join`(JA=直結 / EN=半角スペース)
- 殿堂入りの実績列挙 → `NEWS_AI_ORG_TEXTS.hofStatsJoin`(同じく `{a}・{b}`)
- MQ帯の締め(`歴史に残る名勝負！` / `好勝負を展開。`)は本文末に**直結**するので、
  §15-2 のクラウスと同じく **EN訳文が先頭に半角スペース**を持つ。テンプレ側は `{mq}。{tone}` / `{mq}.{tone}` のまま
- 確執のリング決着トーン(`名勝負となった一戦は`)は逆に**後続へ直結**するので **EN訳文が末尾に半角スペース**を持つ(§34-4 の裏返し)

### 35-5. 英訳で避けた形(検査に落ちる書き方)

- **`{seasons} seasons` / `{weeks} weeks`** は規則23(PH直後の可算名詞複数形)に当たる。
  ハイフン限定用法へ逃がした(`a {seasons}-season run` / `a {weeks}-week layoff`)。
  `a {ph}-` は規則25(PH直前の不定冠詞)の**ハイフン例外**なので両方を同時に満たす
- 「複数シーズン」の `複数` は上のハイフンスロットに入るため **`multi`**(→ `a multi-season run`)とした
- **`{count}度目`** の序数化(`3th`)は破綻するので、序数を使わず `match {count} between them` へ逃がした
- **`伝説的キャリア`** は黒田禁止語 `legendary` に落ちるため `a place among the greats` へ。
  `★★★レジェンド` の `Legend`(階級名)は禁止語リストに当たらず、ui-ledger の `★★ ゴールド殿堂`→`★★ Gold Hall of Fame` と表記を揃えた
- 動詞の `wins` も規則23の正規表現に当たる(false positive)ため、新規行では `takes it` を使い
  **警告件数を増やしていない**(build-template-dict の警告は 61件のまま=P7-16 前と同数)

### 35-6. 検証

| 検査 | 結果 |
|---|---|
| `node --check`(data.js / management.js / lang-en-templates.js / i18n-extract-templates.js / injury-label-test.js) | ✅ 全OK(+ template-ledger.json のJSON妥当性・抽出器の再実行で台帳がバイト一致) |
| `node test/ja-golden.js`(`--update`不使用) | ✅ 完全一致(lines=11233, hash=`6b3d05c8…` 不変) |
| `node test/i18n-build-template-dict.js` | ✅ 3,141キー(+82)・**未訳0** |
| `node test/i18n-build-dict.js` | ✅ 4,243キー・未訳0(ui-ledgerは不触) |
| `node test/i18n-ledger-consistency-test.js` | ✅ 2台帳以上に存在するキー15件・すべて訳文一致 |
| `npm test` | ✅ **261/261 green**(`injury-label-test` §6 の検査先をテンプレ表へ付け替え) |
| `node test/i18n-ratchet.js --update` | data.js +82 / management.js −84 / 総数 −8(理由=関数内直書きの表移設+literal共有) |
| `node test/auto-sim.js 20 42` | ✅ **ALL CLEAR**(台帳検査3種すべて違反0)。指紋 f5c3ee76→464f6941 は**追加6フィールドのみで説明**(下記) |
| `npm run test:ui:walkthrough`(JA) | ✅ PASS・328手・digest `1052faa82eaf7991` **不変**・Issues 0 |
| `npm run test:ui:walkthrough:en`(EN) | ✅ PASS・416手・**i18n-miss 0**・Issues 0・**JA露出by screen に `screen-newspaper` は出ない** |
| `npm run test:ui:ignite -- --scenario tenchosen` | ✅ PASS(`unified-coronation` 点火・Issues 0) |
| VM全分岐突合(JA同一性) | ✅ **8,880通り / 不一致0** |

**auto-sim 指紋の説明**: 指紋は最終 `G` 全体を hash するので、`previewRaw` / `reasonRaw` /
`orgNameMissing` / `orgMissing` / `fromOrgMissing` / `toOrgMissing` の**追加フィールドが載るだけで変わる**。
`JSON.stringify` の replacer でこの6キーだけを除外して同条件で走らせると
**`f5c3ee76`**(=P7-11 が記録した20季 seed42 の値)に**完全一致**した。
=既存のセマンティック状態は1バイトも動いていない。

**JA同一性の内訳**(凍結コピー=HEAD `084cd401` をVMへ復元し、同じ合成stateで `JSON.stringify` 突合):

| 対象 | 直積 | 件数 | 不一致 |
|---|---|---:|---:|
| `generate()` 全記事型 | ジュニアTN(tone4×次点有無2×準決勝敗退者有無2×round4) / AI団体13型 / retirementDeclare / preview 4型 / winStreak・longInjury・transferDone(団体名欠落2) | **162** | **0** |
| `eventContenders` + `eventPreviewParagraph` | 王座2×MVP6×人気3×優勝歴4×連勝5×団体名2×対戦歴3 の直積 | **8,640** | **0** |
| `composeHallOfFameRetirement` | 所属3(null/空/実名)×殿堂位3×戴冠2×防衛2 | **36** | **0** |
| `buildTenchosen*Data` | 特別招待0/1/2名 × 2関数 | **6** | **0** |
| 引退記事の**素のフォールバック** | `RETIREMENT_TEMPLATES` を空にして強制到達(実運用では踏めない枝) | **36** | **0** |

### 35-7. 残(P7-16 の範囲外・記録のみ)

1. **ブレイクスルー記事の `{stat}` が内部キー(`pw`/`te` 等)のまま紙面に出る**。
   `_newsBreakthroughs` が `btResult.stat` を生で積み、`generate` がそのまま差し込んでいる。
   同じ `Engine.newspaper` の `buildFollowUp` は `STAT_LABELS_JP[bt.stat]` を通しているので、**AI団体側だけが素通し**。
   feedback「プレイヤー向け表記に内部変数名を使わない」に当たるが、**直すとJA出力が変わる**(golden採り直し)ため据え置き・Keisuke裁定待ち
2. **`_wmNewsStamp` の suffix が文脈に合わない既訳を引く**。`定期興行` → ui-ledger の `Regular shows`(ナビ用の複数形)、
   `挑戦状` → `Challenge Letter`。スタンプは「第N年度・第M週 種別」の見出しなので単数・見出し体が正。§15-3 の副作用で、**P7-16 より前から**同じ
3. `buildTenchosen*Data` の `invites` / `championWatch` は **push時のlangで焼かれる**(dictがpush側に渡っている)。
   `preview` だけ生キー化したので、この2つは §8 未適用のまま(言語を切り替えた週にキューが残っていると旧言語で出る)
## 36. Stage B P7-13 — 規則23(数値PH直後の可算名詞複数形)違反の一掃+検査のexit 1化(2026-09-04追加)

§29-2(P7-10)がwarning専用で検出したまま残っていた規則23違反を全件書き直し、3本のbuild-dict(ui/template/dialogue)の検査を**warningからexit 1へ格上げ**した。ui-ledger 4,243/template-ledger 3,059/dialogue-ledger 16,674、いずれも未訳0・規則23違反0でgreen。

### 36-1. 書き直しの3パターン(黒田英文体 §3-4 規則23/24)

数値プレースホルダの直後に可算名詞の複数形を置く形(`{n} weeks` 等)は、充填値が1のとき単複が食い違う(`1 weeks`)。これを機械検査(規則23)が検出する。逃がし方は3通りで、文脈によって使い分けた:

1. **コロン列挙型** — `{n} weeks` → `Weeks: {n}`。ラベル+値の枠(HUD数値・見出し脇の集計・カード内メタ行)で最も多く使った型。名詞を単数形の「見出し語」として独立させ、PHは値としてのみ置く
2. **ハイフン限定用法(規則24)** — `{n} weeks left` → `a {n}-week absence` / `{defenseCount} defenses` → `a {defenseCount}-defense reign`。地の文・寸評・記事本文など「文として読ませたい」箇所で使用。`}`の直後がハイフンかどうかで規則23の検査自体が機械的に除外する
3. **単位を持たない形** — `{n} matches` → `{n}-match record` のように名詞側を形容詞化して数だけを残す、または`{count} times` → `a {count}-time champion`のように動詞・肩書きへ畳み込む。MVP/PPV/ジュニアトーナメント等の受賞歴テンプレで多用

セリフ層(dialogue-ledger)は上記1(コロン列挙)を使わず、2・3のみで逃がした。地の文としてキャラが喋っている文脈にラベル型を混ぜると声が崩れるため(例: `……ここでの{n}年。` → ラベル化せず `A {n}-year run here.`)。

### 36-2. 誤検知の除外 — 名前・団体名PH+wins/reignsの三人称単数動詞

規則23の正規表現を`/i`(単発マッチ)から`/gi`(全マッチ)へ広げ、プレースホルダ名の大文字を許容(`[a-z]+`→`[a-zA-Z]+`)した結果、`{name} wins`(「{name}が勝つ」)のような**PHが数値ではない**行まで拾うようになった。これは英語の三人称単数現在形の`-s`であって複数形の`-s`ではなく、PHへ何を充填しても文法は崩れない(誤検知)。

`NAME_SUBJECT_VERB_EXEMPT_RE = /^(name|winnerName|championName|championOrg|requesterName)$/i` を定義し、**wins/reignsの2語に限り**このPH名なら検査対象から除外する。棚卸しの結果、ui-ledgerの`{name}勝`系4件・template-ledgerの`{winnerName}勝利`系13件がすべてこの型だった(§35-3参照)。**数値PH+名詞**(`{count} reigns with the belt`等)はこの除外の対象にしない — これは正真正銘の規則23違反のため

### 36-3. 検査ロジック(3本のbuild-dictに同一定義を配置)

```js
const PLURAL_NOUN_AFTER_PLACEHOLDER_RE = /\{([a-zA-Z]+)\}\s+(wrestlers|wins|losses|defenses|reigns|matches|times|seasons|years|weeks|days|points)\b/gi;
const NAME_SUBJECT_VERB_EXEMPT_RE = /^(name|winnerName|championName|championOrg|requesterName)$/i;
```

1行に複数マッチがありうるため`lastIndex = 0`でリセットしてから`while`ループで全マッチを収集し、`wins`/`reigns`かつPH名が除外リストに一致する場合のみ`continue`でスキップする。1件でも本物の違反が残れば`violations`へ積み、**exit 1・辞書ファイルを生成しない**(既存のプレースホルダ完全性/重複キー/日本語残り/不定冠詞(規則25)検査と同じ扱い)。

### 36-4. 検証

- 3本のbuild-dict全て `node test/i18n-build-{dict,template-dict,dialogue-dict}.js` でexit 0・規則23違反0件・未訳0件
- 独立検査(build-dictと同一の正規表現+除外ロジックを別スクリプトで再実装し、現行3台帳を直接スキャン)でも違反0件を確認 — 検査ロジック自体のバグ(false negative)ではないことを担保
- 書き直し対象の154キー(ui 76 / template 47 / dialogue 29 — うち一部は§29-2の164件のカウント方法(旧`/i`単発マッチ・小文字限定PH名)と本検査(`/gi`全マッチ・大小文字PH名+除外ロジック)の差により件数が前後した。旧検査基準で残っていた17件(ui 4/template 13)は棚卸しの結果すべて§35-2の誤検知パターンで、書き直し不要と確定)はすべてプレースホルダ完全性を保ったまま(ja/en の`{}`集合が完全一致)書き直し
- `node test/ja-golden.js` 完全一致 / `node test/i18n-ledger-consistency-test.js` green / `npm test` 全green / `node test/i18n-ratchet.js` / `npm run test:ui:walkthrough` PASS / `npm run test:ui:walkthrough:en` PASS(miss 0)

## 37. Stage B P7-21 — 観戦カットイン `CUTIN_LINES` を `battle-lines.js` へ移設し台帳化・英訳(2026-09-05追加)

### 37-1. 何が穴だったか(§10-2 と同型・ただし原因は「命名」ではなく「置き場所」)

`CUTIN_LINES`(観戦画面のカットイン台詞・`atk`/`climax`/`bigmove` × archetype 7 × personality 7 = **441スロット**)は
**表示点が P5-1 の時点で既に `WM_I18N.t()` に乗っていた**(`_tryPhaseIntroCutin` / `tryRivalryCutin` の
`WM_I18N.t(pk(lines))`)。それでも EN では全行が日本語のまま出ていた。理由は辞書が空だったから:

- `test/i18n-extract-dialogue.js` の `DIALOGUE_FILES` は data.js + **セリフ専用8ファイル**で、
  `battle-engine-main.js` はそこに入っていない
- 命名(`*_LINES`)は自動判定の条件を満たしていたので、**問題は「テーブル名」ではなく「置き場所」**だった
- i18n-miss にも出るはずだったが、観戦 iframe は UI 自動走破が踏まないため気づけなかった
  (P7-20 の全数棚卸しで A分類 #2 として初めて可視化された)

### 37-2. 直し方 — 新しい抽出器は作らず、規約どおりの置き場へ移した

§10-2 の規約「新しいセリフのプールは必ずトップレベルの `const` テーブルへ置き、命名は `*_LINES` に従う」に
**置き場所の条件**が加わる: **観戦系(single/tag 共通)のセリフは `src/battle-lines.js`**。
`battle-lines.js` は既に `DIALOGUE_FILES` に入っているので、表ごと移すだけで抽出器は無改修のまま追随した。

- `src/battle-engine-main.js:44-239`(196行)を `src/battle-lines.js` の末尾へ移設。
  **JA原文・キー順・配列長・配列内の並び順は1文字も変えていない**(`pk()` が引く添字が変わらないように。
  HEAD版と現行版の `CUTIN_LINES` を `JSON.stringify` で突合し完全一致を機械確認済み)
- `battle-engine-main.js` 側は宣言を消して参照のみ(`_getCutinLines` は不変)。
  読み込み順は `battle-engine.html`・`tag-battle.html` とも `battle-lines.js` が本体より先で、
  両 iframe とも解決できる(tag には消費点が無いが、表は読める)
- **抽出器・台帳スキーマ・`EXTRA_INCLUDE` は一切変更していない**。
  cell 判定も `CUTIN_LINES.<section>.<archetype>.<personality>` の兄弟キー集合がそのまま
  archetype/personality 語彙に一致するため、自動判定だけで **49セル**が解決した(手による補正0件)
- `i18n/dialogue-ledger.json` 16,674 → **17,092行**(新規418・既存en変更0・削除0・
  `files` 欄が増えた行15=同一JAが他表にも存在する行)。**未訳0を維持**

### 37-3. ラチェットはファイル間移動として `--update`

`battle-lines.js` 154 → 594(+440)/ `battle-engine-main.js` 530 → 90(−440)。
**総数 28,042・総字数 463,572 はどちらも不変**(差引ゼロの移動)なので、
P5-2p の `kuroda-text.js` ↔ `ui-render.js` と同じ扱いで基準を更新した(増加ではない)。

### 37-4. 検査 — カットインは自然走破では絶対に踏めないので実関数を直接叩く

`test/ui-walkthrough/spectator-move-i18n-check.js`(P7-5新設・P7-9拡張)に (4) として追加した。
カットインは `matchInfo.rivalryTier > 0` かつ確率ゲート(tier別 30/50/80%)を通ったときにしか出ないので、
**実再生に頼らず実関数を直接叩いて決定的に採る**:

- `cutinRawJa` — `_getCutinLines(sec, personality, archetype)` の**戻り値(生JA)**を441スロット分。
  JA/EN 実行で完全一致することを検査する = **選出はJAのまま・英語化は表示直前のt()だけ**の機械証明
  (効果音/解説文の判定層と同じ考え方。§26 と同型)
- `cutinShown` — 各行に `WM_I18N.t()` を通した結果。EN側に日本語残り0 / JA側は日本語のまま
- `cutinDom` — `Math.random` を固定して `_tryPhaseIntroCutin('Climax'|'Mid')` と
  `tryRivalryCutin('atk'|'climax'|'bigmove')` を実際に発火させ、
  `showCutin → BattleAnim.renderCutin` が書いた `#cutinOv .cutin-text` を読む(single のみ)。
  **EN で `「」` が付かない**(§11-2 `_quoteLine` の言語分岐)ことも同時に見る
- `cutinTableLoaded` — tag 側でも `CUTIN_LINES` がグローバルに存在すること(= `battle-lines.js` の
  読み込み順が tag-battle.html でも正しいこと)

### 37-5. 英訳の方針(バイブル適用の要点)

- **カットインは観戦の一瞬**なので吹き出し上限(110字)より短く書いた。実測 **最大69字・中央値30字・平均30.3字**
  (EN/JA文字数比は2.62でP5-2pの2.41より高いが、これは**JA原文が極端に短い**(平均11.6字)ためで、
  絶対長は他バッチの半分以下。指示の目安60字以内をほぼ全行が満たす)
- `atk`(声に出す鼓舞)/`climax`(内心)/`bigmove`(大技の宣言)で**モダリティを分けた**。
  `climax` は全角括弧の内心モノローグなので P5-2p §3 のト書き規約に従い **`... *…*`** 形式
  (先頭の「…」は括弧の外へ出す。`BT_HINT_LINES` の内心行と同じ形)
- 属性=register を全行で守った: ojousama **61行すべて短縮形ゼロ** / cool **56行すべて感嘆符ゼロ・3文以内** /
  delinquent は冠詞主語の省略+`gonna/wanna`、卑語は **hell/damn 計2回のみ**(どちらも delinquent 確定セル)/
  f・sワード0 / ALL CAPS 0 / 英国綴り0 / 禁止定型(`I'll do my best` 等)0
- **`♪` は原文と同数**(5行)。感嘆符も JA にある行だけに置いた(機械検査で全数照合)
- 同じ日本語の骨格が7属性×3セクションで繰り返される表なので、**均質化回避を全数照合で担保**した。
  最終的に **バッチ内EN完全重複0・近似重複(トークンJaccard≥0.90)0・既訳16,674行との完全重複0・近似重複0**
  (検出36件をすべて書き直した)

### 37-6. P7-37 — アーキタイプ跨ぎの同文4組を書き分け(2026-09-05追記)

P7-21 の移設は JA を1文字も変えなかったが、**表の中身には元からアーキタイプ跨ぎの同一JA文が4組あった**
(裁定待ち一覧 A-3 → 2026-09-05 Keisuke 裁定=**①書き分ける**)。P7-37 で **4スロットの JA 原文を意図的に改訂**したので、
§37-2 の「JA原文は1文字も変えていない」は**移設時点の性質**であって、`CUTIN_LINES` の JA を将来にわたり凍結する条件ではない。
改訂したのは各組の**口調から遠い側だけ**で、相方(残す側)は不変:

| 直したセル | 旧JA(=相方と同文) | 新JA | EN | 残した側 |
|---|---|---|---|---|
| `atk.seductive.emotional[0]` | `負けたくないっ…！` | `そんなに…私を怒らせたいのっ…！` | `Mm... you really do want me angry...!` | `atk.standard.emotional[0]` |
| `atk.polite.emotional[1]` | `絶対に…絶対にっ…！` | `もう…もう止まれませんっ…！` | `I can't stop — I can't stop now...!` | `atk.standard.emotional[1]` |
| `atk.standard.shy[3]` | `こ、ここから…ですっ…！` | `つ、次は…わたしの番ですっ…！` | `N-Next... it's my turn...!` | `atk.polite.shy[3]` |
| `bigmove.delinquent.quiet[1]` | `……終わりだ` | `……寝てな` | `...Lights out.` | `bigmove.standard.quiet[2]` |

台帳は 17,092 → **17,096行**(新規4・削除0・既存en変更0・未訳0)。スロット数441・配列長・並び順・キー順は不変なので `pk()` の添字は動かない。
`cell` は同文が消えた3行が `null` → 解決(`負けたくないっ…！`・`絶対に…絶対にっ…！`→standard/emotional、`こ、ここから…ですっ…！`→polite/shy)。

重複検査についての教訓が2つある。

- **`cell:null` の行数は重複の指標にならない**。§37-2 が挙げた「null 5行」に4組目の `……終わりだ` は入っていなかった
  — この行は `data.js:BITTER_RESOLUTION_LINES` / `GLIMPSE_A_LINES` にも同文があり、cell が他表から決まっていたため。
  **重複は表そのものを走査して数える**(セル配列の完全一致と、行単位の一致の両方を見る)
- **同一アーキタイプ内の性格違いの同文は別問題**として据え置いた(4件: `…ここから`=cool.normal/cool.bold、
  `…ここから、だよ`=composed.normal/composed.quiet、`…いく`=atk.cool.normal/bigmove.cool.normal、
  `…全力で、いくね`=atk.composed.earnest/bigmove.composed.earnest)。書き分けるなら「同じ口調の中で性格差をどこまで出すか」という別の判断が要る

### 37-7. `ja-golden` は `CUTIN_LINES` を覆っていない(P7-37で確認)

`test/ja-golden.js` の `loadAsGlobal()` が読むのは victory-lines / data / coach-lines / data-faction-dialogue /
management / match-engine / relationships / flag-dialogue / factions / draft-negotiation の**10本だけで、`src/battle-lines.js` を含まない**。
採取対象も新聞・ティッカー・決着文(`formatFinish`)・興行フレーバー・引退セリフ・デバッグログで、
観戦 iframe(battle-engine.html / tag-battle.html)の描画は冒頭コメントどおり最初からスコープ外。

したがって **カットインの JA を変えても golden は動かない**(P7-37 で4行を改訂したうえで無引数実行し
`OK: 基準と完全一致` を実測。`test/fixtures/ja-golden-baseline.json` は再焼きしていない)。
**逆に言えば、観戦系セリフの JA 回帰は golden では守られない**。守っているのは
`test/ui-walkthrough/spectator-move-i18n-check.js` の `cutinRawJa`(§37-4。選出層の生値を441スロット全数で JA/EN 照合)と
`test/i18n-ratchet.js`(本数)なので、**`battle-lines.js` / `tag-battle-lines.js` を触ったらこの2本を回す**。

## 38. Stage B P7-19 — §35-7の残3件(ブレイクスルー内部キー・スタンプsuffix文脈違い・invites/championWatch言語固定)の解消(2026-09-05追加)

§35-7(P7-16)が記録のみで残した3件をすべて解消。新規訳出2キー(`NEWS_STAMP_SUFFIX_TEXTS`。template-ledger 3,141→**3,143**・未訳0)。ラチェット総数 +8(data.js +2 / management.js +6。理由は下記37-4)。

### 38-1. AI団体ブレイクスルー記事の`{stat}`内部キー露出(意図的なJA修正)

`_newsBreakthroughs`(management.js、AI団体ロスターの練習成長処理)が`btResult.stat`(`pw`/`sp`/`te`/`st`/`mn`の内部キー)を生で積み、`Engine.newspaper.generate`の`aiBreakthrough`分岐がそのまま`{stat}`へ差し込んでいた。同じ`Engine.newspaper.buildFollowUp`(`followUpBreakthrough`)は`STAT_LABELS_JP[bt.stat] || 'メンタル'`でJAラベル化してから`T()`(dict)を通しており、**AI団体側だけが素通し**だった。

`stat: L((typeof STAT_LABELS_JP !== 'undefined' && STAT_LABELS_JP[ev.stat]) || 'メンタル')`(`L`=`_wmDictLabel`)へ変更し、`buildFollowUp`と同じ経路(STAT_LABELS_JPでJAラベル化→ui-ledger既訳の1語ラベルとして引き直す)へ揃えた。`パワー`/`スピード`/`テクニック`/`スタミナ`/`メンタル`はいずれもui-ledgerに既訳(`Power`/`Speed`/`Technique`/`Stamina`/`Mental`)があるため、新規登録・二重登録は発生しない。

**JA出力が変わる意図的な修正**(feedback「プレイヤー向け表記に内部変数名を使わない」に対応)。固定シード20季 seed42 corpusで**53件**の紙面本文が`pw`/`sp`/`te`/`st`/`mn`→`パワー`/`スピード`/`テクニック`/`スタミナ`/`メンタル`に変わることを`node test/ja-golden.js`の全差分ダンプで確認し(差分は全件この型のみ、他の変更は無い)、`--update`した。

### 38-2. `_wmNewsStamp`のsuffixはui-ledgerの1語ラベルをそのまま借りると文脈が壊れる族がある

`_wmNewsStamp(dict, season, week, suffixJa)`は`suffixJa`(`定期興行`/`挑戦状`/`タイトル戦`/`対抗戦`/`PPV GRAND FINAL`)を1語ラベルとして`T()`で引き、日付部分と連結して見出し体のスタンプ(「第N年度・第M週 ○○」)を作る。`定期興行`/`挑戦状`はui-ledgerに既訳があるが、その訳は**別の消費点(ナビタブ・画面見出し)向け**——`定期興行`→`Regular shows`(複数形、タブ名)/`挑戦状`→`Challenge Letter`(見出し語)——で、単数・見出し体が要るスタンプ文脈には合わない。

WM_I18N.t()は「JA原文そのものをキーにする」設計(D1)なので、**同じJA文字列に対して文脈ごとに異なる訳を持たせることはできない**(1つのキーは1つの訳文にしか解決できない)。ui-ledgerの`定期興行`/`挑戦状`を書き換えるとナビ側が壊れ、かといって別のJA原文を発明すると表示文字列が変わってしまう(JA不変の要件に反する)。

解決策は**「スタンプの日付部分{stamp}を差し込み値として持つ、より長い一意なテンプレ文字列」を新しいキーにする**こと。`{stamp} 定期興行`/`{stamp} 挑戦状`という新規テンプレ(`NEWS_STAMP_SUFFIX_TEXTS`、data.js)を切り、`_wmNewsStamp`はこの2つのsuffixだけ`_wmFillWithDict(dict, NST.regularShow, {stamp})`(`挑戦状`は`NST.challenge`)へ迂回させる。

- **JA不変の理由**: `_wmFillWithDict`はja(dict未指定/`WM_I18N.t`のja分岐)のとき`dict(tpl)`がtplを素通しするので、`{stamp} 定期興行`という新キーもJAでは**そのままの文字列**として`fillTemplateVars`へ渡り、`{stamp}`をJAの日付文字列で置換した結果は従来の`` `${stamp} ${T(suffixJa)}` `` と**1バイト一致**する(`{stamp}`は既にJA日付へ解決済みの値として渡すため、テンプレ内の位置も従来の連結順と同じ)
- **ENは新キーを引く**ので、`ui-ledger`の`定期興行`/`挑戦状`とは独立に`Regular show`(単数)/`Challenge`(短縮)を割り当てられる。ナビ側の訳は不変
- `タイトル戦`/`対抗戦`/`PPV GRAND FINAL`は単数・見出し体の既訳(`Title Match`/`Interpromotional Match`/`PPV GRAND FINAL`)がそのままスタンプに合うため、従来どおり`T(suffixJa)`のまま(この2つだけを特別扱いする理由)

### 38-3. `buildTenchosenAnnouncementData`/`buildTenchosenFieldData`のinvites/championWatchへ§8を適用

天頂戦の告知記事(`tenchosenAnnounce`)・エントリー記事(`tenchosenFieldSet`)は`invites`(特別招待者名の列挙 or「選考通過者」フォールバック)と`championWatch`(前回覇者への言及、条件成立時のみ)を**push時点の言語で完成文へ焼いて**`state._industryNewsEvents`へ積む。P7-16が`preview`だけ生キー化していたが、この2つは§8未適用のまま残っていた(§35-7-3)。`preview`と同じ「生キー併記+`_wmResolvePreformattedIndustryData`で載る瞬間に再構築」を適用した。

- **`invitesRaw`**(招待者の生名配列。空配列も「招待者ゼロ」を示す有効値として併記): `_wmResolvePreformattedIndustryData`の`tenchosenFieldSet`ケースが`Array.isArray(data.invitesRaw)`のときだけ再構築する(`invitesRaw.length`で`Engine.newspaper.joinNameList`または`NEWS_FALLBACK_TEMPLATES.tenchosenInvites`フォールバックを載る瞬間に選び直す)。名前は`joinNameList`の畳み込みでdictのparamsを通るため、名前辞書(pn)変換も自動で効く
- **`championWatchRaw`**(`{variant:'announce'|'field', name}`。条件不成立時は`null`): announceとfieldでJA原文が異なる(「4年越しの連覇を期待する声がある」/「出場圏内に入り、連覇への期待が高まる」)ため、`_AW_ROUND_JA`と同じ流儀でJA原文を`_NP_TENCHOSEN_CHAMPION_WATCH_JA = {announce, field}`(management.js)に1本だけ置き、`_wmResolveTenchosenChampionWatch(raw, dict)`が`raw.variant`でテンプレを選んで`_wmFillWithDict(dict, tpl, {name})`で組み直す。`_wmFillWithDict`はparamsをdict経由で渡すため、**選手名のpn()変換もここで初めて効くようになった**(旧実装は`fillTemplateVars(T(tpl), {name})`で名前をT()に通していなかったため、ENでも選手名がJAのまま出る副次バグがあったが、§8方式への統一で解消)
- **生キーの無い旧セーブ**は`invitesRaw`/`championWatchRaw`が`undefined`のままなので、`_wmResolvePreformattedIndustryData`はfail-openで焼かれたJA完成文をそのまま返す(§8の既定動作)
- `championWatch`/`invites`(完成文)自体の計算方法は**変更していない**(旧セーブ互換・JA不変を担保する既存コードそのまま)。Rawフィールドは純粋な追加であり、押し出しではない

### 38-4. ラチェット+8の内訳(すべて正当)

`node test/i18n-scan.js`は「t()を経由するか」を見ずファイル中の全JA文字列リテラルを数えるため、`_wmDictLabel`/`_wmFillWithDict`経由で正しく配線した新規JA定数を足すと機械的に増える(P7-16以前から一貫した挙動)。凍結コピー(HEAD)との文字列多重集合突合で内訳を全数確認した:

| 文字列 | old→new | 説明 |
|---|---|---|
| `メンタル` | 1→2 | `buildFollowUp`の既存フォールバックに次ぐ2件目(37-1のL()引数) |
| `前回覇者の{name}にも、4年越しの連覇を期待する声がある。` | 1→2 | `_NP_TENCHOSEN_CHAMPION_WATCH_JA.announce`として1本追加(push側の既存呼び出しは不変) |
| `前回覇者の{name}も出場圏内に入り、連覇への期待が高まる。` | 1→2 | 同上(`.field`) |
| `定期興行` | 2→3 | `_NP_STAMP_SUFFIX_KEY`のオブジェクトキーとして1本追加 |
| `挑戦状` | 1→2 | 同上 |
| `第{season}年度・第{week}週` | 0→1 | **スキャナの計測アーティファクト**。旧実装はバッククォートテンプレートリテラルの`${...}`内にネストしており、`test/i18n-scan.js`の`scanJS`はテンプレートリテラルの`${}`内部を展開せず1個のスペースへ潰すため文字列として見えなかった。新実装は`const stamp = fillTemplateVars(T('...'), ...)`という独立文に切り出したため可視化されただけで、**実際のt()配線・出力は1バイトも変わっていない**(ja-golden/consistency test で確認済み) |

data.jsの+2は`NEWS_STAMP_SUFFIX_TEXTS`の新規2値。`node test/i18n-ratchet.js --update`済み。

### 38-5. 検証

| 検査 | 結果 |
|---|---|
| `node --check`(data.js / management.js / test/i18n-extract-templates.js) | ✅ 全OK |
| `node test/ja-golden.js`(意図的差分53件を確認後`--update`) | ✅ 差分53件すべて37-1の`{stat}`ラベル化のみ(全差分をダンプして確認)。`--update`後は完全一致 |
| `node test/i18n-build-template-dict.js` | ✅ 3,143キー(+2)・未訳0・規則23警告61件(増減0) |
| `node test/i18n-build-dict.js` | ✅ 4,243キー・未訳0(ui-ledger不触) |
| `node test/i18n-ledger-consistency-test.js` | ✅ 2台帳以上に存在するキー15件・すべて訳文一致(新規重複なし) |
| `npm test` | ✅ **261/261 PASS** |
| `node test/i18n-ratchet.js --update` | data.js +2 / management.js +6(理由は37-4ですべて説明済み) |
| `node test/auto-sim.js 20 42` | ✅ **ALL CLEAR**(台帳検査3種すべて違反0) |
| `npm run test:ui:walkthrough`(JA) | ✅ PASS・328手・digest **`1052faa82eaf7991` 不変**・Issues 0 |
| `npm run test:ui:walkthrough:en`(EN) | ✅ PASS・418手・**i18n-miss 0**・Issues 0・JA露出by screenに`screen-newspaper`は出ない |
| `npm run test:ui:ignite -- --scenario tenchosen`(JA) | ✅ PASS(`unified-coronation`点火・Issues 0) |
| VM検証(実際のWM_I18N+lang-en*.js辞書を読み込んで`Engine.newspaper.generate`/`_wmResolvePreformattedIndustryData`/`_wmNewsStamp`を実行) | ✅ 37-1〜37-3の全ケースで期待どおりのJA/EN出力を確認(下記37-6) |

**発見(範囲外)**: `npm run test:ui:ignite -- --scenario tenchosen --lang en`(このシナリオのEN実行は過去に記録が無い組み合わせ)を試したところ、天頂戦とは無関係な挑戦状パーティ選出画面(`crq-party-cand`)でドライバが停止するD5_WATCHDOGが発生した。天頂戦・新聞コードとは無関係(挑戦状パーティ選出のdriver.js役割スコアリングの問題と推測)なため本バッチでは追わず、別タスクとして起票した。

### 38-6. VM実出力の例(実際のlang-en.js/lang-en-templates.js/lang-en-names.jsを読み込んで確認)

- ブレイクスルー(EN): `Anju Matsukawa of Tencho Pro Wrestling has broken through. Power is up sharply, and what she does next is worth watching.`(stat=pw/te/mnの3種で確認、選手名もpn()でEN化)
- スタンプ(EN): `Year 3, Week 10 Regular show` / `Year 3, Week 10 Challenge`(ナビ既訳`Regular shows`/`Challenge Letter`は不変のまま)
- invites再構築(EN、招待者2名): `Hikari Asahina, Rina Morgan`(JA「朝比奈ひかり、リナ・モーガン」から選手名・区切りともEN化)
- invites再構築(EN、招待者ゼロ): `those who came through selection`(JA「選考通過者」)
- championWatch再構築(EN、announce系): `There is talk that Anju Matsukawa, the previous champion, could win it again after four years.`
- championWatch再構築(EN、field系): `Anju Matsukawa, the previous champion, has also made the field, and hopes for a repeat are rising.`
- 旧セーブ(生キー無し)をENで開いた場合: 焼かれたJA完成文がそのまま出る(fail-open。次にpushされた号からはEN再構築が効く)

## 39. Stage B P7-23 — 新聞4面「年間MVPレース」の地の文システム(285本)のテーブル化・配線・英訳(2026-09-05追加)

`docs/i18n-coverage-report-v0.1.md` A分類 #1(285件/4,924字)。`Engine.mvpRace` の叙述family
(`generateNarrative` / `_traitPhrase` / `generateTagline` / `generatePageHeadline` / `generatePageLead` /
`generateKurodaComment` / `_topElements` / `_roleLabel` / `_seasonLabel` / `_collectFactChips` /
`_composeChaseLine` / `_composeFlavorLine` / `generateRichBlocks`)が、**メソッド本体に直書きされた
配列リテラル**(§10-2「関数の中の配列はどの抽出器からも永久に見えない」型)で文プールを持ち、
`ui-render.js` の4面描画が `${_escapeHtml(entry.narrative)}` で無変換描画していた。

訳出**286キー**(template-ledger 3,143→**3,425**・未訳0。うち4キーは既存の連結様式キーへマージ)。

### 39-1. `G` へ焼かれる完成文だが**素材が `G` に揃っている**族 → §18-1(表示点で再生成)

`recalcRanking` は `narrative` / `tagline` / `pageHeadline` / `pageLead` / `kurodaComment` を
**JA完成文のまま `G.mvpRace` へ焼く**。§15-1(追加フィールド)と §18-1(表示点で再生成)の分かれ目は
「素材が残っているか」で、本族は素材(`state.rngSeed`/`season`/`week`/`roster`/`h2h`/`relationships`/
`snapshots` と `entry.breakdown.meta`)がすべて `G` と保存済み `rankings` に残っている。
そこで §18-1 を採り、**追加フィールドを1つも増やさない**(=`auto-sim` の semantic fingerprint も動かない。
P7-23実測 `640b2591` が着手前と一致)。

- `recalcRanking` は **dictを渡さない** → セーブに書く値は従来どおりJA(D-P6-4)
- 表示点は `ui-render.js` の **`_npMvpI18n(saved, regen)` 1関数に集約**(消費点は6箇所:
  pageHeadline / pageLead / kurodaComment / 1位カードのnarrative / 2-3位カードのnarrative /
  4位以下のtagline)。手順は §18-1 と同一 —
  ①dict無しで再生成 ②保存値と1バイト一致を確認 ③一致したときだけ `WM_I18N.t` を dict として渡した版を出す
  ④不一致(旧セーブ/表の改訂)は保存値をそのまま出す。**保存値を `t()` に通さないこと**
- `generateRichBlocks`(headlineLine / factChips / flavorLine)は**表示のたびに `G` から作り直される**
  (§22-1と同じ型)ので `dict` を渡すだけでよい

**実データ検証**: `test/fixtures/wm_save_real.json`(S6W40)を現エンジンで `recalcRanking` し直した状態で
**再生成==保存値 13/13・fallback 0・i18n-miss 0**。同じfixtureを**そのまま**(旧プールで焼かれた古いセーブ)
使うと13件中9〜11件がフォールバックへ落ち、保存値のJAがそのまま出る — これが④の設計どおりの挙動。

### 39-2. `pick()` の添字は**プールの並び順と要素数**に乗っている

どのプールも `arr[Engine.rng.int(rng, 0, arr.length - 1)]` で引かれる。**data.js へ移設するときに
要素を足す/減らす/並べ替えると同じシードでも出目が変わる**(=JA出力が変わり、§38-1の自己検証も
常にフォールバックへ落ちる)。`MVP_RACE_TEXTS` のコメント冒頭にこの禁止を明記した。

移設で「テンプレを選んでから充填する」形(`fill(pick(pool), vars)`)へ変えているが、
`pick` は引数評価で先に走るため**乱数の消費順は不変**。分岐内で先に組む差し込み句
(`lossClause` / `domeClause` / `head` / `elemText`)は乱数を消費しないので順序に影響しない。

### 39-3. 「1語ラベルは ui-ledger の領分」の実運用(§15-3)が最大規模で効いた

4面は既存UI(メタチップ・ピル・バッジ)と**同じ語彙**を地の文でも使う。次はすべて ui-ledger に既訳があり、
`MVP_RACE_TEXTS` へは入れず **JA原文を management.js に1本だけ置いて `_wmDictLabel(dict, …)` で引く**:

- 役割6種 `エース`/`中堅`/`新人`/`ヒール`/`ベテラン`/`ベビーフェイス`(`_roleLabel`)
- 季4種 `春`/`夏`/`秋`/`冬`(`_seasonLabel`)
- 試合種別 `タイトル戦`/`対抗戦`/`通常興行`
- 実績ラベル `天頂戦優勝`/`PPV優勝`/`4団体勝ち残り対抗戦優勝`/`春のタッグリーグ優勝`/`現王者`/`優勝`/`準優勝`
- 結果 `勝利`/`決着つかず`
- 特性名25種(`_traitPhrase` の汎用フォールバックが差し込む `{trait}`)

`PPV` は日本語を1文字も含まない識別子なので**辞書を通さない**(通すと `logMiss` を汚染する)。

### 39-4. `{age}歳` は「枠込みでキーを分ける」— 同じJAでも文脈が違えば別キーにする

`_traitPhrase` は `早熟` + `25歳` を `早熟の25歳` という名詞句へ組む。`{age}歳` 単体は ui-ledger に
既訳があるが、それは**メタチップ用の "Age {age}"** で、地の文の名詞句には嵌まらない
("Early Bloomer Age 25")。そこで**句ごと1キー**(`早熟の{age}歳` → `an early-blooming {age}-year-old`)
にした。§15-3 の `rivalWinLoss`(枠 `<div>` ごとテンプレにしてキーを分ける)と同じ作法。

同じ理由で `{losses}敗` を単独キーにしていない。ui-ledger の既訳 `Losses: {losses}` は成績欄の
ラベルで、文中の差し込み句としては噛み合わない。**敗戦の有無で完全な一文に分ける**
(`他団体相手に{wins}勝` / `他団体相手に{wins}勝{losses}敗` の2キー+テンプレ側は `{record}`)
ことで、二重登録そのものを起こさずに済ませた。**同型は `test/i18n-ledger-consistency-test.js` が
必ず検出する**ので、訳を書く前に既訳の有無をキー単位で当たること。

### 39-5. ENの数値まわり — 規則23/25は「機械検査を通す」だけでは足りない

規則23(数値PH直後の可算名詞複数形)と規則25(数値PH直前の不定冠詞)の**機械検査はハイフン限定用法を
一律に許す**ため、`a {defenses}-defense run` は検査を通る。しかし充填値が **8 / 11 / 18** のとき
`a 8-defense run` になる。P7-23では EN側の実データ描画(§38-1の検証スクリプト)で
`A 8-week run-in` / `Only 1 pts of cover` を実際に踏んで発見した。運用則:

1. **値が 8/11/18 を取りうる枠には不定冠詞を置かない**。定冠詞(`the {defenses}-defense run`)か、
   序数風の言い回し(`defense number {defenses}`)か、冠詞なしの名詞句へ逃がす
2. **値が 0/1 を取りうる枠には裸の複数形を置かない**。ハイフン限定用法(`a {gap}-point gap` —
   0〜5しか取らないので不定冠詞も安全)、`×{n}` 型のチップ表記(`classics ×{n}`)、
   単位を持たない形(`Just {gap} adrift`)のいずれかへ
3. **分岐の下限・上限を読んでから訳す**。`bigMatches >= 3` の枝なら `{big} classics` は常に複数形で安全、
   `bigMatches >= 1` の枝なら `a {big}-classic season` にする、という判断はテンプレ単位で変わる

### 39-6. `generateKurodaComment` は編集長 黒田貫一郎の声(§1-5 の三声のうち2番目)

P4-5で保留されていた5本を本バッチで同時にテーブル化した(4面の他の全文が英語になる以上、
署名コラムだけJAで残すのは不整合)。`docs/en-kuroda-style-draft-v0.1.md` §1-5 の指定どおり、
幸子より短く・砕けて・皮肉が薄い/短縮形を常用(`Nothing's settled`)/`this writer` を使わず
`this paper` のみ。同§に載っている貫一郎の見本対訳1本をそのまま採用している。

### 39-7. JA同一性の証明(1,440,320通り・不一致0)

§15-5と同じ作法。着手前(`da2d1ed5`)の `src/data.js` + `src/management.js` を **別VMコンテキスト**へ
`git show` から読み込んで凍結コピーとし、13関数を新旧突合した。

- `Engine.rng.int` を新旧同時に差し替えて添字 `k` を 0〜9 で強制し、**プール添字の直積を踏ませる**
- `k` と meta プリセット添字を **同じ剰余系に乗せない**(乗せると (preset, k) の組が
  `lcm(155,10)=310` 通りしか出ず、7本プールの後半添字に永久に到達しない)
- サンプリング用LCGは**上位ビットから**乱数を作る(`lcg % n` は下位ビットの周期が2〜4で、
  `role='Neutral'` や `rnd(2)` が `i` の偶奇と癒着し、4本プールの奇数添字・宿敵分岐が踏まれない)
- 自然確率 1/9000 級の低頻度枝(`_composeFlavorLine` の末尾フォールバック)は**決定的に総なめする**
  ループを別に足す
- **dict省略経路と「ja素通しdict」経路の両方**を毎回比較する
- `_wmFillWithDict` / `_wmDictLabel` をラップして**表の葉293本が全部使われたか**を計測(未使用0)

### 39-8. P7-23で見つかった穴(未着手)

1. **`generatePageHeadline` の `追走者` フォールバックは構造的に到達不能**。`{n2}` が空になるのは
   2位が居ないときだけだが、そのとき `gap12 = 999` で必ず `runaway` 枝へ行く。防御値として残し、
   台帳にも訳を入れてある(JA同一性の網羅計測からは除外)
2. **`_traitPhrase` の年齢不明枝(`age <= 0`)はJA原文のまま返す**。旧実装が `早熟の`(表内)/
   素の特性名(表外)を返していた挙動をそのまま保っており、EN でもJAが出る。`f.age` が欠ける
   ケースは実データに無い(`age: f.age || 0` の防御)ので fail-open で据え置いた
3. **`_traitPhrase` の汎用フォールバック `{trait}の{age}歳` は現行TRAIT_DEFSでは到達不能**。
   25特性のうち23は専用句、`名勝負製造機`/`ライバル体質` は `traitPhraseExtra` で拾うため。
   訳(`a {trait}-driven {age}-year-old`)は不定冠詞が `{trait}` の値で揺れるが、到達しないので据え置き
4. **`test/ui-walkthrough` は新聞4面(MVPレース)を踏まない**。EN走破の `JA exposure by screen` に
   newspaper が1件も出ないのはそのため。**この画面の検査は §38-1 の実データ検証スクリプトが唯一の網**で、
   レア画面強制点火カタログ(`npm run test:ui:ignite`)へ `newspaper-mvprace` シナリオを足すのが本筋
5. **EN走破の digest は run ごとに揺れる**(同一コードで 417 / 418 / 419 actions を実測)。
   揺れているのは `recovered-by-retry` の判定で、JA走破の digest は `1052faa82eaf7991` で安定している。
   **EN側の digest は回帰の指標に使えない**(PASS と `i18n-miss: 0` で見る)
## 40. Stage B P7-25 — 台帳未収載の中小プール5件(キャリア年表/殿堂ハイライト/成長ログ/ドラフト交渉/季総括)の配線と英訳(2026-09-05追加)

`docs/i18n-coverage-report-v0.1.md` のA表 #4/#5/#6/#7/#9 を解決した。訳出**177キー**
(template-ledger 3,143→**3,303**・未訳0 / ui-ledger 4,258→**4,275**・未訳0 /
dialogue-ledger 16,674 は不触)。**#8(絆/因縁レベルラベル)は消費点ゼロと判明したため配線せずB分類へ訂正**(38-5)。

### 40-1. 同じ「管理画面の記録テキスト」でも、永続の有無で解き方が3通りに割れる

5プールはどれも「Engineが組み立てた完成文をUIが素通しで出す」型だが、**その完成文がGへ焼かれるか**で解が変わる。

| プール | 完成文の行き先 | 配線 |
|---|---|---|
| キャリア年表(`Engine.milestone.get`) | **焼かれない**(表示のたびに`careerRecord.history`から組み直す) | `get(G, id, dict)` の**dict-opts**だけ(§22-1と同じ族) |
| 殿堂ハイライト(`Engine.awards.buildCareerHighlights`) | **焼かれる**(`G.allHallOfFame[].careerHighlights[].text`) | 保存は従来どおりdict無し。表示点で**JA再生成→保存値と1バイト照合→一致時だけdict版**(§18-1の語り文と同型) |
| 成長ログのラベル(`growthLog[].detail`/`.eventTag`) | **焼かれる**が、値が**そのまま辞書キー**になる1語ラベル | 表示点で値を`t()`で1回引く(§17-2の異名と同型) |
| ドラフト交渉ナレーション(`negState.narration`) | **焼かれる**+選出が消費済み乱数依存で再生成不可 | **追加フィールド**`narrationTpl`/`narrationVars`(§14-3/§16-1と同型) |
| 季総括の仮文(`Engine.seasonReview.build`) | 焼かれない | 既存の`_line`(=dict)へ通すだけ |

### 40-2. 「フォールバック語を`{org}`へ差し込む」と英語で語が重複する

`{org} 獲得`(org=`ev.orgName || '団体王座'`)を `Won the {org} title` と訳すと、
フォールバック時に **"Won the Promotion Championship title"** になる。`{org}{n}度防衛達成`
(org=`'王座'`→"Title")はさらに悪く **"Title title — defense No. {n}"** になる。

- **`_wmDictLabel`でフォールバック語を差し込むのは、その語が「値」として自然に収まる枠だけにする**
  (`他団体`→"Another promotion"を`Moved to {org}`へ入れるのは成立する)
- 語が**枠の名詞と衝突する**枠では、**フォールバック側を分岐ごとの完全文テンプレにする**
  (`titleWinNoOrg: '団体王座 獲得'` → "Won the promotion title")。JAの充填結果は1バイト同一なので
  構造規約3の「分岐ごとの完全文」をそのまま適用できる

### 40-3. 既訳が「文脈違い」なのか「全消費点で誤り」なのかを`count`で見分ける

`他団体` の既訳は **"Other promotions"**(複数形)だったが、ui-ledgerの13件の消費点を全数追ったところ
**すべてが `団体名 || t('他団体')` 形の「名前が取れないときの1団体を指すフォールバック」**で、
複数形が正しい箇所は1つも無かった。§15-6-3(`該当選手`)と同じ手順で `en` を **"Another promotion"**
へ訂正した(キー分割は不要)。**「文脈違い」を見つけたら、まず全消費点を数えてから直す**。

### 40-4. 分岐の完全文化はラチェットを増やす — その分は理由として書く

`${orgPrefix}${viaJp}入団` のような断片連結を構造規約3どおり完全文へ展開すると、
**JA文字列の本数はむしろ増える**(入団8本 / ドーム大会12本 / 対抗戦4本 …)。
P7-25 は data.js +136 / management.js −115 / ui-render.js −6 / ui-common.js −9 /
draft-negotiation.js +1 の **総計 +7**。移設(差引ゼロ)ではないので、
`--update` 時は「どの分岐を何本に展開したか」を worklog に残すこと。

### 40-5. 「A分類」も鵜呑みにしない — 消費点を自分で数える

`BOND_LABELS`/`RIVALRY_LABELS`(relationships.js:14-28)は棚卸しレポートで
「相関図の絆/因縁バーが参照」とA分類されていたが、実際の消費点は
`Engine.relationships.inspect()` / `.stats()` の2つだけで、**その2関数の呼び出しが
`src/`・`test/` に1つも無い**(定義位置も「デバッグ用ヘルパー」節)。相関図のバーは別系統の
ラベルを使っている。**B分類(表示されない)へ訂正し、配線しない。**
加えて `宿命のライバル` は GLIMPSE_B のイベントラベルとして ui-ledger に既訳
("A fated nemesis")があり、帯域ラベルとして`t()`へ通すと文脈違いの訳が出る(§15-3)。

### 40-6. 抽出器の入口を2つ増やした

- **`test/i18n-extract-templates.js`**: `TARGET_TABLES` に `CAREER_MILESTONE_TEMPLATES` /
  `HOF_HIGHLIGHT_TEMPLATES` / `SEASON_REVIEW_FALLBACK_TEMPLATES` を追加。加えて
  `DRAFT_NEGOTIATION_PROPS = ['NARRATION']` を新設し、`extractAppObjectLiteral` の
  **isolated eval**(`MANAGEMENT_FLAVOR_PROPS` と同じ作法)で `src/draft-negotiation.js` の
  `Engine.draftNegotiation.NARRATION` 40本を切り出す。**同ファイルの loadAsGlobal は
  Engine定義(management.js)を要するので使えない**
- **`test/i18n-extract-ui.js`**: `DATA_TABLES` に `GROWTH_LOG_LABELS`(data.js)、
  `JS_TABLES` に `draft-negotiation.js` の `DRAFT_HEAT_LABELS` / `DRAFT_UI_NARRATION` を追加。
  JS_TABLESは観戦iframe専用の仕組みではなく「トップレベル`const`をソースから切り出して
  孤立評価する」汎用モードなので、Engine依存のあるファイルでもそのまま使える

### 40-7. JA同一性の証明(5,418行・不一致0)

`git archive HEAD` で**凍結コピーを丸ごと別ディレクトリへ展開**し、同一のダンプスクリプトを
新旧両方の `src/` に対して実行して出力をバイト比較した(凍結コピーの取り違えが起きない)。

- `Engine.milestone.get`: 全24 event種別 × 分岐フィールドの直積 **3,311行**
- `Engine.awards.buildCareerHighlights`: 全実績種別を単独/合成の両方で
- `Engine.draftNegotiation.pickNarration` 6型 × 4団体 × rng 12本 / `getHeatInfo` 全帯域
- `Engine.seasonReview._getDepartures` / `_decideHeadline` 全枝(1,008通り)
- `GROWTH_LOG_LABELS` の値集合(旧実装の直書き値と突合)
- 合計 **5,418行・diff 0**。`node test/ja-golden.js` も基準hash `dd2e536b…` と完全一致
- `node test/auto-sim.js 20 42` の semantic fingerprint は **HEADの実測値と同じ `640b2591`**
  (追加フィールド `narrationTpl`/`narrationVars` は `G._draftNegotiation` にしか載らず、
  auto-simは交渉UIを踏まないため指紋に現れない)

### 40-8. 検証

| 項目 | 結果 |
|---|---|
| `node --check`(data.js / management.js / draft-negotiation.js / ui-common.js / ui-render.js / 抽出器2本) | ✅ 全OK |
| `node test/ja-golden.js`(`--update`不使用) | ✅ **完全一致**(lines=11307・hash `dd2e536b…`) |
| build-dict 3本 | ✅ ui **4,275**・template **3,303**・dialogue 16,674 — いずれも**未訳0** |
| `node test/i18n-ledger-consistency-test.js` | ✅ 2台帳以上に存在するキー16件・すべて訳文一致 |
| `npm test` | ✅ **261/261 PASS** |
| `node test/i18n-ratchet.js --update` | 総数 28,050→**28,057**(+7)。内訳は38-4 |
| `node test/auto-sim.js 20 42` | ✅ **ALL CLEAR**・fingerprint `640b2591`(HEAD実測と同一)・台帳検査3種違反0 |
| `npm run test:ui:walkthrough`(JA) | ✅ PASS・328手・digest **`1052faa82eaf7991` 不変**・Issues 0 |
| `npm run test:ui:walkthrough:en`(EN) | ✅ PASS・419手・**i18n-miss 0**・Issues 0・JA露出57(HEAD実測57と同値) |
| VM検証(実物の i18n.js + lang-en*.js を読み込み `setLang('en')`) | ✅ 4,374行を全分岐再走。**合成テストデータの団体名/選手名を除いた日本語残り0・i18n-miss 0** |

**EN走破のdigestは元々非決定的**(HEADで2回走らせて `1373a572…` → `bfea1fc6…`)。
JA走破のdigestだけが安定した不変条件なので、EN側はPASS/Issues/i18n-miss/JA露出で見る。

### 40-9. P7-25で新たに見つかった穴(未着手)

1. **✅解決(P7-28)** — 成長ログの`match`行と`milestone`行はまだ生JA — `vs {name}` / `タッグ({partner}) vs {opps}` /
   `敵地遠征 vs {name}`(management.js・app.js)と `総合力{n}到達` / `人気{n}到達` /
   `{stat}が限界に到達`(app.js:11890)。どれも**名前や数値を埋めた完成文がgrowthLogへ永続**するので、
   §14-3の追加フィールド方式が要る(棚卸しレポートのC分類)。→ §39-1
2. **✅解決(P7-28)** — キャリア年表の「経歴(怪我・重大事項)」欄の`detail` — `careerHistory[].detail`(怪我名)は
   データ側の値で、年表・怪我欄の両方に生JAで出る。injuryLabel と同じ層の解決が要る。→ §39-2
3. **`ns.log`(交渉ログ `R{n}: プレイヤー降り ({bid}万)`)は現状どこにも描画されない** — 描画するなら要配線

## 41. Stage B P7-39 — 旧セーブの新聞4面(年間MVPレース)をENのときだけ現行プールで再生成(Keisuke裁定B-3=③、2026-09-05追加)

§39(P7-23)が確立した`_npMvpI18n`の自己検証型fail-open(4分岐目「一致しない(旧セーブ/素材欠け/表の改訂)なら保存値をそのまま出す」)は、P7-23以前のセーブ(旧プールで焼かれた完成文を持つ)だと**ENでも保存値=JAのまま**表示してしまう欠陥を残していた(§39-9の発見5)。Keisuke裁定B-3(`docs/i18n-keisuke-rulings-pending-v0.1.md`)は選択肢③「JAセーブは一切触らず、言語がENのときだけ保存値を捨てて現行プールで作り直す」を採用した。

### 41-1. 実装は`_npMvpI18n`(ui-render.js)への1条件の追加のみ

判定は**表示時**に行い、ロード時にセーブを書き換えることはしない(=セーブへの書き戻しマイグレーションは行わない。B-3の選択肢①は不採用)。

```js
function _npMvpI18n(saved, regen) {
  if (!saved || typeof saved !== 'string') return saved || '';
  if (typeof Engine === 'undefined' || !Engine.mvpRace) return saved;
  try {
    const matches = regen() === saved;
    if (!matches && WM_I18N.lang !== 'en') return saved;
    const out = regen(WM_I18N.t);
    return (typeof out === 'string' && out) ? out : saved;
  } catch (_e) { return saved; }
}
```

- **旧セーブ判定を別途持たない**(裁定の指示どおり)。「保存値≠現行プールの再生成」を旧セーブの十分条件として扱う(§39の1〜3のロジックは無変更、4の分岐だけ`WM_I18N.lang`で場合分けする)
- **JA/pseudoでは従来どおり保存値のまま**(1バイト不変)。言語をJAへ戻せば旧文がそのまま出る——これが「JAセーブは一切触らない」の実装上の意味
- **ENのときは一致・不一致どちらの枝でも最終的に`regen(WM_I18N.t)`を返す**(一致時は§39の3、不一致時が今回追加した経路)。呼び出し側(`_npRenderPage4`/`_npMvpRaceRank1Card`/`_npMvpRaceMinorCard`/`_npMvpRaceListRow`)は無改修
- **regen()の呼び出し回数は従来と同じ最大2回**(bare1回+dict1回)。不一致×JA/pseudoのときはbareの1回だけで確定して`return saved`するので、パフォーマンス上の追加コストはEN×不一致のときの1パターンのみ(dict版の1回)

### 41-2. 検証: ignite `newspaper-mvprace-legacy`(実データではなくfixtureの故意改変で再現)

`test/ui-walkthrough/fixtures/legacy-saves/`には実際に旧プールの完成文を持つ実セーブが2本ある(`prerefix_S12W45_2026-07-27.json`/`v1.25_S3W11_2026-08-03.json`)が、save-regression棚(`test/save-regression.js`)の実データ検査用に温存し、ignite fixture生成パイプライン(`headless-sim.js`のvalidateGameState等)へ実セーブをそのまま載せる経路は作らなかった(スキーマ差分による無関係な検証エラーを持ち込むリスクを避けるため)。代わりに`newspaper-mvprace`と同じ土台のセーブ(S1W3)に対し、`fixture.engineer`で保存済み5文字列(pageHeadline/pageLead/kurodaComment/TOP3の narrative×3/4位以下の tagline)を現行プールに存在しない文言へ機械的に差し替え、「旧プールで焼かれた完成文」を模擬した。`fixture.assert`で差し替え文が現行プールの再生成結果と偶然一致していないことも機械確認する(一致するとfixtureが「旧セーブ」を模擬できていないことになるため)。

計測は§39-9(P7-23)と同じ`window.__mvpFallback`計測フック(`MVP_INSTRUMENT_PROBE`)を使うが、**実装と同じ分岐**へ更新した(不一致時、`WM_I18N.lang!=='en'`のときだけ`saved`へ抜ける。ENのときは`regen(dict)`を返す)。

| 検査項目 | JA | EN |
|---|---|---|
| `window.__mvpFallback`(regen-mismatch件数) | 6件(見出し/リード/黒田寸評/TOP3寸評×3) | 6件(同数。判定自体は言語に関係なく発生する) |
| 4面表示 | 差し替えた保存値がそのまま1バイト不変で表示(`旧プール文言`を含む) | 差し替え前の`旧プール文言`が0件(現行プールで作り直された文に置き換わっている) |
| `#newspaperContent`のJA露出 | (JA表示が仕様なので対象外) | 0件 |
| `i18n-miss` | - | 0件 |

### 41-3. 検証(すべてフォアグラウンド実行)

| 検証 | 結果 |
|---|---|
| `node --check`(ui-render.js/test/ui-walkthrough/scenarios.js) | ✅ OK |
| `node test/ja-golden.js` | ✅ **完全一致**(`dd2e536bc18a4433b2c1530cc81e7a02090f09db7c7cb0dc184f5df75fd5e44e`) |
| `npm test` | ✅ **261/261 PASS** |
| `node test/i18n-ratchet.js` | ✅ 増加なし(28,058。`--update`不使用) |
| `npm run test:ui:ignite -- --scenario newspaper-mvprace`(JA/EN) | ✅ 両PASS・`mvpFallback: []`(既存セーブは無改修=フォールバック0のまま。§39-9の回帰確認) |
| `npm run test:ui:ignite -- --scenario newspaper-mvprace-legacy`(JA/EN、新設) | ✅ 両PASS(41-2の表のとおり) |
| `npm run test:ui:walkthrough` | ✅ PASS・digest `1052faa82eaf7991` 不変・Issues 0 |
## 42. Stage B P7-30 — `ui-common.js` の未カバーJA 106件の仕分けとEN化(2026-09-05追加)

`docs/i18n-coverage-report-v0.1.md` §5 の C分類「ui-common.js」を全数消化した。
**表示に到達する92件を訳出**(ui-ledger 4,502→**4,589**・未訳0)、**14件を仕様除外**。
ラチェット 28,057→**28,058**(+1)。

### 42-1. C分類の消化は「訳す前に、表示に到達するかを1件ずつ数える」

106件のうち **14件(13%)は一度も画面に出ない**。内訳は5型で、いずれも grep だけでは見分けられず
呼び出し元・描画点まで追って初めて判る。**同型を次のバッチでも最初に振り分けること。**

| 型 | 例 | 見分け方 |
|---|---|---|
| **呼ばれる先が存在しない** | `typeof showPopup === 'function'` で守られた通知(`showPopup` は src/ 全体に定義が無い) | ガード付き呼び出しは**関数の定義を grep する**。ガードがあるほど疑う |
| **関数が引数を使っていない** | `getWarChallengeDialogue(fighter, orgName)` の `orgName`(本体4行で一度も参照しない) | 実引数側だけ見ると「団体名のフォールバック」に見える。**必ず関数本体を読む** |
| **到達不能なフォールバック** | `RIVAL_ORGS.find(o=>o.id==='org_s').name || 'S級団体'` / `s.weeklyNewspaper` が無いときの既定号 | 左辺が**静的データ表**か**毎週必ず設定される状態**なら不能 |
| **論理比較専用の配列** | `hostilityBands` は `indexOf(label)` と `map((_, i) => …)` にしか使われない | 値が `_` で捨てられているか、`indexOf`/`includes` の引数にしかならないか |
| **テンプレートリテラル内のコメント** | `\`<style>… /* U1: 試合結果表示の… */ …\`` / `<!-- TODO: … -->` | スキャナは `${}` を除いた塊を1本の文字列として拾うので、CSS/HTMLコメントが「未カバーJA」に化ける |

### 42-2. 「表示点が既にt()を持つ」動的キーはコードを触らず台帳へ

`FLAG_MODAL_META[modal.type].title` は `WM_I18N.t(meta.title)` で正しく引かれているのに、
`t()` の第1引数が**変数**なので extract-ui の走査に出ない(=辞書が空でENでもJAのまま)。
この族はコードを1文字も変えず、**ui-ledger へ `kept:true` の行を手で足すのが正解**(§5の保全マージ規約)。
P7-30 で手追加したのは31キー — FLAG_MODAL_META の title 22種+既定値 `フラグ`、
大ニュースのリード既定値、レンタル拒否の `speech`、派閥合宿ナレーションの既定値、
団体戦直訴の既定値、挑戦状結果の一言2種、秋対抗戦の優勝/MVPセリフの既定値2種。

**見分け方**: その文字列を `showEventPopup({speech})` / `_u3bSideHtml({line})` / `_mdlAFlowPortraitHtml({line})` /
`WM_I18N.t(meta.title)` のように**共通レンダラへ渡しているだけ**なら、レンダラ側が既にt()を持っている。
ここで呼び出し元にもt()を足すと二重適用になり、置換済みの完成文が `[i18n-miss]` を汚す(§15-1)。

### 42-3. 「完成文がGへ焼かれ、かつ**別の処理がその完成文を読み直す**」族

ドラフト業界紙まとめ記事(`_buildDraftSummaryPage`)の `headline`/`body` は
`G.weeklyNewspaper.pages` と `G._draftResultPages` へ**完成文のまま永続**するうえ、
`_queueDraftIndustryNews` が `String(st.headline).split('、')[0]` / `String(st.body).split('、')` で
**読点分割して業界ニュースを組み直す材料**にしている。つまり保存値のJAは表示以外の役目も持つ。

- **保存値(`headline`/`body`)は1バイトも変えない**。§14-3/§16-1の**追加フィールド**を併記する
  (`headlineTpl`/`headlineVars`、`bodyTpl`/`bodyVars`)
- 名前の列挙は**ENの完成文をセーブへ焼かない**ため `bodyNames`(生JA名の配列)だけを持たせ、
  表示点で `Engine.newspaper.joinNameList(story.bodyNames, WM_I18N.t)` に畳んで `{names}` へ入れる
- 表示点は `ui-render.js` の `_renderNewspaperExtraPage` **1関数**に集約(story を浅いコピーで差し替える)。
  追加フィールドを持たない旧セーブ・他種の記事は従来どおり保存値を素通しする
- **`headlineTpl` は `WM_I18N.t()` の引数ではなく「データとして持つ文字列」なので extract-ui からは見えない。**
  これは事故ではなく利点で、**他台帳が既に持っているキーをそのまま借りられる**
  (`指名漏れ{count}名、フリー市場へ` は `NEWS_HEADLINE_TEMPLATES` 由来で template-ledger に既訳がある)。
  借りずに新しく起こしたキーだけを ui-ledger へ `kept:true` で足せば、§15-3の二重登録も起きない

### 42-4. 「1つの枠に2つの単位語」は既訳キーの文脈を確かめてから借りる

ゲームオーバー/エンディングの成績表は左に見出し(`活動期間`=Active Years)、右に `{n} シーズン` のような
**空白付きの単位語**が来る。ui-ledger には空白なしの `{n}位`→`#{n}` / `{n}回`→`{n}` / `{n}名`→`Wrestlers: {n}` が既にあるが、
JAを1バイトも変えられない以上 `{n} 位`(空白あり)は**別キー**になる。訳文は「その枠の見出しが何を名乗っているか」で決める:

- `{n} 位` → `#{n}`(既訳と同じ)/ `{n} 回` → `{n}`(見出しが Shows Run なので単位語は不要)
- `{n} シーズン` → `Seasons: {n}`(規則23が `{n} seasons` を禁じるのでコロン列挙型)
- `{n} 名` → `{n} inducted`(消費点2つともが殿堂入り人数だったので、汎用の `Wrestlers: {n}` より枠に合う)

### 42-5. 「書式そのものがJA固有」はlang分岐(§25-5/§34-3の3例目)

社長室のボーナス起案の案番号は JA が漢数字(`案 一`〜`案 四`)。ENは算用数字が正なので、
`const kanji = (WM_I18N.lang === 'en') ? ['1','2','3','4'] : ['一','二','三','四'];` の1行分岐にした。
辞書で解けないのは「値そのものが表記体系」だから — 数値の書式・文字数勘定と同じ族。

### 42-6. JA同一性の証明(337通り・不一致0)

実物の `src/i18n.js` を `lang='ja'` で VM に読み込み、**置換前の組み立て式と置換後の `t()`** を
代表値の直積で突き合わせた(数値9×名前4×団体3×ラベル3+名前リスト5パターン)。
PPVのターン数/評価テロップ・派閥ナレーション・F07コーチ報告・アーキタイプ転換・返還式の在位/防衛・
レジェンドエンディングのナレーション・エンディング/解散の締め・単位語4種・天頂戦ドラマ2種・
案番号の漢数字・ドラフト記事の見出し/本文6種、および引数なしt()化37本の素通し。**checks=337 / fails=0**。
`node test/ja-golden.js` も基準hash `dd2e536b…` と完全一致。

### 42-7. ソースの形を見る契約テストはi18n配線で落ちる

`test/ppv-tv-result-clarity-test.js` は `${vsBlock}` / `${summitResultBlock}` の**直後に来る地の文**を
生JAの literal で照合して「対峙シーンだけがvsBlockを使う」を守っていた。t()配線でこの形が変わるので、
**守っている性質は変えずに照合文字列だけ `${WM_I18N.t('…` 形へ更新する**。
同種(ソース文字列の contains で設計を守る契約テスト)は他にもあるので、UI層のt()化バッチでは
`npm test` の失敗を「テストが古い」と決めつけず、**そのテストが何を守っているか**を読んでから直す。

### 42-8. 検証

| 項目 | 結果 |
|---|---|
| `node --check`(ui-common.js / ui-render.js / ppv-tv-result-clarity-test.js) | ✅ |
| `node test/ja-golden.js` | ✅ 完全一致(lines=11307・hash `dd2e536b…`) |
| `node test/i18n-build-dict.js` | ✅ ui **4,589**・未訳0 |
| `node test/i18n-ledger-consistency-test.js` | ✅ 重複16件・訳文一致 |
| `npm test` | ✅ **261/261 PASS** |
| `node test/i18n-ratchet.js --update` | 28,057→**28,058**(+1。内訳: `headlineVars`へ出した`プレイヤー団体`+ドラフト記事テンプレ5本 = +6 / 撤去した未使用引数1本+JAが消えたテンプレートリテラル4本 = −5) |
| `npm run test:ui:walkthrough`(JA) | ✅ PASS・328手・digest **`1052faa82eaf7991` 不変**・Issues 0 |
| `npm run test:ui:walkthrough:en`(EN) | ✅ PASS・411手・**i18n-miss 0**・Issues 0・JA露出57(§38-8実測と同値) |
| ignite gameover / tenchosen / unified-player-turn(EN) | ✅ すべてPASS・i18n-miss 0 |
| ignite gameover / tenchosen / faction-ignite(JA) | ✅ すべてPASS |

### 42-9. P7-30で新たに見つかった穴(未着手)

1. **`showPopup` が存在しない** — `ui-common.js:6486` の EMPRESS安全網(S級団体との電撃契約)の
   「§6.4 ドラマ演出: 通知ポップアップ」は `typeof showPopup === 'function'` が常に false で**一度も出たことがない**。
   i18nではなくゲーム側の欠落。復活させるなら `showEventPopup` 系へ載せ替える
2. **黒田記者の署名が2種類ある** — 解散セレモニーのコラム見出しだけ `黒田 沙智子 編集記事`(ui-common.js:16437)で、
   ゲーム全体の正である `黒田幸子`(names-ledger `npc` / ui-render.js の署名ローテーション)と姓名が食い違う。
   ENは辞書の正(`Sachiko Kuroda`)へ寄せた。**JAをどちらに揃えるかはKeisuke裁定待ち**
3. **`--scenario faction-ignite --lang en` が既存FAIL** — `ignite-ceremony` 未観測 / `factionPendingIgnite` 残留 /
   hostility が開戦水準に届かない(max=55)+ `D5_WATCHDOG`。**HEADへ戻した状態でも digest `62a61bb9eb424fd8` まで
   完全に同一のFAIL**を再現したので P7-30 起因ではない。JAは PASS(digest `b97c8f52a3663ffb`)なので、
   EN経路だけ派閥開戦へ辿り着けていない(走破ルート側の問題)
4. **`showFactionF02Modal` の派閥名が `_factionDisplayName` を通っていない** — 開戦ナレーション2行目の
   `payload.factionAName`/`factionBName` は生値のまま `_quoteVal` に入る(§10で導入した「○○派」の表示直前変換を経由しない)。
   P7-30 は挙動を変えないため据え置いた
   (P7-28で消費点ゼロを再確認。削除はせず docs/i18n-stage-a-p3a-design-v0.1.md の裁定待ちリストへ記録)

## 43. Stage B P7-28 — 成長ログmatch/milestone行の追加フィールド化・怪我名detailの辞書経由・死参照掃除(2026-09-05追加)

§38-9の残り2件(成長ログ・careerHistory怪我名)を解決した。訳出15キー(ui-ledger 4,275→**4,290**・未訳0。template/dialogueは不触)。

### 43-1. growthLog match/milestoneは「Gへ永続する完成文」なので追加フィールド方式(§14-3と同型)

`growthLog[].detail`(選手ポップアップの成長経過タブに永続表示される行)のうち`type:'match'`/`type:'milestone'`は、名前・数値を埋めた完成文がそのままセーブへ焼き込まれる。§14-3(`hypeTpl`/`hypeVars`)・§38-1(ドラフト交渉ナレーション)と同型で、**`detail`はJA完成文のまま不変**(セーブ値不変)にし、`detailTpl`/`detailVars`を新規フィールドとして併記する。表示点(ui-render.js成長経過タブ)は`entry.detailTpl ? WM_I18N.t(entry.detailTpl, entry.detailVars) : entry.detail`でfail-openする(旧セーブ=detailTplなし はdetailをそのまま表示)。

- push側は4箇所(management.js 2箇所=タッグ/シングル・app.js 2箇所=`App.finalizeShow`のタッグ/シングル共通経路・`App._finalizeAwayChallengeShow`)。`App.finalizeShow`のタッグ経路は`oppLabel`(`w/{partner} vs {opps}`)という**management.js側とは別のJA文型**を使うため、tplも別キー(`vs w/{partner} vs {opps}`)にした — 同じ情報を表す2つのJA表現をどちらも尊重し、無理に統一しない(JA出力不変の制約上、統一するとJAが変わってしまう)
- milestone側(app.js 1箇所、pendingMilestone処理)は3分岐(ovr/pop/stat)。`{stat}`はSTAT_JA由来のUIラベル値(パワー等)なので、表示点で**先に`WM_I18N.t()`を通してから**外側テンプレへ差し込む(§14-2 `_wmDictLabel`と同趣旨のUI側版。`{n}`は数値なので変換不要)
- 新規テンプレキー7件は`management.js`/`app.js`が`i18n/ui-ledger.json`の走査対象外(§11-3等と同型)のため`kept:true`+`note`で手追加。うち`総合力{n}到達`/`人気{n}到達`は既存キー(`総合力 {n} 到達`等、スペース有・ui-common.jsの成長ポップアップ用)とJA原文が微妙に異なる**別キー**だが、訳文は揃えた(§15-3の「本物の二重出現」型)

### 43-2. careerHistory[].detailの怪我名は「値が既にJA表示ラベル」なので逆引き+値の引き直し

`careerHistory[].detail`は「Engine(management.js)がpush時点でWM_I18Nを呼べないため、`injuryLabel(type)`をdict無しで通した結果(内部キーではなく**JA表示ラベル**)を埋め込んだ完成文」がそのまま永続する3パターンと判明した:

| パターン | 生成箇所 | 例 |
|---|---|---|
| A: 実怪我(中傷/重傷) | management.js:1749 | `中程度の負傷（8週離脱）` |
| B: 実怪我引退 | management.js:11008/14923/14953(3箇所) | `重傷により引退` |
| C: 疑似経歴(`Engine.career.generateBackstory`)の怪我フレーバー | management.js:4427 | `膝の負傷で長期欠場`(実怪我システムと無関係の別語彙。新設`BACKSTORY_INJURY_LABELS`=data.js) |

**追加フィールド方式ではなく正規表現+逆引き表**で解いた(pushサイトは無改修): `INJURY_LABEL_REVERSE`(data.js、`INJURY_LABEL`のJA表示ラベル→内部キーの逆引き。値が全て相異なるため一意)を新設し、`_wmCareerInjuryDetail(dict, detail)`(management.js、`_wmDictLabel`直後)が3パターンの語尾(`（{n}週離脱）`/`により引退`/`で長期欠場`)を正規表現で判定 → ラベル部分を逆引き → `injuryLabel(type, dict)`/`_wmDictLabel(dict, label)`で引き直す → `_wmFillWithDict`でテンプレへ通す。**マッチしない値はfail-open(生JAのまま)**。

表示点は2箇所: `Engine.milestone.get`の「Convert careerHistory events」ループ(既存dict引数へ相乗り)と、ui-common.jsの「経歴(怪我・重大事項)」セクション(`h.type`が`injury`/`injury_retirement`のときだけ適用。他type=生成経歴のtitle_win等は本バッチの対象外=非ラップ据え置き)。

**この方式を選んだ理由**: pushサイトに追加フィールドを足す方式(§39-1と同型)も検討したが、(a) パターンA/Bは正規表現で確実に復元できる固定書式であり値の逆引きが一意に決まる、(b) 3箇所×2パターンのpushサイトを触るより表示点1関数に集約するほうが影響範囲が小さい(CLAUDE.md「変更は可能な限りシンプルに」)、(c) 既存の`injuryLabel(type, dict)`ヘルパー(data.js)をそのまま再利用でき新しい概念を持ち込まずに済む、という3点から表示点解決を採った。

### 43-3. TRAIT_DEFS死参照10件の掃除 — 「機械列挙」は数値バグと文字列バグを混同しない

docs/i18n-coverage-report-v0.1.md B分類が挙げた7特性名(熱血/天才肌/心技体/影の支配者/ガラスのハート・ガラスの心臓/燃えやすい)の死参照を`Traits.has`/`traits.includes`/配列フィルタの全消費点で機械列挙し、いずれも**ナラティブ選択(常にfalseの到達不能分岐・削除しても生成文字列は不変)**であることを確認して削除した(management.js: chronicleの`kept`配列2件+MVP race `charPool`のif文2行+`_traitPhrase`の`order`配列5件+`M`辞書5エントリ、app.js: `hofToArchive`/`retiredToArchive`の同型フィルタ2箇所)。`Engine.career.generateBackstory`の`injuryPool`配列(5語)はdata.jsの`BACKSTORY_INJURY_LABELS`へ移設(§39-2で共用するため)。

**同じ機械列挙で見つかった別種の3件は今回は直さなかった**(`ファンサ`≠`ファンサービス`のtraitDraw計算2箇所・`ヒール`≠`ヒール適性`の対戦appeal計算2箇所・`人脈`という実在しないキーのscout noise計算1箇所)。これらは**数値ゲームバランスに実効するdead branch**(常にfalseで意図したボーナスが一度も発動していない)であり、直せばauto-simの分布が動く。i18nバッチの範囲外・Keisuke裁定が必要と判断し、`mcp__ccd_session__spawn_task`で別タスクとして切り出した(未着手)。**「TRAIT_DEFSに無い特性名への死参照」という同じ症状でも、文字列(ナラティブ選択)と数値(ゲームバランス)は分けて扱うこと**。

### 43-4. RIVAL_ORGS.descを計算するdeck変数の削除

§35-7・docs/i18n-stage-a-p3a-design-v0.1.mdに記録されていた死コード(ランキング画面の`deck`変数、P7-1で発見)を解決した。`deck`は`org.desc`(または`''`)を代入されるだけで、宣言〜代入〜スコープ終了まで一度も参照されない(grep突合で確認)。**JA出力を変えない側(削除)を採用**——復活(描画)は新しい可視文字列を追加することになりJA不変の制約に反するため、この文脈では「削除」だけが1バイト不変の選択肢だった。`RIVAL_ORGS.desc`データ自体はP7-11の団体比較号(新聞)で現役利用中のため無変更。

### 43-5. auto-simの指紋除外に`detailTpl`/`detailVars`を追加

growthLog(`G.roster[].growthLog[]`)は auto-sim の semantic fingerprint 計算対象(`JSON.stringify({G,...})`)に含まれるため、§39-1の追加フィールドの分だけ指紋が動く。`test/auto-sim.js`のreplacerへ`detailTpl`/`detailVars`の除外を追加(§15-1/P6-16と同じ作法)。除外後、`node test/auto-sim.js 20 42`が**HEAD(P7-28着手前)の実測値と同一の`640b2591`**になることを、変更前後で個別に測定して確認した(stashで一時的にP7-28差分を退避→HEAD実測→復元→指紋除外込みで再実測、の手順)。

### 43-6. 検証

| 項目 | 結果 |
|---|---|
| `node --check`(data.js/management.js/app.js/ui-common.js/ui-render.js/test/auto-sim.js) | ✅ 全OK |
| `node test/ja-golden.js`(`--update`不使用) | ✅ **完全一致**(lines=11307・hash `dd2e536bc18a4433…`) |
| build-dict 3本 | ✅ ui **4,290**(未訳0)・template 3,303(不触)・dialogue 16,674→17,092は前バッチのまま(不触) |
| `node test/i18n-ledger-consistency-test.js` | ✅ 2台帳以上に存在するキー16件・すべて訳文一致 |
| `npm test` | ✅ **261/261 PASS** |
| `node test/i18n-ratchet.js --update` | 28,057→**28,042**(−15)。data.js +5(BACKSTORY_INJURY_LABELSの移設)/ management.js −20(死参照削除の方が大きい)/ app.js jaChars +1(コメントのみ) |
| `node test/auto-sim.js 20 42` | ✅ **ALL CLEAR**・fingerprint **`640b2591`**(P7-28着手前の実測値と同一。§39-5) |
| `npm run test:ui:walkthrough`(JA) | ✅ PASS・328手・digest **`1052faa82eaf7991` 不変**・Issues 0 |
| `npm run test:ui:walkthrough:en`(EN) | ✅ PASS・412手・**i18n-miss 0**・Issues 0・JA露出57(HEAD実測57と同値。内訳は走破ごとに変動するが総数は一致) |
| VM検証(実物のi18n.js+lang-en.js+data.js+management.jsを読み込み) | ✅ growthLog 7型・careerHistory怪我detail 26パターン(全怪我種×週数+3引退+疑似経歴5語+fail-open2種+null)を全てJA再構築1バイト一致で確認、EN側も各型を目視確認 |

## 44. Stage B P7-31 — `ui-render.js` の未カバーJA(旗揚げ序章オーバーレイほか)の配線と英訳(2026-09-05追加)

`ui-render.js` に残っていた未カバーJA 79件を仕分け・配線・英訳した。訳出**36キー**
(ui-ledger 4,502→**4,538**・未訳0。template 3,303 / dialogue 17,092 は不触)。

### 44-1. 「EN走破のJA露出検査が拾わない」には**2段**の理由がある

旗揚げ序章(`renderOpeningScreen`)の4幕は、ゲームを新規に始めた人が**最初に読む地の文**
なのにEN画面でも丸ごと日本語のままだった。EN走破の `i18n-miss` にも `JA exposure` にも
一度も出ていない。原因は独立した2つで、**片方だけ直しても検出されない**:

1. **走破は序章を構造的に踏まない(主因)** — walk も ignite も
   `test/ui-walkthrough/fixtures/*.json` のオートセーブから起動する。全fixtureが
   `weekPhase:'manage'`(S1W1・`draftComplete`)であり、序章は「タイトル→新規ゲーム→団体名入力」の
   直後の `weekPhase:'opening'` にしか存在しない。**セーブから始める限りどのモードでも到達しない**
2. **JA露出計測が「リーフ要素」しか見ない(副因)** — `readPageSnapshot()` / `scanJaExposureDetail()`
   はどちらも `element.children.length === 0` で絞る。序章の `.opening-act-line` は
   `地の文<br>地の文<span>…</span>` という形で子要素を持つため、**自分の直下テキストノードは
   誰にも読まれない**。この死角は序章に限らず「地の文の中に `<br>` や `<strong>` が挟まる枠」全部に効く

**打ち手**: 1 に対しては専用の点検スクリプト `test/ui-walkthrough/opening-scene-i18n-check.js`
(§37-4 のカットイン検査と同じ「実関数を直接叩く」流儀)。2 に対しては `scanJaExposureDetail()` を
**リーフ + 「自分の直下テキストノードにJAを持つ非リーフ」** へ広げた(子孫のテキストは子孫自身の行で
数えるので二重計上にならない)。`readPageSnapshot()` の `jaExposureCount`(画面別の最大値)は
**変えていない** — あちらはJA走破の毎手のスナップショットに乗るため。

**拡張した検出器は入れた直後に実害を1件出した**。`ignite --scenario chronicle --lang en` の
`screen-database` ゼロゲートが4件(団体名)で落ち、出どころは**データベース→全選手一覧の所属団体セル**
`ui-render.js:9880` `<td>${f._orgName}${…Badge}</td>` だった。`<td>` がバッジ `<span>` を子に持つため
リーフ判定から外れ、**今まで一度も走査されていなかった**。`WM_I18N.pn(f._orgName)` の1語で解決
(並べ替えキー側の `_orgName` は生値のまま=JA挙動不変)。
**`<td>`/`<div>` にバッジやアイコンが同居する枠は同型の死角なので、拡張後の物差しで
EN走破のJA露出一覧を分類し直すこと**(EN走破 157件・ignite chronicle 17件が新しい基準)。

### 44-2. JA同一性は「見えている行」で測る — `display:none` の要素の `innerText` は罠

序章のように **HTMLの字下げごとテンプレへ畳む**修正は、ソースの改行・空白が動く。
バイト比較では落ちるが、HTMLはその空白を畳んで描くので**見た目は1バイトも変わらない**。
そこで基準は `innerText`(ブラウザが実際に見せる行。`<br>`とブロック境界が改行になり、
畳める空白は1個に正規化される)を `' | '` で連結した文字列で採る。

- **`display:none` の要素の `innerText` は `textContent` へ落ちる**(`<br>` が消える)。序章は
  幕2〜4が `style="display:none"` なので、**計測の間だけ表示に戻してから読む**。これを忘れると
  「幕1だけ正しく改行され、幕2〜4は改行が消える」という一貫しない基準になる(P7-31で実際に踏んだ)
- 幕3は設立2名の名前が起動ごとに変わる。後方参照付きの正規表現で**形だけ**を検査する

### 44-3. 文字数で見た目を切り替える判定は言語別化する(§31-4 の2例目)

`.opening-org-line` の段(`is-medium` / `is-long` で 28px→24px→18px)は
`orgName.length >= 16 / >= 11` の決め打ちだった。EN団体名は同じ字数でも幅が半分しかないため、
**ENでは段が早く落ちて小さく出る**。§31-4 と同じく閾値だけを言語別にする。

- **実測(Playwright・`.opening-org-line` の Range 実幅)**: 28px で JA 約32.2px/字・EN 約16.5px/字
  (比 1.95)、24px で JA 約27px/字・EN 約13.5px/字
- JAの段の境目の実幅(normal上限 10字=386px / medium上限 15字≒460px)に EN を合わせて
  **EN 20字 / 31字**。JA側の 11 / 16 は1文字も変えていない
- `white-space:nowrap` の枠なので、**閾値は「文字数」ではなく「その段のフォントでの実幅」で決める**。
  検査も `getBoundingClientRect().width` ではなく **Range の実幅**で測ること
  (`display:block` の要素は幅が親いっぱいになり、`scrollWidth` は常に親の幅を返す)

### 44-4. 単体の `const NAME = '…'` は3つの抽出器のどれからも見えない

§10-2 が「関数内の配列は見えない」と書いた穴の**変種**。`TRAINING_FATIGUE_TOOLTIP` /
`_RM_TIP_BOND` / `_RM_TIP_RIVALRY` は消費点が正しく `WM_I18N.t(定数)` を通っているのに、
`t()` の第1引数が**変数**なので `extractJsCalls` に載らず、台帳に1行も無かった
(=ENでは常に原文のまま fail-open)。同じ理由で `_scoutComment` 関数内の `STYLE_FLAIR` も不可視だった。

- 直し方は P7-1 が確立した方針どおり「kept:true の手追加で凌がず、**走査対象として再現可能にする**」。
  ui-render.js のトップレベルへ `UI_TIP_TEXTS`(3件)/ `DRAFT_STYLE_FLAIR`(7件)として出し、
  `test/i18n-extract-ui.js` の `JS_TABLES` へ登録した(`JS_TABLES` は観戦iframe専用ではなく
  **任意のJSファイルのトップレベル const** を切り出せる)
- **抽出条件は「列0のトップレベル `const NAME = { … }`」**(`extractTopLevelConstLiteral`)。
  関数内・字下げ付きの宣言は対象外
- `TRAINING_FATIGUE_TOOLTIP` は別名として残した(`test/heat-visibility-test.js` が
  ソースを正規表現で読むため、そちらの参照先を `trainingFatigue:` へ寄せた)

### 44-5. 「未カバー」の中には**訳してはいけないもの**が3種混ざる

79件の仕分けは **訳した39 / 論理比較で除外5 / HTMLコメント1 / 死骸34** に割れた。
死骸は消費点をgrepで数えて確定し、**訳さず・消さず・報告する**(出すか削るかはKeisuke裁定。
`HEAT_STATE_SELF_LINES` 75行の据え置きと同じ扱い)。

| 死骸 | 場所 | 根拠 |
|---|---|---|
| `STYLE_META[*].desc`(**6件**) | ui-render.js:818-823(旗揚げドラフト画面) | 同関数内の `sm.` 参照は `.cream` だけ。`sm.desc` は `src/` 全体で0件。他2つの `STYLE_META` 定義(ui-common.js:4037・ui-render.js:6451)には `desc` プロパティ自体が無い → **✅削除(P7-45・§46-1。裁定C-4と同族)** |
| `_aceFlavorByPersona` の `archMap`/`persMap`(**28件**・アーキタイプ7種18本+性格5種10本) | ui-render.js:4771-4793(団体紹介の講評) | **関数そのものが `src/` から1度も呼ばれていない**(定義1件のみ)。同スコープの `_pickSeed` を使う他の講評文プール(`_orgContextSentences` ほか)は全部 P7-6/P7-14 で `t()` 配線済みなので、この1本だけが取り残されている → **✅配線+英訳(P7-45・§46。裁定C-3=①)** |

論理比較(`_normalizeFinanceLabel` の `startsWith('チケット収入')` 等、`renderLog` のカテゴリ
`match: l => l.includes('引き抜き')` 等)は**構造規約2「ロジックキーは日本語のまま」**の適用対象で、
表示側と共有していないことを確認したうえで除外する。HTMLコメント(`<!-- アッパー画像は… -->`)は
DOMに入るが描画されないので同じく除外。

### 44-6. 検証

| 検証 | 結果 |
|---|---|
| `node --check`(ui-render.js / detectors.js / extract-ui.js / heat-visibility-test.js / opening-scene-i18n-check.js) | ✅ |
| `node test/ja-golden.js` | ✅ 基準と**完全一致**(`dd2e536b…` 不変) |
| `node test/i18n-build-dict.js` | ✅ ui 4,538・**未訳0**(template 3,303 / dialogue 17,092 不触) |
| `node test/i18n-ledger-consistency-test.js` | ✅ 2台帳以上に存在するキー16件・訳文一致 |
| `npm test` | ✅ **261/261**(`heat-visibility-test.js` の定数参照を39-4に合わせて更新) |
| `node test/i18n-ratchet.js` | ✅ **増加なし**(28,057→28,038・−19。テンプレ化で生JAが減った分) |
| `npm run test:ui:walkthrough`(JA) | ✅ PASS・328手・digest **`1052faa82eaf7991` 不変**・Issues 0 |
| `node test/ui-walkthrough/run.js --lang en` | ✅ PASS・412手・**i18n-miss 0**・Issues 0 |
| EN走破のJA露出(検出器拡張**前**の物差し) | 着手前 146 → 着手後 **146**(同値)。序章・派閥クロニクル・王座奪還バナーは走破が踏まない画面のため数字は動かない |
| EN走破のJA露出(検出器拡張**後**の新しい物差し) | 161 → **157**(`_orgName` の `pn()` 化で −4)。以後の比較はこちら |
| `npm run test:ui:ignite -- --scenario chronicle`(JA / EN) | ✅ 両方 PASS・Issues 0・`screen-database` ゼロゲート0件 |

## 45. Stage B P7-43 — 新聞1面のJA露出12件+F07/F02派閥名露出の修正(2026-09-06追加)

新しいパターンは増えていない。§13-2発見5(PH先埋め込み)・§14-2(`_wmDictLabel`)・§10(`_factionDisplayName`)を**未対策のまま残っていた呼び出し元へ適用しただけ**の回。「1つのヘルパーを導入したあと、同じ生成元を全部grepし直さないと取りこぼす」という§25-2の教訓がここでも再現したので、その事例として記録する。

### 45-1. `rep()`手動PH充填(§13-2発見5)の未対策箇所が management.js にまだ残っていた

`Engine.newspaper.generate()`内、業界ニュースキューの汎用記事化経路(`NEWS_HEADLINE_TEMPLATES[ev.type]`を直接引く箇所。P6-15がdict-opts化したのは`UNIFIED_TITLE_TEMPLATES`等の**専用composerを持つ4表**だけで、この汎用経路は対象外のまま残っていた)が`rep(dict(tpl.headline))`——テンプレ本文だけ`dict()`で訳し、`{name}`/`{orgName}`は`data`の生JA値のまま`.replace()`で差し込む——という発見5そのものの実装だった。`_wmFillWithDict(dict, tpl, params)`へ差し替えて解決した。**`fillTemplateVars`/`applyParams`は値がnullだと文字列`"null"`を埋める**(§14-4で既知)ため、`data`をそのまま渡さず、null/undefinedを空文字へ正規化した別オブジェクト`params`を作ってから渡す(`newsData: data`は下流の`intensityBonus`等が生値を読むため書き換えない)。

### 45-2. 値そのものが未翻訳の1語ラベル(§14-2)も1箇所残っていた

因縁記事の`{rivalLabel}`(`RIVALRY_THRESHOLDS`の「因縁」「宿敵」「宿命」)がapp.jsで値のまま`d.rivalLabel`として`kurodaText`プールへ渡っていた。`_wmDictLabel(WM_I18N.t, rivalLvl.label)`を計算時点に挟むだけで解決(ui-ledgerに既訳があったため新規訳出は不要)。

### 45-3. `_factionDisplayName`(§10)は「1箇所だけ対策して満足」すると同じ関数内の兄弟呼び出しを取りこぼす

`Engine.factions.applyF07Choice`(factions.js)は`Engine.factions._factionDisplayName`という同名メソッド(P7-6で追加)を**30箇所前後ある`factionName`の使用のうち2箇所だけ**(DEMAND_RECOGNITION/A分岐)に適用済みで、残りは生JAのまま`resultText`/`impactSummary`へ渡っていた。**関数の引数を受け取った直後(destructuring直後)で一括変換する**のが正しい形——個々の使用箇所を1つずつ`_factionDisplayName()`で包むと、新しい分岐が追加されるたびに同じ穴が再発する。`_factionDisplayName`は「派」で終わらない・既に訳し済みの文字列には素通しする設計(§10)なので、既存の2箇所の明示呼び出しと衝突しても冪等(二重適用しても1バイト不変)——今回は冗長なので単純化して`factionName`直読みへ戻した。

`ui-common.js`の`showFactionF02Modal`(F02開戦ナレーション)も同型で、`payload.factionAName`/`factionBName`を宣言時に`_factionDisplayName()`へ通すよう修正した。同じ`factionAName`という変数名を持つ`_factionF02RenderClash`(同ファイル内の別関数、F02のact2)は**独立したスコープの別変数**なので影響しないが、同型の未対策のまま残っている(§45-4)。

### 45-4. 範囲外で見つかった同型(未修正)

- **✅解決(P7-44)** — F08合同企画(`showFactionF08Modal`周辺)の`factionAName`/`factionBName`直読み・興行準備画面の「Main event recommendation from ○○派」バナー(ui-common.js、いずれも10箇所以上)
- **✅解決(P7-44)** — F02クラッシュ画面`_factionF02RenderClash`の`factionAName`/`factionBName`(showFactionF02Modalとは別スコープ)
- ignite fixtureの事前生成(`headless-sim.js`)がJAコンテキストで`tickWeek`を回すため、`weeklyNewspaper`の一部記事(王座交代・一部負傷記事の本文)が生成時点でJA文字列としてGへ焼かれ、後から言語を切り替えても遡及再生成されない。過去号アーカイブとしては妥当な設計の可能性があり、バグかどうかの切り分けを含め別枠

### 45-5. 検証

| 検証 | 結果 |
|---|---|
| `node --check`(app.js/factions.js/management.js/ui-common.js/ui-render.js) | ✅ |
| `node test/ja-golden.js` | ✅ 完全一致(`dd2e536b…` 不変) |
| `node test/i18n-ledger-consistency-test.js` | ✅ 重複17件・訳文一致 |
| `node test/i18n-ratchet.js` | ✅ 増加なし(31ファイル・28,038行) |
| `npm test` | ✅ 264/264 |
| `node test/auto-sim.js 20 42` | ✅ ALL CLEAR・指紋`e96444c1`が変更前後で完全一致 |
| JA UI走破 | ✅ PASS・336手・digest `b3b7a2c05a7e6016`(現行基準と一致) |
| EN UI走破(`--ja-exposure-log`) | ✅ PASS・i18n-miss 0・`screen-newspaper`露出0・`screen-week`のF07派閥名露出も解消 |
| `npm run test:ui:ignite -- --scenario newspaper-mvprace`(JA/EN) | ✅ 両方PASS・EN側のJA露出は16→12(退行なし、AI団体名3件が副次的に解消) |
| `node test/ui-walkthrough/opening-scene-i18n-check.js` | ✅ **ALL CHECKS PASS**(JA 4幕が基準と完全一致 / EN 4幕に日本語0 / i18n-miss 0 / 段の一致3件) |

## 46. Stage B P7-44 — §45-4の同型解消+GL-12(第三者の証言)i18n-missの根本原因特定(2026-09-06追加)

§45-4が挙げた2件(F08合同企画周辺・F02クラッシュ画面`_factionF02RenderClash`)に着手し、EN走破のJA露出ログで実測しながら同型を洗い出した結果、最終的に**F08/F02/Common-7の14箇所**を`_factionDisplayName()`で修正した(内訳はdocs/worklog.md冒頭のP7-44エントリ§1の表を参照)。新しいパターンは増えていない。全箇所とも既存の`_factionDisplayName()`(§10)を「宣言直後/受け取り直後に一括変換」する形で適用しており、§45-3が挙げた「使用箇所ごとに包むと分岐追加のたびに同じ穴が再発する」教訓をここでも踏襲した。

### 46-1. GL-12(第三者の証言)のi18n-miss — 「dict未渡し」ではなく「二重t()適用」だった

P7-31発見5(§13-2型2/型5)は「`dict`を渡さない呼び出し元から来た完成文が表示点でt()に掛かる」という理解だったが、実際に`src/i18n.js`本体+EN辞書を素のvmで実読みし`Engine.glimpse.checkBLayer`を直接叩いて再現したところ、**management.jsの全実プレイ経路は`dict: WM_I18N.t`を正しく渡している**(2026-09-03修正済み)ことを確認した。ではなぜmissが出るのか——`checkBLayer`のdict分岐は「テンプレを先に辞書引き→変数展開」という正しいdict-optsパターンで**EN完成文**(例: "They say Yurika Kondo and Ayu Sawanobori did not once meet each other's eyes in the locker room.")を`dialogue`へ格納するが、表示点(`ui-render.js`の道場「休憩中の選手」`.dojo-rest-bubble`)がこの**完成済みの英文をもう一度`WM_I18N.t()`に掛けている**。`t()`のen分岐は辞書に完成文と一致するキーが存在するかを問わず毎回検索し、見つからなければ`logMiss()`を呼ぶ(`src/i18n.js`の`currentLang==='ja'`分岐はプレースホルダの有無に関わらず辞書を経由しないため、同じ二重適用がJAでは無症状になる非対称性がある)。**「dictを正しく渡していても発生する」という点で、既存のdict-opts系のバグカタログ(型2/型5)には無かった新しい観測**として記録する。

正しい直し方は§14-3(`hypeTpl`/`hypeVars`)と同型の「生キー+材料」追加フィールド方式で、表示点を`g.dialogueTpl ? WM_I18N.t(g.dialogueTpl, g.dialogueVars) : WM_I18N.t(g.dialogue)`に切り替える。今回は`relationships.js`側(候補push・`glimpses`正規化の2箇所)に`dialogueTpl`/`dialogueVars`を追加する生成側の実装まで済ませたが、**表示点の1行(`ui-render.js`の道場シーン、1940〜2070付近)は別バッチ(P7-40/41)が同時編集中だったため触れていない**。次に道場シーンへ触るバッチが上記1行を配線すれば解消する見込み(再現ハーネスで実証済み・下記46-2参照)。

### 46-2. 検証

| 検証 | 結果 |
|---|---|
| `node --check`(app.js/ui-common.js/ui-render.js/factions.js/relationships.js) | ✅ |
| `node test/ja-golden.js` | ✅ 完全一致(`3466a6ff…`不変) |
| `node test/i18n-ledger-consistency-test.js` | ✅ 重複17件・訳文一致 |
| `node test/i18n-ratchet.js` | ✅ 増加なし(31ファイル・27,933行) |
| `npm test` | ✅ 265/265 |
| `node test/auto-sim.js 20 42` | ✅ ALL CLEAR・指紋`96492883`不変 |
| GL-12再現ハーネス(`src/i18n.js`本体+EN辞書を素のvmで実読みし`checkBLayer`を直接叩く) | 現状の表示相当(`WM_I18N.t(g.dialogue)`)は新規missを1件記録(バグ再現)。提案する表示相当(`WM_I18N.t(g.dialogueTpl, g.dialogueVars)`)は同一の表示文字列を追加missゼロで生成(修正方針の正しさを実証) |
| JA UI走破 | ✅ PASS・336手・digest `b3b7a2c05a7e6016`(現行基準と一致) |
| EN UI走破(`--ja-exposure-log`) | ✅ PASS・399手・digest `a21c9e961ea228ed`(修正前と操作列完全一致=ロジック不変)・i18n-miss 0・派閥名(「派」を含む文字列)のJA露出11→0 |
## 47. Stage B P7-45 — 死蔵ヘルパー `_aceFlavorByPersona`(28本)の配線・英訳と `STYLE_META[*].desc` の削除(2026-09-06追加)

§33-4(P7-14)と§44-5(P7-31)が「死骸」として報告し、Keisuke裁定 C-3=①「配線して出す」/ C-4同族「死骸なら削除」を受けた回。**新しい i18n パターンは増えていない**——§33(P7-14)の連結様式テンプレ(`_concatParts`/`_joinSentences`)と、§39/§40 で確立した「走査対象外プールは kept:true で手追加」をそのまま適用しただけである。記録する価値があるのは**死骸の2つの結末が対称ではない**という判断のほうにある。

### 47-1. 死骸の処遇は「文が書かれているか」ではなく「その文がキャラを運ぶか」で分かれる

| 死骸 | 処遇 | 判断根拠 |
|---|---|---|
| `_aceFlavorByPersona` の `archMap`/`persMap`(28本) | **配線**(裁定C-3=①) | アーキタイプ×性格で書き分けられた**キャラの描写文**が既にある。CLAUDE.md 三本柱「キャラクターの人生を覗き見る」に直接効く資産で、捨てるほうが損失 |
| `STYLE_META[*].desc`(6件) | **削除**(裁定C-4と同族) | スタイル(Grappler/Striker…)の**一般的な説明文**で、キャラ固有の情報を1バイトも持たない。しかもドラフトカードは `sm.cream` と生の `c.style` しか描画しておらず、出す場所を作るところから設計が要る。台帳にも載っていない(未英訳)ので削除しても JA/EN どちらの出力も変わらない |

つまり「呼ばれていない=消す」でも「書いてある=出す」でもない。**その文がキャラのドラマを運ぶか**を基準にした(CLAUDE.md 機能追加の判断基準1)。

### 47-2. 配線先はエース欄の `<p>` ——リード文(団体)ではなく**個人**を語る欄

画面仕様(`docs/ui/03-screens/ranking.md` §3.2)は03団体プロフィールの講評を「団体説明 / エース欄 / 主力層欄」の3層に割り、**エース欄だけが個人を語る**と定めている。人物描写はここ以外に置き場がない。実装は `_buildAceCopy`(戦績)の戻り値へ `_concatParts([record, _joinSentences([flavor])])` で1文足す形にした:

- `_buildAceCopy` の中へ混ぜない。あちらは王座/防衛数/年齢の**分岐が既に9本**あり、そこへ直交する軸(archetype×personality)を足すと分岐が掛け算になる
- 断片は句点を持たないので、句点を打つのは `_joinSentences`、繋ぐのは `_concatParts`。**JAの句点を画面側に直書きしない**(§33の規約)。EN ではピリオド+半角スペースになる
- `featured` が居ない団体(「看板を担う選手がまだ定まっていない。」)では足さない

### 47-3. シードに選手idを混ぜる理由

既存の `_orgSeed = (season*100) + strHash(orgId)` をそのまま使うと、**同じ団体はエースが交代しても同じ人物描写のまま**になる(団体しか見ていないシードなので当然)。`(_orgSeed >> 5) + featured.id` にして「誰がエースか」に追随させた。`>> 5` は `_buildAceCopy`(seed 直値)・`_buildLeadSentences`(`>> 3`/`>> 6`/`>> 9`)と引き当てがぶつからないようにするため。`Math.random()` は使わない——**同一シーズン中は固定**(週送りで文面だけがちらつかない)という性質が `_seedBase` から継がれるので、裁定C-2の「表示専用なら Math.random 可」に頼る必要がない。

### 47-4. 台帳は「末尾追記」で足す(extract-ui を回さない)

プール要素は `WM_I18N.t()` の**静的第1引数ではない**(`WM_I18N.t(_pickSeed(pool, seed))`)ので `test/i18n-extract-ui.js` には原理的に載らない。§39/§40と同じく `kept:true` + `note` で ui-ledger へ手追加する。

**ただし `node test/i18n-extract-ui.js` は回さないこと**。過去バッチが末尾へ手追加した約130行が未ソートのまま残っており、再実行するとそれらがソートで一斉に動いて **1,472行の移動差分**が出る(並行タスクとのコンフリクト源。意味的な差は0で、実害はコンフリクトだけ)。今回は「HEADの並び + 末尾に28行」で書き、差分を **+336行 / −0行** に閉じた。台帳の並びを直すなら、それだけを目的にした単独コミットで行う。

### 47-5. `personality` の `shy` にはプールが無い(仕様として据え置き)

`persMap` は bold/quiet/easygoing/earnest/emotional/normal の6キーで、**`shy`(5名)が最初から無い**。`persMap[pers] || []` に吸われてアーキタイプ側のプールだけで引くので実害はない(`normal` 34名も同じ経路)。**JA原文を1文字も足さない**のが本タスクの前提なので、新規の `shy` 用文面は書いていない。増補するならセリフ委譲(Opus)の枠で、JA→EN を同時に起こす。

### 47-6. 検証

| 検証 | 結果 |
|---|---|
| `node --check src/ui-render.js` | ✅ |
| `node test/ja-golden.js` | ✅ 完全一致(`3466a6ff…` 不変。UIのDOM文字列は元々対象外だが、削除がエンジン側へ波及していないことの確認) |
| `node test/i18n-build-dict.js` | ✅ ui **4,715**・**未訳0**(4,687→4,715、+28) |
| `node test/i18n-ledger-consistency-test.js` | ✅ 重複17件・訳文一致 |
| `npm test` | ✅ **265/265** |
| `node test/i18n-ratchet.js` | ✅ 増加なし。ui-render.js **974→968(−6)** = `STYLE_META.desc` 削除分ちょうど。`--update` で基準を焼き直した |
| JA UI走破 | ✅ PASS・**336手**・digest **`b3b7a2c05a7e6016`**(基準と一致。操作列なので不変) |
| EN UI走破 | ✅ PASS・399手・**i18n-miss 0** |
| ランキング画面の実UI検査(Playwright `page.evaluate`) | ✅ JA/EN とも4カード全てのエース欄に人物描写1文あり・EN に日本語0・末尾が句点/ピリオド・`.rp-ace` の `scrollHeight===clientHeight`(はみ出し0) |

### 47-7. 訳出した28本(記者の地の文。感嘆符なし・格言化なし・具体表現)

| # | 分岐 | JA(原文・不変) | EN |
|---|---|---|---|
| 1 | composed(鷹揚) | 鷹揚な物腰で団体を束ねる | She holds the organization together with an unhurried bearing |
| 2 | 〃 | 常に落ち着いた佇まいが格を生む | Her unbroken composure is what gives her stature |
| 3 | 〃 | 泰然とした空気で対戦相手を呑む | Her unshaken calm swallows opponents whole |
| 4 | ojousama(お嬢様) | 気品ある立ち振る舞いで観客を魅了する | Her graceful bearing captivates the crowd |
| 5 | 〃 | お嬢様然とした華が興行に色を添える | Her ladylike glamour adds color to the shows |
| 6 | 〃 | 上品な所作の奥に勝負師の牙を隠す | Behind her refined manners she hides a gambler's fangs |
| 7 | polite(丁寧) | 礼節を重んじる姿勢で敵すら味方につける | Her regard for courtesy wins over even her opponents |
| 8 | 〃 | 丁寧で清廉な人柄が団体の品位を作る | Her courteous, upright character is what gives the organization its dignity |
| 9 | cool(クール) | クールな佇まいで観客を引き寄せる | Her cool bearing pulls the crowd in |
| 10 | 〃 | 冷ややかな眼差しが対戦相手を凍らせる | Her cold gaze freezes opponents where they stand |
| 11 | 〃 | 感情を見せない戦い方が逆に怖い | The way she fights without showing emotion is what makes her frightening |
| 12 | delinquent(ヤンキー) | 不良性感度の塊で観客を煽り続ける | She is all outlaw charisma, and she works the crowd with it without letup |
| 13 | 〃 | 荒っぽい振る舞いが団体の毒気を担う | Her rough conduct is where the organization gets its venom |
| 14 | 〃 | ルールの外側で観客を熱狂させる | She sends the crowd into a frenzy from outside the rules |
| 15 | seductive(蠱惑) | 妖艶な魅せ方で他団体にはない色を添える | Her sultry showmanship adds a color no other organization has |
| 16 | 〃 | 艶のある立ち姿が独自のファン層を呼ぶ | Her alluring stage presence draws a fanbase all her own |
| 17 | standard(標準) | 素直な人柄が選手会の核になっている | Her honest, unguarded character is the heart of the locker room |
| 18 | 〃 | 飾らない佇まいが逆に絵になる | Her unadorned presence is precisely what makes her a picture |
| 19 | bold(強気) | 物怖じしない発言で常に火種を撒く | Her fearless remarks are forever scattering sparks |
| 20 | 〃 | 気の強さでカードを引っ張る | She carries the card on sheer nerve |
| 21 | quiet(寡黙) | 多くを語らず試合で全てを示す | She says little and shows everything in the ring |
| 22 | 〃 | 寡黙さの裏に確かな圧がある | There is real pressure behind her silence |
| 23 | easygoing(お気楽) | ゆるい空気で控室の緊張を解く側 | She is the one whose easy mood loosens up the locker room |
| 24 | 〃 | 飄々とした雰囲気が独特の間合いを作る | Her breezy detachment creates a spacing all her own |
| 25 | earnest(真面目) | 真面目さがそのまま強さに直結している | Her diligence translates straight into strength |
| 26 | 〃 | 愚直な姿勢でチームを牽引する | She leads the team by plain, dogged effort |
| 27 | emotional(感情的) | 感情の振れ幅で試合をドラマに変える | The swing of her emotions turns matches into drama |
| 28 | 〃 | 熱が乗ったときの爆発力が桁違い | When she gets fired up, her explosiveness is on another level |

## 48. Stage B P7-48 — 派閥名EN露出「最後の族」: F06/F09/showFactionEventResult汎用経路+internalChallenge+DB派閥タブ+相関図+業界ニュース15種(2026-09-06追加)

§45-4・§46が「範囲外」として残していた最後の族を解消した回。`grep -n "factionName|faction\.name|\.factionName|leaderName" src/ui-common.js src/factions.js src/app.js src/ui-render.js`(305行)を全数分類し、約30箇所を`_factionDisplayName()`(または人名箇所は`pn()`/`pnSurname()`)へ差し替えた。内訳はdocs/worklog.md冒頭のP7-48エントリの表を参照。**新しいi18nパターンは2つ増えた**(48-1・48-2)。

### 48-1. `showFactionEventResult`(汎用結果モーダル)自身で塞ぐと、呼び出し元を数えなくてよい

§45-3は「使用箇所ごとに包むと分岐追加のたびに再発する」教訓を`applyF07Choice`(destructuring直後の一括変換)で示したが、今回はさらに一段上——**表示関数自身(`showFactionEventResult`)が`opts.factionName`/`entry.factionName`を受け取った直後に`_factionDisplayName()`を通す**ことで、F03/F06/F08/COMMON_1/4/5/7という**7つの呼び出し元すべて**を1箇所の修正で救った。呼び出し元(`app.js`の`handleFactionEvent`)は生JAの`payload.factionName`をそのまま渡し続けてよい——「表示直前の変換は表示関数の責任」という分担が明確になる。ただし全ての生成元(payload構築側)まで免除されるわけではなく、`resultText`のように**表示関数に渡る前に文字列として完成してしまう値**(次項48-2)は生成元(`factions.js`の`apply*`関数)側で変換するしかない。

### 48-2. `resultText`は完成文なので生成元(`apply*Choice`)側で変換するしかない。ただし保存対象の`factionName`自体は生JAのまま返す

`Engine.factions.apply{F01,F03,F04,F05,F06,F08,Common1,Common4,Common5}Choice`系はpayloadから`factionName`/`factionAName`/`factionBName`を分割代入し、`resultText`/`impactSummary`という**その場で完成する文字列**へ`WM_I18N.t()`のパラメータとして埋め込む。表示関数側でいくら塞いでも、この文字列はもう「派閥名」という構造を持たないただの完成文なので後から変換できない——生成元での変換が必須。

2つのサブパターンがある:
- **戻り値に`factionName`自体を含まない関数**(`applyF04/F05/F06/F08Choice`、`applyCommon4/Common5Result`): destructuring時に`factionName: _xxxRaw`とリネームし、`const factionName = this._factionDisplayName(_xxxRaw)`で同名変数に上書きする(`applyF07Choice`と同型)。以降の全使用箇所が自動的に変換済みになる
- **戻り値の`factionName`自体がG(セーブ)へ焼き込まれる関数**(`applyCommon1Choice`の`bookedCommon1.factionName`、`applyCommon1MatchResult`の`G._pendingCommon1Result.applyResult.factionName`): D-P6-4「セーブ内の名前はJAのまま」を守るため`factionName`自体は生JAで返しつつ、`const factionDisp = this._factionDisplayName(factionName)`という**別名の表示専用変数**を用意し、`resultText`/`impactSummary`の完成文だけそちらを使う。1つの関数の中で「保存用の生値」と「表示用の変換値」を明確に分ける

### 48-3. `pn()`誤用の再発パターン(F09・internalChallenge)は依然として多い

`_factionDisplayName`が存在するのに`WM_I18N.pn(faction.name)`(人名辞書引き、「{surname}派」形式には無効)を書いてしまう誤用が、F09の4モーダル(`showFactionF09OpeningModal`/`EndingModal`)・internalChallenge(下剋上)の2モーダル・`_dfcRenderCard`(データベース派閥タブ)・`_renderDbFactions`で計8箇所見つかった。**F08系(`getF08PreMatchData`)は同じ誤用をP7-44で対策済み**だったため、「兄弟モーダル(F09/internalChallenge)は同じ罠に落ちたまま」という構図——新モーダルを書くときは「派閥名は`_factionDisplayName`、個人名は`pn`」を機械的にチェックリスト化する価値がある。

### 48-4. `showFactionEventResult`の`opts.impactSummary`は元から画面表示されない(発見・実装変更なし)

関数自身のJSDoc(「impactSummary は受け取るが画面表示しない」)どおり、`opts.impactSummary`はどこにも描画されていないことをコード読解で確認した。表示されるのは`opts.resultText`のみ。今回は`resultText`と同じ変換済み変数を`impactSummary`のラベルにも使い回したため実質差分は無いが、**`impactSummary`だけの露出は画面には出ないため優先度を上げる理由にならない**(`applyF02Choice`のB/C分岐に残る同型の生JAラベルを今回あえて放置した根拠)。`_renderCommon1MatchResult`(Common-1試合結果画面)だけは例外的に`applyResult.impactSummary`を実描画するので、そちらは実害があった。

### 48-5. 業界ニュース(newspaper)の派閥名露出は表示関数群と別の穴で、`_wmResolvePreformattedIndustryData`に一括変換ヘルパーを新設

§45-2(P7-43)は`Engine.newspaper.generate()`の汎用記事化経路(`_wmFillWithDict`)を直したが、**値そのもの**(`data.winFaction`等)が「{surname}派」の生JAだと、`_wmFillWithDict`のconvertNamesは名前辞書の完全一致しか見ないため変換されない——`_wmDictLabel`/`_wmTitleName`が既に対処した「成形済み値の構造穴」(§6)と同じ形。今回は`app.js`/`factions.js`の`push`側(15種の`type`)を1つずつ直さず、**`management.js`の`_wmResolvePreformattedIndustryData`にswitch文の手前で一括変換する`_wmResolveFactionNameFields(data)`を新設**し、既知のフィールド名(`factionName`/`factionAName`/`factionBName`/`newFactionName`/`winFaction`/`loseFaction`/`fromFaction`/`toFaction`)を`Engine.factions._factionDisplayName()`で変換する形にした。`Engine.factions._factionDisplayName`はグローバル`WM_I18N`を直接参照する設計(§10で確立済み)なので、`dict`引数を経由しない——JAではdict未指定と同じ経路(fail-open)を通るため1バイト不変。

### 48-6. 検証

| 検証 | 結果 |
|---|---|
| `node --check`(app.js/ui-common.js/ui-render.js/factions.js/management.js) | 全OK |
| `node test/ja-golden.js` | 完全一致(`3466a6ff…`不変) |
| `node test/i18n-ledger-consistency-test.js` | ok(重複17件、訳文一致) |
| `node test/i18n-ratchet.js` | 増加なし(31ファイル・27,929行) |
| `npm test` | 265/265(isolated eval方式のF09関連テスト2本が`_factionDisplayName`未注入で失敗→依存関数のソースを一緒に評価対象へ含める1行修正で解消) |
| `node test/auto-sim.js 20 42` | ALL CLEAR・**指紋96492883不変** |
| JA UI走破 | PASS・367手・digest `7b3faff2792abc0f` |
| EN UI走破(`--ja-exposure-log`) | PASS・399手・digest `a21c9e961ea228ed`(操作列不変)・i18n-miss 0・**JA露出142件のうち「派」を含むもの0件**(全画面横断で機械確認) |
| ignite `faction-ignite`(JA) | PASS |
| ignite `faction-ignite`(EN) | 既存FAIL(P7-30)。digest `62a61bb9eb424fd8`が前後で完全一致=退行なし。原因は48-7参照 |

### 48-7. faction-ignite EN igniteの既存FAILの原因(直していない)

`test/ui-walkthrough/scenarios.js`の`_makeFactionIgniteBoost`が、興行準備の選手ピッカースロット(`_spOpenPicker`)の**表示テキスト**とfixtureの**生JAリーダー名**を`.includes()`で比較して編成完了を判定している。EN実行時はスロット表示が`WM_I18N.pn(f.name)`でEN変換されるため一致せず、無限に`_spOpenPicker`をクリックし続ける。直すには`src/ui-render.js`の`.sp-fighter-name`へ識別属性を足し、`test/ui-walkthrough/driver.js`の`listCandidates()`にそれを読む新規メタデータフィールドを追加する必要がある。**既存の`data-fighter-id`属性は使えない**——`driver.js`の`actionScore()`がこの属性を持つ要素へ無条件で8250点を与える(P7-22)ため、show-prepの編成済みスロット全部に足すとJA/EN共通の通常走破でも最優先候補になりうる、digestを変える恐れがある。安全な実装には`actionScore()`が参照しない新規属性名が要り、これは`test/ui-walkthrough/driver.js`/`scenarios.js`という他バッチが専任するtest/配下への変更になるため、今回は原因特定のみに留めた。
## 49. Stage B P7-46 — 財務明細ラベル `weeklyFinance[].details[].label` の残存JA露出4件を修正(2026-09-06追加)

P7-31 §44-5-発見1が起票した「財務タブの明細ラベルが6箇所で生JAのまま描画される」は、**着手時点で前提が崩れていた**。P6-13(2026-09-04)が`Engine.season.processSettlement(G, dict)`を`_wmFillWithDict`でdict-opts化済みで、`weeklyFinance.details[].label`は**settlement時点(tickWeekの`opts.dict`)で言語別の完成文として焼かれる**設計に既に切り替わっていた。表示側6箇所(ui-render.js)が`d.label`を素通しで描画するのは**正しい実装**であり、§14-3(追加フィールド方式)は**適用しない**と判断した。

### 49-1. §14-3ではなく§12-3(dict-opts + `_wmFillWithDict`)が既に正解だった理由

§14-3が要るのは「選出が`Math.random()`等の非決定要素に依存し、表示時点で同じ値を再生成できない」族(PPV煽り・年代記narrative)。`weeklyFinance.details`はこれに該当しない — `Engine.tickWeek(G, opts)`の呼び出し時点で`opts.dict`(=`WM_I18N.t`)が既に揃っており、`processSettlement`内で`_wmFillWithDict(dict, tpl, params)`へ通すだけで**その場で確定的に**言語別の完成文が作れる(構造規約1「Engineは WM_I18N を呼ばない」は、Engineが`WM_I18N`を直接importしないという意味であり、呼び出し元が関数として注入した`dict`を呼ぶことは違反しない — §6のdict-opts方式全体がこの原則で成立している)。

そのため`label`自体は**言語非依存の不変値ではなく、settlement時点の言語で確定した完成文**になる(旧来の`_wmFillWithDict`系フィールドと同じ扱い)。言語を後から切り替えても、**過去に確定した週の`label`は再翻訳されない**(settlement時点の言語のまま凍結される)。これは§14-3の「JAは不変・EN切替は表示時」とは異なる契約だが、CLAUDE.mdのプロジェクト方針(ゲーム内言語切替は稀な操作で、週次決算は都度再生成される)のもとでは実害がない。**旧セーブ/旧言語で確定した過去の`financeHistory`行がその言語のまま残るのは仕様**(実機確認バックログに記載)。

### 49-2. それでも見つかった4種の実バグ(いずれも「dict-opts化されているのに一部だけ生JAが残る/JA前提の後処理が壊れる」型)

1. **`popTag`(management.js processSettlement、プロモ収入明細)が`_wmFillWithDict`を経由していなかった** — `` ` 人気+${Math.round(pi.popGain*10)/10}` ``という生JAの文字列を組み立ててから、既にdict()を通した外側テンプレの`{popTag}`へ値として差し込んでいた。外側テンプレ自身は正しく訳されるため一見気づきにくいが、EN実行時は`Promo Income (... Popularity/人気+2.1)`のように**値の中だけJAが残る**(§14-2型: 値そのものが未翻訳)。修正は`popTag`自身も`_wmFillWithDict(dict, ' 人気+{v}', { v })`で組み立てる(プレースホルダを持つ値なので`_wmDictLabel`ではなく`_wmFillWithDict`を使う)。新規キー` 人気+{v}`をui-ledgerへ手追加(`EN: " Popularity +{v}"`)。dict省略時は`fillTemplateVars`がPH充填のみ行うため、JA出力は1バイト不変
2. **会場費明細に`category`が付いていなかった**(P7-33 §8-4が「今回は据え置き」と明記していた積み残し)。`Survival.estimateWeeklyNet`(app.js)が`d.label.includes('会場')`という**完成文の部分一致でUI分岐**しており(構造規約5違反)、EN実行時は`label`が`"Venue Cost (...)"`になるため一致せず、サバイバルパネルの週間収支見積りの会場費が常に0円として計算される潜在バグだった。選手給与の`category:'salary'`(Stage A P3a-3 D-G4)と同じ流儀で`category:'venue'`を新設し、`estimateWeeklyNet`の判定を`d.category === 'venue'`(旧セーブ=`category`未設定のときだけJA部分一致へfail-open)に切替
3. **表示側の正規化ヘルパーがJA前提の文字列加工だった**(`_normalizeFinanceLabel`/収入タブのカテゴリ内サブラベル剥がし)。`label.startsWith('会場費')`・`label.replace(/（.*?）/g,'')`(全角括弧固定)・`label.replace(/^(グッズ収入|メディア収入|プロモ収入)/,'')`はいずれもJAリテラル/全角括弧前提で、EN実行時は素通りする。**JA前提の正規表現がEN実行時にただ素通りするだけなら実害は小さい**(グルーピングが少し粗くなる程度)が、**「先頭だけ剥がして末尾だけ剥がさない」ような非対称な加工を書くと文字列が破損する**(実際に`_normalizeFinanceLabel`とは別の「収入タブのサブラベル剥がし」の初版修正で`"Promo Income (Saeko Iijima ... +2.4)"`が`"(Saeko Iijima ... +2.4"`(先頭の`(`が残り末尾の`)`だけ消える)という壊れた文字列になる回帰を自己レビューで発見・修正した)。**教訓: 剥がす/剥がさないは必ずセットで判定する**(先頭・末尾どちらか一方だけ一致した状態を許さない。本件は「先頭と末尾が両方そろっているときだけペアで剥がす」ガードで解決)。`_normalizeFinanceLabel`は第2引数`category`を追加し、`category==='venue'`を最優先判定にした(旧セーブ向けのJA文字列判定はfail-openとして残す)
4. **`_pendingMediaIncomes[].label`(対抗戦/挑戦状のメディア収入、app.js)が団体名だけpn()訳・地の文prefixは生JAのまま**だった(`docs/i18n-coverage-report-v0.1.md` §8-3が「対抗戦出演料」として指摘していた積み残し3箇所)。調査の結果`_pendingMediaIncomes`は`industryNews`のような複数週にわたる永続キューではなく、**「前週イベント→翌週processSettlementで消費して即delete」の1週限りの繰越値**(management.js:13857で消費後に削除)と判明。隣の団体名部分は既にP7-6が「生成時翻訳のリスクは実質的に無い(ゲーム内で言語切替が起きないため)」という判断でpn()生成時翻訳を採用していた実績があり、同じ判断をprefix全体に広げても矛盾しない。3箇所とも`` `挑戦状 vs ${WM_I18N.pn(orgName)}` ``型の手動`pn()`呼び出しから`WM_I18N.t('挑戦状 vs {org}', {org: orgName})`(D-P6-2のパラメータ値自動変換で団体名も同時に訳される)へ統一した。management.js側の消費点(`_wmFillWithDict(dict, 'メディア収入（{label}）', {label: pm.label})`)は無改修——`pm.label`が生成時点で既に完成した言語別テキストになるため、そのまま挿しても正しく動く。**注意: この判断は`_pendingMediaIncomes`固有**(1週限りの短命値)であり、`元所属団体`/AI団体ブレークスルー`{detail}`3種のような`industryNews`永続キューに載る値には適用できない(§8共通所見のとおり据え置き)

### 49-3. 副産物として見つかった既存訳のIncome/Revenue不一致(未修正・据え置き)

収入タブの「メディア収入」「グッズ収入」は**カテゴリ見出し**(`WM_I18N.t('メディア収入')`)が`"Media Income"`/`"Merch Income"`と訳されている一方、**個別明細のテンプレ**(`メディア収入（週次）`等)は`"Media Revenue (Weekly)"`のように`"Revenue"`と訳されており、同じJA原文「メディア収入」が文脈によって異なる英単語に訳されている。§47-2-3の剥がし処理はこの不一致を検知すると安全側(剥がさずd.labelを全文表示、例:「▼ Media Income」の下に「└ Media Revenue (Weekly)」)にfail-openするため実害はないが、見出しと項目名が並ぶと語感の不統一が目立つ。訳語調整はKeisukeの語彙判断が要るため本バッチでは触れず、次のEN検品バッチへの申し送りとする(`プロモ収入`は両方とも`"Promo Income"`で一致しており対象外)。

### 49-4. 検証

`node test/ja-golden.js`(hash `3466a6ff87e94cf3f2e5683f7f50b9d8bc198e0c91ab0adb83578e12fce1037b`不変)/ `node test/i18n-build-dict.js`(ui-ledger 4,715→4,719・未訳0)/ `node test/i18n-ledger-consistency-test.js` / `npm test`(265/265)/ `node test/i18n-ratchet.js`(増加なし)/ `node test/auto-sim.js 20 42`(ALL CLEAR・指紋`96492883`不変・台帳検査3種すべて違反0)/ Playwright(page.evaluate、実ワークツリーを配信する専用サーバ経由。共有launch.jsonの`dev`構成は別ディレクトリ(mainツリー)を配信していたため使えなかった)でEN財務タブ(収入/支出両タブ、`period='all'`でシーズン跨ぎ集計)にJA文字が無いこと・懸垂括弧の破損が無いこと・JA側は同一seedで従来と同じ行数・同じグルーピング結果になることを実測 / `npm run test:ui:walkthrough`(JA、336手・digest`b3b7a2c05a7e6016`基準と完全一致)/ `npm run test:ui:walkthrough:en`(EN、i18n-miss 0・Issues 0)

## 50. Stage B P7-52 — 台帳未収載の残り最終仕分け・`fighter.careerHistory`/引退モーダル/交渉見通しラベル/実績labelへの§14-3・dict-opts適用、match-engine.jsの前提訂正(2026-09-06追加)

`docs/i18n-coverage-report-v0.1.md`の未収載491件(実質324件)を全数最終仕分けした(P7-52)。詳細な内訳・修正一覧は同レポート§9を参照。本specには**新規に適用したパターン**と**既存記述の訂正**のみ記す。

### 50-1. `fighter.careerHistory`は§14-3(追加フィールド方式)がそのまま当てはまる新しい適用例だった

`generateBackstory`(旗揚げ時の経歴デッち上げ、management.js)と`Engine.growthEvents`(実プレイ中のブレークスルー/スランプ/モチベ喪失)がフィールドへ書き込む`careerHistory.push({type, season, week, detail: '完成JA文'})`は、`detail`が生成時点でJA完成文として選手データ(セーブ)へ永続する点で、§43-1の`growthLog[].detail`と全く同じ型だった。同じ処方箋(`detail`は不変のまま`detailTpl`/`detailVars`を追加フィールドとして併記し、表示点で`entry.detailTpl ? dict(entry.detailTpl, entry.detailVars) : entry.detail`にfail-open)を適用した。表示点は2箇所あり(`Engine.milestone.get`の`careerHist`変換ループ、`ui-common.js`の「経歴」タブ直描画)、両方を同じ条件式で統一した。

### 50-2. `Engine.retirement.buildCareerSummary`は§13-1(表示時再生成)型 — dict省略時は既存呼び出し元を無改修で保つ

`buildCareerSummary(fighter)`は`fighter.careerRecord.history`(構造化データ)から**呼ばれるたびに**組み直す関数で、戻り値はどこにも永続しない。§13-1の「表示時に再生成できるならdict-optsで足りる、追加フィールドは要らない」の典型例。第2引数`dict`を新設し、`_wmDictLabel`/`_wmFillWithDict`で組む形に変更。**`dict`省略時は既定で`undefined`のまま`_wmDictLabel(undefined, ja)`/`_wmFillWithDict(undefined, tpl, params)`を呼ぶことになるが、両ヘルパーは`typeof dict === 'function'`でガードしているため安全にJA原文へfail-openする**(既存の非UI呼び出し元、`Engine.executeShow`内の1箇所は無改修のまま動作が変わらない)。

### 50-3. `getRateLabel`/実績`label`/選択肢`hint`は「dictへ渡す前に台帳が空」型ではなく「配線はあるが訳語が無い」型

この3件は既に(あるいは今回の消費点修正で)`WM_I18N.t()`を正しく通っているのに、**該当するJA原文がどの台帳にも1行も無かった**ために結果的に未訳のままだった。§10-2が警告する「関数本体に直書きされた配列は抽出器から見えない」型の一種だが、原因は動的キー化ではなく単純な**未収載**である。ui-ledgerへ手追加するだけで解決する(コード側の配線自体は`getRateLabel`とE6 hintでは変更不要、実績labelのみ`escHtml(it.label)`→`escHtml(WM_I18N.t(it.label))`の1行修正が必要だった)。

### 50-4. 前提の訂正: match-engine.jsの試合実況ログは表示されている

`docs/i18n-coverage-report-v0.1.md`表5(§5)の「match-engine.js(48/451字): `T{turn}:`接頭の実況トレース文。実際の観戦画面に出る実況ログか内部トレースのみかは要確認」という**未確認のまま「表示されない」に倒して棚卸し対象から外していた**判断を、P7-52で追跡した結果**誤りと判明**した。`pushLog()`/`log.push()`が積む文字列は`logLines`としてフレームに記録され、`battle-engine-main.js`/`tag-battle-main.js`の`_appendLogForFrame()`が`fr.logLines`を`#battleLog`へ直接innerHTML注入している——**Engineが生成した生JA文字列がそのままDOMへ渡る、§1(Engine純粋関数)とは別の軸で見ても典型的な未対応箇所**。件数(約90箇所のpushLog呼び出し)と、ログ行の生JA文字列に依存する演出分類ロジック(`.includes('★ 決着')`等、§8-2で個別に危険パターンとして温存してきたもの)が絡み合っているため、**この1バッチでは着手せず**`docs/i18n-keisuke-rulings-pending-v0.1.md` C-6として設計相談を起票した。次にmatch-engine.jsのログを扱うバッチは、この節と§8-2の危険パターン一覧を先に読むこと。

> **→ P7-53(2026-09-06)で解消済み。仕様は §51 を参照**(実測は約90箇所ではなく`log.push` 16 + `pushLog` 33 = 49呼び出し / 52テンプレだった)。

---

## 51. Stage B P7-53(裁定C-6) — 観戦モードの試合実況ログ(2026-09-06追加)

`match-engine.js` の両エンジン(`Engine.battle.simulateMatch` / `Engine.tagMatch.simulateTagMatch`)が積む実況ログ52本(single 24 / tag 28)を `data.js` の `BATTLE_LOG_TEMPLATES` へ移設し、観戦モード(`battle-engine.html` / `tag-battle.html`)の表示点で言語別に組み直す形にした。**JA出力は1バイト不変**(実試合18,615行+凍結コピー2,808通りで差異0。証明の詳細は `docs/worklog.md` の P7-53 エントリ)。

### 51-1. 消費経路

- 表: `BATTLE_LOG_TEMPLATES.single` / `.tag`(data.js トップレベル、`test/i18n-extract-templates.js` の TARGET_TABLES 登録済み)
- 生成: `pushLog(id, params)`(両エンジンのローカル関数)。`log.push(fillTemplateVars(tpl, params))` で**JA完成文を従来どおり `log` へ積み**、並走する `logTpl` / `logVars` / `logCls` / `logSpoiler` へ同じ添字でメタを積む
- フレーム: `logLines`(JA・従来から不変) + `logLineTpls` / `logLineVars` / `logLineClasses` / `logLineSpoilers`
- 表示: 観戦iframeの `_logRecords(fr)` → `_logRecordText(rec)` → `_logLineHtml(rec)`。`rec.tpl ? WM_I18N.t(rec.tpl, rec.vars) : rec.text`
- **Engineは `WM_I18N` を呼ばない**(§1)。辞書を引くのは iframe(UI層)だけ

`{name}`/`{move}` は `t()` のパラメータ値自動変換(D-P6-2 / P7-5)で名前辞書・技名辞書を通るので、値の変換配線は不要。`{phase}` は `'Opening'/'Mid'/'End'/'Climax'` で元から英語。

### 51-2. dict-optsが使えない族 — 「生成がEngine層の奥で起きるので dict が渡せない」

指示書の初期案は dict-opts(`opts.dict` を糸通しして翻訳してから充填)だったが、**呼び出し元を数えた結果それでは塞がらなかった**。`recordFrames: true` の呼び出し元は10箇所(app.js 6 / management.js 4)あり、うち**ジュニアTNと天頂戦は `tickWeek` の中で事前シミュレートされる**。tickWeek は Engine 層で `WM_I18N` を持てない(§1)ため、この2経路に dict を渡す手立てがない。しかもその `frames` は `G.juniorTournament.rounds[].matches[].frames` 等として**セーブへ永続する**ので、生成時に翻訳して焼くと「ENでセーブ→JAで再生」がEN表示になる(§14-3が禁じる形)。

**したがって §14-3(追加フィールド方式)を採る**。§14-3 は元々「`Math.random()` で選ぶので表示時再生成が使えない」族のために作られた形だが、**「生成がEngine層の奥で起きるので dict を渡せない」族にもそのまま効く**。判定は「dictを渡せるか」ではなく次の2問:

1. その完成文は**セーブへ永続するか**(する → §14-3 / しない → dict-opts か表示時再生成)
2. 生成点まで**UI層から dict を糸通しできるか**(できない → §14-3)

どちらか一方でもNoなら §14-3。逆に「呼ばれるたびに組み直せて、永続しない」なら §13-1(表示時再生成)で足りる。

### 51-3. 完成文の部分一致による演出分類は生成元でIDに固定する

§8-2 が「危険パターン」として温存してきた3箇所を撤廃した。

| 旧判定 | 新 |
|---|---|
| `_SPOILER_LINE_RE`(★・キックアウト・カットイン・見殺し・丸め込み等) — ピンシーケンス中に伏せる行の判定 | `frames[].logLineSpoilers[i]` |
| single `_logLineHtml` の `startsWith('★') \|\| includes('時間切れ')` | `frames[].logLineClasses[i]` |
| tag `_logLineHtml` のフォールバック7分岐 | 同上 |

正は `data.js` の **`BATTLE_LOG_LINE_KINDS`**(テンプレIDごとに `{ cls, spoiler }`)。**1つのIDに1つの分類**という形にしたので、pushLog 側は `cls` を手渡さない(タッグは従来第2引数で渡していた)。旧判定は「配列を持たない旧フレーム(旧セーブのJT・天頂戦リプレイ)」専用のフォールバックとして残すが、**JA原文(`rec.text`)に対して掛ける** — 表示文はENでは一致しない。

- **等価性は機械証明する**。実試合25,131行について旧正規表現/旧`startsWith`の判定と新配列が全行一致(不一致0)であることを確認した
- **`fr.logLines.indexOf(line)` で引くのは不可**。同一ターン内に同じ文が2行出ると先頭のクラスを取り違える(P3a-3 D-G4 のタッグ実装にこの穴があった)。**行レコード(`_logRecords`)で添字ごと運ぶ**

### 51-4. 分岐は完全文で持つ(構造規約3)— 決着種別を値で差し込まない

`{finType}`(フォール/ギブアップ/TKO)や「大ダメージ」注記・「透かし後の反撃」注記・タッチ種別(戦術/消耗)は、JAでは値の差し替えで足りるが**英語では語順と前置詞ごと変わる**("wins by pinfall with X" / "wins by submission with X")。§14-2 の `_wmDictLabel`(値だけ訳す)ではなく、変種テンプレへ展開した。JA 49呼び出しに対しテンプレは52本(+3)。

### 51-5. 到達しない枝は凍結コピーで担保する

`tag.downTko`(ターン開始時にHP≤0を検出するセーフティネット。本来はダメージ発生箇所で決着するので通常は踏まない)は実試合の総当りでも到達しない。**`test/battle-log-template-test.js`** が移設前のJSテンプレートリテラルを凍結コピーとして持ち、代表値・境界値の直積を**表の全キー**へ通す(2,808通り)。`BATTLE_LOG_LINE_KINDS` のキー集合が表と一致すること、`cls` が観戦側CSSの既知クラスのみであることも同テストで検査する(片方だけキーを足すと既定値へ黙って落ちるため)。

### 51-6. 「ソースの形を見る契約テスト」の更新(§42-7 の3例目)

`test/match-timeout-no-draw-test.js` が `source.includes('時間切れ判定により、${winner === ...}の勝利')` で match-engine.js のソース文字列を見ていたため、移設で落ちた。契約は「時間切れの勝者を告げる1行が存在し、実際に時間切れ分岐から積まれている」ことなので、**移設先(data.js のテンプレ)と呼び出し(`pushLog('timeout', …)`)の両方を見る**形へ書き換えた。

### 51-7. 検証(すべてフォアグラウンド実行)

`node --check`(4ファイル)/ `ja-golden` 完全一致(`3466a6ff…1037b`)/ `npm test` **266/266** / `balance-baseline` 逸脱なし / `auto-sim 20 42` ALL CLEAR・指紋 96492883 不変 / `i18n-ratchet`(data.js +51・match-engine.js −51 の移設、総数27,932不変。`--update` 済)/ `i18n-build-template-dict` 3,533キー未訳0 / `i18n-ledger-consistency-test` ok / `spectator-move-i18n-check` **ALL CHECKS PASS(77項目)** / JA走破 PASS 336手 digest `940bcd9d0515d8d0` / EN走破 PASS 401手 i18n-miss 0。

`spectator-move-i18n-check` には P7-9 からの繰り越し「試合ログ行の実況ストリップ落ち込みは判定から除く」があったが、本タスクで**撤廃**した。あわせて、実DOM `#battleLog` は再生の進み方(アニメ完了後に追記される)でサンプルが揺れるため、**描画関数 `_logLineHtml` へ全フレームを通した決定的な採取**を併置している。

## 52. Stage B P7-58 — 新聞1〜3面の「テンプレ+材料」表示時再構築(言語切替対応、2026-09-07追加)

`Engine.newspaper.generate()` は `opts.dict`(=生成時点の `WM_I18N.t`)で headline/body の完成文を `weeklyNewspaper`/`newspaperArchive` へ焼く(§14-3の背景と同じ)。これは生成時点の言語では正しいが、**発行済みの号を後から別言語で開く**(JAで進めたセーブをENへ切り替える、または逆)と、完成文が生成時点の言語のまま出る。4面(年間MVPレース)は P7-23/P7-39 で `_npMvpI18n`(表示時再生成+自己検証)により解決済みだったが、1〜3面の記事(1面トップ/業界ニュース約65種/王座交代/引退/AI団体イベント/PPV/自団体興行結果/ジュニアトーナメント特集ページ等)は未対応だった。本タスクはこれを全種類へ広げる。

### 52-1. 記事の生成メカニズムは3系統に分かれ、それぞれ別の対処が要る

| 系統 | 例 | 対処 |
|---|---|---|
| A. rngで選んだ完成文の1テンプレ+差し込み値 | 業界ニュース約65種(`NEWS_HEADLINE_TEMPLATES`)・AI団体イベント各種・引退variant・follow-up記事 | **§14-3の追加フィールド方式**。`headlineTpl`/`headlineVars`(・`bodyTpl`/`bodyVars`)を完成文の隣に併記。表示側は`WM_I18N.t(tpl, vars)`で組み直す |
| B. 季/週/選手ID/併記データだけに依存する決定的な純関数(乱数を消費しない) | `composeChampionChangeBody`・`composeUnifiedTitleArticle`・`composeHallOfFameRetirement`(新設 `composeNpcHallOfFame` を含む)・`_buildPpvSummitStory` | **`_recompose`方式**(§18-1のMVPレース自己検証パターンの発展形。ただし検証なしで直接呼び直せる — 素材が完成文ではなく生値なので、常に「今の言語で正しい」)。`story._recompose = { kind, ...元の引数 }` を併記し、表示側が同じ関数を`WM_I18N.t`で呼び直す |
| C. `Math.random()`で選ぶ(§14-3が「表示時再生成が使えない」と特定した型と同じ) | 自団体興行結果の見出し/本文(`App._generateNewspaperTexts`。`App._NEWSPAPER_HEADLINES`/`_NEWSPAPER_ARTICLES`から`Math.random()`で選ぶ) | **kurodaText系の抽出ヘルパーを拡張**。新設 `kurodaTextParts(entry, d, dict)`(kuroda-text.js)が完成文の隣に`{tpl, vars}`(=`kurodaTemplateOf`の正規化結果)も返す。生成側(app.js)はA/Bと同じ追加フィールド方式でheadlineTpl/headlineVars等を併記するだけでよい |

系統Bの `_recompose` kindは5種: `championChangeBody`(王座交代の本文のみ) / `unifiedTitleArticle`(統一王座、headline+body) / `hofRetirement`(殿堂入り引退特別号、headline+body+subhead+situation+captionExtra) / `npcHallOfFame`(NPC殿堂入り、headline+body。generate()から抽出して新設した`Engine.newspaper.composeNpcHallOfFame(h, dict)`を使う) / `ppvSummitStory`(PPV頂上決戦、headline+body+situation。`summitData`に元のsrがそのまま永続しているので追加の引数保存が要らない)。

### 52-2. 「JA成形ラベル」「季/週スタンプ」「派生値」は追加フィールドだけでは足りない

系統Aのtplは`{key}`プレースホルダへ**生の材料**を渡す設計だが、旧実装の一部は差し込む直前に**既に翻訳済みの値**(勝ち越し/決着つかず・名勝負/好勝負などのトーン語、「第N年度・第M週 ○○」のスタンプ、`Engine.formatFinish`の決着文、`injuryLabel`の負傷ラベル、「{wins}勝」のネストしたテンプレ完成値)を積んでいた。これらをそのままVarsへ持ち回ると、表示時に別言語で組み直しても**値自体は生成時点の言語のまま**残る(§6「成形済み値の構造穴」と同型)。

表示側(ui-render.js)に3つの補助フィールドを導入した:

- **`headlineLabelVars`/`bodyLabelVars`**(値が1語のJA成形ラベルで、値としても辞書を引き直す必要があるキー名の配列。§14-2の`_wmDictLabel`と同趣旨・`labelVars`は§16-1の先例と同名)。Varsには**rawのJA語**(勝ち越し/決着つかず/敗北・名勝負/好勝負/…)を積み、表示側の`_npMaterializeVars`が`_wmDictLabel(WM_I18N.t, raw)`で引き直す
- **`headlineDerive`/`bodyDerive`**(派生値の再計算指示の配列。`{key, kind, ...}`)。`kind`は4種: `injuryLabel`(`injuryLabel(raw, dict)`を呼び直す)/ `formatFinish`(`Engine.formatFinish(finType, finMove, false, dict)`を呼び直す)/ `milestoneWins`(`WM_I18N.t('{wins}勝', {wins})`のネストしたテンプレを組み直す)/ `dictLabel`(`_wmDictLabel`の汎用版。rivalLabel等)
- **`situationSuffixJa`**(「定期興行」「対抗戦」「挑戦状」「PPV GRAND FINAL」等の種別ラベル。`_wmNewsStamp`の第4引数と同じ語彙)。`story.situation`(完成文のスタンプ)の隣に併記し、表示側が号(wp)の`season`/`week`と組み合わせて`_wmNewsStamp(WM_I18N.t, wp.season, wp.week, suffixJa)`を呼び直す。スタンプの数字自体は号を跨いでも変わらない(号の季/週=そのバックナンバーの季/週)ので、記事ごとにseason/weekを複製する必要は無い
- 系統Aのうち「NEWS_HEADLINE_TEMPLATES約65種共有」経路は**生成時点の言語で一部フィールドを解決済みのdata**(`_wmResolvePreformattedIndustryData`が`injuryType`/`round`/`stage`/`championWatch`等を導出)を持つため、Vars自体をそのまま持ち回れない。story側に**未加工の`_industryRawData`**(`ev.data`)を併記し、表示側が同じ`_wmResolvePreformattedIndustryData({type, characterId, data: raw}, WM_I18N.t)`を呼び直してからテンプレへ充填する(§8「render時点再構築」を表示点でも使う形)

名前の列挙(業界ニュースのまとめ記事等)は既存の`bodyNames`(P7-30、選手名の生配列を`Engine.newspaper.joinNameList`で表示時に畳む)をそのまま踏襲。可変本数のパーツ連結(対抗戦のベストバウト追記・ジュニアトーナメント展望の断片)は`bodyParts`(`{tpl, vars, labelVars}`の配列)+ `bodyJoinTpl`(2スロットreduce)。1行ずつの合成本文(全試合詳報)は`bodyLineTpl`/`bodyLineVars`(配列)/`bodyLineLabelVars`/`bodyLineJoin`。名前+ラベルを個々にテンプレ充填してから列挙する型(準決勝敗退者一覧)は`bodyNameTplItems: {tpl, items}`。

### 52-3. 表示側の集約点 `_npResolveStory`(ui-render.js)

記事1本(`{headline, body, situation, subhead, captionExtra}`)を現在の言語で組み直す共通関数。優先順位は各フィールド独立(**バグ修正の教訓、§52-5参照**):

1. `_recompose`があり、かつそのkindの戻り値が**そのフィールドを提供していれば**それを使う
2. 無ければ Tpl系フィールド(§52-2の全種)から`WM_I18N.t`で組み直す
3. どちらも無ければ保存値のまま(旧セーブ・未対応種のfail-open)

`_npResolveWpStories(wp)`が`wp.topStory`/`wp.subStories`をまとめて解決し、`_npRenderPage1`が1面描画(`_npFrontLegacy`/`_npFrontV3`両方)へ渡す前に1回だけ呼ぶ。特集ページ(`wp.pages[1]`、ジュニアトーナメント/ドラフト総括)を描く`_renderNewspaperExtraPage`も同じ`_npResolveStory`へ委譲するよう置き換えた(旧P7-30時代の専用インライン処理は廃止)。**バックナンバー(`newspaperArchive`)も同じ`_npRenderPage1`→`_npResolveWpStories`経路を通る**ので、新旧の号を区別する特別なコードは無い。

自団体興行結果(`wp.playerShowData` = `state.currentNewspaper`)は記事ではなく専用の詳細カードを持つため、別関数`_npResolvePlayerShowData(psd)`で headline/article に加え、**独立フィールドとして直接読まれる`finishLabel`**(`_npRenderPlayerShow`が`.np-vs-finish`等3箇所で`d.finishLabel`を直読みする)も`finType`/`finMove`から再計算する。

### 52-4. `draftRoundup`(業界紙のドラフト総評)は新聞generate()の外にも同型の穴があった

`ui-common.js` `_queueDraftIndustryNews`が`draftRoundup`イベントを`_industryNewsEvents`へ積む際、`WM_I18N.lang === 'en'`を直接見て「名前（ティア）」の完成文(`data.names`)を**キューへ積む時点**で焼いていた(全角括弧+読点=JA / 半角括弧+カンマ=EN)。このイベントは最大`INDUSTRY_CARRY_MAX_AGE`週(3週)キューに滞留しうるため、滞留中に言語を切り替えると`generate()`側のdict糸通しを迂回してJAのまま出る(§8と同型の穴。新聞generate()の外で起きていたので§52-1の3系統整理には現れない第4の穴)。

修正: `namesRaw`(`{name, tier}`の生配列)だけをキューへ積み、`_wmResolvePreformattedIndustryData`に新設した`case 'draftRoundup'`が実際に紙面へ載る瞬間に`ARTICLE_COMPOSE_TEMPLATES.tierParen`(新設、`'{name}（{tier}）'`→`'{name} ({tier})'`)+`Engine.newspaper.joinNameList`で組み直す。ティアラベルのJA原文は管理.js側の`_NP_TIER_LABEL_JA`(既存の`_NP_HOF_INDUCTED_JA`等と同じ流儀)に1本だけ置く。

### 52-5. 実装中に見つけた既存メカニズムの穴3件(ignite回帰テストが検出)

新設したignite シナリオ `newspaper-lang-switch`(§52-6)が実UI検証で以下を検出し、その場で修正した:

1. **`_npResolveStory`の「recomposeがあるかどうか」二択分岐バグ** — `_recompose`が`body`しか返さない種別(`championChangeBody`)で、`recomposed`が truthy であることを理由に`headlineTpl`の適用が丸ごとスキップされていた(headlineが生JAのまま出る)。修正: headline/body/situationを個別にfail-open(§52-3)
2. **`_npRenderPlayerShow`の繰り上げ判定順序** — `topStory.type`が自団体興行結果のとき`_npSwapMainToSecondCard`を先に呼んでいたが、この関数は対象試合が1試合しかない(`allMatches`が空)と早期returnで**未翻訳の`playerShowData`をそのまま返す**。修正: 先に`_npResolvePlayerShowData`で翻訳し、その結果を繰り上げ関数へ渡す
3. **`situationSuffixJa`を多くの記事に併記していたのに、`_npResolveStory`が一度も消費していなかった** — `situation`(スタンプ)フィールドの表示時再構築コードが単純に抜けていた。修正: §52-3の優先順位へ追加

あわせて、`_buildShowResultNewspaperData`(app.js)の`matchLabel`(`main.matchLabel || WM_I18N.t('メインイベント')`)が**表示側の同名フォールバックを常に無効化していた**(生成時点で埋めてしまうため、`_npRenderPlayerShow`の`d.matchLabel || WM_I18N.t('メインイベント')`が一度も働かない)ことも発見・修正した。シングルのメイン(`main.matchLabel`が元々undefined)は`null`のまま渡し、表示側フォールバックに委ねる。**タッグのメイン(`buildTagNewsMatch`が`matchLabel`を生成時に焼く経路)は未修正のまま残っている**(§52-7)。

### 52-6. 新設igniteシナリオ `newspaper-lang-switch`

`test/ui-walkthrough/scenarios.js`。headless-simはapp.js(UI層)を読み込まないため自団体興行結果は自然生成されない — `fixture.engineer`で系統C相当の記事(headlineTpl/bodyTpl/bodyDerive付き)を最新号+バックナンバー1件へ直接注入し、自然発生する系統A/Bの記事(業界ニュース・AI王座交代等)と合わせて検査する。`tour.jaExposureScreens: ['screen-newspaper']`で最新号+バックナンバー3件を巡回し、ENモードのJA露出0を自動ゲートにする(run.jsの既存機構)。バックナンバー送りボタンは表示文言がJA/ENで変わるため、言語非依存の`data-walk-role="np-archive-older"`属性(ui-render.js、新設。表示テキストへの影響なし=ja-golden完全一致で確認済み)で掴む。

### 52-7. 未着手の残穴(次バッチ検討事項)

1. **タッグのメイン試合の`matchLabel`**(§52-5末尾)。`buildTagNewsMatch`が生成時点で`WM_I18N.t('メインイベント')`を焼く。シングルより出現頻度が低いため今回は据え置き
2. **`story.newsData`(業界ニュースの生値スナップショット)を直接読む表示点**(週頭ポップアップの号外リード文言展開等、`generate()`のコメントに残る用途)は、`newsData`自体が生成時点の言語で解決済みの値を持つため、`_industryRawData`と同じ再解決をしていない。号外ポップアップは新聞生成と同じ週にほぼ同時に出る導線なので実害は小さいと判断し、本タスクの範囲(1〜3面+バックナンバーの表示)からは外した
3. **`subhead`/`captionExtra`**は`_recompose`(hofRetirement)経由の記事にしか無い(他の系統は元々このフィールドを使わない)ため追加のTpl化はしていない

### 52-8. 検証(すべてフォアグラウンド実行)

`node --check`(app.js/data.js/kuroda-text.js/management.js/ui-common.js/ui-render.js)/ `ja-golden` **完全一致**(`e43b8ed4a1e1c641b00e2a675e7305f4a9a8564c1fc5a8e5cf078ad202165cd3`、タスク指定基準と一致)/ `npm test` **267/267**/ `i18n-ratchet`(`_NP_TIER_LABEL_JA`新規5語・重複literal2件削除、27,646→**27,645**、`--update`済)/ `i18n-build-template-dict` 3,534キー未訳0(`ARTICLE_COMPOSE_TEMPLATES.tierParen`を新規英訳)/ `i18n-ledger-consistency-test` ok/ `auto-sim 20 42` **ALL CLEAR**・指紋 **5a09bc6e**(タスク指定基準と一致。`test/auto-sim.js`のfingerprint replacerへ§52-2の追加フィールド群を除外登録)/ ignite `newspaper-mvprace`/`newspaper-mvprace-legacy`/`opening-flow` JA/EN計6本 **PASS**(退行なし)/ 新設`newspaper-lang-switch` JA/EN **PASS**(EN: JA露出0・i18n-miss 0)/ JA走破 **PASS** 336手 digest `66852e9fac14325b`・Issues 0(タスク指定基準337手/`1b18e49b…`とは手数・digestが不一致。P7-55のworklogが記録した「336⇔337はコード差分と無関係の既知flake」と同型とみられるが、本タスクでは変更前後の同一条件比較までは行っておらず断定はできない。Issues 0=無例外・フリーズ・undefined露出0という本質的なPASS条件は満たしている)/ EN走破 **PASS** 412手 digest `645860f8ac0814f3`・Issues 0・i18n-miss **0**・screen-newspaperのJA露出**0**(2026-09-06夜メモの既存基準EN 412/645860f8と完全一致)。
