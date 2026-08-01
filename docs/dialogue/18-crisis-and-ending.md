# 経営危機・エンディング

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `CRISIS_DIALOGUE`

- 出典: `src/data.js`
- コード内コメント: 資金危機 突入時 選手セリフ — bankruptcy-redesign-spec-v1.1.md §2.7 / archetype 別 6 プール。trust 最上位 1 名（同値時は人気最上位）から1名選出。
- 本数: 12

### enter.ojousama[]

- `CRISIS_DIALOGUE.enter.ojousama[1]`: 資金繰りが、そのような状況に……? わたくしに何かできることはございまして?
- `CRISIS_DIALOGUE.enter.ojousama[2]`: 動揺していると思われるのは癪ですけれど……正直、不安ですわ

### enter.delinquent[]

- `CRISIS_DIALOGUE.enter.delinquent[1]`: マジかよ。社長、立て直せんのか? まあ、やるしかねぇんだろうな
- `CRISIS_DIALOGUE.enter.delinquent[2]`: ったく、潰れんの勘弁してくれよ。私のリングを取り上げるな

### enter.cool[]

- `CRISIS_DIALOGUE.enter.cool[1]`: ……そうか。残された時間は、限られているということだな
- `CRISIS_DIALOGUE.enter.cool[2]`: やるしかない。私にできることは、リングで応える、それだけだ

### enter.seductive[]

- `CRISIS_DIALOGUE.enter.seductive[1]`: あら……興味深い局面ね。社長、楽しませてくださる?
- `CRISIS_DIALOGUE.enter.seductive[2]`: 破滅の足音、というやつかしら。それでも、わたくしは舞台に立つわ

### enter.polite[]

- `CRISIS_DIALOGUE.enter.polite[1]`: 資金が、そのような状態でしたか……。私にできることがあれば、何でもおっしゃってください
- `CRISIS_DIALOGUE.enter.polite[2]`: 諦めずに、最後まで力を尽くしましょう

### enter.standard[]

- `CRISIS_DIALOGUE.enter.standard[1]`: 社長、諦めずに頑張りましょう。何とかなるはずです
- `CRISIS_DIALOGUE.enter.standard[2]`: 私たちにできることを、ひとつずつやっていきましょう

## `GAMEOVER_LINES`

- 出典: `src/data.js`
- コード内コメント: 解散時 選手・コーチセリフ — bankruptcy-redesign-spec-v1.1.md §3.3 / archetype × trust（high/mid/low）= 18 プール / 各3セリフ + コーチ6
- 本数: 58

### fighter.ojousama.high[]

- `GAMEOVER_LINES.fighter.ojousama.high[1]`: みなさま、本当にお世話になりましたわ。この団体で過ごした日々は、わたくしの誇りですの
- `GAMEOVER_LINES.fighter.ojousama.high[2]`: ……負けは認めますわ。でも、わたくし、ここで戦えたことを後悔いたしません
- `GAMEOVER_LINES.fighter.ojousama.high[3]`: お疲れさま、社長。胸を張って、お顔をお上げくださいまし

### fighter.ojousama.mid[]

- `GAMEOVER_LINES.fighter.ojousama.mid[1]`: まあ……こんなことになりますの……
- `GAMEOVER_LINES.fighter.ojousama.mid[2]`: 次の場所は、わたくしが探さなくてはなりませんのね
- `GAMEOVER_LINES.fighter.ojousama.mid[3]`: ……心の整理が、つきませんわ

### fighter.ojousama.low[]

- `GAMEOVER_LINES.fighter.ojousama.low[1]`: 冗談ではありませんわ。わたくしの誇りは、どうなりますの
- `GAMEOVER_LINES.fighter.ojousama.low[2]`: 最初から信用すべきではありませんでしたのね
- `GAMEOVER_LINES.fighter.ojousama.low[3]`: ……無能、と申し上げてもよろしいかしら

### fighter.delinquent.high[]

- `GAMEOVER_LINES.fighter.delinquent.high[1]`: ちっ、潰れちまったか。……でもまあ、悪くなかったぜ
- `GAMEOVER_LINES.fighter.delinquent.high[2]`: 社長、頭は下げなくていい。私は私で、次のリングへ行く
- `GAMEOVER_LINES.fighter.delinquent.high[3]`: 泣いてんじゃねぇよ。私らはまた、どっかで戦うんだろ

### fighter.delinquent.mid[]

- `GAMEOVER_LINES.fighter.delinquent.mid[1]`: は? マジかよ。冗談じゃねぇ
- `GAMEOVER_LINES.fighter.delinquent.mid[2]`: ったく、潰れる団体に入っちまったのが運の尽きかよ
- `GAMEOVER_LINES.fighter.delinquent.mid[3]`: ……次、探すしかねぇな

### fighter.delinquent.low[]

- `GAMEOVER_LINES.fighter.delinquent.low[1]`: ふざけんな。私のキャリア、どうしてくれんだ
- `GAMEOVER_LINES.fighter.delinquent.low[2]`: 最初から胡散臭いとは思ってたんだ
- `GAMEOVER_LINES.fighter.delinquent.low[3]`: 失せろ。お前の顔は二度と見たくねぇ

### fighter.cool.high[]

- `GAMEOVER_LINES.fighter.cool.high[1]`: ……世話になった
- `GAMEOVER_LINES.fighter.cool.high[2]`: ここで戦えてよかった。それだけは確かだ
- `GAMEOVER_LINES.fighter.cool.high[3]`: ……次のリング、探す。それだけだ

