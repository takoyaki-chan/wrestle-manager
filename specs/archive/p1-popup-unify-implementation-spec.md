# P1+P1.5 実装仕様: ポップアップ閉じ方統一 & UI標準化

> **対象**: glimpse-popup-overhaul-spec-v1.2 の §4 全体
> **実装者**: Claude Code
> **テスト**: Keisuke が手動確認

---

## 概要

全ポップアップ/トースト通知を以下の2点で統一改修する:
1. **閉じ方**: 自動消失を廃止し、クリック/タップ閉じに統一
2. **UI**: 表示位置を画面中央に統一、顔画像・セリフ文字を拡大

---

## 改修対象一覧

| # | 関数/要素 | ファイル | 閉じ方変更 | UI変更 |
|---|---|---|---|---|
| 1 | `showToast` | ui-common.js + index.html | 4秒後クリック閉じ化 | 位置のみ（テキストトーストは下部維持） |
| 2 | `_showCareReaction` | ui-common.js + index.html | クリック閉じ化 | モーダル化（中央表示+暗転+拡大） |
| 3 | `showNotifEventToast` | ui-common.js + index.html | 自動消失廃止 | モーダル化（中央表示+暗転+拡大） |
| 4 | `showSeasonFanfare` | ui-common.js | 自動タイマー廃止 | 変更なし（既にモーダル型） |
| 5 | `showGrowthEventPopups` | ui-common.js + index.html | 変更なし | 顔・セリフ拡大のみ |

---

## 1. showToast

### JS変更 (ui-common.js)

```
変更前:
function showToast(msg, duration) {
  const el = document.getElementById('toastEl');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), duration || 1800);
}

変更後:
function showToast(msg, duration) {
  const el = document.getElementById('toastEl');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  el.classList.remove('dismissable');

  // クリック閉じ（4秒経過後のみ有効）
  el.onclick = null;
  clearTimeout(window._toastTimer);
  clearTimeout(window._toastDismissTimer);

  // 4秒後に閉じ可能にする
  window._toastDismissTimer = setTimeout(() => {
    el.classList.add('dismissable');
    el.onclick = () => {
      el.classList.remove('show', 'dismissable');
      el.onclick = null;
    };
  }, 4000);

  // 安全策: 30秒後にフォールバック自動消失
  window._toastTimer = setTimeout(() => {
    el.classList.remove('show', 'dismissable');
    el.onclick = null;
  }, 30000);
}
```

### CSS変更 (index.html)

```
変更前:
.toast{position:fixed;bottom:72px;left:50%;transform:translateX(-50%) translateY(10px);
  background:rgba(14,14,21,0.96);border:1px solid rgba(255,255,255,0.12);border-radius:6px;
  padding:7px 18px;font-size:13px;color:var(--text-main);pointer-events:none;
  opacity:0;transition:opacity .25s,transform .25s;z-index:260;white-space:nowrap;
  font-family:'Noto Sans JP',sans-serif}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

変更後:
.toast{position:fixed;bottom:72px;left:50%;transform:translateX(-50%) translateY(10px);
  background:rgba(14,14,21,0.96);border:1px solid rgba(255,255,255,0.12);border-radius:6px;
  padding:7px 18px;font-size:13px;color:var(--text-main);pointer-events:none;
  opacity:0;transition:opacity .25s,transform .25s;z-index:260;white-space:nowrap;
  font-family:'Noto Sans JP',sans-serif}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto;cursor:pointer}
.toast.dismissable{border-color:rgba(255,255,255,0.25)}
```

ポイント: `.show` 時に `pointer-events:auto` と `cursor:pointer` を追加。
`.dismissable` で枠線を少し明るくして「閉じられる」を視覚的に示す。

---

## 2. _showCareReaction → モーダル化

ケアリアクションは現在 `notifEventToast` 要素を借用して表示している。
これを専用のモーダルオーバーレイに変更する。

### HTML追加 (index.html)

growthEventOverlay の近くに追加:

```html
<div class="care-modal-overlay" id="careModalOverlay" onclick="closeCareModal()">
  <div class="care-modal-box" id="careModalBox" onclick="event.stopPropagation()"></div>
</div>
```

### CSS追加 (index.html)

