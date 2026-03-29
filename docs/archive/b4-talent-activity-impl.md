# B4タレント活動イベント拡充 実装依頼書

## 概要

既存の B4「メディア密着取材」を維持しつつ、6種の新タレント活動サブタイプを追加する。
選択肢・連鎖等のゲームプレイ変更はなし。セリフ・テキスト・演出の拡充が主目的。

---

## 1. 変更ファイル

- `src/data.js`：名前配列・LARGE_EVENT_TEXTS・LARGE_EVENT_DIALOGUES の追加
- `src/engine.js`：B4生成ロジック・効果適用・週次計算の修正
- `src/ui-render.js`：B4ポップアップ演出の activityType 対応

---

## 2. 新フィールド定義

B4イベントオブジェクトに `activityType` フィールドを追加する。

```js
// 既存
{ type: 'B4', outletName, subType }         // activityType なし = spotlight（既存動作）

// 新規（6種）
{ type: 'B4', outletName, subType, activityType: 'cm' }
{ type: 'B4', outletName, subType, activityType: 'gravure' }
{ type: 'B4', outletName, subType, activityType: 'variety' }
{ type: 'B4', outletName, subType, activityType: 'brand' }
{ type: 'B4', outletName, subType, activityType: 'fashion' }
{ type: 'B4', outletName, subType, activityType: 'fan' }
```

`activityType` が null / undefined の場合は既存の mediaSpotlight 動作を維持する。
排他制約は維持：`state.mediaSpotlight` が存在する場合は B4 自体が発生しない（既存通り）。

---

## 3. B4 生成ロジック修正（engine.js）

### 対象箇所
`case 'B4':` 内の `return { type: 'B4', outletName, subType }` の部分。

### 変更内容

```js
case 'B4': {
  // --- 既存コード（outletName, subType 決定まで）そのまま ---

  // activityType の抽選（7択均等）
  const ACTIVITY_TYPES = [null, 'cm', 'gravure', 'variety', 'brand', 'fashion', 'fan'];
  // null = 既存の spotlight 動作
  const activityType = ACTIVITY_TYPES[Engine.rng.int(rng, 0, ACTIVITY_TYPES.length - 1)];

  // activityType ごとに outletName の名前プールを切り替える
  let namePool;
  switch (activityType) {
    case 'cm':      namePool = typeof CM_ADVERTISER_NAMES !== 'undefined' ? CM_ADVERTISER_NAMES : ['スポンサー']; break;
    case 'gravure': namePool = typeof MAGAZINE_NAMES !== 'undefined' ? MAGAZINE_NAMES : ['雑誌社']; break;
    case 'variety': namePool = typeof VARIETY_SHOW_NAMES !== 'undefined' ? VARIETY_SHOW_NAMES : ['テレビ局']; break;
    case 'brand':   namePool = typeof COLLAB_BRAND_NAMES !== 'undefined' ? COLLAB_BRAND_NAMES : ['ブランド']; break;
    case 'fashion': namePool = typeof FASHION_BRAND_NAMES !== 'undefined' ? FASHION_BRAND_NAMES : ['ブランド']; break;
    case 'fan':     namePool = typeof FAN_EVENT_ORGANIZER_NAMES !== 'undefined' ? FAN_EVENT_ORGANIZER_NAMES : ['主催者']; break;
    default:        namePool = typeof MEDIA_OUTLET_NAMES !== 'undefined' ? MEDIA_OUTLET_NAMES : ['メディア']; break;
  }
  const resolvedOutletName = namePool[Engine.rng.int(rng, 0, namePool.length - 1)];

  return { type: 'B4', outletName: resolvedOutletName, subType, activityType };
}
```

---

## 4. B4 効果適用修正（engine.js）

### 対象箇所
`applyLargeEventEffect` の `case 'B4':` 内。

### 変更内容

