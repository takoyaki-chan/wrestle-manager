# 💞 Bond/Rivalry 関係性システム設計書 v2.0

> **ステータス**: 🟢 確定
> **作成日**: 2026-03-07（再同期: 2026-04-06）
> **依存**: character-data-spec-v1.7.md / weekly-gameloop-spec-v1_0.md / battle-engine-spec-v4.2.md / trust-system-spec-v2.1.md
> **実装箇所**: relationships.js (全体), management.js (applyMatchResult呼び出し, processWeeklyDecay), data.js (PERSONALITY_BOND_MATRIX)
> **🔧マーク = 調整可能パラメータ**

---

## 設計原則

1. **非対称が核** — AからBへの感情と、BからAへの感情は独立。片思い・一方的敵意が自然に生まれる
2. **接触がすべてを動かす** — 同団体・対戦経験がある間は関係が変動し、離れると凍結する
3. **因縁は物語の燃料** — rivalryはMQボーナス・集客に直結するゲーム上最も価値のある関係
4. **bondは空気を作る** — 親密度はロッカールーム士気・信頼・成長環境に間接的に影響する
5. **逓減で鮮度を保つ** — 同じイベントが同じペアで繰り返されると効果が薄れる

---

## §1 データモデル

### §1.1 二軸非対称モデル

| 軸 | 範囲 | デフォルト | 性格 |
|----|------|----------|------|
| **Bond（親密度）** | 0–100 | 50 | 好意・信頼・仲間意識 |
| **Rivalry（競争意識）** | 0–100 | 0 | 闘争心・意識・因縁 |

### §1.2 Bond帯

| 帯 | 範囲 | 意味 |
|----|------|------|
| 嫌悪 | 0–19 | 侮蔑・拒絶 |
| 苦手 | 20–39 | 不信・距離感 |
| 普通 | 40–59 | ニュートラル |
| 好意 | 60–79 | 信頼・友情 |
| 深い絆 | 80–100 | 盟友 |

### §1.3 Rivalry帯

| 帯 | 範囲 | 意味 |
|----|------|------|
| 眼中にない | 0–19 | 無関心 |
| 少し意識 | 20–39 | 気になる存在 |
| ライバル視 | 40–59 | 明確な対抗意識 |
| 因縁 | 60–79 | 決着をつけたい |
| 宿命 | 80–100 | 運命のライバル |

### §1.4 ストレージ構造

```
GameState.relationships = {
  "charA>charB": { bond: 50, rivalry: 0, knownRival: false, frozen: false },
  "charB>charA": { bond: 50, rivalry: 0, knownRival: false, frozen: false },
  ...
}
GameState.relationshipCounters = {
  "charA>charB:M-04:normal": 2,  // 逓減カウンタ
  ...
}
```

### §1.5 特殊フラグ

| フラグ | 意味 |
|--------|------|
| `knownRival` | rivalry 40+で自動付与。減衰速度1/3。rivalry <10でリセット |
| `frozen` | 引退・退団で凍結。以後変動なし |

---

## §2 初期化（Engine.relationships.initialize）

### §2.1 初期化フロー

1. 全キャラペア → bond: 50, rivalry: 0
2. 同団体ボーナス: bond **+3〜+8** 🔧（ランダム）
3. OVR近接（差≤5）: rivalry **+2〜+6** 🔧
4. 性格×アーキタイプマトリクス適用（§2.2）＋ガウスノイズ
5. バックストーリー生成（§2.3）
6. clamp [0, 100]

### §2.2 性格相性マトリクス

**Personality Bond調整（対称）:**

| ペア | 調整値 |
|------|:------:|
| 同一性格 | +2 |
| earnest × earnest | +4 |
| bold × bold | +3 |
| easygoing × easygoing | +3 |
| bold × quiet | -3 |
| earnest × easygoing | -3 |
| emotional × quiet | -2 |

**Archetype Bond調整（対称、normalは無視）:**

| ペア | 調整値 |
|------|:------:|
| delinquent × ojousama | -6 |
| delinquent × polite | -4 |
| cool × emotional | -3 |
| seductive × earnest | -2 |
| ojousama × ojousama | +3 |
| polite × ojousama | +3 |
| delinquent × delinquent | +2 |
| cool × cool | +2 |

