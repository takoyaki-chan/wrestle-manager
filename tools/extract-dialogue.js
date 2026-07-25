#!/usr/bin/env node
'use strict';
/**
 * tools/extract-dialogue.js
 *
 * 「Wrestle Manager」の全セリフ／ナレーション／台詞テーブルを src/*.js から
 * 再抽出し、docs/dialogue/ 配下にレビュー用 Markdown を再生成するツール。
 *
 * 使い方:
 *   node tools/extract-dialogue.js
 *
 * ゲームコード(src/)は一切変更しない。読み取り専用。
 * セリフを直した後に再実行すれば、docs/dialogue/ が最新の内容に更新される
 * (ただし後述の TABLE_MANIFEST に載っているテーブル名/パスのみを追跡する。
 *  全く新しい `const XXX_LINES = {...}` を追加した場合は、このファイルの
 *  TABLE_MANIFEST に1行追記してから再実行すること)。
 *
 * 仕組み:
 *   1. src/*.js を静的パースし、トップレベルの `const/let/var NAME = {...}`
 *      および `path.to.existing = {...}`(既存オブジェクトへの後付け拡張。
 *      例: Engine.newspaper = {...}、GLIMPSE_A_LINES.bond_60_up = {...})
 *      をブレース/文字列/テンプレートリテラル対応のスキャナで抽出する。
 *   2. 抽出した式を Node の vm モジュール上で1つずつ評価し(1件失敗しても
 *      他が巻き込まれないよう try/catch で個別に囲む)、実際のデータ値を得る。
 *      DOM には一切触れない(index.html を経由しないため安全)。
 *   3. TABLE_MANIFEST で指定した「セリフ系テーブル」だけを対象に、値を
 *      再帰的に walk して葉の文字列(または `() => '...'` 形式の関数が
 *      返す文字列リテラル)を集める。
 *   4. 各テーブルにパスベースの一意ID( 例: CHALLENGE_REQUEST_LINES.composed.hostile[1] )
 *      を振り、カテゴリ別 Markdown ファイルと README.md 索引を生成する。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { findTopLevelDeclarations } = require('./extract-dialogue-parser.js');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs', 'dialogue');

// ─────────────────────────────────────────────────────────────────────────
// 1. 読み込むファイルと順序(index.html / battle-engine.html / tag-battle.html
//    の <script src> 順を再現。Engine.xxx = {...} のような後付け拡張が
//    正しく解決されるためには、拡張元の const 宣言より後に評価される
//    必要があるため、この順序が重要)。
// ─────────────────────────────────────────────────────────────────────────
const FILE_ORDER = [
  'victory-lines.js',
  'data.js',
  'coach-lines.js',
  'data-faction-dialogue.js',
  'management.js',
  'match-engine.js',
  'relationships.js',
  'flag-dialogue.js',
  'factions.js',
  'draft-negotiation.js',
  'kuroda-text.js',
  'app.js',
  'ui-common.js',
  'ui-render.js',
  'battle-sfx.js',
  'battle-anim.js',
  'battle-lines.js',
  'battle-replay-core.js',
  'battle-engine-main.js',
  'tag-battle-lines.js',
  'tag-battle-main.js',
];

// ─────────────────────────────────────────────────────────────────────────
// 2. 抽出対象テーブルの一覧(手動選定)。
//    src/*.js のトップレベル宣言は約190個あるが、大半は数値コンフィグ/
//    ポートレート辞書/内部状態/名前プールなどで「セリフ」ではない。
//    ここに載っているものだけが docs/dialogue/ に出力される。
//
//    path: sandbox上の値への参照パス。単純な名前(トップレベル const)か、
//          ドット区切りのパス(例 'Engine.chronicle.AXIS_LABELS' — Engine
//          オブジェクトの中に直書きされている、または後付け拡張された
//          セリフ系サブテーブル)。
//    file: 由来ファイル(出典表示・コメント検索に使用)。
//    cat:  出力カテゴリ(下記 CATEGORIES のキー)。
// ─────────────────────────────────────────────────────────────────────────
const T = (p, file, cat) => ({ path: p, file, cat });

const TABLE_MANIFEST = [
  // ---- 01: 試合本編/勝利/ダメージ演出 ----
  T('VICTORY_LINES', 'victory-lines.js', '01'),
  T('SCOUT_SIGNING_LINES', 'victory-lines.js', '01'),
  T('VS_EX_EMPLOYER_LINES', 'victory-lines.js', '01'),
  T('DAMAGE_SERIF_LINES', 'battle-lines.js', '01'),
  T('DAMAGE_VOICE_LINES', 'battle-lines.js', '01'),
  T('CUTIN_LINES', 'battle-engine-main.js', '01'),
  T('FINISH_SUSPENSE', 'battle-engine-main.js', '01'),
  T('FAN_EXPECT_REACTIONS', 'data.js', '01'),
  T('POST_MATCH_FLAVOR_LINES', 'data.js', '01'),
  T('FIRST_MEET_LINES', 'data.js', '01'),
  T('BESTMATCH_FLAVOR', 'data.js', '01'),

  // ---- 02: タッグマッチ ----
  T('HOT_TAG_LINES', 'tag-battle-lines.js', '02'),
  T('DOUBLE_TEAM_LINES', 'tag-battle-lines.js', '02'),
  T('CUTIN_SAVE_LINES', 'tag-battle-lines.js', '02'),
  T('BETRAYAL_LINES', 'tag-battle-lines.js', '02'),
  T('DOUBLE_TEAM_STRIKE_COMMENTARY_LINES', 'tag-battle-lines.js', '02'),
  T('DOUBLE_TEAM_THROW_COMMENTARY_LINES', 'tag-battle-lines.js', '02'),
  T('DOUBLE_TEAM_SUB_COMMENTARY_LINES', 'tag-battle-lines.js', '02'),
  T('DOUBLE_TEAM_AERIAL_COMMENTARY_LINES', 'tag-battle-lines.js', '02'),
  T('DOUBLE_TEAM_FINISH_COMMENTARY_LINES', 'tag-battle-lines.js', '02'),
  T('TAG_MATCH_WIN_LINES', 'tag-battle-lines.js', '02'),
  T('TAG_MATCH_LOSS_LINES', 'tag-battle-lines.js', '02'),
  T('TAG_MATCH_COMMENTARY_WIN_LINES', 'tag-battle-lines.js', '02'),

  // ---- 03: 因縁/絆(Bond・Rivalry)イベント ----
  T('RIVALRY_CONFRONTATION_LINES', 'data.js', '03'),
  T('RIVALRY_CONFRONTATION_LINES_70', 'data.js', '03'),
  T('RIVALRY_CONFRONTATION_LINES_90', 'data.js', '03'),
  T('RIVALRY_RESOLUTION_LINES', 'data.js', '03'),
  T('GOODRIVAL_RESOLUTION_LINES', 'data.js', '03'),
  T('BITTER_RESOLUTION_LINES', 'data.js', '03'),
  T('RIVALRY_MATCH_REACTION', 'data.js', '03'),
  T('UPSET_RIVALRY_LINES', 'data.js', '03'),
  T('WEEKLY_STORY_TICKER', 'data.js', '03'),

  // ---- 04: 挑戦試合(直訴/遠征) ----
  T('CHALLENGE_LINES', 'data.js', '04'),
  T('CHALLENGE_REQUEST_OPPONENT_REACTIONS', 'data.js', '04'),
  T('CHALLENGE_REQUEST_NO_LINES', 'data.js', '04'),
  T('Engine.challengeRequest.pickFlavorLine.__FLAVOR__', 'relationships.js', '04'), // placeholder, resolved specially below

  // ---- 05: 引退/引き抜き/引き留め ----
  T('RETIREMENT_LINES', 'data.js', '05'),
  T('RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE', 'data.js', '05'),
  T('POACH_REACTION_DIALOGUES', 'data.js', '05'),
  T('RETIRE_ACCEPT_LINES', 'data.js', '05'),
  T('RETIRE_REFUSE_LINES', 'data.js', '05'),
  T('RETAIN_LINES', 'data.js', '05'),
  T('VOLUNTARY_STAY_LINES', 'data.js', '05'),

  // ---- 06: 契約交渉 ----
  T('NEGOTIATE_LINES', 'data.js', '06'),
  T('CONTRACT_NEGOTIATION_LINES', 'data.js', '06'),
  T('RELEASE_INTERVIEW_LINES', 'data.js', '06'),

  // ---- 07: 派閥イベント ----
  T('FACTION_TRANSITION_LINES', 'data.js', '07'),
  T('FACTION_F02_LINES', 'data.js', '07'),
  T('F07_LINES', 'data.js', '07'),
  T('COMMON1_LINES', 'data.js', '07'),
  T('COMMON3_LINES', 'data.js', '07'),
  T('COMMON4_LINES', 'data.js', '07'),
  T('COMMON5_LINES', 'data.js', '07'),
  T('COMMON7_LINES', 'data.js', '07'),
  T('FACTION_F01_LEADER_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F01_FOLLOWER_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F02_LEADER_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F03_SURVIVOR_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F04_TARGET_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F05_DISSIDENT_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F06_AMBIENT_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F07_LEADER_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F08_LEADER_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F08_PRE_MATCH_LINES_A', 'data-faction-dialogue.js', '07'),
  T('FACTION_F08_PRE_MATCH_LINES_B', 'data-faction-dialogue.js', '07'),
  T('FACTION_F08_POST_MATCH_WINNER_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F08_POST_MATCH_LOSER_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F09_OPENING_LINES_A', 'data-faction-dialogue.js', '07'),
  T('FACTION_F09_OPENING_LINES_B', 'data-faction-dialogue.js', '07'),
  T('FACTION_F09_MATCH_PRE_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F09_MATCH_POST_WIN_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F09_MATCH_POST_LOSE_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F09_ENDING_WIN_LINES', 'data-faction-dialogue.js', '07'),
  T('FACTION_F09_ENDING_LOSE_LINES', 'data-faction-dialogue.js', '07'),
  T('INTERNAL_CHALLENGE_PRE_CHALLENGER_LINES', 'data-faction-dialogue.js', '07'),
  T('INTERNAL_CHALLENGE_PRE_LEADER_LINES', 'data-faction-dialogue.js', '07'),
  T('INTERNAL_CHALLENGE_POST_WINNER_LINES', 'data-faction-dialogue.js', '07'),
  T('INTERNAL_CHALLENGE_POST_LOSER_LINES', 'data-faction-dialogue.js', '07'),
  T('_F01_ARCHETYPE_META', 'ui-common.js', '07'),
  T('_F07_INCIDENT_META', 'ui-common.js', '07'),

  // ---- 08: 成長/スランプ/モチベーション ----
  T('BT_HINT_LINES', 'data.js', '08'),
  T('BREAKTHROUGH_LINES', 'data.js', '08'),
  T('MILESTONE_LINES', 'data.js', '08'),
  T('SLUMP_START_LINES', 'data.js', '08'),
  T('SLUMP_END_LINES', 'data.js', '08'),
  T('MOTIVATION_LOSS_LINES', 'data.js', '08'),
  T('MOTIVATION_RECOVERY_LINES', 'data.js', '08'),

  // ---- 09: 表彰式/記録/ドーム到達 ----
  T('AWARD_LINES', 'data.js', '09'),
  T('MILESTONE_EVENTS', 'data.js', '09'),
  T('DOME_FIRSTSHOW_LINES', 'data.js', '09'),
  T('DOME_SELLOUT_LINES', 'data.js', '09'),
  T('Engine.awards._EPITHET_TEMPLATES', 'management.js', '09'),
  T('CREDITS', 'data.js', '09'),

  // ---- 10: ニュース/新聞/黒田記者コラム ----
  T('AI_BREAKTHROUGH_NEWS', 'data.js', '10'),
  T('AI_SLUMP_NEWS', 'data.js', '10'),
  T('AI_MOTIVATION_LOSS_NEWS', 'data.js', '10'),
  T('NEWS_TICKER_TEMPLATES', 'data.js', '10'),
  T('NEWS_HEADLINE_TEMPLATES', 'data.js', '10'),
  T('BIG_NEWS_LEAD_LINES', 'data.js', '10'),
  T('SEASON_REVIEW_LINES', 'data.js', '10'),
  T('NOTIF_EVENT_TEXTS', 'data.js', '10'),
  T('NOTIF_DIALOGUES', 'data.js', '10'),
  T('SNAPSHOT_TEXTS', 'data.js', '10'),
  T('Engine.flavor.MAGAZINE_HEADLINES', 'management.js', '10'),
  T('Engine.flavor.TV_HEADLINES', 'management.js', '10'),
  T('App._NEWSPAPER_HEADLINES', 'app.js', '10'),
  T('App._NEWSPAPER_ARTICLES', 'app.js', '10'),
  T('KURODA_HEADLINES', 'kuroda-text.js', '10'),
  T('KURODA_EDITORIAL', 'kuroda-text.js', '10'),
  T('KURODA_WAR_RECORD', 'kuroda-text.js', '10'),
  T('KURODA_SHOW_RATING', 'kuroda-text.js', '10'),
  T('KURODA_PREVIEW', 'kuroda-text.js', '10'),
  T('KURODA_SPOTLIGHT', 'kuroda-text.js', '10'),
  T('KURODA_NEWS_COMMENT', 'kuroda-text.js', '10'),
  T('KURODA_RELATION_NARRATIVE', 'kuroda-text.js', '10'),
  T('FAN_OPINIONS', 'kuroda-text.js', '10'),
  T('NEWSPAPER_DIGEST_COMMENTS', 'kuroda-text.js', '10'),
  T('NP_KURODA_BYLINE', 'ui-render.js', '10'),

  // ---- 11: 選択イベント/大型イベント/社長室 ----
  T('DECISION_DOCS', 'data.js', '11'),
  T('BONUS_PROPOSAL_MEMOS', 'data.js', '11'),
  T('CAMP_FLAVOR_TEXTS', 'data.js', '11'),
  T('CARE_REACTION_DIALOGUES', 'data.js', '11'),
  T('CHOICE_EVENT_DIALOGUES', 'data.js', '11'),
  T('CHOICE_EVENT_RESULT_DIALOGUES', 'data.js', '11'),
  T('LARGE_EVENT_TEXTS', 'data.js', '11'),
  T('LARGE_EVENT_DIALOGUES', 'data.js', '11'),

  // ---- 12: 選手経歴イベント ----
  T('EVENT_DRAFT_JOIN_LINES', 'data.js', '12'),
  T('EVENT_DRAFT_INTEREST_LINES', 'data.js', '12'),
  T('EVENT_INJURY_LINES', 'data.js', '12'),
  T('EVENT_TITLE_WIN_LINES', 'data.js', '12'),
  T('EVENT_TITLE_DEFENSE_LINES', 'data.js', '12'),
  T('EVENT_TITLE_CHALLENGE_LOSS_LINES', 'data.js', '12'),
  T('EVENT_TITLE_LOSS_LINES', 'data.js', '12'),
  T('EVENT_RELEASE_LINES', 'data.js', '12'),
  T('EVENT_FA_SIGNING_LINES', 'data.js', '12'),
  T('EVENT_FA_SIGNING_GENERIC_LINES', 'data.js', '12'),
  T('EVENT_FA_WELCOME_LINES', 'data.js', '12'),
  T('EVENT_FA_WELCOME_GENERIC_LINES', 'data.js', '12'),
  T('EVENT_RENTAL_GREETING_LINES', 'data.js', '12'),
  T('EVENT_RENTAL_GREETING_GENERIC_LINES', 'data.js', '12'),
  T('EVENT_LINES_BY_KEY', 'data.js', '12'),

  // ---- 13: Glimpse Cascade(興行後の一言) ----
  T('GLIMPSE_A_LINES', 'data.js', '13'),
  T('GLIMPSE_HOTSTREAK_END_LINES', 'data.js', '13'),
  T('GLIMPSE_B_LINES', 'data.js', '13'),

  // ---- 14: PPV/対抗戦/天頂戦/ジュニアトーナメント ----
  T('PPV_SUMMIT_VICTORY_LINES', 'data.js', '14'),
  T('AUTUMN_WAR_MVP_LINES', 'data.js', '14'),
  T('AUTUMN_WAR_MATCH_LINES', 'data.js', '14'),
  T('WAR_VICTORY_LINES', 'data.js', '14'),
  T('WAR_CHALLENGER_DIALOGUE', 'data.js', '14'),
  T('WAR_DECLINE_DIALOGUE', 'data.js', '14'),
  T('WAR_POST_DIALOGUE', 'data.js', '14'),
  T('TENCHOSEN_DRAMA_LINES', 'data.js', '14'),
  T('TENCHOSEN_PREEVENT_LINES', 'data.js', '14'),
  T('PPV_OPPONENT_LINES', 'data.js', '14'),
  T('PPV_HYPE_TEMPLATES', 'data.js', '14'),
  T('JUNIOR_TOURNAMENT_LINES', 'data.js', '14'),

  // ---- 15: コーチ ----
  T('COACH_INVITE_LINES', 'coach-lines.js', '15'),
  T('FIGHTER_INVITE_GRAD_LINES', 'coach-lines.js', '15'),
  T('FIGHTER_INVITE_GRAD_NORMAL_LINES', 'coach-lines.js', '15'),
  T('INVITE_AWAKENING_LINES', 'coach-lines.js', '15'),
  T('COACH_VOICE_REPORT_LINES', 'coach-lines.js', '15'),
  T('COACH_VOICE_RETIRE_LINES', 'coach-lines.js', '15'),
  T('COACH_VOICE_HIRE_LINES', 'coach-lines.js', '15'),
  T('COACH_VOICE_FIRE_LINES', 'coach-lines.js', '15'),
  T('COACH_VOICE_PRAISE_LINES', 'coach-lines.js', '15'),
  T('COACH_ABILITY_CATALOG', 'data.js', '15'),
  T('COACH_FLAVOR_DEFS', 'data.js', '15'),
  T('ALL_COACHES', 'data.js', '15'),

  // ---- 16: キャラクター人物設定/年代記 ----
  T('CHAR_PROFILES', 'data.js', '16'),
  T('TRAIT_DEFS', 'data.js', '16'),
  T('Engine.chronicle.AXIS_LABELS', 'management.js', '16'),
  T('Engine.chronicle.SUBTITLE_TEMPLATES', 'management.js', '16'),
  T('Engine.chronicle.CLOSING_TEMPLATES', 'management.js', '16'),
  T('Engine.chronicle.QUOTE_TEMPLATES', 'management.js', '16'),
  T('Engine.chronicle.QUOTE_TEMPLATES_DUAL', 'management.js', '16'),
  T('Engine.chronicle.QUOTE_TEMPLATES_V2', 'management.js', '16'),

  // ---- 17: 関係性フラグ ----
  T('FLAG_DIALOGUE', 'flag-dialogue.js', '17'),
  T('FLAG_MODAL_META', 'ui-common.js', '17'),

  // ---- 18: 経営危機/エンディング ----
  T('CRISIS_DIALOGUE', 'data.js', '18'),
  T('GAMEOVER_LINES', 'data.js', '18'),
  T('ENDING_LINES', 'data.js', '18'),
  T('KURODA_CRISIS', 'kuroda-text.js', '18'),
  T('KURODA_GAMEOVER', 'kuroda-text.js', '18'),
  T('KURODA_MATCHUP_FLAVOR', 'kuroda-text.js', '18'),

  // ---- 19: ドラフト/スカウト ----
  T('Engine.draftNegotiation.NARRATION', 'draft-negotiation.js', '19'),
  T('Engine.scout.TIERS', 'management.js', '19'),
  T('Engine.draft.EVAL_TIERS', 'management.js', '19'),

  // ---- 20: その他雰囲気テキスト ----
  T('TEAM_SPIRIT_TEXTS', 'data.js', '20'),
  T('PRE_WINDOW_TEXTS', 'data.js', '20'),
  T('LOCKER_AIR_TEXTS', 'data.js', '20'),
  T('ATMOSPHERE_TEXTS', 'data.js', '20'),
  T('EMOTION_TEXTS', 'ui-render.js', '20'),
  T('SURVIVAL_MILESTONES', 'app.js', '20'),
];

// challengeRequest.pickFlavorLine の FLAVOR プールは関数内ローカル定数
// (Engine.challengeRequest オブジェクトのプロパティではない)なので、
// 上の汎用マニフェスト解決では拾えない。すでに docs/draft-notes/
// challenge-dialogue-inventory.md で全文棚卸し済みのため、本ツールでは
// 対象から外し、04章に参照リンクだけ載せる(下記 EXTRA_NOTES 参照)。
const manifestIdx = TABLE_MANIFEST.findIndex(t => t.path === 'Engine.challengeRequest.pickFlavorLine.__FLAVOR__');
if (manifestIdx !== -1) TABLE_MANIFEST.splice(manifestIdx, 1);

const CATEGORIES = {
  '01': { file: '01-victory-and-battle.md', title: '試合本編・勝利演出・ダメージセリフ' },
  '02': { file: '02-tag-match.md', title: 'タッグマッチ' },
  '03': { file: '03-rivalry-and-relationship.md', title: '因縁・絆(Bond/Rivalry)イベント' },
  '04': { file: '04-challenge-request.md', title: '挑戦試合(直訴・遠征)' },
  '05': { file: '05-retirement-and-poach.md', title: '引退・引き抜き・引き留め' },
  '06': { file: '06-negotiation-and-contract.md', title: '契約交渉' },
  '07': { file: '07-faction.md', title: '派閥イベント' },
  '08': { file: '08-growth-and-emotion.md', title: '成長・スランプ・モチベーション' },
  '09': { file: '09-award-and-milestone.md', title: '表彰式・記録・ドーム到達' },
  '10': { file: '10-news-and-newspaper.md', title: 'ニュース・新聞・黒田記者コラム' },
  '11': { file: '11-choice-and-large-event.md', title: '選択イベント・大型イベント・社長室' },
  '12': { file: '12-career-event.md', title: '選手経歴イベント' },
  '13': { file: '13-glimpse-cascade.md', title: 'Glimpse Cascade(興行後の一言)' },
  '14': { file: '14-ppv-and-war.md', title: 'PPV・対抗戦・天頂戦・トーナメント' },
  '15': { file: '15-coach.md', title: 'コーチ' },
  '16': { file: '16-character-and-chronicle.md', title: 'キャラクター人物設定・年代記' },
  '17': { file: '17-relationship-flags.md', title: '関係性フラグ' },
  '18': { file: '18-crisis-and-ending.md', title: '経営危機・エンディング' },
  '19': { file: '19-draft-and-scout.md', title: 'ドラフト・スカウト' },
  '20': { file: '20-misc-atmosphere.md', title: 'その他雰囲気テキスト' },
};

// ─────────────────────────────────────────────────────────────────────────
// 3. パース → 評価
// ─────────────────────────────────────────────────────────────────────────
function loadAllDecls() {
  const allDecls = [];
  const fileSrc = new Map();
  for (const file of FILE_ORDER) {
    const full = path.join(SRC, file);
    if (!fs.existsSync(full)) {
      console.error(`[WARN] file not found, skipping: ${file}`);
      continue;
    }
    const src = fs.readFileSync(full, 'utf8');
    fileSrc.set(file, src);
    const decls = findTopLevelDeclarations(src);
    for (const d of decls) {
      if (d.error) {
        console.error(`[WARN] parse error in ${file} for "${d.name}" (line ${d.startLine}): ${d.error}`);
        continue;
      }
      allDecls.push({ ...d, file });
    }
  }
  return { allDecls, fileSrc };
}

function evalAll(allDecls) {
  const parts = ['var __ERRORS__ = [];'];
  for (const d of allDecls) {
    const lhs = d.isAssignment ? d.name : `globalThis[${JSON.stringify(d.name)}]`;
    parts.push(
      `try { ${lhs} = (${d.exprText}); } catch(e) { __ERRORS__.push({name:${JSON.stringify(d.name)}, file:${JSON.stringify(d.file)}, error:String(e&&e.message||e)}); }`
    );
  }
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(parts.join('\n'), sandbox, { timeout: 60000 });
  return sandbox;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. 値の再帰 walk(文字列の葉、および `() => '...'` / `x => \`...\`` 形式の
//    関数が直接返すリテラルを抽出する)
// ─────────────────────────────────────────────────────────────────────────
function resolvePath(sandbox, dottedPath) {
  const segs = dottedPath.split('.');
  let cur = sandbox;
  for (const seg of segs) {
    if (cur == null) return undefined;
    cur = cur[seg];
  }
  return cur;
}

const LIT = '(`(?:[^`\\\\]|\\\\.)*`|\'(?:[^\'\\\\]|\\\\.)*\'|"(?:[^"\\\\]|\\\\.)*")';
const DIRECT_RE = new RegExp('=>\\s*' + LIT + '\\s*;?\\s*$');
const RETURN_RE = new RegExp('return\\s+' + LIT);
const ANY_LIT_RE = new RegExp(LIT, 'g');

function extractFromFunction(fn) {
  const src = fn.toString();
  let mm = DIRECT_RE.exec(src.trim()) || RETURN_RE.exec(src);
  if (mm) {
    return [{ text: mm[1].slice(1, -1), kind: 'fn' }];
  }
  // フォールバック: 関数本体に含まれる文字列/テンプレートリテラルを全部拾う
  // (単純な `() => 'text'` 形以外の書き方をしている関数用の保険)
  const out = [];
  let m;
  ANY_LIT_RE.lastIndex = 0;
  while ((m = ANY_LIT_RE.exec(src))) {
    out.push({ text: m[1].slice(1, -1), kind: 'fn-fallback' });
  }
  return out;
}

// テーブルには「セリフ本文」と混ざって、選択肢ID・アイコン絵文字・内部
// カテゴリコードなど非セリフの構造キーが同居していることがある
// (例: `_F07_INCIDENT_META.DEMAND_MAIN.choices[0].id === 'A'`,
//      `ALL_COACHES[i].emoji === '💪'`, `DECISION_DOCS.bonus.category === 'care'`)。
// これらはキー名で機械的に弾く。
const STRUCTURAL_KEYS = new Set([
  'id', 'icon', 'emoji', 'titleemoji', 'shape', 'source', 'category',
  'activationcondition', 'target', 'key', 'code', 'cond', 'weight', 'type',
]);

const JP_RE = /[぀-ヿ㐀-鿿]/;
function isProseWorthy(text) {
  if (!text) return false;
  if (JP_RE.test(text)) return true;
  // 日本語を含まない場合でも、スペースを含む8文字以上の文なら文章とみなす
  // (`id`/`emoji` 等の内部コード・絵文字単体はここで弾かれる)
  if (/\s/.test(text) && text.length >= 8) return true;
  return false;
}

function walk(val, pathStr, out, seen) {
  if (val == null) return;
  if (typeof val === 'string') {
    if (isProseWorthy(val)) out.push({ path: pathStr, text: val, kind: 'string' });
    return;
  }
  if (typeof val === 'function') {
    for (const item of extractFromFunction(val)) {
      if (isProseWorthy(item.text)) out.push({ path: pathStr, text: item.text, kind: item.kind });
    }
    return;
  }
  if (typeof val !== 'object') return;
  if (seen.has(val)) return; // 循環参照ガード
  seen.add(val);
  if (Array.isArray(val)) {
    val.forEach((v, i) => walk(v, `${pathStr}[${i + 1}]`, out, seen));
    return;
  }
  for (const k of Object.keys(val)) {
    if (STRUCTURAL_KEYS.has(k.toLowerCase())) continue;
    walk(val[k], `${pathStr}.${k}`, out, seen);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 5. 直前コメントの抽出(説明文の自動転記)
// ─────────────────────────────────────────────────────────────────────────
function stripCommentMarker(line) {
  return line
    .replace(/^\s*\/\/[─═\s]*/, '')
    .replace(/[─═\s]*$/, '')
    .trim();
}

