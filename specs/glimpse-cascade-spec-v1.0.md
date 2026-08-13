# 👁️ Glimpse Cascade 仕様 v2.0 — **廃止**

> **ステータス**: 🔴 廃止 (2026-08-13 Keisuke裁定)。v1.x は 2026-05-02〜2026-08-13 の記録
> **作成日**: 2026-05-02
> **依存**: snapshot-notification-spec-v1.0.md / relationship-system-spec-v2.0.md
> **実装箇所**: ui-common.js (`_isGlimpseTier1` が常に false を返し、表示経路は発火しない)

---

## 0. 廃止 (v2.0: 2026-08-13)

**興行後の関係性通知(カスケード・単発モーダルとも)は全廃。**

理由(Keisuke裁定): 関係性の変化は「さりげなく人のふとしたセリフから垣間見える」のが
当初設計。試合後に羅列・通知すること自体が設計思想からのずれであり、
カードの縮小(v1.1)では応えたことにならない。

### 置き換え先(すべて既存の「世界の側」チャンネル)

| 出来事 | 受け皿 |
|---|---|
| 関係の節目全般 | 道場バナー「休憩中の選手」のつぶやき。**gold(宿命のライバル/深い絆)・danger(退団の噂)級はその週の確定枠**(通常は18%抽選)。見に来なければ流れる |
| 宿命のライバル級ペア | 新聞3面・因縁列伝(既存の featured 選定が rivalry×0.4 + ドラマタグで高rivalryペアを自然に上位へ。追加ボーナス不要と判断) |
| 関係の小さな揺れ | 週次ティッカー(trustWarning 等・既存のまま) |
| 退団を考えているという噂(danger) | **週次レポートに1行**「💬 {name}が退団を考えているという噂がある」(tickWeek、社長の実務情報として) |
| いつでも確認 | データベースの相関図(既存のまま) |

実装: `_isGlimpseTier1` が常に false → 全 Glimpse が Tier2 として weekLogFeed へ。
確定枠は `_renderRosterDojoHeader` の rest picker。レポート行は tickWeek の A層生成直後。
旧表示経路(showGlimpseCascade / showGlimpseAModal / .gc-* CSS / #glimpseCascadeOverlay)は
呼ばれないまま残置 — 撤去は別途クリーンアップタスクで行う(安全網テストの追随が要るため)。

---

以下は廃止までの記録(v1.x)。

## 1. 目的 (廃止済み)

興行後に複数の Tier1 Relationship Glimpse が連発するとき、ポップアップを1件ずつ
「見届ける」連打させるのは煩わしい。1枚のオーバーレイに集約し、上から順に
**「ポンポンポン」と気持ちよく降ってくる演出**にまとめる。

## 2. 発動条件 (廃止済み)

- 1興行で発火した Tier1 Glimpse の件数 N について:
  - **N == 1** → 既存の単発 `showGlimpseAModal` にフォールバック(連打感がないと演出オーバーヘッドが大袈裟)
  - **N >= 2** → カスケードオーバーレイを表示

定数: `GLIMPSE_CASCADE_MIN = 2` (ui-common.js)

### 2.1 Tier1 の範囲 (v1.1: 2026-08-13 → 同日 v2.0 で全廃)

v1.1 では gold/danger 級のみTier1としたが、同日の裁定で全廃(§0)。

## 3. レイアウト (Variant A: 縦リスト・順次降臨)

v1.1 (2026-08-13 Keisuke裁定「キャラが大きすぎて大げさ。簡略に小さく」):
アバターは梯子の chip(46×66, 2:3) を使う簡略カードにする(旧: S 108×162 / 初版: 丸96px)。
モーダル幅も 680px → 480px へ縮小。

各カードの構造(上→下):
1. **吹き出し** (クリーム背景 / 黒文字。`.u3b-bubble`、chipスロット 11px文字)
   - tail は発言者画像の水平中心の真上
2. **アバター対** (横並び, chip 46×66。`.gc-card .u3b-upper.is-chip` で 2:3 に上書き)
   - 左: from(発言者) — 中央に矢印 ➜ (画像行の縦中央)
   - 右: to(対象) — 右下に感情アイコンバッジ(⚡♥★💔、16px)
3. **関係ラベル** (中央)
   - `from → to | label`

target が無い単独 Glimpse はアバター1枚を中央に配置。

## 4. アニメーション

- カード出現: 上から順、間隔 `GLIMPSE_CASCADE_DELAY_MS = 260ms`
- 1枚あたり: 0.42s の `gcPop` (transform: translateY + scale バウンス)
- 「見届ける」ボタンは全カード出現後 +300ms でフェードイン

## 5. SE

Web Audio API で合成(MP3 アセット未追加のため軽量実装):
- **カード出現音**: ベル系(主音 sine 740Hz + 5度 triangle)。1枚ごとに **+2 半音** ピッチ上昇
- **フィニッシュ音は無し** — 連打の余韻だけで自然に締める
- AudioContext は初回呼び出しで lazy init、suspended なら resume

## 6. tone マッピング

| glimpse の属性 | tone-class | アイコン |
|---------------|-----------|--------|
| tone === 'gold' | tone-good | ★ |
| axis === 'rivalry' / tone === 'danger'/'warning' | tone-rival | ⚡ |
| tone === 'negative' (bond軸) | tone-broken | 💔 |
| その他(bond positive) | tone-bond | ♥ |

## 7. 呼び出し箇所

旧: `tier1.forEach(g => showGlimpseAModal(g))` → 新: `showGlimpseCascade(tier1, opts)`

| ファイル:行 | コンテキスト |
|------------|------------|
| app.js:7012 (prepareShowResultInlinePopups) | 興行結果プレビューのインライン表示 |
| app.js:7476 (closeShowResult) | 興行結果クローズ後 |
| app.js:8048 (advanceWeek) | 通常週次処理後 |
| app.js:10834 (PPV後) | PPV興行クローズ後 |
| app.js:10900 (PPV TV後) | PPV TV観戦後 |

## 8. ポップアップキュー統合

- `glimpseCascadeOverlay` を `_POPUP_OVERLAY_IDS` に登録
- `showGlimpseCascade` は `_enqueuePopup` 経由で他のオーバーレイと競合しない
- `closeGlimpseCascade` で `_drainPopupQueue` を呼び、待機中のポップアップを再開

## 9. 1件のみフォールバックの根拠

カスケード演出の魅力は「ポンポン連打の連打感」と「複数件を見渡す俯瞰感」。
1件だと暗幕→1枚→ボタンというフローが情報量に対して大袈裟になり、
逆に既存の単発ポップアップの方が「その1件に集中できる」ためフォールバック。
