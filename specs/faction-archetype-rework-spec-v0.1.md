# 派閥アーキタイプ再設計仕様 v0.4

**ファイル**：`specs/faction-archetype-rework-spec-v0.1.md`
**最終更新**：2026-05-01（v0.4 §6 FACE⇄HEEL 遷移 実装完了）
**実装状況**：Phase A/B + §6 全 4 遷移パターン実装完了（AUTHORITY→BOND/MERIT、COMBAT→BOND、FACE→HEEL、HEEL→FACE）
**親仕様**：`specs/faction-system-spec-v0.1.md` §9.1（F01 派閥成立）
**関連仕様**：
- `specs/faction-f07-variation-spec-v0.1.md`（F07 共通フレーム）
- `specs/faction-common-events-spec-v0.1.md`（共通イベント）

---

## 0. 改訂履歴

- v0.1（2026-05-01）— 5 アーキタイプ案（AUTHORITY/BOND/DEVELOPMENT/COMBAT/LOWKEY）。既決の 4 種（権威型/実力主義/結束型/自然型）と整合せず破棄
- v0.2（2026-05-01）— 既存モックアップ確認＋ Keisuke レビューに基づき **6 アーキタイプに確定**：権威型／結束型／実力主義／ヒール派閥／正統派／武闘派。「自然型」は無個性のため削除
- v0.3（2026-05-01）— §6 アーキタイプ遷移ロジック実装完了。`createFaction` で archetypeId 設定、F07 rebuke 4 累積（AUTHORITY→BOND/MERIT 後継幹部性格分岐）、F02 完全敗北（COMBAT→BOND）の 3 遷移を実装。FACE⇄HEEL は heelAlignment フィールド未導入のため別 Phase に切り出し
- **v0.4（2026-05-01）** — §6 FACE⇄HEEL 遷移 実装完了。`heelAlignment` フィールド（0-100、レイジー初期化）追加、派閥メンバーは派閥アーキタイプの理想値（HEEL=75 / FACE=25 / それ以外=50）へ週次 0.05 倍ドリフト。FACE/HEEL 派閥のみ平均 heelAlignment が閾値（FACE→HEEL=65、HEEL→FACE=35）を 24 週連続超で遷移、遷移後 36 週は再判定 CD。`FACTION_TRANSITION_LINES.FACE_TO_HEEL_DRIFT` / `HEEL_TO_FACE_DRIFT` に各 6 性格 = 12 行投入

---

## 1. 背景

現状の派閥システムは [specs/faction-system-spec-v0.1.md §1.1](faction-system-spec-v0.1.md) で `type: 'loyal' | 'rivalrous'` の 2 種、タグは `authoritativeTag`（F01-A で付与）と `dictatorTag`（F07-A 累積で付与）の 2 種のみ。

そのため：

- F01 で A を選ぶと **100% 権威型** になる（A/C の 2 経路のうち A が権威型固定）
- 第一・第二派閥が両方権威型になりがち
- F07 が AUTHORITY だけに発動する設計だと、権威型の存在感が他派閥より強くなる
- 派閥の個性が「権威かそうでないか」しか分岐しない

過去のモックアップ（[mockup-faction-screen-v0.3.html](../docs/ui/mockups/mockup-faction-screen-v0.3.html) 等）では既に「権威型／実力主義／結束型」のタグが描かれており、設計の意図は複数アーキタイプの併存にあった。本仕様でこれを正式化し、**6 アーキタイプ排他制** に拡張する。

## 2. アーキタイプ 6 種（確定）

| archetypeId | 表示名 | コア |
|---|---|---|
| `AUTHORITY` | 権威型 | リーダー絶対の上下構造 |
| `BOND` | 結束型 | メンバー間の横の絆、家族的・内向き |
| `MERIT` | 実力主義 | OVR を文化として意識する選別主義 |
| `HEEL` | ヒール派閥 | ヒール属性集団、観客挑発、反主流 |
| `FACE` | 正統派 | ベビーフェイス属性、王道、団体の顔 |
| `COMBAT` | 武闘派 | 試合志向、闘争本能 |

