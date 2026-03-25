# 4件バグ修正・機能追加

## ■1. 新聞にJT記事が数ヶ月残り続ける

### 原因
`state._juniorTournamentResult` がセットされた後、一度もクリアされない。
`Engine.newspaper.generate()` が毎週このフラグを見てJT記事を再生成し続ける。

app.js 6705行付近にコメント:
```
// transientクリア（_juniorTournamentResultはtickWeekで新聞が読むので残す）
```
→ 新聞が「読んだ」後にクリアしていないのが問題。

### 修正
engine.js の tickWeek パイプライン内（4933行付近）、`Engine.newspaper.generate()` 呼び出し直後に `_juniorTournamentResult` をクリア:

```js
const weeklyNewspaper = Engine.newspaper.generate(s, newsRng);
s = { ...s, weeklyNewspaper, _juniorTournamentResult: null };
```

同様に `_juniorTournamentPreview`（Week 24プレビュー用）も残っていれば同時クリア:
```js
s = { ...s, weeklyNewspaper, _juniorTournamentResult: null, _juniorTournamentPreview: null };
```

※ `Engine.newspaper.generate()` 内部ではクリアしない（pure function原則を守る）。tickWeek側でクリアする。

---

## ■2. 興行中に平常時BGMが流れ出す

### 原因
app.js `receiveBattleResult()` 内（3477-3478行付近）で、試合結果受信後に無条件で `Audio.bgm.play('management')` を呼んでいる。
興行プレビュー（showPreview）でまだ未消化の試合が残っていても、管理画面BGMに戻ってしまう。

```js
// BGM: FileBGMフェードアウト + チップチューンをmanagementに戻す
try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
try { Audio.bgm.play('management'); } catch(e) {}
```

### 修正
`Audio.bgm.play('management')` を、全試合完了時のみ呼ぶように変更:

```js
try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
// 残り試合がある場合はmanagement BGMに戻さない
const allDone = sp.results.every(r => r !== null);
if (allDone) {
  try { Audio.bgm.play('management'); } catch(e) {}
}
```

※ 全試合完了後は `App.finalizeShow()` が呼ばれてそこでも BGM 制御されるが、念のため `allDone` 時のみ management に戻す形が安全。

---

## ■3. タイトルマッチ挑戦資格の明確化

### 要件
タイトルマッチの挑戦者になれるのは、以下の**いずれか**を満たす選手のみ:
- ロスター内OVRランキング **上位5位以内**
- ロスター最高OVRとの差が **8以内**

チャンピオン自身は除外。怪我中・レンタルも除外。
**プレイヤー団体・NPC団体の両方に適用する。**

### 修正箇所

#### (A) Engine側: 資格判定ユーティリティ関数を新設

`Engine.title` に追加:
```js
/**
 * タイトルマッチ挑戦資格判定
 * @param {Array} roster - 全選手
 * @param {number} champId - 現チャンピオンID
 * @returns {Array} 資格のある選手のID配列
 */
getEligibleChallengers(roster, champId) {
  const available = roster.filter(f => f.id !== champId && !f.injury && !f.isRental);
  if (available.length === 0) return [];

  // OVRランキング（チャンピオン除外）
  const sorted = [...available].sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a));
  const top5Ids = new Set(sorted.slice(0, 5).map(f => f.id));

  // ロスター最高OVR（チャンピオン含む全員から）
  const maxOvr = Math.max(...roster.filter(f => !f.injury && !f.isRental).map(f => Engine.util.ov(f)));

  const eligible = available.filter(f => {
    if (top5Ids.has(f.id)) return true;
    if (maxOvr - Engine.util.ov(f) <= 8) return true;
    return false;
  });

  return eligible.map(f => f.id);
}
```

#### (B) プレイヤー団体: 興行カード設定UI

