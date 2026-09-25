# タッグマッチ

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `HOT_TAG_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: tag-battle セリフ類 — タッグ固有のみ / DAMAGE_SERIF_LINES / DAMAGE_VOICE_LINES / pickDamageLine は battle-lines.js に共通化済み / タッグ専用: ホットタグ時のカットイン [archetype][personality][3本]
- 本数: 147

### standard.normal[]

- `HOT_TAG_LINES.standard.normal[1]`: 任せて！
- `HOT_TAG_LINES.standard.normal[2]`: 交代だよ！
- `HOT_TAG_LINES.standard.normal[3]`: ここからは私が行く！

### standard.earnest[]

- `HOT_TAG_LINES.standard.earnest[1]`: お疲れ様、あとは任せて！
- `HOT_TAG_LINES.standard.earnest[2]`: よく守った、交代だ！
- `HOT_TAG_LINES.standard.earnest[3]`: ここからは私が背負う！

### standard.bold[]

- `HOT_TAG_LINES.standard.bold[1]`: 待ってました！
- `HOT_TAG_LINES.standard.bold[2]`: 私の番だ！
- `HOT_TAG_LINES.standard.bold[3]`: ようやく回ってきたな！

### standard.easygoing[]

- `HOT_TAG_LINES.standard.easygoing[1]`: はーい、交代〜！
- `HOT_TAG_LINES.standard.easygoing[2]`: お疲れさま♪ 私いくね
- `HOT_TAG_LINES.standard.easygoing[3]`: ここからは私の出番♪

### standard.quiet[]

- `HOT_TAG_LINES.standard.quiet[1]`: …交代
- `HOT_TAG_LINES.standard.quiet[2]`: …来た、私が
- `HOT_TAG_LINES.standard.quiet[3]`: …任せて

### standard.shy[]

- `HOT_TAG_LINES.standard.shy[1]`: が、頑張ります…！
- `HOT_TAG_LINES.standard.shy[2]`: こ、交代…します…
- `HOT_TAG_LINES.standard.shy[3]`: い、行ってきます…！

### standard.emotional[]

- `HOT_TAG_LINES.standard.emotional[1]`: 絶対…勝つ…！
- `HOT_TAG_LINES.standard.emotional[2]`: お疲れ…ここからは私が…！
- `HOT_TAG_LINES.standard.emotional[3]`: 任せて…絶対に…！

### polite.normal[]

- `HOT_TAG_LINES.polite.normal[1]`: お任せくださいっ！
- `HOT_TAG_LINES.polite.normal[2]`: 交代しますっ！
- `HOT_TAG_LINES.polite.normal[3]`: ここからは私が行きます！

### polite.earnest[]

- `HOT_TAG_LINES.polite.earnest[1]`: お疲れ様です、任せてくださいっ！
- `HOT_TAG_LINES.polite.earnest[2]`: よく耐えました、交代です！
- `HOT_TAG_LINES.polite.earnest[3]`: ここからは私が引き継ぎます！

### polite.bold[]

- `HOT_TAG_LINES.polite.bold[1]`: 待っていましたっ！
- `HOT_TAG_LINES.polite.bold[2]`: 私の番ですっ！
- `HOT_TAG_LINES.polite.bold[3]`: ようやく回ってきましたね！

### polite.easygoing[]

- `HOT_TAG_LINES.polite.easygoing[1]`: はーい、交代しますね〜！
- `HOT_TAG_LINES.polite.easygoing[2]`: お疲れさまです♪ いきますね
- `HOT_TAG_LINES.polite.easygoing[3]`: ここからは私の出番です♪

### polite.quiet[]

- `HOT_TAG_LINES.polite.quiet[1]`: …交代します
- `HOT_TAG_LINES.polite.quiet[2]`: …来ました
- `HOT_TAG_LINES.polite.quiet[3]`: …任せてください

### polite.shy[]

- `HOT_TAG_LINES.polite.shy[1]`: が、頑張りますっ…！
- `HOT_TAG_LINES.polite.shy[2]`: こ、交代します…っ
- `HOT_TAG_LINES.polite.shy[3]`: い、行ってきますっ…！

### polite.emotional[]

- `HOT_TAG_LINES.polite.emotional[1]`: 絶対…勝ちますっ…！
- `HOT_TAG_LINES.polite.emotional[2]`: お疲れさまっ…あとは私が…！
- `HOT_TAG_LINES.polite.emotional[3]`: 任せてくださいっ…絶対に…！

### seductive.normal[]

- `HOT_TAG_LINES.seductive.normal[1]`: 任せて…いいわよ
- `HOT_TAG_LINES.seductive.normal[2]`: 交代よ
- `HOT_TAG_LINES.seductive.normal[3]`: ここからは私の番ね

### seductive.earnest[]

- `HOT_TAG_LINES.seductive.earnest[1]`: お疲れさま…あとは任せて
- `HOT_TAG_LINES.seductive.earnest[2]`: よく耐えたわね…交代よ
- `HOT_TAG_LINES.seductive.earnest[3]`: ここからは私が背負うわ

### seductive.bold[]

- `HOT_TAG_LINES.seductive.bold[1]`: 待ちくたびれたわ
- `HOT_TAG_LINES.seductive.bold[2]`: 私の番よ
- `HOT_TAG_LINES.seductive.bold[3]`: ようやく回ってきたわね

### seductive.easygoing[]

- `HOT_TAG_LINES.seductive.easygoing[1]`: はぁい、交代ね♪
- `HOT_TAG_LINES.seductive.easygoing[2]`: お疲れさま…あとは任せて♪
- `HOT_TAG_LINES.seductive.easygoing[3]`: ここからは私の時間よ♪

### seductive.quiet[]

- `HOT_TAG_LINES.seductive.quiet[1]`: …交代、よ
- `HOT_TAG_LINES.seductive.quiet[2]`: …来たわ
- `HOT_TAG_LINES.seductive.quiet[3]`: …任せて、いい

### seductive.shy[]

- `HOT_TAG_LINES.seductive.shy[1]`: が、頑張る…から…
- `HOT_TAG_LINES.seductive.shy[2]`: こ、交代…ね…?
- `HOT_TAG_LINES.seductive.shy[3]`: い、行ってくる…わ…

### seductive.emotional[]

- `HOT_TAG_LINES.seductive.emotional[1]`: 絶対…勝つわ…！
- `HOT_TAG_LINES.seductive.emotional[2]`: お疲れさま…あとは私が…！
- `HOT_TAG_LINES.seductive.emotional[3]`: 任せて…絶対に、よ…！

### delinquent.normal[]

- `HOT_TAG_LINES.delinquent.normal[1]`: 任せときな！
- `HOT_TAG_LINES.delinquent.normal[2]`: 交代だ！
- `HOT_TAG_LINES.delinquent.normal[3]`: ここからは私が行く！

### delinquent.earnest[]

- `HOT_TAG_LINES.delinquent.earnest[1]`: お疲れさん、あとは任せろ！
- `HOT_TAG_LINES.delinquent.earnest[2]`: よく守ったな、交代だ！
- `HOT_TAG_LINES.delinquent.earnest[3]`: ここからはあたしが背負うぜ！

### delinquent.bold[]

- `HOT_TAG_LINES.delinquent.bold[1]`: 待ってたぜ！
- `HOT_TAG_LINES.delinquent.bold[2]`: 私の番だ！
- `HOT_TAG_LINES.delinquent.bold[3]`: ようやく回ってきやがった！

### delinquent.easygoing[]

- `HOT_TAG_LINES.delinquent.easygoing[1]`: はいはい、交代な〜！
- `HOT_TAG_LINES.delinquent.easygoing[2]`: お疲れさん♪ 私いくぜ
- `HOT_TAG_LINES.delinquent.easygoing[3]`: ここからは私の出番だ♪

### delinquent.quiet[]

- `HOT_TAG_LINES.delinquent.quiet[1]`: …交代だ
- `HOT_TAG_LINES.delinquent.quiet[2]`: …来たぜ
- `HOT_TAG_LINES.delinquent.quiet[3]`: …任せときな

### delinquent.shy[]

- `HOT_TAG_LINES.delinquent.shy[1]`: が、頑張るし…！
- `HOT_TAG_LINES.delinquent.shy[2]`: こ、交代…だ…
- `HOT_TAG_LINES.delinquent.shy[3]`: い、行ってくる…ぜ…

### delinquent.emotional[]

- `HOT_TAG_LINES.delinquent.emotional[1]`: 絶対勝つ…！
- `HOT_TAG_LINES.delinquent.emotional[2]`: お疲れ…あとはあたしが…！
- `HOT_TAG_LINES.delinquent.emotional[3]`: 任せろ…絶対だ…！

### ojousama.normal[]

- `HOT_TAG_LINES.ojousama.normal[1]`: お任せなさいませ！
- `HOT_TAG_LINES.ojousama.normal[2]`: 交代いたしますわ！
- `HOT_TAG_LINES.ojousama.normal[3]`: ここからはわたくしが！

### ojousama.earnest[]

- `HOT_TAG_LINES.ojousama.earnest[1]`: お疲れさまですわ、お任せを！
- `HOT_TAG_LINES.ojousama.earnest[2]`: よく耐えました、交代ですわ！
- `HOT_TAG_LINES.ojousama.earnest[3]`: ここからはわたくしが引き継ぎますわ！

### ojousama.bold[]

- `HOT_TAG_LINES.ojousama.bold[1]`: お待ちかねですわ！
- `HOT_TAG_LINES.ojousama.bold[2]`: わたくしの番ですわ！
- `HOT_TAG_LINES.ojousama.bold[3]`: ようやく回ってまいりましたわ！

### ojousama.easygoing[]

- `HOT_TAG_LINES.ojousama.easygoing[1]`: はぁい、交代ですわ〜♪
- `HOT_TAG_LINES.ojousama.easygoing[2]`: お疲れさま♪ 参りますわ
- `HOT_TAG_LINES.ojousama.easygoing[3]`: ここからはわたくしの出番ですわ♪

### ojousama.quiet[]

- `HOT_TAG_LINES.ojousama.quiet[1]`: …交代ですわ
- `HOT_TAG_LINES.ojousama.quiet[2]`: …参りましたわ
- `HOT_TAG_LINES.ojousama.quiet[3]`: …お任せを

### ojousama.shy[]

- `HOT_TAG_LINES.ojousama.shy[1]`: が、頑張りますわ…！
- `HOT_TAG_LINES.ojousama.shy[2]`: こ、交代…ですわ…
- `HOT_TAG_LINES.ojousama.shy[3]`: い、行ってまいりますわ…！

### ojousama.emotional[]

- `HOT_TAG_LINES.ojousama.emotional[1]`: 絶対…勝ちますわ…！
- `HOT_TAG_LINES.ojousama.emotional[2]`: お疲れさま…あとはわたくしが…！
- `HOT_TAG_LINES.ojousama.emotional[3]`: お任せを…絶対に…！

### cool.normal[]

- `HOT_TAG_LINES.cool.normal[1]`: …任せて
- `HOT_TAG_LINES.cool.normal[2]`: …交代
- `HOT_TAG_LINES.cool.normal[3]`: …ここから、行く

### cool.earnest[]

- `HOT_TAG_LINES.cool.earnest[1]`: …お疲れ、任せて
- `HOT_TAG_LINES.cool.earnest[2]`: …よく守った
- `HOT_TAG_LINES.cool.earnest[3]`: …ここから、背負う

### cool.bold[]

- `HOT_TAG_LINES.cool.bold[1]`: …待ってた
- `HOT_TAG_LINES.cool.bold[2]`: …あたしの番
- `HOT_TAG_LINES.cool.bold[3]`: …ようやく、だ

### cool.easygoing[]

- `HOT_TAG_LINES.cool.easygoing[1]`: …はい、交代
- `HOT_TAG_LINES.cool.easygoing[2]`: …お疲れ、いく
- `HOT_TAG_LINES.cool.easygoing[3]`: …私の出番

### cool.quiet[]

- `HOT_TAG_LINES.cool.quiet[1]`: ……交代
- `HOT_TAG_LINES.cool.quiet[2]`: ……代わる
- `HOT_TAG_LINES.cool.quiet[3]`: ……任せろ

### cool.shy[]

- `HOT_TAG_LINES.cool.shy[1]`: …っ、交代
- `HOT_TAG_LINES.cool.shy[2]`: …こ、ここから
- `HOT_TAG_LINES.cool.shy[3]`: …い、行く

### cool.emotional[]

- `HOT_TAG_LINES.cool.emotional[1]`: …っ、絶対勝つ
- `HOT_TAG_LINES.cool.emotional[2]`: …あとは、私が
- `HOT_TAG_LINES.cool.emotional[3]`: …任せろ、絶対

### composed.normal[]

- `HOT_TAG_LINES.composed.normal[1]`: …任せて、いいよ
- `HOT_TAG_LINES.composed.normal[2]`: …交代、だね
- `HOT_TAG_LINES.composed.normal[3]`: …ここからは私が行くよ

### composed.earnest[]

- `HOT_TAG_LINES.composed.earnest[1]`: …お疲れさま、あとは任せて
- `HOT_TAG_LINES.composed.earnest[2]`: …よく耐えたね、交代だよ
- `HOT_TAG_LINES.composed.earnest[3]`: …ここからは私が背負うよ

### composed.bold[]

- `HOT_TAG_LINES.composed.bold[1]`: …待ってたよ
- `HOT_TAG_LINES.composed.bold[2]`: …私の番だね
- `HOT_TAG_LINES.composed.bold[3]`: …ようやく回ってきた、かな

### composed.easygoing[]

- `HOT_TAG_LINES.composed.easygoing[1]`: …はーい、交代〜
- `HOT_TAG_LINES.composed.easygoing[2]`: …お疲れさま、いくね
- `HOT_TAG_LINES.composed.easygoing[3]`: …ここからは私の番かな♪

### composed.quiet[]

- `HOT_TAG_LINES.composed.quiet[1]`: …交代、だよ
- `HOT_TAG_LINES.composed.quiet[2]`: …来たよ
- `HOT_TAG_LINES.composed.quiet[3]`: …任せて、いい

### composed.shy[]

- `HOT_TAG_LINES.composed.shy[1]`: …が、頑張る、よ…
- `HOT_TAG_LINES.composed.shy[2]`: …こ、交代…だね…
- `HOT_TAG_LINES.composed.shy[3]`: …い、行ってくるね…

### composed.emotional[]

- `HOT_TAG_LINES.composed.emotional[1]`: …絶対に、勝つよ…！
- `HOT_TAG_LINES.composed.emotional[2]`: …お疲れさま…あとは私が…
- `HOT_TAG_LINES.composed.emotional[3]`: …任せて、絶対に…

## `DOUBLE_TEAM_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: タッグ専用: ダブルチーム時のカットイン [archetype][personality][3本]
- 本数: 147

