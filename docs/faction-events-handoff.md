# 派閥イベント演出（F01〜F05）引き継ぎ書

**作成日**：2026-04-22
**最終更新**：2026-04-22（同日内・モックアップ全イベント完了まで到達）
**状態**：モックアップ完成／次セッションで実装前の最終整備（F02 リーダーセリフ実データ化）
**次セッション優先度**：高

---

## 0. ゴール

派閥システムの週次イベント F01〜F05 を、現状の **CSS未定義のプレーンなモーダル** から、因縁決着ポップアップ（`.rivalry-popup`）と同水準の **小サイズ cinematic イベント** に格上げする。

**イベント一覧（2026-04-22 時点）**:

| ID | 名称 | フォーマット | 選択肢 |
|---|---|---|---|
| F01 | 忠誠型派閥結成 | **Office応接室型**（社長室背景 + コーチ観察報告） | 3択（立てる/釘を刺す/静観） |
| F02 | 派閥抗争勃発 | **Stage対峙型**（全画面暗転、2段構成: 前段ナレ → 対峙見せ場） | 3択（煽る/仲裁/介入しない） |
| F02 進展① | 開戦（煽るの後続） | **Stage公式戦化型**（VS + メインカード公示） | なし（通知のみ） |
| F02 進展② | 対峙（②の本体） | **Stage対峙型** | 3択（再掲） |
| F02 進展② 沈静化 | 仲裁成功後 | **Stage対称和解型**（象牙×若草） | なし（通知のみ） |
| F02 進展③ | 決着 | **Stage非対称型**（勝者ゴールド × 敗者グレースケール） | なし（通知のみ） |
| F02 進展④ | 無限抗争 | **Stageグレー停滞型**（両派閥沈む） | なし（通知のみ） |
| F03 | 派閥解散 | **Stage追悼型**（セピア、旗降下）／4バリエーション | なし（通知のみ） |
| F04 | 寝返り | **Office応接室型**（派閥旗移動アニメ付き） | なし（通知のみ） |
| F05 | 派閥活動休止 | **Stage追悼型セピア軽め**（旗は畳まれ、主の帰りを待つ） | なし（通知のみ） |

### F03（派閥解散）の4バリエーション（2026-04-22 追加）

| サブID | 名称 | 主体 | reason バッジ | 生存者セリフ |
|---|---|---|---|---|
| F03-A | 引退 | リーダー（去る） | RETIREMENT | 「もう、あの旗の下には戻れない」 |
| F03-B | 引き抜き | リーダー（他団体へ） | DEPARTURE | 「あの人と同じ旗は、もう掲げられない」 |
| F03-C | 離散 | リーダー（残留、周りが去った） | ISOLATED | 「一人では、派閥とは呼べない」（リーダー独白） |
| F03-D | 瓦解 | 敗者リーダー（F02③ 敗北連鎖） | COLLAPSE | 「負けた旗の下には、もう立てない」 |

### F05（派閥活動休止）の発動条件（2026-04-22 追加）

- リーダーが **8週以上の長期離脱** 確定時（怪我・私事休養等）
- F03 と別カテゴリ — 「戻る余地がある中断」として扱う
- BGM は Soft Bids ベッド（F01/F04 と同系の穏やかなトーン）
- reason バッジ「ABSENCE ・ 長期離脱（推定 8週+）」

---

## 1. 成果物

### 1-1 仕様書
- [docs/ui/03-screens/faction-events.md](docs/ui/03-screens/faction-events.md) — 階層3画面仕様書 v0.2（F05 追加・F03 変種反映）

### 1-2 モックアップ
- [docs/ui/mockups/faction-events.html](docs/ui/mockups/faction-events.html) — 自己完結 HTML（13シーン切替可）
- dev 切替ボタン: F01 結成 / F04 寝返り / F02① 前段ナレ / F02② 対峙 / F03-A〜D 解散4種 / F05 活動休止 / F02③ 決着 / F02④ 無限抗争 / F02② 沈静化 / F02① 開戦
- 実肖像（`image/upper/*.webp`）と社長室背景（`image/shachoshitsu/*`）を使用

---

## 2. Keisuke レビューで決定済み事項（累積）

### 2-1 F01（結成）
- ✅ 背景は **社長室**、発話者は **コーチ観察報告に統一**、フォロワー肖像は主役の両脇
- ✅ 社長は派閥に対して特段関心を示す必要はないという哲学を反映
- ✅ 選択肢A ラベル：「正式なチームとして認める」／ヒント：「求心力と引き換えに、ロッカールーム全体の空気が悪化する」（2026-04-22 改訂）
- ✅ 観察メモ：「細かい兆候はいくつもあります」「派閥のようなものが形成された」

### 2-2 F02 全体
- ✅ 前段ナレ → 対峙の **2段構成**
- ✅ 進展系4種（開戦/沈静化/決着/無限抗争）すべて別シーンとしてモック化
- ✅ 前段ナレーションは **1文ずつ入れ替え** 表示（前の文がフェードアウト → 500ms後に次の文がフェードイン）
- ✅ F02② 対峙に「ロッカールームには、冷たい対立の空気が満ちているようです」の人間味センテンスを追加（2026-04-22 改訂）

