# 団体年代記システム 仕様書 v0.2 (差分)

> **本書の位置づけ**: `specs/chronicle-system-spec-v0.1.md` への差分仕様。v0.1 に記述された内容は変更しない。本書では v0.1 の §3.2 / §4 / §6 への追加・差し替えのみを記述する。
>
> **対象範囲**:
> 1. 章ごとの「立場 (mode)」判定の追加
> 2. `eraStats` の拡張 (`titleDefenses` 追加 + `competitiveRecord` 派生)
> 3. 「この時代の通算」表示の mode 別ラベル切り替え
> 4. 記者の目 (ace quote) のカテゴリ8種への拡充と Engine 側への移植
>
> **設計方針**: v0.1 で確定したデータ構造 (特に `eraStats.vsStier`) は破壊しない。新規フィールド追加と表示層での切り替えで対応する。

---

## §A. 章 mode 判定 (新規)

### A.1 動機

v0.1 の年代記は「この時代の通算」セクションに `eraStats.vsStier` の値を「VS S-TIER」というラベルで常時表示していた。しかしこの集計はチャプター内メンバーの career history から `e.type === 'war'` を全件カウントするもので、相手団体のティアを区別していない。

加えて、プレイヤー団体が rank 1 (S-TIER 相当) に到達した後の章でも常に「VS S-TIER 0勝0敗」が表示され続け、「挑戦者時代」と「頂点防衛時代」を同じラベルで見せてしまう問題がある。

v0.2 ではこの「章ごとのプレイヤー団体の立場」を `mode` として判定し、表示を切り替える。

### A.2 mode 定義

章ごとに以下のいずれかひとつを採用する:

| mode | 物語的意味 | 該当する章中ランク推移の例 |
|---|---|---|
| `summit` | 王者として君臨 | 1→1→1→1→1 |
| `defense` | 王者として挑まれて防衛 | 1→2→1→1→2 |
| `contention` | 上位定着、頂点をうかがう | 2→2→3→2→2 |
| `challenge` | 下位、駆け上がろうとする | 4→4→3→4→4 |
| `ascend` | 下位から頂点へ駆け上がった (達成) | 4→3→2→1→1 |
| `decline` | 頂点から転落 | 1→1→2→3→4 |

### A.3 判定アルゴリズム

入力:
- `chapter.seasonStart`, `chapter.seasonEnd`
- `state.seasonHistory[i].rank` (各シーズン末のプレイヤー団体ランク、1-indexed)
- `state.rankings` (現在の状態、フォールバック用)

ティア分類 (4団体構成: rank 1〜4 を3ティアにまとめる):

| rank | tier |
|---|---|
| 1 | T1 |
| 2 | T2 |
| 3-4 | T3 |

判定手順 (上から順に評価し、最初に該当した条件を採用する):

```
Step 1. 章中の各シーズン末ランクを seasonHistory から収集
        ranks = []
        for s in [seasonStart .. seasonEnd]:
            entry = seasonHistory.find(h => h.season === s)
            if entry && typeof entry.rank === 'number':
                ranks.push(entry.rank)

Step 2. データ未充足の場合のフォールバック
        if ranks.length === 0:
            currentRank = Engine.ranking.getPlayerRank(state.rankings)
            if currentRank exists: ranks = [currentRank]
            else: return 'challenge'  // デフォルト (旗揚げ世代等)

Step 3. 駆け上がり / 転落の判定 (ティア境界をまたぐ大きな変化を優先)
        firstRank = ranks[0]
        lastRank  = ranks[ranks.length - 1]
        if firstRank >= 3 && lastRank === 1:  return 'ascend'
        if firstRank === 1 && lastRank >= 3:  return 'decline'

Step 4. 最頻ティアによる判定
        t1 = count(r === 1)
        t2 = count(r === 2)
        t3 = count(r >= 3)
        topTier = argmax(t1, t2, t3)
            (タイブレーク: 章末シーズンが属するティア → なければ summit > defense > challenge の順で優先)

        if topTier === T1:
            t2Ratio = t2 / ranks.length
            if t2Ratio >= 0.25:  return 'defense'
            else:                return 'summit'
        if topTier === T2: return 'contention'
        if topTier === T3: return 'challenge'
```

