# 因縁(rivalry)システム 現状調査 v0.1 (2026-07-31)

> 調査専用ドキュメント。コード変更なし。数値は実装(src/relationships.js / src/management.js / src/factions.js)から直接採取。
> `relationships[key] = { bond, rivalry }` の **rivalry(0〜100の数値軸)** を対象とする。
> 別物として `state.rivalries[key]`（H2H因縁称号: `matches`/`resolved`/`oneSided` 等を持つオブジェクト。`Engine.title.getRivalry*` 系が読む）が存在する点に注意。以後「rivalry軸」と呼ぶ場合は前者を指す。

---

## A. 発生・増減の全経路

初期生成(initialize)は「新規に立てる」、それ以外は全て「増減させる」経路。found = 全ペアは `initialize` で `{bond:50, rivalry:0}` を敷いた後に加算されるので、rivalry軸そのものの"新規発生"は実質initializeの1箇所のみ。以降は全て既存値への加減算。

### A-0. 初期化（キャラ生成直後、1回きり）

| # | 場所 | 発火条件 | 増加量の式 | 頻度 | 自団体/他団体で差 |
|---|------|---------|-----------|------|------|
| 0-1 | relationships.js:305-313 `initialize` Step1 | 新規ゲーム開始時、全ペア | `rivalry = 0` で敷く | 1回 | なし |
| 0-2 | relationships.js:327-337 Step3 | `|OVR差| <= 5` の全ペア | `_rollAxisValue(rng,2,6)` = **+2〜+6** | 1回 | なし(所属無関係、FA/AI含む全キャラ総当たり) |
| 0-3 | relationships.js:339-353 Step4 | 性格ペア(`PERSONALITY_RIVALRY_BONUS`: bold×bold+3, earnest×earnest+2, quiet×quiet-2) + ガウス散らしσ=1.5 | 定数 + `_gaussian(rng,1.5)` | 1回 | なし |
| 0-4 | relationships.js:355-407 Step5「元タッグパートナー」 | 同団体内バックストーリー抽選(2〜4組/団体、団体内のみ) | `_rollAxisValue(rng,20,30)` = **+20〜+30**（双方向） | 1回、対象ペアのみ | 同団体限定(orgGroups) |
| 0-5 | relationships.js:355-407 Step5「過去の遺恨」 | 同上抽選 | `_rollAxisValue(rng,40,55)` = **+40〜+55**（双方向） | 1回、対象ペアのみ | 同団体限定 |

初期化はプレイヤー/AI/FA/レンタル供給元を含む**全キャラ総当たり**(relationships.js:297-303)で行われる。レンタル選手を特別扱いする分岐は無い。

### A-1. 週次自然減衰・アンビエント増加（`processWeeklyDecay`, 毎週全ペア走査）

| # | 場所 | 発火条件 | 増減量の式 | 頻度 | 自団体/他団体で差 |
|---|------|---------|-----------|------|------|
| 1-1 | relationships.js:600-604 | 接触中(同団体 or 直近2興行以内対戦) | 基本減衰 `0.28+rng*0.22`、rivalry帯に応じ加算(85+: +0.45 / 70+: +0.25 / 50+: +0.12) → **減少のみ** | 毎週 | 同団体/直近対戦の両方が「接触」扱いなので差なし |
| 1-2 | relationships.js:606-617 | 非接触 | 基本減衰0.16+帯別加算。`knownRival`(rivalry40+で付与)なら減衰を1/3に軽減。さらに4週に1回・rivalry60未満なら **+0.3〜+0.5** の意識マイクロイベント | 毎週(マイクロイベントは4週に1回) | 非接触＝他団体を含む全ペア共通ロジック |
| 1-3 | relationships.js:657-659 G-04 | 同団体無関係。`|OVR差|>=10` かつ `rivalry>=20` かつ勝ってる側の方がOVR高い | **-2〜-4/週** (高OVR側→低OVR側の意識低下) | 毎週(条件成立時) | なし |
| 1-4 | relationships.js:660-664 G-05 | `|OVR差|<=5`、4週に1回、`rivalry>=10` | `_applyAxisDelta(rivalry, 2+rng*2, 'rivalry')` = **+2〜+4** | 4週に1回 | なし |
| 1-5 | relationships.js:666-672 D-1 | G-05条件成立時 + 同団体 + 同スタイル(Allround除く) | **+1〜+2**(上乗せ) | 4週に1回 | 同団体限定 |
| 1-6 | relationships.js:673-677 | G-05条件成立時 + 同団体 + bond<45 + 性格/アーキ相性<=-3 | **+0.8〜+1.6**(上乗せ) | 4週に1回 | 同団体限定 |
| 1-7 | relationships.js:682-687 D-2 | 同団体 + 双方OVR上位5位以内 + 4週に1回 | **+0.5〜+1.0** | 4週に1回 | 同団体限定 |
| 1-8 | relationships.js:705-728 N-03 | 同団体内 Babyface×Heel の全ペア、週12%抽選 | bond `-(6+rng*4)`、rivalry `4+rng*4` = **+4〜+8** | 週12%/ペア | 同団体限定 |

