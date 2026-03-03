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
  {id:21,name:'木ノ内幸音',h:164,pw:66,sp:53,te:53,st:68,mn:67,style:'Allround',role:'Babyface',pot:{pw:146,sp:129,te:129,st:148,mn:147},traits:['ヒール適性','ムードメーカー','華']},
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
  1:'抜きん出た体格とパワーで粕田市内最強と謳われた伝説のレスラー。面倒見が良く人望も厚いチームの大黒柱。パワーボムと強烈なラリアットを武器に圧倒的な存在感で対戦相手を飲み込む。チーム結成当初からのメンバーで、後輩たちの指導も惜しまない精神的支柱でもある。',
  2:'幼少期は病弱だったが、不屈の精神でリハビリを乗り越えパワーレスラーへと変貌した遅咲きの努力家。高階家のメイドとともに鍛錬を重ね、今では市内有数のパワーファイターに成長した。病弱だった過去を知る者は少なく、そのたくましい闘いぶりに周囲は驚かされる。',
  3:'癒し系おでこちゃん。やさしげな雰囲気の裏に確かな実力を秘めるバランス型。家庭の事情で転校した苦労人。どんな相手にも柔軟に対応できる器用さが最大の武器で、試合展開を読む力にも優れる。苦労の中で培った精神的なタフさが、重要な場面での粘り強さに表れている。',
  4:'剣道仕込みの闘志で格上にも決して引かない負けず嫌い。技術は粗削りだがメンタルの強さは粕田随一。試合終盤に底力を発揮するタイプで、何度打ちのめされても立ち上がる不屈の精神は観客の心を掴む。将来の技術向上次第では大化けする可能性を秘めた逸材。',
  5:'陸上部の快足女子。ストイックに鍛え上げた脚力から繰り出すスピードと蹴り技で相手を翻弄する実力者。短距離走で鍛えた爆発的な加速力はリングでも遺憾なく発揮され、ドロップキックの切れ味は一級品。寡黙で自分に厳しい性格だが、仲間思いの一面もある。',
  6:'楽をする事を好むマイペース娘。中学時代は生駒のクラスメート。実家は八百屋。器用さが光る万能型。やる気を出した時の対応力は目を見張るものがあるが、普段はのんびりペース。ムードメーカーとして場を和ませるのが得意で、チーム内では愛される存在。',
  7:'富岡家の専属メイドにして忠実な護衛。関節技のセンスに光るものがあり、お嬢様を支えながら地道に力をつけている。お嬢様を守るためなら自らの身を盾にすることも厭わない献身的な性格。的確な観察眼と冷静な判断力は、戦術面でチームに大きく貢献している。',
  8:'バスケ部所属の長身ファイター。運動部の仲間たちとも交流がある。打撃に光るものはあるが技術面に課題を残す。174cmの長身から繰り出すリーチの長い打撃は脅威だが、グラウンドに持ち込まれると苦戦する傾向がある。',
  9:'おしゃれに目覚めた自称カワイイ系女子。練習より美容にストイックだが、調子が良い時は相手を完封することも。試合では意外にもスピードを活かした巧みな立ち回りを見せることがあり、侮ると痛い目に遭う。',
  11:'寡黙で思慮深い読書家。嗜虐的な一面を持ち、関節技と絞め技で相手を追い詰めるスタイルを好む危険な実力者。そのサブミッション技術は市内トップクラスで、一度捕まれば脱出は至難の業。冷酷なヒールとして恐れられるが、根底には独自の美学と哲学がある。',
  12:'外交官の娘でドイツ帰りの帰国子女。小柄ながら体格に似合わぬパワーと不屈の闘志で相手をねじ伏せる。153cmの小さな体に宿る闘志は誰よりも激しく、タフネスと根性で大型選手にも真っ向から立ち向かう。チームメイトからの信頼も厚く、頼もしいリーダー格。',
  13:'口数は極めて少ない打撃戦の申し子。空手道場の娘で、一撃必殺を理想とする戦闘狂。鍛え抜かれた拳足から繰り出される打撃はスピードとパワーを兼ね備え、試合が始まれば相手を容赦なく打ち抜く。寡黙ゆえに何を考えているか掴みにくく、対戦相手に不気味な圧を与える。',
  14:'地下プロレスで卑怯ファイトに目覚めた小心者の優等生。リングに上がるとS性が豹変する二面性の持ち主。普段はおとなしく控えめな生徒だが、リングに上がると目つきが変わりサディスティックな関節技を執拗に仕掛ける。その変貌ぶりは見る者をゾッとさせるが妙な人気がある。',
  15:'哲玖一のパワーを誇る陽気な重戦車。生駒と橘を慕う忠義者だが、身内以外には非常に冷淡で攻撃的。178cmの長身と圧倒的なパワーで相手を力任せにねじ伏せるブロウラー。技術面は粗いが、その破壊力で格上とも互角に渡り合う。',
  16:'市内屈指の名家の令嬢にして摺出川を支配する女帝。高いカリスマ性と冷酷さで学園に君臨する。全国から実力者を編入させる権力と資金力を持ち、自らも卓越した身体能力とストライキング技術で頂点に立つ。その支配欲と野心は留まるところを知らず、粕田市全体の覇権をも狙う。',
  17:'強敵との対戦が多く敗戦続きの印象だが、大河内を破った実績を持つ名勝負製造機。ピアノの腕前はプロ級。どんな相手とも噛み合う天性の試合センスを持ち、彼女の試合は常に見応えがある。繊細な感性と華やかな存在感で、勝敗に関わらずファンの心を掴む稀有なレスラー。',
  18:'大河内が全国から呼び寄せた編入組の一角。市内屈指の体格とパワーは阿武隈にも引けを取らない。181cmの長身から繰り出す豪快なグラップリングが武器。適応力もあり、試合中に相手のスタイルに合わせた戦術変更もこなせる器用さを併せ持つ。',
  19:'大河内軍団の中で唯一の一般入学組。心情的にも大河内に心酔する忠実な信奉者。万能型のオールラウンダーで目立った弱点はないが、決定打に欠ける部分がある。大河内への忠誠心は本物で、命じられれば捨て駒も厭わない覚悟を持つ。',
  20:'冷静沈着な戦術眼で相手を観察して戦う関節技の使い手。身体能力には不安があるが技術で補う。相手の癖を瞬時に見抜く観察眼は試合を重ねるごとに磨かれている。遅咲きだが努力を積み重ねる姿勢は衰えず、長期的な成長が期待される知性派。',
  21:'橘玲美に憧れてヒールを目指す天然娘。声が大きくてうるさい。技術は拙いがタフネスは侮れない。ヒールを名乗るわりには素の明るさが抑えられず、観客を楽しませるムードメーカー的存在。華のある振る舞いで独自のファン層を獲得しつつある。',
  22:'大河内直属親衛隊。巨体で相手を押しつぶすラフファイトが持ち味の重量級ブロウラー。173cmの体格を活かしたパワフルな攻撃は単純だが破壊力は抜群。スピードでは劣るが、接近戦に持ち込めば実力者とも互角以上に渡り合える。',
  23:'大河内の取り巻き。昔空手をかじっていたらしいが、全体的な能力は低い。',
  24:'大河内の取り巻きのリーダー気取り。実力は伴わないが、数の力で威張り散らす小物。',
  25:'大河内の取り巻き。パワーはありそうだが頭は悪そう。鈍重なブロウラー。',
  26:'廃校寸前の元砥石川高校出身。バランス重視の堅実なファイトで確かな実力を見せる努力家。母校の廃校を経験した苦い思い出をバネに、早くから自立心を鍛えてきた。安定感のある試合運びと粘り強さで、どんな相手にも一定以上の戦いができる信頼のおける選手。',
  27:'元砥石川高校出身。身体能力に物を言わせるパワー＆スピードタイプ。タフネスにも定評がある。鉄人と呼ぶにふさわしい頑健な肉体で怪我知らずのタフさが最大の武器。技術面の課題を克服できれば、トップ選手の仲間入りも夢ではないポテンシャルを秘める。',
  28:'元哲玖四天王の一人で女子大生地下レスラー。パワーとスピードを兼ね備えるが、スタミナに不安を抱える。全盛期の爆発力は市内でも屈指だったが、怪我がちな体質が最大の弱点。短期決戦に持ち込めば圧倒的な強さを見せるが、長期戦になると失速する傾向がある。',
  29:'無名校・奥山川を県大会決勝まで導いたプロレス部主将。膝のケガを乗り越えた不屈のキャプテン。逆境に立たされるほど力を発揮するタイプで、チームメイトからの信頼は絶大。バランスの取れた能力に加え精神的な強さが際立ち、大舞台での勝負強さに定評がある。',
  30:'2年秋に転校してきた174cmの大型選手。ムードメーカー気質で、チームの全国大会出場の夢を後押しする。恵まれた体格を活かしたグラップリングが武器で、型破りな発想で相手を翻弄することもある。陽気な性格でチームの雰囲気を明るくする欠かせない存在。',
  31:'奥山川プロレス部の副キャプテン。友人を元気づけるため始めた部活で競技の楽しさに目覚めた心優しき創設者。関節技を中心とした技巧派で、晩成型として将来の成長が最も期待される選手の一人。控えめな性格だが、いざ試合になると粘り強さを発揮する。',
  32:'小学生時代は注目のサブミッション使いだったが伸び悩んだ過去を持つ。奥山川で情熱を取り戻した1年生。かつての天才少女が挫折を乗り越えて再起を図る姿は、チームメイトにも良い刺激を与えている。負けず嫌いの性格が闘争心に火をつけた時、その技術は確かな輝きを見せる。',
  33:'名門・岬浜女子の主将。おしとやかな容貌ながら努力で掴んだ実力で全国制覇を目指すバランス型の大将。抜きん出た才能はないが、あらゆる面でハイレベルにまとまった総合力の高さが武器。チームを率いるリーダーシップにも優れ、部員たちから深い敬意を集めている。',
  34:'1年時からレギュラーの才能の塊。特にグラウンド技術に優れる岬浜の副将。梅ヶ丘を深く信頼している。早熟型の天才肌で、技術面では上級生すら凌ぐセンスの持ち主。型破りな閃きで試合を動かす反面、安定感に欠ける一面もあるが、その潜在能力は計り知れない。',
  35:'中学から急成長し特待生で岬浜に入学した大型1年生。「岬浜のツインタワー」の一角を担う将来の逸材。176cmの恵まれた体格を活かしたパワーグラップリングが武器で、頑丈さも折り紙付き。まだ粗削りだが成長の余地は大きく、名門校の未来を担う存在として期待される。',
  36:'178cmの長身を誇り上野原と並ぶ「岬浜のツインタワー」。格闘技仕込みの実践的テクで次期主将候補。上野原との二枚看板として岬浜の最前線を支えるパワーグラップラー。冷静な試合運びと堅実な防御力で安定した試合ができる信頼度の高い選手。',
  37:'名門・姫宮女子の主将。「柔の白銀」「姫宮の白雪姫」と呼ばれる容姿端麗な人気レスラー。バランスの取れた高い総合力と、どんな窮地でも折れない不屈の精神力が最大の武器。優雅で華麗な試合スタイルは多くのファンを魅了し、全国的にも知名度の高いトップレスラー。',
  38:'姫宮の副主将にして「剛の芝」の異名を持つ二枚看板の一角。お嬢様揃いの中でも一番のお嬢様。品の良い立ち居振る舞いからは想像できない圧倒的なパワーと打撃力で相手を圧倒する。白銀とは対照的な剛のスタイルで、互いを補い合う姫宮の屋台骨。',
  39:'キレのある打撃コンビネーションに定評がある寡黙な2年生。次期キャプテンと目される実力者。試合中は冷静沈着だが、一度スイッチが入ると容赦のないスピードで相手を追い込む。忠誠心の強い性格でチームへの貢献度は高く、次世代の姫宮を牽引する逸材。',
  40:'小柄だがタフネスとスタミナで後半も攻め手を緩めない有望株。1年生からレギュラーを掴んだ努力家。149cmと最小クラスの体格だが、粘りで大型選手にも食らいつく姿は観客の応援を集める。地道な努力を積み重ねるタイプで、着実に実力を伸ばしている。',
  41:'自由がモットーの三津浜高校プロレス部のリーダー格。責任を嫌いキャプテンは引き受けない自由人。サブミッション技術は相当なもので、自由奔放な発想から繰り出す変則的な攻めは対策が難しい。ヒール寄りのスタイルだが本人は深く考えておらず、ただ好きに戦いたいだけの享楽主義者。',
  42:'三津浜の3年生。路上格闘の実戦経験も豊富で、ルール無用の喧嘩ファイトは得意中の得意。豪快なパワーストライキングと場外乱闘を厭わないラフスタイルが持ち味。一見粗暴だが試合の組み立てには独自の勘所を持ち、ダーティな駆け引きにも長けている。',
  43:'三津浜随一の怪力を誇る2年生。頭の回転は鈍いがパワーは圧倒的。気の向くまま暴れる問題児。181cmの巨体から繰り出すパワームーブは圧巻で、掴まれたら最後逃れるのは至難の業。試合運びは大雑把だが、その破壊力だけで勝ちを拾えるほどの怪力は唯一無二。',
  44:'三津浜の1年生レギュラー。腕力が売りだがまだまだ技術不足。伸びしろに期待がかかる発展途上の新人。',
  45:'団地内プロレスのヒエラルキーのトップに座る支配者。井沢を執拗に攻撃し、恐怖政治で団地を支配する策略家。卓越した知性と狡猾さで相手の弱みを見抜き、心理戦で追い詰めてからリングでとどめを刺す。策略だけでなく正面からの戦いでも強い恐るべき敵。',
  46:'かつて団地の実力者として尊敬を集めたが、高槻の策略で地位と友人を失い孤立。それでも折れない不屈の闘志。サブミッション技術は極めて高く、名勝負製造機の異名に恥じない試合巧者。相手の良さを引き出しながら戦う誠実なスタイルは多くの支持を集めている。',
  47:'入居2年目ながら高い実力を示す若手の実力者。サブミッション技術に優れる早熟型。若さに似合わぬ冷静な試合運びと確かな関節技で、短期間でトップクラスの実力を身につけた。早熟型ゆえに伸びしろが懸念されるが、現時点の実力は侮れない。',
  48:'最近引っ越してきたちょっときつめの奥さん。前の住まいでは町内会プロレスの実力者。外には厳しく家では陽気。負けず嫌いの性格と適応力の高さで新しい環境にもすぐに溶け込んだ。打撃を軸にした攻撃的なスタイルで、闘志を前面に押し出す熱い試合を見せる。',
  49:'おっとりした育ちの良いお嬢様妻。井沢に師事しプロレスの基本から学び、着実に実力をつけている成長株。努力家で忠誠心も厚く、師匠である井沢の教えを素直に吸収している。遅咲きだが確実に成長を続けており、メンタルの強さは団地内でも屈指。',
  50:'見た目も言動も若々しい甘え上手。かつての井沢の友人だが、高槻グループに鞍替えした世渡り上手。',
  51:'男性陣を味方につけレフェリーすら誘惑する魔性の女。相手の幸せな顔が苦痛で歪むのを見るのが趣味。サブミッション技術は確かで、反則すれすれの駆け引きで相手を翻弄する試合巧者。甘い容姿に油断した相手が気づいた時にはすでに関節を極められている。',
  52:'高槻の取り巻き。かつては井沢の友人だった。入居8年目のベテラン団地妻。',
  53:'年の割に落ち着きがないズボラ妻。でも夫婦仲は円満。パワーはあるがテクニックが追いつかない。',
  54:'どこにでもいる平凡なOL。運動は苦手だが、職場の人間関係の中で否応なくリングに立たされる。',
  55:'社長秘書としてスカウトされた才媛。美貌と実力で瞬く間に社内マドンナの座を獲得したスポーツウーマン。不屈の精神と鉄人のスタミナを兼ね備え、どんな劣勢からも逆転を狙える粘り強さが最大の武器。正統派のオールラウンドスタイルで正面から堂々と戦う姿勢が支持を集めている。',
  56:'美人で仕事もできる経理課のお姉さん。社内プロレスで高い勝率を誇り、粘着質ないたぶりを好むサディスト。サブミッション技術を駆使して相手をじわじわと追い詰める試合運びが得意。大久保の登場に対するライバル意識が強く、自分こそが社内最強と証明しようとしている。',
  57:'元社内マドンナの美人受付嬢。大久保の登場で地位を脅かされ、策略を巡らせる野心家。リーダーシップと策略で周囲を動かし、自分は安全な場所から指揮を執るタイプ。サブミッション技術はなかなかのもので、早熟な実力とリング外での政治力を武器に暗躍する。',
  58:'新人・佐久間の教育担当。情に厚い性格で、後輩のために片桐に立ち向かう熱い姐御肌。グラップリングを軸にした堅実なスタイルで、後輩を引き出す試合センスも持ち合わせる。負けず嫌いの性格と面倒見の良さで、社内の若手からは姉貴分として慕われている。',
  59:'大久保の人気に嫉妬する女性社員。先輩の浅見に利用され大久保に試合を挑んだ直情型ブロウラー。パワーで押すスタイルは荒削りだが、直情的な性格ゆえの爆発力は侮れない。',
  60:'特殊な血筋で一時的に女性化した元男子。恵まれた体格とパワー、そして精神的な強さで戦場を制する。男性時代の身体能力の残滓と女性化後に身につけたしなやかさを併せ持つ異色のグラップラー。鉄人と呼ぶにふさわしいタフネスで、長期戦にも耐えうるスタミナの持ち主。',
  61:'ギャル3人衆のリーダー格。クラスカーストのトップに君臨し、ルックスにも身体能力にも自信ありの実力者。華やかなルックスと高いプライドで注目を集めるヒール型。バランスの取れた実力を持ち、野心家としてより大きな舞台での活躍を虎視眈々と狙っている。',
  62:'ギャル3人衆の一角。恋する乙女の裏に威圧感を秘める。伊勢原文奈を警戒するブロウラー。パワーと威圧感を武器にしたラフファイトが持ち味で、体格を活かした圧力は相当。恋愛モードの時は甘いが、リングに上がると獰猛な戦闘本能を剥き出しにする。',
  63:'クラスの優等生委員長。ギャルグループとの軋轢で立場を失ったが、芯の強さは失っていない。真面目で正義感が強く、忠誠心の高さはチームにとって頼もしい存在。能力は平均的だが、最後まで諦めない姿勢は周囲の尊敬を集めている。',
  64:'ギャル3人衆の一人。長いものに巻かれるタイプで、バックがいる時だけ強気になる世渡り上手。',
  65:'人当たりの良さで患者にも同僚にも人気のナース。仕事中は優しいが、親しい相手にはけっこう毒舌。看護師としての観察眼はリングでも遺憾なく発揮され、名勝負製造機として好試合を生み出してきた。バランスの取れた高い総合力とファンサービス精神で幅広い支持を集める。',
  66:'かつてクラスのマドンナだった元同級生。多額の借金を背負い地下格闘の世界に身を投じた万能型。追い詰められた環境で培った精神的タフさと引き出しの多さが最大の武器。人望のある人柄で、苦境にあっても周囲を引きつけるカリスマ性を持つ。',
  67:'天才美少女ピアニストとして名を馳せた元同級生。夢破れた後も秘めた闘志を燃やすパワーファイター。繊細な指先から繰り出すのは今やピアノではなく、容赦ないパワーグラップリング。華やかな容姿の瞳の奥には、挫折を乗り越えた者だけが持つ覚悟が宿っている。',
  68:'リョータの幼馴染の女子大生。負けず嫌いで、大切な人のためなら全力で戦う情熱家。スピードのある打撃が武器のストライカーで、感情をエネルギーに変えて戦うタイプ。大切な人を守るためにリングに立つ姿は応援したくなる魅力を放っている。',
  69:'現役女子大生レースクイーン。チアリーディング部仕込みの身体能力でスピーディーな試合を展開する。持ち前の華やかさと俊敏さを活かしたスピードスタイルで観客を魅了する。負けず嫌いの性格で、華麗な見た目とは裏腹に根性のある粘り強い試合を見せる。',
  70:'リョータ近所のクリーニング店主。すごい美人で面倒見も良い。パワフルな打撃が武器の姐御肌。面倒見の良い人柄で周囲から頼りにされる存在。パワフルなストライキングに加え、引き出し上手な試合運びで若手の成長を手助けすることも多い。',
  71:'モデルと兼業のレースクイーン。華やかなルックスの裏にバランスの取れた堅実な実力を秘める。ファンサービス精神旺盛で華やかな試合を心がけるが、実力も確か。安定感のあるオールラウンドスタイルで、どんな相手とも一定以上の試合ができる信頼度の高い選手。',
  72:'優しげな淑女の仮面の下に利己的なサイコパスの本性を隠す。体格・パワー・実力すべて備えた危険な美女。ファンサービスで人気を集める裏で、相手を精神的に追い詰める巧みな心理戦を展開する。引き出し上手な試合センスと野心を備え、頂点への道に手段を選ばない。',
  73:'夏祭の奉納試合に出場した女性。威圧感のある体格と頑丈さを武器にするパワーグラップラー。169cmの体格から繰り出す豪快なグラップリングは力強さに溢れ、接近戦では無類の強さを誇る。',
  74:'ミスコングランプリの文学部生。お淑やかな印象だが性格はわりと強気。仏検1級の才媛。知性と品格を感じさせる立ち居振る舞いの中に、試合では意外な負けん気を覗かせる。ファンサービスに長け、バランスの良いスタイルで着実にファン層を広げている。',
  75:'ミスコン2位の野心家。明るく快活な美人の本性は利己的で、他人を蹴落とすことにも抵抗がない。ファンの前では笑顔を振りまくが、ライバルには容赦のない心理戦を仕掛ける。サブミッション技術とメンタルの強さが武器で、頂点へのライバル意識が原動力。',
  76:'初めての恋人に浮かれる素直で明るい女子高生。負けず嫌いの性格で周囲を引っ張るストライカー。ライバル意識が強く、特に同世代の相手には絶対に負けたくないという闘志で真っ向勝負を挑む。技術面はまだ発展途上だが、パワーとスピードのバランスが良い。',
  77:'若くして大人びた色気を持った女子高生。冷静な観察眼で相手の隙を見抜く知性派。相手を的確に分析し弱点を突く試合運びが得意。派手さはないが、引き出しの多い堅実なオールラウンダー。',
  78:'主人公が憧れる親戚のお姉さん。田舎暮らしから抜け出したいと願う、華のある負けず嫌い。引き出し上手な試合センスと華のある存在感で、田舎ながらも独自のファン層を獲得している。格上相手にも決して引かない気の強さが持ち味。',
  79:'ハニートラップでオヤジ狩りをしていたギャル。手段を選ばないダーティなブロウラー。',
  80:'プロレスをするには不似合いな華奢でひ弱な少女。明日をも知れぬ日々に怯えながらも懸命に生きている。全ステータスが最低クラスだが、ムードメーカーとして場を明るくするファンサービス精神は誰にも負けない。彼女がリングに立つ姿は、強さとは何かを問いかける。',
  // ── 新規キャラクター（v1.4 GameID 81〜99）──
  81:'新卒3年目の若手OL。おじさん人気も手厚く営業成績好調で、ちょっと調子に乗っている元気印。スピードを活かした軽快なファイトスタイルが持ち味で、ムードメーカー気質も相まって試合会場を盛り上げる。スタミナとメンタルの高さで粘り強い試合運びを見せる。',
  82:'中途入社3年目の総務部員。事務職のキャリアは長く優秀だが、社内の人間関係にストレスを溜めている。ストレスの捌け口として始めたプロレスで意外な才能が開花。圧倒的なパワーとタフネスでリングを支配するグラップラーで、番狂わせ体質も持つ侮れない実力者。',
  83:'新卒1年目の新人OL。まだまだ仕事は覚束ないが、やる気と負けん気だけは溢れている。経験不足を気持ちの強さで補い、先輩たちに食らいつく姿は応援したくなる魅力がある。丹羽の指導のもと着実に成長しており、将来性に期待がかかる。',
  84:'大手不動産の事務職OL。営業職の男たちに囲まれたストレスを地下プロレスで発散している。',
  85:'名前がちょっとキラキラな大学4年生。アパレルに就職内定済み。同じサークルの後輩に彼氏持ち。グラップリングを軸にタフネスで粘る試合スタイル。就活も恋愛も順調で、プロレスはあくまで趣味の延長だが潜在能力は侮れない。',
  86:'某化粧品会社の企画部を率いる才女。地下プロレスでストレスを発散する連戦連勝のダーティファイター。頭の切れる策略家で、試合前から心理的に相手を追い詰める巧みさを持つ。ファンサービスの裏に隠された本性はかなりのダーティファイターで、反則すれすれの駆け引きを楽しむ。',
  87:'オーストリアからの留学生。体操競技の強化選手で、金髪碧眼の美少女が地下リングに舞い降りた。体操仕込みの華麗な空中殺法とスピードは観客を魅了し、その華やかな存在感で一躍人気者に。グラウンド技術には課題を残すが、身体能力の高さで十分カバーしている。',
  88:'繁華街の怪しげなプロレスクラブのキャスト。昼は普通のOL、夜はリングに上がるテクニシャン。二重生活の中で培ったサブミッション技術は確かなもの。地味だが堅実な試合運びで、知る人ぞ知る実力者。',
  89:'東商店街のケーキ屋の看板娘。幼馴染をめぐるライバルとの因縁を抱えるスピードファイター。持ち前の快活さと高い身体能力を活かしたスピードスタイルが武器。ファンサービスにも熱心で、商店街の顔として地元での人気は抜群。',
  90:'西商店街の和菓子屋の一人娘。憧れの男子をめぐり赤羽と険悪。スタミナとメンタルが光る努力家。コツコツと実力を積み上げるタイプで、長期戦で真価を発揮する。粘り強いグラップリングで相手を消耗させる持久戦型のスタイルが持ち味。',
  91:'常川高校プロレス部のキャプテン。安定した実力を持つバランス型ファイター。負けず嫌いの性格でチームを率い、自ら先頭に立って戦うキャプテンシーの持ち主。170cmの恵まれた体格を活かしたバランスの良い試合運びで安定した成績を残している。',
  92:'その色香で大勢の青少年を悩ませる美人養護教諭。サブミッション技術は確かだがスタミナに難あり。冷静に相手の急所を見極める関節技は安定しているが、スタミナ不足は深刻で長期戦に持ち込まれると一気に失速する弱点を抱える。',
  93:'名門校プロレス部の絶対的エース。容姿端麗・成績優秀・面倒見良しの完璧超人。早熟型で1年次から頭角を現し、チームメイトへの忠誠心も厚い人格者。グラップリングを軸にしたバランスの良いスタイルだが、突出した武器がないのが課題。',
  94:'かつては期待の有望株だったが松久保との差に自信を失い道を踏み外した。闇試合で鬱屈をぶつける。ヒール性を帯びたサブミッション技術は松久保にも劣らない。挫折を経験した者特有の危うさと闘志が入り混じり、予測不能な爆発力を見せることがある。',
  95:'落ち着いた雰囲気の若手レースクイーン。若手レーサーとの秘密の恋を胸に秘めるテクニシャン。ファンサービス精神旺盛で華やかな試合を見せるが、ガラスの身体という弱点を抱える。テクニックとメンタルの高さでカバーしているが、怪我のリスクは常に付きまとう。',
  96:'ミスコン優勝のテニスサークル所属。華やかなルックスで大学生活を謳歌する早熟型オールラウンダー。テニスで鍛えたフットワークとファンサービス精神で試合を盛り上げる。早熟型ゆえにピークの懸念もあるが、安定した実力は侮れない。',
  97:'素朴な雰囲気だが恋にも積極的な体育会系女子大生。運動神経抜群で体格に見合わぬパワーも秘める。努力家で負けず嫌いの性格は練習にもリングにも表れ、鍛え抜かれた頑丈な体と高い身体能力でパワフルな試合を展開する。技術面の課題克服が今後の鍵。',
  98:'人望を集める生徒会長。三浦からの嫉妬を買い文化祭プロレスに出場。リーダーシップと技術が光る。ガラスの身体という弱点を持つが、引き出し上手な試合センスと生来の人望で周囲を味方につける。チームの精神的支柱として欠かせない存在。',
  99:'チアリーダー部部長で校内の人気者。米山への嫉妬心からプロレスマッチを仕掛けた早熟のパワーファイター。ファンサービスに長けた華やかさの裏にライバル意識の強い性格を持つ。パワーとスピードを兼ね備えたグラップラーで、早熟型ながら現在の実力は相当なもの。',
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
  '適応力':       {cat:'growth', icon:'適', color:'#1abc9c', en:'Adaptability',     desc:'怪我デバフ中でも成長が落ちにくい（練習・試合成長とも+0.2軽減）'},
  '頑丈さ':       {cat:'body',   icon:'頑', color:'#2980b9', en:'Durability',       desc:'怪我しにくい', excl:'B'},
  'ガラスの身体': {cat:'body',   icon:'脆', color:'#c0392b', en:'Glass Body',       desc:'怪我しやすい（マイナス特性）', excl:'B'},
  '鉄人':         {cat:'body',   icon:'鉄', color:'#7f8c8d', en:'Iron Man',         desc:'コンディション全般に強い', excl:'B'},
  '不屈':         {cat:'body',   icon:'屈', color:'#d35400', en:'Indomitable',      desc:'怪我からの復帰が速い'},
  'ムードメーカー':{cat:'org',   icon:'和', color:'#f39c12', en:'Mood Maker',       desc:'団体全体の練習効率が微増'},
  '人望':         {cat:'org',    icon:'望', color:'#3498db', en:'Respect',           desc:'在籍中はロッカールーム士気が毎週+3'},
  '負けず嫌い':   {cat:'org',    icon:'負', color:'#e74c3c', en:'Competitive',      desc:'負けた翌週の練習成長にボーナス'},
  'リーダー気質': {cat:'org',    icon:'将', color:'#f1c40f', en:'Leadership',        desc:'若手の成長率にボーナス'},
  '忠誠心':       {cat:'org',    icon:'忠', color:'#2ecc71', en:'Loyalty',           desc:'引き抜きオファーが来る確率が75%低下'},
  '野心':         {cat:'org',    icon:'野', color:'#9b59b6', en:'Ambition',          desc:'タイトル挑戦時MQ+2、ブレークスルー確率+0.5%'},
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

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4: ECONOMY CONFIG                               ║
// ╚══════════════════════════════════════════════════════════╝
// 給与連続関数パラメータ（R4: テーブル廃止→指数関数）
const SALARY_PARAMS = {
  baseA: 0.65,       // 指数カーブ係数A
  baseB: 0.06,       // 指数カーブ係数B — base = A * exp(B * OVR)
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
  {name:'ドーム',    cap:30000, cost:9000, maxMatches:8, img:'../image/venue_9_dome.webp'},         // 9
];
// L1: orgPop→基礎集客力の区間線形補間テーブル（キャパ非依存）
const BASE_ATTENDANCE_CURVE = [
  [0,20],[5,60],[10,130],[15,200],[20,300],[25,420],[30,550],
  [35,720],[40,900],[45,1150],[50,1500],[55,1900],[60,2500],
  [65,3200],[70,4000],[75,5200],[80,7000],[85,9500],[90,14000],
  [95,20000],[100,30000]
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
const WEEKLY_FLUCTUATION = { MIN: 0.83, MAX: 1.17 }; // ±17%
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
const PROMO_POP_CAP = 55; // プロモのみで到達可能な人気上限
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
  {matches:2, label:'因縁', mqBonus:3, color:'#fdcb6e', emoji:'⚡'},
  {matches:4, label:'宿敵', mqBonus:4, color:'#e17055', emoji:'🔥'},
  {matches:7, label:'永遠のライバル', mqBonus:6, color:'#d63031', emoji:'💥'}
];

