# 🌬 試合前後フレーバーポップアップ設計書 v0.2

> **ステータス**: 🟢 v0.2 実装済み (per-match 化 + 試合後余韻)
> **作成日**: 2026-04-14
> **更新**: 2026-04-28 (v0.2): 試合前ポップアップを per-match へ移動、試合後余韻ポップアップを追加
> **更新**: 2026-09-26: 試合後の「敗者の心」を試合一覧の殻の上に出す形へ(§4.6.1。それまで興行中に一度も出ていなかった)
> **更新**: 2026-09-26: 試合前の「✨ 初対決」の判定を直し、観戦を選んだ試合の前に試合一覧の殻の上へ出す形へ(§4.2.1。それまで判定が壊れていて、しかも一度も出ていなかった)
> **依存**: personality-archetype-spec-v1.0.md / character-data-spec-v1.7.md
> **関連**: `match-popup-overview-v0.1.md` (全体構想)
> **🔧マーク = 調整可能パラメータ**

---

## なぜこの仕様が存在するか

ファン期待カードの固定化問題から始まった議論で、実装側を確認した結果、**問題はタイプ数の不足ではなく、興行のプラス効果が「数字でしか語られていない」体験設計にある**ことが判明した。

既存のファン期待カード試合後ポップアップ (`FAN_EXPECT_REACTIONS` 経由) は試合後・勝者のみ・ファン期待カード限定であり、(1) 試合の入りの空気を作れない、(2) ファン期待カード以外のプラス試合(初顔合わせ・スタイル相性・ヒール vs フェイス etc.) には何も出ない、という構造的な限界がある。

本仕様は、興行プラス効果のある試合に対して**試合前に空気感を作る一言ポップアップ**を導入することで、数字での縛りに頼らずプレイヤーの体験報酬を成立させる。

---

## 設計原則

1. **派手にしない** — これは挨拶であって事件ではない。一言だけ、autoClose で流れる、SE は控えめ
2. **両者に出す** — 1試合につき左右両選手それぞれに1件のポップアップ。化学反応は2人で起きる
3. **既存インフラだけで作る** — `showEventPopup` / `pickDialogueLine` / `getPortraitUrl` は完成済み。新規描画コードはゼロ
4. **数値変化を伴わない** — 軽い層なので、状態変化やフォローアップは扱わない。それは仕様B(重い層)の責任
5. **段階拡張前提** — 最小実装は初顔合わせ1種類のみ。手応えがあれば他のプラス効果に同じ仕組みを被せる

---

## §1 スコープ

### §1.1 本仕様で実装するもの

**v0.1 → v0.2 で構造変更**: 全試合終了後に一括 enqueue する旧設計から、**per-match (各試合ごと) に試合前 + 試合後** へ流す設計に切り替え。

- 試合プレビュー画面で `nextIdx` がフォーカスされた瞬間に発火する「試合前ポップアップ」per-match フック (`renderMatchPreview` 内、`App._runPreMatchFlavorForMatch(idx)` を呼ぶ)
- 試合確定直後 (`skipMatch` / `watchMatch` が `sp.results[idx]` を埋めた直後) に発火する「試合後余韻ポップアップ」per-match フック (`App._afterMatchSettle(idx)` → `App._runPostMatchFlavorForMatch`)
- 初顔合わせ試合の検出ロジック (試合前)。判定は `G.matchupLog` を読むだけ — 試合シミュレート結果に依存しない
- 勝者/敗者の余韻セリフ (試合後)
- 初顔合わせ用セリフプール `FIRST_MEET_LINES` + 試合後余韻用 `POST_MATCH_FLAVOR_LINES` (data.js, personality × archetype 形式)
- 各対象試合につき左右2件のポップアップを `showEventPopup` で enqueue
- 既存の宣戦布告モーダル (`showRivalryPopups`) と直列に流れる: 宣戦布告モーダル → 初顔合わせフレーバー → 試合 → 余韻フレーバー → (次試合へ)

### §1.2 段階拡張の対象（本仕様では実装しないが、構造上の余地として残す）

