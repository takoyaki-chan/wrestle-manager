#!/usr/bin/env node
'use strict';
// ══════════════════════════════════════════════════════════════════════════════
//  test/career-record-legacy-saves-test.js — 実セーブで記録系の表示が組めるかの回帰ガード
//  (2026-09-25 面白さ総点検 06-①/②/⑤・03-⑦ の修正に付随)
//
//  ■ 何を守るか
//    実セーブ棚(test/ui-walkthrough/fixtures/legacy-saves/)の全選手・全殿堂入りについて、
//    経歴年表(Engine.milestone.get)・殿堂の実績欄(buildCareerHighlights)・引退セレモニーの
//    経歴欄(buildCareerSummary)・新聞(Engine.newspaper.generate)が、例外なく、
//    プレースホルダや undefined を露出させずに組めること。旧セーブの履歴には新しい型が
//    無い/欄が欠けていることがあるので、ここで実データを通す。
//    また、殿堂の実績欄から「○○王座王座」の二重表記が消えていること(保存値ではなく再生成)。
//
//  ■ 使い方
//    node test/career-record-legacy-saves-test.js
// ══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadGame } = require('./helpers/load-game.js');

loadGame({ full: true });

const SHELF = path.join(__dirname, 'ui-walkthrough', 'fixtures', 'legacy-saves');
const saves = fs.readdirSync(SHELF).filter(f => f.endsWith('.json')).sort();
assert.ok(saves.length > 0, '実セーブ棚が空');

const BAD = /\{[A-Za-z]+\}|undefined|NaN|\[object Object\]/;
// EN 側は辞書を読まない代わりに「(text, params) 契約のまま充填だけする」関数で通す
const fillOnly = (text, params) => (params ? text.replace(/\{([A-Za-z_]+)\}/g, (m, k) => (params[k] != null ? String(params[k]) : m)) : text);

let failed = 0;
const stats = { saves: 0, fighters: 0, rows: 0, hof: 0, hofLines: 0, summaries: 0, papers: 0 };
saves.forEach(name => {
  try {
    const raw = fs.readFileSync(path.join(SHELF, name), 'utf8');
    const G = JSON.parse(raw.startsWith('WM_LZ|') ? require('lz-string').decompressFromUTF16(raw.slice(6)) : raw);
    stats.saves++;
    const fighters = [
      ...(G.roster || []), ...(G.retiredFighters || []), ...(G.freeAgents || []),
      ...Object.values(G.aiOrgs || {}).flatMap(o => (o && o.roster) || []),
    ].filter(f => f && f.id != null);
    const seen = new Set();
    fighters.forEach(f => {
      if (seen.has(f.id)) return; // 重複ID(旧セーブの既知の傷)は最初の1人だけ
      seen.add(f.id);
      stats.fighters++;
      [undefined, fillOnly].forEach(dict => {
        const rows = Engine.milestone.get(G, f.id, dict);
        rows.forEach(r => {
          stats.rows++;
          const s = `${r.text} / ${r.detail || ''}`;
          assert.ok(!BAD.test(s.replace(' / ', '')), `${name} id${f.id}: 年表に露出: ${s}`);
        });
      });
      const summary = Engine.retirement.buildCareerSummary(f, undefined, G);
      stats.summaries++;
      summary.forEach(i => assert.ok(i.icon && i.text && !BAD.test(i.text), `${name} id${f.id}: 経歴欄に露出: ${i.text}`));
      assert.ok(summary.length <= 6, `${name} id${f.id}: 経歴欄が長すぎる(${summary.length})`);
    });
    Object.values(G.allHallOfFame || {}).flat().concat(G.hallOfFame || []).forEach(h => {
      if (!h || !h.careerRecord || !Array.isArray(h.careerRecord.history)) return;
      stats.hof++;
      const lines = Engine.awards.buildCareerHighlights(h.careerRecord, h.orgName || G.orgName || '', G);
      lines.forEach(l => {
        stats.hofLines++;
        assert.ok(l.text && !BAD.test(l.text), `${name} 殿堂 id${h.id}: 露出: ${l.text}`);
        assert.ok(!/王座王座/.test(l.text), `${name} 殿堂 id${h.id}: 王座の二重表記: ${l.text}`);
      });
    });
    const wp = Engine.newspaper.generate({ ...G, _industryNewsEvents: G._industryNewsEvents || [] }, Engine.rng.create(7));
    stats.papers++;
    [wp.topStory, ...(wp.subStories || [])].filter(Boolean)
      .forEach(s => assert.ok(!/undefined|NaN/.test(`${s.headline}${s.body || ''}`), `${name}: 新聞に露出: ${s.headline}`));
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${e && e.stack || e}`);
  }
});

console.log(`  (saves=${stats.saves} fighters=${stats.fighters} rows=${stats.rows} hof=${stats.hof} hofLines=${stats.hofLines} summaries=${stats.summaries} papers=${stats.papers})`);
if (failed > 0) {
  console.error(`\n${failed} save(s) failed.`);
  process.exit(1);
}
console.log('\ncareer-record-legacy-saves-test: all saves passed.');