1 派閥は **同時に 1 アーキタイプのみ** を持つ（排他）。

### 2.1 各アーキタイプの素描

#### ① AUTHORITY 権威型

| 軸 | 内容 |
|---|---|
| 集まる選手 | リーダー方向の bond が高い／追従気質／性格は実直・天真・苛烈の従う側 |
| リーダー | 高 OVR、カリスマ、性格＝苛烈 or 陰湿 |
| 行動の偏り | リーダーの方針に追従／リーダーの試合に派閥全員同行・応援／内部対立はリーダーが押さえ込む |
| 特徴 | bond リーダー → メンバー一方向、トップダウン、外への壁が厚い |
| 専用イベント方向 | リーダー横暴（F07）、後継問題、独裁化崩壊 |
| 有利 | リーダーが強ければ結束力高／メンバー離脱が起きにくい |
| 不利 | リーダー喪失で機能停止／ロッカー士気にマイナス／新規勧誘しにくい |

#### ② BOND 結束型

| 軸 | 内容 |
|---|---|
| 集まる選手 | 性格＝鷹揚・実直、メンバー間 bond が対称的に高い、年代・同期が近い |
| リーダー | 不在でも回る、いても調整役、性格＝鷹揚・実直 |
| 行動の偏り | 全員で練習／打ち上げ参加／個別の試合に派閥全員応援／衝突はメンバー同士で解決 |
| 特徴 | bond 全方向対称、ロッカー士気プラス、内部対立が起きにくい、外への攻撃性ほぼゼロ |
| 専用イベント方向 | 仲間のために、緩衝役、共闘 |
| 有利 | ロッカー士気プラス／長期定着／F02 抗争に巻き込まれにくい |
| 不利 | 試合の突き抜けが弱い／判断遅い／規模拡大しにくい |

#### ③ MERIT 実力主義（フレーバー寄り）

| 軸 | 内容 |
|---|---|
| 集まる選手 | OVR 中堅以上（他と同条件）、自負心強め、性格＝苛烈・実直多め |
| リーダー | OVR 上位（他と同条件）、性格＝苛烈、自分より下を認めない気質 |
| 行動の偏り | 練習量が多い／メイン要求はする（権威型と異なり「実力で示すべき」と主張）／OVR 差が話題になる／結果を出さなかったメンバーへの当たりが強い |
| 特徴 | **OVR 数値ハードルは設けず、文化として OVR を意識**。bond は対称だが冷たい（敬意ベース）。新陳代謝が起きにくい |
| 専用イベント方向 | 格付けの揺らぎ、拒絶される加入希望、衰えの自然離脱 |
| 有利 | リーダー強ければ安定／試合の積み重ねで派閥評価上昇 |
| 不利 | メンバー定着率低／衰えに居場所がない／成長中の若手が加入できない |
| **重要原則** | **戦力面のボーナスは付けない**。違いは「派閥文化として OVR を気にする」点のみ |

#### ④ HEEL ヒール派閥

| 軸 | 内容 |
|---|---|
| 集まる選手 | `heelAlignment` 高め（バイアス、必須ではない）／性格＝苛烈・陰湿・飄々／観客への意識強い |
| リーダー | `heelAlignment` 50 以上が望ましい／カリスマヒール／性格＝苛烈 or 陰湿 |
| 行動の偏り | 観客挑発／反則じみた試合運び／別派閥への攻撃的言動／ベビー派閥との因縁を作る |
| 特徴 | 観客の盛り上がり（歓声＋ブーイング）、団体内に明確な敵対構図、ドラマの核 |
| 専用イベント方向 | ヒール宣言、観客挑発エピソード、ベビー派閥との因縁 |
| 有利 | 興行集客の一時増加（**MQ ボーナス強化はしない**）／ドラマの起点 |
| 不利 | コアファン以外の離反リスク／メディア・スポンサー関係に微悪影響 |

#### ⑤ FACE 正統派（ベビーフェイス）

