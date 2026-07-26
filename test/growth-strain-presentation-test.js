// growth-strain-presentation-test.js
//
// 成長リバランス v1.0 の「見せ方の層」の安全網。
// 消耗そのもの(係数)ではなく、**プレイヤーに伝わる経路**が生きていることを守る:
//   1. 追い込みでの負傷が seasonInjuries に載る(自団体・AI団体の両方)
//   2. コーチの匂わせセリフが8系統ぶん揃っている
//   3. 匂わせの差し替え分岐が _buildReportText に配線されている
//   4. 追い込みボタンとヘルプの文言が「後から来るツケ」を説明している
//
// 数値そのもの(0.15 / 0.25)は較正で動く前提なので固定しない。
// 「経路が消えていないこと」だけを検査する。

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

const management = read('src/management.js');
const uiRender = read('src/ui-render.js');
const indexHtml = read('src/index.html');
const dataJs = read('src/data.js');

let failed = 0;
function section(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '\n        ' + e.message); }
}

// ── coach-lines.js を実体で読む ──────────────────────────────────────────
let COACH_VOICE_REPORT_LINES, COACH_VOICE_MAP;
{
  const code = read('src/coach-lines.js')
    .replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '')
    .replace(/^(const|let) /gm, 'var ');
  const ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  new vm.Script(code, { filename: 'coach-lines.js' }).runInContext(ctx);
  COACH_VOICE_REPORT_LINES = ctx.COACH_VOICE_REPORT_LINES;
  COACH_VOICE_MAP = ctx.COACH_VOICE_MAP;
}

const VOICE_KEYS = ['sparta_roshi', 'sparta_tosho', 'theorist', 'artisan_bukotsu',
                    'artisan_seihitsu', 'mentor', 'bigheart_oyaji', 'bigheart_anego'];
const STRAIN_KEYS = ['strain_vague', 'strain_named', 'strain_injured'];

console.log('=== 成長リバランス: 見せ方の層 ===\n');

// ─────────────────────────────────────────────────────────────
// 1. 追い込みの怪我が消耗に載る
// ─────────────────────────────────────────────────────────────

section('1. 自団体の追い込み負傷が seasonInjuries を加算する', () => {
  const at = management.indexOf("type: '練習負傷'");
  assert.ok(at > 0, "自団体の練習負傷('練習負傷')が見つからない");
  const window = management.slice(at, at + 700);
  assert.ok(/nc\.seasonInjuries\s*=\s*\(nc\.seasonInjuries\s*\|\|\s*0\)\s*\+\s*1/.test(window),
    '練習負傷の直後に seasonInjuries の加算がない。' +
    'この加算が無いと、自団体の追い込みでの怪我だけが消耗に載らない');
});

section('2. AI団体の追い込み負傷も seasonInjuries を加算する（対称性）', () => {
  const at = management.indexOf("type: 'training injury'");
  assert.ok(at > 0, "AI団体の練習負傷('training injury')が見つからない");
  const window = management.slice(at, at + 400);
  assert.ok(/seasonInjuries/.test(window), 'AI団体側の seasonInjuries 加算が消えている');
});

section('3. seasonInjuries が実際に wear へ流れている', () => {
  assert.ok(/wearBonus\s*\+=\s*\(nc\.seasonInjuries\s*\|\|\s*0\)\s*\*/.test(management),
    'seasonInjuries が wearBonus に加算されていない。' +
    '怪我を数えても消耗に変換されなければ「先々に響く」が嘘になる');
});

// ─────────────────────────────────────────────────────────────
// 2. コーチの匂わせセリフ
// ─────────────────────────────────────────────────────────────

section('4. 8系統すべてに strain 3種が揃っている', () => {
  const missing = [];
  VOICE_KEYS.forEach(v => {
    assert.ok(COACH_VOICE_REPORT_LINES[v], `voiceKey ${v} が無い`);
    STRAIN_KEYS.forEach(k => {
      const pool = COACH_VOICE_REPORT_LINES[v][k];
      if (!Array.isArray(pool) || pool.length === 0) missing.push(`${v}.${k}`);
    });
  });
  assert.strictEqual(missing.length, 0, '欠落: ' + missing.join(', '));
});

section('5. COACH_VOICE_MAP のどの系統も strain を持つ（未登録コーチの取りこぼし防止）', () => {
  const used = new Set(Object.values(COACH_VOICE_MAP));
  used.add('theorist'); // フォールバック先
  const missing = [...used].filter(v =>
    !COACH_VOICE_REPORT_LINES[v] || STRAIN_KEYS.some(k => !COACH_VOICE_REPORT_LINES[v][k]));
  assert.strictEqual(missing.length, 0, 'strain を持たない系統が割り当てられている: ' + missing.join(', '));
});

