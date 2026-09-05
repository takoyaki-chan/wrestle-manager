#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════
//  観戦画面(battle-engine.html / tag-battle.html)の i18n 受け入れ確認(手動実行)。
//  run-all は *-test.js しか拾わないので自動テストには入らない。
//
//  P7-5 で作り、P7-9 で「地の文層」まで検査対象を広げた。
//    (1) 技名(技名パネル・ビッグムーブ・矢印ラベル)が英語名になること
//    (2) **地の文**(実況ナレーション・技の解説文・ピンカウント導入/カウント・
//        finishClickラベル・決着表記)も英語になり、EN側に日本語が1文字も残らないこと
//    (3) 効果音の選択と解説文の**選択**は JA判定のまま変わらないこと
//        (= 英語化が判定層へ一切漏れていない機械証明)
//  P7-21 で **観戦カットイン(CUTIN_LINES 441スロット)** を追加した。
//    (4) カットインのセリフが EN で日本語ゼロになること。表は battle-lines.js へ移設済みで、
//        選出は _getCutinLines(JA据え置き)・英語化は表示直前の t() だけという分業を
//        JA/EN の生値一致で機械証明する。自然再生では rivalryTier>0 のときにしか
//        発火しないので、実関数(_tryPhaseIntroCutin / tryRivalryCutin)を直接叩いて
//        実DOM(.cutin-text)まで確認する。
//  スクリーンショットも保存する(single/tag × JA/EN)。
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright');

