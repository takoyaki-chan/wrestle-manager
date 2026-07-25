# タッグマッチ

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `HOT_TAG_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: tag-battle セリフ類 — タッグ固有のみ / DAMAGE_SERIF_LINES / DAMAGE_VOICE_LINES / pickDamageLine は battle-lines.js に共通化済み / タッグ専用: ホットタグ時のカットイン [personality][archetype][3本]
- 本数: 147

### normal.normal[]

- `HOT_TAG_LINES.normal.normal[1]`: 任せて！
- `HOT_TAG_LINES.normal.normal[2]`: 交代だよ！
- `HOT_TAG_LINES.normal.normal[3]`: ここからは私が行く！

### normal.polite[]

- `HOT_TAG_LINES.normal.polite[1]`: お任せくださいっ！
- `HOT_TAG_LINES.normal.polite[2]`: 交代しますっ！
- `HOT_TAG_LINES.normal.polite[3]`: ここからは私が行きます！

### normal.seductive[]

- `HOT_TAG_LINES.normal.seductive[1]`: 任せて…いいわよ
- `HOT_TAG_LINES.normal.seductive[2]`: 交代よ
- `HOT_TAG_LINES.normal.seductive[3]`: ここからはわたしの番ね

### normal.delinquent[]

- `HOT_TAG_LINES.normal.delinquent[1]`: 任せときな！
- `HOT_TAG_LINES.normal.delinquent[2]`: 交代だ！
- `HOT_TAG_LINES.normal.delinquent[3]`: ここからはあたしが行く！

### normal.ojousama[]

- `HOT_TAG_LINES.normal.ojousama[1]`: お任せなさいませ！
- `HOT_TAG_LINES.normal.ojousama[2]`: 交代いたしますわ！
- `HOT_TAG_LINES.normal.ojousama[3]`: ここからはわたくしが！

### normal.cool[]

- `HOT_TAG_LINES.normal.cool[1]`: …任せて
- `HOT_TAG_LINES.normal.cool[2]`: …交代
- `HOT_TAG_LINES.normal.cool[3]`: …ここから、行く

### normal.composed[]

- `HOT_TAG_LINES.normal.composed[1]`: …任せて、いいよ
- `HOT_TAG_LINES.normal.composed[2]`: …交代、だね
- `HOT_TAG_LINES.normal.composed[3]`: …ここからは私が行くよ

### earnest.normal[]

- `HOT_TAG_LINES.earnest.normal[1]`: お疲れ様、あとは任せて！
- `HOT_TAG_LINES.earnest.normal[2]`: よく守った、交代だ！
- `HOT_TAG_LINES.earnest.normal[3]`: ここからは私が背負う！

### earnest.polite[]

- `HOT_TAG_LINES.earnest.polite[1]`: お疲れ様です、任せてくださいっ！
- `HOT_TAG_LINES.earnest.polite[2]`: よく耐えました、交代です！
- `HOT_TAG_LINES.earnest.polite[3]`: ここからは私が引き継ぎます！

### earnest.seductive[]

- `HOT_TAG_LINES.earnest.seductive[1]`: お疲れさま…あとは任せて
- `HOT_TAG_LINES.earnest.seductive[2]`: よく耐えたわね…交代よ
- `HOT_TAG_LINES.earnest.seductive[3]`: ここからはわたしが背負うわ

### earnest.delinquent[]

- `HOT_TAG_LINES.earnest.delinquent[1]`: お疲れさん、あとは任せろ！
- `HOT_TAG_LINES.earnest.delinquent[2]`: よく守ったな、交代だ！
- `HOT_TAG_LINES.earnest.delinquent[3]`: ここからはあたしが背負うぜ！

### earnest.ojousama[]

- `HOT_TAG_LINES.earnest.ojousama[1]`: お疲れさまですわ、お任せを！
- `HOT_TAG_LINES.earnest.ojousama[2]`: よく耐えましたわ、交代ですわ！
- `HOT_TAG_LINES.earnest.ojousama[3]`: ここからはわたくしが引き継ぎますわ！

### earnest.cool[]

- `HOT_TAG_LINES.earnest.cool[1]`: …お疲れ、任せて
- `HOT_TAG_LINES.earnest.cool[2]`: …よく守った
- `HOT_TAG_LINES.earnest.cool[3]`: …ここから、背負う

### earnest.composed[]

- `HOT_TAG_LINES.earnest.composed[1]`: …お疲れさま、あとは任せて
- `HOT_TAG_LINES.earnest.composed[2]`: …よく耐えたね、交代だよ
- `HOT_TAG_LINES.earnest.composed[3]`: …ここからは私が背負うよ

### bold.normal[]

- `HOT_TAG_LINES.bold.normal[1]`: 待ってました！
- `HOT_TAG_LINES.bold.normal[2]`: 私の番だ！
- `HOT_TAG_LINES.bold.normal[3]`: ようやく回ってきたな！

### bold.polite[]

- `HOT_TAG_LINES.bold.polite[1]`: 待っていましたっ！
- `HOT_TAG_LINES.bold.polite[2]`: わたしの番ですっ！
- `HOT_TAG_LINES.bold.polite[3]`: ようやく回ってきましたね！

### bold.seductive[]

- `HOT_TAG_LINES.bold.seductive[1]`: 待ちくたびれたわ
- `HOT_TAG_LINES.bold.seductive[2]`: わたしの番よ
- `HOT_TAG_LINES.bold.seductive[3]`: ようやく回ってきたわね

### bold.delinquent[]

- `HOT_TAG_LINES.bold.delinquent[1]`: 待ってたぜ！
- `HOT_TAG_LINES.bold.delinquent[2]`: あたしの番だ！
- `HOT_TAG_LINES.bold.delinquent[3]`: ようやく回ってきやがった！

### bold.ojousama[]

- `HOT_TAG_LINES.bold.ojousama[1]`: お待ちかねですわ！
- `HOT_TAG_LINES.bold.ojousama[2]`: わたくしの番ですわ！
- `HOT_TAG_LINES.bold.ojousama[3]`: ようやく回ってまいりましたわ！

### bold.cool[]

- `HOT_TAG_LINES.bold.cool[1]`: …待ってた
- `HOT_TAG_LINES.bold.cool[2]`: …あたしの番
- `HOT_TAG_LINES.bold.cool[3]`: …ようやく、だ

### bold.composed[]

- `HOT_TAG_LINES.bold.composed[1]`: …待ってたよ
- `HOT_TAG_LINES.bold.composed[2]`: …私の番だね
- `HOT_TAG_LINES.bold.composed[3]`: …ようやく回ってきた、かな

### easygoing.normal[]

- `HOT_TAG_LINES.easygoing.normal[1]`: はーい、交代〜！
- `HOT_TAG_LINES.easygoing.normal[2]`: お疲れさま♪ 私いくね
- `HOT_TAG_LINES.easygoing.normal[3]`: ここからは私の出番♪

### easygoing.polite[]

- `HOT_TAG_LINES.easygoing.polite[1]`: はーい、交代しますね〜！
- `HOT_TAG_LINES.easygoing.polite[2]`: お疲れさまです♪ いきますね
- `HOT_TAG_LINES.easygoing.polite[3]`: ここからはわたしの出番です♪

### easygoing.seductive[]

- `HOT_TAG_LINES.easygoing.seductive[1]`: はぁい、交代ね♪
- `HOT_TAG_LINES.easygoing.seductive[2]`: お疲れさま…あとは任せて♪
- `HOT_TAG_LINES.easygoing.seductive[3]`: ここからはわたしの時間よ♪

### easygoing.delinquent[]

- `HOT_TAG_LINES.easygoing.delinquent[1]`: はいはい、交代な〜！
- `HOT_TAG_LINES.easygoing.delinquent[2]`: お疲れさん♪ あたしいくぜ
- `HOT_TAG_LINES.easygoing.delinquent[3]`: ここからはあたしの出番だ♪

### easygoing.ojousama[]

- `HOT_TAG_LINES.easygoing.ojousama[1]`: はぁい、交代ですわ〜♪
- `HOT_TAG_LINES.easygoing.ojousama[2]`: お疲れさま♪ 参りますわ
- `HOT_TAG_LINES.easygoing.ojousama[3]`: ここからはわたくしの出番ですわ♪

### easygoing.cool[]

- `HOT_TAG_LINES.easygoing.cool[1]`: …はい、交代
- `HOT_TAG_LINES.easygoing.cool[2]`: …お疲れ、いく
- `HOT_TAG_LINES.easygoing.cool[3]`: …私の出番

### easygoing.composed[]

- `HOT_TAG_LINES.easygoing.composed[1]`: …はーい、交代〜
- `HOT_TAG_LINES.easygoing.composed[2]`: …お疲れさま、いくね
- `HOT_TAG_LINES.easygoing.composed[3]`: …ここからは私の番かな♪

### quiet.normal[]

- `HOT_TAG_LINES.quiet.normal[1]`: …交代
- `HOT_TAG_LINES.quiet.normal[2]`: …来た、私が
- `HOT_TAG_LINES.quiet.normal[3]`: …任せて

### quiet.polite[]

- `HOT_TAG_LINES.quiet.polite[1]`: …交代します
- `HOT_TAG_LINES.quiet.polite[2]`: …来ました
- `HOT_TAG_LINES.quiet.polite[3]`: …任せてください

### quiet.seductive[]

- `HOT_TAG_LINES.quiet.seductive[1]`: …交代、よ
- `HOT_TAG_LINES.quiet.seductive[2]`: …来たわ
- `HOT_TAG_LINES.quiet.seductive[3]`: …任せて、いい

### quiet.delinquent[]

- `HOT_TAG_LINES.quiet.delinquent[1]`: …交代だ
- `HOT_TAG_LINES.quiet.delinquent[2]`: …来たぜ
- `HOT_TAG_LINES.quiet.delinquent[3]`: …任せときな

### quiet.ojousama[]

- `HOT_TAG_LINES.quiet.ojousama[1]`: …交代ですわ
- `HOT_TAG_LINES.quiet.ojousama[2]`: …参りましたわ
- `HOT_TAG_LINES.quiet.ojousama[3]`: …お任せを

### quiet.cool[]

- `HOT_TAG_LINES.quiet.cool[1]`: ……交代
- `HOT_TAG_LINES.quiet.cool[2]`: ……代わる
- `HOT_TAG_LINES.quiet.cool[3]`: ……任せろ

### quiet.composed[]

- `HOT_TAG_LINES.quiet.composed[1]`: …交代、だよ
- `HOT_TAG_LINES.quiet.composed[2]`: …来たよ
- `HOT_TAG_LINES.quiet.composed[3]`: …任せて、いい

### shy.normal[]

- `HOT_TAG_LINES.shy.normal[1]`: が、頑張ります…！
- `HOT_TAG_LINES.shy.normal[2]`: こ、交代…します…
- `HOT_TAG_LINES.shy.normal[3]`: い、行ってきます…！

### shy.polite[]

- `HOT_TAG_LINES.shy.polite[1]`: が、頑張りますっ…！
- `HOT_TAG_LINES.shy.polite[2]`: こ、交代します…っ
- `HOT_TAG_LINES.shy.polite[3]`: い、行ってきますっ…！

### shy.seductive[]

- `HOT_TAG_LINES.shy.seductive[1]`: が、頑張る…から…
- `HOT_TAG_LINES.shy.seductive[2]`: こ、交代…ね…?
- `HOT_TAG_LINES.shy.seductive[3]`: い、行ってくる…わ…

### shy.delinquent[]

- `HOT_TAG_LINES.shy.delinquent[1]`: が、頑張るし…！
- `HOT_TAG_LINES.shy.delinquent[2]`: こ、交代…だ…
- `HOT_TAG_LINES.shy.delinquent[3]`: い、行ってくる…ぜ…

### shy.ojousama[]

- `HOT_TAG_LINES.shy.ojousama[1]`: が、頑張りますわ…！
- `HOT_TAG_LINES.shy.ojousama[2]`: こ、交代…ですわ…
- `HOT_TAG_LINES.shy.ojousama[3]`: い、行ってまいりますわ…！

### shy.cool[]

- `HOT_TAG_LINES.shy.cool[1]`: …っ、交代
- `HOT_TAG_LINES.shy.cool[2]`: …こ、ここから
- `HOT_TAG_LINES.shy.cool[3]`: …い、行く

### shy.composed[]

- `HOT_TAG_LINES.shy.composed[1]`: …が、頑張る、よ…
- `HOT_TAG_LINES.shy.composed[2]`: …こ、交代…だね…
- `HOT_TAG_LINES.shy.composed[3]`: …い、行ってくるね…

### emotional.normal[]

- `HOT_TAG_LINES.emotional.normal[1]`: 絶対…勝つ…！
- `HOT_TAG_LINES.emotional.normal[2]`: お疲れ…ここからは私が…！
- `HOT_TAG_LINES.emotional.normal[3]`: 任せて…絶対に…！

### emotional.polite[]

- `HOT_TAG_LINES.emotional.polite[1]`: 絶対…勝ちますっ…！
- `HOT_TAG_LINES.emotional.polite[2]`: お疲れさまっ…あとは私が…！
- `HOT_TAG_LINES.emotional.polite[3]`: 任せてくださいっ…絶対に…！

### emotional.seductive[]

- `HOT_TAG_LINES.emotional.seductive[1]`: 絶対…勝つわ…！
- `HOT_TAG_LINES.emotional.seductive[2]`: お疲れさま…あとはわたしが…！
- `HOT_TAG_LINES.emotional.seductive[3]`: 任せて…絶対に、よ…！

### emotional.delinquent[]

- `HOT_TAG_LINES.emotional.delinquent[1]`: 絶対勝つ…！
- `HOT_TAG_LINES.emotional.delinquent[2]`: お疲れ…あとはあたしが…！
- `HOT_TAG_LINES.emotional.delinquent[3]`: 任せろ…絶対だ…！

### emotional.ojousama[]

- `HOT_TAG_LINES.emotional.ojousama[1]`: 絶対…勝ちますわ…！
- `HOT_TAG_LINES.emotional.ojousama[2]`: お疲れさま…あとはわたくしが…！
- `HOT_TAG_LINES.emotional.ojousama[3]`: お任せを…絶対に…！

### emotional.cool[]

- `HOT_TAG_LINES.emotional.cool[1]`: …っ、絶対勝つ
- `HOT_TAG_LINES.emotional.cool[2]`: …あとは、私が
- `HOT_TAG_LINES.emotional.cool[3]`: …任せろ、絶対

### emotional.composed[]

- `HOT_TAG_LINES.emotional.composed[1]`: …絶対に、勝つよ…！
- `HOT_TAG_LINES.emotional.composed[2]`: …お疲れさま…あとは私が…
- `HOT_TAG_LINES.emotional.composed[3]`: …任せて、絶対に…

## `DOUBLE_TEAM_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: タッグ専用: ダブルチーム時のカットイン [personality][archetype][3本]
- 本数: 147

