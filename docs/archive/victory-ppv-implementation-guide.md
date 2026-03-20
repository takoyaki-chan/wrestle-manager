# 実装指示書: 勝利演出 + PPV画面 + BGM + getUpperUrlリファクタ

> 作成: 2026-03-18
> プロトタイプ: `archive/prototype/victory-popup-prototype.html`, `archive/prototype/ppv-matchcard-prototype.html`, `archive/prototype/ppv-progression-prototype.html`
> 関連仕様書: `specs/battle-ui-spec-v1.0.md`, `specs/ppv-grand-final-spec-v2.0.md`

---

## 実装順序

0. **CLAUDE.md に共通UIルールを追記**（最初に実施）
1. **getUpperUrlリファクタ**（下準備、他の前提）
2. **勝利演出リニューアル**（battle-engine.html内）
3. **PPVマッチカード画面**（PPV開始前のポスター一覧）
4. **BGM割り当て+全音量設定**
5. **PPV試合進行画面リデザイン**（renderPPVMatchPreview）

---

## 0. CLAUDE.md に共通UIルール追記

リポジトリルートの `CLAUDE.md` に以下を追記すること（「やらないことリスト」や「数値哲学」と同じ階層のセクションとして）:

```markdown
## UI共通ルール

### 能力値の対比表示
2キャラの能力を並べるときは**必ず左右対称レイアウト**を使う。中央にラベル（PW/SP/TE/ST/MN）、そこから左右にバーが伸びる形で対比を見せる。片側だけにバーを並べる形式は使わない。

### セリフ表示
選手・コーチのセリフ/ボイス表示は**白い吹き出し（#f0f0f0背景）＋黒文字**に統一する。吹き出し内のテキストは中央寄せ。話者名は吹き出し内の上部に小さく色付きで表示。これはPPV・通常興行・イベント・ケア等あらゆるシーンで共通。
```

---

## 1. getUpperUrlリファクタ

### 概要
`data.js`の`getUpperUrl(id)`は実態としてstand画像のパスを返している。関数名と実態のミスマッチを解消し、3画像種別に対応する関数を整備する。

### 手順

1. `grep -rn 'getUpperUrl' src/` で全呼び出し箇所を洗い出す
2. `getUpperUrl(id)` → `getStandUrl(id)` にリネーム（既存の全呼び出し箇所を置換）
3. 新規関数を追加:
   - `getUpperUrl(id)` — `image/upper/upper_{slug}.webp` を返す（カットイン用）
   - `getFullUrl(id)` — `image/full/full_{slug}.webp` を返す（対戦カード/PPV用）
4. ID→slugの解決は既存の`portrait-map.js`の仕組みを使うこと
5. battle-engine.html内の呼び出しも確認・修正

### 変更ファイル
- `src/data.js`（関数定義）
- `src/battle-engine.html`（呼び出し側）
- その他grepでヒットしたファイル全て

### 注意
- ブラウザ動作に影響がないことを確認
- auto-sim 100シーズン ALL CLEAR

---

## 2. 勝利演出リニューアル

### 概要
`battle-engine.html`の`renderResult()`を刷新する。プロトタイプ: `archive/prototype/victory-popup-prototype.html`

### デザイン仕様（プロトタイプ準拠）

**レイアウト（上から順）:**

1. **勝者upper画像** — 160×240px、`object-fit: contain`、`drop-shadow`付き。`getUpperUrl(winnerId)`で取得
2. **「WINNER」ラベル** — Bebas Neue 18px、letter-spacing 6px、赤（#e94560）
3. **勝者名** — Bebas Neue 42px、ゴールドグラデーション（#ffd700→#daa520）
4. **決まり手テキスト** — 14px、#aaa。Engine.formatFinish()のフォーマット（「技名 → 3カウント」形式）
5. **勝利セリフ枠** — 最重要要素。金の左ボーダー（3px #daa520）、背景は金の微グラデーション。フォント17px、色#f0e6d0。「」で囲む（括弧の色は#daa520）
6. **下部バー** — 左: 敗者face画像（36px丸）+ 敗者名（13px #888）+ 「LOSER」タグ。右: MQスコア（Bebas Neue 24px、75以上で金色）+ ターン数（Bebas Neue 24px）
7. **CLOSEボタン** — transparent背景、border 1px #555、hover時ゴールド

**オーバーレイ:**
- `radial-gradient(ellipse at center, rgba(10,10,30,0.88), rgba(0,0,0,0.95))`
- 画面全体を覆う

**引き分け:**
- 現行の「DRAW」テキスト表示を維持