// 因縁決着システム — 試合前の宣戦布告セリフ（ペア台詞）
const RIVALRY_CONFRONTATION_LINES = {
  pairs: [
    ['今日こそ、決着をつける', '……望むところよ'],
    ['何度やっても結果は同じだ', 'それは終わってから言いなさい'],
    ['この因縁、今夜終わりにしよう', '最後にふさわしい試合にしましょう'],
    ['覚悟はいいわね？', '生まれた時からできてるわ'],
    ['あなたを超える。今日、ここで', '超えられるものなら、やってみなさい'],
  ],
  eternalPairs: [
    ['長かった……この物語に、終止符を打つ', 'ええ……最高の結末を見せましょう'],
    ['何度も戦った。でも今日が最後だ', 'わかっている。だから全力で来なさい'],
    ['あなたがいなければ、今の私はいない', '……お互い様よ。だから今日も全力で'],
  ],
};

// 因縁決着システム — 試合後の決着セリフ
const RIVALRY_RESOLUTION_LINES = {
  winner: [
    'ようやく決着がついた……最高の相手だった',
    'この勝利は、あの人がいたから掴めた',
    '何度でも言う。あなたは最高のライバルだ',
    'この拳が届いた……それだけで十分だ',
    '終わった……でも、この因縁に感謝している',
  ],
  loser: [
    '負けた……でも、この試合は誇りに思う',
    '悔しい。でも、あなたが強かった。それだけだ',
    '次は……いや、今はこの敗北を受け入れる',
    'ありがとう。あなたのおかげで強くなれた',
    '完敗だ。でも私はまだ終わらない',
  ],
  eternalWinner: [
    'この物語に終止符を打てた……感無量だ',
    '長かった。でも、あなたなしでは辿り着けなかった',
    'これが最終章。最高のエンディングだった',
  ],
  eternalLoser: [
    'あなたには敵わなかった。でも、この戦いは宝物だ',
    '幾度となく戦った。すべてが私の財産だ',
    '最後まで……全力だった。悔いはない',
  ],
};

