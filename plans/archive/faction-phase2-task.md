# Phase 2: 派閥システム UI 実装 — 実装指示書

> **対象**: Claude Code
> **所要時間目安**: 4〜7時間
> **承認状態**: 設計合意済み（`specs/faction-system-spec-v0.1.md` §7）
> **前提コミット**: `64598d9`（Phase 1 完了）以降、ブランチ `feature/faction-system` 在籍
> **目的**: Phase 1 で稼働しているバックエンド（`G.factions` / `G.factionHostility` / `calcMatchAppeal` の factionAppeal 分岐）の状態を、プレイヤーが**見える**ようにする

---

## Phase 2 の目的

Phase 1 で派閥データ・対立度・勢い・派閥抗争 appeal はすでに正しく動いている。しかし現状プレイヤーには**コンソールログでしか派閥の存在が確認できない**。実プレイセーブ（13年目 Y13W24）ですでに「梅ヶ丘みのり組」が成立しているにもかかわらず、UI 上はどこにも表示されていない状態。

Phase 2 では、この「見えない派閥」を4つの UI ポイントで可視化する:

1. データベース画面に「🎭 派閥」サブタブを追加し、現在の派閥を一覧できるようにする
2. 選手ポップアップに派閥バッジを出し、どの選手がどの派閥に属しているか一目でわかるようにする
3. 相関図（🔗 相関図）に派閥レイヤーを乗せ、派閥クラスタと対立関係を視覚化する
4. 興行準備画面のカードに「🏴vs🏴」バッジを出し、派閥抗争マッチが集客に効いていることを示す

**この段階では演出イベント（F01〜F08 モーダル、派閥絡みのセリフ）はまだ作らない**。それは Phase 3/4 の範疇。Phase 2 は「数値が見える化されるだけ」で完結する。

---

## Phase 2 で実装するもの

1. データベースタブに新サブタブ「🎭 派閥」を追加（loyal / rivalrous 別セクション表示）
2. 選手ポップアップへの派閥バッジ（リーダー／幹部／メンバー区別、クリックで派閥タブへ遷移）
3. 相関図 `_renderDbRelmap` への派閥レイヤー描画（同派閥を radialGradient ゾーンで囲む＋ rivalrous 間をオレンジ破線で接続）
4. `renderShowPrep` カードへの「🏴vs🏴」バッジ（`Engine.factions.isFactionFeudMatch` が true の試合のみ）
5. `docs/ui/01-foundations.md` / `02-layouts.md` 準拠の CSS トークン運用（ハードコード色禁止）

**Phase 2 で実装しないもの**:

- F01/F02/F04〜F08 の演出モーダル・セリフ（Phase 3/4）
- F03 の継承演出（Phase 3）
- 派閥絡みの bond 変動カタログ・セリフデータ（Phase 3/4）
- データベースタブを 3 グループ（個人／関係／記録）に再編するリデザイン（spec §7.2）— Phase 2 では既存サブタブの並びに「🎭 派閥」を**1枚追加するだけ**に留める。3グループ再編は情報設計の合意が取れてから別フェーズで扱う

---

## 事前に必ず読むべきドキュメント

この順序で読むこと:

1. **CLAUDE.md** — アーキテクチャ5原則、UI実装ルール、やらないことリスト
2. **`docs/ui/01-foundations.md`** — カテゴリ／CSSトークン／設計原則（**ハードコード色は絶対禁止**）
3. **`docs/ui/02-layouts.md`** — レイアウトパターン（P1〜P7）、シーケンス（S1〜S7）
4. **`specs/faction-system-spec-v0.1.md`** — 特に §7（UI仕様）、§1（データモデル）、§17（Phase 1 実装状況）
5. **`src/factions.js`** — Phase 1 で作成済みの Engine.factions 全関数（`getMomentumLabel` / `getHostilityLabel` / `getSolidarityLabel` / `isFactionFeudMatch` / `isLeader` / `isExecutive` などヘルパーが既にある前提で UI から呼ぶ）
6. **`src/ui-render.js` §renderDatabase 周辺（L5178〜L5235）** — サブタブ切替の仕組み
7. **`src/ui-render.js` §_renderDbRelmap 周辺** — 相関図フォースシミュレーション（派閥レイヤーを重ねる対象）
8. **`src/ui-render.js` §renderShowPrep（L2129〜、カードタグ L2517〜）** — バッジ追加箇所
9. **`src/ui-common.js` §showFighterPopup（L2273〜）** — 選手ポップアップ構造、バッジ差し込み位置

