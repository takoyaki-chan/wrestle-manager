# 💀 破産再設計仕様書 v1.1

> **ステータス**: 🟡 提案
> **作成日**: 2026-05-03
> **更新**: 2026-05-03（v1.0 → v1.1: archetype主軸への転換、オフシーズン処理追加、セリフ全面書き直し）
> **対象**: Wrestle Manager v2.1+
> **依存**: `ending-gameover-spec-v1.0.md`（旧仕様、本書で置き換え）, `personality-archetype-spec-v1.0.md`, `trust-system-spec-v2.1.md`, `kuroda.md`
> **置き換え範囲**: `management.js` 破産判定（L9514）/ `ui-common.js` ゲームオーバー画面（L12745-12780）/ `app.js` Survival ゲージ前提値

---

## 0. このドキュメントの目的

現行の破産処理は二つの問題を抱えている。

1. **判定が突然すぎる**: `funds <= 0` の瞬間にゲームオーバー画面が表示される。プレイヤーには予兆も抵抗の機会もない。
2. **別れ際にキャラが沈黙している**: クリア時の `showEndingCeremony` は5スライド表彰式形式で選手・コーチが祝福セリフを述べる。一方、ゲームオーバー時の `showGameOverScreen` は1画面の成績表のみ。プレイヤーが感情移入してきた選手・コーチが**最後の瞬間に何も語らずに消える**。

本書では破産を「**予兆 → 抵抗 → 別れ**」の3段ドラマに再設計する。CLAUDE.md の「辛さを避けない」「テンプレではない、その子だけの言葉と感情」「演出でどう見せるか」を破産シーンに適用する試みである。

---

## 1. 全体構造

```
通常経営
   │  funds < 0
   ▼
┌──────────────────────────────┐
│ ① 資金危機フェーズ（4週猶予）   │
│   - 警告UI / 黒田の警告コラム   │
│   - 選手の不安発言             │
│   - 即死ライン: funds ≤ -1500   │
└──────────────────────────────┘
   │              │              │
   │ 4週内に       │ 猶予切れ      │ シーズン末（week>48）
   │ funds ≥ 0    │ or 即死       │ で資金マイナス
   ▼              ▼              ▼
通常経営復帰   ┌──────────────────────────┐
              │ ② 解散セレモニー（5スライド） │
              │   - クリア時と対称構造      │
              │   - archetype別解散セリフ   │
              │   - 黒田の editorial コラム │
              └──────────────────────────┘
                       │
                       ▼
                  タイトル画面へ
```

**3つのゲームオーバー経路:**

| `gameOverReason` | 発動条件 | ドラマ的意味 |
|---|---|---|
| `timeout` | 危機フェーズ4週猶予が切れた | 立て直そうとしたが届かなかった |
| `collapse` | 危機中に `funds ≤ -1500` まで悪化 | 立て直す時間すらなかった |
| `season_end` | レギュラーシーズン末（week > 48）時点で `funds < 0` | シーズンを越えられなかった |

---

## 2. パート①: 資金危機フェーズ（Financial Crisis）

### 2.1 ステートフィールド追加

```js
// createInitialState に追加
crisisActive: false,           // 危機フェーズ中か
crisisEnteredWeek: null,       // 危機突入週（season/week複合）
crisisWeeksRemaining: 0,       // 残り猶予週数（4でスタート）
crisisHistoryCount: 0,         // 過去に危機を脱出した回数（再発時の演出変化用）
gameOverReason: null,          // 'timeout' | 'collapse' | 'season_end' | null
```

### 2.2 トリガー条件

`tickWeek` 内、`processSettlement` 完了後に判定（**レギュラーシーズン中のみ**。`s.offSeason === true` のときは判定スキップ）：

```js
if (!s.offSeason && !s.crisisActive && s.funds < 0) {
  // 危機フェーズ突入
  s = {
    ...s,
    crisisActive: true,
    crisisEnteredWeek: { season: s.season, week: s.week },
    crisisWeeksRemaining: 4,
  };
  events.push('🚨 資金が底をついた。残り猶予4週——立て直すか、解散か。');
}
```