// v1.5s25: MQ外部ボーナス合計の上限（因縁+タイトル+コーチ+観客の合計キャップ）
const MQ_EXTERNAL_CAP = 15;

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4B: COACH DATA (v2.0 redesign)                  ║
// ╚══════════════════════════════════════════════════════════╝

// 指導力ランク別成長倍率 🔧
const COACH_RANKS = { E:1.05, D:1.08, C:1.12, B:1.18, A:1.25 };

// 得意スタイル表示名
const COACH_STYLE_MAP = { pw:'パワー型', sp:'スピード型', te:'テクニック型', all:'オールラウンド' };

// キャラスタイル→コーチスタイル変換（スタイルマッチ判定用）
const COACH_STYLE_MATCH = { Grappler:'pw', Striker:'pw', Submission:'te', Speed:'sp', Allround:'all', Brawler:'pw' };
const COACH_STYLE_BONUS = 0.05; // スタイル一致時の指導力ボーナス

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
   grade:'B', teaching:'B', observation:'D', style:'pw', trait:'新人育成',
   salary:25, hireFee:200, minOrgPop:30,
   age:58, gender:'男', origin:'北海道',
   desc:'パワー育成の鬼。若手選手を力強く鍛え上げる。',
   profile:'元柔道全日本代表。引退後は独自のパワートレーニング理論を確立し、多くの格闘家を育て上げた。「力なき技は無力」が口癖。厳しいが、弟子想いの熱血指導者。'},
  {id:2, name:'飛鳥 真琴',          emoji:'💨', hasPortrait:true,
   grade:'B', teaching:'B', observation:'C', style:'sp', trait:'実戦主義',
   salary:22, hireFee:180, minOrgPop:30,
   age:34, gender:'女', origin:'大阪',
   desc:'スピード強化の専門家。試合で使えるスピードを徹底的に叩き込む。',
   profile:'元陸上短距離選手で、100m走の元ジュニア日本記録保持者。スポーツ科学を専攻し、反応速度と瞬発力の最適化に特化した独自メソッドを持つ。明るく前向きな性格で選手からの信頼が厚い。'},
  {id:3, name:'鶴見 正嗣',          emoji:'🎯', hasPortrait:true,
   grade:'B', teaching:'C', observation:'B', style:'te', trait:'引き出し上手',
   salary:20, hireFee:160, minOrgPop:30,
   age:62, gender:'男', origin:'京都',
   desc:'テクニックの匠。選手の潜在能力を引き出す観察眼が鋭い。',
   profile:'伝統派空手の八段師範で、技の精度と美しさを極限まで追求する職人気質。寡黙だが、一言一言に含蓄がある。「技は千回の反復から生まれる」と繰り返し教えている。'},
  {id:4, name:'岩田 拓海',          emoji:'🏃', hasPortrait:true,
   grade:'C', teaching:'C', observation:'D', style:'pw', trait:'コンディショニング',
   salary:10, hireFee:60, minOrgPop:0,
   age:41, gender:'男', origin:'長野',
   desc:'スタミナとフィジカル強化のプロ。コンディション管理にも定評がある。',
   profile:'元トライアスロン選手。高地トレーニングや心肺機能の強化プログラムに精通。科学的アプローチで選手の持久力を最大限まで引き出す。温厚で計画的な性格。'},
  {id:5, name:'沢村 玲子',          emoji:'🧠', hasPortrait:true,
   grade:'C', teaching:'D', observation:'C', style:'all', trait:'ベテラン調整',
   salary:8, hireFee:50, minOrgPop:0,
   age:45, gender:'女', origin:'東京',
   desc:'メンタル強化の専門家。ベテラン選手の長期安定稼働を支える。',
   profile:'臨床心理士の資格を持つスポーツ心理学者。試合前のプレッシャー管理、集中力維持、モチベーション管理を得意とする。穏やかな物腰だが、核心を突く洞察力を持つ。'},
  {id:6, name:'朝日 義男',          emoji:'⭐', hasPortrait:true,
   grade:'C', teaching:'C', observation:'C', style:'all', trait:'新人育成',
   salary:9, hireFee:55, minOrgPop:0,
   age:52, gender:'男', origin:'福岡',
   desc:'万能型の指導者。若手の総合力底上げが得意。',
   profile:'元プロレスラーで、現役時代は「器用貧乏」と呼ばれながらも15年のキャリアを全うした苦労人。全てのポジションを経験した豊富な知識で、若手の総合力底上げを得意とする。面倒見が良い。'},
  {id:7, name:'紅林 太一',          emoji:'🎬', hasPortrait:true,
   grade:'C', teaching:'D', observation:'B', style:'all', trait:'引き出し上手',
   salary:10, hireFee:70, minOrgPop:0,
   age:48, gender:'男', origin:'名古屋',
   desc:'試合構成の達人。担当選手の試合MQを引き上げる。',
   profile:'元プロレス実況アナウンサーで試合構成を熟知するセコンドマン。リング外から「次の展開」を的確に指示し、試合のドラマ性を引き上げる。話術に長け、社交的な性格。'},
  {id:8, name:'白川 沙耶',          emoji:'📣', hasPortrait:true,
   grade:'C', teaching:'E', observation:'D', style:'all', trait:'人脈持ち',
   salary:6, hireFee:40, minOrgPop:0,
   age:29, gender:'女', origin:'横浜',
   desc:'業界人脈が豊富。スカウト候補に追加選手を引き込む。',
   profile:'元芸能事務所マネージャーで、SNSマーケティングとメディア露出戦略のプロ。選手の魅力を引き出すブランディングが得意。行動力があり、常に新しいプロモーション企画を提案する。'},

  // ── 新規Cグレード（12人）────────────────────────────────────────────────
  {id:9, name:'大森 健吾',        emoji:'🥊', hasPortrait:false,
   grade:'C', teaching:'D', observation:'E', style:'pw', trait:'コンディショニング',
   salary:6, hireFee:35, minOrgPop:0,
   age:32, gender:'男', origin:'埼玉',
   desc:'元ボディビルダーのトレーナー。地道にフィジカルの土台を作る。',
   profile:'元アマチュアボディビル入賞者。筋肉づくりの知識は確かだが、プロレス指導の経験はまだ浅い。地道なフィジカルトレーニングで選手の土台をコツコツ作り上げる。口下手だが、黙々と付き合ってくれる信頼感がある。'},
  {id:10, name:'宮本 花菜',   emoji:'🌱', hasPortrait:false,
   grade:'C', teaching:'E', observation:'D', style:'sp', trait:'新人育成',
   salary:5, hireFee:30, minOrgPop:0,
   age:26, gender:'女', origin:'神奈川',
   desc:'元体操選手の若手コーチ。新人の素質を見抜く直感が鋭い。',
   profile:'体操競技で培った身体能力と空間認識力を持つ若きコーチ。新人の素質を見抜く直感に優れ、荒削りな原石を見つけ出すのが得意。指導経験はまだ浅いが、選手と同じ目線で成長を後押しする姿勢が持ち味。'},
  {id:11, name:'真壁 龍太',     emoji:'🤼', hasPortrait:false,
   grade:'C', teaching:'C', observation:'D', style:'te', trait:'実戦主義',
   salary:9, hireFee:55, minOrgPop:0,
   age:37, gender:'男', origin:'沖縄',
   desc:'元MMA選手。実戦で使えるテクニックだけを叩き込む。',
   profile:'MMAの実戦経験から関節技やグラウンドテクニックに精通。「試合で使えない技術は教えない」がモットーの実戦派。感情を表に出さないクールな指導スタイルだが、試合前のアドバイスは的確で頼りになる。'},
  {id:12, name:'長谷川 美咲', emoji:'🩺', hasPortrait:false,
   grade:'C', teaching:'D', observation:'C', style:'all', trait:'コンディショニング',
   salary:7, hireFee:45, minOrgPop:0,
   age:33, gender:'女', origin:'静岡',
   desc:'理学療法士。選手の故障予防とリカバリーに特化。',
   profile:'スポーツリハビリの専門家として、選手の故障予防と回復を支える。派手さはないが、コンディション管理において堅実な仕事をする。「壊れてからでは遅い」が口癖で、日々の体調チェックを欠かさない。'},
  {id:13, name:'黒田 修平',       emoji:'🔭', hasPortrait:false,
   grade:'C', teaching:'E', observation:'C', style:'all', trait:'人脈持ち',
   salary:7, hireFee:40, minOrgPop:0,
   age:44, gender:'男', origin:'広島',
   desc:'元スポーツ紙記者。業界全体に張り巡らされた情報網を持つ。',
   profile:'長年の取材活動で築いた人脈は業界随一。あらゆる団体の内情や有望選手の情報が集まってくる。コーチとしての指導力はまだまだだが、スカウト情報の質と速さでは右に出る者がいない。おしゃべり好きで団体のムードメーカー。'},
  {id:14, name:'土屋 弘美',   emoji:'🏋️', hasPortrait:false,
   grade:'C', teaching:'C', observation:'D', style:'pw', trait:'ベテラン調整',
   salary:9, hireFee:58, minOrgPop:0,
   age:50, gender:'女', origin:'新潟',
   desc:'元ウエイトリフティング選手。ベテランのパワー維持に長けた姉御肌。',
   profile:'パワー系トレーニングの知識と中高年の体作りの経験を併せ持つベテランコーチ。年齢を重ねた選手の身体を理解し、無理のない方法でパワーを維持させることに長けている。「あんたはまだまだやれる」と選手を鼓舞する頼れる姉御。'},
  {id:15, name:'林 拓海',     emoji:'🦅', hasPortrait:false,
   grade:'C', teaching:'D', observation:'D', style:'sp', trait:'実戦主義',
   salary:6, hireFee:38, minOrgPop:0,
   age:30, gender:'男', origin:'兵庫',
   desc:'元キックボクサー。実戦形式でスピードと反射神経を鍛える。',
   profile:'キックボクシングで磨いたフットワークと反射神経を武器にするスピード系コーチ。「考える前に動け」がモットーで、実戦形式の練習を好む。やや性急なところはあるが、選手と一緒に汗を流す情熱的な指導で慕われている。'},
  {id:16, name:'森田 悠子', emoji:'💊', hasPortrait:false,
   grade:'C', teaching:'E', observation:'E', style:'all', trait:'コンディショニング',
   salary:5, hireFee:30, minOrgPop:0,
   age:38, gender:'女', origin:'岩手',
   desc:'ヨガと栄養学による地味だが堅実なコンディション管理。',
   profile:'ヨガと栄養学の知識を組み合わせた独自のコンディショニング指導が持ち味。目立つ成果はすぐには出ないが、長期的に選手の体質を改善する堅実な手腕がある。物静かで存在感は薄いが、選手の小さな変化も見逃さない。'},
  {id:17, name:'篠原 隆',   emoji:'🔎', hasPortrait:false,
   grade:'C', teaching:'D', observation:'C', style:'te', trait:'引き出し上手',
   salary:8, hireFee:50, minOrgPop:0,
   age:55, gender:'男', origin:'熊本',
   desc:'元レフェリー歴30年。リングの中から培った試合眼の持ち主。',
   profile:'レフェリーとして数千試合をリングの中から見てきた試合眼の持ち主。選手の長所を見抜き、それを活かす試合運びを提案するのが得意。自らリングに上がることはないが、技術アドバイスの正確さは折り紙付き。控えめだが、言葉に重みがある。'},
  {id:18, name:'赤城 凛',     emoji:'🪖', hasPortrait:false,
   grade:'C', teaching:'C', observation:'E', style:'pw', trait:'実戦主義',
   salary:8, hireFee:48, minOrgPop:0,
   age:36, gender:'女', origin:'群馬',
   desc:'元女子レスリング選手。スパルタ式でフィジカルを鍛え上げる。',
   profile:'レスリングで鍛えた実戦感覚と圧倒的なフィジカルを持つスパルタコーチ。練習は厳しいが、選手が壁を乗り越えた瞬間に見せる笑顔は本物。「甘やかして強くなった人間はいない」が信条。不器用だが、選手の成長を誰よりも喜ぶ。'},
  {id:19, name:'西岡 学', emoji:'📊', hasPortrait:false,
   grade:'C', teaching:'C', observation:'C', style:'te', trait:'引き出し上手',
   salary:10, hireFee:65, minOrgPop:0,
   age:40, gender:'男', origin:'奈良',
   desc:'バイオメカニクス研究者。科学的分析で選手の技術を最適化する。',
   profile:'身体の動きを科学的に分析するスペシャリスト。映像分析やデータを駆使して選手の技術を最適化する。プロレスの現場経験は少ないが、理論に基づいた的確な改善提案で信頼を得つつある。話し始めると止まらないマニアックな一面も。'},
  {id:20, name:'藤原 千春',   emoji:'🧘', hasPortrait:false,
   grade:'C', teaching:'D', observation:'C', style:'all', trait:'ベテラン調整',
   salary:7, hireFee:45, minOrgPop:0,
   age:47, gender:'女', origin:'石川',
   desc:'元メンタルトレーナー。ベテラン選手の心を支え闘志を再点火する。',
   profile:'数多くのプロアスリートのメンタルケアを手掛けてきたベテラン。長年戦い続けた選手の心の疲労を読み取り、再び闘志を灯す手助けをする。「身体が動かないのは、心が止まっているから」が持論。穏やかな語り口で選手に寄り添う。'},

  // ── 新規Bグレード（10人）────────────────────────────────────────────────
  {id:21, name:'熊谷 鉄也', emoji:'🐉', hasPortrait:false,
   grade:'B', teaching:'B', observation:'C', style:'pw', trait:'コンディショニング',
   salary:28, hireFee:220, minOrgPop:30,
   age:46, gender:'男', origin:'宮城',
   desc:'元ラグビー日本代表フィジカルコーチ。パワーと体調管理を高次元で両立。',
   profile:'ラグビー日本代表のフィジカルを支えた実績を持つ一流のストレングス＆コンディショニングコーチ。パワートレーニングと体調管理の両立を高い次元で実現する。豪快な見た目に反して緻密なプログラムを組む。「強い身体は、正しい管理から生まれる」が信条。'},
  {id:22, name:'安藤 美波',   emoji:'⚡', hasPortrait:false,
   grade:'B', teaching:'B', observation:'D', style:'sp', trait:'実戦主義',
   salary:24, hireFee:190, minOrgPop:30,
   age:31, gender:'女', origin:'愛知',
   desc:'元女子MMA王者「閃光」。スピードを活かした実戦指導の達人。',
   profile:'MMAで「閃光」の異名を取ったスピードファイター。現役時代の実戦経験を基に、スピードを活かした攻防の極意を叩き込む。妥協を許さないストイックな指導だが、選手からの信頼は厚い。「速さは才能じゃない、執念だ」と説く。'},
  {id:23, name:'堀内 義孝',     emoji:'🌙', hasPortrait:false,
   grade:'B', teaching:'C', observation:'B', style:'te', trait:'引き出し上手',
   salary:20, hireFee:165, minOrgPop:30,
   age:53, gender:'男', origin:'山梨',
   desc:'元レスリングナショナルコーチ。選手の隠れた才能を見逃さない名伯楽。',
   profile:'レスリング指導の世界で長年培った観察眼は、選手の隠れた才能を見逃さない。派手な指導はしないが、一人ひとりの特性に合わせた技術指導で着実に選手を伸ばす。「答えは選手の中にある。それを引き出すのが俺の仕事だ」と語る。'},
  {id:24, name:'中村 紗弓',   emoji:'🏆', hasPortrait:false,
   grade:'B', teaching:'B', observation:'C', style:'all', trait:'新人育成',
   salary:30, hireFee:250, minOrgPop:30,
   age:35, gender:'女', origin:'千葉',
   desc:'元新体操日本代表。基礎の美しさから強い選手を育てる万能型。',
   profile:'新体操の美しさと厳しさの中で培われた万能型の指導力を持つ。新人の基礎作りからメンタル面まで幅広くカバーし、バランスの取れた選手を育成する。「基礎が美しい選手は、必ず強くなる」を信じて疑わない情熱的な指導者。'},
  {id:25, name:'宮沢 康弘',     emoji:'🛡️', hasPortrait:false,
   grade:'B', teaching:'C', observation:'B', style:'all', trait:'ベテラン調整',
   salary:22, hireFee:180, minOrgPop:30,
   age:57, gender:'男', origin:'山形',
   desc:'元スポーツ整形外科医。医学的知見でベテラン選手の寿命を延ばす。',
   profile:'医師としての深い身体知識を持つ異色のコーチ。ベテラン選手特有の身体の悩みを医学的見地から理解し、適切な調整法を提案する。「選手の寿命を一年でも延ばす」ことに情熱を注ぐ。慎重な性格で、無理は絶対にさせない。'},
  {id:26, name:'カルロス 真理', emoji:'🌐', hasPortrait:false,
   grade:'B', teaching:'D', observation:'B', style:'all', trait:'人脈持ち',
   salary:18, hireFee:150, minOrgPop:30,
   age:42, gender:'女', origin:'ブラジル',
   desc:'日系ブラジル人の元エージェント。国内外の格闘技界に太いパイプを持つ。',
   profile:'日本とブラジルの格闘技コミュニティに太いパイプを持つ国際派コーチ。海外の有望選手の情報にも精通し、他団体との交渉でも力を発揮する。指導力は発展途上だが、人脈と情報収集力はB格随一。「人を繋ぐことが、私の一番の技術」と語る。'},
  {id:27, name:'大河原 剛士',   emoji:'🦁', hasPortrait:false,
   grade:'B', teaching:'B', observation:'B', style:'pw', trait:'新人育成',
   salary:32, hireFee:270, minOrgPop:30,
   age:43, gender:'男', origin:'北海道',
   desc:'元グレコローマン全日本王者。若手のパワーを短期間で開花させる。',
   profile:'グレコローマンで鍛え上げた圧倒的なパワーと、若手を一人前に育てる手腕を兼ね備えた実力派コーチ。基礎体力の徹底と実戦練習を組み合わせた指導で、新人のパワーを短期間で開花させる。「強くなりたいなら、まず自分に負けるな」が口癖。'},
  {id:28, name:'羽田 小百合',   emoji:'⚖️', hasPortrait:false,
   grade:'B', teaching:'B', observation:'C', style:'sp', trait:'ベテラン調整',
   salary:26, hireFee:210, minOrgPop:30,
   age:44, gender:'女', origin:'東京',
   desc:'元プロダンサー。ベテランの動きのキレとしなやかさを維持させる。',
   profile:'ダンスで培った身体操作と表現力の知見をプロレスに応用する異色のコーチ。ベテラン選手の動きのキレを維持し、年齢を感じさせないしなやかさを引き出す。「身体は楽器。手入れを怠れば音は鈍る」という哲学でスピードを守り続ける。'},
  {id:29, name:'陳 偉明', emoji:'💆', hasPortrait:false,
   grade:'B', teaching:'C', observation:'B', style:'all', trait:'コンディショニング',
   salary:21, hireFee:170, minOrgPop:30,
   age:49, gender:'男', origin:'台湾',
   desc:'東洋医学の専門家。心身を総合的に診て最適なコンディションに導く。',
   profile:'東洋医学の叡智とスポーツ科学を融合させたコンディショニングの達人。選手の心身の状態を総合的に診て、最適な調整を施す。「気の流れが整えば、身体は自ずと応える」という哲学に基づく独自のアプローチは、多くの選手から絶大な信頼を得ている。'},
  {id:30, name:'冴島 楓',   emoji:'🔩', hasPortrait:false,
   grade:'B', teaching:'B', observation:'D', style:'te', trait:'実戦主義',
   salary:25, hireFee:200, minOrgPop:30,
   age:39, gender:'女', origin:'大阪',
   desc:'元ブラジリアン柔術黒帯。反復ドリルで関節技と寝技の技術を叩き込む。',
   profile:'ブラジリアン柔術の国際大会で優勝経験を持つ技巧派。一つの技を何百回と反復させるドリル式指導で、選手のテクニックを確実に底上げする。口数は少ないが、マット上での手本は雄弁。「身体が覚えるまで、何度でも」が指導哲学。'},

  // ── 新規Aグレード（5人）────────────────────────────────────────────────
  {id:31, name:'神崎 鋼子',           emoji:'👑', hasPortrait:false,
   grade:'A', teaching:'A', observation:'B', style:'all', trait:'新人育成',
   salary:80, hireFee:700, minOrgPop:55,
   age:60, gender:'女', origin:'東京',
   desc:'「鉄の母」と呼ばれる伝説的指導者。何人もの日本代表選手を輩出した最高峰。',
   profile:'女子バレーボール日本代表監督として五輪に4度帯同し、「鉄の母」と呼ばれた伝説的指導者。彼女の元から巣立った日本代表選手は両手では数えきれない。新人の原石を見抜く眼力と、才能を最大限に引き出す指導力は他の追随を許さない。近年は女子プロレス界にもその手腕を発揮し、格闘技未経験の選手を一流のレスラーへ育て上げる実績を次々と打ち立てている。厳しさの奥に深い愛情を秘めた、スポーツ指導界の生きる伝説。'},
  {id:32, name:'巌流 正道',           emoji:'🐯', hasPortrait:false,
   grade:'A', teaching:'A', observation:'C', style:'pw', trait:'実戦主義',
   salary:70, hireFee:600, minOrgPop:55,
   age:56, gender:'男', origin:'鹿児島',
   desc:'元大相撲力士のパワー系最高峰。実戦で通用する力を最短で身につけさせる。',
   profile:'角界で鍛え上げた圧倒的なパワー理論と、格闘技指導で磨いた実戦メソッドを持つ最高峰のパワー系コーチ。その指導を受けた選手は例外なくパワーで試合を支配するようになると言われる。威圧的な風貌だが、弟子思いの人情家。「力とは、覚悟の結晶だ」と説く。'},
  {id:33, name:'葉月 レミ', emoji:'🌸', hasPortrait:false,
   grade:'A', teaching:'A', observation:'B', style:'sp', trait:'引き出し上手',
   salary:65, hireFee:550, minOrgPop:55,
   age:45, gender:'女', origin:'福岡',
   desc:'元ショートトラックスピードスケート五輪銀メダリスト。女子プロレスでも一時代を築いた異色の経歴を持つ。',
   profile:'ショートトラックスピードスケートでオリンピック銀メダルを獲得した元スプリンター。氷上で培った爆発的な加速力と接触を恐れない勝負度胸を武器に、引退後は女子プロレスに転身して一時代を築いた異色の経歴を持つ。二つの世界で頂点を知る彼女だからこそ、選手の中に眠るスピードの才能を誰よりも的確に見抜き、引き出すことができる。「速さの本質は、一歩目に全てを懸ける覚悟」と語るカリスマ。'},
  {id:34, name:'御堂 清四郎', emoji:'🎭', hasPortrait:false,
   grade:'A', teaching:'B', observation:'A', style:'te', trait:'引き出し上手',
   salary:60, hireFee:500, minOrgPop:55,
   age:65, gender:'男', origin:'東京',
   desc:'柔道五輪金メダリスト「技の神」。業界随一の観察眼を持つ生ける伝説。',
   profile:'柔道でオリンピック金メダルを獲得し「技の神」と称される生ける伝説。世界柔道殿堂入りを果たし、引退後は国際柔道連盟テクニカルアドバイザーとして世界各国の選手を指導。選手の動きを一目見ただけでその強みと弱点を見抜く観察眼は、業界で最も畏怖される能力。多くを語らないが、そのひと言が選手の人生を変えると言われる。'},
  {id:35, name:'如月 薫',         emoji:'🌿', hasPortrait:false,
   grade:'A', teaching:'B', observation:'A', style:'all', trait:'コンディショニング',
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
  baseGrowthRate: 0.02,   // base fraction of gap to close per practice
  growthRandom: 1.5,      // random bonus on growth
  declineStartSeason: 4,  // decline begins after this many seasons
  declineRate: 0.6,       // stat points lost per decline check
  declineChance: 0.25,    // chance per stat per season-end
  peakBonusSeason: 2,     // seasons 1-2 have bonus growth
  peakGrowthMult: 1.3,    // growth multiplier during peak seasons
  // v0.8: Intensive training
  intensiveMult: 1.5,     // growth multiplier for intensive training
  intensiveCondDrain: 2.0, // condition drain multiplier
  intensiveInjuryChance: 0.05, // 5% chance of minor injury
  intensiveMaxConsec: 2,   // max consecutive intensive weeks
  intensiveMinCond: 50,    // min condition to allow intensive
  practiceShare: 0.6       // 練習:試合 = 6:4 の予算配分
};
const GROWTH_SEASON_BASE = 8.0; // 1シーズンの成長予算（4ステ合計、ageMul=1.0時）

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
    coachMul:1.30, facilityMul:1.00, scoutStyle:'immediate',
    desc:'業界の頂点に君臨する絶対王者', color:'#d63031', emoji:'👑' },
  { id:'org_a', name:'', tier:'A',
    coachMul:1.15, facilityMul:1.00, scoutStyle:'youth',
    desc:'若手主体の攻撃的な挑戦者', color:'#6c5ce7', emoji:'💫' },
  { id:'org_b', name:'', tier:'B',
    coachMul:1.00, facilityMul:1.00, scoutStyle:'conservative',
    desc:'堅実経営の小規模団体', color:'#00b894', emoji:'🌙' }
];