---

## 既存コードの影響範囲

### 変更するファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/ui-render.js` | `_dbSubTab` コメント更新、サブタブボタン追加、`_renderDbFactions` 新設、`_renderDbRelmap` に派閥レイヤー重ね描き、`renderShowPrep` カードに派閥バッジ追加 |
| `src/ui-common.js` | `showFighterPopup` の名前行直下に派閥バッジを差し込み、クリックで DB 派閥タブへ遷移する `openFactionPanel(factionId)` を新規追加 |
| `src/index.html` | `<style>` セクションに派閥パネル／バッジ／メーター用の CSS を追加（全てトークン経由） |

### 触ってはいけない既存コード

- `src/factions.js` の関数シグネチャ・内部ロジック — Phase 1 で完成済み、UI からは**読むだけ**
- `src/management.js` の tickWeek / calcMatchAppeal の派閥関連分岐 — Phase 1 で完成済み
- 既存サブタブ（全選手 / 全コーチ / 団体比較 / 殿堂 / 相関図 / 新聞 / 年代記）の HTML 構造 — 新サブタブを**末尾に追加**する形で既存を崩さない
- `_renderDbRelmap` のフォースシミュレーション本体 — ノード・リンク計算は触らず、**描画結果の下レイヤー**に派閥ゾーンを重ねる

---

## アーキテクチャ5原則の遵守

1. **Engine純粋関数**: UI 側では `Engine.factions.*` を**読み取り専用**で呼ぶ。Phase 2 で新たな Engine 関数は作らない（必要なヘルパーは Phase 1 ですべて揃っている前提。足りなければまず `src/factions.js` に追加してから呼ぶ）
2. **GameState返却値更新**: UI から `G.factions` を直接書き換えない。Phase 2 はそもそも書き換える処理を持たない（閲覧のみ）
3. **UIはGameStateを直接変更しない**: 徹底する
4. **乱数シード管理**: UI に乱数は使わない
5. **tickWeek統合パイプライン**: UI 変更のみなので tickWeek には触らない

---

## UI 実装ルールの遵守（最重要）

CLAUDE.md「UI 実装ルール」節を必ず守ること:

- **ハードコード16進カラー禁止**。色は必ず `var(--*)` トークン経由。派閥ごとの識別色もトークン配色を派生させる（後述）
- **カテゴリの混同禁止**。データベースタブは Office カテゴリ。Office のクリーム基調を貫く
- **シーケンス内のビジュアル一貫性**。データベースの他サブタブ（殿堂・年代記・新聞）のカード／セクションと揃える
- 派閥カラー割当が必要な場合、トークン `--accent-faction-1`〜`--accent-faction-4` のような形で `docs/ui/01-foundations.md` 側に先に追加してから使う（prefix `--accent-` は既存の命名流儀に沿わせる）。ハードコードで `#e74c3c` 等を直に書かない

---

## 実装タスクリスト

### Task 1: 派閥サブタブの土台（1時間）

#### 1-1. `_dbSubTab` の拡張

`src/ui-render.js` L5121 のコメント `0=全選手 1=全コーチ 2=団体比較 3=殿堂 4=相関図 5=新聞 6=年代記` を更新し、末尾に `7=派閥` を追加。

サブタブボタン配列（L5195 付近）に `{ idx: 7, label: '🎭 派閥' }` を追加。

`renderDatabase` の分岐（L5205〜）に `else if (_dbSubTab === 7) html += _renderDbFactions();` を追加。

#### 1-2. `_renderDbFactions()` の新設

