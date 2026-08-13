# 新コーチ25名 キャラクター草案 v0.1

- ステータス: 起草(2026-08-13 Fable)・**Keisuke全文レビュー待ち**
- 配分の正: `docs/coach-generation-plan-v0.1.md` §3(承認済み)。ID 36〜60・全員 `hasPortrait: false`(絵文字表示)・`hireFee = salary×8`
- 数値ガード: gMultは既存レンジ内(C 1.08〜1.16 / B 1.12〜1.18 / A 1.15〜1.25)。**給与80〜96の4名はB級最上位(橋帯)として意図的に既存Bレンジ(52〜74)の上に置く**(承認済みの空白帯埋め)。minOrgPop: C=0 / B=30 / A=55
- flavor(第二特性)は既存12種と重複させないため全員未設定(レビューで足したい人がいれば指定ください)

## 新特技3種(Keisuke許可「ない特技を新たに作っていい」による新設)

| 特技 | 効果案(数値はcodex-taskでFableが固定・較正) | 持ち手 |
|---|---|---|
| **復帰支援** | 担当選手の怪我の回復が早まり、復帰直後のコンディション戻りも速い(延命術=キャリア延長との住み分け: こちらは「怪我からの立て直し」専門) | 灰谷・氷室・五十嵐 |
| **仕上げ職人** | 特別興行・タイトル戦がある週、担当選手のコンディションを仕上げる(大一番の前だけ効く) | 荒船・東雲 |
| **結束育成** | 同じ練習に入った選手同士の絆が育ちやすい(タッグ・派閥の土壌づくり) | 汐見・苅部・天城 |

---

## A級(4名・minOrgPop 55)

### 36. 不知火 綾女(しらぬい あやめ)🕊️ — mentor A ※A級mentor初
- grade:'A', coachingType:'mentor', gMult:1.20, observation:'B', style:'Grappler', abilities:['人心掌握','才能開花','スター製造'], salary:140, hireFee:1120, minOrgPop:55, age:49, gender:'女', origin:'京都'
- desc: 人の心を扱わせて右に出る者のない、業界屈指の育成者。
- profile: 名門道場の女将として二十年、荒くれ者から泣き虫まで何百人を送り出してきた。技術は教えない。「技はどの先生からも学べます。うちで教えるのは、リングに立つ覚悟だけ」。彼女が「化ける」と言った選手は、必ず化けると言われる。

### 37. 剣持 岩雄(けんもち いわお)🗻 — sparta A
- grade:'A', coachingType:'sparta', gMult:1.24, observation:'B', style:'Grappler', abilities:['闘志注入','限界突破','ステ特化PW'], salary:160, hireFee:1280, minOrgPop:55, age:58, gender:'男', origin:'秋田'
- desc: 五輪代表を鍛えた伝説の鬼。練習の質も量も一切妥協しない。
- profile: レスリング五輪代表チームを三大会率いた元監督。現役時代の教え子には今もメダリストの名が並ぶ。「限界というのは、脳が勝手に引いた線だ」。六十を前にしてなお、若手と同じメニューを自分でこなしてみせる。

### 38. 王 麗鈴(ワン・リーリン)🐍 — artisan A
- grade:'A', coachingType:'artisan', gMult:1.22, observation:'A', style:'Submission', abilities:['延命術','ステ特化TE','怪我耐性'], salary:150, hireFee:1200, minOrgPop:55, age:61, gender:'女', origin:'中国・瀋陽'
- desc: 関節技の生き字引。体を壊さない技術で選手生命を延ばす。
- profile: 中国武術と柔術を修めた老師。四十年かけて「効かせる技」と「壊す技」の境界を一ミリ単位で言語化してきた。「痛めつけるのは素人。長く闘わせるのが玄人よ」。彼女の教え子は引退が遅いことで知られる。

