#!/usr/bin/env node
'use strict';

// 集客v2の興行ボリューム係数。数値表と通常興行経路を直接検査する。

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

['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js', 'management.js'].forEach(loadAsGlobal);

let checks = 0;
function check(label, actual, expected) {
  assert.strictEqual(actual, expected, label);
  checks++;
}
function close(label, actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} !== ${expected}`);
  checks++;
}

function singles(count) {
  return Array.from({ length: count }, (_, i) => ({ left: i * 2 + 1, right: i * 2 + 2 }));
}
function tag(offset) {
  return {
    matchType: 'tag',
    teamA: { fighter1: offset + 1, fighter2: offset + 2 },
    teamB: { fighter1: offset + 3, fighter2: offset + 4 },
  };
}
function state(orgPop) {
  return { orgPop, heatScore: 0, attendanceMomentum: 0, roster: [] };
}

// V導入前のD系計算。適正以上では旧shortPenaltyが発動しないため完全一致する。
function legacyAttendance(G, venueIdx, showDraw) {
  const cfg = ATTENDANCE_V2_CONFIG;
  const venue = VENUES[venueIdx];
  const reach = Engine.attendanceV2._interpolate(cfg.reachCurve, G.orgPop);
  const expected = Engine.attendanceV2._interpolate(cfg.expectedDrawCurve, G.orgPop);
  const ratio = expected > 0 ? showDraw / expected : 0;
  const draw = Engine.util.clamp(cfg.drawFloor + ratio * cfg.drawScale, cfg.drawFloor, cfg.drawCap);
  const raw = reach * draw * Engine.heat.getMult(G) * (1 + (G.attendanceMomentum || 0));
  const capped = Engine.attendanceV2._applySoftCap(raw, reach);
  const minAttendance = Math.max(10, Math.round(venue.cap * 0.05));
  return Engine.util.clamp(Math.round(capped), minAttendance, venue.cap);
}

// 1a. 適正ちょうど(=枠数-1)はV=1.0で旧D系と完全一致。
for (const sample of [
  { venueIdx: 6, slots: 4, draw: 260, pop: 65 },
  { venueIdx: 8, slots: 6, draw: 480, pop: 82 },
  { venueIdx: 9, slots: 7, draw: 540, pop: 95 },
]) {
  const G = state(sample.pop);
  const current = Engine.attendanceV2.calcAttendanceV2(G, sample.venueIdx, sample.draw, singles(sample.slots), null);
  check(`venue ${sample.venueIdx}, ${sample.slots}枠は旧D系と完全一致`, current.attendance,
    legacyAttendance(G, sample.venueIdx, sample.draw));
  close(`venue ${sample.venueIdx}, ${sample.slots}枠のV`, current.volumeFactor, 1.0);
}

// 1b. 枠数フル(=適正+1)は微弱ボーナスでV>1.0となり、旧D系より動員を押し上げる。
{
  const G = state(82);
  const current = Engine.attendanceV2.calcAttendanceV2(G, 8, 480, singles(7), null);
  const legacy = legacyAttendance(G, 8, 480);
  close('大会場7枠フルのV', current.volumeFactor, 1.04);
  assert.ok(current.attendance > legacy, `大会場7枠フル: ${current.attendance} <= ${legacy}`);
  checks++;
}

// 2. orgPop80・大ホール・シングル2試合の標準的な低drawカードは半分未満。
{
  const result = Engine.attendanceV2.calcAttendanceV2(state(80), 6, 160, singles(2), null);
  assert.ok(result.attendance / VENUES[6].cap < 0.5,
    `orgPop80・大ホール・2試合の占有率=${result.attendance / VENUES[6].cap}`);
  checks++;
}
for (const venueIdx of [6, 7, 8, 9]) {
  const result = Engine.attendanceV2.calcAttendanceV2(state(85), venueIdx, 160, singles(2), null);
  assert.ok(result.attendance / VENUES[venueIdx].cap < 0.8,
    `orgPop85・venue ${venueIdx}・2試合の占有率=${result.attendance / VENUES[venueIdx].cap}`);
  checks++;
}

// 3. 公民館の1試合はV=0.85で、最低でも半分の客を維持する。
{
  const result = Engine.attendanceV2.calcAttendanceV2(state(20), 0, 100, singles(1), null);
  close('公民館・1試合のV', result.volumeFactor, 0.85);
  assert.ok(result.attendance >= VENUES[0].cap * 0.5, `公民館1試合 attendance=${result.attendance}`);
  checks++;
}

// 4. フルカード(=枠数上限)の上乗せは1段のみで頭打ち。枠数を超える入力でも増えない。
close('大会場7枠フルのV', Engine.attendanceV2.calcVolumeFactor(8, 7), 1.04);
close('ドーム8枠フルのV', Engine.attendanceV2.calcVolumeFactor(9, 8), 1.06);
close('大会場の上乗せ上限', Engine.attendanceV2.calcVolumeFactor(8, 12), 1.04);
close('ドームの上乗せ上限', Engine.attendanceV2.calcVolumeFactor(9, 12), 1.06);

// 5. タッグは2枠。タッグ2+シングル1はシングル5と同じV。
{
  const tagCard = [tag(0), tag(10), { left: 31, right: 32 }];
  check('タッグ2+シングル1は5消費枠', Engine.attendanceV2.calcCardSlots(tagCard), 5);
  close('タッグ混在カードとシングル5のV一致',
    Engine.attendanceV2.calcVolumeFactor(8, Engine.attendanceV2.calcCardSlots(tagCard)),
    Engine.attendanceV2.calcVolumeFactor(8, Engine.attendanceV2.calcCardSlots(singles(5))));
}

// 6. 会場帯ごとの不足表(k=1〜4)をそのまま適用する。
const shortageTable = [
  [0.85, 0.65, 0.50, 0.50],
  [0.85, 0.60, 0.40, 0.40],
  [0.80, 0.50, 0.30, 0.20],
  [0.75, 0.45, 0.25, 0.15],
  [0.70, 0.40, 0.20, 0.10],
];
const representativeVenues = [0, 3, 6, 8, 9];
for (let band = 0; band < representativeVenues.length; band++) {
  const minMatches = SHOW_DRAW_CONFIG.minMatchesByVenue[representativeVenues[band]];
  shortageTable[band].forEach((expected, index) => {
    close(`会場帯${band} k=${index + 1}`,
      Engine.attendanceV2.calcVolumeFactor(representativeVenues[band], minMatches - (index + 1)), expected);
  });
}

console.log(`attendance-volume-factor-test: ${checks} checks passed`);