### normal.normal[]

- `DOUBLE_TEAM_LINES.normal.normal[1]`: 合わせて！
- `DOUBLE_TEAM_LINES.normal.normal[2]`: いくよ、二人で！
- `DOUBLE_TEAM_LINES.normal.normal[3]`: 息を合わせよう！

### normal.polite[]

- `DOUBLE_TEAM_LINES.normal.polite[1]`: 合わせてくださいっ！
- `DOUBLE_TEAM_LINES.normal.polite[2]`: いきますよ、二人で！
- `DOUBLE_TEAM_LINES.normal.polite[3]`: 息を合わせましょう！

### normal.seductive[]

- `DOUBLE_TEAM_LINES.normal.seductive[1]`: 合わせて…いくわよ
- `DOUBLE_TEAM_LINES.normal.seductive[2]`: 二人で、いきましょ
- `DOUBLE_TEAM_LINES.normal.seductive[3]`: 息を合わせて…ね

### normal.delinquent[]

- `DOUBLE_TEAM_LINES.normal.delinquent[1]`: 合わせろ！
- `DOUBLE_TEAM_LINES.normal.delinquent[2]`: いくぞ、二人で！
- `DOUBLE_TEAM_LINES.normal.delinquent[3]`: 息合わせな！

### normal.ojousama[]

- `DOUBLE_TEAM_LINES.normal.ojousama[1]`: 合わせてくださいまし！
- `DOUBLE_TEAM_LINES.normal.ojousama[2]`: 二人で参りますわ！
- `DOUBLE_TEAM_LINES.normal.ojousama[3]`: 息を合わせますわよ！

### normal.cool[]

- `DOUBLE_TEAM_LINES.normal.cool[1]`: …合わせて
- `DOUBLE_TEAM_LINES.normal.cool[2]`: …いく、二人で
- `DOUBLE_TEAM_LINES.normal.cool[3]`: …息を、合わせろ

### normal.composed[]

- `DOUBLE_TEAM_LINES.normal.composed[1]`: …合わせて、いくよ
- `DOUBLE_TEAM_LINES.normal.composed[2]`: …二人でいこうか
- `DOUBLE_TEAM_LINES.normal.composed[3]`: …息、合わせようね

### earnest.normal[]

- `DOUBLE_TEAM_LINES.earnest.normal[1]`: 一緒に…！
- `DOUBLE_TEAM_LINES.earnest.normal[2]`: タイミング合わせて！
- `DOUBLE_TEAM_LINES.earnest.normal[3]`: 二人で決めよう！

### earnest.polite[]

- `DOUBLE_TEAM_LINES.earnest.polite[1]`: 一緒にいきますっ！
- `DOUBLE_TEAM_LINES.earnest.polite[2]`: タイミング合わせてください！
- `DOUBLE_TEAM_LINES.earnest.polite[3]`: 二人で決めましょう！

### earnest.seductive[]

- `DOUBLE_TEAM_LINES.earnest.seductive[1]`: 一緒に…いくわよ
- `DOUBLE_TEAM_LINES.earnest.seductive[2]`: タイミング、合わせて
- `DOUBLE_TEAM_LINES.earnest.seductive[3]`: 二人で決めるわ

### earnest.delinquent[]

- `DOUBLE_TEAM_LINES.earnest.delinquent[1]`: 一緒にいくぞ！
- `DOUBLE_TEAM_LINES.earnest.delinquent[2]`: タイミング合わせろ！
- `DOUBLE_TEAM_LINES.earnest.delinquent[3]`: 二人で決めるぜ！

### earnest.ojousama[]

- `DOUBLE_TEAM_LINES.earnest.ojousama[1]`: ご一緒に参りますわ！
- `DOUBLE_TEAM_LINES.earnest.ojousama[2]`: タイミングを合わせて！
- `DOUBLE_TEAM_LINES.earnest.ojousama[3]`: 二人で決めますわ！

### earnest.cool[]

- `DOUBLE_TEAM_LINES.earnest.cool[1]`: …一緒に
- `DOUBLE_TEAM_LINES.earnest.cool[2]`: …タイミング
- `DOUBLE_TEAM_LINES.earnest.cool[3]`: …二人で、決める

### earnest.composed[]

- `DOUBLE_TEAM_LINES.earnest.composed[1]`: …一緒にいくよ
- `DOUBLE_TEAM_LINES.earnest.composed[2]`: …タイミング、合わせて
- `DOUBLE_TEAM_LINES.earnest.composed[3]`: …二人で決めようね

### bold.normal[]

- `DOUBLE_TEAM_LINES.bold.normal[1]`: 二人で決める！
- `DOUBLE_TEAM_LINES.bold.normal[2]`: 合わせろ、いくぞ！
- `DOUBLE_TEAM_LINES.bold.normal[3]`: 逃がさない、そっち頼む！

### bold.polite[]

- `DOUBLE_TEAM_LINES.bold.polite[1]`: 二人で決めますっ！
- `DOUBLE_TEAM_LINES.bold.polite[2]`: 合わせてください、いきますよ！
- `DOUBLE_TEAM_LINES.bold.polite[3]`: 逃がしません、そちら頼みますっ！

### bold.seductive[]

- `DOUBLE_TEAM_LINES.bold.seductive[1]`: 二人で決めるわよ
- `DOUBLE_TEAM_LINES.bold.seductive[2]`: 合わせなさい
- `DOUBLE_TEAM_LINES.bold.seductive[3]`: 逃がさないわ、そっち任せた

### bold.delinquent[]

- `DOUBLE_TEAM_LINES.bold.delinquent[1]`: 二人で決めるぞ！
- `DOUBLE_TEAM_LINES.bold.delinquent[2]`: 合わせろ、相棒！
- `DOUBLE_TEAM_LINES.bold.delinquent[3]`: 逃がさねえ、そっち頼むぜ！

### bold.ojousama[]

- `DOUBLE_TEAM_LINES.bold.ojousama[1]`: 二人で決めますわよ！
- `DOUBLE_TEAM_LINES.bold.ojousama[2]`: お合わせなさい！
- `DOUBLE_TEAM_LINES.bold.ojousama[3]`: 逃がしませんわ、そちらお任せを！

### bold.cool[]

- `DOUBLE_TEAM_LINES.bold.cool[1]`: …二人で決める
- `DOUBLE_TEAM_LINES.bold.cool[2]`: …合わせろ
- `DOUBLE_TEAM_LINES.bold.cool[3]`: …逃がさない、頼む

### bold.composed[]

- `DOUBLE_TEAM_LINES.bold.composed[1]`: …二人で決めるよ
- `DOUBLE_TEAM_LINES.bold.composed[2]`: …合わせて、いこうか
- `DOUBLE_TEAM_LINES.bold.composed[3]`: …逃がさない、そっち頼むね

### easygoing.normal[]

- `DOUBLE_TEAM_LINES.easygoing.normal[1]`: 一緒にやろ〜！
- `DOUBLE_TEAM_LINES.easygoing.normal[2]`: 合わせて合わせて♪
- `DOUBLE_TEAM_LINES.easygoing.normal[3]`: せーのっ♪

### easygoing.polite[]

- `DOUBLE_TEAM_LINES.easygoing.polite[1]`: 一緒にやりましょ〜！
- `DOUBLE_TEAM_LINES.easygoing.polite[2]`: 合わせてくださいね♪
- `DOUBLE_TEAM_LINES.easygoing.polite[3]`: せーのっ、です♪

### easygoing.seductive[]

- `DOUBLE_TEAM_LINES.easygoing.seductive[1]`: 一緒にいきましょ♪
- `DOUBLE_TEAM_LINES.easygoing.seductive[2]`: 合わせて…ね♪
- `DOUBLE_TEAM_LINES.easygoing.seductive[3]`: せーの…よ♪

### easygoing.delinquent[]

- `DOUBLE_TEAM_LINES.easygoing.delinquent[1]`: 一緒にやろうぜ〜！
- `DOUBLE_TEAM_LINES.easygoing.delinquent[2]`: 合わせろ合わせろ♪
- `DOUBLE_TEAM_LINES.easygoing.delinquent[3]`: せーのっ、だ！

### easygoing.ojousama[]

