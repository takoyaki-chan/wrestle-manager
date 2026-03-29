# 引き継ぎ: 集客システム再設計（Phase 4 待ち）

## 状態サマリー

Phase 1-3完了（計算関数の仮実装＋auto-sim計測＋定数チューニング）。
**既存ゲームには一切影響なし**。新関数群が横で動いて数字を出すだけの状態。
次は **Phase 4: 本切り替え**（旧ロジック→新ロジックに差し替え）。

## 経緯

2026-03-29、テスターフィードバックの検証から集客システムの根本的な設計問題を発見。
2セッションかけて全体設計→計算式具体化→仮実装→auto-sim検証まで完了。

## 問題の核心

1. **集客が「誰が出るか」に依存していない** — orgPopで大部分が決まり、カード内容の影響が小さい
2. **avgMQの平均計算が試合数を罰する** — 試合を増やすほどavgMQが下がり損する。興行ゲームとして逆
3. **強い選手の経済的価値が見えない** — 給料は指数的に増えるが、収益貢献が間接的すぎて「育てた選手を切るしかない」になる

## 実装済み（Phase 1-3、commit c70c129）

### コードの場所
- **定数**: `src/data.js` — `DRAW_POWER_CONFIG`, `MATCH_APPEAL_CONFIG`, `SHOW_DRAW_CONFIG`, `ATTENDANCE_V2_CONFIG`, `SHOW_RATING_CONFIG`
- **計算関数**: `src/engine.js` — `Engine.attendanceV2` 名前空間
- **計測フック**: `test/auto-sim.js` — 興行ごとに新旧比較、orgPop帯別レポート出力

### 新集客モデル（両輪モデル＋ソフトキャップ）
```
attendance = softCap(reach(orgPop) × draw(カード内容) × heat × 揺らぎ, reach)
```
- **reach**: orgPop→区間線形補間。orgPop40→800, orgPop70→2800
- **draw**: 0.3〜2.0。`draw = 0.3 + (showDraw / expectedDraw) × 0.7`
- **softCap**: reach超過分を段階減衰（×0.7 / ×0.4 / ×0.2）
- **ハードキャップは会場capのみ**

### 計算関数一覧
| 関数 | 役割 |
|------|------|
| `calcDrawPower(fighter, G)` | 個人集客力。pop^1.3 + OVR混合 + 華/ファンサ + 王者/勢い等 |
| `calcMatchAppeal(fA, fB, context, G)` | カード魅力。OVR拮抗 + rivalry×0.3(低い方) + タイトル+20 + ファン期待+12 + ヒールvsベビー+6 |
| `calcShowDraw(matchAppeals, nonMatchPromo, venueIdx)` | 興行集客力。appeal降順×posWeight(1.0/0.7/0.5/0.35)積み上げ |
| `calcAttendanceV2(G, venueIdx, showDraw, rng)` | 最終集客数。reach×draw×heat×揺らぎ→softCap→会場cap |
| `calcShowRating(matchResults, attendance, venueCap, venueIdx, context)` | ショーレーティング★1〜5 |
| `measureShow(G, showCard, matchResults, attendance, venueIdx)` | 上記全てをまとめて計測 |

### ショーレーティング（★1〜5）
```
totalScore = mqScore(max60) + occScore(max15) + bonusScore(max25)
★5: ≥82  ★4: ≥70  ★3: ≥50  ★2: ≥30  ★1: <30
```
- mqScore: MQ重み付き積み上げ / expectedMQTotal × 60（平均は取らない）
- occScore: 占有率ベース（満員15, ガラガラ-5）
- bonusScore: タイトル名勝負+8, 因縁決着+6, ファン期待+4/件, 充実+3

### ★の波及効果
| ★ | heat変動 | orgPop変動(逓減前) | メディア放映倍率 |
|----|---------|-------------------|-----------------|
| ★5 | +2.5 | +2.0 | ×2.0 |
| ★4 | +1.5 | +1.0 | ×1.4 |
| ★3 | ±0 | ±0 | ×1.0 |
| ★2 | -1.0 | -0.5 | ×0.6 |
| ★1 | -2.0 | -1.0 | ×0.3 |

### auto-sim計測結果（50シーズン / 1,107興行）
| orgPop帯 | 旧集客avg | 新集客avg | draw avg | ★分布 |
|----------|-----------|-----------|----------|-------|
| 0-20 | 236 | 183 | 0.87 | ★1:4 ★2:12 ★3:3 |
| 20-40 | 465 | 455 | 1.01 | ★2:8 ★3:46 ★4:8 |
| 40-60 | 1,106 | 1,089 | 0.90 | ★3:371 ★4:629 ★5:26 |

## 次のセッションでやること: Phase 4（本切り替え）

### 差し替え対象（影響範囲大・慎重に）

1. **集客計算の差し替え**
   - `processSettlement`（engine.js L5759付近）: 旧`calcAttendance` → `Engine.attendanceV2`系に
   - `executeShow`内のattendance関連処理
   - `getAttendancePrediction`: 興行準備画面のプレビュー更新
   - app.js `finalizeShow` のattendance呼び出し

2. **heat更新の差し替え**
   - `Engine.heat.calcUpdate(G, avgMQ)` → ショーレーティング★ベースに
   - 呼び出し元: `processSettlement` 内
   - avgMQ直接参照を完全廃止

3. **orgPop変動の差し替え**
   - `VENUE_MQ_THRESHOLD` 依存のMQ閾値ロジック → ★ベースに
   - `Engine.orgPop.getMQAdjust` → 廃止
   - ★5で+2.0, ★1で-1.0（getDiminishingMultiplier適用はそのまま）

4. **メディア放映収入の差し替え**
   - `MEDIA_CONFIG.showPerMQ × avgMQ` → `SHOW_RATING_CONFIG.mediaMult[stars] × baseBroadcast`
   - baseBroadcastは現行avgMQ50想定時の収入から逆算

5. **AI団体の処理**
   - AI興行でもショーレーティングを算出（simulateMatchのMQ使用）
   - AI団体のheat/orgPop変動も★ベースに統一

### 切り替え後の検証
- auto-sim 100シーズンで `ALL CLEAR` 確認
- orgPop推移が現行と大きく乖離しないことを確認
- 財務バランス（funds推移）が破綻しないことを確認
- 大規模テスト（100×100）推奨

### Phase 5（後続・別セッション）
- 新聞に★表示追加
- 集客内訳の可視化（「なぜ今日これだけ入ったか」）
- 個人の収益貢献の見える化
- プロモ効果の演出
- ファン期待カード決定ロジック見直し

## 注意事項

- **影響範囲が非常に大きい改修**。集客→チケット→グッズ→メディア→会場選択→orgPop全てに波及
- 切り替えはprocessSettlementを中心に。executeShowの中は試合MQ算出がメインなので比較的安全
- avgMQ自体は統計値として残してもいいが、ゲームメカニクスからは完全に切り離す
- 「演出がないと気づかない」がテスターの共通意見。Phase 5で見せ方も作る
- 低orgPop帯（0-20）で新集客が旧より20%低い。序盤がきつくなりすぎないか要注意

## 関連ファイル
- 設計書: `docs/attendance-redesign-v1.md`
- メモリ: `memory/attendance-redesign.md`
- 定数: `src/data.js` — DRAW_POWER_CONFIG 〜 SHOW_RATING_CONFIG
- 関数: `src/engine.js` — Engine.attendanceV2
- 計測: `test/auto-sim.js` — v2Samples / v2計測レポート
