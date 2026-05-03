# F07 リーダー動向 — アーキタイプマトリクス仕様 v0.5

**ファイル**：`specs/faction-f07-variation-spec-v0.1.md`
**最終更新**：2026-05-01（v0.5 Phase B 実装完了）
**実装状況**：Phase A（共通フレーム化＋抽選）/ Phase B（セリフ段階投入＋UI 分岐＋結果モーダル新シグネチャ）実装完了。Phase C（DEMAND_MAIN 興行連動）/ Phase D（DEMAND_MONEY 給与改定 economy 接続）は未実装
**親仕様**：
- `specs/faction-system-spec-v0.1.md` §9.7
- `specs/faction-archetype-rework-spec-v0.1.md` v0.2

---

## 0. 改訂履歴

- v0.1 — 要求 7 種バリエーション案
- v0.2 — 要求型を絞り、観察型／インシデント型併設
- v0.3 — リーダー像をプレイヤー敬意ベースに再定義、メカニズム具体化
- v0.4（2026-05-01）— F07 を **全アーキタイプ共通フレーム** に再定義。AUTHORITY 専用イベントから「派閥動向イベント」へ拡張。チーム全体での発動レート抑制を導入。アーキタイプ × incidentType マトリクスで分岐
- **v0.5（2026-05-01）** — Phase A/B 実装完了。FACTION_CONFIG 9 項目追加、checkF07Conditions を v0.4 共通フレームに再構成、applyF07Choice を 12 種 incidentType × choice 分岐へ拡張、F07_LINES セリフテーブル新設（DEMAND_MAIN/OBSERVE_RIVAL_HEAT/INCIDENT_BOUNDARY フル品質、残り 9 種プレースホルダ）、showFactionF07Modal 刷新、showFactionEventResult 新シグネチャ（後方互換維持）。auto-sim 200 シーズン × seed 42 で violations 0/Game overs 0

---

## 1. F07 の位置付け再定義

旧仕様では F07 は「リーダーの横暴」であり、`authoritativeTag === true`（権威型）のみで発動するイベントだった。

v0.4 では：

- F07 は **全アーキタイプ共通の「派閥動向イベント」** に再定義
- イベント名（内部 ID）は F07 のまま、表示名は「派閥動向」もしくは incidentType 別の具体名（後述）
- 発動レートは **チームレベル** で抑制（派閥が増えても呼び出し総数が増えない）
- アーキタイプによって **利用可能な incidentType と トーン** が変わる

これにより：

- AUTHORITY が偏ってイベントを浴びる問題を解消
- 全派閥に同等の存在感を保証
- 派閥が増えても社長室呼び出し頻度が一定

## 2. 発動条件

```
F07 発動条件:
  - 派閥が成立している（archetypeId が設定済み）
  - リーダーの trust >= 60
  - チーム全体 F07 クールダウン 12 週経過
  - 派閥個別 F07 クールダウン 36 週経過
  - 同一 incidentType の連続出現禁止（直近2件）
  - 要求型サブクールダウン 32 週
  - DEMAND_MONEY 個別クールダウン 48 週
  - B 4 回累積 authoritativeTag 剥がし後 24 週は F07 抽選停止（旧 AUTHORITY 限定挙動の継承）
```

## 3. 発動派閥の選定アルゴリズム

毎週、F07 を発動するか抽選：

1. **チーム全体 F07 CD（12 週）** が経過していなければ skip
2. 経過していれば、`leader.trust >= 60` かつ個別 CD（36 週）経過済みの派閥群を抽出
3. 抽出された派閥群の中から **テンションスコア** で重み付き抽選：
   ```
   tensionScore = leader.trust × 0.3
                + (現週 - 派閥の最終 F07 発動週) × 0.5
                + アーキタイプ補正
   ```