### A-2. 派閥構造の週次波及（`Engine.factions.processFactionInfluenceOnRelationships`, factions.js:667-729）

| # | 場所 | 発火条件 | 増加量の式（実測はdata.js FACTION_CONFIG、コード内コメントの値とはズレあり） | 頻度 | 自団体/他団体 |
|---|------|---------|-----------|------|------|
| 2-1 | factions.js:690-693 | `dictatorTag`(独裁化)派閥、メンバー2名以上 | `dictatorInFactionRivalryGain` = **+0.25/週**（同派閥全ペア） | 毎週 | 派閥は自団体内限定システム |
| 2-2 | factions.js:715-723 | 抗争中(hostile)派閥ペアのメンバー間 | 固定 `+0.3`（双方向、`_applyRivalryDirected`） | 毎週 | 自団体内派閥同士 |
| 2-3 | factions.js:724-726 `_applyTurncoatMagnetism` | 敵対派閥への平均bond60+の選手→敵リーダー | +0.5相当（コード内コメント記載、実装値は`_applyTurncoatMagnetism`内、未読了範囲） | 毎週 | 同上 |

コメント(factions.js:664-666)は「効果1 bond+0.15/効果2 rivalry+0.3/効果3 rivalry+0.5/効果4 bond+0.1/効果5 rivalry+0.2」と書かれているが、実際にdata.js:1442-1450で読まれる定数は `sameFactionBondGain=0.12`, `factionLeaderBondGainAuthoritative=0.08`, `dictatorInFactionRivalryGain=0.25` であり、**コメントと実数値が一致していない**（ドリフト）。数値決めをする際はコメントでなくdata.jsの定数を見ること。

### A-3. 試合結果（`applyMatchResult`, relationships.js:1987-2420） — 最大の増減源

1試合ごとに以下が**複数同時**に適用されうる（排他のものを除き積み上がる）。`isCrossOrg`(他団体戦)なら **rivalry全体に×2.0倍率**、bondの負方向delta（cross-org boost対象外イベントを除く）に×1.5倍率、加えて両者に基本Bond税-2〜-5（bondのみ、rivalry非該当）が乗る。1試合あたりのrivalry増加は他団体戦のみ+35が上限（`CROSS_ORG_RIVALRY_CAP`, relationships.js:2031, 2384-2388）。同団体戦には上限なし。

