# Draft Negotiation — セッション引き継ぎ書

作成: 2026-04-06
ブランチ: `feature/draft-negotiation`

---

## 1. 完了ステータス

| Step | コミット | 概要 |
|---|---|---|
| 0 | `d6b999e` | 把握と差分分析。NOTES-draft-step0.md に spec §13 と既存コードのギャップを整理 |
| 1 | `7466866` | 旧スカウト廃止: `aiScout`/`aiSeasonReinforce` 削除、`AI_SCOUT_CFG` 縮小(idealRosterのみ)、プール拡張(14-18名/8-10名)、`resolveCompetition` 仮スタブ化 |
| 2 | `e9c3a0d` | セリエンジン `src/draft-negotiation.js` 新規作成。assignInterest/runDropCheck/runNegotiation/runFullDraft/empressReinforce/runValidation |
| 3 | `4bfe2cd` | 候補一覧UI `_renderDraftCandidateList()` 実装。週刊グラップル「ドラフト速報」面 |
| 4 | `3cb3437` | 交渉画面UI `_renderDraftNegotiation()` 実装。会場バナー+入札カード4枚+ヒートゲージ+ナレーション+AI観戦モード |
| 4.5+5 | `b2a56fd` | 事前選択制(★星トグル+5分岐ロジック)、BGM/SFX統合(7トリガー)、EMPRESS安全網ドラマ演出、ナレーション拡充(30+パターン)、業界紙まとめ記事 |

**auto-sim 100シーズン ALL CLEAR** (最終確認: step 4.5+5 コミット直前)

---

## 2. 実装ファイル一覧

### src/draft-negotiation.js (新規, ~570行)
Engine.draftNegotiation 名前空間。セリのコアロジック全体。

| 関数/定数 | 役割 |
|---|---|
| `DRAFT_BID_MUL` | 複利倍率(standard:1.10, aggressive:1.25) |
| `DRAFT_PARTICIPATION` | ティア別参加率テーブル(normal/elevated × 3団体 × 5ティア) |
| `DRAFT_ORG_PERSONALITY` | 性格別降り率(baseDrop/sens、normal/elevated) |
| `DRAFT_YOUTH_BONUS` | 年齢別若さボーナス(16歳:1.30〜26+歳:0.60) |
| `DRAFT_MARK_MUL_BASE/SENS` | マーク別パラメータ倍率(◎1.0/○3.33/△9.33 + sens分離) |
| `DRAFT_HIDDEN_CAP_RANGE` | タイプB/C隠しキャップ(2.5〜8.0倍) |
| `DRAFT_EMPRESS_SAFETY` | EMPRESS安全網設定(tcOVR≥110, 6名未満, 年最大2回) |
| `assignInterest()` | 各団体の関心決定(参加率/執着スコア/マーク/タイプA-B-C/隠しキャップ) |
| `runDropCheck()` | CPU降り判定(baseDrop + sens/100 × 超過率) |
| `applyTypeCBoost()` | タイプC動的キャップ上昇 |
| `getHeatInfo()` | ヒートゲージ5段階(COMPOSED/STEADY/HEATED/STRAINED/DESPERATE) |
| `NARRATION` + `pickNarration()` | ナレーション文言(30+パターン) |
| `stepRound()` | 1ラウンド進行(UI用) |
| `initNegState()` | 1候補の交渉状態初期化 |
| `runNegotiation()` | 1候補の交渉全体(ヘッドレス用/auto-sim用) |
| `runFullDraft()` | 全候補オーケストレーション(ヘッドレス/auto-sim用) |
| `empressReinforce()` | EMPRESS安全網 |
| `runValidation()` | auto-sim検証用集計 |

### src/ui-render.js (追加分, ~350行)

| 関数 | 役割 |
|---|---|
| `_renderDraftCandidateList()` | ドラフト速報新聞UI(トップ3+有望5+テーブル+★星ボタン+フッター) |
| `_renderDraftNegotiation()` | 交渉画面UI(バナー+ステータス+ステージ+入札卓4枚+ナレーション+アクション) |
| CSS injection (draft-newspaper-css) | dn-* プレフィックス、tier-tag、mark、heat、pulse アニメーション |
| `renderScoutEvent()` 先頭ガード | `_draftNegotiation` → 交渉画面、`_draftInterests` → 速報画面 |

### src/ui-common.js (追加分, ~250行)

