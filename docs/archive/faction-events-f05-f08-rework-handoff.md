# 派閥イベント F05〜F08 モーダル リワーク 実装指示書

**作成**: 2026-04-23 / **想定セッション**: 次回（別セッション）
**前提モック**: [docs/ui/mockups/faction-events-f05-f08-rework.html](ui/mockups/faction-events-f05-f08-rework.html) （v2.1）

---

## 1. 背景と目的

現状の F05〜F08 派閥イベントモーダル（src/ui-common.js:7021-7335）は、F01/F02/F03/F04 のシネマティック型と比べて見栄えが極端に簡素。具体的には共通の `_factionModalBox`（中央のクリームカード1枚）を使い回しており、scene1 は文字だけのナレ、scene2 でようやく丸ポートレ＋吹き出し、scene3 で選択肢——という3シーン順送り構造。同じ「派閥イベント」なのに体験の格差が大きく、最も発生頻度が高い帯のはずが最も貧弱に見える。

これを **F01 と同等の office 型クリームカード基盤**（`fevt-overlay-office` / `fevt-report-card` 系）にリワークし、1モーダル完結に統合する。

加えて Keisuke レビューを経て、**仕様自体も以下の通り改訂**する:

| ID | v0.1 旧仕様 | v0.2 新仕様 | 理由 |
|----|-----------|-----------|------|
| F05 | 3択（本人と話す/リーダーと話す/静観） | **選択肢全廃、報告のみ「見守る」1ボタン** | 社長は派閥の内紛に介入する立場ではない（特定派閥の肩を持つと他派閥の信頼を損なう） |
| F06 | 3択（和解興行/そっと押す/何もしない） | **2択（後押し/何もしない）** | 熱が抜けたものをわざわざ興行化する必要はない |
| F07 | 3択（権威認める/釘刺す/別幹部立てる） | **3択維持（spec §9.7 通り）** | 効果は内政メーター変動のみ。カード編成への直接縛りは別セッションで拡張案検証（後述§7） |
| F08 | 3択（直接対決/別興行/警告） | **3択維持＋ UI を吹き出し配置に強化** | セリフがどちらの発話かが従来モーダルでは分かりにくい |

---

## 2. デザイン基盤（共通）

すべて F01 の `fevt-overlay-office` / `fevt-report-card` 構造に揃える。
- 全画面オーバーレイ（背景は radial-gradient で暗転）
- 760px 幅のクリームカード
- ヘッダーはイベント別テーマカラー
  - F05: 朱（rgba(196,98,58,*)）
  - F06: 緑（rgba(90,138,106,*)）
  - F07: 金（rgba(162,106,44,*)）— F01 と同系統
  - F08: 深紅（rgba(180,42,42,*)）
- レポーター帯（コーチが状況を予告）
- subject-stage（肖像＋名前＋OVR/AGE/style/所属派閥）
- 観察ノート（文脈描写）
- quote ブロック（本人セリフ）
- 選択肢トレイ（A/B/C カード）

**新規 CSS（モックから index.html へ移植）:**
- `.fevt-decision-tray.two` — F06 用 2列中央寄せ（240px × 2、justify-content: center）
- `.fevt-subject-pair` / `.fevt-pair-portrait` / `.fevt-pair-bridge` — F06 用 2派閥肖像並び＋↔ ブリッジ
- `.fevt-subject-duel` / `.fevt-duel-portrait` / `.fevt-duel-vs` / `.fevt-duel-faction` / `.fevt-duel-name` / `.fevt-duel-org` — F08 用 VS 構図
- `.fevt-bubble.left` / `.fevt-bubble.right` — F08 用吹き出し（肖像直下、上向き三角の尻尾付き）
- `.fevt-quote.hostile` / `.fevt-quote.peace` / `.fevt-quote.leader` — テーマカラー別 quote ブロック
- `.fevt-observation-note .marker.hostile` / `.marker.peace` — マーカー色のバリエーション

---

## 3. F05 派閥内に火種（v0.2: 報告のみ）

### 仕様変更
- **選択肢全廃**。`applyF05Choice` は廃止または no-op 化（裏での bond/rivalry 進行は維持、F03 への自然遷移はそのまま）
- モーダル UI は「見守る ✓」ボタン1つだけのレポート型
- `pickWeeklyEvent` の F05 候補登録は維持。発火確率・CD はそのまま（spec §2.5 表通り 40%/週・CD12週）

