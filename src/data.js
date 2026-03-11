// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 1: CHARACTER DATA                               ║
// ╚══════════════════════════════════════════════════════════╝
const ALL_CHARS = [
  {id:1,name:'阿武隈塔子',h:173,pw:95,sp:73,te:71,st:81,mn:80,style:'Grappler',role:'Babyface',pot:{pw:184,sp:155,te:152,st:165,mn:164},traits:['リーダー気質','人望','威圧感','引き出し上手','ガラスの身体'],personality:'normal',archetype:'normal'},
  {id:2,name:'富岡加奈子',h:168,pw:90,sp:68,te:70,st:76,mn:83,style:'Grappler',role:'Babyface',pot:{pw:177,sp:148,te:151,st:159,mn:168},traits:['努力家','頑丈さ','闘志','負けず嫌い'],personality:'bold',archetype:'ojousama'},
  {id:3,name:'澤出みずき',h:158,pw:73,sp:78,te:73,st:73,mn:72,style:'Allround',role:'Neutral',pot:{pw:155,sp:161,te:155,st:155,mn:154},traits:['引き出し上手','早熟','適応力'],personality:'normal',archetype:'normal'},
  {id:4,name:'高津小春',h:161,pw:73,sp:75,te:47,st:79,mn:91,style:'Striker',role:'Babyface',pot:{pw:155,sp:158,te:155,st:163,mn:178},traits:['晩成','番狂わせ体質','負けず嫌い','闘志','反骨心'],personality:'bold',archetype:'normal'},
  {id:5,name:'深町真琴',h:160,pw:58,sp:91,te:62,st:85,mn:63,style:'Speed',role:'Babyface',pot:{pw:135,sp:185,te:141,st:170,mn:142},traits:['努力家','華','鉄人'],personality:'earnest',archetype:'normal'},
  {id:6,name:'副沢たまき',h:161,pw:71,sp:68,te:74,st:68,mn:68,style:'Allround',role:'Neutral',pot:{pw:152,sp:148,te:156,st:148,mn:148},traits:['ムードメーカー','早熟','破天荒'],personality:'easygoing',archetype:'normal'},
  {id:7,name:'高階まさみ',h:161,pw:58,sp:62,te:73,st:63,mn:66,style:'Submission',role:'Babyface',pot:{pw:135,sp:141,te:155,st:142,mn:146},traits:['引き出し上手','忠誠心'],personality:'earnest',archetype:'polite'},
  {id:8,name:'林真尋',h:174,pw:71,sp:73,te:43,st:61,mn:52,style:'Striker',role:'Neutral',pot:{pw:152,sp:155,te:116,st:139,mn:128},traits:['負けず嫌い'],personality:'normal',archetype:'normal'},
  {id:9,name:'宇田川里奈',h:167,pw:51,sp:62,te:54,st:63,mn:41,style:'Speed',role:'Neutral',pot:{pw:126,sp:141,te:130,st:142,mn:113},traits:['ファンサービス'],personality:'easygoing',archetype:'normal'},
  {id:11,name:'橘玲美',h:171,pw:71,sp:73,te:91,st:75,mn:74,style:'Submission',role:'Heel',pot:{pw:152,sp:155,te:178,st:158,mn:156},traits:['ヒール適性','威圧感','早熟','華'],personality:'normal',archetype:'seductive'},
  {id:12,name:'生駒エリカ',h:153,pw:78,sp:71,te:55,st:82,mn:82,style:'Grappler',role:'Heel',pot:{pw:161,sp:152,te:156,st:167,mn:167},traits:['負けず嫌い','闘志','鉄人','人望','反骨心'],personality:'bold',archetype:'delinquent'},
  {id:13,name:'堂前ユキ',h:163,pw:81,sp:84,te:43,st:64,mn:73,style:'Striker',role:'Neutral',pot:{pw:165,sp:169,te:128,st:143,mn:155},traits:['破天荒'],personality:'bold',archetype:'cool'},
  {id:14,name:'黒江舞',h:159,pw:48,sp:52,te:76,st:58,mn:67,style:'Submission',role:'Heel',pot:{pw:122,sp:128,te:159,st:135,mn:147},traits:['ヒール適性','早熟'],personality:'quiet',archetype:'normal'},
  {id:15,name:'楠木なぎさ',h:178,pw:79,sp:65,te:21,st:66,mn:62,style:'Brawler',role:'Babyface',pot:{pw:163,sp:144,te:121,st:146,mn:141},traits:['威圧感'],personality:'normal',archetype:'normal'},
  {id:16,name:'大河内紗代子',h:164,pw:93,sp:76,te:66,st:69,mn:77,style:'Grappler',role:'Heel',pot:{pw:181,sp:159,te:146,st:150,mn:160},traits:['リーダー気質','威圧感','華','野心'],personality:'normal',archetype:'ojousama'},
  {id:17,name:'川野辺菜穂子',h:168,pw:66,sp:80,te:69,st:71,mn:76,style:'Speed',role:'Babyface',pot:{pw:146,sp:164,te:150,st:152,mn:159},traits:['ライバル体質','名勝負製造機','華','負けず嫌い'],personality:'earnest',archetype:'polite'},
  {id:18,name:'出羽鷹子',h:184,pw:85,sp:54,te:75,st:66,mn:62,style:'Grappler',role:'Heel',pot:{pw:170,sp:130,te:158,st:146,mn:141},traits:['適応力'],personality:'bold',archetype:'delinquent'},
  {id:19,name:'四条あずさ',h:163,pw:64,sp:68,te:62,st:67,mn:62,style:'Allround',role:'Neutral',pot:{pw:143,sp:148,te:141,st:147,mn:141},traits:['忠誠心','適応力'],personality:'earnest',archetype:'ojousama'},
  {id:20,name:'岸ゆみえ',h:155,pw:48,sp:53,te:78,st:64,mn:78,style:'Submission',role:'Babyface',pot:{pw:122,sp:149,te:161,st:155,mn:161},traits:['努力家','遅咲き'],personality:'normal',archetype:'normal'},
  {id:21,name:'木ノ内幸音',h:164,pw:66,sp:53,te:53,st:68,mn:67,style:'Allround',role:'Babyface',pot:{pw:146,sp:129,te:129,st:148,mn:147},traits:['ヒール適性','ムードメーカー','華'],personality:'earnest',archetype:'normal'},
  {id:22,name:'美濃山まりな',h:173,pw:80,sp:38,te:48,st:59,mn:48,style:'Brawler',role:'Neutral',pot:{pw:164,sp:109,te:122,st:137,mn:122},traits:['ヒール適性'],personality:'bold',archetype:'delinquent'},
  {id:23,name:'早見知子',h:162,pw:51,sp:43,te:42,st:51,mn:41,style:'Striker',role:'Heel',pot:{pw:126,sp:116,te:115,st:126,mn:113},traits:['適応力'],personality:'normal',archetype:'normal'},
  {id:24,name:'園部梨花',h:158,pw:46,sp:48,te:41,st:42,mn:43,style:'Allround',role:'Heel',pot:{pw:120,sp:122,te:113,st:115,mn:116},traits:[],personality:'bold',archetype:'normal'},
  {id:25,name:'石戸谷なつき',h:164,pw:61,sp:31,te:34,st:45,mn:38,style:'Brawler',role:'Heel',pot:{pw:139,sp:100,te:104,st:118,mn:109},traits:['早熟'],personality:'easygoing',archetype:'delinquent'},
  {id:26,name:'宮守なつめ',h:165,pw:62,sp:72,te:58,st:66,mn:63,style:'Allround',role:'Babyface',pot:{pw:141,sp:154,te:135,st:146,mn:142},traits:['努力家','早熟'],personality:'earnest',archetype:'polite'},
  {id:27,name:'八重樫舞',h:167,pw:71,sp:63,te:42,st:66,mn:51,style:'Striker',role:'Babyface',pot:{pw:152,sp:142,te:115,st:146,mn:126},traits:['鉄人'],personality:'normal',archetype:'normal'},
  {id:28,name:'岩屋みら',h:169,pw:82,sp:74,te:62,st:55,mn:61,style:'Brawler',role:'Neutral',pot:{pw:167,sp:156,te:141,st:132,mn:139},traits:['ガラスの身体','早熟','鉄人'],personality:'bold',archetype:'delinquent'},
  {id:29,name:'相沢未来',h:162,pw:73,sp:74,te:62,st:78,mn:74,style:'Allround',role:'Babyface',pot:{pw:155,sp:156,te:141,st:161,mn:156},traits:['人望','鉄人'],personality:'normal',archetype:'normal'},
  {id:30,name:'松川杏樹',h:174,pw:76,sp:65,te:71,st:63,mn:71,style:'Grappler',role:'Neutral',pot:{pw:159,sp:144,te:152,st:142,mn:152},traits:['ムードメーカー','破天荒'],personality:'easygoing',archetype:'normal'},
  {id:31,name:'平松かなみ',h:158,pw:66,sp:58,te:75,st:72,mn:70,style:'Submission',role:'Babyface',pot:{pw:146,sp:135,te:158,st:154,mn:151},traits:['晩成','不屈'],personality:'quiet',archetype:'polite'},
  {id:32,name:'双里明日香',h:161,pw:54,sp:61,te:68,st:67,mn:60,style:'Submission',role:'Babyface',pot:{pw:130,sp:139,te:148,st:147,mn:138},traits:['負けず嫌い'],personality:'earnest',archetype:'normal'},
  {id:33,name:'梅ヶ丘みのり',h:163,pw:78,sp:71,te:76,st:80,mn:80,style:'Allround',role:'Babyface',pot:{pw:161,sp:152,te:159,st:164,mn:164},traits:['リーダー気質','負けず嫌い'],personality:'earnest',archetype:'normal'},
  {id:34,name:'北畠吉乃',h:162,pw:68,sp:72,te:84,st:72,mn:69,style:'Submission',role:'Neutral',pot:{pw:148,sp:154,te:169,st:154,mn:150},traits:['破天荒','早熟','努力家'],personality:'normal',archetype:'normal'},
  {id:35,name:'上野原弥生',h:179,pw:82,sp:58,te:63,st:68,mn:58,style:'Grappler',role:'Neutral',pot:{pw:167,sp:135,te:142,st:148,mn:135},traits:['頑丈さ'],personality:'bold',archetype:'normal'},
  {id:36,name:'真鍋綾乃',h:181,pw:80,sp:54,te:65,st:63,mn:60,style:'Grappler',role:'Neutral',pot:{pw:164,sp:130,te:144,st:142,mn:138},traits:['頑丈さ'],personality:'earnest',archetype:'normal'},
  {id:37,name:'白銀麗子',h:165,pw:74,sp:82,te:82,st:83,mn:78,style:'Allround',role:'Babyface',pot:{pw:156,sp:167,te:167,st:168,mn:161},traits:['不屈','華','頑丈さ'],personality:'earnest',archetype:'normal'},
  {id:38,name:'芝彩音',h:168,pw:88,sp:64,te:67,st:78,mn:76,style:'Grappler',role:'Babyface',pot:{pw:174,sp:143,te:147,st:161,mn:159},traits:['華','闘志'],personality:'bold',archetype:'ojousama'},
  {id:39,name:'神谷沙奈絵',h:161,pw:63,sp:76,te:64,st:65,mn:52,style:'Striker',role:'Neutral',pot:{pw:138,sp:159,te:143,st:144,mn:128},traits:['忠誠心'],personality:'quiet',archetype:'cool'},
  {id:40,name:'高輪まみ',h:149,pw:51,sp:67,te:54,st:71,mn:71,style:'Allround',role:'Babyface',pot:{pw:126,sp:147,te:130,st:152,mn:152},traits:['頑丈さ'],personality:'earnest',archetype:'normal'},
  {id:41,name:'根岸亞里亞',h:163,pw:68,sp:73,te:81,st:71,mn:71,style:'Submission',role:'Heel',pot:{pw:148,sp:155,te:165,st:152,mn:152},traits:['ヒール適性','早熟'],personality:'easygoing',archetype:'seductive'},
  {id:42,name:'本郷真理子',h:170,pw:88,sp:67,te:49,st:66,mn:71,style:'Grappler',role:'Heel',pot:{pw:174,sp:147,te:124,st:146,mn:152},traits:['ヒール適性','威圧感'],personality:'bold',archetype:'delinquent'},
  {id:43,name:'金沢文',h:181,pw:84,sp:59,te:48,st:58,mn:62,style:'Grappler',role:'Neutral',pot:{pw:169,sp:137,te:122,st:135,mn:141},traits:['頑丈さ'],personality:'normal',archetype:'delinquent'},
  {id:44,name:'福浦理乃',h:153,pw:46,sp:53,te:49,st:44,mn:43,style:'Allround',role:'Heel',pot:{pw:120,sp:129,te:124,st:117,mn:116},traits:[],personality:'normal',archetype:'normal'},
  {id:45,name:'高槻千歳',h:164,pw:71,sp:77,te:79,st:74,mn:74,style:'Allround',role:'Heel',pot:{pw:152,sp:160,te:163,st:156,mn:156},traits:['リーダー気質','華','野心'],personality:'normal',archetype:'seductive'},
  {id:46,name:'井沢遥',h:165,pw:68,sp:73,te:82,st:64,mn:77,style:'Submission',role:'Babyface',pot:{pw:148,sp:155,te:167,st:143,mn:160},traits:['不屈','名勝負製造機','引き出し上手','負けず嫌い'],personality:'earnest',archetype:'normal'},
  {id:47,name:'斎藤麻衣',h:156,pw:64,sp:68,te:76,st:69,mn:73,style:'Striker',role:'Neutral',pot:{pw:143,sp:141,te:146,st:150,mn:155},traits:['早熟'],personality:'bold',archetype:'normal'},
  {id:48,name:'菊池璃子',h:162,pw:73,sp:69,te:53,st:65,mn:78,style:'Striker',role:'Neutral',pot:{pw:155,sp:150,te:142,st:144,mn:161},traits:['負けず嫌い','適応力','闘志'],personality:'bold',archetype:'normal'},
  {id:49,name:'高橋まゆみ',h:161,pw:65,sp:60,te:57,st:73,mn:79,style:'Allround',role:'Babyface',pot:{pw:144,sp:144,te:145,st:155,mn:163},traits:['努力家','忠誠心','遅咲き'],personality:'earnest',archetype:'polite'},
  {id:50,name:'相田萌',h:156,pw:64,sp:63,te:63,st:67,mn:55,style:'Allround',role:'Neutral',pot:{pw:143,sp:142,te:142,st:147,mn:132},traits:['ファンサービス','適応力'],personality:'emotional',archetype:'normal'},
  {id:51,name:'三橋ふみえ',h:172,pw:63,sp:59,te:81,st:58,mn:50,style:'Submission',role:'Neutral',pot:{pw:142,sp:137,te:165,st:135,mn:125},traits:['ヒール適性','ファンサービス'],personality:'emotional',archetype:'normal'},
  {id:52,name:'西川ちあき',h:171,pw:68,sp:58,te:48,st:58,mn:54,style:'Striker',role:'Heel',pot:{pw:148,sp:135,te:122,st:135,mn:135},traits:[],personality:'normal',archetype:'normal'},
  {id:53,name:'小森さなえ',h:164,pw:68,sp:48,te:38,st:58,mn:60,style:'Brawler',role:'Neutral',pot:{pw:148,sp:122,te:109,st:135,mn:138},traits:['ムードメーカー'],personality:'normal',archetype:'normal'},
  {id:54,name:'阿部みのり',h:154,pw:43,sp:40,te:38,st:48,mn:50,style:'Allround',role:'Babyface',pot:{pw:122,sp:135,te:138,st:128,mn:144},traits:[],personality:'shy',archetype:'polite'},
  {id:55,name:'大久保桃子',h:163,pw:72,sp:73,te:74,st:71,mn:80,style:'Allround',role:'Babyface',pot:{pw:154,sp:155,te:156,st:152,mn:164},traits:['不屈','鉄人','頑丈さ'],personality:'earnest',archetype:'polite'},
  {id:56,name:'片桐ありさ',h:167,pw:68,sp:63,te:80,st:68,mn:68,style:'Submission',role:'Neutral',pot:{pw:148,sp:142,te:164,st:148,mn:148},traits:['ヒール適性','ライバル体質','野心'],personality:'bold',archetype:'seductive'},
  {id:57,name:'浅見里緒菜',h:158,pw:60,sp:58,te:74,st:61,mn:68,style:'Submission',role:'Heel',pot:{pw:138,sp:135,te:156,st:139,mn:148},traits:['リーダー気質','早熟','負けず嫌い','野心'],personality:'normal',archetype:'seductive'},
  {id:58,name:'丹羽穂垂',h:169,pw:76,sp:54,te:63,st:64,mn:57,style:'Allround',role:'Neutral',pot:{pw:159,sp:130,te:142,st:143,mn:134},traits:['引き出し上手','負けず嫌い'],personality:'earnest',archetype:'normal'},
  {id:59,name:'池辺マリ',h:162,pw:70,sp:51,te:40,st:62,mn:53,style:'Brawler',role:'Heel',pot:{pw:151,sp:126,te:112,st:141,mn:129},traits:['負けず嫌い'],personality:'bold',archetype:'delinquent'},
  {id:60,name:'馬入橋ほとり',h:157,pw:82,sp:68,te:59,st:70,mn:78,style:'Grappler',role:'Babyface',pot:{pw:167,sp:148,te:137,st:151,mn:161},traits:['早熟','鉄人','頑丈さ'],personality:'earnest',archetype:'normal'},
  {id:61,name:'観音崎せりか',h:169,pw:73,sp:73,te:67,st:63,mn:66,style:'Allround',role:'Heel',pot:{pw:155,sp:155,te:147,st:142,mn:146},traits:['ヒール適性','華','野心'],personality:'normal',archetype:'normal'},
  {id:62,name:'宮ケ瀬千夏',h:169,pw:70,sp:66,te:40,st:66,mn:50,style:'Brawler',role:'Heel',pot:{pw:151,sp:146,te:112,st:146,mn:125},traits:['ヒール適性','威圧感'],personality:'bold',archetype:'delinquent'},
  {id:63,name:'伊勢原文奈',h:158,pw:53,sp:58,te:56,st:55,mn:55,style:'Allround',role:'Babyface',pot:{pw:129,sp:135,te:133,st:132,mn:132},traits:['忠誠心'],personality:'earnest',archetype:'normal'},
  {id:64,name:'湯本ほたる',h:160,pw:52,sp:58,te:51,st:54,mn:48,style:'Allround',role:'Neutral',pot:{pw:128,sp:135,te:126,st:130,mn:122},traits:[],personality:'easygoing',archetype:'normal'},
  {id:65,name:'倉見菜々',h:161,pw:72,sp:73,te:77,st:79,mn:84,style:'Allround',role:'Neutral',pot:{pw:154,sp:155,te:160,st:163,mn:169},traits:['ファンサービス','名勝負製造機'],personality:'normal',archetype:'normal'},
  {id:66,name:'長谷川レオナ',h:164,pw:78,sp:70,te:78,st:69,mn:78,style:'Allround',role:'Neutral',pot:{pw:161,sp:151,te:161,st:150,mn:161},traits:['人望','引き出し上手'],personality:'normal',archetype:'seductive'},
  {id:67,name:'柳島みずほ',h:165,pw:83,sp:61,te:68,st:73,mn:83,style:'Grappler',role:'Babyface',pot:{pw:168,sp:139,te:148,st:155,mn:168},traits:['ファンサービス','華','野心'],personality:'normal',archetype:'normal'},
  {id:68,name:'大庭愛菜',h:155,pw:68,sp:77,te:52,st:70,mn:76,style:'Striker',role:'Neutral',pot:{pw:148,sp:160,te:128,st:151,mn:159},traits:['負けず嫌い'],personality:'emotional',archetype:'normal'},
  {id:69,name:'早川モナ',h:162,pw:63,sp:74,te:63,st:74,mn:64,style:'Speed',role:'Babyface',pot:{pw:142,sp:156,te:142,st:156,mn:143},traits:['華','負けず嫌い'],personality:'normal',archetype:'normal'},
  {id:70,name:'浜竹美咲',h:167,pw:80,sp:57,te:63,st:68,mn:68,style:'Grappler',role:'Neutral',pot:{pw:164,sp:134,te:142,st:148,mn:148},traits:['引き出し上手','忠誠心'],personality:'normal',archetype:'normal'},
  {id:71,name:'東金沙織',h:167,pw:70,sp:62,te:69,st:62,mn:67,style:'Allround',role:'Neutral',pot:{pw:145,sp:134,te:150,st:141,mn:147},traits:['ファンサービス'],personality:'normal',archetype:'normal'},
  {id:72,name:'穴澤ほのか',h:168,pw:74,sp:58,te:65,st:63,mn:70,style:'Grappler',role:'Neutral',pot:{pw:156,sp:135,te:144,st:142,mn:151},traits:['ファンサービス','引き出し上手','野心'],personality:'normal',archetype:'seductive'},
  {id:73,name:'大馬越よし子',h:179,pw:84,sp:48,te:56,st:67,mn:68,style:'Grappler',role:'Neutral',pot:{pw:169,sp:122,te:148,st:147,mn:148},traits:['威圧感','頑丈さ'],personality:'bold',archetype:'normal'},
  {id:74,name:'富士見ヶ丘遥',h:164,pw:60,sp:68,te:58,st:66,mn:70,style:'Allround',role:'Babyface',pot:{pw:138,sp:148,te:135,st:146,mn:151},traits:['ファンサービス'],personality:'earnest',archetype:'polite'},
  {id:75,name:'海老名栞',h:159,pw:53,sp:58,te:67,st:63,mn:80,style:'Submission',role:'Babyface',pot:{pw:129,sp:135,te:147,st:142,mn:164},traits:['ファンサービス','ライバル体質','野心'],personality:'easygoing',archetype:'normal'},
  {id:76,name:'栗林あかり',h:153,pw:68,sp:68,te:40,st:66,mn:58,style:'Striker',role:'Neutral',pot:{pw:148,sp:148,te:112,st:146,mn:135},traits:['ライバル体質','負けず嫌い'],personality:'earnest',archetype:'normal'},
  {id:77,name:'新見ゆり',h:168,pw:66,sp:57,te:63,st:54,mn:53,style:'Allround',role:'Neutral',pot:{pw:146,sp:134,te:142,st:130,mn:129},traits:['引き出し上手'],personality:'earnest',archetype:'seductive'},
  {id:78,name:'椿山みさき',h:163,pw:58,sp:54,te:51,st:63,mn:60,style:'Allround',role:'Babyface',pot:{pw:137,sp:130,te:141,st:142,mn:138},traits:['引き出し上手','華','負けず嫌い'],personality:'normal',archetype:'normal'},
  {id:79,name:'久堂梨々花',h:156,pw:67,sp:63,te:46,st:56,mn:38,style:'Brawler',role:'Heel',pot:{pw:147,sp:142,te:120,st:133,mn:133},traits:['ヒール適性'],personality:'bold',archetype:'delinquent'},
  {id:80,name:'高島さや',h:145,pw:21,sp:32,te:19,st:18,mn:19,style:'Allround',role:'Babyface',pot:{pw:129,sp:164,te:166,st:132,mn:85},traits:['ファンサービス','ムードメーカー'],personality:'shy',archetype:'polite'},
  // ── 新規キャラクター（v1.4 GameID 81〜99）──
  {id:81,name:'坂本莉衣奈',h:153,pw:68,sp:76,te:65,st:78,mn:77,style:'Speed',role:'Neutral',pot:{pw:148,sp:159,te:144,st:161,mn:160},traits:['ムードメーカー'],personality:'normal',archetype:'normal'},
  {id:82,name:'近藤ゆりか',h:166,pw:84,sp:55,te:67,st:80,mn:69,style:'Grappler',role:'Neutral',pot:{pw:169,sp:132,te:147,st:164,mn:150},traits:['番狂わせ体質'],personality:'earnest',archetype:'normal'},
  {id:83,name:'佐久間ひより',h:151,pw:61,sp:58,te:48,st:56,mn:68,style:'Allround',role:'Babyface',pot:{pw:139,sp:135,te:122,st:133,mn:148},traits:['負けず嫌い'],personality:'earnest',archetype:'normal'},
  {id:84,name:'南谷杏',h:166,pw:65,sp:56,te:63,st:59,mn:50,style:'Allround',role:'Neutral',pot:{pw:144,sp:133,te:142,st:137,mn:125},traits:['ファンサービス'],personality:'bold',archetype:'normal'},
  {id:85,name:'鴨志田ルーシー',h:172,pw:74,sp:58,te:43,st:69,mn:73,style:'Grappler',role:'Neutral',pot:{pw:156,sp:135,te:116,st:150,mn:155},traits:['頑丈さ'],personality:'earnest',archetype:'normal'},
  {id:86,name:'芹沢亜里紗',h:166,pw:70,sp:70,te:53,st:58,mn:61,style:'Allround',role:'Heel',pot:{pw:151,sp:151,te:129,st:135,mn:139},traits:['ファンサービス'],personality:'emotional',archetype:'seductive'},
  {id:87,name:'レオナ・O・シュタインフェルト',h:152,pw:72,sp:77,te:43,st:65,mn:68,style:'Speed',role:'Babyface',pot:{pw:154,sp:160,te:116,st:144,mn:148},traits:['華'],personality:'earnest',archetype:'normal'},
  {id:88,name:'愛川明日香',h:162,pw:52,sp:54,te:70,st:65,mn:48,style:'Allround',role:'Heel',pot:{pw:128,sp:130,te:151,st:144,mn:122},traits:[],personality:'normal',archetype:'seductive'},
  {id:89,name:'赤羽あんな',h:163,pw:73,sp:75,te:64,st:69,mn:68,style:'Speed',role:'Neutral',pot:{pw:155,sp:158,te:143,st:150,mn:148},traits:['ファンサービス'],personality:'bold',archetype:'normal'},
  {id:90,name:'玉手すみれ',h:161,pw:69,sp:58,te:56,st:81,mn:81,style:'Grappler',role:'Neutral',pot:{pw:150,sp:135,te:133,st:165,mn:165},traits:['努力家'],personality:'quiet',archetype:'polite'},
  {id:91,name:'等々力あかね',h:170,pw:71,sp:72,te:68,st:74,mn:68,style:'Allround',role:'Neutral',pot:{pw:152,sp:154,te:148,st:156,mn:148},traits:['負けず嫌い'],personality:'earnest',archetype:'normal'},
  {id:92,name:'飯島冴子',h:170,pw:66,sp:58,te:69,st:46,mn:44,style:'Submission',role:'Neutral',pot:{pw:146,sp:135,te:137,st:120,mn:117},traits:['忠誠心'],personality:'normal',archetype:'seductive'},
  {id:93,name:'松久保伊織',h:163,pw:61,sp:64,te:69,st:59,mn:54,style:'Grappler',role:'Babyface',pot:{pw:139,sp:143,te:150,st:137,mn:130},traits:['忠誠心','早熟'],personality:'normal',archetype:'normal'},
  {id:94,name:'須藤美月',h:158,pw:58,sp:58,te:65,st:48,mn:45,style:'Submission',role:'Heel',pot:{pw:135,sp:135,te:144,st:122,mn:118},traits:['ヒール適性'],personality:'normal',archetype:'normal'},
  {id:95,name:'小西ゆきえ',h:165,pw:57,sp:63,te:77,st:61,mn:74,style:'Allround',role:'Neutral',pot:{pw:134,sp:142,te:160,st:139,mn:156},traits:['ガラスの身体','ファンサービス','早熟'],personality:'normal',archetype:'normal'},
  {id:96,name:'松下真理亜',h:171,pw:72,sp:71,te:65,st:68,mn:58,style:'Allround',role:'Neutral',pot:{pw:154,sp:152,te:144,st:148,mn:135},traits:['ファンサービス','早熟'],personality:'normal',archetype:'normal'},
  {id:97,name:'岩崎みどり',h:158,pw:70,sp:79,te:48,st:74,mn:62,style:'Allround',role:'Neutral',pot:{pw:151,sp:163,te:122,st:156,mn:141},traits:['努力家','負けず嫌い','頑丈さ'],personality:'earnest',archetype:'normal'},
  {id:98,name:'米山杏里',h:169,pw:69,sp:64,te:77,st:68,mn:71,style:'Allround',role:'Babyface',pot:{pw:150,sp:143,te:160,st:148,mn:152},traits:['ガラスの身体','リーダー気質','人望','引き出し上手'],personality:'normal',archetype:'normal'},
  {id:99,name:'三浦早紀',h:166,pw:76,sp:73,te:74,st:78,mn:65,style:'Grappler',role:'Babyface',pot:{pw:159,sp:155,te:156,st:161,mn:144},traits:['ファンサービス','ライバル体質','早熟'],personality:'bold',archetype:'normal'}
];
// Character profiles (brief bios for fighter popup) — v1.4 全99名
const CHAR_PROFILES = {
  1:'抜きん出た体格とパワーで粕田市内最強と謳われた伝説のレスラー。面倒見が良く人望も厚い。パワーボムと強烈なラリアットを武器に圧倒的な存在感で対戦相手を飲み込む。',
  2:'幼少期は病弱だったが、不屈の精神でリハビリを乗り越えパワーレスラーへと変貌した鉄腕令嬢。メイドの高階とともに鍛錬を重ね、市内有数のパワーファイターに成長した。',
  3:'やさしげな雰囲気で目立たない印象だが、確かな力を秘める隠れた実力者。家庭の事情で転校して粕田学園を離れた。どんな相手にも柔軟に対応できる器用さが最大の武器で、試合展開を読む力にも優れる。',
  4:'剣道仕込みの闘志で格上にも決して引かない負けず嫌い。技術は粗削りだがメンタルの強さは粕田随一。試合終盤に底力を発揮するタイプで、何度打ちのめされても立ち上がる不屈の精神は観客の心を掴む。将来の技術向上次第では大化けする可能性を秘めた逸材。',
  5:'陸上部の快足女子。ストイックに鍛え上げた脚力から繰り出すスピードと蹴り技で相手を翻弄する実力者。短距離走で鍛えた爆発的な加速力はリングでも遺憾なく発揮される。飛び技・蹴り技の切れ味は一級品。',
  6:'器用さが光る万能型マイペース娘。やる気を出した時の対応力は目を見張るものがあるが、普段はのんびりペース。中学時代は生駒のクラスメート。なにやら因縁がある様子。',
  7:'富岡家の専属メイドにして忠実な護衛。関節技のセンスに光るものがあり、お嬢様を支えながら地道に力をつけている。お嬢様を守るためなら自らの身を盾にすることも厭わない献身的な性格。',
  8:'バスケ部所属の長身ファイター。運動部の仲間たちとも交流がある。打撃に光るものはあるが技術面に課題を残す。174cmの長身から繰り出すリーチの長い打撃は脅威だが、グラウンドに持ち込まれると苦戦する傾向がある。',
  9:'おしゃれに目覚めた自称カワイイ系女子。練習より美容にストイックだが、調子が良い時は相手を完封することも。試合では意外にもスピードを活かした巧みな立ち回りを見せることがあり、侮ると痛い目に遭う。',
  11:'高校生としては大人びた印象の女子高生。嗜虐的な一面を持ち、関節技と絞め技で相手を追い詰めるスタイルを好む危険な実力者。看護科で学んだ知識をプロレスに持ち込んだ独自のサブミッション技術は市内トップクラスで、一度捕まれば脱出は至難の業。',
  12:'小柄ながら体格に似合わぬパワーと不屈の闘志で相手をねじ伏せる。153cmの小さな体に宿る闘志は誰よりも激しく、タフネスと根性で大型選手にも真っ向から立ち向かう。チームメイトからの信頼も厚く、頼もしいリーダー格。',
  13:'口数は極めて少ない打撃戦の申し子。一撃必殺を理想とする戦闘狂。鍛え抜かれた拳足から繰り出される打撃はスピードとパワーを兼ね備え、試合が始まれば相手を容赦なく打ち抜く。寡黙ゆえに何を考えているか掴みにくく、対戦相手に不気味な圧を与える。',
  14:'地下プロレスで卑怯ファイトに目覚めた小心者の優等生。リングに上がるとS性が豹変する二面性の持ち主。普段はおとなしく控えめな生徒だが、リングに上がると目つきが変わりサディスティックな関節技を執拗に仕掛ける。その変貌ぶりは見る者をゾッとさせるが妙な人気がある。',
  15:'哲玖高校一のパワーを誇る重戦車。生駒と橘を慕う忠義者だが、身内以外には非常に冷淡で攻撃的。178cmの長身と圧倒的なパワーで相手を力任せにねじ伏せる。',
  16:'名家・大河内家の令嬢にして摺出川女学院を支配する女帝。高いカリスマ性と冷酷さで学園に君臨する。全国から実力者を編入させる権力と資金力を持ち、自らも卓越した身体能力で頂点に立つ。その支配欲と野心は留まるところを知らず、粕田市全体の覇権をも狙う。',
  17:'強敵との対戦が多く敗戦続きの印象だが、大河内を破った実績を持つ名勝負製造機。ピアノの腕前はプロ級。どんな相手とも噛み合う天性の試合センスを持ち、彼女の試合は常に見応えがある。繊細な感性と華やかな存在感で、勝敗に関わらずファンの心を掴む稀有な存在。',
  18:'大河内が全国から呼び寄せた編入組の一角。市内屈指の体格とパワーは阿武隈にも引けを取らない。184cmの長身から繰り出す豪快なパワー殺法が武器。試合中に相手のスタイルに合わせた戦術変更もこなせる器用さを併せ持つ。',
  19:'大河内軍団の実力者の中では珍しい一般入学組。心情的にも大河内に心酔する忠実な信奉者。万能型のオールラウンダーで目立った弱点はないが、決定打に欠ける部分がある。大河内への忠誠心は本物で、命じられれば捨て駒も厭わない覚悟を持つ。',
  20:'冷静沈着な戦術眼で相手を観察して戦うデータ至上主義者。身体能力には不安があるが技術で補う。相手の癖を瞬時に見抜く観察眼は試合を重ねるごとに磨かれている。努力を積み重ねる姿勢は衰えず、長期的な成長が期待される知性派。',
  21:'橘玲美に憧れてヒールを目指す天然娘。声が大きくてうるさい。技術は拙いがタフネスは侮れない。ヒールを名乗るわりには素の明るさが抑えられず、観客を楽しませるムードメーカー的存在。華のある振る舞いで独自のファン層を獲得しつつある。',
  22:'大河内直属親衛隊。巨体で相手を押しつぶすラフファイトが持ち味の重量級ブロウラー。その体格を活かしたパワフルな攻撃は、単純だが破壊力は抜群。',
  23:'大河内の取り巻き。昔空手をかじっていたらしいが、全体的な能力は低い。',
  24:'大河内の取り巻きのリーダー気取り。実力は伴わないが、数の力で威張り散らす小物。',
  25:'大河内の取り巻き。パワーはありそうだが頭は悪そう。鈍重なブロウラー。',
  26:'廃校寸前の元砥石川高校出身。バランス重視の堅実なファイトで確かな実力を見せる。母校の廃校を経験した苦い思い出をバネに、早くから自立心を鍛えてきた。安定感のある試合運びと粘り強さで、どんな相手にも一定以上の戦いができる信頼のおける選手。',
  27:'元砥石川高校出身。身体能力に物を言わせるパワー＆スピードタイプ。タフネスにも定評がある。鉄人と呼ぶにふさわしい頑健な肉体で怪我知らずのタフさが最大の武器。技術面の課題を克服できれば、トップ選手の仲間入りも夢ではないポテンシャルを秘める。',
  28:'元哲玖四天王の一人で女子大生地下レスラー。パワーとスピードを兼ね備えるが、スタミナに不安を抱える。全盛期の爆発力は市内でも屈指だったが、怪我がちな体質が最大の弱点。',
  29:'無名校・奥山川を県大会決勝まで導いたプロレス部主将。膝のケガを乗り越えた不屈のキャプテン。逆境に立たされるほど力を発揮するタイプで、チームメイトからの信頼は絶大。',
  30:'奥山川高校に転校してきた174cmの大型選手。ムードメーカー気質で、チームの全国大会出場の夢を後押しする。恵まれた体格を活かしたグラップリングが武器で、型破りな発想で相手を翻弄することもある。陽気な性格でチームの雰囲気を明るくする欠かせない存在。',
  31:'奥山川プロレス部の副キャプテン。友人を元気づけるため始めた部活で競技の楽しさに目覚めた。関節技を中心とした技巧派で、晩成型として将来の成長が最も期待される選手の一人。控えめな性格だが、いざ試合になると粘り強さを発揮する。',
  32:'小学生時代は注目のサブミッション使いだったが伸び悩んだ過去を持つ。奥山川で情熱を取り戻した1年生。かつての天才少女が挫折を乗り越えて再起を図る姿は、チームメイトにも良い刺激を与えている。負けず嫌いの性格が闘争心に火をつけた時、その技術は確かな輝きを見せる。',
  33:'名門・岬浜女子の主将。おしとやかな容貌ながら努力で掴んだ実力で全国制覇を目指す。抜きん出た才能はないが、あらゆる面でハイレベルにまとまった総合力の高さが武器。チームを率いるリーダーシップにも優れ、部員たちから深い敬意を集めている。',
  34:'1年時からレギュラーの才能の塊。特にグラウンド技術に優れる岬浜の副将。梅ヶ丘を深く信頼している。早熟型の天才肌で、技術面では上級生すら凌ぐセンスの持ち主。型破りな閃きで試合を動かす反面、安定感に欠ける一面もあるが、その潜在能力は計り知れない。',
  35:'中学から急成長し特待生で岬浜に入学した大型1年生。「岬浜のツインタワー」の一角を担う将来の逸材。179cmの恵まれた体格を活かしたパワーグラップリングが武器で、頑丈さも折り紙付き。まだ粗削りだが成長の余地は大きく、名門校の未来を担う存在として期待される。',
  36:'181cmの長身を誇り上野原と並ぶ「岬浜のツインタワー」。格闘技仕込みの実践的テクで次期主将候補。上野原との二枚看板として岬浜の最前線を支えるパワーグラップラー。冷静な試合運びと堅実な防御力で安定した試合ができる信頼度の高い選手。',
  37:'名門・姫宮女子の主将。「柔の白銀」「姫宮の白雪姫」と呼ばれる容姿端麗な人気レスラー。バランスの取れた高い総合力と、どんな窮地でも折れない不屈の精神力が最大の武器。優雅で華麗な試合スタイルは多くのファンを魅了し、全国的にも知名度の高いトップレスラー。',
  38:'姫宮の副主将にして「剛の芝」の異名を持つ二枚看板の一角。お嬢様揃いの中でも一番のお嬢様。品の良い立ち居振る舞いからは想像できない圧倒的なパワーと組み技で相手をねじ伏せる。白銀とは対照的な剛のスタイルで、互いを補い合う姫宮の屋台骨。',
  39:'キレのある打撃コンビネーションに定評がある寡黙な2年生。次期キャプテンと目される実力者。試合中は冷静沈着だが、一度スイッチが入ると容赦のないスピードで相手を追い込む。次世代の姫宮を牽引する逸材。',
  40:'小柄だがタフネスとスタミナで後半も攻め手を緩めない有望株。1年生からレギュラーを掴んだ努力家。149cmと最小クラスの体格だが、粘りで大型選手にも食らいつく姿は観客の応援を集める。地道な努力を積み重ねるタイプで、着実に実力を伸ばしている。',
  41:'三津浜高校プロレス部のリーダー格。サブミッション技術は相当なもので、自由奔放な発想から繰り出す変則的な攻めは対策が難しい。ヒール寄りのスタイルだが本人は深く考えておらず、ただ好きに戦いたいだけの享楽主義者。',
  42:'三津浜の3年生。路上格闘の実戦経験も豊富で、ルール無用の喧嘩ファイトは得意中の得意。豪快なパワーグラップリングと場外乱闘を厭わないラフスタイルが持ち味。一見粗暴だが試合の組み立てには独自の勘所を持ち、ダーティな駆け引きにも長けている。',
  43:'三津浜随一の怪力を誇る2年生。頭の回転は鈍いがパワーは圧倒的。気の向くまま暴れる問題児。181cmの巨体から繰り出すパワームーブは圧巻で、掴まれたら最後逃れるのは至難の業。試合運びは大雑把だが、その破壊力だけで勝ちを拾えるほどの怪力は唯一無二。',
  44:'三津浜の1年生レギュラー。腕力が売りだがまだまだ技術不足。伸びしろに期待がかかる発展途上の新人。',
  45:'団地内プロレスのヒエラルキーのトップに座る支配者。井沢を執拗に攻撃し、恐怖政治で団地を支配する策略家。卓越した知性と狡猾さで相手の弱みを見抜き、心理戦で追い詰めてからリングでとどめを刺す。策略だけでなく正面からの戦いでも強い恐るべき敵。',
  46:'かつて団地の実力者として尊敬を集めたが、高槻の策略で地位と友人を失い孤立。それでも折れずに５年の雌伏の後に高槻を破り地位を回復した。相手の良さを引き出しながら戦う誠実なスタイルは多くの支持を集めている。',
  47:'入居2年目ながら高い実力を示す若手の実力者。鋭い打撃を得意とする早熟型。若さに似合わぬ冷静な試合運びと確かな打撃技術で、短期間でトップクラスの実力を身につけた。早熟型ゆえに伸びしろが懸念されるが、現時点の実力は侮れない。',
  48:'粕田台団地に入居してきたちょっときつめの奥さん。前の住まいでは町内会プロレスの実力者。外には厳しく家では陽気。負けず嫌いの性格と適応力の高さで新しい環境にもすぐに溶け込んだ。打撃を軸にした攻撃的なスタイルで、闘志を前面に押し出す熱い試合を見せる。',
  49:'おっとりした育ちの良いお嬢様妻。井沢に師事しプロレスの基本から学び、着実に実力をつけている成長株。努力家で、師匠である井沢の教えを素直に吸収している。確実に成長を続けており、メンタルの強さは団地内でも屈指。',
  50:'見た目も言動も若々しい甘え上手。かつての井沢の友人だが、高槻グループに鞍替えした世渡り上手。',
  51:'男性陣を味方につけレフェリーすら誘惑する魔性の女。相手の幸せな顔が苦痛で歪むのを見るのが趣味。サブミッション技術は確かで、反則すれすれの駆け引きで相手を翻弄する試合巧者。',
  52:'高槻の取り巻き。かつては井沢の友人だった。',
  53:'年の割に落ち着きがないズボラ妻。でも夫婦仲は円満。パワーはあるがテクニックが追いつかない。',
  54:'どこにでもいる平凡なOL。運動は苦手だが、職場の人間関係の中で否応なくリングに立たされる。',
  55:'社長秘書としてスカウトされた才媛。美貌と実力で瞬く間に社内マドンナの座を獲得した。不屈の精神と鉄人のスタミナを兼ね備え、どんな劣勢からも逆転を狙える粘り強さが最大の武器。正統派のオールラウンドスタイルで正面から堂々と戦う姿勢が支持を集めている。',
  56:'美人で仕事もできる経理課のお姉さん。社内プロレスで高い勝率を誇り、粘着質ないたぶりを好むサディスト。サブミッション技術を駆使して相手をじわじわと追い詰める試合運びが得意。',
  57:'元社内マドンナの美人受付嬢。大久保の登場で地位を脅かされた。策略で周囲を動かし、自分は安全な場所から指揮を執るタイプ。サブミッション技術はなかなかのもので、それにプラスしてリング外での政治力を武器に暗躍する。',
  58:'新人・佐久間の教育担当。情に厚い性格で、後輩のために片桐に立ち向かった。バランスの取れた堅実なスタイルが持ち味。負けず嫌いの性格と面倒見の良さで、社内の若手からは姉貴分として慕われている。',
  59:'大久保の人気に嫉妬する女性社員。先輩の浅見に利用され大久保に試合を挑んだ直情型ブロウラー。パワーで押すスタイルは荒削りだが、直情的な性格ゆえの爆発力は侮れない。',
  60:'特殊な血筋で一時的に女性化した元男子。恵まれた体格とパワー、そして精神的な強さでリングを制する。男性時代の身体能力の残滓と女性化後に身につけたしなやかさを併せ持つ異色のグラップラー。鉄人と呼ぶにふさわしいタフネスで、長期戦にも耐えうるスタミナの持ち主。',
  61:'ギャル3人衆のリーダー格。クラスカーストのトップに君臨し、ルックスにも身体能力にも自信ありの実力者。華やかなルックスと高いプライドで注目を集める。より大きな舞台での活躍を虎視眈々と狙っている。',
  62:'ギャル3人衆の一角。恋する乙女として伊勢原文奈を警戒していた。パワーと威圧感を武器にしたラフファイトが持ち味で、体格を活かした圧力は相当。恋愛モードの時は甘いが、リングに上がると獰猛な戦闘本能を剥き出しにする。',
  63:'クラスの優等生委員長。ギャルグループとの軋轢で立場を失ったが、芯の強さは失っていない。真面目で正義感が強い。能力は平均的だが、最後まで諦めない姿勢は周囲の尊敬を集めている。',
  64:'ギャル3人衆の一人。長いものに巻かれるタイプで、バックがいる時だけ強気になる世渡り上手。',
  65:'人当たりの良さで患者にも同僚にも人気のナース。仕事中は優しいが、外に出ればけっこう毒舌。看護師としての観察眼はリングでも遺憾なく発揮され、名勝負製造機として好試合を生み出してきた。バランスの取れた高い総合力とファンサービス精神で幅広い支持を集める。',
  66:'高校時代はクラスのマドンナだった美人看護師。多額の借金を背負い地下格闘の世界に身を投じた。追い詰められた環境で培った精神的タフさと引き出しの多さが最大の武器。独特の雰囲気をまとい、周囲を引きつけるカリスマ性を持つ。',
  67:'かつては天才美少女ピアニストとして名を馳せた。夢破れた後も秘めた思いは消えず、望みをかなえるために地下プロレスに身を投じる。繊細な指先から繰り出すのは今やピアノではなく、容赦ないパワーグラップリング。華やかな容姿の瞳の奥には、挫折を乗り越えた者だけが持つ覚悟が宿っている。',
  68:'ツンデレ女子大生。負けず嫌いで、大切な人のためなら全力で戦う情熱家。スピードのある打撃が武器のストライカーで、感情をエネルギーに変えて戦うタイプ。大切な人を守るためにリングに立つ姿は応援したくなる魅力を放っている。',
  69:'現役女子大生レースクイーン。チアリーディング部仕込みの身体能力でスピーディーな試合を展開する。持ち前の華やかさと俊敏さを活かしたスピードスタイルで観客を魅了する。負けず嫌いの性格で、華麗な見た目とは裏腹に根性のある粘り強い試合を見せる。',
  70:'未亡人のクリーニング店主。パワフルな組み技が武器の姐御肌。面倒見の良い人柄で周囲から頼りにされる存在。パワフルなグラップリングに加え、引き出し上手な試合運びで若手の成長を手助けすることも多い。',
  71:'モデルと兼業のレースクイーン。華やかなルックスの裏に堅実な実力を秘める。ファンサービス精神旺盛で華やかな試合を心がけるが、実力も確か。安定感のあるオールラウンドスタイルで、どんな相手とも一定以上の試合ができる信頼度の高い選手。',
  72:'優しげな淑女の仮面の下に利己的なサイコパスの本性を隠す。体格・パワー・実力すべて備えた危険な美女。ファンサービスで人気を集める裏で、相手を精神的に追い詰める巧みな心理戦を展開する。自らの保身や欲のためには手段を選ばない。',
  73:'夏祭の奉納試合に出場した女性。威圧感のある体格と頑丈さを武器にするパワーグラップラー。179cmの体格から繰り出す豪快なグラップリングは力強さに溢れ、接近戦では無類の強さを誇る。',
  74:'ミスコングランプリの文学部生。お淑やかな印象だが性格はわりと強気。仏検1級の才媛。知性と品格を感じさせる立ち居振る舞いの中に、試合では意外な負けん気を覗かせる。',
  75:'ミスコン2位の野心家。明るく快活な美人の本性は利己的で、他人を蹴落とすことにも抵抗がない。ファンの前では笑顔を振りまくが、ライバルには容赦のない心理戦を仕掛ける。',
  76:'初めての恋人に浮かれる素直で明るい女子高生。技術面はまだ発展途上だが、パワーとスピードのバランスが良い。',
  77:'若くして大人びた色気を持った女子高生。冷静な観察眼で相手の隙を見抜く知性派。引き出しの多い堅実なオールラウンダー。',
  78:'田舎暮らしから抜け出したいと願い続けて都会に出てきた。引き出し上手な試合センスと純朴さから来る独自の魅力で、ファン層を獲得している。格上相手にも決して引かない粘り強さが持ち味。',
  79:'ハニートラップでオヤジ狩りをしていたギャル。手段を選ばないダーティなブロウラー。',
  80:'プロレスをするには不似合いな華奢でひ弱な少女。明日をも知れぬ日々に怯えながらも懸命に生きている。全ステータスが最低クラスだが、ムードメーカーとして場を明るくするファンサービス精神は誰にも負けない。彼女がリングに立つ姿は、強さとは何かを問いかける。',
  // ── 新規キャラクター（v1.4 GameID 81〜99）──
  81:'新卒3年目の若手OL。おじさん人気による手厚いサポートで営業成績も好調で、ちょっと調子に乗っている元気印。プロレスではスピードを活かした軽快なファイトスタイルが持ち味で、ムードメーカー気質も相まって試合会場を盛り上げる。スタミナとメンタルの高さで粘り強い試合運びを見せる。',
  82:'中途入社3年目の総務部員。事務職のキャリアは長く優秀だが、社内の人間関係にストレスを溜めている。ストレスの捌け口として始めたプロレスで意外な才能が開花。圧倒的なパワーとタフネスでリングを支配するグラップラーであり、侮れない実力者。',
  83:'新卒1年目の新人OL。まだまだ仕事は覚束ないが、やる気と負けん気だけは溢れている。経験不足を気持ちの強さで補い、先輩たちに食らいつく姿は応援したくなる魅力がある。丹羽の指導のもと着実に成長しており、将来性に期待がかかる。',
  84:'大手不動産の事務職OL。営業職の男たちに囲まれたストレスを地下プロレスで発散している。',
  85:'名前がちょっとキラキラな大学4年生。アパレルに就職内定済み。同じサークルの後輩に彼氏持ち。グラップリングを軸にタフネスで粘る試合スタイル。就活も恋愛も順調で、プロレスはあくまで趣味の延長だが潜在能力は侮れない。',
  86:'某化粧品会社の企画部を率いる才女。地下プロレスでストレスを発散する連戦連勝のダーティファイター。ファンサービスの裏に隠された本性はかなりのダーティファイターで、反則すれすれの駆け引きを楽しむ。',
  87:'オーストリアからの留学生。体操競技の強化選手で、金髪碧眼の美少女が地下リングに舞い降りた。体操仕込みの華麗な空中殺法とスピードは観客を魅了し、その華やかな存在感で一躍人気者に。グラウンド技術には課題を残すが、身体能力の高さで十分カバーしている。',
  88:'繁華街の怪しげなプロレスクラブのキャスト。昼は普通のOL、夜はリングに上がるテクニシャン。二重生活の中で培ったサブミッション技術は確かなもの。地味だが堅実な試合運びで、知る人ぞ知る実力者。',
  89:'東商店街のケーキ屋の看板娘。幼馴染をめぐるライバルとの因縁を抱えるスピードファイター。持ち前の快活さと高い身体能力を活かしたスピードスタイルが武器。ファンサービスにも熱心で、商店街の顔として地元での人気は抜群。',
  90:'西商店街の和菓子屋の一人娘。憧れの男子をめぐり赤羽と険悪。コツコツと実力を積み上げるタイプで、長期戦で真価を発揮する。粘り強いグラップリングで相手を消耗させる持久戦型のスタイルが持ち味。',
  91:'常川高校プロレス部のキャプテン。安定した実力を持つバランス型ファイター。170cmの恵まれた体格を活かしたバランスの良い試合運びで安定した成績を残している。',
  92:'その色香で大勢の青少年を悩ませる美人養護教諭。サブミッション技術は確かだがスタミナに難あり。冷静に相手の急所を見極める関節技は安定しているが、スタミナ不足は深刻で長期戦に持ち込まれると一気に失速する弱点を抱える。',
  93:'名門校プロレス部のエース。容姿端麗・成績優秀・面倒見良しの三拍子がそろう。1年次から頭角を現し、チームメイトからの信頼も厚い人格者。グラップリングを軸にしたバランスの良いスタイルだが、突出した武器がないのが課題。',
  94:'かつては期待の有望株だったが松久保との差に自信を失い道を踏み外した。闇試合で鬱屈をぶつける。ヒール性を帯びたサブミッション技術は松久保にも劣らない。挫折を経験した者特有の危うさと闘志が入り混じり、予測不能な爆発力を見せることがある。',
  95:'落ち着いた雰囲気の若手レースクイーン。若手レーサーとの秘密の恋を胸に秘める。ファンサービス精神旺盛で華やかな試合を見せるが、ガラスの身体という弱点を抱え、怪我のリスクは常に付きまとう。',
  96:'ミスコン優勝のテニスサークル所属。華やかなルックスで大学生活を謳歌する早熟型オールラウンダー。テニスで鍛えたフットワークとファンサービス精神で試合を盛り上げる。',
  97:'素朴な雰囲気だが恋にも積極的な体育会系女子大生。運動神経抜群で体格に見合わぬパワーも秘める。努力家で負けず嫌いの性格は練習にもリングにも表れ、鍛え抜かれた頑丈な体と高い身体能力でパワフルな試合を展開する。技術面の課題克服が今後の鍵。',
  98:'人望を集める生徒会長。三浦からの嫉妬を買い文化祭プロレスに出場。リーダーシップと技術が光る。引き出し上手な試合センスと生来の人望で周囲を味方につける。',
  99:'チアリーダー部部長で校内の人気者。米山への嫉妬心からプロレスマッチを仕掛けた。ファンサービスに長けた華やかさの裏にライバル意識の強い性格を持つ。実力は相当なもの。',
};

// ── Trait Definitions (traits-v2.1) ─────────────────────
const TRAIT_DEFS = {
  '華':           {cat:'pop',    icon:'華', color:'#e91e9c', en:'Charisma',         desc:'集客力にボーナス。グッズ売上の重みも増加'},
  'ファンサービス':{cat:'pop',    icon:'奉', color:'#f39c12', en:'Fan Service',      desc:'グッズ売上にボーナス。興行出場で人気が上がりやすい'},
  'ヒール適性':   {cat:'pop',    icon:'悪', color:'#9b59b6', en:'Heel Aptitude',    desc:'悪役ムーブで人気を稼ぎ、因縁も生みやすい'},
  '名勝負製造機': {cat:'match',  icon:'名', color:'#f1c40f', en:'Match Maker',      desc:'試合品質にわずかなボーナス'},
  '引き出し上手': {cat:'match',  icon:'引', color:'#2ecc71', en:'Best Bringer',     desc:'格下との試合でも質が下がりにくい'},
  'ライバル体質': {cat:'match',  icon:'闘', color:'#e74c3c', en:'Rivalry Prone',    desc:'ライバル因縁が生まれやすい'},
  '早熟':         {cat:'growth', icon:'早', color:'#27ae60', en:'Early Bloomer',    desc:'若手期の成長が速い。全盛期短め', excl:'A'},
  '晩成':         {cat:'growth', icon:'晩', color:'#16a085', en:'Late Bloomer',     desc:'若手期は遅いが全盛期が長い', excl:'A'},
  '遅咲き':       {cat:'growth', icon:'遅', color:'#1abc9c', en:'Late Starter',     desc:'25歳以降に急成長する', excl:'A'},
  '努力家':       {cat:'growth', icon:'努', color:'#3498db', en:'Hard Worker',      desc:'成長が安定しやすく、練習で体を壊しにくい'},
  '破天荒':       {cat:'growth', icon:'破', color:'#e67e22', en:'Maverick',         desc:'成長にムラあり。爆発的か停滞'},
  '適応力':       {cat:'growth', icon:'適', color:'#1abc9c', en:'Adaptability',     desc:'怪我中でも成長が落ちにくく、追い込み練習にも強い'},
  '頑丈さ':       {cat:'body',   icon:'頑', color:'#2980b9', en:'Durability',       desc:'怪我しにくい', excl:'B'},
  'ガラスの身体': {cat:'body',   icon:'脆', color:'#c0392b', en:'Glass Body',       desc:'怪我しやすいが、復帰のたびにファンの声援を集める', excl:'B'},
  '鉄人':         {cat:'body',   icon:'鉄', color:'#7f8c8d', en:'Iron Man',         desc:'コンディション全般に強い', excl:'B'},
  '不屈':         {cat:'body',   icon:'屈', color:'#d35400', en:'Indomitable',      desc:'怪我からの復帰が速い'},
  'ムードメーカー':{cat:'org',   icon:'和', color:'#f39c12', en:'Mood Maker',       desc:'明るさでロッカールームの空気を持ち上げる'},
  '人望':         {cat:'org',    icon:'望', color:'#3498db', en:'Respect',           desc:'在籍中はロッカールーム士気が毎週+3'},
  '負けず嫌い':   {cat:'org',    icon:'負', color:'#e74c3c', en:'Competitive',      desc:'負けた翌週の練習成長にボーナス'},
  'リーダー気質': {cat:'org',    icon:'将', color:'#f1c40f', en:'Leadership',        desc:'若手の成長率にボーナス'},
  '忠誠心':       {cat:'org',    icon:'忠', color:'#2ecc71', en:'Loyalty',           desc:'引き抜きオファーが来る確率が大幅に低下'},
  '野心':         {cat:'org',    icon:'野', color:'#9b59b6', en:'Ambition',          desc:'タイトル挑戦時に試合が盛り上がり、覚醒しやすい'},
  '番狂わせ体質': {cat:'special',icon:'番', color:'#e74c3c', en:'Upset Specialist', desc:'格上相手に丸め込み率UP'},
  '闘志':         {cat:'special',icon:'志', color:'#c0392b', en:'Fighting Spirit',  desc:'瀕死から粘る力が強く、負けても人気が落ちにくい'},
  '威圧感':       {cat:'special',icon:'威', color:'#8e44ad', en:'Intimidation',     desc:'対戦相手の序盤モメンタムが不利'},
  '反骨心':       {cat:'special',icon:'反', color:'#c0392b', en:'Rebellious',       desc:'扱いにくいが逆境に強い。信頼低下時に成長UP'}
};

// Trait utility functions
const Traits = {
  has(char, traitName) {
    return Array.isArray(char.traits) && char.traits.includes(traitName);
  },
  any(char, ...traitNames) {
    return Array.isArray(char.traits) && traitNames.some(t => char.traits.includes(t));
  },
  count(roster, traitName) {
    return roster.filter(c => Traits.has(c, traitName)).length;
  },
  getDef(traitName) {
    return TRAIT_DEFS[traitName] || null;
  },
  list(char) {
    return Array.isArray(char.traits) ? char.traits : [];
  }
};

// ── Roster Randomization Config (v1.0 roster-randomization-design) ──
// Slot counts — dormant = ALL_CHARS.length - org_s - org_a - org_b - fa
const ROSTER_CFG = {
  org_s: 16,           // S級スロット
  org_a: 13,           // A級スロット
  org_b: 10,           // B級スロット
  fa: 22,              // FA（ドラフト前）— ここから8名がドラフト候補
  draftFixed: 2,       // ドラフト固定枠（弱めの選手）
  draftCandidates: 6,  // ドラフト候補数
  draftPicks: 3,       // プレイヤー選択数
  superEliteThreshold: 850,  // 超逸材potTotal閾値 → S級確定
  eliteThreshold: 740,       // 逸材potTotal閾値
  seriesBonus: 0.3,          // 同シリーズ重み付けボーナス（0〜1、弱め）
};

// Character group tags — for series weighting (同グループが同団体に少し偏りやすい)
// School-level for school-based series, series-level for others
const CHAR_GROUP = {
  // 学園女子プロレス — 粕田学園高校
  1:'kasuda',2:'kasuda',3:'kasuda',4:'kasuda',5:'kasuda',6:'kasuda',7:'kasuda',8:'kasuda',9:'kasuda',
  // 学園女子プロレス — 哲玖国際高校
  11:'tekkyu',12:'tekkyu',13:'tekkyu',14:'tekkyu',15:'tekkyu',
  // 学園女子プロレス — 摺出川女学院
  16:'suridegawa',17:'suridegawa',18:'suridegawa',19:'suridegawa',20:'suridegawa',
  21:'suridegawa',22:'suridegawa',23:'suridegawa',24:'suridegawa',25:'suridegawa',
  // 学園女子プロレス — 元砥石川高校
  26:'mototoishi',27:'mototoishi',
  // 学園女子プロレス — その他
  28:'gakuen_other',
  // 女子高生プロレス — 奥山川高校
  29:'okuyama',30:'okuyama',31:'okuyama',32:'okuyama',
  // 女子高生プロレス — 岬浜女子高校
  33:'misakihama',34:'misakihama',35:'misakihama',36:'misakihama',
  // 女子高生プロレス — 姫宮女子学院
  37:'himemiya',38:'himemiya',39:'himemiya',40:'himemiya',
  // 女子高生プロレス — 三津浜高校
  41:'mitsuhama',42:'mitsuhama',43:'mitsuhama',44:'mitsuhama',
  // 団地妻プロレス
  45:'danchi',46:'danchi',47:'danchi',48:'danchi',49:'danchi',50:'danchi',51:'danchi',52:'danchi',53:'danchi',
  // OLプロレス
  54:'ol',55:'ol',56:'ol',57:'ol',58:'ol',59:'ol',81:'ol',82:'ol',83:'ol',84:'ol',86:'ol',
  // JKになった俺(ry
  60:'jk_ore',61:'jk_ore',62:'jk_ore',63:'jk_ore',64:'jk_ore',
  // RQプロレス
  69:'rq',71:'rq',72:'rq',95:'rq',
  // 女子大生プロレス
  68:'joshidai',74:'joshidai',75:'joshidai',85:'joshidai',96:'joshidai',97:'joshidai',
  // 商店街
  73:'shotengai',89:'shotengai',90:'shotengai',
  // マドンナプロレス
  66:'madonna',67:'madonna',
  // 常川高校（女子高生プロレス）
  91:'tokikawa',
  // その他（個別 — グループボーナスなし）
  65:'other',70:'other',76:'other',77:'other',78:'other',79:'other',80:'other',
  87:'other',88:'other',92:'other',93:'other',94:'other',98:'other',99:'other',
};

// Mutable draft config — initialized by seed in createInitialState
let DRAFT_CONFIG = {
  fixed: [],
  candidates: [],
  pickCount: 3,
};
// Shuffle helper using seeded RNG
function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Engine.rng.int(rng, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Generate draft config from FA pool (called after initRandomRoster)
function generateDraftConfig(seed) {
  const rng = Engine.rng.create(Engine.rng.derive(seed, 0xD1AF7));
  const faIds = ORG_ASSIGN.free || [];
  // Compute OVR for each FA character
  const withOvr = faIds.map(id => {
    const c = ALL_CHARS.find(ch => ch.id === id);
    if (!c) return null;
    const ovr = Math.round((c.pw + c.sp + c.te + c.st + c.mn) / 5);
    return { id, ovr };
  }).filter(Boolean);
  // Sort by OVR ascending (weakest first)
  withOvr.sort((a, b) => a.ovr - b.ovr);
  // Fixed: 2 from weakest tier (bottom 40%)
  const weakCutoff = Math.max(2, Math.floor(withOvr.length * 0.4));
  const weakPool = withOvr.slice(0, weakCutoff);
  const weakShuffled = seededShuffle(weakPool.map(x => x.id), rng);
  const fixed = weakShuffled.slice(0, ROSTER_CFG.draftFixed);
  // Candidates: 6 from mid tier (OVR 40-70 range, excluding fixed)
  const fixedSet = new Set(fixed);
  const midPool = withOvr.filter(x => !fixedSet.has(x.id) && x.ovr >= 40 && x.ovr <= 70);
  // If not enough mid, include some from weak leftovers
  const candidatePool = midPool.length >= ROSTER_CFG.draftCandidates
    ? midPool : [...midPool, ...withOvr.filter(x => !fixedSet.has(x.id) && !midPool.some(m => m.id === x.id))];
  const candShuffled = seededShuffle(candidatePool.map(x => x.id), rng);
  const candidates = candShuffled.slice(0, ROSTER_CFG.draftCandidates);
  // v1.2: Generate age for each draft member (16-19)
  const draftAges = {};
  [...fixed, ...candidates].forEach(id => {
    draftAges[id] = 17 + Engine.rng.int(rng, 0, 2);
  });
  DRAFT_CONFIG = { fixed, candidates, pickCount: ROSTER_CFG.draftPicks, draftAges };
  return DRAFT_CONFIG;
}

// Portrait mapping: character id → filename key
// Usage: `image/face_${PORTRAIT[id]}.png`
const PORTRAIT = {
  1:'abukuma_t',2:'tomioka_k',3:'sawade_m',4:'takatsu_k',5:'fukamachi_m',
  6:'soezawa_t',7:'takashina_m',8:'hayashi_m',9:'udagawa_r',
  11:'tachibana_r',12:'ikoma_e',13:'domae_y',14:'kuroe_m',15:'kusunoki_n',
  16:'okochi_s',17:'kawanobe_n',18:'dewa_t',19:'shijo_a',20:'kishi_y',
  21:'kinouchi_y',22:'minoyama_m',23:'hayami_t',24:'sonobe_r',25:'ishitoya_n',
  26:'miyamori_n',27:'yaegashi_m',28:'iwaya_m',29:'aizawa_m',30:'matsukawa_a',
  31:'hiramatsu_k',32:'futasato_a',33:'umegaoka_m',34:'kitabatake_y',35:'uenohara_y',
  36:'manabe_a',37:'shirogane_r',38:'shiba_a',39:'kamiya_s',40:'takanawa_m',
  41:'negishi_a',42:'hongo_m',43:'kanazawa_f',44:'fukuura_r',45:'takatsuki_c',
  46:'izawa_h',47:'saito_m',48:'kikuchi_r',49:'takahashi_ma',50:'aida_m',
  51:'mitsuhashi_f',52:'nishikawa_c',53:'komori_s',54:'abe_m',55:'okubo_m',
  56:'katagiri_a',57:'asami_r',58:'niwa_h',59:'ikebe_m',60:'banyubashi_h',
  61:'kannonzaki_s',62:'miyagase_c',63:'isehara_f',64:'yumoto_h',65:'kurami_n',
  66:'hasegawa_r',67:'yanagishima_m',68:'oba_a',69:'hayakawa_m',70:'hamatake_m',
  71:'togane_s',72:'anazawa_h',73:'omagoe_y',74:'fujimigaoka_h',75:'ebina_s',
  76:'kuribayashi_a',77:'niimi_y',78:'tsubakiyama_m',79:'kudo_r',80:'takashima_s',
  81:'sakamoto_r',82:'kondo_y',83:'sakuma_h',84:'minamitani_a',85:'kamoshida_r',
  86:'serizawa_a',87:'steinfeld_l',88:'aikawa_a',89:'akabane_a',90:'tamate_s',
  91:'todoroki_a',92:'iijima_s',93:'matsukubo_i',94:'sudo_m',95:'konishi_y',
  96:'matsushita_m',97:'iwasaki_m',98:'yoneyama_a',99:'miura_s'
};
function getPortraitUrl(id) { return PORTRAIT[id] ? `../image/face_${PORTRAIT[id]}.png` : ''; }
function getUpperUrl(id) { return PORTRAIT[id] ? `../image/upper/upper_${PORTRAIT[id]}.webp` : ''; }

// Coach portrait mapping (add image files as face_coach_{key}.png)
const COACH_PORTRAIT = {
  1:'coach_onizuka', 2:'coach_asuka', 3:'coach_tsurumi', 4:'coach_iwata',
  5:'coach_sawamura', 6:'coach_asahi', 7:'coach_kurebayashi', 8:'coach_shirakawa',
  9:'coach_omori', 10:'coach_miyamoto', 11:'coach_makabe', 12:'coach_hasegawa',
  13:'coach_kuroda', 14:'coach_tsuchiya', 15:'coach_hayashi', 16:'coach_morita',
  17:'coach_shinohara', 18:'coach_akagi', 19:'coach_nishioka', 20:'coach_fujiwara',
  21:'coach_kumagai', 22:'coach_ando', 23:'coach_horiuchi', 24:'coach_nakamura',
  25:'coach_miyazawa', 26:'coach_carlos', 27:'coach_okawara', 28:'coach_hata',
  29:'coach_chin', 30:'coach_saejima',
  31:'coach_kanzaki', 32:'coach_ganryu', 33:'coach_hazuki', 34:'coach_midou', 35:'coach_kisaragi'
};
function getCoachPortraitUrl(id) { return COACH_PORTRAIT[id] ? `../image/coach/face_${COACH_PORTRAIT[id]}.png` : ''; }
function getCoachUpperUrl(id) { return COACH_PORTRAIT[id] ? `../image/coach/upper_${COACH_PORTRAIT[id]}.webp` : ''; }
function coachPortraitImg(coach, size = 48) {
  const url = getCoachPortraitUrl(coach.id);
  if (url) {
    return `<img src="${url}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.1);flex-shrink:0" alt="${coach.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none;width:${size}px;height:${size}px;border-radius:50%;align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px;flex-shrink:0;background:linear-gradient(135deg,rgba(212,168,67,0.2),rgba(212,168,67,0.05));border:2px solid rgba(212,168,67,0.2)">${coach.emoji}</div>`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px;flex-shrink:0;background:linear-gradient(135deg,rgba(212,168,67,0.2),rgba(212,168,67,0.05));border:2px solid rgba(212,168,67,0.2)">${coach.emoji}</div>`;
}
function portraitImg(id, size = 80, cls = '', clickable = false) {
  const url = getPortraitUrl(id);
  // Auto-detect champion status for border color
  let statusCls = '';
  if (typeof G !== 'undefined') {
    if (G.titles?.world?.championId === id) statusCls = ' portrait-champ';
  }
  const clickAttr = clickable ? ` onclick="event.stopPropagation();showFighterPopup(${id},'roster')" style="width:${size}px;height:${size}px;cursor:pointer"` : ` style="width:${size}px;height:${size}px"`;
  if (url) {
    return `<img src="${url}" class="portrait${statusCls} ${cls}"${clickAttr} alt="" loading="lazy">`;
  }
  // Fallback: rounded square with initial
  const ch = ALL_CHARS.find(c => c.id === id);
  const initial = ch ? ch.name.charAt(0) : '?';
  const STYLE_COLORS = {Grappler:'#bb8fce',Striker:'#e74c3c',Submission:'#e67e22',Speed:'#2ecc71',Allround:'#f1c40f',Brawler:'#e88a82'};
  const col = ch ? (STYLE_COLORS[ch.style] || '#888') : '#888';
  const clickStyle = clickable ? 'cursor:pointer;' : '';
  const clickEv = clickable ? ` onclick="event.stopPropagation();showFighterPopup(${id},'roster')"` : '';
  return `<div class="portrait${statusCls} ${cls}" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${col}33,${col}11);font-size:${Math.round(size*0.35)}px;font-weight:900;color:${col};flex-shrink:0;${clickStyle}"${clickEv}>${initial}</div>`;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 2: MOVE DATA (from v3.5)                        ║
// ╚══════════════════════════════════════════════════════════╝
const commonMoves=[
{n:'ストンピング',d:2,c:'strike'},{n:'ボディパンチ',d:3,c:'strike'},{n:'バックエルボー',d:3,c:'strike'},
{n:'ナックルパンチ',d:3,c:'strike'},{n:'逆水平チョップ',d:4,c:'strike'},{n:'エルボー・スタンプ',d:5,c:'strike'},
{n:'マシンガン・チョップ',d:5,c:'strike'},{n:'ニーキック',d:6,c:'strike'},{n:'ヘッドバット',d:6,c:'strike'},
{n:'ビッグブーツ',d:7,c:'strike'},{n:'低空ドロップキック',d:7,c:'strike'},{n:'サッカーボールキック',d:7,c:'strike'},
{n:'ドロップキック',d:8,c:'strike'},{n:'ジャンピング・エルボー',d:8,c:'strike'},{n:'ローリング・エルボー',d:9,c:'strike'},
{n:'延髄斬り',d:9,c:'strike'},{n:'ミサイルキック',d:9,c:'strike'},{n:'ラリアット',d:10,c:'strike'},
{n:'スーパーキック',d:10,c:'strike'},{n:'クローズライン',d:10,c:'strike'},
{n:'ロックアップからの押し込み',d:2,c:'throw'},{n:'ショルダータックル',d:3,c:'throw'},
{n:'ヒップトス',d:3,c:'throw'},{n:'アームドラッグ',d:3,c:'throw'},{n:'ヘッドロック・テイクダウン',d:3,c:'throw'},
{n:'ファイヤーマンズキャリー',d:4,c:'throw'},{n:'ボディスラム',d:6,c:'throw'},{n:'スープレックス',d:7,c:'throw'},
{n:'スナップ・スープレックス',d:7,c:'throw'},{n:'ブレーンバスター',d:8,c:'throw'},
{n:'サイド・スープレックス',d:8,c:'throw'},{n:'ネックブリーカー',d:8,c:'throw'},
{n:'スウィンギング・ネックブリーカー',d:8,c:'throw'},
{n:'バックブリーカー',d:8,c:'throw'},{n:'サモアン・ドロップ',d:9,c:'throw'},
{n:'ベリー・トゥ・ベリー',d:9,c:'throw'},{n:'タイガー・ドライバー',d:9,c:'throw'},
{n:'スパインバスター',d:9,c:'throw'},{n:'DDT',d:10,c:'throw'},
{n:'チンロック',d:2,c:'submission'},{n:'ネックロック',d:2,c:'submission'},{n:'ヘッドロック',d:3,c:'submission'},
{n:'リストロック',d:4,c:'submission'},{n:'ハンマーロック',d:4,c:'submission'},{n:'アームリンガー',d:4,c:'submission'},
{n:'スリーパー・ホールド',d:6,c:'submission'},{n:'フルネルソン',d:6,c:'submission'},
{n:'コブラツイスト',d:7,c:'submission'},{n:'ベアハッグ',d:7,c:'submission'},
{n:'キャメルクラッチ',d:7,c:'submission'},{n:'インディアン・デスロック',d:7,c:'submission'},
{n:'ボストンクラブ',d:8,c:'submission'},{n:'アキレス腱固め',d:9,c:'submission'},
{n:'フライング・クロスボディ',d:7,c:'aerial'},{n:'ダイビング・ボディ・プレス',d:8,c:'aerial'},
{n:'セントーン',d:7,c:'aerial'},{n:'トペ・スイシーダ',d:9,c:'aerial'},
{n:'プランチャ・スイシーダ',d:8,c:'aerial'},{n:'ダイビング・エルボー',d:8,c:'aerial'},
{n:'ダイビング・ヘッドバット',d:7,c:'aerial'},{n:'ミサイルキック（飛）',d:9,c:'aerial'},
{n:'エルボードロップ',d:3,c:'ground'},{n:'ニードロップ',d:4,c:'ground'},{n:'レッグドロップ',d:4,c:'ground'},
{n:'スライディングキック',d:4,c:'ground'},{n:'ストンピング連打',d:3,c:'ground'},
{n:'ヘアプル・スラム',d:3,c:'ground'},{n:'フェイスウォッシュ',d:4,c:'ground'},{n:'ダブルニードロップ',d:5,c:'ground'},
{n:'スクールボーイ',d:4,c:'rollup'},{n:'首固め',d:4,c:'rollup'},
{n:'スモール・パッケージ',d:5,c:'rollup'},{n:'ラ・マヒストラル',d:5,c:'rollup'},
{n:'ウラカン・ラナ',d:5,c:'rollup'},{n:'回転エビ固め',d:5,c:'rollup'},
{n:'ヨーロピアン・クラッチ',d:5,c:'rollup'}
];
const styleMoves={
Grappler:[{n:'パワーボム',d:14,c:'throw'},{n:'シットアウト・パワーボム',d:15,c:'throw'},
{n:'ジャーマン・スープレックス',d:13,c:'throw'},{n:'チョークスラム',d:13,c:'throw'},
{n:'デスバレーボム',d:14,c:'throw'},{n:'バックドロップ',d:13,c:'throw'},
{n:'ラストライド',d:16,c:'throw'},{n:'垂直落下式ブレーンバスター',d:14,c:'throw'},
{n:'力強いラリアット',d:12,c:'strike'},{n:'頭突き',d:11,c:'strike'},
{n:'カナディアン・バックブリーカー',d:10,c:'submission'},{n:'アルゼンチン・バックブリーカー',d:11,c:'submission'}],
Speed:[{n:'フランケンシュタイナー',d:12,c:'throw'},{n:'トルネードDDT',d:13,c:'throw'},
{n:'シャイニング・ウィザード',d:12,c:'strike'},{n:'ムーンサルト・プレス',d:15,c:'aerial'},
{n:'シューティング・スター・プレス',d:16,c:'aerial'},{n:'450スプラッシュ',d:15,c:'aerial'},
{n:'フロッグ・スプラッシュ',d:13,c:'aerial'},{n:'スワントン・ボム',d:14,c:'aerial'},
{n:'トペ・コンヒーロ',d:11,c:'aerial'},
{n:'ダイビング・セントーン',d:10,c:'aerial'},{n:'ドラゴン・スクリュー',d:10,c:'throw'},
{n:'ハリケーンラナ',d:12,c:'throw'}],
Technique:[{n:'アームバー',d:11,c:'submission'},{n:'フィギュア・フォー・レッグロック',d:12,c:'submission'},
{n:'シャープシューター',d:13,c:'submission'},{n:'STF',d:12,c:'submission'},
{n:'三角絞め',d:12,c:'submission'},{n:'クロスフェイス',d:13,c:'submission'},
{n:'卍固め',d:14,c:'submission'},{n:'ドラゴンスリーパー',d:13,c:'submission'},
{n:'キムラロック',d:11,c:'submission'},{n:'タイガー・スープレックス',d:14,c:'throw'},
{n:'ドラゴン・スープレックス',d:15,c:'throw'},{n:'フィッシャーマン・スープレックス',d:13,c:'throw'}],
Allround:[{n:'ファルコンアロー',d:13,c:'throw'},{n:'みちのくドライバーII',d:14,c:'throw'},
{n:'エクスプローダー',d:12,c:'throw'},{n:'ノーザンライツ・スープレックス',d:12,c:'throw'},
{n:'ダブルアーム・スープレックス',d:13,c:'throw'},{n:'リアネイキッドチョーク',d:11,c:'submission'},
{n:'テキサス・クローバーホールド',d:12,c:'submission'},{n:'アンクル・ロック',d:11,c:'submission'},
{n:'フェニックス・スプラッシュ',d:15,c:'aerial'},{n:'ダイビング・ボディ・プレス（大）',d:11,c:'aerial'},
{n:'スピアー',d:12,c:'strike'},{n:'インプラントDDT',d:13,c:'throw'}],
Striker:[{n:'シャイニング・ウィザード（打）',d:13,c:'strike'},{n:'ジャンピングニー',d:12,c:'strike'},
{n:'ハイキック',d:11,c:'strike'},{n:'バズソーキック',d:14,c:'strike'},
{n:'PK',d:11,c:'strike'},{n:'ランニングエルボー',d:13,c:'strike'},
{n:'スピニングバックフィスト',d:12,c:'strike'},{n:'ケンカキック',d:15,c:'strike'},
{n:'エルボー連打',d:10,c:'strike'},{n:'コーナーラッシュ',d:11,c:'strike'},
{n:'パイルドライバー',d:14,c:'throw'},{n:'ツームストン・パイルドライバー',d:16,c:'throw'}],
Submission:[{n:'ギロチンチョーク',d:13,c:'submission'},{n:'肩固め',d:12,c:'submission'},
{n:'ヒール・ホールド',d:13,c:'submission'},{n:'ロメロ・スペシャル',d:14,c:'submission'},
{n:'テキサス・クローバーホールド（専）',d:13,c:'submission'},{n:'リアネイキッドチョーク（専）',d:12,c:'submission'},
{n:'アンクル・ロック（専）',d:12,c:'submission'},{n:'クロスフェイス（専）',d:14,c:'submission'},
{n:'卍固め（専）',d:15,c:'submission'},{n:'フィギュア・フォー（専）',d:14,c:'submission'},
{n:'バックドロップ（専）',d:13,c:'throw'},{n:'ドラゴン・スクリュー（専）',d:11,c:'throw'}],
Brawler:[{n:'エルボースマッシュ',d:12,c:'strike'},{n:'バックハンドブロー',d:11,c:'strike'},
{n:'ヘッドバット連打',d:11,c:'strike'},{n:'コーナーラッシュ（喧）',d:12,c:'strike'},
{n:'パイルドライバー（喧）',d:15,c:'throw'},{n:'ツームストン・パイルドライバー（喧）',d:16,c:'throw'},
{n:'チョークスラム（喧）',d:14,c:'throw'},{n:'サイドウォークスラム',d:12,c:'throw'},
{n:'ランニングパワースラム',d:13,c:'throw'},{n:'ネックハンギングツリー',d:12,c:'submission'},
{n:'フェイスウォッシュ連打',d:10,c:'ground'},{n:'ストンピング乱打',d:11,c:'ground'}]
};
const catW={
Grappler:{strike:30,throw:30,submission:5,aerial:5,ground:15,rollup:5},
Speed:{strike:20,throw:15,submission:10,aerial:35,ground:5,rollup:10},
Technique:{strike:15,throw:20,submission:30,aerial:5,ground:10,rollup:15},
Allround:{strike:25,throw:25,submission:15,aerial:15,ground:10,rollup:10},
Striker:{strike:45,throw:15,submission:5,aerial:10,ground:15,rollup:5},
Submission:{strike:10,throw:10,submission:45,aerial:5,ground:15,rollup:10},
Brawler:{strike:30,throw:25,submission:5,aerial:5,ground:20,rollup:5}
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 3: ENGINE CONFIG (v4.1b tuneB)                  ║
// ╚══════════════════════════════════════════════════════════╝
const MAX_T = 20;
const PHASES = [
  {name:'Opening',min:1,max:4,mult:0.9,sCh:20,counterBonus:0},
  {name:'Mid',min:5,max:8,mult:1.05,sCh:40,counterBonus:3},
  {name:'End',min:9,max:12,mult:1.2,sCh:55,counterBonus:5},
  {name:'Climax',min:13,max:20,mult:1.4,sCh:70,counterBonus:8}
];
const ENG = {
  hpBase: 50, hpScale: 0.90,
  effPivot: 100, effSlopeAfterPivot: 0.60,
  hitBase: {1:97,2:97,3:96,4:94,5:92,6:89,7:86,8:84,9:81,10:78,11:76,12:74,13:72,14:70,15:68,16:66},
  tecHitBonus: 0.17, spdDodgeBonus: 0.18, hitMin: 42, hitMax: 98,
  counterBase: 4, counterTecScale: 0.055, counterSpdPenalty: 0.07, counterMin: 2, counterMax: 22,
  counterDmgMult: 0.6, counterMomShift: 18,
  dmgPwrScale: 0.20, dmgTecScale: 0.08, dmgSpdScale: 0.08,
  defStaScale: 0.02, defMntScale: 0.055, momDmgScale: 0.003,
  dmgRandMin: 0.85, dmgRandRange: 0.30, dmgFloor: 3,
  gritDuration: 2, gritDmgReduction: 0.20, gritCounterBonus: 8,
  pinAttemptHpThreshold: 0.35, pinAttemptMinDmg: 9, pinAttemptBaseRate: 36,
  pinAttemptMomBonus: 0.15, pinAttemptMntPenalty: 0.20,
  pinAttemptSuccessBase: 23, pinAttemptClimax: 22,
  finishWeights: {
    // bug fix: 非submission技のgu=0, submission技のfall=0 に統一
    strike:    {fall:90, gu:0, tko:10},
    throw:     {fall:85, gu:0, tko:15},
    aerial:    {fall:85, gu:0, tko:15},
    ground:    {fall:75, gu:0, tko:25},
    submission:{fall:0,  gu:95, tko:5},
    rollup:    {fall:100,gu:0,  tko:0}
  },
  kickoutMnScale: 0.50, kickoutMax: 2, kickoutClimaxMult: 0.7,
  guEscapeMnScale: 0.45, guEscapeMax: 2,
  tkoConsecutiveThreshold: 3, tkoHpThreshold: 0.15, tkoBaseRate: 14,
  rollupHpThreshold: 0.35, rollupTecBonus: 0.18, rollupBaseSuccess: 16
};

// ── Tier 2: ビッグマッチ用パラメータ（PPV/タイトル/対抗戦/トーナメント）──
const BIGMATCH_MAX_T = 24;
const BIGMATCH_PHASES = [
  {name:'Opening',min:1,max:6,mult:0.70,sCh:15,counterBonus:0},
  {name:'Mid',min:7,max:12,mult:0.85,sCh:35,counterBonus:2},
  {name:'End',min:13,max:18,mult:1.00,sCh:50,counterBonus:4},
  {name:'Climax',min:19,max:24,mult:1.20,sCh:65,counterBonus:7}
];
const BIGMATCH_ENG = {
  ...ENG,
  hpBase: 85,
  hpScale: 1.10,
  rollupBaseSuccess: 11,
  rollupHpThreshold: 0.25,
  pinAttemptHpThreshold: 0.25,
  pinAttemptSuccessBase: 14,
  pinAttemptClimax: 18,
  kickoutMax: 3,
  guEscapeMax: 3,
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4: ECONOMY CONFIG                               ║
// ╚══════════════════════════════════════════════════════════╝
// 給与連続関数パラメータ（R4: テーブル廃止→指数関数）
const SALARY_PARAMS = {
  baseA: 0.55,       // 指数カーブ係数A（L1r: 0.65→0.55 中間層給与微調整）
  baseB: 0.062,      // 指数カーブ係数B — base = A * exp(B * OVR)（L1r: 0.06→0.062 高OVR維持）
  popMax: 80,        // 人気加算の最大値（万）
  popExp: 2,         // 人気カーブ指数 — popBonus = popMax * (pop/100)^popExp
  titleBonus: 20,    // タイトル保持者固定加算（万）
};
const FAN_EXPECT_REACTIONS = {
  goodCrowd: [
    'これが見たかったんだよ！ 最高の試合だった！',
    '期待通り…いや、期待以上の名勝負だった！',
    '会場が一つになった瞬間だった…！',
    'ファンの声が選手に届いた試合だった',
    '歴史に残るカードを実現してくれた！',
  ],
  badCrowd: [
    'もう少し噛み合ってほしかった…',
    '期待が大きすぎたのかもしれない',
    '次こそ本当の名勝負を見せてほしい',
    'カードは最高だったのに…内容が追いつかなかった',
  ],
  goodWinner: [
    'みんなの声が聞こえてたよ',
    'この試合、絶対に負けられなかった',
    '期待に応えられたなら…嬉しい',
    '最高の相手に最高の舞台。感謝しかない',
    'あの歓声が私の力になった',
  ],
  badWinner: [
    '…まだやれたはず',
    'この結果じゃ満足できない',
    '次はもっといい試合にする。約束する',
    '応援してくれたのに…悔しい',
  ],
};
// L1: 会場テーブル（10段・popReq撤廃・全会場選択可能）
const VENUES = [
  {name:'公民館',    cap:150,   cost:5,    maxMatches:3, img:'../image/venue_0_kominkan.webp'},     // 0
  {name:'小ホールA', cap:300,   cost:25,   maxMatches:3, img:'../image/venue_1_small_hall_a.webp'}, // 1
  {name:'小ホールB', cap:500,   cost:50,   maxMatches:3, img:'../image/venue_2_small_hall_b.webp'}, // 2
  {name:'市民会館',  cap:800,   cost:100,  maxMatches:4, img:'../image/venue_3_civic_hall.webp'},   // 3
  {name:'中ホールA', cap:1200,  cost:200,  maxMatches:4, img:'../image/venue_4_mid_hall_a.webp'},   // 4
  {name:'中ホールB', cap:2000,  cost:400,  maxMatches:5, img:'../image/venue_5_mid_hall_b.webp'},   // 5
  {name:'大ホール',  cap:3500,  cost:800,  maxMatches:5, img:'../image/venue_6_large_hall.webp'},   // 6
  {name:'アリーナ',  cap:6000,  cost:1600, maxMatches:6, img:'../image/venue_7_arena.webp'},        // 7
  {name:'大会場',    cap:12000, cost:3200, maxMatches:7, img:'../image/venue_8_grand_venue.webp'},  // 8
  {name:'ドーム',    cap:30000, cost:12000, maxMatches:8, img:'../image/venue_9_dome.webp'},        // 9
];
// L1: orgPop→基礎集客力の区間線形補間テーブル（キャパ非依存）
const BASE_ATTENDANCE_CURVE = [
  [0,20],[5,60],[10,130],[15,200],[20,300],[25,420],[30,550],
  [35,720],[40,900],[45,1150],[50,1500],[55,1900],[60,2500],
  [65,3200],[70,4000],[75,5200],[80,7000],[85,9500],[90,14000],
  [95,16000],[100,20000]
];
const TICKET_PRICE = 0.5; // 万円/人（v1.7: シミュレーション後に要調整）
const GOODS_PRICE = 0.15; // 万円/人（v1.7: 0.08→0.15 グッズ収入底上げ）
const OCCUPANCY_BONUS = [
  {min:0.95, ticketMult:1.2, label:'🔥 超満員！',    heatDelta:+1},
  {min:0.80, ticketMult:1.1, label:'✨ 大入り！',    heatDelta:+1},
  {min:0.60, ticketMult:1.0, label:'👍 盛況',        heatDelta:0},
  {min:0.40, ticketMult:0.85,label:'➖ まずまず',    heatDelta:0},
  {min:0.25, ticketMult:0.7, label:'😟 空席目立つ',  heatDelta:-1},
  {min:0.0,  ticketMult:0.5, label:'😰 ガラガラ',    heatDelta:-2},
];
// L1: 勢い補正（満員/ガラガラ連鎖効果）
const MOMENTUM_CONFIG = {
  SELLOUT_DELTA: 0.04,        // 95%+→+4%
  GOOD_DELTA: 0.02,           // 80%+→+2%
  NEUTRAL_MIN: 0.60,          // 60-80%→±0
  WEAK_DELTA: -0.03,          // 30-60%→-3%
  EMPTY_DELTA: -0.05,         // <30%→-5%
  CAP: 0.15,                  // 上限±15%
  EMPTY_ORGPOP_PENALTY: -0.5, // <30%時のorgPopダメージ
};
// L1r: 会場スケール集客揺らぎ（会場インデックス順、±%）
// 小規模会場は地元常連で安定、大規模会場はハイリスク・ハイリターン
const VENUE_FLUCTUATION = [
  0.10,  // 0: 公民館    ±10%
  0.12,  // 1: 小ホールA  ±12%
  0.12,  // 2: 小ホールB  ±12%
  0.14,  // 3: 市民会館   ±14%
  0.15,  // 4: 中ホールA  ±15%
  0.17,  // 5: 中ホールB  ±17%（旧一律値と同等）
  0.20,  // 6: 大ホール   ±20%
  0.25,  // 7: アリーナ   ±25%
  0.30,  // 8: 大会場    ±30%
  0.40,  // 9: ドーム    ±40% — 超ハイリスク
];
const ATTENDANCE_PREDICTION = [
  { min: 0.85, text: '🔥 今週は盛り上がりそうだ', color: 'var(--green)' },
  { min: 0.55, text: '🤔 まずまずの手応えだ',     color: 'var(--text-sub)' },
  { min: 0.00, text: '😟 少し客足が心配だ',        color: 'var(--red)' },
];
// ── Card Pop & Crowd MQ Constants (v1.0c) ──
const CARD_POP_CONFIG = {
  SUB_WEIGHT: 0.7,    // サブ試合の重み（メインの7割）
  CARD_MULT:  1.2     // cardPop → cardBonus 変換倍率
};
const CARD_DEPTH_MULT = [0.85, 0.92, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
//                        1試合  2試合  3試合  4試合  5試合  6試合  7試合  8試合
const CROWD_HEAT_MQ = [
  { min: 0.95, bonus: +3, label: '超満員の熱気' },
  { min: 0.80, bonus: +2, label: '大入りの声援' },
  { min: 0.60, bonus: +1, label: '盛況の雰囲気' },
  { min: 0.40, bonus:  0, label: '' },
  { min: 0.25, bonus: -1, label: '空席の静けさ' },
  { min: 0.00, bonus: -3, label: 'ガラガラの寂しさ' },
];
// L1: 10段対応 — 公民館=0, 小A=0, 小B=+1, 市民=+1, 中A=+1, 中B=+1, 大ホール=+2, アリーナ=+2, 大会場=+2, ドーム=+3
const VENUE_SCALE_MQ = [0, 0, 1, 1, 1, 1, 2, 2, 2, 3];

// ── Popularity System Constants (v1.0b) ──
const SCANDAL_CONFIG = {
  baseChance: 0.005,   // 週0.5%
  champChance: 0.0025,   // チャンピオンは半分
  minPop: 40,           // 人気40以上のみ対象
  penaltyMin: 20,
  penaltyMax: 35,
  messages: ['📰 週刊誌にスクープが…', '📱 SNSで炎上騒動が…', '⚠️ 素行問題が発覚…']
};
const LOSING_STREAK_PENALTIES = [
  {threshold: 3, penalty: -5, msg: '陰りが見え始める…'},
  {threshold: 5, penalty: -10, msg: '低迷が深刻化…'},
  {threshold: 7, penalty: -15, msg: '失望感が広がる…'}
];
const PROMO_POP_CAP = 70; // プロモのみで到達可能な人気上限（旧55→70）
const PROMO_MQ_PER_STACK = 1.3; // promoStack 1回あたりのMQボーナス（最大3スタック×1.3=+3.9）
const PROMO_EVENT_INCOME = [
  { min:  0, max: 14, val:  15 },  // 地元の小イベント
  { min: 15, max: 29, val:  25 },  // 地域イベント常連
  { min: 30, max: 44, val:  40 },  // ファンミ・握手会
  { min: 45, max: 59, val:  55 },  // 単独イベント成立
  { min: 60, max: 74, val:  70 },  // メディア出演含む
  { min: 75, max:100, val:  85 },  // 大型イベント
];
const PROMO_EVENT_NAMES = {
  low:  ['地域イベント出演', '商店街キャンペーン', 'SNS配信', '地元FM出演'],
  mid:  ['握手会', 'ファンミーティング', 'トークショー', 'グッズ販売会'],
  high: ['大型イベント出演', 'TV番組出演', '雑誌撮影会', 'スペシャルショー'],
};
const TRANSFER_POP_MULT = 0.75; // 移籍時の人気リセット係数
const SPONSOR_TABLE = [
  {min:0,max:19,val:0},{min:20,max:39,val:10},{min:40,max:59,val:30},
  {min:60,max:79,val:60},{min:80,max:94,val:120},{min:95,max:100,val:200}
];
const BROADCAST_TABLE = [
  {min:70,max:84,val:50},{min:85,max:94,val:100},{min:95,max:100,val:200}
];
const FIXED_COSTS = {admin:30};
// v1.7: 育成補助金 — 序盤の団体運営を支援（orgPop 40以上で打ち切り）
const SUBSIDY_TABLE = [
  {max:19, val:80},  // orgPop 0-19: 80万/週
  {max:29, val:65},  // orgPop 20-29: 65万/週
  {max:34, val:45},  // orgPop 30-34: 45万/週（緩衝帯）
  {max:39, val:20},  // orgPop 35-39: 20万/週
];

// Heat System
const HEAT_LEVELS = [
  {id:'ice_cold', label:'Ice Cold',  emoji:'🧊', color:'#74b9ff', mult:0.7, min:-999, max:-6, anim:''},
  {id:'cold',     label:'Cold',   emoji:'❄️', color:'#a29bfe', mult:0.85, min:-5, max:-2, anim:''},
  {id:'neutral',  label:'Neutral', emoji:'➖', color:'#dfe6e9', mult:1.0, min:-1, max:1, anim:''},
  {id:'warm',     label:'Warm',   emoji:'🔥', color:'#fdcb6e', mult:1.1, min:2, max:5, anim:''},
  {id:'hot',      label:'Hot',   emoji:'🔥🔥', color:'#e17055', mult:1.2, min:6, max:9, anim:'heat-pulse'},
  {id:'on_fire',  label:'On Fire!', emoji:'🔥🔥🔥', color:'#d63031', mult:1.3, min:10, max:999, anim:'heat-blaze'}
];

// Quarter / Season display labels
const QUARTER_LABELS = {1:'🌸 春', 2:'☀️ 夏', 3:'🍂 秋', 4:'❄️ 冬'};

// Injury System
const INJURY_TABLE = [
  {type:'軽傷', minWeeks:1, maxWeeks:2, threshold:0.12, color:'#fdcb6e'},
  {type:'中傷', minWeeks:3, maxWeeks:4, threshold:0.05, color:'#e17055'},
  {type:'重傷', minWeeks:6, maxWeeks:8, threshold:0.02, color:'#d63031'}
];

// v1.3-2: Growth penalty table by injury severity
const INJURY_DEBUFF_TABLE = {
  '軽傷': { remainingWeeks: 6,  multiplier: 0.7,  source: 'minor'    },
  '中傷': { remainingWeeks: 14, multiplier: 0.4,  source: 'moderate' },
  '重傷': { remainingWeeks: 24, multiplier: 0.15, source: 'severe'   },
};

// Title System
const TITLES = [
  {id:'world', name:'団体王座', mqBonus:10, popBonus:3, attendBonus:1.15, emoji:'🏆'}
];

// Rivalry System
const RIVALRY_THRESHOLDS = [
  {tier:1, matches:2, label:'因縁', mqBonus:2, color:'#fdcb6e', emoji:'⚡'},
  {tier:2, matches:4, label:'宿敵', mqBonus:4, color:'#e17055', emoji:'🔥'},
  {tier:3, matches:7, label:'宿命の相手', mqBonus:6, color:'#d63031', emoji:'💥'}
];

// Phase 5: 片側因縁（一方的にライバル視している状態）
const ONESIDED_RIVALRY_MQ_BONUS = 1;
const ONESIDED_RIVALRY_LABEL = '片側因縁';
const ONESIDED_RIVALRY_EMOJI = '⚡';
const ONESIDED_RIVALRY_COLOR = '#ffeaa7';

// 因縁決着システム — 試合前の宣戦布告セリフ（ペア台詞）
const RIVALRY_CONFRONTATION_LINES = {
  pairs: [
    ['今日こそ、決着をつける', '……望むところよ'],
    ['何度やっても結果は同じだ', 'それは終わってから言いなさい'],
    ['この因縁、今夜終わりにしよう', '最後にふさわしい試合にしましょう'],
    ['覚悟はいいわね？', '生まれた時からできてるわ'],
    ['あなたを超える。今日、ここで', '超えられるものなら、やってみなさい'],
  ],
  fatePairs: [
    ['長かった……この物語に、終止符を打つ', 'ええ……最高の結末を見せましょう'],
    ['何度も戦った。でも今日が最後だ', 'わかっている。だから全力で来なさい'],
    ['あなたがいなければ、今の私はいない', '……お互い様よ。だから今日も全力で'],
  ],
};

// 因縁決着システム — 試合後の決着セリフ（personality×archetype）
const RIVALRY_RESOLUTION_LINES = {
  winner: {
    normal: {
      _default: ['ようやく決着がついた…最高の相手だった', 'この勝利は、あの人がいたから掴めた'],
      ojousama: ['ようやく決着がつきましたわ…最高のお相手でした'],
      delinquent: ['やっと決着ついたぜ…最高の相手だったよ'],
      seductive: ['ようやく決着がついたわね…最高の相手だった'],
    },
    bold: {
      _default: ['何度でも言う。あなたは最高のライバルだ', 'この拳が届いた…それだけで十分だ'],
      ojousama: ['何度でも申しますわ。あなたは最高のライバルですの'],
      delinquent: ['お前は最高のライバルだ。それだけは認めてやる'],
      cool: ['…決着がついた。感謝する'],
      seductive: ['あなたは最高のライバルよ。それは変わらないわ'],
    },
    quiet: {
      _default: ['……ありがとう'],
      cool: ['…終わった。…いい戦いだった'],
      polite: ['…ありがとうございました'],
    },
    shy: { _default: ['あ、ありがとう…ございました…'] },
    easygoing: {
      _default: ['終わった…でもこの因縁に感謝してるよ！'],
      delinquent: ['やったぜ…でもお前がいなきゃここまで来れなかった'],
      seductive: ['終わったわね…でも、この因縁に感謝してるの'],
    },
    earnest: {
      _default: ['ようやく決着がついた…最高の相手でした', '終わった…でもこの因縁に感謝している'],
      polite: ['決着がつきました…最高のお相手でした'],
      ojousama: ['ようやく決着ですわ…最高のお相手でしたの'],
      seductive: ['決着がついたわ…最高の相手だった'],
    },
    emotional: { _default: ['終わった…！最高の…相手だった…（涙）'] },
  },
  loser: {
    normal: {
      _default: ['負けた…でもこの試合は誇りに思う', '悔しい。でもあなたが強かった。それだけだ'],
      ojousama: ['負けましたわ…でもこの試合は誇りに思いますの'],
      delinquent: ['負けた…でもこの試合は誇りに思うぜ'],
      seductive: ['負けたわ…でもこの試合は誇りに思う'],
    },
    bold: {
      _default: ['完敗だ。でも私はまだ終わらない', '次は…いや、今はこの敗北を受け入れる'],
      ojousama: ['完敗ですわ。でもまだ終わりませんの'],
      delinquent: ['完敗だ…でも終わりじゃねえ'],
      cool: ['…認める。だが、まだ終わらない'],
      seductive: ['完敗ね。でも、まだ終わらないわ'],
    },
    quiet: {
      _default: ['………（静かに相手を見つめている）'],
      cool: ['…強かった。認める'],
      polite: ['…ありがとうございました。…強かったです'],
    },
    shy: { _default: ['…負けちゃった…でも…悔いはない、です…'] },
    easygoing: {
      _default: ['ありがとう。あなたのおかげで強くなれた'],
      delinquent: ['サンキュ…お前のおかげで強くなれたよ'],
      seductive: ['ありがとう。あなたのおかげで強くなれたわ'],
    },
    earnest: {
      _default: ['負けた…でもこの試合は誇りに思います', 'ありがとうございます。あなたのおかげで強くなれました'],
      polite: ['負けました…でもこの試合は誇りです'],
      ojousama: ['負けましたわ…でもこの試合は誇りに思いますの'],
      seductive: ['負けたわ…でもこの試合は誇りに思う'],
    },
    emotional: { _default: ['悔しい…！でも…最高の試合だった…！'] },
  },
  fateWinner: {
    normal: {
      _default: ['この物語に終止符を打てた…感無量だ'],
      ojousama: ['この物語に終止符を打てましたわ…感無量ですの'],
      delinquent: ['やっと…終わったんだな…'],
      seductive: ['この物語に終止符を打てたわ…'],
    },
    bold: {
      _default: ['長かった。でもあなたなしでは辿り着けなかった', 'これが最終章。最高のエンディングだ'],
      cool: ['…終わった。…最高の物語だった'],
    },
    quiet: { _default: ['………（深く息を吐き、静かに微笑む）'] },
    shy: { _default: ['終わった…のかな…（涙が溢れている）'] },
    easygoing: { _default: ['やっと終わったんだ…最高の物語だったよ…！'] },
    earnest: { _default: ['長い戦いでした…あなたなしでは辿り着けなかった'] },
    emotional: { _default: ['終わった…！やっと…！ありがとう…！（号泣）'] },
  },
  fateLoser: {
    normal: {
      _default: ['あなたには敵わなかった。でもこの戦いは宝物だ'],
      ojousama: ['敵いませんでしたわ。でもこの戦いは宝物ですの'],
      delinquent: ['敵わなかったぜ…でもこの戦いは宝物だ'],
      seductive: ['敵わなかったわ。でもこの戦いは宝物よ'],
    },
    bold: {
      _default: ['幾度となく戦った。すべてが私の財産だ', '最後まで…全力だった。悔いはない'],
      cool: ['…全力だった。悔いはない'],
    },
    quiet: { _default: ['………ありがとう（小さく、でも確かに）'] },
    shy: { _default: ['ありがとう…ございました…（涙を拭いている）'] },
    easygoing: { _default: ['全部…全部宝物だよ。ありがとう'] },
    earnest: { _default: ['すべてが私の財産です。悔いはありません'] },
    emotional: { _default: ['敵わなかった…でも…全部宝物だよ…！（泣き笑い）'] },
  },
};

// v1.5s25: MQ外部ボーナス合計の上限（因縁+タイトル+コーチ+観客の合計キャップ）
const MQ_EXTERNAL_CAP = 15;

// 好敵手（決着2回完了後の永続ステータス）
const GOODRIVAL_MQ_BONUS = 2;
const GOODRIVAL_LABEL = '好敵手';
const GOODRIVAL_EMOJI = '🤝';
const GOODRIVAL_COLOR = '#74b9ff';

// カード鮮度システム
const FRESHNESS_CONFIG = {
  windowShows: 12,        // 直近12興行を対象
  firstMeetBonus: 2,      // 初顔合わせボーナス
  penalties: [
    { minCount: 3, mqPenalty: -3 },   // マンネリ
    { minCount: 4, mqPenalty: -5 },   // 深刻なマンネリ
    { minCount: 5, mqPenalty: -8 },   // 完全なマンネリ
  ],
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4B: COACH DATA (v2.0 redesign)                  ║
// ╚══════════════════════════════════════════════════════════╝

// 指導力ランク別成長倍率 🔧
const COACH_RANKS = { E:1.05, D:1.08, C:1.12, B:1.18, A:1.25 };

// 得意スタイル表示名（選手スタイルと統一）
const COACH_STYLE_MAP = {
  Grappler:'グラップラー', Striker:'ストライカー', Speed:'スピード',
  Submission:'サブミッション', Brawler:'ブローラー', Allround:'オールラウンド'
};

// スタイルマッチボーナス（専門一致+0.08 / オールラウンド万能+0.05）
const COACH_STYLE_BONUS = { specialist: 0.08, allround: 0.05 };

// コーチ枠（orgPop連動）
const COACH_SLOT_THRESHOLDS = [
  { slots:1, minOrgPop:0 },
  { slots:2, minOrgPop:25 },
  { slots:3, minOrgPop:50 }
];

// シーズンプール設定
const COACH_POOL_CFG = { candidatesMin:5, candidatesMax:8 };

// コーチ特性定義 🔧
const COACH_TRAIT_DEFS = {
  '新人育成':       { desc:'OVR60以下の選手の成長速度 ×1.15', growthMult:1.15, ovrThreshold:60 },       // 🔧
  'ベテラン調整':   { desc:'OVR80以上の選手の衰え量 -1/回',   decayReduction:1, ovrThreshold:80 },       // 🔧
  'コンディショニング': { desc:'担当選手の怪我確率 ×0.8、週次コンディション消耗 -2', injuryMult:0.8, condDrain:-2 }, // 🔧
  '実戦主義':       { desc:'試合出場時の成長ボーナス +0.3',    matchGrowthBonus:0.3 },                    // 🔧
  '引き出し上手':   { desc:'担当選手の試合MQ +2',              mqBonus:2 },                               // 🔧
  '人脈持ち':       { desc:'スカウト候補に追加+1人',           scoutBonus:1 }                             // 🔧
};

// フォーマット: {id, name, emoji, hasPortrait, grade, teaching, observation, style, trait,
//               salary(万/週), hireFee(万), minOrgPop, desc, [age, gender, origin, profile]}
const ALL_COACHES = [
  // ── 既存8人（hasPortrait: true）リデザイン ──────────────────────────────
  {id:1, name:'鬼塚 剛志',          emoji:'💪', hasPortrait:true,
   grade:'B', teaching:'B', observation:'D', style:'Grappler', trait:'新人育成',
   salary:25, hireFee:200, minOrgPop:30,
   age:58, gender:'男', origin:'北海道',
   desc:'パワー育成の鬼。若手選手を力強く鍛え上げる。',
   profile:'元柔道全日本代表。引退後は独自のパワートレーニング理論を確立し、多くの格闘家を育て上げた。「力なき技は無力」が口癖。厳しいが、弟子想いの熱血指導者。'},
  {id:2, name:'飛鳥 真琴',          emoji:'💨', hasPortrait:true,
   grade:'B', teaching:'B', observation:'C', style:'Speed', trait:'実戦主義',
   salary:22, hireFee:180, minOrgPop:30,
   age:34, gender:'女', origin:'大阪',
   desc:'スピード強化の専門家。試合で使えるスピードを徹底的に叩き込む。',
   profile:'元陸上短距離選手で、100m走の元ジュニア日本記録保持者。スポーツ科学を専攻し、反応速度と瞬発力の最適化に特化した独自メソッドを持つ。明るく前向きな性格で選手からの信頼が厚い。'},
  {id:3, name:'鶴見 正嗣',          emoji:'🎯', hasPortrait:true,
   grade:'B', teaching:'C', observation:'B', style:'Striker', trait:'引き出し上手',
   salary:20, hireFee:160, minOrgPop:30,
   age:62, gender:'男', origin:'京都',
   desc:'テクニックの匠。選手の潜在能力を引き出す観察眼が鋭い。',
   profile:'伝統派空手の八段師範で、技の精度と美しさを極限まで追求する職人気質。寡黙だが、一言一言に含蓄がある。「技は千回の反復から生まれる」と繰り返し教えている。'},
  {id:4, name:'岩田 拓海',          emoji:'🏃', hasPortrait:true,
   grade:'C', teaching:'C', observation:'D', style:'Brawler', trait:'コンディショニング',
   salary:10, hireFee:60, minOrgPop:0,
   age:41, gender:'男', origin:'長野',
   desc:'スタミナとフィジカル強化のプロ。コンディション管理にも定評がある。',
   profile:'元トライアスロン選手。高地トレーニングや心肺機能の強化プログラムに精通。科学的アプローチで選手の持久力を最大限まで引き出す。温厚で計画的な性格。'},
  {id:5, name:'沢村 玲子',          emoji:'🧠', hasPortrait:true,
   grade:'C', teaching:'D', observation:'C', style:'Allround', trait:'ベテラン調整',
   salary:8, hireFee:50, minOrgPop:0,
   age:45, gender:'女', origin:'東京',
   desc:'メンタル強化の専門家。ベテラン選手の長期安定稼働を支える。',
   profile:'臨床心理士の資格を持つスポーツ心理学者。試合前のプレッシャー管理、集中力維持、モチベーション管理を得意とする。穏やかな物腰だが、核心を突く洞察力を持つ。'},
  {id:6, name:'朝日 義男',          emoji:'⭐', hasPortrait:true,
   grade:'C', teaching:'C', observation:'C', style:'Allround', trait:'新人育成',
   salary:9, hireFee:55, minOrgPop:0,
   age:52, gender:'男', origin:'福岡',
   desc:'万能型の指導者。若手の総合力底上げが得意。',
   profile:'元プロレスラーで、現役時代は「器用貧乏」と呼ばれながらも15年のキャリアを全うした苦労人。全てのポジションを経験した豊富な知識で、若手の総合力底上げを得意とする。面倒見が良い。'},
  {id:7, name:'紅林 太一',          emoji:'🎬', hasPortrait:true,
   grade:'C', teaching:'D', observation:'B', style:'Allround', trait:'引き出し上手',
   salary:10, hireFee:70, minOrgPop:0,
   age:48, gender:'男', origin:'名古屋',
   desc:'試合構成の達人。担当選手の試合MQを引き上げる。',
   profile:'元プロレス実況アナウンサーで試合構成を熟知するセコンドマン。リング外から「次の展開」を的確に指示し、試合のドラマ性を引き上げる。話術に長け、社交的な性格。'},
  {id:8, name:'白川 沙耶',          emoji:'📣', hasPortrait:true,
   grade:'C', teaching:'E', observation:'D', style:'Allround', trait:'人脈持ち',
   salary:6, hireFee:40, minOrgPop:0,
   age:29, gender:'女', origin:'横浜',
   desc:'業界人脈が豊富。スカウト候補に追加選手を引き込む。',
   profile:'元芸能事務所マネージャーで、SNSマーケティングとメディア露出戦略のプロ。選手の魅力を引き出すブランディングが得意。行動力があり、常に新しいプロモーション企画を提案する。'},

  // ── 新規Cグレード（12人）────────────────────────────────────────────────
  {id:9, name:'大森 健吾',        emoji:'🥊', hasPortrait:false,
   grade:'C', teaching:'D', observation:'E', style:'Brawler', trait:'コンディショニング',
   salary:6, hireFee:35, minOrgPop:0,
   age:32, gender:'男', origin:'埼玉',
   desc:'元ボディビルダーのトレーナー。地道にフィジカルの土台を作る。',
   profile:'元アマチュアボディビル入賞者。筋肉づくりの知識は確かだが、プロレス指導の経験はまだ浅い。地道なフィジカルトレーニングで選手の土台をコツコツ作り上げる。口下手だが、黙々と付き合ってくれる信頼感がある。'},
  {id:10, name:'宮本 花菜',   emoji:'🌱', hasPortrait:false,
   grade:'C', teaching:'E', observation:'D', style:'Speed', trait:'新人育成',
   salary:5, hireFee:30, minOrgPop:0,
   age:26, gender:'女', origin:'神奈川',
   desc:'元体操選手の若手コーチ。新人の素質を見抜く直感が鋭い。',
   profile:'体操競技で培った身体能力と空間認識力を持つ若きコーチ。新人の素質を見抜く直感に優れ、荒削りな原石を見つけ出すのが得意。指導経験はまだ浅いが、選手と同じ目線で成長を後押しする姿勢が持ち味。'},
  {id:11, name:'真壁 龍太',     emoji:'🤼', hasPortrait:false,
   grade:'C', teaching:'C', observation:'D', style:'Submission', trait:'実戦主義',
   salary:9, hireFee:55, minOrgPop:0,
   age:37, gender:'男', origin:'沖縄',
   desc:'元MMA選手。実戦で使えるテクニックだけを叩き込む。',
   profile:'MMAの実戦経験から関節技やグラウンドテクニックに精通。「試合で使えない技術は教えない」がモットーの実戦派。感情を表に出さないクールな指導スタイルだが、試合前のアドバイスは的確で頼りになる。'},
  {id:12, name:'長谷川 美咲', emoji:'🩺', hasPortrait:false,
   grade:'C', teaching:'D', observation:'C', style:'Brawler', trait:'コンディショニング',
   salary:7, hireFee:45, minOrgPop:0,
   age:33, gender:'女', origin:'静岡',
   desc:'理学療法士。選手の故障予防とリカバリーに特化。',
   profile:'スポーツリハビリの専門家として、選手の故障予防と回復を支える。派手さはないが、コンディション管理において堅実な仕事をする。「壊れてからでは遅い」が口癖で、日々の体調チェックを欠かさない。'},
  {id:13, name:'黒田 修平',       emoji:'🔭', hasPortrait:false,
   grade:'C', teaching:'E', observation:'C', style:'Striker', trait:'人脈持ち',
   salary:7, hireFee:40, minOrgPop:0,
   age:44, gender:'男', origin:'広島',
   desc:'元スポーツ紙記者。業界全体に張り巡らされた情報網を持つ。',
   profile:'長年の取材活動で築いた人脈は業界随一。あらゆる団体の内情や有望選手の情報が集まってくる。コーチとしての指導力はまだまだだが、スカウト情報の質と速さでは右に出る者がいない。おしゃべり好きで団体のムードメーカー。'},
  {id:14, name:'土屋 弘美',   emoji:'🏋️', hasPortrait:false,
   grade:'C', teaching:'C', observation:'D', style:'Grappler', trait:'ベテラン調整',
   salary:9, hireFee:58, minOrgPop:0,
   age:50, gender:'女', origin:'新潟',
   desc:'元ウエイトリフティング選手。ベテランのパワー維持に長けた姉御肌。',
   profile:'パワー系トレーニングの知識と中高年の体作りの経験を併せ持つベテランコーチ。年齢を重ねた選手の身体を理解し、無理のない方法でパワーを維持させることに長けている。「あんたはまだまだやれる」と選手を鼓舞する頼れる姉御。'},
  {id:15, name:'林 拓海',     emoji:'🦅', hasPortrait:false,
   grade:'C', teaching:'D', observation:'D', style:'Striker', trait:'実戦主義',
   salary:6, hireFee:38, minOrgPop:0,
   age:30, gender:'男', origin:'兵庫',
   desc:'元キックボクサー。実戦形式でスピードと反射神経を鍛える。',
   profile:'キックボクシングで磨いたフットワークと反射神経を武器にするスピード系コーチ。「考える前に動け」がモットーで、実戦形式の練習を好む。やや性急なところはあるが、選手と一緒に汗を流す情熱的な指導で慕われている。'},
  {id:16, name:'森田 悠子', emoji:'💊', hasPortrait:false,
   grade:'C', teaching:'E', observation:'E', style:'Submission', trait:'コンディショニング',
   salary:5, hireFee:30, minOrgPop:0,
   age:38, gender:'女', origin:'岩手',
   desc:'ヨガと栄養学による地味だが堅実なコンディション管理。',
   profile:'ヨガと栄養学の知識を組み合わせた独自のコンディショニング指導が持ち味。目立つ成果はすぐには出ないが、長期的に選手の体質を改善する堅実な手腕がある。物静かで存在感は薄いが、選手の小さな変化も見逃さない。'},
  {id:17, name:'篠原 隆',   emoji:'🔎', hasPortrait:false,
   grade:'C', teaching:'D', observation:'C', style:'Grappler', trait:'引き出し上手',
   salary:8, hireFee:50, minOrgPop:0,
   age:55, gender:'男', origin:'熊本',
   desc:'元レフェリー歴30年。リングの中から培った試合眼の持ち主。',
   profile:'レフェリーとして数千試合をリングの中から見てきた試合眼の持ち主。選手の長所を見抜き、それを活かす試合運びを提案するのが得意。自らリングに上がることはないが、技術アドバイスの正確さは折り紙付き。控えめだが、言葉に重みがある。'},
  {id:18, name:'赤城 凛',     emoji:'🪖', hasPortrait:false,
   grade:'C', teaching:'C', observation:'E', style:'Grappler', trait:'実戦主義',
   salary:8, hireFee:48, minOrgPop:0,
   age:36, gender:'女', origin:'群馬',
   desc:'元女子レスリング選手。スパルタ式でフィジカルを鍛え上げる。',
   profile:'レスリングで鍛えた実戦感覚と圧倒的なフィジカルを持つスパルタコーチ。練習は厳しいが、選手が壁を乗り越えた瞬間に見せる笑顔は本物。「甘やかして強くなった人間はいない」が信条。不器用だが、選手の成長を誰よりも喜ぶ。'},
  {id:19, name:'西岡 学', emoji:'📊', hasPortrait:false,
   grade:'C', teaching:'C', observation:'C', style:'Submission', trait:'引き出し上手',
   salary:10, hireFee:65, minOrgPop:0,
   age:40, gender:'男', origin:'奈良',
   desc:'バイオメカニクス研究者。科学的分析で選手の技術を最適化する。',
   profile:'身体の動きを科学的に分析するスペシャリスト。映像分析やデータを駆使して選手の技術を最適化する。プロレスの現場経験は少ないが、理論に基づいた的確な改善提案で信頼を得つつある。話し始めると止まらないマニアックな一面も。'},
  {id:20, name:'藤原 千春',   emoji:'🧘', hasPortrait:false,
   grade:'C', teaching:'D', observation:'C', style:'Speed', trait:'ベテラン調整',
   salary:7, hireFee:45, minOrgPop:0,
   age:47, gender:'女', origin:'石川',
   desc:'元メンタルトレーナー。ベテラン選手の心を支え闘志を再点火する。',
   profile:'数多くのプロアスリートのメンタルケアを手掛けてきたベテラン。長年戦い続けた選手の心の疲労を読み取り、再び闘志を灯す手助けをする。「身体が動かないのは、心が止まっているから」が持論。穏やかな語り口で選手に寄り添う。'},

  // ── 新規Bグレード（10人）────────────────────────────────────────────────
  {id:21, name:'熊谷 鉄也', emoji:'🐉', hasPortrait:false,
   grade:'B', teaching:'B', observation:'C', style:'Brawler', trait:'コンディショニング',
   salary:28, hireFee:220, minOrgPop:30,
   age:46, gender:'男', origin:'宮城',
   desc:'元ラグビー日本代表フィジカルコーチ。パワーと体調管理を高次元で両立。',
   profile:'ラグビー日本代表のフィジカルを支えた実績を持つ一流のストレングス＆コンディショニングコーチ。パワートレーニングと体調管理の両立を高い次元で実現する。豪快な見た目に反して緻密なプログラムを組む。「強い身体は、正しい管理から生まれる」が信条。'},
  {id:22, name:'安藤 美波',   emoji:'⚡', hasPortrait:false,
   grade:'B', teaching:'B', observation:'D', style:'Striker', trait:'実戦主義',
   salary:24, hireFee:190, minOrgPop:30,
   age:31, gender:'女', origin:'愛知',
   desc:'元女子MMA王者「閃光」。スピードを活かした実戦指導の達人。',
   profile:'MMAで「閃光」の異名を取ったスピードファイター。現役時代の実戦経験を基に、スピードを活かした攻防の極意を叩き込む。妥協を許さないストイックな指導だが、選手からの信頼は厚い。「速さは才能じゃない、執念だ」と説く。'},
  {id:23, name:'堀内 義孝',     emoji:'🌙', hasPortrait:false,
   grade:'B', teaching:'C', observation:'B', style:'Grappler', trait:'引き出し上手',
   salary:20, hireFee:165, minOrgPop:30,
   age:53, gender:'男', origin:'山梨',
   desc:'元レスリングナショナルコーチ。選手の隠れた才能を見逃さない名伯楽。',
   profile:'レスリング指導の世界で長年培った観察眼は、選手の隠れた才能を見逃さない。派手な指導はしないが、一人ひとりの特性に合わせた技術指導で着実に選手を伸ばす。「答えは選手の中にある。それを引き出すのが俺の仕事だ」と語る。'},
  {id:24, name:'中村 紗弓',   emoji:'🏆', hasPortrait:false,
   grade:'B', teaching:'B', observation:'C', style:'Speed', trait:'新人育成',
   salary:30, hireFee:250, minOrgPop:30,
   age:35, gender:'女', origin:'千葉',
   desc:'元新体操日本代表。基礎の美しさから強い選手を育てる万能型。',
   profile:'新体操の美しさと厳しさの中で培われた万能型の指導力を持つ。新人の基礎作りからメンタル面まで幅広くカバーし、バランスの取れた選手を育成する。「基礎が美しい選手は、必ず強くなる」を信じて疑わない情熱的な指導者。'},
  {id:25, name:'宮沢 康弘',     emoji:'🛡️', hasPortrait:false,
   grade:'B', teaching:'C', observation:'B', style:'Brawler', trait:'ベテラン調整',
   salary:22, hireFee:180, minOrgPop:30,
   age:57, gender:'男', origin:'山形',
   desc:'元スポーツ整形外科医。医学的知見でベテラン選手の寿命を延ばす。',
   profile:'医師としての深い身体知識を持つ異色のコーチ。ベテラン選手特有の身体の悩みを医学的見地から理解し、適切な調整法を提案する。「選手の寿命を一年でも延ばす」ことに情熱を注ぐ。慎重な性格で、無理は絶対にさせない。'},
  {id:26, name:'カルロス 真理', emoji:'🌐', hasPortrait:false,
   grade:'B', teaching:'D', observation:'B', style:'Allround', trait:'人脈持ち',
   salary:18, hireFee:150, minOrgPop:30,
   age:42, gender:'女', origin:'ブラジル',
   desc:'日系ブラジル人の元エージェント。国内外の格闘技界に太いパイプを持つ。',
   profile:'日本とブラジルの格闘技コミュニティに太いパイプを持つ国際派コーチ。海外の有望選手の情報にも精通し、他団体との交渉でも力を発揮する。指導力は発展途上だが、人脈と情報収集力はB格随一。「人を繋ぐことが、私の一番の技術」と語る。'},
  {id:27, name:'大河原 剛士',   emoji:'🦁', hasPortrait:false,
   grade:'B', teaching:'B', observation:'B', style:'Grappler', trait:'新人育成',
   salary:32, hireFee:270, minOrgPop:30,
   age:43, gender:'男', origin:'北海道',
   desc:'元グレコローマン全日本王者。若手のパワーを短期間で開花させる。',
   profile:'グレコローマンで鍛え上げた圧倒的なパワーと、若手を一人前に育てる手腕を兼ね備えた実力派コーチ。基礎体力の徹底と実戦練習を組み合わせた指導で、新人のパワーを短期間で開花させる。「強くなりたいなら、まず自分に負けるな」が口癖。'},
  {id:28, name:'羽田 小百合',   emoji:'⚖️', hasPortrait:false,
   grade:'B', teaching:'B', observation:'C', style:'Speed', trait:'ベテラン調整',
   salary:26, hireFee:210, minOrgPop:30,
   age:44, gender:'女', origin:'東京',
   desc:'元プロダンサー。ベテランの動きのキレとしなやかさを維持させる。',
   profile:'ダンスで培った身体操作と表現力の知見をプロレスに応用する異色のコーチ。ベテラン選手の動きのキレを維持し、年齢を感じさせないしなやかさを引き出す。「身体は楽器。手入れを怠れば音は鈍る」という哲学でスピードを守り続ける。'},
  {id:29, name:'陳 偉明', emoji:'💆', hasPortrait:false,
   grade:'B', teaching:'C', observation:'B', style:'Submission', trait:'コンディショニング',
   salary:21, hireFee:170, minOrgPop:30,
   age:49, gender:'男', origin:'台湾',
   desc:'東洋医学の専門家。心身を総合的に診て最適なコンディションに導く。',
   profile:'東洋医学の叡智とスポーツ科学を融合させたコンディショニングの達人。選手の心身の状態を総合的に診て、最適な調整を施す。「気の流れが整えば、身体は自ずと応える」という哲学に基づく独自のアプローチは、多くの選手から絶大な信頼を得ている。'},
  {id:30, name:'冴島 楓',   emoji:'🔩', hasPortrait:false,
   grade:'B', teaching:'B', observation:'D', style:'Submission', trait:'実戦主義',
   salary:25, hireFee:200, minOrgPop:30,
   age:39, gender:'女', origin:'大阪',
   desc:'元ブラジリアン柔術黒帯。反復ドリルで関節技と寝技の技術を叩き込む。',
   profile:'ブラジリアン柔術の国際大会で優勝経験を持つ技巧派。一つの技を何百回と反復させるドリル式指導で、選手のテクニックを確実に底上げする。口数は少ないが、マット上での手本は雄弁。「身体が覚えるまで、何度でも」が指導哲学。'},

  // ── 新規Aグレード（5人）────────────────────────────────────────────────
  {id:31, name:'神崎 鋼子',           emoji:'👑', hasPortrait:false,
   grade:'A', teaching:'A', observation:'B', style:'Allround', trait:'新人育成',
   salary:80, hireFee:700, minOrgPop:55,
   age:60, gender:'女', origin:'東京',
   desc:'「鉄の母」と呼ばれる伝説的指導者。何人もの日本代表選手を輩出した最高峰。',
   profile:'女子バレーボール日本代表監督として五輪に4度帯同し、「鉄の母」と呼ばれた伝説的指導者。彼女の元から巣立った日本代表選手は両手では数えきれない。新人の原石を見抜く眼力と、才能を最大限に引き出す指導力は他の追随を許さない。近年は女子プロレス界にもその手腕を発揮し、格闘技未経験の選手を一流のレスラーへ育て上げる実績を次々と打ち立てている。厳しさの奥に深い愛情を秘めた、スポーツ指導界の生きる伝説。'},
  {id:32, name:'巌流 正道',           emoji:'🐯', hasPortrait:false,
   grade:'A', teaching:'A', observation:'C', style:'Grappler', trait:'実戦主義',
   salary:70, hireFee:600, minOrgPop:55,
   age:56, gender:'男', origin:'鹿児島',
   desc:'元大相撲力士のパワー系最高峰。実戦で通用する力を最短で身につけさせる。',
   profile:'角界で鍛え上げた圧倒的なパワー理論と、格闘技指導で磨いた実戦メソッドを持つ最高峰のパワー系コーチ。その指導を受けた選手は例外なくパワーで試合を支配するようになると言われる。威圧的な風貌だが、弟子思いの人情家。「力とは、覚悟の結晶だ」と説く。'},
  {id:33, name:'葉月 レミ', emoji:'🌸', hasPortrait:false,
   grade:'A', teaching:'A', observation:'B', style:'Speed', trait:'引き出し上手',
   salary:65, hireFee:550, minOrgPop:55,
   age:45, gender:'女', origin:'福岡',
   desc:'元ショートトラックスピードスケート五輪銀メダリスト。女子プロレスでも一時代を築いた異色の経歴を持つ。',
   profile:'ショートトラックスピードスケートでオリンピック銀メダルを獲得した元スプリンター。氷上で培った爆発的な加速力と接触を恐れない勝負度胸を武器に、引退後は女子プロレスに転身して一時代を築いた異色の経歴を持つ。二つの世界で頂点を知る彼女だからこそ、選手の中に眠るスピードの才能を誰よりも的確に見抜き、引き出すことができる。「速さの本質は、一歩目に全てを懸ける覚悟」と語るカリスマ。'},
  {id:34, name:'御堂 清四郎', emoji:'🎭', hasPortrait:false,
   grade:'A', teaching:'B', observation:'A', style:'Submission', trait:'引き出し上手',
   salary:60, hireFee:500, minOrgPop:55,
   age:65, gender:'男', origin:'東京',
   desc:'柔道五輪金メダリスト「技の神」。業界随一の観察眼を持つ生ける伝説。',
   profile:'柔道でオリンピック金メダルを獲得し「技の神」と称される生ける伝説。世界柔道殿堂入りを果たし、引退後は国際柔道連盟テクニカルアドバイザーとして世界各国の選手を指導。選手の動きを一目見ただけでその強みと弱点を見抜く観察眼は、業界で最も畏怖される能力。多くを語らないが、そのひと言が選手の人生を変えると言われる。'},
  {id:35, name:'如月 薫',         emoji:'🌿', hasPortrait:false,
   grade:'A', teaching:'B', observation:'A', style:'Allround', trait:'コンディショニング',
   salary:55, hireFee:450, minOrgPop:55,
   age:52, gender:'女', origin:'京都',
   desc:'JOC帯同のスポーツ医学博士。コンディション管理の最高権威。',
   profile:'オリンピックの舞台で日本のトップアスリートを支え続けてきたスポーツ医学の最高権威。身体のコンディショニングに関して、この人の右に出る者は日本にいないと言われる。科学的根拠に基づく緻密なプログラムで選手の潜在能力を限界まで引き出す。冷静な外見の奥に、選手への深い情熱を秘めている。'}
];
const COACH_HIRE_FEE = 80; // 後方互換フォールバック（各コーチ個別hireFeeで上書き）
const COACH_MAX_ASSIGN = 3; // v2.0: 1コーチあたり最大担当選手数（4→3）

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4C: GROWTH/DECLINE CONFIG (v0.6)                ║
// ╚══════════════════════════════════════════════════════════╝
const GROWTH_CONFIG = {
  baseLearning: 3.5,        // v2.0: 1回の練習の基本成長量（距離比率=1.0時）
  declineStartSeason: 4,  // decline begins after this many seasons
  declineRate: 0.6,       // stat points lost per decline check
  declineChance: 0.25,    // chance per stat per season-end
  // v0.8: Intensive training
  intensiveMult: 1.5,     // growth multiplier for intensive training
  intensiveCondDrain: 2.0, // condition drain multiplier
  intensiveInjuryChance: 0.05, // 5% chance of minor injury
  intensiveMaxConsec: 2,   // max consecutive intensive weeks
  intensiveMinCond: 50,    // min condition to allow intensive
  matchGrowthBase: 0.5    // 🔧 試合1回あたりの基本成長（旧: 0.7）
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4E: RIVAL ORGANIZATION CONFIG (v0.9)             ║
// ╚══════════════════════════════════════════════════════════╝
// RIVAL_ORGS: name is set at game start via initRivalOrgNames()
const RIVAL_ORG_NAME_POOL = {
  S: ['皇武館', '凰翔プロレス', 'グランエンプレス', '天頂プロレス'],
  A: ['ノヴァインパクト', 'ブレイクスルー', 'インパルス', 'イグニッション'],
  B: ['なでしこプロレス', 'あさひ女子プロレス', '春日野プロレス', 'ふたば女子プロレス']
};
const RIVAL_ORGS = [
  { id:'org_s', name:'', tier:'S',
    coachMul:1.30, scoutStyle:'immediate',
    desc:'業界の頂点に君臨する絶対王者', color:'#d63031', emoji:'👑' },
  { id:'org_a', name:'', tier:'A',
    coachMul:1.15, scoutStyle:'youth',
    desc:'若手主体の攻撃的な挑戦者', color:'#6c5ce7', emoji:'💫' },
  { id:'org_b', name:'', tier:'B',
    coachMul:1.00, scoutStyle:'conservative',
    desc:'堅実経営の小規模団体', color:'#00b894', emoji:'🌙' }
];

// ranking-roster-redesign v1.0 §4: 対戦ポイント設定（Phase 3 で使用）
const BATTLE_POINT_CFG = {
  war: 9,
  summit: 7,
  tournament: { champion: 20, runnerUp: 8, semiFinal: 0, firstRound: -14 },
  tournamentWeek: 24,
};

const RANKING_CONFIG = {
  weightsTop10: [2.4, 1.9, 1.55, 1.25, 1.05, 0.75, 0.55, 0.4, 0.28, 0.18],
  ovrMultiplier: 1.2,
  popMultiplier: 0.9,
  legacyCapByTier: { S: 50, A: 30, B: 15, player: 50 },
  hallOfFameLegacyPerInductee: 10,
};
// ── Scout Event Name Generation & Config (scout-spec §3) ──────
const SCOUT_SURNAMES = ['天羽','秋山','浅倉','安藤','飯田','池上','石原','泉','伊東','岩崎','上野','内田','梅原','江口','遠藤','大城','小川','荻野','加藤','川口','菊地','桐谷','久保','栗原','小泉','後藤','佐伯','坂井','桜庭','佐々木','篠原','柴崎','白石','杉浦','瀬戸','染谷','高松','竹内','立花','田中','津田','土屋','寺田','中島','長谷川','西村','野口','萩原','花山','浜崎','原田','平野','福田','星野','松岡','水野','宮崎','村上','望月','矢島','山口','湯浅','吉川','若林','鷲尾','渡辺'];
const SCOUT_GIVENNAMES = ['あかり','あかね','あゆみ','ありさ','いろは','うた','えみ','かすみ','かなで','きらり','くるみ','さくら','しおり','すみれ','せりな','そら','ちはる','つむぎ','なお','なつき','にいな','ねね','はるか','ひかり','ひなた','ふうか','まどか','まひろ','みお','みさき','みゆき','もえ','ゆいな','ゆうき','ゆかり','よしの','りこ','りさ','りの','るな','れいか','わかな'];
const SCOUT_TRAITS_POOL = ['努力家','早熟','晩成','遅咲き','適応力','破天荒','頑丈さ','不屈','鉄人','負けず嫌い','忠誠心','ファンサービス','番狂わせ体質','闘志','反骨心'];
const SCOUT_EVENT_CFG = {
  offseason: { count: [8, 10], maxPicks: 3, seedChance: 0.30 },  // §1.1 + §5.3
  midseason: { count: [4, 6],  maxPicks: 2, seedChance: 0.15 },  // §1.1 + §5.3
  midseasonWeek: 29,  // Q3 5th week (non-show week)
};
let nextGenCharId = 1001; // Auto-increment ID for generated scout characters

// Mutable org roster assignment — populated by initRandomRoster() at game start
// dormant = remaining IDs not in any org or free
let ORG_ASSIGN = {
  player:   [],  // Set after draft
  org_s:    [],  // Populated by initRandomRoster
  org_a:    [],  // Populated by initRandomRoster
  org_b:    [],  // Populated by initRandomRoster
  free:     [],  // Populated by initRandomRoster (FA pool)
};

// Style-based growth allocation (training-spec §3.1)
const STYLE_GROWTH = {
  Grappler:   {pw:1.0,sp:0.4,te:0.8,st:0.8},
  Striker:    {pw:0.8,sp:0.8,te:0.4,st:1.0},
  Submission: {pw:0.3,sp:0.4,te:1.0,st:0.8},
  Speed:      {pw:0.3,sp:1.0,te:0.7,st:0.5},
  Allround:   {pw:0.7,sp:0.7,te:0.7,st:0.7},
  Brawler:    {pw:1.0,sp:0.5,te:0.2,st:1.0}
};

// Transfer system config (v1.0 §7 modified: quarterly windows)
// Transfer config: see TRANSFER_CONFIG in Section 4H for active constants

// org-rating star power thresholds (org-ranking-spec §1.3)
const STAR_POWER = [
  {minPop:50, points:15, label:'トップスター'},
  {minPop:35, points:8,  label:'スター'},
  {minPop:20, points:3,  label:'中堅'}
];

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4G: PHASE B — SEASON CYCLE CONSTANTS (v0.9)      ║
// ╚══════════════════════════════════════════════════════════╝

// Age multiplier table (training-spec §5.2)
function ageMultiplier(age, traits) {
  let mul;
  if (age <= 17)      mul = 0.70;  // 新人: 体がまだできていない
  else if (age <= 18) mul = 1.00;  // 成長開始
  else if (age <= 20) mul = 1.15;  // 黄金の成長期
  else if (age <= 22) mul = 1.00;  // 安定成長
  else if (age <= 24) mul = 0.50;  // 仕上げ段階
  else if (age <= 26) mul = 0.10;  // ほぼ停止
  else                mul = 0;     // 成長なし

  if (!Array.isArray(traits)) return mul;

  // 早熟: ≤18で+30%、≥23で-30%
  if (traits.includes('早熟')) {
    if (age <= 18) mul *= 1.3;
    else if (age >= 23) mul *= 0.7;
  }
  // 晩成: ≤18で-20%、21-27で+40%
  if (traits.includes('晩成')) {
    if (age <= 18) mul *= 0.8;
    else if (age >= 21 && age <= 27) mul *= 1.4;
  }
  // 遅咲き: ≤20で-20%、21-29で爆発的成長
  if (traits.includes('遅咲き')) {
    if (age <= 20) mul *= 0.8;
    else if (age <= 29) mul = Math.max(mul, 0.9);
  }
  return mul;
}

// [DEPRECATED] 旧年齢ベースdecay — applyDecayはwearベースに移行済み
// const DECAY_TABLE = { ... };

// Retirement config (scout-spec §7)
const RETIRE_CFG = {
  chances: { 35:0.30, 36:0.50, 37:0.75, 38:0.90 }, // 39+ = 確定
  voluntaryThreshold: 0.60,  // OVR < Notion * 0.60
  voluntarySeasons: 2,       // 2シーズン連続で自主引退
  decayFloor: 0.70,          // 衰退下限 = Notion × 0.70
};

// Wear system: wear threshold effects (v1.3-1-decay-retirement-spec §3)
const WEAR_TABLE = [
  // wear 0-19: 全盛期 — no effect
  { min:  0, max: 19, label: null,        decayMin: 0, decayMax: 0, retireChance: 0    },
  // wear 20-39: 軽度衰退
  { min: 20, max: 39, label: '⚠ 衰え',  decayMin: 1, decayMax: 2, retireChance: 0    },
  // wear 40-59: 本格衰退
  { min: 40, max: 59, label: '⬇ 衰退期', decayMin: 2, decayMax: 4, retireChance: 0.20 },
  // wear 60-79: 末期
  { min: 60, max: 79, label: '⬇⬇ 限界', decayMin: 3, decayMax: 5, retireChance: 0.50 },
  // wear 80+: 確定引退
  { min: 80, max: Infinity, label: null,  decayMin: 0, decayMax: 0, retireChance: 1.0  },
];

// AI scout config (rival-spec §5)
const AI_SCOUT_CFG = {
  S: { budget:800, maxPicks:3, idealRoster:16, rates:{prodigy:0.90, promising:0.80, rough:0.30} },
  A: { budget:500, maxPicks:3, idealRoster:13, rates:{prodigy:0.70, promising:0.60, rough:0.50} },
  B: { budget:200, maxPicks:2, idealRoster:10, rates:{prodigy:0.30, promising:0.50, rough:0.60} } // roster-cap v1.0: 9→10
};

// F1: AI tier differentiation — roster quality caps & growth bonus
// growth-rebalance v2: tierGrowth引き上げ（AI団体も興行で選手が育つ想定）
const AI_TIER_LIMITS = {
  S: { maxProdigies: 99, maxPromising: 99, growthBonus: 1.12, faAggressiveness: 0.60 },
  A: { maxProdigies: 3,  maxPromising: 99, growthBonus: 1.05, faAggressiveness: 0.40 },
  B: { maxProdigies: 1,  maxPromising: 99, growthBonus: 1.00, faAggressiveness: 0.20 }
};

// AI統一成長 Phase4: AI団体のコーチ環境設定（ティア別）
const AI_COACH_CONFIG = {
  S: {
    ace: {
      count: 3,                    // OVR上位3名がエース
      top1: {
        coachMul: 1.25,            // 🔧 Aランク相当
        intensiveRate: 0.30,       // 🔧 強化練習確率 30%
        practiceRate: 0.85,        // 🔧 練習週になる確率 85%（残りはrest）
      },
      top2_3: {
        coachMul: 1.18,            // 🔧 Bランク相当
        intensiveRate: 0.20,       // 🔧 20%
        practiceRate: 0.85,        // 🔧 85%
      },
    },
    general: {
      coachMul: 1.18,              // 🔧 Bランク相当（S級の資金力で一般枠にも良いコーチ）
      intensiveRate: 0.12,         // 🔧 12%（組織的な強化練習体制）
      practiceRate: 0.80,          // 🔧 80%（高いプロ意識による練習文化）
    },
  },
  A: {
    ace: {
      count: 1,                    // OVR上位1名がエース
      top1: {
        coachMul: 1.18,            // 🔧 Bランク相当
        intensiveRate: 0.20,       // 🔧 20%
        practiceRate: 0.75,        // 🔧 75%
      },
    },
    general: {
      coachMul: 1.12,              // 🔧 Cランク相当
      intensiveRate: 0.0,          // 強化練習なし
      practiceRate: 0.60,          // 🔧 60%
    },
  },
  B: {
    ace: {
      count: 1,                    // OVR上位1名がエース
      top1: {
        coachMul: 1.12,            // 🔧 Cランク相当
        intensiveRate: 0.0,        // 強化練習なし
        practiceRate: 0.55,        // 🔧 55%
      },
    },
    general: {
      coachMul: 1.08,              // 🔧 Dランク相当
      intensiveRate: 0.0,          // 強化練習なし
      practiceRate: 0.45,          // 🔧 45%
    },
  },
};

// AI season config (人気変動用。成長はprocessAIWeekベースに移行済み)
const AI_SEASON_CFG = {
  popConvergeRate: 0.3,        // 人気ターゲットへの収束率
  popRandomRange: 5,           // 人気ランダム幅 ±5
  tierPopBonus: { S:8, A:4, B:2 }
};

// ── Phase C: Transfer & Ace Constants ──
const TRANSFER_CONFIG = {
  windows: [12, 24, 36, 48],           // AI移籍処理ウィンドウ（四半期末）
  poachChancePerFighter: 0.06,          // 1選手あたり6%/四半期
  poachMinPopularity: 50,               // 人気50以上が対象
  poachRequiresHigherRank: true,        // 引き抜き元がプレイヤーより上位
  championRetentionRate: 1.0,            // チャンピオン: 100%防衛
  nonChampionRetentionRate: 0.80,       // 非チャンピオン: 80%防衛
  retentionCostMultiplier: 0.5,         // 引き留め費用 = 移籍金 × 0.5
};

// ── Phase D: Rental & Event Constants ──
const RENTAL_CONFIG = {
  minSeasons: 1,                        // 最短1期(12週)
  maxSeasons: 4,                        // 最長4期(48週)
  topExclude: 3,                        // 団体内OVR上位3名は対象外
  faTierMul: 0.85,                      // FA選手の費用倍率（団体所属より安め）
  tierMul: { S: 1.4, A: 1.15, B: 1.0 }, // 団体ティア別費用倍率
  /** 同時レンタル枠: ロスター8名以上で3枠、未満で2枠 */
  getMaxConcurrent(rosterSize) { return rosterSize >= 8 ? 3 : 2; },
};

const EVENT_CONFIG = {
  // D-2: 対抗戦
  warChancePerSeason: 0.50,             // 年1回50%
  warMatchCount: { min: 3, max: 5 },
  warPopReward: 5,                      // 勝利時団体人気
  warPopPenalty: -3,                    // 敗北時
  // D-3: 挑戦状
  challengeMQBonus: 10,                 // MQ+10
  // D-4: 頂上決戦
  summitMinRank: 2,                     // ランキング2位以上で発生
  summitPopReward: 10,
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4I: NEGOTIATION CONFIG (F2: 引き抜き交渉)         ║
// ╚══════════════════════════════════════════════════════════╝
const NEGOTIATION_CONFIG = {
  durationWeeks: 4,
  maxConcurrent: 1,
  failureCostRatio: 0.5,
  cooldownSameTarget: true,
  baseFeeMultipliers: [1.5, 2.0, 3.0],
  planBonusRates: [0, 10, 20],
  baseSuccessRates: { S: 15, A: 30, B: 50 },
  clampMin: 3,
  clampMax: 65
};

const NEGOTIATE_LINES = {
  start: {
    normal: {
      _default: ['…そう、私に来いと。\n条件次第かな'],
      ojousama: ['わたくしをお誘いですの？\n…条件次第ですわね'],
      delinquent: ['あたしを引き抜くってか？\n…条件次第だな'],
      seductive: ['私を誘うの？\nふふ…条件次第ね'],
    },
    bold: {
      _default: ['ふーん…私を引き抜こうってわけ？\n面白い度胸してるじゃない', '…私を欲しいって？\nそれなりの覚悟、あるんでしょうね'],
      ojousama: ['わたくしを引き抜こうと？\n面白いご度胸ですわね'],
      delinquent: ['あたしを引き抜く？\n面白ぇ度胸してんじゃねーか'],
      cool: ['…引き抜き？ 条件を聞こう'],
      seductive: ['私を引き抜こうだなんて…\nふふ、面白い度胸してるわね'],
    },
    quiet: {
      _default: ['………話は聞く'],
      cool: ['…聞こう'],
      polite: ['…お話は伺います'],
    },
    shy: { _default: ['え…私なんかでいいんですか…？\n…ちょっと考えさせてください'] },
    easygoing: {
      _default: ['えっ、スカウト！？\nわくわくするね〜、話聞かせてよ！'],
      delinquent: ['マジで！？ スカウト！？\n話聞かせてくれよ！'],
      seductive: ['あら、スカウト？\nふふ、聞かせてもらおうかしら'],
    },
    earnest: {
      _default: ['この団体を離れるのは簡単じゃない。\n…でも、聞くだけなら'],
      polite: ['この団体を離れるのは簡単ではありません。\n…でも、お聞きするだけなら'],
      ojousama: ['この団体を離れるのは容易ではありませんわ。\n…でも、お聞きするだけなら'],
      seductive: ['この団体を離れるのは簡単じゃないの。\n…でも、聞くだけなら'],
    },
    emotional: { _default: ['え…引き抜き…？\nど、どうしよう…急に言われても…'] },
  },
  success: {
    normal: {
      _default: ['…分かった、行くわ。\n実力で居場所を作ってみせる'],
      ojousama: ['…承知しましたわ。\n実力で居場所を作ってみせますの'],
      delinquent: ['…わかった、行くぜ。\n実力で居場所作ってやるよ'],
      seductive: ['…わかったわ、行く。\n実力で居場所を作ってみせるわ'],
    },
    bold: {
      _default: ['いいわ…認めてあげる。\n新しい場所で格の違いを見せてやる', '新しい闘いが待っている…！\n燃えてきた…全力でいくぞ！'],
      ojousama: ['認めてさしあげますわ。\n格の違いをお見せしますの'],
      delinquent: ['認めてやるぜ。\n新しい場所で格の違い見せてやらぁ！'],
      cool: ['…行く。全力でやる'],
      seductive: ['認めてあげるわ。\n格の違いを見せてあげる'],
    },
    quiet: {
      _default: ['……行く。よろしく'],
      cool: ['…行く'],
      polite: ['…行きます。よろしくお願いします'],
    },
    shy: { _default: ['期待に応えられるよう、頑張ります…！\n…必ず、成長してみせます'] },
    easygoing: {
      _default: ['やったー！ 新しい団体！\n楽しみすぎて眠れないかも！'],
      delinquent: ['やったぜ！ 新しい団体！\n楽しみすぎて眠れねーよ！'],
      seductive: ['やった！ 新しい団体ね！\n楽しみだわ'],
    },
    earnest: {
      _default: ['新しい仲間のために…全力を尽くす。\nよろしくお願いします'],
      polite: ['新しい仲間のために…全力を尽くします。\nよろしくお願いいたします'],
      ojousama: ['新しい仲間のために…全力を尽くしますわ。\nよろしくお願いいたします'],
      seductive: ['新しい仲間のために…全力を尽くすわ。\nよろしくね'],
    },
    emotional: { _default: ['うっ…新しい場所で…頑張ります…！\nよろしくお願いします…！'] },
  },
  blocked: {
    normal: {
      _default: ['あなたの団体に移る気はないわ。\n今の仲間のことを考えたら、話を聞く気にもなれない', '…そういう話は受けられない。\n今のここが好きだから'],
      ojousama: ['大変恐縮ですが、そのようなお話は伺えませんわ。\n今の団体への思いは揺らぎませんの'],
      delinquent: ['悪いな、話を聞く気にならねぇ。\n今の仲間を裏切るわけにはいかねぇから'],
      seductive: ['うれしいお誘いだけど…今の仲間を置いていく気にはなれないわ。\nごめんなさい'],
    },
    bold: {
      _default: ['私が今のチームを裏切ると思った？\n見くびらないで', '今の居場所を捨てる気は一切ない。\n帰って'],
      ojousama: ['わたくしへのご評価は光栄ですが、\n今の団体を裏切るなどあり得ませんわ'],
      delinquent: ['あたしが今の仲間に背くと思ったか？\n甘ぇよ、帰れ'],
      cool: ['…無意味だ。今ここを離れる気はない'],
      seductive: ['ふふ…買いかぶってくれてありがとう。\nでも今の仲間を裏切るつもりは毛頭ないわ'],
    },
    quiet: {
      _default: ['…今は動けない。ここにいる'],
      cool: ['…話にならない。断る'],
      polite: ['…すみません。今は、ここを離れる気になれないんです'],
    },
    shy: {
      _default: ['え…でも、今の仲間を置いていくなんて…\nごめんなさい、どうしても首を縦に振れないです'],
    },
    easygoing: {
      _default: ['えっ、スカウト！嬉しいけど〜、今の子たちが好きすぎて！\nムリムリ〜！', 'ありがとう！でも今のとこが居心地よすぎて、\n話を聞く気にならないんだよね〜！'],
      delinquent: ['おっ、引き抜きか！気持ちは嬉しいけどな、\n今の仲間が好きすぎて動けないわ！'],
      seductive: ['うれしいけど〜、今の子たちが大好きすぎて動けないのよね。\nごめんね'],
    },
    earnest: {
      _default: ['今の仲間とまだやり遂げることがある。\nそれが終わるまで、他の話は聞けない', '今のチームへの責任がある。\nそれを途中で投げ出すわけにはいかないの'],
      polite: ['今の仲間への責任があります。\nその気持ちがある限り、ここを離れる選択はできません'],
      ojousama: ['今の仲間への責任がありますわ。\nそれを果たすまで、他のお話は聞けませんの'],
      seductive: ['今の仲間を途中で捨てるなんて、私には考えられない。\n…ごめんなさい'],
    },
    emotional: {
      _default: ['今の団体が好きすぎて…そんな話を聞いたら、\n自分が嫌いになりそうで…！ごめんなさい', 'ここのみんなが大好きで…！\n裏切るなんて考えるだけで苦しい…！ごめんなさい…！'],
    },
  },
  fail: {
    normal: {
      _default: ['…悪いけど、今回はパス。\n縁があればまたね'],
      ojousama: ['申し訳ありませんが、今回はご遠慮しますわ'],
      delinquent: ['悪ぃけど、今回はパスだ。\n縁があればまたな'],
      seductive: ['ごめんなさい、今回はパス。\n縁があればまたね'],
    },
    bold: {
      _default: ['…悪いけど、ここが私の居場所よ。\n出直してきなさい', 'まだこの団体で燃え尽きてない。\n…その話はなかったことに'],
      ojousama: ['ここがわたくしの居場所ですわ。\n出直していらして'],
      delinquent: ['ここがあたしの居場所だ。\n出直してきな'],
      cool: ['…断る。ここが居場所だ'],
      seductive: ['ここが私の居場所なの。\n出直してきて'],
    },
    quiet: {
      _default: ['………ここにいる'],
      cool: ['…断る'],
      polite: ['…すみません、ここに残ります'],
    },
    shy: { _default: ['まだここで学ぶことがあるんです…。\n…すみません'] },
    easygoing: {
      _default: ['ごめんね〜、やっぱり今のとこが好きなの！\nまたね〜！'],
      delinquent: ['ごめんな〜、今のとこが好きなんだよ！\nまたな！'],
      seductive: ['ごめんなさいね、今のところが好きなの。\nまたね'],
    },
    earnest: {
      _default: ['みんなを置いて行くわけにはいかない。\n…ごめんなさい'],
      polite: ['皆さんを置いて行くわけにはいきません。\n…申し訳ありません'],
      ojousama: ['皆さまを置いて行くわけにはまいりませんわ'],
      seductive: ['みんなを置いて行くわけにはいかないの。\n…ごめんなさい'],
    },
    emotional: { _default: ['ごめんなさい…今はここを離れられないの…！\nまたいつか…！'] },
  }
};

// ── 契約更新交渉セリフ (contract-negotiation-event-spec v1.0) ─────────────
// 5性格(bold/introverted/carefree/earnest/emotional) × 態度 × 分岐
// テンプレ変数: {tenure} {record} {rivalry} {tenure_farewell} {wins} {losses} {n} {rivalName}
const CONTRACT_NEGOTIATION_LINES = {
  // ── 昇給要求: 導入 ─────────────────────────────────────────────────────
  raise_open: {
    normal: {
      _default: ['社長、少し相談があるんですけど。{tenure}{record}もう少し待遇を見直してもらえませんか。', '社長、契約のことなんですけど。{record}正直、もうちょっと欲しいなって思ってて。'],
      ojousama: ['社長、お時間よろしいかしら。{tenure}待遇について、ご相談させてくださいまし。{record}'],
      delinquent: ['社長、ちょっといいか。{tenure}{record}給料の話なんだけどさ。もうちょい出してくんねーの？'],
      seductive: ['社長、ちょっといい？ {tenure}{record}…もう少しだけ、考えてくれない？'],
    },
    bold: {
      _default: ['社長、はっきり言わせてもらいます。{tenure}この給料はナメてます。{record}正当な評価をしてほしい。それだけです。', '社長、話があります。{record}{tenure}これだけやって、この待遇は通らないでしょう。'],
      ojousama: ['社長。{tenure}申し上げにくいのですが、この待遇はわたくしに見合いませんわ。{record}'],
      delinquent: ['おい社長。{tenure}この給料はふざけてんのか。{record}ちゃんと評価しろよ。'],
      cool: ['…社長。{tenure}{record}この額じゃ、やってられない'],
      seductive: ['ねえ社長。{tenure}もうちょっと私のこと大事にしてくれてもいいんじゃない？ {record}'],
    },
    quiet: {
      _default: ['あの……社長、少しお時間いただけますか……。{tenure}その……お給料のことなんですけど……。', '……社長、言いにくいんですけど……。{record}もう少しだけ……お願いできないかなって……。'],
      cool: ['…社長。{tenure}…給料の話。{record}…考えてほしい'],
      polite: ['あの…社長、すみません…。{tenure}お給料のことで…少しだけ、ご相談したくて……。'],
    },
    shy: {
      _default: ['あ、あの…社長…。{tenure}その…言いにくいんですけど…お給料のこと…少しだけ……。', '…す、すみません社長…。{record}もう少しだけ…お願いできたらなって……。'],
    },
    easygoing: {
      _default: ['やっほー社長！ いやー毎年この時期って緊張するよね。{tenure}ぶっちゃけ、もうちょい欲しいなーって。ダメ？', '社長ー、お金の話していい？ {record}ちょっとだけ上がんないかなーって思ってたんだよね〜。'],
      delinquent: ['よー社長。{tenure}給料の話なんだけどさー。もうちょいくれよー。{record}'],
      seductive: ['社長ー♪ {tenure}お給料のことなんだけどさ…もうちょっとだけ♡ ダメ？'],
    },
    earnest: {
      _default: ['社長、お時間ありがとうございます。{tenure}契約のことで、筋を通してお話させてください。{record}', '社長。正直にお伝えします。{record}この待遇では、自分の努力に見合わないと感じています。'],
      polite: ['社長、お忙しいところ恐れ入ります。{tenure}契約について、ご相談させていただきたく…。{record}'],
      ojousama: ['社長。{tenure}契約のことで筋を通させていただきたく存じますわ。{record}'],
      seductive: ['社長、大事な話があるの。{tenure}{record}ちゃんと評価してほしいな'],
    },
    emotional: {
      _default: ['社長……！ 聞いてください……！ {tenure}{record}私、もっとできるのに……このままじゃ悔しい……！', '……なんで……なんで評価してくれないんですか……！ {record}頑張ってるのに……！'],
    },
  },
  // ── 移籍志願: 導入 ─────────────────────────────────────────────────────
  transfer_open: {
    normal: {
      _default: ['社長、話があります。{tenure}ここを離れようと思ってるんです。', '社長。{tenure}色々考えたんですけど…他の環境でやってみたくて。'],
      ojousama: ['社長。{tenure}お伝えしづらいのですが…退団を考えておりますの。'],
      delinquent: ['社長。{tenure}悪いけど、もうここ出るわ。'],
      seductive: ['社長…ごめんなさい。{tenure}ここを離れたいの。'],
    },
    bold: {
      _default: ['社長。{tenure}もう決めました。この団体を出ます。', '……はっきり言います。{tenure}ここではもう成長できない。出ます。'],
      ojousama: ['社長。{tenure}決心がつきましたの。わたくし、この団体を去りますわ。'],
      delinquent: ['社長。{tenure}もう決めた。ここ出るぜ。'],
      cool: ['…{tenure}出る。もう決めた'],
      seductive: ['社長。{tenure}もう決めたの。…ここを出るわ。'],
    },
    quiet: {
      _default: ['あの……社長……。{tenure}言いにくいんですけど……もう、ここを離れたいです……。', '……ごめんなさい……。{tenure}私なんかいなくても……変わらないと思うんです……。'],
      cool: ['…{tenure}…出たい。…それだけ'],
      polite: ['あの…社長…。{tenure}言いにくいのですが……退団したいと思っています……。'],
    },
    shy: {
      _default: ['あの…社長……。{tenure}す、すみません…ここを…離れたいんです……。', '…ごめんなさい……。{tenure}私には…ここにいる資格がないような気がして……。'],
    },
    easygoing: {
      _default: ['社長、あのね。{tenure}色々考えたんだけどさ、環境変えてみようかなーって。', 'いやー社長。言いにくいんだけどさー。{tenure}ちょっと外の空気吸ってみたいなーって。'],
      delinquent: ['社長。{tenure}悪いけどさー、ちょっと外に出てみたいんだよね。'],
      seductive: ['社長、あのね…。{tenure}ちょっと新しいことしてみたいなって。…ごめんね。'],
    },
    earnest: {
      _default: ['社長、大切なお話があります。{tenure}悩みに悩みましたが……退団を願い出たいのです。', '社長。{tenure}ここで学んだことは一生の財産です。ですが……先に進むべき時が来たと思っています。'],
      polite: ['社長。{tenure}大変申し訳ないのですが…退団のご相談をさせてください。'],
      ojousama: ['社長。{tenure}心苦しいのですが…退団を願い出たく存じますわ。'],
      seductive: ['社長。{tenure}ここで過ごした時間は大切よ。でも…次の場所を見つけたいの。'],
    },
    emotional: {
      _default: ['社長……もう無理です……！ {tenure}ここにいても……どんどんダメになっていく気がして……！', '……{tenure}もう、限界なんです……。{record}自分でもわかってます……このままじゃいけないって……。'],
    },
  },
  // ── 昇給受諾時 ─────────────────────────────────────────────────────────
  raise_accept: {
    normal: {
      _default: ['ありがとうございます。これからもよろしくお願いしますね。'],
      ojousama: ['ありがとうございますわ。より一層、精進いたしますわね。'],
      delinquent: ['サンキュ、社長。ちゃんと働くからよ。'],
      seductive: ['ありがと、社長♡ もっと頑張っちゃうからね。'],
    },
    bold: {
      _default: ['……ありがとうございます。分かってくれる社長で良かった。今期も全力でいきますよ。'],
      ojousama: ['……感謝いたしますわ。この評価に見合う結果をお見せしますわね。'],
      delinquent: ['……ま、当然だけどな。ちゃんと評価してくれんじゃん。'],
      cool: ['…ありがとう。結果で返す'],
      seductive: ['ふふ、分かってくれるじゃない♡ 期待しててね。'],
    },
    quiet: {
      _default: ['え……本当ですか……？ あ、ありがとうございます……！ 頑張ります……！'],
      cool: ['…ありがとう。…頑張る'],
      polite: ['え…本当ですか…？ ありがとうございます…！ 精一杯頑張ります…！'],
    },
    shy: {
      _default: ['え…い、いいんですか…？ あ、ありがとうございます…！ 頑張ります…！'],
    },
    easygoing: {
      _default: ['やったー！ さすが社長！ 今年も楽しくやろうね〜！'],
      delinquent: ['おっしゃー！ さすが社長！ やる気出てきたぜ！'],
      seductive: ['やったー♡ さすが社長、太っ腹～♪'],
    },
    earnest: {
      _default: ['感謝します。期待に応えられるよう、全力を尽くします。'],
      polite: ['ありがとうございます。ご期待に沿えるよう、精一杯努めます。'],
      ojousama: ['感謝いたしますわ。期待に応えてみせますわね。'],
      seductive: ['ありがとう。…期待に応えるからね。見ててね。'],
    },
    emotional: {
      _default: ['社長……！ ありがとうございます……！ 絶対に結果で返します……！'],
    },
  },
  // ── 交渉成功時（中間案受諾） ───────────────────────────────────────────
  raise_negotiate_accept: {
    normal: {
      _default: ['まあ、上がるならありがたいです。頑張りますね。'],
      ojousama: ['……そのお気持ちだけでも、嬉しゅうございますわ。'],
      delinquent: ['まー上がるだけマシか。サンキュ。'],
      seductive: ['少しでも考えてくれたのね。…ありがと♡'],
    },
    bold: {
      _default: ['……まあ、ゼロじゃないなら受けてやります。次は正当な評価を期待してますよ。'],
      ojousama: ['……まあ、ゼロではないのですわね。次はきちんとした評価を期待しますわ。'],
      delinquent: ['……ま、ゼロよりマシか。次はもっと出せよな。'],
      cool: ['…ゼロじゃないなら、まあいい。次は期待してる'],
      seductive: ['……まあ、少しは考えてくれたのね。次はもっと期待してるわよ♡'],
    },
    quiet: {
      _default: ['それだけでも……ありがたいです。ありがとうございます……。'],
      cool: ['…分かった。ありがとう'],
      polite: ['少しでも上げていただけるなんて…ありがとうございます……。'],
    },
    shy: {
      _default: ['そ、それだけでも…ありがたいです…。ありがとうございます……。'],
    },
    easygoing: {
      _default: ['んー、まあいっか！ もらえるだけラッキーってことで！'],
      delinquent: ['まーいいか！ もらえるだけ儲けもんだぜ！'],
      seductive: ['んー、まあいっか♪ 気持ちは伝わったし♡'],
    },
    earnest: {
      _default: ['……分かりました。社長の判断を尊重します。この額で、精一杯やります。'],
      polite: ['……ありがとうございます。この額で精一杯、お応えいたします。'],
      ojousama: ['……社長のご判断を尊重いたしますわ。精一杯やりますわね。'],
    },
    emotional: {
      _default: ['……本当は足りないけど……社長が考えてくれたってことは、伝わりました。'],
    },
  },
  // ── 交渉失敗時（中間案拒否） ───────────────────────────────────────────
  raise_negotiate_refuse: {
    normal: {
      _default: ['……そうですか。分かりました。'],
      ojousama: ['……左様でございますか。承知いたしましたわ。'],
      delinquent: ['……チッ。まあ分かったよ。'],
      seductive: ['……そう。残念ね。'],
    },
    bold: {
      _default: ['……そうですか。まあいいでしょう。でもね社長、次はないと思ってください。'],
      ojousama: ['……左様ですか。ですが社長、次はございませんわよ。'],
      delinquent: ['……は？ マジかよ。……まあいい。でも次はねーぞ。'],
      cool: ['…そう。…覚えておく'],
      seductive: ['……ふうん。まあいいわ。でもね、次はないからね？'],
    },
    quiet: {
      _default: ['……そう、ですか……。分かりました……。'],
      cool: ['…そう。…分かった'],
      polite: ['……そうですか……。分かりました……。すみません……。'],
    },
    shy: {
      _default: ['……そう…ですか……。す、すみません、変なこと言って……。'],
    },
    easygoing: {
      _default: ['あちゃー、ダメかー。まあしょうがないよねー。……でもちょっとへこむなー。'],
      delinquent: ['あちゃー、マジかー。まーしゃーねーか。'],
      seductive: ['えー、ダメ？ …まあしょうがないかぁ。ちょっと寂しいけど。'],
    },
    earnest: {
      _default: ['……残念ですが、了解しました。ただ、この判断の結果は覚えていてください。'],
      polite: ['……残念ですが、承知いたしました。ですが、この判断はお忘れなきよう。'],
      ojousama: ['……残念ですわ。ですが、この判断の結果はお忘れなきよう。'],
    },
    emotional: {
      _default: ['……やっぱり……ダメなんだ……。……わかりました。'],
    },
  },
  // ── 昇給拒否時 ─────────────────────────────────────────────────────────
  raise_refuse: {
    normal: {
      _default: ['……そうですか。分かりました。……ちょっと残念ですけど。'],
      ojousama: ['……そうですの。承知いたしましたわ……。'],
      delinquent: ['……マジかよ。……まあいいけどさ。'],
      seductive: ['……そう。残念だけど…仕方ないわね。'],
    },
    bold: {
      _default: ['…………。そうですか。分かりました。でもね社長、我慢の限界ってものがあるんで。そのつもりでいてください。'],
      ojousama: ['…………。そうですか。わたくしにも限度というものがございますわ。'],
      delinquent: ['……は？ ……ふーん。まあいいけどよ、限界ってもんがあるからな。'],
      cool: ['…そう。…我慢にも、限界はある'],
      seductive: ['……ふうん。まあいいけど、我慢にも限度があるからね？'],
    },
    quiet: {
      _default: ['……はい……分かりました……。……すみません、変なこと言って……。'],
      cool: ['…そう。……分かった'],
      polite: ['……はい…分かりました……。すみません、ご無理を言って……。'],
    },
    shy: {
      _default: ['……は、はい…分かりました……。す、すみませんでした……。'],
    },
    easygoing: {
      _default: ['あはは、やっぱりー？ まーしょうがないっか。でもいつか上げてね？ 約束だよー？'],
      delinquent: ['あー、やっぱダメか。まーいいけどさ、いつか上げろよな？'],
      seductive: ['えー、やっぱりダメ？ …いつか上げてね？ 約束よ♡'],
    },
    earnest: {
      _default: ['……承知しました。ですが、このまま変わらなければ、いずれ考えを改めざるを得ません。'],
      polite: ['……承知いたしました。ですが、このままでは…いずれ考えざるを得ません。'],
      ojousama: ['……承知いたしましたわ。ですが、このまま変わらなければ…。'],
    },
    emotional: {
      _default: ['……っ！ ……もういいです。分かりました。……悔しい……。'],
    },
  },
  // ── 引き留め成功 ───────────────────────────────────────────────────────
  transfer_retain_success: {
    normal: {
      _default: ['……そこまでしてくれるんですね。…分かりました。もう少し頑張ってみます。'],
      ojousama: ['……そこまでおっしゃるなら。もう少しお付き合いいたしますわ。'],
      delinquent: ['……マジかよ。そこまで言うなら、もうちょいいてやるか。'],
      seductive: ['……そこまでしてくれるの？ …もう少しだけ、いてあげる♡'],
    },
    bold: {
      _default: ['……チッ。仕方ない。そこまで言うなら、もう少しだけ付き合ってやります。'],
      ojousama: ['……仕方ありませんわね。そこまでの誠意、もう少し見届けますわ。'],
      delinquent: ['……チッ。そこまで言うなら、もうちょい付き合ってやるよ。'],
      cool: ['…そこまで言うなら、もう少しだけ'],
      seductive: ['……仕方ないわね。そこまで言うなら、もう少しだけ付き合ってあげる。'],
    },
    quiet: {
      _default: ['えっ……そこまでしてくれるんですか……？ ……もう少しだけ、頑張ってみます……。'],
      cool: ['…そこまで言うなら。…もう少しだけ'],
      polite: ['えっ…そこまでしてくださるんですか…？ ……もう少しだけ、頑張ってみます……。'],
    },
    shy: {
      _default: ['え…そ、そこまでしてくれるんですか…？ ……あの…もう少しだけ…頑張ります……。'],
    },
    easygoing: {
      _default: ['え、マジ？ そこまでしてくれんの？ ……じゃあもうちょっといよっかな！'],
      delinquent: ['マジかよ。そこまでしてくれんの？ じゃーもうちょいいるか！'],
      seductive: ['え、そこまでしてくれるの？ …じゃあもうちょっといよっかな♪'],
    },
    earnest: {
      _default: ['……社長の誠意、受け止めました。もう一度、この団体で全力を尽くします。'],
      polite: ['……社長のお気持ち、しかと受け止めました。もう一度、全力を尽くさせてください。'],
      ojousama: ['……その誠意、しかと受け止めましたわ。もう一度、全力で臨みますわ。'],
    },
    emotional: {
      _default: ['社長……！ ……ごめんなさい、こんな私のために……。……絶対、恩返しします……！'],
    },
  },
  // ── 引き留め失敗 ───────────────────────────────────────────────────────
  transfer_retain_fail: {
    normal: {
      _default: ['……ありがたいんですけど…もう、決めたんです。すみません。'],
      ojousama: ['お気持ちは嬉しゅうございますが…もう、決めましたの。'],
      delinquent: ['……悪いけど、もう決めたんだよ。気持ちは変わらねー。'],
      seductive: ['……ありがとう。でも…もう決めたの。ごめんね。'],
    },
    bold: {
      _default: ['……悪いけど、もう決めたんです。気持ちは変わりません。'],
      ojousama: ['……申し訳ございませんが、決心は揺るぎませんわ。'],
      delinquent: ['……悪いけど、もう決めた。何言われても変わらねー。'],
      cool: ['…決めた。変わらない'],
      seductive: ['……悪いけど、もう決めたの。…引き止めても無駄よ。'],
    },
    quiet: {
      _default: ['……ごめんなさい……。ありがたいんですけど……もう、決めたんです……。'],
      cool: ['…ごめん。…もう決めた'],
      polite: ['……ありがたいのですが……もう、決めました……。すみません……。'],
    },
    shy: {
      _default: ['…ご、ごめんなさい……。でも…もう、決めたんです……。'],
    },
    easygoing: {
      _default: ['ごめんね社長……。お金の問題じゃないんだよね。心が決まっちゃったから。'],
      delinquent: ['悪いな社長。金の問題じゃねーんだよ。もう決めちまったから。'],
      seductive: ['ごめんね社長…。お金じゃないの。気持ちが決まっちゃったから…。'],
    },
    earnest: {
      _default: ['お気持ちはありがたいのですが……この決断は、ずっと考え抜いた末のものです。申し訳ありません。'],
      polite: ['お心遣い、ありがとうございます。ですが…この決断は変わりません。申し訳ございません。'],
      ojousama: ['お気持ちは嬉しゅうございますわ。ですが…この決断は揺るぎません。申し訳ございません。'],
    },
    emotional: {
      _default: ['社長……ありがとう……。でも……もう戻れないんです……ごめんなさい……！'],
    },
  },
  // ── 送り出し ───────────────────────────────────────────────────────────
  transfer_release: {
    normal: {
      _default: ['……分かりました。{tenure_farewell}{rivalry}お世話になりました。'],
      ojousama: ['……承知いたしましたわ。{tenure_farewell}{rivalry}ごきげんよう。'],
      delinquent: ['……おう。{tenure_farewell}{rivalry}じゃーな。'],
      seductive: ['……そう。{tenure_farewell}{rivalry}元気でね。'],
    },
    bold: {
      _default: ['……ふん。まあ、そうなるだろうと思ってた。{rivalry}じゃあね、社長。'],
      ojousama: ['……ふふ。予想通りですわ。{rivalry}ごきげんよう、社長。'],
      delinquent: ['……だろうな。分かってたぜ。{rivalry}じゃーな、社長。'],
      cool: ['…そう。{rivalry}…じゃあ'],
      seductive: ['……ふふ、予想通りね。{rivalry}じゃあね、社長。'],
    },
    quiet: {
      _default: ['……ありがとうございました。{tenure_farewell}{rivalry}……お世話になりました。'],
      cool: ['…{tenure_farewell}{rivalry}…ありがとう'],
      polite: ['……ありがとうございました。{tenure_farewell}{rivalry}…お世話になりました……。'],
    },
    shy: {
      _default: ['…あ、ありがとうございました…。{tenure_farewell}{rivalry}…お世話になりました……。'],
    },
    easygoing: {
      _default: ['あはは、まあそうなるよねー。{tenure_farewell}{rivalry}元気でねー！'],
      delinquent: ['まーそうなるよなー。{tenure_farewell}{rivalry}元気でな！'],
      seductive: ['あはは、そうなるよね。{tenure_farewell}{rivalry}元気でね～♪'],
    },
    earnest: {
      _default: ['……承知しました。{tenure_farewell}この団体で過ごした日々に、感謝します。{rivalry}'],
      polite: ['……承知いたしました。{tenure_farewell}この団体での日々に、心から感謝いたします。{rivalry}'],
      ojousama: ['……承知いたしましたわ。{tenure_farewell}こちらでの日々、忘れませんわ。{rivalry}'],
    },
    emotional: {
      _default: ['{tenure_farewell}……ここでの時間は、忘れません……。{rivalry}……さようなら……。'],
    },
  },
  // ── 理由を聞く ─────────────────────────────────────────────────────────
  transfer_listen: {
    normal: {
      _default: ['聞いてくれるんですね。{record}正直、新しい場所で挑戦してみたいんです。'],
      ojousama: ['お耳を傾けてくださるのね。{record}新たな場所で己を試したいのですわ。'],
      delinquent: ['聞いてくれんのか。{record}正直、もっと面白えとこでやりてーんだよ。'],
      seductive: ['聞いてくれるの？ {record}…新しい場所で、自分を試してみたいの。'],
    },
    bold: {
      _default: ['……聞いてくれるのか。{record}正直、もっと上の舞台で闘いたいんです。ここじゃ物足りない。'],
      ojousama: ['……聞いてくださるの。{record}わたくし、もっと上の舞台を求めておりますの。'],
      delinquent: ['……聞いてくれんのか。{record}正直、もっと上で闘いてーんだよ。物足りねー。'],
      cool: ['…聞いてくれるのか。{record}…もっと上で闘いたい。それだけだ'],
      seductive: ['……聞いてくれるの。{record}正直ね、もっと大きな舞台が見たいの。'],
    },
    quiet: {
      _default: ['……聞いてくれるんですか……。{record}私……ここにいる意味が、分からなくなって……。'],
      cool: ['…聞いてくれるんだ。{record}…ここにいる意味が、分からない'],
      polite: ['……聞いてくださるんですか……。{record}私…ここにいる意味が、見えなくなって……。'],
    },
    shy: {
      _default: ['え…聞いてくれるんですか…？ {record}あの…私…ここにいていいのか、分からなくなって……。'],
    },
    easygoing: {
      _default: ['聞いてくれるの？ うーん……{record}なんかさ、マンネリっていうか。新しいことしたいんだよね。'],
      delinquent: ['聞いてくれんの？ {record}なんつーか、マンネリなんだよな。新しいとこ行きてーんだ。'],
      seductive: ['聞いてくれるの？ うーん…{record}なんかね、新しいこと始めたいなって♪'],
    },
    earnest: {
      _default: ['ありがとうございます。{record}自分なりに考えた結果です。ここでの経験は感謝しています。ですが……新しい環境で挑戦したいのです。'],
      polite: ['ありがとうございます。{record}ここでの経験には心から感謝しております。ですが…新しい環境で挑戦させてください。'],
      ojousama: ['ありがとうございますわ。{record}こちらでの経験は一生の宝ですわ。ですが…新天地で挑戦したいのです。'],
    },
    emotional: {
      _default: ['……聞いてくれるの……？ {record}もう……自分がどうしたいのかも分からなくなって……。でも、このままじゃダメだって……。'],
    },
  },
  // ── コンテキスト差し込みテンプレート ────────────────────────────────────
  tenure: {
    '1': 'まだ1年ですけど、',
    short: 'ここで過ごした{n}年間、',
    long: 'もう{n}年になるんですね……。',
    founder: '旗揚げからここにいるんですよ、私。',
  },
  record: {
    good: '去年は{wins}勝{losses}敗。結果は出してたと思うんですけど。',
    average: '成績は{wins}勝{losses}敗。悪くはなかったはずです。',
    bad: '成績が{wins}勝{losses}敗で……自分でもわかってます。でも……',
    few_matches: 'あんまり試合に出してもらえなかった……。',
  },
  rivalry: {
    has_rival: '{rivalName}とまだ決着ついてないけど……もういいです。',
    no_rival: '',
  },
  tenure_farewell: {
    short: '',
    long: 'ここで過ごした{n}年間、無駄じゃなかったって思いたいです。',
    founder: '旗揚げの時からいたんだな……なんか、不思議。',
  },
};

const CONTRACT_NEGOTIATION_CONFIG = {
  trustThresholds: { autoRenew: 40, raiseHigh: 30, raiseLow: 25, transferHigh: 15 },
  maxNegotiations: 4,
  minSeason: 2,
  raiseLimits: { min: 3, max: 30 },
  counterOfferRatio: 0.5,
  retentionWeeksBase: 8,
};

// v1.3-3: 引退セリフテンプレート（引退ルート×キャリア×性格で分岐）
const RETIREMENT_LINES = {
  // A: シーズン末引退（personality×archetype）
  A1_champion: {
    normal: {
      _default: ['頂点からの景色は、忘れない', '最高の舞台で闘えた。それだけで十分'],
      ojousama: ['頂点の景色…一生忘れませんわ'],
      delinquent: ['頂点からの景色、忘れねーよ'],
      seductive: ['頂点からの景色…忘れないわ'],
    },
    bold: {
      _default: ['あたしの時代だった。誰にも文句は言わせない'],
      ojousama: ['わたくしの時代でしたわ。異論はございませんわね'],
      delinquent: ['あたしの時代だった。文句あるやつはかかってこい'],
      cool: ['…背負い切った'],
      seductive: ['最後まで背負い切ったわ。最高の景色だった'],
    },
    quiet: {
      _default: ['……あのベルトの重さ、一生の宝物'],
      cool: ['…忘れない'],
      polite: ['あのベルトの重さ…一生の宝物です'],
    },
    shy: {
      _default: ['こんな私がチャンピオンになれたなんて…夢みたいです'],
    },
    easygoing: {
      _default: ['いやー最高だったね！ ベルト持てて幸せだったよ'],
      delinquent: ['最高だったぜ！ ベルト持てて幸せだったよ'],
      seductive: ['最高だったわ。ベルト持てて幸せだった'],
    },
    earnest: {
      _default: ['このベルトに恥じない闘いを、最後までできたと思う'],
      polite: ['このベルトに恥じない闘いを…最後までできたと思います'],
      ojousama: ['このベルトに恥じない闘いを…最後まで全うできましたわ'],
      seductive: ['このベルトに恥じない闘い…最後までできたわ'],
    },
    emotional: {
      _default: ['あのベルト…返したくない…でも…ありがとう…っ！'],
    },
  },
  A2_uncrowned: {
    normal: {
      _default: ['ベルトには届かなかった。でも、後悔はない', '夢は叶わなかったけど…この道を選んでよかった'],
      ojousama: ['ベルトには届きませんでしたわ。でも、後悔はありません'],
      delinquent: ['ベルトには届かなかった。でもよ、後悔はねーよ'],
      seductive: ['ベルトには届かなかったわ。でも、後悔はないの'],
    },
    bold: {
      _default: ['勝てない相手がいた。でも、逃げなかった。それが全てだ'],
      ojousama: ['逃げなかったことだけは…胸を張れますわ'],
      delinquent: ['逃げなかった。それだけは誇りに思ってるぜ'],
      cool: ['…逃げなかった。それだけだ'],
      seductive: ['逃げなかったわ。それだけは誇りに思ってる'],
    },
    quiet: {
      _default: ['……悔いは、ない'],
      cool: ['…悔いはない'],
      polite: ['…悔いはありません'],
    },
    shy: {
      _default: ['何も残せなかったかもしれないけど…ここにいられて幸せでした'],
    },
    easygoing: {
      _default: ['ベルトは無理だったけどさ、楽しかったよ！'],
      delinquent: ['ベルトは無理だったけどよ、楽しかったぜ！'],
      seductive: ['ベルトは無理だったけど…楽しかったわ'],
    },
    earnest: {
      _default: ['夢には届かなかった。でもこの道を選んだことに嘘はない'],
      polite: ['夢には届きませんでした。でもこの道を選んだことに嘘はありません'],
      ojousama: ['夢には届きませんでしたわ。でもこの道に嘘はございません'],
      seductive: ['夢には届かなかったわ。でも嘘はなかった'],
    },
    emotional: {
      _default: ['ベルト…欲しかったな…でも…ここにいられてよかった…！'],
    },
  },
  A3_heel: {
    normal: {
      _default: ['フン…勝手に泣いてんじゃないわよ', 'あたしがいなくなって寂しくなるわね'],
      ojousama: ['お泣きにならないで。みっともなくてよ'],
      delinquent: ['泣いてんじゃねーよ。みっともねーな'],
      seductive: ['ふふ…泣かないで。寂しくなるでしょう？'],
    },
    bold: {
      _default: ['最後まで嫌われ者でいさせてもらうわ。最高だった'],
      ojousama: ['最後まで嫌われ者…痛快でしたわ'],
      delinquent: ['最後まで嫌われ者だ！ 最高だったぜ！'],
      cool: ['…嫌われ者で終わる。悪くない'],
      seductive: ['最後まで嫌われ者…ふふ、最高だったわ'],
    },
    quiet: {
      _default: ['……さよなら'],
      cool: ['…じゃあな'],
      polite: ['…お世話になりました'],
    },
    shy: {
      _default: ['本当は…みんなと一緒にいたかったです…ごめんなさい'],
    },
    easygoing: {
      _default: ['あはは、最後くらい素直になってもいいかな。楽しかったよ'],
      delinquent: ['最後くらい素直になるか。楽しかったぜ'],
      seductive: ['最後くらい素直になろうかしら。楽しかったわ'],
    },
    earnest: {
      _default: ['嫌われ役は…誰かがやらなきゃいけなかったから'],
      polite: ['嫌われ役は…誰かがやらなければいけませんでしたから'],
      ojousama: ['嫌われ役は…どなたかがやらねばなりませんでしたもの'],
      seductive: ['嫌われ役はね…誰かがやらなきゃいけなかったの'],
    },
    emotional: {
      _default: ['…っ、バカ…泣くんじゃないわよ…あたしまで…っ！'],
    },
  },
  A4_veteran: {
    normal: {
      _default: ['ここが、あたしの全部だった', 'この団体で過ごした時間は、嘘じゃない'],
      ojousama: ['ここが、わたくしの全てでしたわ'],
      delinquent: ['ここが全部だった。嘘じゃねーよ'],
      seductive: ['ここが、私の全てだったの'],
    },
    bold: {
      _default: ['長かったようで…あっという間だったな。悔いはない'],
      ojousama: ['長いようで…あっという間でしたわ'],
      delinquent: ['あっという間だったな。悔いなんかねーよ'],
      cool: ['…あっという間だった'],
      seductive: ['あっという間だったわ。悔いはないの'],
    },
    quiet: {
      _default: ['……ありがとう'],
      cool: ['…ありがとう'],
      polite: ['…ありがとうございました'],
    },
    shy: {
      _default: ['長い間…お世話になりました。ここにいられて幸せでした'],
    },
    easygoing: {
      _default: ['いやー長かった！ でもあっという間だったね'],
      delinquent: ['長かったなー！ でもあっという間だったぜ'],
      seductive: ['長かったわ…でもあっという間だった'],
    },
    earnest: {
      _default: ['全力で走り抜けた。この時間に嘘はない'],
      polite: ['全力で走り抜けました。この時間に嘘はありません'],
      ojousama: ['全力で走り抜けましたわ。この時間に嘘はございません'],
      seductive: ['全力で走り抜けたわ。嘘のない時間だった'],
    },
    emotional: {
      _default: ['ここが…全部だった…ありがとう…ありがとう…！'],
    },
  },
  // B: 怪我引退（personality×archetype）
  B1_young: {
    normal: {
      _default: ['まだ何も成し遂げてないのに…', 'あたしの物語、こんなところで終わりなの…？'],
      ojousama: ['まだ何も…成し遂げていませんのに…'],
      delinquent: ['まだ何もやってねーのに…嘘だろ…'],
      seductive: ['まだ何も成し遂げてないのに…嘘でしょう…'],
    },
    bold: {
      _default: ['嘘だろ…まだ始まったばかりじゃないか…！'],
      ojousama: ['嘘ですわ…まだ始まったばかりですのに…！'],
      delinquent: ['嘘だろ…まだ始まったばかりだろうが…！'],
      cool: ['…嘘だ'],
      seductive: ['嘘…まだ始まったばかりじゃない…'],
    },
    quiet: {
      _default: ['………まだ、なのに'],
      cool: ['……まだ'],
      polite: ['…まだ、何も…'],
    },
    shy: {
      _default: ['やっぱり…私には無理だったんでしょうか…'],
    },
    easygoing: {
      _default: ['え…うそ…まだこれからだったのに…'],
      delinquent: ['うそだろ…まだこれからだったのによ…'],
      seductive: ['うそ…まだこれからだったのに…'],
    },
    earnest: {
      _default: ['まだ何も返せてない…こんなの、受け入れられない'],
      polite: ['まだ何もお返しできていないのに…受け入れられません'],
      ojousama: ['まだ何もお返しできていませんのに…'],
      seductive: ['まだ何も返せてないのに…受け入れられないわ'],
    },
    emotional: {
      _default: ['いやだ…いやだよ…まだ始まったばかりなのに…！'],
    },
  },
  B2_prime: {
    normal: {
      _default: ['体がね…もう言うことを聞かないの', 'これからだったのに…悔しい、悔しいよ…'],
      ojousama: ['お体がね…もう言うことを聞きませんの…'],
      delinquent: ['体がよ…もう言うこと聞かねーんだ…'],
      seductive: ['体がね…もう言うことを聞かないの…'],
    },
    bold: {
      _default: ['まだやれると思ってた。信じてた…！'],
      ojousama: ['まだやれると信じていましたのに…！'],
      delinquent: ['まだやれるって信じてたのに…くそっ…！'],
      cool: ['…信じていた。まだやれると'],
      seductive: ['まだやれると信じてたのに…'],
    },
    quiet: {
      _default: ['……これからだったのに'],
      cool: ['…まだ'],
      polite: ['…これからだったのに…'],
    },
    shy: {
      _default: ['せっかく…やっと少し自信がついてきたのに…'],
    },
    easygoing: {
      _default: ['あはは…参ったな、これからだったのに…'],
      delinquent: ['参ったな…これからだったのによ…'],
      seductive: ['参ったわ…これからだったのに…'],
    },
    earnest: {
      _default: ['まだ足りなかった。もっと…もっとやりたかった'],
      polite: ['まだ足りませんでした。もっと…やりたかったです'],
      ojousama: ['まだ足りませんでしたわ。もっと…やりたかった'],
      seductive: ['まだ足りなかったわ…もっとやりたかった'],
    },
    emotional: {
      _default: ['悔しい…悔しいよ…これからだったのに…！'],
    },
  },
  B3_older: {
    normal: {
      _default: ['わかってた。いつか来るって', '十分やったよ。自分を褒めてやりたい'],
      ojousama: ['わかっておりましたわ。いつか来ると'],
      delinquent: ['わかってたよ。いつか来るってな'],
      seductive: ['わかってたわ。いつか来るって'],
    },
    bold: {
      _default: ['この体はもう限界だけど…心は、まだ燃えてる'],
      ojousama: ['お体は限界ですけれど…心はまだ燃えておりますわ'],
      delinquent: ['体は限界だけどよ…心はまだ燃えてるぜ'],
      cool: ['…体は限界。心は、まだ'],
      seductive: ['体は限界だけど…心はまだ燃えてるわ'],
    },
    quiet: {
      _default: ['……十分やった'],
      cool: ['…十分だ'],
      polite: ['…十分やれたと思います'],
    },
    shy: {
      _default: ['みなさんのおかげで…ここまで来られました'],
    },
    easygoing: {
      _default: ['まぁ、十分やったよね。いい人生だった！'],
      delinquent: ['十分やったぜ。いい人生だったよ！'],
      seductive: ['十分やったわ。いい人生だった'],
    },
    earnest: {
      _default: ['悔いがないと言えば嘘になる。でも…やりきった'],
      polite: ['悔いがないとは言えません。でも…やりきりました'],
      ojousama: ['悔いがないとは申しませんわ。でも…やりきりました'],
      seductive: ['悔いがないとは言わないわ。でも…やりきった'],
    },
    emotional: {
      _default: ['わかってたよ…いつか来るって…でも…寂しいよ…！'],
    },
  },
  B4_champion_injury: {
    normal: {
      _default: ['このベルト…まだ返したくなかった', '最後の防衛戦、やりたかったな…'],
      ojousama: ['このベルト…まだお返ししたくありませんでしたわ'],
      delinquent: ['このベルト…まだ返したくなかったんだよ…'],
      seductive: ['このベルト…まだ返したくなかったのに…'],
    },
    bold: {
      _default: ['チャンピオンのまま終わるなんて…残酷すぎる'],
      ojousama: ['チャンピオンのまま…残酷ですわ'],
      delinquent: ['チャンピオンのまま終わりだと…ふざけんな…'],
      cool: ['…残酷だ'],
      seductive: ['チャンピオンのまま終わるなんて…残酷ね'],
    },
    quiet: {
      _default: ['……まだ、返したくなかった'],
      cool: ['…まだだ'],
      polite: ['…まだ、お返ししたくなかったです'],
    },
    shy: {
      _default: ['せっかくベルトをもらえたのに…ごめんなさい…'],
    },
    easygoing: {
      _default: ['あちゃー…ベルト持ったまま終わりかぁ…'],
      delinquent: ['まじかよ…ベルト持ったまま終わりかよ…'],
      seductive: ['あら…ベルト持ったまま終わりなの…'],
    },
    earnest: {
      _default: ['最後の防衛戦、やりたかった…それだけが心残りだ'],
      polite: ['最後の防衛戦…やりたかったです。それだけが心残りです'],
      ojousama: ['最後の防衛戦…やりたかったですわ'],
      seductive: ['最後の防衛戦…やりたかったわ。それだけが心残り'],
    },
    emotional: {
      _default: ['やだ…このベルト…まだ返したくない…っ！'],
    },
  },
};

// ── 引退勧告・引き留めシステム セリフデータ (retirement-advisory-spec-v1_1) ──
const RETIRE_ACCEPT_LINES = {
  accept_terminal: {  // 末期 (wear≥60)
    normal: {
      _default: ['…わかった。もう限界なの、自分でもわかってる', '…正直、ほっとしてる。ありがとう'],
      ojousama: ['…わかりましたわ。もう限界ですもの'],
      delinquent: ['…わかってるよ。もう限界なんだろ'],
      seductive: ['…わかったわ。もう限界なのよね'],
    },
    bold: {
      _default: ['…認めるよ。もう体が限界だ'],
      ojousama: ['…認めますわ。もうお体が限界ですの'],
      delinquent: ['…認めてやるよ。もう限界だ'],
      cool: ['…限界だ。認める'],
      seductive: ['…認めるわ。もう限界なの'],
    },
    quiet: { _default: ['……わかってる'], cool: ['…わかってる'], polite: ['…わかっています'] },
    shy: { _default: ['…はい。ご迷惑をおかけしました…'] },
    easygoing: {
      _default: ['あはは…まぁ、そうだよね。ありがとう'],
      delinquent: ['まぁそうだよな。ありがとよ'],
      seductive: ['そうよね…ありがとう'],
    },
    earnest: {
      _default: ['ありがとう。言ってくれて助かった'],
      polite: ['ありがとうございます。言ってくださって助かりました'],
      ojousama: ['ありがとうございますわ。言ってくださって'],
      seductive: ['ありがとう。言ってくれて助かったわ'],
    },
    emotional: { _default: ['…うん…わかってた…わかってたよ…っ'] },
  },
  accept_winless: {  // 低勝率 (≤40%)
    normal: {
      _default: ['自分でもわかってた。もう追いつけないって', '…そうだね。最近、勝てない試合が多すぎた'],
      ojousama: ['…そうですわね。最近、勝てませんでしたもの'],
      delinquent: ['…わかってたよ。もう追いつけねーって'],
      seductive: ['…わかってたわ。もう追いつけないって'],
    },
    bold: {
      _default: ['…チッ、認めたくないが…結果が全てだ'],
      ojousama: ['…認めたくありませんけれど…結果が全てですわ'],
      delinquent: ['…チッ、認めたくねーけど…結果が全てだろ'],
      cool: ['…結果が全てだ'],
      seductive: ['認めたくないけど…結果が全てよね'],
    },
    quiet: { _default: ['……そう、だね'], cool: ['…そうだな'], polite: ['…そうですね'] },
    shy: { _default: ['もっと早く気づくべきでした…すみません'] },
    easygoing: {
      _default: ['うーん…そうだよね。勝てなくなっちゃったもんね'],
      delinquent: ['そうだよな。勝てなくなっちまったもんな'],
      seductive: ['そうよね…勝てなくなっちゃったものね'],
    },
    earnest: {
      _default: ['もっと早く気づくべきだった。…わかった'],
      polite: ['もっと早く気づくべきでした。…わかりました'],
      ojousama: ['もっと早く気づくべきでしたわ。…承知しました'],
      seductive: ['もっと早く気づくべきだったわ。…わかったわ'],
    },
    emotional: { _default: ['勝てない…もう勝てないんだ…わかってたよ…'] },
  },
  accept_heel: {  // Heel
    normal: {
      _default: ['…別にアンタに言われなくても辞めるつもりだったわよ', 'フン…まぁ、潮時ってやつかしらね'],
      ojousama: ['…お言われにならなくても、辞めるつもりでしたわ'],
      delinquent: ['言われなくても辞めるつもりだったっつーの'],
      seductive: ['ふふ…言われなくても辞めるつもりだったわ'],
    },
    bold: {
      _default: ['…いいわ。最後くらい、大人しく引き受けてあげる'],
      ojousama: ['…よろしくてよ。最後くらい大人しくいたしますわ'],
      delinquent: ['…いいぜ。最後くらい大人しくしてやるよ'],
      cool: ['…いい。受ける'],
      seductive: ['…いいわよ。最後くらい大人しくしてあげる'],
    },
    quiet: { _default: ['……潮時か'], cool: ['…潮時だ'], polite: ['…潮時ですね'] },
    shy: { _default: ['…はい。もう…十分です'] },
    easygoing: {
      _default: ['ま、潮時ってやつだね。わかったわかった'],
      delinquent: ['潮時ってやつだな。わかったよ'],
      seductive: ['潮時ってやつかしら。わかったわ'],
    },
    earnest: {
      _default: ['…わかった。最後まで悪役を演じきれたなら本望だ'],
      polite: ['…わかりました。最後まで演じきれたなら本望です'],
      ojousama: ['…承知しましたわ。最後まで演じきれましたもの'],
      seductive: ['…わかったわ。最後まで演じきれたなら本望よ'],
    },
    emotional: { _default: ['…っ、もういいわよ…わかった…わかったから…'] },
  },
  accept_former_champ: {  // 元王者
    normal: {
      _default: ['最後にいい試合がしたい。それだけお願いできる？', '…わかった。ベルトを持てた分、十分だよ'],
      ojousama: ['最後によい試合をさせてくださいまし'],
      delinquent: ['最後にいい試合させてくれよ。それだけでいい'],
      seductive: ['最後にいい試合がしたいの。お願いできる？'],
    },
    bold: {
      _default: ['最後に…この団体でもう一回輝かせてくれ'],
      ojousama: ['最後に…もう一度輝かせてくださいまし'],
      delinquent: ['最後に…もう一回輝かせてくれよ'],
      cool: ['…最後に、もう一度'],
      seductive: ['最後に…もう一回輝かせてくれる？'],
    },
    quiet: { _default: ['…ベルトを持てた。それで十分'], cool: ['…十分だ'], polite: ['…ベルトを持てました。それで十分です'] },
    shy: { _default: ['ベルトを持てただけで…十分すぎるくらいです'] },
    easygoing: {
      _default: ['ベルト持てたんだもん。十分でしょ！'],
      delinquent: ['ベルト持てたんだぜ。十分だろ！'],
      seductive: ['ベルト持てたものね。十分よ'],
    },
    earnest: {
      _default: ['最後にいい試合を。それだけが望みだ'],
      polite: ['最後によい試合を。それだけが望みです'],
      ojousama: ['最後によい試合を。それだけが望みですわ'],
      seductive: ['最後にいい試合を。それだけが望みよ'],
    },
    emotional: { _default: ['ベルト…持てたから…もう…十分だよ…っ'] },
  },
  accept_no_title: {  // 無冠
    normal: {
      _default: ['…わかった。潮時だよね', '…そうだね。ありがとう、言ってくれて'],
      ojousama: ['…わかりましたわ。潮時ですわね'],
      delinquent: ['…わかったよ。潮時ってやつだろ'],
      seductive: ['…わかったわ。潮時よね'],
    },
    bold: {
      _default: ['…チッ、こんな終わり方かよ。…わかった'],
      ojousama: ['…こんな終わり方ですの。…承知しましたわ'],
      delinquent: ['チッ、こんな終わり方かよ…わかったよ'],
      cool: ['…わかった'],
      seductive: ['こんな終わり方なのね…わかったわ'],
    },
    quiet: { _default: ['……うん'], cool: ['…ああ'], polite: ['…はい'] },
    shy: { _default: ['…はい。お世話になりました…'] },
    easygoing: {
      _default: ['うん、覚悟はできてた。最後、よろしくね'],
      delinquent: ['覚悟はできてたよ。最後よろしくな'],
      seductive: ['覚悟はできてたわ。最後、よろしくね'],
    },
    earnest: {
      _default: ['…覚悟はできてた。ありがとう、言ってくれて'],
      polite: ['…覚悟はできていました。言ってくださってありがとうございます'],
      ojousama: ['…覚悟はできておりましたわ。ありがとうございます'],
      seductive: ['…覚悟はできてたわ。言ってくれてありがとう'],
    },
    emotional: { _default: ['うん…覚悟…できてたよ…ありがとう…'] },
  },
};

const RETIRE_REFUSE_LINES = {
  refuse_champ: {  // 王座保持中
    normal: {
      _default: ['チャンピオンに引退しろって？ 冗談はやめて', 'このベルトがある限り、あたしは終わらない'],
      ojousama: ['チャンピオンに引退ですって？ ご冗談を'],
      delinquent: ['チャンピオンに引退しろだと？ ふざけんな'],
      seductive: ['チャンピオンに引退ですって？ 冗談でしょう？'],
    },
    bold: {
      _default: ['王者を引退させようなんて、100年早い'],
      ojousama: ['王者を引退させようなんて、100年早くてよ'],
      delinquent: ['王者に引退しろだと？ 100年早ぇんだよ！'],
      cool: ['…王者は、退かない'],
      seductive: ['王者を辞めさせる？ 100年早いわよ'],
    },
    quiet: { _default: ['……このベルトがある限り'], cool: ['…退かない'], polite: ['…このベルトがある限りは'] },
    shy: { _default: ['あの…まだ、このベルトを守りたいんです…'] },
    easygoing: {
      _default: ['えー、まだチャンピオンだよ？ もうちょっと待ってよ'],
      delinquent: ['まだチャンピオンだぜ？ もうちょっと待てって'],
      seductive: ['まだチャンピオンよ？ もう少し待って'],
    },
    earnest: {
      _default: ['このベルトの重みをまだ背負える。引退はしない'],
      polite: ['このベルトの重みをまだ背負えます。引退はしません'],
      ojousama: ['このベルトの重みをまだ背負えますわ'],
      seductive: ['このベルトの重み…まだ背負えるわ'],
    },
    emotional: { _default: ['やだ…このベルト離さない…まだ闘える…！'] },
  },
  refuse_distrust: {  // 信頼度低
    normal: {
      _default: ['あたしを追い出す気？ そう簡単にはいかないわよ', 'この団体に何年貢献してきたと思ってるの'],
      ojousama: ['わたくしを追い出すおつもり？ そうはいきませんわ'],
      delinquent: ['追い出す気かよ。そう簡単にいくと思うなよ'],
      seductive: ['私を追い出すつもり？ そうはいかないわよ'],
    },
    bold: {
      _default: ['…あたしのことが邪魔なの？ はっきり言いなさいよ'],
      ojousama: ['わたくしが邪魔ですの？ はっきりおっしゃいなさい'],
      delinquent: ['あたしが邪魔だってのか？ はっきり言えよ'],
      cool: ['…邪魔か。はっきり言え'],
      seductive: ['私が邪魔なの？ はっきり言ってくれる？'],
    },
    quiet: { _default: ['……そういうこと、か'], cool: ['…そうか'], polite: ['…そう、ですか'] },
    shy: { _default: ['…私、必要ないってことですか…？'] },
    easygoing: {
      _default: ['えぇ…あたし邪魔なの？ ちょっとひどくない？'],
      delinquent: ['おいおい…邪魔だってのか？ ひでーな'],
      seductive: ['あら…私が邪魔なの？ ひどいわね'],
    },
    earnest: {
      _default: ['この団体のために尽くしてきた。その気持ちは嘘じゃない'],
      polite: ['この団体のために尽くしてきました。嘘ではありません'],
      ojousama: ['この団体のために尽くしてまいりましたわ'],
      seductive: ['この団体のために尽くしてきたの。嘘じゃないわ'],
    },
    emotional: { _default: ['何年…何年ここにいたと思ってるの…っ！'] },
  },
  refuse_heel: {  // Heel
    normal: {
      _default: ['引退？ 次の興行を見てなさい。後悔させてあげる', 'まだまだ引退なんてしてやらないわよ'],
      ojousama: ['引退ですって？ 次の興行をご覧になってくださいまし'],
      delinquent: ['引退だと？ 次の興行見てろ。後悔させてやる'],
      seductive: ['引退ですって？ 次の興行を見てちょうだい'],
    },
    bold: {
      _default: ['あたしがいなくなったら、この団体は終わりよ'],
      ojousama: ['わたくしがいなくなったら、この団体は終わりですわ'],
      delinquent: ['あたしがいなくなったらこの団体終わりだぜ'],
      cool: ['…この団体は私がいないと終わる'],
      seductive: ['私がいなくなったら…この団体、終わるわよ？'],
    },
    quiet: { _default: ['……まだ辞めない'], cool: ['…辞めない'], polite: ['…まだ辞めません'] },
    shy: { _default: ['…もう少しだけ…ここにいさせてください'] },
    easygoing: {
      _default: ['まだまだ暴れ足りないよ～'],
      delinquent: ['まだまだ暴れ足りねーぜ！'],
      seductive: ['まだまだ暴れ足りないわ'],
    },
    earnest: {
      _default: ['次の興行で証明する。後悔させてみせる'],
      polite: ['次の興行で証明します。後悔させてみせます'],
      ojousama: ['次の興行で証明いたしますわ'],
      seductive: ['次の興行で証明するわ。後悔させてみせる'],
    },
    emotional: { _default: ['引退…っ？ 冗談じゃない…まだ終わらない…！'] },
  },
  refuse_fighting: {  // 一般
    normal: {
      _default: ['まだ終わらない。あたしはまだ闘える', '体がある限り、あたしはリングに立つ'],
      ojousama: ['まだ終わりませんわ。わたくしはまだ闘えます'],
      delinquent: ['まだ終わんねーよ。あたしはまだ闘える'],
      seductive: ['まだ終わらないわ。私はまだ闘えるの'],
    },
    bold: {
      _default: ['…諦めるのは、まだ早い。見てろ'],
      ojousama: ['諦めるのは早くてよ。見ていてくださいまし'],
      delinquent: ['諦めるのはまだ早ぇんだよ。見てろ'],
      cool: ['…まだだ'],
      seductive: ['諦めるのはまだ早いわ。見ていて'],
    },
    quiet: { _default: ['……まだ、闘える'], cool: ['…闘える'], polite: ['…まだ、闘えます'] },
    shy: { _default: ['あの…もう少しだけ、チャンスをください…'] },
    easygoing: {
      _default: ['まだまだ元気だよ！ もうちょっとやらせてよ'],
      delinquent: ['まだまだ元気だぜ！ もうちょっとやらせろよ'],
      seductive: ['まだまだ元気よ。もう少しやらせて'],
    },
    earnest: {
      _default: ['まだやれることがある。ここで止まるわけにはいかない'],
      polite: ['まだやれることがあります。止まるわけにはいきません'],
      ojousama: ['まだやれることがございます。止まりませんわ'],
      seductive: ['まだやれることがあるの。止まるわけにはいかないわ'],
    },
    emotional: { _default: ['まだ…まだ闘いたい…お願い、もう少しだけ…！'] },
  },
};

const RETAIN_LINES = {
  former_champ: {
    normal: {
      _default: ['…もう少しだけ。最後にもう一度、あのベルトに手を伸ばしたい'],
      ojousama: ['もう少しだけ…あのベルトに手を伸ばしたいですわ'],
      delinquent: ['もう少しだけだ…あのベルトにもう一回手を伸ばしてーんだ'],
      seductive: ['もう少しだけ…あのベルトに手を伸ばしたいの'],
    },
    bold: {
      _default: ['もう一シーズンだけやらせてくれ。必ず結果を出す'],
      ojousama: ['もう一シーズン。必ず結果を出しますわ'],
      delinquent: ['もう一シーズンだけだ。絶対結果出すぜ'],
      cool: ['…もう一シーズン'],
      seductive: ['もう一シーズンだけ。結果を出すわ'],
    },
    quiet: { _default: ['……もう一度だけ'], cool: ['…もう一度'], polite: ['…もう一度だけ、挑戦させてください'] },
    shy: { _default: ['あの…もう一度だけ…あのベルトに…挑戦させてください'] },
    easygoing: {
      _default: ['もうちょっとだけ！ あのベルトもう一回触りたいんだよね'],
      delinquent: ['もうちょっとだけだ！ あのベルトもう一回触りてーんだよ'],
      seductive: ['もう少しだけ。あのベルトにもう一度触れたいの'],
    },
    earnest: {
      _default: ['最後にもう一度…あのベルトに恥じない闘いをしたい'],
      polite: ['最後にもう一度…あのベルトに恥じない闘いをしたいです'],
      ojousama: ['最後にもう一度…あのベルトに恥じない闘いをしたいですわ'],
      seductive: ['最後にもう一度…恥じない闘いをしたいの'],
    },
    emotional: { _default: ['あのベルト…もう一度…触りたい…っ'] },
  },
  high_trust: {
    normal: {
      _default: ['アンタがそう言うなら…もう少しだけ頑張ってみるよ'],
      ojousama: ['あなたがそうおっしゃるなら…もう少しだけ頑張りますわ'],
      delinquent: ['お前がそう言うなら…もうちょっとだけやってみるか'],
      seductive: ['あなたがそう言うなら…もう少し頑張ってみるわ'],
    },
    bold: {
      _default: ['…信じてくれるなら、もう少し付き合ってやるよ'],
      ojousama: ['信じてくださるなら…もう少しお付き合いしますわ'],
      delinquent: ['信じてくれんなら…もうちょっと付き合ってやるぜ'],
      cool: ['…信じてくれるなら'],
      seductive: ['信じてくれるの？ …もう少し付き合うわ'],
    },
    quiet: { _default: ['……ありがとう。もう少しだけ'], cool: ['…もう少しだけ'], polite: ['…ありがとうございます。もう少しだけ'] },
    shy: { _default: ['信じてくれて…ありがとうございます。もう少しだけ…'] },
    easygoing: {
      _default: ['そっか、まだ必要としてくれてるんだ。じゃあもうちょっと！'],
      delinquent: ['まだ必要ってことか。じゃあもうちょっとやるか！'],
      seductive: ['まだ必要としてくれるの。じゃあもう少し'],
    },
    earnest: {
      _default: ['信じてくれてありがとう。期待に応えてみせる'],
      polite: ['信じてくださってありがとうございます。期待に応えます'],
      ojousama: ['信じてくださって…期待に応えてみせますわ'],
      seductive: ['信じてくれてありがとう。応えてみせるわ'],
    },
    emotional: { _default: ['…っ、ありがとう…もう少しだけ…頑張る…！'] },
  },
  heel: {
    normal: {
      _default: ['フン…まだ使い道があるってことね。いいわ、付き合ってあげる'],
      ojousama: ['まだ使い道がおありですのね。お付き合いしてさしあげますわ'],
      delinquent: ['まだ使い道があるってか。いいぜ、付き合ってやるよ'],
      seductive: ['まだ使い道があるのね。いいわ、付き合ってあげる'],
    },
    bold: {
      _default: ['…チッ、引き留めるのか。まぁ、悪くない判断だ'],
      ojousama: ['引き留めますの。…まぁ、悪くない判断ですわ'],
      delinquent: ['引き留めるのかよ。まぁ悪くねー判断だな'],
      cool: ['…悪くない判断だ'],
      seductive: ['引き留めるの？ …悪くない判断ね'],
    },
    quiet: { _default: ['……いいだろう'], cool: ['…いい'], polite: ['…わかりました'] },
    shy: { _default: ['…まだ、ここにいてもいいんですか…？'] },
    easygoing: {
      _default: ['へぇ、まだ使ってくれるんだ。ま、いいけどね'],
      delinquent: ['まだ使ってくれんのか。ま、いいけどよ'],
      seductive: ['まだ使ってくれるの。ま、いいけど'],
    },
    earnest: {
      _default: ['…わかった。まだ役に立てるなら、全力でやる'],
      polite: ['…わかりました。まだお役に立てるなら全力で'],
      ojousama: ['…承知しましたわ。お役に立てるなら全力を尽くします'],
      seductive: ['…わかったわ。まだ役に立てるなら全力でやるわ'],
    },
    emotional: { _default: ['…っ、まだ必要としてくれるの…わかった…やるよ…'] },
  },
  default: {
    normal: {
      _default: ['…うん、もう少しだけやってみる', 'わかった。もう少しだけ、続けてみる'],
      ojousama: ['…えぇ、もう少しだけ続けてみますわ'],
      delinquent: ['…わかった。もうちょっとだけやってみるか'],
      seductive: ['…わかったわ。もう少し続けてみる'],
    },
    bold: {
      _default: ['…まだ終わりじゃない。やってやるよ'],
      ojousama: ['まだ終わりではありませんわ'],
      delinquent: ['まだ終わりじゃねーよ。やってやるぜ'],
      cool: ['…まだだ'],
      seductive: ['まだ終わりじゃないわ'],
    },
    quiet: { _default: ['……もう少しだけ'], cool: ['…もう少し'], polite: ['…もう少しだけ、続けます'] },
    shy: { _default: ['…もう少しだけ…頑張ってみます'] },
    easygoing: {
      _default: ['まぁもうちょっとやってみようかな！'],
      delinquent: ['もうちょっとやってみっか！'],
      seductive: ['もう少しやってみようかしら'],
    },
    earnest: {
      _default: ['…わかった。まだやれることがあるなら続ける'],
      polite: ['…わかりました。まだやれることがあるなら続けます'],
      ojousama: ['…承知しましたわ。やれることがあるなら続けます'],
      seductive: ['…わかったわ。やれることがあるなら続けるわ'],
    },
    emotional: { _default: ['…うん…もう少しだけ…やってみる…'] },
  },
};

// §4 コーチ引退アドバイス テキスト
const COACH_RETIRE_ADVICE_TEXTS = {
  C_positive: [
    '多分、受け入れてくれると思いますよ',
    '本人もそろそろかなって感じはありますね',
  ],
  C_negative: [
    'うーん…まだ早いかもしれませんね',
    '本人はまだやる気ですよ。難しいかと',
  ],
  B_high: [
    '本人も覚悟しているようです。通ると思いますよ',
    '体の衰えは本人が一番わかってますから。大丈夫でしょう',
  ],
  B_maybe: [
    '正直、半々ですね。受け入れるかどうかは本人次第です',
    '気持ちは揺れてると思います。タイミング次第かと',
  ],
  B_hard: [
    'まだ本人には闘志がありますね。断られる覚悟はしてください',
    '目が死んでないですよ、あの選手。引退は早いかと',
  ],
  A_sure: [
    '間違いなく受け入れます。本人もそのつもりです',
    'あの選手、次の身の振り方まで考え始めてますよ',
  ],
  A_likely: [
    '多分通るでしょう。本人も薄々わかってますから',
    '練習後の表情を見ていると…受け入れると思います',
  ],
  A_iffy: [
    '正直読めないです。本人の中でも揺れてる感じですね',
    '闘志はあるけど体がついてこない…複雑な状態です',
  ],
  A_hard: [
    '止めた方がいい。あの目はまだ引退する目じゃない',
    '断言しますが、今は無理です。怒らせるだけですよ',
  ],
};

// v1.4: 年末表彰式 セリフデータ（personality×archetype）
const AWARD_LINES = {
  rookie: {
    normal: {
      _default: ['控室で泣きました。嘘じゃないです。…来年はもっと上で泣きます', 'この賞の重さ、まだわかりません。でもリングに上がるたび、きっとわかっていく'],
      ojousama: ['まさかわたくしがこのような栄誉に…身の引き締まる思いですわ。先輩方の背中、しかと見ておりました'],
      delinquent: ['正直ビビってる。こんなちゃんとした賞もらったの初めてだ…来年も取る'],
      seductive: ['覚えておいて。この名前、来年はもっと大きなところで呼ばれるから'],
    },
    bold: {
      _default: ['新人王？ 通過点だ。来年はMVPを狙う', '最初から頂点しか見てない。この賞はスタートラインだ'],
      ojousama: ['当然の結果ですわね。わたくしの実力をご覧になれば、誰もが納得するでしょう？'],
      delinquent: ['ハッ、新人なのは今年だけだ。来年は全部かっさらう'],
      cool: ['…始まりに過ぎない'],
      seductive: ['嬉しい？ ええ、嬉しいわ。でもこの程度で満足する女じゃないの'],
    },
    quiet: {
      _default: ['……まだ何も成し遂げていない。これから'],
      cool: ['…次'],
      polite: ['…ありがとうございます。まだ、足りないものばかりです'],
    },
    shy: {
      _default: ['えっ…わたし、ですか…？ 間違いじゃ…あ、ありがとうございます…'],
      ojousama: ['わ、わたくしが…？ そんな…まだまだ未熟者ですのに…'],
      delinquent: ['は？ マジで？ いや…あ、ありがとな…'],
    },
    easygoing: {
      _default: ['うそでしょ！ 今年一番びっくりしたの、この瞬間かも！', 'いやー楽しかった！ ここまで来れたの、運がよかっただけかも！'],
      delinquent: ['うっそだろ！？ まあいいや、もらえるもんはもらっとく！'],
      seductive: ['あら、嬉しいサプライズ。来年はもっと驚かせてあげる'],
    },
    earnest: {
      _default: ['練習は裏切らなかった。…もっと強くなって、この賞に恥じない選手になります'],
      polite: ['毎日の積み重ねが報われました。指導してくださった皆さん、ありがとうございます'],
      ojousama: ['努力を重ねてまいりました。この賞を糧に、さらなる高みを目指しますわ'],
      seductive: ['努力してきたもの。…でもまだ足りないわ。もっと磨くから、見ていて'],
    },
    emotional: {
      _default: ['あ…だめだ、泣いちゃう…。嬉しいです…こんなに…嬉しいの初めてです…！'],
      ojousama: ['あっ…涙が…こ、こんなところで取り乱すなんて…嬉しすぎますわ…！'],
      delinquent: ['くっ…泣くかよこんなとこで…。ちくしょう…嬉しいじゃねえか…！'],
    },
  },
  bestMatch: {
    normal: {
      _default: ['あの試合の最後の5分間、永遠みたいだった。あの人とだから出せた全力です', '終わった瞬間、勝ち負けなんてどうでもよくなった。それくらいの試合だった'],
      ojousama: ['あのような激闘、生涯忘れませんわ。お相手に心より敬意を'],
      delinquent: ['あの試合はヤバかった。体が勝手に動いてた。あいつとじゃなきゃ無理だった'],
      seductive: ['最高に痺れたわ。…また味わいたい、あの感覚'],
    },
    bold: {
      _default: ['全力と全力がぶつかった。あの瞬間、リングの上に二人しかいなかった', 'あの試合で出し惜しみしたら嘘だろう。全部置いてきた'],
      ojousama: ['あのお方と全力で戦えたこと、これ以上の名誉はありませんわ'],
      delinquent: ['殴って殴られて、最後に立ってた。それだけだ。…最高だったけどな'],
      cool: ['…言葉はいらない。あの試合がすべてだ'],
      seductive: ['全力を引き出してくれた相手に感謝。…次はもっと激しくいくわよ？'],
    },
    quiet: {
      _default: ['……あの試合のことは、ずっと体が覚えてる'],
      cool: ['…一生の試合だった'],
      polite: ['…あの方と戦えて、本当によかったです'],
    },
    shy: {
      _default: ['あんなすごい試合にわたしが出てたなんて…。相手が引き出してくれたんです'],
      ojousama: ['あ、あのような試合ができましたのは…お相手のおかげですわ…'],
      delinquent: ['いや…あたしなんかがあんな試合…相手がすげえんだよ…'],
    },
    easygoing: {
      _default: ['すっげー楽しかった！ 終わった瞬間「もう1回！」って思ったもん', '試合中ずっとニヤニヤしてたかも。だって最高なんだもん！'],
      delinquent: ['終わった瞬間「もう1ラウンドくれ！」って叫びそうになった！'],
      seductive: ['楽しかったわ。久しぶりに全部忘れて夢中になれた'],
    },
    earnest: {
      _default: ['あの試合のためにずっと準備してきた。報われた瞬間だった', 'お互いが持ってるもの全部出し切れた。これがプロレスだと思う'],
      polite: ['あの試合は一生の宝物です。対戦相手の方に、心から感謝しています'],
      ojousama: ['あの試合に向けて積み重ねた日々が報われましたわ。最高のお相手に感謝いたします'],
      seductive: ['準備してきたものを全部出せた。…最高の相手がいたから'],
    },
    emotional: {
      _default: ['あの試合のこと思い出すだけで…っ。ごめんなさい、涙が…最高でした…！'],
      ojousama: ['思い出すだけで…こんな…お相手に、心から…感謝を…っ'],
      delinquent: ['ちくしょう…あの試合思い出したら…目から汗が…最高だったよ…！'],
    },
  },
  mvp: {
    normal: {
      _default: ['一年間、逃げなかった。それだけは胸を張れます', '苦しい試合もあった。でも全部、今のわたしを作ってくれた'],
      ojousama: ['一年を通して成長できましたこと、皆さまのおかげですわ'],
      delinquent: ['一年間ずっと全力だった。手抜いた日なんか一日もねえよ'],
      seductive: ['一年間ずっと見ていてくれたでしょう？ …ちゃんと応えたわ'],
    },
    bold: {
      _default: ['誰よりも強かった。数字がそう言ってる。来年も同じだ', 'この一年、負ける気がしなかった。全試合がそれを証明してる'],
      ojousama: ['わたくしが最も輝いた一年でしたわ。異論のある方はリングでお待ちしています'],
      delinquent: ['一番強かったのはあたしだ。文句あるなら来いよ'],
      cool: ['…結果が語っている'],
      seductive: ['一番になるべくしてなった。当然でしょう？ …でも、まだ満足してないわ'],
    },
    quiet: {
      _default: ['……一試合、一試合。それだけをやった'],
      cool: ['…積み重ねの結果だ'],
      polite: ['…目の前のことに集中しただけです'],
    },
    shy: {
      _default: ['MVPなんて…周りの人が強くしてくれただけで…。でも、嬉しいです'],
      ojousama: ['わ、わたくしがMVPですの…？ 周りの方々に支えられただけですわ…'],
      delinquent: ['MVP？ あたしが？ いや…みんなが強くしてくれたんだよ…'],
    },
    easygoing: {
      _default: ['MVP！ 人生で一番カッコいい三文字もらっちゃった！', 'いやーこの一年楽しかったなー。楽しんでたらMVPになってた！'],
      delinquent: ['うおお！ MVP！ 一番いい響きだぜこれ！'],
      seductive: ['最優秀選手ですって。…似合うと思わない？'],
    },
    earnest: {
      _default: ['毎日の練習が無駄じゃなかった。でもこれがゴールじゃない', 'この賞は自分だけのものじゃない。一緒に戦ってくれた全員のものだ'],
      polite: ['日々の積み重ねが実を結びました。来年も変わらず精進します'],
      ojousama: ['弛まぬ努力の賜物ですわ。来年も精進を続けますの'],
      seductive: ['積み重ねてきたものが実った。…でも、ここで止まるつもりはないわ'],
    },
    emotional: {
      _default: ['一年間…苦しくて…でも…全部やってきてよかった…っ！ ありがとう…！'],
      ojousama: ['一年間…辛いことも…嬉しいことも…全部…っ、報われましたわ…！'],
      delinquent: ['くそっ…泣くな泣くな…。一年間…全部出し切った…それだけだ…！'],
    },
  },
  champion: {
    normal: {
      _default: ['このベルトの重さを、毎日感じている。だから強くなれる', 'チャンピオンであることは誇りだ。逃げずに守り抜く'],
      ojousama: ['この王座をお預かりしている限り、最高の試合をお約束いたしますわ'],
      delinquent: ['このベルト欲しいやつ、いくらでもかかってこい。全員叩き返す'],
      seductive: ['この輝き、よく似合うでしょう？ 欲しいなら…奪いに来なさい'],
    },
    bold: {
      _default: ['最強の証明。これがわたしだ', '挑戦者は何人でも来い。結果は変わらない'],
      ojousama: ['この王座はわたくしに最もふさわしい。それを証明し続けますわ'],
      delinquent: ['最強はあたしだ。証拠がここにある。文句は拳で言いに来い'],
      cool: ['…この景色は渡さない'],
      seductive: ['頂点からの景色は最高よ。…あなたには見せてあげないけど'],
    },
    quiet: {
      _default: ['……この重さを、背負い続ける'],
      cool: ['…まだ降りない'],
      polite: ['…この責任、全うします'],
    },
    shy: {
      _default: ['チャンピオンのわたしって…まだ慣れなくて。でもベルトが重い分、逃げちゃいけないって…'],
      ojousama: ['チャンピオンだなんて…まだ信じられませんわ。でもこのベルトに恥じないように…'],
      delinquent: ['あたしがチャンピオン…似合わねえかもだけど…でも渡さねえ…'],
    },
    easygoing: {
      _default: ['チャンピオンって肩書き、なんかくすぐったいけど最高だね！'],
      delinquent: ['チャンピオンの響き、たまんねえな！ もっと楽しむぜ！'],
      seductive: ['チャンピオン。いい響きね。似合うでしょう？'],
    },
    earnest: {
      _default: ['チャンピオンの名に恥じない試合を、毎回見せる。それが自分との約束だ', 'ひとつひとつの防衛戦に全力を注ぐ。それだけが王者の務めだ'],
      polite: ['王者としての責任を全うします。毎試合、最高の試合をお届けします'],
      ojousama: ['どの試合にも全身全霊を注ぎますわ。それがわたくしの矜持です'],
      seductive: ['王者としての誇り、毎試合で証明する。見ていてくれるかしら'],
    },
    emotional: {
      _default: ['このベルトに…どれだけの想いが詰まってるか…っ。絶対、手放さない…！'],
      ojousama: ['このベルトが…こんなに重くて…こんなに温かいなんて…っ'],
      delinquent: ['このベルト…命懸けで獲ったんだ…！ 絶対…誰にも渡さねえ…！'],
    },
  },
  hallOfFame: {
    normal: {
      _default: ['後悔はない。一試合も。…プロレスに出会えて、本当によかった', 'このリングで過ごした時間が、わたしの全てです'],
      ojousama: ['華やかな舞台から降りる日が来ましたわ。…でも、この業界に入って一度も後悔したことはございません'],
      delinquent: ['まさかこんな名誉あるもんもらえる日が来るとはな…。全部、リングがくれたもんだ'],
      seductive: ['素敵な花道を用意してくれるのね。…ありがとう。最高の舞台だったわ'],
    },
    bold: {
      _default: ['全盛期はいつかと聞かれたら、「全部だ」と答える', 'やり残したことは何もない。だからこの場に立てる'],
      ojousama: ['わたくしの名が歴史に刻まれる。…ふさわしいと、自分で思えますわ'],
      delinquent: ['やりたい放題やって、全部勝ち取った。最高の人生だ'],
      cool: ['…全てやった。悔いはない'],
      seductive: ['最高の舞台で、最高の人生だった。…最後まで美しかったでしょう？'],
    },
    quiet: {
      _default: ['……ありがとう。この場所が、わたしの全部だった'],
      cool: ['…悔いはない。…ありがとう'],
      polite: ['…長い間、ありがとうございました。幸せでした'],
    },
    shy: {
      _default: ['こんなわたしが殿堂に…。でも…ここに立てて…嬉しい。本当に嬉しいです'],
      ojousama: ['殿堂だなんて…わたくしなんかが…。でも…光栄ですわ…本当に'],
      delinquent: ['殿堂…？ あたしが…？ …似合わねえけど…嬉しいよ…ありがとな'],
    },
    easygoing: {
      _default: ['いやー楽しかった！ 全部ひっくるめて、最高の人生！ ありがとね！', 'プロレスに出会えてよかった！ 毎日が冒険みたいだったよ！'],
      delinquent: ['最っ高に楽しい人生だったぜ！ みんなありがとな！ プロレス最高！'],
      seductive: ['楽しい日々だったわ。全部、宝物。…ありがとう'],
    },
    earnest: {
      _default: ['後輩たちへ。リングの上に答えがある。苦しくても立ち続けろ。必ず報われる', 'この業界に全てを捧げた。…後輩たちがもっと高い場所に行ってくれるなら、それが一番嬉しい'],
      polite: ['後輩の皆さん。リングに真実があります。どうか、立ち続けてください'],
      ojousama: ['後輩の皆さまへ。わたくしが歩んだ道を、どうか超えていってくださいまし'],
      seductive: ['後輩たちへ。この世界には、努力した人だけが見える景色があるわ。…信じて'],
    },
    emotional: {
      _default: ['プロレスが…わたしの居場所だった…。ここで出会えた人たちが…全部…宝物で…っ！'],
      ojousama: ['こんな日が来るなんて…わたくし…皆さまに支えられて…っ、幸せでしたわ…！'],
      delinquent: ['ちくしょう…泣くなっつってんだろ…。みんな…ありがとう…本当に…くそ…！'],
    },
  },
};

// ══════════════════════════════════════════════
//  v1.8: 成長イベントシステム セリフ & テンプレート
// ══════════════════════════════════════════════

// §2.6a ブレイクスルー兆し — 試合中のモノローグ（personality別）
const BT_HINT_LINES = {
  normal: {
    _default: ['（…体が軽い。いつもと、何かが違う——）', '（…動ける。まだ、動ける——）'],
    ojousama: ['（…お体が軽いですわ。何かが変わりましたの——）'],
    delinquent: ['（…なんだ、この感覚。体が勝手に動きやがる——）'],
  },
  bold: {
    _default: ['（…体が勝手に動く。これが、あたしの限界の先——）', '（…見えた。次の一手が、はっきりと——）'],
    cool: ['（…限界の、その先——）'],
    delinquent: ['（…体が勝手に動きやがる。これが限界の先かよ——）'],
  },
  quiet: {
    _default: ['（…見える。次の一手が、はっきりと）', '（…体が、勝手に動いている——）'],
    cool: ['（——見えた）'],
  },
  easygoing: {
    _default: ['（…あれ？ なんか今日、すっごく調子いいかも——）', '（…体が軽い。いつもと全然違う——）'],
  },
  earnest: {
    _default: ['（…あの練習が、今、実を結ぼうとしている——）', '（…わかる。体が覚えている。次の一手——）'],
    polite: ['（…あのお稽古が、今、実を結ぼうとしている——）'],
  },
  emotional: {
    _default: ['（…わたしの体、こんなに動けたんだ——！）', '（…すごい。体が勝手に。止まらない——）'],
  },
};

// §2.6b ブレークスルーセリフ（personality×archetype）
const BREAKTHROUGH_LINES = {
  normal: {
    _default: ['あの試合で、何かが変わった気がする…', '限界だと思っていた壁を越えられた！'],
    ojousama: ['何かが変わった気がいたしますわ…壁を越えましたの'],
    delinquent: ['おっしゃ！ なんか壁越えた気がするぜ！'],
    seductive: ['あら…何かが変わった気がするわ'],
  },
  bold: {
    _default: ['当然だ。まだまだこんなもんじゃない', 'やっと体が追いついてきた。ここからだ'],
    ojousama: ['当然ですわ。まだまだこんなものではありませんの'],
    delinquent: ['当然だろ！ まだまだこんなもんじゃねーぜ！'],
    cool: ['…まだ上がある'],
    seductive: ['当然よ。まだまだこんなものじゃないわ'],
  },
  quiet: {
    _default: ['……何かが、変わった'],
    cool: ['…変わった'],
    polite: ['…何かが変わった気がします'],
  },
  shy: {
    _default: ['え…わたし、こんなに動けたんですか…？'],
  },
  easygoing: {
    _default: ['おっ、なんかいつもと違う！ いい感じ！'],
    delinquent: ['おお！ なんかいつもと違うぜ！ いい感じ！'],
    seductive: ['あら、いつもと違う感じ。いいわね'],
  },
  earnest: {
    _default: ['練習が実を結んだ…！ まだ上を目指す', 'あの敗北が…私を強くしてくれた'],
    polite: ['練習が実を結びました…！ まだ上を目指します'],
    ojousama: ['お稽古の成果ですわ…！ まだまだ上を目指しますわ'],
    seductive: ['練習が実を結んだわ…まだ上を目指すわよ'],
  },
  emotional: {
    _default: ['うわぁ…！ 体が軽い！ すごい、すごい…！', '限界なんてなかった…！ まだ上があった…！'],
  },
};

// personality×archetype セリフ配列取得（Engine用: 呼び出し元でRNG選択可能）
function getDialoguePool(lineObj, fighter) {
  const p = fighter?.personality || 'normal';
  const a = fighter?.archetype || 'normal';
  const pBucket = lineObj[p] || lineObj._default || lineObj.normal;
  if (!pBucket) return ['…'];
  return pBucket[a] || pBucket._default || ['…'];
}

// personality×archetype セリフランダム選出（UI用）
function pickDialogueLine(lineObj, fighter) {
  const pool = getDialoguePool(lineObj, fighter);
  return pool[Math.floor(Math.random() * pool.length)];
}

// §4.5 スランプ発生セリフ（personality×archetype, トリガー別）
const SLUMP_START_LINES = {
  defeat: {
    normal: {
      _default: ['あの負けから…何かがおかしい', '自分の何が悪かったのか、わからない'],
      ojousama: ['あの敗北から…何かがおかしいですわ'],
      delinquent: ['あの負けから…何かおかしいんだよ'],
      seductive: ['あの負けから…何かがおかしいの'],
    },
    bold: {
      _default: ['…チッ、何やってんだあたし', '負けた？ あたしが？ …嘘だろ'],
      ojousama: ['…何をしていますの、わたくし'],
      delinquent: ['…チッ、何やってんだよあたし'],
      cool: ['……何をやっている'],
      seductive: ['あら…おかしいわね、こんなはずじゃ'],
    },
    quiet: {
      _default: ['……あの負けから、動けない'],
      cool: ['…動けない'],
      polite: ['…あの試合から、うまく動けなくて'],
    },
    shy: {
      _default: ['やっぱり…私なんかじゃ、ダメなんでしょうか…'],
    },
    easygoing: {
      _default: ['あはは…なんだろうね、体が動かないや'],
      delinquent: ['なんだろうな…いつもみたいに動かねーよ'],
      seductive: ['ふふ…なんでかしら、いつもみたいに動けないの'],
    },
    earnest: {
      _default: ['あの負け…自分の何がダメだったんだろう', '負けた理由がわかるまで…前に進めない'],
      polite: ['あの試合から…自分の何が足りないのか、ずっと考えています'],
      ojousama: ['あの敗北…わたくしの何がいけませんでしたの'],
      seductive: ['あの負けから…ずっと考えてるの、何がいけなかったのかって'],
    },
    emotional: {
      _default: ['負けた…もう何も考えられない…っ', '…悔しい、悔しくて頭がぐちゃぐちゃになる…！'],
    },
  },
  injury_moderate_recovery: {
    normal: {
      _default: ['体は治ったはずなのに…動けない', '復帰したのに、何かが噛み合わない'],
      ojousama: ['お体は治りましたのに…動けませんの'],
      delinquent: ['体は治ったはずだろ…なんで動けねーんだ'],
      seductive: ['体は治ったはずなのに…ね、動けないの'],
    },
    bold: {
      _default: ['治ったはずだ…なのに何でこんなにもたつく'],
      ojousama: ['治りましたのに…なぜこんなにもたつきますの'],
      delinquent: ['治ったっつーのに…何でもたついてんだ'],
      cool: ['…体が、鈍い'],
      seductive: ['治ったはずなのに…おかしいわね'],
    },
    quiet: {
      _default: ['……体は治った。でも、何か違う'],
      cool: ['……鈍い'],
      polite: ['体は治ったんですけど…何か、違うんです'],
    },
    shy: {
      _default: ['体は治ったのに…また迷惑かけちゃうかも…'],
    },
    easygoing: {
      _default: ['あれー、治ったはずなのに調子出ないなぁ'],
      delinquent: ['あれ、治ったはずなのに調子でねーな'],
      seductive: ['あら、治ったはずなのに…調子出ないわ'],
    },
    earnest: {
      _default: ['復帰できたのに…まだ全然足りない'],
      polite: ['復帰できたのですが…まだ全然、足りていません'],
      ojousama: ['復帰できましたのに…まだまだ足りませんわ'],
      seductive: ['復帰できたのに…まだ足りないの'],
    },
    emotional: {
      _default: ['せっかく治ったのに…なんで、なんで動けないの…！'],
    },
  },
  injury_severe_recovery: {
    normal: {
      _default: ['またリングに立てた…のに、怖い', '重傷から帰ってきたけど…自信がない'],
      ojousama: ['リングに戻れましたのに…怖いですわ'],
      delinquent: ['戻ってきたのに…ビビってんのかよ、あたし'],
      seductive: ['戻ってこれたのに…怖いの'],
    },
    bold: {
      _default: ['あたしが…怯えてる？ そんなバカな'],
      ojousama: ['わたくしが…怯える？ そんなはずは'],
      delinquent: ['あたしがビビってる？ ふざけんな'],
      cool: ['…怯えている。この私が'],
      seductive: ['私が…怯えてる？ 嘘でしょう'],
    },
    quiet: {
      _default: ['……リングが、遠い'],
      cool: ['…遠い'],
      polite: ['リングに戻れたのですが…遠く感じます'],
    },
    shy: {
      _default: ['戻ってこれたけど…また壊れたらって思うと…怖いです'],
    },
    easygoing: {
      _default: ['あはは…参ったな、リングがちょっと怖いや'],
      delinquent: ['まいったな…リングがちょっと怖ぇーよ'],
      seductive: ['参ったわ…リングが少し怖いの'],
    },
    earnest: {
      _default: ['復帰できた…でも体が覚えてる、あの痛みを'],
      polite: ['復帰できました…でも体が覚えているんです、あの痛みを'],
      ojousama: ['復帰できましたわ…でもお体が覚えていますの、あの痛みを'],
      seductive: ['復帰できた…でもね、体が覚えてるの、あの痛みを'],
    },
    emotional: {
      _default: ['帰ってこれた…のに…っ、怖くて体が震える…！'],
    },
  },
  penalty_end: {
    normal: {
      _default: ['怪我は治ったのに…気力が戻らない', '体が癒えても、心の傷は残るんだな'],
      ojousama: ['お怪我は癒えましたのに…気力が戻りませんわ'],
      delinquent: ['怪我は治ったっつーのに…気力が戻んねー'],
      seductive: ['怪我は治ったのに…気力が戻らないの'],
    },
    bold: {
      _default: ['体は万全なのに…気持ちがついてこない'],
      ojousama: ['お体は万全ですのに…気持ちがついてきませんわ'],
      delinquent: ['体は万全なのに…気持ちがついてこねー'],
      cool: ['…気持ちが、ついてこない'],
      seductive: ['体は万全なのに…気持ちがついてこないの'],
    },
    quiet: {
      _default: ['……治った。でも、心は'],
      cool: ['…心が、まだ'],
      polite: ['体は治ったんですけど…心が、まだ'],
    },
    shy: {
      _default: ['怪我は治ったんですけど…また怪我したらって思うと…'],
    },
    easygoing: {
      _default: ['怪我は治ったんだけどなぁ…なんか気分が乗らない'],
      delinquent: ['怪我は治ったんだけどな…なんか乗んねーわ'],
      seductive: ['怪我は治ったんだけど…なんだか気分が乗らないの'],
    },
    earnest: {
      _default: ['怪我は治った。でも離れていた時間が…重い'],
      polite: ['怪我は治りました。でも離れていた時間が…重いです'],
      ojousama: ['お怪我は癒えましたわ。でも離れていた時間が…重いですの'],
      seductive: ['怪我は治ったわ。でもね、離れていた時間が…重いの'],
    },
    emotional: {
      _default: ['治ったはずなのに…なんでこんなに不安なの…！'],
    },
  },
};

// §4.5 スランプ回復セリフ（personality×archetype）
const SLUMP_END_LINES = {
  normal: {
    _default: ['やっと…やっと戻ってこれた', 'あの暗いトンネルをようやく抜けた'],
    ojousama: ['ようやく…戻ってこれましたわ'],
    delinquent: ['やっと…やっと戻ってこれたぜ'],
    seductive: ['やっと…戻ってこれたわ'],
  },
  bold: {
    _default: ['待たせたな。ここからが本番だ'],
    ojousama: ['お待たせしましたわ。ここからですのよ'],
    delinquent: ['待たせたな！ ここからだぜ！'],
    cool: ['…戻った。ここからだ'],
    seductive: ['お待たせ。ここからが本番よ'],
  },
  quiet: {
    _default: ['……戻ってきた'],
    cool: ['……戻った'],
    polite: ['…戻ってこれました'],
  },
  shy: {
    _default: ['まだ不安ですけど…頑張りたいです'],
  },
  easygoing: {
    _default: ['いやー長かった！ でもまた楽しくなってきたよ'],
    delinquent: ['いやー長かったな！ でもまた楽しくなってきたぜ'],
    seductive: ['長かったわ。でもまた楽しくなってきたの'],
  },
  earnest: {
    _default: ['迷惑かけた分…倍にして返す', '待ってくれていたリングに、恩返しする'],
    polite: ['ご迷惑をおかけしました…必ず、倍にしてお返しします'],
    ojousama: ['ご迷惑をおかけしましたわ…必ずお返しいたします'],
    seductive: ['迷惑かけた分…返すわ、倍にしてね'],
  },
  emotional: {
    _default: ['うっ…やっと、やっと抜け出せた…！ もう負けない…！'],
  },
};

// §5.6 モチベ喪失セリフ（personality×archetype）
const MOTIVATION_LOSS_LINES = {
  normal: {
    _default: ['もう…何のために闘ってるのかわからない', 'プロレスが楽しいって感覚、どこへ行った？'],
    ojousama: ['何のために…闘っていますの、わたくし'],
    delinquent: ['何のために闘ってんだよ…もうわかんねー'],
    seductive: ['何のために闘ってるのかしら…わからなくなったわ'],
  },
  bold: {
    _default: ['…燃えない。何をやっても、燃えてこない'],
    ojousama: ['…燃えませんわ。何をしても、火がつきませんの'],
    delinquent: ['…燃えねーんだよ。何やっても、火がつかねー'],
    cool: ['…燃えない'],
    seductive: ['燃えないの…何をしても、火がつかないわ'],
  },
  quiet: {
    _default: ['……闘う理由が、見えない'],
    cool: ['……見えない'],
    polite: ['…闘う理由が、見えなくなってしまって'],
  },
  shy: {
    _default: ['私がリングに立つ意味…あるんでしょうか…'],
  },
  easygoing: {
    _default: ['なんだろうね…プロレス楽しいって感覚、どこ行っちゃったんだろ'],
    delinquent: ['なんだろうな…楽しいって感覚、どこ行っちまったんだ'],
    seductive: ['どうしたのかしら…楽しいって感覚、どこかに行っちゃったわ'],
  },
  earnest: {
    _default: ['毎日道場に来るのが…こんなに辛いなんて', '自分を追い込んでも…何も返ってこない'],
    polite: ['毎日道場に来るのが…こんなに辛いとは思いませんでした'],
    ojousama: ['毎日お稽古に通うのが…こんなに辛いとは'],
    seductive: ['毎日道場に来るのが…こんなに辛いなんてね'],
  },
  emotional: {
    _default: ['やだ…もう嫌…何もしたくない…！', '…なんで泣いてるんだろ、あたし…'],
  },
};

// §5.6 モチベ喪失回復セリフ（personality×archetype）
const MOTIVATION_RECOVERY_LINES = {
  normal: {
    _default: ['まだ…やれる。やってみせる', 'また闘いたいと思えた。この気持ちを大切に'],
    ojousama: ['まだ…やれますわ。やって見せますの'],
    delinquent: ['まだやれる…やってやるよ'],
    seductive: ['まだやれるわ…やってみせる'],
  },
  bold: {
    _default: ['目が覚めた。ここで終わるわけにはいかない'],
    ojousama: ['目が覚めましたわ。ここで終わるわけにはいきませんもの'],
    delinquent: ['目ぇ覚めたぜ。ここで終わるかよ'],
    cool: ['…目が覚めた。まだ終わらない'],
    seductive: ['目が覚めたわ。ここで終わるなんて、つまらないもの'],
  },
  quiet: {
    _default: ['……もう一度、闘える'],
    cool: ['…闘える'],
    polite: ['…もう一度、闘えそうです'],
  },
  shy: {
    _default: ['まだ自信はないですけど…もう少しだけ、頑張ってみます'],
  },
  easygoing: {
    _default: ['よーし、またやる気出てきたぞ！ 楽しまなきゃね'],
    delinquent: ['おっし、やる気出てきたぜ！ 楽しまねーとな'],
    seductive: ['あら、やる気が戻ってきたわ。楽しまなくちゃね'],
  },
  earnest: {
    _default: ['闘うことを忘れていた…でも、もう迷わない'],
    polite: ['闘う気持ちを忘れていました…でも、もう迷いません'],
    ojousama: ['闘う心を忘れていましたわ…でも、もう迷いませんの'],
    seductive: ['闘う気持ちを忘れてたわ…でもね、もう迷わない'],
  },
  emotional: {
    _default: ['うっ…また闘いたいって…思えたよ…！ 大丈夫、もう大丈夫…！'],
  },
};

// §9.4 AI成長イベント業界ニューステンプレート（ブレークスルー）
const AI_BREAKTHROUGH_NEWS = [
  '📰 週刊女子プロレス — 「{org}の{name}、覚醒！ {stat}が急成長」',
  '📰 月刊プロレスマガジン — 「衝撃！ {name}のブレークスルーに業界騒然」',
  '📰 スポーツ報知 — 「{org}の{name}、別人のような成長を見せる」',
  '📰 プロレス通信 — 「{name}に転機。このまま上位へ食い込むか」',
  '📰 格闘技WEEKLY — 「{org}の新星{name}、急激な進化で注目を集める」',
  '📰 プロレス新聞 — 「{org}・{name}が急成長。ライバル団体に激震」',
];

// §9.4 AI成長イベント業界ニュース（スランプ）
const AI_SLUMP_NEWS = [
  '📰 週刊女子プロレス — 「{org}の{name}、不調が深刻化。今シーズンは精彩を欠く」',
  '📰 月刊プロレスマガジン — 「{name}にスランプの影。{org}に暗雲」',
  '📰 スポーツ報知 — 「{name}の低迷が続く。{org}の影響は？」',
  '📰 プロレス通信 — 「波乱のシーズン。{org}の{name}が精彩を欠く」',
];

// §9.4 AI成長イベント業界ニュース（モチベ喪失）
const AI_MOTIVATION_LOSS_NEWS = [
  '📰 週刊女子プロレス — 「{org}の{name}、モチベーション喪失か。練習にも姿を見せず」',
  '📰 スポーツ報知 — 「{name}の引退危機？ {org}関係者が明かす深刻な状況」',
  '📰 月刊プロレスマガジン — 「{name}の去就に注目。{org}の今後は」',
  '📰 格闘技WEEKLY — 「まさかの失速。{org}の{name}に何が？」',
];

// §2.6 ブレークスルーSEノート（Audio.playで使用）
// 'breakthrough' キーを Audio に追加する（app.js側で対応）

// ══════════════════════════════════════════════
//  v1.4w: 世界観演出 ニューステンプレート
// ══════════════════════════════════════════════

// §6.1 ティッカー用テンプレート（カテゴリ別・各5+パターン）
const NEWS_TICKER_TEMPLATES = {
  aiShow: [
    '◆ {org}、今週も安定した集客で興行を成功させた',
    '◆ {org}の興行が盛況。地元ファンの支持は厚い',
    '◆ {org}が堅実な興行運営。観客の満足度も上々とのこと',
    '◆ {org}の今週の興行は好評。会場には熱気が充満していた',
    '◆ {org}、地域密着型の興行でファン層を着実に広げている',
  ],
  winStreak: [
    '◆ {name}が{count}連勝中！ 絶好調の波に乗っている',
    '◆ 快進撃の{name}、{count}連勝で勢いが止まらない',
    '◆ {name}の連勝が{count}に到達。次の対戦相手は戦々恐々か',
    '◆ 止まらない{name}！ {count}連勝で注目度が急上昇',
    '◆ {name}が{count}連勝。充実した練習の成果が出ている',
  ],
  loseStreak: [
    '◆ {name}に元気がない…{count}連敗にファンから心配の声',
    '◆ {name}の不調が続く。{count}連敗で表情にも陰りが',
    '◆ {name}が{count}連敗中。調子を取り戻すきっかけが欲しいところ',
    '◆ {name}の連敗が止まらない。周囲のサポートが鍵になりそう',
    '◆ {name}が苦しい時期を過ごしている。{count}連敗でも腐らない姿勢にファンはエールを送る',
  ],
  aiAce: [
    '◆ {org}の{name}が好調を維持。エースとしての存在感を発揮',
    '◆ {name}が{org}を牽引中。対戦を望む声が各団体から上がっている',
    '◆ {org}の{name}に注目が集まる。実力は業界屈指との評判',
    '◆ {name}の充実ぶりが話題に。{org}の大黒柱は健在',
    '◆ {org}の看板選手{name}、練習での仕上がりが抜群とのこと',
  ],
  flavor: [
    '◆ {name}が仕事帰りのトレーニング姿をSNSに投稿。ファンが反応',
    '◆ {name}が地元のイベントでファンと交流。笑顔で写真撮影に応じていた',
    '◆ {name}と{name2}が偶然カフェで遭遇。意外な組み合わせにファンが沸く',
    '◆ {name}の本業での活躍ぶりも話題に。「文武両道」とファンが称賛',
    '◆ {name}と{name2}が合同トレーニング。団体の垣根を越えた交流が注目される',
    '◆ {name}が休日の過ごし方を公開。オフの素顔にファンがほっこり',
  ],
  injury: [
    '◆ {org}の{name}がトレーニング中に負傷か。詳細は未発表',
    '◆ {name}の出場が危ぶまれる。{org}の今後のカード編成に影響も',
    '◆ {org}・{name}の負傷情報。復帰時期は未定とのこと',
    '◆ {name}にアクシデント。{org}は代役の検討を迫られる',
    '◆ {org}の{name}が離脱。早期復帰を願う声がSNSに溢れている',
  ],
  scout: [
    '◆ 地元のアマチュア大会で将来有望な選手が目撃されたとの情報',
    '◆ 各団体のスカウトが活発化。フリーの実力者を巡る争奪戦の気配',
    '◆ 異業種から転身した新人が話題に。ポテンシャルは未知数',
    '◆ 地域のレスリング教室出身者に注目が集まっている',
    '◆ フリーで活動中の選手に複数団体がオファーを出しているとの噂',
  ],
  economyGood: [
    '◆ {org}の経営が好調。スポンサー契約も順調に増えている',
    '◆ {org}のグッズ売上が伸びている。人気選手のタオルが品薄に',
    '◆ {org}が新しいスポンサーを獲得。資金面に余裕が生まれそう',
    '◆ {org}の興行収入が安定。地域からの協賛も増加傾向',
    '◆ {org}が練習施設を拡充。選手からも好評の声',
  ],
  economyStruggle: [
    '◆ {org}の集客がやや伸び悩み。新たなファン開拓が課題か',
    '◆ {org}の経営陣がテコ入れ策を検討中との報道',
    '◆ {org}が経費削減に取り組んでいるとの噂。厳しい台所事情か',
    '◆ {org}の観客動員が課題に。魅力的なカード作りで巻き返しを図る',
    '◆ {org}、限られた予算の中で奮闘中。選手の頑張りが支え',
  ],
  rivalryActive: [
    '◆ {name1}と{name2}の間にただならぬ空気が漂っている',
    '◆ {name1} vs {name2}の因縁が深まっている。次の直接対決に注目',
    '◆ {name1}が{name2}について意味深なコメント。火花が散る予感',
    '◆ {name1}と{name2}のライバル関係にファンが熱視線を送っている',
    '◆ {name1} vs {name2}の再戦を望むファンの声がSNSで増加中',
  ],
  rivalryGoodRival: [
    '◆ {name1}と{name2}の名勝負が今も語り草になっている',
    '◆ {name1}と{name2}——好敵手同士の再戦を望む声は根強い',
    '◆ {name1}と{name2}の物語は終わっても、ファンの記憶には鮮やかに残る',
    '◆ 「{name1} vs {name2}をもう一度」——ファン投票で再戦希望が上位に',
    '◆ {name1}と{name2}、練習場ですれ違うと自然に笑顔になるという',
  ],
  champion: [
    '◆ 王者{name}に挑戦者候補が続々。次の防衛戦の相手は誰だ',
    '◆ {name}の王座に虎視眈々と狙いを定める選手たち',
    '◆ 王者{name}、練習での仕上がりは万全とのこと',
    '◆ {name}の次の防衛戦に注目が集まっている',
    '◆ 王者{name}が「どんな挑戦者でも受けて立つ」と堂々のコメント',
  ],
  championLongReign: [
    '◆ {name}の長期政権が続く。{defenses}度の防衛は伊達ではない',
    '◆ 絶対王者{name}、{defenses}回防衛の実績に業界も脱帽',
    '◆ {name}の王座はもはや鉄壁。{defenses}度防衛の壁を越える者は現れるか',
    '◆ {name}の安定感が際立つ。王者として{defenses}回の防衛を重ねた風格',
    '◆ 「{name}時代」と呼ぶ声も。{defenses}回防衛の偉業は続く',
  ],
  general: [
    '◆ 今週末の大会に向けてSNSでの話題が盛り上がりを見せている',
    '◆ レスリング関連グッズの売上が堅調。推し選手のタオルが人気',
    '◆ 地域のスポーツ施設でレスリング教室の申込が増加傾向',
    '◆ 人気選手の得意技を真似する人がジムで増えているとか',
    '◆ 各団体の試合ハイライト動画の再生数が伸びている',
    '◆ レスリング保険の加入者数が前年比で増加。安全意識の高まりか',
  ],
};

// §6.2 新聞パネル用テンプレート（イベント種別ごとに headline + body ペア、各3+パターン）
const NEWS_HEADLINE_TEMPLATES = {
  titleChange: [
    { headline: '激震！{org}の王座が動いた！{name}が新王者に',
      body: '{org}のタイトルマッチで大波乱。{prevChamp}を破った{name}が新チャンピオンの座に就いた。新王者の時代は長く続くのか、それとも――' },
    { headline: '王座交代！{name}が{org}の頂点を奪取',
      body: '壮絶な一戦の末、{name}が新チャンピオンに。敗れた{prevChamp}は「次こそ」とリベンジを誓った。{org}の新時代が始まる。' },
    { headline: '{org}に新女王誕生。{name}が王座を戴冠',
      body: '{prevChamp}の牙城を崩した{name}。ファンの歓声が会場を包む中、新王者は「ここからがスタート」と力強く宣言した。' },
  ],
  defenseRecord: [
    { headline: '盤石！{name}、{count}度目の防衛に成功。王座を脅かす者はいるのか',
      body: '{org}の{name}が{count}回目のタイトル防衛を達成。この安定感は驚異的だ。次の挑戦者にとって、越えるべき壁はさらに高くなった。' },
    { headline: '伝説へ――{name}、前人未到の{count}回防衛',
      body: '{org}の{name}が{count}回防衛という金字塔を打ち立てた。その強さに対戦者も脱帽。「もはや別格」と業界関係者も舌を巻く。' },
    { headline: 'もはや神話。{name}の王座は誰にも止められない',
      body: '{count}回防衛――この数字が全てを物語る。{org}の{name}は最早歴史の一部。挑む者全てを退ける絶対王者は、孤高の頂に立ち続ける。' },
  ],
  breakthrough: [
    { headline: '新星爆誕！{name}が覚醒、一夜にして別人に',
      body: '{org}の{name}が驚くべき成長を見せた。{detail}。業界関係者も「この選手は化ける」と太鼓判。今後の活躍から目が離せない。' },
    { headline: '{name}にブレークスルー。{org}の新たな武器に',
      body: '地道な努力がついに実を結んだ。{org}の{name}が{detail}。「自分でも驚いている」と本人。チームの戦力が一段上がった。' },
    { headline: '覚醒の{name}！ {org}に嬉しい誤算',
      body: '期待以上の急成長を遂げた{name}。{detail}。{org}のファンからは「ウチのエースはこの子だ」と歓喜の声が上がっている。' },
  ],
  slump: [
    { headline: '心配される{name}の不調…いつになったら復活？',
      body: '{org}の{name}がスランプに陥っている。練習でも精彩を欠き、周囲も心配顔。「本人が一番苦しんでいる」とチームメイトは語る。' },
    { headline: '{name}に暗雲。{org}の戦力に影響か',
      body: '{org}の主力{name}の調子が上がらない。ファンからは激励の声が寄せられるが、復活の兆しはまだ見えない。' },
    { headline: '{org}の{name}、苦悩の日々。スランプはいつ明けるのか',
      body: 'かつての輝きを失った{name}。しかし周囲は信じている。「あの子は必ず戻ってくる」と{org}の仲間たちは口を揃える。' },
  ],
  motivationLoss: [
    { headline: '引退か――{name}から闘志が消えた？',
      body: '{org}の{name}にモチベーション喪失の噂。練習を欠席する日も増えたという。「あのギラギラしていた目が…」とファンも心配を隠せない。' },
    { headline: '{name}の去就に暗雲。{org}は引き留められるか',
      body: '{org}の{name}が闘志を失いつつあるという。関係者によると「プロレスが楽しくない」と漏らしているとか。復活を願う声が業界に広がる。' },
    { headline: '{org}の{name}、心ここにあらず。業界に衝撃',
      body: 'かつてリングを沸かせた{name}の目から光が消えた。「何のために戦っているかわからない」――その言葉にファンは言葉を失った。' },
  ],
  hallOfFame: [
    { headline: '栄光の殿堂入り！{name}の輝かしいキャリアを振り返る',
      body: 'タイトル{titles}回獲得、防衛{defenses}回。{name}の偉大なキャリアに、業界全体が敬意を表した。「プロレスに全てを捧げた」と受賞の言葉。' },
    { headline: '{name}、殿堂入り。伝説は永遠に刻まれた',
      body: '数々の名勝負を生んだ{name}が殿堂入り。「この業界で闘えて幸せだった」。会場はスタンディングオベーションに包まれた。' },
    { headline: '感動の殿堂入りセレモニー。{name}に万雷の拍手',
      body: '引退後もなおファンに愛される{name}。タイトル{titles}回、防衛{defenses}回の偉業。「後輩たちに道を繋げられたなら本望」と涙ながらに語った。' },
  ],
  retirement: [
    { headline: 'ありがとう{name}――リングに別れを告げた戦士',
      body: '{org}の{name}が現役を退いた。{detail}。「最後まで全力で闘えた」とリングを降りる姿に、ファンから惜別の涙が溢れた。' },
    { headline: '{name}、引退。{org}の一時代が終わる',
      body: '{org}を支えた{name}がリングを去った。{detail}。「この団体で闘えて幸せだった」――その言葉が全てを物語る。' },
    { headline: 'さようなら{name}。最後のゴングが鳴った',
      body: '長きにわたり{org}を背負った{name}が引退を決断。{detail}。「悔いはない」と穏やかな表情で語った姿が印象的だった。' },
  ],
  poachSuccess: [
    { headline: '電撃移籍！{name}が{toOrg}に加入。{fromOrg}は大打撃か',
      body: '{fromOrg}の{name}が{toOrg}への移籍を決断。OVR{ovr}の実力者の流出に{fromOrg}関係者は衝撃を隠せない。「新天地で自分を試したい」と{name}。' },
    { headline: '{name}が移籍。{toOrg}の戦力強化なるか',
      body: '{fromOrg}から{toOrg}へ――{name}の電撃移籍が決まった。「チャンスを掴みに行く」と語る{name}に、新たなファンの期待が集まる。' },
    { headline: '{toOrg}が{name}を獲得！ 補強の目玉に',
      body: '{toOrg}が{fromOrg}の{name}を引き抜きに成功。即戦力としてチームを底上げする見込み。「この移籍は大きい」と業界紙が一様に報じた。' },
  ],
};

// v1.4: ベストマッチ フレーバーテキスト（MQ帯別）
const BESTMATCH_FLAVOR = {
  high: [
    '歴史に残る名勝負',
    '会場が震えた一戦',
    'すべてを出し尽くした激闘'
  ],
  mid: [
    '観客を沸かせた好勝負',
    '互いの意地がぶつかり合った一戦',
    '技と力が交錯する見応えある試合'
  ],
  low: [
    '光るものを見せた一戦',
    '荒削りだが熱い闘い'
  ]
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 9: MILESTONE EVENTS (v1.5s25b)                  ║
// ╚══════════════════════════════════════════════════════════╝
const MILESTONE_EVENTS = [
  {
    id: 'first_show',
    trigger: { type: 'totalShows', value: 1 },
    title: '🎉 旗揚げ興行',
    narration: '記念すべき第一回興行が幕を閉じた。\n観客はまばらだったが、選手たちの目は確かに輝いていた。\nこの先、団体をどう導いていくか——',
    choices: [
      {
        label: '🏠 地元を地道に固めていく',
        effect: { type: 'weekly_funds', amount: 40, weeks: 3 },
        result: '地元の商店街が応援してくれることになった。',
        effectLabel: '補助金+40万/週（3週間）'
      },
      {
        label: '💪 選手の育成に力を入れる',
        effect: { type: 'training_boost', multiplier: 1.5, weeks: 4 },
        result: '選手たちの練習に、一層の熱が入り始めた。',
        effectLabel: '練習効率×1.5（4週間）'
      },
      {
        label: '📣 とにかく知名度を上げたい',
        effect: { type: 'attendance_boost', multiplier: 1.3, shows: 2 },
        result: 'チラシ配りにSNS、できることは全部やった。\n噂が少しずつ広がり始めている。',
        effectLabel: '次2興行の集客×1.3'
      }
    ]
  },
  {
    id: 'orgpop_20',
    trigger: { type: 'orgPop', value: 20 },
    title: '📰 地元で話題に',
    narration: '地元のスポーツ紙に団体の名前が載った。\n「あそこの興行、最近面白いらしいよ」\n——そんな声がちらほら聞こえ始めている。',
    choices: [
      {
        label: '🤝 ファンとの距離を縮める',
        effect: { type: 'promo_boost', amount: 1, weeks: 4 },
        result: 'ファン感謝デーを開催した。常連ファンの顔が少しずつ見えてきた。',
        effectLabel: 'プロモ効果+1（4週間）'
      },
      {
        label: '🎯 試合の質をもっと高める',
        effect: { type: 'mq_boost', amount: 2, weeks: 4 },
        result: '練習メニューを見直し、試合構成にもこだわり始めた。',
        effectLabel: '全試合MQ+2（4週間）'
      },
      {
        label: '🔍 新戦力の獲得を急ぐ',
        effect: { type: 'fa_discount', percent: 30 },
        result: '業界に顔が利く人物から、有望な選手の情報が入ってきた。',
        effectLabel: '次のFA獲得費用-30%'
      }
    ]
  },
  {
    id: 'first_rivalry',
    trigger: { type: 'first_rivalry' },
    title: '⚡ 因縁の芽生え',
    narration: null, // 動的生成（選手名を埋め込む）
    choices: [
      {
        label: '🔥 この対決をじっくり育てる',
        effect: { type: 'rivalry_boost', amount: 1 },
        result: 'ふたりの視線がリング上で交差するたび、会場の空気が変わる。',
        effectLabel: '因縁カウント+1'
      },
      {
        label: '⚔️ 熱いうちに大一番を組む',
        effect: { type: 'next_match_mq', amount: 5 },
        result: '次の対戦が、特別な一戦になる予感がする。',
        effectLabel: '次の対戦MQ+5'
      },
      {
        label: '🌐 他の組み合わせも試したい',
        effect: { type: 'rivalry_chance_up', weeks: 3 },
        result: 'いろんな選手をぶつけてみよう。化学反応はどこで起きるか分からない。',
        effectLabel: '因縁成立しやすくなる（3週間）'
      }
    ]
  }
];

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 10: EVENT SYSTEM v2.0 (event-system-spec-v2)    ║
// ╚══════════════════════════════════════════════════════════╝

// §3-3: 通知型イベントテキスト（N1〜N5）
// {name}, {name2} はプレースホルダ（実行時に選手名で置換）
// 各エントリ: { text: 見出し行, detail: 状況説明文 }
const NOTIF_EVENT_TEXTS = {
  N1: [
    { text: '💪 {name}が自主トレで手応えを掴んだ', detail: '{name}が誰もいない道場で汗を流していた。基礎をひとつひとつ確認しながら、何度も繰り返す姿が印象的だ。' },
    { text: '🌟 {name}の努力が実を結びつつある', detail: '毎朝の早出練習が続いている{name}。最近はスパーリング相手からも「動きが変わった」と言われることが増えてきた。' },
    { text: '✨ {name}が練習で目を引くプレーを見せた', detail: '今日の合同練習で、{name}が以前はできなかった動きを難なくこなしてみせた。コーチも思わず足を止めて見入っていた。' },
    { text: '📈 {name}の動きが明らかに良くなっている', detail: '先月の試合映像と見比べると、{name}の動作に無駄がなくなっているのが分かる。地道な積み重ねが形になってきた。' },
    { text: '🏋️ {name}がフィジカルトレーニングで成果を見せた', detail: '{name}が自主的に取り組んでいる体幹トレーニングの効果が出始めている。受け身の安定感が格段に上がった。' },
    { text: '🎯 {name}が技の精度を上げてきた', detail: '繰り返し練習してきた連携技が、{name}の体に馴染んできたようだ。実戦でも使えるレベルに仕上がりつつある。' },
  ],
  N2: [
    { text: '🤝 {name}と{name2}が練習後に話し込んでいた', detail: '練習が終わってもロッカールームを離れようとしない二人。お互いの技や試合のことを真剣に語り合っているようだった。' },
    { text: '💬 {name}が{name2}に技のコツを教えていた', detail: '練習後、{name}が{name2}の動きを見て自ら声をかけた。2時間近く付き合って、丁寧に手ほどきしていたそうだ。' },
    { text: '🌸 {name}と{name2}の仲が深まってきた', detail: '最近、{name}と{name2}がよく行動を共にしているのが目につく。ランチを一緒にとったり、移動中も話し合っていることが増えた。' },
    { text: '👊 {name}と{name2}が激しく語り合っていた', detail: 'プロレスの哲学について、{name}と{name2}が火花を散らすような議論を繰り広げた。二人とも目を輝かせていた。' },
    { text: '🍙 {name}と{name2}が一緒に食事をとっていた', detail: '練習後、{name}と{name2}が近所の定食屋で向かい合って談笑している姿が目撃された。チームの結束が深まっているようだ。' },
    { text: '🤜 {name}と{name2}が互いを高め合っている', detail: '{name}と{name2}が自主的にスパーリングを重ねている。好敵手として切磋琢磨する関係が生まれつつある。' },
  ],
  N3: [
    { text: '😓 {name}が少し疲れ気味のようだ…', detail: '試合が続いたせいか、{name}の動きにいつもの切れが見られない。練習後もすぐに休むことが多くなっている。' },
    { text: '🌡️ {name}のコンディションが優れない', detail: '{name}が今週の練習を短縮するよう申し出た。本人は「大丈夫」と言っているが、顔色が優れないのが気になる。' },
    { text: '💤 {name}の練習に覇気がない日があった', detail: '今日の{name}はルーティンをこなしているだけといった印象で、いつもの集中力がなかった。疲れか、それとも悩みがあるのか。' },
    { text: '😔 {name}が練習量を落としているようだ', detail: '先月と比べると、{name}の練習時間が目に見えて減っている。怪我を抱えているわけではないだけに、少し心配だ。' },
    { text: '😩 {name}が連戦の疲れを引きずっている', detail: '最近の連戦のダメージが{name}の体に残っているようだ。練習でも動きが鈍く、いつもの切れ味がない。' },
    { text: '🩹 {name}の体に疲労が溜まっているようだ', detail: '練習後に{name}がストレッチに普段の倍の時間をかけていた。本人は何も言わないが、体が悲鳴を上げているのかもしれない。' },
  ],
  N4: [
    { text: '📣 ファンから{name}への応援の声が増えている！', detail: '会場の外でも{name}を待つファンの姿が増えてきた。試合を見て初めてプロレスを好きになったと語るファンも現れはじめている。' },
    { text: '🎉 SNSで{name}が話題になっている！', detail: '先週の試合でのハイライトが拡散されて、{name}のSNSフォロワー数が急増している。知名度が着実に上がってきた。' },
    { text: '💖 {name}目当てのファンが増えてきた！', detail: 'チケット購入時に「{name}が見たくて来た」と声に出してくれるファンが増えている。地道に積み重ねてきた試合が実を結んでいる。' },
    { text: '🔥 {name}の人気が上り調子だ！', detail: '観客の入りを見ていると、{name}が出る試合は明らかに人が多い。ファンが友人を誘って来場するというケースも報告されている。' },
    { text: '🛍️ {name}のグッズが売れ行き好調！', detail: '{name}のTシャツやタオルが会場で飛ぶように売れている。追加発注を検討してもいいかもしれない。' },
    { text: '📱 {name}のファンアートがSNSで拡散中！', detail: 'ファンが{name}のイラストや応援動画をSNSに投稿し、それが大きな話題を呼んでいる。知名度がじわじわと上昇中だ。' },
  ],
  N5_warning: [
    { text: '😶 {name}が最近どことなく元気がないようだ…', detail: 'いつもは積極的に話しかけてくる{name}が、最近は静かに練習をこなして帰るだけになっている。何か気になることがあるのかもしれない。' },
    { text: '💭 {name}の様子が少し気になる', detail: '練習中の{name}の目が、どこか遠くを見ているような瞬間が増えた。試合への集中は保てているが、何かを抱えているように見える。' },
    { text: '🤔 {name}が浮かない顔をしていた', detail: '今日の{name}は朝から表情が暗かった。何か聞こうとしたが、「大丈夫です」と遮られてしまった。様子を見ておく必要がありそうだ。' },
    { text: '😑 {name}が練習中に何かを考えているようだった', detail: 'スパーリング中に{name}が一瞬だけ動きを止めることがあった。何か重いものを抱えているように見えた。' },
    { text: '🫥 {name}が自主練を欠席する日があった', detail: '以前は必ず参加していた自主練に{name}が来なかった。体調不良ではないらしいが…声をかけてみるか、ケアアクションで気にかけてみてもいいかもしれない。' },
    { text: '😐 {name}がチームメイトと距離を置き始めた', detail: '{name}が休憩時間に一人で過ごすことが増えた。まだ深刻な段階ではなさそうだが、試合に出して活躍の場を作ることで変わるかもしれない。' },
  ],
  N5_low: [
    { text: '😤 {name}が最近不満そうにしている…', detail: '練習後のミーティングで、{name}の受け答えがぶっきらぼうになってきた。チームとの何らかの摩擦が生じているかもしれない。' },
    { text: '😟 {name}から笑顔が消えてきた気がする', detail: '以前は練習後もチームメイトと談笑していた{name}が、最近は黙って着替えて帰ることが増えた。チームの雰囲気にも影響が出てきそうだ。' },
    { text: '💢 {name}が何かに苛立っている様子だ', detail: '小さなことで感情が出やすくなっている{name}。直接の原因は不明だが、現状への不満が積み重なっているようだ。早めに話を聞いた方がいいかもしれない。' },
    { text: '😶‍🌫️ {name}…大丈夫だろうか', detail: '最近の{name}は何を考えているのか読めない。返事はするが目が合わない、笑顔が一切見られない——チームの誰もが心配している。' },
    { text: '🚪 {name}が一人で練習場を出ていった', detail: '全体練習の終了前に、{name}が黙って荷物をまとめて帰っていった。ケアアクションでボーナスを支給するか、試合で活躍の場を与えることで状況を改善できるかもしれない。' },
    { text: '⚡ {name}の態度にチーム内でも不安の声が', detail: '{name}の不満げな態度がチームメイトにも伝わっている。このまま放置すると退団リスクが高まりそうだ。待遇改善や直接の対話が必要かもしれない。' },
  ],
  // §13.2: N-練習孤立（trust < 50, 10%/週）
  N_isolation: [
    { text: '😶 {name}が最近、練習で一人でいることが増えた…', detail: '合同練習の後も{name}は一人で黙々とストレッチをしている。以前はチームメイトと談笑していたのだが、最近はほとんど会話がない。' },
    { text: '🚶 {name}が練習後にすぐ帰るようになった', detail: '以前は最後まで残って自主練をしていた{name}だが、最近は練習が終わると荷物をまとめてさっと帰ってしまう。何かを抱えているようだ。' },
    { text: '😔 {name}が休憩時間にひとりぼっちだった', detail: '休憩時間、他の選手たちが輪になって話す中、{name}は隅でスマホを見つめていた。以前はいつも誰かと一緒にいたのに。' },
    { text: '👤 {name}が道場の隅で黙々と練習していた', detail: 'みんなが中央のリングで合同練習をしている時、{name}は壁際で一人、基礎練習を繰り返していた。周囲とは見えない壁ができている。' },
    { text: '🫥 {name}の表情が硬い日が増えた', detail: '{name}の笑顔を見る機会がめっきり減った。練習中も淡々とメニューをこなすだけで、チームメイトとの雑談もほとんどない。' },
    { text: '😶‍🌫️ {name}が自主練も一人で行うようになった', detail: '以前はスパーリング相手を自分から探していた{name}が、最近は一人でサンドバッグを叩いている姿しか見ない。心を閉ざし始めているのかもしれない。' },
  ],
  // §13.2: N-コーチ報告（trust < 45, コーチ在籍時, 15%/週）
  N_coach_report: [
    { text: '📋 コーチ{coach}が報告:「{name}の様子が最近おかしい」', detail: 'コーチ{coach}が社長室を訪れた。「{name}のことなんですが…練習中の集中力が明らかに落ちています。少し気にかけてやってほしい」' },
    { text: '📝 コーチ{coach}:「{name}のことで相談が…」', detail: '「{name}が最近、試合後も練習後もすぐに帰ってしまうんです。前は自主練していたのに。何か不満があるのかもしれません」とコーチ{coach}が心配そうに報告した。' },
    { text: '🗣️ コーチ{coach}が{name}について進言', detail: '「社長、{name}のモチベーションが下がっているように見えます。練習態度は悪くないんですが…どこか投げやりというか。ケアが必要かもしれません」' },
    { text: '⚠️ コーチ{coach}:「{name}が心配です」', detail: '「{name}とは最近あまり話せていないんです。こちらから声をかけても素っ気ない返事しか返ってこなくて。何か手を打った方がいいかもしれません」' },
    { text: '👀 コーチ{coach}が{name}の変調に気づいた', detail: '「{name}、最近ちょっとおかしいです。技の精度は保ってるんですが、目が死んでるというか…このまま放っておくとまずいかもしれません」' },
    { text: '📊 コーチ{coach}の定期報告に{name}の名前が', detail: '月次の選手状態報告の中で、コーチ{coach}が{name}の名前を特記していた。「要注意。練習態度に変化あり。面談を推奨します」' },
  ],
  // §13.4: 突然の退団（trust < 15, 2.5%/興行）
  N_sudden_departure: [
    { text: '🚪 {name}が荷物をまとめて団体を去った', detail: '朝、道場に着くと{name}のロッカーが空になっていた。誰にも何も言わず、荷物をまとめて去ったらしい。誰も止められなかった。' },
    { text: '📦 {name}が突然いなくなった…', detail: '昨日まで普通に練習に来ていた{name}が、今日は姿を見せなかった。ロッカーの私物はすべて持ち出されていた。連絡もつかない。' },
    { text: '💨 {name}の姿が消えた', detail: '気がつけば{name}はもういなかった。ロッカールームには何も残っていない。チームメイトたちも言葉を失っている。' },
  ],
};

// §3-4: 通知型イベント — personality×archetype セリフ（NOTIF_DIALOGUES）
// N1/N2/N3/N4/N5_warning/N5_low 全タイプ対応
const NOTIF_DIALOGUES = {
  // N1: 成長実感
  N1: {
    normal: {
      _default: ['練習が楽しくなってきた気がします', 'やっと体が動くようになってきた気がします'],
      ojousama: ['お稽古が楽しくなってまいりましたわ', '少しずつ、体が応えてくれるようになりましたの'],
      delinquent: ['なんか最近、体の動きキレてね？', 'やっと感覚掴めてきたっぽい'],
      seductive: ['最近、体が素直に動いてくれるの。嬉しいわ', '練習が楽しくなってきた気がする'],
    },
    bold: {
      _default: ['まだ足りない。もっとできるはず', 'この調子で上を目指したい'],
      ojousama: ['まだまだですわ。もっと上を目指しませんと'],
      delinquent: ['まだ足りねえ。もっとやれるはずだ'],
      cool: ['…まだ上がある。止まる気はない'],
      seductive: ['まだ足りないわ。もっと強くなれる気がするの'],
    },
    quiet: {
      _default: ['……少し、手応えがある'],
      cool: ['…悪くない。この調子で'],
      polite: ['少し…手応えを感じています'],
    },
    shy: {
      _default: ['あの…ちょっとだけ、練習が楽しくなってきました…'],
    },
    easygoing: {
      _default: ['なんか今日、急にいろいろ掴めた気がする！', 'よく分かんないけど、急に噛み合ってきた！'],
      delinquent: ['なんか急にキタわ！掴めた感じ！'],
      seductive: ['あら、急にいろいろ掴めちゃったかも'],
    },
    earnest: {
      _default: ['積み重ねが大事だと思ってます。コツコツやっていきます', '練習って楽しい。もっとやりたいです'],
      polite: ['積み重ねが大切だと信じています。コツコツ参ります'],
      ojousama: ['積み重ねが大切ですわ。一歩一歩、参りますわね'],
      seductive: ['積み重ねって大事よね。もっとやりたくなっちゃう'],
    },
    emotional: {
      _default: ['うわあ…！練習が楽しい…！もっとやりたい！', '体が動くようになってきた…嬉しい…！'],
    },
  },
  // N2: 仲間意識
  N2: {
    normal: {
      _default: ['いい仲間ができた気がします', '一緒に頑張れる人がいると心強いですね'],
      ojousama: ['良いお仲間に恵まれましたわ'],
      delinquent: ['あいつと一緒だと楽しいんだよな'],
      seductive: ['いい仲間に恵まれたわ。心強いの'],
    },
    bold: {
      _default: ['仲間がいるから頑張れる。チームって、いいよな', 'あいつと一緒だと燃えるんだ'],
      ojousama: ['仲間がいるから頑張れますわ'],
      delinquent: ['あいつがいるから燃えるんだよ！'],
      cool: ['…悪くないチームだ'],
      seductive: ['仲間がいるって、いいものね'],
    },
    quiet: {
      _default: ['……いい人たちだと、思います'],
      cool: ['…悪くない仲間だ'],
      polite: ['…良い方々だと思います'],
    },
    shy: {
      _default: ['あの…みんなと一緒にいられて…嬉しいです…'],
    },
    easygoing: {
      _default: ['あの人と一緒だと超楽しい！最高のパートナーだよ！'],
      delinquent: ['あいつ最高！一緒だとテンション上がるわ！'],
      seductive: ['あの人と一緒にいると楽しいの。最高のパートナーね'],
    },
    earnest: {
      _default: ['あの人と練習してると自分も頑張ろうって思えるんです', 'この団体で一緒にやれる仲間がいて、幸せです'],
      polite: ['一緒にお稽古していると、自分も頑張ろうと思えます'],
      ojousama: ['この団体でご一緒できる仲間がいて、幸せですわ'],
      seductive: ['あの人と一緒だと、もっと頑張りたくなるの'],
    },
    emotional: {
      _default: ['みんなのこと大好き…！一緒にいられて幸せ…！'],
    },
  },
  // N3: コンディション低下
  N3: {
    normal: {
      _default: ['ちょっと疲れてるだけです。次の試合までには戻ります', '少し休めば大丈夫です'],
      ojousama: ['少々お疲れが出ましたようで…次までには整えますわ'],
      delinquent: ['ちょっとダルいだけだって。すぐ戻る'],
      seductive: ['少し疲れただけよ。心配しないで'],
    },
    bold: {
      _default: ['大丈夫だ、この程度。すぐ戻る', 'こんなんじゃ終われない'],
      ojousama: ['この程度、問題ありませんわ'],
      delinquent: ['この程度で止まってられるかよ'],
      cool: ['…問題ない。戻れる'],
      seductive: ['この程度で止まるつもりはないわ'],
    },
    quiet: {
      _default: ['……少し、休みます'],
      cool: ['…大丈夫だ。すぐ戻れる'],
      polite: ['…少し休ませていただければ…'],
    },
    shy: {
      _default: ['あの…無理はしてないつもりなんですけど……少し休んだ方がいいかも…'],
    },
    easygoing: {
      _default: ['あー、ちょっと疲れちゃったかも。少し休めば平気！'],
      delinquent: ['あー疲れた。ちょい休むわ'],
      seductive: ['ちょっと疲れちゃったかしら。少し休めば大丈夫よ'],
    },
    earnest: {
      _default: ['すみません…体が追いつかなくて。少し休めば大丈夫です', '立て直してみせます'],
      polite: ['申し訳ありません…少し休ませていただければ、必ず戻ります'],
      ojousama: ['少しお休みをいただければ、必ず立て直しますわ'],
      seductive: ['ごめんなさい…少し休めば、すぐ戻れるわ'],
    },
    emotional: {
      _default: ['うう…体がしんどい…でも、でも頑張りたいのに…！'],
    },
  },
  // N4: 人気上昇
  N4: {
    normal: {
      _default: ['こんなにたくさんの応援をいただけるなんて、びっくりしています', 'ファンの声が力になってます'],
      ojousama: ['皆様からこれほどの声援をいただけるなんて、光栄ですわ'],
      delinquent: ['応援してくれるやつがいるってのは…悪くねえな'],
      seductive: ['こんなに応援してもらえるなんて…嬉しいわ'],
    },
    bold: {
      _default: ['この人気を足がかりに、もっと上に行く', 'まだまだここで終わるつもりはない'],
      ojousama: ['この声援を力に、さらに上を目指しますわ'],
      delinquent: ['この勢いで突っ走るぜ！'],
      cool: ['…悪くない。もっと上を目指す'],
      seductive: ['この人気、活かさない手はないわね'],
    },
    quiet: {
      _default: ['……応援、ありがとうございます'],
      cool: ['…ファンの期待には応える'],
      polite: ['…応援してくださって、ありがとうございます'],
    },
    shy: {
      _default: ['え、あの…私なんかを応援してくれる人がいるなんて…'],
    },
    easygoing: {
      _default: ['ファンの皆さんが喜んでくれるのが一番嬉しい！', 'もっとみんなを楽しませたい！'],
      delinquent: ['ファンが盛り上がってんの最高じゃん！'],
      seductive: ['ファンの方が喜んでくれると、もっと見せたくなるわ'],
    },
    earnest: {
      _default: ['みんなに応援してもらえるって、本当に力になりますね', 'ファンの声が原動力です'],
      polite: ['皆様の応援が、何よりの原動力です'],
      ojousama: ['ファンの皆様のお声が力になりますわ'],
      seductive: ['応援してくれる人がいるって、本当に力になるの'],
    },
    emotional: {
      _default: ['みんなが応援してくれてる…！嬉しくて泣きそう…！'],
    },
  },
  // N5: trust低下警告
  N5_warning: {
    normal: {
      _default: ['（どこか上の空で、視線が泳いでいる）', '……すみません、ちょっと考え事を'],
      ojousama: ['…少し、考え事がございまして'],
      delinquent: ['…別に。何でもねーよ'],
      seductive: ['…ごめんなさい、ちょっと考え事してて'],
    },
    bold: {
      _default: ['……このままで本当にいいのか、って考えちゃうことがある', '最近、何と戦ってるのか分からなくなる'],
      ojousama: ['…このままで本当によろしいのか、と考えてしまいますの'],
      delinquent: ['…最近、何のために戦ってんのか分かんねーんだ'],
      cool: ['……目的を、見失いかけている'],
      seductive: ['…このままでいいのかなって、ふと思うの'],
    },
    quiet: {
      _default: ['…………'],
      cool: ['……'],
      polite: ['…あの…何でもありません…'],
    },
    shy: {
      _default: ['…あ、あの……なんでもない、です…'],
    },
    easygoing: {
      _default: ['あはは…いや、ちょっとね。大丈夫、大丈夫'],
      delinquent: ['あー…いや、なんでもねー。平気平気'],
      seductive: ['ふふ…なんでもないわ。気にしないで'],
    },
    earnest: {
      _default: ['練習しても練習しても、何かが足りない気がして…', '…ここにいたい気持ちは変わらないんですけど……'],
      polite: ['練習を重ねても、何か足りない気がいたしまして…'],
      ojousama: ['練習を重ねましても、何かが足りない気がしますの…'],
      seductive: ['いくら練習しても、何か足りない気がして…'],
    },
    emotional: {
      _default: ['…なんか、最近ずっとモヤモヤして…うまく言えないけど…'],
    },
  },
  // N5: trust危険域
  N5_low: {
    normal: {
      _default: ['…別に、何でもないです', 'もういいです。分かりました'],
      ojousama: ['…もう結構ですわ'],
      delinquent: ['…もういいわ。勝手にする'],
      seductive: ['…もういいわ。分かったから'],
    },
    bold: {
      _default: ['……この団体で、自分の夢は叶えられるんだろうか', '先が見えなくて、焦ってる'],
      ojousama: ['…この団体で、夢は叶えられますの…？'],
      delinquent: ['…ここにいても、先が見えねえ'],
      cool: ['……もう、見切りをつけるべきなのか'],
      seductive: ['…ここにいて、私の夢は叶うのかしら'],
    },
    quiet: {
      _default: ['………（何も言わず、目を逸らす）'],
      cool: ['……（静かに出口を見ている）'],
      polite: ['…失礼します（静かに立ち去ろうとする）'],
    },
    shy: {
      _default: ['…ごめんなさい…もう…わかりません…'],
    },
    easygoing: {
      _default: ['あはは…もう、いいかなって。ちょっと考えさせて'],
      delinquent: ['もーいいわ。考えさせてくれ'],
      seductive: ['ふふ…もういいかなって、少し思っちゃった'],
    },
    earnest: {
      _default: ['裏切りたいわけじゃない。ただ……', 'ここが好きだから、だから辛いんです'],
      polite: ['裏切るつもりはございません。ただ……'],
      ojousama: ['裏切りたいわけではありませんの。ただ……'],
      seductive: ['裏切りたいわけじゃないの。ただ……ね'],
    },
    emotional: {
      _default: ['もう…もう分かんない…！どうすればいいの…！'],
    },
  },
};

// §2: 資金投入アクション設定（event-system-spec-v2.md §2）
const CARE_ACTIONS = {
  // 個人向けアクション（cooldown: 週数。省略時=1、同一週は常に不可）
  bonus: {
    id: 'bonus', label: 'ボーナス支給', emoji: '💴', cost: 50, category: 'individual',
    desc: '信頼が上がる（1ストック・連続使用で効果逓減）',
    effects: { trust: 4.59 }, minOrgPop: 0, cooldown: 1,
  },
  costume: {
    id: 'costume', label: 'コスチューム新調', emoji: '👗', cost: 80, category: 'individual',
    desc: '次の試合で注目度UP・信頼が上がる（1ストック・2週に1回）',
    effects: { trust: 5.36 }, minOrgPop: 20, cooldown: 2,
  },
  trainer: {
    id: 'trainer', label: '専属トレーナー手配', emoji: '🏋️', cost: 160, category: 'individual',
    desc: '4週間 成長速度+30%、信頼も上がる（1ストック）',
    effects: { growth_boost: { weeks: 4, mult: 1.3 }, trust: 5.97 }, minOrgPop: 0, cooldown: 1,
  },
  media: {
    id: 'media', label: 'メディア露出手配', emoji: '📺', cost: 120, category: 'individual',
    desc: '団体の知名度が少し上がる・信頼も上がる（1ストック・2週に1回）',
    effects: { trust: 5.36, skip_training: true }, minOrgPop: 20, cooldown: 2,
  },
  special_treatment: {
    id: 'special_treatment', label: '怪我の特別治療', emoji: '🏥', cost: 200, category: 'individual',
    desc: '怪我の回復を早める（1ストック・怪我中のみ）',
    effects: { injury_reduction: true }, minOrgPop: 40,
    condition: 'injured', cooldown: 1,
  },
  encourage: {
    id: 'encourage', label: '声かけ', emoji: '💬', cost: 0, category: 'individual',
    desc: 'スランプ中の選手に声をかける（ストック不要・週1回）',
    effects: { trust: 0.77 }, minOrgPop: 0,
    condition: 'slump_or_motivation_loss', cooldown: 1,
  },
  refresh_leave: {
    id: 'refresh_leave', label: 'リフレッシュ休暇', emoji: '🌴', cost: 100, category: 'individual',
    desc: '休暇でリフレッシュ（1ストック・4週に1回）',
    effects: { condition: 15, trust: 5.36, skip_training: true }, minOrgPop: 0,
    condition: 'slump_or_motivation_loss', cooldown: 4,
  },
  // 団体全体向けアクション（1週に1回まで）
  party: {
    id: 'party', label: '打ち上げ・慰労会', emoji: '🎉', unitCost: 15, category: 'team',
    desc: '全員の信頼と雰囲気が少し上がる（1ストック）',
    effects: { trust_all: 1.84, morale: 5 }, minOrgPop: 0, minHeadcount: 4,
  },
  camp: {
    id: 'camp', label: '合宿', emoji: '⛺', unitCost: 40, category: 'team',
    desc: '全員の成長+中、信頼も少し上がる（2ストック）',
    effects: { growth_all: { weeks: 2, mult: 1.5 }, trust_all: 1.84 }, minOrgPop: 0, minHeadcount: 4,
  },
};

// §2-5: 資金投入リアクションセリフ（特性別）
// {name} はプレースホルダ
const CAMP_FLAVOR_TEXTS = [
  '{name1}と{name2}が朝から激しいスパーリングを繰り広げている…！',
  '夜の自主練で{name1}が黙々とスクワットをしている…',
  '{name1}が{name2}に技の受け身を教えている場面が見られた',
  '合宿の食事は{name1}が率先して準備していた',
  '{name1}と{name2}が夕食後のランニングで競い合っている',
  '早朝の海辺で{name1}が一人、基礎練習に励んでいた',
  '{name1}が新技の研究に没頭している姿が印象的だった',
  '消灯後も{name1}と{name2}がリングで語り合っていた',
  '{name1}が合宿の記念写真を撮ろうとみんなを集めていた',
  '全員で浜辺を走るメニューに{name1}が一番乗りでゴールした',
  '{name1}のムードメーカーぶりで合宿の雰囲気がぐっと明るくなった',
  '練習後の大浴場で{name1}と{name2}が今後の抱負を語り合っていた',
];

const CARE_REACTION_DIALOGUES = {
  bonus: {
    normal: {
      _default: ['ありがとうございます！', 'いただきます…！', '感謝します', '励みになります！', '嬉しいです！大切に使います'],
      ojousama: ['まあ、ありがとうございます。大切に使わせていただきますわ'],
      delinquent: ['お、マジ？ ありがとな！'],
      seductive: ['あら、嬉しい。ありがとう'],
    },
    bold: {
      _default: ['これで負けていられない！', 'よっしゃ！もっと強くなります！'],
      ojousama: ['ありがとうございます。結果でお返ししますわ'],
      delinquent: ['おっしゃ！この金で栄養つけてもっと強くなるぜ！'],
      cool: ['…感謝する。結果で返す'],
      seductive: ['嬉しいわ。実力で返させてもらうわね'],
    },
    quiet: {
      _default: ['……ありがとうございます'],
      cool: ['…ありがたい'],
      polite: ['…ありがとうございます。大切に使います'],
    },
    shy: {
      _default: ['え…あの…ありがとう、ございます…！'],
    },
    easygoing: {
      _default: ['やった！ありがとうございます！', 'おごってもらっちゃおうかな！'],
      delinquent: ['やった！ラッキー！'],
      seductive: ['あら嬉しい。何に使おうかしら'],
    },
    earnest: {
      _default: ['ありがとうございます！次の試合、絶対頑張ります！', '…いつもありがとうございます'],
      polite: ['ありがとうございます。必ず結果でお返しいたします'],
      ojousama: ['ありがとうございます。結果でお応えしますわ'],
      seductive: ['ありがとう。ちゃんと結果で返すわ'],
    },
    emotional: {
      _default: ['え…！ありがとうございます…！嬉しい…！', 'うわあ…嬉しくて泣きそう…！'],
    },
  },
  bonus_repeat: {
    normal: { _default: ['…また？', 'えっと…ありがとうございます', '（また同じ金額か…）'] },
    bold: { _default: ['…また金か。もういいよ'] },
    quiet: { _default: ['…………'] },
    shy: { _default: ['あ…ありがとう、ございます…（また…？）'] },
    easygoing: { _default: ['えっと…ありがと…？'] },
    earnest: { _default: ['あの…気持ちは嬉しいんですが…'] },
    emotional: { _default: ['…また…？（少し困った顔をしている）'] },
  },
  costume: {
    normal: {
      _default: ['わあ！ありがとうございます！', 'うれしい！大切にします', '次の試合が楽しみです！'],
      ojousama: ['まあ素敵…！ありがとうございます。大切にしますわ'],
      delinquent: ['お、いいじゃん！早く着たい！'],
      seductive: ['素敵…！ありがとう。早く着てみたいわ'],
    },
    bold: {
      _default: ['新コス！これ着て勝ちまくります！', 'これで試合に勝てる気がする！'],
      ojousama: ['まあ、素敵ですわ！これで勝利を重ねますわよ'],
      delinquent: ['おお！テンション上がるわ！勝ちまくるぜ！'],
      cool: ['…いいデザインだ。ありがたい'],
      seductive: ['素敵ね。これを着て勝ちに行くわ'],
    },
    quiet: {
      _default: ['……ありがとうございます（嬉しそうに布地を撫でている）'],
      cool: ['…悪くない。使わせてもらう'],
      polite: ['…ありがとうございます。大切にします'],
    },
    shy: {
      _default: ['え…こんな素敵なの…私に…？ ありがとうございます…！'],
    },
    easygoing: {
      _default: ['えっ、これ超かわいい！テンション上がる〜！'],
      delinquent: ['うわ、めっちゃいい！テンション爆上がりだわ！'],
      seductive: ['かわいい！早く着てみたいわ〜'],
    },
    earnest: {
      _default: ['えっ、本当ですか！？ 早く着てみたい！', 'ここまでしてもらえるなんて…ありがとうございます'],
      polite: ['本当にいいんですか…？ 大切に着させていただきます'],
      ojousama: ['まあ…ここまでしていただけるなんて。ありがとうございますわ'],
      seductive: ['本当に？ 嬉しい…大切にするわ'],
    },
    emotional: {
      _default: ['うわあ…！かわいい…！嬉しい…ありがとうございます…！'],
    },
  },
  trainer: {
    normal: {
      _default: ['頑張ります！', '全力で取り組みます！', 'しっかり吸収します！'],
      ojousama: ['精一杯、学ばせていただきますわ'],
      delinquent: ['おっしゃ、ガンガンやるぞ！'],
      seductive: ['しっかり吸収させてもらうわね'],
    },
    bold: {
      _default: ['この環境を無駄にしない！絶対に結果を出す！', '最高の環境だ！限界まで追い込んでもらう！'],
      ojousama: ['この機会、決して無駄にしませんわ！'],
      delinquent: ['最高じゃん！限界まで追い込んでもらうぜ！'],
      cool: ['…ありがたい。結果を出す'],
      seductive: ['この環境、無駄にしないわ。見ていてね'],
    },
    quiet: {
      _default: ['……全力で、学びます'],
      cool: ['…吸収する。見ていてくれ'],
      polite: ['…精一杯学ばせていただきます'],
    },
    shy: {
      _default: ['せ、専属の先生…！が、頑張ります…！'],
    },
    easygoing: {
      _default: ['マンツーマン！？ めちゃくちゃ贅沢じゃないですか！'],
      delinquent: ['マンツーマン！？ 超贅沢じゃん！'],
      seductive: ['マンツーマンなんて贅沢ね。楽しみだわ'],
    },
    earnest: {
      _default: ['専属の先生がつくんですか…！もっと上手くなれます！', 'こんな機会をいただけて…全力で応えます'],
      polite: ['こんな機会をいただけて…全力でお応えいたします'],
      ojousama: ['こんな機会をいただけますなんて…全力でお応えしますわ'],
      seductive: ['こんな機会をもらえるなんて…全力で応えるわ'],
    },
    emotional: {
      _default: ['ええっ…！専属トレーナー…！頑張ります…！嬉しい…！'],
    },
  },
  media: {
    normal: {
      _default: ['よろしくお願いします！', 'ありがとうございます！', '緊張するけど…頑張ります！'],
      ojousama: ['メディアのお仕事ですの？ 精一杯務めますわ'],
      delinquent: ['テレビ？ やってやるよ！'],
      seductive: ['メディア出演…？ 楽しみだわ'],
    },
    bold: {
      _default: ['もっと広い舞台に出たかった。ありがとう！', '注目される場は大歓迎！存在感見せてやる！'],
      ojousama: ['より広い舞台へ。ありがとうございますわ'],
      delinquent: ['注目されんの大歓迎！やってやるぜ！'],
      cool: ['…いい機会だ。結果を出す'],
      seductive: ['注目される場って好きよ。任せて'],
    },
    quiet: {
      _default: ['…が、頑張ります'],
      cool: ['……やる'],
      polite: ['…緊張しますが、精一杯頑張ります'],
    },
    shy: {
      _default: ['え…テレビ…？ き、緊張します…で、でも頑張ります…！'],
    },
    easygoing: {
      _default: ['テレビ！？ ファンのみんな見てる〜？'],
      delinquent: ['テレビ！？ みんな見てるー？'],
      seductive: ['テレビ？ みんなに見てもらえるのね。楽しみ'],
    },
    earnest: {
      _default: ['うわあ、緊張する…でも頑張ります！', '団体の看板として恥ずかしくないようにします'],
      polite: ['緊張いたしますが…精一杯務めます'],
      ojousama: ['団体の看板として恥ずかしくない姿をお見せしますわ'],
      seductive: ['緊張するけど…精一杯やるわ'],
    },
    emotional: {
      _default: ['テレビ…！？ うわあ…緊張するけど嬉しい…！頑張る…！'],
    },
  },
  special_treatment: {
    normal: {
      _default: ['助かります…', 'ありがとうございます', '一日でも早く復帰します！'],
      ojousama: ['お気遣いいただき、ありがとうございますわ。必ず戻りますの'],
      delinquent: ['サンキュ。早く治してリング戻るわ'],
      seductive: ['ありがとう。早く戻れるように頑張るわ'],
    },
    bold: {
      _default: ['早く治してリングに戻りたい…！待ってろよ…！'],
      ojousama: ['必ず戻りますわ。待っていてくださいませ'],
      delinquent: ['すぐ治してやる。待ってろよ！'],
      cool: ['…すぐ戻る。待っていてくれ'],
      seductive: ['早く戻りたいの…待っていてね'],
    },
    quiet: {
      _default: ['……ありがとうございます。戻ります'],
      cool: ['…感謝する。必ず戻る'],
      polite: ['…ご迷惑をおかけして申し訳ございません。必ず戻ります'],
    },
    shy: {
      _default: ['すみません…ご迷惑をおかけして…必ず、戻ります…'],
    },
    easygoing: {
      _default: ['やった〜！最新の治療ってやつですか！？'],
      delinquent: ['おっ、最新の治療？ ラッキー！'],
      seductive: ['最新の治療ね。早く良くなりそうだわ'],
    },
    earnest: {
      _default: ['ありがとうございます…早く試合に戻りたいんです', 'ご迷惑をおかけしてすみません…必ず戻ります'],
      polite: ['ありがとうございます。一日も早く復帰いたします'],
      ojousama: ['ご迷惑をおかけしまして…必ず戻りますわ'],
      seductive: ['ありがとう…早く戻れるように頑張るわ'],
    },
    emotional: {
      _default: ['うう…治療してもらえるなんて…ありがとうございます…早く戻りたい…！'],
    },
  },
  encourage: {
    normal: {
      _default: ['ありがとうございます…', 'もう少し、頑張ってみます', 'その言葉、嬉しかったです'],
      ojousama: ['…ありがとうございます。もう少し、頑張ってみますわ'],
      delinquent: ['…サンキュ。もうちょいやってみるわ'],
      seductive: ['…ありがとう。もう少し、頑張ってみるわ'],
    },
    bold: {
      _default: ['こんなところで止まってられない！次は絶対やる！', '…分かった。まだ諦めない'],
      ojousama: ['こんなところで終わりませんわ！'],
      delinquent: ['止まってられるかよ！次は絶対やってやる！'],
      cool: ['…まだ終わっていない。やる'],
      seductive: ['止まるつもりはないわ。見ていてね'],
    },
    quiet: {
      _default: ['………ありがとう、ございます'],
      cool: ['……分かった'],
      polite: ['…お言葉、ありがとうございます'],
    },
    shy: {
      _default: ['…声をかけてもらえて…嬉しかったです…頑張ります…'],
    },
    easygoing: {
      _default: ['うわー、しんみりした！でも元気出た！やってやる！', 'よし！やってやる！'],
      delinquent: ['おっしゃ！元気出た！やってやるわ！'],
      seductive: ['ふふ、元気出ちゃった。やってみるわ'],
    },
    earnest: {
      _default: ['ありがとうございます…もう一度、頑張ってみます！', 'その言葉、すごく嬉しかったです。頑張ります！'],
      polite: ['お言葉、ありがとうございます。もう一度頑張ります'],
      ojousama: ['ありがとうございます…もう一度、頑張ってみますわ'],
      seductive: ['ありがとう…もう一度、頑張ってみるわ'],
    },
    emotional: {
      _default: ['…っ！ありがとうございます…！もう一回…もう一回頑張ります…！'],
    },
  },
  encourage_high_trust: {
    normal: {
      _default: ['ずっと見てくれてたんですね…頑張ります！', 'あなたに言われると、本当に力が出ます！'],
      ojousama: ['ずっと見守ってくださったんですのね…お応えしますわ'],
      delinquent: ['…アンタに言われると、やんなきゃって思うんだよ'],
      seductive: ['ずっと見てくれてたのね…嬉しい。頑張るわ'],
    },
    bold: {
      _default: ['あなたが信じてくれるなら、絶対やる！', 'あなたの期待には必ず応える！'],
      ojousama: ['あなた様が信じてくださるなら、必ずお応えしますわ！'],
      delinquent: ['アンタが信じてくれんなら、やってやるよ！'],
      cool: ['…信じてくれるなら、応える'],
      seductive: ['あなたが信じてくれるなら…絶対応えるわ'],
    },
    quiet: {
      _default: ['……ずっと、見てくれてたんですね'],
      cool: ['…分かった。応える'],
      polite: ['…ずっと見守ってくださったんですね。お応えします'],
    },
    shy: {
      _default: ['ずっと…見てくれてたんですか…？ わ、私…頑張ります…！'],
    },
    easygoing: {
      _default: ['えへへ…見てくれてたんだ。もうちょっと頑張ろうかな！'],
      delinquent: ['見てくれてたんだ？ じゃ、もうちょいやるか！'],
      seductive: ['見てくれてたのね。嬉しいわ。もう少し頑張ってみるわ'],
    },
    earnest: {
      _default: ['あなたに言われると、本当に力が出ます！もっと頑張れます！', 'ずっと見てくれてたんですね…絶対に報いてみせます'],
      polite: ['ずっと見守ってくださったんですね…必ずお報いいたします'],
      ojousama: ['ずっと見てくださったんですのね…お報いしますわ'],
      seductive: ['ずっと見てくれてたのね…絶対に報いるわ'],
    },
    emotional: {
      _default: ['…っ！ずっと見てくれてたんですね…！泣いちゃう…でも頑張る…！'],
    },
  },
  refresh_leave: {
    normal: {
      _default: ['ありがとうございます！行ってきます！', 'ゆっくり休んで戻ってきます！', 'ありがとうございます…少し、休みます'],
      ojousama: ['ありがとうございますわ。リフレッシュして参りますの'],
      delinquent: ['サンキュ！ちょっと休んでくるわ'],
      seductive: ['ありがとう。リフレッシュしてくるわね'],
    },
    bold: {
      _default: ['リフレッシュして、もっと上を目指す！', '充電してくる！絶対戻ってくる！'],
      ojousama: ['充電して参りますわ！必ず戻りますわよ！'],
      delinquent: ['充電してくる！戻ったら全開だぜ！'],
      cool: ['…充電してくる。戻ったら結果を出す'],
      seductive: ['リフレッシュしてくるわ。戻ったらもっと輝くから'],
    },
    quiet: {
      _default: ['…少し、休みます。ありがとうございます'],
      cool: ['…感謝する。少し休む'],
      polite: ['…ありがとうございます。少し休ませていただきます'],
    },
    shy: {
      _default: ['あの…休んでいいんですか…？ ありがとうございます…'],
    },
    easygoing: {
      _default: ['やった！バカンスだ！でも戻ったら本気出します！'],
      delinquent: ['バカンスだー！戻ったら本気出すから！'],
      seductive: ['バカンスね。リフレッシュして戻るわ'],
    },
    earnest: {
      _default: ['え…でも練習が…でも、ありがとうございます！', '…そんなに気にかけてもらえるとは。ありがとうございます'],
      polite: ['練習が気になりますが…お気遣いありがとうございます'],
      ojousama: ['練習のことが気になりますけれど…お心遣い、ありがとうございますわ'],
      seductive: ['練習が気になるけど…ありがとう。休んでくるわ'],
    },
    emotional: {
      _default: ['休んでいいんですか…？ ありがとうございます…リフレッシュしてきます…！'],
    },
  },
  party: {
    normal: {
      _default: ['お疲れ様でした〜！', 'みんなで楽しく過ごせました！', 'こういう時間、いいですね！', 'リフレッシュできました！'],
      ojousama: ['楽しいお時間でしたわ。皆様、お疲れ様ですの'],
      delinquent: ['いえーい！カンパーイ！'],
      seductive: ['楽しかったわ。こういう時間もいいわね'],
    },
    bold: {
      _default: ['楽しいけど…次の興行ではもっと結果を出す！', 'いい雰囲気だ。チームが強くなってる証拠だな'],
      ojousama: ['皆様、よく頑張りましたわね。誇りに思いますわ'],
      delinquent: ['カンパーイ！！ 今日は無礼講だ〜！'],
      cool: ['…悪くない時間だった'],
      seductive: ['いい雰囲気ね。チームが成長してる証拠だわ'],
    },
    quiet: {
      _default: ['……楽しかったです（小さく微笑んでいる）'],
      cool: ['…悪くなかった'],
      polite: ['…楽しいお時間でした。ありがとうございます'],
    },
    shy: {
      _default: ['あ、あの…楽しかった、です…（隅で小さく笑っている）'],
    },
    easygoing: {
      _default: ['カンパーイ！！ 今日は無礼講だ〜！', 'もう一軒行きましょうよ〜！'],
      delinquent: ['うぇーい！飲むぞ〜！'],
      seductive: ['ふふ、みんないい顔してるわね'],
    },
    earnest: {
      _default: ['みんなお疲れ様でした！明日からまた頑張ります！', 'こうしてみんなで集まれるのが嬉しいです'],
      polite: ['皆様、お疲れ様でした。明日からまた頑張りましょう'],
      ojousama: ['皆様、お疲れ様ですわ。明日からまた頑張りましょうね'],
      seductive: ['お疲れ様。また明日から頑張りましょうね'],
    },
    emotional: {
      _default: ['みんな〜！楽しい〜！大好き〜！', 'こういう時間…最高だよ…！'],
    },
  },
  camp: {
    normal: {
      _default: ['しっかり鍛えてきます！', '頑張ります！', '良い合宿にしましょう！', '楽しみです！全力で取り組みます！'],
      ojousama: ['合宿ですの？ 精一杯取り組みますわ'],
      delinquent: ['合宿！ ガンガンやるぞ！'],
      seductive: ['合宿ね。しっかり鍛えるわ'],
    },
    bold: {
      _default: ['ライバルに差をつけるチャンスだ！', '合宿から帰る頃には一回り強くなってやる！'],
      ojousama: ['この合宿で一段上へ参りますわ！'],
      delinquent: ['やってやるぜ！帰る頃には別人だ！'],
      cool: ['…鍛えさせてもらう。結果を出す'],
      seductive: ['帰る頃には一回り強くなってるわよ'],
    },
    quiet: {
      _default: ['……頑張ります'],
      cool: ['…追い込む'],
      polite: ['…精一杯、取り組みます'],
    },
    shy: {
      _default: ['が、合宿…！ が、頑張ります…！'],
    },
    easygoing: {
      _default: ['うおー！！合宿だ！楽しみ！', '夜は枕投げだ！…嘘です、練習します'],
      delinquent: ['合宿だー！ 盛り上がっていくぞー！'],
      seductive: ['合宿楽しみ〜。みんなで頑張りましょ'],
    },
    earnest: {
      _default: ['やった！思い切り練習できる！', '合宿の間に絶対レベルアップしてみせます！', 'みんなで一緒に強くなれるなんて…最高です'],
      polite: ['全力で取り組ませていただきます。レベルアップしてみせます'],
      ojousama: ['みっちり鍛えていただきますわ！絶対に成長してみせますの'],
      seductive: ['思い切り鍛えられるのね。楽しみだわ'],
    },
    emotional: {
      _default: ['合宿…！みんなで強くなれる…！最高だよ…！'],
    },
  },
};

// §3-3: 選択型イベントセリフ（S1〜S6, E1〜E6）— personality×archetype
const CHOICE_EVENT_DIALOGUES = {
  // S1: タイトル挑戦要求
  S1: {
    normal: {
      _default: ['タイトルマッチの機会をいただけませんか？'],
      ojousama: ['王座への挑戦をお許しいただけませんこと？'],
      delinquent: ['タイトルマッチ、組んでくれよ'],
      seductive: ['タイトルマッチの機会、いただけないかしら'],
    },
    bold: {
      _default: ['チャンピオンの座が欲しい。今すぐ組んでくれ', 'ベルトを賭けた試合がしたい！'],
      ojousama: ['チャンピオンの座、いただきに参りますわ'],
      delinquent: ['ベルトよこせ！今すぐ組め！'],
      cool: ['…ベルトが欲しい。組んでくれ'],
      seductive: ['ベルトが欲しいの。組んでもらえる？'],
    },
    quiet: {
      _default: ['……挑戦させてください'],
      cool: ['…タイトルマッチを。頼む'],
      polite: ['…タイトルマッチに挑戦させていただけますか'],
    },
    shy: {
      _default: ['あ、あの…タイトルマッチ…挑戦させてもらえませんか…？'],
    },
    easygoing: {
      _default: ['ねえねえ、タイトルマッチ組んでよ！', 'ベルト欲しいなー。挑戦させてくれない？'],
      delinquent: ['タイトルマッチ組めよ！やる気あんだからさ！'],
      seductive: ['ベルト、欲しくなっちゃった。挑戦させてくれない？'],
    },
    earnest: {
      _default: ['ずっと準備してきました…チャンスをください', 'タイトルマッチに挑ませてください！'],
      polite: ['ずっと準備して参りました。チャンスをいただけませんか'],
      ojousama: ['ずっと準備してまいりましたの。チャンスをいただけませんこと'],
      seductive: ['ずっと準備してきたの。チャンスをちょうだい'],
    },
    emotional: {
      _default: ['お願いします…！タイトルマッチに挑ませてください…！'],
    },
  },
  // S2: 対戦要求（因縁）
  S2: {
    normal: {
      _default: ['因縁のある相手と試合を組んでいただけませんか'],
      ojousama: ['あの方との決着を、お許しいただけませんこと'],
      delinquent: ['あいつとの試合、組んでくれよ'],
      seductive: ['あの人との試合、組んでもらえないかしら'],
    },
    bold: {
      _default: ['あの人と戦わずにはいられない！組んでくれ！', '決着をつけたい。あいつと戦う機会を作ってくれ'],
      ojousama: ['あの方と決着をつけませんと！'],
      delinquent: ['あいつと決着つけさせろ！'],
      cool: ['…決着をつけたい。組んでくれ'],
      seductive: ['あの人と決着をつけたいの。組んでもらえる？'],
    },
    quiet: {
      _default: ['……あの人と、戦わせてください'],
      cool: ['…あいつとの試合を。頼む'],
      polite: ['…あの方との対戦を、お願いできますか'],
    },
    shy: {
      _default: ['あの…あの人と…試合させてもらえませんか…'],
    },
    easygoing: {
      _default: ['あの人との試合組んでよ！決着つけたいんだ！'],
      delinquent: ['あいつとやらせろよ！ケリつけてやる！'],
      seductive: ['あの人との試合、組んでくれない？ 決着つけたいの'],
    },
    earnest: {
      _default: ['あの相手を越えてこそ、次のステージに行ける。組んでください'],
      polite: ['あの方との試合を組んでいただけないでしょうか'],
      ojousama: ['あの方を越えてこそですわ。組んでいただけませんこと'],
      seductive: ['あの人を越えたいの。試合を組んでくれない？'],
    },
    emotional: {
      _default: ['あの人と戦いたい…！お願いします…組んでください…！'],
    },
  },
  // S3: 休養願い
  S3: {
    normal: {
      _default: ['少し休養をいただけますか？'],
      ojousama: ['少しお休みをいただけますかしら…'],
      delinquent: ['ちょっと休ませてくれ…'],
      seductive: ['少し休ませてもらえないかしら…'],
    },
    bold: {
      _default: ['…悔しいけど、体が限界だ。少し休ませてくれ'],
      ojousama: ['…お恥ずかしいのですが、体が限界ですわ'],
      delinquent: ['くそ…体がもう限界だ。休ませてくれ'],
      cool: ['…限界だ。休む'],
      seductive: ['…体が限界なの。少し休ませて'],
    },
    quiet: {
      _default: ['……少し、休ませてください'],
      cool: ['…休む必要がある'],
      polite: ['…申し訳ありません。少し休ませていただけますか…'],
    },
    shy: {
      _default: ['あの…すみません…体が…少し休ませてもらえますか…'],
    },
    easygoing: {
      _default: ['もう限界！ちょっと休まないとマジでやばい！'],
      delinquent: ['無理！限界！休ませて！'],
      seductive: ['ごめんね、ちょっと限界みたい。休ませてくれる？'],
    },
    earnest: {
      _default: ['迷惑をかけてしまって申し訳ないんですが…少し休ませてもらえますか', 'チームに迷惑はかけたくないんですが…体が限界で…'],
      polite: ['ご迷惑をおかけしまして申し訳ございません…少しお休みをいただけますか'],
      ojousama: ['チームにご迷惑はかけたくありませんのに…体が限界ですわ…'],
      seductive: ['迷惑かけたくないんだけど…体が限界なの…'],
    },
    emotional: {
      _default: ['ごめんなさい…体がもう…休ませてください…！'],
    },
  },
  // S4: 不満・退団示唆（低trust）
  S4_direct: {
    normal: {
      _default: ['このままでは限界です。待遇を改善していただけませんか'],
      ojousama: ['このままでは困りますの。お話し合いをさせていただけませんこと'],
      delinquent: ['不満だっつってんの。ちゃんと話し合おうぜ'],
      seductive: ['このままじゃ困るわ。ちゃんと考えてもらえないかしら'],
    },
    bold: {
      _default: ['このままじゃ納得できない。改善してくれなければ移籍を考える', '私の実力を使いきれていない。ここにいる意味はあるのか'],
      ojousama: ['このままでは納得できませんわ。ご検討いただけなければ…'],
      delinquent: ['こんなんじゃやってらんねーよ！改善しろ！'],
      cool: ['…このままでは先がない。考えてくれ'],
      seductive: ['このままじゃ我慢の限界よ。考え直してもらえない？'],
    },
    quiet: {
      _default: ['………（険しい目でこちらを見つめている）'],
      cool: ['……もう、限界だ（静かに、しかし断固として）'],
      polite: ['…申し訳ありません。ただ…このままでは…'],
    },
    shy: {
      _default: ['…あの…ごめんなさい…でも…このままだと…'],
    },
    easygoing: {
      _default: ['ぶっちゃけ不満です！ちゃんと話し合いましょう！'],
      delinquent: ['もう無理！ちゃんと話し合えよ！'],
      seductive: ['ぶっちゃけ、不満があるの。ちゃんと話しましょう？'],
    },
    earnest: {
      _default: ['…ずっと我慢してきました。でも、このままでは…', '私の目標を達成できる環境が必要です。考え直してもらえませんか'],
      polite: ['ずっと我慢して参りましたが…このままでは限界です'],
      ojousama: ['これまで耐えてまいりましたけれど…もう限界ですわ'],
      seductive: ['ずっと我慢してきたの。でも、もう限界よ'],
    },
    emotional: {
      _default: ['…もう…無理です…！このままだと…私…！'],
    },
  },
  S4_silent: {
    normal: { _default: ['（沈黙）…いえ、何でもないです'] },
    bold: { _default: ['…………（拳を握りしめている）'] },
    quiet: {
      _default: ['…………（小さくため息をつき、視線を逸らす）'],
      cool: ['……（何も言わず、立ち去ろうとする）'],
      polite: ['………（目を伏せて、何かを堪えるように唇を噛む）……'],
    },
    shy: { _default: ['…………（目を逸らして、何も言えずにいる）'] },
    easygoing: { _default: ['あはは…いや、なんでも…（笑っているが目が笑っていない）'] },
    earnest: { _default: ['…………（何か言いたげに口を開きかけ、止める）'] },
    emotional: { _default: ['……っ（泣くのを堪えるように唇を噛んでいる）'] },
  },
  // S5: 特訓志願（高trust）
  S5: {
    normal: {
      _default: ['特訓する時間をいただけませんか？'],
      ojousama: ['特訓のお時間をいただけませんこと？'],
      delinquent: ['特訓させてくれ。もっと強くなりてえ'],
      seductive: ['特訓させてもらえないかしら？'],
    },
    bold: {
      _default: ['もっと上を目指したい。特訓させてくれ！', '燃えてる！とことんやらせてくれ！'],
      ojousama: ['もっと上を目指したいのですわ。特訓をお許しくださいませ！'],
      delinquent: ['もっと強くなりてぇ！特訓させろ！'],
      cool: ['…特訓させてくれ。もっと強くなる'],
      seductive: ['もっと強くなりたいの。特訓させてもらえる？'],
    },
    quiet: {
      _default: ['……特訓、させてください'],
      cool: ['…鍛えたい。場所を貸してくれ'],
      polite: ['…特訓をさせていただけますか'],
    },
    shy: {
      _default: ['あの…特訓…させてもらえませんか…？ もっと強くなりたいんです…'],
    },
    easygoing: {
      _default: ['特訓したい！もっと強くなりたいんだ！'],
      delinquent: ['特訓すんぞ！もっと強くなりてーんだよ！'],
      seductive: ['特訓したいの。もっと強くなりたくて'],
    },
    earnest: {
      _default: ['もっと強くなりたいんです。特訓を許可してください！'],
      polite: ['もっと強くなりたいのです。特訓をお許しいただけますか'],
      ojousama: ['もっと強くなりたいですの。特訓のお許しをいただけませんこと'],
      seductive: ['もっと強くなりたいの。特訓させてもらえる？'],
    },
    emotional: {
      _default: ['お願いします…！特訓させてください…！もっと、もっと強くなりたい…！'],
    },
  },
  // S6: 後輩指導の申し出（ベテラン）
  S6: {
    normal: {
      _default: ['後輩の指導を担当させてもらえませんか？'],
      ojousama: ['後輩のお世話を、私にお任せいただけませんこと？'],
      delinquent: ['後輩の面倒、見させてくれよ'],
      seductive: ['後輩の指導、私にやらせてもらえないかしら'],
    },
    bold: {
      _default: ['若い子たちの面倒を見させてくれ。それが私の役目だ'],
      ojousama: ['若い子たちのお世話は私の務めですわ'],
      delinquent: ['後輩の面倒は任せろ。鍛えてやる'],
      cool: ['…後輩を見る。任せてくれ'],
      seductive: ['後輩の面倒、見させてもらえるかしら？'],
    },
    quiet: {
      _default: ['……後輩に、伝えたいことがあるんです'],
      cool: ['…次の世代に、繋ぎたいものがある'],
      polite: ['…後輩のご指導を、担当させていただけますか'],
    },
    shy: {
      _default: ['あの…私でよければ…後輩の子たちに…何か伝えられたら…'],
    },
    easygoing: {
      _default: ['後輩の面倒見させてよ！楽しそうだし！'],
      delinquent: ['後輩の面倒見るわ！任せとけ！'],
      seductive: ['後輩の子たち、かわいいわよね。面倒見させてもらえない？'],
    },
    earnest: {
      _default: ['私が培ってきたものを、後輩に伝えたいと思って…', '後輩に何かを伝えたいんです。指導の機会をもらえますか'],
      polite: ['培ってきたものを後輩にお伝えしたいのです'],
      ojousama: ['私が学んできたことを、後輩にお伝えしたいと思いまして…'],
      seductive: ['培ってきたものを、次の子たちに伝えたいの'],
    },
    emotional: {
      _default: ['後輩の子たちに…私にできることがあるなら…やらせてください！'],
    },
  },
  // E1: メディア出演オファー
  E1: {
    normal: {
      _default: ['メディアへの出演、ご検討いただけますか？', '出演のお話をいただきました。やってみたいです'],
      ojousama: ['メディアのお話ですの？ ぜひお受けしたいですわ'],
      delinquent: ['テレビ出れんの？ やるやる！'],
      seductive: ['メディア出演のお話？ 楽しみだわ'],
    },
    bold: {
      _default: ['この露出を足がかりに、もっと大きな舞台へ進みたい', '私が出れば注目されるのは当然。楽しみにしてる'],
      ojousama: ['私が出ればお客様も喜びますわ。楽しみですの'],
      delinquent: ['やってやるぜ！注目されんのは大歓迎だ！'],
      cool: ['…いい機会だ。出る'],
      seductive: ['注目される場は好きよ。もちろんやるわ'],
    },
    quiet: {
      _default: ['…出演のお話、ですか…頑張ります'],
      cool: ['……やる'],
      polite: ['…出演のお話でしょうか。精一杯努めます'],
    },
    shy: {
      _default: ['え…テレビ…？ わ、私なんかが…で、でもやってみたいです…'],
    },
    easygoing: {
      _default: ['ファンのみなさんに、もっと近くで私を見てもらいたい！', 'テレビ！？ やった！出たい！'],
      delinquent: ['テレビ出んの！？ 最高じゃん！'],
      seductive: ['ファンのみんなにもっと見てもらえるのね。嬉しいわ'],
    },
    earnest: {
      _default: ['テレビは緊張しますけど…精一杯やります！'],
      polite: ['緊張いたしますが…精一杯務めさせていただきます'],
      ojousama: ['テレビは緊張いたしますけれど…精一杯やらせていただきますわ'],
      seductive: ['緊張するけど…精一杯やるわ'],
    },
    emotional: {
      _default: ['テレビ…！？ えっ…嬉しい…！頑張ります…！'],
    },
  },
  // E4: スカウト情報（将来拡張用プレースホルダ）
  E4: {
    normal: { _default: ['新たなスカウト情報が届きました'] },
  },
  // E6: 他団体からの引き抜き
  E6: {
    normal: {
      _default: ['他の団体からオファーが来ています'],
      ojousama: ['他の団体からお話がございましたの…'],
      delinquent: ['他所から話来てんだけど'],
      seductive: ['他の団体からお誘いが来てるの'],
    },
    bold: {
      _default: ['…本当のことを言うと、いい条件だと思ってる', '他所から話が来た。考えてもいいだろ'],
      ojousama: ['…正直に申しますと、良い条件ですわ'],
      delinquent: ['他所からいい話来てんだよ。考えさせてくれ'],
      cool: ['…他から話が来た。条件は悪くない'],
      seductive: ['他所からいい話が来てるの。正直、迷ってるわ'],
    },
    quiet: {
      _default: ['………他から、話が（小さな声で）'],
      cool: ['…他所から来た。報告する'],
      polite: ['…他の団体様からお話が…報告しておきます'],
    },
    shy: {
      _default: ['あの…他の団体から…その…どうしたらいいか分からなくて…'],
    },
    easygoing: {
      _default: ['マジで！？ 他の団体が私を欲しいって！？ ちょっと嬉しいかも…'],
      delinquent: ['他所から話来たんだけど！ちょっと嬉しくね？'],
      seductive: ['他所からお誘いが来ちゃった。ちょっと嬉しいかも'],
    },
    earnest: {
      _default: ['こちらに義理があるので断りましたが…報告しておきます', 'みんなと離れたくない気持ちはあるけど…正直、迷ってます'],
      polite: ['こちらに義理がございますので…ただ、ご報告だけは'],
      ojousama: ['こちらへの義理がございますから…でも、ご報告だけはと思いまして'],
      seductive: ['義理があるから断ったけど…報告はしておくわね'],
    },
    emotional: {
      _default: ['他の団体からオファーが…どうしよう…迷ってる…'],
    },
  },
  // §13.3: S-練習ボイコット（trust < 38）
  S_boycott: {
    normal: {
      _default: ['……今日は練習する気分じゃないです', '……すみません、今日は帰ります'],
      ojousama: ['今日はお稽古をお休みさせていただきますわ…理由は…ご想像にお任せしますわ'],
      delinquent: ['練習？やる意味あんの？出してもらえねぇんじゃ同じだろ'],
      cool: ['…………（荷物をまとめて帰ろうとしている）'],
      seductive: ['ごめんなさいね…今日はちょっと、気持ちが入らなくて'],
    },
    bold: {
      _default: ['練習？出してもくれないのに何の意味があるんだよ', 'リングに上がれないなら練習しても仕方ないだろ'],
      delinquent: ['はぁ？やる気出ないっつの。文句あんなら試合組めよ'],
    },
    quiet: {
      _default: ['…………（黙って道場を出ていこうとしている）', '……すみません…今日は……'],
      cool: ['………（静かにテーピングを外している）'],
    },
    easygoing: {
      _default: ['あはは…今日はちょっとサボりまーす…', '練習ねぇ…うーん、今日はパスで'],
    },
    earnest: {
      _default: ['すみません…今日はどうしても体が動かなくて…', '練習に集中できなくて…申し訳ありません'],
      polite: ['大変申し訳ございません…今日はどうしても…'],
    },
    emotional: {
      _default: ['もう無理…練習なんてできない…', '出してもらえないのに練習して…何になるの…'],
    },
  },
  // §13.3: S-ロッカールーム愚痴（trust < 35）
  S_grumble: {
    normal: {
      _default: ['（ロッカールームで不満を漏らしている…周囲に伝播し始めた）'],
      ojousama: ['（控室で「あの方の采配、少しおかしくなくて？」と囁いている）'],
      delinquent: ['（「マジふざけんな」とロッカーを蹴る音が聞こえてきた）'],
      cool: ['（無言で佇んでいるが、周囲が気を遣って重い空気になっている）'],
      seductive: ['（「最近、ここにいる意味あるのかしら」と同僚に漏らしている）'],
    },
    bold: {
      _default: ['（「なんで俺たちがこんな扱い受けなきゃいけないんだ」と大声で言っている）'],
    },
    quiet: {
      _default: ['（黙っているが、その沈黙がかえって周囲を不安にさせている）'],
    },
    easygoing: {
      _default: ['（いつもの笑顔が消え、「ちょっとさぁ…」と珍しく愚痴をこぼしている）'],
    },
    earnest: {
      _default: ['（「自分、このままでいいんですかね…」と後輩に弱音を吐いている）'],
    },
    emotional: {
      _default: ['（涙ぐみながら「もう限界かも…」とチームメイトに打ち明けている）'],
    },
  },
  // §13.3: S-SNS匂わせ（trust < 30, pop 40+）
  S_sns: {
    normal: {
      _default: ['（SNSに「自分の居場所はどこなんだろう」と意味深な投稿）'],
      ojousama: ['（SNSに「窮屈な場所からは、いつでも出ていけますの」と投稿）'],
      delinquent: ['（SNSに「もう我慢の限界」と不穏な投稿）'],
      cool: ['（SNSに風景写真と「遠くへ」とだけ投稿。ファンがざわついている）'],
      seductive: ['（SNSに「次のステージが待っているかも」と匂わせ投稿）'],
    },
    bold: {
      _default: ['（SNSに「このまま終わるつもりはない」と宣言的な投稿）'],
    },
    quiet: {
      _default: ['（SNSに「…」とだけ投稿。ファンの間で憶測が広がっている）'],
    },
    easygoing: {
      _default: ['（SNSに「最近ちょっと考えることがあってー」と珍しく真面目な投稿）'],
    },
    earnest: {
      _default: ['（SNSに「自分は本当にここで必要とされているのか」と率直な投稿）'],
    },
    emotional: {
      _default: ['（SNSに涙の絵文字と「もうダメかもしれない」と投稿。炎上し始めている）'],
    },
  },
};

// §13.5: P-自発的残留セリフ（trust 75+で契約交渉スキップ）
const VOLUNTARY_STAY_LINES = {
  normal: {
    _default: ['残ります。ここが自分の居場所ですから'],
    ojousama: ['わたくし、こちらに残らせていただきますわ。ここが一番輝ける場所ですもの'],
    delinquent: ['どこにも行かねーよ。ここが一番おもしれーからな'],
    cool: ['（静かにうなずいている）……ここにいる'],
    seductive: ['あら、他に行く場所なんてないわ。ここが好きなの'],
  },
  bold: {
    _default: ['他に行く理由がない。ここで頂点を目指す'],
    delinquent: ['行くわけねーだろ。ここで一番になるまで帰らねぇよ'],
  },
  quiet: {
    _default: ['………（静かにうなずいている）'],
    cool: ['…………（契約書にペンを走らせた）'],
  },
  easygoing: {
    _default: ['いやー当然残るでしょ！ここ楽しいもん！'],
  },
  earnest: {
    _default: ['来年も精一杯頑張ります。よろしくお願いします'],
    polite: ['来年もどうぞよろしくお願いいたします。精進してまいります'],
  },
  emotional: {
    _default: ['ここで戦えることが幸せなんです…（涙）'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.0 Phase1-6: 大型イベント（B1〜B4）テキスト＋セリフ
// ─────────────────────────────────────────────────────────────────────────────
const LARGE_EVENT_TEXTS = {
  B1: [
    { text: '⚠️ {name}が練習中にアクシデント', detail: '{name}が練習中に技を受けた際にバランスを崩し、負傷してしまった。' },
    { text: '⚠️ {name}が練習で負傷', detail: 'スパーリング中に{name}が相手の技を受け損ね、マットに叩きつけられた。' },
    { text: '⚠️ {name}に練習中のトラブル', detail: '{name}が新技の練習中に着地に失敗。痛みを訴えている。' },
    { text: '⚠️ {name}がロープワーク中に負傷', detail: 'ロープの反動を利用した連続技の練習中、{name}の足がロープに絡まり転倒。すぐには立ち上がれなかった。' },
    { text: '⚠️ {name}がスパーリング中に痛みを訴えた', detail: '練習パートナーとのスパーリングで{name}が技を受けた直後、顔をしかめて膝をついた。本人は「続けられる」と言うが…' },
    { text: '⚠️ {name}が練習後に体の異変を報告', detail: '練習を終えた{name}が「動かすと痛い箇所がある」と申告。無理をしていた可能性がある。' },
  ],
  B2: [
    { text: '💥 {name1}と{name2}が衝突', detail: '控室で{name1}と{name2}の間に激しい口論が発生。周囲の制止も聞かず一触即発の状態になっている。' },
    { text: '💥 {name1}と{name2}の対立が深刻化', detail: '以前から不穏な空気があった{name1}と{name2}の関係がついに破綻。練習にも支障が出始めている。' },
    { text: '💥 {name1}と{name2}がスパーリングでエスカレート', detail: '本来は軽い打ち合いのはずが、{name1}と{name2}のスパーリングが本気のぶつかり合いに発展。コーチが間に割って入る事態となった。' },
    { text: '💥 {name1}と{name2}の間に亀裂', detail: '{name1}がSNSに意味深な投稿をしたことで{name2}が激怒。控室で怒鳴り合う二人の声が外まで漏れていた。' },
    { text: '💥 {name1}と{name2}の関係が限界に', detail: '合同練習中、{name1}が{name2}への不満を公然と口にした。全員の前での出来事に、チーム全体が凍りついた。' },
  ],
  B3: [
    { text: '⚔️ {orgName}から対抗戦の申し入れ', detail: '{orgName}が「実力を見せてやる」と対抗戦を申し入れてきた。' },
    { text: '⚔️ {orgName}が宣戦布告', detail: '{orgName}の代表が公の場でこちらの団体を挑発。対抗戦で決着をつけようと迫ってきた。' },
    { text: '⚔️ {orgName}の選手が記者会見で挑発', detail: '{orgName}の選手がメディアの前でこちらの団体名を出し、「いつでも受けて立つ」と公開挑戦状を叩きつけた。' },
    { text: '⚔️ {orgName}から果たし状が届いた', detail: '{orgName}から正式な書面が届いた。「団体の威信をかけて対抗戦を行いたい」——無視するわけにはいかない雰囲気だ。' },
    { text: '⚔️ {orgName}が興行に乗り込んできた', detail: 'こちらの興行会場に{orgName}の関係者が姿を見せ、「リングで語り合おう」と対抗戦を持ちかけてきた。' },
  ],
  B4: [
    { text: '📺 {outletName}から密着取材の申し入れ', detail: '{outletName}が「注目選手の密着ドキュメントを作りたい」と打診してきた。' },
    { text: '📺 {outletName}が特集企画を提案', detail: '{outletName}のプロデューサーが来訪。「次世代のスターを追いかけたい」と密着取材を申し出ている。' },
    { text: '📺 {outletName}がドキュメンタリー企画を持ち込んだ', detail: '{outletName}から「選手の素顔に密着する企画をやりたい」と連絡が入った。数試合にわたる長期取材になるという。' },
    { text: '📺 {outletName}の取材クルーが来訪', detail: '{outletName}のカメラマンとレポーターが道場を訪れた。「団体の注目株を特集したい」とのこと。選手を一人選んでほしいそうだ。' },
    { text: '📺 {outletName}から密着ドキュメント企画の提案', detail: '{outletName}が新番組の目玉として「女子プロレスの今」をテーマにした密着特集を検討中。うちの団体から一人推薦してほしいと言う。' },
  ],
};

const LARGE_EVENT_DIALOGUES = {
  // B1: 練習中の怪我 — 怪我した選手のセリフ
  B1: {
    normal: {
      _default: ['…痛みが引くまで少し時間がかかりそうです'],
      ojousama: ['少しお時間をいただくことになりそうですわ…'],
      delinquent: ['いてて…やっちまった。すぐ戻るから'],
      seductive: ['…少し時間がかかりそう。ごめんなさいね'],
    },
    bold: {
      _default: ['くそっ…こんなところで足を止めるわけにはいかないのに', '大丈夫だ、この程度…すぐ戻る'],
      ojousama: ['こんなところで止まるわけには参りませんわ…！'],
      delinquent: ['くそっ…こんなとこで止まってらんねえ！'],
      cool: ['…すぐ戻る。問題ない'],
      seductive: ['こんなところで止まるつもりはないわ…すぐ戻る'],
    },
    quiet: {
      _default: ['……すみません'],
      cool: ['…すぐ戻る'],
      polite: ['…申し訳ございません。すぐに戻ります'],
    },
    shy: {
      _default: ['す、すみません…ご迷惑を…早く治します…'],
    },
    easygoing: {
      _default: ['いてて…やっちゃいました。でも根性で治します！'],
      delinquent: ['いった！やっちまったけど、すぐ治すから！'],
      seductive: ['あら、やっちゃった…でもすぐ治すわ'],
    },
    earnest: {
      _default: ['すみません…もっと注意するべきでした。早く復帰できるよう頑張ります'],
      polite: ['申し訳ございません…一日も早く復帰いたします'],
      ojousama: ['もっと気をつけるべきでしたわ…早く復帰して見せますの'],
      seductive: ['ごめんなさい…早く戻れるように頑張るわ'],
    },
    emotional: {
      _default: ['ごめんなさい…！早く治します…早く戻りたい…！'],
    },
  },
  // B2: 対立 — fighter1 のセリフ
  B2_fighter1: {
    normal: {
      _default: ['このままじゃチームがもたない。何とかしてほしい'],
      ojousama: ['あの方とは…もう限界ですわ'],
      delinquent: ['あいつとはもう無理だ。何とかしてくれ'],
      seductive: ['あの人とはもう無理よ。何とかしてもらえないかしら'],
    },
    bold: {
      _default: ['あいつの態度が許せない。もう我慢の限界だ', 'チームのためにも、この問題ははっきりさせるべきだ'],
      ojousama: ['あの方の態度は許せませんわ。はっきりさせますわよ'],
      delinquent: ['あいつの態度が気に食わねえ！限界だ！'],
      cool: ['…あいつとは合わない。決着をつける'],
      seductive: ['あの人の態度、もう我慢できないの'],
    },
    quiet: {
      _default: ['………あの人とは、もう…'],
      cool: ['…あれとは合わない。それだけだ'],
      polite: ['…あの方とは…申し訳ありません、もう限界です'],
    },
    shy: {
      _default: ['あの…あの人のこと…もう…どうしたらいいか…'],
    },
    easygoing: {
      _default: ['あいつとはもう無理！顔も見たくない！'],
      delinquent: ['あいつマジ無理！もう顔も見たくねえ！'],
      seductive: ['あの人とはもう無理。顔も見たくないわ'],
    },
    earnest: {
      _default: ['足を引っ張る人間とは一緒にやれない', 'このままでは団体のためにならない。何とかしてほしい'],
      polite: ['あの方とは…このままではチームに影響が出ます'],
      ojousama: ['あの方とは…チームのためにもはっきりさせるべきですわ'],
      seductive: ['あの人と一緒じゃ仕事にならないの。何とかして'],
    },
    emotional: {
      _default: ['もう無理…！あの人と一緒にいると…辛い…！'],
    },
  },
  // B2: 対立 — fighter2 のセリフ
  B2_fighter2: {
    normal: {
      _default: ['向こうにも非があるのに、私だけ悪いみたいに…'],
      ojousama: ['あちらにも非がおありでしょうに…'],
      delinquent: ['向こうが悪いんだろ。なんで私だけ？'],
      seductive: ['向こうにも非があるのに…私だけが悪いの？'],
    },
    bold: {
      _default: ['私だって黙ってない。向こうが謝るべきだ', '正面からぶつかって決着つけるしかないだろう'],
      ojousama: ['私だって黙ってはいませんわよ。あちらが非を認めるべきですわ'],
      delinquent: ['黙ってると思うなよ！向こうが謝れ！'],
      cool: ['…謝る気はない。向こうが非を認めるべきだ'],
      seductive: ['黙ってるつもりはないわ。向こうが悪いんだから'],
    },
    quiet: {
      _default: ['………（静かに俯いている）'],
      cool: ['…私は間違っていない'],
      polite: ['…あの方とは…すみません、もう…'],
    },
    shy: {
      _default: ['…私が悪いんでしょうか…（不安そうに）'],
    },
    easygoing: {
      _default: ['売られたケンカは買うよ！来いよ！'],
      delinquent: ['やんのか！？ 売られたケンカは買うぜ！'],
      seductive: ['ケンカ売ってきたのは向こうよ？ 買ってあげるわ'],
    },
    earnest: {
      _default: ['団体には迷惑をかけたくないけど…あの人とは無理です', '私のやり方に文句があるなら、はっきり言えばいい'],
      polite: ['団体にご迷惑はかけたくないのですが…あの方とは…'],
      ojousama: ['団体にご迷惑はかけたくありませんのに…あの方とは…'],
      seductive: ['迷惑はかけたくないけど…あの人とはもう無理なの'],
    },
    emotional: {
      _default: ['私だって…！私だって辛いのに…！'],
    },
  },
  // B3: 対抗戦 — 挑戦者のセリフ（憎たらしい態度）※NPC配列のまま
  B3_challenger: [
    'お前たちの団体のレベル？ うちの練習生にも及ばないだろうね',
    'かわいそうに。井の中の蛙って言葉、知ってる？',
    '弱小団体が調子に乗ってると聞いてね。現実を見せてあげるよ',
    'うちのエースと同じリングに立てるだけ光栄に思いな',
    '正直、時間の無駄だと思ってるけど…まぁ、付き合ってあげるよ',
    'そっちの看板選手？ うちの中堅にも勝てないんじゃない？',
    'どこの団体か知らないけど、プロの世界を教えてやるよ',
    'ファンの前で恥をかかせてあげる。覚悟はいい？',
    '最近ちょっと名前を聞くようになったから来てあげたのに…期待外れだったかな？',
    'あなたたちの興行、一度見に行ったけど…お遊戯会みたいだったわ',
    '勝てると思ってるの？ その自信がどこから来るのか不思議だわ',
    'せっかくの機会だし、プロのレスリングを見せてあげる。よく見ておきなさい',
    '話題作りに付き合ってあげる。感謝してほしいくらいだよ',
  ],
  // B3: 断った場合の挑発追加セリフ ※NPC配列のまま
  B3_decline: [
    'やっぱりな。逃げると思ってたよ',
    'チキンか。まぁ、賢い判断だな',
    '怖いなら仕方ないよな。次はないと思え',
    'はっ…自分たちの実力を分かってるんだね。偉いよ',
    '断るんだ？ まぁ、恥をかくよりマシか',
    'がっかりだよ。勝負する度胸もないのか',
    'あーあ、つまんないの。ファンも残念がるだろうね',
  ],
  // B3: 勝利時の挑戦者セリフ ※NPC配列のまま
  B3_result_lose: [
    'くっ…認めたくないが、やるじゃないか',
    '今回は負けを認める。だが次はこうはいかない',
    'まぐれだ…次は叩き潰してやる',
    '…っ！ 覚えてなさいよ。これで終わりじゃないから',
    '信じられない…こんな結果は認めない',
    'やるね。見直したよ…だけど、次は容赦しない',
    'ちょっとは楽しめたよ。でもこれで調子に乗らないことだね',
  ],
  // B3: 敗北時の挑戦者セリフ ※NPC配列のまま
  B3_result_win: [
    '言った通りだろう？ レベルが違うんだよ',
    'この程度か。期待外れだったな',
    '実力の差を思い知ったか？ 出直してきな',
    'あらら、もう終わり？ 物足りなかったなぁ',
    'まぁ、最初から分かってたことだけどね。お疲れさま',
    'やっぱりこの程度か。もう少し楽しませてくれると思ったのに',
    '現実は厳しいでしょ？ 鍛え直してからまたおいで',
  ],
  // B4: 密着取材 — 選ばれた選手のセリフ
  B4: {
    normal: {
      _default: ['取材…緊張しますが、いい試合を見せられるよう頑張ります'],
      ojousama: ['取材ですの？ 精一杯務めさせていただきますわ'],
      delinquent: ['取材？ やってやるよ！'],
      seductive: ['取材ね…いい姿を見せてあげるわ'],
    },
    bold: {
      _default: ['いい機会だ。全国に私の実力を見せてやる', '団体の代表として、恥ずかしくない姿を見せる'],
      ojousama: ['全国の皆様に、この実力をお見せしますわ'],
      delinquent: ['全国に見せてやるぜ！かかってこい！'],
      cool: ['…いい機会だ。結果で語る'],
      seductive: ['全国に見てもらえるのね。楽しみだわ'],
    },
    quiet: {
      _default: ['…がんばります'],
      cool: ['…やる。見ていてくれ'],
      polite: ['…精一杯、頑張らせていただきます'],
    },
    shy: {
      _default: ['え…わ、私なんかでいいんですか…？ が、頑張ります…！'],
    },
    easygoing: {
      _default: ['マジで！？ テレビに出れるの！？ やったー！', 'ファンの皆さんにもっと近い姿を見せられるね！'],
      delinquent: ['テレビ！？ マジ！？ やったー！'],
      seductive: ['テレビに出れるの？ 嬉しい。もっと見てもらえるわね'],
    },
    earnest: {
      _default: ['私なんかでいいんですか？ …精一杯頑張ります！'],
      polite: ['私でよろしいんですか…？ 精一杯務めさせていただきます'],
      ojousama: ['私でよろしいのですか…？ 精一杯頑張りますわ'],
      seductive: ['私でいいの？ …精一杯頑張るわ'],
    },
    emotional: {
      _default: ['えっ…テレビ…！？ 私が…！？ 頑張ります…！頑張ります…！'],
    },
  },
};

const MEDIA_OUTLET_NAMES = [
  'プロレス・ジャーナル', 'ファイトTV', '格闘技ウォッチ',
  'リングサイド・マガジン', 'バトルステーション',
];

// ─────────────────────────────────────────────────────────────────────────────
// v2.1: エンディング演出セリフ — ending-gameover-spec-v1.0.md §1.4
// ─────────────────────────────────────────────────────────────────────────────
const ENDING_LINES = {
  fighter: {
    normal: {
      _default: ['この団体で戦えて、本当に良かった', '入団した時は、まさかここまで来れるなんて思わなかった', '最高の仲間と、最高の舞台。感謝しかない'],
      ojousama: ['ここまで来れましたのね…感無量ですわ'],
      delinquent: ['やってやったぜ！最高だ！'],
      seductive: ['ここまで来れたのね…最高の気分だわ'],
    },
    bold: {
      _default: ['ここが頂点…でもまだ先がある気がする', 'ここで終わりじゃない。もっと強くなって、もっと上を目指す', '私たちの戦いが業界を変えた。誇りに思う'],
      ojousama: ['頂点に立ちましたわ。でもまだ先がありますの'],
      delinquent: ['てっぺん獲ったぜ！でもまだまだこれからだ！'],
      cool: ['…頂点だ。だが、まだ先がある'],
      seductive: ['頂点に立ったわ。でもまだ先があるの'],
    },
    quiet: {
      _default: ['………ありがとうございました（静かに涙を流している）'],
      cool: ['…ここまで来た。それだけだ'],
      polite: ['…ここまで来れて…ありがとうございます'],
    },
    shy: {
      _default: ['こ、こんなに幸せなことがあっていいのかな…'],
    },
    easygoing: {
      _default: ['みんなで掴んだ頂点だ！最高のチームだよ！', 'お金がなかった頃のことを思い出すと…よくここまで来たよね'],
      delinquent: ['最高だぜ！みんなありがとな！'],
      seductive: ['最高の景色ね。みんなのおかげだわ'],
    },
    earnest: {
      _default: ['練習してきたことが全部報われた。泣きそう', 'あの時辞めなくてよかった。この瞬間のために全部あったんだ'],
      polite: ['積み重ねてきた全てが報われました…ありがとうございます'],
      ojousama: ['努力が報われましたわ…感謝しかありませんの'],
      seductive: ['積み重ねてきた全部が報われた…泣きそうだわ'],
    },
    emotional: {
      _default: ['涙が止まらない…！こんなに幸せなことがあっていいのかな…！', 'みんなありがとう…！最高だよ…！'],
    },
  },
  coach: [
    'よくぞここまで……立派になった',
    'あの選手たちを見ていると、指導者冥利に尽きる',
    '私の教え子たちが業界の頂点に。これ以上の喜びはない',
    'まだまだ伸びる選手ばかりだ。楽しみは尽きないよ',
    'ここが終着点じゃない。さらに上の景色を見せてやる',
    '選手たちの努力が実を結んだ。私は見守っただけだ',
    '苦しい時期を乗り越えた選手たちの姿に……涙が出そうだ',
    '全員が成長した。一人の脱落者も出さなかった。それが誇りだ',
    'この子たちとなら、もっと高い場所を目指せる',
    '指導者として、これ以上の幸せはないよ',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.0 Phase1-7: 逆境チームスピリットテキスト
// ─────────────────────────────────────────────────────────────────────────────
const TEAM_SPIRIT_TEXTS = [
  { text: '🔥 苦しい中でもチームの結束が深まった', detail: '資金繰りは厳しいが、選手たちの表情に迷いはない。困難を共にすることで、絆が強まっているようだ。' },
  { text: '💪 逆境がチームを強くしている', detail: '豪華な設備も潤沢な資金もない。だからこそ、選手同士で支え合う文化が自然に生まれている。' },
  { text: '🤝 厳しい時期だからこそ仲間の大切さを実感', detail: '決して恵まれた環境ではない。それでも、誰一人として文句を言わずに練習に打ち込む姿がある。' },
  { text: '✊ チーム全員が同じ方向を向いている', detail: '苦しい状況を全員で分かち合っている。この経験が、いつかチームの財産になるはずだ。' },
];

// ─────────────────────────────────────────────────────────────────────────────
// §3 ロッカールーム可視化: 雰囲気テキスト（5段階×3-4パターン）
// ─────────────────────────────────────────────────────────────────────────────
const ATMOSPHERE_TEXTS = [
  // Level 1 (displayScore 0-20)
  [{ emoji:'😶', text:'練習場が静まり返っている' }, { emoji:'😶', text:'誰も目を合わせようとしない' }, { emoji:'😶', text:'重い空気が漂っている' }],
  // Level 2 (21-40)
  [{ emoji:'🌥', text:'どこかよそよそしい空気がある' }, { emoji:'🌥', text:'最低限のメニューだけこなしている' }, { emoji:'🌥', text:'会話が少ない' }],
  // Level 3 (41-60)
  [{ emoji:'☁', text:'淡々とメニューをこなしている' }, { emoji:'☁', text:'いつも通りの練習風景' }, { emoji:'☁', text:'特に変わった様子はない' }, { emoji:'☁', text:'黙々と汗を流している' }],
  // Level 4 (61-80)
  [{ emoji:'🌤', text:'声が飛び交っている' }, { emoji:'🌤', text:'練習に熱が入っている' }, { emoji:'🌤', text:'選手同士でアドバイスし合っている' }, { emoji:'🌤', text:'活気のある練習場' }],
  // Level 5 (81-100)
  [{ emoji:'🔥', text:'自主練する選手が増えている' }, { emoji:'🔥', text:'練習場に笑い声が響いている' }, { emoji:'🔥', text:'全員の目つきが違う' }, { emoji:'🔥', text:'チーム全体に勢いがある' }],
];

// ─────────────────────────────────────────────────────────────────────────────
// §2 観察眼システム: コーチ報告テキスト（ランク別）
// ─────────────────────────────────────────────────────────────────────────────
const COACH_REPORT_TEXTS = {
  // E-D rank: 名前なし・漠然とした雰囲気
  vague: [
    '最近、練習に身が入っている選手がいるようです',
    'ちょっと元気のない選手がいますね',
    '練習場の雰囲気は悪くないですよ',
    '全体的にまずまずの仕上がりですね',
    '最近、動きが良くなってきた選手がいます',
    'ちょっと伸び悩んでいる選手がいるかもしれません',
  ],
  // C rank: 選手名+ムード
  named_positive: [
    '{name}選手、調子が良さそうですね',
    '{name}選手、最近いい感じに仕上がってきています',
    '{name}選手の動きに勢いを感じます',
  ],
  named_negative: [
    '{name}選手、少し調子が落ちているかもしれません',
    '{name}選手、ちょっと練習に集中できていない様子です',
    '{name}選手、最近少し元気がないですね',
  ],
  named_neutral: [
    '{name}選手は安定していますよ',
    '{name}選手、特に問題はないようです',
    '{name}選手はマイペースにやっています',
  ],
  // B rank: 選手名+具体的ステータス
  stat_growing: [
    '{name}選手の{stat}が伸びてきています',
    '{name}選手、{stat}の成長が見られますね',
    '{name}選手の{stat}に手応えを感じます',
  ],
  stat_stagnant: [
    '{name}選手の{stat}、最近伸びが止まっている気がします',
    '{name}選手、{stat}はちょっと頭打ち気味ですかね',
    '{name}選手の{stat}、ここから先は時間がかかるかもしれません',
  ],
  // A rank: 天井接近ヒント（trainCap）
  near_cap: [
    '{name}選手の{stat}、そろそろ頭打ちかもしれません',
    '{name}選手の{stat}はもう伸びしろが少ないと思います',
    '{name}選手の{stat}、限界に近づいている気がします',
  ],
  far_from_cap: [
    '{name}選手の{stat}、まだまだ伸びますよ',
    '{name}選手の{stat}にはまだ余力がありますね',
    '{name}選手の{stat}の成長余地は十分です',
  ],
};
const STAT_LABELS_JP = { pw:'パワー', sp:'スピード', te:'テクニック', st:'スタミナ' };
const COACH_OBS_INACCURACY = { E:0, D:0, C:0.20, B:0.20, A:0.08 }; // 🔧 的外れ確率

// ─────────────────────────────────────────────────────────────────────────────
// スナップショット通知テキスト — snapshot-engine-instruction.md
// ─────────────────────────────────────────────────────────────────────────────
const SNAPSHOT_TEXTS = {
  // ── G1: 給与不公平 ──
  G1: {
    scene: [
      '給料日。{name}が明細をじっと見つめていた',
      '{name}が食堂で同僚たちの輪に入らず、黙って食事をしていた',
      '{name}がロッカールームで、誰かの契約書をちらりと見ていた',
    ],
    voice: {
      normal: {
        _default: ['…まあ、こんなもんか', '…頑張ってるのにな'],
        ojousama: ['…お金のことで文句を言うつもりはないけれど'],
        delinquent: ['…チッ'],
      },
      bold: {
        _default: ['…なんであの子と同じ扱いなわけ？', '…納得いかない'],
        ojousama: ['…わたくしの価値、ちゃんと見てくださっているのかしら'],
        delinquent: ['…ふざけんなよ'],
      },
      quiet: {
        _default: ['…'],
        cool: ['…'],
      },
      earnest: {
        _default: ['…もっと結果を出せばいいだけの話、だよね', '…自分の力不足かな'],
        ojousama: ['…努力が足りないのかしら。でも…'],
      },
      emotional: {
        _default: ['…なんで…なんでだろ', '…悔しいな'],
        delinquent: ['…やってられっかよ'],
      },
    },
  },

  // ── G2: 後輩の方が給与が高い ──
  G2: {
    scene: [
      '{name}が後輩の{name2}の試合を腕を組んで見ていた。複雑な表情だ',
      '{name}が{name2}に技を教えている。だが、その目にどこか翳りがある',
    ],
    voice: {
      normal: {
        _default: ['…あの子、伸びたな', '…先輩としてちゃんと見てるよ。…でもね'],
      },
      bold: {
        _default: ['…年功序列なんて古い。分かってる。分かってるけど', '…あたしだって負けてない'],
        delinquent: ['…ガキが調子乗ってんじゃねーよ'],
      },
      quiet: {
        _default: ['…'],
        cool: ['…そう。それだけのことだ'],
      },
      earnest: {
        _default: ['…あの子が評価されるのは正しいと思う。思うんだけど'],
      },
      emotional: {
        _default: ['…先に始めたのはあたしなのに', '…置いていかれてる気がする'],
      },
    },
  },

  // ── G3: タイトルに絡めない ──
  G3: {
    scene: [
      '{name}がタイトルマッチのポスターの前で足を止めていた',
      '{name}が練習中、いつもより打ち込みが荒い。何かを持て余している',
      'タイトル戦の話題が出た時、{name}だけが黙っていた',
    ],
    voice: {
      normal: {
        _default: ['…いつになったら'],
      },
      bold: {
        _default: ['…いつになったらあたしの番が来るの？', '…待つのは好きじゃない'],
        ojousama: ['…わたくしにふさわしい舞台がまだ来ないなんて'],
        delinquent: ['…いい加減使えよ。腐るぞ'],
      },
      quiet: {
        _default: ['…'],
        cool: ['…チャンスは自分で作るものだと思っている'],
      },
      earnest: {
        _default: ['…実力が足りないから？ それとも…', '…もう少し、待てばいいのかな'],
      },
      emotional: {
        _default: ['…悔しくないって言ったら嘘になる', '…あたしも、あそこに立ちたい'],
        seductive: ['…もう少し目立たないとダメなのかしら'],
      },
    },
  },

  // ── G4: ロスター過密 ──
  G4: {
    scene: [
      '{name}が試合のない週末を持て余しているようだ',
      '控え室の隅で、{name}がストレッチをしている。出番を待つ背中に焦りが見える',
      '{name}が自主練の後、一人でリングを見つめていた',
    ],
    voice: {
      normal: {
        _default: ['…出番、来ないかな'],
      },
      bold: {
        _default: ['…使ってくれなきゃ意味ないじゃん', '…あたしの居場所、あるのかな'],
      },
      quiet: {
        _default: ['…'],
      },
      earnest: {
        _default: ['…準備はできてる。いつでも'],
      },
      emotional: {
        _default: ['…見てくれてるのかな、あたしのこと'],
      },
    },
  },

  // ── R1: 低bond同興行 ──
  R1: {
    scene: [
      '{name}と{name2}が控え室で目を合わせなかった',
      '{name}と{name2}の間に、見えない壁がある。周りもそれを感じている',
      '{name}と{name2}が同じテーブルに座ることを避けていた',
    ],
    staff: [
      'スタッフから: {name}と{name2}、最近どうも空気がピリついてまして…',
    ],
  },

  // ── R2: 孤立 ──
  R2: {
    scene: [
      '昼休み。他の選手たちが談笑する中、{name}だけが離れた場所にいた',
      '{name}が一人でリングの片付けをしている。手伝う者はいない',
      '練習後の更衣室。{name}のロッカーの周りだけ、少し空間が空いている',
    ],
    voice: {
      normal: {
        _default: ['…まあ、一人のほうが気楽だし'],
      },
      bold: {
        _default: ['…別にいいけど。あたしは一人でやれるし'],
        delinquent: ['…ハッ、群れるのは趣味じゃねーんだよ'],
      },
      quiet: {
        _default: ['……'],
        cool: ['…孤独には慣れている'],
      },
      earnest: {
        _default: ['…もっとみんなと話した方がいいのかな'],
        polite: ['…何か気に障ることをしたのでしょうか'],
      },
      emotional: {
        _default: ['…みんな、あたしのこと嫌いなのかな', '…ここにいていいのかな'],
        ojousama: ['…こういう寂しさは初めてですわ'],
      },
    },
  },

  // ── R3: 仲良し退団/引退 ──
  R3: {
    scene: [
      '{name}は{name2}の退団を知り、しばらく言葉を失っていた',
      '{name2}がいなくなったロッカーの前で、{name}が立ち止まっていた',
    ],
    modal: {
      normal: {
        _default: ['…いなくなっちゃうんだ', '…{name2}がいない控え室なんて想像できない'],
      },
      bold: {
        _default: ['…バカ。何も言わずに行くなよ', '…あいつがいないと、張り合いがない'],
        delinquent: ['…チッ。…寂しいなんて言わねーけど'],
      },
      quiet: {
        _default: ['……'],
        cool: ['…そうか。…分かった'],
      },
      earnest: {
        _default: ['{name2}のために、あたしはここで頑張るから', '…ありがとう。ずっと支えてくれて'],
        polite: ['{name2}さんとご一緒できて幸せでした。…お元気で'],
      },
      emotional: {
        _default: ['…やだ。嫌だよ。なんで…', '…{name2}がいないなんて、あたし…'],
        ojousama: ['…{name2}。……あなたがいなくなるなんて'],
      },
    },
  },

  // ── R4: ライバルに勝利 ──
  R4: {
    scene: [
      '試合後、{name}の目に静かな炎が燃えていた',
      '{name}がリングを降りる時、一瞬だけ{name2}のほうを振り返った。満足げに',
    ],
    voice: {
      normal: {
        _default: ['…やっと、追いついた'],
      },
      bold: {
        _default: ['…ふん。まだまだこんなもんじゃないけどね', '…勝った。でも、まだ終わってない'],
        delinquent: ['…ザマァ見ろ'],
      },
      quiet: {
        _default: ['…'],
        cool: ['…次も同じ結果とは限らない。気を引き締めろ、自分'],
      },
      earnest: {
        _default: ['…努力は裏切らない。…{name2}、ありがとう'],
      },
      emotional: {
        _default: ['…勝った…勝ったよ…！', '…泣くな、あたし。まだ先がある'],
      },
    },
  },

  // ── R5: ライバルに敗北 ──
  R5: {
    scene: [
      '{name}は無言でリングを降りた。その拳だけが震えていた',
      '{name}が帰り際、振り返って{name2}のほうを一瞬だけ見た',
      '試合後の通路で、{name}が壁を叩く音がした',
    ],
    voice: {
      normal: {
        _default: ['…まだ、足りないのか', '…くやしい'],
      },
      bold: {
        _default: ['…次は絶対に負けない', '…この借りは必ず返す'],
        delinquent: ['…クソッ…！'],
      },
      quiet: {
        _default: ['…'],
        cool: ['…敗因は分かっている。次までに修正する'],
      },
      earnest: {
        _default: ['…あの人にはまだ勝てない。でも、だからこそ', '…もっと練習する。絶対に'],
      },
      emotional: {
        _default: ['…悔しい…悔しい…！', '…なんであたしは勝てないの'],
        ojousama: ['…こんなはずでは…こんなはずでは、ないのに'],
      },
    },
  },

  // ── 性格不一致の摩擦（Phase 4系） ──
  friction: {
    scene: [
      '{name}と{name2}が練習メニューの順番で揉めていた。些細なことだが',
      '{name}が{name2}の練習態度について、小声で何か言っていた',
      '{name}と{name2}が同時に控え室に入った瞬間、空気が変わった',
    ],
    staff: [
      'スタッフから: {name}と{name2}、ちょっと相性が良くないみたいで…',
    ],
  },

  // ── 世代近接のポジティブ（Phase 4系） ──
  generation: {
    scene: [
      '{name}と{name2}が一緒に帰っていく姿が見えた。同世代の気安さがある',
      '{name}と{name2}が自販機の前で笑い合っていた。何が面白いのか、こちらには分からないが',
      '{name}が{name2}を自主練に誘っている。いい雰囲気だ',
      '{name}と{name2}が昼食を一緒に取っている。どうやら仲がいいらしい',
    ],
  },

  // ── 因縁解消後のくすぶり（Phase 4系） ──
  rivalryResolved: {
    scene: [
      '決着はついた。だが{name}と{name2}が目を合わせた時、そこにはまだ何かがあった',
      '因縁は終わった。はずだ。…だが{name}は{name2}の動向を気にしている',
    ],
  },

  // ── 自己ベストMQ更新 ──
  careerBestMQ: {
    scene: [
      '{name}が試合後、自分の両手を見つめていた。何かを掴んだ表情だ',
      '{name}の試合が終わった後、先輩たちが小さく頷いていた',
    ],
  },

  // ── ブレイクスルーでtrust上昇（embedded: 既存演出に1行追加） ──
  breakthrough: {
    voice: {
      normal: {
        _default: ['…ここで頑張ってきてよかった'],
      },
      bold: {
        _default: ['…まだまだ強くなれる！この団体でなら'],
      },
      quiet: {
        _default: ['…この場所に感謝している'],
        cool: ['…環境に恵まれた。それは認める'],
      },
      earnest: {
        _default: ['…みんなのおかげです。もっと恩返しがしたい'],
      },
      emotional: {
        _default: ['…うれしい…ここにいてよかった'],
      },
    },
  },

  // ── 対抗戦勝利（embedded: 対抗戦結果モーダルに追加） ──
  warVictory: {
    scene: [
      '{name}はチームの勝利に拳を握りしめた。この団体の看板を背負う覚悟が見えた',
    ],
    voice: {
      bold: {
        _default: ['…あたしが勝つんだよ。この団体を背負ってるんだから'],
      },
      earnest: {
        _default: ['…みんなの想いを背負って戦えて光栄です'],
      },
      emotional: {
        _default: ['…勝った…！ みんなのおかげだよ…！'],
      },
      quiet: {
        _default: ['…'],
        cool: ['…当然の結果だ'],
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PPV GRAND FINAL 設定 — ppv-grand-final-spec-v2.0.md
// ─────────────────────────────────────────────────────────────────────────────
const PPV_UNLOCK_POP = 30;  // 出場解禁に必要な orgPop
const PPV_SLOTS = { 1: 5, 2: 4, 3: 3, 4: 2 };  // ランク→出場枠数
const PPV_REWARD = { 1: 300, 2: 200, 3: 150, 4: 100 };  // ランク→出場報酬（万円）
const PPV_ENTRY_WEEK = 43;  // エントリー受付週
const PPV_SHOW_WEEK = 48;   // PPV開催週

const PPV_NAMES = [
  'GENESIS', 'STARDOM FINAL', 'GRAND CLASH',
  'BURNING SPIRIT', "QUEEN'S SUMMIT", 'DREAM FESTIVAL',
  'ULTIMATE GLORY', 'CROWN JEWEL', 'FIGHTING DESTINY',
  'RISING STAR', 'ETERNAL CLASH', 'GLORY ROAD'
];

const PPV_OPPONENT_LINES = {
  normal: {
    _default: ['悪いけど、今日は負けるわけにはいかないの', 'この大舞台、最高の気分ね', '正々堂々、最高の試合にしましょう'],
    ojousama: ['本日は負けるわけにはまいりませんわ'],
    delinquent: ['今日は負けねーぞ。かかってこい'],
    seductive: ['今日は負けるわけにはいかないの。覚悟してね'],
  },
  bold: {
    _default: ['ぶっ潰してやる！', '私の実力、思い知らせてやる', '容赦しない。覚悟しろ'],
    ojousama: ['容赦いたしませんわよ。覚悟なさって'],
    delinquent: ['ぶっ潰してやるぜ！泣いても知らねーぞ！'],
    cool: ['…手加減はしない。覚悟しろ'],
    seductive: ['容赦しないわよ。覚悟してね'],
  },
  quiet: {
    _default: ['……（静かに構えている）'],
    cool: ['…結果で語る'],
    polite: ['…全力で参ります'],
  },
  shy: {
    _default: ['が、頑張ります…！'],
  },
  easygoing: {
    _default: ['この大舞台、最高の気分！楽しもうぜ！', 'あんたと戦えるの楽しみにしてた！'],
    delinquent: ['最高だぜ！楽しもうや！'],
    seductive: ['あなたと戦えるの、楽しみだったわ'],
  },
  earnest: {
    _default: ['お互い全力で…最高の舞台だもの', 'この対戦、ずっと待ってました'],
    polite: ['お互い全力で…よろしくお願いいたします'],
    ojousama: ['全力で参りますわ。よろしくお願いいたしますの'],
    seductive: ['全力でいくわ。最高の試合にしましょう'],
  },
  emotional: {
    _default: ['絶対…絶対負けない…！全力でいく…！'],
  },
};

const PPV_HYPE_TEMPLATES = {
  rivalry: [
    '因縁の対決！{name1}と{name2}、この大舞台で決着なるか！',
    '積み重ねてきた因縁——{name1}と{name2}の物語が、ここで動く！',
  ],
  tierGap: [
    '{org2}の壁！{name1}は{name2}を越えられるか！',
    '格上挑戦！{name1}が{org2}の{name2}に挑む！',
  ],
  closeOVR: [
    '実力伯仲！{name1}と{name2}、どちらが勝ってもおかしくない！',
    '互角の実力——勝敗を分けるのは、この一瞬の判断！',
  ],
  starMatch: [
    'スター対決！{name1}と{name2}、夢のカードが実現！',
    '人気者同士の激突！{name1} vs {name2}、会場が沸く！',
  ],
  summit: [
    '団体の威信を懸けた頂上決戦！{name1} vs {name2}！',
    '年間王者を決める最終決戦——{name1}と{name2}、頂点に立つのはどちらだ！',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.1: クレジット情報 — ending-gameover-spec-v1.0.md §4.4
// ─────────────────────────────────────────────────────────────────────────────
const CREDITS = {
  music: [
    {
      title:   '8bit/RPG/オープニング「序・序曲」',
      artist:  'MOMIZizm MUSiC（モミジズム ミュージック）',
      source:  'STORY INVENTION',
      url:     'https://music.storyinvention.com/',
      license: 'フリー音楽素材',
    },
  ],
};

// Node.js モジュールエクスポート（ブラウザではスキップ）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ALL_CHARS, CHAR_PROFILES, TRAIT_DEFS, Traits, ROSTER_CFG, CHAR_GROUP,
    PORTRAIT, COACH_PORTRAIT, MAX_T, PHASES, ENG, SALARY_PARAMS, FAN_EXPECT_REACTIONS,
    VENUES, BASE_ATTENDANCE_CURVE, TICKET_PRICE, GOODS_PRICE, OCCUPANCY_BONUS,
    MOMENTUM_CONFIG, WEEKLY_FLUCTUATION, ATTENDANCE_PREDICTION,
    CARD_POP_CONFIG, CARD_DEPTH_MULT, CROWD_HEAT_MQ, VENUE_SCALE_MQ,
    SCANDAL_CONFIG, LOSING_STREAK_PENALTIES, PROMO_POP_CAP, PROMO_MQ_PER_STACK, PROMO_EVENT_INCOME, PROMO_EVENT_NAMES, TRANSFER_POP_MULT,
    SPONSOR_TABLE, BROADCAST_TABLE, FIXED_COSTS, SUBSIDY_TABLE,
    HEAT_LEVELS, QUARTER_LABELS, INJURY_TABLE, INJURY_DEBUFF_TABLE,
    TITLES, RIVALRY_THRESHOLDS, RIVALRY_CONFRONTATION_LINES, RIVALRY_RESOLUTION_LINES,
    MQ_EXTERNAL_CAP, GOODRIVAL_MQ_BONUS, GOODRIVAL_LABEL, GOODRIVAL_EMOJI, GOODRIVAL_COLOR,
    FRESHNESS_CONFIG, COACH_RANKS, COACH_STYLE_MAP, COACH_STYLE_BONUS,
    COACH_SLOT_THRESHOLDS, COACH_POOL_CFG, COACH_TRAIT_DEFS, ALL_COACHES,
    COACH_HIRE_FEE, COACH_MAX_ASSIGN,
    GROWTH_CONFIG,
    RIVAL_ORG_NAME_POOL, RIVAL_ORGS, BATTLE_POINT_CFG, RANKING_CONFIG,
    SCOUT_GIVENNAMES, SCOUT_TRAITS_POOL, SCOUT_EVENT_CFG,
    STYLE_GROWTH, STAR_POWER, RETIRE_CFG, WEAR_TABLE,
    AI_SCOUT_CFG, AI_TIER_LIMITS, AI_SEASON_CFG,
    TRANSFER_CONFIG, RENTAL_CONFIG, EVENT_CONFIG, NEGOTIATION_CONFIG,
    CONTRACT_NEGOTIATION_LINES, CONTRACT_NEGOTIATION_CONFIG,
    NEGOTIATE_LINES, RETIREMENT_LINES, RETIRE_ACCEPT_LINES, RETIRE_REFUSE_LINES,
    RETAIN_LINES, COACH_RETIRE_ADVICE_TEXTS,
    AWARD_LINES, BT_HINT_LINES, BREAKTHROUGH_LINES, getDialoguePool, pickDialogueLine,
    SLUMP_START_LINES, SLUMP_END_LINES,
    MOTIVATION_LOSS_LINES, MOTIVATION_RECOVERY_LINES,
    AI_BREAKTHROUGH_NEWS, AI_SLUMP_NEWS, AI_MOTIVATION_LOSS_NEWS,
    NEWS_TICKER_TEMPLATES, NEWS_HEADLINE_TEMPLATES, BESTMATCH_FLAVOR,
    MILESTONE_EVENTS, NOTIF_EVENT_TEXTS, NOTIF_DIALOGUES,
    CARE_ACTIONS, CAMP_FLAVOR_TEXTS, CARE_REACTION_DIALOGUES,
    CHOICE_EVENT_DIALOGUES, LARGE_EVENT_TEXTS, LARGE_EVENT_DIALOGUES,
    MEDIA_OUTLET_NAMES, ENDING_LINES, TEAM_SPIRIT_TEXTS, ATMOSPHERE_TEXTS,
    COACH_REPORT_TEXTS, STAT_LABELS_JP, COACH_OBS_INACCURACY, SNAPSHOT_TEXTS,
    PPV_UNLOCK_POP, PPV_SLOTS, PPV_REWARD, PPV_ENTRY_WEEK, PPV_SHOW_WEEK,
    PPV_NAMES, PPV_OPPONENT_LINES, PPV_HYPE_TEMPLATES, CREDITS,
    DRAFT_CONFIG, ORG_ASSIGN, generateDraftConfig, seededShuffle,
    SALARY_PARAMS, LOSING_STREAK_PENALTIES,
  };
}