### 39. 綾小路 慧(あやのこうじ けい)📐 — theorist A
- grade:'A', coachingType:'theorist', gMult:1.21, observation:'A', style:'Allround', abilities:['弱点克服','才能開花','ステ特化SP'], salary:135, hireFee:1080, minOrgPop:55, age:38, gender:'女', origin:'東京'
- desc: 数字で穴を見つける新世代の頭脳。若くしてA級の分析力。
- profile: 海外のスポーツ分析ラボから引き抜かれた才媛。全選手の試合映像をデータ化し、本人も気づいていない癖を三日で言い当てる。「感覚は嘘をつきます。数字は退屈ですが、裏切りません」。練習場にホワイトボードを三枚持ち込む。

## B級・橋帯(4名・給与80〜96・minOrgPop 30)

### 40. 荒船 大吾(あらふね だいご)⚓ — sparta B
- grade:'B', coachingType:'sparta', gMult:1.18, observation:'C', style:'Brawler', abilities:['限界突破','仕上げ職人'], salary:82, hireFee:656, minOrgPop:30, age:48, gender:'男', origin:'神奈川'
- desc: 大一番の前に選手を「仕上げる」ことにかけては超一流。
- profile: 男子プロレスで鳴らした元レスラー。現役晩年は自分より若手の調整役を買って出て、送り出した選手をことごとくビッグマッチで勝たせた。「普段の百点より、当日の百二十点だ」。口は悪いが、仕上げの腕は本物。

### 41. 東雲 千鶴(しののめ ちづる)🔔 — artisan B
- grade:'B', coachingType:'artisan', gMult:1.18, observation:'A', style:'Submission', abilities:['仕上げ職人','ステ特化TE'], salary:88, hireFee:704, minOrgPop:30, age:52, gender:'女', origin:'広島'
- desc: 元名レフェリー。至近距離で見てきた「勝負の綻び」を教える。
- profile: 二十五年間、リングの中で名勝負を裁いてきた。誰よりも近くで技の成立と失敗を見続けた目は、コーチに転じてなお衰えない。「技が決まる瞬間の音を、私は覚えています」。大舞台の空気に選手を慣らすのもうまい。

### 42. 灰谷 宗佑(はいたに そうすけ)🛠️ — mentor B
- grade:'B', coachingType:'mentor', gMult:1.17, observation:'B', style:'Submission', abilities:['延命術','復帰支援'], salary:96, hireFee:768, minOrgPop:30, age:56, gender:'男', origin:'岐阜'
- desc: 「壊れた選手」の再生請負人。怪我からの復帰に伴走する。
- profile: 理学療法士としてキャリアを始め、故障で消えかけた選手を何人もリングへ戻してきた。「怪我は終わりじゃない。休み方を知らなかっただけだ」。復帰計画を選手と一枚の紙に書き、毎週ふたりで確かめる。

### 43. 九十九 悠(つくも ゆう)📷 — theorist B
- grade:'B', coachingType:'theorist', gMult:1.17, observation:'B', style:'Striker', abilities:['ステ特化SP','才能開花'], salary:84, hireFee:672, minOrgPop:30, age:44, gender:'男', origin:'愛知'
- desc: 動作解析ラボ主宰。0.1秒のロスを削るスピード職人。
- profile: 大学の運動科学研究室から独立し、プロ選手専門の解析ラボを開いた。ハイスピードカメラで踏み込みの角度を測り、無駄を数センチ単位で削る。「速さは才能じゃなく、設計です」。理屈っぽいが、結果で黙らせるタイプ。

## B級(4名・minOrgPop 30)

### 44. 燕 志穂(つばくら しほ)🤸 — artisan B
- grade:'B', coachingType:'artisan', gMult:1.15, observation:'C', style:'Aerial', abilities:['ステ特化SP','新人育成'], salary:60, hireFee:480, minOrgPop:30, age:38, gender:'女', origin:'石川'
- desc: 元体操選手。空中技の美しさと着地の安全を両立させる。
- profile: 全日本体操で活躍後、プロレスの空中殺法に魅せられて転身した。回転の軸づくりと受け身を最初に叩き込む。「飛ぶのは誰でもできます。降りられる人だけが飛んでいいんです」。新人の空中技デビューは彼女の許可制。