### 2.3 危機中の毎週処理

危機フェーズ中は `tickWeek` の最後で以下を実行（**レギュラーシーズン中のみ**）：

```js
if (!s.offSeason && s.crisisActive) {
  // 即死判定（猶予関係なく即破産）
  if (s.funds <= -1500) {
    s = { ...s, weekPhase: 'gameover', gameOverReason: 'collapse' };
    events.push('💀 資金は完全に枯渇した。立て直しは不可能となった。');
  }
  // 猶予内に復帰
  else if (s.funds >= 0) {
    s = {
      ...s,
      crisisActive: false,
      crisisEnteredWeek: null,
      crisisWeeksRemaining: 0,
      crisisHistoryCount: (s.crisisHistoryCount || 0) + 1,
    };
    events.push('✅ 資金が黒字に戻った。危機を脱した。');
  }
  // 猶予継続
  else {
    s = { ...s, crisisWeeksRemaining: s.crisisWeeksRemaining - 1 };
    if (s.crisisWeeksRemaining <= 0) {
      // 猶予切れ → 正式破産
      s = { ...s, weekPhase: 'gameover', gameOverReason: 'timeout' };
      events.push('💀 4週の猶予が切れた。「' + s.orgName + '」は活動停止を発表した。');
    } else {
      events.push(`🚨 資金危機継続中。残り${s.crisisWeeksRemaining}週。`);
    }
  }
}
```

#### 2.3.1 数値設定 🔧

| パラメータ | 値 | 根拠 |
|---|---|---|
| 危機突入ライン | `funds < 0` | 既存の破産ラインと同じ。プレイヤーの「ヤバい」感覚と一致 |
| 即死ライン | `funds ≤ -1500` | 「立て直し不可能」と納得できる深さ。1週で-500悪化が常態でもこのラインに届くまで3週ある |
| 猶予期間 | 4週 | 1ヶ月。シーズン構造（48週/レギュラー）の約1/12。短すぎず、ダラダラさせない長さ |

これらは **empirical tuning over preemptive complexity** の方針に従い、初期実装後にプレイデータを観察して調整する。

### 2.4 シーズン末強制判定（オフシーズン突入時）

`advanceWeek` 内、`week > 48` に到達してオフシーズンに突入する直前に強制判定を行う（既存コード `management.js` L13215 付近に挿入）：

```js
if (s.week > 48) {
  // F2: Force-resolve any pending negotiation before offseason
  if (s.pendingNegotiation) { /* 既存処理 */ }

  // ★ 追加: シーズン末破産判定
  if (s.crisisActive) {
    if (s.funds >= 0) {
      // 滑り込み脱出
      s = {
        ...s,
        crisisActive: false,
        crisisEnteredWeek: null,
        crisisWeeksRemaining: 0,
        crisisHistoryCount: (s.crisisHistoryCount || 0) + 1,
      };
      events.push('✅ シーズン最終週で資金が黒字に戻った。危機を脱した。');
    } else {
      // シーズン終了とともに破産確定
      s = { ...s, weekPhase: 'gameover', gameOverReason: 'season_end' };
      events.push(`💀 シーズン終了。「${s.orgName}」は次のシーズンを迎えることなく解散した。`);
      return { state: s, events };  // オフシーズン突入処理をバイパス
    }
  } else if (s.funds < 0) {
    // 危機フェーズに入っていなかったが、シーズン末でマイナスのケース
    // （例: 第48週で初めてマイナスになった場合、危機フェーズと同時にシーズン末を迎える）
    s = { ...s, weekPhase: 'gameover', gameOverReason: 'season_end' };
    events.push(`💀 シーズン終了時点で資金が枯渇していた。`);
    return { state: s, events };
  }

  // 既存: Enter offseason
  s = { ...s, offSeason: true, offWeek: 0 };
  events.push('📅 レギュラーシーズン終了 → オフシーズン突入');
  return { state: { ...s, weekPhase: 'offseason' }, events };
}
```

