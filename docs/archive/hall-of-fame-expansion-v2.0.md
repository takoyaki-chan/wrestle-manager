# 殿堂入りシステム拡張 設計仕様書 v2.0

> 作成日: 2026-03-21
> 前提: 殿堂ポイント制（v1.4w d43491b）実装済み

---

## 1. 概要

### 1.1 目的

全団体の殿堂入りを統合管理し、レガシーポイントを実績連動にすることで、
「業界の歴史」をプレイヤーが俯瞰・回顧できるシステムに拡張する。

### 1.2 変更の3本柱

| # | 内容 | 要約 |
|---|------|------|
| A | NPC団体の殿堂入り | AI引退選手にもHOF判定を適用、各団体に蓄積 |
| B | レガシーポイント動的化 | S/A/B固定値を廃止、全団体 `HOF人数 × 10`（上限50）に統一 |
| C | 殿堂入り閲覧画面リッチ化 | DB殿堂タブを全団体統合＋リッチな「思い出」画面に刷新 |

---

## 2. データ構造の変更

### 2.1 allHallOfFame（新設）

```js
state.allHallOfFame = {
  player: [ /* 既存 state.hallOfFame の中身を移行 */ ],
  org_s:  [],
  org_a:  [],
  org_b:  [],
};
```

各エントリの構造（プレイヤー/NPC共通）:

```js
{
  id: 'char_042',
  name: '高島さや',
  portrait: 'face_042',
  orgId: 'org_s',               // 所属団体ID（NEW）
  orgName: 'WSW',               // 所属団体名
  style: 'Grappler',
  activeSeasonsStart: 1,        // デビューシーズン
  activeSeasonsEnd: 12,         // 引退シーズン
  activeYears: 'S1〜S12',
  titleReigns: 3,               // 王座獲得回数
  totalDefenses: 11,            // 通算防衛回数
  juniorTournamentWins: 1,      // JT優勝回数
  ppvMainEventWins: 2,          // PPV GRAND FINAL優勝回数
  peakOVR: 88,
  peakOVRSeason: 8,
  hofPoints: 23,
  hofLevel: 2,                  // 1=殿堂 / 2=ゴールド / 3=レジェンド
  inductionSeason: 13,          // 殿堂入りしたシーズン

  // ★ NEW: リッチ表示用の追加データ
  careerHighlights: [           // 重賞リスト風の固有名詞実績一覧
    { type: 'titleWin', season: 5, text: 'WSW世界王座 獲得' },
    { type: 'titleDefense', season: 6, text: 'WSW世界王座 5度防衛' },
    { type: 'titleLoss', season: 7, text: 'WSW世界王座 陥落（5度防衛の末に）' },
    { type: 'titleWin', season: 9, text: 'WSW世界王座 2度目の戴冠' },
    { type: 'titleWin', season: 11, text: 'WSW世界王座 3度目の戴冠' },
    { type: 'juniorTournament', season: 4, text: 'ジュニアトーナメント 優勝' },
    { type: 'ppvMainEvent', season: 10, text: 'PPV GRAND FINAL 優勝' },
    { type: 'ppvMainEvent', season: 12, text: 'PPV GRAND FINAL 優勝' },
  ],
  retireOVR: 72,                // 引退時OVR（NEW）
  retireAge: 35,                // 引退時年齢（NEW）
}
```

### 2.2 既存フィールドの扱い

| フィールド | 処理 |
|-----------|------|
| `state.hallOfFame` | マイグレーション時に `allHallOfFame.player` へ移行。以後は `allHallOfFame.player` を参照 |
| `state.hallOfFame` 自体 | 後方互換のためエイリアスとして残す（getter で `allHallOfFame.player` を返す） |

### 2.3 マイグレーション

```js
// 既存セーブデータの変換
if (G.hallOfFame && !G.allHallOfFame) {
  G.allHallOfFame = {
    player: G.hallOfFame.map(h => ({
      ...h,
      orgId: 'player',
      orgName: h.orgName || G.orgName || 'あなたの団体',
      careerHighlights: _buildHighlightsFromExisting(h),
      retireOVR: h.retireOVR || 0,
      retireAge: h.retireAge || 0,
    })),
    org_s: [], org_a: [], org_b: [],
  };
}
```

