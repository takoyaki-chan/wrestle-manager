# 今週画面ロスターテーブル リデザイン 実装指示

## 目的

今週画面 (`weekPhase === 'manage'`) のロスターテーブル部分を、モックアップ仕様に従ってリデザインする。

**対象は「ロスターテーブル本体」のみ。** 上のダッシュボードパネル(シーズン進捗バー・ランキング・月次収支・ニュースティッカー)、Heat表示、コーチ数、興行準備へボタン、おまかせボタン、一括操作パネル(練習優先・プロモ優先・バランス・休養重視・全ON・全OFF)は**一切変更しない**。

## 参考ファイル(必ず最初に読むこと)

- `docs/mockup-week-roster.html` — 完成形のモックアップ。HTML構造・CSS・JSロジックすべて含む
- 開いて確認: `../image/face_xxx.png` で顔画像が表示される、9名分のロスターが新カラム順で並んでいる

## 対象ファイル

1. **`src/index.html`** — 新規CSS追加
2. **`src/ui-render.js`** — ヘルパー関数追加 + テーブルレンダラ書き換え

## 変更内容サマリ

### カラム構成(新)

| # | 列 | 幅 | 内容 |
|---|---|---|---|
| 1 | チェックボックス | 30px | 一括操作用 |
| 2 | 名前 | 210px | **顔アイコン40px四角 + 名前(クリック→詳細)** |
| 3 | 総合 | 80px | 大型数字+OVR色階調+ティアラベル(A/B/C/D等) |
| 4 | 人気 | 60px | **新規追加。** 数値のみ(色階調) |
| 5 | 状態 | 60px | 健康/怪我/休養中(現状仕様) |
| 6 | 体調 | 120px | バー+数値(現状仕様) |
| 7 | スケジュール | 130px | セレクト(現状仕様) |
| 8 | ⚡ | 46px | 特訓ボタン(現状仕様) |
| 9 | 今週の行動 | 92px | アクションタグ(現状仕様) |
| 10 | (埋め) | auto | 余白吸収用の空セル |

### 主な追加要素

- **顔アイコン**: `getPortraitUrl(c.id)` で取得、40px 角丸正方形(border-radius:8px)、クリックで `showFighterPopup(c.id, 'roster')` 起動
- **名前のクリッカブル化**: `fLink(c, {source:'roster'})` を使うか、相当する仕組みで `showFighterPopup` を呼ぶ。点線下線 `text-decoration-style:dotted` でクリック可能を示唆
- **OVR色階調**: 既存の CSS 変数 `--v-mythic`/`--v-elite-mid`/`--v-elite`/`--v-elite-low`/`--v-high`/`--v-mid`/`--v-low`/`--v-poor` を使う(既に index.html 9〜172行目に定義済み)
- **OVRティアラベル**: 数字の下に小さく `A`/`B`/`C` などを表示。`OVR_TIER_THRESHOLDS`(data.js)に基づく
- **人気列**: 新規。`Engine.util.dispPop(c.popularity)` で値、`_popColor(...).color`(ui-common.js 543行目)で色

## 実装手順

### Step 1: `src/index.html` に CSS 追加

`</style>` 直前(モーダル系トークン定義の後あたり)に以下を追加。**既存の `.data-table` を上書きせず、新規クラス `.week-roster-table` として独立させる。**