```js
case 'B4': {
  const f = roster.find(f => f.id === choiceIdx);
  if (!f) return { ... };

  // activityType がない場合 = 既存 spotlight 動作
  if (!event.activityType) {
    mediaSpotlight = { fighterId: f.id, fighterName: f.name, remainingShows: 3,
                       totalMQ: 0, matchCount: 0, outletName: event.outletName || 'メディア' };
    events.push(`📺 ${f.name}の密着取材が開始（${mediaSpotlight.outletName}、3興行）`);
    return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
  }

  // 新タレント活動：選手に talentActivityBuff を付与
  const ACTIVITY_MULTIPLIER = calcTalentMultiplier(f, event.activityType);
  // personality相性：得意=1.5, 普通=1.0, 苦手=0.5
  // archetype追加補正：対象archetypeなら+0.2
  // → calcTalentMultiplier() は下記「5. 倍率計算ヘルパー」参照

  const durationWeeks = event.activityType === 'brand' ? 2 : 1;

  const ICON = TALENT_ACTIVITY_ICONS[event.activityType] || '🎤';
  const LABEL = TALENT_ACTIVITY_LABELS[event.activityType] || 'タレント活動';

  roster = roster.map(fighter => {
    if (fighter.id !== f.id) return fighter;

    // fashion と fan は即時効果
    if (event.activityType === 'fashion') {
      const popGain = ACTIVITY_MULTIPLIER >= 1.4 ? 3 : ACTIVITY_MULTIPLIER >= 0.8 ? 2 : 1;
      return { ...fighter, popularity: Engine.util.clamp((fighter.popularity || 1) + popGain, 1, 100),
               talentActivityBuff: { type: event.activityType, remainingWeeks: 0, multiplier: ACTIVITY_MULTIPLIER } };
    }
    if (event.activityType === 'fan') {
      const trustGain = ACTIVITY_MULTIPLIER >= 1.4 ? 6 : ACTIVITY_MULTIPLIER >= 0.8 ? 4 : 2;
      const oldTrust = fighter.trust != null ? fighter.trust : 50;
      let adjusted = Engine.trust.applyCoeff(trustGain, fighter.mn || 50);
      if (adjusted > 0) adjusted *= Engine.trust.gainMult(oldTrust);
      return { ...fighter, trust: Engine.util.clamp(oldTrust + adjusted, 0, 100),
               talentActivityBuff: { type: event.activityType, remainingWeeks: 0, multiplier: ACTIVITY_MULTIPLIER } };
    }

    // その他（cm/gravure/variety/brand）は週次収入バフ
    return { ...fighter,
             talentActivityBuff: { type: event.activityType, remainingWeeks: durationWeeks, multiplier: ACTIVITY_MULTIPLIER } };
  });

  events.push(`${ICON} ${f.name}の${LABEL}が決定！`);
  return { roster, funds, lockerRoomMorale, mediaSpotlight, lastLargeEventWeek: absWeek, events };
}
```

---

## 5. 倍率計算ヘルパー（engine.js に追加）

`applyLargeEventEffect` より前に定義する。

```js
// personality × activityType 相性テーブル
// 1.5=得意 / 1.0=普通 / 0.5=苦手
const TALENT_ACTIVITY_COMPAT = {
  cm:      { bold: 1.5, earnest: 1.0, normal: 1.0, easygoing: 1.0, quiet: 0.5, emotional: 1.0, shy: 0.5 },
  gravure: { bold: 1.0, earnest: 0.5, normal: 1.0, easygoing: 1.5, quiet: 1.0, emotional: 1.5, shy: 0.5 },
  variety: { bold: 1.0, earnest: 1.0, normal: 1.0, easygoing: 1.5, quiet: 0.5, emotional: 1.5, shy: 0.5 },
  brand:   { bold: 1.0, earnest: 1.0, normal: 1.0, easygoing: 1.0, quiet: 1.5, emotional: 0.5, shy: 1.0 },
  fashion: { bold: 1.0, earnest: 0.5, normal: 1.0, easygoing: 1.0, quiet: 0.5, emotional: 1.5, shy: 0.5 },
  fan:     { bold: 0.5, earnest: 1.5, normal: 1.0, easygoing: 1.0, quiet: 1.0, emotional: 1.5, shy: 1.0 },
};

// archetype × activityType 追加補正（該当なら +0.2）
const TALENT_ARCHETYPE_BONUS = {
  gravure:  ['seductive'],
  fashion:  ['seductive', 'ojousama'],
  brand:    ['ojousama', 'cool'],
  cm:       ['cool'],
  variety:  ['delinquent'],
  fan:      ['polite'],
};

function calcTalentMultiplier(fighter, activityType) {
  const p = fighter.personality || 'normal';
  const a = fighter.archetype || 'normal';
  const baseTable = TALENT_ACTIVITY_COMPAT[activityType] || {};
  const base = baseTable[p] !== undefined ? baseTable[p] : 1.0;
  const bonusList = TALENT_ARCHETYPE_BONUS[activityType] || [];
  const bonus = bonusList.includes(a) ? 0.2 : 0.0;
  return base + bonus;
}
```