---

## 3. NPC団体の殿堂入り処理

### 3.1 処理タイミング

`Engine.rival.processSeasonEnd()` 内、引退判定の直後。

### 3.2 処理フロー

```
aiRetirees取得（既存処理）
  ↓
各引退者に対して:
  ① careerRecord から hofPoints を計算（Engine.awards.calcHofPoints）
  ② 12pt以上 → 殿堂入り候補
  ③ careerRecord.history から careerHighlights を構築
  ④ allHallOfFame[orgId] に追加
  ↓
年末表彰式に NPC殿堂入り情報を pendingAwards に含める
```

### 3.3 careerHighlights の構築

careerRecord.history の各イベントを、人が読んで「すごい」と思える固有名詞テキストに変換する。

```js
function buildCareerHighlights(careerRecord, orgName) {
  const history = careerRecord.history || [];
  const highlights = [];

  history.forEach(ev => {
    switch (ev.type) {
      case 'titleWin':
        highlights.push({
          type: 'titleWin', season: ev.season,
          text: `${ev.orgName || orgName}王座 ${_countReign(history, ev)}度目の戴冠`
        });
        break;
      case 'titleDefense':
        if (ev.count >= 3) {
          highlights.push({
            type: 'titleDefense', season: ev.season,
            text: `${ev.orgName || orgName}王座 ${ev.count}度防衛`
          });
        }
        break;
      case 'titleLoss':
        highlights.push({
          type: 'titleLoss', season: ev.season,
          text: `${ev.orgName || orgName}王座 陥落（${ev.defenses || 0}度防衛の末に）`
        });
        break;
      case 'juniorTournament':
        if (ev.result === 'champion') {
          highlights.push({
            type: 'juniorTournament', season: ev.season,
            text: 'ジュニアトーナメント 優勝'
          });
        }
        break;
      case 'ppvMainEvent':
        if (ev.result === 'champion' || ev.result === 'win') {
          highlights.push({
            type: 'ppvMainEvent', season: ev.season,
            text: 'PPV GRAND FINAL 優勝'
          });
        }
        break;
    }
  });

  // 時系列ソート
  highlights.sort((a, b) => a.season - b.season);
  return highlights;
}
```

### 3.4 NPC殿堂入り者のデータ構築

```js
function buildNpcHofEntry(fighter, orgId, orgName, state) {
  const rec = fighter.careerRecord || {};
  const history = rec.history || [];
  const debut = history.find(e => e.type === 'debut');
  const hofPoints = Engine.awards.calcHofPoints(rec);
  const hofLevel = Engine.awards.getHofLevel(hofPoints);

  return {
    id: fighter.id,
    name: fighter.name,
    portrait: fighter.portrait,
    orgId: orgId,
    orgName: orgName,
    style: fighter.style || 'Allround',
    activeSeasonsStart: debut ? debut.season : 1,
    activeSeasonsEnd: state.season,
    activeYears: `S${debut ? debut.season : 1}〜S${state.season}`,
    titleReigns: rec.totalTitleWins || 0,
    totalDefenses: rec.totalDefenses || 0,
    juniorTournamentWins: rec.juniorTournamentWins || 0,
    ppvMainEventWins: rec.ppvMainEventWins || 0,
    peakOVR: rec.peakOVR || 0,
    peakOVRSeason: rec.peakOVRSeason || 0,
    hofPoints, hofLevel,
    inductionSeason: state.season + 1, // 次シーズン初頭の表彰式で発表
    careerHighlights: buildCareerHighlights(rec, orgName),
    retireOVR: Engine.util.ov(fighter),
    retireAge: fighter.age || 0,
  };
}
```

### 3.5 processSeasonEnd への組み込み

