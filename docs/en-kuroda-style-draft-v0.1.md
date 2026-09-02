# 黒田記者 英文体ドラフト v0.1 — 週刊グラップル紙面の英語

- 作成: 2026-09-02(主筆 Opus)
- 位置づけ: **Stage B P4 工程1の成果物**(docs/i18n-stage-b-p4-design-v0.1.md D-P4-3「黒田記者の英文体は先に設計・承認」)
- 規範元: `docs/en-tone-bible-draft-v0.1.md`(§0 最重要則・§1 鉄則・§4 翻訳調検査)/ ナレーション方針(feedback_narration_factual_wording, 2026-07-16)
- 対象: `src/kuroda-text.js` 全プール(約3.1万字)+ `data.js` の `NEWS_HEADLINE_TEMPLATES` / `NEWS_TICKER_TEMPLATES` / 新聞文プール
- 状態: **未承認ドラフト**。承認後に P4 工程3(翻訳バッチ)の物差しとして使う

---

## 0. この文書の使い方

セリフのトーンバイブルが「キャラの声」を決めるのに対し、本書は**新聞紙面の声**を決める。
量産時は次の順で参照する。

1. §1 で声を掴む → 2. §1-7 の決まり文句固定表を引く → 3. §3 の見出し規則を機械的に適用 →
4. §3-6 の禁止語 grep を通す → 5. §2 の見本と並べて温度を照合

**トーンバイブル §0 の最重要則2つは本書にもそのまま効く。**
「訳文が原文より叫んでいたら失敗」「忠実さより英語としての自然さ」。

---

## 1. 英文体設計

### 1-1. 声の芯 — どのregisterで書くか

黒田幸子は**業界紙(trade weekly)の番記者**である。ファン向けの煽り媒体でも、
一般紙のスポーツ面でもない。「この業界を40年見ている人間が、業界の内側に向けて書く」文章。

