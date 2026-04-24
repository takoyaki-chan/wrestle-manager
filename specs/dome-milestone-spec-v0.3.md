# 🏟️ ドーム到達マイルストーンイベント設計書 v0.3（確定版）

> **ステータス**: ✅ 確定（実装着手可能）
> **作成日**: 2026-04-24
> **更新履歴**: v0.1 → v0.2（記録的ナレーター型確定、選択肢廃止、D層概念）→ v0.3（全項目確定、Mockup v0.6確定反映）
> **依存仕様**: venue-attendance-spec-v2.0.md / personality-archetype-spec-v1.0.md / achievement-system-spec.md
> **対応 Mockup**: `docs/ui/mockups/mockup-dome-milestone-v0.6.html`
> **実装ブランチ案**: `feature/dome-milestone`

---

## 設計原則

1. **ドームは団体の終着点** — この世界におけるプロレス団体のゴール／到達点として位置付ける
2. **「ついにここまで来た」の感慨** — 社長と選手たちが共に噛みしめる、特別な瞬間の演出
3. **キャラクターの生きている感** — 主力選手の personality × archetype 個性が演出に必ず現れる
4. **重厚なナレーション** — 記録的ナレーター型。団体の歴史を外側から記述する視点
5. **選択肢・報酬なし** — プレイヤーの経営判断を問う場面ではなく、純粋な演出・感慨の瞬間として提示

---

## §1 スコープ — 2イベント構成

| ID | タイミング | 発火条件 |
|---|---|---|
| `first_dome_show` | **ドーム興行の直前**（showPrep→showExec 遷移時） | `G.showVenue === 9` かつ `G.milestones.first_dome_show` 未設定 |
| `first_dome_sellout` | **ドーム満員興行の直後**（既存 post-show milestone タイミング） | `G.showVenue === 9` かつ `occupancyRate >= 0.95` かつ `G.milestones.first_dome_sellout` 未設定 |

同一興行で両方達成した場合：**興行前に `first_dome_show`** → 興行実行 → **興行後に `first_dome_sellout`** が自然な時系列で順次発火。連鎖発火の特別対応は不要。

---

## §2 発火メカニズム

### §2.1 first_dome_show（興行前発火）

既存のマイルストーンフレームワークは post-show のみ対応のため、新規に **pre-show フック** を追加する。

**実装箇所**: `app.js` 付近 4691 行（`weekPhase: 'showExec'` へ遷移する直前）

```
// 改修後
App._checkAndShowPreShowMilestone(() => {
  let s = { ...G, totalShows: G.totalShows + 1, weekPhase: 'showExec' };
  (興行実行へ...)
});
```

新関数 `App._checkAndShowPreShowMilestone` は MILESTONE_EVENTS のうち `trigger.timing === 'preShow'` のエントリだけを走査。

### §2.2 first_dome_sellout（興行後発火）

既存の `_checkMilestones()` に新トリガータイプ `venue_occupancy` を追加。

```
case 'venue_occupancy': {
  const t = evt.trigger;
  const cap = VENUES[t.venueIdx]?.cap;
  const occ = cap ? (G.lastShowAttendance || 0) / cap : 0;
  triggered = (G.showVenue === t.venueIdx) && (occ >= t.minOccupancy);
  break;
}
```

### §2.3 MILESTONE_EVENTS エントリ定義

```javascript
{
  id: 'first_dome_show',
  trigger: {
    type: 'venue',
    venueIdx: 9,
    timing: 'preShow'   // ← 新規フィールド
  },
  titleMain: '到 　 達',
  titleSub: 'THE DOME',
  narration: [
    'ドーム。',
    '日本のプロレス界で、頂点を意味する三文字。',
    'この会場に名を刻むことは、団体にとって一つの到達点であり、',
    '同時に、新たな始まりでもある。',
    '控室のドアの前で、一度立ち止まった。',  // gap before this line
    '息を整え、扉を開ける。',
    '——選手たちが、待っている。'
  ],
  narrationGaps: [4],  // ← index 4 の前に空行
  visualVariant: 'arrival',
  dialogueKey: 'dome_firstshow',
  continueLabel: '試 合 に 向 か う'
},
{
  id: 'first_dome_sellout',
  trigger: {
    type: 'venue_occupancy',
    venueIdx: 9,
    minOccupancy: 0.95,
    timing: 'postShow'
  },
  titleMain: '満 　 員',
  titleSub: 'FULL HOUSE',
  narration: [
    '満員のドーム。',
    'かつて、日本のプロレス興行における最大の到達点とされてきた景色。',
    '三万の観客席のすべてが埋まり、彼らは今、この団体の名を呼んでいる。',
    '最終試合の鐘が鳴り、選手たちがリングから引き上げる。',  // gap before this line
    '照明が落ち、客電が灯っても——',
    '拍手は、しばらく鳴り止まなかった。'
  ],
  narrationGaps: [3],
  visualVariant: 'triumph',
  dialogueKey: 'dome_sellout',
  continueLabel: '控 室 へ 戻 る'
}
```

