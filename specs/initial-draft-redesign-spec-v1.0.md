# 📋 初期ドラフト有料化・startRatio改修 設計書 v1.0

> **ステータス**: 🟢 構造確定（数値は実装後チューニング前提）
> **作成日**: 2026-03-13
> **依存**: scout-system-spec-v1.0.md / character-data-spec-v1.4.md / balance-adjustment-spec-v1.9.md
> **ロードマップ対応**: ドラフト改修
> **🔧マーク = 調整可能パラメータ**（実装後のバランスチューニング対象）

---

## 設計目的

1. **「OVR高い＝才能も高い」の相関を弱める** — startRatioのランダム幅拡大により、入団時OVRからNotion値（≒trainCap）を推測しにくくする。「見た目は弱いが実は逸材」「見た目は強いが天井が低い」を実現
2. **ドラフト候補に逸材を保証混入** — 6名中最低1名は逸材帯（potTotal≥740）を含むバランス制約。プレイヤーの目利き要素を強化
3. **ドラフトの有料化** — 既存の契約金算出（`calcAssessedValue`）を活用し、候補ごとに契約金を表示・徴収。逸材＝高額のシグナルがゲーム内ヒントとして機能する
4. **資金バランスの緊張感** — 初期資金5000万からドラフト契約金を差し引くことで、序盤の赤字経営期への圧迫が生まれる

---

## §1 startRatioの幅拡大

### §1.1 変更テーブル

入団時の値を算出する `startRatio` のランダム幅を拡大する。

| 年齢帯 | 現状 | 変更後 | 設計意図 |
|:------:|------|--------|---------|
| 18歳以下 🔧 | `0.55 + random(0, 0.10)` → 0.55〜0.65 | `0.40 + random(0, 0.30)` → **0.40〜0.70** | 最も未知数。同Notion値の選手間でOVR逆転が頻発 |
| 19〜20歳 🔧 | `0.65 + random(0, 0.10)` → 0.65〜0.75 | `0.50 + random(0, 0.25)` → **0.50〜0.75** | やや安定するがブレは残る |
| 21〜24歳 | `0.75 + random(0, 0.10)` → 0.75〜0.85 | **変更なし** | ドラフト候補には出現しない帯域。今回スコープ外 |
| 25歳以上 | `0.85 + random(0, 0.10)` → 0.85〜0.95 | **変更なし** | 同上 |

### §1.2 変更箇所（3箇所）

同一ロジックが3箇所に存在する。**すべて同一の値に揃える**こと。

| # | 場所 | 用途 | 現在の行（目安） |
|---|------|------|:---------------:|
| 1 | `Engine.rival.generateStartValues()` | AI団体メンバーの入団時値 | engine.js L2498-2511 |
| 2 | makeChar内のstartRatio算出 | プレイヤー団体（ドラフト/スカウト/FA）の入団時値 | engine.js L5878-5881 |
| 3 | `Engine.draft._entryRatio()` | ドラフト画面の**表示用OVR概算** | engine.js L7309-7311 |

### §1.3 `_entryRatio` の表示用概算への影響

`_entryRatio` は表示用の固定概算値（ランダムなしの代表値）。変更後は各帯域の**中央値**を返す。

```javascript
_entryRatio(age) {
  if (age <= 18) return 0.55;   // (0.40+0.70)/2 = 0.55
  return 0.625;                 // (0.50+0.75)/2 = 0.625
}
```

ただし表示用OVRと実際のOVRのズレは§1.1の幅拡大により必然的に大きくなる。ドラフト画面のOVR表示が「推定値」であることを明示する（§4.2参照）。

### §1.4 逆転の発生頻度（設計検証）

Notion値の異なる2名が18歳以下で入団した場合の、入団OVR逆転確率の概算：

| Notion差 | 現状（幅0.10） | 変更後（幅0.30） |
|:--------:|:-----------:|:-------------:|
| 5 | ほぼ0% | 約35% |
| 10 | 0% | 約20% |
| 15 | 0% | 約10% |
| 20以上 | 0% | 約3% |

Notion差5〜15の範囲（ドラフト候補の主要帯域）で有意な逆転が発生し、「OVRだけでは才能がわからない」体験が成立する。

---