`app.js` の興行カード設定画面（対戦カード組み）で、タイトルマッチの挑戦者ドロップダウンに表示される選手を `getEligibleChallengers` でフィルタする。資格のない選手はグレーアウトするか、リストに表示しない。

具体的にはタイトルマッチスロットで挑戦者を選択する箇所を探し、候補リストに資格フィルタを適用する。

#### (C) NPC団体: AIのタイトルマッチ生成

engine.js 内のAI団体のタイトルマッチ処理（`simulateAIWeek` や `processAIWeek` 内でタイトルマッチを組む箇所）にも同じ `getEligibleChallengers` を適用する。

#### (D) S1イベント（タイトル挑戦要求）の条件統一

engine.js 10142行付近の `S1` フィルタ条件を `getEligibleChallengers` に統一:

現状:
```js
// S1: タイトル挑戦要求（trust 30〜55、人気30+、タイトル未保持 + OVR差8以内 + rivalry50+）
```

改修後: S1の発生条件に**タイトル挑戦資格**を前提条件として追加する。
- 挑戦資格あり（OVR上位5位以内 or ロスター最高OVRとの差8以内）**かつ**
- trust 30〜55 **かつ**
- 人気30+
- ※ rivalry50+条件とOVR差8条件は、挑戦資格に統合されるので個別のrivalry/OVR差チェックは削除してよい
  - ただし20%緩和ロジック（s1Relaxed）は残す: 緩和時は挑戦資格 + trust + 人気のみでOK

#### (E) 期待カード（Priority 2: チャンピオンへの挑戦）

engine.js 11125行付近。現状は「人気3位以内のノンチャンプ」だが、挑戦資格フィルタを追加:

```js
// Priority 2: チャンピオンへの挑戦（挑戦資格あり + 人気上位）
const eligibleIds = new Set(Engine.title.getEligibleChallengers(roster, champId));
const challengers = [...roster]
  .filter(f => eligibleIds.has(f.id))
  .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
```

---

## ■4. 収支タブのグラフを全サブタブに対応

### 要件
4つのサブタブ（総合・収入・支出・給与）× 3つの期間（今月・年間・全期間）すべてでチャートを表示する。

### 現状
- 総合タブのみ `G.fundsHistory` を使ったSVG折れ線チャートがある
- 収入/支出/給与タブはテーブル（項目一覧）のみ

### 修正

#### (A) 既存のSVGチャート生成を共通関数化

`ui-render.js` の `renderFinance()` 内、総合タブのSVG生成ロジック（1984行付近〜）を独立関数に切り出す:

```js
/**
 * 収支チャートSVG生成
 * @param {Array<number>} values - 週ごとの値の配列
 * @param {Object} options - { color, label, showZeroLine, height }
 * @returns {string} SVG HTML文字列
 */
function _financeChart(values, options = {}) { ... }
```

#### (B) 各サブタブにチャート追加

データソースは `_getFilteredFinance(period)` で取得した `financeHistory` 配列から週ごとに集計:

- **総合**: 既存の `fundsHistory` チャート（変更なし）
- **収入**: `filtered` から各週の `details.filter(d => d.type === 'income')` の合計 → 緑の折れ線
- **支出**: `filtered` から各週の `details.filter(d => d.type === 'expense')` の合計 → 赤の折れ線（値は負数のまま表示）
- **給与**: `filtered` から各週の `details.filter(d => d.type === 'expense' && label === '選手給与')` の合計 → オレンジの折れ線

チャートはテーブルの上に配置。テーブルは既存のまま残す。

---

## 実装順序の推奨

1. ■1（JTフラグクリア）— 1行追加
2. ■2（BGM修正）— 数行修正
3. ■3（タイトル挑戦資格）— 新関数 + 複数箇所適用
4. ■4（収支チャート）— 共通関数化 + 3タブ追加

auto-sim 100シーズン（10 seeds × 10 seasons）で■1〜■3の破壊がないことを確認。
■4はUI変更のみなのでauto-simは不要。