### fighter.cool.mid[]

- `GAMEOVER_LINES.fighter.cool.mid[1]`: ……終わったか
- `GAMEOVER_LINES.fighter.cool.mid[2]`: 次を探すしかない

### fighter.cool.low[]

- `GAMEOVER_LINES.fighter.cool.low[1]`: 予想通りだ
- `GAMEOVER_LINES.fighter.cool.low[2]`: ……特に言うことはない

### fighter.seductive.high[]

- `GAMEOVER_LINES.fighter.seductive.high[1]`: あら、終わってしまうのね。……でも、悪くなかったわ
- `GAMEOVER_LINES.fighter.seductive.high[2]`: この団体で見せた表情、忘れないでくださる?
- `GAMEOVER_LINES.fighter.seductive.high[3]`: 別れ際の言葉……どうしましょうかしら。でも、感謝しているの。本当よ

### fighter.seductive.mid[]

- `GAMEOVER_LINES.fighter.seductive.mid[1]`: あらあら、こんな結末も、また面白いのかしら
- `GAMEOVER_LINES.fighter.seductive.mid[2]`: 次の舞台、見つけなくちゃね
- `GAMEOVER_LINES.fighter.seductive.mid[3]`: ……あぁ、これで終わりなのね

### fighter.seductive.low[]

- `GAMEOVER_LINES.fighter.seductive.low[1]`: 夢を見させてくれてありがとう、と言うべきかしら
- `GAMEOVER_LINES.fighter.seductive.low[2]`: がっかりさせられたわ、本当に
- `GAMEOVER_LINES.fighter.seductive.low[3]`: ……つまらない結末ね

### fighter.polite.high[]

- `GAMEOVER_LINES.fighter.polite.high[1]`: みなさま、本当にお世話になりました。心より、感謝申し上げます
- `GAMEOVER_LINES.fighter.polite.high[2]`: 私にとって、この団体は特別な場所でございました
- `GAMEOVER_LINES.fighter.polite.high[3]`: ……ありがとうございました。この経験は、生涯忘れません

### fighter.polite.mid[]

- `GAMEOVER_LINES.fighter.polite.mid[1]`: ……このような結末になるとは、思いもよりませんでした
- `GAMEOVER_LINES.fighter.polite.mid[2]`: 次の所属先を、探すことになりますね
- `GAMEOVER_LINES.fighter.polite.mid[3]`: ……何と申し上げてよいか、言葉が見つかりません

### fighter.polite.low[]

- `GAMEOVER_LINES.fighter.polite.low[1]`: ……信じてついてまいりましたのに、残念です
- `GAMEOVER_LINES.fighter.polite.low[2]`: いえ、何も申し上げることはございません
- `GAMEOVER_LINES.fighter.polite.low[3]`: ……失礼いたします

### fighter.standard.high[]

- `GAMEOVER_LINES.fighter.standard.high[1]`: お疲れ様でした、社長。ここで戦えたこと、忘れません
- `GAMEOVER_LINES.fighter.standard.high[2]`: いい経験になりました。本当にありがとうございました
- `GAMEOVER_LINES.fighter.standard.high[3]`: また、どこかのリングで会えますように

### fighter.standard.mid[]

- `GAMEOVER_LINES.fighter.standard.mid[1]`: 仕方ないですね。次の場所を探します
- `GAMEOVER_LINES.fighter.standard.mid[2]`: こうなったら、新しい団体に移るしかありません
- `GAMEOVER_LINES.fighter.standard.mid[3]`: ……無念です

### fighter.standard.low[]

- `GAMEOVER_LINES.fighter.standard.low[1]`: 結局こうなったか
- `GAMEOVER_LINES.fighter.standard.low[2]`: 想定の範囲内です
- `GAMEOVER_LINES.fighter.standard.low[3]`: ……何も言うことはありません

### coach[]

- `GAMEOVER_LINES.coach[1]`: 私の力不足だ。選手たちには、すまないとしか言えない
- `GAMEOVER_LINES.coach[2]`: まだ伸びる途中だった子が多い……それが、悔しくてならない
- `GAMEOVER_LINES.coach[3]`: よくここまで耐えた。胸を張りなさい、君たちは
- `GAMEOVER_LINES.coach[4]`: 指導者として、最後まで支えきれなかった。それだけが心残りだ
- `GAMEOVER_LINES.coach[5]`: 若い選手たちの行く先だけが心配だ。誰か、引き取ってくれるといい
- `GAMEOVER_LINES.coach[6]`: 責任は私にもある。社長、頭を上げてくれ

## `ENDING_LINES`

- 出典: `src/data.js`
- コード内コメント: v2.1: エンディング演出セリフ — ending-gameover-spec-v1.0.md §1.4
- 本数: 52

### fighter.standard.normal[]

- `ENDING_LINES.fighter.standard.normal[1]`: この団体で戦えて、本当に良かった
- `ENDING_LINES.fighter.standard.normal[2]`: 入団した時は、まさかここまで来れるなんて思わなかった
- `ENDING_LINES.fighter.standard.normal[3]`: 最高の仲間と、最高の舞台。感謝しかないよ

### fighter.standard.bold[]

