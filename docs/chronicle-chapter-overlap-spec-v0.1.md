# 年代記 章重複 & 同一選手の複数章登場 リデザイン v0.1 (DRAFT)

## Context

現行 chronicle システムは「章はシーズン非重複・各選手は1章にしか登場しない」前提で組まれている。
これに対し Keisuke から以下の設計指針が示された (2026-05-04):

- **シーズンは章ごとに被ってもいい**。むしろ被ってないと無理がある
- **同一選手が章ごとに重複登場してもいい**
- 理由: ある章では「若手ホープ」として、別の章では「主力トップ」として、さらに別の章では「ベテラン」として ─ 同じ選手の人生を時代ごとに違う立ち位置で語り直すドラマが本来必要

したがって、章はもはや「時代の切れ目」ではなく **「視点の切れ目」「世代の照らし方の切り替え」** として再定義する。

ゴール: 同じ選手が CH.1 では「世代の希望」、CH.3 では「時代の覇者」、CH.5 では「老いてなお輝く老兵」として描かれる年代記。

---

## 現状(変更前)

### 章境界生成 (`Engine.chronicle._segmentChapters` @ src/management.js:3063)

```
cursor = firstPeak (or 1 if no prologue)
while cursor <= currentSeason:
  start = cursor
  bestEnd = (start+MIN_LEN-1)..(start+MAX_LEN-1) のうち英雄値密度の谷
  bounds.push({ start, bestEnd })
  cursor = bestEnd + 1   ← 非重複を強制
```

### エース選定 (`Engine.chronicle._selectAceAndPeers`)

候補プール (roster + fighterArchive) から章期間 `[seasonStart, seasonEnd]` に prime が重なる選手を抽出して、英雄値スコアで上位 1〜2 名をエース、その下を peer に。**章をまたいだ調整は無し**。

### narrative

`_buildAceNarrative` / `_buildPeerNarrative` は「その選手のキャリアサマリ」を章窓で切って文章化するだけ。立ち位置 (若手/主力/ベテラン) の概念がない。

### 結果として起きていた違和感

- 井沢遥が S3 デビュー〜S7 ピーク〜S8 陥落を 1 章 (S3-S8) で全部消化されてしまい、若手→主力→老兵の起伏が章をまたいで描けない
- 章をまたぐと別人扱いになるため、世代交代の連続性が弱い

---

## 提案

### 1. 章境界の再定義: 「視点窓」と「ピーク中心」

章は **(focusSeason, halfWidth)** で定義する。実シーズン窓は `[focusSeason - halfWidth, focusSeason + halfWidth]` で重複自由。

- `focusSeason`: 英雄値が局所最大になるシーズン (peak detection)
- `halfWidth`: **固定 3** (= 7 シーズン窓、Keisuke 確定)
- 章数: **上限なし** (Keisuke 確定)。focusSeason 局所最大が出る限り章を作る

新アルゴリズム概念:

1. 全シーズンの英雄値密度 weighted[s] を計算 (現行と同じ)
2. **局所最大** となる season を抽出 (前後 `halfWidth` の中で自身が最大)
   - ただし near-tie (差 < 0.05) は両方残し、別個の章にする
3. 各局所最大を `focusSeason` に章を1つ作成。窓は `[max(1, focus - 3), min(currentSeason, focus + 3)]`
4. **章の重複は許容** (近接 focus でも個別の章として残す)

これにより:
- ピークが密に集中する時代は **章が重なって増える** (例: focus=4, 5, 6 ならそれぞれ S1-S7, S2-S8, S3-S9 で大幅にオーバーラップ)
- ピークが少ない時代は章が空く (focus が出ない年は章を作らない)
- 同一選手の prime が複数章に重なれば自動的に複数章登場する

### 2. 立ち位置 (CareerStage) の概念導入

`Engine.chronicle._classifyCareerStage(fighter, chapter)` を新規追加。
返り値: `'rising' | 'prime' | 'veteran' | 'cameo'`

判定軸 (案):

| stage | 条件 |
|---|---|
| rising | chapter.focusSeason < fighter.primeStart (まだ伸び盛り、ピーク未到達) |
| prime | fighter.primeStart ≤ chapter.focusSeason ≤ fighter.primeEnd |
| veteran | chapter.focusSeason > fighter.primeEnd (衰退期) |
| cameo | 章窓に prime が部分的にしか掛からない / ピークまで遠い |
| **aceAsRising** | rising な候補が章のエース昇格対象になった場合 (`prime` 候補が皆無な序盤章) |

**1人あたりの登場章数上限**: 同一選手は **3 章まで** (rising / prime / veteran が自然な周期)。4 章以上に該当する候補が出た場合、各章での `ace_score` が高い順に上位 3 章を残し、それ以外の章では peer 候補からも除外する。

`fighter.primeStart` / `primeEnd` は既存の `_primeWindow` から取得。

### 3. エース選定 / peer 選定の再設計

#### 3-a. 英雄値 (= ace 値) の再定義 (Keisuke 指示反映)

**現行の問題**: 英雄値 = `peakOVR/100 × 0.6 + peakPopularity/100 × 0.4` は「持っている数字」しか見ていない。
だが本物のエース性は「**団体に何をもたらしたか**」、すなわち **王座 / PPV メイン / 団体対抗戦 / 大きな舞台に立った実績** によって決まる。OVR や人気の高さは前提条件であって、エース性そのものではない。

