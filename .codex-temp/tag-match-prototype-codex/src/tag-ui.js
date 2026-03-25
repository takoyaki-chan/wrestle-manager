import { fighters, namedTeams, relationships, sourceNote, styleGuide, tagExperienceByPair } from "./tag-data.js";
import {
  buildRecommendedTeams,
  calculateOvr,
  calculateTeamChemistry,
  chooseBestCpuTeam,
  summarizeTeamProfile,
} from "./tag-chemistry.js";
import { runBatchSimulation, simulateTagMatch } from "./tag-engine.js";

const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));
const selectIds = ["left-a", "left-b", "right-a", "right-b"];

const state = {
  leftIds: [1, 12],
  rightIds: [37, 46],
  seed: 240324,
  lastMatch: null,
  lastBatch: null,
};

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function getTeamName(ids, fallbackPrefix) {
  const exact = namedTeams.find((team) => team.fighterIds[0] === ids[0] && team.fighterIds[1] === ids[1])
    || namedTeams.find((team) => team.fighterIds[0] === ids[1] && team.fighterIds[1] === ids[0]);
  if (exact) return exact.name;
  return `${fallbackPrefix}: ${fighterMap.get(ids[0]).name} / ${fighterMap.get(ids[1]).name}`;
}

function getSelectedTeams() {
  const left = state.leftIds.map((id) => fighterMap.get(id)).filter(Boolean);
  const right = state.rightIds.map((id) => fighterMap.get(id)).filter(Boolean);
  return {
    left,
    right,
    leftName: getTeamName(state.leftIds, "Red Corner"),
    rightName: getTeamName(state.rightIds, "Blue Corner"),
  };
}

function createOptionList(select, selectedId) {
  const options = fighters
    .slice()
    .sort((a, b) => calculateOvr(b) - calculateOvr(a))
    .map((fighter) => `
      <option value="${fighter.id}" ${fighter.id === selectedId ? "selected" : ""}>
        ${escapeHtml(fighter.name)} | ${fighter.style} | OVR ${calculateOvr(fighter)}
      </option>
    `)
    .join("");
  select.innerHTML = options;
}

function syncSelects() {
  createOptionList($("left-a"), state.leftIds[0]);
  createOptionList($("left-b"), state.leftIds[1]);
  createOptionList($("right-a"), state.rightIds[0]);
  createOptionList($("right-b"), state.rightIds[1]);
  $("seed-input").value = state.seed;
}

function ensureDistinct(ids) {
  if (ids[0] !== ids[1]) return ids;
  const replacement = fighters.find((fighter) => fighter.id !== ids[0])?.id || ids[0];
  return [ids[0], replacement];
}