function commentAboveLine(src, lineNo /* 1-based */) {
  const lines = src.split('\n');
  const collected = [];
  let i = lineNo - 2; // 0-based index of the line just before the declaration
  let blankSkipped = false;
  while (i >= 0 && collected.length < 6) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') {
      if (blankSkipped) break;
      blankSkipped = true;
      i--;
      continue;
    }
    if (trimmed.startsWith('//')) {
      const cleaned = stripCommentMarker(line);
      if (cleaned) collected.unshift(cleaned);
      i--;
      continue;
    }
    break;
  }
  return collected.join(' / ');
}

function findKeyComment(src, keyName) {
  const re = new RegExp(`^[ \\t]*${keyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'm');
  const m = re.exec(src);
  if (!m) return { line: null, comment: '' };
  const lineNo = src.slice(0, m.index).split('\n').length;
  return { line: lineNo, comment: commentAboveLine(src, lineNo) };
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Markdown 生成ヘルパー
// ─────────────────────────────────────────────────────────────────────────
function mdEscapeText(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '⏎')
    .replace(/`/g, '´');
}

function groupBySection(items, rootPath) {
  // items: [{path, text, kind}], path は rootPath からの絶対パス
  const sections = new Map(); // sectionKey -> [{id, text, kind}]
  for (const item of items) {
    const sectionKey = item.path.replace(/\[\d+\]/g, '[]');
    if (!sections.has(sectionKey)) sections.set(sectionKey, []);
    sections.get(sectionKey).push({ id: item.path, text: item.text, kind: item.kind });
  }
  return sections;
}