| # | イベントID/場所 | 発火条件 | rivalry増減量(base、×2.0はcross-orgのみ別途) | 頻度 |
|---|---|---|---|---|
| 3-1 | M-01 (2076-2084) | 全試合、勝敗非対称 | 勝者→敗者 +0.1〜+0.5 / 敗者→勝者 +0.8〜+2.0（逓減あり） | 毎試合 |
| 3-2 | M-02 僅差 (2107-2110) | HP僅差 or 圧倒的HP残(loserRatio>=0.15 or winnerRatio<=0.30) | 双方 +5〜+8（逓減あり） | 条件成立時 |
| 3-3 | M-03 圧勝 (2113-2121) | 5ターン以下決着 or 圧倒的HP差 | 勝者→敗者 -5〜-3(興味喪失) / 敗者→勝者 +5〜+10(悔しさ) | 条件成立時 |
| 3-4 | M-04/M-CO1 名勝負 (2124-2133) | MQ80+ | 同団体戦: 双方+8〜+12 / 他団体戦(M-CO1好敵手認定): 双方+8〜+12(bond側は+6〜+10でcross-org倍率対象外) | MQ80+成立時 |
| 3-5 | M-05 PPV (2136-2139) | PPVステージ | 双方+10〜+15（逓減あり） | PPV試合のみ |
| 3-6 | M-06 タイトル戦 (2142-2161) | タイトル戦、勝敗非対称 | 防衛成功: 王者→挑戦者+4〜+7/挑戦者→王者+10〜+15。王座奪取: +5〜+8/+12〜+18 | タイトル戦のみ |
| 3-7 | M-14 宿命の決着 (2163-2171) | 双方向rivalry80+ AND bond60+ AND mq75+ | rivalryを**0〜5にリセット**、bond双方+5〜+10 | 稀（高rivalry+高bond+高MQ同時成立） |
| 3-8 | M-10/M-CO2 因縁決着 (2173-2195) | `context.rivalryResolved`(PPV/挑戦状の因縁決着抽選から発火) | rivalryを0〜10にリセット(明示値指定がある場合はそちらを使用)。和解ならbond: 同団体+5〜+10 / 他団体+12〜+20(cross-org倍率対象外) | 決着抽選成立時 |
| 3-9 | M-11 怪我 (2197-2225) | 怪我発生時、状況別3パターン | 被害者→加害者 +1〜+5（圧勝時0/名勝負時0/通常+1〜+3。squash時のみ+2〜+5） | 怪我発生時 |
| 3-10 | M-12 連敗ストリーク (2227-2233) | 3連敗中の相手に勝利 | 勝者→敗者 +2〜+4（逓減あり） | 条件成立時 |
| 3-11 | Phase5 認知イベント (2236-2263) | `state.rivalries`に片側因縁(`oneSided`)登録済のペア | 攻撃側勝利/僅差: 被攻撃側→攻撃側+8〜+12。攻撃側大敗(squash): 攻撃側 rivalry-5〜-8, bond-3〜-5 | oneSided因縁ペアのみ |
| 3-12 | M-13 キャリアベストMQ (2265-2273) | 自己ベストMQ更新 | 双方+3〜+5(逓減なし) | 稀 |
| 3-13 | G-08 prove mode (2276-2283) | prove mode中の選手が試合 | 対戦相手→prove mode選手 +2〜+4 | prove mode中の試合のみ |
| 3-14 | M-15 番狂わせ (2285-2306) | OVR差10+の格下勝利、M-03と排他 | 格下→格上+3〜+5 / 格上→格下(逆恨み)+4〜+7（逓減あり） | 条件成立時 |
| 3-15 | M-16 h2hフラストレーション (2308-2330) | 3連敗中の相手に負け続け | 敗者→勝者+3〜+5。逆転(3連敗を破った側)は-4〜-2 | 条件成立時 |
| 3-16 | B-3 元同僚初対戦 (2346-2350) | 離脱後の初接触(orgTimeline判定)、逓減なし、cross-org倍率対象外 | 双方+6〜+10 | 離脱後初対戦時のみ |
| 3-17 | 挑戦状試合の因縁発火 (2354-2381) | `isChallengeShowMatch` (挑戦状受諾試合) | 勝者+2〜+6 / 敗者+20〜+30(MQ80+で+3〜+7上乗せ、番狂わせで+5〜+8上乗せ) — **通常のM-01〜M-17を上書きして再設定**、cross-orgキャップ対象外 | 挑戦状試合のみ |

他団体戦(War代表戦/B3受諾試合)は上記M-01〜M-17パイプラインを`isCrossOrg:true`で呼ぶだけで、専用の別式は持たない（management.js:10184-10197 War, :10481-10494 B3）。

### A-4. タッグマッチ（`applyTagMatchResult`, relationships.js:2478-2600、`TAG_REL_SCALE`はdata.js:1046-1055）