| 軸 | 内容 |
|---|---|
| 集まる選手 | `heelAlignment` 低め（バイアス、必須ではない）／性格＝鷹揚・実直・天真／人気上位 |
| リーダー | `heelAlignment` 40 以下が望ましい／団体の看板／性格＝鷹揚・実直 |
| 行動の偏り | ファンサービス重視／王道試合運び／メディア露出積極／新人引き上げ |
| 特徴 | 団体の顔、ヒール派閥と対になることで観客盛り上がり、新人勧誘窓口 |
| 専用イベント方向 | 王道宣言、ファン感謝、看板を背負う重さ |
| 有利 | 興行集客の一時増加／メディア露出収益（一時収入）／新人勧誘ボーナス |
| 不利 | ヒール派閥との抗争で消耗／自由度が低い／突き抜ける選手が出にくい |
| **注記** | **「永続的な orgPop ブースト」は付けない**。集客・収入は一時的なものに限定 |

#### ⑥ COMBAT 武闘派

| 軸 | 内容 |
|---|---|
| 集まる選手 | 性格＝苛烈・飄々／momentum 高め（バイアス）／攻撃志向／打撃系・激しい技 |
| リーダー | momentum 高／性格＝苛烈／試合で結果を出すことが正義 |
| 行動の偏り | 試合志向（経営や政治には興味なし）／rivalry を歓迎／道場破り・殴り込み志願／練習も激しい |
| 特徴 | momentum 獲得効率高、別派閥への rivalry が生まれやすい、F02 抗争・F08 直接対決の主役 |
| 専用イベント方向 | 道場破り宣言、殴り込み志願、抗争点火 |
| 有利 | 抗争での勝率／momentum 持続力 |
| 不利 | 怪我リスク高／内部 rivalry も生まれやすい／ロッカー士気にマイナス／長期戦略が立たない |

### 2.2 期待出現比率（性格分布均等仮定）

性格別重み（§3.1）から計算した理論期待値：

- AUTHORITY 約 16%
- BOND 約 22%
- MERIT 約 16%
- HEEL 約 16%
- FACE 約 16%
- COMBAT 約 14%

実際の団体は性格分布に偏りがあるが、おおむね **どのアーキタイプも 14〜22%** の範囲に収まる。権威型偏重は解消される。

## 3. 設計原則（OVR の扱い）

### 3.1 ハード条件（必須・全アーキタイプ共通）

| 階層 | 条件 |
|---|---|
| リーダー OVR | 団体内 **上位 25%** |
| メンバー OVR | **60 以上** |

これにより、どのアーキタイプの派閥同士でも抗争が成立する戦力を担保する。

### 3.2 アーキタイプ属性（確率バイアス・ソフト条件）

属性は **加入確率・形成判定の重み付け** に使う。ハードな足切りはしない：

| アーキタイプ | バイアス対象 |
|---|---|
| 権威型 | リーダー方向 bond の集中／追従気質（性格） |
| 結束型 | メンバー間 bond の対称性／性格 鷹揚・実直 |
| 実力主義 | クラスタ内 OVR 分散の小ささ／性格 苛烈・実直 |
| ヒール派閥 | 平均 heelAlignment 高／性格 苛烈・陰湿・飄々 |
| 正統派 | 平均 heelAlignment 低／性格 鷹揚・実直・天真 |
| 武闘派 | 平均 momentum 高／性格 苛烈・飄々 |

属性が真逆のキャラも稀に加入する（基準確率の 15% 程度）。これにより派閥内に多様性が生まれ、「ヒール派閥に所属する珍しいベビー寄りの選手」のようなドラマの素地が出る。

### 3.3 実力主義の特例

実力主義は他のアーキタイプと **同じ OVR 条件**（リーダー上位 25%、メンバー 60+）。違いは：

- **戦力ボーナスを付けない**（OVR ゲーム化を避ける）
- 違いは **派閥文化** にとどめる：OVR 差が話題になる、結果を出さなかったメンバーへの当たりが強い、新参者の OVR チェックが厳しい等
- **形成バイアス**：クラスタ内の OVR 分散が小さい（似た強さの集団）かつ性格 苛烈・実直多めのとき出現しやすい

