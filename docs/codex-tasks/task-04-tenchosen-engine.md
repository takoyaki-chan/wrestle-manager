# Codexタスク04: 天頂戦(C-6 4年に一度のPPVトーナメント) エンジン実装

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`
**変更してよいファイル**: `src/management.js` / `src/data.js` / `test/auto-sim.js` の3つのみ。
**変更禁止**: `src/app.js` / `src/ui-*.js` / `src/index.html` / `src/match-engine.js` / `src/victory-lines.js`(UIは別作業者が担当。衝突防止のため絶対に触らない)
**コミットはOK**(日本語の明確なメッセージで)。**pushは禁止**。

## 背景

女子プロレス団体経営SLG。4シーズンに一度(season%4===0)、Week 48 の年間最大イベント PPV GRAND FINAL が16名シングルエリミネーショントーナメント「天頂戦」に化ける。設計は確定済み(spec v0.5)。本タスクはエンジン側一式(開催判定/エントリー/トーナメント実行/報酬/関係性ドラマ判定/TV観戦/auto-sim)を実装する。UI(クライムライン画面)は別作業のため、**本タスクの成果物は §GameStateコントラクト どおりのデータを作ることが最重要**。

## 必読(実装前にこの順で読む)

1. `CLAUDE.md` — アーキテクチャ5原則(Engine純粋関数/GameState返却値更新/乱数シード一元管理/tickWeek統合)。プレイヤー向け文言に内部変数名(morale/orgPop/MQ/condition等)を出さない規則も必須
2. `specs/quadrennial-ppv-tournament-spec-v0.1.md` — 本タスクの仕様書 v0.5(全文。§2エントリー/§3形式・消耗/§4報酬/§5差分/§6.5関係性ドラマ)
3. `src/management.js` の既存PPV実装 — Week43エントリー〜Week48実行〜`applyPPVResults`/`PPV_PRIZE`/頂上決戦(summit)処理/TV観戦分岐。トーナメント年はこのフローからの分岐として実装する
4. `src/management.js` の `Engine.juniorTournament` — ブラケット生成・全ラウンド一括シミュレーション・`jtCarryHpPct`/`_hpOverride` による消耗持ち越しの雛形
5. `src/match-engine.js` の `Engine.wear`(変更禁止・使うだけ)と matchTier(tier2=ビッグマッチ)
6. `docs/quadrennial-drama-lines-draft-v0.1.md` — **承認済みセリフ91本**(data.jsへ定数化する。文言の改変禁止)
7. `src/relationships.js` の bond/rivalry 更新API(読むだけ。呼び出しはmanagement.js側から既存パターンに倣う)

## 実装仕様

### 開催判定・週次タイムライン

- トーナメント年 = `season % 4 === 0`。既存セーブは次の4の倍数シーズンから自然合流(マイグレーション不要)
- シーズン開幕時: 開催年予告ニュース(「今年は4年に一度の天頂戦の年」系)
- Week 43(既存PPVエントリーと同じフック位置): トーナメント年は天頂戦エントリーに差し替え
- Week 48: トーナメント実行(通常年の7試合+頂上決戦の代わりに15試合)。**頂上決戦は開催しない**(recordSummit系・summitニュースを通さない分岐を明確に)

### エントリー(spec §2 確定)

1. **特別招待2名(先行確定・団体枠消費なし)**: 個人ランキング1位 + 人気1位(全団体横断)
   - 「個人ランキング」の参照実体は既存実装を調査して最も自然なもの(選手ランキング/バトルポイント系)を選び、**報告に明記**
   - 同一人物なら人気2位繰り下げ。怪我/レンタル除外該当なら次点繰り上げ
2. **団体枠14名**: 団体順位で 5/4/3/2。特別招待2名を除いた選手から、王者自動エントリー・AI選出(OVR順)・除外条件は通常PPV準拠
   - プレイヤー団体枠は `ppvTournament.phase='entry'` でUI選択待ち(**weekPhaseは奪わない**。autumnWar方式)。未確定のままWeek 48に入ったら自動選出で自己修復
   - エンジンAPI: `Engine.ppvTournament.confirmPlayerEntries(state, fighterIds)`
3. ロスター不足団体は枠を上位団体に繰り上げ再配分

### トーナメント(spec §3 確定)

- シード = エントリー確定時 OVR順。標準ブラケット 1v16 / 8v9 / 4v13 / 5v12 / 2v15 / 7v10 / 3v14 / 6v11
- 1回戦の同団体対決は近傍シードスワップで可能な限り回避(JTに同種処理があれば流用)
- 15試合(1回戦8+準々4+準決2+決勝1)を **JT方式で一括シミュレーション**(UIが後からページングして見せる)
- 全試合 matchTier 2 / condition 初期80 / 怪我なし / roster本体のconditionには影響しない
- **消耗持ち越し**: `wear = Engine.wear.calc(...)` 基準で `12+(1-残HP率)×20` 相当、ラウンド間回復 = wear累計の 2/3、floor 50(spec §3.2)。JTの `jtCarryHpPct`/`_hpOverride` パターンを流用し、各試合の開始HP%を結果に記録(UIの「開始HP(N試合分持ち越し)」表示が使う)
- 因縁MQボーナス等の試合処理は通常PPV準拠

### ポイント・報酬(spec §4 確定)

- 対戦pt: **決勝のみ** 勝者+7/敗者-7(通常年の summit ±7 の載せ替え。1回戦〜準決勝は移動なし)
- シーズン実績: 優勝団体に 20pt、アイテムID `ppvT_${season}`(通常年の PPV 15pt は出さない)
- 殿堂: `calcHofPoints` に `type:'ppvTournament'` → 優勝 +8
- 賞金(プレイヤー団体所属選手のみ・国庫収入、PPV_PRIZE系と同様): 優勝¥3,000万 / 準優勝¥1,200万 / ベスト4 ¥500万×2名 / ベスト8以下なし。トーナメント年は既存 PPV_PRIZE の支払いを行わない
- `careerRecord.history`: 出場16名全員に `{ type:'ppvTournament', season, result:'champion'|'runnerUp'|'semiFinal'|'quarterFinal'|'firstRound' }`
- orgPop変動なし(合同大会・通常PPV準拠)

### 関係性ドラマ(spec §6.5 確定方針+暫定値)

大会終了時に候補ペアを判定し、**0〜2件**の `dramaEvents` を生成して bond/rivalry を適用する。**文脈がなければ0件でよい(演出フォールバック禁止)**。

| 分類key | 発火条件(暫定🔧) | 関係変化(暫定🔧) | セリフ役割 |
|---------|----------------|----------------|-----------|
| `epic`(名勝負) | 準決勝以上 かつ MQ≥90 かつ (既存bond≥15 or rivalry≥15 or MQ≥94) | 相互: rivalry+8 / bond+6 | 敗者=A + 勝者=B の対話 |
| `humiliation`(屈辱) | シード差6以上の番狂わせ敗北 かつ 敗者が上位シード | 片方向(敗者→勝者): rivalry+12 | 敗者=C のみ |
| `stablemate`(同門) | 同団体対決の実現(全ラウンド対象) | 亀裂: bond-8 / 深化: bond+8(既存bond≥25なら深化、それ未満は50%で亀裂🔧) | 亀裂=D / 深化=E(いずれも敗者) |

- 優先度: 決勝 > 準決勝 > それ以下。同一選手は1大会1件まで。上限2件
- **セリフ選択**: `docs/quadrennial-drama-lines-draft-v0.1.md` の91本を data.js に定数化(例: `TENCHOSEN_DRAMA_LINES = { A:{normal:[...],composed:[...],...}, B:{...}, C:{...}, D:{...}, E:{...} }`)。話者の archetype で引き、無ければ normal フォールバック
- **年齢条件**: 草案の【年齢条件】タグ付き行は、**話者または相手の年齢が30歳超なら選択肢から除外**(タグは定数化時にフラグ化し、本文には含めない)
- bond/rivalry の適用は relationships の既存更新パターン(`_applyAxisBetweenGroups` 等)に倣う
- `dramaEvents` はデータ生成のみ(モーダル表示はUI側)。適用済みフラグを持たせ、UI未実装環境でも二重適用しないこと

### TV観戦モード(orgPop<30)

- AI16名で開催し、全結果(勝者・MQ)+優勝者をデータとして残す(通常PPVのTV観戦分岐に準じる)。報酬なし。dramaEventsはプレイヤー選手不在なら生成しない🔧(生成する場合は報告)

### GameStateコントラクト(UI側が依存する。形を変える場合は報告に明記)

```js
state.ppvTournament = null | {
  season,                       // 開催シーズン
  phase: 'entry'|'ready'|'done',
  specialInvites: [ { id, orgId, kind: 'ranking'|'popularity' } ],   // 2名
  entries: [ { id, orgId, seed, special: null|'ranking'|'popularity' } ],  // 16名 seed昇順
  rounds: [                     // 実行後に4要素
    { name: 'firstRound'|'quarterFinal'|'semiFinal'|'final',
      matches: [ { left, right,               // trimmed fighter (JT準拠: id/name/ovr/orgId/_orgName等)
                   winnerId, mq, turns,
                   hpLeft, hpRight,           // JT準拠のHP構造
                   carryLeftPct, carryRightPct } ] }  // 開始HP%(1回戦=100)
  ],
  championId,
  dramaEvents: [ { class:'epic'|'humiliation'|'stablemate_rift'|'stablemate_bond',
                   matchRef:{round,index}, speakerId, targetId, mutual:bool,
                   lines:[{speakerId, role:'A'|'B'|'C'|'D'|'E', text}], applied:true } ],
  prizesPaid: bool
}
```

initialState に null 初期値。既存セーブにフィールドが無くても安全に動くこと(不在の説明文を出さない)。

### ニュース(data.js `NEWS_HEADLINE_TEMPLATES`)

- `tenchosenAnnounce`(開催年予告・シーズン開幕) / `tenchosenResult`(優勝) を各2案。**大会名は「天頂戦」、冠表記「全国女子プロレス最強王者決定戦」**。事実記述・格言禁止。ベルト/大会に「世界」を冠しない。週表記は「第48週」形式
- `Engine.newspaper.PRIORITY` 登録(結果はPPV級=既存PPV系と同等以上、予告は150前後)
- **文面は全文を報告に含める(レビューされる)**

### auto-sim対応(test/auto-sim.js)

- `ppvTournament.phase==='entry'` でプレイヤー団体枠を自動確定(OVR上位。springTag/autumnWarブロックと同型)
- トーナメント年のWeek 48分岐が通常PPV処理と衝突しないこと
- 統計: トーナメント開催回数/完走率、**決勝MQの平均・分布を通常年PPVメイン(頂上決戦)と比較出力**(floor50/回復2/3の較正材料。値の変更はせずレポートのみ)

## 検証(完了条件)

1. `node --check` が3ファイルとも通る
2. `node test/auto-sim.js 100 42` と `node test/auto-sim.js 100 7919` が **ALL CLEAR**(violations 0)
3. 4の倍数シーズンの天頂戦開催率が 1.00、非開催年は通常PPVが従来どおり
4. 春のタッグリーグ/4団体勝ち残り対抗戦/既存対抗戦の頻度・完走率にリグレッションなし
5. dramaEvents の発生率レポート(0件の大会が存在すること=常時発生になっていないこと)

## 報告事項

(1)変更ファイルと行数 (2)追加したEngine APIの一覧 (3)GameStateコントラクトとの差分(変えた場合) (4)「個人ランキング1位」の参照実体として選んだもの (5)ドラマ発火暫定値🔧の実測発生率(大会あたり平均件数・0件率) (6)決勝MQ分布 vs 通常年PPV比較 (7)ニュース文面の全文 (8)auto-sim結果(上記5項目) (9)仕様と違う判断をした箇所