function renderTableSection(entry, items, comment) {
  const lines = [];
  lines.push(`## \`${entry.path}\``);
  lines.push('');
  lines.push(`- 出典: \`src/${entry.file}\``);
  if (comment) lines.push(`- コード内コメント: ${comment}`);
  lines.push(`- 本数: ${items.length}`);
  lines.push('');
  if (items.length === 0) {
    lines.push('_(値が見つかりませんでした — 手動確認が必要)_');
    lines.push('');
    return lines.join('\n');
  }
  const sections = groupBySection(items, entry.path);
  const isSingleRootSection = sections.size === 1 && sections.has(`${entry.path}[]`);
  // 「キーごとに文字列1〜2個」を大量に持つテーブル(例: CHAR_PROFILES が
  // 127人分、各1行)は、見出しを127個並べるより1本のフラットな箇条書きに
  // した方が読みやすい。
  const allTiny = [...sections.values()].every(arr => arr.length <= 2);
  const flatten = !isSingleRootSection && sections.size > 10 && allTiny;
  if (flatten) {
    for (const it of items) {
      lines.push(`- \`${it.path}\`: ${mdEscapeText(it.text)}`);
    }
    lines.push('');
    return lines.join('\n');
  }
  for (const [sectionKey, arr] of sections) {
    if (!isSingleRootSection) {
      const heading = sectionKey.startsWith(entry.path) ? sectionKey.slice(entry.path.length).replace(/^\./, '') : sectionKey;
      lines.push(`### ${heading || '(root)'}`);
      lines.push('');
    }
    for (const it of arr) {
      lines.push(`- \`${it.id}\`: ${mdEscapeText(it.text)}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────
// 7. メイン処理
// ─────────────────────────────────────────────────────────────────────────
function main() {
  console.log('[extract-dialogue] parsing src/*.js ...');
  const { allDecls, fileSrc } = loadAllDecls();
  console.log(`[extract-dialogue] found ${allDecls.length} top-level data declarations`);

  console.log('[extract-dialogue] evaluating in vm sandbox ...');
  const sandbox = evalAll(allDecls);
  const errs = sandbox.__ERRORS__ || [];
  if (errs.length) {
    console.error(`[extract-dialogue] ${errs.length} declaration(s) failed to evaluate:`);
    for (const e of errs) console.error(`  - ${e.file} ${e.name}: ${e.error}`);
  }

  // 出典ファイルごとの source を、トップレベル名の場合は宣言行、
  // extras(ドット区切りパス)の場合は最終セグメントのキー行から
  // コメントを拾う。
  const declLineByName = new Map();
  for (const d of allDecls) {
    if (!declLineByName.has(d.name)) declLineByName.set(d.name, d.startLine);
  }

  fs.mkdirSync(OUT, { recursive: true });

  const notFound = [];
  const perCategory = new Map(); // cat -> [{entry, items, comment}]
  let totalCount = 0;
  const perTableCounts = [];

  for (const entry of TABLE_MANIFEST) {
    const val = resolvePath(sandbox, entry.path);
    if (val === undefined) {
      notFound.push(entry);
      continue;
    }
    const items = [];
    walk(val, entry.path, items, new Set());

    // CHAR_PROFILES は数値ID直下に文章が入っているだけで誰のプロフィールか
    // 分からないため、ALL_CHARS からキャラ名を引いて先頭に付記する。
    if (entry.path === 'CHAR_PROFILES' && Array.isArray(sandbox.ALL_CHARS)) {
      const nameById = new Map(sandbox.ALL_CHARS.map(c => [String(c.id), c.name]));
      for (const it of items) {
        const idMatch = /\[?(\d+)\]?$/.exec(it.path);
        const cid = idMatch && idMatch[1];
        const name = cid && nameById.get(cid);
        if (name) it.text = `【${name}】${it.text}`;
      }
    }

    const src = fileSrc.get(entry.file) || '';
    let comment = '';
    if (declLineByName.has(entry.path)) {
      comment = commentAboveLine(src, declLineByName.get(entry.path));
    } else {
      const lastSeg = entry.path.split('.').pop();
      comment = findKeyComment(src, lastSeg).comment;
    }

    if (!perCategory.has(entry.cat)) perCategory.set(entry.cat, []);
    perCategory.get(entry.cat).push({ entry, items, comment });
    totalCount += items.length;
    perTableCounts.push({ path: entry.path, file: entry.file, count: items.length, cat: entry.cat });
  }

  // ---- カテゴリ別ファイル出力 ----
  const catOrder = Object.keys(CATEGORIES).sort();
  for (const cat of catOrder) {
    const info = CATEGORIES[cat];
    const tables = perCategory.get(cat) || [];
    const lines = [];
    lines.push(`# ${info.title}`);
    lines.push('');
    lines.push(`docs/dialogue/README.md から自動生成(\`node tools/extract-dialogue.js\`)。手直しはこのファイルではなく \`src/*.js\` 側の該当テーブルに対して行い、再抽出すること。`);
    lines.push('');
    if (tables.length === 0) {
      lines.push('_(このカテゴリに割り当てられたテーブルはありません)_');
    }
    for (const t of tables) {
      lines.push(renderTableSection(t.entry, t.items, t.comment));
    }
    fs.writeFileSync(path.join(OUT, info.file), lines.join('\n').trimEnd() + '\n', 'utf8');
  }

  // ---- README.md(索引)----
  const readme = [];
  readme.push('# セリフ抽出インデックス');
  readme.push('');
  readme.push('`node tools/extract-dialogue.js` により `src/*.js` から自動生成。');
  readme.push('セリフを書き直したら、このツールを再実行すれば内容が更新される(下記「再実行方法」参照)。');
  readme.push('');
  readme.push(`- 対象テーブル数: ${TABLE_MANIFEST.length}`);
  readme.push(`- 抽出できたセリフ総本数: **${totalCount}**`);
  if (notFound.length) {
    readme.push(`- ⚠ 解決できなかったテーブル: ${notFound.length}件(下記「未解決」参照)`);
  }
  readme.push('');
  readme.push('## ID の読み方');
  readme.push('');
  readme.push('各セリフのIDは `TABLE_NAME.key1.key2[n]` の形式。これは実データ(`src/*.js` 内の該当 const)のプロパティパスそのものなので、');
  readme.push('「`CHALLENGE_REQUEST_LINES.composed.hostile[1]` をこう変えたい」のように直接指定できる。`[n]` は配列内の1始まりのインデックス。');
  readme.push('');
  readme.push('## カテゴリ一覧');
  readme.push('');
  readme.push('| # | カテゴリ | ファイル | テーブル数 | 本数 |');
  readme.push('|---|---|---|---|---|');
  for (const cat of catOrder) {
    const info = CATEGORIES[cat];
    const tables = perCategory.get(cat) || [];
    const count = tables.reduce((a, t) => a + t.items.length, 0);
    readme.push(`| ${cat} | ${info.title} | [${info.file}](./${info.file}) | ${tables.length} | ${count} |`);
  }
  readme.push('');
  readme.push('## テーブル別内訳');
  readme.push('');
  readme.push('| テーブル | 出典 | カテゴリ | 本数 |');
  readme.push('|---|---|---|---|');
  for (const t of perTableCounts) {
    readme.push(`| \`${t.path}\` | \`src/${t.file}\` | ${CATEGORIES[t.cat].file} | ${t.count} |`);
  }
  if (notFound.length) {
    readme.push('');
    readme.push('## 未解決(手動確認が必要)');
    readme.push('');
    for (const e of notFound) {
      readme.push(`- \`${e.path}\`(\`src/${e.file}\`) — sandbox 上で値が見つからなかった`);
    }
  }
  readme.push('');
  readme.push('## 対象外(意図的に除外したもの)');
  readme.push('');
  readme.push('以下は `src/*.js` に存在するが、本ドキュメントの対象外としたもの:');
  readme.push('');
  readme.push('- **数値コンフィグ/しきい値/倍率テーブル**(例: `*_CONFIG`, `*_CFG`, `*_MULT`, `*_CURVE`, `*_MATRIX` など): セリフではなく調整パラメータ');
  readme.push('- **キャラ/コーチのポートレート・画像パス辞書**(`PORTRAIT`, `COACH_PORTRAIT` など): 画像ファイル名で、セリフではない');
  readme.push('- **名前プール**(`MEDIA_OUTLET_NAMES`, `RIVAL_ORG_NAME_POOL`, `FASHION_BRAND_NAMES` など): 固有名詞の抽選プールで、文章ではない');
  readme.push('- **UI短ラベル**(`STAT_LABELS_JP`, `QUARTER_LABELS`, `COACHING_TYPE_LABELS` など): 1〜5文字程度の画面表示ラベルで、キャラのセリフではない');
  readme.push('- **内部実行時状態**(`_popupQueue`, `_relmapNodes` など先頭アンダースコアの多くはUI内部状態。ただし `_F01_ARCHETYPE_META` 等セリフを保持するものは対象に含めている)');
  readme.push('- **技名テーブル**(`commonMoves`, `styleMoves`, `STYLE_TAG_MOVES`): 技の名前一覧で、`技テーブル_全160技_v3_5.md` の管轄');
  readme.push('- **セリフ系テーブルの中に混在する構造キー**(`id`/`icon`/`emoji`/`shape`/`source`/`category`/`activationCondition`/`target`/`key`/`code`/`cond`/`weight`/`type`): 選択肢ID・アイコン絵文字・内部分類コードなどはキー名で自動的に除外している(例: `_F07_INCIDENT_META.*.choices[].id` の `A`/`B`/`C`、`ALL_COACHES[].emoji` の絵文字単体)');
  readme.push('- **`Engine.*` / `App.*` の関数本体に直書きされたログ・通知文字列**(例: `Engine.tickWeek` 内の `` 🚨 資金危機継続中… `` のような1行通知、`App.processWeek` 内の負傷復帰メッセージなど): これらは条件分岐のロジックに深く埋め込まれた「地の文ではなくシステムログ」であり、独立した配列/テーブルとして取り出せないため、機械的な一括抽出は行っていない。ただし以下のクラスタは分量・重要度が高いため、将来レビューが必要な**未整理セリフ候補**として明記しておく:');
  readme.push('  - `Engine.mvpRace.*`(`management.js`)— MVPレースの黒田コメント/タグライン生成(`generateNarrative`/`generateTagline`/`_composeFlavorLine`/`generateKurodaComment` 等、条件分岐で文を組み立てる関数群)');
  readme.push('  - `Engine.newspaper.generate`(`management.js`)— 新聞ページ本体の組版ロジック(見出し/本文自体は `App._NEWSPAPER_HEADLINES` / `App._NEWSPAPER_ARTICLES` から取得しており、そちらは本ドキュメントに含まれている)');
  readme.push('  - `Engine.factions.applyXXX` / `getXXXData`(`factions.js`)— 派閥イベントの結果ナレーション(選択後の地の文)。キャラ本人のセリフは `data-faction-dialogue.js` 側で別途カバー済みだが、結果描写の文章自体は factions.js の各関数内に直書きされている');
  readme.push('  - `Engine.seasonReview.build` / `Engine.awards.buildCareerHighlights` / `Engine.milestone.get`(`management.js`)— シーズンレビュー/表彰ハイライト/マイルストーン通知の文面組み立て');
  readme.push('  - `Engine.eventSystem.*` / `Engine.shachoshitsu.*` / `Engine.database.getOrgCompareAnalysis`(`management.js`)— 選択イベント結果・社長室実行結果・団体比較の一部コメント文');
  readme.push('');
  readme.push('これらは「テーブル」の形になっていないため、書き直すにはコード自体を読む必要がある。もし書き直し対象に含めたい場合は、別途指示してほしい(関数ごとに個別の抽出作業になる)。');
  readme.push('');
  readme.push('## 既知の注意点');
  readme.push('');
  readme.push('- 挑戦試合(直訴/遠征)のセリフテーブルは、本ドキュメント作成中(2026-07-25)に `CHALLENGE_REQUEST_LINES` / `CHALLENGE_REQUEST_LINES_STYLE` → 統合後の `CHALLENGE_LINES`(archetype_personality キー × petition/sendoff/win/lose、全34セル)へと構成変更されていた(CH-1〜CH-5 再設計が進行中のため)。`docs/draft-notes/challenge-dialogue-inventory.md` はこの変更前の棚卸しであり、REQ-BASE/REQ-STYLE 関連の記述は現行コードと一致しない。本ツールが出力する `04-challenge-request.md` の内容が現行の実データ。');
  readme.push('- 社長視点フレーバー1行(`pickFlavorLine` 内の `pure`/`respect`/`normal` 3系統)は `relationships.js` の関数ローカル変数として直書きされており、テーブルとして独立していないため本ドキュメントには含まれない。書き直したい場合は `src/relationships.js` の `pickFlavorLine` を直接参照すること。');
  readme.push('');
  readme.push('## 再実行方法');
  readme.push('');
  readme.push('```');
  readme.push('node tools/extract-dialogue.js');
  readme.push('```');
  readme.push('');
  readme.push('`src/*.js` 内の対象テーブルの中身(文字列)を書き直した後、このコマンドを再実行すれば docs/dialogue/ 配下が最新化される。');
  readme.push('新しく `const XXX_LINES = {...}` のようなセリフテーブルを追加した場合は、`tools/extract-dialogue.js` の `TABLE_MANIFEST` に1行追記してから再実行すること(追記しないと新テーブルは索引に出てこない)。');
  readme.push('');
  readme.push('## Excel(xlsx)往復ワークフロー');
  readme.push('');
  readme.push('この Markdown は読み取り専用(手直しは `src/*.js` 側に対して行う運用)だが、まとまった量のセリフを書き直したいときは');
  readme.push('`tools/dialogue-workbook.js` で Excel ブックに書き出し→「改訂」列に書き込み→ソースへ書き戻す、という往復編集ができる。');
  readme.push('この Markdown と同じ `TABLE_MANIFEST` / カテゴリ分類を再利用しているため、対象テーブルとカテゴリ番号はここに載っている表と一致する。');
  readme.push('');
  readme.push('コマンドを直接叩く代わりに、`セリフ編集/` 直下の `1_エクセルに書き出し.bat` / `2_変更内容を確認.bat` / `3_ゲームに反映.bat` をダブルクリックしても同じ操作ができる(詳細は同フォルダの `README.txt`)。');
  readme.push('');
  readme.push('### 使い方');
  readme.push('');
  readme.push('```');
  readme.push('# 1. 書き出し(カテゴリ省略で全20カテゴリ、指定すれば一部だけでも可)');
  readme.push('node tools/dialogue-workbook.js export 04-challenge-request');
  readme.push('node tools/dialogue-workbook.js export        # 全カテゴリ');
  readme.push('');
  readme.push('# 2. セリフ編集/<カテゴリ名>.xlsx を Excel で開き、「改訂」列にだけ書き込む');
  readme.push('#    (他の列は書き戻しに使う参照情報なので触らない。ID列は特に編集不可)');
  readme.push('');
  readme.push('# 3. 差分プレビュー(何も書き込まない)');
  readme.push('node tools/dialogue-workbook.js apply セリフ編集/04-challenge-request.xlsx --dry-run');
  readme.push('');
  readme.push('# 4. 実際に src/*.js へ書き戻す(引数省略で セリフ編集/ 配下の全 .xlsx が対象)');
  readme.push('node tools/dialogue-workbook.js apply セリフ編集/04-challenge-request.xlsx');
  readme.push('node tools/dialogue-workbook.js apply');
  readme.push('```');
  readme.push('');
  readme.push('### 列構成');
  readme.push('');
  readme.push('| 列 | 内容 |');
  readme.push('|---|---|');
  readme.push('| ID(編集不可) | セリフの一意ID = ソース上のプロパティパス。書き戻し時にこの値だけでソース中の該当リテラルを特定するので、絶対に書き換えないこと |');
  readme.push('| 出典 | `src/xxx.js`(表示用。書き戻しの判定には使わない) |');
  readme.push('| テーブル | 属しているトップレベルのテーブル名 |');
  readme.push('| パス | テーブル名を除いた、テーブル内でのキーパス |');
  readme.push('| archetype / personality | キー名から推定した口調/性格(推定できない場合は空欄。ベストエフォート) |');
  readme.push('| 現在 | 現在のソースの文言(書き戻し前にこの列とソースが一致するか検証される) |');
  readme.push('| **改訂** | 空欄。ここに新しい文言を書き込むと apply の対象になる |');
  readme.push('| 備考 | 自由記入。apply では読まない |');
  readme.push('');
  readme.push('### 安全策(apply)');
  readme.push('');
  readme.push('- 「改訂」列が空、または「現在」列と同じ行は無視する。');
  readme.push('- 置換前に、シートの「現在」列の値が実際の `src/*.js` の該当リテラルと完全一致するか検証する。一致しなければその行はスキップして警告する(書き出し後にソースが変わった場合の事故防止)。');
  readme.push('- コメントや1行配列などの元の書式を壊さないよう、対象オブジェクト全体を再整形するのではなく、該当する文字列/テンプレートリテラル1つだけをソーステキスト上で直接置換する(サージカル編集)。');
  readme.push('- 書き込み前に対象ファイルを `<ファイル名>.bak` としてバックアップする。');
  readme.push('- 書き戻し後に `node test/run-all.js` を自動実行し、失敗した場合はバックアップから自動復旧して異常終了する。');
  readme.push('- `--dry-run` を付けると、何も書き込まずに「どのIDを、どう変えるか」のプレビューだけ表示する。まとまった量を書き戻す前に必ず確認すること。');
  readme.push('');
  readme.push('### シート分割の方針');
  readme.push('');
  readme.push('1カテゴリに属するテーブル数が **8個を超える場合はテーブルごとにシートを分割**し(例: 07-faction は34テーブル→34シート)、');
  readme.push('8個以下の場合は見通しの良さを優先して **1カテゴリ1シート(「全セリフ」)にまとめる**(例: 04-challenge-request は3テーブル→1シート)。');
  readme.push('');
  readme.push('### 既知の制約');
  readme.push('');
  readme.push('- **`EVENT_LINES_BY_KEY`(12-career-event)は書き戻せない**: このテーブルは `draftJoin: EVENT_DRAFT_JOIN_LINES` のように他の既存テーブルへの**参照**だけで構成されたエイリアスであり、ソーステキスト上には文字列リテラルが存在しない。中身を書き直したい場合は、参照先の元テーブル(`EVENT_DRAFT_JOIN_LINES` など、いずれも同じ12-career-eventカテゴリに個別収録されている)を編集すること。apply はこの行を自動的にスキップ+警告する。');
  readme.push('- 関数本体からのフォールバック抽出(1つの配列要素の中に複数の文字列リテラルが埋め込まれているケース、実測15件)は ID に `#2`,`#3`... の連番を付けて区別している。');
  readme.push('- 数千行規模の一括書き戻しは `--dry-run` でスキップ件数(0件が理想)を確認してから実行することを強く推奨する。');
  readme.push('');

  fs.writeFileSync(path.join(OUT, 'README.md'), readme.join('\n').trimEnd() + '\n', 'utf8');

  console.log('[extract-dialogue] done.');
  console.log(`[extract-dialogue] total lines extracted: ${totalCount}`);
  console.log(`[extract-dialogue] tables not found: ${notFound.length}`);
  if (notFound.length) {
    for (const e of notFound) console.log(`  - ${e.path}`);
  }
  console.log(`[extract-dialogue] output: ${OUT}`);
}

// tools/dialogue-workbook.js (Excel round-trip tool) re-uses the table
// manifest / category map / parse-and-eval pipeline defined above so the
// two tools can never drift apart. Everything else in this file (Markdown
// rendering, README generation) stays CLI-only.
module.exports = {
  ROOT,
  SRC,
  OUT,
  FILE_ORDER,
  TABLE_MANIFEST,
  CATEGORIES,
  loadAllDecls,
  evalAll,
  resolvePath,
  walk,
  commentAboveLine,
  findKeyComment,
};

if (require.main === module) {
  main();
}