// ranking-roster-redesign v1.0 §4: 対戦ポイント設定（Phase 3 で使用）
const BATTLE_POINT_CFG = {
  war: 12,
  summit: 10,
  tournament: { champion: 20, runnerUp: 8, semiFinal: 0, firstRound: -14 },
  tournamentWeek: 24,
};

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
  if (age <= 17)      mul = 0.8;   // 新人: 体がまだできていない
  else if (age <= 19) mul = 1.1;   // 急成長期の入口
  else if (age <= 22) mul = 1.3;   // 黄金の成長期
  else if (age <= 25) mul = 1.0;   // 安定成長
  else if (age <= 28) mul = 0.6;   // 仕上げ段階
  else if (age <= 30) mul = 0.15;  // ほぼ停止
  else if (age <= 32) mul = 0.05;  // 微成長
  else                mul = 0;     // 成長なし

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
  B: { budget:200, maxPicks:2, idealRoster:10, rates:{prodigy:0.30, promising:0.50, rough:0.60} } // roster-cap v1.0: 9→10
};

// F1: AI tier differentiation — roster quality caps & growth bonus
const AI_TIER_LIMITS = {
  S: { maxProdigies: 99, maxPromising: 99, growthBonus: 1.05, faAggressiveness: 0.60 },
  A: { maxProdigies: 3,  maxPromising: 99, growthBonus: 1.00, faAggressiveness: 0.40 },
  B: { maxProdigies: 1,  maxPromising: 99, growthBonus: 0.95, faAggressiveness: 0.20 }
};

