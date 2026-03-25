# 殿堂入り拡張 — Claude Code 実装タスクリスト

設計書: `specs/hall-of-fame-expansion-v2.0.md`

---

## Task 1: allHallOfFame データ基盤 + マイグレーション

- `state.allHallOfFame = { player: [], org_s: [], org_a: [], org_b: [] }` を新設
- 既存 `state.hallOfFame` → `allHallOfFame.player` へマイグレーション（app.js のマイグレーション群に追加）
- 既存の `hallOfFame` を参照している全箇所を `allHallOfFame.player` に切り替え（engine.js / app.js / ui-common.js / ui-render.js）
- 後方互換: `state.hallOfFame` への参照が残っていてもクラッシュしないようにする
- HOFエントリに新フィールド追加: `orgId`, `careerHighlights`, `retireOVR`, `retireAge`, `shieldVariant`
- 既存HOFエントリのマイグレーション時に `careerHighlights` は careerRecord.history があれば構築、なければ空配列

## Task 2: buildCareerHighlights 関数 + SHIELD_VARIANTS

- `Engine.awards.buildCareerHighlights(careerRecord, orgName)` を実装
  - careerRecord.history から5種のイベントを抽出: titleWin / titleDefense(3度以上) / titleLoss / juniorTournament(champion) / ppvMainEvent(win/champion)
  - 固有名詞テキスト生成（「WSW世界王座 初戴冠」「WSW世界王座 2度目の戴冠」等、戴冠回数を連番表記）
  - 時系列ソート
- `data.js` に `SHIELD_VARIANTS` 定義を追加: `{ 1: ['a'], 2: ['a'], 3: ['a'] }` （初期は各1種、後で追加可能）
- `assignShieldVariant(hofLevel, fighterId)` 関数を実装（ID由来ハッシュでバリエーション安定割り当て）
- `getShieldUrl(variant)` 関数を実装（`../image/shield/shield_${variant}.webp`）
- 既存の `checkHallOfFame` が返すエントリに `careerHighlights`, `retireOVR`, `retireAge`, `shieldVariant` を追加

## Task 3: NPC団体の殿堂入り処理

- `Engine.rival.processSeasonEnd` 内、aiRetirees判定の直後にHOF判定を追加
  - 各引退者の `careerRecord` から `calcHofPoints` → 12pt以上なら殿堂入り
  - `buildCareerHighlights` でハイライト構築
  - `assignShieldVariant` で盾割り当て
  - 一時フィールド `_npcInductees` に格納
- `advanceWeek` のシーズン末処理（`Engine.rival.processSeasonEnd` 呼び出し後）で `_npcInductees` を回収 → `allHallOfFame[orgId]` に追加
- `_npcInductees` 回収後に一時フィールド削除
- 新聞ティッカーにNPC殿堂入りニュースを追加（翌シーズン初週）

## Task 4: レガシーポイント動的化

- `Engine.ranking.calcLegacyScore` を変更:
  - 全団体共通: `allHallOfFame[orgId].length * 10`（上限50）
  - S/A/B固定値を廃止
- `RANKING_CONFIG.legacyCapByTier` を全団体50に変更
- ランキング画面のツールチップ（ui-render.js `_rankTips.legacy`）テキスト更新
  - 変更前: 「AI団体はティアに応じた固定値」
  - 変更後: 「全団体共通: 殿堂入り1名ごとに+10pt（上限50pt）」

## Task 5: DB殿堂タブ — 盾グリッド一覧（Layer 1）

- `_renderDbHallOfFame` を全面書き換え
- 全団体統合表示: `allHallOfFame` の全団体を結合して表示
- 団体フィルタ（タブ型切り替え）: 全団体 / プレイヤー / org_s / org_a / org_b、各タブに人数バッジ
- 2列グリッドで盾カードを配置:
  - 盾画像（80px幅、`getShieldUrl(h.shieldVariant)` で取得。画像がない場合はランク別emoji fallback）
  - 殿堂ランクテキスト
  - 顔アイコン36px + 名前
  - 団体名 / スタイル
  - 活動期間
  - 主要数字（王座X回 / 防衛X回）
  - 殿堂pt
- カードクリック → Task 6 の詳細ポップアップを開く
- ホバー時にリフト＋枠色が明るくなる
- ソート: デフォルト=殿堂入りシーズン降順。切り替え可能: hofPoints降順 / 団体別 / 名前順
- 空状態テキスト（殿堂ポイント説明付き）
- hofLevel別カード枠色: 1=silver(#bdc3c7) / 2=gold(#d4a843) / 3=金グロー

## Task 6: DB殿堂タブ — 詳細ポップアップ（Layer 2）

- 盾カードクリックで開くモーダル（既存のポップアップ機構を使うか新設するか、適切な方法で）
- 上部: 盾画像（120px幅） + 殿堂ランクテキスト
- プロフィール: 顔画像80px丸型（hofLevel別枠色）+ 名前 / 団体 / スタイル / 活動期間 / 最高OVR / 引退時OVR
- 全身画像（upper画像）: getUpperUrl で取得、ある場合のみ表示（高さ150px程度）、ない場合はレイアウト崩れなし
- キャリアハイライト年表: 左にシーズン番号（dim色）、右にアイコン+テキスト（👑/🛡️/💔/🏟️/🏆）
- 通算実績: 2×2グリッド（王座獲得 / 通算防衛 / JT優勝 / PPV優勝）
- 殿堂pt + 殿堂入りシーズン
- レジェンド（★★★）特別演出: 盾周囲にゴールドグロー、ヘッダーに金グラデーション背景
- 閉じるボタン

## Task 7: 表彰式スライドへの反映

- `_buildHallOfFame`（ui-common.js）にキャリアハイライト年表を追加
  - 盾画像表示（`getShieldUrl`）
  - careerHighlights を時系列で表示（アイコン付き）
  - 引退時年齢を表示
- 年末表彰式サマリー（`_buildAwardsSummary`）にNPC殿堂入り者を含める
  - `allHallOfFame` の当シーズン inductionSeason 一致分を全団体から収集
  - 名前＋団体名＋ランク表示

---

## 実装順の注意

- Task 1→2→3 は依存関係あり（順番通り）
- Task 4 は Task 1 完了後ならいつでもOK
- Task 5→6 は依存関係あり（一覧が先、ポップアップが後）
- Task 7 は Task 2 完了後ならいつでもOK
- 並走可能な組み合わせ: Task 4 と Task 5（変更ファイルが被らない）

## ユーザー作業（並行）

- `image/shield/` ディレクトリを作成し、盾画像を配置
  - 最低3枚: `shield_1_a.webp` / `shield_2_a.webp` / `shield_3_a.webp`
  - サイズ: 200〜300px幅推奨（CSS拡縮で表示）
  - バリエーション追加時は `SHIELD_VARIANTS` の定義も更新
