# エンディング / ゲームオーバー設計書 v1.0

> 対象: Wrestle Manager v2.0+
> 方針: クリア演出は表彰式スタイルの複数スライド＋フリーBGM。破産はシンプルに funds <= 0。

---

## 1. クリア（エンディング）

### 1.1 判定条件

**シーズン末（offWeek 4）のランキング更新後**に判定：

```
rankings[0].orgId === 'player' && !state.endingCleared
```

「年間ランキング1位でシーズンを終えた」瞬間にクリア。
既存の `worldTitleUnlocked`（一瞬でも1位到達）とは独立。エンディングは「シーズン末時点で1位」が条件。

### 1.2 ステートフィールド追加

```js
// createInitialState に追加
endingCleared: false,
endingClearedSeason: null,
```

### 1.3 クリア演出 — 表彰式スタイル複数スライド

表彰式（`showAwardsCeremony`）と同じオーバーレイ＋スライド進行方式で、クリア専用の `showEndingCeremony` を新設。

**offWeek 1 の表彰式フロー前に差し込む。**

```
offWeek 4: クリア判定 → endingCleared = true
offWeek 1: エンディング演出 → 通常の年末表彰式 → オフシーズン進行
```

#### スライド構成（全5枚）

---

**スライド1: タイトルスライド**

表彰式フレーム `award-frame-a`（またはクリア専用フレーム）使用。
**ここでエンディングBGMを再生開始。**

```
━━ シーズン${season} ━━

    🏆

  業 界 制 覇

「${orgName}」が頂点に立った。

    [開始 ▶]
```

---

**スライド2: 道のりサマリー**

フレーム `award-frame-b` 使用。

```
━━ 頂点への道のり ━━

  活動期間:      ${season}シーズン
  最終レーティング:  ${playerRating}
  最高団体人気:    ${peakOrgPop}
  興行回数:      ${totalShows}回
  ベストマッチ:    MQ ${bestMQ}
  殿堂入り:      ${hallOfFameCount}名

    [次へ ▶]
```

---

**スライド3: エース＋主力選手の祝福**

フレーム `award-frame-e` 使用。ロスターから人気上位3名を選出し、顔画像＋祝福セリフを表示。

```
━━ 選手たちの声 ━━

  [portrait1]          [portrait2]          [portrait3]
  ${name1}             ${name2}             ${name3}
  OVR ${ovr1}          OVR ${ovr2}          OVR ${ovr3}
「${祝福セリフ1}」   「${祝福セリフ2}」   「${祝福セリフ3}」

    [次へ ▶]
```

**祝福セリフプール（ENDING_LINES.fighter）**: 10パターン用意。重複しないようランダム選出。

---

**スライド4: コーチ陣の祝福**

フレーム `award-frame-d` 使用。雇用中のコーチ（`G.coaches`）を全員表示（最大3名）。
**コーチがいない場合はこのスライドをスキップ。**

```
━━ スタッフの声 ━━

  [coach_portrait1]     [coach_portrait2]
  ${coachName1}         ${coachName2}
「${祝福セリフ1}」   「${祝福セリフ2}」

    [次へ ▶]
```

コーチの顔画像は既存の `getCoachPortraitUrl()` + `renderCoachPortrait()` を流用。

---

**スライド5: 締めくくり**

フレーム `award-frame-f`（殿堂入りフレーム）使用。最も格の高いフレーム。

```
━━ CONGRATULATIONS ━━

    🏆

  「${orgName}」は
  女子プロレス界の頂点に立った。

  しかし、戦いはまだ続く——
  この先に待つのは、新たな伝説の始まり。

    [続ける ▶]
```

「続ける」ボタンでBGMをフェードアウトし、オーバーレイを閉じて通常の年末表彰式フローに遷移。

---

### 1.4 セリフデータ

data.js に追加：