### 45. 曽根崎 豹(そねざき ひょう)🦵 — sparta B
- grade:'B', coachingType:'sparta', gMult:1.16, observation:'D', style:'Striker', abilities:['ステ特化ST','怪我耐性'], salary:66, hireFee:528, minOrgPop:30, age:41, gender:'男', origin:'大阪'
- desc: 元キック世界王者。打たれ強い体を作る蹴りの鬼。
- profile: キックボクシングの元世界王者。引退後は「蹴る技術」より先に「蹴られても崩れない体」を作る独自理論で知られる。「攻撃は当たらんこともある。頑丈さは裏切らん」。ミット持ちを頼むと関西弁の檄が飛ぶ。

### 46. 弓削 光(ゆげ ひかり)🏹 — mentor B
- grade:'B', coachingType:'mentor', gMult:1.13, observation:'C', style:'Allround', abilities:['人心掌握','新人育成'], salary:54, hireFee:432, minOrgPop:30, age:29, gender:'女', origin:'島根'
- desc: 選手と同世代の若きメンタルコーチ。悩みの翻訳がうまい。
- profile: スポーツ心理学の修士号を持つ若手。年齢が近いぶん、ベテランコーチには言えない悩みが彼女には集まる。「言葉にできた悩みは、もう半分解決しています」。ノートを持たず、散歩しながら面談するのが流儀。

### 47. 天城 陽菜(あまぎ はるな)🎺 — bigheart B
- grade:'B', coachingType:'bigheart', gMult:1.14, observation:'C', style:'Striker', abilities:['結束育成','スター製造'], salary:58, hireFee:464, minOrgPop:30, age:33, gender:'女', origin:'熊本'
- desc: 元応援団長。道場の空気ごと熱くする声の持ち主。
- profile: 大学応援団の初の女性団長を務め、イベント会社を経てプロレス界へ。個人ではなくチーム全体の士気を上げるのが持ち味で、彼女が来た週は道場の声が倍になる。「ひとりで強くなれる人はいません。だから団体なんです」。

## C級(13名・minOrgPop 0)

### 48. 汐見 学(しおみ まなぶ)🧸 — mentor C
- grade:'C', coachingType:'mentor', gMult:1.10, observation:'C', style:'Brawler', abilities:['結束育成','新人育成'], salary:34, hireFee:272, minOrgPop:0, age:31, gender:'男', origin:'千葉'
- desc: 元保育士という異色の経歴。ケンカした選手の仲直りが特技。
- profile: 保育士から転身した変わり種。「五歳児の喧嘩も大人の喧嘩も、こじれる理由は同じですよ」が持論で、ぶつかった選手同士を同じ練習に放り込んで仲直りさせる。怒鳴らないのに、なぜか道場がまとまる。

### 49. 苅部 誠一(かりべ せいいち)📖 — mentor C
- grade:'C', coachingType:'mentor', gMult:1.11, observation:'C', style:'Grappler', abilities:['結束育成'], salary:38, hireFee:304, minOrgPop:0, age:46, gender:'男', origin:'長野'
- desc: 元高校教師・寮監。生活から選手を立て直す昔気質。
- profile: レスリング強豪校で教師と寮監を二十年務めた。技より先に挨拶と食事と睡眠を見る。「強い弱いの前に、続くか続かないかです」。門限にはうるさいが、選手の誕生日は絶対に忘れない。

### 50. 真行寺 のどか(しんぎょうじ のどか)⛩️ — mentor C
- grade:'C', coachingType:'mentor', gMult:1.08, observation:'D', style:'Allround', abilities:['人心掌握'], salary:30, hireFee:240, minOrgPop:0, age:27, gender:'女', origin:'奈良'
- desc: 寺育ちの座禅指導者。大一番で上がらない心を作る。
- profile: 古刹の娘として育ち、座禅と呼吸法を格闘技の世界に持ち込んだ。教えることは少なく、隣に座って一緒に黙る時間が長い。「勝ちたい気持ちは、静かなほど強いんです」。効果を数字で示せないのが玉に瑕。