**サブタイトルの動的生成**：実装時、titleSub に会場情報や週数・観客数を付加する：
- 興行前: `"THE DOME ・ WEEK " + G.week`（例: `THE DOME ・ WEEK 124`）
- 興行後: `"FULL HOUSE ・ " + attendance.toLocaleString() + " ATTENDED"`（例: `FULL HOUSE ・ 28,942 ATTENDED`）

---

## §3 主力選手選出ロジック

### §3.1 選出ルール

| 枠 | 選出基準 |
|---|---|
| **メイン1** | `G.showCard[0].left` に対応する選手（メインイベント赤コーナー） |
| **メイン2** | `G.showCard[0].right` に対応する選手（メインイベント青コーナー） |
| **ベテラン代表** | ロスターのうち **メイン2名を除いて pop 最大値の選手** を1名 |

### §3.2 役割ラベル表示

| 枠 | ラベル |
|---|---|
| メイン1 | `MAIN EVENT ・ 赤コーナー` |
| メイン2 | `MAIN EVENT ・ 青コーナー` |
| ベテラン代表 | `VETERAN ・ ロッカールーム代表` |

### §3.3 エッジケース

- **メイン2名の pop がロスタートップだった場合**: ベテラン代表は残りロスターの pop 最大 → メイン2名と同格扱いの選手が登場し、自然に収まる
- **ロスター3名未満**（理論上ありえない）: ベテラン代表枠を省略し、メイン2名のみでダイアログ構成
- **タッグ興行がメイン**: 記憶の通りメインは singles のみなので考慮不要

### §3.4 ヘルパー関数定義

```javascript
function _resolveSpotlightFighters(G) {
  const mainCard = G.showCard?.[0];
  if (!mainCard) return [];
  const mainLeftId = mainCard.left;
  const mainRightId = mainCard.right;
  const mainLeft = G.fighters.find(f => f.id === mainLeftId);
  const mainRight = G.fighters.find(f => f.id === mainRightId);

  // ベテラン代表: メイン2名を除外してpop最大
  const veteran = G.fighters
    .filter(f => f.id !== mainLeftId && f.id !== mainRightId && f.status !== 'retired' && f.contractOrg === G.orgName)
    .sort((a, b) => (b.pop || 0) - (a.pop || 0))[0];

  return [
    { fighter: mainLeft,  roleLabel: 'MAIN EVENT ・ 赤コーナー' },
    { fighter: mainRight, roleLabel: 'MAIN EVENT ・ 青コーナー' },
    veteran ? { fighter: veteran, roleLabel: 'VETERAN ・ ロッカールーム代表' } : null
  ].filter(Boolean);
}
```

---

## §4 ナレーション本文（確定）

**方針**: 記録的ナレーター型。硬く、格式を持ち、団体の歴史を外側から記述する視点。

### §4.1 first_dome_show（興行前・7行）

```
ドーム。
日本のプロレス界で、頂点を意味する三文字。
この会場に名を刻むことは、団体にとって一つの到達点であり、
同時に、新たな始まりでもある。

控室のドアの前で、一度立ち止まった。
息を整え、扉を開ける。
——選手たちが、待っている。
```

### §4.2 first_dome_sellout（興行後・6行）

```
満員のドーム。
かつて、日本のプロレス興行における最大の到達点とされてきた景色。
三万の観客席のすべてが埋まり、彼らは今、この団体の名を呼んでいる。

最終試合の鐘が鳴り、選手たちがリングから引き上げる。
照明が落ち、客電が灯っても——
拍手は、しばらく鳴り止まなかった。
```

---

## §5 ダイアログ辞書の構造

### §5.1 定数名

- `DOME_FIRSTSHOW_LINES`（first_dome_show 用）
- `DOME_SELLOUT_LINES`（first_dome_sellout 用）

配置先: `data.js` の SECTION 10 (EVENT SYSTEM v2.0) 内、`NOTIF_DIALOGUES` の次。

### §5.2 構造