- `ENDING_LINES.fighter.standard.bold[1]`: ここが頂点？…でもまだ先がある気がする
- `ENDING_LINES.fighter.standard.bold[2]`: ここで終わりじゃない。もっと強くなって、もっと上を目指す
- `ENDING_LINES.fighter.standard.bold[3]`: 私たちの戦いが業界を変えたってことね。誇りに思うよ

### fighter.standard.quiet[]

- `ENDING_LINES.fighter.standard.quiet[1]`: ………ありがとうございました（静かに涙を流している）

### fighter.standard.shy[]

- `ENDING_LINES.fighter.standard.shy[1]`: こ、こんなに幸せなことがあっていいのかな…

### fighter.standard.easygoing[]

- `ENDING_LINES.fighter.standard.easygoing[1]`: みんなで掴んだ頂点だ！最高のチームだよ！
- `ENDING_LINES.fighter.standard.easygoing[2]`: お金がなかった頃のことを思い出すと…よくここまで来たよね

### fighter.standard.earnest[]

- `ENDING_LINES.fighter.standard.earnest[1]`: 練習してきたことが全部報われた。泣きそう
- `ENDING_LINES.fighter.standard.earnest[2]`: あの時辞めなくてよかった。この瞬間のために全部あったんだ

### fighter.standard.emotional[]

- `ENDING_LINES.fighter.standard.emotional[1]`: 涙が止まらない…！こんなに幸せなことがあっていいのかな…！
- `ENDING_LINES.fighter.standard.emotional[2]`: みんなありがとう…！最高だよ…！

### fighter.ojousama.normal[]

- `ENDING_LINES.fighter.ojousama.normal[1]`: ここまで来れたのね…感無量だわ

### fighter.ojousama.bold[]

- `ENDING_LINES.fighter.ojousama.bold[1]`: これが頂点の景色？…馬鹿ね。まだまだ先はあってよ

### fighter.ojousama.easygoing[]

- `ENDING_LINES.fighter.ojousama.easygoing[1]`: 最後まで楽しゅうございましたわ。ありがとうございます

### fighter.ojousama.earnest[]

- `ENDING_LINES.fighter.ojousama.earnest[1]`: 努力が報われましたわ…感謝しかありませんの

### fighter.delinquent.normal[]

- `ENDING_LINES.fighter.delinquent.normal[1]`: やってやったぜ！最高だ！

### fighter.delinquent.bold[]

- `ENDING_LINES.fighter.delinquent.bold[1]`: てっぺん獲ったぜ！でもまだまだこれからだ！

### fighter.delinquent.easygoing[]

- `ENDING_LINES.fighter.delinquent.easygoing[1]`: 最高だぜ！みんなありがとな！

### fighter.seductive.normal[]

- `ENDING_LINES.fighter.seductive.normal[1]`: ここまで来れたのね…最高の気分だわ

### fighter.seductive.bold[]

- `ENDING_LINES.fighter.seductive.bold[1]`: 頂点に立ったわ。でもまだ先があるみたいね

### fighter.seductive.quiet[]

- `ENDING_LINES.fighter.seductive.quiet[1]`: ………終わった…わね。…ありがとう

### fighter.seductive.easygoing[]

- `ENDING_LINES.fighter.seductive.easygoing[1]`: 最高の景色ね。みんなのおかげだわ

### fighter.seductive.earnest[]

- `ENDING_LINES.fighter.seductive.earnest[1]`: 積み重ねてきた全部が報われた…泣きそうだわ

### fighter.seductive.emotional[]

- `ENDING_LINES.fighter.seductive.emotional[1]`: リングを降りるわ……っ……ふふ、ここで戦えた日々、永遠に忘れない……ありがとう……

### fighter.cool.normal[]

- `ENDING_LINES.fighter.cool.normal[1]`: ……終わったか。……悪くない

### fighter.cool.bold[]

- `ENDING_LINES.fighter.cool.bold[1]`: …頂点だ。だが、まだ先がある

### fighter.cool.quiet[]

- `ENDING_LINES.fighter.cool.quiet[1]`: …ここまで来たか

### fighter.polite.normal[]

- `ENDING_LINES.fighter.polite.normal[1]`: 最後まで走り切れました。…ありがとうございました

### fighter.polite.bold[]

- `ENDING_LINES.fighter.polite.bold[1]`: 最後まで戦い抜けました。…悔いはありません

### fighter.polite.quiet[]

- `ENDING_LINES.fighter.polite.quiet[1]`: …ここまで来れるなんて…社長…ありがとうございます

### fighter.polite.shy[]

- `ENDING_LINES.fighter.polite.shy[1]`: こ、これで…リングを降ります…あ、あの、応援してくれた皆さま…本当に、ありがとうございました…

### fighter.polite.easygoing[]

- `ENDING_LINES.fighter.polite.easygoing[1]`: 最後まで楽しかったです！ ありがとうございました！

### fighter.polite.earnest[]

- `ENDING_LINES.fighter.polite.earnest[1]`: 積み重ねてきた全てが報われました…ありがとうございます

### fighter.composed.normal[]

- `ENDING_LINES.fighter.composed.normal[1]`: …ここまで来れたか。…悪くない景色だね

### fighter.composed.bold[]

- `ENDING_LINES.fighter.composed.bold[1]`: …頂点か。…でもまだ先がある気がするね

### fighter.composed.quiet[]

- `ENDING_LINES.fighter.composed.quiet[1]`: ……ここまで来た。…ありがとう

### fighter.composed.easygoing[]

- `ENDING_LINES.fighter.composed.easygoing[1]`: …いい景色だね。…みんなのおかげだ

