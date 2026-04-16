# タッグ/シングル試合画面 デザイン統一 作業指示書

> **作業ブランチ**: `feature/match-screens-unification`（main から切る、既存コードに触らないのでブランチ不要という判断もあり。お好みで）
> **作業対象**: 比較モックアップ2ファイル（原本は触らない）
> **目的**: シングルマッチ画面とタッグマッチ画面のビジュアル統一のためのデザイン反復
> **作成日**: 2026-04-16（前チャットからの引き継ぎ）

---

## 背景

前チャットで以下が確定した：

1. `match-viewer.html`（タッグ本番ビューア）と `wrestle_manager_single_match_screen.html`（シングル参照スニペット）を**並列比較**するためのモックアップ3ファイルを作成
2. 並べて見た結果、ユーザーから統一方針の指示あり
3. 前チャットのツール上限で作業が途中で停止
4. 追加でユーザーから「タッグにもモメンタムバーを表示させたい」と指示あり（シングル画面には既存。タッグのエンジン内にモメンタム変数は実装済みだが画面表示なし）

## 作業対象ファイル（4ファイル・全てリポジトリ内に存在）

```
wrestle-manager/archive/prototype/tag-match-prototype-v0.1/
├── match-screens-compare.html    ← 比較コンテナ（変更不要）
├── match-screen-single.html      ← 編集対象 1
├── match-screen-tag.html         ← 編集対象 2（match-viewer.html のコピー+auto-start）
├── match-viewer.html             ← 原本（絶対に触らない）
└── wrestle_manager_single_match_screen.html  ← 原本（絶対に触らない）
```

**重要**: 編集は `match-screen-*.html` のみ。`match-viewer.html` 原本には一切手を加えない。合意が取れた後に別途本体反映する。

---

## 統一方針（前チャットでユーザー確定）

### カラーリング
- すべてシングル準拠
- HPバーは**両側とも同じ色**（赤/青のチーム分けしない）
- モメンタムバーは赤青分けOK（そのまま）
- ステータスバー（PWR/SPD/TEC/STA/MNT）はシングルのStat別色に統一
  - PWR=赤 `#c41e3a→#e85d75`
  - SPD=青 `#2a6bd4→#5da0f0`
  - TEC=緑 `#2a9d8f→#5dd9ca`
  - STA=金 `#d4a843→#f0d078`
  - MNT=紫 `#8b5cf6→#a78bfa`

### バー方向（両画面・全バー）
**「外側から内側」に統一**
- 左カード（side A）: LTR（左端=外側から右へ伸びる）
- 右カード（side B）: RTL（右端=外側から左へ伸びる）

### レイアウト
- タッグの中央列の順序をシングル準拠に: `HUD → Current Move → Battle Log`
- タッグのNEXT TURNボタンを下に移動（AUTO/新しい試合と同レベル）
- NEXT TURN削除後の空間を Battle Log が吸収

---

## 前チャットで完了済みの変更

**`match-screen-tag.html` のみ** 以下4点まで完了:

1. ✅ HP色（メインカード）: team-a/team-b別色を廃止し両側 teal 統一、warn=gold/danger=red
2. ✅ HP色（apron）: 同様に統一
3. ✅ ステータスバー色: Single準拠の明るめパレットに更新
4. ✅ `statsHtml(f, side)` のバー方向反転: `trackCls = side === 'b' ? ' rtl' : ''` に修正

完了した修正はすでに `match-screen-tag.html` に反映済み（このファイルをそのまま引き継いでください）。

---

## 残タスク（10項目）

### タッグ側（match-screen-tag.html）の残り6項目

#### タスク1: apron HP バー方向の反転
関数 `updateApronCard` 内（1229行目付近）:

```javascript
// 変更前
const trackCls = side === 'a' ? ' rtl' : '';

// 変更後
const trackCls = side === 'b' ? ' rtl' : '';
```

#### タスク2: メインカード HP バーの HTML 内 rtl クラス位置を反転

左カード（A）の HP バートラック（816行目付近）:
```html
<!-- 変更前 -->
<div class="card-hp-bar-track rtl"><div class="card-hp-fill card-hp-fill-a" id="card-hp-a"></div></div>
<!-- 変更後 -->
<div class="card-hp-bar-track"><div class="card-hp-fill card-hp-fill-a" id="card-hp-a"></div></div>
```