```javascript
DOME_FIRSTSHOW_LINES = {
  normal:    { _default, ojousama, delinquent, cool, seductive, polite, composed },
  bold:      { _default, ojousama, delinquent, cool, seductive, polite, composed },
  quiet:     { _default, ojousama, delinquent, cool, seductive, polite, composed },
  easygoing: { _default, ojousama, delinquent, cool, seductive, polite, composed },
  earnest:   { _default, ojousama, delinquent, cool, seductive, polite, composed },
  emotional: { _default, ojousama, delinquent, cool, seductive, polite, composed },
  shy:       { _default, ojousama, delinquent, cool, seductive, polite, composed },
};
```

- **最上位キー**: personality（7種: normal / bold / quiet / easygoing / emotional / earnest / shy）
- **第2層キー**: archetype（7種: `_default`（normal archetype）/ ojousama / delinquent / cool / seductive / polite / composed）
- **第3層**: セリフ配列、**各3行**

**合計**: 7 × 7 × 3 = **147行** × 2イベント = **294行**（仕様書 v0.2 の 252行から修正：data.js の実態で archetype が `composed` 含む7種のため）

### §5.3 解決ロジック

```javascript
function resolveDomeLine(fighter, dialogueKey) {
  const dict = dialogueKey === 'dome_firstshow' ? DOME_FIRSTSHOW_LINES : DOME_SELLOUT_LINES;
  const p = fighter.personality || 'normal';
  const a = fighter.archetype || 'normal';
  const personaDict = dict[p] || dict['normal'];
  const archetypeKey = a === 'normal' ? '_default' : a;
  const lines = personaDict[archetypeKey] || personaDict['_default'];
  // rngDerive で決定論的に選出（リプレイ時同じセリフ）
  const seed = Engine.rng.derive(G.rngSeed, G.season, G.week, 0xD03E, fighter.id);
  const idx = Math.floor(Engine.rng.create(seed)() * lines.length);
  return lines[idx];
}
```

フォールバック順: `[p][a]` → `[p][_default]` → `[normal][_default]`

**決定論化**：RNGシードから決定論的にセリフを選ぶことで、セーブ&ロード時の再現性を確保。

### §5.4 トーン指針

| 軸 | first_dome_show（興行前） | first_dome_sellout（興行後） |
|---|---|---|
| 感情 | 覚悟・高揚・わずかな緊張 | 達成感・安堵・涙・感謝 |
| 発話量 | 短め（1〜2文） | 少し長め（1〜2文、時に絶句） |
| 共通モチーフ | 「ここまで来た」「これから」「このリング」 | 「満員」「ありがとう」「忘れない」 |

全294行のダイアログ辞書は別資料 `dome-milestone-dialogues-v0.1.md` で執筆（次ステップ）。

---

## §6 UI仕様（Mockup v0.6 確定）

### §6.1 レイアウト構造

3ゾーングリッド（上段 / 中段 / 下段）で両フェーズが同一矩形領域を共有する絶対配置。`grid-template-rows: minmax(160px, 22vh) 1fr minmax(150px, 22vh)`

| ゾーン | Phase 1 | Phase 2 |
|---|---|---|
| 上段 | タイトルバンド | 空白（予約） |
| 中段 | ナレーション | 主力選手3名トリオ |
| 下段 | 空白（予約） | 続けるボタン |

### §6.2 シーケンス

**Phase 1 ・ NARRATION**:
1. 画面表示 → タイトル帯が 1.2秒で自動フェードイン
2. クリックごとにナレーション1行ずつ表示（蓄積式）
3. ナレーション全行表示後の次クリックで Phase 2 へ遷移

**Phase 遷移**:
- Phase 1 が 1.1秒かけてフェードアウト
- 完全に消えた後、Phase 2 が 1.0秒かけてフェードイン

**Phase 2 ・ CHARACTERS**:
1. クリックで選手1（赤コーナー）が下から浮き上がって出現＋吹き出し表示（0.2秒遅れ）
2. クリックで選手2（青コーナー）
3. クリックで選手3（ベテラン代表）
4. 3人揃った 0.8秒後に「続ける」ボタンが自動フェードイン

### §6.3 タイポグラフィ

- **ナレーション**: `var(--font-ceremony)`（Shippori Mincho）、19px / line-height 2.2 / letter-spacing 0.08em
- **選手名**: `var(--font-body)`（Noto Sans JP）Bold 14px / letter-spacing 0.15em / 金色上ボーダー（`rgba(212,168,67,0.3)` 1px）
- **役割ラベル**: `var(--font-label)`（Oswald）9px / letter-spacing 3px / uppercase
- **タイトル**: `var(--font-display)`（Bebas Neue）48px / letter-spacing 16-20px

### §6.4 吹き出し（画像の上の外側に配置）