### 51. 卯月 美空(うづき みそら)🎤 — mentor C
- grade:'C', coachingType:'mentor', gMult:1.12, observation:'C', style:'Aerial', abilities:['スター製造'], salary:36, hireFee:288, minOrgPop:0, age:34, gender:'女', origin:'福岡'
- desc: 元アイドル。「観客に愛される所作」を教える見せ方の先生。
- profile: 地方アイドルとして十年戦い抜いた元センター。入場の歩き方、勝ち名乗りの角度、負けた日の去り方まで「見られる技術」を教える。「実力は裏切ることがあるけど、ファンは味方につけた分だけ強いよ」。

### 52. 大鷲 力(おおわし ちから)🏉 — sparta C
- grade:'C', coachingType:'sparta', gMult:1.13, observation:'E', style:'Brawler', abilities:['闘志注入','ステ特化ST'], salary:40, hireFee:320, minOrgPop:0, age:36, gender:'男', origin:'福島'
- desc: 元ラグビー日本代表候補。当たり負けしない体と心を作る。
- profile: ラグビーで鳴らしたフィジカルモンスター。細かい技術は「専門の先生に聞け」と言い切り、自分はぶつかり稽古と走り込みだけを延々と積ませる。「最後にモノを言うのは、心臓と足腰だ」。単純明快、効果も明快。

### 53. 火村 燐(ひむら りん)🔥 — sparta C
- grade:'C', coachingType:'sparta', gMult:1.14, observation:'D', style:'Striker', abilities:['限界突破'], salary:38, hireFee:304, minOrgPop:0, age:28, gender:'女', origin:'東京'
- desc: 元ムエタイ戦士の若き鬼教官。自分にも他人にも容赦なし。
- profile: タイで武者修行を積んだ元ムエタイ選手。練習の最後に必ず「あと一本」を要求することで恐れられる。「その一本を出せる子と出せない子の差が、リングでは百倍になる」。若いくせに、と言われるたびに練習量で黙らせてきた。

### 54. 雨宮 静(あまみや しずか)☔ — artisan C
- grade:'C', coachingType:'artisan', gMult:1.12, observation:'B', style:'Aerial', abilities:['ステ特化TE'], salary:42, hireFee:336, minOrgPop:0, age:42, gender:'女', origin:'京都'
- desc: 日本舞踊の師範代から転身。所作の美しさで技を磨く。
- profile: 日舞の師範代を務めた後、教え子の女子レスラーに請われて業界入り。重心の移し方と指先の残心を仕込むと、同じ技が別物に見えると評判になった。「美しい型は、力の通り道が正しい型です」。

### 55. 時任 蒼(ときとう あおい)🎞️ — artisan C
- grade:'C', coachingType:'artisan', gMult:1.11, observation:'B', style:'Submission', abilities:['弱点克服'], salary:36, hireFee:288, minOrgPop:0, age:30, gender:'男', origin:'北海道'
- desc: 試合映像をコマ送りで観続ける研究の虫。癖の矯正が得意。
- profile: 選手経験のない映像オタクだが、コマ送りで見つけた癖を矯正する手腕で口コミが広がった。「あなたの負け筋、映像の中に全部落ちてますよ」。本人は運動音痴で、手本は一切見せられない。

### 56. 氷室 千代(ひむろ ちよ)🥗 — theorist C
- grade:'C', coachingType:'theorist', gMult:1.12, observation:'C', style:'Striker', abilities:['復帰支援'], salary:44, hireFee:352, minOrgPop:0, age:39, gender:'女', origin:'新潟'
- desc: 管理栄養士。食事と回復設計で怪我明けの選手を立て直す。
- profile: 病院栄養科からスポーツ現場に移った管理栄養士。怪我明けの選手の食事と睡眠を設計し直し、復帰までの日数を縮める。「治すのはお医者さん。戻すのは毎日のご飯です」。遠征先の弁当にまで口を出す。

### 57. 真鶴 慎(まなづる しん)🧪 — theorist C
- grade:'C', coachingType:'theorist', gMult:1.09, observation:'D', style:'Aerial', abilities:['弱点克服','新人育成'], salary:28, hireFee:224, minOrgPop:0, age:26, gender:'男', origin:'岡山'
- desc: 大学院上がりの理論派ひよっこ。新人と一緒に育つ若手枠。
- profile: スポーツ科学の大学院を出たばかりの新米コーチ。理論は最新だが現場経験が浅く、ベテラン選手には遠慮がち。それでも新人の弱点を紙一枚に整理する腕は確かで、「同期みたいなコーチ」と若手に慕われる。

