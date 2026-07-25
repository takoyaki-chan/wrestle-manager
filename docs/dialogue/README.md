# セリフ抽出インデックス

`node tools/extract-dialogue.js` により `src/*.js` から自動生成。
セリフを書き直したら、このツールを再実行すれば内容が更新される(下記「再実行方法」参照)。

- 対象テーブル数: 192
- 抽出できたセリフ総本数: **16682**

## ID の読み方

各セリフのIDは `TABLE_NAME.key1.key2[n]` の形式。これは実データ(`src/*.js` 内の該当 const)のプロパティパスそのものなので、
「`CHALLENGE_REQUEST_LINES.composed.hostile[1]` をこう変えたい」のように直接指定できる。`[n]` は配列内の1始まりのインデックス。

## カテゴリ一覧

| # | カテゴリ | ファイル | テーブル数 | 本数 |
|---|---|---|---|---|
| 01 | 試合本編・勝利演出・ダメージセリフ | [01-victory-and-battle.md](./01-victory-and-battle.md) | 11 | 1592 |
| 02 | タッグマッチ | [02-tag-match.md](./02-tag-match.md) | 12 | 814 |
| 03 | 因縁・絆(Bond/Rivalry)イベント | [03-rivalry-and-relationship.md](./03-rivalry-and-relationship.md) | 9 | 769 |
| 04 | 挑戦試合(直訴・遠征) | [04-challenge-request.md](./04-challenge-request.md) | 3 | 830 |
| 05 | 引退・引き抜き・引き留め | [05-retirement-and-poach.md](./05-retirement-and-poach.md) | 7 | 777 |
| 06 | 契約交渉 | [06-negotiation-and-contract.md](./06-negotiation-and-contract.md) | 3 | 480 |
| 07 | 派閥イベント | [07-faction.md](./07-faction.md) | 34 | 2508 |
| 08 | 成長・スランプ・モチベーション | [08-growth-and-emotion.md](./08-growth-and-emotion.md) | 7 | 501 |
| 09 | 表彰式・記録・ドーム到達 | [09-award-and-milestone.md](./09-award-and-milestone.md) | 6 | 698 |
| 10 | ニュース・新聞・黒田記者コラム | [10-news-and-newspaper.md](./10-news-and-newspaper.md) | 25 | 1709 |
| 11 | 選択イベント・大型イベント・社長室 | [11-choice-and-large-event.md](./11-choice-and-large-event.md) | 8 | 1036 |
| 12 | 選手経歴イベント | [12-career-event.md](./12-career-event.md) | 15 | 978 |
| 13 | Glimpse Cascade(興行後の一言) | [13-glimpse-cascade.md](./13-glimpse-cascade.md) | 3 | 674 |
| 14 | PPV・対抗戦・天頂戦・トーナメント | [14-ppv-and-war.md](./14-ppv-and-war.md) | 12 | 1520 |
| 15 | コーチ | [15-coach.md](./15-coach.md) | 12 | 562 |
| 16 | キャラクター人物設定・年代記 | [16-character-and-chronicle.md](./16-character-and-chronicle.md) | 8 | 302 |
| 17 | 関係性フラグ | [17-relationship-flags.md](./17-relationship-flags.md) | 2 | 473 |
| 18 | 経営危機・エンディング | [18-crisis-and-ending.md](./18-crisis-and-ending.md) | 6 | 258 |
| 19 | ドラフト・スカウト | [19-draft-and-scout.md](./19-draft-and-scout.md) | 3 | 51 |
| 20 | その他雰囲気テキスト | [20-misc-atmosphere.md](./20-misc-atmosphere.md) | 6 | 150 |

## テーブル別内訳

