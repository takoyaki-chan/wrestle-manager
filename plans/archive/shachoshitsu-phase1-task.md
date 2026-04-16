# Phase 1: 社長室画面の骨組み — 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 1〜2時間
> **承認状態**: Phase 0（仕様書）完了、Keisuke承認済み
> **前提**: `specs/shachoshitsu-spec-v1.0.md` と `docs/ui/03-screens/shachoshitsu.md` を事前に読むこと

---

## Phase 1 の目的

トップバーに「🏛️ 社長室」タブを追加し、クリックすると社長室画面を表示する。この時点では **見た目だけ** で機能は無い。書類はプレースホルダーで、クリックしても何も起こらない。

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. `CLAUDE.md` — ゲーム開発の原則とルール（UI実装ルールも含む）
2. `docs/ui/01-foundations.md` — Office カテゴリ、CSSトークン体系
3. `docs/ui/02-layouts.md` §2-A Global Chrome, §2-B P3 Dashboard の項
4. `docs/ui/03-screens/shachoshitsu.md` — 社長室の画面仕様（今回の対象）
5. `specs/shachoshitsu-spec-v1.0.md` — システム全体仕様（§1.3, §7, §11 の Phase 1 セクション）

これらを読まずに実装に入ってはいけない。

---

## タスクリスト

### 1. トップバーに社長室タブを追加

**ファイル**: `src/index.html`

**位置**: `nav-bar` の中、スカウトボタンの**直後**

**追加するHTML**:
```html
<button class="nav-btn" onclick="showScreen('shachoshitsu',event)">🏛️ 社長室</button>
```

既存の nav-btn のパターンに完全に揃えること。

**検証**: ゲーム起動時にトップバーに新しいボタンが1つ増えていること。クリックしても遷移はしないが、ボタン自体は表示される。

---

### 2. 社長室画面のDOMコンテナを追加

**ファイル**: `src/index.html`

**位置**: 既存の screen-* コンテナ群（`<div id="screen-week">` など）と並んで追加

**追加するHTML**:
```html
<div id="screen-shachoshitsu" class="screen" style="display:none">
  <div id="shachoshitsuContent"></div>
</div>
```

既存のscreen-*コンテナの構造を参考にして、整合性のある形で追加すること。

---

### 3. showScreen 関数に shachoshitsu 分岐を追加

**ファイル**: `src/ui-common.js`（または `src/app.js`、既存の showScreen 定義箇所）

まず `showScreen` の定義場所を特定する。以下で検索:
```
grep -n "function showScreen\b" src/
```

既存の分岐パターンに従って、`'shachoshitsu'` ケースを追加する。他の画面と同じく:
1. 全 screen を非表示化
2. `screen-shachoshitsu` を表示
3. `renderShachoshitsu()` を呼び出す
4. ナビボタンの active 状態を切り替える
5. 画面タイトルを「社長室」に設定

既存の `'roster'` や `'scout'` 分岐を参考にして、同じパターンで追加すること。

---

### 4. renderShachoshitsu 関数を新規実装

**ファイル**: `src/ui-render.js`

**位置**: 既存の `renderScout()` 関数の近くに追加

**実装要件**:

```javascript
function renderShachoshitsu() {
  const el = document.getElementById('shachoshitsuContent');
  if (!el) return;

  // 1. 現在の季節を判定（春:1-12 / 夏:13-24 / 秋:25-36 / 冬:37-48）
  const season = getShachoshitsuSeasonId(G.week);

  // 2. HTMLを組み立て
  let html = '';

  // 2-1. 社長室HUDバー（日付、資金、印鑑6本）
  html += renderShachoshitsuHud();

  // 2-2. 壁+窓+景色エリア
  html += `<div class="shachoshitsu-wall" style="background-image:url('image/shachoshitsu/wall-window-${season}.webp')"></div>`;

  // 2-3. 机の天板エリア
  html += `<div class="shachoshitsu-desk">`;

  // 2-4. 書類グリッド（4×2のプレースホルダー7枚、Phase 1では全部同じ見た目）
  html += `<div class="shachoshitsu-doc-grid">`;
  const placeholderDocs = [
    {
      id: 'bonus',
      label: 'ボーナス支給願',
      cost: '50万', dp: 1,
      category: 'care', categoryLabel: '選手ケア',
      icon: '💰',
      body: '対象選手に特別手当を支給し、組織貢献への感謝を示す',
      detailText: '特別手当の支給により、信頼関係に揺らぎのある選手の心を繋ぎ止める。額面よりも「見てくれている」という事実が響く。',
      effectSummary: '信頼度 +8〜12(2-3週後に発現)',
      recommendation: '信頼度が60を下回り始めた選手に早期介入するのが効果的。',
    },
    {
      id: 'encourage',
      label: '面談申込書',
      cost: '無料', dp: 0,
      category: 'care', categoryLabel: '選手ケア',
      icon: '💬',
      body: 'スランプ中の選手と対話し、気持ちを立て直す機会を設ける',
      detailText: '社長自ら面談の場を設け、選手の本音に耳を傾ける。コスト0・決裁枠0でスランプ脱出の糸口を掴める気軽な一手。',
      effectSummary: 'スランプ回復モーメンタム + 信頼度微上昇',
      recommendation: 'スランプ/モチベ低下の初期段階で真っ先に使いたい。',
    },
    {
      id: 'refresh_leave',
      label: '休暇辞令',
      cost: '100万', dp: 1,
      category: 'care', categoryLabel: '選手ケア',
      icon: '🏖️',
      body: '心身の疲弊を察し、一定期間の休養を与える',
      detailText: '数週間の休養を正式な辞令として発行。強制的に現場から離脱させることで、心身を根本から回復させる重い一手。',
      effectSummary: 'スランプ強力回復 + condition回復 + 信頼度上昇',
      recommendation: '面談では効果が薄い重症スランプに対する切り札。クールダウン4週に注意。',
    },
    {
      id: 'party',
      label: '慰労会開催届',
      cost: '15万×人数', dp: 1,
      category: 'care', categoryLabel: '選手ケア',
      icon: '🍻',
      body: '団体の雰囲気を立て直すべく、慰労の宴席を設ける',
      detailText: '全選手を集めた慰労の宴席。個別の数値を動かすより、ロッカールームの空気そのものを立て直すのが主目的。',
      effectSummary: '全員信頼度微上昇 + ロッカールームmorale回復',
      recommendation: 'moraleが50を下回ったときの応急処置として。',
    },
    {
      id: 'trainer',
      label: '専属トレーナー手配書',
      cost: '160万', dp: 2,
      category: 'growth', categoryLabel: '育成',
      icon: '💪',
      body: '対象選手の成長を加速させるため、外部専属トレーナーを招聘する',
      detailText: '外部の専属トレーナーを期間限定で招聘。短期集中で成長曲線を押し上げる、育成特化の投資型書類。',
      effectSummary: '4週間 成長速度+30% + 信頼度上昇',
      recommendation: '伸ばしたい若手、シリーズ前の追い込み期、昇格を狙う選手に。',
    },
    {
      id: 'camp',
      label: '合宿実施手配書',
      cost: '40万×人数', dp: 3,
      category: 'growth', categoryLabel: '育成',
      icon: '🏕️',
      body: '全選手を集中的に強化するため、合宿を実施する',
      detailText: '選手全員を合宿地へ送り込み、短期集中で基礎を鍛え直す。単価40万×人数と決裁枠3の重量級書類。',
      effectSummary: '2週間 全員成長速度+50% + 全員信頼度微上昇',
      recommendation: '資金に余裕があり、オフシーズンに全体を底上げしたいとき。',
    },
    {
      id: 'media',
      label: 'メディア露出手配書',
      cost: '120万', dp: 2,
      category: 'pr', categoryLabel: '広報',
      icon: '📺',
      body: '対象選手を広告塔とし、団体の知名度向上を図る',
      detailText: '対象選手をメディア露出の広告塔として起用。団体の知名度向上と本人のコンディション維持を両立させる外向き施策。',
      effectSummary: 'orgPop +0.4 + 対象選手 condition+5 + 信頼度上昇',
      recommendation: '団体人気20以上が前提。看板選手のコンディション管理と兼ねて。',
    },
  ];

  placeholderDocs.forEach(doc => {
    html += `
      <div class="shachoshitsu-doc" data-doc-id="${doc.id}" data-category="${doc.category}">
        <div class="shachoshitsu-doc-tag">${doc.categoryLabel}</div>
        <div class="shachoshitsu-doc-icon">${doc.icon}</div>
        <div class="shachoshitsu-doc-title">${doc.label}</div>
        <div class="shachoshitsu-doc-body">${doc.body}</div>
        <div class="shachoshitsu-doc-cost">${doc.cost} / 決裁⚡${doc.dp}</div>
        <div class="shachoshitsu-doc-tooltip">
          <div class="tooltip-section">
            <div class="tooltip-label">詳細</div>
            <div class="tooltip-text">${doc.detailText}</div>
          </div>
          <div class="tooltip-section">
            <div class="tooltip-label">効果</div>
            <div class="tooltip-text">${doc.effectSummary}</div>
          </div>
          <div class="tooltip-section">
            <div class="tooltip-label">使いどころ</div>
            <div class="tooltip-text">${doc.recommendation}</div>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`; // doc-grid
  html += `</div>`; // desk

  el.innerHTML = html;
}

// 季節ID取得ヘルパー
function getShachoshitsuSeasonId(week) {
  if (week <= 12) return 'spring';
  if (week <= 24) return 'summer';
  if (week <= 36) return 'autumn';
  return 'winter';
}

// HUD描画ヘルパー
function renderShachoshitsuHud() {
  // Phase 1では印鑑は全部立っている状態（機能なし）
  const dp = 6; // 固定値（Phase 2で動的にする）
  const dpMax = 6;
  let hankos = '';
  for (let i = 0; i < dpMax; i++) {
    const cls = i < dp ? 'hanko available' : 'hanko used';
    hankos += `<img class="${cls}" src="image/shachoshitsu/hanko.webp" alt="決裁枠">`;
  }

  return `
    <div class="shachoshitsu-hud">
      <div class="shachoshitsu-hud-left">
        <span class="shachoshitsu-hud-date">${Engine.util.formatDate(G.season, G.week)}</span>
        <span class="shachoshitsu-hud-funds">資金 ${Math.round(G.funds).toLocaleString()}万</span>
      </div>
      <div class="shachoshitsu-hud-right">
        <div class="shachoshitsu-hankos">${hankos}</div>
      </div>
    </div>
  `;
}
```

