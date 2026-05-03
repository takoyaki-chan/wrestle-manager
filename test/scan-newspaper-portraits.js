// 新聞 topStory / subStories の characterId と PORTRAIT[id] の整合性スキャン
// auto-sim と同じ loadAsGlobal 方式でエンジンをロード。
// プレイヤー判断は auto-sim と同じシンプル自動化（興行はランダム編成）。

const path = require('path');
const fs = require('fs');
const vm = require('vm');

const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
loadAsGlobal('victory-lines.js');
loadAsGlobal('data.js');
loadAsGlobal('data-faction-dialogue.js');
loadAsGlobal('management.js');
loadAsGlobal('match-engine.js');
loadAsGlobal('relationships.js');
loadAsGlobal('flag-dialogue.js');
loadAsGlobal('factions.js');
loadAsGlobal('draft-negotiation.js');

const seed = parseInt(process.argv[2] || '42', 10);
const targetSeasons = parseInt(process.argv[3] || '5', 10);

let G = Engine.createInitialState(seed, true);
G = { ...G, debugLog: G.debugLog || [] };
const simRng = Engine.rng.create(seed ^ 0x5A5A5A5A);

const typeStats = {};
const issues = [];
const recordStory = (s, where, sw) => {
  if (!s) return;
  const t = s.type || 'unknown';
  typeStats[t] = typeStats[t] || { total:0, withCid:0, nullCid:0, missingPortrait:0 };
  typeStats[t].total++;
  if (s.characterId == null) typeStats[t].nullCid++;
  else {
    typeStats[t].withCid++;
    if (!PORTRAIT[s.characterId]) {
      typeStats[t].missingPortrait++;
      const ch = ALL_CHARS.find(c => c.id === s.characterId);
      issues.push({
        where, sw, type:t, cid:s.characterId,
        name: ch ? ch.name : '(unknown)',
        headline: (s.headline||'').slice(0,60),
      });
    }
  }
};

// シンプルな興行自動編成
function autoSetupShowCard(G) {
  const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
  if (roster.length < 2) return G;
  const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
  const maxMatches = typeof VENUES !== 'undefined' ? (VENUES[venueIdx] || VENUES[0]).maxMatches : 4;
  const isSpecial = G.week % 12 === 0;
  const effectiveMax = Math.min(isSpecial ? maxMatches + 1 : maxMatches, 8);
  const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
  const card = [];
  for (let i = 0; i + 1 < shuffled.length && card.length < effectiveMax; i += 2) {
    card.push({ leftId: shuffled[i].id, rightId: shuffled[i+1].id, isTitle: false });
  }
  return { ...G, currentShowCard: card };
}

const seenWeeks = new Set();
let weeks = 0;
const SAFE_LIMIT = targetSeasons * 80;

while (G.season <= targetSeasons && weeks < SAFE_LIMIT) {
  try {
    // 興行週なら興行を実行
    if (G.weekPhase === 'show' || G.canHoldShow) {
      G = autoSetupShowCard(G);
      if (G.currentShowCard && G.currentShowCard.length > 0 && Engine.show?.execute) {
        try {
          const showResult = Engine.show.execute(G);
          if (showResult && showResult.state) G = showResult.state;
        } catch(_) {}
      }
    }

    // transient イベント・ラージイベントは skip（auto-sim の autoHandle* 相当を素通し）
    if (typeof Engine.events?.clearTransients === 'function') {
      G = Engine.events.clearTransients(G);
    }

    const tick = Engine.tickWeek(G);
    G = { ...tick.state, gameLog: [] };

    // 当週 newspaper を記録
    const wp = G.weeklyNewspaper;
    if (wp && wp.season != null) {
      const sw = `S${wp.season}W${wp.week}`;
      if (!seenWeeks.has(sw)) {
        seenWeeks.add(sw);
        recordStory(wp.topStory, 'top', sw);
        (wp.subStories||[]).forEach(s => recordStory(s, 'sub', sw));
      }
    }

    const adv = Engine.advanceWeek(G);
    G = { ...adv.state, gameLog: [] };
    if (G.pendingRetirements && G.pendingRetirements.length > 0) {
      const cr = Engine.retirement.commitRetirements(G, G.pendingRetirements.map(r => r.fighter));
      const { pendingRetirements:_d, ...rest } = cr.state;
      G = rest;
    }
    weeks++;
  } catch (e) {
    console.error(`week S${G.season}W${G.week}: ${e.message}`);
    break;
  }
}

console.log(`Seed=${seed} TargetSeasons=${targetSeasons}  weeks=${weeks}  papers=${seenWeeks.size}`);
console.log('--- type 別カウント ---');
const order = Object.keys(typeStats).sort((a,b)=>typeStats[b].total-typeStats[a].total);
order.forEach(t => {
  const s = typeStats[t];
  console.log(`  ${t.padEnd(28)} total=${String(s.total).padStart(4)}  withCid=${String(s.withCid).padStart(4)}  nullCid=${String(s.nullCid).padStart(4)}  missingPortrait=${s.missingPortrait}`);
});
if (issues.length) {
  console.log('--- PORTRAIT 欠落 (画像が出ない) ---');
  issues.slice(0, 30).forEach(i => {
    console.log(`  [${i.sw}] ${i.where} ${i.type} cid=${i.cid} name=${i.name} :: ${i.headline}`);
  });
  if (issues.length > 30) console.log(`  ... +${issues.length-30}`);
} else {
  console.log('PORTRAIT 欠落: 0  ✓');
}
