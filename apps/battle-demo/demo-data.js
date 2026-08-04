(function () {
  'use strict';

  const fighters = [
    {
      id: 11, name: '橘玲美', surname: '橘', h: 171,
      type: 'テクニック型', style: 'Submission', role: 'Heel',
      description: '高校生としては大人びた印象の女子高生。嗜虐的な一面を持ち、関節技と絞め技で相手を追い詰めるスタイルを好む危険な実力者。看護科で学んだ知識をプロレスに持ち込んだ独自のサブミッション技術は市内トップクラスで、一度捕まれば脱出は至難の業。',
      pw: 71, sp: 73, te: 91, st: 75, mn: 74, popularity: 50,
      traits: ['ヒール適性', '威圧感', '早熟', '華'], personality: 'normal', archetype: 'seductive',
      vl: ['…あら、もう終わり？もっと苦しむ顔が見たかったのに。', '関節が軋む音…心地いいわ。', '負けて無様な姿をさらして…　いい気味ね♪'],
      assetKey: 'tachibana_r', image: './image/upper/upper_tachibana_r.webp',
    },
    {
      id: 46, name: '井沢遥', surname: '井沢', h: 165,
      type: 'テクニック型', style: 'Submission', role: 'Babyface',
      description: 'かつて団地の実力者として尊敬を集めたが、高槻の策略で地位と友人を失い孤立。それでも折れずに５年の雌伏の後に高槻を破り地位を回復した。相手の良さを引き出しながら戦う誠実なスタイルは多くの支持を集めている。',
      pw: 68, sp: 73, te: 82, st: 64, mn: 77, popularity: 50,
      traits: ['不屈', '名勝負製造機', '引き出し上手', '負けず嫌い'], personality: 'earnest', archetype: 'standard',
      vl: ['はっ…はっ…ふぅ。やっぱり最後まであきらめないのが大事なのよね', 'いくつになっても強くなれるって、私もやっと分かってきたわ。', '応援ありがとう。次の試合も全力を尽くしますね。'],
      assetKey: 'izawa_h', image: './image/upper/upper_izawa_h.webp',
    },
    {
      id: 98, name: '米山杏里', surname: '米山', h: 169,
      type: 'バランス型', style: 'Allround', role: 'Babyface',
      description: '人望を集める生徒会長。三浦からの嫉妬を買い文化祭プロレスに出場。リーダーシップと技術が光る。引き出し上手な試合センスと生来の人望で周囲を味方につける。',
      pw: 69, sp: 64, te: 77, st: 68, mn: 71, popularity: 50,
      traits: ['ガラスの身体', 'リーダー気質', '人望', '引き出し上手'], personality: 'normal', archetype: 'polite',
      vl: ['このリングで、実力を発揮できた気がする', 'みんなの応援で勝てましたっ。ありがとうっ！', 'あなたの挑戦を受けてよかった。私の勝ちよ'],
      assetKey: 'yoneyama_a', image: './image/upper/upper_yoneyama_a.webp',
    },
    {
      id: 9, name: '宇田川里奈', surname: '宇田川', h: 167,
      type: 'スピード型', style: 'Aerial', role: 'Neutral',
      description: 'おしゃれに目覚めた自称カワイイ系女子。練習より美容にストイックだが、調子が良い時は相手を完封することも。試合では意外にもスピードを活かした巧みな立ち回りを見せることがあり、侮ると痛い目に遭う。',
      pw: 51, sp: 62, te: 54, st: 63, mn: 48, popularity: 50,
      traits: ['ファンサービス'], personality: 'easygoing', archetype: 'standard',
      vl: ['やった～♡ 今日のカワイイ私、完全勝利じゃん♪', 'いい女は、リングでも手を抜かないの♡', 'え、調子いい日だっただけ？ …まぁいいけど♪'],
      assetKey: 'udagawa_r', image: './image/upper/upper_udagawa_r.webp',
    },
    {
      id: 48, name: '菊池璃子', surname: '菊池', h: 162,
      type: '打撃型', style: 'Striker', role: 'Neutral',
      description: '粕田台団地に入居してきたちょっときつめの奥さん。前の住まいでは町内会プロレスの実力者。外には厳しく家では陽気。負けず嫌いの性格と適応力の高さで新しい環境にもすぐに溶け込んだ。打撃を軸にした攻撃的なスタイルで、闘志を前面に押し出す熱い試合を見せる。',
      pw: 74, sp: 76, te: 69, st: 71, mn: 78, popularity: 50,
      traits: ['負けず嫌い', '適応力', '闘志'], personality: 'bold', archetype: 'composed',
      vl: ['外では厳しく、家では陽気♪ …リングの上は？ もちろん全力よ！', 'わたしこれでも実力者扱いされてるのよ？あんまり舐めないでよね', 'ふぅ…調子上がってきたかな？'],
      assetKey: 'kikuchi_r', image: './image/upper/upper_kikuchi_r.webp',
    },
    {
      id: 73, name: '大馬越よし子', surname: '大馬越', h: 179,
      type: 'パワー型', style: 'Grappler', role: 'Neutral',
      description: '夏祭の奉納試合に出場した女性。威圧感のある体格と頑丈さを武器にするパワーグラップラー。179cmの体格から繰り出す豪快なグラップリングは力強さに溢れ、接近戦では無類の強さを誇る。',
      pw: 84, sp: 48, te: 56, st: 67, mn: 68, popularity: 50,
      traits: ['威圧感', '頑丈さ'], personality: 'bold', archetype: 'delinquent',
      vl: ['ああっ？ヤワな奴だなぁ？もう終わりかぁ？', 'ははっ。私にビビッて腰が引けてたなあ。それじゃ勝てないね', '大観衆の前でザコをいびるのも悪くないねぇ'],
      assetKey: 'omagoe_y', image: './image/upper/upper_omagoe_y.webp',
    },
  ].map((fighter) => Object.freeze({
    ...fighter,
    ovr: Math.round((fighter.pw + fighter.sp + fighter.te + fighter.st + fighter.mn) / 5),
  }));

  window.WMDemoData = Object.freeze({
    fighters: Object.freeze(fighters),
    opponentByPlayer: Object.freeze({ 11: 46, 46: 11, 98: 9, 9: 98, 48: 73, 73: 48 }),
    statLabels: Object.freeze([
      ['pw', 'パワー'], ['sp', 'スピード'], ['te', 'テクニック'], ['st', 'スタミナ'], ['mn', 'メンタル'],
    ]),
  });
})();
