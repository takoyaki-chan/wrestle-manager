# 宿怨（BITTER）試合前セリフ 草案 v0.1

> ロードマップ該当項目: 「**宿怨（BITTER）の試合前セリフ** ⏸ 未着手。宣戦布告（「今日こそ決着をつける」）は
> 決着済みの関係に合わないため今は沈黙。**宿怨らしい専用セリフを書いてから**入れる（2026-07-27 Keisuke）」
>
> 本ファイルは**セリフ草案**。実装（data.js への投入・配線）は Keisuke 承認後。

---

## 1. 調査で分かった「宿怨」の定義

### 1.1 発生条件（`src/management.js` `Engine.title.checkResolution`）

宿怨は**因縁の終着点のひとつ**。決着（resolution）を **2回** 経たペアだけが到達する。

| 段階 | 条件 | 結果 |
|---|---|---|
| 1回目の決着 | 相互 rivalry 60+ / 対戦 4戦以上（他団体戦は3戦以上＋ペア固有の散らし0〜2） / MQ が OVR 相応の閾値以上 | `resolutionCount=1`。rivalry がリセットされる（bond 50未満なら 25〜35 に落ちる＝**火は消えきらない**） |
| 2回目の決着 | 再び相互 rivalry 80+ に戻り、同条件を満たす | **bond で分岐**：`minBond >= 50` → **好敵手（goodRival）** / `minBond < 50` → **宿怨（bitter）** |

つまり宿怨とは —
**「決着を2度もつけたのに、最後まで互いを好きになれなかった関係」**。
一度リセットされた rivalry が、また 80 まで戻るところまでやり合った上で、
それでも bond が 50 に届かなかった。**時間をかけて嫌いになりきった仲**である。

### 1.2 決着後の状態（`Engine.title.getRivalryLevel`）

- `resolved: 'bitter'` が `G.rivalries[key]` に**永続**保存される（以後 `recordRivalry` は早期 return し、この関係は二度と更新されない＝**凍結された結論**）
- 表示ラベル `宿怨` / 絵文字 `💀` / 色 `#636e72`（無彩色のグレー。好敵手 `#74b9ff` の青と対照的）
- 内部 rivalry は **35 固定**扱い（好敵手は 5）。MQボーナスは +2（好敵手と同値）
- 決着時のポップアップ文言（既存・`src/ui-common.js`）:
  - タイトル「決 着。し か し、宿 怨 は 消 え ず」
  - sub `THE MATCH IS OVER ・ THE GRUDGE REMAINS`
  - タグ「💀 勝敗は決した。しかし、遺恨は消えなかった」
  - トーンクラス `tone-bitter`

**この既存文言が、宿怨の温度の公式定義**として最も明快。「勝敗は決した／しかし遺恨は消えなかった」。

### 1.3 9象限（`specs/rivalry-chronicle-spec-v1.0.md`）との関係

因縁列伝の 9象限は「現在の bond×rivalry」で毎回引き直す**別軸の分類**であり、
宿怨（`rivalries[].resolved`）とは独立している。ただし成立条件から、
宿怨ペアは象限表の **右列（bond ≤ 30）** に位置する:

| | bond ≤ 30 |
|---|---|
| rivalry ≥ 80 | `pure_hatred`（憎悪の宿敵） |
| rivalry 60-79 | `bitter_feud`（不仲の因縁） |
| rivalry 40-59 | `cold_rivalry`（反目しあう） |

決着直後の宿怨は rivalry 30〜40 に落ちるため、実際には象限表の閾値（40）近辺〜下。
**「憎悪のピークは過ぎている。残っているのは澱」** という位置づけがデータ上も一致する。

### 1.4 既存セリフとの差別化（何を書いてはいけないか）

