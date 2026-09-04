#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  P7-5 受け入れ確認(使い捨て): 観戦画面(battle-engine.html / tag-battle.html)を
//  EN/JA 両方で実起動し、
//    (1) カットイン(技名パネル・ビッグムーブ・矢印ラベル)が英語名になること
//    (2) 効果音の選択と解説文の選択が **JA判定のまま** 変わらないこと
//  を機械確認する。スクリーンショットも保存する。
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright');

const ROOT = 'C:/Users/nkmrk/Downloads/wrestle-manager/.claude/worktrees/agent-ac3d08ad41701c824';
const { startStaticServer } = require(path.join(ROOT, 'test/ui-walkthrough/server.js'));
const OUT = path.join(ROOT, 'test/ui-walkthrough/artifacts/p7-5-spectator');

// ── Step 1: node側で実試合を1本回して frames を作る ────────────────────────
global.window = { IS_TRIAL: false };
global.WM_I18N = {
  t(text, params) {
    if (typeof text !== 'string' || !params) return text;
    let out = text;
    Object.keys(params).forEach((k) => { out = out.split('{' + k + '}').join(params[k]); });
    return out;
  },
  pn: (s) => s, pnSurname: (s) => s, mv: (s) => s, mvShort: (s) => s,
};
let rs = 42 >>> 0;
Math.random = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 0x100000000; };

function loadAsGlobal(file) {
  let code = fs.readFileSync(path.join(ROOT, 'src', file), 'utf-8');
  code = code.replace(/\/\/ Node\.js モジュールエクスポート[\s\S]*$/, '');
  code = code.replace(/^(const|let) /gm, 'var ');
  new vm.Script(code, { filename: file }).runInThisContext();
}
// ブラウザと同じ読み込み順序(test/ja-golden.js と同一。Engine本体は management.js が作る)
['victory-lines.js', 'data.js', 'coach-lines.js', 'data-faction-dialogue.js',
  'management.js', 'match-engine.js', 'relationships.js'].forEach(loadAsGlobal);

function movesOf(res) {
  const names = new Set();
  (res.frames || []).forEach((f) => { if (f.action && f.action.move) names.add(f.action.move); });
  return [...names];
}

function makeSinglePayload() {
  const chars = global.ALL_CHARS;
  const L = { ...chars[0] }, R = { ...chars[1] };
  for (let i = 0; i < 600; i++) {
    const rng = Engine.rng.create(Engine.rng.derive(20260904, 'p75', i));
    const res = Engine.battle.simulateMatch(L, R, rng, 2, { recordFrames: true });
    const mv = movesOf(res);
    if (res.finMove && mv.length >= 6) return { result: res, moves: mv, finMove: res.finMove, L, R };
  }
  throw new Error('single payload生成に失敗');
}

function makeTagPayload() {
  const chars = global.ALL_CHARS;
  const t = [0, 1, 2, 3].map((i) => ({ ...chars[i] }));
  for (let i = 0; i < 600; i++) {
    const rng = Engine.rng.create(Engine.rng.derive(20260904, 'p75tag', i));
    const res = Engine.tagMatch.simulateTagMatch(
      { fighter1: t[0], fighter2: t[1] }, { fighter1: t[2], fighter2: t[3] }, rng, { recordFrames: true },
    );
    const mv = movesOf(res);
    if (res.finMove && mv.length >= 6) return { result: res, moves: mv, finMove: res.finMove, team: t };
  }
  throw new Error('tag payload生成に失敗');
}