右カード（B）の HP バートラック（866行目付近）:
```html
<!-- 変更前 -->
<div class="card-hp-bar-track"><div class="card-hp-fill card-hp-fill-b" id="card-hp-b"></div></div>
<!-- 変更後 -->
<div class="card-hp-bar-track rtl"><div class="card-hp-fill card-hp-fill-b" id="card-hp-b"></div></div>
```

#### タスク3: NEXT TURNボタンの移動

**削除**（874〜877行目付近）:
```html
<!-- NEXT TURN (row 2, center column) -->
<div class="col-center-btn" style="grid-row:2;grid-column:2;display:flex;align-items:start;justify-content:center;padding-top:4px">
  <button class="btn-main" id="btn-next" onclick="goNext()">▶ NEXT TURN</button>
</div>
```

**追加**（controls-sub内・AUTO ボタンの前）:
```html
<div class="controls-sub">
  <!-- NEXT TURN を先頭に追加 -->
  <button class="btn-main" id="btn-next" onclick="goNext()">▶ NEXT TURN</button>
  <div class="control-sep"></div>
  <button class="btn btn-auto" id="btn-auto" onclick="toggleAuto()">AUTO<span>OFF</span></button>
  <!-- 既存のspeed-dots, sep, btn-new はそのまま -->
</div>
```

CSSで `controls-sub` のレイアウトが崩れる可能性があるので、`.btn-main` のサイズを `.controls-sub` 内で適切に調整。

#### タスク4: 中央列の順序変更

`col-center-top` の中身を以下の順序に並び替え（839〜857行目付近）。
**タスク6でモメンタムバーを追加するので、このタスク4の段階ではモメンタムバーのプレースホルダー（空の `<div>` でよい）を中央HUDの下に入れておく**。実際の中身はタスク6-aで書き込む。

```html
<!-- 変更前: center-hud → battle-log → move-display -->
<!-- 変更後: center-hud → [mom-bar placeholder: タスク6-a] → move-display → battle-log -->
<div class="col-center-top">
  <!-- HUD -->
  <div class="center-hud" id="center-hud">
    <span class="center-hud-turn" id="top-turn-c">TURN 1</span>
    <span class="center-hud-phase" id="top-phase-c">OPENING</span>
    <span class="center-hud-chem" id="top-chem-c"></span>
  </div>

  <!-- Momentum bar placeholder（タスク6-aで中身を書く） -->
  <!-- 現段階では空のコメントでよい。タスク6-aで `<div class="mom-bar-wrap">...` に置換 -->

  <!-- Current Move（ログの上に移動） -->
  <div class="move-display" id="move-display">
    <div class="move-label">CURRENT MOVE</div>
    <div class="bigmove-splash" id="bigmove-splash"></div>
    <div class="move-name" id="move-name">-</div>
    <div class="move-damage" id="move-dmg"></div>
    <div class="move-narration" id="move-narration"></div>
    <div class="flash-overlay" id="flash-overlay"></div>
  </div>
  <!-- Battle Log（一番下・flex:1で残り空間を取る） -->
  <div class="battle-log" id="battle-log"><div class="log-header-label">BATTLE LOG</div></div>
</div>
```

CSS側で、`flex: 1` がbattle-logについているので順序変更だけで `battle-log` が下部の残り空間を吸収する。

#### タスク5: col-center-top が行1-2を跨ぐよう変更

CSS（145行目付近）:

```css
/* 変更前 */
.col-center-top {
  grid-row: 1; grid-column: 2;
  display: flex; flex-direction: column; gap: 8px;
}

/* 変更後 */
.col-center-top {
  grid-row: 1 / 3; grid-column: 2;
  display: flex; flex-direction: column; gap: 8px;
}
```

これで NEXT TURN があった row 2 center の空間を battle-log が吸収する。

#### タスク6: モメンタムバーの追加（新規実装）

**方針**: シングル同様に「左右に振れる1本バー」をタッグ中央列のHUD直下に配置する。チーム単位のモメンタム（正=A優勢 / 負=B優勢）を視覚化する。

**エンジン側の状態**:
- `tag-engine.js` 内で `mom` 変数が既に管理されている（クランプ範囲 ±50）
- `turnLog[].snap.mom` として毎ターンの値がログに記録されている
- 既存の `checkMomentumReversal(snap.mom)` 呼び出しが4箇所ある（1866, 1912, 1962, 1973行目付近）
- 追加で **バー表示の更新関数** を作って、これらの呼び出しタイミングで一緒に更新する

##### タスク6-a: モメンタムバー用のHTMLを追加

`center-hud` の直後、`move-display` の前に挿入（タスク4で入れ替え済みの中央列の中）:

