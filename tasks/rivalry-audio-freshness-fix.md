# 実装指示: 因縁演出強化 + 鮮度事前表示 + matchupLogマイグレーション修正

> 承認済み: 2026-03-04
> 3件の修正を一括実装する

---

## 修正1: 因縁対決・宿敵対決の専用SE新設

### 背景
現在の `war` SE（宣戦布告時）は0.35秒の短い効果音で決戦感がない。`award` SE（決着時）も0.4秒のベルで達成感に乏しい。「バララララ！」と燃え上がるような演出が必要。

### 変更対象: `src/app.js` — SFXオブジェクト内（L164-367付近）

#### (A) `rivalry_confrontation` SE 新設（宣戦布告用、`war` を置き換え）
プロレスの試合開始前ゴング＋ドラムロール風。1.5〜2秒。気分を盛り上げる。

構成イメージ:
1. **0〜0.4s**: ドラムロール連打（低域ノイズLP連打、80-100msごとに4-5発、クレッシェンド）
2. **0.4〜0.7s**: ゴング一打（低音sine 80-100Hz、長いサステイン）+ 金属系倍音（sine 800Hz + 1600Hz、短いディケイ）
3. **0.7〜1.2s**: ブラスっぽい上昇（sawtooth sweep 200→500Hz）+ crowd歓声ノイズ（HP noise フェードイン）
4. **1.2〜1.8s**: 余韻（ノイズフェードアウト + ゴング残響）

宿命の相手(`isFate`)用には音量1.2倍、持続を0.3s延長、低音をさらに太くする。

```javascript
rivalry_confrontation(isFate = false) {
  const t = ensure().currentTime;
  const vol = isFate ? 1.2 : 1.0;
  // 1. ドラムロール連打（4-5発、クレッシェンド）
  for (let i = 0; i < 5; i++) {
    const gain = (0.04 + i * 0.025) * vol;
    noiseLP(t + i * 0.08, 0.06, gain, 300);
    osc(80 + i * 5, 'sine', t + i * 0.08, 0.05, gain * 0.5);
  }
  // 2. ゴング一打（t+0.4）
  osc(90, 'sine', t + 0.4, 1.2, 0.12 * vol);     // 基音、長いサステイン
  osc(800, 'sine', t + 0.4, 0.3, 0.06 * vol);     // 倍音1
  osc(1600, 'sine', t + 0.4, 0.15, 0.03 * vol);   // 倍音2
  noiseHP(t + 0.4, 0.08, 0.06 * vol, 5000);        // 金属アタック
  // 3. ブラスっぽい上昇（t+0.7）
  oscSweep(200, 500, 'sawtooth', t + 0.7, 0.4, 0.05 * vol);
  noiseHP(t + 0.8, 0.6 + (isFate ? 0.3 : 0), 0.04 * vol, 2000); // 歓声
  // 4. 余韻の低音ドーン
  if (isFate) {
    osc(60, 'sine', t + 0.5, 1.5, 0.08);  // さらに太い低音
    oscSweep(300, 600, 'sawtooth', t + 0.8, 0.5, 0.04);
  }
}
```

> 上記はイメージ。Web Audio APIのosc/noise/oscSweep/noiseHP/noiseLPヘルパーを使って実装する。
> gain値はsfxGainを経由するので控えめでOK。実際に鳴らして調整してほしい。

#### (B) `rivalry_resolution` SE 新設（宿敵決着用、`award` を置き換え）
達成感＋歓声。1〜1.5秒。

構成:
1. **0〜0.15s**: インパクト音（低音sine 60Hz + noise burst）
2. **0.1〜0.5s**: ファンファーレ（bellPartial 3連、C5→E5→G5→C6 と1音追加）
3. **0.3〜1.0s**: crowd歓声ノイズ（HP noise、長め）
4. **0.5〜1.2s**: ハーモニクス余韻

```javascript
rivalry_resolution() {
  const t = ensure().currentTime;
  // インパクト
  osc(60, 'sine', t, 0.3, 0.1);
  noise(t, 0.06, 0.1);
  // ファンファーレ（bellPartialを使う）
  bellPartial(523, t + 0.1,  0.5, 0.12);  // C5
  bellPartial(659, t + 0.22, 0.6, 0.10);  // E5
  bellPartial(784, t + 0.36, 0.7, 0.08);  // G5
  bellPartial(1047, t + 0.5, 0.8, 0.06);  // C6（追加）
  // 歓声
  noiseHP(t + 0.3, 0.8, 0.05, 2000);
  noiseHP(t + 0.5, 0.5, 0.03, 5000);   // きらめき
}
```

#### (C) `fate_resolution` SE 新設（宿命の相手・最終決着用）
rivalry_resolution の強化版。2秒。もっと壮大に。

