# スケジュール再設計 v1.0

## 背景と課題

### 現行の問題
- 手動で「練習優先」「プロモ優先」を選ぶと、エンジンは `condition ≤ 30` まで休養に切り替えない
- 一方「おまかせ」ボタンは `condition < 60` で休養に切り替える
- この30ptのギャップにより、**おまかせ以外の方針が実質使い物にならない**
- おまかせを使うと全員のスケジュールが上書きされ、プロモ重視・練習重視の方針が消える

### 設計目標
- **方針（何を優先するか）と体調管理（いつ休むか）を分離する**
- 方針はプレイヤーが決め、体調管理はエンジンがスマートに自動処理する
- 個別オーバーライドの余地は残す

---

## §1 方針セレクト（UIドロップダウン）

### 選択肢（4択 — 値は現行と同じ）

| 値 | 表示名 | エンジン動作 |
|---|--------|------------|
| `practice` | 練習重視 | 興行週・非興行週ともに練習 |
| `balance` | バランス | 非興行週=練習、興行週=プロモ or 練習（現行ロジック維持） |
| `promo` | プロモ重視 | 興行週・非興行週ともにプロモ |
| `rest` | 休養 | 強制休養（手動指定用） |

### ツールチップ文言（`title` 属性）

```
practice: "毎週練習を行います。ステータス成長に集中したい時に。体調60未満で自動休養します"
balance:  "非興行週は練習、興行週はプロモを自動選択。迷ったらこれ。体調60未満で自動休養します"
promo:    "毎週プロモ活動を行います。人気を上げたい時に（上限70）。体調60未満で自動休養します"
rest:     "強制的に休養させます。体調管理よりも確実に休ませたい時に"
```

---

## §2 体調自動管理（エンジン側改修）

### 変更箇所: `engine.js` — `tickWeek` 内の action 決定

**現行:**
```js
if (nc.condition <= 30) action = 'rest';
```

**新設計:**
```js
// §2: 体調自動管理 — condition < 60 で方針を無視して自動休養
// schedule === 'rest' の場合は閾値に関わらず常に休養
if (action !== 'rest' && nc.condition < 60) action = 'rest';
if (nc.condition <= 30) action = 'rest'; // ← 冗長だが安全弁として残す
```

> **閾値 60 の根拠:**
> - 試合の怪我確率は `condFactor = (100 - condition) / 100` に比例
> - condition 60 → condFactor 0.40 → 怪我率寄与 +0.020（ベース 0.025 のほぼ倍）
> - おまかせボタンの既存ライン（< 60 で休養）と一致
> - プレイヤーの体感（「60切ると休ませなきゃ」）とも一致

### 適用箇所

`tickWeek` 内の以下2箇所（プレイヤーロスター処理）:

1. **通常練習パス**（L3485付近）: `let action = nc.schedule;` の後
2. **強化練習パス**（L3458付近）: intensive 処理前の condition チェック

※ `schedule === 'rest'` を手動設定している場合は閾値に関係なく常に休養（オーバーライド尊重）。

### 自動休養時の `_weekAction`

`_weekAction = 'auto_rest'` として通常の `'rest'` と区別する。UI側で「自動休養」と表示可能にするため。

---

## §3 おまかせボタン改修

### 現行ロジック
```js
if (condition >= 80) → { schedule: 'practice', intensive: true }
if (condition >= 75) → { schedule: 'practice', intensive: false }
if (condition >= 60) → { schedule: 'balance',  intensive: false }
// < 60             → { schedule: 'rest',     intensive: false }
```

### 新設計: 方針を尊重する形に

```js
autoManage() {
  G.roster.map(c => {
    if (c.injury || c.isRental || c.forcedRest) return c;
    const policy = c.schedule || 'balance'; // 現在の方針を保持

    if (c.condition >= 80) return { ...c, schedule: policy, intensive: true };
    if (c.condition >= 75) return { ...c, schedule: policy, intensive: false };
    if (c.condition >= 60) return { ...c, schedule: policy, intensive: false };
    // < 60: 方針に関わらず休養
    return { ...c, schedule: 'rest', intensive: false };
  });
}
```

**変更点:**
- condition ≥ 60 の選手は方針を維持（上書きしない）
- ⚡強化の ON/OFF だけを体調に基づいて調整
- condition < 60 の選手のみ `'rest'` に上書き

### おまかせボタンのツールチップ更新

```
現行: "体調に応じてスケジュールを自動設定します（確認後に手動で進めてください）"
新:   "体調に応じて強化ON/OFFを最適化し、体調60未満の選手を休養にします。各選手の方針はそのまま維持されます"
```

---

## §4 UIツールチップ追加

### §4.1 スケジュールドロップダウン横の「ℹ️」アイコン