// ── Step 2: ブラウザ内の計測スクリプト ─────────────────────────────────────
const PROBE = `([payload, isTag]) => new Promise((resolve) => {
  const rec = { sfx: [], moveNames: [], bigmove: [], guides: [], judged: [], arrowLabels: [] };
  ['hitStrike','hitThrow','hitSubmission','hitAerial','hitGround','hitRollup'].forEach((k) => {
    if (typeof sfx === 'undefined' || !sfx[k]) return;
    sfx[k] = function(){ rec.sfx.push(k); };
  });
  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType === 1 && n.classList && n.classList.contains('attack-arrow')) {
        const lb = n.querySelector('.label');
        if (lb) rec.arrowLabels.push(lb.textContent);
      }
    }));
  });
  mo.observe(document.body, { childList: true, subtree: true });

  window.postMessage(payload, '*');
  let steps = 0;
  const tick = () => {
    steps++;
    const el = document.getElementById(isTag ? 'moveName' : 'moveV');
    if (el && el.textContent && el.textContent !== '---') rec.moveNames.push(el.textContent);
    const bg = document.getElementById(isTag ? 'bigmoveSplash' : 'bigmoveName');
    if (bg && bg.textContent) rec.bigmove.push(bg.textContent);
    const gd = document.getElementById('moveGuide');
    if (gd && gd.textContent) rec.guides.push(gd.textContent);
    if (steps === 3) {
      try {
        rec.judged.push(['_actionMoveName', _actionMoveName({ move: 'ブレーンバスター' })]);
        rec.judged.push(['guide', _movePresentation({ move: 'ブレーンバスター', moveCat: 'throw' }, null).guide]);
        rec.judged.push(['guessCategory', guessCategory('ブレーンバスター')]);
        rec.judged.push(['guessCategory-sub', guessCategory('卍固め')]);
        rec.judged.push(['mv', WM_I18N.mv ? WM_I18N.mv('ブレーンバスター') : 'NO-MV']);
        rec.judged.push(['mvShort', WM_I18N.mvShort ? WM_I18N.mvShort('上下同時極め') : 'NO-MVSHORT']);
        rec.judged.push(['lang', WM_I18N.lang]);
      } catch (e) { rec.judgeErr = String(e); }
    }
    if (steps > 200 || (S.frames && S.frameIdx >= S.frames.length && steps > 8)) {
      mo.disconnect();
      // 全フレームを走査して「JA名から選ばれる効果音カテゴリ・解説文・内部名」を
      // 決定的に採取する(DOMポーリングと違いアニメのタイミングに揺れない)。
      // これがJA/ENで完全一致すれば、英語化が判定層へ一切漏れていないと言い切れる。
      rec.presentSeq = (S.frames || []).map((f) => {
        const a = f && f.action;
        if (!a) return null;
        return [
          _actionMoveName(a),
          _movePresentation(a, f).guide,
          guessCategory(a.move || ''),
          a.moveCat || '',
        ].join('|');
      });
      rec.frameIdx = S.frameIdx; rec.frameTotal = (S.frames || []).length;
      const vic = document.getElementById(isTag ? 'vicType' : 'rType');
      rec.finishLabel = vic ? vic.textContent : '(none)';
      resolve(rec);
      return;
    }
    try { nextFrame(); } catch (e) { rec.err = String(e); }
    setTimeout(tick, 30);
  };
  setTimeout(tick, 500);
})`;

async function runOne(browser, server, lang, file, payload, isTag, shot) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript((l) => {
    localStorage.setItem('wm_audio', JSON.stringify({ muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0 }));
    localStorage.setItem('wm_lang', l);
  }, lang);
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console:' + m.text()); });
  await page.goto(`${server.baseUrl}/${file}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const rec = await page.evaluate(
    ({ src, p, t }) => (0, eval)(src)([p, t]),
    { src: PROBE, p: payload, t: isTag },
  );
  rec.pageErrors = errs;
  if (shot) {
    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, shot) });
  }
  await context.close();
  return rec;
}

// 演出途中の1枚(技名パネルにEN技名が出ている瞬間)も撮る
async function runMidShot(browser, server, lang, file, payload, isTag, shot) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.addInitScript((l) => {
    localStorage.setItem('wm_audio', JSON.stringify({ muted: true, bgmMuted: true, bgmMasterVol: 0, sfxMasterVol: 0 }));
    localStorage.setItem('wm_lang', l);
  }, lang);
  await page.goto(`${server.baseUrl}/${file}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const MID = `([payload, isTag]) => new Promise((res) => {
    window.postMessage(payload, '*');
    let n = 0;
    const step = () => {
      n++;
      const el = document.getElementById(isTag ? 'moveName' : 'moveV');
      if (n > 8 && el && el.textContent && el.textContent !== '---') { res(el.textContent); return; }
      if (n > 60) { res('(タイムアウト)'); return; }
      try { nextFrame(); } catch (e) {}
      setTimeout(step, 60);
    };
    setTimeout(step, 500);
  })`;
  const shown = await page.evaluate(
    ({ src, p, t }) => (0, eval)(src)([p, t]),
    { src: MID, p: payload, t: isTag },
  );
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, shot) });
  await context.close();
  return shown;
}