| 関数 | 役割 |
|---|---|
| `_draftSfx()` | SFXヘルパー(7トリガー: gong/chime/bid/dropped/fanfare/lost/click) |
| `toggleDraftSelection()` | ★星トグル(上限4名) |
| `startDraftNegotiation()` | 5分岐ロジック付きドラフト開始 |
| `draftPlayerAction()` | 強気/標準/降りるハンドラ(SFX付き) |
| `draftWatchRound()` | AI観戦モード(normal 1s / fast 200ms / skip 即座) |
| `draftSoloConfirm()` | 単独指名Yes/No |
| `draftNextCandidate()` | 結果適用→次候補→完了時_finalizeDraft |
| `_finalizeDraft()` | EMPRESS安全網+業界紙まとめ記事+クリーンアップ |
| `_buildDraftSummaryPage()` | まとめ記事ページ構築 |

### src/management.js (変更箇所)

| 箇所 | 変更 |
|---|---|
| `Engine.rival.aiScout` | 削除(コメントに置換) |
| `Engine.rival.aiSeasonReinforce` | 削除(コメントに置換) |
| `Engine.scout.resolveCompetition` | 仮スタブ化(全候補assessedValueで即取得) |
| `Engine.scout.generateScoutReport` | 旧competition flags廃止(`_hasCompetition=false`固定) |
| `tickWeek offWeek===3` | AI先取り削除、`assignInterest`事前計算+`_draftInterests`保持 |
| `tickWeek week===29` (midseason) | 同様の事前計算追加 |

### src/app.js (変更箇所)

| 箇所 | 変更 |
|---|---|
| `playForState()` | scoutEvent+_draftNegotiation時にBGM→tension切替 |

### src/data.js (変更箇所)

| 箇所 | 変更 |
|---|---|
| `AI_SCOUT_CFG` | budget/maxPicks/rates削除、idealRosterのみ残す |
| `SCOUT_EVENT_CFG.offseason` | count [8,10]→[14,18], maxPicks 3→4 |
| `SCOUT_EVENT_CFG.midseason` | count [4,6]→[8,10] |

### その他

| ファイル | 変更 |
|---|---|
| `src/index.html` | `<script src="draft-negotiation.js">` 追加 |
| `test/auto-sim.js` | `loadAsGlobal('draft-negotiation.js')` 追加、`autoHandleScoutEvent` をセリエンジン使用に書き換え |

---

## 3. 現在の spec との差分

### spec通り実装済み
- §1 スコープ/廃止対象
- §2 候補プール拡張(14-18名)
- §4 セリのコアメカニクス(複利/降り判定/タイプA-B-C/強気効果)
- §5 3団体の個性(参加率/性格/若さボーナス/ロスター充足度/マーク/ノイズ/leagueElevated)
- §6 EMPRESS安全網(セリ後/精鋭6名未満/年最大2回/ドラマ演出)
- §7.1 候補一覧UI(週刊グラップル ドラフト速報)
- §7.2 交渉画面UI(会場バナー+入札カード)
- §7.3 ヒートゲージ(5段階)
- §7.4 ナレーション(30+パターン)
- §7.5 AI観戦モード(観戦/早送り/スキップ)
- §8.1 BGM切替(management→tension→management)
- §8.2 SFX 7トリガー(③は代用音源)
- §9 経済インパクト(既存資金から直接支払い)

### spec から変更した箇所（ステップ4.5 の仕様変更）

**NOTES-draft-step4.5-spec-change.md に詳細あり。**

1. **事前選択制**: spec原案は全候補を順にセリ → 改訂は★星で最大4名を事前選択し、選択候補のみ交渉画面を出す
2. **5分岐ロジック**: 選択+AI参加→セリUI / 選択+AI0→単独確認 / 非選択+AI2+→裏自動セリ / 非選択+AI1→AI自動落札 / 非選択+AI0→流札
3. **業界紙まとめ記事**: ドラフト完了後にweeklyNewspaperに「ドラフト結果」ページを追加
4. **specへの反映は未実施**: ユーザーが別途spec §3/§4/§7 を改訂予定

---

## 4. auto-sim 検証結果

### 最新 auto-sim (step 4.5+5 コミット直前)
```
100シーズン ALL CLEAR
- 0 violations, 0 errors, 0 freq warnings
```

### セリエンジン単体検証 (runValidation 500シーズン)
```json
{
  "vs_1honmei (target 55-65%)": "67.3%",
  "vs_2honmei (target 30-40%)": "19.3%",
  "avgRounds_contested": "11.2",
  "avgBidRatio": "2.73"
}
```
- vs_1honmei: 67.3% — 目標55-65%を若干上回る(混合シナリオ含む)
- vs_2honmei: 19.3% — 目標30-40%を下回る(2◎同時は稀)
- 試遊調整で追い込む余地あり

### spec §5.3 性格パラメータ（実測調整後の値）
```
EMPRESS: baseDrop=0.005, sens=4.5
NOVA:    baseDrop=0.014, sens=7.5
CRESCENT: baseDrop=0.028, sens=12
```
spec初期値(3%/10, 6%/14, 10%/20)から大幅引き下げ。sens/100 で適用。

