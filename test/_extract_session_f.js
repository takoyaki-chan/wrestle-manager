const fs = require('fs');
const D = require('../src/data.js');

const TARGETS = {
  NOTIF_DIALOGUES: { obj: D.NOTIF_DIALOGUES, type: 'nested' },
  CARE_REACTION_DIALOGUES: { obj: D.CARE_REACTION_DIALOGUES, type: 'nested' },
  CHOICE_EVENT_DIALOGUES: { obj: D.CHOICE_EVENT_DIALOGUES, type: 'nested' },
  LARGE_EVENT_DIALOGUES: { obj: D.LARGE_EVENT_DIALOGUES, type: 'nested' },
  GLIMPSE_B_LINES: { obj: D.GLIMPSE_B_LINES, type: 'glimpse_b' },
  SNAPSHOT_TEXTS: { obj: D.SNAPSHOT_TEXTS, type: 'snapshot' },
};

// Combos that need to exist (from instruction doc, non-composed)
const NEEDED_COMBOS = {
  NOTIF_DIALOGUES: [
    ['normal','polite'],['normal','cool'],['bold','polite'],
    ['quiet','seductive'],['easygoing','polite'],['easygoing','ojousama']
  ],
  CARE_REACTION_DIALOGUES: [
    ['normal','polite'],['normal','cool'],['bold','polite'],
    ['quiet','seductive'],['easygoing','polite'],['easygoing','ojousama']
  ],
  CHOICE_EVENT_DIALOGUES: [
    ['normal','polite'],['bold','polite'],
    ['quiet','seductive'],['easygoing','polite'],['easygoing','ojousama']
  ],
  LARGE_EVENT_DIALOGUES: [
    ['normal','polite'],['normal','cool'],['bold','polite'],
    ['quiet','seductive'],['easygoing','polite'],['easygoing','ojousama']
  ],
  GLIMPSE_B_LINES: [
    ['normal','polite'],['bold','polite'],['bold','seductive'],
    ['quiet','seductive'],['quiet','polite'],
    ['earnest','seductive'],['earnest','ojousama']
  ],
  SNAPSHOT_TEXTS: [
    ['normal','polite'],['normal','cool'],['normal','seductive'],
    ['bold','polite'],['bold','seductive'],
    ['quiet','polite'],['quiet','seductive'],
    ['earnest','seductive'],['earnest','ojousama'],
    ['emotional','composed'] // check if needed
  ],
};

const PERSONALITIES = ['normal','bold','quiet','shy','easygoing','earnest','emotional'];
const ARCHETYPES = ['ojousama','delinquent','cool','seductive','polite','composed'];

function extractNested(source, obj, combos) {
  const rows = [];
  for (const [subCat, persBlock] of Object.entries(obj)) {
    if (typeof persBlock !== 'object' || Array.isArray(persBlock)) continue;
    for (const [combo_p, combo_a] of combos) {
      if (!persBlock[combo_p]) continue; // personality block doesn't exist in this subcat
      const archBlock = persBlock[combo_p];
      const existing = archBlock[combo_a];
      rows.push({
        source, subcategory: subCat, event_id: subCat,
        personality: combo_p, archetype: combo_a, outcome: '',
        dialogue_text: existing ? (Array.isArray(existing) ? existing.join(' / ') : String(existing)) : '',
        scene_text: '', notes: existing ? '既存' : ''
      });
    }
  }
  return rows;
}