```js
const ENDING_LINES = {
  fighter: [
    'みんなで掴んだ頂点だ。最高のチームだよ',
    'ここが頂点……でも、まだ先がある気がする',
    '入団した時は、まさかここまで来れるなんて思わなかった',
    'この団体で戦えて、本当に良かった',
    '一番になったんだ。信じられない……でも、これが現実だ',
    '練習してきたことが全部報われた。泣きそう',
    '私たちの戦いが、業界を変えた。誇りに思う',
    '最高の仲間と、最高の舞台。感謝しかない',
    'ここで終わりじゃない。もっと強くなって、もっと上を目指す',
    'この景色を見るために戦ってきた。最高だ'
  ],
  coach: [
    'よくぞここまで……立派になった',
    'あの選手たちを見ていると、指導者冥利に尽きる',
    '私の教え子たちが業界の頂点に。これ以上の喜びはない',
    'まだまだ伸びる選手ばかりだ。楽しみは尽きないよ',
    'ここが終着点じゃない。さらに上の景色を見せてやる',
    '選手たちの努力が実を結んだ。私は見守っただけだ'
  ]
};
```

### 1.5 クリア後の挙動

- `endingCleared = true` でフラグが立つ
- ゲームはそのまま継続可能（周回プレイ）
- 2回目以降の1位フィニッシュ: ゲームログに `🏆 シーズン${season}: 業界1位でフィニッシュ！` を追加するのみ

### 1.6 将来の拡張予約

| 項目 | 備考 |
|------|------|
| クリア演出のさらなる豪華化 | エンドロール風スクロール演出など |

---

## 2. ゲームオーバー（破産）

### 2.1 判定条件

**毎週の `tickWeek` → `processSettlement` 完了後**に判定：

```
state.funds <= 0
```

給料・固定費を払った結果、資金が0以下になった瞬間にゲームオーバー。

### 2.2 判定の配置場所

`tickWeek` 内、settlement適用後：

```js
// tickWeek 内（既存コード）
s = { ...s, roster: settle.roster, funds: settle.funds, ... };

// ★ ここに破産判定を追加
if (s.funds <= 0) {
  s = { ...s, weekPhase: 'gameover' };
  events.push('💀 資金が尽きた…団体は解散を余儀なくされた。');
}
```

`weekPhase: 'gameover'` を新設。UI側でこのフェーズを検知して専用画面を表示。

### 2.3 ゲームオーバー画面

フルスクリーンオーバーレイ（暗転背景）で以下を表示：

```
┌─────────────────────────────────────┐
│                                     │
│         💀 GAME OVER                │
│                                     │
│    「${orgName}」は資金難により      │
│     活動停止を発表した。             │
│                                     │
│  ─── 団体の足跡 ───                 │
│                                     │
│  活動期間:    ${season}シーズン      │
│  最高ランク:  ${bestRank}位          │
│  最高資金:    ${peakFunds}万         │
│  最高団体人気: ${peakOrgPop}         │
│  興行回数:    ${totalShows}回        │
│  ベストマッチ: ${bestMQMatch}        │
│              (MQ ${bestMQ})          │
│  殿堂入り:    ${hallOfFameCount}名   │
│                                     │
│    [ 成績を噛み締めた ]              │
│           ↓                         │
│    [ タイトルに戻る ]                │
│                                     │
└─────────────────────────────────────┘
```

#### 表示データの収集

`Engine.ending.buildGameOverSummary(state)` を新設して集計。

| 項目 | ソース |
|------|--------|
| 活動期間 | `G.season` |
| 最高ランク | `seasonHistory` から `Math.min(...map(h => h.rank))` + 現シーズンrank |
| 最高資金 | 各シーズンの `peakFunds` の最大値 |
| 最高団体人気 | 各シーズンの `peakPop` / `orgPop` の最大値 |
| 興行回数 | `showCount` 合計 |
| ベストマッチ | 全シーズン通しての最高MQ |
| 殿堂入り数 | `G.hallOfFame.length` |

#### ボタン挙動

1. 「成績を噛み締めた」→ 押すと「タイトルに戻る」ボタンが出現
2. 「タイトルに戻る」→ `App.showTitleScreen()` を呼ぶ

**重要**: ゲームオーバー到達時にオートセーブを**上書きしない**。直前セーブからCONTINUEで再開可能。

---

## 3. エンディングBGM（ファイル再生システム）

### 3.1 背景

現在のオーディオは全てWeb Audio APIの合成音（チップチューン）で、外部ファイル再生の仕組みがない。
エンディングBGMにはフリー音楽ファイル（mp3/ogg）を使用するため、ファイル再生機能を新設する。

