// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 1: CHARACTER DATA                               ║
// ╚══════════════════════════════════════════════════════════╝
const ALL_CHARS = [
  {id:1,name:'阿武隈塔子',h:173,pw:95,sp:73,te:71,st:81,mn:80,style:'Grappler',role:'Babyface',pot:{pw:184,sp:155,te:152,st:165,mn:164},traits:['リーダー気質','人望','威圧感','引き出し上手','頑丈さ']},
  {id:2,name:'富岡加奈子',h:168,pw:90,sp:68,te:70,st:76,mn:83,style:'Grappler',role:'Babyface',pot:{pw:177,sp:148,te:151,st:159,mn:168},traits:['努力家','遅咲き','頑丈さ']},
  {id:3,name:'澤出みずき',h:158,pw:73,sp:78,te:73,st:73,mn:72,style:'Allround',role:'Neutral',pot:{pw:155,sp:161,te:155,st:155,mn:154},traits:['引き出し上手','早熟','適応力']},
  {id:4,name:'高津小春',h:161,pw:73,sp:75,te:47,st:79,mn:91,style:'Striker',role:'Babyface',pot:{pw:155,sp:158,te:121,st:163,mn:178},traits:['晩成','番狂わせ体質','負けず嫌い','闘志']},
  {id:5,name:'深町真琴',h:160,pw:58,sp:91,te:62,st:85,mn:63,style:'Speed',role:'Babyface',pot:{pw:135,sp:178,te:141,st:170,mn:142},traits:['努力家','華','鉄人']},
  {id:6,name:'副沢たまき',h:161,pw:71,sp:68,te:74,st:68,mn:68,style:'Allround',role:'Neutral',pot:{pw:152,sp:148,te:156,st:148,mn:148},traits:['ムードメーカー','早熟','破天荒']},
  {id:7,name:'高階まさみ',h:161,pw:58,sp:62,te:73,st:63,mn:66,style:'Submission',role:'Babyface',pot:{pw:135,sp:141,te:155,st:142,mn:146},traits:['引き出し上手','忠誠心']},
  {id:8,name:'林真尋',h:174,pw:71,sp:73,te:43,st:61,mn:52,style:'Striker',role:'Neutral',pot:{pw:152,sp:155,te:116,st:139,mn:128},traits:['負けず嫌い']},
  {id:9,name:'宇田川里奈',h:167,pw:51,sp:62,te:54,st:63,mn:41,style:'Speed',role:'Neutral',pot:{pw:126,sp:141,te:130,st:142,mn:113},traits:['ファンサービス']},
  {id:11,name:'橘玲美',h:171,pw:71,sp:73,te:91,st:75,mn:74,style:'Submission',role:'Heel',pot:{pw:152,sp:155,te:178,st:158,mn:156},traits:['ヒール適性','威圧感','早熟','華']},
  {id:12,name:'生駒エリカ',h:153,pw:78,sp:71,te:55,st:82,mn:82,style:'Grappler',role:'Babyface',pot:{pw:161,sp:152,te:132,st:167,mn:167},traits:['人望','負けず嫌い','鉄人','闘志']},
  {id:13,name:'堂前ユキ',h:163,pw:81,sp:84,te:43,st:64,mn:73,style:'Striker',role:'Neutral',pot:{pw:165,sp:169,te:116,st:143,mn:155},traits:['破天荒']},
  {id:14,name:'黒江舞',h:159,pw:48,sp:52,te:76,st:58,mn:67,style:'Submission',role:'Heel',pot:{pw:122,sp:128,te:159,st:135,mn:147},traits:['ヒール適性','早熟']},
  {id:15,name:'楠木なぎさ',h:178,pw:79,sp:65,te:21,st:66,mn:62,style:'Brawler',role:'Babyface',pot:{pw:163,sp:144,te:87,st:146,mn:141},traits:['威圧感']},
  {id:16,name:'大河内紗代子',h:164,pw:93,sp:76,te:66,st:69,mn:77,style:'Striker',role:'Heel',pot:{pw:181,sp:159,te:146,st:150,mn:160},traits:['リーダー気質','威圧感','華','野心']},
  {id:17,name:'川野辺菜穂子',h:168,pw:66,sp:80,te:69,st:71,mn:76,style:'Speed',role:'Babyface',pot:{pw:146,sp:164,te:150,st:152,mn:159},traits:['ライバル体質','名勝負製造機','華','負けず嫌い']},
  {id:18,name:'出羽鷹子',h:181,pw:85,sp:54,te:75,st:66,mn:62,style:'Grappler',role:'Heel',pot:{pw:170,sp:130,te:158,st:146,mn:141},traits:['適応力']},
  {id:19,name:'四条あずさ',h:163,pw:64,sp:68,te:62,st:67,mn:62,style:'Allround',role:'Neutral',pot:{pw:143,sp:148,te:141,st:147,mn:141},traits:['忠誠心','適応力']},
  {id:20,name:'岸ゆみえ',h:155,pw:48,sp:53,te:78,st:64,mn:78,style:'Submission',role:'Babyface',pot:{pw:122,sp:129,te:161,st:143,mn:161},traits:['努力家','遅咲き']},
  {id:21,name:'木ノ内幸音',h:164,pw:66,sp:53,te:53,st:68,mn:67,style:'Allround',role:'Heel',pot:{pw:146,sp:129,te:129,st:148,mn:147},traits:['ヒール適性','ムードメーカー','華']},
  {id:22,name:'美濃山まりな',h:173,pw:80,sp:38,te:48,st:59,mn:48,style:'Brawler',role:'Neutral',pot:{pw:164,sp:109,te:122,st:137,mn:122},traits:['ヒール適性']},
  {id:23,name:'早見知子',h:162,pw:51,sp:43,te:42,st:51,mn:41,style:'Striker',role:'Heel',pot:{pw:126,sp:116,te:115,st:126,mn:113},traits:['忠誠心']},
  {id:24,name:'園部梨花',h:158,pw:46,sp:48,te:41,st:42,mn:43,style:'Striker',role:'Heel',pot:{pw:120,sp:122,te:113,st:115,mn:116},traits:[]},
  {id:25,name:'石戸谷なつき',h:164,pw:61,sp:31,te:34,st:45,mn:38,style:'Brawler',role:'Heel',pot:{pw:139,sp:100,te:104,st:118,mn:109},traits:['早熟']},
  {id:26,name:'宮守なつめ',h:165,pw:62,sp:72,te:58,st:66,mn:63,style:'Allround',role:'Babyface',pot:{pw:141,sp:154,te:135,st:146,mn:142},traits:['努力家','早熟']},
  {id:27,name:'八重樫舞',h:167,pw:71,sp:63,te:42,st:66,mn:51,style:'Striker',role:'Babyface',pot:{pw:152,sp:142,te:115,st:146,mn:126},traits:['鉄人']},
  {id:28,name:'岩屋みら',h:169,pw:82,sp:74,te:62,st:55,mn:61,style:'Brawler',role:'Neutral',pot:{pw:167,sp:156,te:141,st:132,mn:139},traits:['ガラスの身体','早熟']},
  {id:29,name:'相沢未来',h:162,pw:73,sp:74,te:62,st:78,mn:74,style:'Allround',role:'Babyface',pot:{pw:155,sp:156,te:141,st:161,mn:156},traits:['人望']},
  {id:30,name:'松川杏樹',h:174,pw:76,sp:65,te:71,st:63,mn:71,style:'Grappler',role:'Neutral',pot:{pw:159,sp:144,te:152,st:142,mn:152},traits:['ムードメーカー','破天荒']},
  {id:31,name:'平松かなみ',h:158,pw:66,sp:58,te:75,st:72,mn:70,style:'Submission',role:'Babyface',pot:{pw:146,sp:135,te:158,st:154,mn:151},traits:['晩成']},
  {id:32,name:'双里明日香',h:161,pw:54,sp:61,te:68,st:67,mn:60,style:'Submission',role:'Babyface',pot:{pw:130,sp:139,te:148,st:147,mn:138},traits:['負けず嫌い']},
  {id:33,name:'梅ヶ丘みのり',h:163,pw:78,sp:71,te:76,st:80,mn:80,style:'Allround',role:'Babyface',pot:{pw:161,sp:152,te:159,st:164,mn:164},traits:['リーダー気質']},
  {id:34,name:'北畠吉乃',h:162,pw:68,sp:72,te:84,st:72,mn:69,style:'Submission',role:'Babyface',pot:{pw:148,sp:154,te:169,st:154,mn:150},traits:['早熟','破天荒']},
  {id:35,name:'上野原弥生',h:176,pw:82,sp:58,te:63,st:68,mn:58,style:'Grappler',role:'Neutral',pot:{pw:167,sp:135,te:142,st:148,mn:135},traits:['頑丈さ']},
  {id:36,name:'真鍋綾乃',h:178,pw:80,sp:54,te:65,st:63,mn:60,style:'Grappler',role:'Neutral',pot:{pw:164,sp:130,te:144,st:142,mn:138},traits:['頑丈さ']},
  {id:37,name:'白銀麗子',h:165,pw:74,sp:82,te:82,st:83,mn:78,style:'Allround',role:'Babyface',pot:{pw:156,sp:167,te:167,st:168,mn:161},traits:['不屈','華','頑丈さ']},
  {id:38,name:'芝彩音',h:164,pw:88,sp:64,te:67,st:78,mn:76,style:'Striker',role:'Babyface',pot:{pw:174,sp:143,te:147,st:161,mn:159},traits:['華','闘志']},
  {id:39,name:'神谷沙奈絵',h:161,pw:63,sp:76,te:64,st:65,mn:52,style:'Speed',role:'Neutral',pot:{pw:142,sp:159,te:143,st:144,mn:128},traits:['忠誠心']},
  {id:40,name:'高輪まみ',h:149,pw:51,sp:67,te:54,st:71,mn:71,style:'Speed',role:'Babyface',pot:{pw:126,sp:147,te:130,st:152,mn:152},traits:[]},
  {id:41,name:'根岸亞里亞',h:163,pw:68,sp:73,te:81,st:71,mn:71,style:'Submission',role:'Heel',pot:{pw:148,sp:155,te:165,st:152,mn:152},traits:['ヒール適性']},
  {id:42,name:'本郷真理子',h:170,pw:88,sp:67,te:49,st:66,mn:71,style:'Striker',role:'Neutral',pot:{pw:174,sp:147,te:124,st:146,mn:152},traits:['ヒール適性']},
  {id:43,name:'金沢文',h:181,pw:84,sp:59,te:48,st:58,mn:62,style:'Grappler',role:'Neutral',pot:{pw:169,sp:137,te:122,st:135,mn:141},traits:['頑丈さ']},
  {id:44,name:'福浦理乃',h:153,pw:46,sp:53,te:49,st:44,mn:43,style:'Allround',role:'Babyface',pot:{pw:120,sp:129,te:124,st:117,mn:116},traits:[]},
  {id:45,name:'高槻千歳',h:163,pw:71,sp:77,te:79,st:74,mn:74,style:'Allround',role:'Heel',pot:{pw:152,sp:160,te:163,st:156,mn:156},traits:['リーダー気質','華','野心']},
  {id:46,name:'井沢遥',h:165,pw:68,sp:73,te:82,st:64,mn:77,style:'Submission',role:'Babyface',pot:{pw:148,sp:155,te:167,st:143,mn:160},traits:['不屈','名勝負製造機','引き出し上手','負けず嫌い']},
  {id:47,name:'斎藤麻衣',h:156,pw:64,sp:68,te:76,st:69,mn:73,style:'Submission',role:'Neutral',pot:{pw:143,sp:148,te:159,st:150,mn:155},traits:['早熟']},
  {id:48,name:'菊池璃子',h:162,pw:73,sp:69,te:53,st:65,mn:78,style:'Striker',role:'Neutral',pot:{pw:155,sp:150,te:129,st:144,mn:161},traits:['負けず嫌い','適応力','闘志']},
  {id:49,name:'高橋まゆみ',h:161,pw:65,sp:60,te:57,st:73,mn:79,style:'Allround',role:'Babyface',pot:{pw:144,sp:138,te:134,st:155,mn:163},traits:['努力家','忠誠心','遅咲き']},
  {id:50,name:'相田萌',h:156,pw:64,sp:63,te:63,st:67,mn:55,style:'Allround',role:'Neutral',pot:{pw:143,sp:142,te:142,st:147,mn:132},traits:['ファンサービス','適応力']},
  {id:51,name:'三橋ふみえ',h:168,pw:63,sp:59,te:81,st:58,mn:50,style:'Submission',role:'Neutral',pot:{pw:142,sp:137,te:165,st:135,mn:125},traits:['ヒール適性','ファンサービス']},
  {id:52,name:'西川ちあき',h:171,pw:68,sp:58,te:48,st:58,mn:54,style:'Brawler',role:'Heel',pot:{pw:148,sp:135,te:122,st:135,mn:130},traits:[]},
  {id:53,name:'小森さなえ',h:164,pw:68,sp:48,te:38,st:58,mn:60,style:'Brawler',role:'Neutral',pot:{pw:148,sp:122,te:109,st:135,mn:138},traits:['ムードメーカー']},
  {id:54,name:'阿部みのり',h:154,pw:43,sp:40,te:38,st:48,mn:50,style:'Allround',role:'Babyface',pot:{pw:116,sp:112,te:109,st:122,mn:125},traits:[]},
  {id:55,name:'大久保桃子',h:163,pw:72,sp:73,te:74,st:71,mn:80,style:'Allround',role:'Babyface',pot:{pw:154,sp:155,te:156,st:152,mn:164},traits:['不屈','鉄人','頑丈さ']},
  {id:56,name:'片桐ありさ',h:167,pw:68,sp:63,te:80,st:68,mn:68,style:'Submission',role:'Neutral',pot:{pw:148,sp:142,te:164,st:148,mn:148},traits:['ヒール適性','ライバル体質','野心']},
  {id:57,name:'浅見里緒菜',h:158,pw:60,sp:58,te:74,st:61,mn:68,style:'Submission',role:'Heel',pot:{pw:138,sp:135,te:156,st:139,mn:148},traits:['リーダー気質','早熟','負けず嫌い','野心']},
  {id:58,name:'丹羽穂垂',h:169,pw:76,sp:54,te:63,st:64,mn:57,style:'Grappler',role:'Neutral',pot:{pw:159,sp:130,te:142,st:143,mn:134},traits:['引き出し上手','負けず嫌い']},
  {id:59,name:'池辺マリ',h:162,pw:70,sp:51,te:40,st:62,mn:53,style:'Brawler',role:'Heel',pot:{pw:151,sp:126,te:112,st:141,mn:129},traits:['負けず嫌い']},
  {id:60,name:'馬入橋ほとり',h:157,pw:82,sp:68,te:59,st:70,mn:78,style:'Grappler',role:'Babyface',pot:{pw:167,sp:148,te:137,st:151,mn:161},traits:['早熟','鉄人','頑丈さ']},
  {id:61,name:'観音崎せりか',h:169,pw:73,sp:73,te:67,st:63,mn:66,style:'Allround',role:'Heel',pot:{pw:155,sp:155,te:147,st:142,mn:146},traits:['ヒール適性','華','野心']},
  {id:62,name:'宮ケ瀬千夏',h:169,pw:70,sp:66,te:40,st:66,mn:50,style:'Brawler',role:'Heel',pot:{pw:151,sp:146,te:112,st:146,mn:125},traits:['ヒール適性','威圧感']},
  {id:63,name:'伊勢原文奈',h:158,pw:53,sp:58,te:56,st:55,mn:55,style:'Allround',role:'Babyface',pot:{pw:129,sp:135,te:133,st:132,mn:132},traits:['忠誠心']},
  {id:64,name:'湯本ほたる',h:160,pw:52,sp:58,te:51,st:54,mn:48,style:'Allround',role:'Neutral',pot:{pw:128,sp:135,te:126,st:130,mn:122},traits:[]},
  {id:65,name:'倉見菜々',h:161,pw:72,sp:73,te:77,st:79,mn:84,style:'Allround',role:'Neutral',pot:{pw:154,sp:155,te:160,st:163,mn:169},traits:['ファンサービス','名勝負製造機']},
  {id:66,name:'長谷川レオナ',h:164,pw:78,sp:70,te:78,st:69,mn:78,style:'Allround',role:'Neutral',pot:{pw:161,sp:151,te:161,st:150,mn:161},traits:['人望','引き出し上手']},
  {id:67,name:'柳島みずほ',h:165,pw:83,sp:61,te:68,st:73,mn:83,style:'Grappler',role:'Babyface',pot:{pw:168,sp:139,te:148,st:155,mn:168},traits:['ファンサービス','華','野心']},
  {id:68,name:'大庭愛菜',h:155,pw:68,sp:77,te:52,st:70,mn:76,style:'Striker',role:'Babyface',pot:{pw:148,sp:160,te:128,st:151,mn:159},traits:['負けず嫌い']},
  {id:69,name:'早川モナ',h:162,pw:63,sp:74,te:63,st:74,mn:64,style:'Speed',role:'Babyface',pot:{pw:142,sp:156,te:142,st:156,mn:143},traits:['華','負けず嫌い']},
  {id:70,name:'浜竹美咲',h:166,pw:80,sp:57,te:63,st:68,mn:68,style:'Striker',role:'Neutral',pot:{pw:164,sp:134,te:142,st:148,mn:148},traits:['引き出し上手','忠誠心']},
  {id:71,name:'東金沙織',h:167,pw:70,sp:62,te:69,st:62,mn:67,style:'Allround',role:'Neutral',pot:{pw:151,sp:141,te:150,st:141,mn:147},traits:['ファンサービス']},
  {id:72,name:'穴澤ほのか',h:167,pw:74,sp:58,te:65,st:63,mn:70,style:'Striker',role:'Neutral',pot:{pw:156,sp:135,te:144,st:142,mn:151},traits:['ファンサービス','引き出し上手','野心']},
  {id:73,name:'大馬越よし子',h:169,pw:84,sp:48,te:56,st:67,mn:68,style:'Grappler',role:'Neutral',pot:{pw:169,sp:122,te:133,st:147,mn:148},traits:['威圧感','頑丈さ']},
  {id:74,name:'富士見ヶ丘遥',h:164,pw:60,sp:68,te:58,st:66,mn:70,style:'Allround',role:'Babyface',pot:{pw:138,sp:148,te:135,st:146,mn:151},traits:['ファンサービス']},
  {id:75,name:'海老名栞',h:159,pw:53,sp:58,te:67,st:63,mn:80,style:'Submission',role:'Babyface',pot:{pw:129,sp:135,te:147,st:142,mn:164},traits:['ファンサービス','ライバル体質','野心']},
  {id:76,name:'栗林あかり',h:153,pw:68,sp:68,te:40,st:66,mn:58,style:'Striker',role:'Neutral',pot:{pw:148,sp:148,te:112,st:146,mn:135},traits:['ライバル体質','負けず嫌い']},
  {id:77,name:'新見ゆり',h:164,pw:66,sp:57,te:63,st:54,mn:53,style:'Allround',role:'Neutral',pot:{pw:146,sp:134,te:142,st:130,mn:129},traits:['引き出し上手']},
  {id:78,name:'椿山みさき',h:163,pw:58,sp:54,te:51,st:63,mn:60,style:'Allround',role:'Babyface',pot:{pw:135,sp:130,te:126,st:142,mn:138},traits:['引き出し上手','華','負けず嫌い']},
  {id:79,name:'久堂梨々花',h:156,pw:67,sp:63,te:46,st:56,mn:38,style:'Brawler',role:'Heel',pot:{pw:147,sp:142,te:120,st:133,mn:109},traits:[]},
  {id:80,name:'高島さや',h:145,pw:21,sp:32,te:19,st:18,mn:19,style:'Allround',role:'Babyface',pot:{pw:87,sp:102,te:85,st:83,mn:85},traits:['ファンサービス','ムードメーカー']},
  // ── 新規キャラクター（v1.4 GameID 81〜99）──
  {id:81,name:'坂本莉衣奈',h:153,pw:68,sp:76,te:65,st:78,mn:77,style:'Speed',role:'Babyface',pot:{pw:148,sp:159,te:144,st:161,mn:160},traits:['ムードメーカー']},
  {id:82,name:'近藤ゆりか',h:166,pw:84,sp:55,te:67,st:80,mn:69,style:'Grappler',role:'Neutral',pot:{pw:169,sp:132,te:147,st:164,mn:150},traits:['番狂わせ体質']},
  {id:83,name:'佐久間ひより',h:151,pw:61,sp:58,te:48,st:56,mn:68,style:'Allround',role:'Babyface',pot:{pw:139,sp:135,te:122,st:133,mn:148},traits:['負けず嫌い']},
  {id:84,name:'南谷杏',h:166,pw:65,sp:56,te:63,st:59,mn:50,style:'Allround',role:'Neutral',pot:{pw:144,sp:133,te:142,st:137,mn:125},traits:[]},
  {id:85,name:'鴨志田ルーシー',h:168,pw:74,sp:58,te:43,st:69,mn:73,style:'Grappler',role:'Neutral',pot:{pw:156,sp:135,te:116,st:150,mn:155},traits:[]},
  {id:86,name:'芹沢亜里紗',h:166,pw:70,sp:70,te:53,st:58,mn:61,style:'Brawler',role:'Heel',pot:{pw:151,sp:151,te:129,st:135,mn:139},traits:['ファンサービス']},
  {id:87,name:'レオナ・O・シュタインフェルト',h:152,pw:72,sp:77,te:43,st:65,mn:68,style:'Speed',role:'Babyface',pot:{pw:154,sp:160,te:116,st:144,mn:148},traits:['華']},
  {id:88,name:'愛川明日香',h:162,pw:52,sp:54,te:70,st:65,mn:48,style:'Allround',role:'Heel',pot:{pw:128,sp:130,te:151,st:144,mn:122},traits:[]},
  {id:89,name:'赤羽あんな',h:163,pw:73,sp:75,te:64,st:69,mn:68,style:'Speed',role:'Neutral',pot:{pw:155,sp:158,te:143,st:150,mn:148},traits:['ファンサービス']},
  {id:90,name:'玉手すみれ',h:161,pw:69,sp:58,te:56,st:81,mn:81,style:'Grappler',role:'Neutral',pot:{pw:150,sp:135,te:133,st:165,mn:165},traits:['努力家']},
  {id:91,name:'等々力あかね',h:170,pw:71,sp:72,te:68,st:74,mn:68,style:'Allround',role:'Neutral',pot:{pw:152,sp:154,te:148,st:156,mn:148},traits:['負けず嫌い']},
  {id:92,name:'飯島冴子',h:164,pw:66,sp:58,te:69,st:46,mn:44,style:'Submission',role:'Neutral',pot:{pw:146,sp:135,te:150,st:120,mn:117},traits:['忠誠心']},
  {id:93,name:'松久保伊織',h:163,pw:61,sp:64,te:69,st:59,mn:54,style:'Grappler',role:'Babyface',pot:{pw:139,sp:143,te:150,st:137,mn:130},traits:['忠誠心','早熟']},
  {id:94,name:'須藤美月',h:158,pw:58,sp:58,te:65,st:48,mn:45,style:'Submission',role:'Heel',pot:{pw:135,sp:135,te:144,st:122,mn:118},traits:['ヒール適性']},
  {id:95,name:'小西ゆきえ',h:165,pw:57,sp:63,te:77,st:61,mn:74,style:'Allround',role:'Neutral',pot:{pw:134,sp:142,te:160,st:139,mn:156},traits:['ガラスの身体','ファンサービス','早熟']},
  {id:96,name:'松下真理亜',h:171,pw:72,sp:71,te:65,st:68,mn:58,style:'Allround',role:'Neutral',pot:{pw:154,sp:152,te:144,st:148,mn:135},traits:['ファンサービス','早熟']},
  {id:97,name:'岩崎みどり',h:161,pw:70,sp:79,te:48,st:74,mn:62,style:'Allround',role:'Neutral',pot:{pw:151,sp:163,te:122,st:156,mn:141},traits:['努力家','負けず嫌い','頑丈さ']},
  {id:98,name:'米山杏里',h:169,pw:69,sp:64,te:77,st:68,mn:71,style:'Allround',role:'Babyface',pot:{pw:150,sp:143,te:160,st:148,mn:152},traits:['ガラスの身体','リーダー気質','人望','引き出し上手']},
  {id:99,name:'三浦早紀',h:166,pw:76,sp:73,te:74,st:78,mn:65,style:'Grappler',role:'Babyface',pot:{pw:159,sp:155,te:156,st:161,mn:144},traits:['ファンサービス','ライバル体質','早熟']}
];
// Character profiles (brief bios for fighter popup) — v1.4 全99名
const CHAR_PROFILES = {
  1:'抜きん出た体格とパワーで粕田市内最強と謳われた伝説のレスラー。面倒見が良く人望も厚いチームの大黒柱。',
  2:'幼少期は病弱だったが、不屈の精神でリハビリを乗り越えパワーレスラーへと変貌した遅咲きの努力家。',
  3:'癒し系おでこちゃん。やさしげな雰囲気の裏に確かな実力を秘めるバランス型。家庭の事情で転校した苦労人。',
  4:'剣道仕込みの闘志で格上にも決して引かない負けず嫌い。技術は粗削りだがメンタルの強さは粕田随一。',
  5:'陸上部の快足女子。ストイックに鍛え上げた脚力から繰り出すスピードと蹴り技で相手を翻弄する実力者。',
  6:'楽をする事を好むマイペース娘。中学時代は生駒のクラスメート。実家は八百屋。器用さが光る万能型。',
  7:'富岡家の専属メイドにして忠実な護衛。関節技のセンスに光るものがあり、お嬢様を支えながら地道に力をつけている。',
  8:'バスケ部所属の長身ファイター。運動部の仲間たちとも交流がある。打撃に光るものはあるが技術面に課題を残す。',
  9:'おしゃれに目覚めた自称カワイイ系女子。練習より美容にストイックだが、調子が良い時は相手を完封することも。',
  11:'寡黙で思慮深い読書家。嗜虐的な一面を持ち、関節技と絞め技で相手を追い詰めるスタイルを好む危険な実力者。',
  12:'外交官の娘でドイツ帰りの帰国子女。小柄ながら体格に似合わぬパワーと不屈の闘志で相手をねじ伏せる。',
  13:'口数は極めて少ない打撃戦の申し子。空手道場の娘で、一撃必殺を理想とする戦闘狂。',
  14:'地下プロレスで卑怯ファイトに目覚めた小心者の優等生。リングに上がるとS性が豹変する二面性の持ち主。',
  15:'哲玖一のパワーを誇る陽気な重戦車。生駒と橘を慕う忠義者だが、身内以外には非常に冷淡で攻撃的。',
  16:'市内屈指の名家の令嬢にして摺出川を支配する女帝。高いカリスマ性と冷酷さで学園に君臨する。',
  17:'強敵との対戦が多く敗戦続きの印象だが、大河内を破った実績を持つ名勝負製造機。ピアノの腕前はプロ級。',
  18:'大河内が全国から呼び寄せた編入組の一角。市内屈指の体格とパワーは阿武隈にも引けを取らない。',
  19:'大河内軍団の中で唯一の一般入学組。心情的にも大河内に心酔する忠実な信奉者。',
  20:'冷静沈着な戦術眼で相手を観察して戦う関節技の使い手。身体能力には不安があるが技術で補う。',
  21:'橘玲美に憧れてヒールを目指す天然娘。声が大きくてうるさい。技術は拙いがタフネスは侮れない。',
  22:'大河内直属親衛隊。巨体で相手を押しつぶすラフファイトが持ち味の重量級ブロウラー。',
  23:'大河内の取り巻き。昔空手をかじっていたらしいが、全体的な能力は低い。',
  24:'大河内の取り巻きのリーダー気取り。実力は伴わないが、数の力で威張り散らす小物。',
  25:'大河内の取り巻き。パワーはありそうだが頭は悪そう。鈍重なブロウラー。',
  26:'廃校寸前の元砥石川高校出身。バランス重視の堅実なファイトで確かな実力を見せる努力家。',
  27:'元砥石川高校出身。身体能力に物を言わせるパワー＆スピードタイプ。タフネスにも定評がある。',
  28:'元哲玖四天王の一人で女子大生地下レスラー。パワーとスピードを兼ね備えるが、スタミナに不安を抱える。',
  29:'無名校・奥山川を県大会決勝まで導いたプロレス部主将。膝のケガを乗り越えた不屈のキャプテン。',
  30:'2年秋に転校してきた174cmの大型選手。ムードメーカー気質で、チームの全国大会出場の夢を後押しする。',
  31:'奥山川プロレス部の副キャプテン。友人を元気づけるため始めた部活で競技の楽しさに目覚めた心優しき創設者。',
  32:'小学生時代は注目のサブミッション使いだったが伸び悩んだ過去を持つ。奥山川で情熱を取り戻した1年生。',
  33:'名門・岬浜女子の主将。おしとやかな容貌ながら努力で掴んだ実力で全国制覇を目指すバランス型の大将。',
  34:'1年時からレギュラーの才能の塊。特にグラウンド技術に優れる岬浜の副将。梅ヶ丘を深く信頼している。',
  35:'中学から急成長し特待生で岬浜に入学した大型1年生。「岬浜のツインタワー」の一角を担う将来の逸材。',
  36:'178cmの長身を誇り上野原と並ぶ「岬浜のツインタワー」。格闘技仕込みの実践的テクで次期主将候補。',
  37:'名門・姫宮女子の主将。「柔の白銀」「姫宮の白雪姫」と呼ばれる容姿端麗な人気レスラー。',
  38:'姫宮の副主将にして「剛の芝」の異名を持つ二枚看板の一角。お嬢様揃いの中でも一番のお嬢様。',
  39:'キレのある打撃コンビネーションに定評がある寡黙な2年生。次期キャプテンと目される実力者。',
  40:'小柄だがタフネスとスタミナで後半も攻め手を緩めない有望株。1年生からレギュラーを掴んだ努力家。',
  41:'自由がモットーの三津浜高校プロレス部のリーダー格。責任を嫌いキャプテンは引き受けない自由人。',
  42:'三津浜の3年生。路上格闘の実戦経験も豊富で、ルール無用の喧嘩ファイトは得意中の得意。',
  43:'三津浜随一の怪力を誇る2年生。頭の回転は鈍いがパワーは圧倒的。気の向くまま暴れる問題児。',
  44:'三津浜の1年生レギュラー。腕力が売りだがまだまだ技術不足。伸びしろに期待がかかる発展途上の新人。',
  45:'団地内プロレスのヒエラルキーのトップに座る支配者。井沢を執拗に攻撃し、恐怖政治で団地を支配する策略家。',
  46:'かつて団地の実力者として尊敬を集めたが、高槻の策略で地位と友人を失い孤立。それでも折れない不屈の闘志。',
  47:'入居2年目ながら高い実力を示す若手の実力者。サブミッション技術に優れる早熟型。',
  48:'最近引っ越してきたちょっときつめの奥さん。前の住まいでは町内会プロレスの実力者。外には厳しく家では陽気。',
  49:'おっとりした育ちの良いお嬢様妻。井沢に師事しプロレスの基本から学び、着実に実力をつけている成長株。',
  50:'見た目も言動も若々しい甘え上手。かつての井沢の友人だが、高槻グループに鞍替えした世渡り上手。',
  51:'男性陣を味方につけレフェリーすら誘惑する魔性の女。相手の幸せな顔が苦痛で歪むのを見るのが趣味。',
  52:'高槻の取り巻き。かつては井沢の友人だった。入居8年目のベテラン団地妻。',
  53:'年の割に落ち着きがないズボラ妻。でも夫婦仲は円満。パワーはあるがテクニックが追いつかない。',
  54:'どこにでもいる平凡なOL。運動は苦手だが、職場の人間関係の中で否応なくリングに立たされる。',
  55:'社長秘書としてスカウトされた才媛。美貌と実力で瞬く間に社内マドンナの座を獲得したスポーツウーマン。',
  56:'美人で仕事もできる経理課のお姉さん。社内プロレスで高い勝率を誇り、粘着質ないたぶりを好むサディスト。',
  57:'元社内マドンナの美人受付嬢。大久保の登場で地位を脅かされ、策略を巡らせる野心家。',
  58:'新人・佐久間の教育担当。情に厚い性格で、後輩のために片桐に立ち向かう熱い姐御肌。',
  59:'大久保の人気に嫉妬する女性社員。先輩の浅見に利用され大久保に試合を挑んだ直情型ブロウラー。',
  60:'特殊な血筋で一時的に女性化した元男子。恵まれた体格とパワー、そして精神的な強さで戦場を制する。',
  61:'ギャル3人衆のリーダー格。クラスカーストのトップに君臨し、ルックスにも身体能力にも自信ありの実力者。',
  62:'ギャル3人衆の一角。恋する乙女の裏に威圧感を秘める。伊勢原文奈を警戒するブロウラー。',
  63:'クラスの優等生委員長。ギャルグループとの軋轢で立場を失ったが、芯の強さは失っていない。',
  64:'ギャル3人衆の一人。長いものに巻かれるタイプで、バックがいる時だけ強気になる世渡り上手。',
  65:'人当たりの良さで患者にも同僚にも人気のナース。仕事中は優しいが、親しい相手にはけっこう毒舌。',
  66:'かつてクラスのマドンナだった元同級生。多額の借金を背負い地下格闘の世界に身を投じた万能型。',
  67:'天才美少女ピアニストとして名を馳せた元同級生。夢破れた後も秘めた闘志を燃やすパワーファイター。',
  68:'リョータの幼馴染の女子大生。負けず嫌いで、大切な人のためなら全力で戦う情熱家。',
  69:'現役女子大生レースクイーン。チアリーディング部仕込みの身体能力でスピーディーな試合を展開する。',
  70:'リョータ近所のクリーニング店主。すごい美人で面倒見も良い。パワフルな打撃が武器の姐御肌。',
  71:'モデルと兼業のレースクイーン。華やかなルックスの裏にバランスの取れた堅実な実力を秘める。',
  72:'優しげな淑女の仮面の下に利己的なサイコパスの本性を隠す。体格・パワー・実力すべて備えた危険な美女。',
  73:'夏祭の奉納試合に出場した女性。威圧感のある体格と頑丈さを武器にするパワーグラップラー。',
  74:'ミスコングランプリの文学部生。お淑やかな印象だが性格はわりと強気。仏検1級の才媛。',
  75:'ミスコン2位の野心家。明るく快活な美人の本性は利己的で、他人を蹴落とすことにも抵抗がない。',
  76:'初めての恋人に浮かれる素直で明るい女子高生。負けず嫌いの性格で周囲を引っ張るストライカー。',
  77:'若くして大人びた色気を持った女子高生。冷静な観察眼で相手の隙を見抜く知性派。',
  78:'主人公が憧れる親戚のお姉さん。田舎暮らしから抜け出したいと願う、華のある負けず嫌い。',
  79:'ハニートラップでオヤジ狩りをしていたギャル。手段を選ばないダーティなブロウラー。',
  80:'プロレスをするには不似合いな華奢でひ弱な少女。明日をも知れぬ日々に怯えながらも懸命に生きている。',
  // ── 新規キャラクター（v1.4 GameID 81〜99）──
  81:'新卒3年目の若手OL。おじさん人気も手厚く営業成績好調で、ちょっと調子に乗っている元気印。',
  82:'中途入社3年目の総務部員。事務職のキャリアは長く優秀だが、社内の人間関係にストレスを溜めている。',
  83:'新卒1年目の新人OL。まだまだ仕事は覚束ないが、やる気と負けん気だけは溢れている。',
  84:'大手不動産の事務職OL。営業職の男たちに囲まれたストレスを地下プロレスで発散している。',
  85:'名前がちょっとキラキラな大学4年生。アパレルに就職内定済み。同じサークルの後輩に彼氏持ち。',
  86:'某化粧品会社の企画部を率いる才女。地下プロレスでストレスを発散する連戦連勝のダーティファイター。',
  87:'オーストリアからの留学生。体操競技の強化選手で、金髪碧眼の美少女が地下リングに舞い降りた。',
  88:'繁華街の怪しげなプロレスクラブのキャスト。昼は普通のOL、夜はリングに上がるテクニシャン。',
  89:'東商店街のケーキ屋の看板娘。幼馴染をめぐるライバルとの因縁を抱えるスピードファイター。',
  90:'西商店街の和菓子屋の一人娘。憧れの男子をめぐり赤羽と険悪。スタミナとメンタルが光る努力家。',
  91:'常川高校プロレス部のキャプテン。安定した実力を持つバランス型ファイター。',
  92:'その色香で大勢の青少年を悩ませる美人養護教諭。サブミッション技術は確かだがスタミナに難あり。',
  93:'名門校プロレス部の絶対的エース。容姿端麗・成績優秀・面倒見良しの完璧超人。',
  94:'かつては期待の有望株だったが松久保との差に自信を失い道を踏み外した。闇試合で鬱屈をぶつける。',
  95:'落ち着いた雰囲気の若手レースクイーン。若手レーサーとの秘密の恋を胸に秘めるテクニシャン。',
  96:'ミスコン優勝のテニスサークル所属。華やかなルックスで大学生活を謳歌する早熟型オールラウンダー。',
  97:'素朴な雰囲気だが恋にも積極的な体育会系女子大生。運動神経抜群で体格に見合わぬパワーも秘める。',
  98:'人望を集める生徒会長。三浦からの嫉妬を買い文化祭プロレスに出場。リーダーシップと技術が光る。',
  99:'チアリーダー部部長で校内の人気者。米山への嫉妬心からプロレスマッチを仕掛けた早熟のパワーファイター。',
};