| 定数 | 場面 | 代表文 |
|---|---|---|
| `RIVALRY_CONFRONTATION_LINES` | 試合前・rivalry 50〜69 | 「今日こそ、決着をつける」「この因縁、今夜終わりにしよう」 |
| `RIVALRY_CONFRONTATION_LINES_70` | 試合前・rivalry 70〜89 | 「逃げ場はないよ。ここで終わらせるから」 |
| `RIVALRY_CONFRONTATION_LINES_90` | 試合前・rivalry 90+ | 「……この日を待ちに待った。」「全部賭ける。残らず全部」 |
| `BITTER_RESOLUTION_LINES` | 宿怨**成立時**（決着直後） | 勝者「……終わった。もう二度と、あんたの顔は見たくない」／敗者「……認めない。こんなの認めない」 |

既存の宣戦布告 3種はすべて **未来形の宣言**（決着をつける／終わらせる／この日を待った）。
**宿怨は決着済みなので、この構文がそのまま矛盾する。**

`BITTER_RESOLUTION_LINES` は**決着した瞬間**の熱（「もう顔を見たくない」「認めない」）。
本草案はその**数シーズン後**にあたる。熱が抜けて、冷えて固まった状態を書く。
成立時の激情をそのまま薄めた言い換えにしてはいけない。

---

## 2. 設計メモ

### 2.1 セリフの核

宿怨は **「決着したのに終わらなかった」関係**。宣戦布告とは感情の質が違う。

- 好敵手 = 認め合う熱 → 宣戦布告が似合う
- **宿怨 = 決着後も残った冷たい澱** → 「もう決着はついた。それでもまだ許せない」

書くべきは、相手への挑発でも新たな決意でもなく、
**すでに終わった関係を、また踏まされることへの静かな反応**。

意図的に幅を持たせた感情（憎悪一辺倒にしない）:

| 感情 | 例 |
|---|---|
| 疲れ・うんざり | 「いつまでやるんだろうね、これ」 |
| 自分でも持て余している自覚 | 「忘れられたら楽だったのに」 |
| 身体に残った記憶 | 「まだ胃の底が重い」「あの日の音が耳から抜けない」 |
| 切り捨て・侮蔑 | 「済んだ話だ。まだ立ってる方がどうかしてる」 |
| 諦めきれなさ | 「もう格付けは済んでいるのかも。それでも・・・」 |
| 認定されることへの怒り | 「終わった扱いされんのが、一番腹立つ」 |

### 2.2 勝者側／敗者側の書き分け — **実装可能**

`Engine.h2h.getRecordFor(state, selfId, opponentId)` が `{ matches, wins, losses, draws, bestMQ, lastMatch }`
を返す（`src/relationships.js` L4339〜）。**直接対戦の勝敗が引ける**ので、
1本の pool を `ahead` / `behind` の2つに割る。

- **`ahead`（勝ち越している側）= 勝者側の宿怨**
  勝ったのに晴れない。何度倒しても相手が消えない。切り捨てたいのに切り捨てきれていない自分への苛立ち。
- **`behind`（負け越している側）= 敗者側の宿怨**
  負けた記憶が消えない。「終わった」と周りが言うたびに自分だけ取り残される。執着とその疲弊。

**なぜ「決着戦の勝者」ではなく「通算の勝ち越し」を軸にするか**:
`G.rivalries[key]` は決着戦の勝者IDを保存していない（`resolved` フラグのみ）。
`h2h.history[]` と `lastAbsWeek` を突き合わせれば決着戦の勝者は特定できるが、
宿怨は**永続**関係でその後も何度も対戦するため、5シーズン前の1戦に声を固定すると
「あの日負けた」と言いながら以後4連勝している、といったズレが必ず出る。
通算の勝ち越しなら常に現在の事実と一致し、自己更新する。**通算軸を推奨**。

### 2.3 構造

既存の因縁セリフ定数と同じ `[personality][archetype]` 二軸。
第一分岐を `ahead` / `behind`（= 既存 `BITTER_RESOLUTION_LINES` の `winner`/`loser` と同じ位置）に置く。
`getDialoguePool()` の探索順（`_voice` → personality → archetype → `_default`）にそのまま乗る。