- ファン期待カード実現試合の試合前ポップアップ
- 因縁マッチの試合前ポップアップ
- タイトル戦の試合前ポップアップ
- スタイル相性プラスの試合前ポップアップ
- ヒール vs フェイスの試合前ポップアップ
- 連勝中の選手参加試合の試合前ポップアップ

各拡張は「検出条件1行 + セリフプール1個 + popups.push 1ブロック」で済む構造にする。

### §1.3 本仕様で**やらない**こと

- 顔画像レンダリングの新規実装 (既存 `showEventPopup` がやる)
- セリフ抽選機構の新規実装 (既存 `pickDialogueLine` がやる)
- モーダル表示・状態変化通知・フォローアップ (仕様B の責務)
- マンネリペナルティ仕様の見直し
- 集客・メディア収入の数値バランス調整
- `Engine.fanExpect` ロジックの変更
- スナップショット通知システムへの変更

---

## §2 検出条件

### §2.1 初顔合わせ判定

`Engine.executeShow` が返す各 result `r` には以下が既にセットされている (ui-common.js L3876 で参照済み):

- `r.freshnessBonus` (number)
- `r.freshnessLabel` (string | null) — 初顔合わせの場合 `'初顔合わせ'`

検出は単純に：

```javascript
const isFirstMeet = (r.freshnessLabel === '初顔合わせ');
```

新しい状態フィールドは追加不要。既存データを読むだけ。

### §2.2 除外条件

- **ロスター外の選手**: `r.left.id` または `r.right.id` がプレイヤーロスターに存在しない場合は除外 (例: 乱入選手など)。理由は、顔画像の取得や違和感の問題を避けるため。**ただし最小実装では除外せず、`getPortraitUrl` のフォールバックに任せる**(乱入選手にも顔画像はある)
- **同期入団ペア**: 「初顔合わせ」感が薄いので除外候補だが、**最小実装では入れない**。試遊で違和感が出たら次版で追加

### §2.3 1興行内に初顔合わせが複数あった場合

全ての初顔合わせ試合に対してポップアップを出す。ただし1興行に5試合中4試合が初顔合わせのような状況(新人ドラフト直後など)では、ポップアップが連続8件流れることになる。これは**試遊で違和感が出るかを観察する項目**とする (§7)。

将来の調整余地：
- 1興行あたりのポップアップ件数上限を設ける
- メインイベントとセミ系のみに絞る
- 重要度(両選手の人気・OVR・タイトル保持)で優先度をつけて上位N件のみ

これらは必要が確認されてから入れる。先回りしない。

---

## §3 セリフプール

### §3.1 構造

`data.js` に新規定数 `FIRST_MEET_LINES` を追加。形式は既存の `pickDialogueLine` + `getDialoguePool` が解決できる personality × archetype 構造。

### §3.2 初期セリフプール (案・実装時に増減可)

```javascript
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
```

🔧 セリフ数・口調は試遊で調整。最低でも各 personality の `_default` には2行以上。

### §3.3 セリフが「初対面感」を保つための注意

- 過去の試合や因縁を匂わせる文言は入れない (例: 「リベンジしてやる」「あの時の借りを」)
- 試合の勝敗を予告する文言は控えめに (例: 「絶対に勝つ」より「全力でぶつかる」)
- キャラの個性は出すが、長台詞は避ける (autoClose 1.8秒で読み切れる長さ)

---

## §4 実装フロー

### §4.1 ファイル別の変更 (v0.2)

| ファイル | 変更内容 |
|---|---|
| `src/data.js` | `FIRST_MEET_LINES` (試合前) + `POST_MATCH_FLAVOR_LINES` (試合後 winner/loser) を export |
| `src/app.js` | `_collectPreMatchPopupsForMatch(idx)` / `_collectPostMatchPopupsForMatch(idx, result)` / `_runPreMatchFlavorForMatch(idx)` / `_runPostMatchFlavorForMatch(idx, result, then)` / `_afterMatchSettle(idx)` を追加。`skipMatch` / `watchMatch` / iframe 試合結果受信ハンドラの末尾を `_afterMatchSettle(idx)` 経由に統一。`finalizeShow` から旧一括 enqueue ブロックを削除 |
| `src/ui-common.js` | `renderMatchPreview` の nextIdx フォーカス時フックで、宣戦布告モーダル完了後に `App._runPreMatchFlavorForMatch(nextIdx)` を呼ぶ |