// AI season config (人気変動用。成長はGROWTH_SEASON_BASEベースに移行済み)
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
  warChancePerSeason: 0.30,             // 年1回30%
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

// v1.3-3: 引退セリフテンプレート（引退ルート×キャリア×性格で分岐）
const RETIREMENT_LINES = {
  // A: シーズン末引退
  A1_champion: [
    '頂点からの景色は、忘れない',
    'あのベルトの重さ…一生の宝物だよ',
    '最高の舞台で闘えた。それだけで十分'
  ],
  A2_uncrowned: [
    'ベルトには届かなかった。でも、後悔はない',
    '勝てない相手がいた。でも、逃げなかった',
    '夢は叶わなかったけど…この道を選んでよかった'
  ],
  A3_heel: [
    'フン…勝手に泣いてんじゃないわよ',
    'あたしがいなくなって寂しくなるわね',
    '最後まで嫌われ者でいさせてもらうわ'
  ],
  A4_veteran: [
    'ここが、あたしの全部だった',
    '長かったようで…あっという間だったな',
    'この団体で過ごした時間は、嘘じゃない'
  ],
  // B: 怪我引退
  B1_young: [
    'まだ何も成し遂げてないのに…',
    '嘘でしょ…まだ始まったばかりなのに',
    'あたしの物語、こんなところで終わりなの…？'
  ],
  B2_prime: [
    '体がね…もう言うことを聞かないの',
    'これからだったのに…悔しい、悔しいよ…',
    'まだやれると思ってた。信じてた'
  ],
  B3_older: [
    'わかってた。いつか来るって',
    'この体はもう限界だけど…心は、まだ',
    '十分やったよ。自分を褒めてやりたい'
  ],
  B4_champion_injury: [
    'このベルト…まだ返したくなかった',
    'チャンピオンのまま終わるなんて…残酷だよ',
    '最後の防衛戦、やりたかったな…'
  ]
};