```html
<!-- Momentum bar (両チーム1本・シングル準拠) -->
<div class="mom-bar-wrap" id="mom-bar-wrap">
  <div class="mom-bar-track">
    <div class="mom-bar-fill-a" id="mom-bar-a"></div>
    <div class="mom-bar-fill-b" id="mom-bar-b"></div>
  </div>
</div>
```

##### タスク6-b: CSS追加

`.center-hud` のCSSの後あたりに以下を追加:

```css
/* Momentum bar (中央列・HUD直下) */
.mom-bar-wrap {
  padding: 0 4px;
}
.mom-bar-track {
  display: flex;
  height: 6px;
  background: rgba(255,255,255,0.04);
  border-radius: 3px;
  overflow: hidden;
}
.mom-bar-fill-a {
  /* A優勢: team-a側 = 赤系グラデ、左側から右へ伸びる */
  background: linear-gradient(90deg, rgba(196,30,58,0.8), rgba(196,30,58,0.3));
  transition: width 0.5s ease;
  height: 100%;
}
.mom-bar-fill-b {
  /* B優勢: team-b側 = 青系グラデ、右側から左へ伸びる */
  background: linear-gradient(90deg, rgba(74,143,212,0.3), rgba(74,143,212,0.8));
  transition: width 0.5s ease;
  height: 100%;
}
```

**設計メモ**:
- シングル側のモメンタムバー（`.wm-mom` / `.wm-mom-l` / `.wm-mom-r`）と同じ配色思想（赤=A, 青=B）
- シングルのHUDエリアにあるモメンタムバーと視覚的に近い形に揃える
- 高さ6px、背景 `rgba(255,255,255,0.04)`、グラデーション方向も同一

##### タスク6-c: JS 更新関数の追加と既存呼び出しへの組み込み

`checkMomentumReversal` 関数の直後あたり（1790行目付近）に以下を追加:

```javascript
// モメンタムバー更新
function updateMomentumBar(mom) {
  // mom は -50 〜 +50 の範囲（tag-engine.js のクランプ値）
  // 正=A優勢, 負=B優勢
  const MOM_MAX = 50;
  const ratio = Math.max(-1, Math.min(1, (mom || 0) / MOM_MAX));
  // A側は 0〜100% の幅、B側は残りを埋める
  // ratio=+1 (完全A優勢) → A:100%, B:0%
  // ratio= 0 (拮抗)       → A:50%,  B:50%
  // ratio=-1 (完全B優勢) → A:0%,   B:100%
  const aPct = 50 + ratio * 50;
  const bPct = 100 - aPct;
  const elA = document.getElementById('mom-bar-a');
  const elB = document.getElementById('mom-bar-b');
  if (elA) elA.style.width = aPct + '%';
  if (elB) elB.style.width = bPct + '%';
}
```

**既存の `checkMomentumReversal(snap.mom)` 呼び出し4箇所の直後に、`updateMomentumBar(snap.mom);` を追加する**（1866, 1912, 1962, 1973行目付近）。

例:
```javascript
// 変更前
checkMomentumReversal(snap.mom);

// 変更後
checkMomentumReversal(snap.mom);
updateMomentumBar(snap.mom);
```

##### タスク6-d: 初期化時のバー表示

`startNewMatch` 関数または match-ui を表示する最初のタイミングで、`updateMomentumBar(0)` を呼び出して初期状態（拮抗=50:50）を設定する。実装箇所は以下のどれか一つで十分:
- `startNewMatch()` の末尾
- 最初の `renderTurn(0)` が呼ばれた直後

タッグ試合の開始時に `mom=0`（拮抗）からスタートすることを視覚化する。

##### タスク6-e: 試合終了時の挙動

試合終了（決着演出が始まる）後、モメンタムバーは**最終状態のまま残す**（動きを止める）。これはシングル側の挙動にも合わせる。特別な処理は不要、決着後も `updateMomentumBar` を呼ばなければそのまま表示が保持される。

---

### シングル側（match-screen-single.html）の4項目

#### タスク7: HP バー（左） .rev 削除

HTML内（114行目付近）:
```html
<!-- 変更前 -->
<div class="wm-hp-bar"><div class="wm-hp-fill high rev" style="width:72%"></div></div>
<!-- 変更後 -->
<div class="wm-hp-bar"><div class="wm-hp-fill high" style="width:72%"></div></div>
```

#### タスク8: HP バー（右）に .rev 追加