```css
/* ════════ 今週画面ロスターテーブル v1.0 ════════ */
.week-roster-table{width:100%;border-collapse:collapse;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;table-layout:fixed}
.week-roster-table th{background:var(--bg-main);font-size:11px;font-weight:600;color:var(--text-sub);padding:10px 8px;text-align:left;border-bottom:1px solid var(--border);letter-spacing:.5px}
.week-roster-table th.num,.week-roster-table th.center{text-align:center}
.week-roster-table td{padding:10px 8px;border-bottom:1px solid rgba(200,190,170,0.04);vertical-align:middle}
.week-roster-table tr:last-child td{border-bottom:none}
.week-roster-table tr:hover td{background:rgba(255,255,255,0.015)}

/* 顔アイコン(40px 角丸正方形) */
.wr-face{width:40px;height:40px;border-radius:8px;border:1.5px solid rgba(212,168,67,0.25);object-fit:cover;background:#1a1814;flex-shrink:0;cursor:pointer;transition:border-color .15s}
.wr-face:hover{border-color:var(--gold)}
.wr-face-init{display:flex;align-items:center;justify-content:center;font-weight:900;border-radius:8px;border:1.5px solid rgba(212,168,67,0.25);flex-shrink:0;cursor:pointer}

/* 名前セル */
.wr-name-cell{display:flex;align-items:center;gap:10px;min-width:0}
.wr-name-link{font-weight:600;color:var(--text-main);cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-decoration-color:rgba(232,230,224,0.3);text-underline-offset:2px;font-size:14px}
.wr-name-link:hover{color:var(--gold);text-decoration-color:var(--gold)}
.wr-crown{color:var(--gold);font-size:12px;margin-left:4px;text-shadow:0 0 4px rgba(212,168,67,0.5)}

/* OVR(大型数字+ティアラベル) */
.wr-ovr-wrap{display:flex;flex-direction:column;align-items:center;gap:3px}
.wr-ovr-num{font-family:var(--font-display);font-size:26px;line-height:1;letter-spacing:.5px;text-align:center}
.wr-ovr-tier{font-family:var(--font-label);font-size:9px;letter-spacing:1.5px;color:var(--text-dim)}

/* 人気(数値のみ・色階調) */
.wr-pop-num{font-family:var(--font-display);font-size:18px;line-height:1;text-align:center;display:block}

/* 体調バー(既存 .cond-bar/.cond-fill を再利用、ラッパのみ追加) */
.wr-cond-wrap{display:flex;align-items:center;gap:8px;min-width:90px}
.wr-cond-num{font-family:var(--font-display);font-size:14px;line-height:1;color:var(--text-main);min-width:22px;text-align:right}
```

**注**: `.cond-bar`, `.cond-fill.high/.mid/.low`, `.sched-tag.*`, `.btn-intensive` は既存スタイルを再利用する。`.wr-cond-wrap` は新規ラッパのみ。

### Step 2: `src/ui-render.js` にヘルパー関数追加

`_getWeekSortValue` 関数の直後(81行目あたり)に以下を追加:

```javascript
// 今週画面ロスター用: OVR ティア決定 (data.js OVR_TIER_THRESHOLDS に準拠)
function _wrOvrTier(v) {
  if (v >= OVR_TIER_THRESHOLDS.mythic)   return { cls: 'mythic',    label: 'SS' };
  if (v >= OVR_TIER_THRESHOLDS.eliteMid) return { cls: 'elite-mid', label: 'S+' };
  if (v >= OVR_TIER_THRESHOLDS.elite)    return { cls: 'elite',     label: 'S'  };
  if (v >= OVR_TIER_THRESHOLDS.eliteLow) return { cls: 'elite-low', label: 'A'  };
  if (v >= OVR_TIER_THRESHOLDS.high)     return { cls: 'high',      label: 'B'  };
  if (v >= OVR_TIER_THRESHOLDS.mid)      return { cls: 'mid',       label: 'C'  };
  if (v >= OVR_TIER_THRESHOLDS.low)      return { cls: 'low',       label: 'D'  };
  return                                        { cls: 'poor',      label: 'E'  };
}
```

### Step 3: `_renderWeekRow` (922〜994行目) を書き換え

#### 3-1. レンタル選手分岐(934〜949行目) を以下に差し替え

