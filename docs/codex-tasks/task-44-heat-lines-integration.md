# Codexタスク44: 熱量セリフ96本を実装に載せる(仮テキストの差し替え)

**作業場所(準備済み)**: `C:\Users\nkmrk\Downloads\wm-task44`
(ブランチ `codex/heat-lines`)。新たにブランチ・worktreeを作らない。
mainに直接コミットしない。**コミットは自分で行わずローカル変更のまま残す**。push・配布禁止。

**変更してよいファイル**: `src/data.js`(セリフ定数の追加とレジストリ登録)、
`src/ui-common.js` / `src/ui-render.js`(参照の差し替え)、`test/` 新規、`docs/worklog.md` 先頭。
**変更禁止**: 上記以外。**成長計算(`GROWTH_CONFIG` / `Engine.growth`)には絶対に触れない**。

---

## 背景

task-38 で「追い込み熱量の可視化」の**表示の器**は完成済み。ただし文言は仮テキスト3行:

```js
// src/ui-common.js:3418 付近
const HEAT_STATE_LINES = {
  fresh: '今は、まだ体が軽そうだ。',
  warm: '少し息が上がっている。',
  heavy: '今は体が重そうだ。',
};
```

**Keisuke承認済みの本番セリフ96本**が用意できたので、これを載せる。

## セリフの正

**`docs/dialogue/heat-visibility-lines-draft-v0.1.md`**(承認済み・Keisuke修正10件反映済み)。

- `HEAT_STATE_SELF_LINES` — 選手本人の様子 **75本**
  (3状態 × personality 7種 × archetype セル、`_default` フォールバックあり)
- `HEAT_STATE_COACH_LINES` — 道場でコーチが漏らす観察 **21本**(3状態 × 7本)

## 実装するもの

### 1. data.js への実装

- 草案の2定数を **一字一句そのまま** `src/data.js` へ実装する
  (既存の `EVENT_RENTAL_GREETING_LINES` 近辺、同じ構造)
- `EVENT_LINES_BY_KEY` に `heatSelf` / `heatCoach` として登録
- Node エクスポートにも追加

### 2. 選手側セリフの差し替え

`src/ui-common.js` の仮 `HEAT_STATE_LINES` を廃し、
**`pickDialogueLine(HEAT_STATE_SELF_LINES[state], fighter)`** で引く形にする
(レンタル挨拶 `getRentalQuote` と同じ流儀)。

- 参照順は `[state][personality][archetype] || [state][personality]._default ||
  [state].normal._default`
- **吹き出しで出す場合は §3 の規約に従う**(白い吹き出し・黒文字・画像の上・名前は外)。
  ただし選手詳細の情報行として出すだけなら現状の見せ方のままでよい
  (**器の見せ方は task-38 の実装を尊重し、文言だけ差し替える**)

### 3. コーチ側セリフの追加

道場画面で**コーチが観察として漏らす**枠に `HEAT_STATE_COACH_LINES` を配線する。

- 対象は **heavy の選手がいるとき**を主とし、fresh/warm も出せるなら出す
- `{name}` プレースホルダは選手名に置換する
- **既存の匂わせセリフ(成長リバランス v1.0 の strain 系48本)と同じ週に重ねて出さない**
  (草案の申し送りに記載あり。時間軸が違う別物なので、同時に出すと混乱する)

### 4. 回復ルールが伝わることの担保

草案の申し送り:
> heavy の「休ませれば戻る」「一週抜けばまた入るようになる」の2本が、
> **間欠運用が正解**だと分かる唯一の明示。これがないと「一度重くなったら終わり」と
> 誤読して追い込みを封印されてしまう。

**この2本が heavy のプールから落ちないこと**を確認し、テストで固定する。

## 不変条件

1. **成長計算に触れない。** `node test/auto-sim.js 20` の fingerprint が変更前と一致すること
2. セリフ本文は草案と**一字一句同一**(照合テストで担保。加入挨拶と同じく
   **草案mdを直接パースして data.js と比較**する方式にすること)
3. プレイヤー向けテキストに内部変数名・数値・倍率を出さない
   (「熱量」「追い込み」という語も選手側セリフには出さない。コーチ側は
   「追い込みすぎだ」程度の言及は可 — 草案の方針どおり)
4. `_heat` 未設定・レンタル・怪我中の選手で表示が壊れない
5. `npm test` 全PASS(152/152+新規)

## テスト

`test/heat-lines-test.js`(新規):
- 草案md をパースし、`data.js` の2定数と**完全一致**すること
- 全43字以内
- 3状態 × 全personality で `pickDialogueLine` が例外なく引けること
- heavy プールに「休ませれば戻る」系の回復明示が**2本以上**残っていること
- 出力に数値・倍率・内部変数名が現れないこと

## 完了報告

1. 不変条件1(fingerprint 前後一致)の実測値
2. コーチ側セリフをどの画面のどこに配線したか、strain系との排他をどう実装したか
3. 不変条件2〜5の確認結果
4. 判断に迷った箇所

`docs/worklog.md` 先頭に詳細ログ。