> 「OVR 100 だがタイトルを巻いていない選手」と「OVR 90 だが王座 5 度・PPV メインを 4 度・対外戦の旗印になった選手」では、後者のほうが時代のエースだ。

#### 新 `_heroScore` の構造: 素地スコア + 章内実績スコア

##### スケール整合の方針 (重要)

- 素地側: peakOVR (整数 0〜120 帯) / peakPopularity (整数 0〜100 帯) → そのままだと achievement の小数重みと桁が違いすぎる
- 実績側: Keisuke 指定の重み (0.02〜0.12) を掛けた合算 → 章窓内の活躍量で 0〜2 程度まで開く

**両者を「0〜1 に正規化してから重み合成」する**ことでスケールを揃える。
こうしないと「高 OVR で実績ゼロ」と「中 OVR で実績満載」の差が直感と乖離する。

##### baseScore (素地、0〜1 正規化)

```
baseScore = clamp01( peakOVR/110 × 0.6 + peakPopularity/100 × 0.4 )
```

- peakOVR は max を 110 (上振れ余地込み) で割って 0〜1 化、peakPop は /100
- 合算後 `clamp01` で 1.0 を上限
- 典型値: OVR 100 × Pop 90 → 0.91 / OVR 80 × Pop 70 → 0.72

選手の「器」のサイズ。これだけでは時代を背負えない。

##### achievementScore (章窓内、0〜1 正規化)

##### achievementScore (章窓内の実績、配分 70%)

| 種別 | 由来 (history) | 重み | 備考 |
|---|---|---|---|
| 王座戴冠 | `titleWin` | **+0.05 / 件** | Keisuke 指定 |
| 王座防衛 | `_countChapterDefensesForAce` の値 | **+0.06 / 防衛** | Keisuke 指定 (戴冠より重い = 守った重み) |
| PPV メイン | `ppvMainEvent` | +0.15 / 件 | (未指定 / 試算値) |
| ドームメイン | `domeMain` | **+0.12 / 件** | Keisuke 指定 |
| 団体対抗戦 (war) 勝利 | `war.won === true` | **+0.07 / 勝** | Keisuke 指定 |
| 団体対抗戦 (war) 出場 (敗) | `war.won === false` | **+0.02 / 戦** | Keisuke 指定 |
| 挑戦試合 撃退 (受けた側勝ち) | `challenge_request_match` で防衛側 won | **+0.06 / 件** | Keisuke 指定 (受けた挑戦を撃退) |
| 挑戦試合 自団体発信 | `challenge_request_match` で攻撃側 | +0.05 / 件 | (未指定 / 試算値) |
| MVP | `awardMVP` | +0.12 / 件 | (未指定 / 試算値) |
| ベストマッチ賞 | `awardBestMatch` | +0.04 / 件 | (未指定 / 試算値) |
| ジュニアトーナメント優勝 | `juniorTournament.result === 'champion'` | +0.08 / 件 | (未指定 / 試算値) |
| 王座陥落 (補正) | `titleLoss` | +0.00 | 控除しない (戴冠した事実は残る) |

集計時、すべて **章窓 `[seasonStart, seasonEnd]` 内に限定**する。章ごとに改めて計算するので、別の章でいくら活躍してもその章の ace_score には乗らない。

「現王者として在位継続中」の補正:

- 章末時点で王者なら `+0.10` (章を**現役エース**として閉じた重み)

##### 0〜1 正規化のしかた

raw 合計を **「典型的な章のフルエース」値 = 1.50** で割って 0〜1 にスケールする。

```
achievementScore = clamp01( achievementRaw / 1.50 )
```

- 1.50 は試算 (戴冠5/防衛4/PPVメイン2/war勝5/MVP3/章末王者) の合計 ≈ 1.60 を参考に切りの良い値で設定。Phase B の auto-sim で再調整
- フルエースを超える伝説級も 1.0 で頭打ち (上限を切ることで scoring が暴れない)
- 章ごとに achievementRaw の最大値で動的正規化する案もあるが、章間で ace_score の絶対値が比較できなくなるので不採用

##### 最終合成式

```
ace_score = baseScore × W_BASE + achievementScore × W_ACH
W_BASE = 0.50, W_ACH = 0.50  // Keisuke 指定 (素地と実績は同等の重み)
```

両サイドが 0〜1 に揃っているので、ace_score も 0〜1 の範囲。重みが直感どおりに効く。

##### 二枚看板判定の閾値も再調整

差 `≤ 0.04` は素地スコア時代の値。新スコアは achievement で大きく動くので、二枚看板閾値を **`差 ≤ 0.20` かつ prime overlap ≥ 3 シーズン** に緩める。

##### スコア例 (Keisuke 重み + スケール整合版)

**ケース A: 井沢遥級の章エース** (peakOVR 106 / peakPop 97 / 章窓内で 戴冠5・防衛4・PPVメイン2・war勝5・MVP3・章末王者)

```
baseScore = clamp01( 106/110 × 0.6 + 97/100 × 0.4 ) = 0.578 + 0.388 = 0.966
achievementRaw = 5×0.05 + 4×0.06 + 2×0.15 + 5×0.07 + 3×0.12 + 0.10
              = 0.25 + 0.24 + 0.30 + 0.35 + 0.36 + 0.10 = 1.60
achievementScore = clamp01( 1.60 / 1.50 ) = 1.000 (頭打ち)
ace_score = 0.966 × 0.50 + 1.000 × 0.50 = 0.483 + 0.500 = 0.983
```