// ── Trait Definitions (traits-v2.1) ─────────────────────
const TRAIT_DEFS = {
  '華':           {cat:'pop',    icon:'華', color:'#e91e9c', en:'Charisma',         desc:'集客力・ポスター効果にボーナス'},
  'ファンサービス':{cat:'pop',    icon:'奉', color:'#f39c12', en:'Fan Service',      desc:'グッズ売上にボーナス'},
  'ヒール適性':   {cat:'pop',    icon:'悪', color:'#9b59b6', en:'Heel Aptitude',    desc:'悪役ムーブで人気を稼げる'},
  '名勝負製造機': {cat:'match',  icon:'名', color:'#f1c40f', en:'Match Maker',      desc:'試合品質にボーナス'},
  '引き出し上手': {cat:'match',  icon:'引', color:'#2ecc71', en:'Best Bringer',     desc:'格下とのMQが下がりにくい'},
  'ライバル体質': {cat:'match',  icon:'闘', color:'#e74c3c', en:'Rivalry Prone',    desc:'ライバル因縁が生まれやすい'},
  '早熟':         {cat:'growth', icon:'早', color:'#27ae60', en:'Early Bloomer',    desc:'若手期の成長が速い。全盛期短め', excl:'A'},
  '晩成':         {cat:'growth', icon:'晩', color:'#16a085', en:'Late Bloomer',     desc:'若手期は遅いが全盛期が長い', excl:'A'},
  '遅咲き':       {cat:'growth', icon:'遅', color:'#1abc9c', en:'Late Starter',     desc:'25歳以降に急成長する', excl:'A'},
  '努力家':       {cat:'growth', icon:'努', color:'#3498db', en:'Hard Worker',      desc:'練習での成長にボーナス'},
  '破天荒':       {cat:'growth', icon:'破', color:'#e67e22', en:'Maverick',         desc:'成長にムラあり。爆発的か停滞'},
  '適応力':       {cat:'growth', icon:'適', color:'#1abc9c', en:'Adaptability',     desc:'新スタイル習得が速い（将来用）'},
  '頑丈さ':       {cat:'body',   icon:'頑', color:'#2980b9', en:'Durability',       desc:'怪我しにくい', excl:'B'},
  'ガラスの身体': {cat:'body',   icon:'脆', color:'#c0392b', en:'Glass Body',       desc:'怪我しやすい（マイナス特性）', excl:'B'},
  '鉄人':         {cat:'body',   icon:'鉄', color:'#7f8c8d', en:'Iron Man',         desc:'コンディション全般に強い', excl:'B'},
  '不屈':         {cat:'body',   icon:'屈', color:'#d35400', en:'Indomitable',      desc:'怪我からの復帰が速い'},
  'ムードメーカー':{cat:'org',   icon:'和', color:'#f39c12', en:'Mood Maker',       desc:'団体全体の練習効率が微増'},
  '人望':         {cat:'org',    icon:'望', color:'#3498db', en:'Respect',           desc:'団体士気にボーナス'},
  '負けず嫌い':   {cat:'org',    icon:'負', color:'#e74c3c', en:'Competitive',      desc:'負けた翌週の練習成長にボーナス'},
  'リーダー気質': {cat:'org',    icon:'将', color:'#f1c40f', en:'Leadership',        desc:'若手の成長率にボーナス'},
  '忠誠心':       {cat:'org',    icon:'忠', color:'#2ecc71', en:'Loyalty',           desc:'引き抜かれにくい（将来用）'},
  '野心':         {cat:'org',    icon:'野', color:'#9b59b6', en:'Ambition',          desc:'チャンピオンを狙う（将来用）'},
  '番狂わせ体質': {cat:'special',icon:'番', color:'#e74c3c', en:'Upset Specialist', desc:'格上相手に丸め込み率UP'},
  '闘志':         {cat:'special',icon:'志', color:'#c0392b', en:'Fighting Spirit',  desc:'HP低下時にモメンタム回復'},
  '威圧感':       {cat:'special',icon:'威', color:'#8e44ad', en:'Intimidation',     desc:'対戦相手の序盤モメンタムが不利'}
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
    draftAges[id] = 16 + Engine.rng.int(rng, 0, 3);
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

// Coach portrait mapping (add image files as face_coach_{key}.png)
const COACH_PORTRAIT = {
  1:'coach_onizuka', 2:'coach_asuka', 3:'coach_tsurumi', 4:'coach_iwata',
  5:'coach_sawamura', 6:'coach_asahi', 7:'coach_kurebayashi', 8:'coach_shirakawa'
};
function getCoachPortraitUrl(id) { return COACH_PORTRAIT[id] ? `../image/face_${COACH_PORTRAIT[id]}.png` : ''; }
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
  hpScale: 1.85,
  effPivot: 100, effSlopeAfterPivot: 0.60,
  hitBase: {1:97,2:97,3:96,4:94,5:92,6:89,7:86,8:84,9:81,10:78,11:76,12:74,13:72,14:70,15:68,16:66},
  tecHitBonus: 0.21, spdDodgeBonus: 0.075, hitMin: 42, hitMax: 98,
  counterBase: 4, counterTecScale: 0.055, counterSpdPenalty: 0.03, counterMin: 2, counterMax: 22,
  counterDmgMult: 0.6, counterMomShift: 18,
  dmgPwrScale: 0.12, dmgTecScale: 0.10, dmgSpdScale: 0.03,
  defStaScale: 0.08, defMntScale: 0.055, momDmgScale: 0.003,
  dmgRandMin: 0.85, dmgRandRange: 0.30, dmgFloor: 3,
  gritDuration: 2, gritDmgReduction: 0.20, gritCounterBonus: 8,
  pinAttemptHpThreshold: 0.35, pinAttemptMinDmg: 9, pinAttemptBaseRate: 36,
  pinAttemptMomBonus: 0.15, pinAttemptMntPenalty: 0.20,
  pinAttemptSuccessBase: 23, pinAttemptClimax: 22,
  finishWeights: {
    strike:{fall:85,gu:5,tko:10}, throw:{fall:80,gu:5,tko:15}, aerial:{fall:85,gu:0,tko:15},
    ground:{fall:70,gu:5,tko:25}, submission:{fall:5,gu:90,tko:5}, rollup:{fall:100,gu:0,tko:0}
  },
  kickoutMnScale: 0.50, kickoutMax: 2, kickoutClimaxMult: 0.7,
  guEscapeMnScale: 0.45, guEscapeMax: 2,
  tkoConsecutiveThreshold: 3, tkoHpThreshold: 0.15, tkoBaseRate: 14,
  rollupHpThreshold: 0.35, rollupTecBonus: 0.18, rollupBaseSuccess: 16
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4: ECONOMY CONFIG                               ║
// ╚══════════════════════════════════════════════════════════╝
const SALARY_TABLE = [
  {max:49, pay:8}, {max:64, pay:18}, {max:79, pay:35}, {max:89, pay:60},
  {max:99, pay:100}, {max:109, pay:150}, {max:999, pay:200}
];
const VENUES = [
  {name:'公民館',   cap:150,   cost:5,    popReq:0},
  {name:'小ホール', cap:400,   cost:60,   popReq:15},
  {name:'市民会館', cap:1000,  cost:180,  popReq:30},
  {name:'中ホール', cap:2500,  cost:500,  popReq:45},
  {name:'アリーナ', cap:6000,  cost:1400, popReq:60},
  {name:'大会場',   cap:12000, cost:3200, popReq:75},
  {name:'ドーム',   cap:30000, cost:9000, popReq:90}
];
const TICKET_PRICE = 0.5; // 万円/人（統一チケット価格）
const GOODS_PRICE = 0.08; // 万円/人（グッズ単価）
const OCCUPANCY_BONUS = [
  {min:0.95, ticketMult:1.5, label:'🔥 超満員！',    heatDelta:+2},
  {min:0.80, ticketMult:1.2, label:'✨ 大入り！',    heatDelta:+1},
  {min:0.60, ticketMult:1.0, label:'👍 盛況',        heatDelta:0},
  {min:0.40, ticketMult:0.85,label:'➖ まずまず',    heatDelta:0},
  {min:0.25, ticketMult:0.7, label:'😟 空席目立つ',  heatDelta:-1},
  {min:0.0,  ticketMult:0.5, label:'😰 ガラガラ',    heatDelta:-2},
];
// ── Card Pop & Crowd MQ Constants (v1.0c) ──
const CARD_POP_CONFIG = {
  SUB_WEIGHT: 0.7,    // サブ試合の重み（メインの7割）
  CARD_MULT:  1.2     // cardPop → cardBonus 変換倍率
};
const CARD_DEPTH_MULT = [0.85, 0.92, 1.0, 1.0, 1.0, 1.0];
//                        1試合  2試合  3試合  4試合  5試合  6試合
const CROWD_HEAT_MQ = [
  { min: 0.95, bonus: +5, label: '超満員の熱気' },
  { min: 0.80, bonus: +3, label: '大入りの声援' },
  { min: 0.60, bonus: +1, label: '盛況の雰囲気' },
  { min: 0.40, bonus:  0, label: '' },
  { min: 0.25, bonus: -1, label: '空席の静けさ' },
  { min: 0.00, bonus: -3, label: 'ガラガラの寂しさ' },
];
const VENUE_SCALE_MQ = [0, 0, 1, 1, 2, 2, 3];
// index: 公民館=0, 小ホール=0, 市民会館=+1, 中ホール=+1, アリーナ=+2, 大会場=+2, ドーム=+3

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
const PROMO_POP_CAP = 40; // プロモのみで到達可能な人気上限
const TRANSFER_POP_MULT = 0.75; // 移籍時の人気リセット係数
const SPONSOR_TABLE = [
  {min:0,max:19,val:0},{min:20,max:39,val:20},{min:40,max:59,val:60},
  {min:60,max:79,val:120},{min:80,max:94,val:250},{min:95,max:100,val:400}
];
const BROADCAST_TABLE = [
  {min:70,max:84,val:100},{min:85,max:94,val:200},{min:95,max:100,val:400}
];
const FIXED_COSTS = {facility:30, admin:20};

// Heat System
const HEAT_LEVELS = [
  {id:'ice_cold', label:'Ice Cold',  emoji:'🧊', color:'#74b9ff', mult:0.6, min:-999, max:-6, anim:''},
  {id:'cold',     label:'Cold',   emoji:'❄️', color:'#a29bfe', mult:0.8, min:-5, max:-2, anim:''},
  {id:'neutral',  label:'Neutral', emoji:'➖', color:'#dfe6e9', mult:1.0, min:-1, max:1, anim:''},
  {id:'warm',     label:'Warm',   emoji:'🔥', color:'#fdcb6e', mult:1.2, min:2, max:5, anim:''},
  {id:'hot',      label:'Hot',   emoji:'🔥🔥', color:'#e17055', mult:1.5, min:6, max:9, anim:'heat-pulse'},
  {id:'on_fire',  label:'On Fire!', emoji:'🔥🔥🔥', color:'#d63031', mult:2.0, min:10, max:999, anim:'heat-blaze'}
];

// Quarter / Season display labels
const QUARTER_LABELS = {1:'🌸 春', 2:'☀️ 夏', 3:'🍂 秋', 4:'❄️ 冬'};

// Injury System
const INJURY_TABLE = [
  {type:'軽傷', minWeeks:1, maxWeeks:2, threshold:0.12, color:'#fdcb6e'},
  {type:'中傷', minWeeks:3, maxWeeks:4, threshold:0.05, color:'#e17055'},
  {type:'重傷', minWeeks:6, maxWeeks:8, threshold:0.02, color:'#d63031'}
];

// Title System
const TITLES = [
  {id:'world', name:'団体王座', mqBonus:15, popBonus:3, attendBonus:1.15, emoji:'🏆'}
];

// Rivalry System
const RIVALRY_THRESHOLDS = [
  {matches:2, label:'因縁', mqBonus:8, color:'#fdcb6e', emoji:'⚡'},
  {matches:4, label:'宿敵', mqBonus:15, color:'#e17055', emoji:'🔥'},
  {matches:7, label:'永遠のライバル', mqBonus:22, color:'#d63031', emoji:'💥'}
];

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4B: COACH DATA (v0.6)                           ║
// ╚══════════════════════════════════════════════════════════╝
const ALL_COACHES = [
  {id:1, name:'鬼塚道場長',      emoji:'💪', specialty:'pw', growthMult:2.0, salary:40, hireFee:150,
   desc:'パワー育成の鬼。担当選手のパワー成長率が2倍に。',
   age:58, gender:'男', origin:'北海道',
   profile:'元柔道全日本代表。引退後は独自のパワートレーニング理論を確立し、多くの格闘家を育て上げた。「力なき技は無力」が口癖。厳しいが、弟子想いの熱血指導者。'},
  {id:2, name:'飛鳥トレーナー',  emoji:'💨', specialty:'sp', growthMult:2.0, salary:40, hireFee:150,
   desc:'スピード強化の専門家。担当選手のスピード成長率が2倍に。',
   age:34, gender:'女', origin:'大阪',
   profile:'元陸上短距離選手で、100m走の元ジュニア日本記録保持者。スポーツ科学を専攻し、反応速度と瞬発力の最適化に特化した独自メソッドを持つ。明るく前向きな性格で選手からの信頼が厚い。'},
  {id:3, name:'鶴見師範',        emoji:'🎯', specialty:'te', growthMult:2.0, salary:40, hireFee:150,
   desc:'テクニックの匠。担当選手のテクニック成長率が2倍に。',
   age:62, gender:'男', origin:'京都',
   profile:'伝統派空手の八段師範で、技の精度と美しさを極限まで追求する職人気質。寡黙だが、一言一言に含蓄がある。「技は千回の反復から生まれる」と繰り返し教えている。'},
  {id:4, name:'岩田フィジカルコーチ', emoji:'🏃', specialty:'st', growthMult:2.0, salary:40, hireFee:150,
   desc:'スタミナ強化のプロ。担当選手のスタミナ成長率が2倍に。',
   age:41, gender:'男', origin:'長野',
   profile:'元トライアスロン選手。高地トレーニングや心肺機能の強化プログラムに精通。科学的アプローチで選手の持久力を最大限まで引き出す。温厚で計画的な性格。'},
  {id:5, name:'沢村メンタルコーチ', emoji:'🧠', specialty:'mental', condBonus:3, injuryReduce:0.5, growthMult:1.0, salary:40, hireFee:150,
   desc:'担当選手のコンディション回復+3/週 & 怪我確率50%カット。心身のケアで安定稼働を支える。',
   age:45, gender:'女', origin:'東京',
   profile:'臨床心理士の資格を持つスポーツ心理学者。試合前のプレッシャー管理、集中力維持、モチベーション管理を得意とする。穏やかな物腰だが、核心を突く洞察力を持つ。'},
  {id:6, name:'朝日総合アドバイザー', emoji:'⭐', specialty:'all', growthMult:1.4, salary:30, hireFee:80,
   desc:'担当選手の全ステータス練習効率を1.4倍に。万能型。',
   age:52, gender:'男', origin:'福岡',
   profile:'元プロレスラーで、現役時代は「器用貧乏」と呼ばれながらも15年のキャリアを全うした苦労人。全てのポジションを経験した豊富な知識で、若手の総合力底上げを得意とする。面倒見が良い。'},
  {id:7, name:'紅林セコンド',    emoji:'🎬', specialty:'mq', mqBonus:3, salary:30, hireFee:100,
   desc:'担当選手の試合MQ基底値に+3。セコンドの的確な指示で試合の質が向上。',
   age:48, gender:'男', origin:'名古屋',
   profile:'元プロレス実況アナウンサーで試合構成を熟知するセコンドマン。リング外から「次の展開」を的確に指示し、試合のドラマ性を引き上げる。話術に長け、社交的な性格。'},
  {id:8, name:'白川マネージャー', emoji:'📣', specialty:'pop', popBonus:1, salary:20, hireFee:60,
   desc:'担当選手のプロモ活動時に人気上昇+1。メディア対応のプロ。',
   age:29, gender:'女', origin:'横浜',
   profile:'元芸能事務所マネージャーで、SNSマーケティングとメディア露出戦略のプロ。選手の魅力を引き出すブランディングが得意。行動力があり、常に新しいプロモーション企画を提案する。'}
];
const MAX_COACHES = 3; // 同時雇用上限
const COACH_HIRE_FEE = 80; // 雇用費（万）
const COACH_MAX_ASSIGN = 4; // v0.8: 1コーチあたり最大担当選手数

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4C: GROWTH/DECLINE CONFIG (v0.6)                ║
// ╚══════════════════════════════════════════════════════════╝
const GROWTH_CONFIG = {
  baseGrowthRate: 0.02,   // base fraction of gap to close per practice
  growthRandom: 1.5,      // random bonus on growth
  declineStartSeason: 4,  // decline begins after this many seasons
  declineRate: 0.6,       // stat points lost per decline check
  declineChance: 0.25,    // chance per stat per season-end
  peakBonusSeason: 2,     // seasons 1-2 have bonus growth
  peakGrowthMult: 1.3,    // growth multiplier during peak seasons
  // v0.8: Coach assign weights
  specialtyWeight: 0.40,  // weight for coach specialty stat
  otherWeight: 0.15,      // weight for non-specialty stats (4 * 0.15 = 0.60)
  subMult: 1.2,           // multiplier for non-specialty stats under coach
  // v0.8: Intensive training
  intensiveMult: 1.5,     // growth multiplier for intensive training
  intensiveCondDrain: 2.0, // condition drain multiplier
  intensiveInjuryChance: 0.05, // 5% chance of minor injury
  intensiveMaxConsec: 2,   // max consecutive intensive weeks
  intensiveMinCond: 50     // min condition to allow intensive
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4D: FACILITY DATA (v0.7)                        ║
// ╚══════════════════════════════════════════════════════════╝
const FACILITIES = [
  {
    id: 'training', name: 'トレーニング施設', emoji: '🏋️',
    levels: [
      {name:'基本設備', desc:'基本的なトレーニング環境', maint:0, cost:0},
      {name:'充実設備', desc:'練習成長率+20%', maint:20, cost:500},
      {name:'最先端設備', desc:'練習成長率+40%', maint:45, cost:1500}
    ]
  },
  {
    id: 'medical', name: '医療施設', emoji: '🏥',
    levels: [
      {name:'なし', desc:'怪我は自然治癒のみ', maint:0, cost:0},
      {name:'診療室', desc:'怪我回復-1週', maint:15, cost:400},
      {name:'スポーツ医療', desc:'怪我回復-2週、療養回復+5', maint:35, cost:1200}
    ]
  },
  {
    id: 'media', name: 'メディア施設', emoji: '📺',
    levels: [
      {name:'なし', desc:'プロモ効果は通常', maint:0, cost:0},
      {name:'配信スタジオ', desc:'プロモ人気+1', maint:10, cost:300},
      {name:'放送局設備', desc:'プロモ人気+2、放映権収入+50万', maint:25, cost:1000}
    ]
  },
  {
    id: 'dormitory', name: '選手寮', emoji: '🏠',
    levels: [
      {name:'なし', desc:'コンディション回復は通常', maint:0, cost:0},
      {name:'基本寮', desc:'毎週コンディション+3', maint:15, cost:350},
      {name:'豪華寮', desc:'毎週コンディション+6、休養効果+5', maint:35, cost:1100}
    ]
  },
  {
    id: 'scouting', name: 'スカウト網', emoji: '🔍',
    levels: [
      {name:'基本', desc:'契約金50万', maint:0, cost:0},
      {name:'国内ネットワーク', desc:'契約金-15%', maint:10, cost:250},
      {name:'海外ネットワーク', desc:'契約金-25%、発掘情報あり', maint:25, cost:800}
    ]
  }
];

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
  { id:'org_s', name:'', tier:'S', championScore:60,
    coachMul:1.30, facilityMul:1.15, scoutStyle:'immediate',
    desc:'業界の頂点に君臨する絶対王者', color:'#d63031', emoji:'👑' },
  { id:'org_a', name:'', tier:'A', championScore:40,
    coachMul:1.15, facilityMul:1.10, scoutStyle:'youth',
    desc:'若手主体の攻撃的な挑戦者', color:'#6c5ce7', emoji:'💫' },
  { id:'org_b', name:'', tier:'B', championScore:20,
    coachMul:1.00, facilityMul:1.05, scoutStyle:'conservative',
    desc:'堅実経営の小規模団体', color:'#00b894', emoji:'🌙' }
];

// ── Scout Event Name Generation & Config (scout-spec §3) ──────
const SCOUT_SURNAMES = ['天羽','秋山','浅倉','安藤','飯田','池上','石原','泉','伊東','岩崎','上野','内田','梅原','江口','遠藤','大城','小川','荻野','加藤','川口','菊地','桐谷','久保','栗原','小泉','後藤','佐伯','坂井','桜庭','佐々木','篠原','柴崎','白石','杉浦','瀬戸','染谷','高松','竹内','立花','田中','津田','土屋','寺田','中島','長谷川','西村','野口','萩原','花山','浜崎','原田','平野','福田','星野','松岡','水野','宮崎','村上','望月','矢島','山口','湯浅','吉川','若林','鷲尾','渡辺'];
const SCOUT_GIVENNAMES = ['あかり','あかね','あゆみ','ありさ','いろは','うた','えみ','かすみ','かなで','きらり','くるみ','さくら','しおり','すみれ','せりな','そら','ちはる','つむぎ','なお','なつき','にいな','ねね','はるか','ひかり','ひなた','ふうか','まどか','まひろ','みお','みさき','みゆき','もえ','ゆいな','ゆうき','ゆかり','よしの','りこ','りさ','りの','るな','れいか','わかな'];
const SCOUT_TRAITS_POOL = ['努力家','早熟','晩成','遅咲き','適応力','破天荒','頑丈さ','不屈','鉄人','負けず嫌い','忠誠心','ファンサービス','番狂わせ体質','闘志'];
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
  if (age <= 18) mul = 1.5;
  else if (age <= 21) mul = 1.2;
  else if (age <= 25) mul = 1.0;
  else if (age <= 29) mul = 0.7;
  else if (age <= 32) mul = 0.3;
  else if (age <= 34) mul = 0.1;
  else mul = 0;

  if (!Array.isArray(traits)) return mul;

  // 早熟: ≤21で+30%、≥26で-30%
  if (traits.includes('早熟')) {
    if (age <= 21) mul *= 1.3;
    else if (age >= 26) mul *= 0.7;
  }
  // 晩成: ≤21で-20%、26-32で+40%
  if (traits.includes('晩成')) {
    if (age <= 21) mul *= 0.8;
    else if (age >= 26 && age <= 32) mul *= 1.4;
  }
  // 遅咲き: ≤25で-20%、26-34で爆発的成長
  if (traits.includes('遅咲き')) {
    if (age <= 25) mul *= 0.8;
    else if (age <= 34) mul = Math.max(mul, 0.9);
  }
  return mul;
}

