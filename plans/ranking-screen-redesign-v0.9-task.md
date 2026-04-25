# ランキング画面リデザイン v0.9 — Claude Code 実装ハンドオフ

**ファイル**：`plans/ranking-screen-redesign-v0.9-task.md`
**作成日**：2026-04-25
**対象**：Claude Code
**担当モデル推奨**：Opus（HTMLテンプレート構造の大規模置換 + CSS新規追加）
**モックアップ正本**：`docs/ui/mockups/ranking-redesign-v0.9.html`

---

## 1. このタスクで何をやるか

団体ランキング画面（`#screen-ranking`）を、モックアップ v0.9 の確定デザインで再実装する。既存の表+カードリストの構造を、**マスト+勝利条件バー+ロースターグリッド+詳細プロファイル+履歴** の4セクション構造に置き換える。

### 必ず最初に読むドキュメント

順番に読んでから実装に入ること：

1. **`CLAUDE.md`**（プロジェクト全体ルール）
2. **`docs/ui/01-foundations.md`**（Office カテゴリ + Dark Panel）
3. **`docs/ui/02-layouts.md`**（レイアウトパターン参考）
4. **`docs/ui/mockups/ranking-redesign-v0.9.html`**（モックアップ正本、必ずブラウザで開いて確認）

**CSS の値（色・サイズ・余白）はモックアップから取る**。ハンドオフ文書に値を二重化していないので、モックアップを開きながら実装する。

### スコープ

| 対象 | 内容 |
|---|---|
| 画面 | `#screen-ranking` のみ（1画面） |
| 関数 | `renderRanking()`（`src/ui-render.js:3147-3363`、216行） |
| HTML | `src/index.html` の `#screen-ranking` 配下（行 6182〜6188 付近） |
| CSS | `src/index.html` の `:root` 変数追加 + ranking 専用クラスを `<style>` 内に追加 |

### スコープ外

- 既存の `Engine.ranking.updateRankings(G)` 関数 — 変更しない。返却値の構造はそのまま使う
- 王者・選手詳細ポップアップ（`showFighterPopup`）— そのまま流用
- 「全選手を見る」展開時の選手リスト — 既存ロジック流用、見た目は新カラーに合わせる程度
- スマホ対応 — 非対応（階層2 A-1 デスクトップ専用方針に従う）

---

## 2. 全体の進め方と停止ルール

### 2-1 Phase 進行

**Phase 1 → 2 → 3 → 4 の順で実装する**。各 Phase 完了時に Keisuke さんに報告して確認を取ってから次へ進む。

| Phase | 内容 | 想定規模 |
|---|---|---|
| 1 | CSS 変数追加 + 共通クラス定義（テーマB配色 + OVR階調 + 勝利条件バー） | 中 |
| 2 | 02 全団体ロースター（4団体グリッド+T字フォーメーション） | 中〜大 |
| 3 | 03 団体プロファイル（フォーメーション5名配列+stand画像） | 大 |
| 4 | 04 シーズン履歴 + 勝利条件バー + マスト + 統合最終調整 | 中 |

### 2-2 いつ途中で止まるか

以下のいずれかに該当したら止めて報告：

- **Phase 完了時**（必ず報告）
- **モックアップに明記されていないデザイン判断が必要になった場合**（例：レンタル選手のフォーメーション内表示扱い、王者がいるが該当 portraitId が存在しない場合の挙動など）
- **既存機能を壊しそうな改修**（特に `Engine.ranking.*` の返却値の使い方や `aiOrgs` の構造に関する変更）
- **想定より大幅に変更範囲が広がった場合**（例：Phase 2 で 250+ 行の改修が発生）

### 2-3 Phase ごとの完了定義

各 Phase は以下を満たしたら完了：

- 対象セクションのモックアップとの見た目一致（`docs/ui/mockups/ranking-redesign-v0.9.html` をブラウザで開いて目視比較）
- 既存の機能（タイトル防衛数表示・選手詳細ポップアップ遷移・「全選手を見る」展開）が壊れていない
- ローカルコミット済み（`push は絶対にしない` — CLAUDE.md 準拠）

---

## 3. 事前準備

### 3-1 ブランチ作成

```bash
git checkout -b feature/ranking-screen-redesign-v0.9
```