### fighter.composed.earnest[]

- `ENDING_LINES.fighter.composed.earnest[1]`: …積み重ねてきたものが、ここに繋がった。…感謝だね

### fighter.composed.emotional[]

- `ENDING_LINES.fighter.composed.emotional[1]`: …っ…ここまで来れた。…最高だ

### coach[]

- `ENDING_LINES.coach[1]`: よくぞここまで……立派になった
- `ENDING_LINES.coach[2]`: あの選手たちを見ていると、指導者冥利に尽きる
- `ENDING_LINES.coach[3]`: 私の教え子たちが業界の頂点に。これ以上の喜びはない
- `ENDING_LINES.coach[4]`: まだまだ伸びる選手ばかりだ。楽しみは尽きないよ
- `ENDING_LINES.coach[5]`: ここが終着点じゃない。さらに上の景色を見せてやる
- `ENDING_LINES.coach[6]`: 選手たちの努力が実を結んだ。私は見守っただけだ
- `ENDING_LINES.coach[7]`: 苦しい時期を乗り越えた選手たちの姿に……涙が出そうだ
- `ENDING_LINES.coach[8]`: 全員が成長した。一人の脱落者も出さなかった。それが誇りだ
- `ENDING_LINES.coach[9]`: この子たちとなら、もっと高い場所を目指せる
- `ENDING_LINES.coach[10]`: 指導者として、これ以上の幸せはないよ

## `KURODA_CRISIS`

- 出典: `src/kuroda-text.js`
- コード内コメント: 資金危機 / 解散コラム（bankruptcy-redesign v1.1） / editorial モード固定。宣言調・「本紙は」・対比構造。 / {orgName} {weeksRemaining} はテンプレ置換。
- 本数: 10

### enter[].headline

- `KURODA_CRISIS.enter[1].headline`: 【経営警報】「{orgName}」資金枯渇
- `KURODA_CRISIS.enter[2].headline`: 【本紙独占】{orgName} 資金底なし

### enter[].body

- `KURODA_CRISIS.enter[1].body`: 本紙は度々警告してきた。経営とは数字の戦争であり、勝者は黒字を、敗者は破産を手にする。{orgName}は今、後者の崖に立っている。記者として、ただ事実を記す。
- `KURODA_CRISIS.enter[2].body`: 夢だけでは興行は続かない。本紙の取材によれば、{orgName}の資金は既に枯渇し、活動継続の見通しは立っていない。残された時間は——もう、長くない。

### ongoing[].headline

- `KURODA_CRISIS.ongoing[1].headline`: 【続報】{orgName} 経営難止まらず
- `KURODA_CRISIS.ongoing[2].headline`: 【観察】数字が告げる現実

### ongoing[].body

- `KURODA_CRISIS.ongoing[1].body`: 危機脱出の兆しは見えない。週ごとに数字は悪化し、選手たちの動揺も伝え聞こえる。本紙は引き続き、この団体の終焉を見届ける。
- `KURODA_CRISIS.ongoing[2].body`: 残り{weeksRemaining}週。{orgName}が黒字へ戻る道筋は、本紙には見えていない。だが、奇跡を否定するのは、記者の仕事ではない。

### recovered[].headline

- `KURODA_CRISIS.recovered[1].headline`: 【速報】{orgName} 危機脱出

### recovered[].body

- `KURODA_CRISIS.recovered[1].body`: 崖際から戻った。本紙は危機の終息を確認したが、再発の可能性まで否定するつもりはない。経営とは、そういうものだ。

## `KURODA_GAMEOVER`

- 出典: `src/kuroda-text.js`
- 本数: 6

### timeout[].body

- `KURODA_GAMEOVER.timeout[1].body`: 数字は嘘をつかない。⏎本紙が幾度となく警告してきた帰結である。⏎夢を語るのは自由だ。だが、夢を続けるには金がいる。⏎——記者として、ただ事実を記す。⏎この団体は、終わった。
- `KURODA_GAMEOVER.timeout[2].body`: 4週の猶予があった。⏎それでも、立て直しは間に合わなかった。⏎経営とは、そういうものだ。⏎本紙は{orgName}の解散を、ただ確認する。

### collapse[].body

- `KURODA_GAMEOVER.collapse[1].body`: 崩壊である。⏎立て直す時間すら与えられなかった。⏎資金繰りの破綻は、警告ではなく結末として訪れた。⏎——本紙は記録する。{orgName}、解散。
- `KURODA_GAMEOVER.collapse[2].body`: 数字が、限界を超えた。⏎ここまで深く沈めば、どんな手も届かない。⏎夢の終わり方としては、あまりに無情だ。⏎だが、本紙は感傷を書かない。事実だけを残す。

### season_end[].body

- `KURODA_GAMEOVER.season_end[1].body`: シーズンは終わった。⏎{orgName}は、次のリングを迎えることなく姿を消す。⏎間に合わなかった——それだけのことだ。⏎本紙は、この団体の最後のシーズンを記録する。
- `KURODA_GAMEOVER.season_end[2].body`: シーズンを越えられなかった。⏎年末の数字は、容赦なく団体の終焉を告げた。⏎夢を抱いた一年だった。だが、夢には期限がある。⏎——記者として、ただ事実を記す。

## `KURODA_MATCHUP_FLAVOR`