**ケース B: 高 OVR・無冠 peer** (peakOVR 100 / peakPop 90 / 章窓内 戴冠 0・防衛 0)

```
baseScore = clamp01( 100/110 × 0.6 + 90/100 × 0.4 ) = 0.545 + 0.360 = 0.905
achievementRaw = 0
achievementScore = 0
ace_score = 0.905 × 0.50 + 0 × 0.50 = 0.453
```

**ケース C: 中 OVR・実績満載** (peakOVR 88 / peakPop 78 / 章窓内 戴冠2・防衛3・war勝3)

```
baseScore = clamp01( 88/110 × 0.6 + 78/100 × 0.4 ) = 0.480 + 0.312 = 0.792
achievementRaw = 2×0.05 + 3×0.06 + 3×0.07 = 0.10 + 0.18 + 0.21 = 0.49
achievementScore = 0.49 / 1.50 = 0.327
ace_score = 0.792 × 0.50 + 0.327 × 0.50 = 0.396 + 0.163 = 0.559
```

**ケース D: 高 OVR + 中実績** (peakOVR 100 / peakPop 90 / 戴冠1・防衛1・war勝1)

```
baseScore = 0.905
achievementRaw = 0.05 + 0.06 + 0.07 = 0.18
achievementScore = 0.18 / 1.50 = 0.120
ace_score = 0.905 × 0.50 + 0.120 × 0.50 = 0.453 + 0.060 = 0.513
```

##### 比較表

| ケース | base | achievement | ace_score |
|---|---|---|---|
| A 章エース (高OVR・実績満載) | 0.97 | 1.00 | **0.98** |
| C 中OVR・実績満載 | 0.79 | 0.33 | **0.56** |
| D 高OVR・中実績 | 0.91 | 0.12 | **0.51** |
| B 高OVR・無冠 | 0.91 | 0.00 | **0.45** |

→ ace_score は 0〜1 に収まり、A→B 比は ~2.2 倍。素地と実績が同等の重み (5:5) なので、「高OVR・無冠」も底ではなく中位に収まる (= 才能の蓄積はちゃんと評価される)。実績満載が上、無冠が下、という順序は維持される。

##### この変更が波及する箇所

- `_heroScore(fighter)` (引数1) → `_aceScore(fighter, chapter)` (引数2) に署名変更
- `_segmentChapters` の章境界用 `weighted[s]` も同関数を使い回しているが、**境界決定では引数 chapter が無い**ので、この用途には別関数 `_seasonHeroDensity(fighter, season)` を用意し、季節単位の peak 性 (peakOVR + peak 帯フラグ) で密度を出す
- `_selectAceAndPeers` のソート基準も `_aceScore(c, chapter)` に差し替え

#### 3-a-bis. ace 選定の最終フロー (新)

1. 章窓 `[seasonStart, seasonEnd]` に prime / rising が掛かる候補を抽出
2. 候補ごとに `aceScore = baseScore×0.5 + chapterAchievementScore×0.5` を計算
3. `stage === 'prime'` の候補をソート
4. 上位 1 名がエース。差 ≤ 0.20 かつ prime 重複 ≥ 3 シーズンで二枚看板
5. **prime 候補が皆無**の場合: rising 候補で ace_score 最大の 1 名を `stage = 'aceAsRising'` でエース昇格。narrative は「この時代を象徴する若手」として組む (4-b の rising 系テンプレを ace 用に流用)

#### 3-b. peer 選定の再設計 (Keisuke 指示反映)

現行の peer 選定は「実力派 = 英雄値上位3 / 人気派 = peakPop≥80 で1名」。
ここを以下のように **stage 別の枠** に組み直す:

| 枠名 | 人数 | 選び方 |
|---|---|---|
| 実力副官 (prime) | 1〜2 | 章 focus 時点で `stage === 'prime'`、英雄値順 (= OVR×0.6 + Pop×0.4)。エース除外。 |
| 若手ホープ (rising) | 1〜2 | 章 focus 時点で `stage === 'rising'`。**才能スコア** = peakOVR (将来の上限値) × 0.5 + (現時点 OVR or 直近成長率) × 0.3 + peakPopularity × 0.2。次世代のトップ候補を拾う。 |
| 看板スター (idol) | 0〜1 | `peakPopularity ≥ 80` の最高人気。OVR 不問。stage 不問 (人気は時代の象徴)。 |
| ベテラン (veteran) | 0〜1 | 章 focus 時点で `stage === 'veteran'`、過去の戴冠数 + 章窓内の活動量で選出 (晩年の存在感を示す枠)。 |

合計 peer 数は 3〜5 を目安。stage 多様性を確保する。

各 peer には `peer.role` (`'strength' | 'rising' | 'idol' | 'veteran'`) と `peer.stage` を付与する。
narrative 生成・UI 表示の両方で参照する。

#### 3-c. 「次世代のトップになる才能ある若手」の判定

候補プール側で、各候補に **将来の最大到達点** を保持しておく:

- 現役選手: `peakOVR` フィールド (= キャリア通算ピーク OVR)
- 未来予測 (まだ peak 到達前): 同じ peakOVR フィールドが「将来到達するピーク」を表す
  - chronicle は引退選手と現役選手を混ぜて時代を描くので、現役選手の `peakOVR` は「現在ではなく、その選手のキャリア最高値」になる
  - つまり S5 章で S7 ピーク到達予定の若手は、S5 時点では「peakOVR は知っているが章 focus からは未来の値」

ルール: rising 枠の選定では `peakOVR` を「才能の指標」として使ってよい。これは **メタ情報** だが、年代記が「振り返り視点」である以上、「あの章のあの若手が後にトップになった」という結末を込めて選んでよい。逆に **narrative テキストには未来を書かない** (4-b 参照)。

> 換言すると: **選定は未来込み、語りは未来抜き**。

各 peer に `stage` を付与して narrative 生成側に渡す。

### 4. narrative の stage-aware 化

#### 4-a. `_buildAceNarrative` の拡張

ace に対しても `stage` を判定 (通常 `prime` だが、章 focus が prime 終端に近いと `late_prime` 等)。
narrative テンプレートに stage 別の出だしを追加:

```
prime: 「{surname}は{titleReigns}度の戴冠で世代の中心軸となった。」
late_prime: 「峠に差し掛かった{surname}は、それでも{defenses}度の防衛で踏みとどまった。」
```

#### 4-b. `_buildPeerNarrative` を stage 別に分岐

新規テンプレート集 `Engine.chronicle.PEER_NARRATIVE_BY_STAGE`:

| stage | テンプレ例 |
|---|---|
| rising | 「{surname}はこの章の世代の若手ホープとして頭角を現した。」 |
| prime | 「{surname}は同期と並走する主力として、章の流れを共に作った。」 |
| veteran | 「キャリア晩期に差し掛かった{surname}は、若手の前で背中を見せ続けた。」 |
| cameo | 「{surname}は章末に短く姿を見せ、次の時代に道を譲った。」 |

#### 4-c. 記者の目 (`buildAceQuote`) の category に stage を加味

既存 8 カテゴリ + stage で 16〜24 種に拡張。
最低限、`peakDefender` や `champion` カテゴリが `prime` 前提なのを明示し、
`late_prime` / `veteran` ace 用カテゴリ `legacyHolder` `lateBloomer` 等を追加。

### 5. 同一選手の複数章登場をどう「物語として一貫」させるか

ある選手 X が CH.1, CH.3, CH.5 に登場するとき、3つの narrative がそれぞれ独立だと
読者には「同じ事実が3回繰り返される」だけになりかねない。

ルール:

- **rising 章では**: 章 focus 時点までの実績だけを語る (戴冠歴がまだ無いなら無いと書く)
- **prime 章では**: 章窓内のタイトル戦績・防衛戦・対外戦を中心に書く
- **veteran 章では**: 章窓内の最後の戴冠・後進への影響・引退の予兆を書く

つまり、同じ選手の narrative でも **「章の focusSeason 時点で本人が知らないはずの未来」を書かない**。
`_countChapterDefensesForAce` 等の集計は今と同じく章窓限定なので、ここは自然に実装される。

### 5-bis. 「記者の目」の情報量増強 (Keisuke 指示反映)

#### 現状の問題

現行 `QUOTE_TEMPLATES` ([src/management.js:2704](src/management.js:2704)) は **1 文だけの短いテンプレ** が 8 カテゴリ × 各 4 本 = 32 本。例:

> 「井沢遥は王座を5度防衛し、団体の核として時代を背負った。」

これだけでは「何度防衛した」しか伝わらず、

- その章での具体的な戦績の手触り (誰を退けたか、どの会場でやったか、対外戦はどう転んだか)
- その活躍が次の時代に何を残したか (後進に何を見せたか、どの戦術が継承されたか)
- 次世代への足場 (この章で頭角を現した若手にとってどんな存在だったか)

が拾えていない。**記者の語り口で世代の意味を読者に渡せていない**。

#### 提案: 3 段構成のテンプレ拡張

各 quote を **3 段(章での具体性 → 時代における意味 → 次世代への接続)** で構成する。
1 段ずつテンプレ・スロット差し替えで組み立てるので、現行の 1 段固定テンプレを廃止し
**段別テンプレ集 + 組合せルール** にする。

| 段 | 役割 | スロット例 |
|---|---|---|
| §A 章での手触り | 章窓内の固有戦績を 1〜2 文 | `{surname}` `{defenses}` `{titleReigns}` `{topRivalSurname}` `{topVenue}` `{warOpponentOrg}` `{warRecord}` |
| §B 時代における意味 | この章でこの選手が何を担ったか | `{styleJa}` `{eraTag}` `{peakOVR}` `{peakPopularity}` `{spiritAxis}` (= 章の `_topAxis`) |
| §C 次世代への接続 | 後輩・次章への影響 | `{risingPeerSurname}` `{nextChapterTopSurname}` `{successorStyle}` `{influenceVerb}` |

合算で **3〜5 文 / 80〜140 文字** を狙う。1 段だけの短文も「沈黙のような余韻」が必要なカテゴリ (uncrowned, struggle 等) では許容。

#### 新スロットに必要な集計データ

`buildAceQuote` 呼び出し前に章コンテキストを充実させる:

- `topRivalSurname`: 章窓内の対戦履歴で最も激しく競った相手 (h2h.history から `chapter` 内の決着数で集計)
- `topVenue`: 章窓内に最も多く立った大会場 (`venue-attendance-spec`)
- `warOpponentOrg` / `warRecord`: 章窓内 `war` イベントの主要対戦団体と勝敗 (例: `「なでしこプロレスを中心とした対外戦5勝0敗で〜」`)
- `risingPeerSurname`: 同じ章の `rising` peer のうち最も英雄値が伸びそうな者 (= 才能スコア最大)
- `nextChapterTopSurname`: 次章のエース苗字 (chapter cache に依存するので **章生成順序を依存解決** する必要あり、後出しでも可)
- `successorStyle`: 次章の `_topAxis` (継承された戦術軸を文章化)
- `influenceVerb`: 章末 closing magnitude (slight/moderate/strong) に応じた動詞 (「軌跡を残した」「色濃く刻んだ」「決定づけた」)
- `eraTag`: 章 `_topAxis` + 戴冠数で導出するタグ (黄金期 / 挑戦者世代 / 端境期 等、現行 SUBTITLE_TEMPLATES のキーを再利用)

#### 例: peakDefender (3 段)

§A 章での手触り (例 4 本):
- 「{surname}はこの章を通じて王座を{defenses}度防衛した。{topRivalSurname}との激闘は世代の語り草となり、{topVenue}での攻防は今も団体史に刻まれている。」
- 「{titleReigns}度の戴冠、{defenses}度の防衛——{surname}は挑戦者を退け続けた。{warOpponentOrg}との対外戦{warRecord}も、この章の彼女の重みを物語る。」

§B 時代における意味 (例 4 本):
- 「{surname}が{styleJa}で団体を引っ張った時期、{org}全体の試合運びには{spiritAxis}の色が濃く染み込んでいった。」
- 「OVR{peakOVR}・人気{peakPopularity}に達したこの選手の在位は、{eraTag}と呼ぶに相応しい時代を作った。」

§C 次世代への接続 (例 4 本):
- 「{surname}が見せた{styleJa}は、{risingPeerSurname}ら次世代の選手たちの基準になった。次章の主役{nextChapterTopSurname}が立ち上がる足場は、確かにこの世代に築かれていた。」
- 「{surname}の章が閉じるとき、団体には{successorStyle}を継ぐ若手の影が既に伸び始めていた。」

組合せ規則:
- §A は必須 (固有戦績がない章では「{surname}にとってこの章は{eraTag}そのものだった。」のような最小フォールバック)
- §B は 80% で挿入 (連続章で同じ axis が続くと冗長になるので密度調整)
- §C は **過去になった章でのみ次章エース名を含めて挿入**。最新章 (= エースがまだ現役で語り切れない章) では「次章エース名を出さない控え目な §C」または「物語の終端句」に差し替え。判定は `chapter.status === 'in_progress'` で分岐 (`_chapterStatus` が `in_progress` を返す = 現役選手在籍 = 最新章扱い)。

#### 段別テンプレの管理

新形式: `Engine.chronicle.QUOTE_TEMPLATES_V2 = { peakDefender: { sectionA: [...], sectionB: [...], sectionC: [...] }, ... }`。
`buildAceQuote` は既存のシード派生で **各段独立に index を選ぶ** ことで再現性を維持。

### 6. UI 側

- 章詳細画面はほぼ現行のまま
- ただし peer リストに **「若手ホープ」「主力」「ベテラン」のラベルチップ** を表示
- 章ヘッダ期間表示 `SEASON N — SEASON M` に **重複インジケータ**(矢印 / 透過バンド)を出して、章間で重なっていることを視覚的に伝える
- 年代記タイムラインの章カード並びは「focusSeason 順」、重複は背景バンドで可視化

---

## 触る予定のファイル

- [src/management.js](src/management.js)
  - `_segmentChapters` 全面書き換え (focusSeason ベース)
  - `_classifyCareerStage` 新規追加
  - `_selectAceAndPeers` stage-aware に書き換え
  - `_buildAceNarrative` stage 反映 (拡張)
  - `_buildPeerNarrative` stage 別テンプレ参照に書き換え
  - `_classifyAceQuoteCategory` / `QUOTE_TEMPLATES` 拡張
  - `buildChapters` / chapter シリアライズに `focusSeason`, `halfWidth`, `aces[i].stage`, `peers[i].stage` を追加
- [src/ui-render.js](src/ui-render.js)
  - 章ヘッダの期間表示・重複インジケータ
  - peer リストの stage チップ
- [specs/chronicle-system-spec-v0.1.md](specs/chronicle-system-spec-v0.1.md)
  - 章境界・stage・narrative テンプレ仕様の更新
- [specs/chronicle-prologue-spec-v1.0.md](specs/chronicle-prologue-spec-v1.0.md)
  - 序章と CH.1 の関係 (重複OK か継続前提か) を明文化

---

## マイグレーション

- 既存セーブの `chaptersCache` は構造変化により無効化 (forceRebuild)
- 新形式: `chapter.focusSeason`, `chapter.halfWidth`, `chapter.aces[i].stage`, `chapter.peers[i].stage` 必須
- 旧 `seasonStart` / `seasonEnd` は派生フィールドとして残す (UI 互換)
- `fighterArchive` 構造は変更なし

### 序章との併存

