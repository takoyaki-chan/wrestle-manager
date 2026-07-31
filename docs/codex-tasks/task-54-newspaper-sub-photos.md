# タスク54: 新聞サブ記事の写真 — 複数人記事に画像を入れる + 正方形72pxを2:3へ

**作業場所(準備済み)**: `C:\Users\nkmrk\Downloads\wm-task54`
(ブランチ `agent/newspaper-rookie-photos`)。**新たに worktree・ブランチを作らない。**
**main の作業ツリー(`C:\Users\nkmrk\Downloads\wrestle-manager`)には絶対に触らない**
— Keisuke がそのファイルを直接ブラウザで開いてプレイ中で、書きかけを踏むと事故る。
**コミットはしない**(変更を残すだけ)。push・配布禁止。

**変更してよいファイル**: `src/ui-render.js`(新聞描画のみ)、
`src/index.html`(新聞のCSSのみ)、`src/management.js`(`Engine.newspaper.generate` の
`characterIds` 取り回しのみ)、`test/` 新規、`docs/worklog.md` 先頭。
**変更禁止**: 上記以外。`src/data.js` の記事テンプレ定数には触らない。

**同時に別のエージェントが `src/ui-common.js` を編集している。触らないこと。**

先に `docs/ui/mockup-baseline-v0.1.md` の §2(2:3梯子) / §2-B(隊列) を読むこと。

---

## Keisuke 実機報告(2026-07-31)

> 新人の記事に関して**画像が入っていない**。できれば**複数人いるなら複数人画像が間に入る**と
> いいんだけど、小規模記事だと難しいかな。何かうまいやり方があればやってください。

## 調査済みの原因(これが前提)

1. **サブ記事の写真枠が単数の `characterId` しか見ていない。**
   `src/ui-render.js:6960` 付近:
   ```js
   const photoBg = _npPhotoBg(ss.characterId);
   ...
   <div class="np-sub-photo" style="${photoBg}" ${ss.characterId ? `onclick="showFighterPopup(${ss.characterId})"` : ''}></div>
   ```
   ドラフト/新人系の記事は `_queueDraftIndustryNews`(`src/ui-common.js`)が
   **`characterIds`(複数)** で積んでおり、`characterId`(単数)が null。
   `Engine.newspaper.generate`(`src/management.js:28327` 付近)も
   `characterIds: ...slice(0, 2)` として story へ載せている。
   **つまりデータは来ているのに、描画側が読んでいないだけ。**

2. **写真枠が 72×72 の正方形。**
   `src/index.html:8330`:
   `.np-sub-photo { width:72px; height:72px; ... background-size:cover; background-position:center top; }`
   素材(upper/stand/full)はすべて **256×384(2:3)**。1:1 に切り抜いているので体が切れている。
   ベースライン §2 の「正方形の顔は 52px 以下」にも反する。

## 直す形

### A. 写真枠を 2:3 の梯子に載せる

- `.np-sub-photo` を **chip 46×66**(梯子の最小段)にする。
  `background-size:cover` の1:1切り抜きをやめ、2:3で全身/上半身が収まる形にする
- 現状 72×72 → chip 46×66 は面積が減る。**2人並べても今と同じくらいの横幅に収まる**のが狙い
  (46 + 46 − 18 = 74px)
- **梯子から外れた独自サイズを作らないこと。** 小さすぎると判断したら、
  実装せずに「S 108×162 に上げたいが2列グリッドに入らない」等の**質問として残す**

### B. 複数人の記事は隊列で見せる

- `ss.characterIds` が2件以上あれば、**chip を横に並べて 18px 重ねる**(§2-B の隊列)
  - 枠は**群の外側に1つだけ**。個々の画像に額縁・境界線を付けない
  - 落ち影は `filter: drop-shadow()`(`box-shadow` は矩形に付くので誤り)
  - 左右反転しない
- **最大3人まで**。それを超える記事は3人ぶん出して、**残りの人数が分かる表現**を添える
  (「+2」など。文言は既存の紙面のトーンに合わせる)
- 3人ぶん出す場合、**2列グリッドで本文が潰れないこと**と
  **375px幅で横方向にはみ出さないこと**を必ず確認する。入らないなら2人までに留め、
  その判断を報告に書く
- `characterIds` は `Engine.newspaper.generate` で `slice(0, 2)` されている。
  3人まで出すならここも合わせて広げる。**元の人数**も story に持たせて「+N」を出せるようにする
- 単数 `characterId` しか無い既存の記事は**今までどおり1枚**(退行させない)

### C. クリックで選手詳細

- いまも1人のときは `onclick="showFighterPopup(id)"` が付いている。
  **複数人でも、それぞれの顔を押したらその選手の詳細が開く**ようにする
- IDが取れない場合はリンクにしない(押せそうで何も起きないのが一番悪い)

## 不変条件

1. **既存の1人記事の見た目を大きく変えない**(枠が 72×72 → chip 46×66 になるのは意図した変更。
   それ以外のレイアウト崩れを出さない)
2. 一面トップの2名並び写真(`_npTopTagPhotoHtml` / `_npRenderBignewsTag`)は**触らない**
3. アッパー画像を**左右反転しない**
4. 新規16進カラーを増やさない(`var(--*)` トークンのみ)
5. GameState への書き込みを増やさない(描画とデータ取り回しだけ)
6. **375px幅で横方向にはみ出さない**。2列グリッドは `@media` で1列に落ちる
   (`src/index.html:8746`)ので、そこでも破綻しないこと
7. **バックナンバーが壊れないこと。** 既存セーブの古い号は `characterIds` を
   持っていないことがある。持っていない号でも例外を出さず、今までどおり描けること
8. `node test/run-all.js` 全PASS(165/165 + 新規)

## テスト

`test/newspaper-sub-photo-test.js`(新規):
- `characterIds` を持つサブ記事で、**人数分の顔**が出力されること
- 隊列の指定(外枠1つ / 18px重ね / `drop-shadow` / 個々に額縁が無い)が入っていること
- `characterId` だけの記事は今までどおり1枚が出ること
- **どちらも持たない記事**で例外にならず、写真枠が空で描けること(古いバックナンバー)
- `.np-sub-photo` のCSSが **2:3の梯子の値**であること(46×66)
- 各顔に `showFighterPopup` の経路が付いていること / ID が無ければ付かないこと

## 完了報告

1. 1人 / 2人 / 3人以上 それぞれの**実際の出力HTMLとCSS**(枠・重なり・影の持たせ方)
2. 何人まで出す判断にしたか、**その根拠**(2列グリッドの実幅、375px での確認結果)
3. `characterIds` の slice を広げたか。広げたなら元の人数をどう持たせたか
4. 古いバックナンバー(`characterIds` 無し)で壊れないことの確認方法
5. 不変条件1〜8の確認結果
6. 迷った点があれば**実装せずに質問として残す**

`docs/worklog.md` 先頭に詳細ログ。
