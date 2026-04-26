# 年度MVPレース＋新聞4面新設 指示書 v2.0

> **対象**: Claude Code
> **所要時間目安**: 8〜12時間
> **承認状態**: ✅ 設計合意済み（ポイント表・UI仕様すべて確定済み、本ドキュメントが最終仕様）
> **前提**: `feature/mvp-race-page4` ブランチを main から切って作業
> **モデル選定**: Opus 推奨（複数モジュール横断 + バグ修正 + 新規ロジック + 新規UI実装の複合タスク）

---

## このタスクの目的

年度MVP決定の仕組みを「シーズンを通じた **結果ベースのポイント争い**」に切り替え、その経過を新聞4面で常時可視化することで、選手間の競争にドラマを生み出す。

具体的には：

- 既存の OVR/人気支配的な MVP 算出を廃止し、**PPV成績・王座防衛・対抗戦勝敗**などシーズン中の実績で稼ぐ方式へ
- 毎週末に全選手のポイントを再集計し、**全団体合同の MVPレース TOP10** を新聞4面（年間レース）に常設
- 順位変動・ナラティブ・タグラインを併記し、「あの選手が抜いた」「あの王者は防衛で稼いでいる」というシーズン中の物語を生む

既存の `selectMVP` 関数（OVR支配的）は廃止し、年度末MVPは「シーズン最終週のMVPレース1位＝そのままMVP」として直結させる。

---

## 確定仕様

### ポイント表

#### ベース・実績

| 要素 | ポイント | データソース |
|---|---|---|
| OVR | 数値そのまま加算 | `Engine.util.ov(fighter)` |
| PPV優勝（サミット勝者） | +42 | history `ppvMainEvent` `won=true` `isSummit=true` |
| PPV準優勝（サミット敗者） | +15 | history `ppvMainEvent` `won=false` `isSummit=true` |
| PPV出場（サミット以外） | +10 | history `ppvMainEvent` `isSummit=false` |
| 王座奪取 | +11 | history `titleWin` |
| 王座防衛 | +13 × 防衛回数 | history `titleDefense` の件数 |
| シーズン終了時の王座保持 | +8 | `state.titles.world.championId` / `state.aiOrgs[].titles.world.championId` |
| ドーム興行メイン出場 | +4 | history `domeMain`（result問わず） |
| MQ85超の試合 | +5 × 試合数 | history `bigMatch`（新規追加） |
| シーズン最高MQ補正（団体内） | (最高MQ − 70)、70未満は0 | `seasonStats.bestMQ` / `aiOrgs[].seasonBestMQ` |

#### 挑戦状(B3) / 対抗戦(war)

| 要素 | ポイント | データソース |
|---|---|---|
| 個人試合勝利 | +16 | history `war` `won=true` / `b3Challenge` `won=true` |
| 個人試合敗北 | −12 | history `war` `won=false` / `b3Challenge` `won=false` |
| 引き分け | 0 | （加点なし） |
| 挑戦状辞退時の代表候補（自団体OVRトップ3） | 各 −4 | history `b3Decline`（新規） |
| 拒否されたAI挑戦者 | +4 | history `b3Rejected`（新規・AI側） |

#### 団体ランクボーナス

| 要素 | ポイント |
|---|---|
| 所属団体ランク1位 | +10 |
| 所属団体ランク2位 | +5 |

### 集計仕様

| 項目 | 仕様 |
|---|---|
| 集計タイミング | 毎週末（`advanceWeek` 末尾で再計算） |
| 集計範囲 | 全団体合同（プレイヤー＋全AI団体）混合TOP10 |
| 引退/移籍選手の扱い | 当年シーズン中に引退・移籍した選手も、当該シーズンの集計対象に含める |
| 順位変動表示 | 前週比の矢印（▲N / ▼N / − / NEW） |

### UI仕様（新聞4面）

**確定モックアップ**: `docs/ui/mockups/mvp-race-page4-final.html`（このHTMLが正、CSSクラス名・サイズ・色・余白すべて準拠）

#### ページ全体構造

```
[紙面ヘッダー (週刊グラップル + 第○年度・第○号)]
[セクションラベル "📊 4面 ・ 年間レース"]
[H2 大見出し]
[リード解説段落 (4-5行、Noto Serif JP、左赤ボーダー)]
[メタ情報行 ("第27週時点 ・ 注目選手 TOP3 ・ 全団体合同")]
[1位カード (フルサイズ特集)]
[2位カード (横長コンパクト)]
[3位カード (横長コンパクト)]
[黒田寸評ブロック]
[ディバイダ "— 4 位 ・ 以 下 追 走 —"]
[4-10位リスト 7行]
```

#### 1位カード詳細

- 横幅 780px - padding × 2、グリッド `200px 1fr`
- 左カラム (200px): キャラクター画像 (aspect 3:4 = 200×267) + RANK 1 オーバーレイ + 団体エンブレム重ね
- 右カラム: 名前(24px Noto Serif JP) + 矢印チップ / メタチップ群（現王者/エース/27歳など）/ OVRボックス + PTSボックス（OVR/PTS各32pxの大数字、Bebas Neue）/ ドラマナラティブ（12.5px、左赤ボーダー、4-5行）/ 4要素内訳バッジ（王者/PPV/対抗戦/ドーム）
- カード枠: `2px solid #c8a040`（カチッとした深めの金、**発光・グロー禁止**）
- 背景: `linear-gradient(135deg, rgba(212,168,67,0.16), rgba(248,238,210,0.85))` のシンプルな線形グラデのみ
- シャドウ: 通常のドロップシャドウ `0 4px 14px rgba(0,0,0,0.18)`（金発光なし）