これにより:
- **危機フェーズ中にシーズン末を迎えた場合**: その瞬間に脱出 or 破産が確定する。オフシーズンに引き継がない
- **シーズン最終週(48週)で初めてマイナスになった場合**: 危機フェーズに入る暇もなく即破産
- **オフシーズン中の経済処理は資金を変動させない**（既存実装で `processSettlement` が走らないため、整合する）

### 2.5 危機中のペナルティ・演出

**ペナルティは「数字をいじる」のではなく「キャラを動かす」方針で設計する**。CLAUDE.md「数字は繊細に使え」「安易な加減算で処理しない」に従う。

| 演出 | 内容 | 実装場所 |
|---|---|---|
| 警告バーUI | 画面上部に常時表示。「資金危機 残り○週」を赤帯で表示 | `ui-render.js` |
| 黒田の警告コラム | 危機突入週・継続週の新聞 Page 1 に editorial モードで掲載 | `kuroda-text.js`, `data.js` |
| 選手の不安発言 | 危機突入週に発言ポップアップ | `flag-dialogue.js` 系 |
| トラスト軽微減 | 危機継続週ごとに高給取り選手のトラストが微減（-2程度） | `management.js` |
| モラル軽微減 | 全選手のモラルが微減（-1程度）。危機中の長期化で滞在感を演出 | `management.js` |

**重要な設計判断**: トラスト・モラルの数値減衰は**「危機中に何もしないで放置すると悪化する」**ことを示す程度の控えめな値に留める。プレイヤーが立て直しに集中するための圧であり、数値ペナルティそのものをドラマにしない。ドラマはセリフと黒田のコラムで作る。

### 2.6 黒田の警告コラム

`KURODA_TEXT.crisis` を新設。editorial モード（冷たく、批判的）で2〜3パターン用意。

```js
// kuroda-text.js
KURODA_TEXT.crisis = {
  enter: [  // 危機突入週
    {
      headline: '【経営警報】「{orgName}」資金枯渇',
      body: '本紙は度々警告してきた。経営とは数字の戦争であり、勝者は黒字を、敗者は破産を手にする。{orgName}は今、後者の崖に立っている。記者として、ただ事実を記す。'
    },
    {
      headline: '【本紙独占】{orgName} 資金底なし',
      body: '夢だけでは興行は続かない。本紙の取材によれば、{orgName}の資金は既に枯渇し、活動継続の見通しは立っていない。残された時間は——もう、長くない。'
    }
  ],
  ongoing: [  // 危機継続週
    {
      headline: '【続報】{orgName} 経営難止まらず',
      body: '危機脱出の兆しは見えない。週ごとに数字は悪化し、選手たちの動揺も伝え聞こえる。本紙は引き続き、この団体の終焉を見届ける。'
    },
    {
      headline: '【観察】数字が告げる現実',
      body: '残り{weeksRemaining}週。{orgName}が黒字へ戻る道筋は、本紙には見えていない。だが、奇跡を否定するのは、記者の仕事ではない。'
    }
  ],
  recovered: [  // 危機脱出週（祝意ではなく冷静な報告）
    {
      headline: '【速報】{orgName} 危機脱出',
      body: '崖際から戻った。本紙は危機の終息を確認したが、再発の可能性まで否定するつもりはない。経営とは、そういうものだ。'
    }
  ]
};
```

セリフは Kuroda voice spec（`docs/character-voices/kuroda.md`）に準拠：宣言調 (`〜だ`、`〜である`)、`本紙は`、`記者として`、`数字は嘘をつかない`系の決まり文句、対比構造。

### 2.7 選手の不安発言（危機突入週）

危機突入週に**ロスター内のトラスト最上位1名**または**人気最上位1名**から1人選び、**archetype ベース**の不安発言を表示。

`CRISIS_DIALOGUE.enter` は archetype をキーに分岐する。同一 archetype 内で複数バリエーションを持つ。

```js
// data.js または新設 crisis-dialogue.js
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
```

---

## 3. パート②: 解散セレモニー（5スライド）

### 3.1 設計思想

クリア時の `showEndingCeremony`（5スライド表彰式）と**対称構造**で設計する。データ構造・スライド遷移・BGM フェード処理など実装パターンを流用し、トーンだけダーク反転させる。

