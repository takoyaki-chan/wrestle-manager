# task-87 実施報告

## 終了状態

- 実装と自動検証は完了。
- コミットは未実施。`git add -- src/data.js` が次の sandbox 権限エラーで失敗したため、指示どおり変更を作業ツリーに残した。

```text
fatal: Unable to create 'C:/Users/nkmrk/Downloads/wrestle-manager/.git/worktrees/wm-codex-task87/index.lock': Permission denied
```

- main フォルダへの権限拡張、ファイル変更、回避操作は行っていない。

## 実施内容

- `src/data.js`
  - 承認済み草案「場面3」と一字一句同じ `CHALLENGE_ARRIVAL_LINES` を7 archetype×3本（計21本）追加。
  - `EVENT_LINES_BY_KEY.challengeArrival` と Node export を追加。
- `src/relationships.js`
  - inverse 挑戦の発火時に、発起人と同団体から負傷・引退を除外した OVR 上位2名を選び、`pending.memberIds` に固定。
  - OVR同値の決定には derive したローカルRNGだけを使用し、本流RNGを消費しないようにした。
  - inverse のカード生成時に、固定済み `memberIds` を使用するようにした。
- `src/ui-common.js` / `src/index.html`
  - 再利用可能な `showHostileArrivalStage(opts)` と黒Stage・赤アクセントの `.inv-*` UIを追加。
  - inverse 挑戦を「果 た し 状」画面へ差し替え、敵3名・実団体バッジ・承認済み口上・A/B決裁を表示。
  - forward 直訴画面に同行2名ピッカーを統合。候補除外条件、2名未満でのA無効化、選択操作を実装。
  - 旧 `showAwayTeamPickModal` と参照を削除。
  - `showChallengeSendoffModal` を Office レポートカード化し、行き先の実団体バッジ、遠征3名のupperチップ、既存吹き出しと送り出しボタンを表示。
- `src/app.js`
  - `handleChallengeRequest` 内だけを変更し、統合ピッカーの選択2名を既存 `_awayTeamPick` 経路へ渡した。
  - inverse の重複受理通知と sendoff を省略し、既存の受諾・拒否処理、予約、保存処理は維持。
- `test/`
  - `test/ch1-challenge-flow-test.js` を追加。
  - inverse UI差し替えに合わせて `test/u3-group-b-safety-net-test.js` の期待値を更新。

## 検証結果

- `node --check`（変更した全JS）: PASS
- `node test/ch1-challenge-flow-test.js`: PASS
- challenge関連、U3、U4、`f09-empty-slot-lock-test` の個別実行: PASS
- `npm.cmd test`: PASS（227/227、failed 0、timeouts 0）
- `node test/auto-sim.js 20 42`（変更前）: PASS、fingerprint `fae2a4d1`
- `node test/auto-sim.js 20 42`（変更後）: PASS、fingerprint `fae2a4d1`
- `git diff --check`: PASS
- `showAwayTeamPickModal|awayTeamPickOverlay` の参照検索: 0件
- 対話ブラウザでのローカル画面確認は、ローカルURLへのブラウザ権限が拒否されたため未実施。迂回はしていない。DOMレンダリング検査と全テストは上記のとおりPASS。

## 不変条件 I-1〜I-6 自己検算

### I-1: 発生条件・数式・CD・クォータ・失効・乱数列

PASS。既存の発生条件、heat式、24/36/52週CD、季2件・同一団体1件クォータ、8週失効には変更を加えていない。相手選出は derive ローカルRNGのみで行い、本流RNGが変化しないことを新規テストで確認した。同一シードauto-sim fingerprintも変更前後とも `fae2a4d1` で完全一致した。

### I-2: 同行候補の資格集合

PASS。発起人本人、レンタル、負傷、`forcedRest`、`suspended` を除外し、旧 `showAwayTeamPickModal` と同じ集合にした。新規テストで全除外条件を検査した。

### I-3: inverse受諾・拒否の効果

PASS。UI入口だけを果たし状へ差し替え、`acceptPending` / `rejectPending`、予約フィールド、上位3試合ロックへつながるカード生成、関係値処理は既存経路を維持した。inverse受諾後の重複 `showEventPopup` とforward専用sendoffだけを省略した。

### I-4: 口上21本

PASS。草案MDの場面3をテストでパースし、7 archetype×3本のオブジェクトを `deepStrictEqual` で照合した。総数21本も確認した。

### I-5: 人数可変

PASS。`showHostileArrivalStage` の members=1/3/5 をそれぞれDOMレンダリングし、例外なし・表示人数一致を新規テストで確認した。

### I-6: 進行安全

PASS。`onChoice` / `onDone` に一度だけ通るガードを設け、二重クリックでも1回だけ発火することをテストした。閉じ処理には900msのタイムアウト保険を設けた。`f09-empty-slot-lock-test` を含む全227テストがPASSした。

## 差分境界

実差分は指示書で許可された `src/app.js`、`src/data.js`、`src/index.html`、`src/relationships.js`、`src/ui-common.js`、`test/` と、このコミット失敗時に作成するよう明示された本報告書だけ。禁止ファイル、既存 `CHALLENGE_LINES` / `CHALLENGE_GROUP_PETITION_LINES`、B3系、`src/ui-render.js` のロック処理には実差分なし。