`src/ui-render.js` 末尾付近（`_renderDbChronicle` の近く）に新関数を追加。責務は以下のみ:

- `G.factions` が空なら「現在、派閥は存在しません」の Empty State を返す（派閥成立の目安条件を一言添える: ロスター11人以上＋リーダー候補からの bond 60+ のフォロワーが2人以上）
- 派閥が存在する場合、`type` フィールドで loyal / rivalrous に振り分けてセクション分け描画
  - **忠誠型セクション（🎭 忠誠型派閥）**: 勢い概念なし。結束帯のみ表示
  - **対立型セクション（⚔ 対立型派閥）**: 勢い帯 + 対立関係（相手派閥名＋対立度フレーバー）を表示

#### 1-3. 派閥カードのレイアウト

各派閥カードの中身:

```
┌─ 梅ヶ丘みのり組 ──── [authoritativeTag が立っていれば「👑 権威型」バッジ] ─┐
│ [リーダー顔 64px]  ← clickable → showFighterPopup(leaderId)
│ [幹部顔 48px × 最大2] [その他メンバー顔 32px × 残り]
│ 結束: 強固 / 揺らぎ / 崩壊寸前  （Engine.factions.getSolidarityLabel）
│ 勢い: 隆盛 / 上昇 / 平常 / 陰り / 衰退  （対立型のみ、getMomentumLabel）
│ 対立: △△組と泥沼状態  （対立型かつ相手派閥がある場合、getHostilityLabel）
└──────────────────────────────────────────┘
```

**数値は一切表示しない**。spec §1.3 / §7.1 に従いフレーバーテキストのみ。これは CLAUDE.md「数値の丸見せによるスプレッドシートゲーム化」禁止と整合。

顔画像は既存 `getUpperUrl(c)` / `getStandUrl(c)` ヘルパーを使う（ui-render.js 内の他カードと同じ流儀）。

#### 1-4. CSS

`src/index.html` の `<style>` に以下を追加（全てトークン経由）:

- `.db-faction-card` — Cream Panel 基調（01-foundations Office カテゴリに従う）
- `.db-faction-card.is-rivalrous` — 対立型は border アクセント色を変える（token）
- `.db-faction-leader` / `.db-faction-members` — 顔アイコンのサイズと並び
- `.db-faction-meter` — 結束／勢い／対立の帯ラベル（数値バーではなくフレーバーテキスト＋アイコン）

---

### Task 2: 選手ポップアップの派閥バッジ（45分）

#### 2-1. バッジの差し込み

`src/ui-common.js` `showFighterPopup` 内、選手名表示行の直下（L2450 付近、既存の「🔗 相関図」ボタンの近く）に派閥バッジを追加:

```javascript
const faction = G.factions && Engine.factions.getFactionByFighterId(G, c.id);
if (faction) {
  const role = faction.leaderId === c.id ? 'リーダー'
             : faction.executiveIds?.includes(c.id) ? '幹部'
             : 'メンバー';
  // バッジHTML: 「🎭 梅ヶ丘みのり組・リーダー」をクリッカブルで
}
```

#### 2-2. クリック遷移

バッジクリックで `openFactionPanel(factionId)` を呼び、以下を実行:

- 現在のポップアップを閉じる（`closeFighterPopup()`）
- `showScreen('database')`
- `_dbSubTab = 7` にセット
- `renderDatabase()`
- 再描画後、`faction-card-${factionId}` の要素にスクロール＆1.5秒ハイライト（`.faction-highlight` クラス付与→CSSアニメ→自動除去）

`openFactionPanel` は `src/ui-common.js` に新規追加し、`window.openFactionPanel = openFactionPanel` で公開（他の同系ヘルパーと同じ流儀）。

#### 2-3. 無派閥時

派閥に所属していない選手には**バッジを出さない**（spec §7.5「無派閥: 中立または表示なし」→ 表示なしを採用）。「中立」と出すとむしろ派閥ゲームっぽさが強調されて違和感が出るため。

---