### 3-2 モックアップを開いておく

モックアップ正本 `docs/ui/mockups/ranking-redesign-v0.9.html` をブラウザで開いて、画面の各部位を確認しておく。実装中は常に参照すること。CSS の具体的な値（色コード、サイズ、padding、border-radius、box-shadow など）はすべてここから取る。

### 3-3 既存コードの位置を確認

| 項目 | 場所 |
|---|---|
| 現在の `renderRanking()` | `src/ui-render.js:3147-3363` |
| 現在の `#screen-ranking` HTML | `src/index.html:6182-6188`（`<div id="rankingContent"></div>` のみのシンプル構造） |
| `Engine.ranking.updateRankings` | `src/management.js:4302` |
| `getStandUrl(id, ovr)` | `src/data.js:527`（**既に存在する**。新規追加不要） |
| `getUpperUrl(id)` | `src/data.js:533` |
| `portraitImg(id, size)` | `src/ui-common.js` 内 |

---

## 4. データ仕様（既存実装の踏襲）

### 4-1 `Engine.ranking.updateRankings(G)` の戻り値

```js
[
  {
    orgId: 'player' | 'org_s' | 'org_a' | 'org_b',
    name: string,
    rating: number,        // 評価値（評価値表示用）
    baseScore: number,     // 基礎力
    legacyScore: number,   // レガシー（団体歴史）
    weightedOVR: number,
    weightedPop: number,
    battlePt: number,      // 対戦pt（+/-）
    rosterSize: number,
    rank: number           // 1-4
  },
  // ...
]
```

これを `rankings.find(r => r.rank === 1)` などで参照する。

### 4-2 王者の取得

- **プレイヤー団体**：`G.titles?.world?.championId` → `G.roster.find(c => c.id === ...)`
- **AI団体**：`G.aiOrgs[orgId].titles?.world?.championId` → `G.aiOrgs[orgId].roster.find(...)`
- 防衛回数：`G.titles.world.defenses`（プレイヤー）、`G.aiOrgs[orgId].titles.world.defenses`（AI）

### 4-3 主力選手の選定ロジック（既存踏襲）

| 順位 | 主力人数 |
|---|---|
| 1位 | 5名 |
| 2位 | 4名 |
| 3位 | 3名 |
| 4位 | 2名 |

選定手順：
1. 該当団体のロースターから `isRental` を除外
2. プレイヤー団体は更に `injury || forcedRest` も除外（既存実装を踏襲）
3. OVR 順に降順ソート
4. 王者がいる場合は王者を最前面（pos-1）に持ってきて、残りを上位 N-1 名で埋める

### 4-4 「看板」の判定

OVR 最高位（王者でない選手の中で OVR が最も高い者）を「看板」と表示する。既存実装では sortedRoster の `idx === 0` を看板扱いしているが、王者が pos-1 を取った場合は看板は **pos-2 の選手**になる点に注意。

### 4-5 stand 画像 / upper 画像 の使い分け

| 部位 | 関数 | 引数 |
|---|---|---|
| 03 団体プロファイル左バナー（バストアップ大） | `getStandUrl(id, ovr)` | `f.id`, `ov(f)` |
| 03 フォーメーション 5名 | `getUpperUrl(id)` | `f.id` |
| 02 ロスター T字フォーメーション 3名 | `getUpperUrl(id)` | `f.id` |

`getStandUrl` の第2引数 `ovr` は OVR 連動のバリアント切り替え（`PORTRAIT_OVR_VARIANT`）に使われる。**OVRを必ず渡すこと**。

### 4-6 stand 画像の向き反転（CSS）

stand 画像のデフォルト向きは個体差があるが、モックアップの表現としては：
- **左バナー（通常配置）→ scaleX(-1) で右向きに反転**して中央のテキストを向かせる
- **右バナー（`.flip`）→ そのまま左向き**

実装時、もし配置側の反転で意図通りの向きにならない選手がいた場合は、画像の元の向きを Keisuke さんに確認すること。

---

## 5. デザイントークン（モックアップから抽出）

### 5-1 既存トークン（`src/index.html` の `:root` に既にある）