- 出典: `src/kuroda-text.js`
- コード内コメント: 4. マッチアップ解説フレーバー（KURODA_MATCHUP_FLAVOR）
- 本数: 120

### style.powerVsPower[]

- `KURODA_MATCHUP_FLAVOR.style.powerVsPower[1]`: パワー対パワーの真っ向勝負。どちらが先にスタミナ切れを起こすか見ものだ
- `KURODA_MATCHUP_FLAVOR.style.powerVsPower[2]`: 力と力のぶつかり合い。技術で差がつかない分、純粋な馬力勝負になる
- `KURODA_MATCHUP_FLAVOR.style.powerVsPower[3]`: パワーファイター同士。派手な試合にはなるだろうが、持久戦に持ち込まれると読めない
- `KURODA_MATCHUP_FLAVOR.style.powerVsPower[4]`: 互いに打撃が重い。先にダウンを取ったほうが主導権を握る
- `KURODA_MATCHUP_FLAVOR.style.powerVsPower[5]`: パワーファイター同士。会場が揺れるような試合になるだろうが、怪我だけは心配だ
- `KURODA_MATCHUP_FLAVOR.style.powerVsPower[6]`: パワー対パワー。本紙としては、こういうカードは観客が一番盛り上がると書いておく
- `KURODA_MATCHUP_FLAVOR.style.powerVsPower[7]`: 力比べの真っ向勝負。40年見てきた中で、こういう試合に小細工は要らない
- `KURODA_MATCHUP_FLAVOR.style.powerVsPower[8]`: 両者ともに重い打撃を持っている。先に倒したほうが勝ち、という単純さこそが醍醐味だ

### style.speedVsSpeed[]

- `KURODA_MATCHUP_FLAVOR.style.speedVsSpeed[1]`: スピード対スピード。瞬きする暇はないだろうが、展開が速すぎて大味になるリスクもある
- `KURODA_MATCHUP_FLAVOR.style.speedVsSpeed[2]`: 俊敏な二人。先に捕まったほうが負けだ。シンプルだが、そのシンプルさが怖い
- `KURODA_MATCHUP_FLAVOR.style.speedVsSpeed[3]`: 速さの勝負。一瞬の判断ミスが命取りになる
- `KURODA_MATCHUP_FLAVOR.style.speedVsSpeed[4]`: スピードタイプ同士の対決は展開が読めない。観る側としては面白いが、分析泣かせだ
- `KURODA_MATCHUP_FLAVOR.style.speedVsSpeed[5]`: 両者とも俊敏。本紙としては、瞬きしている間に勝負が決まると書いておく
- `KURODA_MATCHUP_FLAVOR.style.speedVsSpeed[6]`: スピード対スピード。40年見てきた中で、こういうカードは映像で見直してようやく内容が分かる
- `KURODA_MATCHUP_FLAVOR.style.speedVsSpeed[7]`: 速さ自慢の二人。地力ではなく一瞬の閃きで勝負がつくだろう

### style.techVsTech[]

- `KURODA_MATCHUP_FLAVOR.style.techVsTech[1]`: テクニシャン同士の読み合い。地味に見えるかもしれないが、分かる人には堪らないカードだ
- `KURODA_MATCHUP_FLAVOR.style.techVsTech[2]`: 技術の応酬。お互い手の内を読み切ろうとする頭脳戦になるだろう
- `KURODA_MATCHUP_FLAVOR.style.techVsTech[3]`: 技の引き出しが多い同士。どちらが先に相手の穴を見つけるか、知恵比べである
- `KURODA_MATCHUP_FLAVOR.style.techVsTech[4]`: 技術の応酬になる予感。派手さはないかもしれないが、内容は保証できるカードだ
- `KURODA_MATCHUP_FLAVOR.style.techVsTech[5]`: テクニシャン対テクニシャン。本紙としては、観る側の眼力が試されるカードだと書いておく
- `KURODA_MATCHUP_FLAVOR.style.techVsTech[6]`: 40年見てきた中で、技術戦は見る人を選ぶ。だが分かる人にはたまらない
- `KURODA_MATCHUP_FLAVOR.style.techVsTech[7]`: 両者ともに引き出しが深い。これが純粋な技術戦の醍醐味というものだ

### style.powerVsSpeed[]

- `KURODA_MATCHUP_FLAVOR.style.powerVsSpeed[1]`: パワー対スピード。捕まれば終わり、逃げ切れば勝ち。シンプルな構図だ
- `KURODA_MATCHUP_FLAVOR.style.powerVsSpeed[2]`: 速さで翻弄するか、力でねじ伏せるか。展開次第でどちらにも転ぶ
- `KURODA_MATCHUP_FLAVOR.style.powerVsSpeed[3]`: パワー対スピード。古典的な構図だが、だからこそ面白い
- `KURODA_MATCHUP_FLAVOR.style.powerVsSpeed[4]`: 力で捕まえるか、速さで逃げ切るか。展開が噛み合えば名勝負になるだろう
- `KURODA_MATCHUP_FLAVOR.style.powerVsSpeed[5]`: パワー対スピード——本紙としては、捕まった瞬間に決着がつくと書いておく
- `KURODA_MATCHUP_FLAVOR.style.powerVsSpeed[6]`: 40年見てきた中で、この対比構造は時代を超えて鉄板のカードだ
- `KURODA_MATCHUP_FLAVOR.style.powerVsSpeed[7]`: 重さと速さ。どちらが先に得意のレンジを作れるか、序盤の駆け引きに注目したい

