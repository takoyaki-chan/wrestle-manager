# ケア演出バグ修正 + 豪華化 Spec v1.1

> Status: 設計確認済み、実装待ち
> Created: 2026-03-04
> Target files: ui-common.js (renderResult) / app.js (executeCareAction) / data.js (CARE_REACTION_DIALOGUES) / index.html (CSS追加)

---

## BUG: 団体アクションの全員表示が死んでいる

### 原因

app.js `executeCareAction` の団体向け分岐（3862〜3871行目付近）で、displayData に `fighter`（ランダム代表1人）と `fighters`（全員リスト）の**両方**をセットしている。

```javascript
// 現状（app.js 3862-3870）
const rep = healthyRoster[Math.floor(Math.random() * healthyRoster.length)];
displayData = {
  fighter: rep,        // ← 常にtruthy
  fighters: healthyRoster,
  text: ...,
  ...
};
```

ui-common.js `renderResult`（3231行目付近）の表示分岐が `if (fighter)` → `else if (fighters)` になっているため、`fighter`（rep）が常に truthy なので **`fighters`（全員表示）に到達しない**。

```javascript
// 現状（ui-common.js 3231-3244）
if (fighter) {
  // ← 常にここに入る（rep が存在するから）
  // → ランダム1人のポートレートだけ表示
} else if (fighters && fighters.length > 0) {
  // ← 永遠に到達しない！
  // → 本来の全員顔アイコン一覧
}
```

### 結果

320万の合宿でも100万のパーティーでも「ランダム1人の顔 + セリフ1行」で終わる。

---

## 修正方針

### 修正1: displayData に `isTeam` フラグ追加

**app.js** `executeCareAction` の団体向け分岐を修正：

```javascript
// 修正後（app.js 団体向け分岐）
displayData = {
  fighter: null,          // ← 団体向けなので null
  fighters: healthyRoster,
  repFighter: rep,        // ← セリフ用の代表者（新フィールド）
  text: ...,              // repFighter のセリフ
  isTeam: true,           // ← 新フィールド
  ...
};
```

### 修正2: renderResult の分岐ロジック修正 + 団体向けリッチ化

**ui-common.js** `renderResult` を修正：

```javascript
// 修正後の表示分岐
if (data.isTeam && fighters && fighters.length > 0) {
  // ★ 団体向け表示（camp / party）
  // → 全員の顔アイコン + 代表者セリフ
} else if (fighter) {
  // 個人向け表示（従来通り）
}
```

---

## 団体向けリッチ化の詳細

### camp（合宿 / 320万）— 最高額アクション、一番豪華に

結果画面の構成:
1. **ヘッダー**: `⛺ 合宿` テーマカラー `#2980b9`
2. **全員集合エリア**: 全員の顔アイコン（**72px**、現行56pxから拡大）を横並び折り返し、injury除外、isRental除外。上限なし（全員表示）
3. **セリフエリア**: 代表者の名前 + 「」でセリフ表示（150px ポートレートは不要。全員表示が主役）
4. **フレーバーテキスト（新規）**: 合宿の情景を描写する短文を1つランダム表示。セリフの下に小さく表示。例：*「夜の自主練で○○が黙々とスクワットをしている…」*（名前はロスターからランダム挿入）
5. **before/after changes**: 従来通り（全員の信頼度+2、全員の成長速度+50% 2週間）
6. **費用表示**: 従来通り
7. **SE**: `fanfare`（`award` より格上。もし fanfare が不十分なら追加検討）

フレーバーテキストのデータ（data.js に `CAMP_FLAVOR_TEXTS` として追加）:
```javascript
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
```
`{name1}` `{name2}` はロスターからランダムに選んだ選手の名前（姓のみ or フルネーム）で置換。

### party（打ち上げ / 100万）— そこそこ豪華に

結果画面の構成:
1. **ヘッダー**: `🎉 打ち上げ・慰労会` テーマカラー `#e8439f`
2. **全員集合エリア**: 全員の顔アイコン（**64px**、campより一段小さく差別化）
3. **セリフエリア**: 代表者のセリフ
4. **before/after changes**: 従来通り
5. **SE**: `award`（現行通り）

camp と party の差別化ポイント:
- camp: 72px顔アイコン + フレーバーテキスト + fanfare SE
- party: 64px顔アイコン + フレーバーなし + award SE

---

## セリフ大幅拡充

### camp（合宿）— 現状3行 → 最低15行以上

```javascript
camp: {
  努力家:   [
    'やった！思い切り練習できる！',
    '合宿の間に絶対レベルアップしてみせます！',
    'みっちり鍛えてもらいます！',
  ],
  負けず嫌い: [
    'ライバルに差をつけるチャンスだ！',
    '合宿から帰る頃には一回り強くなってやる！',
  ],
  野心:     [
    'ここで一段階上に行く。絶対に',
    'この投資、結果で返します',
  ],
  忠誠心:   [
    'みんなで一緒に強くなれるなんて…最高です',
    '団体のためにも、全力で取り組みます',
  ],
  破天荒:   [
    'うおー！！ 合宿だ！ 楽しみ！',
    '夜は枕投げだ！…嘘です、練習します',
  ],
  闘志:     [
    'ガンガンやりましょう！ 身体が疼いてます！',
    '限界まで追い込む準備はできてる！',
  ],
  リーダー気質: [
    '私がみんなを引っ張ります。全員レベルアップさせますよ',
    '合宿の段取りは任せてください！',
  ],
  ムードメーカー: [
    'みんなで合宿！最高じゃん！盛り上げるよ〜！',
  ],
  default:  [
    'しっかり鍛えてきます！',
    '頑張ります！',
    '良い合宿にしましょう！',
    'みんなで強くなりましょう！',
    '楽しみです！全力で取り組みます！',
  ],
},
```