判定例 (12ケース):

| ranks | first/last | tier counts | 経路 | mode |
|---|---|---|---|---|
| 1,1,1,1,1 | 1/1 | T1=5 | Step4 (t2/5=0%) | summit |
| 1,2,1,1,2 | 1/2 | T1=3, T2=2 | Step4 (t2/5=40%) | defense |
| 4,3,2,1,1 | 4/1 | — | Step3 ascend | ascend |
| 1,1,2,3,4 | 1/4 | — | Step3 decline | decline |
| 2,2,3,2,2 | 2/2 | T2=4 | Step4 | contention |
| 4,4,3,4,4 | 4/4 | T3=5 | Step4 | challenge |
| 1,1,1,1,2 | 1/2 | T1=4, T2=1 | Step4 (t2/5=20%) | summit |
| 1,2,2,2,2 | 1/2 | T1=1, T2=4 | Step4 | contention |
| 2,2,2,2,1 | 2/1 | T2=4, T1=1 | Step4 (Step3 該当せず) | contention |
| 3,2,1,1,1 | 3/1 | — | Step3 ascend | ascend |
| 1,3,3,1,1 | 1/1 | T1=3, T3=2 | Step4 (t2/5=0%) | summit |
| 1,2,2,3,3 | 1/3 | — | Step3 decline | decline |

### A.4 格納場所

`chapter.eraStats.competitiveRecord` (新規) として格納する。`eraStats.vsStier` は v0.1 互換のため残す:

```js
chapter.eraStats = {
  totalShows,                        // (v0.1 既存, 未使用なら 0)
  totalTitleWins,                    // v0.1 既存
  totalTitleDefenses,                // v0.2 新規 (§B.1 参照)
  vsStier: { wins, losses },         // v0.1 既存。集計対象は不変 (=全対抗戦)
  peakOrgPop,                        // v0.1 既存
  competitiveRecord: {               // v0.2 新規。表示層が参照する派生値
    mode,                            // 'summit' | 'defense' | 'contention' | 'challenge' | 'ascend' | 'decline'
    label,                           // 表示用ラベル (§C 参照)
    valueText                        // 値部分の整形済み文字列 (§C 参照)
  }
};
```

`competitiveRecord` は `_buildEraStats` 内で派生計算する (純粋関数)。

---

## §B. eraStats 拡張 (新規)

### B.1 totalTitleDefenses の追加

章メンバーの career history から、章期間 `[seasonStart, seasonEnd]` 内の `titleDefense` イベントを集計し、`eraStats.totalTitleDefenses` として格納する。

```js
// _buildEraStats 内
let totalTitleDefenses = 0;
chars.forEach(c => {
  const hist = ((c.careerRecord || {}).history || [])
    .filter(e => (e.season || 0) >= chapter.seasonStart
              && (e.season || 0) <= chapter.seasonEnd);
  hist.filter(e => e.type === 'titleDefense').forEach(e => {
    totalTitleDefenses += (e.count || 1);  // count があればそれを使う
  });
});
```

**注意**: `titleDefense` イベントの `count` フィールドは既存仕様で「累計防衛回数」を保持している (v0.1 の `_buildHighlights` で `ev.count` を参照している箇所がある)。集計時は最後の防衛イベントの count を取るのではなく、各イベントの count または 1 を加算する形で扱う。実装時に `careerRecord.history` の実データを確認すること。

### B.2 既存フィールドへの影響

`totalTitleWins`, `vsStier`, `peakOrgPop` は変更しない。`totalShows` も v0.1 のまま (現状未集計)。

---

## §C. 表示の切り替え (差し替え)

### C.1 「この時代の通算」セクションの新仕様

v0.1 の `ui-render.js` で4ボックス並びだったうち、**2番目のボックス (現状 `VS S-TIER`) を mode 別に切り替える**。他3ボックス (TITLES / PEAK POP / STATUS) は変更しない。

mode 別の表示マトリクス:

| mode | KEY (見出し) | VAL (値の整形) | 値の出典 |
|---|---|---|---|
| `summit` | 君臨 | `n度防衛` | `eraStats.totalTitleDefenses` |
| `defense` | 防衛戦 | `n度防衛` | `eraStats.totalTitleDefenses` |
| `contention` | つばぜり合い | `w勝l敗` | `eraStats.vsStier` |
| `challenge` | 殴り込み | `w勝l敗` | `eraStats.vsStier` |
| `ascend` | 下剋上 | `w勝l敗` | `eraStats.vsStier` |
| `decline` | 陥落 | `n度防衛・王座失陥` | `totalTitleDefenses` + 章内 `titleLoss` 有無 |

`decline` の "王座失陥" 部分は、章メンバーの career history に `e.type === 'titleLoss' && e.season ∈ [seasonStart, seasonEnd]` が1件以上あれば付与する。なければ単に `n度防衛` で表示する。

### C.2 KEY/VAL の格納

§A.4 で導入した `competitiveRecord` に `label` (KEY) と `valueText` (VAL) を整形済み文字列として格納し、UI 側はそれを読むだけにする。整形ロジックは Engine 側 (`Engine.chronicle._buildCompetitiveRecord` 新設) に置く。

### C.3 v0.1 互換性

`eraStats.vsStier` は読み取り専用フィールドとして温存する。古いセーブデータで `competitiveRecord` が未生成の場合、UI は v0.1 互換動作 (VS S-TIER 表示) にフォールバックする — ただし `refreshChapters` を一度走らせれば自動で `competitiveRecord` が生成される。

**マイグレーション**: 不要。古いキャッシュは `lastBuiltSeason` 不一致で自動再構築されるため、明示的なマイグレーションコードは追加しない。

---

## §D. 記者の目 (ace quote) 拡充

### D.1 動機

v0.1 (Phase 2 後) の `_chronicleAceQuote` は `ui-render.js` の中で 5 分岐の if-else で書かれており、テンプレ数が固定 5 本、章の主役が違っても文章の方向性が似てしまう。v0.2 ではこれを **8カテゴリ × 各3本以上のテンプレート** に拡充し、Engine 側に移して決定論的に選ぶ。

### D.2 移植先

新設: `Engine.chronicle.buildAceQuote(ace, chapter, state)` (純粋関数)

- 入力: `ace` オブジェクト (chapter.aces[i] の各エントリ) / `chapter` 全体 (mode 等を参照) / `state` (rngSeed のため)
- 出力: 文字列 1 本 (HTML を含まない、装飾は表示層で付与)
- `ui-render.js` の `_chronicleAceQuote` は本関数を呼ぶだけのシム関数として残すか、削除して直接 `Engine.chronicle.buildAceQuote` を呼ぶ

### D.3 8カテゴリと判定優先順

上から順に評価し、最初に該当したカテゴリを採用する:

| 順 | カテゴリ | 判定条件 |
|---|---|---|
| 1 | `peakDefender` (頂点防衛型) | `chapter.eraStats.competitiveRecord.mode === 'summit'` && `ace のチャプター内防衛 ≥ 3` |
| 2 | `defender` (防衛型) | `ace.titleReigns ≥ 1` && `ace.totalDefenses ≥ 3` |
| 3 | `champion` (王座型) | `ace.titleReigns ≥ 2` |
| 4 | `popStar` (人気爆発型) | `ace.peakPopularity ≥ 90` |
| 5 | `generationShift` (世代交代型) | `chapter.number ≥ 3` && 前章の peers/aces のいずれかが本章の peers にも含まれる |
| 6 | `struggle` (苦闘型) | `mode === 'challenge'` && `ace のチャプター内 warLosses ≥ 2` && `warWins === 0` |
| 7 | `craftsman` (技巧派支柱型) | `ace.peakOVR ≥ 88` && `ace.titleReigns === 0` |
| 8 | `uncrowned` (無冠の主役型) | デフォルト (上記いずれにも該当せず) |

「ace のチャプター内防衛」「ace のチャプター内 warWins/warLosses」は、`ace.id` の career history を `[seasonStart, seasonEnd]` でフィルタして算出する。