### standard.normal[]

- `DOUBLE_TEAM_LINES.standard.normal[1]`: 合わせて！
- `DOUBLE_TEAM_LINES.standard.normal[2]`: いくよ、二人で！
- `DOUBLE_TEAM_LINES.standard.normal[3]`: 息を合わせよう！

### standard.earnest[]

- `DOUBLE_TEAM_LINES.standard.earnest[1]`: 一緒に…！
- `DOUBLE_TEAM_LINES.standard.earnest[2]`: タイミング合わせて！
- `DOUBLE_TEAM_LINES.standard.earnest[3]`: 二人で決めよう！

### standard.bold[]

- `DOUBLE_TEAM_LINES.standard.bold[1]`: 二人で決める！
- `DOUBLE_TEAM_LINES.standard.bold[2]`: 合わせて、行くぞ！
- `DOUBLE_TEAM_LINES.standard.bold[3]`: 逃がさない、そっち頼む！

### standard.easygoing[]

- `DOUBLE_TEAM_LINES.standard.easygoing[1]`: 一緒にやろ〜！
- `DOUBLE_TEAM_LINES.standard.easygoing[2]`: 合わせて合わせて♪
- `DOUBLE_TEAM_LINES.standard.easygoing[3]`: せーのっ♪

### standard.quiet[]

- `DOUBLE_TEAM_LINES.standard.quiet[1]`: …合わせる
- `DOUBLE_TEAM_LINES.standard.quiet[2]`: …せーの
- `DOUBLE_TEAM_LINES.standard.quiet[3]`: …いこう

### standard.shy[]

- `DOUBLE_TEAM_LINES.standard.shy[1]`: あ、合わせます…！
- `DOUBLE_TEAM_LINES.standard.shy[2]`: に、二人で…！
- `DOUBLE_TEAM_LINES.standard.shy[3]`: い、いっしょに…！

### standard.emotional[]

- `DOUBLE_TEAM_LINES.standard.emotional[1]`: 二人でっ…！
- `DOUBLE_TEAM_LINES.standard.emotional[2]`: 合わせるよ…っ！
- `DOUBLE_TEAM_LINES.standard.emotional[3]`: 絶対決めるっ…！

### polite.normal[]

- `DOUBLE_TEAM_LINES.polite.normal[1]`: 合わせてくださいっ！
- `DOUBLE_TEAM_LINES.polite.normal[2]`: いきますよ、二人で！
- `DOUBLE_TEAM_LINES.polite.normal[3]`: 息を合わせましょう！

### polite.earnest[]

- `DOUBLE_TEAM_LINES.polite.earnest[1]`: 一緒にいきますっ！
- `DOUBLE_TEAM_LINES.polite.earnest[2]`: タイミング合わせてください！
- `DOUBLE_TEAM_LINES.polite.earnest[3]`: 二人で決めましょう！

### polite.bold[]

- `DOUBLE_TEAM_LINES.polite.bold[1]`: 二人で決めますっ！
- `DOUBLE_TEAM_LINES.polite.bold[2]`: 合わせてください、いきますよ！
- `DOUBLE_TEAM_LINES.polite.bold[3]`: 逃がしません、そちら頼みますっ！

### polite.easygoing[]

- `DOUBLE_TEAM_LINES.polite.easygoing[1]`: 一緒にやりましょ〜！
- `DOUBLE_TEAM_LINES.polite.easygoing[2]`: 合わせてくださいね♪
- `DOUBLE_TEAM_LINES.polite.easygoing[3]`: せーのっ、です♪

### polite.quiet[]

- `DOUBLE_TEAM_LINES.polite.quiet[1]`: …合わせます
- `DOUBLE_TEAM_LINES.polite.quiet[2]`: …せーの、です
- `DOUBLE_TEAM_LINES.polite.quiet[3]`: …いきましょう

### polite.shy[]

- `DOUBLE_TEAM_LINES.polite.shy[1]`: あ、合わせますっ…！
- `DOUBLE_TEAM_LINES.polite.shy[2]`: に、二人で…お願いします…！
- `DOUBLE_TEAM_LINES.polite.shy[3]`: い、いっしょにっ…！

### polite.emotional[]

- `DOUBLE_TEAM_LINES.polite.emotional[1]`: 二人でっ…いきますっ！
- `DOUBLE_TEAM_LINES.polite.emotional[2]`: 合わせますっ…！
- `DOUBLE_TEAM_LINES.polite.emotional[3]`: 絶対決めますっ…！

### seductive.normal[]

- `DOUBLE_TEAM_LINES.seductive.normal[1]`: 合わせて…いくわよ
- `DOUBLE_TEAM_LINES.seductive.normal[2]`: 二人で、いきましょ
- `DOUBLE_TEAM_LINES.seductive.normal[3]`: 息を合わせて…ね

### seductive.earnest[]

- `DOUBLE_TEAM_LINES.seductive.earnest[1]`: 一緒に…いくわよ
- `DOUBLE_TEAM_LINES.seductive.earnest[2]`: タイミング、合わせて
- `DOUBLE_TEAM_LINES.seductive.earnest[3]`: 二人で決めるわ

### seductive.bold[]

- `DOUBLE_TEAM_LINES.seductive.bold[1]`: 二人で決めるわよ
- `DOUBLE_TEAM_LINES.seductive.bold[2]`: 合わせなさい
- `DOUBLE_TEAM_LINES.seductive.bold[3]`: 逃がさないわ、そっちは任せたわ

### seductive.easygoing[]

- `DOUBLE_TEAM_LINES.seductive.easygoing[1]`: 一緒にいきましょ♪
- `DOUBLE_TEAM_LINES.seductive.easygoing[2]`: 合わせて…ね♪
- `DOUBLE_TEAM_LINES.seductive.easygoing[3]`: せーの…よ♪

### seductive.quiet[]

- `DOUBLE_TEAM_LINES.seductive.quiet[1]`: …合わせて、よ
- `DOUBLE_TEAM_LINES.seductive.quiet[2]`: …せーの…ね
- `DOUBLE_TEAM_LINES.seductive.quiet[3]`: …いくわ

### seductive.shy[]

- `DOUBLE_TEAM_LINES.seductive.shy[1]`: あ、合わせて…ね…?
- `DOUBLE_TEAM_LINES.seductive.shy[2]`: ふ、二人で…いこ…
- `DOUBLE_TEAM_LINES.seductive.shy[3]`: い、いっしょに…よ…

### seductive.emotional[]

- `DOUBLE_TEAM_LINES.seductive.emotional[1]`: 二人で…決めるわよっ…！
- `DOUBLE_TEAM_LINES.seductive.emotional[2]`: 合わせて…っ！
- `DOUBLE_TEAM_LINES.seductive.emotional[3]`: 絶対決めるわ…っ！

### delinquent.normal[]

- `DOUBLE_TEAM_LINES.delinquent.normal[1]`: 合わせろ！
- `DOUBLE_TEAM_LINES.delinquent.normal[2]`: いくぞ、二人で！
- `DOUBLE_TEAM_LINES.delinquent.normal[3]`: 息合わせな！

### delinquent.earnest[]

- `DOUBLE_TEAM_LINES.delinquent.earnest[1]`: 一緒にいくぞ！
- `DOUBLE_TEAM_LINES.delinquent.earnest[2]`: タイミング合わせろ！
- `DOUBLE_TEAM_LINES.delinquent.earnest[3]`: 二人で決めるぜ！

