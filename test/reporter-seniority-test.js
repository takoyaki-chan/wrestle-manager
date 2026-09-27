'use strict';

// 取次(結果画面の上に出る語り手)の人選。
// 2026-09-27 作者指摘: コーチ不在時に「最年長」だけで選んでいたため、旗揚げ直後は
// 入団したばかりの新人が「古参選手」として事情を語っていた。
// 在籍季数(careerSeasons)1季以上を古参として優先し、いなければ最年長を「選手」として立てる。

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'ui-common.js'), 'utf8');
const start = source.indexOf('function _factionPickReporter(');
assert.ok(start > 0, '_factionPickReporter が見つかる');
const end = source.indexOf('\n}', start) + 2;
const fnSource = source.slice(start, end);

const context = vm.createContext({
  Engine: { rng: { derive: () => 7 } },
  ALL_COACHES: [{ id: 1, name: 'テストコーチ' }],
});
vm.runInContext(`${fnSource}\nthis.pick = _factionPickReporter;`, context);
const pick = context.pick;

const rookie = (id, age) => ({ id, name: `新人${id}`, age, careerSeasons: 0 });
const veteran = (id, age, seasons) => ({ id, name: `古参${id}`, age, careerSeasons: seasons });

// 1) 旗揚げ直後(全員 careerSeasons 0・コーチ不在): 取次を立てない(新人に語らせない)
const yearOne = pick({ roster: [rookie(1, 17), rookie(2, 19), rookie(3, 18)], coaches: [], season: 1, week: 3 });
assert.strictEqual(yearOne, null, '在籍1季未満しかいなければ取次なし');

// 2) 在籍のある選手がいれば、いちばん長い選手が古参として立つ
const mixed = pick({ roster: [rookie(1, 30), veteran(2, 22, 1), veteran(3, 20, 4)], coaches: [], season: 5, week: 2 });
assert.strictEqual(mixed.kind, 'veteran', '在籍1季以上がいれば古参');
assert.strictEqual(mixed.ref.id, 3, '在籍の長い選手が優先(年齢より在籍)');

// 3) 同じ在籍季数なら年長
const sameTenure = pick({ roster: [veteran(1, 24, 2), veteran(2, 29, 2)], coaches: [], season: 5, week: 2 });
assert.strictEqual(sameTenure.ref.id, 2, '在籍が同じなら年長');

// 4) レンタル選手は取次にしない
const withRental = pick({
  roster: [{ id: 9, name: 'レンタル', age: 33, careerSeasons: 6, isRental: true }, veteran(2, 21, 1)],
  coaches: [], season: 5, week: 2,
});
assert.strictEqual(withRental.ref.id, 2, 'レンタルは除く');

// 5) コーチがいるときは従来どおりコーチ
const withCoach = pick({ roster: [veteran(2, 21, 3)], coaches: [1], season: 5, week: 2 });
assert.strictEqual(withCoach.kind, 'coach', 'コーチがいればコーチ');

// 6) 誰もいなければ null(表示側は従来どおり素通し)
assert.strictEqual(pick({ roster: [], coaches: [], season: 1, week: 1 }), null, 'ロスターが空なら null');

// 表示側: 取次がいなければ地の文(顔・名前・肩書きを出さない)へ落ちる
for (const strip of ['_mdlAReporterStrip', '_factionReporterStrip']) {
  const at = source.indexOf(`function ${strip}(`);
  assert.ok(at > 0, `${strip} が見つかる`);
  const body = source.slice(at, at + 1400);
  assert.ok(/_mdlANarrationStrip\(/.test(body), `${strip} は取次なしで地の文に落ちる`);
}
assert.ok(source.includes('function _mdlANarrationStrip('), '地の文ストリップがある');
assert.ok(!/let url = '', name = 'BLACKWELL', role = 'COACH';/.test(source), '仮置きの BLACKWELL/COACH は残っていない');

console.log('reporter-seniority-test: PASS');
