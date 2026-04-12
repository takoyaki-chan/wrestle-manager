# 業界底上げイベント — Claude Code 実装指示書

## 概要
プレイヤーが業界1位でシーズンを終えると、翌シーズン開幕時に「業界激変」全画面演出を表示する。
エンディングセレモニー（業界制覇！）の直後、新シーズン開始前に1回だけ表示。

---

## 演出フロー

### スライド1「業界激変」
- 暗転 → ⚡アイコン → 「業界激変」大文字 → 「（プレイヤー団体名）の快挙が、業界を変えた——」
- 「次へ ▶」ボタン

### スライド2「自動シーケンス」（「次へ」クリック後、自動進行）
1. `0ms` — ナレーション:「（団体名）の躍進は、業界全体に衝撃を与えた。」
2. `1800ms` — ナレーション:「すべての団体が、動き出す——」
3. `3200ms` — **S級エースが左からカットイン**（フラッシュ＋画面揺れ＋SE）
4. `3700ms` — ナレーション:「王座奪還へ——全力の補強に動く」
5. `5600ms` — S級退場
6. `6200ms` — **A級エースが右からカットイン**（フラッシュ＋画面揺れ＋SE）
7. `6700ms` — ナレーション:「大型補強を宣言——エース候補の発掘に乗り出す」
8. `8600ms` — A級退場
9. `9200ms` — **B級エースが左からカットイン**（フラッシュ＋画面揺れ＋SE）
10. `9700ms` — ナレーション:「育成体制を一新——コーチ陣を大幅強化」
11. `11600ms` — B級退場
12. `12400ms` — 冒頭ナレーション退場
13. `12800ms` — 締めテキスト表示:「もはや安泰の時代は終わった。真の群雄割拠が始まる——」＋SE
14. `13400ms` — 「続ける ▶」ボタン表示
15. 「続ける」クリック → BGMフェードアウト → オーバーレイ閉じ → `onDone()`

---

## サウンド設計

| タイミング | SE | 再生方法 |
|---|---|---|
| スライド1→2切替（「次へ」クリック時） | ビッグムーブ歓談 | volume: 0.10 |
| S級カットイン登場 | B07 空振り | デフォルトvolume |
| A級カットイン登場 | B07 空振り | デフォルトvolume |
| B級カットイン登場 | B07 空振り | デフォルトvolume |
| 締めテキスト表示 | ビッグムーブ歓談 | volume: 0.20 |

### BGM
- ファイル: `bgm_tension_v1`（既存）
- 再生: `Audio.fileBgm.play(path, { loop: false, volume: 0.10 })`
- 開始: スライド1→2切替時（「次へ」ボタンクリック = ユーザー操作起点）
- 終了: 「続ける」クリック時に `Audio.fileBgm.fadeOut(1500)`

---

## スタンド画像

各団体のエース選手のスタンド画像をカットインで表示する。
- S級エース: 左からカットイン
- A級エース: 右からカットイン  
- B級エース: 左からカットイン

エース選手の特定方法: 各団体のロスターから最もOVRが高い選手を取得。
画像パスは既存のスタンド画像アセットから取得する（キャラIDベース）。

画像が存在しない場合はフォールバック（非表示 or プレースホルダー）で対応。

---

## 使用するゲーム内データ

```javascript
state.orgName              // プレイヤー団体名（ナレーションに使用）
RIVAL_ORGS[0].name         // S級団体名
RIVAL_ORGS[0].emoji        // 🔥
RIVAL_ORGS[0].color        // S級団体色
RIVAL_ORGS[1].name         // A級団体名
RIVAL_ORGS[1].emoji        // 💫
RIVAL_ORGS[1].color        // #6c5ce7
RIVAL_ORGS[2].name         // B級団体名
RIVAL_ORGS[2].emoji        // 🌙
RIVAL_ORGS[2].color        // #00b894
```

---

## 差し込み先

### HTML
`awardsOverlay` の `innerHTML` に丸ごと差し込む方式（エンディングと同じ）:
```javascript
function showLeagueElevationCeremony(state, onDone) {
  const overlay = document.getElementById('awardsOverlay');
  overlay.innerHTML = `...`;  // ← モックアップHTMLの中身
  overlay.classList.add('active');
}
```

### CSS
index.html の `<style>` に `.le-*` プレフィックスのクラスを追加。
既存CSSとの衝突なし（全クラス名 `.le-` で統一済み）。

---

## モックアップHTML（差し込み用コード）

以下を `overlay.innerHTML` に差し込む。
`<style>` 部分は index.html の既存 `<style>` に追加。