```javascript
if (c.isRental) {
  const rentalContract = (G.rentals || []).find(r => r.fighterId === c.id);
  const rentalWL = rentalContract ? rentalContract.weeksLeft : '?';
  const rentalAction = c.injury ? '療養' : c.condition < 60 ? '🔄休養' : '練習';
  const tier = _wrOvrTier(ov(c));
  const popVal = Engine.util.dispPop(c.popularity);
  const popCol = _popColor(popVal).color;
  const faceUrl = getPortraitUrl(c.id);
  html += `<tr style="opacity:0.85${c.injury ? ';opacity:0.65' : ''}">
    <td><input type="checkbox" class="week-check" data-id="${c.id}" disabled></td>
    <td>
      <div class="wr-name-cell">
        ${_imgOrInitial(faceUrl, c.id, 40, 'border-radius:8px;')}
        <span>
          <span class="wr-name-link" onclick="showFighterPopup(${c.id},'roster')">${c.name}</span>${wkChampBadge}
          <span style="font-size:10px;color:#f39c12;margin-left:4px">🤝残${rentalWL}週</span>
        </span>
      </div>
    </td>
    <td>
      <div class="wr-ovr-wrap">
        <span class="wr-ovr-num v-${tier.cls}">${ov(c)}</span>
        <span class="wr-ovr-tier">${tier.label}</span>
      </div>
    </td>
    <td><span class="wr-pop-num" style="color:${popCol}">${popVal}</span></td>
    <td>${statusHtml}</td>
    <td>
      <div class="wr-cond-wrap">
        <div class="cond-bar"><div class="cond-fill ${condCls}" style="width:${condPct}%"></div></div>
        <span class="wr-cond-num">${condPct}</span>
      </div>
    </td>
    <td><span style="font-size:12px;color:var(--text-dim)" title="レンタル選手は自律行動します">🤝自律</span></td>
    <td><span style="font-size:12px;color:var(--text-dim)">--</span></td>
    <td><span class="sched-tag practice">${rentalAction}</span></td>
    <td></td>
  </tr>`;
  return;
}
```

#### 3-2. 通常選手の出力部分(977〜993行目)を以下に差し替え

```javascript
const tier = _wrOvrTier(ov(c));
const popVal = Engine.util.dispPop(c.popularity);
const popCol = _popColor(popVal).color;
const faceUrl = getPortraitUrl(c.id);
html += `<tr${c.injury ? ' style="opacity:0.65"' : ''}>
  <td><input type="checkbox" class="week-check" data-id="${c.id}" ${c.injury ? 'disabled' : ''}></td>
  <td>
    <div class="wr-name-cell">
      ${_imgOrInitial(faceUrl, c.id, 40, 'border-radius:8px;')}
      <span>
        <span class="wr-name-link" onclick="showFighterPopup(${c.id},'roster')">${c.name}</span>${wkChampBadge}${trainerBadge}
      </span>
    </div>
  </td>
  <td>
    <div class="wr-ovr-wrap">
      <span class="wr-ovr-num v-${tier.cls}">${ov(c)}</span>
      <span class="wr-ovr-tier">${tier.label}</span>
    </div>
  </td>
  <td><span class="wr-pop-num" style="color:${popCol}">${popVal}</span></td>
  <td>${statusHtml}</td>
  <td>
    <div class="wr-cond-wrap">
      <div class="cond-bar"><div class="cond-fill ${condCls}" style="width:${condPct}%"></div></div>
      <span class="wr-cond-num">${condPct}</span>
    </div>
  </td>
  <td>
    <select onchange="updateSchedulePreview(${c.id},this.value)" style="font-size:13px;padding:6px 10px;border-radius:6px;width:100%" ${schedDisabled}>
      <option value="balance" ${c.schedule==='balance'?'selected':''} title="非興行週は練習、興行週はプロモを自動選択。迷ったらこれ。体調60未満で自動休養します">バランス</option>
      <option value="practice" ${c.schedule==='practice'?'selected':''} title="毎週練習を行います。ステータス成長に集中したい時に。体調60未満で自動休養します">練習優先</option>
      <option value="promo" ${c.schedule==='promo'?'selected':''} title="毎週プロモ活動を行います。人気を上げたい時に（上限70）。体調60未満で自動休養します">プロモ優先</option>
      <option value="rest" ${c.schedule==='rest'?'selected':''} title="強制的に休養させます。体調管理よりも確実に休ませたい時に">休養重視</option>
    </select>
  </td>
  <td style="text-align:center">${intBtnHtml}</td>
  <td id="action-${c.id}"><span class="sched-tag ${previewAction}">${previewLabel}</span></td>
  <td></td>