| トークン | 値 | 既存 |
|---|---|---|
| `--gold` | `#d4a843` | ✓ |
| `--gold-light` | `#f0d078` | ✓ |
| `--gold-deep` | `#b8912e` | ✓ |
| `--text-main` / `--text-sub` / `--text-dim` | — | ✓ |

### 5-2 新規追加トークン（`:root` に追加）

モックアップ v0.9 の CSS 変数定義をそのまま `src/index.html` の `:root` に追加する。トークン命名は `--rank-*`（順位カラー）と `--v-*`（OVR階調）。

#### 順位カラー（質的属性専用：金/銀/銅/鋼）

```css
--rank-1: #d4a843;       /* Gold */
--rank-1-light: #f0d078;
--rank-1-deep:  #9c7820;
--rank-2: #c0c0c0;       /* Silver */
--rank-2-light: #e8e8e8;
--rank-2-deep:  #888888;
--rank-3: #c47e3a;       /* Bronze */
--rank-3-light: #d89858;
--rank-3-deep:  #8a4f1f;
--rank-4: #6b6960;       /* Steel */
--rank-4-light: #b8b6ad;
--rank-4-deep:  #5a584f;
```

順位カラーは **質的属性のみに適用**：順位番号、団体名（ヘッドライン）、ティアバッジ、カードのボーダー、透かし数字、縦組オーバーライン、ace-name-plate、deck の border-left、王冠リングライト、シーズン履歴の順位列。

#### OVR 階調（数字専用：能力値の高さで色を決める）

```css
--v-mythic:    #ffd700;  /* OVR 100+      — 純金（殿堂入り、glow強化） */
--v-elite-mid: #ffc640;  /* OVR 95-99     — 強金 */
--v-elite:     #ffd870;  /* OVR 90-94     — 中金 */
--v-elite-low: #ffe898;  /* OVR 85-89     — 淡シャンパン金 */
--v-high:      #fff0c0;  /* OVR 80-84     — クリーム白（黄色味スタート） */
--v-mid:       #f0eee8;  /* OVR 70-79     — 暖白（黄色味なし） */
--v-low:       #b8b5a8;  /* OVR 60-69     — 淡グレー */
--v-poor:      #7a766b;  /* ~59           — 暗グレー */
```

OVR 階調は **OVR 数字にのみ適用**。評価値・基礎力・レガシーなどの団体スコアには適用しない（白で統一）。

#### 看板バッジ赤

```css
--board-red:        #ff4530;
--board-red-bg:     rgba(214,48,49,0.18);
--board-red-border: #e85040;
```

### 5-3 階調閾値の定数化

`src/data.js` に定数を追加（`PORTRAIT` 定義の近くなど、他の定数と一緒に）：

```js
const OVR_TIER_THRESHOLDS = {
  mythic:   100,
  eliteMid: 95,
  elite:    90,
  eliteLow: 85,
  high:     80,
  mid:      70,
  low:      60,
};
```

### 5-4 ヘルパー関数の追加

`src/ui-common.js` に追加（OVR 値からクラス名を返すヘルパー）：

```js
function valueClassOvr(ovr) {
  if (ovr >= OVR_TIER_THRESHOLDS.mythic)   return 'v-mythic';
  if (ovr >= OVR_TIER_THRESHOLDS.eliteMid) return 'v-elite-mid';
  if (ovr >= OVR_TIER_THRESHOLDS.elite)    return 'v-elite';
  if (ovr >= OVR_TIER_THRESHOLDS.eliteLow) return 'v-elite-low';
  if (ovr >= OVR_TIER_THRESHOLDS.high)     return 'v-high';
  if (ovr >= OVR_TIER_THRESHOLDS.mid)      return 'v-mid';
  if (ovr >= OVR_TIER_THRESHOLDS.low)      return 'v-low';
  return 'v-poor';
}
```

テンプレ生成時に `<span class="ovr ${valueClassOvr(ov(f))}">${ov(f)}</span>` のように使う。

---

## 6. Phase 1 — CSS変数 + 共通クラス + マスト + 勝利条件バー

### 6-1 やること