- 序章 (`G.prologue`) は **S1-S2 固定の旗揚げ専用レイヤー**として独立 (現行通り)
- CH.1 の focusSeason が早い場合 (例: focus=2 → CH.1=[1,5]) に序章期間と窓が被ってOK
- 序章メンバーが CH.1 にも「ベテラン」「中堅」として登場することは許容 (本仕様の重複登場ルールと一致)

## 検証

### Phase A (境界算出): auto-sim 不要、固定seedの単体テスト
- 入力: 候補10名×8シーズンのテストフィクスチャ
- 期待: ピーク密集 → 章重複、ピーク疎 → 章スパース

### Phase B (stage 判定): 単体テスト
- (fighter.primeStart=3, primeEnd=6) と (chapter.focusSeason=1..8) の全組合わせ → 期待 stage 表

### Phase C (narrative統合): 実セーブで目視
- 同一選手が rising / prime / veteran で別 narrative になることを確認
- 「未来を語っていない」 (focus より後の戴冠を書かない) ことを確認

### Phase D (UI): preview で章カードの重複バンド表示確認

---

## スコープ外 / 後送り

- 章ヘッダの **キーアート** (外敵団体/エラ画像) 追加 ─ 別タスク (本ファイル v0.1 では触れない)
- 章間の遷移演出 (フェード / アニメーション)
- 旧セーブの自動マイグレーション以上の何か (例: 過去章を凍結保存して新ロジックで上書きしないオプション)

---

## 未決事項 (Keisuke 要確認)

### 確定済み (2026-05-04)

- ~~6. §C で次章エース名を出すか~~ → **過去になった章では出してOK**。最新 (= 自称エースが現役) 章では §C で次章エースに言及しない。`isLatestChapter` フラグで分岐。
- ~~7. 記者の目の長さ上限 / スマホ見栄え~~ → **気にしない**。情報量優先で長文化してよい。
- ~~8. achievement 重み~~ → **Keisuke 指定値を採用** (戴冠 0.05 / 防衛 0.06 / ドーム 0.12 / war勝 0.07 / war敗 0.02 / 挑戦撃退 0.06)。PPVメイン・MVP・ベストマッチ賞・ジュニアトーナメント・自団体発信挑戦戦は試算値据え置き、Phase B の auto-sim で再調整。
- ~~9. base 比率~~ → **5:5 で確定** (W_BASE = 0.50, W_ACH = 0.50。素地と実績は同等扱い、Keisuke 指定)。
- ~~1. 章数の上限~~ → **上限なし** (Keisuke 指定)。focusSeason 局所最大が出る限り章を作る。
- ~~2. halfWidth~~ → **固定 3 (= 7 シーズン窓) を既定**。focusSeason が近接する場合は **窓は変えず重複を許容**。重複が大きくても問題ない (同じ時代を別視点で語り直すのが本仕様の本旨)。
- ~~3. 同一選手の登場章数上限~~ → **3 章まで** (rising / prime / veteran で自然に上限が決まる)。4 章以上に該当する候補が出た場合、その選手の `ace_score` が高い順に上位 3 章を残し、それ以外の章では `peer_score` の閾値判定に落とす (peer 枠としても出ない章があってもよい)。
- ~~4. CH.1 の rising 章 (ace 不在)~~ → **rising 候補のうち最も ace_score が高い 1 名を ace に昇格** (`stage = 'aceAsRising'` の特別扱い)。「この時代を象徴する若手」として narrative を組む。peer は他の rising / 数少ない prime 候補で構成。
- ~~5. 序章と CH.1 の関係~~ → **重複を許容**。序章は S1-S2 固定の旗揚げ専用レイヤーとして独立。CH.1 の focusSeason が早い (例: focus=2) 場合、CH.1 = `[max(1, focus-3), focus+3]` が序章期間と被るが、それは仕様 (序章メンバーの一部が CH.1 にも「ベテラン」「中堅」として登場することがある)。

### 残未決

(なし)

---

## Phase A 実装着手キット

次セッションで Phase A から始める。新規 / 改修する関数のシグネチャ・返り値の概形をここに固定しておく。

### A-1. `Engine.chronicle._aceScore(fighter, chapter)`

```js
_aceScore(fighter, chapter) {
  const base = Engine.chronicle._baseScore(fighter);
  const ach = Engine.chronicle._achievementScore(fighter, chapter);
  return base * 0.5 + ach * 0.5;
}

_baseScore(fighter) {
  const ovrN = Math.min(1, (fighter.peakOVR || 0) / 110);
  const popN = Math.min(1, (fighter.peakPopularity || 0) / 100);
  return Math.max(0, Math.min(1, ovrN * 0.6 + popN * 0.4));
}

_achievementScore(fighter, chapter) {
  const raw = Engine.chronicle._achievementRaw(fighter, chapter);
  return Math.max(0, Math.min(1, raw / 1.5));
}
```

`_achievementRaw` は既存 `_countChapterDefensesForAce` と同じ章窓フィルタリング思想で、history を走査して種別ごとに重みを掛ける。重み定数は `Engine.chronicle.ACE_ACH_WEIGHTS` として 1 箇所に切り出す。

### A-2. `Engine.chronicle.ACE_ACH_WEIGHTS` (定数)