これにより：
- 実力主義に所属しても勝てるわけではない（OVR ゲーム化を回避）
- 発生率を特別に抑制する必要も薄れる（戦力面で他と差がない）

## 4. アーキタイプ自動決定ロジック

F01 発動時、以下の手順でアーキタイプを決定：

### 4.1 リーダー候補の選出

クラスタ内で **OVR が団体上位 25% 以内** の fighter を候補にする。複数いれば §4.2 の判定で属性適合度が最も高い者をリーダーに。

### 4.2 アーキタイプ判定アルゴリズム

クラスタ全体の特徴量を計算：

```
features = {
  bondAsymmetry: リーダー → メンバー方向の bond 集中度（0〜1）
  bondSymmetry: メンバー間 bond の対称性（0〜1）
  ovrVariance: クラスタ内 OVR の分散（標準偏差）
  avgHeelAlignment: クラスタ平均 heelAlignment（0〜100）
  avgMomentum: クラスタ平均 momentum（-100〜100）
  personalityComposition: 性格分布の重み
}
```

各アーキタイプのスコアを §3.2 のバイアスから算出し、**最高スコアのアーキタイプ** を採用。スコアが拮抗する場合の優先順位：

```
HEEL / FACE > MERIT > COMBAT > AUTHORITY > BOND
```

属性が明確（heelAlignment 高低、OVR 分散小、momentum 高）な方を優先。AUTHORITY/BOND は「他のどれにも当てはまらないとき」のフォールバック扱いになる。

## 5. F01 の 3 択構造の再定義

3 択 A/B/C の意味は **維持**。ただし A の効果はアーキタイプにより変わる。

### 5.1 入口モーダル文面

抽選で決まったアーキタイプに応じて、F01 入口モーダルの本文・選択肢文言が変わる。

例：抽選結果＝COMBAT の場合：

```
${leaderName}を中心に、攻めの姿勢を共有する集まりが生まれようとしている。
これは、メインを取りに行く派閥になりそうだ。

A: 旗揚げを後押しする（武闘派として承認、combatTag 付与）
B: 釘を刺す（旗揚げを止める）
C: 静かに見守る（自然な集まりとして任せる、タグなし）
```

### 5.2 A 選択時の効果（アーキタイプ別）

| アーキタイプ | A 効果（共通：派閥成立、リーダー trust +5〜+8） |
|---|---|
| AUTHORITY | authoritativeTag、bond リーダー→メンバー +3〜+5、ロッカー士気 -2〜-4 |
| BOND | bondTag、メンバー間 bond +5〜+8（対称）、ロッカー士気 +1〜+2 |
| MERIT | meritTag、メンバー間 bond +2〜+3（敬意ベース、控えめ）、ロッカー士気 -1〜-2 |
| HEEL | heelTag、メンバー間 bond +3〜+4、興行集客一時+ |
| FACE | faceTag、メンバー間 bond +3〜+4、興行集客一時+、メディア露出収益（一時収入） |
| COMBAT | combatTag、リーダー momentum +5、派閥外 rivalry が生まれやすくなる、ロッカー士気 -1〜-2 |

**注**：FACE/HEEL の「興行集客一時+」は次回興行 1 回限り。永続的な orgPop ブーストは付けない。

### 5.3 B/C 選択時の効果

- **B**：v2.1 と同じ。派閥不成立、リーダー trust -5〜-8、12 週 CD
- **C**：派閥成立だがアーキタイプ専用タグなし。アーキタイプ ID は内部記録のみ

## 6. アーキタイプ遷移

派閥のアーキタイプは原則固定だが、以下で遷移：