**注意事項**:
- 上記のコードはあくまで実装の骨格例。既存コードのパターン（文字列結合の方法、ヘルパー関数の命名規則など）に合わせて調整すること
- `Engine.util.formatDate` が既存で存在するか確認し、しなければ別の方法で日付表示
- Phase 1 のプレースホルダー段階から書類本文・アイコン・ツールチップ内容を同梱している。Phase 3 で `DECISION_DOCS` 本体に置き換える際、このプレースホルダーがそのまま正仕様と整合するようにしてある

---

### 5. CSS の追加

**ファイル**: `src/index.html`（既存のCSSは `<style>` タグ内にある）

**位置**: 既存のCSS定義の末尾、ケアモーダル関連CSSの近くに追加

**追加するCSS**:

```css
/* ========================================
   社長室（Phase 1）
   ======================================== */

/* スクリーンコンテナ: 画面いっぱいに広がる */
#screen-shachoshitsu {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 100px); /* トップバー等を除いた高さ */
  overflow: hidden;
}

/* HUD バー */
.shachoshitsu-hud {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--shachoshitsu-hud-bg);
  border-bottom: 1px solid var(--shachoshitsu-hud-border);
  height: 60px;
  box-sizing: border-box;
}

.shachoshitsu-hud-left {
  display: flex;
  align-items: center;
  gap: 24px;
  font-family: 'Oswald', sans-serif;
  color: var(--text-main);
}

.shachoshitsu-hud-date {
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--gold);
}

.shachoshitsu-hud-funds {
  font-size: 14px;
  color: var(--text-sub);
}

.shachoshitsu-hud-right {
  display: flex;
  align-items: center;
}

.shachoshitsu-hankos {
  display: flex;
  gap: 8px;
  align-items: center;
}

.hanko {
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;
}

.hanko.available {
  filter: drop-shadow(0 0 6px var(--shachoshitsu-hanko-glow));
}

.hanko.used {
  transform: rotate(90deg) translateY(6px);
  filter: grayscale(1);
  opacity: 0.4;
}

/* 壁+窓+景色エリア */
.shachoshitsu-wall {
  position: relative;
  width: 100%;
  height: 400px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* HUDの下から始まる想定 */
  margin-top: -60px; /* HUDと重ねて壁の上部が見えないように */
  padding-top: 60px;
}

/* 机の天板エリア */
.shachoshitsu-desk {
  position: relative;
  width: 100%;
  min-height: 720px;
  background-image: url('image/shachoshitsu/desk.webp');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  margin-top: -60px; /* 壁と重ねて馴染ませる */
  padding: 80px 0 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* 書類グリッド */
.shachoshitsu-doc-grid {
  display: grid;
  grid-template-columns: repeat(4, 240px);
  gap: 20px;
  max-width: 1020px;
  margin: 0 auto;
}

/* 書類パネル */
.shachoshitsu-doc {
  width: 240px;
  height: 320px;
  background-image: url('image/shachoshitsu/document-blank.webp');
  background-size: cover;
  background-position: center;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
  padding: 24px 20px;
  box-sizing: border-box;
  color: var(--office-text-on-cream-main, #1e1c16);
  font-family: 'Noto Sans JP', sans-serif;
}

.shachoshitsu-doc:hover {
  transform: translateY(-4px);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
}

/* 左上カテゴリタグ */
.shachoshitsu-doc-tag {
  position: absolute;
  top: 14px;
  left: 14px;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(30, 28, 22, 0.2);
  color: var(--office-text-on-cream-sub, #5a5244);
  letter-spacing: 1px;
  border-radius: 2px;
}

/* 中央絵文字アイコン */
.shachoshitsu-doc-icon {
  font-size: 34px;
  line-height: 1;
  text-align: center;
  margin-top: 36px;
  /* 絵文字は環境フォントで描画。ズレ補正用の余白は下の title 側で取る */
}

.shachoshitsu-doc-title {
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  margin-top: 14px;
  letter-spacing: 1px;
}

.shachoshitsu-doc-body {
  font-size: 11px;
  color: var(--office-text-on-cream-sub, #5a5244);
  line-height: 1.5;
  margin-top: 12px;
  padding: 0 12px;
  text-align: center;
}

.shachoshitsu-doc-cost {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: var(--shachoshitsu-vermillion);
  font-weight: 700;
  font-family: 'Oswald', sans-serif;
}

/* ========================================
   ホバー詳細ツールチップ
   ======================================== */
.shachoshitsu-doc-tooltip {
  position: absolute;
  top: 0;
  left: calc(100% + 12px);
  width: 280px;
  padding: 16px;
  background: rgba(24, 22, 20, 0.95);
  border: 1px solid rgba(212, 168, 67, 0.5);
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  color: #f0ece0;
  font-family: 'Noto Sans JP', sans-serif;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  transition-delay: 0s;
  z-index: 100;
}

/* ホバー開始から 0.3s 遅延して表示 */
.shachoshitsu-doc:hover .shachoshitsu-doc-tooltip {
  opacity: 1;
  transition-delay: 0.3s;
}

/* グリッド右端2列（3,4,7,8 枚目）は左側反転表示 */
.shachoshitsu-doc-grid .shachoshitsu-doc:nth-child(4n) .shachoshitsu-doc-tooltip,
.shachoshitsu-doc-grid .shachoshitsu-doc:nth-child(4n-1) .shachoshitsu-doc-tooltip {
  left: auto;
  right: calc(100% + 12px);
}

/* 無効化状態では詳細ツールチップを出さない */
.shachoshitsu-doc.is-disabled:hover .shachoshitsu-doc-tooltip,
.shachoshitsu-doc.is-approved:hover .shachoshitsu-doc-tooltip {
  opacity: 0;
}

.shachoshitsu-doc-tooltip .tooltip-section {
  margin-bottom: 12px;
}
.shachoshitsu-doc-tooltip .tooltip-section:last-child {
  margin-bottom: 0;
}

.shachoshitsu-doc-tooltip .tooltip-label {
  font-size: 10px;
  font-weight: 700;
  color: #d4a843;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.shachoshitsu-doc-tooltip .tooltip-text {
  font-size: 12px;
  line-height: 1.6;
  color: #f0ece0;
}

/* CSS変数の定義（まだ存在しなければ追加） */
:root {
  --shachoshitsu-hud-bg: rgba(24, 22, 20, 0.92);
  --shachoshitsu-hud-border: rgba(212, 168, 67, 0.4);
  --shachoshitsu-vermillion: #c00000;
  --shachoshitsu-vermillion-dim: #a02020;
  --shachoshitsu-hanko-glow: rgba(255, 200, 100, 0.4);
}
```

