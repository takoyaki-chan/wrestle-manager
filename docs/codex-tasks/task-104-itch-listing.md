# task-104 — itch.io に Wrestle Manager を出品する(takoyakiworks / $12.99 / 承認済み英語テキスト・画像)

- 起票: 2026-09-10(Keisuke 指示「投稿、販売しちゃって」→ ブラウザペインが Cloudflare のボット確認で弾かれるため Codex に委譲)
- 担当: Codex(ブラウザ操作タスク。**コード変更なし**)
- 状態: 依頼中

---

## 1. 目的

itch.io のアカウント **takoyakiworks**(https://takoyakiworks.itch.io/ 、既に "VS Boxing Girl: Nana Kurami Edition" を $5.99 で販売中=支払い設定済み)に、
Wrestle Manager の有料ページを新規作成して **Public で公開**する。価格は **$12.99(USD、Paid)**。
テキストと画像は Keisuke 承認済みのものを**一字一句そのまま**使う(書き換え・要約・追加は禁止)。

## 2. 正となる素材(このタスクで新しく作らない・改変しない)

すべて `C:\Users\nkmrk\Downloads\WM素材\販促用\en\` にある。

| 用途 | ファイル |
|---|---|
| ページ本文(Description) | `itch_description_paste.html`(Chrome で開いて全選択コピー→itch の Description 欄に貼る。見出し・太字・箇条書きが保たれる)。崩れた場合の原文は `itch_page_text_EN.md` の「Full description」節 |
| 短い紹介文・設定値・スクショ順とキャプション | `itch_page_text_EN.md`(Short description / Suggested itch.io fields / Screenshot captions) |
| 手順の詳細(欄ごとの値の一覧) | `itch_upload_steps_JA.md`(**本タスクの手順書。これに従う**) |
| カバー画像 | `WM_EN_cover_itch_630x500.png` |
| スクショ 10 枚(この順) | `WM_EN_sample_01.png` 〜 `WM_EN_sample_10.png` |
| 本体 zip | `C:\Users\nkmrk\Downloads\wrestle-manager\release\dist\WrestleManager_1.36.zip`(64.3MB、67,427,237 バイト) |

## 3. 触ってよいもの / 触ってはいけないもの

- 触ってよい: itch.io の takoyakiworks アカウント内の**新規プロジェクト**(wrestle-manager)のみ。
- 触ってはいけない:
  - 既存プロジェクト "VS Boxing Girl"(価格・設定・ファイルに一切触れない)
  - アカウント設定(支払い・メール・パスワード等)
  - リポジトリ `C:\Users\nkmrk\Downloads\wrestle-manager` / `wrestle-manager-codex` のファイル(本タスクはコード変更ゼロ。git 操作も不要)
  - 素材ファイルの中身(画像・テキストを編集しない。ファイル名も変えない)
- ログイン・CAPTCHA・Cloudflare のボット確認は **Keisuke が自分の Chrome で通す**。Codex はそれを迂回・自動突破しない。ログイン済みのブラウザで作業を始める。
- 決済に関わる入力(カード番号等)は一切ない。出てきたら止めて報告する。

## 4. 設定値と不変条件(対で守る)

| 目標 | ただし |
|---|---|
| Pricing = **Paid**、Price = **12.99** | "Suggested donation / pay what you want" にしない。セールは付けない。通貨は USD のまま |
| Kind of project = **Downloadable** | "HTML"(ブラウザ実行)にしない。zip の「This file will be played in the browser」も付けない(起動が START.html のため itch の埋め込み実行では動かない) |
| zip の Platforms = **Windows / macOS / Linux の3つ** | Android/iOS は付けない |
| Visibility = **Public** | Draft/Restricted のまま終わらせない。公開後にページ URL を確認して報告 |
| AI generation disclosure = **Yes → Graphics のみ** | Text / Code / Audio は No(選手画像が AI 生成、それ以外は人手) |
| Title `Wrestle Manager` / URL `wrestle-manager` / Classification Games / Genre Simulation / Release status Released | URL が既に使われていて取れない場合だけ `wrestle-manager-sim` にして報告 |
| Languages = English, Japanese / Inputs = Mouse / Average session = A few hours | それ以外の Metadata は空欄でよい |
| Tags(候補にある語だけ、最大10): management, simulation, wrestling, pro-wrestling, sports, anime, female-protagonist, singleplayer, japanese | 候補に無い語は飛ばす。勝手に別の語を足さない |
| Cover = `WM_EN_cover_itch_630x500.png`、Screenshots = 01→10 の順 | 順番が崩れたら並べ替える。トレーラー無し |
| Description = `itch_description_paste.html` の内容 | 文言を変えない。末尾の "Current version: 1.36" を残す |

## 5. 検証手順(公開後、公開ページ https://takoyakiworks.itch.io/wrestle-manager で)

1. 価格表示が **$12.99** で、"Buy Now" が出ている
2. スクショが 10 枚、1枚目が縦長のキービジュアル、10枚目が団体タブ
3. Description の見出し(Features / How it plays / Language / Requirements / Notes)と箇条書きが崩れていない、"Current version: 1.36" がある
4. Download 対象が `WrestleManager_1.36.zip`(64 MB)1本で、Windows/macOS/Linux の3アイコン
5. ページ上部に "AI generated content" の表示(Graphics)が出ている
6. https://takoyakiworks.itch.io/ のトップに Wrestle Manager が並び、VS Boxing Girl が **$5.99 のまま**変わっていない

## 6. 完了条件と報告

- 公開ページ URL、上記 1〜6 の確認結果(各 OK/NG)、itch が自動で付けた値(あれば)を `docs/codex-tasks/task-104-report.md` に**書かず**、Keisuke へのチャット報告だけでよい(リポジトリは触らない)。
- 途中で止まる要因(URL 重複、ファイルサイズ上限、AI 開示の選択肢の差異、決済系の入力要求)が出たら**その時点で止めて報告**し、勝手に別の設定で進めない。