- `DOUBLE_TEAM_LINES.easygoing.ojousama[1]`: ご一緒にですわ〜♪
- `DOUBLE_TEAM_LINES.easygoing.ojousama[2]`: お合わせあそばせ♪
- `DOUBLE_TEAM_LINES.easygoing.ojousama[3]`: せーの、ですわ♪

### easygoing.cool[]

- `DOUBLE_TEAM_LINES.easygoing.cool[1]`: …一緒に
- `DOUBLE_TEAM_LINES.easygoing.cool[2]`: …合わせて
- `DOUBLE_TEAM_LINES.easygoing.cool[3]`: …せーの

### easygoing.composed[]

- `DOUBLE_TEAM_LINES.easygoing.composed[1]`: …一緒にやろ〜
- `DOUBLE_TEAM_LINES.easygoing.composed[2]`: …合わせて、ね♪
- `DOUBLE_TEAM_LINES.easygoing.composed[3]`: …せーの、かな

### quiet.normal[]

- `DOUBLE_TEAM_LINES.quiet.normal[1]`: …合わせる
- `DOUBLE_TEAM_LINES.quiet.normal[2]`: …せーの
- `DOUBLE_TEAM_LINES.quiet.normal[3]`: …いこう

### quiet.polite[]

- `DOUBLE_TEAM_LINES.quiet.polite[1]`: …合わせます
- `DOUBLE_TEAM_LINES.quiet.polite[2]`: …せーの、です
- `DOUBLE_TEAM_LINES.quiet.polite[3]`: …いきましょう

### quiet.seductive[]

- `DOUBLE_TEAM_LINES.quiet.seductive[1]`: …合わせて、よ
- `DOUBLE_TEAM_LINES.quiet.seductive[2]`: …せーの…ね
- `DOUBLE_TEAM_LINES.quiet.seductive[3]`: …いくわ

### quiet.delinquent[]

- `DOUBLE_TEAM_LINES.quiet.delinquent[1]`: …合わせろ
- `DOUBLE_TEAM_LINES.quiet.delinquent[2]`: …せーの、だ
- `DOUBLE_TEAM_LINES.quiet.delinquent[3]`: …いくぜ

### quiet.ojousama[]

- `DOUBLE_TEAM_LINES.quiet.ojousama[1]`: …合わせますわ
- `DOUBLE_TEAM_LINES.quiet.ojousama[2]`: …せーの、ですわ
- `DOUBLE_TEAM_LINES.quiet.ojousama[3]`: …参りますわ

### quiet.cool[]

- `DOUBLE_TEAM_LINES.quiet.cool[1]`: ……合わせる
- `DOUBLE_TEAM_LINES.quiet.cool[2]`: ……せーの
- `DOUBLE_TEAM_LINES.quiet.cool[3]`: ……いく

### quiet.composed[]

- `DOUBLE_TEAM_LINES.quiet.composed[1]`: …合わせるよ
- `DOUBLE_TEAM_LINES.quiet.composed[2]`: …せーの、だね
- `DOUBLE_TEAM_LINES.quiet.composed[3]`: …いこうか

### shy.normal[]

- `DOUBLE_TEAM_LINES.shy.normal[1]`: あ、合わせます…！
- `DOUBLE_TEAM_LINES.shy.normal[2]`: に、二人で…！
- `DOUBLE_TEAM_LINES.shy.normal[3]`: い、いっしょに…！

### shy.polite[]

- `DOUBLE_TEAM_LINES.shy.polite[1]`: あ、合わせますっ…！
- `DOUBLE_TEAM_LINES.shy.polite[2]`: に、二人で…お願いします…！
- `DOUBLE_TEAM_LINES.shy.polite[3]`: い、いっしょにっ…！

### shy.seductive[]

- `DOUBLE_TEAM_LINES.shy.seductive[1]`: あ、合わせて…ね…?
- `DOUBLE_TEAM_LINES.shy.seductive[2]`: ふ、二人で…いこ…
- `DOUBLE_TEAM_LINES.shy.seductive[3]`: い、いっしょに…よ…

### shy.delinquent[]

- `DOUBLE_TEAM_LINES.shy.delinquent[1]`: あ、合わせろし…！
- `DOUBLE_TEAM_LINES.shy.delinquent[2]`: ふ、二人で…だ…！
- `DOUBLE_TEAM_LINES.shy.delinquent[3]`: い、いっしょにやるぞ…

### shy.ojousama[]

- `DOUBLE_TEAM_LINES.shy.ojousama[1]`: あ、合わせてくださいまし…！
- `DOUBLE_TEAM_LINES.shy.ojousama[2]`: ふ、二人で…ですわ…！
- `DOUBLE_TEAM_LINES.shy.ojousama[3]`: い、いっしょに参りますわ…！

### shy.cool[]

- `DOUBLE_TEAM_LINES.shy.cool[1]`: …あ、合わせて
- `DOUBLE_TEAM_LINES.shy.cool[2]`: …ふ、二人で
- `DOUBLE_TEAM_LINES.shy.cool[3]`: …い、いっしょに

### shy.composed[]

- `DOUBLE_TEAM_LINES.shy.composed[1]`: …あ、合わせるね…
- `DOUBLE_TEAM_LINES.shy.composed[2]`: …ふ、二人で、ね…
- `DOUBLE_TEAM_LINES.shy.composed[3]`: …い、いっしょに、いこ…

### emotional.normal[]

- `DOUBLE_TEAM_LINES.emotional.normal[1]`: 二人でっ…！
- `DOUBLE_TEAM_LINES.emotional.normal[2]`: 合わせるよ…っ！
- `DOUBLE_TEAM_LINES.emotional.normal[3]`: 絶対決めるっ…！

### emotional.polite[]

- `DOUBLE_TEAM_LINES.emotional.polite[1]`: 二人でっ…いきますっ！
- `DOUBLE_TEAM_LINES.emotional.polite[2]`: 合わせますっ…！
- `DOUBLE_TEAM_LINES.emotional.polite[3]`: 絶対決めますっ…！

### emotional.seductive[]

- `DOUBLE_TEAM_LINES.emotional.seductive[1]`: 二人で…決めるわよっ…！
- `DOUBLE_TEAM_LINES.emotional.seductive[2]`: 合わせて…っ！
- `DOUBLE_TEAM_LINES.emotional.seductive[3]`: 絶対決めるわ…っ！

### emotional.delinquent[]

- `DOUBLE_TEAM_LINES.emotional.delinquent[1]`: 二人でっ…いくぞ！
- `DOUBLE_TEAM_LINES.emotional.delinquent[2]`: 合わせろっ…！
- `DOUBLE_TEAM_LINES.emotional.delinquent[3]`: 絶対決めるぜ…っ！

### emotional.ojousama[]

- `DOUBLE_TEAM_LINES.emotional.ojousama[1]`: 二人で…決めますわっ…！
- `DOUBLE_TEAM_LINES.emotional.ojousama[2]`: 合わせなさいっ…！
- `DOUBLE_TEAM_LINES.emotional.ojousama[3]`: 絶対決めますわ…っ！

### emotional.cool[]

- `DOUBLE_TEAM_LINES.emotional.cool[1]`: …っ、二人で
- `DOUBLE_TEAM_LINES.emotional.cool[2]`: …合わせろ
- `DOUBLE_TEAM_LINES.emotional.cool[3]`: …絶対、決める

### emotional.composed[]

- `DOUBLE_TEAM_LINES.emotional.composed[1]`: …二人で、決めるよ…！
- `DOUBLE_TEAM_LINES.emotional.composed[2]`: …合わせて…っ
- `DOUBLE_TEAM_LINES.emotional.composed[3]`: …絶対決める、から…

## `CUTIN_SAVE_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: タッグ専用: カットイン救出時のセリフ [personality][archetype][3本]
- 本数: 147

### normal.normal[]

- `CUTIN_SAVE_LINES.normal.normal[1]`: させない！
- `CUTIN_SAVE_LINES.normal.normal[2]`: まだだ！
- `CUTIN_SAVE_LINES.normal.normal[3]`: 渡さないよ！

### normal.polite[]

- `CUTIN_SAVE_LINES.normal.polite[1]`: させませんっ！
- `CUTIN_SAVE_LINES.normal.polite[2]`: まだですっ！
- `CUTIN_SAVE_LINES.normal.polite[3]`: 渡しませんっ！

### normal.seductive[]

- `CUTIN_SAVE_LINES.normal.seductive[1]`: させないわ
- `CUTIN_SAVE_LINES.normal.seductive[2]`: まだよ
- `CUTIN_SAVE_LINES.normal.seductive[3]`: 渡さない…わ

### normal.delinquent[]

- `CUTIN_SAVE_LINES.normal.delinquent[1]`: させねえ！
- `CUTIN_SAVE_LINES.normal.delinquent[2]`: まだだ！
- `CUTIN_SAVE_LINES.normal.delinquent[3]`: 渡さねえよ！

### normal.ojousama[]

- `CUTIN_SAVE_LINES.normal.ojousama[1]`: させませんわ！
- `CUTIN_SAVE_LINES.normal.ojousama[2]`: まだですわ！
- `CUTIN_SAVE_LINES.normal.ojousama[3]`: 渡しませんわ！

### normal.cool[]

- `CUTIN_SAVE_LINES.normal.cool[1]`: …させない
- `CUTIN_SAVE_LINES.normal.cool[2]`: …まだ
- `CUTIN_SAVE_LINES.normal.cool[3]`: …渡さない

### normal.composed[]

- `CUTIN_SAVE_LINES.normal.composed[1]`: …させないよ
- `CUTIN_SAVE_LINES.normal.composed[2]`: …まだだよ
- `CUTIN_SAVE_LINES.normal.composed[3]`: …渡さない、から

### earnest.normal[]

- `CUTIN_SAVE_LINES.earnest.normal[1]`: そうはさせない！
- `CUTIN_SAVE_LINES.earnest.normal[2]`: まだ諦めてない！
- `CUTIN_SAVE_LINES.earnest.normal[3]`: 絶対渡さない！

### earnest.polite[]

- `CUTIN_SAVE_LINES.earnest.polite[1]`: そうはさせませんっ！
- `CUTIN_SAVE_LINES.earnest.polite[2]`: まだ諦めていませんっ！
- `CUTIN_SAVE_LINES.earnest.polite[3]`: 絶対渡しませんっ！

### earnest.seductive[]

- `CUTIN_SAVE_LINES.earnest.seductive[1]`: そうはさせないわ
- `CUTIN_SAVE_LINES.earnest.seductive[2]`: まだ諦めてないの
- `CUTIN_SAVE_LINES.earnest.seductive[3]`: 絶対渡さないわ

### earnest.delinquent[]

- `CUTIN_SAVE_LINES.earnest.delinquent[1]`: そうはさせねえ！
- `CUTIN_SAVE_LINES.earnest.delinquent[2]`: まだ諦めてねえ！
- `CUTIN_SAVE_LINES.earnest.delinquent[3]`: 絶対渡さねえ！

### earnest.ojousama[]

- `CUTIN_SAVE_LINES.earnest.ojousama[1]`: そうはさせませんわ！
- `CUTIN_SAVE_LINES.earnest.ojousama[2]`: まだ諦めておりませんわ！
- `CUTIN_SAVE_LINES.earnest.ojousama[3]`: 絶対渡しませんわ！

### earnest.cool[]

- `CUTIN_SAVE_LINES.earnest.cool[1]`: …させない
- `CUTIN_SAVE_LINES.earnest.cool[2]`: …諦めてない
- `CUTIN_SAVE_LINES.earnest.cool[3]`: …絶対、渡さない

### earnest.composed[]