### Task 3: 相関図の派閥レイヤー（1.5時間）

#### 3-1. 下レイヤーに派閥ゾーンを描画

`_renderDbRelmap` の SVG ルートに、既存のリンク・ノードより**前**（背面）に `<g class="rm-faction-layer">` を挿入。フォースシミュレーションのノード位置が確定したタイミング（既存 tick / onEnd のどちらか、既存コードに合わせる）で以下を描画:

- 各派閥について、メンバーノードの座標群から**凸包（convex hull）** または**重心+最大半径の円**を計算
  - Phase 2 の MVP としては**円（重心＋最大半径＋padding 24px）**で十分。凸包は実装コストが見合わない
- その円を `radialGradient`（中心を派閥識別色＋opacity 0.18 → 外縁 opacity 0）で塗る
- `<text>` で派閥名を円の上端に配置（トークン色、font-size 12px、opacity 0.5）
- リーダーノードの右上に王冠絵文字 👑（`<text>`）、幹部ノードの右上に星 ⭐ をオーバーレイ

#### 3-2. rivalrous 派閥間のオレンジ破線

`G.factionHostility` を走査し、両方向のうち `>= 40` のキーについて、両派閥の重心同士を `<line stroke="var(--accent-hostility)" stroke-dasharray="6,4">` で結ぶ。線の太さは対立度で 1.5〜3.5px に線形マップ。**数値ラベルは付けない**（spec §7.4「太さ＝対立度、ただし数値は出さない」）。

#### 3-3. 派閥識別色の割当

派閥 ID 順に `--accent-faction-1` 〜 `--accent-faction-4` を巡回使用（5個目以降の派閥はまず発生しない想定だが、念のため mod で循環）。`--accent-faction-*` トークンは `docs/ui/01-foundations.md` と `index.html` の `:root` に**先に追加**すること。

#### 3-4. 既存の相関図描画への影響ゼロ

- ノード位置計算・リンク描画・ドラッグ・ズーム・比較ポップアップ、いずれも**触らない**
- 派閥レイヤーは `<g>` を挿入するだけで、既存 SVG のイベントリスナーに干渉しない位置に置く
- `G.factions` が空なら派閥レイヤー `<g>` 自体を生成しない（early return）

---

### Task 4: 試合前プレビューの「🏴vs🏴」バッジ（30分）

#### 4-1. `renderShowPrep` カードにバッジ追加

`src/ui-render.js` L2517〜（`tagParts` 配列構築箇所）に追加:

```javascript
const isFactionFeud = (curL > 0 && curR > 0 && G.factions && G.factions.length > 0)
  && Engine.factions.isFactionFeudMatch(G, curL, curR);
if (isFactionFeud) {
  // 両派閥名を引いて「🏴梅ヶ丘組 vs 向ヶ丘組」バッジを表示
  tagParts.push(`<span class="sp-match-tag sp-tag-faction">🏴vs🏴 派閥抗争</span>`);
}
```

バッジ順序は既存の rivalry バッジの**直前**（因縁系タグが並ぶ位置）に挿入する。

#### 4-2. CSS

`.sp-tag-faction` を既存 `.sp-tag-rivalry` と並ぶスタイルで追加。識別色は `--accent-faction-1` などのトークンに依存せず、rivalry と区別できる中間色を使う（例: `--accent-faction-feud` を 01-foundations に追加してから参照）。

#### 4-3. 集客力内訳への影響

L2533〜の「集客力内訳」ブロック（`Engine.attendanceV2.calcMatchAppealBreakdown` を呼ぶ箇所）は**そのまま**。Phase 1 で `calcMatchAppeal` が factionAppeal を正しく計算して合計値に含めているので、breakdown にも自然に反映されるはず。もし内訳で「派閥抗争」行が出ていなければ、breakdown 返却形式を確認し、rivalry 行と並ぶ形で `factionAppeal` 行を出すよう breakdown 側だけ調整する（これは UI 層の補修扱いで、engine ロジックは触らない）。

---

