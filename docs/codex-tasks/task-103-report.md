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

(実装後に追記)

## 4. 検証

(実装後に追記)