テーブルヘッダー「スケジュール」の横にインフォアイコンを追加:

```html
<th>スケジュール <span class="info-tip" title="育成方針を選択します。体調60未満になると方針に関わらず自動で休養します。">ℹ️</span></th>
```

### §4.2 各 `<option>` の title 属性

§1 に記載のツールチップ文言を各 option に設定。

### §4.3 ⚡強化ボタンのツールチップ（既存確認・補足）

```
通常時:  "強化練習ON — 成長×1.5倍、体調消耗大、怪我リスク5%。体調50以上・連続2週まで"
無効時:  "体調不足" or "連続上限"（※現行通り）
```

### §4.4 「今週の行動」列の表示ラベル追加

| _weekAction | 表示 | ツールチップ |
|------------|------|-----------|
| `practice` | 練習 | "ステータスをランダムに1つ成長させます（PW/SP/TE/STから均等）" |
| `promo` | プロモ | "人気を1〜3上昇（上限70）。プロモスタックが試合MQに加算されます" |
| `rest` | 休養 | "体調を8〜15回復します" |
| `auto_rest` | 🔄休養 | "体調60未満のため自動休養中。体調を8〜15回復します" |
| `intensive` | ⚡強化 | "成長×1.5倍。体調消耗が大きく、5%の確率で練習負傷します" |
| `療養` | 療養 | "怪我の治療中。毎週残り期間が1減少します" |

### §4.5 おまかせボタン

§3 に記載の通り title 属性を更新。

---

## §5 MN（メンタル）修正

### §5.1 pickGrowthStat から MN を除外

**現行:**
```js
pickGrowthStat(rng, G, charId) {
  const stats = ['pw','sp','te','st','mn'];
  // 各20%均等
}
```

**新設計:**
```js
pickGrowthStat(rng, G, charId) {
  const stats = ['pw','sp','te','st'];
  const r = Engine.rng.float(rng);
  let cumulative = 0;
  for (let i = 0; i < stats.length; i++) {
    cumulative += 0.25;
    if (r < cumulative) return stats[i];
  }
  return stats[3];
}
```

> 影響: 練習1回あたりの各ステ成長期待値が +25%（4ステに予算集中）。
> ただし `calcGrowth` は `share = remaining / totalRemaining` で配分するため、
> 予算総量（GROWTH_SEASON_BASE）は変わらない。実質的な成長速度の変化は軽微。

### §5.2 試合成長の MN 維持

`allStats = ['pw','sp','te','st','mn']` は変更しない。MN は試合経験で成長する設計を維持。

### §5.3 UI: MN バーに注記追加

`_renderRosterTrainingPanel` 内、MN の stat-bar-wrap に注記:

```html
<!-- MN行のみ追加 -->
<span class="stat-bar-note" title="メンタルは練習では成長しません。試合経験によって成長します">※試合で成長</span>
```

スタイル:
```css
.stat-bar-note { font-size: 10px; color: var(--text-dim); margin-left: 4px; cursor: help; }
```

---

## §6 実装チェックリスト

### engine.js
- [ ] `tickWeek`: action 決定ロジックに `condition < 60 → rest` を追加（§2）
- [ ] `tickWeek`: 自動休養時の `_weekAction = 'auto_rest'` 設定
- [ ] `pickGrowthStat`: MN 除外、4ステ均等25%（§5.1）
- [ ] `autoManage` 相当のロジック（app.js 側）を §3 の方針尊重型に改修

### app.js
- [ ] `autoManage()`: 方針保持型に改修（§3）

### ui-render.js
- [ ] スケジュール `<option>` に title 属性追加（§4.2）
- [ ] テーブルヘッダーに ℹ️ インフォアイコン追加（§4.1）
- [ ] `actionLabels` に `auto_rest: '🔄休養'` 追加（§4.4）
- [ ] 行動列のラベルにツールチップ追加（§4.4）
- [ ] おまかせボタンの title 更新（§4.5）
- [ ] MN バーに「※試合で成長」注記追加（§5.3）

### data.js
- [ ] 変更なし

---

## §7 影響範囲メモ

- **AI団体の週次処理**: AI団体は独自の練習ロジック（L2767付近）を持つ。`pickGrowthStat` は共有しているため MN 除外は自動適用。体調自動管理はプレイヤーロスターのみ。
- **イベント処理**: 強化練習リクエストイベント（§13系）は schedule を直接設定するため影響なし。
- **セーブ互換**: `schedule` の値域は変わらない。`_weekAction = 'auto_rest'` は表示用のみで永続化不要。互換性問題なし。
- **おまかせの condition < 60 → rest 上書き**: セーブロード後に方針が `'rest'` のまま残る可能性あり。ただし手動で変更可能なので問題なし。