function extractGlimpseB(source, obj, combos) {
  const rows = [];
  // GLIMPSE_B_LINES has top-level keys like GL-01, GL-02, etc.
  // Each has outcome sub-keys (win, loss, etc.) or direct personality blocks
  for (const [glKey, glVal] of Object.entries(obj)) {
    if (typeof glVal !== 'object' || Array.isArray(glVal)) continue;
    // Check if this level has outcome keys or personality keys
    const keys = Object.keys(glVal);
    const hasOutcomes = keys.some(k => ['win','loss','goodLoss','greatWin','draw'].includes(k));
    const hasPersonalities = keys.some(k => PERSONALITIES.includes(k));

    if (hasOutcomes) {
      for (const [outcome, persBlock] of Object.entries(glVal)) {
        if (typeof persBlock !== 'object' || Array.isArray(persBlock)) continue;
        for (const [combo_p, combo_a] of combos) {
          if (!persBlock[combo_p]) continue;
          const archBlock = persBlock[combo_p];
          const existing = archBlock[combo_a];
          rows.push({
            source, subcategory: glKey, event_id: glKey,
            personality: combo_p, archetype: combo_a, outcome,
            dialogue_text: existing ? (Array.isArray(existing) ? existing.join(' / ') : String(existing)) : '',
            scene_text: '', notes: existing ? '既存' : ''
          });
        }
      }
    } else if (hasPersonalities) {
      // Direct personality blocks (no outcome layer)
      for (const [combo_p, combo_a] of combos) {
        if (!glVal[combo_p]) continue;
        const archBlock = glVal[combo_p];
        const existing = archBlock[combo_a];
        rows.push({
          source, subcategory: glKey, event_id: glKey,
          personality: combo_p, archetype: combo_a, outcome: '',
          dialogue_text: existing ? (Array.isArray(existing) ? existing.join(' / ') : String(existing)) : '',
          scene_text: '', notes: existing ? '既存' : ''
        });
      }
    }
  }
  return rows;
}

function extractSnapshot(source, obj, combos) {
  const rows = [];
  for (const [scenarioKey, scenarioVal] of Object.entries(obj)) {
    if (typeof scenarioVal !== 'object' || Array.isArray(scenarioVal)) continue;
    // SNAPSHOT_TEXTS has scene + voice structure, or direct personality blocks
    // Check for 'voice' sub-key or direct personality keys
    const keys = Object.keys(scenarioVal);
    const hasVoice = keys.includes('voice');
    const hasScene = keys.includes('scene');
    const hasPersonalities = keys.some(k => PERSONALITIES.includes(k));

    if (hasVoice || hasScene) {
      // scene + voice structure
      const voiceBlock = scenarioVal.voice || {};
      const sceneBlock = scenarioVal.scene || {};
      for (const [combo_p, combo_a] of combos) {
        const voicePerBlock = voiceBlock[combo_p];
        const scenePerBlock = sceneBlock[combo_p];
        if (!voicePerBlock && !scenePerBlock) continue;
        const voiceExisting = voicePerBlock ? voicePerBlock[combo_a] : undefined;
        const sceneExisting = scenePerBlock ? scenePerBlock[combo_a] : undefined;
        rows.push({
          source, subcategory: scenarioKey, event_id: scenarioKey,
          personality: combo_p, archetype: combo_a, outcome: '',
          dialogue_text: voiceExisting ? (Array.isArray(voiceExisting) ? voiceExisting.join(' / ') : String(voiceExisting)) : '',
          scene_text: sceneExisting ? (Array.isArray(sceneExisting) ? sceneExisting.join(' / ') : String(sceneExisting)) : '',
          notes: (voiceExisting || sceneExisting) ? '既存' : ''
        });
      }
    } else if (hasPersonalities) {
      // Direct personality blocks
      for (const [combo_p, combo_a] of combos) {
        if (!scenarioVal[combo_p]) continue;
        const archBlock = scenarioVal[combo_p];
        const existing = archBlock[combo_a];
        rows.push({
          source, subcategory: scenarioKey, event_id: scenarioKey,
          personality: combo_p, archetype: combo_a, outcome: '',
          dialogue_text: existing ? (Array.isArray(existing) ? existing.join(' / ') : String(existing)) : '',
          scene_text: '', notes: existing ? '既存' : ''
        });
      }
    }
  }
  return rows;
}

// Extract all data
const result = {};
for (const [name, { obj, type }] of Object.entries(TARGETS)) {
  const combos = NEEDED_COMBOS[name] || [];
  if (type === 'nested') result[name] = extractNested(name, obj, combos);
  else if (type === 'glimpse_b') result[name] = extractGlimpseB(name, obj, combos);
  else if (type === 'snapshot') result[name] = extractSnapshot(name, obj, combos);
}

// Output as JSON
fs.writeFileSync('test/_session_f_data.json', JSON.stringify(result, null, 2));
for (const [name, rows] of Object.entries(result)) {
  const empty = rows.filter(r => !r.dialogue_text && !r.scene_text).length;
  const filled = rows.filter(r => r.dialogue_text || r.scene_text).length;
  console.log(`${name}: ${rows.length} rows (${empty} empty, ${filled} existing)`);
}