### 2.4 厳守事項の確認

- 全56本 **43文字以内**（最長27文字）
- 固有名詞なし（相手は「相手」「そっち」「あの日」等の指示語のみ）
- 内部変数名・数値なし
- 「今日こそ決着を」「絶対に倒す」系の宣戦布告構文をゼロ本に
- 同一感情の言い換えを並べない（1本ごとに角度を変えた）

---

## 3. コードブロック

```js
// ── 宿怨（BITTER）ペアの試合前セリフ ──
// 決着を2度経てなお bond が届かなかった関係。宣戦布告ではなく、
// 「終わったはずのものが、また目の前にある」ことへの反応を書く。
//   ahead  = 直接対戦で勝ち越している側（勝ったのに晴れない）
//   behind = 直接対戦で負け越している側（負けた記憶が消えない）
// 側の判定は Engine.h2h.getRecordFor(G, selfId, oppId) の wins/losses で行う。
//   wins > losses → 'ahead' / wins < losses → 'behind'
//   同数のときは直近対戦の勝者を 'ahead'、それも引けなければ 'behind'
const BITTER_PREMATCH_LINES = {
  ahead: {
    standard: {
      normal: [
        '終わったはずなのに、まだ胃の底が重い',
        'もう一度勝てば消えるのかな。……多分、消えない',
      ],
      bold: [
        '勝った側が、いつまで覚えてなきゃいけないの',
        '終わらせたのは私。付き合ってやるのは、これで最後',
      ],
      quiet: ['………（終わったはずの相手を、じっと見ている）'],
      shy: ['…もう終わったのに…どうして、また気になるんだろう…'],
      easygoing: [
        'はぁ……また？ もう終わった話でしょ、これ',
        '勝っても軽くならないもんだね。……不思議',
      ],
      earnest: [
        '決着はつきました。……私の中だけ、まだです',
        '勝った人間が引きずるのは、変な話ですね',
      ],
      emotional: ['終わったって言ったのに……！ なんで、まだいるの'],
    },
    cool: {
      normal: ['……済んだ話だ。まだ気にする方がどうかしてる'],
      quiet: ['……終わった。それだけだ。……それだけのはずだ'],
    },
    delinquent: {
      normal: ['片付いた話を蒸し返すな。……いい加減、疲れるんだよ'],
      bold: ['もう決着はついてんだよ。何度潰されりゃ気が済む'],
    },
    composed: {
      normal: ['…決着はついてる。…なのに、まだ喉に引っかかってる'],
      bold: ['…片付いた相手だよ。…なのに、まだ目で追ってる'],
      quiet: ['……もう済んだ。…なのに、目が探してしまう'],
      easygoing: ['…また同じ顔か。…終わったって言ったんだけどな'],
      earnest: ['…終わった件だよ。…片付けきれてないのは、私の方か'],
      emotional: ['…勝ったのに、まだ腹が煮えてる。…笑えないな'],
    },
    ojousama: {
      bold: ['倒した相手と同じ列に並ばされる屈辱、分かるかしらね？'],
      earnest: ['下ろしたはずの荷を、また持たされているみたいですわね'],
    },
    polite: {
      quiet: ['…もう済んだはず、なんです。…なのに、まだ'],
      shy: ['勝たせて…いただきました。…なのに、怖いままです…'],
      earnest: ['済んだことにしたいのです。……できないだけで'],
    },
    seductive: {
      easygoing: ['片がついた相手なのにね。…目に入るとイラつくわ'],
      emotional: ['済んだ話よ……っ……なのに、まだ手が震えるの'],
    },
  },
  behind: {
    standard: {
      normal: [
        '終わったことにされた。私だけ、置いていかれたまま',
        '忘れられたら楽だったのに。……よく覚えてるんだ、これが',
      ],
      bold: [
        '終わりってことにされてる。でも私はまだ認めない',
        'もう格付けは済んでいるのかも。それでも・・・',
      ],
      quiet: ['………（あの日の敗北の瞬間が、まだ耳から抜けない）'],
      shy: ['…あの日敗北した屈辱を…まだ、毎晩思い出すんです…'],
      easygoing: [
        'みんな綺麗に忘れてるね。……私は忘れないけど',
        'いつまでやるんだろうね、これ。……やめられないけど',
      ],
      earnest: [
        'あの負けを、まだ一度も納得できていません',
        '終わったと言われるたび、足元が抜けるんです',
      ],
      emotional: ['終わってない……！ 勝手に終わらせないで……！'],
    },
    cool: {
      normal: ['……決着はついた。納得したとは、言ってない'],
      quiet: ['……終わっていない。……私の中では'],
    },
    delinquent: {
      normal: ['終わった扱いされんのが、一番腹立つんだよ'],
      bold: ['あの日から一度も、まともに寝てねえんだよ'],
    },
    composed: {
      normal: ['…片がついたらしいよ。…誰の中で、って話だけど'],
      bold: ['…終わった話らしいね。…じゃあ、この重さは何なんだろう'],
      quiet: ['……もう昔の話だ。…そう言えたら、楽だったな'],
      easygoing: ['…忘れたふりが下手でさ。…まだ引きずってるよ'],
      earnest: ['…終わったって言われてる。…受け取れてないだけだよ'],
      emotional: ['…勝手に幕を下ろさないで。…まだ、こっちに残ってる'],
    },
    ojousama: {
      bold: ['幕を引かれた側の気持ちは、誰も聞きませんのね'],
      earnest: ['終わったことにされた分は、まだお返ししていませんの'],
    },
    polite: {
      quiet: ['…終わったと、皆さんは仰います。…私は違います'],
      shy: ['…もう終わったって…言われました。…言われただけです…'],
      earnest: ['決着は……ついておりません。私の中では、まだ'],
    },
    seductive: {
      easygoing: ['終わったって聞いたわ。…誰が決めたのかしらね'],
      emotional: ['終わったの……？ ……嘘よ。まだ、疼いてる'],
    },
  },
};
```