**重要**: 既存のCSSと変数名が衝突しないようにすること。`--shachoshitsu-*` プレフィックスは新規追加で、既存のOfficeトークンは変更しない。

---

### 6. 動作確認

以下を手動で確認する（ユーザーに確認を依頼してもよい）:

1. ゲームを起動
2. トップバーに「🏛️ 社長室」タブが表示されている
3. タブをクリックすると社長室画面に遷移する
4. 画面上部にHUDバー（日付・資金・印鑑6個）が表示される
5. その下に壁+窓+景色の画像が表示される（現在の週の季節に対応）
6. その下に机の画像が表示される
7. 机の上に7枚の書類プレースホルダーが4×3グリッドで並ぶ
8. 書類にホバーすると少し浮き上がる
9. 書類をクリックしても何も起こらない（Phase 1では機能なしで正常）
10. 別のタブに切り替えると社長室画面が消える
11. **既存のケアモーダル（💝 ケアボタン）は壊れておらず、今まで通り動作する**

---

### 7. validateGameState への影響確認

仕様書で `G.decisionPoints` などの新フィールドを定義しているが、**Phase 1 ではまだ追加しない**。Phase 2 で追加する。Phase 1 ではあくまで見た目だけ。

既存の `Engine.validateGameState(G)` が Phase 1 の変更で違反を出さないことを確認すること。