### Task 5: `docs/ui/01-foundations.md` へのトークン追加（15分）

以下の色トークンを `:root` と docs に追加:

- `--accent-faction-1`, `--accent-faction-2`, `--accent-faction-3`, `--accent-faction-4` — 派閥識別色（彩度を抑えた4色、Office/Stage どちらでも使える中間色）
- `--accent-hostility` — 対立度を示すオレンジ系（破線・対立バッジ用）
- `--accent-faction-feud` — 試合カード内「🏴vs🏴」バッジ用

これらを定義してから、CSS コード上で `#xxxxxx` の直書きを絶対にしない。

---

### Task 6: 実プレイ確認（30分）

ビルドは不要（HTML 直接読み込み）。ブラウザで `index.html` を開き、以下を手動確認（Keisuke に委任）:

**シナリオ A: 既存の13年目セーブ（派閥「梅ヶ丘みのり組」成立済み）をロード**

1. データベース → 🎭 派閥タブ → 「梅ヶ丘みのり組」カードが忠誠型セクションに表示される
2. リーダー顔クリック → 選手ポップアップが開き、名前下に「🎭 梅ヶ丘みのり組・リーダー」バッジが出る
3. バッジクリック → 派閥タブへ戻り、該当カードが1.5秒ハイライトされる
4. データベース → 🔗 相関図 → 派閥メンバー3名が円形ゾーンで囲まれ、リーダーに👑、幹部に⭐が出る
5. 興行準備画面 → 派閥メンバー同士のカードを組んでも、**この派閥は単独なので「🏴vs🏴」バッジは出ない**（対立相手不在）

**シナリオ B: 新規ゲームから auto-sim 相当のセーブを作って対立型を発生させる**

実機で対立型を狙って作るのは大変なので、このシナリオは Keisuke が手元で試すのは任意。auto-sim ログで対立型派閥が成立するシードを特定できたら、そのセーブを手動生成して上記5点を対立型で再確認できると完璧。

---

### Task 7: auto-sim 検証（最小限）（10分）

Phase 2 は UI のみ変更で試合数値・派閥ロジックには触らないため、`feedback_auto_sim_ui_only.md`（memory）に従い、auto-sim は**最小限**に留める:

```bash
node test/auto-sim.js 20 42
```

1シード × 20シーズン（UI 無関係のため、Phase 1 で担保済みの派閥ロジック不変を再確認する目的のみ）。ALL CLEAR を1回確認できれば十分。違反が出た場合は UI 変更が意図せず engine を壊していないかを疑い、`git diff src/factions.js src/management.js` で変更が混入していないかを確認する。

---

## 完了時のチェックリスト

### 機能

- [ ] データベースに「🎭 派閥」サブタブが表示される（`_dbSubTab=7`）
- [ ] 派閥0件時は Empty State、派閥が存在すると type 別セクションで一覧される
- [ ] リーダー顔／幹部顔／メンバー顔が階層表示され、顔クリックで選手ポップアップが開く
- [ ] 選手ポップアップの名前下に派閥バッジが出る（無派閥は表示なし）
- [ ] 派閥バッジクリックで派閥タブへ遷移しハイライトされる
- [ ] 相関図に派閥ゾーン（radialGradient 円）が描画される
- [ ] rivalrous 派閥間にオレンジ破線が引かれる（数値ラベルなし）
- [ ] 興行準備のカードに「🏴vs🏴」バッジが出る（`isFactionFeudMatch === true` の試合のみ）
- [ ] 派閥が空のゲーム／無派閥選手では、派閥系 UI が**一切出ない**（ノイズなし）

### 品質

- [ ] `src/` 配下に `#` 始まりのハードコード色が新規追加されていない（`git diff | grep -E "^\+.*#[0-9a-fA-F]{6}"` で確認）
- [ ] 追加した CSS はすべて `var(--*)` トークン参照
- [ ] 01-foundations.md に `--accent-faction-*` / `--accent-hostility` / `--accent-faction-feud` トークンが記載されている
- [ ] `Engine.factions.*` の関数シグネチャに変更なし（UI から呼ぶだけ）
- [ ] `G.factions` を UI から直接書き換える箇所がない