- **【実装済】** F07 rebuke 4 回累積 → AUTHORITY → BOND or MERIT（後継幹部の性格による分岐：fiery/grudging/bold/emotional 多数なら MERIT、それ以外 BOND）
- **【上記に統合】** F07 C → AUTHORITY → MERIT or BOND（rebuke 4 累積の判定で代替）
- **【実装済】** F02 抗争で完全敗北 → COMBAT → BOND（闘争心が萎えて結束へ）
- **【実装済 v0.4】** メンバーの平均 heelAlignment が長期上昇/下降 → FACE ⇄ HEEL：
  - `heelAlignment` 0-100、未設定時は role + personality + traits からレイジー算出（Heel=70 / Babyface=30 / Neutral=50 を基点に、bold/emotional/ヒール適性 等で増減）
  - 派閥メンバーは派閥アーキタイプの理想値（HEEL=75 / FACE=25 / それ以外=50）へ週次 5% ドリフト（slow conformity）
  - FACE/HEEL 派閥でメンバー平均が閾値超を 24 週連続維持で遷移発火。遷移後 36 週は再判定 CD
  - `Engine.factions.driftHeelAlignmentWeekly(state)` / `checkAlignmentTransition(state)` を tickWeek 派閥パイプラインの末尾で実行

遷移時はナレーションを出す（`showFactionArchetypeTransitionModal` で包括的に表現）。
遷移ナレーションは `FACTION_TRANSITION_LINES`（reason × 性格 6 種）で性格ごとに温度を書き分け。
実装：
- `Engine.factions._applyArchetypeTransition(state, factionId, toArchetype, ctx)` — flavor / archetypeId / 6 タグ群の整理 + `_pendingArchetypeTransitions` キュー push
- `Engine.factions.getTransitionLine(reasonKey, leader, vars)` — `{leaderLine, narration}` を返す
- `App._drainArchetypeTransitions()` — processWeek / finalizeShow 双方から呼ばれて消化

## 7. データ構造

### 7.1 Faction オブジェクト拡張

```js
{
  id, name, leaderId, memberIds, type, ...
  archetypeId,            // ← NEW: 'AUTHORITY' | 'BOND' | 'MERIT' | 'HEEL' | 'FACE' | 'COMBAT'
  authoritativeTag,       // archetypeId === 'AUTHORITY' のとき true（互換維持）
  bondTag, meritTag, heelTag, faceTag, combatTag,
  // 既存フィールドは維持
}
```

### 7.2 FACTION_CONFIG 追加

```js
archetypeBiasWeights: {
  AUTHORITY: { bondAsymmetry: 0.6, personalityFiery: 0.2, personalityGrudging: 0.2 },
  BOND:      { bondSymmetry: 0.7, personalityComposed: 0.15, personalityEarnest: 0.15 },
  MERIT:     { ovrVarianceLow: 0.5, personalityFiery: 0.25, personalityEarnest: 0.25 },
  HEEL:      { avgHeelAlignmentHigh: 0.6, personalityFiery: 0.15, personalityGrudging: 0.15, personalityFlippant: 0.10 },
  FACE:      { avgHeelAlignmentLow: 0.6, personalityComposed: 0.2, personalityEarnest: 0.1, personalityAiry: 0.1 },
  COMBAT:    { avgMomentumHigh: 0.5, personalityFiery: 0.3, personalityFlippant: 0.2 },
},
archetypeFallbackPriority: ['HEEL', 'FACE', 'MERIT', 'COMBAT', 'AUTHORITY', 'BOND'],
joinAffinityCurve: {
  fullMatch: 1.00,
  partialMatch: 0.50,
  oppositeMatch: 0.15,
},
```

### 7.3 createFaction シグネチャ拡張

```js
createFaction(state, leaderId, members, {
  type,
  archetypeId,    // ← NEW（必須）
  authoritativeTag, bondTag, meritTag, heelTag, faceTag, combatTag,
})
```

## 8. 加入判定への適用（派閥成立後）

派閥が成立した後の新規加入時は、属性適合度 × 基準確率：

| 属性適合度 | 加入確率 |
|---|---|
| 完全に合う（属性スコア 0.7 以上） | 基準値 × 1.00 |
| 中程度（属性スコア 0.4〜0.7） | 基準値 × 0.50 |
| 真逆（属性スコア 0.4 未満） | 基準値 × 0.15 |