| テーブル | 出典 | カテゴリ | 本数 |
|---|---|---|---|
| `VICTORY_LINES` | `src/victory-lines.js` | 01-victory-and-battle.md | 381 |
| `SCOUT_SIGNING_LINES` | `src/victory-lines.js` | 01-victory-and-battle.md | 183 |
| `VS_EX_EMPLOYER_LINES` | `src/victory-lines.js` | 01-victory-and-battle.md | 196 |
| `DAMAGE_SERIF_LINES` | `src/battle-lines.js` | 01-victory-and-battle.md | 125 |
| `DAMAGE_VOICE_LINES` | `src/battle-lines.js` | 01-victory-and-battle.md | 28 |
| `CUTIN_LINES` | `src/battle-engine-main.js` | 01-victory-and-battle.md | 440 |
| `FINISH_SUSPENSE` | `src/battle-engine-main.js` | 01-victory-and-battle.md | 17 |
| `FAN_EXPECT_REACTIONS` | `src/data.js` | 01-victory-and-battle.md | 89 |
| `POST_MATCH_FLAVOR_LINES` | `src/data.js` | 01-victory-and-battle.md | 83 |
| `FIRST_MEET_LINES` | `src/data.js` | 01-victory-and-battle.md | 42 |
| `BESTMATCH_FLAVOR` | `src/data.js` | 01-victory-and-battle.md | 8 |
| `HOT_TAG_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 147 |
| `DOUBLE_TEAM_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 147 |
| `CUTIN_SAVE_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 147 |
| `BETRAYAL_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 141 |
| `DOUBLE_TEAM_STRIKE_COMMENTARY_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 6 |
| `DOUBLE_TEAM_THROW_COMMENTARY_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 6 |
| `DOUBLE_TEAM_SUB_COMMENTARY_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 6 |
| `DOUBLE_TEAM_AERIAL_COMMENTARY_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 6 |
| `DOUBLE_TEAM_FINISH_COMMENTARY_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 5 |
| `TAG_MATCH_WIN_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 98 |
| `TAG_MATCH_LOSS_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 98 |
| `TAG_MATCH_COMMENTARY_WIN_LINES` | `src/tag-battle-lines.js` | 02-tag-match.md | 7 |
| `RIVALRY_CONFRONTATION_LINES` | `src/data.js` | 03-rivalry-and-relationship.md | 141 |
| `RIVALRY_CONFRONTATION_LINES_70` | `src/data.js` | 03-rivalry-and-relationship.md | 79 |
| `RIVALRY_CONFRONTATION_LINES_90` | `src/data.js` | 03-rivalry-and-relationship.md | 73 |
| `RIVALRY_RESOLUTION_LINES` | `src/data.js` | 03-rivalry-and-relationship.md | 128 |
| `GOODRIVAL_RESOLUTION_LINES` | `src/data.js` | 03-rivalry-and-relationship.md | 72 |
| `BITTER_RESOLUTION_LINES` | `src/data.js` | 03-rivalry-and-relationship.md | 73 |
| `RIVALRY_MATCH_REACTION` | `src/data.js` | 03-rivalry-and-relationship.md | 67 |
| `UPSET_RIVALRY_LINES` | `src/data.js` | 03-rivalry-and-relationship.md | 71 |
| `WEEKLY_STORY_TICKER` | `src/data.js` | 03-rivalry-and-relationship.md | 65 |
| `CHALLENGE_LINES` | `src/data.js` | 04-challenge-request.md | 408 |
| `CHALLENGE_REQUEST_OPPONENT_REACTIONS` | `src/data.js` | 04-challenge-request.md | 408 |
| `CHALLENGE_REQUEST_NO_LINES` | `src/data.js` | 04-challenge-request.md | 14 |
| `RETIREMENT_LINES` | `src/data.js` | 05-retirement-and-poach.md | 246 |
| `RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE` | `src/data.js` | 05-retirement-and-poach.md | 17 |
| `POACH_REACTION_DIALOGUES` | `src/data.js` | 05-retirement-and-poach.md | 75 |
| `RETIRE_ACCEPT_LINES` | `src/data.js` | 05-retirement-and-poach.md | 156 |
| `RETIRE_REFUSE_LINES` | `src/data.js` | 05-retirement-and-poach.md | 126 |
| `RETAIN_LINES` | `src/data.js` | 05-retirement-and-poach.md | 123 |
| `VOLUNTARY_STAY_LINES` | `src/data.js` | 05-retirement-and-poach.md | 34 |
| `NEGOTIATE_LINES` | `src/data.js` | 06-negotiation-and-contract.md | 130 |
| `CONTRACT_NEGOTIATION_LINES` | `src/data.js` | 06-negotiation-and-contract.md | 329 |
| `RELEASE_INTERVIEW_LINES` | `src/data.js` | 06-negotiation-and-contract.md | 21 |
| `FACTION_TRANSITION_LINES` | `src/data.js` | 07-faction.md | 84 |
| `FACTION_F02_LINES` | `src/data.js` | 07-faction.md | 84 |
| `F07_LINES` | `src/data.js` | 07-faction.md | 1595 |
| `COMMON1_LINES` | `src/data.js` | 07-faction.md | 50 |
| `COMMON3_LINES` | `src/data.js` | 07-faction.md | 57 |
| `COMMON4_LINES` | `src/data.js` | 07-faction.md | 39 |
| `COMMON5_LINES` | `src/data.js` | 07-faction.md | 52 |
| `COMMON7_LINES` | `src/data.js` | 07-faction.md | 30 |
| `FACTION_F01_LEADER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 21 |
| `FACTION_F01_FOLLOWER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 11 |
| `FACTION_F02_LEADER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 12 |
| `FACTION_F03_SURVIVOR_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 15 |
| `FACTION_F04_TARGET_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 24 |
| `FACTION_F05_DISSIDENT_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 20 |
| `FACTION_F06_AMBIENT_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 15 |
| `FACTION_F07_LEADER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 15 |
| `FACTION_F08_LEADER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 15 |
| `FACTION_F08_PRE_MATCH_LINES_A` | `src/data-faction-dialogue.js` | 07-faction.md | 42 |
| `FACTION_F08_PRE_MATCH_LINES_B` | `src/data-faction-dialogue.js` | 07-faction.md | 33 |
| `FACTION_F08_POST_MATCH_WINNER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 33 |
| `FACTION_F08_POST_MATCH_LOSER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 34 |
| `FACTION_F09_OPENING_LINES_A` | `src/data-faction-dialogue.js` | 07-faction.md | 15 |
| `FACTION_F09_OPENING_LINES_B` | `src/data-faction-dialogue.js` | 07-faction.md | 11 |
| `FACTION_F09_MATCH_PRE_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 8 |
| `FACTION_F09_MATCH_POST_WIN_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 8 |
| `FACTION_F09_MATCH_POST_LOSE_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 6 |
| `FACTION_F09_ENDING_WIN_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 10 |
| `FACTION_F09_ENDING_LOSE_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 8 |
| `INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 18 |
| `INTERNAL_CHALLENGE_PRE_LEADER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 11 |
| `INTERNAL_CHALLENGE_POST_WINNER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 9 |
| `INTERNAL_CHALLENGE_POST_LOSER_LINES` | `src/data-faction-dialogue.js` | 07-faction.md | 21 |
| `_F01_ARCHETYPE_META` | `src/ui-common.js` | 07-faction.md | 24 |
| `_F07_INCIDENT_META` | `src/ui-common.js` | 07-faction.md | 78 |
| `BT_HINT_LINES` | `src/data.js` | 08-growth-and-emotion.md | 36 |
| `BREAKTHROUGH_LINES` | `src/data.js` | 08-growth-and-emotion.md | 39 |
| `MILESTONE_LINES` | `src/data.js` | 08-growth-and-emotion.md | 186 |
| `SLUMP_START_LINES` | `src/data.js` | 08-growth-and-emotion.md | 129 |
| `SLUMP_END_LINES` | `src/data.js` | 08-growth-and-emotion.md | 37 |
| `MOTIVATION_LOSS_LINES` | `src/data.js` | 08-growth-and-emotion.md | 38 |
| `MOTIVATION_RECOVERY_LINES` | `src/data.js` | 08-growth-and-emotion.md | 36 |
| `AWARD_LINES` | `src/data.js` | 09-award-and-milestone.md | 232 |
| `MILESTONE_EVENTS` | `src/data.js` | 09-award-and-milestone.md | 51 |
| `DOME_FIRSTSHOW_LINES` | `src/data.js` | 09-award-and-milestone.md | 146 |
| `DOME_SELLOUT_LINES` | `src/data.js` | 09-award-and-milestone.md | 146 |
| `Engine.awards._EPITHET_TEMPLATES` | `src/management.js` | 09-award-and-milestone.md | 111 |
| `CREDITS` | `src/data.js` | 09-award-and-milestone.md | 12 |
| `AI_BREAKTHROUGH_NEWS` | `src/data.js` | 10-news-and-newspaper.md | 6 |
| `AI_SLUMP_NEWS` | `src/data.js` | 10-news-and-newspaper.md | 4 |
| `AI_MOTIVATION_LOSS_NEWS` | `src/data.js` | 10-news-and-newspaper.md | 4 |
| `NEWS_TICKER_TEMPLATES` | `src/data.js` | 10-news-and-newspaper.md | 75 |
| `NEWS_HEADLINE_TEMPLATES` | `src/data.js` | 10-news-and-newspaper.md | 262 |
| `BIG_NEWS_LEAD_LINES` | `src/data.js` | 10-news-and-newspaper.md | 10 |
| `SEASON_REVIEW_LINES` | `src/data.js` | 10-news-and-newspaper.md | 61 |
| `NOTIF_EVENT_TEXTS` | `src/data.js` | 10-news-and-newspaper.md | 102 |
| `NOTIF_DIALOGUES` | `src/data.js` | 10-news-and-newspaper.md | 181 |
| `SNAPSHOT_TEXTS` | `src/data.js` | 10-news-and-newspaper.md | 184 |
| `Engine.flavor.MAGAZINE_HEADLINES` | `src/management.js` | 10-news-and-newspaper.md | 6 |
| `Engine.flavor.TV_HEADLINES` | `src/management.js` | 10-news-and-newspaper.md | 6 |
| `App._NEWSPAPER_HEADLINES` | `src/app.js` | 10-news-and-newspaper.md | 25 |
| `App._NEWSPAPER_ARTICLES` | `src/app.js` | 10-news-and-newspaper.md | 17 |
| `KURODA_HEADLINES` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 94 |
| `KURODA_EDITORIAL` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 63 |
| `KURODA_WAR_RECORD` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 63 |
| `KURODA_SHOW_RATING` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 36 |
| `KURODA_PREVIEW` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 17 |
| `KURODA_SPOTLIGHT` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 60 |
| `KURODA_NEWS_COMMENT` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 30 |
| `KURODA_RELATION_NARRATIVE` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 189 |
| `FAN_OPINIONS` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 148 |
| `NEWSPAPER_DIGEST_COMMENTS` | `src/kuroda-text.js` | 10-news-and-newspaper.md | 61 |
| `NP_KURODA_BYLINE` | `src/ui-render.js` | 10-news-and-newspaper.md | 5 |
| `DECISION_DOCS` | `src/data.js` | 11-choice-and-large-event.md | 63 |
| `BONUS_PROPOSAL_MEMOS` | `src/data.js` | 11-choice-and-large-event.md | 4 |
| `CAMP_FLAVOR_TEXTS` | `src/data.js` | 11-choice-and-large-event.md | 12 |
| `CARE_REACTION_DIALOGUES` | `src/data.js` | 11-choice-and-large-event.md | 297 |
| `CHOICE_EVENT_DIALOGUES` | `src/data.js` | 11-choice-and-large-event.md | 283 |
| `CHOICE_EVENT_RESULT_DIALOGUES` | `src/data.js` | 11-choice-and-large-event.md | 19 |
| `LARGE_EVENT_TEXTS` | `src/data.js` | 11-choice-and-large-event.md | 86 |
| `LARGE_EVENT_DIALOGUES` | `src/data.js` | 11-choice-and-large-event.md | 272 |
| `EVENT_DRAFT_JOIN_LINES` | `src/data.js` | 12-career-event.md | 79 |
| `EVENT_DRAFT_INTEREST_LINES` | `src/data.js` | 12-career-event.md | 31 |
| `EVENT_INJURY_LINES` | `src/data.js` | 12-career-event.md | 76 |
| `EVENT_TITLE_WIN_LINES` | `src/data.js` | 12-career-event.md | 32 |
| `EVENT_TITLE_DEFENSE_LINES` | `src/data.js` | 12-career-event.md | 31 |
| `EVENT_TITLE_CHALLENGE_LOSS_LINES` | `src/data.js` | 12-career-event.md | 31 |
| `EVENT_TITLE_LOSS_LINES` | `src/data.js` | 12-career-event.md | 31 |
| `EVENT_RELEASE_LINES` | `src/data.js` | 12-career-event.md | 76 |
| `EVENT_FA_SIGNING_LINES` | `src/data.js` | 12-career-event.md | 31 |
| `EVENT_FA_SIGNING_GENERIC_LINES` | `src/data.js` | 12-career-event.md | 3 |
| `EVENT_FA_WELCOME_LINES` | `src/data.js` | 12-career-event.md | 31 |
| `EVENT_FA_WELCOME_GENERIC_LINES` | `src/data.js` | 12-career-event.md | 3 |
| `EVENT_RENTAL_GREETING_LINES` | `src/data.js` | 12-career-event.md | 31 |
| `EVENT_RENTAL_GREETING_GENERIC_LINES` | `src/data.js` | 12-career-event.md | 3 |
| `EVENT_LINES_BY_KEY` | `src/data.js` | 12-career-event.md | 489 |
| `GLIMPSE_A_LINES` | `src/data.js` | 13-glimpse-cascade.md | 328 |
| `GLIMPSE_HOTSTREAK_END_LINES` | `src/data.js` | 13-glimpse-cascade.md | 41 |
| `GLIMPSE_B_LINES` | `src/data.js` | 13-glimpse-cascade.md | 305 |
| `PPV_SUMMIT_VICTORY_LINES` | `src/data.js` | 14-ppv-and-war.md | 47 |
| `AUTUMN_WAR_MVP_LINES` | `src/data.js` | 14-ppv-and-war.md | 315 |
| `AUTUMN_WAR_MATCH_LINES` | `src/data.js` | 14-ppv-and-war.md | 228 |
| `WAR_VICTORY_LINES` | `src/data.js` | 14-ppv-and-war.md | 107 |
| `WAR_CHALLENGER_DIALOGUE` | `src/data.js` | 14-ppv-and-war.md | 61 |
| `WAR_DECLINE_DIALOGUE` | `src/data.js` | 14-ppv-and-war.md | 60 |
| `WAR_POST_DIALOGUE` | `src/data.js` | 14-ppv-and-war.md | 117 |
| `TENCHOSEN_DRAMA_LINES` | `src/data.js` | 14-ppv-and-war.md | 91 |
| `TENCHOSEN_PREEVENT_LINES` | `src/data.js` | 14-ppv-and-war.md | 31 |
| `PPV_OPPONENT_LINES` | `src/data.js` | 14-ppv-and-war.md | 44 |
| `PPV_HYPE_TEMPLATES` | `src/data.js` | 14-ppv-and-war.md | 10 |
| `JUNIOR_TOURNAMENT_LINES` | `src/data.js` | 14-ppv-and-war.md | 409 |
| `COACH_INVITE_LINES` | `src/coach-lines.js` | 15-coach.md | 40 |
| `FIGHTER_INVITE_GRAD_LINES` | `src/coach-lines.js` | 15-coach.md | 7 |
| `FIGHTER_INVITE_GRAD_NORMAL_LINES` | `src/coach-lines.js` | 15-coach.md | 2 |
| `INVITE_AWAKENING_LINES` | `src/coach-lines.js` | 15-coach.md | 2 |
| `COACH_VOICE_REPORT_LINES` | `src/coach-lines.js` | 15-coach.md | 136 |
| `COACH_VOICE_RETIRE_LINES` | `src/coach-lines.js` | 15-coach.md | 72 |
| `COACH_VOICE_HIRE_LINES` | `src/coach-lines.js` | 15-coach.md | 16 |
| `COACH_VOICE_FIRE_LINES` | `src/coach-lines.js` | 15-coach.md | 8 |
| `COACH_VOICE_PRAISE_LINES` | `src/coach-lines.js` | 15-coach.md | 16 |
| `COACH_ABILITY_CATALOG` | `src/data.js` | 15-coach.md | 13 |
| `COACH_FLAVOR_DEFS` | `src/data.js` | 15-coach.md | 12 |
| `ALL_COACHES` | `src/data.js` | 15-coach.md | 238 |
| `CHAR_PROFILES` | `src/data.js` | 16-character-and-chronicle.md | 127 |
| `TRAIT_DEFS` | `src/data.js` | 16-character-and-chronicle.md | 40 |
| `Engine.chronicle.AXIS_LABELS` | `src/management.js` | 16-character-and-chronicle.md | 5 |
| `Engine.chronicle.SUBTITLE_TEMPLATES` | `src/management.js` | 16-character-and-chronicle.md | 29 |
| `Engine.chronicle.CLOSING_TEMPLATES` | `src/management.js` | 16-character-and-chronicle.md | 12 |
| `Engine.chronicle.QUOTE_TEMPLATES` | `src/management.js` | 16-character-and-chronicle.md | 32 |
| `Engine.chronicle.QUOTE_TEMPLATES_DUAL` | `src/management.js` | 16-character-and-chronicle.md | 9 |
| `Engine.chronicle.QUOTE_TEMPLATES_V2` | `src/management.js` | 16-character-and-chronicle.md | 48 |
| `FLAG_DIALOGUE` | `src/flag-dialogue.js` | 17-relationship-flags.md | 449 |
| `FLAG_MODAL_META` | `src/ui-common.js` | 17-relationship-flags.md | 24 |
| `CRISIS_DIALOGUE` | `src/data.js` | 18-crisis-and-ending.md | 12 |
| `GAMEOVER_LINES` | `src/data.js` | 18-crisis-and-ending.md | 58 |
| `ENDING_LINES` | `src/data.js` | 18-crisis-and-ending.md | 52 |
| `KURODA_CRISIS` | `src/kuroda-text.js` | 18-crisis-and-ending.md | 10 |
| `KURODA_GAMEOVER` | `src/kuroda-text.js` | 18-crisis-and-ending.md | 6 |
| `KURODA_MATCHUP_FLAVOR` | `src/kuroda-text.js` | 18-crisis-and-ending.md | 120 |
| `Engine.draftNegotiation.NARRATION` | `src/draft-negotiation.js` | 19-draft-and-scout.md | 40 |
| `Engine.scout.TIERS` | `src/management.js` | 19-draft-and-scout.md | 5 |
| `Engine.draft.EVAL_TIERS` | `src/management.js` | 19-draft-and-scout.md | 6 |
| `TEAM_SPIRIT_TEXTS` | `src/data.js` | 20-misc-atmosphere.md | 8 |
| `PRE_WINDOW_TEXTS` | `src/data.js` | 20-misc-atmosphere.md | 9 |
| `LOCKER_AIR_TEXTS` | `src/data.js` | 20-misc-atmosphere.md | 14 |
| `ATMOSPHERE_TEXTS` | `src/data.js` | 20-misc-atmosphere.md | 18 |
| `EMOTION_TEXTS` | `src/ui-render.js` | 20-misc-atmosphere.md | 91 |
| `SURVIVAL_MILESTONES` | `src/app.js` | 20-misc-atmosphere.md | 10 |

