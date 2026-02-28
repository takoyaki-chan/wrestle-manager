# セッション31 実装仕様書

> **ステータス**: 承認済み（Keisukeレビュー完了）
> **作成日**: 2026-02-28
> **目的**: バグ修正 + UX改善 + 序盤〜中盤の難易度崖緩和
> **リポジトリ**: https://github.com/takoyaki-chan/wrestle-manager

---

## 変更の全体方針

今回の変更は **2グループ** に分かれる。

- **グループA（バグ修正 + UX改善）**: CSS変数バグ修正、ケア確認ダイアログ追加、おまかせ動作改善
- **グループB（難易度調整）**: getMQAdjust保護帯域拡張、逓減カーブ緩和、補助金落差緩和

グループAを先に実装し、動作確認後にグループBを適用すること。

---

## グループA: バグ修正 + UX改善

### A-1. ケアモーダルのCSS変数バグ修正

**問題**: `:root`で定義されている変数名と、ケアモーダルのCSSで参照している変数名が食い違っている。結果としてモーダルの背景が透明になり、下の画面が透けて非常に読みにくい。

**原因**: 定義は `--card-bg`, `--panel-bg` だが、参照側は `--bg-card`, `--bg-main`, `--border` など未定義の変数名を使用。

**対象ファイル**: `src/index.html`

**修正方法**: `:root` に不足している変数エイリアスを追加する。既存CSSの `var()` 参照は広範囲に渡るため、参照側を書き換えるよりルートに追加する方が安全。

```css
:root {
  /* 既存の変数はそのまま維持 */
  --bg-dark: #08080d;
  --card-bg: #0e0e15;
  --panel-bg: #121220;
  /* ...（省略）... */

  /* 追加: 参照側との整合性確保 */
  --bg-card: #0e0e15;   /* = --card-bg */
  --bg-main: #121220;   /* = --panel-bg */
  --border: rgba(255,255,255,0.1);
}
```

**確認項目**: ケアモーダルを開いた際に、背景が不透明なダークグレー（#0e0e15）で描画され、下の画面が透けないこと。

---

### A-2. ケアアクションの確認ダイアログ追加

**問題**: ケアアクションが即座に確定され、操作ミスのリスクが大きい。特に団体向けアクション（打ち上げ100万、合宿320万）はクリック1回で大金が消える。

**対象ファイル**: `src/ui-common.js` — `showCareActionModal` 関数内

**修正方法**:

**(a) 団体向けアクション**: 現在はアクション行クリックで即 `onConfirm(actionId, null)` を実行している（L2586-2590）。これを、選手選択と同様にいったん確認画面を挟むように変更する。

```javascript
// 現行（L2586-2590）
if (cfg.category === 'individual') {
  renderFighterSelect(actionId, cfg);
} else {
  // 団体向けは選手選択不要 → 直接実行
  if (onConfirm) onConfirm(actionId, null);
  overlay.classList.remove('active');
}

// 変更後
if (cfg.category === 'individual') {
  renderFighterSelect(actionId, cfg);
} else {
  renderTeamConfirm(actionId, cfg);  // 新関数
}
```

**(b) 新関数 `renderTeamConfirm` を追加**:

