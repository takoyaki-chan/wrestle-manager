# 引き抜きシステム trust 連動 & 予兆可視化 spec v1.0

**ブランチ候補**: `feature/poach-trust-linkage`
**対象ファイル**: `src/management.js`, `src/data.js`
**前提**: 既存の C-2 移籍ウィンドウ（`Engine.transfer.processTransferWindow`）、trust システム（v2.0 Phase1-7）、lockerRoomMorale、§2 観察眼コーチ報告

---

## 1. 背景と問題

### 1.1 現状の実装（調査結果）

引き抜きは実装上2経路ある：

| 経路 | トリガ | 現状の判定条件 | プレイヤーの体感 |
|---|---|---|---|
| **C-2 移籍ウィンドウ** | 12/24/36/48週末 | `popularity>=50` かつ上位団体存在 + 6%ロール + 忠誠心×0.25 | trust を一切見ない |
| **E6 選択型イベント** | 週次ランダム | `trust<45` かつ `popularity>=40` + 30%ロール | trust 依存 |

C-2 は trust を完全に無視しているため、ケア・懇親会・ボーナスで信頼度を維持してもエースが抜かれる確率は下がらない。

### 1.2 確率の実測

上位3団体が存在する状況でエース（pop50+）1人あたり：

- 1ウィンドウ: `1 − 0.94³ ≈ 17%`
- 1シーズン: `1 − 0.83⁴ ≈ 53%`
- 年間ロスト率: `53% × 20%（防衛失敗）= 約10%/選手`

人気50+ が5人いれば毎シーズン誰か抜かれる設計で、プレイヤーの行動では変えられない。

### 1.3 不満ログの可視化

現状プレイヤーが trust 状況を察知する手段：

- `S_grumble` / `S_sns`: trust<30 帯の選択型イベント（事後）
- `trust` 自体は **隠しパラメータ**（`data.js:9530`）
- 週次ログに trust 増減の直接表示なし

→ 「来るぞ」と身構える手段がなく、ケアの動機づけが弱い。

### 1.4 設計方針

- **A: C-2 の確率を trust と防衛率に連動させる**（根本対処）
- **B-1: 週次ロッカールーム空気ログ**（常時の薄い匂わせ）
- **B-2: 移籍ウィンドウ前週の予兆ログ**（ピンポイント警告）

B-3（黒田コメント経由）は却下。黒田は選手個別の人間関係に直接口を出すキャラではないため。

---

## 2. A: 引き抜き確率の trust 連動

### 2.1 対象コード

`src/management.js` `Engine.transfer.processTransferWindow`（約 7123行〜）

```js
const effectivePoachChance = Traits.has(fighter, '忠誠心')
  ? cfg.poachChancePerFighter * 0.25
  : cfg.poachChancePerFighter;
```

この部分に trust 補正を追加する。

### 2.2 trust 補正カーブ

```js
// §A-1: trust による引き抜き確率補正
function getTrustPoachMultiplier(trust) {
  if (trust >= 75) return 0.30;  // 満足、向こうから動かない
  if (trust >= 60) return 0.60;
  if (trust >= 45) return 1.00;  // 基準
  if (trust >= 30) return 1.50;
  return 2.00;                    // 不満爆発、SNS匂わせ相当
}
```

### 2.3 ベース確率の調整

現行 `poachChancePerFighter: 0.06` は、trust 中央値 45-60 帯でも実効 0.036-0.06 に下がるため、**ベースは据え置き 0.06**。高 trust 帯で極端に下がりすぎないよう、上記カーブの最小を 0.30 に設定している。

### 2.4 実装後の有効確率

```
effectivePoachChance = 0.06
  × getTrustPoachMultiplier(trust)
  × (忠誠心 ? 0.25 : 1.0)
```

| trust | 補正 | 1選手/1ウィンドウ/1団体 | 忠誠心持ち |
|---|---|---|---|
| 80 | 0.30 | 1.8% | 0.45% |
| 65 | 0.60 | 3.6% | 0.9% |
| 50 | 1.00 | 6.0% | 1.5% |
| 35 | 1.50 | 9.0% | 2.25% |
| 20 | 2.00 | 12.0% | 3.0% |

### 2.5 防衛成功率の trust 連動

現行 `TRANSFER_CONFIG.nonChampionRetentionRate: 0.80` を固定値から関数化。

