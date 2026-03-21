# 殿堂入り拡張 — Claude Code 実装仕様書（統合版）

設計書: `specs/hall-of-fame-expansion-v2.0.md`
GitHub: takoyaki-chan/wrestle-manager

---

## 実装順と依存関係

```
Task 1 → Task 2 → Task 3（順番厳守）
Task 4 は Task 1 完了後ならいつでもOK
Task 5 → Task 6（順番厳守）
Task 7 は Task 2 完了後ならいつでもOK
並走可能: Task 4 と Task 5（変更ファイルが被らない）
```

**自動検証**: 各Task完了後に 10 seeds × 10 seasons = 100 seasons の auto-sim で ALL CLEAR を確認すること。

---

## Task 1: allHallOfFame データ基盤 + マイグレーション + 殿堂ptバグ修正

### 1-A. データ構造の新設

- `state.allHallOfFame = { player: [], org_s: [], org_a: [], org_b: [] }` を新設
- 既存 `state.hallOfFame` → `allHallOfFame.player` へマイグレーション（app.js のマイグレーション群に追加）
- 既存の `hallOfFame` を参照している全箇所を `allHallOfFame.player` に切り替え（engine.js / app.js / ui-common.js / ui-render.js）
- 後方互換: `state.hallOfFame` への参照が残っていてもクラッシュしないようにする

### 1-B. HOFエントリの新フィールド追加

HOFエントリに以下を追加:
- `orgId`
- `careerHighlights`（配列）
- `retireOVR`
- `retireAge`
- `shieldVariant`
- `hofPoints`（★必須。後述のバグ修正参照）
- `hofLevel`（1/2/3）

### 1-C. 殿堂ptバグ修正（最優先）

**現象**: 王座2回 / 防衛25回の選手が殿堂pt: 0 と表示される。
`calcHofPoints`（titleWins + defenses + JT×7 + PPV×9）に基づけば最低 27pt のはず。

**原因**: HOFエントリ生成時に `hofPoints` が正しく計算・保存されていない。
既存セーブデータの `hallOfFame` エントリに `hofPoints` フィールドが欠落しているか、
`careerRecord` の `totalTitleWins` / `totalDefenses` が引退時に正しく反映されていない。

**対応**:
1. `checkHallOfFame` および `applyHallOfFame` で hofPoints を **必ず** `calcHofPoints` で計算して保存する
2. **マイグレーション**: 既存HOFエントリに hofPoints がない or 0 の場合、保存済みの titleReigns + totalDefenses から再計算
3. hofLevel も再計算して反映（12=★、18=★★、25=★★★）
4. 盾画像・ランクテキストも hofLevel に連動して正しく表示

---

## Task 2: buildCareerHighlights 関数 + SHIELD_VARIANTS

### 2-A. buildCareerHighlights

`Engine.awards.buildCareerHighlights(careerRecord, orgName)` を実装:
- `careerRecord.history` から5種のイベントを抽出:
  - `titleWin`（👑 戴冠）
  - `titleDefense`（🛡️ 防衛マイルストーン: 3度以上で記録）
  - `titleLoss`（💔 陥落）
  - `juniorTournament` champion（🏟️ JT優勝）
  - `ppvMainEvent` win/champion（🏆 PPV優勝）
- 固有名詞テキスト生成:
  - 「WSW世界王座 初戴冠」「WSW世界王座 2度目の戴冠」等、戴冠回数を連番表記
  - 防衛マイルストーン: 「WSW世界王座 5度防衛」「WSW世界王座 10度防衛」
  - 陥落: 「WSW世界王座 陥落（12度防衛の末に）」
- 時系列ソート
- 各エントリの形式: `{ season, icon, text }`

### 2-B. SHIELD_VARIANTS

- `data.js` に `SHIELD_VARIANTS` 定義を追加: `{ 1: ['a'], 2: ['a'], 3: ['a'] }`（初期は各1種）
- `assignShieldVariant(hofLevel, fighterId)` 関数を実装（ID由来ハッシュでバリエーション安定割り当て）
- `getShieldUrl(variant)` 関数を実装（`../image/shield/shield_${variant}.webp`）

### 2-C. 既存関数への統合

- `checkHallOfFame` が返すエントリに `careerHighlights`, `retireOVR`, `retireAge`, `shieldVariant` を追加

---

## Task 3: NPC団体の殿堂入り処理

