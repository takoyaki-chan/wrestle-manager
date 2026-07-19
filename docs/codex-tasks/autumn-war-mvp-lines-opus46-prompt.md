# Claude Code / Opus 4.6 指示文：4団体勝ち残り対抗戦 MVP台詞パック

以下をそのまま Claude Code（Claude Opus 4.6）へ渡してください。

---

あなたは `wrestle-manager` リポジトリで、既に実装済みの「4団体勝ち残り対抗戦」MVP一言シーン用台詞を大量制作します。創作だけで終わらせず、データ実装・契約テスト・ドキュメント更新・ローカルコミットまで完了してください。push はしないでください。

## 最初に必ず読むもの

1. `CLAUDE.md`（全文）
2. `specs/personality-archetype-spec-v1.0.md`（全文）
3. `docs/dialogue/dialogue-expansion-tone-guide.md`（全文）
4. `docs/ui/03-screens/autumn-gauntlet-war.md`
5. `specs/autumn-gauntlet-war-spec-v0.1.md` の §1、§4、§5.7、§6
6. `src/data.js` の次の既存データを実例として読む
   - `AUTUMN_WAR_MVP_LINES`
   - `PPV_SUMMIT_VICTORY_LINES`
   - personality × archetype の全セルが埋まっている近接テーブルを2つ以上
7. `src/ui-common.js` の `_agwMvpLine` と `renderAutumnWarMvpScene`
8. `test/autumn-war-ui-flow-test.js`

## 変更スコープ

- 主対象: `src/data.js` の `AUTUMN_WAR_MVP_LINES`
- テスト: `test/autumn-war-mvp-lines-test.js` を新設し、`package.json` に専用scriptを追加
- 完了記録: `docs/ui/03-screens/autumn-gauntlet-war.md`、`docs/worklog.md`、`docs/game-system-roadmap.md`
- UI、ルーター、勝敗処理、報酬、他の台詞テーブルは変更しない
- 既存の未コミット変更を消さない。`git checkout`、`git restore`、`git reset` は禁止

## データ契約

`AUTUMN_WAR_MVP_LINES[context][personality][archetypeKey] = string[]`

context は次の3種類を完全維持してください。

- `gauntlet`: MVP本人が3勝以上。連戦を耐えて何人も抜いた身体感覚と誇り。優勝したとは限らない
- `champion`: MVP所属団体が優勝し、本人は3勝未満。3人でつないだ団体勝利を中心にする
- `defiant`: MVPだが所属団体は優勝していない。個人賞への複雑さと次への悔しさ。優勝したように祝わない

personality は7種類すべて:

`normal / bold / quiet / shy / easygoing / earnest / emotional`

archetype は7種類すべて。`normal` は `_default` キーで表現します。

`_default / composed / ojousama / polite / seductive / delinquent / cool`

したがって 3 context × 7 personality × 7 archetype = 147セルをすべて明示実装してください。各セルは最低2本、推奨3本。最低294本です。既存の21本は意味と品質が合えば各 `_default` の1本として残して構いません。

## 執筆ルール

- 画面は「決着後に1人だけ映る、独立した一言シーン」。実況文ではなく本人の発話を書く
- 1本は日本語12〜70文字を目安にし、原則1〜2文。スマホでも長すぎない
- personality が感情の強度・反応を、archetype が一人称・語尾・品位・距離感を担当する
- 同じ骨格の語尾だけを機械置換した量産にしない。各セルで情景・焦点・比喩を少し変える
- `quiet` と `cool` を同義にしない。`quiet` は発話量/内向性、`cool` は振る舞い/語彙の温度
- `shy` は幼児化させず、ためらいながらもプロとして話す
- `easygoing` は能天気一辺倒にせず、敗北時は軽さの奥に悔しさを残す
- `seductive` は過剰な性的表現を避け、余裕・観客との距離感・艶のある比喩で表現する
- `delinquent` は乱暴でも意味が通る日本語にし、毎回「だぜ」「てめえ」だけに頼らない
- `ojousama` は「ですわ」の機械連打を避け、誇り・格式・挑発の幅を出す
- `polite` は全員同じ敬語にならないよう personality の差を維持する
- `composed` は三点リーダ過多を避ける。静かな間は必要な箇所だけ
- 勝敗、勝ち抜き数、所属団体など、シミュレーションにない事実を捏造しない
- 個人MVPと優勝を混同しない。特に `defiant` では祝勝発言を禁止
- プレースホルダーを使う場合は `{wins}` と `{org}` だけ。多用しない。`{name}` は不要
- 記号は既存データの日本語表記に合わせる。ASCII `...` ではなく `……` を使う
- 完全一致の重複台詞は禁止。全セルを横断して同一文がないようにする
- 固有キャラ名、実在人物名、他作品の決め台詞は使わない

## テスト要件

`test/autumn-war-mvp-lines-test.js` で少なくとも次を自動検証してください。

1. 3 context が揃っている
2. 各contextに7 personalityが揃っている
3. 各personalityに7 archetypeKeyが揃っている
4. 全147セルが配列で、各2本以上ある
5. 全台詞がstringで、trim後に空でない
6. 長さが12〜90文字の安全域に収まる
7. 許可外プレースホルダーがない
8. ASCII `...` がない
9. 全台詞の完全一致重複がない
10. 合計294本以上ある

データ本体を正規表現だけで曖昧に検査せず、対象オブジェクトを安全に抽出・評価してテストしてください。既存の `test/autumn-war-ui-flow-test.js` も通してください。

## 検証と完了

次を実行してください。

```text
node --check src/data.js
node test/autumn-war-mvp-lines-test.js
node test/autumn-war-ui-flow-test.js
node test/auto-sim.js 20 42
git diff --check
```

`src/data.js` 変更のためauto-simは省略不可です。台詞データのみなので20シーズン固定seedでよいですが、violations/errorsが出たら原因を調べて解消してください。

画面仕様には「全147セル・294本以上の台詞パック実装済み」と本数を記録し、worklog先頭とroadmapのE-4行を短く更新してください。最後に、この作業だけを意図的にstageし、日本語または英語の明確なメッセージでローカルコミットしてください。pushは禁止です。

最終報告には、変更ファイル、セル数/台詞総数、テスト結果、コミットhash、未解決事項の有無を簡潔に書いてください。