**Personality Rivalry調整:**

| ペア | 調整値 |
|------|:------:|
| bold × bold | +3 |
| earnest × earnest | +2 |
| quiet × quiet | -2 |

ガウスノイズ: Bond σ=2.5, Rivalry σ=1.5 🔧

### §2.3 バックストーリー

団体内で **2〜4組** 🔧 をランダム生成:

| タイプ | Bond | Rivalry |
|--------|:----:|:-------:|
| 同期入団 | 70–80 | 0 |
| 元タッグ | 65–75 | 20–30 |
| 過去の遺恨 | 20–30 | 40–55 |

---

## §3 週次処理（processWeeklyDecay）

### §3.1 接触判定

**接触あり** = 同団体 **OR** 直近2興行（4週）内に対戦

### §3.2 接触ありの場合

**Bond:**
- current > 50: 50方向へ **-0.18〜-0.30**/週 🔧
- current < 50: 50方向へ **+0.18〜+0.30**/週

**同団体Bond天井**: bond 55から減速し **60で停止** 🔧（試合・イベントでのみ60超に到達可能）

**Rivalry:**
- 基本減衰: **-0.28〜-0.5**/週 🔧
- 85+: 追加 **-0.45**/週
- 70–84: 追加 **-0.25**/週
- 50–69: 追加 **-0.12**/週
- knownRival時: 全減衰 **×1/3**（超低速）
- knownRival + rivalry < 60 + 4週ごと: **+0.3〜+0.5**（意識維持）

### §3.3 接触なしの場合

- **Bond**: **凍結**（変動なし）
- **Rivalry**: **-0.16**/週 🔧（≈70週で70→0）。knownRival時は×1/3

### §3.4 性格摩擦（Phase 4）

- 条件: 同団体 + 性格×アーキタイプ相性合計 ≤ -3
- 効果: bond **-0.15**/週 🔧（年間 -7.2pt）

### §3.5 世代近接ボーナス（Phase 4）

- 条件: 同団体 + 年齢差3歳以内
- 効果: bond **+0.1**/週 🔧（年間 +4.8pt、天井とは別枠）

### §3.6 OVR変動効果

**G-04（OVR差拡大）:**
- 条件: OVR差10+ + rivalry 20+ + 高OVR側
- 効果: rivalry **-2〜-4**/週（興味喪失）

**G-05（OVR近接）:**
- 条件: OVR差5以内 + 4週ごと
- 効果: rivalry **+2〜+4**（rivalry 10+の場合）
- 同スタイル追加: rivalry **+1〜+2**
- タイトル圏（org top 5 + 同団体）: rivalry **+0.5〜+1.0** 🔧

---

## §4 試合結果の反映（applyMatchResult）

### §4.1 共通ルール

- **対抗戦（クロスOrg）**: rivalry変動に **×2倍率**、上限 **+35/試合** 🔧
- **knownRival自動付与**: MQ ≥ 65 OR 僅差 → `knownRival = true`
- **逓減システム**: 同ペア同イベント同ステージで効果減衰（§8参照）

### §4.2 試合イベント一覧

