# 団体比較 スポーツ新聞風リデザイン 実装指示

## 概要

データベースタブ「団体比較」サブタブの全面リデザイン。
変更対象: `src/ui-render.js`（`_renderDbOrgCompare()` 関数）+ `src/index.html`（CSS）

変更は大きく分けて6カテゴリ:
1. カラースキーム変更（ダーク → セピア紙風）
2. 英語ラベルの日本語化
3. テキストロジック修正（popTail問題 + ワンパターン問題）
4. VS表示の強調
5. エース対決のスタンド画像レイアウト
6. 赤帯ヘッダー追加

---

## 1. カラースキーム変更

### 方針
新聞タブ（`.newspaper-box`）と同系統のセピア/クリーム紙風カラーに変更。
既存のダークゴールド配色（`#1a1714` 背景, `#d4a843` アクセント）を廃止。

### 基本パレット

| 用途 | 旧（ダーク） | 新（セピア） |
|------|-------------|-------------|
| 全体背景 | `#1a1714` | `linear-gradient(180deg, #f5ecd7 0%, #ede2c6 40%, #e8d9b7 100%)` |
| テキスト主色 | `#e8e0d0` / `var(--text-main)` | `#1a0a00` / `#2a1a0a` |
| テキスト副色 | `var(--text-sub)` | `rgba(80,50,20,0.5)` |
| テキスト本文 | `var(--text-dim)` | `#3a2a1a` |
| パネル背景 | `rgba(255,255,255,0.03)` | `rgba(80,50,20,0.04)` |
| ボーダー | `rgba(212,168,67,0.1)` | `rgba(80,50,20,0.1)` |
| プレイヤーアクセント | `#d4a843`（ゴールド） | `#9a7020` / `#6a4a10`（渋ゴールド） |
| ライバルアクセント | ライバル団体カラー | `#6a3890` / `#5a2880`（紫系維持、セピアに合う彩度に） |
| 警告・赤系 | `#e24b4a` | `#8b1a1a`（深い赤、セピアに馴染む） |
| 良好・緑系 | `#5DCAA5` | `#1a7a50`（落ち着いた緑） |

### CSS変更方針
- `.db-cmp-*` クラスのカラー値をすべてセピア系に書き換え
- 団体比較タブ全体を包むコンテナに背景グラデーションを設定
- ライバル団体カラー（`rc` 変数）は引き続きJS側で取得するが、セピア背景上で映えるよう `hexDim()` のアルファ値を調整

---

## 2. 英語ラベルの日本語化

### 変更一覧

| 箇所 | 旧（英語） | 新（日本語） | コード位置 |
|------|-----------|-------------|-----------|
| 比較対象セレクト | `Compare with` | `比較対象` | `_renderDbOrgCompare` 冒頭 `<label>` |
| グレードラベル | `Matchup` | `相性` | `.grade-label` テキスト |
| 対戦成績見出し | `Head to Head` | `対戦成績` | `.db-cmp-panel-title` |
| 主力対決見出し | `Top 3 Matchups` | `主力対決` | `.db-cmp-panel-title` |
| パワーチャート見出し | `Power Snapshot` | `戦力レーダー` | `.db-cmp-panel-title` |
| コラム見出し | `Column` | `記者コラム` | `.db-cmp-panel-title` |
| スカウト見出し | `Scouting Report` | `${d.rivalName} 注目選手` | `.db-cmp-panel-title` ※相手団体名を動的に挿入 |
| ファン見出し | `Fan Voice` | `ファンの声` | `.db-cmp-panel-title` |
| プレイヤーバッジ | `Player` | `プレイヤー` | `.db-cmp-tier.player` |
| ティアバッジ | `Tier ${d.rivalTier}` | `ティア${d.rivalTier}` | `.db-cmp-tier` |
| エース中央ラベル | `ACE` | `エース対決` | `getMatchupSlot()` の `center` |
| No.2中央ラベル | `No.2` | `No.2対決` | `getMatchupSlot()` の `center` |
| No.3中央ラベル | `No.3` | `No.3対決` | `getMatchupSlot()` の `center` |