### style.powerVsTech[]

- `KURODA_MATCHUP_FLAVOR.style.powerVsTech[1]`: パワー対テクニック。力押しが通じるか、いなされるか。テクニシャン側の序盤が鍵だ
- `KURODA_MATCHUP_FLAVOR.style.powerVsTech[2]`: 技術で受け流すか、馬力で押し切るか。長期戦ならテクニック、短期決戦ならパワーに分がある
- `KURODA_MATCHUP_FLAVOR.style.powerVsTech[3]`: 力任せに来る相手をどう捌くか。テクニシャンの真価が問われる
- `KURODA_MATCHUP_FLAVOR.style.powerVsTech[4]`: パワーが通じるか、いなされるか。序盤の攻防で試合の流れが決まるだろう
- `KURODA_MATCHUP_FLAVOR.style.powerVsTech[5]`: 本紙としては、力任せが通じない相手というのは厄介だと書いておく
- `KURODA_MATCHUP_FLAVOR.style.powerVsTech[6]`: 40年見てきた中で、テクニシャンが力自慢を翻弄する展開は何度も名勝負を生んだ
- `KURODA_MATCHUP_FLAVOR.style.powerVsTech[7]`: 力で押せば崩れる、いなされれば消耗する。パワー側のジレンマが見どころだ

### style.speedVsTech[]

- `KURODA_MATCHUP_FLAVOR.style.speedVsTech[1]`: スピード対テクニック。捕まえてからの展開力が問われる
- `KURODA_MATCHUP_FLAVOR.style.speedVsTech[2]`: 素早さと巧さの勝負。どちらも一発の重さには欠けるので、試合運びが全てだ
- `KURODA_MATCHUP_FLAVOR.style.speedVsTech[3]`: スピード対テクニック。器用な二人の組み合わせだが、決め手に欠ける可能性もある
- `KURODA_MATCHUP_FLAVOR.style.speedVsTech[4]`: お互い一発の重さには欠ける分、試合運びが全てだ。地味だが奥が深いカード
- `KURODA_MATCHUP_FLAVOR.style.speedVsTech[5]`: 本紙としては、玄人好みのカードと書いておく。観る側の経験値が試される
- `KURODA_MATCHUP_FLAVOR.style.speedVsTech[6]`: 40年見てきた中で、こういうタイプ同士は一発の妙技で決まる試合が多い
- `KURODA_MATCHUP_FLAVOR.style.speedVsTech[7]`: スピード対テクニックは試合運びが命。先に主導権を握ったほうが圧倒的に有利だ

### style.defaultStyle[]

- `KURODA_MATCHUP_FLAVOR.style.defaultStyle[1]`: スタイルの相性は未知数。やってみないと分からない
- `KURODA_MATCHUP_FLAVOR.style.defaultStyle[2]`: タイプが違う二人。噛み合うか噛み合わないか、蓋を開けてみないとね
- `KURODA_MATCHUP_FLAVOR.style.defaultStyle[3]`: スタイル差が読みにくい組み合わせ。蓋を開けてみないと分からない
- `KURODA_MATCHUP_FLAVOR.style.defaultStyle[4]`: タイプの違いが吉と出るか凶と出るか。予測不能なのが面白くもあり、怖くもある
- `KURODA_MATCHUP_FLAVOR.style.defaultStyle[5]`: 本紙としては、こういう対戦は組んでみないと分からないと書いておく
- `KURODA_MATCHUP_FLAVOR.style.defaultStyle[6]`: 40年見てきた中で、スタイル不明瞭な対戦は化けることもある。期待しよう
- `KURODA_MATCHUP_FLAVOR.style.defaultStyle[7]`: 読みにくい組み合わせ。だが、読みにくいということは、どちらにとってもチャンスがあるということだ

### age.veteranVsYoung[]

- `KURODA_MATCHUP_FLAVOR.age.veteranVsYoung[1]`: ベテランと若手の構図。経験値が勝つか、勢いが勝つか
- `KURODA_MATCHUP_FLAVOR.age.veteranVsYoung[2]`: キャリアの差は明確。ただ、若さの爆発力は計算外のことを起こす
- `KURODA_MATCHUP_FLAVOR.age.veteranVsYoung[3]`: ベテランの引き出しが多いのは確かだ。だが若手のスタミナは侮れない
- `KURODA_MATCHUP_FLAVOR.age.veteranVsYoung[4]`: 経験が勝つか、勢いが勝つか。プロレスの永遠のテーマだ
- `KURODA_MATCHUP_FLAVOR.age.veteranVsYoung[5]`: 若手の無謀さを、ベテランがどこまで許容するか。試合の器が試される
- `KURODA_MATCHUP_FLAVOR.age.veteranVsYoung[6]`: 本紙としては、ベテラン対若手は世代交代の試金石だと書いておく
- `KURODA_MATCHUP_FLAVOR.age.veteranVsYoung[7]`: 40年見てきた中で、こういうカードでベテランが負けると、それは時代の節目になる
- `KURODA_MATCHUP_FLAVOR.age.veteranVsYoung[8]`: 経験差は決定的だ。ただし、若さの瞬発力がそれを上回る瞬間が一度でもあれば、試合は化ける

### age.sameGeneration[]