#### 2位・3位カード詳細

- グリッド `110px 1fr 110px`
- 左カラム (110px): キャラ画像 (aspect 3:4 = 110×147) + RANK ミニラベル + 団体エンブレム重ね (26px)
- 中央カラム: 名前(17px) + 矢印 / メタ情報1行 / ドラマ短文（11.5px、3-4行）/ 内訳ピル4つ（王者/PPV/対抗戦/ドーム、各9.5px丸ピル）
- 右カラム (110px): OVRボックス + PTSボックス（22pxの中数字）
- 2位は左に銀ボーダー `4px solid rgba(160,160,160,0.65)`
- 3位は左に銅ボーダー `4px solid rgba(176,116,49,0.65)`

#### 4-10位リスト詳細

7行構成、各行のグリッド `26px 30px 36px 22px 1fr 64px 56px`：
1. 順位（Bebas Neue 18px）
2. 矢印チップ（▲N / ▼N / − / NEW）
3. キャラ顔サムネ（円形 36×36）
4. 団体エンブレム（22×22）
5. 名前(12.5px) + 団体名(9.5px) + **タグライン1行**(10.5px Noto Serif JP、左赤ボーダー)
6. OVRボックス（小、16px数字）
7. ポイント（Bebas Neue 18px）

#### 見出し＋解説の3段構成

```html
<h2 class="np-page-headline">
  鳳条院、独走の夏 ―― だが追走者の足音が近づいている
</h2>
<p class="np-page-lead">
  第27週時点、首位を走る {1位選手} は {主要要素} で {合計}pt。 ...
  そのわずか {差}pt 後ろにつけるのが、{2位選手の主要稼ぎ}の {2位選手}。 ...
  さらに {差}pt 差で {3位選手の特徴}の {3位選手} が虎視眈々と上位を狙う。
  残り {残り週} 週、{今後のイベント名} —— このレースの主人公として年末を迎えるのは、果たして誰になるのか。
</p>
<div class="np-page-meta">
  第{週}週時点 ・ 注目選手 TOP3 ・ 全団体合同
</div>
```

リード解説は自動生成テンプレートで、TOP3選手の主要稼ぎ要素・差・残り週数・予定イベントを動的に埋め込む。詳細はステップ9参照。

---

## 実装するもの

1. **既存PPV履歴記録バグの修正** — `careerRecord.history` への `ppvMainEvent` イベント追加（敗者・サミット非参加者も含む）
2. **新規履歴イベント4種** — `b3Challenge` / `b3Decline` / `b3Rejected` / `bigMatch`
3. **既存 `war` 履歴イベントの `won` フィールド整備確認**
4. **`Engine.mvpRace` 名前空間新設** — `calcSeasonPoints(fighter, orgId, season, state)` / `recalcRanking(state)` / `generateNarrative(entry)` / `generateTagline(entry)` / `generatePageLead(rankings, state)`
5. **`state.mvpRace` データ構造** — 毎週末再集計したランキング・前週順位・自動生成文言を保持
6. **既存 `selectMVP` の置き換え** — MVPレース最終週の1位がそのままMVPに
7. **新聞4面 (📊 4面 年間レース)** — タブ追加、`_npRenderPage4()` 実装、`mvp-race-page4-final.html` のCSS構造をそのまま `np-mvprace-*` プレフィックスで移植
8. **CSS** — `np-mvprace-*` クラス群（`src/index.html` に約400行）

### 実装しないもの

- 個人 vs 個人の挑戦システム新設（B3挑戦状と対抗戦のみが対象）
- MVPレースの順位予測機能
- ライバル団体内ランキングの個別表示（全団体合同のみ）
- 過去シーズンのMVPレース履歴の閲覧機能（当年のみ）
- リアルタイム順位変動アニメーション
- 既存の `awardMVP` 履歴イベントの形式変更（互換性維持）
- 既存 `selectRookie` / `selectBestMatch` / `selectMediaAward` の変更（MVPのみ置き換え）
- 既存 `careerRecord.ppvMainEventWins` カウンタの仕様変更（互換性維持・履歴追加と併存）
- 4面の月次特集差し込み（1面トップへのMVPレース速報差し込みは v2 では実装しない）

---

## 事前に必ず読むべきドキュメント

この順序で読むこと：

1. `CLAUDE.md` — アーキテクチャ原則・開発ルール
2. 本指示書（最重要、本ファイル）
3. **`docs/ui/mockups/mvp-race-page4-final.html`** — 確定UIのソース。CSS構造・サイズ・色・余白すべてここから移植。これが UI の正
4. `src/management.js` L1832-1930 — `Engine.career` 定義と `careerRecord` 構造
5. `src/management.js` L12222-12450 — 既存の `Engine.awards.generate` / `selectMVP`（廃止対象だが理解が必要）
6. `src/management.js` L10544-10600 — PPV Grand Final 処理（バグ修正対象）
7. `src/management.js` L15336-15700 — B3挑戦状の生成・処理（履歴記録の追加対象）
8. `src/management.js` L10750-10800 — 対抗戦（war）の処理
9. `src/ui-render.js` L5395-6170 — 新聞独立タブと既存3面の実装（4面追加の参考）
10. `src/index.html` L7140-7600 — 既存の `np-*` CSS（新CSSの配置先）

---

## 既存コードの影響範囲

### 変更するファイル

