# 技名 英語表記ドラフト v0.1（Keisuke 裁定用）

> **裁定確定(2026-09-04・Keisuke)**: 設問①〜⑤すべて推奨案で確定。
> ① JA/EN呼称ズレ11件は英語の実技名に合わせる(ブレーンバスター=Vertical Suplex / 垂直落下式=Brainbuster / コブラツイスト=Abdominal Stretch / アームリンガー=Arm Wringer / ヒール・ホールド=Heel Hook / 回転エビ固め=O'Connor Roll ほか)
> ② 創作技は意訳一択(音写・併記なし) ③ （専）（喧）（打）（大）（飛）マーカーは括弧を持ち込まず上位版名/Deep前置/別名 ④ 「→」は into に開く ⑤ インディアン・デスロック=Deathlock
> ★印38件は個別の異議なし=推奨EN名を採用(実装後に実機で気になる名があれば1語差し替えで直す)。実装は P7-5(names-ledger拡張+表示時t()のみ・エンジンにEN名を流さない)。

- 作成: 2026-09-04(Fable)
- 位置づけ: **Stage B P7-5 の裁定用ドラフト**(`docs/i18n-stage-b-p7-design-v0.1.md` §1-D / §4「Keisuke裁定が要るもの」)。`docs/en-proper-nouns-draft-v0.1.md` §9 で「別ドラフト(次工程)」として切り出した技名がこれ
- 規範元: `docs/en-proper-nouns-draft-v0.1.md`(裁定済みの方針: 意訳を基本・格が要るものだけ音写) / `docs/en-tone-bible-draft-v0.1.md` §1(温度を上げない・忠実さより自然さ) / `docs/move-catalog-reclassified-v0.2.md`(分類語)
- 情報源: `src/data.js` の `commonMoves`(626〜660行・76技) / `styleMoves`(661〜705行・83技) / `STYLE_TAG_MOVES`(918〜1064行・のべ89エントリ=ユニーク82技) + `getTagMove` のフォールバック直書き1件(1073行)
- 状態: **未裁定ドラフト**。EN列は Fable の第一案であって確定ではない
- **本ドラフトはコードも台帳も変更していない。**成果物はこの1枚のみ

## 数量

| 区分 | 件数 | 備考 |
|---|---:|---|
| 共有技 `commonMoves` | 76 | 全スタイル共通 |
| スタイル技 `styleMoves` | 83 | 7スタイル(Technique含む) |
| 技名 小計 | **159** | P7設計の「160種」は概数。実データは159(ユニーク名も159) |
| タッグ連携技 `STYLE_TAG_MOVES` | **82** | のべ89エントリ。6文字列が2〜3ペアで再利用されている(§5-C) |
| 表外フォールバック | 1 | `合体スラム`(§5-A・**今回の発見**) |
| **合計** | **242** | 全件の推奨EN名がユニークであることを機械検査済み |

内訳: **実在技の定着名がそのまま使えるもの 130件**(うち日本語呼称と英語呼称がズレるもの 11件・カタカナ綴りの復元 2件) / **創作技・記述名で意訳が要るもの 112件**(意訳 95 + 衝突回避 4 + マーカー解決 13)。
**★=個別に見ていただきたい行 38件**(残り204件は実在名か §2 の語彙表どおりの機械的な意訳なので、通し読みで十分です)。

---

## 0. 裁定設問(この5問に答えていただければ本表は確定できます)

### 設問① 日本語のプロレス語と英語のプロレス語で**指す技がズレる**とき、どちらに合わせるか — **推奨: 英語の実技名**

| 案 | 例 | 論拠 |
|---|---|---|
| **◎ A: 英語の実技名に合わせる** | ブレーンバスター(d8) → **Vertical Suplex** / 垂直落下式ブレーンバスター(d14) → **Brainbuster** | 読者は英語圏の女子プロレスファン(トーンバイブル §5-2)。彼らが見て呼ぶ名前にする |
| B: カタカナの綴りをそのまま戻す | Brainbuster(d8) / Vertical-Drop Brainbuster(d14) | puroresu の空気は濃い。ただし**威力帯と名前が食い違って見える**(d8が Brainbuster で d14 がその「式違い」) |

**推奨理由**: 固有名詞ドラフト設問③で確定した「格は音写では出ない・読んで意味が分かる方が伝わる」と同じ思想。技名は**動きの説明**であって、綴りを戻すこと自体に価値がない。加えてAには実利がある — Bを採ると **ブレーンバスターの2件が英語で親子逆転**して見え、d8の中技が最上位級の名前を持ってしまう。

**適用される11件**(全部この表の §5-B に再掲):

| JA | 綴りを戻すと | 英語の実技名(推奨) |
|---|---|---|
| ブレーンバスター d8 | Brainbuster | **Vertical Suplex** |
| 垂直落下式ブレーンバスター d14 | Vertical-Drop Brainbuster | **Brainbuster** |
| コブラツイスト d7 | Cobra Twist | **Abdominal Stretch** |
| バックドロップ d13 | Back Drop | **Backdrop**(英語圏の puroresu 報道の呼称) |
| ショルダータックル d3 | Shoulder Tackle | **Shoulder Block** |
| アームリンガー d4 | Armringer | **Arm Wringer**(カタカナが訛り) |
| ヒール・ホールド d13 | Heel Hold | **Heel Hook**(「ホールド」は和製) |
| バックハンドブロー d11 | Backhand Blow | **Backhand Strike** |
| インディアン・デスロック d7 | Indian Deathlock | **Deathlock**(→設問⑤) |
| 回転エビ固め d5 | (直訳不能) | **O'Connor Roll** |
| クローズライン d10 | Closeline | **Clothesline** |

**なお、逆方向の音写維持もこの原則の結論です** — 延髄斬り=**Enzuigiri** / 卍固め=**Octopus Hold** / トペ・スイシーダ=**Tope Suicida** / みちのくドライバーII=**Michinoku Driver II** / シャイニング・ウィザード=**Shining Wizard** は、英語圏のプロレスファンが実際にその名前で呼んでいるので**そのまま**にします(「日本語だから音写」ではなく「英語での定着名がそれだから」)。

### 設問② 創作技(タッグ連携82件ほか)は 意訳 / 音写 / 併記 のどれか — **推奨: 意訳一択**

| 案 | 例(ダブル・パワーボム / 崩し＆極め連携) | 論拠 |
|---|---|---|
| **◎ A: 意訳** | Double Powerbomb / Takedown into Hold | 技名は「何をしたか」の説明。読んで動きが浮かぶことが仕事 |
| B: 音写 | Daburu Pawabomu / Kuzushi-Kime Renkei | 意味が消えるだけで格は出ない。天頂戦(音写)は**大会の格**を担う固有名詞なので事情が違う |
| C: 併記 | Double Powerbomb (Daburu Pawabomu) | 観戦画面の1行に収まらない |

**推奨理由**: 固有名詞ドラフトで音写を採ったのは天頂戦1件だけで、理由は「4年に一度・ベルトより上という**別格の位置づけを語法の違いで見せる**」ためでした。技名にはその機能がありません。ダブル・パワーボムを音写しても「日本の技だ」という情報しか増えず、**何をしたのかが読者に伝わらなくなる**。

**将来の例外**: 個人技スロット(`docs/move-catalog-reclassified-v0.2.md`「個人技スロットの前提」)が実装され、**選手の異名と結びついた固有の必殺技**が生まれたら、そこは音写を検討する余地があります(例: 「柔の白銀」= Shirogane the Supple と対になる技名)。**現データにはそういう技が1つも無い**ので、本ドラフトでは音写ゼロです。

### 設問③ 同名2重登録の **（専）（喧）（打）（大）（飛）マーカー**を英語でどう出すか — **推奨: 括弧を英語に持ち込まない**

現状、同じ技が2つのスタイルに威力違いで登録され、日本語では括弧マーカーで区別しています(15件)。マーカーは**画面にそのまま出ます**。

| 案 | 例 | 論拠 |
|---|---|---|
| **◎ A: 実在の上位版名があればそれに置換、無ければ英語の修飾語を前置** | パイルドライバー（喧） → **Spike Piledriver** / クロスフェイス（専） → **Deep Crossface** | 英語には「同じ技の上位版を別名で呼ぶ」語彙がある。技名として自然に読める |
| B: 括弧タグを機械的に付ける | Crossface (Sub) / Piledriver (Brawl) | 実装は楽。ただし**内部管理の記号が画面に出る**ことに変わりがない |
| C: マーカーを落として同名を許す | Crossface が2つ | 辞書は成立するが、選手詳細で同じ名前が並ぶ |

**Aの内訳**: 実在の上位版名で置換できたのが**8件**、修飾語 `Deep` を前置したのが**5件**、衝突回避の別名にしたのが**2件**。

| JA | 推奨EN | 種別 |
|---|---|---|
| ミサイルキック（飛） d9 | **Missile Dropkick** | 実在名。マーカーが英語では不要になる |
| バックドロップ（専） d13 | **Backdrop Driver** | 実在名(頭から落とす版) |
| ドラゴン・スクリュー（専） d11 | **Dragon Screw Legwhip** | 実在のフルネーム |
| アンクル・ロック（専） d12 | **Grapevined Ankle Lock** | 実在名(脚を絡める版) |
| パイルドライバー（喧） d15 | **Spike Piledriver** | 実在名 |
| ツームストン・パイルドライバー（喧） d16 | **Spike Tombstone** | 実在名 |
| チョークスラム（喧） d14 | **Chokebomb** | 実在の別技名 |
| シャイニング・ウィザード（打） d13 | **Running Shining Wizard** | 実在の修飾語 |
| クロスフェイス（専） d14 | **Deep Crossface** | `Deep` 前置 |
| 卍固め（専） d15 | **Deep Octopus Hold** | `Deep` 前置(対案 Octopus Stretch は英語では同義語なので上位版に見えない) |
| フィギュア4レッグロック（専） d14 | **Deep Figure-Four Leglock** | `Deep` 前置 |
| テキサス・クローバーホールド（専） d13 | **Deep Texas Cloverleaf** | `Deep` 前置 |
| リアネイキッドチョーク（専） d12 | **Deep Rear Naked Choke** | `Deep` 前置 |
| ダイビング・ボディ・プレス（大） d11 | **Top-Rope Splash** | 衝突回避(共有技 d8 = Diving Splash) |
| コーナーラッシュ（喧） d12 | **Corner Assault** | 衝突回避(Striker版 d11 = Corner Rush) |

### 設問④ 連携技名の中の「→」を英語でどう扱うか — **推奨: `into` に開く**

| 案 | 例 | 論拠 |
|---|---|---|
| **◎ A: `into` に開く** | ホイップ → ランニングキック = **Whip into Running Kick** | 決着表示が `{move} → 3-count`(P4で英訳済み)なので、技名にも矢印を残すと **"Whip → Running Kick → 3-count" と矢印が二重**になる |
| B: 記号のまま維持 | Whip → Running Kick | 短い・日本語版と見た目が揃う。ただし上記の二重矢印が起きる |

**該当**: タッグ連携技のうち矢印を含む18件 + 「〜からの」型9件。Aを採ると平均で3〜5字伸びますが、§6の実測では**それでも既存の日本語より短い**ので画面は破綻しません。

### 設問⑤ 「インディアン・デスロック」の英語呼称 — **推奨: `Deathlock`**

| 案 | 論拠 |
|---|---|
| **◎ A: Deathlock** | WWEをはじめ**英語圏の現行呼称は "Indian" を外した Deathlock / Standing Deathlock**。英語版だけの措置で、日本語側の技名は一切変更しない |
| B: Indian Deathlock | 古い実況の定着名。英語圏の読者には「今どき使われない呼び方」に見える |

**推奨理由**: トーンバイブル §1-10「実在方言の記号を属性に貼らない」と同根の、**英語圏の読者にとっての自然さ**の問題です。これは政治的配慮の話というより、単に**現在の英語圏プロレス報道がその名前で呼んでいない**ということです。

---

## 1. 表記方針(裁定後、辞書生成時の機械ルールにする)

1. **実在技は英語圏プロレスの定着名を使う。**カタカナ技はそのまま英語へ戻す(クローズライン → Clothesline)
2. **日本語呼称と英語呼称がズレる技は英語の実技名を採る**(設問①)
3. **創作技・記述名は意訳。音写しない**(設問②)
4. **括弧マーカーは英語に持ち込まない**(設問③)
5. **技名の中の「→」は `into` に開く。「＆」は `&` のまま**(設問④)
6. **米綴り統一**(トーンバイブル裁定#5)。固有名詞ドラフト §1-10 と同じ
7. **大文字化はタイトルケース**(Deep Rear Naked Choke)。前置詞・接続詞(into / and / of)は小文字、ただし語頭は大文字
8. **ハイフン**: 複合修飾語はハイフンで繋ぐ(Sit-Out / Step-Up / High-Five / Top-Rope / Figure-Four / Belly-to-Belly / Hair-Pull)。単なる名詞連結はハイフンなし(Body Slam)
9. **アポストロフィ**は直線 `'`(Fireman's Carry / O'Connor Roll)。タイポグラフィ引用符にしない
10. **数字は半角**(450 Splash / Figure-Four は綴り・Michinoku Driver II はローマ数字を維持)

---

## 2. 分類語・修飾語の対訳表

### 2-1. カテゴリ語(**既に `src/lang-en.js` にある訳。本ドラフトはこれに揃える**)

| JA | EN | 内部値(`c`) | 出典 |
|---|---|---|---|
| 打撃技 | **Strike** | `strike` | lang-en.js:2100(既訳) |
| 投げ技 | **Throw** | `throw` | lang-en.js:2103(既訳) |
| 関節・絞め技 | **Locks & Chokes** | `submission` | lang-en.js:3202(既訳) |
| 飛び技 | **Aerial** | `aerial` | lang-en.js:3255(既訳) |
| グラウンド攻撃 | **Ground Attack** | `ground` | lang-en.js:948(既訳) |
| 丸め込み | **Roll-up** | `rollup` | lang-en.js:1353(既訳) |
| 打撃(名詞) | **Striking** | — | lang-en.js:2099(既訳) |

### 2-2. 技帯・配置(`docs/move-catalog-reclassified-v0.2.md` の語。**現状は文書内だけで画面に出ない**。個人技スロット実装時に必要になるので先に決めておく案)

| JA | EN案 | 備考 |
|---|---|---|
| 小技 | Light Move | |
| 中技 | Standard Move | 対案 Mid Move |
| 大技 | Big Move | 英語圏の実況でも "big move" は通る |
| 大技(フィニッシャー候補) | Big Move (Finisher Candidate) | |
| フィニッシャー / 決め技 | Finisher | |
| 共有技 | Shared Move | |
| スタイル技 | Style Move | |
| 固有選定専用技 | Signature-Only Move | |
| 個人技(スロット) | Signature Move | 「得意技」の既訳 `signature moves`(lang-en-templates.js:679)と揃う |

### 2-3. 修飾語の統一グロス(**この表が242件の意訳の背骨**)

| JA | EN | 例 |
|---|---|---|
| 連打 | **Flurry** | エルボー連打 = Elbow Flurry / ヘッドバット連打 = Headbutt Flurry |
| 乱打 | **Barrage** | ストンピング乱打 = Stomp Barrage(連打より荒い) |
| 連携 / 連係 | **Combo** | テクニカル・ロック連携 = Technical Lock Combo |
| コンビネーション | **Combination / Combo** | 語が長くなる位置では Combo |
| ダブル | **Double** | ダブル・パワーボム = Double Powerbomb |
| シンクロ | **Tandem** | シンクロ・ジャーマン = Tandem German Suplex。英語実況の "tandem offense" |
| サンドイッチ | **Sandwich** | 英語圏でも実在の連携語(sandwich splash) |
| 〜式(補助) | **-Assisted** | アシスト式スピアー = Assisted Spear |
| 踏み台式 | **Step-Up** | 実在の英語修飾語(step-up enzuigiri) |
| スラッピング(手を合わせて) | **High-Five** | 英語の tandem 語法。→ ★2件 |
| ホイップ | **Whip** | 英語実況でも Whip 単独で通る(Irish Whip の略) |
| → | **into** | 設問④ |
| ＆ | **&** | リフト＆ジャーマン連係 = Lift & German Suplex |
| 〜からの | **into / -to-** | 空中戦からの投げ連携 = Aerial-to-Throw Combo |
| 崩し | **Takedown** | |
| 極め / 関節技 | **Hold / Submission** | 締めの語が2連続しないよう使い分け |
| 腕ひしぎ | **Armbar** | |
| 四の字 | **Figure-Four** | |
| 低空 | **Low** | 低空ドロップキック = Low Dropkick |
| 重量級 | **Heavy** | 字幅のため Heavyweight は使わない |
| 力強い | **Power** | 力強いラリアット = Power Lariat |
| （専） | **Deep**(または実在の上位版名) | 設問③ |
| （喧） | **Spike / Assault / Chokebomb** | 設問③ |
| （打） | **Running** | 設問③ |
| （大） | **Top-Rope** | 設問③ |
| （飛） | **Missile / Diving** | 設問③ |

---

## 3. 技名 159種の対訳表

**読み方**: 「分類/威力」は `src/data.js` の `c`/`d` そのまま。「短縮形」は観戦画面のカットイン用(§6)で、**—** は原名がそのまま入る意味。「裁定」★は個別に見ていただきたい行。

### 3-1. 共有技 `commonMoves`(76技・全スタイル)

| # | JA | 分類/威力 | 推奨EN | 代替案 | 短縮形 | 根拠 | 裁定 |
|---|---|---|---|---|---|---|---|
| 1 | ストンピング | 打撃 2 | **Stomping** | Stomps | — | 実在。英語圏でも stomping。連打形と区別するため単数化しない |  |
| 2 | ボディパンチ | 打撃 3 | **Body Punch** | Body Blow | — | 実在 |  |
| 3 | バックエルボー | 打撃 3 | **Back Elbow** | Back Elbow Strike | — | 実在 |  |
| 4 | ナックルパンチ | 打撃 3 | **Knuckle Punch** | Straight Punch | — | カタカナ復元。カタカナが既に英語。そのまま戻す |  |
| 5 | 逆水平チョップ | 打撃 4 | **Knife Edge Chop** | Chop | — | 実在。逆水平チョップ=英語圏の定着名 knife edge chop |  |
| 6 | エルボー・スタンプ | 打撃 5 | **Elbow Strike** | Elbow Stamp / Elbow Stab | — | 意訳。「スタンプ」は英語のプロレス語彙に無い。Elbow Smash(ブローラー技)とは別名にする必要あり | ★ |
| 7 | マシンガン・チョップ | 打撃 5 | **Machine Gun Chops** | Chop Flurry | — | 実在。英語実況の machine gun chops がそのまま通る |  |
| 8 | ニーキック | 打撃 6 | **Knee Strike** | Knee Lift | — | 実在。英語では knee kick と言わない。Jumping Knee(Striker技)と衝突しない |  |
| 9 | ヘッドバット | 打撃 6 | **Headbutt** | — | — | 実在 |  |
| 10 | ビッグブーツ | 打撃 7 | **Big Boot** | — | — | 実在 |  |
| 11 | 低空ドロップキック | 打撃 7 | **Low Dropkick** | Baseball Slide Dropkick | — | 実在 |  |
| 12 | サッカーボールキック | 打撃 7 | **Soccer Ball Kick** | — | — | 実在 |  |
| 13 | ドロップキック | 打撃 8 | **Dropkick** | — | — | 実在 |  |
| 14 | ジャンピング・エルボー | 打撃 8 | **Jumping Elbow** | Jumping Elbow Smash | — | 実在 |  |
| 15 | ローリング・エルボー | 打撃 9 | **Rolling Elbow** | — | — | 実在 |  |
| 16 | 延髄斬り | 打撃 9 | **Enzuigiri** | — | — | 実在。英語圏プロレスがそのまま日本語名で呼ぶ稀な例(音写が定着名) |  |
| 17 | ミサイルキック | 打撃 9 | **Missile Kick** | Flying Kick | — | 意訳。JAの造語。空中版「ミサイルキック（飛）」=Missile Dropkick と対にして区別する | ★ |
| 18 | ラリアット | 打撃 10 | **Lariat** | — | — | 実在。英語圏でも lariat(clothesline とは別技として運用される) |  |
| 19 | スーパーキック | 打撃 10 | **Superkick** | — | — | 実在 |  |
| 20 | クローズライン | 打撃 10 | **Clothesline** | — | — | カタカナ復元。カタカナは clothesline の訛り。綴りを戻す |  |
| 21 | ロックアップからの押し込み | 投げ 2 | **Lockup Shove** | Collar-and-Elbow Push | — | 意訳。記述名。英語では collar-and-elbow tie-up からの押し込み | ★ |
| 22 | ショルダータックル | 投げ 3 | **Shoulder Block** | Shoulder Tackle | — | 実在(呼称ズレ)。英語の定着名は shoulder block |  |
| 23 | ヒップトス | 投げ 3 | **Hip Toss** | — | — | 実在 |  |
| 24 | アームドラッグ | 投げ 3 | **Arm Drag** | — | — | 実在 |  |
| 25 | ヘッドロック・テイクダウン | 投げ 3 | **Headlock Takedown** | — | — | 実在 |  |
| 26 | ファイヤーマンズキャリー | 投げ 4 | **Fireman's Carry** | — | — | 実在 |  |
| 27 | ボディスラム | 投げ 6 | **Body Slam** | Scoop Slam | — | 実在 |  |
| 28 | ジャーマン・スープレックス | 投げ 7 | **German Suplex** | — | — | 実在 |  |
| 29 | スナップ・スープレックス | 投げ 7 | **Snap Suplex** | — | — | 実在 |  |
| 30 | ブレーンバスター | 投げ 8 | **Vertical Suplex** | Brainbuster | — | 実在(呼称ズレ)。設問①。JAブレーンバスター=英語の vertical suplex。Brainbuster は下の垂直落下式に充てる | ★ |
| 31 | サイド・スープレックス | 投げ 8 | **Side Suplex** | — | — | 実在 |  |
| 32 | ネックブリーカー | 投げ 8 | **Neckbreaker** | — | — | 実在 |  |
| 33 | スウィンギング・ネックブリーカー | 投げ 8 | **Swinging Neckbreaker** | — | — | 実在 |  |
| 34 | バックブリーカー | 投げ 8 | **Backbreaker** | — | — | 実在 |  |
| 35 | サモアン・ドロップ | 投げ 9 | **Samoan Drop** | — | — | 実在 |  |
| 36 | ベリー・トゥ・ベリー | 投げ 9 | **Belly-to-Belly Suplex** | Belly-to-Belly | — | 実在 |  |
| 37 | タイガー・ドライバー | 投げ 9 | **Tiger Driver** | — | — | 実在。三沢の技名がそのまま英語圏の定着名 |  |
| 38 | スパインバスター | 投げ 9 | **Spinebuster** | — | — | 実在 |  |
| 39 | DDT | 投げ 10 | **DDT** | — | — | 実在 |  |
| 40 | チンロック | 関節・絞め 2 | **Chinlock** | — | — | 実在 |  |
| 41 | ネックロック | 関節・絞め 2 | **Neck Lock** | Head Scissors | — | 実在 |  |
| 42 | ヘッドロック | 関節・絞め 4 | **Headlock** | — | — | 実在 |  |
| 43 | リストロック | 関節・絞め 4 | **Wristlock** | — | — | 実在 |  |
| 44 | ハンマーロック | 関節・絞め 3 | **Hammerlock** | — | — | 実在 |  |
| 45 | アームリンガー | 関節・絞め 4 | **Arm Wringer** | Armringer | — | 実在(呼称ズレ)。カタカナは arm wringer の訛り。英語の実技名に戻す | ★ |
| 46 | スリーパー・ホールド | 関節・絞め 6 | **Sleeper Hold** | — | — | 実在 |  |
| 47 | フルネルソン | 関節・絞め 6 | **Full Nelson** | — | — | 実在 |  |
| 48 | コブラツイスト | 関節・絞め 7 | **Abdominal Stretch** | Cobra Twist | — | 実在(呼称ズレ)。設問①。英語の実技名は abdominal stretch(Cagematch表記も同じ) | ★ |
| 49 | ベアハッグ | 関節・絞め 7 | **Bear Hug** | — | — | 実在 |  |
| 50 | キャメルクラッチ | 関節・絞め 7 | **Camel Clutch** | — | — | 実在 |  |
| 51 | インディアン・デスロック | 関節・絞め 7 | **Deathlock** | Indian Deathlock | — | 実在(呼称ズレ)。設問⑤。現代の英語圏呼称は Deathlock / Standing Deathlock | ★ |
| 52 | ボストンクラブ | 関節・絞め 8 | **Boston Crab** | — | — | 実在。逆エビ固め=Boston Crab。JAが既にカタカナなのでそのまま |  |
| 53 | アキレス腱固め | 関節・絞め 9 | **Achilles Tendon Hold** | Achilles Lock | — | 実在。英語圏プロレスの定着名。Ankle Lock(別技)と衝突しない |  |
| 54 | フライング・クロスボディ | 空中 7 | **Flying Crossbody** | — | — | 実在 |  |
| 55 | ダイビング・ボディ・プレス | 空中 8 | **Diving Splash** | Diving Body Press | — | 実在(呼称ズレ)。JAボディプレス=英語の splash。（大）版と対で区別する |  |
| 56 | セントーン | 空中 7 | **Senton** | — | — | 実在。英語圏でもそのまま senton |  |
| 57 | トペ・スイシーダ | 空中 9 | **Tope Suicida** | Suicide Dive | — | 実在。ルチャ語がそのまま英語圏の定着名 |  |
| 58 | プランチャ・スイシーダ | 空中 8 | **Plancha Suicida** | Plancha | — | 実在。トペと対で並ぶので語形を揃える |  |
| 59 | ダイビング・エルボー | 空中 8 | **Diving Elbow Drop** | Diving Elbow | — | 実在 |  |
| 60 | ダイビング・ヘッドバット | 空中 7 | **Diving Headbutt** | — | — | 実在 |  |
| 61 | ミサイルキック（飛） | 空中 9 | **Missile Dropkick** | — | — | 衝突回避。英語の実技名。マーカー（飛）は英語では不要になる(設問③の適用例) |  |
| 62 | エルボードロップ | グラウンド 3 | **Elbow Drop** | — | — | 実在 |  |
| 63 | ニードロップ | グラウンド 4 | **Knee Drop** | — | — | 実在 |  |
| 64 | レッグドロップ | グラウンド 4 | **Leg Drop** | — | — | 実在 |  |
| 65 | スライディングキック | グラウンド 4 | **Sliding Kick** | Baseball Slide | — | 実在 |  |
| 66 | ストンピング連打 | グラウンド 3 | **Stomp Flurry** | Repeated Stomps | — | 意訳。連打=Flurry(語彙表) |  |
| 67 | ヘアプル・スラム | グラウンド 3 | **Hair-Pull Slam** | — | — | 意訳。髪掴みはヒールの定番スポット。英語でも hair pull |  |
| 68 | フェイスウォッシュ | グラウンド 4 | **Face Wash** | — | — | 実在 |  |
| 69 | ダブルニードロップ | グラウンド 5 | **Double Knee Drop** | — | — | 実在 |  |
| 70 | スクールボーイ | 丸め込み 4 | **Schoolboy** | — | — | 実在 |  |
| 71 | 首固め | 丸め込み 4 | **Inside Cradle** | Neck Cradle / Cradle Pin | — | 意訳。JAの「首固め」は総称的。英語の丸め込み語彙のうち未使用の実在名を充てた | ★ |
| 72 | スモール・パッケージ | 丸め込み 5 | **Small Package** | — | — | 実在 |  |
| 73 | ラ・マヒストラル | 丸め込み 5 | **La Magistral** | La Magistral Cradle | — | 実在 |  |
| 74 | ウラカン・ラナ | 丸め込み 5 | **Huracanrana** | Hurricanrana | — | 実在。丸め込み版。投げ版はフランケンシュタイナー=Frankensteiner で英語も同じ使い分け |  |
| 75 | 回転エビ固め | 丸め込み 5 | **O'Connor Roll** | Rolling Cradle | — | 実在(呼称ズレ)。回転エビ固め=英語圏のオコーナーロール | ★ |
| 76 | ヨーロピアン・クラッチ | 丸め込み 5 | **European Clutch** | — | — | 実在 |  |

### 3-2. スタイル技 `styleMoves`(83技)

Grappler 12 / Aerial 11 / Technique 12 / Allround 12 / Striker 12 / Submission 12 / Brawler 12。表は `src/data.js` の並び順。

| # | JA | 分類/威力 | 推奨EN | 代替案 | 短縮形 | 根拠 | 裁定 |
|---|---|---|---|---|---|---|---|
| 77 | パワーボム | 投げ 14 | **Powerbomb** | — | — | 実在 |  |
| 78 | シットアウト・パワーボム | 投げ 15 | **Sit-Out Powerbomb** | — | — | 実在 |  |
| 79 | パワースラム | 投げ 13 | **Powerslam** | — | — | 実在 |  |
| 80 | チョークスラム | 投げ 13 | **Chokeslam** | — | — | 実在 |  |
| 81 | デスバレーボム | 投げ 14 | **Death Valley Bomb** | Death Valley Driver | — | 実在 |  |
| 82 | バックドロップ | 投げ 13 | **Backdrop** | Back Suplex | — | 実在(呼称ズレ)。設問①。英語圏のプロレス報道は全日系のこの技を Backdrop と呼ぶ。Back Suplex だと威力帯(d13)の格が落ちて見える | ★ |
| 83 | ラストライド | 投げ 16 | **Last Ride** | Elevated Powerbomb | — | 実在。Undertakerの技名だが英語圏では一般名として通用。商標的な懸念があるなら対案へ | ★ |
| 84 | 垂直落下式ブレーンバスター | 投げ 14 | **Brainbuster** | Vertical-Drop Brainbuster | — | 実在(呼称ズレ)。設問①。英語の Brainbuster は頭から落とす版=この技 | ★ |
| 85 | 力強いラリアット | 打撃 12 | **Power Lariat** | Heavy Lariat | — | 意訳。「力強い」は形容。Lariat(d10共有技)との上位関係が読める語を前置 | ★ |
| 86 | 頭突き | 打撃 11 | **Charging Headbutt** | Battering Headbutt | — | 衝突回避。ヘッドバット(d6)=Headbutt と英語で衝突するため修飾語で分ける | ★ |
| 87 | カナディアン・バックブリーカー | 関節・絞め 10 | **Canadian Backbreaker** | Torture Rack | — | 実在 |  |
| 88 | アルゼンチン・バックブリーカー | 関節・絞め 11 | **Argentine Backbreaker** | — | — | 実在 |  |
| 89 | フランケンシュタイナー | 投げ 12 | **Frankensteiner** | — | — | 実在 |  |
| 90 | トルネードDDT | 投げ 13 | **Tornado DDT** | — | — | 実在 |  |
| 91 | シャイニング・ウィザード | 打撃 12 | **Shining Wizard** | — | — | 実在。武藤の技名がそのまま英語圏の定着名 |  |
| 92 | ムーンサルト・プレス | 空中 15 | **Moonsault Press** | Moonsault | — | 実在 |  |
| 93 | シューティング・スター・プレス | 空中 16 | **Shooting Star Press** | — | — | 実在 |  |
| 94 | 450スプラッシュ | 空中 15 | **450 Splash** | — | — | 実在 |  |
| 95 | フロッグ・スプラッシュ | 空中 13 | **Frog Splash** | — | — | 実在 |  |
| 96 | スワントン・ボム | 空中 14 | **Swanton Bomb** | Senton Bomb | — | 実在。Jeff Hardyの技名だが英語圏では一般名として流通。商標を避けるなら Senton Bomb | ★ |
| 97 | トペ・コンヒーロ | 空中 11 | **Tope con Hilo** | — | — | 実在。カタカナ「コンヒーロ」は con hilo の訛り。ルチャ語の正綴りへ |  |
| 98 | ダイビング・セントーン | 空中 10 | **Diving Senton** | — | — | 実在 |  |
| 99 | ドラゴン・スクリュー | 投げ 10 | **Dragon Screw** | — | — | 実在 |  |
| 100 | アームバー | 関節・絞め 11 | **Armbar** | — | — | 実在 |  |
| 101 | フィギュア4レッグロック | 関節・絞め 12 | **Figure-Four Leglock** | — | — | 実在 |  |
| 102 | シャープシューター | 関節・絞め 13 | **Sharpshooter** | Scorpion Deathlock | — | 実在 |  |
| 103 | STF | 関節・絞め 12 | **STF** | — | — | 実在。英語圏でも STF(Stepover Toehold Facelock) |  |
| 104 | 三角絞め | 関節・絞め 12 | **Triangle Choke** | — | — | 実在 |  |
| 105 | クロスフェイス | 関節・絞め 13 | **Crossface** | — | — | 実在 |  |
| 106 | 卍固め | 関節・絞め 14 | **Octopus Hold** | Manji-Gatame | — | 実在。卍固め=英語圏の定着名 Octopus Hold(猪木の技) |  |
| 107 | ドラゴンスリーパー | 関節・絞め 13 | **Dragon Sleeper** | — | — | 実在 |  |
| 108 | キムラロック | 関節・絞め 11 | **Kimura Lock** | — | — | 実在 |  |
| 109 | タイガー・スープレックス | 投げ 14 | **Tiger Suplex** | — | — | 実在 |  |
| 110 | ドラゴン・スープレックス | 投げ 15 | **Dragon Suplex** | — | — | 実在 |  |
| 111 | フィッシャーマン・スープレックス | 投げ 13 | **Fisherman Suplex** | — | — | 実在 |  |
| 112 | ファルコンアロー | 投げ 13 | **Falcon Arrow** | — | — | 実在 |  |
| 113 | みちのくドライバーII | 投げ 14 | **Michinoku Driver II** | — | — | 実在。英語圏でもこの綴り。ローマ数字は維持 |  |
| 114 | エクスプローダー | 投げ 12 | **Exploder Suplex** | Exploder | — | 実在 |  |
| 115 | ノーザンライツ・スープレックス | 投げ 12 | **Northern Lights Suplex** | — | — | 実在 |  |
| 116 | ダブルアーム・スープレックス | 投げ 13 | **Double Arm Suplex** | Butterfly Suplex | — | 実在 |  |
| 117 | リアネイキッドチョーク | 関節・絞め 11 | **Rear Naked Choke** | — | — | 実在 |  |
| 118 | テキサス・クローバーホールド | 関節・絞め 12 | **Texas Cloverleaf** | — | — | 実在。カタカナ「ホールド」は英語名に無い |  |
| 119 | アンクル・ロック | 関節・絞め 11 | **Ankle Lock** | — | — | 実在 |  |
| 120 | フェニックス・スプラッシュ | 空中 15 | **Phoenix Splash** | — | — | 実在 |  |
| 121 | ダイビング・ボディ・プレス（大） | 空中 11 | **Top-Rope Splash** | — | — | 衝突回避。共有技(d8)の Diving Splash と英語で衝突するため上位版の実在名へ | ★ |
| 122 | スピアー | 打撃 12 | **Spear** | — | — | 実在 |  |
| 123 | インプラントDDT | 投げ 13 | **Implant DDT** | Spike DDT | — | 実在。英語圏でも Implant DDT は使うが流通度は低め | ★ |
| 124 | シャイニング・ウィザード（打） | 打撃 13 | **Running Shining Wizard** | — | — | マーカー解決。設問③。Aerial版(d12)との上位関係を実在の修飾語 Running で分ける |  |
| 125 | ジャンピングニー | 打撃 12 | **Jumping Knee** | — | — | 実在 |  |
| 126 | ハイキック | 打撃 11 | **High Kick** | — | — | 実在 |  |
| 127 | バズソーキック | 打撃 14 | **Buzzsaw Kick** | — | — | 実在 |  |
| 128 | PK | 打撃 11 | **PK** | Penalty Kick | — | 実在。英語圏の総合/プロレス報道でも PK のまま。サッカーボールキック(共有技)との棲み分けを保つ | ★ |
| 129 | ランニングエルボー | 打撃 13 | **Running Elbow** | — | — | 実在 |  |
| 130 | スピニングバックフィスト | 打撃 12 | **Spinning Backfist** | — | — | 実在 |  |
| 131 | ケンカキック | 打撃 15 | **Street-Fight Kick** | Brawler's Kick / Scrapper Kick | — | 意訳。創作技。「喧嘩」の荒っぽさを英語で運ぶ語の選択 | ★ |
| 132 | エルボー連打 | 打撃 10 | **Elbow Flurry** | — | — | 意訳。連打=Flurry(語彙表) |  |
| 133 | コーナーラッシュ | 打撃 11 | **Corner Rush** | Corner Mount | — | 意訳。JAの造語。英語でも意味は通るが定着名ではない | ★ |
| 134 | パイルドライバー | 投げ 14 | **Piledriver** | — | — | 実在 |  |
| 135 | ツームストン・パイルドライバー | 投げ 16 | **Tombstone Piledriver** | — | — | 実在 |  |
| 136 | ギロチンチョーク | 関節・絞め 13 | **Guillotine Choke** | — | — | 実在 |  |
| 137 | 肩固め | 関節・絞め 12 | **Arm Triangle Choke** | Kata-Gatame | — | 実在。肩固め=柔道/MMAの kata-gatame。英語の実技名は arm triangle choke |  |
| 138 | ヒール・ホールド | 関節・絞め 13 | **Heel Hook** | Heel Hold | — | 実在(呼称ズレ)。カタカナ「ホールド」は和製。英語の実技名は heel hook | ★ |
| 139 | ロメロ・スペシャル | 関節・絞め 14 | **Romero Special** | Surfboard | — | 実在 |  |
| 140 | テキサス・クローバーホールド（専） | 関節・絞め 13 | **Deep Texas Cloverleaf** | — | — | マーカー解決。設問③。実在の上位版名が無いため修飾語 Deep で揃える | ★ |
| 141 | リアネイキッドチョーク（専） | 関節・絞め 12 | **Deep Rear Naked Choke** | — | — | マーカー解決。設問③ | ★ |
| 142 | アンクル・ロック（専） | 関節・絞め 12 | **Grapevined Ankle Lock** | — | — | マーカー解決。設問③。実在の上位版名(Kurt Angle式)がある |  |
| 143 | クロスフェイス（専） | 関節・絞め 14 | **Deep Crossface** | — | — | マーカー解決。設問③ | ★ |
| 144 | 卍固め（専） | 関節・絞め 15 | **Deep Octopus Hold** | Octopus Stretch | — | マーカー解決。設問③。対案 Octopus Stretch は英語では同義語なので上位版に見えない | ★ |
| 145 | フィギュア4レッグロック（専） | 関節・絞め 14 | **Deep Figure-Four Leglock** | — | Deep Figure-Four | マーカー解決。設問③ | ★ |
| 146 | バックドロップ（専） | 投げ 13 | **Backdrop Driver** | — | — | マーカー解決。設問③。実在の上位版名(頭から落とす版)がある |  |
| 147 | ドラゴン・スクリュー（専） | 投げ 11 | **Dragon Screw Legwhip** | — | — | マーカー解決。設問③。実在のフルネーム |  |
| 148 | エルボースマッシュ | 打撃 12 | **Elbow Smash** | — | — | 実在 |  |
| 149 | バックハンドブロー | 打撃 11 | **Backhand Strike** | Backhand Blow | — | 実在(呼称ズレ)。「ブロー」は和製。英語では backhand strike / backhand chop | ★ |
| 150 | ヘッドバット連打 | 打撃 11 | **Headbutt Flurry** | — | — | 意訳。連打=Flurry(語彙表) |  |
| 151 | コーナーラッシュ（喧） | 打撃 12 | **Corner Assault** | — | — | マーカー解決。設問③。Striker版(d11)の Corner Rush と分ける | ★ |
| 152 | パイルドライバー（喧） | 投げ 15 | **Spike Piledriver** | — | — | マーカー解決。設問③。実在の上位版名 |  |
| 153 | ツームストン・パイルドライバー（喧） | 投げ 16 | **Spike Tombstone** | — | — | マーカー解決。設問③。実在の上位版名 |  |
| 154 | チョークスラム（喧） | 投げ 14 | **Chokebomb** | — | — | マーカー解決。設問③。実在の別技名(座り込み式チョークスラム) |  |
| 155 | サイドウォークスラム | 投げ 12 | **Sidewalk Slam** | — | — | 実在 |  |
| 156 | ランニングパワースラム | 投げ 13 | **Running Powerslam** | — | — | 実在 |  |
| 157 | ネックハンギングツリー | 関節・絞め 12 | **Neck Hanging Tree** | Hanging Choke | — | 意訳。和製英語だが英語圏のプロレス語彙でも通じる。片手吊り上げ絞め | ★ |
| 158 | フェイスウォッシュ連打 | グラウンド 10 | **Face Wash Flurry** | — | — | 意訳。連打=Flurry(語彙表) |  |
| 159 | ストンピング乱打 | グラウンド 11 | **Stomp Barrage** | — | — | 意訳。乱打=Barrage(語彙表)。連打(Flurry)より荒い | ★ |

---

## 4. `STYLE_TAG_MOVES` 82技の対訳表(タッグ連携技)

スタイルの組み合わせごとの合体技。**全82件が創作技**(唯一の例外がタワー・オブ・ドゥーム=実在の Tower of Doom)なので、設問②のとおり全件意訳。§2-3 の語彙表を機械的に適用しています。

| # | JA | 分類/威力 | 推奨EN | 代替案 | 短縮形 | 根拠 | 裁定 |
|---|---|---|---|---|---|---|---|
| 1 | ダブル・ムーンサルト | 空中 17 | **Double Moonsault** | — | — | 意訳 |  |
| 2 | シンクロ・シューティングスタープレス | 空中 18 | **Tandem Shooting Star Press** | — | Tandem SSP | 意訳。シンクロ=Tandem(語彙表) |  |
| 3 | ダブル・フロッグスプラッシュ | 空中 17 | **Double Frog Splash** | — | — | 意訳 |  |
| 4 | コネクティング・ドロップキック | 空中 16 | **Connecting Dropkicks** | Linked Dropkicks | — | 意訳 |  |
| 5 | アシスト式ダイビングアタック | 空中 17 | **Assisted Diving Attack** | — | — | 意訳。式=-Assisted(語彙表) |  |
| 6 | 踏み台式ムーンサルト | 空中 17 | **Step-Up Moonsault** | — | — | 意訳。踏み台式=Step-Up(実在の英語修飾語) |  |
| 7 | 肩車式ハイフライ | 空中 18 | **Shoulder-Perch Dive** | Doomsday Splash | — | 意訳。肩車から飛ぶ。英語の定型は Doomsday 系だが技名が重くなる | ★ |
| 8 | 放り投げからのダイブ | 空中 17 | **Launched Dive** | Assisted Dive | — | 意訳 |  |
| 9 | パワーボム式ラナ | 投げ 18 | **Powerbomb Rana** | Powerbomb into Rana | — | 意訳 |  |
| 10 | タワー・スプラッシュ | 空中 18 | **Tower Splash** | — | — | 意訳 |  |
| 11 | 空中戦からの投げ連携 | 投げ 18 | **Aerial-to-Throw Combo** | — | — | 意訳。連携=Combo(語彙表) |  |
| 12 | ドロップキック→ジャーマン連携 | 投げ 17 | **Dropkick into German Suplex** | — | Dropkick into German | 意訳。→=into(設問④) |  |
| 13 | 宙返りからのスープレックス受け渡し | 投げ 18 | **Flipping Suplex Handoff** | Somersault Suplex Relay | — | 意訳 |  |
| 14 | キック＆飛びつきコンビネーション | 打撃 16 | **Kick and Leap Combo** | — | — | 意訳 |  |
| 15 | スラッピング・ダブルドロップキック | 打撃 17 | **High-Five Double Dropkick** | — | High-Five Dropkicks | 意訳。「スラッピング」=手を合わせて同時に。英語の tandem 語法は high-five | ★ |
| 16 | シューズ → エアキック連打 | 打撃 16 | **Boot into Air-Kick Flurry** | — | Air-Kick Flurry | 意訳。JA原文の「シューズ」が何を指すか不明瞭(足技の意と解釈) | ★ |
| 17 | 空中からの合体関節技 | 関節・絞め 16 | **Aerial Combination Hold** | — | — | 意訳 |  |
| 18 | ダイビング・アームバー | 関節・絞め 17 | **Diving Armbar** | — | — | 意訳 |  |
| 19 | ロープ空中技からの腕ひしぎ | 関節・絞め 17 | **Rope-Dive Armbar** | — | — | 意訳。腕ひしぎ=armbar |  |
| 20 | アサルト式レッグロック | 関節・絞め 17 | **Assault Leglock** | — | — | 意訳 |  |
| 21 | 技巧派トップロープ連係 | 関節・絞め 17 | **Technical Top-Rope Combo** | — | Top-Rope Combo | 意訳。連係=Combo(語彙表) |  |
| 22 | コンビネーション・スラム | 投げ 16 | **Combination Slam** | — | — | 意訳 |  |
| 23 | ハモリ式ドロップキック | 打撃 17 | **Unison Dropkicks** | Harmony Dropkicks | — | 意訳。「ハモリ」=声を合わせる比喩。英語では unison が近い | ★ |
| 24 | ダブル・ブレーンバスター | 投げ 17 | **Double Vertical Suplex** | — | — | 意訳。設問①の適用(ブレーンバスター=vertical suplex) |  |
| 25 | 連携サンドイッチ・ボディアタック | 打撃 16 | **Sandwich Body Attack** | — | — | 意訳。サンドイッチ=Sandwich(英語でも実在の連携語) |  |
| 26 | パワー連携スラム | 投げ 17 | **Power Combo Slam** | — | — | 意訳 |  |
| 27 | アシスト式スピアー | 打撃 18 | **Assisted Spear** | — | — | 意訳 |  |
| 28 | ダブル・ショルダータックル | 打撃 16 | **Double Shoulder Block** | — | — | 意訳 |  |
| 29 | ダブル・スープレックス | 投げ 17 | **Double Suplex** | — | — | 意訳 |  |
| 30 | ホイップ連携からのバックドロップ | 投げ 17 | **Whip into Backdrop** | — | — | 意訳。ホイップ=Whip(Irish Whip の略・英語実況でも Whip 単独で通る) |  |
| 31 | リフト＆ジャーマン連係 | 投げ 18 | **Lift & German Suplex** | — | — | 意訳 |  |
| 32 | 打投コンビネーション | 投げ 16 | **Strike-Throw Combo** | — | — | 意訳 |  |
| 33 | ホイップ → ランニングキック | 打撃 17 | **Whip into Running Kick** | — | — | 意訳 |  |
| 34 | ダブル・エルボースマッシュ | 打撃 16 | **Double Elbow Smash** | — | — | 意訳 |  |
| 35 | 崩し＆極め連携 | 関節・絞め 16 | **Takedown into Hold** | — | — | 意訳。崩し=takedown / 極め=hold |  |
| 36 | ホイップ → スリーパーキャッチ | 関節・絞め 17 | **Whip into Sleeper Catch** | — | — | 意訳 |  |
| 37 | 腕固めセットアップ・ラッシュ | 関節・絞め 17 | **Armlock Setup Rush** | — | — | 意訳 |  |
| 38 | テクニカル・ロック連携 | 関節・絞め 17 | **Technical Lock Combo** | — | — | 意訳 |  |
| 39 | 関節セットアップ → フィニッシュロック | 関節・絞め 18 | **Setup into Finishing Hold** | — | Setup into Finisher | 意訳 |  |
| 40 | ダブル・パワースラム | 投げ 18 | **Double Powerslam** | — | — | 意訳 |  |
| 41 | タワー・オブ・ドゥーム | 投げ 19 | **Tower of Doom** | — | — | 実在。実在の合体技名がカタカナで入っている。綴りを戻すだけ |  |
| 42 | サンドイッチ・スピア | 打撃 18 | **Sandwich Spear** | — | — | 意訳 |  |
| 43 | ダブル・ラリアット | 打撃 18 | **Double Lariat** | — | — | 意訳 |  |
| 44 | 重量級ダブルパワーボム | 投げ 18 | **Heavy Double Powerbomb** | Heavyweight Double Powerbomb | Heavy Dbl Powerbomb | 意訳 |  |
| 45 | ゴリ押し → バックドロップ | 投げ 18 | **Bulldoze into Backdrop** | — | — | 意訳。ゴリ押し=強引に押し込む |  |
| 46 | サンドイッチ・チョークスラム | 投げ 18 | **Sandwich Chokeslam** | — | — | 意訳 |  |
| 47 | ダブル打撃コンビネーション | 打撃 17 | **Double Strike Combo** | — | — | 意訳 |  |
| 48 | ラリアット → 追撃キック | 打撃 18 | **Lariat into Follow-Up Kick** | Lariat into Kick | Lariat into Kick | 意訳 |  |
| 49 | ショルダータックル→延髄斬り | 打撃 17 | **Shoulder Block into Enzuigiri** | Block into Enzuigiri | Block into Enzuigiri | 意訳 |  |
| 50 | 叩き潰してからの関節技 | 関節・絞め 17 | **Slam into Submission** | — | — | 意訳 |  |
| 51 | パワーボム → グラウンドロック | 関節・絞め 18 | **Powerbomb into Ground Lock** | — | Powerbomb into Lock | 意訳 |  |
| 52 | ラッシュ → アキレス腱固め | 関節・絞め 17 | **Rush into Achilles Hold** | — | — | 意訳 |  |
| 53 | タックル → テクニカル・ロック | 関節・絞め 18 | **Tackle into Technical Lock** | — | Tackle into Lock | 意訳 |  |
| 54 | 重量級アシスト → 関節締め | 関節・絞め 18 | **Heavy-Assisted Submission** | — | Heavy Assist Hold | 意訳 |  |
| 55 | ダブル・チョークスラム | 投げ 18 | **Double Chokeslam** | — | — | 意訳 |  |
| 56 | シンクロ・ジャーマン | 投げ 18 | **Tandem German Suplex** | — | — | 意訳 |  |
| 57 | ダブル・パワーボム | 投げ 19 | **Double Powerbomb** | — | — | 意訳 |  |
| 58 | 四の字スラム連携 | 投げ 17 | **Figure-Four Slam Combo** | — | — | 意訳。四の字=Figure-Four |  |
| 59 | 投げからの追撃打撃 | 打撃 17 | **Throw into Follow-Up Strike** | Throw into Strike | Throw into Strike | 意訳 |  |
| 60 | スープレックス → ランニングキック | 打撃 18 | **Suplex into Running Kick** | — | Suplex into Kick | 意訳 |  |
| 61 | ホイップ → エルボースマッシュ連係 | 打撃 17 | **Whip into Elbow Smash** | — | — | 意訳 |  |
| 62 | 投げからの関節極め | 関節・絞め 17 | **Throw into Submission** | — | — | 意訳 |  |
| 63 | バックドロップ → アームロック | 関節・絞め 18 | **Backdrop into Armlock** | — | — | 意訳 |  |
| 64 | パワーボム → クロスフェイス | 関節・絞め 18 | **Powerbomb into Crossface** | — | — | 意訳 |  |
| 65 | スープレックス → フィギュアフォー | 関節・絞め 18 | **Suplex into Figure-Four** | — | — | 意訳 |  |
| 66 | ジャーマン → キムラロック連携 | 関節・絞め 18 | **German into Kimura Lock** | — | — | 意訳 |  |
| 67 | ダブル打撃ラッシュ | 打撃 17 | **Double Strike Rush** | — | — | 意訳 |  |
| 68 | シンクロ・ハイキック | 打撃 18 | **Tandem High Kick** | — | — | 意訳 |  |
| 69 | スラッピング・ダブルエルボー | 打撃 16 | **High-Five Double Elbow** | — | — | 意訳。上のダブルドロップキックと同じ「スラッピング」解釈 | ★ |
| 70 | サンドイッチ・ニークラッシャー | 打撃 18 | **Sandwich Knee Crusher** | — | — | 意訳 |  |
| 71 | 打撃で崩して関節技 | 関節・絞め 17 | **Strikes into Submission** | — | — | 意訳 |  |
| 72 | キック → スリーパー連係 | 関節・絞め 17 | **Kick into Sleeper Combo** | — | — | 意訳 |  |
| 73 | ミドルキック → アキレス腱固め | 関節・絞め 18 | **Middle Kick into Achilles Hold** | Kick into Achilles Hold | Kick into Achilles Hold | 意訳 |  |
| 74 | シュート・キック → テクニカルロック | 関節・絞め 18 | **Shoot Kick into Technical Lock** | Shoot Kick into Lock | Shoot Kick into Lock | 意訳 |  |
| 75 | 打撃コンビ → フィニッシュホールド | 関節・絞め 17 | **Strike Combo into Finishing Hold** | Strike Combo into Hold | Strike Combo into Hold | 意訳 |  |
| 76 | ダブル関節技 | 関節・絞め 17 | **Double Submission** | — | — | 意訳。表中3回出現(同一文字列) |  |
| 77 | シンクロ・アームバー | 関節・絞め 18 | **Tandem Armbar** | — | — | 意訳 |  |
| 78 | 上下同時極め | 関節・絞め 18 | **Simultaneous Double Hold** | Double-Ended Hold | Double-Ended Hold | 意訳。上下(上半身と下半身)を同時に極める。英語で1語に畳めない | ★ |
| 79 | アーム＆レッグロック連係 | 関節・絞め 18 | **Arm & Leg Lock Combo** | — | — | 意訳 |  |
| 80 | テクニカル・ダブルホールド | 関節・絞め 17 | **Technical Double Hold** | — | — | 意訳 |  |
| 81 | テクニカル・シンクロ・ロック | 関節・絞め 18 | **Technical Tandem Lock** | — | — | 意訳 |  |
| 82 | 緻密な連係グラウンド | 関節・絞め 17 | **Precision Ground Combo** | — | — | 意訳。「緻密な」を英語の技名に載せる語の選択 | ★ |

### 4-1. 表外の1件

| # | JA | 分類/威力 | 推奨EN | 代替案 | 短縮形 | 根拠 | 裁定 |
|---|---|---|---|---|---|---|---|
| 83 | 合体スラム | 投げ 16 | **Team Slam** | Tandem Slam | — | 衝突回避。STYLE_TAG_MOVES の表に無い直書きフォールバック。Combination Slam(コンビネーション・スラム)と衝突するため別名 | ★ |

---

## 5. 衝突・注意点一覧

### 5-A. 表に無い技名が1件ある(**今回の発見**)

`src/data.js:1073` の `getTagMove` に、スタイル組み合わせが表に無かったときのフォールバックが**直書き**されています:

```js
if (!arr || arr.length === 0) return { n: '合体スラム', d: 16, c: 'throw' };
```

`STYLE_TAG_MOVES` のテーブルだけを走査すると**この1件が漏れます**。CLAUDE.md の「関数の中に直書きした配列は禁止」(i18n spec §10-2)と同じ型の穴で、P5で7回踏んだ「書いてあるのに出ていない/拾えていない」族です。実装時は抽出器の対象に明示的に含めてください。
なお英語では `Combination Slam`(コンビネーション・スラム)と意味が衝突するため、**`Team Slam`** を推奨します。

### 5-B. 日本語呼称と英語呼称がズレる11件

設問①の表に全件掲載。特に**ブレーンバスターの2件は放置すると親子逆転**するので、①の裁定が最優先です。

### 5-C. 同じ文字列が複数のスタイル組で再利用されている6件

`STYLE_TAG_MOVES` はのべ89エントリですが、以下の6文字列が2〜3組で使い回されています(ユニーク82)。**辞書は文字列キーなので1件訳せば全組に効きます**が、抽出器が「のべ89件」で数えると未訳カウントがズレるので注意。

| 文字列 | 出現 | 組み合わせ |
|---|---:|---|
| ダブル関節技 | 3 | Submission+Submission / Submission+Technique / Technique+Technique |
| 空中からの合体関節技 | 2 | Aerial+Submission / Aerial+Technique |
| 崩し＆極め連携 | 2 | Allround+Submission / Allround+Technique |
| 叩き潰してからの関節技 | 2 | Brawler+Submission / Brawler+Technique |
| 投げからの関節極め | 2 | Grappler+Submission / Grappler+Technique |
| 打撃で崩して関節技 | 2 | Striker+Submission / Striker+Technique |

いずれも `Technique` スタイルが `Submission` の別名として扱われている名残です(`STYLE_COMPAT_MATRIX.Technique = STYLE_COMPAT_MATRIX.Submission`)。

### 5-D. 英語で衝突しかけた4件(別名で回避済み)

| JA(2件) | 素直に訳すと | 回避後 |
|---|---|---|
| ダイビング・ボディ・プレス(d8) / ダイビング・ボディ・プレス（大）(d11) | どちらも Diving Splash | **Diving Splash** / **Top-Rope Splash** |
| ヘッドバット(d6) / 頭突き(d11) | どちらも Headbutt | **Headbutt** / **Charging Headbutt** |
| ミサイルキック(d9打撃) / ミサイルキック（飛）(d9空中) | どちらも Missile Kick | **Missile Kick** / **Missile Dropkick** |
| コンビネーション・スラム(タッグ) / 合体スラム(フォールバック) | どちらも Combination Slam | **Combination Slam** / **Team Slam** |

**全242件の推奨EN名がユニークであることは機械検査済み**(本ドラフト作成時に `src/data.js` と全数突合。commonMoves 76 / styleMoves 83 / STYLE_TAG_MOVES 82 の名称・威力・カテゴリが完全一致することも同時に確認)。

### 5-E. 商標・実在レスラー名が近い3件

英語圏では**一般名として広く流通している**ので推奨案では使っていますが、避けたい場合の対案を用意しました。

| JA | 推奨EN | 由来 | 対案 |
|---|---|---|---|
| ラストライド d16 | Last Ride | Undertaker | Elevated Powerbomb |
| スワントン・ボム d14 | Swanton Bomb | Jeff Hardy | Senton Bomb |
| ツームストン・パイルドライバー d16 | Tombstone Piledriver | Undertaker | (代替名なし。技名として完全に一般化しているので維持を推奨) |

### 5-F. 日本語でしか成立しない語呂・原文が不明瞭なもの

| JA | 問題 | 処置 |
|---|---|---|
| シューズ → エアキック連打 | 「シューズ」が何を指すか原文から特定できない(靴=足技の意と解釈) | **Boot into Air-Kick Flurry**。★ — 意図が違えば差し替え |
| ハモリ式ドロップキック | 「ハモる」= 声を合わせる比喩。英語に対応語がない | **Unison Dropkicks**。★ |
| 上下同時極め | 上半身と下半身を同時に極める。英語で1語に畳めない | **Simultaneous Double Hold**(短縮 Double-Ended Hold)。★ |
| 緻密な連係グラウンド | 「緻密な」は技名に載りにくい形容 | **Precision Ground Combo**。★ |
| 肩車式ハイフライ | 「ハイフライ」は和製(ハイフライフロー由来) | **Shoulder-Perch Dive**(対案 Doomsday Splash)。★ |
| 首固め | JAが総称的で、対応する英語の丸め込み名が一意に決まらない | 未使用の実在名 **Inside Cradle** を充当。★ |
| ケンカキック | 「喧嘩」の荒っぽさ | **Street-Fight Kick**(対案 Brawler's Kick)。★ |

### 5-G. 逆に「そのままで良い」ことを確認した語

DDT / STF / PK / 450スプラッシュ / Michinoku Driver II — いずれも英語圏でその表記のまま通用します。**PK だけは★**を付けました(英語圏の総合/プロレス報道では PK のままですが、サッカーボールキック=Soccer Ball Kick と並ぶので、読者に伝わるか判断をいただきたい)。

---

## 6. 表示点と文字幅の実測

技名が画面に出るのは4か所です。**どこで何字入るか**を測ってから訳しました。

| # | 表示点 | 実装 | 枠 | 実測の余裕 |
|---|---|---|---|---|
| 1 | 観戦画面の技名(シングル) | `.move-value` / `#moveV`(`battle-engine-main.js:622`) | `.wm-exchange-grid` 右カラム `minmax(230px,1.18fr)`・15px・左寄せ・パネルは `overflow:hidden` | 内寸 約212px。**EN 約27字で1行**。JA最長「ツームストン・パイルドライバー（喧）」(18全角≒270px)は**既に2行に折れている** |
| 2 | 観戦画面の技名(タッグ) | `.move-name`(`tag-battle.html:174`・詳細パネルは15px) | `minmax(230px,1.1fr)` | 同上 |
| 3 | ビッグムーブ演出 | `.bigmove-name`(`battle-engine.html:208`) | Bebas Neue 56px・letter-spacing 6px・`— {move} —`。モバイルは36px / `max-width:92vw` / `overflow-wrap:anywhere` | Bebas Neue は極端な condensed なので**英語のほうが日本語より狭い**。JAは代替フォントで全角56px×15字≒930px を使っている |
| 4 | 決着表示・新聞・戦績 | `Engine.formatFinish`(`match-engine.js`)+ `FINISH_TEXT` | `{move} → 3-count` 等。P4で英訳済み | 技名+約10字。折り返し可の文脈が大半 |
| 5 | 試合ログ・カード確認 | `.crrm-row-fin`(`ui-common.js:13849`)ほか | 9〜11px の行 | 余裕あり |

**結論(字幅の物差し)**:

- **26字以下なら、既存の日本語より狭いか同等**。242件中 **236件**がここに収まる
- **27字超は6件のみ**。全件に短縮形を用意した(§3・§4の「短縮形」列)。最長は `Strike Combo into Finishing Hold`(32字) → `Strike Combo into Hold`(22字)
- 予防的に**24〜26字の13件にも短縮形を併記**した(合計19件)。実装時にカットイン専用の短縮辞書を持つか、1行で足りるなら原名のままにするかを選べるようにしてある

**タスク指示の「全角8字(≒半角16字)の枠」より実際の枠は広い**ことが分かりました。上の#1が最も狭い枠ですが、そこでも約27字あります。**英語化で新たに折り返しが発生する技は1つもありません**(日本語版で既に折れている枠に、より短い英文が入るため)。

---

## 7. 実装メモ(P7-5 実装時の配線。**本ドラフトではやらない**)

裁定後の実装で踏むべき点。P7設計 §1-D は行き先を「names-ledger(固有名詞辞書)の拡張 / `test/i18n-build-names.js` にmoves節」としています。

### 7-1. 台帳と生成器

- `i18n/names-ledger.json` に `moves` 節を足す。既存節と同じ `[{ ja, en, short?, confirmed }]` 形。`short` は§6の短縮形(任意)
- `test/i18n-build-names.js` に moves の**全数突合検査**を足す。既存の検査1〜3と同型で:
  1. `src/data.js` の `commonMoves` / `styleMoves` / `STYLE_TAG_MOVES` の全 `n` が台帳に存在する(data.js側の技追加・改名を検知するガード)
  2. `getTagMove` のフォールバック直書き(`合体スラム`)も対象に含める(§5-A)
  3. 台帳内で **en 値が重複しない**(§5-D の衝突再発防止。本ドラフトで242件ユニークを確認済みなので、この検査はそのまま通る)
- 抽出はのべ89件ではなく**ユニーク82件**で数える(§5-C)

### 7-2. **技名を「差し替え」てはいけない — 表示時の辞書引きに限ること**

これが実装上いちばん危ない点です。技名の**日本語文字列そのものを正規表現で判定しているコードが3か所**あります:

| ファイル | 行 | 何をしているか |
|---|---|---|
| `src/battle-sfx.js` | 182〜184 | `/スープレックス|バスター|スラム|DDT|…/` で効果音の種類を選ぶ |
| `src/battle-engine-main.js` | 318〜324 | `_movePresentation` が技名から解説文(`guide`)を選ぶ |
| `src/tag-battle-main.js` | 135〜139 | 同上(タッグ側の複製) |

技名を英語に置き換えた値をエンジンへ流すと、**効果音が全部フォールバックに落ち、技の解説文も打撃固定になります**。加えて `finMove` は `sp.results[]` として **`G` に永続化**されています(`app.js:7525` ほか)。

→ **規約どおり「表示点で `WM_I18N.t()` を1回」**(specs §6/§8)。日本語名は安定キーとしてそのまま `G` に残し、`Engine.formatFinish` の第4引数 `dict`(P4-2で用意済み)と各表示点で引く。§13-1「永続値は変えない」がそのまま当てはまります。

### 7-3. 表示点の配線先(§6の表と対応)

- `Engine.formatFinish(finType, finMove, isFinisher, dict)` — `{move}` は**テンプレ側だけがdictを通っていて技名は素通し**。技名にも `dict` を当てる(**P5で7回踏んだ「PH置換より前にdictを通す」型と同じ穴**)
- `battle-engine-main.js:622` の `_actionMoveName` / `tag-battle-main.js` の同等箇所
- `_showBigMoveSplash`(`battle-engine-main.js:989`)— ここは短縮形を使う候補
- `battle-engine-main.js:1257` の `introBig` 文(`${moveName}をがっちりロック！`)— テンプレ側は既に台帳にあるが技名PHは素通し
- `ui-common.js:13849` / `13995` の `finMove` 直出し2か所
- `MOVE_PRESENTATION` の `guide` 6本(§7-2の判定を日本語のまま残したうえで、**出力する解説文だけ**英訳)— これは技名ではなく地の文なので、P7-1(Cラベル表)か本バッチのどちらで拾うか要調整

### 7-4. 検証

P7設計 §3 の各バッチ完了条件をそのまま適用: 対象表が `specs/i18n-runtime-spec-v1.0.md` §13-2 B から消える / build-dict 未訳0 / ja-golden完全一致 / `npm test` / ja走破digest不変 / EN走破PASS + **画面別JA露出の before→after**。技名は観戦画面(`show`)のJA露出に効くはずです。

---

## 8. 本ドラフトの対象外

- **個人技スロット**(`docs/move-catalog-reclassified-v0.2.md`)— 未実装。技帯・配置語の訳案だけ §2-2 に置いた
- **技の解説文**(`MOVE_PRESENTATION` の `guide` 6本+分岐7本)— 技名ではなく地の文。P7-1/P7-2 の担当(§7-3 に配線先だけ記載)
- **勝利セリフ・ダメージセリフの中に出る技名** — P5 で訳出済み。本ドラフトの表記と食い違う箇所があれば、実装時に `i18n/dialogue-ledger.json` 側を本表に合わせる
- **カタログ v0.2 の新規追加技**(パラダイスロック / グラウンド卍固め)— `src/data.js` に存在しないので対象外。実装されたら本表に追記
