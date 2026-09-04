# ENモード レイアウト溢れ 報告書 v0.1

2026-09-04。P6-9(英語対応)。**このハーネス変更は報告のみ。src/・i18n/・CSSは一切修正していない。**
実装は `test/ui-walkthrough/detectors.js`(検出ロジック `scanOverflow()`)/ `driver.js`(呼び出し配線) / `run.js`(集計レポート出力)。

## 0. 結論(先に要約)

- **緊急(進行ボタンが押せない等)は0件**。見つかった87件はすべて「読みにくい/はみ出す」の見た目の劣化で、操作不能や進行停止には至っていない
- ENでの溢れは87件、JAの素の状態(31件・後述)と比べて**+56件がEN固有の増分**。最大の塊は**選手名(固有名詞)がJA向けの固定幅ラベルに収まらない**こと(上位30件中20件超)
- `screen-week` の `wrap-height`(ボタン折り返し)10件は**JAにも同数・同じボタンが存在**しており、EN起因ではなく既存の課題と判定できた
- 検出器の弱点1件を確認: `.rd-tab-content`(ロースター詳細の育成余地パネル)が `[class*="tab"]` に誤ってマッチし、内容量が違うだけの自然な高さ差を「意図しない折り返し」と誤検出している(4件・後述§5)

## 1. 検出方式

`test/ui-walkthrough/detectors.js` に `scanOverflow(page)` を追加した。`scanText()`(既存のD3検出)と同じ呼び出し箇所(walk本編の毎ステップ2箇所+ナビ巡回1箇所)で、可視要素を3種の条件で走査する。**issuesには一切積まない=PASS/FAILを左右しない情報集計**。

| 種別 | 条件 | 意味 |
|---|---|---|
| `clip` | `overflow` が `hidden`/`clip`(または `text-overflow:ellipsis`)かつ `scrollWidth > clientWidth+2` | テキストが物理的に切れている(ellipsisで「…」に丸められる場合を含む) |
| `nowrap` | `white-space:nowrap` の要素が、横スクロールを許さない親要素の右端をはみ出している | CSSによる保護が無く、文字通り箱の外へ描画がはみ出す |
| `wrap-height` | `button`/`.nav-btn`/バッジ/タブ/チップ/ピル類の同種グループ(3件以上)内で、中央値よりおおむね1行分(line-height×0.9かつ4px超)高い | 同じ並びの他ボタンより意図せず1行多く折り返している |

要素ごとに `(screen, kind, selector, text)` で重複排除して**ユニーク要素数**を数える(同じ壊れた要素を毎手数え直して手数に比例して水増しされるのを防ぐため)。`lang` を問わず常時動くので、ja/enを別々に走らせて**同一harnessで直接差分を取れる**。

**除外した既知の疑陽性**: ニュースティッカー(`.news-ticker-bar` 配下、`animation:tickerScroll 40s linear infinite` で常時横スクロールする設計上のマーキー。テキストを2連結してシームレスループさせる仕様=overflowは意図通り)。除外前の検出では上位30件がティッカーで埋め尽くされ、他の知見が全く見えなかったため、検出器自体からこのクラスを除外した(src/は無改修、除外ロジックはtest/側)。

## 2. 実行結果

| 検査 | 結果 |
|---|---|
| `npm run test:ui:walkthrough`(JA) | ✅ PASS、Actions 328、digest=`1052faa82eaf7991`(**このタスク開始前のベースラインと完全一致・不変を確認**)、Issues 0 |
| `npm run test:ui:walkthrough:en`(EN, seed42・1季) | ✅ PASS、Actions 416、Issues 0、i18n-miss 16、season=2 week=1まで完走(1季完走維持) |
| `npm test` | ✅ 260/260 green |
| `node --check`(detectors.js / driver.js / run.js) | ✅ 全OK |

JAのdigestが完全一致していることは、`scanOverflow()` が読み取り専用(DOM変更なし・クリックなし)で、走破の手順そのものには一切影響しないことの実測証拠になっている。

**再現コマンド**:
```powershell
npm run test:ui:walkthrough                # ja baseline
npm run test:ui:walkthrough:en              # en(seed42・1季)
```

## 3. 画面別件数(JA baseline vs EN)

JAは「翻訳とは無関係に、そもそも今のCSS・データで溢れている箇所」の素の状態として使う。同じseed(42)・同じ1季分の巡回(ナビ巡回9駅×2回を含む)で比較した。