### delinquent.bold[]

- `DOUBLE_TEAM_LINES.delinquent.bold[1]`: 二人で決めるぞ！
- `DOUBLE_TEAM_LINES.delinquent.bold[2]`: 合わせろ、相棒！
- `DOUBLE_TEAM_LINES.delinquent.bold[3]`: 逃がさねえ、そっち頼むぜ！

### delinquent.easygoing[]

- `DOUBLE_TEAM_LINES.delinquent.easygoing[1]`: 一緒にやろうぜ〜！
- `DOUBLE_TEAM_LINES.delinquent.easygoing[2]`: 合わせろ合わせろ♪
- `DOUBLE_TEAM_LINES.delinquent.easygoing[3]`: せーのっ、だ！

### delinquent.quiet[]

- `DOUBLE_TEAM_LINES.delinquent.quiet[1]`: …合わせろ
- `DOUBLE_TEAM_LINES.delinquent.quiet[2]`: …せーの、だ
- `DOUBLE_TEAM_LINES.delinquent.quiet[3]`: …いくぜ

### delinquent.shy[]

- `DOUBLE_TEAM_LINES.delinquent.shy[1]`: あ、合わせろし…！
- `DOUBLE_TEAM_LINES.delinquent.shy[2]`: ふ、二人で…だ…！
- `DOUBLE_TEAM_LINES.delinquent.shy[3]`: い、いっしょにやるぞ…

### delinquent.emotional[]

- `DOUBLE_TEAM_LINES.delinquent.emotional[1]`: 二人でっ…いくぞ！
- `DOUBLE_TEAM_LINES.delinquent.emotional[2]`: 合わせろっ…！
- `DOUBLE_TEAM_LINES.delinquent.emotional[3]`: 絶対決めるぜ…っ！

### ojousama.normal[]

- `DOUBLE_TEAM_LINES.ojousama.normal[1]`: 合わせてくださいまし！
- `DOUBLE_TEAM_LINES.ojousama.normal[2]`: 二人で参りますわ！
- `DOUBLE_TEAM_LINES.ojousama.normal[3]`: 息を合わせますわよ！

### ojousama.earnest[]

- `DOUBLE_TEAM_LINES.ojousama.earnest[1]`: ご一緒に参りますわ！
- `DOUBLE_TEAM_LINES.ojousama.earnest[2]`: タイミングを合わせますわ！
- `DOUBLE_TEAM_LINES.ojousama.earnest[3]`: 二人で決めますわ！

### ojousama.bold[]

- `DOUBLE_TEAM_LINES.ojousama.bold[1]`: 二人で決めますわよ！
- `DOUBLE_TEAM_LINES.ojousama.bold[2]`: お合わせなさい！
- `DOUBLE_TEAM_LINES.ojousama.bold[3]`: 逃がしませんわ、そちらお任せを！

### ojousama.easygoing[]

- `DOUBLE_TEAM_LINES.ojousama.easygoing[1]`: ご一緒にですわ〜♪
- `DOUBLE_TEAM_LINES.ojousama.easygoing[2]`: お合わせあそばせ♪
- `DOUBLE_TEAM_LINES.ojousama.easygoing[3]`: せーの、ですわ♪

### ojousama.quiet[]

- `DOUBLE_TEAM_LINES.ojousama.quiet[1]`: …合わせますわ
- `DOUBLE_TEAM_LINES.ojousama.quiet[2]`: …せーの、ですわ
- `DOUBLE_TEAM_LINES.ojousama.quiet[3]`: …参りますわ

### ojousama.shy[]

- `DOUBLE_TEAM_LINES.ojousama.shy[1]`: あ、合わせてくださいまし…！
- `DOUBLE_TEAM_LINES.ojousama.shy[2]`: ふ、二人で…ですわ…！
- `DOUBLE_TEAM_LINES.ojousama.shy[3]`: い、いっしょに参りますわ…！

### ojousama.emotional[]

- `DOUBLE_TEAM_LINES.ojousama.emotional[1]`: 二人で…決めますわっ…！
- `DOUBLE_TEAM_LINES.ojousama.emotional[2]`: 合わせなさいっ…！
- `DOUBLE_TEAM_LINES.ojousama.emotional[3]`: 絶対決めますわ…っ！

### cool.normal[]

- `DOUBLE_TEAM_LINES.cool.normal[1]`: …合わせて
- `DOUBLE_TEAM_LINES.cool.normal[2]`: …いく、二人で
- `DOUBLE_TEAM_LINES.cool.normal[3]`: …息を、合わせろ

### cool.earnest[]

- `DOUBLE_TEAM_LINES.cool.earnest[1]`: …一緒に
- `DOUBLE_TEAM_LINES.cool.earnest[2]`: …タイミング
- `DOUBLE_TEAM_LINES.cool.earnest[3]`: …二人で、決める

### cool.bold[]

- `DOUBLE_TEAM_LINES.cool.bold[1]`: …二人で決める
- `DOUBLE_TEAM_LINES.cool.bold[2]`: …合わせろ
- `DOUBLE_TEAM_LINES.cool.bold[3]`: …逃がさない、頼む

### cool.easygoing[]

- `DOUBLE_TEAM_LINES.cool.easygoing[1]`: …一緒に
- `DOUBLE_TEAM_LINES.cool.easygoing[2]`: …合わせて
- `DOUBLE_TEAM_LINES.cool.easygoing[3]`: …せーの

### cool.quiet[]

- `DOUBLE_TEAM_LINES.cool.quiet[1]`: ……合わせる
- `DOUBLE_TEAM_LINES.cool.quiet[2]`: ……せーの
- `DOUBLE_TEAM_LINES.cool.quiet[3]`: ……いく

### cool.shy[]

- `DOUBLE_TEAM_LINES.cool.shy[1]`: …あ、合わせて
- `DOUBLE_TEAM_LINES.cool.shy[2]`: …ふ、二人で
- `DOUBLE_TEAM_LINES.cool.shy[3]`: …い、いっしょに

### cool.emotional[]

- `DOUBLE_TEAM_LINES.cool.emotional[1]`: …っ、二人で
- `DOUBLE_TEAM_LINES.cool.emotional[2]`: …合わせろ
- `DOUBLE_TEAM_LINES.cool.emotional[3]`: …絶対、決める

### composed.normal[]

- `DOUBLE_TEAM_LINES.composed.normal[1]`: …合わせて、いくよ
- `DOUBLE_TEAM_LINES.composed.normal[2]`: …二人でいこうか
- `DOUBLE_TEAM_LINES.composed.normal[3]`: …息、合わせようね

### composed.earnest[]

- `DOUBLE_TEAM_LINES.composed.earnest[1]`: …一緒にいくよ
- `DOUBLE_TEAM_LINES.composed.earnest[2]`: …タイミング、合わせて
- `DOUBLE_TEAM_LINES.composed.earnest[3]`: …二人で決めようね

### composed.bold[]

- `DOUBLE_TEAM_LINES.composed.bold[1]`: …二人で決めるよ
- `DOUBLE_TEAM_LINES.composed.bold[2]`: …合わせて、いこうか
- `DOUBLE_TEAM_LINES.composed.bold[3]`: …逃がさない、そっち頼むね

### composed.easygoing[]

- `DOUBLE_TEAM_LINES.composed.easygoing[1]`: …一緒にやろ〜
- `DOUBLE_TEAM_LINES.composed.easygoing[2]`: …合わせて、ね♪
- `DOUBLE_TEAM_LINES.composed.easygoing[3]`: …せーの、かな

### composed.quiet[]

- `DOUBLE_TEAM_LINES.composed.quiet[1]`: …合わせるよ
- `DOUBLE_TEAM_LINES.composed.quiet[2]`: …せーの、だね
- `DOUBLE_TEAM_LINES.composed.quiet[3]`: …いこうか

### composed.shy[]

- `DOUBLE_TEAM_LINES.composed.shy[1]`: …あ、合わせるね…
- `DOUBLE_TEAM_LINES.composed.shy[2]`: …ふ、二人で、ね…
- `DOUBLE_TEAM_LINES.composed.shy[3]`: …い、いっしょに、いこ…

### composed.emotional[]

- `DOUBLE_TEAM_LINES.composed.emotional[1]`: …二人で、決めるよ…！
- `DOUBLE_TEAM_LINES.composed.emotional[2]`: …合わせて…っ
- `DOUBLE_TEAM_LINES.composed.emotional[3]`: …絶対決める、から…

## `CUTIN_SAVE_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: タッグ専用: カットイン救出時のセリフ [archetype][personality][3本]
- 本数: 147

### standard.normal[]

- `CUTIN_SAVE_LINES.standard.normal[1]`: させない！
- `CUTIN_SAVE_LINES.standard.normal[2]`: まだだ！
- `CUTIN_SAVE_LINES.standard.normal[3]`: 渡さないよ！

### standard.earnest[]

- `CUTIN_SAVE_LINES.standard.earnest[1]`: そうはさせない！
- `CUTIN_SAVE_LINES.standard.earnest[2]`: まだ諦めてない！
- `CUTIN_SAVE_LINES.standard.earnest[3]`: 絶対渡さない！

### standard.bold[]

- `CUTIN_SAVE_LINES.standard.bold[1]`: そうはさせるか！
- `CUTIN_SAVE_LINES.standard.bold[2]`: まだまだ！
- `CUTIN_SAVE_LINES.standard.bold[3]`: そうはいかない！

### standard.easygoing[]

- `CUTIN_SAVE_LINES.standard.easygoing[1]`: させないよ〜！
- `CUTIN_SAVE_LINES.standard.easygoing[2]`: まだまだ〜！
- `CUTIN_SAVE_LINES.standard.easygoing[3]`: はい、カット！

### standard.quiet[]

- `CUTIN_SAVE_LINES.standard.quiet[1]`: …させない
- `CUTIN_SAVE_LINES.standard.quiet[2]`: …まだ
- `CUTIN_SAVE_LINES.standard.quiet[3]`: …駄目

### standard.shy[]

- `CUTIN_SAVE_LINES.standard.shy[1]`: さ、させない…！
- `CUTIN_SAVE_LINES.standard.shy[2]`: ま、まだ…です…！
- `CUTIN_SAVE_LINES.standard.shy[3]`: だ、ダメ…！

### standard.emotional[]

- `CUTIN_SAVE_LINES.standard.emotional[1]`: 絶対させないっ…！
- `CUTIN_SAVE_LINES.standard.emotional[2]`: まだっ…！
- `CUTIN_SAVE_LINES.standard.emotional[3]`: そんなの…駄目っ…！

### polite.normal[]

- `CUTIN_SAVE_LINES.polite.normal[1]`: させませんっ！
- `CUTIN_SAVE_LINES.polite.normal[2]`: まだですっ！
- `CUTIN_SAVE_LINES.polite.normal[3]`: 渡しませんっ！

### polite.earnest[]

