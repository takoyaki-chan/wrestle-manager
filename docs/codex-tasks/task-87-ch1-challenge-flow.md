# task-87: CH-1 挑戦フロー改修 — 直訴+同行選択の統合 / 果たし状画面 / sendoffのOffice化

- 起票: 2026-08-12(Fable) / 裁定: 同日Keisuke(全4点+追裁定確定・モックに刻印済み)
- 作業場所: `C:\Users\nkmrk\Downloads\wrestle-manager-codex`(ブランチ `codex/agent-workspace`)。mainフォルダは触らない
- 依存: task-86と同一ファイル群を触るため、**task-86のマージ後に着手**する(--accent-war系トークンを本タスクでも使う)

## 1. 目的

選手発の団体戦挑戦(3人制シングル3連戦)のフローを裁定どおりに改修する: ①直訴画面に同行2名選択を統合(3枚→2枚) ②相手発の挑戦状を「果たし状」画面(黒Stage+赤+敵隊列)へ差し替え ③送り出しをOffice書式へ。

## 2. 仕様の正

1. `docs/ui/mockups/ch1-petition-unified-v0.1.html` — **画面の正**。「案A: 挑む」=直訴+同行ピッカー統合の完成形/「迎撃」=果たし状画面の完成形/「判断メモ」=裁定一覧(全点確定済み)
2. `docs/dialogue/faction-ignite-and-challenge-lines-draft-v0.1.md` **場面3**(挑戦状の口上21本。**承認済み・一字一句変更禁止**)
3. `docs/ui/mockup-baseline-v0.1.md` §2/§2-B/§3/§4、`docs/ui/01-foundations.md` 原則11
4. 現行実装の入口: `showChallengeRequestModal`(src/ui-common.js 11915付近)/`showAwayTeamPickModal`(12086)/`showChallengeSendoffModal`(12622)/`App.handleChallengeRequest`(src/app.js 12417-12569)

## 3. 実装項目

### A. 直訴画面(forward)に同行2名ピッカーを統合

- モック案Aの「🚌 同行する2名を選ぶ」ブロックを、既存の直訴モーダル(`.fc1m-rivalry`行の下・決裁トレイの上)へ追加
- 候補の資格判定は**現行`showAwayTeamPickModal`の候補ロジックをそのまま流用**(負傷/休養/謹慎/レンタル除外・発起人本人除外)。チップは**upper 46×66**+名前+OVR、選択2名でゴールド枠+✓
- **2名選択が揃うまでYES(A)は`label-disabled`**。B(断る)は常時押せる
- YES時は選択2名を現行と同じフィールド(`_pendingAwayChallengeMatch`系の同行者格納先)へ書き、`showAwayTeamPickModal`の呼び出しを外す(関数自体は削除。参照が他に無いことをgrepで確認)
- inverse(相手発)ではこのブロックを出さない

### B. 果たし状画面(inverse)を新設・差し替え

- **新共通コンポーネント** `showHostileArrivalStage(opts)` を作る(将来「相手発の突発バトルイベント」全般で使い回すため。Keisuke 08-12「共通の仕様としてありかな」):
  - opts: `{ title, subLabel, speakerLabel, line, members: [{id, name, roleLabel}], orgBadge: {orgId, orgName}, facts: [], choices: [{letter, label, hint}], onChoice }`
  - 見た目はモック「迎撃」ビューの`.inv-*`が正: 黒メイン+赤(--accent-war系)/タイトル明朝・赤グラデ/話者ラベル+クリーム吹き出し(名前は吹き出しの外)/**敵隊列=upper L 150×224・-18px重ね・群外枠1つ・drop-shadow**/団体バッジ(実エンブレム)/定性facts/黒地の決裁カード
  - **人数可変(1〜5人)で崩れないこと**(メンバー1人でも枠・重ねが破綻しない)
  - 進行の保険: §5-D鉄則 — onChoiceはちょうど1回/二重起動防止フラグ/オーバーレイはボタンでのみ閉じる
- 相手発の挑戦状(`_inverse`分岐)をこのコンポーネント呼び出しへ差し替え。タイトル「果 た し 状」/sub「CHALLENGE ARRIVED ・ 3人制シングル3連戦 ・ WEEK {n}」/choices=A「受けて立つ」・B「お引き取り願う」(効果は現行のYES/NOと同一)
- **相手3名の確定**: 現行エンジンが発起人しか決めていない場合、発火時に同団体から**残り2名をOVR上位で選出**(負傷・引退除外)して`members`に渡す処理を**relationships.jsのchallengeRequest系に追加**。すでに3名決まっているならそれを使う。※対戦カード自体の組み方(上位3試合ロック)は変えない
- **口上セリフ**: 新テーブル `CHALLENGE_ARRIVAL_LINES`(src/data.js、archetype単軸7種×3本=草案場面3を一字一句)+`EVENT_LINES_BY_KEY.challengeArrival`+Nodeエクスポート。話者=発起人のarchetypeで引き、derive選択。現行の`CHALLENGE_GROUP_PETITION_LINES`流用(向き矛盾)をここで解消
- 受諾後の`showEventPopup`受理通知(app.js 12476付近)は**inverse側では廃止**してよい(果たし状画面が受理の演出を兼ねる)。forward側は現状維持

