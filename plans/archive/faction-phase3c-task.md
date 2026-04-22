# Phase 3c 指示書 — 相関図「派閥」ビューモード

> **作成日**: 2026-04-22
> **前提**: `plans/faction-phase3cd-handoff.md` を読了済み
> **ブランチ**: `feature/faction-system`
> **参照 spec**: `specs/faction-system-spec-v0.1.md` §7.4 / §17
> **主な編集ファイル**: `src/ui-render.js`（ほぼ単独）, `docs/ui/01-foundations.md`（トークン追記が出たら）, `specs/faction-system-spec-v0.1.md` §17（完了時）

---

## 0. ゴール

相関図タブに**第 4 ビューモード「🎭 派閥」**を追加し、派閥の地理的構造を嘘なく可視化する。Phase 2 で一度ボツにした「非メンバーを巻き込む巨大円」問題を、**派閥重力項で先にメンバーを集約してから円を描く**ことで解決する。

完了条件:

- 🌐 ネットワーク / 🎯 フォーカス / 🗺️ 勢力図 / **🎭 派閥** の 4 モード切替が動作
- 派閥モードで各派閥メンバーが派閥中心へ集約し、**外接に近い円**＋派閥名ラベル＋👑リーダー/⭐幹部マーカーが地理的に正しく描画される
- 抗争中派閥間（`_isHostile(f)` が両方 true）に**オレンジ破線**が 1 本（数値ラベルなし）
- 既存 3 モードは完全非破壊（退避フラグで別枝を書く）
- auto-sim は UI のみ変更なので不要（ただし `node test/auto-sim.js 50` を 1 回流して不変条件違反が無いことだけ確認）

---

## 1. 実装方針

### 1.1 状態

```js
// ui-render.js 先頭の let _relmapViewMode に 'faction' を追加
let _relmapViewMode = 'network'; // 'network' | 'focus' | 'power' | 'faction'

// 新規
let _relmapFactionCenters = {}; // { factionId: {x, y} } — 派閥中心の理想位置
```

### 1.2 ビューモード切替ボタン

`_renderDbRelmap()` の `.rm-view-toggle` に 4 番目のボタンを追加:

```js
html += `<button class="rm-vt-btn${_relmapViewMode==='faction'?' active':''}" onclick="_relmapSetViewMode('faction')">🎭 派閥</button>`;
```

派閥が 0 件のとき（`G.factions.length === 0`）はボタンを `disabled` にして `title="派閥が結成されていません"` を付ける。

### 1.3 `_relmapSetViewMode('faction')` ハンドラ

- `_relmapOrgFilter = null` / ズーム・パンリセット
- `_relmapFactionCenters` を再計算（後述 1.4）
- 全ノード `n._hidden = false`
- `_relmapDrawOrgZones` は**呼ばない**（団体ゾーンが派閥円と重なって見づらいため）。`zoneLayer.innerHTML = ''` で空に
- `_relmapReheat()` で物理シムを温め直す（alpha=0.8）
- ボタン active 切替の `btnIdx` 計算に `mode === 'faction' ? 4` を追加

### 1.4 派閥中心点の配置

画面サイズ `W, H` に対し、派閥数 N で分割:

| N | 配置 |
|---|------|
| 1 | 中央 `(W/2, H/2)` |
| 2 | 左右 `(W*0.3, H/2)` / `(W*0.7, H/2)` |
| 3 | 三角配置（上1・下2）、半径 `min(W,H)*0.28` |
| 4+ | 円周等分（`-π/2` 起点の時計回り）、半径 `min(W,H)*0.32` |

実装メモ: 抗争ペアを近くに置きたくなるが、**Phase 3c では等分配置でよい**。抗争ペア寄せは 3d 以降で検討。

### 1.5 `_relmapTick` に派閥モード分岐を追加

既存の `if (_relmapViewMode === 'network' || _relmapOrgFilter) { ... } else { ... }` の**前に** `else if (_relmapViewMode === 'faction') { ... }` を挿入する形ではなく、**最上位に新しい分岐**を足す。触ってはいけない領域（handoff 参照）を守るため。