- **背景**: `#ede8dc`（既存 `--office-panel-cream-card` トークン）
- **枠線**: `#2a1f18`（暖色寄り近黒、1px）
- **文字色**: `#181614`（既存 `--office-panel-dark` 相当）
- **角丸**: `10px 10px 10px 2px`（左下だけシャープ、紙片風）
- **ドロップシャドウ**: `0 8px 24px rgba(0,0,0,0.55)`
- **尻尾**: CSS 二重三角（`::before` 枠、`::after` 塗り）で枠線付き。画像上辺を指す下向き
- **フォント**: `var(--font-ceremony)`（Shippori Mincho）、15px / line-height 1.8 / font-weight 500

### §6.5 背景演出（visualVariant）

- **arrival（興行前）**: 下方から暖色金の微光が静かに立ち昇る
  ```
  radial-gradient(ellipse 80% 50% at 50% 100%,
    rgba(212,168,67,0.10) 0%, transparent 60%)
  ```
- **triumph（興行後）**: 中央から呼吸する金色の輝き、5秒周期でゆっくり明滅
  ```
  radial-gradient(ellipse 80% 60% at 50% 50%,
    rgba(240,208,120,0.14) 0%, rgba(212,168,67,0.04) 45%, transparent 75%)
  animation: triumphBreath 5s ease-in-out infinite;
  ```

### §6.6 BGM

| イベント | ファイル | 元用途 |
|---|---|---|
| first_dome_show | `../bgm/bgm_kaimaku_v1.mp3` | SB1 開幕ドラフト |
| first_dome_sellout | `../bgm/8bit-ending-theme_Loop.ogg` | FB6 年末表彰式 |

- **音量**: `0.10`（既存派閥イベント・PPV演出と同水準）
- **ループ**: 両方とも有効
- **Phase 遷移時**: BGM は継続再生（切らない）
- **イベント終了時**: 1.5秒フェードアウト → 次フローのBGMへ
- **実装パターン**: 既存 `_factionAudioOpen` / `_factionAudioClose` を踏襲

---

## §7 新規関数 `showCeremonyEvent`

既存 `showMilestoneEvent` とは設計意図が異なるため、**新規汎用関数** として実装。今後の殿堂入り・初PPV等のセレモニー演出でも共用可能な基盤とする。

### §7.1 関数シグネチャ

```javascript
function showCeremonyEvent(evt, speakers, onContinue) {
  // evt: MILESTONE_EVENTS エントリ
  // speakers: [{fighter, roleLabel}, ...]
  // onContinue: 続けるボタンクリック時のコールバック
}
```

### §7.2 DOM 生成

Mockup v0.6 と同一の DOM 構造を JavaScript で動的生成。CSS クラスは `cerem-` プレフィックスで統一（今後の汎用基盤として）。

### §7.3 ポートレート画像

`image/upper/{fighter.id}.webp` を背景画像として読み込む。派閥モーダルの `_factionUpperUrl(id)` と同パターン。画像未存在の場合はシルエットプレースホルダを表示（CSS の `::before`/`::after` で生成）。

---

## §8 既存システムとの整合

### §8.1 D層（演出イベント）カテゴリ新設

`achievement-system-spec.md` に新カテゴリを追加：

| 層 | 名前 | 性格 | 例 |
|---|---|---|---|
| A | マイルストーン | 選択肢+報酬バフ、全画面演出 | 旗揚げ興行、初因縁 |
| B | 実績 | 解除通知のみ | 通算10興行等 |
| C | 隠し実績 | 条件非公開の記録 | 番狂わせ等 |
| **D** | **演出イベント** | **選択肢・報酬なし、全画面セレモニー演出のみ** | **first_dome_show、first_dome_sellout** |

D層の特徴：
- プレイヤーの判断を介さない（ゲーム進行を一時停止する演出のみ）
- キャラクター演出（主力選手のセリフ）が入る
- フラグ `G.milestones` は共用（一度発火したら再発火しない）
- 報酬バフなし

### §8.2 achievement-system-spec.md の更新

- B層リストから `dome_show`・`sellout_dome` を削除
- D層リストに `first_dome_show` / `first_dome_sellout` を追加

### §8.3 既存セーブデータ互換性

- 両イベントとも新規フラグのため既存セーブ破壊なし
- **マイグレーション方針**: **遡及発火に任せる**（マイグレーション処理は不要）
- 既にドーム経験済みセーブでも、次回ドーム興行時に自然に発火する

---

## §9 実装タスク一覧

### T1. ダイアログ辞書執筆（次ステップで着手）
`specs/dome-milestone-dialogues-v0.1.md` または直接 `.js` で全294行執筆。

