// ╔══════════════════════════════════════════════════════════╗
// ║  WM Engine Stub — wrestle-manager Engine の最小抽出       ║
// ║  タッグマッチプロトタイプが依存する関数のみ含む            ║
// ║  DO NOT EDIT — 本体 engine.js から静的コピー               ║
// ╚══════════════════════════════════════════════════════════╝

var Engine = {
  // ── RNG: Seeded xorshift128+ ──────────────────────────
  rng: {
    create(seed) {
      seed = seed | 0;
      if (seed === 0) seed = 1;
      let s0 = seed;
      s0 = ((s0 >>> 16) ^ s0) * 0x45d9f3b | 0;
      s0 = ((s0 >>> 16) ^ s0) * 0x45d9f3b | 0;
      s0 = (s0 >>> 16) ^ s0;
      let s1 = seed * 1812433253 + 1;
      s1 = ((s1 >>> 16) ^ s1) * 0x45d9f3b | 0;
      s1 = ((s1 >>> 16) ^ s1) * 0x45d9f3b | 0;
      s1 = (s1 >>> 16) ^ s1;
      if (s0 === 0 && s1 === 0) s0 = 1;
      return { s0, s1 };
    },
    _next(state) {
      let s1 = state.s0;
      const s0 = state.s1;
      state.s0 = s0;
      s1 ^= s1 << 23;
      s1 ^= s1 >>> 17;
      s1 ^= s0;
      s1 ^= s0 >>> 26;
      state.s1 = s1;
      return ((state.s0 + state.s1) >>> 0);
    },
    float(rng) {
      return Engine.rng._next(rng) / 4294967296;
    },
    int(rng, min, max) {
      return min + Math.floor(Engine.rng.float(rng) * (max - min + 1));
    },
    pick(rng, arr) {
      return arr[Math.floor(Engine.rng.float(rng) * arr.length)];
    },
    weighted(rng, weights) {
      const entries = Object.entries(weights);
      const total = entries.reduce((s, [, v]) => s + v, 0);
      let r = Engine.rng.float(rng) * total;
      for (const [k, v] of entries) {
        r -= v;
        if (r <= 0) return k;
      }
      return entries[entries.length - 1][0];
    },
    derive(baseSeed, ...keys) {
      let h = baseSeed | 0;
      for (const k of keys) {
        h = ((h << 5) - h + (typeof k === 'number' ? k : 0)) | 0;
        h = ((h >>> 16) ^ h) * 0x45d9f3b | 0;
      }
      return h || 1;
    }
  },

  // ── Utilities ──────────────────────────────────────────
  util: {
    clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
    ov(c) { return Math.round((c.pw + c.sp + c.te + c.st + c.mn) / 5); },
    eff(x) {
      if (x <= ENG.effPivot) return x;
      return ENG.effPivot + (x - ENG.effPivot) * ENG.effSlopeAfterPivot;
    },
  },

  // ── Battle Engine (DOM-free) ──────────────────────────
  battle: {
    phase(t, _phases) {
      const p = _phases || PHASES;
      return p.find(pp => t >= pp.min && t <= pp.max) || p[p.length - 1];
    },
    selMove(rng, style, turn, _phases) {
      const ph = Engine.battle.phase(turn, _phases);
      const use = Engine.rng.float(rng) * 100 < ph.sCh;
      const resolvedStyle = (style && styleMoves[style] && catW[style]) ? style : 'Allround';
      const pool = use ? styleMoves[resolvedStyle] : commonMoves;
      const cat = Engine.rng.weighted(rng, catW[resolvedStyle]);
      const cands = pool.filter(m => m.c === cat);
      return cands.length ? Engine.rng.pick(rng, cands) : Engine.rng.pick(rng, pool);
    },
    calcHitRate(mv, atk, def) {
      const eff = Engine.util.eff;
      const baseAcc = ENG.hitBase[Math.min(mv.d, 16)] || 70;
      let rate = baseAcc + (eff(atk.te) * ENG.tecHitBonus) - (eff(def.sp) * ENG.spdDodgeBonus);
      if (Traits.has(def, '威圧感')) rate -= 2;
      return Engine.util.clamp(rate, ENG.hitMin, ENG.hitMax);
    },
    calcCounterRate(atk, def, ph) {
      const eff = Engine.util.eff;
      let rate = ENG.counterBase + (eff(def.te) * ENG.counterTecScale) - (eff(atk.sp) * ENG.counterSpdPenalty) + ph.counterBonus;
      if (def.gritTurns > 0) rate += ENG.gritCounterBonus;
      if (Traits.has(atk, '威圧感')) rate -= 2;
      return Engine.util.clamp(rate, ENG.counterMin, ENG.counterMax);
    },
    calcDamage(rng, mv, atk, def, mom, atkSide, ph) {
      const eff = Engine.util.eff;
      const base = mv.d + (eff(atk.pw) * ENG.dmgPwrScale) + (eff(atk.te) * ENG.dmgTecScale)
        + (eff(atk.sp) * ENG.dmgSpdScale);
      const defense = (eff(def.st) * ENG.defStaScale) + (def.mn * ENG.defMntScale);
      const mAdv = atkSide === 'left' ? mom : -mom;
      const mMod = 1 + (mAdv * ENG.momDmgScale);
      const rF = ENG.dmgRandMin + (Engine.rng.float(rng) * ENG.dmgRandRange);
      let raw = (base - defense) * mMod * rF * ph.mult;
      if (def.gritTurns > 0) raw *= (1 - ENG.gritDmgReduction);
      return Math.max(ENG.dmgFloor, Math.round(raw));
    },
    determineFinishType(rng, mv) {
      return Engine.rng.weighted(rng, ENG.finishWeights[mv.c] || ENG.finishWeights.strike);
    },
    calcKickoutChance(def, ph, _eng) {
      const e = _eng || ENG;
      let chance = (def.mn / 100) * e.kickoutMnScale;
      if (ph.name === 'Climax') chance *= e.kickoutClimaxMult;
      if (Traits.has(def, '闘志') && def.hp / def.mhp < 0.3) chance += 0.08;
      chance = Engine.util.clamp(chance, 0.05, 0.45);
      if (def.kickoutCount >= e.kickoutMax) chance = 0;
      return chance;
    },
    calcGuEscapeChance(def, ph, _eng) {
      const e = _eng || ENG;
      let chance = (def.mn / 100) * e.guEscapeMnScale;
      if (ph.name === 'Climax') chance *= 0.8;
      chance = Engine.util.clamp(chance, 0.05, 0.40);
      if (def.kickoutCount >= e.guEscapeMax) chance = 0;
      return chance;
    },
    checkPinAttempt(rng, mv, atk, def, dmg, mom, atkSide, ph) {
      if (def.hp <= 0) return false;
      if (def.hp / def.mhp > ENG.pinAttemptHpThreshold) return false;
      if (dmg < ENG.pinAttemptMinDmg) return false;
      if (ph.name === 'Opening') return false;
      let attemptRate = ENG.pinAttemptBaseRate;
      const mAdv = atkSide === 'left' ? mom : -mom;
      attemptRate += mAdv * ENG.pinAttemptMomBonus;
      if (ph.name === 'Climax') attemptRate += 15;
      if (ph.name === 'End') attemptRate += 8;
      return Engine.rng.float(rng) * 100 < Engine.util.clamp(attemptRate, 10, 60);
    },
    calcPinAttemptSuccess(atk, def, dmg, ph) {
      let rate = ENG.pinAttemptSuccessBase + (dmg * 0.5) - (def.mn * ENG.pinAttemptMntPenalty);
      if (ph.name === 'Climax') rate += ENG.pinAttemptClimax;
      if (def.gritTurns > 0) rate -= 10;
      return Engine.util.clamp(rate, 8, 55);
    },
  },
};