```js
// Engine.rival.processSeasonEnd 内、既存の引退処理後に追加:

// 殿堂入り判定（NEW）
const npcInductees = [];
aiRetirees.forEach(f => {
  const rec = f.careerRecord;
  if (!rec) return;
  const pts = Engine.awards.calcHofPoints(rec);
  if (pts >= 12) {
    npcInductees.push(buildNpcHofEntry(f, org.id, org.name, state));
  }
});
if (npcInductees.length > 0) {
  events.push(`🏛️ ${org.name}: ${npcInductees.map(h => h.name).join('、')} が殿堂入り`);
}
// → 呼び出し元で allHallOfFame[org.id] に追加
```

戻り値に `npcInductees` を含める:
```js
newAiOrgs[org.id] = { ...aiData, roster, ..., _npcInductees: npcInductees };
```

`advanceWeek` のシーズン末処理で回収:
```js
const aiResult = Engine.rival.processSeasonEnd(rng, s);
// NPC殿堂入り回収
const allHof = { ...(s.allHallOfFame || { player: [], org_s: [], org_a: [], org_b: [] }) };
RIVAL_ORGS.forEach(org => {
  const inductees = aiResult.aiOrgs[org.id]?._npcInductees || [];
  if (inductees.length > 0) {
    allHof[org.id] = [...(allHof[org.id] || []), ...inductees];
  }
  // _npcInductees は一時フィールドなので削除
  if (aiResult.aiOrgs[org.id]) delete aiResult.aiOrgs[org.id]._npcInductees;
});
s = { ...s, allHallOfFame: allHof, aiOrgs: aiResult.aiOrgs };
```

---

## 4. レガシーポイントの動的化

### 4.1 変更内容

```js
// 変更前（engine.js calcLegacyScore）
calcLegacyScore(state, orgId) {
  if (orgId === 'player') {
    return Math.min(50, (state.hallOfFame || []).length * 10);
  }
  // AI: 固定値
  return { S: 50, A: 30, B: 15 }[org.tier] || 0;
}

// 変更後
calcLegacyScore(state, orgId) {
  const allHof = state.allHallOfFame || {};
  const hofList = orgId === 'player'
    ? (allHof.player || state.hallOfFame || [])
    : (allHof[orgId] || []);
  const per = RANKING_CONFIG.hallOfFameLegacyPerInductee || 10;
  const cap = 50; // 全団体共通上限
  return Math.min(cap, hofList.length * per);
}
```

### 4.2 RANKING_CONFIG の変更

```js
const RANKING_CONFIG = {
  // ...既存...
  legacyCapByTier: { S: 50, A: 50, B: 50, player: 50 }, // ← 全団体共通50に変更
  hallOfFameLegacyPerInductee: 10,
};
```

実質的に `legacyCapByTier` は全部50なので、tier区別は不要になるが、
後方互換のためフィールドは残す。

### 4.3 ゲームバランスへの影響

| 団体 | 変更前 Legacy | 変更後 Legacy（序盤） | 変更後 Legacy（20年後想定） |
|------|:-----------:|:------------------:|:------------------------:|
| S級  | 固定50      | 0（HOF者なし）      | 30〜50（3〜5名蓄積）      |
| A級  | 固定30      | 0                   | 10〜30（1〜3名）           |
| B級  | 固定15      | 0                   | 0〜10（0〜1名）            |
| Player | HOF×10    | HOF×10（変更なし）  | HOF×10（変更なし）          |

序盤はS級のレガシー優位が消えるが、S級はbaseScore（ロスター実力）で
十分優位なので順位変動への影響は限定的。
長期プレイでは歴史の蓄積がランキングに反映され、
A級がS級に肉薄する展開が稀に生まれる。

---

## 5. 年末表彰式でのNPC殿堂入り表示

### 5.1 基本方針

**NPC・プレイヤー団体の殿堂入りは完全に同等の扱い。手を抜かない。**

将来的に年末表彰式を大幅パワーアップさせる際に、NPC殿堂入り者にも
プレイヤー団体と同じ個別スライド演出（盾＋キャリアハイライト年表）を実装する。