// ── 引退勧告・引き留めシステム セリフデータ (retirement-advisory-spec-v1_1) ──
const RETIRE_ACCEPT_LINES = {
  accept_terminal: [  // 末期 (wear≥60)
    '…わかった。もう限界なの、自分でもわかってる',
    'ありがとう。言ってくれて助かった',
    '…正直、ほっとしてる。ありがとう',
  ],
  accept_winless: [  // 低勝率 (≤40%)
    '自分でもわかってた。もう追いつけないって',
    '…そうだね。最近、勝てない試合が多すぎた',
    'もっと早く気づくべきだったかな。わかった',
  ],
  accept_heel: [  // Heel
    '…別にアンタに言われなくても辞めるつもりだったわよ',
    'フン…まぁ、潮時ってやつかしらね',
    '…いいわ。最後くらい、大人しく引き受けてあげる',
  ],
  accept_former_champ: [  // 元王者
    '最後にいい試合がしたい。それだけお願いできる？',
    '…わかった。ベルトを持てた分、十分だよ',
    '最後に、この団体でもう一回輝きたい',
  ],
  accept_no_title: [  // 無冠
    '…わかった。潮時だよね',
    '…そうだね。ありがとう、言ってくれて',
    'うん、覚悟はできてた。最後、よろしくね',
  ],
};

const RETIRE_REFUSE_LINES = {
  refuse_champ: [  // 王座保持中
    'チャンピオンに引退しろって？ 冗談はやめて',
    'このベルトがある限り、あたしは終わらない',
    '王者を引退させようなんて、100年早いわよ',
  ],
  refuse_distrust: [  // 信頼度低
    'あたしを追い出す気？ そう簡単にはいかないわよ',
    '…あたしのことが邪魔なの？ はっきり言いなさいよ',
    'この団体に何年貢献してきたと思ってるの',
  ],
  refuse_heel: [  // Heel
    '引退？ 次の興行を見てなさい。後悔させてあげる',
    'あたしがいなくなったら、この団体は終わりよ',
    'まだまだ引退なんてしてやらないわよ',
  ],
  refuse_fighting: [  // 一般
    'まだ終わらない。あたしはまだ闘える',
    '…諦めるのは、まだ早い',
    '体がある限り、あたしはリングに立つ',
  ],
};