### CSS追加分

```css
/* ===== 業界底上げイベント ===== */
.le-stage {
  position:fixed; inset:0;
  background:radial-gradient(ellipse 90% 70% at 50% 35%, #2a0a0a 0%, #120404 45%, #000 100%);
}
.le-pulse {
  position:absolute; width:600px; height:600px;
  top:50%; left:50%; transform:translate(-50%,-50%);
  border-radius:50%;
  background:radial-gradient(circle, rgba(180,30,30,.12) 0%, transparent 70%);
  animation:lePulse 3s ease-in-out infinite;
}
@keyframes lePulse {
  0%,100% { transform:translate(-50%,-50%) scale(1); opacity:.6; }
  50%     { transform:translate(-50%,-50%) scale(1.3); opacity:1; }
}
.le-spot { position:absolute; border-radius:50%; filter:blur(100px); opacity:.08; }
.le-spot.l { width:400px; height:400px; top:20%; left:5%; background:#ff2222; }
.le-spot.r { width:350px; height:350px; top:30%; right:8%; background:#cc1111; }
.le-noise {
  position:fixed; inset:0; opacity:.04; pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
}
.le-flash {
  position:fixed; inset:0; z-index:10;
  background:rgba(255,60,40,.18); opacity:0; pointer-events:none;
}
.le-flash.fire { animation:leFlash .35s ease-out forwards; }
@keyframes leFlash { 0%{opacity:1} 100%{opacity:0} }

.le-content {
  position:relative; z-index:2;
  display:flex; align-items:center; justify-content:center;
  width:100%; height:100%;
}

/* SLIDE 1 */
.le-slide-impact { text-align:center; opacity:0; animation:leSlideIn .8s .3s ease-out forwards; }
@keyframes leSlideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.le-impact-icon { font-size:48px; display:inline-block; animation:leIconShake .5s 1.1s ease-in-out; }
@keyframes leIconShake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
.le-impact-title {
  font-size:clamp(36px,8vw,56px); font-weight:900; color:#fff;
  letter-spacing:.15em; margin:16px 0 8px;
  text-shadow:0 0 40px rgba(255,50,50,.5), 0 0 80px rgba(255,30,30,.25);
}
.le-impact-sub {
  font-size:clamp(14px,3vw,18px); color:rgba(255,200,180,.7);
  letter-spacing:.08em; margin-bottom:40px;
  opacity:0; animation:leFadeUp .6s .9s ease-out forwards;
}
@keyframes leFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.le-impact-line {
  width:0; height:1px; margin:0 auto 36px;
  background:linear-gradient(90deg, transparent, rgba(255,80,60,.5), transparent);
  animation:leLineExpand .8s 1.2s ease-out forwards;
}
@keyframes leLineExpand { to{width:min(280px,70vw)} }

.le-btn {
  display:inline-block; padding:12px 36px;
  border:1px solid rgba(255,120,100,.4); border-radius:4px;
  background:rgba(180,40,30,.15); color:rgba(255,200,180,.9);
  font-size:15px; letter-spacing:.1em; cursor:pointer;
  transition:all .25s; backdrop-filter:blur(4px);
  opacity:0; animation:leFadeUp .5s 1.6s ease-out forwards;
}
.le-btn:hover {
  background:rgba(200,50,40,.3); border-color:rgba(255,140,120,.6);
  color:#fff; box-shadow:0 0 20px rgba(255,60,40,.2);
}

/* SLIDE 2 */
.le-slide-sequence {
  width:100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  flex-direction:column; position:relative;
}
.le-narration-area {
  position:relative; z-index:5;
  width:min(520px,88vw); text-align:center;
}
.le-narr-line {
  font-size:clamp(14px,3vw,17px);
  color:rgba(255,210,190,.8);
  line-height:2; letter-spacing:.06em;
  opacity:0; transform:translateY(8px);
  transition:opacity .6s, transform .6s;
}
.le-narr-line.visible { opacity:1; transform:translateY(0); }
.le-narr-line.emphasis {
  color:rgba(255,220,200,.95); font-weight:700;
  font-size:clamp(15px,3.2vw,18px);
}
.le-narr-line.hide { opacity:0!important; transform:translateY(-5px)!important; }

/* カットイン */
.le-cutin-container {
  position:fixed; inset:0; z-index:3; pointer-events:none; overflow:hidden;
}
.le-cutin {
  position:absolute; top:0; bottom:0; width:55%;
  display:flex; align-items:flex-end; justify-content:center;
  opacity:0; pointer-events:none;
}
.le-cutin.from-left { left:-60%; }
.le-cutin.from-left.active { animation:leCutFromL .4s cubic-bezier(.2,.8,.3,1) forwards; }
.le-cutin.from-left.hold   { left:0; opacity:1; animation:none; }
.le-cutin.from-left.out    { animation:leCutOutL .35s ease-in forwards; }
.le-cutin.from-right { right:-60%; }
.le-cutin.from-right.active { animation:leCutFromR .4s cubic-bezier(.2,.8,.3,1) forwards; }
.le-cutin.from-right.hold   { right:0; opacity:1; animation:none; }
.le-cutin.from-right.out    { animation:leCutOutR .35s ease-in forwards; }
@keyframes leCutFromL  { 0%{left:-60%;opacity:0}  30%{opacity:1} 100%{left:0;opacity:1} }
@keyframes leCutOutL   { 0%{left:0;opacity:1}     100%{left:-60%;opacity:0} }
@keyframes leCutFromR  { 0%{right:-60%;opacity:0} 30%{opacity:1} 100%{right:0;opacity:1} }
@keyframes leCutOutR   { 0%{right:0;opacity:1}    100%{right:-60%;opacity:0} }

.le-cutin-slash {
  position:absolute; top:0; bottom:0; width:4px;
  background:linear-gradient(180deg, transparent, rgba(255,255,255,.25), transparent);
  opacity:0;
}
.le-cutin.from-left .le-cutin-slash { right:0; }
.le-cutin.from-right .le-cutin-slash { left:0; }
.le-cutin.active .le-cutin-slash { animation:leSlashFlash .3s .1s ease-out forwards; }
@keyframes leSlashFlash { 0%{opacity:1} 100%{opacity:0} }

.le-cutin-color {
  position:absolute; inset:0; opacity:.1; pointer-events:none;
}
.le-cutin.from-left .le-cutin-color  { background:linear-gradient(90deg, var(--org-color) 0%, transparent 80%); }
.le-cutin.from-right .le-cutin-color { background:linear-gradient(-90deg, var(--org-color) 0%, transparent 80%); }

.le-cutin-stand {
  display:flex; align-items:flex-end; justify-content:center;
  margin-bottom:30px;
}
.le-cutin-stand img {
  height:75vh; max-height:550px;
  width:auto; object-fit:contain;
  filter:drop-shadow(0 0 30px rgba(0,0,0,.7));
}

.le-cutin-label {
  position:absolute; bottom:50px; left:50%; transform:translateX(-50%);
  padding:8px 24px;
  background:rgba(0,0,0,.65); border-radius:4px; backdrop-filter:blur(4px);
  text-align:center; white-space:nowrap;
  opacity:0; transition:opacity .3s;
}
.le-cutin.active .le-cutin-label,
.le-cutin.hold .le-cutin-label { opacity:1; transition-delay:.2s; }
.le-cutin-label-name {
  font-size:15px; font-weight:700; letter-spacing:.06em;
  color:var(--org-color);
}
.le-cutin-label-grade {
  font-size:11px; color:rgba(255,255,255,.35);
  margin-top:2px; letter-spacing:.05em;
}

.le-content.shake { animation:leScreenShake .3s ease-out; }
@keyframes leScreenShake {
  0%,100% { transform:translate(0,0); }
  20% { transform:translate(-3px,2px); }
  40% { transform:translate(3px,-2px); }
  60% { transform:translate(-2px,1px); }
  80% { transform:translate(2px,-1px); }
}

.le-closing-block {
  position:relative; z-index:5; text-align:center; margin-top:20px;
}
.le-closing-text {
  font-size:clamp(14px,3vw,16px);
  color:rgba(255,200,180,.65);
  line-height:1.8; letter-spacing:.04em;
  opacity:0; transition:opacity .6s;
}
.le-closing-text.visible { opacity:1; }
.le-closing-text em {
  font-style:normal; color:rgba(255,220,200,.95); font-weight:700;
}
.le-closing-block .le-btn {
  margin-top:24px; animation:none; opacity:0; transition:opacity .5s;
}
.le-closing-block .le-btn.visible { opacity:1; }

.le-content[data-slide="1"] .le-slide-sequence,
.le-content[data-slide="2"] .le-slide-impact { display:none; }
```