// Decay table (training-spec §5.4)
// [decayChance per stat, decayAmount per stat]
const DECAY_TABLE = {
  // age 30-32: mild decay
  early: {
    chance: { pw:0.20, sp:0.25, te:0.10, st:0.15 },
    amount: { pw:1, sp:1, te:1, st:1 }
  },
  // age 33-34: moderate decay
  mid: {
    chance: { pw:0.40, sp:0.50, te:0.20, st:0.35 },
    amount: { pw:2, sp:2, te:2, st:2 }
  },
  // age 35+: guaranteed decay
  late: {
    chance: { pw:1.0, sp:1.0, te:1.0, st:1.0 },
    amount: { pw:3, sp:3, te:2, st:3 },
    mntChance: 0.05, mntAmount: 1
  }
};

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
  B: { budget:200, maxPicks:2, idealRoster:9,  rates:{prodigy:0.30, promising:0.50, rough:0.60} }
};

// F1: AI tier differentiation — roster quality caps & growth bonus
const AI_TIER_LIMITS = {
  S: { maxProdigies: 99, maxPromising: 99, growthBonus: 1.20, faAggressiveness: 0.60 },
  A: { maxProdigies: 3,  maxPromising: 99, growthBonus: 1.05, faAggressiveness: 0.40 },
  B: { maxProdigies: 1,  maxPromising: 99, growthBonus: 0.90, faAggressiveness: 0.20 }
};