### 影響確認（非変更）

- [ ] 既存のデータベース他サブタブ（全選手・全コーチ・団体比較・殿堂・相関図・新聞・年代記）の表示・挙動が変わっていない
- [ ] 既存の選手ポップアップの他セクション（ステータス・経歴・相関）が変わっていない
- [ ] 既存の相関図フォースシミュレーション・ドラッグ・ズーム・比較ポップアップが変わっていない
- [ ] 既存の興行準備カードタグ（🏆 / 🔥 / ✨ / 📣 / 🌅）の表示順・挙動が変わっていない
- [ ] auto-sim 1シード × 20シーズン ALL CLEAR

---

## 完了報告時に Keisuke に伝えること

実装完了時、以下を報告:

1. **変更ファイル一覧**: `src/ui-render.js` / `src/ui-common.js` / `src/index.html` / `docs/ui/01-foundations.md` の4点に収まっているか
2. **追加した CSS トークン**: `--accent-faction-1`〜4 / `--accent-hostility` / `--accent-faction-feud` の定義値
3. **シナリオ A の手動確認結果**: 13年目セーブで「梅ヶ丘みのり組」がどのように見えたか（スクリーンショットではなく画面・操作・表示ポイントの列挙で、Keisuke が追体験できるレベルで）
4. **確認してほしい画面・操作・表示**（Keisuke に委任する検証項目）:
   - 🎭 派閥タブの開閉、カード表示崩れの有無
   - 選手ポップアップ → 派閥バッジ → DB 派閥タブの導線
   - 相関図で派閥ゾーンが他の要素と重なったときの視認性
   - 派閥抗争マッチを組んだときの「🏴vs🏴」バッジ点灯
5. **auto-sim 結果**: 1シード × 20シーズンの ALL CLEAR 確認

---

## specs/ の更新フロー

実装完了後、以下を実行:

1. `specs/faction-system-spec-v0.1.md` §17 の「Phase 2（UI）に延期」ブロックを「Phase 2 完了」に書き換え、実装内容（DB派閥タブ / 選手ポップアップバッジ / 相関図レイヤー / 試合カードバッジ）を箇条書きで記録
2. spec §15 オープン項目のうち、§7.3（派閥比較サブタブの具体デザイン）は Phase 2 で MVP 版として確定したため、残っているオープン事項（2派閥対置の詳細 UI）を明示的に「Phase 3 以降で検討」にマーク
3. `docs/game-system-roadmap.md` に Phase 2 完了を追記
4. spec / roadmap の差分を Keisuke に確認してもらう
5. 承認後、この指示書（`plans/faction-phase2-task.md`）を `plans/archive/` に移動

---

## やらないことリスト（重要）

- ❌ F01/F02/F04〜F08 の演出モーダル・セリフ（Phase 3/4）
- ❌ F03 の継承セリフ演出（Phase 3）
- ❌ 派閥絡みの bond 変動カタログ（Phase 3/4）
- ❌ 性格×アーキタイプ別の派閥セリフ量産（Phase 4）
- ❌ データベースタブの3グループ（個人／関係／記録）再編（別フェーズ）
- ❌ 派閥比較サブタブ（2派閥対置の詳細 UI、spec §7.3）— Phase 2 では一覧のみ、対置比較は後回し
- ❌ 派閥名の社長による変更 UI（spec §15 オープン項目、別フェーズ）
- ❌ `Engine.factions.*` の関数シグネチャ変更・新規追加（必要なら Phase 1 側に戻って追加）
- ❌ `G.factions` を UI から書き換える処理
- ❌ ハードコード16進カラーの追加（token 経由以外は全て禁止）

Phase 2 は「派閥が見える化されるだけ」。それ以上の価値は Phase 3/4 で演出とドラマが乗ったときに初めて完成する。UI の派手さより、**既存 UI を崩さずに派閥情報を自然に差し込むこと**が最優先。
