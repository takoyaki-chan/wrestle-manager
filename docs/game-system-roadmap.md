# 🎮 Wrestle Manager ロードマップ

> 最終更新: 2026-02-23（セッション7回目）
> 旧ロードマップ（v0.1〜v0.99c開発記録）はアーカイブ済み

---

## 現在の状態

**v1.0e 完了** — ロスターランダム化実装。能力値ランダム化（pot/trainCapブレ幅）は次セッションで設計予定。

---

## コードベース構成

| ファイル | 行数 | 役割 |
|---------|-----:|------|
| index.html | ~710 | HTML+CSS+起動処理（タイトル/団体設立オーバーレイ） |
| data.js | ~1,000 | 全データ定数（キャラ98名・ROSTER_CFG・CHAR_GROUP・技160種・コーチ8名・交渉設定・セリフ等） |
| engine.js | ~3,310 | ゲームロジック全体（Engineオブジェクト＋initRandomRoster＋交渉システム） |
| app.js | ~2,460 | Audio+Storage+Mission+Survival+App統合+対抗戦観戦+タイトル画面制御 |
| ui-common.js | ~1,890 | ヘルパー関数+ポップアップ+対抗戦演出+セリフ+交渉UI |
| ui-render.js | ~2,055 | 全render関数+refreshAll |
| victory-lines.js | 501 | 勝利台詞データ |
| battle-engine.html | 1,682 | ビジュアル観戦モード（iframe） |
| **合計** | **~13,600** | |

その他: portrait-map.js（ルート）、顔画像107枚（image/）

---

## 今セッション完了済み（v1.0e）

### v1.0e — ロスターランダム化（セッション7）

| # | 項目 | 変更ファイル |
|---|------|-------------|
| ✅ | **ROSTER_CFG新設** — org_s=16, org_a=13, org_b=10, fa=22, draftFixed=2, draftCandidates=6, draftPicks=3, superEliteThreshold=850, eliteThreshold=740, seriesBonus=0.3 | data.js |
| ✅ | **CHAR_GROUP新設** — 全98名を18グループにタグ付け（学校単位/シリーズ単位）。学園女子プロレスは学校別、他はシリーズ別 | data.js |
| ✅ | **ORG_ASSIGNハードコード廃止** — const→let化、空配列デフォルト。initRandomRosterが動的に埋める | data.js |
| ✅ | **initRandomRoster(rng)新設** — potTotal基準の重み付きランダム配分。S級(potWeight=3.0,min690)/A級(potWeight=1.0,min640)/B級(potWeight=0.3)/FA/dormant。シリーズボーナス+0.3、逸材制限(A≤3,B≤1) | engine.js |
| ✅ | **generateDraftConfig書き換え** — 旧DRAFT_AVAILABLE_IDS/WEAK_POOL/MID_POOL廃止。FAプール22名から動的に固定2名+候補6名を選出 | data.js |
| ✅ | **poolIds→dormantPoolリネーム** — state.poolIds→state.dormantPool全箇所置換。getPoolIds()→getDormantIds()。dormant数は動的計算(98-16-13-10-22=37) | engine.js, app.js |
| ✅ | **AI選手年齢幅拡大** — 旧18〜26歳→15〜33歳一様ランダム | engine.js |
| ✅ | **後方互換マイグレーション** — 旧セーブのpoolIds→dormantPool自動変換 | app.js |

#### 検証結果

- 98名重複ゼロ、全員いずれかのカテゴリに配分
- 5シード比較: S級の重複2〜6名/16名（毎回大きく変化）
- ドラフト候補・固定枠もシードごとに完全変化
- S級 potTotal: min690+ avg740+（有望〜逸材レベル以上を保証）
- ドラフト完了後: ロースター5名 + FA17名 + dormant37名 + AI39名 = 98

---

## 前セッション完了済み

### v1.0d — バトルUI改修（セッション6）