### 3.2 音楽ファイルの配置

```
音楽ファイルの格納先（ユーザーが配置）:
  bgm/ending.mp3（または .ogg）

build-zip.sh にも bgm/ フォルダのコピーを追加する。
```

### 3.3 実装方針: HTMLAudioElement ベース

既存のWeb Audio APIシンセサイザー（BGMオブジェクト）とは**別系統**で、ファイルBGM専用のシンプルなプレイヤーを作る。既存システムに影響を与えない。

```js
// Audio モジュール内に追加
const FileBGM = {
  _audio: null,
  _fadeTimer: null,

  play(src, { loop = false, volume = null } = {}) {
    FileBGM.stop();
    BGM.stop(); // 既存チップチューンBGMを停止

    const a = new Audio(src);
    a.loop = loop;
    // BGM音量設定に連動（_bgmVol は 0〜0.15 程度なので、ファイルBGM用にスケーリング）
    a.volume = volume !== null ? volume : Math.min(1.0, _bgmVol * 8);
    a.play().catch(() => {}); // autoplay policy対策
    FileBGM._audio = a;
  },

  stop() {
    if (FileBGM._fadeTimer) { clearInterval(FileBGM._fadeTimer); FileBGM._fadeTimer = null; }
    if (FileBGM._audio) {
      FileBGM._audio.pause();
      FileBGM._audio.currentTime = 0;
      FileBGM._audio = null;
    }
  },

  fadeOut(durationMs = 2000) {
    if (!FileBGM._audio) return Promise.resolve();
    return new Promise(resolve => {
      const a = FileBGM._audio;
      const startVol = a.volume;
      const steps = 20;
      const interval = durationMs / steps;
      let step = 0;
      FileBGM._fadeTimer = setInterval(() => {
        step++;
        a.volume = Math.max(0, startVol * (1 - step / steps));
        if (step >= steps) {
          clearInterval(FileBGM._fadeTimer);
          FileBGM._fadeTimer = null;
          FileBGM.stop();
          resolve();
        }
      }, interval);
    });
  },

  // BGM音量変更時に追従
  updateVolume() {
    if (FileBGM._audio) {
      FileBGM._audio.volume = Math.min(1.0, _bgmVol * 8);
    }
  }
};
```

### 3.4 BGM音量連動

既存の `setBgmVol(v)` に `FileBGM.updateVolume()` を追加し、設定画面のBGMスライダーがファイルBGMにも反映されるようにする。

`_bgmMuted` が true の場合も FileBGM.play を抑制する（既存BGMと同じルール）。

### 3.5 再生タイミング

| タイミング | 操作 |
|------------|------|
| エンディング スライド1 表示時 | `FileBGM.play('bgm/ending.mp3', { loop: true })` |
| スライド5「続ける」ボタン押下時 | `FileBGM.fadeOut(2000)` → フェードアウト完了後にオーバーレイを閉じる |

### 3.6 build-zip.sh への追加

```bash
# 追加行
mkdir -p "${DIST_DIR}/bgm"
cp bgm/* "${DIST_DIR}/bgm/" 2>/dev/null || true
```

---

## 4. クレジット表示

### 4.1 掲載場所

**タイトル画面**の「VERSION 1.0」テキストの下に「Credits」リンクを追加。クリックでクレジットモーダルを表示。

### 4.2 タイトル画面HTML変更

```html
<!-- 既存 -->
<div class="title-ver">VERSION 1.0</div>

<!-- 追加 -->
<div class="title-credits-link" onclick="App.showCredits()">Credits</div>
```

CSS:
```css
.title-credits-link {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  margin-top: 6px;
  letter-spacing: 1px;
}
.title-credits-link:hover {
  color: rgba(255,255,255,0.6);
  text-decoration: underline;
}
```

### 4.3 クレジットモーダル

シンプルなオーバーレイモーダル。新聞パネルと似たスタイル。

