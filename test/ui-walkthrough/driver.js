'use strict';

const { stableHash, writeFailureArtifacts } = require('./detectors');

const CLICKABLE_SELECTOR = 'button, [role="button"], [onclick], [data-choice], [data-mdl-choice], [data-war-choice], .large-evt-fighter-pick, .travel-overlay.active';
const DESTRUCTIVE_TEXT = /(?:削除|消去|ニューゲーム|NEW GAME|ロード|LOAD GAME|セーブ|SAVE|タイトルへ戻る|記録を消す)/i;
// ナビ実物は「📅 今週」のように絵文字+空白つき(src/index.html の .nav-bar)。
// 2026-08-31監査: 旧版は絵文字なし完全一致でナビ実物に一つもマッチしない死にガードだった
// (全ナビラベルがスコア表フォールスルーの -Infinity で偶然押されていなかっただけ)。
// 意図を確定する: **ナビタブはランダム走のスコアラーからは押さない**。自由閲覧画面の
// 検査は runNavTour の決定論巡回が担当する。識別は .nav-btn クラスを一次、文言を保険にする。
// 絵文字プレフィックスは記号面(U+2600台/U+1F000台+VS16)に限定 —「全団体」のような
// 日本語プレフィックス付き実コンテンツボタンを誤って封じないため
const NAVIGATION_TEXT = /^(?:[\u{2600}-\u{27BF}\u{1F000}-\u{1FAFF}\u{FE0F}]+\s*)?(?:今週|興行準備|団体|社長室|ランキング|データベース|新聞|経営|ログ|セーブ|ヘルプ)$/u;

function isNavigationControl(candidate) {
  if (/(?:^|\s)nav-btn(?:\s|$)/.test(candidate.className || '')) return true;
  return NAVIGATION_TEXT.test(candidate.searchText || candidate.text || '');
}

// ナビ巡回の停車駅(②2026-08-31監査対応)。自然走破が構造的に到達できない自由閲覧画面を
// 進行を妨げないクリーン状態で一巡し、開くだけ(中の操作はしない)でD1/D3走査を通す。
// 「今週」「興行準備」は通常進行が毎週踏むため巡回対象外。
const NAV_TOUR_STOPS = [
  { label: '団体', screen: 'screen-roster' },
  { label: '社長室', screen: 'screen-shachoshitsu' },
  { label: 'ランキング', screen: 'screen-ranking' },
  { label: 'データベース', screen: 'screen-database' },
  { label: '新聞', screen: 'screen-newspaper' },
  { label: '経営', screen: 'screen-finance' },
  { label: 'ログ', screen: 'screen-log' },
  { label: 'セーブ', screen: 'screen-save' },
  { label: 'ヘルプ', screen: 'screen-help' },
];