| 画面 | JA(素の状態) | EN | 差分 | 内訳(EN) |
|---|---:|---:|---:|---|
| `screen-show`(興行結果) | 12 | 39 | **+27** | nowrap=29, clip=10 |
| `screen-week`(週次ダッシュボード・ジュニア大会表など) | 17 | 35 | **+18** | wrap-height=10(**JAと同数・後述§4-3で既存課題と判定**), clip=22, nowrap=3 |
| `screen-roster`(団体・道場) | 1〜2 | 6〜8 | **+5〜6** | nowrap, wrap-height(**うち4件は検出器の疑陽性・§5**) |
| `screen-ranking`(ランキング) | 0 | 5 | **+5** | nowrap=5(EN専用に新規発生) |
| `screen-shachoshitsu`(社長室・契約交渉) | 0 | 2 | **+2** | wrap-height=2(EN専用に新規発生) |
| **合計** | **31** | **87** | **+56** | |

(JAは複数回の実走で30〜31件の間で微揺れした。原因は道場ヘッダーの掛け声フラグ`.dojo-scene-shout`が壁時計依存のランダム表示で、実走のたびにどの掛け声が画面に出ているかが変わるため。ゲーム進行のRNG=seed依存ではなく演出用タイマーの揺れであり、digest不変には影響しない。)

## 4. 上位30件(EN・確定版)と原因の当たり

```
1. [clip] screen-show | div.pb-fighter-name | "Nahoko Kawanobe" | +67px
2. [nowrap] screen-show | span.flink | "Nahoko Kawanobe" | +67px
3. [clip] screen-week | div.pb-fighter-name | "Nahoko Kawanobe" | +66px
4. [nowrap] screen-week | span.flink | "Nahoko Kawanobe" | +66px
5. [clip] screen-show | div.pb-fighter-name | "Masami Takashina" | +63px
6. [nowrap] screen-show | span.flink | "Masami Takashina" | +63px
7. [clip] screen-week | div.a1-wrap | "◆ EXTRA ◆ 週刊グラップル Issue No. 101 · Season" | +59px
8. [nowrap] screen-show | span.flink | "Chinatsu Miyagase" | +54px
9. [clip] screen-show | div.pb-fighter-name | "Chinatsu Miyagase" | +53px
10. [clip] screen-show | div.pb-fighter-name | "Honoka Anazawa" | +53px
11. [nowrap] screen-show | span.flink | "Honoka Anazawa" | +53px
12. [nowrap] screen-show | div.sp-appeal-bonuses | "🤝Even+7 ⚡ Grudge +20 🏆Title +20 📣Expe" | +52px
13. [nowrap] screen-show | div.sp-appeal-bonuses | "🤝Even+7 ⚡ Grudge +17 🏆Title +20 📣Expe" | +52px
14. [clip] screen-show | div.pb-fighter-name | "Reona Hasegawa" | +51px
15. [nowrap] screen-show | span.flink | "Reona Hasegawa" | +51px
16. [nowrap] screen-show | div.sp-appeal-bonuses | "🤝Even+3 ⚡ Grudge +2 🏆Title +20 📣Expec" | +49px
17. [wrap-height] screen-roster | div.rd-tab-content.active | "44 OVR 忠誠心 PW 48 — Lots of room to grow " | +46px
18. [wrap-height] screen-roster | div.rd-tab-content.active | "37 OVR PW 34 — Lots of room to grow SP 4" | +46px
19. [wrap-height] screen-roster | div.rd-tab-content.active | "45 OVR 忠誠心 PW 48 — Lots of room to grow " | +46px
20. [wrap-height] screen-roster | div.rd-tab-content.active | "39 OVR PW 36 +2 Lots of room to grow SP " | +46px
21. [clip] screen-week | div.jtc-fn | "Mayumi Takahashi WIN" | +44px
22. [nowrap] screen-week | span.jtc-win-tag | "WIN" | +44px
23. [clip] screen-show | div.pb-fighter-name | "Yukie Konishi" | +39px
24. [nowrap] screen-show | span.flink | "Yukie Konishi" | +39px
25. [clip] screen-show | div.pb-fighter-name | "Chiaki Kuroiwa" | +37px
26. [nowrap] screen-show | span.flink | "Chiaki Kuroiwa" | +37px
27. [clip] screen-week | div.jtc-fn | "Reona Hasegawa WIN" | +35px
28. [clip] screen-week | div.jtc-fn | "Nahoko Kawanobe" | +34px
29. [clip] screen-week | div.jtc-fn | "Mayumi Takahashi" | +33px
30. [clip] screen-week | div.jtc-fn | "Chinatsu Miyagase" | +33px
```