| | クリア時 | ゲームオーバー時 |
|---|---|---|
| 関数名 | `showEndingCeremony` | `showGameOverCeremony` |
| BGM | `bgm/ending.mp3` | `bgm/iwa_gameover001.mp3`（既存） |
| スライド数 | 5 | 5 |
| トーン | 祝祭・希望 | 喪失・別れ・余韻 |
| データ生成関数 | `Engine.ending.buildClearData(state)` | `Engine.ending.buildGameOverData(state)`（既存 `buildGameOverSummary` を拡張） |

### 3.2 スライド構成

| # | クリア時（参考） | ゲームオーバー時（提案） |
|---|---|---|
| 1 | 業界制覇の宣言 | **解散の告知 + 黒田の editorial コラム** |
| 2 | 頂点への道のり（成績表） | 同じ成績表（暗いトーンに） |
| 3 | 選手たちの祝福セリフ ×3 | **選手たちの解散セリフ ×3**（archetype別分岐） |
| 4 | コーチ陣の祝福セリフ | **コーチ陣の解散セリフ** |
| 5 | CONGRATULATIONS | **THE END**（散り際の余韻） |

#### スライド1: 解散の告知

```
━━ シーズン${season} ━━

    💀

  解 散

「${orgName}」は活動停止を発表した。

  ─────────────────

  【黒田 沙智子 編集記事】

  （`gameOverReason` に応じたコラム本文。§3.5 参照）

    [次へ ▶]
```

#### スライド2: 数字が示す現実

既存の `showGameOverScreen` 成績表をスライド形式に分解。フォントカラーをダウントーン（白→灰）に。項目は既存と同じ:

- 活動期間
- 最高ランク
- 最高資金
- 最高団体人気
- 興行回数
- ベストマッチ
- 殿堂入り

タイトルバッジは「📜 ${orgName}の足跡」。

#### スライド3: 選手たちの解散セリフ

人気上位3名（クリア時と同じ選出ロジック）の顔画像 + 解散セリフ。

```
━━ 選手たちの声 ━━

  [portrait1]          [portrait2]          [portrait3]
  ${name1}             ${name2}             ${name3}
  OVR ${ovr1}          OVR ${ovr2}          OVR ${ovr3}
「${解散セリフ1}」    「${解散セリフ2}」    「${解散セリフ3}」

    [次へ ▶]
```

セリフは §3.4 のロジックで個別選出。

#### スライド4: コーチ陣の解散セリフ

雇用中コーチ全員（最大3名）。コーチがいない場合はスライドスキップ。

```
━━ スタッフの声 ━━

  [coach_portrait1]     [coach_portrait2]
  ${coachName1}         ${coachName2}
「${解散セリフ1}」     「${解散セリフ2}」

    [次へ ▶]
```

#### スライド5: 締めくくり

クリア時の `award-frame-f` 相当のフレームを使用するが、装飾を抑えめに。

```
━━ THE END ━━

    🥀

  「${orgName}」の物語は、ここで終わる。

  だが選手たちの戦いは続く——
  どこか別の団体の下で。

    [タイトルへ ▶]
```

「タイトルへ」ボタンでBGMをフェードアウトし、`App.showTitleScreen()` を呼ぶ。

### 3.3 GAMEOVER_LINES データ構造（archetype 主軸）

`data.js` に追加。**archetype が主軸**で、trust レベルでサブ分岐する。

