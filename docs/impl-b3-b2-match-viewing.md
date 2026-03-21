# B3/B2 試合観戦UI統一化 実装仕様書

## 概要

B3（挑戦状）とB2（対立解決マッチ）に、通常興行・War・PPV・ジュニアトーナメントと同等の試合観戦UIを追加する。

**対象イベント:**
- B3: 他団体エースからの1対1挑戦（名称「対抗戦」→「挑戦状」に変更）
- B2: 団内対立の試合決着（「試合で決着させる」選択時のみ）

**対象外:**
- War（対抗戦）: 既に完成済み
- 頂上決戦（Summit）: 既に完成済み
- 乱入マッチ: 通常興行に統合済み

---

## Phase 1: 名称変更（B3「対抗戦」→「挑戦状」）

ゲーム内表示テキストのうちB3に関するものを「挑戦状」に変更する。
**Warの「対抗戦」はそのまま残す。** 区別の基準: コード上 `event.type === 'B3'` の文脈は「挑戦状」、War文脈は「対抗戦」。

### 変更箇所一覧

#### engine.js
| 行付近 | 現在 | 変更後 | 備考 |
|--------|------|--------|------|
| 1722 | `対抗戦 ${ev.won ? '勝利' : '敗北'}` | `挑戦状 ${ev.won ? '勝利' : '敗北'}` | スナップショット |
| 1824 | `S${e.season} 対抗戦（${result}）` | `S${e.season} 挑戦状（${result}）` | キャリアサマリー |
| 10585 | コメント `// B3: 他団体からの対抗戦` | `// B3: 他団体からの挑戦状` | コメントのみ |
| 10839 | コメント `── B3: 他団体からの対抗戦` | `── B3: 挑戦状` | コメントのみ |
| 10848 | `対抗戦オファーを断った` | `挑戦状を断った` | 辞退テキスト |
| 10869 | `対抗戦で${orgName}を返り討ち！` | `挑戦状で${orgName}を返り討ち！` | 勝利テキスト |
| 10873 | `対抗戦で${orgName}に敗北` | `挑戦状で${orgName}に敗北` | 敗北テキスト |
| 10877 | `対抗戦は引き分け` | `挑戦状は引き分け` | 引き分けテキスト |

#### app.js
| 行付近 | 現在 | 変更後 |
|--------|------|--------|
| 5515 | コメント `// B3: 対抗戦` | `// B3: 挑戦状` |
| 5553 | コメント `対抗戦は isWarMatch=true` | `挑戦状は isWarMatch=true` |
| 5854 | `header: '⚔ 対抗戦 第${idx + 1}試合'` | ← **これはWar文脈。変更しない** |

#### ui-common.js
| 行付近 | 現在 | 変更後 |
|--------|------|--------|
| 85 | `…対抗戦を申し込む` | `…挑戦状を叩きつける` |
| 5234 | `⚔️ ${orgName}からの対抗戦オファー` | `⚔️ ${orgName}からの挑戦状` |
| 5284 | `対抗戦結果` | `挑戦状 結果` |
| 5309 | `対抗戦 — 結果` | `挑戦状 — 結果` |

#### ui-render.js
| 行付近 | 現在 | 変更後 |
|--------|------|--------|
| 988 | `⚔ 対抗戦` | `⚔ 挑戦状` |
| 990 | `⚔ 対抗戦の申し入れ` | `⚔ 挑戦状` |
| 2199 | `対抗戦・頂上決戦・統一トーナメント` | → **変更しない**（Warを含む一般説明文） |

#### data.js — B3テンプレート（10296-10300行付近）
テキスト内の「対抗戦」を「挑戦状」に変更。detail文も合わせて修正。
ただし **WAR_POST_DIALOGUE / WAR_CHALLENGER_DIALOGUE 内のセリフテキスト中の「対抗戦」はWar用なので変更しない。**
B3チャレンジャーのセリフ（WAR_CHALLENGER_DIALOGUE）はB3でも使われているが、セリフ文中に「対抗戦」があるものは自然な表現の範囲なので個別判断。

