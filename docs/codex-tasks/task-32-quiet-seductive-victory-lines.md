# Codexタスク32: 高槻千歳(quiet×seductive)の勝利セリフ不一致を調査・修正

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**作業場所(準備済み)**: `C:\Users\nkmrk\Downloads\wm-task32`
(ブランチ `codex/quiet-seductive-lines` をチェックアウト済みの git worktree)

このフォルダでそのまま作業する。新たにブランチ・worktreeを作らない。mainに直接コミットしない。
**コミットは自分で行わずローカル変更のまま残す**。push・配布禁止。

**変更してよいファイル**: `src/victory-lines.js`、`src/data.js`(セリフ定数のみ)、
`src/ui-common.js`(セリフ選択ロジックのみ)、`test/` 新規、`docs/worklog.md` 先頭。
**変更禁止**: 上記以外。**キャラ定義(ALL_CHARS)の personality/archetype 値は変更しない**
(キャラ設定はKeisukeの領域。合わないのはセリフ側かロジック側)。

---

## 現象(Keisuke実機報告 2026-07-31)

**高槻千歳の性格とセリフが噛み合っていない。特に勝利セリフで顕著。**

対象キャラの定義(`src/data.js:56`):
```
id:45, 高槻千歳, role:'Heel', personality:'quiet', archetype:'seductive',
traits:['リーダー気質','華','野心']
```
人物像(プロフィール参照): 策略で他者を蹴落として地位を築いた、団体の実力者。
**冷たく妖艶で、感情を表に出さない策士**。

## 調査してほしいこと(原因の切り分け)

以下3つのどれか(複数可)を特定すること。**推測で直さず、実際に引かれるセリフを出力して確認する**:

1. **選択ロジックの問題**: `pickDialogueLine`(ui-common.js 付近)が
   personality×archetype をどう解決しているか。`quiet` × `seductive` のセルが
   victory-lines 側に無く、`_default`(=quiet の素の口調)へ落ちて
   「妖艶さ皆無の寡黙セリフ」になっていないか
2. **セリフ内容の問題**: `src/victory-lines.js` の該当セル(quiet/seductive)のセリフが、
   そもそも人物像(冷徹な策士・ヒール)と合わない(元気系・善人系など)
3. **軸の取り違え**: 勝利セリフだけ archetype を見ずに personality だけで
   引いている経路がないか(他のセリフ系統は archetype 分岐があるのに勝利セリフだけ無い等)

**まず `node` で高槻千歳(id:45)の勝利セリフを実際に20回引いて出力し、報告に貼ること。**
そのうえで原因を特定する。

## 修正方針

- 原因1(フォールバック)なら: quiet×seductive のセルを victory-lines に新設して埋める
- 原因2(内容)なら: 該当セリフを人物像に合わせて書き直す
- 原因3(軸)なら: 他系統と同じ archetype 分岐に揃える

**書くセリフのルール**(このプロジェクトの既存規約):
- 43文字以内・固有名詞なし
- quiet×seductive = **寡黙 × 妖艶**。饒舌にしない。「…」で間を作り、短く艶のある一言。
  勝ち誇るより「見透かしている」余裕。ヒールの冷たさを含んでよい
- テンプレ量産禁止(「勝ったわ」の言い換えを並べない)。各本に固有の温度を持たせる
- 参考にする既存の良い例: `src/data.js` の `EVENT_RENTAL_GREETING_LINES` /
  `SCOUT_GREETING_LINES` の seductive セル、`specs/oyou-style-guide.md`(composed の書き方の参考)
- **セリフを新規に書いた場合は全文を報告に列挙する**(Keisukeの全文チェックにかける)

## 横展開の確認(重要)

高槻千歳固有の問題か、**組み合わせ全体の穴**かを確認すること:
`personality`(normal/bold/quiet/shy/easygoing/earnest/emotional)×
`archetype`(normal/cool/polite/ojousama/delinquent/seductive/composed)の
**全49組み合わせについて、勝利セリフがフォールバックに落ちる組み合わせを一覧化**して報告する。
(高槻と同じ穴に落ちている他キャラがいるはず。**今回の修正対象は quiet×seductive のみ**だが、
他の穴は一覧として報告し、こちらで別タスク化する)

## 不変条件

1. ALL_CHARS のキャラ定義(personality/archetype/traits)を変更しない
2. 既存の他組み合わせのセリフを削除・改変しない(追加と、該当セルの修正のみ)
3. 新規セリフは43文字以内・固有名詞なし
4. `npm test` 全PASS(144/144+新規)

## テスト

`test/victory-line-archetype-coverage-test.js`(新規):
- 高槻千歳(id:45)相当の合成キャラで勝利セリフを引き、quiet の素セリフではなく
  quiet×seductive のセルから引かれることを検証
- 全49組み合わせでセリフ取得が例外なく成立し、43文字超・undefined が出ないことを検証

## 完了報告に書いてほしいこと

1. **高槻千歳の勝利セリフ実測20本**(修正前)
2. 原因の特定結果(1/2/3のどれか、ファイル・行番号つき)
3. 新規・修正したセリフの**全文**
4. 全49組み合わせのフォールバック一覧(穴になっている組み合わせ)
5. 不変条件1〜4の確認結果

`docs/worklog.md` 先頭に詳細ログ。