- `KURODA_MATCHUP_FLAVOR.age.sameGeneration[1]`: 同世代対決。ここで負けたくないプライドが一番ぶつかるカードだ
- `KURODA_MATCHUP_FLAVOR.age.sameGeneration[2]`: 同い年。純粋に実力勝負になる分、言い訳が効かないカードである
- `KURODA_MATCHUP_FLAVOR.age.sameGeneration[3]`: 同世代。比べられてきた分、意地のぶつかり合いになるだろう
- `KURODA_MATCHUP_FLAVOR.age.sameGeneration[4]`: 同い年で実力も近い。こういうカードは因縁に発展しやすい
- `KURODA_MATCHUP_FLAVOR.age.sameGeneration[5]`: 本紙としては、同世代対決ほど純粋な実力比較はないと書いておく
- `KURODA_MATCHUP_FLAVOR.age.sameGeneration[6]`: 40年見てきた中で、同期のライバル関係は一生もののドラマを生む
- `KURODA_MATCHUP_FLAVOR.age.sameGeneration[7]`: 年齢の言い訳ができない、純粋な力比べ。だからこそ負けた側のダメージは深い

### age.youngVsYoung[]

- `KURODA_MATCHUP_FLAVOR.age.youngVsYoung[1]`: 若手同士の激突。将来のエース候補がぶつかる
- `KURODA_MATCHUP_FLAVOR.age.youngVsYoung[2]`: フレッシュな顔合わせ。伸びしろが大きい分、予想外の展開もあり得る
- `KURODA_MATCHUP_FLAVOR.age.youngVsYoung[3]`: 若い二人の激突。荒削りでも、勢いのある試合が見られるはずだ
- `KURODA_MATCHUP_FLAVOR.age.youngVsYoung[4]`: 未来のエース候補同士。ここでの経験が3年後に効いてくる
- `KURODA_MATCHUP_FLAVOR.age.youngVsYoung[5]`: 本紙としては、こういうカードを丁寧に組むGMが業界を支えると書いておく
- `KURODA_MATCHUP_FLAVOR.age.youngVsYoung[6]`: 40年見てきた中で、若手同士の対戦が将来の名勝負の伏線になる例は多い
- `KURODA_MATCHUP_FLAVOR.age.youngVsYoung[7]`: 荒削りでも、若さが持つ熱は本物だ。観る側にも何か残るはずである

### age.veteranVsVeteran[]

- `KURODA_MATCHUP_FLAVOR.age.veteranVsVeteran[1]`: ベテラン同士の対決。お互い手の内を知り尽くしている可能性がある
- `KURODA_MATCHUP_FLAVOR.age.veteranVsVeteran[2]`: 円熟の戦い。若さはないが、巧さと意地のぶつかり合いは見応えがある
- `KURODA_MATCHUP_FLAVOR.age.veteranVsVeteran[3]`: ベテランの意地対決。お互い引くに引けない状況が一番怖い
- `KURODA_MATCHUP_FLAVOR.age.veteranVsVeteran[4]`: 二人とも手の内を知り尽くしているだろうから、駆け引きの質が違う
- `KURODA_MATCHUP_FLAVOR.age.veteranVsVeteran[5]`: 本紙としては、ベテラン同士の対決は教科書のような試合になると書いておく
- `KURODA_MATCHUP_FLAVOR.age.veteranVsVeteran[6]`: 40年見てきた中で、こういうカードは派手さよりも品格が問われる
- `KURODA_MATCHUP_FLAVOR.age.veteranVsVeteran[7]`: 老獪さがぶつかる。読み合いの深さこそが、若手には真似できない領域だ

### h2h.firstMeeting[]

- `KURODA_MATCHUP_FLAVOR.h2h.firstMeeting[1]`: 初対戦。手の内が読めない分、序盤の駆け引きが鍵だ
- `KURODA_MATCHUP_FLAVOR.h2h.firstMeeting[2]`: 初顔合わせ。データがない対戦は、地力が試される
- `KURODA_MATCHUP_FLAVOR.h2h.firstMeeting[3]`: 初対戦。お互い探り探りの序盤になるだろうが、ハマれば化ける可能性がある
- `KURODA_MATCHUP_FLAVOR.h2h.firstMeeting[4]`: 初顔合わせ。先入観がない分、意外な展開が生まれることもある
- `KURODA_MATCHUP_FLAVOR.h2h.firstMeeting[5]`: 本紙としては、初対戦は「印象が後を引く」と書いておく。今夜の出来が次戦の見方を決める
- `KURODA_MATCHUP_FLAVOR.h2h.firstMeeting[6]`: 40年見てきた中で、初顔合わせから因縁に発展する例は数えきれない。ここがスタートだ
- `KURODA_MATCHUP_FLAVOR.h2h.firstMeeting[7]`: データなし、対戦経験なし。お互い手探りの一夜になるだろう

### h2h.winningRecord[]

- `KURODA_MATCHUP_FLAVOR.h2h.winningRecord[1]`: 過去の対戦では${d.selfWins}勝${d.selfLosses}敗と勝ち越し。自信を持ってリングに上がれるだろう
- `KURODA_MATCHUP_FLAVOR.h2h.winningRecord[2]`: 直接対決で上回っている。ただ、相手も対策してくるだろうから油断は禁物だ
- `KURODA_MATCHUP_FLAVOR.h2h.winningRecord[3]`: 前回も勝っている。精神的な優位は確実にある
- `KURODA_MATCHUP_FLAVOR.h2h.winningRecord[4]`: 対戦成績で上回っている。相手は苦手意識を持っているはずだ
- `KURODA_MATCHUP_FLAVOR.h2h.winningRecord[5]`: ${d.selfWins}勝${d.selfLosses}敗——本紙としては、この数字が精神的な支えになると書いておく
- `KURODA_MATCHUP_FLAVOR.h2h.winningRecord[6]`: 40年見てきた中で、勝ち越している相手には「勝てる気」が無意識に働く。それも実力のうちだ
- `KURODA_MATCHUP_FLAVOR.h2h.winningRecord[7]`: 数字は嘘をつかない。${d.selfWins}勝${d.selfLosses}敗の優位は、リング上での自信に直結する