section('6. strain_named / strain_injured は {name} を含む', () => {
  const bad = [];
  VOICE_KEYS.forEach(v => ['strain_named', 'strain_injured'].forEach(k => {
    (COACH_VOICE_REPORT_LINES[v][k] || []).forEach(line => {
      if (!line.includes('{name}')) bad.push(`${v}.${k}: ${line}`);
    });
  }));
  assert.strictEqual(bad.length, 0, '名指しなのに {name} が無い:\n        ' + bad.join('\n        '));
});

section('7. strain_vague は {name} を含まない（名を伏せるのが趣旨）', () => {
  const bad = [];
  VOICE_KEYS.forEach(v => (COACH_VOICE_REPORT_LINES[v].strain_vague || []).forEach(line => {
    if (line.includes('{name}')) bad.push(`${v}: ${line}`);
  }));
  assert.strictEqual(bad.length, 0, '漠然のはずが名指しになっている:\n        ' + bad.join('\n        '));
});

section('8. strain セリフに未展開のプレースホルダが残っていない', () => {
  const bad = [];
  VOICE_KEYS.forEach(v => STRAIN_KEYS.forEach(k => {
    (COACH_VOICE_REPORT_LINES[v][k] || []).forEach(line => {
      const tokens = line.match(/\{[^}]+\}/g) || [];
      tokens.forEach(t => { if (t !== '{name}') bad.push(`${v}.${k}: ${t}`); });
    });
  }));
  assert.strictEqual(bad.length, 0, '{name} 以外のプレースホルダ: ' + bad.join(', '));
});

section('9. strain セリフが数値を露出していない（匂わせであって通知ではない）', () => {
  const bad = [];
  VOICE_KEYS.forEach(v => STRAIN_KEYS.forEach(k => {
    (COACH_VOICE_REPORT_LINES[v][k] || []).forEach(line => {
      // 全角/半角の数字。「一度に」等の漢数字は許容する
      if (/[0-9０-９]/.test(line)) bad.push(`${v}.${k}: ${line}`);
    });
  }));
  assert.strictEqual(bad.length, 0, '数字が出ている:\n        ' + bad.join('\n        '));
});

section('10. strain セリフが内部変数名を露出していない', () => {
  const banned = ['wear', 'strainDebt', 'trainCap', 'seasonIntensiveWeeks', '消耗値', 'パラメータ'];
  const bad = [];
  VOICE_KEYS.forEach(v => STRAIN_KEYS.forEach(k => {
    (COACH_VOICE_REPORT_LINES[v][k] || []).forEach(line => {
      banned.forEach(w => { if (line.includes(w)) bad.push(`${v}.${k}: ${w}`); });
    });
  }));
  assert.strictEqual(bad.length, 0, '内部語が出ている: ' + bad.join(', '));
});

section('11. 8系統の口調が混ざっていない（系統ごとの語尾が保たれている）', () => {
  // 各系統を1つの決め手で照合する。全文一致ではなく「他系統の口調に化けていないか」だけ見る
  const marker = {
    theorist: l => /です|ます/.test(l),
    artisan_bukotsu: l => l.startsWith('……'),
    artisan_seihitsu: l => l.startsWith('……') && /です|ます|ません/.test(l),
    mentor: l => /です|ます/.test(l),
    bigheart_anego: l => /わ|のよ|けどね|んだけどね|からね/.test(l),
  };
  const bad = [];
  Object.keys(marker).forEach(v => STRAIN_KEYS.forEach(k => {
    (COACH_VOICE_REPORT_LINES[v][k] || []).forEach(line => {
      if (!marker[v](line)) bad.push(`${v}.${k}: ${line}`);
    });
  }));
  assert.strictEqual(bad.length, 0, '口調が外れている:\n        ' + bad.join('\n        '));
});

section('12. 全48本が重複していない', () => {
  const seen = new Map();
  const dup = [];
  VOICE_KEYS.forEach(v => STRAIN_KEYS.forEach(k => {
    (COACH_VOICE_REPORT_LINES[v][k] || []).forEach(line => {
      if (seen.has(line)) dup.push(`${seen.get(line)} と ${v}.${k}: ${line}`);
      else seen.set(line, `${v}.${k}`);
    });
  }));
  assert.strictEqual(dup.length, 0, '重複:\n        ' + dup.join('\n        '));
  assert.ok(seen.size >= 40, `本数が少なすぎる (${seen.size}本)`);
});

// ─────────────────────────────────────────────────────────────
// 3. 差し替え分岐の配線
// ─────────────────────────────────────────────────────────────

section('13. _buildReportText に strain 差し替えが配線されている', () => {
  const at = management.indexOf('_buildReportText(rng, obsRank, fighter, isInaccurate, coach)');
  assert.ok(at > 0, '_buildReportText が見つからない');
  const body = management.slice(at, at + 3000);
  assert.ok(/strain_vague/.test(body) && /strain_named/.test(body) && /strain_injured/.test(body),
    '3種すべてを引く分岐になっていない');
  assert.ok(/seasonIntensiveWeeks/.test(body), '追い込み週数を条件に使っていない');
  assert.ok(/練習負傷/.test(body), '練習負傷中かどうかを見ていない');
});