```css
.care-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);
  z-index:264;align-items:center;justify-content:center}
.care-modal-overlay.active{display:flex}
.care-modal-box{background:var(--panel-bg);border-radius:14px;max-width:440px;width:92%;
  padding:32px 28px;text-align:center;border:1px solid rgba(255,255,255,0.08);
  animation:retireIn .5s cubic-bezier(0.22,1,0.36,1)}
.care-modal-box.care-premium{border-color:rgba(232,67,147,0.3);
  box-shadow:0 8px 32px rgba(232,67,147,0.15)}
.care-modal-face{width:120px;height:120px;border-radius:50%;margin:0 auto 14px;
  border:3px solid rgba(255,255,255,0.15);overflow:hidden;background:var(--card-bg)}
.care-modal-face img{width:100%;height:100%;object-fit:cover}
.care-modal-name{font-weight:700;font-size:16px;color:var(--text-main);margin-bottom:10px}
.care-modal-speech{font-size:15px;line-height:1.7;font-style:italic;color:var(--text-main);
  padding:12px 16px;background:rgba(0,0,0,0.25);border-radius:8px;
  border-left:3px solid rgba(232,67,147,0.5);text-align:left;margin-bottom:14px}
.care-modal-changes{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;
  padding:10px 14px;background:rgba(0,0,0,0.2);border-radius:8px}
.care-modal-change{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.care-modal-change-label{color:var(--text-sub)}
.care-modal-change-value{font-weight:700}
.care-modal-change-up{color:#2ecc71}
.care-modal-change-down{color:#e74c3c}
.care-modal-cost{font-size:12px;color:var(--text-dim);margin-bottom:14px}
.care-modal-btn{font-size:13px;padding:10px 32px;border-radius:7px;cursor:pointer;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);
  color:var(--text-sub);transition:all .2s}
.care-modal-btn:hover{background:rgba(255,255,255,0.1);color:var(--text-main)}
```

### JS変更 (ui-common.js)

`_showCareReaction` を全面書き換え:

```javascript
function _showCareReaction(fighter, text, changes = [], cost = 0, remainingFunds = 0) {
  if (!fighter || !text) return;
  const overlay = document.getElementById('careModalOverlay');
  const box = document.getElementById('careModalBox');
  if (!overlay || !box) { showToast(text); return; }

  const isPremium = cost >= 100;
  const faceUrl = getPortraitUrl(fighter.id);
  const faceHtml = faceUrl
    ? `<div class="care-modal-face"><img src="${faceUrl}" alt=""></div>`
    : `<div class="care-modal-face"><div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:32px;color:var(--text-dim)">${fighter.name.charAt(0)}</div></div>`;

  let changesHtml = '';
  if (changes && changes.length > 0) {
    changesHtml = '<div class="care-modal-changes">';
    changes.forEach(c => {
      if (c.text !== undefined) {
        changesHtml += `<div class="care-modal-change"><span class="care-modal-change-label">${c.emoji || ''} ${c.label}</span><span class="care-modal-change-value care-modal-change-up">${c.text}</span></div>`;
      } else {
        const diff = c.after - c.before;
        const cls = diff >= 0 ? 'care-modal-change-up' : 'care-modal-change-down';
        changesHtml += `<div class="care-modal-change"><span class="care-modal-change-label">${c.emoji || ''} ${c.label}</span><span class="care-modal-change-value ${cls}">${c.before} → ${c.after}</span></div>`;
      }
    });
    changesHtml += '</div>';
  }

  const costHtml = cost > 0 ? `<div class="care-modal-cost">-${cost}万（残金: ${remainingFunds.toLocaleString()}万）</div>` : '';

  box.className = `care-modal-box${isPremium ? ' care-premium' : ''}`;
  box.innerHTML = `
    ${faceHtml}
    <div class="care-modal-name">${fighter.name}</div>
    <div class="care-modal-speech">「${text}」</div>
    ${changesHtml}
    ${costHtml}
    <button class="care-modal-btn" onclick="closeCareModal()">OK</button>
  `;
  overlay.classList.add('active');

  // 安全策: 30秒フォールバック
  clearTimeout(window._careModalTimer);
  window._careModalTimer = setTimeout(closeCareModal, 30000);
}