</tr>`;
```

**変更ポイント**:
- 新規10列(checkbox + 9列 + 埋めセル)に対応
- セレクトの font-size を 15px → 13px、padding を 8px 12px → 6px 10px、min-width 削除して `width:100%` に(列幅130pxに収まるように)

### Step 4: テーブルヘッダー(1015〜1024行目)を書き換え

```javascript
html += `<table class="week-roster-table"><tr>
  <th style="width:30px"><input type="checkbox" id="weekCheckAll" onchange="toggleWeekCheckAll(this.checked)"></th>
  <th onclick="setWeekSort('name')" style="width:210px;cursor:pointer">名前${_weekSortIndicator('name')}</th>
  <th onclick="setWeekSort('ovr')" class="num" style="width:80px;cursor:pointer">総合${_weekSortIndicator('ovr')}</th>
  <th onclick="setWeekSort('pop')" class="num" style="width:60px;cursor:pointer">人気${_weekSortIndicator('pop')}</th>
  <th style="width:60px">状態</th>
  <th onclick="setWeekSort('cond')" style="width:120px;cursor:pointer">体調${_weekSortIndicator('cond')}</th>
  <th onclick="setWeekSort('schedule')" style="width:130px;cursor:pointer">スケジュール${_weekSortIndicator('schedule')} <span class="info-tip" title="育成方針を選択します。体調60未満になると方針に関わらず自動で休養します。">ℹ️</span></th>
  <th class="center" style="width:46px">⚡</th>
  <th style="width:92px">今週の行動</th>
  <th></th>
</tr>`;
```

### Step 5: レンタル区切り行(1028行目)の colspan 更新

```javascript
html += `<tr><td colspan="10" style="padding:6px 8px;background:rgba(243,156,18,0.07);border-top:1px solid rgba(243,156,18,0.3);border-bottom:1px solid rgba(243,156,18,0.3);color:#f39c12;font-size:12px;font-weight:600">🤝 レンタル枠 (${_rentalRosterWk.length}/${_rSlots})</td></tr>`;
```

`colspan="8"` → `colspan="10"` に変更(checkbox + 9列 + 埋めセル = 10列)。

### Step 6: ソート対応の確認

`_getWeekSortValue` (71〜81行目) は既に `'pop'` ケースを持っているため**変更不要**。新カラム「人気」のソートはそのまま動く。

## 保持すべき既存挙動(変更しないこと)

- **怪我選手**: `c.injury` あり → `<tr style="opacity:0.65">`、チェックボックス disabled、状態列に怪我バッジ
- **休養中**: `c.forcedRest` → 状態列に「🛌 休養中」バッジ
- **王者バッジ**: `wkChampBadge`(既存変数)を名前の右に表示
- **トレーナーバフ**: `trainerBadge`(既存変数)を名前の右に表示(王者バッジの後)
- **特訓ボタン状態**: `intBtnHtml`(既存ロジック)をそのまま使用。disabled条件・連続上限・体調不足の警告も既存のまま
- **アクション予測**: `previewAction`/`previewLabel`(既存ロジック)をそのまま使用、`id="action-${c.id}"` も維持(updateSchedulePreviewが書き換える)
- **チェックボックス操作**: `class="week-check"` `data-id="${c.id}"` は維持(全選択・一括操作の対象セレクタ)
- **ソートヘッダー**: name/ovr/cond/schedule/pop すべてクリックでソート可能(既存のsetWeekSort関数を使用)
- **レンタル選手**: 自律行動表示・🤝残N週バッジ・スケジュール&特訓は無効表示