派閥モードの物理:

```js
if (_relmapViewMode === 'faction') {
  nodes.forEach((n, i) => {
    if (n._hidden) return;
    const fc = _relmapFactionCenters[_getFighterFactionId(n.id)];
    if (fc) {
      // 派閥メンバー: 中央より強めの重力 0.015
      vel[i].vx += (fc.x - n.x) * 0.015 * a;
      vel[i].vy += (fc.y - n.y) * 0.015 * a;
    } else {
      // 非メンバー: 弱い中央引力 0.004（画面から消えない程度）
      vel[i].vx += (W/2 - n.x) * 0.004 * a;
      vel[i].vy += (H/2 - n.y) * 0.004 * a;
    }
  });
  // リンク引力は network と同じパラメータを流用
  // Repulsion も network と同じ
}
```

`_getFighterFactionId(fighterId)` は `G.factions.find(f => f.memberIds.includes(id))?.id || null` の小ヘルパを `src/factions.js` 側に `Engine.factions.getFactionIdOf(state, fighterId)` として用意する（既存あれば流用）。

### 1.6 `_relmapDrawFactionLayer()` を本実装

現在 no-op。中身を派閥モード時のみ描画するよう書き換え:

```js
function _relmapDrawFactionLayer() {
  const layer = document.getElementById('relmapFactionLayer');
  if (!layer) return;
  layer.innerHTML = '';
  if (_relmapViewMode !== 'faction') return;
  if (!G.factions || G.factions.length === 0) return;

  // 1. 各派閥の外接円計算（メンバー位置から）
  // 2. 円＋ラベル描画
  // 3. 抗争破線描画（G.factionHostility を走査、両方向 _isHostile チェック）
  // 4. リーダー 👑 / 幹部 ⭐ マーカー（node 上に重ねる）
}
```

**外接円**: メンバー `memberIds.map(id => _relmapNodeMap[id])` の重心 → 重心からメンバー最遠距離 + `padding=24px` を半径に。メンバー 1 人だけなら `r = 48px` 固定。

**円スタイル**: `fill="none" stroke="var(--accent-faction-{1..4})" stroke-width="2.5" stroke-opacity="0.55"`。派閥 ID 順に 1〜4 を割当て（5 派閥目以降は mod 4 で繰り返し、spec では最大 4 派閥同時存在なので通常到達しない）。

**派閥名ラベル**: 円の上辺外側 `y = cy - r - 12` に `text-anchor="middle"` で配置。フォント `Oswald,sans-serif`、16px、`fill="var(--accent-faction-N)"`、opacity 0.85。文字は `faction.name`。

**リーダー/幹部マーカー**: `<text>` で絵文字。ノード位置 `(n.x + n.r*0.6, n.y - n.r*0.6)` に小さく重ねる。リーダー 👑 14px、幹部 ⭐ 12px（spec §7.4）。

**抗争破線**: `G.factionHostility` を走査し、`_isHostile(fA) && _isHostile(fB)` かつ A<B のペアに対し、両中心を結ぶ破線:

```js
<line x1="..." y1="..." x2="..." y2="..."
  stroke="var(--accent-faction-feud)" stroke-width="2"
  stroke-dasharray="6,4" opacity="0.7"/>
```