**本数内訳（計 56本）**

| personality | ahead | behind |
|---|---:|---:|
| normal | 5 | 5 |
| bold | 5 | 5 |
| quiet | 4 | 4 |
| shy | 2 | 2 |
| easygoing | 4 | 4 |
| earnest | 5 | 5 |
| emotional | 3 | 3 |
| **計** | **28** | **28** |

archetype カバレッジ: `cool`(normal/quiet) `delinquent`(normal/bold) `ojousama`(bold/earnest)
`polite`(quiet/shy/earnest) `seductive`(easygoing/emotional) `composed`(全7 personality)。
未指定の archetype は既存慣行どおり `_default` にフォールバックする。

---

## 4. 実装申し送り（承認後の作業メモ）

### 4.1 data.js

1. `BITTER_RESOLUTION_LINES` の直後（L4898 付近）に上記ブロックを追加
2. 末尾の export リスト（L30304 付近、`GOODRIVAL_RESOLUTION_LINES, BITTER_RESOLUTION_LINES,` の行）に
   `BITTER_PREMATCH_LINES` を追加

### 4.2 app.js — 検出（現在の「沈黙」の実体）

`src/app.js` L6500〜6525 の宣戦布告検出ループが、コメントどおり明示的に宿怨を除外している:

```js
if (rivalLvl && !rivalLvl.isGoodRival && !rivalLvl.isBitterRival && (rivalLvl.rivalry || 0) >= 50) {
```

**注意**: 除外条件を外すだけでは出ない。`getRivalryLevel` は宿怨に `rivalry: 35` を返すため
`>= 50` のゲートで落ちる。**宿怨は独立した分岐**として書く必要がある。