## やらないこと(スコープ外)

- ダッシュボードパネル(season progress / ranking / 月次収支)の変更
- ニュースティッカーの変更
- Heat / コーチ表示の変更
- 一括操作パネル(練習優先・プロモ優先・バランス・休養重視・全ON・全OFF)の変更
- 興行準備へボタン・おまかせボタンの変更
- 上記ヘッダー部分のCSS変更
- Engine 側(エンジン関数・ゲーム状態)への変更 — 純粋なUI変更のみ

## 設計原則の遵守

- ✅ Engine = ピュア関数(変更なし)
- ✅ GameState 直接変更しない(UI変更のみ)
- ✅ UI never directly modifies G(変更なし)
- ✅ シードRNG/tickWeek パイプライン(変更なし)

## 動作検証

ユーザーがブラウザで手動確認するため、Claude Code側でのスクリーンショット・サーバー起動・ブラウザ起動は**不要**。

ただし以下は実装後に必須:

- [ ] ファイル単位の syntax error がないこと(`node -c` 等で確認可)
- [ ] `_imgOrInitial`, `getPortraitUrl`, `OVR_TIER_THRESHOLDS`, `_popColor`, `Engine.util.dispPop` がすべて参照解決できることを目視確認
- [ ] `colspan="10"` になっていること
- [ ] 列幅の合計(30+210+80+60+60+120+130+46+92 = 828px)+ 埋めセル auto で表示が破綻しないこと

## ロードマップ更新

実装完了後、`docs/game-system-roadmap.md` に以下のエントリを追加:

```
### v?.? 今週画面ロスターテーブル リデザイン
- 顔アイコン40px(クリックで詳細ポップアップ起動)
- 名前クリックで showFighterPopup 起動(点線下線で示唆)
- 人気列を新規追加(数値+色階調、ソート対応)
- OVRに大型数字+色階調+ティアラベル(A/B/C/D)
- カラム順を【名前→総合→人気→状態→体調→スケジュール→⚡→今週の行動】に変更
- 名前列210px固定+末尾埋めセル方式で右側に余白を確保
- 参考: docs/mockup-week-roster.html
```

## 参考: 既存関数・変数の場所

| 名称 | 場所 | 用途 |
|---|---|---|
| `getPortraitUrl(id)` | `src/data.js:536` | 顔画像URL取得 |
| `_imgOrInitial(url, id, size, extraStyle)` | `src/ui-common.js:35` | 画像+フォールバック付きimgタグ生成 |
| `showFighterPopup(id, source)` | (既存、複数箇所で使用) | 選手詳細ポップアップ起動 |
| `OVR_TIER_THRESHOLDS` | `src/data.js:524` | OVRティア閾値定数 |
| `_popColor(v)` | `src/ui-common.js:543` | 人気色階調(返り値の.colorプロパティを使う) |
| `Engine.util.dispPop(popularity)` | (既存) | 人気の表示用変換 |
| `Engine.util.ov(c)` / `ov(c)` | `src/app.js:2966` | OVR計算 |
| `_weekSortKey` / `_weekSortDir` | `src/ui-render.js:59-60` | ソート状態 |
| `_getWeekSortValue` | `src/ui-render.js:71` | ソート値取得(pop対応済み) |
| CSS変数 `--v-mythic` 〜 `--v-poor` | `src/index.html:143-150` | OVR階調色 |
| `.cond-bar` / `.cond-fill.high/.mid/.low` | `src/index.html` | 体調バー(既存) |
| `.sched-tag.*` | `src/index.html` | アクションタグ(既存) |
| `.btn-intensive` | `src/index.html` | 特訓ボタン(既存) |
