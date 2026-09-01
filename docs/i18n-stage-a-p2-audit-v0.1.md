# Stage A P2 監査結果 v0.1 — 焼き込み・ロジックキー・断片連結の全数調査

- 作成: 2026-09-01(調査: Sonnet読み取り専用エージェント141ツール呼び出し / 検算: Fable)
- 位置づけ: i18n計画(docs/i18n-english-plan-v0.1.md)P2の成果物。**P3a抽出工事の作業台帳の正**
- Fable検算済みの主張: management.js:12630バグ(実在・別途修正) / ui-render.js:595生表示(実在) / personality日本語分岐デッドコード(実在・下記注意付き)

## 調査1: Gへの整形済み日本語文章の焼き込み(5大分類)

| # | カテゴリ | 焼き込み先 | 生成元 | 寄せやすさ |
|---|---|---|---|---|
| 1 | 自団体新聞 | G.currentNewspaper→newspaperArchive | app.js:9671-10050(_generateNewspaperTexts/_buildShowResultNewspaperData) | 低(本文が語順込み。テンプレ化必須) |
| 2 | 業界新聞(週刊号) | G.weeklyNewspaper→newspaperArchive | management.js:31744-32497 Engine.newspaper.generate(headline 29箇所) | 中〜低(元イベントはtype+dataでクリーンだが**publish時に変換され原データが残らない**) |
| 3 | 年代記 | G.chronicle.chaptersCache | management.js:4622-6812 Engine.chronicle | 低(文章量最大。ただしui-render.js:11547 buildAceQuoteは表示時生成の良い先例) |
| 4 | MVPレース | G.mvpRace(narrative/tagline/kurodaComment等) | management.js:19343-20377 | 低(文プールは完結文+プレースホルダなのでStage B翻訳対象に近い) |
| 5 | G.gameLog | 参照70箇所 | app.js全体50サイト超のアドホックpush | 中(件数が多い。**G.transferLogのtype+data構造化が対策の型** app.js:5571) |

クリーン確認済み: G.news/_industryNewsEvents(type+data保存)・記録タブ(表示時計算)・G.allHallOfFame(数値のみ)・選手ファイル(静的データ)。
許容例外: G.weekLogFeed(グリンプス解決済みテキスト=計画決定#4「過去生成分は生成時言語のまま」に該当。付随の.labelカテゴリタグ約10種は易しい表示分離候補)。

## 調査2: ロジックキー棚卸し(計約107件 = ===/!== 約58 + case 7 + .includes分岐 約42)

| 族 | 代表箇所 | 件数 | 所見 |
|---|---|---|---|
| injury.type | management.js:1666他 | 10-13 | **INJURY_LABEL辞書(data.js:3827)+injuryLabel()が理想形の先例**。:12630に既存バグ(別途修正) |
| コーチ能力名 | management.js:9713-9750他 | 約21 | AIコーチ査定の分岐。機械的辞書化で対応可 |
| personality英日併記 | management.js:6564-6574 | 6 | **デッドコード兼休眠コンテンツ損失**: 実キーはnormal/bold等だが分岐はaggressive/強気等の非実在値→**年代記の性格フレーバー文が一度も出ていない**。P3aで削除ではなく現行キーへの修復を検討 |
| trait | management.js18+factions.js:332他 | 約25 | Traits.has型の共通ヘルパー経由へ統一が有効 |
| season review headline | management.js:21901-21917 | 7 | **分離ゼロの唯一の族**: ロジックキーがui-render.js:595で`${review.headline}`生表示。injuryLabel同型の辞書1つで直る最優先低コスト |
| finType(決着) | match-engine.js:757-767,828-841+battle-engine-main.js:1580 | 約13 | **エンジンのスコア計算に食い込む唯一の族**。表示分離の設計は最優先で慎重に |
| 表示ラベル逆引き | ui-common.js:4020/ui-render.js:12461他 | 6 | 表示用日本語を再比較して内部クラスへ変換する逆方向アンチパターン。上流に中立キーを足す |
| **キーワードスニッフィング** | ui-render.js:1014,4330/tag-battle-main.js:640-648他 | 約25 | **最危険**: 完成文の部分一致(.includes('興行')等)でUI分岐。翻訳した瞬間に無音故障。辞書では直せず元データに構造化フィールドが必要 |

## 調査3: 断片連結(語順ロック)

大半のテキスト生成は「完結文プール+{placeholder}+段落join」の**良いパターン**(composeChampionChangeBody/mvpRace文プール/NEWS_TICKER_TEMPLATES等)→これらは構造工事不要・Stage B翻訳対象。真の断片連結は少数の合成関数に集中:

| # | 箇所 | パターン | 難易度 |
|---|---|---|---|
| 1 | management.js:30778-30790 _buildPpvSummitStoryのmatchPart | 条件付き断片を4段でSOV語順ロック連結(頂上決戦記事本文) | **高・最優先** |
| 2 | management.js:31868-31891 PPVアンダーカード | 所属括弧の条件挿入で文型が変わる | 中〜高 |
| 3 | app.js:9803-9811 subheadline | 4-6データを助詞で串刺し。発生頻度最大(毎興行) | 低〜中 |
| 4 | management.js:30728-30744 頂上戦headline 6バリアント | 勝敗の語順固定 | 中 |
| 5 | app.js gameLog 50箇所超 | `📝 ${name}と契約(…)`型の小口連結 | 低(機械的一括) |
| 6 | ui-common.js:3554他6箇所 | 'シーズン '+season+' — '+label | 低 |

## P3a着手順(推奨)

1. **finType族**(match-engine.js)— スコア計算と表示の分離を最初に安全確定
2. **season review headline族** — injuryLabel同型辞書で低コスト高リスク解消・パターン確立
3. **_buildPpvSummitStory/subheadline** — 完全文テンプレ化の手法確立→newspaper.generate残り+gameLogへ横展開
4. **キーワードスニッフィング族+gameLog構造化** — type/categoryフィールド追加の設計変更として一括対応
5. Chronicle/MVPレース文プール・compose*系は**構造工事しない**(Stage B翻訳に回す)— P3a見積もり6〜10セッション死守の鍵
