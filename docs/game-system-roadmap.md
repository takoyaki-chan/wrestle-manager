# Wrestle Manager ロードマップ

> 最終更新: 2026-02-27（セッション29）
> セッション履歴: `docs/archive/session-history.md`
> 完了済みタスク: `docs/archive/completed-tasks.md`

---

## 現在の状態

**セッション29完了。** タイトルマッチ格差ペナルティ（OVR差>10:MQ-3、>20:MQ-6）＋特性4種実装（適応力/人望/忠誠心/野心）。v2.0イベントシステム Phase 1（Step 1〜5）完了。

---

## 次の実装予定

### v2.0イベントシステム — 残タスク

| # | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| Phase1-6 | **大型イベント（B1〜B4）** 練習中の怪我・選手間対立・ファン大型リクエスト・スポンサー撤退危機。資金による解決ルート含む | 中 | 未実装 |
| Phase1-7 | **セリフバリエーション拡充 + バランス調整** プレイテストに基づく数値調整。セリフパターン追加（反復感の排除） | 中 | 未実装 |

### Phase 2: プレイの方向性・動機付け

数シーズン遊んだ後のマンネリ防止を目標とする。

- **ファン期待度の拡張** — より多様な期待パターン、長期的な期待の蓄積
- **物語的な目標イベント** — 「○○にふさわしい舞台を用意できるか？」等、大型イベント（B枠）の一種。KPI的数値目標ではなくドラマの文脈を持った目標
- **ロッカールームの空気の可視化** — 間接的なヒント表示

### Phase 3: ゲームの個性確立

「女子プロレスのドラマを演出するゲーム」としての独自性確立を目標とする。

- **ストーリーアーク** — 数ヶ月にわたる抗争管理。完結時に大きな収益
- **練習システムのリデザイン** — メニュー選択制、コーチ割当の再設計

### 拡張候補

| 項目 | 優先度 | 備考 |
|---|---|---|
| フィニッシャー（キャラ固有必殺技） | 高 | 設計書 第3部 3.11 |
| ライバルストーリー自動生成 | 高 | 未設計 |
| エンディング/ゲームオーバー演出 | 中 | 未設計 |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | — |

---

## コードベース構成

| ファイル | 行数 | 役割 |
|---------|-----:|------|
| index.html | ~1,110 | HTML+CSS+起動処理 |
| data.js | ~1,370 | 全データ定数（キャラ98名・コーチ8名・技160種） |
| engine.js | ~4,860 | ゲームロジック全体 |
| app.js | ~3,090 | Audio+Storage+Mission+App統合 |
| ui-common.js | ~2,440 | ヘルパー+ポップアップ+各種UI |
| ui-render.js | ~2,110 | 全render関数 |
| victory-lines.js | 501 | 勝利台詞データ |
| battle-engine.html | 1,734 | ビジュアル観戦モード（iframe） |
| **合計** | **~17,215** | |

その他: `portrait-map.js`（ルート）、顔画像107枚＋表彰式フレーム7枚（image/）、build-zip.sh

---

## 設計決定ログ（実装済みルール集）

- **ロスターランダム化** — potTotal重み付き配分。S級≥690, A級≥640。シリーズボーナス+0.3。dormant動的計算
- **チャンピオン集客ボーナス** — チャンピオン出場時に集客×1.10
- **乱入マッチ** — チャンピオン3回防衛後、タイトルマッチ当日に20%で発生。隣接団体OVR90%以上の選手が乱入。勝利+2/敗北-15〜-20
- **フレーバーイベント** — チャンピオン or 人気55以上に12%/週。雑誌取材（人気+2〜3）・TV出演（ヒート+2〜3）
- **殿堂入り条件** — 獲得＋防衛合計13回以上、またはグランドスラム
- **衰退・引退はdurability + wear方式** — wearは28+durability歳から蓄積。wear 20〜39で軽度衰退、40〜59で本格衰退（引退20%/年）、60〜79で末期（50%/年）、80+で確定引退
- **壊滅的怪我** — 重傷時に追加判定。基本2〜3%、ベテラン(wear40+)は5〜8%。即引退
- **PPVは全団体合同大会** — エントリー制（Week44締切）、Week48開催。枠数はランク依存（S=5,A=4,B=3,4位=2）
- **PPVマッチメイクは盛り上がり優先** — 因縁最優先、次に盛り上がりスコア
- **年末表彰式** — 新人王・ベストマッチ・MVP・チャンピオン紹介・殿堂入り
- **集客計算は加算方式** — heat/title/champ/charismaのボーナスを加算し上限2.0倍キャップ
- **人気の自然減衰** — 毎週-0.5（人気10超の全選手）
- **orgPop年次減衰** — シーズン末にorgPop比例（-2/-3/-5/-7/-10）
- **FA年齢保存方式** — dormantPool退場時に{id, age}で保存。22歳超はFA参入不可
- **HEAT倍率圧縮** — Warm ×1.1、Hot ×1.2、On Fire ×1.3。興行週にも軽減衰-0.3
- **baseAttendance係数** — (orgPop/100)² × 10000
- **給料テーブル** — OVR80帯:100万/週、OVR90帯:180万/週
- **グッズ単価** — 0.15万/人（チケット:グッズ比率 3:1）
- **育成補助金** — orgPop 40未満に地域振興助成金（0-19:50万/週、20-29:35万/週、30-39:20万/週）
- **orgPop逓減カーブ** — 0→×1.0, 20→×0.60, 40→×0.35, 55→×0.20, 70→×0.12, 85→×0.08
- **Heat維持困難化** — HOT以上（heatScore≥6）で上昇×0.5、冷め速度1.5倍
- **内部小数化** — popularity/orgPopを小数のまま保持。表示はdispPop/dispOrgPop（Math.round）
- **MQ外部ボーナスキャップ** — 外部ボーナス合計+15上限。因縁+3/+5/+8、タイトル+5、コーチ+2、超満員+3/大入り+2、会場0-2
- **タイトルマッチ格差ペナルティ** — OVR差>10:MQ-3、>20:MQ-6（キャップ後別途減算）
- **特性4種効果** — 適応力:growthPenalty+0.2軽減、人望:lockerRoomMorale+3/週、忠誠心:引き抜き確率×0.25、野心:挑戦者MQ+2+ブレークスルー+0.5%
- **trustパラメータ** — レスラーに trust(0-100) 追加。mentalCoeffの変動係数。自然減衰(-1/月)
- **ファン期待度** — 因縁ペア(priority3) → 王者挑戦者(priority2) → 人気上位(priority1)。最大3件。実現時MQ+5
- **ニュースティッカー** — manage画面スクロールバー。毎週3-5件生成。8カテゴリ
- **新聞パネル** — 重大イベント時にスポーツ新聞風ポップアップ。8種×複数パターン
- **autoFillCardのタイトルマッチチェック** — autoFillCard()でEngine.title.canTitleMatch()を確認