上位30件のうち **20件**が選手名(`pb-fighter-name`/`flink`/`jtc-fn`)、**4件**が数値バフの内訳(`sp-appeal-bonuses`)、**4件**が育成余地パネル(`rd-tab-content`、後述§5で疑陽性と判定)、**1件**が新聞見出しバナー(`a1-wrap`、後述§4-4でJA由来と判定)、**1件**が勝敗タグ(`jtc-win-tag`)。

## 5. 原因別の分類と推奨対処

### A. 短縮訳で解決できる(UI文言・訳語の調整)

| 対象 | 症状 | 推奨対処 |
|---|---|---|
| `.sp-appeal-bonuses`(興行結果の数値バフ内訳。上位12,13,16位ほか、EN側nowrap 29件の主要因) | `🤝Even+7 ⚡ Grudge +20 🏆Title +20 📣Expectation +12` のように**単語を綴った訳**(Even/Grudge/Title/Expectation)がJAの一字〜二字ラベル(拮抗/因縁/タイトル/期待)より大幅に長い。CSSは`white-space:nowrap`のみで折返し・省略の保護が無いため、箱の外へ実際にはみ出す | JAと同じ「短い一語」の慣行に揃える(例: `Sync` / `Grudge`(単語自体は据置でも可) / `Title` / `Hype`)。アイコン+短縮語で並べる設計に寄せると根本的に幅を取らない |
| `button.neg-btn`(契約交渉の選択肢。screen-shachoshitsu 2件) | `<span>{label}</span><span class="neg-btn-hint">{hint}</span>` を横並び(`display:flex`)で組む構造で、`Accept the Raise` に続く`hint`(例: "She feels genuinely rewarded…")がJA原文より長く、hintだけ2行に折り返して**その選択肢ボタンだけ他の選択肢より背が高くなる**(選択肢が縦に並ぶ画面で高さが揃わない) | hint文を短く(要旨1行に収まる長さへ)。または`.neg-btn-hint`に`-webkit-line-clamp:1`+ellipsisを掛けて強制1行化(この場合はB分類との併用) |

### B. CSS(min-width・折り返し許可・font-size段)で解決を検討すべき

| 対象 | 症状 | 推奨対処 |
|---|---|---|
| `.pb-fighter-name` / `span.flink`(興行結果・週次ダッシュボードの選手名。上位30件中12件・EN全体でも最頻出) | `.pb-fighter-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}` で**ellipsisによる省略は既に設計済み**だが、JAの4〜6文字名(例:「川野辺菜穂子」)を想定した幅のため、英語フルネーム(例: "Nahoko Kawanobe" 15字、"Chinatsu Miyagase" 18字)は最大+67px溢れて大半が「…」に丸められる。固有名詞なので翻訳短縮はできない | 幅を広げる(EN時のみ`min-width`を拡張)か、姓のみ表示に倒す設計判断、または2行許容(`line-clamp:2`)に変更。まずは実際にどこまで名前が切れて見えるか実機で確認してから幅を決めるべき |
| `.jtc-fn` / `.jtc-win-tag`(ジュニア大会ブラケットの選手名セル。上位30件中4件) | 同上と同じ原因(`overflow:hidden;text-overflow:ellipsis`のブラケット枠がJA向けの狭い固定幅)。"Mayumi Takahashi WIN" のように勝敗タグ込みで最大+44px | 既存の`jtc-size-xs`(縮小フォント版のクラス)のような段階を EN 用に効かせる、またはブラケットセル幅自体を広げる。トーナメント表は画面全体のレイアウトに直結するため構造検討寄り(Cとの境界) |
| `.nm-tag`(ランキング画面の選手名+OVRタグ。EN専用に5件新規発生) | `position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap` で肖像セルの下に中央寄せ表示。長い英語名だと肖像の左右にはみ出し、隣接セルに近づく(実測+2〜7pxと小さいが、絶対配置なので視覚的な密集度は数値以上に見える可能性) | 幅の小さい問題(px超過は小さい)だが、EN専用に新規発生している点は要記録。フォントサイズ1段階の縮小、または長い名前だけ姓のみ表示に倒す運用ルールで足りる可能性が高い |

### C. 構造変更が要る(検討課題として記録・今回は着手しない)