### 2-3 F02 進展系 verdict コピー（2026-04-22 改訂）
- ✅ **開戦**：「水面下でくすぶっていた火種は、リング上での戦いにまで燃え広がった。来週の興行、メインは——この一戦。観客も、この対決に期待を膨らませている。」
- ✅ **沈静化**：「決着はつかなかった。ただ、それぞれの派閥は、抗争が続くことの無益を知り、矛を収めることを選んだ。」
- ✅ **決着**：「ロッカールームに満ちていた争いの空気は、勝者と敗者という、はっきりとした形に決着した。」
- ✅ **無限抗争**：「どちらも屈しない。どちらも勝てない。抗争は決着がつかないまま、団体と所属選手の時間を食いつぶし続けている。」
- ✅ タイトル：「終わらない」→「終わらない抗争」

### 2-4 F04（寝返り）
- ✅ **選択肢ゼロ**（通知のみ）、Reporter は **コーチのみ**、移籍は**既成事実**として報告
- ✅ 報告文：「〇〇は派閥を移り、三浦派に加入するようです。練習後の合流、食事、移動など——その立場の変化は表に出始めています。」（2026-04-22 改訂）
- ✅ 報告タイトル：「ロッカールーム報告（揺らぎ）」→「ロッカールーム報告（移籍）」
- ✅ 寝返り選手は 近藤ゆりか（以前は三浦早紀 ＝ 三浦派リーダーと名字衝突だったため差替え）

### 2-5 派閥名称（2026-04-22 改訂）
- ✅ **累空 → 宇田川派**、**烈火 → 三浦派** にリネーム（「カッコいい固有名詞はダサい、リーダー苗字＋派でよい」）
- ✅ 旗色の紐付けは維持：`.a` = 紫系（宇田川派）、`.b` = 琥珀系（三浦派）
- ✅ フラッグボックスは **画像下部にネームプレート風にオーバーレイ**（幅260px固定、画像の両脇にはみ出さない）

### 2-6 F03（解散）
- ✅ 4バリエーション（引退／引き抜き／離散／瓦解）を別シーンとして用意、共通CSS
- ✅ F03-C（離散）のみ主体はリーダー自身（残る側の独白）
- ✅ F03-D（瓦解）は三浦派を主体にして F02③ 決着と連動する文脈
- ✅ F03-D の Audio ベッドは他より重め（TENSION_BED × 0.85）

### 2-7 F05（活動休止）
- ✅ F03 から分離された新カテゴリ（「休閥」は造語のため却下、正式に「活動休止」）
- ✅ Audio は Soft Bids ベッドで穏やかなトーン
- ✅ reason バッジに「推定 8週+」併記

### 2-8 音響設計
- ✅ 未登録シーンは自動で `stopAllAudio()`（将来の無音シーン追加に備えた安全網）
- ✅ setBed パターンで同一ベッド連続シーンの頭出しノイズを回避

---

## 3. 次セッション冒頭の作業（最優先）

### 参照ドキュメント（着手前に必ず開くこと）

- [docs/faction-events-handoff.md](docs/faction-events-handoff.md) — 本引き継ぎ書 v1.1（決定事項・作業順）
- [docs/ui/03-screens/faction-events.md](docs/ui/03-screens/faction-events.md) — 階層3画面仕様 v0.2（F01〜F05 演出仕様）
- [docs/ui/mockups/faction-events.html](docs/ui/mockups/faction-events.html) — モックアップ HTML（F02② 内に性格×アーキタイプのマトリクスをコメントで保持）
- [specs/faction-system-spec-v0.1.md](specs/faction-system-spec-v0.1.md) — 派閥システム仕様（エンジン側契約）
- [specs/character-data-spec-v1.7.md](specs/character-data-spec-v1.7.md) — personality / archetype の値域
- [specs/oyou-style-guide.md](specs/oyou-style-guide.md) — composed（鷹揚）口調の基準

### 【最優先】F02② 対峙 リーダーセリフの実データ化

現状モックアップ [mockups/faction-events.html:1517-1540](docs/ui/mockups/faction-events.html) に **HTMLコメント**として残してある性格×属性セリフ表を、`src/data.js` のデータオブジェクトとして書き出す。

**コメントで残してあるマトリクス**（6 personality × attack/defend 各1 = 12 行の雛形）:

| personality | attack | defend |
|---|---|---|
| bold | もう、同じ場所には立てない | 上等だ。受けて立つ |
| introverted | ……もう、戻れません | そちらが望むなら |
| carefree | 仲良しごっこは終わり、かな | ま、仕方ないよね |
| earnest | けじめを、つけさせてください | 逃げるつもりはありません |
| emotional | 許せない、あの子のやり方 | こっちだって、引けないの |
| composed | 線は、もう引かれてしまった | ならば、応じるまで |

