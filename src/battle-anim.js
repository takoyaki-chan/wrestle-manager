// battle-anim.js — 観戦画面 (single / tag) 共通アニメーション層
// Phase 4b Step 3: カットイン (通常セリフ / ダメージセリフ / ダメージボイス) の
// DOM レンダリングと SE トリガを BattleAnim.renderCutin に集約。
// 各 iframe は自前で text を選定してからこの関数を呼ぶ (state/button 管理は caller 側)。
//
// 使い方:
//   BattleAnim.renderCutin({
//     overlay: document.getElementById('cutinOverlay'),  // .cutin-overlay / .cutin-ov どちらでも
//     fighter: charData,            // {name, id, ...}  name と portraitUrl 解決に使う
//     side: 'left' | 'right',       // レイアウト方向
//     text: '来い、全部出せ',        // 既に選定済みの表示テキスト
//     variant: 'default' | 'damage-serif' | 'damage-voice'
//   })
//   BattleAnim.dismissCutin(overlay, () => { /* 次の処理 */ })
//
// 依存 (グローバル):
//   - sfx (battle-sfx.js): cutinSlide / dmgVoice
//   - getUpperUrl(fighter) (各 iframe 内で定義される肖像解決)
//   - escHtml(s) (各 iframe 内のHTMLエスケープ、無ければそのまま使う)

// i18n P6-8: 吹き出し/カットインの「」はレンダラ側の固定装飾(ui-common.js _quoteLineと
// 同じ考え方)。観戦iframe(battle-engine.html/tag-battle.html)はメイン画面とは別インスタンスの
// WM_I18Nを持つ(別Documentのため)ので、ui-common.jsの_quoteLineを直接は呼べず同じロジックを
// ここに複製する。battle-anim.js自身とtag-battle-main.js/battle-engine-main.js(後読み込み)の
// 両方から使う想定でIIFE外のグローバル関数にする。引数は表示直前でt()/escHtml等を
// 済ませた完成文字列を渡すこと(このヘルパー自身は翻訳しない・装飾のみ)。
// ja/pseudo/WM_I18N不在: 「text」(従来と1バイト同一) / en: text(装飾なし)。
function _quoteLine(text) {
  const s = (text === null || text === undefined) ? '' : String(text);
  return (typeof WM_I18N !== 'undefined' && WM_I18N.lang === 'en') ? s : `「${s}」`;
}

const BattleAnim = (function(){
  function _esc(s){
    if (s == null) return '';
    return (typeof escHtml === 'function') ? escHtml(s) : String(s);
  }
  function _portrait(fighter){
    if (!fighter) return '';
    if (fighter.upperUrl) return fighter.upperUrl;
    try { return (typeof getUpperUrl === 'function') ? getUpperUrl(fighter) : ''; }
    catch(e){ return ''; }
  }

  // Cutin render — overlay 要素に innerHTML を組み立てて .show を付与する。
  // variant='damage-voice' のみ悲鳴音 (sfx.dmgVoice)、他はスライド音 (sfx.cutinSlide)。
  function renderCutin(opts){
    const { overlay, fighter, side, text, variant } = opts || {};
    if (!overlay) return;
    const dirClass = (side === 'right') ? ' right' : '';
    const variantClass = (variant && variant !== 'default') ? ' ' + variant : '';
    const upperUrl = _portrait(fighter);
    const name = fighter ? (fighter.name || '') : '';
    overlay.innerHTML = `<div class="cutin-box${variantClass}${dirClass}">` +
      (upperUrl ? `<img class="cutin-portrait" src="${upperUrl}" alt="" onerror="this.style.display='none'">` : '') +
      `<div class="cutin-info">` +
        `<div class="cutin-name">${_esc(name)}</div>` +
        `<div class="cutin-text">${_quoteLine(_esc(text))}</div>` +
        `<div class="cutin-dismiss">CLICK TO CLOSE</div>` +
      `</div></div>`;
    overlay.classList.add('show');
    try {
      if (variant === 'damage-voice') { if (typeof sfx !== 'undefined' && sfx.dmgVoice) sfx.dmgVoice(); }
      else { if (typeof sfx !== 'undefined' && sfx.cutinSlide) sfx.cutinSlide(); }
    } catch(e){}
  }

  // Dismiss — .show を外し、350ms 後に innerHTML を空にする。
  // onAfterClear: 遅延クリア完了時に呼ぶコールバック (任意)
  function dismissCutin(overlay, onAfterClear){
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.innerHTML = '';
      if (typeof onAfterClear === 'function') onAfterClear();
    }, 350);
  }

  return { renderCutin, dismissCutin };
})();
