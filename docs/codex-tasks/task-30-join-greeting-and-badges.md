# Codexタスク30: 加入第一声(キャリア判定式)+スカウト/FA識別バッジ

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**作業場所(準備済み)**: `C:\Users\nkmrk\Downloads\wm-task30`
(ブランチ `codex/join-greeting-badges` をチェックアウト済みの git worktree)

このフォルダでそのまま作業する。新たにブランチ・worktreeを作らない。mainに直接コミットしない。
着手前に `git status` clean を確認。**コミットは自分で行わずローカル変更のまま残す**。push・配布禁止。

**変更してよいファイル**: `src/data.js`(セリフ定数の追加とレジストリ登録のみ)、
`src/ui-common.js`(挨拶取得・表示関数一帯)、`src/app.js`(スカウト獲得フローへの表示呼び出しのみ)、
`src/ui-render.js`(スカウト画面のバッジ表示のみ)、`test/` 新規、`docs/worklog.md` 先頭。
**変更禁止**: `src/management.js`(査定・金額ロジックには一切触れない)、既存セリフ定数の削除・改変。

---

## 背景(確定済みの設計 2026-07-30 Keisuke)

- スカウト獲得(発掘)には加入の一言が無い(ゲームログのみ)。FA契約には契約セレモニー+ウェルカムの2段が既存
- 金額ルールは両経路とも同一(`Engine.scout.getSigningCost`)。違いは母集団だけ
- **第一声の出し分けは「獲得経路」ではなく「その選手のキャリアの有無」で行う**(本人のデータに正直に):
  - キャリアなし(発掘された原石) → `SCOUT_GREETING_LINES`(見つけてもらった誇り)
  - キャリアあり(流浪からの契約) → `FA_GREETING_LINES`(拾われた再起・恩義)
- スカウト画面で **FA選手と発掘候補を色違いのバッジで見分けられるようにする**

## A. セリフ定数の実装(src/data.js)

`docs/dialogue/signing-greeting-draft-v0.1.md`(承認済み草案)の
`SCOUT_GREETING_LINES` / `SCOUT_GREETING_GENERIC_LINES` / `FA_GREETING_LINES` /
`FA_GREETING_GENERIC_LINES` を **一字一句そのまま** data.js のセリフ定数群
(EVENT_RENTAL_GREETING_LINES の近く)へ実装する。**本文の改変・追加・削除は禁止。**

- `EVENT_LINES_BY_KEY` へ `scoutGreeting` / `scoutGreetingGeneric` / `faGreeting` /
  `faGreetingGeneric` として登録
- Node エクスポート(30128行付近の module.exports 相当)にも追加
- 既存の `EVENT_FA_SIGNING_LINES` / `EVENT_FA_WELCOME_LINES` は**そのまま残す**(削除禁止)

## B. キャリア判定と第一声の取得(src/ui-common.js)

新設 `getJoinGreeting(char)`:

1. **キャリア判定** `hasCareerHistory(char)`(ヘルパー新設):
   `(char.wins||0)+(char.losses||0)+(char.draws||0) > 0`、または `careerRecord.history` に
   `debut` 以外の所属歴イベント(`transfer`/`release`/`contractEnd`/`suddenDeparture`/`retire`)がある、
   または `careerSeasons >= 1`。いずれかで「キャリアあり」
2. キャリアあり → `FA_GREETING_LINES`、なし → `SCOUT_GREETING_LINES` を
   `pickDialogueLine(pool, char)` で引く(レンタル挨拶 `getRentalQuote` と同じ流儀)
3. **25%の確率で既存 `EVENT_FA_WELCOME_LINES` から引く**(軽い「よろしく」系も混ざるように。
   キャリア有無を問わず)。乱数は既存の Math.random 流儀でよい
4. プール不在時のフォールバックは `*_GENERIC_LINES` → 固定文字列、の順(既存関数と同型)

## C. 表示の配線

1. **FA契約フロー**: `confirmSigning`(ui-common.js:1579)の welcome popup で
   `getWelcomeQuote(fighter)` → `getJoinGreeting(fighter)` に差し替え。
   契約セレモニー側(`getSigningQuote`、契約前の一言)は**現状のまま**
2. **スカウト獲得フロー**: スカウト活動の獲得処理(app.js:5289付近「🔍 スカウト獲得」)の後に、
   獲得選手ごとの加入ポップアップを追加する。表示形式はレンタル加入(ui-common.js:6890-6895)と
   同じ `showEventPopup({type:'fighter', ...})` 型:
   `message: 「{getJoinGreeting(f)}」` / `detail: '{名前}が加入しました！(スカウト獲得)'`
   - 同週に複数名獲得した場合はポップアップを順次(既存のイベントポップキュー機構に乗せる。
     キューが無ければ1人目のみ表示し、残りはログのままでよい — どちらにしたか報告)

## D. スカウト/FA識別バッジ(src/ui-render.js + 必要ならui-common)

スカウト画面の候補一覧で、**どちらの出自か一目で分かる色違いバッジ**を候補カードに付ける:

| 出自 | ラベル | 色 |
|---|---|---|
| FA(既存の無所属選手 = G.freeAgents 由来) | `FA` | `var(--blue)` 系(枠+文字。薄い塗り) |
| スカウト発掘(スカウト活動の候補) | `発掘` | `var(--green)` 系(同上) |

- 形式は既存の `.tier-pill` / `.badge` と同族のピル(Oswald / 10px / letter-spacing / 角丸3px)。
  **ハードコード16進は禁止**、`var(--blue)` / `var(--green)` + rgba() 相当は既存トークンの
  組み合わせで(必要なら `--join-fa` / `--join-scout` のエイリアスを :root に追加してよい)
- 表示場所: スカウト画面の候補カード(ui-render.js:4896付近の一覧)と、
  契約セレモニーのヘッダー(ui-common.js:1538付近)に小さく
- 判定は「そのカードがどのリストから来たか」(freeAgents か スカウト候補か)で行う。
  キャリア判定(B)とは独立(バッジ=出自、セリフ=キャリア)

## 不変条件

1. セリフ本文は草案と一字一句同一(照合テストを書く: 草案mdをパースして比較、または
   代表20本のサンプル一致確認)
2. キャリア判定: 新規発掘の17歳(戦績0・履歴debutのみ) → SCOUT側/元所属持ちFA → FA側。
   両ケースをテスト
3. 生成文に undefined/NaN が出ない(プール欠損セルでも _default → GENERIC へ落ちる)
4. 既存のFA契約セレモニー・レンタル挨拶・引き抜きリアクションの挙動は不変
5. GameState 書込みは表示用の一時フィールドも含めて追加しない
6. バッジ色はトークンのみ。内部変数名をプレイヤーに見せない
7. `npm test` 全PASS(141/141 = 既存140+新規1)

## 完了報告に書いてほしいこと

1. 不変条件1〜7の確認結果
2. スカウト複数獲得時のポップアップ処理をどうしたか
3. バッジの実装箇所スクリーン一覧と、Keisukeに確認してほしい画面・操作
4. 判断に迷った箇所

`docs/worklog.md` 先頭に詳細ログ。specs は触らない(こちらで更新)。

## 参考

- `docs/dialogue/signing-greeting-draft-v0.1.md` — セリフの正(承認済み)
- `src/data.js:29973` — EVENT_RENTAL_GREETING_LINES(構造見本)
- `src/ui-common.js:3290-3332` — 既存の quote 取得関数群 / 6890 — レンタル加入ポップ
- `src/ui-common.js:1518-1596` — FA契約セレモニー+confirmSigning
- `src/app.js:5289` — スカウト獲得処理