4. アーキタイプ補正：
   - AUTHORITY: +10（リーダー絶対型は動きやすい）
   - COMBAT: +5（試合志向で外向きの動きが多い）
   - HEEL: +5（観客挑発含めて目立つ動きが多い）
   - その他: 0
5. 選ばれた派閥のアーキタイプから incidentType を抽選（§4 マトリクス）

これにより：
- チーム全体の F07 出現頻度は 12 週に 1 回に固定
- 派閥が増えても呼び出し回数は増えない
- 長期的に派閥間の存在感が均等化（最後の発動から時間が経つほど次に選ばれやすい）

## 4. アーキタイプ × incidentType マトリクス

各アーキタイプで利用可能な incidentType と重み：

| incidentType | AUTHORITY | BOND | MERIT | HEEL | FACE | COMBAT |
|---|---|---|---|---|---|---|
| DEMAND_MAIN | ✅ 10 | — | ✅ 14 | ✅ 12 | — | ✅ 14 |
| DEMAND_MONEY | ✅ 8 | ✅ 12 | — | — | ✅ 10 | — |
| DEMAND_ABSTRACT | ✅ 12 | — | — | — | — | — |
| DEMAND_RECOGNITION | — | ✅ 10 | ✅ 18 | — | ✅ 12 | — |
| OBSERVE_RIVAL_HEAT | ✅ 18 | — | ✅ 12 | ✅ 22 | — | ✅ 22 |
| OBSERVE_ABSENCE | ✅ 14 | ✅ 16 | ✅ 14 | ✅ 16 | ✅ 16 | ✅ 14 |
| OBSERVE_INTERNAL_RANK | — | — | ✅ 22 | — | — | — |
| OBSERVE_FAN_PRESSURE | — | — | — | ✅ 12 | ✅ 22 | — |
| OBSERVE_TRAINING_HARD | — | — | — | — | — | ✅ 18 |
| INCIDENT_BOUNDARY | ✅ 16 | ✅ 18 | ✅ 12 | ✅ 18 | ✅ 14 | ✅ 16 |
| INCIDENT_BONDING | ✅ 12 | ✅ 24 | — | ✅ 10 | ✅ 16 | ✅ 6 |
| INCIDENT_HEEL_PROVOKE | — | — | — | ✅ 10 | — | — |

各アーキタイプ列の合計が **おおむね 100** になるよう調整。これでアーキタイプを問わず同程度の頻度・分布で派閥動向イベントが発生する。

### 4.1 incidentType 一覧（v0.4 拡張）

#### 要求型（社長に相談・3択 or 2択）

| ID | 名称 | 該当アーキタイプ | 概要 |
|---|---|---|---|
| `DEMAND_MAIN` | メインカード相談 | AUTHORITY/MERIT/HEEL/COMBAT | 「次の興行、うちの子をメインに」 |
| `DEMAND_MONEY` | 待遇相談 | AUTHORITY/BOND/FACE | 「派閥メンバーの待遇を上げてほしい」 |
| `DEMAND_ABSTRACT` | 抽象的圧力 | AUTHORITY のみ | 「うちの子を大事にしろ」 |
| `DEMAND_RECOGNITION` | 評価要求 | BOND/MERIT/FACE | 「派閥の貢献に見合う扱いを」 |

#### 観察・報告型（コーチが社長に報告・3択）

| ID | 名称 | 該当アーキタイプ | 概要 |
|---|---|---|---|
| `OBSERVE_RIVAL_HEAT` | 派閥外への当たり | AUTHORITY/MERIT/HEEL/COMBAT | 派閥外選手への厳しさ・攻撃性 |
| `OBSERVE_ABSENCE` | 練習サボり | 全アーキタイプ | リーダーの練習欠席の連鎖 |
| `OBSERVE_INTERNAL_RANK` | 内部格付け争い | MERIT のみ | OVR 順位入れ替わりによる派閥内 rivalry |
| `OBSERVE_FAN_PRESSURE` | ファン期待のプレッシャー | HEEL/FACE | 観客評価による消耗 |
| `OBSERVE_TRAINING_HARD` | 過度な追い込み練習 | COMBAT のみ | 怪我リスクが高まる練習 |