function createSeededPrng(seed) {
  let state = Number(seed) >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function actionScore(candidate, state) {
  const text = candidate.searchText || candidate.text;
  if (!text || DESTRUCTIVE_TEXT.test(text) || isNavigationControl(candidate)) return -Infinity;

  if (/CONTINUE/i.test(text)) return 10000;
  if (candidate.id === 'travelSceneOverlay') return 9975;
  // 全画面タップ面(天頂戦優勝発表 .tcwn-wrap 等)。文章量が多くても「タップして進む」導線
  if (candidate.fullSurface && candidate.inOverlay) return 9960;
  if (/(?:confirmPPVEntry|tcConfirmEntries)/.test(candidate.onclick)) return 9500;
  if (/(?:togglePPVPick|tcTogglePick)/.test(candidate.onclick)) return 9450;
  if (candidate.inOverlay && (/閉じる/.test(candidate.ariaLabel) || /^✕$/.test(candidate.text))) return 9950;
  if (/残り全試合をスキップ|全試合スキップ|まとめてスキップ|スキップで確定/.test(text)) return 9800;
  if (/^▷?\s*SKIP$|^>>\s*skip$/i.test(text)) return 9700;
  if (/興行開催/.test(text)) return state?.showCardValid > 0 ? 9600 : -Infinity;
  if (/この布陣で|このメンバーで|出場決定|エントリー確定|参戦する|開戦/.test(text)) return 9500;
  if (/おまかせ選出|おまかせ編成|🔥\s*おすすめ|^おまかせ$/.test(text)) return 9400;
  if (/昇給を受ける|現状維持|契約を続ける|引き留める|残留/.test(text)) return 9300;
  if (/指名を行いません|今年は指名しない|辞退する|見送る|見送り/.test(text)) return 9250;
  if (/興行準備へ|興行準備に戻る/.test(text)) return 9200;
  if (/週を処理|次の週へ|シーズンレポートへ|ドラフト会議へ|移籍ウィンドウへ|新シーズン開幕/.test(text)) return 9100;
  if (/オフシーズンへ|結果へ|結果を確認|決着へ|表彰式へ|大会へ進む|JTへ進む|ドラフトへ/.test(text)) return 9000;
  if (/^(?:次へ|続ける|進む|閉じる|完了|終了|確定|OK)(?:\s*[→▶›])?$/.test(text)) return 8900;
  // 相槌型の確認ボタン(契約更改の突発退団「……わかった」等)
  if (/わかった|承知した|了解した/.test(text)) return 8850;
  if (/次へ|続ける|閉じる|完了|終了|結果を見る|結果発表|進行/.test(text)) return 8800;
  if (/承認|受けて立つ|参加する|開始|開催|決定/.test(text)) return 8600;
  if (/スキップ/.test(text)) return 8500;
  if (/^(?:A|accept|yes)$/i.test(candidate.dataChoice)) return 8400;
  if (candidate.dataChoice) return 8300;
  if (candidate.dataFighterId) return 8250;
  if (/^[AB][\s:：]|選択肢\s*[AB]/.test(text)) return 8200;
  if (candidate.primary || (candidate.inOverlay && candidate.tagName === 'BUTTON')) return 5000;
  return -Infinity;
}

async function listCandidates(page) {
  const locators = page.locator(CLICKABLE_SELECTOR);
  const entries = await locators.evaluateAll(elements => elements.map((element, index) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const enabled = !element.matches(':disabled') && element.getAttribute('aria-disabled') !== 'true';
      const centerX = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
      const centerY = Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
      const hit = document.elementFromPoint(centerX, centerY);
      const outsideViewport = rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth;
      const receivesEvents = outsideViewport || (!!hit && (element === hit || element.contains(hit) || hit.contains(element)));
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
        && style.pointerEvents !== 'none' && rect.width > 0 && rect.height > 0 && receivesEvents;
      if (!enabled || !visible) return null;
      const text = (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      const overlay = element.closest('[id*="Overlay"], .overlay, [class*="overlay"], .emr-layer');
      const overlayStyle = overlay ? getComputedStyle(overlay) : null;
      const overlayRect = overlay ? overlay.getBoundingClientRect() : null;
      const overlayVisible = !!overlay && overlayStyle.display !== 'none' && overlayStyle.visibility !== 'hidden'
        && Number(overlayStyle.opacity) !== 0 && overlayRect.width > 0 && overlayRect.height > 0;
      const overlayElements = overlayVisible
        ? Array.from(document.querySelectorAll('[id*="Overlay"], .overlay, [class*="overlay"], .emr-layer'))
        : [];
      let overlayZ = 0;
      if (overlayVisible) {
        for (let node = overlay; node instanceof Element; node = node.parentElement) {
          const z = Number.parseInt(getComputedStyle(node).zIndex, 10);
          if (Number.isFinite(z)) overlayZ = Math.max(overlayZ, z);
        }
      }
      const overlayOrder = overlayVisible ? overlayElements.indexOf(overlay) + 1 : 0;
      return {
        ariaLabel: element.getAttribute('aria-label') || '',
        className: typeof element.className === 'string' ? element.className : '',
        dataChoice: element.getAttribute('data-choice') || element.getAttribute('data-mdl-choice')
          || element.getAttribute('data-war-choice') || '',
        dataFighterId: element.getAttribute('data-fighter-id') || '',
        fullSurface: !!element.getAttribute('onclick')
          && rect.width * rect.height >= innerWidth * innerHeight * 0.7,
        id: element.id || '',
        index,
        inOverlay: overlayVisible && (overlay !== element || element.id === 'travelSceneOverlay'),
        onclick: element.getAttribute('onclick') || '',
        overlayRank: overlayVisible ? overlayZ * 100000 + overlayOrder : 0,
        primary: element.classList.contains('btn-gold') || element.classList.contains('primary')
          || element.classList.contains('mdl-a-continue-btn') || element.classList.contains('pb-close-btn'),
        tagName: element.tagName,
        text,
      };
    }).filter(Boolean));
  const candidates = [];
  for (const metadata of entries) {
    const text = normalizeText(metadata.text || metadata.ariaLabel);
    if (metadata.id !== 'travelSceneOverlay' && metadata.tagName !== 'BUTTON' && !metadata.fullSurface
      && (text.length > 100 || /Overlay$/i.test(metadata.id))) continue;
    candidates.push({
      ...metadata,
      locator: locators.nth(metadata.index),
      searchText: normalizeText(`${text} ${metadata.ariaLabel}`),
      text,
    });
  }
  return candidates;
}

function chooseCandidate(candidates, snapshot, random, boost) {
  const scored = candidates
    .map(candidate => {
      // シナリオ固有の優先度注入(igniteモード)。null/undefined なら通常スコア
      const boosted = boost ? boost(candidate, candidates) : null;
      return { candidate, score: boosted != null ? boosted : actionScore(candidate, snapshot.state) };
    })
    .filter(entry => Number.isFinite(entry.score));
  if (scored.length === 0) return null;
  const overlayCandidates = scored.filter(entry => entry.candidate.inOverlay);
  const topOverlayRank = overlayCandidates.length > 0
    ? Math.max(...overlayCandidates.map(entry => entry.candidate.overlayRank))
    : 0;
  const pool = overlayCandidates.length > 0
    ? overlayCandidates.filter(entry => entry.candidate.overlayRank === topOverlayRank)
    : scored;
  const max = Math.max(...pool.map(entry => entry.score));
  const best = pool.filter(entry => entry.score === max);
  return best[Math.floor(random() * best.length)].candidate;
}

function actionLabel(candidate) {
  if (candidate.id) return `#${candidate.id}`;
  if (candidate.dataChoice) return `[data-choice=${candidate.dataChoice}]`;
  if (candidate.dataFighterId) return `[data-fighter-id=${candidate.dataFighterId}]`;
  const handler = String(candidate.onclick || '').match(/(?:App\.)?[A-Za-z_$][\w$]*(?=\s*\()/)?.[0];
  if (handler) return `${candidate.tagName.toLowerCase()}:${handler}`;
  const classes = String(candidate.className || '').split(/\s+/).filter(Boolean).slice(0, 2).join('.');
  const identity = classes ? `${candidate.tagName.toLowerCase()}.${classes}` : candidate.tagName.toLowerCase();
  return candidate.tagName === 'BUTTON' ? `${identity}:${candidate.text}` : identity;
}

async function retryCandidate(page, descriptor) {
  const current = await listCandidates(page);
  const candidate = current.find(item => descriptor.id && item.id === descriptor.id)
    || current.find(item => item.text === descriptor.text && item.ariaLabel === descriptor.ariaLabel);
  if (!candidate) return;
  await clickCandidate(candidate, page);
}

function progressKey(snapshot) {
  const state = snapshot?.state;
  if (!state) return null;
  return `${state.season}|${state.week}|${state.offSeason}|${state.offWeek}`;
}

async function settleClock(page, milliseconds = 2200) {
  if (page.clock) await page.clock.runFor(milliseconds).catch(() => {});
  await page.waitForTimeout(30);
}

async function waitForTimedUi(page, milliseconds) {
  if (!page.clock) {
    await page.waitForTimeout(milliseconds);
    return;
  }
  // Playwright's fake clock advances JavaScript timers but Chromium's CSS
  // animations keep wall-clock time. Resume briefly so timed intro layers can
  // reveal their real controls, then freeze the clock again for repeatability.
  await page.clock.resume();
  await new Promise(resolve => setTimeout(resolve, milliseconds));
  // resume中は内部時計が実時間で進み続けるため、時刻の読み取りとpauseAtの間に
  // 内部時計が読んだ値を追い越すと "Cannot fast-forward to the past" になる。
  // 少し先の時刻で止めて競合を吸収する(失敗したら読み直してさらに先で止める)
  const currentTime = await page.evaluate(() => Date.now());
  try {
    await page.clock.pauseAt(currentTime + 1500);
  } catch (_error) {
    const retryTime = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(retryTime + 5000);
  }
}

async function clickCandidate(candidate, page) {
  await candidate.locator.scrollIntoViewIfNeeded().catch(() => {});
  // カード編成ピッカーは名前/行が選択、顔だけが詳細。中央クリックは名前側へ入る。
  await candidate.locator.click({ timeout: 1500 });
  await settleClock(page);
}

async function clickWithOverlayRecovery(page, selected, snapshot, random, boost) {
  try {
    await clickCandidate(selected, page);
    return { candidate: selected, recovered: false };
  } catch (error) {
    await settleClock(page, 3000);
    const current = await listCandidates(page);
    const replacement = chooseCandidate(current, snapshot, random, boost);
    if (!replacement) throw error;
    await clickCandidate(replacement, page);
    return { candidate: replacement, recovered: true };
  }
}

// ナビ巡回本体。各駅で「開く→画面IDを検証→D3走査」だけを行い、issueが出たら
// **現場画面を保ったまま**主ループへ返す(帰還クリックで screenshot の現場を消さない)。
// 巡回中に予期しないポップアップ/モーダルが出たら進行保護を優先して打ち切る。
// PRNGは一切消費しないので、同シード同経路の決定論を崩さない。
async function runNavTour({ page, detectors, actionLog, navTourVisited, seed, step, tourKey }) {
  for (const stop of NAV_TOUR_STOPS) {
    const before = await detectors.snapshot(page);
    // 続行判定を snapshot.overlays で見てはいけない: [class*="overlay"] は
    // dojo-header-overlay(団体画面の装飾層)等も拾うため、画面を開いた直後は必ず非空に
    // なる(2026-08-31 初走で実証)。本物のモーダルはナビ自体を覆ってクリックを不能に
    // するので、popupキューの活性+クリック不能の2つで中断を判定する
    if (before.popup && before.popup.active) {
      process.stdout.write(`  nav-tour(${tourKey}) aborted before ${stop.label}: popup active\n`);
      break;
    }
    const clicked = await page.locator('.nav-btn', { hasText: stop.label }).first()
      .click({ timeout: 1500 }).then(() => true).catch(() => false);
    if (!clicked) {
      const blocked = await detectors.snapshot(page);
      if ((blocked.overlays && blocked.overlays.length > 0) || (blocked.popup && blocked.popup.active)) {
        process.stdout.write(`  nav-tour(${tourKey}) aborted before ${stop.label}: nav blocked (overlays=${(blocked.overlays || []).join('|') || 'none'}, popupActive=${!!(blocked.popup && blocked.popup.active)})\n`);
        break;
      }
      // 遮蔽物が無いのに常設ナビが押せない=死にタブ。FREEZE級として記録
      detectors.record('D2_FREEZE', `nav-tour: ${stop.label} click failed with no blocking overlay`, { stop, tourKey });
      return;
    }
    await settleClock(page);
    const after = await detectors.snapshot(page);
    actionLog.push({ action: `nav-tour:${stop.label}`, after: after.state, before: before.state, seed, step });
    if (after.activeScreen !== stop.screen) {
      // クリックは通ったのに画面が開かない=死にタブ。FREEZE級として記録
      detectors.record('D2_FREEZE', `nav-tour: ${stop.label} did not open ${stop.screen} (active=${after.activeScreen})`, {
        activeScreen: after.activeScreen,
        stop,
        tourKey,
      });
      return;
    }
    navTourVisited.push(stop.screen);
    process.stdout.write(`  nav-tour(${tourKey}): ${stop.label} -> ${stop.screen}\n`);
    await detectors.scanText(page);
    if (detectors.issues.length > 0) return;
  }
  // 帰還。失敗しても主ループの脱出口(「今週」への帰還)が拾う
  await page.locator('.nav-btn', { hasText: '今週' }).first().click({ timeout: 1500 }).catch(() => {});
  await settleClock(page);
}

async function runWalk(options) {
  const {
    artifactRoot,
    detectors,
    fixtureName,
    boost = null,
    maxSteps = 1200,
    navTour = false,
    observe = null,
    page,
    reproductionCommand,
    seasons = 1,
    seed = 42,
    until = null,
  } = options;
  const random = createSeededPrng(seed);
  const actionLog = [];
  const specialScreens = new Set();
  // ナビ巡回の時刻表: 開幕直後の初回+コンテンツが溜まったweek10以降の2回(ゲーム状態
  // キーなので決定論)。途中週開始のセーブでは満期分をまとめて1巡に畳む
  const navTourPlan = navTour ? [
    { key: 'early', when: () => true },
    { key: 'late', when: state => state.week >= 10 },
  ] : [];
  const navTourVisited = [];
  const recoveries = [];
  let initialState = null;
  let previousProgressKey = null;

  for (let step = 1; step <= maxSteps; step += 1) {
    await settleClock(page, 2200);
    const before = await detectors.snapshot(page);
    if (before.activeScreen && before.activeScreen !== 'screen-week' && before.activeScreen !== 'titleScreen') {
      specialScreens.add(before.activeScreen);
    }
    if (observe) observe(before);
    if (before.state && !initialState) {
      initialState = before.state;
      previousProgressKey = progressKey(before);
      detectors.noteProgress(before);
    }
    const goalReached = until
      ? until(before)
      : (initialState && before.state
        && before.state.season >= initialState.season + seasons
        && before.state.week === 1 && !before.state.offSeason);
    if (goalReached) {
      return {
        actionDigest: stableHash(JSON.stringify(actionLog)),
        actionLog,
        completed: true,
        finalState: before.state,
        issues: detectors.issues,
        // navTourSkipped: 発車条件に一度も合わなかった巡回キー。到達不能が黙って
        // 復活しないよう(旧NAVIGATION_TEXTの轍)、未消化は必ずレポートに出す
        navTourScreens: [...navTourVisited],
        navTourSkipped: navTourPlan.map(entry => entry.key),
        recoveries,
        specialScreens: [...specialScreens].sort(),
      };
    }

    await detectors.scanText(page);
    const watchdogIssue = detectors.checkWatchdog(before);
    const immediateIssue = detectors.issues[0] || watchdogIssue;
    if (immediateIssue) {
      const directory = await writeFailureArtifacts({
        actionLog,
        artifactRoot,
        consoleEntries: detectors.consoleEntries,
        issue: immediateIssue,
        page,
        reproductionCommand: `${reproductionCommand} --max-steps ${step}`,
        state: before,
        step,
      });
      return { actionLog, completed: false, finalState: before.state, issues: detectors.issues, artifactDirectory: directory, navTourScreens: [...navTourVisited], navTourSkipped: navTourPlan.map(entry => entry.key), recoveries, specialScreens: [...specialScreens].sort() };
    }

    // ナビ巡回(②): 進行を一切妨げないクリーン状態のときだけ発車する。
    // 条件はゲーム状態キーのみ(壁時計不使用)なので同シードなら同じ手番で発火する。
    // showScreen側のナビブロック(交渉中/解雇面談中)と表彰式ガードには最初から近づかない
    if (navTourPlan.length > 0 && before.state
      && before.activeScreen === 'screen-week'
      && !before.state.offSeason && !before.state.pendingAwards
      && before.state.weekPhase !== 'contractNegotiation'
      && (!before.overlays || before.overlays.length === 0)
      && !(before.popup && before.popup.active)) {
      const due = navTourPlan.filter(entry => entry.when(before.state));
      if (due.length > 0) {
        for (let index = navTourPlan.length - 1; index >= 0; index -= 1) {
          if (navTourPlan[index].when(before.state)) navTourPlan.splice(index, 1);
        }
        const tourKey = due.map(entry => entry.key).join('+');
        process.stdout.write(`  nav-tour(${tourKey}) departs: season=${before.state.season} week=${before.state.week} step=${step}\n`);
        await runNavTour({ page, detectors, actionLog, navTourVisited, seed, step, tourKey });
        continue;
      }
    }

    let candidates = await listCandidates(page);
    let selected = chooseCandidate(candidates, before, random, boost);
    if (!selected) {
      // Some full-screen ceremonies intentionally cover their first real
      // control with a timed intro. Give that UI its normal five-second grace
      // period before classifying the screen as a dead end.
      await waitForTimedUi(page, 5000);
      candidates = await listCandidates(page);
      selected = chooseCandidate(candidates, await detectors.snapshot(page), random, boost);
    }
    if (!selected && before.activeScreen && before.activeScreen !== 'screen-week') {
      // 週次新聞ジャック等で側画面へ遷移した直後は前進コントロールが無い。
      // ナビタブ禁止の原則は保ちつつ「今週」への帰還だけを脱出口として許す
      const homeClicked = await page.locator('.nav-btn', { hasText: '今週' }).first()
        .click({ timeout: 1500 }).then(() => true).catch(() => false);
      if (homeClicked) {
        await settleClock(page);
        actionLog.push({ action: 'nav:今週(escape)', after: (await detectors.snapshot(page)).state, before: before.state, seed, step });
        continue;
      }
    }
    if (!selected) {
      const issue = detectors.record('D2_FREEZE', 'no safe progress control is visible', {
        candidates: candidates.map(candidate => candidate.text),
        snapshot: before,
      });
      const directory = await writeFailureArtifacts({
        actionLog,
        artifactRoot,
        consoleEntries: detectors.consoleEntries,
        issue,
        page,
        reproductionCommand: `${reproductionCommand} --max-steps ${step}`,
        state: before,
        step,
      });
      return { actionLog, completed: false, finalState: before.state, issues: detectors.issues, artifactDirectory: directory, navTourScreens: [...navTourVisited], navTourSkipped: navTourPlan.map(entry => entry.key), recoveries, specialScreens: [...specialScreens].sort() };
    }

    let label = actionLabel(selected);
    process.stdout.write(`  action ${step}: ${label}\n`);
    const mutationWatch = await detectors.beginMutationWatch(page);
    let clickResult;
    try {
      clickResult = await clickWithOverlayRecovery(page, selected, before, random, boost);
    } catch (error) {
      // クリックが恒久的に遮られる(全面オーバーレイ越しの陳腐化ボタン等)。
      // クラッシュではなくFREEZEとしてアーティファクトを残して着地する
      await mutationWatch.dispose().catch(() => {});
      const fullError = String(error.message || error);
      process.stdout.write(`  click-block detail:\n${fullError.split('\n').slice(0, 14).join('\n')}\n`);
      const issue = detectors.record('D2_FREEZE', `click permanently blocked on ${label}: ${fullError.split('\n')[0]}`, {
        action: label,
        fullError,
        snapshot: before,
      });
      const directory = await writeFailureArtifacts({
        actionLog,
        artifactRoot,
        consoleEntries: detectors.consoleEntries,
        issue,
        page,
        reproductionCommand: `${reproductionCommand} --max-steps ${step}`,
        state: before,
        step,
      });
      return { actionLog, completed: false, finalState: before.state, issues: detectors.issues, artifactDirectory: directory, navTourScreens: [...navTourVisited], navTourSkipped: navTourPlan.map(entry => entry.key), recoveries, specialScreens: [...specialScreens].sort() };
    }
    const clicked = clickResult.candidate;
    if (clickResult.recovered) {
      label = actionLabel(clicked);
      process.stdout.write(`  action ${step} recovered: ${label}\n`);
    }
    const retryPool = candidates
      .filter(candidate => candidate.index !== selected.index
        && Number.isFinite(actionScore(candidate, before.state)));
    const progress = await detectors.detectStack(page, before, label, retryPool.map(candidate => async () => {
      await retryCandidate(page, candidate).catch(() => {});
    }), mutationWatch);
    const after = progress.after;
    if (observe && after) observe(after);
    // ③2026-08-31監査対応: 押しても何も起きず兄弟ボタンで前進した=死にボタンの容疑。
    // 回復自体は走破を止めないが、容疑者と回復役をレポートに残す(黙って揉み消さない)
    let recoveredBy = null;
    if (progress.recoveredByRetry) {
      recoveredBy = Number.isInteger(progress.retryIndex) && retryPool[progress.retryIndex]
        ? actionLabel(retryPool[progress.retryIndex])
        : 'unknown';
      recoveries.push({ action: label, recoveredBy, step });
      process.stdout.write(`  recovered-by-retry: ${label} produced no progress; sibling ${recoveredBy} advanced\n`);
    }
    const nextProgressKey = progressKey(after);
    actionLog.push({
      action: label,
      after: after.state,
      before: before.state,
      ...(recoveredBy ? { recoveredBy } : {}),
      seed,
      step,
    });

    if (nextProgressKey && nextProgressKey !== previousProgressKey) {
      previousProgressKey = nextProgressKey;
      process.stdout.write(`  progress: season=${after.state.season} week=${after.state.week} off=${after.state.offSeason ? after.state.offWeek : 0} step=${step}\n`);
    }
    // ポップアップ直列化キューの観測(2026-08-14 キュー飢餓調査)。残量が変わった手だけ出す
    const beforeQueue = before.popup ? before.popup.queueLength : null;
    const afterQueue = after.popup ? after.popup.queueLength : null;
    if (afterQueue !== null && afterQueue !== beforeQueue) {
      process.stdout.write(`  popup-queue: ${beforeQueue} -> ${afterQueue} (active=${after.popup.active}) after ${label}\n`);
    }

    await detectors.scanText(page);
    const issue = detectors.issues[0];
    if (issue) {
      const directory = await writeFailureArtifacts({
        actionLog,
        artifactRoot,
        consoleEntries: detectors.consoleEntries,
        issue,
        page,
        reproductionCommand: `${reproductionCommand} --max-steps ${step}`,
        state: after,
        step,
      });
      return { actionLog, completed: false, finalState: after.state, issues: detectors.issues, artifactDirectory: directory, navTourScreens: [...navTourVisited], navTourSkipped: navTourPlan.map(entry => entry.key), recoveries, specialScreens: [...specialScreens].sort() };
    }
  }

  const finalSnapshot = await detectors.snapshot(page);
  const issue = detectors.record('D5_WATCHDOG', `maximum step count ${maxSteps} reached`, { state: finalSnapshot.state });
  const directory = await writeFailureArtifacts({
    actionLog,
    artifactRoot,
    consoleEntries: detectors.consoleEntries,
    issue,
    page,
    reproductionCommand: `${reproductionCommand} --max-steps ${maxSteps}`,
    state: finalSnapshot,
    step: maxSteps,
  });
  return { actionLog, completed: false, finalState: finalSnapshot.state, issues: detectors.issues, artifactDirectory: directory, navTourScreens: [...navTourVisited], navTourSkipped: navTourPlan.map(entry => entry.key), recoveries, specialScreens: [...specialScreens].sort() };
}

module.exports = { createSeededPrng, listCandidates, runWalk };
