# task-103 レポート — PPV TV観戦(ppvTV)フェーズの進行不能を根治

- 起票: 2026-08-31(実セーブ棚の実走で D2_FREEZE を検出)
- 担当: Claude(worktree agent-af6a8cef42b746fd3、ベース 699a860)
- 状態: 調査完了 → 修正 → 検証

---

## 1. 症状

最古の実セーブ `legacy-saves/v1.0x_S2W23_2026-03-21.json` を実UIで走破すると、
**S2W48 の PPV TV観戦フェーズ(`weekPhase='ppvTV'`)で必ず止まる**。

```
node test/ui-walkthrough/run.js --mode walk --seasons 1 --seed 42 \
  --fixture legacy-saves/v1.0x_S2W23_2026-03-21.json --max-steps 160
→ Walkthrough: FAIL / D2_FREEZE: no safe progress control is visible
   Final state: {"season":2,"week":48,"weekPhase":"ppvTV", ...}
   overlays: ["showResultOverlay"] / popup {queueLength:1, active:true}
```

699a860(旧セーブ年末クラスタ修正4件)を取り込んだ後も**同じ場所で同じように落ちる**ことを
再実行で確認済み(2026-08-31、94.4s、step159 到達後に D2)。

---

## 2. 真因

### 2-1. 直接原因(file:line)

`src/ui-common.js:7696-7727` `renderPPVTvBroadcast()` のシーン送り。

```js
const _hint = '<div class="ptv-hint">クリックで進む ▶</div>';   // ui-common.js:7569
...
  if (!sc.final) {
    const tv = box.querySelector('.ptv-tv');
    if (tv) tv.addEventListener('click', () => { sceneIdx++; ...; show(); }, { once: true });
  }
```

PPV TV中継は 8〜9 場面の紙芝居で、**最終場面(⑤放送終了)にだけ**実ボタン
`<button class="ptv-btn" onclick="App.closePPVTV()">事務所へ戻る</button>` がある。
**①放送OP 〜 ④頂上決戦の全場面には、button も onclick も role も tabindex も存在しない。**
進行導線は `.ptv-tv` という素の `div` に JS で付けた click リスナー1本だけで、
唯一の告知は `.ptv-hint`(10.5px・点滅する `div` テキスト、テロップ帯の直上 `bottom:52px`)。

これを直接検証した(探針: ppvTV画面を強制点火して操作可能要素を列挙):

```
ptv dom: { overlayActive:true, hasTv:true,
           tvHasOnclick:false, tvRole:null, tvTabIndex:null, buttonsInBox:[] }
candidates: 0
```

### 2-2. 旧セーブ特有か → **No。セーブ世代とは無関係**

上の探針は**新規fixture `season-1-week-1-seed42.json` を読み込んで**ppvTV画面を点火しており、
それでも `candidates: 0` になる。つまり**画面そのものの構造欠陥**であって、
旧セーブの欠落フィールド(`ppvTournament` キーが無い等)は原因ではない。
`saveDoctor.repairOnLoad` の正規化で直る類の問題ではない。

**では、なぜ基準線走破(`npm run test:ui:walkthrough`)は通るのか。**
第48週の分岐は `management.js:18240-18285` で、

- `ppvUnlocked === true` → `weekPhase='ppvShow'`(自団体が出場する。専用UIに実ボタンあり)
- `ppvUnlocked === false` → `weekPhase='ppvTV'`(**テレビで他団体の大会を眺めるだけ**)

新規fixtureは `ppvUnlocked:false` で始まるが、走破ハーネスが毎週興行を打って勝ち続けるため
**シーズン1のうちに団体人気が `PPV_UNLOCK_POP=30` を超えて出場資格を取り**、
W43で `togglePPVPick` → `confirmPPVEntry` を踏んで `ppvShow` 側へ抜ける
(基準線ログ step260-261 で実際にそうなっている。走破は PASS / 316手 / 197.9s)。
つまり**基準線は ppvTV 画面を一度も踏んでいない**。