- `CUTIN_SAVE_LINES.earnest.composed[1]`: …そうはさせないよ
- `CUTIN_SAVE_LINES.earnest.composed[2]`: …まだ諦めてないよ
- `CUTIN_SAVE_LINES.earnest.composed[3]`: …絶対、渡さないから

### bold.normal[]

- `CUTIN_SAVE_LINES.bold.normal[1]`: そうはさせるか！
- `CUTIN_SAVE_LINES.bold.normal[2]`: まだまだ！
- `CUTIN_SAVE_LINES.bold.normal[3]`: そうはいかない！

### bold.polite[]

- `CUTIN_SAVE_LINES.bold.polite[1]`: そうはさせませんよ！
- `CUTIN_SAVE_LINES.bold.polite[2]`: まだまだですっ！
- `CUTIN_SAVE_LINES.bold.polite[3]`: そうはいきませんっ！

### bold.seductive[]

- `CUTIN_SAVE_LINES.bold.seductive[1]`: そうはさせないわよ
- `CUTIN_SAVE_LINES.bold.seductive[2]`: まだまだよ
- `CUTIN_SAVE_LINES.bold.seductive[3]`: そうはいかないわ

### bold.delinquent[]

- `CUTIN_SAVE_LINES.bold.delinquent[1]`: そうはさせるかよ！
- `CUTIN_SAVE_LINES.bold.delinquent[2]`: まだまだだ！
- `CUTIN_SAVE_LINES.bold.delinquent[3]`: そうはいかねえ！

### bold.ojousama[]

- `CUTIN_SAVE_LINES.bold.ojousama[1]`: そうはさせませんわよ！
- `CUTIN_SAVE_LINES.bold.ojousama[2]`: まだまだですわ！
- `CUTIN_SAVE_LINES.bold.ojousama[3]`: そうはいきませんわ！

### bold.cool[]

- `CUTIN_SAVE_LINES.bold.cool[1]`: …させるか
- `CUTIN_SAVE_LINES.bold.cool[2]`: …まだまだ
- `CUTIN_SAVE_LINES.bold.cool[3]`: …そうはいかない

### bold.composed[]

- `CUTIN_SAVE_LINES.bold.composed[1]`: …させないよ、そう簡単には
- `CUTIN_SAVE_LINES.bold.composed[2]`: …まだまだ、だよ
- `CUTIN_SAVE_LINES.bold.composed[3]`: …そうはいかないかな

### easygoing.normal[]

- `CUTIN_SAVE_LINES.easygoing.normal[1]`: させないよ〜！
- `CUTIN_SAVE_LINES.easygoing.normal[2]`: まだまだ〜！
- `CUTIN_SAVE_LINES.easygoing.normal[3]`: はい、カット！

### easygoing.polite[]

- `CUTIN_SAVE_LINES.easygoing.polite[1]`: させませんよ〜！
- `CUTIN_SAVE_LINES.easygoing.polite[2]`: まだまだですよ〜！
- `CUTIN_SAVE_LINES.easygoing.polite[3]`: はい、カットです！

### easygoing.seductive[]

- `CUTIN_SAVE_LINES.easygoing.seductive[1]`: させないわよ〜♪
- `CUTIN_SAVE_LINES.easygoing.seductive[2]`: まだまだ…よ♪
- `CUTIN_SAVE_LINES.easygoing.seductive[3]`: はぁい、カット♪

### easygoing.delinquent[]

- `CUTIN_SAVE_LINES.easygoing.delinquent[1]`: させねえよ〜！
- `CUTIN_SAVE_LINES.easygoing.delinquent[2]`: まだまだだ〜！
- `CUTIN_SAVE_LINES.easygoing.delinquent[3]`: ほい、カットだ！

### easygoing.ojousama[]

- `CUTIN_SAVE_LINES.easygoing.ojousama[1]`: させませんわよ〜♪
- `CUTIN_SAVE_LINES.easygoing.ojousama[2]`: まだまだですわ〜！
- `CUTIN_SAVE_LINES.easygoing.ojousama[3]`: はぁい、カットですわ♪

### easygoing.cool[]

- `CUTIN_SAVE_LINES.easygoing.cool[1]`: …させない
- `CUTIN_SAVE_LINES.easygoing.cool[2]`: …まだまだ
- `CUTIN_SAVE_LINES.easygoing.cool[3]`: …カット

### easygoing.composed[]

- `CUTIN_SAVE_LINES.easygoing.composed[1]`: …させないよ〜
- `CUTIN_SAVE_LINES.easygoing.composed[2]`: …まだまだ、かな
- `CUTIN_SAVE_LINES.easygoing.composed[3]`: …はい、カット

### quiet.normal[]

- `CUTIN_SAVE_LINES.quiet.normal[1]`: …させない
- `CUTIN_SAVE_LINES.quiet.normal[2]`: …まだ
- `CUTIN_SAVE_LINES.quiet.normal[3]`: …駄目

### quiet.polite[]

- `CUTIN_SAVE_LINES.quiet.polite[1]`: …させません
- `CUTIN_SAVE_LINES.quiet.polite[2]`: …まだです
- `CUTIN_SAVE_LINES.quiet.polite[3]`: …駄目です

### quiet.seductive[]

- `CUTIN_SAVE_LINES.quiet.seductive[1]`: …させないわ
- `CUTIN_SAVE_LINES.quiet.seductive[2]`: …まだ、よ
- `CUTIN_SAVE_LINES.quiet.seductive[3]`: …駄目よ

### quiet.delinquent[]

- `CUTIN_SAVE_LINES.quiet.delinquent[1]`: …させねえ
- `CUTIN_SAVE_LINES.quiet.delinquent[2]`: …まだだ
- `CUTIN_SAVE_LINES.quiet.delinquent[3]`: …駄目だ

### quiet.ojousama[]

- `CUTIN_SAVE_LINES.quiet.ojousama[1]`: …させませんわ
- `CUTIN_SAVE_LINES.quiet.ojousama[2]`: …まだですわ
- `CUTIN_SAVE_LINES.quiet.ojousama[3]`: …なりませんわ

### quiet.cool[]

- `CUTIN_SAVE_LINES.quiet.cool[1]`: ……させない
- `CUTIN_SAVE_LINES.quiet.cool[2]`: ……まだ
- `CUTIN_SAVE_LINES.quiet.cool[3]`: ……駄目

### quiet.composed[]

- `CUTIN_SAVE_LINES.quiet.composed[1]`: …させないよ
- `CUTIN_SAVE_LINES.quiet.composed[2]`: …まだ、だよ
- `CUTIN_SAVE_LINES.quiet.composed[3]`: …駄目だよ

### shy.normal[]

- `CUTIN_SAVE_LINES.shy.normal[1]`: さ、させない…！
- `CUTIN_SAVE_LINES.shy.normal[2]`: ま、まだ…です…！
- `CUTIN_SAVE_LINES.shy.normal[3]`: だ、ダメ…！

### shy.polite[]

- `CUTIN_SAVE_LINES.shy.polite[1]`: さ、させませんっ…！
- `CUTIN_SAVE_LINES.shy.polite[2]`: ま、まだですっ…！
- `CUTIN_SAVE_LINES.shy.polite[3]`: だ、ダメですっ…！

### shy.seductive[]

- `CUTIN_SAVE_LINES.shy.seductive[1]`: さ、させない…わ…!
- `CUTIN_SAVE_LINES.shy.seductive[2]`: ま、まだ…よ…!
- `CUTIN_SAVE_LINES.shy.seductive[3]`: だ、ダメ…なの…!

### shy.delinquent[]

- `CUTIN_SAVE_LINES.shy.delinquent[1]`: さ、させねえ…！
- `CUTIN_SAVE_LINES.shy.delinquent[2]`: ま、まだだ…！
- `CUTIN_SAVE_LINES.shy.delinquent[3]`: だ、ダメだ…！

### shy.ojousama[]

- `CUTIN_SAVE_LINES.shy.ojousama[1]`: さ、させませんわ…！
- `CUTIN_SAVE_LINES.shy.ojousama[2]`: ま、まだですわ…！
- `CUTIN_SAVE_LINES.shy.ojousama[3]`: だ、ダメですわ…！

### shy.cool[]

- `CUTIN_SAVE_LINES.shy.cool[1]`: …さ、させない
- `CUTIN_SAVE_LINES.shy.cool[2]`: …ま、まだ
- `CUTIN_SAVE_LINES.shy.cool[3]`: …だ、ダメ

### shy.composed[]

- `CUTIN_SAVE_LINES.shy.composed[1]`: …さ、させないよ…
- `CUTIN_SAVE_LINES.shy.composed[2]`: …ま、まだ、だよ…
- `CUTIN_SAVE_LINES.shy.composed[3]`: …だ、ダメ、だよ…

### emotional.normal[]

- `CUTIN_SAVE_LINES.emotional.normal[1]`: 絶対させないっ…！
- `CUTIN_SAVE_LINES.emotional.normal[2]`: まだっ…！
- `CUTIN_SAVE_LINES.emotional.normal[3]`: そんなの…駄目っ…！

### emotional.polite[]

- `CUTIN_SAVE_LINES.emotional.polite[1]`: 絶対させませんっ…！
- `CUTIN_SAVE_LINES.emotional.polite[2]`: まだですっ…！
- `CUTIN_SAVE_LINES.emotional.polite[3]`: そんなの駄目ですっ…！

### emotional.seductive[]

- `CUTIN_SAVE_LINES.emotional.seductive[1]`: 絶対させないわっ…！
- `CUTIN_SAVE_LINES.emotional.seductive[2]`: まだよっ…！
- `CUTIN_SAVE_LINES.emotional.seductive[3]`: そんなの…許さないわっ…！

### emotional.delinquent[]

- `CUTIN_SAVE_LINES.emotional.delinquent[1]`: 絶対させねえっ…！
- `CUTIN_SAVE_LINES.emotional.delinquent[2]`: まだだっ…！
- `CUTIN_SAVE_LINES.emotional.delinquent[3]`: そんなの…させるかっ…！

### emotional.ojousama[]

- `CUTIN_SAVE_LINES.emotional.ojousama[1]`: 絶対させませんわっ…！
- `CUTIN_SAVE_LINES.emotional.ojousama[2]`: まだですわっ…！
- `CUTIN_SAVE_LINES.emotional.ojousama[3]`: そんなの…許しませんわっ…！

### emotional.cool[]

- `CUTIN_SAVE_LINES.emotional.cool[1]`: …っ、させない
- `CUTIN_SAVE_LINES.emotional.cool[2]`: …まだ
- `CUTIN_SAVE_LINES.emotional.cool[3]`: …駄目だ、絶対

### emotional.composed[]

- `CUTIN_SAVE_LINES.emotional.composed[1]`: …絶対、させないよ…！
- `CUTIN_SAVE_LINES.emotional.composed[2]`: …まだ、だよ…！
- `CUTIN_SAVE_LINES.emotional.composed[3]`: …そんなの、駄目だから…

## `BETRAYAL_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: タッグ専用: 見殺し時のセリフ（動かないパートナー側） [personality][archetype][3本]
- 本数: 141

### normal.normal[]

- `BETRAYAL_LINES.normal.normal[1]`: ……動けない
- `BETRAYAL_LINES.normal.normal[2]`: ……間に合わない

### normal.polite[]

- `BETRAYAL_LINES.normal.polite[1]`: ……動けません
- `BETRAYAL_LINES.normal.polite[2]`: ……間に合いません
- `BETRAYAL_LINES.normal.polite[3]`: ……ごめんなさい

### normal.seductive[]

- `BETRAYAL_LINES.normal.seductive[1]`: ……動けないわ
- `BETRAYAL_LINES.normal.seductive[2]`: ……間に合わない…わ
- `BETRAYAL_LINES.normal.seductive[3]`: ……ごめんね

