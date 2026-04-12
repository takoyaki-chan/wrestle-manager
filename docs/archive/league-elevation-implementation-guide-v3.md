# 業界底上げイベント — Claude Code 実装指示書 v3

## 概要
プレイヤーが業界1位でシーズンを終えると、翌シーズン開幕時に「業界激震」全画面演出を表示する。
エンディングセレモニー（業界制覇！）の直後、新シーズン開始前に1回だけ表示。

---

## 演出フロー（クリック送り方式）

### スライド1「業界激震」
- 暗転 → ⚡アイコン → 「業界激震」大文字（サブテキストなし）
- 「次へ ▶」ボタンクリック → BGM開始 + ビッグムーブ歓談SE(10%) → スライド2へ

### スライド2（クリックで1ステップずつ進行）

画面下部に「▼ クリックで次へ」ヒントを表示。画面どこでもクリックで次のステップへ。
アニメーション中はクリック無効（ロック）。

| ステップ | クリック | 演出内容 |
|---|---|---|
| 0 | 自動 | ナレーション:「（団体名）の凄まじい躍進は業界全体に衝撃を与えた。」 |
| 1 | ▼クリック | ナレーション:「その影響は業界3団体の体制を大きく揺るがし、それぞれの団体は内部改革に動き出した。」 |
| 2 | ▼クリック | フラッシュ＋揺れ＋B07 SE → **S級エース左からカットイン** →「王座奪還へ——全力の補強に動く」 |
| 3 | ▼クリック | S級退場 → フラッシュ＋揺れ＋B07 SE → **A級エース右からカットイン** →「大型補強を宣言——エース候補の発掘に乗り出す」 |
| 4 | ▼クリック | A級退場 → フラッシュ＋揺れ＋B07 SE → **B級エース左からカットイン** →「育成体制を一新——コーチ陣を大幅強化」 |
| 5 | ▼クリック | B級退場 → 冒頭ナレーション退場 → ビッグムーブ歓談SE(20%) → 締め:「もはや安泰の時代は終わった。真の群雄割拠が始まる——」→「続ける ▶」ボタン |

「続ける」クリック → BGMフェードアウト → オーバーレイ閉じ → `onDone()`

---

## サウンド設計

| タイミング | SE | 再生方法 |
|---|---|---|
| スライド1→2切替（「次へ」クリック時） | ビッグムーブ歓談 | volume: 0.10 |
| S級カットイン登場（step 2） | B07 空振り | デフォルトvolume |
| A級カットイン登場（step 3） | B07 空振り | デフォルトvolume |
| B級カットイン登場（step 4） | B07 空振り | デフォルトvolume |
| 締めテキスト表示（step 5） | ビッグムーブ歓談 | volume: 0.20 |

### BGM
- ファイル: `bgm_tension_v1`（既存）
- 再生: `Audio.fileBgm.play(path, { loop: false, volume: 0.10 })`
- 開始: スライド1「次へ」クリック時（ユーザー操作起点）
- 終了: 「続ける」クリック時に `Audio.fileBgm.fadeOut(1500)`

---

## スタンド画像

各団体のエース選手のスタンド画像をカットインで表示する。
- S級エース: 左からカットイン
- A級エース: 右からカットイン
- B級エース: 左からカットイン

エース選手の特定方法: 各団体のロスターから最もOVRが高い選手を取得。
画像パスは既存のスタンド画像アセットから取得する（キャラIDベース）。
画像が存在しない場合はフォールバック（非表示）で対応。

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

`awardsOverlay` の `innerHTML` に丸ごと差し込む方式（エンディングと同じ）:
```javascript
function showLeagueElevationCeremony(state, onDone) {
  const overlay = document.getElementById('awardsOverlay');
  overlay.innerHTML = `...`;  // ← 下記HTMLの中身
  overlay.classList.add('active');
}
```

---

## CSS追加分（全クラス `.le-` プレフィックス）

```css
/* ===== 業界激震イベント ===== */
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
  letter-spacing:.15em; margin:16px 0 40px;
  text-shadow:0 0 40px rgba(255,50,50,.5), 0 0 80px rgba(255,30,30,.25);
}
.le-impact-line {
  width:0; height:1px; margin:0 auto 36px;
  background:linear-gradient(90deg, transparent, rgba(255,80,60,.5), transparent);
  animation:leLineExpand .8s 1.0s ease-out forwards;
}
@keyframes leLineExpand { to{width:min(280px,70vw)} }
@keyframes leFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

.le-btn {
  display:inline-block; padding:12px 36px;
  border:1px solid rgba(255,120,100,.4); border-radius:4px;
  background:rgba(180,40,30,.15); color:rgba(255,200,180,.9);
  font-size:15px; letter-spacing:.1em; cursor:pointer;
  transition:all .25s; backdrop-filter:blur(4px);
  opacity:0; animation:leFadeUp .5s 1.4s ease-out forwards;
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
  line-height:1.9; letter-spacing:.06em;
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

/* クリック送り */
.le-click-hint {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  z-index:20; font-size:12px; color:rgba(255,180,160,.35);
  letter-spacing:.1em; opacity:0; transition:opacity .5s; pointer-events:none;
}
.le-click-hint.visible { opacity:1; }
.le-click-hint .blink { animation:leHintBlink 1.2s ease-in-out infinite; }
@keyframes leHintBlink { 0%,100%{opacity:.4} 50%{opacity:1} }

.le-click-area {
  position:fixed; inset:0; z-index:15; cursor:pointer;
}
.le-click-area.disabled { pointer-events:none; }
```