```js
// data.js
const TRANSFER_CONFIG = {
  // ...
  nonChampionRetentionRate: 0.80, // 互換のため残すが未使用化
  retentionRateByTrust: {
    // 閾値: trust >= 値
    thresholds: [
      { min: 70, rate: 0.95 },
      { min: 50, rate: 0.80 },  // 現行と同じ
      { min: 30, rate: 0.60 },
      { min: 0,  rate: 0.35 },
    ]
  }
};
```

`management.js` `Engine.transfer.resolvePoach` 内の防衛判定：

```js
// §A-2: trust 連動防衛率
function getRetentionRate(fighter) {
  const trust = fighter.trust != null ? fighter.trust : 50;
  const table = TRANSFER_CONFIG.retentionRateByTrust.thresholds;
  for (const row of table) {
    if (trust >= row.min) return row.rate;
  }
  return 0.35;
}

const defended = s.titles?.world?.championId === fighterIdToRelease
  ? true
  : Engine.rng.float(defRng) < getRetentionRate(poach.fighter);
```

### 2.6 年間ロスト率の再計算

trust 別・上位3団体存在時の年間完全ロスト率：

| trust | 1シーズンoffer率 | 防衛率 | 年間ロスト率 |
|---|---|---|---|
| 80 | 20.7% | 95% | **1.0%** |
| 65 | 37.9% | 80% | 7.6% |
| 50 | 53.0% | 80% | 10.6% |
| 35 | 69.4% | 60% | 27.8% |
| 20 | 80.3% | 35% | **52.2%** |

→ ケアしたエースはほぼ残り、放置したエースはほぼ抜かれる。ケアが効く明確な線が引ける。

---

## 3. B-1: 週次ロッカールーム空気ログ

### 3.1 目的

trust 数値を直接見せずに、ロスター全体の雰囲気を週次で1行フレーバー表示する。プレイヤーが「最近空気悪いな」と気づける常時チャンネルを作る。

### 3.2 発火条件と挿入位置

`Engine.management.processWeek` 相当の週次フェーズ末尾（`management.js:5650` 付近、`pendingTeamSpirit` の隣）で判定。

**発火条件**:

- 非興行週
- `!G.offSeason`
- 他の `pendingNotifEvent` / `pendingChoiceEvent` / `pendingTeamSpirit` がない
- 既存のコーチ報告 (`pendingCoachReport`) とは共存可（別枠）
- **確率30%・週1回まで**（`0xBF10` 派生rngで判定。care-rework2 P1-3/G5で改訂 — 旧仕様の `G.week % 2 === 0` は `isShowWeek(w)=w%2===0` と自己矛盾する恒偽条件で、本ログは実装から一度も発火していなかった。「2週に1度」の意図を偶奇でなく確率で復元）

### 3.3 分岐ロジック

```js
// §B-1: ロッカールーム空気ログ
generateLockerAirLog(rng, state) {
  const roster = state.roster || [];
  if (roster.length === 0) return null;

  const morale = state.lockerRoomMorale != null ? state.lockerRoomMorale : 60;
  const lowTrust = roster.filter(f => (f.trust != null ? f.trust : 50) < 45);
  const veryLowTrust = roster.filter(f => (f.trust != null ? f.trust : 50) < 30);
  const highTrust = roster.filter(f => (f.trust != null ? f.trust : 50) >= 70);

  // 優先度: 危険 > 不穏 > 平穏 > 良好
  if (veryLowTrust.length >= 2 || morale < 35) {
    return { tone: 'danger', ...pickAirText(rng, 'danger', veryLowTrust) };
  }
  if (veryLowTrust.length >= 1 || lowTrust.length >= 3 || morale < 50) {
    return { tone: 'warning', ...pickAirText(rng, 'warning', lowTrust) };
  }
  if (highTrust.length >= roster.length * 0.6 && morale >= 58) {
    // morale閾値は 70→58 (care-rework2 P1-1/G12。70は実測到達率0%だった。
    // 58は雰囲気テキストL4帯の開始と一致 — care-visibility-spec-v1.0 §1 参照)
    return { tone: 'good', ...pickAirText(rng, 'good') };
  }
  // その他は何も出さない（ログ過多を避ける）
  return null;
}
```

### 3.4 フレーバーテキスト（data.js に追加）

