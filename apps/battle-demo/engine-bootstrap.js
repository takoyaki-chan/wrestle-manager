'use strict';

var Engine = {
    rng: {
      create(seed) {
        seed |= 0;
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
        return (state.s0 + state.s1) >>> 0;
      },
      float(rng) {
        return Engine.rng._next(rng) / 4294967296;
      },
      int(rng, min, max) {
        return min + Math.floor(Engine.rng.float(rng) * (max - min + 1));
      },
      pick(rng, values) {
        return values[Math.floor(Engine.rng.float(rng) * values.length)];
      },
      weighted(rng, weights) {
        const entries = Object.entries(weights);
        const total = entries.reduce((sum, entry) => sum + entry[1], 0);
        let roll = Engine.rng.float(rng) * total;
        for (const [key, weight] of entries) {
          roll -= weight;
          if (roll <= 0) return key;
        }
        return entries[entries.length - 1][0];
      },
      derive(baseSeed, ...keys) {
        let hash = baseSeed | 0;
        for (const key of keys) {
          hash = ((hash << 5) - hash + (typeof key === 'number' ? key : 0)) | 0;
          hash = ((hash >>> 16) ^ hash) * 0x45d9f3b | 0;
        }
        return hash || 1;
      },
    },
    util: {
      clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      },
      ov(fighter) {
        return Math.round((fighter.pw + fighter.sp + fighter.te + fighter.st + fighter.mn) / 5);
      },
      eff(value) {
        if (typeof ENG === 'undefined' || value <= ENG.effPivot) return value;
        return ENG.effPivot + (value - ENG.effPivot) * ENG.effSlopeAfterPivot;
      },
    },
};

var Traits = {
  has(fighter, traitName) {
    return Array.isArray(fighter && fighter.traits) && fighter.traits.includes(traitName);
  },
};

window.WMDemoEngine = Object.freeze({
  isReady() {
    return !!(Engine.battle && typeof Engine.battle.simulateMatch === 'function');
  },
  simulate(left, right, seed) {
    if (!this.isReady()) throw new Error('バトルエンジンが準備できていません。');
    const rng = Engine.rng.create(seed || 1);
    return Engine.battle.simulateMatch(left, right, rng, 1, {
      recordFrames: true,
      popularityInfluence: 0,
    });
  },
});
