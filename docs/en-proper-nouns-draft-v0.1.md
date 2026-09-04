# 固有名詞 英語表記ドラフト v0.1（Keisuke 承認用）

> **✅ 裁定確定(2026-09-02 Keisuke)**: ①人名=名→姓(Western order) ①-b=マクロンなし ②Joshiは団体名の中だけ(普通名詞はwomen's pro wrestling) ③大会名=意訳基本・天頂戦のみ音写Tenchosen — **全て推奨案どおり採用**。
> 付随処置(Fable): 堂前ユキ/結城玲奈の同綴り衝突は**結城=Rena Yuuki**(uを重ねる)で回避(マクロンなし裁定下の唯一の実用解)。
> **未決で残るもの**: 要読み確認49件(選手35+コーチ14)——暫定読みで辞書化を先行し、Keisukeの訂正をいつでも反映できる形にする(表記修正は辞書1行の差し替えで済む)。


- 作成: 2026-09-02(Fable)
- 位置づけ: **Stage B P6「固有名詞辞書」の承認前ドラフト**。i18n計画 決定#3「固有名詞は一覧を作って Keisuke 承認を得てから辞書化」に対応
- 先行依存: 本ドラフトの承認が **P3b(UI英訳・`hasProperNoun`付きキー)/ P4(新聞)/ P5(セリフ)** の律速になる(docs/i18n-stage-b-p3b-design-v0.1.md §D-B5)
- 規範元: `docs/en-tone-bible-draft-v0.1.md` §6(裁定6件・米綴り統一) / `docs/i18n-stage-b-p3b-design-v0.1.md`(用語集シード・D-B6)
- 情報源: `src/data.js`(ALL_CHARS 127 / ALL_COACHES 35 / VENUES 10 / TITLES 2 / RIVAL_ORG_NAME_POOL 12 / SPECIAL_EVENT_INTRO 5)、`src/ui-render.js`(黒田署名)、`specs/`(既存の英語スペック名)
- 状態: **未承認ドラフト**。この表の EN 列は「Fable の第一案」であって確定ではない

---

## 0. 裁定設問(この3問に答えていただければ本表は確定できます)

### 設問① 人名のローマ字順序 — **推奨: 名→姓(Western order)**

| 案 | 例 | 論拠 |
|---|---|---|
| **◎ A: 名→姓** | **Kanako Tomioka** / Sayoko Okochi | 英語圏プロレス報道の実際の慣行(Kazuchika Okada / Mayu Iwatani / Utami Hayashishita)。読者=英語圏の女子プロレスファンにとってこれが「自然な表記」 |
| B: 姓→名 | Tomioka Kanako | 近年の日本政府公文書・学術表記。ただしプロレス報道では使われず、英語圏読者は姓を名だと誤読する |

**推奨理由**: 本作の英語版の読者はトーンバイブル §5-2 で想定した「キャラに詳しい英語圏の女子プロレスファン」。彼らが日常的に読む媒体(Cagematch / Fightful / Tokyo Joshi の英語アカウント)はすべて A。ゲーム内では**姓のみで呼ばれる場面**(隊列ラベル・派閥名・戦績表)も多いが、姓単独表示は順序に依存しないため A で問題ない。

#### 設問①-b(付随): 長音(マクロン)の扱い — **推奨: マクロンなし**

| 案 | 例 |
|---|---|
| **◎ A: マクロンなし** | **Sayoko Okochi** / Toko Abukuma / Ryuta Makabe / Rena Yuki |
| B: マクロンあり(ヘボン式厳密) | Sayoko Ōkōchi / Tōko Abukuma / Ryūta Makabe |
| C: 長音を h/u で表す | Ohkohchi / Tohko / Ryuuta |

**推奨理由**: (1) プロレス報道が A(Kota Ibushi であって Kōta ではない)。(2) 狭い UI 枠・小さいフォントでマクロンが潰れる。(3) 本ドラフトの表は A で書いてある。B を採るなら機械変換で一括対応可能(対象は約30名)。

### 設問② 「女子プロレス」を **"Joshi"** と訳すか — **推奨: 団体名の中だけ Joshi、普通名詞は women's**

| 用法 | 訳 | 例 |
|---|---|---|
| **団体名の一部**(固有名詞) | **Joshi** ◎ | ふたば女子プロレス → **Futaba Joshi Pro Wrestling** |
| **普通名詞**(ジャンル・地の文・UI説明) | **women's pro wrestling** | 「女子プロレス界」→ "the women's pro wrestling scene" |

**推奨理由**: "joshi" / "joshi puroresu" は英語圏の女子プロレス言説で完全に定着した語で、団体名に入ると**日本の団体だと一目で伝わる**(実例: Tokyo Joshi Pro Wrestling)。一方 UI や地の文で毎回 "joshi" を使うとジャーゴン過多になり、P3b 用語集の平明さ方針(団体=promotion / 選手=wrestler)と衝突する。**固有名詞の内側だけ Joshi** が両立点。
- 対案: 全面 "Women's"(Futaba Women's Pro Wrestling)。ジャンル語を知らない層に親切だが、雰囲気は薄れる
- 対案: 全面 "Joshi"。世界観は濃くなるが UI 文が読みにくくなる

### 設問③ 大会名の基本方針 — **推奨: 意訳を基本・固有性の強い1本のみ音写**

| 大会 | 推奨 | 理由 |
|---|---|---|
| 春のタッグリーグ | **Spring Tag League**(意訳) | 内容がそのまま名前。音写に意味がない |
| U-20 ジュニアトーナメント | **U-20 Junior Tournament**(意訳) | 同上 |
| 4団体勝ち残り対抗戦 | **Autumn Gauntlet War**(意訳) | 既存の内部英語名(`specs/autumn-gauntlet-war-spec-v0.1.md`)を採用 |
| PPV GRAND FINAL | **PPV GRAND FINAL**(原文維持) | すでに英語 |
| 天頂戦 | **Tenchosen**(音写)+ 初出のみ副題 | ★ここだけ音写。下記 §5 参照 |

**推奨理由**: 「格」は音写では出ない。読んで意味が分かる名前のほうが大会の性格(春/若手/勝ち残り/年間最終戦)が伝わる。ただし**天頂戦だけは 4年に一度・ベルトより上という別格の位置づけ**で、他の4大会と同じ語法にすると格が並んでしまう。日本語の音のまま置くことで「この大会だけ別のもの」という視覚的差異が作れる(実在の例: G1 Climax / Ōedo Tournament を英語圏がそのまま呼ぶのと同じ扱い)。→ 対案は §5 に併記。

---

## 1. 表記方針(承認後、辞書生成時の機械ルールにする)

1. **ヘボン式(修正ヘボン式)**。し=shi / ち=chi / つ=tsu / ふ=fu / じ=ji
2. **長音はマクロンなし**(設問①-b)。おお/おう→o、うう→u
3. **撥音「ん」**は n。母音・y の前は n'(該当なし)。n+n が続く語はそのまま重ねる(観音崎 → Kannonzaki)
4. **促音「っ」**は次の子音を重ねる。ch の前は t(該当なし)
5. **「ヶ」は無音**(梅ヶ丘 → Umegaoka / 富士見ヶ丘 → Fujimigaoka / 宮ケ瀬 → Miyagase)
6. **姓名の区切りはスペース1つ**。ミドルイニシャルはピリオド付き(Leona O. Steinfeld)
7. **日本人キャラのカタカナ名**は原則ローマ字(レオナ→Reona)。ただし**明らかに西洋名を意図したもの**は原語綴り(ルーシー→Lucy / エリカ→Erika / モナ→Mona)。境界例は §2-2 で個別に立てる
8. **リングネーム的な冠称**(クラッシャー等)は英語のリングネーム語法に合わせる(Crusher)
9. **旧字体は現代綴りに落とす**(亞里亞 → Aria)
10. **米綴り統一**(トーンバイブル裁定#5)。固有名詞にも適用(Center であって Centre)

---

## 2. キャラクター名(選手 127名)

### 2-1. 確定案(92名) — 読みに争いがないもの

| ID | JA | EN案(名→姓) | 備考 |
|---|---|---|---|
| 1 | 阿武隈塔子 | Toko Abukuma | 阿武隈=河川名。長音表記なら Tōko |
| 2 | 富岡加奈子 | Kanako Tomioka | トーンバイブル §2-2 のアンカー |
| 4 | 高津小春 | Koharu Takatsu | トーンバイブル §2-1 のアンカー |
| 5 | 深町真琴 | Makoto Fukamachi | |
| 7 | 高階まさみ | Masami Takashina | 富岡家の専属メイド。富岡と並ぶ場面が多い |
| 9 | 宇田川里奈 | Rina Udagawa | トーンバイブル §2-1 のアンカー |
| 12 | 生駒エリカ | Erika Ikoma | カタカナ名=西洋名系。Erika 採用 |
| 13 | 堂前ユキ | Yuki Domae | トーンバイブル §2-3 のアンカー。ID108 Rena Yuki と姓名が視覚衝突(§2-3 注記) |
| 14 | 黒江舞 | Mai Kuroe | |
| 15 | 楠木なぎさ | Nagisa Kusunoki | |
| 17 | 川野辺菜穂子 | Nahoko Kawanobe | トーンバイブル §2-5 のアンカー |
| 18 | 出羽鷹子 | Takako Dewa | 一人称「ワタシ」は英語では消える(裁定#6) |
| 19 | 四条あずさ | Azusa Shijo | 長音表記なら Shijō |
| 20 | 岸ゆみえ | Yumie Kishi | |
| 22 | 美濃山まりな | Marina Minoyama | |
| 23 | 早見知子 | Tomoko Hayami | |
| 24 | 園部梨花 | Rika Sonobe | |
| 26 | 宮守なつめ | Natsume Miyamori | |
| 27 | 八重樫舞 | Mai Yaegashi | |
| 28 | 岩屋みら | Mira Iwaya | |
| 31 | 平松かなみ | Kanami Hiramatsu | |
| 33 | 梅ヶ丘みのり | Minori Umegaoka | ヶ無音 |
| 34 | 北畠吉乃 | Yoshino Kitabatake | |
| 35 | 上野原弥生 | Yayoi Uenohara | |
| 36 | 真鍋綾乃 | Ayano Manabe | |
| 39 | 神谷沙奈絵 | Sanae Kamiya | |
| 40 | 高輪まみ | Mami Takanawa | |
| 41 | 根岸亞里亞 | Aria Negishi | 旧字体→現代綴り |
| 42 | 本郷真理子 | Mariko Hongo | トーンバイブル §2-4 のアンカー。長音なら Hongō |
| 44 | 福浦理乃 | Rino Fukuura | uu を詰めない(Fukura にしない) |
| 45 | 高槻千歳 | Chitose Takatsuki | |
| 46 | 井沢遥 | Haruka Izawa | |
| 47 | 斎藤麻衣 | Mai Saito | 長音なら Saitō |
| 48 | 菊池璃子 | Riko Kikuchi | |
| 49 | 高橋まゆみ | Mayumi Takahashi | |
| 50 | 相田萌 | Moe Aida | |
| 51 | 三橋ふみえ | Fumie Mitsuhashi | |
| 52 | 西川ちあき | Chiaki Nishikawa | ID105 Chiaki Kuroiwa と同名 |
| 53 | 小森さなえ | Sanae Komori | ID39 Sanae Kamiya と同名 |
| 54 | 阿部みのり | Minori Abe | ID33 Minori Umegaoka と同名 |
| 55 | 大久保桃子 | Momoko Okubo | 長音なら Ōkubo |
| 56 | 片桐ありさ | Arisa Katagiri | ID86 Arisa Serizawa と同名 |
| 57 | 浅見里緒菜 | Riona Asami | |
| 61 | 観音崎せりか | Serika Kannonzaki | 撥音+n。Kanonzaki にしない |
| 62 | 宮ケ瀬千夏 | Chinatsu Miyagase | ケ無音 |
| 64 | 湯本ほたる | Hotaru Yumoto | |
| 65 | 倉見菜々 | Nana Kurami | |
| 67 | 柳島みずほ | Mizuho Yanagishima | |
| 69 | 早川モナ | Mona Hayakawa | 西洋名系 |
| 71 | 東金沙織 | Saori Togane | 東金=千葉の地名。長音なら Tōgane |
| 72 | 穴澤ほのか | Honoka Anazawa | |
| 74 | 富士見ヶ丘遥 | Haruka Fujimigaoka | ヶ無音。ID46 Haruka Izawa と同名 |
| 75 | 海老名栞 | Shiori Ebina | |
| 76 | 栗林あかり | Akari Kuribayashi | |
| 78 | 椿山みさき | Misaki Tsubakiyama | |
| 79 | 久堂梨々花 | Ririka Kudo | 長音なら Kudō |
| 80 | 高島さや | Saya Takashima | |
| 81 | 坂本莉衣奈 | Riina Sakamoto | 対案 Rina(ID9/ID116 と衝突するため Riina 推奨) |
| 82 | 近藤ゆりか | Yurika Kondo | 長音なら Kondō |
| 83 | 佐久間ひより | Hiyori Sakuma | |
| 85 | 鴨志田ルーシー | Lucy Kamoshida | 西洋名系。Rushi にしない |
| 86 | 芹沢亜里紗 | Arisa Serizawa | |
| 88 | 愛川明日香 | Asuka Aikawa | |
| 89 | 赤羽あんな | Anna Akabane | |
| 90 | 玉手すみれ | Sumire Tamate | |
| 91 | 等々力あかね | Akane Todoroki | |
| 92 | 飯島冴子 | Saeko Iijima | ii を詰めない |
| 93 | 松久保伊織 | Iori Matsukubo | |
| 95 | 小西ゆきえ | Yukie Konishi | |
| 96 | 松下真理亜 | Maria Matsushita | |
| 97 | 岩崎みどり | Midori Iwasaki | |
| 98 | 米山杏里 | Anri Yoneyama | |
| 99 | 三浦早紀 | Saki Miura | ID106 Saki Akanuma と同名 |
| 101 | 沢登鮎 | Ayu Sawanobori | ID100 の先輩。並記される |
| 102 | 大山たかみ | Takami Oyama | 長音なら Ōyama |
| 103 | 財津琴美 | Kotomi Zaitsu | |
| 104 | 吉野萌子 | Moeko Yoshino | ID34 の given name Yoshino と視覚衝突 |
| 105 | 黒岩千晶 | Chiaki Kuroiwa | |
| 106 | 赤沼紗稀 | Saki Akanuma | |
| 107 | 松岡綾乃 | Ayano Matsuoka | ID36 Ayano Manabe と同名 |
| 108 | 結城玲奈 | Rena Yuki | 姓 Yuki(結城)。ID13 の given name Yuki(ユキ)と綴り一致 → §2-3 |
| 109 | 戸塚ゆかり | Yukari Totsuka | |
| 110 | 若林美佐子 | Misako Wakabayashi | |
| 111 | 相模あずみ | Azumi Sagami | |
| 112 | 朝比奈ひかり | Hikari Asahina | |
| 113 | 綿貫すず | Suzu Watanuki | |
| 114 | 木村レイカ | Reika Kimura | 西洋名ではないので Reika |
| 120 | 蔵前静 | Shizuka Kuramae | |
| 121 | 山本理香 | Rika Yamamoto | ID24 Rika Sonobe と同名 |
| 122 | 宮沢ひかる | Hikaru Miyazawa | ID112 Hikari と1字違い(意図的に残す) |
| 123 | 柳沼英子 | Eiko Yaginuma | |
| 127 | 榊原菜摘 | Natsumi Sakakibara | |

### 2-2. 要読み確認(35名) — Keisuke の確認が要るもの

**確認していただきたいのは「日本語の読み」だけです。**読みが決まれば英語表記は §1 のルールで機械的に決まります。

| ID | JA | 第一案 | 対案 | なぜ確認が要るか |
|---|---|---|---|---|
| 3 | 澤出みずき | Mizuki **Sawade** | Sawaide / Sawaide | 「澤出」は希少姓。サワデ/サワイデ両方実在 |
| 6 | 副沢たまき | Tamaki **Fukuzawa** | Soezawa / Soesawa | 「副沢」は希少姓。フクザワ/ソエザワ |
| 8 | 林真尋 | **Mahiro** Hayashi | Masahiro / Mihiro | 「真尋」はマヒロが現代女性名として優勢だが確定しない |
| 11 | 橘玲美 | **Remi** Tachibana | Tamami / Reimi | 「玲美」レミ/タマミ/レイミ。蠱惑属性のアンカー選手なので特に要確認 |
| 16 | 大河内紗代子 | Sayoko **Okochi** (※ネイティブ提案: 長音を感じさせる Ookouchi / Ōkouchi。マクロンなし裁定との整合をKeisuke裁定) | Okawachi | 「大河内」オオコウチ/オオカワチ。**お嬢様属性のアンカー選手**(トーンバイブル §2-2 のキャラ裁定対象)なので最優先で確定したい |
| 21 | 木ノ内幸音 | **Yukine** Kinouchi | Kone / Yukine Kinonouchi | 「幸音」ユキネ/コウネ。姓もキノウチ/キノウチ |
| 25 | 石戸谷なつき | Natsuki **Ishitoya** | Ishidoya | 「石戸谷」イシトヤ/イシドヤ両方実在 |
| 29 | 相沢未来 | **Mirai** Aizawa | Miku / Miki | 「未来」ミライ/ミク/ミキ。どれも女性名として普通 |
| 30 | 松川杏樹 | **Anju** Matsukawa | Anna / Anzu / Kyoju | 「杏樹」アンジュ/アンナ/アンズ |
| 32 | 双里明日香 | Asuka **Futasato** | Sori / Namisato / Sosato | 「双里」は極めて希少。読みの根拠が薄い |
| 37 | 白銀麗子 | Reiko **Shirogane** | Shirokane | 「白銀」シロガネ/シロカネ。地名はシロカネ、姓はシロガネが多い |
| 38 | 芝彩音 | **Ayane** Shiba | Ayano / Saine | 「彩音」アヤネ/アヤノ |
| 43 | 金沢文 | **Aya** Kanazawa | Fumi / Bun / Aya | 一文字名「文」。アヤ/フミ/ブン |
| 58 | 丹羽穂垂 | **Hotaru** Niwa | Hodare / Hozue / Hotari | 「穂垂」は造語級。**読みの根拠が最も薄い1名** |
| 59 | 池辺マリ | Mari **Ikebe** | Ikenobe / Ikebe | 「池辺」イケベ/イケノベ両方実在 |
| 60 | 馬入橋ほとり | Hotori **Banyubashi** | Manyubashi / Bannyubashi / Umairibashi | 「馬入橋」は平塚の実在橋名(バニュウバシ)由来と推定。姓としては前例なし |
| 63 | 伊勢原文奈 | **Fumina** Isehara | Ayana / Fumina | 「文奈」フミナ/アヤナ |
| 66 | 長谷川レオナ | **Reona** Hasegawa | Leona Hasegawa | **表記の選択**(読みは確定)。日本人キャラなので Reona 推奨だが、ID87 のレオナと綴りを分けるか揃えるかの判断 |
| 68 | 大庭愛菜 | **Mana** Oba | Aina / Manana、姓 Oniwa | 「愛菜」マナ/アイナ、「大庭」オオバ/オオニワ |
| 70 | 浜竹美咲 | Misaki **Hamatake** | Hamadake | 「浜竹」は希少姓。清濁が決まらない |
| 73 | 大馬越よし子 | Yoshiko **Omagoshi** | Obagoe / Oumagoshi / Omakoshi | 「大馬越」は希少姓。読みの根拠が薄い |
| 77 | 新見ゆり | Yuri **Niimi** | Shinmi / Nimi | 「新見」ニイミ(岡山の地名)/シンミ |
| 84 | 南谷杏 | **An Minamitani** | Anzu Minamiya / An Nantani | 姓・名とも二択。「南谷」ミナミタニ/ミナミヤ、「杏」アン/アンズ |
| 87 | レオナ・O・シュタインフェルト | **Leona O. Steinfeld** | Steinfeldt / Steinfelt、Leona/Reona | **原語綴りの推定**。ドイツ語系として Steinfeld を第一案。ミドルネーム "O." が何の頭文字かを決めると綴りが安定する |
| 94 | 須藤美月 | **Mizuki** Sudo | Mitsuki | 「美月」ミヅキ/ミツキ。ID3 Mizuki Sawade と同名になる点も判断材料 |
| 100 | 土岐山乃ノ佳 | **Nonoka** Tokiyama | Nonoyoshi / Nonoka Dokiyama | 「乃ノ佳」は当て字。ノノカ第一案 |
| 115 | 豊田いすず | Isuzu **Toyoda** | Toyota | 姓としてはトヨダが優勢。トヨタだと自動車メーカーの連想が強い |
| 116 | リナ・モーガン | **Rina Morgan** | Lina Morgan / Lena Morgan | **原語綴りの推定**。外国人キャラ。R/L のどちらか、日系設定かどうかで決まる |
| 117 | クラッシャー毒島 | **Crusher Busujima** | Crusher Dokushima / Kurassha Busujima | 「毒島」はブスジマが実在読み。冠称は英語リングネーム語法で Crusher 推奨 |
| 118 | 割田久美 | Kumi **Warita** | Wareda / Warida | 「割田」ワリタ/ワリダ |
| 119 | 岩小路志摩子 | Shimako **Iwakoji** | Iwashoji / Iwakouji | 「岩小路」イワコウジ/イワショウジ |
| 124 | 清川 怜 | **Rei** Kiyokawa | Ryo / Satoshi / Rei | 一文字名「怜」。レイ/リョウ/サトシ。※JA原文に姓名間スペースあり(他キャラと不統一) |
| 125 | 藤代絵麻 | Ema **Fujishiro** | Fujidai / Fujishiro | 「藤代」フジシロ/フジダイ |
| 126 | 西園百合香 | Yurika **Nishizono** | Saien / Nishizono Yuriko | 「西園」ニシゾノ/サイエン、「百合香」ユリカ/ユリコ |
| 128 | 巳沼紗霧 | Sagiri **Minuma** | Miuma / Minuma Sakiri | 「巳沼」は希少姓。「紗霧」サギリ/サキリ |

### 2-3. 表記上の衝突メモ(承認後の実装で気にする点)

- **Yuki の重複**: ID13 堂前ユキ = "Yuki Domae"(given name)と ID108 結城玲奈 = "Rena Yuki"(surname)。日本語では「ユキ」「結城」で全く別物だが、英語では同綴りになる。**姓のみ表示の画面(隊列ラベル・戦績表・派閥名)で "Yuki" が2人を指しうる**。回避するなら ID108 を "Yuuki"(結城=ゆうき)にする手がある — **これは設問①-b(長音)の判断に連動する**
- 同名(EN綴り一致)の組: Mai(3名) / Chiaki(2) / Sanae(2) / Minori(2) / Arisa(2) / Haruka(2) / Saki(2) / Ayano(2) / Rika(2) / Mizuki(要読み確認の結果次第で2)。**日本語版でも下の名前は重複しているので問題なし**(表示は原則フルネーム)。念のため列挙

---

## 3. コーチ名(35名)

`ALL_COACHES`。JA原文は姓と名の間に全角スペースが入っている。EN は §1 のルール(名→姓)。

### 3-1. 確定案(21名)

| ID | JA | EN案 | 備考 |
|---|---|---|---|
| 2 | 飛鳥 真琴 | Makoto Asuka | 女・34 |
| 4 | 岩田 拓海 | Takumi Iwata | 男・41 |
| 5 | 沢村 玲子 | Reiko Sawamura | 女・45 |
| 6 | 朝日 義男 | Yoshio Asahi | 男・52 |
| 8 | 白川 沙耶 | Saya Shirakawa | 女・29 |
| 9 | 大森 健吾 | Kengo Omori | 男・32。長音なら Ōmori |
| 11 | 真壁 龍太 | Ryuta Makabe | 男・37。長音なら Ryūta |
| 12 | 長谷川 美咲 | Misaki Hasegawa | 女・33。選手ID66 長谷川レオナと同姓(別人) |
| 13 | 黒田 修平 | Shuhei Kuroda | 男・44。元スポーツ紙記者。**新聞記者 黒田幸子とは別人・同姓**(付録B) |
| 14 | 土屋 弘美 | Hiromi Tsuchiya | 女・50 |
| 15 | 林 拓海 | Takumi Hayashi | 男・30。ID4 と同名(意図的) |
| 16 | 森田 悠子 | Yuko Morita | 女・38。長音なら Yūko |
| 17 | 篠原 隆 | Takashi Shinohara | 男・55 |
| 18 | 赤城 凛 | Rin Akagi | 女・36 |
| 20 | 藤原 千春 | Chiharu Fujiwara | 女・47 |
| 22 | 安藤 美波 | Minami Ando | 女・31。長音なら Andō |
| 23 | 堀内 義孝 | Yoshitaka Horiuchi | 男・53 |
| 25 | 宮沢 康弘 | Yasuhiro Miyazawa | 男・57 |
| 30 | 冴島 楓 | Kaede Saejima | 女・39 |
| 33 | 葉月 レナ | Rena Hazuki | 女・45。日本人なので Rena |
| 35 | 如月 薫 | Kaoru Kisaragi | 女・52 |

### 3-2. 要読み確認(14名)

| ID | JA | 第一案 | 対案 | なぜ確認が要るか |
|---|---|---|---|---|
| 1 | 鬼塚 剛志 | **Takeshi** Onizuka | Tsuyoshi / Goshi / Takashi | 「剛志」タケシ/ツヨシ/ゴウシ |
| 3 | 鶴見 正嗣 | **Masatsugu** Tsurumi | Shoji / Masashi | 「正嗣」マサツグ/ショウジ |
| 7 | 紅林 太一 | Taichi **Kurebayashi** | Benibayashi / Kobayashi | 「紅林」クレバヤシ/ベニバヤシ |
| 10 | 宮本 花菜 | **Kana** Miyamoto | Hana / Hanana / Kana | 「花菜」カナ/ハナ/ハナナ |
| 19 | 西岡 学 | **Manabu** Nishioka | Gaku | 一文字名「学」。マナブ/ガク |
| 21 | 熊谷 鉄也 | Tetsuya **Kumagai** | Kumagaya | 「熊谷」クマガイ(姓)/クマガヤ(地名) |
| 24 | 中村 紗弓 | **Sayumi** Nakamura | Sayu / Suyumi | 「紗弓」サユミ/サユ |
| 26 | カルロス 真理 | **Mari Carlos** | Mari Marques 等、姓の綴り自体が要確認 | 日系ブラジル人(女・42・出身ブラジル)。「カルロス」は通常**男性の名**であって姓ではない。設定意図(姓なのか通称なのか)の確認が要る。姓なら Carlos、名の並びも要判断 |
| 27 | 大河原 剛士 | **Takeshi** Okawara | Tsuyoshi / Goshi | ID1 と同じ「剛志/剛士」問題。長音なら Ōkawara |
| 28 | 羽田 小百合 | Sayuri **Hata** | Haneda | 「羽田」ハタ(姓に多い)/ハネダ(空港・地名) |
| 29 | 陳 偉明 | **Chen Wei-ming** | Chen Weiming / Chin Iman(日本語読み) | 台湾出身(男・49)。**中国語圏の名は語順が姓→名のまま**が慣行。台湾式のハイフン付きウェード式を第一案、大陸式ピンインが対案。日本語読み(チン・イメイ)を採るかも判断が要る |
| 31 | 神崎 鋼子 | **Koko** Kanzaki | Kaneko / Taeko / Tsuyoko | 「鋼子」は極めて珍しい。異名「鉄の母」= "the Iron Mother" と対になる名なので意図を確認したい |
| 32 | 巌流 正道 | **Masamichi Ganryu** | Seido / Masamichi Iwanagare | 「巌流」ガンリュウ(巌流島)と推定。「正道」マサミチ/セイドウ |
| 34 | 御堂 清四郎 | **Seishiro Mido** | Kiyoshiro / Midou | 「御堂」ミドウ。「清四郎」セイシロウ/キヨシロウ |

---

## 4. 団体名

### 4-1. ライバル団体(`RIVAL_ORG_NAME_POOL`・12件)

ゲーム開始時に各ティア(S/A/B)から1つずつ抽選される。**全12件が表示されうる**ので全件必要。

| ティア | JA | 音写案 | 意訳案 | 推奨 |
|---|---|---|---|---|
| S | 皇武館 | **Kobukan** ◎ | Imperial Martial Hall | 音写。道場系の館号は英語圏でもそのまま通る(Kodokan の前例)。意訳すると仰々しくなる |
| S | 凰翔プロレス | **Osho Pro Wrestling** | Soaring Phoenix Pro Wrestling ◎ | **意訳を推奨**。"Osho" は英語話者に読めず(oh-show)音の格が出ない。凰=鳳凰の雌、翔=舞い上がる → Phoenix 系が原義に忠実で、S級団体の格も出る |
| S | グランエンプレス | **Grand Empress** ◎ | (同左) | 元がカタカナ英語。綴りを戻すだけ |
| S | 天頂プロレス | **Tencho Pro Wrestling** ◎ | Zenith Pro Wrestling | **設問③と連動**。天頂戦を Tenchosen にするなら団体も Tencho で揃える。天頂戦を意訳するなら Zenith Pro Wrestling に揃える。**単独では決めない** |
| A | ノヴァインパクト | **Nova Impact** ◎ | (同左) | カタカナ英語 |
| A | ブレイクスルー | **Breakthrough** ◎ | (同左) | カタカナ英語 |
| A | インパルス | **Impulse** ◎ | (同左) | カタカナ英語 |
| A | イグニッション | **Ignition** ◎ | (同左) | カタカナ英語 |
| B | なでしこプロレス | **Nadeshiko Pro Wrestling** ◎ | Pink Blossom Pro Wrestling | 音写推奨。"Nadeshiko" はサッカー日本女子代表(Nadeshiko Japan)で英語圏に浸透済み |
| B | あさひ女子プロレス | **Asahi Joshi Pro Wrestling** ◎ | Asahi Women's Pro Wrestling | 設問②の適用例。音写+Joshi |
| B | 春日野プロレス | **Kasugano Pro Wrestling** ◎ | (意訳不可) | 地名系。音写一択 |
| B | ふたば女子プロレス | **Futaba Joshi Pro Wrestling** ◎ | Futaba Women's Pro Wrestling | 設問②の適用例 |

**「プロレス」の訳**: 団体名の中では **"Pro Wrestling"**(Puroresu にしない)。英語圏の団体名表記(Tokyo Joshi Pro Wrestling / Pro Wrestling NOAH)に揃える。

### 4-2. プレイヤー団体

| JA | EN案 | 備考 |
|---|---|---|
| (プレイヤーが入力した団体名) | **入力値をそのまま表示** | 英語モードでも翻訳しない。日本語入力もそのまま出る |
| `プレイヤー団体`(内部フォールバック) | **Your Promotion** | 固有名詞ではなく UI フォールバック。P3b 用語集(団体=promotion)準拠 |
| `あなたの団体`(内部フォールバック) | **Your Promotion** | 上と同一訳で統一する(JA では2表記ゆれがある) |
| `他団体`(未知の団体) | **Another Promotion** | 同上 |

---

## 5. 大会・イベント名

| JA(表示名) | 音写案 | 意訳案 | 推奨 | 根拠 |
|---|---|---|---|---|
| 🌸 春のタッグリーグ | Haru no Tag League | **Spring Tag League** ◎ | 意訳 | 内部スペック名 `spring-tag-league-spec` と一致。名前がそのまま内容 |
| 🏟️ U-20 ジュニアトーナメント | — | **U-20 Junior Tournament** ◎ | 意訳 | "U-20" は国際共通。Junior は英語圏プロレスでも階級語として通じる |
| ⚔️ 4団体勝ち残り対抗戦 | — | **Autumn Gauntlet War** ◎ | 意訳 | 既存の内部英語名(`specs/autumn-gauntlet-war-spec-v0.1.md`)。gauntlet が「勝ち残り」を正確に運ぶ。**"Survival Series" は WWE の年次PPV名なので避ける** |
| 〃 対案 | | Four-Promotion Elimination War / The Four-Way War | | 「4団体」を名前に残したい場合 |
| 🏆 PPV GRAND FINAL | — | **PPV GRAND FINAL**(原文維持)◎ | そのまま | すでに英語。大文字も維持 |
| 👑 天頂戦 | **Tenchosen** ◎ | The Summit / Zenith Tournament / Crown Tournament | 音写(初出のみ副題) | 設問③参照。4年に一度・「ベルトより上」の別格を**語法の違い**で見せる。初出のみ "Tenchosen — the Summit" と添える運用を推奨 |
| 〃 対案A | | **The Summit** | | 意訳で統一する場合の第一候補。天頂=summit が原義に最も近い |
| 〃 対案B | | **Zenith Tournament** | | 天頂プロレス(§4-1)を Zenith Pro Wrestling にする場合はこちらで揃う |
| 定期興行(第{n}回) | — | Show #{n} | (P3b・固有名詞ではない) | UI 用語 |
| 特別興行 | — | Special Show | (P3b) | 用語集: 興行=show |

**注**: 5大会は `SPECIAL_EVENT_INTRO` に絵文字付きで定義されている。**絵文字の位置は原文維持**(P3b D-B3)。

---

## 6. ベルト(王座)名

`TITLES`(data.js:3892)は2本。**内部 id は `world` / `unified` だが、`world` を "World Championship" と訳してはならない**(2026-07-16 ナレーション裁定「ベルトに『世界』を冠しない」を英語でも維持)。

| JA | 内部id | EN案 | 対案 | 備考 |
|---|---|---|---|---|
| 団体王座 | `world` | **Promotion Championship** ◎ | Singles Championship / House Championship / The Championship | 用語集(団体=promotion)に素直に従った形。全国統一王座との対比が英語でも明確に出る(promotion 単位 ↔ national 単位)。**"World Championship" は禁止** |
| 全国統一王座 | `unified` | **National Unified Championship** ◎ | Unified National Championship | 「世界」を足さないので裁定と整合。天頂戦の優勝者が保持する最上位ベルト |

**関連表記(P3b で使う派生形)**

| JA | EN案 |
|---|---|
| 団体王座戦 / タイトル戦 | Title Match |
| 全国統一王座戦 | National Unified Title Match |
| 王座決定戦 | Vacant Title Match |
| 王座空位 | Title Vacant |
| 王者 / 挑戦者 | Champion / Challenger |
| {n}度目の防衛 | {n}th Defense |

**実装メモ**: `management.js` に `beltDisplayName`(既定 null =「団体王座」)という**将来の改名イベント用フック**がある。ここが将来使われるなら、英語では "{Promotion} Championship" のような動的名にする余地がある。**現時点では固定文字列で足りる**。

---

## 7. 会場名(`VENUES` 10段)

**全10件が「実在の会場名」ではなく会場の等級ラベル**(公民館→ドームの梯子)。よって**全件 意訳を推奨**、ローマ字は不採用。後楽園ホール型の固有会場名は現データに存在しない。

| # | JA | 収容 | EN案 | 備考 |
|---|---|---|---|---|
| 0 | 公民館 | 150 | **Community Center** ◎ | 米綴り(Centre にしない・裁定#5) |
| 1 | 小ホールA | 300 | **Small Hall A** ◎ | |
| 2 | 小ホールB | 500 | **Small Hall B** ◎ | |
| 3 | 市民会館 | 800 | **Civic Hall** ◎ | 対案 Civic Center(#0 と語が被るので Hall 推奨) |
| 4 | 中ホールA | 1,200 | **Medium Hall A** ◎ | 対案 Mid-Size Hall A(長い) |
| 5 | 中ホールB | 2,000 | **Medium Hall B** ◎ | |
| 6 | 大ホール | 3,500 | **Large Hall** ◎ | 対案 Grand Hall(#8 Grand Arena と Grand が重複するため Large 推奨) |
| 7 | アリーナ | 6,000 | **Arena** ◎ | |
| 8 | 大会場 | 12,000 | **Grand Arena** ◎ | 画像ファイル名も `venue_8_grand_venue`。対案 Major Arena |
| 9 | ドーム | 22,500 | **Dome** ◎ | ドーム到達は節目演出あり(dome-milestone-spec) |

**梯子の設計意図**: Small → Medium → Large → Arena → Grand Arena → Dome と**1語ずつ格が上がる**ように選んである。日本語の「公民館/市民会館」の生活感は Community Center / Civic Hall で維持。

---

## 8. 付録(承認は不要。P4/P5 で必要になるので併記)

### 付録A. 学校名・地名(`CHAR_PROFILES` の地の文に出る)

キャラ紹介文(全127名分)を P5 で英訳する際に必ず出る固有名詞。内部キー(`CHAR_GROUP`)が読みを裏付けているものは根拠を付記した。

| JA | EN案 | 根拠・備考 |
|---|---|---|
| 粕田市 | Kasuda City | 内部キー `kasuda` |
| 粕田学園(高校) | Kasuda Gakuen High School | 対案 Kasuda Academy |
| 哲玖国際高校 | Tekkyu International High School | 内部キー `tekkyu` |
| 摺出川女学院 | Suridegawa Girls' Academy | 内部キー `suridegawa` |
| 元砥石川高校 | (the former) Toishigawa High School | 内部キー `mototoishi`。「元」=廃校済み |
| 奥山川高校 | Okuyamagawa High School | 内部キー `okuyama` |
| 岬浜女子高校 | Misakihama Girls' High School | 内部キー `misakihama`。「岬浜のツインタワー」= "the Misakihama Twin Towers" |
| 姫宮女子学院 | Himemiya Girls' Academy | 内部キー `himemiya` |
| 三津浜高校 | Mitsuhama High School | 内部キー `mitsuhama` |
| 常川高校 | Tokikawa High School | 内部キー `tokikawa` |
| 灰汁洲商業高校 | Akusu Commercial High School | **要読み確認**(「灰汁洲」アクス/アクシュ) |
| 粕田台団地 | the Kasudadai housing complex | 団地は "housing complex"/"public housing estate" |

※`CHAR_GROUP` の分類コメント(学園女子プロレス / 団地妻プロレス / OLプロレス / JKになった俺(ry / RQプロレス / 女子大生プロレス / マドンナプロレス 等)は**内部コメントのみで画面に出ない**。翻訳不要。

### 付録B. 媒体・NPC

| JA | EN案 | 備考 |
|---|---|---|
| 週刊グラップル | **Weekly Grapple** ◎ | 新聞紙面のブランド名(ui-render.js:1829 他)。ロゴとして大きく表示されるため**短い英語名が要る**。対案 Grapple Weekly |
| 黒田幸子 | **Sachiko Kuroda** | 新聞記者・コラムニスト。署名の肩書ローテーションあり(下記) |
| ——黒田幸子(週刊グラップル) | —Sachiko Kuroda, Weekly Grapple | 一面記事/興行寸評 |
| ——黒田幸子(本紙) | —Sachiko Kuroda, staff writer | 「本紙」= this paper。英語では staff writer が自然 |
| ——黒田幸子(編集部) | —Sachiko Kuroda, editorial desk | 編集長コラム/論説 |
| 黒田 修平(コーチID13) | Shuhei Kuroda | **黒田幸子とは別人**。元スポーツ紙記者という設定は共通なので、混同されないよう英語でも同姓のまま維持する |

### 付録C. 生成されるラベル(固有名詞辞書には入らないが確認が要るもの)

| JA | 生成規則 | EN案 |
|---|---|---|
| {姓}派(派閥名) | `factions.js:599` = `${surname}派` | **{Surname} Faction**(例: 富岡派 → Tomioka Faction) |
| 年間表彰式 | 固定 | Annual Awards Ceremony |
| 年間MVP | 固定 | Most Valuable Wrestler(対案 MVP のまま) |
| 新人王 | 固定 | Rookie of the Year |
| メディア功労賞 | 固定 | Media Contribution Award |
| ベストマッチ賞 | 固定 | Match of the Year |
| 殿堂(入り) | 固定 | Hall of Fame (inductee) |

※付録Cは**P3b(UI英訳)の担当範囲**。ここに書いたのは固有名詞と地続きで矛盾が起きやすいため。

---

## 9. 本ドラフトの対象外

- **技名 160種** — **本ドラフトでは扱わない。** 量が多く(`specs/技テーブル_全160技_v3_5.md`)、かつ「実在技の英語正式名(Powerbomb / Lariat / German Suplex)」「創作技のリングネーム的命名」「フィニッシャーの固有名」で判断軸が3つに割れるため、**別ドラフト(次工程)** に分ける
- セリフ・記事の本文(トーンバイブル §2 / P4・P5 の担当)
- UI 用語・システム文(P3b 用語集の担当。§6 の派生形と付録C はそこへ渡す)
- キャラ紹介文(`CHAR_PROFILES`)の本文そのもの(P5)。ただし中に出る固有名詞は付録A で先に押さえた

---

## 承認後の反映先

**P6 固有名詞辞書(実装は別工程)。**

承認された表は `i18n/proper-nouns.json`(仮)に落とし、`src/lang-en.js` の生成時に取り込む。P3b の台帳で `hasProperNoun` が立っているキーは、この辞書が確定するまで翻訳を保留する(D-B5)。技名ドラフトはその次の工程で別途起票する。

## 追加起案(P5-2aで発生・Fable仮批准、Keisuke確認は随時)

| JA | EN案 | 備考 |
|---|---|---|
| 柔の白銀(白銀麗子の異名) | Shirogane the Supple | 「剛の芝」= Shiba the Mighty(ネイティブ検品②で Strong→Mighty に確定)と対の造語 |
| ギャル3人衆 | the gyaru trio | gyaruは英語圏プロレス/サブカル文脈で通用 |

## 用語規約追記(P5-2f・Fable批准)

- セリフ中の**ベルト=belt**(物として持つ・返す文脈)/**王座=title**(地位・抽象)。地の文・ナレーションはtitle基調(既存lang-en.jsと整合)