```js
const GAMEOVER_LINES = {
  fighter: {
    // ─────── お嬢様 ───────
    ojousama: {
      high: [  // trust ≥ 70 — 上品な感謝・誇り
        'みなさま、本当にお世話になりましたわ。この団体で過ごした日々は、わたくしの誇りですの',
        '……負けは認めますわ。でも、わたくし、ここで戦えたことを後悔いたしません',
        'お疲れさま、社長。胸を張って、お顔をお上げくださいまし',
      ],
      mid: [   // 30 ≤ trust < 70 — 動揺・困惑
        'まあ……こんなことになりますの……',
        '次の場所は、わたくしが探さなくてはなりませんのね',
        '……心の整理が、つきませんわ',
      ],
      low: [   // trust < 30 — 怒り・侮蔑
        '冗談ではありませんわ。わたくしの誇りは、どうなりますの',
        '最初から信用すべきではありませんでしたのね',
        '……無能、と申し上げてもよろしいかしら',
      ],
    },

    // ─────── 不良 ───────
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

    // ─────── クール ───────
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
        '……'
      ],
    },

    // ─────── 妖艶 ───────
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

    // ─────── 礼儀正しい ───────
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

    // ─────── 普通（フォールバック） ───────
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

  // ─────── コーチ陣 ───────
  coach: [
    '私の力不足だ。選手たちには、すまないとしか言えない',
    'まだ伸びる途中だった子が多い……それが、悔しくてならない',
    'よくここまで耐えた。胸を張りなさい、君たちは',
    '指導者として、最後まで支えきれなかった。それだけが心残りだ',
    '若い選手たちの行く先だけが心配だ。誰か、引き取ってくれるといい',
    '責任は私にもある。社長、頭を上げてくれ',
  ],
};
```

#### 3.3.1 セリフ書き起こしの原則

各 archetype プールのセリフは、**そのarchetypeの口調・人格表現が一貫している**ことを最優先にする。trust レベルは「感情の振れ方」を制御するが、口調そのものは archetype に従う。

例: `bold（情熱）×ojousama` の選手は、怒っていても「ふざけんな」とは言わず「冗談ではありませんわ」と言う。情熱性は怒りの強さや表情に現れるが、語彙・語尾はお嬢様のまま。

### 3.4 セリフ選択ロジック

```js
// management.js または新設 gameover-lines.js
function pickGameOverLine(fighter) {
  const archetype = fighter.archetype || 'normal';
  const trust = fighter.trust ?? 50;
  const trustLevel = trust >= 70 ? 'high' : trust < 30 ? 'low' : 'mid';

  // archetype を主軸にプール選択
  const pool = GAMEOVER_LINES.fighter[archetype]?.[trustLevel]
            || GAMEOVER_LINES.fighter.normal[trustLevel];

  // ランダム選出（同じ顔画像の3名で重複しないようdedup考慮）
  return pool[Math.floor(Math.random() * pool.length)];
}

// 3名分を重複なく選出
function pickGameOverLinesForTop3(fighters) {
  const used = new Set();
  return fighters.map(f => {
    const archetype = f.archetype || 'normal';
    const trust = f.trust ?? 50;
    const trustLevel = trust >= 70 ? 'high' : trust < 30 ? 'low' : 'mid';
    const pool = GAMEOVER_LINES.fighter[archetype]?.[trustLevel]
              || GAMEOVER_LINES.fighter.normal[trustLevel];
    const candidates = pool.filter(line => !used.has(line));
    const final = candidates.length > 0 ? candidates : pool;
    const chosen = final[Math.floor(Math.random() * final.length)];
    used.add(chosen);
    return chosen;
  });
}
```

#### 3.4.1 personality による重み付け（Phase 2 拡張）

Phase 1 では archetype × trust の二軸のみで選出する。Phase 2 として、**personality によるサブセット選択**を導入する余地を残す。

具体的には、各セリフに `tags: ['bold', 'emotional']` のようなオプションタグを付与し、`fighter.personality` と一致するタグを持つセリフを優先選出する。これにより、同じ ojousama × high プール内でも、`bold` × `ojousama` の選手と `quiet` × `ojousama` の選手で異なるセリフが選ばれるようになる。

ただし、Phase 1 のセリフは**archetype が主軸として一貫していれば personality 違いでも違和感なく使える**ように書かれている（同プール内のどのセリフも、その archetype の人格に一致している）。

### 3.5 黒田の解散コラム（スライド1用）

`KURODA_TEXT.gameover` を新設。3つの `gameOverReason` ごとに2パターン用意。