| ID | イベント | 条件 | 勝者→敗者 Bond | 勝者→敗者 Rivalry | 敗者→勝者 Bond | 敗者→勝者 Rivalry |
|----|---------|------|:-:|:-:|:-:|:-:|
| M-01 | ベースライン | 全試合 | ±0 | +0.1〜+0.5 | ±0 | +0.8〜+2.0 |
| M-01 | 引き分け | Draw | ±0 | +0.5〜+1.0 | ±0 | +0.5〜+1.0 |
| M-02 | 僅差好勝負 | 敗者HP≥15% or 勝者HP≤30% | ±0〜+1 | +5〜+8 | ±0〜+1 | +5〜+8 |
| M-03a | 圧勝（勝者視点） | KO+勝者HP≥70% or turns≤5 | ±0 | -5〜-3 | -4〜-2 | +5〜+10 |
| M-03b | 圧勝（敗者視点） | 同上 | -4〜-2 | +5〜+10 | ±0 | -5〜-3 |
| M-04 | 名勝負 | MQ ≥ 80 | +3〜+6 | +8〜+12 | +3〜+6 | +8〜+12 |
| M-05 | PPV/GRAND FINAL | stage='ppv' | ±0 | +10〜+15 | ±0 | +10〜+15 |
| M-06 | タイトル防衛 | 王者勝利 | +4〜+7 | +4〜+7 | +10〜+15 | +10〜+15 |
| M-06 | タイトル奪取 | 挑戦者勝利 | +5〜+8 | +5〜+8 | +12〜+18 | +12〜+18 |
| M-10 | 因縁決着 | rivalry≥60 + 4戦+ + MQ≥50 | +5〜+10 | **→0〜10** | +5〜+10 | **→0〜10** |
| M-11 | 怪我 | 試合後怪我発生 | -1〜-3 | ±0 | ※状況依存 | +2〜+5 |
| M-12 | 連敗 | 3+連敗（同相手） | ±0 | ±0 | ±0 | +2〜+4 |
| M-13 | キャリアベスト | MQ自己最高更新 | +2〜+3 | +3〜+5 | +2〜+3 | +3〜+5 |
| M-15 | 番狂わせ | OVR差10+で下位勝利 | ±0 | +3〜+5 | -4〜-2 | +4〜+7 |
| M-16 | h2h鬱積 | 対戦3+連敗 | ±0 | ±0 | -3〜-1 | +3〜+5 |
| M-16 | h2h突破 | 自身の3+連敗を止める | +2〜+4 | -4〜-2 | ±0 | ±0 |
| M-17 | 凡戦 | MQ < 40 | -2〜-1 | ±0 | -4〜-2 | ±0 |

### §4.3 片側因縁認知

- 条件: 一方rivalry ≥ 50、他方 < 20（片側因縁）
- 勝利 or 僅差 → 無関心側に rivalry **+8〜+12**（脅威認知）
- 大敗＋MQ<50 → 攻撃側 rivalry **-5〜-8**、bond **-5〜-3**（思い上がりの崩壊）

---

## §5 団体・経営イベント（O系列）

### §5.1 日常

| ID | イベント | Bond変動 | Rivalry変動 |
|----|---------|:--------:|:----------:|
| O-01 | 同団体週次 | +0.2〜+0.5/週 | ±0 |
| O-02 | 入団（FA/スカウト） | -3〜+3（既存→新人） | ±0 |
| O-05 | 残留 | +1〜+2 | ±0 |

### §5.2 離脱

| ID | イベント | Bond変動 | Rivalry変動 |
|----|---------|:--------:|:----------:|
| O-03 | 移籍退団 | -15〜-8 | +5〜+10 |
| O-04 | 引退（bond60+のみ） | -10〜-5 | →frozen |
| O-07 | 解雇（本人→全体） | -15〜-10 | ±0 |
| O-07 | 解雇（残留→本人） | personality依存 | ±0 |
| O-08 | 突然離脱 | -10〜-5 | ±0 |
| O-09 | 引き抜き | -15〜-8 | +5〜+10 |

### §5.3 レンタル

| ID | イベント | Bond変動 | Rivalry変動 |
|----|---------|:--------:|:----------:|
| O-10 | レンタル加入 | -2〜+2 | ±0 |
| O-11 | レンタル帰団 | -6〜-3 | ±0 |

### §5.4 その他

| ID | イベント | Bond変動 | Rivalry変動 |
|----|---------|:--------:|:----------:|
| O-12 | 引退拒否（prove mode） | -8〜-5（本人→全体） | +3〜+5（同世代） |
| O-13 | 引退撤回 | +5〜+8（本人→全体） | ±0 |
| O-14 | 同期ドラフト | +3〜+5 | +2〜+4 |

---

## §6 ケア・成長・大型イベント

### §6.1 ケア系（C系列）

