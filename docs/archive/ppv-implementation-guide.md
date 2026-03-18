# PPV GRAND FINAL 実装指示（Claude Code 用）

> 設計書: `specs/ppv-grand-final-spec-v2.0.md`
> 既存アーキテクチャ5原則を厳守すること（CLAUDE.md 参照）

---

## 前提確認

- Phase 3 パラメータ変更（`warChancePerSeason: 0.30→0.50`）が完了していること
- `summitMinRank` は **2 のまま変更しない**

---

## Step 1: データ定数 + Engine.ppv 基盤（data.js + engine.js）

### data.js に追加する定数

```js
// PPV GRAND FINAL 設定
const PPV_SLOTS = { 1: 5, 2: 4, 3: 3, 4: 2 };  // ランク→出場枠数
const PPV_REWARD = { 1: 300, 2: 200, 3: 150, 4: 100 };  // ランク→出場報酬（万円）
const PPV_UNLOCK_POP = 30;  // 出場解禁に必要な orgPop

const PPV_NAMES = [
  'GENESIS', 'STARDOM FINAL', 'GRAND CLASH',
  'BURNING SPIRIT', "QUEEN'S SUMMIT", 'DREAM FESTIVAL',
  'ULTIMATE GLORY', 'CROWN JEWEL', 'FIGHTING DESTINY',
  'RISING STAR', 'ETERNAL CLASH', 'GLORY ROAD'
];

const PPV_OPPONENT_LINES = {
  confident: [
    'あんたの全力、見せてもらうわよ',
    '悪いけど、今日は負けるわけにはいかないの',
    'この大舞台、最高の気分ね',
    '私の実力、思い知らせてあげる',
  ],
  fierce: [
    'ぶっ潰してやるわ！',
    '泣いても知らないわよ？',
    '容赦しない。覚悟しなさい',
    'あんたじゃ私には勝てない',
  ],
  respectful: [
    '正々堂々、最高の試合にしましょう',
    'あなたと戦えるのを楽しみにしてた',
    'お互い全力で…最高の舞台だもの',
    'この対戦、ずっと待ってました',
  ],
  calm: [
    '手加減はしない。覚悟して',
    '結果で語りましょう',
    '余計な言葉はいらないわ',
    '実力の差を見せてあげる',
  ],
};

// 煽り文テンプレート（{name1},{name2},{org1},{org2} を差し込み）
const PPV_HYPE_TEMPLATES = {
  rivalry: [
    '因縁の対決！{name1}と{name2}、この大舞台で決着なるか！',
    '積み重ねてきた因縁——{name1}と{name2}の物語が、ここで動く！',
  ],
  tierGap: [
    '{org2}の壁！{name1}は{name2}を越えられるか！',
    '格上挑戦！{name1}が{org2}の{name2}に挑む！',
  ],
  closeOVR: [
    '実力伯仲！{name1}と{name2}、どちらが勝ってもおかしくない！',
    '互角の実力——勝敗を分けるのは、この一瞬の判断！',
  ],
  starMatch: [
    'スター対決！{name1}と{name2}、夢のカードが実現！',
    '人気者同士の激突！{name1} vs {name2}、会場が沸く！',
  ],
  summit: [
    '団体の威信を懸けた頂上決戦！{name1} vs {name2}！',
    '年間王者を決める最終決戦——{name1}と{name2}、頂点に立つのはどちらだ！',
  ],
};
```

### engine.js に Engine.ppv 名前空間を新設

既存の `Engine.event` セクション（L4372付近）の直前に配置。