```js
KURODA_TEXT.gameover = {
  // gameOverReason === 'timeout'（4週猶予切れ）
  timeout: [
    {
      body: '数字は嘘をつかない。\n本紙が幾度となく警告してきた帰結である。\n夢を語るのは自由だ。だが、夢を続けるには金がいる。\n——記者として、ただ事実を記す。\nこの団体は、終わった。'
    },
    {
      body: '4週の猶予があった。\nそれでも、立て直しは間に合わなかった。\n経営とは、そういうものだ。\n本紙は{orgName}の解散を、ただ確認する。'
    }
  ],
  // gameOverReason === 'collapse'（即死ライン-1500突破）
  collapse: [
    {
      body: '崩壊である。\n立て直す時間すら与えられなかった。\n資金繰りの破綻は、警告ではなく結末として訪れた。\n——本紙は記録する。{orgName}、解散。'
    },
    {
      body: '数字が、限界を超えた。\nここまで深く沈めば、どんな手も届かない。\n夢の終わり方としては、あまりに無情だ。\nだが、本紙は感傷を書かない。事実だけを残す。'
    }
  ],
  // gameOverReason === 'season_end'（シーズン末で資金マイナス）
  season_end: [
    {
      body: 'シーズンは終わった。\n{orgName}は、次のリングを迎えることなく姿を消す。\n間に合わなかった——それだけのことだ。\n本紙は、この団体の最後のシーズンを記録する。'
    },
    {
      body: 'シーズンを越えられなかった。\n年末の数字は、容赦なく団体の終焉を告げた。\n夢を抱いた一年だった。だが、夢には期限がある。\n——記者として、ただ事実を記す。'
    }
  ]
};
```

### 3.6 BGM

既存の `bgm/iwa_gameover001.mp3` を流用。`showGameOverCeremony` 開始時に `Audio.fileBgm.play(...)` で再生開始、スライド5「タイトルへ」ボタンで `Audio.fileBgm.fadeOut(2000)`。

クリア時の `FileBGM` システム（`ending-gameover-spec-v1.0.md §3` で実装済み）をそのまま流用。

### 3.7 オートセーブ抑制

既存仕様 `ending-gameover-spec-v1.0.md §2.3` の「ゲームオーバー到達時にオートセーブを上書きしない」を継続。

ただし**危機フェーズ突入時はオートセーブを通常通り実行する**。プレイヤーが「危機突入の瞬間からやり直したい」と思ってもいいよう、危機突入週のセーブを残すため。

---

## 4. データ追加サマリー

| 種別 | 場所 | 内容 |
|---|---|---|
| ステート | `createInitialState` | `crisisActive`, `crisisEnteredWeek`, `crisisWeeksRemaining`, `crisisHistoryCount`, `gameOverReason` |
| 危機セリフ | `data.js`（新規）または `crisis-dialogue.js` | `CRISIS_DIALOGUE.enter`（archetype別6種） |
| 解散セリフ | `data.js`（新規） | `GAMEOVER_LINES.fighter`（archetype × trust = 18プール / 各3セリフ）, `GAMEOVER_LINES.coach`（6パターン） |
| 黒田コラム | `kuroda-text.js`（追記） | `KURODA_TEXT.crisis.{enter, ongoing, recovered}`, `KURODA_TEXT.gameover.{timeout, collapse, season_end}` |

---

## 5. UI追加・改修サマリー

| 場所 | 内容 |
|---|---|
| 画面上部 | 危機警告バー（`crisisActive` 時に表示、残り週数カウントダウン） |
| 新聞 Page 1 | 危機中に黒田の警告コラムを優先掲載 |
| 発言ポップアップ | 危機突入週に選手の不安発言を表示 |
| ゲームオーバー画面 | `showGameOverScreen` を `showGameOverCeremony`（5スライド）に置き換え |
| Survival ゲージ | 「-1000で破産」前提のコメント・計算を「危機突入は0、即死は-1500」前提に修正 |

---

## 6. 実装タスク一覧

### Phase 1（最小工数で破産ドラマを完成させる）

