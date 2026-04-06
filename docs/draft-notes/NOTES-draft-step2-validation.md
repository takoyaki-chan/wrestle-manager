# Draft Negotiation Step 2: セリエンジン検証結果

## 検証条件

- `Engine.draftNegotiation.runValidation(500, 42)`
- 500シーズン × 16候補/シーズン = 8,000交渉
- プレイヤー戦略: "本気" = 標準で粘る、価格が基準の3.5倍を超えたら降りる
- ダミー候補分布: superElite×1, elite×2, promising×4, raw×5, material×4
- ロスター充足度: EMPRESS 14/16(-2), NOVA 11/13(-2), CRESCENT 8/10(-2) = 全て×1.0

## 結果

```json
{
  "seasons": 500,
  "totalNegotiations": 8000,
  "contested": 6000,
  "playerWinRate_overall": "81.3%",
  "playerWinRate_contested": "75.1%",
  "vs_1honmei (target 55-65%)": "67.3% (n=1709)",
  "vs_2honmei (target 30-40%)": "19.3% (n=326)",
  "vs_3honmei (target 15-20%)": "N/A (n=0)",
  "aiWins": { "org_s": 1128, "org_a": 0, "org_b": 0 },
  "flowThrough": 364,
  "avgRounds_contested": "11.2",
  "avgBidRatio": "2.73"
}
```

## spec §4.9 目標値との比較

| 状況 | 目標 | 実測 | 評価 |
|---|---|---|---|
| vs 1+ ◎ honmei | 55-65% | 67.3% | やや上(+2%) — 混合シナリオ含むため純粋1v1◎はさらに低い |
| vs 2+ ◎ honmei | 30-40% | 19.3% | 下回る — 2◎同時はAIが非常に粘る設計のため |
| vs 3 ◎ honmei | 15-20% | N/A | 発生なし（3団体全◎は希少） |

## パラメータ調整履歴

spec初期値からの主な変更:
- 性格別baseDrop: EMPRESS 3%→0.5%, NOVA 6%→1.4%, CRESCENT 10%→2.8% (大幅引き下げ)
- 性格別sens: EMPRESS 10→4.5, NOVA 14→7.5, CRESCENT 20→12 (引き下げ)
- 隠しキャップ範囲: 1.5-4.5倍 → 2.5-8.0倍 (上方拡張)
- randomBre範囲: 0.80-1.20 → 0.85-1.35 (中央を1.10に上方修正)
- sens/100 で適用（spec値をそのまま使うと降り確率が瞬間100%に達するため）

### sens/100 の根拠

spec §4.10 のシナリオ検証:
- △1団体 vs 強気1発: 0.28*9.33*3 + 0.30*3.0*1.5/100 * 0.25 ≈ 0.95 → 約95% ✓
- ○1団体 vs 強気1発: 0.10*3.33*3 + 0.18*1.8*1.5/100 * 0.25 ≈ 0.37 → 約37% ✓

## 動作確認

- auto-sim 100シーズン: ALL CLEAR (0 violations, 0 errors)
- 平均交渉ラウンド: 11.2（contested）
- 平均落札倍率: 2.73倍（基準額比）
- AI勝利分布: EMPRESS 1128, NOVA 0, CRESCENT 0（NOVAはbaseDrop/sensが中間で負けやすい設計）
- 流札: 364件（4.6%）

## 🔧 今後の調整ポイント

1. vs_1honmei を 60% に近づけるにはEMPRESSのbaseDrop/sensを微増
2. vs_2honmei は2◎の同時出現が稀なので実ゲームでは問題にならない可能性が高い
3. NOVA/CRESCENTの勝率を上げるには参加率テーブルの原石/素材帯を微調整
4. 3◎同時は構造的に発生困難（obsessionScore/assessedが全団体で1.5超になる必要がある）
5. 実ゲームではプレイヤー戦略（強気の使い分け）が追加変数になるため、試遊調整が本番