| ID | イベント | 効果 |
|----|---------|------|
| C-01/C-02 | 激励/休暇 | 対象→全体 bond +1〜+2 |
| C-03 | 合宿/パーティ | 全ペア bond +2〜+4 |
| C-04 | タイトル機会 | 非参加→参加者 bond -3〜-1, rivalry +2〜+5 |
| C-05 | 連敗起用 | 本人→全体 bond +2〜+3 |
| C-06 | 連敗干し | 本人→全体 bond -5〜-3 |
| C-07 | 衣装新調 | 対象→全体 bond +1〜+2 |
| C-08 | メディア露出 | 対象→全体 bond +1〜+2、他→対象 bond -1 |
| C-09 | 特別待遇 | 対象→全体 bond +2〜+3、他→対象 bond -3〜-2 |
| C-10 | メイン vs 前座 | 前座→メイン bond -2〜-1, rivalry +1〜+3 |

### §6.2 成長系（G系列）

| ID | イベント | 効果 |
|----|---------|------|
| G-01 | ブレイクスルー | OVR近接(≤5)→本人 rivalry +3〜+5 |
| G-03 | スランプ入り | 高bond(60+)→本人 bond +1（同情）、rivalry(30+)→本人 rivalry -3〜-5 |
| G-06 | モチベ喪失 | G-03と同様 |
| G-07 | 自動引退 | 高bond→本人 bond -5〜-8、→frozen |
| G-08 | prove mode試合 | 相手→本人 bond +1〜+3, rivalry +2〜+4 |

### §6.3 大型イベント系（E系列）

| ID | イベント | 効果 |
|----|---------|------|
| E-01 | 対抗戦 | チームメイト bond +α、対戦相手 rivalry +α |
| E-02 | B2対立決着 | 非対称 bond/rivalry |
| E-03 | B3対抗戦 | rivalry + チームメイト bond |
| E-04 | B4メディア終了 | bond + OVR近接 rivalry |
| E-05 | 表彰式 | 受賞者 bond↑、候補者 rivalry↑ |
| E-06 | スキャンダル | ロスター bond↓ |

---

## §7 因縁称号システム

rivalryの数値に基づくライバル称号。MQボーナスに直結。

### §7.1 称号段階

| 称号 | 昇格条件 | MQボーナス 🔧 |
|------|---------|:----------:|
| 因縁 | tier 0→1: rivalry 30+ / 対戦2+ | +2 |
| 宿敵 | tier 1→2: rivalry 50+ / 対戦3+(since tier1) / bestMQ 70+ | +4 |
| 永遠のライバル | tier 2→3: rivalry 70+ / 対戦3+(since tier2) / bestMQ 80+ | +6 |
| 片側因縁 | 一方rivalry 50+ / 他方30未満 | +1（高い側のみ） |

### §7.2 降格条件

| 現在 | 降格先 | 条件 |
|------|--------|------|
| 永遠 → 宿敵 | rivalry ≤ 50 |
| 宿敵 → 因縁 | rivalry ≤ 35 |
| 因縁 → なし | rivalry ≤ 20 + 48週未対戦 |

### §7.3 決着

- 条件: rivalry ≥ 60 + 相互対戦4+ + MQ ≥ 50
- 効果: bond +5〜+10、rivalry → 0〜10にリセット
- tier/matchesSinceTier/bestMQSinceTier もリセット
- 4週クールダウン
- orgPop +1.5〜+2.5 🔧、pop +4〜+6 🔧

---

## §8 逓減システム

同じイベントが同じペアで繰り返されると効果が薄れる。

### §8.1 逓減テーブル

| 発生回数 | 倍率 🔧 |
|---------|:------:|
| 1回目 | ×1.00 |
| 2回目 | ×0.70 |
| 3回目 | ×0.45 |
| 4回目 | ×0.25 |
| 5回目+ | ×0.15 |

### §8.2 カウンタキー

`"idA>idB:eventType:stage"` — ステージ（normal / ppv / title）別に独立カウント。
PPVでの名勝負と通常興行での名勝負は別カウンタ。

### §8.3 カウンタ減衰

未発生 **12週** 🔧 でカウント -1（鮮度回復）

---

## §9 h2h対戦記録

### §9.1 データ構造