### C. sendoff(送り出し)のOffice化

- `showChallengeSendoffModal`をmdl-a枠から**Office書式(fevt-report-card型)**へ。追加する情報: 行き先(相手団体バッジ・実エンブレム)+**遠征3人の顔(upperチップ46×66の隊列)**。発起人の頭上吹き出し(既存`CHALLENGE_LINES.*.sendoff`のまま)と「— 送 り 出 す —」ボタンは維持
- 直訴→sendoffの間にあった同行選択画面が消えるので、フロー全体は 直訴(統合)→sendoff の2枚になる

### D. スコープ外(やらない)

- petitionセリフ102本の復活改修 — 別途Opus起案→Keisukeレビュー後のデータ差し替え(当面は現行`CHALLENGE_GROUP_PETITION_LINES`のまま)
- B3挑戦状への果たし状フォーマット適用 — 別判断
- 結果画面`.crrm-*`のu3b寄せ — 余力があれば別コミットで可(必須ではない)

## 4. 数値目標と不変条件(対。マージ前にFableが1つずつ検算する)

| 目標 | 不変条件 |
|---|---|
| 画面枚数 3→2 | **I-1**: 挑戦の発生条件・heat式・CD(選手24週/ペア36週/NO52週)・クォータ(季2件/同一団体1件)・8週失効は無変更。**同一シードauto-sim fingerprintが前後で完全一致**(相手3名選出を発火時に追加する場合も、選出はderiveローカルRNGで行い本流の乱数消費を増やさない) |
| ピッカー統合 | **I-2**: 同行候補の資格判定が現行`showAwayTeamPickModal`と同一集合(除外条件の増減なし) |
| 果たし状画面 | **I-3**: 受諾/拒否の効果(予約フィールド・上位3試合ロック・関係値変化)は現行YES/NOと同一。UIの差し替えのみ |
| 口上21本焼き込み | **I-4**: 草案場面3と一字一句一致(テストで草案MDをパース突き合わせ) |
| 人数可変 | **I-5**: showHostileArrivalStageがmembers=1/3/5の各ケースでDOM崩れ・例外なし(テストでレンダリング検査) |
| 進行安全 | **I-6**: onChoice/onDoneがちょうど1回・二重起動防止・タイムアウト保険(§5-D)。既存`f09-empty-slot-lock-test`等の進行系テストが全PASS |

## 5. 触ってよい / 触ってはいけないファイル

- **可**: src/ui-common.js / src/app.js(handleChallengeRequestフローのみ) / src/index.html(CSS) / src/data.js(CHALLENGE_ARRIVAL_LINES追加のみ) / src/relationships.js(相手3名選出の追加のみ) / test/
- **不可**: src/management.js / src/match-engine.js / src/factions.js / 既存セリフテーブルの改変(CHALLENGE_LINES/CHALLENGE_GROUP_PETITION_LINESは読み取りのみ) / B3系(`_buildB3Step*`) / ui-render.jsのロック処理(3173-3185)

## 6. 検証手順(すべてフォアグラウンド。run_in_background禁止)

1. `node --check` 触ったJS全部
2. 新規 `test/ch1-challenge-flow-test.js`: ①CHALLENGE_ARRIVAL_LINES=草案21/21一致 ②forward直訴HTMLにピッカーが出る/2名未満でA disabled ③inverse HTMLに「果たし状」+敵メンバーN人+承認済みセリフが出る/自団体側の大型画像が出ない ④members 1/3/5で例外なし ⑤onChoice二重発火なし
3. relationships.jsを触るため**編集フックのauto-simが走る**。加えて手動で `node test/auto-sim.js 20 42` 前後比較 — **fingerprint完全一致**(I-1)
4. `npm test` 全PASS(u3-group-b-safety-net / u4-modal-frame / challenge系の既存テストは振る舞い検査へ追随)

## 7. 完了条件

- コミットは3粒度: ①データ(口上21本) ②果たし状コンポーネント+inverse差し替え ③forward統合+sendoff Office化+テスト
- diffはこの指示書の範囲のみ。specs(challenge-request-spec v0.2改訂)とworklog/roadmapはFableがマージ時に書く
