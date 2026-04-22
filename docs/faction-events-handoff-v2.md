# 派閥イベント演出 引き継ぎ書 v2（2026-04-22 セッション途中）

前身: [docs/faction-events-handoff.md](faction-events-handoff.md) v1.1
ブランチ: `refactor/battle-engine-replay`（uncommitted）

---

## 1. ここまでで完了した作業

### 1-1 F02 セリフ実データ化（最優先タスク・完了）
- [src/data.js](../src/data.js) に `FACTION_F02_LINES` 追加（`FACTION_CONFIG` 直後、~L1420）
  - 構造: `{ personality: { attack: {archetype}, defend: {archetype} } }`
  - 性格6（bold/introverted/carefree/earnest/emotional/shy）× アーキタイプ7 × attack/defend = 84行
- [src/factions.js](../src/factions.js) §9.9 に `Engine.factions.getF02ClashLine(fighter, side)` 追加
  - `Engine.contract.getPersonalityType` でキャラ→性格マッピング
  - archetype フォールバック: `normal` → 該当なしは attack 側にフォールバック
- 全127キャラで空文字にならないことを確認済み

### 1-2 F03（解散）シネマティックオーバーレイ実装
- [src/ui-common.js](../src/ui-common.js) `showFactionF03Modal` 全面書き換え（~L6621）
- 5 reason 対応: `retirement / departure / poach / isolated / collapse / longInjury`
- ヘルパ新設: `_factionUpperUrl` / `_factionEnsureOverlayRoot` / `_factionCloseCinematicOverlay`
- DOM 検証: `active=true`, `display=flex`, `opacity=1`, title='解 　 散' 表示 OK

### 1-3 F05（活動休止）モーダル追加
- [src/ui-common.js](../src/ui-common.js) `showFactionHiatusModal` 新規追加（F03 CSS 再利用）
- `window.showFactionHiatusModal` として公開
- payload: `{ factionName, leaderName, leaderId, successorId, estimatedWeeks, survivorLine? }`
- DOM 検証 OK、title='活 動 休 止'
- **注意**: 既存 `showFactionF05Modal` は「派閥内亀裂」用で別物。**壊さず共存** させている

### 1-4 CSS トークンとシネマティック CSS のポート
- [src/index.html](../src/index.html) `:root` に追加:
  - `--stage-bg`, `--stage-bg-deep`, `--stage-panel`, `--stage-accent-gold`, `--stage-text-main/sub/dim`
  - `--office-bg`, `--office-panel-cream`, `--office-panel-cream-card`, `--office-panel-dark/dark-deep`, `--office-border-cream`, `--radius-lg`
- `.fevt-*` CSS をモックから移植（~L3585〜）:
  - Office系（F01/F04 カード）
  - Stage系 base + `.sepia` バリアント
  - F02 narration act（act1 ナレ）
  - F02 dual-stage（act2 対峙）
  - F03 崩壊系（`.fevt-faded-banner / -flag / -lost-leader / -lost-upper / -lost-name / -lost-reason / -survivor / -survivor-portrait / -survivor-line / -continue-btn`）

### 1-5 階層2ドキュメント追記
- [docs/ui/02-layouts.md](ui/02-layouts.md) §2-D に「グループ4：シネマティック・イベント」サブセクション追加

### 1-6 バグ修正
| 問題 | 原因 | 修正 |
|------|------|------|
| `.active` クラスが付与されない | rAF のタイミング不定 | 強制リフロー `void overlay.offsetWidth;` + `setTimeout(20ms)` |
| オーバーレイが title-screen の裏に隠れる | z-index 200 < 300 | `.fevt-overlay-*` を z-index **9000** に引き上げ |
| `escapeHtml` 未定義エラー | コードベースに存在しない関数を参照 | `String(...)` に置換（4箇所）|

---

## 2. uncommitted 変更ファイル

```
M  src/data.js                  FACTION_F02_LINES 追加
M  src/factions.js              getF02ClashLine 追加
M  src/ui-common.js             showFactionF03Modal 書換, showFactionHiatusModal 追加, ヘルパ新設
M  src/index.html               :root トークン + .fevt-* CSS
M  docs/ui/02-layouts.md        §2-D シネマティック・イベント追記
?? docs/faction-events-handoff-v2.md  ← この引き継ぎ書
```