1. `src/index.html` の `:root` に §5-2 のトークンを追加
2. `src/data.js` に `OVR_TIER_THRESHOLDS` を追加
3. `src/ui-common.js` に `valueClassOvr` を追加
4. `src/index.html` の `<style>` 末尾付近に、ranking 専用クラスを追加
   - 値階調クラス（`.v-mythic / .v-elite-mid / .v-elite / .v-elite-low / .v-high / .v-mid / .v-low / .v-poor`）
   - フォーメーション内では glow + 黒縁取り両立（`.fcell .info .ovr.v-mythic` などの上書き定義もモックアップ通り）
5. `#screen-ranking` の DOM 構造をモックアップに合わせて再構築：
   ```html
   <div class="screen" id="screen-ranking">
     <div class="ranking-popup">
       <div class="popup-header">...</div>
       <div class="popup-mast">...</div>
       <div class="victory-bar">...</div>     <!-- Phase 1 で実装 -->
       <div id="rankingContent"></div>          <!-- 02-04 はここに renderRanking() が流す -->
     </div>
   </div>
   ```
6. マスト + 勝利条件バーのスタイルとレンダリング実装
   - マスト：`INDUSTRY STANDINGS / 第N シーズン・全4団体 / Y{N} W{N}`（モックアップ参照、`Engine.util.formatDate(G.season, G.week)` を使う）
   - 勝利条件バー：`▲1位 {1位団体} {pt}pt / −{差}pt で頂点 / ▼自団体 {自団体} {pt}pt`
     - 1位がプレイヤーの場合は「👑 業界1位！」表示にフォールバック（既存挙動を踏襲）

### 6-2 完了条件

- ブラウザで `#screen-ranking` を開いて、ヘッダ/マスト/勝利条件バーが表示される
- 既存の表+カードはまだ残っている（rankingContent には旧 HTML が入る）
- ハードコード色が新トークンに置き換わっている

---

## 7. Phase 2 — 02 全団体ロースター（4団体グリッド + T字フォーメーション）

### 7-1 やること

1. `renderRanking()` を改修開始。冒頭の表（`<table class="data-table">`）部分を、4団体グリッドに置き換える
2. 各団体カード（`.orgcell`）の構造をモックアップに従って実装：
   - `.orgcell-head`：順位番号 + 団体名 + ティアピル
   - `.orgcell-formation`：T字フォーメーション（pos-1 中央前面、pos-2 左後ろ、pos-3 右後ろ）
   - `.orgcell-foot`：評価値（pt）+ OVR 平均 + 対戦pt
3. 1位カードのみ拡大：`.orgs-grid` を `grid-template-columns: 1.3fr 1fr 1fr 1fr` に
4. **キャラ下端揃え**：`.orgcell-formation` に `margin-top: auto` を付ける（モックアップ通り）。これによりフォーメーションがフッター直上に押し付けられ、全カードのキャラ下端が揃う
5. プレイヤー団体は `.is-player` クラスで銀色アクセント
6. 主力選手の選定は §4-3 の既存ロジック踏襲。フォーメーションは上位3名（順位による主力人数とは別、02はトップ3固定）。王者がいたら pos-1 に
7. 看板バッジ（赤）：王者でない選手のうち OVR 最高位を看板表示。`<span class="badge board">看板</span>`

### 7-2 注意点

- 02 ロースターの主力人数は **固定で3名**（モックアップ通り）。03 と違って 5/4/3/2 ではない
- 4位団体で OVR 順に並べた選手が3名未満の場合（理論上のみ。レンタル除外で1-2名になるケース）は pos-2 / pos-3 を空にする
- OVR 数字には `valueClassOvr(ov(f))` で `v-*` クラスを付与
- 評価値（pt）には階調を付けない（白のまま）

### 7-3 完了条件

- 02 セクションがモックアップ通りに表示される
- 1位カードが拡大されている
- 全カードでキャラ下端が揃っている
- OVR 数字が階調色で表示される
- 既存の旧 HTML（表 + 縦並びカードリスト）がこのフェーズで完全に消える前提でOK（03 を残してもよいが、最終的には Phase 3 で書き換え）

---

## 8. Phase 3 — 03 団体プロファイル（5名フォーメーション + stand画像）

### 8-1 やること

1. `renderRanking()` の後半（既存の縦並びカードリスト部分）を、03 セクションに置き換える
2. 各団体プロファイルカード（`.org-card`）の構造：
   - `.org-banner`（左、stand画像）+ `.org-body`（右、詳細情報）の2カラム
   - 偶数位の団体は `.flip` クラスで左右反転（2位・4位）
