# クライマックス突入を独立イベント化するパッチ

## 目的
`nextTurn()` の最中にフェーズ変化検出 → カットイン発火が埋め込まれている現在の構造を、
「フェーズ変化を検出したら、ターン処理を一旦止めてカットインを出し、クリックで閉じてから
ターン処理を開始する」という流れに変更する。

これにより：
- クライマックスカットインがビッグムーブ演出に上書きされる問題が解決
- クライマックス突入が演出上の独立した瞬間として成立
- 他フェーズ（Opening→Mid, Mid→End）の atk カットインも同様に独立表示される

## 対象ファイル
`src/battle-engine.html`

## 変更点サマリ
1. `dismissCutin()` に「フェーズ導入カットインが閉じられたらターンを再開する」分岐を追加
2. `tryRivalryCutin()` を `showPhaseIntroCutin()` に置き換え（フラグ制御を dismiss 側に委譲）
3. `nextTurn()` 冒頭にフェーズ導入ブロックを追加、既存の中段フェーズ変化ブロックを削除

---

## 変更1: `dismissCutin()` （約 899 行目）

### Before
```javascript
function dismissCutin() {
  const ov = document.getElementById('cutinOverlay');
  if (!ov) return;
  ov.classList.remove('show');
  setTimeout(() => { ov.innerHTML = ''; }, 350);
}
```

### After
```javascript
function dismissCutin() {
  const ov = document.getElementById('cutinOverlay');
  if (!ov) return;
  ov.classList.remove('show');
  setTimeout(() => { ov.innerHTML = ''; }, 350);
  // フェーズ導入カットインが閉じられたら、保留していたターンを再開
  if (S.pendingPhaseIntro) {
    S.pendingPhaseIntro = false;
    setTimeout(() => nextTurn(), 400);
  }
}
```

---

## 変更2: `tryRivalryCutin()` → `showPhaseIntroCutin()` （約 987-1005 行目）

### Before
```javascript
// フェーズ切り替え時のカットイン判定
function tryRivalryCutin(phaseName) {
  const mi = matchData && matchData.matchInfo;
  if (!mi || !mi.rivalryTier || mi.rivalryTier <= 0) return;
  // 既に表示済みのフェーズはスキップ
  const key = phaseName.toLowerCase();
  if (S.cutinShown && S.cutinShown[key]) return;
  if (S.cutinShown) S.cutinShown[key] = true;
  // 発動率: tier1=30%, tier2=50%, tier3=80%
  const rates = [0, 0.30, 0.50, 0.80];
  const rate = rates[Math.min(mi.rivalryTier, 3)] || 0;
  if (RNG.float() > rate) return;
  // モメンタム優位側がatk、劣位側がdef
  const isLeftLeading = S.mom > 0;
  const side = isLeftLeading ? 'left' : 'right';
  const charData = isLeftLeading ? S.L : S.R;
  const lineType = phaseName === 'Climax' ? 'climax' : 'atk';
  showCutin(side, charData, lineType);
}
```

### After
```javascript
// フェーズ導入カットイン（ターン処理前に独立して発火）
// 戻り値: true = カットインを表示した（呼び出し元はターンを保留すべき）
//        false = 表示しなかった（呼び出し元はターンを続行して良い）
function showPhaseIntroCutin(phaseName) {
  const mi = matchData && matchData.matchInfo;
  if (!mi || !mi.rivalryTier || mi.rivalryTier <= 0) return false;
  // 発動率: tier1=30%, tier2=50%, tier3=80%
  const rates = [0, 0.30, 0.50, 0.80];
  const rate = rates[Math.min(mi.rivalryTier, 3)] || 0;
  if (RNG.float() > rate) return false;
  // モメンタム優位側の選手が喋る
  const isLeftLeading = S.mom > 0;
  const side = isLeftLeading ? 'left' : 'right';
  const charData = isLeftLeading ? S.L : S.R;
  const lineType = phaseName === 'Climax' ? 'climax' : 'atk';
  showCutin(side, charData, lineType);
  // フラグを立てる → dismissCutin がこれを見てターンを再開する
  S.pendingPhaseIntro = true;
  return true;
}
```

---

## 変更3: `nextTurn()` 冒頭（約 1908-1913 行目）

### Before
```javascript
// ═══ v4.1 TURN LOGIC (complete rewrite) ═══
function nextTurn(){
  clearTimeout(autoTimer); // 自動送りタイマーをキャンセル
  closeBattlePopup(); // 残存ポップアップを閉じる
  if(S.winner||S.anim)return;S.anim=true;
  const btn=document.getElementById('nBtn');if(btn){btn.disabled=true;btn.style.animation='none';}
  const L=S.L,R=S.R,ph=phase(S.turn),prevPh=S.turn>1?phase(S.turn-1).name:ph.name;
```