コミット前にレビュー推奨。F02 seed 選手2名だけで動作確認済み（NEW GAME 前の title 画面状態でも `showFactionF03Modal` / `showFactionHiatusModal` を直接呼べば描画される）。

---

## 3. 未着手タスク（次セッションの作業順）

> **各タスク着手前の必読**（漏らすと前提が抜けます）:
> 1. [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md) — 階層3画面仕様 v0.2（**骨格ワイヤーフレーム／シーン進行／verdict コピー／発火条件／演出アセット**の一次ソース）
> 2. [docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html) — HTML 実装の真実（クラス名・セリフ・アニメタイミング）
> 3. [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) — エンジン契約（payload 構造・applyF0xChoice の分岐）
>
> v2 本文の各タスクは **概要＋差分** のみ。数値・コピー・条件は上記3ファイルを正とする。

### 3-1 最優先: F01（結成） Office 応接室型
- **仕様**: [03-screens/faction-events.md §1 F01/F04 応接室型](ui/03-screens/faction-events.md)（骨格・4幕進行・情報階層・特有ルール）
- **モック**: [mockups/faction-events.html `#overlayF01`](ui/mockups/faction-events.html) L1393 付近
- **spec**: `applyF01Choice`（factions.js §9.x）
- `.fevt-overlay-office` クラスベース、クリーム色応接室パネル
- 選択肢3つ（モック確定、v2 執筆時点で B/C 未確定だった分はモック準拠）:
  - A: 正式なチームとして認める
  - B: 今はそれどころじゃないと釘を刺す
  - C: 静観する
- 既存 `showFactionF01Modal` を cinematic 版に書き換え

### 3-2 F04（寝返り） Office 応接室型
- **仕様**: [03-screens/faction-events.md §1 F04 バリエーション](ui/03-screens/faction-events.md) + §6 テキスト改訂ログ F04
- **モック**: `#overlayF04` L1450 付近
- **spec**: `applyF04Choice`（ただし選択肢ゼロで通知のみ）
- Reporter: コーチのみ、移籍は既成事実として報告
- 報告文（03-screens §6 F04 基準）: 「近藤ゆりかは、三浦派と既に話をつけているようです。練習後の合流、食事、移動——動きはもう表に出始めています。報告として、お耳に入れておきます。」
- `.fevt-f04-arrow` pulse animation（すでに CSS ポート済み）

### 3-3 F02 対峙（act2）
- **仕様**: [03-screens/faction-events.md §2 F02 対峙型](ui/03-screens/faction-events.md)（骨格・6幕進行・特有ルール「同時表示」）+ §6 F02②
- **モック**: `#overlayF02A`（ナレ act1）+ `#overlayF02` / `#overlayF02Clash`（対峙 act2）
- **spec**: `applyF02Choice`（factions.js L903 付近、3択「煽る/仲裁/介入しない」の妥当性は 03-screens §未決事項 7 参照）
- `.fevt-dual-stage` + `.fevt-leader-col` 左右
- `getF02ClashLine(fighter, side)` を活用してセリフ差し込み
- ロッカールーム人間味センテンス（`.fevt-clash-atmosphere`）追加
- 既存 `showFactionF02Modal` を全面書き換え

### 3-4 F02 進展4種（ignite / resolution / peace / endless）
- **仕様**: [03-screens/faction-events.md](ui/03-screens/faction-events.md) の専用4セクション:
  - **F02① 発火** — §「F02 進展①」（発火条件・演出アセット・確認ポイント）
  - **F02② 沈静化** — §「F02 進展②」（対称トーン・BGM soft bed）
  - **F02③ 決着** — §「F02 進展③」（勝者ゴールド×敗者グレースケール・ledger）
  - **F02④ 無限抗争** — §「F02 進展④」（グレー乗算・カウンタ・4行侵食リスト）
- **モック**: L706-1314 付近、~600行（CSS 未ポート）
- `.fevt-overlay-stage.resolution / .ignite / .peace / .endless` の4 variant CSS
- verdict コピーは 03-screens §6 テキスト改訂ログの4文を使用
- 既存 `applyF02Choice` の結果分岐と揃える

### 3-5 F05 イベント生成ロジック追加
- **仕様**: [03-screens/faction-events.md §5 F05 活動休止](ui/03-screens/faction-events.md)（発火条件・spec 接続・F03 との視覚差別化）
- **spec**: `faction.status` を `active | hiatus | dissolved` の3値に拡張（factions.js §8 週次イベント抽選）
- [src/factions.js](../src/factions.js) §8 週次イベント抽選に F05（活動休止）検出を追加
  - 条件: リーダーが8週以上の長期離脱確定（怪我 `injuryWeeks >= 8` など）