```javascript
fate_resolution() {
  const t = ensure().currentTime;
  // 深いインパクト
  osc(50, 'sine', t, 0.5, 0.12);
  osc(100, 'sine', t, 0.3, 0.08);
  noise(t, 0.08, 0.12);
  // 壮大ファンファーレ（5音）
  bellPartial(523, t + 0.1,  0.7, 0.14);
  bellPartial(659, t + 0.25, 0.8, 0.12);
  bellPartial(784, t + 0.4,  0.9, 0.10);
  bellPartial(1047, t + 0.55, 1.0, 0.08);
  bellPartial(1319, t + 0.7, 0.8, 0.06);  // E6
  // 大歓声（長め）
  noiseHP(t + 0.3, 1.2, 0.06, 2000);
  noiseHP(t + 0.6, 0.8, 0.04, 5000);
  // 低音の重み
  osc(65, 'sine', t + 0.5, 1.0, 0.06);
  oscSweep(200, 400, 'sawtooth', t + 0.8, 0.5, 0.03);
}
```

### 変更対象: `src/ui-common.js` — `_renderRivalryPopup()` (L1111付近)

#### (D) 宣戦布告ポップアップのSE変更 + タメ演出

L1148-1149 を変更:
```javascript
// 旧:
document.getElementById('rivalryPopupOverlay').classList.add('active');
Audio.play('war');

// 新: オーバーレイ暗転→タメ→SE+ポップアップ表示
const overlay = document.getElementById('rivalryPopupOverlay');
box.style.opacity = '0';
box.style.transform = 'scale(0.9)';
overlay.classList.add('active');
// isFate引数付きで呼ぶため、Audio.play では対応できない → 直接呼ぶ
setTimeout(() => {
  if (typeof Audio._sfxDirect === 'function') Audio._sfxDirect('rivalry_confrontation', o.isFate);
  else Audio.play('rivalry_confrontation');
  box.style.transition = 'opacity 0.3s, transform 0.3s';
  box.style.opacity = '1';
  box.style.transform = 'scale(1)';
}, 350);
```

**重要**: `rivalry_confrontation` は `isFate` 引数を取るため、`Audio.play(name)` では渡せない。
以下のいずれかの方法で対応:
- (推奨) SFXオブジェクトに `rivalry_confrontation` を定義し、`Audio.play` の仕組みを拡張して引数を渡せるようにする:
  ```javascript
  // Audio.play を修正
  play(name, ...args) { if (!_muted && SFX[name]) { try { ensure(); SFX[name](...args); } catch(e) {} } },
  ```
- または `rivalry_confrontation` と `fate_confrontation` を別SEとして定義する（こちらのほうがシンプル）

**別SE方式を推奨**:
- `rivalry_confrontation` → 通常の宿敵宣戦布告
- `fate_confrontation` → 宿命の相手の宣戦布告（より太く長い）
- `rivalry_resolution` → 宿敵決着
- `fate_resolution` → 宿命の相手の最終決着

#### (E) 決着ポップアップのSE変更

L1188-1189 を変更:
```javascript
// 旧:
document.getElementById('rivalryPopupOverlay').classList.add('active');
Audio.play('award');

// 新:
const overlay = document.getElementById('rivalryPopupOverlay');
box.style.opacity = '0';
box.style.transform = 'scale(0.9)';
overlay.classList.add('active');
setTimeout(() => {
  Audio.play(o.isFate ? 'fate_resolution' : 'rivalry_resolution');
  box.style.transition = 'opacity 0.3s, transform 0.3s';
  box.style.opacity = '1';
  box.style.transform = 'scale(1)';
}, 300);
```

---

## 修正2: カード編成時に鮮度タグ事前表示

### 背景
マンネリのMQペナルティは試合結果を見るまでわからない。事前にカード編成画面でわかるようにする。

### 変更対象: `src/ui-render.js` — `renderShowPrep()` (L1527付近)

L1527の直後、rivalLvl取得の後に鮮度計算を追加:

```javascript
const rivalLvl = (curL > 0 && curR > 0) ? getRivalryLevel(curL, curR) : null;

// ★追加: カード鮮度プレビュー
const freshnessPreview = (curL > 0 && curR > 0)
  ? Engine.freshness.calc(G.matchupLog || [], curL, curR, G.totalShows || 0)
  : null;
```

L1555（rivalLvlタグ表示）の直後に鮮度タグを追加:

```javascript
${rivalLvl ? `<span style="color:${rivalLvl.color}">${rivalLvl.emoji}${rivalLvl.label}(MQ+${rivalLvl.mqBonus})</span>` : ''}
${freshnessPreview && freshnessPreview.label ? `<span style="color:${freshnessPreview.bonus > 0 ? '#74b9ff' : '#e17055'};font-size:11px">${freshnessPreview.bonus > 0 ? '✨' : '😐'} ${freshnessPreview.label}(MQ${freshnessPreview.bonus > 0 ? '+' : ''}${freshnessPreview.bonus})</span>` : ''}
${isLastRunMatch ? ...
```