#### インシデント型（既成事実型・コーチ報告・2択）

| ID | 名称 | 該当アーキタイプ | 概要 |
|---|---|---|---|
| `INCIDENT_BOUNDARY` | 派閥の壁 | 全アーキタイプ | ロッカー占有等で派閥外との壁 |
| `INCIDENT_BONDING` | 派閥内結束 | AUTHORITY/BOND/MERIT/HEEL/FACE/COMBAT | 派閥だけで打ち上げ等、外を疎外 |
| `INCIDENT_HEEL_PROVOKE` | 観客挑発エピソード | HEEL のみ | 試合外で観客を煽る言動 |

## 5. 選択肢の効果テーブルとメカニズム

### 5.1 要求型（3択）— A 選択時のメカニズム

#### `DEMAND_MAIN` A「相談に乗る」

- **挙動**：次の興行のメインカード提案で **当該派閥メンバーが提案リストの上位に表示**（リコメンド）
- **完全自動ではない**：社長は最終的に変更可能。確定したメインに当該派閥メンバーが含まれていない場合、軽い trust ペナルティ -3〜-5
- **実装**：`_pendingF07Directive = { factionId, type: 'DEMAND_MAIN', expiresAfterShows: 1 }`

#### `DEMAND_MONEY` A「待遇改善する」

- **挙動**：当該派閥メンバー全員の給与を **+10% 一律改定（即時反映）**
- **タイミング**：即時。契約交渉画面は出さない。結果モーダルに「派閥メンバー◯名の給与を一律 +10% 改定（合計支出 +○万/月）」を明記
- **巻き戻し**：次のオフシーズン契約交渉で個別に再交渉可能
- **個別 CD 48 週**

#### `DEMAND_ABSTRACT` A「権威を認める」

- v2.1 と同等。リーダー trust +5、非メンバー trust -3〜-6、ロッカー士気 -3〜-5、dictatorTag 付与（AUTHORITY 限定）

#### `DEMAND_RECOGNITION` A「派閥の貢献を認める」

- **挙動**：派閥メンバー全員の trust +3〜+5、ロッカー士気 +1〜+2
- **副次効果**：次の興行で派閥メンバーの紹介ナレーションが追加される（演出フック）
- 永続効果なし

### 5.2 観察型（3択）

| incidentType | A: 介入する | B: 黙認する | C: 別ルートで諭す |
|---|---|---|---|
| OBSERVE_RIVAL_HEAT | リーダー trust -3／対象 trust +5／派閥間 rivalry 微増 | リーダー trust +2／対象 trust -5／派閥外士気 -3 | リーダー trust -1／対象 trust +3／rebukeCount++ |
| OBSERVE_ABSENCE | リーダー trust -5／派閥メンバー trust -2／士気 +3 | リーダー trust +3／士気 -4 | リーダー trust -2／コーチ報告で個別ケア（リーダー condition +5、派閥外 trust +1〜2）|
| OBSERVE_INTERNAL_RANK | リーダー trust -2／派閥内 rivalry 解消／中位メンバー trust +3 | リーダー trust +1／派閥内 rivalry 維持／士気 -2 | rebukeCount++／派閥内 bond 微増 |
| OBSERVE_FAN_PRESSURE | リーダー trust -2／リーダー condition 回復 +5／興行集客一時微減（バランス）| リーダー trust +2／リーダー condition -3／継続不安 | リーダー condition +3／rebukeCount++ |
| OBSERVE_TRAINING_HARD | リーダー trust -3／派閥メンバー condition 回復 +3／momentum -2 | リーダー trust +2／派閥メンバー怪我リスク+／momentum +3 | リーダー trust -1／個別調整／rebukeCount++ |