新規ファイルは作らない。`Engine.fanExpect` には触らない。スナップショットシステムには触らない。

### §4.2 試合前ポップアップ - per-match 発火フロー (v0.2)

```javascript
// ui-common.js renderMatchPreview() 末尾、nextIdx フォーカス時:
const cMap = sp.confrontationMap;
const hasConfrontation = cMap && cMap[nextIdx] && !sp._shownConfrontations.has(nextIdx);
if (hasConfrontation) {
  sp._shownConfrontations.add(nextIdx);
  setTimeout(() => showRivalryPopups([cMap[nextIdx]], () => {
    App._runPreMatchFlavorForMatch(nextIdx);  // 宣戦布告モーダル後に初顔合わせ等
  }), 400);
} else {
  setTimeout(() => App._runPreMatchFlavorForMatch(nextIdx), 400);
}
```

```javascript
// app.js: 1試合分のみのポップアップ収集 (試合シミュレート結果に依存しない)
App._collectPreMatchPopupsForMatch = function(idx) {
  const sp = App._showPreview;
  const m = sp.validMatches[idx];
  if (m.matchType === 'tag') return [];     // タッグは現状非対応
  const popups = [];
  // 初顔合わせ: matchupLog に過去対戦が無いなら検出
  const log = G.matchupLog || [];
  const hasPriorMatch = log.some(e =>
    (e.left === m.left && e.right === m.right) || (e.left === m.right && e.right === m.left)
  );
  if (!hasPriorMatch) {
    // ... 左右両選手分の popup を push (FIRST_MEET_LINES から pickDialogueLine)
  }
  return popups;
};
```

#### §4.2.1 現行の形(2026-09-26 Keisuke 裁定「判定を直して出す」)

上の §4.2 のコード(フォーカスの時点・`e.left` / `e.right`・`showEventPopup`)は旧来の形。現行は次のとおり。

- **判定(本当に初めて当たる2人だけ)**: `App._collectPreMatchPopupsForMatch`。`G.matchupLog` の項目 `{ leftId, rightId, showCount }` に
  その2人(向きは問わない・id は数に揃えて比べる)が1つも無く、**かつ**対戦成績 `G.h2h`(`Engine.h2h.getRecord`)の `matches` が0のとき。
  matchupLog は自団体が関わった試合だけ(カードの鮮度 `Engine.freshness` 用。保存で切り詰めた分は `_everFoughtPairs` からロード時に戻る)なので、
  他団体の興行・秋の対抗戦などの大会・開始前の経歴の対戦も持つ対戦成績も見る(台詞が「初めまして」の類いのため。観戦の画面の「FIRST MEETING」の札も対戦成績で決まる)。
  タッグは出さない(従来どおり)
- **出す経路 = 観戦を選んだ試合だけ**: 「🎬 試合を観る」を押した後・観戦の画面(iframe)を開く前(`App.watchMatch` → `App._runFirstMeetBeforeWatch`)。
  スキップ(1試合・残り全試合)では出さない。敗者の心(観戦した試合の後)と対で、観戦する試合を「初対決 → 試合 → 結果 → 敗者の心」で挟む。
  - 理由: 興行は前座からメインへ進む(試合一覧の次の試合は配列の末尾から)。旧来のようにフォーカスの時点(観るかスキップかを選ぶ前)に出すと、
    `sp._suppressFlavor`(一度スキップしたら以降の試合前の画面を出さない)のせいで、前座をスキップしてメインを観る遊び方ではメイン
    (挑戦状・統一王座戦などの大一番)の初対決がまず出ず、前座の初対決だけが選ぶ前に割り込む。観戦を選んだ試合の前なら、
    スキップしたい人の手を止めず、観たい試合だけを照らせる
  - 前の試合をスキップしていても、観戦を選んだ試合には出す(敗者の心と同じ。`_suppressFlavor` は見ない)
  - 派閥の試合前の画面がある試合(派閥内序列戦 `_internalChallengeLocked`・F08 `_f08Locked`・F09 `_f09Locked`)には出さない
    (従来どおりその画面が優先。その画面はフォーカスの時点の `_runPreMatchFlavorForMatch` のまま)