- `CUTIN_SAVE_LINES.polite.earnest[1]`: そうはさせませんっ！
- `CUTIN_SAVE_LINES.polite.earnest[2]`: まだ諦めていませんっ！
- `CUTIN_SAVE_LINES.polite.earnest[3]`: 絶対渡しませんっ！

### polite.bold[]

- `CUTIN_SAVE_LINES.polite.bold[1]`: そうはさせませんよ！
- `CUTIN_SAVE_LINES.polite.bold[2]`: まだまだですっ！
- `CUTIN_SAVE_LINES.polite.bold[3]`: そうはいきませんっ！

### polite.easygoing[]

- `CUTIN_SAVE_LINES.polite.easygoing[1]`: させませんよ〜！
- `CUTIN_SAVE_LINES.polite.easygoing[2]`: まだまだですよ〜！
- `CUTIN_SAVE_LINES.polite.easygoing[3]`: はい、カットです！

### polite.quiet[]

- `CUTIN_SAVE_LINES.polite.quiet[1]`: …させません
- `CUTIN_SAVE_LINES.polite.quiet[2]`: …まだです
- `CUTIN_SAVE_LINES.polite.quiet[3]`: …駄目です

### polite.shy[]

- `CUTIN_SAVE_LINES.polite.shy[1]`: さ、させませんっ…！
- `CUTIN_SAVE_LINES.polite.shy[2]`: ま、まだですっ…！
- `CUTIN_SAVE_LINES.polite.shy[3]`: だ、ダメですっ…！

### polite.emotional[]

- `CUTIN_SAVE_LINES.polite.emotional[1]`: 絶対させませんっ…！
- `CUTIN_SAVE_LINES.polite.emotional[2]`: まだですっ…！
- `CUTIN_SAVE_LINES.polite.emotional[3]`: そんなの駄目ですっ…！

### seductive.normal[]

- `CUTIN_SAVE_LINES.seductive.normal[1]`: させないわ
- `CUTIN_SAVE_LINES.seductive.normal[2]`: まだよ
- `CUTIN_SAVE_LINES.seductive.normal[3]`: 渡さない…わ

### seductive.earnest[]

- `CUTIN_SAVE_LINES.seductive.earnest[1]`: そうはさせないわ
- `CUTIN_SAVE_LINES.seductive.earnest[2]`: まだ諦めてないの
- `CUTIN_SAVE_LINES.seductive.earnest[3]`: 絶対渡さないわ

### seductive.bold[]

- `CUTIN_SAVE_LINES.seductive.bold[1]`: そうはさせないわよ
- `CUTIN_SAVE_LINES.seductive.bold[2]`: まだまだよ
- `CUTIN_SAVE_LINES.seductive.bold[3]`: そうはいかないわ

### seductive.easygoing[]

- `CUTIN_SAVE_LINES.seductive.easygoing[1]`: させないわよ〜♪
- `CUTIN_SAVE_LINES.seductive.easygoing[2]`: まだまだ…よ♪
- `CUTIN_SAVE_LINES.seductive.easygoing[3]`: はぁい、カット♪

### seductive.quiet[]

- `CUTIN_SAVE_LINES.seductive.quiet[1]`: …させないわ
- `CUTIN_SAVE_LINES.seductive.quiet[2]`: …まだ、よ
- `CUTIN_SAVE_LINES.seductive.quiet[3]`: …駄目よ

### seductive.shy[]

- `CUTIN_SAVE_LINES.seductive.shy[1]`: さ、させない…わ…!
- `CUTIN_SAVE_LINES.seductive.shy[2]`: ま、まだ…よ…!
- `CUTIN_SAVE_LINES.seductive.shy[3]`: だ、ダメ…なの…!

### seductive.emotional[]

- `CUTIN_SAVE_LINES.seductive.emotional[1]`: 絶対させないわっ…！
- `CUTIN_SAVE_LINES.seductive.emotional[2]`: まだよっ…！
- `CUTIN_SAVE_LINES.seductive.emotional[3]`: そんなの…許さないわっ…！

### delinquent.normal[]

- `CUTIN_SAVE_LINES.delinquent.normal[1]`: させねえ！
- `CUTIN_SAVE_LINES.delinquent.normal[2]`: まだだ！
- `CUTIN_SAVE_LINES.delinquent.normal[3]`: 渡さねえよ！

### delinquent.earnest[]

- `CUTIN_SAVE_LINES.delinquent.earnest[1]`: そうはさせねえ！
- `CUTIN_SAVE_LINES.delinquent.earnest[2]`: まだ諦めてねえ！
- `CUTIN_SAVE_LINES.delinquent.earnest[3]`: 絶対渡さねえ！

### delinquent.bold[]

- `CUTIN_SAVE_LINES.delinquent.bold[1]`: そうはさせるかよ！
- `CUTIN_SAVE_LINES.delinquent.bold[2]`: まだまだだ！
- `CUTIN_SAVE_LINES.delinquent.bold[3]`: そうはいかねえ！

### delinquent.easygoing[]

- `CUTIN_SAVE_LINES.delinquent.easygoing[1]`: させねえよ〜！
- `CUTIN_SAVE_LINES.delinquent.easygoing[2]`: まだまだだ〜！
- `CUTIN_SAVE_LINES.delinquent.easygoing[3]`: ほい、カットだ！

### delinquent.quiet[]

- `CUTIN_SAVE_LINES.delinquent.quiet[1]`: …させねえ
- `CUTIN_SAVE_LINES.delinquent.quiet[2]`: …まだだ
- `CUTIN_SAVE_LINES.delinquent.quiet[3]`: …駄目だ

### delinquent.shy[]

- `CUTIN_SAVE_LINES.delinquent.shy[1]`: さ、させねえ…！
- `CUTIN_SAVE_LINES.delinquent.shy[2]`: ま、まだだ…！
- `CUTIN_SAVE_LINES.delinquent.shy[3]`: だ、ダメだ…！

### delinquent.emotional[]

- `CUTIN_SAVE_LINES.delinquent.emotional[1]`: 絶対させねえっ…！
- `CUTIN_SAVE_LINES.delinquent.emotional[2]`: まだだっ…！
- `CUTIN_SAVE_LINES.delinquent.emotional[3]`: そんなの…させるかっ…！

### ojousama.normal[]

- `CUTIN_SAVE_LINES.ojousama.normal[1]`: させませんわ！
- `CUTIN_SAVE_LINES.ojousama.normal[2]`: まだですわ！
- `CUTIN_SAVE_LINES.ojousama.normal[3]`: 渡しませんわ！

### ojousama.earnest[]

- `CUTIN_SAVE_LINES.ojousama.earnest[1]`: そうはさせませんわ！
- `CUTIN_SAVE_LINES.ojousama.earnest[2]`: まだ諦めておりませんわ！
- `CUTIN_SAVE_LINES.ojousama.earnest[3]`: 絶対渡しませんわ！

### ojousama.bold[]

- `CUTIN_SAVE_LINES.ojousama.bold[1]`: そうはさせませんわよ！
- `CUTIN_SAVE_LINES.ojousama.bold[2]`: まだまだですわ！
- `CUTIN_SAVE_LINES.ojousama.bold[3]`: そうはいきませんわ！

### ojousama.easygoing[]

- `CUTIN_SAVE_LINES.ojousama.easygoing[1]`: させませんわよ〜♪
- `CUTIN_SAVE_LINES.ojousama.easygoing[2]`: まだまだですわ〜！
- `CUTIN_SAVE_LINES.ojousama.easygoing[3]`: はぁい、カットですわ♪

### ojousama.quiet[]

- `CUTIN_SAVE_LINES.ojousama.quiet[1]`: …させませんわ
- `CUTIN_SAVE_LINES.ojousama.quiet[2]`: …まだですわ
- `CUTIN_SAVE_LINES.ojousama.quiet[3]`: …なりませんわ

### ojousama.shy[]

- `CUTIN_SAVE_LINES.ojousama.shy[1]`: さ、させませんわ…！
- `CUTIN_SAVE_LINES.ojousama.shy[2]`: ま、まだですわ…！
- `CUTIN_SAVE_LINES.ojousama.shy[3]`: だ、ダメですわ…！

### ojousama.emotional[]

- `CUTIN_SAVE_LINES.ojousama.emotional[1]`: 絶対させませんわっ…！
- `CUTIN_SAVE_LINES.ojousama.emotional[2]`: まだですわっ…！
- `CUTIN_SAVE_LINES.ojousama.emotional[3]`: そんなの…許しませんわっ…！

### cool.normal[]

- `CUTIN_SAVE_LINES.cool.normal[1]`: …させない
- `CUTIN_SAVE_LINES.cool.normal[2]`: …まだ
- `CUTIN_SAVE_LINES.cool.normal[3]`: …渡さない

### cool.earnest[]

- `CUTIN_SAVE_LINES.cool.earnest[1]`: …させない
- `CUTIN_SAVE_LINES.cool.earnest[2]`: …諦めてない
- `CUTIN_SAVE_LINES.cool.earnest[3]`: …絶対、渡さない

### cool.bold[]

- `CUTIN_SAVE_LINES.cool.bold[1]`: …させるか
- `CUTIN_SAVE_LINES.cool.bold[2]`: …まだまだ
- `CUTIN_SAVE_LINES.cool.bold[3]`: …そうはいかない

### cool.easygoing[]

- `CUTIN_SAVE_LINES.cool.easygoing[1]`: …させない
- `CUTIN_SAVE_LINES.cool.easygoing[2]`: …まだまだ
- `CUTIN_SAVE_LINES.cool.easygoing[3]`: …カット

### cool.quiet[]

- `CUTIN_SAVE_LINES.cool.quiet[1]`: ……させない
- `CUTIN_SAVE_LINES.cool.quiet[2]`: ……まだ
- `CUTIN_SAVE_LINES.cool.quiet[3]`: ……駄目

### cool.shy[]

- `CUTIN_SAVE_LINES.cool.shy[1]`: …さ、させない
- `CUTIN_SAVE_LINES.cool.shy[2]`: …ま、まだ
- `CUTIN_SAVE_LINES.cool.shy[3]`: …だ、ダメ

### cool.emotional[]

- `CUTIN_SAVE_LINES.cool.emotional[1]`: …っ、させない
- `CUTIN_SAVE_LINES.cool.emotional[2]`: …まだ
- `CUTIN_SAVE_LINES.cool.emotional[3]`: …駄目だ、絶対

### composed.normal[]

- `CUTIN_SAVE_LINES.composed.normal[1]`: …させないよ
- `CUTIN_SAVE_LINES.composed.normal[2]`: …まだだよ
- `CUTIN_SAVE_LINES.composed.normal[3]`: …渡さない、から

### composed.earnest[]

- `CUTIN_SAVE_LINES.composed.earnest[1]`: …そうはさせないよ
- `CUTIN_SAVE_LINES.composed.earnest[2]`: …まだ諦めてないよ
- `CUTIN_SAVE_LINES.composed.earnest[3]`: …絶対、渡さないから

### composed.bold[]

- `CUTIN_SAVE_LINES.composed.bold[1]`: …させないよ、そう簡単には
- `CUTIN_SAVE_LINES.composed.bold[2]`: …まだまだ、だよ
- `CUTIN_SAVE_LINES.composed.bold[3]`: …そうはいかないかな