---

## Phase 2: B3 試合前VS画面 + 観戦フロー

### 2-1. 新しいUI表示フロー

**現状:**
```
B3 Step0: careOverlay（オファー通知）→ 受ける/断る
B3 Step1: careOverlay（代表選手選択）
B3 Step2: simulateMatch → careOverlay（_buildB3Step3: テキスト結果のみ）
```

**改修後:**
```
B3 Step0: careOverlay（オファー通知）→ 受ける/断る     ← 変更なし
B3 Step1: careOverlay（代表選手選択）                   ← 変更なし
B3 Step2: showResultOverlay（VS対峙画面 + 観戦/スキップ）← 新規
  → 観戦: battleOverlay（battle-engine.html iframe）   ← 新規
  → スキップ: simulateMatch → 結果画面へ
B3 Step3: showResultOverlay（フル試合結果カード）        ← 大幅改修
```

### 2-2. VS対峙画面（B3用）

`app.js` の `_executeLargeEventMatch()` 内、`event.type === 'B3'` ブランチを改修。

**既存の処理:**
1. simulateMatch を即実行
2. enrichedEvent に結果添付
3. applyLargeEventEffect で状態適用
4. showLargeEventModal(step=2) で careOverlay にテキスト結果表示

**改修後の処理:**
1. VS対峙画面を showResultOverlay に表示（新関数 `_renderB3MatchPreview`）
2. 「試合を観る」→ battle-engine iframe で観戦 → receiveBattleResult で結果受信
3. 「スキップ」→ simulateMatch で即解決
4. どちらの場合も → B3結果画面へ（新関数 `_renderB3MatchResult`）

#### `_renderB3MatchPreview(event, playerFighter, challenger)` — 新規関数（ui-common.js）

showResultOverlay / showResultBox に描画。Warの `renderWarMatchPreview` を参考に以下を表示:

- ヘッダー: `Challenge Match` / `⚔️ 挑 戦 状`
- サブヘッダー: `${event.orgName}からの挑戦を受けて立つ`
- セリフ吹き出し（左右）: `pickDialogueLine(PPV_OPPONENT_LINES, fighter)` — Warと同じプール
  - 吹き出しスタイル: 白背景（#f0f0f0）+ 黒文字、中央寄せ、話者名は上部に色付き小文字（UI共通ルール②準拠）
- スタンド画像対峙: 左=playerFighter（scaleX(-1)で反転）、右=challenger
  - 画像取得: `getStandUrl(id)`
- OVR表示: 左=青系グラデ、右=赤系（敵団体色 `orgCfg.color` があればそれを使用）
- 能力値対比バー（PW/SP/TE/ST/MN）: Warの `_warStatRow` を再利用
  - 左右対称レイアウト（UI共通ルール①準拠）
- トレイト表示（あれば）: Warと同形式
- ボタン:
  - `🎬 試合を観る` → `App.b3WatchMatch()`
  - `≫ スキップ` → `App.b3SkipMatch()`

#### `App.b3WatchMatch()` — 新規関数（app.js）

Warの `warWatchMatch` と同じパターン:
1. `battleOverlay` を表示
2. iframe に `START_MATCH` メッセージを送信
3. matchInfo.header = `⚔ 挑戦状`
4. matchTier = 2（ビッグマッチ）
5. BGM: `iwashiro_elevate_perfect.ogg`（Warと同じ）

#### `App.b3SkipMatch()` — 新規関数（app.js）

1. `Engine.battle.simulateMatch(playerFighter, challenger, rng, 2)` を実行
2. 結果を `_b3Preview.matchResult` に格納
3. B3結果適用 + 結果画面表示へ

#### `App._receiveB3BattleResult(data)` — 新規関数（app.js）

`receiveBattleResult` 内に B3 ルーティングを追加:
```js
// B3 context: route to B3 handler
const b3 = App._b3Preview;
if (b3 && b3.watching) {
  App._receiveB3BattleResult(data);
  return;
}
```

