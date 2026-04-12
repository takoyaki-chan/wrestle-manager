#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const vm = require('vm');

global.window = { IS_TRIAL: false };

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  const script = new vm.Script(code, { filename });
  script.runInThisContext();
}

loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
try { loadAsGlobal('draft-negotiation.js'); } catch(e) {}

// ui-render.js has EMOTION_TEXTS — extract just that constant
{
  let code = fs.readFileSync(path.join(srcDir, 'ui-render.js'), 'utf-8');
  const m = code.match(/const EMOTION_TEXTS\s*=\s*\{[\s\S]*?\n\};/);
  if (m) {
    const script = new vm.Script(m[0].replace(/^const /, 'var '), { filename: 'emotion_texts_extract' });
    script.runInThisContext();
  }
}

// ── personality/archetype ラベル ──
const P_LABELS = {
  normal:'ノーマル', bold:'強気', quiet:'寡黙', shy:'シャイ',
  easygoing:'お気楽', earnest:'真面目', emotional:'感情的',
};
const A_LABELS = {
  _default:'デフォルト', normal:'デフォルト',
  polite:'丁寧', cool:'クール', ojousama:'お嬢様',
  seductive:'蠱惑', delinquent:'不良', composed:'鷹揚',
};
const PERSONALITIES = ['normal','bold','quiet','shy','easygoing','earnest','emotional'];
const ARCHETYPES = ['_default','polite','cool','ojousama','seductive','delinquent','composed'];

// ── キャラマッピング: personality×archetype → [names] ──
const charMap = {};
if (typeof ALL_CHARS !== 'undefined') {
  ALL_CHARS.forEach(c => {
    const p = c.personality || 'normal';
    const a = c.archetype || 'normal';
    const key = `${p}|${a}`;
    if (!charMap[key]) charMap[key] = [];
    charMap[key].push(c.name);
  });
}

function getChars(personality, archetype) {
  if (archetype === '_default') {
    // _default matches chars whose archetype is 'normal' (no specific archetype)
    const key = `${personality}|normal`;
    return charMap[key] || [];
  }
  const key = `${personality}|${archetype}`;
  return charMap[key] || [];
}

function getCharsForPersonality(personality) {
  const names = [];
  for (const [key, arr] of Object.entries(charMap)) {
    if (key.startsWith(personality + '|')) names.push(...arr);
  }
  return names;
}

// ── 再帰walk: personality > archetype > [lines] 構造 ──
function walkPALines(obj, sourceName, prefix, rows) {
  if (!obj || typeof obj !== 'object') return;
  // Check if this level has personality keys
  for (const pKey of PERSONALITIES) {
    if (obj[pKey]) {
      const pObj = obj[pKey];
      if (typeof pObj === 'object' && !Array.isArray(pObj)) {
        // archetype level
        for (const aKey of ARCHETYPES) {
          if (pObj[aKey] && Array.isArray(pObj[aKey])) {
            const chars = aKey === '_default' ? getCharsForPersonality(pKey) : getChars(pKey, aKey);
            pObj[aKey].forEach((line, idx) => {
              if (typeof line !== 'string') return;
              rows.push({
                source: sourceName,
                path: prefix ? `${prefix} > ${idx+1}` : `${idx+1}`,
                archetype: A_LABELS[aKey] || aKey,
                personality: P_LABELS[pKey] || pKey,
                charCount: chars.length,
                chars: chars.join('、'),
                text: line,
              });
            });
          }
        }
      } else if (Array.isArray(pObj)) {
        // personality > [lines] (no archetype level, e.g. BT_HINT_LINES)
        const chars = getCharsForPersonality(pKey);
        pObj.forEach((line, idx) => {
          if (typeof line !== 'string') return;
          rows.push({
            source: sourceName,
            path: prefix ? `${prefix} > ${idx+1}` : `${idx+1}`,
            archetype: '全属性共通',
            personality: P_LABELS[pKey] || pKey,
            charCount: chars.length,
            chars: chars.join('、'),
            text: line,
          });
        });
      }
    }
  }
}

