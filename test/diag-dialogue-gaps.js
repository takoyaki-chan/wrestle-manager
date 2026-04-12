/**
 * diag-dialogue-gaps.js
 * Scans all _LINES / _DIALOGUES / _TEXTS dialogue blocks in data.js
 * and reports which personality x archetype combos are missing.
 *
 * Usage:  node test/diag-dialogue-gaps.js
 */

'use strict';

const path = require('path');
const D = require(path.resolve(__dirname, '..', 'src', 'data.js'));

// ── Reference: personality x archetype combos that SHOULD have dedicated lines ──
const REQUIRED_COMBOS = {
  normal:    ['ojousama', 'delinquent', 'cool', 'seductive', 'polite', 'composed'],
  bold:      ['ojousama', 'delinquent', 'cool', 'seductive', 'polite', 'composed'],
  quiet:     ['cool', 'seductive', 'polite', 'composed'],
  shy:       ['ojousama', 'delinquent', 'polite'],
  easygoing: ['ojousama', 'delinquent', 'seductive', 'polite', 'composed'],
  earnest:   ['ojousama', 'seductive', 'polite', 'composed'],
  emotional: ['seductive', 'composed'],
};

const ALL_PERSONALITIES = Object.keys(REQUIRED_COMBOS);

// ── Sources to scan ──
const SOURCES = [
  'AWARD_LINES',
  'BITTER_RESOLUTION_LINES',
  'BREAKTHROUGH_LINES',
  'BT_HINT_LINES',
  'CARE_REACTION_DIALOGUES',
  'CHOICE_EVENT_DIALOGUES',
  'CONTRACT_NEGOTIATION_LINES',
  'ENDING_LINES',
  'GLIMPSE_A_LINES',
  'GLIMPSE_B_LINES',
  'GLIMPSE_HOTSTREAK_END_LINES',
  'GOODRIVAL_RESOLUTION_LINES',
  'LARGE_EVENT_DIALOGUES',
  'MOTIVATION_LOSS_LINES',
  'MOTIVATION_RECOVERY_LINES',
  'NEGOTIATE_LINES',
  'NOTIF_DIALOGUES',
  'PPV_OPPONENT_LINES',
  'RETAIN_LINES',
  'RETIREMENT_LINES',
  'RETIRE_ACCEPT_LINES',
  'RETIRE_REFUSE_LINES',
  'RIVALRY_CONFRONTATION_LINES',
  'RIVALRY_CONFRONTATION_LINES_70',
  'RIVALRY_CONFRONTATION_LINES_90',
  'RIVALRY_MATCH_REACTION',
  'RIVALRY_RESOLUTION_LINES',
  'SLUMP_END_LINES',
  'SLUMP_START_LINES',
  'SNAPSHOT_TEXTS',
  'UPSET_RIVALRY_LINES',
  'WAR_VICTORY_LINES',
];

// ── Helpers ──

/**
 * Detect whether an object is a "personality block" —
 * i.e. it has a _default key whose value is an array of strings.
 */
function isPersonalityBlock(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) && Array.isArray(obj._default);
}

/**
 * Detect whether an object is a "personality-level map" —
 * i.e. its keys are personality names and the values are personality blocks.
 */
function isPersonalityMap(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  // Must have at least one known personality as a key with a personality block value
  return keys.some(k => ALL_PERSONALITIES.includes(k) && isPersonalityBlock(obj[k]));
}

/**
 * Recursively walk an object tree and collect all personality maps,
 * tracking the dotted path for reporting.
 */
function collectPersonalityMaps(obj, prefix, results) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;

  if (isPersonalityMap(obj)) {
    results.push({ path: prefix, map: obj });
    return; // Don't recurse further into personality blocks
  }

  // Recurse into children
  for (const key of Object.keys(obj)) {
    // Skip special keys that are arrays (like 'scene' in SNAPSHOT_TEXTS)
    if (Array.isArray(obj[key])) continue;
    collectPersonalityMaps(obj[key], prefix ? `${prefix}.${key}` : key, results);
  }
}

