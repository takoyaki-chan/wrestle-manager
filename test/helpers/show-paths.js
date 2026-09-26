'use strict';

// test/helpers/show-paths.js — K-1「興行後の処理を一本化する」第3段(2026-09-26)
//
// 通常興行の試合後の処理は Engine.show.finalize に一本化した。エンジン(Engine.executeShow = auto-sim)と
// 実プレイ(App._finalizeShowImpl)の両方がこれを呼び、実プレイだけの処理は finalize の hooks に渡す
// App._finalizeHook* に置いてある。「その経路が共通の関数 X を通るか」を本文の文面で確かめるテストは、
// 経路の入口の本文と finalize の本文をつないだもの(下の engineShowBody / appShowBody)を見る。

const assert = require('assert');
const { readSource } = require('./source.js');

function sliceMethod(src, signature, closing) {
  const start = src.indexOf(signature);
  assert.ok(start >= 0, `${signature.trim()} が見つからない`);
  const end = src.indexOf(closing, start);
  assert.ok(end > start, `${signature.trim()} の終わりが見つからない`);
  return src.slice(start, end);
}

// Engine.show.finalize の本文
function finalizeBody() {
  return sliceMethod(readSource('src', 'management.js'), '    finalize(state, validMatches, results, ctx = {}) {', '\n    },\n');
}

// エンジンの経路(Engine.executeShow → Engine.show.finalize)
function engineShowBody() {
  const exe = sliceMethod(readSource('src', 'management.js'), '  executeShow(state) {', '\n  },\n');
  assert.ok(exe.includes('Engine.show.finalize('), 'executeShow が Engine.show.finalize を呼んでいない');
  return `${exe}\n${finalizeBody()}`;
}

// 実プレイの経路(App._finalizeShowImpl → Engine.show.finalize。実プレイだけの処理は App._finalizeHook*)
function appShowBody() {
  const app = readSource('src', 'app.js');
  const impl = sliceMethod(app, '  _finalizeShowImpl() {', '\n  },\n');
  assert.ok(impl.includes('Engine.show.finalize('), '_finalizeShowImpl が Engine.show.finalize を呼んでいない');
  const hookNames = [...new Set([...app.matchAll(/\n {2}(_finalizeHook\w+)\(/g)].map(m => m[1]))];
  const hooks = hookNames.map(name => sliceMethod(app, `\n  ${name}(`, '\n  },\n'));
  return [impl, ...hooks, finalizeBody()].join('\n');
}

module.exports = { finalizeBody, engineShowBody, appShowBody };
