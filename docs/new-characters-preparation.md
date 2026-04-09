# 新規キャラクター実装準備

CSVエクスポート (2026-04-09) から抽出。WM登場=「予定」の29名。

## ステータス凡例
- **画像**: face/upper/stand/full の4種プレースホルダー済み
- **データ完備**: スタイル・アライメント・特性すべて揃っている
- **データ不完全**: 一部フィールド未定義（実装前に確定が必要）

---

## A. データ完備キャラ（23名）— 実装可能

### 学園女子プロレス所属

| # | 名前 | portrait_key | 年齢 | 身長 | Pow | Spd | Tec | Sta | Men | 合計 | 影響力 | アライメント | スタイル | archetype | personality | 特性 |
|---|------|-------------|------|------|-----|-----|-----|-----|-----|------|--------|-------------|---------|-----------|------------|------|
| 1 | 土岐山乃ノ佳 | tokiyama_n | 16 | 152 | 48 | 48 | 60 | 49 | 43 | 248 | ■ | ベビーフェイス | aerial | polite | normal | 努力家 |
| 2 | 沢登鮎 | sawanobori_a | 17 | 168 | 68 | 51 | 64 | 69 | 51 | 303 | ★★ | ベビーフェイス | grappler | default | normal | 引き出し上手 |
| 3 | 大山たかみ | oyama_t | 17 | 179 | 71 | 51 | 45 | 52 | 51 | 270 | - | ヒール | striker | default | normal | - |
| 4 | 財津琴美 | zaitsu_k | 17 | 154 | 54 | 58 | 64 | 67 | 61 | 304 | - | ベビーフェイス | allrounder | polite | earnest | 努力家 |
| 5 | 吉野萌子 | yoshino_m | 16 | 149 | 48 | 55 | 52 | 52 | 48 | 255 | - | ニュートラル | aerial | default | normal | - |
| 6 | 黒岩千晶 | kuroiwa_c | 17 | 181 | 81 | 54 | 52 | 64 | 56 | 307 | - | ニュートラル | grappler | default | normal | - |
| 7 | 赤沼紗稀 | akanuma_s | 17 | 166 | 61 | 67 | 58 | 48 | 50 | 284 | - | ニュートラル | striker | cool | normal | - |
| 8 | 松岡綾乃 | matsuoka_a | 17 | 169 | 47 | 58 | 71 | 58 | 57 | 291 | - | ニュートラル | submission | cool | normal | 引き出し上手 |

### その他所属

| # | 名前 | portrait_key | 年齢 | 身長 | Pow | Spd | Tec | Sta | Men | 合計 | 影響力 | アライメント | スタイル | archetype | personality | 特性 |
|---|------|-------------|------|------|-----|-----|-----|-----|-----|------|--------|-------------|---------|-----------|------------|------|
| 9 | 結城玲奈 | yuuki_r | 17 | 158 | 56 | 67 | 58 | 62 | 56 | 299 | ■ | ニュートラル | allrounder | polite | normal | 努力家 |
| 10 | 戸塚ゆかり | totsuka_y | 17 | 160 | 66 | 55 | 53 | 68 | 62 | 304 | ■ | ベビーフェイス | aerial | default | easygoing | ムードメーカー |
| 11 | 若林美佐子 | wakabayashi_m | 26 | 166 | 64 | 57 | 63 | 68 | 52 | 304 | ■ | ニュートラル | allrounder | default | normal | 引き出し上手 |
| 12 | 相模あずみ | sagami_a | 19 | 164 | 62 | 66 | 58 | 64 | 67 | 317 | ■ | ニュートラル | grappler | default | normal | 負けず嫌い |
| 13 | 朝比奈ひかり | asahina_h | 18 | 162 | 52 | 56 | 48 | 63 | 59 | 278 | - | ベビーフェイス | aerial | default | normal | ファンサービス, 華 |
| 14 | 綿貫すず | watanuki_s | 19 | 159 | 51 | 61 | 53 | 52 | 54 | 271 | - | ニュートラル | striker | default | normal | ファンサービス, 華 |
| 15 | 木村レイカ | kimura_r | 24 | 164 | 58 | 64 | 62 | 63 | 69 | 316 | - | ニュートラル | grappler | default | bold | 負けず嫌い |
| 16 | 豊田いすず | toyota_i | 29 | 171 | 69 | 53 | 63 | 58 | 63 | 306 | - | ベビーフェイス | grappler | polite | earnest | 引き出し上手 |
| 17 | リナ・モーガン | morgan_r | 21 | 170 | 76 | 77 | 73 | 71 | 67 | 364 | ★★★ | ニュートラル | allrounder | default | easygoing | リーダー気質, 華 |
| 18 | クラッシャー毒島 | crusher_b | 25 | 184 | 88 | 67 | 58 | 66 | 55 | 334 | ■ | ヒール | brawler | delinquent | bold | ヒール適性, 威圧感 |
| 19 | 割田久美 | warida_k | 19 | 181 | 68 | 59 | 57 | 58 | 62 | 304 | ■ | ヒール | submission | delinquent | normal | ヒール適性 |
| 20 | 岩小路志摩子 | iwakoji_s | 17 | 166 | 54 | 73 | 68 | 59 | 72 | 326 | - | ベビーフェイス | striker | ojousama | normal | 努力家 |
| 21 | 蔵前静 | kuramae_s | 17 | 168 | 64 | 56 | 62 | 67 | 65 | 314 | ★★ | ベビーフェイス | submission | ojousama | easygoing | ムードメーカー |
| 22 | 山本理香 | yamamoto_r | 17 | 168 | 71 | 68 | 51 | 64 | 64 | 318 | ★★ | ニュートラル | striker | default | normal | 頑丈さ |
| 23 | 宮沢ひかる | miyazawa_h | 17 | 164 | 58 | 74 | 64 | 60 | 60 | 316 | ★★ | ニュートラル | striker | default | quiet | 負けず嫌い |

