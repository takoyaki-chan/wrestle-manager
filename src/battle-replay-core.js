// battle-replay-core.js — Replay 方式観戦 (single / tag) 共通コア
// Phase 4c Step 6: 純粋ユーティリティと定数を集約。
// 使い方: battle-engine.html / tag-battle.html で battle-sfx.js → battle-anim.js →
// battle-lines.js → battle-replay-core.js → 各 main.js の順に読む。
//
// 依存なし (グローバル側には何も要求しない)。

// ─── 定数 ─────────────────────────────────────────────────────────────────
var SPEED_DELAYS = [2500, 1500, 800];
var BIGMOVE_CHARGE_MS = 1800; // 大技溜め演出 → 残り演出開始までの待機 ms
var FRAME_DELAYS = { miss: 700, hit: 900, counter: 1100, crit: 1300 };
var PIN_SEQ_LEAD_MS = 600;

// 旧 battle-engine.html 準拠: phase 別の大技演出発動率 (big=mv.d>=14 のときに乗算)
var BIGMOVE_ANIM_RATE = { Opening: 0.10, Mid: 0.30, End: 0.65, Climax: 1.0 };

// ─── 純粋ユーティリティ ───────────────────────────────────────────────────
// HP 比率 → CSS クラス (danger / warn / '')
function hpCls(ratio){ return ratio <= 0.33 ? 'danger' : ratio <= 0.55 ? 'warn' : ''; }

// フレーム最小ディレイ (勝敗フレーム / action 種別 / 大ダメージボーナス)
function _frameMinDelay(fr){
  if (!fr) return 800;
  if (fr.winner) return 2200;
  var base = 800;
  if (fr.action){
    if      (fr.action.kind === 'miss')    base = FRAME_DELAYS.miss;
    else if (fr.action.kind === 'counter') base = FRAME_DELAYS.counter;
    else if (fr.action.isCrit)             base = FRAME_DELAYS.crit;
    else                                   base = FRAME_DELAYS.hit;
    if (fr.action.kind !== 'miss' && fr.action.dmg >= 20) base += 2000;
  }
  if (fr.events && fr.events.length > 0) base += 500;
  return base;
}

// ─── インパクト演出ヘルパー ───────────────────────────────────────────────
// いずれも DOM 要素を引数で受け取り、null なら no-op。shell 側の ID/構造差異を吸収する。

// 被弾シェイク: crit → shake-hard、通常 → shake。400ms 後に自動解除。
function _applyShake(cardEl, isCrit){
  if (!cardEl) return;
  cardEl.classList.remove('shake', 'shake-hard');
  void cardEl.offsetWidth;
  cardEl.classList.add(isCrit ? 'shake-hard' : 'shake');
  setTimeout(function(){ cardEl.classList.remove('shake', 'shake-hard'); }, 400);
}

// カウンター: 攻撃側カードに counter-flash (380ms) + 半音量 counterSE。
// counterSE は返し矢印が着弾するタイミング (約2000ms後) に合わせて遅延発火。
function _applyCounterFlash(atkCardEl){
  if (atkCardEl){
    atkCardEl.classList.remove('counter-flash');
    void atkCardEl.offsetWidth;
    atkCardEl.classList.add('counter-flash');
    setTimeout(function(){ atkCardEl.classList.remove('counter-flash'); }, 380);
  }
  setTimeout(function(){
    try {
      if (typeof getSfxGain === 'function' && typeof SE_MIX !== 'undefined') {
        getSfxGain().gain.value = SE_MIX.counterSE * 0.5;
      }
      if (typeof _playSample === 'function') _playSample('counterSE', 0.5);
    } catch(e){}
  }, 2000);
}

// ヒット SE: 技音(hitSE)のみを鳴らす。
// - bigmoveImpact (旧: dmg>=20で重ねていたドーン音) は廃止: 技音だけが鳴ることでドカンポン連発を解消。
// - 飛び技 (aerial) は飛翔→着地の時間差を表現するため hitSE を 1100ms 遅延。
function _playImpactSE(action){
  var cat    = action.moveCat || (typeof guessCategory === 'function' ? guessCategory(action.move) : 'strike');
  var isBig  = action.dmg >= 20;
  var volMul = isBig ? 1.3 : 1;
  var fire = function(){
    try { if (typeof hitSE === 'function') hitSE(cat, action.dmg, volMul); } catch(e){}
  };
  if (cat === 'aerial') setTimeout(fire, 1100);
  else fire();
}

// 大技クリティカル時の赤フラッシュ (300ms)。要素が無ければ no-op。
function _flashRedOverlay(ovEl){
  if (!ovEl) return;
  ovEl.classList.remove('flash', 'red');
  void ovEl.offsetWidth;
  ovEl.classList.add('flash', 'red');
  setTimeout(function(){ ovEl.classList.remove('flash', 'red'); }, 300);
}