### After
```javascript
// ═══ v4.1 TURN LOGIC (complete rewrite) ═══
function nextTurn(){
  clearTimeout(autoTimer); // 自動送りタイマーをキャンセル
  closeBattlePopup(); // 残存ポップアップを閉じる
  if(S.winner||S.anim||S.pendingPhaseIntro)return;

  // ━━━ フェーズ導入を独立イベントとして処理 ━━━
  // ターン処理を開始する前にフェーズ変化を検出し、該当する場合は
  // カットインを出してターン処理を保留する。ユーザーがクリックで
  // カットインを閉じると dismissCutin() が nextTurn() を再呼び出しする。
  {
    const _ph = phase(S.turn);
    const _prevPh = S.turn > 1 ? phase(S.turn - 1).name : _ph.name;
    const _phKey = _ph.name.toLowerCase();
    if (_ph.name !== _prevPh && S.cutinShown && !S.cutinShown[_phKey]) {
      S.cutinShown[_phKey] = true; // 同一フェーズで二重発火を防ぐ
      // フェーズ表示ピルをフラッシュ
      const pill = document.getElementById('pill');
      if (pill) {
        pill.textContent = _ph.name;
        pill.classList.add('flash');
        setTimeout(() => pill.classList.remove('flash'), 600);
      }
      // ビッグマッチ Climax → 親フレームに BGM 切替通知
      if (_isBigMatch && _ph.name === 'Climax' && window.parent !== window) {
        window.parent.postMessage({type:'BIGMATCH_CLIMAX'}, '*');
      }
      // フェーズ導入カットイン（ライバリー戦のみ・発動率判定あり）
      if (showPhaseIntroCutin(_ph.name)) {
        // カットイン表示中はターン処理を保留。Nボタン無効化のみ行い return。
        const btn0 = document.getElementById('nBtn');
        if (btn0) { btn0.disabled = true; btn0.style.animation = 'none'; }
        return;
      }
      // カットインなし（非ライバリー or 発動率外れ）→ フォールスルーして続行
    }
  }
  // ━━━ フェーズ導入処理ここまで ━━━

  S.anim=true;
  const btn=document.getElementById('nBtn');if(btn){btn.disabled=true;btn.style.animation='none';}
  const L=S.L,R=S.R,ph=phase(S.turn),prevPh=S.turn>1?phase(S.turn-1).name:ph.name;
```

---

## 変更4: `nextTurn()` 中段の旧フェーズ変化ブロック削除（約 1952-1962 行目）

### Before
```javascript
  // Phase change
  if(ph.name!==prevPh){
    const pill=document.getElementById('pill');
    if(pill){pill.textContent=ph.name;pill.classList.add('flash');setTimeout(()=>pill.classList.remove('flash'),600)}
    // ライバリーカットイン
    tryRivalryCutin(ph.name);
    // ビッグマッチClimaxフェーズ → 親にBGM切替通知
    if(_isBigMatch && ph.name==='Climax' && window.parent!==window){
      window.parent.postMessage({type:'BIGMATCH_CLIMAX'},'*');
    }
  }
```

### After
```javascript
  // Phase change 検出はnextTurn冒頭のフェーズ導入ブロックで処理済み
  // （ピルフラッシュ・BGM切替・カットイン全て上で実行される）
```

（つまり旧ブロック全体を削除。上記コメントだけ残すか、行ごと削除してもOK）

---

## テスト観点

実機確認してほしい項目：

1. **通常試合（非ライバリー）**
   - Opening→Mid, Mid→End, End→Climax すべてでピルフラッシュが出るか
   - カットインは出ない（仕様通り）
   - 試合の流れが止まらないか

2. **ライバリー tier 1 試合**
   - 各フェーズ変化で30%の確率でカットインが出る
   - カットインが出たらターン処理が止まり、クリックで再開する
   - クリック前にビッグムーブ演出で上書きされないか
   - 同一フェーズで二度カットインが出ないか

3. **ライバリー tier 3 試合**
   - 各フェーズで80%の確率でカットイン → 何試合か観戦して発火を確認
   - クライマックス突入時、カットイン → クリック → そのあとビッグムーブ演出が正常に走るか

4. **ビッグマッチ + ライバリー**
   - Climax 突入時、BGM切替通知が親フレームに送られる
   - BGM切替とカットイン表示のタイミングが整合しているか

5. **オートアドバンス ON**
   - 自動送り中にフェーズ変化 → カットインが出て自動送りが止まる
   - クリックで再開後、自動送りが復帰するか

6. **エッジ: クライマックス初ターンが瀕死での決着**
   - turn 13 でカットイン → クリック → その後フィニッシュ発動という流れが破綻しないか

---

## 副次的な効果

- 「atk カットイン」が Opening→Mid や Mid→End でも独立イベントとして表示される
  ようになる。今までは出ていたけど他の演出に埋もれがちだった可能性がある
- `CUTIN_LINES.atk` の使用頻度が実質的に上がる（全フェーズ変化で発動するため）
- `S.cutinShown.finish` はフィニッシュ前カットイン用で別管理（変更なし）