### h2h.losingRecord[]

- `KURODA_MATCHUP_FLAVOR.h2h.losingRecord[1]`: 過去${d.selfWins}勝${d.selfLosses}敗。苦手意識があるなら払拭するチャンスだ
- `KURODA_MATCHUP_FLAVOR.h2h.losingRecord[2]`: 直接対決で負け越している。相性が悪いのか、実力差なのか。今回で答えが出る
- `KURODA_MATCHUP_FLAVOR.h2h.losingRecord[3]`: 前回も負けている。何か変えないと同じ結果だろう
- `KURODA_MATCHUP_FLAVOR.h2h.losingRecord[4]`: 苦手な相手だ。だが、苦手を克服した時の成長は大きい
- `KURODA_MATCHUP_FLAVOR.h2h.losingRecord[5]`: 負け越しの相手。だからこそ今回勝てたら価値がある。ジャイアントキリングを期待したい
- `KURODA_MATCHUP_FLAVOR.h2h.losingRecord[6]`: 通算${d.selfWins}勝${d.selfLosses}敗——本紙としては、苦手意識との戦いが先と書いておく
- `KURODA_MATCHUP_FLAVOR.h2h.losingRecord[7]`: 40年見てきた中で、負け越し相手に勝つ瞬間は選手のキャリアの転換点になる
- `KURODA_MATCHUP_FLAVOR.h2h.losingRecord[8]`: ${d.selfWins}勝${d.selfLosses}敗の負け越し。同じやり方で勝てるなら、もう勝っているはずだ

### h2h.evenRecord[]

- `KURODA_MATCHUP_FLAVOR.h2h.evenRecord[1]`: 直接対決は互角。決着をつけるなら今回がチャンスだ
- `KURODA_MATCHUP_FLAVOR.h2h.evenRecord[2]`: 対戦成績イーブン。次に勝ったほうが流れを持っていく
- `KURODA_MATCHUP_FLAVOR.h2h.evenRecord[3]`: 五分五分の対戦成績。今回が事実上の決勝戦みたいなものだ
- `KURODA_MATCHUP_FLAVOR.h2h.evenRecord[4]`: 過去の対戦は互角。つまりどちらが勝ってもおかしくない。いいカードだ
- `KURODA_MATCHUP_FLAVOR.h2h.evenRecord[5]`: 本紙としては、互角の対戦成績は「次の一勝」が全てを変えると書いておく
- `KURODA_MATCHUP_FLAVOR.h2h.evenRecord[6]`: 40年見てきた中で、五分の関係から「真のライバル」が生まれることが多い
- `KURODA_MATCHUP_FLAVOR.h2h.evenRecord[7]`: 数字は嘘をつかない。互角だ。だからこそ、今回の勝敗が次の数字を決める

### momentum.hotStreak[]

- `KURODA_MATCHUP_FLAVOR.momentum.hotStreak[1]`: 好調を維持している。波に乗っているうちに当たれるのは好材料だ
- `KURODA_MATCHUP_FLAVOR.momentum.hotStreak[2]`: 調子が上向き。勢いは数字に出ない戦力である
- `KURODA_MATCHUP_FLAVOR.momentum.hotStreak[3]`: 調子がいい時に強い相手と当たれるのは幸運だ。この勢いを活かさない手はない
- `KURODA_MATCHUP_FLAVOR.momentum.hotStreak[4]`: 好調持続中。ただ、好調が永遠に続くわけではない

### momentum.coldStreak[]

- `KURODA_MATCHUP_FLAVOR.momentum.coldStreak[1]`: 不調が続いている。こういう時に格上と当たるのは率直に言ってキツい
- `KURODA_MATCHUP_FLAVOR.momentum.coldStreak[2]`: 最近の成績が振るわないのが気がかりだ。メンタル面も含めて心配である
- `KURODA_MATCHUP_FLAVOR.momentum.coldStreak[3]`: 不調の底で格上と当たるのは最悪のタイミングだ。メンタル面が心配である
- `KURODA_MATCHUP_FLAVOR.momentum.coldStreak[4]`: 結果が出ていない状態。こういう時に負けると一気に崩れるので、慎重な起用を勧める

### momentum.injuryReturn[]

- `KURODA_MATCHUP_FLAVOR.momentum.injuryReturn[1]`: 怪我明け。ブランクの影響がどこまで出るか読めない
- `KURODA_MATCHUP_FLAVOR.momentum.injuryReturn[2]`: 復帰戦に近い状態。無理をさせない判断もGMには求められる
- `KURODA_MATCHUP_FLAVOR.momentum.injuryReturn[3]`: 怪我明けだ。無理させないのもGMの仕事である
- `KURODA_MATCHUP_FLAVOR.momentum.injuryReturn[4]`: 復帰直後のカードとしては荷が重いかもしれない。段階を踏んだほうがいいだろう
