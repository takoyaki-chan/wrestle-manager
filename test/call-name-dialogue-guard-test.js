'use strict';
// 呼び名(2026-09-25 / specs/call-name-spec-v1.0.md)のガードテスト:
// セリフ表の行を実際の表示関数で埋めて、「話し手≠相手なのにフルネームが入っていない」ことを確かめる。
//   - 関係性フラグ(FLAG_DIALOGUE 全行・M-1 は離脱者を呼ぶ・M-12/M-13 の併記)
//   - 垣間見え(R3 別れのモーダル・本人の声)/ 地の文は従来どおりフルネーム
//   - 契約交渉のライバル({rivalName})
//   - 取次(コーチ/古参選手)の報告
//   - 英語: 同じ行が英語の名字/下の名前で埋まり、日本語の名前が漏れない
// 表示関数は src/ui-common.js から関数単位で切り出して、実エンジン+実 i18n(ja/en)の上で動かす。
// 切り出せない画面(派閥の取次・コーチ総括・道場)は、呼び名の関数を通していることをソースで確かめる。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const srcDir = path.join(__dirname, '..', 'src');
const read = (f) => fs.readFileSync(path.join(srcDir, f), 'utf8');
const JA_RE = /[぀-ヿ㐀-鿿]/;

// ── 実 i18n + 英語辞書 + エンジンを1つの文脈に読み込む ──────────────────────
const sandbox = { console, Math, JSON, Date, IS_TRIAL: false };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const runFile = (f, transform) => {
  let code = read(f);
  if (transform) {
    code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
    code = code.replace(/^(const|let) /gm, 'var ');
  }
  new vm.Script(code, { filename: f }).runInContext(sandbox);
};
['i18n.js', 'lang-en.js', 'lang-en-names.js', 'lang-en-templates.js', 'lang-en-dialogue.js'].forEach(f => runFile(f, false));
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js', 'match-engine.js',
  'relationships.js', 'flag-dialogue.js', 'factions.js'].forEach(f => runFile(f, true));