**SE:**
- 既存の finChime → victoryFanfare のタイムラインを維持
- bellx3のフォール/ギブアップ使い分けも維持

### 変更ファイル
- `src/battle-engine.html`（renderResult関数の書き換え + CSS追加）

### 注意
- engine.jsは変更しない
- 既存のrenderResultのフェードインタイムライン（box→画像→名前→決まり手→セリフ→CLOSE）は維持してよい
- MQスコアとターン数はbattle-engine内で参照可能な`S.mq`と`S.turn`から取得
- auto-sim 100シーズン ALL CLEAR（battle-engine.htmlのみの変更なのでengine影響なし、念のため）

---

## 3. PPVマッチカード画面

### 概要
PPV興行の開始前に全カード一覧を表示する画面を新設。プロトタイプ: `archive/prototype/ppv-matchcard-prototype.html` のLayout A（ミニポスター縦並び）を採用。

### デザイン仕様（プロトタイプ Layout A 準拠）

**全体構成:**
- PPVタイトルエリア（上部）: 「Special Event」ラベル + 大会名（PPV_NAMESから、Bebas Neue 52px ゴールドグラデーション）+ 「Season N ─ 全M試合」
- カードリスト（縦並び、gap 6px）

**各マッチカード:**
- 高さ: 通常180px、メインイベント220px
- 3カラム構成: 左full画像 / 中央テキスト / 右full画像
- 左キャラ: `scaleX(-1)`で左向き（外向き）
- 右キャラ: そのまま右向き（外向き）
- 画像: `position: absolute; bottom: 0;` で足元合わせ、上方向にはみ出す（通常280px高、メイン340px高）
- 中央テキスト: 試合種別（MAIN EVENT等）+ 選手名 + VS + 選手名 + バッジ（タイトル戦/因縁表示）+ h2h通算成績
- 中央テキストエリアに半透明背景グラデーション（画像の上でも読めるように）
- メインイベントはゴールド枠 + box-shadow

**z-index（重要）:**
- 下の段のカードほどz-indexが高い（手前に来る）
- 上のカードの画像が下のカードの裏に隠れる構造

**メインイベント判定:**
- PPVカードの最初の試合（index 0）をメインイベントとして扱う
- または`matchTier`が最も高い試合

**表示データ:**
- 選手名: fighter.name
- full画像: `getFullUrl(fighter.id)`（手順1で新設した関数）
- 試合種別: タイトル戦/特別試合/通常等
- バッジ: タイトル戦なら「👑 王座戦」、因縁ペアなら因縁称号表示
- h2h: G.h2hから通算成績取得。初対戦なら「FIRST MEETING」

**フロー統合:**
- 既存のPPVフロー（`initPPVShow`）の最初に、マッチカード画面を挿入
- マッチカード画面でカードをクリック or 「START」ボタンで試合進行に遷移
- 各カードクリック → そのカードの対戦カード紹介画面（showMatchCard、Phase 6実装済み）に入る導線

### 変更ファイル
- `src/app.js`（PPVフロー内にマッチカード画面挿入）
- `src/ui-render.js` or `src/ui-common.js`（renderPPVMatchCard関数新設）
- `src/index.html`（CSS追加）

### 注意
- engine.jsは変更しない
- 対戦カード紹介画面（showMatchCard）は`matchTier>=2`の試合のみ表示される既存仕様。PPVは全試合がmatchTier>=2のはずだが確認すること
- auto-sim 100シーズン ALL CLEAR

---

## 5. PPV試合進行画面リデザイン（renderPPVMatchPreview）

### 概要
PPV興行中に1試合ずつ「観る/スキップ」を処理する既存の`renderPPVMatchPreview`画面をリデザインする。プロトタイプ: `archive/prototype/ppv-progression-prototype.html`

### フロー
1. PPVマッチカード画面（§3、Layout Aポスター）→ 紹介のみ
2. **この画面**（§5）→ 下の試合から順に1試合ずつ処理。「観る」でbattle-engine起動、「スキップ」で結果だけ表示
3. 全試合完了 → PPVリザルト画面（既存）

### デザイン仕様（プロトタイプ準拠）

**幅**: 960px（既存より広く使う）

**現在の試合カード（大きく表示）:**