### D.4 テンプレート

各カテゴリ最低3本。プレースホルダ: `{surname}` (苗字、`Engine.chronicle._getSurname(ace.name)` で取得) / `{styleJa}` (打撃 / 組技 / 関節技 / 喧嘩 / 万能) / `{titleReigns}` / `{defenses}` / `{peakOVR}` / `{peakPop}`。

実装時は以下の文体ガイドに沿って書き起こす:

- 全文体 **「だ・である」調**で統一 (v0.1 の Phase 2 テンプレート群と整合)
- 黒田風の皮肉・誇張は使わない (年代記は中立的な記者視点)
- 1文〜2文構成、句点で終わる
- HTML タグ・絵文字・改行を含めない
- 文字化けの原因になる外字 (♠ ★ 等) は避ける、必要なら全角記号に止める

カテゴリ別文体目安 (実テンプレートは plans 側で執筆):

| カテゴリ | 文体目安 |
|---|---|
| peakDefender | 「{surname}は{defenses}度の防衛で頂点を守り抜いた。」系。挑戦者を退ける王者の風格 |
| defender | 「{surname}は王座を{defenses}度防衛し、団体の核として時代を背負った。」系 |
| champion | 「{surname}は{titleReigns}度の王座戴冠を達成し、世代を黄金期に押し上げた。」系 |
| popStar | 「{surname}の人気が客足を支えた。OVR ではなく動員で時代を作った世代だった。」系 |
| generationShift | 「{surname}が前世代の主役たちと並走し、世代交代の橋渡しとなった。」系 |
| struggle | 「{surname}は{styleJa}を貫いたが、上位の壁は厚かった。届かないまま章は閉じる。」系 |
| craftsman | 「{surname}は{styleJa}の技巧で団体を支えた。王座にこそ届かなかったが、世代の支柱だった。」系 |
| uncrowned | 「{surname}は無冠ながらこの世代の主役だった。タイトルでは測れない存在感がそこにあった。」系 |

### D.5 シードと決定論性

テンプレート選択は次のシードで決定する:

```js
const seedBase = state.rngSeed || 'default';
const seedKey = `chronicle-quote:${chapter.id}:${ace.id}`;
const seed = Engine.rng.derive(seedBase, seedKey);
const idx = ((seed | 0) % templates.length + templates.length) % templates.length;
```

これにより:
- 同じセーブの同じ章を再開いても文章が変わらない
- 別の章なら別の文章になりうる
- 別のセーブ (rngSeed が異なる) なら別の選択になりうる

### D.6 受け入れ条件

- 同じ章を開くたびに文章が安定する (再描画で変動しない)
- 章のエースが違えば文章の方向性が変わる
- カテゴリ判定の優先順が §D.3 の順で機能している (auto-sim 等で複数章を生成し、各 mode に対応するカテゴリが少なくとも 1 例ずつ出ることを確認)
- 日本語の文体が自然で、文字化けが v0.1 から増えていない

---

## §E. 影響範囲・後方互換

### E.1 データ構造の互換性

| 領域 | 影響 |
|---|---|
| `state.chronicle.fighterArchive` | 変更なし |
| `state.chronicle.spirit` | 変更なし |
| `state.chronicle.chaptersCache.chapters[].eraStats` | 拡張 (新規フィールド追加のみ。既存削除なし) |
| `state.chronicle.chaptersCache.chapters[]` その他 | 変更なし |
| `state.seasonHistory[].rank` | 既存値を読むだけ。変更なし |

### E.2 古いセーブの扱い

- `competitiveRecord` が未生成のキャッシュ → UI で `vsStier` をそのまま「VS S-TIER」表示にフォールバック
- ユーザーが「年代記を再構築」ボタンを押すか、新規シーズン進行で `lastBuiltSeason` が変わった瞬間に `competitiveRecord` が自動生成される
- マイグレーションコード追加不要

### E.3 v0.1 から削除する要素

なし。

### E.4 関連ファイル (実装側プラン参照)

実装の段取り・ファイル別変更点は `plans/chronicle-vnext-task.md` を参照。