HTML内（116行目付近）:
```html
<!-- 変更前 -->
<div class="wm-hp-bar"><div class="wm-hp-fill mid" style="width:45%"></div></div>
<!-- 変更後 -->
<div class="wm-hp-bar"><div class="wm-hp-fill mid rev" style="width:45%"></div></div>
```

#### タスク9: 右パネルのステータスバーに direction: rtl を適用

CSS内（`.wm-ab-fill.mental` の定義の後あたり）に追加:

```css
/* 右パネルのステータスバーは右端(外側)から左へ伸びる */
.wm-panel.right .wm-ab-track { direction: rtl; }
```

#### タスク10: 右パネルの行構造を row-reverse で反転

見た目の一貫性のため、タッグと同じく右パネルの stat-row を反転させる。

CSS内に追加:
```css
.wm-panel.right .wm-ab-row { flex-direction: row-reverse; }
.wm-panel.right .wm-ab-val { text-align: left; }
```

これで右パネルは `[val][bar][name]` 順で、左パネルの `[name][bar][val]` と鏡像配置になる。

---

## 動作確認手順

1. `match-screen-tag.html` と `match-screen-single.html` を上記の通り編集
2. `match-screens-compare.html` をブラウザで開く（同フォルダ内に上記4ファイルが揃った状態で）
3. 以下を確認:
   - [ ] タッグ側のHPバーが両側とも同じ teal〜gold〜red 色になっているか
   - [ ] タッグ側のステータスバー色がシングル準拠（PWR赤/SPD青/TEC緑/STA金/MNT紫）になっているか
   - [ ] タッグ側のバー方向が「外→内」になっているか（左カード=左端から、右カード=右端から伸びる）
   - [ ] シングル側のHPバーが「外→内」になっているか
   - [ ] シングル側の右パネルのステータスバーが「外→内」になっているか
   - [ ] タッグ側のNEXT TURNが下部（AUTO/新しい試合と同じレベル）に移動しているか
   - [ ] タッグ側のBattle Logが画面下部まで拡がっているか
   - [ ] タッグ側の中央列の順序が HUD → Momentum Bar → Current Move → Battle Log になっているか
   - [ ] **タッグ側のモメンタムバーが開始時に拮抗(50:50)で表示されるか**
   - [ ] **ターンが進むとモメンタムバーが流動的にA/B方向へ振れるか（エンジンの `snap.mom` 値に連動）**
   - [ ] **モメンタムバーの配色がシングルと視覚的に近い（A=赤 / B=青 のグラデーション）か**

## レビュー後

ユーザー（Keisuke）に画面を確認してもらい、違和感があれば指摘を受けて追加修正。合意が取れたら、このモックアップの変更を本家の `match-viewer.html` / シングル試合画面の本体（`src/battle-engine.html` の該当箇所）に反映する別タスクに移る。

---

## 禁止事項

- `match-viewer.html` 原本を編集しない
- `wrestle_manager_single_match_screen.html` 原本を編集しない
- `src/` 配下の本体コードは一切触らない
- 新しいフォント・色パレットを勝手に追加しない（シングル既存の値を厳守）
- 上記「統一方針」の範囲外の改善提案はこの作業では実施しない（別タスクとして提案するのはOK）

## 参考

- 前チャットの議論と分析履歴はこのチャットには含まれていないが、本ドキュメントに必要な情報はすべて集約済み
- 不明点があれば Keisuke さんに直接確認（自己判断で範囲拡大しない）

## 本作業の後、別タスクで扱うべき論点（本作業では実施しない）

モメンタムバー追加作業と関連して、以下2点を**別タスクとして認識しておく**こと。本作業では手を付けない。

### 論点A: tag-match-system-spec-v0.1.md にモメンタム記述を追加
- 現状: `tag-engine.js` にモメンタム実装あり（クランプ ±50）、しかし spec には一切記述なし
- 理想: spec v0.2 で「§11 モメンタム」のような章を起こし、クランプ値・各イベント時の増減・影響先・ビューア側の視覚表現を明文化
- この作業は本モックアップ修正とは独立したタスクなので、終わったあと別途 spec 更新の指示を出す

### 論点B: モメンタムのクランプ値 ±50 の妥当性
- 現状: プロト実装で ±50（シングル本体は ±100）
- 根拠: 仕様書・notes どこにも記載なし（暗黙の設計判断）
- タッグは試合が長くタッチ交代もあるので ±100 だと極端すぎる、という直観的判断と推測される
- 本体統合前に改めてバランス調整が必要になる可能性あり
- これも spec v0.2 化と合わせて検討する別タスク