上から順に:
1. **試合番号**: Bebas Neue 30px（メイン36px）、中央、letter-spacing 6px
2. **試合種別ラベル**: 12px、中央（メインイベント ─ 頂上決戦 等）
3. **対戦エリア**: 配置は `[情報(外)] [upper画像] ── VS ── [upper画像] [情報(外)]`
   - upper画像: 165×255px、反転なし（そのまま表示）
   - 外側情報: 選手名（Bebas 26px）、所属団体（10px）、OVR数値（Bebas 54px、ゴールドグラデーション #ffd700→#daa520）
   - VS: Bebas 62px（メイン70px）、赤→ゴールドグラデーション、drop-shadow
   - バッジ: VSの下に表示（👑 世界王座戦、🔥 宿命の相手 等）
4. **能力比較エリア（対比表示）**:
   - スタイル行: 左右対称に `人気N / Babyface・Heel / スタイル名`。Heel=赤枠、Babyface=青枠
   - 5能力バー: 中央にラベル（PW/SP/TE/ST/MN、Bebas 15px）、左右に色付きバーが伸びる。高い方の数値をゴールドでハイライト。バー高さ12px、max-width 240px
   - 特性タグ行: 左右にそれぞれの特性タグを並べる
5. **煽り文**: 中央、15px、赤（メインはゴールド）、太字
6. **セリフ**: 横並び2カラムで高さ揃え。白い吹き出し（#f0f0f0背景、黒文字）、テキスト中央寄せ。名前は吹き出し内上部に色付き表示（左=赤系、右=青系）。吹き出し三角は外側に向く。セリフ量に応じて幅が自然に変わる
7. **「試合を観る」ボタン**: 大きく中央に（padding 14px 80px、17px太字）、赤枠。メインはゴールド枠
8. **「スキップ」**: 小さく目立たなく（11px、色#444）

**完了済み試合（コンパクト）:**
- 試合番号（Bebas 13px灰）
- `✓ 勝者名 def. 敗者名` + 決まり手 + MQ値（75以上でゴールド）

**待機中試合（控えめ）:**
- 試合番号 + 選手名（薄い色#2a2a45で表示、紹介済みなので名前は見える）

**セリフの全体方針（今後の共通ルール）:**
- ゲーム全体でセリフ表示は**白い吹き出し＋黒文字**に統一する方向
- 吹き出し内のテキストは中央寄せ
- 話者名は吹き出し内上部に小さく表示

### 変更ファイル
- `src/app.js`（renderPPVMatchPreview書き換え）
- `src/ui-render.js` or `src/ui-common.js`（ヘルパー関数）
- `src/index.html`（CSS追加）

### 注意
- engine.jsは変更しない
- 既存のPPVフロー（ppvWatchMatch/ppvSkipMatch/ppvSkipAll等）のロジックはそのまま。UIの見た目だけ変える
- auto-sim 100シーズン ALL CLEAR

---

## 4. BGM割り当て + 全音量設定

### BGMファイル割り当て

| シーン | ファイル | 備考 |
|--------|----------|------|
| ビッグマッチ（試合中） | `iwashiro_elevate_perfect.ogg` | 既存。FileBGM経由 |
| PPV（マッチカード/試合間） | `MusMus-BGM-052.mp3` | **新規割り当て** |
| 対抗戦（演出画面） | `MusMus-BGM-125.mp3` | **新規割り当て** |
| ゲームオーバー | `iwa_gameover001.mp3` | **新規割り当て** |
| ゲームクリア（エンディング） | `8bit-jo-jokyoku.mp3` | **新規割り当て** |
| 年末表彰式 | `8bit-ending-theme_Loop.mp3` | **新規割り当て** |
| 開幕/ドラフト | Web Audio生成 (kaimaku) | 既存 |
| 団体運営 | Web Audio生成 (management) | 既存 |
| 激闘（通常興行） | Web Audio生成 (battle) | 既存 |
| 節目/オフシーズン | Web Audio生成 (season_end) | 既存 |
| 緊張（イベント） | Web Audio生成 (tension) | 既存 |

### フロー統合箇所

- **PPV BGM**: `initPPVShow()`でFileBGM.play('MusMus-BGM-052.mp3', {loop:true})。試合iframe起動時にFileBGM.stop()→試合終了後に復帰
- **対抗戦BGM**: 対抗戦演出画面（宣戦布告ポップアップ〜結果画面）でFileBGM.play('MusMus-BGM-125.mp3', {loop:true})
- **ゲームオーバーBGM**: ゲームオーバー画面表示時にFileBGM.play('iwa_gameover001.mp3')
- **エンディングBGM**: エンディング画面表示時にFileBGM.play('8bit-jo-jokyoku.mp3')
- **年末表彰式BGM**: `_checkAndShowAwards()`でFileBGM.play('8bit-ending-theme_Loop.mp3', {loop:true})