```javascript
function renderTeamConfirm(actionId, cfg) {
  let html = `<div class="care-title">${cfg.emoji} ${cfg.label}</div>`;
  html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:14px;padding:10px;background:rgba(255,255,255,0.04);border-radius:6px">${cfg.desc}</div>`;
  html += `<div style="font-size:14px;color:#e8439f;font-weight:700;text-align:center;margin-bottom:14px">費用: ${cfg.cost}万</div>`;
  html += `<button class="btn" style="width:100%;margin-bottom:8px;background:rgba(232,67,147,0.12);color:#e8439f;border:1px solid rgba(232,67,147,0.3);font-size:14px;padding:10px" id="careTeamConfirmBtn">実行する</button>`;
  html += '<button class="care-close-btn" id="careTeamBackBtn">← 戻る</button>';
  box.innerHTML = html;

  document.getElementById('careTeamConfirmBtn').addEventListener('click', () => {
    if (onConfirm) onConfirm(actionId, null);
    overlay.classList.remove('active');
  });
  document.getElementById('careTeamBackBtn').addEventListener('click', renderMain);
}
```

**(c) 個人向けアクションの確認強化**: 既存の `renderFighterSelect` 内の実行ボタン（L2616）のテキストに費用を明示（既に `実行（${cfg.cost}万）` が表示されているため、これはそのまま維持）。

**確認項目**:
- 団体向けアクションで確認画面が表示され、「← 戻る」でメイン画面に戻れること
- 個人向けアクションも従来通り選手選択→実行の2ステップが機能すること

---

### A-3. おまかせ（autoManage）の動作改善

**問題2点**:
1. おまかせボタンを押すと即座に `processWeek()` まで実行され、プレイヤーが内容を確認・修正できない
2. おまかせボタンが非興行週にしか表示されない（興行週でもスケジュール自動設定は有用）

**対象ファイル**:
- `src/app.js` — `autoManage()` メソッド（L2735-2749）
- `src/ui-render.js` — manage画面のボタン描画（L691-698）

**修正(1): autoManageを設定のみで止める**

```javascript
// 現行（app.js L2735-2749）
autoManage() {
  if (G.weekPhase !== 'manage') return;
  Audio.play('select');
  const roster = G.roster.map(c => {
    if (c.injury || c.isRental) return c;
    if (c.condition < 60) return { ...c, schedule: 'rest', intensive: false };
    if (c.condition < 75 && c.intensive) return { ...c, intensive: false };
    return c;
  });
  G = { ...G, roster };
  App.processWeek();  // ← ここが問題
},

// 変更後
autoManage() {
  if (G.weekPhase !== 'manage') return;
  Audio.play('select');
  const roster = G.roster.map(c => {
    if (c.injury || c.isRental) return c;
    if (c.condition < 60) return { ...c, schedule: 'rest', intensive: false };
    if (c.condition < 75 && c.intensive) return { ...c, intensive: false };
    return c;
  });
  G = { ...G, roster };
  showToast('🤖 おまかせ完了 — 内容を確認してください');
  refreshAll();  // 画面を再描画して止まる
},
```

**修正(2): おまかせボタンを興行週でも表示**

```javascript
// 現行（ui-render.js L691-698）
html += '<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">';
if (isShow) {
  html += '<button class="btn btn-gold" onclick="startShowPrep()" ...>🎤 興行準備へ →</button>';
} else {
  html += '<button class="btn btn-gold" onclick="doProcessWeek()" ...>⏩ 週を処理</button>';
  html += '<button class="btn" onclick="App.autoManage()" ...>🤖 おまかせ</button>';
}

