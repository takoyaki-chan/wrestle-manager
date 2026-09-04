# i18n P4-5 黒田/新聞プール 保留一覧(自動生成)

- 生成元: test/i18n-extract-templates.js(実行のたびに上書きされる。手編集禁止)
- 対象: kurodaTemplateOf()が正規化できなかった関数値(三項演算子で分岐する関数本体・
  入れ子テンプレートリテラル、Math.abs()等の計算式を含むもの)。台帳には載らず、
  消費点でも従来どおり entry(d) を直接呼ぶ(fail-open。ENでもJA文のまま)。
- 合計: **0件**

## ✅ P4-5の保留16件はP4-7(2026-09-04)で全件解消済み

いずれも「分岐を関数本体からデータ側へ出し、各エントリを単一テンプレートリテラルに
保つ」方針で解消した。JA出力は分岐前と1バイト不変(条件ごとの出力突合で確認)。

| テーブル | 保留だった件数 | 保留の理由 | ✅ 解消方法 |
|---|---|---|---|
| KURODA_WAR_RECORD | 8 | `loseStreak`が連敗数を`Math.abs(d.streak)`で算出(計算式入り補間は正規化不能) | ✅ 絶対値の計算を消費点(ui-render.js の warComment)へ移し、`d.streakAbs`を渡すようにした。プール側は素の`{streakAbs}`を読むだけ |
| KURODA_SPOTLIGHT | 7 | `star`プール全7本が`d.ovr>=90 ? … : d.ovr>=75 ? … : …`の三項分岐 | ✅ 総合力帯ごとに独立プール`starAce`/`starSolid`/`starPopular`(各7本・並び順は旧`star`と同一)へ分割。帯の選択は`kurodaSpotlightStarKey(ovr)`が担う |
| KURODA_RELATION_NARRATIVE | 1 | `destined_rival.bodies[0]`が入れ子テンプレートリテラルの三項分岐(対戦済み/未対戦) | ✅ `kurodaVariants([{when,text},…])`で分岐をデータ側へ出した。配列の要素数は5のまま(消費点が`pool.length`でpick/ペア選択しているため) |

詳細は docs/worklog.md の P4-7 エントリを参照。
