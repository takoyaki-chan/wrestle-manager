#!/usr/bin/env node
// MQ再設計P4: 大ニュース記事(mqAllTimeRecord/mqTagRecord)の変数展開検証。
// 合成の記録更新イベント → Engine.mq.updateRecord(_pushRecordNews) → NEWS_HEADLINE_TEMPLATES
// 展開 まで通し、未置換の{変数}が残らないことを確認する軽量テスト。
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = { IS_TRIAL: false };
const srcDir = path.join(__dirname, '..', 'src');

function loadAsGlobal(filename) {
  let code = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename }).runInThisContext();
}

[
  'victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js',
].forEach(loadAsGlobal);

// ── §5.2: BIG_NEWS_TYPES は今回実装した2種のみ ──
assert.strictEqual(BIG_NEWS_TYPES.size, 2, 'P4時点ではmqAllTimeRecord/mqTagRecordの2種のみ');
assert.ok(BIG_NEWS_TYPES.has('mqAllTimeRecord'));
assert.ok(BIG_NEWS_TYPES.has('mqTagRecord'));

// ── 変数展開ヘルパー(Engine.newspaper.generateのindustryEvents展開と同じ置換規則) ──
function expand(tpl, data) {
  const rep = (s) => {
    let out = s;
    Object.keys(data).forEach(k => {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), data[k] != null ? data[k] : '');
    });
    return out;
  };
  return { headline: rep(tpl.headline), body: rep(tpl.body) };
}

function assertNoResidualPlaceholders(label, text) {
  const residual = text.match(/\{[a-zA-Z0-9_]+\}/g);
  assert.strictEqual(residual, null, `${label}: 未置換の変数が残っている -> ${residual}`);
}

// ── 合成state: シングル記録更新(旗色鮮明な最小ロースター) ──
function buildSingleState() {
  return {
    orgName: 'テスト団体',
    season: 5, week: 20,
    roster: [{ id: 1, name: '勝者選手', pw: 90, sp: 90, te: 90, st: 90, mn: 90 }],
    aiOrgs: {
      org_s: { roster: [{ id: 2, name: '敗者選手', pw: 80, sp: 80, te: 80, st: 80, mn: 80 }] },
    },
    freeAgents: [], retiredFighters: [],
    mqRecord: Engine.mq.createRecord(Engine.mq.SINGLE_RECORD_START),
  };
}

function buildTagState() {
  return {
    orgName: 'テスト団体',
    season: 6, week: 11,
    roster: [
      { id: 10, name: 'エース選手', pw: 95, sp: 95, te: 95, st: 95, mn: 95 },
      { id: 11, name: '相方選手', pw: 70, sp: 70, te: 70, st: 70, mn: 70 },
    ],
    aiOrgs: {
      org_a: { roster: [
        { id: 12, name: '敗者選手1', pw: 80, sp: 80, te: 80, st: 80, mn: 80 },
        { id: 13, name: '敗者選手2', pw: 80, sp: 80, te: 80, st: 80, mn: 80 },
      ] },
    },
    freeAgents: [], retiredFighters: [],
    mqRecordTag: Engine.mq.createRecord(Engine.mq.TAG_RECORD_START),
  };
}

// ── mqAllTimeRecord: 全stage分岐(STAGE_LABELS)で展開検証 ──
Object.keys(Engine.mq.STAGE_LABELS).forEach(stage => {
  const state = buildSingleState();
  const result = Engine.mq.updateRecord(state, { mq: state.mqRecord.value + 10 }, {
    holderIds: [1, 2], orgId: 'player', stage, matchType: 'singles', winnerId: 1,
  });
  assert.strictEqual(result.updated, true, `stage=${stage}: 記録更新が成立すること`);
  const events = result.state._industryNewsEvents || [];
  assert.strictEqual(events.length, 1, `stage=${stage}: news event が1件積まれること`);
  const ev = events[0];
  assert.strictEqual(ev.type, 'mqAllTimeRecord');
  assert.strictEqual(ev.data.name, '勝者選手');
  assert.strictEqual(ev.data.name2, '敗者選手');
  assert.strictEqual(ev.data.orgName, 'テスト団体');
  assert.strictEqual(ev.data.stage, Engine.mq.STAGE_LABELS[stage]);
  NEWS_HEADLINE_TEMPLATES.mqAllTimeRecord.forEach((tpl, idx) => {
    const { headline, body } = expand(tpl, ev.data);
    assertNoResidualPlaceholders(`mqAllTimeRecord[${idx}] stage=${stage} headline`, headline);
    assertNoResidualPlaceholders(`mqAllTimeRecord[${idx}] stage=${stage} body`, body);
  });
});