---

## 6. 週次収入計算への組み込み（engine.js）

**前提：finance-rebalance 実装済みであること。**

金銭バランス実装でプロモ連動収入の計算が追加されるはず。
そこに以下を追加する（`talentActivityBuff` を参照）：

```js
// 選手ループ内：プロモ連動収入計算部分
roster.forEach(f => {
  const buff = f.talentActivityBuff;
  if (!buff || buff.remainingWeeks <= 0) return;

  const multiplier = buff.multiplier || 1.0;

  if (buff.type === 'cm' || buff.type === 'variety') {
    // メディア収入⑤相当：popularity × 0.6万 × multiplier
    mediaRevenue += (f.popularity || 1) * 0.6 * multiplier;
  }
  if (buff.type === 'gravure' || buff.type === 'brand') {
    // グッズプロモ連動：popularity × 0.6万 × multiplier
    goodsRevenue += (f.popularity || 1) * 0.6 * multiplier;
  }
});

// バフのカウントダウン（週次処理末尾で）
roster = roster.map(f => {
  if (!f.talentActivityBuff || f.talentActivityBuff.remainingWeeks <= 0) return f;
  const newRemaining = f.talentActivityBuff.remainingWeeks - 1;
  if (newRemaining <= 0) return { ...f, talentActivityBuff: null };
  return { ...f, talentActivityBuff: { ...f.talentActivityBuff, remainingWeeks: newRemaining } };
});
```

---

## 7. 名前配列の追加（data.js）

`MEDIA_OUTLET_NAMES` の直後に追加する。

```js
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
```

---

## 8. LARGE_EVENT_TEXTS の追加（data.js）

`LARGE_EVENT_TEXTS.B4` の直後（`}` の後）に追加するのではなく、
`LARGE_EVENT_TEXTS` オブジェクト内の B4 の後に追記する。

```js
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
```

### LARGE_EVENT_TEXTS のテキスト解決ロジック修正（engine.js）

activityType がある場合は `B4_{activityType}` からランダム選択、ない場合は既存通り。

```js
// 既存の B4 テキスト解決部分を修正
if (event.type === 'B4') {
  const activityType = event.activityType;
  if (activityType) {
    // 新タレント活動：フラット配列からランダム選択
    const pool = texts[`B4_${activityType}`];
    if (pool && pool.length > 0) {
      return pool[Engine.rng.int(rng, 0, pool.length - 1)];
    }
  } else {
    // 既存：subType で選択
    const subPool = texts.B4[event.subType] || texts.B4.youngStar;
    return subPool[Engine.rng.int(rng, 0, subPool.length - 1)];
  }
}
```

---

## 9. LARGE_EVENT_DIALOGUES の追加（data.js）

`LARGE_EVENT_DIALOGUES` オブジェクト内、`B4: { ... }` の直後に追加。

### B4_cm

