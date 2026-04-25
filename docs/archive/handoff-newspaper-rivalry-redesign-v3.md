# 新聞・団体比較リデザイン Phase 3 引き継ぎ v3.0

## このドキュメントについて

`docs/archive/handoff-newspaper-rivalry-redesign-v2.md`(v2) は 2026-04-26 に commit 予定で完了済み。本書は **Phase 2 で残った調整・改善・取りこぼし** を次セッションで実装するための引き継ぎ書。

**v2 で完了済み(本書ではいじらない):**
- `.paper-header / .page-nav / .sec-label / .kuroda-block / .newspaper-photo-frame / .other-org-news-grid / .org-bar-radar / .db-cmp-vs-mark-circle` 共通CSS
- 新聞1面: 200×240 額装写真(upper画像)、ダイジェスト ★列、他団体ニュース 2カラム + 黒田寸評
- 団体比較2面: SVGレーダー廃止 → 左右対称バー型レーダー4軸(エース力/層の厚み/集客力/タイトル力)、VS 円章中央重ね
- KURODA 配列 7種に約120本拡充
- `.ndt-port` 28→48px

**Phase 3 作業範囲(優先度順):**
1. **実機週進めての視覚回帰確認** — v2 では空セーブ + モック topStory での検証のみ。本物のセーブで複数週進め、新聞アーカイブ切替・各 storyType・★列分布・他団体ニュース寸評の見栄えを確認
2. **ダイジェスト表のレイアウト調整** — `.ndt-port` 48px 化で隣の名前列との余白バランスが崩れる可能性あり
3. **handoff §2-2 の写真 130px 案の再検討** — v2 では48pxで止めた。テーブル幅とのトレードオフを評価し、必要なら専用カードレイアウトに切替
4. **`.db-cmp-vs-mark-circle` の視覚調整** — 1fr×2 で並べたカード間に円章を重ねる構造、実画面で重なり方を見て位置・サイズ・影を調整
5. **`.sec-label` グローバル昇格の最終整理** — 因縁列伝3面のスコープ付き既存定義 (`.rivalry-history .sec-label`) を残置したまま。重複削除すべきか、共存のままか判断
6. **specs/ 反映** — v2 完了報告は roadmap には書いたが `specs/` 側は未更新。新規 spec `specs/newspaper-and-orgcompare-spec-v2.0.md` を作るか、既存 spec を更新する

---

## Step 0: 事前準備

```bash
git fetch origin
git checkout -b feat/newspaper-redesign-phase3
```

確認: `docs/archive/handoff-newspaper-rivalry-redesign-v1.md` 上部の「黒田幸子の文体設計」セクションは引き続き必読。Phase 3 で新たな文面を書く場合(後述§3-2参照)もこの設計に従う。

---

## Step 1: 実機検証(優先度最高)

### 1-1. セーブを進める

`test/fixtures/chronicle-demo-30seasons-seed4242.json` を読み込んで開始 → 興行を打つ → 新聞を生成 → アーカイブが溜まる、という流れで複数週進める。

```js
// preview_eval から実行できる手順例
(() => {
  // 1. 既存セーブをロード(ある場合)
  // または新規ゲームで数週進める
  // showScreen('week'); advanceWeek(); ...
})()
```

### 1-2. 確認すべきポイント

各セルで `preview_eval` + `preview_inspect` を使う:

- **新聞1面 一面記事**:
  - playerStory(自団体メイン): `.newspaper-photo-frame` の 200×240 額装、左寄せレイアウト、隣の見出し本文との gap
  - 他団体story(`aiChampionChange / aiAceRetirement / aiBreakthrough` 等): 額装の出方、新規 `kurodaQuote` 寸評との重なり
  - characterId が無い topStory(団体イベント等)で `photoSrc` が空のとき、額装の `display:none` 相当が効くか or 空ボックスが残るか
- **ダイジェストテーブル**:
  - `.ndt-port` 48px が `.ndt-name` の text-overflow と衝突しないか
  - ★列の幅 64px が画面幅圧迫しないか
  - 寸評行の `colspan="3"` が ★列も含めて正しく伸びているか