// ── mqTagRecord: エース優先充填規則(nameA1=勝者組OVR上位)の検証込み ──
{
  const state = buildTagState();
  const result = Engine.mq.updateRecord(state, { mq: state.mqRecordTag.value + 10 }, {
    holderIds: [10, 11, 12, 13], orgId: null, stage: 'springTag', matchType: 'tag',
    winnerIds: [11, 10], // あえて相方→エースの順で渡し、ソートで復元されるか確認
  });
  assert.strictEqual(result.updated, true, 'タッグ記録更新が成立すること');
  const events = result.state._industryNewsEvents || [];
  assert.strictEqual(events.length, 1, 'タッグ news event が1件積まれること');
  const ev = events[0];
  assert.strictEqual(ev.type, 'mqTagRecord');
  assert.deepStrictEqual(ev.characterIds, [10, 11], 'characterIds はOVR上位(エース)が先頭');
  assert.strictEqual(ev.data.nameA1, 'エース選手', '{nameA1}=勝者組OVR上位');
  assert.strictEqual(ev.data.nameA2, '相方選手');
  assert.ok(ev.data.nameB1 === '敗者選手1' || ev.data.nameB1 === '敗者選手2');
  assert.ok(ev.data.nameB2 === '敗者選手1' || ev.data.nameB2 === '敗者選手2');
  NEWS_HEADLINE_TEMPLATES.mqTagRecord.forEach((tpl, idx) => {
    const { headline, body } = expand(tpl, ev.data);
    assertNoResidualPlaceholders(`mqTagRecord[${idx}] headline`, headline);
    assertNoResidualPlaceholders(`mqTagRecord[${idx}] body`, body);
    // ｜区切りは本文中に必ず1回以上存在する(2段落構成の前提)
    assert.ok(tpl.body.includes('｜'), `mqTagRecord[${idx}]: ｜段落区切りが必須`);
  });
}

// ── 号外リード文言(BIG_NEWS_LEAD_LINES)の{mq}展開検証 ──
['mqAllTimeRecord', 'mqTagRecord'].forEach(type => {
  const lines = BIG_NEWS_LEAD_LINES[type];
  assert.ok(Array.isArray(lines) && lines.length === 2, `${type}: 号外リードは2バリエーション`);
  lines.forEach((line, idx) => {
    const filled = line.replace(/\{mq\}/g, '123');
    assertNoResidualPlaceholders(`${type} lead[${idx}]`, filled);
  });
});

// ── 記録未更新(value以下)では記事が積まれないこと ──
{
  const state = buildSingleState();
  const result = Engine.mq.updateRecord(state, { mq: state.mqRecord.value - 1 }, {
    holderIds: [1, 2], orgId: 'player', stage: 'normal', matchType: 'singles', winnerId: 1,
  });
  assert.strictEqual(result.updated, false);
  assert.strictEqual((result.state._industryNewsEvents || []).length, 0);
}

// ── winnerId不明(ドロー等)では数値記録のみ更新され、記事は積まれない(静かにスキップ) ──
{
  const state = buildSingleState();
  const result = Engine.mq.updateRecord(state, { mq: state.mqRecord.value + 5 }, {
    holderIds: [1, 2], orgId: 'player', stage: 'normal', matchType: 'singles', winnerId: null,
  });
  assert.strictEqual(result.updated, true, '数値記録自体は更新されること');
  assert.strictEqual((result.state._industryNewsEvents || []).length, 0, 'winnerId不明時は記事化しない');
}

console.log('mq-bignews-templates: ALL CLEAR (types=2, stages=' + Object.keys(Engine.mq.STAGE_LABELS).length + ', variants OK)');