```js
const LOCKER_AIR_TEXTS = {
  good: [
    '💬 ロッカールームから笑い声が聞こえてくる',
    '💬 控室の空気は和やかだ',
    '💬 選手たちが自主練で残っている',
    '💬 誰かが差し入れを持ってきたらしい',
  ],
  warning: [
    '💬 控室で{name}がため息をついていた',
    '💬 {name}の表情が最近硬い',
    '💬 ロッカーの会話が少ない日が続いている',
    '💬 {name}が一人で帰る姿を見かけた',
    '💬 練習後、{name}がスマホをじっと見つめていた',
  ],
  danger: [
    '💬 ロッカールームの空気が重い',
    '💬 {name}と{name2}が何か話し込んでいた',
    '💬 控室で小さな言い争いがあったらしい',
    '💬 {name}の機嫌が明らかに悪い',
    '💬 誰もが口数少なく着替えを済ませていた',
  ],
};
```

`{name}` の差し込みは `lowTrust` / `veryLowTrust` プールからランダム選出。複数枠 `{name}` `{name2}` はプールが2人以上ある時のみ該当テンプレを選ぶ。

### 3.5 表示

`gameLog` に push するのみ。モーダル・通知は出さない（情報量が軽いため）。

---

## 4. B-2: 移籍ウィンドウ前週の予兆ログ

### 4.1 目的

四半期末（12/24/36/48週）の1週前に、引き抜きリスクのある選手を名指しで警告。ケアの「駆け込み」行動を可能にする。

### 4.2 発火条件

```js
// §B-2: 移籍ウィンドウ予兆
const PRE_WINDOW_WEEKS = [11, 23, 35, 47]; // TRANSFER_CONFIG.windows の1週前

if (PRE_WINDOW_WEEKS.includes(G.week) && !G.offSeason) {
  const rankings = G.rankings || [];
  const playerRank = Engine.ranking.getPlayerRank(rankings);
  const hasHigherOrg = RIVAL_ORGS.some(org => {
    const orgRank = rankings.findIndex(r => r.orgId === org.id) + 1;
    return orgRank > 0 && orgRank < playerRank;
  });
  if (!hasHigherOrg) return null; // プレイヤーが最上位なら予兆なし

  // リスク選手選定
  const atRisk = G.roster.filter(f => {
    if (f.isRental) return false;
    if (G.titles?.world?.championId === f.id) return false;
    if ((f.popularity || 0) < 50) return false;
    if (Traits.has(f, '忠誠心')) return false; // 忠誠心持ちは予兆も出ない
    const trust = f.trust != null ? f.trust : 50;
    return trust < 60; // trust<60 のみ予兆対象
  });

  if (atRisk.length === 0) return null;

  // 最大2名までランダム選出
  const picked = Engine.rng.sampleN(rng, atRisk, Math.min(2, atRisk.length));
  return { type: 'pre_window_warning', fighters: picked };
}
```

### 4.3 重要度判定

trust 帯で警告トーンを分ける：

| trust | トーン | 例 |
|---|---|---|
| 45-59 | 薄い関心 | `👁️ 業界筋が{name}の試合映像を取り寄せているらしい` |
| 30-44 | 明確な関心 | `👁️ {rival}のスカウトが{name}の試合をチェックしていた` |
| <30 | ほぼ確定 | `⚠️ 複数の団体が{name}に接触を試みている噂が流れている` |

### 4.4 フレーバーテキスト

```js
const PRE_WINDOW_TEXTS = {
  mild: [
    '👁️ 業界筋が{name}の試合映像を取り寄せているらしい',
    '👁️ {name}の名前が他団体の会議で挙がっていたとの噂',
    '👁️ {name}への注目度が他団体内で高まっているようだ',
  ],
  moderate: [
    '👁️ {rival}のスカウトが{name}の試合をチェックしていた',
    '👁️ {rival}関係者が{name}について詳しく探っているらしい',
    '👁️ 業界紙が{name}を「動向注目の選手」として取り上げた',
  ],
  serious: [
    '⚠️ 複数の団体が{name}に接触を試みている噂が流れている',
    '⚠️ {name}の周辺で他団体の動きが活発化している',
    '⚠️ {name}への具体的なオファーが近いとの観測が出ている',
  ],
};
```

`{rival}` は実際の上位団体名からランダムに1つ差し込む（確定情報ではないニュアンスを保つ）。

### 4.5 表示

- `gameLog` に push
- 加えて、**週のステップ進行時に専用の通知モーダル**を1枚挟む（`pendingNotifEvent` と同格の transient として `_pendingPreWindowWarning` を返す）
- モーダルは閉じるだけで進行、選択肢なし
- 画面上部に対象選手の顔アイコン + trust 帯に応じた警告文