```js
  B4_cm: {
    normal: {
      _default: ['CMか…ちゃんとできるかな。頑張ってみます'],
      ojousama: ['CMですか。しっかりお役目を果たしますわ'],
      delinquent: ['CM！？ なんか恥ずかしいけど、やってやるよ'],
      seductive: ['カメラの前ね…いい絵、撮らせてあげる♡'],
    },
    bold: {
      _default: ['CMで私の顔を全国に売り込む。完璧にやってみせる', 'このチャンス、最大限に使ってやる'],
      ojousama: ['全国の皆様に、この実力と品格をお見せしますわ'],
      delinquent: ['CM？ 全国にこの顔を売りつけてやる！'],
      cool: ['…カメラに映るか。悪くない'],
      seductive: ['全国に私を見てもらえるのね。楽しみだわ♡'],
    },
    quiet: {
      _default: ['…やります'],
      cool: ['…カメラか。まぁ、やる'],
      polite: ['…精一杯、頑張らせていただきます'],
    },
    shy: {
      _default: ['わ、私がCMに…？ ほ、本当に大丈夫ですか…？'],
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
    },
    emotional: {
      _default: ['CMに出るの…！？ うわあああ緊張する！でもやる！'],
    },
  },
```

### B4_gravure

```js
  B4_gravure: {
    normal: {
      _default: ['グラビアか…ちょっと恥ずかしいけど、頑張ります'],
      ojousama: ['撮影ですか。美しく仕上げていただけるよう努めますわ'],
      delinquent: ['グラビア…？ まぁ、やってやるか'],
      seductive: ['グラビアね…全部見せてあげるわ♡'],
    },
    bold: {
      _default: ['私の強さと魅力、カメラに焼き付けてやる', 'これで一気に知名度上げてやる'],
      ojousama: ['プロレスラーとしての品格を、写真で表現してみせますわ'],
      delinquent: ['グラビアも勝負事だ。全力でいくよ'],
      cool: ['…写真か。余計なことはしないが、手は抜かない'],
      seductive: ['私の本気の魅力、たっぷり撮ってもらうわ♡'],
    },
    quiet: {
      _default: ['…撮るだけですよね。わかりました'],
      cool: ['…写真か。余計なことはしないでくれ'],
      polite: ['…恥ずかしいですが、精一杯頑張ります'],
    },
    shy: {
      _default: ['え…グラビア…？ は、恥ずかしいです…でも、やります…'],
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
    },
    emotional: {
      _default: ['グラビア！？ えっ、私ほんとに！？ うわ〜〜！'],
    },
  },
```

### B4_variety

```js
  B4_variety: {
    normal: {
      _default: ['バラエティか…うまく喋れるかな。頑張ります'],
      ojousama: ['バラエティ番組ですか。品よくふるまえるよう努めますわ'],
      delinquent: ['バラエティ？ 面白いことしてやるよ'],
      seductive: ['バラエティか。じゃあ、素の私を少し見せてあげようかな'],
    },
    bold: {
      _default: ['番組ジャックしてやる。全部持っていく', 'トーク番組だろうと、私が主役に決まってる'],
      ojousama: ['トーク番組でも、品格は忘れませんわ'],
      delinquent: ['テレビで暴れてやる！ 絶対爪痕残す！'],
      cool: ['…余計なことは言わない。でも、印象には残る'],
      seductive: ['バラエティでも私のペースで話すわ♡'],
    },
    quiet: {
      _default: ['…喋るんですか。少し、緊張します'],
      cool: ['…無駄なことは言わない。それだけだ'],
      polite: ['…うまく喋れるか不安ですが、精一杯やります'],
    },
    shy: {
      _default: ['バ、バラエティ…しゃべるの…？ が、頑張ります…'],
    },
    easygoing: {
      _default: ['バラエティ！ 笑わせにいくよ♪', 'テレビって楽しそう！ 全力でいく♪'],
      delinquent: ['テレビで暴れてやる！ 楽しみ！'],
      seductive: ['バラエティか〜。楽しそう！ 見てて♡'],
    },
    earnest: {
      _default: ['うまく喋れるか不安ですが…精一杯やります'],
      polite: ['トーク番組は緊張しますが…誠実に対応いたします'],
      ojousama: ['言葉遣いには気をつけて、丁寧に対応しますわ'],
      seductive: ['ちゃんと準備して、面白い話ができるよう頑張るわ'],
    },
    emotional: {
      _default: ['バラエティ出る！？ テンション上がってきた〜！！'],
    },
  },
```