// ── 多階層walk (event > personality > archetype > [lines]) ──
function walkNestedPA(obj, sourceName, rows) {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('_')) continue; // skip _scene etc.
    if (typeof val === 'object' && !Array.isArray(val)) {
      // Check if this is a PA structure
      const hasPKey = PERSONALITIES.some(p => val[p]);
      if (hasPKey) {
        walkPALines(val, sourceName, key, rows);
      } else {
        // Deeper nesting (e.g., GLIMPSE_B_LINES GL-01 > win > PA)
        for (const [subKey, subVal] of Object.entries(val)) {
          if (subKey.startsWith('_')) continue;
          if (typeof subVal === 'object' && !Array.isArray(subVal)) {
            const hasPKey2 = PERSONALITIES.some(p => subVal[p]);
            if (hasPKey2) {
              walkPALines(subVal, sourceName, `${key} > ${subKey}`, rows);
            }
          }
        }
      }
    } else if (Array.isArray(val)) {
      // Flat array of strings at top level
      val.forEach((line, idx) => {
        if (typeof line === 'string') {
          rows.push({
            source: sourceName,
            path: `${key} > ${idx+1}`,
            archetype: '全キャラ共通', personality: '全性格共通',
            charCount: 0, chars: '', text: line,
          });
        } else if (typeof line === 'object' && line.text) {
          rows.push({
            source: sourceName,
            path: `${key} > ${idx+1}`,
            archetype: '全キャラ共通', personality: '全性格共通',
            charCount: 0, chars: '', text: line.text,
          });
        }
      });
    }
  }
}

// ── SNAPSHOT_TEXTS特殊: scene[] + voice{} ──
function walkSnapshot(obj, sourceName, rows) {
  for (const [eventId, data] of Object.entries(obj)) {
    if (data.scene && Array.isArray(data.scene)) {
      data.scene.forEach((line, idx) => {
        rows.push({
          source: sourceName,
          path: `${eventId} > scene > ${idx+1}`,
          archetype: '全キャラ共通', personality: '全性格共通',
          charCount: 0, chars: '', text: line,
        });
      });
    }
    if (data.voice) {
      walkPALines(data.voice, sourceName, `${eventId} > voice`, rows);
    }
    if (data.modal) {
      walkPALines(data.modal, sourceName, `${eventId} > modal`, rows);
    }
  }
}

// ── フラット配列 ──
function walkFlatArray(arr, sourceName, rows) {
  if (!Array.isArray(arr)) return;
  arr.forEach((item, idx) => {
    if (typeof item === 'string') {
      rows.push({
        source: sourceName, path: `${idx+1}`,
        archetype: '全キャラ共通', personality: '全性格共通',
        charCount: 0, chars: '', text: item,
      });
    } else if (typeof item === 'object') {
      const text = item.text || item.detail || JSON.stringify(item);
      rows.push({
        source: sourceName, path: `${idx+1}`,
        archetype: '全キャラ共通', personality: '全性格共通',
        charCount: 0, chars: '', text: text,
      });
    }
  });
}

// ── EMOTION_TEXTS特殊 (relationships.js内) ──
function walkEmotionTexts(obj, sourceName, rows) {
  for (const [category, pObj] of Object.entries(obj)) {
    if (typeof pObj !== 'object') continue;
    for (const [pKey, lines] of Object.entries(pObj)) {
      if (!Array.isArray(lines)) continue;
      const chars = getCharsForPersonality(pKey);
      lines.forEach((line, idx) => {
        rows.push({
          source: sourceName, path: `${category} > ${idx+1}`,
          archetype: '全属性共通', personality: P_LABELS[pKey] || pKey,
          charCount: chars.length, chars: chars.join('、'), text: line,
        });
      });
    }
  }
}