| # | タスク | ファイル | 重さ |
|---|--------|----------|:----:|
| 1 | `crisisActive` 等のステートフィールド追加 + 後方互換補完 | `app.js` (createInitialState, ロード時補完) | 極小 |
| 2 | `tickWeek` の破産判定を危機フェーズロジックに置き換え（オフシーズン中は判定スキップ） | `management.js` | 小 |
| 3 | `advanceWeek` の `week > 48` 直前にシーズン末強制判定を挿入 | `management.js` (L13215付近) | 小 |
| 4 | 危機警告バーUI（残り週数表示） | `ui-render.js`, `index.html` (CSS) | 小 |
| 5 | `CRISIS_DIALOGUE` データ追加（archetype別6種） | `data.js` または新規ファイル | 小 |
| 6 | 危機突入時の選手発言ポップアップ実装 | `app.js` または `flag-dialogue.js` | 小 |
| 7 | `KURODA_TEXT.crisis` 追加 | `kuroda-text.js` | 小 |
| 8 | 新聞 Page 1 の黒田コラム差し込みロジック改修 | `kuroda-text.js`, 新聞描画箇所 | 小 |
| 9 | `GAMEOVER_LINES` データ追加（archetype × trust = 18プール / 各3セリフ + コーチ6） | `data.js` | **中** |
| 10 | `pickGameOverLinesForTop3` ヘルパー関数（重複なし選出） | `management.js` | 極小 |
| 11 | `KURODA_TEXT.gameover` 追加（timeout / collapse / season_end の3種） | `kuroda-text.js` | 極小 |
| 12 | `Engine.ending.buildGameOverData(state)` を `gameOverReason` 含めて拡張 | `management.js` | 極小 |
| 13 | `showGameOverCeremony(data, onDone)` 実装（5スライド構成） | `ui-common.js` | **中** |
| 14 | 既存 `showGameOverScreen` 呼び出しを `showGameOverCeremony` に置き換え | `app.js` | 極小 |
| 15 | Survival ゲージのコメント・計算式を新仕様に合わせて修正 | `app.js` (L1298-1310) | 極小 |
| 16 | 危機脱出時のオートセーブ通常実行を確認 | `app.js` | 極小 |

**推定**: Claude Code で1〜2セッション

### Phase 2（後回し可、empirical tuning に基づく拡張）

| # | タスク | 条件 |
|---|--------|------|
| A | personality によるセリフサブセット選択（タグベース） | 同archetype内のバリエーション不足が気になった場合 |
| B | 残資金深さでセリフトーン段階変化 | 「軽い赤字なら再起、深い赤字なら諦観」の差を出したくなった場合 |
| C | 解散後の後日談（「○○は△△団体に移籍した」を成績表下に1〜2行） | 余韻が物足りないと感じた場合 |
| D | `crisisHistoryCount >= 3` で黒田の論調変化（「またか」） | 危機を繰り返すプレイヤー向け演出 |
| E | 緊急救済イベント（融資・スポンサー・ロスター放出） | 危機脱出が困難すぎる/単調すぎる場合 |

---

## 7. 後方互換

### 7.1 ロード時補完

```js
// app.js ロード時
if (G.crisisActive === undefined) {
  G = {
    ...G,
    crisisActive: false,
    crisisEnteredWeek: null,
    crisisWeeksRemaining: 0,
    crisisHistoryCount: 0,
  };
}
if (G.gameOverReason === undefined) G.gameOverReason = null;
```

### 7.2 既存セーブデータの扱い

旧仕様で `funds <= 0` の瞬間に `weekPhase: 'gameover'` がセットされたセーブは、ロード時にそのままゲームオーバー画面（新セレモニー版）に遷移する。`gameOverReason` が `null` なら `timeout` 扱いとして黒田コラムを表示。

---

## 8. 設計メモ

### 8.1 なぜ猶予を「4週」にしたか

- 月次サイクル（プレイヤーの体感単位）と一致
- 短すぎると「結局突然」、長すぎるとダレる
- 即死ライン（-1500）と組み合わせれば、放置プレイで延命できないようになっている

### 8.2 なぜ即死ラインを「-1500」にしたか

- 経済バランス上、週次赤字の最大値は -300〜-500 程度（給料・固定費・コーチ給）
- 4週猶予の間に -1500 まで沈むには、毎週 -375以上の赤字が必要
- 「立て直しを試みる気がない放置」を防ぐ最低ラインとして機能する
- 通常の経営失敗では4週猶予が先に来る。即死は「破滅的な経営」のときだけ発動する