// AI season growth config (rival-spec §4.1)
const AI_SEASON_CFG = {
  trainWeeks: 30,              // 練習を行う週数概算
  seasonVarianceMin: 0.75,     // シーズン全体ランダム幅
  seasonVarianceMax: 1.25,
  matchGrowthBase: 0.2,        // 試合1回あたり成長base
  matchesPerSeason: 24,        // 年間試合数概算
  matchVarianceMin: 0.5,
  matchVarianceMax: 1.5,
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
  duration: 4,                          // 4週間固定
  maxConcurrent: 1,                     // 同時1名
  minOrgRosterRank: 5,                  // 対象: OVR順5位以下
  weeklyCost: { S: 80, A: 50, B: 30 }, // 週次費用ティア別
};

const EVENT_CONFIG = {
  // D-2: 対抗戦
  warChancePerSeason: 0.30,             // 年1回30%
  warMatchCount: { min: 3, max: 5 },
  warPopReward: 5,                      // 勝利時団体人気
  warPopPenalty: -3,                    // 敗北時
  // D-3: 挑戦状
  challengeMQBonus: 10,                 // MQ+10
  // D-4: 頂上決戦
  summitMinRank: 2,                     // ランキング2位以上で発生
  summitPopReward: 10,
  summitRatingReward: 15,
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
  clampMin: 5,
  clampMax: 70
};

