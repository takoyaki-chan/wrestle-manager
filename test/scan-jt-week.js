// JT week (Week 25) のニュース構造を詳細にスキャンする。
// 「ジュニアトーナメント週に画像が出ないバグ」の原因候補を洗う。

const path = require('path'), fs = require('fs'), vm = require('vm');
const srcDir = path.join(__dirname, '..', 'src');
function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}
['victory-lines.js','data.js','data-faction-dialogue.js','management.js','match-engine.js','relationships.js','flag-dialogue.js','factions.js','draft-negotiation.js'].forEach(loadAsGlobal);

const seeds = [42, 7, 19, 314, 9001, 1234, 555, 8888];
let totalJTWeeks = 0, missingTopPortrait = 0, missingSubPortrait = 0, missingPlayerShowPortrait = 0;
const findings = [];

for (const seed of seeds) {
  let G = Engine.createInitialState(seed, true);
  G = { ...G, debugLog: G.debugLog || [] };
  const simRng = Engine.rng.create(seed ^ 0x5A5A5A5A);

  // 5シーズン分回す
  for (let attempts = 0; G.season <= 5 && attempts < 400; attempts++) {
    try {
      // 興行週なら適当に編成して実行
      if (G.weekPhase === 'show' || G.canHoldShow) {
        const roster = G.roster.filter(c => !c.injury && c.condition >= 40);
        if (roster.length >= 2) {
          const venueIdx = Math.min(9, Math.max(0, Math.floor(G.orgPop / 12)));
          const maxMatches = (typeof VENUES !== 'undefined') ? (VENUES[venueIdx] || VENUES[0]).maxMatches : 4;
          const shuffled = [...roster].sort(() => Engine.rng.float(simRng) - 0.5);
          const card = [];
          for (let i = 0; i + 1 < shuffled.length && card.length < maxMatches; i += 2) {
            card.push({ leftId: shuffled[i].id, rightId: shuffled[i+1].id, isTitle: false });
          }
          G = { ...G, currentShowCard: card };
          if (Engine.show?.execute) {
            try { const r = Engine.show.execute(G); if (r?.state) G = r.state; } catch(_) {}
          }
        }
      }
      const tick = Engine.tickWeek(G);
      G = { ...tick.state, gameLog: [] };

      // JT pendingフェーズなら手動で完結 → newspaper.generate を直接呼ぶ
      if (G.weekPhase === 'juniorTournament' && G._juniorTournamentSelection && !G._juniorTournamentSelection.cancelled) {
        const sel = G._juniorTournamentSelection;
        const jtRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB10));
        const jtResult = Engine.juniorTournament.run(G, sel.participants, jtRng);
        const applied = Engine.juniorTournament.apply(G, jtResult);
        G = { ...applied.state };
        // newspaper を強制生成
        const newsRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xC0DA));
        const wp = Engine.newspaper.generate(G, newsRng);
        G = { ...G, weeklyNewspaper: wp, _juniorTournamentResult: null };
        delete G._juniorTournamentSelection;
        G = { ...G, weekPhase: 'manage' };
      }

      // JT週(Week 25)の newspaper を捕まえる
      const wp = G.weeklyNewspaper;
      if (wp && wp.week === 25) {
        totalJTWeeks++;
        const ts = wp.topStory;
        const subs = wp.subStories || [];
        const psd = wp.playerShowData;
        const tsHasPortrait = !ts || ts.characterId == null || !!PORTRAIT[ts.characterId];
        if (ts && !tsHasPortrait) missingTopPortrait++;
        const subBad = subs.filter(s => s.characterId != null && !PORTRAIT[s.characterId]);
        if (subBad.length) missingSubPortrait += subBad.length;
        // player show 画像
        const psdLeftBad = psd?.cardA?.leftId && !PORTRAIT[psd.cardA.leftId];
        const psdRightBad = psd?.cardA?.rightId && !PORTRAIT[psd.cardA.rightId];
        if (psdLeftBad || psdRightBad) missingPlayerShowPortrait++;

        findings.push({
          seed, sw: `S${wp.season}W${wp.week}`,
          topType: ts?.type || null,
          topCid: ts?.characterId ?? null,
          topPortraitOK: tsHasPortrait,
          topHeadline: ts?.headline?.slice(0,40) || '(none)',
          subTypes: subs.map(s => `${s.type}:${s.characterId ?? 'null'}${s.characterId && !PORTRAIT[s.characterId] ? '!!' : ''}`).join(' / '),
          hasPlayerShow: !!psd,
          hasPages: !!(wp.pages && wp.pages.some(Boolean)),
          page2Stories: (wp.pages?.[0]?.stories || []).map(s => s.type).join(','),
        });
      }

      const adv = Engine.advanceWeek(G);
      G = { ...adv.state, gameLog: [] };
      if (G.pendingRetirements?.length) {
        const cr = Engine.retirement.commitRetirements(G, G.pendingRetirements.map(r => r.fighter));
        const { pendingRetirements:_d, ...rest } = cr.state;
        G = rest;
      }
    } catch(e) { console.error(`  [seed ${seed}] S${G.season}W${G.week}: ${e.message}`); break; }
  }
}

console.log(`\n=== JT週スキャン (${seeds.length}シード × 5シーズン) ===`);
console.log(`  JT週数: ${totalJTWeeks}`);
console.log(`  topStory PORTRAIT欠落:    ${missingTopPortrait}`);
console.log(`  subStories PORTRAIT欠落:  ${missingSubPortrait}`);
console.log(`  playerShowData PORTRAIT欠落: ${missingPlayerShowPortrait}`);
console.log('\n--- JT週ごとの内容 ---');
findings.forEach(f => {
  console.log(`[seed ${f.seed} ${f.sw}] top=${f.topType} cid=${f.topCid} portraitOK=${f.topPortraitOK}`);
  console.log(`  ${f.topHeadline}`);
  if (f.subTypes) console.log(`  subs: ${f.subTypes}`);
  console.log(`  playerShow=${f.hasPlayerShow} pages=${f.hasPages} extra=${f.page2Stories}`);
});