```js
// ── PPV GRAND FINAL ─────────────────────────────
ppv: {
  /** orgPop 30 到達で PPV 解禁判定 */
  checkUnlock(orgPop) {
    return (orgPop || 0) >= PPV_UNLOCK_POP;
  },

  /** ランキング順位 → 出場枠数 */
  getSlotCount(rank) {
    return PPV_SLOTS[rank] || PPV_SLOTS[4];
  },

  /** AI団体の代表選出（OVR上位、怪我除外） */
  getAIEntries(aiOrgData, slots) {
    const available = (aiOrgData.roster || []).filter(f => !f.injury);
    return available
      .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))
      .slice(0, slots)
      .map(f => ({ ...f }));
  },

  /** 怪我→自動繰り上げ処理。entries を書き換えた新配列を返す */
  resolveInjuries(entries, roster, isPlayerOrg) {
    // entries: [fighter, ...], roster: full roster
    const resolved = [];
    const usedIds = new Set(entries.map(f => f.id));
    for (const f of entries) {
      if (f.injury) {
        // ロスターから非エントリー・非怪我・非レンタルでOVR最高を繰り上げ
        const sub = roster
          .filter(r => !usedIds.has(r.id) && !r.injury && !r.isRental)
          .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
        if (sub) {
          usedIds.add(sub.id);
          resolved.push({ ...sub, _ppvSubstitute: true, _replacedName: f.name });
        }
        // 繰り上げ不可→枠削減（pushしない）
      } else {
        resolved.push(f);
      }
    }
    return resolved;
  },

  /** 盛り上がりスコア（ペアの品質指標） */
  calcExcitement(f1, f2) {
    const ovrSum = Engine.util.ov(f1) + Engine.util.ov(f2);
    const popSum = (f1.popularity || 0) + (f2.popularity || 0);
    const ovrGap = Math.abs(Engine.util.ov(f1) - Engine.util.ov(f2));
    return ovrSum + popSum * 0.5 - ovrGap * 2;
  },

  /** マッチメイク生成。summitPair がある場合はメインに固定 */
  generateCard(allEntries, rivalries, summitPair) {
    // allEntries: { player: [...], org_s: [...], org_a: [...], org_b: [...] }
    // summitPair: { fighter1, fighter2, org1Id, org2Id } | null

    // 全選手をフラット化（団体IDをタグ付け）
    const pool = [];
    for (const [orgId, fighters] of Object.entries(allEntries)) {
      for (const f of fighters) {
        pool.push({ ...f, _ppvOrgId: orgId });
      }
    }

    // サミットペアをプールから除外
    const summitIds = new Set();
    if (summitPair) {
      summitIds.add(summitPair.fighter1.id);
      summitIds.add(summitPair.fighter2.id);
    }
    const remaining = pool.filter(f => !summitIds.has(f.id));

    // Step 1: 因縁ペアを最優先マッチング
    const matched = [];
    const usedIds = new Set();
    const rivalryKeys = Object.keys(rivalries || {});
    for (const key of rivalryKeys) {
      const [id1, id2] = key.split('_');
      const f1 = remaining.find(f => f.id === id1 && !usedIds.has(f.id));
      const f2 = remaining.find(f => f.id === id2 && !usedIds.has(f.id));
      if (f1 && f2 && f1._ppvOrgId !== f2._ppvOrgId) {
        const rivalry = rivalries[key];
        if (rivalry && (rivalry.level || 0) >= 1) {
          matched.push({ left: f1, right: f2, excitement: Engine.ppv.calcExcitement(f1, f2), isRivalry: true });
          usedIds.add(f1.id);
          usedIds.add(f2.id);
        }
      }
    }

    // Step 2: 残りを盛り上がりスコアで最適マッチング（異団体制約）
    const unmatched = remaining.filter(f => !usedIds.has(f.id));
    // 貪欲法: 全ペアのスコアを計算し、高い順にマッチング
    const pairs = [];
    for (let i = 0; i < unmatched.length; i++) {
      for (let j = i + 1; j < unmatched.length; j++) {
        if (unmatched[i]._ppvOrgId !== unmatched[j]._ppvOrgId) {
          pairs.push({ i, j, score: Engine.ppv.calcExcitement(unmatched[i], unmatched[j]) });
        }
      }
    }
    pairs.sort((a, b) => b.score - a.score);
    const usedIdx = new Set();
    for (const p of pairs) {
      if (usedIdx.has(p.i) || usedIdx.has(p.j)) continue;
      matched.push({ left: unmatched[p.i], right: unmatched[p.j], excitement: p.score, isRivalry: false });
      usedIdx.add(p.i);
      usedIdx.add(p.j);
    }

    // 盛り上がりスコア昇順（前座→セミ→メイン手前）
    matched.sort((a, b) => a.excitement - b.excitement);

    // サミットをメインイベント（最終試合）に追加
    if (summitPair) {
      matched.push({
        left: pool.find(f => f.id === summitPair.fighter1.id) || summitPair.fighter1,
        right: pool.find(f => f.id === summitPair.fighter2.id) || summitPair.fighter2,
        excitement: 999,
        isSummit: true,
        isRivalry: false,
      });
    }

    return matched;
  },

  /** 大会名をシーズンseedで選択 */
  pickName(rng) {
    return PPV_NAMES[Engine.rng.int(rng, 0, PPV_NAMES.length - 1)];
  },

  /** 煽り文生成 */
  generateHype(match, rivalries) {
    const n1 = match.left.name, n2 = match.right.name;
    const o1 = match.left._ppvOrgName || '', o2 = match.right._ppvOrgName || '';
    let templates;
    if (match.isSummit) templates = PPV_HYPE_TEMPLATES.summit;
    else if (match.isRivalry) templates = PPV_HYPE_TEMPLATES.rivalry;
    else {
      const ovrGap = Math.abs(Engine.util.ov(match.left) - Engine.util.ov(match.right));
      const popSum = (match.left.popularity || 0) + (match.right.popularity || 0);
      if (ovrGap > 15) templates = PPV_HYPE_TEMPLATES.tierGap;
      else if (popSum > 100) templates = PPV_HYPE_TEMPLATES.starMatch;
      else templates = PPV_HYPE_TEMPLATES.closeOVR;
    }
    const tmpl = templates[Math.floor(Math.random() * templates.length)];
    return tmpl.replace(/{name1}/g, n1).replace(/{name2}/g, n2)
              .replace(/{org1}/g, o1).replace(/{org2}/g, o2);
  },

  /** 対戦相手の一言セリフ選択 */
  getOpponentLine(rng, fighter) {
    // キャラの性格傾向に基づいてトーン選択
    // mn(メンタル)高→calm/respectful、pw高→fierce、sp高→confident をベースに
    const mn = fighter.mn || 50, pw = fighter.pw || 50;
    let tone;
    if (mn >= 70) tone = Math.random() > 0.5 ? 'calm' : 'respectful';
    else if (pw >= 70) tone = 'fierce';
    else tone = 'confident';
    const lines = PPV_OPPONENT_LINES[tone] || PPV_OPPONENT_LINES.confident;
    return lines[Engine.rng.int(rng, 0, lines.length - 1)];
  },

  /** サミットペアを決定（ランク1位 vs 2位） */
  getSummitPair(state) {
    const rankings = state.rankings || [];
    if (rankings.length < 2) return null;
    const rank1 = rankings[0]; // 1位
    const rank2 = rankings[1]; // 2位

    // 1位のエース取得
    let ace1, ace1OrgId;
    if (rank1.orgId === 'player') {
      ace1 = Engine.event.getAce(state.roster);
      ace1OrgId = 'player';
    } else {
      const org1 = Engine.rival.getOrgInfo(state.aiOrgs, rank1.orgId);
      ace1 = org1 ? Engine.event.getAce(org1.roster) : null;
      ace1OrgId = rank1.orgId;
    }

    // 2位のエース取得
    let ace2, ace2OrgId;
    if (rank2.orgId === 'player') {
      ace2 = Engine.event.getAce(state.roster);
      ace2OrgId = 'player';
    } else {
      const org2 = Engine.rival.getOrgInfo(state.aiOrgs, rank2.orgId);
      ace2 = org2 ? Engine.event.getAce(org2.roster) : null;
      ace2OrgId = rank2.orgId;
    }

    if (!ace1 || !ace2) return null;
    return { fighter1: ace1, fighter2: ace2, org1Id: ace1OrgId, org2Id: ace2OrgId };
  },
},
```