---

## 5. 既知の問題・未解決事項

1. **セリ目標値のチューニング不足**: vs_1honmei=67.3%(目標55-65%)、vs_2honmei=19.3%(目標30-40%)。パラメータ微調整で改善可能だが試遊が先
2. **SFX ③入札カード打音**: spec要求は新規録音。現在はb06_rollup_swoosh_v2で代用中
3. **resolveCompetition仮スタブが残存**: management.js L8012。セリエンジンに完全置換されたが、app.js L3025 の既存スカウトUIから呼ばれるパス(FA契約等)がまだ旧コードを参照。midseason時の挙動を確認要
4. **app.js scoutEventResolve**: 既存のスカウト指名UIとの共存。ドラフトUI経由でない直接指名パス(FAスカウト画面からの契約)はresolveCompetitionスタブを経由。これは意図通りだが、旧UI経由の _hasCompetition=false 固定が副作用を持つ可能性あり
5. **業界紙まとめ記事**: offseason時weeklyNewspaperがnullの場合は新規作成するようにしたが、新聞アーカイブとの整合性が未検証
6. **midseason(week 29)ドラフト**: 事前計算(`_draftInterests`)は追加済みだが、UI側の事前選択制+分岐ロジックのmidseason対応は未テスト(offseasonと同じフローを使うため動くはずだが実機確認なし)

---

## 6. 次セッションで触るべきファイル・関数

### バランス調整(step 6)
| ファイル | 関数/定数 | 調整内容 |
|---|---|---|
| `src/draft-negotiation.js` | `DRAFT_ORG_PERSONALITY` | baseDrop/sens の微調整 |
| `src/draft-negotiation.js` | `DRAFT_HIDDEN_CAP_RANGE` | 隠しキャップ範囲 |
| `src/draft-negotiation.js` | `DRAFT_MARK_MUL_BASE/SENS` | マーク倍率 |
| `src/draft-negotiation.js` | `DRAFT_PARTICIPATION` | ティア別参加率 |
| `src/draft-negotiation.js` | `runValidation()` | 検証ツール改善 |

### UI修正(step 6 or 別途)
| ファイル | 関数 | 内容 |
|---|---|---|
| `src/ui-render.js` | `_renderDraftNegotiation()` | ビジュアル微調整(ユーザーFB待ち) |
| `src/ui-render.js` | `_renderDraftCandidateList()` | 星ボタンの視覚フィードバック改善 |
| `src/ui-common.js` | `startDraftNegotiation()` | midseason対応の動作確認 |
| `src/ui-common.js` | `_finalizeDraft()` | 業界紙まとめ記事の文面調整 |

### spec反映(ユーザー作業)
| ファイル | 内容 |
|---|---|
| `specs/draft-negotiation-spec-v1.0.md` §3 | 事前選択制を追記 |
| `specs/draft-negotiation-spec-v1.0.md` §7 | 星ボタン・分岐ロジックUI仕様を追記 |
| `specs/scout-system-spec-v1.0.md` §5.2 | 「廃止。draft-negotiation-spec参照」注記 |

---

## 7. spec §11 未確定事項の状況

| 項目 | 状況 |
|---|---|
| タイプA/B/C の隠しキャップ範囲 | **確定**: 2.5〜8.0倍 (`DRAFT_HIDDEN_CAP_RANGE`) |
| 性格別降り率とマーク別倍率の合成式 | **確定**: `final_base = personality.baseDrop × markMulBase`, `final_sens = personality.sens × markMulSens`。sens/100 で適用 |
| §5.5 ロスター充足度補正の上限・下限 | **確定**: gap≥0→×0.5, -1〜-2→×1.0, -3〜-4→×1.3, -5以下→×1.6 |
| §5.7 クリア後参加率テーブル | **確定**: `DRAFT_PARTICIPATION.elevated` に実装済み |
| ナレーション文言パターン | **確定**: 30+パターン実装済み。追加は随時可能 |
| AI同士のセリ観戦の早送り速度 | **確定**: normal=1000ms, fast=200ms, skip=即座 |
| §8.2 ③ 入札カード打音の音源 | **未確定**: b06_rollup_swoosh_v2 で代用中。新規録音待ち |
| §6.4 EMPRESS安全網の通知UIデザイン | **確定**: 既存showPopupを使用(type:'scout', tone:'negative') |
| auto-sim 100シーズン数値検証 | **部分確定**: vs_1honmei=67.3%(目標55-65%)、試遊調整で追い込む |
| aiFAAcquire の扱い | **未着手**: 本specでは触れず、現状のまま(offWeek 4で動作) |