### 全音量設定値（ミキサー調整済み）

以下の値をゲームに反映すること。Master=70%を基準として各トラックの音量を設定。

```javascript
// ═══ ファイルBGM音量 ═══
const FILE_BGM_VOLUME = {
  bigmatch:    0.12,  // iwashiro_elevate_perfect.ogg
  ppv:         0.12,  // MusMus-BGM-052.mp3
  war:         0.10,  // MusMus-BGM-125.mp3
  gameover:    0.08,  // iwa_gameover001.mp3
  ending:      0.05,  // 8bit-jo-jokyoku.mp3
  awards:      0.07,  // 8bit-ending-theme_Loop.mp3
};

// ═══ チップチューンBGM音量 (bgmGain.gain.value) ═══
// 現行: _bgmVol = 0.04
// 以下はトラック別の相対値。bgmGain全体を調整するか、
// 各トラックのノート生成時のgain値にmultiplierを掛ける
const CHIPTUNE_BGM_MIX = {
  kaimaku:     0.21,  // 開幕/ドラフト
  management:  0.53,  // 団体運営（日常）
  battle:      0.40,  // 激闘
  season_end:  0.43,  // 節目
  tension:     0.36,  // 緊張
};

// ═══ ジングル音量 ═══
const JINGLE_MIX = {
  victory:       0.38,
  championship:  0.33,
};

// ═══ SE音量 — UI ═══
const SE_UI_VOLUME = {
  click:     0.50,
  hover:     0.40,
  select:    0.50,
  deselect:  0.40,
  error:     0.50,
  save:      0.40,
  notify:    0.50,
  event:     0.50,
  coin:      0.40,
  spend:     0.40,
  stamp:     0.40,
};

// ═══ SE音量 — 演出 ═══
const SE_EFFECT_VOLUME = {
  fanfare:               0.74,
  crowd:                 0.55,
  bell:                  0.55,
  bellx3:                0.76,
  impact:                0.55,
  victory:               0.70,
  defeat:                0.58,
  award:                 0.72,
  tension_hit:           0.50,
  rivalry_confrontation: 0.50,
  fate_confrontation:    0.50,
  rivalry_resolution:    0.50,
  fate_resolution:       0.50,
  war:                   0.50,
  transfer:              0.40,
};

// ═══ SE音量 — 試合中 (battle-engine.html) ═══
const SE_BATTLE_VOLUME = {
  hitStrike:      0.50,
  hitThrow:       0.50,
  hitSub:         0.50,
  hitAerial:      0.50,
  hitGround:      0.50,
  hitRollup:      0.50,
  missWhiff:      0.40,
  counterSE:      0.60,
  cutinSlide:     0.40,
  dmgVoice:       0.45,
  bigmoveCharge:  0.55,
  bigmoveImpact:  0.65,
};

// ═══ SE音量 — フィニッシュ (battle-engine.html) ═══
const SE_FINISH_VOLUME = {
  count:           0.60,
  kickoutSE:       0.55,
  guEscapeSE:      0.55,
  heartbeatSE:     0.40,
  finImpact:       0.65,
  finChime:        0.50,
  gong:            0.55,
  gongStart:       0.55,
  phaseChg:        0.35,
  victoryFanfare:  0.50,
  ready:           0.40,
  fightStart:      0.45,
  lockIn:          0.35,
};
```

### 実装方法

app.js側（SE/BGM）:
- `_sfxVol`のデフォルト値を0.5→上記テーブル参照に変更するか、各SE関数内のgain値にトラック別multiplierを掛ける
- FileBGM.play()呼び出し時にvolume引数を渡す

battle-engine.html側（試合中SE）:
- 各sfx関数内のgain値にSE_BATTLE_VOLUME/SE_FINISH_VOLUMEのmultiplierを掛ける
- または全sfx関数の出力先をgainNode経由にして一括制御

---

## プロトタイプファイルの配置

実装前にプロトタイプを所定の場所にコピーすること:
```
cp victory-popup-prototype.html archive/prototype/
cp ppv-matchcard-prototype.html archive/prototype/
cp ppv-progression-prototype.html archive/prototype/
```

---

## ロードマップ更新

実装完了後、`docs/game-system-roadmap.md`を更新すること:
- 「現在の状態」に勝利演出/PPVマッチカード/PPV試合進行画面/getUpperUrlリファクタ/BGM割り当て+音量設定の完了を記載
- 「次の実装予定」から該当項目を除去
- 変更ファイル一覧・auto-sim結果を記載