// 変更後
html += '<div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">';
if (isShow) {
  html += '<button class="btn btn-gold" onclick="startShowPrep()" ...>🎤 興行準備へ →</button>';
} else {
  html += '<button class="btn btn-gold" onclick="doProcessWeek()" ...>⏩ 週を処理</button>';
}
// おまかせは興行週・非興行週どちらでも表示
html += '<button class="btn" onclick="App.autoManage()" style="font-size:14px;padding:10px 20px;background:rgba(46,204,113,0.12);color:#2ecc71;border:1px solid rgba(46,204,113,0.3);font-weight:600" title="体調に応じてスケジュールを自動設定します（確認後に手動で進めてください）">🤖 おまかせ</button>';
```

**注意**: titleの説明文も変更（旧「体調60未満の選手を自動で休養させてから週を進めます」→ 新「体調に応じてスケジュールを自動設定します（確認後に手動で進めてください）」）

**確認項目**:
- 非興行週: おまかせ→スケジュール変更→画面更新で停止。プレイヤーが「⏩ 週を処理」を押すまで進まないこと
- 興行週: おまかせボタンが表示され、スケジュール設定後に「🎤 興行準備へ」に進めること
- どちらの場合も、おまかせ後に個別のスケジュールを手動変更できること

---

## グループB: 序盤〜中盤の難易度崖緩和

### B-1. getMQAdjust 保護帯域の拡張

**目的**: orgPop 20を超えた時点の「崖」をなだらかな「坂」に変える。

**対象ファイル**: `src/engine.js` — `Engine.orgPop.getMQAdjust`（L4527-4531）

**現行**:
```javascript
getMQAdjust(orgPop) {
  if (orgPop < 20) return { shift: -10, negMult: 0.4 };
  if (orgPop < 40) return { shift: -5,  negMult: 0.7 };
  return { shift: 0, negMult: 1.0 };
}
```

**変更後**:
```javascript
getMQAdjust(orgPop) {
  if (orgPop < 20) return { shift: -10, negMult: 0.4 };  // 創設期: 変更なし
  if (orgPop < 30) return { shift: -7,  negMult: 0.5 };  // 弱小→地方: 保護強化
  if (orgPop < 45) return { shift: -3,  negMult: 0.85 };  // 地方→中堅: 橋渡し帯域（新設）
  return { shift: 0, negMult: 1.0 };                       // 中堅以上: 変更なし
}
```

**master-spec.md の設計決定ログも更新すること**:
旧: `orgPop帯別MQ閾値シフト — orgPop<20:shift=-10/negMult=0.4、orgPop<40:shift=-5/negMult=0.7、40以上:変更なし`
新: `orgPop帯別MQ閾値シフト — orgPop<20:shift=-10/negMult=0.4、orgPop<30:shift=-7/negMult=0.5、orgPop<45:shift=-3/negMult=0.85、45以上:変更なし`

---

### B-2. orgPop逓減カーブの20-40帯緩和

**目的**: orgPop 20到達直後の急激な成長鈍化を和らげる。

**対象ファイル**: `src/engine.js` — `Engine.orgPop.getDiminishingMultiplier`（L4497-4503）

**現行**: `if (orgPop < 40) return 0.60;`

**変更後**: `if (orgPop < 40) return 0.70;`

他の帯域はすべて据え置き。

**master-spec.md の設計決定ログも更新すること**:
旧: `orgPop逓減カーブ — 0→×1.0, 20→×0.60, 40→×0.35, 55→×0.20, 70→×0.12, 85→×0.08`
新: `orgPop逓減カーブ — 0→×1.0, 20→×0.70, 40→×0.35, 55→×0.20, 70→×0.12, 85→×0.08`

---

### B-3. 補助金の落差緩和

**目的**: orgPop 20到達時の補助金減額の落差を和らげる。

**対象ファイル**: `src/data.js` — `SUBSIDY_TABLE`（L625-629）

**現行**: `{max:29, val:50}`（orgPop 20-29: 50万/週）

**変更後**: `{max:29, val:65}`（orgPop 20-29: 65万/週）

他の帯域はそのまま（0-19: 80万/週、30-39: 20万/週）。

**master-spec.md の設計決定ログも更新すること**:
旧: `育成補助金 — orgPop 40未満に地域振興助成金（0-19:80万/週、20-29:50万/週、30-39:20万/週）`
新: `育成補助金 — orgPop 40未満に地域振興助成金（0-19:80万/週、20-29:65万/週、30-39:20万/週）`

---

## 更新対象ドキュメント一覧

| ドキュメント | 更新内容 |
|---|---|
| `docs/master-spec.md` 設計決定ログ | B-1/B-2/B-3の数値変更を反映 |
| `docs/game-system-roadmap.md` | セッション31の完了内容を記載 |

---

## 据え置き確認（今回触らないもの）

以下は今回の変更対象外。中盤以降のバランスへの影響を避けるため明示的に据え置く。

- orgPop 55+の逓減カーブ（×0.35/0.20/0.12/0.08）
- 年次減衰テーブル（calcAnnualDecay 全帯域）
- Heat維持困難化（heatScore≥6の上昇×0.5/decay×1.5）
- MQ外部ボーナスキャップ+15
- 集客計算式（baseAttendance係数10000）
- チケット単価（0.5万/人）
- 会場コスト・会場popReq
- ケアアクションのコストテーブル（段階的解放は別途設計議論後）

---

## 今後の検討事項（本セッションでは実装しない）

- ケアアクションの段階的解放（discussion backlog A2/A3と連動。施設システム見直しと合わせて設計）
- 序盤のマイルストーン報酬（初満員ボーナス、初MQ60達成報酬など。資金グラフの「一直線の下り」を緩和する施策）
- 施設システムの根本見直し（discussion backlog A2）