### innerHTML差し込み用HTML

```html
<!-- Stage BG -->
<div class="le-stage">
  <div class="le-pulse"></div>
  <div class="le-spot l"></div>
  <div class="le-spot r"></div>
</div>
<div class="le-noise"></div>
<div class="le-flash" id="leFlash"></div>

<div class="le-content" id="leContent" data-slide="1">

  <!-- SLIDE 1 -->
  <div class="le-slide-impact">
    <div class="le-impact-icon">⚡</div>
    <div class="le-impact-title">業界激変</div>
    <div class="le-impact-sub" id="leImpactSub"></div>
    <div class="le-impact-line"></div>
    <button class="le-btn" id="leNextBtn">次へ ▶</button>
  </div>

  <!-- SLIDE 2 -->
  <div class="le-slide-sequence">

    <div class="le-cutin-container">
      <!-- S級: 左から -->
      <div class="le-cutin from-left" id="leCutinS" style="--org-color:${RIVAL_ORGS[0].color}">
        <div class="le-cutin-color"></div>
        <div class="le-cutin-slash"></div>
        <div class="le-cutin-stand">
          <img src="${aceStandPathS}" alt="" onerror="this.style.display='none'">
        </div>
        <div class="le-cutin-label">
          <div class="le-cutin-label-name">${RIVAL_ORGS[0].emoji} ${RIVAL_ORGS[0].name}</div>
          <div class="le-cutin-label-grade">S級</div>
        </div>
      </div>

      <!-- A級: 右から -->
      <div class="le-cutin from-right" id="leCutinA" style="--org-color:${RIVAL_ORGS[1].color}">
        <div class="le-cutin-color"></div>
        <div class="le-cutin-slash"></div>
        <div class="le-cutin-stand">
          <img src="${aceStandPathA}" alt="" onerror="this.style.display='none'">
        </div>
        <div class="le-cutin-label">
          <div class="le-cutin-label-name">${RIVAL_ORGS[1].emoji} ${RIVAL_ORGS[1].name}</div>
          <div class="le-cutin-label-grade">A級</div>
        </div>
      </div>

      <!-- B級: 左から -->
      <div class="le-cutin from-left" id="leCutinB" style="--org-color:${RIVAL_ORGS[2].color}">
        <div class="le-cutin-color"></div>
        <div class="le-cutin-slash"></div>
        <div class="le-cutin-stand">
          <img src="${aceStandPathB}" alt="" onerror="this.style.display='none'">
        </div>
        <div class="le-cutin-label">
          <div class="le-cutin-label-name">${RIVAL_ORGS[2].emoji} ${RIVAL_ORGS[2].name}</div>
          <div class="le-cutin-label-grade">B級</div>
        </div>
      </div>
    </div>

    <div class="le-narration-area">
      <div class="le-narr-line" id="leNarr0"></div>
      <div class="le-narr-line" id="leNarr1">すべての団体が、動き出す——</div>
      <div class="le-narr-line" id="leNarr2" style="margin-top:16px"></div>
      <div class="le-narr-line" id="leNarr3" style="margin-top:4px"></div>
      <div class="le-narr-line" id="leNarr4" style="margin-top:4px"></div>
    </div>

    <div class="le-closing-block">
      <div class="le-closing-text" id="leClosingText">
        もはや安泰の時代は終わった。<br>
        <em>真の群雄割拠が始まる——</em>
      </div>
      <button class="le-btn" id="leCloseBtn">続ける ▶</button>
    </div>

  </div>
</div>
```