### 5.3 インシデント型（2択）

| incidentType | A: 確認する／注意する | B: 流す／見守る |
|---|---|---|
| INCIDENT_BOUNDARY | リーダー trust -2／派閥外 trust +3／rebukeCount++ | リーダー trust +1／派閥内 trust +2／派閥外 trust -3 |
| INCIDENT_BONDING | リーダー trust -1／派閥内 trust -1／派閥外 trust +2 | リーダー trust +2／派閥内 trust +3／派閥外 trust -2 |
| INCIDENT_HEEL_PROVOKE | リーダー trust -3／興行集客一時微減／rebukeCount++ | リーダー trust +1／興行集客一時+／orgPop に微減リスク（一時的のみ） |

### 5.4 rebukeCount ロジック

- 観察型 C と INCIDENT_BOUNDARY A、INCIDENT_HEEL_PROVOKE A、OBSERVE_INTERNAL_RANK C、OBSERVE_FAN_PRESSURE C、OBSERVE_TRAINING_HARD C は rebukeCount を進める
- 4 累積で **authoritativeTag が剥がれる**（AUTHORITY のみ意味を持つ）
- 他アーキタイプでは「rebukeCount が積まれてアーキタイプ遷移しやすくなる」程度の意味（具体的な遷移ルールは archetype-rework-spec §6 参照）

## 6. 性格・属性別セリフテーブル

### 6.1 セリフの方向性

- **リーダー → 社長**：敬意ベース、お願い／相談／提案調。命令・威圧・無礼は禁止
- **リーダー → 派閥外選手**：派閥外への厳しさ・壁は OK（OBSERVE_RIVAL_HEAT 等）
- **リーダー → 派閥メンバー**：愛情・保護。これが裏返って外への壁になる
- **コーチ報告**：事実報告。リーダーの人格否定は避ける

### 6.2 セリフテーブル構造（v0.4 拡張）

```js
F07_LINES = {
  // 入口モーダル本文のリーダー直接セリフ（要求型）
  leaderDemand: {
    DEMAND_MAIN: { fiery: [...], composed: [...], grudging: [...], airy: [...], earnest: [...], flippant: [...] },
    DEMAND_MONEY: { ... },
    DEMAND_ABSTRACT: { ... },
    DEMAND_RECOGNITION: { ... },
  },

  // 入口モーダルのコーチ報告ナレーション（観察型・インシデント型）
  coachReport: {
    OBSERVE_RIVAL_HEAT: [...],
    OBSERVE_ABSENCE: [...],
    OBSERVE_INTERNAL_RANK: [...],
    OBSERVE_FAN_PRESSURE: [...],
    OBSERVE_TRAINING_HARD: [...],
    INCIDENT_BOUNDARY: [...],
    INCIDENT_BONDING: [...],
    INCIDENT_HEEL_PROVOKE: [...],
  },

  // 結果モーダルのリーダー反応セリフ
  resultLeader: {
    DEMAND_MAIN: { A: { fiery: [...], ... }, B: {...}, C: {...} },
    // ... 全 incidentType × choice × 性格 6種
  },

  // 結果モーダルの非メンバー／派閥外反応
  resultNonMember: {
    OBSERVE_RIVAL_HEAT: { A: {...}, B: {...}, C: {...} },
    // ... 観察型／インシデント型のみ
  },
}
```

### 6.3 アーキタイプ別トーン差し替え

同じ incidentType でも、アーキタイプによって意味付けと文言が変わる。

例：`OBSERVE_ABSENCE`（練習サボり連鎖）の場合
- AUTHORITY：リーダーが我が物顔でサボり、メンバーが追従
- BOND：リーダーが体調不良で休み、心配したメンバーも巻き込まれて練習が緩む
- MERIT：リーダーが個別練習に集中し道場練習に来ない
- HEEL：リーダーが団体内のお決まりを無視している
- FACE：リーダーが対外活動（メディア対応・ファンサ）で道場に来られない
- COMBAT：リーダーが怪我か独自トレーニング志向で道場練習に来ない

