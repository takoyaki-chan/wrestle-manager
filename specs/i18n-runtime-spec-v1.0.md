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

- **対象**: `src/data.js` のセリフ系テーブル + セリフ専用ファイル8本(`victory-lines.js` `battle-lines.js` `coach-lines.js` `data-faction-dialogue.js` `flag-dialogue.js` `ppv-lines.js` `tag-battle-lines.js` `tenchosen-final-lines.js`)。`kuroda-text.js`(黒田記事・ナレーション層)・`CHAR_PROFILES`(プロフィール文)は対象外(dialogue-tone-spec-v1.0 §5、いずれもP5末尾または別工程)。**`CHAR_PROFILES`は最終的にセリフ台帳ではなくテンプレ台帳で処理した(P7-4・§16)** — セリフではなく三人称の人物紹介文であり、声の設計もアーキタイプ軸ではないため
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

### 19-2. `WEEKLY_STORY_TICKER` は gameLog専用プール — 表示はJA固定(§2-4/§12-1)

名前に反して**ティッカーには一切出ない**(`Engine.news.generateTicker` が読むのは `NEWS_TICKER_TEMPLATES`)。
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

### 30-5. 検証

`node --check`全触りファイルOK。`node test/ja-golden.js`**完全一致**(hash `6b3d05c8…`、全編集を通じて不変)。`node test/i18n-build-dict.js`台帳4,022キー・未訳4件(すべてP7-1と無関係の既存drift、ui-common.js内のセリフ的文字列でsourceタグなし)。`npm test` **260/260 green**(`stat-notation-backport-test.js`が抽出評価するvmサンドボックスに`WM_I18N`スタブが無く1件red化→スタブ追加で解消、既存47ファイルへの機械追加と同型の対応)。`node test/auto-sim.js 20 42` **ALL CLEAR**、semantic fingerprint `37bbd0cd`(P6-7/8/10/13と同一)。`npm run test:ui:walkthrough` **PASS**、ja digest **`1052faa82eaf7991`不変**。`npm run test:ui:walkthrough:en` **PASS**、i18n-miss **7件で不変**(全てNOTIF_EVENT_TEXTS/LARGE_EVENT_TEXTS由来、P7-3の担当領域で本バッチでは意図的に不触)。JA exposure合計は**186→166**(−11%)。`node test/i18n-ratchet.js`増加なし(28,089不変)。
## 31. Stage B P7-8 — 自団体興行記事(繰り上げ記事)のdict配線とフォールバック本文のテンプレ化(2026-09-04追加)

訳出**9キー**(template-ledger 2,923→**2,929**・未訳0 / ui-ledger 4,061→**4,064**・未訳0 / dialogue-ledgerは不触)。

### 31-1. 「フォールバックがJA」だと思ったら、**本体側がJA**だった

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

### 31-2. `kurodaText`は未定義プロパティを `"undefined"` として本文へ出す — 既存の try/catch の保険を殺さない

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

### 31-3. 末尾に直結する注記2変種は`{closing}`スロット+**EN訳文側の先頭スペース**

`decisive` 本文の末尾は、元コードでは三項演算子で「王座戦だった」/「敗者も意地を見せた」のどちらかが**空白なしで直結**していた。
§15-2のクラウス規約をそのまま適用し、テンプレは `…紙面に残った。{closing}` のまま、**EN訳文の側が先頭に半角スペースを持つ**。
`closing` は先に `t()` で確定させてから本文の params に載せる(充填済みなので後段の置換で壊れない)。

### 31-4. 同型の掃討 — 主力対決の黒田寸評フォールバック

`grep 'if (!comment)' / 'if (!txt)'` 系で新聞セクションの「プール空振り時の直書きJA」を全数当たったところ、
P4-5が配線した3件(`KURODA_WAR_RECORD` / `KURODA_SPOTLIGHT` / `KURODA_RELATION_NARRATIVE`)の隣に**1件だけ未配線が残っていた**
(`_npMatchupFlavorText` 空振り時の主力対決寸評3分岐)。1〜2文の短文なので、兄弟3件と同じく**インライン`WM_I18N.t()`+ui-ledger**へ寄せた
(数文の地の文である興行記事フォールバックだけを data.js のテンプレ表にする、という置き場の使い分け)。
差し込む `m.role`(`エース`/`主力`/`中堅`)は ui-ledger に既訳のある1語ラベルなので、**値として `WM_I18N.t()` で引き直す**(§14-2 `_wmDictLabel` と同じ流儀)。

### 31-5. JA同一性の証明(27,657通り+128通り・不一致0)

§15-5の作法①(凍結コピーとの全数突合)。`git show <BASE>:src/ui-render.js` から旧 `_npSwapMainToSecondCard` を切り出し、
新旧を同じサンドボックス(ja素通しdict)で回して戻り値オブジェクト全体を `JSON.stringify` で突合した。

- 実プール / **空プール(=フォールバック3分岐を強制)** / `App`なし の3系統 × 選手2組 × 勝敗4種(left/right/draw/勝敗不明) ×
  王座戦2 × MQ 6値 × ターン 4値 × 決着技2 × 観客2値 × 会場2 × season/week 3組 = **27,657通り・不一致0**
- 分岐名つきの読める形でも別途突合(draw/decisive+title/decisive+normal/noWinner × 32ケース = **128通り・不一致0**)
- `npm run test:ui:walkthrough` の **`--action-log` が旧実装と1バイト一致**(151,329 bytes・digest `1052faa82eaf7991`・328 actions)
- **走破のOverflow件数は実行ごとにブレる**(27/29/30/32を実測)。`App._generateNewspaperTexts`のMath.random()由来のノイズで、
  digest(=行動ログ)は安定している。**まれに1手ズレる実行がある**(1回だけ327手 digest `e603d4e2…` を観測。
  同一コードで再実行すると328手・digest一致に戻った)ので、**digestが違ったら再実行して再現するか先に確かめる**こと

### 31-6. P7-8で新たに見つかった穴(未着手)

- **`_buildDepthNoteV2` / `_buildLeadSentences`(ui-render.js:4863付近)の生JA組み立て** — ランキング画面(団体紹介パネル)の選手層寸評。
  条件分岐ごとの断片を `[first, second, third].join('')` で連結する型で、t()を一度も通らない。P7-6(ランキング画面)の領分として記録のみ
- **団体比較号の `d.opportunity` / `actionDescs` 等(management.js:26300付近)** — Engine内の関数に直書きされた紹介文プール(§10-2型)。
  `_npRenderOrgCompare` の紙面に出るが、テーブル化+dict糸通しが要る別枠