### 58. 温井 大地(ぬくい だいち)🍶 — bigheart C
- grade:'C', coachingType:'bigheart', gMult:1.10, observation:'D', style:'Striker', abilities:['人心掌握'], salary:32, hireFee:256, minOrgPop:0, age:35, gender:'男', origin:'高知'
- desc: 元居酒屋大将。落ち込んだ選手の胃袋と心を同時に掴む。
- profile: 道場の近くで居酒屋を営むうち、選手の愚痴を聞き続けて団体に引き抜かれた変わり種。練習後に鍋を振る舞いながら、ぽろりと本音を引き出す。「うまいもん食って言えん悩みは、だいたい大した悩みやない」。

### 59. マリア・サントス 🌴 — bigheart C
- grade:'C', coachingType:'bigheart', gMult:1.13, observation:'E', style:'Brawler', abilities:['スター製造'], salary:35, hireFee:280, minOrgPop:0, age:33, gender:'女', origin:'ブラジル・サンパウロ'
- desc: ルチャ仕込みの陽気なブラジル人。派手に魅せて派手に笑う。
- profile: メキシコとブラジルのリングを渡り歩いた元ルチャドーラ。細かいことは気にしない性格で、観客を沸かせる立ち回りだけは誰よりも熱心に仕込む。「強いだけじゃダメ！お客さんが帰り道で真似したくなる技を持ちなさい！」。

### 60. 五十嵐 豪(いがらし ごう)🚒 — bigheart C
- grade:'C', coachingType:'bigheart', gMult:1.11, observation:'D', style:'Brawler', abilities:['復帰支援','怪我耐性'], salary:45, hireFee:360, minOrgPop:0, age:51, gender:'男', origin:'宮城'
- desc: 元消防士。体の張り方と、立ち上がり方を知っている男。
- profile: 二十五年勤めた消防を定年前に辞め、応急処置と安全管理の知識を携えて道場へ来た。怪我の現場に誰より早く駆けつけ、復帰の日には誰より大きな声で迎える。「倒れるのは事故だ。立ち上がるのは選択だ」。

---

## 検収用サマリ(配分表との突き合わせ)

| 軸 | 計画(§3) | 本草案 |
|---|---|---|
| grade | A4/B8/C13 | A4(36-39)/B8(40-47)/C13(48-60) ✓ |
| type | sp5/th4/ar5/me7/bh4 | sparta5(37,40,45,52,53)/theorist4(39,43,56,57)/artisan5(38,41,44,54,55)/mentor7(36,42,46,48,49,50,51)/bigheart4(47,58,59,60) ✓ |
| 年齢帯 | 〜34:9/35-44:8/45-54:5/55+:3 | 9(29,33,31,27,34,28,30,26,33)/8(38,44,38,41,36,42,39,35)/5(49,48,52,46,51)/3(58,61,56) ✓ |
| observation | A3/B6/C9/D5/E2 | A(38,39,41)/B(36,37,42,43,54,55)/C(40,44,45,46,47,48,49,51,56)/D(50,53,57,58,60)/E(52,59) ✓ |
| style | St6/Br5/Ae4/Su4/Gr3/Al3 | Striker(43,45,47,53,56,58)/Brawler(40,48,52,59,60)/Aerial(44,51,54,57)/Submission(38,41,42,55)/Grappler(36,37,49)/Allround(39,46,50) ✓ |
| 性別 | 男12/女13 | 男12(37,40,42,43,45,48,49,52,55,57,58,60)/女13 ✓ |
| 希少 | 闘志2/延命2/弱克3/限突3 | 闘志(37,52)/延命(38,42)/弱克(39,55,57)/限突(37,40,53) ✓ |
| 新特技 | 復帰3/仕上2/結束3 | 復帰(42,56,60)/仕上(40,41)/結束(47,48,49) ✓ |
| 給与 | 80〜96帯に4名 | 40荒船82/43九十九84/41東雲88/42灰谷96(B級最上位・minOrgPop30) ✓ |