confrontation オブジェクトに以下を足して ui-common へ渡す（側の判定は app.js 側で済ませる）:

```js
isBitter: true,
leftSide:  _bitterSide(G, m.left,  m.right),   // 'ahead' | 'behind'
rightSide: _bitterSide(G, m.right, m.left),
```

判定ヘルパー（配置は app.js ローカルで十分）:

```js
function _bitterSide(G, selfId, oppId) {
  const rec = Engine.h2h.getRecordFor(G, selfId, oppId);
  if (!rec) return 'behind';
  if (rec.wins > rec.losses) return 'ahead';
  if (rec.wins < rec.losses) return 'behind';
  // 五分のときは直近対戦の勝者を ahead 扱い
  const raw = Engine.h2h.getRecord(G, selfId, oppId);
  const last = raw && raw.history && raw.history[raw.history.length - 1];
  if (!last || last.win === 'd') return 'behind';
  const selfIsA = selfId < oppId;
  return ((last.win === 'A') === selfIsA) ? 'ahead' : 'behind';
}
```

他団体所属の相手でも h2h は記録されているので、遠征・挑戦試合・対抗戦でも成立する。

### 4.3 ui-common.js — 表示

`_renderRivalryPopup()` の `phase === 'confrontation'` 分岐（L2318〜2346）に宿怨ケースを追加。

```js
if (o.isBitter) {
  leftLine  = pickDialogueLine(BITTER_PREMATCH_LINES[o.leftSide  || 'behind'], leftFighter);
  rightLine = pickDialogueLine(BITTER_PREMATCH_LINES[o.rightSide || 'behind'], rightFighter);
}
```

**タイトル・タグは既存の宣戦布告用（「因 縁 勃 発」「⚡ ふたりの間に火花が散った」）が
そのまま矛盾する**ので、宿怨専用に差し替える。提案（Keisuke 裁定事項）:

| 要素 | 現行（宣戦布告） | 宿怨案 |
|---|---|---|
| title | 因 縁 勃 発 | **ま た、目 の 前 に** |
| sub | RIVALRY DECLARED ・ FATED | **SETTLED ・ NOT FORGIVEN** |
| toneCls | tone-confront | **tone-bitter**（決着時と共通。無彩色グレー） |
| vsIcon | ⚡ | **💀** |
| vsLabel | 勃 発 | **再 会** |
| tag | ⚡ ふたりの間に火花が散った | **💀 決着は済んでいる。それでも、二人は向き合った** |
| audioKey | rivalry_confrontation | 要検討（`fate_confrontation` は熱すぎる可能性。SE差し替え工程と合流させるのが安全） |

### 4.4 頻度の設計判断（要 Keisuke 裁定）

宿怨は**永続**関係で、同じ2人がその後何度でも対戦する。
毎回ポップアップを出すと「冷えた澱」であるはずの関係が毎試合前に自己主張して逆に軽くなる。

推奨: **同ペアにクールダウンを置く**（例: 前回表示から一定週数が経過した対戦でのみ表示）。
既存の宣戦布告は rivalry がゼロに落ちて自然に止まるが、宿怨にはその自然停止がない点が構造上の違い。
「スポットライトは巡るもの、配るものではない」（CLAUDE.md）に照らしても、毎回は出しすぎ。

### 4.5 その他

- 本ファイルと data.js の一字一句照合テストは、必要なら
  `test/join-greeting-badges-test.js`（本ファイル方式の先例）と同じ手法で追加できる
- 実装後に `specs/relationship-system-spec-v2.x` の §7 因縁称号まわりへ宿怨の試合前演出を1行追記
- `docs/dialogue/03-rivalry-and-relationship.md`（セリフカタログ）にも本定数を追記

---

## 改訂履歴

- v0.1 (2026-07-31) 初版起案。宿怨の成立条件・既存セリフとの差別化を調査した上で
  `ahead`/`behind`（h2h 通算勝ち越し軸）2系統×56本を執筆。実装は未着手
