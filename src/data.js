// ╔══════════════════════════════════════════════════════════╗
// ║  EXTERNAL LINKS                                          ║
// ╚══════════════════════════════════════════════════════════╝
const FEEDBACK_FORM_URL = 'https://forms.gle/73biRkZ9c23EgRuP7';

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 1: CHARACTER DATA                               ║
// ╚══════════════════════════════════════════════════════════╝
const ALL_CHARS = [
  {id:1,name:'阿武隈塔子',surname:'阿武隈',h:173,pw:95,sp:73,te:71,st:81,mn:80,style:'Grappler',role:'Babyface',pot:{pw:184,sp:155,te:152,st:165,mn:164},traits:['リーダー気質','人望','威圧感','引き出し上手','ガラスの身体'],personality:'normal',archetype:'composed',affinityAxis:'auto'},
  {id:2,name:'富岡加奈子',surname:'富岡',h:168,pw:90,sp:68,te:70,st:76,mn:83,style:'Grappler',role:'Babyface',pot:{pw:177,sp:148,te:151,st:159,mn:168},traits:['努力家','頑丈さ','闘志','負けず嫌い'],personality:'normal',archetype:'ojousama',affinityAxis:'auto'},
  {id:3,name:'澤出みずき',surname:'澤出',h:158,pw:73,sp:78,te:73,st:73,mn:72,style:'Allround',role:'Neutral',pot:{pw:155,sp:161,te:155,st:155,mn:154},traits:['引き出し上手','早熟','適応力'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:4,name:'高津小春',surname:'高津',h:161,pw:73,sp:75,te:47,st:79,mn:91,style:'Allround',role:'Babyface',pot:{pw:155,sp:158,te:155,st:163,mn:178},traits:['晩成','番狂わせ体質','負けず嫌い','闘志','反骨心'],personality:'bold',archetype:'normal',affinityAxis:'auto'},
  {id:5,name:'深町真琴',surname:'深町',h:160,pw:58,sp:91,te:62,st:85,mn:63,style:'Aerial',role:'Babyface',pot:{pw:135,sp:185,te:141,st:170,mn:142},traits:['努力家','華','鉄人'],personality:'normal',archetype:'normal',affinityAxis:'auto'},
  {id:6,name:'副沢たまき',surname:'副沢',h:161,pw:58,sp:72,te:74,st:65,mn:80,style:'Allround',role:'Neutral',pot:{pw:135,sp:154,te:156,st:144,mn:164},traits:['ムードメーカー','早熟','破天荒'],personality:'easygoing',archetype:'composed',affinityAxis:'auto'},
  {id:7,name:'高階まさみ',surname:'高階',h:161,pw:58,sp:62,te:73,st:63,mn:66,style:'Submission',role:'Babyface',pot:{pw:135,sp:141,te:155,st:142,mn:146},traits:['引き出し上手','忠誠心'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:8,name:'林真尋',surname:'林',h:174,pw:71,sp:73,te:43,st:61,mn:52,style:'Striker',role:'Neutral',pot:{pw:152,sp:155,te:116,st:139,mn:128},traits:['負けず嫌い'],personality:'emotional',archetype:'composed',affinityAxis:'auto'},
  {id:9,name:'宇田川里奈',surname:'宇田川',h:167,pw:51,sp:62,te:54,st:63,mn:48,style:'Aerial',role:'Neutral',pot:{pw:126,sp:141,te:130,st:142,mn:122},traits:['ファンサービス'],personality:'easygoing',archetype:'normal',affinityAxis:'auto'},
  {id:11,name:'橘玲美',surname:'橘',h:171,pw:71,sp:73,te:91,st:75,mn:74,style:'Submission',role:'Heel',pot:{pw:152,sp:155,te:178,st:158,mn:156},traits:['ヒール適性','威圧感','早熟','華'],personality:'normal',archetype:'seductive',affinityAxis:'auto'},
  {id:12,name:'生駒エリカ',surname:'生駒',h:153,pw:78,sp:71,te:55,st:82,mn:82,style:'Brawler',role:'Heel',pot:{pw:161,sp:152,te:156,st:167,mn:167},traits:['負けず嫌い','闘志','鉄人','人望','反骨心'],personality:'easygoing',archetype:'delinquent',affinityAxis:{pairedWith:11,maxOffsetDeg:30}},
  {id:13,name:'堂前ユキ',surname:'堂前',h:163,pw:81,sp:84,te:43,st:64,mn:73,style:'Striker',role:'Neutral',pot:{pw:165,sp:169,te:128,st:143,mn:155},traits:['破天荒'],personality:'quiet',archetype:'cool',affinityAxis:'auto'},
  {id:14,name:'黒江舞',surname:'黒江',h:159,pw:48,sp:52,te:76,st:58,mn:67,style:'Submission',role:'Heel',pot:{pw:122,sp:128,te:159,st:135,mn:147},traits:['ヒール適性','早熟'],personality:'shy',archetype:'polite',affinityAxis:'auto'},
  {id:15,name:'楠木なぎさ',surname:'楠木',h:178,pw:79,sp:65,te:21,st:66,mn:62,style:'Brawler',role:'Babyface',pot:{pw:163,sp:144,te:121,st:146,mn:141},traits:['威圧感'],personality:'normal',archetype:'composed',affinityAxis:'auto'},
  {id:16,name:'大河内紗代子',surname:'大河内',h:164,pw:93,sp:76,te:66,st:69,mn:77,style:'Grappler',role:'Heel',pot:{pw:181,sp:159,te:146,st:150,mn:160},traits:['リーダー気質','威圧感','華','野心'],personality:'bold',archetype:'ojousama',affinityAxis:'auto'},
  {id:17,name:'川野辺菜穂子',surname:'川野辺',h:168,pw:66,sp:80,te:69,st:71,mn:76,style:'Aerial',role:'Babyface',pot:{pw:146,sp:164,te:150,st:152,mn:159},traits:['ライバル体質','名勝負製造機','華','負けず嫌い'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:18,name:'出羽鷹子',surname:'出羽',h:184,pw:82,sp:71,te:68,st:78,mn:80,style:'Grappler',role:'Heel',pot:{pw:167,sp:152,te:148,st:161,mn:164},traits:['威圧感','適応力'],personality:'bold',archetype:'delinquent',affinityAxis:'auto'},
  {id:19,name:'四条あずさ',surname:'四条',h:163,pw:64,sp:68,te:62,st:67,mn:62,style:'Allround',role:'Neutral',pot:{pw:143,sp:148,te:141,st:147,mn:141},traits:['忠誠心','適応力'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:20,name:'岸ゆみえ',surname:'岸',h:155,pw:65,sp:71,te:78,st:68,mn:73,style:'Submission',role:'Babyface',pot:{pw:144,sp:152,te:161,st:148,mn:155},traits:['名勝負製造機','引き出し上手'],personality:'quiet',archetype:'polite',affinityAxis:'auto'},
  {id:21,name:'木ノ内幸音',surname:'木ノ内',h:164,pw:66,sp:53,te:53,st:68,mn:67,style:'Allround',role:'Babyface',pot:{pw:146,sp:129,te:129,st:148,mn:147},traits:['ヒール適性','ムードメーカー','華'],personality:'easygoing',archetype:'polite',affinityAxis:'auto'},
  {id:22,name:'美濃山まりな',surname:'美濃山',h:173,pw:80,sp:38,te:48,st:59,mn:48,style:'Brawler',role:'Neutral',pot:{pw:164,sp:109,te:122,st:137,mn:122},traits:['ヒール適性'],personality:'bold',archetype:'delinquent',affinityAxis:'auto'},
  {id:23,name:'早見知子',surname:'早見',h:162,pw:51,sp:43,te:42,st:51,mn:41,style:'Striker',role:'Heel',pot:{pw:126,sp:116,te:115,st:126,mn:113},traits:['適応力'],personality:'quiet',archetype:'normal',affinityAxis:'auto'},
  {id:24,name:'園部梨花',surname:'園部',h:158,pw:46,sp:48,te:41,st:42,mn:43,style:'Allround',role:'Heel',pot:{pw:120,sp:122,te:113,st:115,mn:116},traits:[],personality:'bold',archetype:'normal',affinityAxis:'auto'},
  {id:25,name:'石戸谷なつき',surname:'石戸谷',h:164,pw:61,sp:31,te:34,st:45,mn:38,style:'Brawler',role:'Heel',pot:{pw:139,sp:100,te:104,st:118,mn:109},traits:['早熟'],personality:'normal',archetype:'delinquent',affinityAxis:'auto'},
  {id:26,name:'宮守なつめ',surname:'宮守',h:165,pw:62,sp:72,te:58,st:66,mn:63,style:'Allround',role:'Babyface',pot:{pw:141,sp:154,te:135,st:146,mn:142},traits:['努力家','早熟'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:27,name:'八重樫舞',surname:'八重樫',h:167,pw:71,sp:63,te:42,st:66,mn:51,style:'Striker',role:'Babyface',pot:{pw:152,sp:142,te:115,st:146,mn:126},traits:['鉄人'],personality:'normal',archetype:'composed',affinityAxis:'auto'},
  {id:28,name:'岩屋みら',surname:'岩屋',h:169,pw:82,sp:74,te:62,st:55,mn:61,style:'Brawler',role:'Neutral',pot:{pw:167,sp:156,te:141,st:132,mn:139},traits:['ガラスの身体','早熟','鉄人'],personality:'normal',archetype:'delinquent',affinityAxis:'auto'},
  {id:29,name:'相沢未来',surname:'相沢',h:162,pw:73,sp:74,te:62,st:78,mn:74,style:'Allround',role:'Babyface',pot:{pw:155,sp:156,te:141,st:161,mn:156},traits:['人望','鉄人'],personality:'normal',archetype:'normal',affinityAxis:'auto'},
  {id:30,name:'松川杏樹',surname:'松川',h:174,pw:70,sp:74,te:68,st:72,mn:71,style:'Grappler',role:'Neutral',pot:{pw:151,sp:156,te:148,st:154,mn:152},traits:['晩成','鉄人'],personality:'easygoing',archetype:'normal',affinityAxis:'auto'},
  {id:31,name:'平松かなみ',surname:'平松',h:158,pw:61,sp:67,te:76,st:64,mn:72,style:'Submission',role:'Babyface',pot:{pw:139,sp:147,te:159,st:143,mn:154},traits:['努力家','適応力'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:32,name:'双里明日香',surname:'双里',h:161,pw:54,sp:61,te:68,st:67,mn:60,style:'Submission',role:'Babyface',pot:{pw:130,sp:139,te:148,st:147,mn:138},traits:['負けず嫌い'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:33,name:'梅ヶ丘みのり',surname:'梅ヶ丘',h:163,pw:78,sp:71,te:76,st:80,mn:80,style:'Allround',role:'Babyface',pot:{pw:161,sp:152,te:159,st:164,mn:164},traits:['リーダー気質','負けず嫌い'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:34,name:'北畠吉乃',surname:'北畠',h:162,pw:68,sp:72,te:84,st:72,mn:69,style:'Submission',role:'Neutral',pot:{pw:148,sp:154,te:169,st:154,mn:150},traits:['破天荒','早熟','努力家'],personality:'quiet',archetype:'composed',affinityAxis:'auto'},
  {id:35,name:'上野原弥生',surname:'上野原',h:179,pw:82,sp:58,te:63,st:68,mn:58,style:'Grappler',role:'Neutral',pot:{pw:167,sp:135,te:142,st:148,mn:135},traits:['頑丈さ'],personality:'bold',archetype:'normal',affinityAxis:'auto'},
  {id:36,name:'真鍋綾乃',surname:'真鍋',h:181,pw:80,sp:54,te:65,st:63,mn:60,style:'Grappler',role:'Neutral',pot:{pw:164,sp:130,te:144,st:142,mn:138},traits:['頑丈さ'],personality:'quiet',archetype:'cool',affinityAxis:'auto'},
  {id:37,name:'白銀麗子',surname:'白銀',h:165,pw:74,sp:81,te:79,st:79,mn:74,style:'Allround',role:'Babyface',pot:{pw:156,sp:165,te:163,st:163,mn:156},traits:['不屈','華','頑丈さ'],personality:'bold',archetype:'polite',affinityAxis:'auto'},
  {id:38,name:'芝彩音',surname:'芝',h:168,pw:88,sp:64,te:67,st:78,mn:76,style:'Grappler',role:'Babyface',pot:{pw:174,sp:143,te:147,st:161,mn:159},traits:['華','闘志'],personality:'earnest',archetype:'ojousama',affinityAxis:'auto'},
  {id:39,name:'神谷沙奈絵',surname:'神谷',h:161,pw:63,sp:76,te:64,st:65,mn:52,style:'Striker',role:'Neutral',pot:{pw:138,sp:159,te:143,st:144,mn:128},traits:['忠誠心'],personality:'quiet',archetype:'cool',affinityAxis:'auto'},
  {id:40,name:'高輪まみ',surname:'高輪',h:149,pw:51,sp:67,te:54,st:71,mn:71,style:'Allround',role:'Babyface',pot:{pw:126,sp:147,te:130,st:152,mn:152},traits:['頑丈さ'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:41,name:'根岸亞里亞',surname:'根岸',h:163,pw:68,sp:73,te:81,st:71,mn:71,style:'Submission',role:'Heel',pot:{pw:148,sp:155,te:165,st:152,mn:152},traits:['ヒール適性','早熟'],personality:'easygoing',archetype:'seductive',affinityAxis:'auto'},
  {id:42,name:'本郷真理子',surname:'本郷',h:170,pw:88,sp:67,te:49,st:66,mn:71,style:'Grappler',role:'Heel',pot:{pw:174,sp:147,te:124,st:146,mn:152},traits:['ヒール適性','威圧感'],personality:'bold',archetype:'delinquent',affinityAxis:'auto'},
  {id:43,name:'金沢文',surname:'金沢',h:181,pw:84,sp:59,te:48,st:58,mn:62,style:'Grappler',role:'Neutral',pot:{pw:169,sp:137,te:122,st:135,mn:141},traits:['頑丈さ'],personality:'normal',archetype:'delinquent',affinityAxis:'auto'},
  {id:44,name:'福浦理乃',surname:'福浦',h:153,pw:46,sp:53,te:49,st:44,mn:43,style:'Allround',role:'Heel',pot:{pw:120,sp:129,te:124,st:117,mn:116},traits:[],personality:'emotional',archetype:'composed',affinityAxis:'auto'},
  {id:45,name:'高槻千歳',surname:'高槻',h:164,pw:71,sp:77,te:79,st:74,mn:74,style:'Allround',role:'Heel',pot:{pw:152,sp:160,te:163,st:156,mn:156},traits:['リーダー気質','華','野心'],personality:'quiet',archetype:'seductive',affinityAxis:'auto'},
  {id:46,name:'井沢遥',surname:'井沢',h:165,pw:68,sp:73,te:82,st:64,mn:77,style:'Submission',role:'Babyface',pot:{pw:148,sp:155,te:167,st:143,mn:160},traits:['不屈','名勝負製造機','引き出し上手','負けず嫌い'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:47,name:'斎藤麻衣',surname:'斎藤',h:156,pw:64,sp:68,te:76,st:69,mn:73,style:'Striker',role:'Neutral',pot:{pw:143,sp:141,te:146,st:150,mn:155},traits:['早熟'],personality:'bold',archetype:'composed',affinityAxis:'auto'},
  {id:48,name:'菊池璃子',surname:'菊池',h:162,pw:74,sp:76,te:69,st:71,mn:78,style:'Striker',role:'Neutral',pot:{pw:156,sp:159,te:150,st:152,mn:161},traits:['負けず嫌い','適応力','闘志'],personality:'bold',archetype:'composed',affinityAxis:'auto'},
  {id:49,name:'高橋まゆみ',surname:'高橋',h:161,pw:66,sp:70,te:73,st:68,mn:75,style:'Allround',role:'Babyface',pot:{pw:146,sp:151,te:155,st:148,mn:158},traits:['ファンサービス','名���負製造機','華'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:50,name:'相田萌',surname:'相田',h:156,pw:64,sp:63,te:63,st:67,mn:55,style:'Allround',role:'Neutral',pot:{pw:143,sp:142,te:142,st:147,mn:132},traits:['ファンサービス','適応力'],personality:'easygoing',archetype:'seductive',affinityAxis:'auto'},
  {id:51,name:'三橋ふみえ',surname:'三橋',h:172,pw:63,sp:59,te:81,st:58,mn:50,style:'Submission',role:'Neutral',pot:{pw:142,sp:137,te:165,st:135,mn:125},traits:['ヒール適性','ファンサービス'],personality:'easygoing',archetype:'seductive',affinityAxis:'auto'},
  {id:52,name:'西川ちあき',surname:'西川',h:171,pw:68,sp:58,te:48,st:58,mn:54,style:'Striker',role:'Heel',pot:{pw:148,sp:135,te:122,st:135,mn:135},traits:[],personality:'normal',archetype:'cool',affinityAxis:'auto'},
  {id:53,name:'小森さなえ',surname:'小森',h:164,pw:68,sp:48,te:38,st:58,mn:60,style:'Brawler',role:'Neutral',pot:{pw:148,sp:122,te:109,st:135,mn:138},traits:['ムードメーカー'],personality:'normal',archetype:'normal',affinityAxis:'auto'},
  {id:54,name:'阿部みのり',surname:'阿部',h:154,pw:43,sp:40,te:38,st:48,mn:50,style:'Allround',role:'Babyface',pot:{pw:122,sp:135,te:138,st:128,mn:144},traits:[],personality:'shy',archetype:'polite',affinityAxis:'auto'},
  {id:55,name:'大久保桃子',surname:'大久保',h:163,pw:72,sp:73,te:74,st:71,mn:80,style:'Allround',role:'Babyface',pot:{pw:154,sp:155,te:156,st:152,mn:164},traits:['不屈','鉄人','頑丈さ'],personality:'bold',archetype:'polite',affinityAxis:'auto'},
  {id:56,name:'片桐ありさ',surname:'片桐',h:167,pw:63,sp:68,te:80,st:67,mn:76,style:'Submission',role:'Neutral',pot:{pw:142,sp:148,te:164,st:147,mn:159},traits:['ライバル体質','負けず嫌い'],personality:'normal',archetype:'seductive',affinityAxis:'auto'},
  {id:57,name:'浅見里緒菜',surname:'浅見',h:158,pw:60,sp:58,te:74,st:61,mn:68,style:'Submission',role:'Heel',pot:{pw:138,sp:135,te:156,st:139,mn:148},traits:['リーダー気質','早熟','負けず嫌い','野心'],personality:'bold',archetype:'seductive',affinityAxis:'auto'},
  {id:58,name:'丹羽穂垂',surname:'丹羽',h:169,pw:76,sp:54,te:63,st:64,mn:57,style:'Allround',role:'Neutral',pot:{pw:159,sp:130,te:142,st:143,mn:134},traits:['引き出し上手','負けず嫌い'],personality:'bold',archetype:'normal',affinityAxis:'auto'},
  {id:59,name:'池辺マリ',surname:'池辺',h:162,pw:70,sp:51,te:40,st:62,mn:53,style:'Brawler',role:'Heel',pot:{pw:151,sp:126,te:112,st:141,mn:129},traits:['負けず嫌い'],personality:'bold',archetype:'delinquent',affinityAxis:'auto'},
  {id:60,name:'馬入橋ほとり',surname:'馬入橋',h:157,pw:82,sp:68,te:59,st:70,mn:78,style:'Grappler',role:'Babyface',pot:{pw:167,sp:148,te:137,st:151,mn:161},traits:['早熟','鉄人','頑丈さ'],personality:'earnest',archetype:'composed',affinityAxis:'auto'},
  {id:61,name:'観音崎せりか',surname:'観音崎',h:169,pw:69,sp:73,te:71,st:72,mn:76,style:'Allround',role:'Heel',pot:{pw:150,sp:155,te:152,st:154,mn:159},traits:['ムードメーカー','人望'],personality:'bold',archetype:'seductive',affinityAxis:'auto'},
  {id:62,name:'宮ケ瀬千夏',surname:'宮ケ瀬',h:169,pw:70,sp:66,te:40,st:66,mn:50,style:'Brawler',role:'Heel',pot:{pw:151,sp:146,te:112,st:146,mn:125},traits:['ヒール適性','威圧感'],personality:'bold',archetype:'delinquent',affinityAxis:'auto'},
  {id:63,name:'伊勢原文奈',surname:'伊勢原',h:158,pw:53,sp:58,te:56,st:55,mn:55,style:'Allround',role:'Babyface',pot:{pw:129,sp:135,te:133,st:132,mn:132},traits:['忠誠心'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:64,name:'湯本ほたる',surname:'湯本',h:160,pw:52,sp:58,te:51,st:54,mn:48,style:'Allround',role:'Neutral',pot:{pw:128,sp:135,te:126,st:130,mn:122},traits:[],personality:'emotional',archetype:'composed',affinityAxis:'auto'},
  {id:65,name:'倉見菜々',surname:'倉見',h:161,pw:72,sp:73,te:77,st:79,mn:84,style:'Allround',role:'Neutral',pot:{pw:154,sp:155,te:160,st:163,mn:169},traits:['ファンサービス','名勝負製造機'],personality:'easygoing',archetype:'seductive',affinityAxis:'auto'},
  {id:66,name:'長谷川レオナ',surname:'長谷川',h:164,pw:78,sp:70,te:78,st:69,mn:78,style:'Allround',role:'Neutral',pot:{pw:161,sp:151,te:161,st:150,mn:161},traits:['人望','引き出し上手'],personality:'normal',archetype:'seductive',affinityAxis:'auto'},
  {id:67,name:'柳島みずほ',surname:'柳島',h:165,pw:83,sp:61,te:68,st:73,mn:83,style:'Grappler',role:'Babyface',pot:{pw:168,sp:139,te:148,st:155,mn:168},traits:['ファンサービス','華','野心'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:68,name:'大庭愛菜',surname:'大庭',h:155,pw:68,sp:77,te:52,st:70,mn:76,style:'Striker',role:'Neutral',pot:{pw:148,sp:160,te:128,st:151,mn:159},traits:['負けず嫌い'],personality:'bold',archetype:'normal',affinityAxis:'auto'},
  {id:69,name:'早川モナ',surname:'早川',h:162,pw:63,sp:74,te:63,st:74,mn:64,style:'Aerial',role:'Babyface',pot:{pw:142,sp:156,te:142,st:156,mn:143},traits:['華','負けず嫌い'],personality:'easygoing',archetype:'normal',affinityAxis:'auto'},
  {id:70,name:'浜竹美咲',surname:'浜竹',h:167,pw:80,sp:57,te:63,st:68,mn:68,style:'Grappler',role:'Neutral',pot:{pw:164,sp:134,te:142,st:148,mn:148},traits:['引き出し上手','忠誠心'],personality:'normal',archetype:'normal',affinityAxis:'auto'},
  {id:71,name:'東金沙織',surname:'東金',h:167,pw:70,sp:62,te:69,st:62,mn:67,style:'Allround',role:'Neutral',pot:{pw:145,sp:134,te:150,st:141,mn:147},traits:['ファンサービス'],personality:'emotional',archetype:'seductive',affinityAxis:'auto'},
  {id:72,name:'穴澤ほのか',surname:'穴澤',h:168,pw:74,sp:58,te:65,st:63,mn:70,style:'Grappler',role:'Neutral',pot:{pw:156,sp:135,te:144,st:142,mn:151},traits:['ファンサービス','引き出し上手','野心'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:73,name:'大馬越よし子',surname:'大馬越',h:179,pw:84,sp:48,te:56,st:67,mn:68,style:'Grappler',role:'Neutral',pot:{pw:169,sp:122,te:148,st:147,mn:148},traits:['威圧感','頑丈さ'],personality:'bold',archetype:'delinquent',affinityAxis:'auto'},
  {id:74,name:'富士見ヶ丘遥',surname:'富士見ヶ丘',h:164,pw:60,sp:68,te:58,st:66,mn:70,style:'Allround',role:'Babyface',pot:{pw:138,sp:148,te:135,st:146,mn:151},traits:['ファンサービス'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:75,name:'海老名栞',surname:'海老名',h:159,pw:53,sp:58,te:67,st:63,mn:80,style:'Submission',role:'Babyface',pot:{pw:129,sp:135,te:147,st:142,mn:164},traits:['ファンサービス','ライバル体質','野心'],personality:'easygoing',archetype:'normal',affinityAxis:'auto'},
  {id:76,name:'栗林あかり',surname:'栗林',h:153,pw:68,sp:68,te:40,st:66,mn:58,style:'Striker',role:'Neutral',pot:{pw:148,sp:148,te:112,st:146,mn:135},traits:['ライバル体質','負けず嫌い'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:77,name:'新見ゆり',surname:'新見',h:168,pw:66,sp:57,te:63,st:54,mn:53,style:'Allround',role:'Neutral',pot:{pw:146,sp:134,te:142,st:130,mn:129},traits:['引き出し上手'],personality:'earnest',archetype:'seductive',affinityAxis:'auto'},
  {id:78,name:'椿山みさき',surname:'椿山',h:163,pw:58,sp:54,te:51,st:63,mn:60,style:'Allround',role:'Babyface',pot:{pw:137,sp:130,te:141,st:142,mn:138},traits:['引き出し上手','華','負けず嫌い'],personality:'normal',archetype:'normal',affinityAxis:'auto'},
  {id:79,name:'久堂梨々花',surname:'久堂',h:156,pw:67,sp:63,te:46,st:56,mn:38,style:'Brawler',role:'Heel',pot:{pw:147,sp:142,te:120,st:133,mn:133},traits:['ヒール適性'],personality:'bold',archetype:'delinquent',affinityAxis:'auto'},
  {id:80,name:'高島さや',surname:'高島',h:145,pw:21,sp:32,te:19,st:18,mn:19,style:'Allround',role:'Babyface',pot:{pw:129,sp:164,te:166,st:132,mn:85},traits:['ファンサービス','ムードメーカー'],personality:'shy',archetype:'polite',affinityAxis:'auto'},
  // ── 新規キャラクター（v1.4 GameID 81〜99）──
  {id:81,name:'坂本莉衣奈',surname:'坂本',h:153,pw:68,sp:76,te:65,st:78,mn:77,style:'Aerial',role:'Neutral',pot:{pw:148,sp:159,te:144,st:161,mn:160},traits:['ムードメーカー'],personality:'easygoing',archetype:'normal',affinityAxis:'auto'},
  {id:82,name:'近藤ゆりか',surname:'近藤',h:166,pw:68,sp:72,te:70,st:71,mn:73,style:'Grappler',role:'Neutral',pot:{pw:148,sp:154,te:151,st:152,mn:155},traits:['不屈','鉄人'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:83,name:'佐久間ひより',surname:'佐久間',h:151,pw:61,sp:58,te:48,st:56,mn:68,style:'Allround',role:'Babyface',pot:{pw:139,sp:135,te:122,st:133,mn:148},traits:['負けず嫌い'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:84,name:'南谷杏',surname:'南谷',h:166,pw:65,sp:56,te:63,st:59,mn:50,style:'Allround',role:'Neutral',pot:{pw:144,sp:133,te:142,st:137,mn:125},traits:['ファンサービス'],personality:'bold',archetype:'normal',affinityAxis:'auto'},
  {id:85,name:'鴨志田ルーシー',surname:'鴨志田',h:172,pw:74,sp:58,te:43,st:69,mn:73,style:'Grappler',role:'Neutral',pot:{pw:156,sp:135,te:116,st:150,mn:155},traits:['頑丈さ'],personality:'earnest',archetype:'composed',affinityAxis:'auto'},
  {id:86,name:'芹沢亜里紗',surname:'芹沢',h:166,pw:70,sp:70,te:53,st:58,mn:61,style:'Allround',role:'Heel',pot:{pw:151,sp:151,te:129,st:135,mn:139},traits:['ファンサービス'],personality:'emotional',archetype:'seductive',affinityAxis:'auto'},
  {id:87,name:'レオナ・O・シュタインフェルト',surname:'シュタインフェルト',h:152,pw:72,sp:77,te:43,st:65,mn:68,style:'Aerial',role:'Babyface',pot:{pw:154,sp:160,te:116,st:144,mn:148},traits:['華'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:88,name:'愛川明日香',surname:'愛川',h:162,pw:52,sp:54,te:70,st:65,mn:48,style:'Allround',role:'Heel',pot:{pw:128,sp:130,te:151,st:144,mn:122},traits:[],personality:'easygoing',archetype:'seductive',affinityAxis:'auto'},
  {id:89,name:'赤羽あんな',surname:'赤羽',h:163,pw:73,sp:75,te:64,st:69,mn:68,style:'Aerial',role:'Neutral',pot:{pw:155,sp:158,te:143,st:150,mn:148},traits:['ファンサービス'],personality:'bold',archetype:'normal',affinityAxis:'auto'},
  {id:90,name:'玉手すみれ',surname:'玉手',h:161,pw:72,sp:69,te:75,st:74,mn:72,style:'Grappler',role:'Neutral',pot:{pw:154,sp:150,te:158,st:156,mn:154},traits:['ヒール適性','威圧感','華'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:91,name:'等々力あかね',surname:'等々力',h:170,pw:71,sp:72,te:68,st:74,mn:68,style:'Allround',role:'Neutral',pot:{pw:152,sp:154,te:148,st:156,mn:148},traits:['負けず嫌い'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:92,name:'飯島冴子',surname:'飯島',h:170,pw:66,sp:58,te:69,st:46,mn:44,style:'Submission',role:'Neutral',pot:{pw:146,sp:135,te:137,st:120,mn:117},traits:['忠誠心'],personality:'earnest',archetype:'seductive',affinityAxis:'auto'},
  {id:93,name:'松久保伊織',surname:'松久保',h:163,pw:61,sp:64,te:69,st:59,mn:54,style:'Grappler',role:'Babyface',pot:{pw:139,sp:143,te:150,st:137,mn:130},traits:['忠誠心','早熟'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:94,name:'須藤美月',surname:'須藤',h:158,pw:58,sp:58,te:65,st:48,mn:45,style:'Submission',role:'Heel',pot:{pw:135,sp:135,te:144,st:122,mn:118},traits:['ヒール適性'],personality:'bold',archetype:'composed',affinityAxis:'auto'},
  {id:95,name:'小西ゆきえ',surname:'小西',h:165,pw:57,sp:63,te:77,st:61,mn:74,style:'Allround',role:'Neutral',pot:{pw:134,sp:142,te:160,st:139,mn:156},traits:['ガラスの身体','ファンサービス','早熟'],personality:'earnest',archetype:'seductive',affinityAxis:'auto'},
  {id:96,name:'松下真理亜',surname:'松下',h:171,pw:72,sp:71,te:65,st:68,mn:58,style:'Allround',role:'Neutral',pot:{pw:154,sp:152,te:144,st:148,mn:135},traits:['ファンサービス','早熟'],personality:'normal',archetype:'composed',affinityAxis:'auto'},
  {id:97,name:'岩崎みどり',surname:'岩崎',h:158,pw:70,sp:79,te:48,st:74,mn:62,style:'Allround',role:'Neutral',pot:{pw:151,sp:163,te:122,st:156,mn:141},traits:['努力家','負けず嫌い','頑丈さ'],personality:'earnest',archetype:'normal',affinityAxis:'auto'},
  {id:98,name:'米山杏里',surname:'米山',h:169,pw:69,sp:64,te:77,st:68,mn:71,style:'Allround',role:'Babyface',pot:{pw:150,sp:143,te:160,st:148,mn:152},traits:['ガラスの身体','リーダー気質','人望','引き出し上手'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:99,name:'三浦早紀',surname:'三浦',h:166,pw:76,sp:73,te:74,st:78,mn:65,style:'Grappler',role:'Babyface',pot:{pw:159,sp:155,te:156,st:161,mn:144},traits:['ファンサービス','ライバル体質','早熟'],personality:'normal',archetype:'normal',affinityAxis:'auto'},
  // ── 新規キャラクター（v1.5 GameID 100〜128）──
  {id:100,name:'土岐山乃ノ佳',surname:'土岐山',h:152,pw:48,sp:48,te:60,st:49,mn:43,style:'Aerial',role:'Babyface',pot:{pw:122,sp:122,te:138,st:124,mn:116},traits:['努力家'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:101,name:'沢登鮎',surname:'沢登',h:168,pw:68,sp:51,te:64,st:69,mn:51,style:'Grappler',role:'Babyface',pot:{pw:148,sp:126,te:143,st:150,mn:126},traits:['引き出し上手'],personality:'easygoing',archetype:'polite',affinityAxis:'auto'},
  {id:102,name:'大山たかみ',surname:'大山',h:179,pw:71,sp:51,te:45,st:52,mn:51,style:'Striker',role:'Heel',pot:{pw:152,sp:126,te:118,st:128,mn:126},traits:[],personality:'normal',archetype:'composed',affinityAxis:'auto'},
  {id:103,name:'財津琴美',surname:'財津',h:154,pw:54,sp:58,te:64,st:67,mn:61,style:'Allround',role:'Babyface',pot:{pw:130,sp:135,te:143,st:147,mn:139},traits:['努力家'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:104,name:'吉野萌子',surname:'吉野',h:149,pw:48,sp:55,te:52,st:52,mn:48,style:'Aerial',role:'Neutral',pot:{pw:122,sp:132,te:128,st:128,mn:122},traits:[],personality:'emotional',archetype:'normal',affinityAxis:'auto'},
  {id:105,name:'黒岩千晶',surname:'黒岩',h:181,pw:81,sp:54,te:52,st:64,mn:56,style:'Grappler',role:'Neutral',pot:{pw:165,sp:130,te:128,st:143,mn:133},traits:['頑丈さ'],personality:'normal',archetype:'composed',affinityAxis:'auto'},
  {id:106,name:'赤沼紗稀',surname:'赤沼',h:166,pw:61,sp:67,te:58,st:48,mn:50,style:'Striker',role:'Neutral',pot:{pw:139,sp:147,te:135,st:122,mn:125},traits:[],personality:'normal',archetype:'cool',affinityAxis:'auto'},
  {id:107,name:'松岡綾乃',surname:'松岡',h:169,pw:47,sp:58,te:71,st:58,mn:57,style:'Submission',role:'Neutral',pot:{pw:121,sp:135,te:152,st:135,mn:134},traits:['引き出し上手'],personality:'normal',archetype:'cool',affinityAxis:'auto'},
  {id:108,name:'結城玲奈',surname:'結城',h:158,pw:56,sp:67,te:58,st:62,mn:56,style:'Allround',role:'Neutral',pot:{pw:133,sp:147,te:135,st:141,mn:133},traits:['努力家'],personality:'normal',archetype:'polite',affinityAxis:'auto'},
  {id:109,name:'戸塚ゆかり',surname:'戸塚',h:160,pw:66,sp:55,te:53,st:68,mn:62,style:'Aerial',role:'Babyface',pot:{pw:146,sp:132,te:129,st:148,mn:141},traits:['ムードメーカー'],personality:'easygoing',archetype:'polite',affinityAxis:'auto'},
  {id:110,name:'若林美佐子',surname:'若林',h:166,pw:64,sp:57,te:63,st:68,mn:52,style:'Allround',role:'Neutral',pot:{pw:143,sp:134,te:142,st:148,mn:128},traits:['引き出し上手'],personality:'normal',archetype:'composed',affinityAxis:'auto'},
  {id:111,name:'相模あずみ',surname:'相模',h:164,pw:62,sp:66,te:58,st:64,mn:67,style:'Grappler',role:'Neutral',pot:{pw:141,sp:146,te:135,st:143,mn:147},traits:['ライバル体質','負けず嫌い'],personality:'normal',archetype:'composed',affinityAxis:'auto'},
  {id:112,name:'朝比奈ひかり',surname:'朝比奈',h:162,pw:52,sp:56,te:48,st:63,mn:59,style:'Aerial',role:'Babyface',pot:{pw:128,sp:133,te:122,st:142,mn:137},traits:['ファンサービス','華'],personality:'shy',archetype:'normal',affinityAxis:'auto'},
  {id:113,name:'綿貫すず',surname:'綿貫',h:159,pw:51,sp:61,te:53,st:52,mn:54,style:'Striker',role:'Neutral',pot:{pw:126,sp:139,te:129,st:128,mn:130},traits:['ファンサービス','華'],personality:'quiet',archetype:'polite',affinityAxis:'auto'},
  {id:114,name:'木村レイカ',surname:'木村',h:164,pw:58,sp:64,te:62,st:63,mn:69,style:'Grappler',role:'Neutral',pot:{pw:135,sp:143,te:141,st:142,mn:150},traits:['負けず嫌い'],personality:'bold',archetype:'normal',affinityAxis:'auto'},
  {id:115,name:'豊田いすず',surname:'豊田',h:171,pw:69,sp:53,te:63,st:58,mn:63,style:'Grappler',role:'Babyface',pot:{pw:150,sp:129,te:142,st:135,mn:142},traits:['引き出し上手'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:116,name:'リナ・モーガン',surname:'モーガン',h:170,pw:76,sp:77,te:73,st:71,mn:67,style:'Allround',role:'Neutral',pot:{pw:159,sp:160,te:155,st:152,mn:147},traits:['リーダー気質','華'],personality:'easygoing',archetype:'normal',affinityAxis:'auto'},
  {id:117,name:'クラッシャー毒島',surname:'毒島',h:184,pw:88,sp:67,te:58,st:66,mn:55,style:'Brawler',role:'Heel',pot:{pw:174,sp:147,te:135,st:146,mn:132},traits:['ヒール適性','威圧感'],personality:'bold',archetype:'delinquent',affinityAxis:'auto'},
  {id:118,name:'割田久美',surname:'割田',h:181,pw:68,sp:59,te:57,st:58,mn:62,style:'Submission',role:'Heel',pot:{pw:148,sp:137,te:134,st:135,mn:141},traits:['ヒール適性'],personality:'normal',archetype:'delinquent',affinityAxis:'auto'},
  {id:119,name:'岩小路志摩子',surname:'岩小路',h:166,pw:54,sp:73,te:68,st:59,mn:72,style:'Striker',role:'Babyface',pot:{pw:130,sp:155,te:148,st:137,mn:154},traits:['努力家'],personality:'normal',archetype:'ojousama',affinityAxis:'auto'},
  {id:120,name:'蔵前静',surname:'蔵前',h:168,pw:64,sp:56,te:62,st:67,mn:65,style:'Submission',role:'Babyface',pot:{pw:143,sp:133,te:141,st:147,mn:144},traits:['ムードメーカー'],personality:'easygoing',archetype:'ojousama',affinityAxis:'auto'},
  {id:121,name:'山本理香',surname:'山本',h:168,pw:71,sp:68,te:51,st:64,mn:64,style:'Striker',role:'Neutral',pot:{pw:152,sp:148,te:126,st:143,mn:143},traits:['頑丈さ'],personality:'normal',archetype:'seductive',affinityAxis:'auto'},
  {id:122,name:'宮沢ひかる',surname:'宮沢',h:164,pw:58,sp:74,te:64,st:60,mn:60,style:'Striker',role:'Neutral',pot:{pw:135,sp:156,te:143,st:138,mn:138},traits:['負けず嫌い'],personality:'quiet',archetype:'normal',affinityAxis:'auto'},
  {id:123,name:'柳沼英子',surname:'柳沼',h:175,pw:65,sp:54,te:53,st:57,mn:55,style:'Striker',role:'Neutral',pot:{pw:144,sp:130,te:129,st:134,mn:132},traits:['適応力'],personality:'normal',archetype:'cool',affinityAxis:'auto'},
  {id:124,name:'清川 怜',surname:'清川',h:175,pw:71,sp:48,te:62,st:56,mn:48,style:'Striker',role:'Neutral',pot:{pw:152,sp:122,te:141,st:133,mn:122},traits:['ライバル体質'],personality:'earnest',archetype:'composed',affinityAxis:'auto'},
  {id:125,name:'藤代絵麻',surname:'藤代',h:171,pw:72,sp:51,te:46,st:74,mn:58,style:'Aerial',role:'Neutral',pot:{pw:154,sp:126,te:120,st:156,mn:135},traits:['ムードメーカー'],personality:'easygoing',archetype:'composed',affinityAxis:'auto'},
  {id:126,name:'西園百合香',surname:'西園',h:165,pw:58,sp:61,te:69,st:59,mn:51,style:'Allround',role:'Neutral',pot:{pw:135,sp:139,te:150,st:137,mn:126},traits:['努力家'],personality:'quiet',archetype:'seductive',affinityAxis:'auto'},
  {id:127,name:'榊原菜摘',surname:'榊原',h:170,pw:66,sp:58,te:64,st:61,mn:58,style:'Allround',role:'Neutral',pot:{pw:146,sp:135,te:143,st:139,mn:135},traits:['努力家','晩成'],personality:'earnest',archetype:'polite',affinityAxis:'auto'},
  {id:128,name:'巳沼紗霧',surname:'巳沼',h:166,pw:68,sp:63,te:88,st:73,mn:67,style:'Submission',role:'Heel',pot:{pw:148,sp:142,te:174,st:155,mn:147},traits:['ヒール適性','リーダー気質'],personality:'bold',archetype:'seductive',affinityAxis:'auto'}
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
  // ── 新規キャラクター（v1.5 GameID 100〜128）──
  100:'先輩の沢登鮎を慕って粕田学園高校に入学した努力家の2年生。まだ能力は発展途上だが、ひたむきな姿勢でコツコツと実力をつけている。',
  101:'後輩思いの良い先輩。面倒見がよいので頼られがちな性格。相手の良さを引き出すグラップリングが持ち味の堅実派。',
  102:'大河内軍団のメンバーで力自慢の高身長。179cmの体格を活かしたパワフルな打撃で相手を圧倒する。',
  103:'粕田学園の生徒。真面目で丁寧な性格の努力家。バランスの良いオールラウンドスタイルで着実に実力を伸ばしている。',
  104:'粕田学園の生徒。まだ発展途上だが、軽やかな身のこなしを活かしたエアリアルスタイルの片鱗を見せる。',
  105:'灰汁洲商業高校出身。181cmの大型グラップラー。体格を活かしたパワフルな戦いを得意とし、頑丈さにも定評がある。',
  106:'灰汁洲商業高校出身。瞬発力を活かした打撃戦を得意とするスピード型ストライカー。クールな雰囲気を纏う。',
  107:'粕田学園高校3年生。相手の隙を突く一瞬のサブミッションが得意技。冷静な観察眼で相手の弱点を見抜く知性派。',
  108:'お嬢様高校に通う育ちの良い優等生。丁寧で品のある立ち居振る舞いだが、努力を惜しまない芯の強さを持つ。',
  109:'ふわっとした雰囲気の天然アイドル系女子高生。マイペースな性格とムードメーカー気質で周囲を和ませる癒し系エアリアルファイター。',
  110:'スポーツジムのインストラクター。鍛え上げた体力と指導経験から来る引き出し上手な試合運びが武器のオールラウンダー。',
  111:'老舗ベーカリーレストランの看板アルバイト。混雑するランチタイムでも冷静にフロアを回す現場の司令塔。負けず嫌いのライバル体質。',
  112:'陽のオーラ全開のグラビアアイドル。明るい笑顔と健康的なプロポーションで現場の空気を変えるムードメーカー。華のあるエアリアルファイト。',
  113:'クールな美貌が売りのグラビアアイドル。ファンサービスに長けた華やかな存在感で、スピードを活かした打撃戦を展開する。',
  114:'人気ファッション誌の専属モデル。ハーフの容姿を活かして活躍中。強気な性格と負けん気でリングでも存在感を放つグラップラー。',
  115:'高校の美人女教師。穏やかな物腰だが、グラップリングの実力は確か。引き出し上手な試合運びで相手の良さも引き出す教育者気質。',
  116:'海外から参戦した実力者。高い身体能力とリーダーシップを兼ね備えたオールラウンダー。華のある試合で観客を魅了する。',
  117:'地下リングで挑戦者をことごとく地獄に沈めてきた処刑人。184cmの巨体から繰り出す破壊的なブロウラーファイトと威圧感で相手を震え上がらせる。',
  118:'地下プロレスで暗躍するヒール。悪徳レフェリーと結託し、新人選手に不公平な試合を強いる卑劣なサブミッション使い。',
  119:'現代社会には不似合いな古風な大和撫子。本当に現代人かと疑うほどの古風さだが、努力家の一面とスピードのある打撃で侮れない実力を持つ。',
  120:'おっとり系お嬢様。穏やかな雰囲気とは裏腹に、グラウンド技術には確かなものがある。ムードメーカー気質でチームの雰囲気を和らげる。',
  121:'快活そうな褐色ギャル。明るく元気な性格で、頑丈さを武器にしたタフなストライカー。',
  122:'ミステリアスな雰囲気の金髪ギャル。寡黙だがリングに上がると負けず嫌いの闘志を見せるスピード型ストライカー。',
  123:'高槻一派のひとり。以前は井沢遥とも交友があったが、団地内の力関係が変わると高槻派に鞍替えした世渡り上手。',
  124:'老舗ベーカリーレストランのアルバイト。同僚との口論が絶えないライバル体質。パワフルな打撃が武器のストライカー。',
  125:'マリンスポーツを趣味にしている大学生。好きを仕事にする決断に踏み切れず悩み中。マイペースなエアリアルファイター。',
  126:'厳しめのお嬢様高校の出身。大学では大人の女に見られがちで、本人も内心喜んでいる。コツコツ努力するオールラウンダー。',
  127:'中堅法律事務所勤務の弁護士。論理的で感情に流されない性格。実年齢より落ち着いた佇まいの晩成型オールラウンダー。',
  128:'元哲玖四天王の一人。悪辣な外道ファイトとまとわりつくサブミッションで恐れられる哲玖の毒蛇。リーダーシップも兼ね備えた危険な実力者。',
};

// ── Trait Definitions (traits-v2.1) ─────────────────────
const TRAIT_DEFS = {
  '華':           {cat:'pop',    icon:'華', color:'#e91e9c', en:'Charisma',         desc:'集客力にボーナス。グッズ売上の重みも増加'},
  'ファンサービス':{cat:'pop',    icon:'奉', color:'#f39c12', en:'Fan Service',      desc:'グッズ売上にボーナス。興行出場で人気が上がりやすい'},
  'ヒール適性':   {cat:'pop',    icon:'悪', color:'#9b59b6', en:'Heel Aptitude',    desc:'悪役ムーブで人気を稼ぎ、因縁も生みやすい'},
  '名勝負製造機': {cat:'match',  icon:'名', color:'#f1c40f', en:'Match Maker',      desc:'試合がたまに大化けする（MQ+1〜5）'},
  '引き出し上手': {cat:'match',  icon:'引', color:'#2ecc71', en:'Best Bringer',     desc:'格下との試合でも質が下がりにくい'},
  'ライバル体質': {cat:'match',  icon:'闘', color:'#e74c3c', en:'Rivalry Prone',    desc:'ライバル因縁が生まれやすい'},
  '早熟':         {cat:'growth', icon:'早', color:'#27ae60', en:'Early Bloomer',    desc:'10代から即戦力。20歳で完成するが、伸びしろは少ない', excl:'A'},
  '晩成':         {cat:'growth', icon:'晩', color:'#16a085', en:'Late Bloomer',     desc:'序盤は遅いが、21〜22歳でピークに成長する', excl:'A'},
  '遅咲き':       {cat:'growth', icon:'遅', color:'#1abc9c', en:'Late Starter',     desc:'序盤は全く伸びないが、23歳で突然覚醒する', excl:'A'},
  '努力家':       {cat:'growth', icon:'努', color:'#3498db', en:'Hard Worker',      desc:'成長が安定しやすく、練習で体を壊しにくい'},
  '破天荒':       {cat:'growth', icon:'破', color:'#e67e22', en:'Maverick',         desc:'成長にムラあり。爆発的か停滞'},
  '適応力':       {cat:'growth', icon:'適', color:'#1abc9c', en:'Adaptability',     desc:'怪我中でも成長が落ちにくく、追い込み練習にも強い'},
  '頑丈さ':       {cat:'body',   icon:'頑', color:'#2980b9', en:'Durability',       desc:'怪我しにくい', excl:'B'},
  'ガラスの身体': {cat:'body',   icon:'脆', color:'#c0392b', en:'Glass Body',       desc:'怪我しやすいが、復帰のたびにファンの声援を集める', excl:'B'},
  '鉄人':         {cat:'body',   icon:'鉄', color:'#7f8c8d', en:'Iron Man',         desc:'コンディション全般に強い', excl:'B'},
  '不屈':         {cat:'body',   icon:'屈', color:'#d35400', en:'Indomitable',      desc:'怪我からの復帰が速い'},
  'ムードメーカー':{cat:'org',   icon:'和', color:'#f39c12', en:'Mood Maker',       desc:'明るさでロッカールームの空気を持ち上げる（雰囲気が良い時は効果が薄れる）'},
  '人望':         {cat:'org',    icon:'望', color:'#3498db', en:'Respect',           desc:'不安定な選手たちの心を支える（不満が多い時ほど効果が大きい）'},
  '負けず嫌い':   {cat:'org',    icon:'負', color:'#e74c3c', en:'Competitive',      desc:'負けた翌週の練習成長にボーナス'},
  'リーダー気質': {cat:'org',    icon:'将', color:'#f1c40f', en:'Leadership',        desc:'チームの不満を抑え、チャンピオン時は団体の顔として人気UP'},
  '忠誠心':       {cat:'org',    icon:'忠', color:'#2ecc71', en:'Loyalty',           desc:'引き抜きオファーが来る確率が大幅に低下'},
  '野心':         {cat:'org',    icon:'野', color:'#9b59b6', en:'Ambition',          desc:'タイトル挑戦時に試合が盛り上がり、覚醒しやすい'},
  '番狂わせ体質': {cat:'special',icon:'番', color:'#e74c3c', en:'Upset Specialist', desc:'格上相手に丸め込み率UP'},
  '闘志':         {cat:'special',icon:'志', color:'#c0392b', en:'Fighting Spirit',  desc:'瀕死から粘る力が強く、負けても人気が落ちにくい'},
  '威圧感':       {cat:'special',icon:'威', color:'#8e44ad', en:'Intimidation',     desc:'対戦相手の序盤モメンタムが不利'},
  '反骨心':       {cat:'special',icon:'反', color:'#c0392b', en:'Rebellious',       desc:'移籍願望が出やすいが、信頼が低いと成長する'}
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
  fa: 12,              // FA枠 — 提案B: 10→12（目標帯8-12）
  faProtectMin: 6,     // FA市場保護: AI取得停止ライン
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
  // v1.5 新規キャラクター（ID 100-128）
  100:'other',101:'other',102:'other',103:'other',104:'other',
  105:'other',106:'other',107:'other',108:'other',109:'other',
  110:'other',111:'other',112:'other',113:'other',114:'other',
  115:'other',116:'other',117:'other',118:'other',119:'other',
  120:'other',121:'other',122:'other',123:'other',124:'other',
  125:'other',126:'other',127:'other',128:'other',
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
  const eliteThreshold = ROSTER_CFG.eliteThreshold || 740;
  const eliteOvrCap = 80;
  const cheapMax = 120;     // §3.6: 素材帯の契約金上限
  const cheapGuarantee = 2; // §3.6: 最低2名の安価候補を保証

  function getPotTotal(c) { return c.pot.pw + c.pot.sp + c.pot.te + c.pot.st + c.pot.mn; }
  function getDraftAge(id) { return 17 + Engine.rng.int(Engine.rng.create(Engine.rng.derive(seed, 0xDA67, id)), 0, 2); }
  function getEntryRatio(age) { return age <= 18 ? 0.55 : 0.625; }
  function getAssessedValue(c, age, id) {
    const ratio = getEntryRatio(age);
    const charForAssess = {
      pw: Math.round(c.pw * ratio), sp: Math.round(c.sp * ratio),
      te: Math.round(c.te * ratio), st: Math.round(c.st * ratio), mn: c.mn,
      pot: c.pot, age
    };
    const avRng = Engine.rng.create(Engine.rng.derive(seed, 0xC057, id));
    return Engine.scout.calcAssessedValue(charForAssess, avRng, 1).assessedValue;
  }

  // Compute OVR + potTotal + assessedValue for each FA
  const withOvr = faIds.map(id => {
    const c = ALL_CHARS.find(ch => ch.id === id);
    if (!c) return null;
    const ovr = Math.round((c.pw + c.sp + c.te + c.st + c.mn) / 5);
    const potTotal = getPotTotal(c);
    const age = getDraftAge(id);
    const assessedValue = getAssessedValue(c, age, id);
    return { id, ovr, potTotal, assessedValue };
  }).filter(Boolean);
  withOvr.sort((a, b) => a.ovr - b.ovr);

  // Fixed: 2 from weakest tier (bottom 40%)
  const weakCutoff = Math.max(2, Math.floor(withOvr.length * 0.4));
  const weakPool = withOvr.slice(0, weakCutoff);
  const weakShuffled = seededShuffle(weakPool.map(x => x.id), rng);
  const fixed = weakShuffled.slice(0, ROSTER_CFG.draftFixed);

  // Candidates: mid tier (OVR 40-70), excluding fixed
  const fixedSet = new Set(fixed);
  const midPool = withOvr.filter(x => !fixedSet.has(x.id) && x.ovr >= 40 && x.ovr <= 70);
  const candidatePool = midPool.length >= ROSTER_CFG.draftCandidates
    ? midPool : [...midPool, ...withOvr.filter(x => !fixedSet.has(x.id) && !midPool.some(m => m.id === x.id))];

  // §2: 逸材保証 — potTotal >= eliteThreshold かつ OVR <= eliteOvrCap から1名
  const elitePool = candidatePool.filter(x => x.potTotal >= eliteThreshold && x.ovr <= eliteOvrCap);
  let guaranteed = [];
  if (elitePool.length > 0) {
    const eliteShuffled = seededShuffle(elitePool.map(x => x.id), rng);
    guaranteed.push(eliteShuffled[0]);
  } else {
    console.warn('Draft: no elite candidate in FA pool');
  }

  // §3.6: 安価候補保証 — assessedValue <= cheapMax から最低2名
  const guaranteedSet = new Set(guaranteed);
  // 逸材が安価帯の場合はカウントに含める
  const cheapAlready = guaranteed.filter(id => {
    const x = withOvr.find(w => w.id === id);
    return x && x.assessedValue <= cheapMax;
  }).length;
  const cheapPool = candidatePool.filter(x => !guaranteedSet.has(x.id) && x.assessedValue <= cheapMax);
  const cheapShuffled = seededShuffle(cheapPool.map(x => x.id), rng);
  const cheapGuaranteed = cheapShuffled.slice(0, Math.max(0, cheapGuarantee - cheapAlready));
  guaranteed = [...guaranteed, ...cheapGuaranteed];

  // 残りをcandidatePoolからランダム補充
  const allGuaranteedSet = new Set(guaranteed);
  const remainingPool = candidatePool.filter(x => !allGuaranteedSet.has(x.id));
  const remainShuffled = seededShuffle(remainingPool.map(x => x.id), rng);
  const remaining = remainShuffled.slice(0, ROSTER_CFG.draftCandidates - guaranteed.length);
  // シャッフルして逸材の位置をランダム化
  const candidates = seededShuffle([...guaranteed, ...remaining], rng);

  // Generate age for each draft member
  const draftAges = {};
  [...fixed, ...candidates].forEach(id => {
    draftAges[id] = getDraftAge(id);
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
  96:'matsushita_m',97:'iwasaki_m',98:'yoneyama_a',99:'miura_s',
  100:'tokiyama_n',101:'sawanobori_a',102:'oyama_t',103:'zaitsu_k',104:'yoshino_m',
  105:'kuroiwa_c',106:'akanuma_s',107:'matsuoka_a',108:'yuuki_r',109:'totsuka_y',
  110:'wakabayashi_m',111:'sagami_a',112:'asahina_h',113:'watanuki_s',114:'kimura_r',
  115:'toyota_i',116:'morgan_r',117:'crusher_b',118:'warida_k',119:'iwakoji_s',
  120:'kuramae_s',121:'yamamoto_r',122:'miyazawa_h',123:'yaginuma_e',124:'kiyokawa_r',
  125:'fujishiro_e',126:'nishizono_y',127:'sakakibara_n',128:'minuma_s'
};
// OVR閾値で立ち画像/全身画像が切り替わるキャラ設定
const PORTRAIT_OVR_VARIANT = {
  80: { threshold: 50, suffix: 'takashima_s2' }  // 高島さや
};
// ランキング画面 v0.9：OVR階調クラス用閾値（valueClassOvr で参照）
const OVR_TIER_THRESHOLDS = {
  mythic:   100,
  eliteMid: 95,
  elite:    90,
  eliteLow: 85,
  high:     80,
  mid:      70,
  low:      60,
};
const NPC_PORTRAIT = { reporter: 'kuroda_s' };
function getNpcPortraitUrl(key) { return NPC_PORTRAIT[key] ? `../image/npc/face_${NPC_PORTRAIT[key]}.png` : ''; }
function getNpcUpperUrl(key) { return NPC_PORTRAIT[key] ? `../image/npc/upper_${NPC_PORTRAIT[key]}.webp` : ''; }
function getPortraitUrl(id) { return PORTRAIT[id] ? `../image/face_${PORTRAIT[id]}.png` : ''; }
function getStandUrl(id, ovr) {
  if (!PORTRAIT[id]) return '';
  const v = PORTRAIT_OVR_VARIANT[id];
  const key = (v && ovr >= v.threshold) ? v.suffix : PORTRAIT[id];
  return `../image/stand/stand_${key}.webp`;
}
function getUpperUrl(id) { return PORTRAIT[id] ? `../image/upper/upper_${PORTRAIT[id]}.webp` : ''; }
function getFullUrl(id, ovr) {
  if (!PORTRAIT[id]) return '';
  const v = PORTRAIT_OVR_VARIANT[id];
  const key = (v && ovr >= v.threshold) ? v.suffix : PORTRAIT[id];
  return `../image/full/full_${key}.webp`;
}

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
  const faceUrl = getCoachPortraitUrl(coach.id);
  const upperUrl = getCoachUpperUrl(coach.id);
  const primaryUrl = upperUrl || faceUrl;
  const fallbackUrl = upperUrl && faceUrl && upperUrl !== faceUrl ? faceUrl : '';
  const br = size >= 32 ? '10px' : '5px';
  if (primaryUrl) {
    const fallbackAttr = fallbackUrl ? ` data-fallback-src="${fallbackUrl}"` : '';
    return `<img src="${primaryUrl}"${fallbackAttr} style="width:${size}px;height:${size}px;border-radius:${br};object-fit:cover;object-position:top center;border:1px solid rgba(100,85,50,0.12);flex-shrink:0;overflow:hidden" alt="${coach.name}" loading="lazy" onerror="const fb=this.dataset.fallbackSrc;if(fb){this.dataset.fallbackSrc='';this.src=fb;return;}this.style.display='none';this.nextElementSibling.style.display='flex'">` +
      `<div style="display:none;width:${size}px;height:${size}px;border-radius:${br};align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px;flex-shrink:0;background:linear-gradient(135deg,rgba(122,101,48,0.2),rgba(122,101,48,0.05));border:1px solid rgba(100,85,50,0.12)">${coach.emoji}</div>`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:${br};display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px;flex-shrink:0;background:linear-gradient(135deg,rgba(122,101,48,0.2),rgba(122,101,48,0.05));border:1px solid rgba(100,85,50,0.12)">${coach.emoji}</div>`;
}
function portraitImg(id, size = 80, cls = '', clickable = false) {
  const url = getPortraitUrl(id);
  // Auto-detect champion status for border color
  let statusCls = '';
  if (typeof G !== 'undefined') {
    if (G.titles?.world?.championId === id) statusCls = ' portrait-champ';
    else if (G.aiOrgs) {
      for (const oData of Object.values(G.aiOrgs)) {
        if (oData.titles?.world?.championId === id) { statusCls = ' portrait-champ'; break; }
      }
    }
  }
  const clickAttr = clickable ? ` onclick="event.stopPropagation();showFighterPopup(${id},'roster')" style="width:${size}px;height:${size}px;cursor:pointer"` : ` style="width:${size}px;height:${size}px"`;
  if (url) {
    return `<img src="${url}" class="portrait${statusCls} ${cls}"${clickAttr} alt="" loading="lazy">`;
  }
  // Fallback: rounded square with initial
  const ch = ALL_CHARS.find(c => c.id === id);
  const initial = ch ? ch.name.charAt(0) : '?';
  const STYLE_COLORS = {Grappler:'#bb8fce',Striker:'#e74c3c',Submission:'#e67e22',Aerial:'#2ecc71',Allround:'#f1c40f',Brawler:'#e88a82'};
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
{n:'チンロック',d:2,c:'submission'},{n:'ネックロック',d:2,c:'submission'},{n:'ヘッドロック',d:4,c:'submission'},
{n:'リストロック',d:4,c:'submission'},{n:'ハンマーロック',d:3,c:'submission'},{n:'アームリンガー',d:4,c:'submission'},
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
Aerial:[{n:'フランケンシュタイナー',d:12,c:'throw'},{n:'トルネードDDT',d:13,c:'throw'},
{n:'シャイニング・ウィザード',d:12,c:'strike'},{n:'ムーンサルト・プレス',d:15,c:'aerial'},
{n:'シューティング・スター・プレス',d:16,c:'aerial'},{n:'450スプラッシュ',d:15,c:'aerial'},
{n:'フロッグ・スプラッシュ',d:13,c:'aerial'},{n:'スワントン・ボム',d:14,c:'aerial'},
{n:'トペ・コンヒーロ',d:11,c:'aerial'},
{n:'ダイビング・セントーン',d:10,c:'aerial'},{n:'ドラゴン・スクリュー',d:10,c:'throw'},
{n:'ハリケーンラナ',d:12,c:'throw'}],
Technique:[{n:'アームバー',d:11,c:'submission'},{n:'フィギュア4レッグロック',d:12,c:'submission'},
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
{n:'卍固め（専）',d:15,c:'submission'},{n:'フィギュア4レッグロック（専）',d:14,c:'submission'},
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
Aerial:{strike:20,throw:15,submission:10,aerial:35,ground:5,rollup:10},
Technique:{strike:15,throw:20,submission:30,aerial:5,ground:10,rollup:15},
Allround:{strike:25,throw:25,submission:15,aerial:15,ground:10,rollup:10},
Striker:{strike:45,throw:15,submission:5,aerial:10,ground:15,rollup:5},
Submission:{strike:10,throw:10,submission:45,aerial:5,ground:15,rollup:10},
Brawler:{strike:30,throw:25,submission:5,aerial:5,ground:20,rollup:5}
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 3: ENGINE CONFIG (v4.1b tuneB)                  ║
// ╚══════════════════════════════════════════════════════════╝
const MAX_T = 16;
// v5.2 ダメージカーブ再調整 (2026-05-01): Opening の dmg 20+ 連発を抑制し
// 起承転結を回復。mult 0.90/1.05/1.20/1.40 → 0.60/0.85/1.05/1.30
const PHASES = [
  {name:'Opening',min:1,max:4,mult:0.60,sCh:20,counterBonus:0},
  {name:'Mid',min:5,max:8,mult:0.85,sCh:40,counterBonus:3},
  {name:'End',min:9,max:12,mult:1.05,sCh:55,counterBonus:5},
  {name:'Climax',min:13,max:20,mult:1.30,sCh:70,counterBonus:8}
];
const ENG = {
  hpBase: 100, hpScale: 1.80,
  effPivot: 100, effSlopeAfterPivot: 1.0,
  hitBase: {1:97,2:97,3:96,4:94,5:92,6:89,7:86,8:84,9:81,10:78,11:76,12:74,13:72,14:70,15:68,16:66},
  tecHitBonus: 0.17, spdDodgeBonus: 0.18, hitMin: 42, hitMax: 98,
  counterBase: 3, counterTecScale: 0.055, counterSpdPenalty: 0.07, counterMin: 2, counterMax: 18,
  counterDmgMult: 0.6, counterMomShift: 18,
  dmgPwrScale: 0.27, dmgTecScale: 0.115, dmgSpdScale: 0.115,
  defStaScale: 0.025, defMntScale: 0.06, momDmgScale: 0.001,
  dmgRandMin: 0.90, dmgRandRange: 0.20, dmgFloor: 3,
  gritDuration: 2, gritDmgReduction: 0.20, gritCounterBonus: 8,
  pinAttemptHpThreshold: 0.35, pinAttemptMinDmg: 9, pinAttemptBaseRate: 36,
  pinAttemptMomBonus: 0.03, pinAttemptMntPenalty: 0.20,
  pinAttemptSuccessBase: 23, pinAttemptClimax: 22,
  pinLowHpAttemptScale: 200, pinLowHpSuccessScale: 100,
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
  rollupHpThreshold: 0.35, rollupTecBonus: 0.18, rollupBaseSuccess: 10
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
  hpBase: 170,
  hpScale: 2.20,
  rollupBaseSuccess: 10,
  rollupHpThreshold: 0.25,
  pinAttemptHpThreshold: 0.25,
  pinAttemptSuccessBase: 14,
  pinAttemptClimax: 18,
  kickoutMax: 3,
  guEscapeMax: 3,
};

// ── Tag Match Constants (§spec tag-match-system-spec-v0.1) ──
const TAG_MATCH_CONFIG = {
  maxTotalTurns: 50,
  damageScale: 0.55,
  hpBase: 70,
  hpScale: 1.00,
  apronRecovery: 5.0,
  phases: [
    { name: 'Opening', min: 1,  max: 12, mult: 0.90, sCh: 20, counterBonus: 0 },
    { name: 'Mid',     min: 13, max: 22, mult: 1.05, sCh: 40, counterBonus: 3 },
    { name: 'End',     min: 23, max: 32, mult: 1.20, sCh: 55, counterBonus: 5 },
    { name: 'Climax',  min: 33, max: 50, mult: 1.40, sCh: 70, counterBonus: 8 },
  ],
  kickoutMax: 2,
  guEscapeMax: 2,
  touch: {
    wantHpThreshold: 0.40,
    wantHpCritical: 0.22,
    wantLossTurns: 5,
    maxTurnsLegal: 12,
    minTurnsLegal: 3,
    tacticalChemThreshold: 65,
    tacticalBaseRate: 0.25,
    canTouchHpWeight: 0.875,
    canTouchSpdScale: 0.003,
    canTouchOppScale: 0.002,
    canTouchMin: 0.15,
    canTouchMax: 0.90,
    isolationThreshold: 4,
    hotTagBuffChance: 0.22,
    hotTagBuffTurns: 2,
    hotTagBuffMult: 1.10,
  },
  cutin: {
    basePinRate: 0.45,
    baseFinisherRate: 0.30,
    baseCounterRate: 0.60,
    hpScale: 0.0076,
    bondScale: 0.0046,
    countPenalty: 0.08,
  },
  drama: {
    doubleTeamBase: 0.08,
    doubleTeamChemScale: 0.0003,
    friendlyFireBase: 0.015,
    friendlyFireChemScale: 0.0003,
    betrayalBondThreshold: 30,
    betrayalBondScale: 0.02,
  },
  mq: {
    screenTimeMaxBonus: 8,
    touchDiversityBonus: [0, 0, 2, 4, 6],
    dramaEventBonus: 2,
    dramaEventMaxBonus: 8,
    cutinBreakBonus: 3,
    tagMoveFinishBonus: 5,
    longSegmentPenaltyThreshold: 0.50,
    longSegmentPenaltyScale: 20,
    screenTimePenaltyScale: 15,
  },
};

const STYLE_COMPAT_MATRIX = {
  Grappler:   { Grappler: 75, Aerial: 100, Submission: 75, Allround: 50, Striker: 50, Brawler: 20 },
  Aerial:     { Grappler: 100, Aerial: 75, Submission: 50, Allround: 100, Striker: 50, Brawler: 50 },
  Submission: { Grappler: 75, Aerial: 50, Submission: 50, Allround: 50, Striker: 100, Brawler: 100 },
  Allround:   { Grappler: 50, Aerial: 100, Submission: 50, Allround: 50, Striker: 50, Brawler: 50 },
  Striker:    { Grappler: 50, Aerial: 50, Submission: 100, Allround: 50, Striker: 75, Brawler: 75 },
  Brawler:    { Grappler: 20, Aerial: 50, Submission: 100, Allround: 50, Striker: 75, Brawler: 75 },
};
STYLE_COMPAT_MATRIX.Technique = STYLE_COMPAT_MATRIX.Submission;

// T1: ペアごとに複数候補を持ち、getTagMove で乱数選択。同試合内の連続を避けるため avoidMoveName 引数を受ける。
const STYLE_TAG_MOVES = {
  'Aerial+Aerial': [
    { n: 'ダブル・ムーンサルト', d: 17, c: 'aerial' },
    { n: 'シンクロ・シューティングスタープレス', d: 18, c: 'aerial' },
    { n: 'ダブル・フロッグスプラッシュ', d: 17, c: 'aerial' },
    { n: 'コネクティング・ドロップキック', d: 16, c: 'aerial' },
  ],
  'Aerial+Allround': [
    { n: 'アシスト式ダイビングアタック', d: 17, c: 'aerial' },
    { n: '踏み台式ムーンサルト', d: 17, c: 'aerial' },
    { n: '肩車式ハイフライ', d: 18, c: 'aerial' },
  ],
  'Aerial+Brawler': [
    { n: '放り投げからのダイブ', d: 17, c: 'aerial' },
    { n: 'パワーボム式ラナ', d: 18, c: 'throw' },
    { n: 'タワー・スプラッシュ', d: 18, c: 'aerial' },
  ],
  'Aerial+Grappler': [
    { n: '空中戦からの投げ連携', d: 18, c: 'throw' },
    { n: 'ドロップキック→ジャーマン連携', d: 17, c: 'throw' },
    { n: '宙返りからのスープレックス受け渡し', d: 18, c: 'throw' },
  ],
  'Aerial+Striker': [
    { n: 'キック＆飛びつきコンビネーション', d: 16, c: 'strike' },
    { n: 'スラッピング・ダブルドロップキック', d: 17, c: 'strike' },
    { n: 'シューズ → エアキック連打', d: 16, c: 'strike' },
  ],
  'Aerial+Submission': [
    { n: '空中からの合体関節技', d: 16, c: 'submission' },
    { n: 'ダイビング・アームバー', d: 17, c: 'submission' },
    { n: 'ロープ空中技からの腕ひしぎ', d: 17, c: 'submission' },
  ],
  'Aerial+Technique': [
    { n: '空中からの合体関節技', d: 16, c: 'submission' },
    { n: 'アサルト式レッグロック', d: 17, c: 'submission' },
    { n: '技巧派トップロープ連係', d: 17, c: 'submission' },
  ],
  'Allround+Allround': [
    { n: 'コンビネーション・スラム', d: 16, c: 'throw' },
    { n: 'ハモリ式ドロップキック', d: 17, c: 'strike' },
    { n: 'ダブル・ブレーンバスター', d: 17, c: 'throw' },
    { n: '連携サンドイッチ・ボディアタック', d: 16, c: 'strike' },
  ],
  'Allround+Brawler': [
    { n: 'パワー連携スラム', d: 17, c: 'throw' },
    { n: 'アシスト式スピアー', d: 18, c: 'strike' },
    { n: 'ダブル・ショルダータックル', d: 16, c: 'strike' },
  ],
  'Allround+Grappler': [
    { n: 'ダブル・スープレックス', d: 17, c: 'throw' },
    { n: 'ホイップ連携からのバックドロップ', d: 17, c: 'throw' },
    { n: 'リフト＆ジャーマン連係', d: 18, c: 'throw' },
  ],
  'Allround+Striker': [
    { n: '打投コンビネーション', d: 16, c: 'throw' },
    { n: 'ホイップ → ランニングキック', d: 17, c: 'strike' },
    { n: 'ダブル・エルボースマッシュ', d: 16, c: 'strike' },
  ],
  'Allround+Submission': [
    { n: '崩し＆極め連携', d: 16, c: 'submission' },
    { n: 'ホイップ → スリーパーキャッチ', d: 17, c: 'submission' },
    { n: '腕固めセットアップ・ラッシュ', d: 17, c: 'submission' },
  ],
  'Allround+Technique': [
    { n: '崩し＆極め連携', d: 16, c: 'submission' },
    { n: 'テクニカル・ロック連携', d: 17, c: 'submission' },
    { n: '関節セットアップ → フィニッシュロック', d: 18, c: 'submission' },
  ],
  'Brawler+Brawler': [
    { n: 'ダブル・パワースラム', d: 18, c: 'throw' },
    { n: 'タワー・オブ・ドゥーム', d: 19, c: 'throw' },
    { n: 'サンドイッチ・スピア', d: 18, c: 'strike' },
    { n: 'ダブル・ラリアット', d: 18, c: 'strike' },
  ],
  'Brawler+Grappler': [
    { n: '重量級ダブルパワーボム', d: 18, c: 'throw' },
    { n: 'ゴリ押し → バックドロップ', d: 18, c: 'throw' },
    { n: 'サンドイッチ・チョークスラム', d: 18, c: 'throw' },
  ],
  'Brawler+Striker': [
    { n: 'ダブル打撃コンビネーション', d: 17, c: 'strike' },
    { n: 'ラリアット → 追撃キック', d: 18, c: 'strike' },
    { n: 'ショルダータックル→延髄斬り', d: 17, c: 'strike' },
  ],
  'Brawler+Submission': [
    { n: '叩き潰してからの関節技', d: 17, c: 'submission' },
    { n: 'パワーボム → グラウンドロック', d: 18, c: 'submission' },
    { n: 'ラッシュ → アキレス腱固め', d: 17, c: 'submission' },
  ],
  'Brawler+Technique': [
    { n: '叩き潰してからの関節技', d: 17, c: 'submission' },
    { n: 'タックル → テクニカル・ロック', d: 18, c: 'submission' },
    { n: '重量級アシスト → 関節締め', d: 18, c: 'submission' },
  ],
  'Grappler+Grappler': [
    { n: 'ダブル・チョークスラム', d: 18, c: 'throw' },
    { n: 'シンクロ・ジャーマン', d: 18, c: 'throw' },
    { n: 'ダブル・パワーボム', d: 19, c: 'throw' },
    { n: '四の字スラム連携', d: 17, c: 'throw' },
  ],
  'Grappler+Striker': [
    { n: '投げからの追撃打撃', d: 17, c: 'strike' },
    { n: 'スープレックス → ランニングキック', d: 18, c: 'strike' },
    { n: 'ホイップ → エルボースマッシュ連係', d: 17, c: 'strike' },
  ],
  'Grappler+Submission': [
    { n: '投げからの関節極め', d: 17, c: 'submission' },
    { n: 'バックドロップ → アームロック', d: 18, c: 'submission' },
    { n: 'パワーボム → クロスフェイス', d: 18, c: 'submission' },
  ],
  'Grappler+Technique': [
    { n: '投げからの関節極め', d: 17, c: 'submission' },
    { n: 'スープレックス → フィギュアフォー', d: 18, c: 'submission' },
    { n: 'ジャーマン → キムラロック連携', d: 18, c: 'submission' },
  ],
  'Striker+Striker': [
    { n: 'ダブル打撃ラッシュ', d: 17, c: 'strike' },
    { n: 'シンクロ・ハイキック', d: 18, c: 'strike' },
    { n: 'スラッピング・ダブルエルボー', d: 16, c: 'strike' },
    { n: 'サンドイッチ・ニークラッシャー', d: 18, c: 'strike' },
  ],
  'Striker+Submission': [
    { n: '打撃で崩して関節技', d: 17, c: 'submission' },
    { n: 'キック → スリーパー連係', d: 17, c: 'submission' },
    { n: 'ミドルキック → アキレス腱固め', d: 18, c: 'submission' },
  ],
  'Striker+Technique': [
    { n: '打撃で崩して関節技', d: 17, c: 'submission' },
    { n: 'シュート・キック → テクニカルロック', d: 18, c: 'submission' },
    { n: '打撃コンビ → フィニッシュホールド', d: 17, c: 'submission' },
  ],
  'Submission+Submission': [
    { n: 'ダブル関節技', d: 17, c: 'submission' },
    { n: 'シンクロ・アームバー', d: 18, c: 'submission' },
    { n: '上下同時極め', d: 18, c: 'submission' },
  ],
  'Submission+Technique': [
    { n: 'ダブル関節技', d: 17, c: 'submission' },
    { n: 'アーム＆レッグロック連係', d: 18, c: 'submission' },
    { n: 'テクニカル・ダブルホールド', d: 17, c: 'submission' },
  ],
  'Technique+Technique': [
    { n: 'ダブル関節技', d: 17, c: 'submission' },
    { n: 'テクニカル・シンクロ・ロック', d: 18, c: 'submission' },
    { n: '緻密な連係グラウンド', d: 17, c: 'submission' },
  ],
};

// T1: 配列からランダム選択。rng が渡された場合は Engine.rng.float を使用 (auto-sim 再現性)。
// avoidMoveName が渡されると、その技以外を優先（試合内連続を避ける）。候補1個しかない場合は諦めて返す。
function getTagMove(styleA, styleB, rng, avoidMoveName) {
  const sA = styleA || 'Allround';
  const sB = styleB || 'Allround';
  const key = [sA, sB].sort().join('+');
  const arr = STYLE_TAG_MOVES[key];
  if (!arr || arr.length === 0) return { n: '合体スラム', d: 16, c: 'throw' };
  let pool = arr;
  if (avoidMoveName && arr.length > 1) {
    const filtered = arr.filter(m => m.n !== avoidMoveName);
    if (filtered.length > 0) pool = filtered;
  }
  const r = (rng && typeof Engine !== 'undefined' && Engine.rng) ? Engine.rng.float(rng) : Math.random();
  return pool[Math.floor(r * pool.length) % pool.length];
}

function getStyleCompat(styleA, styleB) {
  const sA = styleA || 'Allround';
  const sB = styleB || 'Allround';
  const row = STYLE_COMPAT_MATRIX[sA];
  if (!row) return 50;
  return row[sB] != null ? row[sB] : 50;
}

// ── Tag Match Relationship Scale ──
const TAG_REL_SCALE = {
  opponentScale: 0.50,
  pinPairScale: 0.75,
  cutinSave:    { bond: [3, 6] },
  betrayal:     { bond: [-15, -10], rivalry: [8, 12] },
  friendlyFire: { bond: [-2, -1] },
  hotTag:       { bond: [2, 4] },
  doubleTeam:   { bond: [1, 3] },
  teamWin:      { bond: [1, 2] },
  teamLoss:     { bond: [-1, 0], rivalry: [0, 1] },
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4: ECONOMY CONFIG                               ║
// ╚══════════════════════════════════════════════════════════╝
// 給与連続関数パラメータ（R4: テーブル廃止→指数関数）
const SALARY_PARAMS = {
  baseA: 2.40,       // 指数カーブ係数A
  baseB: 0.043,      // 指数カーブ係数B — base = A * exp(B * OVR) + offset
  offset: -8,        // 低OVR帯の給与を抑えるオフセット（万）
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
  goodWinner: {
    normal: {
      _default: ['みんなの声が聞こえてたよ', '期待に応えられたなら…嬉しい', '最高の相手に最高の舞台。感謝しかない'],
      ojousama: ['皆様の声援が力になりましたわ', '期待にお応えできたなら光栄ですわ'],
      delinquent: ['聞こえてたぜ、みんなの声！', 'どうだ、やってやったぞ！'],
      cool: ['……声が、聞こえていた', '……ありがとう'],
      seductive: ['あの歓声が私の力になったわ', '最高の舞台をありがとう'],
      polite: ['皆さまの声援が、力になりました。本当にありがとうございます'],
      composed: ['…みんなの声、届いてたよ。ありがとう'],
    },
    bold: {
      _default: ['この試合、絶対に負けられなかった', 'あの歓声が力になった。最高だ！'],
      ojousama: ['皆様の期待に応えられて嬉しいわ'],
      delinquent: ['負けられねえ試合だった。やったぜ！'],
      cool: ['……負けられない試合だった'],
      polite: ['絶対に負けられない試合でした。応えられて良かったです!'],
      seductive: ['負けられない試合だったわ。…ふふ、応えられて満足'],
      composed: ['…負けられない試合だった。やれて良かった'],
    },
    quiet: {
      _default: ['………（観客に向かって静かに頭を下げる）'],
      cool: ['……声が、力になった'],
      polite: ['…ありがとうございました…（小さくお辞儀）'],
      seductive: ['………声、聞こえてた'],
    },
    shy: {
      _default: ['あ、あの…皆さんの声が…聞こえてて…嬉しかった…です'],
      polite: ['あ、あの…皆さんの声が…聞こえて…本当に嬉しかったです…'],
    },
    easygoing: {
      _default: ['みんなありがとー！ 最高の試合だったよ！'],
      delinquent: ['サンキュー！ 最高だったぜ！'],
      polite: ['みんなの声、届いてました!最高の試合でした、ありがとうございます!'],
      ojousama: ['皆様の声援、しかと届きましたわ!最高の試合でしたの!'],
      seductive: ['みんなの声援が聞こえてたわ~♪ 最高の試合だったわね'],
      composed: ['…みんなの声、届いてたよ。最高の試合だったね'],
    },
    earnest: {
      _default: ['期待に応えられたなら嬉しいです', '声援が力になりました。ありがとうございます'],
      polite: ['皆様の期待にお応えできて光栄です'],
      ojousama: ['期待にお応えできましたわ'],
      seductive: ['期待に応えられて、嬉しいわ。ありがとう'],
      composed: ['…期待に応えられたなら、嬉しいです'],
    },
    emotional: {
      _default: ['みんなの声が……聞こえてた……ありがとう……！（涙）'],
      seductive: ['みんなの声が聞こえてた……っ……ありがとう……!'],
      composed: ['…みんなの声、届いてた。…ありがとう'],
    },
  },
  badWinner: {
    normal: {
      _default: ['…まだやれたはず', 'この結果じゃ満足できない', '応援してくれたのに…悔しい'],
      ojousama: ['この内容では……お恥ずかしい限りですわ'],
      delinquent: ['くそっ…こんなんじゃダメだ…'],
      cool: ['……不十分だった'],
      seductive: ['もっとやれたはず……悔しいわ'],
      polite: ['この内容では……申し訳ないです。もっとやれたはずなのに'],
      composed: ['…こんな試合で、ごめん。もっとやれたはずなのに'],
    },
    bold: {
      _default: ['次はもっといい試合にする。約束する', 'こんなんじゃ足りない。もっとやれる'],
      ojousama: ['……次は必ず良い試合をお見せしますわ。'],
      delinquent: ['ちくしょう…次は絶対いい試合にする！'],
      cool: ['……次だ'],
      polite: ['次は必ず、もっといい試合にします。約束します'],
      seductive: ['次はもっといい試合にするわ。…約束する'],
      composed: ['…次はもっといい試合にする。約束するよ'],
    },
    quiet: {
      _default: ['………（悔しそうに俯く）'],
      cool: ['……まだ、足りなかった'],
      polite: ['………申し訳…ありません。…次こそ'],
      seductive: ['………ごめんなさい。…次こそ、ね'],
    },
    shy: {
      _default: ['ごめんなさい…もっと…頑張れたのに…'],
      polite: ['ご、ごめんなさい……もっと、頑張れたはずなのに……'],
    },
    easygoing: {
      _default: ['うーん…もっとやれたなあ。ごめんね'],
      delinquent: ['ダメだったなあ…次はやるぜ'],
      polite: ['ごめんなさい、もっとやれたはずなのに…次こそ、絶対頑張ります!'],
      ojousama: ['申し訳ございませんわ…次こそ、良い試合をお見せしますの'],
      seductive: ['ごめんね…もっとやれたはずなのに。次こそ期待してて'],
      composed: ['…ごめんね、もっとやれたはずなのに。次こそ頑張るよ'],
    },
    earnest: {
      _default: ['応援してくださったのに…申し訳ありません', '次こそもっといい試合にします'],
      polite: ['ご期待に添えず申し訳ございません'],
      ojousama: ['ご期待に添えず、申し訳ございませんでしたわ'],
      seductive: ['期待に応えられなくて、ごめんなさい。次こそ必ず'],
      composed: ['…期待に応えられなくて、ごめんなさい。次こそ必ず'],
    },
    emotional: {
      _default: ['ごめん……もっとやれたのに……悔しい……！'],
      seductive: ['ごめんなさい……っ…もっとやれたはずなのに…悔しい……!'],
      composed: ['…ごめんなさい。…もっとやれたはずなのに'],
    },
  },
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
  {name:'ドーム',    cap:22500, cost:7000, maxMatches:8, img:'../image/venue_9_dome.webp'},         // 9 (orgPop-rebalance v1.1: cap 30000→22500, cost 12000→11000→7000)
];
// L1: orgPop→基礎集客力の区間線形補間テーブル（キャパ非依存）
// v3.1: 高orgPop帯を圧縮（旧: 70→4000, 80→7000, 90→14000, 100→20000）
const BASE_ATTENDANCE_CURVE = [
  [0,20],[5,60],[10,130],[15,200],[20,300],[25,420],[30,550],
  [35,720],[40,900],[45,1150],[50,1500],[55,1900],[60,2400],
  [65,2900],[70,3400],[75,4000],[80,4800],[85,5800],[90,7000],
  [95,8500],[100,10000]
];
// v3.1: チケット単価逓減 — 集客が増えるほど1人あたり単価が下がる（薄利多売）
const TICKET_PRICE_TIERS = [
  { threshold: 0,     price: 0.55 },  // ~2000人: フル単価（中小会場は影響なし）
  { threshold: 2000,  price: 0.45 },  // 2000-5000: やや割安
  { threshold: 5000,  price: 0.35 },  // 5000-10000: 割安
  { threshold: 10000, price: 0.25 },  // 10000+: 薄利多売
];
// 金銭バランス改善: グッズ収入を選手個別・週次ベースに再設計
const GOODS_CONFIG = {
  weeklyPerPop: 0.2,      // 万円/pop/週（全選手に毎週発生）
  injuryMult: 0.3,         // 怪我中の週次倍率（×0.3）
  showBoostPerPop: 0.25,   // 万円/pop/興行（出場選手のみ）
  promoPerPop: 0.6,        // 万円/pop/プロモ実施
};
// v3.1: 会場レベル別MQ閾値シフト — 小会場は緩く、大会場ほど厳しい、ドームでガッと上がる
// 負=MQ閾値が下がり上がりやすい、正=閾値が上がり高MQ必要
//                 公民 小A  小B  市民 中A  中B  大   arena 大会場 ドーム
const VENUE_MQ_THRESHOLD = [-20, -15, -12, -8, -5, -3, -1, 6, 8, 15];
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
  { min: 1.20, text: '🔥🔥 チケットが飛ぶように売れている！',  color: 'var(--gold)' },
  { min: 0.90, text: '🔥 今週は盛り上がりそうだ',               color: 'var(--green)' },
  { min: 0.70, text: '😊 なかなかの手応えだ',                    color: '#74b9ff' },
  { min: 0.50, text: '🤔 まずまずといったところか',              color: 'var(--text-sub)' },
  { min: 0.30, text: '😟 少し客足が心配だ',                      color: '#e17055' },
  { min: 0.00, text: '😰 かなり厳しい集客になりそうだ',          color: 'var(--red)' },
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
  penaltyMin: 14,        // 旧20 — 現行と案(-8~-15)の中間値
  penaltyMax: 25,        // 旧35 — 現行と案(-8~-15)の中間値
  messages: ['📰 週刊誌にスクープが…', '📱 SNSで炎上騒動が…', '⚠️ 素行問題が発覚…']
};
const LOSING_STREAK_PENALTIES = [
  {threshold: 3, penalty: -2, msg: '陰りが見え始める…'},   // 旧-5
  {threshold: 5, penalty: -4, msg: '低迷が深刻化…'},       // 旧-10
  {threshold: 7, penalty: -7, msg: '失望感が広がる…'}      // 旧-15
];
const PROMO_POP_CAP = 100; // promo-system-redesign v2.0: 上限撤廃（diminishingで自然に鈍化）
// PROMO_MQ_PER_STACK — MQ外部ボーナス整理で廃止（drawPowerのみで集客に反映）
// 金銭バランス改善: テーブル引き→区間線形補間（pop差がそのまま金額差に反映）
const PROMO_EVENT_INCOME_CURVE = [
  [0, 10], [15, 20], [30, 40], [45, 55], [60, 70], [75, 85], [100, 95],
];
const PROMO_EVENT_NAMES = {
  low:  ['地域イベント出演', '商店街キャンペーン', 'SNS配信', '地元FM出演'],
  mid:  ['握手会', 'ファンミーティング', 'トークショー', 'グッズ販売会'],
  high: ['大型イベント出演', 'TV番組出演', '雑誌撮影会', 'スペシャルショー'],
};
const TRANSFER_POP_MULT = 0.75; // 移籍時の人気リセット係数
// 金銭バランス改善: メディア収入（スポンサー/放映権を統合再設計）
const MEDIA_ORGPOP_CURVE = [
  [0, 0.05], [30, 0.40], [50, 0.70], [70, 1.00], [85, 1.30], [100, 1.50]
];
const MEDIA_CONFIG = {
  weeklyPerOrgPop: 1.5,    // 万円/orgPop/週
  showPerMQ: 1.1,           // 万円/avgMQ/興行
  ppvPerPop: 0.9,           // 万円/pop/PPV出演
  jtPerPop: 0.9,            // 万円/pop/JT出演
  eventPerMQ: 1.1,          // 万円/MQ/挑戦状or対抗戦
  promoPerPop: 0.6,         // 万円/pop/プロモ連動
  fanExpectPerPriority: 30, // 万円/priority/カード
  rivalryCoeff: 0.016,      // 万円/rivalry×MQ
};
// メディア功労賞: 選考スコア重み付け
const MEDIA_AWARD_CONFIG = {
  mediaRevWeight: 1.0,    // 出演料等（据え置き）
  talentRevWeight: 1.3,   // タレント活動収入 1.3倍評価
  promoCountBonus: 8,     // プロモ1週あたり8万相当
  talentCountBonus: 15,   // タレント活動1回あたり15万相当
};
// 会場規模別メディア補正（インデックス0-9: 公民館→ドーム）
const VENUE_MEDIA_MULT = [0.3, 0.5, 0.6, 0.8, 0.9, 1.0, 1.2, 1.5, 1.8, 2.5];
// PPV/JTカード位置別メディア倍率
const PPV_CARD_MULT = { main: 8.0, semi: 4.0, mid: 3.0, under: 2.0 };
// 昇給要求のtrust減額
const TRUST_RAISE_DISCOUNT = { threshold: 40, maxDiscount: 0.08 };
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

// ══════════════════════════════════════════════════════════
//  新集客システム v2 定数（Phase 1: 計測用・既存ロジック非接続）
// ══════════════════════════════════════════════════════════

// A系: drawPower（個人集客力）
const DRAW_POWER_CONFIG = {
  popExponent: 1.3,          // popのべき乗指数（高popほど効率上がる）
  popScale: 100,             // popDrawのスケール
  ovrBonusScale: 100,        // ovrBonus = (ovr - 50) / ovrBonusScale
  ovrBonusMin: -0.1,         // ovrBonus下限
  ovrBonusMax: 0.3,          // ovrBonus上限
  ovrBaseThreshold: 60,      // OVR単体効果の発動閾値
  ovrBasePerPoint: 0.3,      // 閾値超過1ポイントあたりの加算
  traitFlat: 8,              // 華/ファンサの固定加算
  traitMult: 0.05,           // 華/ファンサのpopDraw乗算
  champBonus: 12,            // 王者固定加算
  btBonus: 5,                // BT直後(4週)
  winStreakBonus: 3,          // 連勝5+
  slumpPenalty: -5,           // スランプ中
  injuryReturnBonus: 6,      // 怪我復帰(2興行)
  tenureStart: 3,            // 所属年数ボーナス発動(年)
  tenurePerYear: 1.0,        // 所属年数1年あたり加算
  tenureCap: 5,              // 所属年数ボーナス上限
};

// B系: matchAppeal（カード魅力）
const MATCH_APPEAL_CONFIG = {
  // OVR拮抗ボーナス
  parityBonus: [
    { maxDiff: 0,  bonus: 10 },
    { maxDiff: 3,  bonus: 7 },
    { maxDiff: 7,  bonus: 3 },
    { maxDiff: 14, bonus: 0 },
  ],
  parityPenalty: -5,          // OVR差15+のペナルティ
  rivalryScale: 0.3,          // rivalry値 → appeal変換係数
  titleAppeal: 20,            // タイトル戦加算
  fanExpectAppeal: 12,         // ファン期待カード加算
  heelFaceAppeal: 6,           // ヒールvsベビー構図加算
  pendingClashAppeal: 15,      // 乱闘蓄積1あたり（話題性大）
  firstMeetAppeal: 8,          // 初顔合わせ（未知のカードへの興味）
  stalePenaltyPerCount: -8,    // マンネリ段階あたりのappeal減算
  stalePenaltyMax: -30,        // マンネリappeal減算の下限
  junkThreshold: 15,           // totalAppealがこれ以下→ゴミ試合扱い
};

// 派閥システム設定（spec: faction-system-spec-v0.1.md）
const FACTION_CONFIG = {
  // §2.1 発生条件
  minRosterSize: 10,
  loyalBondThreshold: 60,      // v0.2: 65→60 実測bond分布(50後半〜60台)に合わせ引き下げ
  loyalMinFollowers: 2,
  loyalMaxFollowers: 3,
  secondFactionMaxExistingFactions: 1,
  secondFactionProbability: 0.45,
  rivalrousBondThreshold: 55,  // v0.4 deprecated: F02 は既存2派閥間判定に変更（旧「無派閥からの2クラスタ同時発生」用）
  rivalrousRivalryThreshold: 40,  // v0.4: 既存2派閥間の平均 rivalry 閾値として継続使用
  // §2.2 加入判定（v0.3: 1週1人・連続式確率）
  joinBondThreshold: 60,
  joinMaxRate: 0.40,         // bond100のとき最大40%/週
  joinMomentumScale: 0.006,  // momentum×0.006が確率への乗数（+100→×1.6、-50→×0.7）
  soloFactionFreezeSize: 6,  // 単独派閥がこのサイズ以上なら加入凍結
  soloFactionJoinRateMult: 0.75, // 単独派閥時は加入速度を少し抑える
  joinSizeDecayStart: 5,     // このサイズを超えると加入率が逓減し始める
  joinSizeDecayRate: 0.4,    // サイズが1増えるごとに ×(1 - decayRate) ずつ低下
  meritocraticFlavorScoreMult: 0.72,
  // §2.3 離脱判定
  leaveBondThreshold: 40,
  leaveRate: 0.10,
  leaveMomentumLowMult: 1.5,
  leaveMomentumVeryLowMult: 2.0,
  leaveMomentumTrustDecay: -0.3,
  // §2.4 消滅・解散
  minFactionSize: 3,
  dissolveRatioThreshold: 0.80,
  // §2.5 後継
  successionOvrRatioFull: 0.83,
  successionOvrRatioPartial: 0.70,
  successionShockProbability: 0.50,
  // §4 対立度
  hostilityDecayPerWeek: -0.3,
  hostilityHighBondExtraDecay: -0.3,
  hostilityHighBondThreshold: 50,
  hostilityLeaderChangeMultiplier: 0.7,
  // §4.3 派閥が関係性に与える週次ドリフト
  sameFactionBondGain: 0.12,
  factionLeaderBondGainAuthoritative: 0.08,
  dictatorInFactionRivalryGain: 0.25,
  factionNeutralBondDecay: -0.03,
  factionCrossBondDecay: -0.11,
  factionCrossBondHostilityMidThreshold: 40,
  factionCrossBondHostilityHighThreshold: 70,
  factionCrossBondHostilityMidExtra: -0.05,
  factionCrossBondHostilityHighExtra: -0.10,
  // §5 勢い
  momentumDecayPerWeek: -1.0,
  momentumSeniorBonus: [8, 12],
  momentumLeaderBonus: [15, 20],
  // §6 派閥抗争appeal
  factionAppealLow: 5,
  factionAppealMid: 10,
  factionAppealHigh: 10,
  f08AppealBase: [15, 20],
  f08TitleMultiplier: 0.5,
  feudSumCap: 30,
  // §8 発動制御
  eventProbability: {
    F01: 0.60, F02: 0.80,
    F04: 0.30, F05: 0.40, F06: 0.50, F07: 0.40, F08: 0.50,
  },
  eventCooldown: {
    F01: 12, F04: 12, F05: 12, F06: 16, F07: 12, F08: 24,
  },
  // §9.4 F04 寝返り
  f04BondAllyThreshold: 70,      // 敵対派閥メンバーとのbond平均
  f04BondLeaderMaxThreshold: 40, // リーダーへのbond上限
  // §9.5 F05 派閥内亀裂
  f05MinFactionSize: 5,
  f05DissidentBondMaxThreshold: 35, // リーダーへのbond上限
  f05DissidentCliqueBondThreshold: 60, // 不満分子相互bond
  f05DissidentMinCount: 2,
  // §9.6 F06 和解の兆し
  f06HostilityMaxAverage: 25,    // 両方向平均
  f06StreakWeeks: 8,             // 8週継続
  f06Cost: 1_000_000,            // 100万
  // §9.11 F02④ endless（無限抗争）
  f02EndlessHostilityMinAverage: 55, // 両方向平均
  f02EndlessStreakWeeks: 52,         // 52週継続
  f02EndlessCooldown: 52,            // 52週CD
  // §9.7 F07 リーダーの横暴
  f07TrustMinThreshold: 60,
  f07RebukeMaxCount: 4,          // 4回で authoritativeTag 除去
  // §9.8 F08 対立ヒートアップ
  f08HostilityMinThreshold: 80,  // 片方向
  f08AlternativeCost: 2_000_000, // B選択肢: 別興行200万
  f08MatchResultMultiplier: 1.5, // A選択肢: 試合結果×1.5変動

  // ── Phase B: 抗争ポイント制（spec: faction-rivalry-points-spec-v0.1 v0.3）──
  // §2.1 素点（マッチランク別）
  pointsByRank: { top: 10, second: 6, third: 4, filler: 2 },
  // §2.2 補正（加算式）
  pointsMainEventBonus: 0.3,
  pointsTitleBonus: 0.2,
  pointsUpsetBonus: 0.2,
  pointsUpsetOvrDiff: 5,        // この値以上 OVR 差で勝てば下剋上
  pointsTagBonus: -0.5,
  pointsMultMin: 0.1,
  // §2.6 1興行・週次キャップ
  pointsPerShowPairMax: 2,
  pointsWeeklyCapPerPair: 20,
  // §4 決着
  pointsResolutionThreshold: 100,
  pointsForceCloseWeeks: 40,
  pointsNaturalCalmWeeks: 4,
  pointsNaturalCalmHostilityMax: 20,
  // §3 F09 派閥対抗戦
  f09HostilityMin: 65,
  f09OvrTopN: 5,
  f09OvrDiffMaxRatio: 0.15,
  f09MomentumMin: -20,
  f09Cooldown: 52,
  f09LateGameMult: { 52: 1.1, 104: 1.3, 156: 1.5 },
  f09PointsMult: 1.8,
  f09SweepBonus: 15,
  f09MaxMatches: 5,
  f09MinMatches: 3,
  f09NearBadgeHostility: 60,
  // §5 勝者敗者効果
  victoryWinnerMomentum: 40,
  victoryLoserMomentum: -25,
  victoryWinnerTrust: 5,
  victoryLoserLeaderTrust: -8,
  victoryLoserMemberTrust: -3,
  victoryBondGainToLeader: 5,
  victoryHostilityDecay: -40,
  victoryAppealBoostWeeks: 12,
  victoryDefectionMult: 1.5,
  victoryDefectionMultWeeks: 12,
  // §4.3 F06 強制和解（2択）
  forceCloseDelayWeeks: 20,
  forceCloseHostilityDecayOnA: -30,

  // ── 派閥内ポイント制 / F-INTERNAL-CHALLENGE（spec: faction-internal-rank-spec-v0.2）──
  // §3.1 Common-1 結果ポイント
  internalPointsCommon1NonLeaderWinner: 6,
  internalPointsCommon1NonLeaderLoser: -3,
  internalPointsCommon1LeaderHoldsLoss: -3,
  internalPointsCommon1UpsetWinner: 12,
  internalPointsCommon1UpsetLoserPenalty: -8,
  // §3.2/3.3 派閥外試合
  internalPointsExternalTitleWin: 3,
  internalPointsExternalMainWin: 2,
  internalPointsF09Multiplier: 1.5,
  // §4.1 挑戦権発火条件
  internalChallengeMinFactionSize: 4,
  internalChallengeGraceWeeksAfterEnthronement: 38,
  internalChallengeThresholdGap: 10,
  internalChallengeThresholdGapFace: 15,
  internalChallengeCooldownWeeks: 24,
  // §4.4 リーダー初期ポイント（就任時点でリーダーが派閥最強の序列を持つ）
  internalChallengeLeaderInitialPoints: 12,
  // §4.4 非リーダー OVR 順位ベース割り振り（[1位, 2位, 3位, 4位以下]）
  internalPointsAllocationByOvrRank: [4, 2, 1, 0],
  // §4.4 結果効果
  internalChallengeWinnerTrustGain: { min: 5, max: 8 },
  internalChallengeWinnerPopGain: { min: 3, max: 5 },
  internalChallengeLoserTrustHit: { min: -8, max: -5 },
  internalChallengeMomentumOnUpset: { min: 5, max: 10 },
  internalChallengeMomentumOnHold: { min: 10, max: 15 },

  // ── Phase B: F07 v0.4 共通フレーム化（spec: faction-f07-variation-spec-v0.1 v0.4 §7.1）──
  f07TeamCooldown: 12,             // チーム全体 F07 CD（週）
  f07FactionCooldown: 36,          // 派閥個別 F07 CD（週）
  f07RecentIncidentKeep: 2,        // 直近 N 件の incidentType を連続出現禁止対象に保持
  f07DemandSubCooldown: 32,        // 要求型サブ CD（DEMAND_* 全般）
  f07DemandMoneyCooldown: 48,      // DEMAND_MONEY 個別 CD
  f07PostRebukeQuiet: 24,          // B 4 回累積 authoritativeTag 剥がし後の quiet 期間
  f07DemandMoneyMultiplier: 1.10,  // DEMAND_MONEY A 給与改定倍率（Phase D 実装）
  f07DemandMainShows: 6,           // DEMAND_MAIN A: メインカード縛り期間（興行回数 = 約6週）
  f07ArchetypeBias: {
    AUTHORITY: 10, COMBAT: 5, HEEL: 5, BOND: 0, MERIT: 0, FACE: 0,
  },
  // アーキタイプ × incidentType 抽選マトリクス（合計おおむね 100）
  f07IncidentMatrix: {
    AUTHORITY: { DEMAND_MAIN: 10, DEMAND_MONEY: 8, DEMAND_ABSTRACT: 12, OBSERVE_RIVAL_HEAT: 18, OBSERVE_ABSENCE: 14, INCIDENT_BOUNDARY: 16, INCIDENT_BONDING: 12 },
    BOND:      { DEMAND_MONEY: 12, DEMAND_RECOGNITION: 10, OBSERVE_ABSENCE: 16, INCIDENT_BOUNDARY: 18, INCIDENT_BONDING: 24 },
    MERIT:     { DEMAND_MAIN: 14, DEMAND_RECOGNITION: 18, OBSERVE_RIVAL_HEAT: 12, OBSERVE_ABSENCE: 14, OBSERVE_INTERNAL_RANK: 22, INCIDENT_BOUNDARY: 12 },
    HEEL:      { DEMAND_MAIN: 12, OBSERVE_RIVAL_HEAT: 22, OBSERVE_ABSENCE: 16, OBSERVE_FAN_PRESSURE: 12, INCIDENT_BOUNDARY: 18, INCIDENT_BONDING: 10, INCIDENT_HEEL_PROVOKE: 10 },
    FACE:      { DEMAND_MONEY: 10, DEMAND_RECOGNITION: 12, OBSERVE_ABSENCE: 16, OBSERVE_FAN_PRESSURE: 22, INCIDENT_BOUNDARY: 14, INCIDENT_BONDING: 16 },
    COMBAT:    { DEMAND_MAIN: 14, OBSERVE_RIVAL_HEAT: 22, OBSERVE_ABSENCE: 14, OBSERVE_TRAINING_HARD: 18, INCIDENT_BOUNDARY: 16, INCIDENT_BONDING: 6 },
  },
  // §6 アーキタイプ遷移定義
  archetypeTransition: {
    authorityToBondViaRebuke: { from: 'AUTHORITY', to: 'BOND' },
    authorityToOnLeaderChange: {
      from: 'AUTHORITY',
      fieryGrudgingTo: 'MERIT',
      composedEarnestTo: 'BOND',
      fallback: 'BOND',
    },
    combatToBondOnDefeat: { from: 'COMBAT', to: 'BOND' },
  },

  // ── Common Events（共通イベント Common-1/3/4/5/7、spec: faction-common-events-spec-v0.1）──
  // チーム全体 CD: 6 週（F07 の 12 週よりやや高頻度の日常感）
  // 派閥個別 CD: 24 週（同じ派閥が連続で取材→合宿…とは並ばないように）
  // イベント別 CD: 各イベントに合わせる
  commonEventTeamCooldown: 6,
  commonEventFactionCooldown: 24,
  commonEventIndividualCooldowns: {
    COMMON_1: 16,
    COMMON_4: 24,
    COMMON_5: 32,
    COMMON_7: 32,
  },
  // Common-4 合宿: ロッカー士気下限
  commonEvent4MoraleMin: 50,

  // ── §6 FACE⇄HEEL アーキタイプ遷移（heelAlignment ベース）──
  // 0-100 スケール。0=完全FACE、50=neutral、100=完全HEEL
  // メンバー全員の平均が閾値を 24 週連続で越えた派閥のみ遷移する
  alignDriftIdealHeel: 75,        // HEEL 派閥のドリフト先
  alignDriftIdealFace: 25,        // FACE 派閥のドリフト先
  alignDriftIdealNeutral: 50,     // それ以外（AUTHORITY/BOND/MERIT/COMBAT）
  alignDriftRate: 0.05,           // 週次 drift 率（理想値との差 × この率）
  alignFlipThresholdToHeel: 65,   // FACE → HEEL の平均閾値
  alignFlipThresholdToFace: 35,   // HEEL → FACE の平均閾値
  alignFlipSustainWeeks: 24,      // 閾値超え連続維持週
  alignFlipPostCooldown: 36,      // 遷移直後の再判定抑制週
};

// ─────────────────────────────────────────────────────────────────────────────
// アーキタイプ遷移ナレーション（§6）
// 軸: 口調アーキタイプ（archetype）— composed/ojousama/polite/seductive/delinquent/cool/normal
//   personality では分けない。性格で分けると同じ archetype のキャラの口調が崩壊するため
//   （お嬢様キャラがタメ口で権威放棄宣言、など）、リーダー archetype に揃える。
// 引き方: Engine.factions.getTransitionLine(reasonKey, leader, vars)
//   reasonKey:
//     'AUTHORITY_TO_BOND_REBUKE' | 'AUTHORITY_TO_MERIT_LEADER' |
//     'AUTHORITY_TO_BOND_LEADER' | 'COMBAT_TO_BOND_DEFEAT' |
//     'FACE_TO_HEEL_DRIFT' | 'HEEL_TO_FACE_DRIFT'
//   各エントリは { leaderLine, narration } を返す。
//   {leader} {org} は呼び出し側 vars で置換される。
// ─────────────────────────────────────────────────────────────────────────────
const FACTION_TRANSITION_LINES = {
  AUTHORITY_TO_BOND_REBUKE: {
    composed: {
      leaderLine: '……肩の力、抜こうか。私が上に立つ意味、もう要らない気がして。',
      narration: '幾度かの否認を経て、{leader}は静かに権威を手放した。{org}は仲間意識の方へ重心を移す。',
    },
    ojousama: {
      leaderLine: 'もう、わたくしが旗を持つ必要もございませんわね。皆様、横で歩みましょう。',
      narration: '社長に四度退けられた末、{leader}はお高い旗を自ら畳んだ。{org}は対等な絆へと舵を切る。',
    },
    polite: {
      leaderLine: '……私が先頭に立つやり方は、皆にも社長にも届きませんでした。横で支える側に回ります。',
      narration: '{leader}は何度も拒まれた末、自らの統率方針を改めた。{org}は対等な絆を軸に再編される。',
    },
    seductive: {
      leaderLine: 'ふふ……上に立つの、もう疲れちゃった。横で寄り添う方が、きっと素敵よ。',
      narration: '艶やかな諦めとともに、{leader}は権威を解いた。{org}は寄り添う側の温度へと移ろう。',
    },
    delinquent: {
      leaderLine: 'チッ……もういい。命令も指示も、今日でやめだ。横並びでやんなよ、おまえら。',
      narration: '社長への要求を四度跳ねられ、{leader}は権威の旗を自分から下ろした。{org}は横並びの結束へ舵を切る。',
    },
    cool: {
      leaderLine: '……いい。降りる。',
      narration: '短く告げて、{leader}は権威の座から降りた。{org}は静かに横並びへ重心を移す。',
    },
    normal: {
      leaderLine: 'もう私が上に立つ理由、なくなったかも。みんなで横並びでいこう。',
      narration: '幾度かの否認を経て、{leader}は権威の看板を畳んだ。{org}は仲間意識の方へ寄り直す。',
    },
  },
  AUTHORITY_TO_MERIT_LEADER: {
    composed: {
      leaderLine: '彼女が引っ張るなら、私は数字で支える側に。',
      narration: '幹部交代を機に、{org}の柱は権威から実績へと静かに置き換えられた。',
    },
    ojousama: {
      leaderLine: 'あの方が頭に立たれるのなら、わたくしも結果で応えねばなりませんわね。',
      narration: '新たな幹部のもと、{org}は権威の旗を下ろし、勝ち星で序列を測る組織へと衣替えした。',
    },
    polite: {
      leaderLine: '彼女のやり方を尊重します。これからは、結果で語る組織でありたい。',
      narration: '{org}は新たな幹部のもと、序列を実力で測る派閥へと色を変えた。',
    },
    seductive: {
      leaderLine: 'あの子が頭? ふふ、面白いわ。私も数字で答えるしかないわね。',
      narration: '艶のある含み笑いとともに、{leader}は権威を譲った。{org}は実力本位の派閥へ移る。',
    },
    delinquent: {
      leaderLine: 'あの子が頭に立つんなら、こっちはリングで黙らせるしかねぇだろ。',
      narration: '幹部の突き上げを受け、{org}は実力主義へ路線変更した。残った者は数字で位置取りを争う。',
    },
    cool: {
      leaderLine: '……数字で示す。それだけ。',
      narration: '幹部交代を境に、{org}は権威から実績本位へと静かに塗り替わった。',
    },
    normal: {
      leaderLine: '次のボスは結果重視の人だしね。私もちゃんと数字残さなきゃ。',
      narration: '幹部交代をきっかけに、{org}は権威から実力主義へ移行した。',
    },
  },
  AUTHORITY_TO_BOND_LEADER: {
    composed: {
      leaderLine: 'ふふ、彼女が立つなら、私もただの仲間に戻れる。',
      narration: '{leader}は柔らかい後継者を得て、自らの権威を解いた。{org}は仲間意識を軸に再編される。',
    },
    ojousama: {
      leaderLine: 'あの方の温かさが、この組には合っておりましたわ。わたくしも、横で並ばせていただきます。',
      narration: '新たな幹部の人柄を受け、{leader}は権威の旗を畳んだ。{org}は横の絆で立つ組織へ姿を変える。',
    },
    polite: {
      leaderLine: '彼女の優しさが、この組には合っていた。私もその下で、皆と並びたい。',
      narration: '{org}は新たな幹部のもと、横の絆で立つ組織へと姿を変えた。',
    },
    seductive: {
      leaderLine: 'あの子のあったかさ、いいわね。私も、肩肘張るのやめにするわ。',
      narration: '柔らかな後継者の温度に引かれ、{leader}は権威を解いた。{org}は寄り添い合う組織へ衣替えする。',
    },
    delinquent: {
      leaderLine: 'あいつが頭か。……ま、いい。もう肩肘張んなくて済むわ。',
      narration: '新たな幹部の温度に引かれ、{org}は権威の組織から横で支え合う組織へ姿を変えた。',
    },
    cool: {
      leaderLine: '……あの子に任せる。私はただの仲間でいい。',
      narration: '短い譲位の言葉とともに、{org}は権威派閥から結束派閥へ姿を変えた。',
    },
    normal: {
      leaderLine: '上下関係とかもういいかな。みんなで仲良くやろう。',
      narration: '幹部交代を境に、{org}は権威から結束派閥へ衣替えした。',
    },
  },
  COMBAT_TO_BOND_DEFEAT: {
    composed: {
      leaderLine: 'これが答えね。……戦い方を、変える時。',
      narration: '完敗を受け、{leader}は静かに闘争路線を畳んだ。{org}は仲間内の結束で立て直しを図る。',
    },
    ojousama: {
      leaderLine: 'これだけやられては、もう拳を上げる気にもなりませんわ。寄り添う道を探しましょう。',
      narration: '抗争での完全敗北を機に、{leader}は牙を収めた。{org}は内向きの絆へと退く。',
    },
    polite: {
      leaderLine: '……負けは、認めます。これからは、ぶつかるより、寄り添うやり方を探したい。',
      narration: '完全敗北の末、{org}は闘争派閥から結束派閥へ路線を改めた。',
    },
    seductive: {
      leaderLine: 'ふふ……完敗、ね。もう拳より、温もりの方が欲しいわ。',
      narration: '艶のある諦めとともに、{leader}は闘争心を畳んだ。{org}は寄り添う側の派閥へと退く。',
    },
    delinquent: {
      leaderLine: 'はぁ……ここまでやられたら、もう拳ふり上げる気にもならねぇよ。',
      narration: '抗争に大敗した{org}は、闘争組織から結束派閥へと変質した。',
    },
    cool: {
      leaderLine: '……負けた。終わりだ。',
      narration: '短い敗北宣言を経て、{leader}は牙を収めた。{org}は内向きの絆へと退く。',
    },
    normal: {
      leaderLine: 'これだけやられたらもう降参。仲良くやっていこう。',
      narration: '抗争完敗を機に、{org}は牙を畳んで結束派閥へと衣替えした。',
    },
  },
  // FACE → HEEL（派閥全体のヒール度が長期に上昇した結果）
  FACE_TO_HEEL_DRIFT: {
    composed: {
      leaderLine: '……正直に言うと、王道って、しんどかった。こっちの方が、息がしやすい。',
      narration: '{leader}は静かに王道の看板を下ろした。{org}は表舞台の華やかさより、裏側の温度を選ぶ。',
    },
    ojousama: {
      leaderLine: 'もう、お行儀よくしているのも飽きましたわ。客の悲鳴のほうが、ずっと心地よろしくて。',
      narration: '{leader}の口元から優雅な微笑みが消え、艶のある悪意が滲んだ。{org}はファンに背を向け、ヒールへと滑り出す。',
    },
    polite: {
      leaderLine: '……ファンに胸を張れる派閥でいたかった。でも、ここまで来た自分たちを、もう戻せません。',
      narration: '迷いと諦めの末、{leader}は王道の旗を畳んだ。{org}は反主流の側へ立ち位置を移す。',
    },
    seductive: {
      leaderLine: 'ふふ……あなたたちが嫌がる顔、見ていたいの。それじゃ、ダメかしら?',
      narration: '艶やかな囁きとともに、{leader}は王道の仮面を捨てた。{org}は挑発と反則を糧に変質していく。',
    },
    delinquent: {
      leaderLine: 'もう「いい子」のフリは限界だ。客の歓声より、悲鳴の方が気持ちいいんだよ。',
      narration: '{leader}の表情から王道の柔らかさが消えた。{org}はファンに背を向け、挑発と反則を糧に変質する。',
    },
    cool: {
      leaderLine: '……飽きた。こっち側でいい。',
      narration: '短い告白を経て、{leader}は王道の看板を下ろした。{org}はヒール側へと立ち位置を変える。',
    },
    normal: {
      leaderLine: 'もう真面目にやるのやめた。客が嫌がる顔の方が、見てて楽しい。',
      narration: '{leader}は王道の重さに飽きた。{org}は軽々と立ち位置を変え、ヒールサイドへ転がり込む。',
    },
  },
  // HEEL → FACE（派閥全体のヒール度が長期に下降した結果）
  HEEL_TO_FACE_DRIFT: {
    composed: {
      leaderLine: '……反則、続けるの、しんどかった。普通に試合する方が、自分らしい。',
      narration: '{leader}は静かに反主流の看板を下ろした。{org}は王道の側で、ようやく息を整える。',
    },
    ojousama: {
      leaderLine: '悪役を演じるのも、そろそろ飽きましたわ。皆様の声援、頂戴いたしますわよ。',
      narration: '{leader}は艶やかにヒールの仮面を外した。{org}は王道路線へと衣替えする。',
    },
    polite: {
      leaderLine: 'ヒールでいる意味を、もう自分で説明できません。応援してくれる人の方を見ます。',
      narration: '誠実さがヒールの仮面を内側から押し返した。{org}は王道路線へと舵を切る。',
    },
    seductive: {
      leaderLine: 'ふふ……あの子たちの真っ直ぐな目に、参っちゃったの。悪役は、もう似合わないわ。',
      narration: '艶やかな告白とともに、{leader}はヒールの皮を脱いだ。{org}は王道路線へ歩み戻る。',
    },
    delinquent: {
      leaderLine: 'チッ、ガラじゃねぇが……うちらに歓声が向くなら、それも悪くねぇ。',
      narration: '{leader}の挑発の刃が鈍った。{org}は反主流の旗を畳み、王道の側へと立ち位置を変える。',
    },
    cool: {
      leaderLine: '……普通でいい。',
      narration: '短い告白を機に、{leader}はヒールの看板を下ろした。{org}は王道の側で息を整える。',
    },
    normal: {
      leaderLine: 'ヒール、もういいかな。やっぱり歓声の方が気持ちいいし。',
      narration: '{leader}はあっさりとヒールの皮を脱いだ。{org}は王道路線へ転がり込む。',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 派閥 F02 対峙セリフ（6 personality × 7 archetype × {attack,defend}）
// 引き方: Engine.factions.getF02ClashLine(fighter, side)
//   personality は Engine.contract.getPersonalityType(fighter) の戻り値
//     → bold / introverted / carefree / earnest / emotional / shy
//   archetype は fighter.archetype そのまま
//     → normal / ojousama / polite / composed / cool / delinquent / seductive
//   side は 'attack'（宣戦側）または 'defend'（応じる側）
// archetype キー未定義の場合は normal にフォールバック。
// personality 未定義の場合は introverted にフォールバック。
// ─────────────────────────────────────────────────────────────────────────────
const FACTION_F02_LINES = {
  bold: {
    attack: {
      normal:     'もう、同じ場所には立てない',
      ojousama:   'もう、同じ場所には立てませんわ',
      polite:     'もう、同じ場所には立てません',
      composed:   'もう、同じ場所には立てない',
      cool:       '……もう、並べない',
      delinquent: 'もう、一緒にゃいられねえ',
      seductive:  'もう、隣には立てないわ',
    },
    defend: {
      normal:     '上等だ。受けて立つ',
      ojousama:   '上等ですわ。お受けいたしましょう',
      polite:     '上等です。お受けいたします',
      composed:   '上等。受けて立とう',
      cool:       '……上等',
      delinquent: '上等だ、かかってこい',
      seductive:  '上等よ。受けて立つわ',
    },
  },
  introverted: {
    attack: {
      normal:     '……もう、戻れません',
      ojousama:   '……もう、戻れませんわ',
      polite:     '……もう、戻れません',
      composed:   '……もう、戻れない',
      cool:       '……戻れない',
      delinquent: '……もう、戻れない',
      seductive:  '……もう、戻れないの',
    },
    defend: {
      normal:     'そちらが望むなら',
      ojousama:   'そちらがお望みでしたら',
      polite:     'そちらがお望みなら',
      composed:   'そちらが望むなら',
      cool:       '……望むなら',
      delinquent: 'そっちがそう言うなら',
      seductive:  'あなたが望むなら',
    },
  },
  carefree: {
    attack: {
      normal:     '仲良しごっこは終わり、かな',
      ojousama:   '仲良しごっこは、もう終わりですわね',
      polite:     '仲良しごっこは、もう終わりですね',
      composed:   '仲良しごっこは、もう終わりだ',
      cool:       '……仲良しごっこは終わり',
      delinquent: '仲良しごっこは終わりだな',
      seductive:  '仲良しごっこは終わり、でしょ？',
    },
    defend: {
      normal:     'ま、仕方ないよね',
      ojousama:   'まあ、仕方ありませんわね',
      polite:     'まあ、仕方ありませんね',
      composed:   'まあ、仕方ない',
      cool:       '……仕方ない',
      delinquent: 'ま、しゃあねえな',
      seductive:  'ま、仕方ないわね',
    },
  },
  earnest: {
    attack: {
      normal:     'けじめを、つけさせてください',
      ojousama:   'けじめを、つけさせてくださいませ',
      polite:     'けじめを、つけさせてください',
      composed:   'けじめを、つけさせてもらう',
      cool:       '……けじめをつける',
      delinquent: 'けじめはつけさせてもらう',
      seductive:  'けじめを、つけさせて',
    },
    defend: {
      normal:     '逃げるつもりはありません',
      ojousama:   '逃げるつもりはございませんわ',
      polite:     '逃げるつもりはありません',
      composed:   '逃げるつもりはない',
      cool:       '……逃げない',
      delinquent: '逃げる気はねえ',
      seductive:  '逃げるつもりはないわ',
    },
  },
  emotional: {
    attack: {
      normal:     '許せない、あの子のやり方',
      ojousama:   '許せませんわ、あの方のなさりよう',
      polite:     '許せません、あの方のやり方',
      composed:   '許せないね、あのやり方は',
      cool:       '……許せない',
      delinquent: '許せねえ、あいつのやり方',
      seductive:  '許せないのよ、あの子のやり方',
    },
    defend: {
      normal:     'こっちだって、引けないの',
      ojousama:   'わたくしだって、引けませんわ',
      polite:     'こちらも、引くわけにはいきません',
      composed:   'こちらも、引けないんだ',
      cool:       '……引けない',
      delinquent: 'こっちだって引けねえんだよ',
      seductive:  'こっちだって、引けないのよ',
    },
  },
  shy: {
    attack: {
      normal:     'あの…もう、一緒には…いられなくて',
      ojousama:   'あの…もう、ご一緒には…いられませんの',
      polite:     'あの、もう…ご一緒には、いられません…',
      composed:   'もう、一緒にはいられない…',
      cool:       '……もう、無理',
      delinquent: 'もう…一緒には、いられない…',
      seductive:  'あの…もう、一緒には…いられないの',
    },
    defend: {
      normal:     '…やるしか、ないんです',
      ojousama:   '…やるしか、ありませんわ',
      polite:     '…やるしか、ないんです',
      composed:   '…やるしかない',
      cool:       '……やる',
      delinquent: '…やるしか、ねえ',
      seductive:  '…やるしかないの',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// F07 v0.4 派閥動向セリフテーブル
// 引き方: Engine.factions.getF07Line({ category, incidentType, choice, personality })
//   personality: bold / introverted / carefree / earnest / emotional / shy
//                （getPersonalityType の戻り値）
//   - leaderDemand: 入口モーダル本文のリーダー直接セリフ（要求型のみ）
//   - coachReport:  入口モーダルのコーチ報告ナレーション（観察型・インシデント型）
//   - resultLeader: 結果モーダルのリーダー反応セリフ
//   - resultTarget: 結果モーダルの対象選手反応（観察・インシデント型）
// 段階投入: DEMAND_MAIN / OBSERVE_RIVAL_HEAT / INCIDENT_BOUNDARY をフル品質、
//          残り 9 種は性格無視のプレースホルダ。
// ─────────────────────────────────────────────────────────────────────────────
const F07_LINES = {
  leaderDemand: {
    DEMAND_MAIN: {
      normal: {
        bold:        ['社長、次の興行のメイン、私たちに任せてもらえませんか。実力で示します。'],
        introverted: ['…社長、次のメイン、私たちで挑ませてもらえませんか。'],
        carefree:    ['社長〜、次のメイン、私たちでいきましょうよ。盛り上げますって。'],
        earnest:     ['社長、お願いがあります。次の興行のメイン、私たちにやらせてください。'],
        emotional:   ['社長、頼みます。メイン、私たちに回してください。今の私たちなら必ず応えます。'],
        shy:         ['…社長、あの、次のメイン…私たちに、お願いできませんか。'],
      },
      composed: {
        bold:        ['社長、次のメインカード、私たちで組ませてください。今ならハマります。'],
        introverted: ['…社長、次のメイン、私たちで考えてみたいのですが。'],
        carefree:    ['社長、次のメイン、私たちで請けても構いませんか。流れを作りますよ。'],
        earnest:     ['社長、次の興行のメインを私たちに任せていただけないか、ご検討いただけますか。'],
        emotional:   ['社長、次のメインは私たちに任せてください。今の状態を逃したくないんです。'],
        shy:         ['…社長、次のメイン…私たちで、考えていただけませんか。'],
      },
      ojousama: {
        bold:        ['ねぇ社長、次のメイン、わたくしたちにお任せいただけませんこと?'],
        introverted: ['…社長、次のメイン、わたくしたちに頂戴できませんでしょうか。'],
        carefree:    ['社長〜、次のメインカード、わたくしたちでいかがかしら?'],
        earnest:     ['社長、不躾なお願いですが、次の興行のメインをわたくしたちにお任せいただきたく。'],
        emotional:   ['社長、お願いいたしますわ。次のメイン、わたくしたちに任せてくださいませ。'],
        shy:         ['…社長、その…次のメイン、わたくしたちに…いただけませんでしょうか。'],
      },
      polite: {
        bold:        ['社長、突然ですが、次のメインを私たちに任せていただけないでしょうか。'],
        introverted: ['…社長、次のメイン、私たちに任せていただけませんでしょうか。'],
        carefree:    ['社長、次のメイン、よろしければ私たちでやらせていただけませんか〜。'],
        earnest:     ['社長、お忙しいところ恐縮ですが、次の興行のメインを私たちにお任せいただけませんでしょうか。'],
        emotional:   ['社長、お願いします。次のメインを、どうか私たちに任せてください。'],
        shy:         ['…社長、あの…次のメイン、私たちに…お任せいただけたら、嬉しいです。'],
      },
      seductive: {
        bold:        ['社長、次のメイン、私に任せてくれない? 必ず客を沸かすから。'],
        introverted: ['…社長、次のメイン、私で行ってもいい?'],
        carefree:    ['社長〜、次のメイン、私たちでいかが? 楽しい絵を描けるわよ。'],
        earnest:     ['社長、次の興行のメイン、私に預けてくれませんか。手応えはあるんです。'],
        emotional:   ['社長、次のメインは私たちに任せて。中途半端じゃ嫌なの、お願い。'],
        shy:         ['…社長、次のメイン…私で、いいですか?'],
      },
      delinquent: {
        bold:        ['社長、次のメイン、あたしらでいきますよ。話、通してください。'],
        introverted: ['…社長、次のメイン、あたしらに回してくんないっすか。'],
        carefree:    ['社長〜、次のメイン、あたしらで暴れさせてくれません?'],
        earnest:     ['社長、こんな言い方アレですけど、次のメインはあたしらに張らせてください。'],
        emotional:   ['社長、次のメイン、あたしらに張らせろっつってんです。逃げないですから。'],
        shy:         ['…社長、その、次のメイン…あたしらに、お願いできないっすかね…?'],
      },
      cool: {
        bold:        ['社長、次のメイン、私たちに任せてください。準備はできています。'],
        introverted: ['…社長、次のメイン、私たちに回せませんか。'],
        carefree:    ['社長、次のメイン、私たちで請けます。発表してください。'],
        earnest:     ['社長、次のメイン、私たちに任せていただけるなら、結果で返します。'],
        emotional:   ['社長、次のメインは私たちです。任せてください。'],
        shy:         ['…社長、次のメイン…私で、お願いできますか。'],
      },
    },
    DEMAND_MONEY: {
      normal: {
        bold:        ['社長、私たちのメンバーの待遇、もう一度見直してもらえませんか。'],
        introverted: ['…社長、待遇のことで相談があります。私たちのメンバーのことです。'],
        carefree:    ['社長〜、お給料の話なんですけど、ちょっとだけ上げてもらえませんか?'],
        earnest:     ['社長、図々しいお願いですが、私たちのメンバーの待遇を見直していただけませんか。'],
        emotional:   ['社長、お願いします。私たちのメンバー、もっと正当に評価されてもいいはずです。'],
        shy:         ['…社長、その、待遇の件で…一度、聞いてもらえますか。'],
      },
      composed: {
        bold:        ['社長、私たちの給与、一度見直しの俎上に乗せてもらえませんか。'],
        introverted: ['…社長、給与改定のこと、ご相談したいのですが。'],
        carefree:    ['社長、給与の話、頃合いだと思うんですけど、いかがですか?'],
        earnest:     ['社長、私たちのメンバーの待遇について、一度ご検討いただけませんでしょうか。'],
        emotional:   ['社長、私たちが受け取っているもの、もう一度見直してください。お願いします。'],
        shy:         ['…社長、給与のこと…一度、お時間いただけませんか。'],
      },
      ojousama: {
        bold:        ['ねぇ社長、わたくしどもの給与、改めてお考えいただけませんこと?'],
        introverted: ['…社長、待遇の件で、わたくしどものお話を伺っていただけませんでしょうか。'],
        carefree:    ['社長〜、お給金の件、少々考えてくださってもよろしくてよ?'],
        earnest:     ['社長、お聞き苦しいかもしれませんが、わたくしどもの待遇を見直していただけませんでしょうか。'],
        emotional:   ['社長、わたくしどもの努め、相応のお手当てでお返しいただきたいのです。'],
        shy:         ['…社長、わたくしどもの待遇のこと…一度、お話聞いてくださいませ。'],
      },
      polite: {
        bold:        ['社長、突然ですが、私たちのメンバーの待遇を見直していただきたいです。'],
        introverted: ['…社長、待遇のことで、ご相談させていただいてもよろしいですか。'],
        carefree:    ['社長、お給料のこと、よろしければ少しご検討いただけませんか〜。'],
        earnest:     ['社長、不躾で申し訳ありませんが、私たちのメンバーの待遇を一度ご再考いただけませんでしょうか。'],
        emotional:   ['社長、お願いします。私たちのメンバー、もう少し報いてあげてください。'],
        shy:         ['…社長、あの…待遇のこと、少しだけお話、させていただけませんか。'],
      },
      seductive: {
        bold:        ['社長、私たちの給料の話、ちょっと聞いてくれない?'],
        introverted: ['…社長、待遇の話…してもいい?'],
        carefree:    ['社長〜、お給料の話、たまには上向きにしてくれないと困りますよ?'],
        earnest:     ['社長、私たちの仕事に見合うお手当て、考え直してくださいませんか。'],
        emotional:   ['社長、お願い、私たちが何を受け取ってるか、もう一度見て。'],
        shy:         ['…社長、お給料のこと…相談、してもいいですか?'],
      },
      delinquent: {
        bold:        ['社長、あたしらの給料、見直してくれません? はっきり言って足りないっす。'],
        introverted: ['…社長、給料の話、聞いてくんないっすか。'],
        carefree:    ['社長〜、お給料の件、ちょっと色つけてくんないっすかね〜?'],
        earnest:     ['社長、こんなこと言うのもアレなんですけど、あたしらの待遇、見直してくださいよ。'],
        emotional:   ['社長、あたしらの給料、ちゃんと釣り合わせてくださいよ。我慢の限界なんですよ。'],
        shy:         ['…社長、その、給料のこと…ちょっとだけ、聞いてくんないっすかね…?'],
      },
      cool: {
        bold:        ['社長、私たちのメンバーの待遇、見直してください。理由は資料で出します。'],
        introverted: ['…社長、給与のこと、相談があります。'],
        carefree:    ['社長、給与改定、提案させてください。妥当だと思います。'],
        earnest:     ['社長、私たちの待遇、現状と合っていないと思います。一度ご検討ください。'],
        emotional:   ['社長、私たちが受け取ってる金額、見合ってないです。直してください。'],
        shy:         ['…社長、給与のこと、一度、聞いてくれますか。'],
      },
    },
    DEMAND_ABSTRACT: {
      normal: {
        bold:        ['社長、私たちのメンバーのこと、もう少しだけ大事にしてもらえませんか。'],
        introverted: ['…社長、私たちのメンバーを、ちゃんと見てもらえるとありがたいです。'],
        carefree:    ['社長〜、私たちの子のこと、忘れないでくださいね。'],
        earnest:     ['社長、お願いがあります。私たちのメンバーのこと、気にかけてもらえないでしょうか。'],
        emotional:   ['社長、頼みます。私たちのメンバー、もっと大切に扱ってください。'],
        shy:         ['…社長、その、私たちのメンバーのこと、お願いします。'],
      },
      composed: {
        bold:        ['社長、私たちのメンバーに、もう少し目を配っていただけませんか。'],
        introverted: ['…社長、私たちのこと、気に留めていただけると嬉しいです。'],
        carefree:    ['社長、私たちのこと、たまには思い出してあげてくださいね。'],
        earnest:     ['社長、私たちのメンバーのこと、いま少しお気にかけていただきたいのですが。'],
        emotional:   ['社長、私たちの子たち、ちゃんと抱えていてください。お願いします。'],
        shy:         ['…社長、私たちのこと…忘れないでいてくださると、嬉しいです。'],
      },
      ojousama: {
        bold:        ['ねぇ社長、わたくしどものこと、もっと大切に扱ってくださいませ。'],
        introverted: ['…社長、わたくしどもを、もう少しだけ気にかけていただきたいですわ。'],
        carefree:    ['社長〜、わたくしたちのこと、たまには思い出してくださってもよろしくてよ?'],
        earnest:     ['社長、不躾ですが、わたくしどものメンバーをもう少しお気遣いいただけませんでしょうか。'],
        emotional:   ['社長、わたくしどもの子たち、どうか大切に扱ってくださいませ。'],
        shy:         ['…社長、わたくしどものこと…どうか、忘れずにいてくださいませ。'],
      },
      polite: {
        bold:        ['社長、突然ですが、私たちのメンバーをもう少し大切にしていただきたいです。'],
        introverted: ['…社長、私たちのメンバーのこと、お気にかけていただけますでしょうか。'],
        carefree:    ['社長、私たちの子のこと、よろしければ思い出してあげてくださいね〜。'],
        earnest:     ['社長、お忙しいところ恐縮ですが、私たちのメンバーのこと、お気遣いいただけませんでしょうか。'],
        emotional:   ['社長、お願いします。私たちのメンバーのこと、どうか大事にしてあげてください。'],
        shy:         ['…社長、あの…私たちのメンバーのこと、気にかけていただけると…嬉しいです。'],
      },
      seductive: {
        bold:        ['社長、私たちのこと、もう少し気にかけて。寂しくなっちゃうから。'],
        introverted: ['…社長、私たちのこと…たまには思い出してくれる?'],
        carefree:    ['社長〜、私たちの子のこと、ちゃんと可愛がってあげないとダメですよ?'],
        earnest:     ['社長、私たちのメンバーのこと、もう少しだけ目を向けてくださいませんか。'],
        emotional:   ['社長、お願い、私たちの子たちを置き去りにしないで。'],
        shy:         ['…社長、私たちのこと…忘れてないですか?'],
      },
      delinquent: {
        bold:        ['社長、あたしらのこと、もうちょい大事にしてくんないっすか。'],
        introverted: ['…社長、あたしらのこと、もう少し気にかけてくんないっすか。'],
        carefree:    ['社長〜、あたしらの子のこと、たまには可愛がってやってくれません?'],
        earnest:     ['社長、こんなこと言うのもアレですけど、あたしらのメンバー、もうちょい大事にしてくださいよ。'],
        emotional:   ['社長、あたしらの子たち、ちゃんと面倒見てくださいよ。放っとかないでくださいよ。'],
        shy:         ['…社長、その、あたしらのこと…忘れてないっすよね…?'],
      },
      cool: {
        bold:        ['社長、私たちのメンバー、もう少し目を配ってください。お願いします。'],
        introverted: ['…社長、私たちのこと、気にかけていただけますか。'],
        carefree:    ['社長、私たちのメンバーのこと、たまに思い出してください。'],
        earnest:     ['社長、私たちのメンバーのこと、もう少し気にかけていただきたいです。'],
        emotional:   ['社長、私たちの子たち、放っておかないでください。'],
        shy:         ['…社長、私たちのこと、忘れないでいてくれますか。'],
      },
    },
    // archetype × personality マトリクス（7 archetype × 6 personality = 42マス）
    DEMAND_RECOGNITION: {
      normal: {
        bold:        ['社長、私の貢献、ちゃんと評価してもらえてますか。確認させてください。'],
        introverted: ['…社長、私たちの仕事、見てもらえてますか。'],
        carefree:    ['社長〜、私たちの頑張り、たまには褒めてくれてもいいんですよ?'],
        earnest:     ['社長、私たちの貢献、もし届いていれば、一言いただけませんか。'],
        emotional:   ['社長、私たちのメンバーがやってきたこと、ちゃんと見てください。'],
        shy:         ['…社長、その、私たちのこと、見てくれてますか…?'],
      },
      composed: {
        bold:        ['社長、私たちが積み上げてきたもの、評価の俎上に乗っていますか。'],
        introverted: ['…社長、私たちの働き、ご覧になっていますか。'],
        carefree:    ['社長、私たちの仕事ぶり、たまには口に出していただけると助かります。'],
        earnest:     ['社長、私たちの貢献に、一言いただける機会をお願いしたいのですが。'],
        emotional:   ['社長、私たちのメンバーがやってきたこと、しっかり見ていただきたい。'],
        shy:         ['…社長、私たちのこと、覚えていてくださると、嬉しいです。'],
      },
      ojousama: {
        bold:        ['ねぇ社長、わたくしどもの貢献、きちんと評価していただいておりますの?'],
        introverted: ['…社長、わたくしどものこと、見ていただけていますの?'],
        carefree:    ['社長〜、わたくしたちの働き、たまには褒めてくださってもよろしくてよ?'],
        earnest:     ['社長、不躾なお願いですが、わたくしどもの貢献にひとことお言葉を頂戴したく。'],
        emotional:   ['社長、わたくしどもの努め、どうかご覧いただきたいのです。'],
        shy:         ['…社長、わたくしのこと…見ていてくださいますか。'],
      },
      polite: {
        bold:        ['社長、突然ですが、私たちの貢献を一度きちんと評価していただきたく存じます。'],
        introverted: ['…社長、私たちの働き、見ていただけていますでしょうか。'],
        carefree:    ['社長、私たちの頑張り、よろしければ一度褒めていただけませんか〜。'],
        earnest:     ['社長、お忙しいところ恐縮ですが、私たちの貢献にお言葉をいただけませんでしょうか。'],
        emotional:   ['社長、私たちの積み重ね、どうかちゃんと見てください。お願いします。'],
        shy:         ['…社長、あの…私たちのこと、見ていてくださると…うれしいです。'],
      },
      seductive: {
        bold:        ['社長、私の貢献、ちゃんと見てくれてる? 確かめさせて。'],
        introverted: ['…社長、私のこと、見ていてくれてる?'],
        carefree:    ['社長〜、私のこと、たまには褒めてくれないと拗ねちゃいますよ?'],
        earnest:     ['社長、私の仕事、届いてるなら一言ください。それで救われる子もいるんです。'],
        emotional:   ['社長、私たちが何をしてきたか、ちゃんと見てくれないと寂しいじゃない。'],
        shy:         ['…社長、私のこと…ちゃんと、見てくださってる?'],
      },
      delinquent: {
        bold:        ['社長、あたしらの働き、ちゃんと数えてんですか。はっきり言ってもらえます?'],
        introverted: ['…社長、あたしらのこと、見てんすか。'],
        carefree:    ['社長〜、あたしらの頑張り、たまには口に出してくれませんかね〜?'],
        earnest:     ['社長、こんなこと言うのもアレですけど、あたしらの貢献、ちゃんと見ててくださいよ。'],
        emotional:   ['社長、あたしらが何やってきたか、ちゃんと見ろっつってんですよ。'],
        shy:         ['…社長、その、あたしらのこと…見ててくれてんすよね…?'],
      },
      cool: {
        bold:        ['社長、私の貢献、評価の対象に入っていますか。確認したい。'],
        introverted: ['…社長、私たちの仕事、見ていますか。'],
        carefree:    ['社長、私たちの働き、一度くらい言葉にしてほしい。'],
        earnest:     ['社長、私たちの貢献が評価の対象なら、一言いただけますか。'],
        emotional:   ['社長、私たちがやってきたこと、見ないままにしないでください。'],
        shy:         ['…社長、私のこと、見ていてくれていますか。'],
      },
    },
  },
  coachReport: {
    OBSERVE_RIVAL_HEAT: [
      '{leaderName}が{targetName}に当たりが強いんです。練習場でも、控室でも。',
      'コーチから報告が。{leaderName}が{targetName}を露骨に避けてる。派閥外の選手にだけ、なんですよ。',
      '{leaderName}の言葉、{targetName}には冷たい。気のせいじゃないと思います。',
    ],
    OBSERVE_ABSENCE: [
      '{leaderName}の練習出席が落ちています。{factionName}全体に伝染しかけてる。',
      '{leaderName}、ここ二週間ほど道場に顔を出してません。下の子たちも、なんとなく雰囲気を真似してる。',
      'コーチから報告で、{leaderName}の遅刻と早退が増えてます。理由までは聞けてない。',
    ],
    OBSERVE_INTERNAL_RANK: [
      '{factionName}の中で、序列の話が出ています。OVR の上下が露骨に意識されてる。',
      '{factionName}内で、誰が二番手かって囁きが回ってます。{leaderName}の耳には、まだ入ってない。',
      'コーチが言うには、{factionName}は実力差の話を持ち出すと空気が変わるそうです。',
    ],
    OBSERVE_FAN_PRESSURE: [
      '{leaderName}、最近少し疲れて見えます。客席の期待が、重くのしかかってるみたいで。',
      'ファンレターの量が増えてから、{leaderName}の顔色が良くない。期待の重さに押されてる。',
      '{leaderName}、入場曲がかかると一瞬肩が下がるんです。気づいた人、何人かいます。',
    ],
    OBSERVE_TRAINING_HARD: [
      '{leaderName}が{factionName}を追い込みすぎています。怪我のリスクが高い。',
      '練習場、{factionName}だけ終わらない。{leaderName}が頷くまで誰も上がれない雰囲気で。',
      'コーチが心配してます。{factionName}のスパーリング、強度が一段階上がってる。',
    ],
    INCIDENT_BOUNDARY: [
      'ロッカールーム、{factionName}が固まって陣取ってます。{targetName}が居場所をなくしかけてる。',
      '{factionName}と派閥外の間に、目に見えない壁ができてます。{targetName}が困ってました。',
      '{leaderName}たちのテーブル、誰も近づけない雰囲気で。{targetName}が遠巻きにしてました。',
    ],
    INCIDENT_BONDING: [
      '{factionName}だけで打ち上げに行ったみたいです。誘われなかった子、ちょっと寂しそうで。',
      '{factionName}、休日に揃って出かけてるみたいです。{targetName}は声をかけてもらえなかったとか。',
      'ロッカーで{factionName}が固まって笑ってる。輪の外に立ってる子の背中、見ていられないです。',
    ],
    INCIDENT_HEEL_PROVOKE: [
      '{leaderName}、試合外でも観客を煽ってます。客席はざわついてました。',
      '取材で{leaderName}が他団体の選手を挑発してました。記者も困惑顔で。',
      'バックステージで{leaderName}が客席のヤジに乗ってます。営業に少し影響が出るかも。',
    ],
  },
  resultLeader: {
    DEMAND_MAIN: {
      A: {
        normal: {
          bold:['ありがとうございます。期待に応えます。'], introverted:['…ありがとうございます。やります。'],
          carefree:['やった、社長ありがとう! メイン張りますね!'], earnest:['本当にありがとうございます。必ず応えます。'],
          emotional:['社長…ありがとうございます。応えてみせます。'], shy:['…はい、ありがとうございます。'],
        },
        composed: {
          bold:['ありがたく頂戴します。期待は超えてみせます。'], introverted:['…ありがとうございます。やらせていただきます。'],
          carefree:['社長、ありがとうございます。任されたからにはやりますよ。'], earnest:['ありがとうございます。お預かりした以上、形にしてお返しします。'],
          emotional:['社長、ありがとうございます。引き受けた重さ、噛み締めます。'], shy:['…社長、ありがとうございます。…精一杯、やります。'],
        },
        ojousama: {
          bold:['まあ、社長ありがとうございますわ。期待に応えてみせますわよ。'], introverted:['…ありがとうございますわ。…精一杯、努めます。'],
          carefree:['まあ嬉しい、社長ありがとう! 華やかなメインにいたしますわ。'], earnest:['社長、誠にありがとうございます。粗相のないよう務めますわ。'],
          emotional:['社長…わたくし、嬉しゅうございます。必ずや応えてみせますわ。'], shy:['…ありがとうございますわ。…がんばりますわ。'],
        },
        polite: {
          bold:['ありがとうございます。お任せいただいた以上、結果で示します。'], introverted:['…ありがとうございます。誠心誠意、努めさせていただきます。'],
          carefree:['わ、社長ありがとうございます〜。期待に応えますね!'], earnest:['社長、本当にありがとうございます。お預かりしたメイン、最後まで責任持って務めます。'],
          emotional:['社長、ありがとうございます…お言葉に応えられるよう、全力を尽くします。'], shy:['…あの、ありがとうございます。…精一杯、がんばります。'],
        },
        seductive: {
          bold:['ありがとう、社長。期待してて、ちゃんと魅せるから。'], introverted:['…ありがとうございます。…ちゃんと応えますね。'],
          carefree:['やった〜、社長ありがとう! 楽しいメインにしますね。'], earnest:['社長、ありがとうございます。預かった以上、手は抜きません。'],
          emotional:['社長…ありがとう。胸が熱いの、忘れないから。'], shy:['…ありがとうございます。…ちゃんと、応えますね。'],
        },
        delinquent: {
          bold:['ありがとうございます。客、ぶち上げてみせますよ。'], introverted:['…ありがとうございます。…やらせてもらいます。'],
          carefree:['マジですか? 社長ありがとう! 暴れさせてもらいますね〜!'], earnest:['社長、ありがとうございます。あたしら、ちゃんとやります。'],
          emotional:['社長、ありがとうございます。この熱、ちゃんと客に届けますから。'], shy:['…社長、その…ありがとうございます。…がんばります。'],
        },
        cool: {
          bold:['ありがとうございます。結果で返します。'], introverted:['…ありがとうございます。やります。'],
          carefree:['ありがとうございます。やりますね。'], earnest:['ありがとうございます。任された以上、応えます。'],
          emotional:['社長、ありがとうございます。…胸に留めておきます。'], shy:['…ありがとうございます。…がんばります。'],
        },
      },
      B: {
        normal: {
          bold:['…そうですか。わかりました。'], introverted:['…はい、わかりました。'],
          carefree:['えぇ〜、まあ、わかりましたけど〜。'], earnest:['…はい、承知しました。'],
          emotional:['…そうですか。次の機会に、また。'], shy:['…はい…わかりました。'],
        },
        composed: {
          bold:['…承知しました。次の機会を待ちます。'], introverted:['…はい、わかりました。出直します。'],
          carefree:['まあ、こういうこともありますね。次に期待します〜。'], earnest:['…承知しました。次回、改めてお願いします。'],
          emotional:['…そうですか。…次は、必ず。'], shy:['…はい…承知しました。'],
        },
        ojousama: {
          bold:['…そうですの。わかりましたわ。'], introverted:['…そうですわ。…承知いたしました。'],
          carefree:['まあ、つれないですこと。次は期待してますわ〜。'], earnest:['…承知いたしましたわ。失礼いたしました。'],
          emotional:['…そうですの。…次の機会に、いたしますわ。'], shy:['…はい…承知いたしましたわ。'],
        },
        polite: {
          bold:['…承知しました。失礼いたしました。'], introverted:['…はい、承知いたしました。'],
          carefree:['えぇ〜、そうですか〜。まあ仕方ないですね。'], earnest:['…承知しました。出過ぎたことを申しました。失礼いたしました。'],
          emotional:['…そう、ですか。…承知いたしました。'], shy:['…はい…承知しました。失礼いたしました。'],
        },
        seductive: {
          bold:['…そう。じゃあ、覚えておくね。'], introverted:['…はい、わかりました。'],
          carefree:['えぇ〜、つれない。まあいいですけど〜。'], earnest:['…承知しました。図々しいことを言いました。'],
          emotional:['…そうですか。…ちょっと、寂しいな。'], shy:['…はい…わかりました。'],
        },
        delinquent: {
          bold:['…っす。わかりました。'], introverted:['…はい、わかりました。'],
          carefree:['えぇ〜、つれないっすね〜。まあいいっすけど。'], earnest:['…っす、承知っす。すんません、出過ぎました。'],
          emotional:['…っ、そうっすか。…次は、わかんないですよ。'], shy:['…っす…わかりました。'],
        },
        cool: {
          bold:['…承知。次に回します。'], introverted:['…はい、わかりました。'],
          carefree:['わかりました。仕方ない。'], earnest:['…承知しました。失礼しました。'],
          emotional:['…そうですか。…わかりました。'], shy:['…はい…わかりました。'],
        },
      },
      C: {
        normal: {
          bold:['…そういうことですか。心遣いはありがたく。'], introverted:['…そうですね。ありがとうございます。'],
          carefree:['ふぅん、そっちですか〜。まあいいですけど。'], earnest:['…ありがとうございます。気にかけてくださって。'],
          emotional:['…そうですね。社長の判断、信じます。'], shy:['…はい、ありがとうございます。'],
        },
        composed: {
          bold:['…なるほど、そういう形ですか。お預かりします。'], introverted:['…ありがとうございます。…そっちで考えてくださったんですね。'],
          carefree:['ふむ、まあそういう手もありますね〜。ありがとうございます。'], earnest:['…ありがとうございます。お気持ち、しっかり受け取ります。'],
          emotional:['…社長…そういう形でしたか。…ありがたいです。'], shy:['…はい…ありがとうございます。'],
        },
        ojousama: {
          bold:['…まあ、そういうご配慮ですのね。ありがたく頂戴いたしますわ。'], introverted:['…ありがとうございますわ。…お心遣い、嬉しゅうございます。'],
          carefree:['あら、そういう形ですの? まあ、ありがとうございますわ〜。'], earnest:['…社長、ご配慮痛み入りますわ。'],
          emotional:['…社長、そのお心遣い…胸に染みますわ。'], shy:['…ありがとうございますわ。…嬉しゅう、ございます。'],
        },
        polite: {
          bold:['…なるほど、そういう形ですか。ありがたく承ります。'], introverted:['…ありがとうございます。…そっちで考えてくださったんですね。'],
          carefree:['ふぅん、別の手ですか〜。ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。お気持ち、しっかり受け取ります。'],
          emotional:['…社長、そういう答え方、ですか。…ありがとうございます。'], shy:['…あの、ありがとうございます。'],
        },
        seductive: {
          bold:['…そう。それも悪くないかもね。ありがとう。'], introverted:['…ありがとうございます。…そっちで気にかけてくれるんですね。'],
          carefree:['あら、そっちの形? まあ、ありがとうございます〜。'], earnest:['…社長、お気遣いありがとうございます。'],
          emotional:['…社長…そういう形ですか。…ありがとう。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        delinquent: {
          bold:['…っす。まあ、そういう形ならありがたく。'], introverted:['…っす。ありがとうございます。'],
          carefree:['へぇ、そっちっすか? まあ、ありがたいっすけど〜。'], earnest:['…社長、配慮ありがとうございます。'],
          emotional:['…っ、そういう形っすか。…ありがたいっす。'], shy:['…っす、ありがとうございます。'],
        },
        cool: {
          bold:['…承知。そういう形でも構いません。ありがとうございます。'], introverted:['…ありがとうございます。受け取ります。'],
          carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'],
          emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…ありがとうございます。'],
        },
      },
    },
    DEMAND_MONEY: {
      A: {
        normal: {
          bold:['助かります。みんなにも、ちゃんと伝えます。'], introverted:['…ありがとうございます。みんな、喜びます。'],
          carefree:['えっ、ホントに上げてくれるんですか? やった〜! みんなに自慢しちゃう。'], earnest:['…社長、本当にありがとうございます。応えなければ、と気が引き締まります。'],
          emotional:['ありがとうございます。社長…これ、忘れません。'], shy:['…あの…ありがとう、ございます。みんなに、伝えます。'],
        },
        composed: {
          bold:['社長、ありがとうございます。気持ちが引き締まります。'], introverted:['…ありがとうございます。みんな、安心します。'],
          carefree:['ありがとうございます〜。これでみんなも一息つけますね。'], earnest:['社長、本当にありがとうございます。みんなを代表して、お礼を申し上げます。'],
          emotional:['社長…この決断、忘れません。ありがとうございます。'], shy:['…ありがとうございます。…みんなに、伝えますね。'],
        },
        ojousama: {
          bold:['まあ社長、ありがとうございますわ。みんなに伝えますわね。'], introverted:['…ありがとうございますわ。…みんな、喜びますわ。'],
          carefree:['まあ嬉しい! 社長ありがとうございますわ〜。'], earnest:['社長、誠にありがとうございますわ。皆を代表してお礼申し上げますわ。'],
          emotional:['社長…なんと申し上げてよいやら。ありがとうございますわ。'], shy:['…ありがとうございますわ。…胸に、しまっておきますわ。'],
        },
        polite: {
          bold:['社長、ありがとうございます。お言葉以上の働きでお返しします。'], introverted:['…ありがとうございます。皆にも、ちゃんと伝えさせていただきます。'],
          carefree:['わ、社長ありがとうございます〜! みんな喜びます!'], earnest:['社長、本当にありがとうございます。皆を代表してお礼申し上げます。'],
          emotional:['社長、ありがとうございます…この恩、必ずお返しします。'], shy:['…あの、ありがとう、ございます。…みんなに、伝えます。'],
        },
        seductive: {
          bold:['ありがとう社長、嬉しい。みんなにも伝えるね。'], introverted:['…ありがとうございます。…嬉しい、です。'],
          carefree:['えっホントに〜? 社長ありがとう! みんなに自慢しちゃう。'], earnest:['社長、ありがとうございます。きちんと結果でお返しします。'],
          emotional:['社長…ありがとう。この嬉しさ、忘れない。'], shy:['…ありがとうございます。…みんなに、伝えますね。'],
        },
        delinquent: {
          bold:['マジっすか、社長ありがとうございます! みんな喜びますよ。'], introverted:['…ありがとうございます。…助かります。'],
          carefree:['マジで上げてくれんすか?! 社長太っ腹〜! みんなにも言っときます!'], earnest:['社長、ありがとうございます。あたしら、ちゃんとやります。'],
          emotional:['社長…ありがとうございます。この恩、忘れないっすから。'], shy:['…っす…ありがとうございます。…みんなに、伝えます。'],
        },
        cool: {
          bold:['ありがとうございます。みんなにも伝えます。'], introverted:['…ありがとうございます。'],
          carefree:['ありがとうございます。みんな喜びます。'], earnest:['社長、ありがとうございます。応えていきます。'],
          emotional:['社長、ありがとうございます。…忘れません。'], shy:['…ありがとうございます。'],
        },
      },
      B: {
        normal: {
          bold:['…そうですか。次の機会に、また話します。'], introverted:['…はい、わかりました。'],
          carefree:['えぇ〜、まあ仕方ないですよね〜。次に期待してます〜。'], earnest:['…承知しました。図々しいお願いだったかもしれません、すみませんでした。'],
          emotional:['…そうですか。…わかりました。'], shy:['…はい…そう、ですよね。'],
        },
        composed: {
          bold:['…承知しました。次の機会に、また話します。'], introverted:['…はい、わかりました。出直します。'],
          carefree:['まあ、こういうご時世ですからね〜。承知しました。'], earnest:['…承知しました。お時間を取らせてしまい、すみませんでした。'],
          emotional:['…そうですか。…次に、また。'], shy:['…はい…承知しました。'],
        },
        ojousama: {
          bold:['…そうですの。承知いたしましたわ。'], introverted:['…そうですわ。…承知いたしました。'],
          carefree:['あら、そうですの。まあ仕方ありませんわ〜。'], earnest:['…承知いたしましたわ。お聞き苦しいことを申しました。'],
          emotional:['…そうですの。…承知いたしましたわ。'], shy:['…はい…承知いたしましたわ。'],
        },
        polite: {
          bold:['…承知しました。失礼いたしました。'], introverted:['…はい、承知いたしました。'],
          carefree:['えぇ〜、そうですか〜。承知しました。'], earnest:['…承知しました。図々しいお願いをしてしまい、申し訳ありません。'],
          emotional:['…そう、ですか。…承知いたしました。'], shy:['…はい…承知しました。失礼いたしました。'],
        },
        seductive: {
          bold:['…そう。わかった、また話そうね。'], introverted:['…はい、わかりました。'],
          carefree:['えぇ〜、つれない〜。まあ次に期待してます。'], earnest:['…承知しました。お金の話、出してすみません。'],
          emotional:['…そう、ですか。…ちょっと、寂しいけど。'], shy:['…はい…わかりました。'],
        },
        delinquent: {
          bold:['…っす。わかりました。'], introverted:['…っす。わかりました。'],
          carefree:['えぇ〜、ケチっすね〜。まあ次に期待してますんで〜。'], earnest:['…っす、承知しました。すんません、図々しかったっす。'],
          emotional:['…っ、そうっすか。…まあ、わかりました。'], shy:['…っす…そうっすよね。'],
        },
        cool: {
          bold:['…承知。次に回します。'], introverted:['…はい、わかりました。'],
          carefree:['わかりました。仕方ないですね。'], earnest:['…承知しました。失礼しました。'],
          emotional:['…そうですか。…わかりました。'], shy:['…はい…わかりました。'],
        },
      },
      C: {
        normal: {
          bold:['…ご配慮、ありがとうございます。お金の話、しちゃってすみません。'], introverted:['…ありがとうございます。…そっちで気にかけてくださって、嬉しいです。'],
          carefree:['あれ、お金の話そらされた? でもまあ、ありがとうございます〜。'], earnest:['…ありがとうございます。お金じゃない部分で、気にかけていただけるなんて。'],
          emotional:['…社長…そういう形ですか。…わかりました、ありがたいです。'], shy:['…あの、ありがとう…ございます。'],
        },
        composed: {
          bold:['…なるほど、そういうご配慮ですか。ありがたく頂戴します。'], introverted:['…ありがとうございます。…そっちで考えてくださったんですね。'],
          carefree:['ふむ、お金じゃないんですね〜。まあ、ありがたいですよ。'], earnest:['…社長、ご配慮ありがとうございます。気持ち、しっかり受け取ります。'],
          emotional:['…社長…そういう形ですか。…ありがたいです。'], shy:['…ありがとうございます。…嬉しいです。'],
        },
        ojousama: {
          bold:['…まあ、そういうお心遣いですのね。ありがたく頂戴いたしますわ。'], introverted:['…ありがとうございますわ。…お気持ち、嬉しゅうございます。'],
          carefree:['あら、お金じゃない形ですの? まあ、それも素敵ですわね。'], earnest:['…社長、ご配慮痛み入りますわ。'],
          emotional:['…社長、そのお心遣い…ありがたく、頂戴いたしますわ。'], shy:['…ありがとうございますわ。…嬉しゅう、ございます。'],
        },
        polite: {
          bold:['…なるほど、そういう形ですか。ありがたく頂戴します。'], introverted:['…ありがとうございます。…お気持ち、嬉しいです。'],
          carefree:['ふぅん、別の形ですか〜。ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。お金以外で気にかけていただけるなんて、ありがたいです。'],
          emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…あの、ありがとうございます。…嬉しいです。'],
        },
        seductive: {
          bold:['…ふぅん、お金じゃないんだ。まあ、それも嬉しいよ。'], introverted:['…ありがとうございます。…そっちで気にかけてくれるんですね。'],
          carefree:['あら、お金の話そらされた〜。でもまあ、ありがと社長。'], earnest:['…ご配慮、ありがとうございます。お気持ち、受け取ります。'],
          emotional:['…社長…そういう形ですか。…嬉しいです。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        delinquent: {
          bold:['…っす。お金じゃないけど、まあありがたいっす。'], introverted:['…っす。ありがとうございます。'],
          carefree:['へぇ、お金じゃないんすか〜。まあ気持ちは嬉しいっす〜。'], earnest:['…社長、ご配慮どうもっす。気持ちは受け取りました。'],
          emotional:['…っ、そうっすか。…まあ、ありがたいっす。'], shy:['…っす、ありがとうございます。'],
        },
        cool: {
          bold:['…承知。お気持ちは受け取ります。'], introverted:['…ありがとうございます。'],
          carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'],
          emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…ありがとうございます。'],
        },
      },
    },
    DEMAND_ABSTRACT: {
      A: {
        normal: {
          bold:['…ありがとうございます。その言葉だけで、十分です。'], introverted:['…ありがとうございます。…見てもらえてるんだ、って、安心しました。'],
          carefree:['わ、ちゃんと聞いてくれてた! 嬉しいです、ありがとうございます〜。'], earnest:['ありがとうございます。私たちも、もっと社長に応えたいと思います。'],
          emotional:['ありがとうございます…社長、その一言、ずっと欲しかったです。'], shy:['…あの…ありがとうございます。…うれしい、です。'],
        },
        composed: {
          bold:['社長、ありがとうございます。その言葉、胸に留めます。'], introverted:['…ありがとうございます。…見ていてくださったんですね、安心しました。'],
          carefree:['ありがとうございます〜。社長にそう言ってもらえると、肩の力が抜けます。'], earnest:['ありがとうございます。お言葉、しっかり受け取ります。'],
          emotional:['社長…その一言で、随分と救われます。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        ojousama: {
          bold:['まあ社長、ありがとうございますわ。その一言で十分ですの。'], introverted:['…ありがとうございますわ。…胸が、温こうなりますの。'],
          carefree:['まあ嬉しい、社長ありがとうございますわ〜。'], earnest:['社長、誠にありがとうございますわ。お言葉、大切にいたします。'],
          emotional:['社長…そのお言葉、わたくし生涯忘れませんわ。'], shy:['…ありがとうございますわ。…嬉しゅう、ございます。'],
        },
        polite: {
          bold:['社長、ありがとうございます。お言葉、何より励みになります。'], introverted:['…ありがとうございます。…見ていただけていたんですね。'],
          carefree:['わ、ありがとうございます〜! 社長にそう言ってもらえると本当に嬉しいです。'], earnest:['社長、本当にありがとうございます。お言葉、大切にいたします。'],
          emotional:['社長、ありがとうございます…そのお言葉、ずっと欲しかったんです。'], shy:['…あの、ありがとうございます。…嬉しい、です。'],
        },
        seductive: {
          bold:['ありがとう社長、嬉しい。ちゃんと届いてたんだね。'], introverted:['…ありがとうございます。…見てくれてたんですね、嬉しい。'],
          carefree:['わ、社長ちゃんと聞いてくれてた! ありがとうございます〜。'], earnest:['社長、ありがとうございます。お言葉、ちゃんと持って帰ります。'],
          emotional:['社長…その一言、ずっと欲しかったの。ありがとう。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        delinquent: {
          bold:['ありがとうございます社長。その一言で十分っすよ。'], introverted:['…ありがとうございます。…見ててくれたんすね。'],
          carefree:['マジっすか、社長ありがとう〜! 嬉しいっすね。'], earnest:['社長、ありがとうございます。あたしら、ちゃんと応えます。'],
          emotional:['社長…その一言、ずっと欲しかったっす。ありがとうございます。'], shy:['…っす…ありがとうございます。…嬉しい、っす。'],
        },
        cool: {
          bold:['ありがとうございます。その言葉、胸に留めます。'], introverted:['…ありがとうございます。…見ていてくれたんですね。'],
          carefree:['ありがとうございます。嬉しいです。'], earnest:['社長、ありがとうございます。お言葉、忘れません。'],
          emotional:['社長、ありがとうございます。…胸に、染みます。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
      },
      B: {
        normal: {
          bold:['…そうですか。失礼しました。'], introverted:['…はい、すみません。出過ぎたことを言いました。'],
          carefree:['あ、はーい。…まあ、社長忙しいですもんね。'], earnest:['…承知しました。お時間を取らせて、申し訳ありません。'],
          emotional:['…そう、ですか。…わかりました。'], shy:['…はい…ごめんなさい。'],
        },
        composed: {
          bold:['…承知しました。出過ぎたことを申しました。'], introverted:['…はい、すみません。出直します。'],
          carefree:['まあ、こういうこともありますね。失礼しました〜。'], earnest:['…承知しました。お時間を取らせて、申し訳ありません。'],
          emotional:['…そう、ですか。…わかりました。'], shy:['…はい…失礼しました。'],
        },
        ojousama: {
          bold:['…そうですの。失礼いたしましたわ。'], introverted:['…そうですわ。…失礼いたしましたわ。'],
          carefree:['あら、そうですの。お時間取らせてしまいましたわね〜。'], earnest:['…承知いたしましたわ。お聞き苦しいことを申しました。'],
          emotional:['…そうですの。…承知いたしましたわ。'], shy:['…はい…ごめんなさいませ。'],
        },
        polite: {
          bold:['…承知しました。失礼いたしました。'], introverted:['…はい、申し訳ありません。出直します。'],
          carefree:['えぇ〜、そうですか〜。失礼しました〜。'], earnest:['…承知しました。お時間を取らせて、申し訳ありません。'],
          emotional:['…そう、ですか。…承知いたしました。'], shy:['…はい…ごめんなさい。'],
        },
        seductive: {
          bold:['…そう。じゃあ、忘れて。'], introverted:['…はい、わかりました。'],
          carefree:['えぇ〜、つれない。まあいいですけど〜。'], earnest:['…承知しました。出過ぎた口きいて、すみません。'],
          emotional:['…そう、ですか。…ちょっと、寂しい。'], shy:['…はい…ごめんなさい。'],
        },
        delinquent: {
          bold:['…っす。失礼しました。'], introverted:['…っす。すんません。'],
          carefree:['あ、はい〜。まあ社長忙しいっすもんね。'], earnest:['…っす、承知しました。すんません、出過ぎました。'],
          emotional:['…っ、そうっすか。…わかりました。'], shy:['…っす…ごめんなさい。'],
        },
        cool: {
          bold:['…承知。失礼しました。'], introverted:['…はい、わかりました。'],
          carefree:['わかりました。失礼しました。'], earnest:['…承知しました。失礼しました。'],
          emotional:['…そうですか。…わかりました。'], shy:['…はい…ごめんなさい。'],
        },
      },
      C: {
        normal: {
          bold:['…そういう形ですか。心遣い、ありがたく受け取ります。'], introverted:['…ありがとうございます。…そっちでしたか。'],
          carefree:['ふぅん、別ルートですか〜。まあ、ありがたいですけど。'], earnest:['…ありがとうございます。私が言いたかったのは、まさにそういうことかもしれません。'],
          emotional:['…ああ、社長…そういう答え方、ですか。…ありがとうございます。'], shy:['…はい…ありがとう、ございます。'],
        },
        composed: {
          bold:['…なるほど、そういう形ですか。ありがたく受け取ります。'], introverted:['…ありがとうございます。…そっちで考えてくださったんですね。'],
          carefree:['ふむ、別ルートですか〜。それもまた、ありがたいです。'], earnest:['…社長、ご配慮ありがとうございます。お気持ち、しっかり受け取ります。'],
          emotional:['…社長…そういう形でしたか。…ありがたいです。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        ojousama: {
          bold:['…まあ、そういうお心遣いですのね。ありがたく頂戴いたしますわ。'], introverted:['…ありがとうございますわ。…お気持ち、嬉しゅうございます。'],
          carefree:['あら、別の形ですの? まあ、ありがたいですわ〜。'], earnest:['…社長、ご配慮痛み入りますわ。'],
          emotional:['…社長、そのお心遣い…胸に染みますわ。'], shy:['…ありがとうございますわ。…嬉しゅう、ございます。'],
        },
        polite: {
          bold:['…なるほど、そういう形ですか。ありがたく承ります。'], introverted:['…ありがとうございます。…そっちで気にかけてくださったんですね。'],
          carefree:['ふぅん、別の形ですか〜。ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。お気持ち、しっかり受け取ります。'],
          emotional:['…社長、そういう答え方、ですか。…ありがとうございます。'], shy:['…あの、ありがとうございます。…嬉しいです。'],
        },
        seductive: {
          bold:['…そう、別ルートね。それも嬉しい、ありがとう。'], introverted:['…ありがとうございます。…そっちで気にかけてくれるんですね。'],
          carefree:['あら、別の形? まあ、ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。お気持ち、受け取ります。'],
          emotional:['…社長…そういう形ですか。…嬉しい、です。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        delinquent: {
          bold:['…っす、そういう形なら、ありがたく頂戴します。'], introverted:['…っす。ありがとうございます。'],
          carefree:['へぇ、別ルートっすか〜。まあ気持ちは受け取ります〜。'], earnest:['…社長、配慮ありがとうございます。気持ちは受け取りました。'],
          emotional:['…っ、そういう形っすか。…ありがたいっす。'], shy:['…っす、ありがとうございます。'],
        },
        cool: {
          bold:['…承知。そういう形でも構いません。ありがとうございます。'], introverted:['…ありがとうございます。受け取ります。'],
          carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'],
          emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…ありがとうございます。'],
        },
      },
    },
    DEMAND_RECOGNITION: {
      A: {
        normal: {
          bold:['…ありがとうございます。励みになります。'], introverted:['…ありがとうございます。…見てもらえてたんですね。'],
          carefree:['ホント!? やった、社長に褒められちゃった〜!'], earnest:['本当にありがとうございます。これからも、見ていてください。'],
          emotional:['ありがとうございます…社長、その言葉、染みます。'], shy:['…あの…ありがとうございます。…がんばります。'],
        },
        composed: {
          bold:['ありがとうございます。その言葉、励みにします。'], introverted:['…ありがとうございます。…見ていてくださったんですね。'],
          carefree:['ありがとうございます〜。社長にそう言ってもらえると、嬉しいです。'], earnest:['ありがとうございます。お言葉、しっかり受け取ります。'],
          emotional:['社長…その一言で、随分と救われます。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        ojousama: {
          bold:['まあ社長、ありがとうございますわ。励みになりますの。'], introverted:['…ありがとうございますわ。…見ていてくださったのですね。'],
          carefree:['まあ嬉しい、社長に褒められちゃいましたわ〜!'], earnest:['社長、誠にありがとうございますわ。お言葉、大切にいたします。'],
          emotional:['社長…そのお言葉、わたくし忘れませんわ。'], shy:['…ありがとうございますわ。…嬉しゅう、ございます。'],
        },
        polite: {
          bold:['社長、ありがとうございます。お言葉、何よりの励みになります。'], introverted:['…ありがとうございます。…見ていただけていたんですね。'],
          carefree:['わ、ありがとうございます〜! 社長に褒めてもらえるなんて!'], earnest:['社長、本当にありがとうございます。お言葉、大切にいたします。'],
          emotional:['社長、ありがとうございます…そのお言葉、ずっと欲しかったんです。'], shy:['…あの、ありがとうございます。…がんばります。'],
        },
        seductive: {
          bold:['ありがとう社長、嬉しい。ちゃんと見ててくれたんだね。'], introverted:['…ありがとうございます。…見ていてくれたんですね。'],
          carefree:['わ、社長に褒められちゃった〜! 嬉しいです。'], earnest:['社長、ありがとうございます。お言葉、ちゃんと持って帰ります。'],
          emotional:['社長…その一言、ずっと欲しかったの。ありがとう。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        delinquent: {
          bold:['社長、ありがとうございます。励みになりますよ。'], introverted:['…ありがとうございます。…見ててくれたんすね。'],
          carefree:['マジっすか〜、社長に褒められちゃった〜! ありがとうございます。'], earnest:['社長、ありがとうございます。あたしら、もっとやりますんで。'],
          emotional:['社長…その一言、ずっと欲しかったっす。ありがとうございます。'], shy:['…っす…ありがとうございます。…がんばります。'],
        },
        cool: {
          bold:['ありがとうございます。励みにします。'], introverted:['…ありがとうございます。…見ていてくれたんですね。'],
          carefree:['ありがとうございます。嬉しいです。'], earnest:['社長、ありがとうございます。お言葉、受け取ります。'],
          emotional:['社長、ありがとうございます。…胸に、染みます。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
      },
      B: {
        normal: {
          bold:['…そうですか。失礼しました。'], introverted:['…はい、わかりました。'],
          carefree:['えぇ〜、つれないなぁ〜。まあいいですけど。'], earnest:['…承知しました。図々しいことを申しました。'],
          emotional:['…そう、ですか。…わかりました。'], shy:['…はい…ごめんなさい。'],
        },
        composed: {
          bold:['…承知しました。出過ぎたことを申しました。'], introverted:['…はい、わかりました。出直します。'],
          carefree:['まあ、こういうこともありますね〜。'], earnest:['…承知しました。お時間を取らせて、申し訳ありません。'],
          emotional:['…そう、ですか。…わかりました。'], shy:['…はい…失礼しました。'],
        },
        ojousama: {
          bold:['…そうですの。失礼いたしましたわ。'], introverted:['…そうですわ。…失礼いたしましたわ。'],
          carefree:['あら、つれないですこと。まあいいですわ〜。'], earnest:['…承知いたしましたわ。お聞き苦しいことを申しました。'],
          emotional:['…そうですの。…承知いたしましたわ。'], shy:['…はい…ごめんなさいませ。'],
        },
        polite: {
          bold:['…承知しました。失礼いたしました。'], introverted:['…はい、申し訳ありません。'],
          carefree:['えぇ〜、そうですか〜。失礼しました〜。'], earnest:['…承知しました。図々しいお願いをしてしまい、申し訳ありません。'],
          emotional:['…そう、ですか。…承知いたしました。'], shy:['…はい…ごめんなさい。'],
        },
        seductive: {
          bold:['…そう。じゃあ忘れて。'], introverted:['…はい、わかりました。'],
          carefree:['えぇ〜、つれない〜。まあいいですけど〜。'], earnest:['…承知しました。出過ぎたこと言いました。'],
          emotional:['…そう、ですか。…ちょっと、寂しい。'], shy:['…はい…ごめんなさい。'],
        },
        delinquent: {
          bold:['…っす。失礼しました。'], introverted:['…っす。すんません。'],
          carefree:['えぇ〜、つれないっすね〜。まあいいっすけど〜。'], earnest:['…っす、承知しました。すんません、出過ぎました。'],
          emotional:['…っ、そうっすか。…わかりました。'], shy:['…っす…ごめんなさい。'],
        },
        cool: {
          bold:['…承知。失礼しました。'], introverted:['…はい、わかりました。'],
          carefree:['わかりました。失礼しました。'], earnest:['…承知しました。失礼しました。'],
          emotional:['…そうですか。…わかりました。'], shy:['…はい…ごめんなさい。'],
        },
      },
      C: {
        normal: {
          bold:['…ご配慮ありがとうございます。'], introverted:['…ありがとうございます。…そっちで返してくださるんですね。'],
          carefree:['なるほど〜、評価は別の形でってことですね。了解です〜。'], earnest:['…ありがとうございます。形は違っても、気にかけていただけるのは嬉しいです。'],
          emotional:['…社長…そういう答え方、好きです。ありがとうございます。'], shy:['…はい…ありがとうございます。'],
        },
        composed: {
          bold:['…なるほど、そういう形ですか。ありがたく受け取ります。'], introverted:['…ありがとうございます。…そっちで考えてくださったんですね。'],
          carefree:['ふむ、別ルートですか〜。それもまた、ありがたいです。'], earnest:['…社長、ご配慮ありがとうございます。お気持ち、しっかり受け取ります。'],
          emotional:['…社長…そういう形でしたか。…ありがたいです。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        ojousama: {
          bold:['…まあ、そういうお心遣いですのね。ありがたく頂戴いたしますわ。'], introverted:['…ありがとうございますわ。…お気持ち、嬉しゅうございます。'],
          carefree:['あら、別の形ですの? まあ、ありがたいですわ〜。'], earnest:['…社長、ご配慮痛み入りますわ。'],
          emotional:['…社長、そのお心遣い…胸に染みますわ。'], shy:['…ありがとうございますわ。…嬉しゅう、ございます。'],
        },
        polite: {
          bold:['…なるほど、そういう形ですか。ありがたく承ります。'], introverted:['…ありがとうございます。…そっちで気にかけてくださったんですね。'],
          carefree:['ふぅん、別の形ですか〜。ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。形は違っても、お気持ちは伝わりました。'],
          emotional:['…社長、そういう答え方、ですか。…ありがとうございます。'], shy:['…あの、ありがとうございます。…嬉しいです。'],
        },
        seductive: {
          bold:['…そう、別の形ね。それも嬉しい、ありがとう。'], introverted:['…ありがとうございます。…そっちで気にかけてくれるんですね。'],
          carefree:['あら、別ルート? まあ、ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。お気持ち、受け取ります。'],
          emotional:['…社長…そういう答え方、好き。ありがとう。'], shy:['…ありがとうございます。…嬉しい、です。'],
        },
        delinquent: {
          bold:['…っす、そういう形なら、ありがたく頂戴します。'], introverted:['…っす。ありがとうございます。'],
          carefree:['へぇ、別ルートっすか〜。まあ気持ちは受け取ります〜。'], earnest:['…社長、配慮ありがとうございます。気持ちは受け取りました。'],
          emotional:['…っ、そういう形っすか。…ありがたいっす。'], shy:['…っす、ありがとうございます。'],
        },
        cool: {
          bold:['…承知。そういう形でも構いません。ありがとうございます。'], introverted:['…ありがとうございます。受け取ります。'],
          carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'],
          emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…ありがとうございます。'],
        },
      },
    },
    OBSERVE_RIVAL_HEAT: {
      A: {
        normal: { bold:['…わかりました。気をつけます。'], introverted:['…はい、すみません。'], carefree:['あー、はい、注意します〜。'], earnest:['…申し訳ありません。改めます。'], emotional:['…そうですね、悪かったです。'], shy:['…はい…ごめんなさい。'] },
        composed: { bold:['…承知しました。態度、改めます。'], introverted:['…はい、…気をつけます。'], carefree:['あらら、見られてましたか〜。気をつけますね。'], earnest:['…申し訳ありません。私の管理不行き届きでした。'], emotional:['…そうですか。…私が、抑えきれていませんでした。'], shy:['…はい…申し訳ない、です。'] },
        ojousama: { bold:['…そうですの。気をつけますわ。'], introverted:['…はい、…失礼いたしましたわ。'], carefree:['あら、見られてましたの? 失礼いたしましたわ〜。'], earnest:['…申し訳ありませんわ。心がけを改めます。'], emotional:['…そうですの。…わたくしが、至りませんでしたわ。'], shy:['…はい…ごめんなさいませ。'] },
        polite: { bold:['…承知しました。改めます。'], introverted:['…はい、申し訳ありません。'], carefree:['あ、はい〜。気をつけさせていただきます。'], earnest:['…申し訳ありません。私の振る舞いが至りませんでした。'], emotional:['…そう、ですか。…申し訳ありません。'], shy:['…はい…ごめんなさい。'] },
        seductive: { bold:['…そう。気をつけるね。'], introverted:['…はい、わかりました。'], carefree:['あら、バレてた? 気をつけますね〜。'], earnest:['…ごめんなさい。わかりやすかったかな。'], emotional:['…そう、ですか。…私、出ちゃってましたね。'], shy:['…はい…ごめんなさい。'] },
        delinquent: { bold:['…っす、わかりました。気をつけます。'], introverted:['…っす。すんません。'], carefree:['あー、はい〜、気をつけまーす。'], earnest:['…っす、すんません、態度悪かったっす。'], emotional:['…っ、わかりました。…抑えます。'], shy:['…っす…ごめんなさい。'] },
        cool: { bold:['…承知。気をつけます。'], introverted:['…はい、わかりました。'], carefree:['わかりました。気をつけます。'], earnest:['…申し訳ありません。改めます。'], emotional:['…そうですか。…悪かったです。'], shy:['…はい…ごめんなさい。'] },
      },
      B: {
        normal: { bold:['（黙ったまま、視線をそらした）'], introverted:['（…何も言わず、目を伏せた）'], carefree:['（へらっと笑って、話を流した）'], earnest:['（唇を結んだまま、頷くだけだった）'], emotional:['（…目元に力が入ったが、言葉は出てこなかった）'], shy:['（…俯いて、何も言わなかった）'] },
        composed: { bold:['（小さく頷いて、それ以上は語らなかった）'], introverted:['（黙って、視線を落とした）'], carefree:['（曖昧に微笑んで、話題を逃がした）'], earnest:['（唇を結び、わずかに頭を下げた）'], emotional:['（…一度息を吸って、結局何も言わなかった）'], shy:['（…俯いて、肩を縮めた）'] },
        ojousama: { bold:['（扇を畳むように、口を閉ざしましたわ）'], introverted:['（…そっと目を伏せましたわ）'], carefree:['（あら、と微笑んで、お話を流しましたわ）'], earnest:['（…静かに会釈なさいましたわ）'], emotional:['（…目元が揺れましたが、お言葉は出ませんでしたわ）'], shy:['（…俯いて、お黙りになりましたわ）'] },
        polite: { bold:['（…言葉を選ぶように、口を閉ざした）'], introverted:['（…静かに目を伏せた）'], carefree:['（曖昧に笑って、お辞儀した）'], earnest:['（唇を結び、深く頷いた）'], emotional:['（…言葉を呑み込んだ）'], shy:['（…俯いて、口を閉ざした）'] },
        seductive: { bold:['（小さく息を吐いて、視線を逸らした）'], introverted:['（…黙って、髪に触れた）'], carefree:['（含み笑いで、何も言わなかった）'], earnest:['（…静かに目を伏せた）'], emotional:['（…睫毛が震えたが、口は開かなかった）'], shy:['（…俯いて、何も言わなかった）'] },
        delinquent: { bold:['（チッ、と舌打ちして、目を逸らした）'], introverted:['（…黙ったまま、何も言わなかった）'], carefree:['（へらっと笑って、誤魔化した）'], earnest:['（…口を結んで、頷くだけだった）'], emotional:['（…拳を握ったが、言葉は出なかった）'], shy:['（…俯いて、肩を縮めた）'] },
        cool: { bold:['（黙ったまま、視線を逸らした）'], introverted:['（…何も言わず、目を伏せた）'], carefree:['（曖昧に頷いて、話を流した）'], earnest:['（…静かに頭を下げた）'], emotional:['（…目元が揺れたが、口は開かなかった）'], shy:['（…俯いた）'] },
      },
      C: {
        normal: { bold:['…ご配慮、ありがとうございます。'], introverted:['…はい、ありがとうございます。'], carefree:['そっち経由ですか〜。了解です。'], earnest:['…ありがとうございます。気をつけます。'], emotional:['…そうですね。すみません。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…ご配慮、ありがたく頂戴します。'], introverted:['…ありがとうございます。…そっちで動いてくださったんですね。'], carefree:['ふむ、別ルートで動いてくれるんですね〜。ありがたいです。'], earnest:['…ありがとうございます。私の至らなさを、社長に拾っていただいて。'], emotional:['…社長…そういう形ですか。…ありがたいです。'], shy:['…ありがとうございます。…嬉しい、です。'] },
        ojousama: { bold:['…まあ、ご配慮ありがたく頂戴いたしますわ。'], introverted:['…ありがとうございますわ。…お気遣い、痛み入りますわ。'], carefree:['あら、別の手立てですの? ありがたいですわ〜。'], earnest:['…社長、ご配慮痛み入りますわ。'], emotional:['…社長、そのお心遣い…胸に染みますわ。'], shy:['…ありがとうございますわ。…嬉しゅう、ございます。'] },
        polite: { bold:['…ご配慮、ありがたく承ります。'], introverted:['…ありがとうございます。…お心遣い、嬉しいです。'], carefree:['ふぅん、別ルートですか〜。ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。お気持ち、しっかり受け取ります。'], emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…あの、ありがとうございます。…嬉しいです。'] },
        seductive: { bold:['…そう、別ルートね。ありがとう。'], introverted:['…ありがとうございます。…そっちで動いてくれるんですね。'], carefree:['あら、別の形? まあ、ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。お気持ち、受け取ります。'], emotional:['…社長…そういう形ですか。…嬉しい、です。'], shy:['…ありがとうございます。…嬉しい、です。'] },
        delinquent: { bold:['…っす、配慮ありがとうございます。'], introverted:['…っす。ありがとうございます。'], carefree:['へぇ、別ルートっすか〜。まあ気持ちは受け取ります〜。'], earnest:['…社長、配慮ありがとうございます。気持ちは受け取りました。'], emotional:['…っ、そうっすか。…ありがたいっす。'], shy:['…っす、ありがとうございます。'] },
        cool: { bold:['…承知。ありがとうございます。'], introverted:['…ありがとうございます。'], carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'], emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…ありがとうございます。'] },
      },
    },
    OBSERVE_ABSENCE: {
      A: {
        normal: { bold:['…ご迷惑おかけしました。明日から、ちゃんと出ます。'], introverted:['…申し訳ありません。…出ます、ちゃんと。'], carefree:['あ、ばれてました? すみませ〜ん、明日から出ますって。'], earnest:['…申し訳ありません。立場のある身で、お恥ずかしい限りです。'], emotional:['…社長、すみません。…言い訳できないです。'], shy:['…ごめんなさい…明日から、出ます。'] },
        composed: { bold:['…ご迷惑をおかけしました。明日から、しっかり出ます。'], introverted:['…申し訳ありません。…出直します。'], carefree:['あらら、見られてましたか。明日から、ちゃんとしますね。'], earnest:['…申し訳ありません。立場をわきまえず、恥ずかしい限りです。'], emotional:['…社長、申し訳ありません。…次こそ、ちゃんと出ます。'], shy:['…ごめんなさい…明日から、ちゃんと、出ます。'] },
        ojousama: { bold:['…ご迷惑おかけしましたわ。明日から、ちゃんと出ますわ。'], introverted:['…申し訳ありませんわ。…出直しますわ。'], carefree:['あら、ばれてましたの? 明日から出ますわ〜。'], earnest:['…申し訳ありませんわ。お恥ずかしい限りですの。'], emotional:['…社長、申し訳ありません。…言い訳もありませんわ。'], shy:['…ごめんなさいませ…明日から、出ますわ。'] },
        polite: { bold:['…ご迷惑おかけしました。明日からきちんと出させていただきます。'], introverted:['…申し訳ありません。…明日から、ちゃんと出ます。'], carefree:['あ、ばれてました〜? すみません、明日から出ます〜。'], earnest:['…申し訳ありません。立場ある身で、本当にお恥ずかしいです。'], emotional:['…社長、申し訳ありません。…本当に、言い訳できないです。'], shy:['…ごめんなさい…明日から、ちゃんと、出ます。'] },
        seductive: { bold:['…ごめん、社長。明日から、ちゃんと出るね。'], introverted:['…ごめんなさい。…明日から、出ます。'], carefree:['あら、ばれちゃった? 明日から出るね〜。'], earnest:['…申し訳ありません。立場ある身で、本当に恥ずかしい。'], emotional:['…社長…ごめんなさい。…言い訳、しないから。'], shy:['…ごめんなさい…明日から、ちゃんと、出ます。'] },
        delinquent: { bold:['…っす、すんません。明日からちゃんと出ます。'], introverted:['…っす。すんません。明日から、出ます。'], carefree:['あ〜ばれてました? すんませ〜ん、明日から出まっす。'], earnest:['…っす、すんません。立場あるのに、恥ずかしいっす。'], emotional:['…社長、すんません。…言い訳できないっす。'], shy:['…っす…ごめんなさい。明日から、出ます。'] },
        cool: { bold:['…申し訳ない。明日から、出ます。'], introverted:['…申し訳ありません。…出ます。'], carefree:['ばれてましたか。明日から出ます。'], earnest:['…申し訳ありません。立場をわきまえます。'], emotional:['…社長、すみません。…言葉も、ないです。'], shy:['…ごめんなさい…明日から、出ます。'] },
      },
      B: {
        normal: { bold:['…ありがとうございます。'], introverted:['…ありがとうございます。…気を遣っていただいて。'], carefree:['お、見逃してくれるんですか〜? 助かります〜。'], earnest:['…ありがとうございます。お見逃しいただいたぶん、行動で返します。'], emotional:['…ありがとうございます…社長、優しい。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…ありがとうございます。次は、しっかりやります。'], introverted:['…ありがとうございます。…お気遣い、痛み入ります。'], carefree:['助かります〜、社長ありがとうございます。'], earnest:['…ありがとうございます。お見逃しいただいた分、必ず返します。'], emotional:['…社長…ありがとうございます。'], shy:['…ありがとうございます。…ほっ、としました。'] },
        ojousama: { bold:['…ありがとうございますわ。次はちゃんといたしますわ。'], introverted:['…ありがとうございますわ。…お気遣い痛み入りますわ。'], carefree:['まあ、見逃してくださるの? 助かりますわ〜。'], earnest:['…ありがとうございますわ。お見逃しのぶん、お返しいたしますわ。'], emotional:['…社長…ありがとうございますわ、お優しい。'], shy:['…ありがとうございますわ。…ほっ、といたしましたわ。'] },
        polite: { bold:['…ありがとうございます。お見逃しいただいた分、しっかり返します。'], introverted:['…ありがとうございます。…お気遣い、ありがたいです。'], carefree:['わ、助かります〜、社長ありがとうございます。'], earnest:['…ありがとうございます。本当に、お見逃しに甘えないようにします。'], emotional:['…社長…ありがとうございます。お優しいです。'], shy:['…はい…ありがとうございます。…嬉しい、です。'] },
        seductive: { bold:['…ありがとう、社長。お返しは、ちゃんとするから。'], introverted:['…ありがとうございます。…優しい。'], carefree:['お〜、見逃してくれるの? 社長優しい〜。'], earnest:['…社長、ありがとうございます。次はちゃんとします。'], emotional:['…社長…ありがとう、本当に優しい。'], shy:['…ありがとうございます。…嬉しい、です。'] },
        delinquent: { bold:['…っす、ありがとうございます。'], introverted:['…っす。ありがとうございます。'], carefree:['マジっすか〜、社長太っ腹! 助かります〜。'], earnest:['…社長、ありがとうございます。お見逃し分、ちゃんと返します。'], emotional:['…社長、ありがとうございます。…マジで優しい。'], shy:['…っす…ありがとうございます。'] },
        cool: { bold:['…ありがとうございます。'], introverted:['…ありがとうございます。'], carefree:['ありがとうございます。助かります。'], earnest:['…ありがとうございます。お気遣いに、応えます。'], emotional:['…社長、ありがとうございます。'], shy:['…ありがとうございます。'] },
      },
      C: {
        normal: { bold:['…そっちですか。…私たちのメンバーをちゃんと見てくれて、感謝します。'], introverted:['…ありがとうございます。…私の代わりに、みんなを見てくださって。'], carefree:['ふぅん、メンバーケア優先ですか〜。まあ、それでいいです。'], earnest:['…ありがとうございます。私の不在の分、メンバーが寂しい思いをしないように。'], emotional:['…社長…私の穴、埋めてくれるんですか。…申し訳ないです。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…なるほど、そういう形ですか。ありがたく頂戴します。'], introverted:['…ありがとうございます。…私の代わりに、みんなを見てくださって。'], carefree:['ふむ、メンバーケアですか〜。それも助かりますね。'], earnest:['…ありがとうございます。私の至らなさを、社長が補ってくださる形で。'], emotional:['…社長…そういう形ですか。…申し訳ないです、ありがたいです。'], shy:['…ありがとうございます。…申し訳ない、です。'] },
        ojousama: { bold:['…まあ、そういうご配慮ですのね。ありがたく頂戴いたしますわ。'], introverted:['…ありがとうございますわ。…わたくしの代わりに、皆を見てくださるなんて。'], carefree:['あら、メンバー優先ですの? まあ、ありがたいですわ〜。'], earnest:['…社長、ご配慮痛み入りますわ。'], emotional:['…社長、そのお心遣い…胸に染みますわ。'], shy:['…ありがとうございますわ。…申し訳ない、ですわ。'] },
        polite: { bold:['…なるほど、そういう形ですか。ありがたく承ります。'], introverted:['…ありがとうございます。…私の代わりに、メンバーを見てくださって。'], carefree:['ふぅん、メンバー優先ですか〜。それも助かります〜。'], earnest:['…ご配慮、ありがとうございます。私の不在を、社長に拾っていただいて。'], emotional:['…社長、そういう形ですか。…申し訳ないです。'], shy:['…あの、ありがとうございます。…嬉しいです。'] },
        seductive: { bold:['…そう、メンバー優先ね。ありがとう。'], introverted:['…ありがとうございます。…そっちで動いてくれるんですね。'], carefree:['あら、私じゃなくて子たち優先? まあ、ありがたいです〜。'], earnest:['…社長、ご配慮ありがとうございます。'], emotional:['…社長…そういう形ですか。…ありがたい、です。'], shy:['…ありがとうございます。…嬉しい、です。'] },
        delinquent: { bold:['…っす、メンバー優先っすか。ありがたいっす。'], introverted:['…っす。ありがとうございます。'], carefree:['へぇ、メンバーケアっすか〜。まあありがたいっす。'], earnest:['…社長、配慮ありがとうございます。あたしらの分、見てくださって。'], emotional:['…っ、そうっすか。…申し訳ないっす、ありがたいっす。'], shy:['…っす、ありがとうございます。'] },
        cool: { bold:['…承知。ありがとうございます。'], introverted:['…ありがとうございます。'], carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'], emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…ありがとうございます。'] },
      },
    },
    OBSERVE_INTERNAL_RANK: {
      A: {
        normal: { bold:['…そうですか。私からも、メンバーに話します。'], introverted:['…はい、…わかりました。気をつけます。'], carefree:['えー、序列の話なんてしてないですよ〜。…まあ、注意しときますけど。'], earnest:['…申し訳ありません。私がしっかり見ていれば、防げたはずです。'], emotional:['…そう、ですか。…私の至らなさです。'], shy:['…はい…ごめんなさい、注意します。'] },
        composed: { bold:['…承知しました。私からメンバーに話します。'], introverted:['…はい、…気をつけます。'], carefree:['あらら、序列の話ですか〜。注意しておきますね。'], earnest:['…申し訳ありません。私の目が届いていませんでした。'], emotional:['…そうですか。…私の至らなさ、噛み締めます。'], shy:['…はい…申し訳ない、です。'] },
        ojousama: { bold:['…そうですの。わたくしから皆に話しますわ。'], introverted:['…はい、…気をつけますわ。'], carefree:['あら、そんな話してましたの? 注意しておきますわ〜。'], earnest:['…申し訳ありませんわ。わたくしの目が届きませんでしたわ。'], emotional:['…そうですの。…わたくしの至らなさですわ。'], shy:['…はい…ごめんなさいませ、注意いたしますわ。'] },
        polite: { bold:['…承知しました。私からメンバーに話させていただきます。'], introverted:['…はい、申し訳ありません。気をつけます。'], carefree:['えぇ〜、そんな話あったんですか〜。注意しときます〜。'], earnest:['…申し訳ありません。私が見ていれば、防げたはずです。'], emotional:['…そう、ですか。…私の責任です。'], shy:['…はい…ごめんなさい、注意します。'] },
        seductive: { bold:['…そう。私から皆に話すね。'], introverted:['…はい、…気をつけます。'], carefree:['えー、そんな話してた? まあ、注意しとくね〜。'], earnest:['…ごめんなさい。私の目が届いてなかった。'], emotional:['…そう、ですか。…私のせいだね。'], shy:['…はい…ごめんなさい。'] },
        delinquent: { bold:['…っす、わかりました。あたしから言っときます。'], introverted:['…っす。気をつけます。'], carefree:['えー、そんな話してました? まあ注意しときますんで〜。'], earnest:['…っす、すんません。あたしの目が届いてなかったっす。'], emotional:['…っ、そうっすか。…あたしの不徳っす。'], shy:['…っす…ごめんなさい、気をつけます。'] },
        cool: { bold:['…承知。私から話します。'], introverted:['…はい、わかりました。'], carefree:['わかりました。注意します。'], earnest:['…申し訳ありません。私の管理不足です。'], emotional:['…そうですか。…私の責任です。'], shy:['…はい…ごめんなさい。'] },
      },
      B: {
        normal: { bold:['…ありがとうございます。'], introverted:['…はい、ありがとうございます。'], carefree:['ふぅん、まあ放っておいてくれるなら〜。'], earnest:['…ありがとうございます。穏便に収まるよう努めます。'], emotional:['…ありがとうございます。'], shy:['…はい…。'] },
        composed: { bold:['…ありがとうございます。穏便に収めます。'], introverted:['…ありがとうございます。…ほっとしました。'], carefree:['ありがとうございます〜。穏便に〜。'], earnest:['…ありがとうございます。穏便に収まるよう努めます。'], emotional:['…ありがとうございます。'], shy:['…ありがとうございます。'] },
        ojousama: { bold:['…ありがとうございますわ。穏便にいたしますわ。'], introverted:['…ありがとうございますわ。…ほっといたしましたわ。'], carefree:['ありがとうございますわ〜。穏便に、ですわね。'], earnest:['…ありがとうございますわ。穏便に収まるよう努めますわ。'], emotional:['…ありがとうございますわ。'], shy:['…ありがとうございますわ。'] },
        polite: { bold:['…ありがとうございます。穏便にいたします。'], introverted:['…ありがとうございます。…安心しました。'], carefree:['ありがとうございます〜。穏便にいきますね。'], earnest:['…ありがとうございます。穏便に収めるよう努めます。'], emotional:['…ありがとうございます。'], shy:['…はい…ありがとうございます。'] },
        seductive: { bold:['…ありがとう、社長。穏便にね。'], introverted:['…ありがとうございます。'], carefree:['お〜、放っといてくれるんですね〜。ありがと〜。'], earnest:['…社長、ありがとうございます。穏便にいきます。'], emotional:['…社長、ありがとうございます。'], shy:['…ありがとうございます。'] },
        delinquent: { bold:['…っす、ありがとうございます。'], introverted:['…っす。ありがとうございます。'], carefree:['お〜、放っといてくれるんすか〜。ありがたいっす〜。'], earnest:['…っす、ありがとうございます。穏便にいきます。'], emotional:['…社長、ありがとうございます。'], shy:['…っす、ありがとうございます。'] },
        cool: { bold:['…ありがとうございます。'], introverted:['…ありがとうございます。'], carefree:['ありがとうございます。'], earnest:['…ありがとうございます。穏便に収めます。'], emotional:['…ありがとうございます。'], shy:['…ありがとうございます。'] },
      },
      C: {
        normal: { bold:['…ご配慮、ありがとうございます。下の子にも声をかけてくださって。'], introverted:['…ありがとうございます。…下の子のフォロー、助かります。'], carefree:['お、別ルートですか。下の子のフォロー、お願いします〜。'], earnest:['…ありがとうございます。私の力不足を、社長に補っていただいて。'], emotional:['…社長…そういう形で気にかけてくれるの、ありがたいです。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…ご配慮ありがとうございます。下の子のフォロー、助かります。'], introverted:['…ありがとうございます。…下の子のケア、ありがたいです。'], carefree:['ふむ、別ルートですか。下の子も助かりますね〜。'], earnest:['…ありがとうございます。私の至らなさを、社長に補っていただいて。'], emotional:['…社長…そういう形で気にかけてくださるの、ありがたいです。'], shy:['…ありがとうございます。…嬉しい、です。'] },
        ojousama: { bold:['…まあ、ご配慮ありがたく頂戴いたしますわ。下の子のフォロー、助かりますわ。'], introverted:['…ありがとうございますわ。…下の子のケア、ありがたいですわ。'], carefree:['あら、別ルートですの? 下の子のフォロー、お願いいたしますわ〜。'], earnest:['…社長、ご配慮痛み入りますわ。'], emotional:['…社長、そのお心遣い…胸に染みますわ。'], shy:['…ありがとうございますわ。…嬉しゅう、ございます。'] },
        polite: { bold:['…ご配慮、ありがとうございます。下の子にも目を向けてくださって。'], introverted:['…ありがとうございます。…下の子のフォロー、ありがたいです。'], carefree:['ふぅん、別ルートですか〜。下の子のケア、助かります〜。'], earnest:['…ご配慮、ありがとうございます。私の力不足を、社長に補っていただいて。'], emotional:['…社長、そういう形で気にかけてくださって、ありがとうございます。'], shy:['…あの、ありがとうございます。…嬉しいです。'] },
        seductive: { bold:['…そう、下の子のケアね。ありがとう。'], introverted:['…ありがとうございます。…下の子のフォロー、嬉しい。'], carefree:['あら、別ルートで動いてくれるの? ありがとうございます〜。'], earnest:['…ご配慮、ありがとうございます。下の子も救われます。'], emotional:['…社長…そういう形で気にかけてくれるの、嬉しい。'], shy:['…ありがとうございます。…嬉しい、です。'] },
        delinquent: { bold:['…っす、配慮ありがとうございます。下の子助かります。'], introverted:['…っす。下の子のフォロー、ありがたいっす。'], carefree:['へぇ、別ルートっすか。下の子のケア助かります〜。'], earnest:['…社長、配慮ありがとうございます。下の子の分、見てくださって。'], emotional:['…っ、そういう形っすか。…ありがたいっす。'], shy:['…っす、ありがとうございます。'] },
        cool: { bold:['…承知。下の子のケア、ありがとうございます。'], introverted:['…ありがとうございます。'], carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'], emotional:['…社長、そういう形ですか。…ありがとうございます。'], shy:['…ありがとうございます。'] },
      },
    },
    OBSERVE_FAN_PRESSURE: {
      A: {
        normal: { bold:['…大丈夫だと思ってましたが、…少しだけ、休ませてもらいます。'], introverted:['…ありがとうございます。…少し、休みます。'], carefree:['えへへ、バレてた? じゃ、お言葉に甘えて休みまーす。'], earnest:['…ありがとうございます。…ご厚意に、甘えさせてもらいます。'], emotional:['…社長…見ててくれたんですね。…ありがとうございます。'], shy:['…はい…休ませて、もらいます…ありがとう。'] },
        composed: { bold:['…ありがとうございます。少し、休ませてもらいます。'], introverted:['…ありがとうございます。…お気遣い、頂戴します。'], carefree:['あらら、見ててくれたんですね〜。じゃ、休ませてもらいます。'], earnest:['…ありがとうございます。ご厚意に、甘えさせていただきます。'], emotional:['…社長…見ていてくださったんですね。ありがとうございます。'], shy:['…ありがとうございます。…休ませて、もらいます。'] },
        ojousama: { bold:['…ありがとうございますわ。少し休ませていただきますわ。'], introverted:['…ありがとうございますわ。…休ませていただきますわ。'], carefree:['まあ、見ていてくださったの? ではお言葉に甘えますわ〜。'], earnest:['…ありがとうございますわ。ご厚意に甘えさせていただきますわ。'], emotional:['…社長…見ていてくださったんですのね。ありがとうございますわ。'], shy:['…ありがとうございますわ。…休ませて、いただきますわ。'] },
        polite: { bold:['…ありがとうございます。お言葉に甘えて、少し休ませていただきます。'], introverted:['…ありがとうございます。…休ませていただきます。'], carefree:['わ、見ててくれたんですか〜。じゃ、休ませていただきます〜。'], earnest:['…ありがとうございます。ご厚意に、しっかり甘えさせていただきます。'], emotional:['…社長…見ていてくださったんですね。ありがとうございます。'], shy:['…はい…ありがとうございます。…休ませて、いただきます。'] },
        seductive: { bold:['…ありがとう、社長。ちょっと休むね。'], introverted:['…ありがとうございます。…休みます。'], carefree:['あら、バレちゃった? じゃ、お言葉に甘えて〜。'], earnest:['…ありがとうございます。ご厚意、頂戴します。'], emotional:['…社長…見ててくれたんですね。嬉しい。'], shy:['…ありがとうございます。…休ませて、もらいます。'] },
        delinquent: { bold:['…っす、ありがとうございます。ちょっと休みます。'], introverted:['…っす、ありがとうございます。…休みます。'], carefree:['えへ、バレてました〜? じゃお言葉に甘えて休みまっす。'], earnest:['…社長、ありがとうございます。甘えさせてもらいます。'], emotional:['…社長、見ててくれたんすね。ありがとうございます。'], shy:['…っす…ありがとうございます。…休みます。'] },
        cool: { bold:['…ありがとうございます。少し休みます。'], introverted:['…ありがとうございます。…休みます。'], carefree:['ありがとうございます。休みますね。'], earnest:['…ありがとうございます。ご厚意、頂戴します。'], emotional:['…社長、ありがとうございます。'], shy:['…ありがとうございます。…休みます。'] },
      },
      B: {
        normal: { bold:['…大丈夫です。問題ありません。'], introverted:['…はい、平気です。'], carefree:['いや〜、まだいけますって〜。'], earnest:['…ご心配ありがとうございます。まだ立てます。'], emotional:['…大丈夫です。…まだ、やれます。'], shy:['…はい…大丈夫、です。'] },
        composed: { bold:['…大丈夫です。まだ、いけます。'], introverted:['…はい、…まだ、平気です。'], carefree:['いやいや、まだ大丈夫ですよ〜。'], earnest:['…ご心配ありがとうございます。まだ立てます。'], emotional:['…大丈夫です。…まだ、立っていられます。'], shy:['…はい…大丈夫、です。'] },
        ojousama: { bold:['…大丈夫ですわ。問題ございませんわ。'], introverted:['…はい、…平気ですわ。'], carefree:['まあ、まだ大丈夫ですのよ〜。'], earnest:['…ご心配ありがとうございますわ。まだ立てますわ。'], emotional:['…大丈夫ですわ。…まだ、やれますわ。'], shy:['…はい…大丈夫、ですわ。'] },
        polite: { bold:['…大丈夫です。問題ありません。'], introverted:['…はい、…平気です。'], carefree:['いや〜、まだいけます〜。'], earnest:['…ご心配いただきありがとうございます。まだ立てます。'], emotional:['…大丈夫です。…まだ、やれます。'], shy:['…はい…大丈夫、です。'] },
        seductive: { bold:['…大丈夫、まだ平気だよ。'], introverted:['…はい、平気です。'], carefree:['いやいや、まだ大丈夫〜。'], earnest:['…ご心配ありがとうございます。まだ立てます。'], emotional:['…大丈夫です。…まだ、やれる。'], shy:['…はい…大丈夫、です。'] },
        delinquent: { bold:['…っす、大丈夫っす。問題ないっす。'], introverted:['…っす。平気っす。'], carefree:['いやいや、まだいけますって〜。'], earnest:['…ご心配どうもっす。まだ立てます。'], emotional:['…大丈夫っす。…まだ、やれます。'], shy:['…っす…大丈夫、です。'] },
        cool: { bold:['…大丈夫です。問題ありません。'], introverted:['…はい、平気です。'], carefree:['まだ、いけます。'], earnest:['…ご心配ありがとうございます。まだ立てます。'], emotional:['…大丈夫です。…まだ、やれます。'], shy:['…はい…大丈夫、です。'] },
      },
      C: {
        normal: { bold:['…そっちですか。…メンバーにフォローを入れてくださると、私も楽になります。'], introverted:['…ありがとうございます。…メンバーが受け止めてくれると、助かります。'], carefree:['お、メンバーケアですか? 助かりますね〜。'], earnest:['…ありがとうございます。チームで支えてもらえるなら、私も持ち直せます。'], emotional:['…社長…ありがとうございます。一人で抱えなくていいって、思えます。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…なるほど、メンバーケアですか。私も助かります。'], introverted:['…ありがとうございます。…メンバーに支えてもらえると、楽になります。'], carefree:['ふむ、メンバーケアですか〜。それも助かりますね。'], earnest:['…ありがとうございます。チームで支えていただけると、持ち直せます。'], emotional:['…社長…ありがとうございます。一人で抱えなくていいんですね。'], shy:['…ありがとうございます。…助かります。'] },
        ojousama: { bold:['…まあ、メンバーケアですの。わたくしも楽になりますわ。'], introverted:['…ありがとうございますわ。…皆に支えていただけると、ありがたいですわ。'], carefree:['あら、皆のケアですの? 助かりますわ〜。'], earnest:['…ありがとうございますわ。皆で支えていただけると、立ち直れますわ。'], emotional:['…社長…ありがとうございますわ。一人で抱えずに済みますわ。'], shy:['…ありがとうございますわ。…助かります、わ。'] },
        polite: { bold:['…なるほど、メンバーケアですか。私も助かります。'], introverted:['…ありがとうございます。…メンバーに支えていただけると、楽になります。'], carefree:['お、メンバーケアですか〜。助かります〜。'], earnest:['…ありがとうございます。チームで支えていただけるなら、持ち直せます。'], emotional:['…社長…ありがとうございます。一人で抱えなくて済みます。'], shy:['…あの、ありがとうございます。…嬉しいです。'] },
        seductive: { bold:['…そう、メンバーケアね。私も助かる、ありがとう。'], introverted:['…ありがとうございます。…メンバーに支えてもらえる、嬉しい。'], carefree:['あら、メンバー優先? まあ、助かります〜。'], earnest:['…ご配慮、ありがとうございます。皆に支えてもらえます。'], emotional:['…社長…一人じゃなくていいんだね。ありがとう。'], shy:['…ありがとうございます。…嬉しい、です。'] },
        delinquent: { bold:['…っす、メンバーケアっすか。助かります。'], introverted:['…っす。皆のフォロー、ありがたいっす。'], carefree:['へぇ、メンバー優先っすか〜。助かりますね〜。'], earnest:['…社長、配慮ありがとうございます。皆に支えてもらえます。'], emotional:['…社長…ありがとうございます。一人で抱えなくていいんすね。'], shy:['…っす、ありがとうございます。'] },
        cool: { bold:['…承知。メンバーケア、助かります。'], introverted:['…ありがとうございます。'], carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'], emotional:['…社長、ありがとうございます。'], shy:['…ありがとうございます。'] },
      },
    },
    OBSERVE_TRAINING_HARD: {
      A: {
        normal: { bold:['…わかりました。怪我させちゃ意味がないですもんね。少し、緩めます。'], introverted:['…はい、…わかりました。やりすぎ、だったかもしれません。'], carefree:['えぇ〜、これくらい大丈夫なんですけどぉ。…はぁい、緩めま〜す。'], earnest:['…申し訳ありません。私の判断が、行きすぎていました。'], emotional:['…社長…そう、ですか。…私が、追い込みすぎてました。'], shy:['…はい…ごめんなさい、加減します。'] },
        composed: { bold:['…承知しました。怪我させては元も子もないですね。緩めます。'], introverted:['…はい、…緩めます。'], carefree:['あらら、見られてました? じゃ、緩めますね〜。'], earnest:['…申し訳ありません。私の判断が行きすぎていました。'], emotional:['…社長…そうですね。…私が、追い込みすぎていました。'], shy:['…はい…申し訳ない、です。緩めます。'] },
        ojousama: { bold:['…承知いたしましたわ。怪我は本末転倒ですものね、緩めますわ。'], introverted:['…はい、…緩めますわ。'], carefree:['あら、見ていらしたの? では緩めますわ〜。'], earnest:['…申し訳ありませんわ。わたくしの判断が行きすぎましたわ。'], emotional:['…社長…そうですの。…わたくしが、追い込みすぎましたわ。'], shy:['…はい…ごめんなさいませ、加減いたしますわ。'] },
        polite: { bold:['…承知しました。怪我させては元も子もありません。緩めます。'], introverted:['…はい、…加減します。'], carefree:['えぇ〜、これくらい大丈夫だと思ったんですけど〜。緩めますね〜。'], earnest:['…申し訳ありません。私の判断が、行きすぎていました。'], emotional:['…社長…そうですね。…私の追い込みが、過ぎていました。'], shy:['…はい…ごめんなさい、加減します。'] },
        seductive: { bold:['…そうね、緩めるね。怪我させたくないし。'], introverted:['…はい、…加減します。'], carefree:['あら、これくらい平気なんだけどな〜。じゃ、緩めますね。'], earnest:['…ごめんなさい。私の判断が行きすぎてました。'], emotional:['…社長…そう、ですか。…私が追い込みすぎてた。'], shy:['…はい…ごめんなさい、加減します。'] },
        delinquent: { bold:['…っす、わかりました。怪我さしたら意味ないっすね。緩めます。'], introverted:['…っす。…加減します。'], carefree:['えぇ〜、これくらいいけるんすけどな〜。はい、緩めまっす。'], earnest:['…っす、すんません。あたしの判断が行きすぎたっす。'], emotional:['…社長、すんません。…あたし、追い込みすぎたっす。'], shy:['…っす…ごめんなさい、加減します。'] },
        cool: { bold:['…承知。緩めます。'], introverted:['…はい、加減します。'], carefree:['わかりました。緩めます。'], earnest:['…申し訳ありません。判断を改めます。'], emotional:['…社長、…私が、追い込みすぎていました。'], shy:['…はい…加減します。'] },
      },
      B: {
        normal: { bold:['…ありがとうございます。このままで大丈夫です。'], introverted:['…ありがとうございます。…見守ってください。'], carefree:['お、続けていいんですね〜! やった〜。'], earnest:['…ありがとうございます。責任は私が持ちます。'], emotional:['…ありがとうございます。やり切らせてください。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…ありがとうございます。このまま続けます。'], introverted:['…ありがとうございます。…見守ってください。'], carefree:['ありがとうございます〜。続けますね。'], earnest:['…ありがとうございます。責任は私が持ちます。'], emotional:['…ありがとうございます。やり切らせてください。'], shy:['…ありがとうございます。…続けます。'] },
        ojousama: { bold:['…ありがとうございますわ。このまま続けますわ。'], introverted:['…ありがとうございますわ。…見守ってくださいませ。'], carefree:['まあ、続けていいんですの? ありがとうございますわ〜。'], earnest:['…ありがとうございますわ。責任はわたくしが持ちますわ。'], emotional:['…ありがとうございますわ。やり切らせてくださいませ。'], shy:['…ありがとうございますわ。…続けます、わ。'] },
        polite: { bold:['…ありがとうございます。このまま続けさせていただきます。'], introverted:['…ありがとうございます。…見守ってください。'], carefree:['わ、続けていいんですか〜! ありがとうございます〜。'], earnest:['…ありがとうございます。責任は私が持たせていただきます。'], emotional:['…ありがとうございます。やり切らせてください。'], shy:['…はい…ありがとうございます。…続けます。'] },
        seductive: { bold:['…ありがとう、社長。このまま続けるね。'], introverted:['…ありがとうございます。…続けます。'], carefree:['お〜、続けていいの? やった〜!'], earnest:['…社長、ありがとうございます。責任は私が持ちます。'], emotional:['…社長…ありがとう。やり切らせてください。'], shy:['…ありがとうございます。…続けます。'] },
        delinquent: { bold:['…っす、ありがとうございます。このままいきます。'], introverted:['…っす。続けます。'], carefree:['お〜、続けていいんすか〜! やった〜!'], earnest:['…社長、ありがとうございます。責任はあたしが持ちます。'], emotional:['…社長、ありがとうございます。やり切らせてください。'], shy:['…っす、ありがとうございます。'] },
        cool: { bold:['…ありがとうございます。続けます。'], introverted:['…ありがとうございます。'], carefree:['ありがとうございます。続けます。'], earnest:['…ありがとうございます。責任は私が持ちます。'], emotional:['…ありがとうございます。やり切ります。'], shy:['…ありがとうございます。'] },
      },
      C: {
        normal: { bold:['…そっちですか。下の子の負担を見てくださって、ありがとうございます。'], introverted:['…ありがとうございます。…下の子、限界が近かったかもしれません。'], carefree:['あれ、私じゃなくて子たち優先? まあ、ありがたいですけど〜。'], earnest:['…ありがとうございます。私が見落としていた負担を、社長に拾っていただいて。'], emotional:['…社長…ありがとうございます。私、見えてなかったです。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…なるほど、下の子のケアですか。ありがたく頂戴します。'], introverted:['…ありがとうございます。…下の子、限界が近かったかもしれません。'], carefree:['ふむ、私じゃなくて子たち優先ですか〜。ありがたいです。'], earnest:['…ありがとうございます。私が見落としていた負担を、社長に拾っていただいて。'], emotional:['…社長…ありがとうございます。私、見えていませんでした。'], shy:['…ありがとうございます。…申し訳ない、です。'] },
        ojousama: { bold:['…まあ、下の子のケアですのね。ありがたく頂戴いたしますわ。'], introverted:['…ありがとうございますわ。…下の子、限界が近かったのかもしれませんわ。'], carefree:['あら、わたくしより皆優先ですの? ありがたいですわ〜。'], earnest:['…社長、ご配慮痛み入りますわ。'], emotional:['…社長、そのお心遣い…胸に染みますわ。'], shy:['…ありがとうございますわ。…申し訳ない、ですわ。'] },
        polite: { bold:['…なるほど、下の子のケアですか。ありがたく承ります。'], introverted:['…ありがとうございます。…下の子、限界が近かったかもしれません。'], carefree:['あれ、私じゃなくて子たち優先ですか〜? ありがたいです〜。'], earnest:['…ご配慮、ありがとうございます。私が見落としていた負担を、社長に拾っていただいて。'], emotional:['…社長…ありがとうございます。私、見えていませんでした。'], shy:['…あの、ありがとうございます。…嬉しいです。'] },
        seductive: { bold:['…そう、子たち優先ね。ありがとう。'], introverted:['…ありがとうございます。…下の子、限界近かったかも。'], carefree:['あら、私じゃなくて子たち? まあ、ありがたいですけどね〜。'], earnest:['…ご配慮、ありがとうございます。私の見落とし、拾ってくれて。'], emotional:['…社長…ありがとう。私、見えてなかった。'], shy:['…ありがとうございます。…嬉しい、です。'] },
        delinquent: { bold:['…っす、子たち優先っすか。ありがたいっす。'], introverted:['…っす。下の子、限界近かったかもしれないっす。'], carefree:['あれ、あたしじゃなくて子たち優先っすか〜? まあありがたいっす。'], earnest:['…社長、配慮どうもっす。あたしの見落とし、拾ってくれて。'], emotional:['…社長、ありがとうございます。あたし、見えてなかったっす。'], shy:['…っす、ありがとうございます。'] },
        cool: { bold:['…承知。下の子のケア、ありがとうございます。'], introverted:['…ありがとうございます。'], carefree:['ふぅん、そっちですか。ありがとうございます。'], earnest:['…ご配慮、ありがとうございます。'], emotional:['…社長、ありがとうございます。'], shy:['…ありがとうございます。'] },
      },
    },
    INCIDENT_BOUNDARY: {
      A: {
        normal: { bold:['…そうですね、注意します。'], introverted:['…はい、すみません。'], carefree:['あ、そっか〜、気をつけまーす。'], earnest:['…申し訳ありません、配慮が足りませんでした。'], emotional:['…そうですね、悪かったです。'], shy:['…はい…ごめんなさい。'] },
        composed: { bold:['…承知しました、注意します。'], introverted:['…はい、…気をつけます。'], carefree:['あらら、配慮足りませんでしたね〜。気をつけます。'], earnest:['…申し訳ありません、配慮が足りませんでした。'], emotional:['…そうですね、…悪かったです。'], shy:['…はい…申し訳ない、です。'] },
        ojousama: { bold:['…そうですの、気をつけますわ。'], introverted:['…はい、…失礼いたしましたわ。'], carefree:['あら、配慮が足りませんでしたわね〜。気をつけますわ。'], earnest:['…申し訳ありませんわ、心がけを改めますわ。'], emotional:['…そうですの、…申し訳ありませんわ。'], shy:['…はい…ごめんなさいませ。'] },
        polite: { bold:['…承知しました。気をつけます。'], introverted:['…はい、申し訳ありません。'], carefree:['あ、配慮足りなかったですか〜。気をつけます〜。'], earnest:['…申し訳ありません、配慮が至りませんでした。'], emotional:['…そうですね、…申し訳ありません。'], shy:['…はい…ごめんなさい。'] },
        seductive: { bold:['…そう、気をつけるね。'], introverted:['…はい、…気をつけます。'], carefree:['あら、配慮足りなかった? 気をつけるね〜。'], earnest:['…ごめんなさい、配慮が足りませんでした。'], emotional:['…そうね、…悪かった。'], shy:['…はい…ごめんなさい。'] },
        delinquent: { bold:['…っす、わかりました。気をつけます。'], introverted:['…っす、すんません。'], carefree:['あ、そっかぁ〜、気をつけまっす。'], earnest:['…っす、すんません、配慮足りなかったっす。'], emotional:['…っ、そうっすね、…悪かったっす。'], shy:['…っす…ごめんなさい。'] },
        cool: { bold:['…承知。気をつけます。'], introverted:['…はい、わかりました。'], carefree:['わかりました、気をつけます。'], earnest:['…申し訳ありません、改めます。'], emotional:['…そうですね、悪かったです。'], shy:['…はい…ごめんなさい。'] },
      },
      B: {
        normal: { bold:['…ありがとうございます。'], introverted:['…はい。'], carefree:['ありがとうございま〜す。'], earnest:['…ありがとうございます。'], emotional:['…ありがとうございます。'], shy:['…はい…。'] },
        composed: { bold:['…ありがとうございます。'], introverted:['…ありがとうございます。'], carefree:['ありがとうございます〜。'], earnest:['…ありがとうございます。'], emotional:['…ありがとうございます。'], shy:['…ありがとうございます。'] },
        ojousama: { bold:['…ありがとうございますわ。'], introverted:['…ありがとうございますわ。'], carefree:['ありがとうございますわ〜。'], earnest:['…ありがとうございますわ。'], emotional:['…ありがとうございますわ。'], shy:['…ありがとうございますわ。'] },
        polite: { bold:['…ありがとうございます。'], introverted:['…はい、ありがとうございます。'], carefree:['ありがとうございます〜。'], earnest:['…ありがとうございます。'], emotional:['…ありがとうございます。'], shy:['…はい…ありがとうございます。'] },
        seductive: { bold:['…ありがとう、社長。'], introverted:['…ありがとうございます。'], carefree:['ありがとうございます〜。'], earnest:['…ありがとうございます。'], emotional:['…ありがとうございます。'], shy:['…ありがとうございます。'] },
        delinquent: { bold:['…っす、ありがとうございます。'], introverted:['…っす。'], carefree:['ありがとうござ〜っす。'], earnest:['…っす、ありがとうございます。'], emotional:['…っす、ありがとうございます。'], shy:['…っす…ありがとうございます。'] },
        cool: { bold:['…ありがとうございます。'], introverted:['…ありがとうございます。'], carefree:['ありがとうございます。'], earnest:['…ありがとうございます。'], emotional:['…ありがとうございます。'], shy:['…ありがとうございます。'] },
      },
    },
    INCIDENT_BONDING: {
      A: {
        normal: { bold:['…そうですね、配慮が足りませんでした。次は声をかけます。'], introverted:['…はい、すみません。…悪気は、なかったんですけど。'], carefree:['え、そんなに気にしてました? ごめんなさ〜い、次は誘いますって。'], earnest:['…申し訳ありません。輪の外にいる子の気持ち、見えてませんでした。'], emotional:['…ああ、…そう、ですか。…悪いことしました。'], shy:['…ごめんなさい…次は、声、かけます。'] },
        composed: { bold:['…承知しました、次は声をかけます。'], introverted:['…はい、…悪気はなかったんですが、配慮が足りませんでした。'], carefree:['あらら、気にしてましたか〜。次は誘いますね。'], earnest:['…申し訳ありません。輪の外にいる子の気持ち、見えていませんでした。'], emotional:['…ああ、…そうでしたか。…悪いことをしました。'], shy:['…ごめんなさい…次は、声をかけます。'] },
        ojousama: { bold:['…そうですの、次はお声をかけますわ。'], introverted:['…はい、…悪気はなかったのですけれど、申し訳ありませんわ。'], carefree:['あら、気にしてらしたの? 次はお誘いしますわ〜。'], earnest:['…申し訳ありませんわ。輪の外の子のお気持ち、見えてませんでしたわ。'], emotional:['…ああ、…そうでしたの。…悪いことをいたしましたわ。'], shy:['…ごめんなさいませ…次は、お声がけ、いたしますわ。'] },
        polite: { bold:['…承知しました、次はお声をかけさせていただきます。'], introverted:['…はい、申し訳ありません。…悪気はなかったんですが。'], carefree:['え、気にされてました〜? ごめんなさい、次は誘いますね〜。'], earnest:['…申し訳ありません。輪の外にいる子のお気持ち、見えていませんでした。'], emotional:['…ああ、…そうでしたか。…申し訳ありませんでした。'], shy:['…ごめんなさい…次は、声、かけます。'] },
        seductive: { bold:['…そう、次は声かけるね。ごめんなさい。'], introverted:['…はい、…悪気はなかったんです。次は、声、かけます。'], carefree:['あら、気にしてた? ごめん、次は誘うね〜。'], earnest:['…ごめんなさい。輪の外にいる子の気持ち、見えてなかった。'], emotional:['…ああ、…そう、だったんですね。…悪いことをした。'], shy:['…ごめんなさい…次は、声、かけます。'] },
        delinquent: { bold:['…っす、わかりました。次は声かけます。'], introverted:['…っす、すんません。…悪気はなかったんすけど。'], carefree:['え、気にしてました? ごめんなさ〜い、次は誘いますんで〜。'], earnest:['…っす、すんません。輪の外にいる子の気持ち、見えてなかったっす。'], emotional:['…っ、そうっすか。…悪いことしたっす。'], shy:['…っす…ごめんなさい。次は、声、かけます。'] },
        cool: { bold:['…承知。次は声をかけます。'], introverted:['…はい、わかりました。'], carefree:['わかりました、次は誘います。'], earnest:['…申し訳ありません、配慮が足りませんでした。'], emotional:['…そう、ですか。…悪かったです。'], shy:['…ごめんなさい…次は、声、かけます。'] },
      },
      B: {
        normal: { bold:['…ありがとうございます。仲間内の付き合いも大事ですから。'], introverted:['…ありがとうございます。…でも、少し、考えます。'], carefree:['ありがとうございま〜す、楽しんでこまーす。'], earnest:['…ありがとうございます。いただいた寛容に甘え過ぎないようにします。'], emotional:['…ありがとうございます。…でも、誰かを置いてけぼりにはしたくないですね。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…ありがとうございます。仲間内の付き合いも、大事ですから。'], introverted:['…ありがとうございます。…でも、少し、考えます。'], carefree:['ありがとうございます〜。楽しんできますね。'], earnest:['…ありがとうございます。寛容に甘え過ぎないように気をつけます。'], emotional:['…ありがとうございます。…でも、誰かを置いてけぼりにはしたくないですね。'], shy:['…ありがとうございます。…でも、少し、考えます。'] },
        ojousama: { bold:['…ありがとうございますわ。仲間内のお付き合いも大事ですものね。'], introverted:['…ありがとうございますわ。…ですが、少し、考えますわ。'], carefree:['ありがとうございますわ〜、楽しんで参りますわ。'], earnest:['…ありがとうございますわ。寛容に甘え過ぎぬよう気をつけますわ。'], emotional:['…ありがとうございますわ。…でも、誰かを置き去りにはいたしませんわ。'], shy:['…ありがとうございますわ。…ですが、少し、考えますわ。'] },
        polite: { bold:['…ありがとうございます。仲間内の付き合いも大切にします。'], introverted:['…ありがとうございます。…でも、少し、考えさせていただきます。'], carefree:['ありがとうございます〜! 楽しんできます〜。'], earnest:['…ありがとうございます。寛容に甘え過ぎないように気をつけます。'], emotional:['…ありがとうございます。…でも、誰かを置いてけぼりにはしたくないです。'], shy:['…はい…ありがとうございます。…でも、少し、考えます。'] },
        seductive: { bold:['…ありがとう。仲間内の付き合いも、大事だからね。'], introverted:['…ありがとうございます。…でも、少し、考えます。'], carefree:['ありがとうございます〜、楽しんできますね。'], earnest:['…ありがとうございます。甘え過ぎないようにします。'], emotional:['…ありがとうございます。…でも、誰かを置いてけぼりにはしたくないな。'], shy:['…ありがとうございます。…でも、少し、考えます。'] },
        delinquent: { bold:['…っす、ありがとうございます。仲間内の付き合いも大事っすから。'], introverted:['…っす、ありがとうございます。…でも、少し、考えます。'], carefree:['ありがとうござ〜っす、楽しんできまっす。'], earnest:['…っす、ありがとうございます。甘え過ぎないっす。'], emotional:['…っす、ありがとうございます。…でも、誰か置いてくのは、嫌っすね。'], shy:['…っす…ありがとうございます。…でも、考えます。'] },
        cool: { bold:['…ありがとうございます。'], introverted:['…ありがとうございます。…でも、少し、考えます。'], carefree:['ありがとうございます。'], earnest:['…ありがとうございます。甘え過ぎないようにします。'], emotional:['…ありがとうございます。…でも、誰かを置いていきたくはないです。'], shy:['…ありがとうございます。'] },
      },
    },
    INCIDENT_HEEL_PROVOKE: {
      A: {
        normal: { bold:['…そうですか。営業に響くなら、線は引きます。'], introverted:['…はい、わかりました。…やりすぎ、でしたね。'], carefree:['えぇ〜、客もノッてたじゃないですか〜。…はーい、控えまーす。'], earnest:['…申し訳ありません。リングの外にまで持ち込むのは、確かに行きすぎでした。'], emotional:['…そう、ですか。…私の熱、しまいます。'], shy:['…はい…ごめんなさい、控えます。'] },
        composed: { bold:['…承知しました。営業に響くなら線を引きます。'], introverted:['…はい、…やりすぎでした。'], carefree:['あらら、見られてました〜? じゃ、控えますね。'], earnest:['…申し訳ありません。リングの外まで持ち込んだのは行きすぎでした。'], emotional:['…そう、ですか。…私の熱、しまいます。'], shy:['…はい…ごめんなさい、控えます。'] },
        ojousama: { bold:['…そうですの、営業に響くなら線を引きますわ。'], introverted:['…はい、…やりすぎでしたわ。'], carefree:['あら、見られてましたの? では控えますわ〜。'], earnest:['…申し訳ありませんわ。リングの外にまで持ち込むのは、行きすぎでしたわ。'], emotional:['…そうですの、…わたくしの熱、しまいますわ。'], shy:['…はい…ごめんなさいませ、控えますわ。'] },
        polite: { bold:['…承知しました。営業に響くなら、線を引かせていただきます。'], introverted:['…はい、申し訳ありません。…やりすぎでした。'], carefree:['えぇ〜、お客さんノッてたじゃないですか〜。…はい、控えます〜。'], earnest:['…申し訳ありません。リングの外にまで持ち込むのは、行きすぎでした。'], emotional:['…そう、ですか。…私の熱、しまいます。'], shy:['…はい…ごめんなさい、控えます。'] },
        seductive: { bold:['…そう、線を引くね。客はノッてたんだけど。'], introverted:['…はい、わかりました。…やりすぎたかな。'], carefree:['えぇ〜、お客さんノッてたのに〜。はい、控えますね。'], earnest:['…ごめんなさい。リング外まで持ち込んだのは、やりすぎでした。'], emotional:['…そう、ですか。…私の熱、しまいます。'], shy:['…はい…ごめんなさい、控えます。'] },
        delinquent: { bold:['…っす、わかりました。営業に響くなら線引きます。'], introverted:['…っす。…やりすぎたっす。'], carefree:['えぇ〜、客ノッてたじゃないっすか〜。はい、控えまっす。'], earnest:['…っす、すんません。リングの外まで持ち込んだのは行きすぎだったっす。'], emotional:['…っ、そうっすか。…あたしの熱、しまいます。'], shy:['…っす…ごめんなさい、控えます。'] },
        cool: { bold:['…承知。線を引きます。'], introverted:['…はい、わかりました。'], carefree:['わかりました、控えます。'], earnest:['…申し訳ありません、行きすぎでした。'], emotional:['…そう、ですか。…熱、しまいます。'], shy:['…はい…ごめんなさい、控えます。'] },
      },
      B: {
        normal: { bold:['…ありがとうございます。これも仕事のうちです。'], introverted:['…ありがとうございます。…ヒールの仕事、続けます。'], carefree:['やった〜、社長わかってる〜! 引き続き暴れまーす。'], earnest:['…ありがとうございます。役柄の責任、まっとうします。'], emotional:['…ありがとうございます。…私、止まれないですから。'], shy:['…はい…ありがとう、ございます。'] },
        composed: { bold:['…ありがとうございます。これも仕事のうちです。'], introverted:['…ありがとうございます。…ヒールの仕事、続けます。'], carefree:['ありがとうございます〜、引き続きやらせていただきます。'], earnest:['…ありがとうございます。役柄の責任、まっとうします。'], emotional:['…ありがとうございます。…私、止まれませんから。'], shy:['…ありがとうございます。…続けます。'] },
        ojousama: { bold:['…ありがとうございますわ。これも仕事のうちですもの。'], introverted:['…ありがとうございますわ。…ヒールの仕事、続けますわ。'], carefree:['まあ、ご理解ありがとうございますわ〜。続けますわよ。'], earnest:['…ありがとうございますわ。役柄の責任、まっとういたしますわ。'], emotional:['…ありがとうございますわ。…わたくし、止まれませんわ。'], shy:['…ありがとうございますわ。…続けます、わ。'] },
        polite: { bold:['…ありがとうございます。これも仕事のうちです。'], introverted:['…ありがとうございます。…ヒールの仕事、続けさせていただきます。'], carefree:['わ、社長わかってる〜! 引き続きやらせていただきます〜。'], earnest:['…ありがとうございます。役柄の責任、まっとうします。'], emotional:['…ありがとうございます。…私、止まれないですから。'], shy:['…はい…ありがとうございます。…続けます。'] },
        seductive: { bold:['…ありがとう、社長。これも仕事だからね。'], introverted:['…ありがとうございます。…ヒールの仕事、続けます。'], carefree:['やった〜、社長わかってる〜! 引き続き暴れちゃう〜。'], earnest:['…ありがとうございます。役柄の責任、まっとうします。'], emotional:['…ありがとうございます。…私、止まれないから。'], shy:['…ありがとうございます。…続けます。'] },
        delinquent: { bold:['…っす、ありがとうございます。これも仕事のうちっす。'], introverted:['…っす。ヒールの仕事、続けます。'], carefree:['やった〜、社長わかってる〜! 引き続き暴れまっす!'], earnest:['…っす、ありがとうございます。役柄の責任、まっとうします。'], emotional:['…っす、ありがとうございます。…あたし、止まれないんすから。'], shy:['…っす、ありがとうございます。'] },
        cool: { bold:['…ありがとうございます。仕事です。'], introverted:['…ありがとうございます。'], carefree:['ありがとうございます。続けます。'], earnest:['…ありがとうございます。役柄の責任、まっとうします。'], emotional:['…ありがとうございます。…止まれませんから。'], shy:['…ありがとうございます。'] },
      },
    },
  },
  resultTarget: {
    OBSERVE_RIVAL_HEAT: {
      A: [
        '{targetName}は、ほっと息を吐いた。',
        '{targetName}の肩から、ようやく力が抜けた。',
      ],
      B: [
        '{targetName}は、何も言わずに視線を落とした。',
        '{targetName}は、小さく唇を噛んだ。',
      ],
      C: [
        '{targetName}は、小さく頷いた。',
        '{targetName}は、社長の方をちらりと見て、口元を緩めた。',
      ],
    },
    INCIDENT_BOUNDARY: {
      A: [
        '{targetName}の表情が、わずかに緩んだ。',
        '{targetName}は、ロッカーの自分の席に、ようやく腰を下ろせた。',
      ],
      B: [
        '{targetName}は、視線を逸らした。',
        '{targetName}は、誰にも気づかれないよう、深く息を吐いた。',
      ],
    },
    OBSERVE_FAN_PRESSURE: {
      A: ['{factionName}のメンバーが、{leaderName}の表情を見て、安心したように肩を撫で下ろした。'],
      B: ['{factionName}のメンバーは、{leaderName}の背中を、心配そうに見送った。'],
      C: ['{factionName}のメンバーは、自分たちの番だ、という顔で頷き合った。'],
    },
    INCIDENT_BONDING: {
      A: ['{targetName}は、ぽつりと「次は、呼んでくれるかな」と呟いた。'],
      B: ['{targetName}は、誰にも見られないように、ロッカーの隅で目を伏せた。'],
    },
    INCIDENT_HEEL_PROVOKE: {
      A: ['観客は、わずかに静かになった。線が引かれた、と気づいた者もいた。'],
      B: ['客席のヤジは止まらなかった。むしろ、加速した。'],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Common-3 派閥加入通知 セリフテーブル
// 軸: 口調アーキタイプ（archetype）— composed/ojousama/polite/seductive/delinquent/cool/normal
//     personality では分けない。性格で分けると同じ archetype のキャラの口調が崩壊する
//     （お嬢様キャラがタメ口で挨拶、など）ため、archetype に揃える。
// 引き方: Engine.factions.getCommon3Line(category, ctx)
//   category: 'newcomer' | 'reaction'
//   ctx (newcomer): { fighter }                          ← fighter.archetype を引く
//   ctx (reaction): { archetypeId, newcomerFighter }     ← 派閥アーキ × 新人 archetype
// ─────────────────────────────────────────────────────────────────────────────
const COMMON3_LINES = {
  // 新人の挨拶。新人自身の口調アーキタイプのみで決まる
  newcomer: {
    composed: [
      '世話になる。よろしく頼む。',
      '足を引っ張らんように、心がけよう。',
    ],
    ojousama: [
      'お世話になりますわ。よろしくお願いいたします。',
      '皆様のお力添え、頂戴できれば嬉しゅうございますわ。',
    ],
    polite: [
      'お世話になります。よろしくお願いいたします。',
      '至らぬ点もあるかと存じますが、ご指導お願いいたします。',
    ],
    seductive: [
      'よろしくね。仲良く……してくれる?',
      'ふふ、楽しくなりそうね。',
    ],
    delinquent: [
      'ま、よろしく頼むわ。',
      '邪魔はしねぇから、安心してくれよ。',
    ],
    cool: [
      'よろしく。',
      '……結果で示す。',
    ],
    normal: [
      'よろしくお願いします。頑張ります。',
      'お世話になります。よろしくお願いします。',
    ],
  },
  // リーダーの反応。リーダーは派閥アーキタイプの気風を背負って喋り、
  // 内容は新人の口調アーキタイプ（=どんな新人を迎えたか）で振れる。
  reaction: {
    AUTHORITY: {
      composed:   ['ふむ、来たか。流儀は身体で覚えてもらう。'],
      ojousama:   ['ようこそ。気品は結構。だが、規律の前では一兵卒だ。'],
      polite:     ['よろしい。礼儀のある者は伸びる。期待している。'],
      seductive:  ['色気で味方を惑わすな。リングでだけ使え。'],
      delinquent: ['突っ張るな。うちの順序を覚えてからだ。'],
      cool:       ['無駄口がない、結構。あとは結果で示せ。'],
      normal:     ['うちの流儀を覚えてもらう。それだけだ。'],
    },
    BOND: {
      composed:   ['よく来たね。肩の力、抜いていいよ。'],
      ojousama:   ['うふふ、華があるねぇ。みんなで大事にするよ。'],
      polite:     ['そんなに畏まらないで。ここは家族みたいなもんだから。'],
      seductive:  ['うちはみんな本気で仲良しだから。あなたも溶け込んで。'],
      delinquent: ['尖ってんねぇ。でも、うちじゃ独りにはさせないよ。'],
      cool:       ['無理に喋らなくていい。隣にいるから。'],
      normal:     ['一緒に頑張ろうね。困ったら言って。'],
    },
    MERIT: {
      composed:   ['言葉は要らん。結果を持ってこい。それだけだ。'],
      ojousama:   ['気品も結構。ただし、勝てない上品は退屈だ。'],
      polite:     ['謙虚さは武器になる。あとは星を取ってこい。'],
      seductive:  ['惑わすのは客だけにしろ。仲間内じゃ通じない。'],
      delinquent: ['威勢があるな。実績で裏付けてみせろ。'],
      cool:       ['黙して語らず、結構。リングで吠えろ。'],
      normal:     ['実力を見せられるなら、いい。期待してる。'],
    },
    HEEL: {
      composed:   ['落ち着いてやがるな。うちで歪ませてやるよ。'],
      ojousama:   ['お嬢ちゃんが、なぁ。汚れる覚悟はあるんだろうな?'],
      polite:     ['丁寧な悪役、というのも面白い。化けてみろ。'],
      seductive:  ['いい色気だ。観客を狂わせる側に回れ。'],
      delinquent: ['気が合いそうだ。一緒に悪者になろうぜ。'],
      cool:       ['冷たい目だな。気に入った。'],
      normal:     ['うちの色に染まれるか、見てやる。'],
    },
    FACE: {
      composed:   ['よく来てくれた。王道は、静かに歩む者にこそ似合う。'],
      ojousama:   ['ようこそ。気品も、王道の華だ。失わないでくれ。'],
      polite:     ['ようこそ。うちは王道を貫く。あなたもそのつもりで。'],
      seductive:  ['その色気、悪役の道具にせず、観客の歓声に変えてみせろ。'],
      delinquent: ['尖ってんな。でも、うちでは正面から殴るぞ?'],
      cool:       ['クールな王道、悪くない。観客を裏切るな。'],
      normal:     ['ようこそ。うちは王道を貫く。あなたもそのつもりで。'],
    },
    COMBAT: {
      composed:   ['落ち着き払ってやがる。リングではそれを捨ててもらう。'],
      ojousama:   ['お嬢ちゃん、ここじゃ汗と血だ。覚悟はあるか?'],
      polite:     ['丁寧なのはリング外だけにしとけ。中じゃ殴れ。'],
      seductive:  ['色気もいいが、まずは殴り方からだ。'],
      delinquent: ['気に入った。明日から拳で語ろうぜ。'],
      cool:       ['黙ってんのはいい。リングじゃ吠えろ。'],
      normal:     ['強くなりたきゃ、うちで殴り合え。'],
    },
    _any: ['よろしく。'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Common-1 派閥内試合提案 セリフテーブル（spec §3）
// 引き方: Engine.factions.getCommon1Line(category, ctx)
//   category: 'coachReport' | 'leaderDemand' | 'resultLeader' | 'resultLoser'
//   ctx: { archetypeId?, fighter?, choice?, vars? }
// ─────────────────────────────────────────────────────────────────────────────
const COMMON1_LINES = {
  // コーチからの状況報告（アーキタイプ別 1 件）
  coachReport: {
    AUTHORITY: ['{factionName}内で{aName}と{bName}が肩肘張り合っています。リーダーが「実力で示せ」と。'],
    BOND:      ['{aName}と{bName}、ちょっと意地の張り合いが目立ってきまして……手合わせさせるのもアリかと。'],
    MERIT:     ['{factionName}内の序列確認の話が出ています。{aName}対{bName}、組んでみる価値はあります。'],
    HEEL:      ['{aName}と{bName}が派閥内で潰し合いを始めそうです。客に見せれば化けますよ。'],
    FACE:      ['切磋琢磨の象徴、ということで{aName}と{bName}を組ませる案が上がっています。'],
    COMBAT:    ['{aName}と{bName}、もう殴り合うしか落とし所がない感じです。'],
    _any:      ['{factionName}内で{aName}と{bName}の間に火種があります。試合で清算する手も。'],
  },
  // リーダーの一言（アーキタイプ × 性格、6×6 マトリクス）
  // personality: fiery / composed / grudging / airy / earnest / flippant
  leaderDemand: {
    AUTHORITY: {
      fiery:    ['揉めるなら、リングで決める。うちじゃそれが筋だ。'],
      composed: ['揉め事は、リングの上で答えを出す。それがうちの流儀だ。'],
      grudging: ['ぐだぐだ言うな。リングで黙らせろ。'],
      airy:     ['揉めてるなら、リングで決めちゃお? その方が早いよ。'],
      earnest:  ['筋を通すために、リングで結論を出させてください。'],
      flippant: ['口で揉めるくらいなら、さっさとリングでやれっての。'],
    },
    BOND: {
      fiery:    ['仲間同士で燻ってるのは見てられない。組んで、一回出し切ってくれ。'],
      composed: ['練習の延長として組みたい。お互い、後に引きずらないでほしい。'],
      grudging: ['……身内で揉めるな。組んで、終わらせろ。'],
      airy:     ['二人とも大事な仲間なんだから、ちゃんと向き合って? お願い。'],
      earnest:  ['仲間として、まっすぐぶつかってほしいんです。組ませてください。'],
      flippant: ['身内ゲンカ、リングで一回スカッとやっちゃおうよ。'],
    },
    MERIT: {
      fiery:    ['序列はリングで決まる。組ませろ、今すぐだ。'],
      composed: ['序列の話、リングで片付ける。組んでくれ。'],
      grudging: ['数字で示せ。話はそれからだ。'],
      airy:     ['強い方が前、ってシンプルでいいよね? 組んじゃお。'],
      earnest:  ['実力で順番を決めるのが、一番公平だと思います。組ませてください。'],
      flippant: ['口より結果でしょ。組んで、はっきりさせよ。'],
    },
    HEEL: {
      fiery:    ['内輪揉めも興行だ。客の前で潰し合え。'],
      composed: ['身内で潰し合う様こそ、客が見たい光景だ。組ませる。'],
      grudging: ['どうせ揉めるなら、金になる場所でやれ。'],
      airy:     ['うふふ、二人の喧嘩、客に見せちゃおうよ?'],
      earnest:  ['見世物として残酷な絵になる。覚悟の上で、組ませてもらいます。'],
      flippant: ['内輪のゴタゴタ、客に売りつけよーぜ。'],
    },
    FACE: {
      fiery:    ['切磋琢磨の象徴として組む。本気でやってくれ。'],
      composed: ['切磋琢磨の試合として組みたい。応援してくれる人に恥じない試合を。'],
      grudging: ['見せ場として組む。手を抜けば、こっちが許さん。'],
      airy:     ['ファンに頑張ってる二人を見せたいの。組んでくれる?'],
      earnest:  ['応援してくださる方々に誠実な試合をお見せしたい。組ませてください。'],
      flippant: ['ファン受けする絵になるっしょ。組んじゃおう。'],
    },
    COMBAT: {
      fiery:    ['口で決まらねぇなら、殴って決めろ。組むぞ。'],
      composed: ['言葉が尽きたなら、拳で語るしかない。組む。'],
      grudging: ['ごちゃごちゃ言うな。リングで殴り合え。'],
      airy:     ['二人ともムキムキしてるんだもん、リングで発散しちゃお?'],
      earnest:  ['拳でしか伝わらないものがあると思います。組ませてください。'],
      flippant: ['殴り合った方が早いっしょ、こういうのは。'],
    },
    _any: {
      _any: ['この件、リングで片付けたい。'],
    },
  },
  resultLeader: {
    A: { _any: ['組んだ甲斐があった。これで{factionName}は前に進める。'] },
    B: { _any: ['カードは別物にした。火種は残ったが、扱い方は俺が見ておく。'] },
    C: { _any: ['静観した。彼女らがどう収めるか、見届けるしかない。'] },
  },
  resultLoser: {
    A: ['負けた以上、ここで黙って引き下がるしかない……。'],
    B: ['組まれなかった。気持ちの行き場が、まだ無い。'],
    C: ['誰も止めない。胸の中で、また熱が膨らんだ。'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Common-5 派閥代表メディア取材 セリフテーブル（spec §6）
// 引き方: Engine.factions.getCommon5Line(category, ctx)
//   category: 'coachReport' | 'leaderQuote' | 'headline' | 'resultLeader'
//   ctx: { archetypeId?, choice?, fighter? }
// ─────────────────────────────────────────────────────────────────────────────
const COMMON5_LINES = {
  coachReport: {
    AUTHORITY: ['{leaderName}に取材オファーが来ています。掲載媒体は中堅誌です。'],
    BOND:      ['派閥特集の取材、来てます。{factionName}の家族的な空気を撮りたいそうで。'],
    MERIT:     ['{factionName}の実力主義路線を取り上げたい、という記者からの打診です。'],
    HEEL:      ['尖った媒体から{factionName}に取材依頼。挑発的な記事になる気配です。'],
    FACE:      ['ファン誌から{factionName}の特集オファー。模範的に対応すれば好感度アップかと。'],
    COMBAT:    ['格闘専門誌から{leaderName}にインタビュー。次の標的を聞きたいそうです。'],
    _any:      ['{factionName}に取材依頼が来ています。'],
  },
  // リーダーが取材で発する一言（A 選択時、アーキタイプ × 性格で軽く分岐）
  leaderQuoteA: {
    AUTHORITY: {
      fiery:    ['「うちに逆らう連中は、リングで黙らせるだけだ」'],
      composed: ['「うちには筋がある。そこを乱す者は、誰であれ容赦しない」'],
      grudging: ['「ふん、舐められるくらいなら噛み砕く方が早い」'],
      airy:     ['「うちのルールに従えない子は、ちょっと怖い目に遭うかもね?」'],
      earnest:  ['「うちの規律を守ることが、選手たちの将来を守ることだと思っています」'],
      flippant: ['「歯向かう奴は容赦しない、ってだけの話っしょ?」'],
    },
    BOND: {
      fiery:    ['「仲間がいるから戦える。それだけ」'],
      composed: ['「私たち、家族みたいな組です。それを守りたい」'],
      grudging: ['「……まあ、こいつらと一緒なら、悪くない」'],
      airy:     ['「えへへ、みんな大好きー!」'],
      earnest:  ['「メンバー一人ひとりを大切にしたい。そう思っています」'],
      flippant: ['「うちは仲良しグループ。仕事も雑談も同じ温度だよ」'],
    },
    MERIT: {
      fiery:    ['「結果を出せない奴に居場所はない。それだけだ」'],
      composed: ['「実力で順番が決まる。私はそれを正しいと思っている」'],
      grudging: ['「数字で示せ。話はそれからだ」'],
      airy:     ['「強い子が前に出る、それでいいよね?」'],
      earnest:  ['「実力主義は冷たく見えますが、誰にとっても公平だと信じています」'],
      flippant: ['「弱いまま居られても困るしねー」'],
    },
    HEEL: {
      fiery:    ['「ぬるい連中は、全員潰す。覚悟しとけ」'],
      composed: ['「綺麗事を並べる団体には、私たちは目障りでしょうね」'],
      grudging: ['「ふん、清く正しい連中ほど崩しがいがある」'],
      airy:     ['「うふふ、あの子たちが泣くまでやめないからね?」'],
      earnest:  ['「悪役と呼ばれることに、私たちは誇りを持っている」'],
      flippant: ['「いい子ぶってる連中、全員ぶっ壊すから」'],
    },
    FACE: {
      fiery:    ['「ファンの期待に背中を押されてる。だから倒れない」'],
      composed: ['「うちは王道を貫きます。それが応援してくれる方への返事です」'],
      grudging: ['「……まあ、応援してくれる人がいる以上、応えるしかない」'],
      airy:     ['「ファンのみんな、いつもありがとー!」'],
      earnest:  ['「応援してくださる方々の期待に、誠実に応え続けたい」'],
      flippant: ['「ファンに恥かかせない、それだけ意識してる」'],
    },
    COMBAT: {
      fiery:    ['「次に当たる相手は潰す。誰だろうと関係ねぇ」'],
      composed: ['「強い相手と当たるためなら、どこにでも乗り込みます」'],
      grudging: ['「殴り合えば、答えは出る。それだけだ」'],
      airy:     ['「強い子と当たれるなら、どこ行ってもいいよー!」'],
      earnest:  ['「強敵と戦うことでしか、私たちは成長できないと思っています」'],
      flippant: ['「次の獲物、もう決まってるんで」'],
    },
  },
  // 記事見出し（アーキタイプ別 A 結果）
  headlineA: {
    AUTHORITY: ['「{leaderName}、敵対派閥に宣戦布告」'],
    BOND:      ['「{factionName}、家族のような結束 ―― 専属密着レポ」'],
    MERIT:     ['「{factionName} ―― 実力主義の旗を掲げて」'],
    HEEL:      ['「{factionName}が業界の秩序を破壊する」'],
    FACE:      ['「{factionName}、王道を貫く ―― ファンへの誓い」'],
    COMBAT:    ['「{leaderName}、次の標的を名指し」'],
  },
  resultLeader: {
    A: { _any: ['記事は派手に出た。良くも悪くも{factionName}は注目されている。'] },
    B: { _any: ['コーチ同席で無難に切り抜けた。実りはささやかだが、実りはある。'] },
    C: { _any: ['取材は断った。{factionName}は静かなまま、しばらく沈む。'] },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Common-7 派閥間合同企画 セリフテーブル（spec §7）
// 引き方: Engine.factions.getCommon7Line(category, ctx)
//   category: 'coachReport' | 'leaderAQuote' | 'leaderBQuote' | 'planType' | 'resultLeader'
// ─────────────────────────────────────────────────────────────────────────────
const COMMON7_LINES = {
  coachReport: {
    _any: ['{factionAName}と{factionBName}、合同企画の打診が出てます。{planType}の方向で。'],
  },
  // 派閥ペアアーキタイプ × planType 組合わせから企画名を引く
  planType: {
    BOND_BOND:       '合同合宿・温泉旅行',
    MERIT_MERIT:     '合同練習会・OVR テスト',
    HEEL_HEEL:       'タッグマッチ興行',
    FACE_FACE:       'チャリティイベント',
    COMBAT_COMBAT:   'エキシビションマッチ',
    BOND_FACE:       'チャリティ興行',
    FACE_BOND:       'チャリティ興行',
    MERIT_COMBAT:    'エキシビションマッチ',
    COMBAT_MERIT:    'エキシビションマッチ',
    AUTHORITY_COMBAT:'リーダー対決興行',
    COMBAT_AUTHORITY:'リーダー対決興行',
    _any:            '合同企画',
  },
  leaderAQuote: {
    AUTHORITY: ['「うちと組むなら、こちらの流儀に合わせてもらう」'],
    BOND:      ['「一緒に何かできるなら、うちは大歓迎だよ」'],
    MERIT:     ['「お互い実力派だ。組む価値はある」'],
    HEEL:      ['「お前らとタッグ、悪くないな。客が嫌がる顔が見える」'],
    FACE:      ['「うちと一緒なら、ファンへの良い還元になる」'],
    COMBAT:    ['「殴り合える相手と組めるなら、断る理由がない」'],
    _any:      ['「組んでみるか。話を進めよう」'],
  },
  leaderBQuote: {
    AUTHORITY: ['「こちらも筋を通す。期待していい」'],
    BOND:      ['「楽しくやろう、お互い」'],
    MERIT:     ['「結果で応える。それでいいね」'],
    HEEL:      ['「派手にやろうぜ。客の悲鳴で迎えてやる」'],
    FACE:      ['「真っ直ぐな企画にしたい。協力する」'],
    COMBAT:    ['「容赦はなしだ。それでいいな」'],
    _any:      ['「乗った。よろしく頼む」'],
  },
  resultLeader: {
    A: { _any: ['{planType}が組まれた。両派閥の勢いが上がっている。'] },
    B: { _any: ['企画は流した。関係は今のままで充分、ということで。'] },
    C: { _any: ['返事は保留した。流れに任せたまま、話は静かに立ち消えた。'] },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Common-4 派閥合宿・慰労会 セリフ&情景テーブル（spec §5）
// 引き方: Engine.factions.getCommon4Line(archetypeId)
//   返り値: { headline, narration, leaderQuote }
//   archetype 別のトーンで研修合宿/家族旅行/追い込み合宿/秘密会合/遠征/対外練習を書き分ける。
// ─────────────────────────────────────────────────────────────────────────────
const COMMON4_LINES = {
  AUTHORITY: [
    {
      headline: '研修合宿',
      narration: '山あいの古い道場を借り切って、夜まで型と所作を叩き直す週となった。リーダーの目が光っている間、誰も笑わない。',
      leaderQuote: 'うちの看板を背負う以上、立ち姿から仕込み直す。',
    },
    {
      headline: '規律強化合宿',
      narration: '朝五時の点呼から始まり、夜の反省会まで一日が分単位で組まれていた。泣き言は許されない、ただ通すだけだ。',
      leaderQuote: '甘えを残したまま試合場には出さない。',
    },
  ],
  BOND: [
    {
      headline: '家族旅行のような合宿',
      narration: '海沿いの民宿で雑魚寝、夜は鍋を囲んで誰かが歌い出した。練習も笑い声と一緒に進む、そんな数日。',
      leaderQuote: '一緒に飯食って、一緒に転がるだけで強くなれる気がする。',
    },
    {
      headline: '慰労会',
      narration: '個室の座敷を貸し切って、ただ笑って食べて飲んだ。仕事の話より、お互いの近況の方が長く続いた。',
      leaderQuote: 'みんないてくれて助かってる。今日くらい、それだけ伝えたかった。',
    },
  ],
  MERIT: [
    {
      headline: '追い込み合宿',
      narration: 'スパーリング室の壁時計だけが回っている。誰も口を開かず、ただ受けて、返して、転がる。数字でしか測られない数日。',
      leaderQuote: '結果が全部だ。ここで上がらない奴は、本番でも上がらない。',
    },
    {
      headline: 'OVR 測定合宿',
      narration: '全員のスタッツをコーチが手帳に書き込んでいく。誰の数字が伸びたか、停滞したか、表に並んでいた。',
      leaderQuote: '数字は嘘つかない。次の興行までに、もう一段上げよう。',
    },
  ],
  HEEL: [
    {
      headline: '秘密会合',
      narration: '街外れの貸し切り。電気は最小限、誰が何を話したかは外には出ない。次に何を仕掛けるか、それだけが議題だった。',
      leaderQuote: '次の標的、決めとこうか。誰から壊す?',
    },
    {
      headline: '裏路地の集会',
      narration: '看板のない店の奥で集まり、煙草と酒の匂いの中で次の興行の話をしていた。表には絶対に出ない顔の打ち合わせ。',
      leaderQuote: 'いい子ぶってる連中が、一番崩しがいがある。',
    },
  ],
  FACE: [
    {
      headline: '地方ファンサービス遠征',
      narration: '小さな体育館で握手会と公開練習を兼ねた合宿。子どもたちのサインリクエストに、誰も嫌な顔をしなかった。',
      leaderQuote: 'うちを応援してくれる人たちに、まずは顔を見せに行く。それが先。',
    },
    {
      headline: '地域貢献合宿',
      narration: '地元の小学校で簡単なプロレス教室を開き、午後は商店街の清掃にまで顔を出した。汗をかく場所が変わっただけだ、と笑っていた。',
      leaderQuote: '応援してくれる街に、こっちからも何か返したいだけだよ。',
    },
  ],
  COMBAT: [
    {
      headline: '他団体道場での出稽古',
      narration: '道着を持ち込んで、知らない選手相手に何本もスパーリングをこなした。痣ばかり増えて帰ってきた、という顔つきだった。',
      leaderQuote: '同じ相手とばっかり殴り合ってても、強くなれねぇからな。',
    },
    {
      headline: '対外練習合宿',
      narration: '別団体の練習生に混じって、朝から晩まで実戦形式の打ち合いに突っ込んだ。誰も加減しない数日が、肌に刻まれた。',
      leaderQuote: '外の風当たりに当たんねぇと、うちの中身が腐る。',
    },
  ],
  _any: [
    {
      headline: '派閥合宿',
      narration: '揃って数日を一緒に過ごした。練習の合間にぽつぽつと、普段は出ない話まで出ていた。',
      leaderQuote: 'たまにはこういう時間も悪くない。',
    },
  ],
};

// C系: 興行集客力の積み上げ
const SHOW_DRAW_CONFIG = {
  positionWeights: [1.0, 0.7, 0.5, 0.35, 0.35, 0.35, 0.35, 0.35], // カード順重み
  junkWeightMult: 0.5,        // ゴミ試合の重み倍率
  promoStackPerMatch: 8,      // 出場選手promoStack→試合appeal加算
  promoStackGlobal: 2,        // 非出場選手promoStack→全体加算
  // 会場規模別の適正試合数
  minMatchesByVenue: [2, 2, 2, 3, 3, 3, 4, 4, 5, 5],
  shortPenalty1: 0.85,         // 適正-1試合
  shortPenalty2: 0.70,         // 適正-2試合以上
};

// D系: reach（orgPopベース）+ コンバージョン
const ATTENDANCE_V2_CONFIG = {
  // orgPop → reach（区間線形補間）
  // 旧calcAttendanceと同等以上の集客力を確保
  reachCurve: [
    [0, 50], [10, 180], [20, 400], [30, 750], [40, 1200],
    [50, 1900], [60, 3000], [70, 4500], [80, 6500],
    [90, 9500], [100, 14000],
  ],
  // orgPop → expectedDraw（「普通のカード」の集客力基準）
  // ※drawPower統合後auto-sim実測: 0-20帯≈110, 20-40帯≈290, 40-60帯≈365
  // auto-sim(ランダム編成)=draw1.0基準。人間プレイヤーはこれより良い→draw>1.0
  expectedDrawCurve: [
    [0, 20], [10, 90], [20, 160], [30, 270], [40, 340],
    [50, 380], [60, 410], [70, 440], [80, 470],
    [90, 500], [100, 530],
  ],
  drawFloor: 0.3,             // draw下限（惰性で来る層）
  drawScale: 0.7,             // draw = floor + (ratio × scale)
  drawCap: 2.0,               // draw上限
  // ソフトキャップ: reach超過分の減衰
  softCapBands: [
    { threshold: 1.0, efficiency: 0.7 },   // reach×1.0〜1.5: 超過分×0.7
    { threshold: 1.5, efficiency: 0.4 },   // reach×1.5〜2.0: 超過分×0.4
    { threshold: 2.0, efficiency: 0.2 },   // reach×2.0超: 超過分×0.2
  ],
};

// ショーレーティング（★1〜5）
const SHOW_RATING_CONFIG = {
  // MQスコア（max 60点）
  mqScoreMax: 60,
  mqPositionWeights: [1.0, 0.7, 0.5, 0.35, 0.35, 0.35, 0.35, 0.35],
  mqJunkThreshold: 30,         // MQ30以下は重み半減
  mqJunkWeightMult: 0.5,
  // ※auto-sim実測: orgPop40+帯のmqScore≈58/60(cap付近)→基準が甘すぎた
  expectedMQTotal: [0, 0, 110, 150, 180, 200, 220, 240, 260], // 試合数別基準（index=試合数）
  // 占有率スコア（max 15点）
  occupancyScoreTable: [
    { min: 0.95, score: 15 },
    { min: 0.80, score: 12 },
    { min: 0.60, score: 8 },
    { min: 0.40, score: 4 },
    { min: 0.25, score: 1 },
    { min: 0.00, score: -5 },
  ],
  // ボーナススコア（max 25点）
  bonusCap: 25,
  titleGreatMQThreshold: 70,
  titleGreatBonus: 8,
  titleAnyBonus: 3,
  rivalryResolvedBonus: 6,
  rivalryCardBonus: 2,
  fanExpectBonus: 4,            // 1件あたり
  matchCountFullBonus: 3,
  matchCountShortPenalty: -5,
  // ★変換（基準閾値 — 会場階層オフセットが加算される）
  starThresholds: [
    { min: 82, stars: 5 },
    { min: 70, stars: 4 },
    { min: 50, stars: 3 },
    { min: 30, stars: 2 },
    { min: 0,  stars: 1 },
  ],
  // 会場階層: 小規模ほど★基準が甘い。公民館の★3とアリーナの★3は別基準
  // venue 0-2(小規模-18) / 3-5(中規模-8) / 6-8(大規模±0) / 9(ドーム+3)
  venueTierOffset: [-18, -18, -18, -8, -8, -8, 0, 0, 0, 3],
  // 小規模会場(0-2)では占有率ペナルティを免除（cap小さすぎて不公平）
  venueOccPenaltyFloor: [0, 0, 0, -5, -5, -5, -5, -5, -5, -5],
  // ★ → heat変動
  heatDeltaByStars: { 5: 2.5, 4: 1.5, 3: 0, 2: -1.0, 1: -2.0 },
  // ★ → orgPop変動（逓減適用前の生値）
  orgPopDeltaByStars: { 5: 2.0, 4: 1.0, 3: 0, 2: -0.5, 1: -1.0 },
  // ★ → メディア放映収入倍率
  mediaMult: { 5: 2.0, 4: 1.4, 3: 1.0, 2: 0.6, 1: 0.3 },
};

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
  {id:'world', name:'団体王座', mqBonus:5, popBonus:3, attendBonus:1.15, emoji:'🏆'}
];

// Rivalry System
const RIVALRY_THRESHOLDS = [
  {tier:1, min:30, label:'因縁', color:'#fdcb6e', emoji:'⚡'},
  {tier:2, min:50, label:'宿敵', color:'#e17055', emoji:'🔥'},
  {tier:3, min:70, label:'宿命', color:'#d63031', emoji:'💥'},
  {tier:3, min:90, label:'宿命', color:'#d63031', emoji:'💥'}
];

// Phase 5: 片側因縁（一方的にライバル視している状態）
const ONESIDED_RIVALRY_MQ_BONUS = 0;
const ONESIDED_RIVALRY_LABEL = '片側因縁';
const ONESIDED_RIVALRY_EMOJI = '⚡';
const ONESIDED_RIVALRY_COLOR = '#ffeaa7';

// 因縁決着システム — 試合前の宣戦布告セリフ（ペア台詞）
const RIVALRY_CONFRONTATION_LINES = {
  attacker: {
    normal: {
      _default: [
        '今日こそ、決着をつける',
        'この因縁、今夜終わりにしよう',
        '超える。今日、ここで'
      ],
      ojousama: [
        '今日、決着をつけさせてもらうわね',
        'あなたを超えるわ。今日、ここで。'
      ],
      delinquent: [
        '今日で終わりだ。覚悟しろ',
        'ぶっ倒してやるよ、今夜な'
      ],
      cool: [
        '……決着をつける'
      ],
      seductive: [
        '今夜、終わりにしましょう？',
        'あなたを超えてみせるわ'
      ],
      polite: [
        '今日こそ、決着をつけさせていただきます'
      ],
      composed: [
        '…そろそろ、決着をつけようか'
      ]
    },
    bold: {
      _default: [
        '逃がさないよ。今日ここで決着をつけから',
        '何度やっても結果は同じだと思うけど。まぁ、かかってきなさい'
      ],
      ojousama: [
        '逃がしませんわよ。今日ここで決着をつけましょう？'
      ],
      delinquent: [
        '逃がさねえぞ。今日で終わりだ'
      ],
      cool: [
        '……来い。終わらせる'
      ],
      seductive: [
        '逃がさないわよ。今日で決着よ'
      ],
      polite: [
        '逃がしません。今日ここで決着です'
      ],
      composed: [
        '…逃がす気はないよ。今日で終わらせる'
      ]
    },
    quiet: {
      _default: [
        '………（静かに構える）'
      ],
      cool: [
        '……今日、決める'
      ],
      polite: [
        '…今日で…決着をつけさせてください'
      ],
      seductive: [
        '………（鋭い目で見据える）…覚悟してね'
      ],
      composed: [
        '……今日だ'
      ]
    },
    shy: {
      _default: [
        'えっと…今日は…その…負けたくないんです…'
      ],
      polite: [
        'あ、あの…決着を、つけさせてください…'
      ],
    },
    easygoing: {
      _default: [
        'さーて、今日で決着つけようか！',
        'そろそろケリつけようよ！'
      ],
      delinquent: [
        'よっしゃ、今日で終わりにしようぜ！'
      ],
      seductive: [
        'さーて、決着ね。全部出し切ってあげるわ'
      ],
      polite: [
        'さて、今日で決着をつけましょう！'
      ],
      ojousama: [
        'さて、今日で決着ですわ！'
      ],
      composed: [
        'さて、そろそろ片付けようか'
      ]
    },
    earnest: {
      _default: [
        '今日こそ決着をつけます',
        'この因縁、終わりにします'
      ],
      polite: [
        '本日、決着をつけさせていただきます'
      ],
      ojousama: [
        '今日こそ決着ですわ'
      ],
      seductive: [
        'この因縁、終わりにするわ'
      ],
      composed: [
        '…決着をつけます。今日で'
      ]
    },
    emotional: {
      _default: [
        '今日で……終わりにする……！ 絶対に……！'
      ],
      seductive: [
        '決着をつけるわ……っ……ふふ、ずっと待ってたの……',
        'もう逃がさない……っ……ふふ、覚悟して……'
      ],
      composed: [
        '…もういい。…リングで終わらせる'
      ]
    }
  },
  defender: {
    normal: {
      _default: [
        '……望むところよ',
        'それは終わってから言いなさい',
        'できるもんなら、やってみなさい'
      ],
      ojousama: [
        '……望むところよ',
        'やれるものならやってごらんなさい'
      ],
      delinquent: [
        '上等だ。来いよ',
        'やれるもんならやってみな'
      ],
      cool: [
        '……来い'
      ],
      seductive: [
        'いいわよ。来なさい'
      ],
      polite: [
        '……どうぞ。受けて立ちます'
      ],
      composed: [
        '…いいよ。来なよ'
      ]
    },
    bold: {
      _default: [
        'いいわよ。来なさい。相手してあげる',
        '何度来ても返り討ちにしてあげる'
      ],
      ojousama: [
        '飛んで火にいる夏の虫。…と言ったところね'
      ],
      delinquent: [
        '返り討ちにしてやるぜ'
      ],
      cool: [
        '……受けて立つ'
      ],
      polite: [
        '受けて立ちます。返り討ちにいたしますよ'
      ],
      composed: [
        '…受けて立つよ。好きにおいで'
      ]
    },
    quiet: {
      _default: [
        '………（静かに頷く）'
      ],
      cool: [
        '……いいだろう'
      ],
      polite: [
        '…はい…受けて立ちます'
      ],
      seductive: [
        '………来なさい'
      ],
      composed: [
        '……（静かに頷く）…来なよ'
      ]
    },
    shy: {
      _default: [
        '…受けます。…頑張ります…'
      ],
      polite: [
        'は、はい…受けて立ちます…'
      ],
    },
    easygoing: {
      _default: [
        'いいよ、来なよ！ 相手してあげる！'
      ],
      delinquent: [
        'おう、来いよ！'
      ],
      seductive: [
        'いいわよ、来なさい。相手してあげるわ'
      ],
      polite: [
        'どうぞ、来てください！ お相手します！'
      ],
      ojousama: [
        'よろしくてよ！ お相手いたしますわ'
      ],
      composed: [
        'いいよ、来なよ。相手してあげる'
      ]
    },
    earnest: {
      _default: [
        '受けて立ちます。全力で',
        '悔いのない試合にしましょう'
      ],
      polite: [
        'お受けいたします。全力で参ります'
      ],
      seductive: [
        '受けて立つわ。全力で'
      ],
      composed: [
        '…受けて立ちます。全力で'
      ]
    },
    emotional: {
      _default: [
        '来なさい……！ 全部受け止めてやる……！'
      ],
      seductive: [
        '受けて立つわ……っ……ふふ、来なさい……'
      ],
      composed: [
        '…いいよ。…来なよ'
      ]
    }
  },
  fateAttacker: {
    normal: {
      _default: [
        '長かった……今日で終わりにするよ',
        'あなたがいなければ、今の私はいなかったかもね。でも今日で終わりにするよ'
      ],
      ojousama: [
        '長かったわね……でも今日で、終わりにする'
      ],
      delinquent: [
        '長かったな……今日で終わりだ'
      ],
      cool: [
        '……終わらせに来た'
      ],
      seductive: [
        '長かったわね……今夜で最後よ'
      ],
      polite: [
        '長かったです……今日で終わりにさせてください'
      ],
      composed: [
        '…長かったね。…今日で終わりにしよう'
      ]
    },
    bold: {
      _default: [
        '何度もやったけどさ。でも今日で最後よ',
        'さて、この間の続きね…'
      ],
      cool: [
        '……最後だ。全てを出す'
      ],
      polite: [
        '最後です。全力で参ります'
      ],
      composed: [
        '…最後だね。…全部出すよ'
      ]
    },
    quiet: {
      _default: [
        '………（深く息を吸い、前に出る）'
      ],
      seductive: [
        '………（深い呼吸）…終わらせましょう'
      ],
      composed: [
        '………（静かに息を吸い、前を見る）'
      ]
    },
    shy: {
      _default: [
        'ずっと…この日のことを考えてました…行きます…'
      ],
      polite: [
        'あ、あなたは…わたしの、運命の相手です…さあ、行きましょう…'
      ],
    },
    easygoing: {
      _default: [
        '最後の一戦だ。全部出し切ろう！'
      ],
      seductive: [
        '最後の一戦ね。…全部出し切るわ'
      ],
      polite: [
        '最後の一戦です。全部出し切ります！'
      ],
      ojousama: [
        '最後の一戦ですわ！ 全力で参りますの'
      ],
      composed: [
        '…最後か。全部出し切ろう'
      ]
    },
    earnest: {
      _default: [
        'この因縁、今日終わりにします。全力で'
      ],
      seductive: [
        'この因縁、今日終わりにするわ。全力で'
      ],
      composed: [
        '…今日で終わりにします'
      ]
    },
    emotional: {
      _default: [
        'ずっと……ずっとこの日を……！'
      ],
      seductive: [
        'あなたが運命の相手……っ……ふふ、燃えるわね……'
      ],
      composed: [
        '…ずっと待ってた。…行くよ'
      ]
    }
  },
  fateDefender: {
    normal: {
      _default: [
        'うん……最高の終わりにするよ',
        'それはお互い様よ。……全力で行くよ！'
      ],
      ojousama: [
        '最高の結末を見せてあげる'
      ],
      delinquent: [
        'ああ。最高の終わりにしようぜ'
      ],
      cool: [
        '……わかっている'
      ],
      seductive: [
        '最高の終わりにしましょう'
      ],
      polite: [
        'はい……最高の結末にしましょう'
      ],
      composed: [
        '…うん。…最高の結末にしよう'
      ]
    },
    bold: {
      _default: [
        'わかってる。全力で来なよ。',
        '相手してあげる'
      ],
      cool: [
        '……全力で来い'
      ],
      polite: [
        'わかっています。全力で来てください'
      ],
      composed: [
        '…わかってる。全力でおいで'
      ]
    },
    quiet: {
      _default: [
        '………（小さく微笑み、構える）'
      ],
      seductive: [
        '………（微笑み、構える）…ええ'
      ],
      composed: [
        '………（静かに微笑み、構える）'
      ]
    },
    shy: {
      _default: [
        '…うん…わかってる…。行こう…'
      ],
      polite: [
        '運命なら…受けて立たないと、いけませんね…'
      ],
    },
    easygoing: {
      _default: [
        'おう！ 最高の締めにしようぜ！'
      ],
      seductive: [
        '最高の締めにしましょう？ …全力でね'
      ],
      polite: [
        '最高の締めにしましょう！ 全力です！'
      ],
      ojousama: [
        '最高の結末にいたしましょう！'
      ],
      composed: [
        '…うん。最高の締めにしよう'
      ]
    },
    earnest: {
      _default: [
        '全力でお受けします。悔いのない試合を'
      ],
      seductive: [
        '全力でお受けするわ。悔いのない試合にしましょう'
      ],
      composed: [
        '…全力で受けます'
      ]
    },
    emotional: {
      _default: [
        '来なさい……！ 全部……受け止める……！'
      ],
      seductive: [
        '運命ね……っ……ふふ、その挑戦、受けるわ……'
      ],
      composed: [
        '…来なよ。…全部受け止める'
      ]
    }
  }
};

// 因縁決着システム — 試合後の決着セリフ（personality×archetype）
const RIVALRY_RESOLUTION_LINES = {
  winner: {
    normal: {
      _default: [
        '一つ、決着がついた…でもまだ終わりじゃない気がする',
        '勝てた…けど、ここからだと思う'
      ],
      ojousama: [
        '一つ決着がついたわね…でも、まだ終わった気がしない'
      ],
      delinquent: [
        'ひとまず決着だ…でも、なんだろ。まだモヤモヤすんな'
      ],
      seductive: [
        'ひとつ片がついたわ…でも、まだ気になるの'
      ],
      cool: [
        '……一つ、片がついた。……だが、これで終わりではない'
      ],
      polite: [
        '一つ決着がつきました…でも…まだ終わった気がしません'
      ],
      composed: [
        '…一つ片がついた。…でも、まだ終わった気はしないね'
      ]
    },
    bold: {
      _default: [
        '勝った。でもこの程度じゃ終わらないでしょ？',
        '今日は私の勝ち。…次はどうなるかわからないけど'
      ],
      ojousama: [
        '当然の勝利。…でも、これで折れては居ないのでしょうね'
      ],
      delinquent: [
        '一個返したぞ。…でもまだ足りねえ気がすんだよ'
      ],
      cool: [
        '…一つ片がついた。…まだ先がある'
      ],
      seductive: [
        '今日は私の勝ち。…でも、まだ飽きてないわよ？'
      ],
      polite: [
        '今日は勝たせていただきました。…でもこの程度では終わりませんね'
      ],
      composed: [
        '…一つ勝った。…でもまだ先があるだろうね'
      ]
    },
    quiet: {
      _default: [
        '………一つ、終わった（でもまだ、目が離せない）'
      ],
      cool: [
        '…一区切り。…でも、終わった気はしない'
      ],
      polite: [
        '…ひとまず…決着です…でも…'
      ],
      seductive: [
        '………（相手を見つめ）…まだよ'
      ],
      composed: [
        '…一つ、終わったか'
      ]
    },
    shy: {
      _default: [
        'か、勝てた…けど…なんだろ…終わった気がしない…'
      ],
      polite: [
        'か、勝てました…これで、終わりにしましょう…'
      ],
    },
    easygoing: {
      _default: [
        'よっしゃ一個勝ち！ …でもさ、まだ続きがありそうだよね'
      ],
      delinquent: [
        'いよっしゃ！ …でもよ、なんかまだスッキリしねえんだよな'
      ],
      seductive: [
        '勝っちゃった〜。…でもね、まだ終わってない気がするの'
      ],
      polite: [
        '一つ勝たせていただきました！ …でもまだ続きがありそうですよね'
      ],
      ojousama: [
        '一つ勝ちましたわ！ …でもまだ終わった気がしませんの'
      ],
      composed: [
        '勝ったか。…でもまだ、終わった気はしないね'
      ]
    },
    earnest: {
      _default: [
        '一つ決着がつきました。…でも、まだ続く気がします',
        '勝ちました…けど、ここからが本番だと思っています'
      ],
      polite: [
        'ひとまず決着です…でも、まだ先がある気がするんです'
      ],
      ojousama: [
        'ひとつ結果を出しましたわ…でも、まだ終わりではありませんわね'
      ],
      seductive: [
        '一つ勝ったわ。…でも、これで終わりとは思えないの'
      ],
      composed: [
        '…一つ決着がつきました。…でもまだ、先がある気がします'
      ]
    },
    emotional: {
      _default: [
        '勝った…！でも…なんで涙が止まらないの…まだ終わってないのに…！'
      ],
      seductive: [
        '勝ったわ……っ……ふふ、これでお終いね……'
      ],
      composed: [
        '…勝った。…でもなんだろう、この感じ。…まだ終わらないね'
      ]
    }
  },
  loser: {
    normal: {
      _default: [
        '負けた…悔しい。でも、これで終わりなんかじゃない',
        '悔しい。今日は負けた。…でも、次がある。絶対に'
      ],
      ojousama: [
        '負けたわね…でも、これで終わりとは思っていないの'
      ],
      delinquent: [
        'くそっ…負けた。…でもこれで終わりだと思うなよ'
      ],
      seductive: [
        '負けたわ…でも、まだ終わりじゃないの'
      ],
      cool: [
        '……負けた。……だが、終わりではない'
      ],
      polite: [
        '負けました…悔しいです。でも…次は必ず'
      ],
      composed: [
        '…負けたか。…でも、これで終わりじゃないよ'
      ]
    },
    bold: {
      _default: [
        '今日は完敗。…でも、見てなさいよ！',
        'この借りは必ず返す。…次こそは'
      ],
      ojousama: [
        '負けた？…ですが、次がありましてよ！'
      ],
      delinquent: [
        'くっそ…完敗だ。…だがこの借りは絶対返すからな'
      ],
      cool: [
        '…認める。…だが、次がある'
      ],
      seductive: [
        '完敗ね…でも、次は私の番よ。覚えておきなさい'
      ],
      polite: [
        '今日は完敗です。…ですが、次がございます'
      ],
      composed: [
        '…完敗だね。…でも、次がある'
      ]
    },
    quiet: {
      _default: [
        '………（拳を握りしめ、相手の背中を見ている）'
      ],
      cool: [
        '…今日は負けた。…次だ'
      ],
      polite: [
        '…負けました。…でも…次は、必ず…'
      ],
      seductive: [
        '………（拳を握る）…次は、ないわよ'
      ],
      composed: [
        '…負けたか。…次だ'
      ]
    },
    shy: {
      _default: [
        '…負けちゃった…悔しい…でも…次こそは…絶対…'
      ],
      polite: [
        'ま、負けました…これで、終わりですね…'
      ],
    },
    easygoing: {
      _default: [
        '負けた〜…くやし〜！ でもまだ続くよね？ 次は負けないから！'
      ],
      delinquent: [
        'ちくしょ〜…負けた！ でもよ、次は絶対やり返すからな！'
      ],
      seductive: [
        '負けちゃったわ〜…でもね、次は覚悟してね？'
      ],
      polite: [
        '負けちゃいました…！ でも次は負けません！'
      ],
      ojousama: [
        '負けてしまいましたわ…でも次はお返ししますの'
      ],
      composed: [
        '負けたか。…ま、次があるさ'
      ]
    },
    earnest: {
      _default: [
        '負けました…でも諦めません。必ず借りを返します',
        '悔しいです。…でも、この悔しさを次に活かします'
      ],
      polite: [
        '負けました…でも、次の機会に必ず結果を出してみせます'
      ],
      ojousama: [
        '負けましたわ…ですが、この借りは必ずお返ししますわ'
      ],
      seductive: [
        '負けたわ…でも、この悔しさがあるから次がある。そう思うの'
      ],
      composed: [
        '…負けました。…でも、次は変えてみせます'
      ]
    },
    emotional: {
      _default: [
        '悔しい…！悔しい…！ でも…絶対…次は…負けない…！'
      ],
      seductive: [
        '負けたわ……っ……ふふ、悔しいけど終わりね……'
      ],
      composed: [
        '…っ…悔しいね。…でも、次こそは'
      ]
    }
  },
  fateWinner: {
    normal: {
      _default: [
        'ずっと追いかけてきた答えが…一つ、出た。…でもまだ、終わらない'
      ],
      ojousama: [
        'ようやく…一つ答えがたわね。…でも、終わりではないわよ'
      ],
      delinquent: [
        'やっと…一つ決着がついた…でもよ、なんかまだ胸がざわつくんだ'
      ],
      seductive: [
        'ようやく一つ答えが出たわ…でも、まだ終わりじゃないの'
      ],
      cool: [
        '……一つ、答えが出た。……だが、まだ終わらない'
      ],
      polite: [
        'ようやく…一つ答えが出ました。…でもまだ終わりではありません'
      ],
      composed: [
        '…ようやく一つ答えが出た。…でも、まだ終わらないだろうね'
      ]
    },
    bold: {
      _default: [
        '一つ勝った…でも、まだ先がある。そうでしょ？',
        'これで一区切りか。…でも全部終わりってわけじゃないよね？'
      ],
      cool: [
        '…一つ決着がついた。…だが、まだ先がある'
      ],
      polite: [
        '一つ勝ちました。…でもまだ先がございます'
      ],
      composed: [
        '…やっと一つ。…でも、まだ先がある'
      ]
    },
    quiet: {
      _default: [
        '………（深く息を吐く。目は、まだ相手を追っている）'
      ],
      seductive: [
        '………（深い息）…でも、まだよ'
      ],
      composed: [
        '………（静かに息を吐く）…一つ、か'
      ]
    },
    shy: {
      _default: [
        '勝った…のかな…でも…終わった気がしない…（涙が溢れている）'
      ],
      polite: [
        '運命の戦いに…か、勝ちました…'
      ],
    },
    easygoing: {
      _default: [
        'やっと一つ勝てた…！ でもさ、まだ終わってないよね…？'
      ],
      polite: [
        'やっと一つ勝てました…！ でもまだ終わってないですよね…？'
      ],
      ojousama: [
        'やっと一つ勝ちましたわ…！ でもまだ終わっておりませんわね'
      ],
      composed: [
        'やっと一つ勝てた。…でも、まだ終わってないね'
      ]
    },
    earnest: {
      _default: [
        '長い戦いでした…一つ答えは出た。でも、ここからだと思います'
      ],
      composed: [
        '…長かった。一つ答えが出た。…でも、まだ先がある'
      ]
    },
    emotional: {
      _default: [
        '勝った…！やっと…！ でも…まだ泣きたくない…まだ続くから…！（涙）'
      ],
      seductive: [
        '運命の戦いに勝った……っ……ふふ、最高の瞬間だったわ……'
      ],
      composed: [
        '…っ…やっと。…でも、まだだよ。…まだ続くから'
      ]
    }
  },
  fateLoser: {
    normal: {
      _default: [
        '今日は…敵わなかった。でも、この悔しさを……次へ！'
      ],
      ojousama: [
        '今日は敵わなかったけれど、これで終わりではなくてよ'
      ],
      delinquent: [
        'くそっ…敵わなかった。…でもよ、まだ終わってねえぞ'
      ],
      seductive: [
        '敵わなかったわ…でも、終わりだなんて思わないでね'
      ],
      cool: [
        '……敵わなかった。……だが、終わりではない'
      ],
      polite: [
        '今日は…敵いませんでした。でもこれで終わりではありません'
      ],
      composed: [
        '…敵わなかった。…でも、これで終わりじゃない'
      ]
    },
    bold: {
      _default: [
        '負けっぱなしじゃ終われない。…必ず超えてみせる',
        '全力で負けた。…次が欲しい。絶対に'
      ],
      cool: [
        '…全力で届かなかった。…だからこそ、次だ'
      ],
      polite: [
        '負けました。…ですが、必ず超えてみせます'
      ],
      composed: [
        '…届かなかった。…でも、次は変える'
      ]
    },
    quiet: {
      _default: [
        '………（唇を噛んで、静かに立ち上がる）'
      ],
      seductive: [
        '………（唇を噛む）…まだよ'
      ],
      composed: [
        '………（静かに立ち上がり、前を見る）'
      ]
    },
    shy: {
      _default: [
        '…負けちゃった…でも…まだ…諦めたくない…です…（涙を拭いている）'
      ],
      polite: [
        '運命の戦いに…ま、負けました…でも、悔いは、ないです…'
      ],
    },
    easygoing: {
      _default: [
        '負けた〜…まいったな。…でもさ、次があるでしょ？ ね？'
      ],
      polite: [
        '負けちゃいました…でもまだ次がありますよね？'
      ],
      ojousama: [
        '負けてしまいましたわ…でも次がありますわよね？'
      ],
      composed: [
        '負けたか。…ま、次があるさ'
      ]
    },
    earnest: {
      _default: [
        '負けました。…でも、この悔しさを糧にまた挑みます'
      ],
      composed: [
        '…負けました。…でも、ここからです'
      ]
    },
    emotional: {
      _default: [
        '悔しい…！でも…ここで終わるもんか…！ 絶対また…！（涙）'
      ],
      seductive: [
        '負けたわ……っ……でも、運命の試合だったの、悔いはないわ……'
      ],
      composed: [
        '…っ…悔しい。…でも、終わらない'
      ]
    }
  }
};

// MQ外部ボーナス合計の上限（因縁+タイトル+観客の合計キャップ。外部ボーナス整理で15→12）
const MQ_EXTERNAL_CAP = 12;

// 好敵手（決着2回完了後の永続ステータス）
const GOODRIVAL_MQ_BONUS = 2;
const GOODRIVAL_LABEL = '好敵手';
const GOODRIVAL_EMOJI = '🤝';
const GOODRIVAL_COLOR = '#74b9ff';
const BITTER_RIVAL_MQ_BONUS = 2;
const BITTER_RIVAL_LABEL = '宿怨';
const BITTER_RIVAL_EMOJI = '💀';
const BITTER_RIVAL_COLOR = '#636e72';

// ══════════════════════════════════════════════════════════
//  E2: 演出テキスト — 因縁・関係イベント用
// ══════════════════════════════════════════════════════════

// ── 好敵手ルート決着セリフ（personality×archetype）──
const GOODRIVAL_RESOLUTION_LINES = {
  winner: {
    normal: {
      _default: [
        'アイツがいたから、ここまで来られた。……ありがとう',
        '最高のライバルだよ。これからも、よろしく'
      ],
      ojousama: [
        'あなたがいてくださったから、ここまで来られましたわ。……感謝いたします'
      ],
      delinquent: [
        'お前がいたから強くなれた。……サンキュな'
      ],
      cool: [
        '……認めている。これからも、共に'
      ],
      seductive: [
        'あなたがいたから輝けたわ。……ありがとう'
      ],
      polite: [
        'あなたのおかげでここまで来れました。…ありがとうございます'
      ],
      composed: [
        '…あんたがいたから、ここまで来れた。……ありがとう'
      ]
    },
    bold: {
      _default: [
        'あなたとの戦いは私の誇り。これからも全力で来なさい',
        '最高のライバルよ。胸を張って'
      ],
      ojousama: [
        '貴方は悪くない相手ですわね。また挑戦して来なさいな'
      ],
      delinquent: [
        'お前は俺の誇りだ。これからも来いよ'
      ],
      cool: [
        '……好敵手だ。それ以上の言葉はいらない'
      ],
      seductive: [
        'あなたとの戦いは私の誇りよ。…これからもよろしくね'
      ],
      polite: [
        'あなたとの戦いは私の誇りです。これからもよろしくお願いします'
      ],
      composed: [
        '…最高の相手だった。…これからもよろしく'
      ]
    },
    quiet: {
      _default: [
        '………（手を差し出す）'
      ],
      cool: [
        '……ありがとう。……これからも'
      ],
      polite: [
        '…ありがとうございました。…これからも、お願いします'
      ],
      seductive: [
        '………（手を差し出す）…ありがとう…ね'
      ],
      composed: [
        '……ありがとう。…これからも'
      ]
    },
    shy: {
      _default: [
        'あの…あなたがいてくれたから…ここまで来れたんです…（手を差し出す）'
      ],
      polite: [
        'か、勝たせていただきました…でも、あの方も素晴らしかったです…'
      ],
    },
    easygoing: {
      _default: [
        '最高の相手だったよ！ これからも一緒に上を目指そう！'
      ],
      delinquent: [
        '最高だったぜ！ まだまだ一緒にやろうな！'
      ],
      seductive: [
        '最高の相手だったわ。…これからもよろしくね'
      ],
      polite: [
        '最高の相手でした！ これからもよろしくお願いします！'
      ],
      ojousama: [
        '最高のお相手でしたわ！ これからもよろしくですの'
      ],
      composed: [
        '最高の相手だったよ。…これからもよろしく'
      ]
    },
    earnest: {
      _default: [
        'あなたのおかげで成長できました。……これからも、よろしくお願いします',
        'ここまでの全試合に感謝します。これからもよろしくお願いします'
      ],
      polite: [
        'あなたのおかげで成長できました。これからもよろしくお願いいたします'
      ],
      seductive: [
        'あなたのおかげで成長できたわ。…これからもよろしくね'
      ],
      ojousama: [
        'あなたのおかげで成長できましたわ。これからもよろしくお願いいたしますわ'
      ],
      composed: [
        '…あなたのおかげでここまで来れた。…これからも、よろしく'
      ]
    },
    emotional: {
      _default: [
        'ありがとう……！ あなたがいなかったら……今の私はいない……！（涙）'
      ],
      seductive: [
        '勝ったわ……っ……ふふ、あの子だからこそ、最高の試合になったの……'
      ],
      composed: [
        '…っ…ありがとう。…あんたがいたから、ここまで来れた'
      ]
    }
  },
  loser: {
    normal: {
      _default: [
        '負けた。でも……しょうがないか。悪くない…かな？',
        '悔しいなぁ！……でも、悪くない'
      ],
      ojousama: [
        '負けましたわ。でも……あなたが好敵手で良かった'
      ],
      delinquent: [
        '負けたけどよ……清々しいぜ。お前が相手で良かった'
      ],
      polite: [
        '負けました。でも…あなたが好敵手で良かったです'
      ],
      composed: [
        '…負けたか。…でも、悪くない。あんたが相手でよかった'
      ]
    },
    bold: {
      _default: [
        '完敗ね。でも悔いはない。最高の相手だった',
        '負けた。けど—悔いは無いよ'
      ],
      cool: [
        '……負けた。だが……悪くない'
      ],
      seductive: [
        '完敗ね。…でも悔いはないわ。最高の相手だった'
      ],
      polite: [
        '完敗です。でも悔いはありません。最高の相手でした'
      ],
      composed: [
        '…完敗。…でも悔いはないよ'
      ]
    },
    quiet: {
      _default: [
        '………（涙を拭い、静かに笑う）'
      ],
      cool: [
        '……負けた。……でも、悔いはない'
      ],
      polite: [
        '…ありがとう、ございました…（深々とお辞儀）'
      ],
      seductive: [
        '………（涙を拭い、微笑む）…ありがとう'
      ],
      composed: [
        '…負けたけど…悪くない'
      ]
    },
    shy: {
      _default: [
        '負けちゃった…でも…また戦えるなら…それでいいかな…（涙）'
      ],
      polite: [
        'ま、負けました…でも、あの方となら、後悔はありません…'
      ],
    },
    easygoing: {
      _default: [
        '負けたけど、なんか笑っちゃうよ。最高の相手だもん！'
      ],
      delinquent: [
        '負けたけど……へへ、最高だったぜ'
      ],
      seductive: [
        '負けちゃった。…でも笑えるわ。最高の相手だもの'
      ],
      polite: [
        '負けちゃいました。でも笑えちゃいますね。最高の相手でした！'
      ],
      ojousama: [
        '負けてしまいましたわ。でも笑みが零れますの。最高のお相手でしたわ'
      ],
      composed: [
        '負けたけど…ま、笑えるよ。最高の相手だった'
      ]
    },
    earnest: {
      _default: [
        '負けました。でもこの試合は一生忘れません',
        '悔しい。でも……ありがとうございます。最高の相手です'
      ],
      polite: [
        '負けました。でもこの試合は一生の宝です'
      ],
      seductive: [
        '負けたわ。でもこの試合は一生忘れない'
      ],
      ojousama: [
        '負けましたわ。でもこの試合は一生の宝ですわ'
      ],
      composed: [
        '…負けました。でもこの試合は忘れません。…ありがとう'
      ]
    },
    emotional: {
      _default: [
        '負けた……！ でも嬉しい……！ 最高だった……！（号泣）'
      ],
      seductive: [
        '負けたわ……っ……でも、あの子相手なら悔いはないの……ふふ……'
      ],
      composed: [
        '…っ…負けたけど…最高だった。…ありがとう'
      ]
    }
  }
};

// ── 宿怨ルート決着セリフ（personality×archetype）──
const BITTER_RESOLUTION_LINES = {
  winner: {
    normal: {
      _default: [
        '……終わった。もう二度と、あんたの顔は見たくない',
        '決着はついた。これで終わりよ'
      ],
      ojousama: [
        'これで決着ね。もう……関わりたくもない。'
      ],
      delinquent: [
        '終わりだ。もう目の前に現れるな'
      ],
      cool: [
        '……決着だ。消えろ'
      ],
      seductive: [
        '終わったわ。もう……あなたの顔は見たくない'
      ],
      polite: [
        '……終わりました。もう二度と…関わりたくありません'
      ],
      composed: [
        '…終わった。…もう、いいだろう'
      ]
    },
    bold: {
      _default: [
        '終わったわ。',
        'ようやく決着ね。もう振り返らない'
      ],
      ojousama: [
        '虫けらを叩き潰すのは気分がいいわね'
      ],
      delinquent: [
        'ぶっ潰した。文句あるか'
      ],
      cool: [
        '……終わりだ'
      ],
      seductive: [
        'もう終わりよ。二度と関わりたくないの'
      ],
      polite: [
        '終わりです。もう振り返りません'
      ],
      composed: [
        '…終わった。もう振り返らない'
      ]
    },
    quiet: {
      _default: [
        '………（無言で背を向ける）'
      ],
      cool: [
        '……もう終わった'
      ],
      seductive: [
        '………もう…終わりよ'
      ],
      polite: [
        '………もう…終わりです'
      ],
      composed: [
        '………（静かに背を向ける）'
      ]
    },
    shy: {
      _default: [
        '…もう関わりたくない…です…（震えが止まらない）'
      ],
      polite: [
        '勝てました…でも、もう…これで終わりにしませんか…？'
      ],
    },
    easygoing: {
      _default: [
        '……はぁ。やっと終わった。もう勘弁してくれ'
      ],
      delinquent: [
        '……ふぅ。もう絡んでくんなよ'
      ],
      seductive: [
        '…ふぅ。やっと終わったわね。もう勘弁して'
      ],
      polite: [
        '……やっと終わりました。もう勘弁してください'
      ],
      ojousama: [
        '……やっと終わりましたわ。もうご勘弁くださいまし'
      ],
      composed: [
        '…ふぅ。やっと終わったか'
      ]
    },
    earnest: {
      _default: [
        '決着がつきました。……もう、十分です'
      ],
      polite: [
        '決着がつきました。……もう、十分です'
      ],
      seductive: [
        '決着がついたわ。…もう、十分よ'
      ],
      ojousama: [
        '決着がつきましたわ。…もう、十分ですの'
      ],
      composed: [
        '…決着がつきました。…もう十分です'
      ]
    },
    emotional: {
      _default: [
        '終わった……！ やっと……終わったんだ……！'
      ],
      seductive: [
        '勝った……っ……これで全部、過去にできるわね……ふふ、ありがとう……'
      ],
      composed: [
        '…終わった。…もういい'
      ]
    }
  },
  loser: {
    normal: {
      _default: [
        '……認めない。こんなの認めない',
        '負けた？ ……まだ終わりじゃない！'
      ],
      ojousama: [
        '認めない……こんな結末、認められない……！'
      ],
      delinquent: [
        'ちくしょう……覚えてろ……！'
      ],
      cool: [
        '……今日は負けた。だが……終わらない'
      ],
      seductive: [
        '……覚えていなさい。これで終わりだと思わないで'
      ],
      polite: [
        '……認めません。こんな結末は…認められません'
      ],
      composed: [
        '…認めない。…これで終わりだと思うなよ'
      ]
    },
    bold: {
      _default: [
        '認めない。…この借りは必ず返す',
        '……もう一度。もう一度やらせて……！'
      ],
      ojousama: [
        '認めない……！ この借りは……必ず返す……！'
      ],
      seductive: [
        '認めないわ…この借りは必ず返すから'
      ],
      polite: [
        '認めません…この借りは必ず返します'
      ],
      composed: [
        '…認めない。…必ず返す'
      ]
    },
    quiet: {
      _default: [
        '………（拳を握りしめ、唇を噛む）'
      ],
      cool: [
        '………（静かに目を閉じる）'
      ],
      seductive: [
        '………認めない…わ'
      ],
      polite: [
        '………認め…ません'
      ],
      composed: [
        '………（静かに拳を握る）'
      ]
    },
    shy: {
      _default: [
        '…もう…何も考えたくない…………'
      ],
      polite: [
        'ま、負けました…悔しいです…でも、これ以上恨んだりはしません…'
      ],
    },
    easygoing: {
      _default: [
        '……ははっ。参ったよ。でも忘れないからな'
      ],
      delinquent: [
        'くそっ……忘れねえぞ……'
      ],
      seductive: [
        '…参ったわね。でも…忘れないわよ'
      ],
      polite: [
        '……参りました。でも…忘れませんから'
      ],
      ojousama: [
        '……参りましたわ。でも…忘れませんことよ'
      ],
      composed: [
        '…参ったね。…でも忘れないよ'
      ]
    },
    earnest: {
      _default: [
        '認めません……こんな結末は認めません……！',
        '負けた……でもこれで終わりなんかじゃない……！'
      ],
      polite: [
        '……認めません。こんな結末は……認められません'
      ],
      seductive: [
        '認めないわ…こんな結末は…認められないの'
      ],
      ojousama: [
        '認めませんわ。こんな結末は…認められませんの'
      ],
      composed: [
        '…認めません。…この結末は'
      ]
    },
    emotional: {
      _default: [
        '嫌だ……！ こんなの嫌だ……！ 認めない……！（叫ぶ）'
      ],
      seductive: [
        '負けたわ……っ……でも、もう憎しみは終わり……ふふ、清々しいの……'
      ],
      composed: [
        '…っ…認めない。…絶対に'
      ]
    }
  }
};

// ── カード編成時 宣戦布告テキスト（rivalry帯別）──
const RIVALRY_CONFRONTATION_LINES_70 = {
  attacker: {
    normal: {
      _default: [
        '逃げ場はないよ。ここで終わらせるから',
        'あなたの存在が、邪魔だった。今夜それを終わらせる',
        'この関係もここで終わりだよ'
      ],
      ojousama: [
        'もう逃がさなくてよ。ここで終わり。'
      ],
      delinquent: [
        '逃げ場はねえ。ここで終わりだ',
        'てめえとの因縁、今夜ぶった斬る'
      ],
      cool: [
        '……逃がさない。終わらせる'
      ],
      seductive: [
        'もう逃げられないわよ。終わりにしましょう'
      ],
      polite: [
        '逃がしません。ここで…終わらせます'
      ],
      composed: [
        '…逃がさないよ。ここで終わらせる'
      ]
    },
    bold: {
      _default: [
        'ずっと待ってた。今日、超えてみせる',
        'もう後はない。ここで決める'
      ],
      ojousama: [
        'この日を待ちわびていたわ。何度も夢で見るくらいに。'
      ],
      delinquent: [
        'ずっと待ってたんだ、この瞬間を'
      ],
      cool: [
        '……待った。この日を'
      ],
      seductive: [
        'ずっと待っていたのよ。今日…超えてみせるわ'
      ],
      polite: [
        'ずっと待っていました。今日、超えてみせます'
      ],
      composed: [
        '…この日を待ってた。…終わらせるよ'
      ]
    },
    quiet: {
      _default: [
        '………（鋭い目で相手を見据える）'
      ],
      cool: [
        '……ここで、終わる'
      ],
      seductive: [
        '………逃がさない…わ'
      ],
      polite: [
        '………ここで…終わらせます'
      ],
      composed: [
        '………（静かに相手を見据える）'
      ]
    },
    shy: {
      _default: [
        '…怖いけど…ここで逃げたら自分を許せない…'
      ],
      polite: [
        'あ、あの…そろそろ、決着を…'
      ],
    },
    easygoing: {
      _default: [
        'いよいよだね。全部出し切るよ！'
      ],
      delinquent: [
        'いよいよだな。全力で行くぜ！'
      ],
      seductive: [
        'いよいよね。…全部出し切るわ'
      ],
      polite: [
        'いよいよです！ 全部出し切ります！'
      ],
      ojousama: [
        'いよいよですわ！ 全力で参りますの'
      ],
      composed: [
        'いよいよだね。…全部出し切るよ'
      ]
    },
    earnest: {
      _default: [
        'ここで終わらせます。覚悟してください',
        'この因縁、終わりにします'
      ],
      polite: [
        '本日こそ、決着をつけさせていただきます'
      ],
      seductive: [
        'ここで終わらせるわ。覚悟して'
      ],
      ojousama: [
        '本日こそ、決着をつけさせていただきますわ'
      ],
      composed: [
        '…ここで終わらせます'
      ]
    },
    emotional: {
      _default: [
        'もう……限界……今日で全部終わらせる……！'
      ],
      seductive: [
        'そろそろ決着ね……っ……ふふ……'
      ],
      composed: [
        '…もういい。…今日で終わりだ'
      ]
    }
  },
  defender: {
    normal: {
      _default: [
        '……来なよ。相手してあげる',
        '出来るものならやってみなよ！',
        '終わりにできるか、やってみなよ！'
      ],
      ojousama: [
        'いらっしゃい。相手をしてあげてよ。'
      ],
      delinquent: [
        '来いよ。返り討ちにしてやる',
        '打てるもんなら打ってみろ'
      ],
      cool: [
        '……来い。迎え撃つ'
      ],
      seductive: [
        'いいわよ。迎えてあげる'
      ],
      polite: [
        '…どうぞ。お相手します'
      ],
      composed: [
        '…いいよ。来なよ'
      ]
    },
    bold: {
      _default: [
        '……同感。だから本気で行くよ',
        '夢のままで終わらせてあげる'
      ],
      ojousama: [
        '同感ね。少しは本気にさせてちょうだい…'
      ],
      delinquent: [
        'ああ、本気で潰しに行く'
      ],
      cool: [
        '……同感だ'
      ],
      seductive: [
        '同感よ。…本気で行くわ'
      ],
      polite: [
        '同感です。本気で参ります'
      ],
      composed: [
        '…同感だね。本気で行くよ'
      ]
    },
    quiet: {
      _default: [
        '………（静かに構える）'
      ],
      cool: [
        '……来い'
      ],
      seductive: [
        '………来なさい'
      ],
      polite: [
        '………お相手…します'
      ],
      composed: [
        '………（静かに構える）…来なよ'
      ]
    },
    shy: {
      _default: [
        '…わかりました。…受け止めます…'
      ],
      polite: [
        'は、はい…お受けします…'
      ],
    },
    easygoing: {
      _default: [
        'おっけー。こっちも全力だよ！'
      ],
      delinquent: [
        'おう、来いよ！ 全力だ！'
      ],
      seductive: [
        'いいわよ。全力で受けて立つわ'
      ],
      polite: [
        'おっけーです！ 全力でお相手します！'
      ],
      ojousama: [
        'よろしくてよ！ 全力でお相手いたしますわ'
      ],
      composed: [
        'おっけー。全力でいくよ'
      ]
    },
    earnest: {
      _default: [
        'お受けします。全力で'
      ],
      polite: [
        '全力でお相手させていただきます'
      ],
      seductive: [
        '全力でお相手するわ。覚悟して'
      ],
      ojousama: [
        '全力でお相手させていただきますわ'
      ],
      composed: [
        '…全力でお相手します'
      ]
    },
    emotional: {
      _default: [
        '来なさい……！ 全力で……！'
      ],
      seductive: [
        '受けるわ……っ……ふふ、いつでもどうぞ……'
      ],
      composed: [
        '…来なよ。…全力で'
      ]
    }
  }
};
const RIVALRY_CONFRONTATION_LINES_90 = {
  attacker: {
    normal: {
      _default: [
        '……この日を待ちに待った。',
        'あんたを超えなければ、終わらせられない'
      ],
      ojousama: [
        'この日をどれほど待ちわびたことか…'
      ],
      delinquent: [
        '……ずっと待ってた。この日を'
      ],
      cool: [
        '……来た。この日が'
      ],
      seductive: [
        '……ようやく、この日が来たわね'
      ],
      polite: [
        '……この日を、ずっと待っておりました'
      ],
      composed: [
        '…この日を待ってた'
      ]
    },
    bold: {
      _default: [
        '全部賭ける。残らず全部',
        '……行くよ。最後の戦い'
      ],
      cool: [
        '……全てを賭ける'
      ],
      delinquent: [
        '全部賭ける。てめえを超えてやる'
      ],
      ojousama: [
        '今日は全力で……つぶしてあげる'
      ],
      seductive: [
        '全部賭けるわ。…行くわよ'
      ],
      polite: [
        '全てを賭けます。行かせていただきます'
      ],
      composed: [
        '…全部出す。今日で'
      ]
    },
    quiet: {
      _default: [
        '………（言葉はない。ただ、真っ直ぐ見据えている）'
      ],
      cool: [
        '………'
      ],
      seductive: [
        '………（言葉はなく、ただ見つめている）'
      ],
      polite: [
        '………行き…ます'
      ],
      composed: [
        '………（静かに、真っ直ぐ見据えている）'
      ]
    },
    shy: {
      _default: [
        '………もう何も言わない。…行きます'
      ],
      polite: [
        '………ずっと、待っておりました…この日を…'
      ]
    },
    easygoing: {
      _default: [
        '……全部、出し切る。今日で'
      ],
      polite: [
        '……この日を待っていました。全部出し切ります'
      ],
      ojousama: [
        '……この日を、ずっと待っておりましたの'
      ],
      seductive: [
        '……ようやく、この日ね。全部、出し切るわ'
      ],
      delinquent: [
        '……この日を待ってたぜ。全部ぶつけてやる'
      ],
      composed: [
        '…全部出し切る。今日で'
      ]
    },
    earnest: {
      _default: [
        '全てを賭けます。この一戦に'
      ],
      polite: [
        '……この日を、ずっと待っておりました。全てを賭けます'
      ],
      ojousama: [
        '……この日を、ずっと待っておりましたわ。全てを賭けますの'
      ],
      seductive: [
        '……この日をずっと待っていたの。全てを賭けるわ'
      ],
      composed: [
        '…全てを賭けます'
      ]
    },
    emotional: {
      _default: [
        '……もう……言葉にならない……行くよ……！'
      ],
      seductive: [
        '……この日を…ずっと待ってた……っ……行くわよ……!'
      ],
      composed: [
        '………行くよ'
      ]
    }
  },
  defender: {
    normal: {
      _default: [
        '……私もよ。',
        '……なら、超えてみせなさいよ'
      ],
      ojousama: [
        '……ええ。もう言葉は不要ね'
      ],
      delinquent: [
        '……ああ。来いよ'
      ],
      cool: [
        '……ああ'
      ],
      seductive: [
        '……ええ。もう何も言わないわ'
      ],
      polite: [
        '……はい。もう言葉は…いりません'
      ],
      composed: [
        '…ええ。…もう言葉はいらない'
      ]
    },
    bold: {
      _default: [
        '……ええ。私も同じ気持ち',
        '……受けて立つ。全部'
      ],
      cool: [
        '……受けて立つ'
      ],
      delinquent: [
        '……おう。来い'
      ],
      ojousama: [
        '……ええ。相手をしてあげる'
      ],
      seductive: [
        '……ええ。全力で行くわ'
      ],
      polite: [
        '……はい。受けて立ちます'
      ],
      composed: [
        '…うん。受けて立つ'
      ]
    },
    quiet: {
      _default: [
        '………（静かに頷く）'
      ],
      cool: [
        '………（目を閉じ、開く）'
      ],
      seductive: [
        '………（静かに目を閉じ、開く）'
      ],
      polite: [
        '………（静かに頷く）…はい'
      ],
      composed: [
        '………（静かに頷く）'
      ]
    },
    shy: {
      _default: [
        '………うん（静かに頷く）'
      ],
      polite: [
        '………はい…受けて、立ちます…'
      ]
    },
    easygoing: {
      _default: [
        '……うん。もう、何も言わなくていい'
      ],
      polite: [
        '……はい。もう、言葉はいりません'
      ],
      ojousama: [
        '……ええ、もう言葉は不要ですわ'
      ],
      seductive: [
        '……ええ。言葉は、いらないわね'
      ],
      delinquent: [
        '……ああ。来いよ、全部受けてやる'
      ],
      composed: [
        '…うん。言葉はいらない'
      ]
    },
    earnest: {
      _default: [
        '……はい。全力で参ります'
      ],
      polite: [
        '……はい。全力で、お受けいたします'
      ],
      ojousama: [
        '……ええ、全力でお受けしますわ'
      ],
      seductive: [
        '……ええ。全力で受けるわ'
      ],
      composed: [
        '…はい。全力で'
      ]
    },
    emotional: {
      _default: [
        '……ええ……！ 行きましょう……！'
      ],
      seductive: [
        '……ええ……!来なさい、全部受け止めるわ……!'
      ],
      composed: [
        '…ええ。…行こう'
      ]
    }
  }
};

// ── 週次ティッカーテキスト ──
const WEEKLY_STORY_TICKER = {
  // 第1層: 双方条件
  bestFriends: [
    // 親友ゾーン（bond70+, rivalry40未満）
    '{nameA}と{nameB}が練習後に並んで帰る姿が目撃された',
    '{nameA}と{nameB}がトレーニングで息の合った動きを見せている',
    '{nameA}が{nameB}の体調を気遣っている姿があった',
  ],
  hostileEnemy: [
    // 憎い敵ゾーン（rivalry40+, bond40未満）
    '{nameA}と{nameB}の間に張り詰めた空気が漂っている',
    '{nameA}と{nameB}が控室で目も合わせない',
    'ロッカールームの一角で{nameA}と{nameB}の冷たい空気が流れている',
  ],
  clash: [
    // 衝突発生（憎い敵ゾーン、5%判定ヒット時）
    '{nameA}と{nameB}が練習中に激しく言い合いになった',
    '{nameA}と{nameB}の口論が控室に響いた',
    '{nameA}が{nameB}に食ってかかり、スタッフが止めに入った',
    '{nameA}と{nameB}の間で一触即発の空気が走った',
    '{nameA}と{nameB}が掴み合いになりかけ、周囲が慌てて止めた',
  ],
  goodRivalZone: [
    // 好敵手的ゾーン（rivalry40+, bond50+）
    '{nameA}が{nameB}の試合映像を繰り返し見ている',
    '{nameA}と{nameB}が練習後に言葉を交わし、互いに頷いていた',
    '{nameA}は{nameB}の試合結果を真っ先に確認している',
  ],
  // 第2層: 非対称
  unrequitedBond: [
    // 片思い（A→B bond70+ / B→A bond40以下）
    '{nameA}が{nameB}に話しかけるも、素っ気ない反応だった',
    '{nameA}は{nameB}のことを親友だと思っている——{nameB}がどう思っているかは別として',
    '{nameA}が{nameB}を誘うが、{nameB}は別の用事があると去っていった',
  ],
  onesidedHostility: [
    // 一方的な敵意（A→B rivalry50+ bond30以下 / B→A rivalry20以下）
    '{nameA}が{nameB}を睨みつけている。{nameB}は気づいていない',
    '{nameA}は{nameB}の名前を聞くたびに表情を歪めている',
    '{nameA}の練習が日に日に荒くなっている——{nameB}への執念が滲む',
  ],
  temperatureDiff: [
    // 温度差（A→B bond70+ / B→A bond50-65, 差15+）
    '{nameA}が{nameB}との距離に少し戸惑っている様子だ',
    '{nameA}は{nameB}との関係をもっと深めたいようだが……',
  ],
  crossAsymmetry: [
    // クロス非対称（A: 高riv+低bond / B: 低riv+高bond）
    '{nameA}は{nameB}を目の敵にしている。{nameB}は{nameA}のことを仲間だと思っているのに',
    '{nameB}が笑顔で話しかけた{nameA}は、拳を握りしめて背を向けた',
  ],
  // 高rivalry: 非対戦時の意識テキスト
  highRivalryAwareness: [
    '{nameA}は客席から{nameB}の試合を食い入るように見つめていた',
    '{nameA}は{nameB}の試合結果を聞いて、ゆっくりとテーピングを巻き直した',
    '{nameA}が{nameB}の勝利を知り、静かに拳を握った',
    '花道の奥から{nameA}が{nameB}の試合を見ていた。その目は揺れていない',
  ],
  // resolved状態のティッカー
  goodRivalTicker: [
    '{nameA}と{nameB}が練習後に静かに言葉を交わしていた',
    '{nameA}と{nameB}——好敵手の二人が並んでストレッチをしている',
    '{nameA}は{nameB}の試合を見て、小さく微笑んだ',
  ],
  bitterRivalTicker: [
    '{nameA}と{nameB}が控室ですれ違い、空気が凍りついた',
    '{nameA}の表情が一瞬歪んだ——{nameB}の名前を聞いただけで',
    '{nameA}と{nameB}が同じ廊下を歩くことを、誰もが避けさせている',
  ],
  // trust警告帯テキスト（trust 40-49）
  trustWarning: [
    '{name}の表情が最近曇っている',
    '{name}の練習への集中力が落ちてきている',
    '{name}がひとりでロッカールームに佇んでいた',
    '{name}の笑顔が減った——周囲もそれに気づいている',
  ],
  // 因縁カード放置テキスト
  // 覚醒イベント（クロス非対称: A高riv低bond / B低riv高bond → Bがキレる）
  // nameBのpersonality×archetypeで選出する
  awakening: {
    normal: {
      _default: [
        '{nameB}が{nameA}に向かって叫んだ。「もう我慢の限界よ！ あなたがそうなら、私も本気で行く！」',
        '{nameB}の目の色が変わった。「……もういい。あなたがそう思うなら、私も覚悟を決める」',
      ],
      ojousama: ['{nameB}が{nameA}に向き直った。「もう結構ですわ。あなたがその態度なら、こちらにも考えがありますの」'],
      delinquent: ['{nameB}が{nameA}を睨みつけた。「……てめえがそう来るなら、こっちも容赦しねえぞ」'],
      cool: ['{nameB}の表情が変わった。「……もういい。覚悟は決めた」'],
      seductive: ['{nameB}の瞳が冷たく光った。「……そう。あなたがそうなら、私も本気を出すわ」'],
      composed: ['{nameB}の表情が静かに変わった。「…そう。…なら、こちらも覚悟を決めるよ」'],
    },
    bold: {
      _default: [
        '{nameB}が{nameA}の前に立ちはだかった。「いい加減にして。そのつもりなら、全力で相手になるから」',
        '{nameB}が{nameA}をまっすぐ見据えた。「もう黙ってられない。受けて立つよ」',
      ],
      ojousama: ['{nameB}が{nameA}に宣言した。「もう我慢いたしませんわ！ 全力でお相手して差し上げます！」'],
      delinquent: ['{nameB}が{nameA}に吠えた。「上等だ！ その喧嘩、買ってやるよ！」'],
      cool: ['{nameB}が静かに立ち上がった。「……もう十分だ。行くぞ」'],
      composed: ['{nameB}が静かに{nameA}の前に立った。「…もういいだろう。受けて立つよ」'],
    },
    quiet: {
      _default: ['{nameB}が静かに拳を握った。「ずっと信じてた。でももう……終わりにする」'],
      cool: ['{nameB}が無言で{nameA}の前に立ちはだかった。その目は——もう、以前の{nameB}ではなかった'],
      polite: ['{nameB}が小さく、しかし確かな声で言った。「…もう…我慢しません」'],
      composed: ['{nameB}が静かに{nameA}を見据えた。「…もういい。…覚悟は決めた」'],
    },
    shy: { _default: ['「…ずっと我慢してた…けど…もう限界です…」——{nameB}の声は小さいけど、震えていなかった', '{nameB}が俯いたまま{nameA}に告げた。「…もう…我慢しない…です」'] },
    easygoing: {
      _default: ['{nameB}の笑顔が消えた。「……さすがにさ。これはないよ。本気で怒ってるんだからね」'],
      delinquent: ['{nameB}の軽い口調が一変した。「……お前さぁ、いい加減にしろよ。マジで怒るぞ」'],
      composed: ['{nameB}の笑顔が消えた。「…さすがにね。…こっちも本気で行くよ」'],
    },
    earnest: {
      _default: ['{nameB}が真っ直ぐ{nameA}を見つめた。「ずっと信じていました。でも……もう限界です。本気で行きます」'],
      polite: ['{nameB}が深く息を吸い、言い放った。「これ以上は……お許しいただけません。全力で参ります」'],
      composed: ['{nameB}が{nameA}を真っ直ぐ見た。「…もう十分待った。…本気で行きます」'],
    },
    emotional: {
      _default: ['{nameB}が涙を流しながら{nameA}に叫んだ。「なんで……！ なんでそんなことするの……！ もう……もう許さない……！」'],
      composed: ['{nameB}が押し殺した声で{nameA}に告げた。「…もういい。…覚えてろ」'],
    },
  },
};

// ── 試合後リアクション（高rivalryペア用、personality×archetype）──
const RIVALRY_MATCH_REACTION = {
  winnerLines: {
    normal: {
      _default: [
        'まだ終わってないんだろうけど。……でも次も私が勝つよ',
        'これで終わり……というわけには行かないよね'
      ],
      ojousama: [
        'まだ終わって無いのでしょうね。あちらの目はまだ死んでいないようですし。'
      ],
      delinquent: [
        '次もぶっ倒す。覚えとけ'
      ],
      cool: [
        '……まだだ'
      ],
      seductive: [
        'まだ終わってないわ。次も待ってなさい'
      ],
      polite: [
        'まだ終わっていません。次も…必ず勝ちます'
      ],
      composed: [
        '…まだ終わってない。次もあるよ'
      ]
    },
    bold: {
      _default: [
        '今日は私の勝ち。でも再戦はありそうね……'
      ],
      ojousama: [
        '当然の勝利ね。まだ諦めないのかしら？'
      ],
      cool: [
        '……一つ、借りを返した'
      ],
      delinquent: [
        '通過点だ。次もぶっ倒してやる'
      ],
      seductive: [
        'まだ先があるのよ。…楽しみにしてなさい'
      ],
      polite: [
        'この勝利は通過点です。まだ先がありますから'
      ],
      composed: [
        '…通過点だね。まだ先がある'
      ]
    },
    quiet: {
      _default: [
        '………（相手の方を一瞬だけ振り返る）'
      ],
      cool: [
        '……まだ終わらない'
      ],
      seductive: [
        '………まだよ'
      ],
      polite: [
        '………まだ…終わりではありません'
      ],
      composed: [
        '………（一瞬振り返り、前を向く）'
      ]
    },
    shy: {
      _default: [
        '勝てた…よかった…でも、次も頑張らなきゃ…'
      ]
    },
    easygoing: {
      _default: [
        '一個勝ち！ でもまだまだこれからだよ！'
      ],
      delinquent: [
        '一勝！ でもまだまだだぜ！'
      ],
      seductive: [
        'ひとつ勝ち。ふふ…でもまだこれからよ'
      ],
      polite: [
        '一つ勝たせていただきました！ でもまだまだこれからです'
      ],
      ojousama: [
        '一つ勝ちですわ！ でもまだまだこれからですの'
      ],
      composed: [
        '一つ勝ち。…でもまだまだだね'
      ]
    },
    earnest: {
      _default: [
        '無事勝ちました。でもこの因縁は、まだ続きそうね'
      ],
      polite: [
        '勝たせていただきました。でもまだ……終わりではありません'
      ],
      seductive: [
        '勝ったわ。でもこの因縁…まだ続くの'
      ],
      ojousama: [
        '勝たせていただきましたわ。でもこの因縁はまだ続くのでしょうね'
      ],
      composed: [
        '…勝ちました。でもまだ続きます'
      ]
    },
    emotional: {
      _default: [
        '勝った……！ でもまだ……まだ終わらない……！'
      ],
      composed: [
        '…勝った。…でも、まだだ'
      ]
    }
  },
  loserLines: {
    normal: {
      _default: [
        '次は負けない。絶対に',
        '……覚えてて。この借りは必ず返すから'
      ],
      ojousama: [
        '次は負けない。覚えていらっしゃい'
      ],
      delinquent: [
        'くそっ……次は絶対ぶっ倒す'
      ],
      cool: [
        '……次は、ない。次こそ倒す'
      ],
      seductive: [
        '次は……負けないわ'
      ],
      polite: [
        '次は負けません。この借りは…必ず返します'
      ],
      composed: [
        '…次は負けない'
      ]
    },
    bold: {
      _default: [
        'この負けは認めない。必ず借りを返す'
      ],
      cool: [
        '……忘れない。この敗北を'
      ],
      delinquent: [
        'この借り、絶対返すからな'
      ],
      seductive: [
        'この借り…必ず返すわ。覚悟しておきなさい'
      ],
      polite: [
        'この負けは認めません。必ず借りを返します'
      ],
      composed: [
        '…この借り、返すよ'
      ]
    },
    quiet: {
      _default: [
        '………（静かに拳を握りしめる）'
      ],
      cool: [
        '……次だ'
      ],
      seductive: [
        '………次は、ないわよ'
      ],
      polite: [
        '………次は…負けません'
      ],
      composed: [
        '……次だ'
      ]
    },
    shy: {
      _default: [
        '…負けちゃった……悔しい…です……'
      ]
    },
    easygoing: {
      _default: [
        'あちゃー、負けた。でも次があるさ。絶対やり返す！'
      ],
      delinquent: [
        'くっそー！ 次は見てろよ！'
      ],
      seductive: [
        'あら、負けちゃった。…でも次は覚悟しておいてね'
      ],
      polite: [
        '負けてしまいました。でも次は必ずやり返します！'
      ],
      ojousama: [
        '負けてしまいましたわ。…でも次はやり返しますので！'
      ],
      composed: [
        '負けたか。…ま、次があるさ'
      ]
    },
    earnest: {
      _default: [
        '負けました。でも諦めません。必ず借りを返します'
      ],
      polite: [
        '……悔しいです。でも、次は必ず'
      ],
      seductive: [
        '負けたわ。でも…諦めないの。必ず返すから'
      ],
      ojousama: [
        '負けました。……でも諦めません。……必ず借りを返しますわ'
      ],
      composed: [
        '…負けました。…でも、次は'
      ]
    },
    emotional: {
      _default: [
        '悔しい……！ 絶対……絶対やり返す……！'
      ],
      composed: [
        '…っ…次は、こうはいかない'
      ]
    }
  }
};

// ── 番狂わせ × 高rivalry 専用テキスト ──
const UPSET_RIVALRY_LINES = {
  winnerLines: {
    normal: {
      _default: [
        '見たか！ 私が格下だなんて、もう言わせない……！'
      ],
      ojousama: [
        'ご覧になって？ 格上ですって……もう言えないわね'
      ],
      delinquent: [
        'どうだ……！ これが俺の答えだ！'
      ],
      cool: [
        '……証明した'
      ],
      seductive: [
        '見てた？ これが私の答えよ'
      ],
      polite: [
        '見てください…！ 格下だなんて…もう言わせません…！'
      ],
      composed: [
        '…これが答えだよ。…もう格下なんて言わせない'
      ]
    },
    bold: {
      _default: [
        'ついに……勝った……！ ずっと待ってた……！'
      ],
      cool: [
        '……やった。……ようやく'
      ],
      seductive: [
        'ようやく…勝ったわ。…ずっと待ってたの'
      ],
      polite: [
        'ついに…勝ちました…！ ずっと待っていたんです…！'
      ],
      composed: [
        '…ようやく。…超えたよ'
      ]
    },
    quiet: {
      _default: [
        '………（膝をつき、震えている）……勝った…？'
      ],
      cool: [
        '……勝った。……信じられない'
      ],
      seductive: [
        '………勝った…の…？'
      ],
      polite: [
        '………勝ち…ました…？'
      ],
      composed: [
        '……勝った、か'
      ]
    },
    shy: {
      _default: [
        'え…うそ…私が…？ ほんとに…？（膝から崩れる）'
      ],
      polite: [
        'か、勝てるなんて…思っていませんでした…'
      ],
    },
    easygoing: {
      _default: [
        'うっそ……勝っちゃった……！ やばい、信じられない……！'
      ],
      delinquent: [
        'マジか……やったぞ……！'
      ],
      seductive: [
        'うそ…勝っちゃった…ふふ、信じられない'
      ],
      polite: [
        'うそです…勝っちゃいました…！ 信じられません…！'
      ],
      ojousama: [
        'まあ…勝ちましたわ…！ 信じられませんこと…！'
      ],
      composed: [
        '…勝っちゃった。…ふぅん'
      ]
    },
    earnest: {
      _default: [
        'やりました……！ ずっとこの人を目標にしてきて……ついに……！'
      ],
      polite: [
        '勝ちました……！ ずっと追いかけてきた背中に……ついに……！'
      ],
      seductive: [
        'やったわ…ずっと追いかけてきて…ついに…'
      ],
      ojousama: [
        'やりましたわ…！ ずっと追いかけてまいりまして…ついに…'
      ],
      composed: [
        '…ずっと追いかけてきた。…ようやく、届いた'
      ]
    },
    emotional: {
      _default: [
        '勝った……！ 勝ったよ……！ ずっと……ずっと追いかけてきたんだ……！（号泣）'
      ],
      seductive: [
        '勝っちゃった……っ……ふふ、自分でも信じられないの……'
      ],
      composed: [
        '…っ…勝った。…ようやく'
      ]
    }
  },
  loserLines: {
    normal: {
      _default: [
        '噓でしょ？……こんなはずじゃ……',
        'なんで……なんで負けたの……？'
      ],
      ojousama: [
        'こんな……こんなことがありますの……？'
      ],
      delinquent: [
        'くそっ……ありえねえ……！'
      ],
      cool: [
        '………（信じられないという表情で立ち尽くす）'
      ],
      seductive: [
        '嘘でしょう……こんなことが……'
      ],
      polite: [
        '嘘でしょう…こんなはずでは…ありません…'
      ],
      composed: [
        '…こんなことが。…信じられない'
      ]
    },
    bold: {
      _default: [
        '認めない……！ こんな結果……認めない……！',
        'ありえない……嘘でしょ……！'
      ],
      ojousama: [
        '認めませんわ……！ こんな結果……！'
      ],
      delinquent: [
        'ふざけんな……！ こんなの認めねえ……！'
      ],
      cool: [
        '……嘘だろう'
      ],
      seductive: [
        '認めないわ…こんな結果…'
      ],
      polite: [
        '認めません…こんな結果は…'
      ],
      composed: [
        '…認めない。…こんな結果は'
      ]
    },
    quiet: {
      _default: [
        '………（呆然と天井を見上げている）'
      ],
      cool: [
        '………（膝をつき、動かない）'
      ],
      seductive: [
        '………嘘…でしょう…'
      ],
      polite: [
        '………そんな…'
      ],
      composed: [
        '………（静かに天を仰ぐ）'
      ]
    },
    shy: {
      _default: [
        '…え……うそ…………（何が起きたかわかっていない）'
      ],
      polite: [
        'ま、まさか負けるなんて…く、悔しいです…'
      ],
    },
    easygoing: {
      _default: [
        'えっ……嘘でしょ……マジで……？'
      ],
      delinquent: [
        'は……？ マジかよ……'
      ],
      seductive: [
        'えっ…嘘でしょう…まさか…'
      ],
      polite: [
        'えっ…嘘ですよね…まさか…'
      ],
      ojousama: [
        'まあ…嘘ですわ…こんなことが…'
      ],
      composed: [
        '…嘘だろう。…こんなことが'
      ]
    },
    earnest: {
      _default: [
        'こんなはずでは……油断したつもりはなかったのに……',
        '信じられません……なぜ……'
      ],
      polite: [
        'こんな……全力を出したはずなのに……'
      ],
      seductive: [
        'こんなはずじゃ…全力を出したのに…'
      ],
      ojousama: [
        'こんなはずでは…全力を尽くしましたのに…'
      ],
      composed: [
        '…こんなはずでは。…なぜ'
      ]
    },
    emotional: {
      _default: [
        '嫌だ……！ こんなの嫌だ……！ なんで……！'
      ],
      seductive: [
        'まさか負けるなんて……っ……ふふ、悔しい……'
      ],
      composed: [
        '…っ…なんで。…こんなはずじゃ'
      ]
    }
  }
};

// ── PPVメインイベント勝利セリフ（自団体選手が頂上決戦に勝利時） ──
const PPV_SUMMIT_VICTORY_LINES = {
  normal: {
    _default: [
      '……やった。本当に、やったんだ……！',
      'みんなのおかげです。この舞台で勝てて、本当に嬉しい',
      '信じてくれた人たちに、やっと恩返しができた気がする'
    ],
    ojousama: [
      '……勝ちましたわ。この大舞台で……最高の気分ですの',
      'わたくしの力、ようやく証明できましたわね'
    ],
    delinquent: [
      'どうだ……！ これがウチの団体の力だ……！',
      'てっぺん獲ったぞ……！ 見てたか……！'
    ],
    cool: [
      '……ここが頂点。……でも、まだ先がある',
      '……勝った。（静かにベルトを掲げる）'
    ],
    seductive: [
      'ふふ……最高の舞台で、最高の結末。悪くないわね',
      '見ててくれた？ これが私のすべてよ'
    ],
    polite: [
      '……勝ちました。この大舞台で、本当に……ありがとうございます'
    ],
    composed: [
      '…やったよ。…ここまで来れたか',
      '…悪くない結末だね。みんな、ありがとう'
    ]
  },
  bold: {
    _default: [
      'この瞬間をずっと待ってた……！ いい気分！',
      'これが一番の景色か……！ 私のものね……！'
    ],
    ojousama: [
      'この座は渡せませんわね…… ずっと目指してきましたのよ……！'
    ],
    delinquent: [
      'やったぞ……！ 全員ぶっ倒してここまで来たんだ……！'
    ],
    cool: [
      '……獲った。これが、私の答えだ'
    ],
    polite: [
      'ずっと待っていました、この瞬間を……!わたしの力、証明できました!'
    ],
    seductive: [
      'ずっと待ってたのよ、この瞬間を……!ふふ、最高の気分ね'
    ],
    composed: [
      '…獲った。…ここが頂点か。…悪くないね'
    ]
  },
  quiet: {
    _default: [
      '………（リングの上で静かに涙を流す）',
      '………ありがとう、ございます……（声が震えている）'
    ],
    cool: [
      '………（ベルトを静かに抱きしめる）'
    ],
    polite: [
      '………勝ちました。…ここに、立てました'
    ],
    seductive: [
      '………獲ったわ。…この舞台で'
    ],
    composed: [
      '………（静かにベルトを見つめている）'
    ]
  },
  shy: {
    _default: [
      'か、勝てました…信じられない…夢、みたい…'
    ],
    polite: [
      'か、勝てました……本当に……ありがとうございます……'
    ]
  },
  easygoing: {
    _default: [
      'うっそ……マジで勝っちゃった……！ やばいやばいやばい！',
      'え、ちょっと待って……夢じゃないよね……？ 最高！'
    ],
    delinquent: [
      'マジかよ……！ やべえ、勝っちまった……！ 最高だ！'
    ],
    polite: [
      'やった、勝ちました!最高の舞台で最高の結果、夢みたいです!'
    ],
    ojousama: [
      'まあ、勝っちゃいましたわ!最高の舞台で、最高の気分ですの!'
    ],
    seductive: [
      '勝っちゃった!ふふ、最高の舞台で、最高の結末ね♪'
    ],
    composed: [
      '勝っちゃった。…ふぅん。…悪くないね'
    ]
  },
  earnest: {
    _default: [
      'ここまで来られたのは、支えてくれた皆さんのおかげです。ありがとうございます……！',
      '練習してきたことが、全部報われた気がします……！'
    ],
    polite: [
      '皆さまのご声援のおかげです……本当に、ありがとうございます……！'
    ],
    ojousama: [
      'ここまで来られましたのは、皆様のおかげですわ。本当に、ありがとうございますの'
    ],
    seductive: [
      'ここまで来られたのは、支えてくれた皆のおかげよ。…ありがとう'
    ],
    composed: [
      '…ここまで来れたのは、皆さんのおかげです。…ありがとう'
    ]
  },
  emotional: {
    _default: [
      '嬉しい……！ 嬉しいよ……！ ここまで来るのに、どれだけ泣いたか……！',
      'みんな……ありがとう……！ 私、やったよ……！（号泣）'
    ],
    seductive: [
      '嬉しい……っ……!最高の舞台で勝てた……この瞬間を、ずっと忘れないわ……!'
    ],
    composed: [
      '…っ…やった。…ここまで、長かった'
    ]
  }
};

// ── PPVメインイベント勝利時：コーチ称賛コメント（敬語・性別不問） ──
const PPV_COACH_PRAISE_LINES = [
  'この選手は本当に素晴らしい。日頃の努力が、最高の舞台で実を結びました',
  '見事です。あの大舞台で、持てる力を全て出し切りました',
  'よくやってくれました。この勝利は、本人の努力の結晶です',
  '素晴らしい試合でした。これだけの選手を指導できて光栄です',
  'あの舞台で勝てる選手は限られています。本当に立派でした',
  '成長を間近で見てきましたが、ここまでの選手になるとは……脱帽です',
  '日頃の練習がそのままリングに出ていました。コーチ冥利に尽きます',
  'この勝利は偶然ではありません。積み重ねてきたものが違います'
];

// カード鮮度システム
const FRESHNESS_CONFIG = {
  windowShows: 12,           // デフォルト（ロスター13人以上）
  windowShowsSmall: 8,       // ロスター8人以下
  windowShowsMedium: 10,     // ロスター9〜12人
  firstMeetBonus: 2,         // 初顔合わせボーナス
  penalties: [
    { minCount: 3, mqPenaltyMin: -1, mqPenaltyMax: -3 },   // マンネリ
    { minCount: 4, mqPenaltyMin: -2, mqPenaltyMax: -4 },   // 深刻なマンネリ
    { minCount: 5, mqPenaltyMin: -3, mqPenaltyMax: -5 },   // 完全なマンネリ
  ],
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 4B: COACH DATA (v2.0 redesign)                  ║
// ╚══════════════════════════════════════════════════════════╝

// 基礎練習効率は各コーチの gMult フィールドで直接指定（v0.2）

// 得意スタイル表示名（選手スタイルと統一）
const COACH_STYLE_MAP = {
  Grappler:'グラップラー', Striker:'ストライカー', Aerial:'エアリアル',
  Submission:'サブミッション', Brawler:'ブローラー', Allround:'オールラウンド'
};

// スタイルマッチボーナス（専門一致+0.08 / オールラウンド万能+0.05）
const COACH_STYLE_BONUS = { specialist: 0.08, allround: 0.05 };

// コーチ枠（v0.2: 資金投資ベース、永続）
const COACH_SLOT_COSTS = [0, 500, 1000, 5000]; // [1枠目:無料, 2枠目:500万, 3枠目:1000万, 4枠目:5000万]

// シーズンプール設定
const COACH_POOL_CFG = { candidatesMin:5, candidatesMax:8 };

// 特殊能力カタログ（v0.2）— エンジン実装は Phase 2
const COACH_ABILITY_CATALOG = {
  '延命術':     { grade:'S', desc:'wear蓄積 ×0.50' },
  '限界突破':   { grade:'S', desc:'コーチ装着中 全ステtrainCap +4' },
  '弱点克服':   { grade:'A', desc:'最低ステの trainCap +5' },
  'スター製造': { grade:'A', desc:'人気rawGain ×1.2' },
  '才能開花':   { grade:'B', desc:'ペナルティ期ageMul下限 0.90' },
  '怪我耐性':   { grade:'B', desc:'怪我確率 ×0.6 + 重傷→中傷 40%' },
  '人心掌握':   { grade:'B', desc:'trust低下 ×0.90' },
  '闘志注入':   { grade:'B', desc:'スランプ脱出確率 ×2.0' },
  'ステ特化PW': { grade:'C', desc:'PW練習選択率 ×1.40' },
  'ステ特化SP': { grade:'C', desc:'SP練習選択率 ×1.40' },
  'ステ特化TE': { grade:'C', desc:'TE練習選択率 ×1.40' },
  'ステ特化ST': { grade:'C', desc:'ST練習選択率 ×1.40' },
  '新人育成':   { grade:'C', desc:'OVR≤50の成長 ×1.5' },
};

// フレーバー能力定義（v0.2）— エンジン実装は Phase 2
const COACH_FLAVOR_DEFS = {
  '頑健指導':       { desc:'重傷→中傷格下げ確率+15%' },
  '冷静な分析':     { desc:'スランプ突入確率 ×0.85' },
  'リングの目':     { desc:'試合後怪我確率 ×0.90' },
  '根性練習':       { desc:'cond消費+2/週、成長 ×1.05' },
  '動作解析':       { desc:'breakthrough確率 ×1.15' },
  '栄養管理':       { desc:'cond回復 +1/週' },
  '話術':           { desc:'担当選手trust低下 ×0.95' },
  '心の観察':       { desc:'モチベ喪失回復momentum +0.2/週' },
  '癒しのオーラ':   { desc:'cond回復 +1/週' },
  '飲みニケーション': { desc:'担当選手間bond変動 +10%' },
  '気の調整':       { desc:'スランプ脱出確率 ×1.3' },
  '理学療法':       { desc:'怪我期間 -1週（最低2週）' },
};

// フォーマット: {id, name, emoji, hasPortrait, grade, gMult, observation, style, abilities:[...], flavor,
//               salary(万/週), hireFee(万), minOrgPop, desc, [age, gender, origin, profile]}
const ALL_COACHES = [
  // ── 既存8人（hasPortrait: true）リデザイン ──────────────────────────────
  {id:1, name:'鬼塚 剛志',          emoji:'💪', hasPortrait:true,
   grade:'B', gMult:1.18, observation:'D', style:'Grappler', abilities:['闘志注入','ステ特化PW','新人育成'], flavor:null,
   salary:74, hireFee:592, minOrgPop:30,
   age:58, gender:'男', origin:'北海道',
   desc:'パワー育成の鬼。若手選手を力強く鍛え上げる。',
   profile:'元柔道全日本代表。引退後は独自のパワートレーニング理論を確立し、多くの格闘家を育て上げた。「力なき技は無力」が口癖。厳しいが、弟子想いの熱血指導者。'},
  {id:2, name:'飛鳥 真琴',          emoji:'💨', hasPortrait:true,
   grade:'C', gMult:1.13, observation:'C', style:'Aerial', abilities:['新人育成','ステ特化SP'], flavor:null,
   salary:48, hireFee:384, minOrgPop:0,
   age:34, gender:'女', origin:'大阪',
   desc:'スピード強化の専門家。試合で使えるスピードを徹底的に叩き込む。',
   profile:'元陸上短距離選手で、100m走の元ジュニア日本記録保持者。スポーツ科学を専攻し、反応速度と瞬発力の最適化に特化した独自メソッドを持つ。明るく前向きな性格で選手からの信頼が厚い。'},
  {id:3, name:'鶴見 正嗣',          emoji:'🎯', hasPortrait:true,
   grade:'B', gMult:1.18, observation:'B', style:'Striker', abilities:['才能開花','ステ特化TE'], flavor:null,
   salary:68, hireFee:544, minOrgPop:30,
   age:62, gender:'男', origin:'京都',
   desc:'テクニックの匠。選手の潜在能力を引き出す観察眼が鋭い。',
   profile:'伝統派空手の八段師範で、技の精度と美しさを極限まで追求する職人気質。寡黙だが、一言一言に含蓄がある。「技は千回の反復から生まれる」と繰り返し教えている。'},
  {id:4, name:'岩田 拓海',          emoji:'🏃', hasPortrait:true,
   grade:'C', gMult:1.13, observation:'D', style:'Brawler', abilities:['ステ特化ST','新人育成'], flavor:null,
   salary:48, hireFee:384, minOrgPop:0,
   age:41, gender:'男', origin:'長野',
   desc:'スタミナとフィジカル強化のプロ。コンディション管理にも定評がある。',
   profile:'元トライアスロン選手。高地トレーニングや心肺機能の強化プログラムに精通。科学的アプローチで選手の持久力を最大限まで引き出す。温厚で計画的な性格。'},
  {id:5, name:'沢村 玲子',          emoji:'🧠', hasPortrait:true,
   grade:'C', gMult:1.08, observation:'C', style:'Allround', abilities:['人心掌握'], flavor:'心の観察',
   salary:34, hireFee:272, minOrgPop:0,
   age:45, gender:'女', origin:'東京',
   desc:'メンタル強化の専門家。ベテラン選手の長期安定稼働を支える。',
   profile:'臨床心理士の資格を持つスポーツ心理学者。試合前のプレッシャー管理、集中力維持、モチベーション管理を得意とする。穏やかな物腰だが、核心を突く洞察力を持つ。'},
  {id:6, name:'朝日 義男',          emoji:'⭐', hasPortrait:true,
   grade:'C', gMult:1.13, observation:'C', style:'Allround', abilities:['人心掌握'], flavor:'飲みニケーション',
   salary:45, hireFee:360, minOrgPop:0,
   age:52, gender:'男', origin:'福岡',
   desc:'万能型の指導者。若手の総合力底上げが得意。',
   profile:'元プロレスラーで、現役時代は「器用貧乏」と呼ばれながらも15年のキャリアを全うした苦労人。全てのポジションを経験した豊富な知識で、若手の総合力底上げを得意とする。面倒見が良い。'},
  {id:7, name:'紅林 太一',          emoji:'🎬', hasPortrait:true,
   grade:'C', gMult:1.08, observation:'B', style:'Allround', abilities:['新人育成'], flavor:'話術',
   salary:27, hireFee:216, minOrgPop:0,
   age:48, gender:'男', origin:'名古屋',
   desc:'試合構成の達人。担当選手の試合MQを引き上げる。',
   profile:'元プロレス実況アナウンサーで試合構成を熟知するセコンドマン。リング外から「次の展開」を的確に指示し、試合のドラマ性を引き上げる。話術に長け、社交的な性格。'},
  {id:8, name:'白川 沙耶',          emoji:'📣', hasPortrait:true,
   grade:'C', gMult:1.08, observation:'D', style:'Allround', abilities:['スター製造'], flavor:null,
   salary:43, hireFee:344, minOrgPop:0,
   age:29, gender:'女', origin:'横浜',
   desc:'業界人脈が豊富。スカウト候補に追加選手を引き込む。',
   profile:'元芸能事務所マネージャーで、SNSマーケティングとメディア露出戦略のプロ。選手の魅力を引き出すブランディングが得意。行動力があり、常に新しいプロモーション企画を提案する。'},

  // ── 新規Cグレード（12人）────────────────────────────────────────────────
  {id:9, name:'大森 健吾',        emoji:'🥊', hasPortrait:false,
   grade:'C', gMult:1.1, observation:'E', style:'Brawler', abilities:['ステ特化PW'], flavor:'頑健指導',
   salary:32, hireFee:256, minOrgPop:0,
   age:32, gender:'男', origin:'埼玉',
   desc:'元ボディビルダーのトレーナー。地道にフィジカルの土台を作る。',
   profile:'元アマチュアボディビル入賞者。筋肉づくりの知識は確かだが、プロレス指導の経験はまだ浅い。地道なフィジカルトレーニングで選手の土台をコツコツ作り上げる。口下手だが、黙々と付き合ってくれる信頼感がある。'},
  {id:10, name:'宮本 花菜',   emoji:'🌱', hasPortrait:false,
   grade:'C', gMult:1.09, observation:'D', style:'Aerial', abilities:['新人育成'], flavor:null,
   salary:30, hireFee:240, minOrgPop:0,
   age:26, gender:'女', origin:'神奈川',
   desc:'元体操選手の若手コーチ。新人の素質を見抜く直感が鋭い。',
   profile:'体操競技で培った身体能力と空間認識力を持つ若きコーチ。新人の素質を見抜く直感に優れ、荒削りな原石を見つけ出すのが得意。指導経験はまだ浅いが、選手と同じ目線で成長を後押しする姿勢が持ち味。'},
  {id:11, name:'真壁 龍太',     emoji:'🤼', hasPortrait:false,
   grade:'C', gMult:1.12, observation:'D', style:'Submission', abilities:['ステ特化ST'], flavor:'冷静な分析',
   salary:36, hireFee:288, minOrgPop:0,
   age:37, gender:'男', origin:'沖縄',
   desc:'元MMA選手。実戦で使えるテクニックだけを叩き込む。',
   profile:'MMAの実戦経験から関節技やグラウンドテクニックに精通。「試合で使えない技術は教えない」がモットーの実戦派。感情を表に出さないクールな指導スタイルだが、試合前のアドバイスは的確で頼りになる。'},
  {id:12, name:'長谷川 美咲', emoji:'🩺', hasPortrait:false,
   grade:'C', gMult:1.08, observation:'C', style:'Brawler', abilities:['怪我耐性'], flavor:'理学療法',
   salary:34, hireFee:272, minOrgPop:0,
   age:33, gender:'女', origin:'静岡',
   desc:'理学療法士。選手の故障予防とリカバリーに特化。',
   profile:'スポーツリハビリの専門家として、選手の故障予防と回復を支える。派手さはないが、コンディション管理において堅実な仕事をする。「壊れてからでは遅い」が口癖で、日々の体調チェックを欠かさない。'},
  {id:13, name:'黒田 修平',       emoji:'🔭', hasPortrait:false,
   grade:'C', gMult:1.08, observation:'C', style:'Striker', abilities:['新人育成'], flavor:null,
   salary:27, hireFee:216, minOrgPop:0,
   age:44, gender:'男', origin:'広島',
   desc:'元スポーツ紙記者。業界全体に張り巡らされた情報網を持つ。',
   profile:'長年の取材活動で築いた人脈は業界随一。あらゆる団体の内情や有望選手の情報が集まってくる。コーチとしての指導力はまだまだだが、スカウト情報の質と速さでは右に出る者がいない。おしゃべり好きで団体のムードメーカー。'},
  {id:14, name:'土屋 弘美',   emoji:'🏋️', hasPortrait:false,
   grade:'C', gMult:1.1, observation:'D', style:'Grappler', abilities:['ステ特化PW'], flavor:null,
   salary:32, hireFee:256, minOrgPop:0,
   age:50, gender:'女', origin:'新潟',
   desc:'元ウエイトリフティング選手。ベテランのパワー維持に長けた姉御肌。',
   profile:'パワー系トレーニングの知識と中高年の体作りの経験を併せ持つベテランコーチ。年齢を重ねた選手の身体を理解し、無理のない方法でパワーを維持させることに長けている。「あんたはまだまだやれる」と選手を鼓舞する頼れる姉御。'},
  {id:15, name:'林 拓海',     emoji:'🦅', hasPortrait:false,
   grade:'C', gMult:1.1, observation:'D', style:'Striker', abilities:['ステ特化SP'], flavor:'根性練習',
   salary:32, hireFee:256, minOrgPop:0,
   age:30, gender:'男', origin:'兵庫',
   desc:'元キックボクサー。実戦形式でスピードと反射神経を鍛える。',
   profile:'キックボクシングで磨いたフットワークと反射神経を武器にするスピード系コーチ。「考える前に動け」がモットーで、実戦形式の練習を好む。やや性急なところはあるが、選手と一緒に汗を流す情熱的な指導で慕われている。'},
  {id:16, name:'森田 悠子', emoji:'💊', hasPortrait:false,
   grade:'C', gMult:1.08, observation:'E', style:'Submission', abilities:['新人育成'], flavor:'栄養管理',
   salary:27, hireFee:216, minOrgPop:0,
   age:38, gender:'女', origin:'岩手',
   desc:'ヨガと栄養学による地味だが堅実なコンディション管理。',
   profile:'ヨガと栄養学の知識を組み合わせた独自のコンディショニング指導が持ち味。目立つ成果はすぐには出ないが、長期的に選手の体質を改善する堅実な手腕がある。物静かで存在感は薄いが、選手の小さな変化も見逃さない。'},
  {id:17, name:'篠原 隆',   emoji:'🔎', hasPortrait:false,
   grade:'C', gMult:1.09, observation:'C', style:'Grappler', abilities:['ステ特化TE'], flavor:'リングの目',
   salary:30, hireFee:240, minOrgPop:0,
   age:55, gender:'男', origin:'熊本',
   desc:'元レフェリー歴30年。リングの中から培った試合眼の持ち主。',
   profile:'レフェリーとして数千試合をリングの中から見てきた試合眼の持ち主。選手の長所を見抜き、それを活かす試合運びを提案するのが得意。自らリングに上がることはないが、技術アドバイスの正確さは折り紙付き。控えめだが、言葉に重みがある。'},
  {id:18, name:'赤城 凛',     emoji:'🪖', hasPortrait:false,
   grade:'C', gMult:1.13, observation:'E', style:'Grappler', abilities:['ステ特化ST'], flavor:null,
   salary:39, hireFee:312, minOrgPop:0,
   age:36, gender:'女', origin:'群馬',
   desc:'元女子レスリング選手。スパルタ式でフィジカルを鍛え上げる。',
   profile:'レスリングで鍛えた実戦感覚と圧倒的なフィジカルを持つスパルタコーチ。練習は厳しいが、選手が壁を乗り越えた瞬間に見せる笑顔は本物。「甘やかして強くなった人間はいない」が信条。不器用だが、選手の成長を誰よりも喜ぶ。'},
  {id:19, name:'西岡 学', emoji:'📊', hasPortrait:false,
   grade:'C', gMult:1.09, observation:'C', style:'Submission', abilities:['ステ特化TE'], flavor:'動作解析',
   salary:30, hireFee:240, minOrgPop:0,
   age:40, gender:'男', origin:'奈良',
   desc:'バイオメカニクス研究者。科学的分析で選手の技術を最適化する。',
   profile:'身体の動きを科学的に分析するスペシャリスト。映像分析やデータを駆使して選手の技術を最適化する。プロレスの現場経験は少ないが、理論に基づいた的確な改善提案で信頼を得つつある。話し始めると止まらないマニアックな一面も。'},
  {id:20, name:'藤原 千春',   emoji:'🧘', hasPortrait:false,
   grade:'C', gMult:1.08, observation:'C', style:'Aerial', abilities:['人心掌握'], flavor:'癒しのオーラ',
   salary:34, hireFee:272, minOrgPop:0,
   age:47, gender:'女', origin:'石川',
   desc:'元メンタルトレーナー。ベテラン選手の心を支え闘志を再点火する。',
   profile:'数多くのプロアスリートのメンタルケアを手掛けてきたベテラン。長年戦い続けた選手の心の疲労を読み取り、再び闘志を灯す手助けをする。「身体が動かないのは、心が止まっているから」が持論。穏やかな語り口で選手に寄り添う。'},

  // ── 新規Bグレード（10人）────────────────────────────────────────────────
  {id:21, name:'熊谷 鉄也', emoji:'🐉', hasPortrait:false,
   grade:'B', gMult:1.18, observation:'C', style:'Brawler', abilities:['怪我耐性','ステ特化SP'], flavor:null,
   salary:66, hireFee:528, minOrgPop:30,
   age:46, gender:'男', origin:'宮城',
   desc:'元ラグビー日本代表フィジカルコーチ。瞬発力トレーニングを武器とする異色のコンディショニング指導者。',
   profile:'元ラグビー日本代表フィジカルコーチ。恵まれた体格に加え、瞬発力トレーニングを武器とする異色のコンディショニング指導者。ラグビー仕込みの爆発的なダッシュとタックルドリルで選手のスピードを底上げする。「デカいだけじゃ意味がない、速く動けるデカさを作れ」が信条。'},
  {id:22, name:'安藤 美波',   emoji:'⚡', hasPortrait:false,
   grade:'C', gMult:1.16, observation:'D', style:'Striker', abilities:['ステ特化SP'], flavor:null,
   salary:45, hireFee:360, minOrgPop:0,
   age:31, gender:'女', origin:'愛知',
   desc:'元女子MMA王者「閃光」。スピードを活かした実戦指導の達人。',
   profile:'MMAで「閃光」の異名を取ったスピードファイター。現役時代の実戦経験を基に、スピードを活かした攻防の極意を叩き込む。妥協を許さないストイックな指導だが、選手からの信頼は厚い。「速さは才能じゃない、執念だ」と説く。'},
  {id:23, name:'堀内 義孝',     emoji:'🌙', hasPortrait:false,
   grade:'B', gMult:1.17, observation:'B', style:'Grappler', abilities:['人心掌握','ステ特化TE'], flavor:null,
   salary:63, hireFee:504, minOrgPop:30,
   age:53, gender:'男', origin:'山梨',
   desc:'元レスリングナショナルコーチ。選手の隠れた才能を見逃さない名伯楽。',
   profile:'レスリング指導の世界で長年培った観察眼は、選手の隠れた才能を見逃さない。派手な指導はしないが、一人ひとりの特性に合わせた技術指導で着実に選手を伸ばす。「答えは選手の中にある。それを引き出すのが俺の仕事だ」と語る。'},
  {id:24, name:'中村 紗弓',   emoji:'🏆', hasPortrait:false,
   grade:'B', gMult:1.15, observation:'C', style:'Aerial', abilities:['弱点克服'], flavor:null,
   salary:61, hireFee:488, minOrgPop:30,
   age:35, gender:'女', origin:'千葉',
   desc:'元新体操日本代表。基礎の美しさから強い選手を育てる万能型。',
   profile:'新体操の美しさと厳しさの中で培われた万能型の指導力を持つ。新人の基礎作りからメンタル面まで幅広くカバーし、バランスの取れた選手を育成する。「基礎が美しい選手は、必ず強くなる」を信じて疑わない情熱的な指導者。'},
  {id:25, name:'宮沢 康弘',     emoji:'🛡️', hasPortrait:false,
   grade:'B', gMult:1.12, observation:'B', style:'Brawler', abilities:['怪我耐性','ステ特化ST'], flavor:null,
   salary:52, hireFee:416, minOrgPop:30,
   age:57, gender:'男', origin:'山形',
   desc:'元スポーツ整形外科医。医学的知見でベテラン選手の寿命を延ばす。',
   profile:'医師としての深い身体知識を持つ異色のコーチ。ベテラン選手特有の身体の悩みを医学的見地から理解し、適切な調整法を提案する。「選手の寿命を一年でも延ばす」ことに情熱を注ぐ。慎重な性格で、無理は絶対にさせない。'},
  {id:26, name:'カルロス 真理', emoji:'🌐', hasPortrait:false,
   grade:'C', gMult:1.08, observation:'B', style:'Allround', abilities:['スター製造'], flavor:null,
   salary:43, hireFee:344, minOrgPop:0,
   age:42, gender:'女', origin:'ブラジル',
   desc:'日系ブラジル人の元エージェント。国内外の格闘技界に太いパイプを持つ。',
   profile:'日本とブラジルの格闘技コミュニティに太いパイプを持つ国際派コーチ。海外の有望選手の情報にも精通し、他団体との交渉でも力を発揮する。指導力は発展途上だが、人脈と情報収集力はB格随一。「人を繋ぐことが、私の一番の技術」と語る。'},
  {id:27, name:'大河原 剛士',   emoji:'🦁', hasPortrait:false,
   grade:'B', gMult:1.15, observation:'B', style:'Grappler', abilities:['新人育成','ステ特化PW'], flavor:null,
   salary:52, hireFee:416, minOrgPop:30,
   age:43, gender:'男', origin:'北海道',
   desc:'元グレコローマン全日本王者。若手のパワーを短期間で開花させる。',
   profile:'グレコローマンで鍛え上げた圧倒的なパワーと、若手を一人前に育てる手腕を兼ね備えた実力派コーチ。基礎体力の徹底と実戦練習を組み合わせた指導で、新人のパワーを短期間で開花させる。「強くなりたいなら、まず自分に負けるな」が口癖。'},
  {id:28, name:'羽田 小百合',   emoji:'⚖️', hasPortrait:false,
   grade:'B', gMult:1.12, observation:'C', style:'Aerial', abilities:['才能開花','ステ特化SP'], flavor:null,
   salary:54, hireFee:432, minOrgPop:30,
   age:44, gender:'女', origin:'東京',
   desc:'元プロダンサー。ベテランの動きのキレとしなやかさを維持させる。',
   profile:'ダンスで培った身体操作と表現力の知見をプロレスに応用する異色のコーチ。ベテラン選手の動きのキレを維持し、年齢を感じさせないしなやかさを引き出す。「身体は楽器。手入れを怠れば音は鈍る」という哲学でスピードを守り続ける。'},
  {id:29, name:'陳 偉明', emoji:'💆', hasPortrait:false,
   grade:'C', gMult:1.1, observation:'B', style:'Submission', abilities:['人心掌握'], flavor:'気の調整',
   salary:39, hireFee:312, minOrgPop:0,
   age:49, gender:'男', origin:'台湾',
   desc:'東洋医学の専門家。心身を総合的に診て最適なコンディションに導く。',
   profile:'東洋医学の叡智とスポーツ科学を融合させたコンディショニングの達人。選手の心身の状態を総合的に診て、最適な調整を施す。「気の流れが整えば、身体は自ずと応える」という哲学に基づく独自のアプローチは、多くの選手から絶大な信頼を得ている。'},
  {id:30, name:'冴島 楓',   emoji:'🔩', hasPortrait:false,
   grade:'B', gMult:1.16, observation:'D', style:'Submission', abilities:['才能開花','ステ特化TE'], flavor:null,
   salary:63, hireFee:504, minOrgPop:30,
   age:39, gender:'女', origin:'大阪',
   desc:'元ブラジリアン柔術黒帯。反復ドリルで関節技と寝技の技術を叩き込む。',
   profile:'ブラジリアン柔術の国際大会で優勝経験を持つ技巧派。一つの技を何百回と反復させるドリル式指導で、選手のテクニックを確実に底上げする。口数は少ないが、マット上での手本は雄弁。「身体が覚えるまで、何度でも」が指導哲学。'},

  // ── 新規Aグレード（5人）────────────────────────────────────────────────
  {id:31, name:'神崎 鋼子',           emoji:'👑', hasPortrait:false,
   grade:'A', gMult:1.23, observation:'B', style:'Allround', abilities:['弱点克服','スター製造'], flavor:null,
   salary:152, hireFee:1216, minOrgPop:55,
   age:60, gender:'女', origin:'東京',
   desc:'「鉄の母」と呼ばれる伝説的指導者。何人もの日本代表選手を輩出した最高峰。',
   profile:'女子バレーボール日本代表監督として五輪に4度帯同し、「鉄の母」と呼ばれた伝説的指導者。彼女の元から巣立った日本代表選手は両手では数えきれない。新人の原石を見抜く眼力と、才能を最大限に引き出す指導力は他の追随を許さない。近年は女子プロレス界にもその手腕を発揮し、格闘技未経験の選手を一流のレスラーへ育て上げる実績を次々と打ち立てている。厳しさの奥に深い愛情を秘めた、スポーツ指導界の生きる伝説。'},
  {id:32, name:'巌流 正道',           emoji:'🐯', hasPortrait:false,
   grade:'A', gMult:1.24, observation:'C', style:'Grappler', abilities:['限界突破','ステ特化PW'], flavor:null,
   salary:152, hireFee:1216, minOrgPop:55,
   age:56, gender:'男', origin:'鹿児島',
   desc:'元大相撲力士のパワー系最高峰。実戦で通用する力を最短で身につけさせる。',
   profile:'角界で鍛え上げた圧倒的なパワー理論と、格闘技指導で磨いた実戦メソッドを持つ最高峰のパワー系コーチ。その指導を受けた選手は例外なくパワーで試合を支配するようになると言われる。威圧的な風貌だが、弟子思いの人情家。「力とは、覚悟の結晶だ」と説く。'},
  {id:33, name:'葉月 レナ', emoji:'🌸', hasPortrait:false,
   grade:'A', gMult:1.22, observation:'B', style:'Aerial', abilities:['スター製造','才能開花'], flavor:null,
   salary:135, hireFee:1080, minOrgPop:55,
   age:45, gender:'女', origin:'福岡',
   desc:'元ショートトラックスピードスケート五輪銀メダリスト。女子プロレスでも一時代を築いた異色の経歴を持つ。',
   profile:'ショートトラックスピードスケートでオリンピック銀メダルを獲得した元スプリンター。氷上で培った爆発的な加速力と接触を恐れない勝負度胸を武器に、引退後は女子プロレスに転身して一時代を築いた異色の経歴を持つ。二つの世界で頂点を知る彼女だからこそ、選手の中に眠るスピードの才能を誰よりも的確に見抜き、引き出すことができる。「速さの本質は、一歩目に全てを懸ける覚悟」と語るカリスマ。'},
  {id:34, name:'御堂 清四郎', emoji:'🎭', hasPortrait:false,
   grade:'A', gMult:1.25, observation:'A', style:'Submission', abilities:['限界突破','ステ特化TE'], flavor:null,
   salary:160, hireFee:1280, minOrgPop:55,
   age:65, gender:'男', origin:'東京',
   desc:'柔道五輪金メダリスト「技の神」。業界随一の観察眼を持つ生ける伝説。',
   profile:'柔道でオリンピック金メダルを獲得し「技の神」と称される生ける伝説。世界柔道殿堂入りを果たし、引退後は国際柔道連盟テクニカルアドバイザーとして世界各国の選手を指導。選手の動きを一目見ただけでその強みと弱点を見抜く観察眼は、業界で最も畏怖される能力。多くを語らないが、そのひと言が選手の人生を変えると言われる。'},
  {id:35, name:'如月 薫',         emoji:'🌿', hasPortrait:false,
   grade:'A', gMult:1.15, observation:'A', style:'Allround', abilities:['延命術','怪我耐性'], flavor:null,
   salary:140, hireFee:1120, minOrgPop:55,
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
  baseLearning: 3.0,        // v2.0: 1回の練習の基本成長量（距離比率=1.0時）
  declineStartSeason: 4,  // decline begins after this many seasons
  declineRate: 0.6,       // stat points lost per decline check
  declineChance: 0.25,    // chance per stat per season-end
  // v0.8: Intensive training
  intensiveMult: 1.8,     // growth multiplier for intensive training (v0.2b: 1.5→1.8)
  intensiveCondDrain: 2.0, // condition drain multiplier (legacy, actual drain is hardcoded)
  intensiveInjuryChance: 0.03, // 3% chance of minor injury (v0.2b: 5%→3%)
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
  b3: 3,
  b3draw: 1,
  intrusion: 3,
  tournament: { champion: 20, runnerUp: 8, semiFinal: 0, firstRound: -14 },
  tournamentWeek: 24,
};

const RANKING_CONFIG = {
  // ── 基礎力 v2.0: 3軸合算 (Force + Depth + Marquee) ──
  // (A) Force コア戦力: TOP8 加重 OVR + 加重 人気
  forceWeights: [1.6, 1.4, 1.25, 1.1, 1.0, 0.9, 0.8, 0.7],
  forceOvrMult: 1.2,
  forcePopMult: 0.6,
  // (B) Depth 層の厚み: 11位以下の OVR70+ / OVR75+ を加点
  depthOvrThreshold: 70,
  depthOvrBonusThreshold: 75,
  depthPerFighter: 3,
  depthBonusPerFighter: 2,
  depthCap: 30,
  // (C) Marquee 看板スター: TOP3 popularity の突出加重
  marqueeWeights: [0.6, 0.25, 0.15],
  marqueeMult: 0.45,
  // ── レガシー上限 ──
  legacyCapByTier: { S: 50, A: 50, B: 50, player: 50 },
};

// ── ACHIEVEMENT_CONFIG: シーズン実績 (新軸) ──
const ACHIEVEMENT_CONFIG = {
  // 配点
  pt: {
    ppv: 15,            // PPV GRAND FINAL 優勝者所属団体
    unified: 10,        // 統一トーナメント優勝者所属団体
    junior: 8,          // ジュニアトーナメント優勝者所属団体
    mvp: 10,            // 年末MVP受賞者所属団体
    bestMatch: 5,       // ベストマッチ賞 受賞試合の所属団体 (両団体に各5pt)
    bestAttend: 3,      // シーズン最大動員興行 開催団体
  },
  // 減衰: age <= graceAge までは満額、その後 decayRate^(age-graceAge) で減衰
  decayRate: 0.5,
  graceAge: 1,
  removeBelow: 1,       // 1pt 未満で除去
};
// ── 殿堂盾バリアント ──────
const SHIELD_VARIANTS = { 1: ['a'], 2: ['a'], 3: ['a'] }; // hofLevel → 使用可能バリアント配列

// ── Scout Event Config ──────
const SCOUT_EVENT_CFG = {
  offseason: { count: [6, 8], maxPicks: 3 },
};

const DORMANT_POOL_CFG = {
  targetsByAge: { 16: 6, 17: 6, 18: 6, 19: 6, 20: 6 },
  refillOrder: [17, 18, 16, 19, 20],
  annualRefillCap: 8,
  retiredCooldown: 5,
};

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
  Aerial:     {pw:0.3,sp:1.0,te:0.7,st:0.5},
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

  // 成長トレイト: 専用テーブル上書き方式（growth-trait-rebalance v1.0）
  // 個性なしベース: ≤17:0.70 / 18:1.00 / 19-20:1.15 / 21-22:1.00 / 23-24:0.50 / 25-26:0.10 / 27+:0
  if (traits.includes('早熟')) {
    // ピーク17-19歳、20歳から鈍化、23歳で完全停止。累計5.95（通常比-17%）
    if      (age <= 17) mul = 1.00;
    else if (age <= 18) mul = 1.30;
    else if (age <= 19) mul = 1.15;
    else if (age <= 20) mul = 0.80;
    else if (age <= 21) mul = 0.50;
    else if (age <= 22) mul = 0.20;
    else                mul = 0;
  } else if (traits.includes('晩成')) {
    // ピーク21-22歳、序盤は鈍い、23歳でまだ伸びる。累計7.40（通常比+3%）
    if      (age <= 17) mul = 0.50;
    else if (age <= 18) mul = 0.70;
    else if (age <= 19) mul = 0.90;
    else if (age <= 20) mul = 1.00;
    else if (age <= 22) mul = 1.15;
    else if (age <= 23) mul = 0.70;
    else if (age <= 24) mul = 0.30;
    else                mul = 0;
  } else if (traits.includes('遅咲き')) {
    // ピーク22-23歳、序盤は非常に鈍い、23歳で突然覚醒。累計7.25（通常比+1%）
    if      (age <= 17) mul = 0.40;
    else if (age <= 18) mul = 0.50;
    else if (age <= 19) mul = 0.60;
    else if (age <= 20) mul = 0.70;
    else if (age <= 21) mul = 0.80;
    else if (age <= 22) mul = 1.00;
    else if (age <= 23) mul = 1.15;
    else if (age <= 24) mul = 0.80;
    else if (age <= 25) mul = 0.30;
    else                mul = 0;
  }
  return mul;
}

// [DEPRECATED] 旧年齢ベースdecay — applyDecayはwearベースに移行済み
// const DECAY_TABLE = { ... };

// Retirement config (scout-spec §7)
const RETIRE_CFG = {
  chances: { 30:0.15, 31:0.40, 32:0.75, 33:1.00 }, // 33+ = guaranteed
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
// draft-negotiation-spec §1.3: AI_SCOUT_CFG 廃止。idealRoster のみ残す（aiInterTransfer/aiFAAcquire 用）
const AI_SCOUT_CFG = {
  S: { idealRoster:16 },
  A: { idealRoster:13 },
  B: { idealRoster:10 }
};

// F1: AI tier differentiation — roster quality caps & growth bonus
// growth-rebalance v2: tierGrowth引き上げ（AI団体も興行で選手が育つ想定）
const AI_TIER_LIMITS = {
  S: { maxProdigies: 99, maxPromising: 99, growthBonus: 1.12, faAggressiveness: 0.60 },
  A: { maxProdigies: 3,  maxPromising: 99, growthBonus: 1.05, faAggressiveness: 0.40 },
  B: { maxProdigies: 1,  maxPromising: 99, growthBonus: 1.00, faAggressiveness: 0.20 }
};

// draft-value-rebalance: AI団体のシーズン中FA獲得設定
const AI_MIDSEASON_FA_CFG = {
  ovrAdvantageThreshold: { S: 8, A: 6, B: 4 },  // FAが自軍最弱よりこれ以上強い場合のみ獲得検討
  grabChance: { S: 0.35, A: 0.25, B: 0.15 },    // 条件を満たした時の実行確率（四半期ごと）
  maxPerSeason: 1,                                 // シーズン中の最大FA獲得数/団体
};

// draft-value-rebalance: ドラフト指名ボーナス（セリで勝ち取った選手への恩恵）
const DRAFT_SIGNING_BONUS = {
  trustBase: 5,                        // ドラフト指名 trust +5（単独指名でも）
  trustPerRound: 2,                    // 競りラウンドごとに追加 +2
  trustCap: 15,                        // trust上限 +15（最大 trust 65）
  bondRange: { min: 1, max: 5 },       // 既存メンバー→新人 bond +1〜+5
  rivalryRange: { min: 0, max: 0 },    // rivalry変動なし
};

// AI統一成長 Phase4: AI団体のコーチ環境設定（ティア別）
const AI_COACH_CONFIG = {
  S: {
    ace: {
      count: 4,
      top1: {
        coachMul: 1.25,
        intensiveRate: 0.30,
        practiceRate: 0.85,
      },
      top2_4: {
        coachMul: 1.20,
        intensiveRate: 0.25,
        practiceRate: 0.85,
      },
    },
    prospect: {
      count: 2,
      config: {
        coachMul: 1.18,
        intensiveRate: 0.20,
        practiceRate: 0.85,
      },
    },
    general: {
      coachMul: 1.15,
      intensiveRate: 0.10,
      practiceRate: 0.75,
    },
  },
  A: {
    ace: {
      count: 2,
      top1: {
        coachMul: 1.20,
        intensiveRate: 0.20,
        practiceRate: 0.80,
      },
      top2_3: {
        coachMul: 1.15,
        intensiveRate: 0.15,
        practiceRate: 0.75,
      },
    },
    general: {
      coachMul: 1.10,
      intensiveRate: 0.0,
      practiceRate: 0.55,
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

// AI hidden coach staffing by org tier.
// "C???" is treated as C grade because current coach data stops at C.
const AI_COACH_STAFFING = {
  S: { grades: ['A', 'A', 'B', 'B'] },
  A: { grades: ['B', 'B', 'B'] },
  B: { grades: ['B', 'C'] },
};

// ── 業界底上げ: プレイヤー1位達成後のA/B強化用定数 ────────────────
// S級は変更なし。A/Bのみ「S級にやや劣る」水準に引き上げ
const AI_TIER_LIMITS_ELEVATED = {
  A: { maxProdigies: 8,  maxPromising: 99, growthBonus: 1.10, faAggressiveness: 0.55 },
  B: { maxProdigies: 5,  maxPromising: 99, growthBonus: 1.08, faAggressiveness: 0.45 }
};

const AI_COACH_CONFIG_ELEVATED = {
  A: {
    ace: {
      count: 3,
      top1: { coachMul: 1.22, intensiveRate: 0.25, practiceRate: 0.85 },
      top2_3: { coachMul: 1.18, intensiveRate: 0.20, practiceRate: 0.80 },
    },
    general: { coachMul: 1.12, intensiveRate: 0.05, practiceRate: 0.65 },
  },
  B: {
    ace: {
      count: 2,
      top1: { coachMul: 1.18, intensiveRate: 0.15, practiceRate: 0.75 },
      top2_3: { coachMul: 1.15, intensiveRate: 0.10, practiceRate: 0.70 },
    },
    general: { coachMul: 1.10, intensiveRate: 0.0, practiceRate: 0.55 },
  },
};

const AI_COACH_STAFFING_ELEVATED = {
  A: { grades: ['A', 'B', 'B', 'B'] },
  B: { grades: ['B', 'B', 'B'] },
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
  nonChampionRetentionRate: 0.80,       // 非チャンピオン: 80%防衛(後方互換用、実処理はretentionRateByTrust)
  retentionCostMultiplier: 0.5,         // 引き留め費用 = 移籍金 × 0.5
  // §A-1: trust による引き抜き確率補正
  trustPoachMultiplier: [
    { min: 75, mul: 0.30 },  // 満足、向こうから動かない
    { min: 60, mul: 0.60 },
    { min: 45, mul: 1.00 },  // 基準
    { min: 30, mul: 1.50 },
    { min: 0,  mul: 2.00 },  // 不満爆発
  ],
  // §A-2: trust 連動防衛率
  retentionRateByTrust: [
    { min: 70, rate: 0.95 },
    { min: 50, rate: 0.80 },  // 現行と同じ
    { min: 30, rate: 0.60 },
    { min: 0,  rate: 0.35 },
  ],
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
  warChancePerSeason: 0.55,             // 各チェックポイント55%
  warDroughtBonus: 0.15,                // 対抗戦なしシーズン後のボーナス
  warMatchCount: { options: [3, 5] },           // 3戦 or 5戦ランダム（奇数のみ）
  warPopReward: 5,                      // 勝利時団体人気
  warPopPenalty: -3,                    // 敗北時
  // D-3: 挑戦状
  challengeMQBonus: 5,                  // MQ+5（v1.0e: 10→5 に縮小）
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
      _default: [
        '…私に来いって？\n条件次第かな'
      ],
      ojousama: [
        'わたくしをお誘いですの？\n…条件次第ですわね'
      ],
      delinquent: [
        'あたしを引き抜くってか？\n…条件次第だな'
      ],
      seductive: [
        '私を誘うの？\nふふ…条件次第ね'
      ],
      cool: [
        '……条件次第だ'
      ],
      polite: [
        '残りたい気持ちはあります。…条件を聞かせてください'
      ],
      composed: [
        '…ふぅん、私に来いって？\n…聞くだけ聞こうか'
      ]
    },
    bold: {
      _default: [
        'ふーん…私を引き抜こうってわけ？\nいい度胸してるじゃない',
        '…私を欲しいって？\nそれなりの覚悟、あるんでしょうね'
      ],
      ojousama: [
        'わたくしを引き抜こうと？\nたいした度胸ですわね'
      ],
      delinquent: [
        'あたしを引き抜く？\n面白ぇ度胸してんじゃねーか'
      ],
      cool: [
        '…引き抜き？ 条件を聞こう'
      ],
      seductive: [
        '私を引き抜こうだなんて…\nふふ、面白い度胸してるわね'
      ],
      polite: [
        '条件を聞かせてください。それ次第です'
      ],
      composed: [
        '…引き抜き？ …面白いね。条件を聞こうか'
      ]
    },
    quiet: {
      _default: [
        '………話は聞く'
      ],
      cool: [
        '…聞こう'
      ],
      polite: [
        '…お話は伺います'
      ],
      seductive: [
        '………条件…次第ね'
      ],
      composed: [
        '……聞くよ'
      ]
    },
    shy: {
      _default: [
        'え…私なんかでいいんですか…？\n…ちょっと考えさせてください'
      ],
      polite: [
        'あ、あの…交渉、始めさせていただきます…'
      ],
    },
    easygoing: {
      _default: [
        'えっ、スカウト！？\nわくわくするね〜、話聞かせてよ！'
      ],
      delinquent: [
        'マジで！？ スカウト！？\n話聞かせてくれよ！'
      ],
      seductive: [
        'あら、スカウト？\nふふ、聞かせてもらおうかしら'
      ],
      polite: [
        '条件次第ですね。…聞かせてください！'
      ],
      ojousama: [
        '条件をお聞かせくださいまし。それ次第ですわ'
      ],
      composed: [
        'スカウト？ …まあ、話は聞くよ'
      ]
    },
    earnest: {
      _default: [
        'この団体を離れるのは簡単じゃない。\n…でも、聞くだけなら'
      ],
      polite: [
        'この団体を離れるのは簡単ではありません。\n…でも、お聞きするだけなら'
      ],
      ojousama: [
        'この団体を離れるのは容易ではありませんわ。\n…でも、お聞きするだけなら'
      ],
      seductive: [
        'この団体を離れるのは簡単じゃないの。\n…でも、聞くだけなら'
      ],
      composed: [
        '…この団体を離れるのは簡単じゃない。\n…でも、聞くだけなら'
      ]
    },
    emotional: {
      _default: [
        'え…引き抜き…？\nど、どうしよう…急に言われても…'
      ],
      seductive: [
        '交渉を始めるわ……っ……ふふ、よろしくね……'
      ],
      composed: [
        '…引き抜き。…ふぅん。…聞くよ'
      ]
    }
  },
  success: {
    normal: {
      _default: [
        '…分かった、行くわ。\n実力で居場所を作ってみせる'
      ],
      ojousama: [
        '…承知しましたわ。\n実力で居場所を作ってみせます'
      ],
      delinquent: [
        '…わかった、行くぜ。\n実力で居場所作ってやるよ'
      ],
      seductive: [
        '…わかったわ、行く。\n実力で居場所を作ってみせるわ'
      ],
      composed: [
        '…わかった、行くよ。\n…やるべきことをやるだけだ'
      ]
    },
    bold: {
      _default: [
        'いいわ…認めてあげる。\n新しい場所で格の違いを見せてあげる',
        '新しい闘いが待っているってことね。\n燃えてきた…全力でいくわよ'
      ],
      ojousama: [
        '認めてさしあげますわ。\n格の違いをお見せ致します'
      ],
      delinquent: [
        '認めてやるぜ。\n新しい場所で格の違い見せてやらぁ！'
      ],
      cool: [
        '…行く。全力でやる'
      ],
      seductive: [
        '認めてあげるわ。\n格の違いを見せてあげる'
      ],
      composed: [
        '…いいよ、行く。\n実力で示すだけだ'
      ]
    },
    quiet: {
      _default: [
        '……行く。よろしく'
      ],
      cool: [
        '…行く'
      ],
      polite: [
        '…行きます。よろしくお願いします'
      ],
      composed: [
        '…行くよ。よろしく'
      ]
    },
    shy: {
      _default: [
        '期待に応えられるよう、頑張ります…！\n…必ず、成長してみせます'
      ],
      polite: [
        'こ、こちらでお願いします…ありがとうございます…'
      ],
    },
    easygoing: {
      _default: [
        'やったー！ 新しい団体！\n楽しみすぎて眠れないかも！'
      ],
      delinquent: [
        'やったぜ！ 新しい団体！\n楽しみすぎて眠れねーよ！'
      ],
      seductive: [
        'やった！ 新しい団体ね！\n楽しみだわ'
      ],
      composed: [
        '新しい場所か。…悪くないね'
      ]
    },
    earnest: {
      _default: [
        '新しい仲間のために…全力を尽くす。\nよろしくお願いします'
      ],
      polite: [
        '新しい仲間のために…全力を尽くします。\nよろしくお願いいたします'
      ],
      ojousama: [
        '新しい仲間のために…全力を尽くしますわ。\nよろしくお願いいたします'
      ],
      seductive: [
        '新しい仲間のために…全力を尽くすわ。\nよろしくね'
      ],
      composed: [
        '…新しい場所で、やるべきことをやる。\nよろしく'
      ]
    },
    emotional: {
      _default: [
        'うっ…新しい場所で…頑張ります…！\nよろしくお願いします…！'
      ],
      seductive: [
        'これで決まりね……っ……ふふ、いい話し合いだったわ……'
      ],
      composed: [
        '…っ…新しい場所か。…頑張るよ'
      ]
    }
  },
  blocked: {
    normal: {
      _default: [
        '団体を移る気はないわ。\n今の仲間のことを考えたら、話を聞く気にもなれない',
        '…そういう話は受けられない。\n今のここが好きだから'
      ],
      ojousama: [
        '大変恐縮ですが、そのようなお話は伺えませんわ。\n今の団体への思いは揺らぎませんの'
      ],
      delinquent: [
        '悪いな、話を聞く気にならねぇ。\n今の仲間を裏切るわけにはいかねぇから'
      ],
      seductive: [
        'うれしいお誘いだけど…今の仲間を置いていく気にはなれないわ。\nごめんなさい'
      ],
      composed: [
        '…悪いけど、今の仲間を置いていく気にはなれない。\n…ごめんね'
      ]
    },
    bold: {
      _default: [
        '私が今のチームを裏切ると思った？\n見くびらないで',
        '今の居場所を捨てる気は一切ない。\n帰って'
      ],
      ojousama: [
        'わたくしへの評価は光栄だけれど、\n今の団体を裏切るなどあり得ませんわ'
      ],
      delinquent: [
        'あたしが今の仲間に背くと思ったか？\n甘ぇよ、帰れ'
      ],
      cool: [
        '…無意味だ。今ここを離れる気はない'
      ],
      seductive: [
        'ふふ…買いかぶってくれてありがとう。\nでも今の仲間を裏切るつもりは毛頭ないわ'
      ],
      composed: [
        '…悪いけど、ここを離れる気はないよ。\n今の仲間がいるから'
      ]
    },
    quiet: {
      _default: [
        '…今は動けない。ここにいる'
      ],
      cool: [
        '…話にならない。断る'
      ],
      polite: [
        '…すみません。今は、ここを離れる気になれないんです'
      ],
      composed: [
        '…動けない。ここにいる'
      ]
    },
    shy: {
      _default: [
        'え…でも、今の仲間を置いていくなんて…\nごめんなさい、どうしても首を縦に振れないです'
      ],
      polite: [
        'あ、あの…この件は、お話できません…'
      ],
    },
    easygoing: {
      _default: [
        'えっ、スカウト！嬉しいけど〜、今の子たちが好きすぎて！\nムリムリ〜！',
        'ありがとう！でも今のとこが居心地よすぎて、\n話を聞く気にならないんだよね〜！'
      ],
      delinquent: [
        'おっ、引き抜きか！気持ちは嬉しいけどな、\n今の仲間が好きすぎて動けないわ！'
      ],
      seductive: [
        'うれしいけど〜、今の子たちが大好きすぎて動けないのよね。\nごめんね'
      ],
      composed: [
        '嬉しいけど、今のメンバーが好きでね。\n…動けないんだ'
      ]
    },
    earnest: {
      _default: [
        '今の仲間とまだやり遂げることがある。\nそれが終わるまで、他の話は聞けない',
        '今のチームへの責任がある。\nそれを途中で投げ出すわけにはいかないの'
      ],
      polite: [
        '今の仲間への責任があります。\nその気持ちがある限り、ここを離れる選択はできません'
      ],
      ojousama: [
        '今の仲間への責任がありますわ。\nそれを果たすまで、他のお話は聞けませんの'
      ],
      seductive: [
        '今の仲間を途中で捨てるなんて、私には考えられない。\n…ごめんなさい'
      ],
      composed: [
        '…今の仲間への責任がある。\nそれを放り出すわけにはいかない'
      ]
    },
    emotional: {
      _default: [
        '今の団体が好きすぎて…そんな話を聞いたら、\n自分が嫌いになりそうで…！ごめんなさい',
        'ここのみんなが大好きで…！\n裏切るなんて考えるだけで苦しい…！ごめんなさい…！'
      ],
      seductive: [
        'その話は……っ……ふふ、できないの、ごめんなさい……'
      ],
      composed: [
        '…ここが好きなんだ。\n…悪いけど、その話は聞けない'
      ]
    }
  },
  fail: {
    normal: {
      _default: [
        '…悪いけど、今回はパス。\n縁があればまたね'
      ],
      ojousama: [
        '申し訳ありませんが、今回はご遠慮しますわ'
      ],
      delinquent: [
        '悪ぃけど、今回はパスだ。\n縁があればまたな'
      ],
      seductive: [
        'ごめんなさい、今回はパス。\n縁があればまたね'
      ],
      composed: [
        '…悪いけど、パスで。\n縁があればまた'
      ]
    },
    bold: {
      _default: [
        '…悪いけど、ここが私の居場所よ。\n出直してきなさい',
        'まだこの団体でやりきってないので。\n…その話はなかったことにしてください。'
      ],
      ojousama: [
        'ここがわたくしの居場所なの。\n出直していらして'
      ],
      delinquent: [
        'ここがあたしの居場所だ。\n出直してきな'
      ],
      cool: [
        '…断る。ここが居場所だ'
      ],
      seductive: [
        'ここが私の居場所なの。\n出直してきて'
      ],
      composed: [
        '…ここが居場所だから。\n悪いね'
      ]
    },
    quiet: {
      _default: [
        '………ここにいる'
      ],
      cool: [
        '…断る'
      ],
      polite: [
        '…すみません、ここに残ります'
      ],
      composed: [
        '…ここにいる'
      ]
    },
    shy: {
      _default: [
        'まだここで学ぶことがあるんです…。\n…すみません'
      ],
      polite: [
        'す、すみません…今回は、難しいです…'
      ],
    },
    easygoing: {
      _default: [
        'ごめんね〜、やっぱり今のとこが好きなの！\nまたね〜！'
      ],
      delinquent: [
        'ごめんな〜、今のとこが好きなんだよ！\nまたな！'
      ],
      seductive: [
        'ごめんなさいね、今のところが好きなの。\nまたね'
      ],
      composed: [
        '悪いけど、今のとこが好きでね。\nまた縁があれば'
      ]
    },
    earnest: {
      _default: [
        'みんなを置いて行くわけにはいかない。\n…ごめんなさい'
      ],
      polite: [
        '皆さんを置いて行くわけにはいきません。\n…申し訳ありません'
      ],
      ojousama: [
        '皆さまを置いて行くわけにはまいりませんわ'
      ],
      seductive: [
        'みんなを置いて行くわけにはいかないの。\n…ごめんなさい'
      ],
      composed: [
        '…みんなを置いてはいけない。\n…ごめん'
      ]
    },
    emotional: {
      _default: [
        'ごめんなさい…今はここを離れられないの…！\nまたいつか…！'
      ],
      seductive: [
        '残念だけど……っ……今回は無理ね、ごめんなさい……'
      ],
      composed: [
        '…ごめん。今は離れられない'
      ]
    }
  }
};

// ── 契約更新交渉セリフ (contract-negotiation-event-spec v1.0) ─────────────
// 5性格(bold/introverted/carefree/earnest/emotional) × 態度 × 分岐
// テンプレ変数: {tenure} {record} {rivalry} {tenure_farewell} {wins} {losses} {n} {rivalName}
const CONTRACT_NEGOTIATION_LINES = {
  raise_open: {
    normal: {
      _default: [
        '社長、少し相談があるんですけど。{tenure}{record}もう少し待遇を見直してもらえませんか。',
        '社長、契約のことなんですけど。{record}正直、もうちょっと欲しいなって思ってて。'
      ],
      ojousama: [
        '社長、お時間よろしいかしら。{tenure}待遇について、ご相談させてください。{record}'
      ],
      delinquent: [
        '社長、ちょっといいか。{tenure}{record}給料の話なんだけどさ。もうちょい出してくんねーの？'
      ],
      seductive: [
        '社長、ちょっといい？ {tenure}{record}…もう少しだけ、考えてくれない？'
      ],
      cool: [
        '……考えさせてくれ'
      ],
      polite: [
        'ありがとうございます。前向きに検討させていただきます'
      ],
      composed: [
        'まあ…社長、少しいいかな。{tenure}{record}悪くない環境だと思ってるけど…もう少し、考えてもらえると嬉しいね。'
      ]
    },
    bold: {
      _default: [
        '社長、はっきり言わせてもらいます。{tenure}この給料はナメてます。{record}正当な評価をしてほしい。それだけです。',
        '社長、話があります。{record}{tenure}これだけやって、この待遇は通らないでしょう。'
      ],
      ojousama: [
        '社長。{tenure}申し上げにくいのですが、この待遇はわたくしに見合いませんわ。{record}'
      ],
      delinquent: [
        'おい社長。{tenure}この給料はふざけてんのか。{record}ちゃんと評価しろよ。'
      ],
      cool: [
        '…社長。{tenure}{record}この額じゃ、やってられない'
      ],
      seductive: [
        'ねえ社長。{tenure}もうちょっと私のこと大事にしてくれてもいいんじゃない？ {record}'
      ],
      polite: [
        'ありがとうございます。…ただ、もう少し条件を詰めさせてください'
      ],
      composed: [
        '…社長。{tenure}率直に言うね。{record}この額は…ちょっと寂しいかな。'
      ]
    },
    quiet: {
      _default: [
        'あの……社長、少しお時間いただけますか……。{tenure}その……お給料のことなんですけど……。',
        '……社長、言いにくいんですけど……。{record}もう少しだけ……お願いできないかなって……。'
      ],
      cool: [
        '…社長。{tenure}…給料の話。{record}…考えてほしい'
      ],
      polite: [
        'あの…社長、すみません…。{tenure}お給料のことで…少しだけ、ご相談したくて……。'
      ],
      seductive: [
        '………考えさせて'
      ],
      composed: [
        '……社長、少しだけ。{tenure}…お給料のこと…落ち着いて話せるうちに、伝えておきたくて。'
      ]
    },
    shy: {
      _default: [
        'あ、あの…社長…。{tenure}その…言いにくいんですけど…お給料のこと…少しだけ……。',
        '…す、すみません社長…。{record}もう少しだけ…お願いできたらなって……。'
      ],
      polite: [
        'あ、あの…契約のことで、お話があるんです…'
      ],
    },
    easygoing: {
      _default: [
        'やっほー社長！ いやー毎年この時期って緊張するよね。{tenure}ぶっちゃけ、もうちょい欲しいなーって。ダメ？',
        '社長ー、お金の話していい？ {record}ちょっとだけ上がんないかなーって思ってたんだよね〜。'
      ],
      delinquent: [
        'よー社長。{tenure}給料の話なんだけどさー。もうちょいくれよー。{record}'
      ],
      seductive: [
        '社長ー♪ {tenure}お給料のことなんだけどさ…もうちょっとだけ♡ ダメ？'
      ],
      polite: [
        'ありがとうございます！ 前向きに考えます！'
      ],
      ojousama: [
        'ありがとうございますわ。前向きに検討いたしますの'
      ],
      composed: [
        'やあ社長。{tenure}まあ…お給料のことなんだけどさ。ちょっとだけ、考えてくれない？'
      ]
    },
    earnest: {
      _default: [
        '社長、お時間ありがとうございます。{tenure}契約のことで、筋を通してお話させてください。{record}',
        '社長。正直にお伝えします。{record}この待遇では、自分の努力に見合わないと感じています。'
      ],
      polite: [
        '社長、お忙しいところ恐れ入ります。{tenure}契約について、ご相談させていただきたく…。{record}'
      ],
      ojousama: [
        '社長。{tenure}契約のことで筋を通させていただきたく存じますわ。{record}'
      ],
      seductive: [
        '社長、大事な話があるの。{tenure}{record}ちゃんと評価してほしいな'
      ],
      composed: [
        '社長、筋を通させてください。{tenure}{record}…落ち着いて考えた結論です。'
      ]
    },
    emotional: {
      _default: [
        '社長……！ 聞いてください……！ {tenure}{record}私、もっとできるのに……このままじゃ悔しい……！',
        '……なんで……なんで評価してくれないんですか……！ {record}頑張ってるのに……！'
      ],
      seductive: [
        '契約の話……っ……聞いてもらいたいことがあるの……'
      ],
      composed: [
        '…社長。{tenure}{record}……悔しくないって言ったら、嘘になるかな…っ。'
      ]
    }
  },
  transfer_open: {
    normal: {
      _default: [
        '社長、話があります。{tenure}ここを離れようと思ってるんです。',
        '社長。{tenure}色々考えたんですけど…他の環境でやってみたくて。'
      ],
      ojousama: [
        '社長。{tenure}お伝えしづらいのですが…退団を考えておりますの。'
      ],
      delinquent: [
        '社長。{tenure}悪いけど、もうここ出るわ。'
      ],
      seductive: [
        '社長…ごめんなさい。{tenure}ここを離れたいの。'
      ],
      composed: [
        '社長…少し話がある。{tenure}ここを離れようかと…まあ、そういうことです。'
      ]
    },
    bold: {
      _default: [
        '社長。{tenure}もう決めました。この団体を出ます。',
        '……はっきり言います。{tenure}ここではもう成長できない。出ます。'
      ],
      ojousama: [
        '社長。{tenure}決心がつきましたの。わたくし、この団体を去りますわ。'
      ],
      delinquent: [
        '社長。{tenure}もう決めた。ここ出るぜ。'
      ],
      cool: [
        '…{tenure}出る。もう決めた'
      ],
      seductive: [
        '社長。{tenure}もう決めたの。…ここを出るわ。'
      ],
      composed: [
        '…社長。{tenure}決めたよ。…出る。特に未練はない。'
      ]
    },
    quiet: {
      _default: [
        'あの……社長……。{tenure}言いにくいんですけど……もう、ここを離れたいです……。',
        '……ごめんなさい……。{tenure}私なんかいなくても……変わらないと思うんです……。'
      ],
      cool: [
        '…{tenure}…出たい。…それだけ'
      ],
      polite: [
        'あの…社長…。{tenure}言いにくいのですが……退団したいと思っています……。'
      ],
      composed: [
        '……社長。{tenure}…離れたいの。…静かに決めたことだから。'
      ]
    },
    shy: {
      _default: [
        'あの…社長……。{tenure}す、すみません…ここを…離れたいんです……。',
        '…ごめんなさい……。{tenure}私には…ここにいる資格がないような気がして……。'
      ],
      polite: [
        'あ、あの…他の団体からも、お話をいただいていて…'
      ],
    },
    easygoing: {
      _default: [
        '社長、あのね。{tenure}色々考えたんだけどさ、環境変えてみようかなーって。',
        'いやー社長。言いにくいんだけどさー。{tenure}ちょっと外の空気吸ってみたいなーって。'
      ],
      delinquent: [
        '社長。{tenure}悪いけどさー、ちょっと外に出てみたいんだよね。'
      ],
      seductive: [
        '社長、あのね…。{tenure}ちょっと新しいことしてみたいなって。…ごめんね。'
      ],
      composed: [
        'まあ…社長。{tenure}ちょっと環境変えてみようかなって。…深刻な話じゃないよ。'
      ]
    },
    earnest: {
      _default: [
        '社長、大切なお話があります。{tenure}悩みに悩みましたが……退団を願い出たいのです。',
        '社長。{tenure}ここで学んだことは一生の財産です。ですが……先に進むべき時が来たと思っています。'
      ],
      polite: [
        '社長。{tenure}大変申し訳ないのですが…退団のご相談をさせてください。'
      ],
      ojousama: [
        '社長。{tenure}心苦しいのですが…退団を願い出たく存じますわ。'
      ],
      seductive: [
        '社長。{tenure}ここで過ごした時間は大切よ。でも…次の場所を見つけたいの。'
      ],
      composed: [
        '社長。{tenure}ここでの時間は…悪くなかった。ただ…次に進むべきだと思ってます。'
      ]
    },
    emotional: {
      _default: [
        '社長……もう無理です……！ {tenure}ここにいても……どんどんダメになっていく気がして……！',
        '……{tenure}もう、限界なんです……。{record}自分でもわかってます……このままじゃいけないって……。'
      ],
      seductive: [
        '他から声がかかってるの……っ……ふふ、どうしようかしら……'
      ],
      composed: [
        '…社長…っ。{tenure}…ここにいたかった…けど…もう、いられない…。'
      ]
    }
  },
  raise_accept: {
    normal: {
      _default: [
        'ありがとうございます。これからもよろしくお願いしますね。'
      ],
      ojousama: [
        'ありがとうございますわ。より一層、精進いたしますわね。'
      ],
      delinquent: [
        'サンキュ、社長。ちゃんと働くからよ。'
      ],
      seductive: [
        'ありがと、社長♡ もっと頑張っちゃうからね。'
      ],
      composed: [
        'ふぅん…悪くないね。まあ、期待に応えるよ。'
      ]
    },
    bold: {
      _default: [
        '……ありがとうございます。分かってくれる社長で良かった。今期も全力でいきますよ。'
      ],
      ojousama: [
        '……理解が早いわね。この評価に見合う結果を期待していなさい。'
      ],
      delinquent: [
        '……ま、当然だけどな。ちゃんと評価してくれんじゃん。'
      ],
      cool: [
        '…ありがとう。結果で返す'
      ],
      seductive: [
        'ふふ、分かってくれるじゃない♡ 期待しててね。'
      ],
      composed: [
        '…なるほど。まあ…分かってくれるなら、それでいい。やるよ。'
      ]
    },
    quiet: {
      _default: [
        'え……本当ですか……？ あ、ありがとうございます……！ 頑張ります……！'
      ],
      cool: [
        '…ありがとう。…頑張る'
      ],
      polite: [
        'え…本当ですか…？ ありがとうございます…！ 精一杯頑張ります…！'
      ],
      composed: [
        '……ありがとう…ございます。…嬉しい。…頑張るね。'
      ]
    },
    shy: {
      _default: [
        'え…い、いいんですか…？ あ、ありがとうございます…！ 頑張ります…！'
      ],
      polite: [
        'こ、こんな良いお話…あ、ありがとうございます…精一杯頑張ります…'
      ],
    },
    easygoing: {
      _default: [
        'やったー！ さすが社長！ 今年も楽しくやろうね〜！'
      ],
      delinquent: [
        'おっしゃー！ さすが社長！ やる気出てきたぜ！'
      ],
      seductive: [
        'やったー♡ さすが社長、太っ腹～♪'
      ],
      composed: [
        'おっ、ありがと。まあ…のんびりやらせてもらうよ。'
      ]
    },
    earnest: {
      _default: [
        '感謝します。期待に応えられるよう、全力を尽くします。'
      ],
      polite: [
        'ありがとうございます。ご期待に沿えるよう、精一杯努めます。'
      ],
      ojousama: [
        '感謝いたしますわ。期待に応えてみせますわね。'
      ],
      seductive: [
        'ありがとう。…期待に応えるからね。見ててね。'
      ],
      composed: [
        '…ありがとうございます。この評価に…恥じない結果を出します。'
      ]
    },
    emotional: {
      _default: [
        '社長……！ ありがとうございます……！ 絶対に結果で返します……！'
      ],
      seductive: [
        '受けるわ……っ……ふふ、こんなに評価してくれて、嬉しい……'
      ],
      composed: [
        '…社長…っ…ありがとう…ございます。…絶対、返すから…。'
      ]
    }
  },
  raise_negotiate_accept: {
    normal: {
      _default: [
        'まあ、上がるならありがたいです。頑張りますね。'
      ],
      ojousama: [
        '……そのお気持ちだけでも、嬉しいわ。'
      ],
      delinquent: [
        'まー上がるだけマシか。サンキュ。'
      ],
      seductive: [
        '少しでも考えてくれたのね。…ありがと♡'
      ],
      composed: [
        'まあ…気持ちは受け取ったよ。悪くないね。'
      ]
    },
    bold: {
      _default: [
        '……まあ、ゼロじゃないなら受けてやります。次は正当な評価を期待してますよ。'
      ],
      ojousama: [
        '……今はこういう評価という事ね。次はきちんとした評価を期待しますわ。'
      ],
      delinquent: [
        '……ま、ゼロよりマシか。次はもっと出せよな。'
      ],
      cool: [
        '…ゼロじゃないなら、まあいい。次は期待してる'
      ],
      seductive: [
        '……まあ、少しは考えてくれたのね。次はもっと期待してるわよ♡'
      ],
      composed: [
        '…ゼロじゃないなら…まあ、いいよ。次はもう少し期待してる。'
      ]
    },
    quiet: {
      _default: [
        'それだけでも……ありがたいです。ありがとうございます……。'
      ],
      cool: [
        '…分かった。ありがとう'
      ],
      polite: [
        '少しでも上げていただけるなんて…ありがとうございます……。'
      ],
      composed: [
        '……それだけでも…ありがたいです。…ちゃんと覚えてるよ。'
      ]
    },
    shy: {
      _default: [
        'そ、それだけでも…ありがたいです…。ありがとうございます……。'
      ],
      polite: [
        'は、はい…その条件で…お受けします…'
      ],
    },
    easygoing: {
      _default: [
        'んー、まあいっか！ もらえるだけラッキーってことで！'
      ],
      delinquent: [
        'まーいいか！ もらえるだけ儲けもんだぜ！'
      ],
      seductive: [
        'んー、まあいっか♪ 気持ちは伝わったし♡'
      ],
      composed: [
        'まあ…もらえるなら、いいんじゃない。ありがとね。'
      ]
    },
    earnest: {
      _default: [
        '……分かりました。社長の判断を尊重します。この額で、精一杯やります。'
      ],
      polite: [
        '……ありがとうございます。この額で精一杯、お応えいたします。'
      ],
      ojousama: [
        '……社長のご判断を尊重いたしますわ。精一杯やりますわね。'
      ],
      composed: [
        '…なるほど。社長の判断なら…受け入れるよ。やれることをやる。'
      ]
    },
    emotional: {
      _default: [
        '……本当は足りないけど……社長が考えてくれたってことは、伝わりました。'
      ],
      seductive: [
        'その条件なら……っ……ふふ、いいわよ、受けてあげる……'
      ],
      composed: [
        '……足りない…けど…っ。…気持ちは、受け取ったから…。'
      ]
    }
  },
  raise_negotiate_refuse: {
    normal: {
      _default: [
        '……そうですか。分かりました。'
      ],
      ojousama: [
        '……左様ですか。承知いたしました。'
      ],
      delinquent: [
        '……チッ。まあ分かったよ。'
      ],
      seductive: [
        '……そう。残念ね。'
      ],
      composed: [
        '…そう。まあ…そういうこともあるよね。'
      ]
    },
    bold: {
      _default: [
        '……そうですか。まあいいでしょう。でもね社長、次はないと思ってください。'
      ],
      ojousama: [
        '……左様ですか。ですが社長、次はありませんわよ。'
      ],
      delinquent: [
        '……は？ マジかよ。……まあいい。でも次はねーぞ。'
      ],
      cool: [
        '…そう。…覚えておく'
      ],
      seductive: [
        '……ふうん。まあいいわ。でもね、次はないからね？'
      ],
      composed: [
        '…ふぅん。まあいいけど…次は、ないよ。覚えておいて。'
      ]
    },
    quiet: {
      _default: [
        '……そう、ですか……。分かりました……。'
      ],
      cool: [
        '…そう。…分かった'
      ],
      polite: [
        '……そうですか……。分かりました……。すみません……。'
      ],
      composed: [
        '……そう…。…分かった。…仕方ないね。'
      ]
    },
    shy: {
      _default: [
        '……そう…ですか……。す、すみません、変なこと言って……。'
      ],
      polite: [
        '考えさせていただいたんですが…やっぱり、難しいです…'
      ],
    },
    easygoing: {
      _default: [
        'あちゃー、ダメかー。まあしょうがないよねー。……でもちょっとへこむなー。'
      ],
      delinquent: [
        'あちゃー、マジかー。まーしゃーねーか。'
      ],
      seductive: [
        'えー、ダメ？ …まあしょうがないかぁ。ちょっと寂しいけど。'
      ],
      composed: [
        'あら…ダメか。まあ…しょうがないね。'
      ]
    },
    earnest: {
      _default: [
        '……残念ですが、了解しました。ただ、この判断の結果は覚えていてください。'
      ],
      polite: [
        '……残念ですが、承知いたしました。ですが、この判断はお忘れなきよう。'
      ],
      ojousama: [
        '……残念ですわ。ですが、この判断の結果はお忘れなきよう。'
      ],
      composed: [
        '…残念ですが…了解です。ただ…この判断は、忘れないでください。'
      ]
    },
    emotional: {
      _default: [
        '……やっぱり……ダメなんだ……。……わかりました。'
      ],
      seductive: [
        '考えたけれど……っ……やっぱり、難しいわ、ごめんなさい……'
      ],
      composed: [
        '……やっぱり…っ…。……分かった…。'
      ]
    }
  },
  raise_refuse: {
    normal: {
      _default: [
        '……そうですか。分かりました。……ちょっと残念ですけど。'
      ],
      ojousama: [
        '……そうですか。承知いたしました……。'
      ],
      delinquent: [
        '……マジかよ。……まあいいけどさ。'
      ],
      seductive: [
        '……そう。残念だけど…仕方ないわね。'
      ],
      composed: [
        '…そう。まあ…残念だけど、仕方ないね。'
      ]
    },
    bold: {
      _default: [
        '…………。そうですか。分かりました。でもね社長、我慢の限界ってものがあるんで。そのつもりでいてください。'
      ],
      ojousama: [
        '…………。そうですか。わたくしにも限度というものがありますのよ？'
      ],
      delinquent: [
        '……は？ ……ふーん。まあいいけどよ、限界ってもんがあるからな。'
      ],
      cool: [
        '…そう。…我慢にも、限界はある'
      ],
      seductive: [
        '……ふうん。まあいいけど、我慢にも限度があるからね？'
      ],
      composed: [
        '…そう。…まあいいよ。ただ…我慢にも限度がある。それだけ。'
      ]
    },
    quiet: {
      _default: [
        '……はい……分かりました……。……すみません、変なこと言って……。'
      ],
      cool: [
        '…そう。……分かった'
      ],
      polite: [
        '……はい…分かりました……。すみません、ご無理を言って……。'
      ],
      composed: [
        '……そう…。…分かりました。…少し、残念かな。'
      ]
    },
    shy: {
      _default: [
        '……は、はい…分かりました……。す、すみませんでした……。'
      ],
      polite: [
        'すみません…この条件では、ちょっと…'
      ],
    },
    easygoing: {
      _default: [
        'あはは、やっぱりー？ まーしょうがないっか。でもいつか上げてね？ 約束だよー？'
      ],
      delinquent: [
        'あー、やっぱダメか。まーいいけどさ、いつか上げろよな？'
      ],
      seductive: [
        'えー、やっぱりダメ？ …いつか上げてね？ 約束よ♡'
      ],
      composed: [
        'あらら…まあ、そうなるかなとは思ってた。いつか上げてね。'
      ]
    },
    earnest: {
      _default: [
        '……承知しました。ですが、このまま変わらなければ、いずれ考えを改めざるを得ません。'
      ],
      polite: [
        '……承知いたしました。ですが、このままでは…いずれ考えざるを得ません。'
      ],
      ojousama: [
        '……承知いたしましたわ。ですが、このまま変わらなければ…。'
      ],
      composed: [
        '…承知しました。ただ…このままでは、いずれ動くことになる。それだけです。'
      ]
    },
    emotional: {
      _default: [
        '……っ！ ……もういいです。分かりました。……悔しい……。'
      ],
      seductive: [
        '……っ……ごめんなさい、その条件では納得できないの……'
      ],
      composed: [
        '……っ…。…分かった…。…悔しく、ないから…。'
      ]
    }
  },
  transfer_retain_success: {
    normal: {
      _default: [
        '……そこまでしてくれるんですね。…分かりました。もう少し頑張ってみます。'
      ],
      ojousama: [
        '……そこまでおっしゃるなら。もう少しお付き合いいたします。'
      ],
      delinquent: [
        '……マジかよ。そこまで言うなら、もうちょいいてやるか。'
      ],
      seductive: [
        '……そこまでしてくれるの？ …もう少しだけ、いてあげる♡'
      ],
      composed: [
        '…ふぅん。そこまでしてくれるんだ。…まあ…もう少しだけ、いるよ。'
      ]
    },
    bold: {
      _default: [
        '……チッ。仕方ない。そこまで言うなら、もう少しだけ付き合ってやります。'
      ],
      ojousama: [
        '……仕方ありませんわね。……あと少しだけ付き合ってあげる。'
      ],
      delinquent: [
        '……チッ。そこまで言うなら、もうちょい付き合ってやるよ。'
      ],
      cool: [
        '…そこまで言うなら、もう少しだけ'
      ],
      seductive: [
        '……仕方ないわね。そこまで言うなら、もう少しだけ付き合ってあげる。'
      ],
      composed: [
        '…そこまで言うなら…まあ、もう少し付き合うよ。'
      ]
    },
    quiet: {
      _default: [
        'えっ……そこまでしてくれるんですか……？ ……もう少しだけ、頑張ってみます……。'
      ],
      cool: [
        '…そこまで言うなら。…もう少しだけ'
      ],
      polite: [
        'えっ…そこまでしてくださるんですか…？ ……もう少しだけ、頑張ってみます……。'
      ],
      composed: [
        '……そこまで…してくれるんだ。…もう少しだけ…頑張ってみるね。'
      ]
    },
    shy: {
      _default: [
        'え…そ、そこまでしてくれるんですか…？ ……あの…もう少しだけ…頑張ります……。'
      ],
      polite: [
        'こ、ここに残ります…引き止めてくださって、ありがとうございます…'
      ],
    },
    easygoing: {
      _default: [
        'え、マジ？ そこまでしてくれんの？ ……じゃあもうちょっといよっかな！'
      ],
      delinquent: [
        'マジかよ。そこまでしてくれんの？ じゃーもうちょいいるか！'
      ],
      seductive: [
        'え、そこまでしてくれるの？ …じゃあもうちょっといよっかな♪'
      ],
      composed: [
        'へえ…そこまでしてくれるんだ。…じゃあ、もうちょっといようかな。'
      ]
    },
    earnest: {
      _default: [
        '……社長の誠意、受け止めました。もう一度、この団体で全力を尽くします。'
      ],
      polite: [
        '……社長のお気持ち、しかと受け止めました。もう一度、全力を尽くさせてください。'
      ],
      ojousama: [
        '……その誠意、しかと受け止めましたわ。もう一度、全力で臨みますわ。'
      ],
      composed: [
        '…社長の誠意は…伝わりました。もう一度…やってみます。'
      ]
    },
    emotional: {
      _default: [
        '社長……！ ……ごめんなさい、こんな私のために……。……絶対、恩返しします……！'
      ],
      seductive: [
        '残るわ……っ……ふふ、こんなに引き止められたら、行けないでしょう……'
      ],
      composed: [
        '…社長…っ…。…ありがとう…。…必ず、返すから…。'
      ]
    }
  },
  transfer_retain_fail: {
    normal: {
      _default: [
        '……ありがたいんですけど…もう、決めたんです。すみません。'
      ],
      ojousama: [
        'お気持ちは嬉しいのですが…もう、決めました。'
      ],
      delinquent: [
        '……悪いけど、もう決めたんだよ。気持ちは変わらねー。'
      ],
      seductive: [
        '……ありがとう。でも…もう決めたの。ごめんね。'
      ],
      composed: [
        '…ありがたいけど…もう決めたんだ。…悪いね。'
      ]
    },
    bold: {
      _default: [
        '……悪いけど、もう決めたんです。気持ちは変わりません。'
      ],
      ojousama: [
        '……今更。　……もう心は決まっているわ'
      ],
      delinquent: [
        '……悪いけど、もう決めた。何言われても変わらねー。'
      ],
      cool: [
        '…決めた。変わらない'
      ],
      seductive: [
        '……悪いけど、もう決めたの。…引き止めても無駄よ。'
      ],
      composed: [
        '…悪いけど、もう決めた。…変わらないよ。'
      ]
    },
    quiet: {
      _default: [
        '……ごめんなさい……。ありがたいんですけど……もう、決めたんです……。'
      ],
      cool: [
        '…ごめん。…もう決めた'
      ],
      polite: [
        '……ありがたいのですが……もう、決めました……。すみません……。'
      ],
      composed: [
        '……ごめんね…。…もう、決めたから。…静かに行かせて。'
      ]
    },
    shy: {
      _default: [
        '…ご、ごめんなさい……。でも…もう、決めたんです……。'
      ],
      polite: [
        'ご、ごめんなさい…やっぱり、行かせてください…'
      ],
    },
    easygoing: {
      _default: [
        'ごめんね社長……。お金の問題じゃないんだよね。心が決まっちゃったから。'
      ],
      delinquent: [
        '悪いな社長。金の問題じゃねーんだよ。もう決めちまったから。'
      ],
      seductive: [
        'ごめんね社長…。お金じゃないの。気持ちが決まっちゃったから…。'
      ]
    },
    earnest: {
      _default: [
        'お気持ちはありがたいのですが……この決断は、ずっと考え抜いた末のものです。申し訳ありません。'
      ],
      polite: [
        'お心遣い、ありがとうございます。ですが…この決断は変わりません。申し訳ございません。'
      ],
      ojousama: [
        'お気持ちは嬉しゅうございますわ。ですが…この決断は揺るぎません。申し訳ございません。'
      ]
    },
    emotional: {
      _default: [
        '社長……ありがとう……。でも……もう戻れないんです……ごめんなさい……！'
      ],
      seductive: [
        'ごめんなさい……っ……気持ちはもう決まってるの……'
      ],
    }
  },
  transfer_release: {
    normal: {
      _default: [
        '……分かりました。{tenure_farewell}{rivalry}お世話になりました。'
      ],
      ojousama: [
        '……承知いたしました。{tenure_farewell}{rivalry}ごきげんよう。'
      ],
      delinquent: [
        '……おう。{tenure_farewell}{rivalry}じゃーな。'
      ],
      seductive: [
        '……そう。{tenure_farewell}{rivalry}元気でね。'
      ]
    },
    bold: {
      _default: [
        '……ふん。まあ、そうなるだろうと思ってた。{rivalry}じゃあね、社長。'
      ],
      ojousama: [
        '……ふふ。予想通りですわ。{rivalry}ごきげんよう、社長。'
      ],
      delinquent: [
        '……だろうな。分かってたぜ。{rivalry}じゃーな、社長。'
      ],
      cool: [
        '…そう。{rivalry}…じゃあ'
      ],
      seductive: [
        '……ふふ、予想通りね。{rivalry}じゃあね、社長。'
      ]
    },
    quiet: {
      _default: [
        '……ありがとうございました。{tenure_farewell}{rivalry}……お世話になりました。'
      ],
      cool: [
        '…{tenure_farewell}{rivalry}…ありがとう'
      ],
      polite: [
        '……ありがとうございました。{tenure_farewell}{rivalry}…お世話になりました……。'
      ]
    },
    shy: {
      _default: [
        '…あ、ありがとうございました…。{tenure_farewell}{rivalry}…お世話になりました……。'
      ],
      polite: [
        'あ、あの…移籍させてください…お、お世話になりました…'
      ],
    },
    easygoing: {
      _default: [
        'あはは、まあそうなるよねー。{tenure_farewell}{rivalry}元気でねー！'
      ],
      delinquent: [
        'まーそうなるよなー。{tenure_farewell}{rivalry}元気でな！'
      ],
      seductive: [
        'あはは、そうなるよね。{tenure_farewell}{rivalry}元気でね～♪'
      ]
    },
    earnest: {
      _default: [
        '……承知しました。{tenure_farewell}この団体で過ごした日々に、感謝します。{rivalry}'
      ],
      polite: [
        '……承知いたしました。{tenure_farewell}この団体での日々に、心から感謝いたします。{rivalry}'
      ],
      ojousama: [
        '……承知いたしましたわ。{tenure_farewell}こちらでの日々、忘れませんわ。{rivalry}'
      ]
    },
    emotional: {
      _default: [
        '{tenure_farewell}……ここでの時間は、忘れません……。{rivalry}……さようなら……。'
      ],
      seductive: [
        '移籍させて……っ……ふふ、新しい場所で輝きたいの……'
      ],
    }
  },
  transfer_listen: {
    normal: {
      _default: [
        '聞いてくれるんですね。{record}正直、新しい場所で挑戦してみたいんです。'
      ],
      ojousama: [
        'お耳を傾けてくださるのね。{record}新たな場所で己を試したいのです。'
      ],
      delinquent: [
        '聞いてくれんのか。{record}正直、もっと面白えとこでやりてーんだよ。'
      ],
      seductive: [
        '聞いてくれるの？ {record}…新しい場所で、自分を試してみたいの。'
      ]
    },
    bold: {
      _default: [
        '……聞いてくれるの？{record}正直、もっと上の舞台で闘いたいんです。ここじゃ物足りない。'
      ],
      ojousama: [
        '……聞いてくださるの。{record}わたくし、もっと上の舞台を求めておりますの。'
      ],
      delinquent: [
        '……聞いてくれんのか。{record}正直、もっと上で闘いてーんだよ。物足りねー。'
      ],
      cool: [
        '…聞いてくれるのか。{record}…もっと上で闘いたい。それだけだ'
      ],
      seductive: [
        '……聞いてくれるの。{record}正直ね、もっと大きな舞台が見たいの。'
      ]
    },
    quiet: {
      _default: [
        '……聞いてくれるんですか……。{record}私……ここにいる意味が、分からなくなって……。'
      ],
      cool: [
        '…聞いてくれるんだ。{record}…ここにいる意味が、分からない'
      ],
      polite: [
        '……聞いてくださるんですか……。{record}私…ここにいる意味が、見えなくなって……。'
      ]
    },
    shy: {
      _default: [
        'え…聞いてくれるんですか…？ {record}あの…私…ここにいていいのか、分からなくなって……。'
      ],
      polite: [
        'お、お話だけは…聞かせていただきます…'
      ],
    },
    easygoing: {
      _default: [
        '聞いてくれるの？ うーん……{record}なんかさ、マンネリっていうか。新しいことしたいんだよね。'
      ],
      delinquent: [
        '聞いてくれんの？ {record}なんつーか、マンネリなんだよな。新しいとこ行きてーんだ。'
      ],
      seductive: [
        '聞いてくれるの？ うーん…{record}なんかね、新しいこと始めたいなって♪'
      ]
    },
    earnest: {
      _default: [
        'ありがとうございます。{record}自分なりに考えた結果です。ここでの経験は感謝しています。ですが……新しい環境で挑戦したいのです。'
      ],
      polite: [
        'ありがとうございます。{record}ここでの経験には心から感謝しております。ですが…新しい環境で挑戦させてください。'
      ],
      ojousama: [
        'ありがとうございますわ。{record}こちらでの経験は一生の宝ですわ。ですが…新天地で挑戦したいのです。'
      ]
    },
    emotional: {
      _default: [
        '……聞いてくれるの……？ {record}もう……自分がどうしたいのかも分からなくなって……。でも、このままじゃダメだって……。'
      ],
      seductive: [
        '話だけは聞くわ……っ……それで決めるから……'
      ],
    }
  },
  tenure: {
    '1': 'まだ1年ですけど、',
    short: 'ここで過ごした{n}年間、',
    long: 'もう{n}年になるんですね……。',
    founder: '旗揚げからここにいるんですよ、私。'
  },
  record: {
    ace: 'この団体で一番やれてる自信はあります。それは数字にも出てるはずです。',
    good: '自分なりに結果は出してきたつもりです。',
    developing: 'まだ発展途上なのはわかってます。でも、ちゃんと見てほしいんです。',
    few_matches: 'あんまり試合に出してもらえなかった……。'
  },
  rivalry: {
    has_rival: '{rivalName}とまだ決着ついてないけど……もういいです。',
    no_rival: ''
  },
  tenure_farewell: {
    short: '',
    long: 'ここで過ごした{n}年間、無駄じゃなかったって思いたいです。',
    founder: '旗揚げの時からいたんだな……なんか、不思議。'
  },
  // v2.0 §5.3: 突発退団セリフ（trust < 15 かつ gapRatio ≥ 1.1）
  sudden_departure: {
    bold: {
      _default: [
        '社長、もう無理です。お世話になりました、と言いたいところですけど正直そうも思えない。',
        'もう決めました。これ以上ここにいる理由がない。',
        '社長にはわかんないでしょうけど、私はもう限界なんです。じゃあね。'
      ],
      delinquent: [
        'あーもう無理。やってらんない。辞めるわ。',
        '金も信頼もないんじゃ、いる意味ないっしょ。バイバイ。'
      ],
      cool: [
        '……辞めます。以上。',
        '……もう、いいです。'
      ]
    },
    introverted: {
      _default: [
        '……すみません。もう、限界なんです。……さようなら。',
        '……ずっと我慢してきたんです。でも、もう……。',
        '……何も言わずに去ろうかと思ったけど、一応挨拶だけ。辞めます。'
      ],
      polite: [
        '……お忙しいところすみません。退団届を、出させてください。',
        '……色々考えたんですけど、もう続けられません。すみません。'
      ]
    },
    carefree: {
      _default: [
        'いやー、ついにこの日が来ちゃいましたね。じゃ、元気で。',
        'もう潮時かなって。楽しかったですよ、うん。じゃあね！',
        'あはは、もう笑うしかないですよね。辞めまーす。'
      ],
      seductive: [
        'ふふ、もう引き止めないでくださいね？ 決めちゃったんですから。',
        'さよなら、社長。楽しかった時もあったわ。'
      ]
    },
    earnest: {
      _default: [
        '社長、長い間お世話になりました。でも、もうここでは続けられません。',
        '自分なりにずっと考えてきました。……ここを去ることにします。',
        'これ以上、自分を偽って続けることはできません。退団させてください。'
      ],
      ojousama: [
        'お別れの時が参りました。どうか、お元気で。',
        '大変お世話になりました。ですが、もう限界でございます。'
      ]
    },
    emotional: {
      _default: [
        'もういいです。もう何も言いたくない。……さよなら。',
        'なんで……なんでこんなことになったんですか。もう無理です、辞めます。',
        '悔しい……悔しいけど、もうここにはいられない。'
      ]
    },
    shy: {
      _default: [
        '……あの、辞め……辞めさせてください……。もう、無理なんです……。',
        '……ごめんなさい。もう、ここにはいられません……。'
      ]
    },
    normal: {
      _default: [
        '社長、話は短く済ませます。辞めます。もう決めました。',
        'お世話になりました。でも、もうここでは続けられません。',
        '色々ありましたけど……もう、終わりにします。'
      ]
    }
  }
};

const CONTRACT_NEGOTIATION_CONFIG = {
  // v2.0: trust×ギャップ2軸マトリクス対応
  trustThresholds: { highTrust: 75, stable: 40, discontent: 30, danger: 15 },
  gapThresholds: { mid: 1.1, large: 1.3 },
  maxNegotiations: 4,
  minSeason: 1,
  raiseLimits: { min: 2, max: 50 },
  counterOfferRatio: 0.5,
  retentionWeeksBase: 8,
};

// 社長室統合 Phase B: 解雇面談の別れセリフ (性格×2〜3パターン)
// 解雇通告時の選手コメント
// 軸: 口調アーキタイプ（archetype）— composed/ojousama/polite/seductive/delinquent/cool/normal
//   personality では分けない。性格で分けると同じ archetype のキャラの口調が崩壊するため
//   （お嬢様キャラがタメ口で別れの挨拶、など）、archetype に揃える。
// 引き方: RELEASE_INTERVIEW_LINES[fighter.archetype] || RELEASE_INTERVIEW_LINES.normal
const RELEASE_INTERVIEW_LINES = {
  composed: [
    '……短い間だったけど、悪くない時間だった。ありがとう。',
    'ま、こういうこともあるよね。……元気でね、社長。',
    '……わかった。世話になったよ。次の場所、自分で見つけるから。'
  ],
  ojousama: [
    'ご縁がここまでだったということですわね。お世話になりました。',
    '……承知いたしましたわ。これまでのご厚情、忘れませんわ。',
    'わたくしの居場所は、また別にございますわ。社長もお元気で。'
  ],
  polite: [
    '至らない点があったなら、申し訳ありませんでした。今までご指導ありがとうございました。',
    '力不足でした。……この経験を、次に必ず活かさせていただきます。',
    'お世話になりました。社長も、団体の皆様も、どうかお元気で。'
  ],
  seductive: [
    'あら、寂しいことを仰るのね。……ふふ、いいわ、潔く出ていきましょう。',
    '別れって、嫌いじゃないの。……お世話になったわ、社長。',
    'またどこかで会えるかしら。……忘れないでね、私のこと。'
  ],
  delinquent: [
    'チッ……悔しいけど、次はもっといい場所で暴れてやるよ。見てな。',
    'こうなったらどこ行っても結果出すからな。覚えとけよ社長。',
    '……わかったよ。この悔しさ、絶対に忘れねぇからな。'
  ],
  cool: [
    '……わかった。',
    '……世話になった。',
    '……次の場所で、結果を出す。'
  ],
  normal: [
    '短い間でしたが、ありがとうございました。',
    '色々と、お世話になりました。……お元気で。',
    'これからも、この団体の活躍、祈ってます。'
  ],
};

// challenge-request-spec-v0.1: 選手発信 挑戦試合打診 — 打診者セリフ
// 性格(7) × タイプ(2: hostile / respectful) × 3パターン = 42 種
// 軸: 口調アーキタイプ（archetype）— composed/ojousama/polite/seductive/delinquent/cool/normal
//     personality では分けない。性格で分けると同じ archetype のキャラの口調が崩壊する
//     （お嬢様キャラがタメ口で打診、など）ため、archetype に揃える。
const CHALLENGE_REQUEST_LINES = {
  composed: {
    hostile: [
      'あの相手と、けじめをつけたい。次の興行で組んでもらえないか。',
      '社長、あの一戦は私で背負わせてくれ。引きずってばかりはいられない。',
      '気持ちが落ち着かない相手がいる。リングで決着させてほしい。'
    ],
    respectful: [
      'あの選手と、本気で向き合いたい。次の興行で組めないか。',
      '社長、あの人と一度、まともに当たらせてくれ。',
      '同じマットに上がれるなら、いま欲しい一戦がある。'
    ]
  },
  ojousama: {
    hostile: [
      'あの方とは、リングで決着をつけねば気が済みませんの。',
      '社長、不躾なお願いですが…あの選手と、一戦お願いいたしますわ。',
      '心が落ち着きませんの。あの相手と、組んでくださいませ。'
    ],
    respectful: [
      'あの方と、一度きちんと拳を交えとうございますの。',
      '社長、お聞き入れいただきたいのです。あの選手とのお試合を。',
      'あの方とリングで向き合えるなら、それ以上の喜びはございませんわ。'
    ]
  },
  polite: {
    hostile: [
      '社長、お願いがあります。あの選手と決着をつけさせてください。',
      'けじめをつけたいんです。あの相手との試合、組んでいただけませんか。',
      'ご無理を承知でお願いします。あの方と当たらせてください。'
    ],
    respectful: [
      '社長、突然で申し訳ありません。あの選手と試合を組んでいただけませんか。',
      'お時間恐縮です。あの方と、本気の試合をさせていただきたく。',
      'ご検討いただきたいのですが、あの相手と一度組ませてください。'
    ]
  },
  seductive: {
    hostile: [
      'あの女、放っておけないの。リングで答え合わせさせて。',
      '社長、あの相手と組んでくれない? 借り、返さなきゃいけないから。',
      'モヤモヤしてるの。あの試合、組んでちょうだい。'
    ],
    respectful: [
      'あの人と、一度きちんと向き合いたいの。組んでくれる?',
      '次の興行で、あの相手と当たれたら…私、燃えるわよ。',
      '気になる人がいるの。リング、用意してもらえる?'
    ]
  },
  delinquent: {
    hostile: [
      '社長、あいつと一発やらせてくれ。けじめがつかねぇんだ。',
      'あの女、ほっとけねぇんすよ。次の興行で組ませてください。',
      'すみません、あの相手と決着つけたいんで、リング組んでくれません?'
    ],
    respectful: [
      'あの人とやってみたいんすよ。次の興行、ねじ込めません?',
      '社長、お願いっす。あの相手と組ませてください。',
      'いっぺん本気で当たりたい相手がいるんで、頼みます。'
    ]
  },
  cool: {
    hostile: [
      'あの相手と、決着を。',
      '社長、あの一戦を組んでくれ。',
      'けじめが要る。あの選手との試合を。'
    ],
    respectful: [
      'あの選手と、組ませてくれ。',
      '次の興行に、あの相手を。',
      'あの人とやりたい。お願いします。'
    ]
  },
  normal: {
    hostile: [
      'あの相手と決着をつけたい。次の興行で組んでもらえませんか。',
      '社長、お願いがあります。あの選手との試合、私にやらせてください。',
      'ずっと引きずってる相手がいるんです。一度しっかり当ててほしい。'
    ],
    respectful: [
      'あの選手と本気でやってみたい。次のチャンスにねじ込めませんか。',
      '気になる相手がいるんです。次の興行で組めるなら、お願いします。',
      'いつかと言わず、今やりたい相手がいます。社長、舞台をください。'
    ]
  }
};

// challenge-request-spec-v0.1 拡張: 属性(style) × archetype × タイプ の3軸分岐
// style 6種 × archetype 7種 × type 2種 × 1行 = 84行。
// archetype 軸に統一（personality で分けると同じ archetype のキャラの口調が崩壊するため）。
// pickRequesterLine 内で 60% 確率でこちらを優先採用、未定義 or 抽選漏れ時は CHALLENGE_REQUEST_LINES へフォールバック。
// 各 style のフレーバー軸:
//   Grappler   = 組み技/グラウンド/がっぷり四つ
//   Brawler    = 殴り合い/痛み/ガチンコ
//   Striker    = 打撃/蹴り/間合い
//   Submission = 関節/極め/沈める
//   Aerial     = 飛ぶ/落とす/空中戦
//   Allround   = 引き出し/総合力/技の応酬
const CHALLENGE_REQUEST_LINES_STYLE = {
  Grappler: {
    composed:   { hostile: ['あの相手と床で組み合いたい。立ち技じゃ終わらせない。'],
                  respectful: ['あの人と腰を据えて組みたい。グラウンドで答えを出したい相手だ。'] },
    ojousama:   { hostile: ['あの方と、マットの上でじっくり組み合わせていただきたいですの。'],
                  respectful: ['あの方と組み合っての勝負が、しとうございますの。'] },
    polite:     { hostile: ['失礼を承知でお願いします。あの選手と組み技で正面から組ませてください。'],
                  respectful: ['組み合いの間合いを学びたい相手がいます。同じマットに上げてください。'] },
    seductive:  { hostile: ['あの子と床で絡みたいの。立ち技で逃げられたら、つまらないでしょ?'],
                  respectful: ['あの人とマットでじっくり組み合いたいの。やらせてくれる?'] },
    delinquent: { hostile: ['あの女と床で転がりたいんすよ。組み合えばあたしのもんっす。'],
                  respectful: ['組みたい相手がいるんすよ。マットの上でじっくり、お願いっす。'] },
    cool:       { hostile: ['あの相手と、グラウンドで決着を。'],
                  respectful: ['あの人と、組み技で。お願いします。'] },
    normal:     { hostile: ['あの相手とグラウンドで決着つけたい。立ち技じゃ終わらない試合になる。'],
                  respectful: ['組み技で当たりたい相手がいます。じっくり腰を据えた一戦を、お願いします。'] }
  },
  Brawler: {
    composed:   { hostile: ['あの相手と打ち合いたい。痛みごと飲み込む試合を組んでくれ。'],
                  respectful: ['あの人と真っ向から殴り合いたい。組ませてくれないか。'] },
    ojousama:   { hostile: ['あの方と、痛みを分け合うお試合がしとうございますの。お願いしますわ。'],
                  respectful: ['あの方と真っ向から打ち合うお試合を…組んでくださいませ。'] },
    polite:     { hostile: ['ご無礼を承知でお願いします。あの選手と打ち合いの試合、最後まで立ち続ける覚悟で。'],
                  respectful: ['真っ向から殴り合いたい相手がいます。ぶつかる試合を組ませてください。'] },
    seductive:  { hostile: ['あの女と殴り合いたいの。痛みなんてどうでもいい、組んでちょうだい。'],
                  respectful: ['あの人と痛み分けしたいの。真正面から、組ませて?'] },
    delinquent: { hostile: ['あの女と殴り合わせろっす。痛みなんざ承知の上っすから。'],
                  respectful: ['あの人と打ち合いたいんすよ。腹括ったやつ、組ませてください。'] },
    cool:       { hostile: ['あの相手と、打ち合いを。'],
                  respectful: ['あの人と、殴り合いたい。お願いします。'] },
    normal:     { hostile: ['打ち合いで決着つけたい相手がいます。逃げない試合を、お願いします。'],
                  respectful: ['真正面から殴り合える相手だと思ってます。組ませてください。'] }
  },
  Striker: {
    composed:   { hostile: ['あの相手の打撃、私の打撃で迎え撃ちたい。間合いの取り合いを組んでくれ。'],
                  respectful: ['あの人と打撃で噛み合いたい。蹴り合いの試合を組ませてくれ。'] },
    ojousama:   { hostile: ['あの方の打撃を、わたくしの打撃で押し返してみせますわ。'],
                  respectful: ['あの方と打撃の応酬を…一度、お試合を組んでくださいませ。'] },
    polite:     { hostile: ['失礼ながら、あの選手と打撃の間合いで決着をつけさせてください。'],
                  respectful: ['打撃の精度を試したい相手がいます。蹴り合いの試合を組ませてください。'] },
    seductive:  { hostile: ['あの女の顔、私の蹴りで止めたいの。間合いだけは取らせてくれる?'],
                  respectful: ['あの人と打撃で噛み合いたいの。間合いの読み合い、組ませて?'] },
    delinquent: { hostile: ['あの女の顔面に一発入れたいんすよ。打撃で勝負させてください。'],
                  respectful: ['あの人の蹴りに、あたしの蹴り合わせたいんすよ。間合い、もらえません?'] },
    cool:       { hostile: ['打撃で、決着を。あの相手と。'],
                  respectful: ['あの人と、蹴り合いを。'] },
    normal:     { hostile: ['あの相手と打撃戦で決めたい。間合いの読み合いで答えを出します。'],
                  respectful: ['打撃で噛み合う相手だと思ってます。蹴り合いの試合、お願いします。'] }
  },
  Submission: {
    composed:   { hostile: ['あの相手の関節、私の極めで取りに行きたい。組ませてくれないか。'],
                  respectful: ['あの人と極め合いたい。技術の試合を組ませてくれ。'] },
    ojousama:   { hostile: ['あの方の腕、わたくしのサブミッションで…と思っておりますの。'],
                  respectful: ['あの方と関節技の応酬がしとうございますわ。組んでくださいませ。'] },
    polite:     { hostile: ['お願いがあります。あの選手とサブミッションの応酬で決着をつけさせてください。'],
                  respectful: ['極め合いを学びたい相手がいます。技術の試合を組ませてください。'] },
    seductive:  { hostile: ['あの女の腕、私の手で極めたいの。タップ取らせてちょうだい?'],
                  respectful: ['関節の取り合いって、楽しいでしょ? あの人と組ませて?'] },
    delinquent: { hostile: ['あの女の関節、極めたいんすよ。タップ取るまで離さないっす。'],
                  respectful: ['あの人と極め合いたいんすよ。技の試合、お願いっす。'] },
    cool:       { hostile: ['あの相手と、極め合いを。'],
                  respectful: ['あの人と、関節技で。'] },
    normal:     { hostile: ['関節技で勝負したい相手がいます。最後はタップで決着、お願いします。'],
                  respectful: ['サブミッションで噛み合う相手だと思ってます。技術戦を組ませてください。'] }
  },
  Aerial: {
    composed:   { hostile: ['あの相手の頭上から飛びたい。空中戦の試合を組んでくれ。'],
                  respectful: ['あの人と空中で交わってみたい。お互い飛ぶ試合、組ませてくれ。'] },
    ojousama:   { hostile: ['あの方の頭上から、わたくしの一発を落とさせていただきますわ。'],
                  respectful: ['あの方と、空中でのお試合がしとうございますの。組んでくださいませ。'] },
    polite:     { hostile: ['ご無礼ながら、あの選手の頭上から飛ぶ試合を組ませてください。'],
                  respectful: ['空中の技を試したい相手がいます。飛ぶ試合を組ませてください。'] },
    seductive:  { hostile: ['あの子の真上に、ダイブ決めたいの。一発でいいから組ませて?'],
                  respectful: ['空中戦で噛み合いそうな人がいるの。ふたりで飛ばせてもらえる?'] },
    delinquent: { hostile: ['あの女のド真ん中に上から落としたいんすよ。リング、用意してくれません?'],
                  respectful: ['あの人と空中戦やりたいんすよ。お互い飛んで落とすやつ、組ませてください。'] },
    cool:       { hostile: ['上から、決める。あの相手を。'],
                  respectful: ['あの人と、空中戦を。'] },
    normal:     { hostile: ['空中戦で決着つけたい相手がいます。リスクを取った試合を、お願いします。'],
                  respectful: ['ダイブで噛み合う相手だと思ってます。空中戦の舞台、お願いします。'] }
  },
  Allround: {
    composed:   { hostile: ['引き出し全部、あの相手にぶつけたい。逃げ場のない試合を組んでくれ。'],
                  respectful: ['あの人と技の応酬がしたい。お互い手の内全部出すやつ、組ませてくれ。'] },
    ojousama:   { hostile: ['わたくしの引き出し、あの方にすべてお見せしますわ。お試合、お願いしますの。'],
                  respectful: ['あの方と、技の応酬がしとうございますの。お試合を組んでくださいませ。'] },
    polite:     { hostile: ['失礼を承知でお願いします。あの選手と全領域で噛み合う試合を組ませてください。'],
                  respectful: ['引き出しを試したい相手がいます。総合力の試合を組ませてください。'] },
    seductive:  { hostile: ['あの女に、私の手の内ぜんぶ見せたいの。組ませてちょうだい?'],
                  respectful: ['あの人となら、ぜんぶ出せそうなの。技の応酬、組ませて?'] },
    delinquent: { hostile: ['持ってる技、あの女に全部叩きつけたいんすよ。組ませてください。'],
                  respectful: ['あの人と引き出し比べしたいんすよ。総合力の試合、お願いっす。'] },
    cool:       { hostile: ['全部、ぶつける。あの相手に。'],
                  respectful: ['あの人と、技の応酬を。'] },
    normal:     { hostile: ['全領域で噛み合う相手だと思ってます。引き出しの試合、お願いします。'],
                  respectful: ['技の応酬で決着がつく相手です。総合力で当たりたい、お願いします。'] }
  }
};

// challenge-request-spec-v0.1 Phase 5: 相手選手リアクションセリフ（試合前/結果モーダル）
// archetype(7) × 3 パターン。archetype 軸に統一（口調崩壊回避）。
const CHALLENGE_REQUEST_OPPONENT_REACTIONS = {
  composed: [
    '受けよう。来るなら正面から来い。',
    '名指しされた以上、逃げ隠れはしない。リングで応えよう。',
    'いいだろう。あんたの覚悟、受け止める。'
  ],
  ojousama: [
    'お受けいたしますわ。リングでお迎えいたしますの。',
    'わたくしを名指しなさるのね。ならば、相応のお返事をいたしますわ。',
    '光栄ですわ。お試合、お引き受けいたします。'
  ],
  polite: [
    'ご指名、ありがたく頂戴します。失礼のない試合をします。',
    '直訴で組まれた試合とのこと。お受けいたします。最善を尽くします。',
    'こちらこそお願いします。ベストを尽くしてお迎えします。'
  ],
  seductive: [
    'あら、私を選んでくれたの? ふふ、受けて立つわよ。',
    'そんなに私とやりたいの? いいわ、リングで応えてあげる。',
    '名指しされたら、断る理由なんてないでしょ?'
  ],
  delinquent: [
    '上等っす。来るなら来いっすよ、全部受けてやるんで。',
    '指名されたんなら、断る理由ねぇっす。リングで返事しますわ。',
    'そう来たか。面白ぇ、付き合うっすよ。'
  ],
  cool: [
    '……受ける。',
    '……望むところ。',
    '……来い。リングで答える。'
  ],
  normal: [
    '受けて立ちます。リングで決着をつけましょう。',
    '名指しされた以上、逃げません。同じ気持ちで向き合います。',
    'いいでしょう。あなたの直訴、受けます。'
  ]
};

// challenge-request-spec-v0.1 Phase 4: NO 選択時の打診者ティッカーセリフ
// archetype(7) × 2 パターン。落胆 / 不満 / 諦めの色合いを archetype で出し分け。
const CHALLENGE_REQUEST_NO_LINES = {
  composed: [
    '……そうか。社長がそう言うなら、今は引っ込めておく。',
    '今じゃないってことだな。承知した。借りは消えないが。'
  ],
  ojousama: [
    '……さようでございますの。失礼いたしましたわ。',
    'ご判断、承りますわ。…でも、忘れたわけではございませんの。'
  ],
  polite: [
    '……承知しました。失礼いたしました。',
    'ご判断、受け止めます。お時間いただいたこと、感謝いたします。'
  ],
  seductive: [
    'あら、ダメなの? ……まあ、いいわ。今は引いてあげる。',
    '……つれないのね。でも、諦めたわけじゃないわよ?'
  ],
  delinquent: [
    'マジっすか……まあ、社長の判断なら仕方ねぇっす。',
    '今じゃねぇってことっすね。分かったっす、引っ込めますわ。'
  ],
  cool: [
    '……分かった。',
    '……そう。'
  ],
  normal: [
    '……わかりました。タイミングじゃないってことですね。',
    '社長の判断なら従います。でも、忘れたわけじゃないので。'
  ]
};

// v1.3-3: 引退セリフテンプレート（引退ルート×キャリア×性格で分岐）
const RETIREMENT_LINES = {
  A1_champion: {
    normal: {
      _default: [
        '頂点からの景色は、忘れないよ',
        '最高の舞台で闘えた。それだけで十分だよ'
      ],
      ojousama: [
        '頂点の景色…一生忘れない'
      ],
      delinquent: [
        '頂点からの景色、忘れねーよ'
      ],
      seductive: [
        '頂点からの景色…忘れないわ'
      ],
      cool: [
        '……限界か。…悪くない引き際だ'
      ],
      polite: [
        '限界を感じています。…引退を考えさせてください'
      ],
      composed: [
        '…悪くない景色だった。うん、悪くない'
      ]
    },
    bold: {
      _default: [
        'あたしの時代だったよね？誰も文句言えないでしょ？'
      ],
      ojousama: [
        'わたくしの時代でしたわ。異論はございませんわね'
      ],
      delinquent: [
        'あたしの時代だった。文句あるやつはかかってこい'
      ],
      cool: [
        '…背負い切った'
      ],
      seductive: [
        '最後まで背負い切ったわ。最高の景色だった'
      ],
      polite: [
        '正直に申し上げます。…もう限界です'
      ],
      composed: [
        '…背負い切った。…まあ、上出来でしょ'
      ]
    },
    quiet: {
      _default: [
        '……あのベルトの重さ、一生の宝物'
      ],
      cool: [
        '…忘れない'
      ],
      polite: [
        'あのベルトの重さ…一生の宝物です'
      ],
      seductive: [
        '………もう…ここまでね'
      ],
      composed: [
        '…あの重さ、忘れないよ'
      ]
    },
    shy: {
      _default: [
        'こんな私がチャンピオンになれたなんて…夢みたいです'
      ],
      polite: [
        'チ、チャンピオンとして…リングを去る決断をしました…あ、ありがとうございました…'
      ],
    },
    easygoing: {
      _default: [
        'いやー最高だったね！ ベルト持てて幸せだったよ'
      ],
      delinquent: [
        '最高だったよ！ ベルト持てて幸せだったよ'
      ],
      seductive: [
        '最高だったわ。ベルト持てて幸せだった'
      ],
      polite: [
        '正直、もう限界だと感じています。…引退を考えています'
      ],
      ojousama: [
        'もう限界を感じますの。…引退を考えておりますわ'
      ],
      composed: [
        '…いい時間だったよ。ベルトも含めてね'
      ]
    },
    earnest: {
      _default: [
        'このベルトに恥じない闘いを、最後までできたと思う'
      ],
      polite: [
        'このベルトに恥じない闘いを…最後までできたと思います'
      ],
      ojousama: [
        'このベルトに恥じない闘いを…最後まで全うできましたわ'
      ],
      seductive: [
        'このベルトに恥じない闘い…最後までできたわ'
      ],
      composed: [
        '…恥じることは何もないよ。…うん、十分だ'
      ]
    },
    emotional: {
      _default: [
        'あのベルト…返したくない…でも…ありがとう…っ！'
      ],
      seductive: [
        'チャンピオンのまま降りるわ……っ……ふふ、これ以上ない花道ね……'
      ],
      composed: [
        '…っ…返したくなかった。…でも、ありがとう'
      ]
    }
  },
  A2_uncrowned: {
    normal: {
      _default: [
        'ベルトには届かなかった。でも、後悔はないよ',
        '夢は叶わなかったけど…この道を選んでよかった'
      ],
      ojousama: [
        'ベルトには届きませんでした。でも、後悔はありません'
      ],
      delinquent: [
        'ベルトには届かなかった。でもよ、後悔はねーよ'
      ],
      seductive: [
        'ベルトには届かなかったわ。でも、後悔はないの'
      ],
      composed: [
        '…届かなかった。…でもまあ、悔いはないよ'
      ]
    },
    bold: {
      _default: [
        'どうしても勝てない相手がいたけど、でも、逃げなかった。……悔いは無いよ。'
      ],
      ojousama: [
        '私ほどの者が王座を得られないなんて…不甲斐ないわね'
      ],
      delinquent: [
        '逃げなかった。それだけは誇りに思ってるぜ'
      ],
      cool: [
        '…逃げなかった。それだけだ'
      ],
      seductive: [
        '逃げなかったわ。それだけは誇りに思ってる'
      ],
      composed: [
        '…逃げなかった。…それだけで十分かな'
      ]
    },
    quiet: {
      _default: [
        '……悔いは、ない'
      ],
      cool: [
        '…悔いはない'
      ],
      polite: [
        '…悔いはありません'
      ],
      composed: [
        '…悔いはない。…うん、ないよ'
      ]
    },
    shy: {
      _default: [
        '何も残せなかったかもしれないけど…ここにいられて幸せでした'
      ],
      polite: [
        'ベルトには…手が届きませんでした…でも、悔いは、ないんです…'
      ],
    },
    easygoing: {
      _default: [
        'ベルトは無理だったけどさ、楽しかったよ！'
      ],
      delinquent: [
        'ベルトは無理だったけどよ、楽しかったわ！じゃーな！'
      ],
      seductive: [
        'ベルトは無理だったけど…楽しかったわ'
      ],
      composed: [
        '…ベルトはなかったけど、まあ…楽しかったよ'
      ]
    },
    earnest: {
      _default: [
        '夢には届かなかった。でもこの道を選んだことに嘘はない'
      ],
      polite: [
        '夢には届きませんでした。でもこの道を選んだことに嘘はありません'
      ],
      ojousama: [
        '夢には届きませんでしたわ。でもこの道に嘘はございません'
      ],
      seductive: [
        '夢には届かなかったわ。でも嘘はなかった'
      ],
      composed: [
        '…嘘はなかった。…それで十分だよ'
      ]
    },
    emotional: {
      _default: [
        'ベルト…欲しかったな…でも…ここにいられてよかった…！'
      ],
      seductive: [
        '無冠で終わるわ……っ……ふふ、それでもやりきったの……'
      ],
      composed: [
        '…っ…欲しかったな。…でも、よかったよ'
      ]
    }
  },
  A3_heel: {
    normal: {
      _default: [
        'フン…勝手に泣いてんじゃないわよ',
        'わたしがいなくなって寂しくなるね'
      ],
      ojousama: [
        'お泣きにならないで。みっともなくてよ'
      ],
      delinquent: [
        '泣いてんじゃねーよ。みっともねーな'
      ],
      seductive: [
        'ふふ…泣かないで。寂しくなるでしょう？'
      ],
      composed: [
        '…ま、こんなもんだろう。…泣くなよ'
      ]
    },
    bold: {
      _default: [
        '最後まで嫌われ者でいさせてもらうわ。最高だった'
      ],
      ojousama: [
        'お泣きにならないで。みっともなくてよ'
      ],
      delinquent: [
        '最後まで嫌われ者だ！ 最高だったぜ！'
      ],
      cool: [
        '…嫌われ者で終わる。悪くない'
      ],
      seductive: [
        '最後まで嫌われ者…ふふ、最高だったわ'
      ],
      composed: [
        '…嫌われ者か。…悪くない肩書だったよ'
      ]
    },
    quiet: {
      _default: [
        '……さよなら'
      ],
      cool: [
        '…じゃあな'
      ],
      polite: [
        '…お世話になりました'
      ],
      composed: [
        '…じゃあね'
      ]
    },
    shy: {
      _default: [
        '本当は…みんなと一緒にいたかったです…ごめんなさい'
      ],
      polite: [
        'こ、こんなわたしでしたが…リングを、去ります…'
      ],
    },
    easygoing: {
      _default: [
        'あはは、最後くらい素直になってもいいかな。楽しかったよ'
      ],
      delinquent: [
        '最後くらい素直になるか。楽しかったぜ'
      ],
      seductive: [
        '最後くらい素直になろうかしら。楽しかったわ'
      ],
      composed: [
        '…ま、最後くらいは正直にね。…楽しかったよ'
      ]
    },
    earnest: {
      _default: [
        '嫌われ役は…誰かがやらなきゃいけなかったから'
      ],
      polite: [
        '嫌われ役は…誰かがやらなければいけませんでしたから'
      ],
      ojousama: [
        '嫌われ役は…どなたかがやらねばなりませんでしたもの'
      ],
      seductive: [
        '嫌われ役はね…誰かがやらなきゃいけなかったの'
      ],
      composed: [
        '…誰かがやらなきゃいけなかった。…それだけだよ'
      ]
    },
    emotional: {
      _default: [
        '…っ、バカ…泣くんじゃないわよ…あたしまで…っ！'
      ],
      seductive: [
        '悪役のまま消えるわ……っ……ふふ、それがわたしらしいの……'
      ],
      composed: [
        '…っ…泣くなって。…こっちまで、困るだろ'
      ]
    }
  },
  A4_veteran: {
    normal: {
      _default: [
        'ここが、あたしの全部だった',
        'この団体で過ごした時間は、無駄じゃない'
      ],
      ojousama: [
        'ここが、わたくしの全てでしたわ'
      ],
      delinquent: [
        'ここが全部だった。嘘じゃねーよ'
      ],
      seductive: [
        'ここが、私の全てだったの'
      ],
      composed: [
        '…いい時間だった。…うん、全部ね'
      ]
    },
    bold: {
      _default: [
        '長かったようで…あっという間だったなぁ。悔いはないよ'
      ],
      ojousama: [
        '長いようで…あっという間でしたわね'
      ],
      delinquent: [
        'あっという間だったな。悔いなんかねーよ'
      ],
      cool: [
        '…あっという間だった'
      ],
      seductive: [
        'あっという間だったわ。悔いはないの'
      ],
      composed: [
        '…あっという間だったね。…悪くなかったよ'
      ]
    },
    quiet: {
      _default: [
        '……ありがとう'
      ],
      cool: [
        '…ありがとう'
      ],
      polite: [
        '…ありがとうございました'
      ],
      composed: [
        '…ありがとう。…うん'
      ]
    },
    shy: {
      _default: [
        '長い間…お世話になりました。ここにいられて幸せでした'
      ],
      polite: [
        'な、長い間…ありがとうございました…これで、引退させていただきます…'
      ],
    },
    easygoing: {
      _default: [
        'いやー長かった！ でもあっという間だったね'
      ],
      delinquent: [
        '長かったなー！ でもあっという間だったかもね'
      ],
      seductive: [
        '長かったわ…でもあっという間だった'
      ],
      composed: [
        '…長かったね。…でもまあ、いい時間だったよ'
      ]
    },
    earnest: {
      _default: [
        '全力で走り抜けた。この時間に嘘はない'
      ],
      polite: [
        '全力で走り抜けました。この時間に嘘はありません'
      ],
      ojousama: [
        '全力で走り抜けましたわ。この時間に嘘はございません'
      ],
      seductive: [
        '全力で走り抜けたわ。嘘のない時間だった'
      ],
      composed: [
        '…嘘のない時間だった。…それだけで十分だよ'
      ]
    },
    emotional: {
      _default: [
        'ここが…全部だった…ありがとう…ありがとう…！'
      ],
      seductive: [
        '長かったわ……っ……ふふ、ありがとう、みんな……'
      ],
      composed: [
        '…っ…ここが全部だった。…ありがとう'
      ]
    }
  },
  B1_young: {
    normal: {
      _default: [
        'まだ何も成し遂げてないのに…',
        'あたしの物語、こんなところで終わりなの…？'
      ],
      ojousama: [
        'まだ何も…成し遂げていませんのに…'
      ],
      delinquent: [
        'まだ何もやってねーのに…嘘だろ…'
      ],
      seductive: [
        'まだ何も成し遂げてないのに…嘘でしょう…'
      ],
      composed: [
        '…こんなところで、か。…まだ何も…'
      ]
    },
    bold: {
      _default: [
        '嘘でしょ…まだ始まったばかりじゃない…！'
      ],
      ojousama: [
        'この私が……こんな所で終わりなの？'
      ],
      delinquent: [
        '嘘だろ…まだ始まったばかりだろうが…！'
      ],
      cool: [
        '…嘘だ'
      ],
      seductive: [
        '嘘…まだ始まったばかりじゃない…'
      ],
      composed: [
        '…嘘だろ。…まだ、始まったばかりなのに'
      ]
    },
    quiet: {
      _default: [
        '………まだ、なのに'
      ],
      cool: [
        '……まだ'
      ],
      polite: [
        '…まだ、何も…'
      ],
      composed: [
        '…まだ、なのにな'
      ]
    },
    shy: {
      _default: [
        'やっぱり…私には無理だったんでしょうか…'
      ],
      polite: [
        'ま、まだ若いのに…ご、ごめんなさい…続けられないんです…'
      ],
    },
    easygoing: {
      _default: [
        'え…うそ…まだこれからだったのに…'
      ],
      delinquent: [
        'うそだろ…まだこれからだったのによ…'
      ],
      seductive: [
        'うそ…まだこれからだったのに…'
      ],
      composed: [
        '…これからだったんだけどな。…参ったね'
      ]
    },
    earnest: {
      _default: [
        'まだ何も返せてない…こんなの、受け入れられない'
      ],
      polite: [
        'まだ何もお返しできていないのに…受け入れられません'
      ],
      ojousama: [
        'まだ何もお返しできていませんのに…'
      ],
      seductive: [
        'まだ何も返せてないのに…受け入れられないわ'
      ],
      composed: [
        '…まだ何も返せてない。…こんなの、困るよ'
      ]
    },
    emotional: {
      _default: [
        'いやだ…いやだよ…まだ始まったばかりなのに…！'
      ],
      seductive: [
        'まだ若いけど……っ……ふふ、わたしには無理だったの……'
      ],
      composed: [
        '…っ…こんなところで。…まだ、始まったばかりなのに'
      ]
    }
  },
  B2_prime: {
    normal: {
      _default: [
        '体がね…もう言うことを聞かないの',
        'これからだったのに…悔しい、悔しいよ…'
      ],
      ojousama: [
        '体がね…もう言うことを聞かないの…'
      ],
      delinquent: [
        '体がよ…もう言うこと聞かねーんだ…'
      ],
      seductive: [
        '体がね…もう言うことを聞かないの…'
      ],
      composed: [
        '…まだやれたのに。…体が、ね'
      ]
    },
    bold: {
      _default: [
        'まだやれると思ってたのに。信じてたのに…！'
      ],
      ojousama: [
        'まだやれると信じていましたのに…！'
      ],
      delinquent: [
        'まだやれるって信じてたのに…くそっ…！'
      ],
      cool: [
        '…信じていた。まだやれると'
      ],
      seductive: [
        'まだやれると信じてたのに…'
      ],
      composed: [
        '…まだやれると思ってた。…参ったな'
      ]
    },
    quiet: {
      _default: [
        '……これからだったのに'
      ],
      cool: [
        '…まだ'
      ],
      polite: [
        '…これからだったのに…'
      ],
      composed: [
        '…これからだったんだけどな'
      ]
    },
    shy: {
      _default: [
        'せっかく…やっと少し自信がついてきたのに…'
      ],
      polite: [
        '今が、一番の時期かもしれませんが…決めたんです…'
      ],
    },
    easygoing: {
      _default: [
        'あはは…参ったな、これからだったのに…'
      ],
      delinquent: [
        '参ったな…これからだったのによ…'
      ],
      seductive: [
        '参ったわ…これからだったのに…'
      ],
      composed: [
        '…これからだったんだけどね。…仕方ないか'
      ]
    },
    earnest: {
      _default: [
        'まだ足りなかった。もっと…もっとやりたかった'
      ],
      polite: [
        'まだ足りませんでした。もっと…やりたかったです'
      ],
      ojousama: [
        'まだ足りませんでしたわ。もっと…やりたかった'
      ],
      seductive: [
        'まだ足りなかったわ…もっとやりたかった'
      ],
      composed: [
        '…もっとやりたかった。…それだけだよ'
      ]
    },
    emotional: {
      _default: [
        '悔しい…悔しいよ…これからだったのに…！'
      ],
      seductive: [
        '今が頂点なのに……っ……ふふ、だからこそ降りるの……'
      ],
      composed: [
        '…っ…悔しいよ。…これからだったのに'
      ]
    }
  },
  B3_older: {
    normal: {
      _default: [
        'わかってた。いつか来るって',
        '十分やったよ。自分を褒めてやりたい'
      ],
      ojousama: [
        'わかっておりましたわ。いつか来ると'
      ],
      delinquent: [
        'わかってたよ。いつか来るってな'
      ],
      seductive: [
        'わかってたわ。いつか来るって'
      ],
      composed: [
        '…十分やったよ。…うん、わかってた'
      ]
    },
    bold: {
      _default: [
        '体はもう限界だけど…気持ちは、まだ燃えてるの……'
      ],
      ojousama: [
        '気持ちは以前のままだけれど、身体はいう事を聞かないみたい…潮時ね'
      ],
      delinquent: [
        '体は限界だけどよ…心はまだ燃えてるぜ'
      ],
      cool: [
        '…体は限界。心は、まだ'
      ],
      seductive: [
        '体は限界だけど…心はまだ燃えてるわ'
      ],
      composed: [
        '…体は限界か。…でもまあ、やりきったよ'
      ]
    },
    quiet: {
      _default: [
        '……十分やった'
      ],
      cool: [
        '…十分だ'
      ],
      polite: [
        '…十分やれたと思います'
      ],
      composed: [
        '…十分だよ'
      ]
    },
    shy: {
      _default: [
        'みなさんのおかげで…ここまで来られました'
      ],
      polite: [
        'も、もう…体が、ついていきません…ごめんなさい…'
      ],
    },
    easygoing: {
      _default: [
        'まぁ、十分やったよね。いい人生だった！'
      ],
      delinquent: [
        '十分やったぜ。いいキャリアを送れたよ！'
      ],
      seductive: [
        '十分やったわ。いい人生だった'
      ],
      composed: [
        '…まあ、十分やったね。…いい時間だったよ'
      ]
    },
    earnest: {
      _default: [
        '悔いがないと言えば嘘になる。でも…やりきった'
      ],
      polite: [
        '悔いがないとは言えません。でも…やりきりました'
      ],
      ojousama: [
        '悔いがないとは申しませんわ。でも…やりきりました'
      ],
      seductive: [
        '悔いがないとは言わないわ。でも…やりきった'
      ],
      composed: [
        '…悔いがないとは言わない。…でも、やりきったよ'
      ]
    },
    emotional: {
      _default: [
        'わかってたよ…いつか来るって…でも…寂しいよ…！'
      ],
      seductive: [
        'もう体が……っ……ふふ、潮時ね……'
      ],
      composed: [
        '…っ…わかってたよ。…でも、寂しいもんだね'
      ]
    }
  },
  B4_champion_injury: {
    normal: {
      _default: [
        'このベルト…まだ返したくなかった',
        '最後の防衛戦、やりたかったな…'
      ],
      ojousama: [
        'このベルト…まだ返したくはなかった'
      ],
      delinquent: [
        'このベルト…まだ返したくなかったんだよ…'
      ],
      seductive: [
        'このベルト…まだ返したくなかったのに…'
      ],
      composed: [
        '…まだ返したくなかったな。…このベルト'
      ]
    },
    bold: {
      _default: [
        'チャンピオンのままケガで終わる……これは幸運なのか不運なのか……'
      ],
      ojousama: [
        '女王のままに引退……有終の美といったところね。'
      ],
      delinquent: [
        'チャンピオンのまま終わりだと…ふざけんな…'
      ],
      cool: [
        '…残酷だ'
      ],
      seductive: [
        'チャンピオンのまま終わるなんて…残酷ね'
      ],
      composed: [
        '…チャンピオンのまま終わりか。…皮肉だね'
      ]
    },
    quiet: {
      _default: [
        '……まだ、返したくなかった'
      ],
      cool: [
        '…まだだ'
      ],
      polite: [
        '…まだ、お返ししたくなかったです'
      ],
      composed: [
        '…まだ、返したくなかった'
      ]
    },
    shy: {
      _default: [
        'せっかくベルトをもらえたのに…ごめんなさい…'
      ],
      polite: [
        'チャンピオンなのに…け、怪我で…ご、ごめんなさい…'
      ],
    },
    easygoing: {
      _default: [
        'あちゃー…ベルト持ったまま終わりかぁ…'
      ],
      delinquent: [
        'まじかよ…ベルト持ったままケガで終了かよ…'
      ],
      seductive: [
        'あら…ベルト持ったまま終わりなの…'
      ],
      composed: [
        '…ベルト持ったまま終わりか。…参ったね'
      ]
    },
    earnest: {
      _default: [
        '最後の防衛戦、やりたかった…それだけが心残りだ'
      ],
      polite: [
        '最後の防衛戦…やりたかったです。それだけが心残りです'
      ],
      ojousama: [
        '最後の防衛戦…やりたかったですわ'
      ],
      seductive: [
        '最後の防衛戦…やりたかったわ。それだけが心残り'
      ],
      composed: [
        '…最後の防衛戦、やりたかったな。…それだけだよ'
      ]
    },
    emotional: {
      _default: [
        'やだ…このベルト…まだ返したくない…っ！'
      ],
      seductive: [
        'チャンピオンのまま、怪我で……っ……ふふ、悔しいけど仕方ないの……'
      ],
      composed: [
        '…っ…返したくない。…まだ、このベルト…'
      ]
    }
  }
};

// B4タレント活動: 怪我引退チャンピオンの社長への一言（§13）— archetype単位に統合
const RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE = {
  _default:  ['…社長に、迷惑かけちゃうな。ごめんなさい', '…社長、ベルトのこと、ごめんなさい。迷惑かけて'],
  ojousama:  ['…社長に、ご迷惑をおかけしますわね', '…社長に、ご迷惑をおかけしてしまいますわね。本当に、申し訳なく…'],
  delinquent:['…社長、悪りぃな。迷惑かけちまって', '…社長、悪りぃな。ベルト空けちまって'],
  cool:      ['…社長には、申し訳ない', '…社長には、申し訳ない。ベルトを空けることになる'],
  seductive: ['…社長のこと、少し心配ね', '…社長のこと、少し心配ね。ベルトを空けることになるから',
      'チャンピオンのまま降りるべきかしら……っ……ふふ、迷うの……',
    'このベルトを置く時……っ……ふふ、考えてしまうの……',
  ],
  polite:    ['…社長、本当に申し訳ございません', '…社長、ベルトを空けてしまって…本当に申し訳ございません',
      'チャ、チャンピオンなのに…引退、考えてしまいます…',
    'こ、このベルトを置いて、降りる時が来たのかもしれません…',
  ],
  composed:  ['…社長、迷惑をかけるね。…すまない'],
};

// ── 引き抜きオファー解決時の選手反応 (transfer/poach 結果モーダル用) ───────
// outcome: accepted (社長が移籍承認) / defended (引き留め成功) / defense_failed (引き留め失敗・強制移籍)
const POACH_REACTION_DIALOGUES = {
  accepted: {
    normal: {
      _default: ['…色々、ありがとうございました。新しい場所でも、戦い続けます', 'ここで過ごした日々は、忘れません'],
      polite: ['お世話になりました。…向こうでも、必ず結果を残します'],
      cool: ['…世話になった。…さよならだ'],
      composed: ['…ここで学んだこと、忘れない。…ありがとう、社長'],
    },
    bold: {
      _default: ['もっと大きい舞台で証明する。…見ててよ', '行かせてもらう。世話になったわね'],
      ojousama: ['もっと相応しい舞台が呼んでおりますの。ごきげんよう'],
      delinquent: ['もっとデカいとこ行ってやる。じゃあな、社長'],
    },
    quiet: {
      _default: ['…さよなら…', '…ありがとう…ございました'],
      polite: ['…お世話に、なりました…'],
    },
    shy: {
      _default: ['ご、ごめんなさい…でも、行かせてください…', 'お世話になりました…っ'],
      polite: ['ご、ごめんなさい…っ。お世話になりました…'],
    },
    easygoing: {
      _default: ['お世話になりました〜！ また、どっかで会えたらいいね！', '行ってきま〜す！'],
      delinquent: ['世話んなったな〜！ じゃあな！'],
      ojousama: ['お世話になりましたわ〜。それではごきげんよう'],
    },
    earnest: {
      _default: ['ここで学んだこと、絶対に活かします。本当にお世話になりました', '感謝しかありません。新しい場所で、必ず結果を出します'],
      polite: ['いただいたご恩、新天地で結果として返させていただきます'],
    },
    emotional: {
      _default: ['うう…っ…行かせて…ください…！', '…っ、ごめんなさい…でも、私……行かなきゃ…'],
      seductive: ['……ごめんね。……新しい舞台で、もっと光ってみせる'],
    },
  },
  defended: {
    normal: {
      _default: ['…ここに残れて、ほっとしました', '社長…ありがとうございます。期待には応えます'],
      polite: ['残らせていただきます。…ご期待に応えます'],
      cool: ['…残る。…それだけだ'],
      composed: ['…そこまで言ってくれるなら、残るよ。ありがとう'],
    },
    bold: {
      _default: ['そこまで言うなら、残ってあげる', 'ふん、簡単に手放さないってことね。…悪い気はしないわ'],
      ojousama: ['仕方ありませんわね、そこまで仰るなら残って差し上げます'],
      delinquent: ['チッ…そこまで言われたら、行けねえじゃん'],
    },
    quiet: {
      _default: ['…残ります', '…ありがとう…ございます'],
      polite: ['…残らせて、いただきます'],
    },
    shy: {
      _default: ['の、残っていいんですか…？ ありがとうございます…っ', 'わ、わたしを必要としてくれて…ありがとうございます'],
      polite: ['ほ、本当に…いいんですか…？ ありがとうございます…!'],
    },
    easygoing: {
      _default: ['えへへ、引き留めてくれて嬉しい！', '残るね〜！ これからもよろしく〜'],
      delinquent: ['しゃーないな、残ってやるよ！'],
      ojousama: ['まあ、そこまで仰るなら残りますわ〜'],
    },
    earnest: {
      _default: ['…社長の気持ち、伝わりました。ここで戦い続けます', '残らせていただきます。必ず恩返しを'],
      polite: ['身に余るお言葉です。…ここで結果を出します'],
    },
    emotional: {
      _default: ['っ……残っていいんですか…！？ ありがとうございますっ！', 'うう…うれしい…っ…ありがとうございます'],
      seductive: ['……必要としてくれるんだ。…うん、残る'],
    },
  },
  defense_failed: {
    normal: {
      _default: ['…申し訳ありません。新しい場所で、答えを出します', 'お世話になりました。…またどこかで'],
      polite: ['…ご恩を返せず、申し訳ありません'],
      cool: ['…止めても無駄だ。…悪く思うな'],
      composed: ['…ごめんね、社長。…決めたことだから'],
    },
    bold: {
      _default: ['…ごめんなさいね。でも、私の決意は固いから', '止められても止まらないよ。じゃあね'],
      ojousama: ['お引き留めには感謝しますが、わたくしの心は決まっておりますの'],
      delinquent: ['悪ぃけど、止まらねえよ。じゃあな'],
    },
    quiet: {
      _default: ['…ごめんなさい…', '…さよなら'],
      polite: ['…ごめんなさい…'],
    },
    shy: {
      _default: ['ご、ごめんなさい…っ…でも、行かせて…', '止めてくれて嬉しかった…でも…ごめんなさい'],
      polite: ['…ごめんなさい…どうしても、行かなきゃいけないんです…'],
    },
    easygoing: {
      _default: ['ごめんね〜引き留めてもらったのに…！', '…元気でね〜！'],
      delinquent: ['悪ぃ〜！ でも行くわ！'],
      ojousama: ['…ごめんあそばせ。お引き留めには感謝しておりますわ'],
    },
    earnest: {
      _default: ['ご恩を返せず申し訳ありません…新天地で必ず結果を', '…ごめんなさい。でも、行かなきゃいけないんです'],
      polite: ['お引き留めに応えられず、本当に申し訳ありません'],
    },
    emotional: {
      _default: ['ごめんなさい…っ…ごめんなさい…！', 'うう…っ…許してください…'],
      seductive: ['……ごめん。……でも、決めたから'],
    },
  },
};

// ── 引退勧告・引き留めシステム セリフデータ (retirement-advisory-spec-v1_1) ──
const RETIRE_ACCEPT_LINES = {
  accept_terminal: {
    normal: {
      _default: [
        '…わかった。もう限界なの、自分でもわかってる',
        '…正直、ほっとしてる。ありがとう'
      ],
      ojousama: [
        '…わかりましたわ。もう限界ですもの'
      ],
      delinquent: [
        '…わかってるよ。もう限界なんだろ'
      ],
      seductive: [
        '…わかったわ。もう限界なのよね'
      ],
      cool: [
        '……わかった。…悔いはない'
      ],
      polite: [
        'わかりました。…ここまでやれて幸せでした'
      ],
      composed: [
        '…そう。…わかってたよ、自分でも'
      ]
    },
    bold: {
      _default: [
        '…認めるよ。もう体が限界だ'
      ],
      ojousama: [
        '…認めますわ。もう体が限界だもの'
      ],
      delinquent: [
        '…認めてやるよ。もう限界だ'
      ],
      cool: [
        '…限界だ。認める'
      ],
      seductive: [
        '…認めるわ。もう限界なの'
      ],
      polite: [
        '受け入れます。…ここまでやれたこと、誇りに思います'
      ],
      composed: [
        '…ふぅん、限界か。…認めるよ'
      ]
    },
    quiet: {
      _default: [
        '……わかってる'
      ],
      cool: [
        '…わかってる'
      ],
      polite: [
        '…わかっています'
      ],
      seductive: [
        '………（静かに頷く）…ありがとう…ね'
      ],
      composed: [
        '……うん'
      ]
    },
    shy: {
      _default: [
        '…はい。ご迷惑をおかけしました…'
      ],
      polite: [
        'こ、これ以上は…続けられません…ご、ごめんなさい…'
      ],
    },
    easygoing: {
      _default: [
        'あはは…まぁ、そうだよね。ありがとう'
      ],
      delinquent: [
        'まぁそうだよな。ありがとよ'
      ],
      seductive: [
        'そうよね…ありがとう'
      ],
      polite: [
        'わかりました。…楽しかったです。本当に'
      ],
      ojousama: [
        '承知いたしましたわ。…楽しい日々でしたの'
      ],
      composed: [
        '…まあ、そうだよね。…ありがとう'
      ]
    },
    earnest: {
      _default: [
        'ありがとう。言ってくれて助かった'
      ],
      polite: [
        'ありがとうございます。言ってくださって助かりました'
      ],
      ojousama: [
        'ありがとうございますわ。言ってくださって'
      ],
      seductive: [
        'ありがとう。言ってくれて助かったわ'
      ],
      composed: [
        '…ありがとう。言ってくれて。…助かった'
      ]
    },
    emotional: {
      _default: [
        '…うん…わかってた…わかってたよ…っ'
      ],
      seductive: [
        'もう限界なの……っ……ふふ、ごめんなさい……'
      ],
      composed: [
        '…っ、…わかってた。…うん'
      ]
    }
  },
  accept_winless: {
    normal: {
      _default: [
        '自分でもわかってた。もう追いつけないって',
        '…そうだね。最近、勝てない試合が多すぎた'
      ],
      ojousama: [
        '…そうですわね。最近、勝てませんでしたもの'
      ],
      delinquent: [
        '…わかってたよ。もう追いつけねーって'
      ],
      seductive: [
        '…わかってたわ。もう追いつけないって'
      ],
      composed: [
        '…そうだね。…追いつけなくなってた'
      ]
    },
    bold: {
      _default: [
        '……、認めたくないけど…結果が全てだよね？'
      ],
      ojousama: [
        '…認めたくありませんけれど…結果が全てですわ'
      ],
      delinquent: [
        '…チッ、認めたくねーけど…結果が全てだろ'
      ],
      cool: [
        '…結果が全てだ'
      ],
      seductive: [
        '認めたくないけど…結果が全てよね'
      ],
      composed: [
        '…結果が全て、か。…そうだね'
      ]
    },
    quiet: {
      _default: [
        '……そう、だね'
      ],
      cool: [
        '…そうだな'
      ],
      polite: [
        '…そうですね'
      ],
      composed: [
        '……そう、だね'
      ]
    },
    shy: {
      _default: [
        'もっと早く気づくべきでした…すみません'
      ],
      polite: [
        'ほ、ほとんど勝てませんでした…でも、戦えた日々が宝物です…'
      ],
    },
    easygoing: {
      _default: [
        'うーん…そうだよね。勝てなくなっちゃったもんね'
      ],
      delinquent: [
        'そうだよな。勝てなくなっちまったもんな'
      ],
      seductive: [
        'そうよね…勝てなくなっちゃったものね'
      ],
      composed: [
        '…まあ、勝てなくなったもんね。…仕方ないか'
      ]
    },
    earnest: {
      _default: [
        'もっと早く気づくべきだった。…わかった'
      ],
      polite: [
        'もっと早く気づくべきでした。…わかりました'
      ],
      ojousama: [
        'もっと早く気づくべきでしたわ。…承知しました'
      ],
      seductive: [
        'もっと早く気づくべきだったわ。…わかったわ'
      ],
      composed: [
        '…もっと早く気づくべきだった。…わかった'
      ]
    },
    emotional: {
      _default: [
        '勝てない…もう勝てないんだ…わかってたよ…'
      ],
      seductive: [
        '勝てなかったけど……っ……ふふ、戦えただけで満足なの……'
      ],
      composed: [
        '…勝てなくなった、か。……うん'
      ]
    }
  },
  accept_heel: {
    normal: {
      _default: [
        '…別にアンタに言われなくても辞めるつもりだったよ',
        '…まぁ、潮時ってやつかもね'
      ],
      ojousama: [
        '…言われなくても、辞めるつもりでしたわ'
      ],
      delinquent: [
        '言われなくても辞めるつもりだったっつーの'
      ],
      seductive: [
        'ふふ…言われなくても辞めるつもりだったわ'
      ],
      composed: [
        '…ふぅん。…言われなくても、そのつもりだったよ'
      ]
    },
    bold: {
      _default: [
        '…いいわ。最後くらい、大人しく引き受けてあげる'
      ],
      ojousama: [
        '…よろしくてよ。最後くらい大人しくいたしますわ'
      ],
      delinquent: [
        '…いいぜ。最後くらい大人しくしてやるよ'
      ],
      cool: [
        '…いい。受ける'
      ],
      seductive: [
        '…いいわよ。最後くらい大人しくしてあげる'
      ],
      composed: [
        '…まあ、いいよ。…潮時だし'
      ]
    },
    quiet: {
      _default: [
        '……潮時か'
      ],
      cool: [
        '…潮時だ'
      ],
      polite: [
        '…潮時ですね'
      ],
      composed: [
        '……潮時、だね'
      ]
    },
    shy: {
      _default: [
        '…はい。もう…十分です'
      ],
      polite: [
        'こ、こんなわたしでも…受け入れてくださって、ありがとうございました…'
      ],
    },
    easygoing: {
      _default: [
        'ま、潮時ってやつだね。わかったわかった'
      ],
      delinquent: [
        '潮時ってやつだな。わかったよ'
      ],
      seductive: [
        '潮時ってやつかしら。わかったわ'
      ],
      composed: [
        '…ま、潮時だね。…わかったよ'
      ]
    },
    earnest: {
      _default: [
        '…わかった。最後まで悪役を演じきれたなら本望だ'
      ],
      polite: [
        '…わかりました。最後まで演じきれたなら本望です'
      ],
      ojousama: [
        '…承知しましたわ。最後まで演じきれましたもの'
      ],
      seductive: [
        '…わかったわ。最後まで演じきれたなら本望よ'
      ],
      composed: [
        '…最後まで演じきれたなら、悪くない。…わかった'
      ]
    },
    emotional: {
      _default: [
        '…っ、もういいわよ…わかった…わかったから…'
      ],
      seductive: [
        '悪役のままでも……っ……ふふ、最後まで愛してくれてありがとう……'
      ],
      composed: [
        '…っ、…もういい。…わかった'
      ]
    }
  },
  accept_former_champ: {
    normal: {
      _default: [
        '最後にいい試合がしたい。それだけお願いできる？',
        '…わかった。ベルトを持てた分、十分だよ'
      ],
      ojousama: [
        '最後によい試合をさせてください'
      ],
      delinquent: [
        '最後にいい試合させてくれよ。それだけでいい'
      ],
      seductive: [
        '最後にいい試合がしたいの。お願いできる？'
      ],
      composed: [
        '…最後に一つだけ。…いい試合がしたいな'
      ]
    },
    bold: {
      _default: [
        '最後に…この団体でもう一回輝かせてくれない？'
      ],
      ojousama: [
        '最後に…もう一度、私にふさわしい舞台を用意なさい'
      ],
      delinquent: [
        '最後に…もう一回輝かせてくれよ'
      ],
      cool: [
        '…最後に、もう一度'
      ],
      seductive: [
        '最後に…もう一回輝かせてくれる？'
      ],
      composed: [
        '…最後にもう一度、か。…悪くないね'
      ]
    },
    quiet: {
      _default: [
        '…ベルトを持てた。それで十分'
      ],
      cool: [
        '…十分だ'
      ],
      polite: [
        '…ベルトを持てました。それで十分です'
      ],
      composed: [
        '…ベルトを持てた。…十分だよ'
      ]
    },
    shy: {
      _default: [
        'ベルトを持てただけで…十分すぎるくらいです'
      ],
      polite: [
        'は、はい…チャンピオンになれただけで…幸せでした…'
      ],
    },
    easygoing: {
      _default: [
        'ベルト持てたんだもん。十分でしょ！'
      ],
      delinquent: [
        'ベルト持てたんだぜ。十分だろ！'
      ],
      seductive: [
        'ベルト持てたものね。十分よ'
      ],
      composed: [
        '…ベルト持てたしね。…十分だよ'
      ]
    },
    earnest: {
      _default: [
        '最後にいい試合を。それだけが望みだ'
      ],
      polite: [
        '最後によい試合を。それだけが望みです'
      ],
      ojousama: [
        '最後によい試合を。それだけが望みですわ'
      ],
      seductive: [
        '最後にいい試合を。それだけが望みよ'
      ],
      composed: [
        '…最後にいい試合を。…それだけでいい'
      ]
    },
    emotional: {
      _default: [
        'ベルト…持てたから…もう…十分だよ…っ'
      ],
      seductive: [
        'チャンピオンになれた……っ……ふふ、もう思い残しはないわ……'
      ],
      composed: [
        '…ベルト、持てたから。……十分'
      ]
    }
  },
  accept_no_title: {
    normal: {
      _default: [
        '…わかった。潮時だよね',
        '…そうだね。ありがとう、言ってくれて'
      ],
      ojousama: [
        '…わかりましたわ。潮時ですわね'
      ],
      delinquent: [
        '…わかったよ。潮時ってやつだろ'
      ],
      seductive: [
        '…わかったわ。潮時よね'
      ],
      composed: [
        '…そう。…潮時、だね'
      ]
    },
    bold: {
      _default: [
        '…こんな終わり方かぁ。…わかったよ'
      ],
      ojousama: [
        '…こんな終わり方ですの。…承知しましたわ'
      ],
      delinquent: [
        'チッ、こんな終わり方かよ…わかったよ'
      ],
      cool: [
        '…わかった'
      ],
      seductive: [
        'こんな終わり方なのね…わかったわ'
      ],
      composed: [
        '…こんな終わり方、か。…まあ、いいよ'
      ]
    },
    quiet: {
      _default: [
        '……うん'
      ],
      cool: [
        '…ああ'
      ],
      polite: [
        '…はい'
      ],
      composed: [
        '……うん'
      ]
    },
    shy: {
      _default: [
        '…はい。お世話になりました…'
      ],
      polite: [
        'は、はい…ベルトには届きませんでしたが…ここまでで、十分です…'
      ],
    },
    easygoing: {
      _default: [
        'うん、覚悟はできてた。最後、よろしくね'
      ],
      delinquent: [
        '覚悟はできてたよ。最後よろしくな'
      ],
      seductive: [
        '覚悟はできてたわ。最後、よろしくね'
      ],
      composed: [
        '…覚悟はできてた。…最後、よろしくね'
      ]
    },
    earnest: {
      _default: [
        '…覚悟はできてた。ありがとう、言ってくれて'
      ],
      polite: [
        '…覚悟はできていました。言ってくださってありがとうございます'
      ],
      ojousama: [
        '…覚悟はできておりましたわ。ありがとうございます'
      ],
      seductive: [
        '…覚悟はできてたわ。言ってくれてありがとう'
      ],
      composed: [
        '…覚悟はできてた。…ありがとう、言ってくれて'
      ]
    },
    emotional: {
      _default: [
        'うん…覚悟…できてたよ…ありがとう…'
      ],
      seductive: [
        '無冠でいいの……っ……ふふ、やりきった気がするから……'
      ],
      composed: [
        '……ありがとう。…覚悟はできてたよ'
      ]
    }
  }
};

const RETIRE_REFUSE_LINES = {
  refuse_champ: {
    normal: {
      _default: [
        'チャンピオンに引退しろって？ 冗談はやめて',
        'このベルトがある限り、わたしは終わらない'
      ],
      ojousama: [
        'チャンピオンに引退ですって？ ご冗談を'
      ],
      delinquent: [
        'チャンピオンに引退しろだと？ ふざけんな'
      ],
      seductive: [
        'チャンピオンに引退ですって？ 冗談でしょう？'
      ],
      cool: [
        '……まだだ。…まだ終われない'
      ],
      polite: [
        'まだ引退するわけにはいきません。もう少しだけ…'
      ],
      composed: [
        '…チャンピオンに引退、か。…冗談はやめてよ'
      ]
    },
    bold: {
      _default: [
        '王者を引退させようなんて、100年早いよ'
      ],
      ojousama: [
        '女王である私を引退させようなんて、100年早くてよ'
      ],
      delinquent: [
        '王者に引退しろだと？ 100年早ぇんだよ！'
      ],
      cool: [
        '…王者は、退かない'
      ],
      seductive: [
        '王者を辞めさせる？ 100年早いわよ'
      ],
      polite: [
        'まだです。まだやれます。もう少しだけ時間をください'
      ],
      composed: [
        '…ふぅん。…王者に引退を勧める、か。…早いよ'
      ]
    },
    quiet: {
      _default: [
        '……このベルトがある限り'
      ],
      cool: [
        '…退かない'
      ],
      polite: [
        '…このベルトがある限りは'
      ],
      seductive: [
        '………まだ…よ'
      ],
      composed: [
        '…このベルトがある限りは'
      ]
    },
    shy: {
      _default: [
        'あの…まだ、このベルトを守りたいんです…'
      ],
      polite: [
        'い、いえ…まだ、チャンピオンですから…続けさせてください…'
      ],
    },
    easygoing: {
      _default: [
        'えー、まだチャンピオンだよ？ もうちょっと待ってよ'
      ],
      delinquent: [
        'まだチャンピオンだぜ？ もうちょっと待てって'
      ],
      seductive: [
        'まだチャンピオンよ？ もう少し待って'
      ],
      polite: [
        'まだです！ まだやれます！ もう少しだけお願いします！'
      ],
      ojousama: [
        'まだですわ！ まだやれますの！ お願いいたします！'
      ],
      composed: [
        '…まだチャンピオンだよ。…もう少し待って'
      ]
    },
    earnest: {
      _default: [
        'このベルトの重みをまだ背負える。引退はしない'
      ],
      polite: [
        'このベルトの重みをまだ背負えます。引退はしません'
      ],
      ojousama: [
        'このベルトの重みをまだ背負えますわ'
      ],
      seductive: [
        'このベルトの重み…まだ背負えるわ'
      ],
      composed: [
        '…このベルトの重み、まだ背負える。…引退はしないよ'
      ]
    },
    emotional: {
      _default: [
        'やだ…このベルト離さない…まだ闘える…！'
      ],
      seductive: [
        'まだチャンピオンよ……っ……ふふ、降りるわけにはいかないの……'
      ],
      composed: [
        '…っ、…このベルトは渡さない。…まだ闘える'
      ]
    }
  },
  refuse_distrust: {
    normal: {
      _default: [
        'わたしを追い出す気？ そう簡単にはいかないわよ',
        'この団体に何年貢献してきたと思ってるの'
      ],
      ojousama: [
        'わたくしを追い出すおつもり？ そうはいきませんわ'
      ],
      delinquent: [
        '追い出す気かよ。そう簡単にいくと思うなよ'
      ],
      seductive: [
        '私を追い出すつもり？ そうはいかないわよ'
      ],
      composed: [
        '…追い出す、か。…何年ここにいたと思ってるの'
      ]
    },
    bold: {
      _default: [
        '…あたしのことが邪魔なの？ はっきり言いなさいよ'
      ],
      ojousama: [
        'わたくしが邪魔ですの？ はっきりおっしゃいなさい'
      ],
      delinquent: [
        'あたしが邪魔だってのか？ はっきり言えよ'
      ],
      cool: [
        '…邪魔か。はっきり言え'
      ],
      seductive: [
        '私が邪魔なの？ はっきり言ってくれる？'
      ],
      composed: [
        '…ふぅん、邪魔か。…はっきり言ってくれるね'
      ]
    },
    quiet: {
      _default: [
        '……そういうこと、か'
      ],
      cool: [
        '…そうか'
      ],
      polite: [
        '…そう、ですか'
      ],
      composed: [
        '……そう、か'
      ]
    },
    shy: {
      _default: [
        '…私、必要ないってことですか…？'
      ],
      polite: [
        'あ、あの…どうして、そんなことを言うんですか…悲しいです…'
      ],
    },
    easygoing: {
      _default: [
        'えぇ…あたし邪魔なの？ ちょっとひどくない？'
      ],
      delinquent: [
        'おいおい…邪魔だっての？さすがに ひどくない？'
      ],
      seductive: [
        'あら…私が邪魔なの？ ひどいわね'
      ],
      composed: [
        '…邪魔なの、か。…まあ、ちょっとひどいね'
      ]
    },
    earnest: {
      _default: [
        'この団体のために尽くしてきた。その気持ちは嘘じゃない'
      ],
      polite: [
        'この団体のために尽くしてきました。嘘ではありません'
      ],
      ojousama: [
        'この団体のために尽くしてまいりましたわ'
      ],
      seductive: [
        'この団体のために尽くしてきたの。嘘じゃないわ'
      ],
      composed: [
        '…この団体のために尽くしてきた。…それは嘘じゃない'
      ]
    },
    emotional: {
      _default: [
        '何年…何年ここにいたと思ってるの…っ！'
      ],
      seductive: [
        'どうして……っ……ふふ、わたしを切り捨てるつもり？……'
      ],
      composed: [
        '…っ、…何年ここにいたと思ってるの'
      ]
    }
  },
  refuse_heel: {
    normal: {
      _default: [
        '引退？ 次の興行を見てなさい。後悔させてあげる',
        'まだまだ引退なんてしてやらないよ'
      ],
      ojousama: [
        '引退ですって？ 次の興行をご覧になってくださいまし'
      ],
      delinquent: [
        '引退だと？ 次の興行見てろ。後悔させてやる'
      ],
      seductive: [
        '引退ですって？ 次の興行を見てちょうだい'
      ],
      composed: [
        '…引退、ね。…次の興行を見てからもう一度言って'
      ]
    },
    bold: {
      _default: [
        'あたしがいなくなったら、この団体は終わりよ'
      ],
      ojousama: [
        'わたくしがいなくなったら、この団体は終わりですわよ？'
      ],
      delinquent: [
        'あたしがいなくなったらこの団体終わりだぜ'
      ],
      cool: [
        '…この団体は私がいないと終わる'
      ],
      seductive: [
        '私がいなくなったら…この団体、終わるわよ？'
      ],
      composed: [
        '…ふぅん。…私がいなくなったら困るのは、そっちだよ'
      ]
    },
    quiet: {
      _default: [
        '……まだ辞めない'
      ],
      cool: [
        '…辞めない'
      ],
      polite: [
        '…まだ辞めません'
      ],
      composed: [
        '…まだ辞めない'
      ]
    },
    shy: {
      _default: [
        '…もう少しだけ…ここにいさせてください'
      ],
      polite: [
        'こ、こんなわたしですけど…まだ、リングにいたいんです…'
      ],
    },
    easygoing: {
      _default: [
        'まだまだ暴れ足りないよ～'
      ],
      delinquent: [
        'まだまだ暴れ足りねーっ！'
      ],
      seductive: [
        'まだまだ暴れ足りないわ'
      ],
      composed: [
        '…まだ暴れ足りないんだよね。…もう少し付き合ってよ'
      ]
    },
    earnest: {
      _default: [
        '次の興行で証明する。後悔させてみせる'
      ],
      polite: [
        '次の興行で証明します。後悔させてみせます'
      ],
      ojousama: [
        '次の興行で証明いたしますわ'
      ],
      seductive: [
        '次の興行で証明するわ。後悔させてみせる'
      ],
      composed: [
        '…次の興行で証明する。…後悔させてあげるよ'
      ]
    },
    emotional: {
      _default: [
        '引退…っ？ 冗談じゃない…まだ終わらない…！'
      ],
      seductive: [
        '悪役だってまだやれるわ……っ……ふふ、辞めないわよ……'
      ],
      composed: [
        '…っ、…冗談じゃない。…まだ終わらないよ'
      ]
    }
  },
  refuse_fighting: {
    normal: {
      _default: [
        'まだ終わらない。わたしはまだ闘える',
        '体がある限り、わたしはリングに立つ'
      ],
      ojousama: [
        'まだ終わりませんわ。わたくしはまだ闘えます'
      ],
      delinquent: [
        'まだ終わんねーよ。あたしはまだ闘える'
      ],
      seductive: [
        'まだ終わらないわ。私はまだ闘えるの'
      ],
      composed: [
        '…まだ終わらないよ。…体がある限り、リングに立つ'
      ]
    },
    bold: {
      _default: [
        '…諦めるのは、まだ早い。見てなさい'
      ],
      ojousama: [
        '私を見限るには早すぎるという事……。良く見ていなさいね'
      ],
      delinquent: [
        '諦めるのはまだ早ぇんだよ。見てろ'
      ],
      cool: [
        '…まだだ'
      ],
      seductive: [
        '諦めるのはまだ早いわ。見ていて'
      ],
      composed: [
        '…諦めるのはまだ早いよ。…見ていて'
      ]
    },
    quiet: {
      _default: [
        '……まだ、闘える'
      ],
      cool: [
        '…闘える'
      ],
      polite: [
        '…まだ、闘えます'
      ],
      composed: [
        '…まだ、闘える'
      ]
    },
    shy: {
      _default: [
        'あの…もう少しだけ、チャンスをください…'
      ],
      polite: [
        'ま、まだ、戦えます…もう少しだけ、お願いします…'
      ],
    },
    easygoing: {
      _default: [
        'まだまだ元気だよ！ もうちょっとやらせてよ'
      ],
      delinquent: [
        'まだまだ元気だぜ！ もうちょっとやらせろよ'
      ],
      seductive: [
        'まだまだ元気よ。もう少しやらせて'
      ],
      composed: [
        '…まだ元気だよ。…もう少しやらせて'
      ]
    },
    earnest: {
      _default: [
        'まだやれることがある。ここで止まるわけにはいかない'
      ],
      polite: [
        'まだやれることがあります。止まるわけにはいきません'
      ],
      ojousama: [
        'まだやれることがございます。止まりませんわ'
      ],
      seductive: [
        'まだやれることがあるの。止まるわけにはいかないわ'
      ],
      composed: [
        '…まだやれることがある。…ここで止まるわけにはいかない'
      ]
    },
    emotional: {
      _default: [
        'まだ…まだ闘いたい…お願い、もう少しだけ…！'
      ],
      seductive: [
        'まだ戦えるの……っ……ふふ、わたしを止めないで……'
      ],
      composed: [
        '…っ、…まだ闘いたい。…お願い、もう少しだけ'
      ]
    }
  }
};

const RETAIN_LINES = {
  former_champ: {
    normal: {
      _default: [
        '…もう少しだけ。最後にもう一度、あのベルトに手を伸ばしたい'
      ],
      ojousama: [
        'もう少しだけ…あのベルトに手を伸ばしたいですわ'
      ],
      delinquent: [
        'もう少しだけだ…あのベルトにもう一回手を伸ばしてーんだ'
      ],
      seductive: [
        'もう少しだけ…あのベルトに手を伸ばしたいの'
      ],
      cool: [
        '……残る。…まだやることがある'
      ],
      polite: [
        '残らせてください。まだ…やりたいことがあります'
      ],
      composed: [
        '…もう少しだけ。…あのベルトに、もう一度手を伸ばしたい'
      ]
    },
    bold: {
      _default: [
        'もう一シーズンだけやらせて。必ず結果を出すから！'
      ],
      ojousama: [
        'もう一シーズン。必ず結果を出しますわ'
      ],
      delinquent: [
        'もう一シーズンだけだ。絶対結果出すぜ'
      ],
      cool: [
        '…もう一シーズン'
      ],
      seductive: [
        'もう一シーズンだけ。結果を出すわ'
      ],
      polite: [
        '残ります。まだここでやるべきことがあります'
      ],
      composed: [
        '…もう一シーズンだけ。…結果は出すよ'
      ]
    },
    quiet: {
      _default: [
        '……もう一度だけ'
      ],
      cool: [
        '…もう一度'
      ],
      polite: [
        '…もう一度だけ、挑戦させてください'
      ],
      seductive: [
        '………残るわ'
      ],
      composed: [
        '…もう一度だけ'
      ]
    },
    shy: {
      _default: [
        'あの…もう一度だけ…あのベルトに…挑戦させてください'
      ],
      polite: [
        'チャ、チャンピオンだったわたしが…ここに残っても、いいんでしょうか…'
      ],
    },
    easygoing: {
      _default: [
        'もうちょっとだけ！ あのベルトもう一回触りたいんだよね'
      ],
      delinquent: [
        'もうちょっとだけだ！ あのベルトもう一回触りてーんだよ'
      ],
      seductive: [
        'もう少しだけ。あのベルトにもう一度触れたいの'
      ],
      polite: [
        '残ります！ まだまだここで頑張りたいです！'
      ],
      ojousama: [
        '残りますわ！ まだまだここで精進いたしますの'
      ],
      composed: [
        '…もうちょっとだけ。…あのベルト、もう一回触りたいんだ'
      ]
    },
    earnest: {
      _default: [
        '最後にもう一度…あのベルトに恥じない闘いをしたい'
      ],
      polite: [
        '最後にもう一度…あのベルトに恥じない闘いをしたいです'
      ],
      ojousama: [
        '最後にもう一度…あのベルトに恥じない闘いをしたいですわ'
      ],
      seductive: [
        '最後にもう一度…恥じない闘いをしたいの'
      ],
      composed: [
        '…最後にもう一度。…あのベルトに恥じない闘いをしたい'
      ]
    },
    emotional: {
      _default: [
        'あのベルト…もう一度…触りたい…っ'
      ],
      seductive: [
        '元チャンピオンとして……っ……ふふ、この場所をまだ守りたいの……'
      ],
      composed: [
        '…あのベルト、もう一度。……触りたい'
      ]
    }
  },
  high_trust: {
    normal: {
      _default: [
        'アンタがそう言うなら…もう少しだけ頑張ってみるよ'
      ],
      ojousama: [
        'あなたがそうおっしゃるなら…もう少しだけ頑張りますわ'
      ],
      delinquent: [
        'お前がそう言うなら…もうちょっとだけやってみるか'
      ],
      seductive: [
        'あなたがそう言うなら…もう少し頑張ってみるわ'
      ],
      composed: [
        '…そう言ってくれるなら。…もう少しだけ付き合うよ'
      ]
    },
    bold: {
      _default: [
        '私のこと…信じてくれるなら、もう少し付き合ってあげる'
      ],
      ojousama: [
        'そこまで言うのなら…もう少しだけ付き合ってあげる'
      ],
      delinquent: [
        '信じてくれんなら…もうちょっと付き合ってやるぜ'
      ],
      cool: [
        '…信じてくれるなら'
      ],
      seductive: [
        '信じてくれるの？ …もう少し付き合うわ'
      ],
      composed: [
        '…信じてくれるなら。…もう少し付き合うよ'
      ]
    },
    quiet: {
      _default: [
        '……ありがとう。もう少しだけ'
      ],
      cool: [
        '…もう少しだけ'
      ],
      polite: [
        '…ありがとうございます。もう少しだけ'
      ],
      composed: [
        '…ありがとう。…もう少しだけ'
      ]
    },
    shy: {
      _default: [
        '信じてくれて…ありがとうございます。もう少しだけ…'
      ],
      polite: [
        'あ、あの…ずっと、ここにいたいんです…お願いします…'
      ],
    },
    easygoing: {
      _default: [
        'そっか、まだ必要としてくれてるんだ。じゃあもうちょっと！'
      ],
      delinquent: [
        'まだ必要ってことか。じゃあもうちょっとやるか！'
      ],
      seductive: [
        'まだ必要としてくれるの。じゃあもう少し'
      ],
      composed: [
        '…まだ必要としてくれるんだ。…じゃあもう少し'
      ]
    },
    earnest: {
      _default: [
        '信じてくれてありがとう。期待に応えてみせる'
      ],
      polite: [
        '信じてくださってありがとうございます。期待に応えます'
      ],
      ojousama: [
        '信じてくださって…期待に応えてみせますわ'
      ],
      seductive: [
        '信じてくれてありがとう。応えてみせるわ'
      ],
      composed: [
        '…信じてくれてありがとう。…期待には応えるよ'
      ]
    },
    emotional: {
      _default: [
        '…っ、ありがとう…もう少しだけ…頑張る…！'
      ],
      seductive: [
        'ずっとここにいたい……っ……ふふ、あなたのそばが一番なの……'
      ],
      composed: [
        '……ありがとう。…もう少しだけ、頑張る'
      ]
    }
  },
  heel: {
    normal: {
      _default: [
        'フン…まだ使い道があるってことね。いいわ、付き合ってあげる'
      ],
      ojousama: [
        'まだ使い道がおありですのね。お付き合いしてさしあげますわ'
      ],
      delinquent: [
        'まだ使い道があるってか。いいぜ、付き合ってやるよ'
      ],
      seductive: [
        'まだ使い道があるのね。いいわ、付き合ってあげる'
      ],
      composed: [
        '…ふぅん、まだ使い道があるんだ。…いいよ、付き合ってあげる'
      ]
    },
    bold: {
      _default: [
        '…引き留めるんだぁ。まぁ、悪くない判断かな'
      ],
      ojousama: [
        'ここで引き留めるのね。…まぁ、悪くない判断ね'
      ],
      delinquent: [
        '引き留めるのかよ。まぁ悪くねー判断だな'
      ],
      cool: [
        '…悪くない判断だ'
      ],
      seductive: [
        '引き留めるの？ …悪くない判断ね'
      ],
      composed: [
        '…引き留める、か。…まあ、悪くない判断だね'
      ]
    },
    quiet: {
      _default: [
        '……いいだろう'
      ],
      cool: [
        '…いい'
      ],
      polite: [
        '…わかりました'
      ],
      composed: [
        '……いいよ'
      ]
    },
    shy: {
      _default: [
        '…まだ、ここにいてもいいんですか…？'
      ],
      polite: [
        'こ、こんなわたしでも…置いていただけるんですか…？'
      ],
    },
    easygoing: {
      _default: [
        'へぇ、まだ使ってくれるんだ。ま、いいけどね'
      ],
      delinquent: [
        'まだ使ってくれんのか。へへっ、嬉しいね'
      ],
      seductive: [
        'まだ使ってくれるの。ま、いいけど'
      ],
      composed: [
        '…まだ使ってくれるんだ。…ま、いいよ'
      ]
    },
    earnest: {
      _default: [
        '…わかった。まだ役に立てるなら、全力でやる'
      ],
      polite: [
        '…わかりました。まだお役に立てるなら全力で'
      ],
      ojousama: [
        '…承知しましたわ。お役に立てるなら全力を尽くします'
      ],
      seductive: [
        '…わかったわ。まだ役に立てるなら全力でやるわ'
      ],
      composed: [
        '…わかった。…まだ役に立てるなら、やるよ'
      ]
    },
    emotional: {
      _default: [
        '…っ、まだ必要としてくれるの…わかった…やるよ…'
      ],
      seductive: [
        '嫌われ者でも……っ……ふふ、ここに居場所が欲しいの……'
      ],
      composed: [
        '…っ、…まだ必要としてくれるんだ。…わかった、やるよ'
      ]
    }
  },
  default: {
    normal: {
      _default: [
        '…うん、もう少しだけやってみる',
        'わかった。もう少しだけ、続けてみる'
      ],
      ojousama: [
        '…えぇ、もう少しだけ続けてみますわ'
      ],
      delinquent: [
        '…わかった。もうちょっとだけやってみるか'
      ],
      seductive: [
        '…わかったわ。もう少し続けてみる'
      ],
      composed: [
        '…うん。…もう少しだけ、やってみるよ'
      ]
    },
    bold: {
      _default: [
        '…まだ終わりじゃない。やってみせるよ'
      ],
      ojousama: [
        'まだ終わりでは無いわ'
      ],
      delinquent: [
        'まだ終わりじゃねーよ。やってやるぜ'
      ],
      cool: [
        '…まだだ'
      ],
      seductive: [
        'まだ終わりじゃないわ'
      ],
      composed: [
        '…まだ終わりじゃないよ。…やってみせる'
      ]
    },
    quiet: {
      _default: [
        '……もう少しだけ'
      ],
      cool: [
        '…もう少し'
      ],
      polite: [
        '…もう少しだけ、続けます'
      ],
      composed: [
        '…もう少しだけ'
      ]
    },
    shy: {
      _default: [
        '…もう少しだけ…頑張ってみます'
      ],
      polite: [
        'こ、ここに残ってもよろしいですか…？'
      ],
    },
    easygoing: {
      _default: [
        'まぁもうちょっとやってみようかな！'
      ],
      delinquent: [
        'もうちょっとやってみっか！'
      ],
      seductive: [
        'もう少しやってみようかしら'
      ],
      composed: [
        '…まあ、もうちょっとやってみるか'
      ]
    },
    earnest: {
      _default: [
        '…わかった。まだやれることがあるなら続ける'
      ],
      polite: [
        '…わかりました。まだやれることがあるなら続けます'
      ],
      ojousama: [
        '…承知しましたわ。やれることがあるなら続けます'
      ],
      seductive: [
        '…わかったわ。やれることがあるなら続けるわ'
      ],
      composed: [
        '…わかった。…まだやれることがあるなら、続けるよ'
      ]
    },
    emotional: {
      _default: [
        '…うん…もう少しだけ…やってみる…'
      ],
      seductive: [
        '残らせて……っ……ふふ、まだここでやりたいの……'
      ],
      composed: [
        '……うん。…もう少しだけ、やってみる'
      ]
    }
  }
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
      _default: [
        '控室で泣きました。うれしくて。…来年はもっと上で泣きます',
        'この賞の重さ、まだわかりません。でもリングに上がるたび、きっとわかっていくと思います'
      ],
      ojousama: [
        'まさかわたくしがこのような栄誉に…。先輩方の背中、しかと見ておりました'
      ],
      delinquent: [
        '正直ビビってる。こんなちゃんとした賞もらったの初めてだ…来年も取る'
      ],
      seductive: [
        '覚えておいて。この名前、来年はもっと大きなところで呼ばれるから'
      ],
      composed: [
        '…ま、悪くないスタートかな。ここからだよ'
      ]
    },
    bold: {
      _default: [
        '新人王？ 通過点でしょ。来年はMVPを狙うからね',
        '最初から頂点しか見てない。この賞はスタートラインだよ'
      ],
      ojousama: [
        '当然の結果ですわね。わたくしの実力を見れば、誰もが納得するでしょう？'
      ],
      delinquent: [
        'ハッ、新人なのは今年だけだ。来年は全部かっさらう'
      ],
      cool: [
        '…始まりに過ぎない'
      ],
      seductive: [
        '嬉しい？ ええ、嬉しいわ。でもこの程度で満足する女じゃないの'
      ],
      composed: [
        '…通過点だね。次を見てなよ'
      ]
    },
    quiet: {
      _default: [
        '……まだ何も成し遂げていない。これから'
      ],
      cool: [
        '…次'
      ],
      polite: [
        '…ありがとうございます。まだ、足りないものばかりです'
      ],
      composed: [
        '…ありがとう。…まだ先があるから'
      ]
    },
    shy: {
      _default: [
        'えっ…わたし、ですか…？ 間違いじゃ…あ、ありがとうございます…'
      ],
      ojousama: [
        'わ、わたくしが…？ そんな…まだまだ未熟者ですのに…'
      ],
      delinquent: [
        'は？ マジで？ いや…あ、ありがとな…'
      ],
      polite: [
        'え…わたし、ですか…？ …ありがとうございます…'
      ],
    },
    easygoing: {
      _default: [
        'うそでしょ！ 今年一番びっくりしたの、この瞬間かも！',
        'いやー楽しかった！ ここまで来れたの、運がよかっただけかも！'
      ],
      delinquent: [
        'うっそだろ！？ まあいいや、もらえるもんはもらっとく！'
      ],
      seductive: [
        'あら、嬉しいサプライズ。来年はもっと驚かせてあげる'
      ],
      polite: [
        'うそです…！ 新人王ですか…！ ありがとうございます！'
      ],
      ojousama: [
        'まあ…！ 新人王ですの…！ 光栄ですわ'
      ],
      composed: [
        'へえ、新人王か。…悪くないね。来年も楽しみだ'
      ]
    },
    earnest: {
      _default: [
        '練習してきてよかった。…もっと強くなります'
      ],
      polite: [
        '毎日の積み重ねが報われました。指導してくださった皆さん、ありがとうございます'
      ],
      ojousama: [
        '努力を重ねてまいりました。この賞を糧に、さらなる高みを目指しますわ'
      ],
      seductive: [
        '努力してきたもの。…でもまだ足りないわ。もっと磨くから、見ていて'
      ],
      composed: [
        '…やることはやってきた。この賞が証明してくれたかな'
      ]
    },
    emotional: {
      _default: [
        'あ…だめだ、泣いちゃう…。嬉しいです…こんなに…嬉しいの初めてです…！'
      ],
      ojousama: [
        'あっ…涙が…こ、こんなところで取り乱すなんて…嬉しすぎますわ…！'
      ],
      delinquent: [
        'くっ…泣くかよこんなとこで…。ちくしょう…嬉しいじゃねえか…！'
      ],
      seductive: [
        '新人賞……っ……一年目、無我夢中だったの……認めてもらえて嬉しいわ……'
      ],
      composed: [
        '…っ…そうか。…ありがとう。…次、行くよ'
      ]
    }
  },
  bestMatch: {
    normal: {
      _default: [
        'あの試合の最後の5分間は特別でした。全力を出せた気がします',
        '終わった瞬間、全部出し切ったのがわかる。そんな試合でした'
      ],
      ojousama: [
        'あのような激闘、生涯忘れませんわ。対戦してくれたお相手に、心より敬意を'
      ],
      delinquent: [
        'あの試合はヤバかった。体が勝手に動いてた。あいつとじゃなきゃ無理だった'
      ],
      seductive: [
        '最高に痺れたわ。…また味わいたい、あの感覚'
      ],
      polite: [
        '最高の試合でした。…相手に感謝しています'
      ],
      composed: [
        '…悪くなかった。あの相手だから、出せたものがある'
      ]
    },
    bold: {
      _default: [
        '全力と全力でぶつかった。いい時間だったよ。',
        'あの試合で出し惜しみなんてできなかった。全部出し切ったよ。'
      ],
      ojousama: [
        'あの方と全力で戦えたことは、大変名誉ですわ'
      ],
      delinquent: [
        '殴って殴られて、最後に立ってた。それだけだ。…最高だったけどな'
      ],
      cool: [
        '…言葉はいらない。あの試合がすべてだ'
      ],
      seductive: [
        '全力を引き出してくれた相手に感謝。…次はもっと激しくいくわよ？'
      ],
      polite: [
        '当然の結果です。…でも、まだ上があります'
      ],
      composed: [
        '…いい試合だった。出し惜しみなんてできなかったよ'
      ]
    },
    quiet: {
      _default: [
        '……あの試合のことは、ずっと体が覚えてる'
      ],
      cool: [
        '…一生の試合だった'
      ],
      polite: [
        '…あの方と戦えて、本当によかったです'
      ],
      seductive: [
        '………最高の試合…だったわ'
      ],
      composed: [
        '……あの試合のことは、忘れないだろうね'
      ]
    },
    shy: {
      _default: [
        'あんなすごい試合にわたしが…。相手が引き出してくれたんです'
      ],
      ojousama: [
        'あ、あのような試合ができましたのは…お相手のおかげですわ…'
      ],
      delinquent: [
        'いや…あたしなんかがあんな試合…相手がすげえんだよ…'
      ],
      polite: [
        'あ、あの…ベストバウトに選んでいただけるなんて…相手の方のおかげです…'
      ],
    },
    easygoing: {
      _default: [
        'すっげー楽しかった！ 終わった瞬間「もう1回！」って思ったもん',
        '試合中ずっとニヤニヤしてたかも。だって最高なんだもん！'
      ],
      delinquent: [
        '終わった瞬間「もう1ラウンドくれ！」って叫びそうになった！'
      ],
      seductive: [
        '楽しかったわ。久しぶりに全部忘れて夢中になれた'
      ],
      polite: [
        '最高の試合でした！ 相手にも感謝です！'
      ],
      ojousama: [
        '最高の試合でしたわ！ お相手にも感謝ですの'
      ],
      composed: [
        'あの試合は楽しかったな。…全部出し切れた'
      ]
    },
    earnest: {
      _default: [
        'あの試合のためにずっと準備してきた。報われました',
        'お互い全部出し切れた。これがプロレスだと思います'
      ],
      polite: [
        'あの試合は一生の宝物です。対戦相手の方に、心から感謝しています'
      ],
      ojousama: [
        'あの試合に向けて積み重ねた日々が報われましたわ。最高のお相手に感謝いたします'
      ],
      seductive: [
        '準備してきたものを全部出せた。…最高の相手がいたから'
      ],
      composed: [
        '…積み重ねてきたものが、あの試合で全部出せた。それだけだよ'
      ]
    },
    emotional: {
      _default: [
        'あの試合のこと思い出すだけで…っ。ごめんなさい、涙が…最高でした…！'
      ],
      ojousama: [
        '思い出すだけで…こんな…お相手に、心から…感謝を…っ'
      ],
      delinquent: [
        'ちくしょう…あの試合思い出したら…目から汗が…最高だったよ…！'
      ],
      seductive: [
        '最高の試合だった…涙が止まらないわ'
      ],
      composed: [
        '…っ…あの試合は…ちょっと、特別だったね。…うん'
      ]
    }
  },
  mvp: {
    normal: {
      _default: [
        '一年間、逃げなかった。それだけは胸を張れます',
        '苦しい試合もあった。でも全部、今のわたしを作ってくれた'
      ],
      ojousama: [
        '一年を通して成長できましたこと、皆さまのおかげです'
      ],
      delinquent: [
        '一年間ずっと全力だった。手抜いた日なんか一日もねえよ'
      ],
      seductive: [
        '一年間ずっと見ていてくれたでしょう？ …ちゃんと応えたわ'
      ],
      polite: [
        'MVPをいただけるとは…ありがとうございます。来年も頑張ります'
      ],
      composed: [
        '…一年間、やるべきことをやった。それだけだよ'
      ]
    },
    bold: {
      _default: [
        '誰よりも強かったでしょ？数字にも出てるし。',
        'この一年は、負ける気がしなかったね。全試合見てたでしょ？どうだった？'
      ],
      ojousama: [
        'わたくしが最も輝いた一年でしたわね。異論のある方はリングでお待ちしています'
      ],
      delinquent: [
        '一番強かったのはあたしだ。文句あるなら来いよ'
      ],
      cool: [
        '…結果が語っている'
      ],
      seductive: [
        '一番になるべくしてなった。当然でしょう？ …でも、まだ満足してないわ'
      ],
      polite: [
        '当然です。…でも、来年も狙います'
      ],
      composed: [
        '…まあ、結果は出したからね。…でもまだ先がある'
      ]
    },
    quiet: {
      _default: [
        '……一試合、一試合。それだけをやった'
      ],
      cool: [
        '…積み重ねの結果だ'
      ],
      polite: [
        '…目の前のことに集中しただけです'
      ],
      seductive: [
        '………ありがとう…ね'
      ],
      composed: [
        '…一つずつ、やっただけ'
      ]
    },
    shy: {
      _default: [
        'MVPなんて…周りの人が強くしてくれただけで…。でも、嬉しいです'
      ],
      ojousama: [
        'わ、わたくしがMVPですの…？ 周りの方々に支えられただけですわ…'
      ],
      delinquent: [
        'MVP？ あたしが？ いや…みんなが強くしてくれたんだよ…'
      ],
      polite: [
        'M、MVP…ですか…？ そ、そんな大それた賞、わたしには…'
      ],
    },
    easygoing: {
      _default: [
        'MVP！ 人生で一番カッコいい三文字もらっちゃった！',
        'いやーこの一年楽しかったなー。楽しんでたらMVPになってた！'
      ],
      delinquent: [
        'うおお！ MVP！ いい響きじゃん！'
      ],
      seductive: [
        '最優秀選手ですって。…似合うと思わない？'
      ],
      polite: [
        'MVPですか！ ありがとうございます！ 来年も頑張ります！'
      ],
      ojousama: [
        'MVPですの！ 光栄ですわ。来年も精進いたしますの'
      ],
      composed: [
        'MVP？ …ふぅん。悪くないね'
      ]
    },
    earnest: {
      _default: [
        '毎日の練習が無駄じゃなかった。でもまだ先がある',
        'この賞は自分だけのものじゃない。一緒に戦ってくれたみんなのもの'
      ],
      polite: [
        '日々の積み重ねが実を結びました。来年も変わらず精進します'
      ],
      ojousama: [
        '弛まぬ努力の賜物ですわ。来年も精進を続けますの'
      ],
      seductive: [
        '積み重ねてきたものが実った。…でも、ここで止まるつもりはないわ'
      ],
      composed: [
        '…毎日の積み重ねが形になった。…ここで満足はしないけどね'
      ]
    },
    emotional: {
      _default: [
        '一年間…苦しくて…でも…全部やってきてよかった…っ！ ありがとう…！'
      ],
      ojousama: [
        '一年間…辛いことも…嬉しいことも…全部…っ、報われましたわ…！'
      ],
      delinquent: [
        'くそっ…泣くな泣くな…。一年間…全部出し切った…それだけだ…！'
      ],
      seductive: [
        'MVP……っ……ふふ、わたしが一番輝いてたって、そう言ってもらえるのね……'
      ],
      composed: [
        '…っ…一年間、苦しかったけど…ま、報われたかな。…うん'
      ]
    }
  },
  mediaAward: {
    normal: {
      _default: [
        'こんな賞をいただけるなんて、びっくりです',
        'リング外でも頑張った甲斐がありました',
      ],
      ojousama: ['光栄でございます。また精進いたします'],
      delinquent: ['えっ、マジで？ やっべ、嬉しい'],
      seductive: ['ふふ、私の魅力が伝わったかしら'],
      cool: ['…ありがとう'],
      polite: ['身に余る光栄です。ありがとうございます'],
      composed: ['…ふぅん、こういう賞もあるんだね。…ありがとう'],
    },
    bold: {
      _default: [
        'リングの外でも全力でやってきた結果です！',
        'こういう賞、めちゃくちゃ嬉しいんですよ！',
      ],
      delinquent: ['よっしゃ！ 来年はもっとやったるぞ！'],
      cool: ['結果で示せた。それだけだ'],
      composed: ['…リングの外でも、やるべきことをやっただけだよ'],
    },
    shy: {
      _default: [
        'あ、あの…ありがとうございます…嬉しいです…',
        'こんな私でよかったんでしょうか…',
      ],
      polite: [
        'メディアの方々に…評価していただけて…あ、あの、本当に光栄です…'
      ],
    },
    easygoing: {
      _default: [
        'わーい！ いっぱい出てよかったー！',
        'なんか気づいたらいっぱいお仕事してました！',
      ],
    },
    quiet: {
      _default: ['…ありがとうございます'],
      cool: ['…感謝します'],
      composed: ['…ありがとう'],
    },
  
  emotional: {
    seductive: [
      'メディア功労賞……っ……みんなに見てもらえてた証ね、嬉しいわ……'
    ]
  },
},
  champion: {
    normal: {
      _default: [
        'このベルトの重さを、毎日感じています。だから強くなれると思ってる',
        'チャンピオンであることは誇りです。逃げずに守り抜くよ'
      ],
      ojousama: [
        'この王座をお預かりしている限り、最高の試合をお約束いたします'
      ],
      delinquent: [
        'このベルト欲しいやつ、いくらでもかかってこい。全員叩き返す'
      ],
      seductive: [
        'この輝き、よく似合うでしょう？ 欲しいなら…奪いに来なさい'
      ],
      polite: [
        '一年間、ベルトを守り続けることができました。支えてくださった皆さんに感謝します'
      ],
      composed: [
        '…このベルトの重さ、悪くない。…来るなら来なよ'
      ]
    },
    bold: {
      _default: [
        '最強。これが私。',
        '挑戦したいヤツは何人でも来なよ。結果は変わらないけどね！'
      ],
      ojousama: [
        'この王座はわたくしに最もふさわしい。それを証明し続けますわ'
      ],
      delinquent: [
        '最強はあたしだ。証拠がここにある。文句は拳で言いに来い'
      ],
      cool: [
        '…この景色は渡さない'
      ],
      seductive: [
        '頂点からの景色は最高よ。…あなたには見せてあげないけど'
      ],
      polite: [
        'ベルトを守り抜きました。…来年もこの座は譲りません'
      ],
      composed: [
        '…ここが頂点。渡す気はないよ'
      ]
    },
    quiet: {
      _default: [
        '……この重さを、背負い続ける'
      ],
      cool: [
        '…まだ降りない'
      ],
      polite: [
        '…この責任、全うします'
      ],
      seductive: [
        '………このベルト…渡さないわ'
      ],
      composed: [
        '……この重さ、嫌いじゃない'
      ]
    },
    shy: {
      _default: [
        'チャンピオンって…まだ慣れなくて。でもベルトが重い分、逃げちゃいけないって…'
      ],
      ojousama: [
        'チャンピオンだなんて…まだ信じられませんわ。でもこのベルトに恥じないように…'
      ],
      delinquent: [
        'あたしがチャンピオン…似合わねえかもだけど…でも渡さねえ…'
      ],
      polite: [
        'わ、わたしが…チャンピオンに…？ こ、このベルトを汚さないように頑張ります…'
      ],
    },
    easygoing: {
      _default: [
        'チャンピオンって肩書き、なんかくすぐったいけど最高だね！'
      ],
      delinquent: [
        'チャンピオンの響き、たまんねえ！ もっと楽しむぜ！'
      ],
      seductive: [
        'チャンピオン。いい響きね。似合うでしょう？'
      ],
      polite: [
        '一年間守り抜きました！ 来年も頑張ります！'
      ],
      ojousama: [
        '一年間お守りいたしましたわ。来年もこの座を守りますの'
      ],
      composed: [
        'チャンピオンか。…まあ、楽しんでいくよ'
      ]
    },
    earnest: {
      _default: [
        'チャンピオンとして恥じない試合を、毎回見せる。それが自分との約束',
        'ひとつひとつの防衛戦に全力を注ぐ。それだけ'
      ],
      polite: [
        '王者としての責任を全うします。毎試合、最高の試合をお届けします'
      ],
      ojousama: [
        'どの試合にも全身全霊を注ぎますわ。それがわたくしの矜持です'
      ],
      seductive: [
        '王者としての誇り、毎試合で証明する。見ていてくれるかしら'
      ],
      composed: [
        '…毎試合、ベストを出す。それが王者の仕事だろうね'
      ]
    },
    emotional: {
      _default: [
        'このベルトに…どれだけの想いが詰まってるか…っ。絶対、手放さない…！'
      ],
      ojousama: [
        'このベルトが…こんなに重くて…こんなに温かいなんて…っ'
      ],
      delinquent: [
        'このベルト…命懸けで獲ったんだ…！ 絶対…誰にも渡さねえ…！'
      ],
      seductive: [
        'チャンピオン……っ……ふふ、この重み……愛おしくてたまらないわ……'
      ],
      composed: [
        '…っ…このベルト…簡単には、渡さないよ'
      ]
    }
  },
  hallOfFame: {
    normal: {
      _default: [
        '後悔はない。一試合も。…本当に良い現役生活でした',
        'このリングで過ごした時間が、わたしの全て'
      ],
      ojousama: [
        '華やかな舞台から降りる日が来たということ。…でも、後悔はございません'
      ],
      delinquent: [
        'まさかこんな名誉あるもんもらえる日が来るとはな…。全部、リングがくれたもんだ'
      ],
      seductive: [
        '素敵な花道を用意してくれるのね。…ありがとう。最高の舞台だったわ'
      ],
      polite: [
        '殿堂入り…夢のようです。支えてくださった全ての方に感謝いたします'
      ],
      composed: [
        '…いい時間だった。後悔？ …ないよ'
      ]
    },
    bold: {
      _default: [
        '全盛期はいつだって？「いつだって」だよ！',
        'やり残したことなんて何もないよ。そういう私だからこの場に立てるんでしょ？'
      ],
      ojousama: [
        'わたくしの名が歴史に刻まれる。…ふさわしいと、自分で思えますわ'
      ],
      delinquent: [
        'やりたい放題やって、全部勝ち取った。最高の人生だ'
      ],
      cool: [
        '…全てやった。悔いはない'
      ],
      seductive: [
        '最高の舞台で、最高の人生だった。…最後まで美しかったでしょう？'
      ],
      polite: [
        '殿堂入りです。…ここまで来ることができました'
      ],
      composed: [
        '…全部やりきった。悔いはないよ'
      ]
    },
    quiet: {
      _default: [
        '……ありがとう。この場所が、わたしの全部だった'
      ],
      cool: [
        '…悔いはない。…ありがとう'
      ],
      polite: [
        '…長い間、ありがとうございました。幸せでした'
      ],
      seductive: [
        '………（涙を堪え）…ありがとう'
      ],
      composed: [
        '……ありがとう。…いい場所だった'
      ]
    },
    shy: {
      _default: [
        'こんなわたしが殿堂に…。でも…ここに立てて…嬉しい。本当に嬉しいです'
      ],
      ojousama: [
        '殿堂だなんて…わたくしなんかが…。でも…光栄ですわ…本当に'
      ],
      delinquent: [
        '殿堂…？ あたしが…？ …似合わねえけど…嬉しいよ…ありがとな'
      ],
      polite: [
        'で、殿堂入り…ですか…？ わたしなんかが…本当に、いいんでしょうか…'
      ],
    },
    easygoing: {
      _default: [
        'いやー楽しかった！ 全部ひっくるめて、最高の人生！ ありがとね！',
        'プロレスに出会えてよかった！ 毎日が冒険みたいだったよ！'
      ],
      delinquent: [
        '最っ高に楽しい選手人生だったぜ！ みんなありがとな！ プロレス最高！'
      ],
      seductive: [
        '楽しい日々だったわ。全部、宝物。…ありがとう'
      ],
      polite: [
        '殿堂入りですか…！ 信じられません…ありがとうございます！'
      ],
      ojousama: [
        '殿堂入りですの…！ 夢のようですわ…'
      ],
      composed: [
        '楽しかったな。…全部ひっくるめて、いい時間だった'
      ]
    },
    earnest: {
      _default: [
        '後輩たちへ。リングの上に答えがある。苦しくても立ち続けてほしい',
        'この業界に全てを捧げた。…後輩たちがもっと高い場所に行ってくれたら、それが一番嬉しい'
      ],
      polite: [
        '後輩の皆さん。リングに真実があります。どうか、立ち続けてください'
      ],
      ojousama: [
        '後輩の皆さまへ。わたくしが歩んだ道を、どうか超えていってくださいまし'
      ],
      seductive: [
        '後輩たちへ。この世界には、努力した人だけが見える景色があるわ。…信じて'
      ],
      composed: [
        '後輩たちへ。…焦らなくていい。やるべきことをやれば、ちゃんと届くから'
      ]
    },
    emotional: {
      _default: [
        'プロレスが…わたしの居場所だった…。ここで出会えた人たちが…全部…宝物で…っ！'
      ],
      ojousama: [
        'こんな日が来るなんて…わたくし…皆さまに支えられて…っ、幸せでしたわ…！'
      ],
      delinquent: [
        'ちくしょう…泣くなっつってんだろ…。みんな…ありがとう…本当に…くそ…！'
      ],
      seductive: [
        '殿堂入り…もう言葉にならないわ…（涙を堪える）'
      ],
      composed: [
        '…っ…みんな、ありがとう。…いい場所だった。…本当に'
      ]
    }
  },

  // 殿堂入りコーチFG演出セリフ（コーチ共通、5パターン）
  hofCoach: {
    _default: [
      'あの子が本当にすごい選手になりました。指導者冥利に尽きます…。',
      '最初に会った頃は不安だらけだったのに…立派になって…。',
      '殿堂入りか…私が教えたなかで一番の誇りだよ。',
      'この日を見届けられて、コーチ冥利に尽きます。',
      'あの子の努力を誰より知っている。おめでとう。',
    ]
  }
};

// ══════════════════════════════════════════════
//  v1.8: 成長イベントシステム セリフ & テンプレート
// ══════════════════════════════════════════════

// §2.6a ブレイクスルー兆し — 試合中のモノローグ（personality別）
const BT_HINT_LINES = {
  normal: {
    _default: [
      '（…体が軽い。いつもと、何かが違う——）',
      '（…動ける。まだ、動ける——）'
    ],
    ojousama: [
      '（…体が軽いわ。何かが変わったかしら——）'
    ],
    delinquent: [
      '（…なんだ、この感覚。体が勝手に動きやがる——）'
    ],
    cool: [
      '……何かが、変わり始めている'
    ],
    polite: [
      '何かが掴めそうな気がします。もう少しで…'
    ],
    seductive: [
      '何かが変わり始めてる…自分でもわかるわ'
    ],
    composed: [
      '（…ふぅん。…いつもと違う。悪くないね——）'
    ]
  },
  bold: {
    _default: [
      '（…体が勝手に動く。これが、あたしの限界の先——）',
      '（…見えた。次やるべきことが、はっきりと——）'
    ],
    cool: [
      '（…限界の、その先——）'
    ],
    delinquent: [
      '（…体が勝手に動きやがる。これが限界の先かよ——）'
    ],
    polite: [
      'もう少しで掴めそうです。あと一歩です'
    ],
    ojousama: [
      'もう少しでなにかが掴めそうな。……あと一歩ね。'
    ],
    seductive: [
      'もう少し…あと少しで何かが掴めそうなの'
    ],
    composed: [
      '（…なるほど。…これが、その先か——）'
    ]
  },
  quiet: {
    _default: [
      '（…見える。次の一手が、はっきりと）',
      '（…体が、勝手に動いている——）'
    ],
    cool: [
      '（——見えた）'
    ],
    polite: [
      '………もう少しで…掴めそう…です'
    ],
    seductive: [
      '………もう少し…あと少し…'
    ],
    composed: [
      '（……見えた。…次の一手——）'
    ]
  },
  easygoing: {
    _default: [
      '（…あれ？ なんか今日、すっごく調子いいかも——）',
      '（…体が軽い。いつもと全然違う——）'
    ],
    composed: [
      '（…あれ、なんか今日いいね。…いつもと違う——）'
    ]
  },
  earnest: {
    _default: [
      '（…あの練習が、今、実を結ぼうとしている——）',
      '（…わかる。体が覚えている。次の一手——）'
    ],
    polite: [
      '（…あのお稽古が、今、実を結ぼうとしている——）'
    ],
    seductive: [
      '積み重ねてきたものが…形になりそうなの'
    ],
    ojousama: [
      '積み重ねてまいりましたものが、形になりそうですわ'
    ],
    composed: [
      '（…あの練習が…ここで繋がった——）'
    ]
  },
  emotional: {
    _default: [
      '（…わたしの体、こんなに動けたんだ——！）',
      '（…すごい。体が勝手に。止まらない——）'
    ],
    seductive: [
      '……っ……何か、来そうな予感がするの……ふふ、楽しみだわ……'
    ],
    composed: [
      '（…っ…体が、勝手に——…悪くない——）'
    ]
  },

  shy: {
    polite: [
      '最近…なにかが、掴めそうな…そんな気がするんです…'
    ]
  },
};

// §2.6b ブレークスルーセリフ（personality×archetype）
const BREAKTHROUGH_LINES = {
  normal: {
    _default: [
      'あの試合で、何かが変わった気がする…',
      '限界だと思っていた壁を越えられた！'
    ],
    ojousama: [
      '何かが変わった気がいたします…壁を越えたのね'
    ],
    delinquent: [
      'おっしゃ！ なんか壁越えた気がするぜ！'
    ],
    seductive: [
      'あら…何かが変わった気がするわ'
    ],
    cool: [
      '……成長を、実感している'
    ],
    polite: [
      '何かが変わった気がします。…成長できている実感があります'
    ],
    composed: [
      '…なるほど。壁を越えたみたいだね'
    ]
  },
  bold: {
    _default: [
      '当然、まだまだこんなもんじゃない！',
      'やっと体が追いついてきた。ここからでしょ！'
    ],
    ojousama: [
      '当然ね。まだまだこんなものでは無くてよ'
    ],
    delinquent: [
      '当然だろ！ まだまだこんなもんじゃねーぜ！'
    ],
    cool: [
      '…まだ上がある'
    ],
    seductive: [
      '当然よ。まだまだこんなものじゃないわ'
    ],
    polite: [
      '手応えがあります。まだまだ伸びます'
    ],
    composed: [
      '…ま、まだ先がある。ここからだよ'
    ]
  },
  quiet: {
    _default: [
      '……何かが、変わった'
    ],
    cool: [
      '…変わった'
    ],
    polite: [
      '…何かが変わった気がします'
    ],
    seductive: [
      '………（静かに拳を見つめ）…変わってきたわ'
    ],
    composed: [
      '……変わった、かな'
    ]
  },
  shy: {
    _default: [
      'え…わたし、こんなに動けたんですか…？'
    ],
    polite: [
      'あ、あの…何かが、変わった気がします…壁を、越えられたかも…しれません…'
    ],
  },
  easygoing: {
    _default: [
      'おっ、なんかいつもと違う！ いい感じ！'
    ],
    delinquent: [
      'おお！ なんかいつもと違うぜ！ いい感じ！'
    ],
    seductive: [
      'あら、いつもと違う感じ。いいわね'
    ],
    polite: [
      'なんか最近調子いいんです！ もっと上に行けそうです！'
    ],
    ojousama: [
      '最近絶好調ですわ！ もっと上に行けそうですの'
    ],
    composed: [
      'あれ、なんかいい感じ。…悪くないね'
    ]
  },
  earnest: {
    _default: [
      '練習が実を結んだ…！ まだ上を目指す',
      'あの敗北が…私を強くしてくれた'
    ],
    polite: [
      '練習が実を結びました…！ まだ上を目指します'
    ],
    ojousama: [
      'お稽古の成果ですわ…！ まだまだ上を目指しますわ'
    ],
    seductive: [
      '練習が実を結んだわ…まだ上を目指すわよ'
    ],
    composed: [
      '…積み重ねてきたものが、ようやく。…まだ上がある'
    ]
  },
  emotional: {
    _default: [
      'うわぁ…！ 体が軽い！ すごい、すごい…！',
      '限界なんてなかった…！ まだ上があった…！'
    ],
    seductive: [
      '……っ……変わったの、わたし……ふふ、自分でも信じられないくらい……'
    ],
    composed: [
      'なんだか壁を超えてみたいな。…へぇ、イイ感じじゃん♪'
    ]
  }
};

// ── 成長マイルストーン通知セリフ（personality×archetype） ──
const MILESTONE_LINES = {
  // OVR 65-75: 素朴な手応え、まだ道半ば
  ovr_growth: {
    normal: {
      _default: ['少しずつだけど…強くなれてる気がする', '前より体が動くようになった'],
      ojousama: ['確かに成長を感じますわ。…まだまだですけれど'],
      delinquent: ['おっ、ちょっとは強くなったじゃん'],
      cool: ['……手応えは、ある'],
      seductive: ['ふふ、ちょっとは良くなったかしら'],
      polite: ['少しずつですが、成長を実感しています'],
      composed: ['…悪くないペースだね'],
    },
    bold: {
      _default: ['まだまだ足りない。でも、近づいてる', 'ここからが本番だよ'],
      ojousama: ['ここからが本番ですわ。見ていてくださいませ'],
      delinquent: ['ここからだっつーの！ まだ全然足りねえ'],
      cool: ['…通過点だ'],
      polite: ['まだまだですが、確実に前に進んでいます'],
      composed: ['…通過点、だね。まだ先がある'],
    },
    quiet: {
      _default: ['……少し、強くなれた'],
      cool: ['…実感はある'],
      polite: ['…少しだけ、自信がつきました'],
      composed: ['…少しは、ね'],
    },
    easygoing: {
      _default: ['おっ、なんかいい感じになってきた！', 'ちょっとずつ強くなってるっぽい？'],
      delinquent: ['おー、いい感じに仕上がってきたぜ'],
      ojousama: ['順調に成長してますわ♪'],
      composed: ['あれ、なかなかいいんじゃない？'],
    },
    earnest: {
      _default: ['練習してきた甲斐があった…！', '一歩一歩、確実に前に進んでる'],
      polite: ['日々の積み重ねが実を結んできました'],
      ojousama: ['お稽古の成果が出てきましたわ'],
      composed: ['…コツコツやってきた成果が、ちゃんと出てるね'],
    },
    emotional: {
      _default: ['っ…！ 強くなってる…！ 嬉しい…！', 'やった…ちゃんと成長できてる…！'],
      seductive: ['…ふふっ、強くなっちゃった。嬉しいわ'],
      composed: ['わ、ちょっと嬉しいかも…へへ'],
    },
  },

  // OVR 80-90: 確信と覚悟、一流の入口
  ovr_elite: {
    normal: {
      _default: ['ここまで来れたんだ…', '見える景色が変わってきた気がする'],
      ojousama: ['ここまで来れたのですね…感慨深いですわ'],
      delinquent: ['ここまで来たら、もう誰にも止められねえ'],
      cool: ['……一つの壁を、越えた'],
      seductive: ['ここまで来ちゃったのね…ふふ'],
      polite: ['ここまで来られたのは、皆さんのおかげです'],
      composed: ['…ここまで来たか。…悪くないね'],
    },
    bold: {
      _default: ['見えてきた。頂がすぐそこにある', 'ここからが本当の勝負'],
      ojousama: ['頂が見えてきましたわ。手を伸ばせば届く距離に'],
      delinquent: ['見えてきたぜ、てっぺんが！'],
      cool: ['…この景色から、さらに上へ'],
      polite: ['まだ上があります。ここからが本当の戦いです'],
      composed: ['…頂が見えてきた。もうひと踏ん張り、かな'],
    },
    quiet: {
      _default: ['………ここまで来た'],
      cool: ['…まだ、止まらない'],
      polite: ['…ここまで来られました'],
      composed: ['……うん。…ここまで来たんだね'],
    },
    easygoing: {
      _default: ['いやー、ここまで来ちゃった！ すごくない？'],
      delinquent: ['マジか、ここまで来ちゃったぜ！'],
      ojousama: ['ここまで来れるとは思いませんでしたわ！'],
      composed: ['え、もうこんなとこまで来たの？ へー'],
    },
    earnest: {
      _default: ['ここまで来た…でも、まだ足りない。もっと上へ', '全ての敗北が、ここに繋がっていた'],
      polite: ['ここまで来ました。でもまだ、上を目指します'],
      composed: ['…ここまで来たけど、まだ終わりじゃない。…いや、始まりだよ'],
    },
    emotional: {
      _default: ['ここまで来れた…！ 泣きそう…いや、泣かない…！', 'みんなが支えてくれたから…ここに立ってる…！'],
      seductive: ['…ここまで来ちゃったの…嬉しくて…ちょっと泣きそう'],
      composed: ['ここまで来れた…ちょっとだけ、ジーンと来ちゃった'],
    },
  },

  // OVR 95-115: 超越の境地、伝説の領域
  ovr_legend: {
    normal: {
      _default: ['まだ上があるなんて…自分でも信じられない', '…ここに立っていること自体が、夢みたいだ'],
      ojousama: ['この領域に立てたのは…光栄ですわ'],
      delinquent: ['はは…マジかよ、こんなとこまで来ちまった'],
      cool: ['……この先に何があるのか。…見てみたい'],
      seductive: ['ここまで来たら…もう怖いものなんてないわ'],
      polite: ['この場所に立たせていただけるなんて…身に余る光栄です'],
      composed: ['…ここまで来ると、逆に静かな気持ちになるね'],
    },
    bold: {
      _default: ['頂点はすぐそこだ。…いや、もう立ってるのかもしれない', 'ここから先は、私が道を作る'],
      ojousama: ['頂の景色…悪くありませんわね'],
      delinquent: ['てっぺんだ！ 文句あるやつは掛かってこい！'],
      cool: ['……誰も、追いつけない場所にいる'],
      polite: ['ここまで来ました。…でもまだ、挑戦し続けます'],
      composed: ['…ふぅん。なかなかの景色じゃない'],
    },
    quiet: {
      _default: ['…………（静かに拳を握る）'],
      cool: ['…この静けさが、答えだ'],
      polite: ['…ここまで来られたのですね…'],
      composed: ['……うん。…ここか'],
    },
    easygoing: {
      _default: ['えっ、マジで？ ここまで来ちゃった？ あはは！'],
      delinquent: ['うっひょー！ 最強じゃね？'],
      ojousama: ['あらまあ…とんでもないところまで来てしまいましたわ'],
      composed: ['へぇ〜、やるじゃん自分。…ちょっと笑っちゃうね'],
    },
    earnest: {
      _default: ['全ての日々が、ここに繋がっていた', 'これが私の全て…いや、まだ終わらない'],
      polite: ['全てを懸けてきた日々が…報われました'],
      composed: ['…やれるだけのことは、やった。…でも、まだやれる'],
    },
    emotional: {
      _default: ['…っ、…ここまで…本当に…ありがとう…！', '信じられない…こんな場所に…私が…！'],
      seductive: ['ここまで来ちゃった…もう…涙が止まらないわ…'],
      composed: ['…あはは、ダメだ。嬉しすぎて言葉にならない'],
    },
  },

  // 人気 50-60: 認知の喜び
  pop_growth: {
    normal: {
      _default: ['知ってくれる人が増えてきた気がする', '声を掛けてもらえるようになった'],
      ojousama: ['わたくしのことを知ってくださる方が増えましたわ'],
      delinquent: ['おっ、知名度上がってんじゃん'],
      cool: ['……認知されてきた、か'],
      seductive: ['ふふ、注目されるのは悪くないわね'],
      polite: ['応援してくださる方が増えて、嬉しいです'],
      composed: ['…知ってもらえるのは、素直に嬉しいね'],
    },
    bold: {
      _default: ['当然だ。私の実力なら、もっと知られてもいい', 'やっとみんなが気づき始めた'],
      delinquent: ['やっと気づいたか！ もっと見とけよ！'],
      cool: ['…当然の結果だ'],
      polite: ['注目していただけるのは光栄です。期待に応えます'],
      composed: ['…ま、当然っちゃ当然かな'],
    },
    quiet: {
      _default: ['……見てくれてる人が、いるんだ'],
      polite: ['…見ていてくださる方がいるのですね'],
      composed: ['…見てくれてる人が増えた、のかな'],
    },
    easygoing: {
      _default: ['ファンが増えてきた！ 嬉しいな〜', '声援もらえるの、テンション上がるね！'],
      ojousama: ['ファンの方が増えて嬉しいですわ！'],
      composed: ['お、ファン増えてきた？ いいじゃんいいじゃん'],
    },
    earnest: {
      _default: ['頑張りを見てくれている人がいる…もっと応えたい', '応援してくれる声が、力になる'],
      polite: ['応援を力に変えて、もっと頑張ります'],
      composed: ['…見てくれてる人がいるなら、もっと頑張らないと'],
    },
    emotional: {
      _default: ['え…応援してくれてるの…？ 嬉しい…！', '声援が聞こえる…もう一人じゃないんだ…！'],
      seductive: ['応援してくれる人が…嬉しいわ…ふふ'],
      composed: ['わ、こんなに見てくれてるんだ…ちょっと照れちゃうね'],
    },
  },

  // 人気 70-95: スターの自覚
  pop_star: {
    normal: {
      _default: ['こんなにたくさんの人が応援してくれてる…', '期待に応えなきゃ'],
      ojousama: ['これだけの方に応援いただけるなんて…身が引き締まりますわ'],
      delinquent: ['すっげえ声援だな…やべえ、ちょっと鳥肌立った'],
      cool: ['……背負うものが増えた。…それでいい'],
      seductive: ['こんなにたくさん…みんなの視線が気持ちいいわ'],
      polite: ['こんなに多くの方に応援いただいて…感謝の気持ちでいっぱいです'],
      composed: ['…こんなに応援してくれる人がいるんだ。…頑張らないとね'],
    },
    bold: {
      _default: ['この声援に恥じない試合を見せてやる', '期待してろ。最高の舞台を見せてやるから'],
      delinquent: ['全員まとめて最高の試合見せてやるぜ！'],
      ojousama: ['この声援に恥じぬ試合をお見せしますわ'],
      cool: ['…この歓声。…全てに応える'],
      polite: ['全ての応援に、試合で応えてみせます'],
      composed: ['…ま、みんなが見てるなら、格好つけないとね'],
    },
    quiet: {
      _default: ['……こんなに……ありがとう'],
      cool: ['…背負っていく。この声を'],
      polite: ['…こんなにたくさん…ありがとうございます'],
      composed: ['……ん。…ありがたいね'],
    },
    easygoing: {
      _default: ['うわー、すごい人気！ もっと盛り上げていくよ！'],
      delinquent: ['最高だぜ！ もっと声出せ〜！'],
      ojousama: ['まあ、こんなに！ もっともっと楽しんでまいりましょう！'],
      composed: ['あはは、すごいね。…嬉しいなぁ'],
    },
    earnest: {
      _default: ['この声援が、私の全て。…絶対に裏切らない', 'ここまで来れたのは、応援してくれた人たちのおかげ'],
      polite: ['この声援を力に、必ず期待に応えてみせます'],
      composed: ['…ここまで来れたのは、見てくれた人がいたから。…恩返ししないと'],
    },
    emotional: {
      _default: ['こんなにたくさん…！ 泣いちゃう…ありがとう…！', 'みんなの声が…力になる…もっと頑張る…！'],
      seductive: ['こんなに…嬉しくて…もう言葉にならないの…'],
      composed: ['あぁ…ダメだ、こんなに応援されたら…泣いちゃう'],
    },
  },

  // trainCap到達: 限界の感慨
  cap_reached: {
    normal: {
      _default: ['ここが私の限界…でも、後悔はない', '…もう、これ以上は伸びない。でも充分だ'],
      ojousama: ['ここが限界…でも、ここまで来られたことに感謝ですわ'],
      delinquent: ['…ちっ、ここが天井か。でも悪くねえ'],
      cool: ['……ここが、天井か'],
      seductive: ['これ以上は…ね。でも、十分よ'],
      polite: ['ここまで来られただけで、幸せです'],
      composed: ['…ここが限界か。…まあ、上出来じゃない？'],
    },
    bold: {
      _default: ['ここが限界？ …認めたくないけど、そうなのかもしれない', '…天井を感じる。でも、他の部分で勝負する'],
      delinquent: ['クソ、ここが限界かよ…でも、まだ他で勝負できる'],
      ojousama: ['この壁だけは…超えられないのかしら'],
      cool: ['…認めよう。この先はない。だが、強さは数字だけじゃない'],
      polite: ['限界を感じますが…まだやれることはあります'],
      composed: ['…天井か。…でもまあ、ここまで来たんだし上出来だよ'],
    },
    quiet: {
      _default: ['………（静かに息をつく）…ここまで、か'],
      cool: ['…ここまでだ'],
      polite: ['…ここまで、でした'],
      composed: ['……うん。…ここまでだね'],
    },
    easygoing: {
      _default: ['あ、もう伸びない感じ？ まあいっか、十分十分！'],
      delinquent: ['まあいいや、ここまで来れただけでも上等だぜ'],
      ojousama: ['あら、もうこれ以上は？ まあ、十分ですわ'],
      composed: ['へー、もう限界なんだ。…まあいいんじゃない？'],
    },
    earnest: {
      _default: ['ここが限界…悔しい。でも、ここまで鍛えてきた日々は嘘じゃない', '…まだ他の部分を磨ける。立ち止まるつもりはない'],
      polite: ['限界に達しましたが…この道のりに誇りを持っています'],
      composed: ['…限界か。…でもここまでの道のりは、全部本物だよ'],
    },
    emotional: {
      _default: ['もう…伸びないの…？ …でも、ここまで来れた。それだけで…！', '…悔しい…でも、頑張ってきたのは本当だから…！'],
      seductive: ['ここまでなのね…少し寂しいけど…胸を張れるわ'],
      composed: ['…もう伸びないんだ。…ちょっと寂しいけど、悪くない'],
    },
  },
};

// 初顔合わせ試合前ポップアップセリフ（personality×archetype）
// 仕様: specs/match-flavor-popup-spec-v0.1.md §3.2
const FIRST_MEET_LINES = {
  normal: {
    _default: [
      '噂は聞いていたわ',
      '初めまして…よろしく',
      '一度やってみたかった',
      'こうして向かい合えるとは',
    ],
    ojousama: ['お会いできて光栄ですわ', 'お手合わせ願いますわ'],
    polite: ['お初にお目にかかります', '本日はよろしくお願いします'],
    delinquent: ['お前か、噂のヤツ', 'ふん、見せてもらおうじゃねえか'],
    cool: ['……', '……始めようか'],
    seductive: ['ふふ、初めましてね', '楽しみにしてたのよ'],
    composed: ['…噂は聞いてるよ。よろしく'],
  },
  bold: {
    _default: ['やっと当たれるな！', '待ってたぞ、この日を', '本気で来いよ'],
    delinquent: ['待たせたな！', 'やっとかよ、楽しもうぜ'],
    ojousama: ['ようやくお相手いただけますのね', '楽しみにしておりましたわ'],
    cool: ['……ようやくか'],
    polite: ['お会いできて光栄です。全力で挑みます'],
  },
  quiet: {
    _default: ['…よろしく', '……（軽く頭を下げる）'],
    cool: ['……', '……始めようか'],
    polite: ['…よ、よろしくお願いします'],
  },
  earnest: {
    _default: ['よろしくお願いします！', 'この一戦、全力で挑みます'],
    polite: ['お手合わせいただけて光栄です', '本日はよろしくお願いいたします'],
    ojousama: ['お相手いただけて光栄ですわ。全力で挑みます'],
  },
  emotional: {
    _default: ['ずっと…ずっとやりたかった！', '夢だったの、これ！'],
  },
  easygoing: {
    _default: ['いやー、やっとだね', 'よろしくー！', 'ふふっ、楽しみだったよ'],
    delinquent: ['よっ、よろしくな！'],
    ojousama: ['ようやくお手合わせできますのね、楽しみですわ'],
  },
  shy: {
    _default: ['あ、あの…よ、よろしく…', '……よろしくお願いします…'],
    polite: ['あ、あの…よ、よろしくお願いします…'],
  },
};

// 試合後フレーバーポップアップセリフ（勝者/敗者の余韻）
// 仕様: specs/match-flavor-popup-spec-v0.1.md §4.6
// 勝敗は確定したばかり、リング上で発する一言。長台詞は避ける(autoClose 1.8s)
const POST_MATCH_FLAVOR_LINES = {
  winner: {
    normal: {
      _default: ['…取った', '勝ったわ', 'これで一勝', 'ふぅ…決まったわね'],
      ojousama: ['勝たせていただきましたわ', 'ふぅ…お見事でしたでしょう？'],
      polite: ['ありがとうございました', '勝たせていただきました'],
      delinquent: ['勝ったぜ', 'ま、こんなもんだろ'],
      cool: ['……', '……決まりだ'],
      seductive: ['ふふ、いただいたわ', '勝たせてもらったわよ'],
      composed: ['…取れた', '…ふぅ、勝ったよ'],
    },
    bold: {
      _default: ['当然よ！', 'こんなもんよ！', 'わたしの勝ち！'],
      delinquent: ['当ったり前だろうが！', 'はっ、こんなもんよ'],
      ojousama: ['当然の結果ですわ', 'わたくしに敵う者はいませんわ'],
      cool: ['……当然だ'],
      polite: ['…勝たせていただきました'],
    },
    quiet: {
      _default: ['…勝った', '……（小さく頷く）'],
      cool: ['……', '……'],
      polite: ['…勝たせていただきました…'],
    },
    earnest: {
      _default: ['勝てました…！', '本当に…ありがとうございます！'],
      polite: ['勝たせていただきました、ありがとうございます'],
      ojousama: ['勝たせていただきました…！'],
    },
    emotional: {
      _default: ['やった…やった…！', '勝った…勝ったよ…！'],
    },
    easygoing: {
      _default: ['いやー、勝てちゃった', 'ふふっ、ラッキー♪', '勝ったよ〜'],
      delinquent: ['勝ったぜ〜'],
      ojousama: ['勝たせていただきましたわ、うふふ'],
    },
    shy: {
      _default: ['…か、勝った…', '……（深々とお辞儀）'],
      polite: ['…か、勝たせていただきました…'],
    },
  },
  loser: {
    normal: {
      _default: ['…悔しい', '…まだまだね', '…次は勝つわ', '…完敗ね'],
      ojousama: ['…無念ですわ', '…次こそは…'],
      polite: ['…ありがとうございました', '…申し訳ありません'],
      delinquent: ['…クソッ', 'チッ…', 'まだ…まだだ'],
      cool: ['……', '……まだだ'],
      seductive: ['…あら、負けちゃった', '…次は逃がさないわ'],
      composed: ['…負けたか', '…まだ足りないね'],
    },
    bold: {
      _default: ['…嘘でしょ？', 'こんなはずじゃ…', '…次は絶対に！'],
      delinquent: ['…ふざけんな！', 'クソッ…まだだ！'],
      ojousama: ['…こんなはずでは…', '…次は許しませんわ'],
      cool: ['……不覚'],
      polite: ['…申し訳ありません、不甲斐ないです'],
    },
    quiet: {
      _default: ['…負けた', '……（俯く）'],
      cool: ['……', '……'],
      polite: ['…申し訳…ありません…'],
    },
    earnest: {
      _default: ['…次は必ず勝ちます', '…悔しい、もっと強くなる'],
      polite: ['…申し訳ありません、次こそ'],
      ojousama: ['…次は必ず雪辱しますわ'],
    },
    emotional: {
      _default: ['…悔しい…悔しいよ…', '…なんで…なんで負けたの…'],
    },
    easygoing: {
      _default: ['あちゃー、負けちゃった', '…次がんばろ', 'むぅ…悔しいなあ'],
      delinquent: ['負けちまった〜'],
      ojousama: ['…負けてしまいましたわ、てへ'],
    },
    shy: {
      _default: ['…ご、ごめんなさい…', '……（消え入りそう）'],
      polite: ['…も、申し訳ありません…'],
    },
  },
};

// personality×archetype セリフ配列取得（Engine用: 呼び出し元でRNG選択可能）
function getDialoguePool(lineObj, fighter) {
  const v = fighter?.voice;
  if (v && lineObj._voice?.[v]) return lineObj._voice[v];
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
      _default: [
        'あの負けから…何かがおかしい',
        '自分の何が悪かったのか、わからない'
      ],
      ojousama: [
        'あの敗北から…何かがおかしい気がする'
      ],
      delinquent: [
        'あの負けから…何かおかしいんだよ'
      ],
      seductive: [
        'あの負けから…何かがおかしいの'
      ],
      cool: [
        '……最近、噛み合わない'
      ],
      polite: [
        '最近、何をやってもうまくいかなくて…'
      ],
      composed: [
        '…あの負けから、どこか噛み合わない'
      ]
    },
    bold: {
      _default: [
        '…何やってんだわたし',
        '負けた？ わたしが？ …嘘でしょ'
      ],
      ojousama: [
        '…何をしてるの？私ほどの者が……'
      ],
      delinquent: [
        '…チッ、何やってんだよあたし'
      ],
      cool: [
        '……何をやっている'
      ],
      seductive: [
        'あら…おかしいわね、こんなはずじゃ'
      ],
      polite: [
        '正直、調子が上がりません。…でも、立て直します'
      ],
      composed: [
        '…こんなはずじゃないんだけど。…焦ってはいないよ'
      ]
    },
    quiet: {
      _default: [
        '……あの負けから、動けない'
      ],
      cool: [
        '…動けない'
      ],
      polite: [
        '…あの試合から、うまく動けなくて'
      ],
      seductive: [
        '………何も…うまくいかないわ'
      ],
      composed: [
        '……あの負けから、少し…鈍い'
      ]
    },
    shy: {
      _default: [
        'やっぱり…私なんかじゃ、ダメなんでしょうか…'
      ],
      polite: [
        'ま、負けが続いて…自信が、なくなりそうです…'
      ],
    },
    easygoing: {
      _default: [
        'あはは…なんだろうね、体が動かないや'
      ],
      delinquent: [
        'なんだろうな…いつもみたいに動かねーよ'
      ],
      seductive: [
        'ふふ…なんでかしら、いつもみたいに動けないの'
      ],
      polite: [
        '最近ちょっと調子悪くて…でも大丈夫です！'
      ],
      ojousama: [
        '最近少し不調ですの…でもすぐ立て直しますわ'
      ],
      composed: [
        '…あれ、おかしいな。…いつもの感覚が戻らない'
      ]
    },
    earnest: {
      _default: [
        'あの負け…自分の何がダメだったんだろう',
        '負けた理由がわかるまで…前に進めない'
      ],
      polite: [
        'あの試合から…自分の何が足りないのか、ずっと考えています'
      ],
      ojousama: [
        'あの敗北…わたくしの何がいけませんでしたの'
      ],
      seductive: [
        'あの負けから…ずっと考えてるの、何がいけなかったのかって'
      ],
      composed: [
        '…何が足りなかったのか。…まだ答えが出ない'
      ]
    },
    emotional: {
      _default: [
        '負けた…もう何も考えられない…っ',
        '…悔しい、悔しくて頭がぐちゃぐちゃになる…！'
      ],
      seductive: [
        '負けが続いて……っ……ふふ、自分が分からなくなりそう……'
      ],
      composed: [
        '…っ…あの負けが…まだ、引っかかってる'
      ]
    }
  },
  injury_moderate_recovery: {
    normal: {
      _default: [
        '体は治ったはずなのに…動けない',
        '復帰したのに、何かが噛み合わない'
      ],
      ojousama: [
        '体は治りったのに…動けない……なぜ？'
      ],
      delinquent: [
        '体は治ったはずだろ…なんで動けねーんだ'
      ],
      seductive: [
        '体は治ったはずなのに…ね、動けないの'
      ],
      composed: [
        '…治ったはずなのに。…まあ、焦らないよ'
      ]
    },
    bold: {
      _default: [
        '治ったはずなのに、何でこんなにもたつくのよ！'
      ],
      ojousama: [
        'もう治ったのに…なぜこんなにもたつくの？'
      ],
      delinquent: [
        '治ったっつーのに…何でもたついてんだ'
      ],
      cool: [
        '…体が、鈍い'
      ],
      seductive: [
        '治ったはずなのに…おかしいわね'
      ],
      composed: [
        '…治ったはず、なんだけどね。…もたついてる'
      ]
    },
    quiet: {
      _default: [
        '……体は治った。でも、何か違う'
      ],
      cool: [
        '……鈍い'
      ],
      polite: [
        '体は治ったんですけど…何か、違うんです'
      ],
      composed: [
        '……体は治った。…でも、まだ'
      ]
    },
    shy: {
      _default: [
        '体は治ったのに…また迷惑かけちゃうかも…'
      ],
      polite: [
        'け、怪我が治って…でも、まだ感覚が戻りません…'
      ],
    },
    easygoing: {
      _default: [
        'あれー、治ったはずなのに調子出ないなぁ'
      ],
      delinquent: [
        'あれ、治ったはずなのに調子でねーな'
      ],
      seductive: [
        'あら、治ったはずなのに…調子出ないわ'
      ],
      composed: [
        '…あれ、治ったはずなのに。…まあ、そのうち戻るか'
      ]
    },
    earnest: {
      _default: [
        '復帰できたのに…まだ全然足りない'
      ],
      polite: [
        '復帰できたのですが…まだ全然、足りていません'
      ],
      ojousama: [
        '復帰できましたのに…まだまだ足りませんわ'
      ],
      seductive: [
        '復帰できたのに…まだ足りないの'
      ],
      composed: [
        '…復帰はできた。…でもまだ、足りない'
      ]
    },
    emotional: {
      _default: [
        'せっかく治ったのに…なんで、なんで動けないの…！'
      ],
      seductive: [
        '怪我は治ったけど……っ……ふふ、感覚が戻らないの……'
      ],
      composed: [
        '…っ…治ったのに。…なんで動けないんだ'
      ]
    }
  },
  injury_severe_recovery: {
    normal: {
      _default: [
        'またリングに立てた…のに、怖い',
        '重傷から帰ってきたけど…自信がない'
      ],
      ojousama: [
        'リングに戻れたというのに…怖いわ'
      ],
      delinquent: [
        '戻ってきたのに…ビビってんのかよ、あたし'
      ],
      seductive: [
        '戻ってこれたのに…怖いの'
      ],
      composed: [
        '…戻ってきた。…のに、少し怖いかな'
      ]
    },
    bold: {
      _default: [
        'あたしが…怯えてる？ そんなはずない！'
      ],
      ojousama: [
        'わたくしが…怯える？ そんなはずは'
      ],
      delinquent: [
        'あたしがビビってる？ ふざけんな'
      ],
      cool: [
        '…怯えている。この私が'
      ],
      seductive: [
        '私が…怯えてる？ 嘘でしょう'
      ],
      composed: [
        '…怯えてる？ …まさかね。…まさか'
      ]
    },
    quiet: {
      _default: [
        '……リングが、遠い'
      ],
      cool: [
        '…遠い'
      ],
      polite: [
        'リングに戻れたのですが…遠く感じます'
      ],
      composed: [
        '……リングが、少し遠い'
      ]
    },
    shy: {
      _default: [
        '戻ってこれたけど…また壊れたらって思うと…怖いです'
      ],
      polite: [
        'お、大きな怪我から復帰しました…でも、不安です…'
      ],
    },
    easygoing: {
      _default: [
        'あはは…参ったな、リングがちょっと怖いや'
      ],
      delinquent: [
        'まいったな…リングがちょっと怖ぇーよ'
      ],
      seductive: [
        '参ったわ…リングが少し怖いの'
      ],
      composed: [
        '…参ったな。…リングがちょっと遠く感じる'
      ]
    },
    earnest: {
      _default: [
        '復帰できた…でも体が覚えてる、あの痛みを'
      ],
      polite: [
        '復帰できました…でも体が覚えているんです、あの痛みを'
      ],
      ojousama: [
        '復帰できましたわ…でもお体が覚えていますの、あの痛みを'
      ],
      seductive: [
        '復帰できた…でもね、体が覚えてるの、あの痛みを'
      ],
      composed: [
        '…復帰できた。…でも体は覚えてるね、あの痛みを'
      ]
    },
    emotional: {
      _default: [
        '帰ってこれた…のに…っ、怖くて体が震える…！'
      ],
      seductive: [
        '大怪我から戻ったわ……っ……でも、まだ怖いの……'
      ],
      composed: [
        '…っ…戻ってきた。…けど、体が少し…震える'
      ]
    }
  },
  penalty_end: {
    normal: {
      _default: [
        '怪我は治ったのに…気力が戻らない',
        '体が癒えても、心の傷は残るんだな'
      ],
      ojousama: [
        '怪我は癒えましたのに…気力が戻ないわね'
      ],
      delinquent: [
        '怪我は治ったっつーのに…気力が戻んねー'
      ],
      seductive: [
        '怪我は治ったのに…気力が戻らないの'
      ],
      composed: [
        '…怪我は治った。…でも気力が、まだ'
      ]
    },
    bold: {
      _default: [
        '体は万全なのに…気持ちがついてこない'
      ],
      ojousama: [
        '体は万全ですのに…気持ちがついてきませんわね'
      ],
      delinquent: [
        '体は万全なのに…気持ちがついてこねー'
      ],
      cool: [
        '…気持ちが、ついてこない'
      ],
      seductive: [
        '体は万全なのに…気持ちがついてこないの'
      ],
      composed: [
        '…体は大丈夫。…気持ちだけが、まだ追いつかない'
      ]
    },
    quiet: {
      _default: [
        '……治った。でも、心は'
      ],
      cool: [
        '…心が、まだ'
      ],
      polite: [
        '体は治ったんですけど…心が、まだ'
      ],
      composed: [
        '……体は治った。…心が、まだ'
      ]
    },
    shy: {
      _default: [
        '怪我は治ったんですけど…また怪我したらって思うと…'
      ],
      polite: [
        'け、謹慎が明けました…ま、また頑張ります…'
      ],
    },
    easygoing: {
      _default: [
        '怪我は治ったんだけどなぁ…なんか気分が乗らない'
      ],
      delinquent: [
        '怪我は治ったんだけどな…なんか乗んねーわ'
      ],
      seductive: [
        '怪我は治ったんだけど…なんだか気分が乗らないの'
      ],
      composed: [
        '…治ったんだけどね。…気分が乗らないなぁ'
      ]
    },
    earnest: {
      _default: [
        '怪我は治った。でも離れていた時間が…重い'
      ],
      polite: [
        '怪我は治りました。でも離れていた時間が…重いです'
      ],
      ojousama: [
        'お怪我は癒えましたわ。でも離れていた時間が…重いですの'
      ],
      seductive: [
        '怪我は治ったわ。でもね、離れていた時間が…重いの'
      ],
      composed: [
        '…怪我は治った。でも離れていた時間が…少し重い'
      ]
    },
    emotional: {
      _default: [
        '治ったはずなのに…なんでこんなに不安なの…！'
      ],
      seductive: [
        '謹慎が明けたわ……っ……ふふ、戻ってきたわよ……'
      ],
      composed: [
        '…っ…治ったのに。…この不安は何だろう'
      ]
    }
  }
};

// §4.5 スランプ回復セリフ（personality×archetype）
const SLUMP_END_LINES = {
  normal: {
    _default: [
      'やっと…やっと戻ってこれた',
      'あの暗いトンネルをようやく抜けた'
    ],
    ojousama: [
      'ようやく…戻ってこれましたわ'
    ],
    delinquent: [
      'やっと…やっと戻ってこれたぜ'
    ],
    seductive: [
      'やっと…戻ってこれたわ'
    ],
    cool: [
      '……戻ってきた。この感覚だ'
    ],
    polite: [
      'ようやく…調子が戻ってきた気がします'
    ],
    composed: [
      '…やっと、戻ってこれたかな'
    ]
  },
  bold: {
    _default: [
      '待たせたわね。ここからが本番よ'
    ],
    ojousama: [
      '少し待たせたかしら？ここからよ'
    ],
    delinquent: [
      '待たせたな！ ここからだぜ！'
    ],
    cool: [
      '…戻った。ここからだ'
    ],
    seductive: [
      'お待たせ。ここからが本番よ'
    ],
    polite: [
      '復調しました。もう大丈夫です'
    ],
    composed: [
      '…待たせたね。…ここからだよ'
    ]
  },
  quiet: {
    _default: [
      '……戻ってきた'
    ],
    cool: [
      '……戻った'
    ],
    polite: [
      '…戻ってこれました'
    ],
    seductive: [
      '………戻ってきた…わ'
    ],
    composed: [
      '……戻った、かな'
    ]
  },
  shy: {
    _default: [
      'まだ不安ですけど…頑張りたいです'
    ],
    polite: [
      'やっと…調子が、戻ってきました…'
    ],
  },
  easygoing: {
    _default: [
      'いやー長かった！ でもまた楽しくなってきたよ'
    ],
    delinquent: [
      'いやー長かったな！ でもまた楽しくなってきたぜ'
    ],
    seductive: [
      '長かったわ。でもまた楽しくなってきたの'
    ],
    polite: [
      '調子戻ってきました！ もう大丈夫です！'
    ],
    ojousama: [
      '調子が戻ってまいりましたわ！ もう大丈夫ですの'
    ],
    composed: [
      '…長かったな。…まあ、また楽しくなってきた'
    ]
  },
  earnest: {
    _default: [
      '迷惑かけた分…倍にして返す',
      '待ってくれていたリングに、恩返しする'
    ],
    polite: [
      'ご迷惑をおかけしました…必ず、倍にしてお返しします'
    ],
    ojousama: [
      'ご迷惑をおかけしましたわ…必ずお返しいたします'
    ],
    seductive: [
      '迷惑かけた分…返すわ、倍にしてね'
    ],
    composed: [
      '…待たせた分、返していくよ。…焦らずにね'
    ]
  },
  emotional: {
    _default: [
      'うっ…やっと、やっと抜け出せた…！ もう負けない…！'
    ],
    seductive: [
      '調子が戻ってきたわ……っ……ふふ、ようやくね……'
    ],
    composed: [
      '…っ…やっと…抜け出せた。…もう大丈夫'
    ]
  }
};

// §5.6 モチベ喪失セリフ（personality×archetype）
const MOTIVATION_LOSS_LINES = {
  normal: {
    _default: [
      'もう…何のために闘ってるのかわからない',
      'プロレスが楽しいって感覚、どこへ行った？'
    ],
    ojousama: [
      '何のために…闘っているのかしら、わたし'
    ],
    delinquent: [
      '何のために闘ってんだよ…もうわかんねー'
    ],
    seductive: [
      '何のために闘ってるのかしら…わからなくなったわ'
    ],
    cool: [
      '……何のために戦っているのか、見えなくなった'
    ],
    polite: [
      '最近…何のために戦っているのか、わからなくなってきました'
    ],
    composed: [
      '…何のために闘ってるのか。…わからなくなった'
    ]
  },
  bold: {
    _default: [
      '…燃えない。何をやっても、燃えてこない'
    ],
    ojousama: [
      '…燃えないわね。…何をしても、火がつかないのよ'
    ],
    delinquent: [
      '…燃えねーんだよ。何やっても、火がつかねー'
    ],
    cool: [
      '…燃えない'
    ],
    seductive: [
      '燃えないの…何をしても、火がつかないわ'
    ],
    polite: [
      '正直…目標を見失いかけています'
    ],
    composed: [
      '…燃えない。…こういうこともあるか'
    ]
  },
  quiet: {
    _default: [
      '……闘う理由が、見えない'
    ],
    cool: [
      '……見えない'
    ],
    polite: [
      '…闘う理由が、見えなくなってしまって'
    ],
    seductive: [
      '………何のために…戦ってるの…'
    ],
    composed: [
      '……闘う理由が、見えなくなった'
    ]
  },
  shy: {
    _default: [
      '私がリングに立つ意味…あるんでしょうか…'
    ],
    polite: [
      'な、なんだか…やる気が、出ません…ご、ごめんなさい…'
    ],
  },
  easygoing: {
    _default: [
      'なんだろうね…プロレス楽しいって感覚、どこ行っちゃったんだろ'
    ],
    delinquent: [
      'なんだろうな…楽しいって感覚、どこ行っちまったんだ'
    ],
    seductive: [
      'どうしたのかしら…楽しいって感覚、どこかに行っちゃったわ'
    ],
    polite: [
      '最近ちょっとモチベーションが…でも頑張ります'
    ],
    ojousama: [
      '少しやる気が出ませんの…でも頑張りますわ'
    ],
    composed: [
      '…楽しいって感覚、どこ行ったかな。…困ったね'
    ]
  },
  earnest: {
    _default: [
      '毎日道場に来るのが…こんなに辛いなんて',
      '自分を追い込んでも…何も返ってこない'
    ],
    polite: [
      '毎日道場に来るのが…こんなに辛いとは思いませんでした'
    ],
    ojousama: [
      '毎日お稽古に通うのが…こんなに辛いとは'
    ],
    seductive: [
      '毎日道場に来るのが…こんなに辛いなんてね'
    ],
    composed: [
      '…道場に来ても、何も返ってこない。…そういう時期か'
    ]
  },
  emotional: {
    _default: [
      'やだ…もう嫌…何もしたくない…！',
      '…なんで泣いてるんだろ、あたし…'
    ],
    seductive: [
      '……っ……どうしてかしら、力が湧かないの……'
    ],
    composed: [
      '…っ…もう、いいかな。…何もしたくない'
    ]
  }
};

// §5.6 モチベ喪失回復セリフ（personality×archetype）
const MOTIVATION_RECOVERY_LINES = {
  normal: {
    _default: [
      'まだ…やれる。やってみせる',
      'また闘いたいと思えた。この気持ちを大切に'
    ],
    ojousama: [
      'まだ…やれるわ。やって見せる'
    ],
    delinquent: [
      'まだやれる…やってやるよ'
    ],
    seductive: [
      'まだやれるわ…やってみせる'
    ],
    cool: [
      '……思い出した。戦う理由を'
    ],
    polite: [
      'ようやく…戦う理由を思い出しました'
    ],
    composed: [
      '…まだやれる。…うん、やってみよう'
    ]
  },
  bold: {
    _default: [
      'やっと目が覚めた。ここで終わるわけにはいかない！'
    ],
    ojousama: [
      '目が覚めたわ。ここで終わるわけにはかないもの'
    ],
    delinquent: [
      '目ぇ覚めたぜ。ここで終わるかよ'
    ],
    cool: [
      '…目が覚めた。まだ終わらない'
    ],
    seductive: [
      '目が覚めたわ。ここで終わるなんて、つまらないもの'
    ],
    polite: [
      '目標が見えてきました。もう迷いません'
    ],
    composed: [
      '…目が覚めた。…ここで終わるのは、つまらないね'
    ]
  },
  quiet: {
    _default: [
      '……もう一度、闘える'
    ],
    cool: [
      '…闘える'
    ],
    polite: [
      '…もう一度、闘えそうです'
    ],
    seductive: [
      '………思い出した…わ。戦う理由'
    ],
    composed: [
      '……もう一度、やれそうだ'
    ]
  },
  shy: {
    _default: [
      'まだ自信はないですけど…もう少しだけ、頑張ってみます'
    ],
    polite: [
      'あ、あの…また、頑張ろうって思えてきました…'
    ],
  },
  easygoing: {
    _default: [
      'よーし、またやる気出てきたぞ！ 楽しまなきゃね'
    ],
    delinquent: [
      'おっし、やる気出てきたぜ！ 楽しまねーとな'
    ],
    seductive: [
      'あら、やる気が戻ってきたわ。楽しまなくちゃね'
    ],
    polite: [
      'やる気出てきました！ もう大丈夫です！'
    ],
    ojousama: [
      'やる気が戻ってまいりましたわ！ もう大丈夫ですの'
    ],
    composed: [
      '…やる気、戻ってきたかな。…楽しまないとね'
    ]
  },
  earnest: {
    _default: [
      '闘うことを忘れていた…でも、もう迷わない'
    ],
    polite: [
      '闘う気持ちを忘れていました…でも、もう迷いません'
    ],
    ojousama: [
      '闘う心を忘れていましたわ…でも、もう迷いませんの'
    ],
    seductive: [
      '闘う気持ちを忘れてたわ…でもね、もう迷わない'
    ],
    composed: [
      '…闘う理由、思い出した。…もう迷わないよ'
    ]
  },
  emotional: {
    _default: [
      'うっ…また闘いたいって…思えたよ…！ 大丈夫、もう大丈夫…！'
    ],
    seductive: [
      '……っ……ふふ、また燃えてきたの……'
    ],
    composed: [
      '…っ…また闘いたい。…大丈夫、もう大丈夫だ'
    ]
  }
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
    '◆ {name}がSNSで{name2}の試合について触れていた。ファンが反応',
    '◆ {name}の本業での活躍ぶりも話題に。「文武両道」とファンが称賛',
    '◆ {name}のSNSに{name2}がコメント。ファンの間で話題に',
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
  juniorTournament: [
    '◆ 🏆 ジュニアトーナメント優勝は{name}（{orgName}）！ 若き才能が頂点に立った',
    '◆ 🏆 {name}がジュニアトーナメントを制覇。{orgName}の未来を担うエースの誕生だ',
    '◆ 🏆 U-20の頂点に{name}（{orgName}）。鮮烈な勝利で全団体を沸かせた',
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

// ══════════════════════════════════════════════════════════
//  U-20 ジュニアトーナメント セリフ定数
//  personality × archetype テンプレート方式
//  タイミング: summon(召集), preMatch(試合前), postMatchWin(勝者), preFinal(決勝前), champion(優勝)
// ══════════════════════════════════════════════════════════
const JUNIOR_TOURNAMENT_LINES = {
  summon: {
    normal: {
      _default: ['選ばれたからには、全力で戦う', 'この舞台に立てることを誇りに思う'],
      ojousama: ['選出されましたわ。しっかりやりますわよ', 'この大会で、私の実力を知らしめましょうか'],
      delinquent: ['おう、出てやるよ。覚悟しとけ', '全員まとめてかかって来いってんだ'],
      seductive: ['出場が決まったわ。見ていてね', '素敵な舞台ね。魅せてあげるわ'],
      cool: ['……出る。それだけだ', '……勝つだけだ'],
      composed: ['…出るよ。…やるだけだね', '…なるほど。じゃあ、行こうか'],
    },
    bold: {
      _default: ['当然。呼ばれなかったら怒ってたわ', 'ふん、やっと正当な評価をしてくれたわけね'],
      ojousama: ['私の選出は、当然ね', '選ばれた以上、出場いたしますわ'],
      delinquent: ['あァ？ まあいいけど。暴れる場所が増えるだけだ', 'うっせーな、勝手に呼びやがって。……まあ出るけど'],
      seductive: ['あら、指名してくれたの？ 嬉しいわ', 'わたしの舞台が増えるのね。楽しみ'],
      cool: ['……そう。わかった', '選ばれた以上、やることは一つ'],
      composed: ['…選ばれたか。…まあ、当然だろうね'],
    },
    earnest: {
      _default: ['精一杯、やらせていただきます…！', '選ばれたからには…絶対に恥ずかしくない試合を'],
      polite: ['身に余る光栄です。一生懸命頑張ります', 'お声がけいただき感謝いたします。精一杯務めます'],
      composed: ['…選んでもらえたなら、応えないとね'],
    },
    easygoing: {
      _default: ['お、選ばれちゃった。ラッキー', 'へー、いいじゃん。楽しそう'],
      ojousama: ['あら、わたくしも呼ばれましたの？ 面白そうですわね', 'わたくしが選ばれないわけがありませんわよね'],
      delinquent: ['マジ？ ウケる。まあ出てやるよ', 'ま、暴れる場所があるなら出るっしょ'],
      seductive: ['あら〜、ラッキー。いい舞台じゃない', '注目を集められるなら、いいわね'],
      cool: ['ふーん。まあ、いいか', '……出るよ'],
      composed: ['…ふぅん。いい舞台だね'],
    },
    quiet: {
      _default: ['……わかった', '……出る'],
      cool: ['……', '……（静かに頷く）'],
      composed: ['……了解'],
    },
    shy: {
      _default: ['え、私が…？ …頑張らなきゃ', 'う、嘘…？ わ、私でいいんですか…？'],
      cool: ['…え。……わかった', '……うん。……出る'],
      polite: [
        'え、わたしが…ジュニアトーナメントに…？ あ、あの、頑張ります…!',
        '選んでいただいて…あ、ありがとうございます…'
      ],
    },
    emotional: {
      _default: ['やった…！ 選ばれた…！ 絶対頑張る…！', 'この気持ち…抑えきれない…！ 全力で行くから…！'],
      ojousama: ['まあ…！ わたくし、選ばれましたの…？ 嬉しいですわ…！', 'この胸の高鳴り…全てリングにぶつけますわ…！'],
      delinquent: ['っしゃあ！ やってやるぜ…！ 燃えてきた…！', 'うおおお…！ 全員ぶっ飛ばしてやるからな…！'],
      cool: ['……っ。…行く', '……胸が…熱い。……やる'],
      seductive: [
        'ジュニア大会に……っ……ふふ、わたしを選んでくれたのね、嬉しい……',
        '楽しみだわ……っ……ふふ、燃えてきたの……'
      ],
      composed: ['…選ばれたか。…やるよ'],
    },
  },
  preMatch: {
    normal: {
      _default: ['相手がどうとかじゃない。自分の試合をする', '集中。一つずつ勝っていく'],
      ojousama: ['お相手がどなたであれ、全力を尽くします', 'わたくしの試合を、ご覧に入れます'],
      delinquent: ['ぶっ潰す。それだけだ', '相手とか関係ねえ。全力で行くだけだ'],
      seductive: ['次の相手…楽しみね', 'わたしの魅力、見せつけてあげる'],
      cool: ['……集中する', '……行く'],
      composed: ['…いつも通りやるよ', '…集中。…行こうか'],
    },
    bold: {
      _default: ['目の前の相手を叩き潰す。それだけよ', '勝つのは私。最初から決まってることよ'],
      ojousama: ['勝つのは私。それ以外のありえないでしょう？', '格の違いを教えてあげる'],
      delinquent: ['邪魔するヤツは全員ぶっ倒す', 'かかって来いよ。一発で沈めてやる'],
      seductive: ['あら、可愛い相手ね。すぐ終わらせてあげるわ', 'わたしに勝てるつもり？ 甘いわね'],
      cool: ['……潰す', '……結果で語る'],
      composed: ['…勝つよ。…それだけ'],
    },
    earnest: {
      _default: ['どんな相手でも、やることは変わりません', '一戦一戦を大切に…全力で行きます'],
      polite: ['精一杯の試合を、お見せいたします', 'ひとつひとつ丁寧に…全力で参ります'],
      composed: ['…一つずつ。…やることは変わらない'],
    },
    easygoing: {
      _default: ['楽しんでいこう♪もちろん勝つつもりでね', 'よーし、いっちょやりますか'],
      ojousama: ['さあ、楽しい時間の始まりですわ', '気楽に参りましょう。でも負けませんわよ'],
      delinquent: ['よーし、パパッとやっちまうか', '気楽にいこうぜ。でも手は抜かねえけど'],
      seductive: ['さてと、楽しませてもらうわね', 'リラックス、リラックス。……でも本気よ'],
      cool: ['……ま、やるか', '……適当に…いや、ちゃんとやる'],
      composed: ['…ま、楽しんでいこうか'],
    },
    quiet: {
      _default: ['……やる', '……'],
      cool: ['………', '……（拳を握る）'],
      composed: ['……行くよ'],
    },
    shy: {
      _default: ['緊張する…でも、逃げない', 'が、頑張ります…！'],
      cool: ['……大丈夫。……やれる', '……逃げない'],
      polite: [
        'き、緊張します…でも、精一杯やります…',
        'ふ、深呼吸…落ち着かないと…'
      ],
    },
    emotional: {
      _default: ['ドキドキが止まらない…！ でも…負けたくない…！', 'この熱い気持ちのまま…ぶつかる…！'],
      ojousama: ['この高鳴りを…お相手にぶつけますわ…！', '身体が…震えてますわ…でも、退きませんわよ…！'],
      delinquent: ['っしゃあ…！ 燃えてきたぜ…！', 'ぶっ飛ばす…絶対ぶっ飛ばしてやる…！'],
      cool: ['……っ。……行く', '……（静かに息を吐く）'],
      seductive: [
        '試合前……っ……ふふ、心臓がドキドキしてるの……',
        '楽しんでくるわね……っ……ふふ……'
      ],
      composed: ['…行くよ。…負けない'],
    },
  },
  postMatchWin: {
    normal: {
      _default: ['一つクリア。次に集中する', '勝った。でも気を抜かない'],
      ojousama: ['ひとつ勝ちました。でも油断は禁物ね', '次もこの調子で参ります'],
      delinquent: ['おっし、一丁上がりだ。次もブチかます', 'まだまだ止まんねえぞ'],
      seductive: ['ふふ、まずは一勝ね。次も魅せてあげるわ', '勝てたわ。……でもまだ先がある'],
      cool: ['……一勝。次', '……まだだ'],
      composed: ['…一つ勝ち。…次もこの調子で'],
    },
    bold: {
      _default: ['当然の結果よ。次も同じ', 'ふん。この程度じゃ止まらないわよ'],
      ojousama: ['当然の結果ね', 'この程度のことで驚いていては、私については来れなくてよ？'],
      delinquent: ['はっ、楽勝だぜ。次も同じだ', '止められるもんなら止めてみろ'],
      seductive: ['あら、もう終わり？ 物足りないわね', 'ふふ、予定通りよ。次の相手が楽しみ'],
      cool: ['……当然だ', '……次'],
      composed: ['…当然だね。…次も同じ'],
    },
    earnest: {
      _default: ['勝てた…！ でもまだ終わりじゃない', '一歩ずつ…次も全力で'],
      polite: ['勝たせていただきました…。次も全力で臨みます', '一戦一戦、大切に。次もよろしくお願いいたします'],
      composed: ['…勝てた。…次もやるだけ'],
    },
    easygoing: {
      _default: ['よっし、勝った！ 次もこの調子で', 'いい感じいい感じ〜'],
      ojousama: ['やりましたわ。この調子で行きますわよ', 'まだまだ楽しめそうですわね'],
      delinquent: ['いえーい！ 楽勝楽勝〜', 'ノリノリだぜ！ 次も行くぞ〜'],
      seductive: ['あら、勝っちゃった。ラッキー', 'いい感じ。次も楽しみましょう'],
      cool: ['……ふ。まあまあ', '……次も、こんな感じで'],
      composed: ['勝ったね。…この調子で行こうか'],
    },
    quiet: {
      _default: ['……次', '……勝った'],
      cool: ['……（静かに頷く）', '……まだ'],
      composed: ['……次'],
    },
    shy: {
      _default: ['か、勝てた…よかった…', 'まだ…終わりじゃないんだ…頑張る'],
      cool: ['……勝てた。……次も', '……よかった。……まだ続く'],
      polite: [
        'か、勝てました…次もがんばります…',
        '一勝、できました…'
      ],
    },
    emotional: {
      _default: ['勝った…！ 嬉しい…！ でもまだ泣かない…！', 'この気持ちのまま…次も…！ 絶対負けない…！'],
      ojousama: ['勝ちましたわ…！ この感動…次もきっと…！', 'まだ終わりませんわ…この熱い気持ち、止まりませんの…！'],
      delinquent: ['っしゃあああ！ まだまだいくぞおおお！', '止まんねえ…この勢い、止まんねえぞ…！'],
      cool: ['……っ。勝った……', '……次も……同じように'],
      seductive: [
        '勝った……っ……ふふ、まだまだ行けるわ……',
        'いい感じよ……っ……ふふ……'
      ],
      composed: ['…一つ勝った。…まだ先がある'],
    },
  },
  preFinal: {
    normal: {
      _default: ['あと一つ。勝てば優勝。それだけ考える', '決勝。全てを懸ける'],
      ojousama: ['決勝。全てを出し切ります', 'ここまで来ましたのだから。最後まで、私らしく'],
      delinquent: ['決勝だぜ。最後もぶっ潰してやる', 'ここまで来たんだ。もう引けねえ'],
      seductive: ['決勝…。最後の舞台、最高に魅せてあげるわ', 'あと一つ。全てを懸けるわ'],
      cool: ['……決勝。全て出す', '……最後の一戦'],
      composed: ['…決勝か。…全部出し切るよ'],
    },
    bold: {
      _default: ['ここまで来て負けるわけないでしょ。最後も私が獲る', 'さあ、最後の獲物ね。楽しませてもらうわ'],
      ojousama: ['決勝は当然の舞台。このまま優勝もいただきましょう', 'こいつが最後の獲物ね。覚悟は出来てるかしら'],
      delinquent: ['ここまで来たからにゃ、テッペン獲るに決まってんだろ', '最後の相手か。ぶっ壊してやるよ'],
      seductive: ['あら、最後のお相手ね。たっぷり楽しませてあげるわ', '優勝はわたしのもの。決まっていることよ'],
      cool: ['……最後。獲る', '……ここまで来た以上、負ける理由がない'],
      composed: ['…最後の一戦。…獲りにいくよ'],
    },
    earnest: {
      _default: ['この舞台に立てることが…嬉しい。だから全部出し切ります', '決勝…夢みたいです。でも、勝ちたい…！'],
      polite: ['決勝の舞台…身に余る光栄です。全力でお応えいたします', 'この一戦に、全てをお捧げいたします'],
      composed: ['…決勝か。…全部出します'],
    },
    easygoing: {
      _default: ['決勝かー。ま、ここまで来たらやるしかないっしょ', '最後の一戦！ 楽しむよ〜'],
      ojousama: ['あら、決勝まで来ちゃいましたわ。楽しみですわね', '最後の一戦！ 思いっきりやりますわよ'],
      delinquent: ['うっひょ〜決勝じゃん！ やるっきゃねえ！', '最後だし、全力で暴れるぜ！'],
      seductive: ['決勝かあ。最高の舞台じゃない', 'あと一つ。楽しんでいきましょう'],
      cool: ['……決勝か。……やるよ', '……ま、最後くらい本気で'],
      composed: ['決勝か。…ま、ここまで来たらやるだけだね'],
    },
    quiet: {
      _default: ['……最後の一試合', '……全部、出す'],
      cool: ['……最後', '……全部、出す'],
      composed: ['……最後。…行くよ'],
    },
    shy: {
      _default: ['震えてるのは…きっと、嬉しいからだと思う', 'ここまで来れたのが信じられない…でも、負けたくない'],
      cool: ['……ここまで来た。……負けない', '……最後の一戦。……全部出す'],
      polite: [
        'け、決勝戦…ですか…し、信じられません…',
        '夢みたい、です…'
      ],
    },
    emotional: {
      _default: ['決勝…！ 信じられない…でも…勝ちたい…！', 'ここまで来たんだ…泣くのは全部終わってから…！'],
      ojousama: ['決勝ですわ…！ この胸の高鳴り…最高ですわ…！', '全てを懸けますわ…！ 負けませんの…！'],
      delinquent: ['決勝だ…！ ここまで来たんだ…！ 絶対テッペン獲る…！', 'もう止まれねえ…！ 全力でぶつかってやる…！'],
      cool: ['……っ。決勝……', '……ここまで来た。……負けるわけにはいかない'],
      seductive: [
        '決勝戦……っ……ふふ、ここまで来たのね……',
        '最高の舞台ね……っ……ふふ、震えてるの……'
      ],
      composed: ['…決勝か。…ここまで来た以上、負けない'],
    },
  },
  champion: {
    normal: {
      _default: ['この優勝を、次のステップにする', '優勝。嬉しい。でも、これで終わりじゃない'],
      ojousama: ['優勝。応援してくださった皆様のおかげです', 'この優勝を糧に、さらに上を目指します'],
      delinquent: ['テッペン獲ったぜ！ でもまだ上がある', '優勝…悪くねえな。もっと強くなってやる'],
      seductive: ['優勝。…最高の気分ね', 'ふふ、これで終わりじゃないわよ'],
      cool: ['……優勝。……次のステージへ', '……ありがとう'],
      composed: ['…優勝か。…悪くないね。…次も行こう'],
    },
    bold: {
      _default: ['言ったでしょ？ 私が最強だって', 'はい優勝。当然の結果ね'],
      ojousama: ['優勝はわたくしのもの。当然の結果ですわね', 'これがわたくしの実力。誰もかれもわかったかしら？'],
      delinquent: ['言ったろ？ テッペンは俺のもんだってな', 'はっ、当然の結果だぜ。誰にも負けねえ'],
      seductive: ['あら、優勝しちゃったわ。当然だけどね', 'わたしが一番。それが証明されたわね'],
      cool: ['……勝った。それだけだ', '……当然の結果'],
      composed: ['…優勝。…まあ、当然かな'],
    },
    earnest: {
      _default: ['支えてくれたみんなのおかげです…！', '優勝…できた…。ありがとうございます…！'],
      polite: ['優勝…させていただきました。皆様のおかげです…！', 'この経験を糧に、さらに精進して参ります'],
      composed: ['…優勝できました。…みんなのおかげです'],
    },
    easygoing: {
      _default: ['いやー、ほんとに勝っちゃった。最高！', 'うっひょー！ 優勝！ 信じられない！'],
      ojousama: ['まあ、優勝ですの！ 最高ですわ〜！', 'やりましたわ〜！ ご褒美が楽しみですわね'],
      delinquent: ['いえ〜い！ 優勝〜！ 最高じゃん！', 'ひゃっほ〜！ やったぜ〜！'],
      seductive: ['あらあら、優勝しちゃったわ。素敵', 'ふふ、最高の気分。ご褒美ちょうだいね'],
      cool: ['……へえ。優勝か', '……悪くない'],
      composed: ['優勝しちゃったね。…ふぅん、悪くない'],
    },
    quiet: {
      _default: ['……勝った', '………………ありがとう'],
      cool: ['……（トロフィーを静かに掲げる）', '…………ありがとう'],
      composed: ['……優勝。…ありがとう'],
    },
    shy: {
      _default: ['信じられない…。でも…嬉しい…！', 'わ、わたしが優勝…？ 夢じゃないよね…'],
      cool: ['……勝った。……嬉しい', '……わたしが…優勝……'],
      polite: [
        'ゆ、優勝…ですか…？ ほ、本当に…？ あ、ありがとうございます…!',
        '夢みたいで…まだ、信じられません…'
      ],
    },
    emotional: {
      _default: ['優勝…っ！ うそ…本当に…？ 嬉しい…！', 'もう…涙が止まらない…！ ありがとう…みんな…！'],
      ojousama: ['優勝ですわ…！ ああ…涙が…止まりませんわ…！', 'わたくし…やりましたわ…！ 最高に幸せですわ…！'],
      delinquent: ['うおおおお！ やったぞおおお！ テッペンだあ！', 'くっ…泣くかよ…こんなとこで…っ！ …最高だぜ…！'],
      cool: ['……っ。（目が潤む）……勝った', '……ありがとう。……本当に'],
      seductive: [
        '優勝……っ……ふふ、わたし、頂点に立ったのね……!',
        'この景色……っ……ふふ、忘れないわ……'
      ],
      composed: ['…っ…優勝か。…ありがとう'],
    },
  },
  // 大会後の感想（結果別: postWin=勝ち越し/postLose=初戦敗退/postMid=途中敗退）
  postWin: {
    normal: {
      _default: ['いい経験になった。もっと強くなりたい', '大会を通して、自分の成長を感じられた'],
      ojousama: ['収穫の多い大会でしたわ。次はもっと上を目指します', '実りある大会でした'],
      delinquent: ['まあまあやれたな。次はもっと暴れてやるぜ', '悪くねえ結果だ'],
      seductive: ['いい経験だったわ。もっと魅せられるようになりたいわね', 'まだまだこんなものじゃないわよ'],
      cool: ['……悪くなかった', '……収穫はあった'],
      composed: ['…悪くなかったね。…いい経験になった'],
    },
    bold: {
      _default: ['当然の結果ね。次は優勝よ', 'この程度で満足するわけないでしょ'],
      ojousama: ['私がこの程度で喜ぶとでも？…次こそ頂点を取りますわ', 'わたくしなら、この程度当然よ'],
      delinquent: ['ちっ、まだ足りねえ。次は全員ぶっ倒す', 'まだ上がいるってのがムカつくぜ'],
      seductive: ['まだ足りないわね。もっと上に行くわ', 'いい舞台だったわ。でも、わたしはもっと上を目指す'],
      cool: ['……まだ上がある', '……次は負けない'],
      composed: ['…まだ上がある。…次は獲る'],
    },
    earnest: {
      _default: ['精一杯やれました…！ この経験を活かしたい', '悔いのない大会でした。支えてくれた皆さんに感謝です'],
      polite: ['良い経験をさせていただきました。精進して参ります', '皆様のおかげで戦い抜けました。感謝いたします'],
      composed: ['…いい経験になりました。…次に活かします'],
    },
    easygoing: {
      _default: ['いやー楽しかった！ またやりたいなあ', 'いい試合できたし、満足満足'],
      delinquent: ['楽しかったぜ〜。またやりてえな', 'まあまあ良かったんじゃね？'],
      seductive: ['楽しい大会だったわ〜', 'いい経験になったわね'],
      cool: ['……楽しかった', '……うん、良かった'],
      composed: ['楽しかったね。…また出たいな'],
    },
    quiet: {
      _default: ['……良い経験だった', '………………（満足げに頷く）'],
      cool: ['……', '……（少し笑顔を見せる）'],
      composed: ['……悪くなかった'],
    },
    shy: {
      _default: ['が、頑張れた…かな。もっと強くなりたい…', 'みんなと戦えて…嬉しかった…'],
      cool: ['……頑張れた…と思う', '……嬉しかった'],
      polite: [
        'か、勝ち上がれました…信じられません…',
        'まだ…続けられるんですね…'
      ],
    },
    emotional: {
      _default: ['最高の大会だった…！ この経験、絶対忘れない…！', '戦えてよかった…！ もっともっと強くなる…！'],
      delinquent: ['くっそ〜、最高だったぜ…！ また出てえ…！', 'この熱い気持ち…忘れねえ…！'],
      cool: ['……良い大会だった', '……（静かに感動をかみしめる）'],
      seductive: [
        '勝ち上がったわ……っ……ふふ、ここまで来られたの……',
        'もっと上を目指すわ……っ……ふふ……'
      ],
      composed: ['…いい大会だった。…忘れないよ'],
    },
  },
  postLose: {
    normal: {
      _default: ['悔しい…。でも、次に繋げる', '力不足を痛感した。もっと強くならないと'],
      ojousama: ['不甲斐ない結果でした。もっと精進いたします', '悔しい…。もっと練習しなくては…'],
      delinquent: ['くそっ…次は絶対負けねえ', 'こんなとこで終わってたまるか…'],
      seductive: ['あら、残念ね。でも次があるわ', '悔しいけど…いい経験だったわ'],
      cool: ['……まだ足りない', '……次は負けない'],
      composed: ['…まだ足りないか。…次までに詰めよう'],
    },
    bold: {
      _default: ['こんなはずじゃ…！ 次は絶対に見返す！', '認めない。次は絶対に勝つ'],
      ojousama: ['こ、こんな結果…ありえないっ…！', 'わたくしともあろうものが…屈辱ですわ'],
      delinquent: ['ふざけんな…！ 次は絶対ぶっ潰す！', 'こんなん認めねえ…！'],
      seductive: ['…悔しいわ。でも、わたしはここで終わらない', '次は必ず勝つわ'],
      cool: ['……屈辱だ', '……次は負けない'],
      composed: ['…悔しいね。…でも、次は違う'],
    },
    earnest: {
      _default: ['申し訳ないです…。もっと頑張ります…', '悔しい…けど、この悔しさを忘れない'],
      polite: ['力不足で申し訳ございません…。もっと精進します', '悔しゅうございます…。必ず強くなります'],
      composed: ['…力不足でした。…次は必ず'],
    },
    easygoing: {
      _default: ['あちゃー、負けちゃった。まあ次がんばろ', 'ま、しょうがないっしょ。次は勝つよ'],
      delinquent: ['マジかー、負けたわ。ま、次があるし', 'しゃーねえな。次だ次'],
      seductive: ['あらら、残念。でもまた来年があるわ', 'ま、こういう日もあるわよね'],
      cool: ['……ま、いいか', '……次がある'],
      composed: ['負けたか。…ま、次があるさ'],
    },
    quiet: {
      _default: ['………………（悔しそうに拳を握る）', '……次は、負けない'],
      cool: ['……（無言で去る）', '……'],
      composed: ['……次は、負けない'],
    },
    shy: {
      _default: ['ご、ごめんなさい…。もっと頑張らないと…', 'やっぱり…わたしなんか…。でも…諦めない…'],
      cool: ['……すみません…', '……もっと、頑張る…'],
      polite: [
        'ま、負けてしまいました…ごめんなさい…',
        'もっと…強くならないと…'
      ],
    },
    emotional: {
      _default: ['くっ…悔しい…！ でも…絶対に次は…！', '負けた…。でも…この悔しさが…力になる…！'],
      delinquent: ['くそおおお…！ 絶対に…次は…！', 'ちくしょう…！ こんなんで終わるかよ…！'],
      cool: ['……悔しい', '……（涙をこらえている）'],
      seductive: [
        '負けたわ……っ……悔しい……でも、いい経験だった……',
        'リベンジするわ……っ……ふふ、必ず……'
      ],
      composed: ['…っ…悔しい。…でも、次がある'],
    },
  },
};

/** personality×archetypeでジュニアトーナメントセリフを取得 */
function getJuniorTournamentLine(timing, personality, archetype, rng) {
  const timingData = JUNIOR_TOURNAMENT_LINES[timing];
  if (!timingData) return '';
  const pData = timingData[personality] || timingData.normal;
  if (!pData) return '';
  const lines = pData[archetype] || pData._default || [];
  if (lines.length === 0) return '';
  if (rng) return lines[Engine.rng.int(rng, 0, lines.length - 1)];
  return lines[Math.floor(Math.random() * lines.length)];
}

// §6.2 新聞パネル用テンプレート（イベント種別ごとに headline + body ペア、各3+パターン）
const NEWS_HEADLINE_TEMPLATES = {
  challengeRequestWin: [
    { headline: '{requesterName}の直訴が実った！{ourOrg}が{opponentOrg}を {score} で下す',
      body: '{requesterName}が直訴して実現した{opponentOrg}との3対3団体戦。{ourOrg}は{opponentName}陣を {score} で下し、リング上で握手を交わすことなく解散した。' },
    { headline: '果たし状成就――{requesterName}主導の挑戦試合、{ourOrg}が制す',
      body: '「あの相手と試合させてください」の一言から始まった越境カード。蓋を開けてみれば{ourOrg}が {score} で押し切り、{requesterName}は「これで一区切りつく」と短く語った。' },
    { headline: '{ourOrg} {score} {opponentOrg}――{requesterName}の意地が呼んだ越境戦',
      body: '{requesterName}が{opponentName}に挑むかたちで実現した3対3。{ourOrg}が {score} で星を取り、終わったあと{requesterName}は控室で長く息を吐いていたという。' },
  ],
  challengeRequestLose: [
    { headline: '直訴及ばず――{requesterName}の挑戦試合、{ourOrg} {score} {opponentOrg}',
      body: '{requesterName}が直接願い出て組まれた{opponentOrg}との3対3団体戦は、{score}で{ourOrg}が敗れた。「自分から呼んだ試合で取れなかった」――{requesterName}は控室を最後まで動かなかった。' },
    { headline: '{opponentName}陣に屈す。{requesterName}の果たし状は{score}で散る',
      body: '{requesterName}の発信で実現したカードだったが、{opponentOrg}の地力が一枚上だった。{score}という数字以上に、リング外の表情に重さが残った試合だった。' },
    { headline: '直訴の代償――{ourOrg}、{opponentOrg}に {score} で敗北',
      body: '{requesterName}が頭を下げて呼んだ越境戦で、{ourOrg}は {score} で星を落とした。「呼んだ責任は自分にある」と{requesterName}。次にこの相手と当たる時、何かが変わっているか。' },
  ],
  challengeRequestInverseDefend: [
    { headline: '{opponentOrg}の{requesterName}を退ける――{ourOrg} {score} で迎撃成功',
      body: '{opponentOrg}の{requesterName}が{ourOrg}に直訴して実現した3対3団体戦。{ourOrg}は古巣に挑んできた{requesterName}陣を {score} で退け、リング上の決着を貫いた。' },
    { headline: '果たし状、跳ね返す。{ourOrg}が{requesterName}陣を {score} で下す',
      body: '{requesterName}が向こうの団体から仕掛けてきた挑戦試合。{ourOrg}は3対3で {score} の星を取り、相手にリングを譲らなかった。' },
    { headline: '{requesterName}の越境挑戦、{ourOrg}に阻まれる――{score}',
      body: '{opponentOrg}の{requesterName}が{ourOrg}を名指しして組まれた団体戦は {score} で{ourOrg}が勝利。「呼ばれた以上、応える」――{ourOrg}陣営の意地が勝った形だ。' },
  ],
  challengeRequestInverseFall: [
    { headline: '{opponentOrg}の{requesterName}陣に屈す――{ourOrg} {score}',
      body: '{requesterName}の越境直訴で組まれた3対3団体戦は {score} で{ourOrg}の敗北。古巣に持ち帰る形となった{requesterName}は、控室で長く目を閉じていたという。' },
    { headline: '直訴した側に星――{ourOrg}、{requesterName}陣に {score} で敗北',
      body: '{opponentOrg}から仕掛けられた挑戦試合で{ourOrg}は {score} の星を落とした。受けて立った{ourOrg}陣営は、リングを去る背中に何かを語らせなかった。' },
    { headline: '{requesterName}、古巣に星を返す。{ourOrg} {score} {opponentOrg}',
      body: '{requesterName}の挑戦を受けた{ourOrg}は {score} で敗れた。「呼んできた側に取られた」――この結果が向こうのリングでどう扱われるか、注視せざるを得ない。' },
  ],
  challengeRequestInverseDraw: [
    { headline: '直訴の3対3、{score} で痛み分け。{requesterName}と{ourOrg}は再び沈黙',
      body: '{opponentOrg}の{requesterName}が{ourOrg}に挑んで組まれた団体戦は {score} のドロー。決着がつかないまま、両陣営はリングを降りた。' },
    { headline: '{ourOrg} {score} {opponentOrg}――{requesterName}の越境挑戦は決着持ち越し',
      body: '3対3団体戦は {score} で痛み分け。仕掛けた{requesterName}も、迎え撃った{ourOrg}も、リング上で言葉を交わすことなく分かれた。' },
  ],
  firedReturn: [
    { headline: 'あの解雇から{weeksSinceFired}週――{name}、古巣に挑む',
      body: '{ourOrg}を解雇された{name}が、{toOrg}の選手として古巣に対峙した。リング上での目つきには、あの日とは違う何かが宿っていた。' },
    { headline: '{name}、{toOrg}での再起――{weeksSinceFired}週ぶりに{ourOrg}と相見えた',
      body: '解雇から{weeksSinceFired}週、{toOrg}に拾われた{name}が初めて{ourOrg}とリングで交差した。「捨てられた側の意地、見せたい」――関係者は短く語った。' },
    { headline: '解雇{weeksSinceFired}週目の挑戦――{name}、{ourOrg}に何を持ち込むか',
      body: '{name}が{toOrg}の選手として{ourOrg}に挑む日が来た。試合前、控室で長く動かなかったという。リング上で何が解放されるのか、注視せざるを得ない一戦となった。' },
    { headline: '{name}、古巣への一矢――解雇{weeksSinceFired}週で迎えた邂逅',
      body: '{ourOrg}に切られた{name}が、{toOrg}の旗を背負って戻ってきた。あの日リングを降りた後の{weeksSinceFired}週が、この一戦に集約される。' },
    { headline: '別団体・別カラー――{name}が{ourOrg}と再会した夜',
      body: '解雇から{weeksSinceFired}週、{toOrg}でのキャリアを歩み始めた{name}と{ourOrg}が再びリングで交わった。決着の形は人によって違うが、この夜の意味だけは誰もが理解していた。' },
  ],
  challengeRequestDraw: [
    { headline: '直訴の3対3、{score} で痛み分け。{requesterName}と{opponentName}は再び沈黙',
      body: '{requesterName}が直訴して実現した{opponentOrg}との団体戦は {score} のドロー。決着がつかないまま、両陣営はリングを降りた。' },
    { headline: '{ourOrg} {score} {opponentOrg}――{requesterName}の挑戦は決着持ち越し',
      body: '3対3団体戦は {score} で痛み分け。直訴した{requesterName}も、受けて立った{opponentName}も、リング上で言葉を交わすことなく分かれた。' },
  ],
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
  contractBetrayalChampCarry: [
    { headline: '衝撃の裏切り――{name}がベルトを抱えて{toOrg}へ',
      body: '{fromOrg}の{name}が契約を蹴って{toOrg}へ電撃移籍。世界王座まで持ち去られる前代未聞の事態に、ロッカールームには重い沈黙が流れた。「ベルトは私と一緒に動く」――その一言が業界に走った。' },
    { headline: '王座を抱えての離脱――{name}、{toOrg}入り',
      body: '{fromOrg}が抱える看板タイトルを保持したまま、{name}が{toOrg}への移籍を決断。残された選手たちは「あれが仲間だったとは思いたくない」と肩を落とす。奪還の挑戦状なくして決着はつかない。' },
  ],
  contractBetrayalChampLeave: [
    { headline: '{name}が{toOrg}へ――ベルトは置いて去った',
      body: '{fromOrg}との契約交渉が決裂し、{name}が{toOrg}へ去った。世界王座は返上、空位に。「私が持つベルトじゃない」と最後の会見で語った姿に、複雑な思いを抱くファンも少なくない。' },
    { headline: '王座返上――{name}、{toOrg}へ移籍',
      body: '世界王座を保持していた{name}が{toOrg}への移籍を表明。ベルトはリング中央に置かれたまま空位となった。{fromOrg}は早急に王座決定戦の準備に入る。' },
  ],
  contractBetrayalRivalOrg: [
    { headline: '因縁の相手へ――{name}、{toOrg}に移籍',
      body: '{fromOrg}を離れた{name}が、よりによって因縁の{toOrg}へ。「これは裏切りだ」とロッカールームから怒号が漏れた。次にリングで顔を合わせる時、その視線がどう変わっているのか――。' },
    { headline: '禁断の移籍――{name}が{toOrg}入り',
      body: '幾度も激戦を繰り広げてきた{toOrg}に、{fromOrg}の{name}が加入。残された仲間の表情には怒りと困惑が混じる。次の対抗戦は感情の渦になることが避けられない。' },
  ],
  contractBetrayalAce: [
    { headline: 'エース流出――{name}が{toOrg}へ',
      body: '{fromOrg}の屋台骨を支えた{name}が{toOrg}への移籍を決断。看板選手の喪失に、団体の前途には暗雲が垂れ込める。「私が抜けてもこの団体は強い」と本人。残された選手たちは奮起できるか。' },
    { headline: '看板選手の離脱――{name}、{toOrg}入り',
      body: 'OVR上位常連の{name}が{fromOrg}を離れて{toOrg}へ。チームの戦力構成は大きく変わる。ファンからは「次のエースは誰になる」と早くも期待と不安の声が混ざる。' },
  ],
  contractBetrayalGeneric: [
    { headline: '{name}が{toOrg}へ――契約交渉決裂',
      body: '{fromOrg}との契約交渉がまとまらず、{name}は{toOrg}への移籍を決断した。「環境を変えたかった」と{name}。残された仲間との関係に微妙な空気が漂う。' },
    { headline: '移籍決定――{name}が{toOrg}入り',
      body: '{fromOrg}を出た{name}が{toOrg}と契約。条件面での折り合いがつかなかったとされる。新天地での活躍に注目が集まる。' },
  ],
  poachSuccess: [
    { headline: '電撃移籍！{name}が{toOrg}に加入。{fromOrg}は大打撃か',
      body: '{fromOrg}の{name}が{toOrg}への移籍を決断。OVR{ovr}の実力者の流出に{fromOrg}関係者は衝撃を隠せない。「新天地で自分を試したい」と{name}。' },
    { headline: '{name}が移籍。{toOrg}の戦力強化なるか',
      body: '{fromOrg}から{toOrg}へ――{name}の電撃移籍が決まった。「チャンスを掴みに行く」と語る{name}に、新たなファンの期待が集まる。' },
    { headline: '{toOrg}が{name}を獲得！ 補強の目玉に',
      body: '{toOrg}が{fromOrg}の{name}を引き抜きに成功。即戦力としてチームを底上げする見込み。「この移籍は大きい」と業界紙が一様に報じた。' },
  ],
  warMilestone: [
    { headline: '金字塔！{orgName}、対抗戦通算{milestone}達成',
      body: '{orgName}が対抗戦通算{wins}勝目を記録。他団体との激闘を重ね、団体の威信を着実に積み上げている。選手たちの士気も大いに高まっているようだ。' },
    { headline: '{orgName}の誇り――対抗戦通算{milestone}の偉業',
      body: '対抗戦通算{wins}勝。{orgName}が団体の歴史に新たな金字塔を刻んだ。選手たちは「みんなで勝ち取った記録」と胸を張る。' },
    { headline: '止まらない{orgName}！ 対抗戦{milestone}突破',
      body: '{orgName}が対抗戦通算{wins}勝の節目を突破した。他団体にとって脅威となるその強さは、ロッカールームの結束の賜物だろう。' },
  ],
  emptyVenue: [
    { headline: '閑古鳥…{org}の興行がガラガラ。団体人気に打撃',
      body: '{org}の興行で空席が目立った。観客席の3割も埋まらない惨状に、関係者の間に危機感が広がっている。ファンの心を取り戻せるか、正念場だ。' },
    { headline: '{org}の興行に閑古鳥。集客力の低下が深刻に',
      body: '会場に響くのは選手の声ばかり――{org}の興行が大幅な集客割れとなった。「このままでは…」と関係者も頭を抱えている。' },
    { headline: '赤信号！ {org}の興行、空席だらけの衝撃',
      body: '{org}の興行が壊滅的な集客に終わった。団体の看板に傷がつく事態に、社長の手腕が問われる局面だ。' },
  ],

  // ── 業界ニュース拡充: bond/rivalry イベント ─────────────────
  lockerRoomCrisis: [
    { headline: '{org}ロッカールームに不穏——険悪ペア{count}組、内部に亀裂',
      body: '{org}の控室に重い空気が立ち込めている。bond の崩れた{count}組が同じ空間で身を支度する日々——挨拶もなく、目線も合わない。「あの空気の中で試合に出ろと言われても」と若手が漏らす。社長が動かなければ、これは長引く。' },
    { headline: '{org}内紛の予兆——険悪な選手同士が同じ控室に',
      body: '{org}のロッカールームで{count}組の険悪ペアが同居している。リング外での衝突こそ表沙汰になっていないが、関係者は「いつ火を噴いてもおかしくない」と口を揃える。団体としての一枚岩が試されている。' },
    { headline: '荒れる{org}の控室——険悪{count}組、空気が冷えきっている',
      body: '同じ団体の選手同士が、視線も交わさず通り過ぎる——{org}の控室で起きているのはそういう光景だ。bond ≤30 の組み合わせが{count}組も同居しているとなれば、興行のテンションにも影響が出かねない。' },
  ],
  hatredContagion: [
    { headline: '{org}に広がる嫌悪の連鎖——{carrier}が{enemy}を距離を取り始めた',
      body: '親しい{friend}が{enemy}を疎んじているのを目の当たりにした{carrier}が、自分の中の感情を整理しきれずに距離を取り始めている。心の冷えは、確実に伝染する。' },
    { headline: '心の伝染——{carrier}の中で{enemy}への感情が変わった',
      body: '{org}の{carrier}は、{friend}が{enemy}を見る目を覚えてしまった。それは知らず知らずに自分の判断にも染み込んでいく。「あの人とは、もう前のようには話せない」——そう本人がぽつりと漏らした。' },
  ],
  relationshipRepair: [
    { headline: '{nameA}と{nameB}の関係修復に成功——{org}が動いた',
      body: '長く険悪だった{nameA}と{nameB}の間に、社長が間に入って話し合いの場が持たれた。完全な和解とまではいかないが、控室で挨拶が交わされる程度には空気が変わったという。{org}にとっては小さな、しかし意味のある一歩だ。' },
    { headline: '{org}、{nameA}と{nameB}の溝を埋める——「これで一緒に試合を組める」',
      body: '社長の仲介で{nameA}と{nameB}が膝を突き合わせて話した。「言いたかったことを、ようやく言えた」と一方が漏らす。bond の数字が動いたかどうかは外からはわからない。だが、控室の空気が変わったことは確かだ。' },
  ],
  relationshipRepairFail: [
    { headline: '{org}の関係修復は不発——{nameA}と{nameB}の溝は埋まらず',
      body: '社長が{nameA}と{nameB}の間に入ったが、二人の間に流れる溝は思ったより深かった。「あの人とは、まだ無理です」——会談は短く終わった。社長の手が届かない関係もある。' },
  ],
  factionFormed: [
    { headline: '{org}に派閥誕生——{leaderName}を中心に旗揚げ',
      body: '{org}の{leaderName}を中心とした集団が、団体内で独自の旗を掲げた。「派閥」という言葉が好まれるかどうかは別として、控室の力学は確実に変わる。これからの興行の組み方にも影響が出るだろう。' },
    { headline: '{leaderName}組が動き出した——{org}内の新たな勢力図',
      body: '{org}内に{leaderName}を中心とした集まりが形を成した。慕う者たちが集い、「ここで戦いたい」と表明し始めた格好だ。一枚岩だった団体が、初めて色分けされた瞬間でもある。' },
  ],
  factionEscalation: [
    { headline: '{org}内で派閥抗争勃発——「{factionAName}」vs「{factionBName}」',
      body: '{org}の中で「{factionAName}」と「{factionBName}」の対立が表面化した。控室の空気は割れ、興行のメインカードの組み方一つでも気を使う事態に。「リングで決着をつけるしかない」——両派から漏れる声は冷たく、重い。' },
    { headline: '{org}、二つの派閥が真正面から対立——抗争の幕が開く',
      body: '{factionAName}と{factionBName}——{org}の中の二つの派閥が、ついに表立って衝突した。リング外でのやり取りも険悪さを増し、団体としての結束は試されている。これから組まれる試合は、ただの試合では済まなくなる。' },
  ],
  factionResolution: [
    { headline: '{org}派閥抗争に決着——「{winFaction}」が「{loseFaction}」を下す',
      body: '{org}内で続いていた派閥抗争に、リング上で一つの答えが出た。{winFaction}が{loseFaction}を下し、控室の力学はしばらくこの形で固まる見込みだ。敗れた側の {loseLeader} がこのあとどう動くかが次の焦点になる。' },
    { headline: '抗争に終止符——{winFaction}の勝利で{org}に静寂が戻る',
      body: '長く続いた{org}内の対立は、{winFaction}と{loseFaction}の決着戦で一旦の幕引きとなった。完全な和解ではないが、これ以上の消耗を避けるという意味では、双方にとっての落とし所だったのかもしれない。' },
  ],
  factionDissolution: [
    { headline: '{org}の派閥「{factionName}」が消滅——{leaderName}の喪失で求心力失う',
      body: '{org}内に存在した「{factionName}」が、リーダー{leaderName}の不在を埋めきれず消滅した。残されたメンバーたちは新たな居場所を探すことになる。派閥が消えても、その間に積み重ねた感情はそう簡単には消えない。' },
  ],
  factionSplit: [
    { headline: '{org}派閥分裂——「{factionName}」から{ringleaderName}が離脱',
      body: '{org}内の「{factionName}」から、{ringleaderName}を中心とした一派が離脱した。控室には新たな勢力線が引かれ、興行の組み方はさらに難しくなる。一つだった旗が、いま二つに割れた瞬間だ。' },
  ],
  reclaimChallenge: [
    { headline: '挑戦状！{challengerName}が{toOrg}に世界王座奪還を要求',
      body: '{fromOrg}の{challengerName}が、{toOrg}に持ち去られた世界王座への奪還挑戦状を叩きつけた。「あのベルトは私たちのリングで生まれたものだ」——強い言葉が会見場に響いた。次の興行で運命の一戦が組まれる。' },
    { headline: '{challengerName}、{toOrg}に殴り込み——「ベルトを取り戻す」',
      body: '世界王座を抱えて{toOrg}へ移った元同僚に対し、{fromOrg}の{challengerName}が奪還を宣言した。「あの裏切りには、リングで答えを出させる」——次の興行のメインで決着がつく。' },
  ],
  reclaimSuccess: [
    { headline: '王座奪還！{challengerName}が{toOrg}から世界ベルトを取り戻した',
      body: '{fromOrg}の{challengerName}が、{toOrg}に持ち去られていた世界王座を取り戻した。「やっとこのベルトを、本来の場所に戻せた」と新王者。裏切られた団体の意地が、リングの上で結実した瞬間だ。' },
    { headline: '雪辱——{challengerName}、奪われた王座を取り戻す',
      body: '{toOrg}に持ち去られていた世界王座が、{fromOrg}の{challengerName}の手元に帰ってきた。会見場には涙ぐむ関係者の姿もあった。失われたものを取り戻す——その重みを、彼女は背負ってリングに上がった。' },
  ],
  reclaimFailure: [
    { headline: '{challengerName}の奪還挑戦は失敗——{toOrg}が世界王座を死守',
      body: '{fromOrg}の{challengerName}が仕掛けた奪還戦は、{toOrg}側の防衛に終わった。「またあのベルトに辿り着けなかった」——リングを降りる挑戦者の背中に、ファンから声援が飛んだ。物語はまだ終わらない。' },
  ],
  firstMeetSinceDeparture: [
    { headline: '元同僚、リングで再会——{nameA}と{nameB}、離脱後初の対戦',
      body: '同じ控室で過ごした日々があった{nameA}と{nameB}が、団体を別にしてから初めてリングで向き合った。視線の交わし方一つにも、過ごした時間の重みが滲む。観客はその空気を、確かに受け取っていた。' },
    { headline: '{nameA} vs {nameB}——別れた者同士、運命の初対決',
      body: '袂を分かった元同僚同士の最初の一戦は、いつも特別なものになる。{nameA}と{nameB}——かつて同じ旗の下にいた二人が、今夜は別の色で対峙した。試合内容以上に、その表情を覚えておきたい。' },
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
        effect: { type: 'mq_boost', amount: 3, weeks: 4, attendanceMultiplier: 1.15 },
        result: '練習メニューを見直し、試合構成にもこだわり始めた。',
        effectLabel: '全試合MQ+3、集客×1.15（4週間）'
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
        effect: { type: 'next_match_mq', amount: 3, attendanceMultiplier: 1.20 },
        result: '次の対戦が、特別な一戦になる予感がする。',
        effectLabel: '次の対戦MQ+3、その興行の集客×1.20'
      },
      {
        label: '🌐 他の組み合わせも試したい',
        effect: { type: 'rivalry_chance_up', weeks: 3 },
        result: 'いろんな選手をぶつけてみよう。化学反応はどこで起きるか分からない。',
        effectLabel: '因縁成立しやすくなる（3週間）'
      }
    ]
  },
  // ── D層: ドーム到達マイルストーン（dome-milestone-spec-v0.3）──
  {
    id: 'first_dome_show',
    trigger: { type: 'venue', venueIdx: 9, timing: 'preShow' },
    titleMain: '到 　 達',
    titleSub: 'THE DOME',
    narration: [
      'ドーム。',
      '日本のプロレス界で、頂点を意味する三文字。',
      'この会場に名を刻むことは、団体にとって一つの到達点であり、',
      '同時に、新たな始まりでもある。',
      '控室のドアの前で、一度立ち止まった。',
      '息を整え、扉を開ける。',
      '——選手たちが、待っている。'
    ],
    narrationGaps: [4],
    visualVariant: 'arrival',
    dialogueKey: 'dome_firstshow',
    continueLabel: '試 合 に 向 か う',
    choices: []
  },
  {
    id: 'first_dome_sellout',
    trigger: { type: 'venue_occupancy', venueIdx: 9, minOccupancy: 0.95, timing: 'postShow' },
    titleMain: '満 　 員',
    titleSub: 'FULL HOUSE',
    narration: [
      '満員のドーム。',
      'かつて、日本のプロレス興行における最大の到達点とされてきた景色。',
      '三万の観客席のすべてが埋まり、彼らは今、この団体の名を呼んでいる。',
      '最終試合の鐘が鳴り、選手たちがリングから引き上げる。',
      '照明が落ち、客電が灯っても——',
      '拍手は、しばらく鳴り止まなかった。'
    ],
    narrationGaps: [3],
    visualVariant: 'triumph',
    dialogueKey: 'dome_sellout',
    continueLabel: '控 室 へ 戻 る',
    choices: []
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
  N1: {
    normal: {
      _default: [
        '練習が楽しくなってきた気がします',
        'やっと体が動くようになってきた気がします'
      ],
      ojousama: [
        '稽古が楽しくなってまいりました',
        '少しずつ、体が応えてくれるようになってきたわね'
      ],
      delinquent: [
        'なんか最近、体の動きキレてね？',
        'やっと感覚掴めてきたっぽい'
      ],
      seductive: [
        '最近、体が素直に動いてくれるの。嬉しいわ',
        '練習が楽しくなってきた気がする'
      ],
      composed: [
        '…ま、少しずつ馴染んできたかな',
        '悪くない感触だね。この調子で行こう'
      ]
    },
    bold: {
      _default: [
        'まだ足りない。もっとできるはず！',
        'この調子で上を目指す！'
      ],
      ojousama: [
        'まだまだですわ。もっと上を目指しませんと…'
      ],
      delinquent: [
        'まだ足りねえ。もっとやれるはずだ'
      ],
      cool: [
        '…まだ上がある。止まる気はない'
      ],
      seductive: [
        'まだ足りないわ。もっと強くなれる気がするの'
      ],
      composed: [
        '…まだ先がある。焦らず行くよ'
      ]
    },
    quiet: {
      _default: [
        '……少し、手応えがある'
      ],
      cool: [
        '…悪くない。この調子で'
      ],
      polite: [
        '少し…手応えを感じています'
      ]
    },
    shy: {
      _default: [
        'あの…ちょっとだけ、練習が楽しくなってきました…'
      ],
      polite: [
        'あ、あの…お知らせがあります…'
      ],
    },
    easygoing: {
      _default: [
        'なんか今日、急にいろいろ掴めた気がする！',
        'よく分かんないけど、急に噛み合ってきた！'
      ],
      delinquent: [
        'なんか急にキタわ！掴めた感じ！'
      ],
      seductive: [
        'あら、急にいろいろ掴めちゃったかも'
      ]
    },
    earnest: {
      _default: [
        '積み重ねが大事だと思ってます。コツコツやっていきます',
        '練習って楽しい。もっとやりたいです'
      ],
      polite: [
        '積み重ねが大切だと信じています。コツコツ参ります'
      ],
      ojousama: [
        '積み重ねが大切ですわ。一歩一歩、参りますわね'
      ],
      seductive: [
        '積み重ねって大事よね。もっとやりたくなっちゃう'
      ],
      composed: [
        '…地道にやるのが一番だよ。急がず行こう'
      ]
    },
    emotional: {
      _default: [
        'うわあ…！練習が楽しい…！もっとやりたい！',
        '体が動くようになってきた…嬉しい…！'
      ],
      seductive: [
        'お知らせよ……っ……ふふ、聞いて……',
        'ねえ、聞いて……っ……ふふ……'
      ],
    }
  },
  N2: {
    normal: {
      _default: [
        'いい仲間ができた気がします',
        '一緒に頑張れる人がいると心強いですね'
      ],
      ojousama: [
        '良い仲間に恵まれたわね'
      ],
      delinquent: [
        'あいつと一緒だと楽しいんだよな'
      ],
      seductive: [
        'いい仲間に恵まれたわ。心強いの'
      ],
      composed: [
        '…いい仲間だね。悪くない環境だよ'
      ]
    },
    bold: {
      _default: [
        '仲間がいるから頑張れる。チームって、いいよね',
        '一緒だと燃えるんだよね'
      ],
      ojousama: [
        '皆様のご期待が、わたくしの力になっておりますわ'
      ],
      delinquent: [
        'あいつがいるから燃えるんだよ！'
      ],
      cool: [
        '…悪くないチームだ'
      ],
      seductive: [
        '仲間がいるって、いいものね'
      ],
      composed: [
        '…悪くないチームだよ。居心地がいい'
      ]
    },
    quiet: {
      _default: [
        '……いい人たちだと、思います'
      ],
      cool: [
        '…悪くない仲間だ'
      ],
      polite: [
        '…良い方々だと思います'
      ]
    },
    shy: {
      _default: [
        'あの…みんなと一緒にいられて…嬉しいです…'
      ],
      polite: [
        'ちょ、ちょっとお伝えしたいことが…'
      ],
    },
    easygoing: {
      _default: [
        'あの人と一緒だと超楽しい！最高のパートナーだよ！'
      ],
      delinquent: [
        'あいつ最高！一緒だとテンション上がるわ！'
      ],
      seductive: [
        'あの人と一緒にいると楽しいの。最高のパートナーね'
      ]
    },
    earnest: {
      _default: [
        'あの人と練習してると自分も頑張ろうって思えるんです',
        'この団体で一緒にやれる仲間がいて、幸せです'
      ],
      polite: [
        '一緒にお稽古していると、自分も頑張ろうと思えます'
      ],
      ojousama: [
        'この団体でご一緒できる仲間がいて、幸せですわ'
      ],
      seductive: [
        'あの人と一緒だと、もっと頑張りたくなるの'
      ],
      composed: [
        '…あの人がいると、自然と力が出るね'
      ]
    },
    emotional: {
      _default: [
        'みんなのこと大好き…！一緒にいられて幸せ…！'
      ],
      seductive: [
        'ちょっといいかしら……っ……ふふ……'
      ],
    }
  },
  N3: {
    normal: {
      _default: [
        'ちょっと疲れてるだけです。次の試合までには戻ります',
        '少し休めば大丈夫です'
      ],
      ojousama: [
        '少々疲れが出たようで…次までには整えます'
      ],
      delinquent: [
        'ちょっとダルいだけだって。すぐ戻る'
      ],
      seductive: [
        '少し疲れただけよ。心配しないで'
      ],
      composed: [
        '…ちょっと疲れただけ。すぐ戻るよ'
      ]
    },
    bold: {
      _default: [
        '大丈夫。この程度。すぐ戻るよ',
        'こんなんじゃ終われない'
      ],
      ojousama: [
        'この程度、問題ありませんわ'
      ],
      delinquent: [
        'この程度で止まってられるかよ'
      ],
      cool: [
        '…問題ない。戻れる'
      ],
      seductive: [
        'この程度で止まるつもりはないわ'
      ],
      composed: [
        '…この程度なら大丈夫。慌てないで'
      ]
    },
    quiet: {
      _default: [
        '……少し、休みます'
      ],
      cool: [
        '…大丈夫だ。すぐ戻れる'
      ],
      polite: [
        '…少し休ませていただければ…'
      ]
    },
    shy: {
      _default: [
        'あの…無理はしてないつもりなんですけど……少し休んだ方がいいかも…'
      ],
      polite: [
        '報告です…あ、あの…'
      ],
    },
    easygoing: {
      _default: [
        'あー、ちょっと疲れちゃったかも。少し休めば平気！'
      ],
      delinquent: [
        'あー疲れた。ちょい休むわ'
      ],
      seductive: [
        'ちょっと疲れちゃったかしら。少し休めば大丈夫よ'
      ]
    },
    earnest: {
      _default: [
        'すみません…体が追いつかなくて。少し休めば大丈夫です',
        '立て直してみせます'
      ],
      polite: [
        '申し訳ありません…少し休ませていただければ、必ず戻ります'
      ],
      ojousama: [
        '少しお休みをいただければ、必ず立て直しますわ'
      ],
      seductive: [
        'ごめんなさい…少し休めば、すぐ戻れるわ'
      ],
      composed: [
        '…少し休めば大丈夫。焦ることはないよ'
      ]
    },
    emotional: {
      _default: [
        'うう…体がしんどい…でも、でも頑張りたいのに…！'
      ],
      seductive: [
        'はぁ……体が、言うこときかないの……ごめんなさい……',
        'ふぅ……ちょっと、休ませて……すぐ、戻るから……'
      ],
    }
  },
  N4: {
    normal: {
      _default: [
        'こんなにたくさんの応援をいただけるなんて、びっくりしています',
        'ファンの声が力になってます'
      ],
      ojousama: [
        '皆様からこれほどの声援をいただけるのは、光栄です'
      ],
      delinquent: [
        '応援してくれるやつがいるってのは…悪くねえな'
      ],
      seductive: [
        'こんなに応援してもらえるなんて…嬉しいわ'
      ],
      composed: [
        '…ありがたいね。ちゃんと届いてるよ'
      ]
    },
    bold: {
      _default: [
        'この人気を足がかりに、私はもっと上に行く',
        'まだまだここで終わるつもりはない'
      ],
      ojousama: [
        'この声援を力に、さらに上を目指しますわ'
      ],
      delinquent: [
        'この勢いで突っ走るぜ！'
      ],
      cool: [
        '…悪くない。もっと上を目指す'
      ],
      seductive: [
        'この人気、活かさない手はないわね'
      ],
      composed: [
        '…悪くないね。この期待に応えるだけだよ'
      ]
    },
    quiet: {
      _default: [
        '……応援、ありがとうございます'
      ],
      cool: [
        '…ファンの期待には応える'
      ],
      polite: [
        '…応援してくださって、ありがとうございます'
      ]
    },
    shy: {
      _default: [
        'え、あの…私なんかを応援してくれる人がいるなんて…'
      ],
      polite: [
        'お、大事なお知らせです…'
      ],
    },
    easygoing: {
      _default: [
        'ファンの皆さんが喜んでくれるのが一番嬉しい！',
        'もっとみんなを楽しませたい！'
      ],
      delinquent: [
        'ファンが盛り上がってんの最高じゃん！'
      ],
      seductive: [
        'ファンの方が喜んでくれると、もっと見せたくなるわ'
      ]
    },
    earnest: {
      _default: [
        'みんなに応援してもらえるって、本当に力になりますね',
        'ファンの声が原動力です'
      ],
      polite: [
        '皆様の応援が、何よりの原動力です'
      ],
      ojousama: [
        'ファンの皆様のお声が力になりますわ'
      ],
      seductive: [
        '応援してくれる人がいるって、本当に力になるの'
      ],
      composed: [
        '…みんなの声、ちゃんと届いてるよ。ありがたいね'
      ]
    },
    emotional: {
      _default: [
        'みんなが応援してくれてる…！嬉しくて泣きそう…！'
      ],
      seductive: [
        '大事な話よ……っ……ふふ、しっかり聞いて……'
      ],
    }
  },
  N5_warning: {
    normal: {
      _default: [
        '（どこか上の空で、視線が泳いでいる）',
        '……すみません、ちょっと考え事を'
      ],
      ojousama: [
        '…少し、考え事がございまして'
      ],
      delinquent: [
        '…別に。何でもねーよ'
      ],
      seductive: [
        '…ごめんなさい、ちょっと考え事してて'
      ],
      composed: [
        '…ん、ちょっと考え事。気にしないで'
      ]
    },
    bold: {
      _default: [
        '……このままで本当にいいのか、って考えちゃうことがある',
        '最近、何と戦ってるのか分からなくなる'
      ],
      ojousama: [
        '…このままで本当によろしいのか、と考えてしまいますの'
      ],
      delinquent: [
        '…最近、何のために戦ってんのか分かんねーんだ'
      ],
      cool: [
        '……目的を、見失いかけている'
      ],
      seductive: [
        '…このままでいいのかなって、ふと思うの'
      ],
      composed: [
        '…ま、少し立ち止まってるだけだよ。…たぶん'
      ]
    },
    quiet: {
      _default: [
        '…………'
      ],
      cool: [
        '……'
      ],
      polite: [
        '…あの…何でもありません…'
      ]
    },
    shy: {
      _default: [
        '…あ、あの……なんでもない、です…'
      ],
      polite: [
        'き、緊急のお知らせです…!'
      ],
    },
    easygoing: {
      _default: [
        'あはは…いや、ちょっとね。大丈夫、大丈夫'
      ],
      delinquent: [
        'あー…いや、なんでもねー。平気平気'
      ],
      seductive: [
        'ふふ…なんでもないわ。気にしないで'
      ]
    },
    earnest: {
      _default: [
        '練習しても練習しても、何かが足りない気がして…',
        '…ここにいたい気持ちは変わらないんですけど……'
      ],
      polite: [
        '練習を重ねても、何か足りない気がいたしまして…'
      ],
      ojousama: [
        '練習を重ねましても、何かが足りない気がしますの…'
      ],
      seductive: [
        'いくら練習しても、何か足りない気がして…'
      ],
      composed: [
        '…何かが噛み合わない。…まあ、そういう時期もあるか'
      ]
    },
    emotional: {
      _default: [
        '…なんか、最近ずっとモヤモヤして…うまく言えないけど…'
      ],
      seductive: [
        '緊急よ……っ……ふふ、よく聞いて……'
      ],
    }
  },
  N5_low: {
    normal: {
      _default: [
        '…別に、何でもないです',
        'もういいです。分かりました'
      ],
      ojousama: [
        '…もう結構ですわ'
      ],
      delinquent: [
        '…もういいわ。勝手にする'
      ],
      seductive: [
        '…もういいわ。分かったから'
      ],
      composed: [
        '…もういいよ。分かったから'
      ]
    },
    bold: {
      _default: [
        '……この団体で、自分の夢は叶えられるんだろうか',
        '先が見えなくて、焦ってる'
      ],
      ojousama: [
        '…この団体で、わたしの夢は叶えられますの…？'
      ],
      delinquent: [
        '…ここにいても、先が見えねえ'
      ],
      cool: [
        '……もう、見切りをつけるべきなのか'
      ],
      seductive: [
        '…ここにいて、私の夢は叶うのかしら'
      ],
      composed: [
        '…ここにいる意味、少し考え直してもいいかな'
      ]
    },
    quiet: {
      _default: [
        '………（何も言わず、目を逸らす）'
      ],
      cool: [
        '……（静かに出口を見ている）'
      ],
      polite: [
        '…失礼します（静かに立ち去ろうとする）'
      ]
    },
    shy: {
      _default: [
        '…ごめんなさい…もう…わかりません…'
      ],
      polite: [
        'あ、あの…ちょっと、心配なことが…'
      ],
    },
    easygoing: {
      _default: [
        'あはは…もう、いいかなって。ちょっと考えさせて'
      ],
      delinquent: [
        'もーいいわ。考えさせてくれ'
      ],
      seductive: [
        'ふふ…もういいかなって、少し思っちゃった'
      ]
    },
    earnest: {
      _default: [
        '裏切りたいわけじゃない。ただ……',
        'ここが好きだから、だから辛いんです'
      ],
      polite: [
        '裏切るつもりはございません。ただ……'
      ],
      ojousama: [
        '裏切りたいわけではありませんの。ただ……'
      ],
      seductive: [
        '裏切りたいわけじゃないの。ただ……ね'
      ],
      composed: [
        '…嫌いになったわけじゃない。ただ……ね'
      ]
    },
    emotional: {
      _default: [
        'もう…もう分かんない…！どうすればいいの…！'
      ],
      seductive: [
        'ちょっと心配なの……っ……ふふ……'
      ],
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 社長室 Phase 3: 決裁書類（DECISION_DOCS）
// 仕様: specs/shachoshitsu-spec-v1.0.md §3
// Phase 3 では表示・発動条件のみ使用。effect の実適用は Phase 4 で実装予定。
// ─────────────────────────────────────────────────────────────────────────────
// 机に並ぶ順序（固定）。hireCoach は机に並ばない特殊書類のため含めない。
// encourage は社長室に書類として並ばず、選手ポップアップから
// 「💬 声をかける」として直接実行される(社長自らの自発的行動)。
// DECISION_DOCS.encourage の定義自体は Engine.shachoshitsu.execute で再利用される。
const DECISION_DOC_ORDER = [
  'bonus', 'refresh_leave', 'special_treatment', 'party',
  'trainer', 'camp', 'media', 'relationship_repair',
];

const DECISION_DOCS = {
  bonus: {
    id: 'bonus',
    label: 'ボーナス支給願',
    category: 'care',
    categoryLabel: '選手ケア',
    icon: '💰',
    cost: 50,              // 万円
    decisionCost: 1,       // 決裁枠
    activationCondition: 'trust_unstable',
    minOrgPop: 0,
    cooldown: 1,
    body: '対象選手に特別手当を支給し、組織貢献への感謝を示す',
    detailText: '特別手当の支給により、社長との間に揺らぎが生まれつつある選手の心を繋ぎ止める。額面よりも「見てくれている」という事実が響く。',
    effectSummary: '対象選手の信頼が大きく上がる',
    recommendation: '団体への気持ちが陰りはじめた選手に、早めに手を打つと効果的。',
    effect: { target: 'individual', trust: 4.59 },
  },
  encourage: {
    id: 'encourage',
    label: '声かけ',
    category: 'care',
    categoryLabel: '選手ケア',
    icon: '💬',
    cost: 0,
    decisionCost: 0,
    // Phase 5: 社長室の机には並ばない。選手ポップアップから直接実行される自発的行動。
    // activationCondition は null(execute 側で個別に発動条件をチェックする)
    activationCondition: null,
    minOrgPop: 0,
    cooldown: 1,
    body: '気にかけている選手に社長自ら声をかけに行く',
    detailText: '決裁枠も資金も使わない、社長自らの自発的な行動。スランプ中・モチベ喪失中・信頼が揺らいでいる選手に足を運んで声をかける。',
    effectSummary: '信頼がわずかに上がる(スランプ/モチベ喪失なら回復促進も)',
    recommendation: '気になる選手のポップアップから直接実行する。机には並ばない。',
    effect: { target: 'individual', trust: 0.77, slumpMomentum: { high: 4.0, low: 2.5 } },
  },
  special_treatment: {
    id: 'special_treatment',
    label: '特別治療指示書',
    category: 'care',
    categoryLabel: '選手ケア',
    icon: '🏥',
    cost: 200,
    decisionCost: 1,
    activationCondition: 'has_injured',
    minOrgPop: 0,
    cooldown: 1,
    body: '離脱中の選手に専門医を手配し、復帰を早める',
    detailText: '専門医による集中ケアを正式に発注。怪我からの離脱期間を確率的に短縮する、復帰前倒しの一手。確実な短縮量は治療結果次第。',
    effectSummary: '対象選手の離脱期間が1〜4週短縮される',
    recommendation: '主力選手や王座挑戦が控えている選手の離脱が痛手なときに。離脱が長引いている怪我ほど短縮量も大きくなりやすい。',
    effect: { target: 'individual', special: 'treatment' },
  },
  refresh_leave: {
    id: 'refresh_leave',
    label: '休暇辞令',
    category: 'care',
    categoryLabel: '選手ケア',
    icon: '🏖️',
    cost: 100,
    decisionCost: 1,
    activationCondition: 'slump_or_motivation_loss',
    minOrgPop: 0,
    cooldown: 4,
    body: '心身の疲弊を察し、一定期間の休養を与える',
    detailText: '数週間の休養を正式な辞令として発行。強制的に現場から離脱させることで、心身を根本から回復させる重い一手。',
    effectSummary: 'スランプが大きく回復 + 体調が戻る + 信頼も上がる',
    recommendation: '面談では効果が薄い、重めの不調に対する切り札。次に使えるまで4週かかる点に注意。',
    effect: { target: 'individual', trust: 5.36, condition: 15, slumpMomentum: 12.0 },
  },
  party: {
    id: 'party',
    label: '慰労会開催届',
    category: 'care',
    categoryLabel: '選手ケア',
    icon: '🍻',
    unitCost: 15,          // 万円／人
    decisionCost: 1,
    activationCondition: 'morale_low',
    minOrgPop: 0,
    cooldown: 1,
    minHeadcount: 4,
    body: '団体の雰囲気を立て直すべく、慰労の宴席を設ける',
    detailText: '全選手を集めた慰労の宴席。個別の数値を動かすより、ロッカールームの空気そのものを立て直すのが主目的。',
    effectSummary: '全員の信頼がわずかに上がる + ロッカールームの雰囲気が良くなる',
    recommendation: 'ロッカールームの空気に少し陰りが見えてきたときの応急処置として。単発では決定打にならない点に留意。',
    effect: { target: 'team', trust: 1.84, morale: 5 },
  },
  trainer: {
    id: 'trainer',
    label: '専属トレーナー手配書',
    category: 'growth',
    categoryLabel: '育成',
    icon: '💪',
    cost: 160,
    decisionCost: 2,
    activationCondition: null,  // 常時発動可
    minOrgPop: 0,
    cooldown: 1,
    body: '対象選手の成長を加速させるため、外部専属トレーナーを招聘する',
    detailText: '外部の専属トレーナーを期間限定で招聘。短期集中で成長曲線を押し上げる、育成特化の投資型書類。',
    effectSummary: '4週間のあいだ対象選手の練習効果が上がる + 信頼が上がる',
    recommendation: '伸ばしたい若手、シリーズ前の追い込み期、昇格を狙う選手に充てたい。',
    effect: { target: 'individual', trust: 5.97, growthBoost: { weeks: 4, mult: 1.3 } },
  },
  camp: {
    id: 'camp',
    label: '合宿実施手配書',
    category: 'growth',
    categoryLabel: '育成',
    icon: '🏕️',
    unitCost: 40,
    decisionCost: 3,
    activationCondition: null,
    minOrgPop: 0,
    cooldown: 1,
    minHeadcount: 4,
    body: '全選手を集中的に強化するため、合宿を実施する',
    detailText: '選手全員を合宿地へ送り込み、短期集中で基礎を鍛え直す。ひとり40万×人数ぶんの費用と決裁枠3を消費する重量級書類。',
    effectSummary: '2週間のあいだ全員の練習効果が上がる + 全員の信頼もわずかに上がる',
    recommendation: '資金に余裕があり、オフシーズン前後に全体を底上げしたいとき。年1〜2回が現実的な使用頻度。',
    effect: { target: 'team', trust: 1.84, growthBoost: { weeks: 2, mult: 1.5 } },
  },
  media: {
    id: 'media',
    label: 'メディア露出手配書',
    category: 'pr',
    categoryLabel: '広報',
    icon: '📺',
    cost: 150,
    decisionCost: 2,
    activationCondition: null,
    minOrgPop: 20,
    cooldown: 2,
    body: '対象選手を広告塔とし、団体の知名度向上を図る',
    detailText: '対象選手をメディア露出の広告塔として起用。団体の知名度向上と本人の体調維持を両立させる外向き施策。',
    effectSummary: '選手人気が上がる + 団体人気も上がる + 体調が整う + 信頼も上がる',
    recommendation: '団体人気がある程度育ってから解禁される書類。看板選手の体調管理と兼ねて回すと無駄がない。選手の人気を直接押し上げたい時にも有効。',
    effect: { target: 'individual', trust: 5.36, condition: 5, orgPopDelta: 0.4, popGainMin: 6, popGainMax: 8 },
  },
  // bond-rivalry plan P-6: 慢性的険悪ペア（W-1 累計4回以上）の関係修復。
  // ペア指定型のため target: 'pair'。回数無制限。
  relationship_repair: {
    id: 'relationship_repair',
    label: '関係修復斡旋書',
    category: 'care',
    categoryLabel: '選手ケア',
    icon: '🤝',
    cost: 100,
    decisionCost: 2,
    activationCondition: 'hostile_pair_chronic',
    minOrgPop: 0,
    cooldown: 0,
    body: '長期的な険悪関係にあるペアの間に立ち、関係改善を図る',
    detailText: '勝負の世界では険悪な関係も時に武器になる。だが限度を超えると組織全体を蝕む。社長が間に立ち、最悪の事態を避ける。成功率は約70%。失敗しても関係はそのまま。',
    effectSummary: '成功時、双方向 bond +5〜+10。失敗時は据え置き。',
    recommendation: 'W-1（憎い敵ゾーン）が累計4回以上発火したペアに対して使用できる。慢性化する前に手を打てば、亀裂が修復可能になることもある。',
    effect: { target: 'pair', bondDelta: [5, 10], successRate: 0.70 },
  },
  // hireCoach は机に並ばず、コーチ画面からの実行時に決裁枠だけをチェック/消費する特殊書類。
  // Phase 5 でコーチ画面と統合予定。
  hireCoach: {
    id: 'hireCoach',
    label: 'コーチ雇用決裁書',
    category: 'hr',
    categoryLabel: '人事',
    icon: '🎓',
    cost: null,            // コーチ候補ごとに変動(コーチ画面で決定)
    decisionCost: 2,
    activationCondition: null,
    minOrgPop: 0,
    cooldown: 0,
    body: '新たなスタッフを招聘し、団体の指導体制を強化する',
    detailText: '新たなコーチを招聘し、指導体制を強化する。机には並ばず、コーチ画面から実行する特殊書類。',
    effectSummary: 'コーチを1名新しく迎える(決裁枠を2消費)',
    recommendation: 'コーチ枠に空きがあり、新規雇用を検討している週に。机に書類として表示されない点に注意。',
    effect: { target: 'hireCoach' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 社長室 Phase 8: 不確実性マトリクス (spec §6.3 / §6.4)
// 決裁の信頼度効果が、選手の性格×アーキタイプで ±50% 変動する。
// これにより「刺せば必ず望み通りに効く」万能感を崩し、
// 「刺してみないとわからない」体感を導入する。
//
// 計算式: finalMult = clamp(personalityMult × archetypeMult, 0.5, 1.5)
// finalMult は applyTrust/queueTrust で効果量に直接乗算される。
// 適用対象は trust 効果のみ。condition/slumpMomentum/growthBoost/orgPopDelta には影響しない。
// ─────────────────────────────────────────────────────────────────────────────

// 性格 × 書類 マトリクス (6性格 × 7書類)
// spec §6.3 の shy は project に存在しないため除外。
const DECISION_PERSONALITY_MULT = {
  normal:    { bonus: 1.00, encourage: 1.00, refresh_leave: 1.00, special_treatment: 1.00, party: 1.00, trainer: 1.00, camp: 1.00, media: 1.00 },
  bold:      { bonus: 0.80, encourage: 0.70, refresh_leave: 0.90, special_treatment: 1.00, party: 1.00, trainer: 1.20, camp: 1.20, media: 1.00 },
  quiet:     { bonus: 1.00, encourage: 1.20, refresh_leave: 1.10, special_treatment: 1.00, party: 0.70, trainer: 1.00, camp: 0.90, media: 0.60 },
  easygoing: { bonus: 1.10, encourage: 1.00, refresh_leave: 1.00, special_treatment: 1.00, party: 1.20, trainer: 0.90, camp: 1.10, media: 1.10 },
  earnest:   { bonus: 0.90, encourage: 1.20, refresh_leave: 1.10, special_treatment: 1.00, party: 0.90, trainer: 1.30, camp: 1.20, media: 1.00 },
  emotional: { bonus: 1.30, encourage: 1.40, refresh_leave: 1.20, special_treatment: 1.00, party: 1.10, trainer: 1.00, camp: 1.10, media: 1.20 },
};

// アーキタイプ × 書類 マトリクス (normal 以外の4種)
// 記載のないアーキタイプ+書類の組合せは 1.00 (影響なし)
// spec §6.4 を拡張して全書類を扱う
const DECISION_ARCHETYPE_MULT = {
  ojousama:   { bonus: 0.70, party: 1.00, media: 1.10, camp: 0.80 },       // 金には動じない、合宿は好まない
  delinquent: { bonus: 1.30, party: 1.30, media: 0.80, trainer: 1.10 },    // 金と酒は効く、メディアは嫌う、体育会系は好む
  cool:       { bonus: 0.70, party: 0.60, media: 0.80, encourage: 0.80 },  // 全体的に冷めている
  seductive:  { bonus: 1.00, party: 1.10, media: 1.30, refresh_leave: 1.10 }, // 華やかな場で輝く
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
      _default: [
        'ありがとうございます！',
        'いただきます…！',
        '感謝します',
        '励みになります！',
        '嬉しいです！大切に使います'
      ],
      ojousama: [
        'まあ、ありがとうございます。大切に使わせていただきます'
      ],
      delinquent: [
        'お、マジ？ ありがとな！'
      ],
      seductive: [
        'あら、嬉しい。ありがとう'
      ],
      composed: [
        '…ありがとう。大事に使うよ'
      ]
    },
    bold: {
      _default: [
        'これで負けていられない！',
        'よし！もっと強くなります！'
      ],
      ojousama: [
        'ありがとうございます。結果でお返しするわ'
      ],
      delinquent: [
        'おっしゃ！この金で栄養つけてもっと強くなるぜ！'
      ],
      cool: [
        '…感謝する。結果で返す'
      ],
      seductive: [
        '嬉しいわ。実力で返させてもらうわね'
      ],
      composed: [
        '…ありがとう。結果で返すよ'
      ]
    },
    quiet: {
      _default: [
        '……ありがとうございます'
      ],
      cool: [
        '…ありがたい'
      ],
      polite: [
        '…ありがとうございます。大切に使います'
      ]
    },
    shy: {
      _default: [
        'え…あの…ありがとう、ございます…！'
      ],
      polite: [
        'ぼ、ボーナスを…？ あ、ありがとうございます…大切に使わせていただきます…'
      ],
    },
    easygoing: {
      _default: [
        'やった！ありがとうございます！',
        'おごってもらっちゃおうかな！'
      ],
      delinquent: [
        'やった！ラッキー！'
      ],
      seductive: [
        'あら嬉しい。何に使おうかしら'
      ]
    },
    earnest: {
      _default: [
        'ありがとうございます！次の試合、絶対頑張ります！',
        '…いつもありがとうございます'
      ],
      polite: [
        'ありがとうございます。必ず結果でお返しいたします'
      ],
      ojousama: [
        'ありがとうございます。結果でお応えしますわ'
      ],
      seductive: [
        'ありがとう。ちゃんと結果で返すわ'
      ],
      composed: [
        '…ありがたいね。次で応えるよ'
      ]
    },
    emotional: {
      _default: [
        'え…！ありがとうございます…！嬉しい…！',
        'うわあ…嬉しくて泣きそう…！'
      ],
      seductive: [
        'ボーナス……っ……気にかけてくれてたのね、嬉しい……ふふ、ありがとう……'
      ],
    }
  },
  bonus_repeat: {
    normal: {
      _default: [
        '…また？',
        'えっと…ありがとうございます',
        '（また同じ金額か…）'
      ]
    },
    bold: {
      _default: [
        '…また金か。もういいよ'
      ]
    },
    quiet: {
      _default: [
        '…………'
      ]
    },
    shy: {
      _default: [
        'あ…ありがとう、ございます…（また…？）'
      ],
      polite: [
        'ま、また…？ そんな、毎回いただいては…申し訳ないです…'
      ],
    },
    easygoing: {
      _default: [
        'えっと…ありがと…？'
      ]
    },
    earnest: {
      _default: [
        'あの…気持ちは嬉しいんですが…'
      ]
    },
    emotional: {
      _default: [
        '…また…？（少し困った顔をしている）'
      ],
      seductive: [
        'また……っ……ふふ、こんなに優しくされたら、応えないわけにはいかないわ……'
      ],
    }
  },
  trainer: {
    normal: {
      _default: [
        '頑張ります！',
        '全力で取り組みます！',
        'しっかり吸収します！'
      ],
      ojousama: [
        '精一杯、学ばせていただきます'
      ],
      delinquent: [
        'おっしゃ、ガンガンやるぞ！'
      ],
      seductive: [
        'しっかり吸収させてもらうわね'
      ],
      composed: [
        '…了解。しっかり吸収するよ'
      ]
    },
    bold: {
      _default: [
        'この環境を無駄にしない！絶対に結果を出す！',
        '最高の後押しね！限界まで追い込むよ！'
      ],
      ojousama: [
        'この機会、決して無駄にはしない'
      ],
      delinquent: [
        '最高じゃん！限界まで追い込んでもらうぜ！'
      ],
      cool: [
        '…ありがたい。結果を出す'
      ],
      seductive: [
        'この環境、無駄にしないわ。見ていてね'
      ],
      composed: [
        '…いい機会だね。無駄にはしないよ'
      ]
    },
    quiet: {
      _default: [
        '……全力で、学びます'
      ],
      cool: [
        '…吸収する。見ていてくれ'
      ],
      polite: [
        '…精一杯学ばせていただきます'
      ]
    },
    shy: {
      _default: [
        'せ、専属の先生…！が、頑張ります…！'
      ],
      polite: [
        '専属トレーナー…ですか…あ、あの、よろしくお願いいたします…'
      ],
    },
    easygoing: {
      _default: [
        'マンツーマン！？ めちゃくちゃ贅沢じゃないですか！'
      ],
      delinquent: [
        'マンツーマン！？ 超贅沢じゃん！'
      ],
      seductive: [
        'マンツーマンなんて贅沢ね。楽しみだわ'
      ]
    },
    earnest: {
      _default: [
        '専属の先生がつくんですか…！もっと上手くなれます！',
        'こんな機会をいただけて…全力で応えます'
      ],
      polite: [
        'こんな機会をいただけて…全力でお応えいたします'
      ],
      ojousama: [
        'こんな機会をいただけますなんて…全力でお応えしますわ'
      ],
      seductive: [
        'こんな機会をもらえるなんて…全力で応えるわ'
      ],
      composed: [
        '…ありがたいね。全部吸収させてもらうよ'
      ]
    },
    emotional: {
      _default: [
        'ええっ…！専属トレーナー…！頑張ります…！嬉しい…！'
      ],
      seductive: [
        'トレーナーをつけてくれるの……っ……ふふ、本気で育ててくれるのね……'
      ],
    }
  },
  media: {
    normal: {
      _default: [
        'よろしくお願いします！',
        'ありがとうございます！',
        '緊張するけど…頑張ります！'
      ],
      ojousama: [
        'メディアのお仕事ですの？ 精一杯務めます'
      ],
      delinquent: [
        'テレビ？ やってやるよ！'
      ],
      seductive: [
        'メディア出演…？ 楽しみだわ'
      ],
      composed: [
        '…なるほど。やってみるよ'
      ]
    },
    bold: {
      _default: [
        'もっと広い舞台に出たかった。ありがとう！',
        '注目される場は大歓迎！存在感見せてあげる！'
      ],
      ojousama: [
        'より広い舞台へということね。当然ね。'
      ],
      delinquent: [
        '注目されんの大歓迎！やってやるぜ！'
      ],
      cool: [
        '…いい機会だ。結果を出す'
      ],
      seductive: [
        '注目される場って好きよ。任せて'
      ],
      composed: [
        '…いい機会だね。任せて'
      ]
    },
    quiet: {
      _default: [
        '…が、頑張ります'
      ],
      cool: [
        '……やる'
      ],
      polite: [
        '…緊張しますが、精一杯頑張ります'
      ]
    },
    shy: {
      _default: [
        'え…テレビ…？ き、緊張します…で、でも頑張ります…！'
      ],
      polite: [
        'メ、メディア出演…ですか…き、緊張しますけど…や、やってみます…'
      ],
    },
    easygoing: {
      _default: [
        'テレビ！？ ファンのみんな見てる〜？'
      ],
      delinquent: [
        'テレビ！？ みんな見てるー？'
      ],
      seductive: [
        'テレビ？ みんなに見てもらえるのね。楽しみ'
      ]
    },
    earnest: {
      _default: [
        'うわあ、緊張する…でも頑張ります！',
        '団体の看板として恥ずかしくないようにします'
      ],
      polite: [
        '緊張いたしますが…精一杯務めます'
      ],
      ojousama: [
        '団体の看板として恥ずかしくない姿をお見せしますわ'
      ],
      seductive: [
        '緊張するけど…精一杯やるわ'
      ],
      composed: [
        '…いつも通りやればいいよ。大丈夫'
      ]
    },
    emotional: {
      _default: [
        'テレビ…！？ うわあ…緊張するけど嬉しい…！頑張る…！'
      ],
      seductive: [
        'メディアに……っ……ふふ、わたしを世間に見せたいのね、いいわ……'
      ],
    }
  },
  special_treatment: {
    normal: {
      _default: [
        '助かります…',
        'ありがとうございます',
        '一日でも早く復帰します！'
      ],
      ojousama: [
        'お気遣いいただき、ありがとうございます。必ず戻ります'
      ],
      delinquent: [
        'サンキュ。早く治してリング戻るわ'
      ],
      seductive: [
        'ありがとう。早く戻れるように頑張るわ'
      ],
      composed: [
        '…助かるよ。焦らず治すね'
      ]
    },
    bold: {
      _default: [
        '早く治してリングに戻りたい…！待ってなさい…！'
      ],
      ojousama: [
        'すぐ戻ります。待っていなさいな。'
      ],
      delinquent: [
        'すぐ治してやる。待ってろよ！'
      ],
      cool: [
        '…すぐ戻る。待っていてくれ'
      ],
      seductive: [
        '早く戻りたいの…待っていてね'
      ],
      composed: [
        '…すぐ戻るよ。心配いらない'
      ]
    },
    quiet: {
      _default: [
        '……ありがとうございます。戻ります'
      ],
      cool: [
        '…感謝する。必ず戻る'
      ],
      polite: [
        '…ご迷惑をおかけして申し訳ございません。必ず戻ります'
      ]
    },
    shy: {
      _default: [
        'すみません…ご迷惑をおかけして…必ず、戻ります…'
      ],
      polite: [
        'こ、こんな特別扱い…わたしなんかに、もったいないです…'
      ],
    },
    easygoing: {
      _default: [
        'やった〜！最新の治療ってやつですか！？'
      ],
      delinquent: [
        'おっ、最新の治療？ ラッキー！'
      ],
      seductive: [
        '最新の治療ね。早く良くなりそうだわ'
      ]
    },
    earnest: {
      _default: [
        'ありがとうございます…早く試合に戻りたいんです',
        'ご迷惑をおかけしてすみません…必ず戻ります'
      ],
      polite: [
        'ありがとうございます。一日も早く復帰いたします'
      ],
      ojousama: [
        'ご迷惑をおかけしまして…必ず戻りますわ'
      ],
      seductive: [
        'ありがとう…早く戻れるように頑張るわ'
      ],
      composed: [
        '…ありがとう。ちゃんと治して戻るから'
      ]
    },
    emotional: {
      _default: [
        'うう…治療してもらえるなんて…ありがとうございます…早く戻りたい…！'
      ],
      seductive: [
        '特別扱い……っ……ふふ、わたしだけ見てくれてるみたいで、嬉しい……'
      ],
    }
  },
  encourage: {
    normal: {
      _default: [
        'ありがとうございます…',
        'もう少し、頑張ってみます',
        'その言葉、嬉しかったです'
      ],
      ojousama: [
        '…ありがとうございます。もう少し、頑張ってみます'
      ],
      delinquent: [
        '…サンキュ。もうちょいやってみるわ'
      ],
      seductive: [
        '…ありがとう。もう少し、頑張ってみるわ'
      ],
      composed: [
        '…ありがとう。もう少しやってみるよ'
      ]
    },
    bold: {
      _default: [
        'こんなところで止まってられない！次は絶対やるから！',
        '…分かった。まだ諦めない'
      ],
      ojousama: [
        'こんなところで終わりませんわ！'
      ],
      delinquent: [
        '止まってられるかよ！次は絶対やってやる！'
      ],
      cool: [
        '…まだ終わっていない。やる'
      ],
      seductive: [
        '止まるつもりはないわ。見ていてね'
      ],
      composed: [
        '…まだ終わってないよ。やるだけやる'
      ]
    },
    quiet: {
      _default: [
        '………ありがとう、ございます'
      ],
      cool: [
        '……分かった'
      ],
      polite: [
        '…お言葉、ありがとうございます'
      ]
    },
    shy: {
      _default: [
        '…声をかけてもらえて…嬉しかったです…頑張ります…'
      ],
      polite: [
        'あ、ありがとうございます…そう言っていただけると、頑張れます…'
      ],
    },
    easygoing: {
      _default: [
        'うわー、しんみりした！でも元気出た！やってやる！',
        'よし！やってやる！'
      ],
      delinquent: [
        'おっしゃ！元気出た！やってやるわ！'
      ],
      seductive: [
        'ふふ、元気出ちゃった。やってみるわ'
      ]
    },
    earnest: {
      _default: [
        'ありがとうございます…もう一度、頑張ってみます！',
        'その言葉、すごく嬉しかったです。頑張ります！'
      ],
      polite: [
        'お言葉、ありがとうございます。もう一度頑張ります'
      ],
      ojousama: [
        'ありがとうございます…もう一度、頑張ってみますわ'
      ],
      seductive: [
        'ありがとう…もう一度、頑張ってみるわ'
      ],
      composed: [
        '…その言葉、ありがたいよ。もう少し踏ん張ってみる'
      ]
    },
    emotional: {
      _default: [
        '…っ！ありがとうございます…！もう一回…もう一回頑張ります…！'
      ],
      seductive: [
        '励まし……っ……ふふ、その言葉だけで、力が湧いてくるの……'
      ],
    }
  },
  encourage_high_trust: {
    normal: {
      _default: [
        'ずっと見てくれてたんですね…頑張ります！',
        'あなたに言われると、本当に力が出ます！'
      ],
      ojousama: [
        'ずっと見守ってくださったんですのね…その気持ちに、お応えしなくては'
      ],
      delinquent: [
        '…アンタに言われると、やんなきゃって思うんだよ'
      ],
      seductive: [
        'ずっと見てくれてたのね…嬉しい。頑張るわ'
      ],
      composed: [
        '…見てくれてたんだ。…悪くないね'
      ]
    },
    bold: {
      _default: [
        '信じてくれるなら、絶対やるよ！',
        '期待には必ず応える！'
      ],
      ojousama: [
        'あなたが信じているなら、応えてあげないとかしらね？'
      ],
      delinquent: [
        'アンタが信じてくれんなら、やってやるよ！'
      ],
      cool: [
        '…信じてくれるなら、応える'
      ],
      seductive: [
        'あなたが信じてくれるなら…絶対応えるわ'
      ],
      composed: [
        '…信じてくれるなら、応えないとね'
      ]
    },
    quiet: {
      _default: [
        '……ずっと、見てくれてたんですね'
      ],
      cool: [
        '…分かった。応える'
      ],
      polite: [
        '…ずっと見守ってくださったんですね。お応えします'
      ]
    },
    shy: {
      _default: [
        'ずっと…見てくれてたんですか…？ わ、私…頑張ります…！'
      ],
      polite: [
        'いつも気にかけてくださって…あ、あの、本当に感謝しています…'
      ],
    },
    easygoing: {
      _default: [
        'えへへ…見てくれてたんだ。もうちょっと頑張ろうかな！'
      ],
      delinquent: [
        '見てくれてたんだ？ じゃ、もうちょいやるか！'
      ],
      seductive: [
        '見てくれてたのね。嬉しいわ。もう少し頑張ってみるわ'
      ]
    },
    earnest: {
      _default: [
        'あなたに言われると、本当に力が出ます！もっと頑張れます！',
        'ずっと見てくれてたんですね…絶対に報いてみせます'
      ],
      polite: [
        'ずっと見守ってくださったんですね…必ずお報いいたします'
      ],
      ojousama: [
        'ずっと見てくださったんですのね…お報いしますわ'
      ],
      seductive: [
        'ずっと見てくれてたのね…絶対に報いるわ'
      ],
      composed: [
        '…ずっと見てくれてたんだ。…ありがとう。応えるよ'
      ]
    },
    emotional: {
      _default: [
        '…っ！ずっと見てくれてたんですね…！泣いちゃう…でも頑張る…！'
      ],
      seductive: [
        'あなたの言葉だけで……っ……わたし、何でもできちゃいそうなの……ふふ……'
      ],
    }
  },
  refresh_leave: {
    normal: {
      _default: [
        'ありがとうございます！行ってきます！',
        'ゆっくり休んで戻ってきます！',
        'ありがとうございます…少し、休みます'
      ],
      ojousama: [
        'ありがとうございます。リフレッシュして戻って参ります'
      ],
      delinquent: [
        'サンキュ！ちょっと休んでくるわ'
      ],
      seductive: [
        'ありがとう。リフレッシュしてくるわね'
      ],
      composed: [
        '…ありがとう。少し休んでくるよ'
      ]
    },
    bold: {
      _default: [
        'リフレッシュして、もっと上を目指す！',
        '充電して戻ってくる！'
      ],
      ojousama: [
        'すこし休んでまいりますわ。ごめんあそばせ。'
      ],
      delinquent: [
        '充電してくる！戻ったら全開だぜ！'
      ],
      cool: [
        '…充電してくる。戻ったら結果を出す'
      ],
      seductive: [
        'リフレッシュしてくるわ。戻ったらもっと輝くから'
      ],
      composed: [
        '…充電してくるよ。戻ったらまた行こう'
      ]
    },
    quiet: {
      _default: [
        '…少し、休みます。ありがとうございます'
      ],
      cool: [
        '…感謝する。少し休む'
      ],
      polite: [
        '…ありがとうございます。少し休ませていただきます'
      ]
    },
    shy: {
      _default: [
        'あの…休んでいいんですか…？ ありがとうございます…'
      ],
      polite: [
        'お休みを…？ あ、あの…ありがとうございます、ゆっくり休ませていただきます…'
      ],
    },
    easygoing: {
      _default: [
        'やった！バカンスだ！でも戻ったら本気出します！'
      ],
      delinquent: [
        'バカンスだー！戻ったら本気出すから！'
      ],
      seductive: [
        'バカンスね。リフレッシュして戻るわ'
      ]
    },
    earnest: {
      _default: [
        'え…でも練習が…でも、ありがとうございます！',
        '…そんなに気にかけてもらえるとは。ありがとうございます'
      ],
      polite: [
        '練習が気になりますが…お気遣いありがとうございます'
      ],
      ojousama: [
        '練習のことが気になりますけれど…お心遣い、ありがとうございますわ'
      ],
      seductive: [
        '練習が気になるけど…ありがとう。休んでくるわ'
      ],
      composed: [
        '…まあ、たまには休むのも大事だよね。ありがとう'
      ]
    },
    emotional: {
      _default: [
        '休んでいいんですか…？ ありがとうございます…リフレッシュしてきます…！'
      ],
      seductive: [
        '休暇……っ……気を遣ってくれたのね、ふふ、嬉しいわ……'
      ],
    }
  },
  special_treatment: {
    normal: {
      _default: [
        '専門の先生まで…ありがとうございます。早く戻ります',
        'こんなに気にかけていただけるなんて…必ず復帰します',
      ],
      polite: ['ご丁寧な治療を…ありがとうございます。一日でも早く戻ります'],
      ojousama: ['まあ…そこまでしてくださるなんて。早く戻りますわ'],
      composed: ['…ありがとう。リング、待たせちゃ悪いね'],
    },
    bold: {
      _default: [
        '早く戻る…！ こんなとこで止まってられない！',
        'すぐ治します！次の試合は絶対ものにする！',
      ],
      delinquent: ['しゃあ！すぐ治して暴れに戻るぜ！'],
      cool: ['…無駄にはしない。すぐ戻る'],
      composed: ['…早く戻るよ。ありがとう'],
    },
    quiet: {
      _default: ['…ありがとうございます。早く、戻ります'],
      cool: ['…感謝する。早く戻る'],
      polite: ['…そんなに気遣っていただいて。早く戻ります'],
    },
    easygoing: {
      _default: ['うわ、専門医まで…！ 早く戻りますね〜！'],
      delinquent: ['マジか！すぐ治してくる！'],
      seductive: ['ふふ、こんなに大事にされたら、頑張らなきゃ'],
    },
    earnest: {
      _default: [
        'こんなに気にかけてもらえるなんて…必ず期待に応えます',
        '…私のためにここまで…早く戻って、結果でお返しします',
      ],
      polite: ['…ご厚意に甘えます。必ず復帰してお返しいたします'],
      ojousama: ['そこまでお気遣いを…必ずや復帰してお応えしますわ'],
      composed: ['…そこまでしてくれるんだ。早く戻って返すよ'],
    },
    emotional: {
      _default: [
        '…っ、こんなにしてもらって…っ、絶対早く戻ります…！',
      ],
      seductive: ['そこまで…してくれるの…っ、嬉しい……早く戻るわ……'],
    },
  },
  party: {
    normal: {
      _default: [
        'お疲れ様でした〜！',
        'みんなで楽しく過ごせました！',
        'こういう時間、いいですね！',
        'リフレッシュできました！'
      ],
      ojousama: [
        '楽しいお時間でしたわ。それでは、ごきげんよう'
      ],
      delinquent: [
        'いえーい！カンパーイ！'
      ],
      seductive: [
        '楽しかったわ。こういう時間もいいわね'
      ],
      composed: [
        '…いい時間だったね。悪くないよ'
      ]
    },
    bold: {
      _default: [
        '楽しいけど…次の興行ではもっと結果を出す！',
        'いい雰囲気。チームが強くなってる証拠だね'
      ],
      ojousama: [
        '皆様の頑張りを、誇りに思いますわ'
      ],
      delinquent: [
        'カンパーイ！！ 今日は無礼講だ〜！'
      ],
      cool: [
        '…悪くない時間だった'
      ],
      seductive: [
        'いい雰囲気ね。チームが成長してる証拠だわ'
      ],
      composed: [
        '…いい雰囲気だね。こういうのも大事だよ'
      ]
    },
    quiet: {
      _default: [
        '……楽しかったです（小さく微笑んでいる）'
      ],
      cool: [
        '…悪くなかった'
      ],
      polite: [
        '…楽しいお時間でした。ありがとうございます'
      ]
    },
    shy: {
      _default: [
        'あ、あの…楽しかった、です…（隅で小さく笑っている）'
      ],
      polite: [
        'パ、パーティー…人が多いところは少し苦手ですけど…頑張って参加します…'
      ],
    },
    easygoing: {
      _default: [
        'カンパーイ！！ 今日は無礼講だ〜！',
        'もう一軒行きましょうよ〜！'
      ],
      delinquent: [
        'うぇーい！飲むぞ〜！'
      ],
      seductive: [
        'ふふ、みんないい顔してるわね'
      ]
    },
    earnest: {
      _default: [
        'みんなお疲れ様でした！明日からまた頑張ります！',
        'こうしてみんなで集まれるのが嬉しいです'
      ],
      polite: [
        '皆様、お疲れ様でした。明日からまた頑張りましょう'
      ],
      ojousama: [
        '皆様、お疲れ様ですわ。明日からまた頑張りましょうね'
      ],
      seductive: [
        'お疲れ様。また明日から頑張りましょうね'
      ],
      composed: [
        '…お疲れ様。こういう時間があるから、また頑張れるね'
      ]
    },
    emotional: {
      _default: [
        'みんな〜！楽しい〜！大好き〜！',
        'こういう時間…最高だよ…！'
      ],
      seductive: [
        'パーティー……っ……ふふ、今夜は思いっきり楽しませてもらうわ……'
      ],
    }
  },
  camp: {
    normal: {
      _default: [
        'しっかり鍛えてきます！',
        '頑張ります！',
        '良い合宿にしましょう！',
        '楽しみです！全力で取り組みます！'
      ],
      ojousama: [
        '合宿ですの？ 精一杯取り組みますわ'
      ],
      delinquent: [
        '合宿！ ガンガンやるぞ！'
      ],
      seductive: [
        '合宿ね。しっかり鍛えるわ'
      ],
      composed: [
        '…合宿か。じっくりやろう'
      ]
    },
    bold: {
      _default: [
        'ライバルに差をつけるチャンスだね！',
        '合宿から帰る頃には一回り強くなってやる！'
      ],
      ojousama: [
        'この合宿で一段上へ参りましょう'
      ],
      delinquent: [
        'やってやるぜ！帰る頃には別人だ！'
      ],
      cool: [
        '…鍛えさせてもらう。結果を出す'
      ],
      seductive: [
        '帰る頃には一回り強くなってるわよ'
      ],
      composed: [
        '…いい機会だね。しっかり追い込むよ'
      ]
    },
    quiet: {
      _default: [
        '……頑張ります'
      ],
      cool: [
        '…追い込む'
      ],
      polite: [
        '…精一杯、取り組みます'
      ]
    },
    shy: {
      _default: [
        'が、合宿…！ が、頑張ります…！'
      ],
      polite: [
        'が、合宿…ですか…緊張しますけど…頑張ります…!'
      ],
    },
    easygoing: {
      _default: [
        'うおー！！合宿だ！楽しみ！',
        '夜は枕投げだ！…嘘です、練習します'
      ],
      delinquent: [
        '合宿だー！ 盛り上がっていくぞー！'
      ],
      seductive: [
        '合宿楽しみ〜。みんなで頑張りましょ'
      ]
    },
    earnest: {
      _default: [
        'やった！思い切り練習できる！',
        '合宿の間に絶対レベルアップしてみせます！',
        'みんなで一緒に強くなれるなんて…最高です'
      ],
      polite: [
        '全力で取り組ませていただきます。レベルアップしてみせます'
      ],
      ojousama: [
        'みっちり鍛えていただきますわ！絶対に成長してみせますの'
      ],
      seductive: [
        '思い切り鍛えられるのね。楽しみだわ'
      ],
      composed: [
        '…みんなでやれるのはいいね。じっくり行こう'
      ]
    },
    emotional: {
      _default: [
        '合宿…！みんなで強くなれる…！最高だよ…！'
      ],
      seductive: [
        '合宿……っ……ふふ、みんなと一緒に過ごせるのね、楽しみ……'
      ],
    }
  }
};

// ============================================================================
// §3-2b: ドーム到達マイルストーンセリフ（D層 / dome-milestone-spec-v0.3 §5）
// 構造: [personality][archetype] = [3 lines]
//   personality: 7種 (normal / bold / quiet / easygoing / earnest / emotional / shy)
//   archetype:   7種 (_default=normal / ojousama / delinquent / cool / seductive / polite / composed)
// ============================================================================
const DOME_FIRSTSHOW_LINES = {
  normal: {
    _default: [
      'ここまで来られたのは、社長のおかげです',
      'やっと、この景色を見れますね',
      '…震えてます、正直'
    ],
    ojousama: [
      'ドームのリングに立てますこと、身に余る光栄ですわ',
      'このような大舞台、夢にまで見ましたのよ',
      '今日という日を、生涯忘れませんわ'
    ],
    delinquent: [
      'おい、ここがドームってやつか。デカいな',
      '…まぁ、悪くねえ気分だ',
      'ふん、やってやるよ。ドームだろうが同じだろ'
    ],
    cool: [
      'ドーム…ね。来たか',
      '…やることは、変わらない',
      '…準備はできてる'
    ],
    seductive: [
      'ふふっ、いよいよドームね',
      'この大舞台で…見せたいものがあるの',
      'ドームのお客様を…虜にしてあげる'
    ],
    polite: [
      'ドームで試合ができるなんて、本当に感謝しています',
      '今日という日を迎えられて、光栄です',
      '全力を尽くさせていただきます'
    ],
    composed: [
      'ドーム。…ついに辿り着きましたね',
      '感慨深いものがあります。しかし、今は試合に集中します',
      'この瞬間を、しっかり刻んでおきます'
    ]
  },
  bold: {
    _default: [
      '燃えてきたぜ、ドーム!! 全員ぶっ倒す!',
      'ここが一番いいとこだろ!? やってやんよ!',
      '観客全員、俺の試合に釘付けにしてやる!'
    ],
    ojousama: [
      'ドームですわよ!! 思い切り暴れますわ!',
      'ほほほ、わたくしの本気、ご覧に入れましょう!',
      'このリング、わたくしの独壇場にしてみせますわ!'
    ],
    delinquent: [
      'おうっ、ドームだろうが関係ねえ。ぶっ壊すだけだ',
      'ここが最後じゃねえ。まだ先、あるからな',
      '…全員ひっくり返してやる。見てろよ'
    ],
    cool: [
      'ドーム…上等だ',
      '…やる気は、あるぞ',
      '静かに、全力でいく'
    ],
    seductive: [
      'ドームで…本気の私、見せてあげる',
      'この大舞台、たっぷり熱くしてあげるわよ',
      'うふふ、今夜は容赦しないわよ'
    ],
    polite: [
      'ドームで戦えること、心から感謝しております!',
      '全力で、この舞台に恥じない試合をします!',
      'お客様の期待に、必ず応えてみせます!'
    ],
    composed: [
      'ドーム。燃える。それだけだ',
      '…やるべきことは分かってる。全力でぶつかる',
      'この闘志、ドームで解き放つ'
    ]
  },
  quiet: {
    _default: [
      '…ドーム、ですか',
      '…やります',
      '……(無言で頷く)'
    ],
    ojousama: [
      '…ドームですのね。…わかりましたわ',
      '…精一杯、務めますわ',
      '……'
    ],
    delinquent: [
      '…ドームかよ',
      '…やってやる',
      '……(リングを見つめる)'
    ],
    cool: [
      '…行きます',
      '…ドームか。悪くない',
      '……(視線だけで応える)'
    ],
    seductive: [
      '…いよいよね',
      '…見ていて',
      '……(静かに微笑む)'
    ],
    polite: [
      '…よろしくお願いします',
      '…精一杯、やらせていただきます',
      '…ありがとうございます'
    ],
    composed: [
      '…ドーム',
      '…準備は、できています',
      '……(静かに立っている)'
    ]
  },
  easygoing: {
    _default: [
      'いやー、ドーム来ちゃいましたねぇ',
      'なんだかんだ、楽しみですよ',
      'まぁ、いつも通りやりますかー'
    ],
    ojousama: [
      'あら、ドームですのね。なんだか楽しそうですわ',
      'まぁ気楽にいきますわよ、ほほほ',
      'こういう大きな会場、わたくし嫌いじゃありませんの'
    ],
    delinquent: [
      'おーっ、ドームか。まぁやるだけよ',
      'なんつーか、あんま緊張しねーな。やるべ',
      'いつも通りだろ。気楽に行こうぜ'
    ],
    cool: [
      '…ドーム。まぁいいか',
      '…普段通りにやるだけ',
      '特別なこと、しない'
    ],
    seductive: [
      'ふふっ、ドームって素敵な響きね',
      'のんびり楽しませてもらうわ',
      '気楽に、でもちゃんと色気は出すわよ'
    ],
    polite: [
      'ドーム、嬉しいですね。気負わずいきましょう',
      'お客様と一緒に楽しい時間を作れたら',
      'ゆったり構えて、精一杯やります'
    ],
    composed: [
      'ドーム、いいじゃないですか。いきましょう',
      'あまり肩に力を入れずに、でも全力で',
      'こういう日こそ、いつも通りが大事ですね'
    ]
  },
  earnest: {
    _default: [
      'ドームで試合をさせていただけること、感謝いたします',
      '全身全霊で、臨ませていただきます',
      'この機会、絶対に無駄にしません'
    ],
    ojousama: [
      'ドームのリングに立つ責任、重々承知しておりますわ',
      '団体の名に恥じぬ試合を、必ずいたしますわ',
      '精進の成果、すべてお見せいたしますわ'
    ],
    delinquent: [
      'おう、ドームだな。手は抜かねえぞ',
      '俺にとっちゃ、真剣勝負以外ありえねえ',
      '…感謝してんだよ、ここまで連れてきてくれて'
    ],
    cool: [
      'ドーム…ここで結果を出すのが務めです',
      '…油断は、しません',
      '最善を尽くします。それだけ'
    ],
    seductive: [
      '真剣勝負よ、今夜は',
      '満員のお客様の前で…燃えないわけがないでしょう',
      '…見ていてね、社長'
    ],
    polite: [
      'ドーム大会という大役、謹んでお受けいたします',
      '最後の最後まで、手を抜きません',
      'この恩に、必ず応えてみせます'
    ],
    composed: [
      'ドームのリングで、積み重ねてきたすべてを出します',
      '準備は、万全です',
      'この一戦、絶対に勝ちます'
    ]
  },
  emotional: {
    _default: [
      '…ドームまで来たんですね、私たち',
      '胸がいっぱいで…うまく言葉が出ません',
      '絶対に、絶対に良い試合にします!'
    ],
    ojousama: [
      '…来てしまいましたのね、ドームまで…',
      '胸が…胸がいっぱいですわ、社長',
      '泣いてなど…おりません、決して'
    ],
    delinquent: [
      'くそ…ドームだよ、ドーム…! くっそ燃えるじゃねえか!',
      '泣いてねーし! 俺はただ…嬉しいだけだ!',
      '絶対ぶっ壊すぜ、この試合! 魂込めてな!'
    ],
    cool: [
      '…ドーム、か',
      '…感情が、抑えきれない',
      '……(目を伏せる)'
    ],
    seductive: [
      '…ドームで、あなた方の前で戦える幸せよ…',
      '熱い試合を…必ず、約束する',
      'この胸の高鳴り…試合で発散させてね'
    ],
    polite: [
      'ドームで…ドームで試合ができるなんて…っ',
      '申し訳ありません、感極まってしまって…',
      '精一杯、この気持ちを試合に込めます!'
    ],
    composed: [
      'ドーム。…言葉になりません',
      '…この感情を、試合にぶつけます',
      'いい試合にします。絶対に'
    ]
  },
  shy: {
    _default: [
      '…あ、あの…ドームに、来られて、嬉しいです…',
      '…緊張します…でも、頑張ります…',
      '…皆さんのおかげ、です'
    ],
    ojousama: [
      '…あの、ドームは…あまりに大きくて、わたくし…',
      '…頑張り…ますわ…',
      '…応援、していてくださいませ…'
    ],
    delinquent: [
      '…お、おい…ドーム、マジでデカいな…',
      '…怖くねえし、ほんと…(声が小さい)',
      '…やるって、やるから…'
    ],
    cool: [
      '…ドーム…です',
      '…はい',
      '…頑張ります'
    ],
    seductive: [
      '…あの…ドーム、素敵…',
      '…皆様に、お見せできるのが、嬉しくて…',
      '…全力を、尽くす…ね'
    ],
    polite: [
      'あの…ありがとうございます、ここまで連れてきてくださって',
      '…精一杯、やります',
      '…この恩は、一生、忘れません'
    ],
    composed: [
      '…ドームに…立てるなんて…',
      '…頑張ります…静かに、でも全力で',
      '…ありがとうございます'
    ]
  }
};

const DOME_SELLOUT_LINES = {
  normal: {
    _default: [
      '満員…ですか。…信じられません',
      '社長…ありがとうございます。こんな景色、見せてもらって',
      'この光景、一生忘れません'
    ],
    ojousama: [
      '満員御礼、まさに奇跡のような景色ですわ…',
      'お客様の熱気、今も胸に残っておりますの',
      'この日のこと、生涯の誇りとしますわ'
    ],
    delinquent: [
      '…マジかよ、満員だって?',
      'くっそ、これがドーム満員ってやつか…',
      '…悪くねえな。…全然悪くねえ'
    ],
    cool: [
      '…満員',
      '…客の声が、まだ耳に残ってる',
      '…忘れない。この景色は'
    ],
    seductive: [
      '満員のお客様…今夜の私に、酔いしれてくれたのね',
      'うふふ…この達成感、格別ね',
      '忘れられない夜になったわ'
    ],
    polite: [
      '満員のお客様に感謝しかありません',
      '社長、本当にありがとうございます',
      'この恩は、これからの試合で返します'
    ],
    composed: [
      '満員。…団体として、一つの到達点ですね',
      'お客様の拍手、今も胸に響いています',
      'この記録、大切にしていきましょう'
    ]
  },
  bold: {
    _default: [
      'やったぜ!! ドーム満員だ!! うおおおお!',
      '全員立ち上がってくれてたぜ!! 最高だ!!',
      '次はもっと大きい舞台、作ろうぜ!!'
    ],
    ojousama: [
      '満員ですって!? 胸が熱くなりますわ!!',
      'お客様方の歓声、まだ耳に焼き付いておりますの!',
      'この勢い、止めてはなりませんわよ!!'
    ],
    delinquent: [
      '…全員、ひっくり返せた気がすんな。満員にしやがって',
      'くっそおおお、やってやったぜドーム満員!!',
      '…覚えとけよ、観客全員。またぶっ壊しに来るからな'
    ],
    cool: [
      '…満員。達成した',
      '…次は、もっと大きい会場を',
      '…悪くない気分だ'
    ],
    seductive: [
      '満員…最高の演出になったわね',
      'この熱量、また必ず味わいたい',
      'うふふ、皆様を虜にしてやったわ'
    ],
    polite: [
      '満員のお客様に、心から感謝します!!',
      '全力で戦った甲斐がありました!!',
      'この興奮、必ず次につなげます!!'
    ],
    composed: [
      '満員。…達成感しかない',
      '全力でやった。それが報われた',
      '次はもっと上を目指す'
    ]
  },
  quiet: {
    _default: [
      '…満員でした',
      '…ありがとう、ございます',
      '……(深く頭を下げる)'
    ],
    ojousama: [
      '…満員…感無量ですわ',
      '…皆様に、感謝を',
      '……'
    ],
    delinquent: [
      '…満員、かよ',
      '…悪くねえ',
      '……(深く息を吐く)'
    ],
    cool: [
      '…満員',
      '…忘れない',
      '……(遠くを見ている)'
    ],
    seductive: [
      '…満員ね',
      '…この景色、胸に',
      '……(静かに微笑む)'
    ],
    polite: [
      '…満員、ありがとうございました',
      '…感謝しか、ありません',
      '…深く、御礼申し上げます'
    ],
    composed: [
      '…満員',
      '…よかった。本当によかった',
      '……(しばし言葉を失う)'
    ]
  },
  easygoing: {
    _default: [
      'うわー、満員だって! びっくりしちゃった',
      'やりましたねー、本当に嬉しいです',
      'なんか、胸がじーんとしてます'
    ],
    ojousama: [
      'まぁ、満員ですのね! 嬉しゅうございますわ',
      'こんなに楽しい日は、なかなかありませんの',
      'ほほほ、またやりたくなりますわ'
    ],
    delinquent: [
      'マジで満員かよ! やっべ、嬉しくて笑えてきたわ',
      '観客全員ぶち上がってたな! 気持ち良かったぜ',
      'こういう日もあんだな、人生ってよ'
    ],
    cool: [
      '…満員。うん、よかった',
      '…気分がいい',
      '…また、こういう日を作りたい'
    ],
    seductive: [
      'ふふっ、満員って素敵な響きね',
      '皆様、私たちを愛してくれたのね',
      'こんな幸せな夜、他にないわ'
    ],
    polite: [
      '満員、嬉しいですね。本当に感謝です',
      'みなさんが来てくれたおかげですね',
      'ゆったりと喜びを噛みしめます'
    ],
    composed: [
      '満員。嬉しいですね、素直に',
      'いい日になりましたね',
      'お客様に、心から感謝です'
    ]
  },
  earnest: {
    _default: [
      '満員のお客様に応えられる試合ができたか、反省と感謝でいっぱいです',
      '社長、本当にありがとうございました',
      '次はもっと良い試合を、必ずお見せします'
    ],
    ojousama: [
      '満員のお客様、団体として誇らしい限りですわ',
      'この達成を糧に、さらに精進いたしますわ',
      '気を緩めず、次に備えますの'
    ],
    delinquent: [
      '満員か。…褒めてくれんのかよ、社長',
      '次も必ず満員にする。約束だ',
      '…ありがとな。…マジで'
    ],
    cool: [
      '満員。目標の一つは達成した',
      '…次の目標に向けて、動きます',
      '気を緩めません'
    ],
    seductive: [
      'お客様の熱気に、私も全力で応えたわ',
      'この記録、団体の誇りにしたい',
      '次はもっと多くのお客様を、虜にしてみせる'
    ],
    polite: [
      '満員のお客様、心より感謝申し上げます',
      '全力を尽くした甲斐がありました',
      '次も、必ず期待に応えます'
    ],
    composed: [
      '満員達成。事実を、しっかり受け止めます',
      'お客様の声援、次への糧とします',
      '精進を続けます。これで終わりではない'
    ]
  },
  emotional: {
    _default: [
      '満員って…満員って言いました? …涙が止まりません…!',
      '社長…本当に…本当にありがとうございます…!',
      'この日のこと、絶対に、絶対に忘れません!'
    ],
    ojousama: [
      '…満員…嘘のようですわ…本当に…',
      '胸が、胸がはちきれそうですの…',
      '…泣いてなど…おりませんのよ…!'
    ],
    delinquent: [
      'くっそ、満員だ…満員だ! 泣いてねーし! 泣いてねーから!',
      '…ありがとうな、観客ども…マジでさ…',
      '絶対次も満員にする! 絶対だ! 俺が誓う!'
    ],
    cool: [
      '…満員',
      '…(言葉にならない)',
      '……(静かに涙を拭う)'
    ],
    seductive: [
      '…満員、お客様の熱気…忘れられない',
      '胸が熱くて、震えが止まらないの',
      'こんな素敵な夜、生涯忘れない'
    ],
    polite: [
      '…満員…っ、申し訳ありません、涙が…',
      '社長…こんな日を迎えられて…本当に…!',
      'この感動、必ず次の試合に込めます!'
    ],
    composed: [
      '…満員。胸が、いっぱいです',
      '…落ち着かせてください、少しだけ',
      '…ありがとうございます、本当に'
    ]
  },
  shy: {
    _default: [
      '…ま、満員…ですか? …嘘みたい…',
      '…皆さん、来てくださって、本当に嬉しいです…',
      '…ありがとう、ございました…'
    ],
    ojousama: [
      '…満員…信じられませんわ…',
      '…皆様の応援、胸に、しみました…',
      '…本当に、ありがとう、ございます…'
    ],
    delinquent: [
      '…まじで、満員…? …うそ、だろ…',
      '…なんか、泣きそう…言わないでくださいよ…',
      '…ありがと、ございます…(小さな声で)'
    ],
    cool: [
      '…満員…',
      '…はい…',
      '…ありがとう…ございます…'
    ],
    seductive: [
      '…満員…? …嘘みたい…',
      '…お客様の声が、まだ耳に…',
      '…本当に、嬉しい…'
    ],
    polite: [
      '…満員、ありがとうございます…ありがとうございます…',
      '…こんな私を、応援してくださって…',
      '…この恩、一生忘れません…'
    ],
    composed: [
      '…満員、ですか…',
      '…(静かに涙を流す)',
      '…ありがとう、ございます…'
    ]
  }
};

// §3-3: 選択型イベントセリフ（S1〜S6, E1〜E6）— personality×archetype
const CHOICE_EVENT_DIALOGUES = {
  S1: {
    normal: {
      _default: [
        'タイトルマッチの機会をいただけませんか？'
      ],
      ojousama: [
        '王座への挑戦をお許しいただけませんこと？'
      ],
      delinquent: [
        'タイトルマッチ、組んでくれよ'
      ],
      seductive: [
        'タイトルマッチの機会、いただけないかしら'
      ],
      composed: [
        '…そろそろベルトに挑戦させてもらえないかな'
      ]
    },
    bold: {
      _default: [
        'チャンピオンの座が欲しい。今すぐ組んでよ',
        'ベルトを賭けた試合がしたい！'
      ],
      ojousama: [
        'チャンピオンの座、いただきに参りましょう'
      ],
      delinquent: [
        'ベルトよこせ！今すぐ組め！'
      ],
      cool: [
        '…ベルトが欲しい。組んでくれ'
      ],
      seductive: [
        'ベルトが欲しいの。組んでもらえる？'
      ],
      composed: [
        '…ベルト、狙わせてもらうよ。組んでくれる？'
      ]
    },
    quiet: {
      _default: [
        '……挑戦させてください'
      ],
      cool: [
        '…タイトルマッチを。頼む'
      ],
      polite: [
        '…タイトルマッチに挑戦させていただけますか'
      ]
    },
    shy: {
      _default: [
        'あ、あの…タイトルマッチ…挑戦させてもらえませんか…？'
      ],
      polite: [
        'あ、あの…ご相談したいことが…'
      ],
    },
    easygoing: {
      _default: [
        'ねえねえ、タイトルマッチ組んでよ！',
        'ベルト欲しいなー。挑戦させてくれない？'
      ],
      delinquent: [
        'タイトルマッチ組めよ！やる気あんだからさ！'
      ],
      seductive: [
        'ベルト、欲しくなっちゃった。挑戦させてくれない？'
      ]
    },
    earnest: {
      _default: [
        'ずっと準備してきました…チャンスをください',
        'タイトルマッチに挑ませてください！'
      ],
      polite: [
        'ずっと準備して参りました。チャンスをいただけませんか'
      ],
      ojousama: [
        'ずっと準備してまいりましたの。チャンスをいただけませんこと'
      ],
      seductive: [
        'ずっと準備してきたの。チャンスをちょうだい'
      ],
      composed: [
        '…準備はできてる。あとはチャンスだけだよ'
      ]
    },
    emotional: {
      _default: [
        'お願いします…！タイトルマッチに挑ませてください…！'
      ],
      seductive: [
        'ねえ……っ……ちょっと、聞いてほしいの……'
      ],
    }
  },
  S2: {
    normal: {
      _default: [
        '因縁のある相手と試合を組んでいただけませんか'
      ],
      ojousama: [
        'あの方との決着を、お許しいただけませんか？'
      ],
      delinquent: [
        'あいつとの試合、組んでくれよ'
      ],
      seductive: [
        'あの人との試合、組んでもらえないかしら'
      ],
      composed: [
        '…あの人との試合、そろそろ組んでもらえないかな'
      ]
    },
    bold: {
      _default: [
        'あの相手と戦わずにはいられない！早く試合を組んでくれ！',
        '決着をつけたい。あいつと戦う機会をちょうだい！'
      ],
      ojousama: [
        'あれとも決着をつけませんとね……'
      ],
      delinquent: [
        'あいつと決着つけさせろ！'
      ],
      cool: [
        '…決着をつけたい。組んでくれ'
      ],
      seductive: [
        'あの人と決着をつけたいの。組んでもらえる？'
      ],
      composed: [
        '…決着をつけたいんだ。組んでくれないかな'
      ]
    },
    quiet: {
      _default: [
        '……あの人と、戦わせてください'
      ],
      cool: [
        '…あいつとの試合を。頼む'
      ],
      polite: [
        '…あの方との対戦を、お願いできますか'
      ]
    },
    shy: {
      _default: [
        'あの…あの人と…試合させてもらえませんか…'
      ],
      polite: [
        'す、すみません…少しお時間いただけますか…'
      ],
    },
    easygoing: {
      _default: [
        'あの人との試合組んでよ！決着つけたいんだ！'
      ],
      delinquent: [
        'あいつとやらせろよ！ケリつけてやる！'
      ],
      seductive: [
        'あの人との試合、組んでくれない？ 決着つけたいの'
      ]
    },
    earnest: {
      _default: [
        'あの相手を越えてこそ、次のステージに行ける。組んでください'
      ],
      polite: [
        'あの方との試合を組んでいただけないでしょうか'
      ],
      ojousama: [
        'あの方を越えてこそですわ。組んでいただけませんこと'
      ],
      seductive: [
        'あの人を越えたいの。試合を組んでくれない？'
      ],
      composed: [
        '…あの人を越えないと先に進めない。頼むよ'
      ]
    },
    emotional: {
      _default: [
        'あの人と戦いたい…！お願いします…組んでください…！'
      ],
      seductive: [
        '時間、ある……っ……ふふ、ちょっとだけ付き合って……'
      ],
    }
  },
  S3: {
    normal: {
      _default: [
        '少し休養をいただけますか？'
      ],
      ojousama: [
        '少しお休みをいただけますかしら…'
      ],
      delinquent: [
        'ちょっと休ませてくれ…'
      ],
      seductive: [
        '少し休ませてもらえないかしら…'
      ],
      composed: [
        '…少し休ませてもらえるかな'
      ]
    },
    bold: {
      _default: [
        '…悔しいけど、体が限界みたい。少し休ませて'
      ],
      ojousama: [
        '…情けないけれど、もう、体が限界ですわね'
      ],
      delinquent: [
        'くそ…体がもう限界だ。休ませてくれ'
      ],
      cool: [
        '…限界だ。休む'
      ],
      seductive: [
        '…体が限界なの。少し休ませて'
      ],
      composed: [
        '…体が限界みたいだ。少し休むよ'
      ]
    },
    quiet: {
      _default: [
        '……少し、休ませてください'
      ],
      cool: [
        '…休む必要がある'
      ],
      polite: [
        '…申し訳ありません。少し休ませていただけますか…'
      ]
    },
    shy: {
      _default: [
        'あの…すみません…体が…少し休ませてもらえますか…'
      ],
      polite: [
        'あ、あの…どう答えたらいいか、わからなくて…'
      ],
    },
    easygoing: {
      _default: [
        'もう限界！ちょっと休まないとマジでやばい！'
      ],
      delinquent: [
        '無理！限界！休ませて！'
      ],
      seductive: [
        'ごめんね、ちょっと限界みたい。休ませてくれる？'
      ]
    },
    earnest: {
      _default: [
        '迷惑をかけてしまって申し訳ないんですが…少し休ませてもらえますか',
        'チームに迷惑はかけたくないんですが…体が限界で…'
      ],
      polite: [
        'ご迷惑をおかけしまして申し訳ございません…少しお休みをいただけますか'
      ],
      ojousama: [
        'チームにご迷惑はかけたくありませんのに…体が限界ですわ…'
      ],
      seductive: [
        '迷惑かけたくないんだけど…体が限界なの…'
      ],
      composed: [
        '…無理したくないんだ。少し休ませてもらえるかな'
      ]
    },
    emotional: {
      _default: [
        'ごめんなさい…体がもう…休ませてください…！'
      ],
      seductive: [
        '……っ……どう答えるのが正解なのかしら、ふふ……'
      ],
    }
  },
  S4_direct: {
    normal: {
      _default: [
        'このままでは限界です。待遇を改善していただけませんか'
      ],
      ojousama: [
        'このままでは困ります！お話し合いをさせてくださいまし'
      ],
      delinquent: [
        '不満だっつってんの。ちゃんと話し合おうぜ'
      ],
      seductive: [
        'このままじゃ困るわ。ちゃんと考えてもらえないかしら'
      ],
      composed: [
        '…このままだと困るんだよね。少し考えてもらえるかな'
      ]
    },
    bold: {
      _default: [
        'このままじゃ納得できない。改善してくれないなら移籍を考えるからね',
        '私の実力を発揮できていない。ここにいる意味はあるのかな'
      ],
      ojousama: [
        'このままでは納得できませんわね。……どうするか、考えなさいね？'
      ],
      delinquent: [
        'こんなんじゃやってらんねーよ！改善しろ！'
      ],
      cool: [
        '…このままでは先がない。考えてくれ'
      ],
      seductive: [
        'このままじゃ我慢の限界よ。考え直してもらえない？'
      ],
      composed: [
        '…このままだと先がないよ。考え直してくれないかな'
      ]
    },
    quiet: {
      _default: [
        '………（険しい目でこちらを見つめている）'
      ],
      cool: [
        '……もう、限界だ（静かに、しかし断固として）'
      ],
      polite: [
        '…申し訳ありません。ただ…このままでは…'
      ]
    },
    shy: {
      _default: [
        '…あの…ごめんなさい…でも…このままだと…'
      ],
      polite: [
        'は、はっきり言わせていただきます…わたしは…'
      ],
    },
    easygoing: {
      _default: [
        'ぶっちゃけ不満です！ちゃんと話し合いましょう！'
      ],
      delinquent: [
        'もう無理！ちゃんと話し合えよ！'
      ],
      seductive: [
        'ぶっちゃけ、不満があるの。ちゃんと話しましょう？'
      ]
    },
    earnest: {
      _default: [
        '…ずっと我慢してきました。でも、このままでは…',
        '私の目標を達成できる環境が必要です。考え直してもらえませんか'
      ],
      polite: [
        'ずっと我慢して参りましたが…このままでは限界です'
      ],
      ojousama: [
        'これまで耐えてまいりましたけれど…もう限界ですわ'
      ],
      seductive: [
        'ずっと我慢してきたの。でも、もう限界よ'
      ],
      composed: [
        '…ずっと黙ってたけど、そろそろ限界だよ'
      ]
    },
    emotional: {
      _default: [
        '…もう…無理です…！このままだと…私…！'
      ],
      seductive: [
        'はっきり言うわ……っ……わたしの気持ちは……'
      ],
    }
  },
  S4_silent: {
    normal: {
      _default: [
        '（沈黙）…いえ、何でもないです'
      ]
    },
    bold: {
      _default: [
        '…………（拳を握りしめている）'
      ]
    },
    quiet: {
      _default: [
        '…………（小さくため息をつき、視線を逸らす）'
      ],
      cool: [
        '……（何も言わず、立ち去ろうとする）'
      ],
      polite: [
        '………（目を伏せて、何かを堪えるように唇を噛む）……'
      ]
    },
    shy: {
      _default: [
        '…………（目を逸らして、何も言えずにいる）'
      ],
      polite: [
        '………あの…なにも、言えません…'
      ],
    },
    easygoing: {
      _default: [
        'あはは…いや、なんでも…（笑っているが目が笑っていない）'
      ]
    },
    earnest: {
      _default: [
        '…………（何か言いたげに口を開きかけ、止める）'
      ]
    },
    emotional: {
      _default: [
        '……っ（泣くのを堪えるように唇を噛んでいる）'
      ],
      seductive: [
        '………っ……言葉にならないの……ふふ……'
      ],
    }
  },
  S5: {
    normal: {
      _default: [
        '特訓する時間をいただけませんか？'
      ],
      ojousama: [
        '特訓の時間をいただけませんこと？'
      ],
      delinquent: [
        '特訓させてくれ。もっと強くなりてえ'
      ],
      seductive: [
        '特訓させてもらえないかしら？'
      ],
      composed: [
        '…少し追い込みたいんだ。特訓させてもらえるかな'
      ]
    },
    bold: {
      _default: [
        'もっと上を目指したい。特訓させて！',
        '今燃えてるの！とことんやらせて！'
      ],
      ojousama: [
        'もっと上を目指す為に。特訓が必要ね…'
      ],
      delinquent: [
        'もっと強くなりてぇ！特訓させろ！'
      ],
      cool: [
        '…特訓させてくれ。もっと強くなる'
      ],
      seductive: [
        'もっと強くなりたいの。特訓させてもらえる？'
      ],
      composed: [
        '…もう少し上に行きたい。特訓させてくれないかな'
      ]
    },
    quiet: {
      _default: [
        '……特訓、させてください'
      ],
      cool: [
        '…鍛えたい。場所を貸してくれ'
      ],
      polite: [
        '…特訓をさせていただけますか'
      ]
    },
    shy: {
      _default: [
        'あの…特訓…させてもらえませんか…？ もっと強くなりたいんです…'
      ],
      polite: [
        '考えさせて…いただけますか…？'
      ],
    },
    easygoing: {
      _default: [
        '特訓したい！もっと強くなりたいんだ！'
      ],
      delinquent: [
        '特訓すんぞ！もっと強くなりてーんだよ！'
      ],
      seductive: [
        '特訓したいの。もっと強くなりたくて'
      ]
    },
    earnest: {
      _default: [
        'もっと強くなりたいんです。特訓を許可してください！'
      ],
      polite: [
        'もっと強くなりたいのです。特訓をお許しいただけますか'
      ],
      ojousama: [
        'もっと強くなりたいですの。特訓のお許しをいただけませんこと'
      ],
      seductive: [
        'もっと強くなりたいの。特訓させてもらえる？'
      ],
      composed: [
        '…まだ伸びしろはあるはずなんだ。やらせてほしい'
      ]
    },
    emotional: {
      _default: [
        'お願いします…！特訓させてください…！もっと、もっと強くなりたい…！'
      ],
      seductive: [
        '少し考えさせて……っ……ふふ、すぐには決められないの……'
      ],
    }
  },
  S6: {
    normal: {
      _default: [
        '後輩の指導を担当させてもらえませんか？'
      ],
      ojousama: [
        '後輩のお世話は、私にお任せください'
      ],
      delinquent: [
        '後輩の面倒、見させてくれよ'
      ],
      seductive: [
        '後輩の指導、私にやらせてもらえないかしら'
      ],
      composed: [
        '…後輩の面倒、見させてもらえないかな'
      ]
    },
    bold: {
      _default: [
        '若い子たちの面倒を見させてよ。それが私の役目だと思うから'
      ],
      ojousama: [
        '若手の面倒を見るのも、私の務めですわね'
      ],
      delinquent: [
        '後輩の面倒は任せろ。鍛えてやる'
      ],
      cool: [
        '…後輩を見る。任せてくれ'
      ],
      seductive: [
        '後輩の面倒、見させてもらえるかしら？'
      ],
      composed: [
        '…後輩に伝えておきたいことがあるんだ。任せてくれないかな'
      ]
    },
    quiet: {
      _default: [
        '……後輩に、伝えたいことがあるんです'
      ],
      cool: [
        '…次の世代に、繋ぎたいものがある'
      ],
      polite: [
        '…後輩のご指導を、担当させていただけますか'
      ]
    },
    shy: {
      _default: [
        'あの…私でよければ…後輩の子たちに…何か伝えられたら…'
      ],
      polite: [
        '決めました…これで、いいんですよね…？'
      ],
    },
    easygoing: {
      _default: [
        '後輩の面倒見させてよ！楽しそうだし！'
      ],
      delinquent: [
        '後輩の面倒見るわ！任せとけ！'
      ],
      seductive: [
        '後輩の子たち、かわいいわよね。面倒見させてもらえない？'
      ]
    },
    earnest: {
      _default: [
        '私が培ってきたものを、後輩に伝えたいと思って…',
        '後輩に何かを伝えたいんです。指導の機会をもらえますか'
      ],
      polite: [
        '培ってきたものを後輩にお伝えしたいのです'
      ],
      ojousama: [
        '私が学んできたことを、後輩にお伝えしたいと思いまして…'
      ],
      seductive: [
        '培ってきたものを、次の子たちに伝えたいの'
      ],
      composed: [
        '…次の世代に繋げたいものがあるんだ。やらせてほしい'
      ]
    },
    emotional: {
      _default: [
        '後輩の子たちに…私にできることがあるなら…やらせてください！'
      ],
      seductive: [
        '決めたわ……っ……ふふ、これがわたしの答えよ……'
      ],
    }
  },
  E1: {
    normal: {
      _default: [
        'メディアへの出演、ご検討いただけますか？',
        '出演のお話をいただきました。やってみたいです'
      ],
      ojousama: [
        'メディアのお話ですの？ ぜひお受けしたいですわ'
      ],
      delinquent: [
        'テレビ出れんの？ やるやる！'
      ],
      seductive: [
        'メディア出演のお話？ 楽しみだわ'
      ],
      composed: [
        '…メディアか。いい機会だね'
      ]
    },
    bold: {
      _default: [
        'この露出を足がかりに、もっと大きな舞台へ進みたい',
        '私が出れば注目されるのは当然。楽しみにしてるよ'
      ],
      ojousama: [
        '私が出ればお客様も喜ぶでしょうね。楽しみだわ…'
      ],
      delinquent: [
        'やってやるぜ！注目されんのは大歓迎だ！'
      ],
      cool: [
        '…いい機会だ。出る'
      ],
      seductive: [
        '注目される場は好きよ。もちろんやるわ'
      ],
      composed: [
        '…悪くないね。いつも通りやるよ'
      ]
    },
    quiet: {
      _default: [
        '…出演のお話、ですか…頑張ります'
      ],
      cool: [
        '……やる'
      ],
      polite: [
        '…出演のお話でしょうか。精一杯努めます'
      ]
    },
    shy: {
      _default: [
        'え…テレビ…？ わ、私なんかが…で、でもやってみたいです…'
      ],
      polite: [
        'あ、あの…どうしたら、いいんでしょうか…'
      ],
    },
    easygoing: {
      _default: [
        'ファンのみなさんに、もっと近くで私を見てもらいたい！',
        'テレビ！？ やった！出たい！'
      ],
      delinquent: [
        'テレビ出んの！？ 最高じゃん！'
      ],
      seductive: [
        'ファンのみんなにもっと見てもらえるのね。嬉しいわ'
      ]
    },
    earnest: {
      _default: [
        'テレビは緊張しますけど…精一杯やります！'
      ],
      polite: [
        '緊張いたしますが…精一杯務めさせていただきます'
      ],
      ojousama: [
        'テレビは緊張いたしますけれど…精一杯やらせていただきますわ'
      ],
      seductive: [
        '緊張するけど…精一杯やるわ'
      ],
      composed: [
        '…緊張はしないよ。いつも通りやればいい'
      ]
    },
    emotional: {
      _default: [
        'テレビ…！？ えっ…嬉しい…！頑張ります…！'
      ],
      seductive: [
        '……っ……どうしようかしら、ふふ、迷っちゃうわね……'
      ],
    }
  },
  E4: {
    normal: {
      _default: [
        '新たなスカウト情報が届きました'
      ]
    },
  
  shy: {
    polite: [
      'え、ええと…そ、その件は…'
    ]
  },
},
  E6: {
    normal: {
      _default: [
        '他の団体からオファーが来ています'
      ],
      ojousama: [
        '他の団体からお話がございましたの…'
      ],
      delinquent: [
        '他所から話来てんだけど'
      ],
      seductive: [
        '他の団体からお誘いが来てるの'
      ],
      composed: [
        '…他所から話が来てるんだ。一応報告しておくね'
      ]
    },
    bold: {
      _default: [
        '…本当のことを言うと、いい条件だと思ってる',
        '他所から話が来た。考えてもいいでしょ？'
      ],
      ojousama: [
        '…正直に申しますと、良い条件ですわ'
      ],
      delinquent: [
        '他所からいい話来てんだよ。考えさせてくれ'
      ],
      cool: [
        '…他から話が来た。条件は悪くない'
      ],
      seductive: [
        '他所からいい話が来てるの。正直、迷ってるわ'
      ],
      composed: [
        '…悪くない条件なんだよね。…少し考えてもいいかな'
      ]
    },
    quiet: {
      _default: [
        '………他から、話が（小さな声で）'
      ],
      cool: [
        '…他所から来た。報告する'
      ],
      polite: [
        '…他の団体様からお話が…報告しておきます'
      ]
    },
    shy: {
      _default: [
        'あの…他の団体から…その…どうしたらいいか分からなくて…'
      ],
      polite: [
        'は、はい…わかりました…やってみます…'
      ],
    },
    easygoing: {
      _default: [
        'マジで！？ 他の団体が私を欲しいって！？ ちょっと嬉しいかも…'
      ],
      delinquent: [
        '他所から話来たんだけど！ちょっと嬉しくね？'
      ],
      seductive: [
        '他所からお誘いが来ちゃった。ちょっと嬉しいかも'
      ]
    },
    earnest: {
      _default: [
        'こちらに義理があるので断りましたが…報告しておきます',
        'みんなと離れたくない気持ちはあるけど…正直、迷ってます'
      ],
      polite: [
        'こちらに義理がございますので…ただ、ご報告だけは'
      ],
      ojousama: [
        'こちらへの義理がございますから…でも、ご報告だけはと思いまして'
      ],
      seductive: [
        '義理があるから断ったけど…報告はしておくわね'
      ],
      composed: [
        '…義理があるから断ったよ。でも、一応報告だけね'
      ]
    },
    emotional: {
      _default: [
        '他の団体からオファーが…どうしよう…迷ってる…'
      ],
      seductive: [
        'いいわよ……っ……ふふ、やってみせるわ……'
      ],
    }
  },
  S_boycott: {
    normal: {
      _default: [
        '……今日は練習する気分じゃないです',
        '……すみません、今日は帰ります'
      ],
      ojousama: [
        '今日はお稽古をお休みさせていただきますわ…理由は…ご想像にお任せしますわ'
      ],
      delinquent: [
        '練習？やる意味あんの？出してもらえねぇんじゃ同じだろ'
      ],
      cool: [
        '…………（荷物をまとめて帰ろうとしている）'
      ],
      seductive: [
        'ごめんなさいね…今日はちょっと、気持ちが入らなくて'
      ],
      composed: [
        '…今日はいいかな。少し考えたいことがあって'
      ]
    },
    bold: {
      _default: [
        '練習？出してもくれないのに何の意味があるのよ？',
        'リングに上がれないなら練習しても仕方ないでしょ'
      ],
      delinquent: [
        'はぁ？やる気出ないっつの。文句あんなら試合組めよ'
      ]
    },
    quiet: {
      _default: [
        '…………（黙って道場を出ていこうとしている）',
        '……すみません…今日は……'
      ],
      cool: [
        '………（静かにテーピングを外している）'
      ]
    },
    easygoing: {
      _default: [
        'あはは…今日はちょっとサボりまーす…',
        '練習ねぇ…うーん、今日はパスで'
      ]
    },
    earnest: {
      _default: [
        'すみません…今日はどうしても体が動かなくて…',
        '練習に集中できなくて…申し訳ありません'
      ],
      polite: [
        '大変申し訳ございません…今日はどうしても…'
      ]
    },
    emotional: {
      _default: [
        'もう無理…練習なんてできない…',
        '出してもらえないのに練習して…何になるの…'
      ],
      seductive: [
        '……っ……これは認められないわ、悪いけど……'
      ],
    },
  
  shy: {
    polite: [
      'あ、あの…これは、納得できません…'
    ]
  },
},
  S_grumble: {
    normal: {
      _default: [
        '（ロッカールームで不満を漏らしている…周囲に伝播し始めた）'
      ],
      ojousama: [
        '（控室で「あの方の采配、少しおかしくなくて？」と囁いている）'
      ],
      delinquent: [
        '（「マジふざけんな」とロッカーを蹴る音が聞こえてきた）'
      ],
      cool: [
        '（無言で佇んでいるが、周囲が気を遣って重い空気になっている）'
      ],
      seductive: [
        '（「最近、ここにいる意味あるのかしら」と同僚に漏らしている）'
      ],
      composed: [
        '（いつもの穏やかさが消え、「…ま、そういうことだよね」と静かに呟いている）'
      ]
    },
    bold: {
      _default: [
        '（「なんで私たちがこんな扱い受けなきゃいけないんだ」と大声で言っている）'
      ]
    },
    quiet: {
      _default: [
        '（黙っているが、その沈黙がかえって周囲を不安にさせている）'
      ]
    },
    easygoing: {
      _default: [
        '（いつもの笑顔が消え、「ちょっとさぁ…」と珍しく愚痴をこぼしている）'
      ]
    },
    earnest: {
      _default: [
        '（「自分、このままでいいんですかね…」と後輩に弱音を吐いている）'
      ]
    },
    emotional: {
      _default: [
        '（涙ぐみながら「もう限界かも…」とチームメイトに打ち明けている）'
      ],
      seductive: [
        '正直に言うわね……っ……ちょっと不満なの……'
      ],
    },
  
  shy: {
    polite: [
      'すみません…少し、不満があります…'
    ]
  },
},
  S_sns: {
    normal: {
      _default: [
        '（SNSに「自分の居場所はどこなんだろう」と意味深な投稿）'
      ],
      ojousama: [
        '（SNSに「窮屈な場所からは、いつでも出ていけますの」と投稿）'
      ],
      delinquent: [
        '（SNSに「もう我慢の限界」と不穏な投稿）'
      ],
      cool: [
        '（SNSに風景写真と「遠くへ」とだけ投稿。ファンがざわついている）'
      ],
      seductive: [
        '（SNSに「次のステージが待っているかも」と匂わせ投稿）'
      ],
      composed: [
        '（SNSに夕焼けの写真と「…少し考える時間が欲しいかな」と投稿。ファンがざわついている）'
      ]
    },
    bold: {
      _default: [
        '（SNSに「このまま終わるつもりはない」と宣言的な投稿）'
      ]
    },
    quiet: {
      _default: [
        '（SNSに「…」とだけ投稿。ファンの間で憶測が広がっている）'
      ]
    },
    easygoing: {
      _default: [
        '（SNSに「最近ちょっと考えることがあってー」と珍しく真面目な投稿）'
      ]
    },
    earnest: {
      _default: [
        '（SNSに「自分は本当にここで必要とされているのか」と率直な投稿）'
      ]
    },
    emotional: {
      _default: [
        '（SNSに涙の絵文字と「もうダメかもしれない」と投稿。炎上し始めている）'
      ],
      seductive: [
        'SNS見たわ……っ……ふふ、勝手な人たちね……'
      ],
    },
  
  shy: {
    polite: [
      'え、SNSで…そんな風に書かれてしまって…'
    ]
  },
}
};

// §13.5: P-自発的残留セリフ（trust 75+で契約交渉スキップ）
const VOLUNTARY_STAY_LINES = {
  normal: {
    _default: ['残ります。ここが自分の居場所ですから'],
    ojousama: ['わたくし、こちらに残らせていただきますわ。ここが一番輝ける場所ですもの'],
    delinquent: ['どこにも行かねーよ。ここが一番おもしれーからな'],
    cool: ['（静かにうなずいている）……ここにいる'],
    seductive: ['あら、他に行く場所なんてないわ。ここが好きなの'],
    polite: ['残らせていただきます。ここが、わたくしの居場所ですから'],
    composed: ['…ま、居心地いいからね。ここにいるよ'],
  },
  bold: {
    _default: ['他の所に行く理由もないし……ここで頂点を目指すよ！'],
    delinquent: ['行くわけねーだろ。ここで一番になるまで帰らねぇよ'],
    polite: ['残ります。ここで頂点を目指させていただきますから'],
    ojousama: ['こちらに残りますわ。頂点は、わたくしのものなのだから。'],
    seductive: ['残るわ。ここで一番になるって決めたの'],
    composed: ['…行く理由がないね。ここで続けるよ'],
  },
  quiet: {
    _default: ['………（静かにうなずいている）'],
    cool: ['…………（契約書にペンを走らせた）'],
    polite: ['……残ります。ここで、続けさせてください'],
    seductive: ['……残るわ。ここが、いい'],
    composed: ['……ここで。…うん'],
  },
  shy: {
    _default: ['あ、あの…残らせてください…ここが、好きなので…'],
    polite: ['あ、あの…残らせていただけますか…ここが、好きで…'],
  },
  easygoing: {
    _default: ['いやー当然残るでしょ！ここ楽しいもん！'],
    polite: ['残らせていただきますね!ここ、すごく楽しいんです!'],
    ojousama: ['わたくし、こちらに残りますわ!ここ、とっても楽しいんですもの!'],
    seductive: ['残るわよ~。ここ、結構気に入ってるの♪'],
    delinquent: ['残るぜ!ここの雰囲気、気に入ってるからな!'],
    composed: ['まあ…ここが一番しっくりくるかな'],
  },
  earnest: {
    _default: ['来年も精一杯頑張ります。よろしくお願いします'],
    polite: ['来年もどうぞよろしくお願いいたします。精進してまいります'],
    ojousama: ['こちらに残らせていただきますわ。精進を続けさせてくださいませ'],
    seductive: ['残るわ。ここで、もっと強くなりたいの'],
    composed: ['…来年もよろしく。やれることをやるだけだよ'],
  },
  emotional: {
    _default: ['ここで戦えることが幸せなんです…（涙）'],
    seductive: ['残るわ…っ…ここが、わたしの…大切な場所だから…'],
    composed: ['…ここが好きだから。…それだけだよ'],
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
    { text: '⚔️ {orgName}から挑戦状', detail: '{orgName}が「実力を見せてやる」と挑戦状を叩きつけてきた。' },
    { text: '⚔️ {orgName}が宣戦布告', detail: '{orgName}の代表が公の場でこちらの団体を挑発。挑戦状で決着をつけようと迫ってきた。' },
    { text: '⚔️ {orgName}の選手が記者会見で挑発', detail: '{orgName}の選手がメディアの前でこちらの団体名を出し、「いつでも受けて立つ」と公開挑戦状を叩きつけた。' },
    { text: '⚔️ {orgName}から果たし状が届いた', detail: '{orgName}から正式な書面が届いた。「団体の威信をかけて一騎打ちを行いたい」——無視するわけにはいかない雰囲気だ。' },
    { text: '⚔️ {orgName}が興行に乗り込んできた', detail: 'こちらの興行会場に{orgName}の関係者が姿を見せ、「リングで語り合おう」と挑戦状を突きつけてきた。' },
  ],
  B4: {
    youngStar: [
      { text: '📺 {outletName}から若手特集の申し入れ', detail: '{outletName}が「次世代のスターを追いかけたい」と密着取材を申し出ている。' },
      { text: '📺 {outletName}が注目の新星を追いたいと打診', detail: '{outletName}のディレクターが「若い才能に密着したい」と話を持ちかけてきた。' },
      { text: '📺 {outletName}の「若手発掘」企画にうちの選手が候補に', detail: '「プロレス界の未来を担う若手を追う」——{outletName}からそんな企画の依頼が来た。' },
    ],
    ace: [
      { text: '📺 {outletName}がエース密着企画を提案', detail: '{outletName}が「団体の顔に密着したい」とドキュメンタリー企画を持ち込んできた。' },
      { text: '📺 {outletName}から「頂点の景色」取材オファー', detail: '{outletName}が「頂点に立つ選手の日常を追いたい」と密着取材を打診してきた。' },
      { text: '📺 {outletName}がトップ選手の特集を企画中', detail: '「団体を背負うエースに迫る」——{outletName}からそんなオファーが届いた。推薦する選手を選んでほしいという。' },
    ],
    veteran: [
      { text: '📺 {outletName}がベテラン特集を企画', detail: '{outletName}が「長く戦い続ける選手の矜持に迫りたい」と密着取材を申し出ている。' },
      { text: '📺 {outletName}から「キャリアの深み」取材依頼', detail: '{outletName}のプロデューサーが来訪。「経験豊富な選手の素顔を追いたい」とのこと。' },
      { text: '📺 {outletName}が「円熟の技」ドキュメントを提案', detail: '「ベテランだからこそ見える景色がある」——{outletName}からそんなテーマの企画が持ち込まれた。' },
    ],
  },
  // B4タレント活動: activityType別テキスト
  B4_cm: [
    { text: '📸 {outletName}からCM出演の打診', detail: '{outletName}から「選手をCMの顔として起用したい」と打診が来た。' },
    { text: '📸 {outletName}がCMキャストを探している', detail: '「プロレスラーのカッコよさをCMで表現したい」——{outletName}からそんな依頼が届いた。' },
    { text: '📸 {outletName}のCM出演オファー', detail: '{outletName}のプロデューサーが来訪。「うちの団体の選手を広告塔に使いたい」とのこと。' },
  ],
  B4_gravure: [
    { text: '📷 {outletName}からグラビア撮影の依頼', detail: '{outletName}が「プロレスラーの魅力をグラビアで届けたい」と申し出てきた。' },
    { text: '📷 {outletName}がグラビア特集企画を検討', detail: '「女子プロレスラーの素顔に迫りたい」——{outletName}からそんな企画の打診が来た。' },
    { text: '📷 {outletName}からグラビア出演のオファー', detail: '{outletName}の編集長から直接連絡が入った。「ぜひ選手を誌面に起用したい」とのこと。' },
  ],
  B4_variety: [
    { text: '📺 {outletName}からバラエティ出演のオファー', detail: '{outletName}が「プロレスラーがゲスト出演するコーナーを作りたい」と打診してきた。' },
    { text: '📺 {outletName}がゲスト出演の候補を探している', detail: '「面白いキャラクターのプロレスラーを探している」——{outletName}からそんな依頼が届いた。' },
    { text: '📺 {outletName}のトーク番組に出演依頼', detail: '{outletName}のディレクターが来訪。「選手のキャラクターを全国に届けたい」とのこと。' },
  ],
  B4_brand: [
    { text: '🤝 {outletName}からコラボ商品の提案', detail: '{outletName}が「選手とのコラボ商品を作りたい」と申し出てきた。' },
    { text: '🤝 {outletName}がコラボパートナーを探している', detail: '「プロレスのパワーとブランドのスタイルを組み合わせたい」——{outletName}からそんな話が来た。' },
    { text: '🤝 {outletName}とのコラボ企画の打診', detail: '{outletName}の担当者が来訪。「選手のイメージを商品に落とし込みたい」とのこと。' },
  ],
  B4_fashion: [
    { text: '👗 {outletName}のランウェイ出演オファー', detail: '{outletName}が「アスリートのランウェイ参加を企画している」と打診してきた。' },
    { text: '👗 {outletName}がファッションショー出演者を募集', detail: '「プロレスラーの迫力をランウェイで表現したい」——{outletName}からそんな話が届いた。' },
    { text: '👗 {outletName}のコレクションへの参加依頼', detail: '{outletName}のデザイナーが来訪。「ぜひ選手にランウェイを歩いてほしい」とのこと。' },
  ],
  B4_fan: [
    { text: '🎤 ファンイベント開催の打診', detail: '主催者から「選手とファンが直接交流できるイベントを開きたい」と相談が来た。' },
    { text: '🎤 サイン会・トークショーの開催依頼', detail: '「ファンと選手が触れ合える機会を作りたい」——イベント会社からそんな提案が届いた。' },
    { text: '🎤 ファンミーティングの企画提案', detail: '「選手の素顔をファンに見せる場を作りたい」と主催者から打診があった。' },
  ],
};

const LARGE_EVENT_DIALOGUES = {
  B1: {
    normal: {
      _default: [
        '…痛みが引くまで少し時間がかかりそうです'
      ],
      ojousama: [
        '少しお時間をいただくことになりそうですわ…'
      ],
      delinquent: [
        'いてて…やっちまった。すぐ戻るから'
      ],
      seductive: [
        '…少し時間がかかりそう。ごめんなさいね'
      ],
      composed: [
        '…やっちゃったね。まあ、焦らず治すよ'
      ]
    },
    bold: {
      _default: [
        'くそっ…こんなところで足を止めるわけにはいかないのに',
        '大丈夫。この程度…すぐ直るから'
      ],
      ojousama: [
        'こんなところで止まるわけにはいかないわ…'
      ],
      delinquent: [
        'くそっ…こんなとこで止まってらんねえ！'
      ],
      cool: [
        '…すぐ戻る。問題ない'
      ],
      seductive: [
        'こんなところで止まるつもりはないわ…すぐ戻る'
      ],
      composed: [
        '…まあ、こういうこともあるよ。少し待ってて'
      ]
    },
    quiet: {
      _default: [
        '……すみません'
      ],
      cool: [
        '…すぐ戻る'
      ],
      polite: [
        '…申し訳ございません。すぐに戻ります'
      ]
    },
    shy: {
      _default: [
        'す、すみません…ご迷惑を…早く治します…'
      ],
      polite: [
        'あ、あの…これから、頑張りたいことがあります…'
      ],
    },
    easygoing: {
      _default: [
        'いてて…やっちゃいました。でも根性で治します！'
      ],
      delinquent: [
        'いった！やっちまったけど、すぐ治すから！'
      ],
      seductive: [
        'あら、やっちゃった…でもすぐ治すわ'
      ]
    },
    earnest: {
      _default: [
        'すみません…もっと注意するべきでした。早く復帰できるよう頑張ります'
      ],
      polite: [
        '申し訳ございません…一日も早く復帰いたします'
      ],
      ojousama: [
        'もっと気をつけるべきでしたわ…早く復帰して見せますの'
      ],
      seductive: [
        'ごめんなさい…早く戻れるように頑張るわ'
      ],
      composed: [
        '…不注意だったね。きちんと治して、ちゃんと戻るよ'
      ]
    },
    emotional: {
      _default: [
        'ごめんなさい…！早く治します…早く戻りたい…！'
      ],
      seductive: [
        'これから……っ……やりたいこと、いっぱいあるの……'
      ],
    }
  },
  B2_fighter1: {
    normal: {
      _default: [
        'このままじゃチームがもたない。何とかしてほしい'
      ],
      ojousama: [
        'あの方とは…もう限界ですわ'
      ],
      delinquent: [
        'あいつとはもう無理だ。何とかしてくれ'
      ],
      seductive: [
        'あの人とはもう無理よ。何とかしてもらえないかしら'
      ],
      composed: [
        '…まあ、合わない人もいるよね。少し距離を置きたいな'
      ]
    },
    bold: {
      _default: [
        'あいつの態度が許せない。もう我慢の限界よ',
        'チームのためにも、この問題ははっきりさせるべき！'
      ],
      ojousama: [
        'あの女の態度は許せないわね……'
      ],
      delinquent: [
        'あいつの態度が気に食わねえ！限界だ！'
      ],
      cool: [
        '…あいつとは合わない。決着をつける'
      ],
      seductive: [
        'あの人の態度、もう我慢できないの'
      ],
      composed: [
        '…悪いけど、あの人とはちょっと厳しいかな'
      ]
    },
    quiet: {
      _default: [
        '………あの人とは、もう…'
      ],
      cool: [
        '…あれとは合わない。それだけだ'
      ],
      polite: [
        '…あの方とは…申し訳ありません、もう限界です'
      ]
    },
    shy: {
      _default: [
        'あの…あの人のこと…もう…どうしたらいいか…'
      ],
      polite: [
        'お、お話を聞かせていただけますか…？'
      ],
    },
    easygoing: {
      _default: [
        'あいつとはもう無理！顔も見たくない！'
      ],
      delinquent: [
        'あいつマジ無理！もう顔も見たくねえ！'
      ],
      seductive: [
        'あの人とはもう無理。顔も見たくないわ'
      ]
    },
    earnest: {
      _default: [
        '足を引っ張る人間とは一緒にやれない',
        'このままでは団体のためにならない。何とかしてほしい'
      ],
      polite: [
        'あの方とは…このままではチームに影響が出ます'
      ],
      ojousama: [
        'あの方とは…チームのためにもはっきりさせるべきですわ'
      ],
      seductive: [
        'あの人と一緒じゃ仕事にならないの。何とかして'
      ],
      composed: [
        '…無理に合わせても仕方ないからね。整理してもらえると助かるよ'
      ]
    },
    emotional: {
      _default: [
        'もう無理…！あの人と一緒にいると…辛い…！'
      ],
      seductive: [
        'ねえ……っ……ちょっと話、聞いてくれる？'
      ],
    }
  },
  B2_fighter2: {
    normal: {
      _default: [
        '向こうにも非があるのに、私だけ悪いみたいに…'
      ],
      ojousama: [
        'あちらにも非がおありでしょうに…'
      ],
      delinquent: [
        '向こうが悪いんだろ。なんで私だけ？'
      ],
      seductive: [
        '向こうにも非があるのに…私だけが悪いの？'
      ],
      composed: [
        '…ふぅん。まあ、お互い様だと思うけどね'
      ]
    },
    bold: {
      _default: [
        '私だって黙ってない。向こうが謝るべきでしょ？',
        '正面からぶつかって決着つけるしかないわね'
      ],
      ojousama: [
        '私も黙ってはいられませんわ。あちらに非があるのだから'
      ],
      delinquent: [
        '黙ってると思うなよ！向こうが謝れ！'
      ],
      cool: [
        '…謝る気はない。向こうが非を認めるべきだ'
      ],
      seductive: [
        '黙ってるつもりはないわ。向こうが悪いんだから'
      ],
      composed: [
        '…私は私のやり方を変えるつもりはないよ。それだけ'
      ]
    },
    quiet: {
      _default: [
        '………（静かに俯いている）'
      ],
      cool: [
        '…私は間違っていない'
      ],
      polite: [
        '…あの方とは…すみません、もう…'
      ]
    },
    shy: {
      _default: [
        '…私が悪いんでしょうか…（不安そうに）'
      ],
      polite: [
        'は、はい…お聞きします…'
      ],
    },
    easygoing: {
      _default: [
        '売られたケンカは買うよ！来いよ！'
      ],
      delinquent: [
        'やんのか！？ 売られたケンカは買うぜ！'
      ],
      seductive: [
        'ケンカ売ってきたのは向こうよ？ 買ってあげるわ'
      ]
    },
    earnest: {
      _default: [
        '団体には迷惑をかけたくないけど…あの人とは無理です',
        '私のやり方に文句があるなら、はっきり言えばいい'
      ],
      polite: [
        '団体にご迷惑はかけたくないのですが…あの方とは…'
      ],
      ojousama: [
        '団体にご迷惑はかけたくありませんのに…あの方とは…'
      ],
      seductive: [
        '迷惑はかけたくないけど…あの人とはもう無理なの'
      ],
      composed: [
        '…迷惑はかけたくないんだけどね。うまくいかないものだね'
      ]
    },
    emotional: {
      _default: [
        '私だって…！私だって辛いのに…！'
      ],
      seductive: [
        'いいわよ……っ……話してみて……'
      ],
    }
  },
  // B3 セリフは WAR_CHALLENGER_DIALOGUE / WAR_DECLINE_DIALOGUE / WAR_POST_DIALOGUE に移行済み
  B4: {
    normal: {
      _default: [
        '取材…緊張しますが、いい試合を見せられるよう頑張ります'
      ],
      ojousama: [
        '取材ですか？ 精一杯務めさせていただきます'
      ],
      delinquent: [
        '取材？ やってやるよ！'
      ],
      seductive: [
        '取材ね…いい姿を見せてあげるわ'
      ],
      composed: [
        '…取材か。まあ、いつも通りやるよ'
      ]
    },
    bold: {
      _default: [
        'いい機会ね。全国に私の実力を見せつけてやる',
        '団体の代表として、恥ずかしくない姿を見せる'
      ],
      ojousama: [
        'あらあら、全国の皆様も私の事が気にかかるのかしら？'
      ],
      delinquent: [
        '全国に見せてやるぜ！かかってこい！'
      ],
      cool: [
        '…いい機会だ。結果で語る'
      ],
      seductive: [
        '全国に見てもらえるのね。楽しみだわ'
      ],
      composed: [
        '…いい機会だね。自分らしくやらせてもらうよ'
      ]
    },
    quiet: {
      _default: [
        '…がんばります'
      ],
      cool: [
        '…やる。見ていてくれ'
      ],
      polite: [
        '…精一杯、頑張らせていただきます'
      ]
    },
    shy: {
      _default: [
        'え…わ、私なんかでいいんですか…？ が、頑張ります…！'
      ],
      polite: [
        'こ、こんなお仕事、わたしに務まるでしょうか…'
      ],
    },
    easygoing: {
      _default: [
        'マジで！？ テレビに出れるの！？ やったー！',
        'ファンの皆さんにもっと近い姿を見せられるね！'
      ],
      delinquent: [
        'テレビ！？ マジ！？ やったー！'
      ],
      seductive: [
        'テレビに出れるの？ 嬉しい。もっと見てもらえるわね'
      ]
    },
    earnest: {
      _default: [
        '私なんかでいいんですか？ …精一杯頑張ります！'
      ],
      polite: [
        '私でよろしいんですか…？ 精一杯務めさせていただきます'
      ],
      ojousama: [
        '私でよろしいのですか…？ 精一杯頑張りますわ'
      ],
      seductive: [
        '私でいいの？ …精一杯頑張るわ'
      ],
      composed: [
        '…なるほど、私でいいんだ。悪くない話だね'
      ]
    },
    emotional: {
      _default: [
        'えっ…テレビ…！？ 私が…！？ 頑張ります…！頑張ります…！'
      ],
      seductive: [
        'このお仕事……っ……ふふ、面白そうね……'
      ],
    }
  },
  // B4タレント活動: activityType別セリフ
  B4_cm: {
    normal: {
      _default: ['CMか…ちゃんとできるかな。頑張ってみます'],
      ojousama: ['CMですか。しっかりお役目を果たしますわ'],
      delinquent: ['CM！？ なんか恥ずかしいけど、やってやるよ'],
      seductive: ['カメラの前ね…いい絵、撮らせてあげる♡'],
      composed: ['…CMか。まあ、悪くないね'],
    },
    bold: {
      _default: ['CMで私の顔を全国に売り込む。完璧にやってみせる', 'このチャンス、最大限に使ってやる'],
      ojousama: ['CM？仕方ないわね……品と格というものを知らしめなければ'],
      delinquent: ['CM？ 全国にこの顔を売りつけてやる！'],
      cool: ['…カメラに映るか。悪くない'],
      seductive: ['全国に私を見てもらえるのね。楽しみだわ♡'],
      composed: ['…全国か。いい機会だね、自分のペースでやるよ'],
    },
    quiet: {
      _default: ['…やります'],
      cool: ['…カメラか。まぁ、やる'],
      polite: ['…精一杯、頑張らせていただきます'],
    },
    shy: {
      _default: ['わ、私がCMに…？ ほ、本当に大丈夫ですか…？'],
      polite: [
        'CM…ですか…？ わ、わたしなんかで、いいんでしょうか…'
      ],
    },
    easygoing: {
      _default: ['CM！？ 私ってもしかして売れっ子？♪', 'どんなCMになるんだろ〜楽しみ♪'],
      delinquent: ['CM撮影！？ 楽しそうじゃん！'],
      seductive: ['CM出演か…どんな自分が映るか楽しみ♡'],
    },
    earnest: {
      _default: ['CM出演、しっかり準備します。恥ずかしくない姿を'],
      polite: ['大切なお仕事ですね。精一杯務めさせていただきます'],
      ojousama: ['しっかり準備してお役目を果たしますわ'],
      seductive: ['ちゃんと準備して、いい姿を見せるわ'],
      composed: ['…ちゃんとやるよ。恥ずかしくない仕事をしたいからね'],
    },
    emotional: {
      _default: ['CMに出るの…！？ うわあああ緊張する！でもやる！'],
      seductive: [
        'CMに出るの……っ……ふふ、世間に顔を売るチャンスね……'
      ],
    },
  },
  B4_gravure: {
    normal: {
      _default: ['グラビアか…ちょっと恥ずかしいけど、頑張ります'],
      ojousama: ['撮影ですか。美しく仕上げていただけるよう努めますわ'],
      delinquent: ['グラビア…？ まぁ、やってやるか'],
      seductive: ['グラビアね…全部見せてあげるわ♡'],
      composed: ['…グラビアか。まあ、たまにはいいんじゃない'],
    },
    bold: {
      _default: ['私の強さと魅力、カメラに焼き付けてやる', 'これで一気に知名度上げてやる'],
      ojousama: ['撮影？私の魅力を引き出せるのかしら？'],
      delinquent: ['グラビアも勝負事だ。全力でいくよ'],
      cool: ['…写真か。余計なことはしないが、手は抜かない'],
      seductive: ['私の本気の魅力、たっぷり撮ってもらうわ♡'],
      composed: ['…撮られるのは嫌いじゃないよ。いい写真にしよう'],
    },
    quiet: {
      _default: ['…撮るだけですよね。わかりました'],
      cool: ['…写真か。余計なことはしないでくれ'],
      polite: ['…恥ずかしいですが、精一杯頑張ります'],
    },
    shy: {
      _default: ['え…グラビア…？ は、恥ずかしいです…でも、やります…'],
      polite: [
        'グ、グラビア…ですか…？ は、恥ずかしいです…でも、頑張ります…'
      ],
    },
    easygoing: {
      _default: ['グラビアか〜！ どんな感じになるんだろ♪', 'かわいく撮ってもらえるかな♪'],
      delinquent: ['グラビアか。まぁ、派手にやってやる'],
      seductive: ['グラビア？ 任せておいてよ♡'],
    },
    earnest: {
      _default: ['しっかり準備して臨みます。でも…少し恥ずかしいですね'],
      polite: ['精一杯きれいに撮っていただけるよう頑張ります…'],
      ojousama: ['プロとして恥ずかしくない撮影ができるよう、準備します'],
      seductive: ['きちんと準備して、いい仕上がりにするわ'],
      composed: ['…丁寧にやるよ。せっかくの機会だからね'],
    },
    emotional: {
      _default: ['グラビア！？ えっ、私ほんとに！？ うわ〜〜！'],
      seductive: [
        'グラビア……っ……ふふ、見られるのは嫌いじゃないの……'
      ],
    },
  },
  B4_variety: {
    normal: {
      _default: ['バラエティか…うまく喋れるかな。頑張ります'],
      ojousama: ['バラエティ番組ですか。品よくふるまえるよう努めますわ'],
      delinquent: ['バラエティ？ 面白いことしてやるよ'],
      seductive: ['バラエティか。じゃあ、素の私を少し見せてあげようかな'],
      composed: ['…バラエティか。まあ、のんびり喋るよ'],
    },
    bold: {
      _default: ['番組ジャックしてやる。全部持っていく', 'トーク番組だろうと、私が主役に決まってる'],
      ojousama: ['トーク番組？妙な仕事を持ってくるものね'],
      delinquent: ['テレビで暴れてやる！ 絶対爪痕残す！'],
      cool: ['…余計なことは言わない。でも、印象には残る'],
      seductive: ['バラエティでも私のペースで話すわ♡'],
      composed: ['…まあ、自分のペースで話せばいいんでしょ。大丈夫'],
    },
    quiet: {
      _default: ['…喋るんですか。少し、緊張します'],
      cool: ['…無駄なことは言わない。それだけだ'],
      polite: ['…うまく喋れるか不安ですが、精一杯やります'],
    },
    shy: {
      _default: ['バ、バラエティ…しゃべるの…？ が、頑張ります…'],
      polite: [
        'バ、バラエティ番組…ちゃんと、お話できるか不安です…'
      ],
    },
    easygoing: {
      _default: ['バラエティ！ 笑わせにいくよ♪', 'テレビって楽しそう！ 全力でいく♪'],
      delinquent: ['テレビで暴れてやる！ 楽しみ！'],
      seductive: ['バラエティか〜。楽しそう！ 見ててよ♡'],
    },
    earnest: {
      _default: ['うまく喋れるか不安ですが…精一杯やります'],
      polite: ['トーク番組は緊張しますが…誠実に対応いたします'],
      ojousama: ['言葉遣いには気をつけて、丁寧に対応しますわ'],
      seductive: ['ちゃんと準備して、面白い話ができるよう頑張るわ'],
      composed: ['…落ち着いて話せばいいよね。焦らずやるよ'],
    },
    emotional: {
      _default: ['バラエティ出る！？ テンション上がってきた〜！！'],
      seductive: [
        'バラエティに出るの……っ……ふふ、楽しんでくるわね……'
      ],
    },
  },
  B4_brand: {
    normal: {
      _default: ['ブランドとのコラボか。ちゃんとイメージに合わせられるかな'],
      ojousama: ['まあ、コラボのお話ですの。嬉しい限りですわ'],
      delinquent: ['ブランドとコラボ…？ なんか柄じゃないな。でもやる'],
      seductive: ['私のイメージに合うブランドね。いい選択だわ♡'],
      composed: ['…コラボか。なるほどね、面白そう'],
    },
    bold: {
      _default: ['そのブランドのイメージ、私が底上げしてやる', '私が使ったら絶対売れる。任せて'],
      ojousama: ['私なら、確かにブランドイメージは上がるでしょうね'],
      delinquent: ['コラボ商品、派手にやってやる！'],
      cool: ['…ブランドには口数の少なさが向いている。悪くない'],
      seductive: ['私とブランドの組み合わせ…最高じゃない♡'],
      composed: ['…悪くない組み合わせだね。いいものにしよう'],
    },
    quiet: {
      _default: ['…わかりました。やります'],
      cool: ['…無駄口は叩かない。それがブランドには向いているかもな'],
      polite: ['…コラボですね。しっかり務めさせていただきます'],
    },
    shy: {
      _default: ['わ、私がコラボ…？ 本当に私でいいんですか…'],
      polite: [
        'ブランドのお仕事…ですか…？ あ、あの、精一杯やらせていただきます…'
      ],
    },
    easygoing: {
      _default: ['コラボ！？ 商品もらえたりする？♪', 'どんな商品になるんだろ〜楽しみ♪'],
      delinquent: ['コラボか。なんか面白そうじゃん'],
      seductive: ['コラボ商品か…どんなのになるかな♡'],
    },
    earnest: {
      _default: ['ブランドさんのイメージを大切に。しっかり務めます'],
      polite: ['ブランド様のご期待に添えるよう、精一杯取り組みます'],
      ojousama: ['品格を忘れず、ブランドのイメージを大切にしますわ'],
      seductive: ['ちゃんとブランドのイメージに合わせて取り組むわ'],
    },
    emotional: {
      _default: ['えっブランドコラボ！？ すごい！どんな商品になるの！？'],
      seductive: [
        'ブランドのお話……っ……ふふ、素敵ね……'
      ],
    },
  },
  B4_fashion: {
    normal: {
      _default: ['ファッションショーか…歩けるかな。頑張ります'],
      ojousama: ['ランウェイですか。精一杯美しく歩いてみせますわ'],
      delinquent: ['ファッションショー…？ 歩くだけ？ まぁいいけど'],
      seductive: ['ランウェイか…私の本領発揮ね♡'],
    },
    bold: {
      _default: ['ランウェイも私のステージ。全部持っていく', 'プロレスもファッションも、どっちも私のもの'],
      ojousama: ['ランウェイね……もちろん自信はあるわよ？'],
      delinquent: ['歩くだけなら怖くない。ど派手にやってやる'],
      cool: ['…ランウェイか。静かにやる。でも存在感は出す'],
      seductive: ['ランウェイ、私のためにあるようなものよ♡'],
    },
    quiet: {
      _default: ['…歩けばいいんですね。やります'],
      cool: ['…余計なことはしない。ただ歩く。それだけだ'],
      polite: ['…練習して、ちゃんと歩けるよう準備します'],
    },
    shy: {
      _default: ['フ、ファッションショー…みんなに見られるんですよね…！'],
      polite: [
        'フ、ファッション関連のお仕事…似合うでしょうか…'
      ],
    },
    easygoing: {
      _default: ['ファッションショー！ なんかキラキラしてそう♪', '衣装とかかわいいのかな〜♪'],
      delinquent: ['ランウェイか。めっちゃ目立てそうじゃん！'],
      seductive: ['ランウェイ！ 絶対楽しい！ 見ててよ♡'],
    },
    earnest: {
      _default: ['練習して、ちゃんと歩けるよう準備します'],
      polite: ['ご期待に沿えるよう、歩き方から練習いたします'],
      ojousama: ['ランウェイには自信がありますわ。しっかり務めます'],
      seductive: ['きちんと練習して、完璧に歩いてみせるわ'],
    },
    emotional: {
      _default: ['ランウェイ歩くの！？ わあああどうしよう緊張するやつだ！'],
      seductive: [
        'ファッションのお仕事……っ……ふふ、おしゃれするのは好きよ……'
      ],
    },
  },
  B4_fan: {
    normal: {
      _default: ['ファンの皆さんと直接話せるのか。楽しみです'],
      ojousama: ['ファンの方々に直接お礼を申し上げる機会ですわね'],
      delinquent: ['ファンイベ！ 直接会えるのいいな'],
      seductive: ['ファンと直接会える機会ね…喜ばせてあげるわ♡'],
    },
    bold: {
      _default: ['ファンに最高の思い出を作らせてやる', '全員を笑顔にして帰らせる。それが私の仕事'],
      ojousama: ['ファンの方々に最高の時間をお届けしますわ'],
      delinquent: ['ファンイベ、盛り上げてやるよ！'],
      cool: ['…ファンの前では、少し気を緩めてもいいかもな'],
      seductive: ['ファンを喜ばせるのは得意よ。任せて♡'],
    },
    quiet: {
      _default: ['…ファンの人たちと話す。ちゃんとやります'],
      cool: ['…来てくれた人には、ちゃんと応えたい'],
      polite: ['…緊張しますが、来てくださった方に感謝を伝えます'],
    },
    shy: {
      _default: ['フ、ファンの方に直接会うんですか…！ 緊張しますが頑張ります'],
      polite: [
        'ファンの方に…直接、お会いできるんですか…？ う、嬉しいです…'
      ],
    },
    easygoing: {
      _default: ['ファンのみんなに会えるの！ テンション上がる♪', 'みんなの笑顔が見れるかな♪'],
      delinquent: ['ファンと直接会えるのいいじゃん！ 楽しみ！'],
      seductive: ['ファンに会いに行くの？ 嬉しいな♡'],
    },
    earnest: {
      _default: ['ファンの皆さん一人ひとりに、誠実に向き合います'],
      polite: ['来てくださった方全員に、心から感謝を伝えたいです'],
      ojousama: ['ファンの方々に誠実に向き合うことが私の務めですわ'],
      seductive: ['一人ひとりにちゃんと向き合う。それが大事だと思うわ'],
    },
    emotional: {
      _default: ['ファンに会える！！ 絶対みんなを笑顔にしてみせる！！'],
      seductive: [
        'ファンに会えるの……っ……ふふ、みんなに直接ありがとうって言えるのね……'
      ],
    },
  },
};

const MEDIA_OUTLET_NAMES = [
  'プロレス・ジャーナル', 'ファイトTV', '格闘技ウォッチ',
  'リングサイド・マガジン', 'バトルステーション',
];

// B4タレント活動: 名前配列6種
const CM_ADVERTISER_NAMES = [
  'アクティブスポーツ', 'ビタミン工房', 'スポーツドリンクX', 'フレッシュマート', 'ハーモニーコスメ',
];
const MAGAZINE_NAMES = [
  'スポーツグラフィア', 'ファイトマガジン', 'アクティブガール', 'Gスポーツ', 'リング&ビューティー',
];
const VARIETY_SHOW_NAMES = [
  'ナイトエンタメ！', 'ウィークエンドNOW', 'ぐるぐるスター', 'トーキングバトル', '週刊おもしろ倶楽部',
];
const COLLAB_BRAND_NAMES = [
  'クロスフィットギア', 'ファイターズコスメ', 'ボールドウェア', 'アイアンクラフト', 'ルーキースポーツ',
];
const FASHION_BRAND_NAMES = [
  'アスルコレクション', 'ストロングムード', 'リングスタイル', 'パワーモード', 'ディナミコ',
];
const FAN_EVENT_ORGANIZER_NAMES = [
  'ファンズユナイテッド', '地元プロレス愛好会', 'リングサポーターズ', 'プロレスコミュニティ', 'ファンクラブ実行委員会',
];

// B4タレント活動: ラベル・アイコン定数
const TALENT_ACTIVITY_LABELS = {
  cm:      'CM出演',
  gravure: 'グラビア撮影',
  variety: 'バラエティ出演',
  brand:   'ブランドコラボ',
  fashion: 'ファッションショー',
  fan:     'ファンイベント',
};
const TALENT_ACTIVITY_ICONS = {
  cm:      '📸',
  gravure: '📷',
  variety: '📺',
  brand:   '🤝',
  fashion: '👗',
  fan:     '🎤',
};

// ─────────────────────────────────────────────────────────────────────────────
// 資金危機 突入時 選手セリフ — bankruptcy-redesign-spec-v1.1.md §2.7
// archetype 別 6 プール。trust 最上位 1 名（同値時は人気最上位）から1名選出。
// ─────────────────────────────────────────────────────────────────────────────
const CRISIS_DIALOGUE = {
  enter: {
    ojousama: [
      '資金繰りが、そのような状況に……? わたくしに何かできることはございまして?',
      '動揺していると思われるのは癪ですけれど……正直、不安ですわ',
    ],
    delinquent: [
      'マジかよ。社長、立て直せんのか? まあ、やるしかねぇんだろうな',
      'ったく、潰れんの勘弁してくれよ。私のリングを取り上げるな',
    ],
    cool: [
      '……そうか。残された時間は、限られているということだな',
      'やるしかない。私にできることは、リングで応える、それだけだ',
    ],
    seductive: [
      'あら……興味深い局面ね。社長、楽しませてくださる?',
      '破滅の足音、というやつかしら。それでも、わたくしは舞台に立つわ',
    ],
    polite: [
      '資金が、そのような状態でしたか……。私にできることがあれば、何でもおっしゃってください',
      '諦めずに、最後まで力を尽くしましょう',
    ],
    normal: [
      '社長、諦めずに頑張りましょう。何とかなるはずです',
      '私たちにできることを、ひとつずつやっていきましょう',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 解散時 選手・コーチセリフ — bankruptcy-redesign-spec-v1.1.md §3.3
// archetype × trust（high/mid/low）= 18 プール / 各3セリフ + コーチ6
// ─────────────────────────────────────────────────────────────────────────────
const GAMEOVER_LINES = {
  fighter: {
    ojousama: {
      high: [
        'みなさま、本当にお世話になりましたわ。この団体で過ごした日々は、わたくしの誇りですの',
        '……負けは認めますわ。でも、わたくし、ここで戦えたことを後悔いたしません',
        'お疲れさま、社長。胸を張って、お顔をお上げくださいまし',
      ],
      mid: [
        'まあ……こんなことになりますの……',
        '次の場所は、わたくしが探さなくてはなりませんのね',
        '……心の整理が、つきませんわ',
      ],
      low: [
        '冗談ではありませんわ。わたくしの誇りは、どうなりますの',
        '最初から信用すべきではありませんでしたのね',
        '……無能、と申し上げてもよろしいかしら',
      ],
    },
    delinquent: {
      high: [
        'ちっ、潰れちまったか。……でもまあ、悪くなかったぜ',
        '社長、頭は下げなくていい。私は私で、次のリングへ行く',
        '泣いてんじゃねぇよ。私らはまた、どっかで戦うんだろ',
      ],
      mid: [
        'は? マジかよ。冗談じゃねぇ',
        'ったく、潰れる団体に入っちまったのが運の尽きかよ',
        '……次、探すしかねぇな',
      ],
      low: [
        'ふざけんな。私のキャリア、どうしてくれんだ',
        '最初から胡散臭いとは思ってたんだ',
        '失せろ。お前の顔は二度と見たくねぇ',
      ],
    },
    cool: {
      high: [
        '……世話になった',
        'ここで戦えてよかった。それだけは確かだ',
        '……次のリング、探す。それだけだ',
      ],
      mid: [
        '……終わったか',
        '次を探すしかない',
        '……',
      ],
      low: [
        '予想通りだ',
        '……特に言うことはない',
        '……',
      ],
    },
    seductive: {
      high: [
        'あら、終わってしまうのね。……でも、悪くなかったわ',
        'この団体で見せた表情、忘れないでくださる?',
        '別れ際の言葉……どうしましょうかしら。でも、感謝しているの。本当よ',
      ],
      mid: [
        'あらあら、こんな結末も、また面白いのかしら',
        '次の舞台、見つけなくちゃね',
        '……あぁ、これで終わりなのね',
      ],
      low: [
        '夢を見させてくれてありがとう、と言うべきかしら',
        'がっかりさせられたわ、本当に',
        '……つまらない結末ね',
      ],
    },
    polite: {
      high: [
        'みなさま、本当にお世話になりました。心より、感謝申し上げます',
        '私にとって、この団体は特別な場所でございました',
        '……ありがとうございました。この経験は、生涯忘れません',
      ],
      mid: [
        '……このような結末になるとは、思いもよりませんでした',
        '次の所属先を、探すことになりますね',
        '……何と申し上げてよいか、言葉が見つかりません',
      ],
      low: [
        '……信じてついてまいりましたのに、残念です',
        'いえ、何も申し上げることはございません',
        '……失礼いたします',
      ],
    },
    normal: {
      high: [
        'お疲れ様でした、社長。ここで戦えたこと、忘れません',
        'いい経験になりました。本当にありがとうございました',
        'また、どこかのリングで会えますように',
      ],
      mid: [
        '仕方ないですね。次の場所を探します',
        'こうなったら、新しい団体に移るしかありません',
        '……無念です',
      ],
      low: [
        '結局こうなったか',
        '想定の範囲内です',
        '……何も言うことはありません',
      ],
    },
  },
  coach: [
    '私の力不足だ。選手たちには、すまないとしか言えない',
    'まだ伸びる途中だった子が多い……それが、悔しくてならない',
    'よくここまで耐えた。胸を張りなさい、君たちは',
    '指導者として、最後まで支えきれなかった。それだけが心残りだ',
    '若い選手たちの行く先だけが心配だ。誰か、引き取ってくれるといい',
    '責任は私にもある。社長、頭を上げてくれ',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.1: エンディング演出セリフ — ending-gameover-spec-v1.0.md §1.4
// ─────────────────────────────────────────────────────────────────────────────
const ENDING_LINES = {
  fighter: {
    normal: {
      _default: [
        'この団体で戦えて、本当に良かった',
        '入団した時は、まさかここまで来れるなんて思わなかった',
        '最高の仲間と、最高の舞台。感謝しかないよ'
      ],
      ojousama: [
        'ここまで来れたのね…感無量だわ'
      ],
      delinquent: [
        'やってやったぜ！最高だ！'
      ],
      seductive: [
        'ここまで来れたのね…最高の気分だわ'
      ],
      cool: [
        '……終わったか。……悪くない'
      ],
      polite: [
        '最後まで走り切れました。…ありがとうございました'
      ],
      composed: [
        '…ここまで来れたか。…悪くない景色だね'
      ]
    },
    bold: {
      _default: [
        'ここが頂点？…でもまだ先がある気がする',
        'ここで終わりじゃない。もっと強くなって、もっと上を目指す',
        '私たちの戦いが業界を変えたってことね。誇りに思うよ'
      ],
      ojousama: [
        'これが頂点の景色？…馬鹿ね。まだまだ先はあってよ'
      ],
      delinquent: [
        'てっぺん獲ったぜ！でもまだまだこれからだ！'
      ],
      cool: [
        '…頂点だ。だが、まだ先がある'
      ],
      seductive: [
        '頂点に立ったわ。でもまだ先があるみたいね'
      ],
      polite: [
        '最後まで戦い抜けました。…悔いはありません'
      ],
      composed: [
        '…頂点か。…でもまだ先がある気がするね'
      ]
    },
    quiet: {
      _default: [
        '………ありがとうございました（静かに涙を流している）'
      ],
      cool: [
        '…ここまで来たか'
      ],
      polite: [
        '…ここまで来れるなんて…社長…ありがとうございます'
      ],
      seductive: [
        '………終わった…わね。…ありがとう'
      ],
      composed: [
        '……ここまで来た。…ありがとう'
      ]
    },
    shy: {
      _default: [
        'こ、こんなに幸せなことがあっていいのかな…'
      ],
      polite: [
        'こ、これで…リングを降ります…あ、あの、応援してくれた皆さま…本当に、ありがとうございました…'
      ],
    },
    easygoing: {
      _default: [
        'みんなで掴んだ頂点だ！最高のチームだよ！',
        'お金がなかった頃のことを思い出すと…よくここまで来たよね'
      ],
      delinquent: [
        '最高だぜ！みんなありがとな！'
      ],
      seductive: [
        '最高の景色ね。みんなのおかげだわ'
      ],
      polite: [
        '最後まで楽しかったです！ ありがとうございました！'
      ],
      ojousama: [
        '最後まで楽しゅうございましたわ。ありがとうございます'
      ],
      composed: [
        '…いい景色だね。…みんなのおかげだ'
      ]
    },
    earnest: {
      _default: [
        '練習してきたことが全部報われた。泣きそう',
        'あの時辞めなくてよかった。この瞬間のために全部あったんだ'
      ],
      polite: [
        '積み重ねてきた全てが報われました…ありがとうございます'
      ],
      ojousama: [
        '努力が報われましたわ…感謝しかありませんの'
      ],
      seductive: [
        '積み重ねてきた全部が報われた…泣きそうだわ'
      ],
      composed: [
        '…積み重ねてきたものが、ここに繋がった。…感謝だね'
      ]
    },
    emotional: {
      _default: [
        '涙が止まらない…！こんなに幸せなことがあっていいのかな…！',
        'みんなありがとう…！最高だよ…！'
      ],
      seductive: [
        'リングを降りるわ……っ……ふふ、ここで戦えた日々、永遠に忘れない……ありがとう……'
      ],
      composed: [
        '…っ…ここまで来れた。…最高だ'
      ]
    }
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
    '指導者として、これ以上の幸せはないよ'
  ]
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
// §B-2: 移籍ウィンドウ予兆テキスト（trust帯別）
// ─────────────────────────────────────────────────────────────────────────────
const PRE_WINDOW_TEXTS = {
  mild: [  // trust 45-59
    '👁️ 業界筋が{name}の試合映像を取り寄せているらしい',
    '👁️ {name}の名前が他団体の会議で挙がっていたとの噂',
    '👁️ {name}への注目度が他団体内で高まっているようだ',
  ],
  moderate: [  // trust 30-44
    '👁️ {rival}のスカウトが{name}の試合をチェックしていた',
    '👁️ {rival}関係者が{name}について詳しく探っているらしい',
    '👁️ 業界紙が{name}を「動向注目の選手」として取り上げた',
  ],
  serious: [  // trust <30
    '⚠️ 複数の団体が{name}に接触を試みている噂が流れている',
    '⚠️ {name}の周辺で他団体の動きが活発化している',
    '⚠️ {name}への具体的なオファーが近いとの観測が出ている',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §B-1: ロッカールーム空気ログテキスト
// ─────────────────────────────────────────────────────────────────────────────
const LOCKER_AIR_TEXTS = {
  good: [
    '💬 ロッカールームから笑い声が聞こえてくる',
    '💬 控室の空気は和やかだ',
    '💬 選手たちが自主練で残っている',
    '💬 誰かが差し入れを持ってきたらしい',
  ],
  warning: [
    '💬 控室で{name}がため息をついていた',
    '💬 {name}の表情が最近硬い',
    '💬 ロッカーの会話が少ない日が続いている',
    '💬 {name}が一人で帰る姿を見かけた',
    '💬 練習後、{name}がスマホをじっと見つめていた',
  ],
  danger: [
    '💬 ロッカールームの空気が重い',
    '💬 {name}と{name2}が何か話し込んでいた',
    '💬 控室で小さな言い争いがあったらしい',
    '💬 {name}の機嫌が明らかに悪い',
    '💬 誰もが口数少なく着替えを済ませていた',
  ],
};

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
const STAT_TIPS = {
  pw:'パワー：技の威力に影響',
  sp:'スピード：回避率に影響',
  te:'テクニック：命中率に影響',
  st:'スタミナ：HPの総量に影響',
  mn:'メンタル：被ダメ軽減・試合の流れに影響'
};
const COACH_OBS_INACCURACY = { E:0, D:0, C:0.20, B:0.20, A:0.08 }; // 🔧 的外れ確率

// ─────────────────────────────────────────────────────────────────────────────
// スナップショット通知テキスト — snapshot-engine-instruction.md
// ─────────────────────────────────────────────────────────────────────────────
const SNAPSHOT_TEXTS = {
  G1: {
    scene: [
      '給料日。{name}が明細をじっと見つめていた',
      '{name}が食堂で同僚たちの輪に入らず、黙って食事をしていた',
      '{name}がロッカールームで、誰かの契約書をちらりと見ていた'
    ],
    voice: {
      normal: {
        _default: [
          '…まあ、こんなもんか',
          '…頑張ってるのにな'
        ],
        ojousama: [
          '…お金のことで文句を言うつもりはないけれど'
        ],
        delinquent: [
          '…チッ'
        ],
        composed: [
          '…まあ、こんなものか'
        ]
      },
      bold: {
        _default: [
          '…なんであの子と同じ扱いなわけ？',
          '…納得いかない'
        ],
        ojousama: [
          '…わたくしの価値、ちゃんと見てくださっているのかしら'
        ],
        delinquent: [
          '…ふざけんなよ'
        ],
        composed: [
          '…ふぅん。…まあ、いいけど'
        ]
      },
      quiet: {
        _default: [
          '…'
        ],
        cool: [
          '…'
        ]
      },
      earnest: {
        _default: [
          '…もっと結果を出せばいいだけの話、だよね',
          '…自分の力不足かな'
        ],
        ojousama: [
          '…努力が足りないのかしら。でも…'
        ],
        composed: [
          '…結果で示すしかないか'
        ]
      },
      emotional: {
        _default: [
          '…なんで…なんでだろ',
          '…悔しいな'
        ],
        delinquent: [
          '…やってられっかよ'
        ],
        seductive: [
          'もう少し稼ぎたいわね……っ……'
        ],
        composed: [
          '…っ…まあ、いい'
        ]
      },
    
    shy: {
      polite: [
        '…もう少し、お給料が、上がったらいいな…'
      ]
    },
}
  },
  G2: {
    scene: [
      '{name}が後輩の{name2}の試合を腕を組んで見ていた。複雑な表情だ',
      '{name}が{name2}に技を教えている。だが、その目にどこか翳りがある'
    ],
    voice: {
      normal: {
        _default: [
          '…あの子、伸びたな',
          '…先輩としてちゃんと見てるよ。…でもね'
        ],
        composed: [
          '…伸びたね。…まあ、焦ることはない'
        ]
      },
      bold: {
        _default: [
          '…年功序列なんて古い。分かってる。分かってるけど',
          '…あたしだって負けてない'
        ],
        delinquent: [
          '…ガキが調子乗ってんじゃねーよ'
        ],
        composed: [
          '…やるね。…でも、まだ負けるつもりはない'
        ]
      },
      quiet: {
        _default: [
          '…'
        ],
        cool: [
          '…そう。それだけのことだ'
        ]
      },
      earnest: {
        _default: [
          '…あの子が評価されるのは正しいと思う。思うんだけど'
        ],
        composed: [
          '…正当な評価だろうね。…でも、自分もまだ'
        ]
      },
      emotional: {
        _default: [
          '…先に始めたのはあたしなのに',
          '…置いていかれてる気がする'
        ],
        seductive: [
          'ひとりは、ちょっと寂しいの……っ……'
        ],
        composed: [
          '…っ…先にいたのは、こっちなのに'
        ]
      },
    
    shy: {
      polite: [
        '…ひ、ひとりだと、寂しいです…'
      ]
    },
}
  },
  G3: {
    scene: [
      '{name}がタイトルマッチのポスターの前で足を止めていた',
      '{name}が練習中、いつもより打ち込みが荒い。何かを持て余している',
      'タイトル戦の話題が出た時、{name}だけが黙っていた'
    ],
    voice: {
      normal: {
        _default: [
          '…いつになったら'
        ],
        composed: [
          '…まあ、待つさ'
        ]
      },
      bold: {
        _default: [
          '…いつになったらあたしの番が来るの？',
          '…待つのは好きじゃないな'
        ],
        ojousama: [
          '…わたくしにふさわしい舞台がまだ来ないなんて'
        ],
        delinquent: [
          '…いい加減使えよ。腐るぞ'
        ],
        composed: [
          '…ふぅん。…まだ順番が来ないか'
        ]
      },
      quiet: {
        _default: [
          '…'
        ],
        cool: [
          '…チャンスは自分で作るものだと思っている'
        ]
      },
      earnest: {
        _default: [
          '…実力が足りないから？ それとも…',
          '…もう少し、待てばいいのかな'
        ],
        composed: [
          '…焦ってはいない。…でも、待つのも限度がある'
        ]
      },
      emotional: {
        _default: [
          '…悔しくないって言ったら嘘になる',
          '…あたしも、あそこに立ちたい'
        ],
        seductive: [
          '…もう少し目立たないとダメなのかしら'
        ],
        composed: [
          '…っ…黙ってるけど。…悔しくないわけじゃない'
        ]
      },
    
    shy: {
      polite: [
        '…も、もっと注目されないと、ダメですよね…'
      ]
    },
}
  },
  G4: {
    scene: [
      '{name}が試合のない週末を持て余しているようだ',
      '控え室の隅で、{name}がストレッチをしている。出番を待つ背中に焦りが見える',
      '{name}が自主練の後、一人でリングを見つめていた'
    ],
    voice: {
      normal: {
        _default: [
          '…出番、来ないかな'
        ],
        composed: [
          '…まあ、待つよ'
        ]
      },
      bold: {
        _default: [
          '…使ってくれなきゃ意味ないじゃん',
          '…あたしの居場所、あるのかな'
        ],
        composed: [
          '…使ってくれないと、困るんだけど'
        ]
      },
      quiet: {
        _default: [
          '…'
        ]
      },
      earnest: {
        _default: [
          '…準備はできてる。いつでも'
        ],
        composed: [
          '…準備はできてる。…いつでもね'
        ]
      },
      emotional: {
        _default: [
          '…見てくれてるのかな、あたしのこと'
        ],
        seductive: [
          'もっと強くなりたいの……っ……'
        ],
        composed: [
          '…っ…出番、まだかな'
        ]
      },
    
    shy: {
      polite: [
        '…つ、強くなりたい、です…'
      ]
    },
}
  },
  R1: {
    scene: [
      '{name}と{name2}が控え室で目を合わせなかった',
      '{name}と{name2}の間に、見えない壁がある。周りもそれを感じている',
      '{name}と{name2}が同じテーブルに座ることを避けていた'
    ],
    staff: [
      'スタッフから: {name}と{name2}、最近どうも空気がピリついてまして…'
    ]
  },
  R2: {
    scene: [
      '昼休み。他の選手たちが談笑する中、{name}だけが離れた場所にいた',
      '{name}が一人でリングの片付けをしている。手伝う者はいない',
      '練習後の更衣室。{name}のロッカーの周りだけ、少し空間が空いている'
    ],
    voice: {
      normal: {
        _default: [
          '…まあ、一人のほうが気楽だし'
        ],
        composed: [
          '…別に。一人でも困らない'
        ]
      },
      bold: {
        _default: [
          '…別にいいけど。わたしは一人でやれるし'
        ],
        delinquent: [
          '…ハッ、群れるのは趣味じゃねーんだよ'
        ],
        composed: [
          '…まあ、いいんだけどね。一人でも'
        ]
      },
      quiet: {
        _default: [
          '……'
        ],
        cool: [
          '…孤独には慣れている'
        ]
      },
      earnest: {
        _default: [
          '…もっとみんなと話した方がいいのかな'
        ],
        polite: [
          '…何か気に障ることをしたのでしょうか'
        ],
        composed: [
          '…もう少し歩み寄った方がいいのかな'
        ]
      },
      emotional: {
        _default: [
          '…みんな、あたしのこと嫌いなのかな',
          '…ここにいていいのかな'
        ],
        ojousama: [
          '…こういう寂しさは初めてですわ'
        ],
        seductive: [
          'あの子と、もっと話したい……っ……'
        ],
        composed: [
          '…っ…まあ、いいさ'
        ]
      },
    
    shy: {
      polite: [
        '…あ、あの人と、また話せたらいいな…'
      ]
    },
}
  },
  R3: {
    scene: [
      '{name}は{name2}の退団を知り、しばらく言葉を失っていた',
      '{name2}がいなくなったロッカーの前で、{name}が立ち止まっていた'
    ],
    modal: {
      normal: {
        _default: [
          '…いなくなっちゃうんだ',
          '…{name2}がいない控え室なんて想像できない'
        ],
        composed: [
          '…そうか。…{name2}がいなくなるのか'
        ]
      },
      bold: {
        _default: [
          '…バカ。なんで何も言わずに行くのよ',
          '…あいつがいないと、張り合いがないな'
        ],
        delinquent: [
          '…チッ。…寂しいなんて言わねーけど'
        ],
        composed: [
          '…行くんだ。…まあ、{name2}が決めたことだからね'
        ]
      },
      quiet: {
        _default: [
          '……'
        ],
        cool: [
          '…そうか。…分かった'
        ]
      },
      earnest: {
        _default: [
          '{name2}のために、あたしはここで頑張るから',
          '…ありがとう。ずっと支えてくれて'
        ],
        polite: [
          '{name2}さんとご一緒できて幸せでした。…お元気で'
        ],
        composed: [
          '…{name2}。…ありがとう。…元気でね'
        ]
      },
      emotional: {
        _default: [
          '…やだ。嫌だよ。なんで…',
          '…{name2}がいないなんて、あたし…'
        ],
        ojousama: [
          '…{name2}。……あなたがいなくなるなんて'
        ],
        composed: [
          '…っ…{name2}。…元気で'
        ]
      },
    
    shy: {
      polite: [
        'あ、あの…少し、お話できますか…'
      ]
    },
}
  },
  R4: {
    scene: [
      '試合後、{name}の目に静かな炎が燃えていた',
      '{name}がリングを降りる時、一瞬だけ{name2}のほうを振り返った。満足げに'
    ],
    voice: {
      normal: {
        _default: [
          '…やっと、追いついた'
        ],
        composed: [
          '…悪くない。…やっと追いついた'
        ]
      },
      bold: {
        _default: [
          '…ふん。まだまだこんなもんじゃないけどね',
          '…勝った。でも、まだ終わってない'
        ],
        delinquent: [
          '…ザマァ見ろ'
        ],
        composed: [
          '…勝った。…でも、まだだね'
        ]
      },
      quiet: {
        _default: [
          '…'
        ],
        cool: [
          '…次も同じ結果とは限らない。気を引き締めろ、自分'
        ]
      },
      earnest: {
        _default: [
          '…努力は裏切らない。…{name2}、ありがとう'
        ],
        composed: [
          '…やるべきことをやった。…それだけ'
        ]
      },
      emotional: {
        _default: [
          '…勝った…勝ったよ…！',
          '…泣くな、あたし。まだ先がある'
        ],
        seductive: [
          'あの子とは、ちょっと距離を置きたいの……っ……'
        ],
        composed: [
          '…っ…勝った。…うん、勝った'
        ]
      },
    
    shy: {
      polite: [
        '…あ、あの人とは、距離を置きたい、かも…'
      ]
    },
}
  },
  R5: {
    scene: [
      '{name}は無言でリングを降りた。その拳だけが震えていた',
      '{name}が帰り際、振り返って{name2}のほうを一瞬だけ見た',
      '試合後の通路で、{name}が壁を叩く音がした'
    ],
    voice: {
      normal: {
        _default: [
          '…まだ、足りないのか',
          '…くやしい'
        ],
        composed: [
          '…足りなかった。…次、だね'
        ]
      },
      bold: {
        _default: [
          '…次は絶対に負けない',
          '…この借りは必ず返す'
        ],
        delinquent: [
          '…クソッ…！'
        ],
        composed: [
          '…次は返す。…覚えておいて'
        ]
      },
      quiet: {
        _default: [
          '…'
        ],
        cool: [
          '…敗因は分かっている。次までに修正する'
        ]
      },
      earnest: {
        _default: [
          '…あの人にはまだ勝てない。でも、だからこそ',
          '…もっと練習する。絶対に'
        ],
        composed: [
          '…まだ足りないか。…次までに詰めるよ'
        ]
      },
      emotional: {
        _default: [
          '…悔しい…悔しい…！',
          '…なんであたしは勝てないの'
        ],
        ojousama: [
          '…こんなはずでは…こんなはずでは、ないのに'
        ],
        seductive: [
          '負けたくないの……っ……ふふ……'
        ],
        composed: [
          '…っ…次は、こうはいかない'
        ]
      },
    
    shy: {
      polite: [
        '…ま、負けたく、ないです…'
      ]
    },
}
  },
  friction: {
    scene: [
      '{name}と{name2}が練習メニューの順番で揉めていた。些細なことだが',
      '{name}が{name2}の練習態度について、小声で何か言っていた',
      '{name}と{name2}が同時に控え室に入った瞬間、空気が変わった'
    ],
    staff: [
      'スタッフから: {name}と{name2}、ちょっと相性が良くないみたいで…'
    ]
  },
  generation: {
    scene: [
      '{name}と{name2}が一緒に帰っていく姿が見えた。同世代の気安さがある',
      '{name}と{name2}が自販機の前で笑い合っていた。何が面白いのか、こちらには分からないが',
      '{name}が{name2}を自主練に誘っている。いい雰囲気だ',
      '{name}と{name2}が昼食を一緒に取っている。どうやら仲がいいらしい'
    ]
  },
  rivalryResolved: {
    scene: [
      '決着はついた。だが{name}と{name2}が目を合わせた時、そこにはまだ何かがあった',
      '因縁は終わった。はずだ。…だが{name}は{name2}の動向を気にしている'
    ]
  },
  careerBestMQ: {
    scene: [
      '{name}が試合後、自分の両手を見つめていた。何かを掴んだ表情だ',
      '{name}の試合が終わった後、先輩たちが小さく頷いていた'
    ]
  },
  breakthrough: {
    voice: {
      normal: {
        _default: [
          '…ここで頑張ってきてよかった'
        ],
        composed: [
          '…悪くない環境だね。…感謝してる'
        ]
      },
      bold: {
        _default: [
          '…まだまだ強くなれる！この団体でなら'
        ],
        composed: [
          '…まだ先がある。…ここでなら'
        ]
      },
      quiet: {
        _default: [
          '…この場所に感謝している'
        ],
        cool: [
          '…環境に恵まれた。それは認める'
        ]
      },
      earnest: {
        _default: [
          '…みんなのおかげです。もっと恩返しがしたい'
        ],
        composed: [
          '…ここで積み重ねてきたものが、繋がった'
        ]
      },
      emotional: {
        _default: [
          '…うれしい…ここにいてよかった'
        ],
        seductive: [
          '何かが変わった……っ……ふふ……'
        ],
        composed: [
          '…っ…ここにいてよかった'
        ]
      },
    
    shy: {
      polite: [
        '…な、何かが、変わった気がします…'
      ]
    },
}
  },
  warVictory: {
    scene: [
      '{name}はチームの勝利に拳を握りしめた。この団体の看板を背負う覚悟が見えた'
    ],
    voice: {
      bold: {
        _default: [
          '…わたしが勝つに決まってるでしょ。この団体を背負ってるんだから！'
        ],
        composed: [
          '…勝った。…うちの看板、守れたかな'
        ]
      },
      earnest: {
        _default: [
          '…みんなの想いを背負って戦えて光栄です'
        ],
        composed: [
          '…みんなの分も、背負えた。…よかった'
        ]
      },
      emotional: {
        _default: [
          '…勝った…！ みんなのおかげだよ…！'
        ],
        seductive: [
          '勝てた……っ……ふふ、最高の気分……'
        ],
        composed: [
          '…っ…勝った。…みんなのおかげだ'
        ]
      },
      quiet: {
        _default: [
          '…'
        ],
        cool: [
          '…当然の結果だ'
        ]
      },
    
    shy: {
      polite: [
        '…か、勝てて、よかったです…'
      ]
    },
}
  }
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

// ── 対抗戦後・勝利選手セリフ（personality×archetype） ──
const WAR_VICTORY_LINES = {
  normal: {
    _default: ['うちの団体の強さ、見せられたと思います', '勝てて良かった。団体の看板は守れた', '一つ勝てた。みんなの期待に応えられたかな'],
    ojousama: ['わたくしたちの実力、お分かりいただけたかしら？', '団体の名誉は守りましたわ。当然のことですけれど', '団体の名に恥じない勝利でしたわ'],
    delinquent: ['舐めんなよ。うちの団体はこんなもんじゃねえ', '勝ったぜ。文句あるか？', '楽勝だぜ。次もかかってこいよ'],
    seductive: ['あら、もう終わり？ 物足りなかったわ', 'うちの団体の底力、見せてあげたわよ', 'ふふ、うちの団体の魅力、わかっていただけたかしら'],
    cool: ['…団体の看板、背負えた', '…勝った。それだけ', '……勝った。それでいい'],
    polite: [
      '対抗戦、勝たせていただきました。団体のために戦えて光栄です'
    ],
    composed: ['…団体の看板、守れたかな。…悪くないね', '…勝った。…うちの力を見せられたと思う'],
  },
  bold: {
    _default: ['当然でしょ！ うちの団体を甘く見ないでよね！', 'この勝利は団体のみんなの勝利よ！', 'はっ、他所の団体なんてこんなもんよ！'],
    ojousama: ['当然の結果ね。……私を甘く見るべきじゃなかったわね', 'この程度で終わりではなくてよ', '私の団体に挑むなど……百年早いですわね'],
    delinquent: ['当然だろ！ うちの団体なめんじゃねえよ！', 'ざまあみろ！ これがうちの実力だ！', 'うちの団体に手ぇ出すからだ。ざまぁみろ'],
    seductive: ['当然よ。うちの団体を甘く見ないことね', 'まだ物足りないわね。もっと強い相手はいないの？', '当然の結果よ。うちを甘く見ないことね'],
    cool: ['…当然の結果。うちを甘く見るな', '……当然だ。うちを甘く見るな', '……当然の結果。うちを甘く見るな'],
    polite: [
      '勝ちました。この団体の力を見せつけられたと思います'
    ],
    composed: ['…当然の結果だよ。…うちを甘く見ないでね', '…こんなもんかな。…まだまだ行けるよ'],
  },
  earnest: {
    _default: ['勝てた…！ みんなのために、絶対に負けたくなかったから…！', '団体の名前を背負って戦えて…嬉しい。勝ててもっと嬉しい…！', '全力で戦いました…！ 団体のみんなに恥じない試合ができたなら…'],
    ojousama: ['勝てましたわ…！ みなさまのおかげですわ…！', '団体のために全力を尽くせましたわ…嬉しいですわ', 'みなさまのおかげで勝てましたわ…感謝いたします'],
    delinquent: ['勝ったぞ…！ 団体のためにぜってぇ負けねえって決めてたんだ…！', '全力で戦った結果だ…！ 団体のために負けらんねえからな', 'みんなのために勝てた…！ それが一番嬉しいぜ'],
    cool: ['…勝てた。みんなのために…負けたくなかった', '……勝てた。みんなの分も…背負えた', '……全力で戦った。悔いはない'],
    polite: ['団体の代表として勝利できましたこと…光栄でございます', '団体の名に恥じない試合ができたのであれば…嬉しゅうございます', '団体の皆様のおかげで勝利できました。心より感謝申し上げます'],
    seductive: [
      '団体のために戦えて…嬉しいわ'
    ],
    composed: ['…勝てました。…団体のために、やるべきことをやっただけです'],
  },
  easygoing: {
    _default: ['いやー勝っちゃった！ うちの団体やるでしょ？', 'よっしゃー！ 対抗戦勝利！ 打ち上げ行こうよ！', '楽しかったー！ しかも勝てたし、最高！'],
    ojousama: ['あら、勝ってしまいましたわ～。うちの団体、なかなかやりますでしょ？', 'あらあら、勝っちゃいましたわね〜', '楽しかったですわ〜。またやりましょうね'],
    delinquent: ['よっしゃあ！ 勝った勝った！ 打ち上げだ打ち上げ！', 'よっしゃ〜！ まだまだいけるぜ〜！', 'いえーい！ 圧勝〜！ 打ち上げ行くぞ〜！'],
    seductive: ['あら〜、勝っちゃった。うちの団体、いいでしょ？', 'ふふ、楽しかったわ〜。またやりたいわね', 'あら〜、楽しかったわ。またいつでもどうぞ'],
    cool: ['…ん、勝った。よかったよかった', '……まあ、勝ったな', '……ん。勝ったな'],
    polite: [
      '勝ちました！ うちの団体の底力を見せられましたね！'
    ],
    composed: ['勝ったね。…うちの団体、なかなかでしょ', '…ま、こんなもんかな'],
  },
  quiet: {
    _default: ['……勝った。団体の力を、証明できた', '……これがうちの実力', '……みんなの分も、背負って戦った'],
    polite: ['……勝てました。みなさんのおかげです', '……勝てました。団体のために…できることを', '……勝てました。皆様の…おかげです'],
    cool: ['……証明した。それだけ', '……これがうちの力', '……（静かに頷く）'],
    seductive: [
      '………勝った…わ。…団体のために'
    ],
    composed: ['……勝った。…それだけ'],
  },
  shy: {
    _default: ['か、勝てた…！ み、みんなの看板、汚さずに済んだ…よかった…', 'わ、私でも…団体の役に立てたのかな…', 'う、嬉しい…みんなと一緒に戦えて…勝てて…'],
    polite: ['か、勝てました…！ 団体のみなさまに恥じない試合が…できたでしょうか…', 'か、勝たせていただきました…。団体のみなさまに…少しは恩返しできたでしょうか…', 'か、勝てました…！ 団体のみなさまに恥じない試合が…できていたら嬉しいです…'],
    cool: ['…か、勝てた…団体の看板…守れた…', '……勝てた。団体の看板…守れた', '……勝てた。……よかった'],
  },
  emotional: {
    _default: ['勝った…勝ったよぉ…！ うちの団体の強さ、見せられたよね…！？', 'みんなの期待に…応えられた…よね？ うぅ…よかった…！', '絶対に…絶対に負けたくなかった…！ 団体のみんなのために…！'],
    ojousama: ['勝ちましたわ…！ うぅ…嬉しい…団体のために…よかった…！', '勝てて…本当に…よかったですわ…！', '勝てましたわ…！ うぅ…団体のみんなのためによかった…！'],
    delinquent: ['勝ったぞおおお！ うちの団体なめんなよおお…！ うぅっ…！', '勝った…団体のみんなに見せられた…！ うっ…', 'やったぞ…！ うちの団体最強だろ…！ うぅっ…'],
    seductive: ['勝てた…！ 団体のみんなのおかげ…嬉しい…！', '勝てた…みんなのおかげ…嬉しい…！', '勝てた…嬉しい…！ みんなのために頑張れた…！'],
    cool: ['…勝った…よかった…（目が潤んでいる）', '……っ。勝った……よかった', '……っ。勝てた……（目が潤む）'],
    composed: ['…っ…勝った。…みんなのおかげだ'],
  },
};

// ── 対抗戦・挑戦セリフ（personality×archetype） ──
const WAR_CHALLENGER_DIALOGUE = {
  normal: {
    _default: ['あんたたちの実力、確かめさせてもらうよ', 'こっちは本気だよ。受けて立つ気はあるの？'],
    ojousama: ['あら、こちらの団体さん？ 随分とかわいらしい興行をなさっていますわね', 'わたくしたちの実力をお見せする良い機会ですわ'],
    delinquent: ['おい、聞いたぜ？ 弱小団体がイキってるってな', 'ボコボコにしてやっから、覚悟しとけ'],
    seductive: ['うふふ、おたくの団体さん…少し気になってたの', '遊んであげるわ。……本気でね'],
    cool: ['……挑戦する。受けろ', '……実力で語る。それだけだ'],
    composed: ['…そちらの実力、確かめさせてもらうよ', '…本気で来なよ。受けて立つから'],
  },
  bold: {
    _default: ['聞いてあきれる。そんな団体に負けるわけないでしょ', 'あんたたちの看板選手？ 笑わせないで'],
    ojousama: ['そちらの団体のレベル、存じておりますわよ？', '格の違いをお教えして差し上げますわ'],
    delinquent: ['てめえらの団体？ うちの新人にも勝てねえだろ', 'ぶっ潰してやるよ。覚悟しろ'],
    seductive: ['あら…随分と自信がおありのようね。壊してあげるわ', '可哀想だけど…手加減はしないわよ'],
    cool: ['……弱い団体だな', '……語る必要はない。潰すだけだ'],
    composed: ['…格の違い、見せてあげるよ', '…手加減はしない。覚悟してね'],
  },
  earnest: {
    _default: ['そちらの団体の実力、確かめさせてもらいます', '正々堂々、全力でぶつかります。逃げないでくださいね'],
    polite: ['失礼ながら、対抗戦のお申し込みをさせていただきます', '全力でお相手いたしますので、覚悟なさってください'],
    composed: ['…全力でぶつかります。よろしく'],
  },
  easygoing: {
    _default: ['ちょっと遊びに来ちゃった。付き合ってよ', '面白そうじゃん？ やろうよ、対抗戦'],
    ojousama: ['あら〜、面白そうな団体ですわね。遊ばせていただきますわ', 'わたくしたちと勝負しません？ きっと楽しいですわよ'],
    delinquent: ['よう、暇だから殴りに来たぜ', '面白えことしようぜ。対抗戦だ対抗戦'],
    seductive: ['ね、一緒に遊ばない？ …本気のやつ', '退屈してたの。相手してくれるかしら'],
    cool: ['……暇だ。やるか', '……面白そうだな'],
    composed: ['…面白そうだね。付き合ってよ'],
  },
  quiet: {
    _default: ['……対抗戦を申し込む', '……戦え'],
    cool: ['……来い', '………'],
    composed: ['……対抗戦を。…よろしく'],
  },
  shy: {
    _default: ['あ、あの…対抗戦を…お願いしたくて…', 'で、でも…負けるつもりはないです…'],
    cool: ['……対抗戦。……お願いします', '……逃げません。……やります'],
    polite: [
      'あ、あの…団体として、挑戦させてください…',
      'み、みんなで戦います…'
    ],
  },
  emotional: {
    _default: ['ずっと…あなたたちの団体が気になってたの…！ 勝負して…！', 'この熱い気持ち…ぶつけさせてもらう…！'],
    ojousama: ['もう我慢できませんわ…！ 勝負ですわ…！', 'この燃える思い…受け止めてくださいまし…！'],
    delinquent: ['おいてめえら！ 勝負だ勝負！ 今すぐだ！', 'うずうずしてんだよ…！ かかってこい…！'],
    cool: ['……挑む。……今だ', '……この気持ち……戦いでしか晴らせない'],
    seductive: [
      '団体として挑むわ……っ……ふふ、燃えるわね……',
      'みんなで戦うわ……っ……ふふ……'
    ],
    composed: ['…勝負しよう。…本気で'],
  },
};

// ── 対抗戦・辞退セリフ（personality×archetype） ──
const WAR_DECLINE_DIALOGUE = {
  normal: {
    _default: ['やっぱりな。逃げると思ってたよ', '…逃げ足だけは一流だね'],
    ojousama: ['あら、お逃げになるの？ 残念ですわ', '…お覚悟が足りないようですわね'],
    delinquent: ['はっ、逃げやがった。ビビりが', 'チキンかよ。次はねえぞ'],
    seductive: ['あら…怖いのかしら。可哀想', '逃げるのね…。つまらないわ'],
    cool: ['……臆病者', '……逃げたか'],
    composed: ['…ふぅん。逃げるんだ', '…まあ、そういうこともあるか'],
  },
  bold: {
    _default: ['はっ、やっぱりね。戦う前から結果は見えてたわ', '逃げるの？ まあ、賢い判断よね'],
    ojousama: ['あらまあ。逃げ足が速い…格の違いは理解出来たみたいね', 'うふふ……みっともないだこと。'],
    delinquent: ['はっ、ザッコ。逃げんのかよ', '次会った時は逃がさねえからな。覚えとけ'],
    seductive: ['あら、残念。もっと遊びたかったのに', '逃げちゃうの？ …つまらない団体ね'],
    cool: ['……弱いな', '……逃げるか。失望した'],
    composed: ['…逃げるか。…まあ、賢い判断かもね'],
  },
  earnest: {
    _default: ['残念です。正々堂々の勝負がしたかった', '次こそは受けてください。待っています'],
    polite: ['残念ですが…いつかお受けいただけることを願っております', '改めてお声がけいたします。その時はぜひ'],
    composed: ['…残念です。…次は受けてほしいね'],
  },
  easygoing: {
    _default: ['えー、断るの？ つまんないなー', 'まあいいけどさ。気が変わったら言ってよ'],
    ojousama: ['あら〜、お断りですの？ もったいないですわ', 'ま、いいですわ。またの機会にいたしましょう'],
    delinquent: ['は？ 逃げんの？ ダッセー', 'ま、ビビるのもわかるけどな。またな'],
    seductive: ['あらあら、怖がっちゃって。可愛い', '残念。もっと楽しめると思ったのに'],
    cool: ['……ふーん。逃げるか', '……まあ、いい'],
    composed: ['…逃げるんだ。…つまんないね'],
  },
  quiet: {
    _default: ['……そうか', '……次はない'],
    cool: ['………', '……（背を向ける）'],
    composed: ['……そう'],
  },
  shy: {
    _default: ['そ、そうですか…残念です…', 'で、でも…いつかきっと…'],
    cool: ['……そう。……残念', '……わかった'],
    polite: [
      'す、すみません…今回は、お断りさせてください…',
      'ま、また機会があれば…'
    ],
  },
  emotional: {
    _default: ['逃げるの…？ そんなの…ずるいよ…！', 'こっちはこんなに燃えてるのに…！ 受けてよ…！'],
    ojousama: ['逃げるなんて…許しませんわ…！', 'この悔しさ…忘れませんわよ…！'],
    delinquent: ['おいふざけんな！ 逃げんじゃねえよ！', 'チクショウ…！ 次は絶対逃がさねえからな…！'],
    cool: ['……逃げるか。……覚えた', '……次はない。……逃がさない'],
    seductive: [
      'ごめんなさい……っ……今回は遠慮するわ……',
      'またの機会に……っ……ふふ……'
    ],
    composed: ['…逃げるか。…覚えておくよ'],
  },
};

// ── 対抗戦・結果セリフ（personality×archetype） ──
const WAR_POST_DIALOGUE = {
  result_lose: {
    normal: {
      _default: ['悔しいけど…結果は結果。次は絶対に負けない', 'この借りは…必ず返す'],
      ojousama: ['負けてしまいましたわ…。でも、次こそは', '悔しいですわ…。でも、この経験を糧にいたしますわ'],
      delinquent: ['くそっ…やられた…。次は絶対ぶっ潰す', 'この借り…倍にして返してやるからな'],
      seductive: ['負けちゃったわね…悔しい', '次はもっと綺麗に勝ってみせるわ'],
      cool: ['……負けた。……受け止める', '……次は違う'],
      composed: ['…負けたか。…次は違う結果にする'],
    },
    bold: {
      _default: ['こんなの認めない…！ 絶対にリベンジしてやる', 'たまたまよ、たまたま。次は潰す'],
      ojousama: ['嘘…こんな結果…認めませんわ…！', '次こそは…必ず…覚悟なさい！'],
      delinquent: ['ちっ…マジかよ…。絶対リベンジしてやる', 'ふざけんな…次はぶっ壊してやるからな'],
      seductive: ['あら…やられちゃったわ。……許さないけど', '今日は譲ってあげるわ。次は…ないけどね'],
      cool: ['……負けた。……認める。……だが次は違う', '……覚えておけ'],
      composed: ['…負けた。…でも、次はこうはいかないよ'],
    },
    earnest: {
      _default: ['力が足りませんでした…。もっと練習して、必ず強くなります', '悔しい…でも、この経験を無駄にしない'],
      polite: ['完敗でした…。この悔しさを胸に、精進いたします', '申し訳ございません…。必ず成長してお返しいたします'],
      composed: ['…力が足りませんでした。…次までに詰めます'],
    },
    easygoing: {
      _default: ['あちゃー、負けちゃったか。ま、次頑張ろ', 'ドンマイドンマイ。次こそは！'],
      ojousama: ['あらあら、負けてしまいましたわ。でもくよくよしませんわ', '次はもっと上手くやりますわよ〜'],
      delinquent: ['ま、こういう日もあるっしょ。次だ次！', 'くっそー、やられた。次は倍返しだ'],
      seductive: ['あらら、ダメだったわね。ま、次があるわ', '負けちゃった。…でも、引きずらないわ'],
      cool: ['……ま、仕方ない', '……次だな'],
      composed: ['負けたか。…ま、次があるさ'],
    },
    quiet: {
      _default: ['……悔しい', '……次は負けない'],
      cool: ['………', '……（拳を握りしめる）'],
      composed: ['……次は、負けない'],
    },
    shy: {
      _default: ['ごめんなさい…私が…もっと頑張れていれば…', '悔しい…でも…次こそ…'],
      cool: ['……すみません。……もっと強くなります', '……次は……負けない'],
      polite: [
        'ま、負けてしまいました…ご、ごめんなさい…',
        '次は…次こそは…'
      ],
    },
    emotional: {
      _default: ['悔しい…！ こんなの…こんなの嫌だ…！', 'この悔しさ…絶対忘れない…！ 絶対リベンジする…！'],
      ojousama: ['こんな…認めませんわ…！ 絶対に…！', '悔しい…ですわ…。でも…負けませんわ…次は…！'],
      delinquent: ['ちくしょう…！ やられた…！ 絶対許さねえ…！', 'この借り…必ず返すからな…覚えてろよ…！'],
      cool: ['……っ。……悔しい', '……この結果…忘れない'],
      seductive: [
        '負けたわ……っ……ふふ、悔しい……',
        '次は絶対に……っ……ふふ、リベンジするわ……'
      ],
      composed: ['…っ…この悔しさは、覚えておく'],
    },
  },
  result_win: {
    normal: {
      _default: ['勝てた。うちの団体の強さを見せられたと思う', 'いい対抗戦だった。この経験を次に活かそう'],
      ojousama: ['わたくしたちの勝利ですわ。誇らしいですわね', 'いい対抗戦でしたわ。またの機会を楽しみにしておりますわ'],
      delinquent: ['どうだ、これがウチの実力だ。舐めんなよ', '勝ったぜ。ま、当然だけどな'],
      seductive: ['ふふ、勝てたわね。素敵な対抗戦だったわ', '勝利の味は…格別ね'],
      cool: ['……勝った。それが全てだ', '……悪くない'],
      composed: ['…勝ったね。…いい対抗戦だった'],
    },
    bold: {
      _default: ['当然の結果でしょ。格が違うのよ', 'もう二度と歯向かわないことね'],
      ojousama: ['当然の結果ですわ。格の違い、おわかりになりまして？', '圧勝ですわね。ふふっ'],
      delinquent: ['はっ、楽勝だぜ。雑魚が調子乗んなよ', 'これがウチの強さだ。分かったか'],
      seductive: ['あら、もう終わり？ もっと楽しみたかったのに', '予想通りの結果ね。つまらないわ'],
      cool: ['……弱い。話にならない', '……当然だ'],
      composed: ['…当然の結果だよ。…もう少し手応えが欲しかったけどね'],
    },
    earnest: {
      _default: ['勝てました…！ みんなの頑張りが実った結果です', 'いい対抗戦でした。相手にも感謝です'],
      polite: ['勝たせていただきました。素晴らしい対抗戦に感謝いたします', '皆様のおかげで勝利できました。ありがとうございます'],
      composed: ['…勝てました。…いい経験になりました'],
    },
    easygoing: {
      _default: ['やったー！ 勝っちゃった！ 最高！', '楽しかったー！ またやろうよ'],
      ojousama: ['やりましたわ〜！ 勝利ですわ！', '楽しい対抗戦でしたわ。またぜひ'],
      delinquent: ['いえーい！ 圧勝だぜ〜！', '面白かったぜ！ またかかって来いよ'],
      seductive: ['あら、勝っちゃった。楽しかったわ', 'いい対抗戦だったわね。また遊びましょう'],
      cool: ['……ま、勝ったな', '……悪くなかった'],
      composed: ['勝ったね。…楽しかったよ'],
    },
    quiet: {
      _default: ['……勝った', '………'],
      cool: ['……（静かに頷く）', '………'],
      composed: ['……勝った。…うん'],
    },
    shy: {
      _default: ['か、勝てた…。みんなのおかげです…', 'ほっとしました…。よかった…'],
      cool: ['……勝てた。……よかった', '……ほっとした'],
      polite: [
        'か、勝てました…団体のみなさんのおかげです…',
        '応援、ありがとうございました…'
      ],
    },
    emotional: {
      _default: ['勝った…！ 勝ったよ…！ みんなありがとう…！', 'この嬉しさ…言葉にならない…！'],
      ojousama: ['勝ちましたわ…！ 感動で涙が…！', '最高ですわ…！ この喜び、忘れませんわ…！'],
      delinquent: ['っしゃああ！ 勝利だあああ！', 'これがウチの力だ…！ 舐めんじゃねえ…！'],
      cool: ['……っ。勝った……よかった', '……（静かに安堵する）'],
      seductive: [
        '勝った……っ……ふふ、団体のために戦えて嬉しい……',
        'みんなのおかげよ……っ……ふふ……'
      ],
      composed: ['…っ…勝った。…よかった'],
    },
  },
};

const PPV_OPPONENT_LINES = {
  normal: {
    _default: [
      '悪いけど、今日は負けるわけにはいかないの',
      'この大舞台、最高の気分ね',
      '正々堂々、最高の試合にしましょう'
    ],
    ojousama: [
      '本日は負けるわけにはまいりません'
    ],
    delinquent: [
      '今日は負けねーぞ。かかってこい'
    ],
    seductive: [
      '今日は負けるわけにはいかないの。覚悟してね'
    ],
    cool: [
      '……受けて立つ。全力だ'
    ],
    polite: [
      '全力でお相手させていただきます。よろしくお願いします'
    ],
    composed: [
      '…いい舞台だね。…全力で行くよ',
      '…負けるつもりはないよ。よろしく'
    ]
  },
  bold: {
    _default: [
      'ぶっ飛ばしてやる！',
      '私の実力、思い知らせてあげる',
      '容赦しないわ。覚悟しなさい！'
    ],
    ojousama: [
      '容赦は出来ないわ。覚悟する事ね'
    ],
    delinquent: [
      'ぶっ潰してやるぜ！泣いても知らねーぞ！'
    ],
    cool: [
      '…手加減はしない。覚悟しろ'
    ],
    seductive: [
      '容赦しないわよ。覚悟してね'
    ],
    polite: [
      '全力で参ります。覚悟してください'
    ],
    composed: [
      '…手加減はしない。…覚悟して'
    ]
  },
  quiet: {
    _default: [
      '……（静かに構えている）'
    ],
    cool: [
      '…結果で語る'
    ],
    polite: [
      '…全力で参ります'
    ],
    seductive: [
      '………行くわよ'
    ],
    composed: [
      '……（静かに構える）'
    ]
  },
  shy: {
    _default: [
      'が、頑張ります…！'
    ],
    polite: [
      'あ、あの方が…相手なんですね…せ、精一杯戦います…'
    ],
  },
  easygoing: {
    _default: [
      'この大舞台、最高の気分！楽しもうぜ！',
      'あんたと戦えるの楽しみにしてた！',
      'すごい大舞台！これは楽しみだねっ！'
    ],
    delinquent: [
      '最高だぜ！楽しもうや！',
      'へぇ、派手な舞台じゃん！せっかくだし楽しもっかな！'
    ],
    seductive: [
      'あなたと戦えるの、楽しみだったわ'
    ],
    polite: [
      '全力で行きます！ よろしくお願いします！'
    ],
    ojousama: [
      '全力で参りますわ！ よろしくお願いいたしますの'
    ],
    composed: [
      'いい舞台だね。…楽しもうか'
    ]
  },
  earnest: {
    _default: [
      'お互い全力で…最高の舞台だもの',
      'この対戦、ずっと待ってました'
    ],
    polite: [
      'お互い全力で…よろしくお願いいたします'
    ],
    ojousama: [
      '全力で参りますわ。よろしくお願いいたしますの'
    ],
    seductive: [
      '全力でいくわ。最高の試合にしましょう'
    ],
    composed: [
      '…全力で行きます。よろしく'
    ]
  },
  emotional: {
    _default: [
      '絶対…絶対負けない…！全力でいく…！'
    ],
    seductive: [
      'あの子が相手……っ……ふふ、燃えてきたわ……'
    ],
    composed: [
      '…負けない。…絶対に'
    ]
  }
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
// P4: Glimpse A層 閾値定義
// ─────────────────────────────────────────────────────────────────────────────
const GLIMPSE_A_THRESHOLDS = [
  // bond上昇
  { id: 'bond_60_up',   axis: 'bond',    dir: 'up',   value: 60, rate: 0.90, tone: 'positive', cooldown: 8,  label: '打ち解けた様子' },
  { id: 'bond_80_up',   axis: 'bond',    dir: 'up',   value: 80, rate: 1.00, tone: 'gold',     cooldown: 8,  label: '深い絆の芽生え' },
  // bond下降
  { id: 'bond_59_down', axis: 'bond',    dir: 'down', value: 59, rate: 0.85, tone: 'negative', cooldown: 8,  label: '距離ができた' },
  { id: 'bond_39_down', axis: 'bond',    dir: 'down', value: 39, rate: 0.90, tone: 'negative', cooldown: 8,  label: '不和の兆し' },
  // rivalry上昇
  { id: 'rivalry_30_up', axis: 'rivalry', dir: 'up',   value: 30, rate: 0.85, tone: 'dramatic', cooldown: 8,  label: '因縁の始まり' },
  { id: 'rivalry_50_up', axis: 'rivalry', dir: 'up',   value: 50, rate: 0.95, tone: 'dramatic', cooldown: 8,  label: '宿敵として意識' },
  { id: 'rivalry_70_up', axis: 'rivalry', dir: 'up',   value: 70, rate: 1.00, tone: 'gold',     cooldown: 8,  label: '宿命のライバル' },
  // rivalry下降
  { id: 'rivalry_29_down', axis: 'rivalry', dir: 'down', value: 29, rate: 0.80, tone: 'calm',  cooldown: 8,  label: '因縁の終息' },
  // trust
  { id: 'trust_below_35', axis: 'trust', dir: 'down', value: 35, rate: 0.95, tone: 'warning',  cooldown: 12, label: '信頼の揺らぎ' },
  { id: 'trust_below_20', axis: 'trust', dir: 'down', value: 20, rate: 1.00, tone: 'danger',   cooldown: 12, label: '不信感の極み' },
  { id: 'trust_above_75', axis: 'trust', dir: 'up',   value: 75, rate: 0.85, tone: 'positive', cooldown: 12, label: '厚い信頼' },
];

// ─────────────────────────────────────────────────────────────────────────────
// P4: Glimpse A層 セリフデータ
// ─────────────────────────────────────────────────────────────────────────────
const GLIMPSE_A_LINES = {
  bond_60_up: {
    normal: {
      _default: [
        '最近、一緒にいるとなんだか居心地がいい気がする',
        '不思議と気が合う。一緒にいて楽なのよね'
      ],
      ojousama: [
        '不思議と波長が合いますの。心地よい距離感ですわ'
      ],
      delinquent: [
        '一緒にいると肩の力が抜けるっつーか',
        'まぁ…悪くないやつだよ'
      ],
      seductive: [
        'なかなか面白い人ね。もっと近くで見ていたい'
      ],
      polite: [
        '一緒にいると自然体でいられます。ありがたいです'
      ],
      cool: [
        'いいバランスだ。やりやすい'
      ]
    },
    bold: {
      _default: [
        'いい空気ね。背中を預けられそう',
        'なかなかやるじゃない。認めてあげてもいいわよ'
      ],
      ojousama: [
        '多少の可愛げはあるわね。無下にはしないつもりよ。'
      ],
      delinquent: [
        '見込みあるよ。面倒見てやるか',
        'フン、気に入ったぜ'
      ],
      seductive: [
        '気に入ったわ。なかなか味のある人ね'
      ],
      polite: [
        '信頼関係が築けそうです。心強いですね'
      ],
      cool: [
        '信用できる。それだけだ'
      ]
    },
    quiet: {
      _default: [
        '……最近、隣にいると落ち着く',
        '……この距離が、静かで心地いい'
      ],
      ojousama: [
        'おそばにいると……不思議と落ち着きますわ'
      ],
      delinquent: [
        '…うるさいけど…嫌いじゃない'
      ],
      seductive: [
        '一緒にいると……なんだか温かいの'
      ],
      polite: [
        '……穏やかな時間を過ごせます'
      ],
      cool: [
        '……悪くない距離感だ'
      ]
    },
    shy: {
      _default: [
        'この人のそばだと…少しだけ自分でいられる気がする…',
        '最近…この人とだけは…普通に話せるようになってきた…かも'
      ],
      ojousama: [
        'おそばですと…少し安心できますの…'
      ],
      delinquent: [
        'あ、うん…悪いやつじゃない…と思う'
      ],
      seductive: [
        '一緒だと…ドキドキするけど…安心もする…'
      ],
      polite: [
        '一緒にいると…少しだけ自分に自信が持てるんです…'
      ],
      cool: [
        'そばにいると…なんだか…落ち着く…'
      ]
    },
    easygoing: {
      _default: [
        'ノリが合うんだよね〜。一緒にいると楽しいわ',
        'あはは、一緒にいると時間忘れちゃう'
      ],
      ojousama: [
        '楽しくお過ごしできますの〜'
      ],
      delinquent: [
        'つるんでると楽しいんだわ、まじで'
      ],
      seductive: [
        '一緒にいて飽きないわ〜'
      ],
      polite: [
        '気楽にお付き合いできて嬉しいです〜'
      ],
      cool: [
        'なんかいい感じ〜。楽でいいわ'
      ]
    },
    emotional: {
      _default: [
        '…考えると胸が温かくなるんです…！',
        '一緒にいると元気が出る…！ 大好き…！'
      ],
      ojousama: [
        '大切に思っておりますの…！'
      ],
      delinquent: [
        'こいつのことはよ…大事にしてやりてぇんだ…！'
      ],
      seductive: [
        '放っておけないの…もう'
      ],
      polite: [
        '一緒の時間が…とても大切なんです…！'
      ],
      cool: [
        '…気になって仕方ない…'
      ]
    },
    earnest: {
      _default: [
        '一緒に練習してて楽しいんです。もっと強くなれる気がして',
        '背中を見てると、自分も頑張ろうって思える'
      ],
      ojousama: [
        '切磋琢磨できること、光栄ですわ'
      ],
      delinquent: [
        '一緒にやってると気合入るんだよな。いい練習相手だ'
      ],
      seductive: [
        '一緒のトレーニング、刺激があっていいわ'
      ],
      polite: [
        'おかげで練習にも身が入ります。感謝しています'
      ],
      cool: [
        '存在が刺激になる。いい関係だ'
      ]
    }
  },
  bond_80_up: {
    normal: {
      _default: [
        'もう仲間とかそういう言葉じゃ足りない。大事な存在。',
        'この人がいるから、ここにいる意味がある'
      ],
      ojousama: [
        'かけがえのない方ですわ。何物にも代えられません'
      ],
      delinquent: [
        'ダチだ。何があっても守ってやる'
      ],
      seductive: [
        '特別な存在。他の誰とも違うの'
      ],
      polite: [
        'なくてはならない方です。心からそう思います'
      ],
      cool: [
        '唯一の、本当の仲間だ'
      ]
    },
    bold: {
      _default: [
        '最高のコンビね。誰にも負けない',
        '二人なら怖いものなんてない'
      ],
      ojousama: [
        '私を支える資格は十分にあるわね'
      ],
      delinquent: [
        '相棒だ。文句あるか'
      ],
      seductive: [
        '最高のコンビネーションよ、私たち'
      ],
      polite: [
        '二人なら、どんな困難も乗り越えられます'
      ],
      cool: [
        '一緒なら、どこまでも戦える'
      ]
    },
    quiet: {
      _default: [
        '……私の光だ',
        '……そばにいてくれれば、それでいい'
      ],
      polite: [
        '……太陽のような存在です'
      ],
      cool: [
        '……この人だけは、信じられる'
      ]
    },
    shy: {
      _default: [
        'この人がいなかったら…私、とっくにダメになってたと思う…',
        'あの人が隣にいるだけで…なんでも頑張れる気がするんです…'
      ],
      polite: [
        'あの人といると…なんだか、心が、安らぐんです…'
      ],
    },
    easygoing: {
      _default: [
        '最高の相棒だよ〜。ずっと一緒にいたいな',
        '一緒にいると全部うまくいく気がするんだよね'
      ],
      delinquent: [
        '一生の仲間だぜ。間違いない'
      ]
    },
    emotional: {
      _default: [
        'この人のためなら何でもできる…！ 絶対に守る…！',
        '出会えてよかった…本当に…！'
      ],
      seductive: [
        'あの子と一緒にいると……っ……ふふ、満たされるの……'
      ],
    },
    earnest: {
      _default: [
        '一緒に頂点を目指したい。二人ならきっと行ける',
        '最高のパートナー。この出会いに感謝してます'
      ],
      polite: [
        '共に歩めること、何よりの幸せです'
      ]
    }
  },
  bond_59_down: {
    normal: {
      _default: [
        '最近、目が合わなくなった気がする',
        '距離…少し開いたかも'
      ],
      ojousama: [
        '少し距離ができたように感じますわ'
      ],
      delinquent: [
        '最近よそよそしくねぇか…'
      ],
      seductive: [
        '最近どこか冷たいわ…気のせいかしら'
      ],
      polite: [
        '少し壁ができたようで…気のせいだといいんですが'
      ],
      cool: [
        '距離感が…変わった'
      ]
    },
    bold: {
      _default: [
        'なんか壁作ってない？ 気に入らないな',
        '前はもっと話してたのに。…何なの'
      ],
      delinquent: [
        'おい、最近態度おかしくね？ ムカつくな'
      ],
      cool: [
        '空気が変わった。…面倒だな'
      ]
    },
    quiet: {
      _default: [
        '……遠くなった',
        '……気づけば、隣にいない'
      ]
    },
    shy: {
      _default: [
        '最近…目を合わせるのが怖い…私、何かしちゃったのかな…',
        'あの人の態度が…前と違う…私のせい…だよね…'
      ],
      polite: [
        '最近…あの人と、少し距離があるような…'
      ],
    },
    easygoing: {
      _default: [
        'あれ〜、最近ちょっと素っ気ないなぁ',
        'ん〜なんだろ、微妙に空気変わった？'
      ]
    },
    emotional: {
      _default: [
        '離れていく…嫌だ…こんなの…',
        'どうして…前みたいに話してくれないの…'
      ],
      seductive: [
        '少し離れちゃったのかしら……っ……ふふ、寂しいわね……'
      ],
    },
    earnest: {
      _default: [
        'この距離…自分の何がいけなかったんだろう',
        'もう一度、分かり合えるように努力しなきゃ'
      ],
      polite: [
        '関係を修復したいです…何とかしなければ'
      ]
    }
  },
  bond_39_down: {
    normal: {
      _default: [
        '…もうダメかもしれない',
        '顔を合わせるだけで気まずい'
      ],
      ojousama: [
        'もう以前のようには戻れませんわ'
      ],
      delinquent: [
        '顔見るとイラつくんだよ'
      ],
      seductive: [
        'もう…合わないみたいね'
      ],
      polite: [
        'もう以前のようには…すみません'
      ],
      cool: [
        '…相容れない'
      ]
    },
    bold: {
      _default: [
        '合わない。どうしても合わない',
        'これ以上は無理ね。それだけ'
      ],
      delinquent: [
        '虫が好かねぇんだよ'
      ]
    },
    quiet: {
      _default: [
        '……もう、終わりだ'
      ]
    },
    shy: {
      _default: [
        '…もう…同じ部屋にいるだけで…苦しい…'
      ],
      polite: [
        'あの人とは…もう、前みたいには、戻れないんでしょうか…'
      ],
    },
    easygoing: {
      _default: [
        'う〜ん、ちょっと合わないかもなぁ…'
      ]
    },
    emotional: {
      _default: [
        '考えると苦しい…もう無理…'
      ],
      seductive: [
        'もう戻れないのかしら……っ……ふふ、切ないわ……'
      ],
    },
    earnest: {
      _default: [
        'この関係…修復できる自信がない…',
        'どこで間違えたんだろう…'
      ]
    }
  },
  rivalry_30_up: {
    normal: {
      _default: [
        '…最近やたら気になる。負けたくない',
        'どうしても…意識してしまう'
      ],
      ojousama: [
        '負けたくありませんわ…こんな気持ちは初めて'
      ],
      delinquent: [
        '目障りなんだよ…ぶっ潰してやる'
      ],
      seductive: [
        '気になるわ…潰しがいがありそうね'
      ],
      polite: [
        'どうしても負けたくないんです…この気持ちは…'
      ],
      cool: [
        'この存在が…引っかかる'
      ]
    },
    bold: {
      _default: [
        '面白いじゃない。超えてみせるわ',
        'ようやく面白い相手が出てきた'
      ],
      delinquent: [
        '面ぁ見ると血が騒ぐんだよ'
      ],
      cool: [
        '…倒すべき相手だ'
      ],
      ojousama: [
        '打ち負かすこと、楽しみにしておりますわ'
      ],
      seductive: [
        'なかなかの逸材ね。ふふ、楽しみ'
      ]
    },
    quiet: {
      _default: [
        '……考えてしまう。どうしても',
        '……燃えている。自分の中で'
      ],
      cool: [
        '……気になる。ただ、それだけだが'
      ]
    },
    shy: {
      _default: [
        'あの人のこと…考えると胸がきゅってなる…負けたくない…',
        '練習してるのを見かけると…自分も走り出したくなる…'
      ],
      polite: [
        'あ、あの人には…ま、負けたくないです…'
      ],
    },
    easygoing: {
      _default: [
        'いい勝負になりそうだね〜。燃えてきた',
        'あはは、負けたくないなぁ'
      ],
      delinquent: [
        'やり合うの、ワクワクすんだよな'
      ]
    },
    emotional: {
      _default: [
        '絶対に負けない…！ 絶対に…！',
        '考えると胸が熱くなる…！'
      ],
      seductive: [
        'あの子には……っ……ふふ、絶対に負けたくないの……'
      ],
    },
    earnest: {
      _default: [
        '意識し始めてる。負けたくない',
        '超えることが、今の一番の目標だ'
      ],
      polite: [
        '勝つために、もっと努力しなければなりません'
      ]
    }
  },
  rivalry_50_up: {
    normal: {
      _default: [
        '絶対に負けられない。絶対に',
        '名前を聞くだけで拳が握りしまる'
      ],
      ojousama: [
        '何としてでも超えてみせますわ'
      ],
      delinquent: [
        '絶対ぶっ倒す。覚悟しろ'
      ],
      seductive: [
        'どうしても許せない。必ず私が勝つわ'
      ],
      polite: [
        '絶対に負けるわけにはいきません'
      ],
      cool: [
        '倒すまで、止まれない'
      ]
    },
    bold: {
      _default: [
        '全力を出せる相手。ここから先が楽しみね',
        '超える。今はそれしか考えてない'
      ],
      delinquent: [
        '這いつくばらせてやる…！'
      ],
      cool: [
        '認めたくないが…最高の敵だ'
      ],
      ojousama: [
        '打ち破ることが、わたくしの使命ですわ'
      ]
    },
    quiet: {
      _default: [
        '……認めたくないけど、意識してる',
        '……そのことばかり考えている'
      ],
      cool: [
        '……超えないと、先へ進めない'
      ]
    },
    shy: {
      _default: [
        'あの人にだけは…絶対に負けたくない…今はそれだけ…',
        '怖い…けど、逃げたらもっと後悔する…だから…'
      ],
      polite: [
        'あの人を…意識せずには、いられません…'
      ],
    },
    easygoing: {
      _default: [
        '本気でやり合いたい相手って、そうはいないよ',
        'ふふ、考えると自然と気合入るわ'
      ]
    },
    emotional: {
      _default: [
        'くっ…考えると熱くなる…！',
        '絶対に…超えてみせる…！！'
      ],
      seductive: [
        'あの子のこと……っ……頭から離れないの……'
      ],
    },
    earnest: {
      _default: [
        'この人を超えないと、次がない',
        '一番の壁。だから越えなきゃいけない'
      ],
      polite: [
        '超えることが、今の目標です'
      ]
    }
  },
  rivalry_70_up: {
    normal: {
      _default: [
        'もう離れられないんだと思う。この人とは',
        'この人がいなかったら、今の自分はない'
      ],
      ojousama: [
        '強い因縁を感じます…この方とは'
      ],
      delinquent: [
        'この勝負が全てだ。他はどうでもいい'
      ],
      seductive: [
        '私のすべて…最高の相手よ'
      ],
      polite: [
        'この人との戦いが…私のプロレスそのものです'
      ],
      cool: [
        '決着をつけるまで、死んでも死にきれない'
      ]
    },
    bold: {
      _default: [
        'この人がいるから強くなれた。感謝してる…でも負けない',
        'この戦いはずっと続く。望むところよ'
      ],
      delinquent: [
        'ずっと殴り合ってやる。最後まで'
      ],
      cool: [
        '生涯をかけた勝負になる'
      ]
    },
    quiet: {
      _default: [
        '……この相手がいる限り、立ち続ける',
        '……言葉はいらない。リングで'
      ]
    },
    shy: {
      _default: [
        'この人がいなかったら…今の私はいない。それだけは…わかる',
        '逃げたい…でも…この人からだけは逃げちゃダメ…'
      ],
      polite: [
        'あ、あの人とは…絶対に、決着をつけたいです…'
      ],
    },
    easygoing: {
      _default: [
        'この試合が一番楽しい。ずっと続けばいいのに',
        'ずっと一緒に走っていたいね〜。最高だよ'
      ]
    },
    emotional: {
      _default: [
        'この人がいなかったら今の私はなかった…！',
        'まだまだ終わらない…！ ずっと戦い続ける…！'
      ],
      seductive: [
        'あの子とは……っ……決着をつけずにはいられない……'
      ],
    },
    earnest: {
      _default: [
        'この人が自分を高めてくれる。だから負けたくない',
        '戦えることに感謝してる。でも次は絶対に勝つ'
      ],
      polite: [
        'この人と競い合えることが、私の原動力です'
      ]
    }
  },
  rivalry_29_down: {
    normal: {
      _default: [
        '前ほど意識しなくなったかもしれない',
        'あの張り合いも…もう終わったのかな'
      ],
      ojousama: [
        'もう過去のことですわ'
      ],
      delinquent: [
        '…もう興味ねーよ'
      ],
      seductive: [
        'もういいかしら。次を探さなきゃ'
      ],
      polite: [
        '関係も、穏やかになってきました'
      ],
      cool: [
        '…執着は、消えたか'
      ]
    },
    bold: {
      _default: [
        '……もう終わったこと',
        '決着はついた。次に進む'
      ],
      delinquent: [
        '時代は終わりだ。もう眼中にねぇ'
      ]
    },
    quiet: {
      _default: [
        '……もう、考えない',
        '……もう、何も感じない'
      ]
    },
    shy: {
      _default: [
        '最近…あの人のこと、前ほど気にならなくなった…かも',
        'あの頃のピリピリした感じ…もうないかな…'
      ],
      polite: [
        'あの人と…もう、競う気持ちが薄れてきたかもしれません…'
      ],
    },
    easygoing: {
      _default: [
        '熱い関係も一段落かぁ。ちょっと寂しいね',
        'まぁずっと続くわけじゃないよね〜'
      ]
    },
    emotional: {
      _default: [
        '終わっちゃったんだ…少し寂しい…',
        '……あの熱さが消えていく。これでいいのかな…'
      ],
      seductive: [
        'あの子と争う気持ちが……っ……ふふ、少し冷めてきたわ……'
      ],
    },
    earnest: {
      _default: [
        '関係も変わった。前に進もう',
        'あの頃から学んだことは多い。次の目標を見つけなきゃ'
      ]
    }
  },
  trust_below_35: {
    normal: {
      _default: [
        'この団体で…本当にやっていけるのかな',
        '自分のこと、ちゃんと見てくれてるのかな…'
      ],
      ojousama: [
        'この団体の運営方針に…疑問を感じますわ'
      ],
      delinquent: [
        'ここ、ちゃんとしてんのかよ…不安になるぜ'
      ],
      seductive: [
        'ここにいる意味…本当にあるのかしら'
      ],
      polite: [
        'すみません…少し不安になってきました…'
      ],
      cool: [
        'この環境に…疑問を感じ始めている'
      ]
    },
    bold: {
      _default: [
        'この扱いは何？ 私の実力、わかってるの',
        'ここにいていいのか…考え直す時期かもしれない'
      ],
      delinquent: [
        'なめんじゃねぇぞ。あたしをもっと使え'
      ],
      ojousama: [
        'わたくしの価値を、理解出来ていないのね'
      ]
    },
    quiet: {
      _default: [
        '……ここにいていいのか、分からなくなってきた'
      ],
      cool: [
        '……この場所に、未来はあるのか'
      ]
    },
    shy: {
      _default: [
        '…ここに私の居場所なんて…あるのかな……'
      ],
      polite: [
        'あ、あの…少し、わたしを見ていただけてないような…'
      ],
    },
    easygoing: {
      _default: [
        'う〜ん、最近ちょっとモヤモヤするなぁ…',
        'まぁ大丈夫…だよね？ ちょっと不安だけど'
      ]
    },
    emotional: {
      _default: [
        '不安…こんなんでいいの…？ 私のこと忘れてない…？'
      ],
      seductive: [
        '……っ……ちょっと、寂しいの……'
      ],
    },
    earnest: {
      _default: [
        'この団体の方針に…少し不安を感じています',
        '自分の居場所がここにあるのか…考えてしまう'
      ],
      polite: [
        '恐縮ですが…少し運営に対して不安があります…'
      ]
    }
  },
  trust_below_20: {
    normal: {
      _default: [
        'もう限界かもしれない。ここにいる理由が見つからない',
        '…他の団体のことを、考え始めてしまっている'
      ],
      ojousama: [
        'このような扱いを受ける覚えはございませんわ'
      ],
      delinquent: [
        'こんなとこ、もういられるか。出て行ってやる'
      ],
      seductive: [
        'ここにはもう何も残ってないわ'
      ],
      polite: [
        '…すみません。もう限界かもしれません'
      ],
      cool: [
        'ここにいる理由が…もうない'
      ]
    },
    bold: {
      _default: [
        'ふざけないで。私の価値がわからないなら、もう付き合いきれない',
        'この扱いは許せない。覚えておいて'
      ],
      delinquent: [
        'あたしを舐めてんなら出てってやるよ。後悔するなよ'
      ]
    },
    quiet: {
      _default: [
        '……（荷物をまとめ始めている）',
        '……もう、何も感じない'
      ]
    },
    shy: {
      _default: [
        '…もう…無理…ここにいちゃいけない気がする……'
      ],
      polite: [
        'わ、わたしのこと…どう思っていらっしゃるんでしょうか…'
      ],
    },
    easygoing: {
      _default: [
        'さすがにこれは…笑えないかも',
        'あはは…って笑ってる場合じゃないよね、これ'
      ]
    },
    emotional: {
      _default: [
        'もう…信じられない…！ どうして…！',
        '裏切られた…全部…嘘だったの…？'
      ],
      seductive: [
        'わたしのこと……っ……もう、どうでもいいのかしら……'
      ],
    },
    earnest: {
      _default: [
        '信頼してたのに…もうここでは頑張れないかもしれない',
        '自分の全力を尽くしてきたつもりです。でも、もう…'
      ],
      polite: [
        '大変申し訳ありませんが…退団を検討させていただきます'
      ]
    }
  },
  trust_above_75: {
    normal: {
      _default: [
        'この団体に来てよかった。ここが自分の居場所だ',
        'みんなと一緒にもっと上を目指したい'
      ],
      ojousama: [
        'ここがわたくしの居場所。誇りに思います'
      ],
      delinquent: [
        'ここはあたしの場所だ。誰にも渡さねぇ'
      ],
      seductive: [
        'ここでなら…私らしくいられるわ'
      ],
      polite: [
        'この団体の一員でいられて…本当に幸せです'
      ],
      cool: [
        'ここが…自分の場所だ'
      ]
    },
    bold: {
      _default: [
        'ここが最高の場所。私がもっと強くしてみせる',
        'この団体を背負っていく覚悟はできてるよ'
      ],
      delinquent: [
        'ここは最高だ。あたしがてっぺんまで連れてってやるよ'
      ],
      ojousama: [
        'この団体の看板、わたくしが背負って差し上げますわ'
      ]
    },
    quiet: {
      _default: [
        '……ここにいたい。ずっと',
        '……この場所を、守りたい'
      ]
    },
    shy: {
      _default: [
        'ここにいていいんだ…って…最近やっと思えるようになりました…',
        'この団体に来れて…よかった…心からそう思います…'
      ],
      polite: [
        'いつも気にかけてくださって…あ、あの、本当に、感謝しています…'
      ],
    },
    easygoing: {
      _default: [
        'ここ最高〜！ みんなとやるの楽しいよ！',
        'この団体、すっごく居心地いいんだよね〜'
      ]
    },
    emotional: {
      _default: [
        'みんなのこと…大好き…！ この団体のために全力を尽くす…！',
        'ここで出会えた仲間は宝物…絶対に裏切らない…！'
      ],
      seductive: [
        'いつも見ていてくれて……っ……ふふ、嬉しいの……'
      ],
    },
    earnest: {
      _default: [
        'この団体に貢献できるよう、これからも全力で努力します',
        'ここでプロレスができる幸せを噛みしめています'
      ],
      polite: [
        'ご期待に添えるよう、精一杯頑張らせていただきます'
      ]
    }
  }
};

GLIMPSE_A_LINES.bond_60_up = {
  normal: {
    _default: ['最近、一緒にいるとなんだか居心地がいい気がする', '不思議と気が合う。一緒にいて楽なのよね'],
    ojousama: ['不思議と波長が合いますの。心地よい距離感ですわ'],
    delinquent: ['一緒にいると肩の力が抜けるっつーか', 'まぁ…悪くないやつだよ'],
    seductive: ['なかなか面白い人ね。もっと近くで見ていたい'],
    polite: ['一緒にいると自然体でいられます。ありがたいです'],
    cool: ['いいバランスだ。やりやすい'],
    composed: ['…悪くない距離感だね。一緒にいて楽だ'],
  },
  bold: {
    _default: ['いい空気ね。背中を預けられそう', 'なかなかやるじゃない。認めてあげてもいいかな'],
    ojousama: ['良き仲間になれそうですわ。認めてあげます'],
    delinquent: ['見込みあるよ。面倒見てやるか', 'フン、気に入ったぜ'],
    seductive: ['気に入ったわ。なかなか味のある人ね'],
    polite: ['信頼関係が築けそうです。心強いですね'],
    cool: ['信用できる。それだけだ'],
    composed: ['…なかなかやるね。認めてあげてもいいかな'],
  },
  quiet: {
    _default: ['……最近、隣にいると落ち着く', '……この距離が、静かで心地いい'],
    ojousama: ['おそばにいると……不思議と落ち着きますわ'],
    delinquent: ['…うるさいけど…嫌いじゃない'],
    seductive: ['一緒にいると……なんだか温かいの'],
    polite: ['……穏やかな時間を過ごせます'],
    cool: ['……悪くない距離感だ'],
    composed: ['……居心地がいい。…静かでいい'],
  },
  shy: {
    _default: ['この人のそばだと…少しだけ自分でいられる気がする…', '最近…この人とだけは…普通に話せるようになってきた…かも'],
    ojousama: ['おそばですと…少し安心できますの…'],
    delinquent: ['あ、うん…悪いやつじゃない…と思う'],
    seductive: ['一緒だと…ドキドキするけど…安心もする…'],
    polite: ['一緒にいると…少しだけ自分に自信が持てるんです…'],
    cool: ['そばにいると…なんだか…落ち着く…'],
  },
  easygoing: {
    _default: ['ノリが合うんだよね〜。一緒にいると楽しいわ', 'あはは、一緒にいると時間忘れちゃう'],
    ojousama: ['楽しくお過ごしできますの〜'],
    delinquent: ['つるんでると楽しいんだわ、まじで'],
    seductive: ['一緒にいて飽きないわ〜'],
    polite: ['気楽にお付き合いできて嬉しいです〜'],
    cool: ['なんかいい感じ〜。楽でいいわ'],
    composed: ['…一緒にいると楽でいいね'],
  },
  emotional: {
    _default: ['…考えると胸が温かくなるんです…！', '一緒にいると元気が出る…！ 大好き…！'],
    ojousama: ['大切に思っておりますの…！'],
    delinquent: ['こいつのことはよ…大事にしてやりてぇんだ…！'],
    seductive: ['放っておけないの…もう'],
    polite: ['一緒の時間が…とても大切なんです…！'],
    cool: ['…気になって仕方ない…'],
    composed: ['…っ…大事な存在だ。…うん'],
  },
  earnest: {
    _default: ['一緒に練習してて楽しいんです。もっと強くなれる気がして', '背中を見てると、自分も頑張ろうって思える'],
    ojousama: ['切磋琢磨できること、光栄ですわ'],
    delinquent: ['一緒にやってると気合入るんだよな。いい練習相手だ'],
    seductive: ['一緒のトレーニング、刺激があっていいわ'],
    polite: ['おかげで練習にも身が入ります。感謝しています'],
    cool: ['存在が刺激になる。いい関係だ'],
    composed: ['…いい刺激をもらってる。ありがたいね'],
  },
};

GLIMPSE_A_LINES.bond_80_up = {
  normal: {
    _default: ['もう仲間とかそういう言葉じゃ足りない。大事な存在。', 'この人がいるから、ここにいる意味がある'],
    ojousama: ['かけがえのない方ですわ。何物にも代えられません'],
    delinquent: ['ダチだ。何があっても守ってやる'],
    seductive: ['特別な存在。他の誰とも違うの'],
    polite: ['なくてはならない方です。心からそう思います'],
    cool: ['唯一の、本当の仲間だ'],
    composed: ['…大事な存在。…それだけで十分'],
  },
  bold: {
    _default: ['最高のコンビね。誰にも負けない', '二人なら怖いものなんてない'],
    ojousama: ['わたくしたち、最強のペアですわ'],
    delinquent: ['相棒だ。文句あるか'],
    seductive: ['最高のコンビネーションよ、私たち'],
    polite: ['二人なら、どんな困難も乗り越えられます'],
    cool: ['一緒なら、どこまでも戦える'],
    composed: ['…最高の相棒だね。…二人なら怖いものはない'],
  },
  quiet: {
    _default: ['……私の光だ', '……そばにいてくれれば、それでいい'],
    polite: ['……太陽のような存在です'],
    cool: ['……この人だけは、信じられる'],
    composed: ['……そばにいてくれるだけで、十分だ'],
  },
  shy: {
    _default: ['この人がいなかったら…私、とっくにダメになってたと思う…', 'あの人が隣にいるだけで…なんでも頑張れる気がするんです…'],
  },
  easygoing: {
    _default: ['最高の相棒だよ〜。ずっと一緒にいたいな', '一緒にいると全部うまくいく気がするんだよね'],
    delinquent: ['一生の仲間だぜ。間違いない'],
    composed: ['…最高の相棒だよ。ずっとこの距離がいいね'],
  },
  emotional: {
    _default: ['この人のためなら何でもできる…！ 絶対に守る…！', '出会えてよかった…本当に…！'],
    composed: ['…っ…出会えてよかった。…本当に'],
  },
  earnest: {
    _default: ['一緒に頂点を目指したい。二人ならきっと行ける', '最高のパートナー。この出会いに感謝してます'],
    polite: ['共に歩めること、何よりの幸せです'],
    composed: ['…一緒に上を目指せる。…いい関係だ'],
  },
};

GLIMPSE_A_LINES.bond_59_down = {
  normal: {
    _default: ['最近、目が合わなくなった気がする', '距離…少し開いたかも'],
    ojousama: ['少し距離ができたように感じますわ'],
    delinquent: ['最近よそよそしくねぇか…'],
    seductive: ['最近どこか冷たいわ…気のせいかしら'],
    polite: ['少し壁ができたようで…気のせいだといいんですが'],
    cool: ['距離感が…変わった'],
    composed: ['…少し距離が開いたかな'],
  },
  bold: {
    _default: ['なんか壁作ってない？ 気に入らないな', '前はもっと話してたのに。…何なの'],
    delinquent: ['おい、最近態度おかしくね？ ムカつくな'],
    cool: ['空気が変わった。…面倒だな'],
    composed: ['…壁作ってない？ …まあ、いいけど'],
  },
  quiet: {
    _default: ['……遠くなった', '……気づけば、隣にいない'],
  },
  shy: {
    _default: ['最近…目を合わせるのが怖い…私、何かしちゃったのかな…', 'あの人の態度が…前と違う…私のせい…だよね…'],
  },
  easygoing: {
    _default: ['あれ〜、最近ちょっと素っ気ないなぁ', 'ん〜なんだろ、微妙に空気変わった？'],
    composed: ['…あれ、なんか距離感変わった？'],
  },
  emotional: {
    _default: ['離れていく…嫌だ…こんなの…', 'どうして…前みたいに話してくれないの…'],
    composed: ['…っ…まあ、仕方ないか'],
  },
  earnest: {
    _default: ['この距離…自分の何がいけなかったんだろう', 'もう一度、分かり合えるように努力しなきゃ'],
    polite: ['関係を修復したいです…何とかしなければ'],
    composed: ['…この距離感。…直す方法を考えないとね'],
  },
};

GLIMPSE_A_LINES.bond_39_down = {
  normal: {
    _default: ['…もうダメかもしれない', '顔を合わせるだけで気まずい'],
    ojousama: ['もう以前のようには戻れませんわ'],
    delinquent: ['顔見るとイラつくんだよ'],
    seductive: ['もう…合わないみたいね'],
    polite: ['もう以前のようには…すみません'],
    cool: ['…相容れない'],
    composed: ['…合わないね。…仕方ない'],
  },
  bold: {
    _default: ['合わない。どうしても合わない', 'これ以上は無理ね。それだけ'],
    delinquent: ['虫が好かねぇんだよ'],
    composed: ['…無理なものは無理。…それだけ'],
  },
  quiet: {
    _default: ['……もう、終わりだ'],
  },
  shy: {
    _default: ['…もう…同じ部屋にいるだけで…苦しい…'],
  },
  easygoing: {
    _default: ['う〜ん、ちょっと合わないかもなぁ…'],
    composed: ['…合わないなぁ。…まあ、そういうこともある'],
  },
  emotional: {
    _default: ['考えると苦しい…もう無理…'],
    composed: ['…っ…もう、いい'],
  },
  earnest: {
    _default: ['この関係…修復できる自信がない…', 'どこで間違えたんだろう…'],
    composed: ['…この関係は…もう戻らないかもね'],
  },
};

GLIMPSE_A_LINES.rivalry_30_up = {
  normal: {
    _default: ['…最近やたら気になる。負けたくない', 'どうしても…意識してしまう'],
    ojousama: ['負けたくありませんわ…こんな気持ちは初めて'],
    delinquent: ['目障りなんだよ…ぶっ潰してやる'],
    seductive: ['気になるわ…潰しがいがありそうね'],
    polite: ['どうしても負けたくないんです…この気持ちは…'],
    cool: ['この存在が…引っかかる'],
    composed: ['…気になるね。…負けたくない'],
  },
  bold: {
    _default: ['面白いじゃない。超えてみせるわ', 'ようやく面白い相手が出てきた'],
    delinquent: ['面ぁ見ると血が騒ぐんだよ'],
    cool: ['…倒すべき相手だ'],
    ojousama: ['打ち負かすこと、楽しみにしておりますわ'],
    seductive: ['なかなかの逸材ね。ふふ、楽しみ'],
    composed: ['…面白い相手だね。…超えてみせるよ'],
  },
  quiet: {
    _default: ['……考えてしまう。どうしても', '……燃えている。自分の中の何かが'],
    cool: ['……気になる。ただ、それだけだが'],
  },
  shy: {
    _default: ['あの人のこと…考えると胸がきゅってなる…負けたくない…', '練習してるのを見かけると…自分も走り出したくなる…'],
  },
  easygoing: {
    _default: ['いい勝負になりそうだね〜。燃えてきた', 'あはは、負けたくないなぁ'],
    delinquent: ['やり合うの、ワクワクすんだよな'],
    composed: ['…いい相手だね。…負けたくないな'],
  },
  emotional: {
    _default: ['絶対に負けない…！ 絶対に…！', '考えると胸が熱くなる…！'],
    composed: ['…っ…負けるわけにはいかない'],
  },
  earnest: {
    _default: ['ライバルとして意識し始めている自分がいる', '超えることが、今の一番の目標だ'],
    polite: ['勝つために、もっと努力しなければなりません'],
    composed: ['…超えるべき相手が見えた。…やるしかない'],
  },
};

GLIMPSE_A_LINES.rivalry_50_up = {
  normal: {
    _default: ['絶対に負けられない。絶対に', '名前を聞くだけで拳が握りしまる'],
    ojousama: ['何としてでも超えてみせますわ'],
    delinquent: ['絶対ぶっ倒す。覚悟しろ'],
    seductive: ['どうしても許せない。必ず私が勝つわ'],
    polite: ['絶対に負けるわけにはいきません'],
    cool: ['倒すまで、止まれない'],
    composed: ['…負けるわけにはいかない。…絶対に'],
  },
  bold: {
    _default: ['全力を出せる相手。最高の敵ね', '超える。それが今の私の全て'],
    delinquent: ['這いつくばらせてやる…！'],
    cool: ['認めたくないが…最高の敵だ'],
    ojousama: ['打ち破ることが、わたくしの使命ですわ'],
    composed: ['…最高の敵だね。…超える。それだけ'],
  },
  quiet: {
    _default: ['……認めたくないけど、意識してる', '……そのことばかり考えている'],
    cool: ['……超えなければ、先へ進めない'],
  },
  shy: {
    _default: ['あの人にだけは…絶対に負けたくない…今はそれだけ…', '怖い…けど、逃げたらもっと後悔する…だから…'],
  },
  easygoing: {
    _default: ['本気でやり合いたい相手って、そうはいないよ', 'ふふ、考えると自然と気合入るわ'],
    composed: ['…本気でやれる相手。…楽しみだね'],
  },
  emotional: {
    _default: ['くっ…考えると熱くなる…！', '絶対に…超えてみせる…！！'],
    composed: ['…っ…超える。…必ず'],
  },
  earnest: {
    _default: ['この壁を超えない限り、自分の成長はない', '最大の壁。だからこそ、越えなきゃいけない'],
    polite: ['超えることが、私の覚悟です'],
    composed: ['…この壁を越えないと先がない。…やるよ'],
  },
};

GLIMPSE_A_LINES.rivalry_70_up = {
  normal: {
    _default: ['もう運命みたいなものだと思ってる', 'この存在がなかったら、今の自分はいない'],
    ojousama: ['わたくしの宿命ですわ…それ以外に言葉がない'],
    delinquent: ['この勝負が全てだ。他はどうでもいい'],
    seductive: ['私の全て…最高の獲物よ'],
    polite: ['この戦いが…私のプロレス人生そのものです'],
    cool: ['決着をつけるまで、死んでも死にきれない'],
    composed: ['…運命みたいなものだね。…この人とは'],
  },
  bold: {
    _default: ['この人がいるから強くなれた。感謝してる…でも負けない', 'この戦いは一生続く。望むところよ'],
    delinquent: ['生涯の敵だ。最後まで殴り合ってやる'],
    cool: ['生涯をかけた勝負になる'],
    composed: ['…生涯の勝負だ。…望むところ'],
  },
  quiet: {
    _default: ['……この相手がいる限り、リングに立ち続ける', '……言葉はいらない。リングの上で語り合おう'],
  },
  shy: {
    _default: ['この人がいなかったら…今の私はいない。それだけは…わかる', '逃げたい…でも…この人からだけは逃げちゃダメ…'],
  },
  easygoing: {
    _default: ['この試合が一番楽しい。ずっとこの関係が続けばいいのに', '運命のライバルだね〜。最高だよ'],
    composed: ['…ずっとやり合っていたいね。…最高の相手だ'],
  },
  emotional: {
    _default: ['この出会いがなければ今の私はなかった…！', 'この因縁に終わりなんてない…！ 永遠に戦い続ける…！'],
    composed: ['…っ…この人がいなければ今の私はいない'],
  },
  earnest: {
    _default: ['この存在が自分を高めてくれる。これが宿命というものか', '戦えることに感謝してる。でも次は絶対に勝つ'],
    polite: ['この切磋琢磨こそが、私の原動力です'],
    composed: ['…この人が自分を高めてくれる。…感謝、でも負けない'],
  },
};

GLIMPSE_A_LINES.rivalry_29_down = {
  normal: {
    _default: ['前ほど意識しなくなったかもしれない', 'あの因縁も…もう終わったのかな'],
    ojousama: ['もう過去のことですわ'],
    delinquent: ['…もう興味ねーよ'],
    seductive: ['もういいかしら。次を探さなきゃ'],
    polite: ['関係も、穏やかになってきました'],
    cool: ['…執着は、消えたか'],
    composed: ['…もう終わったことだね'],
  },
  bold: {
    _default: ['……もう終わったこと', '決着はついた。次に進む'],
    delinquent: ['時代は終わりだ。もう眼中にねぇ'],
    composed: ['…終わった。…次に行くよ'],
  },
  quiet: {
    _default: ['……もう、考えない', '……風が止んだ。そんな感覚だ'],
  },
  shy: {
    _default: ['最近…あの人のこと、前ほど気にならなくなった…かも', 'あの頃のピリピリした感じ…もうないかな…'],
  },
  easygoing: {
    _default: ['熱い関係も一段落かぁ。ちょっと寂しいね', 'まぁ因縁も永遠じゃないよね〜'],
    composed: ['…一段落かぁ。…まあ、そういうもんだね'],
  },
  emotional: {
    _default: ['因縁…終わっちゃったんだ…少し寂しい…', '……あの熱さが消えていく。これでいいのかな…'],
    composed: ['…っ…終わったか。…少し寂しいな'],
  },
  earnest: {
    _default: ['関係も変わった。前に進もう', 'あの因縁から学んだことは多い。次の目標を見つけなきゃ'],
    composed: ['…学ぶことは多かった。…前に進もう'],
  },
};

GLIMPSE_A_LINES.trust_below_35 = {
  normal: {
    _default: ['この団体で…本当にやっていけるのかな', '自分のこと、ちゃんと見てくれてるのかな…'],
    ojousama: ['この団体の運営方針に…疑問を感じますわ'],
    delinquent: ['ここ、ちゃんとしてんのかよ…不安になるぜ'],
    seductive: ['ここにいる意味…本当にあるのかしら'],
    polite: ['すみません…少し不安になってきました…'],
    cool: ['この環境に…疑問を感じ始めている'],
    composed: ['…ここで本当にやれるのかな'],
  },
  bold: {
    _default: ['この扱いは何？ 私の実力、わかってるの', 'ここにいていいのか…考え直す時期かもしれない'],
    delinquent: ['なめんじゃねぇぞ。あたしをもっと使え'],
    ojousama: ['わたくしの価値をご理解いただけていませんわね'],
    composed: ['…この扱いは、ちょっとどうかと思うけど'],
  },
  quiet: {
    _default: ['……ここにいていいのか、分からなくなってきた'],
    cool: ['……この場所に、未来はあるのか'],
  },
  shy: {
    _default: ['…ここに私の居場所なんて…あるのかな……'],
  },
  easygoing: {
    _default: ['う〜ん、最近ちょっとモヤモヤするなぁ…', 'まぁ大丈夫…だよね？ ちょっと不安だけど'],
    composed: ['…最近ちょっとモヤモヤするなぁ'],
  },
  emotional: {
    _default: ['不安…こんなんでいいの…？ 私のこと忘れてない…？'],
    composed: ['…っ…大丈夫、かな'],
  },
  earnest: {
    _default: ['この団体の方針に…少し不安を感じています', '自分の居場所がここにあるのか…考えてしまう'],
    polite: ['恐縮ですが…少し運営に対して不安があります…'],
    composed: ['…少し不安を感じ始めてる。…気のせいだといいけど'],
  },
};

GLIMPSE_A_LINES.trust_below_20 = {
  normal: {
    _default: ['もう限界かもしれない。ここにいる理由が見つからない', '…他の団体のことを、考え始めてしまっている'],
    ojousama: ['このような扱いを受ける覚えはございませんわ'],
    delinquent: ['こんなとこ、もういられるか。出て行ってやる'],
    seductive: ['ここにはもう何も残ってないわ'],
    polite: ['…すみません。もう限界かもしれません'],
    cool: ['ここにいる理由が…もうない'],
    composed: ['…ここにいる理由が、見つからなくなった'],
  },
  bold: {
    _default: ['ふざけないで。私の価値がわからないなら、もう付き合いきれない', 'この扱いは許せない。覚えておいて'],
    delinquent: ['あたしを舐めてんなら出てってやるよ。後悔するなよ'],
    composed: ['…もう付き合いきれないかな。…覚えておいて'],
  },
  quiet: {
    _default: ['……（荷物をまとめ始めている）', '……もう、何も感じない'],
  },
  shy: {
    _default: ['…もう…無理…ここにいちゃいけない気がする……'],
  },
  easygoing: {
    _default: ['さすがにこれは…笑えないかも', 'あはは…って笑ってる場合じゃないよね、これ'],
    composed: ['…さすがに、これは笑えない'],
  },
  emotional: {
    _default: ['もう…信じられない…！ どうして…！', '裏切られた…全部…嘘だったの…？'],
    composed: ['…っ…もう、いいかな'],
  },
  earnest: {
    _default: ['信頼してたのに…もうここでは頑張れないかもしれない', '自分の全力を尽くしてきたつもりです。でも、もう…'],
    polite: ['大変申し訳ありませんが…退団を検討させていただきます'],
    composed: ['…全力を尽くしてきたつもりだ。…でも、もう'],
  },
};

GLIMPSE_A_LINES.trust_above_75 = {
  normal: {
    _default: ['この団体に来てよかった。ここが自分の居場所だ', 'みんなと一緒にもっと上を目指したい'],
    ojousama: ['ここがわたくしの居場所ですわ。誇りに思います'],
    delinquent: ['ここはあたしの場所だ。誰にも渡さねぇ'],
    seductive: ['ここでなら…私らしくいられるわ'],
    polite: ['この団体の一員でいられて…本当に幸せです'],
    cool: ['ここが…自分の場所だ'],
    composed: ['…ここが自分の居場所だね。…悪くない'],
  },
  bold: {
    _default: ['ここが最高の場所。私がもっと強くしてみせる', 'この団体を背負っていく覚悟はできてるよ'],
    delinquent: ['ここは最高だ。あたしがてっぺんまで連れてってやるよ'],
    ojousama: ['この団体の看板、わたくしが背負って差し上げますわ'],
    composed: ['…ここが最高の場所だ。…もっと強くしてみせる'],
  },
  quiet: {
    _default: ['……ここにいたい。ずっと', '……この場所を、守りたい'],
  },
  shy: {
    _default: ['ここにいていいんだ…って…最近やっと思えるようになりました…', 'この団体に来れて…よかった…心からそう思います…'],
  },
  easygoing: {
    _default: ['ここ最高〜！ みんなとやるの楽しいよ！', 'この団体、すっごく居心地いいんだよね〜'],
    composed: ['…居心地いいね。…最高だ'],
  },
  emotional: {
    _default: ['みんなのこと…大好き…！ この団体のために全力を尽くす…！', 'ここで出会えた仲間は宝物…絶対に裏切らない…！'],
    composed: ['…っ…ここにいてよかった。…みんな、ありがとう'],
  },
  earnest: {
    _default: ['この団体に貢献できるよう、これからも全力で努力します', 'ここでプロレスができる幸せを噛みしめています'],
    polite: ['ご期待に添えるよう、精一杯頑張らせていただきます'],
    composed: ['…ここで頑張れることに感謝してる'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// P5: 絶好調終了 セリフデータ
// ─────────────────────────────────────────────────────────────────────────────
const GLIMPSE_HOTSTREAK_END_LINES = {
  normal: {
    _default: [
      '絶好調は終わったけど…あの期間は無駄じゃなかった',
      '体が落ち着いてきた。でも前より強くなってる気がする'
    ],
    ojousama: [
      '好調期は過ぎたようですけど…よい経験でしたわ'
    ],
    delinquent: [
      'チッ、終わっちまったか。まぁ上等だ'
    ],
    seductive: [
      'あら、いつもの私に戻ったみたい。でも悪くない気分よ'
    ],
    polite: [
      '好調の波は去りましたが、得たものは大きかったです'
    ],
    cool: [
      '調子は戻った。だが…確実に何かを掴んだ'
    ],
    composed: ['…好調は終わったか。…でも悪くない経験だった'],
  },
  bold: {
    _default: [
      '……身体のキレも普通に戻ってきちゃったかな。でも、いい感覚は体が覚えてるよ！',
      'あの好調で掴んだ感覚は忘れない。次に繋げてみせる'
    ],
    delinquent: [
      '調子戻っちまったけど、あの感覚は覚えたぜ'
    ],
    cool: [
      '好調は終わった。だが、この経験は糧になる'
    ],
    ojousama: [
      'あの感覚は抜けてしまった？でも、得るものは十分でしたわ'
    ],
    seductive: [
      'ふふ、あの輝きは一時的だったみたいね。でもいい夢だったわ'
    ],
    polite: [
      '連勝は終わりましたが、まだまだこれからです'
    ],
    composed: ['…戻ったね。…あの感覚は覚えた'],
  },
  quiet: {
    _default: [
      '……ふぅ。あの調子は続かないか',
      '……元に戻った。でも…少し、違う自分になれた気がする'
    ],
    cool: [
      '……調子は落ち着いた。だが後退じゃない'
    ],
    polite: [
      '好調は過ぎたようです…でも、悪くない気持ちです'
    ],
    seductive: [
      '………終わったわね。…でもまだよ'
    ],
    composed: ['……戻った。…でも何かを掴んだ'],
  },
  shy: {
    _default: [
      'あ…なんか、普通に戻っちゃった…かな',
      'すごく調子よかったのに…でも、いい思い出です…'
    ],
    polite: [
      '良い流れが…止まってしまいました…で、でも、また頑張ります…'
    ],
  },
  easygoing: {
    _default: [
      'あ〜、絶好調タイム終了〜。楽しかったなぁ',
      'まぁ好調もずっとは続かないよね〜。でもいい経験だった'
    ],
    delinquent: [
      '終わっちまったかー。まぁ次また来るっしょ'
    ],
    seductive: [
      'あらら、魔法が解けちゃったわ〜。でも楽しかった'
    ],
    polite: [
      '連勝ストップかあ…でもまた頑張ります！'
    ],
    ojousama: [
      '連勝が止まりましたわ…でもまた頑張りますの'
    ],
    composed: ['…好調タイム終了か。…まあ楽しかった'],
  },
  emotional: {
    _default: [
      '終わっちゃった…あの最高の時間…でも、泣いてる場合じゃない！',
      'あの感覚を…もう一度…必ず取り戻す…！'
    ],
    seductive: [
      '勢いが止まったわ……っ……ふふ、また始めればいいのよ……'
    ],
    composed: ['…っ…終わったか。…でも、次がある'],
  },
  earnest: {
    _default: [
      '絶好調は終わったけど…あの期間で掴んだものがある',
      'あの好調は偶然じゃない。努力の結果だ。また必ず来る'
    ],
    polite: [
      '好調期間は終わりましたが、学びの多い日々でした'
    ],
    ojousama: [
      '絶好調の時期を糧に、さらなる高みを目指しますわ'
    ],
    composed: ['…好調は終わった。…でも掴んだものがある'],
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// P6: Glimpse B層 セリフデータ
// ─────────────────────────────────────────────────────────────────────────────
const GLIMPSE_B_LINES = {
  'GL-01': {
    win: {
      normal: {
        _default: [
          'よし、勝てた。この調子で頑張ろう',
          '今日はいい試合ができた'
        ],
        ojousama: [
          '勝利。当然の結果ですけどね'
        ],
        delinquent: [
          '勝ったぜ。当然だろ'
        ],
        seductive: [
          'ふふ、今日も勝ち。気分がいいわ'
        ],
        polite: [
          '勝てました。応援のおかげです'
        ],
        cool: [
          '……勝った。それでいい'
        ]
      },
      bold: {
        _default: [
          '楽勝！ わたしに勝てるわけないでしょ',
          '当たり前よ。この程度で負けるわけないじゃない'
        ],
        delinquent: [
          'へっ、雑魚が。話にならねぇ'
        ],
        cool: [
          '勝った。次も同じだ'
        ]
      },
      quiet: {
        _default: [
          '……勝った',
          '……悪くない'
        ]
      },
      shy: {
        _default: [
          'か、勝てた…！ よかった…',
          '嬉しい…勝てて本当に嬉しいです…'
        ],
        polite: [
          'か、勝てました…応援、ありがとうございます…',
          '今日は…良い試合が、できたと思います…'
        ],
      },
      easygoing: {
        _default: [
          'やった〜勝った〜！ 今日のご褒美何にしよう',
          '勝利！ いい一日だね〜'
        ]
      },
      emotional: {
        _default: [
          'やった…！ 勝てた…！ 嬉しい…！',
          '勝った…！ この気持ち、最高…！'
        ],
        seductive: [
          '勝ったわ……っ……ふふ、嬉しい……'
        ],
      },
      earnest: {
        _default: [
          '勝てた。でもまだ課題はある。次に繋げよう',
          '勝利を掴めたのは練習の成果。もっと上を目指す'
        ],
        polite: [
          '勝利できました。引き続き精進します'
        ]
      }
    },
    loss: {
      normal: {
        _default: [
          '負けた…。悔しい',
          '今日は相手が上だった。次は負けない'
        ],
        ojousama: [
          'この敗北…受け入れがたいわね'
        ],
        delinquent: [
          'ちっ…次は絶対ぶっ倒す'
        ],
        seductive: [
          '負けたのね…屈辱だわ'
        ],
        polite: [
          '負けてしまいました…申し訳ないです'
        ],
        cool: [
          '……足りないか'
        ]
      },
      bold: {
        _default: [
          'くそっ…こんなはずじゃない',
          'この借りは必ず返す'
        ],
        delinquent: [
          '次会ったらぶっ飛ばしてやる…覚えてろ'
        ]
      },
      quiet: {
        _default: [
          '………………',
          '……（無言で拳を握りしめている）'
        ]
      },
      shy: {
        _default: [
          'う…また負けちゃった…ごめんなさい…',
          '私…ダメですよね…ごめんなさい…'
        ],
        polite: [
          'ま、負けてしまいました…ご、ごめんなさい…',
          '次こそは…勝ちたいです…'
        ],
      },
      easygoing: {
        _default: [
          'あちゃ〜、負けちゃった。次頑張ろ',
          '残念〜。でもいい勉強になったかな'
        ]
      },
      emotional: {
        _default: [
          'くっ…悔しい…！ 涙が止まらない…',
          '負けた…負けた…もう嫌だ…！'
        ],
        seductive: [
          '負けた……っ……悔しい……'
        ],
      },
      earnest: {
        _default: [
          '悔しい…もっと練習しないと…',
          '負けた原因を分析して、必ず次に活かす'
        ],
        polite: [
          '不甲斐ない試合をしてしまいました。申し訳ございません'
        ]
      }
    },
    goodLoss: {
      normal: {
        _default: [
          '負けたけど…いい試合だった。得るものはあった',
          '悔しいけど、あの人は強かった。認めるしかない'
        ],
        ojousama: [
          '敗北は悔しいですけど…素晴らしい試合でした'
        ],
        delinquent: [
          '負けたけど…あいつ、やるじゃねぇか'
        ],
        seductive: [
          '負けは負け。でも…悪くない戦いだったわ'
        ],
        polite: [
          '負けてしまいましたが…良い試合ができたと思います'
        ],
        cool: [
          '……負けた。だが、後悔はない'
        ]
      },
      bold: {
        _default: [
          '負けたけど…悔しいけど…いい試合だった',
          'ちっ…認めてあげる。今日は向こうが上だった'
        ]
      },
      quiet: {
        _default: [
          '……負けた。でも…悪くなかった'
        ]
      },
      shy: {
        _default: [
          '負けちゃったけど…精一杯やれました…',
          '悔しいけど…いい試合だったって…思いたいです'
        ],
        polite: [
          '負けてしまいましたが…悔いはありません…',
          '全力は、出せたと思います…'
        ],
      },
      easygoing: {
        _default: [
          'いい試合だったなぁ〜。負けたけど満足かも',
          '相手が強かった！ でも楽しかった〜'
        ]
      },
      emotional: {
        _default: [
          'くっ…認めたくないけど、あの人は強かった…！',
          '負けた…でも…この試合は…忘れない…！'
        ],
        seductive: [
          '負けたけど……っ……ふふ、出し切れたの……'
        ],
      },
      earnest: {
        _default: [
          '負けたが良い試合だった。この経験を糧にする',
          'あの人の強さを体感できた。次は必ず超える'
        ]
      }
    },
    greatWin: {
      normal: {
        _default: [
          '最高の試合で勝てた…！ この感覚を忘れない',
          '今日は自分でも驚くくらいいい試合ができた'
        ],
        ojousama: [
          '素晴らしい勝利ですわ。この舞台に相応しい試合でした'
        ],
        delinquent: [
          '最高の試合で最高の結果だ。文句ねぇだろ'
        ],
        seductive: [
          '完璧な夜ね…最高の気分だわ'
        ],
        polite: [
          '最高の試合で勝利できました。感無量です'
        ],
        cool: [
          '……完璧だった'
        ]
      },
      bold: {
        _default: [
          'これがあたしの実力よ！ 最高の試合で最高の勝利！',
          '見たか！ これがあたしの全力だ！'
        ]
      },
      quiet: {
        _default: [
          '……（小さくガッツポーズをしている）',
          '……いい試合だった。全てが噛み合った'
        ]
      },
      shy: {
        _default: [
          'す、すごい試合ができました…！ 信じられない…！',
          '勝てた…しかもいい試合で…夢みたい…'
        ],
        polite: [
          'こ、こんな大きな勝利…信じられません…ありがとうございます…',
          'こんな日が、来るなんて…夢みたいです…'
        ],
      },
      easygoing: {
        _default: [
          '最高〜〜〜！ こういう試合のためにプロレスやってんだよ！',
          'いい試合で勝てるって最高だね〜！'
        ]
      },
      emotional: {
        _default: [
          '最高…！ 最高の試合だった…！ 泣いちゃう…！',
          'この瞬間のために生きてるんだ…！！'
        ],
        seductive: [
          '最高の勝利……っ……ふふ、震えてるの……'
        ],
      },
      earnest: {
        _default: [
          '最高の試合で勝利。努力は裏切らないと証明できた',
          '自分の全てを出し切って勝てた。これ以上の幸せはない'
        ]
      }
    }
  },
  'GL-02': {
    normal: {
      _default: [
        '今日の練習はいい感じだ',
        'もう少しスタミナつけないとな…'
      ],
      ojousama: [
        '今日のトレーニングも充実したものになりました'
      ],
      delinquent: [
        'もう一本いくぞ、おら！'
      ],
      seductive: [
        '汗を流すのも悪くないわね'
      ],
      polite: [
        '今日も精一杯練習させていただきます'
      ],
      cool: [
        '……集中。あと一セット'
      ]
    },
    bold: {
      _default: [
        'まだまだ！ もっと追い込むよ！',
        'こんなもんで満足できるない！ 次！'
      ],
      delinquent: [
        'おらおら、休んでる暇ねぇぞ！'
      ]
    },
    quiet: {
      _default: [
        '……（黙々とスクワットを続けている）',
        '………（汗が床に落ちる音だけが響く）'
      ]
    },
    shy: {
      _default: [
        'あ、えっと…もう少し頑張ります…',
        '今日の練習…うまくできてるかな…'
      ],
      polite: [
        'あ、あの…今日は、よろしくお願いいたします…',
        '頑張ります…'
      ],
    },
    easygoing: {
      _default: [
        '練習たのし〜。いい汗かいてるわ',
        'よーし、今日もがんばるぞ〜っと'
      ]
    },
    emotional: {
      _default: [
        '絶対強くなる…！ もっともっと…！',
        '練習は裏切らない…頑張るぞ…！'
      ],
      seductive: [
        '今日は……っ……ふふ、よろしくね……'
      ],
    },
    earnest: {
      _default: [
        '一つ一つの練習を大切に。基礎が全ての土台だ',
        '今日のメニューも全力でこなす。手は抜かない'
      ],
      polite: [
        '基本を怠らず、しっかり取り組みます'
      ]
    }
  },
  'GL-03': {
    up: {
      normal: {
        _default: [
          '最近いい感じだ。この団体で頑張ろうって思える',
          'ちゃんと見てくれてるんだな。嬉しいよ'
        ],
        ojousama: [
          '待遇には満足しております'
        ],
        delinquent: [
          'ここも悪くねぇな。やる気出てきたぜ'
        ],
        seductive: [
          '最近いい扱い受けてる気がするわ。嬉しいわね'
        ],
        polite: [
          '最近、居心地がとても良くなりました'
        ],
        cool: [
          '……この環境は、悪くない'
        ]
      },
      bold: {
        _default: [
          'この団体、やっぱり最高！ もっと盛り上げてみせる！'
        ]
      },
      quiet: {
        _default: [
          '……ここにいてもいいんだな'
        ]
      },
      shy: {
        _default: [
          'あ、あの…ここにいていいんですね…嬉しいです…'
        ],
        polite: [
          '調子が…良い気がします…'
        ],
      },
      easygoing: {
        _default: [
          '最近めっちゃ楽しい〜。ここ大好き！'
        ]
      },
      emotional: {
        _default: [
          '嬉しい…！ ここで頑張れるって幸せ…！'
        ],
        seductive: [
          'なんだか調子いいの……っ……ふふ……'
        ],
      },
      earnest: {
        _default: [
          '信頼に応えるよう、より一層精進します'
        ]
      }
    },
    down: {
      normal: {
        _default: [
          '最近…なんだか扱いが雑じゃないか…？',
          'ちょっと不安になってきた…大丈夫かな'
        ],
        ojousama: [
          '最近の扱いに…少々不満がございます'
        ],
        delinquent: [
          'おい、最近の扱い何だよ…舐めてんのか'
        ],
        seductive: [
          'ねぇ…最近私のこと放置してない？'
        ],
        polite: [
          '少し寂しいというか…不安が…'
        ],
        cool: [
          '……この状況は、よくない'
        ]
      },
      bold: {
        _default: [
          '何だよ最近の扱いは。わたしを軽く見てるの？'
        ]
      },
      quiet: {
        _default: [
          '……（不安そうに窓の外を見ている）'
        ]
      },
      shy: {
        _default: [
          '私…ちゃんとやれてますか…？ 不安です…'
        ],
        polite: [
          'う、うまくいきません…どうしたら…'
        ],
      },
      easygoing: {
        _default: [
          'あれ〜？ なんかちょっと居心地悪くなった？'
        ]
      },
      emotional: {
        _default: [
          'どうして…私のこと忘れてるの…？ 悲しい…'
        ],
        seductive: [
          'うまくいかない……っ……どうしてかしら……'
        ],
      },
      earnest: {
        _default: [
          '何か改善すべき点があるなら教えてほしい…'
        ]
      }
    }
  },
  'GL-04': {
    normal: {
      _default: [
        '一緒にいると練習も楽しいんだよな',
        '最近調子良さそうだな。嬉しいな'
      ],
      ojousama: [
        '一緒の時間、わたくしにとって大切です'
      ],
      delinquent: [
        'つるむの、結構楽しいんだよな'
      ],
      seductive: [
        'ちょっと気になってるの。いい距離感よね'
      ],
      polite: [
        '一緒にいると安心します'
      ],
      cool: [
        '…おかげで、ここにいる意味がある'
      ]
    },
    bold: {
      _default: [
        'いい仲間だよ。一緒に強くなろう'
      ],
      delinquent: [
        'ダチだ。大事にしてやるよ'
      ]
    },
    quiet: {
      _default: [
        '……（そっと隣を見て、少し微笑んでいる）'
      ]
    },
    shy: {
      _default: [
        '近くにいてくれると…安心する…'
      ],
      polite: [
        '練習…させていただきます…',
        'もう少し…頑張ります…'
      ],
    },
    easygoing: {
      _default: [
        '一緒だとテンション上がるわ〜'
      ]
    },
    emotional: {
      _default: [
        '大切にしたい…この関係を…！'
      ],
      seductive: [
        '練習するわ……っ……ふふ……'
      ],
    },
    earnest: {
      _default: [
        '切磋琢磨できる環境に感謝してる'
      ],
      polite: [
        'ともに成長できることが嬉しいです'
      ]
    }
  },
  'GL-05': {
    normal: {
      _default: [
        '今何してるかな…気になる',
        '勝ったって聞くと…悔しいな'
      ],
      ojousama: [
        '動向が…気になります'
      ],
      delinquent: [
        '顔が頭から離れねぇんだよ'
      ],
      seductive: [
        '…考えちゃうのよね'
      ],
      polite: [
        '活躍が気になってしまいます'
      ],
      cool: [
        '……情報は、自然と入ってくる'
      ]
    },
    bold: {
      _default: [
        '負けてたまるか。見てなさいよ！'
      ],
      delinquent: [
        '超えるまで止まらねぇ'
      ]
    },
    quiet: {
      _default: [
        '……（試合映像を食い入るように見ている）'
      ]
    },
    shy: {
      _default: [
        '…すごいな…私も頑張らなきゃ…'
      ],
      polite: [
        'あ、あの…大丈夫です、心配しないでください…',
        'ご心配を、おかけして…'
      ],
    },
    easygoing: {
      _default: [
        '気になって仕方ないんだよね〜'
      ]
    },
    emotional: {
      _default: [
        '絶対…！ 絶対に…！！'
      ],
      seductive: [
        '大丈夫よ……っ……ふふ、心配しないで……'
      ],
    },
    earnest: {
      _default: [
        '意識するからこそ成長できる'
      ],
      polite: [
        '追いつくため、日々研鑽します'
      ]
    }
  },
  'GL-06': {
    normal: {
      _default: [
        '今週は出番なしか…リングが恋しい',
        '試合に出たい。見てるだけはつらい'
      ],
      ojousama: [
        'わたくしを出場させない理由があるのかしら？'
      ],
      delinquent: [
        'なんで出してくれねぇんだよ…腕が鳴ってんのに'
      ],
      seductive: [
        '私を干すつもり？ もったいないと思うけど'
      ],
      polite: [
        '出場できなかったのは残念ですが…次の機会を待ちます'
      ],
      cool: [
        '……出番がないのは、つらい'
      ]
    },
    bold: {
      _default: [
        'なんでわたしを使わないの！ 実力は見せてるでしょ！',
        'リングに上がらせて！ くすぶってる場合じゃないのよ！'
      ],
      delinquent: [
        'おいこら！ あたしを出せよ！ 暴れたいんだよ！'
      ],
      ojousama: [
        'わたくしの出番がないとは…運営の怠慢ですわ'
      ]
    },
    quiet: {
      _default: [
        '……（リングを見つめている）',
        '……出番がない。ただそれだけが、重い'
      ]
    },
    shy: {
      _default: [
        '出られなかった…私じゃダメなんですか…',
        'あの…次は…出してもらえますか…？'
      ],
      polite: [
        'みんなと…一緒だと、心強いです…',
        '仲間って、いいですね…'
      ],
    },
    easygoing: {
      _default: [
        'まあ今週は仕方ないか〜。でもちょっと寂しいな',
        'お休みかぁ。まぁたまにはね。…うん、寂しいけど'
      ]
    },
    emotional: {
      _default: [
        '出たかった…リングに立ちたかった…！',
        '試合したい…みんなと一緒に戦いたい…！'
      ],
      seductive: [
        'みんなと一緒だと……っ……ふふ、安心するの……'
      ],
    },
    earnest: {
      _default: [
        '出場できなかった…次こそは選んでもらえるように頑張らないと',
        '実力不足なら練習で補う。必ず次は出場する'
      ],
      polite: [
        '出場機会をいただけるよう、より一層努力いたします'
      ]
    }
  },
  'GL-07': {
    normal: {
      _default: [
        '体が重い…コンディションが上がらない',
        '調子悪いな…少し休んだ方がいいかも'
      ],
      ojousama: [
        '体調が…あまり芳しくありません'
      ],
      delinquent: [
        'くそ…体がついてこねぇ'
      ],
      seductive: [
        '体が言うこと聞かないわ…もどかしい'
      ],
      polite: [
        '申し訳ありません…少し体調が…'
      ],
      cool: [
        '……体が鈍い。これは…まずいな'
      ]
    },
    bold: {
      _default: [
        'ちっ、体がなまってる…休んでる場合じゃないのに'
      ],
      delinquent: [
        'くそっ、こんな体じゃ戦えねぇだろ…！'
      ]
    },
    quiet: {
      _default: [
        '……体が、動かない'
      ]
    },
    shy: {
      _default: [
        '体が…重くて…すみません…迷惑かけて…'
      ],
      polite: [
        'お、お客さんがいっぱいで…き、緊張します…',
        'がんばります…'
      ],
    },
    easygoing: {
      _default: [
        'う〜ん、体がだるいなぁ。ちょっと休もっかな'
      ]
    },
    emotional: {
      _default: [
        '体が動かない…悔しい…早く元気になりたい…'
      ],
      seductive: [
        'お客さんがいっぱい……っ……ふふ、燃えるわね……'
      ],
    },
    earnest: {
      _default: [
        'コンディションが良くない。焦らず回復に努めよう'
      ],
      polite: [
        '体調管理を怠りました。しっかり立て直します'
      ]
    }
  },
  'GL-08': {
    normal: {
      _default: [
        'また負けた…どうすればいいんだ',
        '連敗が止まらない…自信がなくなってきた'
      ],
      ojousama: [
        '連敗…こんなはずでは…ないのに'
      ],
      delinquent: [
        'くそが…何連敗してんだよあたしは…'
      ],
      seductive: [
        '負け続き…こんなの私じゃないわ'
      ],
      polite: [
        '連敗してしまって…皆さんに申し訳なくて…'
      ],
      cool: [
        '……勝てない。何が足りない'
      ]
    },
    bold: {
      _default: [
        '…このまま終わるつもりはないから！',
        'いつまで負け続ける気だ…！ 目を覚ませ、わたし！'
      ],
      delinquent: [
        'ふざけんな…いつまで負けてんだよ…！'
      ]
    },
    quiet: {
      _default: [
        '……（無言で練習を続けている）',
        '……（壁に拳を押し当てている）'
      ]
    },
    shy: {
      _default: [
        'わ、私…足引っ張ってますよね…ごめんなさい…',
        '勝てない…勝てない…どうしたらいいの…'
      ],
      polite: [
        'あ、あの…体調は、大丈夫です…',
        '無理はしません…'
      ],
    },
    easygoing: {
      _default: [
        'あはは…笑えない状況だね…さすがに凹むわ',
        'う〜ん、負けが込んでるなぁ…どうしたもんか'
      ]
    },
    emotional: {
      _default: [
        'もう…どうしたらいいの…',
        '勝てない…私なんかもう…うっ…'
      ],
      seductive: [
        '体調は大丈夫よ……っ……ふふ、心配いらない……'
      ],
    },
    earnest: {
      _default: [
        '連敗の原因を見つけなければ。何かが間違っているはずだ',
        '負けが続いている。でも腐らない。必ず糸口はある'
      ],
      polite: [
        '不甲斐ない結果が続いています…何とか打開しなければ'
      ]
    }
  },
  'GL-09': {
    normal: {
      _default: [
        'いい流れが来てる。この調子を維持したい',
        '連勝中…自信がついてきた'
      ],
      ojousama: [
        '連勝ですわ。わたくしの実力が証明されたわね'
      ],
      delinquent: [
        '勝ちまくってるぜ。誰か止めてみろよ'
      ],
      seductive: [
        '最近負けなしよ。ふふ、誰が相手でも返り討ちだわ'
      ],
      polite: [
        '連勝させていただいています。ありがたいことです'
      ],
      cool: [
        '……負ける気がしない'
      ]
    },
    bold: {
      _default: [
        '絶好調！ この波に乗って一気に行くぞ！',
        '今のわたしを止められるやつはいない！'
      ],
      delinquent: [
        '止まらねぇぜ！ 全員ぶっ倒す！'
      ]
    },
    quiet: {
      _default: [
        '……いい流れだ。このまま'
      ]
    },
    shy: {
      _default: [
        '連勝…嘘みたい…でも自信になってます…！'
      ],
      polite: [
        '次の試合…が、頑張ります…',
        'しっかり、準備します…'
      ],
    },
    easygoing: {
      _default: [
        '連勝〜！ ノッてるね〜。この波乗りこなすぞ〜'
      ]
    },
    emotional: {
      _default: [
        '勝ち続けてる…！ この調子で…もっと…！！'
      ],
      seductive: [
        '次の試合……っ……ふふ、楽しみだわ……'
      ],
    },
    earnest: {
      _default: [
        '連勝は努力の証。でも油断はしない。謙虚にいこう'
      ],
      polite: [
        '結果がついてきていますが、慢心せず精進します'
      ]
    }
  },
  'GL-10': {
    normal: {
      _default: [
        '早くリングに戻りたい…体が疼く',
        '怪我…早く治してくれ…'
      ],
      ojousama: [
        'この弱い体が恨めしい…早くリングに'
      ],
      delinquent: [
        'くそ、いつまで寝てりゃいいんだよ…'
      ],
      seductive: [
        '退屈…早くリングに立ちたいわ'
      ],
      polite: [
        '早く復帰して、皆さんのお役に立ちたいです'
      ],
      cool: [
        '……じっとしているのが、一番つらい'
      ]
    },
    bold: {
      _default: [
        'こんなとこで寝てる場合じゃない…！',
        'わたしがいない間に追い抜かれるのは耐えられない！'
      ],
      delinquent: [
        'チッ…じっとしてらんねぇ。もう走れるだろ…！'
      ]
    },
    quiet: {
      _default: [
        '……（天井を見つめている）',
        '……リングが、遠い'
      ]
    },
    shy: {
      _default: [
        'みんなに置いてかれちゃう…怖い…',
        '怪我…早く治って…お願い…'
      ],
      polite: [
        'あ、あの…ありがとうございます…',
        '感謝、しています…'
      ],
    },
    easygoing: {
      _default: [
        '怪我かぁ…暇だなぁ。早く治らないかな〜',
        'じっとしてるの苦手なんだよね〜。あーリング恋しい'
      ]
    },
    emotional: {
      _default: [
        'みんなが戦ってるのに…私だけ…悔しい…！',
        'リングに…早く…戻りたい…！！'
      ],
      seductive: [
        'ありがとう……っ……ふふ、嬉しい……'
      ],
    },
    earnest: {
      _default: [
        'リハビリに全力で取り組む。一日でも早く復帰する',
        '怪我の間もできることはある。頭を鍛える時間にする'
      ],
      polite: [
        '復帰に向けて、今できることを精一杯やります'
      ]
    }
  },
  // bond-rivalry plan 2026-04-29: P-2 中間嫌悪帯（coldness）
  // 発火: bond ≤ 25 ∧ rivalry < 30（無関心寄りの冷たさ、敵意ではない）
  'GL-11': {
    normal: {
      _default: [
        'あの子のこと？……特に何も。視界に入れてないだけ',
        '同じ場にいても、話すことは何もないかな'
      ],
      ojousama: [
        '存じ上げてはおりますけれど、関心はございません',
      ],
      delinquent: [
        'あー、いるな。それで?……別に',
      ],
      seductive: [
        'いたわね、そういえば。……それだけよ',
      ],
      polite: [
        'お見かけはしますが……特にお話することは',
      ],
      cool: [
        '……認識の外。それだけ',
      ],
      composed: [
        'あの子は、わたくしの中にはいないの。それだけのことよ',
      ]
    },
    quiet: {
      _default: [
        '……（視線は合わせない）',
      ]
    }
  },
  // bond-rivalry plan 2026-04-29: P-9 ナレーション型グリンプス
  // 発火: bond ≤ 15 ペアが同興行出場時、月1回程度
  // 形式: 第三者視点（記者/解説者）のナレーション、{nameA} {nameB} 置換
  'GL-12': {
    _narration: [
      '{nameA}と{nameB}は、控え室で一度も目を合わせなかったという',
      'インタビュー後、{nameA}は{nameB}の名前を口にしなかった',
      'リング上ですれ違った瞬間、空気が凍ったように見えた',
      '{nameA}と{nameB}が同じ廊下に居合わせたとき、誰もが息を潜めたという',
      '{nameB}の話題が出ても、{nameA}は表情ひとつ変えなかった'
    ]
  }
};

GLIMPSE_B_LINES['GL-01'] = {
  win: {
    normal: {
      _default: ['よし、勝てた。この調子で頑張ろう', '今日はいい試合ができた'],
      ojousama: ['勝利ですわ。当然の結果ですけどね'],
      delinquent: ['勝ったぜ。当然だろ'],
      seductive: ['ふふ、今日も勝ち。気分がいいわ'],
      polite: ['勝てました。応援のおかげです'],
      cool: ['……勝った。それでいい'],
      composed: ['…勝ったね。…こんなもんかな'],
    },
    bold: {
      _default: ['楽勝！ あたしに勝てるわけないでしょ', '当たり前よ。この程度で負けるわけないじゃない'],
      delinquent: ['へっ、雑魚が。話にならねぇ'],
      cool: ['勝った。次も同じだ'],
      composed: ['…当然。…まだまだだけどね'],
    },
    quiet: {
      _default: ['……勝った', '……悪くない'],
      composed: ['……悪くない'],
    },
    shy: {
      _default: ['か、勝てた…！ よかった…', '嬉しい…勝てて本当に嬉しいです…'],
    },
    easygoing: {
      _default: ['やった〜勝った〜！ 今日のご褒美何にしよう', '勝利！ いい一日だね〜'],
      composed: ['…勝った〜。…いい感じだね'],
    },
    emotional: {
      _default: ['やった…！ 勝てた…！ 嬉しい…！', '勝った…！ この気持ち、最高…！'],
      composed: ['…っ…勝てた。…よかった'],
    },
    earnest: {
      _default: ['勝てた。でもまだ課題はある。次に繋げよう', '勝利を掴めたのは練習の成果。もっと上を目指す'],
      polite: ['勝利できました。引き続き精進します'],
      composed: ['…勝てた。…次に繋げよう'],
    },
  },
  loss: {
    normal: {
      _default: ['負けた…。悔しい', '今日は相手が上だった。次は負けない'],
      ojousama: ['この敗北…受け入れがたいですわ'],
      delinquent: ['ちっ…次は絶対ぶっ倒す'],
      seductive: ['負けたのね…屈辱だわ'],
      polite: ['負けてしまいました…申し訳ないです'],
      cool: ['……足りないか'],
      composed: ['…負けたか。…次だね'],
    },
    bold: {
      _default: ['くそっ…こんなはずじゃない', 'この借りは必ず返す'],
      delinquent: ['次会ったらぶっ飛ばしてやる…覚えてろ'],
      composed: ['…こんなはずじゃない。…次は返す'],
    },
    quiet: {
      _default: ['………………', '……（無言で拳を握りしめている）'],
      composed: ['……足りなかった'],
    },
    shy: {
      _default: ['う…また負けちゃった…ごめんなさい…', '私…ダメですよね…ごめんなさい…'],
    },
    easygoing: {
      _default: ['あちゃ〜、負けちゃった。次頑張ろ', '残念〜。でもいい勉強になったかな'],
      composed: ['…負けちゃったか。…まあ次があるよ'],
    },
    emotional: {
      _default: ['くっ…悔しい…！ 涙が止まらない…', '負けた…負けた…もう嫌だ…！'],
      composed: ['…っ…悔しい'],
    },
    earnest: {
      _default: ['悔しい…もっと練習しないと…', '負けた原因を分析して、必ず次に活かす'],
      polite: ['不甲斐ない試合をしてしまいました。申し訳ございません'],
      composed: ['…負けた原因は分かってる。…次に活かす'],
    },
  },
  goodLoss: {
    normal: {
      _default: ['負けたけど…いい試合だった。得るものはあった', '悔しいけど、あの人は強かった。認めるしかない'],
      ojousama: ['敗北は悔しいですけど…素晴らしい試合でしたわ'],
      delinquent: ['負けたけど…あいつ、やるじゃねぇか'],
      seductive: ['負けは負け。でも…悪くない戦いだったわ'],
      polite: ['負けてしまいましたが…良い試合ができたと思います'],
      cool: ['……負けた。だが、後悔はない'],
      composed: ['…負けたけど…悪くない試合だった'],
    },
    bold: {
      _default: ['負けたけど…悔しいけど…いい試合だった', 'ちっ…認めてあげる。今日は向こうが上だった'],
      composed: ['…負けは負け。…でもいい試合だった'],
    },
    quiet: {
      _default: ['……負けた。でも…悪くなかった'],
      composed: ['……負けた。…でも、悪くない'],
    },
    shy: {
      _default: ['負けちゃったけど…精一杯やれました…', '悔しいけど…いい試合だったって…思いたいです'],
    },
    easygoing: {
      _default: ['いい試合だったなぁ〜。負けたけど満足かも', '相手が強かった！ でも楽しかった〜'],
      composed: ['…いい試合だったなぁ。…負けたけどね'],
    },
    emotional: {
      _default: ['くっ…認めたくないけど、あの人は強かった…！', '負けた…でも…この試合は…忘れない…！'],
      composed: ['…っ…認める。…いい試合だった'],
    },
    earnest: {
      _default: ['負けたが良い試合だった。この経験を糧にする', 'あの人の強さを体感できた。次は必ず超える'],
      composed: ['…いい試合だった。…この経験を糧にする'],
    },
  },
  greatWin: {
    normal: {
      _default: ['最高の試合で勝てた…！ この感覚を忘れない', '今日は自分でも驚くくらいいい試合ができた'],
      ojousama: ['素晴らしい勝利ですわ。この舞台に相応しい試合でしたの'],
      delinquent: ['最高の試合で最高の結果だ。文句ねぇだろ'],
      seductive: ['完璧な夜ね…最高の気分だわ'],
      polite: ['最高の試合で勝利できました。感無量です'],
      cool: ['……完璧だった'],
      composed: ['…最高の試合で勝てた。…こういう日もあるね'],
    },
    bold: {
      _default: ['これがあたしの実力だ！ 最高の試合で最高の勝利！', 'へへっ、見たか！ これがあたしの全力だ！'],
      composed: ['…上等。…これが実力だ'],
    },
    quiet: {
      _default: ['……（小さくガッツポーズをしている）', '……いい試合だった。全てが噛み合った'],
      composed: ['……完璧に近かった'],
    },
    shy: {
      _default: ['す、すごい試合ができました…！ 信じられない…！', '勝てた…しかもいい試合で…夢みたい…'],
    },
    easygoing: {
      _default: ['最高〜〜〜！ こういう試合のためにプロレスやってんだよ！', 'いい試合で勝てるって最高だね〜！'],
      composed: ['…最高だね。…こういう試合のためにやってる'],
    },
    emotional: {
      _default: ['最高…！ 最高の試合だった…！ 泣いちゃう…！', 'この瞬間のために生きてるんだ…！！'],
      composed: ['…っ…最高だ。…泣きそう'],
    },
    earnest: {
      _default: ['最高の試合で勝利。努力は裏切らないと証明できた', '自分の全てを出し切って勝てた。これ以上の幸せはない'],
      composed: ['…全てを出し切って勝てた。…これ以上はない'],
    },
  },
};

GLIMPSE_B_LINES['GL-02'] = {
  normal: {
    _default: ['今日の練習はいい感じだ', 'もう少しスタミナつけないとな…'],
    ojousama: ['今日のトレーニングも充実しておりますわ'],
    delinquent: ['もう一本いくぞ、おら！'],
    seductive: ['汗を流すのも悪くないわね'],
    polite: ['今日も精一杯練習させていただきます'],
    cool: ['……集中。あと一セット'],
    composed: ['…まあ、いい感じだ'],
  },
  bold: {
    _default: ['まだまだ！ もっと追い込むぞ！', 'こんなもんで満足できるか！ 次！'],
    delinquent: ['おらおら、休んでる暇ねぇぞ！'],
    composed: ['…まだまだ。もう一本'],
  },
  quiet: {
    _default: ['……（黙々とスクワットを続けている）', '………（汗が床に落ちる音だけが響く）'],
    composed: ['……（黙々と続けている）'],
  },
  shy: {
    _default: ['あ、えっと…もう少し頑張ります…', '今日の練習…うまくできてるかな…'],
  },
  easygoing: {
    _default: ['練習たのし〜。いい汗かいてるわ', 'よーし、今日もがんばるぞ〜っと'],
    composed: ['…いい汗だね'],
  },
  emotional: {
    _default: ['絶対強くなる…！ もっともっと…！', '練習は裏切らない…頑張るぞ…！'],
    composed: ['…っ…まだやれる'],
  },
  earnest: {
    _default: ['一つ一つの練習を大切に。基礎が全ての土台だ', '今日のメニューも全力でこなす。手は抜かない'],
    polite: ['基本を怠らず、しっかり取り組みます'],
    composed: ['…一つずつ、着実に'],
  },
};

// bond-rivalry plan P-7: 険悪ペア持ちの選手が練習中に出す敵意フレーズ（rivalry≥50 ∧ bond≤30）
GLIMPSE_B_LINES['GL-02-hostile'] = {
  normal: {
    _default: [
      'あいつのことを考えると、練習に身が入らない…',
      '次に当たったとき…絶対に見てろよ',
      'なんであいつが同じ場所にいるんだ。意味わからん',
      '…練習中に思い出すな。腹が立って仕方ない',
      'こっちがどれだけ頑張っても、あいつのことが頭から離れない',
    ],
    ojousama: [
      'あの方と同じ空間にいるだけで、集中が乱れますわ…',
      '…今日もあの顔が頭をよぎった。本当に、困ります',
    ],
    delinquent: [
      '次は絶対やってやる。絶対に…！',
      'あいつのことばっか考えてたら、バーベル落としそうになった',
    ],
    seductive: [
      '…あら、また考えてしまった。ま、それが原動力になるなら悪くないけど'],
    polite: ['私情を持ち込むな、と自分に言い聞かせているが…難しい'],
    cool: ['……集中を乱す存在がいる。気に入らない'],
    composed: ['…あの子のせいで、今日の調子は最悪だった'],
  },
  bold: {
    _default: ['次は絶対やってやる。燃えてきた！', 'あいつがいる限り、手を抜けるわけがない'],
  },
  quiet: {
    _default: ['……（道具に八つ当たりしている）', '……（黙々とやっているが、目が怖い）'],
  },
  emotional: {
    _default: ['悔しい…！あいつの顔を見たくない…！', 'なんで…なんであいつのことが頭から消えないの…！'],
  },
  earnest: {
    _default: ['私情を持ち込むな、と自分に言い聞かせているが…難しい', '集中できていない自分が、情けない…'],
  },
  easygoing: {
    _default: ['うーん…なんか気になっちゃうなあ、あの子のこと', 'あいつのこと考えると力入っちゃうわ。まあいっか'],
  },
  shy: {
    _default: ['怖い…でも…負けたくない…', 'あの子がいると思うと、うまく練習できなくて…'],
  },
};

GLIMPSE_B_LINES['GL-03'] = {
  up: {
    normal: {
      _default: ['最近いい感じだ。この団体で頑張ろうって思える', 'ちゃんと見てくれてるんだな。嬉しいよ'],
      ojousama: ['最近の待遇には満足しておりますわ'],
      delinquent: ['ここも悪くねぇな。やる気出てきたぜ'],
      seductive: ['最近いい扱い受けてる気がするわ。嬉しいわね'],
      polite: ['最近、居心地がとても良くなりました'],
      cool: ['……この環境は、悪くない'],
      composed: ['…悪くない環境だね'],
    },
    bold: {
      _default: ['この団体、やっぱり最高！ もっと盛り上げてみせる！'],
      composed: ['…ここ、いいね。…もっと盛り上げてやるよ'],
    },
    quiet: {
      _default: ['……ここにいてもいいんだな'],
      composed: ['……居心地がいい'],
    },
    shy: { _default: ['あ、あの…ここにいていいんですね…嬉しいです…'] },
    easygoing: {
      _default: ['最近めっちゃ楽しい〜。ここ大好き！'],
      composed: ['…いい感じだね。居心地いいや'],
    },
    emotional: {
      _default: ['嬉しい…！ ここで頑張れるって幸せ…！'],
      composed: ['…っ…嬉しいな'],
    },
    earnest: {
      _default: ['信頼に応えるよう、より一層精進します'],
      composed: ['…いい環境だ。…応えないとね'],
    },
  },
  down: {
    normal: {
      _default: ['最近…なんだか扱いが雑じゃないか…？', 'ちょっと不安になってきた…大丈夫かな'],
      ojousama: ['最近のお扱い…少々不満がございますわ'],
      delinquent: ['おい、最近の扱い何だよ…舐めてんのか'],
      seductive: ['ねぇ…最近私のこと放置してない？'],
      polite: ['少し寂しいというか…不安が…'],
      cool: ['……この状況は、よくない'],
      composed: ['…最近、ちょっと引っかかることがあるかな'],
    },
    bold: {
      _default: ['何だよ最近の扱いは。あたしを軽く見てんのか'],
      composed: ['…この扱いは、どうなの'],
    },
    quiet: {
      _default: ['……（不安そうに窓の外を見ている）'],
      composed: ['………'],
    },
    shy: { _default: ['私…ちゃんとやれてますか…？ 不安です…'] },
    easygoing: {
      _default: ['あれ〜？ なんかちょっと居心地悪くなった？'],
      composed: ['…う〜ん、ちょっと気になるなぁ'],
    },
    emotional: {
      _default: ['どうして…私のこと忘れてるの…？ 悲しい…'],
      composed: ['…っ…何か変だ'],
    },
    earnest: {
      _default: ['何か改善すべき点があるなら教えてほしい…'],
      composed: ['…少し思うところがある'],
    },
  },
};

GLIMPSE_B_LINES['GL-04'] = {
  normal: {
    _default: ['一緒にいると練習も楽しいんだよな', '最近調子良さそうだな。嬉しいな'],
    ojousama: ['一緒の時間、わたくしにとって大切ですわ'],
    delinquent: ['つるむの、結構楽しいんだよな'],
    seductive: ['ちょっと気になってるの。いい距離感よね'],
    polite: ['一緒にいると安心します'],
    cool: ['…おかげで、ここにいる意味がある'],
  },
  bold: {
    _default: ['いい仲間だよ。一緒に強くなろう'],
    delinquent: ['ダチだ。大事にしてやるよ'],
  },
  quiet: { _default: ['……（そっと隣を見て、少し微笑んでいる）'] },
  shy: { _default: ['近くにいてくれると…安心する…'] },
  easygoing: { _default: ['一緒だとテンション上がるわ〜'] },
  emotional: { _default: ['大切にしたい…この関係を…！'] },
  earnest: {
    _default: ['切磋琢磨できる環境に感謝してる'],
    polite: ['ともに成長できることが嬉しいです'],
  },
};

GLIMPSE_B_LINES['GL-05'] = {
  normal: {
    _default: ['今何してるかな…気になる', '勝ったって聞くと…悔しいな'],
    ojousama: ['動向が…気になりますわ'],
    delinquent: ['顔が頭から離れねぇんだよ'],
    seductive: ['…考えちゃうのよね'],
    polite: ['活躍が気になってしまいます'],
    cool: ['……情報は、自然と入ってくる'],
  },
  bold: {
    _default: ['負けてたまるか。見てろよ'],
    delinquent: ['超えるまで止まらねぇ'],
  },
  quiet: { _default: ['……（試合映像を食い入るように見ている）'] },
  shy: { _default: ['…すごいな…私も頑張らなきゃ…'] },
  easygoing: { _default: ['気になって仕方ないんだよね〜'] },
  emotional: { _default: ['絶対…！ 絶対に…！！'] },
  earnest: {
    _default: ['意識するからこそ成長できる'],
    polite: ['追いつくため、日々研鑽します'],
  },
};

GLIMPSE_B_LINES['GL-06'] = {
  normal: {
    _default: ['今週は出番なしか…リングが恋しい', '試合に出たい。見てるだけはつらい'],
    ojousama: ['わたくしを出場させない理由がございまして？'],
    delinquent: ['なんで出してくれねぇんだよ…腕が鳴ってんのに'],
    seductive: ['私を干すつもり？ もったいないと思うけど'],
    polite: ['出場できなかったのは残念ですが…次の機会を待ちます'],
    cool: ['……出番がないのは、つらい'],
  },
  bold: {
    _default: ['なんであたしを使わないの！ 実力は見せてるでしょ！', 'リングに上がらせて！ くすぶってる場合じゃないのよ！'],
    delinquent: ['おいこら！ あたしを出せよ！ 暴れたいんだよ！'],
    ojousama: ['わたくしの出番がないとは…運営の怠慢ですわ'],
  },
  quiet: {
    _default: ['……（リングを見つめている）', '……出番がない。ただそれだけが、重い'],
  },
  shy: {
    _default: ['出られなかった…私じゃダメなんですか…', 'あの…次は…出してもらえますか…？'],
  },
  easygoing: {
    _default: ['まあ今週は仕方ないか〜。でもちょっと寂しいな', 'お休みかぁ。まぁたまにはね。…うん、寂しいけど'],
  },
  emotional: {
    _default: ['出たかった…リングに立ちたかった…！', '試合したい…みんなと一緒に戦いたい…！'],
  },
  earnest: {
    _default: ['出場できなかった…次こそは選んでもらえるように頑張らないと', '実力不足なら練習で補う。必ず次は出場する'],
    polite: ['出場機会をいただけるよう、より一層努力いたします'],
  },
};

GLIMPSE_B_LINES['GL-07'] = {
  normal: {
    _default: ['体が重い…コンディションが上がらない', '調子悪いな…少し休んだ方がいいかも'],
    ojousama: ['お体の調子が…あまり芳しくありませんわ'],
    delinquent: ['くそ…体がついてこねぇ'],
    seductive: ['体が言うこと聞かないわ…もどかしい'],
    polite: ['申し訳ありません…少し体調が…'],
    cool: ['……体が鈍い。これは…まずいな'],
  },
  bold: {
    _default: ['ちっ、体がなまってる…休んでる場合じゃないのに'],
    delinquent: ['くそっ、こんな体じゃ戦えねぇだろ…！'],
  },
  quiet: { _default: ['……体が、動かない'] },
  shy: { _default: ['体が…重くて…すみません…迷惑かけて…'] },
  easygoing: { _default: ['う〜ん、体がだるいなぁ。ちょっと休もっかな'] },
  emotional: { _default: ['体が動かない…悔しい…早く元気になりたい…'] },
  earnest: {
    _default: ['コンディションが良くない。焦らず回復に努めよう'],
    polite: ['体調管理を怠りました。しっかり立て直します'],
  },
};

GLIMPSE_B_LINES['GL-08'] = {
  normal: {
    _default: ['また負けた…どうすればいいんだ', '連敗が止まらない…自信がなくなってきた'],
    ojousama: ['連敗…こんなはずでは…ありませんわ'],
    delinquent: ['くそが…何連敗してんだよあたしは…'],
    seductive: ['負け続き…こんなの私じゃないわ'],
    polite: ['連敗してしまって…皆さんに申し訳なくて…'],
    cool: ['……勝てない。何が足りない'],
  },
  bold: {
    _default: ['…このまま終わるつもりはない', 'いつまで負け続ける気だ…！ 目を覚ませ、あたし！'],
    delinquent: ['ふざけんな…いつまで負けてんだよ…！'],
  },
  quiet: {
    _default: ['……（無言で練習を続けている）', '……（壁に拳を押し当てている）'],
  },
  shy: {
    _default: ['わ、私…足引っ張ってますよね…ごめんなさい…', '勝てない…勝てない…どうしたらいいの…'],
  },
  easygoing: {
    _default: ['あはは…笑えない状況だね…さすがに凹むわ', 'う〜ん、負けが込んでるなぁ…どうしたもんか'],
  },
  emotional: {
    _default: ['もう…どうしたらいいの…', '勝てない…私なんかもう…うっ…'],
  },
  earnest: {
    _default: ['連敗の原因を見つけなければ。何かが間違っているはずだ', '負けが続いている。でも腐らない。必ず糸口はある'],
    polite: ['不甲斐ない結果が続いています…何とか打開しなければ'],
  },
};

GLIMPSE_B_LINES['GL-09'] = {
  normal: {
    _default: ['いい流れが来てる。この調子を維持したい', '連勝中…自信がついてきた'],
    ojousama: ['連勝ですわ。わたくしの実力が証明されましたわね'],
    delinquent: ['勝ちまくってるぜ。誰か止めてみろよ'],
    seductive: ['最近負けなしよ。ふふ、誰が相手でも返り討ちだわ'],
    polite: ['連勝させていただいています。ありがたいことです'],
    cool: ['……負ける気がしない'],
  },
  bold: {
    _default: ['絶好調！ この波に乗って一気に行くぞ！', '今のあたしを止められるやつはいない！'],
    delinquent: ['止まらねぇぜ！ 全員ぶっ倒す！'],
  },
  quiet: { _default: ['……いい流れだ。このまま'] },
  shy: { _default: ['連勝…嘘みたい…でも自信になってます…！'] },
  easygoing: { _default: ['連勝〜！ ノッてるね〜。この波乗りこなすぞ〜'] },
  emotional: { _default: ['勝ち続けてる…！ この調子で…もっと…！！'] },
  earnest: {
    _default: ['連勝は努力の証。でも油断はしない。謙虚にいこう'],
    polite: ['結果がついてきていますが、慢心せず精進します'],
  },
};

GLIMPSE_B_LINES['GL-10'] = {
  normal: {
    _default: ['早くリングに戻りたい…体が疼く', '怪我…早く治してくれ…'],
    ojousama: ['このお体が恨めしいですわ…早くリングに'],
    delinquent: ['くそ、いつまで寝てりゃいいんだよ…'],
    seductive: ['退屈…早くリングに立ちたいわ'],
    polite: ['早く復帰して、皆さんのお役に立ちたいです'],
    cool: ['……じっとしているのが、一番つらい'],
  },
  bold: {
    _default: ['こんなとこで寝てる場合じゃねぇんだよ…！', 'あたしがいない間に追い抜かれてたまるか'],
    delinquent: ['チッ…じっとしてらんねぇ。もう走れるだろ…！'],
  },
  quiet: {
    _default: ['……（天井を見つめている）', '……リングが、遠い'],
  },
  shy: {
    _default: ['みんなに置いてかれちゃう…怖い…', '怪我…早く治って…お願い…'],
  },
  easygoing: {
    _default: ['怪我かぁ…暇だなぁ。早く治らないかな〜', 'じっとしてるの苦手なんだよね〜。あーリング恋しい'],
  },
  emotional: {
    _default: ['みんなが戦ってるのに…私だけ…悔しい…！', 'リングに…早く…戻りたい…！！'],
  },
  earnest: {
    _default: ['リハビリに全力で取り組む。一日でも早く復帰する', '怪我の間もできることはある。頭を鍛える時間にする'],
    polite: ['復帰に向けて、今できることを精一杯やります'],
  },
};

// ─── Session F nested: ワークシート反映パッチ（394行） ───

// ── NOTIF_DIALOGUES 拡張 ──
if (!NOTIF_DIALOGUES['N1']) NOTIF_DIALOGUES['N1'] = {};
if (!NOTIF_DIALOGUES['N1'].normal) NOTIF_DIALOGUES['N1'].normal = {};
if (!NOTIF_DIALOGUES['N1'].normal.polite) NOTIF_DIALOGUES['N1'].normal.polite = [];
NOTIF_DIALOGUES['N1'].normal.polite.push('最近、体が思うように動くんです。練習が楽しくて……もっと上を目指したいです');
if (!NOTIF_DIALOGUES['N1']) NOTIF_DIALOGUES['N1'] = {};
if (!NOTIF_DIALOGUES['N1'].normal) NOTIF_DIALOGUES['N1'].normal = {};
if (!NOTIF_DIALOGUES['N1'].normal.cool) NOTIF_DIALOGUES['N1'].normal.cool = [];
NOTIF_DIALOGUES['N1'].normal.cool.push('動きが変わった。……悪くない');
if (!NOTIF_DIALOGUES['N1']) NOTIF_DIALOGUES['N1'] = {};
if (!NOTIF_DIALOGUES['N1'].bold) NOTIF_DIALOGUES['N1'].bold = {};
if (!NOTIF_DIALOGUES['N1'].bold.polite) NOTIF_DIALOGUES['N1'].bold.polite = [];
NOTIF_DIALOGUES['N1'].bold.polite.push('体が軽いんです!今ならどんな相手でもやれる気がして……ふふ、もっと稽古したいです!');
if (!NOTIF_DIALOGUES['N1']) NOTIF_DIALOGUES['N1'] = {};
if (!NOTIF_DIALOGUES['N1'].quiet) NOTIF_DIALOGUES['N1'].quiet = {};
if (!NOTIF_DIALOGUES['N1'].quiet.seductive) NOTIF_DIALOGUES['N1'].quiet.seductive = [];
NOTIF_DIALOGUES['N1'].quiet.seductive.push('……届きそう。次の、景色に');
if (!NOTIF_DIALOGUES['N1']) NOTIF_DIALOGUES['N1'] = {};
if (!NOTIF_DIALOGUES['N1'].easygoing) NOTIF_DIALOGUES['N1'].easygoing = {};
if (!NOTIF_DIALOGUES['N1'].easygoing.polite) NOTIF_DIALOGUES['N1'].easygoing.polite = [];
NOTIF_DIALOGUES['N1'].easygoing.polite.push('あ、なんか最近調子いいんです。嬉しいなあ、こういう時期って久しぶりで');
if (!NOTIF_DIALOGUES['N1']) NOTIF_DIALOGUES['N1'] = {};
if (!NOTIF_DIALOGUES['N1'].easygoing) NOTIF_DIALOGUES['N1'].easygoing = {};
if (!NOTIF_DIALOGUES['N1'].easygoing.ojousama) NOTIF_DIALOGUES['N1'].easygoing.ojousama = [];
NOTIF_DIALOGUES['N1'].easygoing.ojousama.push('まあ、体が喜んでおりますわ!このまま行けば、わたくしぐんと強くなれる気がいたしますの!');
if (!NOTIF_DIALOGUES['N2']) NOTIF_DIALOGUES['N2'] = {};
if (!NOTIF_DIALOGUES['N2'].normal) NOTIF_DIALOGUES['N2'].normal = {};
if (!NOTIF_DIALOGUES['N2'].normal.polite) NOTIF_DIALOGUES['N2'].normal.polite = [];
NOTIF_DIALOGUES['N2'].normal.polite.push('この団体に来て、よかったです。皆さんと一緒にいると、ここが自分の居場所だって思えるから……');
if (!NOTIF_DIALOGUES['N2']) NOTIF_DIALOGUES['N2'] = {};
if (!NOTIF_DIALOGUES['N2'].normal) NOTIF_DIALOGUES['N2'].normal = {};
if (!NOTIF_DIALOGUES['N2'].normal.cool) NOTIF_DIALOGUES['N2'].normal.cool = [];
NOTIF_DIALOGUES['N2'].normal.cool.push('……ここにいると、落ち着く。悪くない場所');
if (!NOTIF_DIALOGUES['N2']) NOTIF_DIALOGUES['N2'] = {};
if (!NOTIF_DIALOGUES['N2'].bold) NOTIF_DIALOGUES['N2'].bold = {};
if (!NOTIF_DIALOGUES['N2'].bold.polite) NOTIF_DIALOGUES['N2'].bold.polite = [];
NOTIF_DIALOGUES['N2'].bold.polite.push('仲間って、いいものですね!この人たちのためにも、絶対に結果を出してみせます!');
if (!NOTIF_DIALOGUES['N2']) NOTIF_DIALOGUES['N2'] = {};
if (!NOTIF_DIALOGUES['N2'].quiet) NOTIF_DIALOGUES['N2'].quiet = {};
if (!NOTIF_DIALOGUES['N2'].quiet.seductive) NOTIF_DIALOGUES['N2'].quiet.seductive = [];
NOTIF_DIALOGUES['N2'].quiet.seductive.push('……ひとりじゃ、ない。それだけで、十分');
if (!NOTIF_DIALOGUES['N2']) NOTIF_DIALOGUES['N2'] = {};
if (!NOTIF_DIALOGUES['N2'].easygoing) NOTIF_DIALOGUES['N2'].easygoing = {};
if (!NOTIF_DIALOGUES['N2'].easygoing.polite) NOTIF_DIALOGUES['N2'].easygoing.polite = [];
NOTIF_DIALOGUES['N2'].easygoing.polite.push('皆さん優しくて、わたし本当に恵まれてるなあって。こういう場所、大事にしたいんです');
if (!NOTIF_DIALOGUES['N2']) NOTIF_DIALOGUES['N2'] = {};
if (!NOTIF_DIALOGUES['N2'].easygoing) NOTIF_DIALOGUES['N2'].easygoing = {};
if (!NOTIF_DIALOGUES['N2'].easygoing.ojousama) NOTIF_DIALOGUES['N2'].easygoing.ojousama = [];
NOTIF_DIALOGUES['N2'].easygoing.ojousama.push('ここには素敵な方ばかりですわ!わたくし、ずっとここにいたいくらいですの!');
if (!NOTIF_DIALOGUES['N3']) NOTIF_DIALOGUES['N3'] = {};
if (!NOTIF_DIALOGUES['N3'].normal) NOTIF_DIALOGUES['N3'].normal = {};
if (!NOTIF_DIALOGUES['N3'].normal.polite) NOTIF_DIALOGUES['N3'].normal.polite = [];
NOTIF_DIALOGUES['N3'].normal.polite.push('すみません……少しだけ、休ませてください。次までには、必ず戻しますから');
if (!NOTIF_DIALOGUES['N3']) NOTIF_DIALOGUES['N3'] = {};
if (!NOTIF_DIALOGUES['N3'].normal) NOTIF_DIALOGUES['N3'].normal = {};
if (!NOTIF_DIALOGUES['N3'].normal.cool) NOTIF_DIALOGUES['N3'].normal.cool = [];
NOTIF_DIALOGUES['N3'].normal.cool.push('……疲れた。少し、休む');
if (!NOTIF_DIALOGUES['N3']) NOTIF_DIALOGUES['N3'] = {};
if (!NOTIF_DIALOGUES['N3'].bold) NOTIF_DIALOGUES['N3'].bold = {};
if (!NOTIF_DIALOGUES['N3'].bold.polite) NOTIF_DIALOGUES['N3'].bold.polite = [];
NOTIF_DIALOGUES['N3'].bold.polite.push('……っ、大丈夫です、まだやれます……いえ、本当は少し、しんどいかも……すみません');
if (!NOTIF_DIALOGUES['N3']) NOTIF_DIALOGUES['N3'] = {};
if (!NOTIF_DIALOGUES['N3'].quiet) NOTIF_DIALOGUES['N3'].quiet = {};
if (!NOTIF_DIALOGUES['N3'].quiet.seductive) NOTIF_DIALOGUES['N3'].quiet.seductive = [];
NOTIF_DIALOGUES['N3'].quiet.seductive.push('……疲れた。少しだけ、目を閉じて……');
if (!NOTIF_DIALOGUES['N3']) NOTIF_DIALOGUES['N3'] = {};
if (!NOTIF_DIALOGUES['N3'].easygoing) NOTIF_DIALOGUES['N3'].easygoing = {};
if (!NOTIF_DIALOGUES['N3'].easygoing.polite) NOTIF_DIALOGUES['N3'].easygoing.polite = [];
NOTIF_DIALOGUES['N3'].easygoing.polite.push('あー……ちょっと、疲れちゃいました。ごめんなさい、少しだけ休んでもいいですか');
if (!NOTIF_DIALOGUES['N3']) NOTIF_DIALOGUES['N3'] = {};
if (!NOTIF_DIALOGUES['N3'].easygoing) NOTIF_DIALOGUES['N3'].easygoing = {};
if (!NOTIF_DIALOGUES['N3'].easygoing.ojousama) NOTIF_DIALOGUES['N3'].easygoing.ojousama = [];
NOTIF_DIALOGUES['N3'].easygoing.ojousama.push('……正直に申しますと、少しばかりくたびれましたの。休ませてくださいまし');
if (!NOTIF_DIALOGUES['N4']) NOTIF_DIALOGUES['N4'] = {};
if (!NOTIF_DIALOGUES['N4'].normal) NOTIF_DIALOGUES['N4'].normal = {};
if (!NOTIF_DIALOGUES['N4'].normal.polite) NOTIF_DIALOGUES['N4'].normal.polite = [];
NOTIF_DIALOGUES['N4'].normal.polite.push('応援してくださる方がこんなにいるなんて……嬉しくて、胸がいっぱいです');
if (!NOTIF_DIALOGUES['N4']) NOTIF_DIALOGUES['N4'] = {};
if (!NOTIF_DIALOGUES['N4'].normal) NOTIF_DIALOGUES['N4'].normal = {};
if (!NOTIF_DIALOGUES['N4'].normal.cool) NOTIF_DIALOGUES['N4'].normal.cool = [];
NOTIF_DIALOGUES['N4'].normal.cool.push('……見てくれてる人が、いる。なら、まだやれる');
if (!NOTIF_DIALOGUES['N4']) NOTIF_DIALOGUES['N4'] = {};
if (!NOTIF_DIALOGUES['N4'].bold) NOTIF_DIALOGUES['N4'].bold = {};
if (!NOTIF_DIALOGUES['N4'].bold.polite) NOTIF_DIALOGUES['N4'].bold.polite = [];
NOTIF_DIALOGUES['N4'].bold.polite.push('この声援、全部受け止めてみせます!わたし、まだまだこれからですよ!');
if (!NOTIF_DIALOGUES['N4']) NOTIF_DIALOGUES['N4'] = {};
if (!NOTIF_DIALOGUES['N4'].quiet) NOTIF_DIALOGUES['N4'].quiet = {};
if (!NOTIF_DIALOGUES['N4'].quiet.seductive) NOTIF_DIALOGUES['N4'].quiet.seductive = [];
NOTIF_DIALOGUES['N4'].quiet.seductive.push('……こんなわたしを、見てくれるのね。ふ、');
if (!NOTIF_DIALOGUES['N4']) NOTIF_DIALOGUES['N4'] = {};
if (!NOTIF_DIALOGUES['N4'].easygoing) NOTIF_DIALOGUES['N4'].easygoing = {};
if (!NOTIF_DIALOGUES['N4'].easygoing.polite) NOTIF_DIALOGUES['N4'].easygoing.polite = [];
NOTIF_DIALOGUES['N4'].easygoing.polite.push('えへへ、なんだかすごいことになってきました。応援、本当にありがたいです');
if (!NOTIF_DIALOGUES['N4']) NOTIF_DIALOGUES['N4'] = {};
if (!NOTIF_DIALOGUES['N4'].easygoing) NOTIF_DIALOGUES['N4'].easygoing = {};
if (!NOTIF_DIALOGUES['N4'].easygoing.ojousama) NOTIF_DIALOGUES['N4'].easygoing.ojousama = [];
NOTIF_DIALOGUES['N4'].easygoing.ojousama.push('まあ、こんなにも……!わたくし、嬉しくて涙が出そうですわ!');
if (!NOTIF_DIALOGUES['N5_warning']) NOTIF_DIALOGUES['N5_warning'] = {};
if (!NOTIF_DIALOGUES['N5_warning'].normal) NOTIF_DIALOGUES['N5_warning'].normal = {};
if (!NOTIF_DIALOGUES['N5_warning'].normal.polite) NOTIF_DIALOGUES['N5_warning'].normal.polite = [];
NOTIF_DIALOGUES['N5_warning'].normal.polite.push('……ごめんなさい。ちょっと、自分のことが、よくわからなくて……少しだけ、時間を……');
if (!NOTIF_DIALOGUES['N5_warning']) NOTIF_DIALOGUES['N5_warning'] = {};
if (!NOTIF_DIALOGUES['N5_warning'].normal) NOTIF_DIALOGUES['N5_warning'].normal = {};
if (!NOTIF_DIALOGUES['N5_warning'].normal.cool) NOTIF_DIALOGUES['N5_warning'].normal.cool = [];
NOTIF_DIALOGUES['N5_warning'].normal.cool.push('……なんか、おかしい。うまく、立て直せない');
if (!NOTIF_DIALOGUES['N5_warning']) NOTIF_DIALOGUES['N5_warning'] = {};
if (!NOTIF_DIALOGUES['N5_warning'].bold) NOTIF_DIALOGUES['N5_warning'].bold = {};
if (!NOTIF_DIALOGUES['N5_warning'].bold.polite) NOTIF_DIALOGUES['N5_warning'].bold.polite = [];
NOTIF_DIALOGUES['N5_warning'].bold.polite.push('大丈夫、です……いえ、大丈夫じゃない、かも……すみません、うまく言えなくて');
if (!NOTIF_DIALOGUES['N5_warning']) NOTIF_DIALOGUES['N5_warning'] = {};
if (!NOTIF_DIALOGUES['N5_warning'].quiet) NOTIF_DIALOGUES['N5_warning'].quiet = {};
if (!NOTIF_DIALOGUES['N5_warning'].quiet.seductive) NOTIF_DIALOGUES['N5_warning'].quiet.seductive = [];
NOTIF_DIALOGUES['N5_warning'].quiet.seductive.push('……少し、疲れすぎたみたい');
if (!NOTIF_DIALOGUES['N5_warning']) NOTIF_DIALOGUES['N5_warning'] = {};
if (!NOTIF_DIALOGUES['N5_warning'].easygoing) NOTIF_DIALOGUES['N5_warning'].easygoing = {};
if (!NOTIF_DIALOGUES['N5_warning'].easygoing.polite) NOTIF_DIALOGUES['N5_warning'].easygoing.polite = [];
NOTIF_DIALOGUES['N5_warning'].easygoing.polite.push('あの……笑ってるけど、実は結構きついんです……ごめんなさい、情けないこと言って');
if (!NOTIF_DIALOGUES['N5_warning']) NOTIF_DIALOGUES['N5_warning'] = {};
if (!NOTIF_DIALOGUES['N5_warning'].easygoing) NOTIF_DIALOGUES['N5_warning'].easygoing = {};
if (!NOTIF_DIALOGUES['N5_warning'].easygoing.ojousama) NOTIF_DIALOGUES['N5_warning'].easygoing.ojousama = [];
NOTIF_DIALOGUES['N5_warning'].easygoing.ojousama.push('……少し、胸の奥が重いのですの。らしくないですわね、わたくし……');
if (!NOTIF_DIALOGUES['N5_low']) NOTIF_DIALOGUES['N5_low'] = {};
if (!NOTIF_DIALOGUES['N5_low'].normal) NOTIF_DIALOGUES['N5_low'].normal = {};
if (!NOTIF_DIALOGUES['N5_low'].normal.polite) NOTIF_DIALOGUES['N5_low'].normal.polite = [];
NOTIF_DIALOGUES['N5_low'].normal.polite.push('もう……もう、無理かもしれません……どうして、こんなに、苦しいんでしょうか……');
if (!NOTIF_DIALOGUES['N5_low']) NOTIF_DIALOGUES['N5_low'] = {};
if (!NOTIF_DIALOGUES['N5_low'].normal) NOTIF_DIALOGUES['N5_low'].normal = {};
if (!NOTIF_DIALOGUES['N5_low'].normal.cool) NOTIF_DIALOGUES['N5_low'].normal.cool = [];
NOTIF_DIALOGUES['N5_low'].normal.cool.push('……限界。もう、いい');
if (!NOTIF_DIALOGUES['N5_low']) NOTIF_DIALOGUES['N5_low'] = {};
if (!NOTIF_DIALOGUES['N5_low'].bold) NOTIF_DIALOGUES['N5_low'].bold = {};
if (!NOTIF_DIALOGUES['N5_low'].bold.polite) NOTIF_DIALOGUES['N5_low'].bold.polite = [];
NOTIF_DIALOGUES['N5_low'].bold.polite.push('……わたし、もう、戦えません……こんなはずじゃ、なかったのに……っ');
if (!NOTIF_DIALOGUES['N5_low']) NOTIF_DIALOGUES['N5_low'] = {};
if (!NOTIF_DIALOGUES['N5_low'].quiet) NOTIF_DIALOGUES['N5_low'].quiet = {};
if (!NOTIF_DIALOGUES['N5_low'].quiet.seductive) NOTIF_DIALOGUES['N5_low'].quiet.seductive = [];
NOTIF_DIALOGUES['N5_low'].quiet.seductive.push('……ふふ、もう、いいの。……ほんとに、疲れた');
if (!NOTIF_DIALOGUES['N5_low']) NOTIF_DIALOGUES['N5_low'] = {};
if (!NOTIF_DIALOGUES['N5_low'].easygoing) NOTIF_DIALOGUES['N5_low'].easygoing = {};
if (!NOTIF_DIALOGUES['N5_low'].easygoing.polite) NOTIF_DIALOGUES['N5_low'].easygoing.polite = [];
NOTIF_DIALOGUES['N5_low'].easygoing.polite.push('……もう、笑えないです。ごめんなさい、ほんとに、ごめんなさい……');
if (!NOTIF_DIALOGUES['N5_low']) NOTIF_DIALOGUES['N5_low'] = {};
if (!NOTIF_DIALOGUES['N5_low'].easygoing) NOTIF_DIALOGUES['N5_low'].easygoing = {};
if (!NOTIF_DIALOGUES['N5_low'].easygoing.ojousama) NOTIF_DIALOGUES['N5_low'].easygoing.ojousama = [];
NOTIF_DIALOGUES['N5_low'].easygoing.ojousama.push('……もう、ですわ。もう、何も……わたくし、終わりかもしれませんわ……');

// ── CARE_REACTION_DIALOGUES 拡張 ──
if (!CARE_REACTION_DIALOGUES['bonus']) CARE_REACTION_DIALOGUES['bonus'] = {};
if (!CARE_REACTION_DIALOGUES['bonus'].normal) CARE_REACTION_DIALOGUES['bonus'].normal = {};
if (!CARE_REACTION_DIALOGUES['bonus'].normal.polite) CARE_REACTION_DIALOGUES['bonus'].normal.polite = [];
CARE_REACTION_DIALOGUES['bonus'].normal.polite.push('ボーナスを……いただけるんですか?ありがとうございます、大切に使わせていただきます');
if (!CARE_REACTION_DIALOGUES['bonus']) CARE_REACTION_DIALOGUES['bonus'] = {};
if (!CARE_REACTION_DIALOGUES['bonus'].normal) CARE_REACTION_DIALOGUES['bonus'].normal = {};
if (!CARE_REACTION_DIALOGUES['bonus'].normal.cool) CARE_REACTION_DIALOGUES['bonus'].normal.cool = [];
CARE_REACTION_DIALOGUES['bonus'].normal.cool.push('……ありがとう。助かる');
if (!CARE_REACTION_DIALOGUES['bonus']) CARE_REACTION_DIALOGUES['bonus'] = {};
if (!CARE_REACTION_DIALOGUES['bonus'].bold) CARE_REACTION_DIALOGUES['bonus'].bold = {};
if (!CARE_REACTION_DIALOGUES['bonus'].bold.polite) CARE_REACTION_DIALOGUES['bonus'].bold.polite = [];
CARE_REACTION_DIALOGUES['bonus'].bold.polite.push('わあ、嬉しいです!これでもっと頑張れます、ありがとうございます!');
if (!CARE_REACTION_DIALOGUES['bonus']) CARE_REACTION_DIALOGUES['bonus'] = {};
if (!CARE_REACTION_DIALOGUES['bonus'].quiet) CARE_REACTION_DIALOGUES['bonus'].quiet = {};
if (!CARE_REACTION_DIALOGUES['bonus'].quiet.seductive) CARE_REACTION_DIALOGUES['bonus'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['bonus'].quiet.seductive.push('……ありがとう。嬉しい');
if (!CARE_REACTION_DIALOGUES['bonus']) CARE_REACTION_DIALOGUES['bonus'] = {};
if (!CARE_REACTION_DIALOGUES['bonus'].easygoing) CARE_REACTION_DIALOGUES['bonus'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['bonus'].easygoing.polite) CARE_REACTION_DIALOGUES['bonus'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['bonus'].easygoing.polite.push('えっ、いいんですか?わあ、ありがとうございます、助かっちゃいます');
if (!CARE_REACTION_DIALOGUES['bonus']) CARE_REACTION_DIALOGUES['bonus'] = {};
if (!CARE_REACTION_DIALOGUES['bonus'].easygoing) CARE_REACTION_DIALOGUES['bonus'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['bonus'].easygoing.ojousama) CARE_REACTION_DIALOGUES['bonus'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['bonus'].easygoing.ojousama.push('まあ、よろしいんですの?ありがとうございますわ、大切にさせていただきますの');
if (!CARE_REACTION_DIALOGUES['bonus_repeat']) CARE_REACTION_DIALOGUES['bonus_repeat'] = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].normal) CARE_REACTION_DIALOGUES['bonus_repeat'].normal = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].normal.polite) CARE_REACTION_DIALOGUES['bonus_repeat'].normal.polite = [];
CARE_REACTION_DIALOGUES['bonus_repeat'].normal.polite.push('また……いつもありがとうございます。本当に、支えになっています');
if (!CARE_REACTION_DIALOGUES['bonus_repeat']) CARE_REACTION_DIALOGUES['bonus_repeat'] = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].normal) CARE_REACTION_DIALOGUES['bonus_repeat'].normal = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].normal.cool) CARE_REACTION_DIALOGUES['bonus_repeat'].normal.cool = [];
CARE_REACTION_DIALOGUES['bonus_repeat'].normal.cool.push('……またか。ありがとう');
if (!CARE_REACTION_DIALOGUES['bonus_repeat']) CARE_REACTION_DIALOGUES['bonus_repeat'] = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].bold) CARE_REACTION_DIALOGUES['bonus_repeat'].bold = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].bold.polite) CARE_REACTION_DIALOGUES['bonus_repeat'].bold.polite = [];
CARE_REACTION_DIALOGUES['bonus_repeat'].bold.polite.push('今回もですか!毎回助けていただいて……本当に感謝しています!');
if (!CARE_REACTION_DIALOGUES['bonus_repeat']) CARE_REACTION_DIALOGUES['bonus_repeat'] = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].quiet) CARE_REACTION_DIALOGUES['bonus_repeat'].quiet = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].quiet.seductive) CARE_REACTION_DIALOGUES['bonus_repeat'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['bonus_repeat'].quiet.seductive.push('……また?……ありがとう');
if (!CARE_REACTION_DIALOGUES['bonus_repeat']) CARE_REACTION_DIALOGUES['bonus_repeat'] = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing) CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing.polite) CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing.polite.push('わあ、また?いつもすみません、嬉しいです、本当に');
if (!CARE_REACTION_DIALOGUES['bonus_repeat']) CARE_REACTION_DIALOGUES['bonus_repeat'] = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing) CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing.ojousama) CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['bonus_repeat'].easygoing.ojousama.push('またですの?うふふ、感謝しておりますわ。いつも助けていただいて');
if (!CARE_REACTION_DIALOGUES['trainer']) CARE_REACTION_DIALOGUES['trainer'] = {};
if (!CARE_REACTION_DIALOGUES['trainer'].normal) CARE_REACTION_DIALOGUES['trainer'].normal = {};
if (!CARE_REACTION_DIALOGUES['trainer'].normal.polite) CARE_REACTION_DIALOGUES['trainer'].normal.polite = [];
CARE_REACTION_DIALOGUES['trainer'].normal.polite.push('新しいコーチをつけていただけるんですね。精一杯、吸収します');
if (!CARE_REACTION_DIALOGUES['trainer']) CARE_REACTION_DIALOGUES['trainer'] = {};
if (!CARE_REACTION_DIALOGUES['trainer'].normal) CARE_REACTION_DIALOGUES['trainer'].normal = {};
if (!CARE_REACTION_DIALOGUES['trainer'].normal.cool) CARE_REACTION_DIALOGUES['trainer'].normal.cool = [];
CARE_REACTION_DIALOGUES['trainer'].normal.cool.push('……了解。やる');
if (!CARE_REACTION_DIALOGUES['trainer']) CARE_REACTION_DIALOGUES['trainer'] = {};
if (!CARE_REACTION_DIALOGUES['trainer'].bold) CARE_REACTION_DIALOGUES['trainer'].bold = {};
if (!CARE_REACTION_DIALOGUES['trainer'].bold.polite) CARE_REACTION_DIALOGUES['trainer'].bold.polite = [];
CARE_REACTION_DIALOGUES['trainer'].bold.polite.push('コーチですか!ありがとうございます、絶対に強くなってみせます!');
if (!CARE_REACTION_DIALOGUES['trainer']) CARE_REACTION_DIALOGUES['trainer'] = {};
if (!CARE_REACTION_DIALOGUES['trainer'].quiet) CARE_REACTION_DIALOGUES['trainer'].quiet = {};
if (!CARE_REACTION_DIALOGUES['trainer'].quiet.seductive) CARE_REACTION_DIALOGUES['trainer'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['trainer'].quiet.seductive.push('……新しい先生?……よろしく、お願いします');
if (!CARE_REACTION_DIALOGUES['trainer']) CARE_REACTION_DIALOGUES['trainer'] = {};
if (!CARE_REACTION_DIALOGUES['trainer'].easygoing) CARE_REACTION_DIALOGUES['trainer'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['trainer'].easygoing.polite) CARE_REACTION_DIALOGUES['trainer'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['trainer'].easygoing.polite.push('新しいコーチさん?ちょっと緊張しちゃうな……頑張ります!');
if (!CARE_REACTION_DIALOGUES['trainer']) CARE_REACTION_DIALOGUES['trainer'] = {};
if (!CARE_REACTION_DIALOGUES['trainer'].easygoing) CARE_REACTION_DIALOGUES['trainer'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['trainer'].easygoing.ojousama) CARE_REACTION_DIALOGUES['trainer'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['trainer'].easygoing.ojousama.push('新しい先生ですの?まあ、わくわくしますわ!一生懸命学びますの!');
if (!CARE_REACTION_DIALOGUES['media']) CARE_REACTION_DIALOGUES['media'] = {};
if (!CARE_REACTION_DIALOGUES['media'].normal) CARE_REACTION_DIALOGUES['media'].normal = {};
if (!CARE_REACTION_DIALOGUES['media'].normal.polite) CARE_REACTION_DIALOGUES['media'].normal.polite = [];
CARE_REACTION_DIALOGUES['media'].normal.polite.push('メディア出演……ですか?は、はい、精一杯務めさせていただきます');
if (!CARE_REACTION_DIALOGUES['media']) CARE_REACTION_DIALOGUES['media'] = {};
if (!CARE_REACTION_DIALOGUES['media'].normal) CARE_REACTION_DIALOGUES['media'].normal = {};
if (!CARE_REACTION_DIALOGUES['media'].normal.cool) CARE_REACTION_DIALOGUES['media'].normal.cool = [];
CARE_REACTION_DIALOGUES['media'].normal.cool.push('……メディア?……わかった。行く');
if (!CARE_REACTION_DIALOGUES['media']) CARE_REACTION_DIALOGUES['media'] = {};
if (!CARE_REACTION_DIALOGUES['media'].bold) CARE_REACTION_DIALOGUES['media'].bold = {};
if (!CARE_REACTION_DIALOGUES['media'].bold.polite) CARE_REACTION_DIALOGUES['media'].bold.polite = [];
CARE_REACTION_DIALOGUES['media'].bold.polite.push('テレビですか!任せてください、団体の看板背負って行ってきます!');
if (!CARE_REACTION_DIALOGUES['media']) CARE_REACTION_DIALOGUES['media'] = {};
if (!CARE_REACTION_DIALOGUES['media'].quiet) CARE_REACTION_DIALOGUES['media'].quiet = {};
if (!CARE_REACTION_DIALOGUES['media'].quiet.seductive) CARE_REACTION_DIALOGUES['media'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['media'].quiet.seductive.push('……カメラの前で?……ふふ、面白そう');
if (!CARE_REACTION_DIALOGUES['media']) CARE_REACTION_DIALOGUES['media'] = {};
if (!CARE_REACTION_DIALOGUES['media'].easygoing) CARE_REACTION_DIALOGUES['media'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['media'].easygoing.polite) CARE_REACTION_DIALOGUES['media'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['media'].easygoing.polite.push('えー、テレビ出ちゃうんですか!緊張しちゃうなあ、でも嬉しいです!');
if (!CARE_REACTION_DIALOGUES['media']) CARE_REACTION_DIALOGUES['media'] = {};
if (!CARE_REACTION_DIALOGUES['media'].easygoing) CARE_REACTION_DIALOGUES['media'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['media'].easygoing.ojousama) CARE_REACTION_DIALOGUES['media'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['media'].easygoing.ojousama.push('メディア出演ですって!?まあまあ、やらせていただきますわ、もちろん!');
if (!CARE_REACTION_DIALOGUES['special_treatment']) CARE_REACTION_DIALOGUES['special_treatment'] = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].normal) CARE_REACTION_DIALOGUES['special_treatment'].normal = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].normal.polite) CARE_REACTION_DIALOGUES['special_treatment'].normal.polite = [];
CARE_REACTION_DIALOGUES['special_treatment'].normal.polite.push('こんなに良くしていただいて……本当にありがとうございます');
if (!CARE_REACTION_DIALOGUES['special_treatment']) CARE_REACTION_DIALOGUES['special_treatment'] = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].normal) CARE_REACTION_DIALOGUES['special_treatment'].normal = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].normal.cool) CARE_REACTION_DIALOGUES['special_treatment'].normal.cool = [];
CARE_REACTION_DIALOGUES['special_treatment'].normal.cool.push('……感謝してる');
if (!CARE_REACTION_DIALOGUES['special_treatment']) CARE_REACTION_DIALOGUES['special_treatment'] = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].bold) CARE_REACTION_DIALOGUES['special_treatment'].bold = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].bold.polite) CARE_REACTION_DIALOGUES['special_treatment'].bold.polite = [];
CARE_REACTION_DIALOGUES['special_treatment'].bold.polite.push('特別扱い、ですか?嬉しいです、その分結果で返します!');
if (!CARE_REACTION_DIALOGUES['special_treatment']) CARE_REACTION_DIALOGUES['special_treatment'] = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].quiet) CARE_REACTION_DIALOGUES['special_treatment'].quiet = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].quiet.seductive) CARE_REACTION_DIALOGUES['special_treatment'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['special_treatment'].quiet.seductive.push('……こんなに、してくれるの?ありがとう');
if (!CARE_REACTION_DIALOGUES['special_treatment']) CARE_REACTION_DIALOGUES['special_treatment'] = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].easygoing) CARE_REACTION_DIALOGUES['special_treatment'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].easygoing.polite) CARE_REACTION_DIALOGUES['special_treatment'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['special_treatment'].easygoing.polite.push('えっ、わたしだけ?いいんですか?ありがとうございます、嬉しい……');
if (!CARE_REACTION_DIALOGUES['special_treatment']) CARE_REACTION_DIALOGUES['special_treatment'] = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].easygoing) CARE_REACTION_DIALOGUES['special_treatment'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['special_treatment'].easygoing.ojousama) CARE_REACTION_DIALOGUES['special_treatment'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['special_treatment'].easygoing.ojousama.push('まあ、わたくしにそのような特別なお計らいを!恐縮ですわ、感謝いたしますの');
if (!CARE_REACTION_DIALOGUES['encourage']) CARE_REACTION_DIALOGUES['encourage'] = {};
if (!CARE_REACTION_DIALOGUES['encourage'].normal) CARE_REACTION_DIALOGUES['encourage'].normal = {};
if (!CARE_REACTION_DIALOGUES['encourage'].normal.polite) CARE_REACTION_DIALOGUES['encourage'].normal.polite = [];
CARE_REACTION_DIALOGUES['encourage'].normal.polite.push('励ましてくださって……ありがとうございます。もう少し、頑張ってみます');
if (!CARE_REACTION_DIALOGUES['encourage']) CARE_REACTION_DIALOGUES['encourage'] = {};
if (!CARE_REACTION_DIALOGUES['encourage'].normal) CARE_REACTION_DIALOGUES['encourage'].normal = {};
if (!CARE_REACTION_DIALOGUES['encourage'].normal.cool) CARE_REACTION_DIALOGUES['encourage'].normal.cool = [];
CARE_REACTION_DIALOGUES['encourage'].normal.cool.push('……ありがとう。大丈夫');
if (!CARE_REACTION_DIALOGUES['encourage']) CARE_REACTION_DIALOGUES['encourage'] = {};
if (!CARE_REACTION_DIALOGUES['encourage'].bold) CARE_REACTION_DIALOGUES['encourage'].bold = {};
if (!CARE_REACTION_DIALOGUES['encourage'].bold.polite) CARE_REACTION_DIALOGUES['encourage'].bold.polite = [];
CARE_REACTION_DIALOGUES['encourage'].bold.polite.push('そう言っていただけると嬉しいです!もっとやれる気がしてきました!');
if (!CARE_REACTION_DIALOGUES['encourage']) CARE_REACTION_DIALOGUES['encourage'] = {};
if (!CARE_REACTION_DIALOGUES['encourage'].quiet) CARE_REACTION_DIALOGUES['encourage'].quiet = {};
if (!CARE_REACTION_DIALOGUES['encourage'].quiet.seductive) CARE_REACTION_DIALOGUES['encourage'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['encourage'].quiet.seductive.push('……ありがとう。もう少しだけ、やってみる');
if (!CARE_REACTION_DIALOGUES['encourage']) CARE_REACTION_DIALOGUES['encourage'] = {};
if (!CARE_REACTION_DIALOGUES['encourage'].easygoing) CARE_REACTION_DIALOGUES['encourage'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['encourage'].easygoing.polite) CARE_REACTION_DIALOGUES['encourage'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['encourage'].easygoing.polite.push('ありがとうございます……なんか、元気出てきました');
if (!CARE_REACTION_DIALOGUES['encourage']) CARE_REACTION_DIALOGUES['encourage'] = {};
if (!CARE_REACTION_DIALOGUES['encourage'].easygoing) CARE_REACTION_DIALOGUES['encourage'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['encourage'].easygoing.ojousama) CARE_REACTION_DIALOGUES['encourage'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['encourage'].easygoing.ojousama.push('優しいお言葉、ありがとうございますわ。もう一度、頑張ってみますの');
if (!CARE_REACTION_DIALOGUES['encourage_high_trust']) CARE_REACTION_DIALOGUES['encourage_high_trust'] = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].normal) CARE_REACTION_DIALOGUES['encourage_high_trust'].normal = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].normal.polite) CARE_REACTION_DIALOGUES['encourage_high_trust'].normal.polite = [];
CARE_REACTION_DIALOGUES['encourage_high_trust'].normal.polite.push('ずっと見ていてくださったんですね……嬉しくて、胸がいっぱいです');
if (!CARE_REACTION_DIALOGUES['encourage_high_trust']) CARE_REACTION_DIALOGUES['encourage_high_trust'] = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].normal) CARE_REACTION_DIALOGUES['encourage_high_trust'].normal = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].normal.cool) CARE_REACTION_DIALOGUES['encourage_high_trust'].normal.cool = [];
CARE_REACTION_DIALOGUES['encourage_high_trust'].normal.cool.push('……あなたが見ててくれたから、やれた');
if (!CARE_REACTION_DIALOGUES['encourage_high_trust']) CARE_REACTION_DIALOGUES['encourage_high_trust'] = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].bold) CARE_REACTION_DIALOGUES['encourage_high_trust'].bold = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].bold.polite) CARE_REACTION_DIALOGUES['encourage_high_trust'].bold.polite = [];
CARE_REACTION_DIALOGUES['encourage_high_trust'].bold.polite.push('あなたの言葉なら信じられます!絶対に応えてみせますから!');
if (!CARE_REACTION_DIALOGUES['encourage_high_trust']) CARE_REACTION_DIALOGUES['encourage_high_trust'] = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].quiet) CARE_REACTION_DIALOGUES['encourage_high_trust'].quiet = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].quiet.seductive) CARE_REACTION_DIALOGUES['encourage_high_trust'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['encourage_high_trust'].quiet.seductive.push('……あなただから、言える。……ありがとう');
if (!CARE_REACTION_DIALOGUES['encourage_high_trust']) CARE_REACTION_DIALOGUES['encourage_high_trust'] = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing) CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing.polite) CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing.polite.push('ずっと支えてくれて、ありがとうございます……わたし、頑張ります');
if (!CARE_REACTION_DIALOGUES['encourage_high_trust']) CARE_REACTION_DIALOGUES['encourage_high_trust'] = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing) CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing.ojousama) CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['encourage_high_trust'].easygoing.ojousama.push('あなた様がそう仰ってくださるなら、わたくし何でもできますの!');
if (!CARE_REACTION_DIALOGUES['refresh_leave']) CARE_REACTION_DIALOGUES['refresh_leave'] = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].normal) CARE_REACTION_DIALOGUES['refresh_leave'].normal = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].normal.polite) CARE_REACTION_DIALOGUES['refresh_leave'].normal.polite = [];
CARE_REACTION_DIALOGUES['refresh_leave'].normal.polite.push('お休みをいただけるんですね……ありがとうございます。ゆっくり休みます');
if (!CARE_REACTION_DIALOGUES['refresh_leave']) CARE_REACTION_DIALOGUES['refresh_leave'] = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].normal) CARE_REACTION_DIALOGUES['refresh_leave'].normal = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].normal.cool) CARE_REACTION_DIALOGUES['refresh_leave'].normal.cool = [];
CARE_REACTION_DIALOGUES['refresh_leave'].normal.cool.push('……休む。ありがとう');
if (!CARE_REACTION_DIALOGUES['refresh_leave']) CARE_REACTION_DIALOGUES['refresh_leave'] = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].bold) CARE_REACTION_DIALOGUES['refresh_leave'].bold = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].bold.polite) CARE_REACTION_DIALOGUES['refresh_leave'].bold.polite = [];
CARE_REACTION_DIALOGUES['refresh_leave'].bold.polite.push('休暇ですか?しっかり休んで、戻ってきたら全開で行きます!');
if (!CARE_REACTION_DIALOGUES['refresh_leave']) CARE_REACTION_DIALOGUES['refresh_leave'] = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].quiet) CARE_REACTION_DIALOGUES['refresh_leave'].quiet = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].quiet.seductive) CARE_REACTION_DIALOGUES['refresh_leave'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['refresh_leave'].quiet.seductive.push('……少しだけ、眠らせて');
if (!CARE_REACTION_DIALOGUES['refresh_leave']) CARE_REACTION_DIALOGUES['refresh_leave'] = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].easygoing) CARE_REACTION_DIALOGUES['refresh_leave'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].easygoing.polite) CARE_REACTION_DIALOGUES['refresh_leave'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['refresh_leave'].easygoing.polite.push('わあ、お休み嬉しい!美味しいもの食べてきますね!');
if (!CARE_REACTION_DIALOGUES['refresh_leave']) CARE_REACTION_DIALOGUES['refresh_leave'] = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].easygoing) CARE_REACTION_DIALOGUES['refresh_leave'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['refresh_leave'].easygoing.ojousama) CARE_REACTION_DIALOGUES['refresh_leave'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['refresh_leave'].easygoing.ojousama.push('まあ、休暇ですの!ありがとうございますわ、ゆっくり過ごしてまいりますの');
if (!CARE_REACTION_DIALOGUES['party']) CARE_REACTION_DIALOGUES['party'] = {};
if (!CARE_REACTION_DIALOGUES['party'].normal) CARE_REACTION_DIALOGUES['party'].normal = {};
if (!CARE_REACTION_DIALOGUES['party'].normal.polite) CARE_REACTION_DIALOGUES['party'].normal.polite = [];
CARE_REACTION_DIALOGUES['party'].normal.polite.push('楽しい会に呼んでくださって、ありがとうございます。とても嬉しいです');
if (!CARE_REACTION_DIALOGUES['party']) CARE_REACTION_DIALOGUES['party'] = {};
if (!CARE_REACTION_DIALOGUES['party'].normal) CARE_REACTION_DIALOGUES['party'].normal = {};
if (!CARE_REACTION_DIALOGUES['party'].normal.cool) CARE_REACTION_DIALOGUES['party'].normal.cool = [];
CARE_REACTION_DIALOGUES['party'].normal.cool.push('……こういうの、悪くない');
if (!CARE_REACTION_DIALOGUES['party']) CARE_REACTION_DIALOGUES['party'] = {};
if (!CARE_REACTION_DIALOGUES['party'].bold) CARE_REACTION_DIALOGUES['party'].bold = {};
if (!CARE_REACTION_DIALOGUES['party'].bold.polite) CARE_REACTION_DIALOGUES['party'].bold.polite = [];
CARE_REACTION_DIALOGUES['party'].bold.polite.push('パーティ最高ですね!みんなで集まると元気が出ます!');
if (!CARE_REACTION_DIALOGUES['party']) CARE_REACTION_DIALOGUES['party'] = {};
if (!CARE_REACTION_DIALOGUES['party'].quiet) CARE_REACTION_DIALOGUES['party'].quiet = {};
if (!CARE_REACTION_DIALOGUES['party'].quiet.seductive) CARE_REACTION_DIALOGUES['party'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['party'].quiet.seductive.push('……お酒、いただいてもいい?……ふふ');
if (!CARE_REACTION_DIALOGUES['party']) CARE_REACTION_DIALOGUES['party'] = {};
if (!CARE_REACTION_DIALOGUES['party'].easygoing) CARE_REACTION_DIALOGUES['party'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['party'].easygoing.polite) CARE_REACTION_DIALOGUES['party'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['party'].easygoing.polite.push('わーい、パーティ!こういうの大好きなんです、ありがとうございます!');
if (!CARE_REACTION_DIALOGUES['party']) CARE_REACTION_DIALOGUES['party'] = {};
if (!CARE_REACTION_DIALOGUES['party'].easygoing) CARE_REACTION_DIALOGUES['party'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['party'].easygoing.ojousama) CARE_REACTION_DIALOGUES['party'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['party'].easygoing.ojousama.push('パーティですの!?わたくし、こういう華やかな場が大好きですの!');
if (!CARE_REACTION_DIALOGUES['camp']) CARE_REACTION_DIALOGUES['camp'] = {};
if (!CARE_REACTION_DIALOGUES['camp'].normal) CARE_REACTION_DIALOGUES['camp'].normal = {};
if (!CARE_REACTION_DIALOGUES['camp'].normal.polite) CARE_REACTION_DIALOGUES['camp'].normal.polite = [];
CARE_REACTION_DIALOGUES['camp'].normal.polite.push('合宿ですね。しっかり鍛えて、次に繋げたいと思います');
if (!CARE_REACTION_DIALOGUES['camp']) CARE_REACTION_DIALOGUES['camp'] = {};
if (!CARE_REACTION_DIALOGUES['camp'].normal) CARE_REACTION_DIALOGUES['camp'].normal = {};
if (!CARE_REACTION_DIALOGUES['camp'].normal.cool) CARE_REACTION_DIALOGUES['camp'].normal.cool = [];
CARE_REACTION_DIALOGUES['camp'].normal.cool.push('……合宿。やる');
if (!CARE_REACTION_DIALOGUES['camp']) CARE_REACTION_DIALOGUES['camp'] = {};
if (!CARE_REACTION_DIALOGUES['camp'].bold) CARE_REACTION_DIALOGUES['camp'].bold = {};
if (!CARE_REACTION_DIALOGUES['camp'].bold.polite) CARE_REACTION_DIALOGUES['camp'].bold.polite = [];
CARE_REACTION_DIALOGUES['camp'].bold.polite.push('合宿ですか!望むところです、限界まで追い込みますよ!');
if (!CARE_REACTION_DIALOGUES['camp']) CARE_REACTION_DIALOGUES['camp'] = {};
if (!CARE_REACTION_DIALOGUES['camp'].quiet) CARE_REACTION_DIALOGUES['camp'].quiet = {};
if (!CARE_REACTION_DIALOGUES['camp'].quiet.seductive) CARE_REACTION_DIALOGUES['camp'].quiet.seductive = [];
CARE_REACTION_DIALOGUES['camp'].quiet.seductive.push('……みんなと一緒に?……ふふ、いいわね');
if (!CARE_REACTION_DIALOGUES['camp']) CARE_REACTION_DIALOGUES['camp'] = {};
if (!CARE_REACTION_DIALOGUES['camp'].easygoing) CARE_REACTION_DIALOGUES['camp'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['camp'].easygoing.polite) CARE_REACTION_DIALOGUES['camp'].easygoing.polite = [];
CARE_REACTION_DIALOGUES['camp'].easygoing.polite.push('合宿かあ、ちょっと大変そうだけど頑張ります!楽しみ!');
if (!CARE_REACTION_DIALOGUES['camp']) CARE_REACTION_DIALOGUES['camp'] = {};
if (!CARE_REACTION_DIALOGUES['camp'].easygoing) CARE_REACTION_DIALOGUES['camp'].easygoing = {};
if (!CARE_REACTION_DIALOGUES['camp'].easygoing.ojousama) CARE_REACTION_DIALOGUES['camp'].easygoing.ojousama = [];
CARE_REACTION_DIALOGUES['camp'].easygoing.ojousama.push('合宿ですの?まあ、皆さまと一緒に過ごすのは楽しみですわ!');

// ── CHOICE_EVENT_DIALOGUES 拡張 ──
if (!CHOICE_EVENT_DIALOGUES['S1']) CHOICE_EVENT_DIALOGUES['S1'] = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].normal) CHOICE_EVENT_DIALOGUES['S1'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].normal.polite) CHOICE_EVENT_DIALOGUES['S1'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S1'].normal.polite.push('タイトルマッチの機会を、いただけないでしょうか……お願いします');
if (!CHOICE_EVENT_DIALOGUES['S1']) CHOICE_EVENT_DIALOGUES['S1'] = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].bold) CHOICE_EVENT_DIALOGUES['S1'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].bold.polite) CHOICE_EVENT_DIALOGUES['S1'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S1'].bold.polite.push('ベルトに挑戦させてください!今のわたしなら、絶対にやれます!');
if (!CHOICE_EVENT_DIALOGUES['S1']) CHOICE_EVENT_DIALOGUES['S1'] = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].quiet) CHOICE_EVENT_DIALOGUES['S1'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S1'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S1'].quiet.seductive.push('……タイトル。わたし、獲りたい');
if (!CHOICE_EVENT_DIALOGUES['S1']) CHOICE_EVENT_DIALOGUES['S1'] = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].easygoing) CHOICE_EVENT_DIALOGUES['S1'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S1'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S1'].easygoing.polite.push('あの、タイトル戦のこと、考えていただけませんか?本気なんです');
if (!CHOICE_EVENT_DIALOGUES['S1']) CHOICE_EVENT_DIALOGUES['S1'] = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].easygoing) CHOICE_EVENT_DIALOGUES['S1'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S1'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S1'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S1'].easygoing.ojousama.push('タイトル挑戦を、お願いできませんこと?わたくし、本気ですの');
if (!CHOICE_EVENT_DIALOGUES['S2']) CHOICE_EVENT_DIALOGUES['S2'] = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].normal) CHOICE_EVENT_DIALOGUES['S2'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].normal.polite) CHOICE_EVENT_DIALOGUES['S2'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S2'].normal.polite.push('あの人と戦わせてください。どうしても、決着をつけたいんです');
if (!CHOICE_EVENT_DIALOGUES['S2']) CHOICE_EVENT_DIALOGUES['S2'] = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].bold) CHOICE_EVENT_DIALOGUES['S2'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].bold.polite) CHOICE_EVENT_DIALOGUES['S2'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S2'].bold.polite.push('あいつと当ててください!絶対に負けません、絶対に!');
if (!CHOICE_EVENT_DIALOGUES['S2']) CHOICE_EVENT_DIALOGUES['S2'] = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].quiet) CHOICE_EVENT_DIALOGUES['S2'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S2'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S2'].quiet.seductive.push('……あの人と。……やらせて');
if (!CHOICE_EVENT_DIALOGUES['S2']) CHOICE_EVENT_DIALOGUES['S2'] = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].easygoing) CHOICE_EVENT_DIALOGUES['S2'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S2'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S2'].easygoing.polite.push('あの子とやりたいんです。なんか、気になっちゃって……お願いします');
if (!CHOICE_EVENT_DIALOGUES['S2']) CHOICE_EVENT_DIALOGUES['S2'] = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].easygoing) CHOICE_EVENT_DIALOGUES['S2'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S2'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S2'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S2'].easygoing.ojousama.push('あの方と試合を組んでいただけませんこと?どうしても、戦いたいんですの');
if (!CHOICE_EVENT_DIALOGUES['S3']) CHOICE_EVENT_DIALOGUES['S3'] = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].normal) CHOICE_EVENT_DIALOGUES['S3'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].normal.polite) CHOICE_EVENT_DIALOGUES['S3'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S3'].normal.polite.push('すみません……少しだけ、休ませていただけませんか。限界で……');
if (!CHOICE_EVENT_DIALOGUES['S3']) CHOICE_EVENT_DIALOGUES['S3'] = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].bold) CHOICE_EVENT_DIALOGUES['S3'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].bold.polite) CHOICE_EVENT_DIALOGUES['S3'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S3'].bold.polite.push('……っ、すみません、休ませてください……本当はまだやれるって言いたいけど、駄目です');
if (!CHOICE_EVENT_DIALOGUES['S3']) CHOICE_EVENT_DIALOGUES['S3'] = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].quiet) CHOICE_EVENT_DIALOGUES['S3'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S3'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S3'].quiet.seductive.push('……休ませて。少しだけ');
if (!CHOICE_EVENT_DIALOGUES['S3']) CHOICE_EVENT_DIALOGUES['S3'] = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].easygoing) CHOICE_EVENT_DIALOGUES['S3'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S3'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S3'].easygoing.polite.push('あの、ちょっと休みたいんです……ごめんなさい、情けなくて');
if (!CHOICE_EVENT_DIALOGUES['S3']) CHOICE_EVENT_DIALOGUES['S3'] = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].easygoing) CHOICE_EVENT_DIALOGUES['S3'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S3'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S3'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S3'].easygoing.ojousama.push('……申し訳ありませんが、少しお休みをくださいまし。体が、もう……');
if (!CHOICE_EVENT_DIALOGUES['S4_direct']) CHOICE_EVENT_DIALOGUES['S4_direct'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].normal) CHOICE_EVENT_DIALOGUES['S4_direct'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].normal.polite) CHOICE_EVENT_DIALOGUES['S4_direct'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S4_direct'].normal.polite.push('お話があります。今の待遇について……納得、できないんです');
if (!CHOICE_EVENT_DIALOGUES['S4_direct']) CHOICE_EVENT_DIALOGUES['S4_direct'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].bold) CHOICE_EVENT_DIALOGUES['S4_direct'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].bold.polite) CHOICE_EVENT_DIALOGUES['S4_direct'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S4_direct'].bold.polite.push('……っ、言わせてください!わたし、こんな扱いは納得できません!');
if (!CHOICE_EVENT_DIALOGUES['S4_direct']) CHOICE_EVENT_DIALOGUES['S4_direct'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].quiet) CHOICE_EVENT_DIALOGUES['S4_direct'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S4_direct'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S4_direct'].quiet.seductive.push('……今のままじゃ、いや');
if (!CHOICE_EVENT_DIALOGUES['S4_direct']) CHOICE_EVENT_DIALOGUES['S4_direct'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing) CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing.polite.push('あの、ちょっと聞いてほしいことがあって……今の扱い、少し寂しくて');
if (!CHOICE_EVENT_DIALOGUES['S4_direct']) CHOICE_EVENT_DIALOGUES['S4_direct'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing) CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S4_direct'].easygoing.ojousama.push('申し上げにくいのですけれど……今の待遇、納得しかねますの');
if (!CHOICE_EVENT_DIALOGUES['S4_silent']) CHOICE_EVENT_DIALOGUES['S4_silent'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].normal) CHOICE_EVENT_DIALOGUES['S4_silent'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].normal.polite) CHOICE_EVENT_DIALOGUES['S4_silent'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S4_silent'].normal.polite.push('(……このままで、いいんでしょうか。何も言えないまま……)');
if (!CHOICE_EVENT_DIALOGUES['S4_silent']) CHOICE_EVENT_DIALOGUES['S4_silent'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].bold) CHOICE_EVENT_DIALOGUES['S4_silent'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].bold.polite) CHOICE_EVENT_DIALOGUES['S4_silent'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S4_silent'].bold.polite.push('(言いたいことは、あります。でも……言ったら、終わる気がして)');
if (!CHOICE_EVENT_DIALOGUES['S4_silent']) CHOICE_EVENT_DIALOGUES['S4_silent'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].quiet) CHOICE_EVENT_DIALOGUES['S4_silent'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S4_silent'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S4_silent'].quiet.seductive.push('(……言わない。言っても、変わらない)');
if (!CHOICE_EVENT_DIALOGUES['S4_silent']) CHOICE_EVENT_DIALOGUES['S4_silent'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing) CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing.polite.push('(ちょっと不満、あるんですけどね……言えないなあ)');
if (!CHOICE_EVENT_DIALOGUES['S4_silent']) CHOICE_EVENT_DIALOGUES['S4_silent'] = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing) CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S4_silent'].easygoing.ojousama.push('(わたくし、不満がございますの。けれど、口には出せませんわ……)');
if (!CHOICE_EVENT_DIALOGUES['S5']) CHOICE_EVENT_DIALOGUES['S5'] = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].normal) CHOICE_EVENT_DIALOGUES['S5'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].normal.polite) CHOICE_EVENT_DIALOGUES['S5'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S5'].normal.polite.push('新しい企画を考えたんです。聞いていただけますか?');
if (!CHOICE_EVENT_DIALOGUES['S5']) CHOICE_EVENT_DIALOGUES['S5'] = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].bold) CHOICE_EVENT_DIALOGUES['S5'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].bold.polite) CHOICE_EVENT_DIALOGUES['S5'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S5'].bold.polite.push('プロモーションのアイデアがあります!絶対に客入ります、やらせてください!');
if (!CHOICE_EVENT_DIALOGUES['S5']) CHOICE_EVENT_DIALOGUES['S5'] = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].quiet) CHOICE_EVENT_DIALOGUES['S5'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S5'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S5'].quiet.seductive.push('……こういうのは、どう?');
if (!CHOICE_EVENT_DIALOGUES['S5']) CHOICE_EVENT_DIALOGUES['S5'] = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].easygoing) CHOICE_EVENT_DIALOGUES['S5'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S5'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S5'].easygoing.polite.push('あの、ちょっと思いついたことがあって……面白そうじゃないですか?');
if (!CHOICE_EVENT_DIALOGUES['S5']) CHOICE_EVENT_DIALOGUES['S5'] = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].easygoing) CHOICE_EVENT_DIALOGUES['S5'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S5'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S5'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S5'].easygoing.ojousama.push('わたくし、素敵な企画を考えましたの!聞いてくださいまし!');
if (!CHOICE_EVENT_DIALOGUES['S6']) CHOICE_EVENT_DIALOGUES['S6'] = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].normal) CHOICE_EVENT_DIALOGUES['S6'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].normal.polite) CHOICE_EVENT_DIALOGUES['S6'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S6'].normal.polite.push('あの、タッグを組みませんか。きっと、いいチームになれると思うんです');
if (!CHOICE_EVENT_DIALOGUES['S6']) CHOICE_EVENT_DIALOGUES['S6'] = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].bold) CHOICE_EVENT_DIALOGUES['S6'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].bold.polite) CHOICE_EVENT_DIALOGUES['S6'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S6'].bold.polite.push('わたしとタッグ組みましょう!最強のコンビ作りますよ!');
if (!CHOICE_EVENT_DIALOGUES['S6']) CHOICE_EVENT_DIALOGUES['S6'] = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].quiet) CHOICE_EVENT_DIALOGUES['S6'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S6'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S6'].quiet.seductive.push('……あの子と、組ませて');
if (!CHOICE_EVENT_DIALOGUES['S6']) CHOICE_EVENT_DIALOGUES['S6'] = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].easygoing) CHOICE_EVENT_DIALOGUES['S6'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S6'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S6'].easygoing.polite.push('ねえ、あの子とタッグやってみたいんです、仲良くなりたくて');
if (!CHOICE_EVENT_DIALOGUES['S6']) CHOICE_EVENT_DIALOGUES['S6'] = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].easygoing) CHOICE_EVENT_DIALOGUES['S6'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S6'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S6'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S6'].easygoing.ojousama.push('あの方とタッグを組ませてくださいまし!きっと素敵なコンビになりますわ!');
// ── 選択型イベント 結果セリフ（成功時の喜びリアクションなど） ────────────────
// 構造: CHOICE_EVENT_RESULT_DIALOGUES[type][outcome][archetype][personality]
// outcome: 'accept'(出す/受ける成功), 'recommend'(別の選手推薦時、推薦された選手のリアクション)
const CHOICE_EVENT_RESULT_DIALOGUES = {
  E1: {
    accept: {
      normal:    { _default: ['出演のお話、ありがたくお受けします'], polite: ['やりました……!夢みたいです、本当にありがとうございます'] },
      bold:      { _default: ['任せてよ、ばっちり爪痕残してくる!'], polite: ['やった、やりましたよ!わたしにできないことなんてない!'] },
      quiet:     { _default: ['……出る。頑張る'], seductive: ['……やれた。……嬉しい'] },
      shy:       { _default: ['は、はい…!せ、精一杯やります…!'] },
      easygoing: { _default: ['やったー!カメラの前で何しよっかな!'], polite: ['やったー!信じられない、夢みたい……!'], ojousama: ['まあ、成功いたしましたの!わたくし、嬉しくて仕方ありませんわ!'] },
      earnest:   { _default: ['お任せください…精一杯務めます'] },
      emotional: { _default: ['ほんとに……!? 嬉しい……っ……頑張ります……!'] },
    },
    recommend: {
      normal:    { _default: ['えっ、わたしですか？ ……はい、頑張ります!'] },
      bold:      { _default: ['お、わたしに来た!? いいよ、任せて!'] },
      quiet:     { _default: ['……わたしで、いいんですか。……やります'] },
      shy:       { _default: ['えっ、わ、わたしが…!? が、頑張ります……!'] },
      easygoing: { _default: ['えー!? わたしでいいの? やったー!'] },
      earnest:   { _default: ['ご指名、ありがとうございます。精一杯やります'] },
      emotional: { _default: ['えっ、わたしに……!? う、嬉しい……!'] },
    },
  },
};
if (!CHOICE_EVENT_DIALOGUES['E4']) CHOICE_EVENT_DIALOGUES['E4'] = {};
if (!CHOICE_EVENT_DIALOGUES['E4'].normal) CHOICE_EVENT_DIALOGUES['E4'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['E4'].normal.polite) CHOICE_EVENT_DIALOGUES['E4'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['E4'].normal.polite.push('応援してくださる皆さんのおかげです。本当に、ありがとうございます');
if (!CHOICE_EVENT_DIALOGUES['E6']) CHOICE_EVENT_DIALOGUES['E6'] = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].normal) CHOICE_EVENT_DIALOGUES['E6'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].normal.polite) CHOICE_EVENT_DIALOGUES['E6'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['E6'].normal.polite.push('重要な場面で、選んでくださってありがとうございます。全力で応えます');
if (!CHOICE_EVENT_DIALOGUES['E6']) CHOICE_EVENT_DIALOGUES['E6'] = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].bold) CHOICE_EVENT_DIALOGUES['E6'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].bold.polite) CHOICE_EVENT_DIALOGUES['E6'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['E6'].bold.polite.push('任せてください!絶対に期待を裏切りません、行ってきます!');
if (!CHOICE_EVENT_DIALOGUES['E6']) CHOICE_EVENT_DIALOGUES['E6'] = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].quiet) CHOICE_EVENT_DIALOGUES['E6'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].quiet.seductive) CHOICE_EVENT_DIALOGUES['E6'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['E6'].quiet.seductive.push('……わたしに、やらせて');
if (!CHOICE_EVENT_DIALOGUES['E6']) CHOICE_EVENT_DIALOGUES['E6'] = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].easygoing) CHOICE_EVENT_DIALOGUES['E6'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].easygoing.polite) CHOICE_EVENT_DIALOGUES['E6'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['E6'].easygoing.polite.push('わたしでいいんですか?頑張ります、絶対に!');
if (!CHOICE_EVENT_DIALOGUES['E6']) CHOICE_EVENT_DIALOGUES['E6'] = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].easygoing) CHOICE_EVENT_DIALOGUES['E6'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['E6'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['E6'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['E6'].easygoing.ojousama.push('わたくしにお任せいただけるなんて、光栄ですわ!必ずや応えてみせますの!');
if (!CHOICE_EVENT_DIALOGUES['S_boycott']) CHOICE_EVENT_DIALOGUES['S_boycott'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].normal) CHOICE_EVENT_DIALOGUES['S_boycott'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].normal.polite) CHOICE_EVENT_DIALOGUES['S_boycott'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S_boycott'].normal.polite.push('すみません……今日は、出られません。今のわたしには、無理です');
if (!CHOICE_EVENT_DIALOGUES['S_boycott']) CHOICE_EVENT_DIALOGUES['S_boycott'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].bold) CHOICE_EVENT_DIALOGUES['S_boycott'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].bold.polite) CHOICE_EVENT_DIALOGUES['S_boycott'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S_boycott'].bold.polite.push('こんな興行には出ません!わたしをなめないでください!');
if (!CHOICE_EVENT_DIALOGUES['S_boycott']) CHOICE_EVENT_DIALOGUES['S_boycott'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].quiet) CHOICE_EVENT_DIALOGUES['S_boycott'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S_boycott'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S_boycott'].quiet.seductive.push('……出ない。帰る');
if (!CHOICE_EVENT_DIALOGUES['S_boycott']) CHOICE_EVENT_DIALOGUES['S_boycott'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing) CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing.polite.push('ごめんなさい、今日はちょっと……気持ちが乗らなくて');
if (!CHOICE_EVENT_DIALOGUES['S_boycott']) CHOICE_EVENT_DIALOGUES['S_boycott'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing) CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S_boycott'].easygoing.ojousama.push('申し訳ありませんが、本日は欠場させていただきますわ');
if (!CHOICE_EVENT_DIALOGUES['S_grumble']) CHOICE_EVENT_DIALOGUES['S_grumble'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].normal) CHOICE_EVENT_DIALOGUES['S_grumble'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].normal.polite) CHOICE_EVENT_DIALOGUES['S_grumble'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S_grumble'].normal.polite.push('(……また今回も、わたしは外されるんですね。仕方ない、んでしょうか)');
if (!CHOICE_EVENT_DIALOGUES['S_grumble']) CHOICE_EVENT_DIALOGUES['S_grumble'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].bold) CHOICE_EVENT_DIALOGUES['S_grumble'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].bold.polite) CHOICE_EVENT_DIALOGUES['S_grumble'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S_grumble'].bold.polite.push('(……ふざけんな、こんなの納得できるかよ、畜生っ、と言いたい)');
if (!CHOICE_EVENT_DIALOGUES['S_grumble']) CHOICE_EVENT_DIALOGUES['S_grumble'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].quiet) CHOICE_EVENT_DIALOGUES['S_grumble'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S_grumble'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S_grumble'].quiet.seductive.push('(……面白くない)');
if (!CHOICE_EVENT_DIALOGUES['S_grumble']) CHOICE_EVENT_DIALOGUES['S_grumble'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing) CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing.polite.push('(なんかなあ……もうちょっと、考えてほしかったなあ)');
if (!CHOICE_EVENT_DIALOGUES['S_grumble']) CHOICE_EVENT_DIALOGUES['S_grumble'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing) CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S_grumble'].easygoing.ojousama.push('(わたくし、少々不満でございますの。ぶつぶつ……)');
if (!CHOICE_EVENT_DIALOGUES['S_sns']) CHOICE_EVENT_DIALOGUES['S_sns'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].normal) CHOICE_EVENT_DIALOGUES['S_sns'].normal = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].normal.polite) CHOICE_EVENT_DIALOGUES['S_sns'].normal.polite = [];
CHOICE_EVENT_DIALOGUES['S_sns'].normal.polite.push('(今日の試合のこと、少しだけ呟いておこうかな……)');
if (!CHOICE_EVENT_DIALOGUES['S_sns']) CHOICE_EVENT_DIALOGUES['S_sns'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].bold) CHOICE_EVENT_DIALOGUES['S_sns'].bold = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].bold.polite) CHOICE_EVENT_DIALOGUES['S_sns'].bold.polite = [];
CHOICE_EVENT_DIALOGUES['S_sns'].bold.polite.push('SNSに書いてやる!みんなに知ってもらわないと気が済まない!');
if (!CHOICE_EVENT_DIALOGUES['S_sns']) CHOICE_EVENT_DIALOGUES['S_sns'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].quiet) CHOICE_EVENT_DIALOGUES['S_sns'].quiet = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].quiet.seductive) CHOICE_EVENT_DIALOGUES['S_sns'].quiet.seductive = [];
CHOICE_EVENT_DIALOGUES['S_sns'].quiet.seductive.push('(……投稿。短く、匂わせるだけ)');
if (!CHOICE_EVENT_DIALOGUES['S_sns']) CHOICE_EVENT_DIALOGUES['S_sns'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].easygoing) CHOICE_EVENT_DIALOGUES['S_sns'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].easygoing.polite) CHOICE_EVENT_DIALOGUES['S_sns'].easygoing.polite = [];
CHOICE_EVENT_DIALOGUES['S_sns'].easygoing.polite.push('(あー、ちょっと愚痴っちゃおうかな、ちょっとだけ……)');
if (!CHOICE_EVENT_DIALOGUES['S_sns']) CHOICE_EVENT_DIALOGUES['S_sns'] = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].easygoing) CHOICE_EVENT_DIALOGUES['S_sns'].easygoing = {};
if (!CHOICE_EVENT_DIALOGUES['S_sns'].easygoing.ojousama) CHOICE_EVENT_DIALOGUES['S_sns'].easygoing.ojousama = [];
CHOICE_EVENT_DIALOGUES['S_sns'].easygoing.ojousama.push('(SNSに書こうかしら……いえ、品がございませんわね、やめておきますの)');

// ── LARGE_EVENT_DIALOGUES 拡張 ──
if (!LARGE_EVENT_DIALOGUES['B1']) LARGE_EVENT_DIALOGUES['B1'] = {};
if (!LARGE_EVENT_DIALOGUES['B1'].normal) LARGE_EVENT_DIALOGUES['B1'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B1'].normal.polite) LARGE_EVENT_DIALOGUES['B1'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B1'].normal.polite.push('すみません……少し、お時間をいただくことになりそうです。申し訳ありません');
if (!LARGE_EVENT_DIALOGUES['B1']) LARGE_EVENT_DIALOGUES['B1'] = {};
if (!LARGE_EVENT_DIALOGUES['B1'].normal) LARGE_EVENT_DIALOGUES['B1'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B1'].normal.cool) LARGE_EVENT_DIALOGUES['B1'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B1'].normal.cool.push('……怪我した。しばらく、無理');
if (!LARGE_EVENT_DIALOGUES['B1']) LARGE_EVENT_DIALOGUES['B1'] = {};
if (!LARGE_EVENT_DIALOGUES['B1'].bold) LARGE_EVENT_DIALOGUES['B1'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B1'].bold.polite) LARGE_EVENT_DIALOGUES['B1'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B1'].bold.polite.push('……っ、痛い、です……大丈夫です、歩けます、すみません、心配かけて');
if (!LARGE_EVENT_DIALOGUES['B1']) LARGE_EVENT_DIALOGUES['B1'] = {};
if (!LARGE_EVENT_DIALOGUES['B1'].quiet) LARGE_EVENT_DIALOGUES['B1'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B1'].quiet.seductive) LARGE_EVENT_DIALOGUES['B1'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B1'].quiet.seductive.push('……痛……っ。少しだけ、休ませて……');
if (!LARGE_EVENT_DIALOGUES['B1']) LARGE_EVENT_DIALOGUES['B1'] = {};
if (!LARGE_EVENT_DIALOGUES['B1'].easygoing) LARGE_EVENT_DIALOGUES['B1'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B1'].easygoing.polite) LARGE_EVENT_DIALOGUES['B1'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B1'].easygoing.polite.push('あちゃー、やっちゃいました……ごめんなさい、しばらくご迷惑かけます');
if (!LARGE_EVENT_DIALOGUES['B1']) LARGE_EVENT_DIALOGUES['B1'] = {};
if (!LARGE_EVENT_DIALOGUES['B1'].easygoing) LARGE_EVENT_DIALOGUES['B1'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B1'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B1'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B1'].easygoing.ojousama.push('……情けないですわ。少々、療養させてくださいまし');
if (!LARGE_EVENT_DIALOGUES['B2_fighter1']) LARGE_EVENT_DIALOGUES['B2_fighter1'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].normal) LARGE_EVENT_DIALOGUES['B2_fighter1'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].normal.polite) LARGE_EVENT_DIALOGUES['B2_fighter1'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B2_fighter1'].normal.polite.push('あの人とは、もう上手くやれません……はっきり言わせていただきます');
if (!LARGE_EVENT_DIALOGUES['B2_fighter1']) LARGE_EVENT_DIALOGUES['B2_fighter1'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].normal) LARGE_EVENT_DIALOGUES['B2_fighter1'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].normal.cool) LARGE_EVENT_DIALOGUES['B2_fighter1'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B2_fighter1'].normal.cool.push('……あいつとは合わない。もう無理');
if (!LARGE_EVENT_DIALOGUES['B2_fighter1']) LARGE_EVENT_DIALOGUES['B2_fighter1'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].bold) LARGE_EVENT_DIALOGUES['B2_fighter1'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].bold.polite) LARGE_EVENT_DIALOGUES['B2_fighter1'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B2_fighter1'].bold.polite.push('あの人、わたしとは方向性が違うんです!もう一緒には組めません!');
if (!LARGE_EVENT_DIALOGUES['B2_fighter1']) LARGE_EVENT_DIALOGUES['B2_fighter1'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].quiet) LARGE_EVENT_DIALOGUES['B2_fighter1'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].quiet.seductive) LARGE_EVENT_DIALOGUES['B2_fighter1'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B2_fighter1'].quiet.seductive.push('……あの人、嫌い。近づけないで');
if (!LARGE_EVENT_DIALOGUES['B2_fighter1']) LARGE_EVENT_DIALOGUES['B2_fighter1'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing) LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing.polite) LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing.polite.push('なんかあの子と合わなくて……ごめんなさい、わたしから言います');
if (!LARGE_EVENT_DIALOGUES['B2_fighter1']) LARGE_EVENT_DIALOGUES['B2_fighter1'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing) LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B2_fighter1'].easygoing.ojousama.push('あの方とは、どうにもそりが合いませんの。申し上げにくいのですけれど……');
if (!LARGE_EVENT_DIALOGUES['B2_fighter2']) LARGE_EVENT_DIALOGUES['B2_fighter2'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].normal) LARGE_EVENT_DIALOGUES['B2_fighter2'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].normal.polite) LARGE_EVENT_DIALOGUES['B2_fighter2'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B2_fighter2'].normal.polite.push('わたしが、何かしましたか……?心当たりがなくて、辛いです');
if (!LARGE_EVENT_DIALOGUES['B2_fighter2']) LARGE_EVENT_DIALOGUES['B2_fighter2'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].normal) LARGE_EVENT_DIALOGUES['B2_fighter2'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].normal.cool) LARGE_EVENT_DIALOGUES['B2_fighter2'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B2_fighter2'].normal.cool.push('……向こうが勝手に。わたしは、何もしてない');
if (!LARGE_EVENT_DIALOGUES['B2_fighter2']) LARGE_EVENT_DIALOGUES['B2_fighter2'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].bold) LARGE_EVENT_DIALOGUES['B2_fighter2'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].bold.polite) LARGE_EVENT_DIALOGUES['B2_fighter2'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B2_fighter2'].bold.polite.push('え、わたしのせいなんですか!?ちょっと待ってください、話させてください!');
if (!LARGE_EVENT_DIALOGUES['B2_fighter2']) LARGE_EVENT_DIALOGUES['B2_fighter2'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].quiet) LARGE_EVENT_DIALOGUES['B2_fighter2'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].quiet.seductive) LARGE_EVENT_DIALOGUES['B2_fighter2'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B2_fighter2'].quiet.seductive.push('……わたしのこと?……何か、したかしら');
if (!LARGE_EVENT_DIALOGUES['B2_fighter2']) LARGE_EVENT_DIALOGUES['B2_fighter2'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing) LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing.polite) LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing.polite.push('ええっ、わたしそんなつもりじゃなかったんですけど……ごめんなさい');
if (!LARGE_EVENT_DIALOGUES['B2_fighter2']) LARGE_EVENT_DIALOGUES['B2_fighter2'] = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing) LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B2_fighter2'].easygoing.ojousama.push('わたくし、何か失礼をいたしましたでしょうか……心当たりがございませんの');
if (!LARGE_EVENT_DIALOGUES['B4']) LARGE_EVENT_DIALOGUES['B4'] = {};
if (!LARGE_EVENT_DIALOGUES['B4'].normal) LARGE_EVENT_DIALOGUES['B4'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4'].normal.polite) LARGE_EVENT_DIALOGUES['B4'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B4'].normal.polite.push('取材ですか。精一杯、誠実にお答えします');
if (!LARGE_EVENT_DIALOGUES['B4']) LARGE_EVENT_DIALOGUES['B4'] = {};
if (!LARGE_EVENT_DIALOGUES['B4'].normal) LARGE_EVENT_DIALOGUES['B4'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4'].normal.cool) LARGE_EVENT_DIALOGUES['B4'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B4'].normal.cool.push('……質問、どうぞ');
if (!LARGE_EVENT_DIALOGUES['B4']) LARGE_EVENT_DIALOGUES['B4'] = {};
if (!LARGE_EVENT_DIALOGUES['B4'].bold) LARGE_EVENT_DIALOGUES['B4'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B4'].bold.polite) LARGE_EVENT_DIALOGUES['B4'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B4'].bold.polite.push('取材大歓迎です!団体のこと、どんどん話しますよ!');
if (!LARGE_EVENT_DIALOGUES['B4']) LARGE_EVENT_DIALOGUES['B4'] = {};
if (!LARGE_EVENT_DIALOGUES['B4'].quiet) LARGE_EVENT_DIALOGUES['B4'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B4'].quiet.seductive) LARGE_EVENT_DIALOGUES['B4'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B4'].quiet.seductive.push('……カメラ。……どうぞ、ご自由に');
if (!LARGE_EVENT_DIALOGUES['B4']) LARGE_EVENT_DIALOGUES['B4'] = {};
if (!LARGE_EVENT_DIALOGUES['B4'].easygoing) LARGE_EVENT_DIALOGUES['B4'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4'].easygoing.polite) LARGE_EVENT_DIALOGUES['B4'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B4'].easygoing.polite.push('あ、取材ですか!えっと、緊張しますけど頑張ります!');
if (!LARGE_EVENT_DIALOGUES['B4']) LARGE_EVENT_DIALOGUES['B4'] = {};
if (!LARGE_EVENT_DIALOGUES['B4'].easygoing) LARGE_EVENT_DIALOGUES['B4'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B4'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B4'].easygoing.ojousama.push('取材ですの!まあ、わたくしで良ければ、もちろんですわ!');
if (!LARGE_EVENT_DIALOGUES['B4_cm']) LARGE_EVENT_DIALOGUES['B4_cm'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].normal) LARGE_EVENT_DIALOGUES['B4_cm'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].normal.polite) LARGE_EVENT_DIALOGUES['B4_cm'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B4_cm'].normal.polite.push('CMのお仕事ですか……!精一杯、務めさせていただきます');
if (!LARGE_EVENT_DIALOGUES['B4_cm']) LARGE_EVENT_DIALOGUES['B4_cm'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].normal) LARGE_EVENT_DIALOGUES['B4_cm'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].normal.cool) LARGE_EVENT_DIALOGUES['B4_cm'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B4_cm'].normal.cool.push('……CM。やる');
if (!LARGE_EVENT_DIALOGUES['B4_cm']) LARGE_EVENT_DIALOGUES['B4_cm'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].bold) LARGE_EVENT_DIALOGUES['B4_cm'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].bold.polite) LARGE_EVENT_DIALOGUES['B4_cm'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B4_cm'].bold.polite.push('CMですか!これで知名度上げますよ、任せてください!');
if (!LARGE_EVENT_DIALOGUES['B4_cm']) LARGE_EVENT_DIALOGUES['B4_cm'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].quiet) LARGE_EVENT_DIALOGUES['B4_cm'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].quiet.seductive) LARGE_EVENT_DIALOGUES['B4_cm'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B4_cm'].quiet.seductive.push('……画面越しに、微笑むだけ?……できるわ');
if (!LARGE_EVENT_DIALOGUES['B4_cm']) LARGE_EVENT_DIALOGUES['B4_cm'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].easygoing) LARGE_EVENT_DIALOGUES['B4_cm'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].easygoing.polite) LARGE_EVENT_DIALOGUES['B4_cm'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B4_cm'].easygoing.polite.push('わー、CM出ちゃうんですか!信じられない、嬉しい!');
if (!LARGE_EVENT_DIALOGUES['B4_cm']) LARGE_EVENT_DIALOGUES['B4_cm'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].easygoing) LARGE_EVENT_DIALOGUES['B4_cm'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_cm'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B4_cm'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B4_cm'].easygoing.ojousama.push('まあ、CMですの!?わたくしがテレビに映るなんて、素敵ですわ!');
if (!LARGE_EVENT_DIALOGUES['B4_gravure']) LARGE_EVENT_DIALOGUES['B4_gravure'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].normal) LARGE_EVENT_DIALOGUES['B4_gravure'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].normal.polite) LARGE_EVENT_DIALOGUES['B4_gravure'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B4_gravure'].normal.polite.push('グラビア……ですか?は、はい、チャレンジしてみます');
if (!LARGE_EVENT_DIALOGUES['B4_gravure']) LARGE_EVENT_DIALOGUES['B4_gravure'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].normal) LARGE_EVENT_DIALOGUES['B4_gravure'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].normal.cool) LARGE_EVENT_DIALOGUES['B4_gravure'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B4_gravure'].normal.cool.push('……グラビア。了解');
if (!LARGE_EVENT_DIALOGUES['B4_gravure']) LARGE_EVENT_DIALOGUES['B4_gravure'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].bold) LARGE_EVENT_DIALOGUES['B4_gravure'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].bold.polite) LARGE_EVENT_DIALOGUES['B4_gravure'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B4_gravure'].bold.polite.push('グラビアですか!女として勝負、受けて立ちます!');
if (!LARGE_EVENT_DIALOGUES['B4_gravure']) LARGE_EVENT_DIALOGUES['B4_gravure'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].quiet) LARGE_EVENT_DIALOGUES['B4_gravure'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].quiet.seductive) LARGE_EVENT_DIALOGUES['B4_gravure'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B4_gravure'].quiet.seductive.push('……カメラの前で?……ふふ、楽しそう');
if (!LARGE_EVENT_DIALOGUES['B4_gravure']) LARGE_EVENT_DIALOGUES['B4_gravure'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing) LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing.polite) LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing.polite.push('ええっ、グラビア!?わたしで大丈夫ですか……頑張ります!');
if (!LARGE_EVENT_DIALOGUES['B4_gravure']) LARGE_EVENT_DIALOGUES['B4_gravure'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing) LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B4_gravure'].easygoing.ojousama.push('まあ、グラビアですって!?わたくし、少し恥ずかしいですけれど、挑戦いたしますわ!');
if (!LARGE_EVENT_DIALOGUES['B4_variety']) LARGE_EVENT_DIALOGUES['B4_variety'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].normal) LARGE_EVENT_DIALOGUES['B4_variety'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].normal.polite) LARGE_EVENT_DIALOGUES['B4_variety'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B4_variety'].normal.polite.push('バラエティ番組ですか。うまくやれるか不安ですが、頑張ります');
if (!LARGE_EVENT_DIALOGUES['B4_variety']) LARGE_EVENT_DIALOGUES['B4_variety'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].normal) LARGE_EVENT_DIALOGUES['B4_variety'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].normal.cool) LARGE_EVENT_DIALOGUES['B4_variety'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B4_variety'].normal.cool.push('……バラエティ?……できる範囲で');
if (!LARGE_EVENT_DIALOGUES['B4_variety']) LARGE_EVENT_DIALOGUES['B4_variety'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].bold) LARGE_EVENT_DIALOGUES['B4_variety'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].bold.polite) LARGE_EVENT_DIALOGUES['B4_variety'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B4_variety'].bold.polite.push('バラエティ任せてください!めちゃくちゃ爪痕残してきますから!');
if (!LARGE_EVENT_DIALOGUES['B4_variety']) LARGE_EVENT_DIALOGUES['B4_variety'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].quiet) LARGE_EVENT_DIALOGUES['B4_variety'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].quiet.seductive) LARGE_EVENT_DIALOGUES['B4_variety'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B4_variety'].quiet.seductive.push('……笑いを、取るの?……やってみる');
if (!LARGE_EVENT_DIALOGUES['B4_variety']) LARGE_EVENT_DIALOGUES['B4_variety'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].easygoing) LARGE_EVENT_DIALOGUES['B4_variety'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].easygoing.polite) LARGE_EVENT_DIALOGUES['B4_variety'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B4_variety'].easygoing.polite.push('バラエティ!わーい、わたしこういうの好きなんです!');
if (!LARGE_EVENT_DIALOGUES['B4_variety']) LARGE_EVENT_DIALOGUES['B4_variety'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].easygoing) LARGE_EVENT_DIALOGUES['B4_variety'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_variety'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B4_variety'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B4_variety'].easygoing.ojousama.push('バラエティ番組ですの?うふふ、面白そうですわね、行ってまいりますの!');
if (!LARGE_EVENT_DIALOGUES['B4_brand']) LARGE_EVENT_DIALOGUES['B4_brand'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].normal) LARGE_EVENT_DIALOGUES['B4_brand'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].normal.polite) LARGE_EVENT_DIALOGUES['B4_brand'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B4_brand'].normal.polite.push('ブランドコラボ……ですか。身が引き締まる思いです');
if (!LARGE_EVENT_DIALOGUES['B4_brand']) LARGE_EVENT_DIALOGUES['B4_brand'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].normal) LARGE_EVENT_DIALOGUES['B4_brand'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].normal.cool) LARGE_EVENT_DIALOGUES['B4_brand'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B4_brand'].normal.cool.push('……ブランド案件。光栄');
if (!LARGE_EVENT_DIALOGUES['B4_brand']) LARGE_EVENT_DIALOGUES['B4_brand'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].bold) LARGE_EVENT_DIALOGUES['B4_brand'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].bold.polite) LARGE_EVENT_DIALOGUES['B4_brand'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B4_brand'].bold.polite.push('ブランドとのコラボ!?やりますよ、わたしが顔になります!');
if (!LARGE_EVENT_DIALOGUES['B4_brand']) LARGE_EVENT_DIALOGUES['B4_brand'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].quiet) LARGE_EVENT_DIALOGUES['B4_brand'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].quiet.seductive) LARGE_EVENT_DIALOGUES['B4_brand'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B4_brand'].quiet.seductive.push('……選んで、くれたの。……ふふ、嬉しい');
if (!LARGE_EVENT_DIALOGUES['B4_brand']) LARGE_EVENT_DIALOGUES['B4_brand'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].easygoing) LARGE_EVENT_DIALOGUES['B4_brand'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].easygoing.polite) LARGE_EVENT_DIALOGUES['B4_brand'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B4_brand'].easygoing.polite.push('ブランドコラボ!?えー、すごい、わたしでいいんですか!');
if (!LARGE_EVENT_DIALOGUES['B4_brand']) LARGE_EVENT_DIALOGUES['B4_brand'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].easygoing) LARGE_EVENT_DIALOGUES['B4_brand'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_brand'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B4_brand'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B4_brand'].easygoing.ojousama.push('ブランドからのお話ですの!?まあまあ、なんて素敵な!');
if (!LARGE_EVENT_DIALOGUES['B4_fashion']) LARGE_EVENT_DIALOGUES['B4_fashion'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].normal) LARGE_EVENT_DIALOGUES['B4_fashion'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].normal.polite) LARGE_EVENT_DIALOGUES['B4_fashion'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B4_fashion'].normal.polite.push('ファッション誌の取材ですね。慣れませんが、頑張ります');
if (!LARGE_EVENT_DIALOGUES['B4_fashion']) LARGE_EVENT_DIALOGUES['B4_fashion'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].normal) LARGE_EVENT_DIALOGUES['B4_fashion'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].normal.cool) LARGE_EVENT_DIALOGUES['B4_fashion'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B4_fashion'].normal.cool.push('……ファッション誌。やる');
if (!LARGE_EVENT_DIALOGUES['B4_fashion']) LARGE_EVENT_DIALOGUES['B4_fashion'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].bold) LARGE_EVENT_DIALOGUES['B4_fashion'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].bold.polite) LARGE_EVENT_DIALOGUES['B4_fashion'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B4_fashion'].bold.polite.push('ファッション誌ですか!モデルみたいに決めてきますね!');
if (!LARGE_EVENT_DIALOGUES['B4_fashion']) LARGE_EVENT_DIALOGUES['B4_fashion'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].quiet) LARGE_EVENT_DIALOGUES['B4_fashion'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].quiet.seductive) LARGE_EVENT_DIALOGUES['B4_fashion'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B4_fashion'].quiet.seductive.push('……ポーズ?……任せて');
if (!LARGE_EVENT_DIALOGUES['B4_fashion']) LARGE_EVENT_DIALOGUES['B4_fashion'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing) LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing.polite) LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing.polite.push('ファッション誌!わたしオシャレ好きなんで、楽しみです!');
if (!LARGE_EVENT_DIALOGUES['B4_fashion']) LARGE_EVENT_DIALOGUES['B4_fashion'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing) LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B4_fashion'].easygoing.ojousama.push('ファッション誌ですって!まあ、わたくし、こういうの大好物ですの!');
if (!LARGE_EVENT_DIALOGUES['B4_fan']) LARGE_EVENT_DIALOGUES['B4_fan'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].normal) LARGE_EVENT_DIALOGUES['B4_fan'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].normal.polite) LARGE_EVENT_DIALOGUES['B4_fan'].normal.polite = [];
LARGE_EVENT_DIALOGUES['B4_fan'].normal.polite.push('ファンの皆さんと……直接お話できるんですか?嬉しいです、頑張ります');
if (!LARGE_EVENT_DIALOGUES['B4_fan']) LARGE_EVENT_DIALOGUES['B4_fan'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].normal) LARGE_EVENT_DIALOGUES['B4_fan'].normal = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].normal.cool) LARGE_EVENT_DIALOGUES['B4_fan'].normal.cool = [];
LARGE_EVENT_DIALOGUES['B4_fan'].normal.cool.push('……ファンと。……行く');
if (!LARGE_EVENT_DIALOGUES['B4_fan']) LARGE_EVENT_DIALOGUES['B4_fan'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].bold) LARGE_EVENT_DIALOGUES['B4_fan'].bold = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].bold.polite) LARGE_EVENT_DIALOGUES['B4_fan'].bold.polite = [];
LARGE_EVENT_DIALOGUES['B4_fan'].bold.polite.push('ファン感謝イベント!みんな、待っててくださいね、全力で楽しませます!');
if (!LARGE_EVENT_DIALOGUES['B4_fan']) LARGE_EVENT_DIALOGUES['B4_fan'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].quiet) LARGE_EVENT_DIALOGUES['B4_fan'].quiet = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].quiet.seductive) LARGE_EVENT_DIALOGUES['B4_fan'].quiet.seductive = [];
LARGE_EVENT_DIALOGUES['B4_fan'].quiet.seductive.push('……ファンに、会うの?……ふふ、嬉しい');
if (!LARGE_EVENT_DIALOGUES['B4_fan']) LARGE_EVENT_DIALOGUES['B4_fan'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].easygoing) LARGE_EVENT_DIALOGUES['B4_fan'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].easygoing.polite) LARGE_EVENT_DIALOGUES['B4_fan'].easygoing.polite = [];
LARGE_EVENT_DIALOGUES['B4_fan'].easygoing.polite.push('ファンのみんなに会える!わたし、こういうの一番好きなんです!');
if (!LARGE_EVENT_DIALOGUES['B4_fan']) LARGE_EVENT_DIALOGUES['B4_fan'] = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].easygoing) LARGE_EVENT_DIALOGUES['B4_fan'].easygoing = {};
if (!LARGE_EVENT_DIALOGUES['B4_fan'].easygoing.ojousama) LARGE_EVENT_DIALOGUES['B4_fan'].easygoing.ojousama = [];
LARGE_EVENT_DIALOGUES['B4_fan'].easygoing.ojousama.push('ファンの皆様と直接お話できますの!?まあ、楽しみですわ、はりきりますの!');

// ── GLIMPSE_B_LINES 拡張 (dialogue + scene) ──
if (!GLIMPSE_B_LINES['GL-01']['win']) GLIMPSE_B_LINES['GL-01']['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].normal) GLIMPSE_B_LINES['GL-01']['win'].normal = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].normal.polite) GLIMPSE_B_LINES['GL-01']['win'].normal.polite = [];
GLIMPSE_B_LINES['GL-01']['win'].normal.polite.push('勝てました……応援、ありがとうございました');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win']) GLIMPSE_B_LINES['GL-01']._scene['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].normal) GLIMPSE_B_LINES['GL-01']._scene['win'].normal = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].normal.polite) GLIMPSE_B_LINES['GL-01']._scene['win'].normal.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['win'].normal.polite.push('息を整える。勝てた。ようやく、勝てた');
if (!GLIMPSE_B_LINES['GL-01']['win']) GLIMPSE_B_LINES['GL-01']['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].bold) GLIMPSE_B_LINES['GL-01']['win'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].bold.polite) GLIMPSE_B_LINES['GL-01']['win'].bold.polite = [];
GLIMPSE_B_LINES['GL-01']['win'].bold.polite.push('よっしゃ……!まだ終わらない!');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win']) GLIMPSE_B_LINES['GL-01']._scene['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].bold) GLIMPSE_B_LINES['GL-01']._scene['win'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].bold.polite) GLIMPSE_B_LINES['GL-01']._scene['win'].bold.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['win'].bold.polite.push('拳を握りしめる。ここまで来た。まだ、もっと行ける');
if (!GLIMPSE_B_LINES['GL-01']['win']) GLIMPSE_B_LINES['GL-01']['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].bold) GLIMPSE_B_LINES['GL-01']['win'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].bold.seductive) GLIMPSE_B_LINES['GL-01']['win'].bold.seductive = [];
GLIMPSE_B_LINES['GL-01']['win'].bold.seductive.push('ふ……いい試合、だったわ');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win']) GLIMPSE_B_LINES['GL-01']._scene['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].bold) GLIMPSE_B_LINES['GL-01']._scene['win'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].bold.seductive) GLIMPSE_B_LINES['GL-01']._scene['win'].bold.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['win'].bold.seductive.push('汗の滴る肌。唇の端がわずかに上がる');
if (!GLIMPSE_B_LINES['GL-01']['win']) GLIMPSE_B_LINES['GL-01']['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].quiet) GLIMPSE_B_LINES['GL-01']['win'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].quiet.seductive) GLIMPSE_B_LINES['GL-01']['win'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-01']['win'].quiet.seductive.push('……勝った');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win']) GLIMPSE_B_LINES['GL-01']._scene['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].quiet) GLIMPSE_B_LINES['GL-01']._scene['win'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].quiet.seductive) GLIMPSE_B_LINES['GL-01']._scene['win'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['win'].quiet.seductive.push('リングに膝をつく。息を吐く。沈黙');
if (!GLIMPSE_B_LINES['GL-01']['win']) GLIMPSE_B_LINES['GL-01']['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].quiet) GLIMPSE_B_LINES['GL-01']['win'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].quiet.polite) GLIMPSE_B_LINES['GL-01']['win'].quiet.polite = [];
GLIMPSE_B_LINES['GL-01']['win'].quiet.polite.push('……勝利、いたしました');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win']) GLIMPSE_B_LINES['GL-01']._scene['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].quiet) GLIMPSE_B_LINES['GL-01']._scene['win'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].quiet.polite) GLIMPSE_B_LINES['GL-01']._scene['win'].quiet.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['win'].quiet.polite.push('静かにマイクを受け取る。声は低く、しかし確か');
if (!GLIMPSE_B_LINES['GL-01']['win']) GLIMPSE_B_LINES['GL-01']['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].earnest) GLIMPSE_B_LINES['GL-01']['win'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].earnest.seductive) GLIMPSE_B_LINES['GL-01']['win'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-01']['win'].earnest.seductive.push('ふふ……ここまで、こられたのですね');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win']) GLIMPSE_B_LINES['GL-01']._scene['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].earnest) GLIMPSE_B_LINES['GL-01']._scene['win'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].earnest.seductive) GLIMPSE_B_LINES['GL-01']._scene['win'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['win'].earnest.seductive.push('胸に手を当てる。確かに、鼓動は高鳴っている');
if (!GLIMPSE_B_LINES['GL-01']['win']) GLIMPSE_B_LINES['GL-01']['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].earnest) GLIMPSE_B_LINES['GL-01']['win'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']['win'].earnest.ojousama) GLIMPSE_B_LINES['GL-01']['win'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-01']['win'].earnest.ojousama.push('ありがとうございますわ……皆様の声援、確かに届きましたの');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win']) GLIMPSE_B_LINES['GL-01']._scene['win'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].earnest) GLIMPSE_B_LINES['GL-01']._scene['win'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['win'].earnest.ojousama) GLIMPSE_B_LINES['GL-01']._scene['win'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-01']._scene['win'].earnest.ojousama.push('背筋を伸ばす。勝利の重みを、噛みしめる');
if (!GLIMPSE_B_LINES['GL-01']['loss']) GLIMPSE_B_LINES['GL-01']['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].normal) GLIMPSE_B_LINES['GL-01']['loss'].normal = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].normal.polite) GLIMPSE_B_LINES['GL-01']['loss'].normal.polite = [];
GLIMPSE_B_LINES['GL-01']['loss'].normal.polite.push('……すみません。次は、必ず');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss']) GLIMPSE_B_LINES['GL-01']._scene['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].normal) GLIMPSE_B_LINES['GL-01']._scene['loss'].normal = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].normal.polite) GLIMPSE_B_LINES['GL-01']._scene['loss'].normal.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['loss'].normal.polite.push('天井を見上げる。悔しい。悔しすぎて、言葉にならない');
if (!GLIMPSE_B_LINES['GL-01']['loss']) GLIMPSE_B_LINES['GL-01']['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].bold) GLIMPSE_B_LINES['GL-01']['loss'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].bold.polite) GLIMPSE_B_LINES['GL-01']['loss'].bold.polite = [];
GLIMPSE_B_LINES['GL-01']['loss'].bold.polite.push('くそっ……!こんなはず、じゃなかったのに……っ');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss']) GLIMPSE_B_LINES['GL-01']._scene['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].bold) GLIMPSE_B_LINES['GL-01']._scene['loss'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].bold.polite) GLIMPSE_B_LINES['GL-01']._scene['loss'].bold.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['loss'].bold.polite.push('拳で床を叩く。負けた。負けてしまった');
if (!GLIMPSE_B_LINES['GL-01']['loss']) GLIMPSE_B_LINES['GL-01']['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].bold) GLIMPSE_B_LINES['GL-01']['loss'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].bold.seductive) GLIMPSE_B_LINES['GL-01']['loss'].bold.seductive = [];
GLIMPSE_B_LINES['GL-01']['loss'].bold.seductive.push('ふ……まだ、足りなかった、みたいね');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss']) GLIMPSE_B_LINES['GL-01']._scene['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].bold) GLIMPSE_B_LINES['GL-01']._scene['loss'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].bold.seductive) GLIMPSE_B_LINES['GL-01']._scene['loss'].bold.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['loss'].bold.seductive.push('血の味を舌で確かめる。敗北の味は、よく知っている');
if (!GLIMPSE_B_LINES['GL-01']['loss']) GLIMPSE_B_LINES['GL-01']['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].quiet) GLIMPSE_B_LINES['GL-01']['loss'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].quiet.seductive) GLIMPSE_B_LINES['GL-01']['loss'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-01']['loss'].quiet.seductive.push('……負けた');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss']) GLIMPSE_B_LINES['GL-01']._scene['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet) GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet.seductive) GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet.seductive.push('動けない。動きたくない。ただ、天井だけを見ていた');
if (!GLIMPSE_B_LINES['GL-01']['loss']) GLIMPSE_B_LINES['GL-01']['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].quiet) GLIMPSE_B_LINES['GL-01']['loss'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].quiet.polite) GLIMPSE_B_LINES['GL-01']['loss'].quiet.polite = [];
GLIMPSE_B_LINES['GL-01']['loss'].quiet.polite.push('……完敗、です');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss']) GLIMPSE_B_LINES['GL-01']._scene['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet) GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet.polite) GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['loss'].quiet.polite.push('ゆっくりと立ち上がる。負けは負け、受け入れるしかない');
if (!GLIMPSE_B_LINES['GL-01']['loss']) GLIMPSE_B_LINES['GL-01']['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].earnest) GLIMPSE_B_LINES['GL-01']['loss'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].earnest.seductive) GLIMPSE_B_LINES['GL-01']['loss'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-01']['loss'].earnest.seductive.push('……まだ、わたし、足りませんわね……');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss']) GLIMPSE_B_LINES['GL-01']._scene['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest) GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest.seductive) GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest.seductive.push('目を閉じる。悔しさを、胸の奥に沈めていく');
if (!GLIMPSE_B_LINES['GL-01']['loss']) GLIMPSE_B_LINES['GL-01']['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].earnest) GLIMPSE_B_LINES['GL-01']['loss'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']['loss'].earnest.ojousama) GLIMPSE_B_LINES['GL-01']['loss'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-01']['loss'].earnest.ojousama.push('……申し訳、ございませんわ……');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss']) GLIMPSE_B_LINES['GL-01']._scene['loss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest) GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest.ojousama) GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-01']._scene['loss'].earnest.ojousama.push('涙をこらえる。唇を噛む。言葉にしたら、崩れてしまいそうで');
if (!GLIMPSE_B_LINES['GL-01']['goodLoss']) GLIMPSE_B_LINES['GL-01']['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].normal) GLIMPSE_B_LINES['GL-01']['goodLoss'].normal = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].normal.polite) GLIMPSE_B_LINES['GL-01']['goodLoss'].normal.polite = [];
GLIMPSE_B_LINES['GL-01']['goodLoss'].normal.polite.push('……負けましたが、後悔はないです');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss']) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].normal) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].normal = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].normal.polite) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].normal.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].normal.polite.push('敗れた。けれど、出し切った感覚はあった');
if (!GLIMPSE_B_LINES['GL-01']['goodLoss']) GLIMPSE_B_LINES['GL-01']['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].bold) GLIMPSE_B_LINES['GL-01']['goodLoss'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].bold.polite) GLIMPSE_B_LINES['GL-01']['goodLoss'].bold.polite = [];
GLIMPSE_B_LINES['GL-01']['goodLoss'].bold.polite.push('負けたけど……!わたし、全部出した!');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss']) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold.polite) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold.polite.push('息が上がる。勝てなかった、でも怖じ気づきはしなかった');
if (!GLIMPSE_B_LINES['GL-01']['goodLoss']) GLIMPSE_B_LINES['GL-01']['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].bold) GLIMPSE_B_LINES['GL-01']['goodLoss'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].bold.seductive) GLIMPSE_B_LINES['GL-01']['goodLoss'].bold.seductive = [];
GLIMPSE_B_LINES['GL-01']['goodLoss'].bold.seductive.push('ふふ……これは、これで、悪くないわね');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss']) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold.seductive) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].bold.seductive.push('リングに手をつく。負けてなお、身体は熱い');
if (!GLIMPSE_B_LINES['GL-01']['goodLoss']) GLIMPSE_B_LINES['GL-01']['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet) GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet.seductive) GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet.seductive.push('……届かなかった。でも、見えた');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss']) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet.seductive) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet.seductive.push('ゆっくりと息を吐く。身体の芯に、残るものがある');
if (!GLIMPSE_B_LINES['GL-01']['goodLoss']) GLIMPSE_B_LINES['GL-01']['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet) GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet.polite) GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet.polite = [];
GLIMPSE_B_LINES['GL-01']['goodLoss'].quiet.polite.push('……よく、やれました');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss']) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet.polite) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].quiet.polite.push('拳を見つめる。ここまで動けた自分を、少しだけ認める');
if (!GLIMPSE_B_LINES['GL-01']['goodLoss']) GLIMPSE_B_LINES['GL-01']['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest) GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest.seductive) GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest.seductive.push('ふ……貴女、強いのね……');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss']) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest.seductive) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest.seductive.push('血が滲む唇を拭う。この敗北に、意味はあった');
if (!GLIMPSE_B_LINES['GL-01']['goodLoss']) GLIMPSE_B_LINES['GL-01']['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest) GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest.ojousama) GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-01']['goodLoss'].earnest.ojousama.push('……素晴らしい試合でしたわ、ありがとうございましたの');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss']) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest.ojousama) GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-01']._scene['goodLoss'].earnest.ojousama.push('深く頭を下げる。負けはしたが、誇りは失わない');
if (!GLIMPSE_B_LINES['GL-01']['greatWin']) GLIMPSE_B_LINES['GL-01']['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].normal) GLIMPSE_B_LINES['GL-01']['greatWin'].normal = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].normal.polite) GLIMPSE_B_LINES['GL-01']['greatWin'].normal.polite = [];
GLIMPSE_B_LINES['GL-01']['greatWin'].normal.polite.push('……勝てた。信じられません');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin']) GLIMPSE_B_LINES['GL-01']._scene['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].normal) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].normal = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].normal.polite) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].normal.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['greatWin'].normal.polite.push('信じられない。震える手を、必死に抑える');
if (!GLIMPSE_B_LINES['GL-01']['greatWin']) GLIMPSE_B_LINES['GL-01']['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].bold) GLIMPSE_B_LINES['GL-01']['greatWin'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].bold.polite) GLIMPSE_B_LINES['GL-01']['greatWin'].bold.polite = [];
GLIMPSE_B_LINES['GL-01']['greatWin'].bold.polite.push('見ろよ!!これがわたしだ!!');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin']) GLIMPSE_B_LINES['GL-01']._scene['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold.polite) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold.polite.push('両手を突き上げる。やってやった、やってやったんだ');
if (!GLIMPSE_B_LINES['GL-01']['greatWin']) GLIMPSE_B_LINES['GL-01']['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].bold) GLIMPSE_B_LINES['GL-01']['greatWin'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].bold.seductive) GLIMPSE_B_LINES['GL-01']['greatWin'].bold.seductive = [];
GLIMPSE_B_LINES['GL-01']['greatWin'].bold.seductive.push('ふふ……最高の、夜ね');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin']) GLIMPSE_B_LINES['GL-01']._scene['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold.seductive) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['greatWin'].bold.seductive.push('観客の歓声が遠く聞こえる。全身が、熱い');
if (!GLIMPSE_B_LINES['GL-01']['greatWin']) GLIMPSE_B_LINES['GL-01']['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].quiet) GLIMPSE_B_LINES['GL-01']['greatWin'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].quiet.seductive) GLIMPSE_B_LINES['GL-01']['greatWin'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-01']['greatWin'].quiet.seductive.push('……獲った');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin']) GLIMPSE_B_LINES['GL-01']._scene['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet.seductive) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet.seductive.push('空を見上げる。涙が、勝手に流れてくる');
if (!GLIMPSE_B_LINES['GL-01']['greatWin']) GLIMPSE_B_LINES['GL-01']['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].quiet) GLIMPSE_B_LINES['GL-01']['greatWin'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].quiet.polite) GLIMPSE_B_LINES['GL-01']['greatWin'].quiet.polite = [];
GLIMPSE_B_LINES['GL-01']['greatWin'].quiet.polite.push('……勝ち、ました');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin']) GLIMPSE_B_LINES['GL-01']._scene['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet.polite) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet.polite = [];
GLIMPSE_B_LINES['GL-01']._scene['greatWin'].quiet.polite.push('静かに、確かに、膝を折る。勝利を、噛みしめる');
if (!GLIMPSE_B_LINES['GL-01']['greatWin']) GLIMPSE_B_LINES['GL-01']['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].earnest) GLIMPSE_B_LINES['GL-01']['greatWin'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].earnest.seductive) GLIMPSE_B_LINES['GL-01']['greatWin'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-01']['greatWin'].earnest.seductive.push('……夢を、見ているみたい……ですわね');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin']) GLIMPSE_B_LINES['GL-01']._scene['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest.seductive) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest.seductive.push('胸の前で手を合わせる。感謝の祈りのように');
if (!GLIMPSE_B_LINES['GL-01']['greatWin']) GLIMPSE_B_LINES['GL-01']['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].earnest) GLIMPSE_B_LINES['GL-01']['greatWin'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']['greatWin'].earnest.ojousama) GLIMPSE_B_LINES['GL-01']['greatWin'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-01']['greatWin'].earnest.ojousama.push('……皆様のおかげですわ。本当に、本当に、ありがとうございますの');
if (!GLIMPSE_B_LINES['GL-01']._scene) GLIMPSE_B_LINES['GL-01']._scene = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin']) GLIMPSE_B_LINES['GL-01']._scene['greatWin'] = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest = {};
if (!GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest.ojousama) GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-01']._scene['greatWin'].earnest.ojousama.push('深々と頭を下げる。誇りと感謝で、胸がいっぱいだった');
if (!GLIMPSE_B_LINES['GL-02'].normal) GLIMPSE_B_LINES['GL-02'].normal = {};
if (!GLIMPSE_B_LINES['GL-02'].normal.polite) GLIMPSE_B_LINES['GL-02'].normal.polite = [];
GLIMPSE_B_LINES['GL-02'].normal.polite.push('……行けます。大丈夫');
if (!GLIMPSE_B_LINES['GL-02']._scene) GLIMPSE_B_LINES['GL-02']._scene = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.normal) GLIMPSE_B_LINES['GL-02']._scene.normal = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.normal.polite) GLIMPSE_B_LINES['GL-02']._scene.normal.polite = [];
GLIMPSE_B_LINES['GL-02']._scene.normal.polite.push('静かな控室。自分の呼吸音だけが響く');
if (!GLIMPSE_B_LINES['GL-02'].bold) GLIMPSE_B_LINES['GL-02'].bold = {};
if (!GLIMPSE_B_LINES['GL-02'].bold.polite) GLIMPSE_B_LINES['GL-02'].bold.polite = [];
GLIMPSE_B_LINES['GL-02'].bold.polite.push('……さあ、行ってきます!');
if (!GLIMPSE_B_LINES['GL-02']._scene) GLIMPSE_B_LINES['GL-02']._scene = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.bold) GLIMPSE_B_LINES['GL-02']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.bold.polite) GLIMPSE_B_LINES['GL-02']._scene.bold.polite = [];
GLIMPSE_B_LINES['GL-02']._scene.bold.polite.push('鏡の前で、自分の目を見る。逃げない目だ');
if (!GLIMPSE_B_LINES['GL-02'].bold) GLIMPSE_B_LINES['GL-02'].bold = {};
if (!GLIMPSE_B_LINES['GL-02'].bold.seductive) GLIMPSE_B_LINES['GL-02'].bold.seductive = [];
GLIMPSE_B_LINES['GL-02'].bold.seductive.push('ふふ……今夜も、魅せてあげる');
if (!GLIMPSE_B_LINES['GL-02']._scene) GLIMPSE_B_LINES['GL-02']._scene = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.bold) GLIMPSE_B_LINES['GL-02']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.bold.seductive) GLIMPSE_B_LINES['GL-02']._scene.bold.seductive = [];
GLIMPSE_B_LINES['GL-02']._scene.bold.seductive.push('唇に色を差す。戦うための、戦化粧');
if (!GLIMPSE_B_LINES['GL-02'].quiet) GLIMPSE_B_LINES['GL-02'].quiet = {};
if (!GLIMPSE_B_LINES['GL-02'].quiet.seductive) GLIMPSE_B_LINES['GL-02'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-02'].quiet.seductive.push('……行く');
if (!GLIMPSE_B_LINES['GL-02']._scene) GLIMPSE_B_LINES['GL-02']._scene = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.quiet) GLIMPSE_B_LINES['GL-02']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.quiet.seductive) GLIMPSE_B_LINES['GL-02']._scene.quiet.seductive = [];
GLIMPSE_B_LINES['GL-02']._scene.quiet.seductive.push('目を閉じて、息を整える。静かに、深く');
if (!GLIMPSE_B_LINES['GL-02'].quiet) GLIMPSE_B_LINES['GL-02'].quiet = {};
if (!GLIMPSE_B_LINES['GL-02'].quiet.polite) GLIMPSE_B_LINES['GL-02'].quiet.polite = [];
GLIMPSE_B_LINES['GL-02'].quiet.polite.push('……参ります');
if (!GLIMPSE_B_LINES['GL-02']._scene) GLIMPSE_B_LINES['GL-02']._scene = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.quiet) GLIMPSE_B_LINES['GL-02']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.quiet.polite) GLIMPSE_B_LINES['GL-02']._scene.quiet.polite = [];
GLIMPSE_B_LINES['GL-02']._scene.quiet.polite.push('手袋を締め直す。準備は、整った');
if (!GLIMPSE_B_LINES['GL-02'].earnest) GLIMPSE_B_LINES['GL-02'].earnest = {};
if (!GLIMPSE_B_LINES['GL-02'].earnest.seductive) GLIMPSE_B_LINES['GL-02'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-02'].earnest.seductive.push('……必ず、勝ちますわ');
if (!GLIMPSE_B_LINES['GL-02']._scene) GLIMPSE_B_LINES['GL-02']._scene = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.earnest) GLIMPSE_B_LINES['GL-02']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.earnest.seductive) GLIMPSE_B_LINES['GL-02']._scene.earnest.seductive = [];
GLIMPSE_B_LINES['GL-02']._scene.earnest.seductive.push('胸元の十字を、そっと握る');
if (!GLIMPSE_B_LINES['GL-02'].earnest) GLIMPSE_B_LINES['GL-02'].earnest = {};
if (!GLIMPSE_B_LINES['GL-02'].earnest.ojousama) GLIMPSE_B_LINES['GL-02'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-02'].earnest.ojousama.push('……行ってまいりますの');
if (!GLIMPSE_B_LINES['GL-02']._scene) GLIMPSE_B_LINES['GL-02']._scene = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.earnest) GLIMPSE_B_LINES['GL-02']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-02']._scene.earnest.ojousama) GLIMPSE_B_LINES['GL-02']._scene.earnest.ojousama = [];
GLIMPSE_B_LINES['GL-02']._scene.earnest.ojousama.push('凛と背筋を伸ばす。戦場へ向かう覚悟を決める');
if (!GLIMPSE_B_LINES['GL-04'].normal) GLIMPSE_B_LINES['GL-04'].normal = {};
if (!GLIMPSE_B_LINES['GL-04'].normal.polite) GLIMPSE_B_LINES['GL-04'].normal.polite = [];
GLIMPSE_B_LINES['GL-04'].normal.polite.push('……まだ、です……!');
if (!GLIMPSE_B_LINES['GL-04']._scene) GLIMPSE_B_LINES['GL-04']._scene = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.normal) GLIMPSE_B_LINES['GL-04']._scene.normal = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.normal.polite) GLIMPSE_B_LINES['GL-04']._scene.normal.polite = [];
GLIMPSE_B_LINES['GL-04']._scene.normal.polite.push('息が上がる。けれど、ここで倒れるわけには');
if (!GLIMPSE_B_LINES['GL-04'].bold) GLIMPSE_B_LINES['GL-04'].bold = {};
if (!GLIMPSE_B_LINES['GL-04'].bold.polite) GLIMPSE_B_LINES['GL-04'].bold.polite = [];
GLIMPSE_B_LINES['GL-04'].bold.polite.push('こん、な……とこ、ろで……!');
if (!GLIMPSE_B_LINES['GL-04']._scene) GLIMPSE_B_LINES['GL-04']._scene = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.bold) GLIMPSE_B_LINES['GL-04']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.bold.polite) GLIMPSE_B_LINES['GL-04']._scene.bold.polite = [];
GLIMPSE_B_LINES['GL-04']._scene.bold.polite.push('歯を食いしばる。痛みは、まだ耐えられる');
if (!GLIMPSE_B_LINES['GL-04'].bold) GLIMPSE_B_LINES['GL-04'].bold = {};
if (!GLIMPSE_B_LINES['GL-04'].bold.seductive) GLIMPSE_B_LINES['GL-04'].bold.seductive = [];
GLIMPSE_B_LINES['GL-04'].bold.seductive.push('ふ……そう簡単には、落ちない、わ……');
if (!GLIMPSE_B_LINES['GL-04']._scene) GLIMPSE_B_LINES['GL-04']._scene = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.bold) GLIMPSE_B_LINES['GL-04']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.bold.seductive) GLIMPSE_B_LINES['GL-04']._scene.bold.seductive = [];
GLIMPSE_B_LINES['GL-04']._scene.bold.seductive.push('汗が滴る。血の味がする。でも、まだ立てる');
if (!GLIMPSE_B_LINES['GL-04'].quiet) GLIMPSE_B_LINES['GL-04'].quiet = {};
if (!GLIMPSE_B_LINES['GL-04'].quiet.seductive) GLIMPSE_B_LINES['GL-04'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-04'].quiet.seductive.push('……立つ');
if (!GLIMPSE_B_LINES['GL-04']._scene) GLIMPSE_B_LINES['GL-04']._scene = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.quiet) GLIMPSE_B_LINES['GL-04']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.quiet.seductive) GLIMPSE_B_LINES['GL-04']._scene.quiet.seductive = [];
GLIMPSE_B_LINES['GL-04']._scene.quiet.seductive.push('膝が震える。それでも、倒れない');
if (!GLIMPSE_B_LINES['GL-04'].quiet) GLIMPSE_B_LINES['GL-04'].quiet = {};
if (!GLIMPSE_B_LINES['GL-04'].quiet.polite) GLIMPSE_B_LINES['GL-04'].quiet.polite = [];
GLIMPSE_B_LINES['GL-04'].quiet.polite.push('……まだ、動け、ます……');
if (!GLIMPSE_B_LINES['GL-04']._scene) GLIMPSE_B_LINES['GL-04']._scene = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.quiet) GLIMPSE_B_LINES['GL-04']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.quiet.polite) GLIMPSE_B_LINES['GL-04']._scene.quiet.polite = [];
GLIMPSE_B_LINES['GL-04']._scene.quiet.polite.push('視界が揺れる。歯を食いしばる');
if (!GLIMPSE_B_LINES['GL-04'].earnest) GLIMPSE_B_LINES['GL-04'].earnest = {};
if (!GLIMPSE_B_LINES['GL-04'].earnest.seductive) GLIMPSE_B_LINES['GL-04'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-04'].earnest.seductive.push('……まだ、終わっては、いませんの……');
if (!GLIMPSE_B_LINES['GL-04']._scene) GLIMPSE_B_LINES['GL-04']._scene = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.earnest) GLIMPSE_B_LINES['GL-04']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.earnest.seductive) GLIMPSE_B_LINES['GL-04']._scene.earnest.seductive = [];
GLIMPSE_B_LINES['GL-04']._scene.earnest.seductive.push('痛みの向こうに、意地を見る。ここで折れるわけにはいかない');
if (!GLIMPSE_B_LINES['GL-04'].earnest) GLIMPSE_B_LINES['GL-04'].earnest = {};
if (!GLIMPSE_B_LINES['GL-04'].earnest.ojousama) GLIMPSE_B_LINES['GL-04'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-04'].earnest.ojousama.push('……わたくし、まだ……立てますわ……');
if (!GLIMPSE_B_LINES['GL-04']._scene) GLIMPSE_B_LINES['GL-04']._scene = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.earnest) GLIMPSE_B_LINES['GL-04']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-04']._scene.earnest.ojousama) GLIMPSE_B_LINES['GL-04']._scene.earnest.ojousama = [];
GLIMPSE_B_LINES['GL-04']._scene.earnest.ojousama.push('息を吐く。崩れそうな体を、誇りだけが支えている');
if (!GLIMPSE_B_LINES['GL-05'].normal) GLIMPSE_B_LINES['GL-05'].normal = {};
if (!GLIMPSE_B_LINES['GL-05'].normal.polite) GLIMPSE_B_LINES['GL-05'].normal.polite = [];
GLIMPSE_B_LINES['GL-05'].normal.polite.push('……いけます、行きますよ');
if (!GLIMPSE_B_LINES['GL-05']._scene) GLIMPSE_B_LINES['GL-05']._scene = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.normal) GLIMPSE_B_LINES['GL-05']._scene.normal = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.normal.polite) GLIMPSE_B_LINES['GL-05']._scene.normal.polite = [];
GLIMPSE_B_LINES['GL-05']._scene.normal.polite.push('身体が軽い。流れが、こちらに来た');
if (!GLIMPSE_B_LINES['GL-05'].bold) GLIMPSE_B_LINES['GL-05'].bold = {};
if (!GLIMPSE_B_LINES['GL-05'].bold.polite) GLIMPSE_B_LINES['GL-05'].bold.polite = [];
GLIMPSE_B_LINES['GL-05'].bold.polite.push('はは……!きた、きたきた!');
if (!GLIMPSE_B_LINES['GL-05']._scene) GLIMPSE_B_LINES['GL-05']._scene = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.bold) GLIMPSE_B_LINES['GL-05']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.bold.polite) GLIMPSE_B_LINES['GL-05']._scene.bold.polite = [];
GLIMPSE_B_LINES['GL-05']._scene.bold.polite.push('口元に笑みが浮かぶ。流れを掴んだ、確信がある');
if (!GLIMPSE_B_LINES['GL-05'].bold) GLIMPSE_B_LINES['GL-05'].bold = {};
if (!GLIMPSE_B_LINES['GL-05'].bold.seductive) GLIMPSE_B_LINES['GL-05'].bold.seductive = [];
GLIMPSE_B_LINES['GL-05'].bold.seductive.push('ふふ……堕ちなさい');
if (!GLIMPSE_B_LINES['GL-05']._scene) GLIMPSE_B_LINES['GL-05']._scene = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.bold) GLIMPSE_B_LINES['GL-05']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.bold.seductive) GLIMPSE_B_LINES['GL-05']._scene.bold.seductive = [];
GLIMPSE_B_LINES['GL-05']._scene.bold.seductive.push('流れが変わる瞬間の、甘美な感覚');
if (!GLIMPSE_B_LINES['GL-05'].quiet) GLIMPSE_B_LINES['GL-05'].quiet = {};
if (!GLIMPSE_B_LINES['GL-05'].quiet.seductive) GLIMPSE_B_LINES['GL-05'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-05'].quiet.seductive.push('……もらった');
if (!GLIMPSE_B_LINES['GL-05']._scene) GLIMPSE_B_LINES['GL-05']._scene = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.quiet) GLIMPSE_B_LINES['GL-05']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.quiet.seductive) GLIMPSE_B_LINES['GL-05']._scene.quiet.seductive = [];
GLIMPSE_B_LINES['GL-05']._scene.quiet.seductive.push('静かに、しかし確実に、主導権を握る');
if (!GLIMPSE_B_LINES['GL-05'].quiet) GLIMPSE_B_LINES['GL-05'].quiet = {};
if (!GLIMPSE_B_LINES['GL-05'].quiet.polite) GLIMPSE_B_LINES['GL-05'].quiet.polite = [];
GLIMPSE_B_LINES['GL-05'].quiet.polite.push('……ここから、です');
if (!GLIMPSE_B_LINES['GL-05']._scene) GLIMPSE_B_LINES['GL-05']._scene = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.quiet) GLIMPSE_B_LINES['GL-05']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.quiet.polite) GLIMPSE_B_LINES['GL-05']._scene.quiet.polite = [];
GLIMPSE_B_LINES['GL-05']._scene.quiet.polite.push('呼吸が合ってきた。ここから、詰めに入る');
if (!GLIMPSE_B_LINES['GL-05'].earnest) GLIMPSE_B_LINES['GL-05'].earnest = {};
if (!GLIMPSE_B_LINES['GL-05'].earnest.seductive) GLIMPSE_B_LINES['GL-05'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-05'].earnest.seductive.push('ふ……ここから、行きますわよ');
if (!GLIMPSE_B_LINES['GL-05']._scene) GLIMPSE_B_LINES['GL-05']._scene = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.earnest) GLIMPSE_B_LINES['GL-05']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.earnest.seductive) GLIMPSE_B_LINES['GL-05']._scene.earnest.seductive = [];
GLIMPSE_B_LINES['GL-05']._scene.earnest.seductive.push('流れを読み切った。ここが、勝負所だ');
if (!GLIMPSE_B_LINES['GL-05'].earnest) GLIMPSE_B_LINES['GL-05'].earnest = {};
if (!GLIMPSE_B_LINES['GL-05'].earnest.ojousama) GLIMPSE_B_LINES['GL-05'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-05'].earnest.ojousama.push('……参りますわ!');
if (!GLIMPSE_B_LINES['GL-05']._scene) GLIMPSE_B_LINES['GL-05']._scene = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.earnest) GLIMPSE_B_LINES['GL-05']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-05']._scene.earnest.ojousama) GLIMPSE_B_LINES['GL-05']._scene.earnest.ojousama = [];
GLIMPSE_B_LINES['GL-05']._scene.earnest.ojousama.push('好機。躊躇わず、踏み込む');
if (!GLIMPSE_B_LINES['GL-06'].normal) GLIMPSE_B_LINES['GL-06'].normal = {};
if (!GLIMPSE_B_LINES['GL-06'].normal.polite) GLIMPSE_B_LINES['GL-06'].normal.polite = [];
GLIMPSE_B_LINES['GL-06'].normal.polite.push('……決まった');
if (!GLIMPSE_B_LINES['GL-06']._scene) GLIMPSE_B_LINES['GL-06']._scene = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.normal) GLIMPSE_B_LINES['GL-06']._scene.normal = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.normal.polite) GLIMPSE_B_LINES['GL-06']._scene.normal.polite = [];
GLIMPSE_B_LINES['GL-06']._scene.normal.polite.push('完璧に入った。手応えが、腕に残る');
if (!GLIMPSE_B_LINES['GL-06'].bold) GLIMPSE_B_LINES['GL-06'].bold = {};
if (!GLIMPSE_B_LINES['GL-06'].bold.polite) GLIMPSE_B_LINES['GL-06'].bold.polite = [];
GLIMPSE_B_LINES['GL-06'].bold.polite.push('よっしゃ!入った、入った!');
if (!GLIMPSE_B_LINES['GL-06']._scene) GLIMPSE_B_LINES['GL-06']._scene = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.bold) GLIMPSE_B_LINES['GL-06']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.bold.polite) GLIMPSE_B_LINES['GL-06']._scene.bold.polite = [];
GLIMPSE_B_LINES['GL-06']._scene.bold.polite.push('会心の一撃。拳を握る');
if (!GLIMPSE_B_LINES['GL-06'].bold) GLIMPSE_B_LINES['GL-06'].bold = {};
if (!GLIMPSE_B_LINES['GL-06'].bold.seductive) GLIMPSE_B_LINES['GL-06'].bold.seductive = [];
GLIMPSE_B_LINES['GL-06'].bold.seductive.push('ふ……きれいに、決まったわ');
if (!GLIMPSE_B_LINES['GL-06']._scene) GLIMPSE_B_LINES['GL-06']._scene = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.bold) GLIMPSE_B_LINES['GL-06']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.bold.seductive) GLIMPSE_B_LINES['GL-06']._scene.bold.seductive = [];
GLIMPSE_B_LINES['GL-06']._scene.bold.seductive.push('相手が崩れ落ちる。美しい、と思った');
if (!GLIMPSE_B_LINES['GL-06'].quiet) GLIMPSE_B_LINES['GL-06'].quiet = {};
if (!GLIMPSE_B_LINES['GL-06'].quiet.seductive) GLIMPSE_B_LINES['GL-06'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-06'].quiet.seductive.push('……');
if (!GLIMPSE_B_LINES['GL-06']._scene) GLIMPSE_B_LINES['GL-06']._scene = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.quiet) GLIMPSE_B_LINES['GL-06']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.quiet.seductive) GLIMPSE_B_LINES['GL-06']._scene.quiet.seductive = [];
GLIMPSE_B_LINES['GL-06']._scene.quiet.seductive.push('沈黙。技の余韻だけが、リングに残る');
if (!GLIMPSE_B_LINES['GL-06'].quiet) GLIMPSE_B_LINES['GL-06'].quiet = {};
if (!GLIMPSE_B_LINES['GL-06'].quiet.polite) GLIMPSE_B_LINES['GL-06'].quiet.polite = [];
GLIMPSE_B_LINES['GL-06'].quiet.polite.push('……捉えました');
if (!GLIMPSE_B_LINES['GL-06']._scene) GLIMPSE_B_LINES['GL-06']._scene = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.quiet) GLIMPSE_B_LINES['GL-06']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.quiet.polite) GLIMPSE_B_LINES['GL-06']._scene.quiet.polite = [];
GLIMPSE_B_LINES['GL-06']._scene.quiet.polite.push('技は決まった。残るは、詰めの一手');
if (!GLIMPSE_B_LINES['GL-06'].earnest) GLIMPSE_B_LINES['GL-06'].earnest = {};
if (!GLIMPSE_B_LINES['GL-06'].earnest.seductive) GLIMPSE_B_LINES['GL-06'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-06'].earnest.seductive.push('……入り、ましたわ');
if (!GLIMPSE_B_LINES['GL-06']._scene) GLIMPSE_B_LINES['GL-06']._scene = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.earnest) GLIMPSE_B_LINES['GL-06']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.earnest.seductive) GLIMPSE_B_LINES['GL-06']._scene.earnest.seductive = [];
GLIMPSE_B_LINES['GL-06']._scene.earnest.seductive.push('祈るように、技を放った。報われた');
if (!GLIMPSE_B_LINES['GL-06'].earnest) GLIMPSE_B_LINES['GL-06'].earnest = {};
if (!GLIMPSE_B_LINES['GL-06'].earnest.ojousama) GLIMPSE_B_LINES['GL-06'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-06'].earnest.ojousama.push('……お見事な、受け身ですわね');
if (!GLIMPSE_B_LINES['GL-06']._scene) GLIMPSE_B_LINES['GL-06']._scene = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.earnest) GLIMPSE_B_LINES['GL-06']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-06']._scene.earnest.ojousama) GLIMPSE_B_LINES['GL-06']._scene.earnest.ojousama = [];
GLIMPSE_B_LINES['GL-06']._scene.earnest.ojousama.push('一心に放った一撃。相手への敬意を込めて');
if (!GLIMPSE_B_LINES['GL-07'].normal) GLIMPSE_B_LINES['GL-07'].normal = {};
if (!GLIMPSE_B_LINES['GL-07'].normal.polite) GLIMPSE_B_LINES['GL-07'].normal.polite = [];
GLIMPSE_B_LINES['GL-07'].normal.polite.push('……っ、まだ、です……');
if (!GLIMPSE_B_LINES['GL-07']._scene) GLIMPSE_B_LINES['GL-07']._scene = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.normal) GLIMPSE_B_LINES['GL-07']._scene.normal = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.normal.polite) GLIMPSE_B_LINES['GL-07']._scene.normal.polite = [];
GLIMPSE_B_LINES['GL-07']._scene.normal.polite.push('視界が真っ白になる。痛みが、遅れてやって来る');
if (!GLIMPSE_B_LINES['GL-07'].bold) GLIMPSE_B_LINES['GL-07'].bold = {};
if (!GLIMPSE_B_LINES['GL-07'].bold.polite) GLIMPSE_B_LINES['GL-07'].bold.polite = [];
GLIMPSE_B_LINES['GL-07'].bold.polite.push('こんの……っ、まだやれる!');
if (!GLIMPSE_B_LINES['GL-07']._scene) GLIMPSE_B_LINES['GL-07']._scene = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.bold) GLIMPSE_B_LINES['GL-07']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.bold.polite) GLIMPSE_B_LINES['GL-07']._scene.bold.polite = [];
GLIMPSE_B_LINES['GL-07']._scene.bold.polite.push('衝撃。膝が崩れる。くそ、立て、立て');
if (!GLIMPSE_B_LINES['GL-07'].bold) GLIMPSE_B_LINES['GL-07'].bold = {};
if (!GLIMPSE_B_LINES['GL-07'].bold.seductive) GLIMPSE_B_LINES['GL-07'].bold.seductive = [];
GLIMPSE_B_LINES['GL-07'].bold.seductive.push('ふふ……効いた、じゃない……');
if (!GLIMPSE_B_LINES['GL-07']._scene) GLIMPSE_B_LINES['GL-07']._scene = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.bold) GLIMPSE_B_LINES['GL-07']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.bold.seductive) GLIMPSE_B_LINES['GL-07']._scene.bold.seductive = [];
GLIMPSE_B_LINES['GL-07']._scene.bold.seductive.push('身体が跳ね飛ばされる。痛みすら、どこか遠い');
if (!GLIMPSE_B_LINES['GL-07'].quiet) GLIMPSE_B_LINES['GL-07'].quiet = {};
if (!GLIMPSE_B_LINES['GL-07'].quiet.seductive) GLIMPSE_B_LINES['GL-07'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-07'].quiet.seductive.push('……まだ');
if (!GLIMPSE_B_LINES['GL-07']._scene) GLIMPSE_B_LINES['GL-07']._scene = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.quiet) GLIMPSE_B_LINES['GL-07']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.quiet.seductive) GLIMPSE_B_LINES['GL-07']._scene.quiet.seductive = [];
GLIMPSE_B_LINES['GL-07']._scene.quiet.seductive.push('天井。白い。動けない');
if (!GLIMPSE_B_LINES['GL-07'].quiet) GLIMPSE_B_LINES['GL-07'].quiet = {};
if (!GLIMPSE_B_LINES['GL-07'].quiet.polite) GLIMPSE_B_LINES['GL-07'].quiet.polite = [];
GLIMPSE_B_LINES['GL-07'].quiet.polite.push('……まだ、倒れません');
if (!GLIMPSE_B_LINES['GL-07']._scene) GLIMPSE_B_LINES['GL-07']._scene = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.quiet) GLIMPSE_B_LINES['GL-07']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.quiet.polite) GLIMPSE_B_LINES['GL-07']._scene.quiet.polite = [];
GLIMPSE_B_LINES['GL-07']._scene.quiet.polite.push('痛みが全身を貫く。それでも、意識は手放さない');
if (!GLIMPSE_B_LINES['GL-07'].earnest) GLIMPSE_B_LINES['GL-07'].earnest = {};
if (!GLIMPSE_B_LINES['GL-07'].earnest.seductive) GLIMPSE_B_LINES['GL-07'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-07'].earnest.seductive.push('……まだ、わたくし、立ちますわ……っ');
if (!GLIMPSE_B_LINES['GL-07']._scene) GLIMPSE_B_LINES['GL-07']._scene = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.earnest) GLIMPSE_B_LINES['GL-07']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.earnest.seductive) GLIMPSE_B_LINES['GL-07']._scene.earnest.seductive = [];
GLIMPSE_B_LINES['GL-07']._scene.earnest.seductive.push('強烈な一撃。けれど、これで終わる訳にはいかない');
if (!GLIMPSE_B_LINES['GL-07'].earnest) GLIMPSE_B_LINES['GL-07'].earnest = {};
if (!GLIMPSE_B_LINES['GL-07'].earnest.ojousama) GLIMPSE_B_LINES['GL-07'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-07'].earnest.ojousama.push('……この程度で、終わりませんわ……っ');
if (!GLIMPSE_B_LINES['GL-07']._scene) GLIMPSE_B_LINES['GL-07']._scene = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.earnest) GLIMPSE_B_LINES['GL-07']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-07']._scene.earnest.ojousama) GLIMPSE_B_LINES['GL-07']._scene.earnest.ojousama = [];
GLIMPSE_B_LINES['GL-07']._scene.earnest.ojousama.push('視界が霞む。誇りだけを頼りに、立ち上がろうとする');
if (!GLIMPSE_B_LINES['GL-08'].normal) GLIMPSE_B_LINES['GL-08'].normal = {};
if (!GLIMPSE_B_LINES['GL-08'].normal.polite) GLIMPSE_B_LINES['GL-08'].normal.polite = [];
GLIMPSE_B_LINES['GL-08'].normal.polite.push('……聞こえます、皆さんの声');
if (!GLIMPSE_B_LINES['GL-08']._scene) GLIMPSE_B_LINES['GL-08']._scene = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.normal) GLIMPSE_B_LINES['GL-08']._scene.normal = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.normal.polite) GLIMPSE_B_LINES['GL-08']._scene.normal.polite = [];
GLIMPSE_B_LINES['GL-08']._scene.normal.polite.push('観客の声が、耳の奥に届く。ああ、見てくれている');
if (!GLIMPSE_B_LINES['GL-08'].bold) GLIMPSE_B_LINES['GL-08'].bold = {};
if (!GLIMPSE_B_LINES['GL-08'].bold.polite) GLIMPSE_B_LINES['GL-08'].bold.polite = [];
GLIMPSE_B_LINES['GL-08'].bold.polite.push('聞こえてるよ!ありがとう!!');
if (!GLIMPSE_B_LINES['GL-08']._scene) GLIMPSE_B_LINES['GL-08']._scene = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.bold) GLIMPSE_B_LINES['GL-08']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.bold.polite) GLIMPSE_B_LINES['GL-08']._scene.bold.polite = [];
GLIMPSE_B_LINES['GL-08']._scene.bold.polite.push('歓声が全身を震わせる。これが、わたしを動かす');
if (!GLIMPSE_B_LINES['GL-08'].bold) GLIMPSE_B_LINES['GL-08'].bold = {};
if (!GLIMPSE_B_LINES['GL-08'].bold.seductive) GLIMPSE_B_LINES['GL-08'].bold.seductive = [];
GLIMPSE_B_LINES['GL-08'].bold.seductive.push('ふふ……もっと、声を聞かせて');
if (!GLIMPSE_B_LINES['GL-08']._scene) GLIMPSE_B_LINES['GL-08']._scene = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.bold) GLIMPSE_B_LINES['GL-08']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.bold.seductive) GLIMPSE_B_LINES['GL-08']._scene.bold.seductive = [];
GLIMPSE_B_LINES['GL-08']._scene.bold.seductive.push('歓声の波に、身を委ねる。最高の瞬間');
if (!GLIMPSE_B_LINES['GL-08'].quiet) GLIMPSE_B_LINES['GL-08'].quiet = {};
if (!GLIMPSE_B_LINES['GL-08'].quiet.seductive) GLIMPSE_B_LINES['GL-08'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-08'].quiet.seductive.push('……聞こえてる');
if (!GLIMPSE_B_LINES['GL-08']._scene) GLIMPSE_B_LINES['GL-08']._scene = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.quiet) GLIMPSE_B_LINES['GL-08']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.quiet.seductive) GLIMPSE_B_LINES['GL-08']._scene.quiet.seductive = [];
GLIMPSE_B_LINES['GL-08']._scene.quiet.seductive.push('歓声。遠くで、確かに、届いている');
if (!GLIMPSE_B_LINES['GL-08'].quiet) GLIMPSE_B_LINES['GL-08'].quiet = {};
if (!GLIMPSE_B_LINES['GL-08'].quiet.polite) GLIMPSE_B_LINES['GL-08'].quiet.polite = [];
GLIMPSE_B_LINES['GL-08'].quiet.polite.push('……ありがとうございます');
if (!GLIMPSE_B_LINES['GL-08']._scene) GLIMPSE_B_LINES['GL-08']._scene = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.quiet) GLIMPSE_B_LINES['GL-08']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.quiet.polite) GLIMPSE_B_LINES['GL-08']._scene.quiet.polite = [];
GLIMPSE_B_LINES['GL-08']._scene.quiet.polite.push('観客の声が、力に変わる。深く、頭を下げたくなる');
if (!GLIMPSE_B_LINES['GL-08'].earnest) GLIMPSE_B_LINES['GL-08'].earnest = {};
if (!GLIMPSE_B_LINES['GL-08'].earnest.seductive) GLIMPSE_B_LINES['GL-08'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-08'].earnest.seductive.push('……届きましたわ、皆様の声');
if (!GLIMPSE_B_LINES['GL-08']._scene) GLIMPSE_B_LINES['GL-08']._scene = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.earnest) GLIMPSE_B_LINES['GL-08']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.earnest.seductive) GLIMPSE_B_LINES['GL-08']._scene.earnest.seductive = [];
GLIMPSE_B_LINES['GL-08']._scene.earnest.seductive.push('声援が胸に染みる。応えなければ、と心から思う');
if (!GLIMPSE_B_LINES['GL-08'].earnest) GLIMPSE_B_LINES['GL-08'].earnest = {};
if (!GLIMPSE_B_LINES['GL-08'].earnest.ojousama) GLIMPSE_B_LINES['GL-08'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-08'].earnest.ojousama.push('……感謝いたしますわ、皆様');
if (!GLIMPSE_B_LINES['GL-08']._scene) GLIMPSE_B_LINES['GL-08']._scene = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.earnest) GLIMPSE_B_LINES['GL-08']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-08']._scene.earnest.ojousama) GLIMPSE_B_LINES['GL-08']._scene.earnest.ojousama = [];
GLIMPSE_B_LINES['GL-08']._scene.earnest.ojousama.push('観客への感謝を、背筋で表す');
if (!GLIMPSE_B_LINES['GL-09'].normal) GLIMPSE_B_LINES['GL-09'].normal = {};
if (!GLIMPSE_B_LINES['GL-09'].normal.polite) GLIMPSE_B_LINES['GL-09'].normal.polite = [];
GLIMPSE_B_LINES['GL-09'].normal.polite.push('……あなた、本当に強いです');
if (!GLIMPSE_B_LINES['GL-09']._scene) GLIMPSE_B_LINES['GL-09']._scene = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.normal) GLIMPSE_B_LINES['GL-09']._scene.normal = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.normal.polite) GLIMPSE_B_LINES['GL-09']._scene.normal.polite = [];
GLIMPSE_B_LINES['GL-09']._scene.normal.polite.push('相手の目を見る。強い、この人は強い');
if (!GLIMPSE_B_LINES['GL-09'].bold) GLIMPSE_B_LINES['GL-09'].bold = {};
if (!GLIMPSE_B_LINES['GL-09'].bold.polite) GLIMPSE_B_LINES['GL-09'].bold.polite = [];
GLIMPSE_B_LINES['GL-09'].bold.polite.push('ふ……いい相手だ、燃えるぜ!');
if (!GLIMPSE_B_LINES['GL-09']._scene) GLIMPSE_B_LINES['GL-09']._scene = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.bold) GLIMPSE_B_LINES['GL-09']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.bold.polite) GLIMPSE_B_LINES['GL-09']._scene.bold.polite = [];
GLIMPSE_B_LINES['GL-09']._scene.bold.polite.push('睨み合う。闘志が、火花のように散る');
if (!GLIMPSE_B_LINES['GL-09'].bold) GLIMPSE_B_LINES['GL-09'].bold = {};
if (!GLIMPSE_B_LINES['GL-09'].bold.seductive) GLIMPSE_B_LINES['GL-09'].bold.seductive = [];
GLIMPSE_B_LINES['GL-09'].bold.seductive.push('ふふ……いい目、してるじゃない');
if (!GLIMPSE_B_LINES['GL-09']._scene) GLIMPSE_B_LINES['GL-09']._scene = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.bold) GLIMPSE_B_LINES['GL-09']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.bold.seductive) GLIMPSE_B_LINES['GL-09']._scene.bold.seductive = [];
GLIMPSE_B_LINES['GL-09']._scene.bold.seductive.push('相手の瞳を覗き込む。そこに、炎を見る');
if (!GLIMPSE_B_LINES['GL-09'].quiet) GLIMPSE_B_LINES['GL-09'].quiet = {};
if (!GLIMPSE_B_LINES['GL-09'].quiet.seductive) GLIMPSE_B_LINES['GL-09'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-09'].quiet.seductive.push('……やろう');
if (!GLIMPSE_B_LINES['GL-09']._scene) GLIMPSE_B_LINES['GL-09']._scene = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.quiet) GLIMPSE_B_LINES['GL-09']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.quiet.seductive) GLIMPSE_B_LINES['GL-09']._scene.quiet.seductive = [];
GLIMPSE_B_LINES['GL-09']._scene.quiet.seductive.push('見つめ合う。言葉はいらない');
if (!GLIMPSE_B_LINES['GL-09'].quiet) GLIMPSE_B_LINES['GL-09'].quiet = {};
if (!GLIMPSE_B_LINES['GL-09'].quiet.polite) GLIMPSE_B_LINES['GL-09'].quiet.polite = [];
GLIMPSE_B_LINES['GL-09'].quiet.polite.push('……全力で、お相手します');
if (!GLIMPSE_B_LINES['GL-09']._scene) GLIMPSE_B_LINES['GL-09']._scene = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.quiet) GLIMPSE_B_LINES['GL-09']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.quiet.polite) GLIMPSE_B_LINES['GL-09']._scene.quiet.polite = [];
GLIMPSE_B_LINES['GL-09']._scene.quiet.polite.push('相手を、正面から見据える');
if (!GLIMPSE_B_LINES['GL-09'].earnest) GLIMPSE_B_LINES['GL-09'].earnest = {};
if (!GLIMPSE_B_LINES['GL-09'].earnest.seductive) GLIMPSE_B_LINES['GL-09'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-09'].earnest.seductive.push('ふ……貴女となら、良い試合になりそうね');
if (!GLIMPSE_B_LINES['GL-09']._scene) GLIMPSE_B_LINES['GL-09']._scene = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.earnest) GLIMPSE_B_LINES['GL-09']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.earnest.seductive) GLIMPSE_B_LINES['GL-09']._scene.earnest.seductive = [];
GLIMPSE_B_LINES['GL-09']._scene.earnest.seductive.push('相手の実力に、敬意を抱く。だからこそ、全力で');
if (!GLIMPSE_B_LINES['GL-09'].earnest) GLIMPSE_B_LINES['GL-09'].earnest = {};
if (!GLIMPSE_B_LINES['GL-09'].earnest.ojousama) GLIMPSE_B_LINES['GL-09'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-09'].earnest.ojousama.push('……よろしくお願いいたしますわ');
if (!GLIMPSE_B_LINES['GL-09']._scene) GLIMPSE_B_LINES['GL-09']._scene = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.earnest) GLIMPSE_B_LINES['GL-09']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-09']._scene.earnest.ojousama) GLIMPSE_B_LINES['GL-09']._scene.earnest.ojousama = [];
GLIMPSE_B_LINES['GL-09']._scene.earnest.ojousama.push('深く、会釈を返す。戦士としての礼儀を尽くして');
if (!GLIMPSE_B_LINES['GL-10'].normal) GLIMPSE_B_LINES['GL-10'].normal = {};
if (!GLIMPSE_B_LINES['GL-10'].normal.polite) GLIMPSE_B_LINES['GL-10'].normal.polite = [];
GLIMPSE_B_LINES['GL-10'].normal.polite.push('……これで、終わりにします');
if (!GLIMPSE_B_LINES['GL-10']._scene) GLIMPSE_B_LINES['GL-10']._scene = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.normal) GLIMPSE_B_LINES['GL-10']._scene.normal = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.normal.polite) GLIMPSE_B_LINES['GL-10']._scene.normal.polite = [];
GLIMPSE_B_LINES['GL-10']._scene.normal.polite.push('すべてを、この一撃に');
if (!GLIMPSE_B_LINES['GL-10'].bold) GLIMPSE_B_LINES['GL-10'].bold = {};
if (!GLIMPSE_B_LINES['GL-10'].bold.polite) GLIMPSE_B_LINES['GL-10'].bold.polite = [];
GLIMPSE_B_LINES['GL-10'].bold.polite.push('ここで決める!!');
if (!GLIMPSE_B_LINES['GL-10']._scene) GLIMPSE_B_LINES['GL-10']._scene = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.bold) GLIMPSE_B_LINES['GL-10']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.bold.polite) GLIMPSE_B_LINES['GL-10']._scene.bold.polite = [];
GLIMPSE_B_LINES['GL-10']._scene.bold.polite.push('最後の瞬間。迷いは、ない');
if (!GLIMPSE_B_LINES['GL-10'].bold) GLIMPSE_B_LINES['GL-10'].bold = {};
if (!GLIMPSE_B_LINES['GL-10'].bold.seductive) GLIMPSE_B_LINES['GL-10'].bold.seductive = [];
GLIMPSE_B_LINES['GL-10'].bold.seductive.push('ふふ……さよなら、ね');
if (!GLIMPSE_B_LINES['GL-10']._scene) GLIMPSE_B_LINES['GL-10']._scene = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.bold) GLIMPSE_B_LINES['GL-10']._scene.bold = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.bold.seductive) GLIMPSE_B_LINES['GL-10']._scene.bold.seductive = [];
GLIMPSE_B_LINES['GL-10']._scene.bold.seductive.push('終わりの気配。美しく、締めくくる');
if (!GLIMPSE_B_LINES['GL-10'].quiet) GLIMPSE_B_LINES['GL-10'].quiet = {};
if (!GLIMPSE_B_LINES['GL-10'].quiet.seductive) GLIMPSE_B_LINES['GL-10'].quiet.seductive = [];
GLIMPSE_B_LINES['GL-10'].quiet.seductive.push('……終わり');
if (!GLIMPSE_B_LINES['GL-10']._scene) GLIMPSE_B_LINES['GL-10']._scene = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.quiet) GLIMPSE_B_LINES['GL-10']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.quiet.seductive) GLIMPSE_B_LINES['GL-10']._scene.quiet.seductive = [];
GLIMPSE_B_LINES['GL-10']._scene.quiet.seductive.push('終わり。静かに、終わる');
if (!GLIMPSE_B_LINES['GL-10'].quiet) GLIMPSE_B_LINES['GL-10'].quiet = {};
if (!GLIMPSE_B_LINES['GL-10'].quiet.polite) GLIMPSE_B_LINES['GL-10'].quiet.polite = [];
GLIMPSE_B_LINES['GL-10'].quiet.polite.push('……これで、決まります');
if (!GLIMPSE_B_LINES['GL-10']._scene) GLIMPSE_B_LINES['GL-10']._scene = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.quiet) GLIMPSE_B_LINES['GL-10']._scene.quiet = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.quiet.polite) GLIMPSE_B_LINES['GL-10']._scene.quiet.polite = [];
GLIMPSE_B_LINES['GL-10']._scene.quiet.polite.push('最後の一撃を放つ。すべてを込めて');
if (!GLIMPSE_B_LINES['GL-10'].earnest) GLIMPSE_B_LINES['GL-10'].earnest = {};
if (!GLIMPSE_B_LINES['GL-10'].earnest.seductive) GLIMPSE_B_LINES['GL-10'].earnest.seductive = [];
GLIMPSE_B_LINES['GL-10'].earnest.seductive.push('……これで、終わりにいたしますわ');
if (!GLIMPSE_B_LINES['GL-10']._scene) GLIMPSE_B_LINES['GL-10']._scene = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.earnest) GLIMPSE_B_LINES['GL-10']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.earnest.seductive) GLIMPSE_B_LINES['GL-10']._scene.earnest.seductive = [];
GLIMPSE_B_LINES['GL-10']._scene.earnest.seductive.push('この一撃に、魂を込める');
if (!GLIMPSE_B_LINES['GL-10'].earnest) GLIMPSE_B_LINES['GL-10'].earnest = {};
if (!GLIMPSE_B_LINES['GL-10'].earnest.ojousama) GLIMPSE_B_LINES['GL-10'].earnest.ojousama = [];
GLIMPSE_B_LINES['GL-10'].earnest.ojousama.push('……ごきげんよう、ですわ');
if (!GLIMPSE_B_LINES['GL-10']._scene) GLIMPSE_B_LINES['GL-10']._scene = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.earnest) GLIMPSE_B_LINES['GL-10']._scene.earnest = {};
if (!GLIMPSE_B_LINES['GL-10']._scene.earnest.ojousama) GLIMPSE_B_LINES['GL-10']._scene.earnest.ojousama = [];
GLIMPSE_B_LINES['GL-10']._scene.earnest.ojousama.push('すべての想いを乗せて、最後の技を放つ');

// ── SNAPSHOT_TEXTS 拡張 (voice + scene deduped) ──
if (!SNAPSHOT_TEXTS.G1.scene) SNAPSHOT_TEXTS.G1.scene = [];
SNAPSHOT_TEXTS.G1.scene.push('給与明細をじっと見つめる。この数字では、報われた気がしなかった');
if (!SNAPSHOT_TEXTS.G2.scene) SNAPSHOT_TEXTS.G2.scene = [];
SNAPSHOT_TEXTS.G2.scene.push('更衣室の片隅。誰もいなくなった後も、しばらく動けずにいた');
if (!SNAPSHOT_TEXTS.G3.scene) SNAPSHOT_TEXTS.G3.scene = [];
SNAPSHOT_TEXTS.G3.scene.push('張り出されたカード表を見る。自分の名前は、どこにもなかった');
if (!SNAPSHOT_TEXTS.G4.scene) SNAPSHOT_TEXTS.G4.scene = [];
SNAPSHOT_TEXTS.G4.scene.push('空いた練習場で、一人シャドーを続ける。誰も、見ていなかった');
if (!SNAPSHOT_TEXTS.R2.scene) SNAPSHOT_TEXTS.R2.scene = [];
SNAPSHOT_TEXTS.R2.scene.push('みんなが輪になって笑っている。その輪に、自分の居場所はなかった');
if (!SNAPSHOT_TEXTS.R4.scene) SNAPSHOT_TEXTS.R4.scene = [];
SNAPSHOT_TEXTS.R4.scene.push('廊下で、かつての仲間とすれ違う。目は、合わなかった');
if (!SNAPSHOT_TEXTS.R5.scene) SNAPSHOT_TEXTS.R5.scene = [];
SNAPSHOT_TEXTS.R5.scene.push('信じていた人の嘘を、知ってしまった。胸の奥が、冷たくなる');
if (!SNAPSHOT_TEXTS.breakthrough.scene) SNAPSHOT_TEXTS.breakthrough.scene = [];
SNAPSHOT_TEXTS.breakthrough.scene.push('練習後、鏡に映る自分を見た。何かが、変わっていた');
if (!SNAPSHOT_TEXTS.warVictory.scene) SNAPSHOT_TEXTS.warVictory.scene = [];
SNAPSHOT_TEXTS.warVictory.scene.push('対抗戦を制した夜。リングの上で、旗を掲げる');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.normal) SNAPSHOT_TEXTS.G1.voice.normal = {};
if (!SNAPSHOT_TEXTS.G1.voice.normal.polite) SNAPSHOT_TEXTS.G1.voice.normal.polite = [];
SNAPSHOT_TEXTS.G1.voice.normal.polite.push('……これで、いいんでしょうか。納得、できません');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.normal) SNAPSHOT_TEXTS.G1.voice.normal = {};
if (!SNAPSHOT_TEXTS.G1.voice.normal.cool) SNAPSHOT_TEXTS.G1.voice.normal.cool = [];
SNAPSHOT_TEXTS.G1.voice.normal.cool.push('……足りない');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.normal) SNAPSHOT_TEXTS.G1.voice.normal = {};
if (!SNAPSHOT_TEXTS.G1.voice.normal.seductive) SNAPSHOT_TEXTS.G1.voice.normal.seductive = [];
SNAPSHOT_TEXTS.G1.voice.normal.seductive.push('ふふ……わたしの値段、これっぽっち?');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.bold) SNAPSHOT_TEXTS.G1.voice.bold = {};
if (!SNAPSHOT_TEXTS.G1.voice.bold.polite) SNAPSHOT_TEXTS.G1.voice.bold.polite = [];
SNAPSHOT_TEXTS.G1.voice.bold.polite.push('こんな額じゃ納得できません……!わたし、こんなもんじゃないですよ!');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.bold) SNAPSHOT_TEXTS.G1.voice.bold = {};
if (!SNAPSHOT_TEXTS.G1.voice.bold.seductive) SNAPSHOT_TEXTS.G1.voice.bold.seductive = [];
SNAPSHOT_TEXTS.G1.voice.bold.seductive.push('ふ……舐められたものね');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.quiet) SNAPSHOT_TEXTS.G1.voice.quiet = {};
if (!SNAPSHOT_TEXTS.G1.voice.quiet.polite) SNAPSHOT_TEXTS.G1.voice.quiet.polite = [];
SNAPSHOT_TEXTS.G1.voice.quiet.polite.push('……少ない、です');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.quiet) SNAPSHOT_TEXTS.G1.voice.quiet = {};
if (!SNAPSHOT_TEXTS.G1.voice.quiet.seductive) SNAPSHOT_TEXTS.G1.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.G1.voice.quiet.seductive.push('……ふふ、これだけ?');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.earnest) SNAPSHOT_TEXTS.G1.voice.earnest = {};
if (!SNAPSHOT_TEXTS.G1.voice.earnest.seductive) SNAPSHOT_TEXTS.G1.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.G1.voice.earnest.seductive.push('わたくしの努力、これで済まされるのかしら……');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.earnest) SNAPSHOT_TEXTS.G1.voice.earnest = {};
if (!SNAPSHOT_TEXTS.G1.voice.earnest.ojousama) SNAPSHOT_TEXTS.G1.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.G1.voice.earnest.ojousama.push('まあ……わたくし、こんなはした金で働いておりますのね');
if (!SNAPSHOT_TEXTS.G1.voice) SNAPSHOT_TEXTS.G1.voice = {};
if (!SNAPSHOT_TEXTS.G1.voice.emotional) SNAPSHOT_TEXTS.G1.voice.emotional = {};
if (!SNAPSHOT_TEXTS.G1.voice.emotional.composed) SNAPSHOT_TEXTS.G1.voice.emotional.composed = [];
SNAPSHOT_TEXTS.G1.voice.emotional.composed.push('ひどい、ひどいよ!わたしこんなに頑張ってるのに!');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.normal) SNAPSHOT_TEXTS.G2.voice.normal = {};
if (!SNAPSHOT_TEXTS.G2.voice.normal.polite) SNAPSHOT_TEXTS.G2.voice.normal.polite = [];
SNAPSHOT_TEXTS.G2.voice.normal.polite.push('……別に、平気ですから');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.normal) SNAPSHOT_TEXTS.G2.voice.normal = {};
if (!SNAPSHOT_TEXTS.G2.voice.normal.cool) SNAPSHOT_TEXTS.G2.voice.normal.cool = [];
SNAPSHOT_TEXTS.G2.voice.normal.cool.push('……一人のほうが、楽');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.normal) SNAPSHOT_TEXTS.G2.voice.normal = {};
if (!SNAPSHOT_TEXTS.G2.voice.normal.seductive) SNAPSHOT_TEXTS.G2.voice.normal.seductive = [];
SNAPSHOT_TEXTS.G2.voice.normal.seductive.push('ふふ……一人は、嫌いじゃないわ');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.bold) SNAPSHOT_TEXTS.G2.voice.bold = {};
if (!SNAPSHOT_TEXTS.G2.voice.bold.polite) SNAPSHOT_TEXTS.G2.voice.bold.polite = [];
SNAPSHOT_TEXTS.G2.voice.bold.polite.push('……っ、わたしは平気です、ひとりでも全然平気です!');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.bold) SNAPSHOT_TEXTS.G2.voice.bold = {};
if (!SNAPSHOT_TEXTS.G2.voice.bold.seductive) SNAPSHOT_TEXTS.G2.voice.bold.seductive = [];
SNAPSHOT_TEXTS.G2.voice.bold.seductive.push('ふ……ひとりのほうが、静かで好きよ');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.quiet) SNAPSHOT_TEXTS.G2.voice.quiet = {};
if (!SNAPSHOT_TEXTS.G2.voice.quiet.polite) SNAPSHOT_TEXTS.G2.voice.quiet.polite = [];
SNAPSHOT_TEXTS.G2.voice.quiet.polite.push('……誰もいない');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.quiet) SNAPSHOT_TEXTS.G2.voice.quiet = {};
if (!SNAPSHOT_TEXTS.G2.voice.quiet.seductive) SNAPSHOT_TEXTS.G2.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.G2.voice.quiet.seductive.push('……静か、ね');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.earnest) SNAPSHOT_TEXTS.G2.voice.earnest = {};
if (!SNAPSHOT_TEXTS.G2.voice.earnest.seductive) SNAPSHOT_TEXTS.G2.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.G2.voice.earnest.seductive.push('……わたし、ここにいていいのかしら');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.earnest) SNAPSHOT_TEXTS.G2.voice.earnest = {};
if (!SNAPSHOT_TEXTS.G2.voice.earnest.ojousama) SNAPSHOT_TEXTS.G2.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.G2.voice.earnest.ojousama.push('わたくし、ひとりでも平気ですの……平気、ですわ……');
if (!SNAPSHOT_TEXTS.G2.voice) SNAPSHOT_TEXTS.G2.voice = {};
if (!SNAPSHOT_TEXTS.G2.voice.emotional) SNAPSHOT_TEXTS.G2.voice.emotional = {};
if (!SNAPSHOT_TEXTS.G2.voice.emotional.composed) SNAPSHOT_TEXTS.G2.voice.emotional.composed = [];
SNAPSHOT_TEXTS.G2.voice.emotional.composed.push('ねえ……みんな、どこ行っちゃったの……?');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.normal) SNAPSHOT_TEXTS.G3.voice.normal = {};
if (!SNAPSHOT_TEXTS.G3.voice.normal.polite) SNAPSHOT_TEXTS.G3.voice.normal.polite = [];
SNAPSHOT_TEXTS.G3.voice.normal.polite.push('……また、ないんですね。仕方ないです');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.normal) SNAPSHOT_TEXTS.G3.voice.normal = {};
if (!SNAPSHOT_TEXTS.G3.voice.normal.cool) SNAPSHOT_TEXTS.G3.voice.normal.cool = [];
SNAPSHOT_TEXTS.G3.voice.normal.cool.push('……今回も、外された');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.normal) SNAPSHOT_TEXTS.G3.voice.normal = {};
if (!SNAPSHOT_TEXTS.G3.voice.normal.seductive) SNAPSHOT_TEXTS.G3.voice.normal.seductive = [];
SNAPSHOT_TEXTS.G3.voice.normal.seductive.push('ふ……わたしじゃ、ダメってこと?');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.bold) SNAPSHOT_TEXTS.G3.voice.bold = {};
if (!SNAPSHOT_TEXTS.G3.voice.bold.polite) SNAPSHOT_TEXTS.G3.voice.bold.polite = [];
SNAPSHOT_TEXTS.G3.voice.bold.polite.push('……!なんでわたしじゃないんですか!納得できません!');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.bold) SNAPSHOT_TEXTS.G3.voice.bold = {};
if (!SNAPSHOT_TEXTS.G3.voice.bold.seductive) SNAPSHOT_TEXTS.G3.voice.bold.seductive = [];
SNAPSHOT_TEXTS.G3.voice.bold.seductive.push('ふふ……わたしを出さないなんて、もったいないわね');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.quiet) SNAPSHOT_TEXTS.G3.voice.quiet = {};
if (!SNAPSHOT_TEXTS.G3.voice.quiet.polite) SNAPSHOT_TEXTS.G3.voice.quiet.polite = [];
SNAPSHOT_TEXTS.G3.voice.quiet.polite.push('……呼ばれてない');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.quiet) SNAPSHOT_TEXTS.G3.voice.quiet = {};
if (!SNAPSHOT_TEXTS.G3.voice.quiet.seductive) SNAPSHOT_TEXTS.G3.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.G3.voice.quiet.seductive.push('……そう、ね');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.earnest) SNAPSHOT_TEXTS.G3.voice.earnest = {};
if (!SNAPSHOT_TEXTS.G3.voice.earnest.seductive) SNAPSHOT_TEXTS.G3.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.G3.voice.earnest.seductive.push('わたし、まだ足りないのね……もっと、頑張らないと');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.earnest) SNAPSHOT_TEXTS.G3.voice.earnest = {};
if (!SNAPSHOT_TEXTS.G3.voice.earnest.ojousama) SNAPSHOT_TEXTS.G3.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.G3.voice.earnest.ojousama.push('わたくし、呼ばれておりませんのね……悲しいですわ');
if (!SNAPSHOT_TEXTS.G3.voice) SNAPSHOT_TEXTS.G3.voice = {};
if (!SNAPSHOT_TEXTS.G3.voice.emotional) SNAPSHOT_TEXTS.G3.voice.emotional = {};
if (!SNAPSHOT_TEXTS.G3.voice.emotional.composed) SNAPSHOT_TEXTS.G3.voice.emotional.composed = [];
SNAPSHOT_TEXTS.G3.voice.emotional.composed.push('なんで!?なんでわたしじゃないの!悔しい!');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.normal) SNAPSHOT_TEXTS.G4.voice.normal = {};
if (!SNAPSHOT_TEXTS.G4.voice.normal.polite) SNAPSHOT_TEXTS.G4.voice.normal.polite = [];
SNAPSHOT_TEXTS.G4.voice.normal.polite.push('……誰も、見ていなくても。わたしは、練習します');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.normal) SNAPSHOT_TEXTS.G4.voice.normal = {};
if (!SNAPSHOT_TEXTS.G4.voice.normal.cool) SNAPSHOT_TEXTS.G4.voice.normal.cool = [];
SNAPSHOT_TEXTS.G4.voice.normal.cool.push('……やるしかない');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.normal) SNAPSHOT_TEXTS.G4.voice.normal = {};
if (!SNAPSHOT_TEXTS.G4.voice.normal.seductive) SNAPSHOT_TEXTS.G4.voice.normal.seductive = [];
SNAPSHOT_TEXTS.G4.voice.normal.seductive.push('ふふ……誰にも見られず、磨かれていくのも、悪くないわ');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.bold) SNAPSHOT_TEXTS.G4.voice.bold = {};
if (!SNAPSHOT_TEXTS.G4.voice.bold.polite) SNAPSHOT_TEXTS.G4.voice.bold.polite = [];
SNAPSHOT_TEXTS.G4.voice.bold.polite.push('見ててくれる人なんていなくても関係ない!わたしは強くなる!');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.bold) SNAPSHOT_TEXTS.G4.voice.bold = {};
if (!SNAPSHOT_TEXTS.G4.voice.bold.seductive) SNAPSHOT_TEXTS.G4.voice.bold.seductive = [];
SNAPSHOT_TEXTS.G4.voice.bold.seductive.push('ふ……ひとりの時間が、わたしを作るの');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.quiet) SNAPSHOT_TEXTS.G4.voice.quiet = {};
if (!SNAPSHOT_TEXTS.G4.voice.quiet.polite) SNAPSHOT_TEXTS.G4.voice.quiet.polite = [];
SNAPSHOT_TEXTS.G4.voice.quiet.polite.push('……続ける');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.quiet) SNAPSHOT_TEXTS.G4.voice.quiet = {};
if (!SNAPSHOT_TEXTS.G4.voice.quiet.seductive) SNAPSHOT_TEXTS.G4.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.G4.voice.quiet.seductive.push('……もくもくと');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.earnest) SNAPSHOT_TEXTS.G4.voice.earnest = {};
if (!SNAPSHOT_TEXTS.G4.voice.earnest.seductive) SNAPSHOT_TEXTS.G4.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.G4.voice.earnest.seductive.push('わたしには、練習しかないもの。やるしかないの');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.earnest) SNAPSHOT_TEXTS.G4.voice.earnest = {};
if (!SNAPSHOT_TEXTS.G4.voice.earnest.ojousama) SNAPSHOT_TEXTS.G4.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.G4.voice.earnest.ojousama.push('わたくしの努力、いつか誰かが気づいてくれますかしら……');
if (!SNAPSHOT_TEXTS.G4.voice) SNAPSHOT_TEXTS.G4.voice = {};
if (!SNAPSHOT_TEXTS.G4.voice.emotional) SNAPSHOT_TEXTS.G4.voice.emotional = {};
if (!SNAPSHOT_TEXTS.G4.voice.emotional.composed) SNAPSHOT_TEXTS.G4.voice.emotional.composed = [];
SNAPSHOT_TEXTS.G4.voice.emotional.composed.push('うう……寂しい、寂しいけど、やるよ、わたしやるからね!');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.normal) SNAPSHOT_TEXTS.R2.voice.normal = {};
if (!SNAPSHOT_TEXTS.R2.voice.normal.polite) SNAPSHOT_TEXTS.R2.voice.normal.polite = [];
SNAPSHOT_TEXTS.R2.voice.normal.polite.push('……わたしも、あの輪に、入りたかったな');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.normal) SNAPSHOT_TEXTS.R2.voice.normal = {};
if (!SNAPSHOT_TEXTS.R2.voice.normal.cool) SNAPSHOT_TEXTS.R2.voice.normal.cool = [];
SNAPSHOT_TEXTS.R2.voice.normal.cool.push('……別に、いい');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.normal) SNAPSHOT_TEXTS.R2.voice.normal = {};
if (!SNAPSHOT_TEXTS.R2.voice.normal.seductive) SNAPSHOT_TEXTS.R2.voice.normal.seductive = [];
SNAPSHOT_TEXTS.R2.voice.normal.seductive.push('ふふ……ひとりも、悪くないわ');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.bold) SNAPSHOT_TEXTS.R2.voice.bold = {};
if (!SNAPSHOT_TEXTS.R2.voice.bold.polite) SNAPSHOT_TEXTS.R2.voice.bold.polite = [];
SNAPSHOT_TEXTS.R2.voice.bold.polite.push('……別に、仲間はずれでもいいです!ひとりで上がります!');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.bold) SNAPSHOT_TEXTS.R2.voice.bold = {};
if (!SNAPSHOT_TEXTS.R2.voice.bold.seductive) SNAPSHOT_TEXTS.R2.voice.bold.seductive = [];
SNAPSHOT_TEXTS.R2.voice.bold.seductive.push('ふ……群れない、それだけ');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.quiet) SNAPSHOT_TEXTS.R2.voice.quiet = {};
if (!SNAPSHOT_TEXTS.R2.voice.quiet.polite) SNAPSHOT_TEXTS.R2.voice.quiet.polite = [];
SNAPSHOT_TEXTS.R2.voice.quiet.polite.push('……入れない');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.quiet) SNAPSHOT_TEXTS.R2.voice.quiet = {};
if (!SNAPSHOT_TEXTS.R2.voice.quiet.seductive) SNAPSHOT_TEXTS.R2.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.R2.voice.quiet.seductive.push('……遠い、わね');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.earnest) SNAPSHOT_TEXTS.R2.voice.earnest = {};
if (!SNAPSHOT_TEXTS.R2.voice.earnest.seductive) SNAPSHOT_TEXTS.R2.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.R2.voice.earnest.seductive.push('わたし、何か悪いことしたのかしら……');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.earnest) SNAPSHOT_TEXTS.R2.voice.earnest = {};
if (!SNAPSHOT_TEXTS.R2.voice.earnest.ojousama) SNAPSHOT_TEXTS.R2.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.R2.voice.earnest.ojousama.push('……わたくし、浮いておりますのね。らしくないですわ');
if (!SNAPSHOT_TEXTS.R2.voice) SNAPSHOT_TEXTS.R2.voice = {};
if (!SNAPSHOT_TEXTS.R2.voice.emotional) SNAPSHOT_TEXTS.R2.voice.emotional = {};
if (!SNAPSHOT_TEXTS.R2.voice.emotional.composed) SNAPSHOT_TEXTS.R2.voice.emotional.composed = [];
SNAPSHOT_TEXTS.R2.voice.emotional.composed.push('ねえ、仲間に入れてよー!って言えたら、いいのに……');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.normal) SNAPSHOT_TEXTS.R4.voice.normal = {};
if (!SNAPSHOT_TEXTS.R4.voice.normal.polite) SNAPSHOT_TEXTS.R4.voice.normal.polite = [];
SNAPSHOT_TEXTS.R4.voice.normal.polite.push('……もう、あの人とは目も合わせられないんですね');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.normal) SNAPSHOT_TEXTS.R4.voice.normal = {};
if (!SNAPSHOT_TEXTS.R4.voice.normal.cool) SNAPSHOT_TEXTS.R4.voice.normal.cool = [];
SNAPSHOT_TEXTS.R4.voice.normal.cool.push('……もう、終わった');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.normal) SNAPSHOT_TEXTS.R4.voice.normal = {};
if (!SNAPSHOT_TEXTS.R4.voice.normal.seductive) SNAPSHOT_TEXTS.R4.voice.normal.seductive = [];
SNAPSHOT_TEXTS.R4.voice.normal.seductive.push('ふ……あの日から、何も変わってないわね');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.bold) SNAPSHOT_TEXTS.R4.voice.bold = {};
if (!SNAPSHOT_TEXTS.R4.voice.bold.polite) SNAPSHOT_TEXTS.R4.voice.bold.polite = [];
SNAPSHOT_TEXTS.R4.voice.bold.polite.push('あの人とは、もう絶対に口きかない!絶対に!');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.bold) SNAPSHOT_TEXTS.R4.voice.bold = {};
if (!SNAPSHOT_TEXTS.R4.voice.bold.seductive) SNAPSHOT_TEXTS.R4.voice.bold.seductive = [];
SNAPSHOT_TEXTS.R4.voice.bold.seductive.push('ふふ……遠ざかっていくのが、わかるわ');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.quiet) SNAPSHOT_TEXTS.R4.voice.quiet = {};
if (!SNAPSHOT_TEXTS.R4.voice.quiet.polite) SNAPSHOT_TEXTS.R4.voice.quiet.polite = [];
SNAPSHOT_TEXTS.R4.voice.quiet.polite.push('……離れた');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.quiet) SNAPSHOT_TEXTS.R4.voice.quiet = {};
if (!SNAPSHOT_TEXTS.R4.voice.quiet.seductive) SNAPSHOT_TEXTS.R4.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.R4.voice.quiet.seductive.push('……さよなら、ね');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.earnest) SNAPSHOT_TEXTS.R4.voice.earnest = {};
if (!SNAPSHOT_TEXTS.R4.voice.earnest.seductive) SNAPSHOT_TEXTS.R4.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.R4.voice.earnest.seductive.push('わたしたち、どこで間違えてしまったのかしら……');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.earnest) SNAPSHOT_TEXTS.R4.voice.earnest = {};
if (!SNAPSHOT_TEXTS.R4.voice.earnest.ojousama) SNAPSHOT_TEXTS.R4.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.R4.voice.earnest.ojousama.push('あの方とは、もう距離ができてしまいましたのね……');
if (!SNAPSHOT_TEXTS.R4.voice) SNAPSHOT_TEXTS.R4.voice = {};
if (!SNAPSHOT_TEXTS.R4.voice.emotional) SNAPSHOT_TEXTS.R4.voice.emotional = {};
if (!SNAPSHOT_TEXTS.R4.voice.emotional.composed) SNAPSHOT_TEXTS.R4.voice.emotional.composed = [];
SNAPSHOT_TEXTS.R4.voice.emotional.composed.push('ひどい、ひどいよ、わたしあの人のこと信じてたのに!');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.normal) SNAPSHOT_TEXTS.R5.voice.normal = {};
if (!SNAPSHOT_TEXTS.R5.voice.normal.polite) SNAPSHOT_TEXTS.R5.voice.normal.polite = [];
SNAPSHOT_TEXTS.R5.voice.normal.polite.push('……信じてたのに。わたし、馬鹿みたいです');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.normal) SNAPSHOT_TEXTS.R5.voice.normal = {};
if (!SNAPSHOT_TEXTS.R5.voice.normal.cool) SNAPSHOT_TEXTS.R5.voice.normal.cool = [];
SNAPSHOT_TEXTS.R5.voice.normal.cool.push('……裏切られた');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.normal) SNAPSHOT_TEXTS.R5.voice.normal = {};
if (!SNAPSHOT_TEXTS.R5.voice.normal.seductive) SNAPSHOT_TEXTS.R5.voice.normal.seductive = [];
SNAPSHOT_TEXTS.R5.voice.normal.seductive.push('ふふ……騙されたわたしも、悪かった、のかしら');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.bold) SNAPSHOT_TEXTS.R5.voice.bold = {};
if (!SNAPSHOT_TEXTS.R5.voice.bold.polite) SNAPSHOT_TEXTS.R5.voice.bold.polite = [];
SNAPSHOT_TEXTS.R5.voice.bold.polite.push('あの人……っ、あの人のこと、絶対に許さない!');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.bold) SNAPSHOT_TEXTS.R5.voice.bold = {};
if (!SNAPSHOT_TEXTS.R5.voice.bold.seductive) SNAPSHOT_TEXTS.R5.voice.bold.seductive = [];
SNAPSHOT_TEXTS.R5.voice.bold.seductive.push('ふ……嘘、だったのね');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.quiet) SNAPSHOT_TEXTS.R5.voice.quiet = {};
if (!SNAPSHOT_TEXTS.R5.voice.quiet.polite) SNAPSHOT_TEXTS.R5.voice.quiet.polite = [];
SNAPSHOT_TEXTS.R5.voice.quiet.polite.push('……嘘');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.quiet) SNAPSHOT_TEXTS.R5.voice.quiet = {};
if (!SNAPSHOT_TEXTS.R5.voice.quiet.seductive) SNAPSHOT_TEXTS.R5.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.R5.voice.quiet.seductive.push('……ふ、そう');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.earnest) SNAPSHOT_TEXTS.R5.voice.earnest = {};
if (!SNAPSHOT_TEXTS.R5.voice.earnest.seductive) SNAPSHOT_TEXTS.R5.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.R5.voice.earnest.seductive.push('わたし、人を見る目がなかったんだわ……情けない');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.earnest) SNAPSHOT_TEXTS.R5.voice.earnest = {};
if (!SNAPSHOT_TEXTS.R5.voice.earnest.ojousama) SNAPSHOT_TEXTS.R5.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.R5.voice.earnest.ojousama.push('まあ……わたくし、騙されておりましたの……?');
if (!SNAPSHOT_TEXTS.R5.voice) SNAPSHOT_TEXTS.R5.voice = {};
if (!SNAPSHOT_TEXTS.R5.voice.emotional) SNAPSHOT_TEXTS.R5.voice.emotional = {};
if (!SNAPSHOT_TEXTS.R5.voice.emotional.composed) SNAPSHOT_TEXTS.R5.voice.emotional.composed = [];
SNAPSHOT_TEXTS.R5.voice.emotional.composed.push('うそっ、うそ、うそでしょ!?ねえ、うそって言ってよ!');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.normal) SNAPSHOT_TEXTS.breakthrough.voice.normal = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.normal.polite) SNAPSHOT_TEXTS.breakthrough.voice.normal.polite = [];
SNAPSHOT_TEXTS.breakthrough.voice.normal.polite.push('……何か、変わった気がします。体が、軽い');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.normal) SNAPSHOT_TEXTS.breakthrough.voice.normal = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.normal.cool) SNAPSHOT_TEXTS.breakthrough.voice.normal.cool = [];
SNAPSHOT_TEXTS.breakthrough.voice.normal.cool.push('……変わった');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.normal) SNAPSHOT_TEXTS.breakthrough.voice.normal = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.normal.seductive) SNAPSHOT_TEXTS.breakthrough.voice.normal.seductive = [];
SNAPSHOT_TEXTS.breakthrough.voice.normal.seductive.push('ふふ……わたし、何か手に入れた?');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.bold) SNAPSHOT_TEXTS.breakthrough.voice.bold = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.bold.polite) SNAPSHOT_TEXTS.breakthrough.voice.bold.polite = [];
SNAPSHOT_TEXTS.breakthrough.voice.bold.polite.push('来た……!これだ、これが欲しかった感覚!');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.bold) SNAPSHOT_TEXTS.breakthrough.voice.bold = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.bold.seductive) SNAPSHOT_TEXTS.breakthrough.voice.bold.seductive = [];
SNAPSHOT_TEXTS.breakthrough.voice.bold.seductive.push('ふ……覚醒、というやつ、かしら');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.quiet) SNAPSHOT_TEXTS.breakthrough.voice.quiet = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.quiet.polite) SNAPSHOT_TEXTS.breakthrough.voice.quiet.polite = [];
SNAPSHOT_TEXTS.breakthrough.voice.quiet.polite.push('……掴んだ');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.quiet) SNAPSHOT_TEXTS.breakthrough.voice.quiet = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.quiet.seductive) SNAPSHOT_TEXTS.breakthrough.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.breakthrough.voice.quiet.seductive.push('……ふ、見えた');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.earnest) SNAPSHOT_TEXTS.breakthrough.voice.earnest = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.earnest.seductive) SNAPSHOT_TEXTS.breakthrough.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.breakthrough.voice.earnest.seductive.push('これなんだわ……ずっと探していたものは……!');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.earnest) SNAPSHOT_TEXTS.breakthrough.voice.earnest = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.earnest.ojousama) SNAPSHOT_TEXTS.breakthrough.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.breakthrough.voice.earnest.ojousama.push('まあ、わたくしに何かが宿りましたの!素敵ですわ!');
if (!SNAPSHOT_TEXTS.breakthrough.voice) SNAPSHOT_TEXTS.breakthrough.voice = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.emotional) SNAPSHOT_TEXTS.breakthrough.voice.emotional = {};
if (!SNAPSHOT_TEXTS.breakthrough.voice.emotional.composed) SNAPSHOT_TEXTS.breakthrough.voice.emotional.composed = [];
SNAPSHOT_TEXTS.breakthrough.voice.emotional.composed.push('すごい、すごいよ!なんか、なんかわかんないけどすごい!');
if (!SNAPSHOT_TEXTS.warVictory.voice) SNAPSHOT_TEXTS.warVictory.voice = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.bold) SNAPSHOT_TEXTS.warVictory.voice.bold = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.bold.polite) SNAPSHOT_TEXTS.warVictory.voice.bold.polite = [];
SNAPSHOT_TEXTS.warVictory.voice.bold.polite.push('やった……!わたしたちで、守り抜きました!');
if (!SNAPSHOT_TEXTS.warVictory.voice) SNAPSHOT_TEXTS.warVictory.voice = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.bold) SNAPSHOT_TEXTS.warVictory.voice.bold = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.bold.seductive) SNAPSHOT_TEXTS.warVictory.voice.bold.seductive = [];
SNAPSHOT_TEXTS.warVictory.voice.bold.seductive.push('ふふ……これが、わたしたちの答えよ');
if (!SNAPSHOT_TEXTS.warVictory.voice) SNAPSHOT_TEXTS.warVictory.voice = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.quiet) SNAPSHOT_TEXTS.warVictory.voice.quiet = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.quiet.polite) SNAPSHOT_TEXTS.warVictory.voice.quiet.polite = [];
SNAPSHOT_TEXTS.warVictory.voice.quiet.polite.push('……勝った。守れた');
if (!SNAPSHOT_TEXTS.warVictory.voice) SNAPSHOT_TEXTS.warVictory.voice = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.quiet) SNAPSHOT_TEXTS.warVictory.voice.quiet = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.quiet.seductive) SNAPSHOT_TEXTS.warVictory.voice.quiet.seductive = [];
SNAPSHOT_TEXTS.warVictory.voice.quiet.seductive.push('……ふ、勝利');
if (!SNAPSHOT_TEXTS.warVictory.voice) SNAPSHOT_TEXTS.warVictory.voice = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.earnest) SNAPSHOT_TEXTS.warVictory.voice.earnest = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.earnest.seductive) SNAPSHOT_TEXTS.warVictory.voice.earnest.seductive = [];
SNAPSHOT_TEXTS.warVictory.voice.earnest.seductive.push('仲間と掴んだ、この勝利……!忘れません');
if (!SNAPSHOT_TEXTS.warVictory.voice) SNAPSHOT_TEXTS.warVictory.voice = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.earnest) SNAPSHOT_TEXTS.warVictory.voice.earnest = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.earnest.ojousama) SNAPSHOT_TEXTS.warVictory.voice.earnest.ojousama = [];
SNAPSHOT_TEXTS.warVictory.voice.earnest.ojousama.push('まあ、勝ちましたわ!皆様のおかげですの!');
if (!SNAPSHOT_TEXTS.warVictory.voice) SNAPSHOT_TEXTS.warVictory.voice = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.emotional) SNAPSHOT_TEXTS.warVictory.voice.emotional = {};
if (!SNAPSHOT_TEXTS.warVictory.voice.emotional.composed) SNAPSHOT_TEXTS.warVictory.voice.emotional.composed = [];
SNAPSHOT_TEXTS.warVictory.voice.emotional.composed.push('うわああああ勝った勝った!!みんなありがとー!!');

// ── RIVALRY_MATCH_REACTION 穴埋め拡張 ──
if (!RIVALRY_MATCH_REACTION.winnerLines.shy) RIVALRY_MATCH_REACTION.winnerLines.shy = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.shy.polite) RIVALRY_MATCH_REACTION.winnerLines.shy.polite = [];
RIVALRY_MATCH_REACTION.winnerLines.shy.polite.push('か、勝てました…でも…次も頑張らないと…');
if (!RIVALRY_MATCH_REACTION.winnerLines.emotional) RIVALRY_MATCH_REACTION.winnerLines.emotional = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.emotional.seductive) RIVALRY_MATCH_REACTION.winnerLines.emotional.seductive = [];
RIVALRY_MATCH_REACTION.winnerLines.emotional.seductive.push('勝ったわ…!でもまだ…まだ終わらないのよ…っ');
if (!RIVALRY_MATCH_REACTION.loserLines.shy) RIVALRY_MATCH_REACTION.loserLines.shy = {};
if (!RIVALRY_MATCH_REACTION.loserLines.shy.polite) RIVALRY_MATCH_REACTION.loserLines.shy.polite = [];
RIVALRY_MATCH_REACTION.loserLines.shy.polite.push('…負けてしまいました……悔しい…です…');
if (!RIVALRY_MATCH_REACTION.loserLines.bold) RIVALRY_MATCH_REACTION.loserLines.bold = {};
if (!RIVALRY_MATCH_REACTION.loserLines.bold.ojousama) RIVALRY_MATCH_REACTION.loserLines.bold.ojousama = [];
RIVALRY_MATCH_REACTION.loserLines.bold.ojousama.push('この負けは忘れない。……必ず借りは返す');
if (!RIVALRY_MATCH_REACTION.loserLines.emotional) RIVALRY_MATCH_REACTION.loserLines.emotional = {};
if (!RIVALRY_MATCH_REACTION.loserLines.emotional.seductive) RIVALRY_MATCH_REACTION.loserLines.emotional.seductive = [];
RIVALRY_MATCH_REACTION.loserLines.emotional.seductive.push('負けた…っ…でも、この気持ち…絶対に忘れないわ…');
if (!RIVALRY_MATCH_REACTION.winnerLines.normal) RIVALRY_MATCH_REACTION.winnerLines.normal = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.normal.polite) RIVALRY_MATCH_REACTION.winnerLines.normal.polite = [];
RIVALRY_MATCH_REACTION.winnerLines.normal.polite.push('今日のところは、わたしの勝ちです。次も…お待ちしています');
if (!RIVALRY_MATCH_REACTION.winnerLines.normal) RIVALRY_MATCH_REACTION.winnerLines.normal = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.normal.cool) RIVALRY_MATCH_REACTION.winnerLines.normal.cool = [];
RIVALRY_MATCH_REACTION.winnerLines.normal.cool.push('……今日は、わたしの勝ち');
if (!RIVALRY_MATCH_REACTION.winnerLines.normal) RIVALRY_MATCH_REACTION.winnerLines.normal = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.normal.ojousama) RIVALRY_MATCH_REACTION.winnerLines.normal.ojousama = [];
RIVALRY_MATCH_REACTION.winnerLines.normal.ojousama.push('本日はわたくしの勝利ですわね。次の機会もお待ちしてますわね');
if (!RIVALRY_MATCH_REACTION.winnerLines.normal) RIVALRY_MATCH_REACTION.winnerLines.normal = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.normal.seductive) RIVALRY_MATCH_REACTION.winnerLines.normal.seductive = [];
RIVALRY_MATCH_REACTION.winnerLines.normal.seductive.push('今日はわたしの勝ちね。…次はどうなるかしら');
if (!RIVALRY_MATCH_REACTION.winnerLines.normal) RIVALRY_MATCH_REACTION.winnerLines.normal = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.normal.delinquent) RIVALRY_MATCH_REACTION.winnerLines.normal.delinquent = [];
RIVALRY_MATCH_REACTION.winnerLines.normal.delinquent.push('今日はこっちの勝ちだ。次もよろしくな');
if (!RIVALRY_MATCH_REACTION.winnerLines.normal) RIVALRY_MATCH_REACTION.winnerLines.normal = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.normal.composed) RIVALRY_MATCH_REACTION.winnerLines.normal.composed = [];
RIVALRY_MATCH_REACTION.winnerLines.normal.composed.push('…今日はわたしの勝ちだね。また次もよろしく');
if (!RIVALRY_MATCH_REACTION.winnerLines.bold) RIVALRY_MATCH_REACTION.winnerLines.bold = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.bold._default) RIVALRY_MATCH_REACTION.winnerLines.bold._default = [];
RIVALRY_MATCH_REACTION.winnerLines.bold._default.push('今のあなたじゃ、わたしは倒せない。鍛え直してきなさい。');
if (!RIVALRY_MATCH_REACTION.winnerLines.bold) RIVALRY_MATCH_REACTION.winnerLines.bold = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.bold.polite) RIVALRY_MATCH_REACTION.winnerLines.bold.polite = [];
RIVALRY_MATCH_REACTION.winnerLines.bold.polite.push('今のあなたでは、わたしは倒せません。鍛え直してきてください');
if (!RIVALRY_MATCH_REACTION.winnerLines.bold) RIVALRY_MATCH_REACTION.winnerLines.bold = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.bold.ojousama) RIVALRY_MATCH_REACTION.winnerLines.bold.ojousama = [];
RIVALRY_MATCH_REACTION.winnerLines.bold.ojousama.push('わたくしを倒すなど百年早いですわね');
if (!RIVALRY_MATCH_REACTION.winnerLines.bold) RIVALRY_MATCH_REACTION.winnerLines.bold = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.bold.seductive) RIVALRY_MATCH_REACTION.winnerLines.bold.seductive = [];
RIVALRY_MATCH_REACTION.winnerLines.bold.seductive.push('今のあなたじゃ、わたしに届かないわ。…鍛え直してらっしゃい');
if (!RIVALRY_MATCH_REACTION.winnerLines.bold) RIVALRY_MATCH_REACTION.winnerLines.bold = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.bold.delinquent) RIVALRY_MATCH_REACTION.winnerLines.bold.delinquent = [];
RIVALRY_MATCH_REACTION.winnerLines.bold.delinquent.push('今のテメェじゃ、あたしには勝てねえ。出直してこい');
if (!RIVALRY_MATCH_REACTION.winnerLines.bold) RIVALRY_MATCH_REACTION.winnerLines.bold = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.bold.composed) RIVALRY_MATCH_REACTION.winnerLines.bold.composed = [];
RIVALRY_MATCH_REACTION.winnerLines.bold.composed.push('…今のあなたじゃ、わたしには届かない。また来なよ');
if (!RIVALRY_MATCH_REACTION.winnerLines.quiet) RIVALRY_MATCH_REACTION.winnerLines.quiet = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.quiet._default) RIVALRY_MATCH_REACTION.winnerLines.quiet._default = [];
RIVALRY_MATCH_REACTION.winnerLines.quiet._default.push('………(そっと去っていく)');
if (!RIVALRY_MATCH_REACTION.winnerLines.quiet) RIVALRY_MATCH_REACTION.winnerLines.quiet = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.quiet.polite) RIVALRY_MATCH_REACTION.winnerLines.quiet.polite = [];
RIVALRY_MATCH_REACTION.winnerLines.quiet.polite.push('………今日は、ここまでです');
if (!RIVALRY_MATCH_REACTION.winnerLines.quiet) RIVALRY_MATCH_REACTION.winnerLines.quiet = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.quiet.cool) RIVALRY_MATCH_REACTION.winnerLines.quiet.cool = [];
RIVALRY_MATCH_REACTION.winnerLines.quiet.cool.push('……終わり');
if (!RIVALRY_MATCH_REACTION.winnerLines.quiet) RIVALRY_MATCH_REACTION.winnerLines.quiet = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.quiet.seductive) RIVALRY_MATCH_REACTION.winnerLines.quiet.seductive = [];
RIVALRY_MATCH_REACTION.winnerLines.quiet.seductive.push('………今日のところは、ね');
if (!RIVALRY_MATCH_REACTION.winnerLines.shy) RIVALRY_MATCH_REACTION.winnerLines.shy = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.shy._default) RIVALRY_MATCH_REACTION.winnerLines.shy._default = [];
RIVALRY_MATCH_REACTION.winnerLines.shy._default.push('…あ、あの…ありがとう…ございました…');
if (!RIVALRY_MATCH_REACTION.winnerLines.shy) RIVALRY_MATCH_REACTION.winnerLines.shy = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.shy.polite) RIVALRY_MATCH_REACTION.winnerLines.shy.polite = [];
RIVALRY_MATCH_REACTION.winnerLines.shy.polite.push('…あ、あの…ありがとうございました…');
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing) RIVALRY_MATCH_REACTION.winnerLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing._default) RIVALRY_MATCH_REACTION.winnerLines.easygoing._default = [];
RIVALRY_MATCH_REACTION.winnerLines.easygoing._default.push('一勝一勝、積み重ねていくよ!次もよろしくね!');
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing) RIVALRY_MATCH_REACTION.winnerLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing.polite) RIVALRY_MATCH_REACTION.winnerLines.easygoing.polite = [];
RIVALRY_MATCH_REACTION.winnerLines.easygoing.polite.push('一勝ずつ、積み重ねていきます!次もよろしくお願いします!');
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing) RIVALRY_MATCH_REACTION.winnerLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing.ojousama) RIVALRY_MATCH_REACTION.winnerLines.easygoing.ojousama = [];
RIVALRY_MATCH_REACTION.winnerLines.easygoing.ojousama.push('一勝ずつ、積み重ねますわ!次もよろしくお願いいたします!');
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing) RIVALRY_MATCH_REACTION.winnerLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing.seductive) RIVALRY_MATCH_REACTION.winnerLines.easygoing.seductive = [];
RIVALRY_MATCH_REACTION.winnerLines.easygoing.seductive.push('一勝、積み重ねたわ。…次も楽しみにしてて');
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing) RIVALRY_MATCH_REACTION.winnerLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing.delinquent) RIVALRY_MATCH_REACTION.winnerLines.easygoing.delinquent = [];
RIVALRY_MATCH_REACTION.winnerLines.easygoing.delinquent.push('よし、一勝!次もガンガン行くぜ!');
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing) RIVALRY_MATCH_REACTION.winnerLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.easygoing.composed) RIVALRY_MATCH_REACTION.winnerLines.easygoing.composed = [];
RIVALRY_MATCH_REACTION.winnerLines.easygoing.composed.push('…一勝、積み重ねたよ。次もよろしくね');
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest) RIVALRY_MATCH_REACTION.winnerLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest._default) RIVALRY_MATCH_REACTION.winnerLines.earnest._default = [];
RIVALRY_MATCH_REACTION.winnerLines.earnest._default.push('なんとか勝利できました。でも油断はせずに次に備えないと……');
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest) RIVALRY_MATCH_REACTION.winnerLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest.polite) RIVALRY_MATCH_REACTION.winnerLines.earnest.polite = [];
RIVALRY_MATCH_REACTION.winnerLines.earnest.polite.push('勝たせていただきました。次に向けて、また鍛錬を積みます');
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest) RIVALRY_MATCH_REACTION.winnerLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest.ojousama) RIVALRY_MATCH_REACTION.winnerLines.earnest.ojousama = [];
RIVALRY_MATCH_REACTION.winnerLines.earnest.ojousama.push('ふぅ…。勝たせていただきましたわ。次に向け、鍛錬を続けます');
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest) RIVALRY_MATCH_REACTION.winnerLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest.seductive) RIVALRY_MATCH_REACTION.winnerLines.earnest.seductive = [];
RIVALRY_MATCH_REACTION.winnerLines.earnest.seductive.push('勝ったわ。でも油断はしない。…次に備えるの');
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest) RIVALRY_MATCH_REACTION.winnerLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.earnest.composed) RIVALRY_MATCH_REACTION.winnerLines.earnest.composed = [];
RIVALRY_MATCH_REACTION.winnerLines.earnest.composed.push('…勝てました。次に向けて、また鍛錬します');
if (!RIVALRY_MATCH_REACTION.winnerLines.emotional) RIVALRY_MATCH_REACTION.winnerLines.emotional = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.emotional._default) RIVALRY_MATCH_REACTION.winnerLines.emotional._default = [];
RIVALRY_MATCH_REACTION.winnerLines.emotional._default.push('勝てた…っ!嬉しい…でも、次も…次も頑張らなきゃ…!');
if (!RIVALRY_MATCH_REACTION.winnerLines.emotional) RIVALRY_MATCH_REACTION.winnerLines.emotional = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.emotional.seductive) RIVALRY_MATCH_REACTION.winnerLines.emotional.seductive = [];
RIVALRY_MATCH_REACTION.winnerLines.emotional.seductive.push('勝ったわ…っ!この喜び…でも、次も負けないんだから…!');
if (!RIVALRY_MATCH_REACTION.winnerLines.emotional) RIVALRY_MATCH_REACTION.winnerLines.emotional = {};
if (!RIVALRY_MATCH_REACTION.winnerLines.emotional.composed) RIVALRY_MATCH_REACTION.winnerLines.emotional.composed = [];
RIVALRY_MATCH_REACTION.winnerLines.emotional.composed.push('…勝てた。…嬉しい…次も頑張る');
if (!RIVALRY_MATCH_REACTION.loserLines.normal) RIVALRY_MATCH_REACTION.loserLines.normal = {};
if (!RIVALRY_MATCH_REACTION.loserLines.normal.polite) RIVALRY_MATCH_REACTION.loserLines.normal.polite = [];
RIVALRY_MATCH_REACTION.loserLines.normal.polite.push('…この悔しさ、忘れません。次は必ず勝ちます');
if (!RIVALRY_MATCH_REACTION.loserLines.normal) RIVALRY_MATCH_REACTION.loserLines.normal = {};
if (!RIVALRY_MATCH_REACTION.loserLines.normal.cool) RIVALRY_MATCH_REACTION.loserLines.normal.cool = [];
RIVALRY_MATCH_REACTION.loserLines.normal.cool.push('……次は、こうはいかない');
if (!RIVALRY_MATCH_REACTION.loserLines.normal) RIVALRY_MATCH_REACTION.loserLines.normal = {};
if (!RIVALRY_MATCH_REACTION.loserLines.normal.ojousama) RIVALRY_MATCH_REACTION.loserLines.normal.ojousama = [];
RIVALRY_MATCH_REACTION.loserLines.normal.ojousama.push('この悔しさ、忘れませんわ。次は必ず');
if (!RIVALRY_MATCH_REACTION.loserLines.normal) RIVALRY_MATCH_REACTION.loserLines.normal = {};
if (!RIVALRY_MATCH_REACTION.loserLines.normal.seductive) RIVALRY_MATCH_REACTION.loserLines.normal.seductive = [];
RIVALRY_MATCH_REACTION.loserLines.normal.seductive.push('…この悔しさ、忘れないわ。次は必ずね');
if (!RIVALRY_MATCH_REACTION.loserLines.normal) RIVALRY_MATCH_REACTION.loserLines.normal = {};
if (!RIVALRY_MATCH_REACTION.loserLines.normal.delinquent) RIVALRY_MATCH_REACTION.loserLines.normal.delinquent = [];
RIVALRY_MATCH_REACTION.loserLines.normal.delinquent.push('くそっ…この借りは必ず返す。覚えとけよ');
if (!RIVALRY_MATCH_REACTION.loserLines.normal) RIVALRY_MATCH_REACTION.loserLines.normal = {};
if (!RIVALRY_MATCH_REACTION.loserLines.normal.composed) RIVALRY_MATCH_REACTION.loserLines.normal.composed = [];
RIVALRY_MATCH_REACTION.loserLines.normal.composed.push('…この悔しさ、忘れない。次は必ず');
if (!RIVALRY_MATCH_REACTION.loserLines.bold) RIVALRY_MATCH_REACTION.loserLines.bold = {};
if (!RIVALRY_MATCH_REACTION.loserLines.bold._default) RIVALRY_MATCH_REACTION.loserLines.bold._default = [];
RIVALRY_MATCH_REACTION.loserLines.bold._default.push('まだ本当の実力じゃない。次は絶対に勝ってみせる');
if (!RIVALRY_MATCH_REACTION.loserLines.bold) RIVALRY_MATCH_REACTION.loserLines.bold = {};
if (!RIVALRY_MATCH_REACTION.loserLines.bold.polite) RIVALRY_MATCH_REACTION.loserLines.bold.polite = [];
RIVALRY_MATCH_REACTION.loserLines.bold.polite.push('まだ本気ではありません。次は必ず、勝たせていただきます');
if (!RIVALRY_MATCH_REACTION.loserLines.bold) RIVALRY_MATCH_REACTION.loserLines.bold = {};
if (!RIVALRY_MATCH_REACTION.loserLines.bold.ojousama) RIVALRY_MATCH_REACTION.loserLines.bold.ojousama = [];
RIVALRY_MATCH_REACTION.loserLines.bold.ojousama.push('私の真の実力なら、負けるはずはないのに！');
if (!RIVALRY_MATCH_REACTION.loserLines.bold) RIVALRY_MATCH_REACTION.loserLines.bold = {};
if (!RIVALRY_MATCH_REACTION.loserLines.bold.seductive) RIVALRY_MATCH_REACTION.loserLines.bold.seductive = [];
RIVALRY_MATCH_REACTION.loserLines.bold.seductive.push('まだ本気じゃないのよ。次は必ず倒すわ');
if (!RIVALRY_MATCH_REACTION.loserLines.bold) RIVALRY_MATCH_REACTION.loserLines.bold = {};
if (!RIVALRY_MATCH_REACTION.loserLines.bold.delinquent) RIVALRY_MATCH_REACTION.loserLines.bold.delinquent = [];
RIVALRY_MATCH_REACTION.loserLines.bold.delinquent.push('まだ本気じゃねえ。次はぶっ潰す。覚えとけよ');
if (!RIVALRY_MATCH_REACTION.loserLines.bold) RIVALRY_MATCH_REACTION.loserLines.bold = {};
if (!RIVALRY_MATCH_REACTION.loserLines.bold.composed) RIVALRY_MATCH_REACTION.loserLines.bold.composed = [];
RIVALRY_MATCH_REACTION.loserLines.bold.composed.push('…まだ本気じゃない。次は勝つよ');
if (!RIVALRY_MATCH_REACTION.loserLines.quiet) RIVALRY_MATCH_REACTION.loserLines.quiet = {};
if (!RIVALRY_MATCH_REACTION.loserLines.quiet._default) RIVALRY_MATCH_REACTION.loserLines.quiet._default = [];
RIVALRY_MATCH_REACTION.loserLines.quiet._default.push('………(拳を握り、リングを見つめる)');
if (!RIVALRY_MATCH_REACTION.loserLines.quiet) RIVALRY_MATCH_REACTION.loserLines.quiet = {};
if (!RIVALRY_MATCH_REACTION.loserLines.quiet.polite) RIVALRY_MATCH_REACTION.loserLines.quiet.polite = [];
RIVALRY_MATCH_REACTION.loserLines.quiet.polite.push('………次は、負けません');
if (!RIVALRY_MATCH_REACTION.loserLines.quiet) RIVALRY_MATCH_REACTION.loserLines.quiet = {};
if (!RIVALRY_MATCH_REACTION.loserLines.quiet.cool) RIVALRY_MATCH_REACTION.loserLines.quiet.cool = [];
RIVALRY_MATCH_REACTION.loserLines.quiet.cool.push('……次だ');
if (!RIVALRY_MATCH_REACTION.loserLines.quiet) RIVALRY_MATCH_REACTION.loserLines.quiet = {};
if (!RIVALRY_MATCH_REACTION.loserLines.quiet.seductive) RIVALRY_MATCH_REACTION.loserLines.quiet.seductive = [];
RIVALRY_MATCH_REACTION.loserLines.quiet.seductive.push('………次は、逃がさないわよ');
if (!RIVALRY_MATCH_REACTION.loserLines.shy) RIVALRY_MATCH_REACTION.loserLines.shy = {};
if (!RIVALRY_MATCH_REACTION.loserLines.shy._default) RIVALRY_MATCH_REACTION.loserLines.shy._default = [];
RIVALRY_MATCH_REACTION.loserLines.shy._default.push('…ご、ごめんなさい……次は…頑張ります…');
if (!RIVALRY_MATCH_REACTION.loserLines.shy) RIVALRY_MATCH_REACTION.loserLines.shy = {};
if (!RIVALRY_MATCH_REACTION.loserLines.shy.polite) RIVALRY_MATCH_REACTION.loserLines.shy.polite = [];
RIVALRY_MATCH_REACTION.loserLines.shy.polite.push('…も、申し訳ございません……次は必ず…');
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing) RIVALRY_MATCH_REACTION.loserLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing._default) RIVALRY_MATCH_REACTION.loserLines.easygoing._default = [];
RIVALRY_MATCH_REACTION.loserLines.easygoing._default.push('あー、悔しい!でも、次こそは絶対やり返す!');
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing) RIVALRY_MATCH_REACTION.loserLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing.polite) RIVALRY_MATCH_REACTION.loserLines.easygoing.polite = [];
RIVALRY_MATCH_REACTION.loserLines.easygoing.polite.push('悔しいです!でも次こそは、必ずやり返します!');
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing) RIVALRY_MATCH_REACTION.loserLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing.ojousama) RIVALRY_MATCH_REACTION.loserLines.easygoing.ojousama = [];
RIVALRY_MATCH_REACTION.loserLines.easygoing.ojousama.push('悔しいですわ!でも次こそは、必ずやり返します!');
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing) RIVALRY_MATCH_REACTION.loserLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing.seductive) RIVALRY_MATCH_REACTION.loserLines.easygoing.seductive = [];
RIVALRY_MATCH_REACTION.loserLines.easygoing.seductive.push('悔しい…でも次こそは、必ずやり返すわ');
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing) RIVALRY_MATCH_REACTION.loserLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing.delinquent) RIVALRY_MATCH_REACTION.loserLines.easygoing.delinquent = [];
RIVALRY_MATCH_REACTION.loserLines.easygoing.delinquent.push('くっそー悔しい!次こそは絶対やり返すからな!');
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing) RIVALRY_MATCH_REACTION.loserLines.easygoing = {};
if (!RIVALRY_MATCH_REACTION.loserLines.easygoing.composed) RIVALRY_MATCH_REACTION.loserLines.easygoing.composed = [];
RIVALRY_MATCH_REACTION.loserLines.easygoing.composed.push('…悔しいね。でも次こそは、やり返すよ');
if (!RIVALRY_MATCH_REACTION.loserLines.earnest) RIVALRY_MATCH_REACTION.loserLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.loserLines.earnest._default) RIVALRY_MATCH_REACTION.loserLines.earnest._default = [];
RIVALRY_MATCH_REACTION.loserLines.earnest._default.push('この敗北を糧にします。次は必ず、勝ってみせます');
if (!RIVALRY_MATCH_REACTION.loserLines.earnest) RIVALRY_MATCH_REACTION.loserLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.loserLines.earnest.polite) RIVALRY_MATCH_REACTION.loserLines.earnest.polite = [];
RIVALRY_MATCH_REACTION.loserLines.earnest.polite.push('この敗北を糧にいたします。次は必ず、勝たせていただきます');
if (!RIVALRY_MATCH_REACTION.loserLines.earnest) RIVALRY_MATCH_REACTION.loserLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.loserLines.earnest.ojousama) RIVALRY_MATCH_REACTION.loserLines.earnest.ojousama = [];
RIVALRY_MATCH_REACTION.loserLines.earnest.ojousama.push('この敗北を糧にしなくては。次は必ず勝たせていただきます！');
if (!RIVALRY_MATCH_REACTION.loserLines.earnest) RIVALRY_MATCH_REACTION.loserLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.loserLines.earnest.seductive) RIVALRY_MATCH_REACTION.loserLines.earnest.seductive = [];
RIVALRY_MATCH_REACTION.loserLines.earnest.seductive.push('この敗北を糧にするわ。次は必ず勝つの');
if (!RIVALRY_MATCH_REACTION.loserLines.earnest) RIVALRY_MATCH_REACTION.loserLines.earnest = {};
if (!RIVALRY_MATCH_REACTION.loserLines.earnest.composed) RIVALRY_MATCH_REACTION.loserLines.earnest.composed = [];
RIVALRY_MATCH_REACTION.loserLines.earnest.composed.push('…この敗北を糧にします。次は必ず');
if (!RIVALRY_MATCH_REACTION.loserLines.emotional) RIVALRY_MATCH_REACTION.loserLines.emotional = {};
if (!RIVALRY_MATCH_REACTION.loserLines.emotional._default) RIVALRY_MATCH_REACTION.loserLines.emotional._default = [];
RIVALRY_MATCH_REACTION.loserLines.emotional._default.push('うぅっ…悔しいっ…次は絶対に…絶対に勝つから…っ!');
if (!RIVALRY_MATCH_REACTION.loserLines.emotional) RIVALRY_MATCH_REACTION.loserLines.emotional = {};
if (!RIVALRY_MATCH_REACTION.loserLines.emotional.seductive) RIVALRY_MATCH_REACTION.loserLines.emotional.seductive = [];
RIVALRY_MATCH_REACTION.loserLines.emotional.seductive.push('悔しい…っ…次は絶対に…絶対に負けないわ…っ!');
if (!RIVALRY_MATCH_REACTION.loserLines.emotional) RIVALRY_MATCH_REACTION.loserLines.emotional = {};
if (!RIVALRY_MATCH_REACTION.loserLines.emotional.composed) RIVALRY_MATCH_REACTION.loserLines.emotional.composed = [];
RIVALRY_MATCH_REACTION.loserLines.emotional.composed.push('…っ…悔しい…次は、必ず');

// ─────────────────────────────────────────────────────────────────────────────
// イベントセリフ定数群（旧 ui-common.js の EVENT_QUOTES から分解 / 2026-04-19）
// pickQuote / getTraitQuote / getDraftQuote 等から参照
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_COACH_HIRE_LINES = [
  '一緒に頑張りましょう！期待してください。',
  'お任せください。選手たちを鍛え上げてみせます！',
  'この団体で働けて光栄です。全力でサポートします。',
  '腕が鳴りますね…。素晴らしい選手たちだ。'
];

const EVENT_COACH_FIRE_LINES = [
  'そうですか…。今までありがとうございました。',
  'お世話になりました。選手たちによろしくお伝えください。',
  '残念ですが…また機会があれば。',
];

const EVENT_DRAFT_JOIN_LINES = {
  normal: {
    _default: [
      '\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059\u3002\u7cbe\u4e00\u676f\u9811\u5f35\u308a\u307e\u3059',
      '\u9078\u3093\u3067\u304f\u3060\u3055\u3063\u3066\u3001\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059',
      '\u671f\u5f85\u306b\u5fdc\u3048\u3089\u308c\u308b\u3088\u3046\u3001\u9811\u5f35\u308a\u307e\u3059',
    ],
    ojousama: [
      '\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059\u308f\u3002\u7cbe\u4e00\u676f\u52aa\u3081\u307e\u3059\u306e',
      '\u304a\u9078\u3073\u3044\u305f\u3060\u304d\u3001\u5149\u6804\u3067\u3059\u308f',
    ],
    polite: [
      '\u672c\u65e5\u306f\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3044\u305f\u3057\u307e\u3059',
      '\u304a\u9078\u3073\u3044\u305f\u3060\u304d\u3001\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059',
    ],
    delinquent: [
      '\u3088\u308d\u3057\u304f\u306a\u3002\u66b4\u308c\u3055\u305b\u3066\u3082\u3089\u3046\u305c',
      '\u307e\u3041\u3001\u671f\u5f85\u3057\u3066\u3066\u304f\u308c\u3088',
    ],
    cool: [
      '\u2026\u2026\u3088\u308d\u3057\u304f',
      '\u2026\u2026\u5168\u529b\u3067\u3084\u308b',
    ],
    seductive: [
      '\u3088\u308d\u3057\u304f\u306d\u3002\u671f\u5f85\u306b\u5fdc\u3048\u3066\u3042\u3052\u308b',
      '\u3075\u3075\u3001\u9078\u3093\u3067\u304f\u308c\u3066\u3042\u308a\u304c\u3068\u3046',
    ],
    composed: [
      '\u2026\u3088\u308d\u3057\u304f\u3002\u7cbe\u4e00\u676f\u3084\u308b\u3088',
      '\u2026\u9078\u3093\u3067\u304f\u308c\u3066\u3042\u308a\u304c\u3068\u3046',
    ],
  },
  bold: {
    _default: [
      '\u3066\u3063\u307a\u3093\u3092\u7372\u308a\u306b\u6765\u307e\u3057\u305f\u3002\u3064\u3044\u3066\u304d\u3066\u304f\u3060\u3055\u3044',
      '\u3053\u306e\u56e3\u4f53\u3067\u3001\u5fc5\u305a\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u306b\u306a\u308a\u307e\u3059',
      '\u671f\u5f85\u306a\u3093\u3066\u8efd\u304f\u8d85\u3048\u3066\u307f\u305b\u308b\u3002\u898b\u3066\u3066\u304f\u3060\u3055\u3044',
    ],
    ojousama: [
      '\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u306b\u306a\u308b\u305f\u3081\u306b\u53c2\u308a\u307e\u3057\u305f\u308f\u3002\u3054\u671f\u5f85\u304f\u3060\u3055\u3044\u307e\u305b',
      '\u3066\u3063\u307a\u3093\u306b\u7acb\u3061\u307e\u3059\u308f\u3088\u3002\u5f53\u7136\u3067\u3059\u306e',
    ],
    polite: [
      '\u3066\u3063\u307a\u3093\u3092\u7372\u308b\u305f\u3081\u306b\u53c2\u308a\u307e\u3057\u305f\u3002\u5168\u529b\u3092\u5c3d\u304f\u3057\u307e\u3059',
      '\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u306b\u3001\u5fc5\u305a\u306a\u308a\u307e\u3059',
    ],
    delinquent: [
      '\u66b4\u308c\u307e\u304f\u3063\u3066\u3084\u308b\u305c\u3002\u899a\u609f\u3057\u3068\u3051\u3088',
      '\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u7372\u3063\u3066\u3084\u308b\u304b\u3089\u306a\u3001\u898b\u3068\u3051',
    ],
    cool: [
      '\u2026\u2026\u3066\u3063\u307a\u3093\u3092\u7372\u308b\u3002\u305d\u308c\u3060\u3051\u3060',
      '\u2026\u2026\u7d50\u679c\u3067\u793a\u3059',
    ],
    seductive: [
      '\u30c1\u30e3\u30f3\u30d4\u30aa\u30f3\u3001\u7372\u308a\u306b\u6765\u305f\u306e\u3002\u899a\u609f\u3057\u3066\u3066',
      '\u3053\u306e\u56e3\u4f53\u3001\u79c1\u304c\u76db\u308a\u4e0a\u3052\u3066\u3042\u3052\u308b',
    ],
    composed: [
      '\u2026\u3066\u3063\u307a\u3093\u3092\u7372\u308a\u306b\u6765\u305f\u3002\u3088\u308d\u3057\u304f',
      '\u2026\u671f\u5f85\u306b\u306f\u5fdc\u3048\u308b\u3002\u898b\u3066\u3066\u304f\u308c',
    ],
  },
  quiet: {
    _default: [
      '\u2026\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059',
      '\u2026\u2026\u2026(\u6df1\u3005\u3068\u4e00\u793c)',
      '\u2026\u2026\u5168\u529b\u3067\u3084\u308a\u307e\u3059',
    ],
    ojousama: [
      '\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3044\u305f\u3057\u307e\u3059\u308f',
    ],
    polite: [
      '\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3044\u305f\u3057\u307e\u3059',
    ],
    delinquent: [
      '\u2026\u3088\u308d\u3057\u304f',
    ],
    cool: [
      '\u2026\u2026\u3088\u308d\u3057\u304f',
      '\u2026\u2026\u59cb\u3081\u3088\u3046',
    ],
    seductive: [
      '\u2026\u2026\u3088\u3001\u3088\u308d\u3057\u304f',
    ],
    composed: [
      '\u2026\u3088\u308d\u3057\u304f\u3002\u7cbe\u4e00\u676f\u3084\u308b',
    ],
  },
  earnest: {
    _default: [
      '\u9078\u3093\u3067\u304f\u3060\u3055\u3063\u3066\u3001\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059\uff01 \u7cbe\u4e00\u676f\u9811\u5f35\u308a\u307e\u3059\uff01',
      '\u5730\u9053\u306b\u30b3\u30c4\u30b3\u30c4\u2026\u52aa\u529b\u3067\u5fdc\u3048\u307e\u3059',
      '\u5fdc\u63f4\u3057\u3066\u304f\u308c\u308b\u65b9\u3005\u306e\u305f\u3081\u306b\u3082\u3001\u9811\u5f35\u308a\u307e\u3059',
    ],
    ojousama: [
      '\u304a\u9078\u3073\u3044\u305f\u3060\u304d\u3001\u5149\u6804\u3067\u3059\u308f\u3002\u7cbe\u4e00\u676f\u52aa\u3081\u307e\u3059\u306e',
      '\u671f\u5f85\u306b\u5fdc\u3048\u3089\u308c\u308b\u3088\u3046\u3001\u5168\u529b\u3092\u5c3d\u304f\u3057\u307e\u3059\u308f',
    ],
    polite: [
      '\u304a\u9078\u3073\u3044\u305f\u3060\u304d\u3001\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059\u3002\u7cbe\u4e00\u676f\u9811\u5f35\u308a\u307e\u3059',
      '\u3054\u671f\u5f85\u306b\u5fdc\u3048\u3089\u308c\u308b\u3088\u3046\u3001\u52aa\u529b\u3044\u305f\u3057\u307e\u3059',
    ],
    delinquent: [
      '\u9078\u3093\u3067\u304f\u308c\u3066\u3042\u308a\u304c\u3068\u306a\uff01 \u30b3\u30c4\u30b3\u30c4\u9811\u5f35\u308b\u304b\u3089\u3088',
    ],
    cool: [
      '\u2026\u2026\u5fdc\u3048\u308b\u3002\u52aa\u529b\u3067',
    ],
    seductive: [
      '\u9078\u3093\u3067\u304f\u308c\u3066\u3042\u308a\u304c\u3068\u3046\u3002\u671f\u5f85\u306b\u5fdc\u3048\u308b\u308f',
    ],
    composed: [
      '\u2026\u9078\u3093\u3067\u304f\u308c\u3066\u3042\u308a\u304c\u3068\u3046\u3002\u30b3\u30c4\u30b3\u30c4\u9811\u5f35\u308b\u3088',
    ],
  },
  emotional: {
    _default: [
      '\u3046\u3045\u3063\u2026\u3053\u306e\u65e5\u3092\u3001\u305a\u3063\u3068\u5922\u898b\u3066\u3044\u307e\u3057\u305f\u2026\uff01',
      '\u5b09\u3057\u3044\u3067\u3059\u2026\uff01 \u9811\u5f35\u308a\u307e\u3059\u2026\uff01 \u7d76\u5bfe\u306b\u2026\uff01',
      '\u305a\u3063\u3068\u2026\u305a\u3063\u3068\u5f85\u3063\u3066\u307e\u3057\u305f\u2026\uff01 \u5168\u529b\u3067\u3001\u9811\u5f35\u308a\u307e\u3059\u2026\uff01',
    ],
    ojousama: [
      '\u3046\u3045\u3063\u2026\u5922\u306e\u3088\u3046\u3067\u3059\u308f\u2026\uff01 \u7cbe\u4e00\u676f\u9811\u5f35\u308a\u307e\u3059\u306e\u2026\uff01',
    ],
    polite: [
      '\u3046\u3001\u3046\u3045\u2026\u3063\u2026\u305a\u3063\u3068\u3001\u5922\u3067\u3057\u305f\u2026\uff01 \u9811\u5f35\u308a\u307e\u3059\u2026\uff01',
    ],
    delinquent: [
      '\u3046\u304a\u3063\u2026\uff01 \u3084\u3063\u305f\u2026\uff01 \u305a\u3063\u3068\u3053\u306e\u65e5\u3092\u5f85\u3063\u3066\u305f\u2026\uff01',
    ],
    cool: [
      '\u2026\u2026\u3063\u2026\u3053\u306e\u65e5\u3092\u3001\u5f85\u3063\u3066\u3044\u305f',
    ],
    seductive: [
      '\u2026\u3063\u2026\u5922\u307f\u305f\u3044\u3002\u7cbe\u4e00\u676f\u9811\u5f35\u308b\u308f\u2026',
    ],
    composed: [
      '\u2026\u3063\u2026\u305a\u3063\u3068\u3001\u3053\u306e\u65e5\u3092\u5f85\u3063\u3066\u305f\u3002\u9811\u5f35\u308b\u3088',
    ],
  },
  easygoing: {
    _default: [
      '\u3044\u3084\u30fc\u3001\u3084\u3063\u3068\u3060\u306d\u3002\u3088\u308d\u3057\u304f\u301c',
      '\u3048\u3078\u3078\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u30fc\u3059',
      '\u307f\u3093\u306a\u3068\u697d\u3057\u304f\u3084\u308a\u305f\u3044\u306a\u3002\u3088\u308d\u3057\u304f\u306d',
    ],
    ojousama: [
      '\u3075\u3075\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059\u308f\u3041',
      '\u304a\u4ef2\u9593\u5165\u308a\u3067\u3059\u308f\u306d\u3002\u3088\u308d\u3057\u304f\u3067\u3059\u306e',
    ],
    polite: [
      '\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059\u306d\u301c \u697d\u3057\u307f\u3067\u3059',
    ],
    delinquent: [
      '\u3088\u3063\u3001\u3088\u308d\u3057\u304f\u306a! \u697d\u3057\u304f\u3084\u308d\u3046\u305c',
    ],
    cool: [
      '\u2026\u3046\u3093\u3001\u3088\u308d\u3057\u304f',
    ],
    seductive: [
      '\u3075\u3075\u3001\u3088\u308d\u3057\u304f\u306d\u3002\u697d\u3057\u304f\u3084\u308a\u307e\u3057\u3087',
    ],
    composed: [
      '\u2026\u3088\u308d\u3057\u304f\u3002\u697d\u3057\u304f\u3084\u308d\u3046\u306d',
    ],
  },
  shy: {
    _default: [
      '\u3042\u3001\u3042\u306e\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059\u2026\uff01',
      '\u3046\u3001\u3046\u3045\u2026\u304c\u3001\u9811\u5f35\u308a\u307e\u3059\u2026\uff01',
      '\u2026\u3063\u3001\u3088\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059\u2026',
    ],
    ojousama: [
      '\u3042\u3001\u3042\u306e\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3044\u305f\u3057\u307e\u3059\u308f\u2026',
    ],
    polite: [
      '\u3042\u3001\u3042\u306e\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3044\u305f\u3057\u307e\u3059\u2026',
    ],
    delinquent: [
      '\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u2026\u304c\u3001\u9811\u5f35\u308b\u2026',
    ],
    cool: [
      '\u2026\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u2026',
    ],
    seductive: [
      '\u2026\u3042\u3001\u3042\u306e\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u306d\u2026',
    ],
    composed: [
      '\u2026\u3088\u3001\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3057\u307e\u3059',
    ],
  },
};

const EVENT_DRAFT_INTEREST_LINES = {
  normal: {
    _default: ['よろしくお願いします。精一杯やります', '選んでいただけたら、全力で頑張ります'],
    ojousama: ['お選びいただけるなら、精一杯努めますわ'],
    delinquent: ['選んでくれるなら、全力で暴れるぜ'],
    seductive: ['選んでくれるなら…期待に応えるわよ'],
    composed: ['…選んでくれるなら、応えるよ'],
  },
  bold: {
    _default: ['てっぺんを獲る。それ以外に興味はない', '私を選んでくれるなら、絶対に後悔はさせない！'],
    ojousama: ['頂点に立つために参りますわ。覚悟はよろしくて？'],
    delinquent: ['選ぶなら覚悟しろよ。手加減なんかしねえからな'],
    cool: ['…闘わせてくれ。結果で語る'],
    seductive: ['私を選んで。後悔はさせないわ'],
    composed: ['…てっぺんを獲りに来た。それだけ'],
  },
  quiet: {
    _default: ['………よろしくお願いします'],
    cool: ['…戦わせてくれるなら、応える'],
    polite: ['…選んでいただけたら、精一杯やらせていただきます'],
    composed: ['……よろしく'],
  },
  shy: {
    _default: ['あ、あの…私なんかで良ければ…が、頑張ります…'],
  },
  easygoing: {
    _default: ['えへへ、一緒に楽しくやりましょうよ！', '退屈なプロレスはしないって約束するよ！'],
    delinquent: ['楽しくやろうぜ！退屈なのは嫌いだからな！'],
    seductive: ['一緒に楽しい団体を作りましょう？'],
    composed: ['…楽しくやろう。退屈にはさせないよ'],
  },
  earnest: {
    _default: ['地道にコツコツ…それが私のやり方です。信じてもらえますか？', '誰よりも練習します。見ていてください'],
    polite: ['地道に努力するのが取り柄です。信じていただけますか'],
    ojousama: ['コツコツ積み重ねるのが信条ですの。見ていてくださいませ'],
    seductive: ['地道に頑張るタイプよ。見ていてくれる？'],
    composed: ['…コツコツやるタイプだ。見ていてくれれば'],
  },
  emotional: {
    _default: ['選んでくれたら…全力で…全力で頑張ります…！'],
    composed: ['…っ…選んでくれたら、全力で応える'],
  },
};

const EVENT_INJURY_LINES = {
  normal: {
    _default: [
      '\u3046\u3045\u2026\u75db\u3044\u2026\u3002\u3067\u3082\u3001\u3059\u3050\u623b\u308a\u307e\u3059',
      '\u3057\u3070\u3089\u304f\u304a\u4f11\u307f\u3092\u3044\u305f\u3060\u304d\u307e\u3059',
      '\u3054\u3081\u3093\u306a\u3055\u3044\u2026\u4f53\u304c\u8a00\u3046\u3053\u3068\u3092\u805e\u304b\u306a\u304f\u3066',
    ],
    ojousama: [
      '\u3053\u306e\u304f\u3089\u3044\u3001\u305f\u3044\u3057\u305f\u3053\u3068\u3054\u3056\u3044\u307e\u305b\u3093\u308f',
      '\u5c11\u3057\u3060\u3051\u4f11\u307e\u305b\u3066\u304f\u3060\u3055\u3044\u307e\u3057',
    ],
    polite: [
      '\u3054\u8ff7\u60d1\u3092\u304a\u304b\u3051\u3057\u307e\u3059\u2026\u3057\u3070\u3089\u304f\u4f11\u307f\u307e\u3059',
      '\u3059\u307f\u307e\u305b\u3093\u2026\u4e07\u5168\u306e\u72b6\u614b\u3067\u623b\u3063\u3066\u304d\u307e\u3059',
    ],
    delinquent: [
      '\u3061\u3063\u2026\u3084\u3063\u3061\u307e\u3063\u305f\u304b',
      '\u3053\u3093\u306a\u3093\u3067\u4f11\u3080\u306e\u3001\u30ab\u30c3\u30b3\u60aa\u3044\u306a',
    ],
    cool: [
      '\u2026\u2026\u3059\u3050\u623b\u308b',
      '\u2026\u2026\u5fc3\u914d\u306f\u3044\u3089\u306a\u3044',
    ],
    seductive: [
      '\u2026\u3061\u3087\u3063\u3068\u3060\u3051\u3001\u4f11\u307e\u305b\u3066\u306d',
      '\u3059\u3050\u306b\u623b\u308b\u308f\u3002\u5f85\u3063\u3066\u3066\u304f\u308c\u308b\uff1f',
    ],
    composed: [
      '\u2026\u5c11\u3057\u4f11\u3080\u3088\u3002\u3059\u3050\u623b\u308b',
      '\u2026\u5927\u3057\u305f\u3053\u3068\u3058\u3083\u306a\u3044\u304b\u3089\u3001\u5b89\u5fc3\u3057\u3066',
    ],
  },
  bold: {
    _default: [
      '\u304f\u3063\u2026\u3053\u3093\u306a\u3068\u3053\u308d\u3067\u6b62\u3081\u3089\u308c\u308b\u304b\uff01',
      '\u3053\u306e\u7a0b\u5ea6\u3001\u554f\u984c\u3058\u3083\u306a\u3044',
      '\u65e9\u304f\u623b\u308b\u3002\u7d76\u5bfe\u306b\u9045\u308c\u3092\u53d6\u308b\u3082\u3093\u304b',
    ],
    ojousama: [
      '\u3053\u306e\u304f\u3089\u3044\u4f55\u3067\u3082\u3042\u308a\u307e\u305b\u3093\u308f\u3002\u3059\u3050\u623b\u308a\u307e\u3059\u306e',
      '\u79c1\u3092\u6b62\u3081\u308b\u306b\u306f\u8db3\u308a\u307e\u305b\u3093\u308f\u3088',
    ],
    polite: [
      '\u3054\u5fc3\u914d\u306a\u304f\u3002\u5fc5\u305a\u623b\u3063\u3066\u304d\u307e\u3059',
      '\u3053\u306e\u7a0b\u5ea6\u3067\u6b62\u307e\u308b\u6c17\u306f\u3042\u308a\u307e\u305b\u3093',
    ],
    delinquent: [
      '\u3061\u304f\u3057\u3087\u3046\u2026\uff01 \u305c\u3063\u3066\u3047\u623b\u3063\u3066\u304f\u308b\u304b\u3089\u306a\uff01',
      '\u3053\u3093\u306a\u3093\u3067\u7d42\u308f\u3063\u3066\u305f\u307e\u308b\u304b\u3088',
    ],
    cool: [
      '\u2026\u2026\u3053\u306e\u7a0b\u5ea6\u3067\u6b62\u307e\u3089\u306a\u3044',
      '\u2026\u2026\u623b\u308b\u3002\u305d\u308c\u3060\u3051\u3060',
    ],
    seductive: [
      '\u3053\u3093\u306a\u3053\u3068\u3067\u6b62\u307e\u308b\u3068\u601d\u3063\u3066\u308b\uff1f \u7518\u3044\u308f',
      '\u3059\u3050\u623b\u308b\u308f\u3002\u899a\u609f\u3057\u3066\u306a\u3055\u3044',
    ],
    composed: [
      '\u2026\u6b62\u307e\u308b\u308f\u3051\u306b\u306f\u3044\u304b\u306a\u3044\u3002\u3059\u3050\u623b\u308b',
      '\u2026\u554f\u984c\u306a\u3044\u3002\u5c11\u3057\u4f11\u3081\u3070\u6cbb\u308b',
    ],
  },
  quiet: {
    _default: [
      '\u2026\u2026',
      '\u2026(\u9759\u304b\u306b\u982d\u3092\u4e0b\u3052\u308b)',
      '\u2026\u3054\u3081\u3093',
    ],
    ojousama: [
      '\u2026\u3054\u8ff7\u60d1\u3092\u3001\u304a\u304b\u3051\u3057\u307e\u3059\u308f',
    ],
    polite: [
      '\u2026\u3054\u8ff7\u60d1\u3092\u3001\u304a\u304b\u3051\u3057\u307e\u3059',
    ],
    delinquent: [
      '\u2026\u3061\u3063',
    ],
    cool: [
      '\u2026\u2026',
      '\u2026\u2026\u3059\u3050\u623b\u308b',
    ],
    seductive: [
      '\u2026\u2026\u5f85\u3063\u3066\u3066\u306d',
    ],
    composed: [
      '\u2026\u623b\u308b\u3002\u5f85\u3063\u3066\u3066\u304f\u308c',
    ],
  },
  earnest: {
    _default: [
      '\u3054\u671f\u5f85\u306b\u5fdc\u3048\u3089\u308c\u305a\u3001\u3059\u307f\u307e\u305b\u3093\u2026',
      '\u5fc5\u305a\u4e07\u5168\u306e\u72b6\u614b\u3067\u623b\u3063\u3066\u304d\u307e\u3059',
      '\u5fdc\u63f4\u3057\u3066\u304f\u308c\u308b\u307f\u3093\u306a\u306b\u3001\u7533\u3057\u8a33\u306a\u3044\u2026',
    ],
    ojousama: [
      '\u3054\u671f\u5f85\u306b\u6dfb\u3048\u305a\u3001\u7533\u3057\u8a33\u3042\u308a\u307e\u305b\u3093\u308f',
      '\u5fc5\u305a\u3001\u5f37\u304f\u306a\u3063\u3066\u623b\u3063\u3066\u307e\u3044\u308a\u307e\u3059\u306e',
    ],
    polite: [
      '\u3054\u671f\u5f85\u306b\u5fdc\u3048\u3089\u308c\u305a\u3001\u7533\u3057\u8a33\u3042\u308a\u307e\u305b\u3093',
      '\u5fc5\u305a\u5f37\u304f\u306a\u3063\u3066\u623b\u3063\u3066\u307e\u3044\u308a\u307e\u3059',
    ],
    delinquent: [
      '\u5fdc\u63f4\u3057\u3066\u304f\u308c\u3066\u308b\u5974\u3089\u306b\u3001\u9854\u5411\u3051\u3067\u304d\u306d\u3048\u2026',
    ],
    cool: [
      '\u2026\u2026\u7533\u3057\u8a33\u306a\u3044\u3002\u5fc5\u305a\u623b\u308b',
    ],
    seductive: [
      '\u5fdc\u63f4\u3057\u3066\u304f\u308c\u3066\u308b\u4eba\u306b\u7533\u3057\u8a33\u306a\u3044\u308f\u2026\u5fc5\u305a\u623b\u308b',
    ],
    composed: [
      '\u2026\u5fdc\u63f4\u306b\u5fdc\u3048\u3089\u308c\u306a\u304f\u3066\u3001\u3054\u3081\u3093\u3002\u5fc5\u305a\u623b\u308b\u3088',
    ],
  },
  emotional: {
    _default: [
      '\u304f\u3045\u3063\u2026\u75db\u3044\u2026\uff01 \u3067\u3082\u3001\u7d76\u5bfe\u623b\u308a\u307e\u3059\u2026\uff01',
      '\u3046\u3045\u2026\u3053\u3093\u306a\u306e\u6094\u3057\u3044\u2026\uff01',
      '\u3061\u304f\u3057\u3087\u3046\u2026\uff01 \u7d76\u5bfe\u306b\u3001\u7d76\u5bfe\u306b\u623b\u308b\u2026\uff01',
    ],
    ojousama: [
      '\u6094\u3057\u3044\u3067\u3059\u308f\u2026\uff01 \u5fc5\u305a\u623b\u308a\u307e\u3059\u306e\u2026\uff01',
    ],
    polite: [
      '\u2026\u3063\u3001\u6094\u3057\u3044\u3067\u3059\u2026\u3067\u3082\u3001\u5fc5\u305a\u623b\u308a\u307e\u3059\u2026\uff01',
    ],
    delinquent: [
      '\u3061\u304f\u3057\u3087\u3046\u2026\uff01 \u3046\u3063\u2026\uff01 \u7d76\u5bfe\u306b\u623b\u308b\u305e\u2026\uff01',
    ],
    cool: [
      '\u2026\u2026\u3063\u2026\u304f\u305d\u3002\u5fc5\u305a\u623b\u308b',
    ],
    seductive: [
      '\u2026\u3063\u2026\u6094\u3057\u3044\u2026\u5fc5\u305a\u623b\u3063\u3066\u3084\u308b\u2026',
    ],
    composed: [
      '\u2026\u3063\u2026\u6094\u3057\u3044\u3002\u3067\u3082\u3001\u5fc5\u305a\u623b\u308b',
    ],
  },
  easygoing: {
    _default: [
      '\u3084\u3063\u3061\u3083\u3063\u305f\u30fc\u3002\u3061\u3087\u3063\u3068\u4f11\u3080\u306d',
      '\u3048\u3078\u3078\u2026\u3054\u3081\u3093\u3001\u3061\u3087\u3063\u3068\u4f11\u3080\u3088',
      '\u307e\u3041\u3001\u3053\u3046\u3044\u3046\u6642\u3082\u3042\u308b\u3088\u306d\u3002\u3059\u3050\u623b\u308b\u304b\u3089',
    ],
    ojousama: [
      '\u3042\u3089\u3042\u3089\u2026\u5c11\u3057\u4f11\u307f\u307e\u3059\u308f\u306d',
    ],
    polite: [
      '\u3042\u3001\u3061\u3087\u3063\u3068\u4f11\u307f\u307e\u3059\u306d\u301c \u3059\u3050\u623b\u308a\u307e\u3059',
    ],
    delinquent: [
      '\u3084\u3063\u3061\u307e\u3063\u305f\u305c\u301c \u307e\u3041\u3059\u3050\u623b\u308b\u308f',
    ],
    cool: [
      '\u2026\u3061\u3087\u3063\u3068\u4f11\u3080\u3002\u3059\u3050\u623b\u308b\u3088',
    ],
    seductive: [
      '\u3061\u3087\u3063\u3068\u4f11\u61a9\u306d\uff1f \u3059\u3050\u623b\u308b\u304b\u3089\u5bc2\u3057\u304c\u3089\u306a\u3044\u3067',
    ],
    composed: [
      '\u2026\u307e\u3001\u3059\u3050\u623b\u308b\u3088\u3002\u5fc3\u914d\u3057\u306a\u3044\u3067',
    ],
  },
  shy: {
    _default: [
      '\u3054\u3001\u3054\u3081\u3093\u306a\u3055\u3044\u2026\u3061\u3087\u3063\u3068\u4f11\u307f\u307e\u3059\u2026',
      '\u3046\u3001\u3046\u3045\u2026\u75db\u3044\u3067\u3059\u2026',
      '\u3059\u3001\u3059\u307f\u307e\u305b\u3093\u2026\u3054\u8ff7\u60d1\u3092\u2026',
    ],
    ojousama: [
      '\u3054\u3001\u3054\u3081\u3093\u306a\u3055\u3044\u307e\u305b\u2026\u5c11\u3057\u3060\u3051\u3001\u4f11\u307e\u305b\u3066\u304f\u3060\u3055\u3044\u307e\u3057\u2026',
    ],
    polite: [
      '\u3059\u3001\u3059\u307f\u307e\u305b\u3093\u2026\u5c11\u3057\u3060\u3051\u4f11\u307e\u305b\u3066\u304f\u3060\u3055\u3044\u2026',
    ],
    delinquent: [
      '\u2026\u3054\u3001\u3054\u3081\u3093\u2026\u3061\u3087\u3063\u3068\u4f11\u3080\u2026',
    ],
    cool: [
      '\u2026\u2026\u3054\u3001\u3054\u3081\u3093\u2026',
    ],
    seductive: [
      '\u2026\u3054\u3001\u3054\u3081\u3093\u306d\u2026\u5c11\u3057\u3060\u3051\u2026\u4f11\u307e\u305b\u3066\u2026',
    ],
    composed: [
      '\u2026\u3059\u3001\u3059\u307f\u307e\u305b\u3093\u3002\u5c11\u3057\u4f11\u307f\u307e\u3059',
    ],
  },
};

const EVENT_TITLE_WIN_LINES = {
  normal: {
    _default: ['やった…！チャンピオンになれた…！夢みたい！', 'このベルト、絶対に手放しません！', '最高の気分です！応援ありがとうございます！'],
    ojousama: ['チャンピオンですわ…！夢のようですわね…！'],
    delinquent: ['やったぜ！チャンピオンだ！最高！'],
    seductive: ['チャンピオン…最高の気分ね'],
    composed: ['…チャンピオンか。…悪くないね'],
  },
  bold: {
    _default: ['てっぺんに立った。でもまだ足りない…もっと上へ', 'この炎は消えない。ベルトを懸けて、もっと熱い闘いを！'],
    ojousama: ['頂点に立ちましたわ。でもここからが本当の闘いですの'],
    delinquent: ['やっと獲ったぜ！次は誰が来ても負けねえ！'],
    cool: ['…当然だ。この座は私のためにある'],
    seductive: ['これが始まりよ。このベルトで時代を作る'],
    composed: ['…頂点。…でもまだ先がある'],
  },
  quiet: {
    _default: ['………（ベルトを抱きしめている）'],
    cool: ['…ようやくだ。この座は渡さない'],
    polite: ['…ありがとうございます…（涙をこらえている）'],
    composed: ['……（静かにベルトを見つめている）'],
  },
  shy: {
    _default: ['え…わ、私が…チャンピオン…？ 夢みたい…'],
  },
  easygoing: {
    _default: ['新チャンピオン誕生！みんな、これからもっと盛り上がるよ！', 'ベルト獲っちゃった！最高！'],
    delinquent: ['チャンピオンだぜー！最高だろ！'],
    seductive: ['ベルトが似合うのは私だけでしょ？ ふふ'],
    composed: ['…チャンピオンだ。…いい気分だね'],
  },
  earnest: {
    _default: ['コツコツ積み重ねてきて…よかった。本当に、よかった…！', '諦めなくてよかった…このベルト、努力の結晶です'],
    polite: ['積み重ねが報われました…本当に、ありがとうございます'],
    ojousama: ['努力が報われましたわ…！このベルト、大切にしますの'],
    seductive: ['積み重ねてきて…よかった。このベルト、大切にするわ'],
    composed: ['…積み重ねてきたものが、ここに。…大切にする'],
  },
  emotional: {
    _default: ['うわああ…！チャンピオン…！嬉しい…泣いちゃう…！'],
    composed: ['…っ…チャンピオン。…嬉しい'],
  },
};

const EVENT_TITLE_DEFENSE_LINES = {
  normal: {
    _default: ['防衛成功…！ほっとした…。でも、もっと強くならないと。', 'このベルトの重さ、守るたびに感じます。'],
    ojousama: ['防衛いたしましたわ。この座、まだまだ譲りませんの'],
    delinquent: ['防衛だ！まだまだ渡さねーぞ！'],
    seductive: ['防衛成功…。このベルト、まだ返す気はないわ'],
    composed: ['…防衛か。…まだ渡すつもりはないよ'],
  },
  bold: {
    _default: ['まだ誰にもこの座は譲れない。もっと来い！', '防衛は通過点。私が目指すのはもっと先だ'],
    ojousama: ['まだ誰にもお譲りしませんわ。もっと上を目指しますの'],
    delinquent: ['まだまだ負けるわけねーだろ！かかってこい！'],
    cool: ['…格が違う。それだけのことだ'],
    seductive: ['まだ誰も私を超えられないわね。当然でしょう'],
    composed: ['…まだ渡さない。…当然だね'],
  },
  quiet: {
    _default: ['………（静かにベルトを見つめている）'],
    cool: ['…次も勝つ。それだけだ'],
    polite: ['…守れました。次も、頑張ります'],
    composed: ['……守った。…それだけ'],
  },
  shy: {
    _default: ['よ、よかった…守れた…（ほっとしている）'],
  },
  easygoing: {
    _default: ['チャンピオンは私！また守り切っちゃいました！', 'いい試合だった！また挑戦してきてね！'],
    delinquent: ['まだまだ渡さねーよ！最高！'],
    seductive: ['防衛って地味に見える？ ふふ、そんなことないでしょ？'],
    composed: ['…防衛。…まあ、こんなもんかな'],
  },
  earnest: {
    _default: ['防衛できた…！でも満足しない。もっと強くなります', '日々の積み重ねが結果に出てくれた'],
    polite: ['防衛できました。でも、まだまだ精進いたします'],
    ojousama: ['防衛できましたわ。でもまだ満足はしませんの'],
    seductive: ['防衛できたわ…でも満足しない。もっと強くなる'],
    composed: ['…防衛できた。…でもまだ満足はしない'],
  },
  emotional: {
    _default: ['守れた…！嬉しい…！次も絶対守る…！'],
    composed: ['…っ…守れた。…よかった'],
  },
};

const EVENT_TITLE_CHALLENGE_LOSS_LINES = {
  normal: {
    _default: ['悔しい…。でも、いい経験になりました。次こそは…！', 'まだ実力が足りなかった…。もっと強くなって帰ってきます。'],
    ojousama: ['悔しゅうございますわ…でも、次こそは…'],
    delinquent: ['くそっ…次は絶対勝つ…！'],
    seductive: ['悔しいわ…でも、次こそはね'],
    composed: ['…届かなかったか。…次だね'],
  },
  bold: {
    _default: ['くっ…！こんなの認めない！もう一回やらせてくれ！', '…今日は認める。でもこの借りは必ず返す'],
    ojousama: ['認めませんわ…！もう一度お願いいたします！'],
    delinquent: ['こんなの認めねえ！もう一回だ！'],
    cool: ['…次はない。次で、終わらせる'],
    seductive: ['…今日は認めるわ。でもこの借り、必ず返す'],
    composed: ['…認める。…でもこの借りは返す'],
  },
  quiet: {
    _default: ['………（唇を噛んでいる）'],
    cool: ['…次で終わらせる'],
    polite: ['…悔しいです。でも、もう一度挑戦します'],
    composed: ['……足りなかった'],
  },
  shy: {
    _default: ['…ごめんなさい…でも…諦めたくない…です…'],
  },
  easygoing: {
    _default: ['今日は負けちゃったけど…次はもっといい試合するから！', '悔しいけど、下向いてたら応援してくれる人に失礼だもんね'],
    delinquent: ['くそー！悔しい！でも次やってやるからな！'],
    seductive: ['今日は負けちゃったわね。次はもっと輝くから見ていて'],
    composed: ['…負けちゃったか。…まあ次があるよ'],
  },
  earnest: {
    _default: ['…足りなかった。もっと練習して、必ずもう一度挑戦します', '悔しい…でもここで腐っちゃだめだ'],
    polite: ['実力が足りませんでした。もっと精進いたします'],
    ojousama: ['実力が足りませんでしたわ…もっと精進いたしますの'],
    seductive: ['足りなかったわ…でも、もう一度挑戦する'],
    composed: ['…足りなかった。…もっと積み重ねるよ'],
  },
  emotional: {
    _default: ['悔しい…！悔しい…！でも…絶対諦めない…！'],
    composed: ['…っ…悔しい。…でも、諦めない'],
  },
};

const EVENT_TITLE_LOSS_LINES = {
  normal: {
    _default: ['ベルトを失ってしまった…。でも、この団体で戦い続けます。', '…悔しい。チャンピオンとしてもっとやれたはずなのに。'],
    ojousama: ['ベルトを失いましたわ…でも、ここで終わりではありませんの'],
    delinquent: ['くそ…ベルト取られた…でも終わりじゃねえ'],
    seductive: ['ベルトがない景色なんて…でも、ここで終わらないわ'],
    composed: ['…失ったか。…でも終わりじゃない'],
  },
  bold: {
    _default: ['嘘だろ…！私のベルトが…！絶対に取り返す！', 'ベルトを失った…でもこの悔しさが次の炎になる'],
    ojousama: ['認めませんわ…！必ず取り返しますの！'],
    delinquent: ['こんなの認めねえ！絶対取り返す！'],
    cool: ['……次は、容赦しない'],
    seductive: ['…覚えておきなさい。すぐに返してもらうわ'],
    composed: ['…取り返す。…覚えておいて'],
  },
  quiet: {
    _default: ['……今は…一人にしてください'],
    cool: ['…認めよう。だが、終わりではない'],
    polite: ['…申し訳ございません。でも…もう一度…'],
    composed: ['……（静かにベルトを見送っている）'],
  },
  shy: {
    _default: ['…ごめんなさい…ベルト…守れなかった…'],
  },
  easygoing: {
    _default: ['負けちゃった…でもファンが応援してくれる限り、立ち上がるよ', '…ベルトがない自分なんて想像できなかった。でも、私は私だから'],
    delinquent: ['くそー！でもまだ終わってねえから！'],
    seductive: ['負けちゃったわね…でも私は私。立ち上がるわ'],
    composed: ['…ベルトがない景色か。…まあ、立ち上がるよ'],
  },
  earnest: {
    _default: ['…努力が足りなかったんだ。もう一度、一からやり直します', 'ベルトを手放してしまった…でもここで終わりじゃない'],
    polite: ['努力が足りませんでした。一から出直します'],
    ojousama: ['実力が足りませんでしたわ。一から出直しますの'],
    seductive: ['足りなかった…でも、ここで終わりにはしないわ'],
    composed: ['…足りなかった。…一からやり直そう'],
  },
  emotional: {
    _default: ['嘘…嘘だよ…ベルトが…！でも…でも諦めない…！'],
    composed: ['…っ…ベルトが…。…取り戻す'],
  },
};

const EVENT_RELEASE_LINES = {
  normal: {
    _default: [
      '\u305d\u3046\u2026\u3067\u3059\u304b\u3002\u3053\u3053\u3067\u306e\u601d\u3044\u51fa\u3001\u5fd8\u308c\u307e\u305b\u3093',
      '\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u2026',
      '\u6094\u3057\u3044\u3067\u3059\u2026\u3067\u3082\u3001\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f',
    ],
    ojousama: [
      '\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u308f\u3002\u611f\u8b1d\u3057\u3066\u304a\u308a\u307e\u3059\u306e',
      '\u3053\u306e\u56e3\u4f53\u3067\u306e\u65e5\u3005\u3001\u5fd8\u308c\u307e\u305b\u3093\u308f',
    ],
    polite: [
      '\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u3002\u672c\u5f53\u306b\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f',
      '\u77ed\u3044\u9593\u3067\u3057\u305f\u304c\u3001\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f',
    ],
    delinquent: [
      '\u305d\u3046\u304b\u2026\u307e\u3041\u3001\u7e01\u304c\u306a\u304b\u3063\u305f\u3063\u3066\u3053\u3068\u3060\u308d',
      '\u4e16\u8a71\u306b\u306a\u3063\u305f\u306a\u3002\u3069\u3063\u304b\u3067\u898b\u3066\u308d\u3088',
    ],
    cool: [
      '\u2026\u2026\u305d\u3046\u304b\u3002\u304a\u4e16\u8a71\u306b\u306a\u3063\u305f',
      '\u2026\u2026\u3053\u3053\u3067\u306e\u7d4c\u9a13\u306f\u3001\u5fd8\u308c\u306a\u3044',
    ],
    seductive: [
      '\u3053\u3053\u3067\u306e\u601d\u3044\u51fa\u3001\u5927\u5207\u306b\u3059\u308b\u308f',
      '\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u3002\u307e\u305f\u3001\u3069\u3053\u304b\u3067',
    ],
    composed: [
      '\u2026\u305d\u3046\u304b\u3002\u304a\u4e16\u8a71\u306b\u306a\u3063\u305f\u306d',
      '\u2026\u77ed\u3044\u9593\u3060\u3063\u305f\u3051\u3069\u3001\u3042\u308a\u304c\u3068\u3046',
    ],
  },
  bold: {
    _default: [
      '\u308f\u304b\u3063\u305f\u3002\u3069\u3053\u304b\u3067\u5f37\u304f\u306a\u3063\u3066\u623b\u308b',
      '\u6094\u3057\u3044\u3051\u3069\u2026\u6b21\u306e\u5834\u6240\u3067\u8a3c\u660e\u3057\u3066\u307f\u305b\u308b',
      '\u3053\u3053\u3067\u7d42\u308f\u308b\u3064\u3082\u308a\u306f\u306a\u3044\u3002\u7d76\u5bfe\u306b\u9019\u3044\u4e0a\u304c\u308b',
    ],
    ojousama: [
      '\u6094\u3057\u3044\u3067\u3059\u304c\u2026\u6b21\u306e\u5834\u6240\u3067\u5fc5\u305a\u8a3c\u660e\u3044\u305f\u3057\u307e\u3059\u308f',
      '\u3053\u308c\u3067\u7d42\u308f\u308a\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u308f\u3088',
    ],
    polite: [
      '\u6094\u3057\u3044\u3067\u3059\u2026\u6b21\u306e\u5834\u6240\u3067\u3001\u5fc5\u305a\u8a3c\u660e\u3057\u3066\u307f\u305b\u307e\u3059',
      '\u3053\u306e\u307e\u307e\u3067\u306f\u7d42\u308f\u308a\u307e\u305b\u3093\u3002\u3069\u3053\u304b\u3067\u5fc5\u305a',
    ],
    delinquent: [
      '\u3061\u304f\u3057\u3087\u3046\u2026\u898b\u3068\u3051\u3088\u3001\u7d76\u5bfe\u306b\u623b\u3063\u3066\u304f\u308b\u304b\u3089\u306a',
      '\u6094\u3057\u3044\u305c\u2026\u6b21\u306e\u5834\u6240\u3067\u3076\u3063\u3061\u304e\u3063\u3066\u3084\u308b',
    ],
    cool: [
      '\u2026\u2026\u623b\u3063\u3066\u304f\u308b\u3002\u5fc5\u305a\u3060',
      '\u2026\u2026\u6b21\u306e\u5834\u6240\u3067\u3001\u898b\u8fd4\u3057\u3066\u3084\u308b',
    ],
    seductive: [
      '\u6094\u3057\u3044\u308f\u2026\u3067\u3082\u3001\u3044\u3064\u304b\u5fc5\u305a\u623b\u3063\u3066\u304f\u308b',
      '\u3053\u306e\u501f\u308a\u3001\u3044\u3064\u304b\u8fd4\u3057\u306b\u6765\u308b\u304b\u3089',
    ],
    composed: [
      '\u2026\u6094\u3057\u3044\u306d\u3002\u3067\u3082\u3001\u5fc5\u305a\u623b\u3063\u3066\u304f\u308b',
      '\u2026\u3053\u308c\u3067\u7d42\u308f\u308a\u3058\u3083\u306a\u3044\u3002\u6b21\u3067\u8a3c\u660e\u3059\u308b',
    ],
  },
  quiet: {
    _default: [
      '\u2026\u2026(\u6df1\u304f\u4e00\u793c)',
      '\u2026\u2026\u2026',
      '\u2026\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f',
    ],
    ojousama: [
      '\u2026\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u308f',
    ],
    polite: [
      '\u2026\u304a\u3001\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f',
    ],
    delinquent: [
      '\u2026\u3061\u3063\u2026(\u80cc\u3092\u5411\u3051\u3066\u51fa\u3066\u3044\u304f)',
    ],
    cool: [
      '\u2026\u2026(\u9759\u304b\u306b\u7acb\u3061\u53bb\u308b)',
      '\u2026\u2026\u3042\u308a\u304c\u3068\u3046',
    ],
    seductive: [
      '\u2026\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f(\u3075\u3063\u3068\u76ee\u3092\u4f0f\u305b\u3066)',
    ],
    composed: [
      '\u2026\u3042\u308a\u304c\u3068\u3046\u3002\u4e16\u8a71\u306b\u306a\u3063\u305f',
    ],
  },
  earnest: {
    _default: [
      '\u5fdc\u63f4\u3057\u3066\u304f\u308c\u305f\u7686\u69d8\u306b\u3001\u9854\u5411\u3051\u3067\u304d\u307e\u305b\u3093\u2026\u3067\u3082\u3001\u6b21\u3067\u9811\u5f35\u308a\u307e\u3059',
      '\u3053\u3053\u3067\u306e\u5b66\u3073\u3001\u3069\u3053\u306b\u884c\u3063\u3066\u3082\u5fd8\u308c\u307e\u305b\u3093',
      '\u7d50\u679c\u3092\u6b8b\u305b\u306a\u304f\u3066\u3001\u3059\u307f\u307e\u305b\u3093\u3002\u5fc5\u305a\u3001\u3069\u3053\u304b\u3067',
    ],
    ojousama: [
      '\u5fdc\u63f4\u304f\u3060\u3055\u3063\u305f\u7686\u69d8\u306b\u3001\u7533\u3057\u8a33\u3042\u308a\u307e\u305b\u3093\u308f\u2026\u5fc5\u305a\u6b21\u3067',
    ],
    polite: [
      '\u5fdc\u63f4\u3057\u3066\u304f\u3060\u3055\u3063\u305f\u7686\u69d8\u306b\u3001\u7533\u3057\u8a33\u3042\u308a\u307e\u305b\u3093',
      '\u3053\u3053\u3067\u306e\u5b66\u3073\u3001\u6c7a\u3057\u3066\u5fd8\u308c\u307e\u305b\u3093',
    ],
    delinquent: [
      '\u5fdc\u63f4\u3057\u3066\u304f\u308c\u305f\u5974\u3089\u306b\u7533\u3057\u8a33\u306d\u3048\u2026\u3067\u3082\u3001\u6b21\u3067\u7d76\u5bfe\u306b\u3084\u3063\u3066\u3084\u308b',
    ],
    cool: [
      '\u2026\u2026\u5fdc\u63f4\u3057\u3066\u304f\u308c\u305f\u8005\u305f\u3061\u306b\u3001\u7533\u3057\u8a33\u306a\u3044',
    ],
    seductive: [
      '\u5fdc\u63f4\u3057\u3066\u304f\u308c\u305f\u4eba\u305f\u3061\u306b\u3001\u7533\u3057\u8a33\u306a\u3044\u308f\u2026\u5fc5\u305a\u898b\u8fd4\u3059',
    ],
    composed: [
      '\u2026\u5fdc\u63f4\u3057\u3066\u304f\u308c\u305f\u4eba\u305f\u3061\u306b\u3001\u7533\u3057\u8a33\u306a\u3044\u3002\u6b21\u3067\u5fc5\u305a',
    ],
  },
  emotional: {
    _default: [
      '\u3046\u3045\u3063\u2026\u3053\u3053\u3067\u306e\u65e5\u3005\u3001\u5fd8\u308c\u307e\u305b\u3093\u2026\uff01',
      '\u304f\u3045\u2026\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f\u2026\uff01 \u7d76\u5bfe\u5fd8\u308c\u307e\u305b\u3093\u2026\uff01',
      '\u6094\u3057\u3044\u2026\u3067\u3082\u3001\u3042\u308a\u304c\u3068\u3046\u2026\uff01 \u7d76\u5bfe\u306b\u623b\u3063\u3066\u304f\u308b\u2026\uff01',
    ],
    ojousama: [
      '\u3046\u3045\u3063\u2026\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u308f\u2026\uff01 \u5fd8\u308c\u307e\u305b\u3093\u306e\u2026\uff01',
    ],
    polite: [
      '\u3046\u3045\u2026\u3063\u3001\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f\u2026\uff01 \u5fd8\u308c\u307e\u305b\u3093\u2026\uff01',
    ],
    delinquent: [
      '\u3061\u304f\u3057\u3087\u3046\u2026\uff01 \u3046\u3063\u2026\u3042\u308a\u304c\u3068\u306a\u2026\uff01',
    ],
    cool: [
      '\u2026\u2026\u3063\u2026\u3042\u308a\u304c\u3068\u3046\u3002\u5fd8\u308c\u306a\u3044',
    ],
    seductive: [
      '\u2026\u3063\u2026\u3042\u308a\u304c\u3068\u3046\u2026\u5fd8\u308c\u306a\u3044\u308f\u2026',
    ],
    composed: [
      '\u2026\u3063\u2026\u3042\u308a\u304c\u3068\u3046\u3002\u5fd8\u308c\u306a\u3044\u3088',
    ],
  },
  easygoing: {
    _default: [
      '\u307e\u3041\u3001\u3053\u3046\u3044\u3046\u6642\u3082\u3042\u308b\u3088\u306d\u3002\u307f\u3093\u306a\u3001\u5143\u6c17\u3067\u306d\uff01',
      '\u3048\u3078\u3078\u3001\u3053\u3053\u3067\u306e\u65e5\u3005\u306f\u697d\u3057\u304b\u3063\u305f\u3088\u3002\u3042\u308a\u304c\u3068\u3046',
      '\u7e01\u304c\u306a\u304b\u3063\u305f\u3063\u3066\u3053\u3068\u3060\u306d\u3002\u307e\u3041\u3001\u304a\u5143\u6c17\u3067\u301c',
    ],
    ojousama: [
      '\u3075\u3075\u3001\u3053\u3046\u3044\u3046\u3053\u3068\u3082\u3042\u308a\u307e\u3059\u308f\u306d\u3002\u3054\u304d\u3052\u3093\u3088\u3046',
    ],
    polite: [
      '\u3042\u306f\u306f\u3001\u3054\u7e01\u304c\u306a\u304b\u3063\u305f\u3067\u3059\u306d\u301c \u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f',
    ],
    delinquent: [
      '\u307e\u3041\u3001\u3053\u3093\u306a\u3082\u3093\u304b\u3002\u5143\u6c17\u3067\u3084\u308c\u3088\u301c',
    ],
    cool: [
      '\u2026\u307e\u3041\u3001\u3053\u3093\u306a\u3082\u3093\u3060\u3002\u3042\u308a\u304c\u3068\u3046',
    ],
    seductive: [
      '\u3075\u3075\u3001\u7e01\u304c\u306a\u304b\u3063\u305f\u307f\u305f\u3044\u306d\u3002\u304a\u5143\u6c17\u3067',
    ],
    composed: [
      '\u2026\u307e\u3001\u7e01\u304c\u306a\u304b\u3063\u305f\u3063\u3066\u3053\u3068\u3060\u306d\u3002\u5143\u6c17\u3067',
    ],
  },
  shy: {
    _default: [
      '\u3054\u3001\u3054\u3081\u3093\u306a\u3055\u3044\u2026\u5f79\u306b\u7acb\u3066\u306a\u304f\u3066\u2026',
      '\u3059\u3001\u3059\u307f\u307e\u305b\u3093\u2026\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f\u2026',
      '\u2026\u304a\u3001\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u2026',
    ],
    ojousama: [
      '\u3054\u3001\u3054\u3081\u3093\u306a\u3055\u3044\u307e\u305b\u2026\u5f79\u306b\u7acb\u3066\u305a\u2026',
    ],
    polite: [
      '\u3054\u3001\u3054\u3081\u3093\u306a\u3055\u3044\u2026\u304a\u3001\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u2026',
    ],
    delinquent: [
      '\u2026\u3054\u3001\u3054\u3081\u3093\u2026\u4e16\u8a71\u306b\u306a\u3063\u305f\u2026',
    ],
    cool: [
      '\u2026\u2026\u3054\u3001\u3054\u3081\u3093\u2026\u3042\u308a\u304c\u3068\u3046',
    ],
    seductive: [
      '\u2026\u3054\u3001\u3054\u3081\u3093\u306d\u2026\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f\u2026',
    ],
    composed: [
      '\u2026\u3059\u3001\u3059\u307f\u307e\u305b\u3093\u3002\u304a\u4e16\u8a71\u306b\u306a\u308a\u307e\u3057\u305f',
    ],
  },
};

const EVENT_FA_SIGNING_LINES = {
  normal: {
    _default: ['よろしくお願いします。力になれるよう頑張ります', '新しい環境…悪くないですね。頑張ります'],
    ojousama: ['よろしくお願いいたしますわ。お力になりますの'],
    delinquent: ['よろしくな。暴れさせてもらうぜ'],
    seductive: ['よろしくね。力になるわ'],
    composed: ['…よろしく。力になるよ'],
  },
  bold: {
    _default: ['てっぺんを獲るために来た。わかってるよな？', '新しい闘いの場…！燃えてきた！'],
    ojousama: ['頂点を獲るために参りましたわ。ご期待くださいませ'],
    delinquent: ['やってやるぜ！暴れまくるからな！'],
    cool: ['…戦わせてくれ。結果は出す'],
    seductive: ['てっぺん獲りに来たの。一緒に頂点に立ちましょう'],
    composed: ['…てっぺんを獲りに来た。よろしく'],
  },
  quiet: {
    _default: ['…よろしくお願いします'],
    cool: ['…やる。見ていてくれ'],
    polite: ['…お世話になります。精一杯やらせていただきます'],
    composed: ['……よろしく'],
  },
  shy: {
    _default: ['あ、あの…よろしくお願いします…頑張ります…'],
  },
  easygoing: {
    _default: ['やっほー！新天地だ！暴れまくるよ！', 'ここなら好き放題やれそう！楽しみ！'],
    delinquent: ['よっしゃー！新天地だ！暴れるぞ！'],
    seductive: ['新しい場所ね。楽しみだわ。よろしく'],
    composed: ['…新天地か。…楽しみだね'],
  },
  earnest: {
    _default: ['ありがとうございます…毎日練習して、絶対に期待に応えます！', 'この恩は忘れません。ずっとこの団体で戦います'],
    polite: ['ありがとうございます。期待にお応えいたします'],
    ojousama: ['ありがとうございますわ。ご期待に応えてみせますの'],
    seductive: ['ありがとう。期待に応えるわ'],
    composed: ['…期待に応えるよ。…コツコツやる'],
  },
  emotional: {
    _default: ['ありがとうございます…！嬉しい…！全力で頑張ります…！'],
    composed: ['…っ…ありがとう。全力でやる'],
  },
};

const EVENT_FA_SIGNING_GENERIC_LINES = [
  'この団体で新しいスタートです。よろしくお願いします！',
  '契約ありがとうございます！全力で戦います！',
  '新しい仲間ができて嬉しいです。頑張ります！',
];

const EVENT_FA_WELCOME_LINES = {
  normal: {
    _default: ['よろしくお願いします。頑張ります', '力になれるよう、精一杯やります'],
    ojousama: ['よろしくお願いいたしますわ。精一杯務めますの'],
    delinquent: ['よろしくな！ガンガンやるぜ'],
    seductive: ['よろしくね。精一杯やるわ'],
    composed: ['…よろしく。精一杯やるよ'],
  },
  bold: {
    _default: ['頂点まで一直線だ。邪魔はさせない', '燃えてきた…！早く試合がしたい！'],
    ojousama: ['頂点を目指しますわ。ご期待くださいませ'],
    delinquent: ['大暴れするぞー！覚悟しとけ！'],
    cool: ['…見ていろ。格の違いを証明する'],
    seductive: ['頂点まで一直線よ。見ていてね'],
    composed: ['…頂点まで。…見ていて'],
  },
  quiet: {
    _default: ['…よろしくお願いします'],
    cool: ['…やるべきことをやる'],
    polite: ['…精一杯、頑張らせていただきます'],
    composed: ['……やるべきことをやる'],
  },
  shy: {
    _default: ['よ、よろしくお願いします…が、頑張ります…！'],
  },
  easygoing: {
    _default: ['わーい！今日から仲間だ！よろしく！', 'みんなで楽しくやりましょー！'],
    delinquent: ['よっしゃー！楽しくやろうぜ！'],
    seductive: ['よろしくね。楽しくやりましょう'],
    composed: ['…よろしくね。楽しくやろう'],
  },
  earnest: {
    _default: ['毎日コツコツ、頑張ります！見ていてください！', 'この団体のために…全てを捧げます'],
    polite: ['毎日精進いたします。見ていてください'],
    ojousama: ['コツコツ頑張りますわ。見ていてくださいませ'],
    seductive: ['毎日頑張るわ。見ていてね'],
    composed: ['…コツコツやる。見ていてくれれば'],
  },
  emotional: {
    _default: ['嬉しい…！よろしくお願いします…！頑張ります…！'],
    composed: ['…っ…嬉しい。よろしく'],
  },
};

const EVENT_FA_WELCOME_GENERIC_LINES = [
  'よろしくお願いします！頑張ります！',
  '精一杯やります！応援してください！',
  '新しい仲間として、全力で頑張ります！',
];

const EVENT_RENTAL_GREETING_LINES = {
  normal: {
    _default: ['レンタルですが、手は抜きませんので。よろしく', '短い間ですがよろしくお願いします'],
    ojousama: ['短い間ですが、よろしくお願いいたしますわ'],
    delinquent: ['よろしくな。手は抜かねーから'],
    seductive: ['短い間だけど、よろしくね'],
    composed: ['…短い間だけど、手は抜かないよ'],
  },
  bold: {
    _default: ['レンタルだからって舐めるなよ！全試合全力だ！', 'よその団体でも闘志は変わらない！燃えるぞ！'],
    ojousama: ['レンタルでも手は抜きませんわよ！'],
    delinquent: ['レンタル？ 関係ねえ！暴れるぞ！'],
    cool: ['…手は抜かない。見ていろ'],
    seductive: ['レンタルでも全力よ。見ていてね'],
    composed: ['…レンタルでも全力。当然だね'],
  },
  quiet: {
    _default: ['…短い間ですが、よろしくお願いします'],
    cool: ['…やるべきことはやる'],
    polite: ['…短い間ですが、精一杯務めさせていただきます'],
    composed: ['……短い間だけど、よろしく'],
  },
  shy: {
    _default: ['あ、あの…短い間ですけど…よろしくお願いします…'],
  },
  easygoing: {
    _default: ['おじゃましまーす！短い間だけど暴れるよー！', '一時的だからこそ思い切り好き放題やるね！'],
    delinquent: ['おじゃまー！暴れさせてもらうぜ！'],
    seductive: ['お邪魔するわね。短い間だけど楽しみましょう'],
    composed: ['…おじゃまします。楽しくやろう'],
  },
  earnest: {
    _default: ['短い期間ですが、精一杯やらせていただきます！', '限られた時間でも成長したい。よろしくお願いします'],
    polite: ['短い間ですが、精一杯務めさせていただきます'],
    ojousama: ['短い間ですが、精一杯お務めいたしますわ'],
    seductive: ['短い間だけど、精一杯やるわ'],
    composed: ['…短い間でも精一杯やる。よろしく'],
  },
  emotional: {
    _default: ['よろしくお願いします…！短い間だけど…全力で…！'],
    composed: ['…っ…短い間だけど、全力で'],
  },
};

const EVENT_RENTAL_GREETING_GENERIC_LINES = [
  '短い間ですが、よろしくお願いします！',
  'お邪魔します。力になれたら嬉しいです！',
  'レンタルでも全力です。よろしくお願いします！',
];

// 動的アクセス用ルックアップ（pickQuote/getTraitQuote の引数 category→定数）
const EVENT_LINES_BY_KEY = {
  coachHire: EVENT_COACH_HIRE_LINES,
  coachFire: EVENT_COACH_FIRE_LINES,
  draftJoin: EVENT_DRAFT_JOIN_LINES,
  draftInterest: EVENT_DRAFT_INTEREST_LINES,
  injury: EVENT_INJURY_LINES,
  titleWin: EVENT_TITLE_WIN_LINES,
  titleDefense: EVENT_TITLE_DEFENSE_LINES,
  titleChallengeLoss: EVENT_TITLE_CHALLENGE_LOSS_LINES,
  titleLoss: EVENT_TITLE_LOSS_LINES,
  release: EVENT_RELEASE_LINES,
  faSigning: EVENT_FA_SIGNING_LINES,
  faSigningGeneric: EVENT_FA_SIGNING_GENERIC_LINES,
  faWelcome: EVENT_FA_WELCOME_LINES,
  faWelcomeGeneric: EVENT_FA_WELCOME_GENERIC_LINES,
  rentalGreeting: EVENT_RENTAL_GREETING_LINES,
  rentalGreetingGeneric: EVENT_RENTAL_GREETING_GENERIC_LINES,
};

// ─────────────────────────────────────────────────────────────────────────────
// v2.1: クレジット情報 — ending-gameover-spec-v1.0.md §4.4
// ─────────────────────────────────────────────────────────────────────────────
const CREDITS = {
  music: [
    {
      title:   '8bit/RPG/オープニング「序・序曲」',
      artist:  'MOMIZizm MUSiC（もみじば）',
      source:  'フリーBGM MOMIZizm MUSiC',
      url:     'https://music.storyinvention.com/',
      license: 'フリー音楽素材',
    },
    {
      title:   'RPG/感動のフィナーレ「エンディング・テーマ」',
      artist:  'MOMIZizm MUSiC（もみじば）',
      source:  'フリーBGM MOMIZizm MUSiC',
      url:     'https://music.storyinvention.com/',
      license: 'フリー音楽素材',
    },
    {
      title:   'MusMus-BGM-052',
      artist:  'watson',
      source:  'フリーBGM・音楽素材 MusMus',
      url:     'https://musmus.main.jp/',
      license: 'フリー音楽素材',
    },
    {
      title:   'MusMus-BGM-125',
      artist:  'watson',
      source:  'フリーBGM・音楽素材 MusMus',
      url:     'https://musmus.main.jp/',
      license: 'フリー音楽素材',
    },
    {
      title:   'elevate_perfect',
      artist:  '岩城こん。',
      source:  'イワシロ音楽素材',
      url:     'https://iwashiro-sounds.work/',
      license: 'フリー音楽素材',
    },
    {
      title:   'gameover001',
      artist:  '岩城こん。',
      source:  'イワシロ音楽素材',
      url:     'https://iwashiro-sounds.work/',
      license: 'フリー音楽素材',
    },
  ],
};

// Node.js モジュールエクスポート（ブラウザではスキップ）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ALL_CHARS, CHAR_PROFILES, TRAIT_DEFS, Traits, ROSTER_CFG, CHAR_GROUP,
    PORTRAIT, COACH_PORTRAIT, MAX_T, PHASES, ENG, SALARY_PARAMS, FAN_EXPECT_REACTIONS,
    VENUES, BASE_ATTENDANCE_CURVE, TICKET_PRICE_TIERS, VENUE_MQ_THRESHOLD, GOODS_CONFIG, OCCUPANCY_BONUS,
    MOMENTUM_CONFIG, ATTENDANCE_PREDICTION,
    CARD_POP_CONFIG, CARD_DEPTH_MULT, CROWD_HEAT_MQ, VENUE_SCALE_MQ,
    SCANDAL_CONFIG, LOSING_STREAK_PENALTIES, PROMO_POP_CAP, PROMO_EVENT_INCOME_CURVE, PROMO_EVENT_NAMES, TRANSFER_POP_MULT,
    MEDIA_ORGPOP_CURVE, MEDIA_CONFIG, MEDIA_AWARD_CONFIG, VENUE_MEDIA_MULT, PPV_CARD_MULT, TRUST_RAISE_DISCOUNT,
    FIXED_COSTS, SUBSIDY_TABLE,
    HEAT_LEVELS, QUARTER_LABELS, INJURY_TABLE, INJURY_DEBUFF_TABLE,
    TITLES, RIVALRY_THRESHOLDS, RIVALRY_CONFRONTATION_LINES, RIVALRY_RESOLUTION_LINES,
    MQ_EXTERNAL_CAP, GOODRIVAL_MQ_BONUS, GOODRIVAL_LABEL, GOODRIVAL_EMOJI, GOODRIVAL_COLOR, BITTER_RIVAL_MQ_BONUS, BITTER_RIVAL_LABEL, BITTER_RIVAL_EMOJI, BITTER_RIVAL_COLOR,
    GOODRIVAL_RESOLUTION_LINES, BITTER_RESOLUTION_LINES,
    RIVALRY_CONFRONTATION_LINES_70, RIVALRY_CONFRONTATION_LINES_90,
    WEEKLY_STORY_TICKER, RIVALRY_MATCH_REACTION, UPSET_RIVALRY_LINES,
    FRESHNESS_CONFIG, COACH_STYLE_MAP, COACH_STYLE_BONUS,
    COACH_SLOT_COSTS, COACH_POOL_CFG, COACH_ABILITY_CATALOG, COACH_FLAVOR_DEFS, ALL_COACHES,
    COACH_HIRE_FEE, COACH_MAX_ASSIGN,
    GROWTH_CONFIG,
    RIVAL_ORG_NAME_POOL, RIVAL_ORGS, BATTLE_POINT_CFG, RANKING_CONFIG, ACHIEVEMENT_CONFIG, SHIELD_VARIANTS,
    SCOUT_EVENT_CFG, DORMANT_POOL_CFG,
    STYLE_GROWTH, STAR_POWER, RETIRE_CFG, WEAR_TABLE,
    AI_SCOUT_CFG, AI_TIER_LIMITS, AI_MIDSEASON_FA_CFG, DRAFT_SIGNING_BONUS, AI_COACH_STAFFING, AI_SEASON_CFG,
    AI_TIER_LIMITS_ELEVATED, AI_COACH_CONFIG_ELEVATED, AI_COACH_STAFFING_ELEVATED,
    TRANSFER_CONFIG, RENTAL_CONFIG, EVENT_CONFIG, NEGOTIATION_CONFIG,
    CONTRACT_NEGOTIATION_LINES, CONTRACT_NEGOTIATION_CONFIG, RELEASE_INTERVIEW_LINES, CHALLENGE_REQUEST_LINES,
    NEGOTIATE_LINES, RETIREMENT_LINES, RETIRE_ACCEPT_LINES, RETIRE_REFUSE_LINES,
    RETAIN_LINES, COACH_RETIRE_ADVICE_TEXTS,
    AWARD_LINES, BT_HINT_LINES, BREAKTHROUGH_LINES, MILESTONE_LINES, FIRST_MEET_LINES, POST_MATCH_FLAVOR_LINES, getDialoguePool, pickDialogueLine,
    SLUMP_START_LINES, SLUMP_END_LINES,
    MOTIVATION_LOSS_LINES, MOTIVATION_RECOVERY_LINES,
    AI_BREAKTHROUGH_NEWS, AI_SLUMP_NEWS, AI_MOTIVATION_LOSS_NEWS,
    NEWS_TICKER_TEMPLATES, NEWS_HEADLINE_TEMPLATES, BESTMATCH_FLAVOR,
    MILESTONE_EVENTS, NOTIF_EVENT_TEXTS, NOTIF_DIALOGUES,
    DOME_FIRSTSHOW_LINES, DOME_SELLOUT_LINES,
    CAMP_FLAVOR_TEXTS, CARE_REACTION_DIALOGUES,
    CHOICE_EVENT_DIALOGUES, LARGE_EVENT_TEXTS, LARGE_EVENT_DIALOGUES,
    MEDIA_OUTLET_NAMES,
    CM_ADVERTISER_NAMES, MAGAZINE_NAMES, VARIETY_SHOW_NAMES,
    COLLAB_BRAND_NAMES, FASHION_BRAND_NAMES, FAN_EVENT_ORGANIZER_NAMES,
    TALENT_ACTIVITY_LABELS, TALENT_ACTIVITY_ICONS,
    RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE,
    CRISIS_DIALOGUE, GAMEOVER_LINES, ENDING_LINES, TEAM_SPIRIT_TEXTS, ATMOSPHERE_TEXTS,
    COACH_REPORT_TEXTS, STAT_LABELS_JP, STAT_TIPS, COACH_OBS_INACCURACY, SNAPSHOT_TEXTS,
    PPV_UNLOCK_POP, PPV_SLOTS, PPV_REWARD, PPV_ENTRY_WEEK, PPV_SHOW_WEEK,
    PPV_NAMES, PPV_OPPONENT_LINES, WAR_VICTORY_LINES, PPV_HYPE_TEMPLATES,
    WAR_CHALLENGER_DIALOGUE, WAR_DECLINE_DIALOGUE, WAR_POST_DIALOGUE, CREDITS,
    EVENT_COACH_HIRE_LINES, EVENT_COACH_FIRE_LINES,
    EVENT_DRAFT_JOIN_LINES, EVENT_DRAFT_INTEREST_LINES,
    EVENT_INJURY_LINES,
    EVENT_TITLE_WIN_LINES, EVENT_TITLE_DEFENSE_LINES,
    EVENT_TITLE_CHALLENGE_LOSS_LINES, EVENT_TITLE_LOSS_LINES,
    EVENT_RELEASE_LINES,
    EVENT_FA_SIGNING_LINES, EVENT_FA_SIGNING_GENERIC_LINES,
    EVENT_FA_WELCOME_LINES, EVENT_FA_WELCOME_GENERIC_LINES,
    EVENT_RENTAL_GREETING_LINES, EVENT_RENTAL_GREETING_GENERIC_LINES,
    EVENT_LINES_BY_KEY,
    DRAFT_CONFIG, ORG_ASSIGN, generateDraftConfig, seededShuffle,
    SALARY_PARAMS, LOSING_STREAK_PENALTIES,
    GLIMPSE_A_THRESHOLDS, GLIMPSE_A_LINES, GLIMPSE_HOTSTREAK_END_LINES, GLIMPSE_B_LINES,
  };
}