iframe から受信した結果を WM format に変換し、既存の B3 結果適用ロジック（applyLargeEventEffect step=2 + relationships + breakthrough）を実行。

#### 状態管理: `App._b3Preview`

```js
App._b3Preview = {
  event,           // B3イベントオブジェクト
  playerFighter,   // プレイヤー選手
  challenger,      // 相手選手
  watching: false,  // iframe 観戦中フラグ
  matchResult: null // 試合結果
};
```

### 2-3. B3 試合結果画面

#### `_renderB3MatchResult(event, matchResult, playerFighter, challenger, state)` — 新規関数（ui-common.js）

showResultOverlay / showResultBox に描画。通常興行の `renderShowResult` 内の1試合カード構造を踏襲:

- ヘッダー: `Challenge Match` / `⚔️ 挑戦状 — 結果`
  - 勝利=緑系ボーダー、敗北=赤系ボーダー
- 対戦団体名サブテキスト: `vs ${event.orgName}`
- 選手肖像（左右レイアウト）: 勝者大（120px）/ 敗者小（88px）
  - 勝者: gold border + shadow、名前 gold
  - 敗者: dim border、名前 sub color
  - 画像: `getPortraitUrl(id)` — portraitImg fallback
- セリフ吹き出し（勝者・敗者）:
  - 勝者側: `pickDialogueLine(RIVALRY_MATCH_REACTION.winnerLines, winner)` — 因縁系
  - 敗者（挑戦者）側: `pickDialogueLine(WAR_POST_DIALOGUE.result_lose/result_win, challenger)`（既存B3Step3と同じ）
  - 吹き出しスタイル: UI共通ルール②（白#f0f0f0 + 黒文字 + 中央寄せ）
- 勝者バッジ: `🏆 ${winnerName} 勝利` / `DRAW`
- 決まり手 + ターン数: `Engine.formatFinish(finType, finMove) / ${turns}ターン`
- MQ行: 星 + 数値（通常興行と同じ形式）
- HPバー: `_hpComparisonBar(leftName, hpLeft, rightName, hpRight)` — 既存関数をそのまま使用（UI共通ルール①準拠）
- 試合ログ: `<details>` 折りたたみ（通常興行と同じ形式）
- 了解ボタン → careOverlay ではなく showResultOverlay を閉じる → renderWeekScreen()

### 2-4. 既存関数の改修

#### `_buildB3Step3()` — 廃止（使われなくなる）

Step2の結果表示は `_renderB3MatchResult` に置き換わるため、`_buildB3Step3` は呼ばれなくなる。
削除するか、fallback として残すかは実装時に判断。

#### `_executeLargeEventMatch()` のB3ブランチ — 大幅改修（app.js 5514行〜）

現在の即時simulateMatch → careOverlay表示を、VS画面表示に置き換える:

```js
} else if (event.type === 'B3') {
  const fighterId = prevResult.selectedFighterId;
  const playerFighter = G.roster.find(f => f.id === fighterId);
  const challenger = event.challenger;
  if (!playerFighter || !challenger) return;

  // VS対峙画面を表示（simulateMatchはまだ実行しない）
  App._b3Preview = { event, playerFighter, challenger, watching: false, matchResult: null, prevResult };
  _renderB3MatchPreview(event, playerFighter, challenger);
}
```

試合実行と結果適用は `b3WatchMatch` / `b3SkipMatch` → `_finalizeB3Match` に移動。

#### `_finalizeB3Match(matchResult)` — 新規関数（app.js）

現在の `_executeLargeEventMatch` B3ブランチ内にある以下のロジックをそのまま移植:
1. enrichedEvent 作成
2. `applyLargeEventEffect(step=2)` で trust/orgPop/popularity 適用
3. `relationships.applyMatchResult(isCrossOrg=true)` で因縁ブースト
4. ブレークスルー判定
5. careerBestMQ 更新
6. 新聞パネルイベント push
7. `_renderB3MatchResult()` で結果画面表示

---

## Phase 3: B2 試合前VS画面 + 観戦フロー