| # | 場所 | 条件 | rivalry量 |
|---|------|------|-----------|
| 4-1 | 対戦相手ペア基本 (2514-2517) | 4組全ペア | `roll(0.15,0.75) * scale(opponent0.50/pin0.75) * 逓減` |
| 4-2 | MQ80+上乗せ (2519-2525) | 同上 | `roll(4,6) * scale * 逓減` |
| 4-3 | フォール決着ペア (2532-2536) | 決めた/決められたペア | `roll(1,3) * 逓減` (負けた側→勝った側のみ) |
| 4-4 | チームメイト勝敗 (2546-2555) | teamLoss側のみrivalry設定あり | `teamLoss.rivalry=[0,1]`, `teamWin.rivalry`なし |
| 4-5 | 裏切りドラマ (2564-2567) | ドラマイベント`betrayal` | `TAG_REL_SCALE.betrayal.rivalry=[8,12]` |

### A-5. 挑戦状(challengeRequest)・大型イベント・派閥単発イベント（ad-hoc固定値、applyMatchResultとは別系統）

| # | 場所 | 条件 | rivalry量 | 自団体/他団体 |
|---|------|------|-----------|------|
| 5-1 | management.js:23178-23193 B3挑戦状 事後関係値 | 挑戦状の対戦2選手 | **applyToRoster で +8〜+12(固定)** をまず適用、その後 applyMatchResult(isCrossOrg:true) を**重ねて**適用(A-3参照)。B3のrivalry増加は同種の他cross-org経路より二重に乗る作り | 挑戦状のみ、他団体前提 |
| 5-2 | management.js:23058-23063 大型イベント対立決着(E-02) | 対立イベント決着試合 | 敗者→勝者+8〜+12、勝者→敗者+8〜+12(双方向) | 自団体内イベント |
| 5-3 | factions.js:2967-2969 Common-1派閥内試合 | 派閥内rivalry40+ペアの練習試合 | `relDelta = -ri(30,50)`（**rivalryを大幅減算**、決着による因縁解消） | 派閥Common-1発火時のみ |
| 5-4 | factions.js:3700-3703 F04寝返り | 対象→旧リーダー | +5〜+8 | 自団体派閥内 |
| 5-5 | factions.js:3753-3760 F04告げ口 | 対象→リーダー | +10〜+15 | 自団体派閥内 |
| 5-6 | factions.js:4763前後 F09敗北 | 敗者派閥リーダー→勝者派閥リーダー | +8〜+12 | 自団体派閥内 |
| 5-7 | management.js:25961-25963 天頂戦(PPVトーナメント)ドラマ演出 | epic/humiliation判定 | epic双方+8、humiliation片方向+12(固定値、乱数なし) | 天頂戦(4年に1度)限定 |
| 5-8 | relationships.js:1738-1767 G-01/N-02 ブレイクスルー | OVR差5以内の全キャラ→本人 / 同団体+年齢差3以内+OVR低い側→本人 | G-01: +3〜+5。N-02: bond-2〜-4, rivalry+3〜+5 | ブレイクスルー発火時 |
| 5-9 | management.js:6534-6543 O-12 prove mode突入 | 同世代(年齢差3以内)→本人 | +3〜+5 | prove mode突入時 |
| 5-10 | relationships.js:1657-1669 C-05/C-06/N-01(showContext) | タイトル戦不出場の嫉妬、N-01はOVR差5以内+同スタイル+16週CD | N-01: +3〜+5 | 興行編成の都度 |

### まとめ: 試合結果・MQ・タイトル戦の差

- 通常勝敗だけなら±0〜2程度の小幅（M-01）。MQ・僅差・タイトル・PPVなど「見応え」系イベントが積み重なるほど伸びる。
- 圧勝(M-03)は逆にrivalryを下げる方向（勝者側の興味喪失）、敗者側だけ上がる非対称設計。
- タイトル戦は防衛成功より王座奪取の方がやや高いが、実際は「挑戦者→王者」側の伸び幅(+10〜+15/+12〜+18)が支配的で、防衛側・新王者側の伸びは小さい。

### 練習中/週次イベントによる発生

上記A-1(週次アンビエント)・A-2(派閥波及)がこれに該当。「練習中」固有のrivalryイベントは見当たらず(成長イベントは概ねbond側、G-01/N-02のブレイクスルーがrivalryに波及する唯一の練習成果起点)。