データ上は **incidentType × アーキタイプ × 性格** の 3 軸で文言を持つ。

### 6.4 一人称・口調の継承

性格別テーブルは性格傾向のひな型。最終的なセリフ生成時にキャラの一人称・語尾に置換（既存ヘルパー流用、`character-data-spec-v1.7.md` の口調設定継承）。

## 7. データ構造

### 7.1 FACTION_CONFIG 追加

```js
f07TeamCooldown: 12,
f07FactionCooldown: 36,
f07IncidentMatrix: {
  AUTHORITY: { DEMAND_MAIN: 10, DEMAND_MONEY: 8, DEMAND_ABSTRACT: 12, OBSERVE_RIVAL_HEAT: 18, OBSERVE_ABSENCE: 14, INCIDENT_BOUNDARY: 16, INCIDENT_BONDING: 12 },
  BOND:      { DEMAND_MONEY: 12, DEMAND_RECOGNITION: 10, OBSERVE_ABSENCE: 16, INCIDENT_BOUNDARY: 18, INCIDENT_BONDING: 24 },
  MERIT:     { DEMAND_MAIN: 14, DEMAND_RECOGNITION: 18, OBSERVE_RIVAL_HEAT: 12, OBSERVE_ABSENCE: 14, OBSERVE_INTERNAL_RANK: 22, INCIDENT_BOUNDARY: 12 },
  HEEL:      { DEMAND_MAIN: 12, OBSERVE_RIVAL_HEAT: 22, OBSERVE_ABSENCE: 16, OBSERVE_FAN_PRESSURE: 12, INCIDENT_BOUNDARY: 18, INCIDENT_BONDING: 10, INCIDENT_HEEL_PROVOKE: 10 },
  FACE:      { DEMAND_MONEY: 10, DEMAND_RECOGNITION: 12, OBSERVE_ABSENCE: 16, OBSERVE_FAN_PRESSURE: 22, INCIDENT_BOUNDARY: 14, INCIDENT_BONDING: 16 },
  COMBAT:    { DEMAND_MAIN: 14, OBSERVE_RIVAL_HEAT: 22, OBSERVE_ABSENCE: 14, OBSERVE_TRAINING_HARD: 18, INCIDENT_BOUNDARY: 16, INCIDENT_BONDING: 6 },
},
f07RecentIncidentKeep: 2,
f07DemandSubCooldown: 32,
f07DemandMoneyCooldown: 48,
f07PostRebukeQuiet: 24,
f07ArchetypeBias: { AUTHORITY: 10, COMBAT: 5, HEEL: 5, BOND: 0, MERIT: 0, FACE: 0 },
f07DemandMoneyMultiplier: 1.10,
```

### 7.2 payload 拡張

```js
{
  factionId, factionName, leaderId, leaderName, archetypeId,
  incidentType,
  incidentPayload,    // 対象選手ID／コーチID／対象派閥ID 等
  modalShape,         // 'choice3' | 'choice2'
}
```

### 7.3 派閥側状態

```js
faction._f07RecentIncidents: [...]
faction._f07DemandQuietUntil: 234
faction._f07DemandMoneyQuietUntil: 252
state._f07TeamCooldownUntil: 234
state._pendingF07Directive: { factionId, type: 'DEMAND_MAIN', expiresAfterShows: 1 }
```

## 8. UI（モーダル形状）

入口モーダル `modalShape`：

- `choice3`：要求型 + 観察型（A/B/C 3択）
- `choice2`：インシデント型（A/B 2択）

結果モーダルは `docs/ui/03-screens/faction-event-result.md` に従う。

### セリフ表示ルール（重要）