### normal.delinquent[]

- `BETRAYAL_LINES.normal.delinquent[1]`: ……動けねえ
- `BETRAYAL_LINES.normal.delinquent[2]`: ……間に合わねえ
- `BETRAYAL_LINES.normal.delinquent[3]`: ……くそっ

### normal.ojousama[]

- `BETRAYAL_LINES.normal.ojousama[1]`: ……動けませんわ
- `BETRAYAL_LINES.normal.ojousama[2]`: ……間に合いませんわ
- `BETRAYAL_LINES.normal.ojousama[3]`: ……申し訳、ございませんわ

### normal.cool[]

- `BETRAYAL_LINES.normal.cool[2]`: ……動けない
- `BETRAYAL_LINES.normal.cool[3]`: ……届かない

### normal.composed[]

- `BETRAYAL_LINES.normal.composed[1]`: ……動けないよ
- `BETRAYAL_LINES.normal.composed[2]`: ……間に合わない、か
- `BETRAYAL_LINES.normal.composed[3]`: ……ごめん

### earnest.normal[]

- `BETRAYAL_LINES.earnest.normal[1]`: 間に合わない…！
- `BETRAYAL_LINES.earnest.normal[2]`: 動けない…！
- `BETRAYAL_LINES.earnest.normal[3]`: ……守れなかった

### earnest.polite[]

- `BETRAYAL_LINES.earnest.polite[1]`: 間に合いません…！
- `BETRAYAL_LINES.earnest.polite[2]`: 動けません…！
- `BETRAYAL_LINES.earnest.polite[3]`: ……守れませんでした

### earnest.seductive[]

- `BETRAYAL_LINES.earnest.seductive[1]`: 間に合わない…わ
- `BETRAYAL_LINES.earnest.seductive[2]`: 動けない…の
- `BETRAYAL_LINES.earnest.seductive[3]`: ……守れなかった、わね

### earnest.delinquent[]

- `BETRAYAL_LINES.earnest.delinquent[1]`: 間に合わねえ…！
- `BETRAYAL_LINES.earnest.delinquent[2]`: 動けねえ…！
- `BETRAYAL_LINES.earnest.delinquent[3]`: ……守れなかった

### earnest.ojousama[]

- `BETRAYAL_LINES.earnest.ojousama[1]`: 間に合いませんわ…！
- `BETRAYAL_LINES.earnest.ojousama[2]`: 動けませんの…！
- `BETRAYAL_LINES.earnest.ojousama[3]`: ……守れませんでしたわ

### earnest.cool[]

- `BETRAYAL_LINES.earnest.cool[1]`: …間に合わない
- `BETRAYAL_LINES.earnest.cool[2]`: …動けない
- `BETRAYAL_LINES.earnest.cool[3]`: ……守れなかった

### earnest.composed[]

- `BETRAYAL_LINES.earnest.composed[1]`: …間に合わないか…
- `BETRAYAL_LINES.earnest.composed[2]`: …動けないよ…
- `BETRAYAL_LINES.earnest.composed[3]`: ……守れなかった、な

### bold.normal[]

- `BETRAYAL_LINES.bold.normal[1]`: くっ…！
- `BETRAYAL_LINES.bold.normal[2]`: ちっ…間に合わない
- `BETRAYAL_LINES.bold.normal[3]`: 届かなかった…

### bold.polite[]

- `BETRAYAL_LINES.bold.polite[1]`: くっ…！
- `BETRAYAL_LINES.bold.polite[2]`: くぅっ…間に合いません
- `BETRAYAL_LINES.bold.polite[3]`: 届きませんでした…

### bold.seductive[]

- `BETRAYAL_LINES.bold.seductive[1]`: くっ…！
- `BETRAYAL_LINES.bold.seductive[2]`: ちっ…間に合わないわ
- `BETRAYAL_LINES.bold.seductive[3]`: 届かなかった…わね

### bold.delinquent[]

- `BETRAYAL_LINES.bold.delinquent[1]`: くそっ…！
- `BETRAYAL_LINES.bold.delinquent[2]`: ちっ…間に合わねえ
- `BETRAYAL_LINES.bold.delinquent[3]`: 届かなかった…

### bold.ojousama[]

- `BETRAYAL_LINES.bold.ojousama[1]`: くっ…！
- `BETRAYAL_LINES.bold.ojousama[2]`: …っ、間に合いませんわ
- `BETRAYAL_LINES.bold.ojousama[3]`: 届きませんでしたわ…

### bold.cool[]

- `BETRAYAL_LINES.bold.cool[1]`: …くっ
- `BETRAYAL_LINES.bold.cool[2]`: …間に合わない
- `BETRAYAL_LINES.bold.cool[3]`: …届かなかった

### bold.composed[]

- `BETRAYAL_LINES.bold.composed[1]`: …くっ、間に合わないか
- `BETRAYAL_LINES.bold.composed[2]`: …届かないな
- `BETRAYAL_LINES.bold.composed[3]`: 届かなかった…よ

### easygoing.normal[]

- `BETRAYAL_LINES.easygoing.normal[1]`: ありゃ…動けない…
- `BETRAYAL_LINES.easygoing.normal[2]`: うぅ…遠い…

### easygoing.polite[]

- `BETRAYAL_LINES.easygoing.polite[1]`: あちゃ…動けません…
- `BETRAYAL_LINES.easygoing.polite[2]`: うぅ…遠いです…
- `BETRAYAL_LINES.easygoing.polite[3]`: ……ごめんなさい

### easygoing.seductive[]

- `BETRAYAL_LINES.easygoing.seductive[1]`: あら…動けないわ…
- `BETRAYAL_LINES.easygoing.seductive[2]`: うぅ…遠い…わ
- `BETRAYAL_LINES.easygoing.seductive[3]`: ……ごめんね

### easygoing.delinquent[]

- `BETRAYAL_LINES.easygoing.delinquent[1]`: あちゃ…動けねえ…
- `BETRAYAL_LINES.easygoing.delinquent[2]`: うぅ…遠えな…
- `BETRAYAL_LINES.easygoing.delinquent[3]`: ……わりぃ

### easygoing.ojousama[]

- `BETRAYAL_LINES.easygoing.ojousama[1]`: あらあら…動けませんわ…
- `BETRAYAL_LINES.easygoing.ojousama[2]`: うぅ…遠いですわ…
- `BETRAYAL_LINES.easygoing.ojousama[3]`: ……ごめんあそばせ

### easygoing.cool[]

- `BETRAYAL_LINES.easygoing.cool[1]`: …あ、動けない
- `BETRAYAL_LINES.easygoing.cool[2]`: …遠い

### easygoing.composed[]

- `BETRAYAL_LINES.easygoing.composed[1]`: …ありゃ、動けないや
- `BETRAYAL_LINES.easygoing.composed[2]`: …うぅ、遠いなあ
- `BETRAYAL_LINES.easygoing.composed[3]`: ……ごめんね

### quiet.normal[]

- `BETRAYAL_LINES.quiet.normal[1]`: ……動けない
- `BETRAYAL_LINES.quiet.normal[2]`: ……間に合わない

### quiet.polite[]

- `BETRAYAL_LINES.quiet.polite[1]`: ……動けません
- `BETRAYAL_LINES.quiet.polite[2]`: ……届きません
- `BETRAYAL_LINES.quiet.polite[3]`: ……ごめんなさい

### quiet.seductive[]

- `BETRAYAL_LINES.quiet.seductive[1]`: ……動けない、わ
- `BETRAYAL_LINES.quiet.seductive[2]`: ……届かない
- `BETRAYAL_LINES.quiet.seductive[3]`: ……ごめん

### quiet.delinquent[]

- `BETRAYAL_LINES.quiet.delinquent[1]`: ……動けねえ
- `BETRAYAL_LINES.quiet.delinquent[2]`: ……届かねえ
- `BETRAYAL_LINES.quiet.delinquent[3]`: ……くそ

### quiet.ojousama[]

- `BETRAYAL_LINES.quiet.ojousama[1]`: ……動けませんわ
- `BETRAYAL_LINES.quiet.ojousama[2]`: ……届きませんわ
- `BETRAYAL_LINES.quiet.ojousama[3]`: ……申し訳ありません

### quiet.cool[]

- `BETRAYAL_LINES.quiet.cool[1]`: …………動けない
- `BETRAYAL_LINES.quiet.cool[2]`: …………届かない

### quiet.composed[]

- `BETRAYAL_LINES.quiet.composed[1]`: ……動けないよ
- `BETRAYAL_LINES.quiet.composed[2]`: ……届かないか
- `BETRAYAL_LINES.quiet.composed[3]`: ……ごめん

### shy.normal[]

- `BETRAYAL_LINES.shy.normal[1]`: う、動けない…
- `BETRAYAL_LINES.shy.normal[2]`: 間に合わない…！
- `BETRAYAL_LINES.shy.normal[3]`: …ごめん…

### shy.polite[]

- `BETRAYAL_LINES.shy.polite[1]`: う、動けません…
- `BETRAYAL_LINES.shy.polite[2]`: 間に合いません…！
- `BETRAYAL_LINES.shy.polite[3]`: …ごめんなさい…

### shy.seductive[]

- `BETRAYAL_LINES.shy.seductive[1]`: う、動けない…の…
- `BETRAYAL_LINES.shy.seductive[2]`: 間に合わない…っ
- `BETRAYAL_LINES.shy.seductive[3]`: …ごめんね…

### shy.delinquent[]

- `BETRAYAL_LINES.shy.delinquent[1]`: う、動けねえ…
- `BETRAYAL_LINES.shy.delinquent[2]`: 間に合わねえ…！
- `BETRAYAL_LINES.shy.delinquent[3]`: …わりぃ…

### shy.ojousama[]

- `BETRAYAL_LINES.shy.ojousama[1]`: う、動けませんわ…
- `BETRAYAL_LINES.shy.ojousama[2]`: 間に合いませんの…！
- `BETRAYAL_LINES.shy.ojousama[3]`: …ごめんなさい…

### shy.cool[]

- `BETRAYAL_LINES.shy.cool[1]`: …う、動けない
- `BETRAYAL_LINES.shy.cool[2]`: …間に合わない
- `BETRAYAL_LINES.shy.cool[3]`: …ごめん

### shy.composed[]

- `BETRAYAL_LINES.shy.composed[1]`: …う、動けないよ…
- `BETRAYAL_LINES.shy.composed[2]`: …間に合わない、か…
- `BETRAYAL_LINES.shy.composed[3]`: …ごめんね…

### emotional.normal[]

- `BETRAYAL_LINES.emotional.normal[1]`: 嘘…動けないっ
- `BETRAYAL_LINES.emotional.normal[2]`: 間に合わないっ…！
- `BETRAYAL_LINES.emotional.normal[3]`: ごめん…ごめんっ…！

### emotional.polite[]

- `BETRAYAL_LINES.emotional.polite[1]`: 嘘…動けませんっ
- `BETRAYAL_LINES.emotional.polite[2]`: 間に合いませんっ…！
- `BETRAYAL_LINES.emotional.polite[3]`: ごめんなさいっ…ごめんっ…！

### emotional.seductive[]

- `BETRAYAL_LINES.emotional.seductive[1]`: 嘘…動けないっ…！
- `BETRAYAL_LINES.emotional.seductive[2]`: 間に合わないっ…！
- `BETRAYAL_LINES.emotional.seductive[3]`: ごめん…ごめんねっ…！

### emotional.delinquent[]