### セクションタイトルのスタイル分け
- **赤縦線** (`border-left: 3px solid #8b1a1a`): 「主力対決」「${rivalName} 注目選手」→ 相手に関する情報であることを視覚的に示す
- **金縦線** (`border-left: 3px solid #9a7020`): 「対戦成績」「戦力レーダー」「記者コラム」「ファンの声」→ 自陣営寄り/中立の情報

---

## 3. テキストロジック修正

### 3-A. getPopularityTail() の根本修正

**問題:** OVR差でこちらが圧倒しているのに、popDiffがマイナス（相手が人気上位）のとき、
「おまけに人気でも大差」と書くと「こちらの人気も大差でリード」と誤読される。
OVR優勢＋人気劣勢の場合は逆接（「ただし」「一方で」等）で繋ぐ必要がある。

**修正:** `getPopularityTail(popDiff)` を `getPopularityTail(popDiff, slotIndex)` に変更し、
slotIndex別に言い回しを変えてワンパターンを防止する。

```javascript
function getPopularityTail(popDiff, slotIndex) {
  // slotIndex: 0=ace, 1=no2, 2=no3
  if (popDiff >= 8) {
    return [
      '人気でもこちらが大きくリードしており、興行の主導権は完全にこちらにある。',
      '人気面でも圧倒。集客力を含めた総合力でねじ伏せられる。',
      '人気でも完勝。ここまで差があれば興行の空気は自在に作れる。',
    ][slotIndex] || '人気でもこちらが大きくリード。';
  }
  if (popDiff >= 3) {
    return [
      '集客力でもこちらが上。興行の空気を作れるのは大きい。',
      '人気面でも先行しており、会場の後押しが期待できる。',
      '集客面の優位が下支えになる。地力の差が出る場面だ。',
    ][slotIndex] || '集客力でも上回っている。';
  }
  if (popDiff <= -8) {
    return [
      'ただし人気では大きく水をあけられている。集客面の不利は、そのまま興行の空気に直結する。',
      '一方で人気面では相手に大きく分がある。会場の温度差がそのまま試合の空気になる。',
      '集客面の弱さは団体の地力に響く。人気差がこれだけ開くと、興行全体の勢いが違ってくる。',
    ][slotIndex] || 'ただし人気では大きく水をあけられている。';
  }
  if (popDiff <= -3) {
    return [
      '一方、人気面では相手に分がある。集客への影響がボディブローのように効いてくる。',
      '人気差は無視できない。ファンの声援が試合の流れを変えることもある。',
      '人気で後手を踏んでいるのが気がかりだ。数字以上の壁を感じるかもしれない。',
    ][slotIndex] || '人気面では相手に分がある。';
  }
  return [
    '人気は互角。純粋な実力勝負の構図だ。',
    '人気差はほぼなし。勝負は地力で決まる。',
    '集客面は五分。ここは内容で差をつけたい。',
  ][slotIndex] || '人気は互角。';
}
```

### 3-B. getMatchupCopy() の popTail 引数追加

`getMatchupCopy(slot, ovrDiff, popDiff)` → `getMatchupCopy(slot, ovrDiff, popDiff, slotIndex)`

各呼び出し箇所で slotIndex を渡す:
```javascript
let fullCopy = getMatchupCopy(slot, ovrDiff, popDiff, index);
```

`getMatchupCopy` 内の `getPopularityTail(popDiff)` → `getPopularityTail(popDiff, slotIndex)` に変更。

---

## 4. VS表示の強調

### 団体カードVS（②セクション）
- VS文字サイズ: `font-size: 36px; font-weight: 900; color: #8b1a1a`
- 上下にグラデーション区切り線（`linear-gradient(180deg, transparent, #8b1a1a, transparent)`）
- **ライバル団体のemoji/アイコンを削除**（`${d.rivalEmoji || 'VS'}` → VS表示のみ）

---

## 5. エース対決のスタンド画像レイアウト

### 構造
エース対決（index === 0）のみ、専用の「アリーナ」レイアウトを使う。