3. stand 画像：`getStandUrl(f.id, ov(f))` を使う（OVR 必須）
4. stand 画像の向き反転：CSS の `transform: scaleX(-1)` を **左バナー**（通常配置）の画像に適用、右バナー（`.flip`）はそのまま
5. フォーメーションは順位ごとに人数決定（5/4/3/2、§4-3）。各 fcell に：
   - upper画像（`getUpperUrl(f.id)`）
   - 名前（白文字 + 黒縁取り）
   - OVR（階調クラス付き）
   - 王者なら金バッジ + リングライト、看板なら赤バッジ
6. 統計バー：評価値 / 基礎力 / レガシー / 対戦pt / 人気
   - 評価値・基礎力・レガシー：白固定
   - 対戦pt：+ なら緑（`var(--signal-up)` 相当）、− なら赤
   - 人気：`_orgPopColor()` で既存の人気色を流用
7. 「全選手を見る」（`<details>`）：既存実装を踏襲、見た目だけ新カラーに合わせる

### 8-2 注意点

- 03 フォーメーションは **5/4/3/2 名**（02 と違う）
- pos-1〜pos-5 の配置は CSS でハードコード（モックアップ参照）。fcell の数によって表示が変わる
- 4位団体は2名なので pos-3〜pos-5 は空
- AI 王者が `aiData.titles.world.championId` に居て `roster` に存在しない場合（理論上ないがガード）はクラッシュしないように
- mythic 帯（OVR 100+）の選手のglow は既存の `text-shadow` 実装で OK。透過画像と重なる位置（fcell内）では黒縁取りも併用

### 8-3 完了条件

- 03 セクションが4団体すべてモックアップ通りに表示される
- stand 画像が左/右で正しい向きになっている
- フォーメーションが5/4/3/2名で正しく表示される
- 「全選手を見る」が動作する
- 既存の選手詳細ポップアップ遷移（`showFighterPopup`）が動作する

---

## 9. Phase 4 — 04 シーズン履歴 + 統合最終調整

### 9-1 やること

1. シーズン履歴セクションをモックアップ通りに整形
   - 順位カラム：1位=金 / 2位=銀 / 3位=銅 / 4位=鋼（既存ハードコード色を新トークン化）
   - 透かし「04」数字は **削除**（`.history-wrap::before` の `content: "04"` を消す。番号は使わない方針 v0.9.1 で確定済み）
2. section-marker から番号削除：02/03/04 のすべての `<div class="num">N</div>` を削除し、kicker のみ残す
3. 全体の余白調整、レスポンシブ確認（デスクトップのみ）
4. `docs/game-system-roadmap.md` の更新（CLAUDE.md ルール）
5. 既存の関連動作確認チェックリスト：
   - [ ] 1位がプレイヤーの場合の勝利条件バー表示が「👑 業界1位！」になる
   - [ ] AI王者がいる団体の王冠表示
   - [ ] 王者不在団体の「不在」表示
   - [ ] レンタル選手が主力に出ない
   - [ ] 怪我中・休養中の選手が主力から除外される（プレイヤー側のみ）
   - [ ] 選手をクリックしたらポップアップが開く（`showFighterPopup`）
   - [ ] 「全選手を見る」展開で全選手リストが表示される
   - [ ] `Engine.ranking.updateRankings` の結果が変わる場面（試合勝敗で battlePt が動くなど）でランキングが更新される

### 9-2 完了条件

- モックアップとの見た目一致
- 既存の機能がすべて動作する
- ハードコード色が `var(--*)` トークンに置き換わっている（許容範囲：シーズン履歴の利益増減色など、共通シグナル色）
- ローカルコミット済み

---

## 10. specs/ 更新

### 10-1 既存 spec の確認

ランキング関連の spec：
- `specs/archive/org-ranking-spec-v1_0.md`（archive 行き、参照のみ）

新規 spec の作成は **不要**（ランキングシステムのロジック自体は変更しない、UIだけのリファクタなので）。

### 10-2 仕様書の作成