- **見せ方**: 敗者の心と同じ口(`showMatchFlavorPopups`。初対決は `showPreMatchFlavorPopups`・カードの印 `.pre-match-flavor`)。
  mdl-c の小型カード+頭上の吹き出し(クリーム地+黒文字・台詞だけ)+画像 M 132×194(減彩しない)+名前+「✨ 初対決」。
  左の選手 → 右の選手の順に1枚ずつ、それぞれ 1.8秒(OK で早く閉じてよい)、間は 200ms。試合一覧の殻(`showResultOverlay`)は
  排他の相手に数えない(殻の上に出る)。汎用の `showEventPopup` / `_eventPopupQueue` は通さない
- **進行**: 2枚とも閉じてから観戦を始める(1回だけ)。出ている間は試合一覧が覆われて押せない。1試合1回だけ(`sp._shownFirstMeet`)で、
  観戦の再入はそこを素通りし、結果が入っていれば `watchMatch` の頭で止まる(1操作=1進行)。1枚ごとに出す直前に、その興行のその試合が
  まだ始まっていないかを確かめ(`isStillValid`)、始まっていれば残りを出さない
- **保険**: `件数×2200 + 1500` ms の時限。殻以外の画面が本当に開いていて待ち行列で止まったときだけ発火し、`[WM] firstMeet safety net fired`
  を出して、出ていない一言を取り下げ(後から待ち行列で呼ばれても出さない)観戦へ進む
- 2026-09-26 まで: 判定が `matchupLog` を `e.left` / `e.right` で見ていて(項目は `leftId` / `rightId`)一度も一致せず毎試合「初対決」と判定し、
  しかもフォーカスの時点に `showEventPopup` で出そうとして殻の後ろの待ち行列に積まれ、興行中に一度も出ていなかった(週送りの全消去で捨てられていた)。
  回帰テスト `test/pre-match-first-meet-over-show-shell-test.js`。点火 `b3-challenge-watch`(観戦して2枚)・`b3-challenge`(スキップで0枚)・
  `incoming-challenge-watch` が `.pre-match-flavor` を数える
- 試合前のほかの画面との順番: フォーカスの時点に 因縁の宣戦布告(`showRivalryPopups`)→ 派閥の試合前の画面、観戦を押した後に 初対決 → 観戦。
  重ならない(初対決は宣戦布告の完了を待たない)。※宣戦布告は `_enqueuePopup` を殻の例外なしで通るため、興行中は殻の後ろに積まれて出ていない(未修正・報告済み)

### §4.6 試合後余韻ポップアップ - per-match (v0.2 新規)

試合確定直後、勝者/敗者それぞれの一言を順に流す。autoClose 1.8s × 2件 = 約4秒。

```javascript
// app.js:
App._afterMatchSettle = function(idx) {
  const sp = App._showPreview;
  const result = sp.results[idx];
  const finalize = () => {
    renderMatchPreview();
    if (sp.results.every(r => r !== null)) App.finalizeShow();
  };
  if (!result || result._stale) { finalize(); return; }
  App._runPostMatchFlavorForMatch(idx, result, finalize);
};
```

`POST_MATCH_FLAVOR_LINES` は `winner` と `loser` の二系統。引き分け・タッグ・スタレ結果はスキップ。

#### §4.6.1 現行の形(2026-09-26 Keisuke 裁定「敗者の心を出す」)