### 他団体戦(cross-org)の扱い

`applyMatchResult`内で一貫して **rivalry ×2.0** が掛かる(relationships.js:2054, 2061)。bondは負方向のみ×1.5、加えて基本Bond税-2〜-5が両者に乗る(relationships.js:2064-2073)。M-CO1(名勝負)・M-CO2(和解)・B-3(元同僚初対戦)の3イベントだけはこの倍率の**対象外**(`skipCrossOrgBondMult`)として個別の高めの固定レンジを持つ。1試合のrivalry増加上限+35は他団体戦にのみ適用（relationships.js:2031, 2383-2388）。同団体戦には上限がない。

---

## B. レンタル選手の扱い

`isRental` を条件に含む関係性関連コードを全て確認した。結論: **試合起因のrivalry/bond変動はレンタル選手にも通常通り適用される**が、**週次アンビエント/社会的イベント系はレンタル選手を除外**している。「除外」と「非除外」が機能によって分かれているのが実態。

### 除外されている箇所（レンタル選手はイベントの主体にも客体にもならない）

| 場所 | 対象関数 | 除外内容 |
|------|---------|---------|
| relationships.js:849 `activeRoster` | `processWeeklyStoryEvents`(親友ゾーン/憎い敵ゾーン/好敵手ゾーン/一方的な敵意/完全断絶/覚醒、893-1014行のペア総当たりループ全体) | レンタル・怪我を除外したロスターのみで全ペア走査。**レンタル選手はこの週次ドラマ生成システムに一切登場しない** |
| relationships.js:1378 `remainingIds` | `applyContractDepartureBetrayal`(裏切り離脱の残留者側変動) | 残留者からレンタルを除外 |
| relationships.js:1507 `colleagues` | 解雇grudgeイベント(同僚への影響) | 同上 |
| relationships.js:1614 `rosterIds` | `applyShowContextEffects`(C-04タイトル戦不出場嫉妬/N-01) | 対象からレンタル除外 |
| relationships.js:1662 | C-05/C-06(連敗中選手の起用/不起用) | 対象選手がレンタルなら不発 |
| relationships.js:3456 `_passesPrereq` | challengeRequest(挑戦状) | `self.isRental`なら打診者になれない(自団体側の起点から除外) |
| relationships.js:3515 `playerRoster` | challengeRequest候補収集 | 同上 |
| relationships.js:3724/3761/3781 `_healthy`/`reqMates`/`oppMates` | 挑戦状の同行2名選出 | レンタルは同行選出から除外 |
| relationships.js:3997/4067 `_collectCandidates` | スナップショット/Glimpse通知候補収集 | レンタルは通知の主体から除外(数値は変えないが、演出上出てこない) |
| relationships.js:4738/4794 GlimpseA/B層 | trust閾値通知・日常Glimpse | 同上 |
| management.js:23189 | B3挑戦状の団体仲間→代表bond+2 | 対象からレンタル除外 |
| factions.js:676 `neutralIds` | 派閥非所属の関係性波及対象 | レンタルは派閥システムそのものから除外(92, 676, 787, 897行など多数) |

### 除外されていない箇所（レンタル選手も通常通り変動する）

- `applyMatchResult`(relationships.js:1987-2420、A-3節の全イベント) に `isRental` 分岐は**存在しない**。レンタル選手が試合に出れば勝敗・MQ・タイトル戦・PPV等の通常のrivalry/bond変動を通常キャラと同じ式で受ける。
- `applyTagMatchResult`(relationships.js:2478-2600) も同様に `isRental` チェックなし。
- rental-system-spec-v2.0 §7.2/§9 で定義された固有イベント(management.js:14149-14153加入時 bond-2〜+2、14205-14208帰団時 bond-3〜-6)は**bondのみでrivalryは対象外**(`{min:0,max:0}`)。

### 結論

レンタル選手は「試合をすれば普通に因縁を積む」が、「日常の空気(週次ドラマ生成・派閥・スナップショット通知)には参加しない」という設計になっている。除外は関数ごとにアドホックに`!f.isRental`フィルタを足す形で実装されており、一箇所に集約されたルールはない。改修時はA-1(週次アンビエント)とA-3(試合結果)を混同しないよう注意。