## §2 ドラフト候補のpotTotal帯バランス制約

### §2.1 現状の問題

`generateDraftConfig()` は FAプールからOVR40-70帯のキャラを6名ランダム選出する。potTotalの分布は制御されておらず、6名全員が素材帯になることもある。

### §2.2 変更内容

候補6名のうち、**最低1名はpotTotal≥740（逸材帯）のキャラを含む**ことを保証する。

```javascript
function generateDraftConfig(seed) {
  // ... 既存のFAプール取得・OVRソート ...

  // Step 1: 逸材帯（potTotal≥740）の候補を1名確保
  const elitePool = midPool.filter(x => {
    const c = ALL_CHARS.find(ch => ch.id === x.id);
    const potTotal = c.pot.pw + c.pot.sp + c.pot.te + c.pot.st + c.pot.mn;
    return potTotal >= 740;  // 🔧 ROSTER_CFG.eliteThreshold
  });

  let guaranteed = [];
  if (elitePool.length > 0) {
    const eliteShuffled = seededShuffle(elitePool.map(x => x.id), rng);
    guaranteed = [eliteShuffled[0]];
  }

  // Step 2: 残り5名は既存ロジックで選出（guaranteed を除外）
  const guaranteedSet = new Set(guaranteed);
  const remainingPool = candidatePool.filter(x => !guaranteedSet.has(x.id));
  const remainShuffled = seededShuffle(remainingPool.map(x => x.id), rng);
  const remaining = remainShuffled.slice(0, ROSTER_CFG.draftCandidates - guaranteed.length);

  const candidates = [...guaranteed, ...remaining];
  // シャッフルして逸材の位置をランダム化（先頭固定を防ぐ）
  const finalCandidates = seededShuffle(candidates, rng);
  // ...
}
```

### §2.3 FAプールに逸材帯が不在の場合

`initRandomRoster` のtier振り分けで、逸材級（potTotal≥740）は高確率でS/A級団体に配属される。FAプールに逸材帯が1名もいない可能性がある。

| 対処 | 仕様 |
|------|------|
| 逸材不在時 | 保証なしにフォールバック。candidatePool全体からランダム6名を選出（現行動作と同じ） |
| ログ出力 | `console.warn('Draft: no elite candidate in FA pool')` を出力し、デバッグ可能にする |

### §2.4 OVR帯フィルタとの整合

逸材帯キャラは高Notion値のためOVRも高くなりやすいが、§1のstartRatio幅拡大により、入団時OVRが40-70帯に収まる確率は上がる。ただし確実ではないため、逸材保証枠のOVRフィルタは**緩和する**。

```javascript
// 逸材保証枠: OVR上限を80に緩和（通常候補は40-70） 🔧
const eliteOvrCap = 80;
const elitePool = withOvr.filter(x => {
  if (x.ovr > eliteOvrCap) return false;  // あまりに高OVRは除外
  const c = ALL_CHARS.find(ch => ch.id === x.id);
  const potTotal = c.pot.pw + c.pot.sp + c.pot.te + c.pot.st + c.pot.mn;
  return potTotal >= ROSTER_CFG.eliteThreshold;
});
```

---

## §3 ドラフト有料化

### §3.1 契約金の算出

既存の `Engine.scout.calcAssessedValue()` をドラフト候補にも適用する。

```javascript
// ドラフト候補の契約金算出（getCandidateInfo内で実行）
const charForAssess = {
  pw: entryPw, sp: entrySp, te: entryTe, st: entrySt, mn: entryMn,
  pot: t.pot,
  age: age
};
const rngForCost = Engine.rng.create(Engine.rng.derive(seed, 0xC057, id));
const av = Engine.scout.calcAssessedValue(charForAssess, rngForCost, 1);
// av.assessedValue = 契約金（万円）, av.assessedTier = ティアID
```

### §3.2 ドラフト候補の想定契約金レンジ

`calcAssessedValue` の出力は potTotal と curTotal の複合評価。ドラフト候補（17-19歳、入団時OVR低め）での想定：

