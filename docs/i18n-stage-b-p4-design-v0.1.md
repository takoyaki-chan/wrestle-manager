# Stage B P4 設計 — ニュース/新聞/記録テンプレの英語化 v0.1

- 作成: 2026-09-02(Fable)。対象約6.1万字(i18n計画P4): NEWS_HEADLINE_TEMPLATES/ティッカー/GAMELOG_TEMPLATES/PPV_SUMMIT_*等のテンプレ表+kuroda-text.js(黒田記者の記事3.1万字)+新聞文プール
- 体制: 主筆Opus/Fableレビュー/ネイティブ検品(P3bと同じ)

## 設計判断

- **D-P4-1: テンプレ表のENも「キー=JA原文」の辞書方式**(P3bと同一パイプライン)。台帳は `i18n/template-ledger.json`(UI台帳と分離。抽出元はdata.jsの対象テーブル+kuroda-text.js)
- **D-P4-2: 翻訳点は「テンプレ選択の直後・プレースホルダ充填の直前」**。
  - UI側で整形するもの(gameLogEntryText等)= 充填前に `t(template)` を1回通すだけ。配線は軽微
  - **Engine内で整形しGへ焼くもの(週刊新聞/自団体新聞/年代記/MVP)= 生成時言語で確定**(計画決定#4の仕様どおり)。Engineの純粋性を守るため、`tickWeek`系の入口から `opts.lang` を明示的に渡し、Engine内のテンプレ参照ヘルパーが lang='en' のときEN列を引く。**auto-sim/ja-goldenは常にlang省略(=ja)なので既存検証は不変**
- **D-P4-3: 黒田記者の英文体は先に設計・承認**(セリフのトーンバイブルと同じ順序)。方向性の芯:
  - 業界紙の記者の声。**事実文+抑えた慨嘆**。煽らない(トーンバイブル最重要則「温度を上げない」と同根)
  - 一人称の署名コラム的な「私」は維持(黒田の個性)。ただし格言化・詩化はしない(ナレーション方針2026-07-16)
  - 見出しは英語新聞の慣行: 冠詞省略・現在形・Title Caseではなくsentence case(タブロイドでなくクオリティ紙寄り)
- **D-P4-4: 英語は語順・冠詞・単複があるため全テンプレ「書き下ろし翻訳」**(単語置換禁止=計画§2層3)。プレースホルダ集合の一致は機械検査(P3bと同じbuild-dict系)
- **D-P4-5: 固有名詞(選手名・団体名)はプレースホルダで渡るため辞書承認を待たずに着手可能**。テンプレ文中の固有名詞(大会名等)入りはhasProperNounフラグで後回し(P3bと同じ)

## 工程

1. **黒田英文体プロトタイプ**: 文体設計1枚+代表記事・見出し20本の対訳見本 → Fableレビュー→(Keisuke任意確認)
2. テンプレ抽出器の拡張(対象テーブル列挙・template-ledger生成)+t()配線(UI側整形点)+Engine側lang糸通し
3. 翻訳バッチ(Opus・テーブル族ごと): GAMELOG 66型→ティッカー→見出しテンプレ→PPV/対抗戦記事→新聞文プール→kuroda-text.js(最大の山・英文体プロトタイプ承認後)
4. 検証: ja-golden完全一致+build-dict系機械検査+**lang=enでの生成スモーク**(固定シードでEN新聞を生成して目視・ネイティブ検品用サンプルにも流用)

## 黒田英文体プロトタイプで発見された構造穴(2026-09-02・P4-2で対処)

1. **成形済みプレースホルダ約20値**({milestone}=「通算100勝」等、日本語で組み立てた値がテンプレに充填される)— テンプレ台帳と別に**値生成式の側**をテンプレ化/t()経由にする棚卸しが必要。対象候補: {milestone}{recordLine}{careerLine}{detail}{entrySummary}{preview}{championWatch}{semi1}{semi2}{finalResult}{gauntletNote}{tieBreakNote}{closing}{names}{round}{stage}{what}{how}{stat}{body}
2. **関数内実行文のプール**(Engine.mvpRace.generateKurodaComment等の貫一郎プール)— テーブルでないため抽出器が拾えない。抽出器の対象定義に実行文プールの走査を足すか、テーブル化リファクタで対応
3. 黒田英文体の正: docs/en-kuroda-style-draft-v0.1.md(三層主語/断片リズム/見出し文法/禁止語grep/maxim検査)。未決裁定6件は同書§5

## 対象外

- セリフ層(P5)/年代記・MVP文プール翻訳はP4後半で同機構に乗せる(まず新聞系で機構を確立)