- `Engine.rival.processSeasonEnd` 内、aiRetirees判定の直後にHOF判定を追加:
  - 各引退者の `careerRecord` から `calcHofPoints` → 12pt以上なら殿堂入り
  - `buildCareerHighlights` でハイライト構築
  - `assignShieldVariant` で盾割り当て
  - 一時フィールド `_npcInductees` に格納
- `advanceWeek` のシーズン末処理（`Engine.rival.processSeasonEnd` 呼び出し後）で `_npcInductees` を回収 → `allHallOfFame[orgId]` に追加
- `_npcInductees` 回収後に一時フィールド削除
- 新聞ティッカーにNPC殿堂入りニュースを追加（翌シーズン初週）

---

## Task 4: レガシーポイント動的化

- `Engine.ranking.calcLegacyScore` を変更:
  - 全団体共通: `allHallOfFame[orgId].length * 10`（上限50）
  - S/A/B固定値を廃止
- `RANKING_CONFIG.legacyCapByTier` を全団体50に変更
- ランキング画面のツールチップ（ui-render.js `_rankTips.legacy`）テキスト更新:
  - 変更前: 「AI団体はティアに応じた固定値」
  - 変更後: 「全団体共通: 殿堂入り1名ごとに+10pt（上限50pt）」

---

## Task 5: DB殿堂タブ — 盾グリッド一覧（Layer 1）

### 5-A. 基本構造

- `_renderDbHallOfFame` を全面書き換え
- 全団体統合表示: `allHallOfFame` の全団体を結合して表示
- 団体フィルタ（タブ型切り替え）: 全団体 / プレイヤー / org_s / org_a / org_b、各タブに人数バッジ
- ソート: デフォルト=殿堂入りシーズン降順。切り替え可能: hofPoints降順 / 団体別 / 名前順
- 空状態テキスト（殿堂ポイント説明付き）

### 5-B. カードデザイン（コンパクト版）

**カード幅を縮小して一画面で3〜4人分見渡せるようにする。**

