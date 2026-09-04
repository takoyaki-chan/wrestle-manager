# EN走破 JA露出の分類 — 新聞/ロスター画面 v0.1(P7-7a・調査のみ)

- 作成: P7-7a(2026-09-04)
- 対象: `npm run test:ui:walkthrough` の `--lang en --ja-exposure-log` が拾う `screen-newspaper` / `screen-roster` の可視リーフ要素(テキスト先頭60字・重複排除済み)
- 方法: `node test/ui-walkthrough/run.js --mode walk --seasons 1 --seed 42 --fixture season-1-week-1-seed42.json --lang en --ja-exposure-log <file>` を実行後、別seed(7)でも1本回して未出現の露出を追加採取
- **本調査はコード変更なし**。src/・i18n/・test/ui-walkthrough/ は触っていない
- 開始前にworktreeをmain先端(4197ead)へfast-forward済み

## 前提の注意 — カウントは完全再現しない

`App._generateNewspaperTexts()`(app.js:9843)の記事バリアント抽選が `Math.random()` を使っており、
`Engine.rng.create(Engine.rng.derive(...))` のシード方式ではない。そのため**同じseedで走破しても
自団体の新聞記事本文だけは毎回バリアントが変わりうる**(五原則#4「乱数シード管理」からの逸脱)。
今回のseed42実測は screen-newspaper=28 / screen-roster=25 で、P7-7a冒頭に記載された前回計測
(newspaper 29 / roster 24)とわずかにズレているのはこのため。**個々の件数より、以下の「根本原因」の
分類が今回の主成果**。この乱数シード方式の逸脱自体は本調査の範囲外の別問題として指摘だけしておく。

## 画面別の分類件数表

### screen-newspaper(seed42実測 28件 → 根本原因6件に集約)

| 根本原因 | 分類 | 件数 | 生成箇所 |
|---|---|---|---|
| A. 題字「週刊グラップル」直書き | (b) | 1 | ui-render.js:7057 |
| B. NP_KURODA_BYLINE(黒田幸子の署名)直書き | (b) | 2 | ui-render.js:7234-7241 |
| C. buildFollowUp の名前がpn()を通らない | (a) | 3 | management.js:32011-32022, 32662-32677 |
| D. MVP小窓 `_npV3MvpBox` の生名前 | (a) | 3 | ui-render.js:7788, 7791 |
| E. 決着技名(finishLabel)が未英訳 | (g)新設 | 8 | app.js:9771-9821 ほか(P7-5待ち) |
| F. 決着時間/ターン数の書式が未ローカライズ | (d) | 11 | ui-render.js:7226-7233, 8256-8258, 8365-8369 |
| 合計 | | 28 | |

### screen-roster(seed42実測 25件 + seed7で新出2件 → 根本原因4件に集約)

| 根本原因 | 分類 | 件数(seed42) | seed7新出 | 生成箇所 |
|---|---|---|---|---|
| G. 道場シーンの気合掛け声(DOJO_SHOUTS) | (b) | 2 | +2(「ラスト!」「うぅっ…」) | ui-render.js:2044-2051 |
| H. 特性(traits)がt()を通らず生結合 | (c) | 10 | 0 | ui-render.js:2130 |
| I. 「📈 今シーズン成長」見出し直書き | (b) | 1 | 0 | ui-render.js:2307 |
| J. 「人気+」成長ラベル直書き | (b) | 12 | 0 | ui-render.js:2315 |
| 合計 | | 25 | +2 | |

分類記号は指示書の(a)〜(f)に加え、(g)=決着技名などP7-5(技名英語表記ドラフト)待ちの固有ジャンルを追加した。
P7-4(CHAR_PROFILES/コーチ紹介文)・P6-17(年代記)と重なる要素は**0件**(新聞/ロスター双方とも別領域)。

## 要素一覧(代表・全根本原因を1件ずつ)

| screen | selector | text(先頭60字) | 分類 | 生成箇所 | 推奨対処 |
|---|---|---|---|---|---|
| newspaper | div.logo | 週刊グラップル | (b) | ui-render.js:7057 `_npPaperHeader` | `WM_I18N.pn('週刊グラップル')` に差し替え(訳語は lang-en-names.js:418 に既存"Weekly Grapple") |
| newspaper | div.np-v3-byline | ——黒田幸子(本紙) | (b) | ui-render.js:7234-7241 `NP_KURODA_BYLINE` | オブジェクトのハードコードをやめ、`` `——${WM_I18N.pn('黒田幸子')}(${WM_I18N.t('本紙')})` `` 式の組み立てに変更(名前は既存訳語、"本紙"/"編集部"/"週刊グラップル"の3ラベルだけ新規英訳) |
| newspaper | div.np-v3-kuroda-byline | ——黒田幸子(編集部) | (b) | 同上(NP_KURODA_BYLINE.editorial) | 同上 |
| newspaper | strong / h3.np-v3-hl-kata / p.np-v3-noindent | 川野辺菜穂子 / Where 川野辺菜穂子 stands... | (a) | management.js:32011-32022(`buildFollowUp`のdata.name) + 32662-32677(消費側の`fill()`が手動split/join) | `fill()`をやめ`dict(pick.headline, fu.newsData)`/`dict(pick.body, fu.newsData)`のt()経由呼び出しに変更(i18n.js:161-164のapplyParams名前自動変換に乗せる) |
| newspaper | span.who | 橘玲美 / 生駒エリカ / 富岡加奈子 | (a) | ui-render.js:7788, 7791 `_npV3MvpBox` | `e.fighterName` を `WM_I18N.pn(e.fighterName)` に差し替え(2箇所とも) |
| newspaper | div.np-vs-finish / span.dec-finish / strong(digest) | スナップ・スープレックス → 3-count 等 | (g) | app.js `d.finishLabel` 生成元(match-engine.js formatFinish等)。ui-render.js:8246,8266,8374 で消費 | **P7-5(技名英語表記ドラフト)側の裁定待ち**。技名辞書が決まり次第、finishLabelをpn()相当の技名辞書経由に差し替え |
| newspaper | span.dec-time / span.dec-turns / div.duration / span.np-digest-time / span.np-digest-turns-sub | 決着時間 24分 / （16ターン）/ 24分 | (d) | ui-render.js:7226-7233 `_npTurnsToTime`(返り値が"○分○秒"固定) + 8256-8258/8365-8369(「決着時間 」「ターン」の直書きラベル) | `_npTurnsToTime`をEN/JA分岐対応にする(例: en→"24m30s"や"24 min"、書式はKeisuke確認要)。「決着時間 」「ターン」はWM_I18N.t()でラベル化 |
| roster | div.dojo-scene-shout | たぁっ! / はいっ! / ラスト! / うぅっ… | (b)・要判断 | ui-render.js:2044-2051 `DOJO_SHOUTS`(全26種) | 気合の掛け声=擬音的なフレーバーテキスト。技名と同種の「訳すか演出として残すか」の判断が要る。訳す場合は26種すべてOpus起票の短文セリフ扱いが妥当 |
| roster | span(特性欄) | ヒール適性 / 早熟 等 | (c) | ui-render.js:2130 `traitsText = (c.traits\|\|[]).join(' / ')` | ui-common.js:4122-4125(顔ポップアップ)と同じ `c.traits.map(t => WM_I18N.t(t)).join(' / ')` に差し替えるだけ(TRAIT_DEFS訳語は既存・配線漏れのみ) |
| roster | div(成長ログ見出し) | 📈 今シーズン成長 | (b) | ui-render.js:2307 `_renderRosterGrowthLog` | `WM_I18N.t('📈 今シーズン成長')` でラップ |
| roster | span(成長ログ内訳) | 人気+4.7 等 | (b) | ui-render.js:2315 | `人気+${popG}` を `` `${WM_I18N.t('人気')}+${popG}` `` 等に変更(PW/SP/TE/ST/MNの略号側は既に言語非依存でOK) |

## 修正バッチの提案

**P7-7bは1本にまとめて問題ない規模**。理由: 新聞側4件(A・B・D・F)+ロスター側3件(H・I・J)は
いずれも既存訳語の配線漏れ、または数語の直書きラベルの追加英訳のみで完結する小規模修正(合計7根本原因、
対象行はいずれも1〜数行)。Cのみやや構造変更(`fill()`の手動置換をやめてt()のparams経由へ)だが、
既存のapplyParams機構に乗せるだけで新規翻訳コンテンツは不要。

**P7-7bから除外し、別枠として扱うべきもの:**

1. **E(決着技名 finishLabel)** — 新聞だけで8/28件を占める最大クラスタ。`finishLabel`は新聞に限らず
   興行画面(screen-show)・ログ等でも同じ値が使われている(全画面共通の技名表示の根っこ)ため、
   ここだけ個別に直しても他画面で同じ穴が残る。既存のP7-5(`docs/en-move-names-draft-v0.1.md` 技名160種
   ドラフト)がKeisuke裁定待ちの状態なので、**技名辞書が確定してから一括配線**するのが筋。P7-7bに混ぜない。
2. **G(DOJO_SHOUTS気合掛け声)** — 訳すか演出として残すかの方針判断が先に要る(技名と同種の論点)。
   方針が決まれば26種の英訳自体はOpus起票の軽作業だが、判断が付くまではP7-7bから外す。

**まとめ**: P7-7b = A・B・C・D・F・H・I・J の8根本原因(配線修正のみ、新規翻訳ごく少量)。
E・Gは別枠(それぞれP7-5裁定待ち/演出方針判断待ち)。

## 副次的な発見(範囲外・記録のみ)

- `App._generateNewspaperTexts()`(app.js:9843)の記事バリアント抽選が `Math.random()` を使用しており、
  CLAUDE.mdの「乱数シード管理」原則(Engine.rng.create/derive方式)から外れている。i18n調査の過程で
  気づいた副産物であり、本タスクの範囲外のため修正はしていない。
