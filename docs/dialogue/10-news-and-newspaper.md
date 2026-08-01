# ニュース・新聞・黒田記者コラム

docs/dialogue/README.md から自動生成(`node tools/extract-dialogue.js`)。手直しはこのファイルではなく `src/*.js` 側の該当テーブルに対して行い、再抽出すること。

## `NEWS_TICKER_TEMPLATES`

- 出典: `src/data.js`
- コード内コメント: v1.4w: 世界観演出 ニューステンプレート / §6.1 ティッカー用テンプレート（カテゴリ別・各5+パターン）
- 本数: 75

### aiShow[]

- `NEWS_TICKER_TEMPLATES.aiShow[1]`: ◆ {org}、今週も安定した集客で興行を成功させた
- `NEWS_TICKER_TEMPLATES.aiShow[2]`: ◆ {org}の興行が盛況。地元ファンの支持は厚い
- `NEWS_TICKER_TEMPLATES.aiShow[3]`: ◆ {org}が堅実な興行運営。観客の満足度も上々とのこと
- `NEWS_TICKER_TEMPLATES.aiShow[4]`: ◆ {org}の今週の興行は好評。会場には熱気が充満していた
- `NEWS_TICKER_TEMPLATES.aiShow[5]`: ◆ {org}、地域密着型の興行でファン層を着実に広げている

### winStreak[]

- `NEWS_TICKER_TEMPLATES.winStreak[1]`: ◆ {name}が{count}連勝中！ 絶好調の波に乗っている
- `NEWS_TICKER_TEMPLATES.winStreak[2]`: ◆ 快進撃の{name}、{count}連勝で勢いが止まらない
- `NEWS_TICKER_TEMPLATES.winStreak[3]`: ◆ {name}の連勝が{count}に到達。次の対戦相手は戦々恐々か
- `NEWS_TICKER_TEMPLATES.winStreak[4]`: ◆ 止まらない{name}！ {count}連勝で注目度が急上昇
- `NEWS_TICKER_TEMPLATES.winStreak[5]`: ◆ {name}が{count}連勝。充実した練習の成果が出ている

### loseStreak[]

- `NEWS_TICKER_TEMPLATES.loseStreak[1]`: ◆ {name}に元気がない…{count}連敗にファンから心配の声
- `NEWS_TICKER_TEMPLATES.loseStreak[2]`: ◆ {name}の不調が続く。{count}連敗で表情にも陰りが
- `NEWS_TICKER_TEMPLATES.loseStreak[3]`: ◆ {name}が{count}連敗中。調子を取り戻すきっかけが欲しいところ
- `NEWS_TICKER_TEMPLATES.loseStreak[4]`: ◆ {name}の連敗が止まらない。周囲のサポートが鍵になりそう
- `NEWS_TICKER_TEMPLATES.loseStreak[5]`: ◆ {name}が苦しい時期を過ごしている。{count}連敗でも腐らない姿勢にファンはエールを送る

### aiAce[]

- `NEWS_TICKER_TEMPLATES.aiAce[1]`: ◆ {org}の{name}が好調を維持。エースとしての存在感を発揮
- `NEWS_TICKER_TEMPLATES.aiAce[2]`: ◆ {name}が{org}を牽引中。対戦を望む声が各団体から上がっている
- `NEWS_TICKER_TEMPLATES.aiAce[3]`: ◆ {org}の{name}に注目が集まる。実力は業界屈指との評判
- `NEWS_TICKER_TEMPLATES.aiAce[4]`: ◆ {name}の充実ぶりが話題に。{org}の大黒柱は健在
- `NEWS_TICKER_TEMPLATES.aiAce[5]`: ◆ {org}の看板選手{name}、練習での仕上がりが抜群とのこと

### flavor[]

- `NEWS_TICKER_TEMPLATES.flavor[1]`: ◆ {name}が仕事帰りのトレーニング姿をSNSに投稿。ファンが反応
- `NEWS_TICKER_TEMPLATES.flavor[2]`: ◆ {name}が地元のイベントでファンと交流。笑顔で写真撮影に応じていた
- `NEWS_TICKER_TEMPLATES.flavor[3]`: ◆ {name}がSNSで{name2}の試合について触れていた。ファンが反応
- `NEWS_TICKER_TEMPLATES.flavor[4]`: ◆ {name}の本業での活躍ぶりも話題に。「文武両道」とファンが称賛
- `NEWS_TICKER_TEMPLATES.flavor[5]`: ◆ {name}のSNSに{name2}がコメント。ファンの間で話題に
- `NEWS_TICKER_TEMPLATES.flavor[6]`: ◆ {name}が休日の過ごし方を公開。オフの素顔にファンがほっこり

### injury[]

- `NEWS_TICKER_TEMPLATES.injury[1]`: ◆ {org}の{name}がトレーニング中に負傷か。詳細は未発表
- `NEWS_TICKER_TEMPLATES.injury[2]`: ◆ {name}の出場が危ぶまれる。{org}の今後のカード編成に影響も
- `NEWS_TICKER_TEMPLATES.injury[3]`: ◆ {org}・{name}の負傷情報。復帰時期は未定とのこと
- `NEWS_TICKER_TEMPLATES.injury[4]`: ◆ {name}にアクシデント。{org}は代役の検討を迫られる
- `NEWS_TICKER_TEMPLATES.injury[5]`: ◆ {org}の{name}が離脱。早期復帰を願う声がSNSに溢れている

### scout[]

- `NEWS_TICKER_TEMPLATES.scout[1]`: ◆ 地元のアマチュア大会で将来有望な選手が目撃されたとの情報
- `NEWS_TICKER_TEMPLATES.scout[2]`: ◆ 各団体のスカウトが活発化。フリーの実力者を巡る争奪戦の気配
- `NEWS_TICKER_TEMPLATES.scout[3]`: ◆ 異業種から転身した新人が話題に。ポテンシャルは未知数
- `NEWS_TICKER_TEMPLATES.scout[4]`: ◆ 地域のレスリング教室出身者に注目が集まっている
- `NEWS_TICKER_TEMPLATES.scout[5]`: ◆ フリーで活動中の選手に複数団体がオファーを出しているとの噂

### economyGood[]

- `NEWS_TICKER_TEMPLATES.economyGood[1]`: ◆ {org}の経営が好調。スポンサー契約も順調に増えている
- `NEWS_TICKER_TEMPLATES.economyGood[2]`: ◆ {org}のグッズ売上が伸びている。人気選手のタオルが品薄に
- `NEWS_TICKER_TEMPLATES.economyGood[3]`: ◆ {org}が新しいスポンサーを獲得。資金面に余裕が生まれそう
- `NEWS_TICKER_TEMPLATES.economyGood[4]`: ◆ {org}の興行収入が安定。地域からの協賛も増加傾向
- `NEWS_TICKER_TEMPLATES.economyGood[5]`: ◆ {org}が練習施設を拡充。選手からも好評の声

### economyStruggle[]

- `NEWS_TICKER_TEMPLATES.economyStruggle[1]`: ◆ {org}の集客がやや伸び悩み。新たなファン開拓が課題か
- `NEWS_TICKER_TEMPLATES.economyStruggle[2]`: ◆ {org}の経営陣がテコ入れ策を検討中との報道
- `NEWS_TICKER_TEMPLATES.economyStruggle[3]`: ◆ {org}が経費削減に取り組んでいるとの噂。厳しい台所事情か
- `NEWS_TICKER_TEMPLATES.economyStruggle[4]`: ◆ {org}の観客動員が課題に。魅力的なカード作りで巻き返しを図る
- `NEWS_TICKER_TEMPLATES.economyStruggle[5]`: ◆ {org}、限られた予算の中で奮闘中。選手の頑張りが支え

### rivalryActive[]

- `NEWS_TICKER_TEMPLATES.rivalryActive[1]`: ◆ {name1}と{name2}の間にただならぬ空気が漂っている
- `NEWS_TICKER_TEMPLATES.rivalryActive[2]`: ◆ {name1} vs {name2}の因縁が深まっている。次の直接対決に注目
- `NEWS_TICKER_TEMPLATES.rivalryActive[3]`: ◆ {name1}が{name2}について意味深なコメント。火花が散る予感
- `NEWS_TICKER_TEMPLATES.rivalryActive[4]`: ◆ {name1}と{name2}のライバル関係にファンが熱視線を送っている
- `NEWS_TICKER_TEMPLATES.rivalryActive[5]`: ◆ {name1} vs {name2}の再戦を望むファンの声がSNSで増加中

### rivalryGoodRival[]

- `NEWS_TICKER_TEMPLATES.rivalryGoodRival[1]`: ◆ {name1}と{name2}の名勝負が今も語り草になっている
- `NEWS_TICKER_TEMPLATES.rivalryGoodRival[2]`: ◆ {name1}と{name2}——好敵手同士の再戦を望む声は根強い
- `NEWS_TICKER_TEMPLATES.rivalryGoodRival[3]`: ◆ {name1}と{name2}の物語は終わっても、ファンの記憶には鮮やかに残る
- `NEWS_TICKER_TEMPLATES.rivalryGoodRival[4]`: ◆ 「{name1} vs {name2}をもう一度」——ファン投票で再戦希望が上位に
- `NEWS_TICKER_TEMPLATES.rivalryGoodRival[5]`: ◆ {name1}と{name2}、練習場ですれ違うと自然に笑顔になるという

### champion[]

- `NEWS_TICKER_TEMPLATES.champion[1]`: ◆ 王者{name}に挑戦者候補が続々。次の防衛戦の相手は誰だ
- `NEWS_TICKER_TEMPLATES.champion[2]`: ◆ {name}の王座に虎視眈々と狙いを定める選手たち
- `NEWS_TICKER_TEMPLATES.champion[3]`: ◆ 王者{name}、練習での仕上がりは万全とのこと
- `NEWS_TICKER_TEMPLATES.champion[4]`: ◆ {name}の次の防衛戦に注目が集まっている
- `NEWS_TICKER_TEMPLATES.champion[5]`: ◆ 王者{name}、どんな挑戦者でも受けて立つ構え

### championLongReign[]

- `NEWS_TICKER_TEMPLATES.championLongReign[1]`: ◆ {name}の長期政権が続く。{defenses}度の防衛は伊達ではない
- `NEWS_TICKER_TEMPLATES.championLongReign[2]`: ◆ 絶対王者{name}、{defenses}回防衛の実績に業界も脱帽
- `NEWS_TICKER_TEMPLATES.championLongReign[3]`: ◆ {name}の王座はもはや鉄壁。{defenses}度防衛の壁を越える者は現れるか
- `NEWS_TICKER_TEMPLATES.championLongReign[4]`: ◆ {name}の安定感が際立つ。王者として{defenses}回の防衛を重ねた風格
- `NEWS_TICKER_TEMPLATES.championLongReign[5]`: ◆ 「{name}時代」と呼ぶ声も。{defenses}回防衛の偉業は続く

### juniorTournament[]

- `NEWS_TICKER_TEMPLATES.juniorTournament[1]`: ◆ 🏆 ジュニアトーナメント優勝は{name}（{orgName}）！ 若き才能が頂点に立った
- `NEWS_TICKER_TEMPLATES.juniorTournament[2]`: ◆ 🏆 {name}がジュニアトーナメントを制覇。{orgName}の未来を担うエースの誕生だ
- `NEWS_TICKER_TEMPLATES.juniorTournament[3]`: ◆ 🏆 U-20の頂点に{name}（{orgName}）。鮮烈な勝利で全団体を沸かせた

### general[]

- `NEWS_TICKER_TEMPLATES.general[1]`: ◆ 今週末の大会に向けてSNSでの話題が盛り上がりを見せている
- `NEWS_TICKER_TEMPLATES.general[2]`: ◆ レスリング関連グッズの売上が堅調。推し選手のタオルが人気
- `NEWS_TICKER_TEMPLATES.general[3]`: ◆ 地域のスポーツ施設でレスリング教室の申込が増加傾向
- `NEWS_TICKER_TEMPLATES.general[4]`: ◆ 人気選手の得意技を真似する人がジムで増えているとか
- `NEWS_TICKER_TEMPLATES.general[5]`: ◆ 各団体の試合ハイライト動画の再生数が伸びている
- `NEWS_TICKER_TEMPLATES.general[6]`: ◆ レスリング保険の加入者数が前年比で増加。安全意識の高まりか

## `NEWS_HEADLINE_TEMPLATES`

- 出典: `src/data.js`
- コード内コメント: §6.2 新聞パネル用テンプレート（イベント種別ごとに headline + body ペア、各3+パターン）
- 本数: 284

### tenchosenAnnounce[].headline

- `NEWS_HEADLINE_TEMPLATES.tenchosenAnnounce[1].headline`: 4年に一度の「天頂戦」、今季第48週に開催
- `NEWS_HEADLINE_TEMPLATES.tenchosenAnnounce[2].headline`: 全国女子プロレス最強王者決定戦「天頂戦」、開催年を迎える

### tenchosenAnnounce[].body

- `NEWS_HEADLINE_TEMPLATES.tenchosenAnnounce[1].body`: 今季は4年に一度の開催年。全国女子プロレス最強王者決定戦「天頂戦」は第48週に行われ、全団体から選ばれた16名がシングルエリミネーション方式で優勝を争う。
- `NEWS_HEADLINE_TEMPLATES.tenchosenAnnounce[2].body`: 第{season}シーズンの第48週に「天頂戦」が開催される。特別招待2名と団体枠14名の計16名が出場し、1回戦から決勝まで15試合を行う。

### tenchosenResult[].headline

- `NEWS_HEADLINE_TEMPLATES.tenchosenResult[1].headline`: {championName}、全国女子プロレス最強王者決定戦「天頂戦」優勝
- `NEWS_HEADLINE_TEMPLATES.tenchosenResult[2].headline`: 「天頂戦」決着、{championName}が16人制トーナメントを制す

### tenchosenResult[].body

- `NEWS_HEADLINE_TEMPLATES.tenchosenResult[1].body`: 第{season}シーズン第48週の「天頂戦」は、{championName}（{championOrg}）が決勝で{runnerUpName}（{runnerUpOrg}）を下して優勝した。決勝の試合評価は{mq}点。
- `NEWS_HEADLINE_TEMPLATES.tenchosenResult[2].body`: 全国女子プロレス最強王者決定戦「天頂戦」は第48週に全15試合を実施。決勝で{runnerUpName}（{runnerUpOrg}）に勝利した{championName}（{championOrg}）が優勝者となった。決勝の試合評価は{mq}点。

### tenchosenSemiFinal[].headline

- `NEWS_HEADLINE_TEMPLATES.tenchosenSemiFinal[1].headline`: 「天頂戦」準決勝 — 決勝への椅子は二つ
- `NEWS_HEADLINE_TEMPLATES.tenchosenSemiFinal[2].headline`: 準決勝で分かれた明暗 — 「天頂戦」

### tenchosenSemiFinal[].body

- `NEWS_HEADLINE_TEMPLATES.tenchosenSemiFinal[1].body`: {a1}（{a1org}）が{a2}（{a2org}）を、{b1}（{b1org}）が{b2}（{b2org}）を下し、それぞれ決勝へ進んだ。試合評価は{mqA}点と{mqB}点。
- `NEWS_HEADLINE_TEMPLATES.tenchosenSemiFinal[2].body`: 準決勝は{a1}（{a1org}）対{a2}（{a2org}）、{b1}（{b1org}）対{b2}（{b2org}）の2試合。勝ち上がったのは{a1}と{b1}だった。試合評価は{mqA}点と{mqB}点。

### tenchosenBestBout[].headline

- `NEWS_HEADLINE_TEMPLATES.tenchosenBestBout[1].headline`: 大会ベストバウト — {winner} vs {loser}
- `NEWS_HEADLINE_TEMPLATES.tenchosenBestBout[2].headline`: 「天頂戦」最高評価は{mq}点 — {winner} vs {loser}

### tenchosenBestBout[].body

- `NEWS_HEADLINE_TEMPLATES.tenchosenBestBout[1].body`: {round}で組まれた{winner}（{winnerOrg}）と{loser}（{loserOrg}）の一戦が、大会最高の{mq}点を記録した。{closing}
- `NEWS_HEADLINE_TEMPLATES.tenchosenBestBout[2].body`: {round}の{winner}（{winnerOrg}）対{loser}（{loserOrg}）が、全15試合を通して最も高い評価を集めた。{closing}

### autumnWarAnnounce[].headline

- `NEWS_HEADLINE_TEMPLATES.autumnWarAnnounce[1].headline`: 4団体勝ち残り対抗戦、組み合わせ決定
- `NEWS_HEADLINE_TEMPLATES.autumnWarAnnounce[2].headline`: 秋の団体決戦へ、4つの陣営が出揃う

### autumnWarAnnounce[].body

- `NEWS_HEADLINE_TEMPLATES.autumnWarAnnounce[1].body`: 第{season}回4団体勝ち残り対抗戦は第36週に開催される。準決勝は第1シード{seed1}対第4シード{seed4}、第2シード{seed2}対第3シード{seed3}。各団体3名が先鋒・中堅・大将の順に立ち、最後の一人になるまでリングを譲らない。
- `NEWS_HEADLINE_TEMPLATES.autumnWarAnnounce[2].body`: 第{season}回4団体勝ち残り対抗戦の出場団体は{seed1}・{seed2}・{seed3}・{seed4}。第36週、団体ランキング1位対4位、2位対3位の準決勝から、勝者同士の決勝までを一日で戦い抜く。

### autumnWarResult[].headline

- `NEWS_HEADLINE_TEMPLATES.autumnWarResult[1].headline`: {championOrg}、4団体勝ち残り対抗戦を制覇
- `NEWS_HEADLINE_TEMPLATES.autumnWarResult[2].headline`: 秋の総力戦決着——{championOrg}が最後まで立つ

### autumnWarResult[].body

- `NEWS_HEADLINE_TEMPLATES.autumnWarResult[1].body`: 第{season}回4団体勝ち残り対抗戦。準決勝は{semi1}、{semi2}。決勝は{finalResult}となり、{championOrg}が頂点に立った。大会MVPは{mvpName}（{mvpOrg}）、通算{mvpWins}人抜き。{gauntletNote}{tieBreakNote}
- `NEWS_HEADLINE_TEMPLATES.autumnWarResult[2].body`: 第{season}回4団体勝ち残り対抗戦は{championOrg}が優勝。{runnerUpOrg}との決勝を制した。準決勝結果は{semi1}、{semi2}、決勝は{finalResult}。最多{mvpWins}勝を挙げた{mvpName}（{mvpOrg}）が大会MVPに選ばれた。{gauntletNote}{tieBreakNote}

### springTagAnnounce[].headline

- `NEWS_HEADLINE_TEMPLATES.springTagAnnounce[1].headline`: 春のタッグリーグ 出場4団体が決定
- `NEWS_HEADLINE_TEMPLATES.springTagAnnounce[2].headline`: 春のタッグリーグ開幕迫る、参加団体出揃う

### springTagAnnounce[].body

- `NEWS_HEADLINE_TEMPLATES.springTagAnnounce[1].body`: 第{season}回春のタッグリーグの出場4団体が出揃った。{org1}・{org2}・{org3}・{org4}。各団体代表タッグは編成期間を経て、第12週に激突する。
- `NEWS_HEADLINE_TEMPLATES.springTagAnnounce[2].body`: 第{season}回春のタッグリーグに{org1}・{org2}・{org3}・{org4}の4団体が名乗りを上げた。第12週、4団体総当たりのリーグ戦と優勝決定戦が1日で行われる。

### draftPlayerResult[].headline

- `NEWS_HEADLINE_TEMPLATES.draftPlayerResult[1].headline`: {org}、新人{count}名を獲得
- `NEWS_HEADLINE_TEMPLATES.draftPlayerResult[2].headline`: {org}が{count}名を指名、新体制へ

### draftPlayerResult[].body

- `NEWS_HEADLINE_TEMPLATES.draftPlayerResult[1].body`: {names}。新シーズンの陣容がひとつ厚くなった。
- `NEWS_HEADLINE_TEMPLATES.draftPlayerResult[2].body`: {names}が加入。どこまで伸びるかは、これからの一年が決める。

### draftAiResult[].headline

- `NEWS_HEADLINE_TEMPLATES.draftAiResult[1].headline`: {org}、新人{count}名を確保
- `NEWS_HEADLINE_TEMPLATES.draftAiResult[2].headline`: {org}が{count}名を指名

### draftAiResult[].body

- `NEWS_HEADLINE_TEMPLATES.draftAiResult[1].body`: {names}。来季の顔ぶれが動く。
- `NEWS_HEADLINE_TEMPLATES.draftAiResult[2].body`: {names}が新たに名を連ねた。

### draftFlowThrough[].headline

- `NEWS_HEADLINE_TEMPLATES.draftFlowThrough[1].headline`: 指名漏れ{count}名、フリー市場へ
- `NEWS_HEADLINE_TEMPLATES.draftFlowThrough[2].headline`: {count}名がどの団体からも指名されず

### draftFlowThrough[].body

- `NEWS_HEADLINE_TEMPLATES.draftFlowThrough[1].body`: {names}。どこにも呼ばれなかった選手たちが、市場に残った。
- `NEWS_HEADLINE_TEMPLATES.draftFlowThrough[2].body`: {names}が指名を受けられなかった。拾う団体が出るかどうか。

### draftEmpty[].headline

- `NEWS_HEADLINE_TEMPLATES.draftEmpty[1].headline`: 今年のドラフト、全指名が成立

### draftEmpty[].body

- `NEWS_HEADLINE_TEMPLATES.draftEmpty[1].body`: 指名漏れは出なかった。候補は残らず、それぞれの団体へ散った。

### springTagResult[].headline

- `NEWS_HEADLINE_TEMPLATES.springTagResult[1].headline`: {championOrg}『{champ1}&{champ2}』組、春のタッグリーグ制覇
- `NEWS_HEADLINE_TEMPLATES.springTagResult[2].headline`: 春のタッグリーグ、{championOrg}が頂点に

### springTagResult[].body

- `NEWS_HEADLINE_TEMPLATES.springTagResult[1].body`: 第{season}回春のタッグリーグは{championOrg}の{champ1}・{champ2}組が優勝。決勝で{runnerUpOrg}の{runner1}・{runner2}組を下した。
- `NEWS_HEADLINE_TEMPLATES.springTagResult[2].body`: 4団体総当たりを経て行われた決勝で、{championOrg}の{champ1}・{champ2}組が{runnerUpOrg}の{runner1}・{runner2}組を破り、第{season}回春のタッグリーグの優勝チームとなった。

### challengeRequestWin[].headline

- `NEWS_HEADLINE_TEMPLATES.challengeRequestWin[1].headline`: {requesterName}の直訴が実った！{ourOrg}が{opponentOrg}を {score} で下す
- `NEWS_HEADLINE_TEMPLATES.challengeRequestWin[2].headline`: 果たし状成就――{requesterName}主導の挑戦試合、{ourOrg}が制す
- `NEWS_HEADLINE_TEMPLATES.challengeRequestWin[3].headline`: {ourOrg} {score} {opponentOrg}――{requesterName}の意地が呼んだ越境戦

### challengeRequestWin[].body

- `NEWS_HEADLINE_TEMPLATES.challengeRequestWin[1].body`: {requesterName}が直訴して実現した{opponentOrg}との3対3団体戦。{ourOrg}は{opponentName}陣を {score} で下し、リング上で握手を交わすことなく解散した。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestWin[2].body`: 選手自らの直訴から始まった越境カード。蓋を開けてみれば{ourOrg}が {score} で押し切り、{requesterName}はこれで一区切りつくとだけ短く語った。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestWin[3].body`: {requesterName}が{opponentName}に挑むかたちで実現した3対3。{ourOrg}が {score} で星を取り、終わったあと{requesterName}は控室で長く息を吐いていたという。

### challengeRequestLose[].headline

- `NEWS_HEADLINE_TEMPLATES.challengeRequestLose[1].headline`: 直訴及ばず――{requesterName}の挑戦試合、{ourOrg} {score} {opponentOrg}
- `NEWS_HEADLINE_TEMPLATES.challengeRequestLose[2].headline`: {opponentName}陣に屈す。{requesterName}の果たし状は{score}で散る
- `NEWS_HEADLINE_TEMPLATES.challengeRequestLose[3].headline`: 直訴の代償――{ourOrg}、{opponentOrg}に {score} で敗北

### challengeRequestLose[].body

- `NEWS_HEADLINE_TEMPLATES.challengeRequestLose[1].body`: {requesterName}が直接願い出て組まれた{opponentOrg}との3対3団体戦は、{score}で{ourOrg}が敗れた。自分から呼んだ試合を取れなかった{requesterName}は、控室を最後まで動かなかった。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestLose[2].body`: {requesterName}の発信で実現したカードだったが、{opponentOrg}の地力が一枚上だった。{score}という数字以上に、リング外の表情に重さが残った試合だった。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestLose[3].body`: {requesterName}が頭を下げて呼んだ越境戦で、{ourOrg}は {score} で星を落とした。呼んだ側が、一番重いものを持ち帰った。次にこの相手と当たる時、何かが変わっているか。

### challengeRequestInverseDefend[].headline

- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDefend[1].headline`: {opponentOrg}の{requesterName}を退ける――{ourOrg} {score} で迎撃成功
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDefend[2].headline`: 果たし状、跳ね返す。{ourOrg}が{requesterName}陣を {score} で下す
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDefend[3].headline`: {requesterName}の越境挑戦、{ourOrg}に阻まれる――{score}

### challengeRequestInverseDefend[].body

- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDefend[1].body`: {opponentOrg}の{requesterName}が{ourOrg}に直訴して実現した3対3団体戦。{ourOrg}は古巣に挑んできた{requesterName}陣を {score} で退け、リング上の決着を貫いた。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDefend[2].body`: {requesterName}が向こうの団体から仕掛けてきた挑戦試合。{ourOrg}は3対3で {score} の星を取り、相手にリングを譲らなかった。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDefend[3].body`: {opponentOrg}の{requesterName}が{ourOrg}を名指しして組まれた団体戦は {score} で{ourOrg}が勝利。「呼ばれた以上、応える」――{ourOrg}陣営の意地が勝った形だ。

### challengeRequestInverseFall[].headline

- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseFall[1].headline`: {opponentOrg}の{requesterName}陣に屈す――{ourOrg} {score}
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseFall[2].headline`: 直訴した側に星――{ourOrg}、{requesterName}陣に {score} で敗北
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseFall[3].headline`: {requesterName}、古巣に星を返す。{ourOrg} {score} {opponentOrg}

### challengeRequestInverseFall[].body

- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseFall[1].body`: {requesterName}の越境直訴で組まれた3対3団体戦は {score} で{ourOrg}の敗北。古巣に持ち帰る形となった{requesterName}は、控室で長く目を閉じていたという。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseFall[2].body`: {opponentOrg}から仕掛けられた挑戦試合で{ourOrg}は {score} の星を落とした。受けて立った{ourOrg}陣営は、リングを去る背中に何かを語らせなかった。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseFall[3].body`: {requesterName}の挑戦を受けた{ourOrg}は {score} で敗れた。「呼んできた側に取られた」――この結果が向こうのリングでどう扱われるか、注視せざるを得ない。

### challengeRequestInverseDraw[].headline

- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDraw[1].headline`: 直訴の3対3、{score}で決着つかず。{requesterName}と{ourOrg}は再び沈黙
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDraw[2].headline`: {ourOrg} {score} {opponentOrg}――{requesterName}の越境挑戦は決着持ち越し

### challengeRequestInverseDraw[].body

- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDraw[1].body`: {opponentOrg}の{requesterName}が{ourOrg}に挑んで組まれた団体戦は {score}。決着がつかないまま、両陣営はリングを降りた。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestInverseDraw[2].body`: 3対3団体戦は {score}。仕掛けた{requesterName}も、迎え撃った{ourOrg}も、リング上で言葉を交わすことなく分かれた。

### firedReturn[].headline

- `NEWS_HEADLINE_TEMPLATES.firedReturn[1].headline`: あの解雇から{weeksSinceFired}週――{name}、古巣に挑む
- `NEWS_HEADLINE_TEMPLATES.firedReturn[2].headline`: {name}、{toOrg}での再起――{weeksSinceFired}週ぶりに{ourOrg}と相見えた
- `NEWS_HEADLINE_TEMPLATES.firedReturn[3].headline`: 解雇{weeksSinceFired}週目の挑戦――{name}、{ourOrg}に何を持ち込むか
- `NEWS_HEADLINE_TEMPLATES.firedReturn[4].headline`: {name}、古巣への一矢――解雇{weeksSinceFired}週で迎えた邂逅
- `NEWS_HEADLINE_TEMPLATES.firedReturn[5].headline`: 別団体・別カラー――{name}が{ourOrg}と再会した夜
- `NEWS_HEADLINE_TEMPLATES.firedReturn[6].headline`: {name}、{weeksSinceFired}週越しの意趣返し――{ourOrg}に食らいついた
- `NEWS_HEADLINE_TEMPLATES.firedReturn[7].headline`: 解雇された夜を忘れない――{name}、{ourOrg}との一戦に懸けたもの

### firedReturn[].body

- `NEWS_HEADLINE_TEMPLATES.firedReturn[1].body`: {ourOrg}を解雇された{name}が、{toOrg}の選手として古巣に対峙した。リング上での目つきには、あの日とは違う何かが宿っていた。
- `NEWS_HEADLINE_TEMPLATES.firedReturn[2].body`: 解雇から{weeksSinceFired}週、{toOrg}に拾われた{name}が初めて{ourOrg}とリングで交差した。捨てられた側の意地を見せる場が、ようやく巡ってきた。
- `NEWS_HEADLINE_TEMPLATES.firedReturn[3].body`: {name}が{toOrg}の選手として{ourOrg}に挑む日が来た。試合前、控室で長く動かなかったという。リング上で何が解放されるのか、注視せざるを得ない一戦となった。
- `NEWS_HEADLINE_TEMPLATES.firedReturn[4].body`: {ourOrg}に切られた{name}が、{toOrg}の旗を背負って戻ってきた。あの日リングを降りた後の{weeksSinceFired}週が、この一戦に集約される。
- `NEWS_HEADLINE_TEMPLATES.firedReturn[5].body`: 解雇から{weeksSinceFired}週、{toOrg}でのキャリアを歩み始めた{name}と{ourOrg}が再びリングで交わった。決着の形は人によって違うが、この夜の意味だけは誰もが理解していた。
- `NEWS_HEADLINE_TEMPLATES.firedReturn[6].body`: {ourOrg}を追われた{name}が、{toOrg}のリングで因縁の相手と対峙した。{weeksSinceFired}週分の言葉を、拳に変えて叩きつける一戦になった。
- `NEWS_HEADLINE_TEMPLATES.firedReturn[7].body`: {toOrg}に居場所を得た{name}にとって、{ourOrg}との対戦は特別な意味を持つ。{weeksSinceFired}週前に切られたあの夜、リングの上で何かが動き出した。

### challengeRequestDraw[].headline

- `NEWS_HEADLINE_TEMPLATES.challengeRequestDraw[1].headline`: 直訴の3対3、{score}で決着つかず。{requesterName}と{opponentName}は再び沈黙
- `NEWS_HEADLINE_TEMPLATES.challengeRequestDraw[2].headline`: {ourOrg} {score} {opponentOrg}――{requesterName}の挑戦は決着持ち越し

### challengeRequestDraw[].body

- `NEWS_HEADLINE_TEMPLATES.challengeRequestDraw[1].body`: {requesterName}が直訴して実現した{opponentOrg}との団体戦は {score}。決着がつかないまま、両陣営はリングを降りた。
- `NEWS_HEADLINE_TEMPLATES.challengeRequestDraw[2].body`: 3対3団体戦は {score}。直訴した{requesterName}も、受けて立った{opponentName}も、リング上で言葉を交わすことなく分かれた。

### titleChange[].headline

- `NEWS_HEADLINE_TEMPLATES.titleChange[1].headline`: 激震！{org}の王座が動いた！{name}が新王者に
- `NEWS_HEADLINE_TEMPLATES.titleChange[2].headline`: 王座交代！{name}が{org}の頂点を奪取
- `NEWS_HEADLINE_TEMPLATES.titleChange[3].headline`: {org}に新女王誕生。{name}が王座を戴冠

### titleChange[].body

- `NEWS_HEADLINE_TEMPLATES.titleChange[1].body`: {org}のタイトルマッチで大波乱。{prevChamp}を破った{name}が新チャンピオンの座に就いた。新王者の時代は長く続くのか、それとも――
- `NEWS_HEADLINE_TEMPLATES.titleChange[2].body`: 壮絶な一戦の末、{name}が新チャンピオンに。敗れた{prevChamp}は雪辱を期すことになる。{org}の新時代が始まる。
- `NEWS_HEADLINE_TEMPLATES.titleChange[3].body`: {prevChamp}の牙城を崩した{name}。ファンの歓声が会場を包む中、新王者の時代が幕を開けた。

### defenseRecord[].headline

- `NEWS_HEADLINE_TEMPLATES.defenseRecord[1].headline`: 盤石！{name}、{count}度目の防衛に成功。王座を脅かす者はいるのか
- `NEWS_HEADLINE_TEMPLATES.defenseRecord[2].headline`: 伝説へ――{name}、前人未到の{count}回防衛
- `NEWS_HEADLINE_TEMPLATES.defenseRecord[3].headline`: もはや神話。{name}の王座は誰にも止められない

### defenseRecord[].body

- `NEWS_HEADLINE_TEMPLATES.defenseRecord[1].body`: {org}の{name}が{count}回目のタイトル防衛を達成。この安定感は驚異的だ。次の挑戦者にとって、越えるべき壁はさらに高くなった。
- `NEWS_HEADLINE_TEMPLATES.defenseRecord[2].body`: {org}の{name}が{count}回防衛という金字塔を打ち立てた。その強さに対戦者も脱帽。「もはや別格」と業界関係者も舌を巻く。
- `NEWS_HEADLINE_TEMPLATES.defenseRecord[3].body`: {count}回防衛――この数字が全てを物語る。{org}の{name}は最早歴史の一部。挑む者全てを退ける絶対王者は、孤高の頂に立ち続ける。

### breakthrough[].headline

- `NEWS_HEADLINE_TEMPLATES.breakthrough[1].headline`: 新星爆誕！{name}が覚醒、瞬く間に別人に
- `NEWS_HEADLINE_TEMPLATES.breakthrough[2].headline`: {name}にブレークスルー。{org}の新たな武器に
- `NEWS_HEADLINE_TEMPLATES.breakthrough[3].headline`: 覚醒の{name}！ {org}に嬉しい誤算

### breakthrough[].body

- `NEWS_HEADLINE_TEMPLATES.breakthrough[1].body`: {org}の{name}が驚くべき成長を見せた。{detail}。業界関係者も「この選手は化ける」と太鼓判。今後の活躍から目が離せない。
- `NEWS_HEADLINE_TEMPLATES.breakthrough[2].body`: 地道な努力がついに実を結んだ。{org}の{name}が{detail}。本人も驚くほどの変化だという。団体の戦力が一段上がった。
- `NEWS_HEADLINE_TEMPLATES.breakthrough[3].body`: 期待以上の急成長を遂げた{name}。{detail}。{org}のファンからは「ウチのエースはこの子だ」と歓喜の声が上がっている。

### slump[].headline

- `NEWS_HEADLINE_TEMPLATES.slump[1].headline`: 心配される{name}の不調…いつになったら復活？
- `NEWS_HEADLINE_TEMPLATES.slump[2].headline`: {name}に暗雲。{org}の戦力に影響か
- `NEWS_HEADLINE_TEMPLATES.slump[3].headline`: {org}の{name}、苦悩の日々。スランプはいつ明けるのか

### slump[].body

- `NEWS_HEADLINE_TEMPLATES.slump[1].body`: {org}の{name}がスランプに陥っている。練習でも精彩を欠き、周囲も心配顔。「本人が一番苦しんでいる」とチームメイトは語る。
- `NEWS_HEADLINE_TEMPLATES.slump[2].body`: {org}の主力{name}の調子が上がらない。ファンからは激励の声が寄せられるが、復活の兆しはまだ見えない。
- `NEWS_HEADLINE_TEMPLATES.slump[3].body`: かつての輝きを失った{name}。しかし周囲は信じている。「あの子は必ず戻ってくる」と{org}の仲間たちは口を揃える。

### motivationLoss[].headline

- `NEWS_HEADLINE_TEMPLATES.motivationLoss[1].headline`: 引退か――{name}から闘志が消えた？
- `NEWS_HEADLINE_TEMPLATES.motivationLoss[2].headline`: {name}の去就に暗雲。{org}は引き留められるか
- `NEWS_HEADLINE_TEMPLATES.motivationLoss[3].headline`: {org}の{name}、心ここにあらず。業界に衝撃

### motivationLoss[].body

- `NEWS_HEADLINE_TEMPLATES.motivationLoss[1].body`: {org}の{name}にモチベーション喪失の噂。練習を欠席する日も増えたという。「あのギラギラしていた目が…」とファンも心配を隠せない。
- `NEWS_HEADLINE_TEMPLATES.motivationLoss[2].body`: {org}の{name}が闘志を失いつつあるという。関係者によると、プロレスを楽しめなくなっていると漏らしているとか。復活を願う声が業界に広がる。
- `NEWS_HEADLINE_TEMPLATES.motivationLoss[3].body`: かつてリングを沸かせた{name}の目から光が消えた。何のために戦うのか——それを見失った姿に、ファンは言葉を失った。

### hallOfFame[].headline

- `NEWS_HEADLINE_TEMPLATES.hallOfFame[1].headline`: 栄光の殿堂入り！{name}の輝かしいキャリアを振り返る
- `NEWS_HEADLINE_TEMPLATES.hallOfFame[2].headline`: {name}、殿堂入り。伝説は永遠に刻まれた
- `NEWS_HEADLINE_TEMPLATES.hallOfFame[3].headline`: 感動の殿堂入りセレモニー。{name}に万雷の拍手

### hallOfFame[].body

- `NEWS_HEADLINE_TEMPLATES.hallOfFame[1].body`: タイトル{titles}回獲得、防衛{defenses}回。{name}の偉大なキャリアに、業界全体が敬意を表した。プロレスに全てを捧げた半生が、この日たしかに報われた。
- `NEWS_HEADLINE_TEMPLATES.hallOfFame[2].body`: 数々の名勝負を生んだ{name}が殿堂入り。受賞の挨拶が終わると、会場はスタンディングオベーションに包まれた。
- `NEWS_HEADLINE_TEMPLATES.hallOfFame[3].body`: 引退後もなおファンに愛される{name}。タイトル{titles}回、防衛{defenses}回の偉業。後輩たちに繋いだ道は、これからも色褪せない。

### retirement[].headline

- `NEWS_HEADLINE_TEMPLATES.retirement[1].headline`: ありがとう{name}――リングに別れを告げた戦士
- `NEWS_HEADLINE_TEMPLATES.retirement[2].headline`: {name}、引退。{org}の一時代が終わる
- `NEWS_HEADLINE_TEMPLATES.retirement[3].headline`: さようなら{name}。最後のゴングが鳴った

### retirement[].body

- `NEWS_HEADLINE_TEMPLATES.retirement[1].body`: {org}の{name}が現役を退いた。{detail}。最後まで全力で闘い抜いてリングを降りる姿に、ファンから惜別の涙が溢れた。
- `NEWS_HEADLINE_TEMPLATES.retirement[2].body`: {org}を支えた{name}がリングを去った。{detail}。最後に深々と下げられた頭が、全てを物語っていた。
- `NEWS_HEADLINE_TEMPLATES.retirement[3].body`: 長きにわたり{org}を背負った{name}が引退を決断。{detail}。悔いはないと言い切る、その穏やかな表情が印象的だった。

### contractBetrayalChampCarry[].headline

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalChampCarry[1].headline`: 衝撃の裏切り――{name}がベルトを抱えて{toOrg}へ
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalChampCarry[2].headline`: 王座を抱えての離脱――{name}、{toOrg}入り

### contractBetrayalChampCarry[].body

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalChampCarry[1].body`: {fromOrg}の{name}が契約を蹴って{toOrg}へ電撃移籍。団体王座まで持ち去られる前代未聞の事態に、ロッカールームには重い沈黙が流れた。ベルトの行方を巡る騒動は、業界全体を巻き込みつつある。
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalChampCarry[2].body`: {fromOrg}が抱える看板タイトルを保持したまま、{name}が{toOrg}への移籍を決断。残された選手たちは「あれが仲間だったとは思いたくない」と肩を落とす。奪還の挑戦状なくして決着はつかない。

### contractBetrayalChampLeave[].headline

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalChampLeave[1].headline`: {name}が{toOrg}へ――ベルトは置いて去った
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalChampLeave[2].headline`: 王座返上――{name}、{toOrg}へ移籍

### contractBetrayalChampLeave[].body

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalChampLeave[1].body`: {fromOrg}との契約交渉が決裂し、{name}が{toOrg}へ去った。王座は返上、空位に。ベルトを置いて去るというその幕引きに、複雑な思いを抱くファンも少なくない。
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalChampLeave[2].body`: 団体王座を保持していた{name}が{toOrg}への移籍を表明。ベルトはリング中央に置かれたまま空位となった。{fromOrg}は早急に王座決定戦の準備に入る。

### contractBetrayalRivalOrg[].headline

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalRivalOrg[1].headline`: 因縁の相手へ――{name}、{toOrg}に移籍
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalRivalOrg[2].headline`: 禁断の移籍――{name}が{toOrg}入り

### contractBetrayalRivalOrg[].body

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalRivalOrg[1].body`: {fromOrg}を離れた{name}が、よりによって因縁の{toOrg}へ。「これは裏切りだ」とロッカールームから怒号が漏れた。次にリングで顔を合わせる時、その視線がどう変わっているのか――。
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalRivalOrg[2].body`: 幾度も激戦を繰り広げてきた{toOrg}に、{fromOrg}の{name}が加入。残された仲間の表情には怒りと困惑が混じる。次の対抗戦は感情の渦になることが避けられない。

### contractBetrayalAce[].headline

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalAce[1].headline`: エース流出――{name}が{toOrg}へ
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalAce[2].headline`: 看板選手の離脱――{name}、{toOrg}入り

### contractBetrayalAce[].body

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalAce[1].body`: {fromOrg}の屋台骨を支えた{name}が{toOrg}への移籍を決断。看板選手の喪失に、団体の前途には暗雲が垂れ込める。残された選手たちは奮起できるか。
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalAce[2].body`: OVR上位常連の{name}が{fromOrg}を離れて{toOrg}へ。チームの戦力構成は大きく変わる。ファンからは「次のエースは誰になる」と早くも期待と不安の声が混ざる。

### contractBetrayalGeneric[].headline

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalGeneric[1].headline`: {name}が{toOrg}へ――契約交渉決裂
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalGeneric[2].headline`: 移籍決定――{name}が{toOrg}入り

### contractBetrayalGeneric[].body

- `NEWS_HEADLINE_TEMPLATES.contractBetrayalGeneric[1].body`: {fromOrg}との契約交渉がまとまらず、{name}は{toOrg}への移籍を決断した。円満とは言い難い幕切れだけに、残された仲間との関係にも微妙な空気が漂う。
- `NEWS_HEADLINE_TEMPLATES.contractBetrayalGeneric[2].body`: {fromOrg}を出た{name}が{toOrg}と契約。条件面での折り合いがつかなかったとされる。新天地での活躍に注目が集まる。

### poachSuccess[].headline

- `NEWS_HEADLINE_TEMPLATES.poachSuccess[1].headline`: 電撃移籍！{name}が{toOrg}に加入。{fromOrg}は大打撃か
- `NEWS_HEADLINE_TEMPLATES.poachSuccess[2].headline`: {name}が移籍。{toOrg}の戦力強化なるか
- `NEWS_HEADLINE_TEMPLATES.poachSuccess[3].headline`: {toOrg}が{name}を獲得！ 補強の目玉に

### poachSuccess[].body

- `NEWS_HEADLINE_TEMPLATES.poachSuccess[1].body`: {fromOrg}の{name}が{toOrg}への移籍を決断。OVR{ovr}の実力者の流出に{fromOrg}関係者は衝撃を隠せない。新天地で自分を試す道を選んだ形だ。
- `NEWS_HEADLINE_TEMPLATES.poachSuccess[2].body`: {fromOrg}から{toOrg}へ――{name}の電撃移籍が決まった。チャンスを掴みに行く決断に、新たなファンの期待が集まる。
- `NEWS_HEADLINE_TEMPLATES.poachSuccess[3].body`: {toOrg}が{fromOrg}の{name}を引き抜きに成功。即戦力としてチームを底上げする見込み。「この移籍は大きい」と業界紙が一様に報じた。

### warMilestone[].headline

- `NEWS_HEADLINE_TEMPLATES.warMilestone[1].headline`: 金字塔！{orgName}、対抗戦通算{milestone}達成
- `NEWS_HEADLINE_TEMPLATES.warMilestone[2].headline`: {orgName}の誇り――対抗戦通算{milestone}の偉業
- `NEWS_HEADLINE_TEMPLATES.warMilestone[3].headline`: 止まらない{orgName}！ 対抗戦{milestone}突破

### warMilestone[].body

- `NEWS_HEADLINE_TEMPLATES.warMilestone[1].body`: {orgName}が対抗戦通算{wins}勝目を記録。他団体との激闘を重ね、団体の威信を着実に積み上げている。選手たちの士気も大いに高まっているようだ。
- `NEWS_HEADLINE_TEMPLATES.warMilestone[2].body`: 対抗戦通算{wins}勝。{orgName}が団体の歴史に新たな金字塔を刻んだ。選手たちは「みんなで勝ち取った記録」と胸を張る。
- `NEWS_HEADLINE_TEMPLATES.warMilestone[3].body`: {orgName}が対抗戦通算{wins}勝の節目を突破した。他団体にとって脅威となるその強さは、ロッカールームの結束の賜物だろう。

### emptyVenue[].headline

- `NEWS_HEADLINE_TEMPLATES.emptyVenue[1].headline`: 閑古鳥…{org}の興行がガラガラ。団体人気に打撃
- `NEWS_HEADLINE_TEMPLATES.emptyVenue[2].headline`: {org}の興行に閑古鳥。集客力の低下が深刻に
- `NEWS_HEADLINE_TEMPLATES.emptyVenue[3].headline`: 赤信号！ {org}の興行、空席だらけの衝撃

### emptyVenue[].body

- `NEWS_HEADLINE_TEMPLATES.emptyVenue[1].body`: {org}の興行で空席が目立った。観客席の3割も埋まらない惨状に、関係者の間に危機感が広がっている。ファンの心を取り戻せるか、正念場だ。
- `NEWS_HEADLINE_TEMPLATES.emptyVenue[2].body`: 会場に響くのは選手の声ばかり――{org}の興行が大幅な集客割れとなった。「このままでは…」と関係者も頭を抱えている。
- `NEWS_HEADLINE_TEMPLATES.emptyVenue[3].body`: {org}の興行が壊滅的な集客に終わった。団体の看板に傷がつく事態に、社長の手腕が問われる局面だ。

### lockerRoomCrisis[].headline

- `NEWS_HEADLINE_TEMPLATES.lockerRoomCrisis[1].headline`: {org}ロッカールームに不穏——険悪ペア{count}組、内部に亀裂
- `NEWS_HEADLINE_TEMPLATES.lockerRoomCrisis[2].headline`: {org}内紛の予兆——険悪な選手同士が同じ控室に
- `NEWS_HEADLINE_TEMPLATES.lockerRoomCrisis[3].headline`: 荒れる{org}の控室——険悪{count}組、空気が冷えきっている

### lockerRoomCrisis[].body

- `NEWS_HEADLINE_TEMPLATES.lockerRoomCrisis[1].body`: {org}の控室に重い空気が立ち込めている。絆の崩れた{count}組が同じ空間で身を支度する日々——挨拶もなく、目線も合わない。「あの空気の中で試合に出ろと言われても」と若手が漏らす。社長が動かなければ、これは長引く。
- `NEWS_HEADLINE_TEMPLATES.lockerRoomCrisis[2].body`: {org}のロッカールームで{count}組の険悪ペアが同居している。リング外での衝突こそ表沙汰になっていないが、関係者は「いつ火を噴いてもおかしくない」と口を揃える。団体としての一枚岩が試されている。
- `NEWS_HEADLINE_TEMPLATES.lockerRoomCrisis[3].body`: 同じ団体の選手同士が、視線も交わさず通り過ぎる——{org}の控室で起きているのはそういう光景だ。bond ≤30 の組み合わせが{count}組も同居しているとなれば、興行のテンションにも影響が出かねない。

### hatredContagion[].headline

- `NEWS_HEADLINE_TEMPLATES.hatredContagion[1].headline`: {org}に広がる嫌悪の連鎖——{carrier}が{enemy}を距離を取り始めた
- `NEWS_HEADLINE_TEMPLATES.hatredContagion[2].headline`: 心の伝染——{carrier}の中で{enemy}への感情が変わった

### hatredContagion[].body

- `NEWS_HEADLINE_TEMPLATES.hatredContagion[1].body`: 親しい{friend}が{enemy}を疎んじているのを目の当たりにした{carrier}が、自分の中の感情を整理しきれずに距離を取り始めている。心の冷えは、確実に伝染する。
- `NEWS_HEADLINE_TEMPLATES.hatredContagion[2].body`: {org}の{carrier}は、{friend}が{enemy}を見る目を覚えてしまった。それは知らず知らずに自分の判断にも染み込んでいく。気づけば、あの人と前のように話すことはなくなっていた。

### relationshipRepair[].headline

- `NEWS_HEADLINE_TEMPLATES.relationshipRepair[1].headline`: {nameA}と{nameB}の関係修復に成功——{org}が動いた
- `NEWS_HEADLINE_TEMPLATES.relationshipRepair[2].headline`: {org}、{nameA}と{nameB}の溝を埋める——再び同じリングへ

### relationshipRepair[].body

- `NEWS_HEADLINE_TEMPLATES.relationshipRepair[1].body`: 長く険悪だった{nameA}と{nameB}の間に、社長が間に入って話し合いの場が持たれた。完全な和解とまではいかないが、控室で挨拶が交わされる程度には空気が変わったという。{org}にとっては小さな、しかし意味のある一歩だ。
- `NEWS_HEADLINE_TEMPLATES.relationshipRepair[2].body`: 社長の仲介で{nameA}と{nameB}が膝を突き合わせて話した。溜め込んでいた言葉を、ようやく互いに吐き出せたようだ。絆が戻ったかどうかは外からはわからない。だが、控室の空気が変わったことは確かだ。

### relationshipRepairFail[].headline

- `NEWS_HEADLINE_TEMPLATES.relationshipRepairFail[1].headline`: {org}の関係修復は不発——{nameA}と{nameB}の溝は埋まらず

### relationshipRepairFail[].body

- `NEWS_HEADLINE_TEMPLATES.relationshipRepairFail[1].body`: 社長が{nameA}と{nameB}の間に入ったが、二人の間に流れる溝は思ったより深かった。顔を合わせて話せる段階にすら、まだ達していない——会談は短く終わった。社長の手が届かない関係もある。

### factionFormed[].headline

- `NEWS_HEADLINE_TEMPLATES.factionFormed[1].headline`: {org}に派閥誕生——{leaderName}を中心に旗揚げ
- `NEWS_HEADLINE_TEMPLATES.factionFormed[2].headline`: {leaderName}が旗を掲げた——{org}内の新たな勢力図

### factionFormed[].body

- `NEWS_HEADLINE_TEMPLATES.factionFormed[1].body`: {org}の{leaderName}を中心とした集団が、団体内で独自の旗を掲げた。「派閥」という言葉が好まれるかどうかは別として、控室の力学は確実に変わる。これからの興行の組み方にも影響が出るだろう。
- `NEWS_HEADLINE_TEMPLATES.factionFormed[2].body`: {org}内に{leaderName}を中心とした集まりが形を成した。慕う者たちが集い、「ここで戦いたい」と表明し始めた格好だ。一枚岩だった団体が、初めて色分けされた瞬間でもある。

### factionEscalation[].headline

- `NEWS_HEADLINE_TEMPLATES.factionEscalation[1].headline`: {org}内で派閥抗争勃発——「{factionAName}」vs「{factionBName}」
- `NEWS_HEADLINE_TEMPLATES.factionEscalation[2].headline`: {org}、二つの派閥が真正面から対立——抗争の幕が開く

### factionEscalation[].body

- `NEWS_HEADLINE_TEMPLATES.factionEscalation[1].body`: {org}の中で「{factionAName}」と「{factionBName}」の対立が表面化した。控室の空気は割れ、興行のメインカードの組み方一つでも気を使う事態に。「リングで決着をつけるしかない」——両派から漏れる声は冷たく、重い。
- `NEWS_HEADLINE_TEMPLATES.factionEscalation[2].body`: {factionAName}と{factionBName}——{org}の中の二つの派閥が、ついに表立って衝突した。リング外でのやり取りも険悪さを増し、団体としての結束は試されている。これから組まれる試合は、ただの試合では済まなくなる。

### factionResolution[].headline

- `NEWS_HEADLINE_TEMPLATES.factionResolution[1].headline`: {org}派閥抗争に決着——「{winFaction}」が「{loseFaction}」を下す
- `NEWS_HEADLINE_TEMPLATES.factionResolution[2].headline`: 抗争に終止符——{winFaction}の勝利で{org}に静寂が戻る

### factionResolution[].body

- `NEWS_HEADLINE_TEMPLATES.factionResolution[1].body`: {org}内で続いていた派閥抗争に、リング上で一つの答えが出た。{winFaction}が{loseFaction}を下し、控室の力学はしばらくこの形で固まる見込みだ。敗れた側の {loseLeader} がこのあとどう動くかが次の焦点になる。
- `NEWS_HEADLINE_TEMPLATES.factionResolution[2].body`: 長く続いた{org}内の対立は、{winFaction}と{loseFaction}の決着戦で一旦の幕引きとなった。完全な和解ではないが、これ以上の消耗を避けるという意味では、双方にとっての落とし所だったのかもしれない。

### factionDissolution[].headline

- `NEWS_HEADLINE_TEMPLATES.factionDissolution[1].headline`: {org}の派閥「{factionName}」が消滅——{leaderName}の喪失で求心力失う

### factionDissolution[].body

- `NEWS_HEADLINE_TEMPLATES.factionDissolution[1].body`: {org}内に存在した「{factionName}」が、リーダー{leaderName}の不在を埋めきれず消滅した。残されたメンバーたちは新たな居場所を探すことになる。派閥が消えても、その間に積み重ねた感情はそう簡単には消えない。

### factionSplit[].headline

- `NEWS_HEADLINE_TEMPLATES.factionSplit[1].headline`: {org}派閥分裂——「{factionName}」から{ringleaderName}が離脱

### factionSplit[].body

- `NEWS_HEADLINE_TEMPLATES.factionSplit[1].body`: {org}内の「{factionName}」から、{ringleaderName}を中心とした一派が離脱した。控室には新たな勢力線が引かれ、興行の組み方はさらに難しくなる。一つだった旗が、いま二つに割れた瞬間だ。

### factionSuccession[].headline

- `NEWS_HEADLINE_TEMPLATES.factionSuccession[1].headline`: {org}「{factionName}」に新リーダー——{newLeaderName}が看板を継ぐ
- `NEWS_HEADLINE_TEMPLATES.factionSuccession[2].headline`: {newLeaderName}、「{factionName}」を継承——{org}の火は消えず

### factionSuccession[].body

- `NEWS_HEADLINE_TEMPLATES.factionSuccession[1].body`: {oldLeaderName}が去った「{factionName}」で、{newLeaderName}が新たに旗を預かることになった。慕われた前任者の穴は小さくない。それでも残った者たちは、この人の下でやっていくと決めたようだ。看板の重さを知るのは、これからだ。
- `NEWS_HEADLINE_TEMPLATES.factionSuccession[2].body`: リーダー不在となっていた{org}の「{factionName}」が、{newLeaderName}を新たな中心に据えて再出発する。{oldLeaderName}の色が濃かった集団だけに、率い方はおのずと変わるだろう。頭が替われば、控室の力学は必ず動く。

### factionCoup[].headline

- `NEWS_HEADLINE_TEMPLATES.factionCoup[1].headline`: 下剋上——{challengerName}が「{factionName}」の頭を獲った
- `NEWS_HEADLINE_TEMPLATES.factionCoup[2].headline`: 「{factionName}」で政変——{challengerName}がリーダーの座を奪取

### factionCoup[].body

- `NEWS_HEADLINE_TEMPLATES.factionCoup[1].body`: {org}の「{factionName}」で、序列の頂点が入れ替わった。{challengerName}が{oldLeaderName}をリングで下し、派閥は「{newFactionName}」として看板を掛け替える。実力で頭を獲る——プロレスの派閥における、最も古くて最も正しい代替わりだ。
- `NEWS_HEADLINE_TEMPLATES.factionCoup[2].body`: 積み上げた序列を賭けた一戦は、挑む側に軍配が上がった。{org}の「{factionName}」は{challengerName}を新たな頭に頂き、「{newFactionName}」と名を改める。敗れた{oldLeaderName}がこの屈辱をどう飲み込むか——控室の目は、既にそちらへ向いている。

### factionDefection[].headline

- `NEWS_HEADLINE_TEMPLATES.factionDefection[1].headline`: {targetName}が寝返った——「{fromFaction}」から「{toFaction}」へ電撃移籍
- `NEWS_HEADLINE_TEMPLATES.factionDefection[2].headline`: 衝撃の鞍替え——{targetName}、「{toFaction}」入り

### factionDefection[].body

- `NEWS_HEADLINE_TEMPLATES.factionDefection[1].body`: {org}の派閥地図が塗り替わった。{targetName}が「{fromFaction}」を離れ、抗争相手である「{toFaction}」の門を叩いたのだ。残された側の心中は穏やかではあるまい。裏切りと呼ぶか、決断と呼ぶか——それを決めるのは、これからの試合だ。
- `NEWS_HEADLINE_TEMPLATES.factionDefection[2].body`: 「{fromFaction}」の一員だった{targetName}が、対立する「{toFaction}」へ身を移した。{org}の控室に走った緊張は、当分解けそうにない。かつての仲間と敵として向き合う日は、そう遠くないはずだ。

### factionHiatus[].headline

- `NEWS_HEADLINE_TEMPLATES.factionHiatus[1].headline`: {org}「{factionName}」が活動休止——{leaderName}の長期離脱が痛手

### factionHiatus[].body

- `NEWS_HEADLINE_TEMPLATES.factionHiatus[1].body`: {leaderName}を欠いた「{factionName}」が、旗を一旦降ろすことを決めた。解散ではない、あくまで休止——残った者たちはそれぞれの戦いに戻る。頭の帰りを待つ集団が再び旗を掲げる日は、来るのだろうか。

### factionReconcile[].headline

- `NEWS_HEADLINE_TEMPLATES.factionReconcile[1].headline`: 雪解け——{org}の「{factionAName}」と「{factionBName}」が和解

### factionReconcile[].body

- `NEWS_HEADLINE_TEMPLATES.factionReconcile[1].body`: 長く続いた対立に、両派が区切りをつけた。社長の仲介で場が持たれ、「{factionAName}」と「{factionBName}」は矛を収めることで一致したという。控室の空気は目に見えて軽くなった。もっとも、一度割れた線がそう簡単に消えないことも、皆知っている。

### factionShowdown[].headline

- `NEWS_HEADLINE_TEMPLATES.factionShowdown[1].headline`: 頂上直接対決へ——「{factionAName}」{leaderAName} vs 「{factionBName}」{leaderBName}
- `NEWS_HEADLINE_TEMPLATES.factionShowdown[2].headline`: {leaderAName}と{leaderBName}、リング上で白黒——{org}が仕掛けた頂上対決

### factionShowdown[].body

- `NEWS_HEADLINE_TEMPLATES.factionShowdown[1].body`: {org}の派閥抗争が、ついに両リーダーの一騎打ちという形で決着の場を得た。次期興行のメインに据えられるこの一戦、負けた側の派閥が失うものは星ひとつでは済まない。控室の全員にとって、この試合だけは他人事ではない。
- `NEWS_HEADLINE_TEMPLATES.factionShowdown[2].body`: 「{factionAName}」と「{factionBName}」の対立は、言葉ではもう埋まらない段階に来ていた。社長はそれを承知で、両者をメインに置く。派閥の頭同士が直接ぶつかる——これ以上の決着方法を、プロレスは持っていない。

### factionWarSettled[].headline

- `NEWS_HEADLINE_TEMPLATES.factionWarSettled[1].headline`: 派閥対抗戦決着——「{winFaction}」が「{loseFaction}」を制す
- `NEWS_HEADLINE_TEMPLATES.factionWarSettled[2].headline`: 「{winFaction}」が対抗戦を制圧——{loseLeader}の派閥に重い星

### factionWarSettled[].body

- `NEWS_HEADLINE_TEMPLATES.factionWarSettled[1].body`: {org}で組まれた派閥対抗戦は、{score}で「{winFaction}」に軍配が上がった。率いた{winLeader}の株は上がり、敗れた「{loseFaction}」の{loseLeader}は言葉少なにリングを降りた。序列はリングの上で決まる——その原則が、また一つ証明された。
- `NEWS_HEADLINE_TEMPLATES.factionWarSettled[2].body`: 派閥の意地を賭けた対抗戦は{score}。「{winFaction}」が地力の差を示す結果となった。勝った側の宴と、負けた側の沈黙。{org}の控室は今週、二つの温度に分かれている。

### factionEndless[].headline

- `NEWS_HEADLINE_TEMPLATES.factionEndless[1].headline`: 終わらない抗争——{org}の「{factionAName}」と「{factionBName}」、対立は年を越す

### factionEndless[].body

- `NEWS_HEADLINE_TEMPLATES.factionEndless[1].body`: 決着戦でも、話し合いでも消えなかった火がある。「{factionAName}」と「{factionBName}」の対立は、もはや{org}の風土の一部と化した。ファンはこの緊張を目当てに会場へ足を運ぶ。憎悪も、長く続けば名物になる。

### factionPeace[].headline

- `NEWS_HEADLINE_TEMPLATES.factionPeace[1].headline`: {org}の派閥抗争が沈静化——「{factionAName}」と「{factionBName}」に停戦の空気

### factionPeace[].body

- `NEWS_HEADLINE_TEMPLATES.factionPeace[1].body`: 燃え上がった対立が、静かに温度を下げた。「{factionAName}」と「{factionBName}」の間に流れていた険悪な空気は、ここ数週で目に見えて薄まったという。決着がついたわけではない。ただ、いまは矛を交える理由がない——それだけのことだ。

### factionInternalBout[].headline

- `NEWS_HEADLINE_TEMPLATES.factionInternalBout[1].headline`: 同門対決実現——「{factionName}」の{nameA}と{nameB}がリングで激突

### factionInternalBout[].body

- `NEWS_HEADLINE_TEMPLATES.factionInternalBout[1].body`: {org}の「{factionName}」内でくすぶっていた火種を、社長は隠さず試合にした。{nameA}と{nameB}、同じ旗の下の二人が正面からぶつかる。仲間割れと見るか、健全な競争と見るか。いずれにせよ、同門戦は嘘がつけない。

### factionCamp[].headline

- `NEWS_HEADLINE_TEMPLATES.factionCamp[1].headline`: 「{factionName}」が合宿へ——{org}の結束固め

### factionCamp[].body

- `NEWS_HEADLINE_TEMPLATES.factionCamp[1].body`: {org}の「{factionName}」がまとまって汗を流したと聞く。派手なニュースではない。だが、同じ釜の飯がリングの連携に出ることを、この業界の人間は皆知っている。

### factionMediaFeature[].headline

- `NEWS_HEADLINE_TEMPLATES.factionMediaFeature[1].headline`: 「{factionName}」にメディアの照明——{leaderName}が特集取材に応じる

### factionMediaFeature[].body

- `NEWS_HEADLINE_TEMPLATES.factionMediaFeature[1].body`: {org}の「{factionName}」に取材が入った。カメラの前で語る{leaderName}の言葉は、良くも悪くも団体の外へ届く。派閥が団体の顔になる——それを歓迎するかどうかは、社長の胸三寸だ。

### factionJointProject[].headline

- `NEWS_HEADLINE_TEMPLATES.factionJointProject[1].headline`: 「{factionAName}」と「{factionBName}」が合同企画——{org}に珍しい共闘

### factionJointProject[].body

- `NEWS_HEADLINE_TEMPLATES.factionJointProject[1].body`: 普段は別の旗を掲げる二つの派閥が、手を組んで企画を打った。{org}の控室に流れる空気は悪くない。対立だけが派閥の使い道ではない、ということだろう。

### reclaimChallenge[].headline

- `NEWS_HEADLINE_TEMPLATES.reclaimChallenge[1].headline`: 挑戦状！{challengerName}が{toOrg}に王座奪還を要求
- `NEWS_HEADLINE_TEMPLATES.reclaimChallenge[2].headline`: {challengerName}、{toOrg}に殴り込み——ベルト奪還へ

### reclaimChallenge[].body

- `NEWS_HEADLINE_TEMPLATES.reclaimChallenge[1].body`: {fromOrg}の{challengerName}が、{toOrg}に持ち去られた団体王座への奪還挑戦状を叩きつけた。あのベルトが生まれたのは自分たちのリングだ——その主張に、会見場の空気が張り詰めた。次の興行で運命の一戦が組まれる。
- `NEWS_HEADLINE_TEMPLATES.reclaimChallenge[2].body`: 王座のベルトを抱えて{toOrg}へ移った元同僚に対し、{fromOrg}の{challengerName}が奪還を宣言した。裏切りへの答えはリングの上で——次の興行のメインで決着がつく。

### reclaimSuccess[].headline

- `NEWS_HEADLINE_TEMPLATES.reclaimSuccess[1].headline`: 王座奪還！{challengerName}が{toOrg}からベルトを取り戻した
- `NEWS_HEADLINE_TEMPLATES.reclaimSuccess[2].headline`: 雪辱——{challengerName}、奪われた王座を取り戻す

### reclaimSuccess[].body

- `NEWS_HEADLINE_TEMPLATES.reclaimSuccess[1].body`: {fromOrg}の{challengerName}が、{toOrg}に持ち去られていた団体王座を取り戻した。ベルトは本来の場所に戻った。裏切られた団体の意地が、リングの上で結実した瞬間だ。
- `NEWS_HEADLINE_TEMPLATES.reclaimSuccess[2].body`: {toOrg}に持ち去られていたベルトが、{fromOrg}の{challengerName}の手元に帰ってきた。会見場には涙ぐむ関係者の姿もあった。失われたものを取り戻す——その重みを、彼女は背負ってリングに上がった。

### reclaimFailure[].headline

- `NEWS_HEADLINE_TEMPLATES.reclaimFailure[1].headline`: {challengerName}の奪還挑戦は失敗——{toOrg}が王座を死守

### reclaimFailure[].body

- `NEWS_HEADLINE_TEMPLATES.reclaimFailure[1].body`: {fromOrg}の{challengerName}が仕掛けた奪還戦は、{toOrg}側の防衛に終わった。またしてもベルトには届かなかった——それでも、リングを降りる挑戦者の背中にファンから声援が飛んだ。物語はまだ終わらない。

### firstMeetSinceDeparture[].headline

- `NEWS_HEADLINE_TEMPLATES.firstMeetSinceDeparture[1].headline`: 元同僚、リングで再会——{nameA}と{nameB}、離脱後初の対戦
- `NEWS_HEADLINE_TEMPLATES.firstMeetSinceDeparture[2].headline`: {nameA} vs {nameB}——別れた者同士、運命の初対決

### firstMeetSinceDeparture[].body

- `NEWS_HEADLINE_TEMPLATES.firstMeetSinceDeparture[1].body`: 同じ控室で過ごした日々があった{nameA}と{nameB}が、団体を別にしてから初めてリングで向き合った。視線の交わし方一つにも、過ごした時間の重みが滲む。観客はその空気を、確かに受け取っていた。
- `NEWS_HEADLINE_TEMPLATES.firstMeetSinceDeparture[2].body`: 袂を分かった元同僚同士の最初の一戦は、いつも特別なものになる。{nameA}と{nameB}——かつて同じ旗の下にいた二人が、今夜は別の色で対峙した。試合内容以上に、その表情を覚えておきたい。

### mqAllTimeRecord[].headline

- `NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord[1].headline`: 業界最高評価を更新――{name}対{name2}、{mq}点
- `NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord[2].headline`: {mq}点――過去最高の試合評価が生まれた夜
- `NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord[3].headline`: 歴代最高評価、{mq}点に更新――{name}が刻んだ数字

### mqAllTimeRecord[].body

- `NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord[1].body`: {orgName}の{stage}で行われた一戦が、試合評価{mq}点を記録した。これまでの業界最高は{prevRecord}点。数字の上で、{name}と{name2}の攻防が過去のすべてを上回ったことになる。勝者は{name}。ただ、この点数は勝った側だけのものではない。敗れた{name2}がいなければ、この数字は出ていない。
- `NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord[2].body`: {name}が{name2}を下した一戦の評価は{mq}点。旧記録の{prevRecord}点を上回り、業界の歴代最高が更新された。舞台は{stage}。派手な決着ではなかったが、攻防の密度がそのまま数字に出た。狙って出せる記録ではない。この日、それがひとつ塗り替わった。
- `NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord[3].body`: {orgName}のメインで{name}と{name2}が繰り広げた攻防が、試合評価{mq}点を叩き出した。これまでの最高は{prevRecord}点。差はわずかだが、記録は記録だ。勝ったのは{name}。この数字は当分、業界が試合を測るときの基準として残る。

### mqTagRecord[].headline

- `NEWS_HEADLINE_TEMPLATES.mqTagRecord[1].headline`: タッグ戦の歴代最高評価を更新――{nameA1}＆{nameA2}組、{mq}点
- `NEWS_HEADLINE_TEMPLATES.mqTagRecord[2].headline`: {mq}点――タッグにはタッグの歴史がある
- `NEWS_HEADLINE_TEMPLATES.mqTagRecord[3].headline`: タッグの歴代最高評価、{mq}点に更新

### mqTagRecord[].body

- `NEWS_HEADLINE_TEMPLATES.mqTagRecord[1].body`: {orgName}の{stage}で組まれたタッグ戦が、試合評価{mq}点を記録した。これまでのタッグ戦の最高は{prevRecord}点。シングルの歴代最高とは別に積み上げられてきた数字が、この夜また一つ塗り替わった。{nameA1}と{nameA2}が{nameB1}＆{nameB2}組を下したが、点数を跳ね上げたのは四人の噛み合いだ。息の合った連係も、それを崩そうとする相手の意地も、すべてが同じリングで回っていた。｜{nameA1}と{nameA2}がこの日までに費やした時間が、そのまま数字の裏付けになっている。組んだ当初のぎこちなさを知る者ほど、その連携の成熟に驚くだろう。率先して前に出る{nameA1}、崩れた流れを立て直す{nameA2}。単独でもトップを背負える二人が我を張らずに合わせた結果の連係の精度という一点は、辛口を通す本紙も認めざるを得ない。
- `NEWS_HEADLINE_TEMPLATES.mqTagRecord[2].body`: {nameA1}＆{nameA2}組が挙げた一勝の評価は{mq}点。旧記録の{prevRecord}点を上回り、タッグ戦の歴代最高が更新された。舞台は{stage}。単騎の攻防では出ない数字だ。二組四人が同時に噛み合い、誰か一人の見せ場では終わらない完成度がそのまま点に出た。敗れた{nameB1}＆{nameB2}組の連係が高かったことも、この記録が生まれた一因である。｜特筆すべきは、この二人が本来は単独でも団体の中心を張れる格の選手だという点だ。{nameA1}も{nameA2}も一人で試合を成立させる力を持つ。その二人が個を競わせず、相手に譲る呼吸まで備えてコンビを優先した。強さの足し算を噛み合わせで別物に変えたところに、この記録の値打ちがある。手放しでは褒めない本紙も、この一点は評価する。
- `NEWS_HEADLINE_TEMPLATES.mqTagRecord[3].body`: {orgName}のリングで{nameA1}＆{nameA2}組と{nameB1}＆{nameB2}組がぶつかった一戦が、試合評価{mq}点を叩き出した。タッグ戦のこれまでの最高は{prevRecord}点。シングルの記録とは物差しが違い、四人が織る攻防の密度で測られる数字だ。勝ったのは{nameA1}の組。連係の速さと、その連係を断とうとする力がせめぎ合い、噛み合いの濃さがそのまま記録になった。｜二人を支えているのは、役割を割り切る潔さと、それを裏打ちする互いへの信頼である。組を動かして局面を作る{nameA1}、その背中を信じて過不足なく応える{nameA2}。誰が主役かを争わない関係は、攻防が激しさを増しても崩れなかった。信頼は数字に表れにくいが、この夜ばかりは点になった。冷静を旨とする本紙も、その積み上げは軽く見られない。

### hotProspectDebut[].headline

- `NEWS_HEADLINE_TEMPLATES.hotProspectDebut[1].headline`: {orgName}に逸材――{age}歳{name}、デビュー戦を終える
- `NEWS_HEADLINE_TEMPLATES.hotProspectDebut[2].headline`: 数年に一人の素材か――{name}、{age}歳で初陣
- `NEWS_HEADLINE_TEMPLATES.hotProspectDebut[3].headline`: {name}デビュー。場内のざわめきが評判を裏づけた

### hotProspectDebut[].body

- `NEWS_HEADLINE_TEMPLATES.hotProspectDebut[1].body`: {name}がリングに上がった。{age}歳。デビュー戦は{result}に終わった。数字上の勝敗より、スカウト筋がこの新人に付けていた評価のほうが業界を騒がせている。関係者の間では「ここ数年で一番の素材」との声が入団前から流れていた。実物を見た記者席のざわめきが、その評判を裏づけた。
- `NEWS_HEADLINE_TEMPLATES.hotProspectDebut[2].body`: {orgName}の新人{name}がデビューした。結果は{result}。荒削りな部分は目についたが、体の使い方に{age}歳とは思えない下地がある。複数のスカウトが入団前から動いていたという情報もあり、獲得競争の裏側込みで注目されていた一人だ。今後の伸び方を、業界が黙って見ている段階に入った。
- `NEWS_HEADLINE_TEMPLATES.hotProspectDebut[3].body`: {orgName}の{name}が{age}歳でリングデビュー。デビュー戦そのものは{result}だったが、この日集まった関係者の関心は勝敗の先にあった。育成畑の人間が「化ける」と口を揃える新人は、そう頻繁には出てこない。誇張を嫌う本紙としても、この素材は本物の部類だと書いておく。

### fatedRivals[].headline

- `NEWS_HEADLINE_TEMPLATES.fatedRivals[1].headline`: 同年代の逸材が二人――{name}と{name2}、同じ時代に立つ
- `NEWS_HEADLINE_TEMPLATES.fatedRivals[2].headline`: {name}と{name2}――{age}歳、次の十年を占う二人が出揃った
- `NEWS_HEADLINE_TEMPLATES.fatedRivals[3].headline`: 好敵手の予感――{age}歳の{name}と{name2}が同時代に

### fatedRivals[].body

- `NEWS_HEADLINE_TEMPLATES.fatedRivals[1].body`: {age}歳前後の有望株が、ほぼ同時期に頭角を現した。{orgName}の{name}と{orgName2}の{name2}。育成関係者の見立てでは、どちらも一団体の看板を背負える器だという。育成の現場では、同世代に競う相手がいる選手ほど伸びると言われる。この二人が並んだこと自体が、今後十年の業界地図に関わってくる。
- `NEWS_HEADLINE_TEMPLATES.fatedRivals[2].body`: 同学年といっていい二人の有望株が、そろってリングに立つ時代が来た。{orgName}の{name}、{orgName2}の{name2}。ともに早くからスカウト筋の評価が高く、実戦でも下地の違いを見せている。まだ何も成し遂げてはいない。ただ、同じ年頃に競える相手がいる巡り合わせは、そう多くない。
- `NEWS_HEADLINE_TEMPLATES.fatedRivals[3].body`: {orgName}の{name}と{orgName2}の{name2}が、ほぼ同年代で頭角を現した。二人が直接ぶつかったわけではない。それでも、これだけの素材が同じ時期に揃うのは珍しく、業界関係者は早くも先の対戦を口にしている。競う相手の存在が両者をどこまで押し上げるか。答えが出るのは数年先だ。

### topChampionInjury[].headline

- `NEWS_HEADLINE_TEMPLATES.topChampionInjury[1].headline`: {orgName}の{titleName}王者{name}が重傷、{weeks}週の長期欠場へ
- `NEWS_HEADLINE_TEMPLATES.topChampionInjury[2].headline`: 王者離脱――{name}が{weeks}週欠場、{titleName}戦線に空白
- `NEWS_HEADLINE_TEMPLATES.topChampionInjury[3].headline`: 上位団体に激震。{titleName}王者{name}、長期離脱が決定的

### topChampionInjury[].body

- `NEWS_HEADLINE_TEMPLATES.topChampionInjury[1].body`: 業界上位の一角に痛手。{titleName}を保持する{name}が試合中に負傷し、復帰まで{weeks}週前後を要する見込みとなった。王座の扱いは団体の判断に委ねられ、挑戦戦線は宙に浮く。上位団体の看板が一枚欠けることの影響は、その団体だけにとどまらない。
- `NEWS_HEADLINE_TEMPLATES.topChampionInjury[2].body`: {orgName}の{titleName}王者{name}が重傷を負った。欠場は{weeks}週規模とみられ、防衛ロードは白紙に戻る。ランキング上位団体のトップが長期で不在になるのは、ここ数シーズンでも例がない。空いた頂点を誰が埋めるのか、それとも帰りを待つのか。団体は難しい判断を抱えることになった。
- `NEWS_HEADLINE_TEMPLATES.topChampionInjury[3].body`: {orgName}の看板を背負う{name}が試合で重傷を負い、{weeks}週の欠場が避けられない情勢となった。{titleName}をどう扱うかは団体の判断待ちだが、いずれにせよ王座は当面動かせない。強い王者がいる前提で組まれていた対戦の流れが、根元から止まった。影響の広さは、これから表に出てくる。

## `BIG_NEWS_LEAD_LINES`

- 出典: `src/data.js`
- コード内コメント: MQ再設計P4/P5 §5.3: 週頭ポップアップの号外リード文言（bignews-article-drafts-v1.0.md 正本）。 / {mq}/{orgName}/{titleName} のみ変数展開（記事本文とは独立に、そのつどランダム1本を選ぶ）。
- 本数: 10

### mqAllTimeRecord[]

- `BIG_NEWS_LEAD_LINES.mqAllTimeRecord[1]`: 号外――業界最高評価を更新する一戦が生まれた
- `BIG_NEWS_LEAD_LINES.mqAllTimeRecord[2]`: 歴代最高評価、{mq}点。記録が塗り替わった

### mqTagRecord[]

- `BIG_NEWS_LEAD_LINES.mqTagRecord[1]`: 号外――タッグ戦の歴代最高評価を更新する一戦が生まれた
- `BIG_NEWS_LEAD_LINES.mqTagRecord[2]`: タッグの歴代最高評価、{mq}点。四人が刻んだ記録

### hotProspectDebut[]

- `BIG_NEWS_LEAD_LINES.hotProspectDebut[1]`: 号外――数年に一人の逸材がデビューした
- `BIG_NEWS_LEAD_LINES.hotProspectDebut[2]`: {orgName}に大型新人。場内がざわついた一夜

### fatedRivals[]

- `BIG_NEWS_LEAD_LINES.fatedRivals[1]`: 号外――同年代の逸材が二人、同じ時代に揃った
- `BIG_NEWS_LEAD_LINES.fatedRivals[2]`: 次の十年を占う二人が出揃った

### topChampionInjury[]

- `BIG_NEWS_LEAD_LINES.topChampionInjury[1]`: 号外――上位団体の王者が重傷、長期離脱へ
- `BIG_NEWS_LEAD_LINES.topChampionInjury[2]`: {titleName}戦線に空白。{orgName}の看板が欠けた

## `SEASON_OPENING_NEWS_LEAD_LINES`

- 出典: `src/data.js`
- コード内コメント: 2026-07-27: シーズン開幕号の週頭通知。 / オフシーズン中は新聞が発行されないため、引退・殿堂入り・他団体の動きなどは / 溜まったまま**翌シーズン第1週の号**にまとめて載る。その1枚があることを知らせる。 / 大ニュースと同じ号外フレーム（mdl-d bignews）を使うので、文言だけを分ける。
- 本数: 3

- `SEASON_OPENING_NEWS_LEAD_LINES[1]`: 新年号――オフの間に動いたことが、まとめて載っている
- `SEASON_OPENING_NEWS_LEAD_LINES[2]`: 年が明けた。休んでいる間の出来事が紙面に並んでいる
- `SEASON_OPENING_NEWS_LEAD_LINES[3]`: 新しい季節の一号目。留守にしていた間の記事が揃っている

## `SEASON_REVIEW_LINES`

- 出典: `src/data.js`
- コード内コメント: §6.1.5 シーズン総括(ANNUAL RECORD)ナレーション文面テーブル / 出典: docs/season-review-narration-draft-v0.1.md v0.2 (Opus 4.8執筆／Keisukeレビュー済み 2026-07-16) / 消費側: Engine.seasonReview.build() (src/management.js)。プレースホルダは {rank} {prevRank} {hero} {above} {gap}
- 本数: 61

### lead.taikan_summit[]

- `SEASON_REVIEW_LINES.lead.taikan_summit[1]`: この一年、最も高い場所に立っていたのはこの団体だった。数字がそれを認めている。
- `SEASON_REVIEW_LINES.lead.taikan_summit[2]`: 頂点に届いた。至る道の険しさを知る者ほど、この一語を軽くは扱わない。
- `SEASON_REVIEW_LINES.lead.taikan_summit[3]`: 年間1位。奪うより守るほうが難しい席に、いまこの団体は座っている。

### lead.taikan_belt[]

- `SEASON_REVIEW_LINES.lead.taikan_belt[1]`: 年間の頂点には届かずとも、この一年で王座をこの手に収めた。
- `SEASON_REVIEW_LINES.lead.taikan_belt[2]`: 王座奪取。順位表のどこにいようと、ベルトを巻いた事実だけは動かない。
- `SEASON_REVIEW_LINES.lead.taikan_belt[3]`: 王座を獲った。この一年の記録の先頭に、その一行が来る。

### lead.sedaikoutai[]

- `SEASON_REVIEW_LINES.lead.sedaikoutai[1]`: 見慣れた顔がいくつも去った。空いた場所は、次の世代が埋めていく。
- `SEASON_REVIEW_LINES.lead.sedaikoutai[2]`: この一年で幾人もがリングを降りた。団体の顔ぶれは、確かに変わった。
- `SEASON_REVIEW_LINES.lead.sedaikoutai[3]`: 別れの多い一年だった。だが去った数だけ、空いた席がある。

### lead.hiyaku[]

- `SEASON_REVIEW_LINES.lead.hiyaku[1]`: 前年{prevRank}位から{rank}位へ。数字のすべてが同じ方向を向いた一年だった。
- `SEASON_REVIEW_LINES.lead.hiyaku[2]`: 順位も、帳簿も、栄冠の数も伸びた。飛躍と呼んで差し支えない年である。
- `SEASON_REVIEW_LINES.lead.hiyaku[3]`: {prevRank}位から{rank}位。上げ潮に乗った団体の勢いが、記録に刻まれた。

### lead.shifuku[]

- `SEASON_REVIEW_LINES.lead.shifuku[1]`: 前年{prevRank}位から{rank}位へ後退し、帳簿も沈んだ。耐える一年だった。
- `SEASON_REVIEW_LINES.lead.shifuku[2]`: 順位も帳簿も沈んだ。それでも興行は続き、選手はリングに立ち続けた。
- `SEASON_REVIEW_LINES.lead.shifuku[3]`: {prevRank}位から{rank}位。数字は厳しい。この沈黙をどう終わらせるかは、これからの話だ。

### lead.jigatame[]

- `SEASON_REVIEW_LINES.lead.jigatame[1]`: 順位も収支も、大きくは動かなかった。土台を固めるための、静かな一年だった。
- `SEASON_REVIEW_LINES.lead.jigatame[2]`: 前年と同じ{rank}位で着地した。派手さはないが、崩れもしなかった。
- `SEASON_REVIEW_LINES.lead.jigatame[3]`: 現状維持。順位表の上では、何も起きなかった一年である。

### lead.shiren[]

- `SEASON_REVIEW_LINES.lead.shiren[1]`: 楽な一年ではなかった。数字のいくつかは、確かに下を向いている。
- `SEASON_REVIEW_LINES.lead.shiren[2]`: つまずきのあった一年だった。それも含めて、この団体の記録である。
- `SEASON_REVIEW_LINES.lead.shiren[3]`: 順風とは言えない一年だった。ここで踏みとどまれるかが、来季を分ける。

### lead.funade[]

- `SEASON_REVIEW_LINES.lead.funade[1]`: 旗揚げの一年。何もなかった場所に、団体の輪郭が立ち上がった。
- `SEASON_REVIEW_LINES.lead.funade[2]`: すべてがここから始まる。初年度を{rank}位で終えた。
- `SEASON_REVIEW_LINES.lead.funade[3]`: 船出の年。最初の興行、最初の観客、最初の星取りが記録に加わった。

### leadHero.mvp[]

- `SEASON_REVIEW_LINES.leadHero.mvp[1]`: その中心には、年間MVPに輝いた{hero}がいた。
- `SEASON_REVIEW_LINES.leadHero.mvp[2]`: {hero}が最優秀選手に選ばれ、一年の顔となった。
- `SEASON_REVIEW_LINES.leadHero.mvp[3]`: この一年を象徴する一人を挙げるなら、MVPの{hero}だろう。

### leadHero.ace[]

- `SEASON_REVIEW_LINES.leadHero.ace[1]`: 団体を最も体現していたのは、{hero}だった。
- `SEASON_REVIEW_LINES.leadHero.ace[2]`: 数字の上で先頭を走り続けたのは{hero}である。
- `SEASON_REVIEW_LINES.leadHero.ace[3]`: 一年を通して看板を背負ったのは{hero}だった。

### records.rookie[]

- `SEASON_REVIEW_LINES.records.rookie[1]`: デビューの年に、早くも記録の側へ名を刻んだ。
- `SEASON_REVIEW_LINES.records.rookie[2]`: 一年目とは思えない足取りだった。
- `SEASON_REVIEW_LINES.records.rookie[3]`: 新人という言葉が、もう似合わなくなっている。

### records.champ_v0[]

- `SEASON_REVIEW_LINES.records.champ_v0[1]`: 巻いたばかりの帯。真価が問われるのは、ここからだ。
- `SEASON_REVIEW_LINES.records.champ_v0[2]`: 頂点の証をこの手に。防衛の日々は、来季から始まる。

### records.champ_low[]

- `SEASON_REVIEW_LINES.records.champ_low[1]`: 届いた帯を、まず守るところから始めた。
- `SEASON_REVIEW_LINES.records.champ_low[2]`: 挑戦者を退け、王座はこの団体に残った。

### records.champ_mid[]

- `SEASON_REVIEW_LINES.records.champ_mid[1]`: 幾度かの挑戦を退け、王座は揺らがなかった。
- `SEASON_REVIEW_LINES.records.champ_mid[2]`: 防衛を重ねるごとに、その名は帯と分かちがたくなる。

### records.champ_high[]

- `SEASON_REVIEW_LINES.records.champ_high[1]`: 長期政権。この帯は、もはやこの選手の代名詞だ。
- `SEASON_REVIEW_LINES.records.champ_high[2]`: 数えるのも野暮なほど守り続けた、揺るぎない王座だ。

### records.jt[]

- `SEASON_REVIEW_LINES.records.jt[1]`: 勝ち抜きの末に、トーナメントの頂へ立った。
- `SEASON_REVIEW_LINES.records.jt[2]`: 一夜ごとに相手を退け、最後まで残ったのはこの選手だった。
- `SEASON_REVIEW_LINES.records.jt[3]`: 短期決戦を制する強さを、確かに示した。

### records.media[]

- `SEASON_REVIEW_LINES.records.media[1]`: リングの外でも、団体の名を広く届けた。
- `SEASON_REVIEW_LINES.records.media[2]`: カメラとマイクの前で、団体の顔として立ち続けた。
- `SEASON_REVIEW_LINES.records.media[3]`: テレビに、誌面に、この選手の名前が並んだ一年だった。

### records.springTag[]

- `SEASON_REVIEW_LINES.records.springTag[1]`: 相棒と息を合わせ、春のタッグリーグの頂点に立った。
- `SEASON_REVIEW_LINES.records.springTag[2]`: 総当たりを勝ち抜き、決勝でも組んだ相手と守り切った。

### closing.top[]

- `SEASON_REVIEW_LINES.closing.top[1]`: 見上げる相手はいない。来季は、この順位表の一番上を守る一年になる。
- `SEASON_REVIEW_LINES.closing.top[2]`: 業界の最も高い場所で一年を終えた。次に問われるのは、守り続ける覚悟である。
- `SEASON_REVIEW_LINES.closing.top[3]`: 追う者から、追われる者へ。頂点の一年は、そういう立場の変化でもある。

### closing.chase_close[]

- `SEASON_REVIEW_LINES.closing.chase_close[1]`: 上をゆく{above}との差は{gap}点。手を伸ばせば届く距離に、来季の勝負がある。
- `SEASON_REVIEW_LINES.closing.chase_close[2]`: {above}まであと{gap}点。この一年で詰めた距離が、来季の景色を変えるかもしれない。
- `SEASON_REVIEW_LINES.closing.chase_close[3]`: {gap}点。{above}の背中は、もう遠くない。

### closing.chase_far[]

- `SEASON_REVIEW_LINES.closing.chase_far[1]`: 上をゆく{above}との差は{gap}点。遠い背中だが、追う一年に意味がないわけではない。
- `SEASON_REVIEW_LINES.closing.chase_far[2]`: {above}まで{gap}点。この差を数字で見て怯むか奮い立つかは、これからの動き次第だ。
- `SEASON_REVIEW_LINES.closing.chase_far[3]`: {gap}点の開き。{above}に届くには、一年では足りない。腰を据えるしかない。

### closing.fallback[]

- `SEASON_REVIEW_LINES.closing.fallback[1]`: 一年が終わった。次の一年も、この団体の物語は続いていく。
- `SEASON_REVIEW_LINES.closing.fallback[2]`: 記録は閉じた。だが、この団体の歩みが止まるわけではない。
- `SEASON_REVIEW_LINES.closing.fallback[3]`: また一つ、季節を越えた。積み上げるべきものは、まだ先にある。

## `NOTIF_EVENT_TEXTS`

- 出典: `src/data.js`
- コード内コメント: ╔══════════════════════════════════════════════════════════╗ / ║  SECTION 10: EVENT SYSTEM v2.0 (event-system-spec-v2)    ║ / ╚══════════════════════════════════════════════════════════╝ / §3-3: 通知型イベントテキスト（N1〜N5） / {name}, {name2} はプレースホルダ（実行時に選手名で置換） / 各エントリ: { text: 見出し行, detail: 状況説明文 }
- 本数: 102

### N1[].text

- `NOTIF_EVENT_TEXTS.N1[1].text`: 💪 {name}が自主トレで手応えを掴んだ
- `NOTIF_EVENT_TEXTS.N1[2].text`: 🌟 {name}の努力が実を結びつつある
- `NOTIF_EVENT_TEXTS.N1[3].text`: ✨ {name}が練習で目を引く動きを見せた
- `NOTIF_EVENT_TEXTS.N1[4].text`: 📈 {name}の動きが明らかに良くなっている
- `NOTIF_EVENT_TEXTS.N1[5].text`: 🏋️ {name}がフィジカルトレーニングで成果を見せた
- `NOTIF_EVENT_TEXTS.N1[6].text`: 🎯 {name}が技の精度を上げてきた

### N1[].detail

- `NOTIF_EVENT_TEXTS.N1[1].detail`: {name}が誰もいない道場で汗を流していた。基礎をひとつひとつ確認しながら、何度も繰り返す姿が印象的だ。
- `NOTIF_EVENT_TEXTS.N1[2].detail`: 毎朝の早出練習が続いている{name}。最近はスパーリング相手からも「動きが変わった」と言われることが増えてきた。
- `NOTIF_EVENT_TEXTS.N1[3].detail`: 今日の合同練習で、{name}が以前はできなかった動きを難なくこなしてみせた。コーチも思わず足を止めて見入っていた。
- `NOTIF_EVENT_TEXTS.N1[4].detail`: 先月の試合映像と見比べると、{name}の動作に無駄がなくなっているのが分かる。地道な積み重ねが形になってきた。
- `NOTIF_EVENT_TEXTS.N1[5].detail`: {name}が自主的に取り組んでいる体幹トレーニングの効果が出始めている。受け身の安定感が格段に上がった。
- `NOTIF_EVENT_TEXTS.N1[6].detail`: 繰り返し練習してきた連携技が、{name}の体に馴染んできたようだ。実戦でも使えるレベルに仕上がりつつある。

### N2[].text

- `NOTIF_EVENT_TEXTS.N2[1].text`: 🤝 {name}と{name2}が練習後に話し込んでいた
- `NOTIF_EVENT_TEXTS.N2[2].text`: 💬 {name}が{name2}に技のコツを教えていた
- `NOTIF_EVENT_TEXTS.N2[3].text`: 🌸 {name}と{name2}の仲が深まってきた
- `NOTIF_EVENT_TEXTS.N2[4].text`: 👊 {name}と{name2}が激しく語り合っていた
- `NOTIF_EVENT_TEXTS.N2[5].text`: 🍙 {name}と{name2}が一緒に食事をとっていた
- `NOTIF_EVENT_TEXTS.N2[6].text`: 🤜 {name}と{name2}が互いを高め合っている

### N2[].detail

- `NOTIF_EVENT_TEXTS.N2[1].detail`: 練習が終わってもロッカールームを離れようとしない二人。お互いの技や試合のことを真剣に語り合っているようだった。
- `NOTIF_EVENT_TEXTS.N2[2].detail`: 練習後、{name}が{name2}の動きを見て自ら声をかけた。2時間近く付き合って、丁寧に手ほどきしていたそうだ。
- `NOTIF_EVENT_TEXTS.N2[3].detail`: 最近、{name}と{name2}がよく行動を共にしているのが目につく。ランチを一緒にとったり、移動中も話し合っていることが増えた。
- `NOTIF_EVENT_TEXTS.N2[4].detail`: プロレスの哲学について、{name}と{name2}が火花を散らすような議論を繰り広げた。二人とも目を輝かせていた。
- `NOTIF_EVENT_TEXTS.N2[5].detail`: 練習後、{name}と{name2}が近所の定食屋で向かい合って談笑している姿が目撃された。チームの結束が深まっているようだ。
- `NOTIF_EVENT_TEXTS.N2[6].detail`: {name}と{name2}が自主的にスパーリングを重ねている。好敵手として切磋琢磨する関係が生まれつつある。

### N3[].text

- `NOTIF_EVENT_TEXTS.N3[1].text`: 😓 {name}が少し疲れ気味のようだ…
- `NOTIF_EVENT_TEXTS.N3[2].text`: 🌡️ {name}のコンディションが優れない
- `NOTIF_EVENT_TEXTS.N3[3].text`: 💤 {name}の練習に覇気がない日があった
- `NOTIF_EVENT_TEXTS.N3[4].text`: 😔 {name}が練習量を落としているようだ
- `NOTIF_EVENT_TEXTS.N3[5].text`: 😩 {name}が連戦の疲れを引きずっている
- `NOTIF_EVENT_TEXTS.N3[6].text`: 🩹 {name}の体に疲労が溜まっているようだ

### N3[].detail

- `NOTIF_EVENT_TEXTS.N3[1].detail`: 試合が続いたせいか、{name}の動きにいつもの切れが見られない。練習後もすぐに休むことが多くなっている。
- `NOTIF_EVENT_TEXTS.N3[2].detail`: {name}が今週の練習を短縮するよう申し出た。本人は問題ないと言っているが、顔色が優れないのが気になる。
- `NOTIF_EVENT_TEXTS.N3[3].detail`: 今日の{name}はルーティンをこなしているだけといった印象で、いつもの集中力がなかった。疲れか、それとも悩みがあるのか。
- `NOTIF_EVENT_TEXTS.N3[4].detail`: 先月と比べると、{name}の練習時間が目に見えて減っている。怪我を抱えているわけではないだけに、少し心配だ。
- `NOTIF_EVENT_TEXTS.N3[5].detail`: 最近の連戦のダメージが{name}の体に残っているようだ。練習でも動きが鈍く、いつもの切れ味がない。
- `NOTIF_EVENT_TEXTS.N3[6].detail`: 練習後に{name}がストレッチに普段の倍の時間をかけていた。本人は何も言わないが、体が悲鳴を上げているのかもしれない。

### N4[].text

- `NOTIF_EVENT_TEXTS.N4[1].text`: 📣 ファンから{name}への応援の声が増えている！
- `NOTIF_EVENT_TEXTS.N4[2].text`: 🎉 SNSで{name}が話題になっている！
- `NOTIF_EVENT_TEXTS.N4[3].text`: 💖 {name}目当てのファンが増えてきた！
- `NOTIF_EVENT_TEXTS.N4[4].text`: 🔥 {name}の人気が上り調子だ！
- `NOTIF_EVENT_TEXTS.N4[5].text`: 🛍️ {name}のグッズが売れ行き好調！
- `NOTIF_EVENT_TEXTS.N4[6].text`: 📱 {name}のファンアートがSNSで拡散中！

### N4[].detail

- `NOTIF_EVENT_TEXTS.N4[1].detail`: 会場の外でも{name}を待つファンの姿が増えてきた。試合を見て初めてプロレスを好きになったと語るファンも現れはじめている。
- `NOTIF_EVENT_TEXTS.N4[2].detail`: 先週の試合でのハイライトが拡散されて、{name}のSNSフォロワー数が急増している。知名度が着実に上がってきた。
- `NOTIF_EVENT_TEXTS.N4[3].detail`: チケット購入時に「{name}が見たくて来た」と声に出してくれるファンが増えている。地道に積み重ねてきた試合が実を結んでいる。
- `NOTIF_EVENT_TEXTS.N4[4].detail`: 観客の入りを見ていると、{name}が出る試合は明らかに人が多い。ファンが友人を誘って来場するというケースも報告されている。
- `NOTIF_EVENT_TEXTS.N4[5].detail`: {name}のTシャツやタオルが会場で飛ぶように売れている。追加発注を検討してもいいかもしれない。
- `NOTIF_EVENT_TEXTS.N4[6].detail`: ファンが{name}のイラストや応援動画をSNSに投稿し、それが大きな話題を呼んでいる。知名度がじわじわと上昇中だ。

### N5_warning[].text

- `NOTIF_EVENT_TEXTS.N5_warning[1].text`: 😶 {name}が最近どことなく元気がないようだ…
- `NOTIF_EVENT_TEXTS.N5_warning[2].text`: 💭 {name}の様子が少し気になる
- `NOTIF_EVENT_TEXTS.N5_warning[3].text`: 🤔 {name}が浮かない顔をしていた
- `NOTIF_EVENT_TEXTS.N5_warning[4].text`: 😑 {name}が練習中に何かを考えているようだった
- `NOTIF_EVENT_TEXTS.N5_warning[5].text`: 🫥 {name}が自主練を欠席する日があった
- `NOTIF_EVENT_TEXTS.N5_warning[6].text`: 😐 {name}がチームメイトと距離を置き始めた

### N5_warning[].detail

- `NOTIF_EVENT_TEXTS.N5_warning[1].detail`: いつもは積極的に話しかけてくる{name}が、最近は静かに練習をこなして帰るだけになっている。何か気になることがあるのかもしれない。
- `NOTIF_EVENT_TEXTS.N5_warning[2].detail`: 練習中の{name}の目が、どこか遠くを見ているような瞬間が増えた。試合への集中は保てているが、何かを抱えているように見える。
- `NOTIF_EVENT_TEXTS.N5_warning[3].detail`: 今日の{name}は朝から表情が暗かった。何か聞こうとしたが、やんわりと遮られてしまった。様子を見ておく必要がありそうだ。
- `NOTIF_EVENT_TEXTS.N5_warning[4].detail`: スパーリング中に{name}が一瞬だけ動きを止めることがあった。何か重いものを抱えているように見えた。
- `NOTIF_EVENT_TEXTS.N5_warning[5].detail`: 以前は必ず参加していた自主練に{name}が来なかった。体調不良ではないらしいが…声をかけてみるか、ケアアクションで気にかけてみてもいいかもしれない。
- `NOTIF_EVENT_TEXTS.N5_warning[6].detail`: {name}が休憩時間に一人で過ごすことが増えた。まだ深刻な段階ではなさそうだが、試合に出して活躍の場を作ることで変わるかもしれない。

### N5_low[].text

- `NOTIF_EVENT_TEXTS.N5_low[1].text`: 😤 {name}が最近不満そうにしている…
- `NOTIF_EVENT_TEXTS.N5_low[2].text`: 😟 {name}から笑顔が消えてきた気がする
- `NOTIF_EVENT_TEXTS.N5_low[3].text`: 💢 {name}が何かに苛立っている様子だ
- `NOTIF_EVENT_TEXTS.N5_low[4].text`: 😶‍🌫️ {name}…大丈夫だろうか
- `NOTIF_EVENT_TEXTS.N5_low[5].text`: 🚪 {name}が一人で練習場を出ていった
- `NOTIF_EVENT_TEXTS.N5_low[6].text`: ⚡ {name}の態度にチーム内でも不安の声が

### N5_low[].detail

- `NOTIF_EVENT_TEXTS.N5_low[1].detail`: 練習後のミーティングで、{name}の受け答えがぶっきらぼうになってきた。チームとの何らかの摩擦が生じているかもしれない。
- `NOTIF_EVENT_TEXTS.N5_low[2].detail`: 以前は練習後もチームメイトと談笑していた{name}が、最近は黙って着替えて帰ることが増えた。チームの雰囲気にも影響が出てきそうだ。
- `NOTIF_EVENT_TEXTS.N5_low[3].detail`: 小さなことで感情が出やすくなっている{name}。直接の原因は不明だが、現状への不満が積み重なっているようだ。早めに話を聞いた方がいいかもしれない。
- `NOTIF_EVENT_TEXTS.N5_low[4].detail`: 最近の{name}は何を考えているのか読めない。返事はするが目が合わない、笑顔が一切見られない——チームの誰もが心配している。
- `NOTIF_EVENT_TEXTS.N5_low[5].detail`: 全体練習の終了前に、{name}が黙って荷物をまとめて帰っていった。ケアアクションでボーナスを支給するか、試合で活躍の場を与えることで状況を改善できるかもしれない。
- `NOTIF_EVENT_TEXTS.N5_low[6].detail`: {name}の不満げな態度がチームメイトにも伝わっている。このまま放置すると退団リスクが高まりそうだ。待遇改善や直接の対話が必要かもしれない。

### N_isolation[].text

- `NOTIF_EVENT_TEXTS.N_isolation[1].text`: 😶 {name}が最近、練習で一人でいることが増えた…
- `NOTIF_EVENT_TEXTS.N_isolation[2].text`: 🚶 {name}が練習後にすぐ帰るようになった
- `NOTIF_EVENT_TEXTS.N_isolation[3].text`: 😔 {name}が休憩時間にひとりぼっちだった
- `NOTIF_EVENT_TEXTS.N_isolation[4].text`: 👤 {name}が道場の隅で黙々と練習していた
- `NOTIF_EVENT_TEXTS.N_isolation[5].text`: 🫥 {name}の表情が硬い日が増えた
- `NOTIF_EVENT_TEXTS.N_isolation[6].text`: 😶‍🌫️ {name}が自主練も一人で行うようになった

### N_isolation[].detail

- `NOTIF_EVENT_TEXTS.N_isolation[1].detail`: 合同練習の後も{name}は一人で黙々とストレッチをしている。以前はチームメイトと談笑していたのだが、最近はほとんど会話がない。
- `NOTIF_EVENT_TEXTS.N_isolation[2].detail`: 以前は最後まで残って自主練をしていた{name}だが、最近は練習が終わると荷物をまとめてさっと帰ってしまう。何かを抱えているようだ。
- `NOTIF_EVENT_TEXTS.N_isolation[3].detail`: 休憩時間、他の選手たちが輪になって話す中、{name}は隅でスマホを見つめていた。以前はいつも誰かと一緒にいたのに。
- `NOTIF_EVENT_TEXTS.N_isolation[4].detail`: みんなが中央のリングで合同練習をしている時、{name}は壁際で一人、基礎練習を繰り返していた。周囲とは見えない壁ができている。
- `NOTIF_EVENT_TEXTS.N_isolation[5].detail`: {name}の笑顔を見る機会がめっきり減った。練習中も淡々とメニューをこなすだけで、チームメイトとの雑談もほとんどない。
- `NOTIF_EVENT_TEXTS.N_isolation[6].detail`: 以前はスパーリング相手を自分から探していた{name}が、最近は一人でサンドバッグを叩いている姿しか見ない。心を閉ざし始めているのかもしれない。

### N_coach_report[].text

- `NOTIF_EVENT_TEXTS.N_coach_report[1].text`: 📋 コーチ{coach}が報告:「{name}の様子が最近おかしい」
- `NOTIF_EVENT_TEXTS.N_coach_report[2].text`: 📝 コーチ{coach}:「{name}のことで相談が…」
- `NOTIF_EVENT_TEXTS.N_coach_report[3].text`: 🗣️ コーチ{coach}が{name}について進言
- `NOTIF_EVENT_TEXTS.N_coach_report[4].text`: ⚠️ コーチ{coach}:「{name}が心配です」
- `NOTIF_EVENT_TEXTS.N_coach_report[5].text`: 👀 コーチ{coach}が{name}の変調に気づいた
- `NOTIF_EVENT_TEXTS.N_coach_report[6].text`: 📊 コーチ{coach}の定期報告に{name}の名前が

### N_coach_report[].detail

- `NOTIF_EVENT_TEXTS.N_coach_report[1].detail`: コーチ{coach}が社長室を訪れた。「{name}のことなんですが…練習中の集中力が明らかに落ちています。少し気にかけてやってほしい」
- `NOTIF_EVENT_TEXTS.N_coach_report[2].detail`: 「{name}が最近、試合後も練習後もすぐに帰ってしまうんです。前は自主練していたのに。何か不満があるのかもしれません」とコーチ{coach}が心配そうに報告した。
- `NOTIF_EVENT_TEXTS.N_coach_report[3].detail`: 「社長、{name}のモチベーションが下がっているように見えます。練習態度は悪くないんですが…どこか投げやりというか。ケアが必要かもしれません」
- `NOTIF_EVENT_TEXTS.N_coach_report[4].detail`: 「{name}とは最近あまり話せていないんです。こちらから声をかけても素っ気ない返事しか返ってこなくて。何か手を打った方がいいかもしれません」
- `NOTIF_EVENT_TEXTS.N_coach_report[5].detail`: 「{name}、最近ちょっとおかしいです。技の精度は保ってるんですが、目が死んでるというか…このまま放っておくとまずいかもしれません」
- `NOTIF_EVENT_TEXTS.N_coach_report[6].detail`: 月次の選手状態報告の中で、コーチ{coach}が{name}の名前を特記していた。「要注意。練習態度に変化あり。面談を推奨します」

### N_sudden_departure[].text

- `NOTIF_EVENT_TEXTS.N_sudden_departure[1].text`: 🚪 {name}が荷物をまとめて団体を去った
- `NOTIF_EVENT_TEXTS.N_sudden_departure[2].text`: 📦 {name}が突然いなくなった…
- `NOTIF_EVENT_TEXTS.N_sudden_departure[3].text`: 💨 {name}の姿が消えた

### N_sudden_departure[].detail

- `NOTIF_EVENT_TEXTS.N_sudden_departure[1].detail`: 朝、道場に着くと{name}のロッカーが空になっていた。誰にも何も言わず、荷物をまとめて去ったらしい。誰も止められなかった。
- `NOTIF_EVENT_TEXTS.N_sudden_departure[2].detail`: 昨日まで普通に練習に来ていた{name}が、今日は姿を見せなかった。ロッカーの私物はすべて持ち出されていた。連絡もつかない。
- `NOTIF_EVENT_TEXTS.N_sudden_departure[3].detail`: 気がつけば{name}はもういなかった。ロッカールームには何も残っていない。チームメイトたちも言葉を失っている。

## `NOTIF_DIALOGUES`

- 出典: `src/data.js`
- コード内コメント: §3-4: 通知型イベント — personality×archetype セリフ（NOTIF_DIALOGUES） / N1/N2/N3/N4/N5_warning/N5_low 全タイプ対応
- 本数: 304

- `NOTIF_DIALOGUES.N1.standard.normal[1]`: 練習が楽しくなってきた気がします
- `NOTIF_DIALOGUES.N1.standard.normal[2]`: やっと体が動くようになってきた気がします
- `NOTIF_DIALOGUES.N1.standard.bold[1]`: まだ足りない。もっとできるはず！
- `NOTIF_DIALOGUES.N1.standard.bold[2]`: この調子で上を目指す！
- `NOTIF_DIALOGUES.N1.standard.quiet[1]`: ……少し、手応えがある
- `NOTIF_DIALOGUES.N1.standard.shy[1]`: あの…ちょっとだけ、練習が楽しくなってきました…
- `NOTIF_DIALOGUES.N1.standard.easygoing[1]`: なんか今日、急にいろいろ掴めた気がする！
- `NOTIF_DIALOGUES.N1.standard.easygoing[2]`: よく分かんないけど、急に噛み合ってきた！
- `NOTIF_DIALOGUES.N1.standard.earnest[1]`: 積み重ねが大事だと思ってます。コツコツやっていきます
- `NOTIF_DIALOGUES.N1.standard.earnest[2]`: 練習って楽しい。もっとやりたいです
- `NOTIF_DIALOGUES.N1.standard.emotional[1]`: うわあ…！練習が楽しい…！もっとやりたい！
- `NOTIF_DIALOGUES.N1.standard.emotional[2]`: 体が動くようになってきた…嬉しい…！
- `NOTIF_DIALOGUES.N1.ojousama.normal[1]`: 稽古が楽しくなってまいりました
- `NOTIF_DIALOGUES.N1.ojousama.normal[2]`: 少しずつ、体が応えてくれるようになってきたわね
- `NOTIF_DIALOGUES.N1.ojousama.bold[1]`: まだまだですわ。もっと上を目指しませんと…
- `NOTIF_DIALOGUES.N1.ojousama.quiet[1]`: ……少し、手応えがありますわ
- `NOTIF_DIALOGUES.N1.ojousama.shy[1]`: あの…ほんの少しだけ、お稽古が楽しくなってきましたの…
- `NOTIF_DIALOGUES.N1.ojousama.earnest[1]`: 積み重ねが大切ですわ。一歩一歩、参りますわね
- `NOTIF_DIALOGUES.N1.ojousama.emotional[1]`: ああ…っ、お稽古が楽しい…もっとやりたい…っ
- `NOTIF_DIALOGUES.N1.ojousama.emotional[2]`: 体が動くようになってきて…嬉しい…っ
- `NOTIF_DIALOGUES.N1.delinquent.normal[1]`: なんか最近、体の動きキレてね？
- `NOTIF_DIALOGUES.N1.delinquent.normal[2]`: やっと感覚掴めてきたっぽい
- `NOTIF_DIALOGUES.N1.delinquent.bold[1]`: まだ足りねえ。もっとやれるはずだ
- `NOTIF_DIALOGUES.N1.delinquent.quiet[1]`: ……ちょっと、手応えあるかも
- `NOTIF_DIALOGUES.N1.delinquent.shy[1]`: あの…ちょっとだけ、練習が楽しくなってきたっす…
- `NOTIF_DIALOGUES.N1.delinquent.easygoing[1]`: なんか急にキタわ！掴めた感じ！
- `NOTIF_DIALOGUES.N1.delinquent.earnest[1]`: 積み重ねが大事だろ。コツコツやってくわ
- `NOTIF_DIALOGUES.N1.delinquent.earnest[2]`: 練習、楽しいんだよな。もっとやりてえ
- `NOTIF_DIALOGUES.N1.delinquent.emotional[1]`: うおっ…練習が楽しい…っ、もっとやりてえ…！
- `NOTIF_DIALOGUES.N1.delinquent.emotional[2]`: 体が動くようになってきた…嬉しいんだよ…っ
- `NOTIF_DIALOGUES.N1.seductive.normal[1]`: 最近、体が素直に動いてくれるの。嬉しいわ
- `NOTIF_DIALOGUES.N1.seductive.normal[2]`: 練習が楽しくなってきた気がする
- `NOTIF_DIALOGUES.N1.seductive.bold[1]`: まだ足りないわ。もっと強くなれる気がするの
- `NOTIF_DIALOGUES.N1.seductive.shy[1]`: あの…ちょっとだけ、練習が楽しくなってきたの…
- `NOTIF_DIALOGUES.N1.seductive.easygoing[1]`: あら、急にいろいろ掴めちゃったかも
- `NOTIF_DIALOGUES.N1.seductive.earnest[1]`: 積み重ねって大事よね。もっとやりたくなっちゃう
- `NOTIF_DIALOGUES.N1.seductive.emotional[1]`: お知らせよ……っ……ふふ、聞いて……
- `NOTIF_DIALOGUES.N1.seductive.emotional[2]`: ねえ、聞いて……っ……ふふ……
- `NOTIF_DIALOGUES.N1.composed.normal[1]`: …ま、少しずつ馴染んできたかな
- `NOTIF_DIALOGUES.N1.composed.normal[2]`: 悪くない感触だね。この調子で行こう
- `NOTIF_DIALOGUES.N1.composed.bold[1]`: …まだ先がある。焦らず行くよ
- `NOTIF_DIALOGUES.N1.composed.quiet[1]`: …少し、手応えがある。…この調子かな
- `NOTIF_DIALOGUES.N1.composed.shy[1]`: …少しだけ、練習が楽しくなってきた。…そんな気がするよ
- `NOTIF_DIALOGUES.N1.composed.easygoing[1]`: …なんか今日、急に掴めた気がするね
- `NOTIF_DIALOGUES.N1.composed.easygoing[2]`: …よくわからないけど、噛み合ってきたよ
- `NOTIF_DIALOGUES.N1.composed.earnest[1]`: …地道にやるのが一番だよ。急がず行こう
- `NOTIF_DIALOGUES.N1.composed.emotional[1]`: …っ、練習が楽しい。…もっとやりたいな
- `NOTIF_DIALOGUES.N1.composed.emotional[2]`: …体が動くようになってきた。…嬉しいよ
- `NOTIF_DIALOGUES.N1.cool.bold[1]`: …まだ上がある。止まる気はない
- `NOTIF_DIALOGUES.N1.cool.quiet[1]`: …悪くない。この調子で
- `NOTIF_DIALOGUES.N1.cool.shy[1]`: …少しだけ、練習が楽しい
- `NOTIF_DIALOGUES.N1.cool.easygoing[1]`: …今日、急に掴めた気がする
- `NOTIF_DIALOGUES.N1.cool.easygoing[2]`: …理由はわからない。急に噛み合ってきた
- `NOTIF_DIALOGUES.N1.cool.earnest[1]`: …積み重ねが全部だ。コツコツやる
- `NOTIF_DIALOGUES.N1.cool.earnest[2]`: …練習は楽しい。もっとやりたい
- `NOTIF_DIALOGUES.N1.cool.emotional[1]`: …っ、練習が楽しい。…もっとやりたい
- `NOTIF_DIALOGUES.N1.cool.emotional[2]`: …体が動く。…嬉しい
- `NOTIF_DIALOGUES.N1.polite.quiet[1]`: 少し…手応えを感じています
- `NOTIF_DIALOGUES.N1.polite.shy[1]`: あ、あの…お知らせがあります…
- `NOTIF_DIALOGUES.N1.polite.earnest[1]`: 積み重ねが大切だと信じています。コツコツ参ります
- `NOTIF_DIALOGUES.N1.polite.emotional[1]`: ああ…っ、練習が楽しいんです…！もっとやりたい…！
- `NOTIF_DIALOGUES.N1.polite.emotional[2]`: 体が動くようになってきて…嬉しいです…っ
- `NOTIF_DIALOGUES.N2.standard.normal[1]`: いい仲間ができた気がします
- `NOTIF_DIALOGUES.N2.standard.normal[2]`: 一緒に頑張れる人がいると心強いですね
- `NOTIF_DIALOGUES.N2.standard.bold[1]`: 仲間がいるから頑張れる。チームって、いいよね
- `NOTIF_DIALOGUES.N2.standard.bold[2]`: 一緒だと燃えるんだよね
- `NOTIF_DIALOGUES.N2.standard.quiet[1]`: ……いい人たちだと、思います
- `NOTIF_DIALOGUES.N2.standard.shy[1]`: あの…みんなと一緒にいられて…嬉しいです…
- `NOTIF_DIALOGUES.N2.standard.easygoing[1]`: あの人と一緒だと超楽しい！最高のパートナーだよ！
- `NOTIF_DIALOGUES.N2.standard.earnest[1]`: あの人と練習してると自分も頑張ろうって思えるんです
- `NOTIF_DIALOGUES.N2.standard.earnest[2]`: この団体で一緒にやれる仲間がいて、幸せです
- `NOTIF_DIALOGUES.N2.standard.emotional[1]`: みんなのこと大好き…！一緒にいられて幸せ…！
- `NOTIF_DIALOGUES.N2.ojousama.normal[1]`: 良い仲間に恵まれたわね
- `NOTIF_DIALOGUES.N2.ojousama.bold[1]`: 皆様のご期待が、わたくしの力になっておりますわ
- `NOTIF_DIALOGUES.N2.ojousama.quiet[1]`: ……よい方々だと、思いますわ
- `NOTIF_DIALOGUES.N2.ojousama.shy[1]`: あの…皆さんと一緒にいられて…嬉しいですの…
- `NOTIF_DIALOGUES.N2.ojousama.earnest[1]`: この団体でご一緒できる仲間がいて、幸せですわ
- `NOTIF_DIALOGUES.N2.ojousama.emotional[1]`: 皆さんのこと、大好き…っ、一緒にいられて幸せ…っ
- `NOTIF_DIALOGUES.N2.delinquent.normal[1]`: あいつと一緒だと楽しいんだよな
- `NOTIF_DIALOGUES.N2.delinquent.bold[1]`: あいつがいるから燃えるんだよ！
- `NOTIF_DIALOGUES.N2.delinquent.quiet[1]`: ……いい奴らだと、思う
- `NOTIF_DIALOGUES.N2.delinquent.shy[1]`: あの…みんなと一緒にいられて…嬉しいっす…
- `NOTIF_DIALOGUES.N2.delinquent.easygoing[1]`: あいつ最高！一緒だとテンション上がるわ！
- `NOTIF_DIALOGUES.N2.delinquent.earnest[1]`: あいつと練習してっと、自分も頑張ろうって思えるんだよ
- `NOTIF_DIALOGUES.N2.delinquent.earnest[2]`: この団体で一緒にやれる仲間がいる。幸せだよな
- `NOTIF_DIALOGUES.N2.delinquent.emotional[1]`: みんなのこと大好きだ…っ、一緒にいられて幸せだよ…っ
- `NOTIF_DIALOGUES.N2.seductive.normal[1]`: いい仲間に恵まれたわ。心強いの
- `NOTIF_DIALOGUES.N2.seductive.bold[1]`: 仲間がいるって、いいものね
- `NOTIF_DIALOGUES.N2.seductive.shy[1]`: あの…みんなと一緒にいられて…嬉しいの…
- `NOTIF_DIALOGUES.N2.seductive.easygoing[1]`: あの人と一緒にいると楽しいの。最高のパートナーね
- `NOTIF_DIALOGUES.N2.seductive.earnest[1]`: あの人と一緒だと、もっと頑張りたくなるの
- `NOTIF_DIALOGUES.N2.seductive.emotional[1]`: ちょっといいかしら……っ……ふふ……
- `NOTIF_DIALOGUES.N2.composed.normal[1]`: …いい仲間だね。悪くない環境だよ
- `NOTIF_DIALOGUES.N2.composed.bold[1]`: …悪くないチームだよ。居心地がいい
- `NOTIF_DIALOGUES.N2.composed.quiet[1]`: …いい人たちだよ。…うん
- `NOTIF_DIALOGUES.N2.composed.shy[1]`: …みんなといられるのは、嬉しいよ。…うん
- `NOTIF_DIALOGUES.N2.composed.easygoing[1]`: …あの人といると楽しいね。最高の相棒だよ
- `NOTIF_DIALOGUES.N2.composed.earnest[1]`: …あの人がいると、自然と力が出るね
- `NOTIF_DIALOGUES.N2.composed.emotional[1]`: …みんなのこと、好きだよ。…一緒にいられて幸せだ
- `NOTIF_DIALOGUES.N2.cool.bold[1]`: …悪くないチームだ
- `NOTIF_DIALOGUES.N2.cool.quiet[1]`: …悪くない仲間だ
- `NOTIF_DIALOGUES.N2.cool.shy[1]`: …みんなといられて、嬉しい
- `NOTIF_DIALOGUES.N2.cool.easygoing[1]`: …あの人といると楽しい。最高の相棒だ
- `NOTIF_DIALOGUES.N2.cool.earnest[1]`: …あの人と練習すると、自分も頑張れる
- `NOTIF_DIALOGUES.N2.cool.earnest[2]`: …一緒にやれる仲間がいる。…幸せだ
- `NOTIF_DIALOGUES.N2.cool.emotional[1]`: …みんなが好きだ。…一緒にいられて、幸せ
- `NOTIF_DIALOGUES.N2.polite.quiet[1]`: …良い方々だと思います
- `NOTIF_DIALOGUES.N2.polite.shy[1]`: ちょ、ちょっとお伝えしたいことが…
- `NOTIF_DIALOGUES.N2.polite.earnest[1]`: 一緒にお稽古していると、自分も頑張ろうと思えます
- `NOTIF_DIALOGUES.N2.polite.emotional[1]`: みんなのことが大好きです…っ、一緒にいられて幸せです…っ
- `NOTIF_DIALOGUES.N3.standard.normal[1]`: ちょっと疲れてるだけです。次の試合までには戻ります
- `NOTIF_DIALOGUES.N3.standard.normal[2]`: 少し休めば大丈夫です
- `NOTIF_DIALOGUES.N3.standard.bold[1]`: 大丈夫。この程度。すぐ戻るよ
- `NOTIF_DIALOGUES.N3.standard.bold[2]`: こんなんじゃ終われない
- `NOTIF_DIALOGUES.N3.standard.quiet[1]`: ……少し、休みます
- `NOTIF_DIALOGUES.N3.standard.shy[1]`: あの…無理はしてないつもりなんですけど……少し休んだ方がいいかも…
- `NOTIF_DIALOGUES.N3.standard.easygoing[1]`: あー、ちょっと疲れちゃったかも。少し休めば平気！
- `NOTIF_DIALOGUES.N3.standard.earnest[1]`: すみません…体が追いつかなくて。少し休めば大丈夫です
- `NOTIF_DIALOGUES.N3.standard.earnest[2]`: 立て直してみせます
- `NOTIF_DIALOGUES.N3.standard.emotional[1]`: うう…体がしんどい…でも、でも頑張りたいのに…！
- `NOTIF_DIALOGUES.N3.ojousama.normal[1]`: 少々疲れが出たようで…次までには整えます
- `NOTIF_DIALOGUES.N3.ojousama.bold[1]`: この程度、問題ありませんわ
- `NOTIF_DIALOGUES.N3.ojousama.quiet[1]`: ……少し、休ませていただきますわ
- `NOTIF_DIALOGUES.N3.ojousama.shy[1]`: あの…無理はしていないつもりですけれど……少し休んだ方が、よいのかもしれませんの…
- `NOTIF_DIALOGUES.N3.ojousama.earnest[1]`: 少しお休みをいただければ、必ず立て直しますわ
- `NOTIF_DIALOGUES.N3.ojousama.emotional[1]`: う…体がつらい…でも、まだ頑張りたいのに…っ
- `NOTIF_DIALOGUES.N3.delinquent.normal[1]`: ちょっとダルいだけだって。すぐ戻る
- `NOTIF_DIALOGUES.N3.delinquent.bold[1]`: この程度で止まってられるかよ
- `NOTIF_DIALOGUES.N3.delinquent.quiet[1]`: ……ちょい、休むわ
- `NOTIF_DIALOGUES.N3.delinquent.shy[1]`: あの…無理はしてねえつもりなんすけど……ちょい休んだ方がいいかも…
- `NOTIF_DIALOGUES.N3.delinquent.easygoing[1]`: あー疲れた。ちょい休むわ
- `NOTIF_DIALOGUES.N3.delinquent.earnest[1]`: 悪い…体が追いつかねえんだ。ちょっと休めば平気だよ
- `NOTIF_DIALOGUES.N3.delinquent.earnest[2]`: ちゃんと立て直してみせるからさ
- `NOTIF_DIALOGUES.N3.delinquent.emotional[1]`: うぐ…体がしんどい…でも、まだやりてえのに…っ
- `NOTIF_DIALOGUES.N3.seductive.normal[1]`: 少し疲れただけよ。心配しないで
- `NOTIF_DIALOGUES.N3.seductive.bold[1]`: この程度で止まるつもりはないわ
- `NOTIF_DIALOGUES.N3.seductive.shy[1]`: あの…無理はしてないつもりなんだけど……少し休んだ方が、いいのかも…
- `NOTIF_DIALOGUES.N3.seductive.easygoing[1]`: ちょっと疲れちゃったかしら。少し休めば大丈夫よ
- `NOTIF_DIALOGUES.N3.seductive.earnest[1]`: ごめんなさい…少し休めば、すぐ戻れるわ
- `NOTIF_DIALOGUES.N3.seductive.emotional[1]`: はぁ……体が、言うこときかないの……ごめんなさい……
- `NOTIF_DIALOGUES.N3.seductive.emotional[2]`: ふぅ……ちょっと、休ませて……すぐ、戻るから……
- `NOTIF_DIALOGUES.N3.composed.normal[1]`: …ちょっと疲れただけ。すぐ戻るよ
- `NOTIF_DIALOGUES.N3.composed.bold[1]`: …この程度なら大丈夫。慌てないで
- `NOTIF_DIALOGUES.N3.composed.quiet[1]`: …少し、休むよ
- `NOTIF_DIALOGUES.N3.composed.shy[1]`: …無理はしてないつもりだけど。…少し休んだ方がいいかもね
- `NOTIF_DIALOGUES.N3.composed.easygoing[1]`: …ちょっと疲れたかな。…少し休めば平気だよ
- `NOTIF_DIALOGUES.N3.composed.earnest[1]`: …少し休めば大丈夫。焦ることはないよ
- `NOTIF_DIALOGUES.N3.composed.emotional[1]`: …体がしんどいな。…でも、まだやりたいんだけど
- `NOTIF_DIALOGUES.N3.cool.bold[1]`: …問題ない。戻れる
- `NOTIF_DIALOGUES.N3.cool.quiet[1]`: …大丈夫だ。すぐ戻れる
- `NOTIF_DIALOGUES.N3.cool.shy[1]`: …無理はしてない。…でも、少し休みたい
- `NOTIF_DIALOGUES.N3.cool.easygoing[1]`: …少し疲れた。休めば平気だ
- `NOTIF_DIALOGUES.N3.cool.earnest[1]`: …すまない。体が追いつかない。休めば戻る
- `NOTIF_DIALOGUES.N3.cool.earnest[2]`: …必ず立て直す
- `NOTIF_DIALOGUES.N3.cool.emotional[1]`: …体が、しんどい。…でも、やりたい
- `NOTIF_DIALOGUES.N3.polite.quiet[1]`: …少し休ませていただければ…
- `NOTIF_DIALOGUES.N3.polite.shy[1]`: 報告です…あ、あの…
- `NOTIF_DIALOGUES.N3.polite.earnest[1]`: 申し訳ありません…少し休ませていただければ、必ず戻ります
- `NOTIF_DIALOGUES.N3.polite.emotional[1]`: う…体がしんどいです…でも、でも頑張りたいのに…っ
- `NOTIF_DIALOGUES.N4.standard.normal[1]`: こんなにたくさんの応援をいただけるなんて、びっくりしています
- `NOTIF_DIALOGUES.N4.standard.normal[2]`: ファンの声が力になってます
- `NOTIF_DIALOGUES.N4.standard.bold[1]`: この人気を足がかりに、私はもっと上に行く
- `NOTIF_DIALOGUES.N4.standard.bold[2]`: まだまだここで終わるつもりはない
- `NOTIF_DIALOGUES.N4.standard.quiet[1]`: ……応援、ありがとうございます
- `NOTIF_DIALOGUES.N4.standard.shy[1]`: え、あの…私なんかを応援してくれる人がいるなんて…
- `NOTIF_DIALOGUES.N4.standard.easygoing[1]`: ファンの皆さんが喜んでくれるのが一番嬉しい！
- `NOTIF_DIALOGUES.N4.standard.easygoing[2]`: もっとみんなを楽しませたい！
- `NOTIF_DIALOGUES.N4.standard.earnest[1]`: みんなに応援してもらえるって、本当に力になりますね
- `NOTIF_DIALOGUES.N4.standard.earnest[2]`: ファンの声が原動力です
- `NOTIF_DIALOGUES.N4.standard.emotional[1]`: みんなが応援してくれてる…！嬉しくて泣きそう…！
- `NOTIF_DIALOGUES.N4.ojousama.normal[1]`: 皆様からこれほどの声援をいただけるのは、光栄です
- `NOTIF_DIALOGUES.N4.ojousama.bold[1]`: この声援を力に、さらに上を目指しますわ
- `NOTIF_DIALOGUES.N4.ojousama.quiet[1]`: ……応援、感謝いたしますわ
- `NOTIF_DIALOGUES.N4.ojousama.shy[1]`: え、あの…わたくしなんかを応援してくださる方がいるなんて…
- `NOTIF_DIALOGUES.N4.ojousama.earnest[1]`: ファンの皆様のお声が力になりますわ
- `NOTIF_DIALOGUES.N4.ojousama.emotional[1]`: 皆さんが応援してくださって…っ、嬉しくて泣きそう…っ
- `NOTIF_DIALOGUES.N4.delinquent.normal[1]`: 応援してくれるやつがいるってのは…悪くねえな
- `NOTIF_DIALOGUES.N4.delinquent.bold[1]`: この勢いで突っ走るぜ！
- `NOTIF_DIALOGUES.N4.delinquent.quiet[1]`: ……応援、ありがとな
- `NOTIF_DIALOGUES.N4.delinquent.shy[1]`: え、あの…あたしなんかを応援してくれる人がいるなんて…
- `NOTIF_DIALOGUES.N4.delinquent.easygoing[1]`: ファンが盛り上がってんの最高じゃん！
- `NOTIF_DIALOGUES.N4.delinquent.earnest[1]`: 応援してもらえるってのは、マジで力になるな
- `NOTIF_DIALOGUES.N4.delinquent.earnest[2]`: ファンの声が原動力なんだよ
- `NOTIF_DIALOGUES.N4.delinquent.emotional[1]`: みんな応援してくれてる…っ、嬉しくて泣きそうだよ…っ
- `NOTIF_DIALOGUES.N4.seductive.normal[1]`: こんなに応援してもらえるなんて…嬉しいわ
- `NOTIF_DIALOGUES.N4.seductive.bold[1]`: この人気、活かさない手はないわね
- `NOTIF_DIALOGUES.N4.seductive.shy[1]`: え、あの…わたしなんかを応援してくれる人がいるなんて…
- `NOTIF_DIALOGUES.N4.seductive.easygoing[1]`: ファンの方が喜んでくれると、もっと見せたくなるわ
- `NOTIF_DIALOGUES.N4.seductive.earnest[1]`: 応援してくれる人がいるって、本当に力になるの
- `NOTIF_DIALOGUES.N4.seductive.emotional[1]`: 大事な話よ……っ……ふふ、しっかり聞いて……
- `NOTIF_DIALOGUES.N4.composed.normal[1]`: …ありがたいね。ちゃんと届いてるよ
- `NOTIF_DIALOGUES.N4.composed.bold[1]`: …悪くないね。この期待に応えるだけだよ
- `NOTIF_DIALOGUES.N4.composed.quiet[1]`: …応援、ありがとう。…届いてるよ
- `NOTIF_DIALOGUES.N4.composed.shy[1]`: …私を応援してくれる人がいるのか。…ちょっと驚いたよ
- `NOTIF_DIALOGUES.N4.composed.easygoing[1]`: …ファンが喜んでくれるのが一番だね
- `NOTIF_DIALOGUES.N4.composed.easygoing[2]`: …もっと楽しませたいな
- `NOTIF_DIALOGUES.N4.composed.earnest[1]`: …みんなの声、ちゃんと届いてるよ。ありがたいね
- `NOTIF_DIALOGUES.N4.composed.emotional[1]`: …みんな応援してくれてるんだね。…ちょっと、泣きそうだ
- `NOTIF_DIALOGUES.N4.cool.bold[1]`: …悪くない。もっと上を目指す
- `NOTIF_DIALOGUES.N4.cool.quiet[1]`: …ファンの期待には応える
- `NOTIF_DIALOGUES.N4.cool.shy[1]`: …私を応援してくれる人がいる。…信じられない
- `NOTIF_DIALOGUES.N4.cool.easygoing[1]`: …ファンが喜ぶ。それが一番だ
- `NOTIF_DIALOGUES.N4.cool.easygoing[2]`: …もっと楽しませたい
- `NOTIF_DIALOGUES.N4.cool.earnest[1]`: …応援は、力になる
- `NOTIF_DIALOGUES.N4.cool.earnest[2]`: …ファンの声が原動力だ
- `NOTIF_DIALOGUES.N4.cool.emotional[1]`: …みんなが応援してくれてる。…泣きそうだ
- `NOTIF_DIALOGUES.N4.polite.quiet[1]`: …応援してくださって、ありがとうございます
- `NOTIF_DIALOGUES.N4.polite.shy[1]`: お、大事なお知らせです…
- `NOTIF_DIALOGUES.N4.polite.earnest[1]`: 皆様の応援が、何よりの原動力です
- `NOTIF_DIALOGUES.N4.polite.emotional[1]`: みんなが応援してくださって…っ、嬉しくて泣きそうです…っ
- `NOTIF_DIALOGUES.N5_warning.standard.normal[1]`: （どこか上の空で、視線が泳いでいる）
- `NOTIF_DIALOGUES.N5_warning.standard.normal[2]`: ……すみません、ちょっと考え事を
- `NOTIF_DIALOGUES.N5_warning.standard.bold[1]`: ……このままで本当にいいのか、って考えちゃうことがある
- `NOTIF_DIALOGUES.N5_warning.standard.bold[2]`: 最近、何と戦ってるのか分からなくなる
- `NOTIF_DIALOGUES.N5_warning.standard.shy[1]`: …あ、あの……なんでもない、です…
- `NOTIF_DIALOGUES.N5_warning.standard.easygoing[1]`: あはは…いや、ちょっとね。大丈夫、大丈夫
- `NOTIF_DIALOGUES.N5_warning.standard.earnest[1]`: 練習しても練習しても、何かが足りない気がして…
- `NOTIF_DIALOGUES.N5_warning.standard.earnest[2]`: …ここにいたい気持ちは変わらないんですけど……
- `NOTIF_DIALOGUES.N5_warning.standard.emotional[1]`: …なんか、最近ずっとモヤモヤして…うまく言えないけど…
- `NOTIF_DIALOGUES.N5_warning.ojousama.normal[1]`: …少し、考え事がございまして
- `NOTIF_DIALOGUES.N5_warning.ojousama.bold[1]`: …このままで本当によろしいのか、と考えてしまいますの
- `NOTIF_DIALOGUES.N5_warning.ojousama.quiet[1]`: ………なんでも、ありませんわ
- `NOTIF_DIALOGUES.N5_warning.ojousama.shy[1]`: …あ、あの……なんでも、ありませんの…
- `NOTIF_DIALOGUES.N5_warning.ojousama.earnest[1]`: 練習を重ねましても、何かが足りない気がしますの…
- `NOTIF_DIALOGUES.N5_warning.ojousama.emotional[1]`: …なんだか、最近ずっと胸がざわついて…うまく言えませんけれど…
- `NOTIF_DIALOGUES.N5_warning.delinquent.normal[1]`: …別に。何でもねーよ
- `NOTIF_DIALOGUES.N5_warning.delinquent.bold[1]`: …最近、何のために戦ってんのか分かんねーんだ
- `NOTIF_DIALOGUES.N5_warning.delinquent.quiet[1]`: ………別に。なんでもねえ
- `NOTIF_DIALOGUES.N5_warning.delinquent.shy[1]`: …あ、いや……なんでも、ねえっす…
- `NOTIF_DIALOGUES.N5_warning.delinquent.easygoing[1]`: あー…いや、なんでもねー。平気平気
- `NOTIF_DIALOGUES.N5_warning.delinquent.earnest[1]`: 練習しても練習しても、何かが足りねえ気がしてよ…
- `NOTIF_DIALOGUES.N5_warning.delinquent.earnest[2]`: …ここにいてえ気持ちは変わらねえんだけどさ……
- `NOTIF_DIALOGUES.N5_warning.delinquent.emotional[1]`: …なんか、最近ずっとモヤモヤしててよ…うまく言えねえけど…
- `NOTIF_DIALOGUES.N5_warning.seductive.normal[1]`: …ごめんなさい、ちょっと考え事してて
- `NOTIF_DIALOGUES.N5_warning.seductive.bold[1]`: …このままでいいのかなって、ふと思うの
- `NOTIF_DIALOGUES.N5_warning.seductive.shy[1]`: …あ、あの……なんでも、ないの…
- `NOTIF_DIALOGUES.N5_warning.seductive.easygoing[1]`: ふふ…なんでもないわ。気にしないで
- `NOTIF_DIALOGUES.N5_warning.seductive.earnest[1]`: いくら練習しても、何か足りない気がして…
- `NOTIF_DIALOGUES.N5_warning.seductive.emotional[1]`: 緊急よ……っ……ふふ、よく聞いて……
- `NOTIF_DIALOGUES.N5_warning.composed.normal[1]`: …ん、ちょっと考え事。気にしないで
- `NOTIF_DIALOGUES.N5_warning.composed.bold[1]`: …ま、少し立ち止まってるだけだよ。…たぶん
- `NOTIF_DIALOGUES.N5_warning.composed.quiet[1]`: …………なんでもないよ
- `NOTIF_DIALOGUES.N5_warning.composed.shy[1]`: …いや、なんでもないよ。…気にしないで
- `NOTIF_DIALOGUES.N5_warning.composed.easygoing[1]`: …いや、ちょっとね。…大丈夫、大丈夫
- `NOTIF_DIALOGUES.N5_warning.composed.earnest[1]`: …何かが噛み合わない。…まあ、そういう時期もあるか
- `NOTIF_DIALOGUES.N5_warning.composed.emotional[1]`: …最近、ずっと晴れないんだよね。…うまく言えないけど
- `NOTIF_DIALOGUES.N5_warning.cool.bold[1]`: ……目的を、見失いかけている
- `NOTIF_DIALOGUES.N5_warning.cool.shy[1]`: …あ……なんでも、ない
- `NOTIF_DIALOGUES.N5_warning.cool.easygoing[1]`: …いや、少しな。大丈夫だ
- `NOTIF_DIALOGUES.N5_warning.cool.earnest[1]`: …練習しても、何かが足りない
- `NOTIF_DIALOGUES.N5_warning.cool.earnest[2]`: …ここにいたい気持ちは、変わらない。…ただ
- `NOTIF_DIALOGUES.N5_warning.cool.emotional[1]`: …最近、ずっとモヤモヤする。…うまく言えない
- `NOTIF_DIALOGUES.N5_warning.polite.quiet[1]`: …あの…何でもありません…
- `NOTIF_DIALOGUES.N5_warning.polite.shy[1]`: き、緊急のお知らせです…!
- `NOTIF_DIALOGUES.N5_warning.polite.earnest[1]`: 練習を重ねても、何か足りない気がいたしまして…
- `NOTIF_DIALOGUES.N5_warning.polite.emotional[1]`: …なんだか、最近ずっとモヤモヤして…うまく言えないんですけど…
- `NOTIF_DIALOGUES.N5_low.standard.normal[1]`: …別に、何でもないです
- `NOTIF_DIALOGUES.N5_low.standard.normal[2]`: もういいです。分かりました
- `NOTIF_DIALOGUES.N5_low.standard.bold[1]`: ……この団体で、自分の夢は叶えられるんだろうか
- `NOTIF_DIALOGUES.N5_low.standard.bold[2]`: 先が見えなくて、焦ってる
- `NOTIF_DIALOGUES.N5_low.standard.quiet[1]`: ………（何も言わず、目を逸らす）
- `NOTIF_DIALOGUES.N5_low.standard.shy[1]`: …ごめんなさい…もう…わかりません…
- `NOTIF_DIALOGUES.N5_low.standard.easygoing[1]`: あはは…もう、いいかなって。ちょっと考えさせて
- `NOTIF_DIALOGUES.N5_low.standard.earnest[1]`: 裏切りたいわけじゃない。ただ……
- `NOTIF_DIALOGUES.N5_low.standard.earnest[2]`: ここが好きだから、だから辛いんです
- `NOTIF_DIALOGUES.N5_low.standard.emotional[1]`: もう…もう分かんない…！どうすればいいの…！
- `NOTIF_DIALOGUES.N5_low.ojousama.normal[1]`: …もう結構ですわ
- `NOTIF_DIALOGUES.N5_low.ojousama.bold[1]`: …この団体で、わたしの夢は叶えられますの…？
- `NOTIF_DIALOGUES.N5_low.ojousama.quiet[1]`: ………（静かに目を伏せ、何も言わない）
- `NOTIF_DIALOGUES.N5_low.ojousama.shy[1]`: …ごめんなさい…もう…わかりませんの…
- `NOTIF_DIALOGUES.N5_low.ojousama.earnest[1]`: 裏切りたいわけではありませんの。ただ……
- `NOTIF_DIALOGUES.N5_low.ojousama.emotional[1]`: もう…もうわかりません…っ、どうすればよいの…っ
- `NOTIF_DIALOGUES.N5_low.delinquent.normal[1]`: …もういいわ。勝手にする
- `NOTIF_DIALOGUES.N5_low.delinquent.bold[1]`: …ここにいても、先が見えねえ
- `NOTIF_DIALOGUES.N5_low.delinquent.quiet[1]`: ………（小さく舌打ちして、そっぽを向く）
- `NOTIF_DIALOGUES.N5_low.delinquent.shy[1]`: …悪い…もう…わかんねえっす…
- `NOTIF_DIALOGUES.N5_low.delinquent.easygoing[1]`: もーいいわ。考えさせてくれ
- `NOTIF_DIALOGUES.N5_low.delinquent.earnest[1]`: 裏切りてえわけじゃねえんだ。ただ……
- `NOTIF_DIALOGUES.N5_low.delinquent.earnest[2]`: ここが好きだからよ、だから辛えんだよ
- `NOTIF_DIALOGUES.N5_low.delinquent.emotional[1]`: もう…もうわかんねえよ…っ、どうすりゃいいんだよ…っ
- `NOTIF_DIALOGUES.N5_low.seductive.normal[1]`: …もういいわ。分かったから
- `NOTIF_DIALOGUES.N5_low.seductive.bold[1]`: …ここにいて、私の夢は叶うのかしら
- `NOTIF_DIALOGUES.N5_low.seductive.shy[1]`: …ごめんなさい…もう…わからないの…
- `NOTIF_DIALOGUES.N5_low.seductive.easygoing[1]`: ふふ…もういいかなって、少し思っちゃった
- `NOTIF_DIALOGUES.N5_low.seductive.earnest[1]`: 裏切りたいわけじゃないの。ただ……ね
- `NOTIF_DIALOGUES.N5_low.seductive.emotional[1]`: ちょっと心配なの……っ……ふふ……
- `NOTIF_DIALOGUES.N5_low.composed.normal[1]`: …もういいよ。分かったから
- `NOTIF_DIALOGUES.N5_low.composed.bold[1]`: …ここにいる意味、少し考え直してもいいかな
- `NOTIF_DIALOGUES.N5_low.composed.quiet[1]`: ………（何も言わず、窓の外を見ている）
- `NOTIF_DIALOGUES.N5_low.composed.shy[1]`: …ごめん。…もう、わからないんだ
- `NOTIF_DIALOGUES.N5_low.composed.easygoing[1]`: …もう、いいかなって。…少し考えさせて
- `NOTIF_DIALOGUES.N5_low.composed.earnest[1]`: …嫌いになったわけじゃない。ただ……ね
- `NOTIF_DIALOGUES.N5_low.composed.emotional[1]`: …もう、わからない。…どうすればいいんだろうね
- `NOTIF_DIALOGUES.N5_low.cool.bold[1]`: ……もう、見切りをつけるべきなのか
- `NOTIF_DIALOGUES.N5_low.cool.quiet[1]`: ……（静かに出口を見ている）
- `NOTIF_DIALOGUES.N5_low.cool.shy[1]`: …ごめん。…もう、わからない
- `NOTIF_DIALOGUES.N5_low.cool.easygoing[1]`: …もう、いいかもしれない。少し考えさせてくれ
- `NOTIF_DIALOGUES.N5_low.cool.earnest[1]`: …裏切りたいわけじゃない。ただ……
- `NOTIF_DIALOGUES.N5_low.cool.earnest[2]`: …ここが好きだ。…だから、辛い
- `NOTIF_DIALOGUES.N5_low.cool.emotional[1]`: …もう、わからない。…どうすればいい
- `NOTIF_DIALOGUES.N5_low.polite.quiet[1]`: …失礼します（静かに立ち去ろうとする）
- `NOTIF_DIALOGUES.N5_low.polite.shy[1]`: あ、あの…ちょっと、心配なことが…
- `NOTIF_DIALOGUES.N5_low.polite.earnest[1]`: 裏切るつもりはございません。ただ……
- `NOTIF_DIALOGUES.N5_low.polite.emotional[1]`: もう…もうわかりません…っ、どうすればいいんですか…っ

## `SNAPSHOT_TEXTS`

- 出典: `src/data.js`
- コード内コメント: スナップショット通知テキスト — snapshot-engine-instruction.md
- 本数: 184

### G1.scene[]

- `SNAPSHOT_TEXTS.G1.scene[1]`: 給料日。{name}が明細をじっと見つめていた
- `SNAPSHOT_TEXTS.G1.scene[2]`: {name}が食堂で同僚たちの輪に入らず、黙って食事をしていた
- `SNAPSHOT_TEXTS.G1.scene[3]`: {name}がロッカールームで、誰かの契約書をちらりと見ていた

### G1.voice.standard.normal[]

- `SNAPSHOT_TEXTS.G1.voice.standard.normal[1]`: …まあ、こんなもんか
- `SNAPSHOT_TEXTS.G1.voice.standard.normal[2]`: …頑張ってるのにな

### G1.voice.standard.bold[]

- `SNAPSHOT_TEXTS.G1.voice.standard.bold[1]`: …なんであの子と同じ扱いなわけ？
- `SNAPSHOT_TEXTS.G1.voice.standard.bold[2]`: …納得いかない

### G1.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.G1.voice.standard.earnest[1]`: …もっと結果を出せばいいだけの話、だよね
- `SNAPSHOT_TEXTS.G1.voice.standard.earnest[2]`: …自分の力不足かな

### G1.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.G1.voice.standard.emotional[1]`: …なんで…なんでだろ
- `SNAPSHOT_TEXTS.G1.voice.standard.emotional[2]`: …悔しいな

### G1.voice.ojousama.normal[]

- `SNAPSHOT_TEXTS.G1.voice.ojousama.normal[1]`: …お金のことで文句を言うつもりはないけれど

### G1.voice.ojousama.bold[]

- `SNAPSHOT_TEXTS.G1.voice.ojousama.bold[1]`: …わたくしの価値、ちゃんと見てくださっているのかしら

### G1.voice.ojousama.earnest[]

- `SNAPSHOT_TEXTS.G1.voice.ojousama.earnest[1]`: …努力が足りないのかしら。でも…

### G1.voice.delinquent.normal[]

- `SNAPSHOT_TEXTS.G1.voice.delinquent.normal[1]`: …チッ

### G1.voice.delinquent.bold[]

- `SNAPSHOT_TEXTS.G1.voice.delinquent.bold[1]`: …ふざけんなよ

### G1.voice.delinquent.emotional[]

- `SNAPSHOT_TEXTS.G1.voice.delinquent.emotional[1]`: …やってられっかよ

### G1.voice.composed.normal[]

- `SNAPSHOT_TEXTS.G1.voice.composed.normal[1]`: …まあ、こんなものか

### G1.voice.composed.bold[]

- `SNAPSHOT_TEXTS.G1.voice.composed.bold[1]`: …ふぅん。…まあ、いいけど

### G1.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.G1.voice.composed.earnest[1]`: …結果で示すしかないか

### G1.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.G1.voice.composed.emotional[1]`: …っ…まあ、いい

### G1.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.G1.voice.seductive.emotional[1]`: もう少し稼ぎたいわね……っ……

### G1.voice.polite.shy[]

- `SNAPSHOT_TEXTS.G1.voice.polite.shy[1]`: …もう少し、お給料が、上がったらいいな…

### G2.scene[]

- `SNAPSHOT_TEXTS.G2.scene[1]`: {name}が後輩の{name2}の試合を腕を組んで見ていた。複雑な表情だ
- `SNAPSHOT_TEXTS.G2.scene[2]`: {name}が{name2}に技を教えている。だが、その目にどこか翳りがある

### G2.voice.standard.normal[]

- `SNAPSHOT_TEXTS.G2.voice.standard.normal[1]`: …あの子、伸びたな
- `SNAPSHOT_TEXTS.G2.voice.standard.normal[2]`: …先輩としてちゃんと見てるよ。…でもね

### G2.voice.standard.bold[]

- `SNAPSHOT_TEXTS.G2.voice.standard.bold[1]`: …年功序列なんて古い。分かってる。分かってるけど
- `SNAPSHOT_TEXTS.G2.voice.standard.bold[2]`: …あたしだって負けてない

### G2.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.G2.voice.standard.earnest[1]`: …あの子が評価されるのは正しいと思う。思うんだけど

### G2.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.G2.voice.standard.emotional[1]`: …先に始めたのはあたしなのに
- `SNAPSHOT_TEXTS.G2.voice.standard.emotional[2]`: …置いていかれてる気がする

### G2.voice.composed.normal[]

- `SNAPSHOT_TEXTS.G2.voice.composed.normal[1]`: …伸びたね。…まあ、焦ることはない

### G2.voice.composed.bold[]

- `SNAPSHOT_TEXTS.G2.voice.composed.bold[1]`: …やるね。…でも、まだ負けるつもりはない

### G2.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.G2.voice.composed.earnest[1]`: …正当な評価だろうね。…でも、自分もまだ

### G2.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.G2.voice.composed.emotional[1]`: …っ…先にいたのは、こっちなのに

### G2.voice.delinquent.bold[]

- `SNAPSHOT_TEXTS.G2.voice.delinquent.bold[1]`: …ガキが調子乗ってんじゃねーよ

### G2.voice.cool.quiet[]

- `SNAPSHOT_TEXTS.G2.voice.cool.quiet[1]`: …そう。それだけのことだ

### G2.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.G2.voice.seductive.emotional[1]`: ひとりは、ちょっと寂しいの……っ……

### G2.voice.polite.shy[]

- `SNAPSHOT_TEXTS.G2.voice.polite.shy[1]`: …ひ、ひとりだと、寂しいです…

### G3.scene[]

- `SNAPSHOT_TEXTS.G3.scene[1]`: {name}がタイトルマッチのポスターの前で足を止めていた
- `SNAPSHOT_TEXTS.G3.scene[2]`: {name}が練習中、いつもより打ち込みが荒い。何かを持て余している
- `SNAPSHOT_TEXTS.G3.scene[3]`: タイトル戦の話題が出た時、{name}だけが黙っていた

### G3.voice.standard.normal[]

- `SNAPSHOT_TEXTS.G3.voice.standard.normal[1]`: …いつになったら

### G3.voice.standard.bold[]

- `SNAPSHOT_TEXTS.G3.voice.standard.bold[1]`: …いつになったらあたしの番が来るの？
- `SNAPSHOT_TEXTS.G3.voice.standard.bold[2]`: …待つのは好きじゃないな

### G3.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.G3.voice.standard.earnest[1]`: …実力が足りないから？ それとも…
- `SNAPSHOT_TEXTS.G3.voice.standard.earnest[2]`: …もう少し、待てばいいのかな

### G3.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.G3.voice.standard.emotional[1]`: …悔しくないって言ったら嘘になる
- `SNAPSHOT_TEXTS.G3.voice.standard.emotional[2]`: …あたしも、あそこに立ちたい

### G3.voice.composed.normal[]

- `SNAPSHOT_TEXTS.G3.voice.composed.normal[1]`: …まあ、待つさ

### G3.voice.composed.bold[]

- `SNAPSHOT_TEXTS.G3.voice.composed.bold[1]`: …ふぅん。…まだ順番が来ないか

### G3.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.G3.voice.composed.earnest[1]`: …焦ってはいない。…でも、待つのも限度がある

### G3.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.G3.voice.composed.emotional[1]`: …っ…黙ってるけど。…悔しくないわけじゃない

### G3.voice.ojousama.bold[]

- `SNAPSHOT_TEXTS.G3.voice.ojousama.bold[1]`: …わたくしにふさわしい舞台がまだ来ないなんて

### G3.voice.delinquent.bold[]

- `SNAPSHOT_TEXTS.G3.voice.delinquent.bold[1]`: …いい加減使えよ。腐るぞ

### G3.voice.cool.quiet[]

- `SNAPSHOT_TEXTS.G3.voice.cool.quiet[1]`: …チャンスは自分で作るものだと思っている

### G3.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.G3.voice.seductive.emotional[1]`: …もう少し目立たないとダメなのかしら

### G3.voice.polite.shy[]

- `SNAPSHOT_TEXTS.G3.voice.polite.shy[1]`: …も、もっと注目されないと、ダメですよね…

### G4.scene[]

- `SNAPSHOT_TEXTS.G4.scene[1]`: {name}が試合のない週末を持て余しているようだ
- `SNAPSHOT_TEXTS.G4.scene[2]`: 控え室の隅で、{name}がストレッチをしている。出番を待つ背中に焦りが見える
- `SNAPSHOT_TEXTS.G4.scene[3]`: {name}が自主練の後、一人でリングを見つめていた

### G4.voice.standard.normal[]

- `SNAPSHOT_TEXTS.G4.voice.standard.normal[1]`: …出番、来ないかな

### G4.voice.standard.bold[]

- `SNAPSHOT_TEXTS.G4.voice.standard.bold[1]`: …使ってくれなきゃ意味ないじゃん
- `SNAPSHOT_TEXTS.G4.voice.standard.bold[2]`: …あたしの居場所、あるのかな

### G4.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.G4.voice.standard.earnest[1]`: …準備はできてる。いつでも

### G4.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.G4.voice.standard.emotional[1]`: …見てくれてるのかな、あたしのこと

### G4.voice.composed.normal[]

- `SNAPSHOT_TEXTS.G4.voice.composed.normal[1]`: …まあ、待つよ

### G4.voice.composed.bold[]

- `SNAPSHOT_TEXTS.G4.voice.composed.bold[1]`: …使ってくれないと、困るんだけど

### G4.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.G4.voice.composed.earnest[1]`: …準備はできてる。…いつでもね

### G4.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.G4.voice.composed.emotional[1]`: …っ…出番、まだかな

### G4.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.G4.voice.seductive.emotional[1]`: もっと強くなりたいの……っ……

### G4.voice.polite.shy[]

- `SNAPSHOT_TEXTS.G4.voice.polite.shy[1]`: …つ、強くなりたい、です…

### R1.scene[]

- `SNAPSHOT_TEXTS.R1.scene[1]`: {name}と{name2}が控え室で目を合わせなかった
- `SNAPSHOT_TEXTS.R1.scene[2]`: {name}と{name2}の間に、見えない壁がある。周りもそれを感じている
- `SNAPSHOT_TEXTS.R1.scene[3]`: {name}と{name2}が同じテーブルに座ることを避けていた

### R1.staff[]

- `SNAPSHOT_TEXTS.R1.staff[1]`: スタッフから: {name}と{name2}、最近どうも空気がピリついてまして…

### R2.scene[]

- `SNAPSHOT_TEXTS.R2.scene[1]`: 昼休み。他の選手たちが談笑する中、{name}だけが離れた場所にいた
- `SNAPSHOT_TEXTS.R2.scene[2]`: {name}が一人でリングの片付けをしている。手伝う者はいない
- `SNAPSHOT_TEXTS.R2.scene[3]`: 練習後の更衣室。{name}のロッカーの周りだけ、少し空間が空いている

### R2.voice.standard.normal[]

- `SNAPSHOT_TEXTS.R2.voice.standard.normal[1]`: …まあ、一人のほうが気楽だし

### R2.voice.standard.bold[]

- `SNAPSHOT_TEXTS.R2.voice.standard.bold[1]`: …別にいいけど。わたしは一人でやれるし

### R2.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.R2.voice.standard.earnest[1]`: …もっとみんなと話した方がいいのかな

### R2.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.R2.voice.standard.emotional[1]`: …みんな、あたしのこと嫌いなのかな
- `SNAPSHOT_TEXTS.R2.voice.standard.emotional[2]`: …ここにいていいのかな

### R2.voice.composed.normal[]

- `SNAPSHOT_TEXTS.R2.voice.composed.normal[1]`: …別に。一人でも困らない

### R2.voice.composed.bold[]

- `SNAPSHOT_TEXTS.R2.voice.composed.bold[1]`: …まあ、いいんだけどね。一人でも

### R2.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.R2.voice.composed.earnest[1]`: …もう少し歩み寄った方がいいのかな

### R2.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.R2.voice.composed.emotional[1]`: …っ…まあ、いいさ

### R2.voice.delinquent.bold[]

- `SNAPSHOT_TEXTS.R2.voice.delinquent.bold[1]`: …ハッ、群れるのは趣味じゃねーんだよ

### R2.voice.cool.quiet[]

- `SNAPSHOT_TEXTS.R2.voice.cool.quiet[1]`: …孤独には慣れている

### R2.voice.polite.earnest[]

- `SNAPSHOT_TEXTS.R2.voice.polite.earnest[1]`: …何か気に障ることをしたのでしょうか

### R2.voice.polite.shy[]

- `SNAPSHOT_TEXTS.R2.voice.polite.shy[1]`: …あ、あの人と、また話せたらいいな…

### R2.voice.ojousama.emotional[]

- `SNAPSHOT_TEXTS.R2.voice.ojousama.emotional[1]`: …こういう寂しさは初めてですわ

### R2.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.R2.voice.seductive.emotional[1]`: あの子と、もっと話したい……っ……

### R3.scene[]

- `SNAPSHOT_TEXTS.R3.scene[1]`: {name}は{name2}の退団を知り、しばらく言葉を失っていた
- `SNAPSHOT_TEXTS.R3.scene[2]`: {name2}がいなくなったロッカーの前で、{name}が立ち止まっていた

### R3.modal.standard.normal[]

- `SNAPSHOT_TEXTS.R3.modal.standard.normal[1]`: …いなくなっちゃうんだ
- `SNAPSHOT_TEXTS.R3.modal.standard.normal[2]`: …{name2}がいない控え室なんて想像できない

### R3.modal.standard.bold[]

- `SNAPSHOT_TEXTS.R3.modal.standard.bold[1]`: …バカ。なんで何も言わずに行くのよ
- `SNAPSHOT_TEXTS.R3.modal.standard.bold[2]`: …あいつがいないと、張り合いがないな

### R3.modal.standard.earnest[]

- `SNAPSHOT_TEXTS.R3.modal.standard.earnest[1]`: {name2}のために、あたしはここで頑張るから
- `SNAPSHOT_TEXTS.R3.modal.standard.earnest[2]`: …ありがとう。ずっと支えてくれて

### R3.modal.standard.emotional[]

- `SNAPSHOT_TEXTS.R3.modal.standard.emotional[1]`: …やだ。嫌だよ。なんで…
- `SNAPSHOT_TEXTS.R3.modal.standard.emotional[2]`: …{name2}がいないなんて、あたし…

### R3.modal.composed.normal[]

- `SNAPSHOT_TEXTS.R3.modal.composed.normal[1]`: …そうか。…{name2}がいなくなるのか

### R3.modal.composed.bold[]

- `SNAPSHOT_TEXTS.R3.modal.composed.bold[1]`: …行くんだ。…まあ、{name2}が決めたことだからね

### R3.modal.composed.earnest[]

- `SNAPSHOT_TEXTS.R3.modal.composed.earnest[1]`: …{name2}。…ありがとう。…元気でね

### R3.modal.composed.emotional[]

- `SNAPSHOT_TEXTS.R3.modal.composed.emotional[1]`: …っ…{name2}。…元気で

### R3.modal.delinquent.bold[]

- `SNAPSHOT_TEXTS.R3.modal.delinquent.bold[1]`: …チッ。…寂しいなんて言わねーけど

### R3.modal.cool.quiet[]

- `SNAPSHOT_TEXTS.R3.modal.cool.quiet[1]`: …そうか。…分かった

### R3.modal.polite.earnest[]

- `SNAPSHOT_TEXTS.R3.modal.polite.earnest[1]`: {name2}さんとご一緒できて幸せでした。…お元気で

### R3.modal.polite.shy[]

- `SNAPSHOT_TEXTS.R3.modal.polite.shy[1]`: あ、あの…少し、お話できますか…

### R3.modal.ojousama.emotional[]

- `SNAPSHOT_TEXTS.R3.modal.ojousama.emotional[1]`: …{name2}。……あなたがいなくなるなんて

### R4.scene[]

- `SNAPSHOT_TEXTS.R4.scene[1]`: 試合後、{name}の目に静かな炎が燃えていた
- `SNAPSHOT_TEXTS.R4.scene[2]`: {name}がリングを降りる時、一瞬だけ{name2}のほうを振り返った。満足げに

### R4.voice.standard.normal[]

- `SNAPSHOT_TEXTS.R4.voice.standard.normal[1]`: …やっと、追いついた

### R4.voice.standard.bold[]

- `SNAPSHOT_TEXTS.R4.voice.standard.bold[1]`: …ふん。まだまだこんなもんじゃないけどね
- `SNAPSHOT_TEXTS.R4.voice.standard.bold[2]`: …勝った。でも、まだ終わってない

### R4.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.R4.voice.standard.earnest[1]`: …努力は裏切らない。…{name2}、ありがとう

### R4.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.R4.voice.standard.emotional[1]`: …勝った…勝ったよ…！
- `SNAPSHOT_TEXTS.R4.voice.standard.emotional[2]`: …泣くな、あたし。まだ先がある

### R4.voice.composed.normal[]

- `SNAPSHOT_TEXTS.R4.voice.composed.normal[1]`: …悪くない。…やっと追いついた

### R4.voice.composed.bold[]

- `SNAPSHOT_TEXTS.R4.voice.composed.bold[1]`: …勝った。…でも、まだだね

### R4.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.R4.voice.composed.earnest[1]`: …やるべきことをやった。…それだけ

### R4.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.R4.voice.composed.emotional[1]`: …っ…勝った。…うん、勝った

### R4.voice.delinquent.bold[]

- `SNAPSHOT_TEXTS.R4.voice.delinquent.bold[1]`: …ザマァ見ろ

### R4.voice.cool.quiet[]

- `SNAPSHOT_TEXTS.R4.voice.cool.quiet[1]`: …次も同じ結果とは限らない。気を引き締めろ、自分

### R4.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.R4.voice.seductive.emotional[1]`: あの子とは、ちょっと距離を置きたいの……っ……

### R4.voice.polite.shy[]

- `SNAPSHOT_TEXTS.R4.voice.polite.shy[1]`: …あ、あの人とは、距離を置きたい、かも…

### R5.scene[]

- `SNAPSHOT_TEXTS.R5.scene[1]`: {name}は無言でリングを降りた。その拳だけが震えていた
- `SNAPSHOT_TEXTS.R5.scene[2]`: {name}が帰り際、振り返って{name2}のほうを一瞬だけ見た
- `SNAPSHOT_TEXTS.R5.scene[3]`: 試合後の通路で、{name}が壁を叩く音がした

### R5.voice.standard.normal[]

- `SNAPSHOT_TEXTS.R5.voice.standard.normal[1]`: …まだ、足りないのか
- `SNAPSHOT_TEXTS.R5.voice.standard.normal[2]`: …くやしい

### R5.voice.standard.bold[]

- `SNAPSHOT_TEXTS.R5.voice.standard.bold[1]`: …次は絶対に負けない
- `SNAPSHOT_TEXTS.R5.voice.standard.bold[2]`: …この借りは必ず返す

### R5.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.R5.voice.standard.earnest[1]`: …あの人にはまだ勝てない。でも、だからこそ
- `SNAPSHOT_TEXTS.R5.voice.standard.earnest[2]`: …もっと練習する。絶対に

### R5.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.R5.voice.standard.emotional[1]`: …悔しい…悔しい…！
- `SNAPSHOT_TEXTS.R5.voice.standard.emotional[2]`: …なんであたしは勝てないの

### R5.voice.composed.normal[]

- `SNAPSHOT_TEXTS.R5.voice.composed.normal[1]`: …足りなかった。…次、だね

### R5.voice.composed.bold[]

- `SNAPSHOT_TEXTS.R5.voice.composed.bold[1]`: …次は返す。…覚えておいて

### R5.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.R5.voice.composed.earnest[1]`: …まだ足りないか。…次までに詰めるよ

### R5.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.R5.voice.composed.emotional[1]`: …っ…次は、こうはいかない

### R5.voice.delinquent.bold[]

- `SNAPSHOT_TEXTS.R5.voice.delinquent.bold[1]`: …クソッ…！

### R5.voice.cool.quiet[]

- `SNAPSHOT_TEXTS.R5.voice.cool.quiet[1]`: …敗因は分かっている。次までに修正する

### R5.voice.ojousama.emotional[]

- `SNAPSHOT_TEXTS.R5.voice.ojousama.emotional[1]`: …こんなはずでは…こんなはずでは、ないのに

### R5.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.R5.voice.seductive.emotional[1]`: 負けたくないの……っ……ふふ……

### R5.voice.polite.shy[]

- `SNAPSHOT_TEXTS.R5.voice.polite.shy[1]`: …ま、負けたく、ないです…

### friction.scene[]

- `SNAPSHOT_TEXTS.friction.scene[1]`: {name}と{name2}が練習メニューの順番で揉めていた。些細なことだが
- `SNAPSHOT_TEXTS.friction.scene[2]`: {name}が{name2}の練習態度について、小声で何か言っていた
- `SNAPSHOT_TEXTS.friction.scene[3]`: {name}と{name2}が同時に控え室に入った瞬間、空気が変わった

### friction.staff[]

- `SNAPSHOT_TEXTS.friction.staff[1]`: スタッフから: {name}と{name2}、ちょっと相性が良くないみたいで…

### generation.scene[]

- `SNAPSHOT_TEXTS.generation.scene[1]`: {name}と{name2}が一緒に帰っていく姿が見えた。同世代の気安さがある
- `SNAPSHOT_TEXTS.generation.scene[2]`: {name}と{name2}が自販機の前で笑い合っていた。何が面白いのか、こちらには分からないが
- `SNAPSHOT_TEXTS.generation.scene[3]`: {name}が{name2}を自主練に誘っている。いい雰囲気だ
- `SNAPSHOT_TEXTS.generation.scene[4]`: {name}と{name2}が昼食を一緒に取っている。どうやら仲がいいらしい

### rivalryResolved.scene[]

- `SNAPSHOT_TEXTS.rivalryResolved.scene[1]`: 決着はついた。だが{name}と{name2}が目を合わせた時、そこにはまだ何かがあった
- `SNAPSHOT_TEXTS.rivalryResolved.scene[2]`: 因縁は終わった。はずだ。…だが{name}は{name2}の動向を気にしている

### careerBestMQ.scene[]

- `SNAPSHOT_TEXTS.careerBestMQ.scene[1]`: {name}が試合後、自分の両手を見つめていた。何かを掴んだ表情だ
- `SNAPSHOT_TEXTS.careerBestMQ.scene[2]`: {name}の試合が終わった後、先輩たちが小さく頷いていた

### breakthrough.voice.standard.normal[]

- `SNAPSHOT_TEXTS.breakthrough.voice.standard.normal[1]`: …ここで頑張ってきてよかった

### breakthrough.voice.standard.bold[]

- `SNAPSHOT_TEXTS.breakthrough.voice.standard.bold[1]`: …まだまだ強くなれる！この団体でなら

### breakthrough.voice.standard.quiet[]

- `SNAPSHOT_TEXTS.breakthrough.voice.standard.quiet[1]`: …この場所に感謝している

### breakthrough.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.breakthrough.voice.standard.earnest[1]`: …みんなのおかげです。もっと恩返しがしたい

### breakthrough.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.breakthrough.voice.standard.emotional[1]`: …うれしい…ここにいてよかった

### breakthrough.voice.composed.normal[]

- `SNAPSHOT_TEXTS.breakthrough.voice.composed.normal[1]`: …悪くない環境だね。…感謝してる

### breakthrough.voice.composed.bold[]

- `SNAPSHOT_TEXTS.breakthrough.voice.composed.bold[1]`: …まだ先がある。…ここでなら

### breakthrough.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.breakthrough.voice.composed.earnest[1]`: …ここで積み重ねてきたものが、繋がった

### breakthrough.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.breakthrough.voice.composed.emotional[1]`: …っ…ここにいてよかった

### breakthrough.voice.cool.quiet[]

- `SNAPSHOT_TEXTS.breakthrough.voice.cool.quiet[1]`: …環境に恵まれた。それは認める

### breakthrough.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.breakthrough.voice.seductive.emotional[1]`: 何かが変わった……っ……ふふ……

### breakthrough.voice.polite.shy[]

- `SNAPSHOT_TEXTS.breakthrough.voice.polite.shy[1]`: …な、何かが、変わった気がします…

### warVictory.scene[]

- `SNAPSHOT_TEXTS.warVictory.scene[1]`: {name}はチームの勝利に拳を握りしめた。この団体の看板を背負う覚悟が見えた

### warVictory.voice.standard.bold[]

- `SNAPSHOT_TEXTS.warVictory.voice.standard.bold[1]`: …わたしが勝つに決まってるでしょ。この団体を背負ってるんだから！

### warVictory.voice.standard.earnest[]

- `SNAPSHOT_TEXTS.warVictory.voice.standard.earnest[1]`: …みんなの想いを背負って戦えて光栄です

### warVictory.voice.standard.emotional[]

- `SNAPSHOT_TEXTS.warVictory.voice.standard.emotional[1]`: …勝った…！ みんなのおかげだよ…！

### warVictory.voice.composed.bold[]

- `SNAPSHOT_TEXTS.warVictory.voice.composed.bold[1]`: …勝った。…うちの看板、守れたかな

### warVictory.voice.composed.earnest[]

- `SNAPSHOT_TEXTS.warVictory.voice.composed.earnest[1]`: …みんなの分も、背負えた。…よかった

### warVictory.voice.composed.emotional[]

- `SNAPSHOT_TEXTS.warVictory.voice.composed.emotional[1]`: …っ…勝った。…みんなのおかげだ

### warVictory.voice.seductive.emotional[]

- `SNAPSHOT_TEXTS.warVictory.voice.seductive.emotional[1]`: 勝てた……っ……ふふ、最高の気分……

### warVictory.voice.cool.quiet[]

- `SNAPSHOT_TEXTS.warVictory.voice.cool.quiet[1]`: …当然の結果だ

### warVictory.voice.polite.shy[]

- `SNAPSHOT_TEXTS.warVictory.voice.polite.shy[1]`: …か、勝てて、よかったです…

## `Engine.flavor.MAGAZINE_HEADLINES`

- 出典: `src/management.js`
- 本数: 6

- `Engine.flavor.MAGAZINE_HEADLINES[1]`: 📰 週刊女子プロレス — 「${name}、独占インタビュー掲載。『まだまだ頂点を譲る気はない』」
- `Engine.flavor.MAGAZINE_HEADLINES[2]`: 📰 月刊プロレスマガジン — 「特集：${name}の素顔に迫る」
- `Engine.flavor.MAGAZINE_HEADLINES[3]`: 📰 週刊女子プロレス — 「${name}、表紙＆巻頭グラビア！ファン歓喜」
- `Engine.flavor.MAGAZINE_HEADLINES[4]`: 📰 スポーツ報知 — 「${name}が語る"強さの秘密"」
- `Engine.flavor.MAGAZINE_HEADLINES[5]`: 📰 週刊女子プロレス — 「${name}密着ルポ。練習場から見えた執念」
- `Engine.flavor.MAGAZINE_HEADLINES[6]`: 📰 月刊プロレスマガジン — 「${name}インタビュー。『ファンの声援が力になる』」

## `Engine.flavor.TV_HEADLINES`

- 出典: `src/management.js`
- 本数: 6

- `Engine.flavor.TV_HEADLINES[1]`: 📺 スポーツニュース — 「${name}がゴールデンタイムに登場。業界への注目が高まっている」
- `Engine.flavor.TV_HEADLINES[2]`: 📺 バラエティ番組出演 — 「${name}のトーク力に共演者も驚き」
- `Engine.flavor.TV_HEADLINES[3]`: 📺 朝の情報番組 — 「話題の女子プロレスラー${name}に密着取材」
- `Engine.flavor.TV_HEADLINES[4]`: 📺 スポーツドキュメント — 「${name}、リングの外の真実」
- `Engine.flavor.TV_HEADLINES[5]`: 📺 特番出演 — 「女子プロレス最前線！ ${name}の魅力を徹底解剖」
- `Engine.flavor.TV_HEADLINES[6]`: 📺 トーク番組 — 「${name}、意外な素顔にスタジオ沸く」

## `App._NEWSPAPER_HEADLINES`

- 出典: `src/app.js`
- コード内コメント: 新聞記事テキスト生成
- 本数: 25

### titleWin[]

- `App._NEWSPAPER_HEADLINES.titleWin[1]`: ${d.winner.name}、${d.finishLabel}で戴冠！
- `App._NEWSPAPER_HEADLINES.titleWin[2]`: 王座奪取！ ${d.winner.name}が${d.loser.name}を下す
- `App._NEWSPAPER_HEADLINES.titleWin[3]`: 新王者${d.winner.name}誕生——${d.venue.name}が揺れた

### titleDefend[]

- `App._NEWSPAPER_HEADLINES.titleDefend[1]`: 王者${d.winner.name}、${d.loser.name}の挑戦を退ける
- `App._NEWSPAPER_HEADLINES.titleDefend[2]`: ${d.winner.name}防衛成功！ 王座の威厳を示す

### rivalry[]

- `App._NEWSPAPER_HEADLINES.rivalry[1]`: 宿命の対決——${d.winner.name}が${d.rivalLabel}を制す
- `App._NEWSPAPER_HEADLINES.rivalry[2]`: ${d.left.name}vs${d.right.name}、因縁に決着か
- `App._NEWSPAPER_HEADLINES.rivalry[3]`: ${d.rivalLabel}の行方——${d.winner.name}に軍配

### dominant[]

- `App._NEWSPAPER_HEADLINES.dominant[1]`: ${d.winner.name}、圧巻の${d.turns}ターン決着！
- `App._NEWSPAPER_HEADLINES.dominant[2]`: 電撃決着！ ${d.winner.name}が${d.loser.name}を一蹴
- `App._NEWSPAPER_HEADLINES.dominant[3]`: ${d.loser.name}なすすべなし——${d.winner.name}の完勝

### closeMQ[]

- `App._NEWSPAPER_HEADLINES.closeMQ[1]`: 死闘${d.turns}ターン——${d.winner.name}が辛くも勝利
- `App._NEWSPAPER_HEADLINES.closeMQ[2]`: ${d.winner.name}と${d.loser.name}、名勝負の果てに
- `App._NEWSPAPER_HEADLINES.closeMQ[3]`: 激闘の末に${d.winner.name}！ MQ ${d.mq}の熱戦

### upset[]

- `App._NEWSPAPER_HEADLINES.upset[1]`: 大番狂わせ！ ${d.winner.name}が格上${d.loser.name}を撃破
- `App._NEWSPAPER_HEADLINES.upset[2]`: ジャイアントキリング——${d.winner.name}の衝撃勝利
- `App._NEWSPAPER_HEADLINES.upset[3]`: 誰が予想した？ ${d.winner.name}が${d.loser.name}を沈める

### superMQ[]

- `App._NEWSPAPER_HEADLINES.superMQ[1]`: 歴史的名勝負！ MQ ${d.mq}を記録
- `App._NEWSPAPER_HEADLINES.superMQ[2]`: 語り継がれる一戦——${d.winner.name}vs${d.loser.name}

### draw[]

- `App._NEWSPAPER_HEADLINES.draw[1]`: ${d.left.name}と${d.right.name}、決着つかず
- `App._NEWSPAPER_HEADLINES.draw[2]`: 譲らぬ二人——メインは決着つかずに終わる
- `App._NEWSPAPER_HEADLINES.draw[3]`: 決着つかず。${d.left.name}も${d.right.name}も一歩も退かず

### normal[]

- `App._NEWSPAPER_HEADLINES.normal[1]`: ${d.winner.name}がメインイベントを制す
- `App._NEWSPAPER_HEADLINES.normal[2]`: ${d.winner.name}、${d.finishLabel}で勝利
- `App._NEWSPAPER_HEADLINES.normal[3]`: ${d.venue.name}のメイン、${d.winner.name}に軍配

## `App._NEWSPAPER_ARTICLES`

- 出典: `src/app.js`
- 本数: 17

- `App._NEWSPAPER_ARTICLES.titleWin[1]`: ${d.venue.name}に詰めかけた${d.attendance.toLocaleString()}人の観衆が見届けたのは、新たな王者の誕生だった。${d.winner.name}は序盤から積極的に攻め込み、${d.finishLabel}で${d.loser.name}から3カウントを奪取。試合後、ベルトを手にした${d.winner.name}の表情には、長い道のりを歩んできた者だけが見せる充足感が浮かんでいた。
- `App._NEWSPAPER_ARTICLES.titleWin[2]`: ${d.loser.name}の牙城がついに崩れた。${d.turns}ターンに及ぶ攻防の末、${d.winner.name}が${d.finishLabel}で王座を奪取。${d.venue.name}のリングに立つ新王者に、${d.attendance.toLocaleString()}人のファンが惜しみない拍手を送った。
- `App._NEWSPAPER_ARTICLES.titleDefend[1]`: ${d.loser.name}の挑戦を受けた王者${d.winner.name}は、${d.turns}ターンの攻防を経て${d.finishLabel}で防衛に成功。${d.attendance.toLocaleString()}人の前で王座の重みを証明した。敗れた${d.loser.name}もリング上で健闘を称えられ、次なる挑戦への期待が膨らむ。
- `App._NEWSPAPER_ARTICLES.rivalry[1]`: もはや説明不要のカード。${d.left.name}と${d.right.name}による${d.rivalLabel}は今回も期待を裏切らなかった。${d.turns}ターン、互いの手の内を知り尽くした二人の攻防はMQ ${d.mq}を記録。最後は${d.winner.name}の${d.finishLabel}が決着を呼んだ。この因縁に終わりはあるのか——その答えは、まだ誰にも分からない。
- `App._NEWSPAPER_ARTICLES.rivalry[2]`: ${d.rivalLabel}として知られる二人が再びリングで激突。${d.venue.name}の空気は試合前から張り詰めていた。${d.winner.name}が${d.finishLabel}で勝利を収めたが、敗れた${d.loser.name}の闘志は折れていない。次の対戦が、すでに待ち遠しい。
- `App._NEWSPAPER_ARTICLES.goodRival[1]`: 互いを高め合う二人の戦いは、今回もファンの心を掴んだ。${d.left.name}と${d.right.name}は${d.turns}ターンにわたり好勝負を展開。${d.winner.name}が${d.finishLabel}で勝利を手にしたが、試合後に交わした視線には敵意ではなく敬意が宿っていた。MQ ${d.mq}。
- `App._NEWSPAPER_ARTICLES.dominant[1]`: わずか${d.turns}ターン。${d.winner.name}は${d.loser.name}に反撃の余地すら与えなかった。${d.finishLabel}が決まった瞬間、${d.venue.name}は静まり返った。実力差を見せつけた${d.winner.name}の強さは本物だ。
- `App._NEWSPAPER_ARTICLES.dominant[2]`: ${d.loser.name}にとっては厳しい夜となった。${d.winner.name}の猛攻に防戦一方、${d.turns}ターンでの決着に${d.attendance.toLocaleString()}人の観客も言葉を失った。
- `App._NEWSPAPER_ARTICLES.closeMQ[1]`: ${d.turns}ターンの死闘——勝敗を分けたのは、ほんのわずかな差だった。${d.winner.name}と${d.loser.name}はMQ ${d.mq}の名勝負を演じ、${d.venue.name}の${d.attendance.toLocaleString()}人を総立ちにさせた。${d.finishLabel}で辛くも勝利した${d.winner.name}だが、敗れた${d.loser.name}の評価もまた上がったはずだ。
- `App._NEWSPAPER_ARTICLES.closeMQ[2]`: 最後の最後まで勝負の行方は分からなかった。${d.loser.name}も見せ場を作り続けたが、${d.winner.name}の${d.finishLabel}が決着を告げた。消耗戦を制した${d.winner.name}のタフネスが光った${d.turns}ターン。MQ ${d.mq}は今シーズン屈指の数字だ。
- `App._NEWSPAPER_ARTICLES.upset[1]`: 戦前の予想を覆す結果となった。OVR格差${d.ovrGap}ポイントの壁を、${d.winner.name}は気迫で打ち破った。${d.finishLabel}が決まった瞬間、${d.venue.name}は驚きと興奮に包まれた。格上${d.loser.name}からの金星は、${d.winner.name}にとって大きな自信になるだろう。
- `App._NEWSPAPER_ARTICLES.superMQ[1]`: MQ ${d.mq}——今シーズンのベストバウト候補が生まれた。${d.left.name}と${d.right.name}は${d.turns}ターンにわたって技術と闘志をぶつけ合い、${d.venue.name}の${d.attendance.toLocaleString()}人を熱狂の渦に巻き込んだ。${d.winner.name}が${d.finishLabel}で勝利を収めたが、勝敗を超えた価値がこの試合にはあった。
- `App._NEWSPAPER_ARTICLES.draw[1]`: ${d.left.name}と${d.right.name}、${d.turns}ターンの攻防は決着を見なかった。互いにフォールを返し合い、極めを切り合い、最後まで膝を折らなかった二人。${d.venue.name}の${d.attendance.toLocaleString()}人は、決着つかずの結果にもかかわらず惜しみない拍手を送った。再戦を望む声が、すでにあちこちから聞こえている。
- `App._NEWSPAPER_ARTICLES.draw[2]`: 決着つかず。${d.left.name}も${d.right.name}も己の全てを出し尽くした結果がこれだ。MQ ${d.mq}が示す通り、試合内容に不満を持つ者はいないだろう。次はどちらが先に決着をつけるのか——${d.attendance.toLocaleString()}人のファンが次の邂逅を待っている。
- `App._NEWSPAPER_ARTICLES.normal[1]`: ${d.venue.name}で行われた${d.showName}のメインイベントは、${d.winner.name}が${d.finishLabel}で${d.loser.name}を下して幕を閉じた。${d.turns}ターンの試合は${d.attendance.toLocaleString()}人の観客を沸かせ、MQ ${d.mq}を記録した。
- `App._NEWSPAPER_ARTICLES.normal[2]`: ${d.winner.name}がメインの大舞台で堂々たる勝利を飾った。${d.loser.name}も要所で見せ場を作ったが、最終的には${d.winner.name}の${d.finishLabel}に沈んだ。${d.attendance.toLocaleString()}人の観客が見守った${d.turns}ターンの一戦。
- `App._NEWSPAPER_ARTICLES.lowMQ[1]`: 正直に言えば、メインイベントは物足りなさが残った。${d.winner.name}が${d.finishLabel}で${d.loser.name}を下したものの、MQ ${d.mq}という数字が試合内容を物語っている。${d.attendance.toLocaleString()}人のファンは、次回の興行にこそ期待を寄せるだろう。

## `KURODA_HEADLINES`

- 出典: `src/kuroda-text.js`
- コード内コメント: 1. 特集見出し（KURODA_HEADLINES）
- 本数: 94

### devastating[]

- `KURODA_HEADLINES.devastating[1]`: 比較記事として成立する最低限のラインがある。今回はそれを下回っている
- `KURODA_HEADLINES.devastating[2]`: ${d.rivalName}に喧嘩を売れる戦力ではない。まずは足元を見るべきだ
- `KURODA_HEADLINES.devastating[3]`: 全項目で負けている。唯一勝っているのは伸びしろくらいだろうか
- `KURODA_HEADLINES.devastating[4]`: ${d.rivalName}から見れば練習相手にすらならないのではないか。失礼だが、事実だ
- `KURODA_HEADLINES.devastating[5]`: この差を「まだ追いつける差」と思っているなら、認識から改めるべきだろう
- `KURODA_HEADLINES.devastating[6]`: ${d.playerName}の関係者には申し訳ないが、今回の比較は茶番に近い
- `KURODA_HEADLINES.devastating[7]`: 率直に言えば、${d.rivalName}の名前を出すのが相手に失礼なくらいの戦力差だ
- `KURODA_HEADLINES.devastating[8]`: これで興行を打てるのだから、度胸だけは本物だ。褒めてはいないが
- `KURODA_HEADLINES.devastating[9]`: 戦力比較というより、現状認識テストだ。現実を直視できるだろうか
- `KURODA_HEADLINES.devastating[10]`: どこから手をつければいいのか、筆者が聞きたいくらいである
- `KURODA_HEADLINES.devastating[11]`: ${d.rivalName}と同じ業界にいるのが不思議なくらいの差だが、まあ、いるのだ
- `KURODA_HEADLINES.devastating[12]`: ファンには申し訳ないが、この団体に夢を見るのは見当はずれであると言わざるを得ない
- `KURODA_HEADLINES.devastating[13]`: ファンに問いたい。この団体のどこに可能性を感じているのか。本気で聞いている
- `KURODA_HEADLINES.devastating[14]`: 比較対象を間違えていないか。${d.rivalName}ではなく、もう二段下の団体と比べたほうが建設的だろう
- `KURODA_HEADLINES.devastating[15]`: 記者として色んな団体を見てきたが、ここまでの戦力差を記事にするのは久しぶりだ
- `KURODA_HEADLINES.devastating[16]`: ${d.playerName}の社長は夜ちゃんと眠れているのか。筆者なら無理だが
- `KURODA_HEADLINES.devastating[17]`: 本紙は40年見てきた中で、これほど「比較が成立しない比較」も珍しいと書いておく
- `KURODA_HEADLINES.devastating[18]`: 数字は嘘をつかない。${d.rivalName}との差を、その嘘のつかない数字が突きつけている
- `KURODA_HEADLINES.devastating[19]`: ${d.playerName}側の「いつかは」を、本紙は信じない。根拠がないからだ
- `KURODA_HEADLINES.devastating[20]`: この惨状を見て、まだ${d.rivalName}の名前を口に出せる神経が、ある意味で凄い
- `KURODA_HEADLINES.devastating[21]`: ${d.playerName}に必要なのは戦略ではなく現実認識だ。それが先決である

### behind[]

- `KURODA_HEADLINES.behind[1]`: 差がある。絶望的とまでは言わないが、楽観できる数字でもない
- `KURODA_HEADLINES.behind[2]`: ${d.rivalName}との差を「まだ何とかなる」で済ませている間は、何ともならない
- `KURODA_HEADLINES.behind[3]`: 弱いのは仕方ない。弱いまま何もしないのが問題なのだ
- `KURODA_HEADLINES.behind[4]`: このまま放置すれば差は広がる一方だ。GMの手腕が問われる
- `KURODA_HEADLINES.behind[5]`: せめて一つ、胸を張れる軸がないと。ファンに何を見せるつもりなのか
- `KURODA_HEADLINES.behind[6]`: ${d.rivalName}にはまだ格で負けている。一点突破の芽がゼロとは言わないが
- `KURODA_HEADLINES.behind[7]`: 率直に言って、課題の数が多すぎる。優先順位をつけるところからだ
- `KURODA_HEADLINES.behind[8]`: 「善戦している」で満足しているうちは二流のままだ
- `KURODA_HEADLINES.behind[9]`: 差があること自体は恥ではない。差を認められないことが恥なのだ
- `KURODA_HEADLINES.behind[10]`: 複数の項目で後れを取っている。巻き返しには相当な覚悟が要る
- `KURODA_HEADLINES.behind[11]`: 期待していないと言えば嘘になるが、根拠がない。今のところは
- `KURODA_HEADLINES.behind[12]`: 中途半端が一番よくない。強くもなく、弱くもなく、ただ足りない
- `KURODA_HEADLINES.behind[13]`: ${d.rivalName}の背中は見えていると言える。しかし追いついたとはさすがに言えない所だ。
- `KURODA_HEADLINES.behind[14]`: がんばっているのは認める。しかし、勝利に届かなければそこに価値は生まれない。
- `KURODA_HEADLINES.behind[15]`: 本紙としては、${d.rivalName}との差は「埋まる差」だと書いておく。今後に注目だ。
- `KURODA_HEADLINES.behind[16]`: 数字は嘘をつかない。差はある。だが致命的ではない。これを希望と見るか絶望と見るかは団体の代表次第だろう
- `KURODA_HEADLINES.behind[17]`: 40年見てきた中で、ここから巻き返した団体もあれば、沈んだ団体もある。${d.playerName}がどうなるかは予想がつかない。
- `KURODA_HEADLINES.behind[18]`: ${d.chaseAxisLabel}の弱さに目をつぶってきたツケが、そろそろ回ってきている
- `KURODA_HEADLINES.behind[19]`: ${d.rivalName}に学ぶべき点は多い。プライドを捨てて研究したほうが早道である

### even[]

- `KURODA_HEADLINES.even[1]`: ようやく記事にする価値が出てきた。ここからが本当の勝負だ。
- `KURODA_HEADLINES.even[2]`: 拮抗している。どちらが先にこの均衡を崩すか、少し楽しみだ
- `KURODA_HEADLINES.even[3]`: ほぼ互角の数字だ。差をつける一手を、どちらが先に打つのだろうか。
- `KURODA_HEADLINES.even[4]`: 五分五分。だが試合は数字だけで決まらない
- `KURODA_HEADLINES.even[5]`: 面白い構図になってきた。ここで差をつけられるかどうか
- `KURODA_HEADLINES.even[6]`: 数字上は対等だ。対等で終わるのか抜きんでるのか。
- `KURODA_HEADLINES.even[7]`: ${d.rivalName}とほぼ並んでいる。「並んでいる」を超えるかどうか、正念場である。
- `KURODA_HEADLINES.even[8]`: いい勝負ができる戦力にはなった。あとは結果を出すだけだ
- `KURODA_HEADLINES.even[9]`: 互角か。はたして、互角が限界となるか。
- `KURODA_HEADLINES.even[10]`: 横一線。ここから頭一つ抜けるには、何か仕掛けが要る
- `KURODA_HEADLINES.even[11]`: 差がないということは、次の一手でどちらにも転ぶということだ。怖い状況である
- `KURODA_HEADLINES.even[12]`: 並んだ。ここまで来るのに随分かかった。……ここからが本番だ。
- `KURODA_HEADLINES.even[13]`: いい意味でも悪い意味でも、予想がつかない力関係だ。取材のしがいがある
- `KURODA_HEADLINES.even[14]`: 本紙としては、ここからの一手で${d.playerName}の格が決まると書いておく
- `KURODA_HEADLINES.even[15]`: 数字は嘘をつかない。互角だ。だが、互角は通過点でしかない。誰もそこに留まりたくはないだろう
- `KURODA_HEADLINES.even[16]`: 40年見てきた中で、互角の状態は最も短命だ。早晩どちらかに傾く
- `KURODA_HEADLINES.even[17]`: ${d.rivalName}にここまで肉薄したこと自体が一つの成果だ。問題は、ここからどう抜け出すかである
- `KURODA_HEADLINES.even[18]`: ${d.leadAxisLabel}の優位がわずかにある。これを「勝っている」と取るか「危うい」と取るか、GMの読みが試される

### ahead[]

- `KURODA_HEADLINES.ahead[1]`: 悪くない。だが、このくらいで満足されても困る
- `KURODA_HEADLINES.ahead[2]`: リードしている。ただ、油断すれば一瞬で詰められる差でもある
- `KURODA_HEADLINES.ahead[3]`: ${d.rivalName}より上にいるのは確かだ。問題はそこに安住しないかどうか
- `KURODA_HEADLINES.ahead[4]`: 優勢だ。だが「優勢止まり」で終わったら何の意味もない
- `KURODA_HEADLINES.ahead[5]`: 上に立っている。この差を守る覚悟と、広げる野心、どちらもあるか
- `KURODA_HEADLINES.ahead[6]`: 実力差は出ている。ただ、慢心の匂いがしたら容赦なく書く
- `KURODA_HEADLINES.ahead[7]`: いい数字だ。素直に認める。……次もこうとは限らないが
- `KURODA_HEADLINES.ahead[8]`: ${d.rivalName}を上回っている。ちゃんとやればこれくらいできるではないか
- `KURODA_HEADLINES.ahead[9]`: 明確な優位。ただ、強者には強者の課題がある。見えているか
- `KURODA_HEADLINES.ahead[10]`: 褒めよう、今回は。ここに至るまでの過程は認める
- `KURODA_HEADLINES.ahead[11]`: 上に立つのは良い。問題は上に立ち続けることの方がずっと難しいということだ
- `KURODA_HEADLINES.ahead[12]`: ${d.rivalName}を見下ろす位置にいる。見下ろすのは自由だが、足元も見るべきだ
- `KURODA_HEADLINES.ahead[13]`: この差を作ったのは実力。この差を失うのも一瞬。それを忘れなければ大丈夫だ
- `KURODA_HEADLINES.ahead[14]`: 本紙としては、${d.playerName}の優位を素直に認める。ただし、認めっぱなしでは記者として失格なので一つだけ書いておく——慢心の二文字には常に気をつけることだ
- `KURODA_HEADLINES.ahead[15]`: 40年見てきた中で、優勢期に手を抜いて転落した団体は数えきれない。${d.playerName}がそうならない保証はどこにもない
- `KURODA_HEADLINES.ahead[16]`: 数字は嘘をつかない。${d.leadAxisLabel}の差は本物だ。問題は、その本物を維持する地味な努力ができるかどうかである
- `KURODA_HEADLINES.ahead[17]`: ${d.rivalName}を上回るのは現状の話。来季も来々季も上回り続けるには、別の覚悟が要る
- `KURODA_HEADLINES.ahead[18]`: 優勢——いい言葉だ。ただし、油断という言葉とセットでしか機能しないのが厄介である

### dominant[]

- `KURODA_HEADLINES.dominant[1]`: ……正直、ここまでやるとは思っていなかった。筆者の見る目がなかったことを、少しだけ認めざるを得ない
- `KURODA_HEADLINES.dominant[2]`: 完勝だ。もはや同じ土俵で比較するのが${d.rivalName}に気の毒である
- `KURODA_HEADLINES.dominant[3]`: 文句のつけようがない差だ。……悔しいが
- `KURODA_HEADLINES.dominant[4]`: 圧倒的だ。相手は格下と言い切っていい。問題はもっと上を見据えられるかどうか
- `KURODA_HEADLINES.dominant[5]`: ここまでの差をつけるのは簡単ではない。素直に称賛する。……一度だけだが
- `KURODA_HEADLINES.dominant[6]`: 参った。この戦力なら、誰と比較しても恥ずかしくない
- `KURODA_HEADLINES.dominant[7]`: ${d.rivalName}との比較？ もう意味がない。次はもっと上を見よう
- `KURODA_HEADLINES.dominant[8]`: 認めざるを得ない。これは筆者の予想を超えていた
- `KURODA_HEADLINES.dominant[9]`: 全項目で圧倒。ここまで来ると、心配なのはマンネリだけだ
- `KURODA_HEADLINES.dominant[10]`: 完璧に近い数字だ。……まあ「近い」と付けるのが筆者の仕事だが
- `KURODA_HEADLINES.dominant[11]`: もう何を書いても嫌味に聞こえる差だ。おめでとう。……言い慣れていないので、この辺で
- `KURODA_HEADLINES.dominant[12]`: ${d.rivalName}との比較がもはや成立しないレベルだ。次はもっと上を連れてきてほしい
- `KURODA_HEADLINES.dominant[13]`: 昔、この団体を酷評したことがある。あの記事、撤回したほうがいいか。……まだ保留にしておくが
- `KURODA_HEADLINES.dominant[14]`: 本紙としては、これ以上のリードを書く必要があるのか、と書いておく。皮肉ではなく、本気で書いている
- `KURODA_HEADLINES.dominant[15]`: 40年見てきた中で、これほど明確な格差を「比較記事」と呼んでいいのか、編集会議で議題に上がったほどだ
- `KURODA_HEADLINES.dominant[16]`: 数字は嘘をつかない。${d.rivalName}との差は、もはや努力で埋まる範疇を超えている
- `KURODA_HEADLINES.dominant[17]`: ${d.playerName}に対抗できる団体を、本紙はまだ見つけられていない。記者として、新しい仕事が要る
- `KURODA_HEADLINES.dominant[18]`: 業界の盟主と書いておく。書きすぎたら次号で訂正するが、現時点では事実だ

## `KURODA_EDITORIAL`

- 出典: `src/kuroda-text.js`
- コード内コメント: 2. 記者総評コラム（KURODA_EDITORIAL）
- 本数: 63

### devastating[]

- `KURODA_EDITORIAL.devastating[1]`: 率直に言う。今の${d.playerName}が${d.rivalName}に勝てるビジョンは一つも描けない。${d.chaseAxisLabel}の差が致命的で、${d.leadAxisLabel}でも優位を作れていない。問題が多すぎて優先順位をつけるのすら難しい状況だ。ただ、これだけは言える。底を知った者だけが見られる景色があるのだ。まず一つ、胸を張れるエースを育てるべきだろう。話はそこからだ。
- `KURODA_EDITORIAL.devastating[2]`: どこから手をつけるべきか。${d.chaseAxisLabel}は絶望的、${d.leadAxisLabel}も怪しい。率直に言えば、今の状態で比較記事を書くこと自体がおこがましいが、それが筆者の仕事である以上は書く。一つだけ救いがあるとすれば、これ以上落ちようがないということだ。あとは上がるだけ。——上がれれば、だが。
- `KURODA_EDITORIAL.devastating[3]`: ${d.rivalName}との差は歴然だ。これを「まだ追いつける」と言うのは簡単だが、根拠がない。今のところ。${d.chaseAxisLabel}で大きく水をあけられていて、しかもその差が縮まる気配がない。GMに必要なのは楽観ではなく現状認識だ。厳しいことを言っているのは分かっている。だが、甘い言葉で傷を舐め合っても戦力は上がらない。
- `KURODA_EDITORIAL.devastating[4]`: 全面的に劣勢。この一言で済ませたいが、せっかくなのでもう少し丁寧に絶望を解説する。${d.chaseAxisLabel}が壊滅的で、補強しようにも土台がない。${d.leadAxisLabel}も平凡。長期戦略で巻き返すしかないが、その「長期」を耐えるファンがいるかどうかが問題だ。
- `KURODA_EDITORIAL.devastating[5]`: 何から褒めればいいのか分からない状態だ。いや、褒めるところがないという意味ではなく……いや、ない。正直なところ。${d.rivalName}との比較で唯一言えるのは、伸びしろが大きいということ。裏を返せば、今が底だということだが。ここから這い上がる覚悟があるなら、付き合おう。記事のネタにはなる。
- `KURODA_EDITORIAL.devastating[6]`: 厳しい現実を突きつける。${d.chaseAxisLabel}は論外、${d.leadAxisLabel}も水準以下。ファンには申し訳ないが、今季の${d.rivalName}との差は構造的な問題だ。GMの采配とか戦術とか、そういう次元の話ではない。足りないのはもっと根本的なもの——戦力そのものだ。
- `KURODA_EDITORIAL.devastating[7]`: ここまで差がつくと、もう戦力分析とか戦略論とか、そういう段階ではない。もっと根本的な問題——選手が足りない、育成が追いついてない、そもそも勝つためのビジョンが見えない。${d.rivalName}との差を数字で見るたびに溜息が出るが、溜息をついている場合でもないだろう。一つだけ問いたい。このままでいいのか。
- `KURODA_EDITORIAL.devastating[8]`: 辛辣なことを書く。今の${d.playerName}は、${d.rivalName}にとって脅威でも何でもない。向こうはこちらの存在すら意識していないだろう。${d.chaseAxisLabel}の差は致命的、${d.leadAxisLabel}も相手に及ばない。ただ、脅威でないということは、逆に自由でもある。失うものがない時期に何を積めるか。それが全てだ。
- `KURODA_EDITORIAL.devastating[9]`: 数字を並べるのが辛い記事だ。${d.chaseAxisLabel}が壊滅的なのは言うまでもなく、${d.leadAxisLabel}すら苦しい。ファンが離れないうちに手を打たないと、本当に取り返しがつかなくなる。——まあ、筆者が心配する義理もないのだが。なぜか心配している。記者として、ではなく。
- `KURODA_EDITORIAL.devastating[10]`: もし筆者がこの団体のGMだったら、と考えることがある。まず${d.chaseAxisLabel}を何とかして、次に${d.leadAxisLabel}を伸ばして……いや、やめよう。考えるだけで胃が痛くなる。ただ一つ、確実に言えることがある。今この底を経験していることが、いつか財産になるかもしれない。なるといい。保証はしないが。
- `KURODA_EDITORIAL.devastating[11]`: 本紙としては、${d.playerName}の現状を「過渡期」と呼ぶのは甘いと書いておく。過渡期というのは抜け出す気がある者が使う言葉だ。${d.chaseAxisLabel}の壊滅、${d.leadAxisLabel}の凡庸——抜け出す意志があるのか、まずそこから疑わしい。${d.rivalName}との差は、もはや戦力差ではなく姿勢の差にも見える。40年見てきた中で、底にいる団体は二種類しかない。底から這い上がる団体と、底に居着く団体。${d.playerName}がどちらかは、来季の動きを見れば分かるだろう。
- `KURODA_EDITORIAL.devastating[12]`: 数字は嘘をつかない。${d.chaseAxisLabel}が壊滅、${d.leadAxisLabel}も水準以下。${d.rivalName}と並べるのが失礼に思えるレベルだ。だが、嘘をつかない数字には、もう一つ意味がある——ここから上を目指す全ての一歩が、必ず数字に反映されるということだ。今の${d.playerName}に必要なのは劇的な逆転ではなく、地味な一歩を積み重ねる覚悟である。一年では無理。二年でも怪しい。三年計画で動けるか、それが分水嶺だ。
- `KURODA_EDITORIAL.devastating[13]`: 40年見てきた中で、最下位の団体ほど「奇策」に走りがちだ。注目選手を引き抜く、派手な興行を打つ、既存路線を全否定する。${d.playerName}にその気配があるなら、本紙は止めたい。${d.chaseAxisLabel}を地道に底上げし、${d.leadAxisLabel}でわずかな光を見つけ、それを丁寧に育てる——退屈に思えるが、これしか道はない。${d.rivalName}との差は奇策では埋まらない。むしろ広がる。歴史がそれを証明している。
- `KURODA_EDITORIAL.devastating[14]`: ${d.playerName}を擁護する記事は書けない。${d.chaseAxisLabel}が論外、${d.leadAxisLabel}も褒められた数字ではない。だが、批判だけして終わるのも記者の仕事ではない。一つだけ提案する——${d.rivalName}の弱点を徹底研究することだ。トップ団体にも穴はある。その穴を狙えば、まぐれの一勝くらいは拾えるかもしれない。まぐれでも勝ちは勝ち。そこから何かが始まる可能性は、ゼロではない。本紙はそう書いておく
- `KURODA_EDITORIAL.devastating[15]`: この団体に未来があるのか、本紙にも分からない。${d.chaseAxisLabel}は崩壊状態、${d.leadAxisLabel}も光が見えない。ただ一つだけ、過去にも似た状況から這い上がった団体はあった。共通していたのは、現状を直視する力と、長期計画を貫く忍耐力だ。${d.playerName}にそれがあるかどうか——記者として、見届けたいとは思っている。期待しているとは言わないが

### behind[]

- `KURODA_EDITORIAL.behind[1]`: ${d.rivalName}との差は確かにある。ただ、絶望的かと言われれば、まだそこまでではない。${d.leadAxisLabel}に活路があるなら、そこを徹底的に伸ばすのが最短ルートだ。問題は${d.chaseAxisLabel}の弱さ。ここを放置したまま他で勝負しようとしても、足を引っ張られるだろう。
- `KURODA_EDITORIAL.behind[2]`: 課題は明確だ。${d.chaseAxisLabel}で後れを取っていて、これが全体の足を引っ張っている。${d.leadAxisLabel}は悪くないので、ここを軸に組み立て直す手はある。ただ、「手はある」と「やれる」は別物だ。
- `KURODA_EDITORIAL.behind[3]`: ${d.rivalName}を相手に真っ向勝負を挑むのは得策ではない。それは弱気ではなく戦略だ。${d.leadAxisLabel}で食い下がりつつ、${d.chaseAxisLabel}を地道に底上げするしかない。派手さはないが、今の戦力で派手なことを言われても困る。
- `KURODA_EDITORIAL.behind[4]`: 差がある。それは認める。だが、差があるからこそ取れる戦略もある。${d.leadAxisLabel}を武器に一点突破を狙うか、${d.chaseAxisLabel}を補強して底上げを図るか。どちらを選ぶかがGMの仕事だ。両方やろうとして中途半端になるのが最悪のパターンである。
- `KURODA_EDITORIAL.behind[5]`: ${d.rivalName}に追いつくまでの道のりは長い。だが、見込みがゼロなら記事にしない。${d.leadAxisLabel}にはまだ可能性がある。ここを起点に全体を引き上げられるかどうか。——あまり期待はしていないが、一応見守る。
- `KURODA_EDITORIAL.behind[6]`: 弱点の${d.chaseAxisLabel}から目を逸らしても何も変わらない。${d.rivalName}はそこを容赦なく突いてくるはずだ。逆に${d.leadAxisLabel}が強みなら、それを活かす編成を考えるべきだろう。攻めと守りを同時に考えないと、このクラスの相手には通用しない。
- `KURODA_EDITORIAL.behind[7]`: ${d.rivalName}との差は縮まりつつある。——と書きたいところだが、データを見る限りそうとも言い切れない。${d.leadAxisLabel}では健闘しているが、${d.chaseAxisLabel}が足を引っ張っている。一歩進んで半歩戻る、を繰り返している印象だ。もう少し思い切った手を打てないものだろうか。
- `KURODA_EDITORIAL.behind[8]`: 正面突破は無理だ。それは認めよう。${d.rivalName}と同じ土俵で真っ向勝負したら負けるのは目に見えている。だったら土俵を変えるしかない。${d.leadAxisLabel}を徹底的に磨いて、そこだけは絶対に負けない状態を作る。勝負はそこからだ。全部を追いかけるから全部が中途半端になるのである。
- `KURODA_EDITORIAL.behind[9]`: ${d.chaseAxisLabel}の弱さをいつまで放置するつもりなのか。${d.leadAxisLabel}で何とか食い下がっているが、それも限界に近い。次の補強で的確な手を打てるかどうかが分水嶺だ。外したら、次に追いつくチャンスがいつ来るか分からない。
- `KURODA_EDITORIAL.behind[10]`: 追いかける立場は嫌なものだろう。だが、追いかける側には追いかける側のメリットがある。相手の手を見てから動ける。失敗から学べる。${d.rivalName}の強みと弱みが見えているなら、それをどう活かすか。受け身のままでは永遠に追いかけっこだ。
- `KURODA_EDITORIAL.behind[11]`: 本紙としては、${d.playerName}は分岐点に立っていると書いておく。${d.leadAxisLabel}にわずかな希望、${d.chaseAxisLabel}に大きな課題——どちらに賭けるかで未来が変わる。両取りを狙えば共倒れだ。それが40年見てきた中での結論である。一点に絞れ。${d.rivalName}が${d.leadAxisLabel}で対策を打ってくる前に、そこを尖らせきれるか。GMの肚が試される局面だ
- `KURODA_EDITORIAL.behind[12]`: 数字は嘘をつかない。${d.chaseAxisLabel}での負け、${d.leadAxisLabel}での僅差——この組み合わせは「追いつけそうで追いつけない」状態の典型だ。${d.rivalName}を追う立場で一番怖いのは、半歩ずつ前進しているつもりで、実は同じ速度で前進している相手にじわじわ離されるパターンである。本紙はそれを過去に何度も見てきた
- `KURODA_EDITORIAL.behind[13]`: 40年やってきたが、追走する団体に必要なのは焦りではなく我慢だ。${d.playerName}は今、焦り始めている気配がある。${d.chaseAxisLabel}を一気に解決しようとして無理な補強に走る——そのパターンが一番こじれる。${d.rivalName}との差は急に縮まらない。地道に、しかし確実に詰めること。退屈な答えだが、それが正解である
- `KURODA_EDITORIAL.behind[14]`: ${d.playerName}には地力がある。${d.leadAxisLabel}の数字がそれを示している。問題は地力の使い方だ。${d.rivalName}と同じ土俵で戦えば、戦力差で押し切られる。土俵を変える発想が要る。「うちの強み」と「相手の弱み」が交わる一点で勝負することだ。本紙はそう書いておく
- `KURODA_EDITORIAL.behind[15]`: ${d.rivalName}との差は精神的な要素も大きい。負け癖が染み付いた団体は、勝てる試合も勝てなくなる。${d.playerName}にその兆候があるなら、まず一勝することだ。相手はどこでもいい。勝つ感覚を取り戻すことが、戦術論より先に必要なステップである

### even[]

- `KURODA_EDITORIAL.even[1]`: 面白い構図になってきた。数字上は五分五分。ただ、試合は数字だけでは決まらない。${d.leadAxisLabel}でこちらがやや上。この優位をどう活かすかがGMの腕の見せ所だ。${d.rivalName}の${d.chaseAxisLabel}が伸びてくる前に、差をつけておきたいところである。
- `KURODA_EDITORIAL.even[2]`: 互角。この言葉を良いニュースと取るか、物足りないと取るか。${d.playerName}の立場なら後者であってほしいが。${d.leadAxisLabel}は悪くない。${d.chaseAxisLabel}も致命的ではない。あとは何か一つ、決定的な武器を作れるかどうかだ。
- `KURODA_EDITORIAL.even[3]`: 拮抗している。こういう状況が一番面白いし、一番怖い。ちょっとした判断ミスが致命傷になるからだ。${d.leadAxisLabel}の優位を維持しつつ、${d.chaseAxisLabel}の差を詰める。言うのは簡単だが、実際にやるのは別の話である。
- `KURODA_EDITORIAL.even[4]`: どちらに転んでもおかしくない戦力差だ。率直に言って、どちらが上に抜けるか筆者にも読めない。${d.leadAxisLabel}ではこちらに分があるが、${d.rivalName}も黙って見ているわけではないだろう。ここからの数週間が勝負だ。
- `KURODA_EDITORIAL.even[5]`: 均衡状態。見方を変えれば、ここから先は純粋にGMの差が出るということだ。戦力が互角なら、勝敗を分けるのは戦略と育成。${d.leadAxisLabel}を伸ばすか、${d.chaseAxisLabel}を補強するか。どちらを選んでもリスクはある。
- `KURODA_EDITORIAL.even[6]`: ようやく「比較」と呼べる水準になった。以前は比較というより確認作業だったからだ。${d.leadAxisLabel}に小さなリードがある今、この差を広げるのか、それとも追いつかれるのか。筆者としてはどちらでも記事になるので構わないが。
- `KURODA_EDITORIAL.even[7]`: 本紙としては、互角は通過点だと書いておく。${d.playerName}と${d.rivalName}の戦力は数字上ほぼ並んだ——だが、ここで止まるなら、そもそも並ぶ意味がなかった。次の半年でどちらかが頭一つ抜ける。それは確実だ。問題は、抜けるのがどちらか、である。${d.leadAxisLabel}のわずかな優位を維持しつつ、${d.chaseAxisLabel}で一手打てるか。GMの真価が問われる局面だ
- `KURODA_EDITORIAL.even[8]`: 40年見てきた中で、互角の状態は最も危険な時期でもある。${d.playerName}は安心してはいけない。並んだ瞬間に油断すれば、次の比較記事では再び「behind」と書くことになる。${d.rivalName}が黙っているはずがない——必ず手を打ってくる。先手を取れるかどうかが分水嶺だ
- `KURODA_EDITORIAL.even[9]`: 数字は嘘をつかない。互角だ。${d.leadAxisLabel}でわずかにリード、${d.chaseAxisLabel}で僅差。だが、こういう時こそ「決定打」が要る。「ほぼ五分」を「明確に上」に変える一手——それが何なのか、GM室で議論されているといいのだが
- `KURODA_EDITORIAL.even[10]`: ${d.playerName}と${d.rivalName}は、いま同じ高度を飛んでいる。だが片方は上昇気流、もう片方は下降気流に乗っているかもしれない。それを見極めるのも比較記事の仕事だ。本紙としては、現時点での結論は保留にしておく。次号で答えを出す
- `KURODA_EDITORIAL.even[11]`: 互角は実力差ではなく、運の差で決着がつく領域だ。${d.playerName}にとっては運を引き寄せる準備が整っているか、という問いが問われる。チャンスを逃さない選手起用、攻めの興行——これらが揃っていれば、互角は優勢に変わる

### ahead[]

- `KURODA_EDITORIAL.ahead[1]`: リードしている。これは素直に認める。${d.leadAxisLabel}の差が効いていて、全体として安定感がある。ただ、${d.chaseAxisLabel}がまだ甘いのは気になる。この弱点を突かれたらリードなど一瞬で消えるだろう。
- `KURODA_EDITORIAL.ahead[2]`: ${d.rivalName}を上回っているのは確かだ。まあ、ちゃんとやればこれくらいできるのではないか。${d.leadAxisLabel}の充実ぶりは評価できる。次は${d.chaseAxisLabel}を底上げして、死角をなくすフェーズだろう。
- `KURODA_EDITORIAL.ahead[3]`: 優勢だ。ここまで来るのに時間がかかったが、結果は出ている。${d.leadAxisLabel}が武器として機能していて、${d.chaseAxisLabel}も壊滅的ではない。あとはこの差を維持する覚悟があるかどうかだ。強い時期は長くは続かない。
- `KURODA_EDITORIAL.ahead[4]`: いい数字だ。${d.rivalName}との比較で明確に上に立っている。ただ、ここで慢心すると痛い目を見る。${d.chaseAxisLabel}にまだ改善の余地があるのは見えているのだから、手を緩めるべきではない。
- `KURODA_EDITORIAL.ahead[5]`: ${d.leadAxisLabel}で${d.rivalName}を突き放しているのは大きい。これは一朝一夕では真似できない差だ。ただ、強者には強者の悩みがある。看板への依存度、次世代の育成、マンネリ防止。全て順調な今だからこそ、次の壁を見据えるべきだろう。
- `KURODA_EDITORIAL.ahead[6]`: 褒めよう。今回は。${d.leadAxisLabel}を中心に総合力で上回っていて、スキも少ない。——ただ「完璧」とは言わない。${d.chaseAxisLabel}を詰められたら一気に肉薄されるリスクは消えていないからだ。
- `KURODA_EDITORIAL.ahead[7]`: 本紙としては、${d.playerName}の優勢は本物だと書いておく。${d.leadAxisLabel}の充実、${d.chaseAxisLabel}の安定——${d.rivalName}を上回る要素が複数ある。問題は、優勢期に何を仕込めるかだ。40年見てきた中で、強い時期に次の柱を育てなかった団体は、エースの衰えと同時に転落していく。今こそ次世代に投資すべき時である。短期の勝利と長期の繁栄は別物だ
- `KURODA_EDITORIAL.ahead[8]`: 数字は嘘をつかない。${d.rivalName}との差は明確だ。${d.leadAxisLabel}での優位が定着してきた。だが、優勢期の罠は「同じ戦略を続けすぎる」ことにある。今勝てている方法が、来季も勝てるとは限らない。${d.rivalName}は必ず研究してくる。先回りして変化できるかが、リードを維持する鍵だ
- `KURODA_EDITORIAL.ahead[9]`: 40年見てきた中で、優勢期に飽きが来る選手が出る。${d.playerName}にもその兆候はないか。エースのモチベーション、中堅のハングリーさ——強い団体ほどこれが鈍る。${d.rivalName}との差を保つには、内部の緊張感を維持することが何より重要だ
- `KURODA_EDITORIAL.ahead[10]`: ${d.playerName}は明確に上にいる。だが、上に立つ者の責任もある。業界全体を引っ張る役割だ。${d.rivalName}との比較で勝つだけでなく、業界全体の質を上げる興行を打てるか。それが「強い団体」と「業界の盟主」の差である。本紙はそこまで期待している
- `KURODA_EDITORIAL.ahead[11]`: 優勢——いい状態だ。だが油断するなとも書いておく。${d.chaseAxisLabel}にまだ伸びしろがあるのは事実で、ここを放置するといずれ${d.rivalName}に詰められる。完璧な団体などないが、完璧を目指す姿勢は持ち続けるべきだ

### dominant[]

- `KURODA_EDITORIAL.dominant[1]`: これだけの差をつけて、まだ油断するなとは言わない。だが、強すぎる組織には別の問題が出てくるものだ。マンネリ、慢心、次世代不足。${d.leadAxisLabel}も${d.chaseAxisLabel}も文句なしの今、考えるべきは「この先何年維持できるか」である。
- `KURODA_EDITORIAL.dominant[2]`: 圧倒的だ。${d.rivalName}がどう足掻いても、今季中にこの差は埋まらないだろう。——正直、ここまでやるとは思っていなかった。取材者として不明を恥じる。ほんの少しだけだが。
- `KURODA_EDITORIAL.dominant[3]`: 全項目で優位。比較記事を書く意味があるのか、筆者自身が疑問に思うレベルだ。${d.rivalName}は完全に格下。問題はこの先、${d.playerName}が本当に目指すべき場所がどこなのか、ということである。もっと上を見ていい。
- `KURODA_EDITORIAL.dominant[4]`: 認める。文句なしの強さだ。${d.leadAxisLabel}は業界トップクラス、${d.chaseAxisLabel}まで穴がない。ここまでの過程を思えば……まあ、よくやった。一度だけ、素直にそう言う。
- `KURODA_EDITORIAL.dominant[5]`: 比較対象が${d.rivalName}では失礼に思えるくらいの差だ。かつてこの団体を「記事にする価値もない」と書いた覚えがあるが……結果的に、最も長く書き続けることになった。なかなか興味深い展開である。
- `KURODA_EDITORIAL.dominant[6]`: もう突っ込むところがない。${d.leadAxisLabel}は鉄壁、${d.chaseAxisLabel}も盤石。ファンは存分に胸を張っていい。——ただ、筆者が手放しで褒めると不吉なのだ。気をつけてほしい。
- `KURODA_EDITORIAL.dominant[7]`: 本紙としては、${d.playerName}は業界の盟主だと書いておく。${d.leadAxisLabel}は他団体の追随を許さず、${d.chaseAxisLabel}にも穴がない。${d.rivalName}を含めて、対抗できる団体は当面見当たらない。だが、盟主には盟主の悩みがある——切磋琢磨の相手不足だ。強敵がいないと選手は伸び悩む。マンネリ化、緩み、停滞。これらが忍び寄る前に手を打てるか。40年見てきた中で、最強の団体ほど転落が早い。それは敵がいないことの代償だ。本紙は警鐘を鳴らす意味で、この事実を書いておく
- `KURODA_EDITORIAL.dominant[8]`: 40年やってきたが、これほど一方的な比較記事は珍しい。${d.rivalName}が${d.playerName}に並ぶ日が来るのか——本紙の答えは「来ない」だ。少なくともこの数年は。だが、業界の盟主に求められるのは勝ち続けることだけではない。新しいファンを呼び込み、業界全体のパイを広げる役割もある。それができなければ、強さは虚しい
- `KURODA_EDITORIAL.dominant[9]`: 数字は嘘をつかない。全項目で${d.rivalName}を圧倒。比較対象を変えるべきレベルだ。だが、本紙としては${d.playerName}に一つだけ警告しておく——「もう敵はいない」と思った瞬間、敵は内部に生まれる。慢心、世代交代の遅れ、育成方針の硬直化。盟主の最大の敵は、いつも自分自身だ
- `KURODA_EDITORIAL.dominant[10]`: ${d.playerName}は別格の存在だ。${d.leadAxisLabel}も${d.chaseAxisLabel}も、業界のベンチマークになっている。本紙としては素直に評価する。問題はここから先だ。「より強くなる」だけでなく「より深くなる」必要がある。試合の質、ストーリー性、選手の人間性——数字では測れない要素を磨くフェーズに入っている
- `KURODA_EDITORIAL.dominant[11]`: 業界には盟主が必要だ。${d.playerName}はその役割を見事に果たしている。${d.rivalName}との差は構造的なもので、ちょっとやそっとでは埋まらない。本紙としては、この差を維持するだけでは物足りない、と書いておく。世界に通用する団体を目指すフェーズに入っているはずだ

## `KURODA_WAR_RECORD`

- 出典: `src/kuroda-text.js`
- コード内コメント: 3. 戦績コメント（KURODA_WAR_RECORD）
- 本数: 63

### noRecord[]

- `KURODA_WAR_RECORD.noRecord[1]`: ${d.rivalName}との直接対決はまだない。数字がない以上、語れることは限られる
- `KURODA_WAR_RECORD.noRecord[2]`: 対戦記録なし。まだ何も始まっていないとも言えるし、始める資格がなかったとも言える
- `KURODA_WAR_RECORD.noRecord[3]`: 直接対決ゼロ。つまり、全てはこれから。まあ、怖いもの知らずとも言うが
- `KURODA_WAR_RECORD.noRecord[4]`: まだ${d.rivalName}とは一度も拳を交えていない。それが幸運なのか不幸なのかは、これから分かるだろう
- `KURODA_WAR_RECORD.noRecord[5]`: 対戦記録ゼロ。つまり、向こうもこちらの実力を知らない。初戦は情報戦になる
- `KURODA_WAR_RECORD.noRecord[6]`: ${d.rivalName}との直接対決がないということは、正確な力関係は推測でしかないということだ。数字だけで語るには限界がある
- `KURODA_WAR_RECORD.noRecord[7]`: 戦績がない分、語れることは少ないが、だからこそ最初の一戦が大事なのだ。第一印象で格付けが決まる

### heavyLosing[]

- `KURODA_WAR_RECORD.heavyLosing[1]`: 通算${d.wins}勝${d.losses}敗。これを善戦と呼ぶ神経が、もう負け犬の証拠だろう
- `KURODA_WAR_RECORD.heavyLosing[2]`: ${d.wins}勝${d.losses}敗。数字が全てを物語っている。言葉は要らない
- `KURODA_WAR_RECORD.heavyLosing[3]`: ${d.rivalName}に通算${d.wins}勝${d.losses}敗。いつになったら勝てるのだろうか
- `KURODA_WAR_RECORD.heavyLosing[4]`: ${d.losses}敗のうち、何敗が「惜しかった」のか。——まあ、聞くだけ無駄だが
- `KURODA_WAR_RECORD.heavyLosing[5]`: 通算${d.wins}勝${d.losses}敗。唯一の勝利がまぐれでないことを証明する機会すら来ていない
- `KURODA_WAR_RECORD.heavyLosing[6]`: この成績で${d.rivalName}との比較を見に来るのか。メンタルの強さだけは認める
- `KURODA_WAR_RECORD.heavyLosing[7]`: ${d.wins}勝${d.losses}敗。負け慣れるのだけは上手くなった
- `KURODA_WAR_RECORD.heavyLosing[8]`: 直接対決で${d.losses}敗。もはや${d.rivalName}のサンドバッグと呼ばれても反論できないだろう

### slightLosing[]

- `KURODA_WAR_RECORD.slightLosing[1]`: 通算${d.wins}勝${d.losses}敗。惜しいようで惜しくない、絶妙に足りない成績だ
- `KURODA_WAR_RECORD.slightLosing[2]`: ${d.wins}勝${d.losses}敗。あと一歩が遠い。この団体の場合は特に
- `KURODA_WAR_RECORD.slightLosing[3]`: 負け越している。僅差とは言わないが、追いつけない差でもない。問題は実際に追いつく意志があるかどうかだ
- `KURODA_WAR_RECORD.slightLosing[4]`: ${d.rivalName}に${d.wins}勝${d.losses}敗。勝てない相手ではないのに勝ち越せない。歯がゆい
- `KURODA_WAR_RECORD.slightLosing[5]`: 通算で負け越し。だが、内容が伴ってきているのは認める。——結果が伴っていないだけで
- `KURODA_WAR_RECORD.slightLosing[6]`: ${d.wins}勝${d.losses}敗。あと一つ勝てば互角に持ち込めるのに、その一つが遠い

### evenRecord[]

- `KURODA_WAR_RECORD.evenRecord[1]`: 通算${d.wins}勝${d.losses}敗。互角の成績だ。面白くなってきた
- `KURODA_WAR_RECORD.evenRecord[2]`: ${d.wins}勝${d.losses}敗。いい勝負をしている。ここからどちらに傾くか
- `KURODA_WAR_RECORD.evenRecord[3]`: 五分の戦績。つまり次の直接対決が流れを決めるということだ
- `KURODA_WAR_RECORD.evenRecord[4]`: ${d.rivalName}と互角。これを誇ると思うか、物足りないと思うかで器が分かる
- `KURODA_WAR_RECORD.evenRecord[5]`: 通算イーブン。まあ、悪くはない。「悪くない」止まりだが
- `KURODA_WAR_RECORD.evenRecord[6]`: ${d.wins}勝${d.losses}敗。並んでいるうちはまだいい。問題はここから抜け出せるかどうかだ
- `KURODA_WAR_RECORD.evenRecord[7]`: 通算${d.wins}勝${d.losses}敗——本紙はここを「分岐点」と書いておく。次の一勝で流れが決まる
- `KURODA_WAR_RECORD.evenRecord[8]`: 数字は嘘をつかない。${d.wins}勝${d.losses}敗の互角。実力差ではなく相性差だが、相性も実力のうちだ
- `KURODA_WAR_RECORD.evenRecord[9]`: 40年見てきた中で、五分の対戦成績が長続きするケースは少ない。${d.rivalName}との関係も、いずれどちらかに傾く

### slightWinning[]

- `KURODA_WAR_RECORD.slightWinning[1]`: 通算${d.wins}勝${d.losses}敗。勝ち越している。自信を持っていい数字だ
- `KURODA_WAR_RECORD.slightWinning[2]`: ${d.rivalName}に${d.wins}勝${d.losses}敗。対戦成績は味方だ。あとは中身の質を上げるだけ
- `KURODA_WAR_RECORD.slightWinning[3]`: 勝ち越し。素直に評価する。ただ、圧勝とは言えない差なのも事実だが
- `KURODA_WAR_RECORD.slightWinning[4]`: ${d.wins}勝${d.losses}敗。悪くないどころか、良い。——珍しく褒めたものだ
- `KURODA_WAR_RECORD.slightWinning[5]`: 通算で上回っている。ここまで来るのに苦労したのは知っている。ちゃんと見ていたからだ
- `KURODA_WAR_RECORD.slightWinning[6]`: ${d.rivalName}に勝ち越し。相性がいいのか、実力なのか。次でハッキリする

### heavyWinning[]

- `KURODA_WAR_RECORD.heavyWinning[1]`: 通算${d.wins}勝${d.losses}敗。もう${d.rivalName}はカモと言っていい。失礼だが事実だ
- `KURODA_WAR_RECORD.heavyWinning[2]`: ${d.wins}勝${d.losses}敗。ここまで一方的だと、${d.rivalName}側のファンに同情する
- `KURODA_WAR_RECORD.heavyWinning[3]`: 対戦成績で圧倒している。まあ、これだけ勝っていれば当然の自信だろう
- `KURODA_WAR_RECORD.heavyWinning[4]`: 通算${d.wins}勝${d.losses}敗。もはや比較というより結果報告だ
- `KURODA_WAR_RECORD.heavyWinning[5]`: ${d.rivalName}に負ける気がしない、という気持ちは分かる。ただ、そういう時が一番危ないのだが
- `KURODA_WAR_RECORD.heavyWinning[6]`: 圧倒的な対戦成績。ここまでの道のりを思えば、感慨深いものがある。——筆者が言うのも変だが

### winStreak[]

- `KURODA_WAR_RECORD.winStreak[1]`: 現在${d.streak}連勝中。勢いがある。止まらないうちに畳みかけたいところだ
- `KURODA_WAR_RECORD.winStreak[2]`: ${d.streak}連勝。${d.rivalName}にとっては嫌な流れだろう。このまま止まらないでほしい
- `KURODA_WAR_RECORD.winStreak[3]`: 連勝中か。調子に乗らないでほしいが。——まあ、乗っていい成績ではある
- `KURODA_WAR_RECORD.winStreak[4]`: ${d.streak}連勝。もう${d.rivalName}からすれば鬼門だろう
- `KURODA_WAR_RECORD.winStreak[5]`: ${d.streak}連勝中だ。連勝が途切れるときは大体油断しているときなので、気を引き締めるべきだろう
- `KURODA_WAR_RECORD.winStreak[6]`: これで${d.streak}連勝。もはや相性の問題ではなく、純粋な実力差が出始めている
- `KURODA_WAR_RECORD.winStreak[7]`: ${d.streak}連勝。記録は気持ちいいだろうが、次も勝つ保証はどこにもない
- `KURODA_WAR_RECORD.winStreak[8]`: ${d.streak}連勝中。本紙としては、${d.rivalName}の対策が遅れていると書いておく。あちらも黙ってはいないだろうが
- `KURODA_WAR_RECORD.winStreak[9]`: 数字は嘘をつかない。${d.streak}連勝は実力か運か——半分ずつ、と本紙は見ている
- `KURODA_WAR_RECORD.winStreak[10]`: 40年見てきた中で、連勝中ほど次の一敗が痛い。${d.streak}連勝は誇りつつ、警戒も怠るべきではない

### loseStreak[]

- `KURODA_WAR_RECORD.loseStreak[1]`: 現在${Math.abs(d.streak)}連敗中。そろそろ真剣に原因を考えたほうがいい
- `KURODA_WAR_RECORD.loseStreak[2]`: ${Math.abs(d.streak)}連敗。勝てない相手に何度挑んでも結果は同じだ。アプローチを変えるべきだろう
- `KURODA_WAR_RECORD.loseStreak[3]`: 連敗が止まらない。ファンの期待はとっくに冷めている
- `KURODA_WAR_RECORD.loseStreak[4]`: ${Math.abs(d.streak)}連敗中。もう驚かなくなってきたのが一番怖いところだ
- `KURODA_WAR_RECORD.loseStreak[5]`: ${Math.abs(d.streak)}連敗。そろそろ「次こそは」以外の言葉が聞きたいものだが
- `KURODA_WAR_RECORD.loseStreak[6]`: ${Math.abs(d.streak)}回連続で負けている。同じやり方で同じ相手に勝てると思っているのだろうか
- `KURODA_WAR_RECORD.loseStreak[7]`: 連敗記録更新中だ。不名誉な記録だけは順調に伸びている
- `KURODA_WAR_RECORD.loseStreak[8]`: ${Math.abs(d.streak)}連敗。もう対策とか分析とかではなく、根本的に何かを変えないと
- `KURODA_WAR_RECORD.loseStreak[9]`: ${Math.abs(d.streak)}連敗中。本紙としては、もう「相性」では片付けられない数字だと書いておく
- `KURODA_WAR_RECORD.loseStreak[10]`: 数字は嘘をつかない。${Math.abs(d.streak)}連敗は実力差の証明だ。認めることから始めるべきだろう
- `KURODA_WAR_RECORD.loseStreak[11]`: 40年見てきた中で、連敗を断つには劇薬が要ることが多い。${d.playerName}にその覚悟があるか、問われている

## `KURODA_SHOW_RATING`

- 出典: `src/kuroda-text.js`
- コード内コメント: 7. 興行総合評価コメント（KURODA_SHOW_RATING）
- 本数: 36

### stars5[]

- `KURODA_SHOW_RATING.stars5[1]`: 歴史的な大会だった。この規模の団体で、ここまでの試合を並べるとは。率直に言って、脱帽だ
- `KURODA_SHOW_RATING.stars5[2]`: 全試合が水準を大きく超えていた。今シーズンのベスト興行と言い切っていいだろう
- `KURODA_SHOW_RATING.stars5[3]`: 完璧に近い興行。ケチをつける箇所が見当たらない。——それが一番悔しいのだが
- `KURODA_SHOW_RATING.stars5[4]`: 記者生活を通じても、なかなかお目にかかれないレベルの大会だ。お見事
- `KURODA_SHOW_RATING.stars5[5]`: 参った。これ以上の言葉は必要ない

### stars4[]

- `KURODA_SHOW_RATING.stars4[1]`: 素晴らしい興行だった。いくつかのカードは年間ベストバウト候補だ
- `KURODA_SHOW_RATING.stars4[2]`: 期待を上回る内容。${d.playerName}のファンは胸を張っていい
- `KURODA_SHOW_RATING.stars4[3]`: 良い興行だ。カード編成とコンディション管理が噛み合った結果だろう
- `KURODA_SHOW_RATING.stars4[4]`: ほぼ満点の出来。あと一歩で完璧だったが、十分誇れる内容だ
- `KURODA_SHOW_RATING.stars4[5]`: ファンの満足度は高かったはずだ。こういう興行を続けてほしい

### stars3[]

- `KURODA_SHOW_RATING.stars3[1]`: 期待通りの興行だ。大きな不満はないが、飛び抜けた試合もなかった
- `KURODA_SHOW_RATING.stars3[2]`: 水準は満たしている。ただ「普通に良い」で満足していいかどうかは別の話だ
- `KURODA_SHOW_RATING.stars3[3]`: 無難な出来。まあ、無難に回せること自体が実力の証ではあるが
- `KURODA_SHOW_RATING.stars3[4]`: 良くも悪くも安定した興行。もう一段上を目指すなら、何か仕掛けが要る
- `KURODA_SHOW_RATING.stars3[5]`: 合格点だ。ただ、合格点は褒め言葉には聞こえないだろう
- `KURODA_SHOW_RATING.stars3[6]`: 可もなく不可もなく、というのが率直な感想だ。だが安定した興行を続けること自体に価値はある
- `KURODA_SHOW_RATING.stars3[7]`: 及第点だ。ただ、及第点を続けても上には行けない。どこかで殻を破る必要がある
- `KURODA_SHOW_RATING.stars3[8]`: 普通にいい興行だった。「普通にいい」が最高評価にならないことを祈っているが

### stars2[]

- `KURODA_SHOW_RATING.stars2[1]`: 期待をやや下回った。全体的に噛み合わなかった印象だ
- `KURODA_SHOW_RATING.stars2[2]`: もう一歩の興行だった。ファンは「惜しかった」と思ってくれているだろうが、筆者はそうは思わない
- `KURODA_SHOW_RATING.stars2[3]`: 物足りない内容だ。カード編成に工夫が足りなかったのではないか
- `KURODA_SHOW_RATING.stars2[4]`: 伸び悩みを感じる興行。このまま中途半端な大会を続けるのは危険だ
- `KURODA_SHOW_RATING.stars2[5]`: 悪くはないが、良くもない。一番困る評価である
- `KURODA_SHOW_RATING.stars2[6]`: 全体的に噛み合わなかった。個々の選手は悪くないのに、興行としてまとまりがなかった
- `KURODA_SHOW_RATING.stars2[7]`: ファンが帰り道で何を話すか考えてみてほしい。今日の興行で話題になるカード、あっただろうか
- `KURODA_SHOW_RATING.stars2[8]`: 期待値の設定を間違えたのではないか。カード編成が甘い

### stars1[]

- `KURODA_SHOW_RATING.stars1[1]`: 厳しい評価をつけざるを得ない。期待を大きく下回った
- `KURODA_SHOW_RATING.stars1[2]`: 率直に言って、途中で席を立ちたくなった。記者でなかったら立っている
- `KURODA_SHOW_RATING.stars1[3]`: ファンに申し訳が立つ内容だっただろうか。筆者にはそうは見えなかったが
- `KURODA_SHOW_RATING.stars1[4]`: 今日の興行代、返してほしいというファンの気持ちは理解できる
- `KURODA_SHOW_RATING.stars1[5]`: 課題だらけの大会。次こそは、と言い続けるのもそろそろ限界だ

### stars0[]

- `KURODA_SHOW_RATING.stars0[1]`: 論外だ。これを興行と呼ぶのは、業界全体への冒涜である
- `KURODA_SHOW_RATING.stars0[2]`: ファンの怒号が聞こえてきそうな内容。弁解の余地なしだ
- `KURODA_SHOW_RATING.stars0[3]`: 率直に言えば、記事にする価値があるのか迷った。プロとして、一応書くが
- `KURODA_SHOW_RATING.stars0[4]`: 全カードが空回り。GMは今夜眠れないのではないか。眠れるなら、それはそれで問題だが
- `KURODA_SHOW_RATING.stars0[5]`: チケット代を払ったファンに土下座してほしいレベルだ。筆者は本気で言っている

## `KURODA_PREVIEW`

- 出典: `src/kuroda-text.js`
- コード内コメント: 8. 次回展望テンプレ（KURODA_PREVIEW）
- 本数: 17

### fanExpect[]

- `KURODA_PREVIEW.fanExpect[1]`: ファンが一番見たがっているのは${d.leftName}と${d.rightName}の対戦だ。組まない理由がないだろう
- `KURODA_PREVIEW.fanExpect[2]`: ${d.leftName} vs ${d.rightName}——この対戦への期待値は相当なものだ。応えてほしい
- `KURODA_PREVIEW.fanExpect[3]`: SNSでも${d.leftName}と${d.rightName}の対戦を求める声が多い。ファンの目は正直だ
- `KURODA_PREVIEW.fanExpect[4]`: ${d.leftName}と${d.rightName}。このカードを実現しない手はないだろう。期待している
- `KURODA_PREVIEW.fanExpect[5]`: 次の興行で${d.leftName}と${d.rightName}がぶつかれば、それだけでチケットは売れる

### rivalry[]

- `KURODA_PREVIEW.rivalry[1]`: ${d.leftName}と${d.rightName}の因縁はまだ決着がついていない。次こそ白黒はっきりさせてほしいものだ
- `KURODA_PREVIEW.rivalry[2]`: ${d.leftName}と${d.rightName}、この二人の感情がリングの上で爆発する試合が見たい。ファンもそう思っているはずだ
- `KURODA_PREVIEW.rivalry[3]`: 因縁の${d.leftName} vs ${d.rightName}。この構図を活かさないGMはいないだろう
- `KURODA_PREVIEW.rivalry[4]`: ${d.leftName}と${d.rightName}のライバル関係が熱を帯びている。次の直接対決が楽しみだ

### titleOutlook[]

- `KURODA_PREVIEW.titleOutlook[1]`: 王者${d.championName}の次期防衛戦が注目だ。挑戦者候補に${d.challengerName}の名前が挙がっている
- `KURODA_PREVIEW.titleOutlook[2]`: ${d.championName}の王座に挑む資格があるのは誰か。${d.challengerName}の台頭が見逃せない
- `KURODA_PREVIEW.titleOutlook[3]`: 王座戦線は${d.championName}を軸に動いている。${d.challengerName}がどう絡むか、注目すべきだろう
- `KURODA_PREVIEW.titleOutlook[4]`: 次のタイトルマッチ。${d.championName} vs ${d.challengerName}が実現すれば、相当な好カードになる

### generic[]

- `KURODA_PREVIEW.generic[1]`: 次回の興行に注目カードはまだ見えていないが、カード編成次第でいくらでも化ける
- `KURODA_PREVIEW.generic[2]`: 目立つ因縁カードは現時点ではないが、逆に言えばGMの腕次第ということだ
- `KURODA_PREVIEW.generic[3]`: 次回は新しい風を入れてほしい。マンネリは最大の敵だ
- `KURODA_PREVIEW.generic[4]`: 次の興行が勝負だ。今回の結果を踏まえて、どんなカードを組むか楽しみにしている

## `KURODA_SPOTLIGHT`

- 出典: `src/kuroda-text.js`
- コード内コメント: 9. 注目選手ピックアップ（KURODA_SPOTLIGHT）
- 本数: 60

### growth[]

- `KURODA_SPOTLIGHT.growth[1]`: ${d.name}。今季OVR +${d.ovrGain}の急成長だ。半年前まで脅威でもなんでもなかったのに、見違えた
- `KURODA_SPOTLIGHT.growth[2]`: 要注意——${d.name}の成長速度は異常だ。次の対抗戦で当たるなら覚悟すべきだろう
- `KURODA_SPOTLIGHT.growth[3]`: ${d.name}が化けている。OVR +${d.ovrGain}。放っておくと手がつけられなくなる
- `KURODA_SPOTLIGHT.growth[4]`: ${d.orgName}で一番伸びているのは${d.name}だ。気づいていないなら、今知っておいたほうがいい
- `KURODA_SPOTLIGHT.growth[5]`: ${d.name}、OVR +${d.ovrGain}。成長曲線が急すぎて、来季にはエース級になっていてもおかしくない
- `KURODA_SPOTLIGHT.growth[6]`: 本紙としては、${d.name}の成長は今季最大の発見の一つだと書いておく。OVR +${d.ovrGain}は偶然では出せない数字だ
- `KURODA_SPOTLIGHT.growth[7]`: 40年見てきた中で、こういう急成長を遂げた選手の半数はそのまま伸び切る。${d.name}も期待していい
- `KURODA_SPOTLIGHT.growth[8]`: 数字は嘘をつかない。${d.name}のOVR +${d.ovrGain}という伸びは、この団体の育成方針が機能している証拠でもある

### star[]

- `KURODA_SPOTLIGHT.star[1]`: ${d.orgName}の看板、${d.name}。OVR ${d.ovr}に人気${d.pop}——実力と集客力を兼ね備えた正真正銘のエースだ
- `KURODA_SPOTLIGHT.star[1]`: ${d.name}、人気${d.pop}。中堅以上の実力に加えてこの集客力。厄介な存在だ
- `KURODA_SPOTLIGHT.star[1]`: ${d.name}は人気${d.pop}。OVRはまだ発展途上だが、ファンを呼べるのは才能の証だ
- `KURODA_SPOTLIGHT.star[2]`: ${d.name}——OVR ${d.ovr}、人気${d.pop}。こちらのエースと真正面からぶつかれる数少ない相手だ
- `KURODA_SPOTLIGHT.star[2]`: ${d.name}、OVR ${d.ovr}で人気${d.pop}。実力と人気のバランスが良く、どのカードにも組み込める
- `KURODA_SPOTLIGHT.star[2]`: ${d.name}は人気${d.pop}。まだ実力は追いついていないが、集客面では無視できない
- `KURODA_SPOTLIGHT.star[3]`: 対策なしで${d.name}に当たれば、興行ごと持っていかれる。OVR ${d.ovr}に人気${d.pop}は反則だ
- `KURODA_SPOTLIGHT.star[3]`: ${d.name}の人気${d.pop}は脅威だ。実力もそれなりにある。舐めてかかると痛い目を見る
- `KURODA_SPOTLIGHT.star[3]`: ${d.name}の人気${d.pop}は侮れない。今のうちに成長を止めたいところだが
- `KURODA_SPOTLIGHT.star[4]`: ${d.orgName}の人気看板であり実力のエース。${d.name}はどちらの意味でも団体の顔だ
- `KURODA_SPOTLIGHT.star[4]`: ${d.orgName}の集客の要は${d.name}。OVR ${d.ovr}と伸びしろもある。要注意だ
- `KURODA_SPOTLIGHT.star[4]`: ${d.orgName}の人気看板は${d.name}。OVRは発展途上だが、カリスマ性は数字に出ている
- `KURODA_SPOTLIGHT.star[5]`: 本紙としては、${d.name}は${d.orgName}そのものを背負う存在だと書いておく。OVR ${d.ovr}、人気${d.pop}——この組み合わせは反則だ
- `KURODA_SPOTLIGHT.star[5]`: 本紙は${d.name}を要警戒人物リストに入れておく。OVR ${d.ovr}に人気${d.pop}は十分に脅威だ
- `KURODA_SPOTLIGHT.star[5]`: ${d.name}は人気${d.pop}が先行している。実力が追いついた時が本当の脅威になる
- `KURODA_SPOTLIGHT.star[6]`: 40年見てきた中で、OVR ${d.ovr}と人気${d.pop}を両立する選手は一握りだ。${d.name}はその一握りに入っている
- `KURODA_SPOTLIGHT.star[6]`: 40年見てきた中で、${d.name}クラスの選手にどう対処するかで団体の格が問われる
- `KURODA_SPOTLIGHT.star[6]`: 40年見てきた中で、人気${d.pop}は実力に先行することがある。${d.name}が伸びれば手がつけられなくなる
- `KURODA_SPOTLIGHT.star[7]`: 数字は嘘をつかない。${d.name}のOVR ${d.ovr}・人気${d.pop}はトップクラスの証だ
- `KURODA_SPOTLIGHT.star[7]`: ${d.name}の数字は中堅以上を保証している。${d.orgName}の柱として機能しているのは間違いない
- `KURODA_SPOTLIGHT.star[7]`: ${d.name}の人気${d.pop}は数字以上の意味を持つ。集客力こそが団体を支える

### youngThreat[]

- `KURODA_SPOTLIGHT.youngThreat[1]`: ${d.name}、若手ながら存在感を出し始めている。数年後の脅威を今のうちに潰すか、育ちきるのを待つか
- `KURODA_SPOTLIGHT.youngThreat[2]`: 将来の脅威——${d.name}。まだ荒削りだが、このまま育てば${d.orgName}の次期エースだろう
- `KURODA_SPOTLIGHT.youngThreat[3]`: ${d.name}に注目すべきだ。${d.age}歳、伸びしろの塊である
- `KURODA_SPOTLIGHT.youngThreat[4]`: ${d.orgName}の未来を背負うのは${d.name}かもしれない。現時点ではまだ脅威未満だが、その日は遠くない
- `KURODA_SPOTLIGHT.youngThreat[5]`: 本紙としては、${d.name}を「育つ前に芽を摘むべき存在」リストに入れておくと書いておく。${d.age}歳——時間との競争だ
- `KURODA_SPOTLIGHT.youngThreat[6]`: 40年見てきた中で、若手の脅威を放置した団体は、必ず後で痛い目を見る。${d.age}歳の${d.name}も例外ではない
- `KURODA_SPOTLIGHT.youngThreat[7]`: 数字は嘘をつかない。${d.name}は今のうちに対策を打つべき若手だ。来季には手遅れかもしれない

### risingYoung[]

- `KURODA_SPOTLIGHT.risingYoung[1]`: ${d.age}歳の${d.name}——ブレイクスルー前夜の気配を漂わせている。次の一年が分水嶺になる
- `KURODA_SPOTLIGHT.risingYoung[2]`: ${d.name}（${d.age}歳）。OVR ${d.ovr} は通過点でしかない、というのが本紙の見立てだ
- `KURODA_SPOTLIGHT.risingYoung[3]`: ${d.age}歳という年齢、OVR ${d.ovr} という数字。この組み合わせが意味するのは「これからが本番」ということだ
- `KURODA_SPOTLIGHT.risingYoung[4]`: ${d.name}は${d.age}歳。試合経験を重ねるごとに化けていくタイプで、今期の伸び方は警戒に値する
- `KURODA_SPOTLIGHT.risingYoung[5]`: ${d.orgName}の中で、${d.name}（${d.age}歳）は最も目を離せない一人だ。一年後には別人になっている可能性がある
- `KURODA_SPOTLIGHT.risingYoung[6]`: ${d.age}歳——勝ち方を覚え始めた頃合いだ。${d.name}の試合は、見るたびに上達が分かる
- `KURODA_SPOTLIGHT.risingYoung[7]`: ${d.name}、${d.age}歳。人気${d.pop}という数字が、すでに観客の評価を物語っている

### midCareer[]

- `KURODA_SPOTLIGHT.midCareer[1]`: ${d.age}歳の${d.name}。経験と実力のバランスが今もっとも整っている時期で、戦績の安定感は本物だ
- `KURODA_SPOTLIGHT.midCareer[2]`: ${d.name}（${d.age}歳）はキャリアの中核に差し掛かっている。OVR ${d.ovr} で${d.orgName}の屋台骨を支える存在
- `KURODA_SPOTLIGHT.midCareer[3]`: ${d.age}歳という年齢は、リング上の判断が最も冴える時期だ。${d.name}の試合運びを見れば一目で分かる
- `KURODA_SPOTLIGHT.midCareer[4]`: ${d.name}は${d.age}歳、人気${d.pop}。実績と知名度の両方で、団体の主軸として機能している
- `KURODA_SPOTLIGHT.midCareer[5]`: ${d.age}歳。${d.name}が今期見せている戦いぶりは、円熟という言葉が最もしっくりくる
- `KURODA_SPOTLIGHT.midCareer[6]`: ${d.orgName}を語るうえで${d.name}（${d.age}歳）の名前は外せない。中堅以上の働きを毎週見せ続けている
- `KURODA_SPOTLIGHT.midCareer[7]`: ${d.age}歳の${d.name}は、もはや団体の信用そのものだ。OVR ${d.ovr} に裏付けされた安定感がある

### veteran[]

- `KURODA_SPOTLIGHT.veteran[1]`: ${d.age}歳の${d.name}。OVR ${d.ovr} を維持し続けるベテランの存在は、若手の壁として機能している
- `KURODA_SPOTLIGHT.veteran[2]`: ${d.name}（${d.age}歳）。人気${d.pop}は長年の積み上げによるもので、一朝一夕では作れない数字だ
- `KURODA_SPOTLIGHT.veteran[3]`: ${d.age}歳になっても${d.name}が${d.orgName}の中核に居続けるのは、それだけの実力と説得力がある証拠だ
- `KURODA_SPOTLIGHT.veteran[4]`: ${d.name}は${d.age}歳。引き出しの数で勝負するタイプで、対戦相手にとっては最も読みづらい一人
- `KURODA_SPOTLIGHT.veteran[5]`: ${d.age}歳のベテラン${d.name}。一試合の重みが他の選手とは違う、という視点で見るべき存在だ
- `KURODA_SPOTLIGHT.veteran[6]`: ${d.name}（${d.age}歳）の名前を聞けば、業界の歴史の一片を思い出す観客も多いだろう
- `KURODA_SPOTLIGHT.veteran[7]`: ${d.age}歳。${d.name}がリングに立つ姿を見られる試合は、それ自体が貴重な体験だ

### nemesis[]

- `KURODA_SPOTLIGHT.nemesis[1]`: ${d.name}——うちのエースが最も意識している存在だ。次に当たるときは因縁を含んだカードになる
- `KURODA_SPOTLIGHT.nemesis[2]`: ${d.name}との直接対決データがある。過去の戦績を見れば、一筋縄ではいかない相手だと分かるはずだ
- `KURODA_SPOTLIGHT.nemesis[3]`: 因縁の相手、${d.name}。対戦するたびにドラマが生まれる、ある意味ありがたい存在である

## `KURODA_NEWS_COMMENT`

- 出典: `src/kuroda-text.js`
- コード内コメント: 10. 他団体ニュース用 黒田コメント（KURODA_NEWS_COMMENT）
- 本数: 30

### aiChampionChange[]

- `KURODA_NEWS_COMMENT.aiChampionChange[1]`: 王座が動いた。新王者の手腕次第で、業界の勢力図が変わる可能性がある
- `KURODA_NEWS_COMMENT.aiChampionChange[2]`: 他団体の王座移動は対岸の火事ではない。競争相手の顔ぶれが変わるということだ
- `KURODA_NEWS_COMMENT.aiChampionChange[3]`: 新王者誕生——だが、問題は王座を獲った後にどう団体を引っ張れるかだ
- `KURODA_NEWS_COMMENT.aiChampionChange[4]`: 王座交代は団体の転換期を意味する。果たして好転か、それとも混乱か
- `KURODA_NEWS_COMMENT.aiChampionChange[5]`: 新王者の動向を本紙は注視している。王座は獲るより守るほうが難しいというのが通例だ
- `KURODA_NEWS_COMMENT.aiChampionChange[6]`: 関係者の一人は「次の防衛戦が本当の試金石になる」と語る。本紙も同意見だ
- `KURODA_NEWS_COMMENT.aiChampionChange[7]`: 40年見てきた中で、王座交代の直後にこそ団体の地力が問われる。今後の動きが見ものである

### aiAceRetirement[]

- `KURODA_NEWS_COMMENT.aiAceRetirement[1]`: 看板選手の引退は、一つの時代の終わりを意味する。穴を埋められる逸材はいるのか
- `KURODA_NEWS_COMMENT.aiAceRetirement[2]`: エース級の引退——これは他団体にとっても無視できない損失だろう
- `KURODA_NEWS_COMMENT.aiAceRetirement[3]`: 大物引退。業界全体にとっても痛手だ。こういう選手は簡単には現れない
- `KURODA_NEWS_COMMENT.aiAceRetirement[4]`: 一つの時代が幕を下ろす。本紙としては感慨深いと書いておく
- `KURODA_NEWS_COMMENT.aiAceRetirement[5]`: 関係者によれば、後継者選びが団体の最重要課題になるという。そうだろう
- `KURODA_NEWS_COMMENT.aiAceRetirement[6]`: 40年見てきた中で、エースの引退で揺らがなかった団体はない。観察は続く

### aiRetirement[]

- `KURODA_NEWS_COMMENT.aiRetirement[1]`: 引退は選手にとって避けられない運命だ。問題は、その後を誰が担うかだ
- `KURODA_NEWS_COMMENT.aiRetirement[2]`: 一人の引退が団体のバランスを崩すこともある。注視すべきだ
- `KURODA_NEWS_COMMENT.aiRetirement[3]`: 本紙としては、引退選手の足跡を記録に残しておきたい
- `KURODA_NEWS_COMMENT.aiRetirement[4]`: リングを去る選手それぞれにドラマがある。今回のケースも例外ではない
- `KURODA_NEWS_COMMENT.aiRetirement[5]`: 関係者は静かに送り出すと語る。それが業界の流儀でもある

### aiShowHighlight[]

- `KURODA_NEWS_COMMENT.aiShowHighlight[1]`: 高品質な試合が他団体で生まれている。うかうかしていられない
- `KURODA_NEWS_COMMENT.aiShowHighlight[2]`: 他団体の試合レベルが上がっている。競争は激化する一方だ
- `KURODA_NEWS_COMMENT.aiShowHighlight[3]`: 見応えのある試合だったようだ。こちらも負けていられない
- `KURODA_NEWS_COMMENT.aiShowHighlight[4]`: 本紙としては、業界全体の質が上がっているのは歓迎すべき傾向だと見ている
- `KURODA_NEWS_COMMENT.aiShowHighlight[5]`: 関係者の話では、客足も伸びているという。良いニュースだ
- `KURODA_NEWS_COMMENT.aiShowHighlight[6]`: 40年見てきた中で、こうした名勝負が業界を底上げしてきた。今回もその一つになるかもしれない

### aiBreakthrough[]

- `KURODA_NEWS_COMMENT.aiBreakthrough[1]`: 要注意だ。ブレイクスルーを果たした選手は、その後一気に化ける傾向がある
- `KURODA_NEWS_COMMENT.aiBreakthrough[2]`: 他団体の若手が力をつけている。将来の脅威になりうる
- `KURODA_NEWS_COMMENT.aiBreakthrough[3]`: 成長の芽を摘むことはできない。こちらも育成を怠るわけにはいかない
- `KURODA_NEWS_COMMENT.aiBreakthrough[4]`: 本紙としては、この選手の名前を覚えておくべきだと書いておく
- `KURODA_NEWS_COMMENT.aiBreakthrough[5]`: 関係者は「化ける兆しは前々からあった」と語る。見る目のある観察者は気づいていたわけだ
- `KURODA_NEWS_COMMENT.aiBreakthrough[6]`: 40年見てきた中で、ブレイクスルー直後の選手は最も伸びる。次の数か月が勝負である

## `KURODA_RELATION_NARRATIVE`

- 出典: `src/kuroda-text.js`
- コード内コメント: ╔═══════════════════════════════════════════════════════════╗ / ║  10. 因縁列伝の関係性叙述 — KURODA_RELATION_NARRATIVE      ║ / ║  3面で使用。9象限の内部タグごとに見出し+本文プールを持つ。║ / ║  取材モード(深め): 感傷的・含蓄ある語り口、冷静さは保つ。║ / ╚═══════════════════════════════════════════════════════════╝
- 本数: 189

### fated_admiration.headlines[]

- `KURODA_RELATION_NARRATIVE.fated_admiration.headlines[1]`: 認め合うがゆえに、退けない
- `KURODA_RELATION_NARRATIVE.fated_admiration.headlines[2]`: 友情と勝負——両立しないはずの二つを、両立させた
- `KURODA_RELATION_NARRATIVE.fated_admiration.headlines[3]`: 互いの背中を押し続ける、稀有な関係
- `KURODA_RELATION_NARRATIVE.fated_admiration.headlines[4]`: ${d.years}年の付き合い、それでも飽きが来ない理由
- `KURODA_RELATION_NARRATIVE.fated_admiration.headlines[5]`: リング上では敵、リング外では戦友
- `KURODA_RELATION_NARRATIVE.fated_admiration.headlines[6]`: ${d.charA}と${d.charB}——本紙が見守ってきた、業界屈指の関係

### fated_admiration.bodies[]

- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[1]`: 試合後の握手は本物だ。だがリング上では一切の手加減もない。${d.matches}度の対戦、最高評価は${d.bestMQ}点——この数字こそ、二人の関係の質を物語っている。本紙はそう書いておく。
- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[2]`: ${d.years}年の付き合い、${d.matches}度の対戦。それでも飽きが来ないのは、両者が互いを真の好敵手と認めているからだろう。数字は嘘をつかない。
- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[3]`: 「あいつとの試合は、観客のためじゃなくて、自分たちのためにやってる」——どちらかがいつかそう漏らしていた。本当のところ、それが真実なのだろうと、記者として40年見てきた中で、そう思う。
- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[4]`: ${d.bestMQ}点という最高評価。この数字は、二人がどれだけ互いを引き出してきたかの証明だ。${d.charA}にとっての${d.charB}、${d.charB}にとっての${d.charA}——どちらも、欠かせない存在になっている。
- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[5]`: ${d.matches}度の激突、それでも次戦が待ち遠しい。記者として、これほど健全な因縁を業界で見たことはあまりない。もっとも、それを認めるかどうかは別の話だが。
- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[6]`: ${d.charA}が勝った夜の${d.charB}の表情、${d.charB}が勝った夜の${d.charA}の表情——どちらも、悔しさよりも先に「次がある」という確信が浮かんでいた。${d.matches}度の蓄積が、そういう関係を作っている。
- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[7]`: この関係には、勝敗を超えた何かがある。本紙としては、それを「同志」と呼ぶか「好敵手」と呼ぶか、いつも迷うのだが——おそらく、両方が正しい。${d.years}年の付き合いを、そう書いておく。
- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[8]`: ${d.bestMQ}点という最高評価は、二人がリングで一切の妥協をしないことの証明だ。だが、控室では別の顔を見せる——記者として40年見てきた中で、こういう二面性を持つ関係は、本物だと感じている。
- `KURODA_RELATION_NARRATIVE.fated_admiration.bodies[9]`: 「あいつがいるから、自分は強くなれる」——両者が同じことを言える関係は、業界でもそう多くはない。${d.matches}度の対戦が、それを裏付けている。

### fated_admiration.contexts.repaired.headlines[]

- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.repaired.headlines[1]`: 一度断ち切れた糸を、結び直した二人
- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.repaired.headlines[2]`: ${d.charA}と${d.charB}——和解という、最も難しい一歩
- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.repaired.headlines[3]`: 関係修復の先に、再び並んだ背中

### fated_admiration.contexts.repaired.bodies[]

- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.repaired.bodies[1]`: ${d.charA}と${d.charB}が一度離れた時期があった——本紙はその空白を覚えている。${d.matches}度のリングを共にしてきた二人だが、ある時期から目を合わせない夜が続いた。それが、再び並んで立てるようになるまでに、どれだけの言葉が交わされたか。和解の重みを、数字では測れない。
- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.repaired.bodies[2]`: 修復という言葉は、軽く扱われがちだ。だが${d.charA}と${d.charB}の場合、それは確かに重い意味を持っていた。${d.years}年の付き合いの中で一度沈黙した関係が、いま再び呼吸を取り戻している。記者として、これほど祝福したい修復はそう多くない。
- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.repaired.bodies[3]`: ${d.bestMQ}点を生んだ二人は、しかし一度道を違えた。それでもリングが、控室が、また同じ空気を共有している——本紙はそれを「奇跡」とは呼ばない。両者の覚悟が、ここまで連れてきたのだと書いておく。

### fated_admiration.contexts.betrayed.headlines[]

- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.betrayed.headlines[1]`: かつての友、いまリングの向こう側
- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.betrayed.headlines[2]`: ${d.charA}と${d.charB}——尊敬は残ったまま、別の旗の下へ
- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.betrayed.headlines[3]`: 袂を分かった戦友、再び対峙する

### fated_admiration.contexts.betrayed.bodies[]

- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.betrayed.bodies[1]`: かつて同じ控室を分け合った二人だ。${d.charA}と${d.charB}——${d.matches}度の名勝負の記憶は、団体を別にしてもなお生きている。「あの人だけは尊敬している」と一方が漏らした。リングの色は変わっても、互いを認める気持ちは変わらない。それが、この関係の業の深さでもある。
- `KURODA_RELATION_NARRATIVE.fated_admiration.contexts.betrayed.bodies[2]`: 離脱があった夜の控室の沈黙を、本紙は覚えている。${d.charA}と${d.charB}は、しかし憎み合ってはいなかった。${d.bestMQ}点を共に作った二人にとって、別の旗の下に立つことは「裏切り」ではなく「選択」だったのだろう。それでも次にリングで会う夜は、特別なものになる。

### pure_hatred.headlines[]

- `KURODA_RELATION_NARRATIVE.pure_hatred.headlines[1]`: 顔も見たくない、それでも組まれてしまう
- `KURODA_RELATION_NARRATIVE.pure_hatred.headlines[2]`: 楽屋ですれ違っても、目を合わせない
- `KURODA_RELATION_NARRATIVE.pure_hatred.headlines[3]`: 憎しみだけが原動力——それでも観客は望む
- `KURODA_RELATION_NARRATIVE.pure_hatred.headlines[4]`: 次の対戦が、もう怖い
- `KURODA_RELATION_NARRATIVE.pure_hatred.headlines[5]`: ${d.matches}度の激突、いまだに笑顔の握手は一度もない
- `KURODA_RELATION_NARRATIVE.pure_hatred.headlines[6]`: ${d.charA}と${d.charB}——和解の二文字は、どこにもない

### pure_hatred.bodies[]

- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[1]`: 通算${d.matches}度の対戦、いまだに笑顔の握手は一度もない。${d.bestMQ}点の最高評価が示す通り、リング上の温度は本物だ。問題は、その温度の出どころが「闘志」ではなく「憎悪」だということである。本紙としては、そう書いておく。
- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[2]`: 互いに敵意を隠さない関係。リング上だけでなく、楽屋裏でも目を合わせない。それでも観客はこのカードを望み続け、興行のたびに同じリングに上げられる——憎しみだけが原動力の試合は、皮肉にもこの業界で最も売れる商品の一つだ。
- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[3]`: ${d.years}年経っても、二人の関係は氷点下のまま。${d.matches}度戦って、一度の和解もない。記者として40年やってきたが、これほど一貫した敵意を見るのは、そう多くはない。
- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[4]`: 数字は嘘をつかない。${d.bestMQ}点という評価は、観客がこの憎悪を本物だと感じている証左だ。だが、本紙はこの関係に救いがあるとは見ていない。
- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[5]`: 「あいつだけは許せない」——どちらかが、いや、おそらく両者がそう思っている。${d.matches}度の対戦が、その確信を強めるばかりであるのが、この関係の業の深さだ。
- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[6]`: 控室で${d.charA}と${d.charB}を同じ部屋に入れない——これは興行関係者の暗黙のルールになっている。${d.matches}度の対戦が、その慎重さを必要にした。本紙としては、それでも組まれ続けるリングの上の構図を、ある種の業として見ている。
- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[7]`: ${d.bestMQ}点。この数字を「美談」として語ることはできない。憎しみが質を生むこともある——皮肉な現実を、本紙はそう書いておく。
- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[8]`: ${d.years}年経って、${d.matches}試合戦って、それでも温度は氷点下のまま。記者として40年やってきたが、これほど一貫した敵意の記録は、業界の中でも数えるほどしかない。
- `KURODA_RELATION_NARRATIVE.pure_hatred.bodies[9]`: 「あの試合だけはやり直したい」——そう言えるのが${d.charA}か${d.charB}か、おそらく両者だろう。${d.matches}度の対戦の、どれもが心残りを残している。これが「純粋な憎悪」と呼ばれる関係の本質である。

### pure_hatred.contexts.betrayed.headlines[]

- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.betrayed.headlines[1]`: ベルトを抱えて去った日から、戻れない関係
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.betrayed.headlines[2]`: ${d.charA}と${d.charB}——裏切りが、憎しみを純化させた
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.betrayed.headlines[3]`: 元同僚という言葉が、最も重い意味を持つ二人

### pure_hatred.contexts.betrayed.bodies[]

- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.betrayed.bodies[1]`: ${d.charA}と${d.charB}は、かつて同じ団体の選手だった——その事実が、いまの憎しみをより深いものにしている。離脱の夜に交わされた言葉、持ち去られたベルト、残された側の沈黙。${d.matches}度の対戦の、どれもがその夜の延長戦である。本紙はそう書いておく。
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.betrayed.bodies[2]`: 「あの裏切りは、一生忘れない」——一方が漏らしたとされる言葉は、もう一方の耳にも届いている。${d.years}年経っても、二人の間の溝は埋まらない。むしろ、戦うたびに深くなる。記者として40年見てきたが、これほど業の深い関係は数えるほどしかない。
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.betrayed.bodies[3]`: ${d.bestMQ}点という評価。だが、その点数の重みを語る前に、本紙は二人がかつて同じ控室を分け合っていた事実から書き始めなければならない。裏切られた側にとって、リングは復讐の場でしかない——そういう関係である。

### pure_hatred.contexts.factionWar.headlines[]

- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.factionWar.headlines[1]`: 派閥が割れた今、憎しみは旗印になった
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.factionWar.headlines[2]`: ${d.charA}と${d.charB}——抗争の最前線に立つ二人
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.factionWar.headlines[3]`: 団体の威信を背負う、純粋な憎悪

### pure_hatred.contexts.factionWar.bodies[]

- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.factionWar.bodies[1]`: 派閥抗争の最中、${d.charA}と${d.charB}の対戦は単なる試合ではない。背負っている旗の重みが、二人の憎しみをさらに加速させている。${d.matches}度の対戦、${d.bestMQ}点——その数字の裏には、もはや個人ではなく集団の感情が乗っている。本紙はそう見ている。
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.factionWar.bodies[2]`: 団体の中で割れた二つの旗。その先頭に立つのが${d.charA}と${d.charB}だ。元から純粋な敵意で結ばれた二人にとって、抗争の構図は格好の舞台になる——皮肉な話だが、こういう関係こそ抗争を「商品」として成立させてしまう。

### pure_hatred.contexts.lockerStress.headlines[]

- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.lockerStress.headlines[1]`: 荒れた控室で交わる、二つの視線
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.lockerStress.headlines[2]`: ${d.charA}と${d.charB}——団体の不協和音の中心
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.lockerStress.headlines[3]`: 空気が冷えきった更衣室、その中央に立つ二人

### pure_hatred.contexts.lockerStress.bodies[]

- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.lockerStress.bodies[1]`: 団体内のロッカールームに、いま不穏な空気が漂っている。${d.charA}と${d.charB}の関係は、その不穏さの震源の一つだ。${d.matches}度の憎しみが、控室全体に染み出している——そう書いておく。社長が動かない限り、この空気は消えない。
- `KURODA_RELATION_NARRATIVE.pure_hatred.contexts.lockerStress.bodies[2]`: 控室で他の選手たちが息を潜める瞬間がある——${d.charA}と${d.charB}が同じ空間に居合わせた時だ。${d.years}年来の憎悪が、団体の空気そのものを冷やしている。記者として、これは見ていてつらい。

### bitter_feud.headlines[]

- `KURODA_RELATION_NARRATIVE.bitter_feud.headlines[1]`: 水と油、リングでも楽屋でも
- `KURODA_RELATION_NARRATIVE.bitter_feud.headlines[2]`: ${d.matches}度の対戦、一度の握手もない
- `KURODA_RELATION_NARRATIVE.bitter_feud.headlines[3]`: 相容れない二人、それでも同じリングへ
- `KURODA_RELATION_NARRATIVE.bitter_feud.headlines[4]`: ${d.charA}と${d.charB}——交わらない二本の線
- `KURODA_RELATION_NARRATIVE.bitter_feud.headlines[5]`: わだかまりは、消えない

### bitter_feud.bodies[]

- `KURODA_RELATION_NARRATIVE.bitter_feud.bodies[1]`: ${d.matches}度の対戦、いずれも遺恨を残した。試合後の挨拶もない、業界が認める「対立関係」の典型例。本紙としては、これを「因縁」と呼ぶのが正確だと見ている。
- `KURODA_RELATION_NARRATIVE.bitter_feud.bodies[2]`: 折り合いの悪さは隠しようもない。${d.years}年の付き合いの中で、互いに歩み寄った瞬間は記憶にない。それでも興行は組まれ続ける——観客が望むからだ。
- `KURODA_RELATION_NARRATIVE.bitter_feud.bodies[3]`: ${d.bestMQ}点という評価が示すのは、二人の対戦が単なる不仲試合に留まらない、という事実だ。憎しみが質を生むこともある——記者として、そう書いておく。
- `KURODA_RELATION_NARRATIVE.bitter_feud.bodies[4]`: 「あの選手とは、どうしても波長が合わない」——そう公言する選手は珍しくないが、この二人の場合、それが${d.matches}試合分の数字として刻まれている。
- `KURODA_RELATION_NARRATIVE.bitter_feud.bodies[5]`: 業界では「組ませるべきではない」という声もある。だが本紙としては、この緊張感こそ商品価値の源泉だと書いておく。皮肉な話だが、それが現実である。
- `KURODA_RELATION_NARRATIVE.bitter_feud.bodies[6]`: ${d.matches}度のリングで、笑顔を見せた瞬間は記憶にない。${d.bestMQ}点という評価は、観客が「険悪さの本物」を感じた証拠だ。本紙はそう書いておく。
- `KURODA_RELATION_NARRATIVE.bitter_feud.bodies[7]`: ${d.years}年来、まったく歩み寄らない関係。それでも興行に組まれ続けるのは、観客がこの確執の解消を望んでいるからではなく、むしろ持続を望んでいるからだろう——そう書くと身も蓋もないが、現実である。
- `KURODA_RELATION_NARRATIVE.bitter_feud.bodies[8]`: ${d.charA}と${d.charB}——交わらない二本の線が、リングという交差点でだけ衝突する。${d.matches}度の衝突が、そのたびに業界に静かな余韻を残してきた。

### bitter_feud.contexts.betrayed.headlines[]

- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.betrayed.headlines[1]`: 元同僚、いま完全に別の旗の下
- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.betrayed.headlines[2]`: ${d.charA}と${d.charB}——別れたあと、確執だけが残った
- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.betrayed.headlines[3]`: 団体を分けた選択が、ここまでこじれた

### bitter_feud.contexts.betrayed.bodies[]

- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.betrayed.bodies[1]`: かつて同じ控室で過ごした日々を、いまの${d.charA}と${d.charB}を見ても想像しにくい。離脱の決断が、ただでさえ折り合いの悪かった二人の溝を決定的にした。${d.matches}度の対戦は、どれも「元同僚」という言葉が滲んでいる。本紙はそう書いておく。
- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.betrayed.bodies[2]`: ${d.years}年来の険悪さが、団体の境界を越えてさらに強まった——${d.charA}と${d.charB}の場合、そうとしか言いようがない。${d.bestMQ}点を生んだリングは、もはや「過去を持つ二人」の戦場である。

### bitter_feud.contexts.factionWar.headlines[]

- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.factionWar.headlines[1]`: 派閥の旗、それぞれの背中にひるがえる
- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.factionWar.headlines[2]`: ${d.charA}と${d.charB}——団体内の境界線が、リングに引かれた
- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.factionWar.headlines[3]`: 抗争のシンボルとなった、二人の確執

### bitter_feud.contexts.factionWar.bodies[]

- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.factionWar.bodies[1]`: 派閥が割れたいま、${d.charA}と${d.charB}の確執は団体全体の構図を象徴するものになった。${d.matches}度のリングが、それぞれの陣営の士気と直結している——そういう試合になっている。本紙としては、これを「商品価値」と呼ぶのが正確かもしれない。
- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.factionWar.bodies[2]`: 控室の二つの旗印を、それぞれの背中に背負って立つ${d.charA}と${d.charB}。${d.years}年来の険悪さが、いま抗争の最前線として機能している。皮肉な話だが、団体内対立はこういう関係を必要とするのだ。

### bitter_feud.contexts.lockerStress.headlines[]

- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.lockerStress.headlines[1]`: 控室の冷気、その中心の二人
- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.lockerStress.headlines[2]`: ${d.charA}と${d.charB}——団体の空気を凍らせる関係
- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.lockerStress.headlines[3]`: 荒れたロッカールーム、悪化の主因

### bitter_feud.contexts.lockerStress.bodies[]

- `KURODA_RELATION_NARRATIVE.bitter_feud.contexts.lockerStress.bodies[1]`: ${d.charA}と${d.charB}が同じ控室にいるだけで、他の選手たちの会話量が減る——そういう状態が続いている。${d.matches}度の確執が、もはや個人の問題ではなく団体全体の空気を左右している。社長が手を打たない限り、これは静かに膿んでいく。

### allied_rivalry.headlines[]

- `KURODA_RELATION_NARRATIVE.allied_rivalry.headlines[1]`: 友情と闘志、矛盾しない関係
- `KURODA_RELATION_NARRATIVE.allied_rivalry.headlines[2]`: リングで殴り合い、控室で笑い合う
- `KURODA_RELATION_NARRATIVE.allied_rivalry.headlines[3]`: 互いを必要としているライバル
- `KURODA_RELATION_NARRATIVE.allied_rivalry.headlines[4]`: ${d.charA}と${d.charB}——切磋琢磨の見本
- `KURODA_RELATION_NARRATIVE.allied_rivalry.headlines[5]`: 戦友であり、好敵手でもある

### allied_rivalry.bodies[]

- `KURODA_RELATION_NARRATIVE.allied_rivalry.bodies[1]`: ${d.matches}度の対戦を経てなお、両者がともに「次もやりたい」と表明している、業界では珍しい関係。記者として、こうした関係性が業界全体を底上げしていると見ている。
- `KURODA_RELATION_NARRATIVE.allied_rivalry.bodies[2]`: ${d.years}年の付き合い。互いを認め合いながら、リングでは一歩も引かない。${d.bestMQ}点の最高評価は、その緊張感の産物だ。
- `KURODA_RELATION_NARRATIVE.allied_rivalry.bodies[3]`: 「あいつがいるから、自分も成長できる」——どちらかが言ったとされる言葉。本紙はそう書いておく。数字は嘘をつかない、関係性の質も同様だ。
- `KURODA_RELATION_NARRATIVE.allied_rivalry.bodies[4]`: ${d.matches}度のリングで、二人は確実に互いを引き上げ続けてきた。これを「ライバル」と呼ぶか「戦友」と呼ぶか——おそらく、両方が正しい。
- `KURODA_RELATION_NARRATIVE.allied_rivalry.bodies[5]`: 業界における健全な競争関係の見本のような二人。本紙としては、この関係が長く続くことを願って書いておく。もっとも、願いだけで続くものでもないが。
- `KURODA_RELATION_NARRATIVE.allied_rivalry.bodies[6]`: 控室で笑い合って、リングで殴り合う。${d.matches}度の対戦が、その「切り替え」を見事にこなしてきた——記者として40年見てきた中で、これほど器用な二人は珍しい。
- `KURODA_RELATION_NARRATIVE.allied_rivalry.bodies[7]`: ${d.bestMQ}点の最高評価は、両者が互いを「真の好敵手」と認めているからこそ生まれた数字だ。${d.years}年の付き合いの中で、両者の信頼はより深いものになっている。

### allied_rivalry.contexts.repaired.headlines[]

- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.repaired.headlines[1]`: 一度ぎくしゃくした関係を、立て直した二人
- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.repaired.headlines[2]`: ${d.charA}と${d.charB}——絆を再確認した夜のあとで
- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.repaired.headlines[3]`: 戦友の溝、社長の手で埋まった

### allied_rivalry.contexts.repaired.bodies[]

- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.repaired.bodies[1]`: ${d.charA}と${d.charB}の間に、一時期、距離があった——本紙はそれを覚えている。理由はそれぞれだが、社長の仲介を経て、二人はまた控室で笑えるようになった。${d.matches}度のリングが、その関係を再び支えている。和解は数字には表れないが、確かにある。
- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.repaired.bodies[2]`: 修復された絆は、修復前より強くなる——そういう仮説を、この二人は証明しようとしている。${d.years}年の付き合いの中で起きた小さな亀裂を、いま${d.charA}と${d.charB}は越えた。本紙としては、こうした関係を業界の財産だと書いておく。

### allied_rivalry.contexts.factionWar.headlines[]

- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.factionWar.headlines[1]`: 戦友、しかし旗は別になった
- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.factionWar.headlines[2]`: ${d.charA}と${d.charB}——派閥が引き裂いた切磋琢磨
- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.factionWar.headlines[3]`: 抗争の中で問われる、本当の友情

### allied_rivalry.contexts.factionWar.bodies[]

- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.factionWar.bodies[1]`: 派閥が割れた今、${d.charA}と${d.charB}は別の旗の下に立つことになった。${d.matches}度の名勝負を共に作ってきた二人にとって、これは複雑な状況だ。「リングでは敵、控室では友」という器用さが、いま試されている——本紙はそう見ている。
- `KURODA_RELATION_NARRATIVE.allied_rivalry.contexts.factionWar.bodies[2]`: 団体内の境界が、戦友同士に引かれた。${d.bestMQ}点を共に作った${d.charA}と${d.charB}は、しかし派閥の論理から逃れられない。次のリングで二人が見せるのは、友情か、それとも陣営の矜持か——記者として、いま一番見たい一戦である。

### destined_rival.headlines[]

- `KURODA_RELATION_NARRATIVE.destined_rival.headlines[1]`: 避けられない一夜が、いずれ来る
- `KURODA_RELATION_NARRATIVE.destined_rival.headlines[2]`: 業界が待つ、二人の対峙
- `KURODA_RELATION_NARRATIVE.destined_rival.headlines[3]`: ${d.charA}と${d.charB}——軌道が交差する夜
- `KURODA_RELATION_NARRATIVE.destined_rival.headlines[4]`: 運命の対決、まだ序章にすぎない
- `KURODA_RELATION_NARRATIVE.destined_rival.headlines[5]`: 本紙が見守る、もう一つの宿命

### destined_rival.bodies[]

- `KURODA_RELATION_NARRATIVE.destined_rival.bodies[1]`: ${d.matches > 0 ? 
- `KURODA_RELATION_NARRATIVE.destined_rival.bodies[1]`:  : '未対戦'}、それでも互いの存在は確かに意識し合っている。本紙としては、本格対決の機が熟すのを待つばかりである。
- `KURODA_RELATION_NARRATIVE.destined_rival.bodies[2]`: ${d.charA}と${d.charB}——二人が同じリングに立つ夜は、業界の節目になる。数字がそう告げている。
- `KURODA_RELATION_NARRATIVE.destined_rival.bodies[3]`: 通算${d.matches}戦。両者のキャリアの重要な局面で、必ずと言っていいほど名前が交差する。偶然と呼ぶには出来すぎている、と本紙は書いておく。
- `KURODA_RELATION_NARRATIVE.destined_rival.bodies[4]`: ${d.bestMQ}点という最高評価。これは単なる数字ではなく、二人の関係が業界の中でどれほどの位置を占めているかの指標である。次戦への期待は、当然のように高まる。
- `KURODA_RELATION_NARRATIVE.destined_rival.bodies[5]`: ${d.years}年来の関係。互いに距離を測りながら、いつかの本格対決を待っている——本紙はそう見ている。記者として40年見てきた中で、こういう関係は珍しくない。だが、いざ火が点くと、その熱は本物になる。

### destined_rival.contexts.betrayed.headlines[]

- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.betrayed.headlines[1]`: 団体を分けたあとの、最初の対峙
- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.betrayed.headlines[2]`: ${d.charA}と${d.charB}——別の旗の下、運命の再会
- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.betrayed.headlines[3]`: 離脱と残留、二つの選択がリングで交差する

### destined_rival.contexts.betrayed.bodies[]

- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.betrayed.bodies[1]`: かつて同じ控室で過ごした二人が、別々の旗を背負って同じリングに立つ夜——${d.charA}と${d.charB}にとって、それは単なる初対戦以上の意味を持つ。${d.matches}度の交わりが、別の色を帯びて再開される。本紙はこの一戦を、業界の節目として書き残しておきたい。
- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.betrayed.bodies[2]`: ${d.years}年来、距離を測り合ってきた二人。それが団体を分けたあとに本格的に対峙する——記者として、こういう構図は何度見ても胸が騒ぐ。${d.bestMQ}点を超える試合になるのか、それとも別の意味で記憶される夜になるのか。注視している。

### destined_rival.contexts.factionWar.headlines[]

- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.factionWar.headlines[1]`: 派閥対立の中、ついに正面から組まれた
- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.factionWar.headlines[2]`: ${d.charA}と${d.charB}——抗争の象徴的一戦
- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.factionWar.headlines[3]`: 団体を割った構図、その頂点同士の対峙

### destined_rival.contexts.factionWar.bodies[]

- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.factionWar.bodies[1]`: 派閥が割れた今、${d.charA}と${d.charB}の対戦は団体全体の構図を凝縮するものになった。${d.matches}度の運命的な距離が、抗争の構図によってついに正面から組まれる。本紙としては、この一戦の結果が両派閥の今後を決定づけると見ている。

### destined_rival.contexts.reclaiming.headlines[]

- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.reclaiming.headlines[1]`: 奪われたベルト、奪い返す夜
- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.reclaiming.headlines[2]`: ${d.charA}と${d.charB}——王座と意地が交錯する
- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.reclaiming.headlines[3]`: 運命の対峙が、奪還戦という形で実現する

### destined_rival.contexts.reclaiming.bodies[]

- `KURODA_RELATION_NARRATIVE.destined_rival.contexts.reclaiming.bodies[1]`: ${d.charA}と${d.charB}の対決は、奪還挑戦という形でついに組まれた。${d.matches}度の予兆が、いま王座をめぐる一夜に集約される——記者として、これほど待たれた試合はそう多くない。本紙はこの一戦を、業界の歴史に位置づけて書く準備をしている。

### standard_rivalry.headlines[]

- `KURODA_RELATION_NARRATIVE.standard_rivalry.headlines[1]`: 拮抗する数字、燃える夜
- `KURODA_RELATION_NARRATIVE.standard_rivalry.headlines[2]`: 業界の中堅戦線、目が離せない
- `KURODA_RELATION_NARRATIVE.standard_rivalry.headlines[3]`: ${d.charA}と${d.charB}——譲らぬ二人の記録
- `KURODA_RELATION_NARRATIVE.standard_rivalry.headlines[4]`: ${d.matches}戦の蓄積、まだ終わらない
- `KURODA_RELATION_NARRATIVE.standard_rivalry.headlines[5]`: 互角の数字が告げる、関係の質

### standard_rivalry.bodies[]

- `KURODA_RELATION_NARRATIVE.standard_rivalry.bodies[1]`: ${d.matches}度の対戦で${d.bestMQ}点を記録。次戦も注目に値すると本紙は見ている。
- `KURODA_RELATION_NARRATIVE.standard_rivalry.bodies[2]`: ${d.years}年来のライバル関係。${d.matches}試合分の蓄積が、次の一戦を意味あるものにしている。
- `KURODA_RELATION_NARRATIVE.standard_rivalry.bodies[3]`: 通算${d.matches}戦、最高評価${d.bestMQ}点。数字が示すのは、両者がリングで一切妥協していないという事実である。本紙としては、これを「健全な競争」と呼んで差し支えないと見ている。
- `KURODA_RELATION_NARRATIVE.standard_rivalry.bodies[4]`: 「次は獲る」——どちらかが必ずそう言う関係。${d.matches}度の対戦が、その言葉を絵空事ではなく現実の重みに変えている。数字は嘘をつかない。
- `KURODA_RELATION_NARRATIVE.standard_rivalry.bodies[5]`: ${d.charA}と${d.charB}。互いを「壁」と認識している関係は、得てして業界全体を引き上げる。本紙が${d.years}年見続けている理由が、そこにある。

### standard_rivalry.contexts.factionWar.headlines[]

- `KURODA_RELATION_NARRATIVE.standard_rivalry.contexts.factionWar.headlines[1]`: 派閥同士のメンツがぶつかる、中堅戦線の主役
- `KURODA_RELATION_NARRATIVE.standard_rivalry.contexts.factionWar.headlines[2]`: ${d.charA}と${d.charB}——抗争の中の現実的な指標
- `KURODA_RELATION_NARRATIVE.standard_rivalry.contexts.factionWar.headlines[3]`: 団体内の力学を映す、互角の対峙

### standard_rivalry.contexts.factionWar.bodies[]

- `KURODA_RELATION_NARRATIVE.standard_rivalry.contexts.factionWar.bodies[1]`: 派閥抗争の中で、${d.charA}と${d.charB}の対戦は両陣営の力量を測る指標になっている。${d.matches}度の対戦記録は、抗争という構図のもとで新たな意味を持ち始めた——本紙はそう書いておく。

### standard_rivalry.contexts.reclaiming.headlines[]

- `KURODA_RELATION_NARRATIVE.standard_rivalry.contexts.reclaiming.headlines[1]`: 奪還挑戦という大舞台で、再び向き合う
- `KURODA_RELATION_NARRATIVE.standard_rivalry.contexts.reclaiming.headlines[2]`: ${d.charA}と${d.charB}——蓄積された対戦が、王座を懸ける夜

### standard_rivalry.contexts.reclaiming.bodies[]

- `KURODA_RELATION_NARRATIVE.standard_rivalry.contexts.reclaiming.bodies[1]`: ${d.matches}度の積み重ねが、いま奪還挑戦という形で集約される。${d.charA}と${d.charB}の互角の数字が、王座という最大の懸け値の下で試される——本紙はこの一戦を、業界の重要な分岐点として注視している。

### mutual_respect.headlines[]

- `KURODA_RELATION_NARRATIVE.mutual_respect.headlines[1]`: 静かな信頼、淡い競争
- `KURODA_RELATION_NARRATIVE.mutual_respect.headlines[2]`: 穏やかに、しかし確かに意識し合う
- `KURODA_RELATION_NARRATIVE.mutual_respect.headlines[3]`: ${d.charA}と${d.charB}——成熟した関係の見本
- `KURODA_RELATION_NARRATIVE.mutual_respect.headlines[4]`: 言葉なき敬意、リングの上での対話
- `KURODA_RELATION_NARRATIVE.mutual_respect.headlines[5]`: 静謐な競争、それでも目が離せない

### mutual_respect.bodies[]

- `KURODA_RELATION_NARRATIVE.mutual_respect.bodies[1]`: 穏やかな関係。リングで会っても、過度な熱は持ち込まない。${d.matches}度の対戦は、いずれも業界の良質な見本となっている。
- `KURODA_RELATION_NARRATIVE.mutual_respect.bodies[2]`: ${d.charA}と${d.charB}——互いを認める静かな関係。本紙としては、こうした成熟も評価したい。
- `KURODA_RELATION_NARRATIVE.mutual_respect.bodies[3]`: ${d.matches}度のリングで、両者は確実に「敬意」を交わし続けてきた。激しさはないが、確かさはある——本紙はそう書いておく。
- `KURODA_RELATION_NARRATIVE.mutual_respect.bodies[4]`: ${d.bestMQ}点という最高評価が示すのは、穏やかな関係でも質の高い試合は成立するという事実だ。${d.years}年の付き合いが、それを支えている。
- `KURODA_RELATION_NARRATIVE.mutual_respect.bodies[5]`: 業界には、こういう関係も必要だ。派手ではないが、確実に互いを高め合う——本紙としては、もっと注目されてもいいと書いておく。

### mutual_respect.contexts.repaired.headlines[]

- `KURODA_RELATION_NARRATIVE.mutual_respect.contexts.repaired.headlines[1]`: 静かな信頼、亀裂を経てより確かなものに
- `KURODA_RELATION_NARRATIVE.mutual_respect.contexts.repaired.headlines[2]`: ${d.charA}と${d.charB}——一度ずれたあと、しっかり並び直した

### mutual_respect.contexts.repaired.bodies[]

- `KURODA_RELATION_NARRATIVE.mutual_respect.contexts.repaired.bodies[1]`: ${d.charA}と${d.charB}の関係は、一度小さく揺らいだ。だが社長の手で結び直されたあと、二人は以前にも増して落ち着いた距離感でリングを共有している。${d.matches}度の対戦の重みが、この修復後の静けさを支えている——本紙はそう書いておく。

### mutual_respect.contexts.betrayed.headlines[]

- `KURODA_RELATION_NARRATIVE.mutual_respect.contexts.betrayed.headlines[1]`: 団体を分けても、敬意は残った
- `KURODA_RELATION_NARRATIVE.mutual_respect.contexts.betrayed.headlines[2]`: ${d.charA}と${d.charB}——別の旗の下でも、視線は変わらない

### mutual_respect.contexts.betrayed.bodies[]

- `KURODA_RELATION_NARRATIVE.mutual_respect.contexts.betrayed.bodies[1]`: ${d.charA}が団体を移ったあとも、${d.charB}は彼女についての評価を一切下げていない——むしろ、距離があるほうが互いを正しく見られると感じているふしがある。${d.matches}度の対戦の積み重ねが、こういう成熟した関係を生んだ。本紙はそう書いておく。

### cold_rivalry.headlines[]

- `KURODA_RELATION_NARRATIVE.cold_rivalry.headlines[1]`: 熱くはないが、冷たい二人
- `KURODA_RELATION_NARRATIVE.cold_rivalry.headlines[2]`: 淡々と、しかし距離は縮まらない
- `KURODA_RELATION_NARRATIVE.cold_rivalry.headlines[3]`: ${d.charA}と${d.charB}——温度なき競争
- `KURODA_RELATION_NARRATIVE.cold_rivalry.headlines[4]`: 言葉も交わさず、視線も合わせず
- `KURODA_RELATION_NARRATIVE.cold_rivalry.headlines[5]`: ${d.matches}戦、それでも距離は変わらない

### cold_rivalry.bodies[]

- `KURODA_RELATION_NARRATIVE.cold_rivalry.bodies[1]`: 淡々と試合をして、淡々と別れる。それでいて、目は合わない。${d.matches}度の対戦が、その距離を埋めることはなかった。
- `KURODA_RELATION_NARRATIVE.cold_rivalry.bodies[2]`: ${d.years}年の付き合いの中で、二人の間に温度が宿った瞬間はない。本紙としては、それでも興味深い関係だと書いておく。
- `KURODA_RELATION_NARRATIVE.cold_rivalry.bodies[3]`: ${d.matches}度のリングで一度も笑顔の握手はない。とはいえ、明確な敵意もない——記者として40年見てきた中で、これほど温度のない関係は珍しい。
- `KURODA_RELATION_NARRATIVE.cold_rivalry.bodies[4]`: 通算${d.bestMQ}点。数字としては悪くない。だが、二人の間の空気は、いつまでも凍ったままだ。本紙はそう書いておく。
- `KURODA_RELATION_NARRATIVE.cold_rivalry.bodies[5]`: 「あの選手については、特にコメントはない」——どちらかが、いや、おそらく両者がそう言うだろう。${d.years}年の付き合いの結論が、それである。

### cold_rivalry.contexts.betrayed.headlines[]

- `KURODA_RELATION_NARRATIVE.cold_rivalry.contexts.betrayed.headlines[1]`: 離脱を経ても、温度は変わらない
- `KURODA_RELATION_NARRATIVE.cold_rivalry.contexts.betrayed.headlines[2]`: ${d.charA}と${d.charB}——別の旗の下でも、相変わらず冷たい

### cold_rivalry.contexts.betrayed.bodies[]

- `KURODA_RELATION_NARRATIVE.cold_rivalry.contexts.betrayed.bodies[1]`: 団体が分かれてからも、${d.charA}と${d.charB}の関係は何も変わらない。${d.matches}度の冷えた対戦記録が、別の旗の下でも同じ温度で続くだけだ。${d.years}年来の距離感は、団体という枠組みすら越えて維持されている——皮肉な意味で、それは「一貫性」と呼べるかもしれない。

### cold_rivalry.contexts.lockerStress.headlines[]

- `KURODA_RELATION_NARRATIVE.cold_rivalry.contexts.lockerStress.headlines[1]`: 荒れた控室、温度なき距離
- `KURODA_RELATION_NARRATIVE.cold_rivalry.contexts.lockerStress.headlines[2]`: ${d.charA}と${d.charB}——団体の不協和音の一部

### cold_rivalry.contexts.lockerStress.bodies[]

- `KURODA_RELATION_NARRATIVE.cold_rivalry.contexts.lockerStress.bodies[1]`: 団体内のロッカールームが冷えきったいま、${d.charA}と${d.charB}の冷淡な関係も、その不協和音の一部として機能している。${d.matches}度の対戦が、控室の空気にじわじわ染み出している——記者として、これは座視できない状態である。

### casual_rivalry.headlines[]

- `KURODA_RELATION_NARRATIVE.casual_rivalry.headlines[1]`: 業界の通常運転
- `KURODA_RELATION_NARRATIVE.casual_rivalry.headlines[2]`: 特筆すべきこともなく、しかし
- `KURODA_RELATION_NARRATIVE.casual_rivalry.headlines[3]`: ${d.charA}と${d.charB}——日常の小競り合い
- `KURODA_RELATION_NARRATIVE.casual_rivalry.headlines[4]`: ${d.matches}戦、業界の標準的な記録
- `KURODA_RELATION_NARRATIVE.casual_rivalry.headlines[5]`: 静かに続く、ライバル関係の典型

### casual_rivalry.bodies[]

- `KURODA_RELATION_NARRATIVE.casual_rivalry.bodies[1]`: 特筆すべきこともなく、しかし完全な無関心でもない。${d.matches}度の対戦は、業界の日常の一部である。
- `KURODA_RELATION_NARRATIVE.casual_rivalry.bodies[2]`: ${d.charA}と${d.charB}の関係は、業界の標準的なライバル関係。本紙としては、それ以上でも以下でもないと見ている。
- `KURODA_RELATION_NARRATIVE.casual_rivalry.bodies[3]`: 通算${d.matches}戦。${d.bestMQ}点という数字は、どちらの選手にとっても通常運転の範囲内である。だが、それでも組まれ続けるのは、観客が一定の関心を持っているからだろう。
- `KURODA_RELATION_NARRATIVE.casual_rivalry.bodies[4]`: ${d.years}年来の関係だが、特別なエピソードはほとんどない。それが悪いとは言わない——業界には、こういう「日常」を支える関係も必要なのだから。
- `KURODA_RELATION_NARRATIVE.casual_rivalry.bodies[5]`: 本紙としては、この二人の関係を「業界の地層」と呼んでおきたい。派手さはないが、いずれ何かのきっかけで火が点く可能性は、常にある。

## `FAN_OPINIONS`

- 出典: `src/kuroda-text.js`
- コード内コメント: 5. ファン世論（FAN_OPINIONS）
- 本数: 148

### devastating.neutral[]

- `FAN_OPINIONS.devastating.neutral[1]`: ${d.rivalName}と比べるのはさすがにかわいそうじゃない？
- `FAN_OPINIONS.devastating.neutral[2]`: 応援してるけど、正直見てられない差だよね…
- `FAN_OPINIONS.devastating.neutral[3]`: ${d.playerName}、頑張ってるのは分かるんだけどなあ
- `FAN_OPINIONS.devastating.neutral[4]`: 今の状態で${d.rivalName}と当たったらどうなるか、考えたくもない
- `FAN_OPINIONS.devastating.neutral[5]`: いつか追いつくと思ってたけど、いつなんだろう…
- `FAN_OPINIONS.devastating.neutral[6]`: 推しを変えようかなって、ちょっと思っちゃった
- `FAN_OPINIONS.devastating.neutral[7]`: 応援するの疲れてきた…

### devastating.hardcore[]

- `FAN_OPINIONS.devastating.hardcore[1]`: 全指標で劣勢。構造的な問題だから補強だけじゃ解決しないぞこれ
- `FAN_OPINIONS.devastating.hardcore[2]`: エースの差がそのまま団体の差になってる。ここを何とかしないと永遠にこのまま
- `FAN_OPINIONS.devastating.hardcore[3]`: 数字見たら分かるけど、選手層の差が一番キツい。中堅がいない
- `FAN_OPINIONS.devastating.hardcore[4]`: ${d.rivalName}のTOP5平均と比較してみ？ 話にならんから
- `FAN_OPINIONS.devastating.hardcore[5]`: データ的には3年計画で見ないと追いつけない差。覚悟が要る
- `FAN_OPINIONS.devastating.hardcore[6]`: 育成方針そのものを見直すべきフェーズ。場当たりじゃ無理
- `FAN_OPINIONS.devastating.hardcore[7]`: スカウト基準が他団体と違いすぎる。根本的な分析が要る

### devastating.troll[]

- `FAN_OPINIONS.devastating.troll[1]`: ${d.playerName}と${d.rivalName}比較するの、もうやめてあげてwww
- `FAN_OPINIONS.devastating.troll[2]`: 逆に聞きたい。${d.rivalName}に勝てるポイントってどこ？
- `FAN_OPINIONS.devastating.troll[3]`: 練習試合ならともかく、ガチでやったら3タテ食らうだろ
- `FAN_OPINIONS.devastating.troll[4]`: 解散届出してこいよもう
- `FAN_OPINIONS.devastating.troll[5]`: ${d.rivalName}がかわいそうだからこの比較やめよ？
- `FAN_OPINIONS.devastating.troll[6]`: 弱すぎて逆に応援したくなる。ならないけど
- `FAN_OPINIONS.devastating.troll[7]`: どこに課金すれば強くなんの？
- `FAN_OPINIONS.devastating.troll[8]`: ${d.playerName}の存在意義って${d.rivalName}の引き立て役？
- `FAN_OPINIONS.devastating.troll[9]`: ${d.playerName}って団体名じゃなくてジャンル名だよね。「弱い」っていうジャンル
- `FAN_OPINIONS.devastating.troll[10]`: 比較する意味ある？ 結果分かってるじゃん
- `FAN_OPINIONS.devastating.troll[11]`: ${d.rivalName}のファンだけど、正直こっち見てない。存在感なさすぎ
- `FAN_OPINIONS.devastating.troll[12]`: 来季も同じ記事書かれるに100万
- `FAN_OPINIONS.devastating.troll[13]`: せめて1項目くらい勝ってるとこ見せてくれよ…あ、ないか
- `FAN_OPINIONS.devastating.troll[14]`: ${d.playerName}の試合見るのテレビの音消してても変わらんわ
- `FAN_OPINIONS.devastating.troll[15]`: ${d.rivalName}との対抗戦組まれたら離脱者続出するんじゃないの

### devastating.hopeful[]

- `FAN_OPINIONS.devastating.hopeful[1]`: 今は差があるけど、ここからの成長が楽しみだよ！
- `FAN_OPINIONS.devastating.hopeful[2]`: 推しの団体だから応援する。逆境こそ燃えるでしょ
- `FAN_OPINIONS.devastating.hopeful[3]`: 1年前よりは確実に良くなってる…はず…多分…
- `FAN_OPINIONS.devastating.hopeful[4]`: 弱い時から応援してた人間が最後に笑うんだよ。きっと
- `FAN_OPINIONS.devastating.hopeful[5]`: 今が底なら、あとは上がるだけだから！ ……上がるよね？
- `FAN_OPINIONS.devastating.hopeful[6]`: ${d.rivalName}だって最初から強かったわけじゃないし…
- `FAN_OPINIONS.devastating.hopeful[7]`: 笑いたきゃ笑え。でも絶対にここから上がるから。見てろ
- `FAN_OPINIONS.devastating.hopeful[8]`: 数字とか知らん。推しは推し。それだけ
- `FAN_OPINIONS.devastating.hopeful[9]`: 弱い時代を一緒に過ごしたファンが一番強いんだよ
- `FAN_OPINIONS.devastating.hopeful[10]`: 下剋上の物語を信じてる。物語は弱者から始まるんだ
- `FAN_OPINIONS.devastating.hopeful[11]`: ここから這い上がる物語を見たいから、私は離れない

### behind.neutral[]

- `FAN_OPINIONS.behind.neutral[1]`: 差はあるけど、去年よりは良くなってるよね
- `FAN_OPINIONS.behind.neutral[2]`: ${d.rivalName}は強いけど、こっちも見どころはあると思う
- `FAN_OPINIONS.behind.neutral[3]`: もうちょっとで追いつけそうなんだけどなあ
- `FAN_OPINIONS.behind.neutral[4]`: 次の補強でどこまで変わるか気になる
- `FAN_OPINIONS.behind.neutral[5]`: 頑張ってるのは分かるんだけど、結果が出ないとなあ
- `FAN_OPINIONS.behind.neutral[6]`: 応援団としては期待半分、不安半分って感じ

### behind.hardcore[]

- `FAN_OPINIONS.behind.hardcore[1]`: 弱点は明確。${d.rivalName}の得意分野で真っ向勝負を避けて、得意な軸で勝負すべき
- `FAN_OPINIONS.behind.hardcore[2]`: 数字的にはまだ追える差。ただ補強の方向性を間違えると致命傷
- `FAN_OPINIONS.behind.hardcore[3]`: 中堅の底上げが急務。エースだけ強くても団体力では勝てない
- `FAN_OPINIONS.behind.hardcore[4]`: ドラフトの目利きが鍵。即戦力と将来性のバランスを見極めないと
- `FAN_OPINIONS.behind.hardcore[5]`: ${d.rivalName}との戦力差は3-5pt帯。ここを縮めるには集中投資しかない
- `FAN_OPINIONS.behind.hardcore[6]`: 相手の弱点突くカード編成ができるGMかどうかが分水嶺

### behind.troll[]

- `FAN_OPINIONS.behind.troll[1]`: 惜しいんだよなー。惜しいで終わるのがこの団体
- `FAN_OPINIONS.behind.troll[2]`: 万年2位の匂いがするんだよなあ…
- `FAN_OPINIONS.behind.troll[3]`: いつも「あと一歩」って言ってない？ その一歩いつ出るの？
- `FAN_OPINIONS.behind.troll[4]`: ${d.rivalName}に勝てるようになったら起こして
- `FAN_OPINIONS.behind.troll[5]`: 「あと一歩」が口癖の団体第1位
- `FAN_OPINIONS.behind.troll[6]`: 追いつきそうで追いつかないの才能だよね
- `FAN_OPINIONS.behind.troll[7]`: ${d.rivalName}が転ぶのを待つ戦略ですか？
- `FAN_OPINIONS.behind.troll[8]`: ${d.playerName}って名前覚えてもらえてるだけマシなのか
- `FAN_OPINIONS.behind.troll[9]`: 永遠の挑戦者ポジション、もう何年目？

### behind.hopeful[]

- `FAN_OPINIONS.behind.hopeful[1]`: 差は縮まってる！ あと少しで追いつける！
- `FAN_OPINIONS.behind.hopeful[2]`: 今のメンバーならやれる。信じてる
- `FAN_OPINIONS.behind.hopeful[3]`: ${d.rivalName}だっていつかは落ちてくるし、こっちは上がるだけ
- `FAN_OPINIONS.behind.hopeful[4]`: エースが覚醒したら一気にひっくり返せるポテンシャルはある
- `FAN_OPINIONS.behind.hopeful[5]`: 去年よりは確実にマシ。このペースなら来年には…！
- `FAN_OPINIONS.behind.hopeful[6]`: 応援しがいがあるってこういうことだよね。楽な団体を応援しても面白くない
- `FAN_OPINIONS.behind.hopeful[7]`: ${d.rivalName}の背中が見えてきた。あと少し、あと少しだから
- `FAN_OPINIONS.behind.hopeful[8]`: この距離感、追いつく直前が一番ワクワクする
- `FAN_OPINIONS.behind.hopeful[9]`: ジャイアントキリングをこの目で見るために通ってる

### even.neutral[]

- `FAN_OPINIONS.even.neutral[1]`: いい勝負になりそうで楽しみ！
- `FAN_OPINIONS.even.neutral[2]`: どっちが勝ってもおかしくないのがワクワクする
- `FAN_OPINIONS.even.neutral[3]`: 最近ほんとに力が拮抗してて面白い
- `FAN_OPINIONS.even.neutral[4]`: ${d.rivalName}とのライバル関係が熱い
- `FAN_OPINIONS.even.neutral[5]`: 次の対抗戦が今から楽しみで仕方ない
- `FAN_OPINIONS.even.neutral[6]`: どっちが勝つか読めない試合、これがプロレスの醍醐味

### even.hardcore[]

- `FAN_OPINIONS.even.hardcore[1]`: TOP5の実力は互角。あとはカード編成とコンディション管理の差だな
- `FAN_OPINIONS.even.hardcore[2]`: 数値的には僅差。こういう時はGMの采配で勝敗が分かれる
- `FAN_OPINIONS.even.hardcore[3]`: 互角の戦力だからこそ、一つのブレイクスルーが流れを変える
- `FAN_OPINIONS.even.hardcore[4]`: 選手層の差がわずかにある。ここをどう埋めるかがポイント
- `FAN_OPINIONS.even.hardcore[5]`: 5番手以下の比較で僅かに有利。地力勝負は意外と${d.playerName}寄り
- `FAN_OPINIONS.even.hardcore[6]`: タイトル防衛回数で見ると経験値はほぼ同じ。実績ベースで互角

### even.troll[]

- `FAN_OPINIONS.even.troll[1]`: 互角って要するにどっちも決め手がないってことでしょ
- `FAN_OPINIONS.even.troll[2]`: 決着放棄上等の塩試合フラグ立ってない？
- `FAN_OPINIONS.even.troll[3]`: ${d.rivalName}と同レベルで満足してる時点でなあ
- `FAN_OPINIONS.even.troll[4]`: 互角で喜んでるの草。上を目指せよ
- `FAN_OPINIONS.even.troll[5]`: 並んだだけで「追いついた！」って騒ぐファン見てると微笑ましいね
- `FAN_OPINIONS.even.troll[6]`: 拮抗してるっていうか、どっちも決め手がないだけでは
- `FAN_OPINIONS.even.troll[7]`: ${d.rivalName}側からは「対等」と見なされてないという事実
- `FAN_OPINIONS.even.troll[8]`: 数字は互角でも空気感では完全に格下扱いされてる説

### even.hopeful[]

- `FAN_OPINIONS.even.hopeful[1]`: ここで勝ち越せたら一気に流れが来る！
- `FAN_OPINIONS.even.hopeful[2]`: 互角まで持ってきたのがまずすごい。ここからもう一段！
- `FAN_OPINIONS.even.hopeful[3]`: ${d.playerName}の方が勢いあるし、いけるでしょ！
- `FAN_OPINIONS.even.hopeful[4]`: この均衡を崩す一撃、楽しみにしてる
- `FAN_OPINIONS.even.hopeful[5]`: ${d.rivalName}と肩を並べてる！ もうそれだけで誇らしい
- `FAN_OPINIONS.even.hopeful[6]`: 次の興行で抜け出すのはこっち。根拠はないけど確信してる

### ahead.neutral[]

- `FAN_OPINIONS.ahead.neutral[1]`: 強くなったなあ。見てて安心感がある
- `FAN_OPINIONS.ahead.neutral[2]`: ${d.rivalName}より上にいるの、素直に嬉しい
- `FAN_OPINIONS.ahead.neutral[3]`: このまま突き放してほしい
- `FAN_OPINIONS.ahead.neutral[4]`: いい時期だよね。この調子を維持してほしい
- `FAN_OPINIONS.ahead.neutral[5]`: 胸を張って応援できるって、こんなに嬉しいことなんだ
- `FAN_OPINIONS.ahead.neutral[6]`: ${d.rivalName}を見下ろせる日が来るなんて、感慨深いわ

### ahead.hardcore[]

- `FAN_OPINIONS.ahead.hardcore[1]`: リードしてるうちに次世代を育てないと、2〜3年後に逆転される可能性がある
- `FAN_OPINIONS.ahead.hardcore[2]`: ${d.rivalName}は若手の伸びが著しい。油断してると一気に追いつかれるぞ
- `FAN_OPINIONS.ahead.hardcore[3]`: 今の優位を確固たるものにするなら、もう一人スターが要る
- `FAN_OPINIONS.ahead.hardcore[4]`: データ的には安定期。維持するための投資を怠らないことが大事
- `FAN_OPINIONS.ahead.hardcore[5]`: エースの年齢層を考えると、3年後の絵が描けてないのが懸念点
- `FAN_OPINIONS.ahead.hardcore[6]`: 今のリード幅は3-5pt。詰められると一気に互角に戻るので警戒

### ahead.troll[]

- `FAN_OPINIONS.ahead.troll[1]`: ${d.rivalName}ざっこwww もう相手にならんでしょ
- `FAN_OPINIONS.ahead.troll[2]`: 格の違いってやつですわ
- `FAN_OPINIONS.ahead.troll[3]`: 強い。強いんだけど、なんかマンネリ感あるのは俺だけ？
- `FAN_OPINIONS.ahead.troll[4]`: ${d.rivalName}ファンの皆さん、ご愁傷さまです
- `FAN_OPINIONS.ahead.troll[5]`: 差がつくと見てて気持ちいいわ。もっと離せ
- `FAN_OPINIONS.ahead.troll[6]`: ${d.rivalName}、来年は頑張れよ（棒）
- `FAN_OPINIONS.ahead.troll[7]`: 毎週同じ展開で勝ってるから、観てて飽きてきたまである
- `FAN_OPINIONS.ahead.troll[8]`: ${d.rivalName}に勝っても${d.playerName}の格は上がらない説

### ahead.hopeful[]

- `FAN_OPINIONS.ahead.hopeful[1]`: ここまで来るの長かったけど、報われてる感がある！
- `FAN_OPINIONS.ahead.hopeful[2]`: 上にいる景色は最高。もっと上を目指そう！
- `FAN_OPINIONS.ahead.hopeful[3]`: ${d.playerName}の時代が来てる。これは間違いない
- `FAN_OPINIONS.ahead.hopeful[4]`: この勢いなら${d.rivalName}を完全に置き去りにできる
- `FAN_OPINIONS.ahead.hopeful[5]`: 業界トップを目指せる位置にいる。胸熱でしかない

### dominant.neutral[]

- `FAN_OPINIONS.dominant.neutral[1]`: もう圧倒的だよね。安心して見てられる
- `FAN_OPINIONS.dominant.neutral[2]`: ${d.rivalName}がかわいそうに見えてきた
- `FAN_OPINIONS.dominant.neutral[3]`: ここまで差がつくとは思わなかった。すごい
- `FAN_OPINIONS.dominant.neutral[4]`: 最強って言い切っていいレベルじゃない？
- `FAN_OPINIONS.dominant.neutral[5]`: 他の試合見ても物足りなく感じるくらい${d.playerName}が別格
- `FAN_OPINIONS.dominant.neutral[6]`: この強さがいつまで続くか、それだけが心配

### dominant.hardcore[]

- `FAN_OPINIONS.dominant.hardcore[1]`: 全指標でリード。課題があるとすれば、強すぎて切磋琢磨の相手がいないこと
- `FAN_OPINIONS.dominant.hardcore[2]`: 一強時代の到来。次は他団体がどう対策してくるかを見たい
- `FAN_OPINIONS.dominant.hardcore[3]`: ここまでの優位を築いた育成方針は研究に値する。他団体のGMは見習え
- `FAN_OPINIONS.dominant.hardcore[4]`: 安泰に見えるけど、主力のピーク過ぎが重なる2年後が怖い。今から手を打つべき
- `FAN_OPINIONS.dominant.hardcore[5]`: 次世代エース候補が育ってないと、世代交代で一気に転落するリスクがある
- `FAN_OPINIONS.dominant.hardcore[6]`: 業界全体の活性化のためにも、敢えて${d.rivalName}を引き上げる仕掛けが要る

### dominant.troll[]

- `FAN_OPINIONS.dominant.troll[1]`: ${d.rivalName}は完全に噛ませ犬。もう比較する意味なくない？
- `FAN_OPINIONS.dominant.troll[2]`: 無双状態。つまんないくらい強いわ
- `FAN_OPINIONS.dominant.troll[3]`: ${d.playerName}に勝てる団体、存在する？
- `FAN_OPINIONS.dominant.troll[4]`: ワンサイドゲーム確定。${d.rivalName}ファンは見ないほうがいい
- `FAN_OPINIONS.dominant.troll[5]`: 強すぎてもう試合に緊張感ないわ
- `FAN_OPINIONS.dominant.troll[6]`: ${d.rivalName}は出てくる前から負けてる。哀れすぎる

### dominant.hopeful[]

- `FAN_OPINIONS.dominant.hopeful[1]`: ずっと応援してきたからこそ、この景色が嬉しい…！
- `FAN_OPINIONS.dominant.hopeful[2]`: 弱い時代を知ってるから余計に感慨深い
- `FAN_OPINIONS.dominant.hopeful[3]`: 最強の座、守り続けよう！
- `FAN_OPINIONS.dominant.hopeful[4]`: 古参ファンの私、号泣してる。ここまで来たんだね…
- `FAN_OPINIONS.dominant.hopeful[5]`: あの頃ボロクソ言われてた時代から応援してきた甲斐があった…
- `FAN_OPINIONS.dominant.hopeful[6]`: 強い時代の応援は楽しいけど、弱い時代を知ってるからこそ沁みる
- `FAN_OPINIONS.dominant.hopeful[7]`: 黒田記者が褒めてる…！ 何か悪いこと起きそうで逆に怖い
- `FAN_OPINIONS.dominant.hopeful[8]`: この団体を応援してきて本当によかった。涙が出る
- `FAN_OPINIONS.dominant.hopeful[9]`: ${d.playerName}が業界を引っ張ってる。誇らしい

## `NEWSPAPER_DIGEST_COMMENTS`

- 出典: `src/kuroda-text.js`
- コード内コメント: 6. 新聞ダイジェスト1行コメント（NEWSPAPER_DIGEST_COMMENTS）
- 本数: 61

### great[]

- `NEWSPAPER_DIGEST_COMMENTS.great[1]`: 今興行のベストバウトはこの試合かもしれない
- `NEWSPAPER_DIGEST_COMMENTS.great[2]`: 予想以上の好勝負。両者の株が上がった
- `NEWSPAPER_DIGEST_COMMENTS.great[3]`: 隠れた名勝負。メインに引けを取らない内容だった
- `NEWSPAPER_DIGEST_COMMENTS.great[4]`: ${d.winnerName}の充実ぶりが光った一戦
- `NEWSPAPER_DIGEST_COMMENTS.great[5]`: 観客を総立ちにさせた試合内容。文句なし
- `NEWSPAPER_DIGEST_COMMENTS.great[6]`: これだけのMQを叩き出せるカードが中盤にある。層が厚い証拠だ
- `NEWSPAPER_DIGEST_COMMENTS.great[7]`: 記者席も思わず前のめりになった。いい試合だった
- `NEWSPAPER_DIGEST_COMMENTS.great[8]`: ${d.winnerName}も${d.loserName}も、この試合で評価を上げた
- `NEWSPAPER_DIGEST_COMMENTS.great[9]`: メインを食った。この試合が一番面白かったという声も多いはず
- `NEWSPAPER_DIGEST_COMMENTS.great[10]`: 試合後、拍手が鳴り止まなかった。それが全てを物語っている
- `NEWSPAPER_DIGEST_COMMENTS.great[11]`: こういう試合があるから、全試合見る価値がある

### good[]

- `NEWSPAPER_DIGEST_COMMENTS.good[1]`: 堅実な好勝負。安心して見ていられた
- `NEWSPAPER_DIGEST_COMMENTS.good[2]`: ${d.winnerName}が力を見せた。${d.loserName}も健闘
- `NEWSPAPER_DIGEST_COMMENTS.good[3]`: 期待通りの内容。両者ともよく準備してきた印象
- `NEWSPAPER_DIGEST_COMMENTS.good[4]`: 見応えのある一戦。この調子を維持してほしい
- `NEWSPAPER_DIGEST_COMMENTS.good[5]`: いい試合だった。カード編成が当たった形
- `NEWSPAPER_DIGEST_COMMENTS.good[6]`: 中盤を締めるにふさわしい内容

### average[]

- `NEWSPAPER_DIGEST_COMMENTS.average[1]`: 無難にまとめた一戦
- `NEWSPAPER_DIGEST_COMMENTS.average[2]`: 大きな波乱なし。予想通りの展開だった
- `NEWSPAPER_DIGEST_COMMENTS.average[3]`: 可もなく不可もなく。印象に残るかと言われると微妙
- `NEWSPAPER_DIGEST_COMMENTS.average[4]`: ${d.winnerName}が順当に勝利。特筆すべき点は少ない
- `NEWSPAPER_DIGEST_COMMENTS.average[5]`: 普通の試合。良くも悪くもない
- `NEWSPAPER_DIGEST_COMMENTS.average[6]`: 見どころは少なかったが、大きな不満もない
- `NEWSPAPER_DIGEST_COMMENTS.average[7]`: 中盤の試合としては及第点
- `NEWSPAPER_DIGEST_COMMENTS.average[8]`: 特別な見どころはなかったが、手堅い試合運びだった
- `NEWSPAPER_DIGEST_COMMENTS.average[9]`: ${d.winnerName}が順当に勝利。特にサプライズはない
- `NEWSPAPER_DIGEST_COMMENTS.average[10]`: 可もなく不可もなく。次の試合への繋ぎとしては機能した
- `NEWSPAPER_DIGEST_COMMENTS.average[11]`: 淡々とした展開。良くも悪くも予定調和だった

### poor[]

- `NEWSPAPER_DIGEST_COMMENTS.poor[1]`: 物足りなさが残る。噛み合わなかった印象
- `NEWSPAPER_DIGEST_COMMENTS.poor[2]`: 観客の反応は薄かった
- `NEWSPAPER_DIGEST_COMMENTS.poor[3]`: ${d.winnerName}は勝ったが、内容には課題が残る
- `NEWSPAPER_DIGEST_COMMENTS.poor[4]`: 期待を下回る試合。次に期待するしかない
- `NEWSPAPER_DIGEST_COMMENTS.poor[5]`: 盛り上がりに欠ける展開だった。カードの相性が悪かったか
- `NEWSPAPER_DIGEST_COMMENTS.poor[6]`: 正直、もう少し見せてほしかった
- `NEWSPAPER_DIGEST_COMMENTS.poor[7]`: カードほどの期待には応えられなかった印象
- `NEWSPAPER_DIGEST_COMMENTS.poor[8]`: 見せ場が少なかった。もう少し工夫が欲しかった
- `NEWSPAPER_DIGEST_COMMENTS.poor[9]`: ${d.winnerName}の勝利だが、内容面では課題が残る

### bad[]

- `NEWSPAPER_DIGEST_COMMENTS.bad[1]`: カード編成に問題があったんじゃないか
- `NEWSPAPER_DIGEST_COMMENTS.bad[2]`: 退屈な試合。ファンの時間を返してほしいレベル
- `NEWSPAPER_DIGEST_COMMENTS.bad[3]`: ${d.loserName}は何をしに来たのか。一方的すぎる
- `NEWSPAPER_DIGEST_COMMENTS.bad[4]`: この内容でお金を取るのは厳しい
- `NEWSPAPER_DIGEST_COMMENTS.bad[5]`: 見せ場なし。早く忘れたい一戦
- `NEWSPAPER_DIGEST_COMMENTS.bad[6]`: 興行のテンポを完全に殺した試合だった
- `NEWSPAPER_DIGEST_COMMENTS.bad[7]`: なぜこのカードを組んだのか理解に苦しむ
- `NEWSPAPER_DIGEST_COMMENTS.bad[8]`: 観客の体感時間が実際の試合時間より長かっただろう
- `NEWSPAPER_DIGEST_COMMENTS.bad[9]`: この試合がなくても興行は成立した。つまりそういうことだ

### draw[]

- `NEWSPAPER_DIGEST_COMMENTS.draw[1]`: 最後まで決着つかず。再戦必至の展開
- `NEWSPAPER_DIGEST_COMMENTS.draw[2]`: 譲らぬ両者。決着はつかなかったが、内容は十分
- `NEWSPAPER_DIGEST_COMMENTS.draw[3]`: 時間切れで決着つかず。消化不良は否めない
- `NEWSPAPER_DIGEST_COMMENTS.draw[4]`: 両者一歩も譲らず。内容は悪くなかったが、決着は見たかった
- `NEWSPAPER_DIGEST_COMMENTS.draw[5]`: 決着つかず。ファンの消化不良感は否めないが、次への伏線にはなった

### upset[]

- `NEWSPAPER_DIGEST_COMMENTS.upset[1]`: 大番狂わせ！ ${d.winnerName}が格上を食った
- `NEWSPAPER_DIGEST_COMMENTS.upset[2]`: ジャイアントキリング。${d.winnerName}の勝利は衝撃的だった
- `NEWSPAPER_DIGEST_COMMENTS.upset[3]`: 誰がこの結果を予想した？ ${d.winnerName}の金星
- `NEWSPAPER_DIGEST_COMMENTS.upset[4]`: 波乱。${d.winnerName}がこの勝利で一気にステージを上げた
- `NEWSPAPER_DIGEST_COMMENTS.upset[5]`: ${d.loserName}にとっては悪夢。${d.winnerName}にとっては人生を変える一勝だ

### dominant[]

- `NEWSPAPER_DIGEST_COMMENTS.dominant[1]`: 一方的な展開。${d.winnerName}が圧倒した
- `NEWSPAPER_DIGEST_COMMENTS.dominant[2]`: ${d.loserName}に見せ場を作らせなかった。完勝
- `NEWSPAPER_DIGEST_COMMENTS.dominant[3]`: あっという間の決着。実力差がそのまま出た

### titleMatch[]

- `NEWSPAPER_DIGEST_COMMENTS.titleMatch[1]`: 王座を懸けた一戦にふさわしい緊張感だった
- `NEWSPAPER_DIGEST_COMMENTS.titleMatch[2]`: タイトルマッチは別格の空気。両者の気迫が違った

## `NP_KURODA_BYLINE`

- 出典: `src/ui-render.js`
- コード内コメント: 黒田の署名・肩書ローテーション (用途別)
- 本数: 5

### news

- `NP_KURODA_BYLINE.news`: ——黒田幸子(週刊グラップル)

### rating

- `NP_KURODA_BYLINE.rating`: ——黒田幸子(本紙)

### editorial

- `NP_KURODA_BYLINE.editorial`: ——黒田幸子(編集部)

### rivalry

- `NP_KURODA_BYLINE.rivalry`: ——黒田幸子(本紙)

### warRecord

- `NP_KURODA_BYLINE.warRecord`: ——黒田幸子(週刊グラップル)