/**
 * Given a personality map, check for missing archetypes.
 * Returns array of { personality, present, missing }.
 */
function checkPersonalityMap(map) {
  const results = [];
  for (const personality of ALL_PERSONALITIES) {
    const block = map[personality];
    if (!block) {
      // Personality itself is missing — we still report its expected archetypes
      const required = REQUIRED_COMBOS[personality];
      if (required.length > 0) {
        results.push({
          personality,
          personalityPresent: false,
          present: [],
          missing: [...required],
        });
      }
      continue;
    }

    // block is a personality block (has _default + optional archetype keys)
    const archetypeKeys = Object.keys(block).filter(k => k !== '_default');
    const required = REQUIRED_COMBOS[personality];
    const present = required.filter(a => archetypeKeys.includes(a));
    const missing = required.filter(a => !archetypeKeys.includes(a));

    if (missing.length > 0) {
      results.push({
        personality,
        personalityPresent: true,
        present,
        missing,
      });
    }
  }
  return results;
}

// ── Main ──

let totalGapsOverall = 0;
const gapsBySource = {};
const gapsByCombo = {};  // key: "personality.archetype" -> count

for (const sourceName of SOURCES) {
  const sourceObj = D[sourceName];
  if (!sourceObj) {
    console.log(`=== ${sourceName} === (NOT FOUND IN EXPORTS)\n`);
    continue;
  }

  // Collect all personality maps in this source
  const maps = [];
  collectPersonalityMaps(sourceObj, '', maps);

  if (maps.length === 0) {
    console.log(`=== ${sourceName} === (no personality maps found — check structure)\n`);
    continue;
  }

  const sourceGaps = [];

  for (const { path: mapPath, map } of maps) {
    const issues = checkPersonalityMap(map);
    for (const issue of issues) {
      const pathLabel = mapPath ? `${mapPath}.${issue.personality}` : issue.personality;
      sourceGaps.push({ pathLabel, ...issue });

      for (const arch of issue.missing) {
        const comboKey = `${issue.personality}.${arch}`;
        gapsByCombo[comboKey] = (gapsByCombo[comboKey] || 0) + 1;
      }
    }
  }

  if (sourceGaps.length > 0) {
    console.log(`=== ${sourceName} ===`);
    let sourceTotal = 0;
    for (const gap of sourceGaps) {
      const presentStr = gap.present.length > 0 ? gap.present.join(', ') : '(none)';
      const missingStr = gap.missing.join(', ');
      const prefix = gap.personalityPresent ? '' : ' [PERSONALITY MISSING]';
      console.log(`  ${gap.pathLabel}: [${presentStr}] | missing: [${missingStr}]${prefix}`);
      sourceTotal += gap.missing.length;
    }
    console.log(`  --- subtotal: ${sourceTotal} gaps ---\n`);
    gapsBySource[sourceName] = sourceTotal;
    totalGapsOverall += sourceTotal;
  }
}

// ── Summary ──
console.log('============================================================');
console.log('SUMMARY: Gaps per source');
console.log('============================================================');
const sortedSources = Object.entries(gapsBySource).sort((a, b) => b[1] - a[1]);
for (const [name, count] of sortedSources) {
  console.log(`  ${name}: ${count}`);
}

console.log('');
console.log('============================================================');
console.log('SUMMARY: Gaps per personality.archetype combo');
console.log('============================================================');
const sortedCombos = Object.entries(gapsByCombo).sort((a, b) => b[1] - a[1]);
for (const [combo, count] of sortedCombos) {
  console.log(`  ${combo}: ${count}`);
}

console.log('');
console.log(`TOTAL GAPS: ${totalGapsOverall}`);
console.log(`Sources with gaps: ${Object.keys(gapsBySource).length} / ${SOURCES.length}`);
console.log(`Personality-map locations scanned: ${SOURCES.reduce((acc, s) => {
  const obj = D[s];
  if (!obj) return acc;
  const maps = [];
  collectPersonalityMaps(obj, '', maps);
  return acc + maps.length;
}, 0)}`);