const RETAIN_LINES = {
  former_champ: [
    '…もう少しだけ。最後にもう一度、あのベルトに手を伸ばしたい',
    '…わかった。もう一シーズンだけ、頑張らせて',
  ],
  high_trust: [
    'アンタがそう言うなら…もう少しだけ頑張ってみるよ',
    '…信じてくれてありがとう。もう少しだけ付き合うよ',
  ],
  heel: [
    'フン…まだ使い道があるってことね。いいわ、付き合ってあげる',
    '…チッ、引き留めるのね。まぁ、悪くない判断よ',
  ],
  default: [
    '…うん、もう少しだけやってみる',
    'わかった。もう少しだけ、続けてみる',
  ],
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

// v1.4: 年末表彰式 セリフデータ（1賞8パターン × 5賞 = 40セリフ）
const AWARD_LINES = {
  rookie: [
    'まだ夢みたいです……精一杯やります！',
    'こんなに早くもらえるとは思っていなかった。もっと強くなります！',
    '先輩たちに感謝を……この賞を糧に、私も強い選手になります',
    '信じてくれた皆さんのために、絶対もっと上を目指します！',
    '私の技で、ここまで来られた。まだまだ磨きます！',
    '力で全部ぶっちぎって、気づいたら頂上にいました！',
    '速さなら誰にも負けない。これからもっと速くなります',
    '受け取る資格があるか、まだ不安です。でも、前に進みます'
  ],
  bestMatch: [
    'あの試合、全部出し切れた。あなたがいたから',
    '最高の相手だった。また戦いたい',
    'あの瞬間、時間が止まったみたいだった',
    '技で魅せ合えた試合。忘れられない',
    'ぶつかり合えた。それだけで十分だ',
    '瞬きする間もなかった。最高の試合だよ',
    '負けても嬉しいと思えるのは、あの試合だけかもしれない',
    'いいものを見せられたと思う。ありがとう'
  ],
  mvp: [
    'この一年、全てを懸けた結果だ',
    '誰よりも練習した。だから当然の結果だ',
    'チームのみんな、ありがとう。一緒に掴んだ賞だ',
    'まだ満足はしていない。来年もこの場所に立ちたい',
    'ファンの皆さんの声が、私を強くしてくれた',
    '技が通じた一年だった。来年はさらに上を見る',
    '誰も私を止められなかった。それだけだ',
    'スピードで全部持っていった。これが私のやり方'
  ],
  champion: [
    'この頂は誰にも渡さない',
    '王座は私のものだ。挑んでくるなら受けて立つ',
    '奪われるくらいなら引退する。それほどの覚悟がある',
    'ベルトを持つ責任がある。それが私を引き締める',
    'ここまで応援してくれた皆のために、守り続ける',
    '技で制した頂点。力があっても越えられはしない',
    'このベルトは力の証明だ。次の挑戦者も歓迎する',
    '誰より速く、誰より高く。だからここにいる'
  ],
  hallOfFame: [
    'この場所に名前が刻まれるなんて……信じられない',
    '長い道のりだった。でも、全部やりきった',
    '後輩たちへ——この業界に入ってよかった。続いてきてください',
    'プロレスに全てを捧げた人生に、悔いはない',
    'ありがとう、プロレス。ありがとう、皆さん',
    '技を磨き続けた日々が、ここへ繋がっていたんだな',
    '力で戦い続けた。その証がここにある',
    '走り続けて、やっとここへ辿り着いた'
  ]
};

// ══════════════════════════════════════════════
//  v1.8: 成長イベントシステム セリフ & テンプレート
// ══════════════════════════════════════════════

// §2.6 ブレークスルーセリフ
const BREAKTHROUGH_LINES = [
  'あの試合で、何かが変わった気がする…',
  '限界だと思っていた壁を越えられた！',
  '今日の試合、なんかいつもと違う！',
  '体が軽い。全身に力がみなぎってる！',
  'あの敗北が…私を強くしてくれた。',
  '限界なんてなかった。まだ上があった！',
];

// §4.5 スランプ発生セリフ（トリガー別）
const SLUMP_START_LINES = {
  injury_moderate_recovery: [
    '体は治ったはずなのに…動けない。',
    '怪我から戻ったのに…リングが遠い。',
    '復帰したのに、何かが噛み合わない。',
  ],
  injury_severe_recovery: [
    'またリングに立てた…のに、怖い。',
    '重傷から帰ってきたけど…自信がない。',
    '体は戻った。でも心がついてこない。',
  ],
  defeat: [
    'あの負けから…何かがおかしい。',
    '負けた瞬間から、体が動かなくなった。',
    '自分の何が悪かったのか、わからない。',
  ],
  penalty_end: [
    '怪我は治ったのに…気力が戻らない。',
    '体が癒えても、心の傷は残るんだな。',
  ],
};

// §4.5 スランプ回復セリフ
const SLUMP_END_LINES = [
  'やっと…やっと戻ってこれた。',
  'あの暗いトンネルをようやく抜けた！',
  '待ってくれていたリングに、恩返しする。',
  '迷惑かけた分、倍にして返す！',
];

// §5.6 モチベ喪失セリフ
const MOTIVATION_LOSS_LINES = [
  'もう…何のために闘ってるのかわからない。',
  'プロレスが楽しいって感覚、どこへ行った？',
  '毎日道場に来るのが、こんなに辛いとは。',
];

// §5.6 モチベ喪失回復セリフ
const MOTIVATION_RECOVERY_LINES = [
  'まだ…やれる。やってみせる。',
  'また闘いたいと思えた。この気持ちを大切に。',
  '闘うことを忘れていた。でももう大丈夫。',
];

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
    '◆ {org}、今週も好調な興行で客席を沸かせた',
    '◆ {org}の興行が大盛況！ チケットは即日完売',
    '◆ {org}の人気が止まらない。動員数がまた記録更新か',
    '◆ {org}、今週の興行は満席。勢いが加速中',
    '◆ {org}が好カードで観客を魅了。業界の話題をさらう',
  ],
  winStreak: [
    '◆ {name}が破竹の{count}連勝！ タイトル挑戦の声も',
    '◆ 快進撃の{name}、{count}連勝で勢いに乗る',
    '◆ {name}の連勝が{count}に。もう誰も止められない？',
    '◆ 止まらない{name}！ {count}連勝で次期挑戦者候補に浮上',
    '◆ {name}、{count}連勝。リング上の支配力が際立つ',
  ],
  loseStreak: [
    '◆ {name}に元気がない…ファンから心配の声',
    '◆ {name}の不調が続く。{count}連敗で表情にも陰りが',
    '◆ 心配される{name}の状態…いつになったら復活？',
    '◆ {name}の連敗が止まらない。何が起きているのか',
    '◆ {name}が{count}連敗。周囲も危機感を募らせる',
  ],
  flavor: [
    '◆ {name}がバラエティ番組に出演、意外な一面を見せる',
    '◆ {name}が地元イベントに参加。ファンとの交流に笑顔',
    '◆ {name}のSNSが話題に。私生活の一面にファンが沸く',
    '◆ {name}が雑誌の表紙を飾った。注目度がさらにアップ',
    '◆ {name}と{name2}が合同練習。異色の組み合わせに注目',
    '◆ {name}が本業でも大活躍。「二刀流」ぶりにファン感嘆',
  ],
  injury: [
    '◆ {org}の{name}が練習中に負傷か。詳細は未発表',
    '◆ {name}の出場が危ぶまれる。{org}に暗雲',
    '◆ {org}・{name}の負傷情報。復帰時期は未定',
    '◆ {name}にアクシデント。{org}のカード編成に影響も',
    '◆ {org}の{name}が離脱。怪我の程度は不明',
  ],
  scout: [
    '◆ 今年の新人は粒揃いとの評判。スカウト合戦が激化',
    '◆ 各団体のスカウトが奔走。有望株の争奪戦が始まった',
    '◆ 大型新人の目撃情報。どの団体が手を挙げるか',
    '◆ 学生プロレス界に逸材あり。複数団体が注目',
    '◆ 今年のドラフトは波乱の予感。サプライズ指名はあるか',
  ],
  economy: [
    '◆ {org}、観客動員が伸び悩む。経営陣にも焦りの色',
    '◆ {org}のチケット売上が低調。テコ入れ策を検討か',
    '◆ {org}の収益が好調。スポンサー契約も増加傾向',
    '◆ 業界全体のグッズ売上が前年比増。プロレス人気の証',
    '◆ {org}が新スポンサーを獲得。資金面で余裕が生まれそう',
  ],
  general: [
    '◆ 来月のPPV、注目カードは？ ファンの予想が白熱',
    '◆ 殿堂入り予想が業界で話題に。次の候補は誰だ',
    '◆ 今週のベストバウトはどのカード？ 各誌の評価が割れる',
    '◆ プロレス人気が過去最高を更新。新規ファンが急増中',
    '◆ 選手アンケート「最も対戦したい相手」の結果が発表',
    '◆ プロレス専門チャンネルの視聴率が好調。ゴールデン進出も？',
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
};

// §3-4: 通知型イベント — 特性別セリフ（NOTIF_DIALOGUES）
// N1/N2/N3/N4/N5_warning/N5_low 全タイプ対応
const NOTIF_DIALOGUES = {
  N1: {
    '野心':       ['まだまだやれる。もっと強くなれる気がするんです', 'この調子で上を目指したい'],
    '努力家':     ['積み重ねが大事だと思ってる。コツコツやっていきます', '練習って楽しい。もっとやりたい'],
    '早熟':       ['今がチャンスだと思う。全部吸収してやる', '今のうちに限界まで伸ばしたい'],
    '破天荒':     ['なんか今日、急にいろいろ掴めた気がする！', 'よく分からないけど、急に噛み合ってきた！'],
    '負けず嫌い': ['まだ足りない。もっとできるはず', '昨日の自分に負けたくない'],
    'default':    ['練習が楽しくなってきた気がします', 'やっと体が動くようになってきた気がします'],
  },
  N2: {
    '人望':       ['仲間がいるから頑張れる。チームって、いいですね'],
    '努力家':     ['あの人と練習してると自分も頑張ろうって思えるんです'],
    '忠誠心':     ['この団体で一緒にやれる仲間がいて、幸せです'],
    '破天荒':     ['あの人と一緒だと超楽しい！最高のパートナーだよ！'],
    'default':    ['いい仲間ができた気がします', '一緒に頑張れる人がいると心強いですね'],
  },
  N3: {
    'ガラスの身体': ['無理はしてないつもりだけど……また痛くなったら嫌だな', '少し休んだ方がいいかも……'],
    '鉄人':         ['大丈夫です。こんなのは慣れてます', 'これくらい、問題ありません'],
    '不屈':         ['ちょっと休んだらすぐ戻ります。問題ないです', '立て直してみせます'],
    '負けず嫌い':   ['悔しい。試合で取り返します', 'こんなんじゃ終われない'],
    'default':      ['ちょっと疲れてるだけです。次の試合までには戻ります', '少し休めば大丈夫です'],
  },
  N4: {
    '華':             ['ありがとうございます。自分らしくやっていけてる気がします', 'こういう場所に立つために練習してきた'],
    'ファンサービス': ['ファンの皆さんが喜んでくれるのが一番嬉しい！', 'もっとみんなを楽しませたい！'],
    '野心':           ['この人気を足がかりに、もっと上に行く', 'まだまだここで終わるつもりはない'],
    '人望':           ['みんなに応援してもらえるって、本当に力になりますね', 'ファンの声が原動力です'],
    'default':        ['こんなにたくさんの応援をいただけるなんて、びっくりしています', 'ファンの声が力になってます'],
  },
  N5_warning: {
    '野心':       ['……このままで本当にいいのかな、って考えちゃうことがある'],
    '負けず嫌い': ['最近、何と戦ってるのか分からなくなる時がある'],
    '忠誠心':     ['…ここにいたい気持ちは変わらないんですけど……'],
    '努力家':     ['練習しても練習しても、何かが足りない気がして…'],
    'default':    ['（どこか上の空で、視線が泳いでいる）', '……すみません、ちょっと考え事を'],
  },
  N5_low: {
    '野心':       ['……この団体で、自分の夢は叶えられるんだろうか', '先が見えなくて、焦ってる'],
    '負けず嫌い': ['悔しい。でも、ここで諦めるわけにはいかない', 'このまま終わるつもりはない'],
    '忠誠心':     ['裏切りたいわけじゃない。ただ……', 'ここが好きだから、だから辛い'],
    'default':    ['…別に、何でもないです', 'もういいです。分かりました'],
  },
};

// §2: 資金投入アクション設定（event-system-spec-v2.md §2）
const CARE_ACTIONS = {
  // 個人向けアクション
  bonus: {
    id: 'bonus', label: 'ボーナス支給', emoji: '💴', cost: 50, category: 'individual',
    desc: '信頼度+5（連続使用で効果逓減）',
    effects: { trust: 5 }, minOrgPop: 0,
  },
  costume: {
    id: 'costume', label: 'コスチューム新調', emoji: '👗', cost: 80, category: 'individual',
    desc: '人気+2、信頼度+3（2週に1回）',
    effects: { popularity: 2, trust: 3 }, minOrgPop: 20,
  },
  trainer: {
    id: 'trainer', label: '専属トレーナー手配', emoji: '🏋️', cost: 160, category: 'individual',
    desc: '4週間 成長速度+30%、信頼度+4',
    effects: { growth_boost: { weeks: 4, mult: 1.3 }, trust: 4 }, minOrgPop: 0,
  },
  media: {
    id: 'media', label: 'メディア露出手配', emoji: '📺', cost: 120, category: 'individual',
    desc: '人気+4、信頼度+3（2週に1回・今週練習休み）',
    effects: { popularity: 4, trust: 3, skip_training: true }, minOrgPop: 20,
  },
  special_treatment: {
    id: 'special_treatment', label: '怪我の特別治療', emoji: '🏥', cost: 200, category: 'individual',
    desc: '離脱期間を半分に短縮（怪我中のみ）',
    effects: { injury_reduction: true }, minOrgPop: 40,
    condition: 'injured',
  },
  // 団体全体向けアクション
  party: {
    id: 'party', label: '打ち上げ・慰労会', emoji: '🎉', cost: 100, category: 'team',
    desc: '全員の信頼度+2、ロッカールーム空気+5',
    effects: { trust_all: 2, morale: 5 }, minOrgPop: 0,
  },
  camp: {
    id: 'camp', label: '合宿', emoji: '⛺', cost: 320, category: 'team',
    desc: '全員の成長+中（2週間集中）、信頼度+2',
    effects: { growth_all: { weeks: 2, mult: 1.5 }, trust_all: 2 }, minOrgPop: 0,
  },
};