| ファイル | 変更内容 |
|---|---|
| `src/management.js` | (1) `Engine.mvpRace` 名前空間新設 / (2) PPV履歴記録の修正 (L10544 周辺) / (3) B3挑戦状処理に履歴記録追加 (L15600周辺) / (4) 対抗戦処理に履歴記録追加（必要な場合のみ）/ (5) `selectMVP` の置き換え / (6) `advanceWeek` 末尾でランキング再集計フック |
| `src/app.js` | (1) 興行処理に `bigMatch` イベント記録追加 / (2) 保存/ロード時の `state.mvpRace` 取り扱い |
| `src/ui-render.js` | (1) 4面タブボタン追加 (L5404周辺) / (2) `_npRenderPage4()` 新規実装 / (3) `_newspaperSubPage` 受け入れ値拡張 |
| `src/index.html` | `np-mvprace-*` CSS クラス追加（既存 `np-*` CSS の近く、L7600 付近） |
| `test/auto-sim.js` | `state.mvpRace.rankings` の出力を追加（任意） |

### 触ってはいけない既存コード

- 既存の `careerRecord.ppvMainEventWins` カウンタ更新ロジック（履歴イベント追加と**併存**させる。カウンタは維持）
- 既存の `Engine.awards.selectRookie` / `selectBestMatch` / `selectMediaAward` / `getChampions` / `checkHallOfFame`
- 既存の `awardMVP` history イベントの形式（profile・chronicle・ranking画面で参照）
- 既存の `war` history イベントの形式（chronicle で参照。`won` フィールド追加は互換）
- 既存の B3 辞退時の orgPop ペナルティ（`L15617-15620` の `-1` ペナルティはそのまま維持し、新規 `b3Decline` イベントを併存追加）
- 新聞1〜3面のレンダリングロジック
- `pendingAwards` の形式（`mvp` フィールドの中身は引き続き使う）

---

## 実装手順

### ステップ1 ・ PPV履歴記録バグの修正

`src/management.js` L10544 周辺の PPV Grand Final 処理に、`careerRecord.history` への `ppvMainEvent` イベント追加を組み込む。**既存の `ppvMainEventWins` カウンタ更新は維持**したまま、history への push を追加する。

#### 修正箇所

L10552 の `_updatePpvWins` ヘルパー直前に、history 追加用ヘルパーを追加：

```javascript
const _addPpvEvent = (fighters, fid, won, isSummit) => fighters.map(f => {
  if (f.id !== fid) return f;
  const cr = f.careerRecord || Engine.career.createRecord();
  const ev = { type: 'ppvMainEvent', season: s.season, week: s.week, won, isSummit };
  return { ...f, careerRecord: { ...cr, history: [...(cr.history || []), ev] } };
});
```

#### サミット勝者・敗者・非参加者すべてに記録

- サミット勝者: `_addPpvEvent(roster, winnerId2, true, true)` を `_updatePpvWins` 直後に追加
- サミット敗者: 新規追加。プレイヤー・AI団体それぞれの roster で `_addPpvEvent(..., loserId2, false, true)`
- サミット非参加者: L10589 の `card.forEach((m, idx) => { if (m.isSummit) return; ... })` ブロックを拡張し、各試合の `m.left` / `m.right` で `summitParticipants.has(f.id)` でない選手に `_addPpvEvent(..., f.id, false, false)`

> **二重カウント禁止**: 同じ選手にサミット記録と非サミット記録が二重に入らないよう、`summitParticipants.has(f.id)` チェックは必須。

### ステップ2 ・ B3挑戦状の履歴記録追加

`src/management.js` L15611 の `case 'B3':` ブロック内に、辞退時・試合結果時の history 記録を追加。

#### B3辞退時 (L15616-15621 を拡張)

既存の orgPop -1 ペナルティ処理を残したまま、追加で：

1. 自団体OVRトップ3に `b3Decline` 履歴を記録（MVPレース −4 ポイント対象）
2. AI挑戦者に `b3Rejected` 履歴を記録（MVPレース +4 ポイント対象）

```javascript
const ov = Engine.util.ov;
const top3Ids = roster.slice().sort((a, b) => ov(b) - ov(a)).slice(0, 3).map(f => f.id);
roster = roster.map(f => {
  if (!top3Ids.includes(f.id)) return f;
  return Engine.career.addEvent(f, {
    type: 'b3Decline', season: state.season, week: state.week,
    orgName: event.orgName || '他団体'
  });
});

const challengerOrgId = event.orgId;
const challengerId = event.challenger?.id;
if (challengerId && challengerOrgId && state.aiOrgs?.[challengerOrgId]?.roster) {
  const aiOrgsUpdated = { ...state.aiOrgs };
  aiOrgsUpdated[challengerOrgId] = {
    ...aiOrgsUpdated[challengerOrgId],
    roster: aiOrgsUpdated[challengerOrgId].roster.map(f => {
      if (f.id !== challengerId) return f;
      return Engine.career.addEvent(f, {
        type: 'b3Rejected', season: state.season, week: state.week,
        rejectedByOrg: 'player'
      });
    })
  };
  return { ...returnObj, aiOrgs: aiOrgsUpdated };
}
```

#### B3試合結果時 (L15628-15649 を拡張)

`if (step === 2)` ブロックの試合結果適用箇所で、勝者・敗者双方に `b3Challenge` 履歴を追加：