| 対象 | 症状 | 備考 |
|---|---|---|
| 選手名表示の全体方針(A/Bの`.pb-fighter-name`系と`.jtc-fn`系が同根) | 「フルネーム表示 vs 姓のみ表示 vs 2行許容」の**表示方針そのものの決定が先**で、それが決まらないとCSS側の対処(幅/折返し/フォント段)を個別画面ごとに当てずっぽうで直すことになる | Keisuke裁定が要る設計判断。決まればB分類の複数対象(pb-fighter-name/jtc-fn/nm-tag/aw-team-name)に一括適用できる |

### D. 対象外・既存(JA由来、EN起因ではない)

| 対象 | 判定根拠 |
|---|---|
| `screen-week` の `wrap-height` 10件(`⏩ PROCESS THE WEEK`/`🎤 TO SHOW PREP →`/`WATCH THE MATCH`/`SKIP ALL`/`🤖 AUTO`/`#ppvmcStartBtn "S T A R T"` ほか) | **JA側にも同数(10件)・同じボタンが同程度の超過px(±数px以内)で存在する**(例: 「⏩ 週を処理」+24px ↔ "⏩ PROCESS THE WEEK" +24px、「🤖 おまかせ」+19px ↔ "🤖 AUTO" +19px)。翻訳前から同じボタン群で高さが揃っていなかった既存課題であり、EN翻訳が原因ではない |
| `.a1-wrap`(新聞見出しバナー、+59〜60px) | JA(+60px)・EN(+59px)でほぼ同じ超過幅。新聞見出しの構造自体の問題でEN文字幅とは無関係 |
| `.dojo-scene-shout`(道場の掛け声フラグ、2〜12px) | JA・EN双方に存在し、超過幅も小さい(数px)。テキストも「ぜぇ…はぁ…」/擬態語で短く、翻訳長の影響は事実上ない |
| `span.pb-dialogue-line`(試合結果の吹き出し、EN実測+5px 1件のみ) | `-webkit-line-clamp:2`で管理されている吹き出し本体(このタスクの対象外として明示されている110字上限の管理下)。実測でも+5pxとほぼ誤差域で、110字上限ガバナンスが機能していることの傍証と読める |

## 6. 検出器の既知の限界(このバッチでは未修正・次回への申し送り)

- **`.rd-tab-content` の`wrap-height`検出(4件、上位30件中17〜20位)は疑陽性**。`(c)`の対象セレクタ `[class*="tab"]` が「タブ切替ボタン」だけでなく「タブの中身のパネル(`.rd-tab-content`、育成余地の説明文プロパー)」にも部分一致してしまい、**本来は自由に長さが変わってよいプローズ(散文)ブロックを、固定サイズのはずのコントロール(ボタン/バッジ)と誤って同グループ扱い**している。中身は選手ごとに文章量が違って当然なので、高さが揃わないこと自体はバグではない。次にこの検出器を触るバッチで `[class*="tab"]` を `.rd-tab-content` のようなプレフィックス`-content`/`-panel`系を除外する形に絞るのが妥当
- EN走破は**手数(Actions)が実行ごとに変動する**(このタスク中の実測で416〜419)。README既知の制約どおり、`driver.js`のアクション優先度付けがJA文言依存の箇所を多く残しており、EN側は一般スコアへのフォールバックや実時間依存の再試行(`waitForTimedUi`)で経路が微妙に揺れるため。JA側のdigestは不変(`1052faa82eaf7991`)だが、EN側はdigest不変を保証する設計にはなっていない(README・P6-2b worklogに既述の制約であり、今回新たに生じたものではない)

## 7. 緊急項目

**なし。** 87件はいずれも表示の可読性・見た目の劣化(名前の省略・数値バフのはみ出し・ボタンの高さ不揃い)であり、`D2_FREEZE`のような進行不能・押せないボタンには一件も該当しない(`npm run test:ui:walkthrough:en` は Issues 0 でPASS)。

## 8. 変更ファイル(このタスクの範囲)

- `test/ui-walkthrough/detectors.js` — `scanOverflow()` / `_recordOverflow()` 新設、コンストラクタに `overflowByScreen` / `overflowRecords` / `_seenOverflowKeys` を追加
- `test/ui-walkthrough/driver.js` — `scanText()` と同じ3箇所(walk本編2箇所+ナビ巡回1箇所)に `scanOverflow()` を追加配線
- `test/ui-walkthrough/run.js` — レポート末尾に `Overflow` 集計(画面別・種別・上位30件)を出力。lang問わず常時出力(ja/en差分比較のため)
- `test/ui-walkthrough/README.md` — 上記の使い方を追記
- `docs/i18n-en-layout-overflow-report-v0.1.md` — 本書(新規)