function teamPanelMarkup(title, ids) {
  const [fighterA, fighterB] = ids.map((id) => fighterMap.get(id));
  const chemistry = calculateTeamChemistry(fighterA, fighterB, relationships, tagExperienceByPair);
  const profile = summarizeTeamProfile([fighterA, fighterB]);
  return `
    <strong>${escapeHtml(title)}</strong>
    <div class="big-value">${Math.round(chemistry.chemistry)}</div>
    <div class="chip-row">
      <span class="chip">bond ${chemistry.bond.toFixed(1)}</span>
      <span class="chip alt">exp ${chemistry.experience.toFixed(1)}</span>
      <span class="chip ${chemistry.styleFit <= 20 ? "bad" : ""}">${escapeHtml(chemistry.styleLabel)} ${chemistry.styleFit}</span>
    </div>
    <div class="value-sub">
      avg OVR ${profile.averageOvr} / ${fighterA.style} + ${fighterB.style}<br>
      matches ${chemistry.tagMatches} / rivalry ${chemistry.rivalry.toFixed(1)}
    </div>
    <div class="fighter-list">
      ${[fighterA, fighterB].map((fighter) => `
        <div class="fighter-row">
          <div>
            <strong>${escapeHtml(fighter.name)}</strong><br>
            <small>${fighter.style} / ${fighter.role} / OVR ${calculateOvr(fighter)}</small>
          </div>
          <div class="chip-row">
            <span class="chip">${fighter.pw}-${fighter.sp}-${fighter.te}-${fighter.st}-${fighter.mn}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderChemistry() {
  const { left, right, leftName, rightName } = getSelectedTeams();
  const leftChemistry = calculateTeamChemistry(left[0], left[1], relationships, tagExperienceByPair);
  const rightChemistry = calculateTeamChemistry(right[0], right[1], relationships, tagExperienceByPair);
  const matchupText = leftChemistry.chemistry > rightChemistry.chemistry
    ? `${leftName} が連携面で優勢`
    : rightChemistry.chemistry > leftChemistry.chemistry
      ? `${rightName} が連携面で優勢`
      : "連携面はほぼ互角";

  $("left-chemistry").innerHTML = teamPanelMarkup(leftName, state.leftIds);
  $("right-chemistry").innerHTML = teamPanelMarkup(rightName, state.rightIds);
  $("matchup-chemistry").innerHTML = `
    <strong>Matchup Read</strong>
    <div class="big-value">${Math.round(Math.abs(leftChemistry.chemistry - rightChemistry.chemistry))}</div>
    <div class="value-sub">
      chemistry gap<br>
      ${escapeHtml(matchupText)}
    </div>
    <div class="fighter-list">
      <div class="fighter-row">
        <div>
          <strong>Red Corner</strong><br>
          <small>${escapeHtml(leftName)}</small>
        </div>
        <span class="chip">${Math.round(leftChemistry.chemistry)}</span>
      </div>
      <div class="fighter-row">
        <div>
          <strong>Blue Corner</strong><br>
          <small>${escapeHtml(rightName)}</small>
        </div>
        <span class="chip alt">${Math.round(rightChemistry.chemistry)}</span>
      </div>
      <div class="fighter-row">
        <div>
          <strong>What To Watch</strong><br>
          <small>高 chemistry は戦術タッチとダブルチームが安定。低 chemistry は誤爆と見殺しが見えやすい。</small>
        </div>
      </div>
    </div>
  `;
}

function renderNamedTeams() {
  $("named-teams").innerHTML = namedTeams.map((team) => {
    const [a, b] = team.fighterIds.map((id) => fighterMap.get(id));
    const chemistry = calculateTeamChemistry(a, b, relationships, tagExperienceByPair);
    return `
      <div class="named-team">
        <strong>${escapeHtml(team.name)}</strong>
        <div class="chip-row">
          <span class="chip">${a.style} + ${b.style}</span>
          <span class="chip alt">chem ${Math.round(chemistry.chemistry)}</span>
        </div>
        <div class="muted">${escapeHtml(team.note)}</div>
        <div class="inline-actions">
          <button class="secondary" data-team-side="left" data-team-name="${escapeHtml(team.name)}">Load Red</button>
          <button class="secondary" data-team-side="right" data-team-name="${escapeHtml(team.name)}">Load Blue</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderRecommendations() {
  const recommendations = buildRecommendedTeams(fighters, relationships, tagExperienceByPair, { maxTeams: 8 });
  $("recommendations").innerHTML = recommendations.map((entry) => `
    <div class="recommendation">
      <strong>${escapeHtml(entry.fighterA.name)} / ${escapeHtml(entry.fighterB.name)}</strong>
      <div class="chip-row">
        <span class="chip alt">chem ${Math.round(entry.chemistry.chemistry)}</span>
        <span class="chip">${entry.chemistry.styleLabel}</span>
        <span class="chip">${entry.chemistry.tagMatches} matches</span>
      </div>
      <div class="muted">
        ${entry.fighterA.style} x ${entry.fighterB.style} / bond ${entry.chemistry.bond.toFixed(1)}
      </div>
      <div class="inline-actions">
        <button class="secondary" data-load-pair="left" data-pair="${entry.fighterA.id},${entry.fighterB.id}">Use Red</button>
        <button class="secondary" data-load-pair="right" data-pair="${entry.fighterA.id},${entry.fighterB.id}">Use Blue</button>
      </div>
    </div>
  `).join("");
}

function renderSummary(match) {
  if (!match) {
    $("summary-grid").innerHTML = `
      <div class="stat-card"><h3>Status</h3><div class="big-value">Ready</div><div class="value-sub">編成後に Simulate Match を押してください。</div></div>
    `;
    $("segments").innerHTML = "";
    $("log-feed").innerHTML = "";
    return;
  }

  $("summary-grid").innerHTML = `
    <div class="stat-card">
      <h3>Winner</h3>
      <div class="big-value">${escapeHtml(match.finish.winningTeam)}</div>
      <div class="value-sub">${escapeHtml(match.finish.scorer)} def. ${escapeHtml(match.finish.victim)}</div>
    </div>
    <div class="stat-card">
      <h3>Tag MQ</h3>
      <div class="big-value">${match.mq.total}</div>
      <div class="value-sub">offense ${match.mq.offenseBase} / drama ${match.mq.dramaBonus} / finish ${match.mq.finishBonus}</div>
    </div>
    <div class="stat-card">
      <h3>Finish</h3>
      <div class="big-value">${escapeHtml(match.finish.type)}</div>
      <div class="value-sub">${escapeHtml(match.finish.finishMove)}</div>
    </div>
    <div class="stat-card">
      <h3>Turns</h3>
      <div class="big-value">${match.turns}</div>
      <div class="value-sub">segments ${match.segments.length} / longest ${match.mq.longestSegmentTurns}</div>
    </div>
    <div class="stat-card">
      <h3>Drama Count</h3>
      <div class="big-value">${(match.eventCounts.hotTag || 0) + (match.eventCounts.cutIn || 0) + (match.eventCounts.doubleTeam || 0)}</div>
      <div class="value-sub">hot tag ${match.eventCounts.hotTag || 0}, cut-in ${match.eventCounts.cutIn || 0}, double team ${match.eventCounts.doubleTeam || 0}</div>
    </div>
    <div class="stat-card">
      <h3>Stability Flags</h3>
      <div class="big-value">${(match.eventCounts.friendlyFire || 0) + (match.eventCounts.abandonment || 0)}</div>
      <div class="value-sub">friendly fire ${match.eventCounts.friendlyFire || 0}, abandonment ${match.eventCounts.abandonment || 0}</div>
    </div>
  `;

  $("segments").innerHTML = match.segments.map((segment) => `
    <div class="segment-card">
      <strong>Segment ${segment.number}</strong>
      <div>${escapeHtml(segment.matchup)}</div>
      <div class="value-sub">reason: ${escapeHtml(segment.reason)} / turns ${segment.turns}</div>
      <div class="chip-row" style="margin-top:8px;">
        ${segment.tags.length ? segment.tags.map((tag) => `<span class="chip">${escapeHtml(tag.team)} ${escapeHtml(tag.type)}</span>`).join("") : '<span class="chip alt">No tag</span>'}
      </div>
    </div>
  `).join("");

  $("log-feed").innerHTML = match.log.map((line) => `
    <div class="log-line" data-type="${line.type}">
      <strong>${line.turn ? `T${line.turn}` : "LOG"}</strong> ${escapeHtml(line.text)}
    </div>
  `).join("");
}

function renderBatch(batch) {
  if (!batch) {
    $("batch-grid").innerHTML = `
      <div class="batch-card"><h3>Batch</h3><div class="big-value">Idle</div><div class="value-sub">Run Batch 10x10 で安定性集計を表示します。</div></div>
    `;
    return;
  }

  const finishText = Object.entries(batch.finishBreakdown)
    .map(([type, count]) => `${type} ${count}`)
    .join(" / ");

  $("batch-grid").innerHTML = `
    <div class="batch-card">
      <h3>Win Rate</h3>
      <div class="big-value">${batch.leftWinRate}%</div>
      <div class="value-sub">${escapeHtml(getTeamName(state.leftIds, "Red"))} / opposite ${batch.rightWinRate}%</div>
    </div>
    <div class="batch-card">
      <h3>Average MQ</h3>
      <div class="big-value">${batch.avgMq}</div>
      <div class="value-sub">avg turns ${batch.avgTurns}</div>
    </div>
    <div class="batch-card">
      <h3>Event Density</h3>
      <div class="big-value">${batch.avgHotTags}</div>
      <div class="value-sub">hot tags per match / cut-ins ${batch.avgCutIns} / double teams ${batch.avgDoubleTeams}</div>
    </div>
    <div class="batch-card">
      <h3>Finish Spread</h3>
      <div class="big-value">${Object.keys(batch.finishBreakdown).length}</div>
      <div class="value-sub">${escapeHtml(finishText)}</div>
    </div>
    <div class="batch-card">
      <h3>Best Match</h3>
      <div class="big-value">${batch.notableMatch.mq.total}</div>
      <div class="value-sub">${escapeHtml(batch.notableMatch.finish.winningTeam)} / ${escapeHtml(batch.notableMatch.finish.finishMove)}</div>
    </div>
    <div class="batch-card">
      <h3>Volume</h3>
      <div class="big-value">${batch.totalMatches}</div>
      <div class="value-sub">${batch.seedCount} seeds x ${batch.iterationsPerSeed} matches</div>
    </div>
  `;
}

function renderFooter() {
  $("footer-note").innerHTML = `
    <p>Source: ${escapeHtml(sourceNote.copiedFrom)} から 26 名を静的コピー。prototype 側は本体ファイルを直接 import していません。</p>
    <p>Current style guide:</p>
    <div class="fighter-list">
      ${Object.entries(styleGuide).map(([style, note]) => `
        <div class="fighter-row">
          <div><strong>${style}</strong><br><small>${escapeHtml(note)}</small></div>
        </div>
      `).join("")}
    </div>
    <p>未実装として残しているもの: アライメント反則要素、ペア固定タッグフィニッシャー、ゲーム本体への接合。</p>
  `;
}

function runSingle() {
  const { left, right, leftName, rightName } = getSelectedTeams();
  state.lastMatch = simulateTagMatch({
    leftTeamName: leftName,
    rightTeamName: rightName,
    leftFighters: left,
    rightFighters: right,
    relationships,
    tagExperienceByPair,
    seed: Number(state.seed) || 1,
  });
  renderSummary(state.lastMatch);
}

function runBatch() {
  const { left, right, leftName, rightName } = getSelectedTeams();
  state.lastBatch = runBatchSimulation({
    leftTeamName: leftName,
    rightTeamName: rightName,
    leftFighters: left,
    rightFighters: right,
    relationships,
    tagExperienceByPair,
    baseSeed: Number(state.seed) || 1,
  });
  renderBatch(state.lastBatch);
}

function applyBestVsBest() {
  const bestLeft = chooseBestCpuTeam(fighters, [], relationships, tagExperienceByPair);
  if (!bestLeft) return;
  state.leftIds = [bestLeft.fighterA.id, bestLeft.fighterB.id];
  const bestRight = chooseBestCpuTeam(fighters, state.leftIds, relationships, tagExperienceByPair);
  if (!bestRight) return;
  state.rightIds = [bestRight.fighterA.id, bestRight.fighterB.id];
  syncSelects();
  renderChemistry();
  runSingle();
}

function applyStoryRivalry() {
  state.leftIds = [1, 12];
  state.rightIds = [16, 82];
  syncSelects();
  renderChemistry();
  runSingle();
}

function updateFromSelects() {
  state.leftIds = ensureDistinct([Number($("left-a").value), Number($("left-b").value)]);
  state.rightIds = ensureDistinct([Number($("right-a").value), Number($("right-b").value)]);
  state.seed = Number($("seed-input").value) || 1;
  syncSelects();
  renderChemistry();
}

function bindEvents() {
  selectIds.forEach((id) => {
    $(id).addEventListener("change", updateFromSelects);
  });

  $("seed-input").addEventListener("change", updateFromSelects);
  $("simulate-btn").addEventListener("click", runSingle);
  $("batch-btn").addEventListener("click", runBatch);
  $("best-vs-best-btn").addEventListener("click", applyBestVsBest);
  $("mirror-rival-btn").addEventListener("click", applyStoryRivalry);
  $("random-seed").addEventListener("click", () => {
    state.seed = Math.floor(Math.random() * 900000) + 1000;
    syncSelects();
  });

  $("named-teams").addEventListener("click", (event) => {
    const button = event.target.closest("[data-team-side]");
    if (!button) return;
    const team = namedTeams.find((entry) => entry.name === button.dataset.teamName);
    if (!team) return;
    if (button.dataset.teamSide === "left") state.leftIds = [...team.fighterIds];
    if (button.dataset.teamSide === "right") state.rightIds = [...team.fighterIds];
    syncSelects();
    renderChemistry();
    runSingle();
  });

  $("recommendations").addEventListener("click", (event) => {
    const button = event.target.closest("[data-load-pair]");
    if (!button) return;
    const [idA, idB] = (button.dataset.pair || "").split(",").map(Number);
    if (!idA || !idB) return;
    if (button.dataset.loadPair === "left") state.leftIds = [idA, idB];
    if (button.dataset.loadPair === "right") state.rightIds = [idA, idB];
    syncSelects();
    renderChemistry();
    runSingle();
  });
}

function init() {
  syncSelects();
  renderNamedTeams();
  renderRecommendations();
  renderChemistry();
  renderSummary(null);
  renderBatch(null);
  renderFooter();
  bindEvents();
  runSingle();
}

init();