```javascript
// プレイヤー側 (selectedFighter)
roster = roster.map(f => {
  if (f.id !== fighterId) return f;
  const won = result.winner === 'left' ? true
            : result.winner === 'right' ? false
            : null;
  return Engine.career.addEvent(f, {
    type: 'b3Challenge', season: state.season, week: state.week,
    won, opponentOrgName: orgName
  });
});

// AI側 (event.challenger)
const aiChallengerId = event.challenger?.id;
const aiOrgId = event.orgId;
if (aiChallengerId && aiOrgId && state.aiOrgs?.[aiOrgId]?.roster) {
  const aiOrgsUpdated = { ...state.aiOrgs };
  aiOrgsUpdated[aiOrgId] = {
    ...aiOrgsUpdated[aiOrgId],
    roster: aiOrgsUpdated[aiOrgId].roster.map(f => {
      if (f.id !== aiChallengerId) return f;
      const won = result.winner === 'left' ? false  // AI側はrightの逆
                : result.winner === 'right' ? true
                : null;
      return Engine.career.addEvent(f, {
        type: 'b3Challenge', season: state.season, week: state.week,
        won, opponentOrgName: 'プレイヤー団体'
      });
    })
  };
  // ... aiOrgsを返り値に含める
}
```

> **MVPレース集計時のルール**: `b3Challenge` `won === true` で +16、`won === false` で −12、`won === null` で 0 ポイント。

### ステップ3 ・ 対抗戦(war)履歴の整備確認

既存の `app.js:8707-8717` および `management.js:6488` 周辺で、選手単位の `war` history イベントが `won` フィールド付きで全選手分（プレイヤー側・AI側・AI vs AI）正しく記録されているかを検証。

**確認手順**:

1. `app.js:8707` プレイヤー対抗戦勝者: `Engine.career.addEvent(c, { type: 'war', season, week, opponentOrg, won: true })` を確認
2. `app.js:8717` プレイヤー対抗戦敗者: `won: false` を確認
3. `management.js:6488` 周辺 AI vs AI: 同形式で記録があるか確認、なければ追加

`won` が記録されていない選手分があれば補完する。

### ステップ4 ・ MQ85超試合の履歴記録追加

`src/app.js` L5680 周辺、興行後処理（`validMatches.forEach` 内）に MQ85超試合の選手単位記録を追加。

```javascript
validMatches.forEach((m, idx) => {
  const r = results[idx];
  if (!r || typeof r.mq !== 'number' || r.mq < 85) return;
  const participants = m.matchType === 'tag'
    ? [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2]
    : [m.left, m.right];
  participants.forEach(charId => {
    if (charId == null) return;
    roster = roster.map(c => {
      if (c.id !== charId || c.isIntrusion) return c;
      return Engine.career.addEvent(c, {
        type: 'bigMatch', season: s.season, week: s.week, mq: r.mq
      });
    });
  });
});
```

`management.js` 内の AI 興行処理（`processAIWeek` ）でも同等の `bigMatch` 記録を追加。

### ステップ5 ・ `Engine.mvpRace` 名前空間の新設

`src/management.js` の `Engine.career` ブロック直後（L1895 付近）に、新規名前空間 `Engine.mvpRace` を追加。

#### 5-1. ポイント設定

```javascript
mvpRace: {
  // 🔧 ポイント設定（チューニング可能）
  POINTS: {
    PPV_CHAMPION: 42,
    PPV_RUNNER_UP: 15,
    PPV_PARTICIPATION: 10,
    TITLE_WIN: 11,
    TITLE_DEFENSE_PER: 13,
    TITLE_HOLD_AT_END: 8,
    DOME_MAIN_APPEARANCE: 4,
    BIG_MATCH_PER: 5,
    BIG_MATCH_THRESHOLD: 85,
    SEASON_BEST_MQ_BASE: 70,
    WAR_WIN: 16,
    WAR_LOSS: -12,
    B3_DECLINE: -4,
    B3_REJECTED: 4,
    ORG_RANK_1: 10,
    ORG_RANK_2: 5,
  },
  // ...
}
```

#### 5-2. `calcSeasonPoints(fighter, orgId, season, state)` 実装

選手ひとり分のシーズンポイントと内訳を返す。返り値の `breakdown` は新聞4面で表示するためのキー集合：

```javascript
return {
  points: number,
  breakdown: {
    ovr: number,           // OVR分
    ppv: number,           // PPV合計（優勝/準V/出場）
    title: number,         // 王座合計（奪取/防衛/期末保持）
    dome: number,          // ドーム合計
    mq: number,            // 大MQ + 最高MQ補正
    war: number,           // 対抗戦+B3試合の勝敗合計
    b3: number,            // B3辞退/拒否
    orgRank: number,       // 団体ランクボーナス
    meta: {
      titleWins, titleDefenses, isCurrentChamp,
      ppvChampion, ppvRunnerUp, ppvParticipation,
      bigMatches, bestMQ,
      warWins, warLosses, warDraws,
      domeAppearances,
      orgRank,
      role,                // fighter.role
      age,                 // fighter.age
    }
  }
}
```

#### 5-3. `recalcRanking(state)` 実装

全団体合同 TOP10 を返す。前週順位を引き継ぎ、矢印情報を付与：