参考にする実在の文体を一言で言えば、**英字クオリティ紙の担当記者コラム系**
(ボクシングや競馬の専門記者が週1で書く署名コラムの筆致)。**綴りは米式で統一**する
(トーンバイブル裁定#5)。英国綴り・英国口語は使わない。「系」であってコスプレはしない、
というのはお嬢様属性の設計(トーンバイブル §2-2)と同じ思想である。

この register が具体的に意味すること:

- **事実文が主、評が従**。数字・結果・日付を先に置き、評価はその後ろに短く付ける
- **語彙は日常語+わずかにラテン語系**。難語を並べない。ただし判定の一文だけ格が上がる
- **専門用語を説明しない**。読者は業界人という前提。これが「内輪の紙」の空気を作る
- **短縮形は使うが、判定の一文では外す**。"It is about time somebody looked at why." の
  無短縮が、彼女が姿勢を正した合図になる(お嬢様帯の無短縮と同じ装置)

### 1-2. 主語の三層 — 本紙 / 筆者 / I

日本語の黒田は `本紙` `筆者` `無主語` を無意識に使い分けている。**英語ではこれを声の主装置に昇格させる。**
これが本設計で最も重要な一点。

| 日本語 | 英語 | 使う場面 | 頻度の目安 |
|---|---|---|---|
| 本紙(としては) | **this paper** | 紙として責任を負う判定・警告・記録に残す宣言 | コラム3本に1本 |
| 筆者 | **this writer** | 職業的な自己言及。見立てを外した告白、自嘲 | コラム4本に1本 |
| (無主語の心情) | **I** | 鎧を外した瞬間。人としての一言 | **コラム5本に1本以下** |

- **"we" で紙を指さない**。"we at the Grapple" は英語では社内報の声になる
- **"you" は社長/団体への呼びかけにのみ使う**(日本語も同じことをしている)。
  読者を煽る "you won't believe" 型の二人称は禁止
- 三層が1段落に同居すると効く。§2 K4 がその見本

### 1-3. センテンスのリズム — 「持ち上げて、落とす」

彼女の最頻の型は**褒めてから引っ込める**。日本語では「褒めよう、今回は」「……悔しいが」のような
後置の一句で処理される。英語で **but / however の従属節にすると効果が死ぬ**。
必ず**文を切って、断片を置く**。

| JA | EN(採用形) | EN(失敗形) |
|---|---|---|
| 褒めよう。今回は | I will praise it. This once. | I will praise it, but only this once. |
| 完璧に近い数字だ。……まあ「近い」と付けるのが筆者の仕事だが | Close to perfect numbers. ...Adding the word *close* is what this writer is paid for. | The numbers are almost perfect, although it is this writer's job to add "almost". |
| いい数字だ。素直に認める。……次もこうとは限らないが | Good numbers. I will say so plainly. ...No guarantee it holds. | Good numbers, which I admit, though there is no guarantee it will continue. |

段落全体のリズムも同じ設計にする。**長い事実文 → 短い事実文 → 断片の判定**。
一行寸評(`NEWSPAPER_DIGEST_COMMENTS`)は最後の一段だけを取り出したものと考えるとよい。

- 「メインを食った。この試合が一番面白かったという声も多いはず」
  → *It ate the main event. Plenty of people will say it was the best thing on the card.*
- 「観客の体感時間が実際の試合時間より長かっただろう」
  → *The crowd will remember it as longer than it was.*

### 1-4. 慨嘆の抑え方

「抑えた慨嘆」が英語で最も壊れやすい。英訳は放っておくと必ず**詩になる**。使う道具を4つに限定する。

1. **緩叙法(litotes)** — "not a happy sight" / "one does not enjoy writing this" / "no pleasure in these numbers"
2. **裸の過去形** — "I have seen this before." 形容詞を足さずに重さを出す
3. **事実への差し替え** — 「痛ましい」と書かず、その感情を生む事実だけ書く("She was 31.")
4. **書かずに終える** — 英語話者が慰めの一句を足したくなる位置で、足さずに文を終える

**判定基準**: 慨嘆は**彼女自身についての事実**なら可、**人生一般についての判断**なら不可。

- ○ "And yet I am worrying. Not as a reporter."(自分の事実)
- ✗ "Some things effort alone cannot fix."(人生訓 = maxim化)

**禁止語**: heartbreaking / gut-wrenching / tragic / poignant / bittersweet /
"one cannot help but feel" / "there is something beautiful about"

### 1-5. 紙面には三つの声がある(重要な発見)

日本語の実装を読むと、**紙面は単一の声ではない**。ここを一色に潰すと、日本語が意図的に作った
温度差(見出しの「金字塔！」「赤信号！」)が全部消える。英語でも三層を保つ。

| 声 | 実体 | 英語の設計 |
|---|---|---|
| **黒田幸子**(番記者・署名コラム) | `kuroda-text.js` 全プール / 署名 `——黒田幸子(週刊グラップル)` | 本書 §1-1〜1-4 のすべて。**感嘆符ゼロ**。一人称可 |
| **黒田貫一郎**(編集長) | `Engine.mvpRace.generateKurodaComment` / 署名 `— 編集長 黒田 貫一郎` | 幸子より**短く・砕けて・皮肉が薄い**。短縮形を常用("nothing's settled yet")。自嘲しない。`this writer` を使わず `this paper` のみ。自称は "a writer" 程度 |
| **無署名デスク**(業界ニュース欄) | `NEWS_HEADLINE_TEMPLATES` の headline/body | 平叙の報道文。**感嘆符は見出しのみ・1本に1個まで**、かつ日本語に「！」がある族に限る(emptyVenue / warMilestone / poachSuccess / reclaim* / factionCoup)。本文には入れない |

貫一郎の見本(参考・対訳20本には含めない):

> `頂上は{r1}。だがこのレース、まだ何も決まっちゃいない。残り{remaining}週、地殻変動はいつでも起こりうる。`
> → *{r1} sits on top. Nothing's settled in this race, though. {remaining} weeks left, and the ground can move any week of them.*

### 1-6. 禁じ手

**煽り・格言・タブロイド調**の3系統。実装時は §3-6 の grep リストで機械検査する。

1. **タブロイド語彙** — slams / blasts / rocked / stunner / shock / chaos / erupts / bombshell /
   savage / destroys / meltdown。日本語の「衝撃」「激震」を直訳するとここに落ちる
2. **誇張形容詞** — epic / insane / absolute / legendary / iconic / must-see / star-studded
3. **格言化(maxim)** — 名前も数字も入っていない一文で段落を終えない。
   **検査**: 締めの一文を単独でポスターに刷れてしまうなら書き直す。
   ただし**皮肉で・業界内部の話**である箴言は彼女の持ち味なので可
   (○ *Hate, if it runs long enough, becomes part of the attraction.* /
    ✗ *In the end, only the ring tells the truth.*)
4. **スポーツ面の常套句** — leave it all in the ring / wants it more / dig deep /
   heart of a champion / make no mistake / at the end of the day / statement win /
   put on notice / tale of the tape
5. **翻訳調**(トーンバイブル §4-6 の新聞版) — "It can't be helped" / "As expected of" /
   "It has been revealed that" / "Attention is gathering on" (「注目が集まる」の直訳。
   英語は "worth watching" / "the question now is" のように**主語を立てて**書く)
6. **身体・抽象メタファー** — トーンバイブル §1-5 をそのまま適用
7. **見出しの Title Case** と**見出し末尾のピリオド** — §3

### 1-7. 決まり文句の固定対訳表(量産時はここを引く)

彼女の口癖は**一定の訳語群で回す**。毎回違う訳にすると癖として認識されず、
毎回同じ訳にすると機械的に見える。**族ごとに3〜4形を用意してローテーションする**。

| JA 決まり文句 | EN(この中から回す) | 使ってはいけない形 |
|---|---|---|
| 本紙としては〜と書いておく | This paper will put it on record: … / …— and this paper will say so in print. / …This paper will leave it there. / For the record, this paper's position is … | Let the record show(大仰)/ we at the Grapple / IMHO |
| 40年見てきた中で | Forty years on this beat, … / In forty years I have … / Forty years of this, and … | In my 40 years of covering wrestling(饒舌)/ Over four decades(社史調) |
| 数字は嘘をつかない | **The numbers do not lie.**(無短縮固定。**直後に必ず事実を置く**) | 単独で段落を締める(=maxim化)/ Numbers never lie / Stats don't lie |
| 筆者 | this writer | yours truly / the author / this humble reporter |
| 参った | You have me. / I give. | Color me impressed / I gotta admit |
| 認めざるを得ない | I will concede as much. / I have to grant it. | I am forced to admit |
| 率直に言えば | Plainly: / To put it plainly, | To be honest(砕けすぎ)/ Frankly speaking(翻訳調) |
| 〜と言わざるを得ない | (訳出せず事実を平叙で置く)/ there is no other way to put it | I am compelled to say |
| 注視せざるを得ない | It bears watching. / This paper is watching. | We cannot help but pay attention |
| 見ものだ / 楽しみだ | That is worth the ticket. / I want to see it. | Can't wait! |
| 分水嶺 / 正念場 | This is where it gets decided. / the point it turns on | crossroads(擦り切れている)/ make-or-break |
| 業界の盟主 | the flag carrier of the business / the standard the rest are measured against | king of the industry |
| GM の腕/肚 | where the GM's nerve gets tested / the GM's call | the GM's true colors |

**用語の一貫**(P3b 用語集と共有すべき項目・要確定):
`総合力` → **Overall** / `人気` → **Popularity** / `試合評価{mq}点` → **rated {mq}**
(**"{mq} points" と書かない**。得点経過に読める)/ `週刊グラップル` → **Weekly Grapple** /
`天頂戦` → **Tenchosen**(P6 固有名詞辞書待ち)

---

## 2. 見本対訳20本

プレースホルダは日本語と同じ集合を保持する(機械検査対象)。

### 2-1. 記事・記事断片 10本

**K1** — `KURODA_HEADLINES.devastating`(決まり文句「数字は嘘をつかない」+ 二段構え)

> **JA** 数字は嘘をつかない。{rivalName}との差を、その嘘のつかない数字が突きつけている
> **EN** The numbers do not lie. And the gap to {rivalName} is exactly what the numbers are putting in front of you.

*設計*: 日本語の「嘘をつかない」反復を英語の反復で追わず、**2文目を numbers 主語で受け直す**ことで
同じ二段構えを作る(トーンバイブル §0 最重要則2)。

---

**K2** — `KURODA_HEADLINES.dominant`(渋々の称賛・`筆者`・文頭の "...")

> **JA** ……正直、ここまでやるとは思っていなかった。筆者の見る目がなかったことを、少しだけ認めざるを得ない
> **EN** ...Honestly, I did not expect this much. This writer misread them, and I will concede as much. A little.

*設計*: 「……」→ 文頭 "..." +大文字起こし(トーンバイブル §1-11)。
**「少しだけ」を最後の断片に切り出す**のが §1-3 の落としの型。

---

**K3** — `KURODA_EDITORIAL.behind`(長文コラム・`本紙`+`40年`+社長への二人称)

> **JA** 本紙としては、{playerName}は分岐点に立っていると書いておく。{leadAxisLabel}にわずかな希望、{chaseAxisLabel}に大きな課題——どちらに賭けるかで未来が変わる。両取りを狙えば共倒れだ。それが40年見てきた中での結論である。一点に絞れ。{rivalName}が{leadAxisLabel}で対策を打ってくる前に、そこを尖らせきれるか。GMの肚が試される局面だ
> **EN** This paper will put it on record: {playerName} is standing at a fork. A little hope in {leadAxisLabel}, a large problem in {chaseAxisLabel} — and which one they bet on decides the next few seasons. Go after both and they lose both. Forty years on this beat, and that is the one conclusion I hold to. Pick one. Can they sharpen {leadAxisLabel} to a point before {rivalName} works out an answer to it? This is where the GM's nerve gets tested.

*設計*: 「一点に絞れ」の命令形は英語でもそのまま命令形("Pick one.")。
GM に性別代名詞を与えない(社長=プレイヤー)ため **the GM's nerve** と所有格で逃がす。

---

**K4** — `KURODA_EDITORIAL.devastating`(三層主語が1段落に同居する見本)

> **JA** 数字を並べるのが辛い記事だ。{chaseAxisLabel}が壊滅的なのは言うまでもなく、{leadAxisLabel}すら苦しい。ファンが離れないうちに手を打たないと、本当に取り返しがつかなくなる。——まあ、筆者が心配する義理もないのだが。なぜか心配している。記者として、ではなく。
> **EN** This is a piece I did not enjoy putting the numbers into. {chaseAxisLabel} is in ruins, which goes without saying, and even {leadAxisLabel} is a struggle. Something has to move while there are still fans left, or it really will be past fixing. Not that this writer is under any obligation to worry about it. And yet I am. Not as a reporter.

*設計*: **I → this writer → I** の順で降りる。英語では**文頭に em ダッシュを置かない**ので
「——まあ」は新しい文("Not that...")に開く。最後の断片 "Not as a reporter." が
§1-4 の「事実としての慨嘆」。

---

**K5** — `KURODA_WAR_RECORD.loseStreak`(短文・計算済みプレースホルダ)

> **JA** 現在{streak}連敗中。そろそろ真剣に原因を考えたほうがいい
> **EN** {streak} losses in a row. It is about time somebody looked seriously at the reason.

*設計*: `Math.abs()` はコード側に残り、テンプレ文は `{streak}` を受ける。
"{streak}-game losing streak" のような**単複に依存する形を避け**、"in a row" で吸収する(§3-4)。
判定の一文は**無短縮**("It is about time")。

---

**K6** — `KURODA_SPOTLIGHT.growth`(能力値用語)

> **JA** {name}が化けている。総合力+{ovrGain}。放っておくと手がつけられなくなる
> **EN** {name} has turned into a different wrestler. Overall up {ovrGain}. Leave this much longer and nobody will be able to handle her.

*設計*: 「化ける」は英語に等価な一語がない。**"turned into a different wrestler" と事実に開く**
(トーンバイブル §1-5 の抽象メタファー禁止と同根)。`Overall up {ovrGain}` は断片で置き、
"Her Overall has increased by {ovrGain}." のような完全文にしない(データ欄の口調が死ぬ)。

---

**K7** — `KURODA_MATCHUP_FLAVOR.style.powerVsSpeed`(前口上・断片リズム)

> **JA** パワー対スピード。捕まれば終わり、逃げ切れば勝ち。シンプルな構図だ
> **EN** Power against speed. Get caught and it is over; stay away and it is won. A simple enough shape.

*設計*: 3断片の三拍子をそのまま維持。日本語の対句をセミコロンで受ける。
"vs" は見出し専用で、本文では "against"。

---

**K8** — `KURODA_SHOW_RATING.stars5`(最上級の称賛を最短で)

> **JA** 参った。これ以上の言葉は必要ない
> **EN** You have me. There is nothing to add.

*設計*: 「参った」は降参の語。プロレス紙なので "I submit." と洒落たくなるが、
**彼女は洒落を言わない**ので採らない。無短縮2文で、称賛を最短で終わらせる。

---

**K9** — `KURODA_SHOW_RATING.stars0`(酷評の上限 — ここがタブロイドに落ちない天井)

> **JA** 論外だ。これを興行と呼ぶのは、業界全体への冒涜である
> **EN** Beneath discussion. To call this a show is an insult to everyone else in the business.

*設計*: 「冒涜」を desecration / blasphemy と訳すと英語では宗教的で過剰。
**"an insult to" まで温度を落とす**。かつ「業界全体」を "everyone else in the business" と
**人に開く**ことで、抽象語のまま殴らない。

---

**K10** — `KURODA_RELATION_NARRATIVE.pure_hatred.bodies`(取材モード・深めの語り)

> **JA** 通算{matches}度の対戦、いまだに笑顔の握手は一度もない。{bestMQ}点の最高評価が示す通り、リング上の温度は本物だ。問題は、その温度の出どころが「闘志」ではなく「憎悪」だということである。本紙としては、そう書いておく。
> **EN** {matches} meetings, and not once a handshake with a smile behind it. The best of them rated {bestMQ}, so the heat in the ring is real enough. The trouble is where that heat comes from. Not fighting spirit. Hatred. This paper will leave it there.

*設計*: 日本語の「闘志」「憎悪」の鉤括弧は**強調**であって引用ではない。英語で quotation marks を
付けると scare quotes(嘲り)になり意味が変わるので、**二つの一語文に切って強調を作る**(§3-3)。
締めの「そう書いておく」は "This paper will leave it there."(記録して、それ以上踏み込まない)。

---

### 2-2. 見出しテンプレ 10本

すべて sentence case・冠詞省略・現在形・末尾ピリオドなし。

**H1** — `longInjury`(コピュラ省略・原因の with)

> **JA** {orgName}の{name}、{injuryType}で全治{weeks}週
> **EN** {orgName}'s {name} out {weeks} weeks with {injuryType}

*注*: `{injuryType}` の英訳は**冠詞なしの裸の名詞句**にすること("knee ligament damage" ○ /
"a knee ligament damage" ✗)。テンプレ側で冠詞を補わない。

---

**H2** — `winStreakMilestone`(em ダッシュ・単複安全)

> **JA** 止まらない{name}——{count}連勝
> **EN** No stopping {name} — {count} in a row

*注*: "{count} win streak" は 1 のとき破綻し、ハイフンも要る。**"in a row" が単複不変で安全**。

---

**H3** — `titleChange`(現在形・冠詞省略・同格でのコピュラ省略)

> **JA** {org}の王座が動く——{name}が新王者に
> **EN** {org} title changes hands — {name} the new champion

*注*: "The {org} title" の the を落とす。後半は "is" を落として同格句にする(見出し文法)。

---

**H4** — `retirementDeclare`(完了した出来事を現在形で・単複安全な言い換え)

> **JA** {name}、{seasons}シーズンで現役に区切り
> **EN** {name} retires after a {seasons}-season career

*注*: "after {seasons} seasons" は `{seasons}=1` で "after 1 seasons" になる。
**ハイフンでつないだ限定用法 `{seasons}-season` は単複不変**。この型を全テンプレで優先する。

---

**H5** — `tenchosenFieldSet`(コロン型・固有名詞・列挙プレースホルダ)

> **JA** 「天頂戦」特別招待発表 — {invites}が名乗り
> **EN** Tenchosen: special invitations to {invites}

*注*: 日本語の「」で囲った固有名詞は、英語では**引用符を付けず大文字の固有名詞だけ**にする。
`{invites}` は「A・B」形式の連結文字列 → 英語側の連結子(", " と " and ")は
**充填側の実装で決まる**ため、テンプレ文では触れない(§4 未決事項)。

---

**H6** — `transferDone`(動詞のない日本語見出しに動詞を補う)

> **JA** {name}、{fromOrg}から{toOrg}へ
> **EN** {name} leaves {fromOrg} for {toOrg}

*注*: 日本語は方向助詞だけで見出しが成立するが、英語は**必ず定形動詞が要る**。
"{name}: {fromOrg} to {toOrg}" もコロン型として可だが、動詞形を第一候補にする。

---

**H7** — `emptyVenue`(デスク register の熱を、タブロイド語彙なしで保つ)

> **JA** 赤信号！ {org}の興行、空席だらけの衝撃
> **EN** Warning lights at {org} — a show played to empty seats

*注*: 日本語の「！」を英語の "!" にそのまま移すと**英語のほうが2段階うるさい**。
熱は**強い名詞句**("Warning lights")に載せ替え、感嘆符は落とす。
「衝撃」を shock と訳さない(§1-6 禁止語)。

---

**H8** — `warMilestone`(**日本語成形済みプレースホルダの罠**)

> **JA** 金字塔！{orgName}、対抗戦通算{milestone}達成
> **EN** A landmark for {orgName} — {milestone} in interpromotional matches

*注*: ⚠ **`{milestone}` の中身は「通算100勝」のような日本語成形済み文字列**。
テンプレを英訳しても**充填値が日本語のまま出る**。
→ **§4-1 の要対応リスト**。同型の疑いがあるのは `{recordLine}` `{careerLine}` `{detail}`
`{entrySummary}` `{semi1}/{semi2}/{finalResult}` `{gauntletNote}` `{closing}` `{preview}`
`{championWatch}` `{names}` `{round}` `{stage}` `{what}` `{how}` `{stat}`。
**テンプレ台帳とは別に「生成値の言語」を通す経路が要る。**

---

**H9** — `challengeRequestWin`(スコア行+同格ダッシュ・抽象名詞の処理)

> **JA** {ourOrg} {score} {opponentOrg}――{requesterName}の意地が呼んだ越境戦
> **EN** {ourOrg} {score} {opponentOrg} — the crossover {requesterName} asked for

*注*: 「意地」「覚悟」「矜持」のような抽象名詞は**英語では動詞・事実に開く**
("{requesterName} asked for")。"the pride of {requesterName}" は英語として空疎になる。

---

**H10** — `mqAllTimeRecord`(評価の用語)

> **JA** 業界最高評価を更新――{name}対{name2}、{mq}点
> **EN** Highest rating on record — {name} vs {name2}, {mq}

*注*: `{mq}点` を **"{mq} points" と書かない**(試合中の得点に読める)。
本文中は "rated {mq}" / "an {mq} rating"、見出しでは数字を裸で置く。
「{name}対{name2}」は見出しでは **vs**、本文では **against**。

---

## 3. 見出し文法の規則表(量産時に機械適用する)

### 3-1. 形

| # | 規則 | ○ | ✗ |
|---|---|---|---|
| 1 | **sentence case**。先頭語と固有名詞のみ大文字 | Champion falls in title match | Champion Falls In Title Match |
| 2 | **冠詞 a / an / the を落とす**。固有名詞の一部と、落とすと曖昧になる場合のみ残す | Champion falls | The champion falls |
| 3 | **時制は単純現在**。完了した出来事も現在形 | {name} takes the belt | {name} took the belt |
| 4 | **未来は to 不定詞**。will を使わない | Tenchosen to open in week 48 | Tenchosen will open in week 48 |
| 5 | **be動詞・助動詞を落とす**(コピュラ省略/受動の be 省略) | {name} out {weeks} weeks / Belt vacated | {name} is out for {weeks} weeks / The belt is vacated |
| 6 | **現在完了を使わない** | {org} signs {name} | {org} has signed {name} |
| 7 | **末尾にピリオドを打たない** | — | — |
| 8 | **団体名に冠詞を付けない**。`{org}` は裸の固有名詞 | {org} takes the tournament | The {org} takes… |
| 9 | 見出しは**1行1文**。セミコロン・接続詞での二文連結をしない | — | — |

### 3-2. 数字

| # | 規則 |
|---|---|
| 10 | **見出しは常に算用数字**(1桁も含む)。`3 losses` / `16-woman bracket` / `week 48` |
| 11 | **本文は 1〜9 を綴り、10 以上は算用数字**。ただし**単位付き・スコア・評価・週・年齢・回数は常に算用数字**(`a 7-week layoff` / `rated 92` / `age 31` / `3rd defense`) |
| 12 | 序数は**見出しで `3rd`、本文で `third`** |
| 13 | `week 48` `season 12` は**小文字**(先頭語のときのみ大文字)。sentence case と整合させる |
| 14 | 「4年に一度」型は **every 4 years**(見出し)/ **every four years**(本文) |
| 15 | スコア `{score}` は充填値をそのまま置く。前後に語を足さない |

### 3-3. 約物

| # | 規則 |
|---|---|
| 16 | 日本語の `——` `――` は **前後スペース付きの em ダッシュ ` — `**。`--` / en ダッシュを使わない |
| 17 | **コロン `:` = 話題:内容**(`Tenchosen: 16 names set`)。**ダッシュ ` — ` = 後置の補足・言い添え**。日本語の `——` が「言い添え」ならダッシュ、「見出し語」ならコロン |
| 18 | 引用符は**見出しはシングル `'…'`、本文はダブル `"…"`**(米紙慣行) |
| 19 | **日本語の「」が普通名詞を囲っている場合、引用符を付けない**。英語では scare quotes(嘲り)になり意味が変わる。強調は**文を切る**か**斜体**で作る |
| 20 | 疑問符は可(コラムのみ・低頻度)。**感嘆符は §1-5 のデスク族の見出しのみ・1本に1個**。黒田幸子署名の記事には**一切入れない** |
| 21 | 三点リーダーは `...`(トーンバイブル §1-8)。`……` を `......` にしない |
| 22 | 列挙は**シリアルコンマ(Oxford comma)を打つ**。人名の列挙で曖昧さが出るため |

### 3-4. プレースホルダ安全則(最重要 — ここを外すと文法が壊れる)

| # | 規則 | ○ | ✗ |
|---|---|---|---|
| 23 | **プレースホルダの値に文法を決めさせない**。単複・冠詞が値で変わる形を書かない | `{count} in a row` / `a {weeks}-week layoff` | `{count} wins` / `{weeks} weeks absence` |
| 24 | 単複が避けられないときは**ハイフン限定用法に逃がす** | `a {seasons}-season career` | `after {seasons} seasons` |
| 25 | **プレースホルダの直前に不定冠詞を置かない**(a/an が値で変わる) | `out with {injuryType}` | `an {injuryType}` |
| 26 | **プレースホルダを分割・語形変化させない**。所有格 `'s` は可(英語は全人名で `'s` が通る) | `{name}'s corner` | `{name}(family part only)` |
| 27 | **日本語と同じプレースホルダ集合を保つ**。増減は機械検査で落ちる(P4 §4 build-dict 系) |
| 28 | **充填値が日本語成形済みの疑いがある名前**は §4-1 の一覧で先に確認する。テンプレだけ訳しても紙面に日本語が残る |

### 3-5. 長さ予算(**要実測**)

日本語見出しは概ね全角 15〜35 字 = 半角換算 30〜70。英語は 1.5 倍伸びるため、
**そのままでは紙面の見出し枠を割る**。暫定運用:

- **見出しの目標 ≤ 56 半角文字 / 上限 64**(プレースホルダを下の予算値で展開した状態で数える)
- プレースホルダ予算: `{name}` 16 / `{org}` 18 / `{injuryType}` 24 / 数値 1〜3
- **短く訳せるならそれが正**(トーンバイブル §1-9 と同じ)

⚠ この数値は暫定。`.np-*` の実CSSに対する**擬似ロケール実測が必要**
(i18n計画 §3-2 のレイアウト検査に新聞パネルを追加する)。

### 3-6. 禁止語 grep(CI に載せる想定)

```
# 見出し・本文 共通(タブロイド語彙・誇張)
\b(slams?|blasts?|rocked|stunner|shock(ing|ed)?|chaos|erupts?|bombshell|meltdown|savage|destroys?)\b
\b(epic|insane|absolute|legendary|iconic|must-see|star-studded)\b
# 慨嘆の暴走
\b(heartbreaking|gut-wrenching|tragic|poignant|bittersweet)\b
one cannot help but|there is something beautiful
# スポーツ面常套句
leave it all in the ring|wants it more|dig deep|heart of a champion
make no mistake|at the end of the day|statement win|put on notice|tale of the tape
# 翻訳調(トーンバイブル §4-6 の新聞版)
It can't be helped|As expected of|It has been revealed that|Attention is gathering
# 声の取り違え
\bwe at the\b|yours truly|IMHO|Let the record show
# 用語の取り違え
\{?mq\}? points|[0-9]+ points\b   # 試合評価は "rated N"
```

追加規則(grep できない・目視):
- **見出しに Title Case が混ざっていないか**
- **感嘆符が黒田幸子署名の記事に入っていないか**
- **締めの一文が単独でポスターに刷れないか**(maxim 検査・§1-6-3)

---

## 4. 量産に入る前に片付ける項目

### 4-1. 日本語成形済みプレースホルダの棚卸し(**着手前必須**)

H8 で発見した最大の穴。テンプレを英訳しても、**充填値が日本語で組まれていれば紙面は日本語のまま**。
着手前に次のプレースホルダの生成元を1つずつ確認し、
「テンプレ台帳」と「生成値の言語糸通し」のどちらで解決するか決める。

`{milestone}` `{recordLine}` `{careerLine}` `{detail}` `{entrySummary}` `{preview}`
`{championWatch}` `{semi1}` `{semi2}` `{finalResult}` `{gauntletNote}` `{tieBreakNote}`
`{closing}` `{names}` `{round}` `{stage}` `{what}` `{how}` `{stat}` `{body}`(draftPlayerResult)

### 4-2. 用語の確定(P3b 用語集と共有)

`総合力/人気/試合評価/王座/防衛/対抗戦/興行/団体/控室/派閥` の英語を P3b 側と**同じ表**で持つ。
新聞だけ別語にすると同一画面で用語が割れる。

### 4-3. 固有名詞(P6 依存)

`週刊グラップル` → **Weekly Grapple**(推奨)、`天頂戦` → **Tenchosen**、
`黒田幸子` `黒田貫一郎` の英語表記。**署名行 `——黒田幸子(週刊グラップル)` の書式**も要確定
(推奨: `— Sachiko Kuroda, Weekly Grapple`)。

### 4-4. レイアウト実測

§3-5 の見出し長予算。`.np-page-headline` / `.np-kuroda-text` 等に対して擬似ロケールで実測する。

### 4-5. 貫一郎プールの扱い

`Engine.mvpRace.generateKurodaComment` はテンプレ表ではなく**関数内の実行文プール**
(memory: feedback_dialogue_data_lives_in_statements_too と同じ型)。
テンプレ抽出器がここを拾えるか、拾えなければ別経路で台帳に載せる必要がある。

---

## 5. 未決事項(承認時に裁定が要るもの)

| # | 論点 | 提案 |
|---|---|---|
| 1 | 黒田幸子の一人称 "I" の許容頻度 | コラム5本に1本以下(§1-2)。これ以上出すと業界紙が個人ブログになる |
| 2 | デスク見出しの感嘆符 | 日本語に「！」がある族のみ・1見出し1個まで。ゼロにする案もあるが、日本語が作った温度差が消える |
| 3 | 「数字は嘘をつかない」の訳の固定 | `The numbers do not lie.` 一形に固定(癖として認識させる)。ローテーションしない |
| 4 | `週刊グラップル` の英名 | Weekly Grapple(直訳)。音写 "Shukan Grapple" 案もあり |
| 5 | 米綴り統一の新聞への適用 | トーンバイブル裁定#5 をそのまま適用(新聞でも英国綴りにしない) |
| 6 | 見出しの引用符シングル / 本文ダブル | 米紙慣行に合わせる。統一してダブルにする案もあり |

---

## レビュー

**レビュー: Fable →(任意)Keisuke → ネイティブ検品サンプル兼用**

- Fable: 鉄則適合(トーンバイブル §0/§1)・翻訳調検査・見出し規則の機械適用可能性
- Keisuke(任意): 声の方向(業界紙の番記者として合っているか)・§5 の未決6件の裁定
- ネイティブ検品: §2 の対訳20本をそのまま検品サンプルに流用する。
  引っかかった語法は**トーンバイブル §4-6 の翻訳調検査リストへ実例登録**し、§3-6 の grep に還流する