### composed.easygoing[]

- `CUTIN_SAVE_LINES.composed.easygoing[1]`: …させないよ〜
- `CUTIN_SAVE_LINES.composed.easygoing[2]`: …まだまだ、かな
- `CUTIN_SAVE_LINES.composed.easygoing[3]`: …はい、カット

### composed.quiet[]

- `CUTIN_SAVE_LINES.composed.quiet[1]`: …させないよ
- `CUTIN_SAVE_LINES.composed.quiet[2]`: …まだ、だよ
- `CUTIN_SAVE_LINES.composed.quiet[3]`: …駄目だよ

### composed.shy[]

- `CUTIN_SAVE_LINES.composed.shy[1]`: …さ、させないよ…
- `CUTIN_SAVE_LINES.composed.shy[2]`: …ま、まだ、だよ…
- `CUTIN_SAVE_LINES.composed.shy[3]`: …だ、ダメ、だよ…

### composed.emotional[]

- `CUTIN_SAVE_LINES.composed.emotional[1]`: …絶対、させないよ…！
- `CUTIN_SAVE_LINES.composed.emotional[2]`: …まだ、だよ…！
- `CUTIN_SAVE_LINES.composed.emotional[3]`: …そんなの、駄目だから…

## `BETRAYAL_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: タッグ専用: 見殺し時のセリフ（動かないパートナー側） [archetype][personality][3本]
- 本数: 141

### standard.normal[]

- `BETRAYAL_LINES.standard.normal[1]`: ……動けない
- `BETRAYAL_LINES.standard.normal[2]`: ……間に合わない

### standard.earnest[]

- `BETRAYAL_LINES.standard.earnest[1]`: 間に合わない…！
- `BETRAYAL_LINES.standard.earnest[2]`: 動けない…！
- `BETRAYAL_LINES.standard.earnest[3]`: ……守れなかった

### standard.bold[]

- `BETRAYAL_LINES.standard.bold[1]`: くっ…！
- `BETRAYAL_LINES.standard.bold[2]`: ちっ…間に合わない
- `BETRAYAL_LINES.standard.bold[3]`: 届かなかった…

### standard.easygoing[]

- `BETRAYAL_LINES.standard.easygoing[1]`: ありゃ…動けない…
- `BETRAYAL_LINES.standard.easygoing[2]`: うぅ…遠い…

### standard.quiet[]

- `BETRAYAL_LINES.standard.quiet[1]`: ……動けない
- `BETRAYAL_LINES.standard.quiet[2]`: ……間に合わない

### standard.shy[]

- `BETRAYAL_LINES.standard.shy[1]`: う、動けない…
- `BETRAYAL_LINES.standard.shy[2]`: 間に合わない…！
- `BETRAYAL_LINES.standard.shy[3]`: …ごめん…

### standard.emotional[]

- `BETRAYAL_LINES.standard.emotional[1]`: 嘘…動けないっ
- `BETRAYAL_LINES.standard.emotional[2]`: 間に合わないっ…！
- `BETRAYAL_LINES.standard.emotional[3]`: ごめん…ごめんっ…！

### polite.normal[]

- `BETRAYAL_LINES.polite.normal[1]`: ……動けません
- `BETRAYAL_LINES.polite.normal[2]`: ……間に合いません
- `BETRAYAL_LINES.polite.normal[3]`: ……ごめんなさい

### polite.earnest[]

- `BETRAYAL_LINES.polite.earnest[1]`: 間に合いません…！
- `BETRAYAL_LINES.polite.earnest[2]`: 動けません…！
- `BETRAYAL_LINES.polite.earnest[3]`: ……守れませんでした

### polite.bold[]

- `BETRAYAL_LINES.polite.bold[1]`: くっ…！
- `BETRAYAL_LINES.polite.bold[2]`: くぅっ…間に合いません
- `BETRAYAL_LINES.polite.bold[3]`: 届きませんでした…

### polite.easygoing[]

- `BETRAYAL_LINES.polite.easygoing[1]`: あちゃ…動けません…
- `BETRAYAL_LINES.polite.easygoing[2]`: うぅ…遠いです…
- `BETRAYAL_LINES.polite.easygoing[3]`: ……ごめんなさい

### polite.quiet[]

- `BETRAYAL_LINES.polite.quiet[1]`: ……動けません
- `BETRAYAL_LINES.polite.quiet[2]`: ……届きません
- `BETRAYAL_LINES.polite.quiet[3]`: ……ごめんなさい

### polite.shy[]

- `BETRAYAL_LINES.polite.shy[1]`: う、動けません…
- `BETRAYAL_LINES.polite.shy[2]`: 間に合いません…！
- `BETRAYAL_LINES.polite.shy[3]`: …ごめんなさい…

### polite.emotional[]

- `BETRAYAL_LINES.polite.emotional[1]`: 嘘…動けませんっ
- `BETRAYAL_LINES.polite.emotional[2]`: 間に合いませんっ…！
- `BETRAYAL_LINES.polite.emotional[3]`: ごめんなさいっ…ごめんっ…！

### seductive.normal[]

- `BETRAYAL_LINES.seductive.normal[1]`: ……動けないわ
- `BETRAYAL_LINES.seductive.normal[2]`: ……間に合わない…わ
- `BETRAYAL_LINES.seductive.normal[3]`: ……ごめんね

### seductive.earnest[]

- `BETRAYAL_LINES.seductive.earnest[1]`: 間に合わない…わ
- `BETRAYAL_LINES.seductive.earnest[2]`: 動けない…の
- `BETRAYAL_LINES.seductive.earnest[3]`: ……守れなかった、わね

### seductive.bold[]

- `BETRAYAL_LINES.seductive.bold[1]`: くっ…！
- `BETRAYAL_LINES.seductive.bold[2]`: くっ…間に合わないわ
- `BETRAYAL_LINES.seductive.bold[3]`: 届かなかった…わね

### seductive.easygoing[]

- `BETRAYAL_LINES.seductive.easygoing[1]`: あら…動けないわ…
- `BETRAYAL_LINES.seductive.easygoing[2]`: うぅ…遠い…わ
- `BETRAYAL_LINES.seductive.easygoing[3]`: ……ごめんね

### seductive.quiet[]

- `BETRAYAL_LINES.seductive.quiet[1]`: ……動けない、わ
- `BETRAYAL_LINES.seductive.quiet[2]`: ……届かない
- `BETRAYAL_LINES.seductive.quiet[3]`: ……ごめん

### seductive.shy[]

- `BETRAYAL_LINES.seductive.shy[1]`: う、動けない…の…
- `BETRAYAL_LINES.seductive.shy[2]`: 間に合わない…っ
- `BETRAYAL_LINES.seductive.shy[3]`: …ごめんね…

### seductive.emotional[]

- `BETRAYAL_LINES.seductive.emotional[1]`: 嘘…動けないっ…！
- `BETRAYAL_LINES.seductive.emotional[2]`: 間に合わないっ…！
- `BETRAYAL_LINES.seductive.emotional[3]`: ごめん…ごめんねっ…！

### delinquent.normal[]

- `BETRAYAL_LINES.delinquent.normal[1]`: ……動けねえ
- `BETRAYAL_LINES.delinquent.normal[2]`: ……間に合わねえ
- `BETRAYAL_LINES.delinquent.normal[3]`: ……くそっ

### delinquent.earnest[]

- `BETRAYAL_LINES.delinquent.earnest[1]`: 間に合わねえ…！
- `BETRAYAL_LINES.delinquent.earnest[2]`: 動けねえ…！
- `BETRAYAL_LINES.delinquent.earnest[3]`: ……守れなかった

### delinquent.bold[]

- `BETRAYAL_LINES.delinquent.bold[1]`: くそっ…！
- `BETRAYAL_LINES.delinquent.bold[2]`: ちっ…間に合わねえ
- `BETRAYAL_LINES.delinquent.bold[3]`: 届かなかった…

### delinquent.easygoing[]

- `BETRAYAL_LINES.delinquent.easygoing[1]`: あちゃ…動けねえ…
- `BETRAYAL_LINES.delinquent.easygoing[2]`: うぅ…遠えな…
- `BETRAYAL_LINES.delinquent.easygoing[3]`: ……わりぃ

### delinquent.quiet[]

- `BETRAYAL_LINES.delinquent.quiet[1]`: ……動けねえ
- `BETRAYAL_LINES.delinquent.quiet[2]`: ……届かねえ
- `BETRAYAL_LINES.delinquent.quiet[3]`: ……くそ

### delinquent.shy[]

- `BETRAYAL_LINES.delinquent.shy[1]`: う、動けねえ…
- `BETRAYAL_LINES.delinquent.shy[2]`: 間に合わねえ…！
- `BETRAYAL_LINES.delinquent.shy[3]`: …わりぃ…

### delinquent.emotional[]

- `BETRAYAL_LINES.delinquent.emotional[1]`: 嘘だろ…動けねえっ
- `BETRAYAL_LINES.delinquent.emotional[2]`: 間に合わねえっ…！
- `BETRAYAL_LINES.delinquent.emotional[3]`: わりぃ…わりぃっ…！

### ojousama.normal[]

- `BETRAYAL_LINES.ojousama.normal[1]`: ……動けませんわ
- `BETRAYAL_LINES.ojousama.normal[2]`: ……間に合いませんわ
- `BETRAYAL_LINES.ojousama.normal[3]`: ……申し訳、ございませんわ

### ojousama.earnest[]

- `BETRAYAL_LINES.ojousama.earnest[1]`: 間に合いませんわ…！
- `BETRAYAL_LINES.ojousama.earnest[2]`: 動けませんの…！
- `BETRAYAL_LINES.ojousama.earnest[3]`: ……守れませんでしたわ

### ojousama.bold[]

- `BETRAYAL_LINES.ojousama.bold[1]`: くっ…！
- `BETRAYAL_LINES.ojousama.bold[2]`: …っ、間に合いませんわ
- `BETRAYAL_LINES.ojousama.bold[3]`: 届きませんでしたわ…

### ojousama.easygoing[]

- `BETRAYAL_LINES.ojousama.easygoing[1]`: あらあら…動けませんわ…
- `BETRAYAL_LINES.ojousama.easygoing[2]`: うぅ…遠いですわ…
- `BETRAYAL_LINES.ojousama.easygoing[3]`: ……ごめんあそばせ

### ojousama.quiet[]

- `BETRAYAL_LINES.ojousama.quiet[1]`: ……動けませんわ
- `BETRAYAL_LINES.ojousama.quiet[2]`: ……届きませんわ
- `BETRAYAL_LINES.ojousama.quiet[3]`: ……申し訳ありません

### ojousama.shy[]

- `BETRAYAL_LINES.ojousama.shy[1]`: う、動けませんわ…
- `BETRAYAL_LINES.ojousama.shy[2]`: 間に合いませんの…！
- `BETRAYAL_LINES.ojousama.shy[3]`: …ごめんなさい…

### ojousama.emotional[]