### party（打ち上げ）— 現状2行 → 最低10行以上

```javascript
party: {
  努力家:   [
    'みんなお疲れ様でした！明日からまた頑張ります！',
    'たまにはこういう時間も大事ですね',
  ],
  負けず嫌い: [
    '楽しいけど…次の興行ではもっと結果を出したい！',
  ],
  野心:     [
    'いい雰囲気ですね。チームが強くなってる証拠だ',
  ],
  忠誠心:   [
    'こうしてみんなで集まれるのが嬉しいです',
  ],
  破天荒:   [
    'カンパーイ！！ 今日は無礼講だ〜！',
    '代表、もう一軒行きましょうよ〜！',
  ],
  リーダー気質: [
    'みんな最近よく頑張ってるよ。誇りに思う',
  ],
  ムードメーカー: [
    'はいはーい！余興やりまーす！',
    'みんなで写真撮ろ〜！',
  ],
  default:  [
    'お疲れ様でした〜！',
    'みんなで楽しく過ごせました！',
    'こういう時間、いいですね！',
    'リフレッシュできました！',
    '明日からまた頑張りましょう！',
  ],
},
```

### その他アクションのセリフ追加

各アクションについて、trait カバレッジが薄いものを補強。以下は最低ラインの追加分:

**bonus**:
- 闘志: `['よっしゃ！この金で栄養のいいもん食って、もっと強くなります！']`
- リーダー気質: `['みんなの分も頑張らないとね。ありがとうございます']`
- default に2行追加: `'励みになります！'`, `'嬉しいです！大切に使います'`

**costume**:
- 負けず嫌い: `['新コス…！これ着て勝ちまくります！']`
- 忠誠心: `['ここまでしてもらえるなんて…ありがとうございます']`
- 破天荒: `['えっ、これ超かわいい！テンション上がる〜！']`
- default に1行追加: `'次の試合が楽しみです！'`

**trainer**:
- 負けず嫌い: `['この環境を無駄にしない！絶対に結果を出します！']`
- 忠誠心: `['こんな機会をいただけて…全力で応えます']`
- 破天荒: `['マンツーマン！？ めちゃくちゃ贅沢じゃないですか！']`
- 闘志: `['最高の環境だ！限界まで追い込んでもらいます！']`
- default に1行追加: `'しっかり吸収します！'`

**media**:
- 負けず嫌い: `['注目される場は大歓迎です！存在感見せてやる！']`
- 忠誠心: `['団体の看板として恥ずかしくないようにします']`
- 破天荒: `['テレビ！？ ファンのみんな見てる〜？']`
- default に1行追加: `'緊張するけど…頑張ります！'`

**special_treatment**:
- 負けず嫌い: `['早く治してリングに戻りたい…！待ってろよ…！']`
- 忠誠心: `['ご迷惑をおかけしてすみません…必ず戻ります']`
- 破天荒: `['やった〜！最新の治療ってやつですか！？']`
- default に1行追加: `'一日でも早く復帰します！'`

---

## CSS 追加（index.html）

```css
/* camp 専用スタイル */
.care-result-camp-flavor {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-dim);
  font-style: italic;
  text-align: center;
  margin: 0 0 14px;
  padding: 8px 12px;
  background: rgba(41, 128, 185, 0.08);
  border-radius: 6px;
  border-left: 3px solid rgba(41, 128, 185, 0.3);
}

/* 団体アクション全員表示の顔サイズ上書き */
.care-result-team-row.camp-team .care-result-team-member img {
  width: 72px; height: 72px;
}
.care-result-team-row.party-team .care-result-team-member img {
  width: 64px; height: 64px;
}

/* 全員表示時の名前サイズ調整 */
.care-result-team-row.camp-team .care-result-team-name {
  font-size: 11px;
  max-width: 76px;
}
```

---

## 実装チェックリスト

### data.js
- [ ] CAMP_FLAVOR_TEXTS 配列追加（12行以上）
- [ ] CARE_REACTION_DIALOGUES.camp — trait 7種 + default 5行に拡充
- [ ] CARE_REACTION_DIALOGUES.party — trait 7種 + default 5行に拡充
- [ ] CARE_REACTION_DIALOGUES の bonus/costume/trainer/media/special_treatment に trait 追加

### app.js
- [ ] executeCareAction 団体向け分岐: `fighter: null` にして `repFighter` フィールド追加
- [ ] displayData に `isTeam: true` フラグ追加

### ui-common.js
- [ ] renderResult: `isTeam` 分岐を最優先にする
- [ ] 団体向け表示: `fighters` 全員のアイコン表示（camp 72px / party 64px）
- [ ] camp: フレーバーテキスト表示（CAMP_FLAVOR_TEXTS からランダム、{name1}{name2} を実名置換）
- [ ] camp: 全員表示の上限撤廃（全員表示）
- [ ] party: 全員表示（64px）
- [ ] repFighter からセリフ取得・表示
- [ ] camp の SE を `fanfare` に変更（app.js executeCareAction 内）

### index.html
- [ ] `.care-result-camp-flavor` CSS追加
- [ ] `.camp-team` / `.party-team` の顔サイズCSS追加

---

## 注意事項

- Engine（engine.js）の変更は不要。バグはUI層とapp.js のdisplayData構築のみ
- 5原則（Engine純粋関数 / GameState返値更新 / UI直接G変更禁止 / random seed / tickWeek統合）に影響なし
- セリフは「である/ます混在OK」（キャラの性格による使い分け）