これにより、派閥は属性に色付いているが内部にバリエーションがある状態を保つ。

## 9. UI 表示

### 9.1 派閥詳細画面

派閥カードと詳細画面に **アーキタイプバッジ** を表示。バッジ色（既存モックアップ準拠）：

| アーキタイプ | バッジ色 |
|---|---|
| AUTHORITY | 濃赤（auth） |
| BOND | 青緑 |
| MERIT | 黄 |
| HEEL | 紫 |
| FACE | 水色 |
| COMBAT | 橙 |

### 9.2 F01 入口モーダル

§5.1 で示した通り、抽選アーキタイプによって本文と A/C の補足文が変わる。アーキタイプ別 1〜2 文の前置きを置く（「これは、メインを取りに行く派閥になりそうだ」「これは、王道を貫く派閥になりそうだ」など）。

## 10. 実装スコープ（段階）

### Phase A — アーキタイプ判定と内部タグ管理（最小スコープ）

- FACTION_CONFIG にアーキタイプ重み追加
- F01 発動時にアーキタイプ判定アルゴリズム実装
- createFaction を archetypeId 必須に拡張
- F01 入口モーダルにアーキタイプ別前置き文
- 派閥詳細画面にアーキタイプバッジ表示
- アーキタイプ別 A 選択時効果（§5.2）

### Phase B — 加入判定への適用 + アーキタイプ遷移

- 派閥加入時の属性適合度判定
- アーキタイプ遷移ロジック（§6）

### Phase C — F07 共通フレーム化（別仕様）

- `faction-f07-variation-spec-v0.1.md` v0.4 に基づき F07 をアーキタイプ × incidentType マトリクスに対応

### Phase D — 共通イベント実装（別仕様）

- `faction-common-events-spec-v0.1.md` に基づき Common-1/3/4/5/7 を実装

### Phase E — アーキタイプ別専用イベント（稀少）

- 各アーキタイプ 2〜3 個のシグネチャイベント（faction-events-spec の追記または別仕様）

## 11. 既存データの移行

実装時点で既に存在する派閥データには `archetypeId` が無い。マイグレーション：

- `authoritativeTag === true` の既存派閥 → `archetypeId = 'AUTHORITY'`
- `authoritativeTag !== true` の既存派閥 → §4.2 のアルゴリズムで一回判定し対応する専用タグを立てる
- セーブデータバージョンを上げて 1 回だけ自動適用

## 12. 検証計画

- auto-sim 200 シーズン × 5 シードで以下を計測：
  - アーキタイプ分布が §2.2 の期待値に近いこと（団体の性格偏りで多少ずれるのは許容）
  - 各アーキタイプの比率が 14〜22% に収まっていること（権威型偏重がないこと）
  - F07 発動頻度がアーキタイプ別に過度に偏らないこと
  - アーキタイプ遷移が破綻なく動くこと

## 13. 関連ファイル

- `specs/faction-system-spec-v0.1.md` §9.1（本仕様で改訂対象）
- `specs/faction-f07-variation-spec-v0.1.md` v0.4（F07 アーキタイプマトリクス対応）
- `specs/faction-common-events-spec-v0.1.md`（共通イベント Common-1/3/4/5/7）
- `specs/personality-archetype-spec-v1.0.md`（性格 6 種の参照）
- `src/factions.js` rollWeeklyEvent / applyF01Choice / createFaction
- `src/ui-common.js` showFactionF01Modal
- `src/ui-render.js` 派閥詳細画面
- `src/data.js` FACTION_CONFIG.archetypeBiasWeights（新規）

## 14. 未決事項

- アーキタイプバイアス重みは Phase A 実装後の auto-sim で再調整
- アーキタイプ遷移の演出（モーダル？ティッカー通知？）
- アーキタイプ別 A 選択時の効果数値（§5.2）の具体値は実装時に再調整
- 加入判定の属性スコア計算式（§3.2 + §8）の具体的な実装