// P7-9: worktree のパス直書きをやめ、このファイルの位置から辿る
// (worktree を移すたびに書き換えが要る状態だった)。
const ROOT = path.resolve(__dirname, '..', '..');
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
// P7-9: 地の文(ナレーション/解説文/ビッグ導入/ピンカウント/finishClickラベル)も採取する。
const PROBE = `([payload, isTag]) => new Promise((resolve) => {
  const rec = {
    sfx: [], moveNames: [], bigmove: [], guides: [], judged: [], arrowLabels: [],
    narrations: [], bigIntros: [], bigIntroLong: [], pinCounts: [], finishLabels: [], i18nMiss: [],
  };
  ['hitStrike','hitThrow','hitSubmission','hitAerial','hitGround','hitRollup'].forEach((k) => {
    if (typeof sfx === 'undefined' || !sfx[k]) return;
    sfx[k] = function(){ rec.sfx.push(k); };
  });
  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1 || !n.classList) return;
      if (n.classList.contains('attack-arrow')) {
        const lb = n.querySelector('.label');
        if (lb) rec.arrowLabels.push(lb.textContent);
      }
      if (n.classList.contains('big-intro')) { rec.bigIntros.push(n.textContent); rec.bigIntroLong.push(n.classList.contains('long')); }
      if (n.classList.contains('pin-count')) rec.pinCounts.push(n.textContent);
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
    const nb = document.getElementById(isTag ? 'moveNarration' : 'narBox');
    if (nb && nb.textContent && nb.textContent.trim()) rec.narrations.push(nb.textContent.trim());
    const fb = document.getElementById('finishBtn');
    if (fb && fb.textContent) rec.finishLabels.push(fb.textContent);
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
      // P7-12: _spawnBigIntro の .long 判定境界を実関数で直接検査する(合成文字列、
      // MutationObserverは一時停止して実試合の bigIntros/bigIntroLong を汚さない)。
      // JA=閾値16(15字=通常/16字=long)・EN=閾値37(36字=通常/37字=long)。
      try {
        mo.disconnect();
        const n0 = (WM_I18N.lang === 'en') ? 36 : 15; // 閾値-1字(通常のはず)
        const n1 = (WM_I18N.lang === 'en') ? 37 : 16; // 閾値ちょうど(longのはず)
        _spawnBigIntro('x'.repeat(n0));
        _spawnBigIntro('x'.repeat(n1));
        const probeEls = Array.from(document.querySelectorAll('.big-intro')).slice(-2);
        rec.bigIntroBoundary = probeEls.map((el) => el.classList.contains('long'));
        probeEls.forEach((el) => el.remove());
        mo.observe(document.body, { childList: true, subtree: true });
      } catch (e) { rec.bigIntroBoundaryErr = String(e); }
    }
    if (steps > 400 || (S.frames && S.frameIdx >= S.frames.length && steps > 8)) {
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
      // action を持たないフレーム(タッグのタッチ等)は、_narrateFrame が
      // **試合ログ行をそのまま**実況ストリップへ出す。ログ行は result.log として
      // G へ永続する記録でもあるため P7-9 では JA 据え置き(specs §23-6-3 /
      // §2-4 の {type,data} 化が前提)。判定から除くために実測値を採取しておく。
      // ── ピンシーケンスの全分岐カバレッジ(P7-9で追加) ──
      // 実時間の再生では1本の試合で1種類しか踏めない上、決着まで進むのに数十秒かかる。
      // _buildPinCtrl を**直接**叩いて全分岐(TKO/丸め込み成功・返し/ギブアップ タップ・
      // ロープブレイク/極め技脱出/フォール 3カウント・返し)の seq テキストを採取する。
      // isCrit=false 固定でダメージセリフ(乱数)は混ぜない。
      rec.pinSeqTexts = [];
      try {
        const flat = (label, ctrl) => (ctrl && ctrl.seq || []).forEach((s) => {
          [s.text, s.label, s.rollupStatus].forEach((v) => { if (v) rec.pinSeqTexts.push(label + ' :: ' + v); });
        });
        if (!isTag) {
          const A = { atkSide: 'left', kind: 'hit', isCrit: false, move: '卍固め' };
          flat('tko', _buildPinCtrl({ tkoStop: true, action: A }));
          flat('rollup-win', _buildPinCtrl({ rollup: 'success', action: A }));
          flat('rollup-kickout', _buildPinCtrl({ rollup: 'kickout', action: A }));
          flat('gu-tap', _buildPinCtrl({ kickout: { escapeType: 'gu' }, action: A, winner: 'left' }));
          flat('gu-rope', _buildPinCtrl({ kickout: { escapeType: 'gu' }, action: A }));
          flat('sub-escape', _buildPinCtrl({ pinAttempt: 'kickout2_sub', action: A }));
          flat('fall-three', _buildPinCtrl({ kickout: { escapeType: 'fall', count: 2 }, action: A, winner: 'left' }));
          flat('pin-kickout', _buildPinCtrl({ pinAttempt: 'kickout2', kickout: { count: 2 }, action: A }));
        } else {
          const a1 = f('a1'), b1 = f('b1');
          const A = { attackerId: a1.id, defenderId: b1.id, kind: 'hit', isCrit: false, move: '卍固め' };
          const FR = { action: A, turn: 1, events: [] };
          flat('tko', _buildPinCtrl({ attemptType: 'tko', outcome: 'win', count: 0 }, FR));
          flat('gu-tap', _buildPinCtrl({ attemptType: 'gu', outcome: 'win', count: 0 }, FR));
          flat('gu-rope', _buildPinCtrl({ attemptType: 'gu', outcome: 'escape', count: 0 }, FR));
          flat('rollup-win', _buildPinCtrl({ attemptType: 'rollup', outcome: 'win', count: 2, byId: a1.id, onId: b1.id }, FR));
          flat('fall-three', _buildPinCtrl({ attemptType: 'fall', outcome: 'win', count: 2 }, FR));
          flat('fall-kickout', _buildPinCtrl({ attemptType: 'fall', outcome: 'kickout', count: 2 }, FR));
          flat('pin-kickout', _buildPinCtrl({ attemptType: 'pin', outcome: 'kickout', count: 2 }, FR));
        }
      } catch (e) { rec.pinSeqErr = String(e); }

      // 行頭のインデント(match-engine の pushLog は "  ↔ …" のように字下げする)は
      // DOM 側で trim されるので、突合前にこちらも trim しておく。
      rec.logFallbacks = (S.frames || [])
        .filter((f) => f && !f.action)
        .map((f) => (f.logLines || []).join(' ').trim())
        .filter(Boolean);
      // ── P7-21: 観戦カットイン CUTIN_LINES の全数検査 ──
      // 実再生では matchInfo.rivalryTier>0 のときにしか発火せず(しかも確率ゲート付き)、
      // 自然走破では一度も踏めない。表(battle-lines.js へ移設済み)と実関数を直接叩いて
      // 441スロット全部を決定的に採取する。
      //   cutinRawJa = 選出層(_getCutinLines が返す生値。JA据え置きの証明)
      //   cutinShown = 表示直前の WM_I18N.t() を通した結果
      //   cutinDom   = 実表示点(_tryPhaseIntroCutin / tryRivalryCutin → showCutin →
      //                BattleAnim.renderCutin)が書いた .cutin-text の実測
      rec.cutinRawJa = []; rec.cutinShown = []; rec.cutinDom = [];
      try {
        const CT = (typeof CUTIN_LINES !== 'undefined') ? CUTIN_LINES : null;
        rec.cutinTableLoaded = !!CT;   // tag 側でも battle-lines.js が読めていることの確認
        if (CT) {
          Object.keys(CT).forEach((sec) => Object.keys(CT[sec]).forEach((a) => Object.keys(CT[sec][a]).forEach((p) => {
            // 単品は実セレクタ経由(フォールバック4段も含めて実物を通す)。tag は表を直に読む。
            const arr = (typeof _getCutinLines === 'function') ? _getCutinLines(sec, p, a) : CT[sec][a][p];
            (arr || []).forEach((s, i) => {
              const tag2 = sec + '/' + a + '/' + p + '/' + i + ' :: ';
              rec.cutinRawJa.push(tag2 + s);
              rec.cutinShown.push(tag2 + WM_I18N.t(s));
            });
          })));
        }
      } catch (e) { rec.cutinErr = String(e); }
      try {
        if (!isTag && typeof _tryPhaseIntroCutin === 'function') {
          const rnd = Math.random;
          const savedPin = S.pinCtrl;
          Math.random = () => 0;              // 確率ゲートを必ず通す + pk() を先頭固定
          S.pinCtrl = null;                   // dismissCutin のピン分岐へ落ちないように
          S.matchInfo = Object.assign({}, S.matchInfo, {
            rivalryTier: 3,
            leftArchetype: 'ojousama', leftPersonality: 'bold',
            rightArchetype: 'delinquent', rightPersonality: 'quiet',
          });
          const readCutin = (label) => {
            const el = document.querySelector('#cutinOv .cutin-text');
            if (el) rec.cutinDom.push(label + ' :: ' + el.textContent);
            S._pendingPhaseIntro = false;     // nextFrame の再開予約を踏まない(検査用)
            dismissCutin();
          };
          S.mom = 1;   // 左(ojousama×bold)が主語になる
          ['Climax', 'Mid'].forEach((ph) => { if (_tryPhaseIntroCutin(ph)) readCutin('phaseIntro-' + ph); });
          ['atk', 'climax', 'bigmove'].forEach((lt) => { tryRivalryCutin(lt, 'R'); readCutin('rivalry-' + lt); });
          Math.random = rnd;
          S.pinCtrl = savedPin;
        }
      } catch (e) { rec.cutinDomErr = String(e); }
      const vic = document.getElementById(isTag ? 'vicType' : 'rType');
      rec.finishLabel = vic ? vic.textContent : '(none)';
      // 辞書のfail-open実測。WM_I18N._misses は読み込み時点からの全件を持つ Set
      // (console.warn を後から差し替える方式だと、スクリプト読み込み中に出た分を取り逃す)。
      try { rec.i18nMiss = Array.from(WM_I18N._misses || []); } catch (e) { rec.i18nMiss = ['(read failed)']; }
      resolve(rec);
      return;
    }
    // P7-9: 進行ブロッカーを外してピンシーケンス(導入ナレーション/ワン・ツー・スリー/
    // finishClickボックス)まで踏ませる。P7-5当時は nextFrame() を叩くだけだったので
    // カットイン待ち・クリック待ちで数フレームで止まり、ピン系の地の文が一度も出ていなかった。
    try {
      if (S.pendingCutin && typeof dismissCutin === 'function') { dismissCutin(); setTimeout(tick, 30); return; }
    } catch (e) {}
    const fbtn = document.getElementById('finishBtn');
    const fov = document.getElementById('finishOverlay');
    if (fbtn && fov && fov.classList.contains('show') && !fbtn.disabled) {
      fbtn.click();
    } else if (S.pinCtrl) {
      const nbtn = document.getElementById('nBtn');
      if (nbtn && !nbtn.disabled) nbtn.click();
    } else {
      try { nextFrame(); } catch (e) { rec.err = String(e); }
    }
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

// 演出途中の1枚(技名パネルにEN技名・実況ストリップに地の文が出ている瞬間)も撮る
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
      const nb = document.getElementById(isTag ? 'moveNarration' : 'narBox');
      if (n > 8 && el && el.textContent && el.textContent !== '---') {
        res({ move: el.textContent, nar: nb ? nb.textContent.trim() : '(no narration)' });
        return;
      }
      if (n > 60) { res({ move: '(タイムアウト)', nar: '' }); return; }
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
    for (const [lang, file, msg, isTag, shot] of [
      ['en', 'battle-engine.html', singleMsg, false, 'single-en-cutin.png'],
      ['ja', 'battle-engine.html', singleMsg, false, 'single-ja-cutin.png'],
      ['en', 'tag-battle.html', tagMsg, true, 'tag-en-cutin.png'],
      ['ja', 'tag-battle.html', tagMsg, true, 'tag-ja-cutin.png'],
    ]) {
      const r = await runMidShot(browser, server, lang, file, msg, isTag, shot);
      console.log(`\n[mid-shot] ${shot} 技名パネル: ${r.move}`);
      console.log(`[mid-shot] ${shot} 実況       : ${r.nar}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(out, null, 2), 'utf8');

  let ng = 0;
  const uniq = (a) => [...new Set(a)];
  // ひらがな/カタカナ + CJK。ASCII/全角記号(！？…)は英語でも使うので対象外。
  const JA_RE = new RegExp('[\\u3040-\\u30ff\\u3400-\\u9fff]');
  for (const key of Object.keys(out)) {
    const r = out[key];
    console.log(`\n=== ${key} (frames ${r.frameIdx}/${r.frameTotal}) ===`);
    console.log('  技名パネル:', uniq(r.moveNames).slice(0, 12).join(' / '));
    console.log('  ビッグムーブ:', uniq(r.bigmove).slice(0, 6).join(' / ') || '(なし)');
    console.log('  矢印ラベル:', uniq(r.arrowLabels).slice(0, 8).join(' / ') || '(なし)');
    console.log('  実況ナレーション:');
    uniq(r.narrations).slice(0, 8).forEach((s) => console.log('    · ' + s));
    console.log('  技の解説文:');
    uniq(r.guides).slice(0, 6).forEach((s) => console.log('    · ' + s));
    console.log(`  ピンシーケンス全分岐(${(r.pinSeqTexts || []).length}行):`);
    (r.pinSeqTexts || []).forEach((s) => console.log('    · ' + s));
    if (r.pinSeqErr) console.log('    !! pinSeqErr:', r.pinSeqErr);
    console.log('  ピン導入(big-intro):', uniq(r.bigIntros).join(' / ') || '(なし)');
    console.log('  ピン導入の.long有無(P7-12・実試合の発生順):', (r.bigIntroLong || []).map((b) => (b ? 'long' : 'normal')).join(',') || '(なし)');
    console.log('  .long閾値の境界テスト(P7-12・[閾値-1字, 閾値字]):', JSON.stringify(r.bigIntroBoundary || []), r.bigIntroBoundaryErr ? `!! ${r.bigIntroBoundaryErr}` : '');
    console.log('  ピンカウント:', uniq(r.pinCounts).join(' / ') || '(なし)');
    console.log('  finishClickラベル:', uniq(r.finishLabels).join(' / ') || '(なし)');
    console.log(`  カットイン CUTIN_LINES(${(r.cutinShown || []).length}スロット / 表ロード=${r.cutinTableLoaded ? 'yes' : 'NO'}):`);
    (r.cutinShown || []).slice(0, 6).forEach((s) => console.log('    · ' + s));
    if ((r.cutinShown || []).length > 6) console.log(`    · …ほか${r.cutinShown.length - 6}行(全件はresult.json)`);
    if (r.cutinErr) console.log('    !! cutinErr:', r.cutinErr);
    console.log('  カットイン実DOM(.cutin-text):');
    (r.cutinDom || []).forEach((s) => console.log('    · ' + s));
    if (r.cutinDomErr) console.log('    !! cutinDomErr:', r.cutinDomErr);
    console.log('  決着表記:', r.finishLabel);
    console.log('  SFX列:', r.sfx.slice(0, 14).join(',') + (r.sfx.length > 14 ? '…' : ''), `全${r.sfx.length}回`);
    if (r.i18nMiss.length) console.log('  i18n-miss:', uniq(r.i18nMiss).join(' | '));
    (r.judged || []).forEach(([k, v]) => console.log(`  判定[${k}] = ${v}`));
    if (r.judgeErr) { console.log('  !! judgeErr:', r.judgeErr); ng++; }
    if (r.err) console.log('  (frame進行の打ち切り:', r.err, ')');
    if (r.pageErrors.length) { console.log('  !! pageErrors:', r.pageErrors.slice(0, 3)); ng++; }
  }

  const check = (label, cond, detail) => {
    console.log((cond ? '  OK  ' : '  NG  ') + label);
    if (!cond) { ng++; if (detail) console.log('        → ' + detail); }
  };
  console.log('\n═══ 受け入れ判定 ═══');
  for (const kind of ['single', 'tag']) {
    const ja = out[kind + '-ja'], en = out[kind + '-en'];
    const j = (r, k) => (r.judged.find((x) => x[0] === k) || [])[1];
    // EN側で日本語が残っている表示文字列を全部集める(地の文の受け入れ本体)。
    // 試合ログ行(action無しフレームで実況ストリップへ落ちる分)は P7-9 のスコープ外
    // (Gへ永続する記録を兼ねており {type,data} 化が前提)なので、既知の繰り越しとして
    // 件数だけ報告し、判定からは除く。
    const logFb = new Set(en.logFallbacks || []);
    const isLogFallback = (s) => { for (const l of logFb) { if (l && s.indexOf(l) >= 0) return true; } return false; };
    const enProse = []
      .concat(en.narrations, en.guides, en.bigIntros, en.pinCounts, en.finishLabels,
        en.arrowLabels, en.moveNames, en.bigmove, en.pinSeqTexts || [],
        en.cutinShown || [], en.cutinDom || [], [en.finishLabel]);
    const enProseJaAll = uniq(enProse.filter((s) => s && JA_RE.test(s)));
    const enProseJa = enProseJaAll.filter((s) => !isLogFallback(s));
    const deferredLog = enProseJaAll.filter(isLogFallback);
    const enNarrationsJa = uniq(en.narrations.filter((s) => JA_RE.test(s) && !isLogFallback(s)));
    const jaProse = [].concat(ja.narrations, ja.guides, ja.bigIntros, ja.pinCounts, ja.pinSeqTexts || []);
    console.log(`[${kind}]`);
    // ── (3) 判定層の不変(P7-5から継続) ──
    // SFX列は「実時間で何フレーム進めたか」に依存するサンプルなので、JA/ENで到達
    // フレーム数が1つずれることがある(P7-9実測)。到達点までの**共通接頭**が一致
    // していれば効果音の選択は同じ。全フレームの決定的な突合は下の presentSeq が担う。
    const sfxN = Math.min(ja.sfx.length, en.sfx.length);
    check(`SFX呼び出し列が JA と EN で一致(効果音がJA判定のまま鳴る・共通${sfxN}回分)`,
      sfxN > 0 && JSON.stringify(ja.sfx.slice(0, sfxN)) === JSON.stringify(en.sfx.slice(0, sfxN)),
      `ja=${JSON.stringify(ja.sfx)} en=${JSON.stringify(en.sfx)}`);
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
    // ── (1)(2) 表示層の英語化 ──
    check('EN の技名パネルに日本語が無い', en.moveNames.length > 0 && !uniq(en.moveNames).some((s) => JA_RE.test(s)));
    check('EN のビッグムーブに日本語が無い', !uniq(en.bigmove).some((s) => JA_RE.test(s)));
    check('EN の実況ナレーションに日本語が無い(試合ログ行の落ち込みを除く)',
      en.narrations.length > 0 && enNarrationsJa.length === 0, enNarrationsJa.join(' | '));
    check('EN の技の解説文に日本語が無い', en.guides.length > 0 && !uniq(en.guides).some((s) => JA_RE.test(s)));
    check('EN のピン導入/カウント/決着表記に日本語が無い',
      !uniq([].concat(en.bigIntros, en.pinCounts, en.finishLabels, [en.finishLabel])).some((s) => s && JA_RE.test(s)));
    const enPinJa = uniq((en.pinSeqTexts || []).filter((s) => JA_RE.test(s)));
    check(`EN のピンシーケンス全分岐に日本語が無い(${(en.pinSeqTexts || []).length}行・TKO/丸め込み/ギブアップ/極め技脱出/フォール)`,
      (en.pinSeqTexts || []).length > 0 && enPinJa.length === 0, enPinJa.join(' | '));
    check('ピンシーケンス構築で例外ゼロ', !en.pinSeqErr && !ja.pinSeqErr, String(en.pinSeqErr || ja.pinSeqErr || ''));
    check('JA/EN でピンシーケンスの行数が同じ(分岐が同じだけ組まれている)',
      (ja.pinSeqTexts || []).length === (en.pinSeqTexts || []).length && (ja.pinSeqTexts || []).length > 0);
    check(`EN の表示文字列すべてに日本語残り0(${enProse.filter(Boolean).length}件走査)`,
      enProseJa.length === 0, enProseJa.join(' | '));
    if (deferredLog.length) {
      console.log(`  --  (既知の繰り越し: 試合ログ行の実況ストリップ落ち込み ${deferredLog.length}種 — `
        + `result.log としてGへ永続する記録のため specs §23-6-3 の {type,data} 化まで JA 据え置き)`);
      deferredLog.forEach((s) => console.log('        · ' + s));
    }
    // ── P7-21: 観戦カットイン(CUTIN_LINES) ──
    check(`CUTIN_LINES が ${kind} 側でも読めている(battle-lines.js の読み込み順)`,
      en.cutinTableLoaded === true && ja.cutinTableLoaded === true);
    check('カットインの走査で例外ゼロ', !en.cutinErr && !ja.cutinErr && !en.cutinDomErr && !ja.cutinDomErr,
      String(en.cutinErr || ja.cutinErr || en.cutinDomErr || ja.cutinDomErr || ''));
    check(`選出層(CUTIN_LINES の生値)が JA と EN で完全一致(選択はJAのまま・${(en.cutinRawJa || []).length}スロット)`,
      (en.cutinRawJa || []).length > 0 && JSON.stringify(ja.cutinRawJa) === JSON.stringify(en.cutinRawJa));
    check('JA 側のカットインは日本語のまま(JA不変)',
      (ja.cutinShown || []).some((s) => JA_RE.test(s)));
    const enCutinJa = uniq((en.cutinShown || []).filter((s) => JA_RE.test(s)));
    check(`EN のカットイン全スロットに日本語残り0(${(en.cutinShown || []).length}行)`,
      (en.cutinShown || []).length > 0 && enCutinJa.length === 0, enCutinJa.slice(0, 8).join(' | '));
    if (kind === 'single') {   // 実表示点(_tryPhaseIntroCutin / tryRivalryCutin)は単品側だけが持つ
      const enDomJa = uniq((en.cutinDom || []).filter((s) => JA_RE.test(s)));
      check(`EN のカットイン実DOM(.cutin-text)に日本語残り0(${(en.cutinDom || []).length}件・フェーズ導入/ライバリー両経路)`,
        (en.cutinDom || []).length > 0 && enDomJa.length === 0, enDomJa.join(' | '));
      check('JA のカットイン実DOM は日本語のまま(JA不変)',
        (ja.cutinDom || []).length > 0 && (ja.cutinDom || []).some((s) => JA_RE.test(s)));
      check('EN のカットイン実DOM に「」装飾が付いていない(_quoteLine の言語分岐)',
        !(en.cutinDom || []).some((s) => s.indexOf('「') >= 0)
        && (ja.cutinDom || []).every((s) => s.indexOf('「') >= 0));
    }
    check('EN で [i18n-miss] が出ていない(辞書のfail-open 0)',
      en.i18nMiss.length === 0, uniq(en.i18nMiss).join(' | '));
    // ── JA側の不変 ──
    check('JA の技名パネルは日本語のまま(JA不変)', uniq(ja.moveNames).some((s) => JA_RE.test(s)));
    check('JA の地の文は日本語のまま(JA不変)', jaProse.filter(Boolean).some((s) => JA_RE.test(s)));
    // 表示回数そのものは実時間サンプリングなので JA/EN で数フレームぶれる。
    // 「両方でちゃんと出ている」ことだけ見る(決定的な突合は presentSeq が担う)。
    check('JA/EN とも技名パネル・実況ストリップが表示されている',
      ja.moveNames.length > 0 && en.moveNames.length > 0
      && ja.narrations.length > 0 && en.narrations.length > 0);
    check('例外ゼロ', ja.pageErrors.length === 0 && en.pageErrors.length === 0);
    // ── P7-12: _spawnBigIntro の .long 判定閾値(言語別化) ──
    // JAは元の閾値16を1文字も変えない(15字=通常/16字=long)。ENは実測で導出した37字
    // (36字=通常/37字=long)。境界テストは合成文字列で決定的に検査するため、
    // 実試合のランダムな技/セリフ選択の運に左右されない。
    check('JA: .long閾値16の境界が正しい(15字=通常/16字=long。JA不変)',
      JSON.stringify(ja.bigIntroBoundary) === JSON.stringify([false, true]),
      `bigIntroBoundary=${JSON.stringify(ja.bigIntroBoundary)} err=${ja.bigIntroBoundaryErr || ''}`);
    check('EN: .long閾値37の境界が正しい(36字=通常/37字=long。短文が.longにならないことの確認)',
      JSON.stringify(en.bigIntroBoundary) === JSON.stringify([false, true]),
      `bigIntroBoundary=${JSON.stringify(en.bigIntroBoundary)} err=${en.bigIntroBoundaryErr || ''}`);
  }
  console.log(`\n出力: ${OUT}`);
  console.log(ng === 0 ? '\nALL CHECKS PASS' : `\n${ng}件のNG`);
  process.exit(ng === 0 ? 0 : 1);
})();