## 対象外(意図的に除外したもの)

以下は `src/*.js` に存在するが、本ドキュメントの対象外としたもの:

- **数値コンフィグ/しきい値/倍率テーブル**(例: `*_CONFIG`, `*_CFG`, `*_MULT`, `*_CURVE`, `*_MATRIX` など): セリフではなく調整パラメータ
- **キャラ/コーチのポートレート・画像パス辞書**(`PORTRAIT`, `COACH_PORTRAIT` など): 画像ファイル名で、セリフではない
- **名前プール**(`MEDIA_OUTLET_NAMES`, `RIVAL_ORG_NAME_POOL`, `FASHION_BRAND_NAMES` など): 固有名詞の抽選プールで、文章ではない
- **UI短ラベル**(`STAT_LABELS_JP`, `QUARTER_LABELS`, `COACHING_TYPE_LABELS` など): 1〜5文字程度の画面表示ラベルで、キャラのセリフではない
- **内部実行時状態**(`_popupQueue`, `_relmapNodes` など先頭アンダースコアの多くはUI内部状態。ただし `_F01_ARCHETYPE_META` 等セリフを保持するものは対象に含めている)
- **技名テーブル**(`commonMoves`, `styleMoves`, `STYLE_TAG_MOVES`): 技の名前一覧で、`技テーブル_全160技_v3_5.md` の管轄
- **セリフ系テーブルの中に混在する構造キー**(`id`/`icon`/`emoji`/`shape`/`source`/`category`/`activationCondition`/`target`/`key`/`code`/`cond`/`weight`/`type`): 選択肢ID・アイコン絵文字・内部分類コードなどはキー名で自動的に除外している(例: `_F07_INCIDENT_META.*.choices[].id` の `A`/`B`/`C`、`ALL_COACHES[].emoji` の絵文字単体)
- **`Engine.*` / `App.*` の関数本体に直書きされたログ・通知文字列**(例: `Engine.tickWeek` 内の `` 🚨 資金危機継続中… `` のような1行通知、`App.processWeek` 内の負傷復帰メッセージなど): これらは条件分岐のロジックに深く埋め込まれた「地の文ではなくシステムログ」であり、独立した配列/テーブルとして取り出せないため、機械的な一括抽出は行っていない。ただし以下のクラスタは分量・重要度が高いため、将来レビューが必要な**未整理セリフ候補**として明記しておく:
  - `Engine.mvpRace.*`(`management.js`)— MVPレースの黒田コメント/タグライン生成(`generateNarrative`/`generateTagline`/`_composeFlavorLine`/`generateKurodaComment` 等、条件分岐で文を組み立てる関数群)
  - `Engine.newspaper.generate`(`management.js`)— 新聞ページ本体の組版ロジック(見出し/本文自体は `App._NEWSPAPER_HEADLINES` / `App._NEWSPAPER_ARTICLES` から取得しており、そちらは本ドキュメントに含まれている)
  - `Engine.factions.applyXXX` / `getXXXData`(`factions.js`)— 派閥イベントの結果ナレーション(選択後の地の文)。キャラ本人のセリフは `data-faction-dialogue.js` 側で別途カバー済みだが、結果描写の文章自体は factions.js の各関数内に直書きされている
  - `Engine.seasonReview.build` / `Engine.awards.buildCareerHighlights` / `Engine.milestone.get`(`management.js`)— シーズンレビュー/表彰ハイライト/マイルストーン通知の文面組み立て
  - `Engine.eventSystem.*` / `Engine.shachoshitsu.*` / `Engine.database.getOrgCompareAnalysis`(`management.js`)— 選択イベント結果・社長室実行結果・団体比較の一部コメント文