---

## アーキテクチャ5原則

1. Engine = 純粋関数（DOM禁止）
2. GameState戻り値更新（in-place変更禁止）
3. UIはG直接変更禁止（App経由のみ）
4. 乱数はseed管理で再現可能
5. tickWeek統合パイプライン

---

## 設計書インデックス

### docs/（永続ドキュメント）

| ドキュメント | ファイル |
|---|---|
| ロードマップ（本ファイル） | game-system-roadmap.md |
| マスタースペック（現行仕様） | master-spec.md |
| 世界観設定 | world-setting.md |
| ロスターランダム化 v2 | roster-randomization-design-v2.md |
| 難易度リバランス設計 | difficulty-rebalance-design-v1.0.md |

### specs/（現行仕様書）

| ドキュメント | ファイル |
|---|---|
| バトルエンジン | battle-engine-spec-v4.1b.md |
| キャラクターデータ（98名） | character-data-spec-v1.4.md |
| 経済システム | economy-system-spec-v1_0.md |
| コンディション/怪我 | condition-system-spec-v1.0.md |
| 週間ゲームループ | weekly-gameloop-spec-v1_0.md |
| 育成/トレーニング v1.2 | training-system-spec-v1_2.md |
| MQスコア＋人気 | mq-popularity-spec-v1.0.md |
| 団体ランキング/勝利条件 | org-ranking-spec-v1_0.md |
| タイトル/ベルト | title-system-spec-v1.0.md |
| スカウト | scout-system-spec-v1.0.md |
| ライバル団体AI | rival-org-spec-v1.0.md |
| 特性リスト（25種） | traits-v2.1.md |
| 技テーブル（160技） | 技テーブル_全160技_v3_5.md |
| イベントシステム v2 | event-system-spec-v2.md |
| 成長イベントシステム | growth-event-spec-v1.0.md |
| 世界観演出システム | world-presentation-spec-v1.4.md |

### docs/archive/（旧版・完了済み）

| ファイル | 内容 |
|---|---|
| docs/archive/session-history.md | セッション1〜29の開発記録 |
| docs/archive/completed-tasks.md | v1.0〜v2.0の完了済みタスク一覧・マイグレーション一覧 |

### specs/archive/（完了済み実装仕様・旧版）

| ファイル | 内容 |
|---|---|
| v1.3-1-decay-retirement-spec.md | 衰退・引退システム（v1.3-1実装済み） |
| v1.3-2-growth-injury-spec.md | 成長システム改訂＋怪我デバフ（v1.3-2実装済み） |
| v1.3-3-retirement-presentation-spec.md | 引退演出（v1.3-3実装済み） |
| v1.4-awards-impl-spec.md | 年末表彰式（v1.4実装済み） |
| v1.4-awards-ui-revision-spec.md | 年末表彰式UI修正（v1.4実装済み） |
| session25-impl-spec.md | 内部小数化＋MQボーナス見直し（v1.5s25実装済み） |
| session25b-milestone-spec.md | rawDeltaカーブ＋節目イベント（v1.5s25b実装済み） |
| economy-rebalance-spec-v5b.md | 経済リバランス設計書（v1.5として実装済み） |
| card-attendance-redesign-spec-v1.0.md | 集客計算リデザイン設計書（実装済み） |
| popularity-venue-redesign-spec-v1.0b.md | 人気・会場再設計仕様書（実装済み） |
| ppv-awards-spec.md | PPV＋年末表彰式仕様書（実装済み） |
| pricing-balance-spec-v0.99.md | 価格バランス設計書 v0.99（旧版） |
| balance-test-spec.md | バランステスト仕様書（旧版） |
| training-system-spec-v1_0.md | 育成システム v1.0（旧版、v1_2が現行） |
| rival-system-spec-v0_9.md | ライバル団体システム v0.9（旧版） |

---

## メモ

- build-zip.shは要確認: `image/award-frame-*.png`（7枚）と `portrait-map.js` が未包含の可能性あり
- README.mdの「120名以上のキャラクター」は固有キャラ98名＋スカウト生成＋コーチ8名の合算
- セッション17のバランスシミュレーション結果: `tests/balance-sim.js` で再現可能
- 会場ロック判定は `Math.round(G.orgPop)` で比較すること（内部小数化対応）