- カードの横幅: 現状から **20〜30%程度狭める**
- 2列グリッドは維持（カードが狭くなった分、左右の余白が生まれて見やすくなる）
- 盾アイコン: **60px**（80px→60pxに縮小）
- 顔アイコン: 36px（据え置き）
- テキスト: 名前は現状維持、それ以外を1px程度小さく
- hofLevel別カード枠色: 1=silver(#bdc3c7) / 2=gold(#d4a843) / 3=金グロー

### 5-C. カード表示項目

- 盾画像（60px幅、`getShieldUrl(h.shieldVariant)`。画像なしの場合はランク別emoji fallback）
- 殿堂ランクテキスト
- 顔アイコン36px + 名前
- 団体名 / スタイル
- 活動期間
- 主要数字（王座X回 / 防衛X回）
- 殿堂pt

### 5-D. インタラクション

- カードクリック → Task 6 の詳細ポップアップを開く
- ホバー時にリフト＋枠色が明るくなる

---

## Task 6: DB殿堂タブ — 詳細ポップアップ（Layer 2）

盾カードクリックで開くモーダル（既存のポップアップ機構を使うか新設するか、適切な方法で）。

### 6-A. ポップアップレイアウト

上から順に:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  [×閉じる]                                            ┃
┃                                                       ┃
┃     [盾画像 120px]                                     ┃
┃     ★★★ レジェンド                                     ┃
┃                                                       ┃
┃  ┌─────────────────────────────────────────────┐      ┃
┃  │  [顔画像 80px]     橘玲美                    │      ┃
┃  │                   戦妃門 / Submission         │      ┃
┃  │                   S2〜S11（10シーズン）       │      ┃
┃  │                   最高OVR 90（S6）            │      ┃
┃  │                   引退時OVR 72（35歳）        │      ┃
┃  └─────────────────────────────────────────────┘      ┃
┃                                                       ┃
┃  [全身画像]  ← upper画像がある場合のみ。高さ150px程度   ┃
┃                                                       ┃
┃  ━━ キャリアハイライト ━━━━━━━━━━━━━━━━━━━━━━━━      ┃
┃                                                       ┃
┃  S3   👑 戦妃門王座 初戴冠                              ┃
┃  S4   🛡️ 戦妃門王座 5度防衛                             ┃
┃  S5   🛡️ 戦妃門王座 10度防衛                            ┃
┃  S6   💔 戦妃門王座 陥落（12度防衛の末に）               ┃
┃  S8   👑 戦妃門王座 2度目の戴冠                         ┃
┃  S9   🛡️ 戦妃門王座 5度防衛                             ┃
┃  S10  💔 戦妃門王座 陥落（13度防衛の末に）               ┃
┃                                                       ┃
┃  ━━ 通算実績 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ┃
┃                                                       ┃
┃  王座獲得 2回  │  通算防衛 25回                          ┃
┃  JT優勝  0回  │  PPV優勝  0回                           ┃
┃                                                       ┃
┃  殿堂pt: 27  ／  殿堂入り: S11                          ┃
┃                                                       ┃
┃          [ 閉じる ]                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 6-B. 殿堂ランク表示

hofLevel に応じて:
- ★ 殿堂入り（12pt以上）→ 色: #bdc3c7（silver）
- ★★ ゴールド殿堂（18pt以上）→ 色: #d4a843（gold）
- ★★★ レジェンド（25pt以上）→ 色: #f39c12（bright gold）+ グロー演出

### 6-C. キャリアハイライト年表

`careerHighlights` 配列（hall-of-fame-expansion-v2.0.md §2.1 参照）を使用。

表示形式:
- 左にシーズン番号（dim色、等幅で左揃え）
- 右にアイコン＋実績テキスト
- アイコン: 👑王座獲得 / 🛡️防衛マイルストーン / 💔陥落 / 🏟️JT優勝 / 🏆PPV優勝

**フォールバック**:
- `careerHighlights` が空の場合（既存セーブ互換）: `careerRecord.history` があれば `buildCareerHighlights` で動的に構築
- それもなければ通算実績の数字のみ表示（キャリアハイライトセクション自体を非表示）

### 6-D. 引退時情報

```
引退時OVR: 72（35歳）
```
`retireOVR` と `retireAge` をHOFエントリから取得して表示。
既存データにない場合は非表示（レイアウト崩れなし）。

### 6-E. ビジュアル仕様

| 要素 | 仕様 |
|------|------|
| ポップアップ幅 | 画面幅の80%程度（最大500px） |
| 盾画像 | 上部中央に120px幅 |
| 顔画像 | 80×80 丸型。hofLevel に応じた枠色 |
| 全身画像 | `getUpperUrl(id)` で取得。ある場合のみ表示。高さ150px、中央揃え |
| キャリアハイライト | シーズン番号を等幅で左揃え。テキストは通常フォント |
| 通算実績 | 2×2グリッド。数字を太字 |
| レジェンド特別演出 | ★★★の場合: 盾画像の周囲にbox-shadowでゴールドグロー |
| スクロール | ポップアップ内容が画面に収まらない場合は内部スクロール |

---

## Task 7: 表彰式スライドへの反映

- `_buildHallOfFame`（ui-common.js）にキャリアハイライト年表を追加:
  - 盾画像表示（`getShieldUrl`）
  - careerHighlights を時系列で表示（アイコン付き）
  - 引退時年齢を表示
- 年末表彰式サマリー（`_buildAwardsSummary`）にNPC殿堂入り者を含める:
  - `allHallOfFame` の当シーズン `inductionSeason` 一致分を全団体から収集
  - 名前＋団体名＋ランク表示

---

## ユーザー作業（並行）

- `image/shield/` ディレクトリを作成し、盾画像を配置
  - 最低3枚: `shield_1_a.webp` / `shield_2_a.webp` / `shield_3_a.webp`
  - サイズ: 200〜300px幅推奨（CSS拡縮で表示）
  - バリエーション追加時は `SHIELD_VARIANTS` の定義も更新

---

## WM共通UIルール（全Task共通の遵守事項）

- 能力値の対比表示は必ず左右対称レイアウト（中央ラベル、左右バー）
- セリフ/ボイス表示は白い吹き出し（#f0f0f0背景）+黒文字、中央寄せ、話者名は上部に小さく色付き表示
- 数値パラメータに丸い整数を使う場合は、base scale / relative comparison / intended player experience の3点根拠を示すこと
- 内部はfloat、表示はinteger

---

## CLAUDE.md 更新

全Task完了後、`CLAUDE.md` に以下を反映:
- `allHallOfFame` データ構造の説明
- `buildCareerHighlights` / `assignShieldVariant` / `getShieldUrl` の関数説明
- NPC殿堂処理フローの概要
- レガシーポイント動的化の変更内容