| ティア | potTotal | 契約金レンジ 🔧 | ドラフト内の出現 |
|:------:|:--------:|:-------------:|:-------------:|
| 素材 | 〜549 | 50〜120万 | 多い（3-4名） |
| 原石 | 550〜689 | 120〜250万 | 1-2名 |
| 有望 | 690〜739 | 250〜500万 | 0-1名 |
| 逸材 | 740〜849 | 600〜1400万 | 1名（§2で保証） |
| 超逸材 | 850〜 | 1400〜3000万 | ほぼ出ない |

### §3.3 典型的な合計コスト

| パターン | 内訳 | 合計（目安） | 残金 |
|---------|------|:----------:|:----:|
| 安全策 | 素材×2 + 原石×1 | 250〜500万 | 4500〜4750万 |
| バランス | 素材×1 + 原石×1 + 逸材×1 | 800〜1800万 | 3200〜4200万 |
| 逸材狙い | 原石×1 + 有望×1 + 逸材×1 | 1000〜2100万 | 2900〜4000万 |
| 全張り | 有望×2 + 逸材×1 | 1100〜2400万 | 2600〜3900万 |

序盤の赤字経営（約280万/2週）を考慮すると、逸材を狙うほど序盤の資金繰りがタイトになるトレードオフが成立する。

### §3.4 fixed枠（2名）の扱い

fixed枠の2名は**無料**（契約金なし）。既存の所属選手としてスタートする設定。

| 枠 | 人数 | 契約金 | 選択 |
|----|:----:|:-----:|:----:|
| fixed（固定メンバー） | 2名 | 無料 | 選択不可（自動加入） |
| candidates（候補） | 6名中3名 | 有料（`calcAssessedValue`） | プレイヤーが選択 |

### §3.5 資金不足時の制約

| 状況 | 挙動 |
|------|------|
| 残金 < 候補の契約金 | その候補をグレーアウト。選択不可 |
| 3名選択済みの合計 > 残金 | 確認ボタンを無効化 |
| 全候補が資金不足で選べない | 後述 §3.6 |

### §3.6 最低保証

全候補が高額で1名も選べない事態を防ぐため：

- candidates 6名のうち**最低2名は素材帯（契約金120万以下）** 🔧 を保証
- §2の逸材保証と合わせて、6名の構成は「逸材1 + 素材2以上 + 残りランダム」

これにより初期資金5000万なら最低3名は確実に獲得可能。

### §3.7 completeDraft の処理追加

```javascript
completeDraft(state, picks, rng) {
  // ... 既存のロスター構築 ...

  // 契約金の合計算出・差し引き
  let totalCost = 0;
  picks.forEach(id => {
    const info = candidateInfoCache.find(c => c.id === id);  // §4で算出済みの情報
    totalCost += info.assessedValue || 0;
  });

  return {
    ...state,
    funds: state.funds - totalCost,  // ← 追加
    // ... 既存の返り値 ...
    gameLog: [
      `🎉 新団体設立！ 初期資金${state.funds}万でスタート。`,
      `📋 ドラフト完了！ ${roster.length}名の所属選手で船出。（契約金合計: ${totalCost}万）`,
      `💰 残り資金: ${state.funds - totalCost}万`,
      // ... 既存のログ ...
    ]
  };
}
```

---

## §4 UI変更（ui-render.js）

### §4.1 候補カードへの契約金表示

各候補カードに以下を追加：

```
💰 契約金: XXX万 [ティアラベル]
```

- collapsed（一覧）: OVR横に契約金を表示
- expanded（詳細）: 契約金＋ティアラベル＋ティアカラーで表示

### §4.2 OVR表示の「推定」明示

startRatio幅拡大により、表示OVRと実際のOVRのズレが大きくなる。ドラフト画面のヘッダー説明文に以下を追加：

```
能力値は入団時の推定値です。実際の値とは異なる場合があります。
```

（現状の「将来性の評価はコーチ不在のため大きくブレる場合があります」に加えて）

### §4.3 チームプレビューの拡張

| 項目 | 表示内容 |
|------|---------|
| 現状 | メンバー一覧 + 平均OVR |
| 追加 | 契約金合計 + 残り資金（`初期資金 - 合計`） |

```
💰 契約金合計: 1,200万  ｜  💼 残り資金: 3,800万
```

### §4.4 確認ボタンの変更

```
現状: ✅ この5名でシーズン開始！
変更: ✅ この5名でシーズン開始！（契約金: X,XXX万）
```