- `BETRAYAL_LINES.ojousama.emotional[1]`: 嘘…動けませんわっ
- `BETRAYAL_LINES.ojousama.emotional[2]`: 間に合いませんわっ…！
- `BETRAYAL_LINES.ojousama.emotional[3]`: ごめんなさいっ…！

### cool.normal[]

- `BETRAYAL_LINES.cool.normal[2]`: ……動けない
- `BETRAYAL_LINES.cool.normal[3]`: ……届かない

### cool.earnest[]

- `BETRAYAL_LINES.cool.earnest[1]`: …間に合わない
- `BETRAYAL_LINES.cool.earnest[2]`: …動けない
- `BETRAYAL_LINES.cool.earnest[3]`: ……守れなかった

### cool.bold[]

- `BETRAYAL_LINES.cool.bold[1]`: …くっ
- `BETRAYAL_LINES.cool.bold[2]`: …間に合わない
- `BETRAYAL_LINES.cool.bold[3]`: …届かなかった

### cool.easygoing[]

- `BETRAYAL_LINES.cool.easygoing[1]`: …あ、動けない
- `BETRAYAL_LINES.cool.easygoing[2]`: …遠い

### cool.quiet[]

- `BETRAYAL_LINES.cool.quiet[1]`: …………動けない
- `BETRAYAL_LINES.cool.quiet[2]`: …………届かない

### cool.shy[]

- `BETRAYAL_LINES.cool.shy[1]`: …う、動けない
- `BETRAYAL_LINES.cool.shy[2]`: …間に合わない
- `BETRAYAL_LINES.cool.shy[3]`: …ごめん

### cool.emotional[]

- `BETRAYAL_LINES.cool.emotional[1]`: …っ、動けない
- `BETRAYAL_LINES.cool.emotional[2]`: …間に合わない
- `BETRAYAL_LINES.cool.emotional[3]`: …ごめん、っ

### composed.normal[]

- `BETRAYAL_LINES.composed.normal[1]`: ……動けないよ
- `BETRAYAL_LINES.composed.normal[2]`: ……間に合わない、か
- `BETRAYAL_LINES.composed.normal[3]`: ……ごめん

### composed.earnest[]

- `BETRAYAL_LINES.composed.earnest[1]`: …間に合わないか…
- `BETRAYAL_LINES.composed.earnest[2]`: …動けないよ…
- `BETRAYAL_LINES.composed.earnest[3]`: ……守れなかった、な

### composed.bold[]

- `BETRAYAL_LINES.composed.bold[1]`: …くっ、間に合わないか
- `BETRAYAL_LINES.composed.bold[2]`: …届かないな
- `BETRAYAL_LINES.composed.bold[3]`: 届かなかった…よ

### composed.easygoing[]

- `BETRAYAL_LINES.composed.easygoing[1]`: …ありゃ、動けないや
- `BETRAYAL_LINES.composed.easygoing[2]`: …うぅ、遠いなあ
- `BETRAYAL_LINES.composed.easygoing[3]`: ……ごめんね

### composed.quiet[]

- `BETRAYAL_LINES.composed.quiet[1]`: ……動けないよ
- `BETRAYAL_LINES.composed.quiet[2]`: ……届かないか
- `BETRAYAL_LINES.composed.quiet[3]`: ……ごめん

### composed.shy[]

- `BETRAYAL_LINES.composed.shy[1]`: …う、動けないよ…
- `BETRAYAL_LINES.composed.shy[2]`: …間に合わない、か…
- `BETRAYAL_LINES.composed.shy[3]`: …ごめんね…

### composed.emotional[]

- `BETRAYAL_LINES.composed.emotional[1]`: …嘘、動けないよ…っ
- `BETRAYAL_LINES.composed.emotional[2]`: …間に合わない…っ
- `BETRAYAL_LINES.composed.emotional[3]`: …ごめん、ごめんね…

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
- コード内コメント: T2: 試合完了時の勝利者セリフ。[archetype][personality][2本]。各セル2本のうち1本だけ {partner}(呼び名)を1回含む。 / {partner} には呼び名(基本は名字、話し手→相手の絆85以上で下の名前)が入る。フルネームは入れない / (K-14 タッグ勝利セリフ・呼び名の裁定 2026-09-25 / specs/call-name-spec-v1.0.md)。 / 名前なし21本(TAG_MATCH_WIN_NAMELESS_LINES)と合わせて pickTagWinLine が等確率で引く。
- 本数: 98

