# specs/ 再同期 引き継ぎ書

**作成日**: 2026-04-05
**指示書**: `docs/specs-resync-instruction.md`
**差分レポート**: `docs/specs-drift-report.md`

---

## 完了した作業

### フェーズ1-3: 調査・報告・方針決定 ✅
- specs/ 8ファイルを全読し、実装コードと突き合わせ
- 差分レポート `docs/specs-drift-report.md` を作成（カテゴリA/B/C計21件）
- Keisukeさんの方針: 全項目「実装に合わせて更新」、finisher-specはarchive移動、カテゴリCは全て新規作成

### フェーズ4: 既存specs/ ファイル更新（カテゴリB） ✅

| ファイル | コミット | 主な変更 |
|---------|---------|---------|
| finisher-system-spec-v1.0.md | `71fbff8` | specs/archive/ に移動（未実装のため） |
| battle-engine-spec-v4.1b.md → **v4.2.md** | `8377fec` | 定数10項目更新、Big Match Tier2追加(§16)、MQ計算統合(§17) |
| scout-system-spec-v1.0.md | `062e780` | 年齢分布(16-17歳)、startRatio(3帯簡素化) |
| title-system-spec-v1.0.md | `fbde6f7` | MQボーナス+5統一、集客×1.15、レンタル制限 |
| character-data-spec-v1.4.md → **v1.7.md** | `3c3c08b` | ファイル名を内容バージョンに合わせてリネーム |
| rival-org-spec-v1.0.md | `1aa4558` | AI週次処理化、Trust/Bond統合、processAICare追加 |
| weekly-gameloop-spec-v1_0.md | `10d923e` | offWeek処理順更新、契約交渉追加、PPV GRAND FINAL |
| **技テーブル** | - | 変更不要（実装と一致） |

### フェーズ5: CLAUDE.md 運用ルール追記 ✅
- `666e6cf`: specs/ 更新ルール（指示書完了→specs更新→承認→アーカイブ）

---

## フェーズ6: カテゴリA — アーカイブからアクティブspec作成（7件） ✅

**完了日**: 2026-04-06 | **コミット**: `a6e9a40`

| # | システム | 作成ファイル |
|---|---------|-----------|
| A-1 | Trust/信頼度 v2.1 | specs/trust-system-spec-v2.1.md |
| A-2 | Bond/Rivalry関係性システム | specs/relationship-system-spec-v2.0.md |
| A-3 | 契約交渉イベント | specs/contract-negotiation-spec-v2.0.md |
| A-4 | プロモシステム v1.0 | specs/promo-system-spec-v1.0.md |
| A-5 | レンタルシステム v2 | specs/rental-system-spec-v2.0.md |
| A-6 | 成長システム v2.0 | specs/growth-system-spec-v2.0.md |
| A-7 | PPV GRAND FINAL | specs/ppv-grand-final-spec-v2.0.md |

### フェーズ7: カテゴリC — 実装コードから新規spec作成（6件+1完了済み） ✅

**完了日**: 2026-04-06 | **コミット**: `579d62b`

| # | システム | 作成ファイル |
|---|---------|-----------|
| C-1 | 性格/アーキタイプシステム | specs/personality-archetype-spec-v1.0.md |
| C-2 | 大型イベント B1-B4 | specs/large-event-spec-v1.0.md |
| C-3 | 会場・集客システム v2.0 | specs/venue-attendance-spec-v2.0.md |
| C-4 | 経済バランス v2.0 | specs/economy-spec-v2.0.md |
| C-5 | コーチシステム v3.0 | specs/coach-system-spec-v3.0.md |
| C-6 | スナップショット通知 | specs/snapshot-notification-spec-v1.0.md |
| C-7 | MQ計算 v3.0 | → battle-engine-spec-v4.2.md §17に統合済み（追加不要） |

---

## 注意事項

- **specs/ を更新する際は CLAUDE.md の「specs/ 更新ルール」に従うこと**
- 元の構造・トーンをなるべく保つ（用語: MQ、信頼、絆、ライバル関係）
- 不明点は推測せず Keisuke さんに質問する
- `docs/specs-drift-report.md` に各項目の詳細な差分情報があるので参照のこと

---

## 現在の specs/ ファイル一覧（全作業完了後）

```
specs/
  battle-engine-spec-v4.2.md        ← Phase4更新（旧v4.1b）
  character-data-spec-v1.7.md       ← Phase4リネーム（旧v1.4）
  coach-system-spec-v3.0.md         ← C-5 新規作成
  contract-negotiation-spec-v2.0.md ← A-3 新規作成
  economy-spec-v2.0.md              ← C-4 新規作成
  growth-system-spec-v2.0.md        ← A-6 新規作成
  large-event-spec-v1.0.md          ← C-2 新規作成
  personality-archetype-spec-v1.0.md← C-1 新規作成
  ppv-grand-final-spec-v2.0.md      ← A-7 新規作成
  promo-system-spec-v1.0.md         ← A-4 新規作成
  relationship-system-spec-v2.0.md  ← A-2 新規作成
  rental-system-spec-v2.0.md        ← A-5 新規作成
  rival-org-spec-v1.0.md            ← Phase4更新（§3.2, §4）
  scout-system-spec-v1.0.md         ← Phase4更新（§3.1, §6.1）
  snapshot-notification-spec-v1.0.md← C-6 新規作成
  title-system-spec-v1.0.md         ← Phase4更新（§5.2）
  trust-system-spec-v2.1.md         ← A-1 新規作成
  venue-attendance-spec-v2.0.md     ← C-3 新規作成
  weekly-gameloop-spec-v1_0.md      ← Phase4更新（§1.3, §1.4）
  技テーブル_全160技_v3_5.md         ← 変更不要

specs/archive/
  finisher-system-spec-v1.0.md      ← 移動（未実装）
  + 既存80+ファイル
```

**全20ファイル** — ゲームの全主要システムをカバー。