section('14. 差し替えは E/D で漠然・C以上で名指しに分かれる', () => {
  const at = management.indexOf('_buildReportText(rng, obsRank, fighter, isInaccurate, coach)');
  const body = management.slice(at, at + 3000);
  assert.ok(/obsRank === 'E' \|\| obsRank === 'D'\)\s*\?\s*'strain_vague'/.test(body),
    '観察眼 E/D のとき strain_vague を選ぶ分岐が無い');
});

section('15. 差し替えは通常報告より前に評価される', () => {
  const at = management.indexOf('_buildReportText(rng, obsRank, fighter, isInaccurate, coach)');
  const body = management.slice(at, at + 3000);
  const strainAt = body.indexOf('strain_vague');
  const vagueAt = body.indexOf('voicePool.vague');
  assert.ok(strainAt > 0 && vagueAt > 0 && strainAt < vagueAt,
    'strain 分岐が通常の vague 分岐より後にある（＝到達しない）');
});

section('16. 差し替え確率が過剰でない（毎週小言にならない）', () => {
  const at = management.indexOf('_buildReportText(rng, obsRank, fighter, isInaccurate, coach)');
  const body = management.slice(at, at + 3000);
  const m = body.match(/strained\s*&&\s*Engine\.rng\.float\(rng\)\s*<\s*([0-9.]+)/);
  assert.ok(m, '差し替え確率のガードが見つからない');
  const p = parseFloat(m[1]);
  assert.ok(p > 0 && p <= 0.5, `差し替え確率 ${p} が高すぎる。0.5 以下に保つこと`);
});

section('17. コーチ報告は既存の吹き出し経路で出ている', () => {
  assert.ok(/report\.reportText/.test(uiRender) && /dojo-scene-bubble/.test(uiRender),
    '道場バナーの吹き出しに reportText が流れていない');
});

// ─────────────────────────────────────────────────────────────
// 4. プレイヤーへの説明
// ─────────────────────────────────────────────────────────────

section('18. ⚡ボタンに代償を説明するツールチップが付いている', () => {
  const at = uiRender.indexOf('btn-intensive');
  assert.ok(at > 0, '⚡ボタンが見つからない');
  const window = uiRender.slice(Math.max(0, at - 800), at + 400);
  assert.ok(/_tipAttr\([^)]*追い込み/.test(window), '⚡ボタンにツールチップが無い');
  assert.ok(/峠/.test(window), 'ツールチップが「後から来る」ことに触れていない');
});

section('19. ツールチップが数値を露出していない', () => {
  const m = uiRender.match(/_tipAttr\('⚡追い込み[^']*'\)/);
  assert.ok(m, 'ツールチップ本文が取れない');
  assert.ok(!/[0-9０-９]/.test(m[0]), 'ツールチップに数字が出ている: ' + m[0]);
  ['wear', 'strainDebt', 'trainCap'].forEach(w =>
    assert.ok(!m[0].includes(w), `内部語 ${w} が出ている`));
});

section('20. ヘルプ「峠と引退」が追込のツケを説明している', () => {
  const at = indexHtml.indexOf('追込の使いすぎ');
  assert.ok(at > 0, 'ヘルプに追込の項目が無い');
  const line = indexHtml.slice(at, indexHtml.indexOf('</p>', at));
  assert.ok(/若いうち|表に出ない|溜ま/.test(line),
    '「若いうちは表に出ない」構造が説明されていない: ' + line);
  assert.ok(!/シーズンの終わりに答え合わせ/.test(line),
    '旧文言のまま。実際は峠に到達した年に一括で返るので、シーズン終わりではない');
});

// ─────────────────────────────────────────────────────────────
// 5. 係数の存在（値は固定しない）
// ─────────────────────────────────────────────────────────────

section('21. 較正定数が2つとも存在し、正の値である', () => {
  const a = dataJs.match(/intensiveWearPerWeek:\s*([0-9.]+)/);
  const b = dataJs.match(/strainDebtPerIntensiveWeek:\s*([0-9.]+)/);
  assert.ok(a && b, '較正定数が見つからない');
  assert.ok(parseFloat(a[1]) > 0, 'intensiveWearPerWeek が 0');
  assert.ok(parseFloat(b[1]) > 0, 'strainDebtPerIntensiveWeek が 0');
});

section('22. strainDebt は decayStartAge 到達時に一括清算される', () => {
  assert.ok(/debtPayoff/.test(management), 'strainDebt の一括清算が消えている');
  assert.ok(/prevAge < decayStartAge/.test(management),
    '「初到達シーズンのみ清算」の判定が消えている（毎年二重に払う恐れ）');
  assert.ok(/strainDebt:\s*0/.test(management), '清算後の strainDebt リセットが無い');
});

console.log('');
if (failed > 0) { console.log(`FAILED: ${failed} 件`); process.exit(1); }
console.log('ALL PASS (22 sections)');