- [src/app.js](../src/app.js) で `showFactionHiatusModal` にルーティング
- 既存 F05（派閥内亀裂）との識別方法を決める（別 eventId 推奨: `F05H` 等）

### 3-6 Audio hooks
- [src/app.js](../src/app.js) に `stopAllAudio()` / `setBed()` パターン導入
- 同一ベッド連続再生の頭出しノイズ回避
- 登録マップ:
  - F01/F04/F05/F02② 沈静化: `Soft Bids, Sharp Minds.mp3`
  - F02②対峙/F02③決着/F02④無限: `bgm_tension_v1.mp3`（F03-D は × 0.85）
  - F03 / F05 / F02② 沈静化: + `f06_fin_chime_v1.mp3` stinger

### 3-7 完了時タスク
- [docs/game-system-roadmap.md](game-system-roadmap.md) 更新
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) §9.2 `applyF02Choice` 整合確認
- [docs/faction-events-handoff.md](faction-events-handoff.md) をアーカイブへ移動
- ローカルコミット（push しない）

---

## 4. 引き継ぎメモ・落とし穴

### 4-1 screenshot ツールが使えない
- 今セッション中、`preview_screenshot` が連続タイムアウト
- `preview_eval` は正常動作 → DOM 検証で代替した
- 次セッション開始時に preview 再起動 or 手動確認推奨

### 4-2 dev server
- `http://localhost:3000/` がルート。`/src` 付けるとスクリプトパスが壊れる
- port 3002 の root server も存在するが 3000 推奨

### 4-3 F03 タイトルは NEW GAME 前でも呼べる
- `G.roster` は title 画面状態で2名しか居ないが、シード用意済み
- 即テスト呼び出し例:
  ```js
  showFactionF03Modal({
    factionName: '宇田川派',
    oldLeaderName: '湯本ほたる',
    oldLeaderId: G.roster[0].id,
    successorId: G.roster[1].id,
    reason: 'retirement',
  }, G, () => {});
  ```

### 4-4 F05 ネーミング衝突
- 既存 F05 = 派閥内亀裂（`showFactionF05Modal` / `applyF05Choice`）
- 新 F05 = 活動休止（`showFactionHiatusModal`）
- factions.js 側で eventId をどう分けるか未決定。Keisuke に確認すること

### 4-5 z-index の設計
- `.fevt-overlay-*` = 9000（title-screen 300 より上、battleOverlay 9999 より下）
- 既存 `.rm-popup-overlay` = 500、`_isPopupActive()` と競合しないか確認済み
- 同時に複数 cinematic オーバーレイは想定外（`_popupQueue` で直列化される）

### 4-6 要ポートの残 CSS
- モック L706-1314 付近、約600行
- F02 進展4種の variant CSS が主
- `.fevt-res-stage`, `.fevt-res-winner/loser`, `.fevt-res-verdict` など
- 一括コピーでも OK（`.fevt-` prefix なので他と衝突しない）

---

## 5. 参照ドキュメント

- [docs/faction-events-handoff.md](faction-events-handoff.md) — 前身 v1.1（決定事項全文）
- [docs/ui/03-screens/faction-events.md](ui/03-screens/faction-events.md) — 階層3画面仕様 v0.2
- [docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html) — モック13シーン
- [specs/faction-system-spec-v0.1.md](../specs/faction-system-spec-v0.1.md) — エンジン契約
- [specs/character-data-spec-v1.7.md](../specs/character-data-spec-v1.7.md) — personality / archetype 値域
- [specs/oyou-style-guide.md](../specs/oyou-style-guide.md) — 鷹揚（composed）口調

---

## 6. 次セッション初手コマンド（推奨）

```bash
# ブランチ確認
git status
git log --oneline -5

# dev server 起動（preview_start で port 3000）
# title 画面で eval してモーダル動作確認してから F01 着手
```

最初の1ステップ: **[docs/ui/mockups/faction-events.html](ui/mockups/faction-events.html) の `#overlayF01` を読み、`showFactionF01Modal` を `.fevt-overlay-office` ベースに書き換える**。

---

*引き継ぎ書 v2 / 2026-04-22 / F03・F05 実装完了時点*