- `BETRAYAL_LINES.emotional.delinquent[1]`: 嘘だろ…動けねえっ
- `BETRAYAL_LINES.emotional.delinquent[2]`: 間に合わねえっ…！
- `BETRAYAL_LINES.emotional.delinquent[3]`: わりぃ…わりぃっ…！

### emotional.ojousama[]

- `BETRAYAL_LINES.emotional.ojousama[1]`: 嘘…動けませんわっ
- `BETRAYAL_LINES.emotional.ojousama[2]`: 間に合いませんわっ…！
- `BETRAYAL_LINES.emotional.ojousama[3]`: ごめんなさいっ…！

### emotional.cool[]

- `BETRAYAL_LINES.emotional.cool[1]`: …っ、動けない
- `BETRAYAL_LINES.emotional.cool[2]`: …間に合わない
- `BETRAYAL_LINES.emotional.cool[3]`: …ごめん、っ

### emotional.composed[]

- `BETRAYAL_LINES.emotional.composed[1]`: …嘘、動けないよ…っ
- `BETRAYAL_LINES.emotional.composed[2]`: …間に合わない…っ
- `BETRAYAL_LINES.emotional.composed[3]`: …ごめん、ごめんね…

## `DOUBLE_TEAM_STRIKE_COMMENTARY_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: T1: ダブルチーム実況文 (カテゴリ別)。固定文「二人がかりの合体攻撃！」を置換するため。 / 命名規則 DOUBLE_TEAM_*_COMMENTARY_LINES でExcel化時に分離しやすく。
- 本数: 6

- `DOUBLE_TEAM_STRIKE_COMMENTARY_LINES[1]`: 二人の連打が止まらない！ これがタッグの醍醐味！
- `DOUBLE_TEAM_STRIKE_COMMENTARY_LINES[2]`: 連携の打撃ラッシュ！ 息がぴったり合っている！
- `DOUBLE_TEAM_STRIKE_COMMENTARY_LINES[3]`: 挟み撃ちの打撃コンビネーション！ 逃げ場がない！
- `DOUBLE_TEAM_STRIKE_COMMENTARY_LINES[4]`: 左右から浴びせる打撃！ 二人の攻撃が完全にシンクロしている！
- `DOUBLE_TEAM_STRIKE_COMMENTARY_LINES[5]`: ダブル打撃の嵐！ 相手は防ぎきれない！
- `DOUBLE_TEAM_STRIKE_COMMENTARY_LINES[6]`: コンビの拳とキックが次々に突き刺さる！

## `DOUBLE_TEAM_THROW_COMMENTARY_LINES`

- 出典: `src/tag-battle-lines.js`
- 本数: 6

- `DOUBLE_TEAM_THROW_COMMENTARY_LINES[1]`: 息の合ったダブルスロー！ これぞタッグの真骨頂！
- `DOUBLE_TEAM_THROW_COMMENTARY_LINES[2]`: 二人がかりの豪快な投げ技！ 会場が揺れる！
- `DOUBLE_TEAM_THROW_COMMENTARY_LINES[3]`: 連係の投げ技が完璧に決まった！
- `DOUBLE_TEAM_THROW_COMMENTARY_LINES[4]`: 受け渡し式の投げ技！ 相手は空中で何も出来ない！
- `DOUBLE_TEAM_THROW_COMMENTARY_LINES[5]`: ダブルパワーで投げ切った！ まるで振り子のようだ！
- `DOUBLE_TEAM_THROW_COMMENTARY_LINES[6]`: 二人の呼吸が合った一瞬の投げ！ 決まった！

## `DOUBLE_TEAM_SUB_COMMENTARY_LINES`

- 出典: `src/tag-battle-lines.js`
- 本数: 6

- `DOUBLE_TEAM_SUB_COMMENTARY_LINES[1]`: 二人がかりの極め技！ もう動けない！
- `DOUBLE_TEAM_SUB_COMMENTARY_LINES[2]`: 上下から襲いかかる関節技！ これは危険だ！
- `DOUBLE_TEAM_SUB_COMMENTARY_LINES[3]`: セットアップから一気に極めた！ 逃げ場がない！
- `DOUBLE_TEAM_SUB_COMMENTARY_LINES[4]`: ダブルロック！ 二人分の力で関節を締め上げる！
- `DOUBLE_TEAM_SUB_COMMENTARY_LINES[5]`: 連係の関節技！ 相手は苦悶の表情を浮かべる！
- `DOUBLE_TEAM_SUB_COMMENTARY_LINES[6]`: 二人で極めにいった！ これは返せない！

## `DOUBLE_TEAM_AERIAL_COMMENTARY_LINES`

- 出典: `src/tag-battle-lines.js`
- 本数: 6

- `DOUBLE_TEAM_AERIAL_COMMENTARY_LINES[1]`: 空中から二重の衝撃！ 圧巻のダブルフライ！
- `DOUBLE_TEAM_AERIAL_COMMENTARY_LINES[2]`: タワー式のダイビング技！ 会場が沸いている！
- `DOUBLE_TEAM_AERIAL_COMMENTARY_LINES[3]`: シンクロ空中技が炸裂！ これは止められない！
- `DOUBLE_TEAM_AERIAL_COMMENTARY_LINES[4]`: コンビの飛び技が連続で突き刺さる！
- `DOUBLE_TEAM_AERIAL_COMMENTARY_LINES[5]`: 空中戦の完璧な連携！ 二人のタイミングは完全一致！
- `DOUBLE_TEAM_AERIAL_COMMENTARY_LINES[6]`: 一人が踏み台、もう一人が飛ぶ！ タッグでしか出来ない技！

## `DOUBLE_TEAM_FINISH_COMMENTARY_LINES`

- 出典: `src/tag-battle-lines.js`
- 本数: 5

- `DOUBLE_TEAM_FINISH_COMMENTARY_LINES[1]`: これは決まった！ タッグの絆が生んだ一撃！
- `DOUBLE_TEAM_FINISH_COMMENTARY_LINES[2]`: フィニッシュだ！ 二人の信頼が織りなす必殺技！
- `DOUBLE_TEAM_FINISH_COMMENTARY_LINES[3]`: 息の合った一撃で仕留めた！ これがタッグの勝利！
- `DOUBLE_TEAM_FINISH_COMMENTARY_LINES[4]`: 完璧なダブルチームで決着！ 二人の強さが証明された！
- `DOUBLE_TEAM_FINISH_COMMENTARY_LINES[5]`: 連係の果ての必殺技！ 相手は立てない！

## `TAG_MATCH_WIN_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: T2: 試合完了時の勝利者セリフ (パートナー言及必須、{partner} プレースホルダ)。[personality][archetype][2本]
- 本数: 98