```javascript
recalcRanking(state) {
  const candidates = [];

  // プレイヤー団体
  (state.roster || []).forEach(f => {
    if (f.isIntrusion || f.isRental) return;
    const result = Engine.mvpRace.calcSeasonPoints(f, 'player', state.season, state);
    candidates.push({
      fighterId: f.id, fighterName: f.name, portrait: f.portrait,
      orgId: 'player', orgName: Engine.awards._orgName(state, 'player'),
      ovr: Engine.util.ov(f),
      points: result.points, breakdown: result.breakdown,
    });
  });

  // AI団体（各orgIdごと）
  if (state.aiOrgs) {
    Object.keys(state.aiOrgs).forEach(orgId => { /* 同様 */ });
  }

  // 引退選手（当シーズン引退分のみ）
  (state.retiredFighters || []).forEach(f => {
    if ((f.retiredSeason || 0) !== state.season) return;
    const orgId = f._orgIdAtRetire || 'player';
    /* 同様 */
  });

  candidates.sort((a, b) => b.points - a.points);

  // 前週順位の引き継ぎ
  const prevRankMap = {};
  ((state.mvpRace && state.mvpRace.rankings) || []).forEach(r => {
    prevRankMap[r.fighterId] = r.rank;
  });

  const top10 = candidates.slice(0, 10).map((c, i) => {
    const rank = i + 1;
    const prevRank = prevRankMap[c.fighterId] || null;
    return {
      ...c,
      rank,
      prevRank,
      arrow: prevRank == null ? 'new'
           : prevRank > rank ? 'up'
           : prevRank < rank ? 'down'
           : 'same',
      arrowDelta: prevRank == null ? null : prevRank - rank,
    };
  });

  // ナラティブとタグラインを付与
  top10.forEach(entry => {
    if (entry.rank <= 3) {
      entry.narrative = Engine.mvpRace.generateNarrative(entry, state);
    } else {
      entry.tagline = Engine.mvpRace.generateTagline(entry, state);
    }
  });

  return {
    season: state.season,
    week: state.week,
    lastUpdated: { season: state.season, week: state.week, offSeason: !!state.offSeason },
    rankings: top10,
    pageLead: Engine.mvpRace.generatePageLead(top10, state),
    pageHeadline: Engine.mvpRace.generatePageHeadline(top10, state),
  };
},
```

#### 5-4. ナラティブ・タグライン生成（ステップ9で詳細）

`generateNarrative(entry, state)` `generateTagline(entry, state)` `generatePageLead(rankings, state)` `generatePageHeadline(rankings, state)` を実装。詳細はステップ9参照。

### ステップ6 ・ 毎週末再集計フックの組み込み

`src/management.js` の `advanceWeek` 関数で、**通常週進行が完了する直前**（`return { state: s, events }` の直前）で：

```javascript
// MVPレース毎週末再集計（オフシーズン中も継続）
s = { ...s, mvpRace: Engine.mvpRace.recalcRanking(s) };
```

> **早期リターン分岐では再集計しない**: 対抗戦・挑戦状発生で早期 return する分岐（`pendingEvent`発生時）では再集計しない。再集計はイベント未発生で週が確定する週末のみ。

### ステップ7 ・ 既存 `selectMVP` の置き換え

`src/management.js` L12343 `Engine.awards.selectMVP` を以下のように書き換える：

```javascript
selectMVP(rng, state) {
  const ov = Engine.util.ov;
  const race = Engine.mvpRace.recalcRanking(state);
  if (!race.rankings || race.rankings.length === 0) return null;
  const winner = race.rankings[0];

  let wf = null;
  if (winner.orgId === 'player') {
    wf = (state.roster || []).find(f => f.id === winner.fighterId);
  } else if (state.aiOrgs?.[winner.orgId]) {
    wf = state.aiOrgs[winner.orgId].roster.find(f => f.id === winner.fighterId);
  }
  if (!wf) {
    wf = (state.retiredFighters || []).find(f => f.id === winner.fighterId);
  }
  if (!wf) return null;

  const wins = wf.wins || 0, losses = wf.losses || 0, draws = wf.draws || 0;
  const totalMatches = wins + losses + draws;
  const winRate = totalMatches > 0 ? Math.round(wins / totalMatches * 100) : 0;

  let defenses = 0;
  if (winner.orgId === 'player' && state.titles?.world?.championId === wf.id) {
    defenses = state.titles?.world?.defenses || 0;
  } else if (winner.orgId !== 'player' && state.aiOrgs?.[winner.orgId]) {
    const aiTitles = state.aiOrgs[winner.orgId].titles;
    if (aiTitles?.world?.championId === wf.id) defenses = aiTitles.world.defenses || 0;
  }

  return {
    id: wf.id, name: wf.name, portrait: wf.portrait,
    orgName: winner.orgName, ovr: ov(wf), popularity: wf.popularity,
    age: wf.age, style: wf.style || 'Allround',
    isPlayerOrg: winner.orgId === 'player',
    winRate, defenses, wins, losses, draws,
    isChampion: winner.breakdown?.meta?.isCurrentChamp || false,
    mvpScore: Math.round(winner.points * 10) / 10,  // 互換
    mvpPoints: winner.points,
    mvpBreakdown: winner.breakdown,
  };
},
```

### ステップ8 ・ 新聞4面の実装

#### 8-1. タブボタン追加

`src/ui-render.js` L5404 周辺：

```javascript
let html = `<div class="np-tabs">
  <button class="np-tab${_newspaperSubPage === 1 ? ' active' : ''}" onclick="setNewspaperSubPage(1)">📰 1面 興行</button>
  <button class="np-tab${_newspaperSubPage === 2 ? ' active' : ''}" onclick="setNewspaperSubPage(2)">⚔ 2面 団体比較</button>
  <button class="np-tab${_newspaperSubPage === 3 ? ' active' : ''}" onclick="setNewspaperSubPage(3)">🔥 3面 因縁列伝</button>
  <button class="np-tab${_newspaperSubPage === 4 ? ' active' : ''}" onclick="setNewspaperSubPage(4)">📊 4面 年間レース</button>
</div>`;
```

`if (![1,2,3].includes(_newspaperSubPage))` を `if (![1,2,3,4].includes(_newspaperSubPage))` に修正。
ページ分岐に `else if (_newspaperSubPage === 4) html += _npRenderPage4();` を追加。

#### 8-2. `_npRenderPage4()` 実装

**`docs/ui/mockups/mvp-race-page4-final.html` の構造をそのまま移植**。HTML構造はモックアップの通り、CSSクラス名は **`p2-*` を `np-mvprace-*` にリネーム** して移植する。具体的なクラス名対応：