実セーブ v1.0x は S2 時点で団体人気が20前後しかなく資格が無いので、ppvTV に落ちる。
**団体人気30未満で年末を迎えるプレイヤー(=1〜2年目の全員と、伸び悩んでいる団体すべて)が
毎年必ず通る画面が、自動検査の死角に丸ごと入っていた。**

### 2-3. プレイヤーへの実害

ハーネスが「安全な前進コントロールが無い」と言っているのは、実プレイでも次の形で効く。

1. **クリック面が中央の720px枠の中だけ。** `.ptv-tv{max-width:720px}`(index.html:9843)。
   1440×1000 の画面では周囲の広大な暗幕が**押しても何も起きない死んだ面**になる。
   本作の他の全画面演出(`.cerem-overlay` の `▷ SKIP`、リプレイ系の `次へ` ボタン)は
   必ず実ボタンを持っており、ppvTVだけが例外。
2. **キーボードでは一切進めない。** フォーカス可能な要素がゼロ。
3. **唯一の案内が 10.5px の点滅テキスト**で、テロップ帯(`bottom:0`)の直上 `bottom:52px` に
   置かれており、実際の失敗時スクリーンショットでは帯に重なって半分読めない。
4. **`{ once: true }` の張り直しに保険が無い。** `show()` が描画中に落ちると
   (旧セーブ由来のデータ欠損で `_face()` が転ぶ等)、次のリスナーが付かないまま
   **ボタンゼロの画面で恒久停止**する。§5-D 鉄則1(待ちに時限の保険)違反。
5. `App.initPPVTV`(app.js:16050-16062)にはキュー待ちの3秒セーフティネットがあるが、
   `_ppvTvStarted = true` を**先に**立ててから `renderPPVTvBroadcast` を呼ぶため、
   **描画が例外で落ちるとネットが二度と張られず「GRAND FINAL を準備中…」で永久停止**する。
   2026-07-31に一度直したのと同じ型のフリーズが、別の扉から復活しうる状態だった。

### 2-4. 「popup queue=1 / active=true なのにポップアップDOMが出ていない」について

これは**不具合ではない**。`showResultOverlay` が `active` の間 `_isPopupActive()` は true なので、
後続ポップアップは設計どおり `_popupQueue` で待つ。`ui-common.js:640-649` の MutationObserver が
オーバーレイから `active` が外れた瞬間に `_drainPopupQueue()` を呼ぶので、
`App.closePPVTV` が overlay を閉じれば自動的に流れる。フリーズの原因ではない。

---

## 3. 修正

対処療法(ハーネス側の除外)は取らず、**画面に出口が無いこと自体**を直した。
`saveDoctor.repairOnLoad` は触っていない(2-2 のとおり、セーブデータは原因ではない)。

### 3-1. `src/ui-common.js` `renderPPVTvBroadcast()`

| 変更 | 内容 |
|---|---|
| 進行導線の実体化 | `_hint` を `<div class="ptv-hint">クリックで進む ▶</div>` から **実ボタン** `<button type="button" class="ptv-hint" data-ptv-next>次へ ▶</button>` へ |
| 押せる面の拡張 | 場面ごとの `.ptv-tv` への `{ once:true }` 張り直しを廃止。委譲クリックリスナーを `showResultOverlay` に**1本だけ**張り、**TV枠の外の暗幕**からも同じ `advance()` に入る |
| キーボード | `document` の keydown で Enter / Space / → を受ける。ボタンにフォーカスがあるときは既定の活性化に任せ、二重送りしない |
| 1操作=1進行(鉄則2) | `advance()` は `advancing` / `tornDown` / `.ptv-tv` の在否 / 最終場面かを検証してから進む |
| 出口の一本化 | 最終場面を描いたら委譲を外す(`teardown()`)。以後の出口は「事務所へ戻る」だけ |
| 二重起動の単一化 | `overlay._ptvSurfaceHandler` / `_ptvKeyHandler` に張ったハンドラを覚え、中継が二重に起動しても**生きている委譲は常に1組**にする |

### 3-2. `src/app.js` `App.initPPVTV()` / `App._renderPPVTvFallback()`(新規)