// ── ui-common.js から関数・定数を切り出す(文字列・テンプレート・コメントを飛ばして括弧を数える)──
const UI = read('ui-common.js');
function matchBlockEnd(src, openIdx) {
  let depth = 0;
  let i = openIdx;
  const stack = []; // テンプレートリテラルの ${ } の深さ
  while (i < src.length) {
    const c = src[i];
    const c2 = src.substr(i, 2);
    if (c2 === '//') { i = src.indexOf('\n', i); if (i < 0) return -1; continue; }
    if (c2 === '/*') { i = src.indexOf('*/', i + 2) + 2; continue; }
    if (c === "'" || c === '"') {
      i++;
      while (i < src.length && src[i] !== c) { if (src[i] === '\\') i++; i++; }
      i++; continue;
    }
    if (c === '`') {
      i++;
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\') { i += 2; continue; }
        if (src.substr(i, 2) === '${') { stack.push(depth); depth++; i += 2; break; }
        i++;
      }
      if (src[i] === '`') { i++; }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (stack.length && depth === stack[stack.length - 1]) {
        stack.pop();
        // テンプレートの続きへ
        i++;
        while (i < src.length && src[i] !== '`') {
          if (src[i] === '\\') { i += 2; continue; }
          if (src.substr(i, 2) === '${') { stack.push(depth); depth++; i += 2; break; }
          i++;
        }
        if (src[i] === '`') i++;
        continue;
      }
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return -1;
}
function extract(name, kind) {
  const head = kind === 'const' ? `const ${name} = ` : `function ${name}(`;
  const at = UI.indexOf(head);
  assert.ok(at >= 0, `ui-common.js に ${head} が無い`);
  const open = UI.indexOf('{', kind === 'const' ? at : UI.indexOf(')', at));
  const end = matchBlockEnd(UI, open);
  assert.ok(end > open, `${name} の終わりが見つからない`);
  let code = UI.slice(at, end);
  if (kind === 'const') code = code.replace(/^const /, 'var ') + ';';
  return code;
}
[['FLAG_MODAL_META', 'const'], ['callNameText'], ['_findFighterById'], ['_flagPickArchetype'], ['_flagFormatLine'],
  ['_flagBuildPopupOpts'], ['_flagBuildM12'], ['_flagBuildM13'], ['_snapshotLine'], ['_snapshotSpeechEntry'],
  ['_contractNegForDisplay'], ['_factionPickReporter'], ['_factionReporterSpeaker'], ['_choiceEventReporterLine'],
].forEach(([n, k]) => new vm.Script(extract(n, k), { filename: 'ui-common.js#' + n }).runInContext(sandbox));

const X = (code) => vm.runInContext(code, sandbox);
const I = X('WM_I18N');
const ALL = X('ALL_CHARS');
const byId = (id) => ALL.find(c => c.id === id);
const withRoster = (ids, extra) => {
  const roster = ids.map(id => ({ ...byId(id), popularity: 10 }));
  const G = { season: 3, week: 5, rngSeed: 11, roster, freeAgents: [], retiredFighters: [], aiOrgs: {}, coaches: [], relationships: {}, ...(extra || {}) };
  sandbox.G = G;
  return G;
};
const parts = (id) => X('Engine.relationships').callNameParts(id);

// 話し手・相手の組: 名字が先頭の典型 + 例外4名
const PAIRS = [[2, 1], [1, 2], [3, 87], [4, 116], [5, 117], [6, 124], [124, 87]];

// ── A) 関係性フラグ: 全行を埋める ─────────────────────────
function flagLines() {
  const FD = X('FLAG_DIALOGUE');
  const out = [];
  Object.keys(FD).forEach(type => {
    if (type[0] === '_') return;
    const walk = (node, sub) => {
      if (typeof node === 'string') { out.push({ type, sub, line: node }); return; }
      if (Array.isArray(node)) { node.forEach(n => walk(n, sub)); return; }
      if (node && typeof node === 'object') Object.keys(node).forEach(k => walk(node[k], sub || (['returner', 'forgiven', 'notForgiven', 'master', 'disciple'].includes(k) ? k : null)));
    };
    walk(FD[type], null);
  });
  return out;
}
const LINES = flagLines();
const nameLines = LINES.filter(l => /\{name2?\}/.test(l.line));
assert.ok(nameLines.length >= 180, `名前入りのフラグセリフ(実数 ${nameLines.length})`);
assert.ok(LINES.filter(l => l.type === 'M-1' && l.line.includes('{name}')).length >= 10, 'M-1 は {name}=離脱者');

for (const lang of ['ja', 'en']) {
  I.setLang(lang);
  for (const [sId, tId] of PAIRS) {
    const G = withRoster([sId, tId]);
    const speaker = byId(sId);
    const target = byId(tId);
    const p = parts(tId);
    const enSur = lang === 'en' ? I.pnSurname(target.name) : p.surname;
    const enGiv = lang === 'en' ? I.pnGiven(target.name) : (p.given || p.surname);
    for (const { type, line } of nameLines) {
      const isM1 = type === 'M-1';
      // 既定: 名字
      G.relationships = {};
      const out = X('_flagFormatLine')(line, speaker, target, isM1);
      assert.ok(!out.includes(target.name), `[${lang}] ${type} フルネームが入った: ${out}`);
      if (lang === 'en') assert.ok(!out.includes(I.pn(target.name)) || I.pn(target.name) === enSur, `[en] ${type} 英語フルネームが入った: ${out}`);
      assert.ok(out.includes(enSur), `[${lang}] ${type} 名字 "${enSur}" が入っていない: ${out}`);
      assert.ok(!/\{name2?\}/.test(out), `[${lang}] ${type} プレースホルダが残った: ${out}`);
      if (isM1) assert.ok(!out.includes(speaker.name) && !(lang === 'en' && out.includes(I.pn(speaker.name))), `[${lang}] M-1 話し手が自分の名前を言っている: ${out}`);
      if (lang === 'en') {
        assert.ok(!out.includes(p.surname) && !(p.given && out.includes(p.given)), `[en] ${type} 日本語の名前が漏れた: ${out}`);
      }
      // 絆 devoted: 下の名前(リングネームは名字のまま)
      G.relationships = { [`${sId}>${tId}`]: { bond: 90, rivalry: 0 } };
      const outG = X('_flagFormatLine')(line, speaker, target, isM1);
      assert.ok(outG.includes(enGiv) && !outG.includes(target.name), `[${lang}] ${type} devoted の呼び名 "${enGiv}": ${outG}`);
    }
  }
}
I.setLang('ja');

// M-1 の組み立て全体: 残留者(byIds[0])が離脱者(departerId)を呼ぶ
{
  const G = withRoster([2, 1]);
  G.relationships = { '2>1': { bond: 60 } };
  let hit = 0;
  for (let w = 1; w <= 40; w++) {
    const opts = X('_flagBuildPopupOpts')({ type: 'M-1', season: 3, week: w, payload: { departerId: 1, byIds: [2] } });
    assert.strictEqual(opts.id, 2, 'M-1 の話し手は残留者');
    assert.ok(!opts.speech.includes('富岡加奈子') && !opts.speech.includes('阿武隈塔子'), `M-1 にフルネーム: ${opts.speech}`);
    if (opts.speech.includes('阿武隈')) hit++;
    assert.ok(!opts.speech.includes('富岡'), `M-1 で話し手が自分の名前を言っている: ${opts.speech}`);
  }
  assert.ok(hit > 0, 'M-1 は離脱者の名字を呼ぶ');
  // M-12(出戻り): 反応した残留者が出戻り者を呼ぶ / M-13(師弟): 師匠→弟子・弟子→師匠
  G.relationships = { '2>1': { bond: 92 }, '1>2': { bond: 55 } };
  const m12 = X('_flagBuildM12')({ type: 'M-12', week: 3, payload: { returnerId: 1, reactions: [{ byId: 2, forgiven: true }] } }, X('FLAG_MODAL_META')['M-12']);
  assert.ok(!m12.detail.includes('阿武隈塔子'), `M-12 反応にフルネーム: ${m12.detail}`);
  const m13 = X('_flagBuildM13')({ type: 'M-13', payload: { masterId: 2, discipleId: 1 } }, X('FLAG_MODAL_META')['M-13']);
  assert.ok(!m13.speech.includes('阿武隈塔子') && !m13.detail.includes('富岡加奈子'), `M-13 にフルネーム: ${m13.speech} / ${m13.detail}`);
  if (/塔子|阿武隈/.test(m13.speech)) assert.ok(m13.speech.includes('塔子'), '師匠→弟子は絆92で下の名前');
  if (/富岡|加奈子/.test(m13.detail.split(': ').slice(1).join(': '))) assert.ok(m13.detail.includes('富岡'), '弟子→師匠は絆55で名字');
}

// ── B) 垣間見え: R3 別れのモーダル・本人の声は呼び名、地の文はフルネームのまま ──────────
{
  const G = withRoster([2, 1]);
  const R3 = X('SNAPSHOT_TEXTS').R3.modal;
  const lines = [];
  Object.values(R3).forEach(byP => Object.values(byP).forEach(arr => arr.forEach(l => { if (l.includes('{name2}')) lines.push(l); })));
  assert.ok(lines.length >= 6, 'R3 の名前入りセリフ');
  for (const bond of [60, 90]) {
    G.relationships = { '2>1': { bond } };
    lines.forEach(tpl => {
      const entry = { text: 'x', tpl, vars: { name: '富岡加奈子', name2: '阿武隈塔子' }, modalType: 'R3', fighterId: 2, fighter2Id: 1 };
      const out = X('_snapshotLine')(entry);
      assert.ok(!out.includes('阿武隈塔子'), `R3 にフルネーム: ${out}`);
      assert.ok(out.includes(bond >= 85 ? '塔子' : '阿武隈'), `R3 の呼び名(絆${bond}): ${out}`);
      assert.deepStrictEqual(entry.vars, { name: '富岡加奈子', name2: '阿武隈塔子' }, '保存値(vars)は書き換えない');
    });
  }
  G.relationships = { '2>1': { bond: 60 } };
  const voice = X('_snapshotLine')({ text: 'x', tpl: '…努力は裏切らない。…{name2}、ありがとう', vars: { name: '富岡加奈子', name2: '阿武隈塔子' }, voiceLead: '富岡加奈子', fighterId: 2, fighter2Id: 1 });
  assert.ok(voice.includes('阿武隈、ありがとう') && voice.startsWith('富岡加奈子'), `本人の声: 話者の表示名はフルネーム、セリフの中は呼び名: ${voice}`);
  const scene = X('_snapshotLine')({ text: 'x', tpl: '{name}が{name2}に技を教えている', vars: { name: '富岡加奈子', name2: '阿武隈塔子' }, fighterId: 2, fighter2Id: 1 });
  assert.strictEqual(scene, '富岡加奈子が阿武隈塔子に技を教えている', '地の文はフルネームのまま');
}

// ── C) 契約交渉: {rivalName} はライバルの呼び名(保存値はフルネームのまま)──────────
{
  const G = withRoster([2, 1]);
  const neg = { fighterId: 2, fighterName: '富岡加奈子', context: { rivalName: '阿武隈塔子', isFounder: false } };
  const has = X('CONTRACT_NEGOTIATION_LINES').rivalry.has_rival;
  for (const lang of ['ja', 'en']) {
    I.setLang(lang);
    for (const bond of [60, 88]) {
      G.relationships = { '2>1': { bond } };
      const disp = X('_contractNegForDisplay')(neg);
      assert.strictEqual(neg.context.rivalCallName, undefined, '元の neg を書き換えない');
      Object.keys(has).forEach(arch => {
        const f = { ...byId(2), archetype: arch };
        const out = X('Engine.contract')._insertRivalry('{rivalry}', disp.context, f, I.t);
        assert.ok(!out.includes('阿武隈塔子') && !out.includes('Toko Abukuma'), `[${lang}] ${arch} ライバルのフルネーム: ${out}`);
        const want = lang === 'en' ? (bond >= 85 ? 'Toko' : 'Abukuma') : (bond >= 85 ? '塔子' : '阿武隈');
        assert.ok(out.includes(want), `[${lang}] ${arch} 呼び名 "${want}": ${out}`);
        if (lang === 'en') assert.ok(!JA_RE.test(out), `[en] 日本語が漏れた: ${out}`);
      });
    }
  }
  I.setLang('ja');
  // 表示用の写しを渡さない呼び出し(auto-sim 等)は従来どおりフルネーム
  const raw = X('Engine.contract')._insertRivalry('{rivalry}', neg.context, byId(2), null);
  assert.ok(raw.includes('阿武隈塔子'), '保存値のままならフルネーム(エンジン単体の既定動作は不変)');
}

// ── D) 取次の報告: コーチは名字、古参選手は絆で決まる ─────────────────────
{
  const coachId = X('ALL_COACHES')[0].id;
  let G = withRoster([2, 1], { coaches: [coachId] });
  G.relationships = { '2>1': { bond: 95 }, '1>2': { bond: 95 } };
  const line = X('_choiceEventReporterLine')({ type: 'S3' }, byId(1), false, G);
  assert.ok(line.includes('阿武隈選手') && !line.includes('阿武隈塔子'), `コーチの取次は名字: ${line}`);
  // コーチ不在 → 在籍のある選手が取次(2026-09-27: 在籍1季未満しかいなければ取次を立てない)。
  // 話し手→相手の絆で下の名前
  G = withRoster([2, 1], { coaches: [] });
  G.roster = G.roster.map(f => ({ ...f, age: f.id === 2 ? 30 : 20, careerSeasons: f.id === 2 ? 4 : 1 }));
  G.relationships = { '2>1': { bond: 95 } };
  const vet = X('_choiceEventReporterLine')({ type: 'S3' }, G.roster.find(f => f.id === 1), false, G);
  assert.ok(vet.includes('塔子選手'), `古参選手の取次(絆95)は下の名前: ${vet}`);
}

// ── E) 切り出せない表示点は、呼び名の関数を通していることをソースで確かめる ──────────
{
  const UR = read('ui-render.js');
  assert.ok(/name: callNameText\(null, report\.fighterId != null \? report\.fighterId : _rp\.name, _rp\.name\)/.test(UR), '道場: コーチの報告 {name} は名字');
  assert.ok(/\.replace\('\{name\}', callNameText\(null, heatFighter, ''\)/.test(UR), '道場: コーチの熱量 {name} は名字');
  assert.ok(!/\.replace\('\{name\}', WM_I18N\.pn\(heatFighter\.name\)/.test(UR), '道場: フルネームの差し込みが残っていない');
  assert.ok(/n1: spoken\[0\] \? callNameText\(null, spoken\[0\]/.test(UI) && /n2: spoken\[1\] \? callNameText\(null, spoken\[1\]/.test(UI), 'コーチ総括の言及は名字');
  assert.ok(/getF07Line\('coachReport', \{ incidentType, vars: reporterVars \}/.test(UI), 'F07 の取次は呼び名');
  assert.ok(/getCommon1Line\('coachReport', \{ archetypeId, vars: \{ \.\.\.vars, aName: aCall, bName: bCall \} \}/.test(UI), 'Common-1 の取次は呼び名');
  assert.ok(/getCommon5Line\('coachReport', \{ archetypeId, vars: \{ \.\.\.vars, leaderName: leaderCall \} \}/.test(UI), 'Common-5 の取次は呼び名');
  assert.ok(/name: callNameText\(_factionReporterSpeaker\(state\), newcomer \|\| newcomerName, newcomerName\)/.test(UI), 'Common-3 の取次は呼び名');
  assert.ok(/name: requesterCall/.test(UI), '直訴の取次は呼び名');
  assert.ok(/name: callNameText\(_factionReporterSpeaker\(state\), champion\.fighter, champion\.fighter\.name\)/.test(UI), '統一王座の取次は呼び名');
  assert.ok(/name: loserF \? callNameText\(_factionReporterSpeaker\(state\), loserF, loserName\) : loserName/.test(UI), '対立の敗者の取次は呼び名');
  assert.ok(/selectDialogue\(dialogueRng, neg, openPhase, _contractNegForDisplay\(neg\)\.context/.test(UI)
    && /selectDialogue\(dialogueRng, neg, 'sudden_departure', _contractNegForDisplay\(neg\)\.context/.test(UI), '契約交渉の最初のセリフは呼び名');
  const APP = read('app.js');
  assert.strictEqual((APP.match(/resolveNegotiation\([^)]*_contractNegForDisplay\(neg\)/g) || []).length, 3, '契約交渉の反応セリフ3経路は呼び名');
}

console.log('call-name-dialogue-guard-test: OK');