```
h2h[getKey(id1, id2)] = {
  matches: number,     // 総対戦数
  winsA: number,       // 小さいID側の勝利数
  winsB: number,       // 大きいID側の勝利数
  draws: number,
  bestMQ: number,      // 対戦最高MQ
  lastMatch: { season, week },
  hadTitleMatch: boolean,
  hadPPV: boolean
}
```

### §9.2 キー生成

`getKey(id1, id2)` — 常に小さいIDが先（`"min>max"`）

### §9.3 記録箇所

finalizeShow / AI tickWeek / finalizeWar / finalizePPV の4パスで記録

---

## §10 orgTimeline（在籍履歴）

### §10.1 データ構造

```
fighter.orgTimeline = [
  { orgId, fromSeason, fromWeek, toSeason?, toWeek? }
]
```

### §10.2 メソッド

| メソッド | 用途 |
|---------|------|
| `transfer(fighter, newOrgId, season, week)` | 移籍記録 |
| `wereColleagues(fighterA, fighterB)` | 過去の同僚判定（現在同団体を除く） |

### §10.3 フック箇所

scout / playerPoach / resolvePoach×2 / release / suddenDeparture / contractDeparture の6パス

---

## §11 パフォーマンス最適化

- `charOrgMap`: キャラID→団体ID のマップを事前構築（週次処理冒頭）
- `recentMatchPairs`: 直近4週の対戦ペアを事前収集
- 全ペア走査は週1回のprocessWeeklyDecayでのみ実行

---

## §12 RNG シード

| 用途 | シード |
|------|--------|
| 初期化 | 0xBE1A |
| 週次処理 | 0xBE1B |
| 試合結果 | 0xBE2A / 0xBE2B / 0xBE2C |
| 団体イベント | 0xBE3A〜0xBE46 |
| ケア/成長/大型 | 0xBE50〜0xBE5B |

---

## §13 マイグレーション

| ID | 内容 |
|----|------|
| `_migrated_relationships_v1` | GameState.relationships / relationshipCounters 初期化 |
| `_migrated_rivalry_tier_v1` | matches数からtier逆算 |
| `_migrated_h2h_orgTimeline_v1` | h2h / orgTimeline 初期化 |

<!-- 再同期: 2026-04-06, 指示書: docs/specs-resync-instruction.md -->

---

## §14 感情コメント（相関ポップアップ💭）

相関図ポップアップで「親密度・競争意識」の下に表示される一言コメントは、Bond × Rivalry の **4×3 マトリクス**で 12 カテゴリに分類し、性格 archetype 7 種ごとに専用セリフを持つ（実装: `src/ui-render.js` の `EMOTION_TEXTS` / `getEmotionCategory`）。

### Bond 帯 (4段)
- `high`: ≥ 65
- `mid`: 45-64
- `low`: 29-44
- `bottom`: < 29

### Rivalry 帯 (3段)
- `low`: < 20
- `mid`: 20-49
- `high`: ≥ 50

### マトリクス（カテゴリ）

| Bond \\ Rival | low (<20) | mid (20-49) | high (≥50) |
|---|---|---|---|
| **high** ≥65 | trust | rival_friend | destined_rival |
| **mid** 45-64 | acquaintance | intrigued | hostile_competitor |
| **low** 29-44 | distant | irritation（尺に障る） | dislike（明確な嫌い） |
| **bottom** <29 | cold_loathing（冷たい嫌悪） | dislike_strong（強い嫌悪） | hatred（憎悪） |

### contempt 上書き
低/底 Bond帯 × Rival低 のとき、`selfOvr - targetOvr ≥ 15` なら上記 distant / cold_loathing を `contempt`（格上の侮蔑）で上書きする。

### archetype 別書き分け方針
- `normal`: 直球・素直
- `ojousama`: 上品な言葉に毒
- `delinquent`: 直球の口の悪さ
- `cool`: 短い断定・分析口調
- `seductive`: 笑顔の毒・優しい語尾で冷酷
- `polite`: 柔らかい敬語の刃
- `composed`: 穏やかな完全拒絶

マイナス側（distant / irritation / dislike / cold_loathing / dislike_strong / hatred / contempt）は丁寧表現に押し負けて嫌悪が薄まらないよう、polite/composed/ojousama でも明確な拒絶が伝わる文面にする。