### B4_brand

```js
  B4_brand: {
    normal: {
      _default: ['ブランドとのコラボか。ちゃんとイメージに合わせられるかな'],
      ojousama: ['まあ、コラボのお話ですの。嬉しい限りですわ'],
      delinquent: ['ブランドとコラボ…？ なんか柄じゃないな。でもやる'],
      seductive: ['私のイメージに合うブランドね。いい選択だわ♡'],
    },
    bold: {
      _default: ['そのブランドのイメージ、私が底上げしてやる', '私が使ったら絶対売れる。任せて'],
      ojousama: ['私の品格とブランドイメージが合わされば、最高の結果になりますわ'],
      delinquent: ['コラボ商品、派手にやってやる！'],
      cool: ['…ブランドには口数の少なさが向いている。悪くない'],
      seductive: ['私とブランドの組み合わせ…最高じゃない♡'],
    },
    quiet: {
      _default: ['…わかりました。やります'],
      cool: ['…無駄口は叩かない。それがブランドには向いているかもな'],
      polite: ['…コラボですね。しっかり務めさせていただきます'],
    },
    shy: {
      _default: ['わ、私がコラボ…？ 本当に私でいいんですか…'],
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
    },
  },
```

### B4_fashion

```js
  B4_fashion: {
    normal: {
      _default: ['ファッションショーか…歩けるかな。頑張ります'],
      ojousama: ['ランウェイですか。精一杯美しく歩いてみせますわ'],
      delinquent: ['ファッションショー…？ 歩くだけ？ まぁいいけど'],
      seductive: ['ランウェイか…私の本領発揮ね♡'],
    },
    bold: {
      _default: ['ランウェイも私のステージ。全部持っていく', 'プロレスもファッションも、どっちも私のもの'],
      ojousama: ['ランウェイでは誰にも負けませんわ'],
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
    },
  },
```

### B4_fan

```js
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
    },
  },
```

---

## 10. ラベル・アイコン定数の追加（data.js）

`LARGE_EVENT_DIALOGUES` の直前に追加。

```js
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
```

---

## 11. UI 演出修正（ui-render.js）

### B4 ポップアップ表示部分

`activityType` がある場合は活動タイプ固有の見出しアイコン・ラベルを表示。
推薦選手ヒントも表示する。

```js
// B4イベントポップアップ表示部分
if (event.type === 'B4') {
  const activityType = event.activityType;
  if (activityType && typeof TALENT_ACTIVITY_LABELS !== 'undefined') {
    const icon = TALENT_ACTIVITY_ICONS[activityType] || '🎤';
    const label = TALENT_ACTIVITY_LABELS[activityType] || 'タレント活動';
    // ヘッダーに icon + label を表示
    // 例: "📸 CM出演"

    // 推薦ヒント（相性○の選手を最大2名表示）
    const roster = state.roster || [];
    const recommendations = roster
      .filter(f => !f.injury && !f.isRental)
      .map(f => ({ f, mult: calcTalentMultiplier(f, activityType) }))
      .filter(x => x.mult >= 1.4)
      .sort((a, b) => (b.f.popularity || 1) - (a.f.popularity || 1))
      .slice(0, 2)
      .map(x => x.f.name);

    if (recommendations.length > 0) {
      // "💡 おすすめ：〇〇、△△" を選手選択UIの上に表示
    }
  } else {
    // 既存 spotlight 表示
  }
}
```

---

## 12. data.js の export 配列への追加

`data.js` 末尾の `window.GameData` または export オブジェクトに以下を追加：