### 5.2 今回スコープ（暫定）

年末表彰式の大幅パワーアップは将来の別タスク。
今回は最低限として:

- サマリー画面にNPC殿堂入り者の名前＋団体名＋ランクを含める
- 新聞（ティッカー）でNPC殿堂入りを報じる

```
🏛️ 殿堂入り    高島さや（あなたの団体）★★ ゴールド
               田中みさき（WSW）★ 殿堂入り
```

### 5.3 新聞（ティッカー）への反映

NPC殿堂入りを翌シーズン初週の新聞でも報じる:
```
🏛️ WSWの田中みさき（38歳）が殿堂入り — 通算5度戴冠・12度防衛の伝説的キャリア
```

### 5.4 将来タスク: 表彰式パワーアップ時のNPC殿堂スライド

表彰式パワーアップ時には、NPC殿堂入り者にもプレイヤーと同じ
個別スライド（盾画像＋顔＋キャリアハイライト年表＋ファンファーレ）を表示する。
データ構造は今回の実装で完備されるため、UI追加のみで対応可能。

---

## 6. データベース殿堂タブのリッチ化

### 6.1 デザインコンセプト

**「思い出の展示室」** — 盾が並ぶ一覧から、クリックで詳細に入る2層構造。
NPC・プレイヤー団体の区別なく完全に同等の扱い。
ウイニングポストの重賞リスト的に固有名詞の実績が並び、
選手の現役時代に思いを馳せることができる、情報量が豊かで特別感のある画面。

### 6.2 画面上部: 団体フィルタ

```
[ 全団体(12名) ] [ あなたの団体(3名) ] [ WSW(4名) ] [ ACE(3名) ] [ NEO(2名) ]
```

タブ型切り替え。各タブに人数バッジ。0名の団体も表示（空の状態テキストで対応）。

### 6.3 盾画像アセット

ユーザーが3種類の盾画像を用意:

| ランク | ファイル名 | 用途 |
|--------|-----------|------|
| ★ 殿堂入り | `shield_silver.webp` | hofLevel 1 |
| ★★ ゴールド | `shield_gold.webp` | hofLevel 2 |
| ★★★ レジェンド | `shield_legend.webp` | hofLevel 3 |

1種類ずつ。一覧ではCSS `width:80px` 程度、詳細ポップアップでは `width:120px` 程度に拡縮。
配置先: `img/shield/` ディレクトリ。

### 6.4 一覧画面（Layer 1: 盾グリッド）

2列グリッド。各カードは盾アイコン＋基本情報のコンパクトな構成。
カード全体がクリッカブルで、クリックすると詳細ポップアップ（Layer 2）が開く。

```
┌──────────────────┐  ┌──────────────────┐
│   [盾アイコン]     │  │   [盾アイコン]     │
│    80×auto        │  │    80×auto        │
│                   │  │                   │
│  ★★ ゴールド殿堂  │  │  ★ 殿堂入り       │
│ ────────────────  │  │ ────────────────  │
│ [顔36px] 高島さや  │  │ [顔36px] 鈴木れいか│
│ WSW / Grappler    │  │ ACE / Striker     │
│ S1〜S12           │  │ S3〜S15           │
│ 王座3回 / 防衛11回 │  │ 王座1回 / 防衛8回  │
│ 殿堂pt: 23        │  │ 殿堂pt: 16        │
└──────────────────┘  └──────────────────┘
```

カードのビジュアル仕様:

| 要素 | 仕様 |
|------|------|
| カード外枠 | hofLevel で色を変える: ★=silver(#bdc3c7), ★★=gold(#d4a843), ★★★=金グロー |
| 盾アイコン | 中央配置、80px幅。ランク別の3種から自動選択 |
| 顔画像 | 36px 丸型（既存portrait方式） |
| 情報 | 名前・団体・スタイル・活動期間・主要実績・殿堂pt |
| ホバー | 軽いリフト＋枠色が明るくなる（クリッカブル感を出す） |

### 6.5 詳細ポップアップ（Layer 2: 選手殿堂詳細）

カードクリックで開くモーダル。情報をバキッと詰め込む。
NPC・プレイヤー完全に同じレイアウト。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  [×閉じる]                                            ┃
┃                                                       ┃
┃     [盾画像 120px]                                     ┃
┃     ★★ ゴールド殿堂                                    ┃
┃                                                       ┃
┃  ┌─────────────────────────────────────────────┐      ┃
┃  │  [顔画像 80px]     高島さや                   │      ┃
┃  │                   WSW / Grappler             │      ┃
┃  │                   S1〜S12（35歳引退）         │      ┃
┃  │                   最高OVR 88（S8）            │      ┃
┃  │                   引退時OVR 72               │      ┃
┃  │                                              │      ┃
┃  │  [全身画像 小]  ← upper画像がある場合のみ表示   │      ┃
┃  └─────────────────────────────────────────────┘      ┃
┃                                                       ┃
┃  ━━ キャリアハイライト ━━━━━━━━━━━━━━━━━━━━━━━━      ┃
┃                                                       ┃
┃  S4   🏟️ ジュニアトーナメント 優勝                     ┃
┃  S5   👑 WSW世界王座 初戴冠                             ┃
┃  S6   🛡️ WSW世界王座 5度防衛                            ┃
┃  S7   💔 WSW世界王座 陥落（5度防衛の末に）               ┃
┃  S9   👑 WSW世界王座 2度目の戴冠                        ┃
┃  S10  🏆 PPV GRAND FINAL 優勝                          ┃
┃  S11  👑 WSW世界王座 3度目の戴冠                        ┃
┃  S12  🏆 PPV GRAND FINAL 優勝                          ┃
┃                                                       ┃
┃  ━━ 通算実績 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      ┃
┃                                                       ┃
┃  王座獲得 3回 │ 通算防衛 11回                            ┃
┃  JT優勝  1回 │ PPV優勝   2回                            ┃
┃                                                       ┃
┃  殿堂pt: 23  │  殿堂入り: S13                           ┃
┃                                                       ┃
┃          [ 閉じる ]                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

詳細ポップアップのビジュアル仕様:

| 要素 | 仕様 |
|------|------|
| 背景 | ゲーム共通のダーク背景 + hofLevelに応じた微細な装飾 |
| 盾画像 | 上部中央に120px幅で配置 |
| 顔画像 | 80×80 丸型。hofLevel に応じた枠色（silver/gold/animated-gold） |
| 全身画像 | `upper/upper_*.webp` がある場合のみ表示。高さ150px程度。ない場合は非表示（レイアウト崩れなし） |
| キャリアハイライト | 時系列の縦リスト。左にシーズン番号（dim色）、右にアイコン＋テキスト |
| ハイライトアイコン | 👑王座獲得 / 🛡️防衛マイルストーン / 💔陥落 / 🏟️JT / 🏆PPV |
| 通算実績 | 2×2グリッドで数字を配置 |
| レジェンド特別演出 | ★★★の場合: 盾画像の周囲に微細なゴールドグロー、カードヘッダーに特別な背景グラデーション |

### 6.6 ソート

デフォルト: 殿堂入りシーズン降順（最新の殿堂入りが上）
切り替え可能: hofPoints降順 / 団体別 / 名前順

### 6.7 空状態テキスト

```
🏅 まだ殿堂入りした選手はいません

殿堂ポイント12pt以上の選手が引退時に殿堂入りします。
┌─────────────────────────────┐
│ タイトル獲得     = 各1pt    │
│ タイトル防衛     = 各1pt    │
│ ジュニア優勝     = 7pt      │
│ PPV GRAND FINAL  = 9pt      │
│                             │
│ 12pt = ★ 殿堂入り           │
│ 18pt = ★★ ゴールド殿堂      │
│ 25pt = ★★★ レジェンド        │
└─────────────────────────────┘
```

---

## 7. 既存表彰式スライドへの careerHighlights 追加

### 7.1 全団体の殿堂入りスライド（NPC・プレイヤー同等）

現在の `_buildHallOfFame` に careerHighlights の年表表示を追加。
NPC団体の殿堂入りも全く同じスライド演出で表示する。

```
変更前:
  現役期間: S1〜S12
  🏆 王座獲得 3回 | 🛡️ 通算防衛 11回
  🏟️ ジュニアトーナメント優勝 1回
  📈 最高OVR 88（S8） | 殿堂pt: 23

変更後:
  [盾画像]  ★★ ゴールド殿堂

  [顔画像] 高島さや
  WSW / Grappler
  S1〜S12（35歳引退） / 最高OVR 88（S8）

  ── キャリアハイライト ──
  S4  🏟️ ジュニアトーナメント 優勝
  S5  👑 WSW世界王座 初戴冠
  S6  🛡️ WSW世界王座 5度防衛
  S7  💔 WSW世界王座 陥落
  S9  👑 WSW世界王座 2度目の戴冠
  S10 🏆 PPV GRAND FINAL 優勝
  S11 👑 WSW世界王座 3度目の戴冠
  S12 🏆 PPV GRAND FINAL 優勝

  王座3回獲得 / 通算11防衛 / JT優勝1回 / PPV優勝2回
  ★★ ゴールド殿堂（23pt）
```

固有名詞が並ぶことで、数字の羅列ではなく「物語」が見える。

### 7.2 NPC殿堂入りの表彰式での扱い（今回スコープ）

年末表彰式の大幅パワーアップは将来タスクだが、
最低限のNPC殿堂表示としてサマリー画面にNPC殿堂入り者の名前を含める:

```
🏛️ 殿堂入り    高島さや（あなたの団体）
               田中みさき（WSW）★★ ゴールド
```

将来の表彰式パワーアップ時に、NPC殿堂入りにも個別スライドを追加予定。

---

## 8. 実装の段階

### Phase 1: データ基盤
1. `allHallOfFame` データ構造の新設＋マイグレーション
2. `buildCareerHighlights` 関数の実装
3. 既存プレイヤー殿堂入り処理を `allHallOfFame.player` に切り替え
4. HOFエントリに `careerHighlights`, `retireOVR`, `retireAge`, `orgId` を追加

### Phase 2: NPC殿堂入り
5. `Engine.rival.processSeasonEnd` にHOF判定追加
6. `advanceWeek` のシーズン末処理でNPC HOF回収→ `allHallOfFame[orgId]` 蓄積
7. 年末表彰式サマリーにNPC殿堂入り表示
8. 新聞にNPC殿堂入りニュース追加

### Phase 3: レガシーポイント動的化
9. `calcLegacyScore` を動的計算に変更
10. `RANKING_CONFIG.legacyCapByTier` 更新（全団体50）
11. ランキング画面のツールチップテキスト更新

### Phase 4: DB殿堂タブリッチ化
12. 盾画像アセット配置（`img/shield/` に silver/gold/legend の3種）
13. `_renderDbHallOfFame` を全団体統合の盾グリッド（2列）に書き換え
14. 団体フィルタの実装
15. 殿堂詳細ポップアップの実装（顔＋全身画像＋キャリアハイライト年表＋通算実績）
16. 殿堂ランク別のカード＆ポップアップスタイル（silver/gold/legend）
17. ソート切り替え

### Phase 5: 表彰式スライドへの反映
18. `_buildHallOfFame` に盾画像＋careerHighlights年表追加
19. `checkHallOfFame` がプレイヤー団体用に `careerHighlights` を生成するよう修正

---

## 9. 自動テスト検証ポイント

- 100シーズンsim（10 seeds × 10 seasons）で:
  - NPC団体にHOF者が蓄積されること
  - allHallOfFame の各団体に合計0〜5名程度入ること（極端に多い/少ないならバランス調整）
  - レガシーポイントが動的に変動すること
  - S級のランキング順位がレガシー喪失で極端に下落しないこと
  - A級がS級に並ぶケースが稀に発生すること（20年以上プレイ時）