### 団地妻プロレス

| # | 名前 | portrait_key | 年齢 | 身長 | Pow | Spd | Tec | Sta | Men | 合計 | 影響力 | アライメント | スタイル | archetype | personality | 特性 |
|---|------|-------------|------|------|-----|-----|-----|-----|-----|------|--------|-------------|---------|-----------|------------|------|
| 24 | 柳沼英子 | yaginuma_e | 33 | 175 | 65 | 54 | 53 | 57 | 55 | 284 | - | ニュートラル | striker | default | normal | - |

---

## B. データ不完全キャラ（6名）— 実装前にフィールド確定が必要

以下のキャラクターはスタイル・アライメント・影響力・特性が未定義。

| # | 名前 | portrait_key | 年齢 | 身長 | Pow | Spd | Tec | Sta | Men | 合計 | 所属 | archetype | personality | 不足フィールド |
|---|------|-------------|------|------|-----|-----|-----|-----|-----|------|------|-----------|------------|------------|
| 25 | 清川 怜 | kiyokawa_r | 19 | 175 | 71 | 48 | 62 | 56 | 48 | 285 | - | polite | earnest | スタイル, アライメント, 影響力, 特性 |
| 26 | 藤代絵麻 | fujishiro_e | 19 | 171 | 72 | 51 | 46 | 74 | 58 | 301 | - | default | easygoing | スタイル, アライメント, 影響力, 特性 |
| 27 | 西園百合香 | nishizono_y | 19 | 165 | 58 | 61 | 69 | 59 | 51 | 298 | - | polite | quiet | スタイル, アライメント, 影響力, 特性 |
| 28 | 榊原菜摘 | sakakibara_n | 29 | 170 | 66 | 58 | 64 | 61 | 58 | 307 | - | polite | earnest | スタイル, アライメント, 影響力, 特性 |
| 29 | 巳沼紗霧 | minuma_s | 18 | 166 | 68 | 63 | 88 | 73 | 67 | 359 | 哲玖国際高校 | seductive | bold | スタイル, アライメント, 影響力, 特性 |

---

## C. 画像ファイル一覧

### 4種×29キャラ = 116ファイル（全プレースホルダー済み）

| portrait_key | face (png) | upper (webp) | stand (webp) | full (webp) |
|-------------|-----------|-------------|-------------|------------|
| tokiyama_n | OK | OK | OK | OK |
| sawanobori_a | OK | OK | OK | OK |
| oyama_t | OK | OK | OK | OK |
| zaitsu_k | OK | OK | OK | OK |
| yoshino_m | OK | OK | OK | OK |
| kuroiwa_c | OK | OK | OK | OK |
| akanuma_s | OK | OK | OK | OK |
| matsuoka_a | OK* | OK* | OK* | OK* |
| yuuki_r | OK | OK | OK | OK |
| totsuka_y | OK | OK | OK | OK |
| wakabayashi_m | OK | OK | OK | OK |
| sagami_a | OK | OK | OK | OK |
| asahina_h | OK | OK | OK | OK |
| watanuki_s | OK | OK | OK | OK |
| kimura_r | OK | OK | OK | OK |
| toyota_i | OK | OK | OK | OK |
| morgan_r | OK* | OK* | OK* | OK* |
| crusher_b | OK | OK | OK | OK |
| warida_k | OK | OK | OK | OK |
| iwakoji_s | OK | OK | OK | OK |
| kuramae_s | OK | OK | OK | OK |
| yamamoto_r | OK | OK | OK | OK |
| miyazawa_h | OK | OK | OK | OK |
| yaginuma_e | OK | OK | OK | OK |
| kiyokawa_r | OK* | OK* | OK* | OK* |
| fujishiro_e | OK* | OK* | OK* | OK* |
| nishizono_y | OK* | OK* | OK* | OK* |
| sakakibara_n | OK* | OK* | OK* | OK* |
| minuma_s | OK* | OK* | OK* | OK* |

`OK*` = 今回新規コピーしたプレースホルダー（akanuma_sテンプレート）

---

## D. 実装時の作業リスト

1. **data.js ALL_CHARS 配列にエントリ追加**（ID 100〜128予定）
2. **data.js PORTRAIT マップにキー追加**
3. **影響力の変換**: ■→初期非公開(popularity低め), ★→1, ★★→2, ... ★★★★★→5
4. **特性のコード変換**: 日本語特性名→TRAITS定数キーへのマッピング
5. **得意技**: CSV上は空欄が多い。別途決定が必要
6. **trainCap**: CSV「能力潜在値合計」列は空欄。別途設計が必要
7. **セクションBの6名**: 未定フィールドを確定してから実装
8. **VICTORY_LINES**: 新キャラ用の勝利台詞を追加
9. **CHAR_PROFILES**: 新キャラ用のプロフィールテキストを追加

---

## E. 影響力マッピングメモ

CSVの影響力表記とゲーム内の初期popularity/初登場条件の対応:

| CSV表記 | 意味 | 推定初期pop |
|---------|------|------------|
| (空欄) | 無名 | 0-5 |
| ■ | 初期非公開（ストーリー登場） | 5-10 |
| ★ | 低知名度 | 10-15 |
| ★★ | 中知名度 | 15-25 |
| ★★★ | 高知名度 | 25-35 |
| ★★★★ | 有名 | 35-45 |
| ★★★★★ | トップスター | 45-55 |

※ 既存キャラの実データから推定。実装時に要確認。