```
CM_ADVERTISER_NAMES, MAGAZINE_NAMES, VARIETY_SHOW_NAMES,
COLLAB_BRAND_NAMES, FASHION_BRAND_NAMES, FAN_EVENT_ORGANIZER_NAMES,
TALENT_ACTIVITY_LABELS, TALENT_ACTIVITY_ICONS,
```

---

## 実装順序

1. `data.js`：名前配列6種 → TALENT_ACTIVITY_LABELS/ICONS → LARGE_EVENT_TEXTS 6種 → LARGE_EVENT_DIALOGUES 6種 → export 追加
2. `engine.js`：calcTalentMultiplier / TALENT_ACTIVITY_COMPAT / TALENT_ARCHETYPE_BONUS 追加 → B4生成修正 → applyLargeEventEffect 修正 → 週次計算組み込み（finance-rebalance 完了後）
3. `ui-render.js`：B4ポップアップ演出修正

## 注意事項

- `calcTalentMultiplier` は engine.js 内にのみ定義（data.js には入れない）
- `finance-rebalance` の実装が完了していない場合、週次収入への組み込み（セクション6）は後回しにして、选手フラグ付与まで先に実装する
- 既存の B4 spotlight 動作は一切変えない

---

## 13. 引退時レア追加ポップアップ（champion_injury 専用）

### 概要

`B4_champion_injury`（怪我によるチャンピオンのまま引退）確定時、
条件を満たした場合に引退セリフポップアップの直後にもう一つポップアップを出す。

### 発生条件

- 引退理由が `B4_champion_injury` であること
- `fighter.trust >= 85`
- ランダム確率 30%（`Engine.rng.float(rng) < 0.30`）

### 演出仕様

- タイミング：①引退セリフポップアップをプレイヤーが閉じた直後
- 形式：Glimpse Bレイヤーと同じ小さい吹き出し
- 閉じ方：**クリックで閉じる**（時間制限なし）
- 内容：社長への一言のみ

### セリフデータ（`RETIREMENT_CHAMPION_WORRY_LINES` として data.js に追加）

```js
const RETIREMENT_CHAMPION_WORRY_LINES = {
  normal:    ['…社長、ベルトのこと迷惑かけちゃうね。ごめんね'],
  bold:      ['…ベルト、空けちゃうな。社長に悪いことしたか'],
  earnest:   ['…ベルトが空白になってしまいます。社長、申し訳ないです'],
  easygoing: ['あ、でも社長大丈夫かな。ベルト空けちゃうじゃん'],
  emotional: ['…社長…大丈夫かな…迷惑かけてないかな…'],
  quiet:     ['…社長、すまない'],
  shy:       ['…社長…ご迷惑じゃないですか…？'],
};

// archetype 補正（personality に加えて適用）
// seductive / ojousama / polite は personality セリフの後に archetype 別を優先
const RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE = {
  ojousama:  ['…社長に、ご迷惑をおかけしますわね'],
  seductive: ['…社長のこと、少し心配ね'],
  polite:    ['…社長、本当に申し訳ございません'],
};
```

### セリフ解決ロジック

1. archetype が `ojousama` / `seductive` / `polite` → archetype 別セリフを使用
2. それ以外 → personality 別セリフを使用
3. 該当なし → `normal` にフォールバック

### engine.js 実装箇所

引退処理（`applyRetirementEffect` または相当箇所）内：

```js
// B4_champion_injury 引退確定後
if (retireReason === 'B4_champion_injury') {
  const trust = fighter.trust ?? 50;
  if (trust >= 85 && Engine.rng.float(rng) < 0.30) {
    // ポップアップフラグをstateに積む
    state = { ...state, _pendingChampionWorryLine: {
      fighterId: fighter.id,
      line: resolveChampionWorryLine(fighter)
    }};
  }
}
```

### ui-render.js 実装箇所

引退ポップアップの「閉じる」ボタン押下後に `_pendingChampionWorryLine` を確認し、
存在すれば Glimpse B 形式の吹き出しを表示。クリックで閉じる。