### モーダル構造（モック §F05 セクション準拠）
- ヘッダー: 「⚙ 派閥内に火種」朱テーマ
- レポーター帯: コーチが「軋みが出てるみたいです」と前置き
- subject-stage: 不満を抱えるメンバー1名の肖像＋メタ
- 観察ノート: 不満の出元（リーダー方針）を marker で示す
- quote: 本人の不満セリフ（hostile テーマ）
- フッター: 「見守る ✓」1ボタンのみ（中央配置）

### specs/ 改訂対象
- **specs/faction-system-spec-v0.1.md §9.5** — 選択肢テーブルを削除し「**社長介入なし、報告のみ**」「効果: なし（裏で bond/hostility は進行）」へ書き換え

---

## 4. F06 和解の兆し（v0.2: 2択化）

### 仕様変更
- 旧 A「和解を後押しする（合同練習・飲み会企画、コスト100万）」を**削除**
- 新 A は旧 B「自然に任せる」相当の弱い後押し（コストなし、対立度両方向 -15〜-25）に格上げ
- 新 B は旧 C「対立を煽る」を削除し、何もしない（自然減衰のみ）
- → **2択化**

### モーダル構造（モック §F06 セクション準拠）
- ヘッダー: 「🌱 和解の兆し」緑テーマ
- レポーター帯: コーチが「もう揉めてませんよ」と前置き
- subject-stage: `subject-pair`（2派閥リーダー肖像＋↔ ブリッジ）＋両派閥名連結
- 観察ノート: 棘が和らいでいる描写、メンバー間の私的交流復活
- quote: 片方リーダーの諦観セリフ（peace テーマ）
- 選択肢: `.fevt-decision-tray.two`（240px × 2 中央寄せ）
  - A: そっと結束を後押しする
  - B: 何もしない

### specs/ 改訂対象
- **specs/faction-system-spec-v0.1.md §9.6** — 選択肢を3行→2行へ。旧A「和解を後押し（コスト100万）」削除、旧B「自然に任せる」を新Aに格上げし数値拡張、旧C「煽る」削除

### factions.js 改修
- `applyF06Choice` の choice 'C' 分岐削除、'A'/'B' を新仕様の数値に揃える

---

## 5. F07 リーダーの要求（v0.2: spec §9.7 厳密準拠）

### 仕様変更
- **なし**（spec §9.7 通り、効果は trust/士気/dictatorTag/authoritativeTag の内政メーター変動のみ）
- ただしモーダルのラベル・ヒント文を spec 通り「権威を認める／釘を刺す／別の幹部を立てる」へ確定。dictatorTag は **「独裁化」と日本語表記**

### モーダル構造（モック §F07 セクション準拠）
- ヘッダー: 「👑 リーダーの要求」金テーマ
- レポーター帯: コーチが「後ろに2人ついてます。多分、いつもの話です」と前置き
- subject-stage: trio（取り巻き2人＋リーダー本体）— F01 と同パターン
- 観察ノート: 要求は「抽象的な圧」と曖昧化（具体的なカード編成や金銭要求は現時点では実装しない方針 → §7 拡張案）
- quote: リーダー本人の威圧セリフ（leader テーマ）
- 選択肢: 3択
  - A: 権威を認める（独裁化付与）
  - B: 釘を刺す（4回累積で「権威型」資格剥奪）
  - C: 別の幹部を立てる（権威型剥奪＋ tensionTag）

### specs/ 改訂対象
- **specs/faction-system-spec-v0.1.md §9.7** — 改訂不要。ただし「dictatorTag」の player-facing 表記が「独裁化」であることを補足追記

### factions.js 改修
- `applyF07Choice` 改修不要

---

## 6. F08 対立ヒートアップ（v0.2: 吹き出し UI 強化）

### 仕様変更
- 効果は spec §9.8 通り（直接対決 directive・別興行・警告）変更なし
- UI のみ：旧 quote 2連発を廃止し、**各リーダー肖像の直下に吹き出しを配置**。左キャラの吹き出しは肖像から下向きに尻尾、右キャラも同様