**src/・i18n/は無改修。CSS・訳文の修正は行っていない(報告のみ、指示どおり)。**

---

## 9. 対処結果(P6-11、2026-09-04)

本報告書のFable裁定(方針1〜4)に沿って実装した。**JAは1px・1バイトも変えていない**(`html[lang]`による言語別セレクタ分岐、walkthrough digest `1052faa82eaf7991` 不変で確認)。

### 9-1. 適用した対処と箇所数

| 方針 | 対象 | 適用箇所 |
|---|---|---|
| **方針1: 肖像下ラベルの2行折り返し**(`html[lang="en"]`分岐、枠は常に2行分確保) | `.pb-fighter-name`(試合結果カードの選手名) | `src/index.html` 1箇所(CSSルール。試合結果カードの全バリエーション=メインイベント18px/通常16px/縮小14pxへ自動適用) |
| 同上 | `.aw-team-name`(表彰式・隊列の選手名。肖像`.aw-team-portrait`150×224の下に付く同型パターンと判定し追加適用) | `src/index.html` 1箇所 |
| **方針2: 姓のみ表示**(`WM_I18N.pnSurname()`新設) | `.flink`(試合結果カード内、`.pb-fighter-name`の子として方針1の折り返し対象に含まれるため個別配線は不要だった) | 配線不要(方針1の副次効果で解消) |
| 同上 | `.jtc-fn`/`.jtc-win-tag`(ジュニア大会ブラケット) | `src/ui-common.js` `_jtcFx` 1箇所 |
| 同上 | `.tc-fn`(天頂戦ブラケット、丸アイコン版・矩形版) | `src/ui-common.js` `_tcCircleFx`/`_tcRectFx` 2箇所 |
| 同上 | `.nm-tag`(ランキング画面の肖像下タグ) | `src/ui-render.js` `fcellHtml` 1箇所(ホバーtitleはフルネームのまま維持) |
| **方針3: フォントサイズ1段階縮小**(最後の手段) | `.emr-foot-note`(試合結果ポップアップの脚注。9px→8px=タイプスケールのmicro段) | `src/index.html` 1箇所 |
| **方針4: 短縮訳**(`i18n/ui-ledger.json`の`en`列書き換え) | `.sp-appeal-bonuses`(カード魅力バフ内訳): `⚡ Grudge +{n}`→`⚡Grudge+{n}` / `🏆Title +{n}`→`🏆Title+{n}` / `📣Expectation +{n}`→`📣Hype+{n}` / `⚔ Rival promotion challenge +{n}`→`⚔Challenge+{n}` / `😈Alignment +{n}`→`😈Align+{n}` | 5キー |
| 同上 | `.neg-btn-hint`(契約交渉の選択肢ヒント。最長68字→38字程度へ短縮、意味は保持) | 7キー(raise/decline/voluntary decline系) |
| 同上 | 同上・追加(EN後の再走破で新規に判明した2件目のwrap-height、引き留め選択肢) | 2キー(`引き留める`ラベル・`一時金{a}万+給与+{b}万/週`ヒント) |
| **検出器の偽陽性除外**(§6で申し送り済みの限界を今回のバッチで解消) | `.rd-tab-content`等`-content`/`-panel`で終わるクラスを`wrap-height`グルーピングの対象から除外 | `test/ui-walkthrough/detectors.js` 1箇所 |

方針2の実装に伴い、`src/i18n.js`に姓のみ辞書(`surnames`)と`WM_I18N.addSurnames()`/`WM_I18N.pnSurname()`を新設(`pn()`と対称のfail-open設計)、`document.documentElement.lang`をEN/JAへ同期する`syncHtmlLangAttr()`を追加(方針1のCSS分岐が使う`html[lang="en"]`セレクタの前提)。`test/i18n-build-names.js`を拡張し、`i18n/names-ledger.json`の姓データ(`jaSurname`→`enSurname`)から`src/lang-en-names.js`へ姓のみ辞書を生成するようにした。既存のP6-3で確立した前例(WM_I18Nテストスタブへの機械追加)に倣い、`pn(str){return str;}`スタブを持つtest/配下47ファイル67箇所に`pnSurname(str){return str;}`を機械追加した。

### 9-2. EN溢れ件数(before → after)