---

## 完了の定義

- [ ] トップバーに「🏛️ 社長室」タブが追加されている
- [ ] タブクリックで社長室画面に遷移する
- [ ] HUDバーが表示される
- [ ] 壁+窓+景色画像が季節に応じて切り替わる
- [ ] 机画像と書類プレースホルダー7枚が表示される
- [ ] 書類のホバーが動作する
- [ ] 既存のケアモーダルが壊れていない
- [ ] 既存のscreen遷移（週次画面、興行準備、団体、スカウト、ランキング等）が壊れていない
- [ ] `Engine.validateGameState(G)` が違反を出さない
- [ ] ハードコード16進色を使っていない（CSS変数経由）

---

## 完了時のコミット

完了したら以下のコミットメッセージでローカルコミット:

```
feat(shachoshitsu): Phase 1 - 社長室画面の骨組み

- トップバーに「🏛️ 社長室」タブを追加
- 社長室画面の基本構造を実装（HUD / 壁+窓 / 机 / 書類グリッド）
- 季節に応じた壁画像の切り替え（春夏秋冬）
- 書類プレースホルダー7枚を表示（機能なし）
- 社長室用CSS変数を追加

仕様: specs/shachoshitsu-spec-v1.0.md
画面仕様: docs/ui/03-screens/shachoshitsu.md
```

**push はしない**（Keisukeさんが判断）。

---

## Phase 1 完了後の次のステップ

Phase 1 の動作確認がKeisukeさんに承認されたら、Phase 2 に進む。Phase 2 は `G.decisionPoints` を追加してHUDを動的にする作業。

---

## 禁止事項（再掲）

- ❌ 既存のケアモーダルを壊さない
- ❌ ハードコード16進色の使用
- ❌ ピンク・マゼンタ色の使用
- ❌ 「ケア」という言葉の新規追加
- ❌ 仕様書に書かれていない機能の勝手な追加
- ❌ Phase 2 以降の作業の先取り（決裁枠の動的化、書類のクリック処理、etc）

---

## トラブルシュート

### 画像が表示されない
- ファイルパスが正しいか確認: `image/shachoshitsu/wall-window-spring.webp` など
- ファイルが実際に存在するか確認: `ls image/shachoshitsu/`
- ブラウザのDevToolsでネットワークタブを確認して、404が出ていないか

### タブをクリックしても遷移しない
- `showScreen` 関数の分岐に `'shachoshitsu'` を追加したか
- `screen-shachoshitsu` というidのdivが存在するか
- 他のscreen-*が消えるロジックが正しく動いているか

### CSS変数が効かない
- `:root` 定義が読み込まれているか
- 既存の `--*` 変数と衝突していないか

### 書類の位置がずれる
- `.shachoshitsu-desk` の flex 設定を確認
- `.shachoshitsu-doc-grid` の grid-template-columns を確認
- 画面幅による伸縮を確認

---

以上、Phase 1 実装指示書終わり。
