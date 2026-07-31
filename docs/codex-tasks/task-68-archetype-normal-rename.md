# タスク68: アーキタイプの `normal` を改名して、性格の `normal` との取り違えを根絶する

**作業場所(準備済み)**: `C:\Users\nkmrk\Downloads\wm-task68`
(ブランチ `feat/archetype-normal-rename`)。**新たに worktree・ブランチを作らない。**
**main(`C:\Users\nkmrk\Downloads\wrestle-manager`)には絶対に触らない**(ユーザーがプレイ中)。
`wm-task64` / `wm-task67` で別エージェントが作業中。**`src/match-engine.js` と
`src/management.js` の AI王座まわり(9100〜9250行)には触らないこと。**
**コミットはしない**。push禁止。

**変更してよいファイル**: `src/data.js` / `src/data-faction-dialogue.js` /
`src/relationships.js` / `src/ui-common.js` / `src/ui-render.js` / `src/app.js` /
`src/coach-lines.js` / `src/victory-lines.js` / `tools/`(判定順の修正) /
`test/` 新規 / `docs/worklog.md` 先頭。
**`src/management.js` は、アーキタイプ判定に直接関わる箇所だけ**(AI王座まわりは触らない)。

---

## 背景(Keisuke 指摘、2026-07-31)

セリフの分岐が**性格(感情面の傾向)**で切られており、**アーキタイプ(口調)**で切られていない。
そのため **お嬢様もヤンキーも同じ行を引き、全員が同じ喋り方**になっている。

> 本来分けるべきなのはお嬢様とか不良とかそういうのを分けなきゃいけないのに。
> 環境面の傾向を分けているので、口調がみんな同じになっちゃうんです。

軸を入れ替える大規模な移行(254箇所)に入る前に、**まず取り違えの元を断つ**。

### 取り違えの正体

`normal` は**性格リストにもアーキタイプリストにも両方存在する**。

- 性格: `normal / bold / quiet / shy / easygoing / earnest / emotional`
- アーキタイプ: **`normal`** / `composed / ojousama / delinquent / cool / seductive / polite`

書き出しツール(`tools/dialogue-workbook.js` の `detectMeta`)は**性格を先に判定する**ため、
アーキタイプの `normal` が **性格=ノーマルと誤ってラベル**され、アーキタイプ列が空になる。
Keisuke から「性格ノーマルが誤って設定されているところが結構散見される」と報告済み。

**改名すれば、この曖昧さが根元から消える。**

## やること

### §1. アーキタイプの `normal` を別の綴りへ

新しい綴りは **`standard`** を推奨(表示ラベル「標準」はそのまま)。
他の候補を選んでもよいが、**性格側のどのキーとも衝突しないこと**。

**内部キーだけの変更で、プレイヤーに見える文言は1文字も変えない。**

### §2. これは「一括置換」で済む作業ではない — 必ず段階を踏むこと

`normal:` という同じ綴りが、**表によって性格を指したりアーキタイプを指したりする**。
安易な sed は**性格のキーまで壊す**。以下の順で、**機械的に判定してから**置換すること。

1. **キャラの属性値**: `ALL_CHARS` 各キャラの `archetype` フィールドの値
   (`'normal'` → `'standard'`)。**`personality` フィールドは絶対に触らない**
2. **コード**: `archetype === 'normal'`、`f.archetype || 'normal'` のような
   アーキタイプを扱う箇所(調査時点で約53件)。**性格を扱う箇所と混同しない**
3. **アーキタイプが第一分岐のテーブル(調査で96箇所)**: 第一階層の `normal:` は
   定義上アーキタイプ。ここは置換対象
4. **`[性格][アーキタイプ]` の入れ子テーブル(調査で254箇所)**: **第二階層**の
   `normal:` がアーキタイプ。第一階層の `normal:` は性格なので**触らない**
5. **性格だけで分岐しているテーブル(調査で6箇所)**: 第一階層は性格。**触らない**
   (FACTION_F02_LINES / FACTION_F09_MATCH_PRE_LINES /
    FACTION_F09_MATCH_POST_LOSE_LINES / FACTION_F09_ENDING_LOSE_LINES /
    INTERNAL_CHALLENGE_POST_WINNER_LINES / INTERNAL_CHALLENGE_POST_LOSER_LINES)

**どの `normal:` がどちらの軸かを判定するスクリプトを先に書き、
判定結果を目視できる形で出してから置換すること。** 判定に迷うものは
**置換せずに一覧として報告**する。

### §3. セーブデータの移行

既存セーブの選手は `archetype: 'normal'` を持っている。
`Engine.saveDoctor`(`src/management.js` の repairOnLoad 付近)に移行を入れ、
**古いセーブを読んだら `'standard'` へ読み替える**。
移行が無いと、既存セーブの標準アーキタイプのキャラが**セリフを引けなくなる**。

**`src/management.js` の AI王座まわり(9100〜9250行)には触らないこと。**

### §4. 書き出しツールの判定順を直す

`tools/dialogue-workbook.js` の `detectMeta`。改名後は `normal` の衝突が消えるので、
**性格を先に見る特別扱いが不要**になる。素直な判定に戻すこと。
`ARCHETYPE_LABELS` / `PERSONALITY_LABELS` の綴りも合わせる。

## 不変条件

1. **プレイヤーに見える文言を1文字も変えない**(内部キーだけ)
2. **性格(`personality`)のキー・値を1つも変えない**
3. 既存セーブが読める(移行を入れる)。**移行前後で同じセリフが引けること**
4. セリフの本数が減らない(改名で引けなくなる行が出ない)
5. `src/management.js` の AI王座まわり(9100〜9250行)・`src/match-engine.js` に触らない
6. `Engine.validateGameState` が新しい違反を出さない
7. `node test/run-all.js` 全PASS
8. **`node test/auto-sim.js 40` が ALL CLEAR**(フォアグラウンド実行)

## テスト

`test/archetype-key-rename-test.js`(新規):
- アーキタイプのキー集合に `normal` が**残っていない**こと
- 性格のキー集合には `normal` が**残っている**こと
- 全キャラの `archetype` が新しい綴りの集合に収まること
- **古いセーブ(`archetype:'normal'`)を読むと `'standard'` に移行される**こと
- 改名前後で、代表的なテーブルから引けるセリフが**同じ本数**であること
- 書き出しツールの `detectMeta` が、アーキタイプの標準を
  **性格ではなくアーキタイプとして**返すこと

## 完了報告

1. 新しい綴りに何を選んだか。**その理由**
2. どの `normal:` をどう判定したか。**判定スクリプトの中身と、判定結果の内訳**
   (アーキタイプと判定した件数 / 性格と判定した件数 / 迷ったもの)
3. 迷って置換しなかったものの一覧
4. セーブ移行をどこに入れたか
5. 不変条件1〜8の確認結果(auto-sim の出力を貼る)
6. **`node tools/dialogue-workbook.js export` を実行し、アーキタイプ列が
   正しく埋まるようになったことを、具体的な行を挙げて示す**

`docs/worklog.md` 先頭に詳細ログ。