```
┌─ エース対決チップ ──────────── ほぼ五分 ─┐
│                                          │
│   ┌──────┐    VS    ┌──────┐           │
│   │ 左側  │← 80px →│ 右側  │           │
│   │scaleX │  OVR差  │そのまま│           │
│   │(-1)   │  人気差  │       │           │
│   │ 右向き │         │ 左向き │           │
│   └──────┘         └──────┘           │
│   ═══════════════════════════（赤金ライン）│
├──────────────────────────────────────────┤
│ 菊池璃子  戦妃門/OVR97   インパルス/OVR97  高槻千歳│
├──────────────────────────────────────────┤
│ 解説テキスト                               │
└──────────────────────────────────────────┘
```

### スタンド画像の取得
- `getStandUrl(fighterId)` 関数を使用（既存の `getPortraitUrl()` と同様のパターン）
- 画像がない場合は姓の1文字をフォールバック表示

### 画像配置CSS
```css
.ace-arena {
  position: relative;
  height: 220px;
  background: linear-gradient(180deg, rgba(139,26,26,0.06) 0%, rgba(80,50,20,0.02) 100%);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.ace-arena::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #9a7020, #8b1a1a, #9a7020);
}
.ace-char {
  position: absolute;
  bottom: 0;
  width: 150px;
  height: 220px;
  overflow: hidden;
}
.ace-char img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}
/* 左側: 元画像は左向き → scaleX(-1)で右向きに反転 → 相手を見る */
.ace-char.left {
  right: 50%;
  margin-right: 40px; /* 80px / 2 */
}
.ace-char.left img {
  transform: scaleX(-1);
}
/* 右側: 元画像は左向き → そのまま → 相手を見る */
.ace-char.right {
  left: 50%;
  margin-left: 40px; /* 80px / 2 */
}
```

### キャラ間距離
**80px固定**（左 margin-right: 40px + 右 margin-left: 40px）

### VS表示（アリーナ中央）
```css
.ace-vs-center {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  text-align: center;
  background: radial-gradient(ellipse, rgba(245,236,215,0.92) 0%, rgba(245,236,215,0) 70%);
  padding: 20px 30px;
}
```
VSテキスト: `font-size: 32px; font-weight: 900; color: #8b1a1a`
その下に `OVR差 / 人気差` を小さく表示。

### 名前バー（アリーナ下）
左右にフレックスで配置。左側に自団体選手名+所属+OVR、右側に相手団体選手名+所属+OVR。

### No.2・No.3は従来通り
index >= 1 のマッチアップカードは現行の丸アバター+テキスト形式を維持（セピアカラーに変更のみ）。

---

## 6. 赤帯ヘッダー追加

団体比較セクションの最上部にスポーツ新聞風の赤帯を追加。

```html
<div class="db-cmp-newspaper-header">
  <h1>週刊グラップル ── 団体比較</h1>
  <span>比較対象: ${rivalDisplayName} (ティア${d.rivalTier})</span>
</div>
```

```css
.db-cmp-newspaper-header {
  background: linear-gradient(90deg, #8b1a1a, #c22020);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 8px 8px 0 0;
}
.db-cmp-newspaper-header h1 {
  font-size: 20px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 2px;
  margin: 0;
}
.db-cmp-newspaper-header span {
  font-size: 11px;
  color: rgba(255,255,255,0.8);
}
```

比較対象セレクトボックスは赤帯の下に配置（現行位置のまま、ラベルを「比較対象」に変更）。

---

## getStandUrl() について

既存の `getPortraitUrl(id)` と同じパターンで、スタンド画像用の取得関数が必要。
現在のコードでスタンド画像のパス規則を確認し、なければ `getPortraitUrl()` をフォールバックとして使う。

**確認ポイント**: スタンド画像のファイル名パターン（例: `stand_${id}.jpg`）とパス。
存在しない場合は丸アバター+姓のフォールバック表示にする。

---

## 検証

- 100シーズンauto-sim（10 seeds × 10 seasons）でエラーなし確認
- 各パターンの popTail テキストが正しく分岐すること:
  - OVR圧倒 + 人気劣勢 → 「ただし」「一方で」等の逆接
  - OVR圧倒 + 人気も圧倒 → 「人気でもこちらが〜」の順接
  - OVR互角 + 人気互角 → 「人気は互角」
- 3つの対決カードで同じ popTail 文が出ないこと（slotIndex別分岐）
- エース対決の画像が向かい合っていること（左=右向き、右=左向き）
- 全セクションタイトルが日本語であること
- セピアカラーが新聞タブと同系統であること