(async () => {
  const single = makeSinglePayload();
  const tag = makeTagPayload();
  console.log(`[payload] single: 技${single.moves.length}種 決め技=${single.finMove}`);
  console.log(`[payload] tag   : 技${tag.moves.length}種 決め技=${tag.finMove}`);

  const prof = (f) => ({ ...f, portraitUrl: '', profile: '', vl: ['…！'] });
  const singleMsg = {
    type: 'START_MATCH',
    left: prof(single.L), right: prof(single.R), result: single.result,
    matchInfo: { header: 'P7-5 CHECK', subHeader: '', matchNum: 1, totalMatches: 1, matchTier: 2, sfxMasterVol: 0, bgmMasterVol: 0 },
  };
  const tagMsg = {
    type: 'START_TAG_MATCH',
    teamA: { fighter1: prof(tag.team[0]), fighter2: prof(tag.team[1]) },
    teamB: { fighter1: prof(tag.team[2]), fighter2: prof(tag.team[3]) },
    result: tag.result,
    matchInfo: { header: 'P7-5 CHECK', matchNum: 1, totalMatches: 1, sfxMasterVol: 0, bgmMasterVol: 0, chemA: tag.result.chemA, chemB: tag.result.chemB },
  };

  const server = await startStaticServer({ projectRoot: ROOT });
  const browser = await chromium.launch({ headless: true });
  const out = {};
  try {
    for (const lang of ['ja', 'en']) {
      out['single-' + lang] = await runOne(browser, server, lang, 'battle-engine.html', singleMsg, false, `single-${lang}-end.png`);
      out['tag-' + lang] = await runOne(browser, server, lang, 'tag-battle.html', tagMsg, true, `tag-${lang}-end.png`);
    }
    console.log('\n[mid-shot] single-en 技名パネル:', await runMidShot(browser, server, 'en', 'battle-engine.html', singleMsg, false, 'single-en-cutin.png'));
    console.log('[mid-shot] single-ja 技名パネル:', await runMidShot(browser, server, 'ja', 'battle-engine.html', singleMsg, false, 'single-ja-cutin.png'));
    console.log('[mid-shot] tag-en 技名パネル:', await runMidShot(browser, server, 'en', 'tag-battle.html', tagMsg, true, 'tag-en-cutin.png'));
    console.log('[mid-shot] tag-ja 技名パネル:', await runMidShot(browser, server, 'ja', 'tag-battle.html', tagMsg, true, 'tag-ja-cutin.png'));
  } finally {
    await browser.close();
    await server.close();
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(out, null, 2), 'utf8');

  let ng = 0;
  const uniq = (a) => [...new Set(a)];
  const JA_RE = /[\u3040-\u30ff\u3400-\u9fff]/;
  for (const key of Object.keys(out)) {
    const r = out[key];
    console.log(`\n=== ${key} (frames ${r.frameIdx}/${r.frameTotal}) ===`);
    console.log('  技名パネル:', uniq(r.moveNames).slice(0, 12).join(' / '));
    console.log('  ビッグムーブ:', uniq(r.bigmove).slice(0, 6).join(' / ') || '(なし)');
    console.log('  矢印ラベル:', uniq(r.arrowLabels).slice(0, 8).join(' / ') || '(なし)');
    console.log('  決着表記:', r.finishLabel);
    console.log('  SFX列:', r.sfx.slice(0, 14).join(',') + (r.sfx.length > 14 ? '…' : ''), `全${r.sfx.length}回`);
    (r.judged || []).forEach(([k, v]) => console.log(`  判定[${k}] = ${v}`));
    if (r.judgeErr) { console.log('  !! judgeErr:', r.judgeErr); ng++; }
    if (r.err) console.log('  (frame進行の打ち切り:', r.err, ')');
    if (r.pageErrors.length) { console.log('  !! pageErrors:', r.pageErrors.slice(0, 3)); ng++; }
  }

  const check = (label, cond) => { console.log((cond ? '  OK  ' : '  NG  ') + label); if (!cond) ng++; };
  console.log('\n═══ 受け入れ判定 ═══');
  for (const kind of ['single', 'tag']) {
    const ja = out[kind + '-ja'], en = out[kind + '-en'];
    const j = (r, k) => (r.judged.find((x) => x[0] === k) || [])[1];
    console.log(`[${kind}]`);
    check('SFX呼び出し列が JA と EN で完全一致(効果音がJA判定のまま鳴る)',
      JSON.stringify(ja.sfx) === JSON.stringify(en.sfx) && ja.sfx.length > 0);
    check('全フレームの[内部技名|解説文|効果音カテゴリ|moveCat]列が JA と EN で完全一致'
      + `(判定層に英語が一切漏れていない・${(en.presentSeq || []).length}フレーム)`,
      JSON.stringify(ja.presentSeq) === JSON.stringify(en.presentSeq) && (ja.presentSeq || []).length > 0);
    check('その解説文の選択列に英語が混ざっていない(JA判定のまま)',
      (en.presentSeq || []).filter(Boolean).every((s) => JA_RE.test(s)));
    check('_actionMoveName はJA名を返す(英訳が上流へ漏れていない)', j(en, '_actionMoveName') === 'ブレーンバスター');
    check('guessCategory(ブレーンバスター)=throw', j(en, 'guessCategory') === 'throw');
    check('guessCategory(卍固め)=submission', j(en, 'guessCategory-sub') === 'submission');
    check('WM_I18N.mv → Vertical Suplex', j(en, 'mv') === 'Vertical Suplex');
    check('WM_I18N.mvShort → Double-Ended Hold(短縮形)', j(en, 'mvShort') === 'Double-Ended Hold');
    check('EN の技名パネルに日本語が無い', en.moveNames.length > 0 && !uniq(en.moveNames).some((s) => JA_RE.test(s)));
    check('EN のビッグムーブに日本語が無い', !uniq(en.bigmove).some((s) => JA_RE.test(s)));
    check('JA の技名パネルは日本語のまま(JA不変)', uniq(ja.moveNames).some((s) => JA_RE.test(s)));
    check('JA/EN で技名パネルの表示回数が同じ', ja.moveNames.length === en.moveNames.length);
    check('例外ゼロ', ja.pageErrors.length === 0 && en.pageErrors.length === 0);
  }
  console.log(`\n出力: ${OUT}`);
  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng}件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