### GameState初期値に追加（Engine内の initState 付近）

```js
ppvUnlocked: false,
ppvEntries: null,    // { player: [fighter,...], org_s: [...], ... }
ppvPhase: null,      // null | 'entry' | 'locked' | 'show' | 'tv'
ppvName: '',
```

### セーブデータマイグレーション追加

```js
if (!state._migrated_ppv_v2) {
  state.ppvUnlocked = (state.orgPop || 0) >= PPV_UNLOCK_POP;
  state.ppvEntries = null;
  state.ppvPhase = null;
  state.ppvName = '';
  state._migrated_ppv_v2 = true;
}
```

### orgPop 更新箇所で ppvUnlocked チェック

orgPop が変動する全箇所（tickWeek の settlement 等）で:
```js
if (!s.ppvUnlocked && Engine.ppv.checkUnlock(s.orgPop)) {
  s = { ...s, ppvUnlocked: true };
  events.push('🏟️ PPV GRAND FINAL への出場資格を獲得！年末の大舞台に選手を送り出せます');
}
```

---

## Step 2: Week 43 エントリー + Week 48 PPV当日（engine.js の advanceWeek）

### Week 43 の処理（advanceWeek 内、D-2 対抗戦チェックの前に追加）

```
Week 43（非興行週）で advanceWeek が呼ばれたとき:
  if (s.week === 43) {
    if (s.ppvUnlocked) {
      // 大会名決定
      const ppvRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, 0xPPV1));
      const ppvName = Engine.ppv.pickName(ppvRng);
      // AI団体のエントリー自動生成
      const rankings = s.rankings || [];
      const aiEntries = {};
      RIVAL_ORGS.forEach(org => {
        const orgRank = rankings.find(r => r.orgId === org.id);
        const rank = orgRank ? orgRank.rank : 4;
        const slots = Engine.ppv.getSlotCount(rank);
        const aiData = s.aiOrgs[org.id];
        aiEntries[org.id] = aiData ? Engine.ppv.getAIEntries(aiData, slots) : [];
      });
      s = { ...s, ppvPhase: 'entry', ppvName, _ppvAIEntries: aiEntries };
      events.push(`🏟️ PPV GRAND FINAL「${ppvName}」エントリー受付開始！出場選手を選んでください`);
      return { state: { ...s, weekPhase: 'ppvEntry' }, events };
    } else {
      // テレビ観戦モード予約
      s = { ...s, ppvPhase: 'tv' };
    }
  }
```