| モックアップ | 実装 |
|---|---|
| `p2-list` | `np-mvprace-list` |
| `p2-card.rank-1` | `np-mvprace-card np-mvprace-card-1` |
| `p2-card.rank-2` / `rank-3` | `np-mvprace-card np-mvprace-card-minor np-mvprace-rank-2` / `-3` |
| `p2-photo-col` | `np-mvprace-photo` |
| `p2-photo-mini` | `np-mvprace-photo-mini` |
| `p2-rank-overlay` | `np-mvprace-rank-overlay` |
| `p2-rank-mini` | `np-mvprace-rank-mini` |
| `p2-emb-overlay` / `p2-emb-mini` | `np-mvprace-emb-overlay` / `np-mvprace-emb-mini` |
| `p2-info-col` | `np-mvprace-info` |
| `p2-mini-mid` | `np-mvprace-minor-mid` |
| `p2-name` / `p2-mini-name` | `np-mvprace-name` / `np-mvprace-minor-name` |
| `p2-arrow-chip` / `p2-mini-arrow` | `np-mvprace-arrow` / `np-mvprace-minor-arrow` |
| `p2-meta-row` / `p2-meta-chip` | `np-mvprace-meta` / `np-mvprace-meta-chip` |
| `p2-stat-bar` / `p2-stat-box` | `np-mvprace-stats` / `np-mvprace-stat-box` |
| `p2-narrative` / `p2-mini-narrative` | `np-mvprace-narrative` / `np-mvprace-minor-narrative` |
| `p2-badges` / `p2-badge` | `np-mvprace-badges` / `np-mvprace-badge` |
| `p2-mini-bd-line` / `p2-mini-bd-pill` | `np-mvprace-minor-pills` / `np-mvprace-minor-pill` |
| `p2-mini-num` / `p2-mini-num-box` | `np-mvprace-minor-num` / `np-mvprace-minor-num-box` |
| `mvp-list-row` (4-10位リスト) | `np-mvprace-list-row` |
| `mvp-list-name .tagline` | `np-mvprace-list-name .np-mvprace-list-tagline` |
| `mvp-divider` | `np-mvprace-divider` |
| `np-page-headline` / `np-page-lead` / `np-page-meta` | そのまま（汎用） |

実装の骨格：

```javascript
function _npRenderPage4() {
  const seasonNum = G.season || 1, weekNum = G.week || 1;
  let html = `<div class="np-paper">${_npPaperHeader(seasonNum, weekNum)}<div class="np-content">`;

  const race = G.mvpRace;
  if (!race || !race.rankings || race.rankings.length === 0) {
    html += `<div class="np-empty">📊 まだMVPレースのデータがない。週を進めると更新される。</div></div></div>`;
    return html;
  }

  // セクションラベル + 大見出し + リード解説 + メタ
  html += `<div class="np-sec-gold">📊 4面 ・ 年間レース</div>`;
  html += `<h2 class="np-page-headline">${race.pageHeadline}</h2>`;
  html += `<p class="np-page-lead">${race.pageLead}</p>`;
  html += `<div class="np-page-meta">第${weekNum}週時点 ・ 注目選手 TOP3 ・ 全団体合同</div>`;

  // TOP3カード
  html += `<div class="np-mvprace-list">`;
  if (race.rankings[0]) html += _npMvpRaceRank1Card(race.rankings[0]);
  if (race.rankings[1]) html += _npMvpRaceMinorCard(race.rankings[1]);
  if (race.rankings[2]) html += _npMvpRaceMinorCard(race.rankings[2]);
  html += `</div>`;

  // 黒田寸評（generatePageLeadから引用 or 別生成）
  html += `<div class="np-kuroda">...</div>`;

  // 4-10位
  html += `<div class="np-mvprace-divider">— 4 位 ・ 以 下 追 走 —</div>`;
  for (let i = 3; i < race.rankings.length; i++) {
    html += _npMvpRaceListRow(race.rankings[i]);
  }

  html += `</div></div>`;
  return html;
}
```

各補助関数 `_npMvpRaceRank1Card` / `_npMvpRaceMinorCard` / `_npMvpRaceListRow` は、モックアップHTMLの該当部分を JS テンプレートに変換して実装する。**ピクセル値・色・サイズは絶対にモックアップから変えない**。

選手画像 / 団体エンブレム参照は本実装のヘルパー：
- 選手画像: `getUpperUrl(fighterId)` または相当の関数
- 団体エンブレム: `image/org/org-${orgId}-0.png`
  - `orgId === 'player'` の場合は `org-player-0.png`
  - AI団体は `org-${orgId.replace('org_', '')}-0.png` の形式（既存コードのパターンを確認）

#### 8-3. CSS

モックアップ `mvp-race-page4-final.html` の `<style>` ブロックから、`p2-*` セクションと `mvp-list-*` セクション、`np-page-*` セクション、`np-mvprace-divider` セクションを抽出し、上記対応表でクラス名をリネームして `src/index.html` の既存 `np-*` CSS の近く（L7600 付近）に配置する。

色値・サイズ・余白はすべてモックアップ通りに維持。**1位カードの発光・グロー系シャドウは絶対に追加しない**（モックアップの仕様）。

### ステップ9 ・ ナラティブ・タグライン自動生成テンプレート

`Engine.mvpRace` 名前空間内に以下4関数を実装する：

#### 9-1. `generateNarrative(entry, state)` — TOP3用ドラマ文（4-5行）