資金不足で3名選べない場合はボタンテキストを変更：

```
💰 資金不足 — より安い候補を選んでください
```

### §4.5 契約金がヒントとして機能する演出

契約金の高さが才能のヒントになることを、**ゲーム内で暗示する**。ドラフト画面のヘッダーに一文追加：

```
💡 ヒント: 契約金が高い選手には、それだけの理由があるかもしれません。
```

---

## §5 初期資金

| モード | 初期資金 | 変更 |
|:------:|:-------:|:----:|
| 通常モード（hard） | 5000万 | 変更なし |
| 補助金モード（normal） | 5000万 | 変更なし |

初期資金の変更は行わない。ドラフト有料化のみで資金圧迫を実現する。

---

## §6 影響範囲と他spec反映

### §6.1 変更が必要な既存ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/engine.js` — `Engine.rival.generateStartValues()` | startRatio幅拡大（§1） |
| `src/engine.js` — makeChar内のstartRatio | startRatio幅拡大（§1） |
| `src/engine.js` — `Engine.draft._entryRatio()` | 表示用概算の中央値更新（§1.3） |
| `src/engine.js` — `Engine.draft.getCandidateInfo()` | 契約金算出の追加（§3.1） |
| `src/engine.js` — `Engine.draft.completeDraft()` | funds差し引き処理（§3.7） |
| `src/data.js` — `generateDraftConfig()` | potTotal帯バランス制約（§2） + 素材帯保証（§3.6） |
| `src/ui-render.js` — ドラフト画面 | 契約金表示・資金チェック・UI変更（§4） |
| `src/app.js` — `App.toggleDraftPick()` | 資金チェックの追加 |

### §6.2 影響を受ける既存spec

| spec | 反映内容 |
|------|---------|
| scout-system-spec-v1.0.md §6.1 | startRatio変更を反映（training-spec §1.3相当） |
| balance-adjustment-spec-v1.9.md | 初期ドラフト有料化の経済影響を追記 |

### §6.3 auto-sim検証項目

| # | 検証内容 | 期待値 |
|---|---------|--------|
| 1 | ドラフト後の残金が0以上 | 常にtrue（§3.6の最低保証により） |
| 2 | 入団時OVRの分散 | 現状より有意に拡大していること |
| 3 | 同Notion値の入団OVR逆転率 | Notion差10以下で15%以上の逆転 🔧 |
| 4 | 逸材帯候補の出現率 | 6名中1名以上（FAプールに逸材がいる場合） |
| 5 | 全候補の契約金が初期資金以下 | 常にtrue（超逸材3000万でも5000万以下） |

---

## §7 確定事項

| # | 項目 | 決定 |
|---|------|------|
| 1 | startRatio幅 | 18歳以下: 0.40〜0.70、19-20歳: 0.50〜0.75、21歳以上: 変更なし |
| 2 | 逸材保証 | 候補6名中最低1名はpotTotal≥740。FAプールに不在時はフォールバック |
| 3 | 素材保証 | 候補6名中最低2名は素材帯（契約金120万以下） |
| 4 | 契約金算出 | 既存 `calcAssessedValue` をそのまま使用 |
| 5 | fixed枠 | 2名は無料（変更なし） |
| 6 | candidates枠 | 6名中3名を有料で選択（変更なし） |
| 7 | 初期資金 | 両モードとも5000万（変更なし） |
| 8 | ドラフト倍率 | なし。`calcAssessedValue` の生値をそのまま使用 |
| 9 | 変更箇所 | startRatio: 3箇所 / ドラフト候補生成: 1箇所 / UI: 1箇所 / completeDraft: 1箇所 |

---

## §8 未確定事項（実装時に判断）

- [ ] 逸材保証枠のOVR上限値（§2.4の`eliteOvrCap`）の最終チューニング
- [ ] 契約金が高い候補の視覚演出（金枠、光彩など）の有無
- [ ] ドラフト画面でのティアラベル表示形式（テキスト or アイコン or バッジ）
- [ ] `_entryRatio` の表示用概算を廃止して、実際のstartRatio平均を使うかの判断

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-13 | v1.0 初版作成。startRatio幅拡大・逸材保証・ドラフト有料化の3本柱で構造確定 |