| # | 項目 | 変更ファイル |
|---|------|-------------|
| ✅ | バトルポートレート修正（cover→contain, aspect-ratio:3/4） | battle-engine.html |
| ✅ | バトル画面全体リバランス | battle-engine.html |
| ✅ | ランキング「選手を引き抜く」ボタン | ui-render.js |
| ✅ | ランキングポートレートにモニター効果 | index.html, ui-render.js |

### v1.0c — サウンドデザイン刷新（セッション5）

| # | 項目 |
|---|------|
| ✅ | SFX全面リデザイン（v3 final mix）47種 |
| ✅ | ゴング音リデザイン（開始ゴング＋終了ベル×3連打） |
| ✅ | BGM 3曲実装（タイトル/メイン/バトル） |
| ✅ | AudioUtils共通モジュール |

### v1.0b — F1/F2/F3改修（セッション4）

| # | 項目 |
|---|------|
| ✅ | F1改: B級有望選手制限解除 |
| ✅ | F3改: 社長キャラ全面削除→エース選手が団体の顔に |
| ✅ | F3改: 団体名ランダム化 |
| ✅ | F3改: org ID統一（org_s/org_a/org_b） |
| ✅ | F3改: 対抗戦演出改修 |
| ✅ | F2改: 引き抜き交渉システム新規実装（4週間交渉＋3段階プラン＋成功率計算） |

### v1.0a — オープニング画面（セッション3）

| # | 項目 |
|---|------|
| ✅ | タイトル画面 |
| ✅ | 団体名入力専用画面 |
| ✅ | ドラフト画面セリフ強化 |
| ✅ | ドラフト入団時キャラ固有セリフ |

### v0.99d〜v0.99f（セッション1-2）

| # | 項目 |
|---|------|
| ✅ | 対抗戦チャレンジポップアップ＋観戦＋リアクション |
| ✅ | スカウト生成キャラ廃止 → ALL_CHARSプールのみ |
| ✅ | ランキングカラー順位ベース化 |
| ✅ | おまかせ育成モード |
| ✅ | FA月次入れ替え |
| ✅ | AI団体ティア制限＋成長ボーナス＋S級引き抜き+FA先取り |

---

## 確定済み設計決定事項

- **年齢割引は導入しない** — ティアベース評価額（assessedValue）を維持
- **ランダム生成キャラは廃止** — スカウトは全員ALL_CHARSの既存キャラのみ
- **ランキング色は順位ベース** — 団体固有色ではなく順位で色が変わる
- **社長キャラは廃止** — 敵団体はエース選手がストーリー上の顔
- **団体名はランダム** — RIVAL_ORG_NAME_POOLからゲーム開始時に決定
- **引き抜きは交渉制** — 4週間の交渉期間＋成功率判定
- **ロスターランダム化** — potTotal重み付き配分。S級≥690, A級≥640。シリーズボーナス+0.3。dormant動的計算

---

## v1.0 — 残タスク

| # | タスク | 重さ | 状態 |
|---|--------|:----:|------|
| ~~10-1~~ | ~~ロスターランダム化~~ | ~~大~~ | ✅ 完了（v1.0e） |
| 10-2 | ZIP配布パッケージ作成（HTML+JS+画像一式） | 小 | 未着手 |
| 10-3 | チュートリアル/ヘルプ画面 | 中 | 未着手 |
| 10-5 | READMEを配布用に書き換え | 小 | 未着手 |

---

## 次セッション予定: 能力値ランダム化の設計

以前決定済み（training-system-spec-v1_0.md §1.4）の**trainCapランダム生成**は実装済みだが、**potTotal自体にニューゲームごとのブレ幅を持たせる**仕組みが未実装。

### 議論予定の論点

1. **ティア区分の名称と分布** — 現5段階（超逸材/逸材/有望/原石/素材）の閾値・人数バランスは適切か？
2. **pot値にブレを持たせるか** — pot（Notion DB値）自体を±数%ランダム化するか、それとも別の仕組みか
3. **A・B級の所属制約** — roster-randomization-design.md §2の未解決問い。年齢/シリーズ/能力/混合のどれか
4. **dormant解禁ルール** — 現状FAローテーション（4週ごと2名交代）のみ。シーズン跨ぎの解禁サイクルは要設計か