```html
<div class="credits-overlay" id="creditsOverlay" onclick="App.closeCredits()">
  <div class="credits-box" onclick="event.stopPropagation()">
    <div class="credits-title">CREDITS</div>
    <div class="credits-body">
      <div class="credits-section">
        <div class="credits-heading">ゲームデザイン・開発</div>
        <div>たこやき</div>
      </div>
      <div class="credits-section">
        <div class="credits-heading">使用楽曲</div>
        <div id="creditsMusicList">
          <!-- 楽曲クレジットをここに列挙 -->
        </div>
      </div>
    </div>
    <button class="credits-close" onclick="App.closeCredits()">閉じる</button>
  </div>
</div>
```

### 4.4 クレジットデータ管理

data.js（または直接HTML内）にクレジット情報を定数として保持：

```js
const CREDITS = {
  music: [
    { title: '（曲名）', artist: '（アーティスト名）', source: '（配布元サイト名）', url: '（配布元URL）', license: '（ライセンス種別）' },
    // 必要に応じて複数追加可能
  ]
};
```

楽曲が追加された際は、この配列にエントリを足すだけで済む構造。

### 4.5 App関数

```js
App.showCredits = function() {
  document.getElementById('creditsOverlay').classList.add('active');
};
App.closeCredits = function() {
  document.getElementById('creditsOverlay').classList.remove('active');
};
```

---

## 5. 実装タスク一覧

| # | タスク | ファイル | 重さ |
|---|--------|----------|:----:|
| 1 | `endingCleared` / `endingClearedSeason` を `createInitialState` に追加 | engine.js | 極小 |
| 2 | offWeek 4 のシーズン遷移内にクリア判定を追加 | engine.js | 小 |
| 3 | `Engine.ending.buildClearData(state)` — クリア演出用データ生成 | engine.js | 小 |
| 4 | `ENDING_LINES`（選手祝福10 + コーチ祝福6）を追加 | data.js | 小 |
| 5 | `showEndingCeremony(data, onDone)` — 5スライド表彰式風UI | ui-common.js | 中 |
| 6 | offWeek 1 の表彰式フロー前にエンディング演出を差し込む | app.js | 小 |
| 7 | `FileBGM` オブジェクト（play / stop / fadeOut / updateVolume） | app.js | 小 |
| 8 | `setBgmVol` / `bgmMuted` にFileBGM連動を追加 | app.js | 極小 |
| 9 | `tickWeek` 内 settlement 後に破産判定を追加 | engine.js | 極小 |
| 10 | `Engine.ending.buildGameOverSummary(state)` — 成績集計 | engine.js | 小 |
| 11 | ゲームオーバー画面 HTML + CSS + UIハンドリング | index.html + ui-common.js + app.js | 中 |
| 12 | ゲームオーバー時のオートセーブ抑制 | app.js | 極小 |
| 13 | クレジットモーダル HTML + CSS | index.html | 小 |
| 14 | `CREDITS` 定数 + `App.showCredits` / `App.closeCredits` | data.js + app.js | 小 |
| 15 | タイトル画面に「Credits」リンク追加 | index.html | 極小 |
| 16 | `build-zip.sh` に `bgm/` フォルダコピーを追加 | build-zip.sh | 極小 |
| 17 | 後方互換: ロード時に `endingCleared` 未定義なら `false` を補完 | app.js | 極小 |

推定合計: **Claude Codeで1セッション**

---

## 6. 設計メモ

- クリア演出は `showAwardsCeremony` のコードパターンを踏襲。同じ `awardsOverlay` / `awardsBox` を再利用（HTMLオーバーレイ新設不要）
- FileBGMは既存のWeb Audio APIチップチューンBGMと完全に独立。`BGM.stop()` で合成音を止めてから `FileBGM.play()` する
- ファイルBGMの音量は `_bgmVol * 8` でスケーリング（合成音の _bgmVol は 0.04 程度なので、0.32 ≒ 程度の再生音量になる）。実際の音楽ファイルの音量次第で調整が必要
- 破産はオフシーズン中も発生しうる（給料は払い続けるため）。意図通り
- `weekPhase: 'gameover'` は既存の `'manage'` / `'show'` / `'settled'` / `'draft'` と並ぶ新フェーズ
- クレジットの `CREDITS.music` 配列は、楽曲が増えた時に追加するだけで済む拡張性のある設計
- クレジットモーダルの楽曲情報（曲名・アーティスト名・URL等）は、ユーザーがフリー音楽を配置した後に具体的な値を埋める