### Week 48 の処理

現在の Week 48 は通常の興行週として処理されている。ppvPhase が 'locked' または 'tv' の場合、通常興行を上書きして PPV 処理に入る。

```
Week 48 の興行処理前（app.js の processWeek 相当）:
  if (isPPV(G.week) && G.ppvPhase === 'locked') {
    → PPV当日フローへ（怪我チェック→繰り上げ→マッチメイク→試合発表→観戦）
    → 通常の興行処理（カード編成画面等）をスキップ
  }
  if (isPPV(G.week) && G.ppvPhase === 'tv') {
    → テレビ観戦フローへ（AI全エントリー自動→全試合自動→結果表示）
  }
```

**重要**: Week 48 は偶数＝興行週なので、通常だと興行準備→興行実行の流れに入る。PPV 時はこの通常フローを完全に上書きする。プレイヤーが自分でカードを組む工程はなく、PPV 専用の流れに入る。

---

## Step 3: エントリーUI（app.js + ui-render.js / ui-common.js + index.html）

### エントリー画面の仕様

weekPhase: 'ppvEntry' のとき表示。

**表示内容:**
- 大会名ヘッダー「PPV GRAND FINAL「[大会名]」」
- 出場枠数:「出場枠: N名（ランクX位）」
- チャンピオンがいる場合:「👑 自動エントリー: [選手名]（チャンピオン）」
- 残り枠の選手選択リスト（チェックボックス式）
  - 各選手: 顔アイコン + 名前 + OVR + 人気 + 怪我中は選択不可(グレーアウト) + レンタルは選択不可
- 注意書き:「※ エントリー後の変更はできません」「※ 出場選手がPPVまでに負傷した場合、自動的に代理選手が出場します」
- [エントリー確定] ボタン（必要枠数を満たしたら有効化）

### エントリー確定時の処理（app.js）

```
1. プレイヤーの選択を ppvEntries.player に格納
2. ppvPhase を 'locked' に変更
3. 通知:「エントリー完了！PPV GRAND FINAL は第48週に開催されます」
4. 通常の週処理（manage フェーズ）に戻る
```

---

## Step 4: PPV当日の試合発表＋観戦フロー（app.js + ui-common.js）

### 当日フロー（ppvPhase === 'locked' での Week 48）