---

## v1.1以降 — 拡張候補

| 項目 | 優先度 | 備考 |
|---|---|---|
| フィニッシャー（キャラ固有必殺技） | 高 | 設計書 第3部 3.11 |
| イベントシステム（覚醒・スランプ・引退試合） | 高 | 設計フェーズ⑪（未設計） |
| ライバルストーリー自動生成 | 高 | ⑪の一部 |
| エンディング/ゲームオーバー演出 | 中 | ⑪の一部 |
| コーチ転身 | 中 | scout-system-spec §8.2 で予約済み |
| タッグマッチ・タッグ王座 | 中 | — |

---

## アーキテクチャ5原則（全達成済み）

1. Engine = 純粋関数（DOM禁止）
2. GameState戻り値更新（in-place変更禁止）
3. UIはG直接変更禁止（App経由のみ）
4. 乱数はseed管理で再現可能
5. tickWeek統合パイプライン

---

## 設計書インデックス

| ドキュメント | ファイル | 場所 |
|---|---|---|
| ゲームデザイン総覧 | wrestle-manager-game-design-current.md | docs/ |
| ファイル分割計画 | plan-split-and-features.md | docs/ |
| ロスターランダム化（設計メモ） | roster-randomization-design.md | docs/ |
| バトルエンジン | battle-engine-spec-v4.1b.md | specs/ |
| キャラクターデータ（98名） | character-data-spec-v1.4.md | specs/ |
| 経済システム | economy-system-spec-v1_0.md | specs/ |
| コンディション/怪我 | condition-system-spec-v1.0.md | specs/ |
| 週間ゲームループ | weekly-gameloop-spec-v1_0.md | specs/ |
| 育成/トレーニング | training-system-spec-v1_0.md | specs/ |
| MQスコア＋人気 | mq-popularity-spec-v1.0.md | specs/ |
| 団体ランキング/勝利条件 | org-ranking-spec-v1_0.md | specs/ |
| タイトル/ベルト | title-system-spec-v1.0.md | specs/ |
| スカウト | scout-system-spec-v1.0.md | specs/ |
| ライバル団体AI | rival-org-spec-v1.0.md | specs/ |
| 価格バランス | pricing-balance-spec-v0.99.md | specs/ |
| 特性リスト（25種） | traits-v2.1.md | specs/ |
| 技テーブル（160技） | 技テーブル_全160技_v3_5.md | specs/ |
| 興行＋観客動員改修 | card-attendance-redesign-spec-v1.0.md | specs/ |
| 人気・会場再設計 | popularity-venue-redesign-spec-v1.0b.md | specs/ |
| ライバルシステム旧版 | rival-system-spec-v0_9.md | specs/ |

---

## メモ

- 2026-02-22 セッション1: 新ロードマップ作成。旧ロードマップアーカイブ。
- 2026-02-22 セッション2: 対抗戦演出全面改修、スカウト生成廃止、ランキングカラー、QoLバッチ。
- 2026-02-22 セッション3: v1.0a オープニング画面実装。
- 2026-02-22 セッション4: v1.0b F1/F2/F3全面改修。社長削除→エース演出。交渉制。団体名ランダム化。org ID統一。
- 2026-02-23 セッション5: v1.0c サウンドデザイン全面刷新。SFX47種v3。BGM3曲。ゴング＋ベル。AudioUtils。
- 2026-02-23 セッション6: v1.0d バトルUI改修。ランキングUI改修。ロスターランダム化の調査開始。
- 2026-02-23 セッション7: **v1.0e ロスターランダム化実装完了**。ROSTER_CFG/CHAR_GROUP新設、initRandomRoster、dormantPool動的計算、ドラフト動的化、年齢15-33、後方互換。5シードテストで重複ゼロ・毎回異なる顔ぶれを確認。**次回: 能力値ランダム化（potブレ幅）の設計議論**。