リーダー直訴セリフ（`leaderDemand`）は、**リーダー肖像の頭上に白い吹き出し**（`.fevt-leader-bubble`）で表示する。下段クリーム色パネル（`.fevt-quote.leader`）に speaker 名 + 本文を流す旧形式は使わない。レッスルマネージャー全体の「キャラのセリフは肖像頭上の吹き出しで出す」基本ルールに準拠（Common-1 派閥内対決の `.fc1m-bubble`、Glimpse Cascade の `.gc-bubble` と同系統）。`.fevt-observation-note` は社長視点ナレーション枠なのでセリフ用途に流用しない。

### 8.1 DEMAND_MONEY の結果モーダル特例

ImpactSummary に金額表示を必須化：

```
派閥メンバー 6名 の給与を +10% 改定
合計支出 +24万 / 月（年換算 +288万）
```

### 8.2 DEMAND_MAIN の興行編成画面表示

A 選択後、次回興行のメインカード提案に「F07 リーダー要求枠」のヒントバッジを出す。社長が外せば外せるが、外したまま興行確定すると軽いペナルティ（§5.1）。

## 9. 実装スコープ（段階）

### Phase A — 共通フレーム化と incidentType 抽選

- FACTION_CONFIG 拡張
- F07 発動条件改訂（archetypeId 必須化、authoritativeTag 制約削除）
- チーム全体 + 派閥個別 CD ロジック
- テンションスコアによる発動派閥選定
- アーキタイプ × incidentType マトリクス抽選
- applyF07Choice 拡張（type × choice 全分岐）

### Phase B — セリフ投入

- F07_LINES 全件投入（incidentType × アーキタイプ × 性格 × choice）
- showFactionF07Modal を modalShape 別に分岐
- 結果モーダルへの引き渡し（faction-event-result.md 連動）

### Phase C — DEMAND_MAIN 興行編成連動

- ui-render.js の興行編成提案フックでヒント表示
- 未充足ペナルティ処理

### Phase D — DEMAND_MONEY 給与改定連動

- 給与改定即時適用（economy 接続）
- ImpactSummary 金額表示
- 次オフシーズン契約交渉で巻き戻し可能なロジック

## 10. 検証計画

- auto-sim 200 シーズン × 5 シードで以下を計測：
  - F07 全体発動レートが約 12 週に 1 回に収まること
  - アーキタイプ別の incidentType 分布が §4 マトリクスに概ね沿うこと
  - 同一 incidentType の連続出現がないこと
  - 給与インフレが起きないこと（DEMAND_MONEY 48 週 CD で十分か）
- セリフ品質のレビューはユーザー委任：「リーダーがプレイヤーに敬意を保てているか」「派閥外への厳しさが浮いていないか」

## 11. 関連ファイル

- `specs/faction-system-spec-v0.1.md` §9.7（本仕様で改訂対象）
- `specs/faction-archetype-rework-spec-v0.1.md` v0.2（アーキタイプ判定）
- `specs/faction-common-events-spec-v0.1.md`（共通イベント Common-1/3/4/5/7、別系統）
- `specs/personality-archetype-spec-v1.0.md`
- `specs/character-data-spec-v1.7.md`
- `specs/contract-negotiation-spec-v2.0.md`（DEMAND_MONEY 巻き戻し連動先）
- `src/factions.js` rollWeeklyEvent / applyF07Choice
- `src/ui-common.js` showFactionF07Modal
- `src/data.js` F07_LINES（新規）
- `src/ui-render.js` 興行編成提案フック（Phase C）
- `docs/ui/03-screens/faction-event-result.md`

## 12. 未決事項

- マトリクス重みは Phase A 実装後の auto-sim で再調整
- コーチ報告ナレーションのコーチ性格別化の要否
- 観察型／インシデント型の対象選手選定アルゴリズム
- セリフ投入優先順位（incidentType × アーキタイプ × 性格 × choice の組み合わせは膨大）
- DEMAND_RECOGNITION のフレーバー強化（演出フック詳細）