- `TAG_MATCH_WIN_LINES.normal.normal[1]`: {partner}、ありがとう。二人だから勝てたよ。
- `TAG_MATCH_WIN_LINES.normal.normal[2]`: やった…{partner}となら勝てるって、信じてた！
- `TAG_MATCH_WIN_LINES.normal.polite[1]`: {partner}さん、ありがとうございました。二人で掴んだ勝ちです。
- `TAG_MATCH_WIN_LINES.normal.polite[2]`: {partner}さんを信じてよかったです…ちゃんと、勝てました！
- `TAG_MATCH_WIN_LINES.normal.seductive[1]`: {partner}…ありがとう。二人でつかんだ勝ち、悪くないでしょ？
- `TAG_MATCH_WIN_LINES.normal.seductive[2]`: ふふ、{partner}となら負ける気がしないわ。
- `TAG_MATCH_WIN_LINES.normal.delinquent[1]`: {partner}、ありがとな！ 二人だから勝てたんだ！
- `TAG_MATCH_WIN_LINES.normal.delinquent[2]`: やったぜ{partner}！ あたしら、いいコンビだろ？
- `TAG_MATCH_WIN_LINES.normal.ojousama[1]`: {partner}さん、ありがとうございますわ。二人で掴んだ勝利ですのね。
- `TAG_MATCH_WIN_LINES.normal.ojousama[2]`: {partner}さんを信じておりまして、本当によかったですわ。
- `TAG_MATCH_WIN_LINES.normal.cool[1]`: …{partner}、ありがとう。二人で、勝った。
- `TAG_MATCH_WIN_LINES.normal.cool[2]`: …{partner}となら、勝てる。
- `TAG_MATCH_WIN_LINES.normal.composed[1]`: …{partner}、ありがとう。二人だから、勝てたね。
- `TAG_MATCH_WIN_LINES.normal.composed[2]`: …{partner}となら勝てる気がしてた。…当たったよ。
- `TAG_MATCH_WIN_LINES.earnest.normal[1]`: {partner}、あなたを信じてよかった。この勝ち、二人のものだよ。
- `TAG_MATCH_WIN_LINES.earnest.normal[2]`: {partner}が繋いでくれたから…最後まで諦めずに済んだ。
- `TAG_MATCH_WIN_LINES.earnest.polite[1]`: {partner}さんのおかげです。本当に、ありがとうございました。
- `TAG_MATCH_WIN_LINES.earnest.polite[2]`: {partner}さんが繋いでくれたバトン…無駄にせずに済みました。
- `TAG_MATCH_WIN_LINES.earnest.seductive[1]`: {partner}…あなたを信じてよかった。この勝ちは二人のものよ。
- `TAG_MATCH_WIN_LINES.earnest.seductive[2]`: {partner}、あなたが繋いでくれたから…最後まで折れずにいられたの。
- `TAG_MATCH_WIN_LINES.earnest.delinquent[1]`: {partner}、お前を信じてよかった。この勝ちは二人のもんだ。
- `TAG_MATCH_WIN_LINES.earnest.delinquent[2]`: {partner}が繋いでくれたから…あたし、最後まで踏ん張れた。
- `TAG_MATCH_WIN_LINES.earnest.ojousama[1]`: {partner}さんを信じておりまして、本当によかったですわ。
- `TAG_MATCH_WIN_LINES.earnest.ojousama[2]`: {partner}さんが繋いでくださったからこそ、掴めた勝利ですの。
- `TAG_MATCH_WIN_LINES.earnest.cool[1]`: …{partner}。信じて、よかった。この勝ちは、二人の。
- `TAG_MATCH_WIN_LINES.earnest.cool[2]`: …{partner}が繋いだ。だから、勝てた。
- `TAG_MATCH_WIN_LINES.earnest.composed[1]`: …{partner}、信じてよかったよ。この勝ちは、二人のものだね。
- `TAG_MATCH_WIN_LINES.earnest.composed[2]`: …{partner}が繋いでくれたから、最後まで立てた。ありがとう。
- `TAG_MATCH_WIN_LINES.bold.normal[1]`: やったな{partner}！ 二人揃えば、負ける気がしないよ！
- `TAG_MATCH_WIN_LINES.bold.normal[2]`: 見たか、これが{partner}と私のタッグの力だ！
- `TAG_MATCH_WIN_LINES.bold.polite[1]`: やりましたね{partner}さん！ 二人揃えば負けません！
- `TAG_MATCH_WIN_LINES.bold.polite[2]`: 見ましたか、これが{partner}さんと私のタッグです！
- `TAG_MATCH_WIN_LINES.bold.seductive[1]`: やったわね{partner}。二人揃えば、負ける気なんてしないわ。
- `TAG_MATCH_WIN_LINES.bold.seductive[2]`: 見た？ これが{partner}とわたしのタッグよ。
- `TAG_MATCH_WIN_LINES.bold.delinquent[1]`: やったな{partner}！ あたしらが組みゃ、負ける気がしねえ！
- `TAG_MATCH_WIN_LINES.bold.delinquent[2]`: 見たかよ！ {partner}とあたしのタッグ、最強だぜ！
- `TAG_MATCH_WIN_LINES.bold.ojousama[1]`: おやりになりましたわね{partner}さん！ 二人揃えば負けませんわ！
- `TAG_MATCH_WIN_LINES.bold.ojousama[2]`: ご覧になって？ {partner}さんとわたくしのタッグですのよ！
- `TAG_MATCH_WIN_LINES.bold.cool[1]`: …やったな、{partner}。二人なら、負けない。
- `TAG_MATCH_WIN_LINES.bold.cool[2]`: …見たか。{partner}と、あたしのタッグだ。
- `TAG_MATCH_WIN_LINES.bold.composed[1]`: …やったね、{partner}。二人なら、負ける気がしないよ。
- `TAG_MATCH_WIN_LINES.bold.composed[2]`: …見た？ {partner}と組めば、こんなもんさ。
- `TAG_MATCH_WIN_LINES.easygoing.normal[1]`: {partner}〜お疲れさま！ 私たち、息ぴったりだったね〜
- `TAG_MATCH_WIN_LINES.easygoing.normal[2]`: 勝っちゃった。{partner}と組むの、やっぱ楽しい〜
- `TAG_MATCH_WIN_LINES.easygoing.polite[1]`: {partner}さん、お疲れさまです♪ 息ぴったりでしたね〜
- `TAG_MATCH_WIN_LINES.easygoing.polite[2]`: 勝っちゃいました♪ {partner}さんと組めて、楽しかったです〜
- `TAG_MATCH_WIN_LINES.easygoing.seductive[1]`: {partner}〜お疲れさま♪ 息ぴったりだったでしょ？
- `TAG_MATCH_WIN_LINES.easygoing.seductive[2]`: 勝っちゃった♪ やっぱり{partner}と組むと、楽しいわ〜
- `TAG_MATCH_WIN_LINES.easygoing.delinquent[1]`: {partner}〜お疲れさん！ あたしら息ぴったりだったろ？
- `TAG_MATCH_WIN_LINES.easygoing.delinquent[2]`: 勝っちゃったぜ♪ {partner}と組むの、やっぱ楽しいわ〜
- `TAG_MATCH_WIN_LINES.easygoing.ojousama[1]`: {partner}さん、お疲れさまですわ♪ 息ぴったりでしたわね〜
- `TAG_MATCH_WIN_LINES.easygoing.ojousama[2]`: 勝ってしまいましたわ♪ {partner}さんと組むの、楽しいですの〜
- `TAG_MATCH_WIN_LINES.easygoing.cool[1]`: …{partner}、お疲れ。息、ぴったりだった。
- `TAG_MATCH_WIN_LINES.easygoing.cool[2]`: …勝った。{partner}と組むの、好き。
- `TAG_MATCH_WIN_LINES.easygoing.composed[1]`: …{partner}、お疲れさま。息、ぴったりだったね〜
- `TAG_MATCH_WIN_LINES.easygoing.composed[2]`: …勝っちゃった。{partner}と組むの、やっぱいいな〜
- `TAG_MATCH_WIN_LINES.quiet.normal[1]`: …{partner}、ありがとう。
- `TAG_MATCH_WIN_LINES.quiet.normal[2]`: …{partner}と、だから勝てた。
- `TAG_MATCH_WIN_LINES.quiet.polite[1]`: …{partner}さん、ありがとうございました。
- `TAG_MATCH_WIN_LINES.quiet.polite[2]`: …{partner}さんと、だから勝てました。
- `TAG_MATCH_WIN_LINES.quiet.seductive[1]`: …{partner}、ありがとう。
- `TAG_MATCH_WIN_LINES.quiet.seductive[2]`: …{partner}と、だから…ね。
- `TAG_MATCH_WIN_LINES.quiet.delinquent[1]`: …{partner}、恩に着る。
- `TAG_MATCH_WIN_LINES.quiet.delinquent[2]`: …{partner}と、だから勝てた。
- `TAG_MATCH_WIN_LINES.quiet.ojousama[1]`: …{partner}さん、感謝いたしますわ。
- `TAG_MATCH_WIN_LINES.quiet.ojousama[2]`: …{partner}さんと、だからですの。
- `TAG_MATCH_WIN_LINES.quiet.cool[1]`: ……{partner}、ありがとう。
- `TAG_MATCH_WIN_LINES.quiet.cool[2]`: ……{partner}と、だから。
- `TAG_MATCH_WIN_LINES.quiet.composed[1]`: …{partner}、ありがとう。二人だから、だね。
- `TAG_MATCH_WIN_LINES.quiet.composed[2]`: …{partner}と、だから勝てた。それだけだよ。
- `TAG_MATCH_WIN_LINES.shy.normal[1]`: {partner}…ほ、本当に…ありがとう…！
- `TAG_MATCH_WIN_LINES.shy.normal[2]`: わ、私…頑張れた…{partner}のおかげ…！
- `TAG_MATCH_WIN_LINES.shy.polite[1]`: {partner}さん…ほ、本当に…ありがとうございました…！
- `TAG_MATCH_WIN_LINES.shy.polite[2]`: わ、私…頑張れました…{partner}さんのおかげです…！
- `TAG_MATCH_WIN_LINES.shy.seductive[1]`: {partner}…う、嬉しい…二人で、勝てて…わ…
- `TAG_MATCH_WIN_LINES.shy.seductive[2]`: {partner}となら…だ、大丈夫って…信じてた、の…
- `TAG_MATCH_WIN_LINES.shy.delinquent[1]`: {partner}…あ、ありがとな…！ あたし、頑張れた…！
- `TAG_MATCH_WIN_LINES.shy.delinquent[2]`: ぜ、全部…{partner}のおかげ、だ…！
- `TAG_MATCH_WIN_LINES.shy.ojousama[1]`: {partner}さん…あ、ありがとうございますわ…！
- `TAG_MATCH_WIN_LINES.shy.ojousama[2]`: わ、私…頑張れましたわ…{partner}さんのおかげで…！
- `TAG_MATCH_WIN_LINES.shy.cool[1]`: …っ、{partner}…ありがとう…
- `TAG_MATCH_WIN_LINES.shy.cool[2]`: …わ、私、頑張れた…{partner}と…
- `TAG_MATCH_WIN_LINES.shy.composed[1]`: …{partner}、あ、ありがとう…二人で、勝てたね…
- `TAG_MATCH_WIN_LINES.shy.composed[2]`: …わ、私、頑張れたよ…{partner}のおかげ…
- `TAG_MATCH_WIN_LINES.emotional.normal[1]`: {partner}っ…！ ありがとう…二人で、勝ったよ…！
- `TAG_MATCH_WIN_LINES.emotional.normal[2]`: 絶対勝つって、約束したもんね…{partner}…っ！
- `TAG_MATCH_WIN_LINES.emotional.polite[1]`: {partner}さんっ…！ ありがとうございます…二人で、勝てました…！
- `TAG_MATCH_WIN_LINES.emotional.polite[2]`: 絶対勝つって約束…守れましたね、{partner}さん…っ！
- `TAG_MATCH_WIN_LINES.emotional.seductive[1]`: {partner}っ…！ やったわ…二人で、勝ったのよ…！
- `TAG_MATCH_WIN_LINES.emotional.seductive[2]`: 約束…守れたわね、{partner}…っ！
- `TAG_MATCH_WIN_LINES.emotional.delinquent[1]`: {partner}っ…！ やったぜ…二人で、勝ったんだ…！
- `TAG_MATCH_WIN_LINES.emotional.delinquent[2]`: 絶対勝つって言ったろ…！ な、{partner}…っ！
- `TAG_MATCH_WIN_LINES.emotional.ojousama[1]`: {partner}さんっ…！ やりましたわ…二人で、勝ったのですわ…！
- `TAG_MATCH_WIN_LINES.emotional.ojousama[2]`: 約束、守れましたわね…{partner}さん…っ！
- `TAG_MATCH_WIN_LINES.emotional.cool[1]`: …っ、{partner}…勝った。二人で。
- `TAG_MATCH_WIN_LINES.emotional.cool[2]`: …約束、守った。{partner}…っ。
- `TAG_MATCH_WIN_LINES.emotional.composed[1]`: …{partner}。二人で、勝ったよ。…約束、守れたね。
- `TAG_MATCH_WIN_LINES.emotional.composed[2]`: …言葉はいらない。{partner}、ありがとう。…それだけだ。

## `TAG_MATCH_LOSS_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: T2: 敗北者セリフ (パートナーへの詫び/責任/次への意欲)。[personality][archetype][2本]
- 本数: 98