これらは「テーブル」の形になっていないため、書き直すにはコード自体を読む必要がある。もし書き直し対象に含めたい場合は、別途指示してほしい(関数ごとに個別の抽出作業になる)。

## 既知の注意点

- 挑戦試合(直訴/遠征)のセリフテーブルは、本ドキュメント作成中(2026-07-25)に `CHALLENGE_REQUEST_LINES` / `CHALLENGE_REQUEST_LINES_STYLE` → 統合後の `CHALLENGE_LINES`(archetype_personality キー × petition/sendoff/win/lose、全34セル)へと構成変更されていた(CH-1〜CH-5 再設計が進行中のため)。`docs/draft-notes/challenge-dialogue-inventory.md` はこの変更前の棚卸しであり、REQ-BASE/REQ-STYLE 関連の記述は現行コードと一致しない。本ツールが出力する `04-challenge-request.md` の内容が現行の実データ。
- 社長視点フレーバー1行(`pickFlavorLine` 内の `pure`/`respect`/`normal` 3系統)は `relationships.js` の関数ローカル変数として直書きされており、テーブルとして独立していないため本ドキュメントには含まれない。書き直したい場合は `src/relationships.js` の `pickFlavorLine` を直接参照すること。

## 再実行方法

```
node tools/extract-dialogue.js
```