### JS（関数本体）

```javascript
function showLeagueElevationCeremony(state, onDone) {
  const overlay = document.getElementById('awardsOverlay');

  // --- 各団体エースのスタンド画像パスを取得 ---
  // 各団体ロスターから最もOVRが高い選手のスタンド画像パスを取得する
  // 例: const aceStandPathS = getAceStandPath(state.aiOrgs.org_s);
  // 画像パスの取得ロジックは既存のスタンド画像システムに合わせて実装

  // --- テキストにプレイヤー団体名を反映 ---
  // テンプレートリテラル内で state.orgName を埋め込む

  overlay.innerHTML = `...`;  // ← 上記HTMLテンプレート
  overlay.classList.add('active');

  // --- 初期テキスト設定 ---
  document.getElementById('leImpactSub').textContent =
    state.orgName + 'の快挙が、業界を変えた——';
  document.getElementById('leNarr0').textContent =
    state.orgName + 'の躍進は、業界全体に衝撃を与えた。';

  const content = document.getElementById('leContent');
  const flash   = document.getElementById('leFlash');

  // --- helpers ---
  function fireFlash() {
    flash.classList.remove('fire');
    void flash.offsetWidth;
    flash.classList.add('fire');
  }
  function shake() {
    content.classList.remove('shake');
    void content.offsetWidth;
    content.classList.add('shake');
  }
  function showNarr(id) { document.getElementById(id).classList.add('visible'); }
  function hideNarr(id) { document.getElementById(id).classList.add('hide'); }
  function setNarr(id, text) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.classList.add('visible','emphasis');
  }
  function clearNarr(id) {
    const el = document.getElementById(id);
    el.classList.remove('visible','emphasis');
  }
  function cutIn(id) {
    const el = document.getElementById(id);
    el.classList.remove('out','hold');
    el.classList.add('active');
    setTimeout(() => { el.classList.remove('active'); el.classList.add('hold'); }, 400);
  }
  function cutOut(id) {
    const el = document.getElementById(id);
    el.classList.remove('active','hold');
    el.classList.add('out');
  }

  // --- シーケンス ---
  function runSequence() {
    const tl = [
      [    0, () => showNarr('leNarr0')],
      [ 1800, () => showNarr('leNarr1')],

      // S級: B07
      [ 3200, () => { Audio.playSE('B07'); fireFlash(); shake(); cutIn('leCutinS'); }],
      [ 3700, () => setNarr('leNarr2', '王座奪還へ——全力の補強に動く')],
      [ 5600, () => { cutOut('leCutinS'); clearNarr('leNarr2'); }],

      // A級: B07
      [ 6200, () => { Audio.playSE('B07'); fireFlash(); shake(); cutIn('leCutinA'); }],
      [ 6700, () => setNarr('leNarr3', '大型補強を宣言——エース候補の発掘に乗り出す')],
      [ 8600, () => { cutOut('leCutinA'); clearNarr('leNarr3'); }],

      // B級: B07
      [ 9200, () => { Audio.playSE('B07'); fireFlash(); shake(); cutIn('leCutinB'); }],
      [ 9700, () => setNarr('leNarr4', '育成体制を一新——コーチ陣を大幅強化')],
      [11600, () => { cutOut('leCutinB'); clearNarr('leNarr4'); }],

      // 締め: ビッグムーブ歓談 20%
      [12400, () => { hideNarr('leNarr0'); hideNarr('leNarr1'); }],
      [12800, () => {
        Audio.playSE('ビッグムーブ歓談ID', { volume: 0.20 });
        document.getElementById('leClosingText').classList.add('visible');
      }],
      [13400, () => document.getElementById('leCloseBtn').classList.add('visible')],
    ];
    tl.forEach(([delay, fn]) => setTimeout(fn, delay));
  }

  // --- 「次へ」ボタン ---
  document.getElementById('leNextBtn').addEventListener('click', () => {
    // BGM開始
    Audio.fileBgm.play('../bgm/bgm_tension_v1.mp3', { loop: false, volume: 0.10 });
    // ビッグムーブ歓談 10%
    Audio.playSE('ビッグムーブ歓談ID', { volume: 0.10 });

    fireFlash();
    setTimeout(() => {
      content.dataset.slide = '2';
      runSequence();
    }, 200);
  });

  // --- 「続ける」ボタン ---
  document.getElementById('leCloseBtn').addEventListener('click', () => {
    Audio.fileBgm.fadeOut(1500);
    overlay.style.transition = 'opacity .6s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
      overlay.style.opacity = '';
      overlay.style.transition = '';
      onDone();
    }, 600);
  });
}
```

---

## デバッグ関数

テスト用に以下も実装してほしい:

```javascript
window.debugWinLeague = function() {
  // プレイヤー団体をリーグ1位（業界制覇）の状態にする
  // エンディングセレモニー後の判定が通るようにする
  // シーズン終了→新シーズン開始の流れで業界底上げイベントがトリガーされる状態
};
```

devコンソールから `debugWinLeague()` で即テストできるようにする。テスト完了後に削除。

---

## 実装時の注意

1. **SE ID**: 「ビッグムーブ歓談」の正確なSE IDをコードベースから特定して差し替え。B07は確定。
2. **エース画像パス**: 各団体ロスターから最高OVR選手を取得し、そのスタンド画像パスを動的に生成する。既存のスタンド画像システムに合わせること。
3. **フラグ管理**: 1回だけ表示（永続フラグで管理）。セーブデータに `leagueElevationShown: true` 等のフラグを追加。
4. **表示タイミング**: エンディングセレモニーの `onDone()` コールバック内で `showLeagueElevationCeremony()` を呼ぶ。
5. **新聞記事**: 演出翌週（新シーズン1-2週目）に最高優先度で表示。見出し:「業界再編！ライバル団体が大幅強化」。本文は指示書冒頭のspecを参照。