- **出す経路**: 観戦した試合だけ(`watchMatch` → 試合結果の画面 → 「次の試合へ」 → `_runPostMatchFlavorForMatch`)。1試合スキップ・残り全試合スキップでは出さない(`_afterMatchSettle(idx, { skipFlavor: true })`。省略の意思表示)
- **中身**: 勝者の一言は試合結果の画面の吹き出しへ統合済み。ここでは**敗者の一言だけ**を1枚(`_collectPostMatchPopupsForMatch`)。見出し「— 敗者の心 —」は画像の下の小さな文字で、吹き出しの中は台詞だけ
- **見せ方**: C-3 と同じ mdl-c の小型カード(`.mdl-c-body.post-match-flavor`)。頭上の吹き出し(クリーム地+黒文字・画像の上の予約枠・尻尾は画像の中心)→ 画像 M 132×194 → 名前 → 「— 敗者の心 —」。敗者の画像は `is-loser`(`grayscale(.9) brightness(.72)`)。画像か名前を押すと選手詳細
- **描画の口**: `showPostMatchFlavorPopups(popups, onDone)`(ui-common.js)。興行中ずっと active な試合一覧の殻(`showResultOverlay`)は排他の相手に数えない(`_isPopupActive({ ignoreShowResultOverlay: true })`。F08/F09 の試合後の画面・直訴の結果と同じ例外)。汎用の `showEventPopup` / `_eventPopupQueue` は**通さない**(殻の後ろで止まったままの項目を先頭に抱えていることがあり、後ろに並ぶと出られない)
- **時間**: `autoCloseMs` 1800ms で自動で閉じる。OK で早く閉じてもよい。閉じてから 200ms 後に次の1枚、全部閉じたら `onDone` を1回だけ呼び、そこで試合一覧を描き直して次の試合へ(次の試合の試合前の画面は描き直しの 400ms 後)。自動のタイマーと OK が重なっても進むのは1回
- **保険**: 呼び出し側は `件数×2200 + 1500` ms の時限を掛ける。殻以外の画面が本当に開いていて待ち行列で止まったときだけ発火し、`[WM] postMatchFlavor safety net fired` を出して、出ていない一言を取り下げ(`cancel()`。後から待ち行列で呼ばれても出さない)先へ進む
- 2026-09-26 まで: `showEventPopup` → `_enqueuePopup` を通していて、殻を「開いている別の画面」と数えて殻の後ろに積まれ、**興行中に一度も出ず**、保険のタイマーが毎試合発火していた(点火 `incoming-challenge-watch` / `b3-challenge-watch` で発見。積まれた一言は週送りの全消去で捨てられていた)。回帰テスト `test/post-match-flavor-over-show-shell-test.js`

### §4.3 `_onEventPopupQueueEmpty` の使い方

`ui-common.js` L1515-1522 で既に定義されているコールバック機構を使う。設定方法は単純な代入 (`_onEventPopupQueueEmpty = fn`)。発火は1回限りで自動クリアされる。

注意: 既に他の処理から `_onEventPopupQueueEmpty` がセットされている場合は上書きを避けるため、設定前に nullチェックを入れる方が安全。実装時に既存の使用箇所をgrepで確認する。

### §4.4 ポップアップが出ている間のユーザー体験

- ポップアップは autoClose 1.8秒で自動消滅する。プレイヤーは何もしなくていい
- OK ボタンは表示されるが、待たなくても流れる
- 連続表示時の待ち時間は既存の `_renderEventPopup` ロジック (200msのインターバル) に従う
- 1試合分(2件) で約 1.8 + 0.2 + 1.8 = **約4秒**。5試合中1試合が初顔合わせなら興行ごとに4秒延長

---

## §5 既存 `FAN_EXPECT_REACTIONS` ポップアップとの関係

### §5.1 本仕様での扱い

**触らない**。初顔合わせのみを対象とする本仕様では、ファン期待カード試合後ポップアップ(`FAN_EXPECT_REACTIONS` 経由)とは干渉しないため、現行動作をそのまま維持する。

### §5.2 段階拡張時の整理予定

仕様 A の段階拡張で「ファン期待カード実現試合の試合前ポップアップ」を入れるタイミングで、現行の試合後ポップアップとの関係を整理する。

予定:
- 試合後ポップアップは廃止し、試合前ポップアップに役割を移す
- ただし `FAN_EXPECT_REACTIONS` のセリフ資産自体は別名 (`SHOW_AFTERMATH_LINES` 等) で保持し、将来別用途で再利用できるようにする
- 試合前ポップアップ用には別途「期待を背負う側のセリフ」を新規に書き起こす(現行セリフは試合後感想なので転用不可)

これは別仕様 (`match-flavor-popup-spec-v0.2.md` 等) で扱う。

---

## §6 段階拡張ロードマップ

最小実装の手応えを見た上で、段階的に対象を増やす。各段階は単独の差分仕様として起こす。