function closeCareModal() {
  const overlay = document.getElementById('careModalOverlay');
  if (overlay) overlay.classList.remove('active');
  clearTimeout(window._careModalTimer);
}
```

**closeCareModal を window にも公開** — onclick から呼べるようにする。
既存の `_showCareReaction` の呼び出し箇所（app.js内）は変更不要（関数シグネチャ同一）。

---

## 3. showNotifEventToast → モーダル化

### HTML追加 (index.html)

```html
<div class="notif-modal-overlay" id="notifModalOverlay" onclick="closeNotifModal()">
  <div class="notif-modal-box" id="notifModalBox" onclick="event.stopPropagation()"></div>
</div>
```

既存の `<div class="notif-event-toast" id="notifEventToast"></div>` は残す（他に参照があるかもしれないため）が、`showNotifEventToast` の中身をモーダル使用に書き換える。

### CSS追加 (index.html)

```css
.notif-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);
  z-index:264;align-items:center;justify-content:center}
.notif-modal-overlay.active{display:flex}
.notif-modal-box{background:var(--panel-bg);border-radius:14px;max-width:440px;width:92%;
  padding:32px 28px;text-align:center;border:1px solid rgba(255,255,255,0.08);
  animation:retireIn .5s cubic-bezier(0.22,1,0.36,1)}
.notif-modal-box.notif-warning{border-color:rgba(231,76,60,0.4);
  box-shadow:0 0 24px rgba(231,76,60,0.12)}
.notif-modal-portraits{display:flex;gap:12px;justify-content:center;margin-bottom:14px}
.notif-modal-face{width:120px;height:120px;border-radius:50%;overflow:hidden;
  border:3px solid rgba(255,255,255,0.15);background:var(--card-bg)}
.notif-modal-face img{width:100%;height:100%;object-fit:cover}
.notif-modal-face.dual{width:100px;height:100px}
.notif-modal-text{font-size:14px;color:var(--text-main);line-height:1.5;margin-bottom:8px}
.notif-modal-detail{font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:6px}
.notif-modal-dialogue{font-size:15px;line-height:1.7;font-style:italic;color:var(--text-main);
  padding:12px 16px;background:rgba(0,0,0,0.25);border-radius:8px;
  border-left:3px solid rgba(180,200,255,0.4);text-align:left;margin-bottom:14px}
.notif-modal-btn{font-size:13px;padding:10px 32px;border-radius:7px;cursor:pointer;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);
  color:var(--text-sub);transition:all .2s}
.notif-modal-btn:hover{background:rgba(255,255,255,0.1);color:var(--text-main)}
```

### JS変更 (ui-common.js)

`showNotifEventToast` を全面書き換え:

```javascript
function showNotifEventToast(event) {
  if (!event) return;
  const overlay = document.getElementById('notifModalOverlay');
  const box = document.getElementById('notifModalBox');
  if (!overlay || !box) { showToast(event.text || ''); return; }

  const isWarning = event.type === 'N5' || event.type === 'N_isolation'
    || event.type === 'N_coach_report' || event.type === 'N_sudden_departure';

  // 顔画像: 2人は100px×2、1人は120px
  const f1Id = event.fighter;
  const f2Id = event.fighter2;
  let portraitsHtml = '';
  if (f1Id != null && f2Id != null) {
    portraitsHtml = `<div class="notif-modal-portraits">${portraitImg(f1Id, 100, 'notif-modal-face dual')}${portraitImg(f2Id, 100, 'notif-modal-face dual')}</div>`;
  } else if (f1Id != null) {
    portraitsHtml = `<div class="notif-modal-portraits">${portraitImg(f1Id, 120, 'notif-modal-face')}</div>`;
  }

  const textHtml = event.text ? `<div class="notif-modal-text">${event.text}</div>` : '';
  const detailHtml = event.detail ? `<div class="notif-modal-detail">${event.detail}</div>` : '';
  const dialogueHtml = event.dialogue ? `<div class="notif-modal-dialogue">「${event.dialogue}」</div>` : '';

  box.className = 'notif-modal-box' + (isWarning ? ' notif-warning' : '');
  box.innerHTML = `
    ${portraitsHtml}
    ${textHtml}
    ${detailHtml}
    ${dialogueHtml}
    <button class="notif-modal-btn" onclick="closeNotifModal()">OK</button>
  `;
  overlay.classList.add('active');
  Audio.play('event');

  // 安全策: 60秒フォールバック
  clearTimeout(window._notifModalTimer);
  window._notifModalTimer = setTimeout(closeNotifModal, 60000);
}