- `TAG_MATCH_WIN_LINES.standard.normal[1]`: {partner}、ありがとう！ 一人じゃ、ここまで持たなかったよ。
- `TAG_MATCH_WIN_LINES.standard.normal[2]`: よしっ！ 組むって決まった時から、いけるって思ってたんだ♪
- `TAG_MATCH_WIN_LINES.standard.earnest[1]`: ふぅ…{partner}を信じて任せたの、正解だったわね。この勝ちは、二人で分け合いましょう。
- `TAG_MATCH_WIN_LINES.standard.earnest[2]`: 苦しいところを繋いでもらったおかげで…最後まであきらめずにいられたわ。
- `TAG_MATCH_WIN_LINES.standard.bold[1]`: 当然の結果よ。…でも、{partner}と一緒だと、負ける気が全然しないわね。
- `TAG_MATCH_WIN_LINES.standard.bold[2]`: 見た？ 二人で組めば、この程度は当たり前よ？
- `TAG_MATCH_WIN_LINES.standard.easygoing[1]`: {partner}、ハイタッチ〜♪ 合図なしで通じちゃうの、マジ最高じゃん！
- `TAG_MATCH_WIN_LINES.standard.easygoing[2]`: 勝っちゃった〜♡ 組むの楽しすぎて、試合ってこと忘れてたかも♪
- `TAG_MATCH_WIN_LINES.standard.quiet[1]`: …助かったわ。組んだ相手が{partner}で、よかったかも。
- `TAG_MATCH_WIN_LINES.standard.quiet[2]`: …勝てた理由？ 隣を見れば分かるでしょ。
- `TAG_MATCH_WIN_LINES.standard.shy[1]`: あ、あの、{partner}さん……ほ、本当に……ありがとうございました……！
- `TAG_MATCH_WIN_LINES.standard.shy[2]`: わ、わたし……ちゃんと、やれてましたか……？ 一緒だったから、足が止まらなかったんです……！
- `TAG_MATCH_WIN_LINES.standard.emotional[1]`: {partner}っ…！ ありがとう…ありがとうっ…！ 二人で勝てたんだよ、ほんとに…！
- `TAG_MATCH_WIN_LINES.standard.emotional[2]`: 絶対勝とうねって、控室で言ったよね…っ！ ほんとになった…！
- `TAG_MATCH_WIN_LINES.polite.normal[1]`: あっ…勝てた…。{partner}さん、今日はずいぶん助けてもらっちゃいましたね。
- `TAG_MATCH_WIN_LINES.polite.normal[2]`: 信じてよかったです…ほら、ちゃんと勝てましたよ！
- `TAG_MATCH_WIN_LINES.polite.earnest[1]`: なんとか、なりましたね…{partner}さんのおかげです。ありがとうございました！
- `TAG_MATCH_WIN_LINES.polite.earnest[2]`: 託してもらった試合、ちゃんと勝ちで返せました。…いい試合でしたね！
- `TAG_MATCH_WIN_LINES.polite.bold[1]`: やりましたね、{partner}さん！ 二人で全力を出し切れば、負けません！
- `TAG_MATCH_WIN_LINES.polite.bold[2]`: ふぅ……見てもらえましたか？ これが、二人で組んだ実力です！
- `TAG_MATCH_WIN_LINES.polite.easygoing[1]`: 途中から、次に何をするか全部わかっちゃいました♪ すごくないですか！？
- `TAG_MATCH_WIN_LINES.polite.easygoing[2]`: 勝っちゃいました♪ {partner}さんと組めて楽しかったです、またやりましょうね〜！
- `TAG_MATCH_WIN_LINES.polite.quiet[1]`: …ありがとう、{partner}さん。先に崩してくれたから、組み立てが楽になったの。
- `TAG_MATCH_WIN_LINES.polite.quiet[2]`: …勝因は、組んだ相手。考えるまでもないことだわ。
- `TAG_MATCH_WIN_LINES.polite.shy[1]`: ご、ごめんなさい、うまく言えなくて…でも、ほんとに、ありがとうございます…！
- `TAG_MATCH_WIN_LINES.polite.shy[2]`: わ、わたし…一度も、逃げなかったの…！ {partner}さんが一緒に出てくれたから…！
- `TAG_MATCH_WIN_LINES.polite.emotional[1]`: ありがとうございますっ…！ す、すみません、涙が止まらなくて…っ
- `TAG_MATCH_WIN_LINES.polite.emotional[2]`: 約束、守れましたね、{partner}さん…っ！ よかった…ほんとに、よかったです…！
- `TAG_MATCH_WIN_LINES.seductive.normal[1]`: ありがとう。二人がかりで追い詰めるのって、なかなか愉しいものね♪
- `TAG_MATCH_WIN_LINES.seductive.normal[2]`: ふふ、{partner}がいると、負けるところが想像できないの。…相手の子には気の毒だけど♪
- `TAG_MATCH_WIN_LINES.seductive.earnest[1]`: …見立てどおりだったわ。信じて正解。この勝ち、半分は{partner}の手柄よ。
- `TAG_MATCH_WIN_LINES.seductive.earnest[2]`: 時間を稼いでくれたから…こちらは落ち着いて、勝ち筋を選べたの。
- `TAG_MATCH_WIN_LINES.seductive.bold[1]`: やったわね、{partner}。この二人なら、もっと上まで行けるわ…！
- `TAG_MATCH_WIN_LINES.seductive.bold[2]`: 今の、ちゃんと見ていてくれた？ これが私たちのやり方。…忘れさせないわ。
- `TAG_MATCH_WIN_LINES.seductive.easygoing[1]`: {partner}、いい感じに噛み合ってたじゃない？ おかげで楽させてもらったわ♪
- `TAG_MATCH_WIN_LINES.seductive.easygoing[2]`: 勝っちゃった♪ 楽しい上に勝ち星まで付いてくるなんて、この組み合わせ、お得よね♪
- `TAG_MATCH_WIN_LINES.seductive.quiet[1]`: …ふふ。ありがとう、と言っておくわ。
- `TAG_MATCH_WIN_LINES.seductive.quiet[2]`: …{partner}となら、筋書きどおりに運ぶわね。
- `TAG_MATCH_WIN_LINES.seductive.shy[1]`: …あ、ありがとう。こういうの、面と向かって言うの…慣れてないの…
- `TAG_MATCH_WIN_LINES.seductive.shy[2]`: だ、大丈夫って、思えたの…{partner}が、そこにいたから…
- `TAG_MATCH_WIN_LINES.seductive.emotional[1]`: ふふっ…！ {partner}、あの子たちの悔しそうな顔、見えた？ 二人で勝つと、たまらないわね♪
- `TAG_MATCH_WIN_LINES.seductive.emotional[2]`: 約束どおりね…！ 私たちを甘く見た子たちに、たっぷり思い知らせてやったわ♪
- `TAG_MATCH_WIN_LINES.delinquent.normal[1]`: {partner}、ありがとな！ おかげで、真っ向から行けたんだ！
- `TAG_MATCH_WIN_LINES.delinquent.normal[2]`: へへっ、私ら、けっこういいコンビじゃねえ？
- `TAG_MATCH_WIN_LINES.delinquent.earnest[1]`: あんたを信じてよかった。…この勝ちは、二人のもんだ。
- `TAG_MATCH_WIN_LINES.delinquent.earnest[2]`: {partner}が粘ってくれた分、こっちも倒れずに済んだんだ。…ありがてえ。
- `TAG_MATCH_WIN_LINES.delinquent.bold[1]`: どうだ、{partner}！ 私らが組みゃ、どこの誰が来たって負けねえんだよ！
- `TAG_MATCH_WIN_LINES.delinquent.bold[2]`: 見たかよ！ このタッグが最強だ。文句あるやつ、いるか？
- `TAG_MATCH_WIN_LINES.delinquent.easygoing[1]`: {partner}、目ぇ合っただけで分かったろ？ 楽しかったな〜♪
- `TAG_MATCH_WIN_LINES.delinquent.easygoing[2]`: よっしゃ♪ 組んでると、しんどい試合も遊んでるみてえだな
- `TAG_MATCH_WIN_LINES.delinquent.quiet[1]`: …{partner}、恩に着る。この借りは、次のリングで返す。
- `TAG_MATCH_WIN_LINES.delinquent.quiet[2]`: …あんたとだから、勝てた。それ以上は言わねえ。
- `TAG_MATCH_WIN_LINES.delinquent.shy[1]`: あ、ありがとな…！ …こ、こっち見んなよ、照れんだろ…
- `TAG_MATCH_WIN_LINES.delinquent.shy[2]`: ぜ、全部…{partner}のおかげ、だ…！ …い、今のナシ、忘れろ…
- `TAG_MATCH_WIN_LINES.delinquent.emotional[1]`: やった…やったぜ…！ ちくしょう、嬉しくて声が震えやがる…！
- `TAG_MATCH_WIN_LINES.delinquent.emotional[2]`: 絶対勝つって言ったろ…！ な、{partner}…？ 言ったとおりになったろ…っ！
- `TAG_MATCH_WIN_LINES.ojousama.normal[1]`: {partner}さん、感謝するわ。…この一勝は、二人で積み上げたぶんの結果ね。
- `TAG_MATCH_WIN_LINES.ojousama.normal[2]`: この二人なら崩れない。…最初から、そう信じていたわ。
- `TAG_MATCH_WIN_LINES.ojousama.earnest[1]`: {partner}さんに預けた信頼に、しかと応えていただきましたわ。
- `TAG_MATCH_WIN_LINES.ojousama.earnest[2]`: 持ちこたえてくださったから、最後に全力で当たれたのだもの。
- `TAG_MATCH_WIN_LINES.ojousama.bold[1]`: ふふ…{partner}さんがいて、負ける理由がどこにあるのかしら？
- `TAG_MATCH_WIN_LINES.ojousama.bold[2]`: ご覧になって？ これに並ぶタッグなど、どこにもいないでしょうね。
- `TAG_MATCH_WIN_LINES.ojousama.easygoing[1]`: あらあら、打ち合わせもなしに、こんなに揃うものなのね。
- `TAG_MATCH_WIN_LINES.ojousama.easygoing[2]`: あら、勝ってしまいましたわ。こんなに楽しいのなら、{partner}さんとまたご一緒したいものね。
- `TAG_MATCH_WIN_LINES.ojousama.quiet[1]`: …感謝いたします。言葉は、あとで改めて。
- `TAG_MATCH_WIN_LINES.ojousama.quiet[2]`: …ご一緒したのが、{partner}さんでよかった。…それだけ。
- `TAG_MATCH_WIN_LINES.ojousama.shy[1]`: あ、ありがとうございます…こ、こういう時、どんなお顔をすればよいのかしら…
- `TAG_MATCH_WIN_LINES.ojousama.shy[2]`: み、みっともない姿は…お見せせずに済みましたかしら…？ {partner}さんのおかげですわ…
- `TAG_MATCH_WIN_LINES.ojousama.emotional[1]`: 勝ちましたのね…！ 二人で…！ …ごめんなさい、今だけは、お行儀を忘れさせて…
- `TAG_MATCH_WIN_LINES.ojousama.emotional[2]`: お約束、果たせましたわね、{partner}さん…っ！ …嬉しくて、言葉になりませんの…
- `TAG_MATCH_WIN_LINES.cool.normal[1]`: …ありがとう。二人で削って、二人で取った。
- `TAG_MATCH_WIN_LINES.cool.normal[2]`: …{partner}と組めば勝てると読んでた。読み通り。
- `TAG_MATCH_WIN_LINES.cool.earnest[1]`: …信じたのは、正しかった。…いい判断だった。
- `TAG_MATCH_WIN_LINES.cool.earnest[2]`: …あの場面、{partner}が耐えた。だから、勝ち切れた。
- `TAG_MATCH_WIN_LINES.cool.bold[1]`: …{partner}となら、負けない。今日で証明した。
- `TAG_MATCH_WIN_LINES.cool.bold[2]`: …見たか。これが、この二人の仕事。
- `TAG_MATCH_WIN_LINES.cool.easygoing[1]`: …やりやすかった。余計なこと、考えずに済んだ。
- `TAG_MATCH_WIN_LINES.cool.easygoing[2]`: …勝った。{partner}と組むのは、嫌いじゃない。
- `TAG_MATCH_WIN_LINES.cool.quiet[1]`: ……ありがとう。……次も、組む。
- `TAG_MATCH_WIN_LINES.cool.quiet[2]`: ……{partner}がいなければ、負けてた。
- `TAG_MATCH_WIN_LINES.cool.shy[1]`: …っ。……あり、がと。……今の、聞こえた？
- `TAG_MATCH_WIN_LINES.cool.shy[2]`: …ちゃんと、やれた。…{partner}に、ついていけた。
- `TAG_MATCH_WIN_LINES.cool.emotional[1]`: …っ。…勝った。{partner}と、二人で。…勝ったんだ。
- `TAG_MATCH_WIN_LINES.cool.emotional[2]`: …二人で勝つ、と決めてた。…決めた通りに、なった。
- `TAG_MATCH_WIN_LINES.composed.normal[1]`: …ありがとう、{partner}。いい仕事をしてくれたね。おかげで、こっちは落ち着いて戦えたんだ。
- `TAG_MATCH_WIN_LINES.composed.normal[2]`: …なんとなく、今日は負けない気がしてたんだ。…当たったね。
- `TAG_MATCH_WIN_LINES.composed.earnest[1]`: 信じてよかった。二人とも、まだまだ強くなれるね！
- `TAG_MATCH_WIN_LINES.composed.earnest[2]`: …{partner}が踏みとどまってくれたから、最後まで立っていられた。ありがとう。
- `TAG_MATCH_WIN_LINES.composed.bold[1]`: やったね！ 二人で組んだら負けるかって？ …まさか、だよ。
- `TAG_MATCH_WIN_LINES.composed.bold[2]`: どう？ ざっとこんなもんだよ。…なんてね、ほとんど{partner}のおかげ。
- `TAG_MATCH_WIN_LINES.composed.easygoing[1]`: あ〜、楽だった。{partner}が合わせてくれるから、こっちは乗っかるだけだったよね〜
- `TAG_MATCH_WIN_LINES.composed.easygoing[2]`: 勝っちゃったね〜。一緒だと楽しいし、次もこれでいっか♪
- `TAG_MATCH_WIN_LINES.composed.quiet[1]`: ……ありがとう。二人で勝ったの、ちゃんと伝わった？
- `TAG_MATCH_WIN_LINES.composed.quiet[2]`: ……{partner}と組んだから、勝てたの。…分かってるよね？
- `TAG_MATCH_WIN_LINES.composed.shy[1]`: …え、えっと…ありがとう。…二人で勝てたの、まだちょっと、信じられなくて…
- `TAG_MATCH_WIN_LINES.composed.shy[2]`: …{partner}の役に、ちゃんと立てたかな…？ …おかげで、頑張りきれたよ
- `TAG_MATCH_WIN_LINES.composed.emotional[1]`: 勝ったよ、{partner}！ 二人でもぎ取った一勝だよ！ ね、抱きついていい？
- `TAG_MATCH_WIN_LINES.composed.emotional[2]`: ありがとう！ って、それしか言葉が出てこないや！ 最高だったよ！

## `TAG_MATCH_LOSS_LINES`

- 出典: `src/tag-battle-lines.js`
- コード内コメント: T2: 敗北者セリフ (パートナーへの詫び/責任/次への意欲)。[archetype][personality][2本]
- 本数: 98

