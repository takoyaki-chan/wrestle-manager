# 業界底上げイベント — モックアップ＆BGM指示書

## 概要
プレイヤーが業界1位でシーズンを終えると、翌シーズン開幕時に「業界激変」全画面演出が表示される。
この指示書は**チャット側でモックアップHTML+BGMを制作するためのもの**。

---

## 技術仕様（Claude Code側で実装する枠の構造）

### 表示タイミング
- エンディングセレモニー（業界制覇！）の**直後**、新シーズン開始**前**
- 1回だけ表示（永続フラグで管理）

### 使用するHTML要素
```html
<!-- index.html 既存要素 -->
<div class="awards-overlay" id="awardsOverlay">
  <!-- ここに動的にHTMLを差し込む -->
</div>
```

### オーバーレイの仕組み
- `.awards-overlay` → `position:fixed; inset:0; z-index:270`
- `.awards-overlay.active` → 表示（display:flex）
- 中に `#awardsBox`（カード型ボックス、幅320px程度）がデフォルトであるが、**業界底上げイベントは`awardsOverlay`直下に独自のHTMLを丸ごと差し込む**方式

### 実装される関数の骨格
```javascript
function showLeagueElevationCeremony(state, onDone) {
  const overlay = document.getElementById('awardsOverlay');

  // ★ ここにモックアップHTMLを丸ごと差し込む ★
  overlay.innerHTML = `
    <!-- モックアップの中身 -->
  `;

  overlay.classList.add('active');

  // BGM再生（ユーザー操作起点で呼ぶ必要あり → 最初のクリックで開始）
  // Audio.fileBgm.play('../bgm/league_elevation.mp3', { loop: false, volume: 0.10 });

  // 閉じるボタンのハンドラ
  // Audio.fileBgm.fadeOut(1500);
  // overlay.classList.remove('active');
  // overlay.innerHTML = ''; // 後片付け
  // onDone();
}
```

---

## 既存の全画面演出の参考（エンディングセレモニー）

### CSSクラス（使い回し可能なもの）
```css
.awards-overlay { display:none; position:fixed; inset:0; z-index:270; }
.awards-overlay.active { display:flex; }

/* 背景ステージ（暗い紫グラデ + スポットライト） */
.awards-overlay #stage { position:fixed; inset:0; background:radial-gradient(ellipse 80% 60% at 50% 30%, #1a0f2e 0%, #080610 50%, #000 100%); }
.awards-overlay .spotlight { position:absolute; border-radius:50%; filter:blur(80px); opacity:.15; }

/* ボタン */
.awards-btn { ... ゴールド系ボタン }
```

### エンディングのスライド構造（参考用）
```javascript
// スライドごとに awardsBox.innerHTML を差し替える方式
// 「次へ▶」ボタンで window._endingNext() を呼んで進行
// BGMは最初のボタンクリック時に開始（ブラウザの自動再生制限対策）
```

---

## モックアップで決めてほしいこと

### 1. 画面デザイン
- **背景**: エンディングと同じ暗い紫か、赤系（緊張・危機感）か、別の雰囲気か
- **スライド数**: 1画面で完結か、複数スライドか

### 2. 提案: 2スライド構成

**スライド1「業界激変」**
- 暗転 → 大きなテキストで演出
- 候補テキスト:
  - 「⚡ 業界激変」
  - 「あなたの快挙が、業界を変えた——」
  - 「業界が動き出した」
- BGM開始（ボタンクリックで）

**スライド2「各団体の動き」**
- A級団体（名前は `state.aiOrgs.org_a` から取得可能、色 `#6c5ce7`、絵文字 `💫`）
  - 「大型補強を宣言！エース候補の発掘に乗り出す」
- B級団体（名前は `state.aiOrgs.org_b` から取得可能、色 `#00b894`、絵文字 `🌙`）
  - 「育成体制を一新！コーチ陣を大幅強化」
- 締め:「もはや安泰の時代は終わった。真の群雄割拠が始まる——」
- 「続ける▶」で閉じる → BGMフェードアウト

### 3. 利用可能なゲーム内データ（state引数から取れる）
```javascript
state.orgName          // プレイヤー団体名
state.season           // 現在シーズン番号
state.aiOrgs.org_s     // S級団体データ
state.aiOrgs.org_a     // A級団体データ
state.aiOrgs.org_b     // B級団体データ
// RIVAL_ORGS[0].name  // S級団体名（グローバル定数）
// RIVAL_ORGS[1].name  // A級団体名
// RIVAL_ORGS[2].name  // B級団体名
// RIVAL_ORGS[1].emoji  // 💫
// RIVAL_ORGS[2].emoji  // 🌙
// RIVAL_ORGS[1].color  // #6c5ce7
// RIVAL_ORGS[2].color  // #00b894
```

### 4. BGM
- ファイルパス: `../bgm/league_elevation.mp3`（この名前で用意してください）
- 再生方法: `Audio.fileBgm.play(path, { loop: false, volume: 0.10 })`
- フェード: `Audio.fileBgm.fadeOut(1500)`
- 長さ: スライド2枚分なので15-30秒程度で十分
- 雰囲気: 緊張感・変革の予感（エンディングの祝福感とは対照的）

---

## 実装時の差し込みポイント

モックアップが完成したら、Claude Code側で以下を差し込みます:

1. **`overlay.innerHTML = ...`** の中身 → モックアップHTMLで丸ごと差し替え
2. **BGMパス** → 実際のファイル名に差し替え
3. **CSS** → index.htmlの `<style>` に `.league-elev-*` クラスを追加
4. **スライド進行ロジック** → モックアップの構成に合わせてJS修正

---

## 新聞記事（別途実装、参考）

演出の翌週（新シーズン1-2週目）に新聞パネルに最高優先度で表示:
- **見出し**: 「業界再編！ライバル団体が大幅強化」
- **本文**: 業界1位の座を奪取した「（団体名）」の快挙に触発され、ライバル団体が選手強化策とコーチ招聘に乗り出した。A級・B級団体が大型補強に動き、もはや安泰の時代は終わった。真の群雄割拠が始まる——。
