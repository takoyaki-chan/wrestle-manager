const STYLE_PAIR_VALUES = {
  Grappler: {
    Grappler: 75,
    Aerial: 100,
    Submission: 75,
    Allround: 50,
    Striker: 50,
    Brawler: 20,
  },
  Aerial: {
    Grappler: 100,
    Aerial: 75,
    Submission: 50,
    Allround: 100,
    Striker: 50,
    Brawler: 50,
  },
  Submission: {
    Grappler: 75,
    Aerial: 50,
    Submission: 50,
    Allround: 50,
    Striker: 100,
    Brawler: 100,
  },
  Allround: {
    Grappler: 50,
    Aerial: 100,
    Submission: 50,
    Allround: 50,
    Striker: 50,
    Brawler: 50,
  },
  Striker: {
    Grappler: 50,
    Aerial: 50,
    Submission: 100,
    Allround: 50,
    Striker: 75,
    Brawler: 75,
  },
  Brawler: {
    Grappler: 20,
    Aerial: 50,
    Submission: 100,
    Allround: 50,
    Striker: 75,
    Brawler: 75,
  },
};

const STYLE_PAIR_LABELS = {
  100: "補完",
  75: "共鳴",
  50: "普通",
  20: "噛み合わない",
};

export function getPairKey(idA, idB) {
  return [idA, idB].sort((a, b) => a - b).join("|");
}

export function calculateOvr(fighter) {
  return Math.round((fighter.pw + fighter.sp + fighter.te + fighter.st + fighter.mn) / 5);
}

export function calculateTagExperienceValue(matchCount) {
  return 100 * (1 - Math.exp(-(matchCount || 0) / 7));
}

export function getStyleCompatibility(styleA, styleB) {
  return STYLE_PAIR_VALUES[styleA]?.[styleB] ?? 50;
}

export function getStyleCompatibilityLabel(styleA, styleB) {
  return STYLE_PAIR_LABELS[getStyleCompatibility(styleA, styleB)] || "普通";
}

export function getRelationship(relationships, idA, idB) {
  const forward = relationships?.[`${idA}>${idB}`] || { bond: 50, rivalry: 0 };
  const reverse = relationships?.[`${idB}>${idA}`] || { bond: 50, rivalry: 0 };
  return {
    forward,
    reverse,
    averageBond: (forward.bond + reverse.bond) / 2,
    averageRivalry: (forward.rivalry + reverse.rivalry) / 2,
    balanceGap: Math.abs(forward.bond - reverse.bond),
  };
}

export function calculateTeamChemistry(fighterA, fighterB, relationships, tagExperienceByPair) {
  const pairKey = getPairKey(fighterA.id, fighterB.id);
  const relation = getRelationship(relationships, fighterA.id, fighterB.id);
  const tagMatches = tagExperienceByPair?.[pairKey] || 0;
  const experience = calculateTagExperienceValue(tagMatches);
  const styleFit = getStyleCompatibility(fighterA.style, fighterB.style);
  const chemistry = (relation.averageBond * 0.5) + (experience * 0.3) + (styleFit * 0.2);
  return {
    pairKey,
    chemistry,
    bond: relation.averageBond,
    rivalry: relation.averageRivalry,
    balanceGap: relation.balanceGap,
    tagMatches,
    experience,
    styleFit,
    styleLabel: getStyleCompatibilityLabel(fighterA.style, fighterB.style),
  };
}

export function buildRecommendedTeams(fighters, relationships, tagExperienceByPair, options = {}) {
  const maxTeams = options.maxTeams || 10;
  const allowedIds = new Set((options.allowedIds || fighters.map((fighter) => fighter.id)));
  const pool = fighters.filter((fighter) => allowedIds.has(fighter.id));
  const teams = [];

  for (let left = 0; left < pool.length; left += 1) {
    for (let right = left + 1; right < pool.length; right += 1) {
      const fighterA = pool[left];
      const fighterB = pool[right];
      const chemistry = calculateTeamChemistry(fighterA, fighterB, relationships, tagExperienceByPair);
      teams.push({
        fighterA,
        fighterB,
        chemistry,
        score: chemistry.chemistry + (calculateOvr(fighterA) + calculateOvr(fighterB)) * 0.12,
      });
    }
  }

  return teams
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTeams);
}

export function chooseBestCpuTeam(fighters, selectedIds, relationships, tagExperienceByPair) {
  const blocked = new Set(selectedIds);
  const candidates = fighters.filter((fighter) => !blocked.has(fighter.id));
  const [best] = buildRecommendedTeams(candidates, relationships, tagExperienceByPair, { maxTeams: 1 });
  return best || null;
}

export function summarizeTeamProfile(team) {
  const statTotals = team.reduce(
    (acc, fighter) => {
      acc.pw += fighter.pw;
      acc.sp += fighter.sp;
      acc.te += fighter.te;
      acc.st += fighter.st;
      acc.mn += fighter.mn;
      return acc;
    },
    { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
  );

  return {
    averageOvr: Math.round(team.reduce((sum, fighter) => sum + calculateOvr(fighter), 0) / team.length),
    stats: {
      pw: statTotals.pw / team.length,
      sp: statTotals.sp / team.length,
      te: statTotals.te / team.length,
      st: statTotals.st / team.length,
      mn: statTotals.mn / team.length,
    },
  };
}