// §2-5: 資金投入リアクションセリフ（特性別）
// {name} はプレースホルダ
const CARE_REACTION_DIALOGUES = {
  bonus: {
    努力家:   ['ありがとうございます！次の試合、絶対頑張ります！'],
    負けず嫌い: ['これで負けていられない！'],
    野心:     ['実力に見合った報酬をいただけて光栄です'],
    忠誠心:   ['…いつもありがとうございます'],
    破天荒:   ['やった！おごってください！'],
    default:  ['ありがとうございます！', 'いただきます…！', '感謝します'],
  },
  bonus_repeat: {  // 連続支給（逓減）
    default:  ['…また？', 'えっと…ありがとうございます', '（また同じ金額か…）'],
  },
  costume: {
    努力家:   ['えっ、本当ですか！？ 早く着てみたい！'],
    野心:     ['これで試合に勝てる気がします！ありがとうございます'],
    default:  ['わあ！ありがとうございます！', 'うれしい！大切にします'],
  },
  trainer: {
    努力家:   ['専属の先生がつくんですか…！ もっと上手くなれます！'],
    野心:     ['チャンスをものにします！'],
    default:  ['頑張ります！', '全力で取り組みます！'],
  },
  media: {
    努力家:   ['うわあ、緊張する…でも頑張ります！'],
    野心:     ['もっと広い舞台に出たかった。ありがとうございます！'],
    default:  ['よろしくお願いします！', 'ありがとうございます！'],
  },
  special_treatment: {
    努力家:   ['ありがとうございます…早く試合に戻りたいんです'],
    default:  ['助かります…', 'ありがとうございます'],
  },
  party: {
    default:  ['お疲れ様でした〜！', 'みんなで楽しく過ごせました！'],
  },
  camp: {
    努力家:   ['やった！思い切り練習できる！'],
    default:  ['しっかり鍛えてきます！', '頑張ります！'],
  },
};

// §3-3: 選択型イベントセリフ（S1〜S6, E1〜E6）
// 特性別（traits）でセリフを分岐。フォールバックは default
const CHOICE_EVENT_DIALOGUES = {
  // S1: タイトル挑戦要求
  S1: {
    リーダー気質: ['私がこの団体を引っ張っていく。だから次は王座に挑ませてください'],
    野心:    ['チャンピオンの座が欲しい。今すぐ組んでください'],
    負けず嫌い: ['あの人に負けたまま終われない。タイトルマッチに組んでください！'],
    闘志:    ['燃えています！ベルトを賭けた試合がしたいんです！'],
    努力家:  ['ずっと準備してきました…チャンスをください'],
    人望:    ['みんながそう思っている…私がチャンピオンになるべきだと'],
    default: ['タイトルマッチの機会をいただけませんか？'],
  },
  // S2: 対戦要求（因縁）
  S2: {
    負けず嫌い: ['あの人と戦わずにはいられない！組んでください！'],
    闘志:    ['決着をつけたい。彼女と戦う機会を作ってください'],
    野心:    ['あの相手を越えてこそ、次のステージに行ける'],
    default: ['因縁のある相手と試合を組んでいただけませんか'],
  },
  // S3: 休養願い
  S3: {
    努力家:  ['迷惑をかけてしまって申し訳ないんですが…少し休ませてもらえますか'],
    忠誠心:  ['チームに迷惑はかけたくないんですが…体が限界で…'],
    破天荒:  ['もう限界です！ちょっと休まないとマジでやばい！'],
    default: ['少し休養をいただけますか？'],
  },
  // S4: 不満・退団示唆（低trust）
  S4_direct: {  // 直訴型（熱血・生意気系）
    負けず嫌い: ['このままじゃ納得できない。待遇を改善してくれなければ移籍を考えます'],
    闘志:    ['私の実力を使いきれていない。このままここにいる意味はあるんでしょうか'],
    野心:    ['私の目標を達成できる環境が必要です。考え直してもらえませんか'],
    破天荒:  ['ぶっちゃけ不満です！ちゃんと話し合いましょう！'],
    default: ['このままでは限界です。待遇を改善していただけませんか'],
  },
  S4_silent: {  // 沈黙型（クール・内向系）
    default: [
      '（沈黙）…いえ、何でもないです',
      '（目を伏せて、何かを堪えるように唇を噛む）……',
      '…………（小さくため息をつき、視線を逸らす）',
    ],
  },
  // S5: 特訓志願（高trust）
  S5: {
    努力家:  ['もっと強くなりたいんです。特訓を許可してください！'],
    負けず嫌い: ['もっと上を目指したい。特訓させてください！'],
    闘志:    ['燃えています！とことんやらせてください！'],
    default: ['特訓する時間をいただけませんか？'],
  },
  // S6: 後輩指導の申し出（ベテラン）
  S6: {
    リーダー気質: ['若い子たちの面倒を見させてください。それが私の役目だと思うので'],
    人望:    ['後輩に何かを伝えたいんです。指導の機会をもらえますか'],
    努力家:  ['私が培ってきたものを、後輩に伝えたいと思って…'],
    default: ['後輩の指導を担当させてもらえませんか？'],
  },
  // E1: メディア出演オファー
  E1: {
    '華':             ['私が出れば注目されるのは当然。楽しみにしてます'],
    'ファンサービス': ['ファンのみなさんに、もっと近くで私を見てもらいたいです！'],
    '野心':           ['この露出を足がかりに、もっと大きな舞台へ進みたい'],
    '努力家':         ['テレビは緊張しますけど…精一杯やります！'],
    default: ['メディアへの出演、ご検討いただけますか？', '出演のお話をいただきました。やってみたいです'],
  },
  // E4: スカウト情報（将来拡張用プレースホルダ）
  E4: { default: ['新たなスカウト情報が届きました'] },
  // E6: 他団体からの引き抜き
  E6: {
    野心:    ['…本当のことを言うと、いい条件だと思っています'],
    忠誠心:  ['こちらに義理があるので断りましたが…報告しておきます'],
    破天荒:  ['マジで！？ 他の団体が私を欲しいって！？ ちょっと嬉しいかも…'],
    人望:    ['みんなと離れたくない気持ちはあるけど…正直、迷ってます'],
    default: ['他の団体からオファーが来ています'],
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
    努力家:  ['すみません…もっと注意するべきでした。早く復帰できるよう頑張ります'],
    不屈:   ['大丈夫です、この程度…すぐ戻ります'],
    闘志:   ['くそっ…こんなところで足を止めるわけにはいかないのに'],
    破天荒:  ['いてて…やっちゃいました。でも根性で治します！'],
    頑丈さ:  ['体は丈夫なはずなんですが…油断しました'],
    default: ['…痛みが引くまで少し時間がかかりそうです'],
  },
  // B2: 対立 — fighter1 のセリフ
  B2_fighter1: {
    負けず嫌い: ['あいつの態度が許せない。もう我慢の限界だ'],
    闘志:    ['あの人とは根本的に合わない。けじめをつけたい'],
    リーダー気質: ['チームのためにも、この問題ははっきりさせるべきだ'],
    破天荒:   ['あいつとはもう無理！顔も見たくない！'],
    野心:    ['足を引っ張る人間とは一緒にやれない'],
    default:  ['このままじゃチームがもたない。何とかしてほしい'],
  },
  // B2: 対立 — fighter2 のセリフ
  B2_fighter2: {
    負けず嫌い: ['私だって黙ってない。向こうが謝るべきだ'],
    闘志:    ['正面からぶつかって決着つけるしかないでしょう'],
    リーダー気質: ['私のやり方に文句があるなら、はっきり言えばいい'],
    破天荒:   ['売られたケンカは買うよ！来いよ！'],
    忠誠心:   ['団体には迷惑をかけたくないけど…あの人とは無理です'],
    default:  ['向こうにも非があるのに、私だけ悪いみたいに…'],
  },
  // B3: 対抗戦 — 挑戦者のセリフ（憎たらしい態度）
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
  // B3: 断った場合の挑発追加セリフ
  B3_decline: [
    'やっぱりな。逃げると思ってたよ',
    'チキンか。まぁ、賢い判断だな',
    '怖いなら仕方ないよな。次はないと思え',
    'はっ…自分たちの実力を分かってるんだね。偉いよ',
    '断るんだ？ まぁ、恥をかくよりマシか',
    'がっかりだよ。勝負する度胸もないのか',
    'あーあ、つまんないの。ファンも残念がるだろうね',
  ],
  // B3: 勝利時の挑戦者セリフ
  B3_result_lose: [
    'くっ…認めたくないが、やるじゃないか',
    '今回は負けを認める。だが次はこうはいかない',
    'まぐれだ…次は叩き潰してやる',
    '…っ！ 覚えてなさいよ。これで終わりじゃないから',
    '信じられない…こんな結果は認めない',
    'やるね。見直したよ…だけど、次は容赦しない',
    'ちょっとは楽しめたよ。でもこれで調子に乗らないことだね',
  ],
  // B3: 敗北時の挑戦者セリフ
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
    努力家:  ['私なんかでいいんですか？ …精一杯頑張ります！'],
    野心:   ['いい機会ですね。全国に私の実力を見せてやります'],
    破天荒:  ['マジで！？ テレビに出れるの！？ やったー！'],
    ファンサービス: ['ファンの皆さんに、もっと近い姿を見せられますね'],
    リーダー気質: ['団体の代表として、恥ずかしくない姿を見せます'],
    default: ['取材…緊張しますが、いい試合を見せられるよう頑張ります'],
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
  fighter: [
    'みんなで掴んだ頂点だ。最高のチームだよ',
    'ここが頂点……でも、まだ先がある気がする',
    '入団した時は、まさかここまで来れるなんて思わなかった',
    'この団体で戦えて、本当に良かった',
    '一番になったんだ。信じられない……でも、これが現実だ',
    '練習してきたことが全部報われた。泣きそう',
    '私たちの戦いが、業界を変えた。誇りに思う',
    '最高の仲間と、最高の舞台。感謝しかない',
    'ここで終わりじゃない。もっと強くなって、もっと上を目指す',
    'この景色を見るために戦ってきた。最高だ',
    'お金がなかった頃のことを思い出すと…よくここまで来たよね',
    'あの時辞めなくてよかった。この瞬間のために全部あったんだ',
    'ライバルたちがいたから、ここまで来れた。全員に感謝したい',
    '涙が止まらない……こんなに幸せなことがあっていいのかな',
    'これは始まりだ。この団体はもっともっと大きくなる',
  ],
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