### 3-1. 新しいUI表示フロー

**現状:**
```
B2 Step0: careOverlay（対立報告）→ 話し合い/試合/放置
B2 Step1: careOverlay（介入選択）→ f1激励/f2激励/中立
B2 Step2: simulateMatch → careOverlay（_buildB2Step3: テキスト結果のみ）
```

**改修後:**
```
B2 Step0: careOverlay（対立報告）→ 話し合い/試合/放置     ← 変更なし
B2 Step1: careOverlay（介入選択）→ f1激励/f2激励/中立     ← 変更なし
B2 Step2: showResultOverlay（VS対峙画面 + 観戦/スキップ）  ← 新規
  → 観戦: battleOverlay（battle-engine.html iframe）     ← 新規
  → スキップ: simulateMatch → 結果画面へ
B2 Step3: showResultOverlay（フル試合結果 + 対立解決サマリー）← 大幅改修
```

### 3-2. VS対峙画面（B2用）

#### `_renderB2MatchPreview(event, f1, f2, interventionChoice)` — 新規関数（ui-common.js）

B3と同構造だが以下が異なる:
- ヘッダー: `Conflict Resolution` / `💥 決 着 の 試 合`（紫×赤テーマ）
- 介入バフ表示: `🤫 ${name}を激励済み（OVR+5バフ）` タグ（interventionChoice が 0 or 1 の場合）
- 両選手とも自団体: 左=紫系、右=赤系のカラースキーム
- OVRの下に trust / 士気 表示（団体名の代わり）
- 能力値対比バー: 左=紫、右=赤

#### `App.b2WatchMatch()` / `App.b2SkipMatch()` — 新規関数

B3と同パターン。matchTier = 2。
BGM: `iwashiro_elevate_perfect.ogg`（ビッグマッチ共通）。

#### 状態管理: `App._b2Preview`

```js
App._b2Preview = {
  event,
  f1, f2,              // 介入バフ適用済みの一時コピー
  f1Original, f2Original, // バフ前の原本
  interventionChoice,
  watching: false,
  matchResult: null
};
```

### 3-3. B2 試合結果画面

#### `_renderB2MatchResult(event, matchResult, f1, f2, interventionChoice, effectResult, state)` — 新規関数（ui-common.js）

B3結果画面と同構造 + 以下の追加要素:

- 介入バフタグ（VS画面と同じ）
- セリフ: `pickDialogueLine(RIVALRY_MATCH_REACTION, winner/loser)` — 両者自団体なので因縁セリフを使用
- **対立解決サマリーパネル**（下部、緑ボーダーの囲み）:
  - 勝者: trust +X, 士気 +Y
  - 敗者: trust -X, 士気 -Y
  - 因縁変動: +Z（「試合を通じてライバル意識が芽生えた」等）
  - これらの値は `applyLargeEventEffect(step=2)` の結果から取得

### 3-4. 既存関数の改修

#### `_executeLargeEventMatch()` のB2ブランチ — 大幅改修（app.js 5482行〜）

B3と同様、即時simulateMatch → VS画面表示に置き換え:

```js
if (event.type === 'B2') {
  const intervention = prevResult.interventionChoice;
  let f1 = G.roster.find(f => f.id === event.fighter1);
  let f2 = G.roster.find(f => f.id === event.fighter2);
  if (!f1 || !f2) return;

  // 介入バフ適用（一時コピー）
  const f1Buffed = { ...f1 };
  const f2Buffed = { ...f2 };
  if (intervention === 0) { /* f1にバフ */ }
  else if (intervention === 1) { /* f2にバフ */ }

  App._b2Preview = { event, f1: f1Buffed, f2: f2Buffed, f1Original: f1, f2Original: f2, interventionChoice: intervention, watching: false, matchResult: null, prevResult };
  _renderB2MatchPreview(event, f1Buffed, f2Buffed, intervention);
}
```

#### `_finalizeB2Match(matchResult)` — 新規関数（app.js）

