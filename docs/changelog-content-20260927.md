# ゲーム内「更新履歴」の文面(2026-09-27・v1.05〜v1.37)

`src/data-changelog.js` に入れる文面の正本。プレイヤーから見える変化だけを書く(内部の整理・テスト・ドキュメントは載せない)。
素材は worklog・git履歴・DLsite更新情報から抽出。1.14b/1.23b/1.25C のような枝番は本体の版にまとめた。

| 版 | 日付 | 日本語 | English |
|---|---|---|---|
| 1.37 | 2026-09-17 | 年間MVPレースの配点を見直し、統一王者でなくてもMVPに届きやすくした / 英語モードで日本語のまま出ていた表記を修正 | Rebalanced the annual MVP race so fighters without the unified title can reach MVP / Fixed labels that still showed Japanese in English mode |
| 1.36 | 2026-09-10 | 英語モードの選手のセリフを仕上げた(日本語表示に変化なし) | Finished the English fighter dialogue (no change in Japanese) |
| 1.35 | 2026-09-07 | 英語モードを追加(タイトル画面で日本語と切り替え) / 特性「ファンサービス」「ヒール適性」が働いていなかったのを修正 / ニュースティッカーを廃止 | Added English mode (switch on the title screen) / Fixed the traits "Fan Service" and "Heel Aptitude" not taking effect / Removed the news ticker |
| 1.34 | 2026-08-31 | 契約更改で給与が数百万円に跳ね上がる不具合を修正し、数季かけて追いつく形にした / 査定の改定内容を週のログに出すようにした / 契約更改中に固まる症状を緩和 | Fixed salaries jumping to absurd amounts at contract renewal; they now catch up over several seasons / Contract reassessments are now shown in the weekly log / Reduced freezes during contract renewal |
| 1.33 | 2026-08-31 | 人気が下がると契約枠が黙って縮み、正規の選手まで枠超過になる不具合を修正 / ゲスト選手が出る週の人数判定を修正 | Fixed the contract cap silently shrinking when popularity dropped, pushing signed fighters over the limit / Fixed roster counting in weeks with guest fighters |
| 1.32 | 2026-08-30 | 年間表彰式の「閉じる」が効かず進行できなくなる不具合を修正 / オフシーズン中に放置すると勝手に表彰式が始まる不具合を修正 / 全国統一王座がある週で試合枠がずれる不具合を修正 | Fixed the awards ceremony's close button not responding and blocking progress / Fixed the ceremony starting on its own while idle in the off-season / Fixed match slots shifting in weeks with a unified title bout |
| 1.31 | 2026-08-17 | 派閥の抗争の歴史が記録されていなかった不具合を修正 / 縦長の画面でボタンが押せないことがある不具合を修正 / 大きなイベントで選手の顔を押しても選べない画面を修正 | Fixed faction feud history never being recorded / Fixed buttons out of reach on tall dialogs / Fixed fighter portraits not being selectable in some event screens |
| 1.30 | 2026-08-13 | 全団体をまたぐ「全国統一王座」を追加 / 春のタッグリーグを2ブロック8チーム制に / タイトル画面に「選手ファイル」を追加 | Added the National Unified Championship across all promotions / Spring Tag League is now two blocks of eight teams / Added the Fighter File to the title screen |
| 1.26 | 2026-08-12 | 給与交渉に「降給」の交渉を追加 / 契約更改の処理の時期を修正 / 年間表彰式がスマホでスクロールできない不具合を修正 | Added pay-cut negotiations / Fixed when contract reassessment runs / Fixed the awards ceremony not scrolling on phones |
| 1.25 | 2026-08-03 | シングルとタッグの試合の見せ方を刷新(カメラ・シルエット・背景) / 自団体のベルトの呼び方を「団体王者・団体王座」に統一 / 成長の伸び方と若手の初期値を調整 | Reworked how singles and tag matches are shown (camera, silhouettes, backgrounds) / Unified the wording for your own belts / Adjusted growth curves and rookies' starting values |
| 1.24 | 2026-08-02 | 新聞と特別興行の進行・会話・結果の見せ方を刷新 / 選手の「開眼」イベントを追加 / AIの育成、王座戦、ドラフト、関係性など広い範囲を改善 | Reworked the newspaper and special shows / Added the fighter "awakening" event / Improved AI training, title matches, the draft and relationships |
| 1.23 | 2026-07-27 | 試合とイベントの画面の見せ方を全面的に統一 / BGMと効果音を本番の音源に差し替え(無音だった試合結果に音を追加) / 試合評価・成長・消耗を調整 | Unified the look of match and event screens / Replaced music and sound effects with the final audio (results were silent before) / Adjusted match ratings, growth and wear |
| 1.22 | 2026-07-25 | 試合評価を作り直し(上限を撤廃、歴代最高記録と大ニュースを新設) / 遠征の流れを作り直し(同行者2名の選択と移動の場面) / 他団体からの挑戦のセリフと演出を刷新 | Rebuilt match ratings (no more ceiling, all-time bests and big-news articles) / Rebuilt away tours (pick two companions, travel scenes) / Reworked challenges from other promotions |
| 1.21 | 2026-07-23 | BGM74曲を新しい音源に差し替え、通常興行に進行曲を新設 / PPVのテレビ中継画面を作り直し | Replaced 74 music tracks with new recordings and added a theme for regular shows / Rebuilt the PPV broadcast screen |
| 1.20 | 2026-07-21 | 大会の観戦で、BGMが試合から結果画面まで途切れないようにした / 秋の4団体対抗戦の試合中のセリフを実装 / 週の「おまかせ完了」の通知を廃止 | Tournament music now plays through to the result screen / Added in-match dialogue for the autumn four-promotion series / Removed the "auto-manage done" notice |
| 1.14 | 2026-07-19 | 相関図の「ネットワーク」「フォーカス」「派閥」が表示されない不具合を修正(古いセーブも自動で移行) / 春のタッグリーグで優勝ペアが準優勝と記録される不具合を修正 / 他団体からの挑戦試合を興行の上位3枠に固定 | Fixed the relationship map's Network, Focus and Faction views (old saves migrate automatically) / Fixed the Spring Tag League recording the winners as runners-up / Challenge matches are now fixed to the top three slots |
| 1.13 | 2026-07-18 | 4年に1度の「天頂戦」を追加 / 決勝のあと結果発表まで間延びしていたのを解消 / 相関図でAI団体のリーダーの派閥アイコンが消える不具合を修正 | Added the Zenith Tournament, held every four years / Removed the long pause between the final and the result / Fixed faction icons disappearing for AI promotion leaders |
| 1.12 | 2026-07-17 | 季節大会「春のタッグリーグ」を追加 / 社長室のケアを作り直し(ボーナス交渉・休暇・外部コーチ招聘) / 遊び方ガイドと説明の吹き出しを全画面で刷新 | Added the Spring Tag League / Rebuilt the president's office care actions (bonus talks, time off, guest coaches) / Reworked the guides and tooltips |
| 1.11 | 2026-06-03 | 挑戦状の出やすさを調整 / タイトル防衛回数の数え方を修正 / 派閥とジュニアトーナメントで進行できなくなる不具合を修正 | Adjusted how often challenges appear / Fixed the title defense count / Fixed progress stalling in factions and the Junior Tournament |
| 1.10 | 2026-05-17 | 派閥の中の立場を争う「序列戦」を追加 / 団体の歩みを見る「年代記」を大幅に拡充 / 引退試合の後やジュニアトーナメント中止時に進行できなくなる不具合を修正 | Added internal ranking matches inside factions / Greatly expanded the Chronicle / Fixed stalls after retirement matches and when the Junior Tournament is cancelled |
| 1.09 | 2026-05-02 | 派閥の抗争にポイント制と派閥対抗戦を追加 / 派閥に6種類の性格を設定 / お使い型のミッションを廃止 | Added points and inter-faction matches to faction feuds / Gave factions six personality types / Removed errand-style missions |
| 1.08 | 2026-05-01 | 派閥システムを追加(結成・抗争・相関図での表示) / 試合結果の画面を観客入りの新しいデザインに統一 / 新聞を刷新し、年間MVPレースの面を新設 | Added factions (forming, feuding, shown on the relationship map) / Unified result screens with a new crowd design / Reworked the newspaper and added the annual MVP race page |
| 1.06 | 2026-04-19 | タッグマッチの観戦演出をシングル戦と同じ水準に / タッグ戦の勝敗のセリフを性格別に追加 | Brought tag match presentation up to singles level / Added win/loss dialogue for tag matches by personality |
| 1.05 | 2026-04-12 | 性格タイプごとの未実装だったセリフを300行以上追加 | Added over 300 lines of dialogue for personality types |

## 運用

- 新しい版を出すときは、この表の一番上に1行足してから `src/data-changelog.js` へ反映する。
- 1項目は「プレイヤーが気づく変化」を1つだけ。内部の作り替えは書かない。
- 英語版は同じ内容の直訳でよい(訳し分けは不要)。