```js
ACE_ACH_WEIGHTS: {
  titleWin: 0.05,
  titleDefense: 0.06,           // _countChapterDefensesForAce の合計に掛ける
  ppvMainEvent: 0.15,            // 試算値、Phase B で再調整
  domeMain: 0.12,
  warWin: 0.07,
  warLoss: 0.02,
  challengeRequestDefend: 0.06,  // 受けた挑戦を撃退
  challengeRequestSend: 0.05,    // 試算値
  awardMVP: 0.12,                // 試算値
  awardBestMatch: 0.04,          // 試算値
  juniorTournamentChampion: 0.08, // 試算値
  champAtChapterEnd: 0.10        // 章末で王者の固定加算
}
```

### A-3. `_classifyCareerStage(fighter, chapter)`

```js
_classifyCareerStage(fighter, chapter) {
  const focus = chapter.focusSeason || chapter.seasonStart;
  const ps = fighter.primeStart || fighter.careerSeasonsStart || 1;
  const pe = fighter.primeEnd || fighter.careerSeasonsEnd || ps;
  if (focus < ps) return 'rising';
  if (focus > pe) return 'veteran';
  return 'prime';
}
```

`cameo` / `aceAsRising` は selectAceAndPeers 内で派生決定する (上の関数は基本3分類のみ)。

### A-4. `_segmentChapters` の新方式

```js
_segmentChapters(candidates, state) {
  const currentSeason = Math.max(1, state.season || 1);
  const weighted = new Array(currentSeason + 2).fill(0);
  candidates.forEach(c => {
    const s = c.peakOVRSeason || 0;
    if (s >= 1 && s <= currentSeason) {
      weighted[s] += Engine.chronicle._heroDensity(c); // 章引数なし、peakOVR + peakPop の素地のみ
    }
  });
  const HALF = 3;
  const focuses = [];
  for (let s = 1; s <= currentSeason; s++) {
    if (weighted[s] <= 0) continue;
    let isLocalMax = true;
    for (let d = 1; d <= HALF; d++) {
      if (weighted[s - d] > weighted[s] || weighted[s + d] > weighted[s]) {
        isLocalMax = false; break;
      }
    }
    if (isLocalMax) focuses.push(s);
  }
  return focuses.map(f => ({
    focusSeason: f,
    halfWidth: HALF,
    seasonStart: Math.max(1, f - HALF),
    seasonEnd: Math.min(currentSeason, f + HALF)
  }));
}
```

`_heroDensity` は ace 選定とは別関数。境界決定では章コンテキストが無いので素地のみで密度を作る:

```js
_heroDensity(fighter) {
  return Engine.chronicle._baseScore(fighter);
}
```

### A-5. `_selectAceAndPeers` 改修(prime 不在 → aceAsRising 昇格)

```js
_selectAceAndPeers(chapter, candidates) {
  const inChapter = candidates.filter(c => /* prime/career が窓と重なる */);
  const scored = inChapter.map(c => ({
    ...c,
    _stage: Engine.chronicle._classifyCareerStage(c, chapter),
    _ace: Engine.chronicle._aceScore(c, chapter)
  }));
  const primes = scored.filter(c => c._stage === 'prime').sort((a, b) => b._ace - a._ace);
  let aces;
  if (primes.length > 0) {
    aces = [primes[0]];
    if (primes.length >= 2) {
      const diff = primes[0]._ace - primes[1]._ace;
      // 二枚看板: 差 ≤ 0.20 かつ prime 重複 ≥ 3
      if (diff <= 0.20 && Engine.chronicle._primeOverlap(primes[0], primes[1]) >= 3) {
        aces.push(primes[1]);
      }
    }
  } else {
    // Phase A の最小実装: rising から昇格 (Phase B の peer 選定で詳細化)
    const risings = scored.filter(c => c._stage === 'rising').sort((a, b) => b._ace - a._ace);
    if (risings.length > 0) {
      aces = [{ ...risings[0], _stage: 'aceAsRising' }];
    } else {
      return null;
    }
  }
  // peer は Phase B で本格化、Phase A は現行ロジック流用 (英雄値順 上位3 + idol 1)
  const peers = /* 現行 */;
  return { aces, peers };
}
```

### A-6. `buildChapters` のシリアライズ拡張

`chapters.push({...})` の中に以下を追加:

```js
focusSeason: b.focusSeason,
halfWidth: b.halfWidth,
aces: sel.aces.map(a => ({
  ...,
  stage: a._stage,        // 'prime' | 'aceAsRising'
  aceScore: a._ace        // デバッグ・UI 表示用
})),
peers: sel.peers.map(p => ({
  ...,
  stage: p._stage         // Phase B で role も追加
}))
```

### A-7. キャッシュ無効化

新フィールド追加によりキャッシュ形式が変わるので、`buildChapters` の冒頭に互換チェック:

```js
const _isV2 = (cache.chapters || []).every(c => c.focusSeason !== undefined);
if (!forceRebuild && _isV2 && cache.lastBuiltSeason === (state.season || 0) ...) return state;
```

### A-8. 同一選手 3 章上限の強制

`buildChapters` の最後 (chapters 配列確定後) で post-process:

```js
// 同一選手の登場章数を 3 章までに切り詰める
const fighterChapterScores = new Map(); // id -> [(chapter, score, slot)]
chapters.forEach(c => {
  [...c.aces, ...c.peers].forEach(p => {
    const arr = fighterChapterScores.get(p.id) || [];
    arr.push({ chapter: c, score: p.aceScore || 0, slot: c.aces.includes(p) ? 'ace' : 'peer' });
    fighterChapterScores.set(p.id, arr);
  });
});
fighterChapterScores.forEach((arr, fid) => {
  if (arr.length <= 3) return;
  arr.sort((a, b) => b.score - a.score);
  const keep = new Set(arr.slice(0, 3).map(x => x.chapter.id));
  arr.slice(3).forEach(x => {
    // 該当 chapter から fid を peer リストから除去 (ace 枠なら触らない安全側)
    if (x.slot === 'peer') {
      x.chapter.peers = x.chapter.peers.filter(p => p.id !== fid);
    }
  });
});
```

### Phase A 完了条件

- [x] auto-sim が validateGameState 違反ゼロで通る (2026-05-04 / 100 シーズン × seed 42 violations 0 / errors 0 / weeks 5300)
- [ ] 報告セーブ(序章なし)で年代記タブを開いた時に章が **focusSeason 中心の重複窓** で並ぶことを目視確認 (実機確認: ユーザー委任)
- [ ] 既存セーブの章数が **大幅に増える** ことを確認 (旧 N=2-3 → 新 N=4-7 程度) (実機確認: ユーザー委任)
- [ ] 1 選手が CH.1 (rising) と CH.2 (prime) に両方出現するケースを最低 1 例生成できる (実機確認: ユーザー委任)
- [ ] CH.1 が prime 不在 → aceAsRising 昇格になるシナリオが動く (実機確認: ユーザー委任)

### Phase A 実装メモ (2026-05-04)

- `Engine.chronicle._heroScore` は後方互換のため残存させたが、`_segmentChapters` / `_selectAceAndPeers` の双方とも参照を切り替えたので未参照。Phase B 以降で削除可
- `_selectAceAndPeers` の peer 選定は現行ロジック (英雄値順 上位 3 + idol 1) を流用し、各 peer に `_stage` だけ付与した。stage 別 4 枠 (実力副官/若手ホープ/看板スター/ベテラン) は Phase B で本格化
- `challenge_request_match` の defender / challenger 判定は `app.js:7760` の `isRequester` フィールドで実装
- 3 章上限 post-process は安全側で peer 枠のみ削減。ace 枠で 4 章以上登場する伝説級が出ても不変 (Phase B で実プレイ確認後に再判断)
- chapter id は `ch_focus${focusSeason}_${seasonStart}_${seasonEnd}` に変更。近接 focus でも衝突しない
- cache 互換: `focusSeason` フィールドが無いキャッシュは強制リビルド (forceRebuild 不要)

### Phase A 実装後修正 (2026-05-04)

#### 局所最大検出パラメータ調整

- 検出半径を仕様 (`halfWidth=3` 内で局所最大) のまま実装すると、隣接ピーク同士が互いを抑え合い、ピークが密集する時代でも章が 1 個しか立たない問題が判明
- 仕様 L65 の例「focus=4, 5, 6 がそれぞれ章になる」が成立するには、検出半径と章窓半幅は別パラメータでなければならない
- 採用: `LOCAL_RADIUS=1` (隣接 1 シーズンのみ比較) + `NEAR_TIE=0.05` (差 0.05 までは局所最大として両方残す) + `HALF=3` (章窓半幅は仕様どおり)

#### 駆け出し章アンカー (synthetic fledgling chapter)

- 局所最大検出だけだと、後年の高密度ピーク (例: 全盛期セーブで s20=weighted 2.5) に s2-3 の駆け出しピークが抑えられて消える
- ユーザー要望「最初期は変化が大きく、駆け出し時代を 2-3 シーズンでまとめた章が欲しい」に対応
- `currentSeason >= 2` で seasons 1-3 を覆う章が他に無ければ、`focusSeason=2 / halfWidth=1 / window=[1, min(3, currentSeason)] / _fledgling=true` の合成章を先頭に挿入
- 駆け出し章の ace は通常 `aceAsRising` で立つ (この時期は prime に到達した選手が居ないため)

#### era-OVR 線形補間

- ユーザー疑問「その時代の OVR で評価できないか」への回答: 各シーズンの実 OVR は記録されていない
- 近似: `_estimatedOVRAt(fighter, focusSeason)` でデビューシーズン (rookie OVR ≈ peakOVR-22 / 下限 60) → peakOVRSeason (= peakOVR) を直線補間
- `_baseScore(f, chapter)` は chapter コンテキストがある場合 era-OVR を、無い場合 (`_heroDensity` の境界決定用途) は lifetime peakOVR を使う
- これにより rising 候補が「未来のピーク」で評価されなくなり、CH.1 駆け出し章の ace が「その時代相応の OVR」で点数化される (peakOVR=95 が S7 到達予定の選手も S2 時点では推定 OVR ≈ 78)
- 衰退モデル (peakOVRSeason 以降の OVR 漸減) は未実装。focusSeason ≥ peakSeason ではそのまま peakOVR を返す (Phase B で必要なら拡張)

### Phase A スコープ外

- peer 枠の stage 別再設計 (実力副官 / 若手ホープ / 看板スター / ベテラン) → Phase B
- 記者の目の段別テンプレ → Phase C
- 章ヘッダ重複インジケータ UI → Phase D