`docs/ui/03-screens/ranking.md` を新規作成：
- 既存の `docs/ui/03-screens/show-result-spec.md` のフォーマットに準拠
- HTML 構造、CSS変数、データ接続、主力選手選定ロジック、画像取得関数、向き反転ルールなど
- モックアップ正本へのリンク

---

## 11. リスクと既知の懸念

### 11-1 portraitId が `PORTRAIT` 辞書に無いキャラ

`getStandUrl(id, ovr)` / `getUpperUrl(id)` は対応するキーが無いと空文字を返す。`<img src="">` になると alt が表示されるので、各画像出力箇所で空文字チェックを入れること（既存実装の `portraitImg` も同等のフォールバックがある）。

### 11-2 Mockup 内の `image/upper/...` パス

モックアップ正本（`docs/ui/mockups/ranking-redesign-v0.9.html`）では画像パスが `../../../image/upper/...` になっている。これは mockups フォルダから3階層上を見るため。実装時は `getUpperUrl` / `getStandUrl` が返すパス（`../image/upper/...`）が正しい。混同しないこと。

### 11-3 1位がプレイヤーの場合の勝利条件バー

モックアップは「2位プレイヤー」前提。1位がプレイヤーになった場合、勝利条件は意味をなさないので：
- 中央の `−134 pt で頂点` を「👑 業界1位！」のような勝利状態表示に切り替える
- target/player の左右配置を維持しつつ、1位＝自団体の場合の見せ方を考える

既存実装では「👑 業界1位！」一行のシンプル表示にフォールバックしている。Phase 1 で同じ挙動を勝利条件バーで再現する。

### 11-4 自動検証への影響

- ui-render.js のみの変更なので auto-sim フックは走らない（CLAUDE.md ルール）
- 念のため Phase 4 完了時に `node test/auto-sim.js 100` を1回回して、validateGameState の警告が増えていないことを確認するのを推奨（必須ではない）

---

## 12. 完了後の引き継ぎ事項

実装完了報告時、以下を Keisuke さんに伝えること：

- ✅ Phase 1〜4 すべての完了
- ✅ モックアップとの見た目一致を確認した（具体的に：1位カード拡大、キャラ下端揃え、stand画像向き反転、OVR階調 8段階、勝利条件バー）
- ✅ 既存機能が壊れていないことを確認した（§9-1 のチェックリスト全項目）
- ✅ `docs/ui/03-screens/ranking.md` を作成
- ✅ `docs/game-system-roadmap.md` を更新
- 🔧 確認してほしい操作：
  - `#screen-ranking` を開いて全段の表示確認
  - 試合勝敗で battlePt が動いた後のランキング更新確認
  - 王者交代時の表示確認
  - 「全選手を見る」展開動作

---

## 付録 A：HTML 構造の概観（モックアップから）

```
#screen-ranking
└─ .ranking-popup
   ├─ .popup-header        (🏆 団体ランキング / ✕ 閉じる)
   ├─ .popup-mast          (INDUSTRY STANDINGS / Y3 W28)
   ├─ .victory-bar         (▲1位 / 中央 −Npt / ▼自団体)
   └─ #rankingContent
      ├─ .section.bg-card  ── 02 全団体ロースター
      │  ├─ .section-marker
      │  └─ .orgs-grid (1.3fr 1fr 1fr 1fr)
      │     └─ .orgcell × 4 (head + formation T字 + foot)
      ├─ .section.bg-deep  ── 03 団体プロファイル
      │  ├─ .section-marker
      │  └─ .org-card × 4 (banner stand画像 + body 詳細＋5名フォーメーション)
      └─ .section.bg-card.history-wrap ── 04 シーズン履歴
         ├─ .section-marker
         └─ table
```

## 付録 B：実装行数の概算

| Phase | 追加 | 削除 | 純増 |
|---|---|---|---|
| 1 | CSS 〜200行、HTML 〜30行 | 0 | +230 |
| 2 | renderRanking 内 〜120行 | 〜80行（既存表） | +40 |
| 3 | renderRanking 内 〜250行 | 〜130行（既存縦並びカード） | +120 |
| 4 | renderRanking 内 〜30行（履歴整形） | 〜10行（既存履歴） | +20 |
| **合計** | **〜630行** | **〜220行** | **+410行** |

renderRanking() 自体は最終的に 250〜300行程度（既存216行から微増）に収まる想定。