`src/*.js` 内の対象テーブルの中身(文字列)を書き直した後、このコマンドを再実行すれば docs/dialogue/ 配下が最新化される。
新しく `const XXX_LINES = {...}` のようなセリフテーブルを追加した場合は、`tools/extract-dialogue.js` の `TABLE_MANIFEST` に1行追記してから再実行すること(追記しないと新テーブルは索引に出てこない)。

## Excel(xlsx)往復ワークフロー

この Markdown は読み取り専用(手直しは `src/*.js` 側に対して行う運用)だが、まとまった量のセリフを書き直したいときは
`tools/dialogue-workbook.js` で Excel ブックに書き出し→「改訂」列に書き込み→ソースへ書き戻す、という往復編集ができる。
この Markdown と同じ `TABLE_MANIFEST` / カテゴリ分類を再利用しているため、対象テーブルとカテゴリ番号はここに載っている表と一致する。

### 使い方

```
# 1. 書き出し(カテゴリ省略で全20カテゴリ、指定すれば一部だけでも可)
node tools/dialogue-workbook.js export 04-challenge-request
node tools/dialogue-workbook.js export        # 全カテゴリ

# 2. docs/dialogue/xlsx/<カテゴリ名>.xlsx を Excel で開き、「改訂」列にだけ書き込む
#    (他の列は書き戻しに使う参照情報なので触らない。ID列は特に編集不可)

# 3. 差分プレビュー(何も書き込まない)
node tools/dialogue-workbook.js apply docs/dialogue/xlsx/04-challenge-request.xlsx --dry-run

# 4. 実際に src/*.js へ書き戻す(引数省略で docs/dialogue/xlsx/ 配下の全 .xlsx が対象)
node tools/dialogue-workbook.js apply docs/dialogue/xlsx/04-challenge-request.xlsx
node tools/dialogue-workbook.js apply
```