const NEGOTIATE_LINES = {
  start: {
    '威圧感':   'ふーん…私を引き抜こうってわけ？\n面白い度胸してるじゃない。',
    '破天荒':   'えっ、私をスカウト！？\nわくわくするね〜、話聞かせてよ！',
    '負けず嫌い': '…私を欲しいって？\nそれなりの覚悟、あるんでしょうね。',
    '闘志':     '新しい戦場…か。\n…悪くない話かもしれない。',
    'リーダー気質': 'この団体を離れるのは簡単じゃないわ。\n…でも、聞くだけなら。',
    'ファンサービス': 'わぁ、嬉しいです！\nでも…ファンの皆のこともあるし…',
    '努力家':   '私なんかでいいんですか…？\n…ちょっと考えさせてください。',
    _heel:     '…ふん。で、条件は？\n私を満足させられるの？',
    _babyface: '他の団体に…？ちょっと考えさせてください。\n…真剣に、考えます。',
    _neutral:  '…そう。私に来いと。\n条件次第かしらね。'
  },
  success: {
    '威圧感':   'いいわ…認めてあげる。\n新しい場所で、格の違いを見せてやる。',
    '破天荒':   'やったー！新しい団体！\n楽しみすぎて眠れないかも！',
    '負けず嫌い': '…決めた。ここでもっと強くなってみせる！\n絶対に後悔させないから。',
    '闘志':     '新しい闘いが待っている…！\n燃えてきた…全力でいくぞ！',
    'リーダー気質': '新しい仲間のために…全力を尽くすわ。\nよろしくお願いします。',
    'ファンサービス': '新しいファンの皆さんにも、最高の試合を届けます！\nよろしくお願いしまーす！',
    '努力家':   '期待に応えられるよう、頑張ります…！\n…必ず、成長してみせます。',
    _heel:     '…ま、使えるうちは使ってあげるわ。\n後悔しないことね。',
    _babyface: '新しい場所で頑張ります！\nよろしくお願いします！',
    _neutral:  '…分かった、行くわ。\n実力で居場所を作ってみせる。'
  },
  fail: {
    '威圧感':   '…悪いけど、ここが私の居場所よ。\n出直してきなさい。',
    '破天荒':   'ごめんね〜、やっぱり今のとこが好きなの！\nまたね〜！',
    '負けず嫌い': '…ここでまだやり残したことがある。\n今は動けない。',
    '闘志':     'まだこの団体で燃え尽きてない。\n…その話はなかったことに。',
    'リーダー気質': 'みんなを置いて行くわけにはいかないの。\n…ごめんなさい。',
    'ファンサービス': 'ファンの皆が応援してくれてるから…\n今はここを離れられません！',
    '努力家':   'まだここで学ぶことがあるんです…。\n…すみません。',
    _heel:     '条件が気に入らないわ。\n…出直してきなさい。',
    _babyface: 'ごめんなさい、今はここを離れられません。\nまたいつか…！',
    _neutral:  '…悪いけど、今回はパス。\n縁があればまたね。'
  }
};
