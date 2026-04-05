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

## 未完了の作業（次セッションで実施）

### カテゴリA: アーカイブからアクティブspecを作成（7件）

いずれも specs/archive/ にアーカイブ版があり、それを元に現行実装を反映した新しいアクティブspecを作成する。

| # | システム | アーカイブ元 | 優先度 |
|---|---------|-----------|--------|
| A-1 | Trust/信頼度 v2.1 | specs/archive/trust-redesign-v2.1.md | **高** |
| A-2 | Bond/Rivalry関係性システム | specs/archive/relationship-system-spec-v0.2.md, bond-rivalry-balance-spec-v2.0.md | **高** |
| A-3 | 契約交渉イベント | specs/archive/contract-negotiation-event-spec-v2.0.md | 中 |
| A-4 | プロモシステム v1.0 | specs/archive/promo-redesign-spec-v1.0.md | 中 |
| A-5 | レンタルシステム v2 | specs/archive/rental-system-spec.md | 中 |
| A-6 | 成長システム v2.0 | specs/archive/growth-system-redesign-v2.0.md | 中 |
| A-7 | PPV GRAND FINAL | specs/archive/ppv-grand-final-spec-v2.0.md | 中 |

**作業手順**:
1. specs/archive/ の該当ファイルを読む
2. 実装コード（management.js/relationships.js/data.js）と突き合わせ
3. 現行実装に合わせた新specファイルを specs/ に作成
4. 末尾に `<!-- 再同期: 2026-04-05, 指示書: docs/specs-resync-instruction.md -->` を付与
5. 1ファイルごとにコミット

### カテゴリC: 新規spec作成（7件）

specs/にもアーカイブにも対応ファイルがないシステム。実装コードから逆起こしでspecを書く。

| # | システム | 主な実装箇所 | 優先度 |
|---|---------|-----------|--------|
| C-1 | 性格/アーキタイプシステム | relationships.js (PERSONALITY_BOND_MATRIX) | 中 |
| C-2 | 大型イベント B1-B4 | management.js (applyLargeEventEffect), data.js (EVENT SYSTEM v2.0) | 中 |
| C-3 | 会場・集客システム v2.0 | management.js (calcBaseAttendance, VENUES), data.js (BASE_ATTENDANCE_CURVE) | 中 |
| C-4 | 経済バランス v2.0 | management.js (processSettlement, GOODS_CONFIG, MEDIA_CONFIG) | 中 |
| C-5 | コーチシステム v3.0 | management.js (Engine.coach), data.js (ALL_COACHES) | 中 |
| C-6 | スナップショット通知 | relationships.js (Engine.snapshot, SNAPSHOT_TEXTS) | 低 |
| C-7 | MQ計算 v3.0 | → **battle-engine-spec-v4.2.md §17に統合済み**。追加specは不要 | ✅完了 |

> **C-7は実質完了**: battle-engine-spec v4.2の§17(MQスコア計算)で外部MQ整理・CAP12・ペーシング撤廃を記載済み。

**作業手順**:
1. 実装コードの該当関数・定数を精読
2. 定数一覧・計算式・処理フローを抽出
3. specs/ に新specファイルを作成
4. 1ファイルごとにコミット

---

## 注意事項

- **specs/ を更新する際は CLAUDE.md の「specs/ 更新ルール」に従うこと**
- 元の構造・トーンをなるべく保つ（用語: MQ、信頼、絆、ライバル関係）
- 不明点は推測せず Keisuke さんに質問する
- `docs/specs-drift-report.md` に各項目の詳細な差分情報があるので参照のこと

---

## 現在の specs/ ファイル一覧（更新後）

```
specs/
  battle-engine-spec-v4.2.md        ← 更新済み（旧v4.1b）
  character-data-spec-v1.7.md       ← リネーム済み（旧v1.4）
  rival-org-spec-v1.0.md            ← 更新済み（§3.2, §4 改訂）
  scout-system-spec-v1.0.md         ← 更新済み（§3.1, §6.1）
  title-system-spec-v1.0.md         ← 更新済み（§5.2）
  weekly-gameloop-spec-v1_0.md      ← 更新済み（§1.3, §1.4）
  技テーブル_全160技_v3_5.md         ← 変更不要

specs/archive/
  finisher-system-spec-v1.0.md      ← 移動（未実装）
  + 既存80+ファイル
```