`renderPPVTvBroadcast` を try/catch で包み、組み立てが転んだら
`App._renderPPVTvFallback()`(「事務所へ戻る」だけの最小TV画面)へ着地させる。
`_ppvTvStarted` を**先に**立てる二重起動防止の都合上、3秒のセーフティネットは二度と
張り直されない。ここが最後の砦になる(§5-D 鉄則1)。

### 3-3. `src/index.html` `.ptv-hint`

ボタンとして成立させ、テロップ帯(高さ約52px)に被らないよう `bottom:52px → 60px`。
`:hover` / `:focus-visible` を追加(点滅は停止して押下対象だと分かるようにする)。
色は `var(--stage-text)` / `var(--gold)` と、同ブロックの既存イディオムに揃えた
`rgba(255,255,255,…)`。ハードコード16進は追加していない。

### 3-4. `docs/ui/03-screens/ppv-tv-broadcast.md`

「場面送りの導線」節を追加し、実装状況と実機確認ポイントを更新。

## 4. 検証(すべて実測。ベース 699a860 → 本ブランチ)

### ① 再現コマンド

| | 修正前(699a860) | 修正後 |
|---|---|---|
| `--max-steps 160`(アーティファクトが記録した再現コマンド) | **FAIL** / D2_FREEZE: no safe progress control is visible / 159手 / 94.4s | D2は消滅。step160 で `button.ptv-hint:次へ ▶` を押して前進。残る FAIL は **人為的な160手上限による D5_WATCHDOG**(1季走破に160手では足りない。上限を外すと下段のとおり通る) |
| 上限なし(=`save-regression` が回す本番条件) | (同じ場所で停止) | **PASS** / S2W23 → S3W1 / 196手 / Issues 0 / 125.1s |

### ③ 基準線走破 `npm run test:ui:walkthrough`

**PASS** / 316手 / Issues 0 / 189.8s / digest `817e02f2dea24b7f`。
**digest は修正前の実行と完全一致**(修正前も `817e02f2dea24b7f`)。
基準線は ppvTV を踏まない経路(W43でPPV出場権を得て ppvShow へ抜ける)なので、
今回の変更が既存の通り道を一切動かしていないことの裏付けになる。

### ⑤ `node test/auto-sim.js 20 42`

**Result: ALL CLEAR ✓**

### ④ `npm test`

初回実行で 256本中 2本 FAIL。内訳と処置:

1. `u6-org-identity-safety-net-test.js` — **本修正が壊した**。DOMスタブが旧契約
   (`.ptv-tv` への `addEventListener`)しか持たず、`overlay.addEventListener` で落ちていた。
   スタブを新契約(overlay委譲 + document keydown)へ追随させ、あわせて
   **「①〜④の全場面に押せる実ボタンが居る / 最終場面で委譲を外す」不変条件を新設**
   (`every ppvTV scene carries a real, pressable exit`)。クリックとキーボードを交互に使い、
   どちらの経路でも1操作=1場面だけ進むことも見る。→ 13 sections ok
2. `tenchosen-result-flow-guard-test.js` — **本修正とは無関係の既存の赤**。
   `git log -S` で確認したとおり `closeBtn.getAttribute('onclick')` は **699a860(main側)** が
   追加した行で、テスト側の `closest()` スタブが `getAttribute` を持たないため落ちていた
   (`git diff 699a860..HEAD -- src/ui-common.js` に当該関数は現れない)。
   実物の `closest()` は Element を返すので getAttribute を持つ ⇒ スタブを実物に合わせた。
   あわせて **「PPV結果のボタンには委譲しない」= 699a860 が直した幻の1週の不変条件**を
   テストとして固定した。→ ok

修正後の `npm test` 再実行結果は下記「再実行」に記載。

### ② `node test/save-regression.js --walkthrough`

Phase 1(save-doctor 診断・6本): **全て ✓**
(既存の指摘は重複ID・欠番IDなど棚新設時から出ている既知の内容で、本件とは別件)

Phase 2(実ブラウザ1季走破・6本): **6/6 ✓ Issues 0** → `SAVE REGRESSION: ALL CLEAR`(exit 0)

