# Codexタスク26: 「📜 記録」タブ新設(殿堂+歴代記録) と ピークOVR表示

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`

**作業ブランチ**: `codex/records-tab-and-peak-ovr`(`main` から切る)

```bash
git switch -c codex/records-tab-and-peak-ovr main
```

**すでに専用の作業ツリー(Codex アプリが用意する `~/.codex/worktrees/...` 等)に居る場合は、
上のブランチ作成だけを行い、新たに worktree を作らないこと。**
**メインの作業ディレクトリで作業する場合に限り**、先に隔離すること:

```bash
git worktree add ../wm-codex-records -b codex/records-tab-and-peak-ovr main
cd ../wm-codex-records
```

いずれの場合も、**着手前に `git status` が clean であることを確認する。**

**変更してよいファイル**: `src/ui-render.js`、`src/ui-common.js`、
`src/index.html`(CSS追加とヘルプ文言のみ)、`src/mobile.css`(必要な場合のみ)。
**変更禁止**: `src/management.js` / `src/app.js` / `src/data.js` ほか上記以外の `src/`、
`specs/`、`docs/`(`docs/worklog.md` 先頭への完了ログ追記は例外)。
**本タスクは表示のみの変更で、GameState を書き換えるコードを1行も追加しないこと**
(アーキテクチャ原則3: UIはGameStateを直接変更しない)。
どうしても Engine 側のヘルパーが必要だと判断したら、**実装せずに報告して指示を仰ぐこと。**

**コミットはOK**(日本語の明確なメッセージ)。**push は禁止。**
配布スクリプトは実行しない。新規ファイルは作らないので `release/manifest.json` の更新は不要。

**task-25(MVPレース、`src/management.js`)と並行してよい。** 触るファイルが重ならないので
競合しないはずだが、同一ツリーで並行作業しないこと。

---

## デザインの正(必ず先に読む)

1. `docs/ui/mockups/hof-records-and-peak-ovr-v0.4.html` — **Keisuke採用済みの確定レイアウト
   (2026-07-30)**。歴代記録ページの構成・密度・文言はこれに合わせる
2. `docs/ui/01-foundations.md` / `docs/ui/02-layouts.md` — CSSトークンとカテゴリ規約
3. 既存の殿堂実装: `src/ui-render.js:9153` 付近(`_renderDbHallOfFame` ほか)、
   CSS は `src/index.html:1073` 付近(「殿堂 v2.0」ブロック)

モックアップ内のダミー16進カラーをそのまま持ち込まないこと。
**色は必ず `var(--*)` トークン**(--gold / --gold-light / --text-sub / --text-dim / --border 等)。
PPVの紫はトークンが無いので `:root` に `--ppv-accent`(既存慣用色 #9b59b6 系)を1つ追加して使う。

---

## A. タブ名変更とセグメント化

1. データベースのサブタブ `{ label: '🏅 殿堂', idx: 3 }`(`src/ui-render.js:6472` 付近)を
   **`📜 記録`** に変更
2. タブ3の中身を上部セグメント(2択)で切り替える:
   - **「🏅 殿堂入り」(デフォルト)** — 既存の `_renderDbHallOfFame()` を**無改変で**表示
     (フィルタ・ソート・詳細ポップアップの挙動を一切変えない)
   - **「📜 歴代記録」** — 新規レンダラ `_renderDbRecordBook()`
   - セグメント状態はモジュール変数(例 `_dbRecSeg`)で保持。`_dbHofFilter` 等と同じ流儀
3. `src/index.html` のヘルプ/チュートリアル文中に「殿堂」タブ名の言及があれば追随
   (`index.html:9710` 付近「🏆 殿堂 — 引退した名選手たちの記憶」など。
   記録タブになった旨に文言を最小修正)
4. **タブのNEWバッジ**: `G.mqRecord` / `G.mqRecordTag` のどちらかが
   `record.season === G.season && record.week === G.week` のとき、
   「📜 記録」タブラベルに小さな更新バッジを点灯(記録更新の週だけ)

---

## B. 歴代記録ページ `_renderDbRecordBook()`

v0.4 モックアップの4ブロック構成。上から:

### B-1. MQ記録ストリップ×2(最上段・小さく1列)

- 左=シングル(`G.mqRecord`)、右=タッグ(`G.mqRecordTag`)。グリッド2カラム
- 構成: 縦書きラベル「歴代最高」+ 数字(Bebas 34px・金/タッグは青系)+
  顔アイコン22px(`getPortraitUrl`)+ 対戦カード名 + 下段に
  「シングル ─ S{n}・第{w}週 ─ {舞台名}」
- 舞台名は `Engine.mq.STAGE_LABELS[record.stage]`。名前解決は
  `Engine.mq._fighterName(G, id)` を使う(roster/AI/FA/引退を横断済みのヘルパー)
- **未更新(holderIds が null)のストリップ**: 数字(初期値90/94)を text-dim で暗く出し、
  対戦カード行は空にする。**「まだありません」の類いの説明文は書かない**
  (このプロジェクトの規約: 不在データの説明文を出さない)
- 記録が `season === G.season && week === G.week` なら「記録更新!」点滅バッジ

### B-2. 天頂戦 歴代優勝(主役・大判アッパー)

- 見出し: 儀式調(Shippori Mincho・字間広め)「天頂戦 歴代優勝」+
  リード「4年に一度、業界の頂を決める舞台」
- 全選手(roster / 全AI団体 / freeAgents / retiredFighters)の
  `careerRecord.history` から `type === 'ppvTournament' && result === 'champion'` を走査し、
  (season, 選手) を **season 昇順**で並べる
- 1枚 = アッパー画像 132×198(`getUpperUrl(id, peakOVR)`、`peakOVR` は
  `careerRecord.peakOVR || 現在OVR`)+ 画像下部の名前帯(名前+団体名)+
  足元に 🌿S{n}🌿 プレート + 「第{k}回 王者」
- 画像が無い/読めない選手は既存流儀のイニシャル色面フォールバック
- **末尾に次回開催の空席枠**(破線・「次回 S{次の開催シーズン}」)。
  次回シーズンは season%4==0 の次の該当年
- **アッパー画像は左右反転しない**(既存ルール)。カードタップで選手詳細ポップアップへ
- 優勝者の選手オブジェクトがどのリストからも見つからない season がありうる
  (引退者の清掃後など)。その場合は `G.fighterArchive` 等の年代記アーカイブから
  名前・IDを引けないか調査し、**引けなければその回は名前のみ(画像なし)ではなく
  スキップせず、イニシャル色面+名前不明表記を避けるため、解決できた情報の範囲で
  名前だけのカード**にする。どう転んだかを報告に書くこと

### B-3. PPV GRAND FINAL 歴代優勝(中判・横スクロール)

- 同じ文法でひと回り小さく(96×144)、アクセントは `--ppv-accent`(紫)
- `type === 'ppvMainEvent' && isSummit && won === true` を走査、
  season **降順**(直近が左)で横一列。溢れたら横スクロール(`overflow-x:auto`)
- 足元プレートは S{n} のみ。名前帯・タップ挙動は B-2 と同じ

### B-4. 最多連続防衛(王者の肖像・横帯)

- 走査対象:
  1. 全選手 history の `titleLoss` イベントの `defenses`(終わった政権)
  2. 現王者の防衛数: `G.titles.world.defenses` と各 `G.aiOrgs[*].titles.world.defenses`
  の最大値を採る(同数なら新しい方)
- 表示: 👑+アッパー画像88×132 + 「最多連続防衛」+ 防衛数(Bebas 46px)+ 名前 +
  「{王座名} ─ 期間」。期間は titleWin/titleLoss の season から推定できる場合のみ
  「S5〜S7」形式、推定できなければ陥落(または現在)のシーズン単独表記でよい。
  **凝った推定ロジックは書かない**(分かる範囲で出す)
- 現王者が記録保持中の場合は「継続中」と添える
- 該当が1件も無い(誰も防衛経験なし)場合はブロックごと非表示(説明文は出さない)

### 共通

- CSSは `src/index.html` の「殿堂 v2.0」ブロック付近に「記録 v1.0」としてまとめて追加
- スマホ幅: 天頂戦・PPVの列は横スクロール、MQストリップは縦積みに落ちる程度の
  レスポンシブ対応(`mobile.css` に既存の殿堂系の書き方があれば倣う)
- 走査はレンダリング時のみ・読み取り専用。結果のキャッシュ等でGameStateに書き込まない

---

## C. ピークOVR表示(3箇所・すべて確定済み仕様)

データ源はすべて `careerRecord.peakOVR` / `careerRecord.peakOVRSeason`(週次更新済み)。

**共通の表示条件: `現在OVR < peakOVR` のときのみ表示**(成長途上の選手には出さない)。
現在OVRは `Engine.util.ov(fighter)`。

1. **選手詳細ポップアップのヘッダー**(`src/ui-common.js:3471` 付近):
   名前+OVR(36px金)の行の直後に `ピーク {peak} (S{n})` を追加。
   スタイルは text-sub 13px、シーズン部分は text-dim 11px(=A-1案。
   モックアップ v0.4 の「② 確定済み」セクション参照)
2. **団体タブ ロスター詳細パネル・能力タブ**(`src/ui-render.js:1915` 付近):
   40px Bebas の OVR 行に `ピーク {peak}(S{n})` を追加。クリーム面なので
   cream-text-dim / cream-text-sub 系トークンで一段落とす
3. **選手詳細・戦績タブの既存ピーク表示**(`src/ui-common.js:3820`):
   `&& !isChamp` 条件を**撤廃**して王者でも表示する(他は変えない)

---

## 不変条件

1. **GameState への書き込みゼロ。** 本タスクの diff に G(state)を変更する行が
   1行でもあれば失敗
2. **殿堂入りセグメントの挙動は完全無変更**(フィルタ/ソート/詳細ポップアップ/盾グリッド)
3. **ハードコード16進カラーを新規に持ち込まない**(トークンのみ。--ppv-accent の定義は可)
4. **プレイヤーに見える文言に内部変数名を出さない**(MQ/mqRecord/peakOVR 等は不可。
   「試合評価」「ピーク」等の日本語)
5. **不在データの説明文を出さない**(未更新記録・防衛記録なし等は静かに省略/減光)
6. ピークOVRは `現在OVR < peakOVR` のときのみ。等しい/上回っている選手には出ない
7. アッパー画像・顔画像を左右反転しない

---

## 検証

- **auto-sim は不要**(UIのみの変更。プロジェクト規約)
- `npm test` が全 PASS(2026-07-30 時点 133/133)
- 手元での動作確認は「新規ゲーム数シーズン進行後」と「既存セーブ読込直後
  (records未更新状態)」の2状態でスクリーンショット的に確認し、確認内容を報告に列挙
  (最終のUI実機確認は Keisuke に委任するので、確認してほしい画面・操作を
  完了報告に具体的に列挙すること)

## 完了報告に書いてほしいこと

1. 不変条件 1〜7 の確認結果(1 は「stateに書き込む行が無い」ことを diff で示す)
2. 新設した文言の**全文**(見出し・リード・バッジ・期間表記など。文章系は全文チェックを受ける)
3. B-2 の名前解決フォールバック(fighterArchive 等)がどう転んだか
4. Keisuke に確認してほしい画面・操作・表示の一覧
5. 判断に迷って別の解釈を採った箇所

`docs/worklog.md` の**先頭**に詳細ログを追記。specs/ と roadmap は触らない(こちらで更新する)。

---

## 参考資料

- `docs/ui/mockups/hof-records-and-peak-ovr-v0.4.html` — 確定レイアウト(v0.1〜v0.3は経緯)
- `src/ui-render.js:9153`〜 — 殿堂 v2.0 実装(セグメント側で再利用)
- `src/management.js:2453`〜 — mqRecord / mqRecordTag / STAGE_LABELS / _fighterName
- `src/management.js:3043` — Engine.career.updatePeakOVR(データ源の確認用)
- `src/ui-render.js:10584` 付近 — 年代記のアッパー画像カード(getUpperUrl の使用例)
- `specs/chronicle-system-spec-v0.1.md` — fighterArchive の形