太さは対立度平均に応じて 1.5〜3.5px でマップ（`hostility.aToB + hostility.bToA` を 0〜200 で clamp → 1.5 + (val/200)*2`）。**数値ラベルは出さない**（spec 厳守）。

### 1.7 描画タイミング

`_relmapRender` の末尾で既に `_relmapDrawFactionLayer()` が呼ばれている（8830 行）。派閥モード時のみ描画する分岐が関数内に入ればこれだけで足りる。**毎フレーム呼び出されるが、派閥中心/円半径計算は軽い**ので問題なし。もし重ければ 4 フレームに 1 回の間引きで対応。

### 1.8 視差/ハイライトとの整合

`openFactionPanel()` からは DB タブの派閥サブタブに飛ぶ動線は既存。相関図側から派閥パネルへの遷移は Phase 3c では**追加しない**（右クリックメニュー等は Phase 4 以降）。

---

## 2. 未解決項目（Keisuke さん判断お願いします）

handoff 末尾「判断が必要な項目」への推奨案:

| 項目 | 推奨案 | 備考 |
|------|------|------|
| 画角調整 | **ばね定数を強め**（1.5節の 0.015）て画面内に収める。ズーム動的変更はしない | ビューモード切替で倍率が勝手に変わると違和感 |
| 非派閥メンバーの扱い | **中央に弱い引力**（0.004）で集める。小さく薄くしない | 画面端退避は「干されてる」感が出て良くない。中央プールが自然 |
| 抗争相手がいない loyal 派閥 | **円で囲むだけ**（破線なし）。シンプル化はしない | 一貫性優先 |
| トランジション | `_relmapReheat()` で温め直すだけ | スムーズ補間は実装コスト対効果低い |

**判断が分かれそうなポイント**:

- 「画面中央プール」と「派閥中心」の**距離感**。派閥中心半径 0.32 で 4 派閥配置したとき、中央プールと派閥円が被る可能性がある。実装後 Keisuke さんに実機確認してもらい、半径/重力を微調整
- 派閥色トークン `--accent-faction-1〜4` は Phase 2 で追加済みだが、**相関図背景との視認性**を現地確認したい。暗すぎた場合 `opacity` を 0.55 → 0.7 に上げる等

---

## 3. 実装手順

1. `_getFighterFactionId` ヘルパ（`Engine.factions.getFactionIdOf`）を `src/factions.js` に追加（既存 `Engine.factions.getFaction` があれば派生で十分）
2. `ui-render.js` 状態変数 `_relmapFactionCenters` 追加 + `_relmapViewMode` の JSDoc コメント更新
3. `.rm-view-toggle` に 🎭 派閥ボタン追加 + disabled 条件
4. `_relmapSetViewMode` に `'faction'` 分岐追加
5. `_relmapTick` 先頭に `if (_relmapViewMode === 'faction')` 分岐追加
6. `_relmapDrawFactionLayer` 本実装
7. `_relmapSetViewMode('network')` への復帰時に `_relmapFactionCenters = {}` クリア & faction layer 空化
8. 実機で Keisuke さんに派閥生成まで進めてもらい、4 モード切替を目視確認
9. `node test/auto-sim.js 50` で不変条件チェック
10. `specs/faction-system-spec-v0.1.md` §17 に v0.6 として完了記録
11. `docs/game-system-roadmap.md` 更新
12. `git commit`（push しない）

---

## 4. 触ってはいけないもの（handoff から転記）

- `_relmapTick` のネットワーク/フォーカス/勢力図 3 モード分岐（**別枝**で追加、既存枝は触らない）
- フォースシミュの既存パラメータ（ばね定数・反発力・alpha 減衰の既存値）
- `_relmapRender` の既存描画ループ（派閥レイヤーは独立 `<g id="relmapFactionLayer">` に描画）
- `_isHostile(f)` の判定ロジック
- `G.factions` / `G.factionHostility` / `G.factionEventCooldowns` のデータ形状
- F02 再設計の方針（`type === 'rivalrous'` は legacy なので**使わない**。判定は必ず `_isHostile(f)`）

---

## 5. 完了報告で Keisuke さんに確認してもらいたいこと

- 🎭 派閥ボタンが表示され、派閥 0 のとき disabled になる
- 派閥発生後、ボタンを押すとメンバーが派閥中心へ集約する
- 外接円と派閥名ラベルが派閥色で描画される
- リーダーに 👑、幹部に ⭐ が重なる
- 抗争中派閥間にオレンジ破線が出て、数値は出ていない
- 非派閥メンバーが中央にふわっと集まる（画面外に行かない）
- 🌐 ネットワークに戻すと派閥レイヤーが消え、従来と完全に同じ挙動
- `_dbSubTab=7` 派閥パネルや選手ポップアップ派閥バッジに影響が出ていない