### 8.3 なぜ archetype を主軸にしたか

CLAUDE.md および personality-archetype-spec-v1.0.md に明記されている設計原則:

> 性格は感情のベース — 交渉、関係性、セリフのトーンを決める基盤
> アーキタイプは表現の型 — 同じ性格でも「お嬢様の怒り」と「不良の怒り」は違う

**口調・語彙・人格表現を決めるのは archetype** であり、personality は感情の振れ幅を決める。プレイヤーがキャラとして認識するのは「お嬢様」「不良」「クール」といった archetype のレイヤーであり、別れ際のセリフはこのレイヤーで一貫している必要がある。

trust レベルは「同じ archetype 内で、感謝するか、動揺するか、怒るか」という**感情の方向**を制御する軸として組み合わせる。これによって**プレイヤーの経営履歴が解散の瞬間に物語として立ち上がる**——同じお嬢様キャラでも、丁寧に育てれば誇り高く感謝を述べ、酷使すれば軽蔑して去る。

### 8.4 なぜシーズン末強制判定を入れたか（オフシーズン処理）

実装上、**オフシーズン中は `processSettlement` が走らず、資金変動がほぼ起きない**。これは:

1. オフシーズン中に4週猶予を消化させても無意味（プレイヤーは何もできず、資金も動かない）
2. かといってカウントを停止させると「シーズン末まで持たせれば永遠に逃げ切れる」という抜け道になる
3. オフシーズン中にゲームオーバー画面を出すのも、フェーズ遷移として不自然

最も筋が通る解決は**シーズン末（week > 48）でオフシーズンに突入する直前に強制判定を行う**こと。

これにより:
- 「シーズン終了とともに散る」というドラマ性のある追加演出が成立
- プレイヤーには「ここで持ち直さなければ、シーズンが終わるとともに終わり」という明確なデッドライン圧
- 実装的には既存の `advanceWeek` の `week > 48` 分岐に判定を追加するだけで済む

### 8.5 トラスト・モラル減衰を抑えめにする理由

危機フェーズ中にトラスト・モラルを大きく削ると、「危機脱出 → 全員不機嫌で移籍ラッシュ」という二次破綻が発生する。CLAUDE.md「数字は繊細に使え」に従い、**減衰は『何もしないと悪化する』圧として最小限**に留め、本質的なドラマは**セリフと黒田のコラム**で作る。

### 8.6 なぜクリア時と対称構造にこだわるか

クリア演出が5スライドの厚い演出を持つのに、ゲームオーバーが1画面で終わるのは、**プレイヤーが負けた時に最も冷たく扱われる**設計になっている。CLAUDE.md「辛さを避けない」「鮮烈に見せる」は喜びだけでなく**喪失にも適用されるべき**。負けた時こそキャラの個性を最後にもう一度見せる——そのための対称構造である。

### 8.7 黒田の役割

黒田のコラムは選手たちの感情的な反応の前に**外部から突き放した視点**を一発入れることで、対比でセリフが効いてくる構造になっている。黒田は editorial モード（冷たく、批判的）に固定し、observation モード（中立分析）や interview モード（感傷的）は使わない——破産は「冷徹に記録される事実」として描く。

`gameOverReason` の3パターン（timeout / collapse / season_end）でコラムの内容が変わることで、**同じ「破産」でも、その性質によって黒田の論調が違う**という設計上の解像度が出る。

---

## 9. 旧仕様との関係

`specs/archive/ending-gameover-spec-v1.0.md` のうち、

- §1（クリア演出）→ **そのまま継続**
- §2（破産・ゲームオーバー）→ **本書で置き換え**
- §3（FileBGM）→ **そのまま継続・流用**
- §4（クレジット）→ **そのまま継続**

旧仕様の §2 部分のみ archive 状態となる。本書実装後、`specs/archive/ending-gameover-spec-v1.0.md` の §2 セクションには「→ bankruptcy-redesign-spec-v1.1.md で置き換え」の注記を追記する。