### 4.6 予兆と実発火の乖離について

予兆は「trust<60 かつ pop50+ かつ上位団体あり」で出るが、実際の C-2 発火は確率ロール。予兆が出ても引き抜かれないケース、予兆が出なかった選手（trust 60+）がごくまれに抜かれるケース（補正後確率 3.6%×3団体 ≈ 10%/ウィンドウ）はあり得る。

**この乖離は意図的**:

- 予兆は確定予告ではなく「兆し」
- 高 trust 帯でも絶対安全ではないという緊張感を残す
- ケアで trust を上げれば予兆も発火も両方減る、という一方向の因果を保つ

---

## 5. 実装順序と影響範囲

### 5.1 推奨順序

1. **A-1**: `processTransferWindow` に trust 補正追加（数行）
2. **A-2**: `resolvePoach` の防衛率関数化（数行）
3. **A** の動作確認（既存セーブで四半期末を進めて確率変化を観察）
4. **B-2**: 予兆ログ + 通知モーダル（data.js に定数追加 + management.js にフェーズ追加）
5. **B-1**: 週次空気ログ（data.js + management.js）

A だけでも単独で意味がある。B-1/B-2 は A と独立しているので順序は柔軟。

### 5.2 セーブ互換性

- trust は既存フィールドなのでセーブ破壊なし
- `TRANSFER_CONFIG.retentionRateByTrust` は新規定数、古いセーブには無関係
- `_pendingPreWindowWarning` は transient フィールド（セーブに載らない）

### 5.3 忠誠心トレイトとの関係

- C-2 確率: `×0.25`（現状維持）+ trust補正（新規）の乗算
- B-2 予兆: **忠誠心持ちは予兆対象外**（§4.2）
- これにより忠誠心持ちは「抜かれず・騒がず」の安定枠として明確化される

### 5.4 ランキング上位時の挙動

- プレイヤーがランキング最上位 → 上位団体なし → C-2 発火なし → B-2 予兆もなし
- B-1 空気ログは引き抜きと独立なので常時稼働

---

## 6. テスト観点

### 6.1 A のバランス確認

- **新規セーブで第1シーズンを流す**: 初期 trust 50 帯でどの程度オファーが来るか
- **高 trust 維持シナリオ**: 懇親会多用して trust 70+ を維持した場合、年間オファー数が現行の半分以下になることを確認
- **低 trust 放置シナリオ**: trust 30 帯に落とした場合、ほぼ確実にオファー → 防衛失敗が発生することを確認

### 6.2 B-2 の体験確認

- 予兆が出た週にケア行動（懇親会・ボーナス）→ trust 上昇 → 翌週 C-2 発火率低下、の因果が成立するか
- 予兆なしで抜かれるケースの発生頻度が年1回未満に収まるか

### 6.3 B-1 のノイズ確認

- 平常時（trust 50 帯均質）に `tone: 'good'` も `warning` も出ずサイレントになるか
- 既存の pendingNotifEvent との衝突がないか

---

## 7. オープン項目

- **忠誠心以外のトレイト連動**: `人気者`、`ストイック` 等で予兆頻度を変えるべきか → 今回スコープ外、将来検討
- **予兆モーダルのビジュアル**: 既存の通知モーダルと同一 CSS (`news-sec-label` 系) を流用予定。専用デザインは作らない
- **B-1 の頻度**: 現状 2週に1度。実プレイでログが埋もれる場合は `G.week % 3 === 0` に調整
- **B-2 予兆の上限**: 現状 最大2名/ウィンドウ。3名以上リスク選手がいる場合の情報圧縮設計は実装後見直し
- **既存 E6 イベントとの重複**: E6 は trust<45 の即発選択型、B-2 は四半期末予兆。両者は共存するが、同じ選手が連続して登場する可能性あり → 実プレイで違和感なければ放置

---

## 8. 完了条件

- [x] A-1: trust 補正が C-2 に組み込まれ、年間オファー率が trust 帯で明確に変動する
- [x] A-2: 防衛率が trust 帯で変動する
- [x] B-1: 週次空気ログが低 trust 時に発火し、gameLog に表示される
- [x] B-2: 四半期末前週に予兆通知が出て、リスク選手が名指しで警告される
- [x] セーブ互換性が保たれている（旧セーブで新版を起動しても破損しない）
- [x] 既存の pendingNotifEvent / pendingChoiceEvent と衝突しない