```
1. 怪我チェック＋自動繰り上げ
   - 全団体のエントリーに対して Engine.ppv.resolveInjuries() 実行
   - 繰り上げがあった場合は通知ポップアップ

2. サミットペア決定
   - Engine.ppv.getSummitPair(state) でランク1位vs2位のエースを取得

3. マッチメイク生成
   - Engine.ppv.generateCard(allEntries, rivalries, summitPair)
   - 結果: 試合配列（前座→メイン順）

4. 大会オープニング演出
   - 大会名＋ロゴ風タイトル表示
   - 「全X試合」の表示

5. 試合を1試合ずつ発表＋観戦
   - 各試合: カード発表（§5.4の演出フロー）
   - [🎬 試合を観る]: battle-engine.html で観戦
   - [⏭ スキップ]: Engine.battle.simulateMatch で結果だけ取得
   - 試合結果（勝者＋MQ）を表示して次へ

6. 全試合完了後
   - 結果サマリー画面（全試合一覧 + サミット結果 + 出場報酬 + 対戦pt変動）
   - サミットの対戦pt移動処理
   - 出場報酬を funds に加算
   - 人気変動等の通常試合結果処理
```

### テレビ観戦フロー（ppvPhase === 'tv' での Week 48）

```
1. AI全団体のエントリーを自動生成
2. サミットペア決定（AI同士）
3. マッチメイク生成
4. 全試合を Engine.battle.simulateMatch で一括計算
5. 「📺 PPV GRAND FINAL テレビ中継」画面で結果一覧表示
6. サミットの対戦pt移動処理
7. フレーバーテキスト:「来年こそはこの舞台に…」
```

---

## Step 5: 結果処理＋収入（engine.js + app.js）

- 各試合の人気変動・因縁カウント・ヒート変動は通常興行と同じルールを適用
- 因縁決着判定も通常通り行う
- 出場報酬: PPV_REWARD[rank] を funds に加算
- サミット勝敗: BATTLE_POINT_CFG.summit (±10pt) を battlePoints に反映
- **チケット/グッズ収入は発生しない**（合同大会のため）

---

## Step 6: 演出仕上げ + 既存サミットのリファクタ

- 既存の `Engine.event.checkSummitMatch` と `applySummitOutcome` は PPV に統合されるため、
  Week 48 の独立イベントとしての発火を無効化する
  （advanceWeek 内の D-4 サミットチェックで `isPPV` 週を除外するか、PPV処理側に統合）
- BGM 連携: PPV 開始時に専用 BGM 再生（Audio.fileBgm 等）。素材は後で差し替え可能なプレースホルダーで可
- ppvPhase のシーズンリセット: オフシーズン突入時に null に戻す

---

## ロードマップ更新

完了時に `docs/game-system-roadmap.md` を更新:

### 「次の実装予定」に PPV セクション追加

```markdown
### PPV GRAND FINAL 合同興行（設計書: `specs/ppv-grand-final-spec-v2.0.md`）

| Step | タスク | 重さ | 状態 |
|------|--------|:----:|------|
| 1 | **データ＋エンジン基盤** PPV定数 + Engine.ppv名前空間 | 中 | 未着手 |
| 2 | **Week 43/48 フロー** advanceWeek連携 + ppvPhase管理 | 中 | 未着手 |
| 3 | **エントリーUI** 選手選択画面 + AI自動選出 | 中 | 未着手 |
| 4 | **PPV当日演出** 試合発表 + 観戦 + テレビ観戦 | 大 | 未着手 |
| 5 | **結果処理＋収入** 出場報酬 + ポイント移動 + 人気変動 | 中 | 未着手 |
| 6 | **演出仕上げ** 煽り文 + セリフ + BGM + 既存サミットリファクタ | 中 | 未着手 |
```

### 「現在の状態」を更新

PPV設計完了＋実装着手の旨を記載。

---

## 注意事項

- **アーキテクチャ5原則厳守**: Engine.ppv は純粋関数。DOM に触れない。GameState は返却値で更新。
- **乱数**: PPV 関連の rng は `Engine.rng.derive(s.rngSeed, s.season, 0xPPV*)` 系のシードを使用
- **既存の Week 48 バナー（app.js L3245-3246, L3443-3444）**: PPV 処理に上書きされるため、ppvPhase が null の場合のみ表示するか、PPV 処理側で代替する
- **セリフはテンプレではなくバリエーション豊かに**: CLAUDE.md の「テンプレセリフ量産禁止」に留意
- **実装は Step 1 から順に進め、各 Step 完了時にロードマップを更新すること**