- **他団体ニュース 2カラム**:
  - subStories が 1件しかないとき(片側空白)、2件、3件、4件以上(自動折返し)それぞれの見栄え
  - `.kuroda-block` 内テキストが長文(120字超)のとき折返し
  - portrait が無い characterId フォールバックの 文字アイコンとの整合性
- **団体比較 4軸バー**:
  - 全軸 0% / 全軸 100% / 極端な差(プレイヤー90 vs ライバル10)の3パターン
  - 軸名+差分(`+N`/`-N`)の配置、特に -30 以下の長い文字列で center 110px に収まるか
  - リバルカラー (`rc`) によって右側 bar-fill のグラデーションが見えるか
- **`.db-cmp-vs-mark-circle` 円章**:
  - desktop(>900px) で position:absolute が効いて中央に重なるか、両カードに半分ずつ被さるか
  - tablet(<900px) で position:relative フォールバックが想定通り縦並びになるか
- **因縁列伝3面 リグレッション**:
  - `.rivalry-history .sec-label` の見た目(font-size:11px / color:#5b4b34 / border-left: 3px solid #8b1a1a)がグローバル `.sec-label` と完全に同値で表示されているか

### 1-3. 視覚スクリーンショット

`preview_screenshot` は新聞・団体比較ページで timeout しがちなので、`preview_inspect` で computed style を厳密に確認するのを優先する。
スクリーンショットが必要なら、ブラウザで手動確認 → ユーザに見てもらう方針。

---

## Step 2: ダイジェスト表のレイアウト調整

### 2-1. `.ndt-port` 48px の実機確認後に判断

**選択肢A**: 48px 維持(v2 現状)
- 利点: テーブル幅変更なし、リスク最小
- 欠点: handoff §2-2 の「130px」目標から大きく後退

**選択肢B**: 130px へ拡大、テーブル構造を捨てて専用カードレイアウト化
- 各試合を `<table tr>` ではなく `<div class="ndt-row">` にし、`grid-template-columns: auto 1fr auto auto` 等
- 必要 CSS: `.ndt-row` `.ndt-row-photos` `.ndt-row-meta` 新設(約30行)
- 既存 `.news-digest-table` 系 CSS は残置 or 削除

**選択肢C**: 80px(中間) + 行高拡大
- 視覚インパクト中、リスク中

実装者の判断。実機で 48px のテーブルを見て決める。

### 2-2. 寸評列の文字数バランス

`NEWSPAPER_DIGEST_COMMENTS` の各 pool は中程度の長さの文章が多い。★列との並びでコメント行が窮屈に見えるなら、`.ndt-comment` の `padding` / `font-size` を調整。

---

## Step 3: KURODA 配列の追加拡充(任意)

v2 で +120本追加したが、ランダム pick の体感重複が気になるなら以下の配列に追加余地あり:

| 配列 | v2後の件数 | 追加余地 |
|---|---|---|
| `KURODA_HEADLINES.{各tier}` | 18-21 | +3〜5本可 |
| `KURODA_WAR_RECORD.{noRecord, heavyLosing, slightLosing, slightWinning, heavyWinning}` | 5-8 | +2本可(v2 では未拡充) |
| `KURODA_MATCHUP_FLAVOR.momentum.{hotStreak, coldStreak, injuryReturn}` | 4 | +2本可(v2 では未拡充) |
| `KURODA_SPOTLIGHT.nemesis` | 3 | +2本可(v2 では未拡充) |
| `KURODA_SHOW_RATING.stars0-5` | 5-8 | 必要に応じて |
| `KURODA_PREVIEW.{fanExpect, rivalry, titleOutlook, generic}` | 4-5 | 必要に応じて |

文体は v1 handoff「黒田幸子の文体設計」遵守。お決まりフレーズ「本紙は」「〜と書いておく」「数字は嘘をつかない」「40年見てきた中で」を 2〜3割の頻度で散布。

---

## Step 4: `.sec-label` 整理

### 現状(v2 実装)

`src/index.html` に2箇所定義が共存:

1. **グローバル**(L1140 付近、v2 で追加):
```css
.sec-label{font-family:'Oswald',...; color:#5b4b34; border-left:3px solid #8b1a1a; ...}
.sec-label-gold{...}
```

2. **スコープ付き**(L1167/1182、v1 で因縁列伝専用に追加):
```css
.rivalry-history .sec-label{...} /* 同値 */
.rivalry-relations .sec-label-gold{...} /* 同値 */
```

### 整理方針

- 同値なら **スコープ付き定義を削除**してグローバルに統一(行数削減)
- ただし削除前に `_renderDbRivalry` の HTML が `.sec-label` クラスを直接使っているか確認(使っているなら削除しても影響なし)
- もし `.rivalry-history` 配下で違うスタイルにしたい将来の拡張を残すなら、スコープ付きを残置(v2 現状)

### 検証

スコープ付き定義削除後、preview で因縁列伝3面を開き `.rivalry-history .sec-label` の computed style がグローバル `.sec-label` と同一であることを `preview_inspect` で確認。

---

## Step 5: specs/ への反映

CLAUDE.md ルールに従い、本作業完了時に `specs/` を更新する必要がある。

### 選択肢A: 新規 spec 作成

`specs/newspaper-and-orgcompare-spec-v2.0.md` を新設し、Phase 1+2 の確定仕様(共通CSSの命名規約、4軸の意味、額装サイズ、KURODA モード制との接続点)をまとめる。CLAUDE.md L155-180 のファイル索引に追記。

### 選択肢B: 既存 spec 更新

該当する既存 spec が無ければ新規一択。`specs/rivalry-chronicle-spec-v1.0.md` は3面専用なので別。

---

## Step 6: 完了処理

1. `docs/game-system-roadmap.md` を更新(Phase 3 完了報告)
2. `specs/` 更新(§5)、CLAUDE.md 索引追記
3. 本書 `docs/handoff-newspaper-rivalry-redesign-v3.md` を `docs/archive/` へ移動
4. ローカルコミット(push しない)

---

## 実装ファイル一覧(変更想定)

| ファイル | 変更内容 |
|---|---|
| `src/index.html` | `.ndt-port` 微調整 / `.ndt-rating` 幅 / 円章 box-shadow 等 / `.sec-label` スコープ整理 |
| `src/ui-render.js` | ダイジェストレイアウト変更(選択肢Bの場合) / 額装の null フォールバック調整 |
| `src/kuroda-text.js` | 任意の追加拡充(§3) |
| `specs/newspaper-and-orgcompare-spec-v2.0.md` | 新規(§5) |
| `CLAUDE.md` | ファイル索引に新規 spec 追記 |
| `docs/game-system-roadmap.md` | 完了報告 |

---

## Phase 2 で残した既知の妥協点(参考)

- **handoff v2 §2-2 の写真 130px**: 実装は 48px に留めた。テーブル構造の制約のため。Phase 3 で再評価
- **handoff v2 §3-1 の「タイトル力 = legacyScore/50」**: 採用せず、既存 `playerScores.starPower` に一対一マッピング。auto-sim 回避のため。Phase 3 で本来の計算式を検討するならスコープ拡張
- **`_renderNewspaperPlayerShow` の左右VS写真(80px)**: handoff v2 では対象外明記。一面写真のみ200×240に拡大、playerShow セクションは不変

---

## 参考: v2 完了時点の実装事実

- 4軸レーダーの軸スコアは `Engine.database.getOrgCompareAnalysis` の `playerScores`/`rivalScores` をそのまま使用。計算式は変更なし
- `KURODA_NEWS_COMMENT` の seeded pick: `Engine.rng.derive(season, week, idx, 0xC0DC)`
- ダイジェスト ★算出: `MQ - expectedMQ` の差分から `+15→★5 / +5→★4 / -4以上→★3 / -15以上→★2 / それ以下→★1`、`isDraw` は ★3 固定
- v2 で追加された CSS の合計約60行(`src/index.html` 1138付近に挿入)
- v2 で追加された KURODA テキスト約120本(`src/kuroda-text.js`)

---

## 完了基準

- [ ] 実機で複数週進め、新聞・団体比較の全エッジケースを目視確認
- [ ] `.ndt-port` のサイズ判断が確定(48 / 80 / 130 / 専用レイアウトのいずれか)
- [ ] `.sec-label` 重複定義の方針が確定(残置 or 統合)
- [ ] specs/ への反映完了
- [ ] roadmap 更新、handoff v3 アーカイブ移動、ローカルコミット