### T2. data.js 改修
- `MILESTONE_EVENTS` に2エントリ追加（`choices: []`、`trigger.timing`、`dialogueKey`、`continueLabel` 等の新フィールド対応）
- `DOME_FIRSTSHOW_LINES` / `DOME_SELLOUT_LINES` 定数追加
- exports 追加

### T3. app.js 改修
- `_checkMilestones()` に `venue_occupancy` トリガータイプ追加（`trigger.timing === 'postShow'` のみ）
- **新規**: `_checkAndShowPreShowMilestone(onDone)` 関数（`trigger.timing === 'preShow'` のみ）
- **新規**: `_resolveSpotlightFighters(G)` ヘルパー（§3.4）
- **新規**: `resolveDomeLine(fighter, dialogueKey)` ヘルパー（§5.3）
- **新規**: `showCeremonyEvent(evt, speakers, onContinue)` 関数（§7）
- **新規**: ドーム専用 BGM 制御 `_ceremAudioOpen(src)` / `_ceremAudioClose()`

### T4. showExec 遷移箇所の改修
`app.js:4691` 付近の興行開始直前に pre-show milestone チェックを挿入：

```javascript
App._checkAndShowPreShowMilestone(() => {
  // 既存の showExec 遷移ロジック
  let s = { ...G, totalShows: G.totalShows + 1, weekPhase: 'showExec' };
  (以下既存)
});
```

### T5. UI/CSS 実装
- CSS クラス `cerem-*` を `index.html` 末尾近くの既存 Ceremony CSS と同じ場所に追加
- Mockup v0.6 の CSS を参考に移植（nav/audio-toggle 系は Mockup専用なので除外）

### T6. achievement-system-spec.md 更新（§8.2）

### T7. 動作確認シナリオ
- シナリオ1: 初ドーム興行・不入り（<95%）→ 興行前 only
- シナリオ2: 初ドーム興行・超満員 → 興行前 + 興行後 連続
- シナリオ3: 2回目ドーム興行・初の超満員 → 興行後 only
- シナリオ4: 3回目ドーム興行・超満員（過去達成済み）→ 何も起きない
- シナリオ5: メイン2名が現在のロスターpop1位2位の場合 → ベテラン代表はpop3位選手が選出される

---

## §10 リスク・注意点

### §10.1 興行前フック新設の影響

既存のマイルストーンフレームワークは post-show 前提のため、pre-show フックは新規機構。`showPrep → showExec` の遷移が複数パス存在しないかコードレビューで確認すべし。（コメント上は `app.js:4691` 付近に1箇所のみと想定）

### §10.2 モーダル閉じた後のフロー継続

`showCeremonyEvent` は `onContinue` コールバック方式なので、呼び出し元が適切にコールバックを設定すれば既存フローを壊さない。設計的に問題なし。

### §10.3 archetype `composed` の扱い

公式仕様書（personality-archetype-spec-v1.0.md）では archetype 6種だが、data.js には `composed` が実在。本仕様では **7種扱い**（`composed` を含む）として辞書構造を定義。将来的に仕様書を data.js 実態に合わせて更新するか、逆に data.js を仕様書に合わせるかは別途判断項目（本仕様のスコープ外）。

### §10.4 ダイアログ執筆ボリューム

294行はかなり大きい。Keisuke レビューの手戻りを減らすため、執筆時は：
1. まず「トーン代表サンプル」として 14組（7 personality × 2 archetype）だけ執筆してレビュー
2. トーン確定後に残り 56組を一括執筆

---

## §11 変更履歴

### v0.3 (2026-04-24) ✅ 確定版
- Mockup v0.6 の確定内容を全反映
- タイトル：「到 達」/「満 員」確定
- ボタン：「試 合 に 向 か う」/「控 室 へ 戻 る」確定
- BGM：`bgm_kaimaku_v1.mp3` / `8bit-ending-theme_Loop.ogg` 確定
- モーダル：新規関数 `showCeremonyEvent` 採用確定
- マイグレーション：遡及発火確定（処理不要）
- archetype：`composed` を含む7種扱いに修正（dialogueは 252行 → 294行）
- MILESTONE_EVENTS エントリ定義を詳細化（`narrationGaps`、`visualVariant` 等の新フィールド）
- 実装タスク T1〜T7 を明示、動作確認シナリオ5件
- リスク項目 §10 追加

### v0.2 (2026-04-24)
- 記録的ナレーター型（案C）で確定
- 選択肢・報酬バフを廃止
- D層「演出イベント」カテゴリ新設を提案

### v0.1 (2026-04-24)
- 初稿