これだけでOK。Engine.freshness.calcはpure functionなのでUI側から安全に呼べる。

---

## 修正3: matchupLogマイグレーション修正（初顔合わせ誤判定）

### 背景
v2.0マイグレーション（app.js L1523-1530）で `matchupLog: G.matchupLog || []` と空配列で初期化している。
このため、v2.0より前に何十回も戦った既存ペアまで全員「初顔合わせ」扱いになっている。

### 変更対象: `src/app.js` — マイグレーションブロック (L1523-1530)

```javascript
// 旧:
if (!G._migrated_rivalry_v2) {
  const migratedRivalries = {};
  Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
    migratedRivalries[key] = { ...rv, resolutionCount: rv.resolutionCount || 0 };
  });
  G = { ...G, rivalries: migratedRivalries, matchupLog: G.matchupLog || [], _migrated_rivalry_v2: true };
}

// 新:
if (!G._migrated_rivalry_v2) {
  const migratedRivalries = {};
  Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
    migratedRivalries[key] = { ...rv, resolutionCount: rv.resolutionCount || 0 };
  });
  // matchupLog補完: rivalriesから対戦履歴を復元し、初顔合わせ誤判定を防ぐ
  let migratedLog = G.matchupLog || [];
  if (migratedLog.length === 0) {
    const currentShow = G.totalShows || 0;
    Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
      const ids = key.split('-').map(Number);
      if (ids.length !== 2 || !ids[0] || !ids[1]) return;
      const matches = rv.matches || 0;
      // ダミーエントリを直近に均等配置（鮮度ウィンドウ内に反映させるため）
      for (let j = 0; j < matches; j++) {
        migratedLog.push({
          leftId: ids[0], rightId: ids[1],
          showCount: Math.max(1, currentShow - matches + j + 1)
        });
      }
    });
  }
  G = { ...G, rivalries: migratedRivalries, matchupLog: migratedLog, _migrated_rivalry_v2: true };
}
```

**ポイント**:
- `rivalries` のキーフォーマットは `"id1-id2"` (小さいID-大きいID、ハイフン区切り。Engine.title.getRivalryKey参照)
- matchesの回数分だけダミーの対戦記録を追加
- showCountは直近に配置することで、鮮度ウィンドウ（12興行）内に正しく反映される
- 既にmatchupLogにデータがある場合（新規ゲーム等）は何もしない

### 注意: 再マイグレーション対応

`_migrated_rivalry_v2` が既にtrueのセーブデータにはこの修正が適用されない。
新しいフラグ `_migrated_matchuplog_v2` を追加して、既存の空matchupLogも修正する:

```javascript
// ↑ の既存マイグレーションブロックの直後に追加
if (!G._migrated_matchuplog_v2) {
  if ((G.matchupLog || []).length === 0 && Object.keys(G.rivalries || {}).length > 0) {
    const currentShow = G.totalShows || 0;
    const backfillLog = [];
    Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
      const ids = key.split('-').map(Number);
      if (ids.length !== 2 || !ids[0] || !ids[1]) return;
      const matches = rv.matches || 0;
      for (let j = 0; j < matches; j++) {
        backfillLog.push({
          leftId: ids[0], rightId: ids[1],
          showCount: Math.max(1, currentShow - matches + j + 1)
        });
      }
    });
    if (backfillLog.length > 0) {
      G = { ...G, matchupLog: backfillLog };
    }
  }
  G = { ...G, _migrated_matchuplog_v2: true };
}
```

---

## テスト確認事項

1. **SE**: 宣戦布告ポップアップで新SEが鳴り、0.35秒のタメ後にポップアップが表示されること
2. **SE**: 決着ポップアップで新SEが鳴ること。宿命の相手版はより壮大に聞こえること
3. **鮮度プレビュー**: カード編成でペアを選ぶと、因縁タグの隣に「✨初顔合わせ(MQ+2)」や「😐マンネリ(MQ-3)」が表示されること
4. **マイグレーション**: 既存セーブをロードして、過去に対戦実績のある選手同士が「初顔合わせ」にならないこと
5. **マイグレーション**: 本当に初めて対戦する選手（レンタル含む）には「初顔合わせ」が正しく出ること

---

## ロードマップ更新

完了後、`docs/game-system-roadmap.md` の「現在の状態」に以下を追記:

**因縁演出強化 + カード鮮度UI（2026-03-04）。** 宣戦布告・決着ポップアップの専用SE新設（4種: rivalry_confrontation / fate_confrontation / rivalry_resolution / fate_resolution）。ポップアップ表示にタメ演出追加。カード編成画面に鮮度プレビュータグ表示（初顔合わせ/マンネリを事前確認可能）。matchupLogマイグレーション修正（既存対戦ペアの初顔合わせ誤判定を解消）。