---

## innerHTML差し込み用HTML

```html
<!-- Stage BG -->
<div class="le-stage">
  <div class="le-pulse"></div>
  <div class="le-spot l"></div>
  <div class="le-spot r"></div>
</div>
<div class="le-noise"></div>
<div class="le-flash" id="leFlash"></div>

<!-- クリック受付エリア -->
<div class="le-click-area disabled" id="leClickArea"></div>
<div class="le-click-hint" id="leClickHint"><span class="blink">▼</span> クリックで次へ</div>

<div class="le-content" id="leContent" data-slide="1">

  <!-- SLIDE 1 -->
  <div class="le-slide-impact">
    <div class="le-impact-icon">⚡</div>
    <div class="le-impact-title">業界激震</div>
    <div class="le-impact-line"></div>
    <button class="le-btn" id="leNextBtn">次へ ▶</button>
  </div>

  <!-- SLIDE 2 -->
  <div class="le-slide-sequence">

    <div class="le-cutin-container">
      <!-- S級: 左から -->
      <div class="le-cutin from-left" id="leCutinS" style="--org-color:${sColor}">
        <div class="le-cutin-color"></div>
        <div class="le-cutin-slash"></div>
        <div class="le-cutin-stand">
          <img src="${aceStandPathS}" alt="" onerror="this.style.display='none'">
        </div>
        <div class="le-cutin-label">
          <div class="le-cutin-label-name">${sEmoji} ${sName}</div>
          <div class="le-cutin-label-grade">S級</div>
        </div>
      </div>

      <!-- A級: 右から -->
      <div class="le-cutin from-right" id="leCutinA" style="--org-color:${aColor}">
        <div class="le-cutin-color"></div>
        <div class="le-cutin-slash"></div>
        <div class="le-cutin-stand">
          <img src="${aceStandPathA}" alt="" onerror="this.style.display='none'">
        </div>
        <div class="le-cutin-label">
          <div class="le-cutin-label-name">${aEmoji} ${aName}</div>
          <div class="le-cutin-label-grade">A級</div>
        </div>
      </div>

      <!-- B級: 左から -->
      <div class="le-cutin from-left" id="leCutinB" style="--org-color:${bColor}">
        <div class="le-cutin-color"></div>
        <div class="le-cutin-slash"></div>
        <div class="le-cutin-stand">
          <img src="${aceStandPathB}" alt="" onerror="this.style.display='none'">
        </div>
        <div class="le-cutin-label">
          <div class="le-cutin-label-name">${bEmoji} ${bName}</div>
          <div class="le-cutin-label-grade">B級</div>
        </div>
      </div>
    </div>

    <div class="le-narration-area">
      <div class="le-narr-line" id="leNarr0"></div>
      <div class="le-narr-line" id="leNarr1"></div>
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

---

## JS（関数本体）

```javascript
function showLeagueElevationCeremony(state, onDone) {
  const overlay = document.getElementById('awardsOverlay');

  // --- 各団体エースのスタンド画像パスを取得 ---
  // const aceStandPathS = getAceStandPath(state.aiOrgs.org_s);
  // const aceStandPathA = getAceStandPath(state.aiOrgs.org_a);
  // const aceStandPathB = getAceStandPath(state.aiOrgs.org_b);
  const sName  = RIVAL_ORGS[0].name, sEmoji = RIVAL_ORGS[0].emoji, sColor = RIVAL_ORGS[0].color;
  const aName  = RIVAL_ORGS[1].name, aEmoji = RIVAL_ORGS[1].emoji, aColor = RIVAL_ORGS[1].color;
  const bName  = RIVAL_ORGS[2].name, bEmoji = RIVAL_ORGS[2].emoji, bColor = RIVAL_ORGS[2].color;

  overlay.innerHTML = `...`;  // ← 上記HTML（テンプレートリテラルで変数埋め込み）
  overlay.classList.add('active');

  // --- 初期テキスト（団体名を動的に埋め込み） ---
  document.getElementById('leNarr0').textContent =
    state.orgName + 'の凄まじい躍進は業界全体に衝撃を与えた。';
  document.getElementById('leNarr1').textContent =
    'その影響は業界3団体の体制を大きく揺るがし、それぞれの団体は内部改革に動き出した。';

  const content   = document.getElementById('leContent');
  const flash     = document.getElementById('leFlash');
  const clickArea = document.getElementById('leClickArea');
  const clickHint = document.getElementById('leClickHint');

  // --- helpers ---
  function fireFlash() { flash.classList.remove('fire'); void flash.offsetWidth; flash.classList.add('fire'); }
  function shake() { content.classList.remove('shake'); void content.offsetWidth; content.classList.add('shake'); }
  function showNarr(id) { document.getElementById(id).classList.add('visible'); }
  function hideNarr(id) { document.getElementById(id).classList.add('hide'); }
  function setNarr(id, text) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.classList.add('visible','emphasis');
  }
  function clearNarr(id) {
    document.getElementById(id).classList.remove('visible','emphasis');
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

  // --- ステップ管理（クリック送り） ---
  let currentStep = -1;
  let locked = false;

  function unlock(delay) {
    setTimeout(() => {
      locked = false;
      if (currentStep < steps.length - 1) clickHint.classList.add('visible');
    }, delay || 400);
  }

  const steps = [
    // step 0: ナレーション1行目
    () => { showNarr('leNarr0'); unlock(600); },

    // step 1: ナレーション2行目
    () => { showNarr('leNarr1'); unlock(600); },

    // step 2: S級カットイン
    () => {
      Audio.playSE('B07');
      fireFlash(); shake(); cutIn('leCutinS');
      setTimeout(() => setNarr('leNarr2', '王座奪還へ——全力の補強に動く'), 500);
      unlock(900);
    },

    // step 3: S級退場 → A級カットイン
    () => {
      cutOut('leCutinS'); clearNarr('leNarr2');
      setTimeout(() => {
        Audio.playSE('B07');
        fireFlash(); shake(); cutIn('leCutinA');
        setTimeout(() => setNarr('leNarr3', '大型補強を宣言——エース候補の発掘に乗り出す'), 500);
        unlock(900);
      }, 400);
    },

    // step 4: A級退場 → B級カットイン
    () => {
      cutOut('leCutinA'); clearNarr('leNarr3');
      setTimeout(() => {
        Audio.playSE('B07');
        fireFlash(); shake(); cutIn('leCutinB');
        setTimeout(() => setNarr('leNarr4', '育成体制を一新——コーチ陣を大幅強化'), 500);
        unlock(900);
      }, 400);
    },

    // step 5: B級退場 → 締め
    () => {
      cutOut('leCutinB'); clearNarr('leNarr4');
      hideNarr('leNarr0'); hideNarr('leNarr1');
      clickHint.classList.remove('visible');
      setTimeout(() => {
        Audio.playSE('ビッグムーブ歓談ID', { volume: 0.20 });
        document.getElementById('leClosingText').classList.add('visible');
      }, 600);
      setTimeout(() => {
        document.getElementById('leCloseBtn').classList.add('visible');
      }, 1200);
      clickArea.classList.add('disabled');
    },
  ];

  function advanceStep() {
    if (locked) return;
    currentStep++;
    if (currentStep >= steps.length) return;
    locked = true;
    clickHint.classList.remove('visible');
    steps[currentStep]();
  }

  clickArea.addEventListener('click', advanceStep);

  // --- 「次へ」ボタン ---
  document.getElementById('leNextBtn').addEventListener('click', () => {
    Audio.fileBgm.play('../bgm/bgm_tension_v1.mp3', { loop: false, volume: 0.10 });
    Audio.playSE('ビッグムーブ歓談ID', { volume: 0.10 });
    fireFlash();
    setTimeout(() => {
      content.dataset.slide = '2';
      clickArea.classList.remove('disabled');
      advanceStep(); // step 0 を自動実行
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

```javascript
window.debugWinLeague = function() {
  // プレイヤー団体をリーグ1位（業界制覇）の状態にする
  // エンディングセレモニー後の判定が通るようにする
  // シーズン終了→新シーズン開始の流れで業界底上げイベントがトリガーされる状態
};
```

devコンソールから `debugWinLeague()` で即テスト可。テスト完了後に削除。

---

## 実装時の注意

1. **SE ID**: 「ビッグムーブ歓談」の正確なSE IDをコードベースから特定して差し替え。B07は確定。
2. **エース画像パス**: 各団体ロスターから最高OVR選手を取得し、スタンド画像パスを動的に生成。
3. **フラグ管理**: 1回だけ表示。セーブデータに `leagueElevationShown: true` 等のフラグを追加。
4. **表示タイミング**: エンディングセレモニーの `onDone()` コールバック内で呼ぶ。
5. **新聞記事**: 演出翌週（新シーズン1-2週目）に最高優先度で表示。見出し:「業界再編！ライバル団体が大幅強化」