選手の主要稼ぎ要素・特徴に応じて4-5行のドラマ文を生成。`entry.breakdown.meta` から最も特徴的な要素を抽出してテンプレートを選ぶ。

優先順位（上から順に判定、最初にマッチしたテンプレートを使う）：

1. **王者で防衛3回以上** → 「{ベルト名}を{N}度防衛し続ける現役最強。{年齢}歳。今期は{追加要素}。{シーズンの位置づけ}。」
2. **PPV優勝** → 「先週のPPV決勝で42pt一撃を獲得。{年齢}歳の挑戦者として、{差}pt差で首位を追う。{今後の展望}。」
3. **対抗戦4勝以上** → 「対抗戦で{N}連勝の英雄。{ベルトの有無}とも、{勝ち星}で示し続ける異端のエース。」
4. **MQ85超3試合以上** → 「MQ85超を{N}本量産する職人型。観客の心を最も動かす一人。{ドーム出場} ・ {その他要素}。」
5. **新人(careerSeasons===1)で TOP10入り** → 「キャリア1年目で TOP{rank}入り。{年齢}歳、台頭の年。{主要稼ぎ要素}。」
6. **その他（フォールバック）** → 「{主要要素}で{合計}pt。{役職}として{シーズンの貢献}。」

各テンプレートは2-3個のバリエーションを用意し、`Engine.rng.derive(state.rngSeed, fighter.id, season, week)` で決定的に選ぶ。

例：

```javascript
generateNarrative(entry, state) {
  const m = entry.breakdown.meta;
  const rng = Engine.rng.create(Engine.rng.derive(state.rngSeed, entry.fighterId, state.season, state.week));

  // 王者で防衛多め
  if (m.isCurrentChamp && m.titleDefenses >= 3) {
    const templates = [
      `王座を${m.titleDefenses}度防衛し続ける現役最強。今期はドーム興行${m.domeAppearances}戦すべてに登場し、紙面から名前が消えた週は一度もない。年明けからシーズン折返しまでずっと首位を譲らない、まさに今期の主役。`,
      `${m.titleDefenses}度の防衛戦を制した王者。${m.age}歳、円熟期のエースが団体の屋台骨を支えている。`,
      // ...
    ];
    return Engine.rng.pick(rng, templates);
  }

  // PPV優勝
  if (m.ppvChampion >= 1) { /* ... */ }

  // 対抗戦の英雄
  if (m.warWins >= 4) { /* ... */ }

  // ... フォールバック
  return `${m.role}としてシーズンを戦う。第${state.week}週時点で${entry.points}pt。`;
}
```

#### 9-2. `generateTagline(entry, state)` — 4-10位用一行（20-40文字）

TOP3より短く、特徴を1行でまとめる。同じ優先順位ロジック：

```javascript
const taglines = {
  champWithDefenses: [
    `王座防衛${n}回。{org}の屋台骨。`,
    `{n}度の防衛で安定。${age}歳の貫禄。`,
  ],
  ppvWinner: [
    `PPV優勝で42pt獲得。次戦で更なる飛躍を。`,
  ],
  // ...
};
```

#### 9-3. `generatePageHeadline(rankings, state)` — H2見出し

TOP3の状況に応じて見出しを生成：

- **1位独走（2位との差 30pt以上）** → 「{1位選手}、独走の{季節} ―― 追走者は遠く」
- **接戦（2位との差 20pt以下）** → 「{1位選手}、独走の{季節} ―― だが追走者の足音が近づいている」
- **混戦（TOP3が15pt以内）** → 「TOP3が大接戦 ―― {1位}・{2位}・{3位}が拮抗」

#### 9-4. `generatePageLead(rankings, state)` — リード解説（4-5行）

TOP3の主要稼ぎ要素・差・残り週数を埋め込む：

```
第{週}週時点、首位を走る{1位選手}は{1位の主要要素}で{合計}pt。{シーズン序盤からの位置づけ}。
そのわずか{2位との差}pt後ろにつけるのが、{2位の主要稼ぎ}の{2位選手}。
さらに{3位との差}pt差で{3位の特徴}の{3位選手}が虎視眈々と上位を狙う。
残り{52-週}週、{予定される主要イベント} —— このレースの主人公として年末を迎えるのは、果たして誰になるのか。
```

季節判定：`state.week` が 1-13=春、14-26=夏、27-39=秋、40-52=冬 など。「夏」「秋」などを文中に挿入。

### ステップ10 ・ 検証

1. **`test/auto-sim.js` を実行** — 5シーズン分シミュレートし、各シーズン末で：
   - `state.mvpRace.rankings` の TOP10 が出力されること
   - 1位選手の `points` が想定範囲（80-200pt程度）に収まること
   - 引退選手が当シーズンには含まれること
   - ナラティブ・タグラインが空文字列にならないこと

2. **手動確認シナリオ**：
   - 王座を5回防衛 → MVPレース TOP3 に入ること
   - PPV優勝者 → MVPレース上位に来ること
   - 挑戦状を辞退 → 自団体OVRトップ3のポイントが −12 (=−4×3) 減ること
   - 挑戦状で勝利 → 代表選手が +16 されること
   - シーズン途中の引退選手 → 引退時点までのポイントで TOP10 に残れる場合は表示されること

3. **`validateGameState`** — `state.mvpRace` が新規フィールドとして save/load を通っても壊れないこと

4. **新聞4面の表示確認**：
   - タブ切り替えが動作
   - TOP3が確定モックアップ通りのレイアウトで表示
   - 4-10位リストにタグラインが1行表示
   - 順位変動矢印が前週比で正しく描画
   - 選手名・キャラ画像クリックで `showFighterPopup` が呼ばれる
   - データなし時のプレースホルダーが正しく表示
   - 1位カードに発光・グロー系シャドウが**入っていない**ことを確認