---

## C. 「近い者同士」判定の有無

### rivalry側: OVR近接判定は複数箇所に存在する

| # | 場所 | 判定 | 効果 |
|---|------|------|------|
| C-1 | relationships.js:327-337 (初期化Step3) | `|OVR差|<=5` | rivalry +2〜+6(全キャラ総当たり、1回) |
| C-2 | relationships.js:660-664 (週次G-05) | `|OVR差|<=5`、4週に1回 | rivalry +2〜+4 |
| C-3 | relationships.js:657-659 (週次G-04) | `|OVR差|>=10` かつ高OVR側が勝ってる | rivalry -2〜-4(遠ざかる方向) |
| C-4 | relationships.js:1745-1748 (G-01ブレイクスルー) | `|OVR差|<=5`の全キャラ→本人 | rivalry +3〜+5 |
| C-5 | management.js:2285-2306 (M-15番狂わせ) | `|OVR差|>=10` | rivalry増減(格下/格上双方) |
| C-6 | management.js:23349 (プレイスホルダ的近接抽出、closeIds) | `|OVR差|<=5` | 用途未読了(候補収集系) |

**年齢近接**もbond寄りだがrivalryにも波及する箇所がある:
- N-02(relationships.js:1750-1766): 同団体+年齢差3以内+OVR低い側→本人、bond-2〜-4/rivalry+3〜+5(ブレイクスルー時)
- O-12(management.js:6540-6543): prove mode突入時、年齢差3以内→本人 rivalry+3〜+5
- 週次D-2(relationships.js:642-650, 682-687): 年齢差3以内はbond側のみ+0.08/週、rivalryには波及しない(タイトル圏近接rivalryは別条件=OVR上位5位内)

**trainCap(潜在値)近接は rivalry/bond に一切作用していない。** `FATED_RIVAL_TCOVR=117`/`FATED_RIVAL_AGE_DIFF=1`(management.js:2479-2482) という「trainCapOVR近接+年齢差1以内」の判定が確かに存在するが、これは `Engine.mq` の "期待のライバル"(fatedRivals) **新聞ビッグニュース生成専用のフラグ**(`_fatedRivalPartnerId`)であり、relationships[key]の数値には一切触れない(management.js:2692-2718, 2747-2784で完結、grep範囲でrivalry/bond更新コードなし)。「近い者同士を数値でライバル化する」ロジックとしては**存在しない**。

### bond側: 相性軸(affinityAxis)という類似の仕組みが存在する

`relationship-affinity-spec-v1.0.md` で提案された「キャラ固有360°軸」は**実装済み**(relationships.js:143-153, 256-296, 423-437, 585-598)。距離が近いほどbondの"標的"が引き上がり(cos関数)、接触中はbondがその標的に緩やかに引き寄せられる。ただしこれは**bondのみに作用し、rivalryには使われない**(relationship-affinity-spec-v1.0 §12でも明記された意図通り)。

**実装上の欠落を1件発見**: `processWeeklyDecay`内の`charInfoMap`構築で、プレイヤーロスター側は`affinityAxis`をコピーしている(relationships.js:537-543)が、AI団体ロスター側は**`affinityAxis`フィールドを含めていない**(544-551)。`_affinity.distance()`は`axisA`/`axisB`のどちらかが`number`でなければ中立値90を返す(145行)ため、**AIキャラが絡む全てのペア(AI内同士・player対AI)で相性軸によるbond標的シフトが常に無効化されている**。相性軸が機能しているのはプレイヤーロスター同士のペアのみ。バグか意図的な簡略化かは仕様書に記載がなく未確認。

---

## D. 数値の実態

### 実行結果: `node test/auto-sim.js 40`（フォアグラウンド実行、シードはDate.now由来のランダム、約94秒）

```
Total violations: 0 (0 unique)
Total errors: 0
Total weeks simulated: 2120
Result: ALL CLEAR ✓
```

不変条件違反ゼロ。rivalry関連のクラッシュ・NaN等は無し。