function closeNotifModal() {
  const overlay = document.getElementById('notifModalOverlay');
  if (overlay) overlay.classList.remove('active');
  clearTimeout(window._notifModalTimer);
}
```

**注意**: `portraitImg` ヘルパーが既存コードにあるか確認すること。
なければ以下を用意:

```javascript
function portraitImg(fighterId, size, className) {
  const url = getPortraitUrl(fighterId);
  if (url) return `<div class="${className}" style="width:${size}px;height:${size}px"><img src="${url}" alt=""></div>`;
  const ch = (typeof ALL_CHARS !== 'undefined') ? ALL_CHARS.find(c => c.id === fighterId) : null;
  return `<div class="${className}" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.35)}px;color:var(--text-dim)">${ch ? ch.name.charAt(0) : '?'}</div>`;
}
```

---

## 4. showSeasonFanfare

### JS変更 (ui-common.js)

自動クローズタイマーを削除するだけ:

```
変更前:
  // 4秒後に自動クローズ
  clearTimeout(window._sfTimer);
  window._sfTimer = setTimeout(() => { if (window._sfDismiss) window._sfDismiss(); }, 4000);

変更後:
  // 安全策: 60秒フォールバック（通常はタップで閉じ）
  clearTimeout(window._sfTimer);
  window._sfTimer = setTimeout(() => { if (window._sfDismiss) window._sfDismiss(); }, 60000);
```

それ以外は変更なし。既にモーダル型で画面中央表示されている。

---

## 5. showGrowthEventPopups — 顔・セリフ拡大

閉じ方は既にクリック必須。CSS のサイズのみ変更。

### CSS変更 (index.html)

```
変更前:
.growth-event-face{width:80px;height:80px;border-radius:50%;margin:0 auto 12px;
  border:3px solid rgba(255,255,255,0.15);overflow:hidden;background:var(--card-bg)}

変更後:
.growth-event-face{width:120px;height:120px;border-radius:50%;margin:0 auto 14px;
  border:3px solid rgba(255,255,255,0.15);overflow:hidden;background:var(--card-bg)}
```

```
変更前:
.growth-event-name{font-weight:700;font-size:14px;color:var(--text-main);margin-bottom:10px}

変更後:
.growth-event-name{font-weight:700;font-size:16px;color:var(--text-main);margin-bottom:10px}
```

```
変更前:
.growth-event-msg{font-size:12px;line-height:1.8;color:var(--text-sub);margin-bottom:12px}

変更後:
.growth-event-msg{font-size:15px;line-height:1.8;color:var(--text-sub);margin-bottom:14px}
```

```
変更前:
.growth-event-detail{font-size:12px;color:var(--green);background:rgba(46,204,113,0.06);
  border-radius:6px;padding:8px 14px;margin-bottom:16px;line-height:1.7}

変更後:
.growth-event-detail{font-size:13px;color:var(--green);background:rgba(46,204,113,0.06);
  border-radius:6px;padding:10px 14px;margin-bottom:16px;line-height:1.7}
```

---

## チェックリスト（実装後の手動確認用）

- [ ] showToast: 表示後4秒間はクリックで閉じない。4秒後にクリックで閉じる
- [ ] showToast: 30秒放置で自動消失する
- [ ] ケアアクション実行: 画面中央にモーダル表示、顔120px、セリフ15px
- [ ] ケアアクション: OKボタンまたはオーバーレイクリックで閉じる
- [ ] 通知イベント（スナップショット等）: 画面中央にモーダル表示
- [ ] 通知イベント: 1人の場合は顔120px、2人の場合は100px×2
- [ ] 通知イベント: セリフ部分が15pxで読みやすい
- [ ] 通知イベント: OKボタンまたはオーバーレイクリックで閉じる
- [ ] シーズンファンファーレ: 自動で閉じない（タップのみ）
- [ ] 成長イベント（ブレークスルー等）: 顔が120pxに拡大、セリフが15pxに拡大
- [ ] 成長イベント: ボタンクリックで閉じる（変更なし）
- [ ] 全モーダル: ナビバーに被らず画面中央に表示される

---

## 禁止事項

- **実装コードをこのspecに含めない**: このファイルは仕様のみ。実装はClaude Codeが行う
- **テストコードを書かない**: Keisukeが手動確認する
- **既存の関数シグネチャを変更しない**: `_showCareReaction(fighter, text, changes, cost, remainingFunds)` のI/Fはそのまま
- **ブラウザ起動やスクリーンショット取得をしない**