5. **モックアップとの差分確認** — `docs/ui/mockups/mvp-race-page4-final.html` をブラウザで開いて並べ、ピクセル単位で見た目が一致することを確認

---

## チューニング可能パラメータ（🔧）

実装後、ゲームバランスを見て調整する候補：

- `Engine.mvpRace.POINTS.*` — 各要素のポイント値
- `Engine.mvpRace.POINTS.SEASON_BEST_MQ_BASE` — 70未満を切り捨てる閾値
- `Engine.mvpRace.POINTS.BIG_MATCH_THRESHOLD` — 大MQ試合の判定値（85）
- `_npRenderPage4` の TOP表示数（現在10、`race.rankings.slice(0, 10)` を変更で調整可能）
- ナラティブ・タグラインのテンプレート文言

---

## ハマりポイント・注意事項

1. **二重カウント防止** — PPV履歴記録で、サミット参加者にサミット記録 + 非サミット記録が二重に入らないよう `summitParticipants.has(f.id)` チェック必須。

2. **引退選手の `_orgIdAtRetire`** — 既存コードでこのフィールドが付いているか要確認。なければ引退処理時に追加するか、`retiredFighters` 内の選手は別途 `orgId` を保持する仕組みを用意。

3. **B3 AI挑戦者の `b3Rejected` 記録** — `state.aiOrgs[challengerOrgId]` 経由でAI挑戦者本人にイベントを追加する際、不変性を維持して `aiOrgs` を新オブジェクトとして返すこと。

4. **対抗戦の AI vs AI** — `management.js:6488` 周辺の AI vs AI 対抗戦で、選手単位の `war` history が記録されているか必ず確認。されていなければ追加。されていない場合 AI 選手のMVPレース順位が常に低くなる。

5. **`advanceWeek` の早期リターン** — 対抗戦・挑戦状発生で早期 return する分岐があるが、ここでは MVPレース再集計を呼ばないこと。再集計は週末確定時のみ。

6. **保存データの互換** — `state.mvpRace` は新規フィールドなので、旧セーブをロードしたとき `undefined` で扱われる。`G.mvpRace` 参照箇所は `if (!race || !race.rankings) ...` の防御を入れる。

7. **`Engine.awards._orgName`** — 既存ヘルパーを使用。MVPレース内でも一貫して同じ関数で団体名を解決すること。

8. **発光エフェクト禁止** — 1位カードのCSSで `box-shadow` の発光（`0 0 14px rgba(212,168,67,0.4)` のような長距離・無方向シャドウ）は**絶対に追加しない**。モックアップの確定仕様。すべて方向性のあるドロップシャドウのみ。

9. **キャラ画像のフォールバック** — `getUpperUrl(fighterId)` が画像を返さない場合のフォールバックを用意（既存コードのパターンに合わせる）。

10. **タグラインの長さ制御** — 4-10位のタグラインが長すぎると行が崩れる。テンプレートは40文字以内を目安に作成する。

---

## 完了条件

- [ ] PPV履歴記録バグが修正され、`careerRecord.history` に `ppvMainEvent` イベントが正しく追加される（勝者・敗者・サミット非参加者すべて）
- [ ] B3挑戦状で `b3Challenge` `b3Decline` `b3Rejected` イベントが正しく記録される
- [ ] MQ85超試合で `bigMatch` イベントが記録される（プレイヤー興行・AI興行両方）
- [ ] AI vs AI 対抗戦の選手単位 `war` 履歴が `won` フィールド付きで記録される
- [ ] `Engine.mvpRace.calcSeasonPoints` / `recalcRanking` / `generateNarrative` / `generateTagline` / `generatePageHeadline` / `generatePageLead` が動作する
- [ ] 毎週末 `state.mvpRace` が更新される
- [ ] `selectMVP` がMVPレース1位を返すように置き換わっている
- [ ] 新聞4面が表示され、TOP3カード・順位変動矢印・ナラティブ・4-10位リスト（タグライン付き）・大見出し・リード解説が**確定モックアップと同じ見た目**で描画される
- [ ] 1位カードに発光・グロー系シャドウが入っていない（カチッとした金枠のみ）
- [ ] `test/auto-sim.js` で5シーズン回しても破綻しない
- [ ] `validateGameState` を通る
- [ ] save/load が正常に動作する

---

## 参考: 既存実装との関係

| 既存システム | 関係 |
|---|---|
| `Engine.career.addEvent` | 履歴イベント追加に使用（不変） |
| `Engine.awards.generate` | 内部で `selectMVP` を呼ぶ箇所のみ書き換え。他の賞は不変 |
| `pendingAwards.mvp` | 形式は維持（`mvpScore` 互換 + `mvpPoints` `mvpBreakdown` 追加） |
| `awardMVP` history イベント | 形式不変。`_checkAndShowAwards` で従来通り追加される |
| 新聞1〜3面 | 不変 |
| chronicle / profile 画面 | 不変（`awardMVP` イベントを引き続き参照） |
| `careerRecord.ppvMainEventWins` カウンタ | 不変。history 追加と併存 |

---

## 添付ドキュメント

| ファイル | 役割 |
|---|---|
| `docs/ui/mockups/mvp-race-page4-final.html` | **UI確定仕様**。CSS構造・サイズ・色・余白すべての正 |
| `docs/ui/mockups/mvp-race-page4-mockup-confirmed-v2.html` | 上記の同一ファイル別名（参照用） |
| `plans/mvp-race-and-page4-plan-v1.md` | 旧版計画書（参考用、本v2.0で上書き） |