### auto-sim.js の既存計測フック（test/auto-sim.js を読んだ結果）

rivalry軸そのものの分布(ペア数・帯域分布・自団体/他団体比・レンタル絡みペア数)を直接測るフックは**存在しない**。存在するのは「Ring-in Effect Probe (P3b)」(test/auto-sim.js 1980-2042行付近)のみで、これは**MQ計算時にどれだけrivalryの"リング内効果"(matchResultへの反映)が発動したか**という下流の使用頻度を測るものであり、`relationships[key].rivalry` 自体の分布は集計していない。今回の実測値:

```
発動率(n=17188試合): 因縁=23.18% タイトル=0.00% trust=10.66% バフ=5.70%
  因縁tier1(rivalry45-54相当): n=1153 (6.71%)
  因縁tier2(rivalry55-64相当): n=1254 (7.30%)
  因縁tier3(rivalry65-79相当): n=1129 (6.57%)
  因縁tier4(rivalry80+相当):   n=448 (2.61%)
[不変条件4] 因縁戦の平均MQ優位(同OV帯±5、加重平均): 1.047 (目標+1.0〜+2.5)
[不変条件6] 勝率歪み(同OV帯、加重平均): -9.367pt (目標±2pt以内、現状NG方向に大きい)
```

これは「min(rivalryAB, rivalryBA) >= 45(getRivalryMQBonusの下限)の対戦相手同士が組まれた試合」が全試合の23.18%を占める、という意味であり、「全キャラペアのうちrivalryが立っているペアの割合」ではない(組まれた試合の分母であり、ロスター内の全ペア組み合わせの分母ではない)点に注意。

### 個別に知りたかった数値（計測できたもの/できなかったもの）

| 知りたかった数値 | 結果 |
|---|---|
| 40シーズンでrivalryがどのくらいのペアに立つか | **計測手段が無い**。auto-sim.jsは`state.relationships`の分布を出力しない。近い指標として上記tier別発動率(試合ベース)はある |
| 自団体同士 vs 他団体との比率 | **計測手段が無い**。試合種別ごとの`isCrossOrg`集計フックも無い |
| レンタル選手が絡むペアの数 | **計測手段が無い** |

上記3点を厳密に知るには、auto-sim.js側に(a)`state.relationships`をシーズン末にスナップショットして帯域別・cross-org別に集計する、(b)`isRental`フラグ付きキャラのペアだけ抽出、のような追加フックが要る。これは今回のタスク範囲外(auto-sim.js変更禁止)のため未実施。別途 `test/relationship-distribution-analysis.js` という関連ツールが存在する形跡が仕様書(relationship-affinity-spec-v1.0 §11.1)にあるが、**このファイルの実在は今回未確認**(存在すればrivalry分布計測に使える可能性がある)。

---

## E. 仕様と実装の差分

### 一致している箇所（確認できた範囲で仕様通り）

- `relationship-system-spec-v2.1.md`の他団体戦リバランス(§4.4.2/§4.4.3: 基本Bond税-2〜-5、bond負方向×1.5、rivalry×2.0、上限+35)は実装(relationships.js:2031, 2054-2073)と完全一致。
- `challenge-request-spec-v0.1.md`のheat計算式・クォータ(シーズン2件/相手団体1件/CD24週・36週(NO時52週))は`computeHeat`(relationships.js:3439-3446)・`_passesPrereq`/`_passesCD`/`_passesQuota`(3452-3493)と一致。
- `rental-system-spec-v2.0.md` §7.2/§9のbond数値(加入時-2〜+2、帰団時-3〜-6)は management.js:14149-14153 / 14205-14208 と完全一致。rivalryへの作用が無い点も一致。

### 一致していない/怪しい箇所