| セーブ | 結果 | 所要 |
|---|---|---|
| `mobile_S22W47_2026-04-06.json` | ✓ Issues: 0 | 34s |
| `prerefix_S12W45_2026-07-27.json` | ✓ Issues: 0 | 42s |
| `ultralong_S73W14_2026-04-11.json` | ✓ Issues: 0 | 186s |
| **`v1.0x_S2W23_2026-03-21.json`(本件の対象)** | **✓ Issues: 0** | 115s |
| `v1.20_S4W3_2026-07-20.json` | ✓ Issues: 0 | 207s |
| `v1.25_S3W11_2026-08-03.json` | ✓ Issues: 0 | 170s |

**既知課題(KNOWN_ISSUES)も含めて全本 ✓ になった。**
`prerefix_S12W45` に登録されていた「オフシーズン進入時に `[WM] progression state repaired` が発火」は
本実行では再現せず ✓。699a860(旧セーブ年末クラスタ修正)の効果と思われる。
`test/save-regression.js` の `KNOWN_ISSUES` からこのエントリを外せるか、
**Fable側でもう1本走らせて再現しないことを確かめてから**判断してほしい
(1回の非再現では消さない。本タスクでは外していない)。

### 再実行

`npm test` → **total: 256 / passed: 256 / failed: 0 / timed out: 0**

### まとめ

| # | 検証項目 | 結果 |
|---|---|---|
| ① | 再現コマンド(上限なし) | **PASS** — D2_FREEZE消滅 |
| ② | `save-regression --walkthrough` | **ALL CLEAR** — 6/6 ✓(既知課題も含め全緑) |
| ③ | `npm run test:ui:walkthrough` | **PASS** — digest は修正前と完全一致 |
| ④ | `npm test` | **256/256 PASS** |
| ⑤ | `auto-sim 20 42` | **ALL CLEAR ✓** |

---

## 5. 同型の掃討(本タスク範囲外・別途起票済み)

「進行手段が素の要素への `addEventListener('click')` だけで、`button` / `onclick`属性 / `role="button"`
のいずれも持たない全画面演出」を `src/app.js` / `src/ui-common.js` / `src/ui-render.js` 全体で洗い出した。
**同じ型があと3件残っている**(いずれも走破の通り道に無いか、偶然だけで検査を通っている)。

| 優先 | 箇所 | 状態 |
|---|---|---|
| 1 | `src/app.js:5187` 付近 `App.completeDraft()` の旗揚げ完成演出(`.completion-overlay`) | button も onclick 属性も無く、進行は overlay の click 1本。`position:fixed;inset:0;z-index:400;pointer-events:auto` で背後のボタンも塞ぐ。**時限フォールバック無し = PPVと完全に同じ恒久停止** |
| 2 | `src/ui-render.js:419` 付近 `renderOpeningScreen()` の `.opening-overlay` | 幕1〜4は素の div。skip は `<div class="opening-skip">` への **`skip.onclick = fn` プロパティ代入**で、属性ではないため実ボタンでも `[onclick]` でもない。**時限フォールバック無し** |
| 3 | `src/ui-common.js:15762` 付近 `showLeagueElevationCeremony()` スライド2 | step 0〜4 の進行は素の `#leClickArea` のみ。`#leCloseBtn` は実ボタンだが step 5 まで `opacity:0`。**`display:none` に変えた瞬間に停止する**(いま通っているのは偶然) |
| 低 | `src/ui-common.js:8379` `showSeasonFanfare()` | overlay click のみだが60秒の自己復帰があるため恒久停止はしない |

`test/u4-modal-frame-safety-net-test.js:427` は `.opening-overlay` / `.completion-overlay` /
`.season-fanfare-overlay` を列挙しているが、**z-indexの重なり検査であってクリック可能性は見ていない**ため、
上の3件はどのテストにも掛かっていない。

→ 別タスクとして起票済み(チップ「Fix exit-less overlays in draft completion and opening」)。
本タスクの範囲は ppvTV の根治に留め、他画面は同じ方針で個別に直す。