### 列構成

| 列 | 内容 |
|---|---|
| ID(編集不可) | セリフの一意ID = ソース上のプロパティパス。書き戻し時にこの値だけでソース中の該当リテラルを特定するので、絶対に書き換えないこと |
| 出典 | `src/xxx.js`(表示用。書き戻しの判定には使わない) |
| テーブル | 属しているトップレベルのテーブル名 |
| パス | テーブル名を除いた、テーブル内でのキーパス |
| archetype / personality | キー名から推定した口調/性格(推定できない場合は空欄。ベストエフォート) |
| 現在 | 現在のソースの文言(書き戻し前にこの列とソースが一致するか検証される) |
| **改訂** | 空欄。ここに新しい文言を書き込むと apply の対象になる |
| 備考 | 自由記入。apply では読まない |

### 安全策(apply)

- 「改訂」列が空、または「現在」列と同じ行は無視する。
- 置換前に、シートの「現在」列の値が実際の `src/*.js` の該当リテラルと完全一致するか検証する。一致しなければその行はスキップして警告する(書き出し後にソースが変わった場合の事故防止)。
- コメントや1行配列などの元の書式を壊さないよう、対象オブジェクト全体を再整形するのではなく、該当する文字列/テンプレートリテラル1つだけをソーステキスト上で直接置換する(サージカル編集)。
- 書き込み前に対象ファイルを `<ファイル名>.bak` としてバックアップする。
- 書き戻し後に `node test/run-all.js` を自動実行し、失敗した場合はバックアップから自動復旧して異常終了する。
- `--dry-run` を付けると、何も書き込まずに「どのIDを、どう変えるか」のプレビューだけ表示する。まとまった量を書き戻す前に必ず確認すること。

### シート分割の方針

1カテゴリに属するテーブル数が **8個を超える場合はテーブルごとにシートを分割**し(例: 07-faction は34テーブル→34シート)、
8個以下の場合は見通しの良さを優先して **1カテゴリ1シート(「全セリフ」)にまとめる**(例: 04-challenge-request は3テーブル→1シート)。

### 既知の制約

- **`EVENT_LINES_BY_KEY`(12-career-event)は書き戻せない**: このテーブルは `draftJoin: EVENT_DRAFT_JOIN_LINES` のように他の既存テーブルへの**参照**だけで構成されたエイリアスであり、ソーステキスト上には文字列リテラルが存在しない。中身を書き直したい場合は、参照先の元テーブル(`EVENT_DRAFT_JOIN_LINES` など、いずれも同じ12-career-eventカテゴリに個別収録されている)を編集すること。apply はこの行を自動的にスキップ+警告する。
- 関数本体からのフォールバック抽出(1つの配列要素の中に複数の文字列リテラルが埋め込まれているケース、実測15件)は ID に `#2`,`#3`... の連番を付けて区別している。
- 数千行規模の一括書き戻しは `--dry-run` でスキップ件数(0件が理想)を確認してから実行することを強く推奨する。