`npm run test:ui:walkthrough:en` / `npm run test:ui:walkthrough` を対処の前後で2回ずつ実走した実測値。JA側は`.dojo-scene-shout`の壁時計依存表示(§3既述の既知の揺れ)で30〜32件の間で微揺れするため、EN側もその分の揺れを含む。

| 指標 | before(P6-9報告時点) | after(本バッチ、直近の実走) |
|---|---:|---:|
| EN合計(`npm run test:ui:walkthrough:en`) | 87〜89(実測揺れ込み) | **34**(直近実走。対処直後の実走では37) |
| JA合計(`npm run test:ui:walkthrough`) | 30〜31 | **32**(digest `1052faa82eaf7991` 不変=不変条件を実測で確認) |
| EN固有の増分(EN−JA) | **+56〜58** | **+2**(直近実走。もう1本の実走では+7)。**目標10以下を達成** |
| Issues / i18n-miss(EN) | 0 / 16 | 0 / **0** |

画面別(EN、before→after、直近実走):

- `screen-show`: 40 → **22**(nowrap=19, clip=3)。`.pb-fighter-name`/`.flink`の溢れは"Nahoko Kawanobe"+67px→+10px、"Reona Hasegawa"+63px→+6pxまで圧縮(2行折り返しにより大半は完全に1行内へ収まり、残る2件も肖像下ラベルとして視認性を損なわない程度)。`.sp-appeal-bonuses`は最大同時4バフ・全て2桁値という最悪ケースのみ+29〜32px残存(短縮前は最大+52px)
- `screen-week`: 36 → **12**(wrap-height=10=JA由来につき意図的に不変, clip=2)。`.jtc-fn`ブラケットのclip=22件は姓のみ表示化でほぼ全解消(直近実走では0件、`.a1-wrap`(JA由来)以外の`clip`は検出されず)
- `screen-roster`: 5(全て`.rd-tab-content`偽陽性) → **0**(検出器側の除外で解消)
- `screen-ranking`: 5(`.nm-tag`nowrap) → **0**(姓のみ表示化で全解消)
- `screen-shachoshitsu`: 2(`.neg-btn`wrap-height) → **0**(ヒット文の短縮で解消。対処直後の実走では1件残っていた「引き留める」選択肢を追加で短縮して解消)

### 9-3. 残った溢れとその理由(意図的に触っていないもの)

- **`screen-week`の`wrap-height`10件**(`⏩ PROCESS THE WEEK`/`🎤 TO SHOW PREP →`/`WATCH THE MATCH`/`SKIP ALL`/`🤖 AUTO`/`#ppvmcStartBtn`ほか): JA側にも同数・同程度の超過幅で存在する既存課題(EN起因ではない)。裁定どおり触っていない
- **`.a1-wrap`(新聞見出しバナー)**: JA(+60px)・EN(+59px)がほぼ同幅。EN文字幅とは無関係な既存の構造課題
- **`.dojo-scene-shout`(道場の掛け声)**: JA・EN双方に存在し超過幅も数px。翻訳長の影響は事実上ない
- **`span.pb-dialogue-line`(試合結果の吹き出し)**: 110字上限管理下(このタスクの対象外として明示)。実測+4〜5pxで誤差域
- **`.sp-appeal-bonuses`の小幅な残存**(最大同時4バフ・大きい数値が重なった場合のみ+5〜32px): 短縮訳(方針4)で最大超過幅を67px相当→32px程度まで圧縮したが、4バフ全部が2桁の値で同時に立つ最悪ケースはなお僅かに超過する。件数・超過幅ともに大幅縮小しており目標達成には影響しないため、今回はここで止めた(構造変更=バッジのアイコンのみ表示等はC分類「検討課題」として次回に送る)

### 9-4. 検証

- `node --check`(触りファイル全て)/ `npm test` 260/260 green
- `node test/ja-golden.js` 完全一致(hash `6b3d05c8daa3d93f62c7e2fcb3b21e7d6ffebc6dc1c4951919a229a2d4b8c1b3`)
- `node test/i18n-ratchet.js` 増加なし
- `node test/i18n-build-dict.js` / `node test/i18n-build-names.js` 台帳との整合を再生成・確認(未訳0)
- `npm run test:ui:walkthrough` PASS・digest `1052faa82eaf7991` 不変・Issues 0
- `npm run test:ui:walkthrough:en` PASS・Issues 0・i18n-miss 0
- Playwright(走破のブラウザ流用)でENのスクリーンショット3枚(興行準備のカード・ロスター一覧・ランキング)を保存し目視確認
