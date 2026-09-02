# Stage B P3b 設計 — UI・システム文の英訳パイプライン v0.1

- 作成: 2026-09-02(Fable)。Stage Bゴー(2026-09-02 Keisuke「進めてください」)を受けたP3b(UI英訳・約4,700本)の設計
- 体制: 主筆=Opus 5/Fable=用語集・スタイル番+全行レビュー/ネイティブスポットチェック(バイブル§5-2)
- トーンの正: docs/en-tone-bible-draft-v0.1.md(ただしUIクロームはセリフではないので§2の属性ボイスは適用しない。本書のUIスタイルが正)

## 設計判断

- **D-B1: EN辞書の実体 = `src/lang-en.js`**(`WM_I18N.addDict({...})`の列挙)。台帳 `i18n/ui-ledger.json`(配布対象外)から機械生成する。**manifest.jsonにlang-en.jsを追記**。index.html/battle-engine.html/tag-battle.htmlでi18n.jsの直後に読み込む(ja時はaddDictされても参照されないため無害)
- **D-B2: 未訳はfail-open** — 辞書に無いキーは原文のまま表示+i18n-missログ。よって**部分的に流し込みながら段階検証できる**
- **D-B3: UIスタイル**
  - ボタン・タブ・見出し・短ラベル = **Title Case**・末尾ピリオドなし("New Game" / "Show Prep")
  - トースト・説明文・確認文 = sentence case・完全文
  - 絵文字・記号(⚡🤝📋等)は原文の位置を維持
  - 長さ: 原文比1.5倍以内を目安。ボタンは特に短く(擬似ロケール検査でレイアウト実測)
- **D-B4: 機械検査**(台帳→lang-en.js生成時に必須): プレースホルダ完全性(`{x}`の集合が原文と一致)/用語集逸脱grep/未訳・重複キー検出
- **D-B5: 固有名詞入りのUI文は名詞辞書確定後に訳す**(台帳に`hasProperNoun`フラグ。固有名詞ドラフト→Keisuke承認が先行依存)
- **D-B6: 人名のローマ字順序は要裁定** — 提案: **名→姓のWestern order**("Kanako Tomioka"。英語圏プロレス報道の慣行=Kazuchika Okada式)。対案: 姓→名(近年の公文書式)。→固有名詞ドラフトに設問として同梱

## 用語集シード(UI頻出語・Fable確定。逸脱はgrep検査)

| JA | EN | 備考 |
|---|---|---|
| 団体 | promotion | organizationにしない |
| 興行 | show | eventにしない(イベントと衝突) |
| 選手 | wrestler | fighterは内部変数名。プレイヤー向けには使わない |
| 王座/王者 | title / champion | beltは口語の飾りでのみ |
| 挑戦状 | challenge letter | |
| 対抗戦 | interpromotional match | |
| 派閥 | faction | |
| 道場 | dojo | |
| 社長 | Boss(呼称)/ president(役職) | バイブル裁定#4 |
| 決裁 | approvals(⚡) | |
| 信頼 | trust | |
| 人気 | popularity | |
| 士気/雰囲気 | morale / mood | 内部名morale露出禁止の原則は英語でも同じ(表示は自然語) |
| 契約更改 | contract renewal | |
| 移籍 | transfer | |
| 引退 | retirement | |
| 怪我(重傷/中傷/軽傷) | injury (severe / moderate / minor) | |
| 試合評価 | match rating | MQ表記一掃(08-31)の英語版。"MQ"を再輸入しない |
| 観客動員 | attendance | |
| 週次レポート | weekly report | |

## 工程

1. **抽出**: t()呼び出し全キー+data-i18n原文を機械抽出→ `i18n/ui-ledger.json`(キー/出現ファイル/回数/hasProperNoun)
2. **翻訳バッチ**(Opus・200〜400本単位): 台帳+本書+用語集を渡す→EN列充填→Fableレビュー→lang-en.js再生成
3. **検証ループ**: 機械検査(D-B4)→npm test+ja-golden(JA不変)→**ENモードでwalkthrough**+擬似ロケールでの未訳残り確認
4. ネイティブスポットチェック(フォロワーさん)→引っかかりはバイブル§4-6検査リストへ還流

## 並行トラック: 固有名詞ドラフト(P6前倒し・律速依存)

キャラ98名・技160種・コーチ35名・会場・ベルト・団体・大会名の英語表記ドラフト一覧を作り、**Keisuke承認**を得てから辞書化(計画決定#3)。P4(新聞)・P5(セリフ)にも先行依存するため今すぐ着手する。