| 段階 | 追加対象 | 新規セリフプール | 検出条件 |
|---|---|---|---|
| v0.1 (本仕様) | 初顔合わせ | `FIRST_MEET_LINES` | `r.freshnessLabel === '初顔合わせ'` |
| v0.2 | ファン期待カード実現 | `FAN_EXPECT_PRE_LINES` | `r.fanExpectMatch === true` (+ `FAN_EXPECT_REACTIONS` 廃止移行) |
| v0.3 | 因縁マッチ | `RIVALRY_PRE_LINES` | `r.rivalryBonus` あり |
| v0.4 | タイトル戦 | `TITLE_PRE_LINES` | `r.isTitleMatch === true` |
| v0.5 | スタイル相性プラス | `STYLE_CLASH_LINES` | スタイル相性マトリクスから判定 |
| v0.6 | ヒール vs フェイス | `HEEL_FACE_LINES` | `role` フィールド比較 |

各段階で同じパターン: 検出条件 + セリフプール + popups.push ブロックの追加のみ。`collectPreMatchPopups` の中に並べていく形。

複数のプラス効果が同じ試合に重なった場合(例: 初顔合わせ + タイトル戦)は、**両方のポップアップを出す**(片方ずつ4件流れる)のか、**優先度の高い方だけにする**のかは、段階拡張時に判断する。最小実装では初顔合わせしか対象がないので問題にならない。

---

## §7 受け入れ条件 (試遊検証項目)

最小実装が完了したとき、以下を試遊で確認する：

1. **発生する**: 初顔合わせを含む試合を組んだとき、結果オーバーレイの直前にポップアップが2件流れる
2. **顔と声がある**: ポップアップに顔画像とセリフが正しく表示される
3. **空気が変わる**: プレイヤーが「いつもと違う」と感じる(数字を見ていなくても何か起きていると認識できる)
4. **流れすぎない**: 1興行で4-6件のポップアップが流れても煩わしくない
5. **流れすぎる場合の挙動**: 新人ドラフト直後の興行など、初顔合わせが多すぎる興行で煩わしさが出るか確認
6. **強制感がない**: ポップアップが出るからといって何かを「やらされている」感覚にならない
7. **既存ポップアップとの両立**: ファン期待カード実現試合では試合前ポップアップが流れた後、試合後にも既存の `FAN_EXPECT_REACTIONS` ポップアップが流れる(両方出る・干渉なし)

このうち1〜3が満たされなければ仕様レベルで再設計する。4〜5に問題が出たら §2.3 の絞り込みを検討する。

---

## §8 公開パラメータ一覧 (🔧)

| パラメータ | 初期値 | 場所 |
|---|---:|---|
| ポップアップ autoCloseMs | 1800 | §4.2 |
| ポップアップ間インターバル | 200 (既存値) | §4.4 |
| 1興行あたりポップアップ件数上限 | なし(無制限) | §2.3 |
| 同期入団ペア除外 | OFF | §2.2 |
| 効果音 | `'event'` (既存) | §4.2 |

---

## §9 オープンアイテム

実装着手前または実装中に決定が必要なこと：

1. **`_onEventPopupQueueEmpty` の既存使用箇所との衝突**: 既に他のフローで使われていないか grep で確認し、衝突があれば連結方法を決める
2. **乱入選手の顔画像**: 乱入選手の `id` で `getPortraitUrl` がフォールバックに落ちるか動作するかを実機で確認
3. **`FIRST_MEET_LINES` の総量**: 各 personality の `_default` 最低3行を目安にするが、初期版は不足してもよい(試遊で増やす)
4. **トーナメント中(ジュニアトーナメント等)の挙動**: トーナメント中の試合演出フローが通常興行と異なる場合、本仕様の対象から外すか確認。ジュニアトーナメントは試合数が多く初顔合わせも多発するため、煩わしくなる懸念がある — **要実機確認**

---

## このスペックの精神

> 興行のプラス効果を、数字ではなく一言で伝える。
>
> ファン期待カードを「組まないと損するカード」から「組んだら何か空気が変わるカード」に変える。プレイヤーの動機を、数字での誘導から好奇心での誘導に切り替える。
>
> ただし、これは挨拶であって事件ではない。派手にしない。一言だけで、流れていく。重い瞬間は別仕様で別途扱う。