- `TAG_MATCH_LOSS_LINES.normal.normal[1]`: {partner}…ごめん。私が決めきれてたら…
- `TAG_MATCH_LOSS_LINES.normal.normal[2]`: {partner}、悔しいね。次は絶対、勝とう。
- `TAG_MATCH_LOSS_LINES.normal.polite[1]`: {partner}さん…ごめんなさい。私が決めきれていれば…
- `TAG_MATCH_LOSS_LINES.normal.polite[2]`: {partner}さん、次は必ず勝ちましょう。
- `TAG_MATCH_LOSS_LINES.normal.seductive[1]`: {partner}…ごめんなさい。わたしが決めきれてたら…
- `TAG_MATCH_LOSS_LINES.normal.seductive[2]`: 悔しいわね、{partner}。次は絶対、勝つわよ。
- `TAG_MATCH_LOSS_LINES.normal.delinquent[1]`: {partner}…悪い。あたしが決めてりゃな…
- `TAG_MATCH_LOSS_LINES.normal.delinquent[2]`: {partner}、悔しいな。次は絶対、勝とうぜ。
- `TAG_MATCH_LOSS_LINES.normal.ojousama[1]`: {partner}さん…ごめんなさいまし。わたくしが決めきれていれば…
- `TAG_MATCH_LOSS_LINES.normal.ojousama[2]`: {partner}さん、次こそは必ず勝ちましょうね。
- `TAG_MATCH_LOSS_LINES.normal.cool[1]`: …{partner}、ごめん。決めきれ、なかった。
- `TAG_MATCH_LOSS_LINES.normal.cool[2]`: …{partner}、次は。勝つ。
- `TAG_MATCH_LOSS_LINES.normal.composed[1]`: …{partner}、ごめん。決めきれなかったね。
- `TAG_MATCH_LOSS_LINES.normal.composed[2]`: …悔しいけど、{partner}。次までに、詰めようか。
- `TAG_MATCH_LOSS_LINES.earnest.normal[1]`: {partner}…私の力不足だ。あなたを勝たせてあげられなかった…
- `TAG_MATCH_LOSS_LINES.earnest.normal[2]`: ここまで繋いでくれたのに…{partner}、ごめん。
- `TAG_MATCH_LOSS_LINES.earnest.polite[1]`: {partner}さん、申し訳ありませんでした…私の力不足です。
- `TAG_MATCH_LOSS_LINES.earnest.polite[2]`: {partner}さんを勝たせてあげられなくて…本当にすみません…！
- `TAG_MATCH_LOSS_LINES.earnest.seductive[1]`: {partner}…わたしの力不足よ。あなたを勝たせられなかった…
- `TAG_MATCH_LOSS_LINES.earnest.seductive[2]`: ここまで繋いでくれたのに…ごめんなさい、{partner}。
- `TAG_MATCH_LOSS_LINES.earnest.delinquent[1]`: {partner}…あたしの力不足だ。お前を勝たせてやれなかった…
- `TAG_MATCH_LOSS_LINES.earnest.delinquent[2]`: ここまで繋いでくれたのに…悪い、{partner}。
- `TAG_MATCH_LOSS_LINES.earnest.ojousama[1]`: {partner}さん、申し訳ございませんでした…わたくしの力不足ですわ。
- `TAG_MATCH_LOSS_LINES.earnest.ojousama[2]`: {partner}さんを勝たせてさしあげられず…本当にごめんなさい…！
- `TAG_MATCH_LOSS_LINES.earnest.cool[1]`: …{partner}、ごめん。あたしの、力不足。
- `TAG_MATCH_LOSS_LINES.earnest.cool[2]`: …繋いでくれたのに。{partner}、すまない。
- `TAG_MATCH_LOSS_LINES.earnest.composed[1]`: …{partner}、ごめん。あたしの力不足だ。
- `TAG_MATCH_LOSS_LINES.earnest.composed[2]`: …ここまで繋いでくれたのにな。{partner}、すまない。
- `TAG_MATCH_LOSS_LINES.bold.normal[1]`: くそっ…{partner}、悪い。私のミスだ。次は絶対だ。
- `TAG_MATCH_LOSS_LINES.bold.normal[2]`: 負けたままでいられるか…{partner}、次は倍返しだ！
- `TAG_MATCH_LOSS_LINES.bold.polite[1]`: {partner}さん、私のミスです。ですが…次は絶対に返します。
- `TAG_MATCH_LOSS_LINES.bold.polite[2]`: このままでは終われません。{partner}さん、次は倍返しです！
- `TAG_MATCH_LOSS_LINES.bold.seductive[1]`: わたしのミスよ、{partner}…悪いわね。でも次は絶対、返すわ。
- `TAG_MATCH_LOSS_LINES.bold.seductive[2]`: このままじゃ終わらせない。{partner}、次は倍返しよ。
- `TAG_MATCH_LOSS_LINES.bold.delinquent[1]`: くそっ…あたしのミスだ、{partner}。次は絶対、返してやる。
- `TAG_MATCH_LOSS_LINES.bold.delinquent[2]`: このまま終われるかよ…{partner}、次は倍返しだ！
- `TAG_MATCH_LOSS_LINES.bold.ojousama[1]`: わたくしのミスですわ、{partner}さん。ですが次は必ず返しますの。
- `TAG_MATCH_LOSS_LINES.bold.ojousama[2]`: このままでは終われませんわ。{partner}さん、次は倍返しですわ！
- `TAG_MATCH_LOSS_LINES.bold.cool[1]`: …あたしのミスだ、{partner}。次は、返す。
- `TAG_MATCH_LOSS_LINES.bold.cool[2]`: …このまま終わらない。{partner}、倍返しだ。
- `TAG_MATCH_LOSS_LINES.bold.composed[1]`: …あたしのミスだ、{partner}。でも、次はこうはいかないよ。
- `TAG_MATCH_LOSS_LINES.bold.composed[2]`: …このまま終わる気はない。{partner}、次は返すから。
- `TAG_MATCH_LOSS_LINES.easygoing.normal[1]`: {partner}〜ごめんね…私、決められちゃった…
- `TAG_MATCH_LOSS_LINES.easygoing.normal[2]`: あちゃ〜負けちゃった…でも{partner}、次は頑張るね。
- `TAG_MATCH_LOSS_LINES.easygoing.polite[1]`: {partner}さん…ごめんなさい、私、決められちゃいました…
- `TAG_MATCH_LOSS_LINES.easygoing.polite[2]`: あちゃ〜負けちゃいましたね…次は頑張ります、{partner}さん。
- `TAG_MATCH_LOSS_LINES.easygoing.seductive[1]`: {partner}〜ごめんね…わたし、決められちゃった…
- `TAG_MATCH_LOSS_LINES.easygoing.seductive[2]`: あーあ、負けちゃった…でも{partner}、次はやるわよ。
- `TAG_MATCH_LOSS_LINES.easygoing.delinquent[1]`: {partner}〜わりぃ…あたし、決められちった…
- `TAG_MATCH_LOSS_LINES.easygoing.delinquent[2]`: あちゃ〜負けたか…でも{partner}、次は頑張るぜ。
- `TAG_MATCH_LOSS_LINES.easygoing.ojousama[1]`: {partner}さん…ごめんなさい、決められてしまいましたわ…
- `TAG_MATCH_LOSS_LINES.easygoing.ojousama[2]`: あらら、負けてしまいましたわ…でも次は頑張りますの、{partner}さん。
- `TAG_MATCH_LOSS_LINES.easygoing.cool[1]`: …{partner}、ごめん。決められ、ちゃった。
- `TAG_MATCH_LOSS_LINES.easygoing.cool[2]`: …負けちゃった。{partner}、次は。
- `TAG_MATCH_LOSS_LINES.easygoing.composed[1]`: …{partner}、ごめんね。決められちゃった…
- `TAG_MATCH_LOSS_LINES.easygoing.composed[2]`: …あ〜あ、負けちゃった。まあ、次があるよ、{partner}。
- `TAG_MATCH_LOSS_LINES.quiet.normal[1]`: …{partner}、ごめん。
- `TAG_MATCH_LOSS_LINES.quiet.normal[2]`: …悔しい。{partner}にも、申し訳ない。
- `TAG_MATCH_LOSS_LINES.quiet.polite[1]`: …{partner}さん、ごめんなさい。
- `TAG_MATCH_LOSS_LINES.quiet.polite[2]`: …申し訳、ありませんでした。{partner}さん。
- `TAG_MATCH_LOSS_LINES.quiet.seductive[1]`: …{partner}、ごめんなさい。
- `TAG_MATCH_LOSS_LINES.quiet.seductive[2]`: …悔しい。{partner}にも…ね。
- `TAG_MATCH_LOSS_LINES.quiet.delinquent[1]`: …{partner}、悪い。
- `TAG_MATCH_LOSS_LINES.quiet.delinquent[2]`: …悔しい。{partner}にも、詫びる。
- `TAG_MATCH_LOSS_LINES.quiet.ojousama[1]`: …{partner}さん、ごめんなさい。
- `TAG_MATCH_LOSS_LINES.quiet.ojousama[2]`: …申し訳ありませんわ。{partner}さん。
- `TAG_MATCH_LOSS_LINES.quiet.cool[1]`: ……{partner}、ごめん。
- `TAG_MATCH_LOSS_LINES.quiet.cool[2]`: ……悔しい。{partner}にも。
- `TAG_MATCH_LOSS_LINES.quiet.composed[1]`: …{partner}、ごめん。
- `TAG_MATCH_LOSS_LINES.quiet.composed[2]`: …悔しいな。{partner}にも、悪い。
- `TAG_MATCH_LOSS_LINES.shy.normal[1]`: {partner}…ご、ごめん…私のせいで…
- `TAG_MATCH_LOSS_LINES.shy.normal[2]`: つ、次は…絶対、{partner}を勝たせる…！
- `TAG_MATCH_LOSS_LINES.shy.polite[1]`: {partner}さん…ご、ごめんなさい…私のせいで…
- `TAG_MATCH_LOSS_LINES.shy.polite[2]`: つ、次は…絶対…{partner}さんを勝たせます…！
- `TAG_MATCH_LOSS_LINES.shy.seductive[1]`: {partner}…ご、ごめんね…わたしのせいで…
- `TAG_MATCH_LOSS_LINES.shy.seductive[2]`: つ、次は…絶対…{partner}を、勝たせるわ…！
- `TAG_MATCH_LOSS_LINES.shy.delinquent[1]`: {partner}…わ、悪い…あたしのせいで…
- `TAG_MATCH_LOSS_LINES.shy.delinquent[2]`: つ、次は…絶対…{partner}を勝たせる…！
- `TAG_MATCH_LOSS_LINES.shy.ojousama[1]`: {partner}さん…ご、ごめんなさいまし…わたくしのせいで…
- `TAG_MATCH_LOSS_LINES.shy.ojousama[2]`: つ、次は…必ず…{partner}さんを勝たせますわ…！
- `TAG_MATCH_LOSS_LINES.shy.cool[1]`: …っ、{partner}…ごめん…私の、せいで…
- `TAG_MATCH_LOSS_LINES.shy.cool[2]`: …つ、次は…{partner}を、勝たせる…
- `TAG_MATCH_LOSS_LINES.shy.composed[1]`: …{partner}、ご、ごめん…私のせいで…
- `TAG_MATCH_LOSS_LINES.shy.composed[2]`: …つ、次は、ちゃんと…{partner}を勝たせるよ…
- `TAG_MATCH_LOSS_LINES.emotional.normal[1]`: {partner}っ…ごめんっ…ごめんねっ…！
- `TAG_MATCH_LOSS_LINES.emotional.normal[2]`: 次は絶対…絶対勝つからっ…！ {partner}…！
- `TAG_MATCH_LOSS_LINES.emotional.polite[1]`: {partner}さんっ…ごめんなさいっ…私のせいでっ…！
- `TAG_MATCH_LOSS_LINES.emotional.polite[2]`: 次は絶対…勝ちますからっ…！ {partner}さん…！
- `TAG_MATCH_LOSS_LINES.emotional.seductive[1]`: {partner}っ…ごめんっ…わたしのせいでっ…！
- `TAG_MATCH_LOSS_LINES.emotional.seductive[2]`: 次は絶対、勝つわっ…！ {partner}…！
- `TAG_MATCH_LOSS_LINES.emotional.delinquent[1]`: {partner}っ…わりぃっ…あたしのせいでっ…！
- `TAG_MATCH_LOSS_LINES.emotional.delinquent[2]`: 次は絶対、勝つからっ…！ な、{partner}…！
- `TAG_MATCH_LOSS_LINES.emotional.ojousama[1]`: {partner}さんっ…ごめんなさいっ…わたくしのせいでっ…！
- `TAG_MATCH_LOSS_LINES.emotional.ojousama[2]`: 次は絶対、勝ちますわっ…！ {partner}さん…！
- `TAG_MATCH_LOSS_LINES.emotional.cool[1]`: …っ、{partner}…ごめん。
- `TAG_MATCH_LOSS_LINES.emotional.cool[2]`: …次は、勝つ。絶対。{partner}…っ。
- `TAG_MATCH_LOSS_LINES.emotional.composed[1]`: …{partner}、悪い。あたしが弱かった。…それだけだ。
- `TAG_MATCH_LOSS_LINES.emotional.composed[2]`: …次は、こうはいかない。{partner}、もう一回だけ付き合ってくれ。

## `TAG_MATCH_COMMENTARY_WIN_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: T2: 実況の締め (勝者名 + 決め技 + タッグ関連言及)。{winner} {partner} {move} プレースホルダ。
- 本数: 7

- `TAG_MATCH_COMMENTARY_WIN_LINES[1]`: {winner}組、見事なコンビネーションで勝利を掴んだ！
- `TAG_MATCH_COMMENTARY_WIN_LINES[2]`: 息の合ったタッグワークが勝負を決めた！ {winner}&{partner}、完勝！
- `TAG_MATCH_COMMENTARY_WIN_LINES[3]`: これがタッグの強さだ！ {winner}組、見事な勝利！
- `TAG_MATCH_COMMENTARY_WIN_LINES[4]`: {winner}と{partner}の信頼が生んだ一撃！ 歴史に残る名勝負だ！
- `TAG_MATCH_COMMENTARY_WIN_LINES[5]`: タッグの醍醐味を見せつけた！ {winner}組、堂々の勝利！
- `TAG_MATCH_COMMENTARY_WIN_LINES[6]`: 二人の絆が勝敗を分けた！ {winner}組の勝利！
- `TAG_MATCH_COMMENTARY_WIN_LINES[7]`: {move}で決着！ {winner}&{partner}のコンビが頂点に立った！