### モーダル構造（モック §F08 セクション準拠）
- ヘッダー: 「🔥 対立ヒートアップ」深紅テーマ＋hostility 値表示
- レポーター帯: コーチが「もう止めても無駄だと思います」と諦観前置き
- subject-stage: `subject-duel`（2リーダー肖像＋VS）
  - 各カラム下に `.fevt-bubble.left` / `.fevt-bubble.right`（上向き三角の尻尾付き、深紅枠）
- 観察ノート: 敵対度の数値を marker で示す
- 選択肢: 3択（spec 通り。B「別興行」はコスト200万付き、§9.8 ヒート 80超では仲裁系不可）

### specs/ 改訂対象
- **specs/faction-system-spec-v0.1.md §9.8** — 改訂不要。UI 構成のメモのみ追記可

### factions.js 改修
- `applyF08Choice` 改修不要

---

## 7. F07 拡張案（別途検証）

本実装では F07 は spec §9.7 通り内政メーターのみ。別途 **F07 拡張案検証** を memory に登録済み:
- `~/.claude/projects/.../memory/project_faction_f07_extension.md`
- 検討項目: メイン強制起用 directive（F08 の `_pendingF08Directive` パターン流用）／プロモ枠新設／金銭要求案
- **次セッション項目に登録済み**（MEMORY.md「次セッション予定」）

本実装では拡張は **入れない**。F07 拡張は別ブランチ・別セッション・auto-sim 検証付きで進める。

---

## 8. 影響ファイル一覧と作業順序

| 順 | ファイル | 内容 |
|----|---------|------|
| 1 | `specs/faction-system-spec-v0.1.md` | §9.5 選択肢全廃、§9.6 2択化。先にレビュー受ける |
| 2 | `src/index.html` | CSS 追加（`.fevt-decision-tray.two`、`.fevt-subject-pair/duel`、`.fevt-bubble.left/right`、`.fevt-quote.hostile/peace/leader`、`.marker.hostile/peace`） |
| 3 | `src/ui-common.js` | `showFactionF05Modal` / `showFactionF06Modal` / `showFactionF07Modal` / `showFactionF08Modal` を全面書換。旧 `_factionModalBox` 系の3シーン render は廃止 |
| 4 | `src/factions.js` | `applyF05Choice` 廃止 or no-op 化、`applyF06Choice` の 'C' 分岐削除＋'A'/'B' 数値再調整 |
| 5 | `src/app.js` | F05 のディスパッチを「choice 不要、見守るだけ」に修正（必要なら） |
| 6 | モック annotation 同期 | 実装と齟齬が出た箇所をモック側に反映 |

**auto-sim 不要**: 試合数値・判定に影響しない UI/モーダル変更のみ（§F07 拡張は別セッション）。F06 の効果数値が変わるが、派閥状態遷移のみで試合エンジンには未介入。

---

## 9. 完了時チェックリスト

- [ ] 4イベントすべてが `fevt-overlay-office` 系で表示される（旧 `_factionModalBox` 経路を踏まない）
- [ ] F05 は「見守る ✓」1ボタンのみ、選択肢が出ない
- [ ] F06 の選択肢が中央寄せ2択（240px × 2、左右マージン対称）
- [ ] F07 のモーダルに「dictator」「authoritative」等の英字内部用語が出ていない（player-facing は「独裁化」「権威型」）
- [ ] F08 の各リーダー肖像直下に吹き出しが正しく出て、尻尾が肖像方向（上）を指す
- [ ] specs §9.5 / §9.6 改訂 diff を Keisuke レビューに通す
- [ ] 本指示書を `docs/_archive/` に移動
- [ ] `docs/game-system-roadmap.md` 更新

---

## 参照

- 元スクリーンショット: 2026-04-23 セッション冒頭、13年目10月第1週「リーダーの要求」
- モック: [docs/ui/mockups/faction-events-f05-f08-rework.html](ui/mockups/faction-events-f05-f08-rework.html)
- 拡張案メモ: `memory/project_faction_f07_extension.md`
- 既存実装: src/ui-common.js:7021-7335（旧 F05/F06/F07/F08）、src/factions.js:2058-2169（applyF07/F08Choice）
- 既存 F01/F02/F03/F04 モーダル: src/ui-common.js:6491-7018（参考実装）