// ── NOTIF_EVENT_TEXTS / LARGE_EVENT_TEXTS 特殊 ──
function walkEventTexts(obj, sourceName, rows) {
  for (const [key, arr] of Object.entries(obj)) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((item, idx) => {
      const text = typeof item === 'string' ? item : (item.text || item.detail || '');
      if (text) {
        rows.push({
          source: sourceName, path: `${key} > ${idx+1}`,
          archetype: '全キャラ共通', personality: '全性格共通',
          charCount: 0, chars: '', text: text,
        });
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════
// メインゲーム セリフ抽出
// ══════════════════════════════════════════════════════════════
const mainRows = [];

// PA構造 (personality > archetype > [lines])
const paSimple = [
  'BREAKTHROUGH_LINES', 'SLUMP_END_LINES', 'MOTIVATION_LOSS_LINES',
  'MOTIVATION_RECOVERY_LINES',
  'PPV_OPPONENT_LINES', 'WAR_VICTORY_LINES',
  'WAR_CHALLENGER_DIALOGUE', 'WAR_DECLINE_DIALOGUE',
  'PPV_SUMMIT_VICTORY_LINES',
  'VOLUNTARY_STAY_LINES', 'GLIMPSE_HOTSTREAK_END_LINES',
];
for (const name of paSimple) {
  const obj = global[name];
  if (obj) walkPALines(obj, name, '', mainRows);
}

// PA with personality-only keys (no archetype level)
if (typeof BT_HINT_LINES !== 'undefined') {
  walkPALines(BT_HINT_LINES, 'BT_HINT_LINES', '', mainRows);
}

// Nested PA (category > personality > archetype > [lines])
const nestedPA = [
  'AWARD_LINES', 'SLUMP_START_LINES', 'MOTIVATION_RECOVERY_LINES',
  'NOTIF_DIALOGUES', 'CARE_REACTION_DIALOGUES', 'CHOICE_EVENT_DIALOGUES',
  'LARGE_EVENT_DIALOGUES', 'NEGOTIATE_LINES', 'CONTRACT_NEGOTIATION_LINES',
  'RETIREMENT_LINES', 'RETIRE_ACCEPT_LINES', 'RETIRE_REFUSE_LINES', 'RETAIN_LINES',
  'ENDING_LINES', 'JUNIOR_TOURNAMENT_LINES',
  'FAN_EXPECT_REACTIONS',
  'RIVALRY_CONFRONTATION_LINES', 'RIVALRY_CONFRONTATION_LINES_70',
  'RIVALRY_CONFRONTATION_LINES_90', 'RIVALRY_RESOLUTION_LINES',
  'GOODRIVAL_RESOLUTION_LINES', 'BITTER_RESOLUTION_LINES', 'UPSET_RIVALRY_LINES',
  'WAR_POST_DIALOGUE',
  'GLIMPSE_A_LINES', 'GLIMPSE_B_LINES',
];
for (const name of nestedPA) {
  const obj = global[name];
  if (obj) walkNestedPA(obj, name, mainRows);
}

// SNAPSHOT_TEXTS (scene + voice special structure)
if (typeof SNAPSHOT_TEXTS !== 'undefined') walkSnapshot(SNAPSHOT_TEXTS, 'SNAPSHOT_TEXTS', mainRows);

// EMOTION_TEXTS (category > archetype > single_string)
if (typeof EMOTION_TEXTS !== 'undefined') {
  for (const [category, aObj] of Object.entries(EMOTION_TEXTS)) {
    if (typeof aObj !== 'object') continue;
    for (const [aKey, text] of Object.entries(aObj)) {
      if (typeof text !== 'string') continue;
      mainRows.push({
        source: 'EMOTION_TEXTS', path: `${category} > ${aKey}`,
        archetype: A_LABELS[aKey] || aKey, personality: '全性格共通',
        charCount: 0, chars: '', text: text,
      });
    }
  }
}

// Flat arrays
if (typeof CAMP_FLAVOR_TEXTS !== 'undefined') walkFlatArray(CAMP_FLAVOR_TEXTS, 'CAMP_FLAVOR_TEXTS', mainRows);
if (typeof PPV_COACH_PRAISE_LINES !== 'undefined') walkFlatArray(PPV_COACH_PRAISE_LINES, 'PPV_COACH_PRAISE_LINES', mainRows);
if (typeof RETIREMENT_CHAMPION_WORRY_LINES !== 'undefined') {
  if (Array.isArray(RETIREMENT_CHAMPION_WORRY_LINES)) {
    walkFlatArray(RETIREMENT_CHAMPION_WORRY_LINES, 'RETIREMENT_CHAMPION_WORRY_LINES', mainRows);
  } else {
    walkPALines(RETIREMENT_CHAMPION_WORRY_LINES, 'RETIREMENT_CHAMPION_WORRY_LINES', '', mainRows);
  }
}

// RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE (archetype > [lines])
if (typeof RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE !== 'undefined') {
  const obj = RETIREMENT_CHAMPION_WORRY_LINES_ARCHETYPE;
  for (const [aKey, lines] of Object.entries(obj)) {
    if (!Array.isArray(lines)) continue;
    lines.forEach((line, idx) => {
      mainRows.push({
        source: 'RET_CHAMPION_WORRY_ARCHETYPE', path: `${aKey} > ${idx+1}`,
        archetype: A_LABELS[aKey] || aKey, personality: '全性格共通',
        charCount: 0, chars: '', text: line,
      });
    });
  }
}

// COACH_RETIRE_ADVICE_TEXTS (reason > [strings])
if (typeof COACH_RETIRE_ADVICE_TEXTS !== 'undefined') walkEventTexts(COACH_RETIRE_ADVICE_TEXTS, 'COACH_RETIRE_ADVICE_TEXTS', mainRows);

// NOTIF_EVENT_TEXTS / LARGE_EVENT_TEXTS
if (typeof NOTIF_EVENT_TEXTS !== 'undefined') {
  for (const [key, arr] of Object.entries(NOTIF_EVENT_TEXTS)) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((item, idx) => {
      if (item.text) mainRows.push({ source:'NOTIF_EVENT_TEXTS', path:`${key} > text > ${idx+1}`, archetype:'全キャラ共通', personality:'全性格共通', charCount:0, chars:'', text:item.text });
      if (item.detail) mainRows.push({ source:'NOTIF_EVENT_TEXTS', path:`${key} > detail > ${idx+1}`, archetype:'全キャラ共通', personality:'全性格共通', charCount:0, chars:'', text:item.detail });
    });
  }
}
if (typeof LARGE_EVENT_TEXTS !== 'undefined') {
  for (const [key, arr] of Object.entries(LARGE_EVENT_TEXTS)) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((item, idx) => {
      if (item.text) mainRows.push({ source:'LARGE_EVENT_TEXTS', path:`${key} > text > ${idx+1}`, archetype:'全キャラ共通', personality:'全性格共通', charCount:0, chars:'', text:item.text });
      if (item.detail) mainRows.push({ source:'LARGE_EVENT_TEXTS', path:`${key} > detail > ${idx+1}`, archetype:'全キャラ共通', personality:'全性格共通', charCount:0, chars:'', text:item.detail });
    });
  }
}

// TEAM_SPIRIT_TEXTS
if (typeof TEAM_SPIRIT_TEXTS !== 'undefined') {
  TEAM_SPIRIT_TEXTS.forEach((item, idx) => {
    const text = typeof item === 'string' ? item : (item.text || item.detail || JSON.stringify(item));
    mainRows.push({ source:'TEAM_SPIRIT_TEXTS', path:`${idx+1}`, archetype:'全キャラ共通', personality:'全性格共通', charCount:0, chars:'', text });
  });
}

// ATMOSPHERE_TEXTS
if (typeof ATMOSPHERE_TEXTS !== 'undefined') {
  ATMOSPHERE_TEXTS.forEach((level, li) => {
    if (Array.isArray(level)) {
      level.forEach((item, idx) => {
        const text = typeof item === 'string' ? item : (item.emoji ? `${item.emoji} ${item.text}` : item.text || JSON.stringify(item));
        mainRows.push({ source:'ATMOSPHERE_TEXTS', path:`level${li+1} > ${idx+1}`, archetype:'全キャラ共通', personality:'全性格共通', charCount:0, chars:'', text });
      });
    }
  });
}

// COACH_REPORT_TEXTS
if (typeof COACH_REPORT_TEXTS !== 'undefined') walkEventTexts(COACH_REPORT_TEXTS, 'COACH_REPORT_TEXTS', mainRows);

// PRE_WINDOW_TEXTS / LOCKER_AIR_TEXTS
if (typeof PRE_WINDOW_TEXTS !== 'undefined') walkEventTexts(PRE_WINDOW_TEXTS, 'PRE_WINDOW_TEXTS', mainRows);
if (typeof LOCKER_AIR_TEXTS !== 'undefined') walkEventTexts(LOCKER_AIR_TEXTS, 'LOCKER_AIR_TEXTS', mainRows);

// SCOUT_SIGNING_LINES (victory-lines.js)
if (typeof SCOUT_SIGNING_LINES !== 'undefined') walkNestedPA(SCOUT_SIGNING_LINES, 'SCOUT_SIGNING_LINES', mainRows);

// ══════════════════════════════════════════════════════════════
// 試合セリフ抽出
// ══════════════════════════════════════════════════════════════
const battleRows = [];

// VICTORY_LINES (characterId > [lines])
if (typeof VICTORY_LINES !== 'undefined') {
  for (const [charId, lines] of Object.entries(VICTORY_LINES)) {
    if (!Array.isArray(lines)) continue;
    const char = ALL_CHARS.find(c => String(c.id) === String(charId));
    const charName = char ? char.name : `ID:${charId}`;
    lines.forEach((line, idx) => {
      battleRows.push({
        source: 'VICTORY_LINES', path: `${charId} > ${idx+1}`,
        archetype: char ? (A_LABELS[char.archetype] || char.archetype || 'デフォルト') : '',
        personality: char ? (P_LABELS[char.personality] || char.personality || 'ノーマル') : '',
        charCount: 1, chars: charName, text: line,
      });
    });
  }
}

// RIVALRY_MATCH_REACTION
if (typeof RIVALRY_MATCH_REACTION !== 'undefined') {
  walkNestedPA(RIVALRY_MATCH_REACTION, 'RIVALRY_MATCH_REACTION', battleRows);
}

// ── 結果出力 ──
const output = {
  charMap: charMap,
  mainRows: mainRows,
  battleRows: battleRows,
};

process.stdout.write(JSON.stringify(output, null, 0));
process.stderr.write(`Main: ${mainRows.length} rows, Battle: ${battleRows.length} rows\n`);