**タスク内容**:
1. `src/data.js` に `FACTION_F02_LINES` オブジェクトを新設（personality × {attack, defend} の2段マップ）
2. archetype（ojousama/delinquent/cool/seductive/normal）別の一人称・語尾バリエーションを重ねる（× personality で 6×5 = 30 パターン）
3. `src/factions.js` に `getF02ClashLine(fighter, side)` ヘルパーを追加
4. テストとして、全98キャラに対して getF02ClashLine がフォールバック無しで引けることを確認

---

## 4. その後の作業順序

### 【中】引き継ぎ書・spec の最終確認
- [docs/ui/03-screens/faction-events.md](docs/ui/03-screens/faction-events.md) を F05 分離後の最新状態で一度 Keisuke にレビュー依頼

### 【大】実装フェーズ着手

モックアップが全イベント揃ったので、以下の順で本実装に入る:

1. 階層2 §2-D に「シネマティック・イベント」サブグループ追記（5行程度）
2. 階層1 に `--stage-bg` トークン追加
3. `src/index.html` に新オーバーレイ要素 + CSS `.fevt-*` 一式
4. **F03 から実装**（A→B→C→D の順、選択肢なしで最小）
5. **F05 実装**（F03 の派生）
6. **F01 → F04** の順で Office 型を実装
7. **F02② 対峙 → F02 進展①〜④** の順で Stage 型を実装
8. 音響フック追加
9. 手動UI確認を Keisuke に依頼

spec 側は [factions.js](src/factions.js) §9.2 `applyF02Choice` と進展4種 / F05 トリガーの整合を要確認。

---

## 5. 既存の問題（実装時に修復される）

### 5-1 現状の派閥モーダルの問題
- [ui-common.js:6369-](src/ui-common.js:6369) で `.faction-event-*` クラスを使ってHTMLを組んでいるが、**対応するCSSが index.html に1行も存在しない**
- care-box の汎用スタイルを継承するだけの素朴な黒枠モーダルになっている
- → 本作業で完全に書き換えられる

### 5-2 現在のコンソール警告（無関係だが関連）
- `Draft: no elite candidate in FA pool` ([data.js:457](src/data.js:457))
- `[WM Faction] dedupe: fighter#X was in factionA and factionB` ([factions.js:667](src/factions.js:667))

後者は派閥重複所属の自己修復ロジックが発火している証拠。**根本原因の調査は別タスク**。

---

## 6. 参照すべきファイル

### 仕様・ドキュメント
- [docs/ui/03-screens/faction-events.md](docs/ui/03-screens/faction-events.md) — 本作業の仕様書（F01〜F05）
- [docs/ui/mockups/faction-events.html](docs/ui/mockups/faction-events.html) — モックアップ（13シーン）
- [docs/ui/01-foundations.md](docs/ui/01-foundations.md) — カテゴリ・トークン体系
- [docs/ui/02-layouts.md](docs/ui/02-layouts.md) — P7 Theatrical、2-D Events
- [docs/ui/shachoshitsu.md](docs/ui/shachoshitsu.md) — 社長室背景の既存仕様
- [specs/faction-system-spec-v0.1.md](specs/faction-system-spec-v0.1.md) — 派閥システム本体仕様

### 既存参照実装（移植元の雛形）
- [src/index.html:1245-1302](src/index.html) — `.rivalry-popup`（因縁決着ポップアップ、本作業の目指すクオリティ）
- [src/index.html:1302-](src/index.html) — `.awards-overlay`（表彰式、Stage/Ceremony演出の参考）

### 変更対象ファイル（実装時）
- [src/ui-common.js:6369-](src/ui-common.js) — `showFactionF0[1-4]Modal` 関数群（+ F05 追加）
- [src/index.html](src/index.html) — CSS追加、オーバーレイ要素追加
- [src/app.js](src/app.js) — Audio フック追加
- [src/data.js](src/data.js) — 次セッションで FACTION_F02_LINES 追加
- [src/factions.js](src/factions.js) — 次セッションで getF02ClashLine 追加

### 音声資産
- `bgm/` ディレクトリ:
  - F01/F04/F05/F02② 沈静化: `Soft Bids, Sharp Minds.mp3`（静かな緊張）
  - F02/F02 進展系/F03 全種: `bgm_tension_v1.mp3`（ループ、シーン別に音量を微調整）
  - F02① 開戦: + `f07_gong_v1.mp3` stinger
  - F02② 対峙: + `f13_lockup_v4.mp3` whiff stinger（ゴング空振り）
  - F03 / F05 / F02② 沈静化: + `f06_fin_chime_v1.mp3` 終止 stinger

---

## 7. 次セッション冒頭のおすすめ会話

```
「faction-events-handoff.md を読んで、F02② 対峙のリーダーセリフ実データ化から始めたい。
 HTMLコメントに残してある性格×属性マトリクスを src/data.js の FACTION_F02_LINES に書き出そう」
```

もしくは:

```
「faction-events-handoff.md を読んで、モックアップ側で気になる点が残っていないか
 最終確認してから実装フェーズに入りたい」
```

---

*引き継ぎ書 v1.1 / 2026-04-22 / 派閥イベント演出プロジェクト（F05 分離後）*