現在の `_executeLargeEventMatch` B2ブランチ内ロジックを移植:
1. winner判定（'fighter1' / 'fighter2' / 'draw'）
2. enrichedEvent 作成
3. `applyLargeEventEffect(step=2)` 適用
4. `_renderB2MatchResult()` 表示

#### `_buildB2Step3()` — 廃止

`_renderB2MatchResult` に置き換え。

---

## Phase 4: receiveBattleResult ルーティング追加

`ui-common.js` 2907行付近の window message listener、および `app.js` の `receiveBattleResult` に B3/B2 の分岐を追加。

**追加するルーティング順序**（既存の JT → PPV → War → Show の後ではなく、War の後に挿入）:

```js
receiveBattleResult(data) {
  // ... existing: JT, PPV, War ...

  // B3 context
  const b3 = App._b3Preview;
  if (b3 && b3.watching) {
    App._receiveB3BattleResult(data);
    return;
  }
  // B2 context
  const b2 = App._b2Preview;
  if (b2 && b2.watching) {
    App._receiveB2BattleResult(data);
    return;
  }

  // ... existing: Show context ...
}
```

---

## Phase 5: escapeBattle 対応

`app.js` の `escapeBattle()` に B3/B2 の fallback を追加:

```js
// B3
const b3 = App._b3Preview;
if (b3 && b3.watching) {
  b3.watching = false;
  App.b3SkipMatch(); // スキップで解決
  return;
}
// B2
const b2 = App._b2Preview;
if (b2 && b2.watching) {
  b2.watching = false;
  App.b2SkipMatch();
  return;
}
```

---

## CSS追加（index.html）

B3/B2 専用のCSSは最小限。ほとんどは既存の War CSS クラス（`.mc-*`, `.war-*`）と showResult CSS（`.sr-*`）を再利用する。

追加が必要なのはヘッダーのカラーバリエーション程度。インラインスタイルで対応可能な範囲。

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `engine.js` | B3テキスト「対抗戦」→「挑戦状」（8箇所） |
| `app.js` | `_executeLargeEventMatch` B3/B2ブランチ改修、`b3WatchMatch/SkipMatch`、`b2WatchMatch/SkipMatch`、`_finalizeB3Match`、`_finalizeB2Match`、`_receiveB3/B2BattleResult`、`receiveBattleResult` ルーティング追加、`escapeBattle` 追加、`_b3Preview`/`_b2Preview` 状態 |
| `ui-common.js` | `_renderB3MatchPreview`、`_renderB3MatchResult`、`_renderB2MatchPreview`、`_renderB2MatchResult` 新規、`_buildB3Step3`/`_buildB2Step3` 廃止、B3テキスト「対抗戦」→「挑戦状」 |
| `ui-render.js` | B3テキスト「対抗戦」→「挑戦状」（2箇所） |
| `data.js` | B3テンプレートテキスト「対抗戦」→「挑戦状」（5箇所） |

---

## 実装順序

1. **Phase 1**: 名称変更（全ファイル横断、テキスト置換のみ）
2. **Phase 2**: B3 VS画面 + 観戦フロー + 結果画面
3. **Phase 3**: B2 VS画面 + 観戦フロー + 結果画面
4. **Phase 4**: receiveBattleResult ルーティング
5. **Phase 5**: escapeBattle 対応

Phase 2〜5 は実質的に一体の作業。Phase 1 は独立して先に実施可能。

---

## テスト方針

- B3: orgPop > 20 の状態でB3イベント発生を待ち、受諾 → 代表選手選択 → VS画面表示 → 観戦/スキップ両方確認 → 結果画面の全要素（肖像・セリフ・決まり手・MQ・HPバー・ログ）表示確認
- B2: trust低下ペアで対立発生 → 「試合で決着」選択 → 介入選択 → VS画面（バフ表示確認）→ 観戦/スキップ → 結果画面 + 対立解決サマリー確認
- escapeBattle: 観戦中にエスケープボタン → スキップで正常復帰
- auto-sim: 100シーズン回して B3/B2 が正常終了することを確認（UI表示はないが、ロジック破壊がないことの検証）
