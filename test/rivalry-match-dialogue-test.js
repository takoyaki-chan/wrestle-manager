'use strict';

// 因縁マッチの試合後コメントが、通常興行では結果一覧内、PPVでは予約モーダルへ
// 確実に届くことを固定する安全網。
// 2026-07-21 の興行結果画面リデザイン(e03804b)でこの予約が丸ごと落ち、
// UPSET_RIVALRY_LINES(71本)を含む因縁の勝敗セリフが一度も出ない状態が5日間続いた。
// 「セリフのテーブルはあるのに誰も読まない」を機械的に落とすのがこのテストの役目。

const assert = require('assert');
const { readSource } = require('./helpers/source');

const ui = readSource('src', 'ui-common.js');
const app = readSource('src', 'app.js');
const data = readSource('src', 'data.js');

function extractFunction(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(brace + 1, i);
    }
  }
  throw new Error(`${signature} body end not found`);
}

// ── 1) キューが実際に積まれること（push が存在すること） ──
assert.ok(ui.includes('_pendingMatchDialogues.push('),
  '_pendingMatchDialogues に push する箇所が無い = 試合後コメントは永久に出ない');

// ── 2) 通常興行は結果一覧へ戻し、PPV は独立モーダルへ予約すること ──
const showResult = extractFunction(ui, 'function renderShowResult(');
assert.ok(showResult.includes('_buildRivalryMatchDialogue('),
  '通常興行の結果一覧が因縁コメントを組み立てていない');
assert.ok(showResult.includes('SHOW_RESULT_DIALOGUE_MIN_RIVALRY'),
  '通常興行の結果一覧が旧来の発現ラインを参照していない');
assert.ok(showResult.includes("_pbFighterBlock('left', r.left, leftCls, metaLeft, leftLine)"),
  '通常興行の左選手画像上へセリフを渡していない');
assert.ok(showResult.includes("_pbFighterBlock('right', r.right, rightCls, metaRight, rightLine)"),
  '通常興行の右選手画像上へセリフを渡していない');
assert.ok(!showResult.includes('_queueRivalryMatchDialogue('),
  '通常興行は結果一覧と独立モーダルへ同じセリフを二重表示しない');
const ppvResult = extractFunction(ui, 'function renderPPVResult(');
assert.ok(ppvResult.includes('_queueRivalryMatchDialogue('),
  'PPV の結果画面が因縁コメントを予約していない');
assert.ok(ppvResult.includes('_pendingMatchDialogues = []'),
  'PPV の結果画面はキューをリセットしてから積む必要がある');

// ── 3) 予約したものを閉じるときに消化すること（両経路） ──
for (const [label, source, signature] of [
  ['通常興行', app, 'App._closeShowResultImpl'],
  ['PPV', app, 'App.closePPVResult = function'],
]) {
  const idx = source.indexOf(signature);
  if (idx < 0) continue; // 関数名が変わっていたら 4) の全体チェックで拾う
  const body = extractFunction(source, signature);
  assert.ok(body.includes('showPostMatchDialogues('),
    `${label}の閉じる処理が showPostMatchDialogues を呼んでいない`);
}
assert.strictEqual((app.match(/showPostMatchDialogues\(/g) || []).length, 2,
  '試合後コメントの消化は通常興行とPPVの2経路であるべき');

// ── 4) 共通組み立て処理で番狂わせ分岐が生きていること ──
const buildFn = extractFunction(ui, 'function _buildRivalryMatchDialogue(');
assert.ok(buildFn.includes('UPSET_RIVALRY_LINES'),
  '番狂わせ専用セリフ(UPSET_RIVALRY_LINES)が参照されていない');
assert.ok(/ovrW\s*<\s*ovrLose\s*-\s*8/.test(buildFn),
  '番狂わせ判定(OVR差9以上の格下勝ち)が削除前と同じ式で残っていること');
const queueFn = extractFunction(ui, 'function _queueRivalryMatchDialogue(');
assert.ok(queueFn.includes('RIVALRY_POPUP_CONFIG.normalMinRivalry'),
  '因縁コメントの発動ラインを data.js の設定から読んでいない');
assert.ok(/normalMinRivalry:\s*60/.test(data),
  '通常の因縁コメントの発動ライン rivalry 60 が data.js に設定されていない');
assert.ok(/SHOW_RESULT_DIALOGUE_MIN_RIVALRY\s*=\s*30/.test(ui),
  '定期興行の結果一覧は旧来どおり rivalry 30 から吹き出しを出すこと');

// ── 5) 描画は U3グループB の共通コンポーネントを使うこと ──
const renderFn = extractFunction(ui, 'function _renderNextMatchDialogue(');
assert.ok(renderFn.includes('_rivalryCol('),
  '試合後コメントは U3 の共通コンポーネント(_rivalryCol/_u3bSideHtml)で描くこと');
assert.ok(!renderFn.includes('notif-modal-portraits'),
  '旧レイアウト(セリフを下段テキストで出す形)へ戻っていないこと');
assert.ok(!/「\$\{d\.win/.test(renderFn) && !/\$\{d\.winnerName\}「/.test(renderFn),
  'セリフは吹き出しに入れる。名前つき鉤括弧の地の文へ戻さないこと');

// ── 6) 参照しているトーンクラスが verdict モーダル用に実在すること ──
// tone-gold のような「存在しないのに milestone-gold への部分一致で通ってしまう」指定を防ぐため、
// 複合セレクタ全体(.notif-modal-box.verdict.tone-*)で照合する。
const indexHtml = readSource('src', 'index.html');
for (const m of renderFn.matchAll(/'(tone-[a-z]+)'/g)) {
  assert.ok(indexHtml.includes(`.notif-modal-box.verdict.${m[1]}`),
    `${m[1]} は verdict モーダル用のトーンとして index.html に定義が無い`);
}

console.log('rivalry-match-dialogue-test: ok');