- `TAG_MATCH_LOSS_LINES.standard.normal[1]`: {partner}…ごめん。私が決めきれてたら…
- `TAG_MATCH_LOSS_LINES.standard.normal[2]`: {partner}、悔しいね。次は絶対、勝とう。
- `TAG_MATCH_LOSS_LINES.standard.earnest[1]`: {partner}…私の力不足だ。あなたを勝たせてあげられなかった…
- `TAG_MATCH_LOSS_LINES.standard.earnest[2]`: ここまで繋いでくれたのに…{partner}、ごめん。
- `TAG_MATCH_LOSS_LINES.standard.bold[1]`: くそっ…{partner}、ごめん。私のミスよ。次は絶対に取る。
- `TAG_MATCH_LOSS_LINES.standard.bold[2]`: 負けたままでいられるか…{partner}、次は倍返しだ！
- `TAG_MATCH_LOSS_LINES.standard.easygoing[1]`: {partner}〜ごめんね…私、決められちゃった…
- `TAG_MATCH_LOSS_LINES.standard.easygoing[2]`: あちゃ〜負けちゃった…でも{partner}、次は頑張るね。
- `TAG_MATCH_LOSS_LINES.standard.quiet[1]`: …{partner}、ごめん。
- `TAG_MATCH_LOSS_LINES.standard.quiet[2]`: …悔しい。{partner}にも、申し訳ない。
- `TAG_MATCH_LOSS_LINES.standard.shy[1]`: {partner}…ご、ごめん…私のせいで…
- `TAG_MATCH_LOSS_LINES.standard.shy[2]`: つ、次は…絶対、{partner}を勝たせる…！
- `TAG_MATCH_LOSS_LINES.standard.emotional[1]`: {partner}っ…ごめんっ…ごめんねっ…！
- `TAG_MATCH_LOSS_LINES.standard.emotional[2]`: 次は絶対…絶対勝つからっ…！ {partner}…！
- `TAG_MATCH_LOSS_LINES.polite.normal[1]`: {partner}さん…ごめんなさい。私が決めきれていれば…
- `TAG_MATCH_LOSS_LINES.polite.normal[2]`: {partner}さん、次は必ず勝ちましょう。
- `TAG_MATCH_LOSS_LINES.polite.earnest[1]`: {partner}さん、申し訳ありませんでした…私の力不足です。
- `TAG_MATCH_LOSS_LINES.polite.earnest[2]`: {partner}さんを勝たせてあげられなくて…本当にすみません…！
- `TAG_MATCH_LOSS_LINES.polite.bold[1]`: {partner}さん、私のミスです。ですが…次は絶対に返します。
- `TAG_MATCH_LOSS_LINES.polite.bold[2]`: このままでは終われません。{partner}さん、次は倍返しです！
- `TAG_MATCH_LOSS_LINES.polite.easygoing[1]`: {partner}さん…ごめんなさい、私、決められちゃいました…
- `TAG_MATCH_LOSS_LINES.polite.easygoing[2]`: あちゃ〜負けちゃいましたね…次は頑張ります、{partner}さん。
- `TAG_MATCH_LOSS_LINES.polite.quiet[1]`: …{partner}さん、ごめんなさい。
- `TAG_MATCH_LOSS_LINES.polite.quiet[2]`: …申し訳、ありませんでした。{partner}さん。
- `TAG_MATCH_LOSS_LINES.polite.shy[1]`: {partner}さん…ご、ごめんなさい…わたしのせいで…
- `TAG_MATCH_LOSS_LINES.polite.shy[2]`: つ、次は…絶対…{partner}さんを勝たせます…！
- `TAG_MATCH_LOSS_LINES.polite.emotional[1]`: {partner}さんっ…ごめんなさいっ…私のせいでっ…！
- `TAG_MATCH_LOSS_LINES.polite.emotional[2]`: 次は絶対…勝ちますからっ…！ {partner}さん…！
- `TAG_MATCH_LOSS_LINES.seductive.normal[1]`: {partner}…ごめんなさい。私が決めきれてたら…
- `TAG_MATCH_LOSS_LINES.seductive.normal[2]`: 悔しいわね、{partner}。次は絶対、勝つわよ。
- `TAG_MATCH_LOSS_LINES.seductive.earnest[1]`: {partner}…私の力不足よ。あなたを勝たせられなかった…
- `TAG_MATCH_LOSS_LINES.seductive.earnest[2]`: ここまで繋いでくれたのに…ごめんなさい、{partner}。
- `TAG_MATCH_LOSS_LINES.seductive.bold[1]`: 私のミスよ、{partner}…悪いわね。でも次は絶対、返すわ。
- `TAG_MATCH_LOSS_LINES.seductive.bold[2]`: このままじゃ終わらせない。{partner}、次は倍返しよ。
- `TAG_MATCH_LOSS_LINES.seductive.easygoing[1]`: {partner}〜ごめんね…私、決められちゃった…
- `TAG_MATCH_LOSS_LINES.seductive.easygoing[2]`: あーあ、負けちゃった…でも{partner}、次はやるわよ。
- `TAG_MATCH_LOSS_LINES.seductive.quiet[1]`: …{partner}、ごめんなさい。
- `TAG_MATCH_LOSS_LINES.seductive.quiet[2]`: …悔しい。{partner}にも…ね。
- `TAG_MATCH_LOSS_LINES.seductive.shy[1]`: {partner}…ご、ごめんね…わたしのせいで…
- `TAG_MATCH_LOSS_LINES.seductive.shy[2]`: つ、次は…絶対…{partner}を、勝たせるわ…！
- `TAG_MATCH_LOSS_LINES.seductive.emotional[1]`: {partner}っ…ごめんっ…私のせいでっ…！
- `TAG_MATCH_LOSS_LINES.seductive.emotional[2]`: 次は絶対、勝つわっ…！ {partner}…！
- `TAG_MATCH_LOSS_LINES.delinquent.normal[1]`: {partner}…悪い。私が決めてりゃな…
- `TAG_MATCH_LOSS_LINES.delinquent.normal[2]`: {partner}、悔しいな。次は絶対、勝とうぜ。
- `TAG_MATCH_LOSS_LINES.delinquent.earnest[1]`: {partner}…あたしの力不足だ。お前を勝たせてやれなかった…
- `TAG_MATCH_LOSS_LINES.delinquent.earnest[2]`: ここまで繋いでくれたのに…悪い、{partner}。
- `TAG_MATCH_LOSS_LINES.delinquent.bold[1]`: くそっ…私のミスだ、{partner}。次は絶対、返してやる。
- `TAG_MATCH_LOSS_LINES.delinquent.bold[2]`: このまま終われるかよ…{partner}、次は倍返しだ！
- `TAG_MATCH_LOSS_LINES.delinquent.easygoing[1]`: {partner}〜わりぃ…私、決められちった…
- `TAG_MATCH_LOSS_LINES.delinquent.easygoing[2]`: あちゃ〜負けたか…でも{partner}、次は頑張るぜ。
- `TAG_MATCH_LOSS_LINES.delinquent.quiet[1]`: …{partner}、悪い。
- `TAG_MATCH_LOSS_LINES.delinquent.quiet[2]`: …悔しい。{partner}にも、詫びる。
- `TAG_MATCH_LOSS_LINES.delinquent.shy[1]`: {partner}…わ、悪い…あたしのせいで…
- `TAG_MATCH_LOSS_LINES.delinquent.shy[2]`: つ、次は…絶対…{partner}を勝たせる…！
- `TAG_MATCH_LOSS_LINES.delinquent.emotional[1]`: {partner}っ…わりぃっ…あたしのせいでっ…！
- `TAG_MATCH_LOSS_LINES.delinquent.emotional[2]`: 次は絶対、勝つからっ…！ な、{partner}…！
- `TAG_MATCH_LOSS_LINES.ojousama.normal[1]`: {partner}さん…ごめんなさいまし。わたくしが決めきれていれば…
- `TAG_MATCH_LOSS_LINES.ojousama.normal[2]`: {partner}さん、次こそは必ず勝ちましょうね。
- `TAG_MATCH_LOSS_LINES.ojousama.earnest[1]`: {partner}さん、申し訳ございませんでした…わたくしの力不足ですわ。
- `TAG_MATCH_LOSS_LINES.ojousama.earnest[2]`: {partner}さんを勝たせてさしあげられず…本当にごめんなさい…！
- `TAG_MATCH_LOSS_LINES.ojousama.bold[1]`: わたくしのミスですわ、{partner}さん。ですが次は必ず返しますの。
- `TAG_MATCH_LOSS_LINES.ojousama.bold[2]`: このままでは終われませんわ。{partner}さん、次は倍返しですわ！
- `TAG_MATCH_LOSS_LINES.ojousama.easygoing[1]`: {partner}さん…ごめんなさい、決められてしまいましたわ…
- `TAG_MATCH_LOSS_LINES.ojousama.easygoing[2]`: あらら、負けてしまいましたわ…でも次は頑張りますの、{partner}さん。
- `TAG_MATCH_LOSS_LINES.ojousama.quiet[1]`: …{partner}さん、ごめんなさい。
- `TAG_MATCH_LOSS_LINES.ojousama.quiet[2]`: …申し訳ありませんわ。{partner}さん。
- `TAG_MATCH_LOSS_LINES.ojousama.shy[1]`: {partner}さん…ご、ごめんなさいまし…わたくしのせいで…
- `TAG_MATCH_LOSS_LINES.ojousama.shy[2]`: つ、次は…必ず…{partner}さんを勝たせますわ…！
- `TAG_MATCH_LOSS_LINES.ojousama.emotional[1]`: {partner}さんっ…ごめんなさいっ…わたくしのせいでっ…！
- `TAG_MATCH_LOSS_LINES.ojousama.emotional[2]`: 次は絶対、勝ちますわっ…！ {partner}さん…！
- `TAG_MATCH_LOSS_LINES.cool.normal[1]`: …{partner}、ごめん。決めきれ、なかった。
- `TAG_MATCH_LOSS_LINES.cool.normal[2]`: …{partner}、次は。勝つ。
- `TAG_MATCH_LOSS_LINES.cool.earnest[1]`: …{partner}、ごめん。あたしの、力不足。
- `TAG_MATCH_LOSS_LINES.cool.earnest[2]`: …繋いでくれたのに。{partner}、すまない。
- `TAG_MATCH_LOSS_LINES.cool.bold[1]`: …あたしのミスだ、{partner}。次は、返す。
- `TAG_MATCH_LOSS_LINES.cool.bold[2]`: …このまま終わらない。{partner}、倍返しだ。
- `TAG_MATCH_LOSS_LINES.cool.easygoing[1]`: …{partner}、ごめん。決められ、ちゃった。
- `TAG_MATCH_LOSS_LINES.cool.easygoing[2]`: …負けちゃった。{partner}、次は。
- `TAG_MATCH_LOSS_LINES.cool.quiet[1]`: ……{partner}、ごめん。
- `TAG_MATCH_LOSS_LINES.cool.quiet[2]`: ……{partner}に、勝ち星を渡せなかった。……次
- `TAG_MATCH_LOSS_LINES.cool.shy[1]`: …っ、{partner}…ごめん…私の、せいで…
- `TAG_MATCH_LOSS_LINES.cool.shy[2]`: …つ、次は…{partner}を、勝たせる…
- `TAG_MATCH_LOSS_LINES.cool.emotional[1]`: …っ、{partner}…ごめん。
- `TAG_MATCH_LOSS_LINES.cool.emotional[2]`: …次は、勝つ。絶対。{partner}…っ。
- `TAG_MATCH_LOSS_LINES.composed.normal[1]`: …{partner}、ごめん。決めきれなかったね。
- `TAG_MATCH_LOSS_LINES.composed.normal[2]`: …悔しいけど、{partner}。次までに、詰めようか。
- `TAG_MATCH_LOSS_LINES.composed.earnest[1]`: …{partner}、ごめん。私の力不足だ。
- `TAG_MATCH_LOSS_LINES.composed.earnest[2]`: …ここまで繋いでくれたのにな。{partner}、すまない。
- `TAG_MATCH_LOSS_LINES.composed.bold[1]`: …私のミスだ、{partner}。でも、次はこうはいかないよ。
- `TAG_MATCH_LOSS_LINES.composed.bold[2]`: …このまま終わる気はない。{partner}、次は返すから。
- `TAG_MATCH_LOSS_LINES.composed.easygoing[1]`: …{partner}、ごめんね。決められちゃった…
- `TAG_MATCH_LOSS_LINES.composed.easygoing[2]`: …あ〜あ、負けちゃった。まあ、次があるよ、{partner}。
- `TAG_MATCH_LOSS_LINES.composed.quiet[1]`: …{partner}、ごめん。
- `TAG_MATCH_LOSS_LINES.composed.quiet[2]`: …悔しいな。{partner}にも、悪い。
- `TAG_MATCH_LOSS_LINES.composed.shy[1]`: …{partner}、ご、ごめん…私のせいで…
- `TAG_MATCH_LOSS_LINES.composed.shy[2]`: …つ、次は、ちゃんと…{partner}を勝たせるよ…
- `TAG_MATCH_LOSS_LINES.composed.emotional[1]`: …{partner}、悪い。私が弱かった。…それだけだ。
- `TAG_MATCH_LOSS_LINES.composed.emotional[2]`: …次は、こうはいかない。{partner}、もう一回だけ付き合って。

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