1. **`relationship-affinity-spec-v1.0.md`のステータス表記が実態と乖離している**。specファイルの冒頭は「🟡 ドラフト（Keisuke 承認済み・実装前）」となっているが、実際には`affinityAxis`初期化・週次適用ともに実装済みで、しかもspec記載の初期パラメータ(振幅±10、bondPull 0.08+0.06、距離50±10)から**さらに改訂されている**(実装は振幅±20`target(distance){return 50+20*Math.cos(...)}`relationships.js:149-152、bondPull 0.12+0.08 relationships.js:593)。コード内コメントは「bond-rebalance v2.3」という名称でこの改訂に言及しているが、`specs/`索引には対応するv1.1やv2.x版の相性軸specファイルが存在しない(索引テーブルには`relationship-affinity-spec-v1.0.md`のみ)。**仕様書のステータスヘッダーが古いまま**であり、実装が仕様を追い越している状態。CLAUDE.mdのspecs更新ルール（実装後にspecsを更新する）が守られていない具体例。
2. **AIロスターへのaffinityAxis未適用**(前述C節)。実装バグの疑いが強いが、テスト・spec双方に記載が無いため意図か過失か切り分けられない。相性軸によるbond個体差は事実上プレイヤーロスター内でしか機能していない。
3. **B3挑戦状のrivalry加算が二重**(前述A-5節 5-1)。`applyToRoster`での固定+8〜+12と、`applyMatchResult(isCrossOrg:true)`のM-01〜M-17群を同一試合に対して両方適用しているため、B3のrivalry増加量は他のcross-org経路(War代表戦など、applyMatchResultのみ)より底上げされている。仕様書(large-event-spec-v1.0.md等)にこの二重適用が意図として明記されているかは未確認。値が大きくなること自体が悪いわけではないが、改修時に「なぜB3だけ重い因縁がつくのか」を式で説明できる状態にはなっていない。
4. **factions.jsのコード内コメントと実際の定数値のドリフト**(前述A-2節)。`processFactionInfluenceOnRelationships`直上のコメント(bond+0.15等)とdata.js:1442-1450の実数値(bond+0.12等)が食い違っている。動作に影響はない(コードはdata.js側を読む)が、次回このコードを読む人がコメントを信じると誤った前提で調整してしまうリスクがある。
5. **`relationship-flags-spec-v1.0.md`は仕様側で既に「🟡 実装完了/頻度未達」と自己申告済み**(specs/relationship-flags-spec-v1.0.md:3)。F-5「ライバル同期」等rivalry軸と連動するフラグ層の発火頻度が設計目標に届いていない状態が続いている。今回の調査では発火頻度の再測定はしていない(auto-simにフラグ発火の計測フックがあるかは別途確認が必要)。

---

## 所見(改修の勘所)

- rivalryの増減経路は**極めて多く**(A節だけで実質40件以上)、かつ「初期化1回きり生成 → 試合ベースの積み上げ → 週次アンビエントの緩やかな減衰」という三層構造。改修時にどの層を触るかを最初に決めないと影響範囲が読めない。
- 「近い者同士」の判定はOVR近接が既に複数箇所(rivalry)に実装済みで、bond側には別建てのaffinityAxis(360°相性軸)が存在する。**trainCap近接は現状どこにも使われていない**ので、もしKeisukeの改修依頼の一つが「潜在能力が近い者同士をライバル化したい」というものなら、既存のFATED_RIVAL(newspaperフラグ)とOVR近接ロジック(C節)の両方を土台に設計する必要がある。fatedRivalsは数値に触れない演出専用フラグなので、rivalry軸を動かしたいなら新規に式を起こすか、既存のG-01/N-02パターン(年齢+OVR近接→rivalry+3〜+5)を流用するのが低コスト。
- レンタル選手は「試合では因縁が付くが日常システムからは見えない」という非対称設計。改修依頼にレンタル関連のものがあるなら、`isRental`除外がどの関数にあるかは本書のB節がそのままチェックリストになる。
- affinityAxisのAI団体側欠落(C節)は、意図的でないなら小さい修正で直る可能性がある一方、「プレイヤーvs他団体のbondに個体差を出したい」という要望が来たときに初めて顕在化するバグなので、関連改修に着手する前に一度Keisukeに意図確認したほうがよい。
- auto-simでrivalry軸自体の分布(帯域別ペア数・cross-org比率・レンタル比率)を見たい場合、現状のprobeでは代替できない。改修の前後比較で分布を見たいなら、auto-sim.js側に軽量な集計フックを別途足す設計が要る(今回は変更禁止のため未実施)。
