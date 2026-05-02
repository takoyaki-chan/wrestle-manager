// 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
// 笊・ SECTION 0: AUDIO SYSTEM (SFX + BGM)                     笊・
// 笊・ Web Audio API synthesized sounds 窶・no external files     笊・
// 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅

const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let bgmMasterGain = null; // BGM繧ｫ繝・ざ繝ｪ蜈ｨ菴薙・繝槭せ繧ｿ繝ｼ
  let sfxMasterGain = null; // SE繧ｫ繝・ざ繝ｪ蜈ｨ菴薙・繝槭せ繧ｿ繝ｼ
  let sfxGain = null;
  let bgmGain = null;
  let bgmNodes = null;  // active BGM oscillator nodes
  let _muted = false;
  let _sfxVol = 0.5;
  let _bgmVol = 0.04; // 竕・demo preview 15%
  let _bgmMuted = false; // BGM-only mute (jingles/SFX still play)
  let _bgmMasterVol = 0.7;  // BGM繝槭せ繧ｿ繝ｼ・医ョ繝輔か繝ｫ繝・0%・・
  let _sfxMasterVol = 1.0;  // SE繝槭せ繧ｿ繝ｼ・医ョ繝輔か繝ｫ繝・00%・・
  // 笏笏 Per-track volume targets (bgmGain.gain.value) 笏笏
  const CHIPTUNE_BGM_MIX = { kaimaku:0.19, management:0.35, battle:0.32, season_end:0.46, tension:0.42 };
  // 笏笏 SUNO BGM file mapping (replaces chiptune for 5 main tracks) 笏笏
  const SUNO_BGM = {
    kaimaku:    { file: '../bgm/bgm_kaimaku_v1.mp3',     vol: 0.17 },
    management: { file: '../bgm/bgm_management_v1.mp3',  vol: 0.12 },
    battle:     { file: '../bgm/bgm_battle_v1.mp3',      vol: 0.12 },
    season_end: { file: '../bgm/bgm_season_end_v1.mp3',  vol: 0.17 },
    tension:    { file: '../bgm/bgm_tension_v1.mp3',     vol: 0.17 },
  };
  const JINGLE_MIX = { victory:0.38, championship:0.20 };
  // Per-SE volume mix (sets sfxGain.gain.value before each SE plays)
  const SE_MIX = {
    click:.50, hover:.40, select:.50, deselect:.40, error:.50, save:.40, notify:.50,
    tick:.50, event:.50, reveal:.50, paper:.50,
    fanfare:.74, crowd:.18, bell:.56, bellx3:.76, impact:.61, victory:.70, defeat:.58,
    war:.60, transfer:.52, award:.72, tension_hit:.66,
    rivalry_confrontation:.64, fate_confrontation:.63, rivalry_resolution:.50, fate_resolution:.57,
    coin:.40, spend:.40, stamp:.40,
  };

  // Lazy-init AudioContext (must be triggered by user gesture)
  function ensure() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(ctx.destination);
    bgmMasterGain = ctx.createGain();
    bgmMasterGain.gain.value = _bgmMasterVol;
    bgmMasterGain.connect(masterGain);
    sfxMasterGain = ctx.createGain();
    sfxMasterGain.gain.value = _sfxMasterVol;
    sfxMasterGain.connect(masterGain);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = _sfxVol;
    sfxGain.connect(sfxMasterGain);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = _bgmVol;
    bgmGain.connect(bgmMasterGain);
    // Load saved prefs
    try {
      const prefs = JSON.parse(localStorage.getItem('wm_audio') || '{}');
      if (prefs.sfxVol !== undefined) { _sfxVol = prefs.sfxVol; sfxGain.gain.value = _sfxVol; }
      if (prefs.bgmVol !== undefined) { _bgmVol = prefs.bgmVol; bgmGain.gain.value = _bgmVol; }
      if (prefs.bgmMasterVol !== undefined) { _bgmMasterVol = prefs.bgmMasterVol; bgmMasterGain.gain.value = _bgmMasterVol; }
      if (prefs.sfxMasterVol !== undefined) { _sfxMasterVol = prefs.sfxMasterVol; sfxMasterGain.gain.value = _sfxMasterVol; }
      if (prefs.muted) { _muted = true; masterGain.gain.value = 0; }
      if (prefs.bgmMuted) { _bgmMuted = true; }
    } catch(e) {}
    return ctx;
  }

  function savePrefs() {
    try { localStorage.setItem('wm_audio', JSON.stringify({sfxVol:_sfxVol, bgmVol:_bgmVol, muted:_muted, bgmMuted:_bgmMuted, bgmMasterVol:_bgmMasterVol, sfxMasterVol:_sfxMasterVol})); } catch(e) {}
  }

  // 笏笏 Utility: create a quick envelope oscillator 笏笏
  function osc(freq, type, startTime, duration, gain, dest) {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(startTime);
    o.stop(startTime + duration + 0.05);
    return o;
  }

  // 笏笏 Utility: white noise burst 笏笏
  function noise(startTime, duration, gain, dest) {
    const c = ensure();
    const bufSize = c.sampleRate * duration;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    // Bandpass for texture
    const flt = c.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 2000;
    flt.Q.value = 1;
    src.connect(flt);
    flt.connect(g);
    g.connect(dest || sfxGain);
    src.start(startTime);
    src.stop(startTime + duration + 0.05);
  }

  // 笏笏 Utility: frequency sweep oscillator 笏笏
  function oscSweep(f0, f1, type, startTime, duration, gain, dest) {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, startTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), startTime + duration);
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(startTime);
    o.stop(startTime + duration + 0.05);
  }

  // 笏笏 Utility: filtered noise variants 笏笏
  function noiseHP(startTime, duration, gain, hpFreq) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpFreq;
    s.connect(hp); hp.connect(g); g.connect(sfxGain);
    s.start(startTime); s.stop(startTime + duration + 0.05);
  }

  function noiseLP(startTime, duration, gain, lpFreq) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = lpFreq;
    s.connect(lp); lp.connect(g); g.connect(sfxGain);
    s.start(startTime); s.stop(startTime + duration + 0.05);
  }

  function noiseBP(startTime, duration, gain, freq, q) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q || 1;
    s.connect(bp); bp.connect(g); g.connect(sfxGain);
    s.start(startTime); s.stop(startTime + duration + 0.05);
  }

  // 笏笏 Utility: bell partial with slow decay (for metallic gong) 笏笏
  function bellPartial(freq, startTime, duration, gain) {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(gain, startTime);
    g.gain.setTargetAtTime(0.001, startTime, duration * 0.35);
    o.connect(g);
    g.connect(sfxGain);
    o.start(startTime);
    o.stop(startTime + duration * 1.2);
  }

  // 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
  // 笊・ SOUND DEFINITIONS                               笊・
  // 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅
  const SFX = {
    // 笏笏 UI (NEW) 笏笏
    click() {
      const t = ensure().currentTime;
      noiseHP(t, 0.02, 0.08, 4000);
      osc(900, 'sine', t + 0.01, 0.04, 0.12);
      osc(1200, 'sine', t + 0.02, 0.03, 0.06);
    },
    hover() {
      const t = ensure().currentTime;
      osc(3200, 'sine', t, 0.025, 0.04);
      osc(4800, 'sine', t, 0.015, 0.02);
      noiseHP(t, 0.015, 0.02, 6000);
    },
    select() {
      const t = ensure().currentTime;
      osc(659, 'sine', t, 0.08, 0.15);
      osc(784, 'sine', t + 0.05, 0.08, 0.15);
      osc(1047, 'sine', t + 0.10, 0.12, 0.18);
      osc(1047, 'triangle', t + 0.10, 0.2, 0.06);
      noiseHP(t + 0.10, 0.06, 0.02, 8000);
    },
    deselect() {
      const t = ensure().currentTime;
      const c = ensure();
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'triangle'; o.frequency.setValueAtTime(800, t);
      o.frequency.exponentialRampToValueAtTime(300, t + 0.1);
      f.type = 'lowpass'; f.frequency.setValueAtTime(4000, t);
      f.frequency.exponentialRampToValueAtTime(200, t + 0.1);
      g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.15);
    },
    error() {
      const t = ensure().currentTime;
      const c = ensure();
      [0, 0.08].forEach(d => {
        const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
        o.type = 'square'; o.frequency.value = 160;
        f.type = 'lowpass'; f.frequency.value = 600;
        g.gain.setValueAtTime(0.07, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.06);
        o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t + d); o.stop(t + d + 0.07);
      });
    },
    save() {
      const t = ensure().currentTime;
      noiseHP(t, 0.03, 0.06, 5000);
      osc(1047, 'sine', t + 0.06, 0.1, 0.1);
      osc(1319, 'sine', t + 0.12, 0.12, 0.1);
      osc(1568, 'sine', t + 0.18, 0.2, 0.08);
      osc(1568, 'triangle', t + 0.18, 0.25, 0.04);
    },
    notify() {
      const t = ensure().currentTime;
      osc(1047, 'sine', t, 0.08, 0.12);
      osc(1047, 'triangle', t, 0.06, 0.04);
      osc(1397, 'sine', t + 0.12, 0.1, 0.12);
      osc(1397, 'triangle', t + 0.12, 0.08, 0.04);
    },
    tick() {
      const t = ensure().currentTime;
      noiseHP(t, 0.012, 0.06, 6000);
      osc(2400, 'sine', t, 0.02, 0.08);
      osc(1800, 'sine', t + 0.015, 0.025, 0.05);
    },
    // notify繧医ｊ荳谿ｵ驥阪＞縲後・繧ｩ繝ｳ縲坂・E5竊竪5 荳頑・2髻ｳ
    event() {
      const t = ensure().currentTime;
      osc(659, 'sine', t, 0.09, 0.18);
      osc(659, 'triangle', t, 0.04, 0.08);
      osc(784, 'sine', t + 0.14, 0.12, 0.22);
      osc(784, 'triangle', t + 0.14, 0.05, 0.10);
      noiseHP(t + 0.14, 0.02, 0.06, 5000);
    },
    // 繧ｽ繝輔ヨ縺ｪ繧ｷ繝ｳ繝舌Ν繝悶Λ繧ｷ・矩ｫ伜沺sine貂幄｡ｰ 窶・繧｢繝ｯ繝ｼ繝牙ｼ上せ繝ｩ繧､繝牙・譖ｿ
    reveal() {
      const t = ensure().currentTime;
      noiseHP(t, 0.04, 0.05, 5000);
      osc(2093, 'sine', t + 0.02, 0.03, 0.12);
      osc(3136, 'sine', t + 0.04, 0.02, 0.10);
    },

    paper() {
      const t = ensure().currentTime;
      noiseBP(t, 0.11, 0.08, 1800, 0.8);
      noiseHP(t + 0.015, 0.06, 0.05, 4200);
      oscSweep(980, 420, 'triangle', t + 0.01, 0.12, 0.05);
      osc(760, 'sine', t + 0.05, 0.08, 0.04);
    },

    // 笏笏 Events (OLD: fanfare / NEW: rest) 笏笏
    fanfare() {
      const t = ensure().currentTime;
      osc(523, 'sine', t, 0.15, 0.2);
      osc(659, 'sine', t + 0.1, 0.15, 0.2);
      osc(784, 'sine', t + 0.2, 0.15, 0.2);
      osc(1047, 'sine', t + 0.35, 0.4, 0.25);
      osc(1047, 'triangle', t + 0.35, 0.5, 0.1);
      noise(t + 0.35, 0.15, 0.04);
    },
    crowd() {
      try {
        const a = new window.Audio('../bgm/e02_crowd_v2.mp3');
        a.volume = Math.min(1, _sfxMasterVol * SE_MIX.crowd);
        a.play().catch(() => {});
      } catch(e) {
        // fallback: Web Audio synth
        const t = ensure().currentTime;
        noiseLP(t, 0.8, 0.08, 400);
        noiseBP(t + 0.05, 0.7, 0.06, 1200, 0.5);
        noiseHP(t + 0.1, 0.5, 0.03, 3000);
        oscSweep(180, 140, 'sawtooth', t, 0.4, 0.02);
      }
    },
    // Bell: metallic gong with rising tail (low partials short, high partials long)
    bell() {
      const t = ensure().currentTime;
      const base = 420;
      bellPartial(base * 1.0,  t, 0.3, 0.16);
      bellPartial(base * 2.32, t, 0.5, 0.11);
      bellPartial(base * 3.8,  t, 0.7, 0.07);
      bellPartial(base * 5.1,  t, 0.9, 0.04);
      bellPartial(base * 6.7,  t, 1.0, 0.025);
      noiseHP(t, 0.025, 0.07, 5000);
    },
    // Bell x3: match-end gong (繧ｫ繝ｳ繧ｫ繝ｳ繧ｫ繝ｳ)
    bellx3() {
      [0, 380, 760].forEach(d => setTimeout(() => { try { SFX.bell(); } catch(e) {} }, d));
    },
    impact() {
      const t = ensure().currentTime;
      oscSweep(100, 30, 'sine', t, 0.2, 0.3);
      oscSweep(80, 20, 'triangle', t, 0.25, 0.15);
      noise(t, 0.06, 0.25);
      noiseLP(t, 0.15, 0.12, 300);
      osc(50, 'sine', t + 0.05, 0.3, 0.1);
    },
    victory() {
      const t = ensure().currentTime;
      [523, 659, 784, 1047].forEach((f, i) => {
        osc(f, 'sine', t + i * 0.07, 0.2, 0.15);
        osc(f * 2, 'sine', t + i * 0.07, 0.15, 0.05);
      });
      osc(1047, 'triangle', t + 0.28, 0.6, 0.08);
      osc(2094, 'sine', t + 0.28, 0.4, 0.04);
      noiseHP(t + 0.28, 0.15, 0.03, 6000);
    },
    defeat() {
      const t = ensure().currentTime;
      osc(392, 'sine', t, 0.35, 0.14);
      osc(349, 'sine', t + 0.2, 0.35, 0.12);
      osc(311, 'sine', t + 0.4, 0.6, 0.10);
      osc(311, 'triangle', t + 0.4, 0.8, 0.04);
      oscSweep(200, 100, 'sine', t + 0.3, 0.7, 0.03);
    },
    war() {
      const t = ensure().currentTime;
      oscSweep(200, 60, 'sine', t, 0.08, 0.15);
      noise(t, 0.04, 0.12);
      osc(147, 'sawtooth', t + 0.1, 0.2, 0.05);
      osc(150, 'sawtooth', t + 0.1, 0.2, 0.05);
      oscSweep(200, 350, 'square', t + 0.25, 0.2, 0.04);
      noiseHP(t + 0.35, 0.15, 0.06, 2000);
    },
    transfer() {
      const t = ensure().currentTime;
      const c = ensure();
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      o.frequency.exponentialRampToValueAtTime(400, t + 0.3);
      f.type = 'bandpass'; f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(4000, t + 0.15);
      f.frequency.exponentialRampToValueAtTime(800, t + 0.3);
      f.Q.value = 2;
      g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.4);
      noiseHP(t + 0.05, 0.15, 0.04, 3000);
    },
    // C5-E5-G5 繝吶Ν繝上・繝｢繝九け繧ｹ・九せ繝代・繧ｯ繝ｫ 窶・蜿苓ｳ樒匱陦ｨ・・anfare莉｣譖ｿ・・
    award() {
      const t = ensure().currentTime;
      bellPartial(523, t,        0.4, 0.15);
      bellPartial(659, t + 0.12, 0.5, 0.12);
      bellPartial(784, t + 0.26, 0.6, 0.09);
      noiseHP(t + 0.26, 0.08, 0.04, 7000);
    },
    // 遏ｭ縺・ラ繝ｩ繝繝ｭ繝ｼ繝ｫ 竊・繧ｷ繝ｳ繝舌Ν荳謇・窶・繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ逋ｺ陦ｨ遲・
    tension_hit() {
      const t = ensure().currentTime;
      noiseLP(t,        0.12, 0.15, 200);
      noiseLP(t + 0.04, 0.10, 0.11, 250);
      noiseLP(t + 0.09, 0.08, 0.08, 300);
      noiseHP(t + 0.18, 0.5,  0.12, 4000);
      osc(60, 'sine',   t + 0.18, 0.4, 0.08);
    },

    // 笏笏 Money (NEW) 笏笏
    coin() {
      const t = ensure().currentTime;
      osc(1200, 'sine', t, 0.08, 0.1);
      osc(1800, 'sine', t + 0.01, 0.06, 0.08);
      osc(3600, 'sine', t + 0.02, 0.04, 0.06);
      osc(5400, 'sine', t + 0.02, 0.02, 0.03);
      noiseHP(t, 0.015, 0.04, 8000);
    },
    spend() {
      const t = ensure().currentTime;
      oscSweep(600, 200, 'triangle', t, 0.1, 0.08);
      noiseHP(t, 0.06, 0.05, 3000);
      osc(300, 'sine', t + 0.05, 0.08, 0.05);
    },
    stamp() {
      const t = ensure().currentTime;
      oscSweep(200, 60, 'sine', t, 0.06, 0.15);
      noiseLP(t, 0.04, 0.12, 500);
      noiseBP(t + 0.03, 0.08, 0.04, 2000, 2);
      osc(800, 'sine', t + 0.12, 0.08, 0.1);
      osc(1000, 'sine', t + 0.17, 0.1, 0.08);
    },

    // 笏笏 Rivalry SFX (NEW) 笏笏
    // 螳｣謌ｦ蟶・相: 繝峨Λ繝繝ｭ繝ｼ繝ｫ竊偵ざ繝ｳ繧ｰ竊偵ヶ繝ｩ繧ｹ荳頑・竊呈ｭ灘｣ｰ
    rivalry_confrontation() {
      const t = ensure().currentTime;
      // 1. 繝峨Λ繝繝ｭ繝ｼ繝ｫ騾｣謇難ｼ・逋ｺ縲√け繝ｬ繝・す繧ｧ繝ｳ繝会ｼ・
      for (let i = 0; i < 5; i++) {
        const g = 0.04 + i * 0.025;
        noiseLP(t + i * 0.08, 0.06, g, 300);
        osc(80 + i * 5, 'sine', t + i * 0.08, 0.05, g * 0.5);
      }
      // 2. 繧ｴ繝ｳ繧ｰ荳謇・
      osc(90, 'sine', t + 0.4, 1.2, 0.12);
      osc(800, 'sine', t + 0.4, 0.3, 0.06);
      osc(1600, 'sine', t + 0.4, 0.15, 0.03);
      noiseHP(t + 0.4, 0.08, 0.06, 5000);
      // 3. 繝悶Λ繧ｹ荳頑・・区ｭ灘｣ｰ
      oscSweep(200, 500, 'sawtooth', t + 0.7, 0.4, 0.05);
      noiseHP(t + 0.8, 0.6, 0.04, 2000);
    },
    // 螳ｿ蜻ｽ縺ｮ逶ｸ謇・螳｣謌ｦ蟶・相: 繧医ｊ螟ｪ縺城聞縺・
    fate_confrontation() {
      const t = ensure().currentTime;
      const vol = 1.2;
      // 1. 繝峨Λ繝繝ｭ繝ｼ繝ｫ騾｣謇難ｼ・逋ｺ縲√け繝ｬ繝・す繧ｧ繝ｳ繝峨・浹驥・.2蛟搾ｼ・
      for (let i = 0; i < 5; i++) {
        const g = (0.04 + i * 0.025) * vol;
        noiseLP(t + i * 0.08, 0.06, g, 300);
        osc(80 + i * 5, 'sine', t + i * 0.08, 0.05, g * 0.5);
      }
      // 2. 繧ｴ繝ｳ繧ｰ荳謇・
      osc(90, 'sine', t + 0.4, 1.2, 0.12 * vol);
      osc(800, 'sine', t + 0.4, 0.3, 0.06 * vol);
      osc(1600, 'sine', t + 0.4, 0.15, 0.03 * vol);
      noiseHP(t + 0.4, 0.08, 0.06 * vol, 5000);
      // 3. 繝悶Λ繧ｹ荳頑・・区ｭ灘｣ｰ・亥ｻｶ髟ｷ・・
      oscSweep(200, 500, 'sawtooth', t + 0.7, 0.4, 0.05 * vol);
      noiseHP(t + 0.8, 0.9, 0.04 * vol, 2000);
      // 4. 螟ｪ縺・ｽ朱浹・玖ｿｽ蜉繝悶Λ繧ｹ
      osc(60, 'sine', t + 0.5, 1.5, 0.08);
      oscSweep(300, 600, 'sawtooth', t + 0.8, 0.5, 0.04);
    },
    // 螳ｿ謨ｵ豎ｺ逹: 繧､繝ｳ繝代け繝茨ｼ九ヵ繧｡繝ｳ繝輔ぃ繝ｼ繝ｬ・区ｭ灘｣ｰ
    rivalry_resolution() {
      const t = ensure().currentTime;
      // 繧､繝ｳ繝代け繝・
      osc(60, 'sine', t, 0.3, 0.1);
      noise(t, 0.06, 0.1);
      // 繝輔ぃ繝ｳ繝輔ぃ繝ｼ繝ｬ・・髻ｳ・・
      bellPartial(523, t + 0.1,  0.5, 0.12);
      bellPartial(659, t + 0.22, 0.6, 0.10);
      bellPartial(784, t + 0.36, 0.7, 0.08);
      bellPartial(1047, t + 0.5, 0.8, 0.06);
      // 豁灘｣ｰ
      noiseHP(t + 0.3, 0.8, 0.05, 2000);
      noiseHP(t + 0.5, 0.5, 0.03, 5000);
    },
    // 螳ｿ蜻ｽ縺ｮ逶ｸ謇・譛邨よｱｺ逹: 螢ｮ螟ｧ迚・
    fate_resolution() {
      const t = ensure().currentTime;
      // 豺ｱ縺・う繝ｳ繝代け繝・
      osc(50, 'sine', t, 0.5, 0.12);
      osc(100, 'sine', t, 0.3, 0.08);
      noise(t, 0.08, 0.12);
      // 螢ｮ螟ｧ繝輔ぃ繝ｳ繝輔ぃ繝ｼ繝ｬ・・髻ｳ・・
      bellPartial(523, t + 0.1,  0.7, 0.14);
      bellPartial(659, t + 0.25, 0.8, 0.12);
      bellPartial(784, t + 0.4,  0.9, 0.10);
      bellPartial(1047, t + 0.55, 1.0, 0.08);
      bellPartial(1319, t + 0.7, 0.8, 0.06);
      // 螟ｧ豁灘｣ｰ
      noiseHP(t + 0.3, 1.2, 0.06, 2000);
      noiseHP(t + 0.6, 0.8, 0.04, 5000);
      // 菴朱浹縺ｮ驥阪∩
      osc(65, 'sine', t + 0.5, 1.0, 0.06);
      oscSweep(200, 400, 'sawtooth', t + 0.8, 0.5, 0.03);
    },
  };

  // 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
  // 笊・ BGM SYSTEM 窶・SFC-style chiptune (v1.0)         笊・
  // 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅
  const NT = { // Note frequencies
    C3:130.81,D3:146.83,Eb3:155.56,E3:164.81,F3:174.61,G3:196.00,A3:220.00,Bb3:233.08,B3:246.94,
    C4:261.63,D4:293.66,Eb4:311.13,E4:329.63,F4:349.23,G4:392.00,Ab4:415.30,A4:440.00,Bb4:466.16,B4:493.88,
    C5:523.25,D5:587.33,Eb5:622.25,E5:659.25,F5:698.46,G5:783.99,A5:880.00,Bb5:932.33,B5:987.77,C6:1046.50,D6:1174.66
  };

  // 笏笏 Helpers: note + drum synthesis 笏笏
  function bgmNote(freq, type, t0, dur, gain) {
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    const atk = Math.min(0.02, dur * 0.1);
    const rel = Math.min(0.05, dur * 0.2);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + atk);
    g.gain.setValueAtTime(gain, t0 + dur - rel);
    g.gain.linearRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(bgmGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
    bgmNodes.push(o);
  }
  function bgmKick(t, gn) {
    const c = ensure();
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    g.gain.setValueAtTime(gn, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g); g.connect(bgmGain); o.start(t); o.stop(t + 0.15); bgmNodes.push(o);
  }
  function bgmSnare(t, gn) {
    const c = ensure();
    const buf = c.createBuffer(1, c.sampleRate * 0.1, c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
    const g = c.createGain(); g.gain.setValueAtTime(gn, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    src.connect(hp); hp.connect(g); g.connect(bgmGain); src.start(t); src.stop(t + 0.1); bgmNodes.push(src);
    const o = c.createOscillator(); const g2 = c.createGain();
    o.type = 'sine'; o.frequency.value = 200;
    g2.gain.setValueAtTime(gn * 0.5, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g2); g2.connect(bgmGain); o.start(t); o.stop(t + 0.06); bgmNodes.push(o);
  }
  function bgmHH(t, gn, open) {
    const c = ensure();
    const dur = open ? 0.08 : 0.03;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = c.createGain(); g.gain.setValueAtTime(gn, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp); hp.connect(g); g.connect(bgmGain); src.start(t); src.stop(t + dur + 0.01); bgmNodes.push(src);
  }

  const BGM = {
    _playing: false,
    _interval: null,
    _current: null, // track name: 'kaimaku','management','battle','season_end'

    // 笏笏 Public API 笏笏
    play(trackName) {
      if (_bgmMuted) return; // BGM muted 窶・skip looping tracks
      // SUNO MP3縺後≠繧区峇縺ｯFileBGM縺ｧ蜀咲函
      const suno = SUNO_BGM[trackName];
      if (suno) {
        // FileBGM._audio 縺梧ｶ医∴縺ｦ縺・◆繧峨悟・逕滉ｸｭ縲阪→隕九↑縺輔★蜀咲函縺礼峩縺・
        if (trackName === BGM._current && BGM._playing && FileBGM._audio) return;
        BGM.stop();
        FileBGM.play(suno.file, { loop: true, volume: suno.vol });
        // FileBGM.play()蜀・Κ縺ｧBGM.stop()縺悟他縺ｰ繧後ｋ縺溘ａ縲∫憾諷九そ繝・ヨ縺ｯ縺昴・蠕後↓陦後≧
        BGM._playing = true;
        BGM._current = trackName;
        return;
      }
      // 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ: 繝√ャ繝励メ繝･繝ｼ繝ｳ
      if (trackName === BGM._current && BGM._playing) return;
      if (FileBGM._audio) FileBGM.stop();
      BGM.stop();
      const c = ensure();
      if (c.state === 'suspended') c.resume();
      bgmNodes = [];
      BGM._playing = true;
      BGM._current = trackName;
      const fn = BGM._tracks[trackName];
      if (bgmGain) bgmGain.gain.value = CHIPTUNE_BGM_MIX[trackName] ?? _bgmVol;
      if (fn) fn();
    },

    playJingle(name) {
      BGM.stop(); // Stop looping BGM, then play jingle (always plays regardless of bgmMuted)
      // 繧ｿ繧､繝医Ν謌ｴ蜀: MP3繝輔ぃ繧､繝ｫ迚医ｒ菴ｿ逕ｨ・・gmMuted辟｡隕悶〒蠢・★蜀咲函・・
      if (name === 'championship') {
        FileBGM.stop();
        const a = new window.Audio('../bgm/fanfare_brass_v1.mp3');
        a.volume = Math.min(1.0, JINGLE_MIX.championship);
        a.addEventListener('error', () => {
          console.warn('[Audio] championship jingle failed to load, falling back to synth');
          if (BGM._current === 'jingle_championship' && BGM._playing) {
            const fn = BGM._jingles[name];
            if (bgmGain) bgmGain.gain.value = JINGLE_MIX[name] ?? _bgmVol;
            if (fn) fn();
          }
        }, { once: true });
        a.play().catch(err => {
          console.warn('[Audio] championship jingle failed to play, falling back to synth', err);
          if (BGM._current === 'jingle_championship' && BGM._playing) {
            const fn = BGM._jingles[name];
            if (bgmGain) bgmGain.gain.value = JINGLE_MIX[name] ?? _bgmVol;
            if (fn) fn();
          }
        });
        FileBGM._audio = a;
        BGM._playing = true;
        BGM._current = 'jingle_' + name;
        return;
      }
      const c = ensure();
      if (c.state === 'suspended') c.resume();
      bgmNodes = [];
      BGM._playing = true;
      BGM._current = 'jingle_' + name;
      const fn = BGM._jingles[name];
      if (bgmGain) bgmGain.gain.value = JINGLE_MIX[name] ?? _bgmVol;
      if (fn) fn();
    },

    stop() {
      const wasSuno = BGM._current && SUNO_BGM[BGM._current];
      BGM._playing = false;
      BGM._current = null;
      if (BGM._interval) { clearInterval(BGM._interval); BGM._interval = null; }
      if (bgmNodes) {
        bgmNodes.forEach(n => { try { n.stop(); } catch(e) {} });
        bgmNodes = [];
      }
      if (wasSuno && FileBGM._audio) FileBGM.stop();
    },

    // 笏笏 Track implementations 笏笏
    _tracks: {
      // 笊絶武笊・BGM 1: 髢句ｹ・(BPM 115, D minor) 窶・髱吶°縺ｪ邱願ｿｫ諢・笊絶武笊・
      kaimaku() {
        const bpm = 115, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.06, bg = 0.04, dg = 0.025;
        function scheduleLoop() {
          if (BGM._current !== 'kaimaku') return;
          const t0 = ensure().currentTime + 0.005;
          // Riff (square) 窶・tense, syncopated
          const riff = [
            [NT.D4,.5],[0,.25],[NT.F4,.25],[NT.A4,.5],[NT.G4,.5],[NT.F4,.5],[0,.5],
            [NT.E4,.5],[NT.D4,.25],[NT.E4,.25],[NT.F4,1],[0,1],
            [NT.G4,.5],[0,.25],[NT.Bb4,.25],[NT.A4,.5],[NT.G4,.5],[NT.F4,.5],[0,.5],
            [NT.E4,.75],[NT.D4,.25],[NT.E4,1.5],[0,.5],
            [NT.D4,.5],[0,.25],[NT.F4,.25],[NT.A4,.75],[NT.Bb4,.25],[NT.A4,.5],[NT.G4,.5],
            [NT.F4,.5],[NT.E4,.5],[NT.D4,1],[0,1],
            [NT.A4,.5],[NT.G4,.5],[NT.F4,.5],[NT.E4,.5],[NT.D4,.5],[NT.E4,.5],[NT.F4,.5],[0,.5],
            [NT.D4,2],[0,2],
          ];
          let p = 0;
          riff.forEach(([f,d]) => { if (f > 0) bgmNote(f,'square',t0+p*beat,d*beat*0.85,mg); p += d; });
          // Low pad (sawtooth)
          const pads = [[NT.D3,4],[NT.D3,4],[NT.G3,2],[NT.A3,2],[NT.A3,4],
            [NT.D3,4],[NT.D3,4],[NT.Bb3,2],[NT.A3,2],[NT.D3,4]];
          p = 0;
          pads.forEach(([f,d]) => { bgmNote(f,'sawtooth',t0+p*beat,d*beat*0.95,bg*0.5); p += d; });
          // Bass (triangle 8ths)
          const roots = [NT.D3,NT.D3,NT.G3,NT.A3,NT.D3,NT.D3,NT.Bb3,NT.D3];
          roots.forEach((root, bi) => {
            const r = root / 2;
            for (let i = 0; i < 8; i++) {
              if (i % 2 === 0 || i % 3 === 0) {
                const f = (i === 0 || i === 4) ? r : r * (i % 3 === 0 ? 1.5 : 1.25);
                bgmNote(f,'triangle',t0+bi*bar+i*beat*0.5,beat*0.45,bg);
              }
            }
          });
          // Hi-hat 16ths + snare
          for (let b = 0; b < 8; b++) {
            for (let i = 0; i < 16; i++) bgmHH(t0+b*bar+i*(beat/4),dg*(i%4===0?0.8:0.4),false);
            bgmSnare(t0+b*bar+beat,dg*0.6); bgmSnare(t0+b*bar+beat*3,dg*0.6);
          }
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'kaimaku') scheduleLoop(); }, bar * 8 * 1000 - 200);
      },

      // 笊絶武笊・BGM 2: 蝗｣菴馴°蝟ｶ (BPM 100, F major) 笊絶武笊・
      management() {
        const bpm = 100, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.055, ag = 0.03, bg = 0.04;
        function scheduleLoop() {
          if (BGM._current !== 'management') return;
          const t0 = ensure().currentTime + 0.005;
          // Melody (triangle)
          const mel = [
            [NT.F4,2],[NT.A4,1],[NT.G4,1], [NT.F4,1.5],[NT.E4,.5],[NT.D4,1],[0,1],
            [NT.C4,1],[NT.D4,1],[NT.F4,1],[NT.A4,1], [NT.G4,2],[NT.F4,1],[0,1],
            [NT.Bb4,1.5],[NT.A4,.5],[NT.G4,1],[NT.F4,1], [NT.E4,1],[NT.F4,1],[NT.G4,1],[0,1],
            [NT.A4,1],[NT.G4,1],[NT.F4,.5],[NT.E4,.5],[NT.D4,1], [NT.C4,1],[NT.D4,.5],[NT.E4,.5],[NT.F4,2],
          ];
          let p = 0;
          mel.forEach(([f,d]) => { if (f > 0) bgmNote(f,'triangle',t0+p*beat,d*beat*0.85,mg); p += d; });
          // Arpeggio (square 16ths)
          const ch = [[NT.F3,NT.A3,NT.C4],[NT.F3,NT.A3,NT.C4],
            [NT.D3,NT.F3,NT.A3],[NT.C3,NT.E3,NT.G3],
            [NT.Bb3,NT.D4,NT.F4],[NT.C4,NT.E4,NT.G4],
            [NT.F3,NT.A3,NT.C4],[NT.F3,NT.A3,NT.C4]];
          ch.forEach((chord, bi) => {
            for (let i = 0; i < 16; i++) bgmNote(chord[i%chord.length],'square',t0+bi*bar+i*(beat/4),beat/4*0.7,ag);
          });
          // Bass (triangle, low octave)
          const bs = [[NT.F3,4],[NT.F3,4],[NT.D3,2],[NT.A3,2],[NT.C3,2],[NT.G3,2],
            [NT.Bb3,4],[NT.C3,4],[NT.F3,2],[NT.E3,2],[NT.F3,4]];
          p = 0;
          bs.forEach(([f,d]) => { bgmNote(f/2,'triangle',t0+p*beat,d*beat*0.9,bg); p += d; });
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'management') scheduleLoop(); }, bar * 8 * 1000 - 200);
      },

      // 笊絶武笊・BGM 3: 豼髣・(BPM 138, A minor) 笊絶武笊・
      battle() {
        const bpm = 138, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.06, hg = 0.03, bg = 0.045, dg = 0.035;
        function scheduleLoop() {
          if (BGM._current !== 'battle') return;
          const t0 = ensure().currentTime + 0.005;
          // Melody (sawtooth 窶・brass)
          const mel = [
            [NT.A4,.5],[NT.C5,.5],[NT.D5,.5],[NT.E5,.5],[NT.E5,1],[NT.D5,1],
            [NT.C5,.5],[NT.D5,.5],[NT.C5,.5],[NT.A4,.5],[NT.A4,1.5],[0,.5],
            [NT.A4,.5],[NT.C5,.5],[NT.E5,.5],[NT.G5,.5],[NT.G5,1],[NT.F5,.5],[NT.E5,.5],
            [NT.D5,.5],[NT.C5,.5],[NT.D5,.5],[NT.E5,.5],[NT.A4,2],
            [NT.F5,1],[NT.E5,.5],[NT.D5,.5],[NT.C5,1],[NT.D5,1],
            [NT.E5,1],[NT.D5,.5],[NT.C5,.5],[NT.B4,1.5],[0,.5],
            [NT.C5,.5],[NT.D5,.5],[NT.E5,.5],[NT.F5,.5],[NT.G5,1.5],[NT.F5,.5],
            [NT.E5,.5],[NT.D5,.5],[NT.C5,.5],[NT.B4,.5],[NT.A4,2],
          ];
          let p = 0;
          mel.forEach(([f,d]) => { if (f > 0) bgmNote(f,'sawtooth',t0+p*beat,d*beat*0.88,mg); p += d; });
          // Harmony (square)
          const hrm = [
            [NT.A3,2],[NT.C4,2],[NT.D4,2],[NT.E4,2],
            [NT.A3,2],[NT.C4,2],[NT.E4,2],[NT.A3,2],
            [NT.F4,2],[NT.E4,2],[NT.D4,2],[NT.E4,2],
            [NT.C4,2],[NT.D4,2],[NT.E4,2],[NT.A3,2],
          ];
          p = 0;
          hrm.forEach(([f,d]) => { bgmNote(f,'square',t0+p*beat,d*beat*0.85,hg); p += d; });
          // Bass (triangle 8ths)
          const br = [NT.A3,NT.C3,NT.D3,NT.E3,NT.F3,NT.E3,NT.D3,NT.A3];
          br.forEach((root, bi) => {
            const r = root / 2;
            for (let i = 0; i < 8; i++) bgmNote(i%2===0?r:r*1.5,'triangle',t0+bi*bar+i*beat*0.5,beat*0.45,bg);
          });
          // Drums
          for (let b = 0; b < 8; b++) {
            const bt = t0 + b * bar;
            bgmKick(bt,dg); bgmKick(bt+beat*2,dg);
            if (b%2===1) bgmKick(bt+beat*3.5,dg*0.7);
            bgmSnare(bt+beat,dg); bgmSnare(bt+beat*3,dg);
            for (let i = 0; i < 8; i++) bgmHH(bt+i*beat*0.5,dg*(i%2===0?0.5:0.3),i===7);
          }
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'battle') scheduleLoop(); }, bar * 8 * 1000 - 200);
      },

      // 笊絶武笊・BGM 5: 遽逶ｮ (BPM 80, Em 竊・G) 笊絶武笊・
      season_end() {
        const bpm = 80, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.055, ag = 0.025, bg = 0.035;
        function scheduleLoop() {
          if (BGM._current !== 'season_end') return;
          const t0 = ensure().currentTime + 0.005;
          // Melody (triangle)
          const mel = [
            [NT.E4,2],[NT.G4,1],[NT.A4,1], [NT.B4,2],[NT.A4,1],[NT.G4,1],
            [NT.C5,1.5],[NT.B4,.5],[NT.A4,1],[NT.G4,1], [NT.A4,1],[NT.B4,1],[NT.G4,2],
            [NT.E4,1],[NT.G4,1],[NT.B4,1],[NT.D5,1], [NT.C5,2],[NT.B4,1],[NT.A4,1],
            [NT.G4,1],[NT.A4,1],[NT.B4,1.5],[NT.D5,.5], [NT.G5,3],[0,1],
          ];
          let p = 0;
          mel.forEach(([f,d]) => { if (f > 0) bgmNote(f,'triangle',t0+p*beat,d*beat*0.9,mg); p += d; });
          // Arpeggio (square triplets)
          const ch = [[NT.E3,NT.G3,NT.B3],[NT.E3,NT.G3,NT.B3],
            [NT.C3,NT.E3,NT.G3],[NT.D3,NT.F3,NT.A3],
            [NT.E3,NT.G3,NT.B3],[NT.A3,NT.C4,NT.E4],
            [NT.G3,NT.B3,NT.D4],[NT.G3,NT.B3,NT.D4]];
          ch.forEach((chord, bi) => {
            const tb = beat / 3;
            for (let i = 0; i < 12; i++) bgmNote(chord[i%chord.length],'square',t0+bi*bar+i*tb,tb*0.75,ag);
          });
          // Bass (triangle sustained)
          const bs = [[NT.E3,8],[NT.C3,4],[NT.D3,4],[NT.E3,4],[NT.A3,4],[NT.G3,8]];
          p = 0;
          bs.forEach(([f,d]) => { bgmNote(f/2,'triangle',t0+p*beat,d*beat*0.95,bg); p += d; });
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'season_end') scheduleLoop(); }, bar * 8 * 1000 - 200);
      },

      // 笊絶武笊・BGM 6: 邱雁ｼｵ (BPM 72, Dm 窶・荳咲ｩ上↑蟇ｾ謚玲姶繝√Ε繝ｬ繝ｳ繧ｸ) 笊絶武笊・
      tension() {
        const bpm = 72, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.045, bg = 0.035, dg = 0.02;
        function scheduleLoop() {
          if (BGM._current !== 'tension') return;
          const t0 = ensure().currentTime + 0.005;
          // Low drone: sustained dissonant bass
          bgmNote(NT.D3/2,'triangle',t0,bar*8*0.95,bg*1.2);
          bgmNote(NT.Eb3/2,'triangle',t0+0.05,bar*8*0.95,bg*0.4); // dissonance
          // Melody (square 窶・sparse, threatening)
          const mel = [
            [0,4],[NT.D4,1],[NT.F4,.5],[NT.E4,.5],[0,2],
            [NT.A4,1.5],[NT.G4,.5],[NT.F4,1],[NT.E4,1],
            [0,2],[NT.D4,.5],[NT.F4,.5],[NT.A4,1],
            [NT.Bb4,2],[NT.A4,1],[0,1],
            [NT.G4,1],[NT.F4,.5],[NT.E4,.5],[NT.D4,2],[0,4],
            [NT.F4,1],[NT.E4,.5],[NT.D4,.5],[0,2],
            [NT.A3,1.5],[NT.D4,.5],[NT.E4,1],[NT.F4,1],
            [0,2],[NT.E4,1],[NT.D4,3],
          ];
          let p = 0;
          mel.forEach(([f,d]) => { if (f > 0) bgmNote(f,'square',t0+p*beat,d*beat*0.8,mg*0.7); p += d; });
          // Heartbeat-like kick (sparse)
          for (let b = 0; b < 8; b++) {
            const bt = t0 + b * bar;
            bgmKick(bt, dg * 1.2);
            bgmKick(bt + beat * 0.35, dg * 0.6);
            if (b % 2 === 1) bgmHH(bt + beat * 2, dg * 0.4, false);
          }
          // Stinger accents
          bgmNote(NT.A4,'sawtooth',t0+bar*2,beat*0.3,mg*0.5);
          bgmNote(NT.D5,'sawtooth',t0+bar*5,beat*0.3,mg*0.5);
        }
        scheduleLoop();
        BGM._interval = setInterval(() => { if (BGM._current === 'tension') scheduleLoop(); }, bar * 8 * 1000 - 200);
      }
    },

    // 笏笏 Jingle implementations 笏笏
    _jingles: {
      victory() {
        const t0 = ensure().currentTime + 0.005;
        const g = 0.06;
        // Build-up: ascending triplet run
        [NT.G4, NT.B4, NT.D5, NT.G5].forEach((f, i) => {
          bgmNote(f, 'square', t0 + i * 0.12, 0.15, g * 0.8);
          bgmSnare(t0 + i * 0.12, 0.02);
        });
        // Main fanfare chord hit
        const t1 = t0 + 0.55;
        bgmNote(NT.G5,'square',t1,0.6,g); bgmNote(NT.D5,'square',t1,0.6,g*0.8);
        bgmNote(NT.B4,'triangle',t1,0.7,g*0.6); bgmNote(NT.G3,'triangle',t1,0.8,g*0.7);
        bgmKick(t1, 0.035);
        // Second phrase: stepping up
        const t2 = t1 + 0.7;
        bgmNote(NT.A5,'square',t2,0.25,g*0.9); bgmNote(NT.B5,'square',t2+0.25,0.25,g*0.9);
        bgmSnare(t2, 0.02); bgmSnare(t2 + 0.25, 0.02);
        // Final sustained chord
        const t3 = t2 + 0.55;
        bgmNote(NT.D6,'square',t3,0.8,g); bgmNote(NT.B5,'square',t3,0.8,g*0.7);
        bgmNote(NT.G5,'triangle',t3,1.0,g*0.6); bgmNote(NT.D5,'triangle',t3,1.0,g*0.5);
        bgmNote(NT.G3,'triangle',t3,1.2,g*0.7);
        bgmKick(t3, 0.04);
        // Sparkle tail
        bgmNote(NT.D6,'square',t3+0.9,0.4,g*0.4); bgmNote(NT.G5,'square',t3+1.0,0.5,g*0.3);
      },
      championship() {
        const t0 = ensure().currentTime + 0.005;
        const g = 0.06;
        [[NT.C4,'sawtooth',0,0.3],[NT.E4,'sawtooth',0.25,0.3],[NT.G4,'sawtooth',0.5,0.3],
         [NT.C5,'sawtooth',0.8,0.6],[NT.E5,'sawtooth',1.4,0.3],[NT.G5,'sawtooth',1.7,0.8],
         [NT.C5,'square',2.5,1.0],[NT.E5,'square',2.5,1.0],[NT.G5,'square',2.5,1.0],
         [NT.C6,'sawtooth',2.5,1.2],[NT.C3,'triangle',0.8,1.5],[NT.C3,'triangle',2.5,1.2],[NT.G3,'triangle',2.5,1.2],
        ].forEach(([f,ty,off,dur]) => {
          const gn = ty==='sawtooth'?g:ty==='triangle'?g*0.8:g*0.6;
          bgmNote(f,ty,t0+off,dur,gn);
        });
        bgmKick(t0+0.8,0.03); bgmSnare(t0+1.4,0.025); bgmKick(t0+2.5,0.035); bgmSnare(t0+2.5,0.025);
      }
    },

    // 笏笏 Smart BGM selector based on game state 笏笏
    playForState() {
      if (!G) return;
      if (G.weekPhase === 'draft' || G.weekPhase === 'opening') { BGM.play('kaimaku'); return; }
      if ((G.offSeason && G.offWeek >= 2) || G.weekPhase === 'offseason') { BGM.play('season_end'); return; }
      if (G.weekPhase === 'showExec') { BGM.play('battle'); return; }
      if (G.weekPhase === 'event') {
        if (G.pendingEvent && G.pendingEvent.type === 'war') {
          const warSrc = '../bgm/MusMus-BGM-125.mp3';
          if (FileBGM._audio && FileBGM._audio.src && FileBGM._audio.src.indexOf('MusMus-BGM-125') >= 0) return;
          FileBGM.play(warSrc, { loop: true, volume: 0.10 });
          return;
        }
        BGM.play('tension'); return;
      }
      // draft-negotiation-spec ﾂｧ8.1: 繝峨Λ繝輔ヨ騾溷ｱ+莠､貂画凾縺ｯtension
      if (G.weekPhase === 'scoutEvent' && (G._draftInterests || G._draftNegotiation)) { BGM.play('tension'); return; }
      BGM.play('management'); // management + showPrep + draft newspaper all use this
    }
  };

  // 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
  // 笊・ FileBGM: HTMLAudioElement 繝吶・繧ｹ縺ｮ繝輔ぃ繧､繝ｫBGM   笊・
  // 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅
  const FileBGM = {
    _audio: null,
    _fadeTimer: null,
    _mix: 1,
    _vol: null, // 譏守､ｺ逧ёolume菫晄戟・・pdateVolume縺ｧ菴ｿ逕ｨ・・
    _resolveVolume(volume = null, mix = 1) {
      if (volume !== null) return Math.min(1.0, _bgmMasterVol * volume);
      return Math.min(1.0, _bgmMasterVol * _bgmVol * 8 * mix);
    },
    play(src, { loop = false, volume = null, mix = 1 } = {}) {
      if (_bgmMuted) return;
      FileBGM.stop();
      BGM.stop();
      const a = new window.Audio(src);
      a.loop = loop;
      FileBGM._mix = mix;
      FileBGM._vol = volume;
      a.volume = FileBGM._resolveVolume(volume, mix);
      a.play().catch(() => {});
      FileBGM._audio = a;
    },
    stop() {
      if (FileBGM._fadeTimer) { clearInterval(FileBGM._fadeTimer); FileBGM._fadeTimer = null; }
      if (FileBGM._audio) { FileBGM._audio.pause(); FileBGM._audio.currentTime = 0; FileBGM._audio = null; }
      FileBGM._mix = 1;
      FileBGM._vol = null;
    },
    fadeOut(durationMs = 2000) {
      if (!FileBGM._audio) return Promise.resolve();
      return new Promise(resolve => {
        const a = FileBGM._audio;
        const startVol = a.volume;
        const steps = 20;
        const interval = durationMs / steps;
        let step = 0;
        FileBGM._fadeTimer = setInterval(() => {
          step++;
          a.volume = Math.max(0, startVol * (1 - step / steps));
          if (step >= steps) {
            clearInterval(FileBGM._fadeTimer);
            FileBGM._fadeTimer = null;
            FileBGM.stop();
            resolve();
          }
        }, interval);
      });
    },
    updateVolume() {
      if (FileBGM._audio) FileBGM._audio.volume = FileBGM._resolveVolume(FileBGM._vol, FileBGM._mix);
    }
  };

  // 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
  // 笊・ PUBLIC API                                      笊・
  // 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅
  return {
    play(name) { if (!_muted && SFX[name]) { try { ensure(); if (SE_MIX[name] !== undefined) sfxGain.gain.value = SE_MIX[name]; SFX[name](); } catch(e) {} } },
    bgm: BGM,
    fileBgm: FileBGM,
    get muted() { return _muted; },
    toggleMute() {
      ensure();
      _muted = !_muted;
      masterGain.gain.value = _muted ? 0 : 1;
      if (_muted) BGM.stop(); else BGM.playForState();
      savePrefs();
    },
    setSfxVol(v) { _sfxVol = v; if (sfxGain) sfxGain.gain.value = v; savePrefs(); },
    setBgmVol(v) { _bgmVol = v; if (bgmGain) bgmGain.gain.value = v; FileBGM.updateVolume(); savePrefs(); },
    get sfxVol() { return _sfxVol; },
    get bgmVol() { return _bgmVol; },
    // BGM/SE 繝槭せ繧ｿ繝ｼ髻ｳ驥・
    setBgmMasterVol(v) { _bgmMasterVol = v; if (bgmMasterGain) bgmMasterGain.gain.value = v; FileBGM.updateVolume(); savePrefs(); },
    setSfxMasterVol(v) { _sfxMasterVol = v; if (sfxMasterGain) sfxMasterGain.gain.value = v; savePrefs(); },
    get bgmMasterVol() { return _bgmMasterVol; },
    get sfxMasterVol() { return _sfxMasterVol; },
    // BGM-only mute (looping tracks off, jingles/SFX still play)
    get bgmMuted() { return _bgmMuted; },
    toggleBgmMute() {
      _bgmMuted = !_bgmMuted;
      if (_bgmMuted) { BGM.stop(); FileBGM.stop(); } else BGM.playForState();
      savePrefs();
    },
    // 笏笏 豢ｾ髢･繧､繝吶Φ繝域ｼ泌・逕ｨ: 繝ｯ繝ｳ繧ｷ繝ｧ繝・ヨ stinger・・GM 縺ｫ隗ｦ繧後↑縺・ｼ・笏笏
    // SE 繝槭せ繧ｿ繝ｼ繝懊Μ繝･繝ｼ繝驕ｩ逕ｨ縲∝・菴・mute 譎ゅ・辟｡髻ｳ
    stinger(src, volume = 0.15) {
      try {
        if (_muted) return;
        const a = new window.Audio(src);
        a.volume = Math.min(1.0, volume * _sfxMasterVol);
        a.play().catch(() => {});
      } catch(e) {}
    },
  };
})();

// 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
// 笊・ FACTION EVENT AUDIO MAP (v6 ﾂｧ2-1)                       笊・
// 笊・ handoff-v6 縺ｮ BGM/stinger 逋ｻ骭ｲ陦ｨ繧偵ョ繝ｼ繧ｿ蛹・             笊・
// 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅
const FACTION_AUDIO = {
  SOFT:    '../bgm/Soft Bids, Sharp Minds.mp3',
  TENSION: '../bgm/bgm_tension_v1.mp3',
  GONG:    '../bgm/f07_gong_v1.mp3',
  CHIME:   '../bgm/f06_fin_chime_v1.mp3',
};
// 蜷・う繝吶Φ繝医・ { src, volume, openStinger?, closeStinger? }
// closeStinger 縺ｯ邨先棡繝｢繝ｼ繝繝ｫ縺ｮ縲碁哩縺倥ｋ縲阪け繝ｪ繝・け譎ゅ↓ fadeOut 逶ｴ蜑阪〒蜀咲函
const FACTION_AUDIO_MAP = {
  F01:            { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
  F02:            { src: FACTION_AUDIO.TENSION, volume: 0.17 },
  F02_IGNITE:     { src: FACTION_AUDIO.TENSION, volume: 0.18, openStinger:  { src: FACTION_AUDIO.GONG,  volume: 0.15 } },
  F02_PEACE:      { src: FACTION_AUDIO.SOFT,    volume: 0.12,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.10 } },
  F02_RESOLUTION: { src: FACTION_AUDIO.TENSION, volume: 0.17 },
  F02_ENDLESS:    { src: FACTION_AUDIO.TENSION, volume: 0.10 },
  F03:            { src: FACTION_AUDIO.SOFT,    volume: 0.10,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.09 } },
  F04:            { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
  F05H:           { src: FACTION_AUDIO.SOFT,    volume: 0.10,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.09 } },
  // ﾂｧ2-3 v7 遒ｺ螳夲ｼ・action-events.md ﾂｧ髻ｳ髻ｿ險ｭ險・陦ｨ諡｡蠑ｵ縺ｫ貅匁侠・・
  F05:            { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
  F06:            { src: FACTION_AUDIO.SOFT,    volume: 0.16,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.10 } },
  F07:            { src: FACTION_AUDIO.TENSION, volume: 0.15 },
  F08:            { src: FACTION_AUDIO.TENSION, volume: 0.17, openStinger:  { src: FACTION_AUDIO.GONG,  volume: 0.15 } },
  COMMON_1:       { src: FACTION_AUDIO.TENSION, volume: 0.14 },
  COMMON_4:       { src: FACTION_AUDIO.SOFT,    volume: 0.12,                                           closeStinger: { src: FACTION_AUDIO.CHIME, volume: 0.09 } },
  COMMON_5:       { src: FACTION_AUDIO.SOFT,    volume: 0.13 },
  COMMON_7:       { src: FACTION_AUDIO.SOFT,    volume: 0.14 },
};

// 豢ｾ髢･繧､繝吶Φ繝医Δ繝ｼ繝繝ｫ髢句ｹ墓凾: BGM 蛻・崛 + openStinger
// 譌｢蟄・BGM (management/tension chiptune 遲・ 縺ｯ FileBGM.play 縺悟・驛ｨ縺ｧ豁｢繧√ｋ
function _factionAudioOpen(eventId) {
  const cfg = FACTION_AUDIO_MAP[eventId];
  if (!cfg) return;
  try { Audio.fileBgm.play(cfg.src, { loop: true, volume: cfg.volume }); } catch(e) {}
  if (cfg.openStinger) {
    // BGM 縺檎ｫ九■荳翫′繧区ｰ鈴・繧定ｦ九○縺ｦ縺九ｉ1逋ｺ魑ｴ繧峨☆・・adeOut 縺ｨ驥阪↑繧峨↑縺・ｈ縺・↓ 150ms 驕・ｻｶ・・
    setTimeout(() => { try { Audio.stinger(cfg.openStinger.src, cfg.openStinger.volume); } catch(e) {} }, 150);
  }
}

// 豢ｾ髢･繧､繝吶Φ繝育ｵ先棡繝｢繝ｼ繝繝ｫ縲碁哩縺倥ｋ縲阪け繝ｪ繝・け譎・
// closeStinger 竊・BGM fadeOut 竊・playForState 縺ｧ騾壼ｸｸ BGM 繧貞ｾｩ蟶ｰ
function _factionAudioClose(eventId) {
  const cfg = FACTION_AUDIO_MAP[eventId];
  if (cfg && cfg.closeStinger) {
    try { Audio.stinger(cfg.closeStinger.src, cfg.closeStinger.volume); } catch(e) {}
  }
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  setTimeout(() => { try { Audio.bgm.playForState(); } catch(e) {} }, 1600);
}


// 笏笏 D螻､繧ｻ繝ｬ繝｢繝九・繧､繝吶Φ繝・BGM蛻ｶ蠕｡ 笏笏
function _ceremAudioOpen(visualVariant) {
  const src = visualVariant === 'arrival'
    ? '../bgm/bgm_kaimaku_v1.mp3'
    : '../bgm/8bit-ending-theme_Loop.ogg';
  try { Audio.fileBgm.play(src, { loop: true, volume: 0.10 }); } catch(e) {}
}
function _ceremAudioClose() {
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  setTimeout(() => { try { Audio.bgm.playForState(); } catch(e) {} }, 1600);
}

// D螻､繧ｻ繝ｬ繝｢繝九・繧､繝吶Φ繝域悽菴・
// evt: MILESTONE_EVENTS繧ｨ繝ｳ繝医Μ・・ialogueKey/narration/narrationGaps/visualVariant/continueLabel・・
// speakers: [{fighter, roleLabel}, ...] (_resolveSpotlightFighters 縺ｮ謌ｻ繧雁､)
// onContinue: 邯壹￠繧九・繧ｿ繝ｳ繧ｯ繝ｪ繝・け譎ゅ・繧ｳ繝ｼ繝ｫ繝舌ャ繧ｯ
function showCeremonyEvent(evt, speakers, onContinue) {
  // 繧ｿ繧､繝医Ν繧ｵ繝門虚逧・函謌・
  let titleSub = evt.titleSub;
  if (evt.visualVariant === 'arrival') {
    titleSub = evt.titleSub + ' 繝ｻ WEEK ' + G.week;
  } else if (evt.visualVariant === 'triumph') {
    const att = (G.lastShowAttendance || 0).toLocaleString();
    titleSub = evt.titleSub + ' 繝ｻ ' + att + ' ATTENDED';
  }

  const overlay = document.createElement('div');
  overlay.className = 'cerem-overlay ' + (evt.visualVariant || '');
  overlay.style.zIndex = '920';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';

  const narrationGaps = evt.narrationGaps || [];

  // Phase 1 HTML
  const narLines = (evt.narration || []).map((line, i) => {
    const gapClass = narrationGaps.includes(i) ? ' gap' : '';
    return `<span class="cerem-nar-line${gapClass}" data-nar-idx="${i}">${line}</span>`;
  }).join('');

  // Phase 2: speakers
  const speakerHtml = speakers.map(({ fighter, roleLabel }) => {
    const line = App.resolveDomeLine(fighter, evt.dialogueKey);
    const portraitSrc = getUpperUrl(fighter.id);
    const isTriumph = evt.visualVariant === 'triumph' ? ' triumph-glow' : '';
    return `
      <div class="cerem-speaker">
        <div class="cerem-bubble-wrap">
          <div class="cerem-bubble">${line}</div>
        </div>
        <div class="cerem-portrait${isTriumph}">
          <img src="${portraitSrc}" alt="${fighter.name}"
            style="width:100%;height:100%;object-fit:cover;object-position:top"
            onerror="this.style.display='none'">
        </div>
        <div class="cerem-role-label">${roleLabel}</div>
        <div class="cerem-speaker-name">${fighter.name}</div>
      </div>`;
  }).join('');

  overlay.innerHTML = `
    <!-- Phase 1: Narration -->
    <div class="cerem-phase active" data-phase="1">
      <div class="cerem-phase-zone top">
        <div class="cerem-title-band">
          <div class="cerem-title-main ${evt.visualVariant || ''}">${evt.titleMain}</div>
          <div class="cerem-title-divider"></div>
          <div class="cerem-title-sub">${titleSub}</div>
        </div>
      </div>
      <div class="cerem-phase-zone mid">
        <div class="cerem-narration">${narLines}</div>
      </div>
      <div class="cerem-phase-zone bottom"></div>
    </div>
    <!-- Phase 2: Characters -->
    <div class="cerem-phase" data-phase="2">
      <div class="cerem-phase-zone top"></div>
      <div class="cerem-phase-zone mid">
        <div class="cerem-trio">${speakerHtml}</div>
      </div>
      <div class="cerem-phase-zone bottom">
        <button class="cerem-continue-btn">${evt.continueLabel || '邯壹￠繧・}</button>
      </div>
    </div>
    <div class="cerem-hint">笆ｼ 繧ｯ繝ｪ繝・け縺ｧ騾ｲ繧</div>
    <button class="cerem-skip" data-cerem-skip>笆ｷ SKIP</button>
  `;

  document.body.appendChild(overlay);
  _ceremAudioOpen(evt.visualVariant);

  // SceneController 繝ｭ繧ｸ繝・け
  const phase1El = overlay.querySelector('[data-phase="1"]');
  const phase2El = overlay.querySelector('[data-phase="2"]');
  const narEls = Array.from(overlay.querySelectorAll('.cerem-nar-line'));
  const speakerEls = Array.from(overlay.querySelectorAll('.cerem-speaker'));
  const continueBtn = overlay.querySelector('.cerem-continue-btn');
  const hint = overlay.querySelector('.cerem-hint');
  let phase = 1;
  let step = 0;
  let transitioning = false;

  function closeCeremony() {
    overlay.remove();
    _ceremAudioClose();
    onContinue();
  }

  function skipAll() {
    if (transitioning) return;
    narEls.forEach(el => el.classList.add('shown'));
    phase1El.classList.remove('active');
    setTimeout(() => {
      phase = 2; step = speakerEls.length;
      phase2El.classList.add('active');
      speakerEls.forEach(el => el.classList.add('shown'));
      hint.classList.add('hidden');
      setTimeout(() => continueBtn.classList.add('shown'), 400);
    }, 500);
  }

  function toPhase2() {
    transitioning = true;
    hint.classList.add('hidden');
    phase1El.classList.remove('active');
    setTimeout(() => {
      phase = 2; step = 0;
      phase2El.classList.add('active');
      setTimeout(() => {
        hint.classList.remove('hidden');
        transitioning = false;
      }, 1000);
    }, 1100);
  }

  function advance() {
    if (transitioning) return;
    if (phase === 1) {
      if (step < narEls.length) {
        narEls[step].classList.add('shown');
        step++;
      } else {
        toPhase2();
      }
    } else {
      if (step < speakerEls.length) {
        speakerEls[step].classList.add('shown');
        step++;
        if (step >= speakerEls.length) {
          hint.classList.add('hidden');
          setTimeout(() => continueBtn.classList.add('shown'), 800);
        }
      }
    }
  }

  overlay.addEventListener('click', (e) => {
    if (e.target.closest('.cerem-continue-btn')) { closeCeremony(); return; }
    if (e.target.closest('[data-cerem-skip]')) { skipAll(); return; }
    advance();
  });
}

function hasPlayerHistoricRank1(state) {
  if (!state) return false;
  if ((state.rankings || [])[0]?.orgId === 'player') return true;
  if (state.endingCleared) return true;
  if ((state.endingClearedSeason || 0) > 0) return true;
  return (state.seasonHistory || []).some(season => (season?.rank || 99) === 1);
}

// 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
// 笊・ SECTION 6c: SURVIVAL GAUGE (v0.97)                        笊・
// 笊・ Startup deficit tracker 窶・pure functions, no DOM          笊・
// 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅

const SURVIVAL_MILESTONES = [
  { id:'first_show_rev',  icon:'闊・, label:'蛻晁・陦悟庶蜈･', desc:'闊郁｡後〒繝√こ繝・ヨ繝ｻ繧ｰ繝・ぜ蜿主・繧貞ｾ励◆',
    check: G => (G.seasonStats?.totalRevenue || 0) > 0 || G.seasonHistory?.some(s => s.totalRevenue > 0) },
  { id:'sponsor_unlock',  icon:'驥・, label:'繧ｹ繝昴Φ繧ｵ繝ｼ迯ｲ蠕・, desc:'莠ｺ豌・0蛻ｰ驕斐〒繧ｹ繝昴Φ繧ｵ繝ｼ蜿主・縺檎匱逕・,
    check: G => G.orgPop >= 20 },
  { id:'first_profit_wk', icon:'笆ｲ', label:'蛻昴・譛域ｬ｡鮟貞ｭ・, desc:'逶ｴ霑・騾ｱ縺ｮ蜷郁ｨ亥庶謾ｯ縺後・繝ｩ繧ｹ縺ｫ縺ｪ縺｣縺・,
    check: G => {
      const buf = G.recentWeeklyNet || [0,0,0,0];
      return buf.reduce((a,b) => a+b, 0) >= 0 && (G.weeklyFinance != null);
    }},
  { id:'profit_streak3',  icon:'笳・, label:'2繝ｶ譛磯｣邯壽怦谺｡鮟貞ｭ・, desc:'螳牙ｮ夂ｵ悟霧縺瑚ｦ九∴縺ｦ縺阪◆',
    check: G => (G.rollingNet4Count || 0) >= 2 },
  { id:'graduation',      icon:'譚ｯ', label:'邨悟霧螳牙ｮ壼喧', desc:'譛域ｬ｡鮟貞ｭ怜ｮ夂捩・玖ｳ・≡遒ｺ菫晢ｼ√し繝舌う繝舌Ν繧ｯ繝ｪ繧｢',
    check: G => G.survivalCleared === true },
];

const SURVIVAL_PHASES = [
  { id:'red',    label:'襍､蟄怜慍迯・,   color:'#e74c3c', emoji:'笳・, cssClass:'phase-red' },
  { id:'orange', label:'襍､蟄礼ｸｮ蟆・,   color:'#e67e22', emoji:'笳・, cssClass:'phase-orange' },
  { id:'yellow', label:'謳咲寢蛻・ｲ千せ', color:'#f1c40f', emoji:'笳・, cssClass:'phase-yellow' },
  { id:'green',  label:'鮟貞ｭ苓ｻ｢謠・,   color:'#2ecc71', emoji:'笳・, cssClass:'phase-green' },
];

const Survival = {
  // Calculate estimated weekly net income (expenses - income, without show revenue)
  estimateWeeklyNet(G) {
    const salary = Engine.economy.calcWeeklySalary(G.roster, G.titles);
    const fixed = Engine.economy.calcFixedCosts();
    const coachSalary = Engine.coach.getSalaryTotal(G);
    const totalExpense = salary + fixed + coachSalary;

    const weeklyGoods = Engine.economy.calcWeeklyGoodsRev(G.roster);
    const weeklyMedia = Engine.economy.calcWeeklyMediaRev(G.orgPop);
    const subsidy = G.difficultyMode === 'hard' ? 0 : Engine.economy.getSubsidy(G.orgPop);
    const totalBaseIncome = weeklyGoods + weeklyMedia + subsidy;

    // Estimate average show income per week (shows happen ~every 4 weeks)
    // Use last show's revenue if available, or estimate from orgPop
    let avgShowIncomePerWeek = 0;
    if (G.lastShowResults && G.lastShowResults.length > 0 && G.weeklyFinance) {
      const showIncome = G.weeklyFinance.details
        .filter(d => d.type === 'income' && (d.label.includes('繝√こ繝・ヨ') || d.label.includes('繧ｰ繝・ぜ')))
        .reduce((s, d) => s + d.val, 0);
      const showCost = G.weeklyFinance.details
        .filter(d => d.type === 'expense' && d.label.includes('莨壼ｴ'))
        .reduce((s, d) => s + Math.abs(d.val), 0);
      avgShowIncomePerWeek = Math.round((showIncome - showCost) / 4); // amortized over 4 weeks
    }

    const weeklyNet = (totalBaseIncome + avgShowIncomePerWeek) - totalExpense;
    return { weeklyNet, totalExpense, totalBaseIncome, avgShowIncomePerWeek };
  },

  // Determine current survival phase
  getPhase(G) {
    if (G.survivalCleared) return null; // graduated
    const { weeklyNet } = Survival.estimateWeeklyNet(G);
    if (weeklyNet >= 20) return SURVIVAL_PHASES[3]; // green: solid profit
    if (weeklyNet >= -5) return SURVIVAL_PHASES[2]; // yellow: breakeven
    if (weeklyNet >= -50) return SURVIVAL_PHASES[1]; // orange: improving
    return SURVIVAL_PHASES[0]; // red: deep deficit
  },

  // Estimate weeks until funds reach -1000 (bankruptcy)
  weeksUntilBankrupt(G) {
    const { weeklyNet } = Survival.estimateWeeklyNet(G);
    if (weeklyNet >= 0) return Infinity;
    const runway = G.funds + 1000; // bankrupt at -1000
    return Math.max(0, Math.ceil(runway / Math.abs(weeklyNet)));
  },

  // Calculate fuel gauge percentage (5000 start to -1000 bankrupt = 6000 range)
  fuelPct(G) {
    const runway = G.funds + 1000; // 0 at bankruptcy, 6000 at full
    return Math.max(0, Math.min(100, Math.round((runway / 6000) * 100)));
  },

  // Evaluate milestones
  getMilestones(G) {
    const cleared = new Set(G.survivalMilestones || []);
    return SURVIVAL_MILESTONES.map(m => ({
      ...m,
      done: cleared.has(m.id) || m.check(G),
    }));
  },

  // Update survival state 窶・called each week. Returns updated state + events.
  updateSurvival(G) {
    if (G.survivalCleared) return { state: G, events: [], graduated: false };

    let s = { ...G };
    const events = [];

    // Update milestones
    const oldMilestones = new Set(s.survivalMilestones || []);
    const newMilestones = [...oldMilestones];
    SURVIVAL_MILESTONES.forEach(m => {
      if (!oldMilestones.has(m.id) && m.check(s)) {
        newMilestones.push(m.id);
      }
    });
    s = { ...s, survivalMilestones: newMilestones };

    // Track rolling 4-week net (ring buffer)
    const wf = s.weeklyFinance;
    if (wf && wf.net !== undefined) {
      const buf = [...(s.recentWeeklyNet || [0,0,0,0])];
      buf.push(wf.net);
      if (buf.length > 4) buf.shift();
      s = { ...s, recentWeeklyNet: buf };

      // Every 4 weeks, check if rolling sum >= 0 竊・count as "譛域ｬ｡鮟貞ｭ・
      if (s.week >= 4 && s.week % 4 === 0) {
        const rollingSum = buf.reduce((a,b) => a+b, 0);
        if (rollingSum >= 0) {
          s = { ...s, rollingNet4Count: (s.rollingNet4Count || 0) + 1 };
        }
      }
    }

    // Check graduation: monthly profit achieved 2+ times AND funds >= 3000
    const graduated = (s.rollingNet4Count || 0) >= 2 && s.funds >= 3000;
    if (graduated && !s.survivalCleared) {
      s = { ...s, survivalCleared: true, survivalClearWeek: s.week, survivalClearSeason: s.season };
      events.push('至 邨悟霧螳牙ｮ壼喧驕疲・・・繧ｵ繝舌う繝舌Ν繝√Ε繝ｬ繝ｳ繧ｸ繧ｯ繝ｪ繧｢・・);
    }

    return { state: s, events, graduated };
  }
};

// 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
// 笊・ SECTION 7: STORAGE (v0.85)                               笊・
// 笊・ Save/Load with v0.8 backward compatibility               笊・
// 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅

const SAVE_KEY = 'wrestle_manager_save_';
const SAVE_SLOTS = 3;
const AUTOSAVE_KEY = 'wrestle_manager_autosave';
const SAVE_COMPRESS_MARKER = 'WM_LZ|';

// 笏笏笏 繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ 繝医Μ繝溘Φ繧ｰ螳壽焚 笏笏笏
const SAVE_TRIM = {
  gameLogMax: 200,       // gameLog荳企剞
  growthLogMax: 100,     // 繧ｭ繝｣繝ｩ豈使rowthLog荳企剞
  financeKeepSeasons: 2, // financeHistory菫晄戟繧ｷ繝ｼ繧ｺ繝ｳ謨ｰ
  matchupLogMax: 60,     // matchupLog荳企剞・・2show遯・+ 菴呵｣包ｼ・
  aiMatchupLogMax: 40,   // AI蝗｣菴杜atchupLog荳企剞
  h2hHistoryMax: 50,     // h2h.history[] 繝壹い豈惹ｸ企剞
};

const Storage = {
  // 笏笏笏 繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ蝨ｧ邵ｮ: 繝医Μ繝溘Φ繧ｰ + LZ-UTF16 笏笏笏
  serialize(G) {
    const state = JSON.parse(JSON.stringify(G));
    state.roster.forEach(c => {
      delete c._weekAction; c.intensive = false;
      // growthLog 繝医Μ繝溘Φ繧ｰ
      if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
        c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
      }
    });
    // P4-P6: transient Glimpse 繝輔ぅ繝ｼ繝ｫ繝蛾勁螟・
    delete state._pendingGlimpseA;
    delete state._pendingGlimpseB;
    delete state._pendingHotStreakEnds;
    delete state._pendingMilestone;
    // gameLog 繝医Μ繝溘Φ繧ｰ
    if (state.gameLog && state.gameLog.length > SAVE_TRIM.gameLogMax) {
      state.gameLog = state.gameLog.slice(-SAVE_TRIM.gameLogMax);
    }
    // debugLog 縺ｯ菫晏ｭ倅ｸ崎ｦ・
    state.debugLog = [];
    // financeHistory: 逶ｴ霑鮮 繧ｷ繝ｼ繧ｺ繝ｳ縺ｮ縺ｿ
    if (state.financeHistory && state.financeHistory.length > 0) {
      const minSeason = state.season - SAVE_TRIM.financeKeepSeasons + 1;
      state.financeHistory = state.financeHistory.filter(h => h.season >= minSeason);
    }
    // matchupLog 繝医Μ繝溘Φ繧ｰ・磯ｮｮ蠎ｦ險育ｮ励・逶ｴ霑・2show縺ｮ縺ｿ菴ｿ逕ｨ縲”asEverFought縺ｯ繝壹いSet縺ｧ莉｣譖ｿ・・
    if (state.matchupLog && state.matchupLog.length > SAVE_TRIM.matchupLogMax) {
      // hasEverFought逕ｨ縺ｮ繝壹い繧ｻ繝・ヨ繧呈ｧ狗ｯ会ｼ亥・螻･豁ｴ縺九ｉ・・
      const everFoughtSet = new Set();
      state.matchupLog.forEach(e => {
        const a = Math.min(e.leftId, e.rightId), b = Math.max(e.leftId, e.rightId);
        everFoughtSet.add(`${a}>${b}`);
      });
      state._everFoughtPairs = [...everFoughtSet];
      state.matchupLog = state.matchupLog.slice(-SAVE_TRIM.matchupLogMax);
    }
    // AI蝗｣菴・matchupLog 繝医Μ繝溘Φ繧ｰ
    if (state.aiOrgs) {
      for (const orgId in state.aiOrgs) {
        const org = state.aiOrgs[orgId];
        if (org.matchupLog && org.matchupLog.length > SAVE_TRIM.aiMatchupLogMax) {
          org.matchupLog = org.matchupLog.slice(-SAVE_TRIM.aiMatchupLogMax);
        }
        // AI驕ｸ謇九・growthLog 繝医Μ繝溘Φ繧ｰ
        if (org.roster) {
          org.roster.forEach(c => {
            if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
              c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
            }
          });
        }
      }
    }
    // h2h.history 繝医Μ繝溘Φ繧ｰ (繝壹い豈取怙譁ｰN莉ｶ)
    if (state.h2h) {
      for (const key in state.h2h) {
        const entry = state.h2h[key];
        if (entry && entry.history && entry.history.length > SAVE_TRIM.h2hHistoryMax) {
          entry.history = entry.history.slice(-SAVE_TRIM.h2hHistoryMax);
        }
      }
    }
    // freeAgents縺ｮgrowthLog 繝医Μ繝溘Φ繧ｰ
    if (state.freeAgents) {
      state.freeAgents.forEach(c => {
        if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
          c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
        }
      });
    }
    state._saveVersion = '1.05';
    state._saveDate = new Date().toISOString();
    // LZ蝨ｧ邵ｮ + 繝槭・繧ｫ繝ｼ
    const json = JSON.stringify(state);
    return SAVE_COMPRESS_MARKER + LZString.compressToUTF16(json);
  },

  // 笏笏笏 蝨ｧ邵ｮ/髱槫悸邵ｮ繧ｻ繝ｼ繝悶・閾ｪ蜍募愛螳壹・繝ｫ繝代・ 笏笏笏
  _parseRaw(raw) {
    // 譁ｰ繝槭・繧ｫ繝ｼ(WM_LZ|) or 譌ｧ繝槭・繧ｫ繝ｼ(WM_LZ\x00) 荳｡蟇ｾ蠢・
    if (raw.startsWith(SAVE_COMPRESS_MARKER) || raw.startsWith('WM_LZ\x00')) {
      const markerLen = raw.startsWith(SAVE_COMPRESS_MARKER) ? SAVE_COMPRESS_MARKER.length : 6;
      const json = LZString.decompressFromUTF16(raw.slice(markerLen));
      if (!json) throw new Error('LZ decompression returned null');
      return JSON.parse(json);
    }
    return JSON.parse(raw);
  },

  deserialize(json) {
    const prevG = G;
    try {
      const state = Storage._parseRaw(json);
      // Replace G entirely with saved state, preserving any missing defaults
      const base = Engine.createInitialState(state.rngSeed || (Date.now() ^ 0xDEADBEEF));
      G = { ...base, ...state };

      // v0.6 backward compat: coaches
      if (!G.coaches) G = { ...G, coaches: [] };
      if (!G.availableCoaches) G = { ...G, availableCoaches: ALL_COACHES.map(c => c.id).filter(id => !G.coaches.includes(id)) };
      if (!G.seasonGrowth) G = { ...G, seasonGrowth: {} };

      // v3.0: 譌ｧ繧ｻ繝ｼ繝悶・蜈ｨID蛻玲嫌 availableCoaches 竊・繧ｷ繝ｼ繧ｺ繝ｳ繝励・繝ｫ縺ｫ螟画鋤
      if (G.availableCoaches && G.availableCoaches.length > COACH_POOL_CFG.candidatesMax + 5) {
        const poolRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season || 1, 0xC0AC));
        G = { ...G, availableCoaches: Engine.coach.generateSeasonalPool(poolRng, G) };
      }

      // v0.8 backward compat: coach assignments
      if (!G.coachAssign) {
        const ca = {};
        G.coaches.forEach(id => { ca[id] = []; });
        G = { ...G, coachAssign: ca };
      }
      G = { ...G, coachAssign: Engine.coach.sanitizeAssignments(G) };

      // v0.85 backward compat
      if (!G.rngSeed) G = { ...G, rngSeed: Date.now() ^ 0xDEADBEEF };

      // v0.9 backward compat: rival system
      if (!G.aiOrgs) {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0, 909));
        const aiResult = Engine.rival.initAIOrgs(rng);
        G = { ...G, aiOrgs: aiResult.aiOrgs, rivalOrgNames: aiResult.rivalOrgNames };
      }
      // 繝・・繧ｿ謨ｴ蜷域ｧ: AI蝗｣菴馴∈謇九′freeAgents縺ｫ豺ｷ蜈･縺励※縺・ｋ蝣ｴ蜷医・豁｣縺励＞蝗｣菴薙Ο繧ｹ繧ｿ繝ｼ縺ｸ遘ｻ蜍・
      if (G.aiOrgs && G.freeAgents) {
        const aiOrgIds = new Set(RIVAL_ORGS.map(o => o.id));
        const misplaced = G.freeAgents.filter(f => f.orgId && aiOrgIds.has(f.orgId));
        if (misplaced.length > 0) {
          let newFreeAgents = G.freeAgents.filter(f => !f.orgId || !aiOrgIds.has(f.orgId));
          const newAiOrgs = {};
          Object.keys(G.aiOrgs).forEach(orgId => { newAiOrgs[orgId] = { ...G.aiOrgs[orgId], roster: [...G.aiOrgs[orgId].roster] }; });
          misplaced.forEach(f => {
            const org = newAiOrgs[f.orgId];
            if (org && !org.roster.find(r => r.id === f.id)) org.roster.push(f);
          });
          G = { ...G, freeAgents: newFreeAgents, aiOrgs: newAiOrgs };
        }
      }
      if (G.aiOrgs) {
        G = { ...G, aiOrgs: Engine.rival.sanitizeAIOrgs(G.aiOrgs) };
      }
      // 繝・・繧ｿ謨ｴ蜷域ｧ: 繝励Ξ繧､繝､繝ｼ繝ｭ繧ｹ繧ｿ繝ｼ驕ｸ謇九′freeAgents縺ｫ驥崎､・＠縺ｦ縺・ｋ蝣ｴ蜷医・髯､蜴ｻ
      if (G.roster && G.freeAgents) {
        const rosterIds = new Set(G.roster.map(c => c.id));
        const dupFA = G.freeAgents.filter(f => rosterIds.has(f.id));
        if (dupFA.length > 0) {
          G = { ...G, freeAgents: G.freeAgents.filter(f => !rosterIds.has(f.id)) };
        }
      }
      // Restore org names from saved state
      Engine.rival.applyOrgNames(G.rivalOrgNames);
      if (!G.rankings) G = { ...G, rankings: Engine.ranking.updateRankings(G) };
      // v1.2: Remove deprecated aceDesignation
      if (G.aceDesignation !== undefined) { const { aceDesignation: _ace, ...rest } = G; G = rest; }
      if (!G.transferLog) G = { ...G, transferLog: [] };
      if (G.transfersThisSeason === undefined) G = { ...G, transfersThisSeason: 0 };
      // v1.0e: poolIds 竊・dormantPool migration
      if (G.poolIds && !G.dormantPool) G = { ...G, dormantPool: G.poolIds };
      if (!G.dormantPool) G = { ...G, dormantPool: Engine.rival.getDormantIds() };
      // FIFO: dormantPool 繧ｨ繝ｳ繝医Μ繧・{id, age} 蠖｢蠑上↓邨ｱ荳・医Ξ繧ｬ繧ｷ繝ｼ譁・ｭ怜・ID蟇ｾ蠢懶ｼ・
      if (G.dormantPool && G.dormantPool.some(e => {
        if (typeof e === 'string' || typeof e === 'number') return true;
        if (!e || e.id === undefined || e.id === null) return false;
        return !Number.isFinite(e.id) || !Number.isFinite(e.age);
      })) {
        G = {
          ...G,
          dormantPool: G.dormantPool.map(e => {
            if (typeof e === 'string' || typeof e === 'number') {
              const id = Number(e);
              return Number.isFinite(id) ? { id, age: 17 } : null;
            }
            if (!e || e.id === undefined || e.id === null) return e;
            const id = Number(e.id);
            if (!Number.isFinite(id)) return null;
            const age = Number.isFinite(Number(e.age)) ? Math.max(16, Math.min(21, Math.round(Number(e.age)))) : 17;
            return { ...e, id, age };
          }).filter(Boolean)
        };
      }
      if (!G.orgName) G = { ...G, orgName: '繝励Ξ繧､繝､繝ｼ蝗｣菴・ };

      // v0.9b backward compat: offseason system
      if (G.offSeason === undefined) G = { ...G, offSeason: false, offWeek: 0 };
      // v0.9c backward compat: transfer
      if (G.pendingPoach === undefined) G = { ...G, pendingPoach: [] };
      // v0.9d backward compat: rental & events
      if (G.rentals === undefined && G.rental === undefined) G = { ...G, rentals: [], warThisSeason: false, challengeTrigger: null, pendingEvent: null };
      if (G.seasonStats === undefined) G = { ...G, seasonStats: { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:G.funds, peakPop:G.orgPop||0, eventsWon:0, eventsLost:0 }, seasonHistory: [], fundsHistory: [G.funds] };
      // 蜿､縺・そ繝ｼ繝悶〒 seasonStats 縺ｮ繝輔ぅ繝ｼ繝ｫ繝峨′谺關ｽ縺励※縺・ｋ蝣ｴ蜷医↓蛯吶∴縺ｦ陬懷ｮ鯉ｼ・aN/undefined竊・ 髦ｲ豁｢・・
      {
        const _ssDefaults = { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:G.funds||0, peakPop:G.orgPop||0, eventsWon:0, eventsLost:0 };
        const _fixedSS = { ..._ssDefaults, ...(G.seasonStats || {}) };
        // 謨ｰ蛟､繝輔ぅ繝ｼ繝ｫ繝峨′ NaN 縺ｫ縺ｪ縺｣縺ｦ縺・ｋ繧ｱ繝ｼ繧ｹ繧・0 縺ｫ豁｣隕丞喧
        ['wins','losses','draws','showCount','totalRevenue','totalExpense','bestMQ','peakFunds','peakPop','eventsWon','eventsLost'].forEach(k => {
          if (typeof _fixedSS[k] !== 'number' || !Number.isFinite(_fixedSS[k])) _fixedSS[k] = _ssDefaults[k];
        });
        G = { ...G, seasonStats: _fixedSS };
      }

      // v0.97 backward compat: survival gauge
      if (G.survivalCleared === undefined) G = { ...G, survivalCleared: false, survivalProfitStreak: 0, survivalMilestones: [], survivalClearWeek: null, survivalClearSeason: null };
      // v1.0 backward compat: rolling net (replaces profit streak)
      if (!G.recentWeeklyNet) G = { ...G, recentWeeklyNet: [0,0,0,0], rollingNet4Count: 0 };
      // Migrate old profit streak to rolling count estimate
      if (G.survivalProfitStreak && G.survivalProfitStreak >= 4 && !G.rollingNet4Count) {
        G = { ...G, rollingNet4Count: Math.floor(G.survivalProfitStreak / 4) };
      }
      // v1.0 backward compat: title establishment
      if (G.titleEstablished === undefined) {
        // Auto-detect: if champion exists or title conditions met, it's established
        G = { ...G, titleEstablished: !!(G.titles?.world?.championId) || (G.totalShows >= 3 && G.orgPop >= 15 && G.roster.length >= 5) };
      }

      // 螳牙・蠑・ 邇玖・′繝ｭ繧ｹ繧ｿ繝ｼ縺ｫ蟄伜惠縺励↑縺・ｴ蜷医・遨ｺ菴阪↓縺吶ｋ・磯蝗｣繝代せ貍上ｌ菫ｮ蠕ｩ・・
      if (G.titles?.world?.championId && !G.roster.find(c => c.id === G.titles.world.championId)) {
        G = { ...G, titles: { ...G.titles, world: { ...G.titles.world, championId: null, defenses: 0 } } };
        console.log('[Migration] 邇玖・′繝ｭ繧ｹ繧ｿ繝ｼ縺ｫ荳榊惠縺ｮ縺溘ａ邇句ｺｧ繧堤ｩｺ菴阪↓菫ｮ蠕ｩ縺励∪縺励◆');
      }

      G = { ...G, version: '1.05' };

      // Sync master-backed fields from ALL_CHARS so save data follows spec updates.
      const syncMasterCharMeta = c => {
        const master = ALL_CHARS.find(t => t.id === c.id);
        if (!master) return c;
        return {
          ...c,
          personality: master.personality || c.personality || 'normal',
          archetype: master.archetype || c.archetype || 'normal',
        };
      };

      // Fix character data (immutable)
      const fixChar = c => {
        const nc = syncMasterCharMeta({ ...c });
        if (!nc.seasonGrowth) nc.seasonGrowth = {pw:0, sp:0, te:0, st:0, mn:0};
        if (nc.careerSeasons === undefined) nc.careerSeasons = 0;
        if (!nc.pot) { const t = ALL_CHARS.find(t => t.id === nc.id); if (t) nc.pot = {...t.pot}; }
        if (nc.intensive === undefined) nc.intensive = false;
        if (nc.intensiveWeeks === undefined) nc.intensiveWeeks = 0;
        // v0.9: add notionValue/trainCap if missing (migrating from v0.85b)
        if (!nc.notionValue) {
          const t = ALL_CHARS.find(t => t.id === nc.id);
          if (t) nc.notionValue = {pw:t.pw, sp:t.sp, te:t.te, st:t.st, mn:t.mn};
          else nc.notionValue = {pw:nc.pw, sp:nc.sp, te:nc.te, st:nc.st, mn:nc.mn};
        }
        if (!nc.trainCap && nc.notionValue && nc.pot) {
          const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, nc.id, 777));
          nc.trainCap = Engine.rival.generateTrainCap(rng, nc.notionValue, nc.pot);
        }
        if (nc.age === undefined) nc.age = 17 + (nc.careerSeasons || 0);
        return nc;
      };
      G = { ...G, roster: G.roster.map(fixChar), freeAgents: G.freeAgents.map(fixChar) };
      if (G.aiOrgs) {
        const syncedAi = {};
        Object.keys(G.aiOrgs).forEach(orgId => {
          const od = G.aiOrgs[orgId];
          syncedAi[orgId] = { ...od, roster: (od.roster || []).map(fixChar) };
        });
        G = { ...G, aiOrgs: syncedAi };
      }

      // v1.0 migration: fix freeAgents that were created with useNotion:true bug
      // Detect: all 4 physical stats exactly match notionValue (statistically impossible from generateStartValues)
      // 窶ｻ繝輔Λ繧ｰ蛻ｶ蠕｡: 謌宣聞縺ｧnotionValue縺ｫ蛻ｰ驕斐＠縺檳A縺ｮ繧ｹ繝・ｒ隱､縺｣縺ｦ繝ｪ繧ｻ繝・ヨ縺励↑縺・ｈ縺・ｸ蠎ｦ縺阪ｊ
      if (!G._migrated_v1_0_fa_notion) {
        G = { ...G, freeAgents: G.freeAgents.map(c => {
          if (!c.notionValue) return c;
          const nv = c.notionValue;
          const isInflated = c.pw === nv.pw && c.sp === nv.sp && c.te === nv.te && c.st === nv.st;
          if (!isInflated) return c;
          // Recalculate with age-appropriate values
          const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 888));
          const startVals = Engine.rival.generateStartValues(rng, nv, c.age);
          return { ...c, ...startVals };
        })};
        G = { ...G, _migrated_v1_0_fa_notion: true };
      }

      // v1.2 migration: fix freeAgents stuck at age 16-17 (should be 17-23)
      // 窶ｻ繝輔Λ繧ｰ蛻ｶ蠕｡: 譌ｧ繧ｻ繝ｼ繝悶∈縺ｮ荳蠎ｦ縺阪ｊ縺ｮ菫ｮ豁｣縲よｯ弱Ο繝ｼ繝牙ｮ溯｡後・蟷ｴ鮨｢螟牙虚繝舌げ縺ｮ蜴溷屏縺ｫ縺ｪ繧・
      if (!G._migrated_v1_2_fa_age) {
        G = { ...G, freeAgents: G.freeAgents.map(c => {
          if (c.age > 17) return c; // only fix age 竕､17 FAs (legacy: was 16)
          const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 1616));
          const newAge = 17 + Engine.rng.int(ageRng, 0, 6);
          const nv = c.notionValue || {pw:c.pw,sp:c.sp,te:c.te,st:c.st,mn:c.mn};
          const startVals = Engine.rival.generateStartValues(ageRng, nv, newAge);
          return { ...c, age: newAge, ...startVals };
        })};
        G = { ...G, _migrated_v1_2_fa_age: true };
      }

      // v0.99 migration: assign assessedValue to all characters (pricing-balance-spec ﾂｧ1)
      const migrateAssessed = (fighters) => fighters.map(f => {
        if (f.assessedValue) return f;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, f.id, 999));
        const av = Engine.scout.calcAssessedValue(f, rng, G.season || 1);
        return { ...f, ...av };
      });
      G = { ...G, roster: migrateAssessed(G.roster), freeAgents: migrateAssessed(G.freeAgents) };
      // Also migrate AI org rosters
      if (G.aiOrgs) {
        const migAi = {};
        Object.keys(G.aiOrgs).forEach(orgId => {
          const od = G.aiOrgs[orgId];
          migAi[orgId] = { ...od, roster: migrateAssessed(od.roster) };
        });
        G = { ...G, aiOrgs: migAi };
      }

      // v1.0b migration: popularity/venue redesign
      if (!G._migrated_v1_0b) {
        // Add new fighter fields
        const migrateV1b = (fighters) => fighters.map(c => {
          const nc = { ...c };
          if (nc.losingStreak === undefined) nc.losingStreak = 0;
          if (nc.preInjuryPop === undefined) nc.preInjuryPop = nc.injury ? nc.popularity : null;
          return nc;
        });
        G = { ...G, roster: migrateV1b(G.roster), freeAgents: migrateV1b(G.freeAgents) };
        // Migrate AI org rosters
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migrateV1b(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        // Rescale popularity (fix "everyone at 100" problem)
        const rescalePop = (fighters) => fighters.map(c => {
          const ovr = Engine.util.ov(c);
          const targetPop = ovr <= 50 ? 15 : ovr <= 65 ? 30 : ovr <= 80 ? 50 : ovr <= 90 ? 65 : 80;
          const newPop = c.popularity * 0.5 + targetPop * 0.5;
          return { ...c, popularity: Engine.util.clamp(newPop, 5, 90) };
        });
        G = { ...G, roster: rescalePop(G.roster) };
        // Rescale AI org fighter popularity too
        if (G.aiOrgs) {
          const migAi2 = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi2[orgId] = { ...od, roster: rescalePop(od.roster) };
          });
          G = { ...G, aiOrgs: migAi2 };
        }
        // Migrate venue index if needed (old 6 venues 竊・new 7 venues)
        if (G.showVenue !== undefined) {
          // Old: 0=蜈ｬ豌鷹､ｨ,1=蟆・2=荳ｭ,3=繧｢繝ｪ繝ｼ繝・4=螟ｧ,5=繝峨・繝
          // New: 0=蜈ｬ豌鷹､ｨ,1=蟆・2=蟶よｰ台ｼ夐､ｨ,3=荳ｭ,4=繧｢繝ｪ繝ｼ繝・5=螟ｧ,6=繝峨・繝
          const venueMap = {0:0, 1:1, 2:3, 3:4, 4:5, 5:6};
          G = { ...G, showVenue: venueMap[G.showVenue] ?? 0 };
        }
        G = { ...G, _migrated_v1_0b: true };
      }

      // v1.3 migration: add careerRecord to all fighters + retiredFighters/hallOfFame to state
      if (!G._migrated_v1_3) {
        const migrateCareer = roster => roster.map(c => c.careerRecord ? c : { ...c, careerRecord: Engine.career.createRecord() });
        G = { ...G, roster: migrateCareer(G.roster), freeAgents: migrateCareer(G.freeAgents) };
        if (!G.retiredFighters) G = { ...G, retiredFighters: [] };
        if (!G.hallOfFame) G = { ...G, hallOfFame: [] };
        // Migrate AI org rosters too
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migrateCareer(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_v1_3: true };
      }

      // v1.3-1 migration: add durability and wear to all fighters
      if (!G._migrated_v1_3_1) {
        const migWear = (fighters) => fighters.map(c => {
          if (c.durability !== undefined && c.wear !== undefined) return c;
          const mRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 1331));
          const dur = c.durability !== undefined ? c.durability : Engine.career.generateDurability(mRng);
          const decayStart = 23 + dur;
          // 譌｢蟄倥・繝・Λ繝ｳ縺ｸ縺ｮ驟肴・: 逅・ｫ門､縺ｮ70%縺ｧwear繧貞ｾ御ｻ倥￠
          const wearYears = Math.max(0, (c.age || 17) - decayStart);
          const estimatedWear = c.wear !== undefined ? c.wear : Math.round(wearYears * 8 * 0.7);
          return { ...c, durability: dur, wear: estimatedWear };
        });
        G = { ...G, roster: migWear(G.roster), freeAgents: migWear(G.freeAgents) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migWear(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_v1_3_1: true };
      }

      // v1.3-2 migration: add seasonInjuries, careerHistory, growthPenalty to all fighters
      if (!G._migrated_v1_3_2) {
        const migV132 = (fighters) => fighters.map(c => {
          const updates = {};
          if (!c.hasOwnProperty('seasonInjuries')) updates.seasonInjuries = 0;
          if (!c.hasOwnProperty('careerHistory'))  updates.careerHistory  = [];
          if (!c.hasOwnProperty('growthPenalty'))  updates.growthPenalty  = null;
          return Object.keys(updates).length > 0 ? { ...c, ...updates } : c;
        });
        G = { ...G, roster: migV132(G.roster), freeAgents: migV132(G.freeAgents) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: migV132(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_v1_3_2: true };
      }

      // v1.3-3: Fix float stat values from match growth bug
      if (!G._migrated_v1_3_3) {
        const fixFloats = (fighters) => fighters.map(c => {
          const nc = { ...c };
          ['pw','sp','te','st','mn'].forEach(s => {
            if (typeof nc[s] === 'number') nc[s] = Math.round(nc[s]);
          });
          if (nc.seasonGrowth) {
            nc.seasonGrowth = { ...nc.seasonGrowth };
            ['pw','sp','te','st','mn'].forEach(s => {
              if (typeof nc.seasonGrowth[s] === 'number') nc.seasonGrowth[s] = Math.round(nc.seasonGrowth[s]);
            });
          }
          return nc;
        });
        G = { ...G, roster: fixFloats(G.roster), freeAgents: fixFloats(G.freeAgents) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: fixFloats(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_v1_3_3: true };
      }

      // v1.4 migration: AI fighters 縺ｫ careerSeasons 莉倅ｸ・+ lastAwards/hallOfFame
      if (!G._migrated_v1_4) {
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = {
              ...od,
              roster: od.roster.map(f => ({
                ...f,
                careerSeasons: f.careerSeasons != null ? f.careerSeasons : Math.max(0, (f.age || 17) - 17)
              }))
            };
          });
          G = { ...G, aiOrgs: migAi };
        }
        if (!G.hasOwnProperty('lastAwards')) G = { ...G, lastAwards: null };
        if (!G.hasOwnProperty('hallOfFame')) G = { ...G, hallOfFame: [] };
        G = { ...G, _migrated_v1_4: true };
      }

      // v1.8: 謌宣聞繧､繝吶Φ繝医す繧ｹ繝・Β 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_growth_events) {
        const addGrowthFields = fighters => fighters.map(c => {
          const updates = {};
          if (!c.hasOwnProperty('hotStreak'))      updates.hotStreak      = null;
          if (!c.hasOwnProperty('slump'))          updates.slump          = null;
          if (!c.hasOwnProperty('motivationLoss')) updates.motivationLoss = null;
          if (!c.hasOwnProperty('careerBestMQ'))   updates.careerBestMQ   = 0;
          return Object.keys(updates).length > 0 ? { ...c, ...updates } : c;
        });
        G = { ...G, roster: addGrowthFields(G.roster || []) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: addGrowthFields(od.roster || []) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_growth_events: true };
      }

      // v1.5: 髮｣譏灘ｺｦ繝ｪ繝舌Λ繝ｳ繧ｹ 窶・譌｢蟄倥そ繝ｼ繝悶・orgPop繧偵Μ繧ｹ繧ｱ繝ｼ繝ｫ・暗・.7・・
      // 窶ｻ orgPop < 20 縺ｯ騾捺ｸ帙き繝ｼ繝悶′ﾃ・.0蟶ｯ縺ｮ縺溘ａ陬懈ｭ｣荳崎ｦ・ｼ亥ｺ冗乢繧ｻ繝ｼ繝悶↓縺ｯ驕ｩ逕ｨ縺励↑縺・ｼ・
      if (!G._migrated_v1_5_rebalance) {
        const oldOrgPop = G.orgPop || 0;
        if (oldOrgPop >= 20) {
          const newOrgPop = Math.round(oldOrgPop * 0.7);
          G = { ...G, orgPop: newOrgPop };
          G = { ...G, gameLog: [...(G.gameLog || []), `討 繝舌Λ繝ｳ繧ｹ隱ｿ謨ｴ(v1.5): 蝗｣菴謎ｺｺ豌励ｒ${oldOrgPop}竊・{newOrgPop}縺ｫ蜀崎ｪｿ謨ｴ縺励∪縺励◆・暗・.7 繝ｪ繧ｹ繧ｱ繝ｼ繝ｫ・荏] };
        }
        G = { ...G, _migrated_v1_5_rebalance: true };
      }

      // v1.5s25b: 繝槭う繝ｫ繧ｹ繝医・繝ｳ繧､繝吶Φ繝医す繧ｹ繝・Β 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_milestone) {
        if (!G.milestones) G = { ...G, milestones: {} };
        if (!G.milestoneBuffs) G = { ...G, milestoneBuffs: [] };
        // 譌｢蟄倥そ繝ｼ繝悶〒譚｡莉ｶ繧呈ｺ縺溘＠縺ｦ縺・ｋ繝槭う繝ｫ繧ｹ繝医・繝ｳ縺ｯ逋ｺ蜍墓ｸ医∩縺ｨ縺吶ｋ
        const ms = { ...G.milestones };
        if ((G.totalShows || 0) > 0) ms.first_show = true;
        if (Engine.util.dispOrgPop(G.orgPop) >= 20) ms.orgpop_20 = true;
        if (Object.keys(G.rivalries || {}).length > 0) ms.first_rivalry = true;
        G = { ...G, milestones: ms, _migrated_milestone: true };
      }

      // v2.0: trust 繝代Λ繝｡繝ｼ繧ｿ + lockerRoomMorale 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_trust) {
        // 蜈ｨ驕ｸ謇九↓ trust: 50 繧剃ｻ倅ｸ趣ｼ亥・譛溷､・・
        const migratedRoster = (G.roster || []).map(f =>
          f.trust != null ? f : { ...f, trust: 50 }
        );
        G = {
          ...G,
          roster: migratedRoster,
          lockerRoomMorale: G.lockerRoomMorale != null ? G.lockerRoomMorale : 60,
          _migrated_trust: true,
        };
        G = { ...G, gameLog: [...(G.gameLog || []), '討 繧ｷ繧ｹ繝・Β譖ｴ譁ｰ(v2.0): 菫｡鬆ｼ蠎ｦ繝代Λ繝｡繝ｼ繧ｿ繧定ｿｽ蜉縺励∪縺励◆'] };
      }

      if (!G._migrated_npc_traits) {
        // AI蝗｣菴薙・蜈ｨ驕ｸ謇九↓ traits 繧剃ｻ倅ｸ趣ｼ・LL_CHARS 縺ｮ繝槭せ繧ｿ縺九ｉ蠑輔￥・・
        const aiOrgs = { ...(G.aiOrgs || {}) };
        for (const orgId of Object.keys(aiOrgs)) {
          aiOrgs[orgId] = {
            ...aiOrgs[orgId],
            roster: (aiOrgs[orgId].roster || []).map(f => {
              if (f.traits != null) return f;
              const master = ALL_CHARS.find(ch => ch.id === f.id);
              return { ...f, traits: master ? (master.traits || []) : [] };
            })
          };
        }
        G = { ...G, aiOrgs, _migrated_npc_traits: true };
      }

      // v2.1: endingCleared / endingClearedSeason 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_ending) {
        const endingCleared = G.endingCleared || hasPlayerHistoricRank1(G);
        const endingClearedSeason = G.endingClearedSeason || ((G.seasonHistory || []).find(s => (s?.rank || 99) === 1)?.season) || null;
        G = { ...G, endingCleared, endingClearedSeason, _migrated_ending: true };
      }
      // v2.0 Phase1-6: 螟ｧ蝙九う繝吶Φ繝・繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_large_events) {
        G = { ...G, lastLargeEventWeek: G.lastLargeEventWeek || 0, mediaSpotlight: G.mediaSpotlight || null, _migrated_large_events: true };
      }
      // L1: 莨壼ｴ繧ｷ繧ｹ繝・Β蜀崎ｨｭ險医・繧､繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_venue_redesign) {
        // 譌ｧ7谿ｵ竊呈眠10谿ｵ: 0=蜈ｬ豌鷹､ｨ竊・, 1=蟆上・繝ｼ繝ｫ竊・, 2=蟶よｰ台ｼ夐､ｨ竊・, 3=荳ｭ繝帙・繝ｫ竊・, 4=繧｢繝ｪ繝ｼ繝岩・7, 5=螟ｧ莨壼ｴ竊・, 6=繝峨・繝竊・
        const venueMap = {0:0, 1:1, 2:3, 3:4, 4:7, 5:8, 6:9};
        G = { ...G,
          showVenue: venueMap[G.showVenue] ?? 0,
          attendanceMomentum: 0,
          _migrated_venue_redesign: true
        };
      }

      // Rental system migration: G.rental (single object) 竊・G.rentals (array)
      if (!G._migrated_rental_v2) {
        const rentals = Array.isArray(G.rentals) ? [...G.rentals] : [];
        let roster = [...(G.roster || [])];
        if (G.rental) {
          // Convert old single rental to new contract format
          const old = G.rental;
          if (!rentals.some(r => r.fighterId === old.fighterId)) {
            rentals.push({
              fighterId: old.fighterId,
              fromSource: 'rival',
              fromOrgId: old.fromOrgId,
              seasonsLeft: 1,  // finish at next season end
              fee: 0           // already paid in old system
            });
          }
          roster = roster.map(c => (
            c.id === old.fighterId
              ? { ...c, isRental: true, rentalSource: 'rival', rentalSeasonsLeft: 1 }
              : c
          ));
        }
        G = { ...G, rentals, roster, rental: undefined, _migrated_rental_v2: true };
      }

      // Rental v3: seasonsLeft 竊・weeksLeft (1譛・12騾ｱ縺ｮ騾ｱ谺｡貂帷ｮ励↓遘ｻ陦・
      if (!G._migrated_rental_v3) {
        const rentals = (G.rentals || []).map(r => {
          if (r.weeksLeft != null) return r; // 譌｢縺ｫ遘ｻ陦梧ｸ医∩
          // 譌ｧ seasonsLeft 繧・weeksLeft 縺ｫ螟画鋤: seasonsLeft * 12
          const wl = (r.seasonsLeft || 1) * 12;
          const { seasonsLeft, ...rest } = r;
          return { ...rest, weeksLeft: wl };
        });
        // roster荳翫・ rentalSeasonsLeft 竊・rentalWeeksLeft
        const roster = (G.roster || []).map(c => {
          if (!c.isRental) return c;
          const ct = rentals.find(r => r.fighterId === c.id);
          const { rentalSeasonsLeft, ...rest } = c;
          return { ...rest, rentalWeeksLeft: ct ? ct.weeksLeft : (rentalSeasonsLeft || 1) * 12 };
        });
        G = { ...G, rentals, roster, _migrated_rental_v3: true };
      } else if ((G.roster || []).some(c => c?.isRental && c.rentalSeasonsLeft !== undefined && c.rentalWeeksLeft === undefined)) {
        const roster = (G.roster || []).map(c => {
          if (!c?.isRental || c.rentalSeasonsLeft === undefined || c.rentalWeeksLeft !== undefined) return c;
          const { rentalSeasonsLeft, ...rest } = c;
          return { ...rest, rentalWeeksLeft: (rentalSeasonsLeft || 1) * 12 };
        });
        G = { ...G, roster };
      }

      // ranking-roster-redesign v1.0 Phase 1: battlePoints + summitBonus蟒・ｭ｢
      if (!G._migrated_ranking_v2) {
        const bp = { player: 0, org_s: 0, org_a: 0, org_b: 0 };
        // summitBonus縺梧ｮ九▲縺ｦ縺・ｌ縺ｰplayer battlePoints縺ｫ遘ｻ陦・
        if (G.summitBonus) bp.player = G.summitBonus;
        G = { ...G, battlePoints: bp, _migrated_ranking_v2: true };
        delete G.summitBonus;
        // 繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ繧貞・險育ｮ・
        G = { ...G, rankings: Engine.ranking.updateRankings(G) };
      }

      // 蝗邵√Μ繝・じ繧､繝ｳv2: resolutionCount + matchupLog
      if (!G._migrated_rivalry_v2) {
        const migratedRivalries = {};
        Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
          migratedRivalries[key] = { ...rv, resolutionCount: rv.resolutionCount || 0 };
        });
        // matchupLog陬懷ｮ・ rivalries縺九ｉ蟇ｾ謌ｦ螻･豁ｴ繧貞ｾｩ蜈・＠縲∝・鬘泌粋繧上○隱､蛻､螳壹ｒ髦ｲ縺・
        let migratedLog = G.matchupLog || [];
        if (migratedLog.length === 0) {
          const currentShow = G.totalShows || 0;
          Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
            const ids = key.split('-').map(Number);
            if (ids.length !== 2 || !ids[0] || !ids[1]) return;
            const matches = rv.matches || 0;
            for (let j = 0; j < matches; j++) {
              migratedLog.push({
                leftId: ids[0], rightId: ids[1],
                showCount: Math.max(1, currentShow - matches + j + 1)
              });
            }
          });
        }
        G = { ...G, rivalries: migratedRivalries, matchupLog: migratedLog, _migrated_rivalry_v2: true };
      }

      // matchupLog陬懷ｮ計2: 譌｢縺ｫrivalry_v2繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ貂医∩縺縺檎ｩｺlog縺ｮ繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ蟇ｾ蠢・
      if (!G._migrated_matchuplog_v2) {
        if ((G.matchupLog || []).length === 0 && Object.keys(G.rivalries || {}).length > 0) {
          const currentShow = G.totalShows || 0;
          const backfillLog = [];
          Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
            const ids = key.split('-').map(Number);
            if (ids.length !== 2 || !ids[0] || !ids[1]) return;
            const matches = rv.matches || 0;
            for (let j = 0; j < matches; j++) {
              backfillLog.push({
                leftId: ids[0], rightId: ids[1],
                showCount: Math.max(1, currentShow - matches + j + 1)
              });
            }
          });
          if (backfillLog.length > 0) {
            G = { ...G, matchupLog: backfillLog };
          }
        }
        G = { ...G, _migrated_matchuplog_v2: true };
      }

      // PPV GRAND FINAL 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_ppv_v2) {
        G = { ...G,
          ppvUnlocked: (G.orgPop || 0) >= PPV_UNLOCK_POP,
          ppvEntries: G.ppvEntries || null,
          ppvPhase: G.ppvPhase || null,
          ppvName: G.ppvName || '',
          _migrated_ppv_v2: true,
        };
      }

      // v0.99b: clean up scoutEvent state if weekPhase isn't scoutEvent
      if (G.weekPhase !== 'scoutEvent') {
        G = { ...G, scoutCandidates: null, scoutPicks: null, scoutMaxPicks: null, scoutPendingPick: null, scoutEventType: null, _draftNegotiationStarted: false };
      }

      // roster-cap v2.0: popularity-based progression (8 -> 10 -> 12 -> 16)
      if (!G._migrated_roster_cap_pop_v2) {
        const orgPop = G.orgPop || 0;
        const rank1Unlocked = App.hasPermanentRosterCap16Unlock(G);
        let cap = 8;
        if (orgPop >= 25) cap = 10;
        if (orgPop >= 50) cap = 12;
        if (orgPop >= 70) cap = 14;
        if (rank1Unlocked) cap = 16;
        G = {
          ...G,
          rosterCap: cap,
          rosterCapPop25Notified: orgPop >= 25,
          rosterCapPop50Notified: orgPop >= 50,
          rosterCapPop70Notified: orgPop >= 70,
          rosterCapRank1Notified: rank1Unlocked,
          _migrated_roster_cap_pop_v2: true,
        };
      } else {
        if (G.rosterCap === undefined) G = { ...G, rosterCap: 8 };
        if (G.rosterCapPop25Notified === undefined) G = { ...G, rosterCapPop25Notified: (G.orgPop || 0) >= 25 };
        if (G.rosterCapPop50Notified === undefined) G = { ...G, rosterCapPop50Notified: (G.orgPop || 0) >= 50 };
        if (G.rosterCapPop70Notified === undefined) G = { ...G, rosterCapPop70Notified: (G.orgPop || 0) >= 70 };
        if (G.rosterCapRank1Notified === undefined) G = { ...G, rosterCapRank1Notified: App.hasPermanentRosterCap16Unlock(G) };
      }

      // scout-pricing v2: assessedValue蜀崎ｨ育ｮ暦ｼ・IERS baseMin/Max蠑輔″荳翫￡蟇ｾ蠢懶ｼ・
      if (!G._migrated_scout_pricing_v2) {
        const rng = Engine.rng.create(0xFACE + (G.season || 1));
        const reassess = (fighters) => fighters.map(f => {
          if (!f.assessedValue) return f;
          const av = Engine.scout.calcAssessedValue(f, rng, G.season || 1);
          return { ...f, assessedValue: av.assessedValue, assessedTier: av.assessedTier };
        });
        G = { ...G, freeAgents: reassess(G.freeAgents || []) };
        const aiOrgs = { ...G.aiOrgs };
        Object.keys(aiOrgs).forEach(k => {
          if (aiOrgs[k]?.roster) aiOrgs[k] = { ...aiOrgs[k], roster: reassess(aiOrgs[k].roster) };
        });
        G = { ...G, aiOrgs, _migrated_scout_pricing_v2: true };
      }

      // 螂醍ｴ・ｺ､貂・ salaryBonus繝輔ぅ繝ｼ繝ｫ繝芽ｿｽ蜉
      if (!G._migrated_contract_v1) {
        G.roster.forEach(f => { if (f.salaryBonus === undefined) f.salaryBonus = 0; });
        G = { ...G, _migrated_contract_v1: true };
      }

      // NPC險倬鹸邨ｱ荳: AI驕ｸ謇九↓careerBestMQ + orgData縺ｫmatchupLog/seasonBreakthroughs/showCount
      if (!G._migrated_npc_record_v1) {
        const aiOrgs = { ...G.aiOrgs };
        Object.keys(aiOrgs).forEach(orgId => {
          const od = aiOrgs[orgId];
          if (!od) return;
          aiOrgs[orgId] = { ...od,
            matchupLog: od.matchupLog || [],
            seasonBreakthroughs: od.seasonBreakthroughs || [],
            showCount: od.showCount || 0
          };
          (od.roster || []).forEach(f => {
            if (f.careerBestMQ === undefined) f.careerBestMQ = 0;
            if (f.losingStreak === undefined) f.losingStreak = 0;
            if (f.noAppearStreak === undefined) f.noAppearStreak = 0;
          });
        });
        G = { ...G, aiOrgs, _migrated_npc_record_v1: true };
      }

      // Phase 1: 莠ｺ髢馴未菫ゅョ繝ｼ繧ｿ蝓ｺ逶､ 窶・譌｢蟄倥そ繝ｼ繝悶ョ繝ｼ繧ｿ縺ｨ縺ｮ莠呈鋤諤ｧ
      if (!G._migrated_relationships_v1) {
        if (!G.relationships || Object.keys(G.relationships).length === 0) {
          G = Engine.relationships.initialize(G);
        }
        if (!G.relationshipCounters) {
          G = { ...G, relationshipCounters: {} };
        }
        G = { ...G, _migrated_relationships_v1: true };
      }

      // Phase 5: 繝ｩ繧､繝舌Ν遘ｰ蜿ｷtier繝輔ぅ繝ｼ繝ｫ繝峨・繧､繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_rivalry_tier_v1) {
        const rivalries = { ...G.rivalries };
        for (const key of Object.keys(rivalries)) {
          const entry = rivalries[key];
          if (entry.tier === undefined) {
            let tier = 0;
            if (!entry.resolved) {
              if ((entry.matches || 0) >= 7) tier = 3;
              else if ((entry.matches || 0) >= 4) tier = 2;
              else if ((entry.matches || 0) >= 2) tier = 1;
            }
            rivalries[key] = {
              ...entry,
              tier,
              tierPromotedWeek: 0,
              matchesSinceTier: 0,
              bestMQSinceTier: 0,
              oneSided: null,
            };
          }
        }
        G = { ...G, rivalries, relationshipHistory: G.relationshipHistory || [], _migrated_rivalry_tier_v1: true };
      }

      if (!G._migrated_retired_rivalry_cleanup_v1) {
        (G.retiredFighters || []).forEach(retiree => {
          G = archiveRetiredRivalryState(G, retiree);
        });
        G = { ...G, _migrated_retired_rivalry_cleanup_v1: true };
      }
      // 遉ｾ髟ｷ螳､ Phase 2: 豎ｺ陬∵棧繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (G.decisionPoints === undefined) {
        G = { ...G, decisionPoints: 6, decisionPointsMax: 6, _migrated_decisionPoints_v1: true };
      }
      // 遉ｾ髟ｷ螳､ Phase 4: _decisionWeekUsed / _decisionDoneThisWeek 蛻晄悄蛹・
      if (G._decisionWeekUsed === undefined) {
        G = { ...G, _decisionWeekUsed: {} };
      }
      if (G._decisionDoneThisWeek === undefined) {
        G = { ...G, _decisionDoneThisWeek: [] };
      }
      if (G.roster && G.roster.some(f => f._decisionWeekUsed === undefined)) {
        G = { ...G, roster: G.roster.map(f => f._decisionWeekUsed === undefined ? { ...f, _decisionWeekUsed: {} } : f) };
      }
      // 遉ｾ髟ｷ螳､ Phase 5: _careWeekUsed 竊・_decisionWeekUsed 縺ｫ邨ｱ蜷・
      if (G.roster && G.roster.some(f => f._careWeekUsed)) {
        G = { ...G, roster: G.roster.map(f => {
          if (!f._careWeekUsed) return f;
          const merged = { ...(f._decisionWeekUsed || {}), ...f._careWeekUsed };
          const { _careWeekUsed: _, ...rest } = f;
          return { ...rest, _decisionWeekUsed: merged };
        }) };
      }
      // 遉ｾ髟ｷ螳､ Phase 5: 譌ｧ繧ｱ繧｢繧ｹ繝医ャ繧ｯ / _teamCareWeekUsed / _costumeDebut 繧貞炎髯､
      if (G.careStock !== undefined || G.careStockMax !== undefined
          || G.careStockLastRecovery !== undefined || G._teamCareWeekUsed !== undefined) {
        const { careStock: _a, careStockMax: _b, careStockLastRecovery: _c, _teamCareWeekUsed: _d, ...rest } = G;
        G = rest;
      }
      if (G.roster && G.roster.some(f => f._costumeDebut !== undefined)) {
        G = { ...G, roster: G.roster.map(f => {
          if (f._costumeDebut === undefined) return f;
          const { _costumeDebut: _, ...rest } = f;
          return rest;
        }) };
      }
      // 遉ｾ髟ｷ螳､ Phase 7: pendingTrustDeltas 蛻晄悄蛹・(trainer/camp 縺ｮ驕・ｻｶ逋ｺ迴ｾ繝医Λ繝・け)
      if (G.roster && G.roster.some(f => f.pendingTrustDeltas === undefined)) {
        G = { ...G, roster: G.roster.map(f =>
          f.pendingTrustDeltas === undefined ? { ...f, pendingTrustDeltas: [] } : f
        ) };
      }

      // retiredIds豌ｸ邯壼喧繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ: hallOfFame+迴ｾretiredFighters縺ｮID繧貞庶髮・
      if (!G._migrated_retiredIds_v1) {
        const ids = new Set(G.retiredIds || []);
        (G.hallOfFame || []).forEach(f => { if (f.id) ids.add(f.id); });
        (G.retiredFighters || []).forEach(f => { if (f.id) ids.add(f.id); });
        G = { ...G, retiredIds: [...ids], _migrated_retiredIds_v1: true };
      }

      // retiredSeasons繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ: 譌｢蟄腕etiredIds縺ｫ蠑暮繧ｷ繝ｼ繧ｺ繝ｳ繧貞牡繧雁ｽ薙※・亥叉繝ｪ繧ｵ繧､繧ｯ繝ｫ蟇ｾ雎｡縺ｫ・・
      if (!G._migrated_retiredSeasons_v1) {
        const rs = { ...(G.retiredSeasons || {}) };
        // 迴ｾ蝨ｨ縺ｩ縺ｮ繝励・繝ｫ縺ｫ繧ゅ＞縺ｪ縺вetiredIds縺ｫ蟇ｾ縺励※縲・繧ｷ繝ｼ繧ｺ繝ｳ莉･荳雁燕縺ｮ繧ｷ繝ｼ繧ｺ繝ｳ繧貞牡繧雁ｽ薙※
        const pastSeason = Math.max(1, (G.season || 1) - 10);
        (G.retiredIds || []).forEach(id => {
          if (!rs[id]) rs[id] = pastSeason;
        });
        G = { ...G, retiredSeasons: rs, _migrated_retiredSeasons_v1: true };
      }

      if (!G._migrated_factions_v1) {
        if (!Array.isArray(G.factions)) G = { ...G, factions: [] };
        if (!G.factionHostility || typeof G.factionHostility !== 'object') G = { ...G, factionHostility: {} };
        if (!G.factionEventCooldowns || typeof G.factionEventCooldowns !== 'object') G = { ...G, factionEventCooldowns: {} };
        G = { ...G, _migrated_factions_v1: true };
      }
      if (Array.isArray(G.factions) && G.factions.some(f => !f.flavor)) {
        G = { ...G, factions: G.factions.map(f => f.flavor ? f : { ...f, flavor: 'bond_first' }) };
      }
      // v0.2 繧｢繝ｼ繧ｭ繧ｿ繧､繝玲僑蠑ｵ: 譌ｧ flavor 繧呈眠 6 遞ｮ縺ｫ繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ・井ｸ蠎ｦ縺縺托ｼ・
      if (Array.isArray(G.factions) && !G._migrated_archetype_v2) {
        G = {
          ...G,
          factions: G.factions.map(f => {
            // 譌ｧ neutral 縺ｯ蜀榊愛螳・竊・邨先據蝙・(bond_first) 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ
            // 譌ｧ authoritativeTag 謖√■縺ｮ neutral 縺ｯ authoritarian 縺ｸ
            let newFlavor = f.flavor || 'bond_first';
            if (newFlavor === 'neutral') {
              newFlavor = f.authoritativeTag ? 'authoritarian' : 'bond_first';
            }
            // 繧ｿ繧ｰ縺ｮ謨ｴ蜷域ｧ遒ｺ菫・
            return {
              ...f,
              flavor: newFlavor,
              bondTag: f.bondTag || newFlavor === 'bond_first',
              meritTag: f.meritTag || newFlavor === 'meritocratic',
              heelTag: f.heelTag || newFlavor === 'heel',
              faceTag: f.faceTag || newFlavor === 'face',
              combatTag: f.combatTag || newFlavor === 'combat',
              authoritativeTag: f.authoritativeTag || newFlavor === 'authoritarian',
            };
          }),
          _migrated_archetype_v2: true,
        };
      }

      // 豢ｾ髢･縺ｮ驥崎､・園螻槭ｒ菫ｮ蠕ｩ・・hase 3c 繧ｻ繝・す繝ｧ繝ｳ縺ｧ逋ｺ隕九＆繧後◆譌｢蟄倥そ繝ｼ繝悶・繝・・繧ｿ遐ｴ邯ｻ蟇ｾ蠢懶ｼ・
      if (!G._migrated_faction_dedupe_v1) {
        if (Engine.factions && typeof Engine.factions._dedupeFactionMembers === 'function') {
          G = Engine.factions._dedupeFactionMembers(G);
        }
        G = { ...G, _migrated_faction_dedupe_v1: true };
      }

      if (!G._migrated_h2h_orgTimeline_v1) {
        if (!G.h2h) G = { ...G, h2h: {} };
        // 蜈ｨ繝輔ぃ繧､繧ｿ繝ｼ縺ｫorgTimeline蛻晄悄繧ｨ繝ｳ繝医Μ繧堤函謌・
        const addTimeline = fighters => fighters.map(f => {
          if (f.orgTimeline) return f;
          return { ...f, orgTimeline: [{ orgId: f._orgId || f.orgId || 'fa', fromSeason: 1, fromWeek: 1 }] };
        });
        G = { ...G, roster: addTimeline(G.roster || []), freeAgents: addTimeline(G.freeAgents || []) };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: addTimeline(od.roster || []) };
          });
          G = { ...G, aiOrgs: migAi };
        }
        G = { ...G, _migrated_h2h_orgTimeline_v1: true };
      }
      if (!G._migrated_orgTimeline_v3) {
        const normalizeTimeline = (fighters, orgIdResolver) => (fighters || []).map(f => {
          if (!f) return f;
          const orgId = typeof orgIdResolver === 'function' ? orgIdResolver(f) : orgIdResolver;
          if (orgId) return Engine.orgTimeline.syncCurrentEntry(f, orgId, G.season || 1, G.week || 1);
          return f?.orgTimeline ? { ...f, orgTimeline: Engine.orgTimeline.normalize(f.orgTimeline) } : f;
        });
        G = {
          ...G,
          roster: normalizeTimeline(G.roster || [], 'player'),
          freeAgents: normalizeTimeline(G.freeAgents || [], 'fa'),
          retiredFighters: normalizeTimeline(G.retiredFighters || [], null),
          hallOfFame: normalizeTimeline(G.hallOfFame || [], null),
          _migrated_orgTimeline_v3: true,
        };
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: normalizeTimeline(od.roster || [], orgId) };
          });
          G = { ...G, aiOrgs: migAi };
        }
      }
      if (!G._migrated_growthLog) {
        G = { ...G, roster: G.roster.map(c => c.growthLog ? c : { ...c, growthLog: [] }), _migrated_growthLog: true };
      }
      if (!G._migrated_junior_hof_v1) {
        // careerRecord 縺ｫ juniorTournamentWins/juniorTournamentAppearances/ppvMainEventWins 繧定｣懷ｮ・
        const _addHofFields = (fighters) => (fighters || []).map(f => {
          if (!f.careerRecord) return f;
          const rec = { ...f.careerRecord };
          if (rec.juniorTournamentWins === undefined) rec.juniorTournamentWins = 0;
          if (rec.juniorTournamentAppearances === undefined) rec.juniorTournamentAppearances = 0;
          if (rec.ppvMainEventWins === undefined) rec.ppvMainEventWins = 0;
          return { ...f, careerRecord: rec };
        });
        G = {
          ...G,
          roster: _addHofFields(G.roster),
          freeAgents: _addHofFields(G.freeAgents),
          retiredFighters: _addHofFields(G.retiredFighters),
          _migrated_junior_hof_v1: true,
        };
        // AI蝗｣菴薙・roster縺ｫ繧る←逕ｨ
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: _addHofFields(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
      }

      // v2.0 HOF諡｡蠑ｵ: allHallOfFame 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_allHallOfFame_v1) {
        const existingHof = G.hallOfFame || [];
        const playerHof = existingHof.map(h => ({
          ...h,
          orgId: 'player',
          orgName: h.orgName || G.orgName || '縺ゅ↑縺溘・蝗｣菴・,
          careerHighlights: h.careerHighlights || Engine.awards.buildCareerHighlights(h, h.orgName || G.orgName || '縺ゅ↑縺溘・蝗｣菴・),
          retireOVR: h.retireOVR || h.ovr || 0,
          retireAge: h.retireAge || 0,
        }));
        G = {
          ...G,
          allHallOfFame: { player: playerHof, org_s: [], org_a: [], org_b: [] },
          hallOfFame: playerHof,
          _migrated_allHallOfFame_v1: true,
        };
      }

      // v2.0 HOF諡｡蠑ｵv2: hofPoints/hofLevel 蜀崎ｨ育ｮ励・繧､繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_allHallOfFame_v2) {
        const _recalcHof = entry => {
          const pts = (entry.titleReigns || 0) + (entry.totalDefenses || 0)
            + (entry.juniorTournamentWins || 0) * 6 + (entry.ppvMainEventWins || 0) * 7;
          const lv = pts >= 35 ? 3 : pts >= 22 ? 2 : pts >= 15 ? 1 : 0;
          return { ...entry, hofPoints: pts, hofLevel: lv };
        };
        const allHof = G.allHallOfFame || { player: [], org_s: [], org_a: [], org_b: [] };
        const fixedHof = {};
        ['player', 'org_s', 'org_a', 'org_b'].forEach(key => {
          fixedHof[key] = (allHof[key] || []).map(_recalcHof);
        });
        G = { ...G, allHallOfFame: fixedHof, hallOfFame: fixedHof.player, _migrated_allHallOfFame_v2: true };
      }

      // 菫ｮ豁｣D: battleWinsTotal 蛻晄悄蛹悶・繧､繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G.battleWinsTotal) {
        G = { ...G, battleWinsTotal: { player: 0, org_s: 0, org_a: 0, org_b: 0 } };
      }

      // 蝗｣菴灘ｹｴ莉｣險・v0.1 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ (chronicle-system-spec-v0.1.md)
      if (!G._migrated_chronicle_v1) {
        const chEmpty = Engine.chronicle.createEmpty();
        const peakPopularityOf = (f, fallbackSeason) => {
          const cr = f.careerRecord || {};
          const peakPopularity = Math.round(cr.peakPopularity ?? f.peakPopularity ?? f.popularity ?? f.pop ?? 0);
          const peakPopularitySeason = cr.peakPopularitySeason || f.peakPopularitySeason || fallbackSeason || 1;
          return { peakPopularity, peakPopularitySeason };
        };
        // HoF player 繧ｨ繝ｳ繝医Μ繧・archive 蠖｢蠑上↓螟画鋤
        const hofToArchive = (h) => {
          const cr = h.careerRecord || {};
          const hist = cr.history || [];
          const debutEv = hist.find(e => e.type === 'debut' || e.type === 'draft' || e.type === 'scout');
          const start = debutEv ? (debutEv.season || 1) : 1;
          const end = h.inductionSeason || G.season || start;
          const pk = cr.peakOVR || h.retireOVR || h.ovr || 0;
          const { peakPopularity, peakPopularitySeason } = peakPopularityOf(h, end);
          return {
            id: h.id,
            name: h.name,
            style: h.style || 'allround',
            personality: h.personality,
            archetype: h.archetype,
            peakOVR: pk,
            peakOVRSeason: cr.peakOVRSeason || end,
            peakPopularity,
            peakPopularitySeason,
            careerSeasonsStart: start,
            careerSeasonsEnd: end,
            titleReigns: h.titleReigns || cr.totalTitleWins || 0,
            totalDefenses: h.totalDefenses || cr.totalDefenses || 0,
            careerRecord: {
              history: hist.map(e => ({ ...e })),
              totalTitleWins: h.titleReigns || cr.totalTitleWins || 0,
              totalDefenses: h.totalDefenses || cr.totalDefenses || 0,
              peakOVR: pk,
              peakOVRSeason: cr.peakOVRSeason || end,
              peakPopularity,
              peakPopularitySeason
            },
            traits: (h.traits || []).filter(t =>
              ['闖ｯ','繝輔ぃ繝ｳ繧ｵ繝ｼ繝薙せ','莠ｺ譛・,'繝繝ｼ繝峨Γ繝ｼ繧ｫ繝ｼ','辭ｱ陦','蜷榊享雋陬ｽ騾讖・,'繧ｬ繝ｩ繧ｹ縺ｮ繝上・繝・].includes(t)
            ),
            retiredSeason: end
          };
        };
        // retiredFighter (player諠ｳ螳・ 繧・archive 蠖｢蠑上↓螟画鋤 (archiveFighter 繝ｭ繧ｸ繝・け逶ｸ蠖・
        const retiredToArchive = (f) => {
          const cr = f.careerRecord || {};
          const hist = cr.history || [];
          const debutEv = hist.find(e => e.type === 'debut' || e.type === 'draft' || e.type === 'scout');
          const start = debutEv ? (debutEv.season || 1) : 1;
          const end = G.season || start;
          const pk = cr.peakOVR || (Engine.util.ov && Engine.util.ov(f)) || 0;
          const { peakPopularity, peakPopularitySeason } = peakPopularityOf(f, end);
          return {
            id: f.id,
            name: f.name,
            style: f.style,
            personality: f.personality,
            archetype: f.archetype,
            peakOVR: pk,
            peakOVRSeason: cr.peakOVRSeason || end,
            peakPopularity,
            peakPopularitySeason,
            careerSeasonsStart: start,
            careerSeasonsEnd: end,
            titleReigns: cr.totalTitleWins || 0,
            totalDefenses: cr.totalDefenses || 0,
            careerRecord: {
              history: hist.map(e => ({ ...e })),
              totalTitleWins: cr.totalTitleWins || 0,
              totalDefenses: cr.totalDefenses || 0,
              peakOVR: pk,
              peakOVRSeason: cr.peakOVRSeason || end,
              peakPopularity,
              peakPopularitySeason
            },
            traits: (f.traits || []).filter(t =>
              ['闖ｯ','繝輔ぃ繝ｳ繧ｵ繝ｼ繝薙せ','莠ｺ譛・,'繝繝ｼ繝峨Γ繝ｼ繧ｫ繝ｼ','辭ｱ陦','蜷榊享雋陬ｽ騾讖・,'繧ｬ繝ｩ繧ｹ縺ｮ繝上・繝・].includes(t)
            ),
            retiredSeason: end
          };
        };
        const archivePlayer = [
          ...((G.allHallOfFame && G.allHallOfFame.player) || []).map(hofToArchive),
          ...((G.retiredFighters) || []).map(retiredToArchive)
        ];
        // 驥崎､・賜髯､ (id 繝吶・繧ｹ)
        const seenIds = new Set();
        const uniqueArchive = [];
        archivePlayer.forEach(a => {
          if (!a.id || seenIds.has(a.id)) return;
          seenIds.add(a.id);
          uniqueArchive.push(a);
        });
        // spirit 縺ｮ驕｡蜿顔ｩ咲ｮ・
        const spirit = { striker: 0, grappler: 0, submission: 0, brawler: 0, allround: 0 };
        uniqueArchive.forEach(a => {
          const axis = Engine.chronicle._styleAxis(a.style);
          spirit[axis] = (spirit[axis] || 0) + Engine.chronicle.calcSpiritContribution(a);
        });
        G = {
          ...G,
          chronicle: {
            ...chEmpty,
            spirit,
            fighterArchive: uniqueArchive
          },
          _migrated_chronicle_v1: true
        };
        // 蛻晏屓遶逕滓・
        try {
          G = Engine.chronicle.buildChapters(G, { forceRebuild: true });
        } catch (e) {
          console.warn('[chronicle] 蛻晏屓遶逕滓・縺ｫ螟ｱ謨・', e);
        }
      }

      // v0.2: coachSlots 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ・域里蟄倥そ繝ｼ繝悶・髮・畑貂医∩繧ｳ繝ｼ繝∵焚縺ｫ蜷医ｏ縺帙※譫繧貞・譛溷喧・・
      // Chronicle v0.2: rebuild old save caches after chapter confirmation rule changes.
      if (!G._migrated_chronicle_status_v2 && G.chronicle && Engine.chronicle) {
        try {
          G = Engine.chronicle.refreshChapters
            ? Engine.chronicle.refreshChapters(G)
            : Engine.chronicle.buildChapters(G, { forceRebuild: true });
        } catch (e) {
          console.warn('[chronicle] status v2 rebuild failed', e);
        }
        G = { ...G, _migrated_chronicle_status_v2: true };
      }

      // Chronicle v0.3: rebuild old save caches after prime-era segmentation changes.
      if (!G._migrated_chronicle_prime_v3 && G.chronicle && Engine.chronicle) {
        try {
          G = Engine.chronicle.refreshChapters
            ? Engine.chronicle.refreshChapters(G)
            : Engine.chronicle.buildChapters(G, { forceRebuild: true });
        } catch (e) {
          console.warn('[chronicle] prime v3 rebuild failed', e);
        }
        G = { ...G, _migrated_chronicle_prime_v3: true };
      }

      if (!G._migrated_coachSlots_v1) {
        const hiredCount = (G.coaches || []).length;
        G = { ...G, coachSlots: Math.max(1, hiredCount), _migrated_coachSlots_v1: true };
      }

      // Speed 竊・Aerial 繧ｹ繧ｿ繧､繝ｫ蜷阪・繧､繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      // 邨ｶ蟇ｾ騾ｱ險育ｮ励ｒ52騾ｱ蝓ｺ貅問・48騾ｱ蝓ｺ貅悶↓邨ｱ荳
      // 譌ｧ蛟､縺ｮ豁｣遒ｺ縺ｪ騾・ｮ励・荳榊庄閭ｽ縺ｪ縺溘ａ縲，D邉ｻ繝輔ぅ繝ｼ繝ｫ繝峨ｒ繝ｪ繧ｻ繝・ヨ縺励※螳牙・縺ｫ遘ｻ陦・
      if (!G._migrated_absweek48_v1) {
        // GameState逶ｴ荳九・CD繝輔ぅ繝ｼ繝ｫ繝・ 繝ｪ繧ｻ繝・ヨ(CD縺梧掠縺丞・繧後ｋ譁ｹ蜷・辟｡螳ｳ)
        const patchState = {};
        if (G.lastIntrusionWeek) patchState.lastIntrusionWeek = 0;
        if (G.lastLargeEventWeek) patchState.lastLargeEventWeek = 0;
        // _snapshotCooldowns: 蜈ｨ繝ｪ繧ｻ繝・ヨ(6騾ｱCD縺ｪ縺ｮ縺ｧ蜊ｳ蝗槫ｾｩ)
        patchState._snapshotCooldowns = {};
        // lastTitleShowWeek: 譌ｧ蠑・season*48)縺ｮ繝舌げ蛟､竊・繝ｪ繧ｻ繝・ヨ
        // careStockLastRecovery: 蜈・°繧・8蝓ｺ貅悶□縺悟ｿｵ縺ｮ縺溘ａ繝ｪ繧ｻ繝・ヨ
        const fixFighter = c => {
          const patch = {};
          if (c.lastTitleShowWeek) patch.lastTitleShowWeek = 0;
          return Object.keys(patch).length ? { ...c, ...patch } : c;
        };
        G = {
          ...G,
          ...patchState,
          roster: G.roster.map(fixFighter),
          _migrated_absweek48_v1: true
        };
      }

      if (!G._migrated_style_aerial_v1) {
        const fixStyle = c => c.style === 'Speed' ? { ...c, style: 'Aerial' } : c;
        G = {
          ...G,
          roster: G.roster.map(fixStyle),
          freeAgents: (G.freeAgents || []).map(fixStyle),
          aiOrgs: Object.fromEntries(Object.entries(G.aiOrgs || {}).map(([k, org]) => [k, { ...org, roster: (org.roster || []).map(fixStyle) }])),
          _migrated_style_aerial_v1: true
        };
      }

      // _everFoughtPairs 蠕ｩ蜈・ 繝医Μ繝溘Φ繧ｰ縺ｧ螟ｱ繧上ｌ縺溷・鬘泌粋繧上○蛻､螳夂畑繝壹い繧知atchupLog縺ｫ陬懷ｮ・
      if (G._everFoughtPairs && G._everFoughtPairs.length > 0) {
        const existing = new Set((G.matchupLog || []).map(e => {
          const a = Math.min(e.leftId, e.rightId), b = Math.max(e.leftId, e.rightId);
          return `${a}>${b}`;
        }));
        const restored = G._everFoughtPairs
          .filter(p => !existing.has(p))
          .map(p => {
            const [a, b] = p.split('>').map(Number);
            return { leftId: a, rightId: b, showCount: 0 }; // showCount=0: 魄ｮ蠎ｦ遯灘､・
          });
        if (restored.length > 0) {
          G = { ...G, matchupLog: [...restored, ...(G.matchupLog || [])] };
        }
        delete G._everFoughtPairs;
      }

      // stat髱樊紛謨ｰ菫ｮ豁｣: 邱ｴ鄙呈・髟ｷ縺ｮ豬ｮ蜍募ｰ乗焚轤ｹ闢・ｩ阪ｒ荳諡ｬ菫ｮ豁｣
      if (!G._migrated_stat_round_v1) {
        const STATS = ['pw', 'sp', 'te', 'st', 'mn'];
        const roundStats = c => {
          let changed = false;
          const nc = { ...c };
          STATS.forEach(s => { if (typeof nc[s] === 'number' && !Number.isInteger(nc[s])) { nc[s] = Math.round(nc[s]); changed = true; } });
          return changed ? nc : c;
        };
        G = {
          ...G,
          roster: G.roster.map(roundStats),
          freeAgents: (G.freeAgents || []).map(roundStats),
          aiOrgs: Object.fromEntries(Object.entries(G.aiOrgs || {}).map(([k, org]) => [k, { ...org, roster: (org.roster || []).map(roundStats) }])),
          _migrated_stat_round_v1: true
        };
      }

      // 蝗｣菴薙い繧､繧ｳ繝ｳ: playerOrgIcon 譛ｪ螳夂ｾｩ譎ゅ・繝・ヵ繧ｩ繝ｫ繝・
      if (G.playerOrgIcon == null) {
        G = { ...G, playerOrgIcon: 0 };
      }

      // 讌ｭ逡悟ｺ穂ｸ翫￡: 譌｢縺ｫ繧ｯ繝ｪ繧｢貂医∩縺ｮ譌ｧ繧ｻ繝ｼ繝悶↓繝輔Λ繧ｰ陬懈ｭ｣ + 譁ｰ繧ｻ繝ｬ繝｢繝九・蜀咲匱轣ｫ
      if (G.endingCleared && !G._migrated_leagueElevation_v2) {
        // leagueElevated貂医∩縺ｧ繧よ眠繧ｻ繝ｬ繝｢繝九・譛ｪ陦ｨ遉ｺ縺ｪ繧牙・逋ｺ轣ｫ縺輔○繧・
        G = { ...G, leagueElevated: true, _pendingLeagueElevation: true, endingShown: true, _migrated_leagueElevation_v2: true };
      }

      // dormantPool譫ｯ貂・舞貂・ 髟ｷ譛溘・繝ｬ繧､縺ｧ繝励・繝ｫ縺檎ｩｺ縺ｫ縺ｪ縺｣縺溘そ繝ｼ繝悶ｒ蝗槫ｾｩ
      // Legacy dormantPool refill migration retired; bounded recovery is handled elsewhere.
      if (!G._migrated_dormantPool_refill_v1) {
        G = { ...G, _migrated_dormantPool_refill_v1: true };
      }
      // FA蜊ｳ譎り｣懷・: 繝ｭ繝ｼ繝臥峩蠕後↓FA縺悟ｰ代↑縺・→繧ｹ繧ｫ繧ｦ繝育判髱｢縺後⊇縺ｼ遨ｺ縺ｮ縺ｾ縺ｾ譛螟ｧ3騾ｱ蠕・■縺ｫ縺ｪ繧九◆繧√・
      // pool縺九ｉFA縺ｸ蜊ｳ蠎ｧ縺ｫ霑ｽ蜉縺吶ｋ・域ｯ弱Ο繝ｼ繝画凾繝√ぉ繝・け縲√ヵ繝ｩ繧ｰ縺ｪ縺暦ｼ・
      {
        const curFA = G.freeAgents || [];
        const FA_MIN = 3; // 縺薙・莠ｺ謨ｰ譛ｪ貅縺ｪ繧芽｣懷・
        if (curFA.length < FA_MIN) {
          const faPool = G.dormantPool || [];
          const faOccupied = new Set(curFA.map(c => c.id));
          (G.roster || []).forEach(c => faOccupied.add(c.id));
          Object.values(G.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => faOccupied.add(c.id)));
          const eligible = faPool.filter(e => (e.age || 17) < 21 && !faOccupied.has(e.id));
          const needed = FA_MIN - curFA.length; // 荳崎ｶｳ蛻・□縺題｣懷・
          if (eligible.length > 0 && needed > 0) {
            const faRng = Engine.rng.create(Engine.rng.derive(G.rngSeed || 1, G.season || 1, G.week || 1, 0xFA01));
            const pick = eligible.slice(0, Math.min(needed, eligible.length));
            const pickIds = new Set(pick.map(e => e.id));
            const newFA = pick.map(e => {
              const template = ALL_CHARS.find(c => c.id === e.id);
              if (!template) return null;
              return Engine.rival.makeAIFighter(template, faRng, null, e.age || 17);
            }).filter(Boolean);
            if (newFA.length > 0) {
              G = { ...G,
                freeAgents: [...curFA, ...newFA],
                dormantPool: faPool.filter(e => !pickIds.has(e.id))
              };
              console.log(`[WM Load] FA蜊ｳ譎り｣懷・: ${newFA.map(f => f.name).join('縲・)}`);
            }
          }
        }
      }

      // 謌宣聞繝槭う繝ｫ繧ｹ繝医・繝ｳ騾夂衍 繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      if (!G._migrated_milestoneNotified_v1) {
        if (G._lastMilestoneAbsWeek === undefined) {
          G._lastMilestoneAbsWeek = (G.season - 1) * 48 + G.week;
        }
        const _MS_OVR = [65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115];
        const _MS_POP = [50, 60, 70, 80, 90, 95];
        const _initMN = (c) => {
          if (c._milestonesNotified) return c;
          const ovr = Engine.util.ov(c);
          return { ...c, _milestonesNotified: {
            ovr: _MS_OVR.filter(t => ovr >= t),
            pop: _MS_POP.filter(t => (c.popularity || 0) >= t),
            cap: ['pw', 'sp', 'te', 'st', 'mn'].filter(s => c.trainCap && c[s] >= c.trainCap[s]),
          } };
        };
        G.roster = G.roster.map(_initMN);
        if (G.freeAgents) G.freeAgents = G.freeAgents.map(_initMN);
        if (G.aiOrgs) {
          const ao = {};
          for (const [k, v] of Object.entries(G.aiOrgs)) {
            ao[k] = v.roster ? { ...v, roster: v.roster.map(_initMN) } : v;
          }
          G.aiOrgs = ao;
        }
        G._migrated_milestoneNotified_v1 = true;
      }

      // affinityAxis 蠕御ｻ倥￠ (relationship-affinity-spec-v1.0 ﾂｧ3.2)
      if (!G._migrated_affinity_v1) {
        G = Engine.relationships.migrateAffinityAxisV1(G);
      }

      {
        const repair = Engine.saveDoctor.repairOnLoad(G);
        if (repair.changed) {
          G = repair.state;
          const note = `繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ閾ｪ蜍穂ｿｮ蠕ｩ: ${repair.changes.join(', ')}`;
          G = { ...G, gameLog: [...(G.gameLog || []), note] };
          console.log(`[WM Load Repair] ${note}`);
        }
      }

      return true;
    } catch(e) {
      G = prevG;
      console.error('Load failed:', e);
      return false;
    }
  },

  save(slot) {
    try {
      localStorage.setItem(SAVE_KEY + slot, Storage.serialize(G));
      G = { ...G, gameLog: [...G.gameLog, `沈 繧ｹ繝ｭ繝・ヨ${slot}縺ｫ繧ｻ繝ｼ繝悶＠縺ｾ縺励◆`] };
      refreshAll();
      return true;
    } catch(e) { alert('繧ｻ繝ｼ繝悶↓螟ｱ謨励＠縺ｾ縺励◆: ' + e.message); return false; }
  },

  load(slot) {
    const data = localStorage.getItem(SAVE_KEY + slot);
    if (!data) { alert('繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ縺後≠繧翫∪縺帙ｓ'); return false; }
    if (Storage.deserialize(data)) {
      G = { ...G, gameLog: [...G.gameLog, `唐 繧ｹ繝ｭ繝・ヨ${slot}縺九ｉ繝ｭ繝ｼ繝峨＠縺ｾ縺励◆`] };
      if (G.weekPhase === 'showPrep') G = { ...G, weekPhase: 'manage' };
      refreshAll();
      // PPV繝輔ぉ繝ｼ繧ｺ縺ｮ蠕ｩ蟶ｰ: 繧ｪ繝ｼ繝舌・繝ｬ繧､繧貞・蛻晄悄蛹・
      if (G.weekPhase === 'ppvShow') App.initPPVShow();
      else if (G.weekPhase === 'ppvTV') App.initPPVTV();
      return true;
    }
    alert('繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲ゅさ繝ｳ繧ｽ繝ｼ繝ｫ繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
    return false;
  },

  autoSave() {
    if (window.IS_TRIAL) return; // 菴馴ｨ鍋沿: 繧ｪ繝ｼ繝医そ繝ｼ繝也┌蜉ｹ・域焔蜍・繧ｹ繝ｭ繝・ヨ縺ｮ縺ｿ・・
    if (G.weekPhase === 'gameover') return; // 繧ｲ繝ｼ繝繧ｪ繝ｼ繝舌・譎ゅ・荳頑嶌縺阪＠縺ｪ縺・
    try { localStorage.setItem(AUTOSAVE_KEY, Storage.serialize(G)); } catch(e) { console.warn('[WM] 繧ｪ繝ｼ繝医そ繝ｼ繝門､ｱ謨・', e.message); }
  },

  loadAutoSave() {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (data && Storage.deserialize(data)) {
      if (G.weekPhase === 'showPrep') G = { ...G, weekPhase: 'manage' };
      refreshAll();
      // PPV繝輔ぉ繝ｼ繧ｺ縺ｮ蠕ｩ蟶ｰ: 繧ｪ繝ｼ繝舌・繝ｬ繧､繧貞・蛻晄悄蛹・
      if (G.weekPhase === 'ppvShow') App.initPPVShow();
      else if (G.weekPhase === 'ppvTV') App.initPPVTV();
      return true;
    }
    return false;
  },

  getAutoSaveInfo() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      const s = Storage._parseRaw(raw);
      return { season: s.season, week: s.week, funds: s.funds, date: s._saveDate };
    } catch { return null; }
  },

  getSaveInfo(slot) {
    try {
      const raw = localStorage.getItem(SAVE_KEY + slot);
      if (!raw) return null;
      const s = Storage._parseRaw(raw);
      return { season: s.season, week: s.week, funds: s.funds, date: s._saveDate, version: s._saveVersion, orgPop: s.orgPop || 0, rosterSize: s.roster ? s.roster.length : 0 };
    } catch { return null; }
  },

  deleteSave(slot) {
    localStorage.removeItem(SAVE_KEY + slot);
  },

  exportToFile(slotOrAuto) {
    const key = slotOrAuto === 'auto' ? AUTOSAVE_KEY : SAVE_KEY + slotOrAuto;
    const raw = localStorage.getItem(key);
    if (!raw) { alert('繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ縺後≠繧翫∪縺帙ｓ'); return; }

    const parsed = Storage._parseRaw(raw);
    const datePart = new Date().toISOString().slice(0, 10);
    const seasonPart = `S${parsed.season || 1}W${parsed.week || 1}`;
    const slotLabel = slotOrAuto === 'auto' ? 'auto' : `slot${slotOrAuto}`;
    const filename = `wm_save_${slotLabel}_${seasonPart}_${datePart}.json`;

    const jsonStr = JSON.stringify(parsed);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const raw = ev.target.result;

        try {
          const parsed = JSON.parse(raw);
          if (!parsed.season || !parsed.roster || !parsed.rngSeed) {
            alert('譛牙柑縺ｪ繧ｻ繝ｼ繝悶ョ繝ｼ繧ｿ縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ');
            return;
          }
        } catch {
          alert('繝輔ぃ繧､繝ｫ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆');
          return;
        }

        if (Storage.deserialize(raw)) {
          G = { ...G, gameLog: [...G.gameLog, '唐 繝輔ぃ繧､繝ｫ縺九ｉ繝・・繧ｿ繧定ｪｭ縺ｿ霎ｼ縺ｿ縺ｾ縺励◆'] };
          if (G.weekPhase === 'showPrep') G = { ...G, weekPhase: 'manage' };
          refreshAll();
          if (G.weekPhase === 'ppvShow') App.initPPVShow();
          else if (G.weekPhase === 'ppvTV') App.initPPVTV();
          if (App._refreshTicker) App._refreshTicker();
          Audio.bgm.playForState();
          Audio.play('save');
        } else {
          alert('繝・・繧ｿ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲ゅヵ繧｡繧､繝ｫ縺檎ｴ謳阪＠縺ｦ縺・ｋ蜿ｯ閭ｽ諤ｧ縺後≠繧翫∪縺吶・);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
};

// Alias for backward compat in UI
function saveGame(slot) { Audio.play('save'); return Storage.save(slot); }
function loadGame(slot) {
  Audio.play('select');
  const r = Storage.load(slot);
  if (r && App._refreshTicker) App._refreshTicker();
  Audio.bgm.playForState();
  // 讌ｭ逡悟ｺ穂ｸ翫￡繧ｻ繝ｬ繝｢繝九・: 繝ｭ繝ｼ繝臥峩蠕後↓譛ｪ陦ｨ遉ｺ縺ｪ繧牙叉陦ｨ遉ｺ
  if (r && G._pendingLeagueElevation) {
    refreshAll();
    setTimeout(() => {
      const { _pendingLeagueElevation: _, ...cleanG } = G;
      G = cleanG;
      showLeagueElevationCeremony(G, () => { Storage.autoSave(); refreshAll(); });
    }, 500);
  }
  return r;
}
function deleteSave(slot) { Audio.play('click'); Storage.deleteSave(slot); refreshAll(); }

// 笊披武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶風
// 笊・ SECTION 8: APP BRIDGE (v0.85)                            笊・
// 笊・ UI 竊・Engine bridge layer                                 笊・
// 笊壺武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶幅

// Global game state 窶・the single source of truth
let G = Engine.createInitialState();

// Running RNG state for the current session
let sessionRng = Engine.rng.create(G.rngSeed);

// 笏笏 Legacy utility aliases (for UI code backward compat) 笏笏
function ov(c) { return Engine.util.ov(c); }
function getSalary(c) { return Engine.util.getSalary(c, G.titles); }
function isShowWeek(w) { return Engine.util.isShowWeek(w); }
function getQuarter(w) { return Engine.util.getQuarter(w); }
function isSpecialShow(w) { return Engine.util.isSpecialShow(w); }
function isPPV(w) { return Engine.util.isPPV(w); }
function getHeatLevel() { return Engine.heat.getLevel(G); }
function getWorldChampion() { return Engine.title.getWorldChampion(G); }
function getHiredCoaches() { return Engine.coach.getHiredCoaches(G); }
function getCharCoach(charId) { return Engine.coach.getCharCoach(G, charId); }
function getPotentialPct(c) { return Engine.util.getPotentialPct(c); }
function getPotentialLabel(c) { return Engine.util.getPotentialLabel(c); }
function getRivalryLevel(id1, id2) { return Engine.title.getRivalryLevel(G, id1, id2); }

function archiveRetiredRivalryState(state, fighter) {
  if (!state || !fighter || fighter.id == null) return state;

  const relationships = { ...(state.relationships || {}) };
  const rivalries = { ...(state.rivalries || {}) };
  const history = [...(state.relationshipHistory || [])];
  const fighterId = fighter.id;
  const fighterMap = new Map();
  const register = candidate => {
    if (candidate && candidate.id != null) fighterMap.set(candidate.id, candidate);
  };

  (state.roster || []).forEach(register);
  (state.retiredFighters || []).forEach(register);
  (state.freeAgents || []).forEach(register);
  Object.values(state.aiOrgs || {}).forEach(org => (org.roster || []).forEach(register));
  register(fighter);

  const pairKeys = new Set();
  Object.keys(relationships).forEach(key => {
    const sepIdx = key.indexOf('>');
    const idA = Number(key.substring(0, sepIdx));
    const idB = Number(key.substring(sepIdx + 1));
    if (idA !== fighterId && idB !== fighterId) return;
    if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) {
      pairKeys.add(Engine.title.getRivalryKey(idA, idB));
    }
    delete relationships[key];
  });

  Object.keys(rivalries).forEach(pairKey => {
    const ids = pairKey.split('-').map(Number);
    const id1 = ids[0];
    const id2 = ids[1];
    if (id1 !== fighterId && id2 !== fighterId) return;
    pairKeys.add(pairKey);
  });

  pairKeys.forEach(pairKey => {
    const ids = pairKey.split('-').map(Number);
    const id1 = ids[0];
    const id2 = ids[1];
    if (!Number.isFinite(id1) || !Number.isFinite(id2) || id1 === id2) return;

    const rel12 = (state.relationships || {})[String(id1) + '>' + String(id2)] || null;
    const rel21 = (state.relationships || {})[String(id2) + '>' + String(id1)] || null;
    const rivalryEntry = (state.rivalries || {})[pairKey] || null;
    if (!rel12 && !rel21 && !rivalryEntry) return;

    const fighter1 = fighterMap.get(id1) || null;
    const fighter2 = fighterMap.get(id2) || null;
    const archiveEntry = {
      id1,
      id2,
      reason: 'retirement',
      retiredFighterId: fighterId,
      season: state.season || 1,
      week: state.week || 1,
      age1: fighter1?.age ?? null,
      age2: fighter2?.age ?? null,
      bond12: rel12?.bond ?? 50,
      bond21: rel21?.bond ?? 50,
      rivalry12: rel12?.rivalry ?? 0,
      rivalry21: rel21?.rivalry ?? 0,
      rivalryMeta: rivalryEntry ? { ...rivalryEntry } : null,
    };

    const existingIdx = history.findIndex(entry =>
      entry &&
      entry.reason === 'retirement' &&
      entry.retiredFighterId === fighterId &&
      ((entry.id1 === id1 && entry.id2 === id2) || (entry.id1 === id2 && entry.id2 === id1))
    );
    if (existingIdx >= 0) history[existingIdx] = archiveEntry;
    else history.push(archiveEntry);

    delete rivalries[pairKey];
  });

  return { ...state, relationships, rivalries, relationshipHistory: history };
}
// 笏笏 App Commands (G mutation ONLY via G = newState) 笏笏
let _pendingOrgName = '';
let _pendingOrgIcon = 0;
let _selectedDifficulty = 'normal';
const App = {
  // 笊絶武笊・Title Screen (v1.0) 笊絶武笊・

  restoreBgmForState(delayMs = 0) {
    const restore = () => {
      try { Audio.fileBgm.stop(); } catch(e) {}
      try { Audio.bgm.playForState(); } catch(e) {}
    };
    if (delayMs > 0) setTimeout(restore, delayMs);
    else restore();
  },

  // Show the title screen overlay
  showTitleScreen() {
    const titleEl = document.getElementById('titleScreen');
    const orgEl = document.getElementById('orgSetupScreen');
    const diffEl = document.getElementById('difficultyScreen');
    titleEl.style.display = 'flex';
    orgEl.style.display = 'none';
    if (diffEl) diffEl.style.display = 'none';

    // Populate title portraits (pick 7 iconic characters)
    const titleIds = [1, 16, 11, 5, 17, 12, 4];
    const portraitsEl = document.getElementById('titlePortraits');
    portraitsEl.innerHTML = titleIds
      .map(id => { const url = getPortraitUrl(id); return url ? `<img src="${url}" alt="">` : ''; })
      .join('');

    // Show CONTINUE button if autosave exists (菴馴ｨ鍋沿縺ｧ縺ｯ繧ｪ繝ｼ繝医そ繝ｼ繝也┌蜉ｹ)
    const autoInfo = window.IS_TRIAL ? null : Storage.getAutoSaveInfo();
    const contBtn = document.getElementById('titleContinueBtn');
    if (autoInfo) {
      contBtn.style.display = '';
      contBtn.textContent = `CONTINUE 窶・${Engine.util.formatDate(autoInfo.season, autoInfo.week)}`;
    } else {
      contBtn.style.display = 'none';
    }

    // Show LOAD GAME button: always visible, disabled if no saves
    const loadBtn = document.getElementById('titleLoadBtn');
    if (loadBtn) {
      let hasAnySave = !!autoInfo;
      if (!hasAnySave) { for (let i = 1; i <= SAVE_SLOTS; i++) { if (Storage.getSaveInfo(i)) { hasAnySave = true; break; } } }
      loadBtn.disabled = !hasAnySave;
      loadBtn.style.opacity = hasAnySave ? '' : '0.3';
    }
  },

  // "NEW GAME" button from title
  titleNewGame() {
    Audio.play('select');
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('orgSetupScreen').style.display = 'flex';
    // Populate icon grid
    _pendingOrgIcon = 0;
    const grid = document.getElementById('orgIconGrid');
    if (grid) {
      let gh = '';
      for (let i = 0; i < 10; i++) {
        const sel = i === 0 ? 'border:3px solid var(--gold);box-shadow:0 0 12px rgba(212,168,67,0.4)' : 'border:3px solid transparent';
        gh += `<img src="../image/org/org-player-${i}.png" width="64" height="64" data-idx="${i}" style="cursor:pointer;border-radius:8px;${sel};transition:border 0.2s,box-shadow 0.2s" onclick="App.selectOrgIcon(${i})" alt="">`;
      }
      grid.innerHTML = gh;
    }
    // Focus the input
    setTimeout(() => {
      const input = document.getElementById('orgSetupNameInput');
      if (input) { input.value = ''; input.focus(); }
    }, 100);
  },

  // "CONTINUE" button from title
  titleContinue() {
    Audio.play('select');
    document.getElementById('titleScreen').style.display = 'none';
    if (!Storage.loadAutoSave()) {
      Audio.play('error');
      App.showTitleScreen();
      alert('繧ｪ繝ｼ繝医そ繝ｼ繝悶・隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・);
      return;
    }
    sessionRng = Engine.rng.create(G.rngSeed);
    App._refreshTicker(); // v1.4w
    Audio.bgm.playForState();
    refreshAll();
  },

  // "LOAD GAME" button from title 窶・open save/load screen
  titleLoadGame() {
    Audio.play('select');
    document.getElementById('titleScreen').style.display = 'none';
    // Initialize minimal state so save screen can render (skipDraft=true to avoid draft screen)
    G = Engine.createInitialState(undefined, true);
    sessionRng = Engine.rng.create(G.rngSeed);
    G = { ...G, _draftPicks: [], _draftFocus: null, gameLog: [] };
    refreshAll();
    showScreen('save');
    Audio.bgm.play('management');
  },

  // Select org icon (called from icon grid)
  selectOrgIcon(idx) {
    _pendingOrgIcon = idx;
    Audio.play('click');
    const grid = document.getElementById('orgIconGrid');
    if (grid) {
      grid.querySelectorAll('img').forEach(img => {
        const isSelected = parseInt(img.dataset.idx) === idx;
        img.style.border = isSelected ? '3px solid var(--gold)' : '3px solid transparent';
        img.style.boxShadow = isSelected ? '0 0 12px rgba(212,168,67,0.4)' : 'none';
      });
    }
  },

  // Confirm org setup 竊・proceed to difficulty selection
  confirmOrgSetup() {
    const input = document.getElementById('orgSetupNameInput');
    _pendingOrgName = (input && input.value.trim()) || '繝励Ξ繧､繝､繝ｼ蝗｣菴・;
    Audio.play('select');
    document.getElementById('orgSetupScreen').style.display = 'none';
    document.getElementById('difficultyScreen').style.display = 'flex';
    App.selectDifficulty('hard');
  },

  // Select difficulty (update radio UI)
  selectDifficulty(mode) {
    _selectedDifficulty = mode;
    const optNormal = document.getElementById('diffOptNormal');
    const optHard = document.getElementById('diffOptHard');
    const radNormal = document.getElementById('diffRadioNormal');
    const radHard = document.getElementById('diffRadioHard');
    if (optNormal) optNormal.classList.toggle('selected', mode === 'normal');
    if (optHard) optHard.classList.toggle('selected', mode === 'hard');
    if (radNormal) radNormal.textContent = mode === 'normal' ? '笳・ : '笳・;
    if (radHard) radHard.textContent = mode === 'hard' ? '笳・ : '笳・;
  },

  // Confirm difficulty and start game
  confirmDifficulty() {
    Audio.play('award');
    document.getElementById('difficultyScreen').style.display = 'none';
    G = Engine.createInitialState();
    sessionRng = Engine.rng.create(G.rngSeed);
    G = { ...G, orgName: _pendingOrgName, playerOrgIcon: _pendingOrgIcon, difficultyMode: _selectedDifficulty, weekPhase: 'opening', _draftPicks: [], _draftFocus: null, gameLog: [] };
    Audio.bgm.play('kaimaku');
    refreshAll();
  },

  // Back from difficulty to org setup
  backFromDifficulty() {
    Audio.play('click');
    document.getElementById('difficultyScreen').style.display = 'none';
    document.getElementById('orgSetupScreen').style.display = 'flex';
  },

  // Back to title from org setup
  backToTitle() {
    Audio.play('click');
    document.getElementById('orgSetupScreen').style.display = 'none';
    App.showTitleScreen();
  },

  // Focus/unfocus a draft candidate (expand detail panel)
  focusDraftCandidate(charId) {
    if (G.weekPhase !== 'draft') return;
    Audio.play('hover');
    G = { ...G, _draftFocus: G._draftFocus === charId ? null : charId };
    renderWeekScreen();
  },

  // Toggle a draft pick on/off
  toggleDraftPick(charId) {
    if (G.weekPhase !== 'draft') return;
    const picks = G._draftPicks || [];
    const idx = picks.indexOf(charId);
    let newPicks;
    if (idx >= 0) {
      newPicks = picks.filter(id => id !== charId);
      Audio.play('deselect');
    } else if (picks.length < DRAFT_CONFIG.pickCount) {
      const nextPicks = [...picks, charId];
      if (!Engine.draft.canAffordSelection(G, nextPicks, G.rngSeed)) {
        Audio.play('error');
        alert('雉・≡荳崎ｶｳ縺ｧ縺吶ゅｈ繧雁ｮ峨＞蛟呵｣懊ｒ驕ｸ繧薙〒縺上□縺輔＞縲・);
        return;
      }
      newPicks = nextPicks;
      Audio.play('select');
    } else {
      return;
    }
    G = { ...G, _draftPicks: newPicks };
    renderWeekScreen();
  },

  // Confirm draft and start the game
  completeDraft() {
    if (G.weekPhase !== 'draft') return;
    const picks = G._draftPicks || [];
    if (!Engine.draft.isValidPicks(picks)) return;
    if (!Engine.draft.canAffordSelection(G, picks, G.rngSeed)) {
      Audio.play('error');
      alert('雉・≡荳崎ｶｳ縺ｧ縺吶ゅｈ繧雁ｮ峨＞蛟呵｣懊ｒ驕ｸ繧薙〒縺上□縺輔＞縲・);
      return;
    }
    Audio.play('award');
    const rng = Engine.rng.create(G.rngSeed);
    G = Engine.draft.completeDraft(G, picks, rng);
    // NPC險倬鹸邨ｱ荳 Part C: 蜈ｨ驕ｸ謇九・邨梧ｭｴ閾ｪ蜍慕函謌撰ｼ医ラ繝ｩ繝輔ヨ螳御ｺ・ｾ後・繧ｲ繝ｼ繝譛ｬ邱ｨ髢句ｧ句燕・・
    G = Engine.career.generateAllBackstories(G);
    // Phase 1: 莠ｺ髢馴未菫ゅョ繝ｼ繧ｿ蝓ｺ逶､ 窶・蜈ｨ繝壹い縺ｮ蛻晄悄蛟､逕滓・
    G = Engine.relationships.initialize(G);
    // ﾂｧC-6 驕主悉蟇ｾ謌ｦ謌千ｸｾ繝・ャ縺｡荳翫￡ 窶・AI蝗｣菴薙Ο繧ｹ繧ｿ繝ｼ縺ｫ h2h/wins/Bond/Rivalry 繧貞綾繧
    G = Engine.career.generateInheritedRecords(G);
    // v1.3: Record debut event for drafted fighters・育ｵ梧ｭｴ逕滓・蠕後↓荳頑嶌縺・窶・繝励Ξ繧､繝､繝ｼ蝗｣菴薙ョ繝薙Η繝ｼ繧呈ｭ｣蠑剰ｨ倬鹸・・
    G = { ...G, roster: G.roster.map(c => picks.includes(c.id)
      ? Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・, via: 'draft' })
      : c) };
    delete G._draftPicks;
    delete G._draftFocus;
    sessionRng = Engine.rng.create(G.rngSeed);

    // 笏笏 螳御ｺ・ｼ泌・: 5蜷肴ｨｪ荳ｦ縺ｳ髮・粋蜀咏悄 笏笏
    const orgName = G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・;
    // 荳ｦ縺ｳ鬆・ 蝗ｺ螳壹Γ繝ｳ繝舌・蟾ｦ 竊・驕ｸ謚・蜷・竊・蝗ｺ螳壹Γ繝ｳ繝舌・蜿ｳ
    const fixedIds = DRAFT_CONFIG.fixed;
    const teamOrder = [fixedIds[0], ...picks, fixedIds[1]];
    const teamMembers = teamOrder.map(id => {
      const c = G.roster.find(r => r.id === id) || ALL_CHARS.find(r => r.id === id);
      return { id, name: c ? c.name : '???', isFixed: fixedIds.includes(id) };
    });

    const overlay = document.createElement('div');
    overlay.className = 'completion-overlay';
    overlay.innerHTML = `
      <div class="comp-vignette"></div>
      <div class="team-photo">
        ${teamMembers.map(m => {
          const upperUrl = typeof getUpperUrl === 'function' ? getUpperUrl(m.id) : '';
          return `<div class="team-member${m.isFixed ? ' fixed-mark' : ''}">
            ${upperUrl ? `<img src="${upperUrl}" alt="${m.name}">` : '<div style="width:100%;aspect-ratio:2/3;background:#222"></div>'}
            <div class="team-member-name">${m.name}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="comp-text">
        <span class="org-name">${orgName}</span>
        <span class="start">蟋句虚</span>
      </div>
    `;
    document.body.appendChild(overlay);

    // 繝輔ぉ繝ｼ繝峨う繝ｳ
    requestAnimationFrame(() => { requestAnimationFrame(() => { overlay.classList.add('show'); }); });

    // 繧ｯ繝ｪ繝ｼ繝繝・・繝槭ｒ繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・
    const appEl = document.querySelector('.app');
    if (appEl) appEl.classList.remove('draft-cream');

    // 繧ｯ繝ｪ繝・け縺ｧ譛ｬ邱ｨ縺ｸ
    overlay.addEventListener('click', () => {
      overlay.style.transition = 'opacity 1s ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        Audio.bgm.play('management');
        Storage.autoSave();
        refreshAll();
      }, 1000);
    });
  },

  // Initialize a new game (from save/load screen)
  newGame() {
    App.showTitleScreen();
  },

  // Sign a free agent
  signFighter(charId) {
    const idx = G.freeAgents.findIndex(c => c.id === charId);
    if (idx < 0) return;
    const fighter = G.freeAgents[idx];
    // 譛邨る㍾隍・メ繧ｧ繝・け・域怙蠕後・遐ｦ・会ｼ壼酔荳defId縺後Ο繧ｹ繧ｿ繝ｼ縺ｫ譌｢縺ｫ蟄伜惠縺励↑縺・°遒ｺ隱・
    if (G.roster.some(c => c.id === charId)) {
      Audio.play('error'); alert('縺薙・驕ｸ謇九・縺吶〒縺ｫ閾ｪ蝗｣菴薙↓謇螻槭＠縺ｦ縺・∪縺・); return;
    }
    // Gate: check orgPop requirement (pricing-balance-spec ﾂｧ2) 窶・FA context with eliteTicket support
    if (!Engine.scout.canNegotiate(G.orgPop || 0, fighter, 'fa', G)) {
      Audio.play('error'); alert('蝗｣菴薙・遏･蜷榊ｺｦ縺瑚ｶｳ繧翫∪縺帙ｓ・・); return;
    }
    const usedEliteTicket = Engine.scout.isEliteTicketRequired(G.orgPop || 0, fighter, G);
    const finalCost = Engine.scout.getSigningCost(fighter, G.orgPop || 0);
    if (G.funds < finalCost) { Audio.play('error'); alert('雉・≡縺瑚ｶｳ繧翫∪縺帙ｓ・・); return; }
    if (G.roster.filter(f => !f.isRental).length >= (G.rosterCap || 8)) {
      App._queueRosterOverflowSigning({
        source: 'fa',
        fighterId: fighter.id,
        fighter: { ...fighter },
        cost: finalCost,
        meta: { usedEliteTicket }
      });
      return;
    }
    // Ensure all roster-required properties exist (FA from dormant pool via makeAIFighter may lack them)
    const normalized = {
      ...fighter,
      orgId: 'player',
      condition: fighter.condition ?? (70 + Math.floor(Math.random() * 19)),
      schedule: fighter.schedule || 'balance',
      wins: fighter.wins || 0,
      losses: fighter.losses || 0,
      draws: fighter.draws || 0,
      injury: fighter.injury || null,
      seasonGrowth: fighter.seasonGrowth || { pw: 0, sp: 0, te: 0, st: 0, mn: 0 },
      careerSeasons: fighter.careerSeasons || 0,
      intensive: fighter.intensive ?? false,
      intensiveWeeks: fighter.intensiveWeeks || 0,
      lastMatchResult: fighter.lastMatchResult || null,
      losingStreak: fighter.losingStreak || 0,
      preInjuryPop: fighter.preInjuryPop ?? null
    };
    let c = normalized; // FA signing: no popularity reset (transfer reset is for org-to-org moves only)
    c = Engine.chronicle.applySpiritToFighter(c, G.chronicle); // Phase 4: 豌鈴｢ｨ trainCap 陬懈ｭ｣
    // Phase 3: orgJoinWeek險ｭ螳・
    c.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
    // v1.3: Record debut event
    c = Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・, via: 'freeagent' });
    const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
    const newFA = G.freeAgents.filter((_, i) => i !== idx);
    const newRoster = [...G.roster, c];
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    const scoutDisc = Engine.scout.getScoutDiscount(G.orgPop || 0);
    const log = [...G.gameLog, `統 ${c.name}縺ｨ螂醍ｴ・ｼ亥･醍ｴ・≡: ${finalCost}荳・[${tierCfg.label}]${scoutDisc > 0 ? ` / 繧ｹ繧ｫ繧ｦ繝育ｶｲ蜑ｲ蠑・{scoutDisc}%` : ''}・荏];
    if (titleMsg) log.push(titleMsg);
    // v1.9: 騾ｸ譚千音蛻･莠､貂画棧縺ｮ豸郁ｲｻ
    const eliteTicketUpdate = usedEliteTicket ? { eliteTicket: false, eliteTicketUsed: true } : {};
    if (usedEliteTicket) log.push('辞 騾ｸ譚千音蛻･莠､貂画棧繧剃ｽｿ逕ｨ縺励∪縺励◆');
    G = { ...G, funds: G.funds - finalCost, freeAgents: newFA, roster: newRoster, titles, gameLog: log, ...eliteTicketUpdate };
    Audio.play('stamp');
    const faSigningLine = getSigningLine(fighter, 'fa_signing');
    showEventPopup({ type:'fighter', id: fighter.id, name: fighter.name,
      tone:'positive', message: faSigningLine,
      detail:`統 螂醍ｴ・≡: ${finalCost}荳・[${tierCfg.label}]` });
    refreshAll();
  },

  _normalizeFighterForRoster(fighter) {
    return {
      ...fighter,
      seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0, ...(fighter?.seasonGrowth || {}) },
      wins: fighter?.wins ?? 0,
      losses: fighter?.losses ?? 0,
      draws: fighter?.draws ?? 0,
      injury: fighter?.injury ?? null,
      condition: typeof fighter?.condition === 'number' ? fighter.condition : 80,
      schedule: ['balance', 'practice', 'promo', 'rest'].includes(fighter?.schedule) ? fighter.schedule : 'balance',
      intensive: !!fighter?.intensive,
      intensiveWeeks: fighter?.intensiveWeeks || 0,
      lastMatchResult: fighter?.lastMatchResult || null,
      losingStreak: fighter?.losingStreak || 0,
      preInjuryPop: fighter?.preInjuryPop ?? null,
      careerSeasons: fighter?.careerSeasons || 0,
      promoStack: fighter?.promoStack || 0,
    };
  },

  _removeFighterFromShowCard(showCard, fighterId) {
    return (showCard || []).map(match => {
      if (!match) return match;
      const left = match.left === fighterId ? 0 : match.left;
      const right = match.right === fighterId ? 0 : match.right;
      const isTitle = left > 0 && right > 0 ? !!match.isTitle : false;
      return { ...match, left, right, isTitle };
    });
  },

  _releaseFighterForOverflow(charId) {
    const idx = G.roster.findIndex(c => c.id === charId);
    if (idx < 0) return null;
    const target = G.roster[idx];
    if (G.relationships) {
      const releaseRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE45, G.season, charId));
      const colleagueIds = G.roster.filter(f => f.id !== charId).map(f => f.id);
      G = Engine.relationships.applyToRoster(G, charId, colleagueIds, { min: -15, max: -10 }, { min: 0, max: 0 }, releaseRelRng);
      for (const cid of colleagueIds) {
        const colleague = G.roster.find(f => f.id === cid);
        const p = colleague?.personality || 'normal';
        let bMin, bMax;
        if (p === 'bold' || p === 'emotional') { bMin = 0; bMax = 2; }
        else if (p === 'earnest' || p === 'quiet') { bMin = -2; bMax = 0; }
        else { bMin = -1; bMax = 1; }
        G = Engine.relationships.applyFromRoster(G, [cid], charId, { min: bMin, max: bMax }, { min: 0, max: 0 }, releaseRelRng);
      }
    }
    const newRoster = G.roster.filter((_, i) => i !== idx);
    const newShowCard = App._removeFighterFromShowCard(G.showCard, charId);
    const newCoachAssign = Engine.coach.unassignFromCoach(G, charId);
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster, showCard: newShowCard });
    const log = [...G.gameLog, `豆 ${target.name}繧定ｧ｣髮㌔];
    if (titleMsg) log.push(titleMsg);
    const claimResult = Engine.rival.claimDepartedStar(
      Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xD75A, G.season, G.week, charId)),
      { ...G, roster: newRoster, showCard: newShowCard, coachAssign: newCoachAssign, titles, gameLog: log },
      target,
      { fromOrgName: G.orgName || 'player', via: 'release_claim' }
    );
    if (claimResult.claimed) {
      log.push(`Transfer: ${target.name} -> ${claimResult.orgName}${claimResult.ejected ? ` / out: ${claimResult.ejected.name}` : ''}`);
      G = { ...claimResult.state, gameLog: log };
    } else if (Engine.util.canAddToFA(G)) {
      const releasedFighter = Engine.orgTimeline.transfer(target, 'fa', G.season, G.week);
      G = { ...G, roster: newRoster, showCard: newShowCard, freeAgents: [...G.freeAgents, releasedFighter], coachAssign: newCoachAssign, titles, gameLog: log };
    } else {
      G = { ...G, roster: newRoster, showCard: newShowCard, coachAssign: newCoachAssign, titles, gameLog: log };
      G = Engine.util.redirectToDormantPool(G, target);
    }
    return target;
  },

  _queueRosterOverflowSigning(payload) {
    G = { ...G, pendingRosterOverflowSigning: payload };
    Storage.autoSave();
    refreshAll();
    if (typeof showRosterOverflowSigningModal === 'function') {
      setTimeout(() => showRosterOverflowSigningModal(G.pendingRosterOverflowSigning), 50);
    }
  },

  _showRosterOverflowSigningModalIfNeeded(delay = 0) {
    if (!G.pendingRosterOverflowSigning || typeof showRosterOverflowSigningModal !== 'function') return;
    const pending = G.pendingRosterOverflowSigning;
    setTimeout(() => {
      if (!G.pendingRosterOverflowSigning) return;
      if (G.pendingRosterOverflowSigning.source !== pending.source || G.pendingRosterOverflowSigning.fighterId !== pending.fighterId) return;
      showRosterOverflowSigningModal(G.pendingRosterOverflowSigning);
    }, delay);
  },

  cancelRosterOverflowSigning() {
    if (!G.pendingRosterOverflowSigning) return;
    const pending = G.pendingRosterOverflowSigning;
    const update = { pendingRosterOverflowSigning: null };
    if (pending.source === 'negotiation') update.negotiationResult = null;
    G = { ...G, ...update };
    Storage.autoSave();
    refreshAll();
  },

  confirmRosterOverflowSigning(releaseId) {
    const pending = G.pendingRosterOverflowSigning;
    if (!pending) return;
    const releaseTarget = G.roster.find(c => c.id === releaseId && !c.isRental && !c.lastRun);
    if (!releaseTarget) {
      Audio.play('error');
      return;
    }
    if (G.funds < pending.cost) {
      Audio.play('error');
      alert('雉・≡縺瑚ｶｳ繧翫∪縺帙ｓ・・);
      return;
    }
    if (pending.source === 'fa' && !G.freeAgents.some(c => c.id === pending.fighterId)) {
      G = { ...G, pendingRosterOverflowSigning: null };
      refreshAll();
      Audio.play('error');
      alert('蟇ｾ雎｡驕ｸ謇九′蟶ょｴ縺ｫ隕九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・);
      return;
    }
    if (pending.source === 'scout' && !(G.scoutCandidates || []).some(c => c.id === pending.fighterId) && !pending.fighter) {
      G = { ...G, pendingRosterOverflowSigning: null };
      refreshAll();
      Audio.play('error');
      alert('蟇ｾ雎｡驕ｸ謇九′繧ｹ繧ｫ繧ｦ繝亥呵｣懊↓隕九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・);
      return;
    }
    if (pending.source === 'negotiation') {
      const orgData = pending.meta?.fromOrgId ? G.aiOrgs?.[pending.meta.fromOrgId] : null;
      const fighter = orgData?.roster?.find(f => f.id === pending.fighterId);
      if (!orgData || !fighter) {
        G = { ...G, pendingRosterOverflowSigning: null, negotiationResult: null };
        refreshAll();
        Audio.play('error');
        alert('莠､貂牙ｯｾ雎｡縺ｮ驕ｸ謇九′隕九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲・);
        return;
      }
    }
    const released = App._releaseFighterForOverflow(releaseId);
    if (!released) return;
    let signedFighter = pending.fighter;
    let detail = `隗｣髮・ ${released.name}`;
    let message = '螂醍ｴ・′謌千ｫ九＠縺ｾ縺励◆';
    if (pending.source === 'fa') {
      const idx = G.freeAgents.findIndex(c => c.id === pending.fighterId);
      const fighter = G.freeAgents[idx];
      const usedEliteTicket = !!pending.meta?.usedEliteTicket;
      let normalized = App._normalizeFighterForRoster({ ...fighter, orgId: 'player' });
      normalized = Engine.chronicle.applySpiritToFighter(normalized, G.chronicle); // Phase 4: 豌鈴｢ｨ trainCap 陬懈ｭ｣
      normalized.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      normalized = Engine.career.addEvent(normalized, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・, via: 'freeagent' });
      const tierCfg = Engine.scout.getTierConfig(normalized.assessedTier || 'material');
      const scoutDisc = Engine.scout.getScoutDiscount(G.orgPop || 0);
      const newFA = G.freeAgents.filter((_, i) => i !== idx);
      const newRoster = [...G.roster, normalized];
      const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
      const log = [...G.gameLog, `統 ${normalized.name}縺ｨ螂醍ｴ・ｼ亥･醍ｴ・≡: ${pending.cost}荳・ｼ閏${tierCfg.label}]${scoutDisc > 0 ? ` / 繧ｹ繧ｫ繧ｦ繝亥牡蠑・${scoutDisc}%` : ''}`];
      if (titleMsg) log.push(titleMsg);
      if (usedEliteTicket) log.push('辞 騾ｸ譚千音蛻･莠､貂画棧繧剃ｽｿ逕ｨ縺励∪縺励◆');
      G = { ...G, funds: G.funds - pending.cost, freeAgents: newFA, roster: newRoster, titles, gameLog: log, eliteTicket: usedEliteTicket ? false : G.eliteTicket, eliteTicketUsed: usedEliteTicket ? true : G.eliteTicketUsed };
      signedFighter = normalized;
      detail = `隗｣髮・ ${released.name} / 螂醍ｴ・≡: ${pending.cost}荳㌔;
      message = getSigningLine(fighter, 'fa_signing');
    } else if (pending.source === 'scout') {
      const cand = (G.scoutCandidates || []).find(c => c.id === pending.fighterId) || pending.fighter;
      const tierCfg = Engine.scout.getTierConfig(cand.assessedTier || 'material');
      const signed = { ...cand };
      delete signed._notion; delete signed._estimate; delete signed._isSeed;
      delete signed._hasCompetition; delete signed._compMultiplier; delete signed._bidWinRate;
      let normalizedSigned = App._normalizeFighterForRoster(signed);
      normalizedSigned = Engine.chronicle.applySpiritToFighter(normalizedSigned, G.chronicle); // Phase 4: 豌鈴｢ｨ trainCap 陬懈ｭ｣
      normalizedSigned.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      normalizedSigned = Engine.orgTimeline.transfer(normalizedSigned, 'player', G.season, G.week);
      normalizedSigned = Engine.career.addEvent(normalizedSigned, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・, via: 'scout' });
      const candidates = (G.scoutCandidates || []).filter(c => c.id !== pending.fighterId);
      const picks = [...(G.scoutPicks || [])];
      if (!picks.includes(pending.fighterId)) picks.push(pending.fighterId);
      const newRoster = [...G.roster, normalizedSigned];
      const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
      const log = [...G.gameLog, `統 繧ｹ繧ｫ繧ｦ繝育佐蠕・${normalizedSigned.name} [${tierCfg.label}] 螂醍ｴ・≡${pending.cost}荳㌔];
      if (titleMsg) log.push(titleMsg);
      G = { ...G, roster: newRoster, scoutCandidates: candidates, scoutPicks: picks, funds: G.funds - pending.cost, titles, gameLog: log };
      signedFighter = normalizedSigned;
      detail = `隗｣髮・ ${released.name} / 螂醍ｴ・≡: ${pending.cost}荳㌔;
      message = getSigningLine(cand, pending.meta?.choice === 'direct' ? 'direct' : 'competition_won');
    } else if (pending.source === 'negotiation') {
      const fromOrgId = pending.meta?.fromOrgId;
      const fromOrgName = pending.meta?.fromOrgName || '莉門屮菴・;
      const orgData = G.aiOrgs[fromOrgId];
      const fighter = orgData.roster.find(f => f.id === pending.fighterId);
      let resetFighter = Engine.popularity.applyTransferReset({ ...fighter, orgId: 'player', trust: 50, salaryBonus: 0 });
      resetFighter.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      resetFighter = Engine.orgTimeline.transfer(resetFighter, 'player', G.season, G.week);
      resetFighter = Engine.career.addEvent(resetFighter, { type: 'transfer', season: G.season, week: G.week, fromOrg: fromOrgName, toOrg: 'player', via: 'negotiate' });
      const newAiOrgs = { ...G.aiOrgs, [fromOrgId]: { ...orgData, roster: orgData.roster.filter(f => f.id !== pending.fighterId) } };
      G = { ...G, aiOrgs: newAiOrgs, roster: [...G.roster, resetFighter], funds: G.funds - pending.cost, transferLog: [...(G.transferLog || []), { season: G.season, week: G.week, type: 'negotiate', fighter: fighter.name, from: fromOrgName, cost: pending.cost }], gameLog: [...G.gameLog, `脂 ${fighter.name}縺ｮ蠑輔″謚懊″莠､貂画・蜉滂ｼ・ｼ・${pending.cost}荳・ｼ荏], negotiationResult: null };
      App._pushNewsEvent({ type: 'poachSuccess', characterId: resetFighter.id,
        data: { name: resetFighter.name, toOrg: G.orgName || '\u3042\u306a\u305f\u306e\u56e3\u4f53', fromOrg: fromOrgName, ovr: Engine.util.ov(resetFighter), cost: pending.cost } });
      signedFighter = resetFighter;
      detail = `隗｣髮・ ${released.name} / 遘ｻ邀埼≡: ${pending.cost}荳㌔;
      message = `${resetFighter.name}縺ｨ縺ｮ螂醍ｴ・′謌千ｫ九＠縺歔;
    }
    G = { ...G, pendingRosterOverflowSigning: null };
    Storage.autoSave();
    refreshAll();
    Audio.play('stamp');
    showEventPopup({ type: 'fighter', id: signedFighter.id, name: signedFighter.name, tone: 'positive', message, detail });
  },

  // 笏笏 Scout Event Methods (scout-spec ﾂｧ2-ﾂｧ5) 笏笏笏笏笏笏笏笏笏笏笏笏笏笏

  /** Pick a candidate: show competition dialog or sign directly */
  scoutEventPick(candidateId) {
    if (!G.scoutCandidates) return;
    const cand = G.scoutCandidates.find(c => c.id === candidateId);
    if (!cand) return;
    const picks = G.scoutPicks || [];
    if (picks.length >= (G.scoutMaxPicks || 3)) {
      Audio.play('error'); alert(`莉雁屓縺ｮ迯ｲ蠕嶺ｸ企剞・・{G.scoutMaxPicks}蜷搾ｼ峨↓驕斐＠縺ｦ縺・∪縺兪); return;
    }
    if (!Engine.scout.canNegotiate(G.orgPop || 0, cand)) {
      Audio.play('error'); alert('蝗｣菴薙・遏･蜷榊ｺｦ縺瑚ｶｳ繧翫∪縺帙ｓ・・); return;
    }
    const baseCost = Engine.scout.getSigningCost(cand, G.orgPop || 0);
    if (G.funds < baseCost) { Audio.play('error'); alert('雉・≡縺瑚ｶｳ繧翫∪縺帙ｓ・・); return; }

    if (cand._hasCompetition) {
      // Show competition resolution modal
      G = { ...G, scoutPendingPick: candidateId };
      renderScoutCompetitionModal(cand, baseCost, Engine.scout.getScoutDiscount(G.orgPop || 0));
    } else {
      // No competition: direct sign
      this.scoutEventResolve(candidateId, 'direct');
    }
  },

  /** Resolve a scout pick with competition choice */
  scoutEventResolve(candidateId, choice) {
    if (!G.scoutCandidates) return;
    const cand = G.scoutCandidates.find(c => c.id === candidateId);
    if (!cand) return;
    const baseCost = Engine.scout.getSigningCost(cand, G.orgPop || 0);
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, candidateId));

    let result;
    if (choice === 'direct') {
      result = { result: 'success', cost: baseCost };
    } else {
      result = Engine.scout.resolveCompetition(rng, cand, choice);
      if (result.cost > 0) {
        result.cost = Engine.scout.getSigningCost({ assessedValue: result.cost }, G.orgPop || 0);
      }
    }

    const tierCfg = Engine.scout.getTierConfig(cand.assessedTier || 'material');
    const log = [...G.gameLog];
    let candidates = [...G.scoutCandidates];
    let picks = [...(G.scoutPicks || [])];
    let newRoster = [...G.roster];
    let newFunds = G.funds;
    let aiOrgs = { ...G.aiOrgs };
    let freeAgents = [...G.freeAgents];

    const normalizeFighterForRoster = (fighter) => ({
      ...fighter,
      seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0, ...(fighter?.seasonGrowth || {}) },
      wins: fighter?.wins ?? 0,
      losses: fighter?.losses ?? 0,
      draws: fighter?.draws ?? 0,
      injury: fighter?.injury ?? null,
      condition: typeof fighter?.condition === 'number' ? fighter.condition : 80,
      schedule: ['balance','practice','promo','rest'].includes(fighter?.schedule) ? fighter.schedule : 'balance',
      intensive: !!fighter?.intensive,
      intensiveWeeks: fighter?.intensiveWeeks || 0,
      lastMatchResult: fighter?.lastMatchResult || null,
    });

    if (result.result === 'success') {
      if (newFunds < result.cost) { Audio.play('error'); alert('雉・≡縺瑚ｶｳ繧翫∪縺帙ｓ・・); return; }
      if (newRoster.filter(f => !f.isRental).length >= (G.rosterCap || 8)) {
        App._queueRosterOverflowSigning({
          source: 'scout',
          fighterId: cand.id,
          fighter: { ...cand },
          cost: result.cost,
          meta: { choice }
        });
        return;
      }
      Audio.play('stamp');
      // Clean internal props before adding to roster
      const signed = { ...cand };
      delete signed._notion; delete signed._estimate; delete signed._isSeed;
      delete signed._hasCompetition; delete signed._compMultiplier; delete signed._bidWinRate;
      // v1.3: Record debut event
      let normalizedSigned = normalizeFighterForRoster(signed);
      normalizedSigned = Engine.chronicle.applySpiritToFighter(normalizedSigned, G.chronicle); // Phase 4: 豌鈴｢ｨ trainCap 陬懈ｭ｣
      // Phase 3: orgJoinWeek險ｭ螳・
      normalizedSigned.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      // orgTimeline: 繧ｹ繧ｫ繧ｦ繝育佐蠕励〒謇螻槫､画峩
      normalizedSigned = Engine.orgTimeline.transfer(normalizedSigned, 'player', G.season, G.week);
      normalizedSigned = Engine.career.addEvent(normalizedSigned, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・, via: 'scout' });
      newRoster.push(normalizedSigned);
      newFunds -= result.cost;
      picks.push(candidateId);
      candidates = candidates.filter(c => c.id !== candidateId);
      log.push(`剥 繧ｹ繧ｫ繧ｦ繝育佐蠕・ ${cand.name} [${tierCfg.label}] 螂醍ｴ・≡${result.cost}荳㌔);
      const signingContext = (choice === 'direct') ? 'direct'
        : (choice === 'pay' || choice === 'gamble') ? 'competition_won'
        : 'direct';
      const signingLine = getSigningLine(cand, signingContext);
      // 繝昴ャ繝励い繝・・縺ｯ showScreen 蠕後↓陦ｨ遉ｺ・・howScreen 縺・dismissAllPopups 繧貞他縺ｶ縺溘ａ・・
      var _scoutSigningPopup = { type:'fighter', id: cand.id, name: cand.name,
        tone:'positive', message: signingLine,
        detail:`統 螂醍ｴ・≡: ${result.cost}荳・[${tierCfg.label}]` };
      var _scoutSigningFanfare = (signingContext === 'competition_won');
    } else if (result.result === 'lost') {
      Audio.play('error');
      // Lost candidate goes to AI org or freeAgent
      const lostResult = Engine.scout.resolveLostCandidate(rng, { ...cand }, aiOrgs);
      const cleanFighter = { ...lostResult.fighter };
      delete cleanFighter._notion; delete cleanFighter._estimate; delete cleanFighter._isSeed;
      delete cleanFighter._hasCompetition; delete cleanFighter._compMultiplier; delete cleanFighter._bidWinRate;
      if (lostResult.destination === 'aiOrg') {
        const orgData = aiOrgs[lostResult.orgId];
        if (orgData) {
          const nextRoster = Engine.rival.dedupeRoster([...(orgData.roster || []), normalizeFighterForRoster(cleanFighter)]);
          aiOrgs = { ...aiOrgs, [lostResult.orgId]: { ...orgData, roster: nextRoster } };
        }
        const orgInfo = RIVAL_ORGS.find(o => o.id === lostResult.orgId);
        log.push(`剥 遶ｶ繧願ｲ縺・ ${cand.name}縺ｯ${orgInfo ? orgInfo.name : '莉門屮菴・}縺ｸ`);
      } else {
        // 譛邨る㍾隍・メ繧ｧ繝・け・壼酔荳defId縺熊A繝ｻ繝ｭ繧ｹ繧ｿ繝ｼ縺ｫ譌｢縺ｫ蟄伜惠縺励↑縺・ｴ蜷医・縺ｿ霑ｽ蜉
        const alreadyExists = freeAgents.some(f => f.id === cleanFighter.id)
          || newRoster.some(f => f.id === cleanFighter.id);
        if (!alreadyExists) {
          freeAgents.push(normalizeFighterForRoster(cleanFighter));
          log.push(`剥 遶ｶ繧願ｲ縺・ ${cand.name}縺ｯ繝輔Μ繝ｼ繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝医∈`);
        } else {
          log.push(`剥 遶ｶ繧願ｲ縺・ ${cand.name}縺ｯ繝輔Μ繝ｼ繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝医∈・磯㍾隍・・縺溘ａ逋ｻ骭ｲ逵∫払・荏);
        }
      }
      candidates = candidates.filter(c => c.id !== candidateId);
      // 繝昴ャ繝励い繝・・縺ｯ showScreen 蠕後↓陦ｨ遉ｺ・・howScreen 縺・dismissAllPopups 繧貞他縺ｶ縺溘ａ・・
      var _scoutSigningPopup = { type:'scout', tone:'negative',
        message:`${cand.name}縺ｮ迯ｲ蠕励↓螟ｱ謨冷ｦ`, detail:'莉門屮菴薙→縺ｮ遶ｶ蜷医↓謨励ｌ縺ｾ縺励◆' };
    } else if (result.result === 'skipped') {
      // v1.7: 隕矩√ｊ譎ゅ・繝ｪ繧ｹ繝医°繧牙炎髯､縺励↑縺・ｼ亥・讀懆ｨ主庄閭ｽ縺ｫ縺吶ｋ・・
      log.push(`剥 繧ｹ繧ｫ繧ｦ繝郁ｦ矩√ｊ: ${cand.name}`);
    }

    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    if (titleMsg) log.push(titleMsg);
    G = {
      ...G, funds: newFunds, roster: newRoster, freeAgents, aiOrgs, titles,
      scoutCandidates: candidates, scoutPicks: picks, scoutPendingPick: null, gameLog: log,
    };
    // O-02: FA/繧ｹ繧ｫ繧ｦ繝医〒蜈･蝗｣ 窶・譌｢蟄倥Γ繝ｳ繝舌・蜈ｨ蜩｡竊呈眠蜈･驕ｸ謇・bond -3縲・3 + 蜀肴磁隗ｦ繝√ぉ繝・け
    if (result.result === 'success' && G.relationships) {
      const previousRelationshipState = { relationships: G.relationships };
      const scoutRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE44, G.season, candidateId));
      const existingIds = G.roster.filter(c => c.id !== candidateId).map(c => c.id);
      G = Engine.relationships.applyFromRoster(G, existingIds, candidateId, { min: -3, max: 3 }, { min: 0, max: 0 }, scoutRelRng);
      const recontactEvents = Engine.relationships.checkRecontact(G, candidateId, existingIds, previousRelationshipState);
      if (recontactEvents.length > 0) {
        G = Engine.relationships.applyRecontactEvents(G, recontactEvents);
      }
    }
    refreshAll();
    showScreen('scoutEvent');
    // showScreen 縺・dismissAllPopups 繧貞他縺ｶ蠕後↓繝昴ャ繝励い繝・・陦ｨ遉ｺ
    if (typeof _scoutSigningPopup !== 'undefined' && _scoutSigningPopup) {
      showEventPopup(_scoutSigningPopup);
      if (_scoutSigningFanfare) Audio.play('fanfare');
    }
  },

  /** Finish scout event and continue game flow */
  scoutEventFinish() {
    Audio.play('click');
    const picksCount = (G.scoutPicks || []).length;
    const log = [...G.gameLog, `剥 繧ｹ繧ｫ繧ｦ繝域ｴｻ蜍募ｮ御ｺ・ ${picksCount}蜷咲佐蠕輿];
    // Clean up any remaining candidates
    let freeAgents = [...G.freeAgents];
    let dormantPool = [...(G.dormantPool || [])];
    // 蜊譛画ｸ医∩ID繧ｻ繝・ヨ・域怙邨る㍾隍・メ繧ｧ繝・け逕ｨ・・
    const occupiedIds = Engine.util.collectOccupiedCharacterDefIds(G);
    // scoutCandidates 縺ｯ莉翫°繧・dormantPool 縺ｫ霑泌唆縺吶ｋ蟇ｾ雎｡縺ｪ縺ｮ縺ｧ縲√％縺薙〒縺ｯ蜊譛画桶縺・°繧牙､悶☆
    (G.scoutCandidates || []).forEach(c => occupiedIds.delete(c.id));
    (G.scoutCandidates || []).forEach(c => {
      const clean = { ...c };
      delete clean._notion; delete clean._estimate; delete clean._isSeed;
      delete clean._hasCompetition; delete clean._compMultiplier; delete clean._bidWinRate;
      // 隕矩√ｊ蛟呵｣懊・100% dormantPool霑泌唆・・A閹ｨ蠑ｵ髦ｲ豁｢・・
      if (!occupiedIds.has(clean.id)) {
        if (!dormantPool.some(e => e.id === clean.id)) {
          dormantPool.push({ id: clean.id, age: clean.age || 17 });
        }
        occupiedIds.add(clean.id);
      }
    });
    G = {
      ...G, freeAgents, dormantPool, gameLog: log,
      scoutCandidates: null, scoutPicks: null, scoutMaxPicks: null,
      scoutPendingPick: null, scoutEventType: null,
      scoutsThisSeason: (G.scoutsThisSeason || 0) + 1,
      weekPhase: G.offSeason ? 'offseason' : 'manage',
    };
    // If offseason, continue to next offWeek
    if (G.offSeason) {
      App.advanceWeek();
    } else {
      showScreen('week');
      refreshAll();
    }
  },

  // 笏笏 螂醍ｴ・峩譁ｰ莠､貂峨ヵ繝ｭ繝ｼ 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏
  handleContractNegotiations() {
    const negotiations = G.pendingContractNegotiations || [];
    const autoCount = G._contractAutoRenewed || 0;
    if (negotiations.length === 0) {
      // 莠､貂我ｸ崎ｦ・窶・transient繧ｯ繝ｪ繧｢縺励※谺｡縺ｸ
      const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = G;
      G = clean;
      App.advanceWeek();
      return;
    }

    // 遉ｾ髟ｷ螳､縺ｫ驕ｷ遘ｻ・井ｺ､貂峨Δ繝ｼ繝会ｼ・
    showScreen('shachoshitsu');

    const season = G.season || 1;
    const results = [];
    const preNegotiationRoster = (G.roster || []).map(f => ({ ...f }));
    const preNegotiationTitles = G.titles || {};
    let idx = 0;

    function processNext() {
      if (idx >= negotiations.length) {
        // 蜈ｨ莠､貂牙ｮ御ｺ・竊・邨先棡繧ｵ繝槭Μ繝ｼ
        const salaryChanges = App._buildContractRenewalSalaryChanges(
          results,
          preNegotiationRoster,
          preNegotiationTitles,
          G
        );
        showContractResultModal(results, salaryChanges, () => {
          // weekPhase 繧・offseason 縺ｫ謌ｻ縺呻ｼ医リ繝薙Ο繝・け隗｣髯､ + advanceWeek 縺ｮ蜀阪Ν繝ｼ繝鈴亟豁｢・・
          const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = G;
          G = { ...clean, weekPhase: 'offseason', gameLog: [...(G.gameLog || []), `搭 螂醍ｴ・峩譁ｰ螳御ｺ・ 谿狗蕗${results.filter(r => r.type === 'stay').length}蜷・騾蝗｣${results.filter(r => r.type === 'depart').length}蜷港] };
          // 莉企ｱ逕ｻ髱｢縺ｫ謌ｻ縺｣縺ｦ縺九ｉ谺｡騾ｱ縺ｸ騾ｲ繧√ｋ・育､ｾ髟ｷ螳､縺ｮ莠､貂峨き繝ｼ繝峨↓逡吶∪繧峨↑縺・ｈ縺・↓・・
          showScreen('week');
          App.advanceWeek();
        });
        return;
      }

      const neg = negotiations[idx];
      // v2.0 ﾂｧ6.3: 遯∫匱騾蝗｣ 窶・驕ｸ謚櫁い縺ｪ縺励∝叉騾蝗｣
      if (neg.attitude === 'sudden_departure') {
        showContractSuddenDepartureModal(neg, G, () => {
          const resolveRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 2));
          const result = Engine.contract.resolveNegotiation(resolveRng, G, neg, 0);
          G = result.state;
          App._consumeBetrayalNews(neg);
          results.push(result.result);
          idx++;
          processNext();
        });
        return;
      }
      showContractNegotiationModal(neg, idx, negotiations.length, G, (choiceIdx) => {
        App._resolveContractChoice(neg, choiceIdx, results, () => {
          idx++;
          processNext();
        });
      });
    }

    // 繧ｵ繝槭Μ繝ｼ逕ｻ髱｢ 竊・莠､貂蛾幕蟋・
    showContractSummaryModal(negotiations, autoCount, season, () => processNext());
  },

  _buildContractRenewalSalaryChanges(results, preRoster, preTitles, stateAfterNegotiation) {
    const changes = [];
    const seen = new Set();
    const afterRoster = stateAfterNegotiation?.roster || [];
    const afterTitles = stateAfterNegotiation?.titles || {};
    const resultByFighterId = new Map(
      (results || [])
        .filter(result => result && result.type === 'stay')
        .map(result => [result.fighterId, result])
    );

    for (const result of results || []) {
      if (!result || result.type !== 'stay' || seen.has(result.fighterId)) continue;
      seen.add(result.fighterId);

      const before = preRoster.find(f => f.id === result.fighterId);
      const after = afterRoster.find(f => f.id === result.fighterId);
      if (!before || !after) continue;

      const oldSalary = Engine.util.getSalary(before, preTitles);
      const newSalary = Engine.util.getSalary(after, afterTitles);
      const actualDelta = newSalary - oldSalary;
      const negotiatedDelta = resultByFighterId.get(result.fighterId)?.salaryDelta || 0;
      const baselineDelta = actualDelta - negotiatedDelta;
      if (actualDelta === 0 && negotiatedDelta === 0 && baselineDelta === 0) continue;

      changes.push({
        fighterId: result.fighterId,
        fighterName: result.fighterName,
        oldSalary,
        newSalary,
        salaryDelta: actualDelta,
        negotiatedDelta,
        baselineDelta,
      });
    }

    return changes;
  },

  _resolveContractChoice(neg, choiceIdx, results, onDone) {
    const resolveRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 2));
    const result = Engine.contract.resolveNegotiation(resolveRng, G, neg, choiceIdx);
    G = result.state;
    App._consumeBetrayalNews(neg);

    if (result.result.type === 'listen') {
      // 逅・罰繧定◇縺・竊・繧ｵ繝夜∈謚・
      showContractListenModal(neg, result.reactionDialogue, G, (subChoice) => {
        const subRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 3));
        const subResult = Engine.contract.resolveNegotiation(subRng, G, neg, 1, subChoice);
        G = subResult.state;
        App._consumeBetrayalNews(neg);
        results.push(subResult.result);
        if (subResult.result.type === 'stay') Audio.play('fanfare');
        else if (subResult.result.type === 'depart') Audio.play('defeat');
        showContractReactionModal(neg, subResult.reactionDialogue, onDone);
      });
      return;
    }

    results.push(result.result);

    // 邨先棡縺ｫ蠢懊§縺欖E
    if (result.result.type === 'stay') Audio.play('fanfare');
    else if (result.result.type === 'depart') Audio.play('defeat');

    // 遘ｻ邀榊ｿ鈴｡倥↓逋ｺ螻輔＠縺溷ｴ蜷・竊・遘ｻ邀榊ｿ鈴｡倥→縺励※蜀堺ｺ､貂・
    if (result.result.escalated) {
      Audio.play('tension_hit');
      const escNeg = { ...neg, attitude: 'transfer' };
      showContractReactionModal(neg, result.reactionDialogue, () => {
        showContractNegotiationModal(escNeg, results.length - 1, results.length, G, (escChoice) => {
          App._resolveContractChoice(escNeg, escChoice, results, onDone);
        });
      });
      return;
    }

    showContractReactionModal(neg, result.reactionDialogue, onDone);
  },

  // 蠑暮蜍ｧ蜻翫い繧ｯ繧ｷ繝ｧ繝ｳ
  doRetireAdvise(fighterId) {
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xAD71, fighterId));
    const result = Engine.retirement.advise(rng, G, fighterId);
    if (!result._pendingRetireAdviseResult) return;
    const { accepted, fighter, line } = result._pendingRetireAdviseResult;
    const { _pendingRetireAdviseResult: _, ...cleanG } = result;
    G = cleanG;
    Storage.autoSave();
    refreshAll();
    // 邨先棡繝昴ャ繝励い繝・・陦ｨ遉ｺ
    showRetireAdviseResultPopup(accepted, fighter, line);
  },

  // 蠑輔″逡吶ａ繧｢繧ｯ繧ｷ繝ｧ繝ｳ・亥ｼ暮繝昴ャ繝励い繝・・縺九ｉ蜻ｼ縺ｰ繧後ｋ・・
  // 蠑暮縺ｯ縺ｾ縺 commit 縺輔ｌ縺ｦ縺・↑縺・ｼ・oster 縺ｫ螻・ｋ・俄・譛ｬ莠ｺ繧堤峩謗･譖ｴ譁ｰ縺吶ｋ
  doRetainFighter(fighterId) {
    const fighter = (G.roster || []).find(c => c.id === fighterId);
    if (!fighter) { closeRetirementPopup(); return; }
    // 蠑輔″逡吶ａ荳企剞繝√ぉ繝・け
    if ((fighter.retainCount || 0) >= 2) { closeRetirementPopup(); return; }
    const retainLine = Engine.retirement.selectRetainLine(fighter, G);
    let updatedFighter = {
      ...fighter,
      wear: (fighter.wear || 0) + 10,
      retainCount: (fighter.retainCount || 0) + 1,
      retainInjuryBonus: ((fighter.retainInjuryBonus || 0) + 0.05),
      lastRun: false,
      lastRunWeek: null,
    };
    // Phase E: 蠑暮謦､蝗・history
    updatedFighter = Engine.career.addEvent(updatedFighter, { type: 'retireRetracted', season: G.season, week: G.week, orgName: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・ });
    G = { ...G, roster: G.roster.map(c => c.id === fighterId ? updatedFighter : c) };
    // O-13: 蠑暮謦､蝗・窶・譛ｬ莠ｺ竊貞屮菴灘・菴・bond +5縲・8, 蜷悟・蜈ｨ蜩｡竊呈悽莠ｺ bond +2縲・3
    if (G.relationships) {
      const retainRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE46, G.season, fighterId));
      const rosterIds = G.roster.filter(c => c.id !== fighterId).map(c => c.id);
      G = Engine.relationships.applyToRoster(G, fighterId, rosterIds, { min: 5, max: 8 }, { min: 0, max: 0 }, retainRelRng);
      G = Engine.relationships.applyFromRoster(G, rosterIds, fighterId, { min: 2, max: 3 }, { min: 0, max: 0 }, retainRelRng);
    }
    // commit 繝輔ぉ繝ｼ繧ｺ縺ｧ髯､螟悶☆繧九◆繧√・繝輔Λ繧ｰ
    App._retainedIds = App._retainedIds || new Set();
    App._retainedIds.add(fighterId);
    Storage.autoSave();
    refreshAll();
    closeRetirementPopup();
    // 蠑輔″逡吶ａ謌仙粥繧ｻ繝ｪ繝戊｡ｨ遉ｺ
    showEventPopup({
      type: 'fighter', id: fighter.id, name: fighter.name, tone: 'positive',
      message: retainLine, detail: `${fighter.name}縺ｮ蠑輔″逡吶ａ縺ｫ謌仙粥縺励∪縺励◆・亥ｼ輔″逡吶ａ ${updatedFighter.retainCount}/2蝗樒岼・荏,
    });
  },

  // 遉ｾ髟ｷ螳､邨ｱ蜷・Phase B: 隗｣髮・擇隲・ｒ髢句ｧ具ｼ磯∈謇九・繝・・繧｢繝・・縺ｮ隗｣髮・・繧ｿ繝ｳ 竊・遉ｾ髟ｷ螳､縺ｸ・・
  startReleaseInterview(charId) {
    const fighter = G.roster.find(c => c.id === charId);
    if (!fighter) return;

    // 繧ｫ繝ｼ繝臥匳骭ｲ荳ｭ繝√ぉ繝・け・・eleaseFighter 縺ｨ蜷後§譚｡莉ｶ・・
    const inCard = G.showCard.some(m => m.left === charId || m.right === charId);
    if (inCard) return;

    // 諤ｧ譬ｼ蛻･繧ｻ繝ｪ繝暮∈謚橸ｼ域ｱｺ螳夊ｫ也噪RNG・・
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xF1E2, charId));
    const personality = fighter.personality || 'normal';
    const lines = RELEASE_INTERVIEW_LINES[personality] || RELEASE_INTERVIEW_LINES.normal;
    const dialogue = lines[Engine.rng.int(rng, 0, lines.length - 1)];

    // 髱｢隲・ｸｭ繝輔Λ繧ｰ繧偵そ繝・ヨ 竊・遉ｾ髟ｷ螳､逕ｻ髱｢縺ｫ驕ｷ遘ｻ
    G = { ...G, _releaseInterviewTarget: charId };
    showScreen('shachoshitsu');
    renderShachoshitsuReleaseInterview(fighter, dialogue);
    Audio.play('event');
  },

  // 隗｣髮・擇隲・ 螳溯｡檎｢ｺ螳・
  confirmRelease(charId) {
    G = { ...G, _releaseInterviewTarget: null };
    App.releaseFighter(charId);
    // releaseFighter蜀・〒refreshAll+showEventPopup縺悟他縺ｰ繧後ｋ
    // 遉ｾ髟ｷ螳､騾壼ｸｸ繝｢繝ｼ繝峨∈謌ｻ繧・
    renderShachoshitsu();
  },

  // 隗｣髮・擇隲・ 繧ｭ繝｣繝ｳ繧ｻ繝ｫ
  cancelReleaseInterview() {
    G = { ...G, _releaseInterviewTarget: null };
    renderShachoshitsu();
    Audio.play('click');
  },

  // 遉ｾ髟ｷ螳､邨ｱ蜷・Phase C: 蜀・Κ繧ｿ繝門・譖ｿ
  switchShachoshitsuTab(tabId) {
    G._shachoshitsuTab = tabId;
    G._shachoshitsuScoutPage = 0;
    renderShachoshitsu();
    Audio.play('click');
  },

  // 遉ｾ髟ｷ螳､邨ｱ蜷・Phase C: 繧ｹ繧ｫ繧ｦ繝医・繝ｼ繧ｸ騾√ｊ
  shachoshitsuScoutPage(page) {
    G._shachoshitsuScoutPage = Math.max(0, page);
    renderShachoshitsu();
    Audio.play('click');
  },

  // Release a fighter
  releaseFighter(charId) {
    const idx = G.roster.findIndex(c => c.id === charId);
    if (idx < 0) return;
    Audio.play('spend');
    const c = G.roster[idx];
    const cName = c.name;
    const cId = c.id;
    // O-07: 隗｣髮・窶・roster髯､螟門燕縺ｫ髢｢菫ょ､譖ｴ譁ｰ
    if (G.relationships) {
      const releaseRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE45, G.season, charId));
      const colleagueIds = G.roster.filter(f => f.id !== charId).map(f => f.id);
      // 隗｣髮・＆繧後◆蛛ｴ竊貞屮菴灘・菴・ bond -10縲・15
      G = Engine.relationships.applyToRoster(G, charId, colleagueIds, { min: -15, max: -10 }, { min: 0, max: 0 }, releaseRelRng);
      // 谿狗蕗閠・・隗｣髮・＆繧後◆蛛ｴ: 諤ｧ譬ｼ蛻･ bond
      for (const cid of colleagueIds) {
        const colleague = G.roster.find(f => f.id === cid);
        const p = colleague?.personality || 'normal';
        let bMin, bMax;
        if (p === 'bold' || p === 'emotional') { bMin = 0; bMax = 2; }
        else if (p === 'earnest' || p === 'quiet') { bMin = -2; bMax = 0; }
        else { bMin = -1; bMax = 1; } // easygoing, normal
        G = Engine.relationships.applyFromRoster(G, [cid], charId, { min: bMin, max: bMax }, { min: 0, max: 0 }, releaseRelRng);
      }
    }
    const newRoster = G.roster.filter((_, i) => i !== idx);
    const newShowCard = App._removeFighterFromShowCard(G.showCard, charId);
    const newCoachAssign = Engine.coach.unassignFromCoach(G, charId);
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster, showCard: newShowCard });
    const log = [...G.gameLog, `豆 ${c.name}繧定ｧ｣髮㌔];
    if (titleMsg) log.push(titleMsg);
    // Phase E: 隗｣髮・history 繧・fighter 縺ｫ push
    const cWithRelease = Engine.career.addEvent(c, { type: 'release', season: G.season, week: G.week, fromOrg: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・ });
    const claimResult = Engine.rival.claimDepartedStar(
      Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xD75A, G.season, G.week, charId)),
      { ...G, roster: newRoster, showCard: newShowCard, coachAssign: newCoachAssign, titles, gameLog: log },
      cWithRelease,
      { fromOrgName: G.orgName || 'player', via: 'release_claim' }
    );
    if (claimResult.claimed) {
      log.push(`Transfer: ${c.name} -> ${claimResult.orgName}${claimResult.ejected ? ` / out: ${claimResult.ejected.name}` : ''}`);
      G = { ...claimResult.state, gameLog: log };
    } else if (Engine.util.canAddToFA(G)) {
      const releasedFighter = Engine.orgTimeline.transfer(cWithRelease, 'fa', G.season, G.week);
      G = { ...G, roster: newRoster, showCard: newShowCard, freeAgents: [...G.freeAgents, releasedFighter], coachAssign: newCoachAssign, titles, gameLog: log };
    } else {
      G = { ...G, roster: newRoster, showCard: newShowCard, coachAssign: newCoachAssign, titles, gameLog: log };
      G = Engine.util.redirectToDormantPool(G, cWithRelease);
    }
    closeFighterPopup();
    refreshAll();
    showEventPopup({ type:'fighter', id:cId, name:cName, tone:'negative',
      message: getTraitQuote('release', c), detail:`${cName}縺悟屮菴薙ｒ蜴ｻ繧翫∪縺励◆` });
  },

  // 笏笏 繧ｿ繧､繝医Ν螂ｪ驍・倦謌ｦ迥ｶ・・hase 4・・笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏
  openReclaimDialog() {
    if (!G.titles?.world?.externalHolder) return;
    if (!Engine.title.canIssueReclaim(G, 'world')) {
      Audio.play('error'); alert('迴ｾ蝨ｨ縺ｯ謖第姶迥ｶ繧堤匱陦後〒縺阪∪縺帙ｓ縲・); return;
    }
    const eligible = G.roster.filter(c => !c.injury && !c.isRental && !c.forcedRest);
    if (eligible.length === 0) {
      Audio.play('error'); alert('謖第姶蜿ｯ閭ｽ縺ｪ驕ｸ謇九′縺・∪縺帙ｓ縲・); return;
    }
    const eh = G.titles.world.externalHolder;
    const heldByOrg = G.aiOrgs?.[eh.orgId];
    const heldByOrgName = heldByOrg?.name || eh.orgId;
    const exChamp = heldByOrg?.roster?.find(c => c.id === eh.fighterId);
    const exChampName = exChamp?.name || `蜈・視閠・${eh.fighterId}`;

    let dlg = document.getElementById('reclaimDialog');
    if (dlg) dlg.remove();
    dlg = document.createElement('div');
    dlg.id = 'reclaimDialog';
    dlg.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center';
    const opts = eligible
      .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))
      .map(c => `<option value="${c.id}">${c.name}・・VR ${Engine.util.ov(c)}・・/option>`)
      .join('');
    dlg.innerHTML = `
      <div style="background:#1a1a24;border:1px solid #d4607a;border-radius:8px;padding:20px 24px;width:90%;max-width:480px;color:#eee">
        <div style="font-size:16px;font-weight:700;color:#ffb3c1;margin-bottom:10px">笞・螂ｪ驍・倦謌ｦ迥ｶ縺ｮ逋ｺ陦・/div>
        <div style="font-size:12px;color:#bbb;line-height:1.7;margin-bottom:14px">
          <strong>${heldByOrgName}</strong> 縺ｮ <strong>${exChampName}</strong> 縺ｫ蟇ｾ縺励※謖第姶迥ｶ繧貞娼縺阪▽縺代∪縺吶・br>
          谺｡縺ｮ闊郁｡後・繝｡繧､繝ｳ縺ｧ豎ｺ謌ｦ縲よ風蛹玲凾縺ｯ12騾ｱ髢灘・謖第姶縺ｧ縺阪∪縺帙ｓ縲・
        </div>
        <div style="margin-bottom:14px">
          <label style="font-size:12px;color:#aaa;display:block;margin-bottom:6px">謖第姶閠・ｒ驕ｸ縺ｶ</label>
          <select id="reclaimChallengerSelect" style="width:100%;padding:8px;background:#0f0f18;border:1px solid #444;border-radius:4px;color:#eee;font-size:13px">${opts}</select>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="App._closeReclaimDialog()" style="padding:8px 16px;background:#333;border:1px solid #555;color:#ccc;border-radius:4px;cursor:pointer">繧ｭ繝｣繝ｳ繧ｻ繝ｫ</button>
          <button onclick="App.confirmReclaim()" style="padding:8px 16px;background:linear-gradient(135deg,#d4607a,#a8334d);border:none;color:#fff;border-radius:4px;cursor:pointer;font-weight:600">謖第姶迥ｶ繧堤匱陦・/button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
  },
  _closeReclaimDialog() {
    const dlg = document.getElementById('reclaimDialog');
    if (dlg) dlg.remove();
  },
  confirmReclaim() {
    const sel = document.getElementById('reclaimChallengerSelect');
    if (!sel) return;
    const challengerId = parseInt(sel.value, 10);
    if (!challengerId || isNaN(challengerId)) return;
    if (!Engine.title.canIssueReclaim(G, 'world')) { Audio.play('error'); return; }
    G = Engine.title.recordReclaimAttempt(G, 'world', challengerId);
    G = { ...G, _pendingReclaim: { titleType: 'world', challengerId } };
    Audio.play('select');
    App._closeReclaimDialog();
    refreshAll();
    const c = G.roster.find(f => f.id === challengerId);
    const eh = G.titles.world.externalHolder;
    const orgName = G.aiOrgs?.[eh.orgId]?.name || eh.orgId;
    // 讌ｭ逡後ル繝･繝ｼ繧ｹ: 螂ｪ驍・倦謌ｦ迥ｶ
    App._pushIndustryNews({
      type: 'reclaimChallenge',
      characterId: challengerId,
      data: {
        challengerName: c?.name || '謖第姶閠・,
        fromOrg: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・,
        toOrg: orgName,
      },
    });
    showEventPopup({
      type: 'fighter', id: challengerId,
      name: c?.name || '謖第姶閠・, tone: 'positive',
      message: `糖 ${c?.name} 縺・${orgName} 縺ｸ謖第姶迥ｶ繧貞娼縺阪▽縺代◆・～,
      detail: `谺｡縺ｮ闊郁｡後・繝｡繧､繝ｳ縺ｧ邇句ｺｧ螂ｪ驍・・豎ｺ謌ｦ縺瑚｡後ｏ繧後ｋ縲Ａ,
    });
  },
  // Phase 6: 螂醍ｴ・｣丞・繧・竊・譁ｰ閨槭・繝・ラ繝ｩ繧､繝ｳ謖ｯ繧雁・縺・
  _consumeBetrayalNews(neg) {
    if (!G._lastBetrayalSummary) return;
    const sm = G._lastBetrayalSummary;
    let type;
    if (sm.isChampion && sm.beltCarried) type = 'contractBetrayalChampCarry';
    else if (sm.isChampion) type = 'contractBetrayalChampLeave';
    else if (sm.isRivalOrg) type = 'contractBetrayalRivalOrg';
    else if (sm.isAce) type = 'contractBetrayalAce';
    else type = 'contractBetrayalGeneric';
    const fromOrg = G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・;
    const toOrg = G.aiOrgs?.[sm.toOrgId]?.name || sm.toOrgId || '莉門屮菴・;
    App._pushNewsEvent({
      type, characterId: sm.departingId,
      data: { name: sm.departingName || neg?.fighterName || '驕ｸ謇・, fromOrg, toOrg },
    });
    const { _lastBetrayalSummary, _lastBetrayalBeltCarried, ...rest } = G;
    G = rest;
  },

  cancelReclaim() {
    if (!G._pendingReclaim) return;
    if (!confirm('謖第姶迥ｶ繧貞叙繧贋ｸ九￡縺ｾ縺吶°・滂ｼ井ｻ翫す繝ｼ繧ｺ繝ｳ縺ｮ謖第姶螻･豁ｴ縺ｯ谿九ｊ縺ｾ縺呻ｼ・)) return;
    // pending challenge 繧貞叙繧贋ｸ九￡・嗷eclaimChallenges 縺九ｉ譛譁ｰ縺ｮ譛ｪ隗｣豎ｺ繧ｨ繝ｳ繝医Μ繧帝勁蜴ｻ
    const newChallenges = (G.reclaimChallenges || []).filter((c, i, arr) => {
      // 逶ｴ霑代・ pending 繧・莉ｶ縺縺大炎髯､
      const lastPendingIdx = arr.map((cc, ii) => cc.result == null && cc.titleType === 'world' ? ii : -1)
        .filter(ii => ii >= 0).pop();
      return i !== lastPendingIdx;
    });
    const { _pendingReclaim, ...rest } = G;
    G = { ...rest, reclaimChallenges: newChallenges };
    Audio.play('select');
    refreshAll();
  },

  // Set training schedule
  setSchedule(charId, schedule) {
    G = { ...G, roster: G.roster.map(c => c.id === charId ? { ...c, schedule } : c) };
    refreshAll();
  },

  // Set intensive training
  setIntensive(charId) {
    const c = G.roster.find(c => c.id === charId);
    if (!c || c.injury) return;
    Audio.play('select');
    G = { ...G, roster: G.roster.map(c => c.id === charId ? { ...c, intensive: true } : c) };
    refreshAll();
  },

  cancelIntensive(charId) {
    Audio.play('deselect');
    G = { ...G, roster: G.roster.map(c => c.id === charId ? { ...c, intensive: false } : c) };
    refreshAll();
  },

  // Hire coach
  hireCoach(coachId) {
    const coach = ALL_COACHES.find(c => c.id === coachId);
    if (!coach) return;
    const maxCoaches = Engine.coach.getMaxCoaches(G);
    if (G.coaches.length >= maxCoaches) { Audio.play('error'); alert(`繧ｳ繝ｼ繝√・迴ｾ蝨ｨ譛螟ｧ${maxCoaches}蜷阪∪縺ｧ・域棧諡｡蠑ｵ縺ｧ蠅怜刈・荏); return; }
    // A邏夐寐逕ｨ譚｡莉ｶ: 4譫逶ｮ髢区叛貂医∩
    if (coach.grade === 'A' && (G.coachSlots || 1) < 4) { Audio.play('error'); alert('A邏壹さ繝ｼ繝√・髮・畑縺ｫ縺ｯ4譫逶ｮ縺ｮ髢区叛縺悟ｿ・ｦ√〒縺・); return; }
    const fee = coach.hireFee || COACH_HIRE_FEE;
    if (G.funds < fee) { Audio.play('error'); alert('雉・≡縺瑚ｶｳ繧翫∪縺帙ｓ・・); return; }
    // 遉ｾ髟ｷ螳､ Phase 5: 繧ｳ繝ｼ繝・寐逕ｨ縺ｯ縲後さ繝ｼ繝・寐逕ｨ豎ｺ陬∵嶌縲・豎ｺ陬∵棧2)繧呈ｶ郁ｲｻ縺吶ｋ
    const hireDoc = (typeof DECISION_DOCS !== 'undefined') ? DECISION_DOCS.hireCoach : null;
    const dpCost = (hireDoc && hireDoc.decisionCost) || 2;
    if ((G.decisionPoints || 0) < dpCost) {
      Audio.play('error');
      alert(`繧ｳ繝ｼ繝・寐逕ｨ縺ｫ縺ｯ豎ｺ陬∵棧 笞｡${dpCost} 縺悟ｿ・ｦ√〒縺呻ｼ育樟蝨ｨ: 笞｡${G.decisionPoints || 0}・荏);
      return;
    }
    G = {
      ...G,
      funds: G.funds - fee,
      decisionPoints: Math.max(0, (G.decisionPoints || 0) - dpCost),
      coaches: [...G.coaches, coachId],
      availableCoaches: G.availableCoaches.filter(id => id !== coachId),
      coachAssign: { ...G.coachAssign, [coachId]: [] },
      gameLog: [...G.gameLog, `雌 ${coach.name}繧偵さ繝ｼ繝√→縺励※髮・畑・磯寐逕ｨ雋ｻ: ${fee}荳・∵ｱｺ陬∵棧 -${dpCost}・荏]
    };
    refreshAll();
    showEventPopup({ type:'coach', id:coachId, name:coach.name, tone:'positive',
      message: pickQuote('coachHire'), detail:`雌 ${coach.name}縺後さ繝ｼ繝√→縺励※蜉蜈･・・ｼ磯寐逕ｨ雋ｻ: ${fee}荳・∵ｱｺ陬∵棧 -${dpCost}・荏 });
  },

  // Expand coach slot
  expandCoachSlot() {
    const result = Engine.coach.expandSlot(G);
    if (result.error === 'max_slots') { Audio.play('error'); alert('縺吶〒縺ｫ蜈ｨ譫繧帝幕謾ｾ縺励※縺・∪縺・); return; }
    if (result.error === 'funds_insufficient') { Audio.play('error'); alert(`雉・≡縺瑚ｶｳ繧翫∪縺帙ｓ・亥ｿ・ｦ・ ${result.cost}荳・ｼ荏); return; }
    G = {
      ...G,
      coachSlots: result.coachSlots,
      funds: result.funds,
      gameLog: [...G.gameLog, `雌 繧ｳ繝ｼ繝∵棧繧・{result.coachSlots}譫縺ｫ諡｡蠑ｵ・域兜雉・ ${result.cost}荳・ｼ荏]
    };
    Audio.play('coin');
    refreshAll();
    const slotNum = result.coachSlots;
    const msgs = {
      2: '驕灘ｴ縺ｫ譁ｰ縺励＞繝医Ξ繝ｼ繝九Φ繧ｰ繧ｹ繝壹・繧ｹ繧貞｢苓ｨｭ縺励◆縲・,
      3: '蟆ら畑縺ｮ繧ｳ繝ｼ繝√Ν繝ｼ繝繧定ｨｭ鄂ｮ縲り､・焚縺ｮ繧ｳ繝ｼ繝√′蜷梧凾縺ｫ謖・ｰ弱〒縺阪ｋ迺ｰ蠅・′謨ｴ縺｣縺溘・,
      4: '譛鬮倡ｴ壹・繝医Ξ繝ｼ繝九Φ繧ｰ譁ｽ險ｭ繧貞ｮ悟ｙ縲ゆｼ晁ｪｬ邏壹・繧ｳ繝ｼ繝√ｒ諡幄§縺吶ｋ貅門ｙ縺梧紛縺｣縺溘・
    };
    showEventPopup({ type:'system', tone:'positive',
      message: msgs[slotNum] || '繧ｳ繝ｼ繝∵棧繧呈僑蠑ｵ縺励∪縺励◆縲・,
      detail: `雌 繧ｳ繝ｼ繝∵棧縺・{slotNum}譫縺ｫ諡｡蠑ｵ縺輔ｌ縺ｾ縺励◆・・ｼ域兜雉・ ${result.cost}荳・ｼ・{slotNum >= 4 ? '\n箝・A邏壹さ繝ｼ繝√・髮・畑縺瑚ｧ｣遖√＆繧後∪縺励◆・・ : ''}` });
  },

  // Fire coach
  fireCoach(coachId) {
    const coach = ALL_COACHES.find(c => c.id === coachId);
    const newAssign = { ...G.coachAssign };
    delete newAssign[coachId];
    G = {
      ...G,
      coaches: G.coaches.filter(id => id !== coachId),
      coachAssign: newAssign,
      gameLog: [...G.gameLog, `笶・${coach?.name}繧定ｧ｣髮㌔]
    };
    refreshAll();
    if (coach) showEventPopup({ type:'coach', id:coachId, name:coach.name, tone:'negative',
      message: pickQuote('coachFire'), detail:`${coach.name}縺後メ繝ｼ繝繧貞悉繧翫∪縺励◆` });
  },

  // Assign character to coach
  assignToCoach(coachId, charId) {
    const unassigned = Engine.coach.unassignFromCoach(G, charId);
    const { coachAssign, success } = Engine.coach.assignToCoach({ ...G, coachAssign: unassigned }, coachId, charId);
    if (!success) { Audio.play('error'); alert('縺薙・繧ｳ繝ｼ繝√・繧｢繧ｵ繧､繝ｳ譫縺梧ｺ蜩｡縺ｧ縺・); return; }
    Audio.play('click');
    G = { ...G, coachAssign };
    refreshAll();
  },

  // Unassign character from coach
  unassignFromCoach(charId) {
    G = { ...G, coachAssign: Engine.coach.unassignFromCoach(G, charId) };
    refreshAll();
  },

  // Show preparation
  startShowPrep() {
    if (G.offSeason || G.weekPhase !== 'manage' || !isShowWeek(G.week)) { Audio.play('error'); return; }
    // PPV騾ｱ縺ｯ騾壼ｸｸ闊郁｡御ｸ榊庄
    if (G.ppvPhase === 'locked' || G.ppvPhase === 'show') {
      Audio.play('error');
      showToast('莉企ｱ縺ｯPPV GRAND FINAL縺碁幕蛯ｬ縺輔ｌ縺ｾ縺吶る壼ｸｸ闊郁｡後・陦後∴縺ｾ縺帙ｓ縲・);
      return;
    }
    Audio.play('crowd');
    G = {
      ...G,
      weekPhase: 'showPrep',
      showCard: [],  // renderShowPrep 縺ｮ pad/trim 縺ｧ莨壼ｴ縺ｫ蠢懊§縺滓棧謨ｰ縺ｫ閾ｪ蜍戊ｪｿ謨ｴ
      showVenue: 0
    };
    refreshAll();
  },

  // Set show venue
  setShowVenue(venueIdx) {
    // orgPop 繝ｪ繝舌Λ繝ｳ繧ｹ v1.1 ﾂｧ5: 繝峨・繝蟷ｴ1蝗槫宛髯・
    if (venueIdx === 9 && (G.domeShowsThisSeason || 0) >= 1) return;
    G = { ...G, showVenue: venueIdx };
    renderShowPrep();
  },

  // Set show card slot
  setShowCardSlot(slotIndex, side, newId) {
    newId = +newId;
    const newCard = G.showCard.map(s => ({ ...s }));
    // Swap: if newId is already used in another slot, exchange fighters
    if (newId > 0) {
      for (let i = 0; i < newCard.length; i++) {
        if (i === slotIndex) continue;
        if (newCard[i].left === newId || newCard[i].right === newId) {
          const foundSide = newCard[i].left === newId ? 'left' : 'right';
          newCard[i][foundSide] = newCard[slotIndex][side] || 0;
          // Clear title if swapped-from slot became invalid
          if (newCard[i].isTitle && (!newCard[i].left || !newCard[i].right || newCard[i].left === newCard[i].right)) {
            newCard[i].isTitle = false;
          }
          break;
        }
      }
    }
    newCard[slotIndex][side] = newId;
    if (newId > 0 && newCard[slotIndex].left === newCard[slotIndex].right) {
      newCard[slotIndex][side === 'left' ? 'right' : 'left'] = 0;
    }
    if (newCard[slotIndex].isTitle && (!newCard[slotIndex].left || !newCard[slotIndex].right)) {
      newCard[slotIndex].isTitle = false;
    }
    // 繧ｿ繧､繝医Ν繧ｹ繝ｭ繝・ヨ縺ｫ繝√Ε繝ｳ繝斐が繝ｳ縺後＞縺ｪ縺上↑縺｣縺溷ｴ蜷医・isTitle繧偵け繝ｪ繧｢
    // ・医せ繝ｯ繝・・遲峨〒繝√Ε繝ｳ繝斐が繝ｳ縺檎ｧｻ蜍輔＠縺溷ｾ後↓繧ｴ繝ｼ繧ｹ繝・sTitle縺梧ｮ九ｋ繝舌げ繧帝亟縺撰ｼ・
    const champIdForTitleCheck = G.titles?.world?.championId;
    if (champIdForTitleCheck) {
      for (let i = 0; i < newCard.length; i++) {
        if (newCard[i].isTitle && newCard[i].left !== champIdForTitleCheck && newCard[i].right !== champIdForTitleCheck) {
          newCard[i] = { ...newCard[i], isTitle: false };
        }
      }
    }
    G = { ...G, showCard: newCard };
    renderShowPrep();
  },

  // Clear show card (resets all slots including tag entries to empty singles)
  clearShowCard() {
    const maxMatches = Engine.util.getMaxMatches(G.week, G.showVenue);
    const emptyCard = [];
    for (let i = 0; i < maxMatches; i++) emptyCard.push({left: 0, right: 0, isTitle: false});
    G = { ...G, showCard: emptyCard };
    renderShowPrep();
  },

  // 笏笏 Tag match slot management 笏笏
  addTagSlot() {
    const card = [...G.showCard];
    // 遨ｺ繧ｷ繝ｳ繧ｰ繝ｫ譫繧呈忰蟆ｾ縺九ｉ2縺､謗｢縺・
    let emptyCount = 0;
    for (let i = card.length - 1; i >= 0; i--) {
      if (!card[i].matchType && card[i].left === 0 && card[i].right === 0) emptyCount++;
    }
    if (emptyCount < 2) { Audio.play('error'); showToast('遨ｺ縺肴棧縺瑚ｶｳ繧翫∪縺帙ｓ・医ち繝・げ縺ｫ縺ｯ2譫蠢・ｦ・ｼ・); return; }
    // 譛ｫ蟆ｾ縺九ｉ遨ｺ繧ｷ繝ｳ繧ｰ繝ｫ2縺､繧帝勁蜴ｻ
    let removed = 0;
    for (let i = card.length - 1; i >= 0 && removed < 2; i--) {
      if (!card[i].matchType && card[i].left === 0 && card[i].right === 0) { card.splice(i, 1); removed++; }
    }
    // 繧ｿ繝・げ繧ｨ繝ｳ繝医Μ繝ｼ繧呈忰蟆ｾ縺ｫ謖ｿ蜈･
    card.push({ matchType: 'tag', teamA: { fighter1: 0, fighter2: 0 }, teamB: { fighter1: 0, fighter2: 0 } });
    G = { ...G, showCard: card };
    renderShowPrep();
  },

  // 繧ｷ繝ｳ繧ｰ繝ｫ2譫繧貞粋菴薙＠縺ｦ繧ｿ繝・げ1譫縺ｫ・磯∈謇句ｼ輔″邯吶℃・・
  mergeToTagSlot(idx) {
    const card = [...G.showCard];
    if (idx < 0 || idx + 1 >= card.length) return;
    if (idx === 0) { Audio.play('error'); showToast('繝｡繧､繝ｳ繧､繝吶Φ繝医・繧ｷ繝ｳ繧ｰ繝ｫ繝槭ャ繝√・縺ｿ縺ｧ縺・); return; }
    if (card[idx].matchType === 'tag' || card[idx + 1].matchType === 'tag') {
      Audio.play('error'); showToast('繧ｿ繝・げ譫蜷悟｣ｫ縺ｯ蜷井ｽ薙〒縺阪∪縺帙ｓ'); return;
    }
    const s1 = card[idx], s2 = card[idx + 1];
    // 蟾ｦ繧ｳ繝ｼ繝翫・蜷悟｣ｫ竊偵メ繝ｼ繝A縲∝承繧ｳ繝ｼ繝翫・蜷悟｣ｫ竊偵メ繝ｼ繝B
    const tagSlot = {
      matchType: 'tag',
      teamA: { fighter1: s1.left || 0, fighter2: s2.left || 0 },
      teamB: { fighter1: s1.right || 0, fighter2: s2.right || 0 },
    };
    card.splice(idx, 2, tagSlot);
    G = { ...G, showCard: card };
    renderShowPrep();
  },

  removeTagSlot(idx) {
    const card = [...G.showCard];
    if (!card[idx] || card[idx].matchType !== 'tag') return;
    const tag = card[idx];
    // 繧ｿ繝・げ竊偵す繝ｳ繧ｰ繝ｫ2譫縺ｫ蛻・牡・磯∈謇九ｒ菫晄戟・・
    const s1 = { left: tag.teamA.fighter1 || 0, right: tag.teamB.fighter1 || 0, isTitle: false };
    const s2 = { left: tag.teamA.fighter2 || 0, right: tag.teamB.fighter2 || 0, isTitle: false };
    card.splice(idx, 1, s1, s2);
    G = { ...G, showCard: card };
    renderShowPrep();
  },

  setTagSlotFighter(slotIdx, team, pos, fighterId) {
    fighterId = +fighterId;
    const newCard = G.showCard.map(s => s.matchType === 'tag'
      ? { ...s, teamA: { ...s.teamA }, teamB: { ...s.teamB } }
      : { ...s });
    const tagSlot = newCard[slotIdx];
    if (!tagSlot || tagSlot.matchType !== 'tag') return;

    // Swap: if fighterId is already used in another slot
    if (fighterId > 0) {
      for (let i = 0; i < newCard.length; i++) {
        if (i === slotIdx) continue;
        const m = newCard[i];
        if (m.matchType === 'tag') {
          for (const t of ['teamA', 'teamB']) {
            for (const p of ['fighter1', 'fighter2']) {
              if (m[t][p] === fighterId) { m[t][p] = tagSlot[team][pos] || 0; }
            }
          }
        } else {
          if (m.left === fighterId) { m.left = tagSlot[team][pos] || 0; }
          if (m.right === fighterId) { m.right = tagSlot[team][pos] || 0; }
        }
      }
      // Also check within the same tag slot for duplicates
      for (const t of ['teamA', 'teamB']) {
        for (const p of ['fighter1', 'fighter2']) {
          if (t === team && p === pos) continue;
          if (tagSlot[t][p] === fighterId) { tagSlot[t][p] = tagSlot[team][pos] || 0; }
        }
      }
    }
    tagSlot[team][pos] = fighterId;
    G = { ...G, showCard: newCard };
    renderShowPrep();
  },

  // Toggle title match
  toggleTitleMatch(slotIndex) {
    const newVal = !G.showCard[slotIndex].isTitle;
    // ON縺ｫ縺吶ｋ縺ｨ縺阪・蠢・★莉悶せ繝ｭ繝・ヨ縺ｮisTitle繧偵け繝ｪ繧｢・医メ繝｣繝ｳ繝斐が繝ｳ蝨ｨ邀・遨ｺ菴阪←縺｡繧峨ｂ・・
    G = { ...G, showCard: G.showCard.map((slot, i) => {
      if (i === slotIndex) return { ...slot, isTitle: newVal };
      if (newVal) return { ...slot, isTitle: false };
      return slot;
    }) };
    renderShowPrep();
  },

  // 笊絶武笊・BATTLE ENGINE INTEGRATION (v0.86) 笊絶武笊・
  // Show match preview instead of instant execution
  executeShow() {
    // v2.0: weekPhase guard 窶・settled/weekSummary遲峨・髱櫁・陦後ヵ繧ｧ繝ｼ繧ｺ縺ｧ縺ｯ螳溯｡御ｸ榊庄
    if (G.offSeason || !['manage', 'showPrep'].includes(G.weekPhase)) { Audio.play('error'); return; }
    // Guard: sanitize stale card refs (released/retired/transferred wrestlers)
    const rosterIdSet = new Set(G.roster.map(c => c.id));
    let hadStaleRef = false;
    const _idOk = id => id > 0 && rosterIdSet.has(id);
    const sanitized = G.showCard.map(m => {
      if (m.matchType === 'tag') {
        const a1 = _idOk(m.teamA.fighter1), a2 = _idOk(m.teamA.fighter2);
        const b1 = _idOk(m.teamB.fighter1), b2 = _idOk(m.teamB.fighter2);
        if ((!a1 && m.teamA.fighter1 > 0) || (!a2 && m.teamA.fighter2 > 0) ||
            (!b1 && m.teamB.fighter1 > 0) || (!b2 && m.teamB.fighter2 > 0)) hadStaleRef = true;
        return { ...m,
          teamA: { fighter1: a1 ? m.teamA.fighter1 : 0, fighter2: a2 ? m.teamA.fighter2 : 0 },
          teamB: { fighter1: b1 ? m.teamB.fighter1 : 0, fighter2: b2 ? m.teamB.fighter2 : 0 },
        };
      }
      const leftOk = _idOk(m.left), rightOk = _idOk(m.right);
      if ((m.left > 0 && !leftOk) || (m.right > 0 && !rightOk)) hadStaleRef = true;
      return { ...m, left: leftOk ? m.left : 0, right: rightOk ? m.right : 0,
        isTitle: !!m.isTitle && leftOk && rightOk };
    });
    if (hadStaleRef) G = { ...G, showCard: sanitized };

    const validMatches = (hadStaleRef ? sanitized : G.showCard).filter(m =>
      m.matchType === 'tag'
        ? (m.teamA?.fighter1 > 0 && m.teamA?.fighter2 > 0 && m.teamB?.fighter1 > 0 && m.teamB?.fighter2 > 0)
        : (m.left > 0 && m.right > 0)
    );
    if (validMatches.length === 0) {
      Audio.play('error');
      if (hadStaleRef) refreshAll();
      alert(hadStaleRef
        ? '繧ｫ繝ｼ繝峨↓蝨ｨ邀阪＠縺ｦ縺・↑縺・∈謇九′蜷ｫ縺ｾ繧後※縺・◆縺溘ａ閾ｪ蜍輔〒隗｣髯､縺励∪縺励◆縲ゅき繝ｼ繝峨ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・
        : '蟆代↑縺上→繧・隧ｦ蜷医ｒ邨・ｓ縺ｧ縺上□縺輔＞');
      return;
    }

    // v1.2: 繧ｿ繧､繝医Ν繝槭ャ繝√け繝ｼ繝ｫ繝繧ｦ繝ｳ繧ｬ繝ｼ繝会ｼ・I繝舌う繝代せ髦ｲ豁｢・・
    const hasTitleSlot = validMatches.some(m => m.isTitle);
    if (hasTitleSlot) {
      const cd = Engine.title.canTitleMatch(G);
      if (!cd.allowed) {
        Audio.play('error');
        // 繧ｯ繝ｼ繝ｫ繝繧ｦ繝ｳ荳ｭ縺ｮ繧ｿ繧､繝医Ν繝輔Λ繧ｰ繧定・蜍輔〒螟悶☆
        G = { ...G, showCard: G.showCard.map(m => ({ ...m, isTitle: false })) };
        refreshAll();
        alert(`繧ｿ繧､繝医Ν繝槭ャ繝√・12騾ｱ縺ｫ1蝗槭・縺ｿ髢句ぎ縺ｧ縺阪∪縺呻ｼ医≠縺ｨ${cd.weeksLeft}騾ｱ・荏);
        return;
      }
    }

    // 笏笏 Phase 4: 繧ｿ繧､繝医Ν螂ｪ驍・倦謌ｦ縺ｮ豕ｨ蜈･ 笏笏
    App._reclaimData = null;
    if (G._pendingReclaim && G.titles?.world?.externalHolder) {
      const pr = G._pendingReclaim;
      const eh = G.titles.world.externalHolder;
      const challenger = G.roster.find(c => c.id === pr.challengerId);
      const aiOrg = G.aiOrgs?.[eh.orgId];
      const defender = aiOrg?.roster?.find(c => c.id === eh.fighterId);
      // 謨ｴ蜷域ｧ繝√ぉ繝・け: 謖第姶閠・′閼ｱ騾/諤ｪ謌醍ｭ峨〒蜿よ姶荳榊庄縲√∪縺溘・髦ｲ陦幄・′AI蝗｣菴薙Ο繧ｹ繧ｿ繝ｼ縺九ｉ豸医∴縺ｦ縺・ｋ 竊・蜿悶ｊ荳九￡
      if (!challenger || challenger.injury || challenger.forcedRest || !defender) {
        const { _pendingReclaim, ...rest } = G;
        G = rest;
      } else {
        // 髦ｲ陦幄・ｒ player roster 縺ｫ isReclaim 蜊ｰ縺ｧ荳譎よｳｨ蜈･
        const defenderForRoster = { ...defender, isReclaim: true, _reclaimOrgId: eh.orgId };
        // 譌｢蟄倥Γ繧､繝ｳ譫 (slot 0) 繧貞･ｪ驍・倦謌ｦ隧ｦ蜷医↓鄂ｮ縺肴鋤縺・
        const newCard = [...G.showCard];
        const reclaimMatch = {
          left: pr.challengerId, right: defender.id,
          isTitle: true, isReclaim: true,
          _reclaimDefenderId: defender.id, _reclaimOrgId: eh.orgId,
        };
        if (newCard.length === 0) newCard.push(reclaimMatch);
        else newCard[0] = reclaimMatch;
        G = { ...G, showCard: newCard, roster: [...G.roster, defenderForRoster] };
        // validMatches 繧ょ・讒狗ｯ会ｼ医Γ繧､繝ｳ繧貞渚譏・・
        validMatches.length = 0;
        newCard.forEach(m => {
          if (m.matchType === 'tag'
            ? (m.teamA?.fighter1 > 0 && m.teamA?.fighter2 > 0 && m.teamB?.fighter1 > 0 && m.teamB?.fighter2 > 0)
            : (m.left > 0 && m.right > 0)) validMatches.push(m);
        });
        App._reclaimData = {
          challengerId: pr.challengerId, defenderId: defender.id,
          orgId: eh.orgId, orgName: aiOrg?.name || eh.orgId,
          defenderName: defender.name, challengerName: challenger.name,
        };
        showEventPopup({
          type: 'fighter', id: pr.challengerId,
          name: challenger.name, tone: 'positive',
          message: `笞・邇句ｺｧ螂ｪ驍・・豎ｺ謌ｦ・・${challenger.name} vs ${defender.name}`,
          detail: `${aiOrg?.name || eh.orgId} 縺ｫ謖√■蜴ｻ繧峨ｌ縺滉ｸ也阜邇句ｺｧ繧貞叙繧頑綾縺幢ｼ～,
        });
      }
    }

    // v1.2: 荵ｱ蜈･繝槭ャ繝∝愛螳・
    App._intrusionData = null;
    const intrusionRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 8888));
    const intrusion = Engine.intrusion.check(G, intrusionRng);
    if (intrusion) {
      // 繧ｿ繧､繝医Ν繝槭ャ繝√・謖第姶閠・ｒ蟾ｮ縺玲崛縺・
      const titleIdx = G.showCard.findIndex(m => m.isTitle && m.left > 0 && m.right > 0);
      if (titleIdx >= 0) {
        const tm = G.showCard[titleIdx];
        const challengerSide = tm.left === intrusion.champId ? 'right' : 'left';
        const originalChallengerId = tm[challengerSide];
        // showCard譖ｴ譁ｰ
        const newCard = G.showCard.map((m, i) => {
          if (i !== titleIdx) return m;
          return { ...m, [challengerSide]: intrusion.intruder.id };
        });
        // 荵ｱ蜈･驕ｸ謇九ｒ荳譎ら噪縺ｫroster縺ｫ霑ｽ蜉
        const intruderForRoster = { ...intrusion.intruder, isIntrusion: true };
        G = { ...G, showCard: newCard, roster: [...G.roster, intruderForRoster] };
        // validMatches繧よ峩譁ｰ
        validMatches.forEach((m, i) => {
          if (m.isTitle) {
            m[challengerSide] = intrusion.intruder.id;
          }
        });
        App._intrusionData = {
          intruder: intrusion.intruder,
          fromOrgName: intrusion.fromOrgName,
          champName: intrusion.champName,
          champId: intrusion.champId,
          originalChallengerId,
          challengerSide
        };
        // 荵ｱ蜈･貍泌・繝昴ャ繝励い繝・・
        showEventPopup({
          type: 'fighter',
          id: intrusion.intruder.id,
          name: intrusion.intruder.name,
          tone: 'negative',
          message: `笞｡ ${intrusion.fromOrgName}縺ｮ${intrusion.intruder.name}縺御ｹｱ蜈･・～,
          detail: `繧ｿ繧､繝医Ν繝槭ャ繝√・謖第姶閠・′蟾ｮ縺玲崛繧上▲縺滂ｼ―nOVR ${Engine.util.ov(intrusion.intruder)} 縺ｮ蠑ｷ謨ｵ縺檎視蠎ｧ繧堤漁縺・ｼ～
        });
      }
    }

    try { Audio.play('bell'); } catch(e) {}
    try { Audio.bgm.play('battle'); } catch(e) {}

    // rivalry50+ 繝壹い縺ｮ螳｣謌ｦ蟶・相繝昴ャ繝励い繝・・繧呈､懷・・亥･ｽ謨ｵ謇・螳ｿ諤ｨ縺ｯ蟇ｾ雎｡螟悶√ち繝・げ縺ｯ繧ｹ繧ｭ繝・・・・
    // Phase 3e: F08 繝ｭ繝・け隧ｦ蜷医・蟆ら畑縺ｮ隧ｦ蜷亥燕繝｢繝ｼ繝繝ｫ縺悟━蜈医☆繧九◆繧√％縺薙〒縺ｯ髯､螟・
    const confrontations = [];
    validMatches.forEach((m, i) => {
      if (m.matchType === 'tag') return;
      if (m._f08Locked) return;
      const rivalLvl = Engine.title.getRivalryLevel(G, m.left, m.right);
      if (rivalLvl && !rivalLvl.isGoodRival && !rivalLvl.isBitterRival && (rivalLvl.rivalry || 0) >= 50) {
        const cl = G.roster.find(c => c.id === m.left);
        const cr = G.roster.find(c => c.id === m.right);
        if (cl && cr) {
          confrontations.push({
            phase: 'confrontation', idx: i,
            leftId: m.left, rightId: m.right,
            leftName: cl.name, rightName: cr.name,
            rivalry: rivalLvl.rivalry || 0,
            isFate: (rivalLvl.rivalry || 0) >= 70,
          });
        }
      }
    });

    // Initialize preview state
    App._showPreview = {
      validMatches,
      results: new Array(validMatches.length).fill(null),
      currentWatching: -1,
      stateSnapshot: JSON.parse(JSON.stringify(G)),
      confrontationPairs: confrontations.map(c => c.idx),
      confrontationMap: Object.fromEntries(confrontations.map(c => [c.idx, c])),
      _shownConfrontations: new Set(),
    };

    // 螳｣謌ｦ蟶・相繝昴ャ繝励い繝・・縺ｯ蜷・ｩｦ蜷医′繝輔か繝ｼ繧ｫ繧ｹ縺輔ｌ縺溽椪髢薙↓陦ｨ遉ｺ・・enderMatchPreview蜀・〒蛻ｶ蠕｡・・
    App._checkAndShowPreShowMilestone(function() {
      renderMatchPreview();
    });
  },

  _fillMissingShowPreviewResults() {
    const sp = App._showPreview;
    if (!sp || !Array.isArray(sp.validMatches) || !Array.isArray(sp.results)) return false;
    let filled = false;
    sp.validMatches.forEach((m, idx) => {
      if (sp.results[idx]) return;
      if (m.matchType === 'tag') {
        const ids = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
        if (ids.every(id => G.roster.find(c => c.id === id))) return;
        sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true, matchType: 'tag' };
        filled = true;
        return;
      } else {
        const charL = G.roster.find(c => c.id === m.left);
        const charR = G.roster.find(c => c.id === m.right);
        if (charL && charR) return;
      }
      sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
      filled = true;
    });
    return filled;
  },

  // 隧ｦ蜷育｢ｺ螳壼ｾ後・蜈ｱ騾壹ヵ繝ｭ繝ｼ: (隕ｳ謌ｦ譎ゅ・縺ｿ)隧ｦ蜷亥ｾ後ヵ繝ｬ繝ｼ繝舌・繝昴ャ繝励い繝・・ 竊・renderMatchPreview 竊・蜈ｨ螳御ｺ・↑繧・finalizeShow
  // (specs/match-flavor-popup-spec-v0.1.md ﾂｧ4.6)
  // opts.skipFlavor: true 縺ｧ繧ｹ繧ｭ繝・・(逵∫払縺ｮ諢乗晁｡ｨ遉ｺ)縲ゆｽ咎渊繝昴ャ繝励い繝・・繧貞・縺輔★蜊ｳ finalize 縺吶ｋ縲・
  _afterMatchSettle(idx, opts) {
    const sp = App._showPreview;
    if (!sp) return;
    const skipFlavor = !!(opts && opts.skipFlavor);
    const result = sp.results[idx];
    const finalize = () => {
      renderMatchPreview();
      if (sp.results.every(r => r !== null)) App.finalizeShow();
    };
    // skipFlavor / _stale (驕ｸ謇倶ｸ榊惠繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ) 縺ｮ縺ｨ縺阪・菴咎渊繧ｹ繧ｭ繝・・
    if (skipFlavor || !result || result._stale) { finalize(); return; }
    App._runPostMatchFlavorForMatch(idx, result, finalize);
  },

  // Skip a single match (instant calculation) 窶・菴咎渊繝輔Ξ繝ｼ繝舌・縺ｯ蜃ｺ縺輔↑縺・逵∫払縺ｮ諢乗晁｡ｨ遉ｺ)
  skipMatch(idx) {
    const sp = App._showPreview;
    if (!sp || sp.results[idx]) return;
    // 荳蠎ｦ縺ｧ繧ゅせ繧ｭ繝・・繧呈款縺励◆繧峨√◎縺ｮ闊郁｡後・谿九ｊ蜈ｨ隧ｦ蜷医〒 pre/post-match 繝輔Ξ繝ｼ繝舌・繧呈椛蛻ｶ縺吶ｋ
    sp._suppressFlavor = true;
    const staleFilled = App._fillMissingShowPreviewResults();
    if (sp.results[idx]) { App._afterMatchSettle(idx, { skipFlavor: true }); return; }
    const m = sp.validMatches[idx];
    // 笏笏 繧ｿ繝・げ繝槭ャ繝・笏笏
    if (m.matchType === 'tag') {
      const f1 = G.roster.find(c => c.id === m.teamA.fighter1);
      const f2 = G.roster.find(c => c.id === m.teamA.fighter2);
      const f3 = G.roster.find(c => c.id === m.teamB.fighter1);
      const f4 = G.roster.find(c => c.id === m.teamB.fighter2);
      if (!f1 || !f2 || !f3 || !f4) {
        sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true, matchType: 'tag' };
        App._afterMatchSettle(idx, { skipFlavor: true });
        return;
      }
      const tagRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.teamA.fighter1, m.teamB.fighter1, 0x7A60));
      const bondA = G.relationships ? ((G.relationships[`${Math.min(f1.id,f2.id)}>${Math.max(f1.id,f2.id)}`] || {}).bond || 50) : 50;
      const bondB = G.relationships ? ((G.relationships[`${Math.min(f3.id,f4.id)}>${Math.max(f3.id,f4.id)}`] || {}).bond || 50) : 50;
      const tagExpA = Engine.tagExp.getCount(G, f1.id, f2.id);
      const tagExpB = Engine.tagExp.getCount(G, f3.id, f4.id);
      // bond-rivalry plan P-1: bond 竕､ 20 荳堺ｻｲ繝壹い縺ｯ隧ｦ蜷井ｸｭ縺ｮ閭ｽ蜉・-3
      const lowBondA = bondA <= 20;
      const lowBondB = bondB <= 20;
      const _penalize = (c) => ({ ...c, power: c.power - 3, speed: c.speed - 3, technique: c.technique - 3, spirit: c.spirit - 3 });
      const f1p = lowBondA ? _penalize(f1) : f1;
      const f2p = lowBondA ? _penalize(f2) : f2;
      const f3p = lowBondB ? _penalize(f3) : f3;
      const f4p = lowBondB ? _penalize(f4) : f4;
      sp.results[idx] = Engine.tagMatch.simulateTagMatch(
        { fighter1: f1p, fighter2: f2p }, { fighter1: f3p, fighter2: f4p },
        tagRng, { bond_A: bondA, bond_B: bondB, tagExp_A: tagExpA, tagExp_B: tagExpB, lowBondA, lowBondB }
      );
      // P-1: 隧ｦ蜷亥ｾ・trust -1・井ｸ堺ｻｲ繝壹い荳｡閠・ｼ・
      if (lowBondA || lowBondB) {
        const lowIds = [];
        if (lowBondA) lowIds.push(f1.id, f2.id);
        if (lowBondB) lowIds.push(f3.id, f4.id);
        G.roster = G.roster.map(c => lowIds.includes(c.id)
          ? { ...c, trust: Math.max(0, (c.trust != null ? c.trust : 50) - 1) }
          : c);
      }
      try { Audio.play('tick'); } catch(e) {}
      App._afterMatchSettle(idx, { skipFlavor: true });
      return;
    }
    // 笏笏 繧ｷ繝ｳ繧ｰ繝ｫ繝槭ャ繝・笏笏
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) {
      if (!staleFilled) sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
      App._afterMatchSettle(idx, { skipFlavor: true });
      return;
    }
    const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
    sp.results[idx] = Engine.battle.simulateMatch(charL, charR, matchRng, m.isTitle ? 2 : 1);
    try { Audio.play('tick'); } catch(e) {}
    App._afterMatchSettle(idx, { skipFlavor: true });
  },

  // Watch match in battle engine iframe
  watchMatch(idx) {
    const sp = App._showPreview;
    if (!sp) return;
    // 笏笏 繧ｿ繝・げ繝槭ャ繝・ tag-battle.html 縺ｫ蛻・ｲ・笏笏
    if (sp.validMatches[idx]?.matchType === 'tag') {
      App._watchTagMatch(idx);
      return;
    }
    if (sp.results[idx]) return;
    App._fillMissingShowPreviewResults();
    if (sp.results[idx]) { App._afterMatchSettle(idx); return; }
    const m = sp.validMatches[idx];
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) {
      sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
      App._afterMatchSettle(idx);
      return;
    }
    // 繧ｨ繝ｳ繧ｸ繝ｳ螳溯｡鯉ｼ・ecordFrames=true・俄・Replay 譁ｹ蠑・ 繧ｷ繝溘Η繝ｬ繝ｼ繝育ｵ先棡・九ヵ繝ｬ繝ｼ繝蛻励ｒ iframe 縺ｸ貂｡縺励※蜀咲函
    const matchTier = m.isTitle ? 2 : 1;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
    const result = Engine.battle.simulateMatch(charL, charR, rng, matchTier, { recordFrames: true });
    sp.results[idx] = result;
    sp.currentWatching = idx;
    // Show iframe
    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    // Show escape button after 8 seconds (safety net if iframe gets stuck)
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);
    // Send match data to iframe (avoid contentDocument 窶・causes SecurityError on file://)
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: { ...charL, portraitUrl: getPortraitUrl(charL.id), profile: CHAR_PROFILES[charL.id] || '', vl: charL.voiceLines || charL.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[charL.id]) || ['窶ｦ・・] },
      right: { ...charR, portraitUrl: getPortraitUrl(charR.id), profile: CHAR_PROFILES[charR.id] || '', vl: charR.voiceLines || charR.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[charR.id]) || ['窶ｦ・・] },
      result,
      matchInfo: {
        header: m.isTitle ? (G.titles.world.championId ? '醇 TITLE MATCH' : '醇 蛻昜ｻ｣邇玖・ｱｺ螳壽姶') : (idx === 0 ? '繝｡繧､繝ｳ繧､繝吶Φ繝・ : `隨ｬ${sp.validMatches.length - idx}隧ｦ蜷・),
        subHeader: `${charL.name} vs ${charR.name}`,
        matchNum: idx === 0 ? sp.validMatches.length : (sp.validMatches.length - idx),
        totalMatches: sp.validMatches.length,
        isTitle: !!m.isTitle,
        isSpecialMatch: false,
        matchTier,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, charL.id, charR.id); return rl ? rl.tier : 0; })(),
        leftPersonality: charL.personality || 'normal',
        leftArchetype: charL.archetype || 'normal',
        rightPersonality: charR.personality || 'normal',
        rightArchetype: charR.archetype || 'normal',
        sfxMasterVol: Audio.sfxMasterVol,
        bgmMasterVol: Audio.bgmMasterVol,
      }
    };
    // BGM蛻・崛: 繧ｿ繧､繝医Ν謌ｦ縺ｯFileBGM縲・壼ｸｸ隧ｦ蜷医・繝√ャ繝励メ繝･繝ｼ繝ｳbattle
    if (m.isTitle) {
      try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    } else {
      try { Audio.bgm.play('battle'); } catch(e) {}
    }
    let sent = false;
    const sendOnce = () => {
      if (sent) return;
      sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    // Reload iframe with cache-busting param to guarantee fresh load
    // NOTE: singles 縺ｯ蠢・★ battle-engine.html 繧剃ｽｿ縺・ｼ育峩蜑阪・繧ｿ繝・げ隧ｦ蜷医〒 tag-battle.html 縺ｫ螟峨ｏ縺｣縺ｦ縺・※繧よ綾縺呻ｼ・
    iframe.onload = () => setTimeout(sendOnce, 200);
    iframe.src = 'battle-engine.html?t=' + Date.now();
    // Fallback: retry if onload was missed
    setTimeout(sendOnce, 800);
  },

  // 繧ｿ繝・げ繝槭ャ繝√ｒ tag-battle.html 縺ｧ隕ｳ謌ｦ
  _watchTagMatch(idx) {
    const sp = App._showPreview;
    if (!sp || sp.results[idx]) return;
    const m = sp.validMatches[idx];
    const f1 = G.roster.find(c => c.id === m.teamA.fighter1);
    const f2 = G.roster.find(c => c.id === m.teamA.fighter2);
    const f3 = G.roster.find(c => c.id === m.teamB.fighter1);
    const f4 = G.roster.find(c => c.id === m.teamB.fighter2);
    if (!f1 || !f2 || !f3 || !f4) {
      sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true, matchType: 'tag' };
      renderMatchPreview();
      if (sp.results.every(r => r !== null)) App.finalizeShow();
      return;
    }
    // 繧ｨ繝ｳ繧ｸ繝ｳ螳溯｡鯉ｼ・ecordFrames=true・・
    const tagRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.teamA.fighter1, m.teamB.fighter1, 0x7A60));
    const bondA = G.relationships ? ((G.relationships[`${Math.min(f1.id,f2.id)}>${Math.max(f1.id,f2.id)}`] || {}).bond || 50) : 50;
    const bondB = G.relationships ? ((G.relationships[`${Math.min(f3.id,f4.id)}>${Math.max(f3.id,f4.id)}`] || {}).bond || 50) : 50;
    const tagExpA = Engine.tagExp.getCount(G, f1.id, f2.id);
    const tagExpB = Engine.tagExp.getCount(G, f3.id, f4.id);
    // bond-rivalry plan P-1: bond 竕､ 20 荳堺ｻｲ繝壹い縺ｯ隧ｦ蜷井ｸｭ縺ｮ閭ｽ蜉・-3
    const lowBondA = bondA <= 20;
    const lowBondB = bondB <= 20;
    const _penalize = (c) => ({ ...c, power: c.power - 3, speed: c.speed - 3, technique: c.technique - 3, spirit: c.spirit - 3 });
    const f1p = lowBondA ? _penalize(f1) : f1;
    const f2p = lowBondA ? _penalize(f2) : f2;
    const f3p = lowBondB ? _penalize(f3) : f3;
    const f4p = lowBondB ? _penalize(f4) : f4;
    const result = Engine.tagMatch.simulateTagMatch(
      { fighter1: f1p, fighter2: f2p }, { fighter1: f3p, fighter2: f4p },
      tagRng, { bond_A: bondA, bond_B: bondB, tagExp_A: tagExpA, tagExp_B: tagExpB, recordFrames: true, lowBondA, lowBondB }
    );
    // P-1: 隧ｦ蜷亥ｾ・trust -1・井ｸ堺ｻｲ繝壹い荳｡閠・ｼ・
    if (lowBondA || lowBondB) {
      const lowIds = [];
      if (lowBondA) lowIds.push(f1.id, f2.id);
      if (lowBondB) lowIds.push(f3.id, f4.id);
      G.roster = G.roster.map(c => lowIds.includes(c.id)
        ? { ...c, trust: Math.max(0, (c.trust != null ? c.trust : 50) - 1) }
        : c);
    }
    sp.results[idx] = result;
    sp.currentWatching = idx;
    // BGM: 騾壼ｸｸ battle
    try { Audio.bgm.play('battle'); } catch(e) {}
    // iframe 陦ｨ遉ｺ
    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);
    const iframe = document.getElementById('battleIframe');
    const mkProfile = (c) => ({
      ...c,
      portraitUrl: getPortraitUrl(c.id),
      profile: CHAR_PROFILES[c.id] || '',
    });
    const msg = {
      type: 'START_TAG_MATCH',
      teamA: { fighter1: mkProfile(f1), fighter2: mkProfile(f2) },
      teamB: { fighter1: mkProfile(f3), fighter2: mkProfile(f4) },
      result,
      matchInfo: {
        header: idx === 0 ? '繝｡繧､繝ｳ繧､繝吶Φ繝・繧ｿ繝・げ)' : `隨ｬ${sp.validMatches.length - idx}隧ｦ蜷・繧ｿ繝・げ)`,
        matchNum: idx === 0 ? sp.validMatches.length : (sp.validMatches.length - idx),
        totalMatches: sp.validMatches.length,
        sfxMasterVol: Audio.sfxMasterVol,
        bgmMasterVol: Audio.bgmMasterVol,
        chemA: result.chemA,
        chemB: result.chemB,
      }
    };
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    iframe.src = 'tag-battle.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // Receive result from battle engine
  receiveBattleResult(data) {
    // Hide escape button
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    // Junior Tournament context: route to JT handler
    const jtPre = App._jtPreview;
    if (jtPre && jtPre.phase === 'watching') {
      App._receiveJTBattleResult(data);
      return;
    }
    // PPV context: route to PPV handler
    const pp = App._ppvPreview;
    if (pp && pp.currentWatching >= 0) {
      App._receivePPVBattleResult(data);
      return;
    }
    // War context: route to war handler
    const wp = App._warPreview;
    if (wp && wp.currentWatching >= 0) {
      App._receiveWarBattleResult(data);
      return;
    }
    // B3 context
    const b3 = App._b3Preview;
    if (b3 && b3.watching) {
      App._receiveB3BattleResult(data);
      return;
    }
    // B2 context
    const b2 = App._b2Preview;
    if (b2 && b2.watching) {
      App._receiveB2BattleResult(data);
      return;
    }
    // Show context
    const sp = App._showPreview;
    if (!sp || sp.currentWatching < 0) return;
    const idx = sp.currentWatching;
    const m = sp.validMatches[idx];
    // 笏笏 Replay譁ｹ蠑・ 繧ｷ繝ｳ繧ｰ繝ｫ/繧ｿ繝・げ縺ｨ繧ゅ↓ sp.results[idx] 縺ｫ莠句燕險育ｮ礼ｵ先棡縺梧里縺ｫ蜈･縺｣縺ｦ縺・ｋ縲Ｊframe 縺九ｉ縺ｯ髢峨§繧九□縺・笏笏
    if (m && m.matchType === 'tag') {
      try { Audio.bgm.stop(); } catch(e) {}
      document.getElementById('battleOverlay').style.display = 'none';
      const tagIdx = sp.currentWatching;
      sp.currentWatching = -1;
      try { Audio.play('coin'); } catch(e) {}
      const allDone = sp.results.every(r => r !== null);
      if (allDone) {
        try { Audio.bgm.play('management'); } catch(e) {}
      } else {
        setTimeout(() => { if (App._showPreview) { try { Audio.bgm.play('battle'); } catch(e) {} } }, 300);
      }
      // 繧ｿ繝・げ縺ｯ隧ｦ蜷亥ｾ後ヵ繝ｬ繝ｼ繝舌・縺ｯ蜃ｺ縺輔↑縺・(`_collectPostMatchPopupsForMatch` 蛛ｴ縺ｧ tag 繧偵せ繧ｭ繝・・)
      App._afterMatchSettle(tagIdx);
      return;
    }
    // Guard: single 繝槭ャ繝√ｂ莠句燕險育ｮ玲ｸ医∩縲Ｊframe 縺九ｉ MATCH_RESULT 縺梧擂縺ｦ繧らｵ先棡縺ｯ荳頑嶌縺阪＠縺ｪ縺・
    if (!sp.results[idx]) {
      // 諠ｳ螳壼､・ watchMatch 繧帝壹ｉ縺夂峩謗･ MATCH_RESULT 縺梧擂縺溷ｴ蜷医・繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ
      const charL = G.roster.find(c => c.id === m.left);
      const charR = G.roster.find(c => c.id === m.right);
      sp.results[idx] = {
        left: charL, right: charR,
        winner: data.winner,
        finType: data.finType || '',
        finMove: data.finMove || '',
        turns: data.turns || 0,
        mq: data.mq || 50,
        hpLeft: { final: data.hpLeft ? data.hpLeft.current : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
        hpRight: { final: data.hpRight ? data.hpRight.current : 0, max: data.hpRight ? data.hpRight.max : 100 },
        log: data.log || []
      };
    }
    // BGM: FileBGM繝輔ぉ繝ｼ繝峨い繧ｦ繝・+ 谿玖ｩｦ蜷医≠繧翫↑繧叡attle蠕ｩ蟶ｰ縲∝・螳御ｺ・↑繧泳ingle縺ｸ(finalizeShow縺ｧ驕・ｻｶ蜀咲函)
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    if (sp.results.every(r => r !== null)) {
      // 蜈ｨ隧ｦ蜷亥ｮ御ｺ・ management BGM縺ｯ豬√＆縺嗚ingle蠕・ｩ・finalizeShow縺ｧ2.5遘貞ｾ後↓蜀咲函)
    } else {
      // 縺ｾ縺隧ｦ蜷医′谿九▲縺ｦ縺・ｋ 竊・battleBGM繧貞・髢具ｼ郁・陦御ｸｭ・・
      // fadeOut蠕後↓BGM._current='battle'縺梧ｮ九ｋ縺溘ａ縲《top()縺ｧ繝ｪ繧ｻ繝・ヨ縺励※縺九ｉ蜀咲函
      setTimeout(() => { if (App._showPreview) { try { Audio.bgm.stop(); Audio.bgm.play('battle'); } catch(e) {} } }, 1600);
    }
    // Hide iframe
    document.getElementById('battleOverlay').style.display = 'none';
    const watchedIdx = sp.currentWatching;
    sp.currentWatching = -1;
    try { Audio.play('coin'); } catch(e) {}
    App._afterMatchSettle(watchedIdx);
  },

  // Emergency escape from battle engine (if iframe gets stuck)
  escapeBattle() {
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    // BGM蛛懈ｭ｢ + 蠕ｩ蟶ｰ
    try { Audio.fileBgm.stop(); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    // Auto-skip the stuck match
    const sp = App._showPreview;
    const wp = App._warPreview;
    const ppvPrev = App._ppvPreview;
    if (ppvPrev && ppvPrev.currentWatching >= 0) {
      const idx = ppvPrev.currentWatching;
      ppvPrev.currentWatching = -1;
      if (!ppvPrev.results[idx]) App.ppvSkipMatch(idx);
      // PPV BGM蠕ｩ蟶ｰ
      if (!ppvPrev.results.every(r => r !== null)) {
        setTimeout(() => { if (App._ppvPreview) { try { Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 }); } catch(e) {} } }, 300);
      }
    } else if (sp && sp.currentWatching >= 0) {
      const idx = sp.currentWatching;
      sp.currentWatching = -1;
      if (!sp.results[idx]) App.skipMatch(idx);
      else { renderMatchPreview(); if (sp.results.every(r => r !== null)) App.finalizeShow(); }
      // 闊郁｡沓GM蠕ｩ蟶ｰ・郁・陦御ｸｭ縺ｯbattle・俄・stop()縺ｧBGM迥ｶ諷九Μ繧ｻ繝・ヨ蠕後↓蜀咲函
      if (!sp.results.every(r => r !== null)) {
        setTimeout(() => { if (App._showPreview) { try { Audio.bgm.stop(); Audio.bgm.play('battle'); } catch(e) {} } }, 300);
      }
    } else if (wp && wp.currentWatching >= 0) {
      const idx = wp.currentWatching;
      wp.currentWatching = -1;
      if (!wp.results[idx]) App._skipWarMatch(idx);
      // 蟇ｾ謚玲姶BGM蠕ｩ蟶ｰ
      if (!wp.results.every(r => r !== null)) {
        setTimeout(() => { if (App._warPreview) { try { Audio.fileBgm.play('../bgm/MusMus-BGM-125.mp3', { loop: true, volume: 0.10 }); } catch(e) {} } }, 300);
      }
    }
    const jt = App._jtPreview;
    if (jt && jt.phase === 'watching') {
      const ri = jt.currentRound;
      const mi = jt.currentMatch;
      jt.phase = 'matchResult';
      App.jtSkipMatch(ri, mi);
      return;
    }
    // B3
    const b3 = App._b3Preview;
    if (b3 && b3.watching) {
      b3.watching = false;
      App.b3SkipMatch();
      return;
    }
    // B2
    const b2 = App._b2Preview;
    if (b2 && b2.watching) {
      b2.watching = false;
      App.b2SkipMatch();
      return;
    }
  },

  // Skip all remaining matches
  skipAllMatches() {
    const sp = App._showPreview;
    if (!sp) return;
    App._fillMissingShowPreviewResults();
    sp.validMatches.forEach((m, idx) => {
      if (sp.results[idx]) return;
      if (m.matchType === 'tag') {
        const f1 = G.roster.find(c => c.id === m.teamA.fighter1);
        const f2 = G.roster.find(c => c.id === m.teamA.fighter2);
        const f3 = G.roster.find(c => c.id === m.teamB.fighter1);
        const f4 = G.roster.find(c => c.id === m.teamB.fighter2);
        if (!f1 || !f2 || !f3 || !f4) {
          sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true, matchType: 'tag' };
          return;
        }
        const tagRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.teamA.fighter1, m.teamB.fighter1, 0x7A60));
        const bondA = G.relationships ? ((G.relationships[`${Math.min(f1.id,f2.id)}>${Math.max(f1.id,f2.id)}`] || {}).bond || 50) : 50;
        const bondB = G.relationships ? ((G.relationships[`${Math.min(f3.id,f4.id)}>${Math.max(f3.id,f4.id)}`] || {}).bond || 50) : 50;
        const tagExpA = Engine.tagExp.getCount(G, f1.id, f2.id);
        const tagExpB = Engine.tagExp.getCount(G, f3.id, f4.id);
        sp.results[idx] = Engine.tagMatch.simulateTagMatch(
          { fighter1: f1, fighter2: f2 },
          { fighter1: f3, fighter2: f4 },
          tagRng,
          { bond_A: bondA, bond_B: bondB, tagExp_A: tagExpA, tagExp_B: tagExpB }
        );
        return;
      }
      const charL = G.roster.find(c => c.id === m.left);
      const charR = G.roster.find(c => c.id === m.right);
      if (!charL || !charR) {
        sp.results[idx] = { winner: 'draw', mq: 0, finType: '', finMove: '', turns: 0, log: [], _stale: true };
        return;
      }
      const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
      sp.results[idx] = Engine.battle.simulateMatch(charL, charR, matchRng, m.isTitle ? 2 : 1);
    });
    if (sp.results.some(r => r === null)) {
      renderMatchPreview();
      if (false) {
        Audio.play('error');
        alert('繧ｫ繝ｼ繝牙・縺ｫ蝨ｨ邀阪＠縺ｦ縺・↑縺・∈謇九・隧ｦ蜷医′縺ゅｊ縲∝・隧ｦ蜷医せ繧ｭ繝・・繧貞ｮ御ｺ・〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・);
      }
      return;
    }
    try { Audio.play('bellx3'); } catch(e) {}
    App.finalizeShow();
  },

  // Post-processing: apply titles, popularity, injuries (mirrors Engine.executeShow logic)
  finalizeShow() {
    const sp = App._showPreview;
    if (!sp) return;
    const results = sp.results;
    const validMatches = sp.validMatches;

    // Guard: ensure all results are resolved
    if (!Array.isArray(results) || results.some(r => r === null)) {
      console.error('finalizeShow: unresolved results', { validMatches, results });
      Audio.play('error');
      renderMatchPreview();
      alert('隧ｦ蜷育ｵ先棡縺ｮ遒ｺ螳壹↓螟ｱ謨励＠縺ｾ縺励◆縲ゅき繝ｼ繝峨↓荳肴紛蜷医′縺ゅｋ蜿ｯ閭ｽ諤ｧ縺後≠繧翫∪縺吶・);
      return;
    }
    let s = { ...G, totalShows: G.totalShows + 1, weekPhase: 'showExec' };
    // forcedRest・・3莨鷹､企｡倥＞・峨ヵ繝ｩ繧ｰ繧偵け繝ｪ繧｢ 窶・縺薙・闊郁｡悟ｾ後・騾壼ｸｸ蜿ょ刈蜿ｯ閭ｽ縺ｫ謌ｻ縺・
    let roster = s.roster.map(c => c.forcedRest ? { ...c, forcedRest: false } : { ...c });
    let rivalries = { ...s.rivalries };
    let titles = { ...s.titles, world: { ...s.titles.world } };
    const events = [];
    // Phase 4: 闊郁｡悟燕縺ｮ騾｣謨玲焚繧定ｨ倬鹸・・-05/C-06蛻､螳夂畑・・
    const preShowLosingStreaks = new Map(roster.map(c => [c.id, c.losingStreak || 0]));

    // 笏笏 v4 ﾂｧ2-1: F02竭 ignite 蛻､螳夲ｼ医Μ繝ｼ繝繝ｼ蜷悟｣ｫ縺ｮ繧ｫ繝ｼ繝峨′邨・∪繧後※縺・ｌ縺ｰ逋ｺ轣ｫ・・笏笏
    if (Engine.factions && typeof Engine.factions.checkF02IgniteTrigger === 'function' && !s._pendingFactionEvent) {
      const ig = Engine.factions.checkF02IgniteTrigger(s, validMatches);
      if (ig.eligible) {
        s = { ...s, _pendingFactionEvent: { eventId: 'F02_IGNITE', payload: ig.payload } };
      }
    }

    // Rivalry & coach bonuses (繧ｿ繝・げ縺ｯ繧ｹ繧ｭ繝・・)
    const confrontationPairs = sp.confrontationPairs || [];
    const deferredRivalryIdxs = []; // 蝗邵∵ｱｺ逹蛟呵｣懊・繧｢縺ｮ recordRivalry 繧・MQ遒ｺ螳壼ｾ後∪縺ｧ菫晉蕗
    results.forEach((result, i) => {
      const m = validMatches[i];
      if (m.matchType === 'tag') return; // 繧ｿ繝・げ隧ｦ蜷医・蝗邵√・繧ｱ繝溘せ繝医Μ繝ｼ繝懊・繝翫せ蟇ｾ雎｡螟・
      const pairState = Engine.title.getRivalryPairState({ ...s, rivalries }, m.left, m.right);
      const rivalLvl = Engine.title.getRivalryLevel({ ...s, rivalries }, m.left, m.right);
      if (rivalLvl) { result.mq = Math.min(100, result.mq + rivalLvl.mqBonus); result.rivalryBonus = rivalLvl; }
      const chemistryBonus = Engine.title.getMatchChemistryBonus(pairState);
      if (chemistryBonus > 0) { result.mq = Math.min(100, result.mq + chemistryBonus); result.friendshipBonus = chemistryBonus; }
      if (m.isTitle) { result.mq = Math.min(100, result.mq + (TITLES.find(t => t.id === 'world')?.mqBonus || 15)); result.isTitleMatch = true; }
      // 蝗邵∵ｱｺ逹蛟呵｣懶ｼ・inRivalry>=60 or resolutionCount>=1・峨・ recordRivalry 繧樽Q遒ｺ螳壼ｾ後∪縺ｧ菫晉蕗
      const isResolutionCandidate = pairState && !pairState.resolvedType && pairState.minRivalry >= 60;
      const hasPartialResolution = pairState && !pairState.resolvedType && (rivalries[Engine.title.getRivalryKey(m.left, m.right)]?.resolutionCount || 0) >= 1 && pairState.minRivalry >= 80;
      if (isResolutionCandidate || hasPartialResolution) {
        deferredRivalryIdxs.push(i);
      } else {
        const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right, result.mq);
        rivalries = rivalResult.rivalries;
        if (rivalResult.msg) events.push(rivalResult.msg);
      }
      // coachMQBonus 窶・MQ螟夜Κ繝懊・繝翫せ謨ｴ逅・〒蟒・ｭ｢
    });

    // Fan expectation MQ bonus 窶・MQ螟夜Κ繝懊・繝翫せ謨ｴ逅・〒蟒・ｭ｢縲ゅヵ繝ｩ繧ｰ縺ｮ縺ｿ谿九☆・医ち繝・げ縺ｯ繧ｹ繧ｭ繝・・・・
    const fanExpects = Engine.fanExpect.generate(s);
    validMatches.forEach((m, i) => {
      const result = results[i]; if (!result || m.matchType === 'tag') return;
      const isFanExpectMatch = fanExpects.some(exp =>
        (exp.leftId === result.left.id && exp.rightId === result.right.id) ||
        (exp.leftId === result.right.id && exp.rightId === result.left.id)
      );
      if (isFanExpectMatch) result.fanExpectMatch = true;
    });

    // Title outcomes
    const titleMatchOutcomes = [];
    validMatches.forEach((m, i) => {
      if (!m.isTitle || !results[i]) return;
      if (m.isReclaim) return; // Phase 4: 螂ｪ驍・倦謌ｦ隧ｦ蜷医・蟆ら畑繝上Φ繝峨Λ縺ｧ蜃ｦ逅・
      const r = results[i];
      const champId = titles.world.championId;
      const challengerId = champId === m.left ? m.right : m.left;
      const challengerName = challengerId != null ? (roster.find(f => f.id === challengerId)?.name) : undefined;
      const tempState = { ...s, titles, roster };
      if (r.winner === 'draw') {
        if (champId) { const def = Engine.title.recordDefense(tempState, { challengerName }); titles = def.titles; roster = def.roster; events.push(def.msg); }
        titleMatchOutcomes.push({ outcome: 'defense', champId, challengerId });
      } else {
        const winnerId = r.winner === 'left' ? m.left : m.right;
        if (!champId || winnerId !== champId) {
          const crown = Engine.title.crownChampion(tempState, winnerId); titles = crown.titles; roster = crown.roster; events.push(crown.msg);
          titleMatchOutcomes.push({ outcome: 'change', newChampId: winnerId, prevChampId: champId, challengerId });
        } else {
          const def = Engine.title.recordDefense(tempState, { challengerName }); titles = def.titles; roster = def.roster; events.push(def.msg);
          titleMatchOutcomes.push({ outcome: 'defense', champId, challengerId });
        }
      }
    });

    // v1.2: 荵ｱ蜈･繝槭ャ繝∫ｵ先棡蜃ｦ逅・
    if (App._intrusionData) {
      const id = App._intrusionData;
      // 荵ｱ蜈･驕ｸ謇九′繧ｿ繧､繝医Ν繧貞･ｪ蜿悶＠縺溘°蛻､螳・
      const intruderId = id.intruder.id;
      const intruderWon = titles.world.championId === intruderId;
      if (intruderWon) {
        // 邇句ｺｧ遨ｺ菴・+ 繝偵・繝医ム繧ｦ繝ｳ
        // v1.x菫ｮ豁｣: 謖ｯ繧悟ｹ・・險ｭ險・窶・譌ｧ -7縲・20 縺ｯ蛟､蝓歇-10,+10]縺ｫ蟇ｾ縺鈴℃螟ｧ縺九▽
        //   譌ｧ繧ｳ繝ｼ繝・`Math.max(0, (s.heatScore || 50) + penalty)` 縺ｫ莠碁㍾繝舌げ
        //   (heat=0 縺・50 縺ｫ蛹悶￠繧・/ 荳矩剞0縺ｧ雋蛛ｴ蟶ｯ繧堤ｴ螢・ 縺後≠繧翫梧怙鬮俶ｽｮ竊偵ル繝･繝ｼ繝医Λ繝ｫ縲堺ｸ謦・′逋ｺ逕溘＠縺ｦ縺・◆縲・
        //   蝓ｺ譛ｬ -3縲・6縲∫樟蝨ｨHot/On Fire(hs竕･6)蟶ｯ縺ｧ縺ｯ霑ｽ蜉 -1縲・2縲０n Fire竊偵ぐ繝ｪWarm 縺ｾ縺ｧ縺ｧ豁｢繧√ｋ縲・
        const intRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 8889));
        const basePenalty = -(3 + Engine.rng.int(intRng, 0, 3));
        const hotExtra = (s.heatScore || 0) >= 6 ? -(1 + Engine.rng.int(intRng, 0, 1)) : 0;
        const penalty = basePenalty + hotExtra;
        titles = { ...titles, world: { ...titles.world, championId: null, defenses: 0 } };
        s = { ...s, heatScore: Engine.util.clamp(Math.round(((s.heatScore ?? 0) + penalty) * 10) / 10, -10, 10) };
        const bpIntrusion = { ...(s.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
        bpIntrusion.player = (bpIntrusion.player || 0) - BATTLE_POINT_CFG.intrusion;
        s = { ...s, battlePoints: bpIntrusion };
        events.push(`亞 ${id.fromOrgName}縺ｮ${id.intruder.name}縺ｫ邇句ｺｧ繧貞･ｪ繧上ｌ縺滂ｼ・邇句ｺｧ縺ｯ遨ｺ菴阪↓窶ｦ 繝偵・繝・{penalty}縲∝ｯｾ謌ｦpt-${BATTLE_POINT_CFG.intrusion}`);
      } else {
        // 繝√Ε繝ｳ繝斐が繝ｳ蜍晏茜 竊・蝗｣菴謎ｺｺ豌・2
        s = { ...s, orgPop: Math.min(100, (s.orgPop || 0) + 2) };
        const bpIntrusion = { ...(s.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
        bpIntrusion.player = (bpIntrusion.player || 0) + BATTLE_POINT_CFG.intrusion;
        s = { ...s, battlePoints: bpIntrusion };
        events.push(`荘 ${id.champName}縺御ｹｱ蜈･閠・{id.intruder.name}繧帝縺代◆・・蝗｣菴謎ｺｺ豌・2縲∝ｯｾ謌ｦpt+${BATTLE_POINT_CFG.intrusion}`);
      }
      // ﾂｧ4.2: 荵ｱ蜈･ rivalry +12縲・18・医メ繝｣繝ｳ繝斐が繝ｳ竊比ｹｱ蜈･閠・ｼ・
      if (s.relationships) {
        const intRivalRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6F));
        const intruderId = id.intruder.id;
        const champId = id.champId || (intruderWon ? null : titles.world?.championId);
        if (champId && champId !== intruderId) {
          s = Engine.relationships.applyToRoster({ ...s, roster }, intruderId, [champId], { min: 0, max: 0 }, { min: 12, max: 18 }, intRivalRng);
          s = Engine.relationships.applyToRoster({ ...s, roster }, champId, [intruderId], { min: 0, max: 0 }, { min: 12, max: 18 }, intRivalRng);
        }
      }
      // 荵ｱ蜈･驕ｸ謇九ｒroster縺九ｉ髯､蜴ｻ
      roster = roster.filter(c => !c.isIntrusion);
      // Phase0菫ｮ豁｣: lastIntrusionWeek譖ｴ譁ｰ・医け繝ｼ繝ｫ繝繧ｦ繝ｳ險育ｮ礼畑・・
      const intAbsWeek = Engine.util.absWeek(s.season, s.week);
      s = { ...s, lastIntrusionWeek: intAbsWeek };
    }

    // 笏笏 Phase 4: 螂ｪ驍・倦謌ｦ隧ｦ蜷医・邨先棡蜃ｦ逅・笏笏
    if (App._reclaimData) {
      const rd = App._reclaimData;
      const reclaimIdx = validMatches.findIndex(m => m.isReclaim);
      const r = reclaimIdx >= 0 ? results[reclaimIdx] : null;
      if (r) {
        const winnerId = r.winner === 'left' ? validMatches[reclaimIdx].left : (r.winner === 'right' ? validMatches[reclaimIdx].right : null);
        if (winnerId === rd.challengerId) {
          // 謖第姶閠・享蛻ｩ 竊・繧ｿ繧､繝医Ν螂ｪ驍・
          const reclaimResult = Engine.title.resolveReclaimWin({ ...s, titles, roster }, 'world', rd.challengerId);
          titles = reclaimResult.titles;
          s = { ...s, aiOrgs: reclaimResult.aiOrgs, reclaimChallenges: reclaimResult.reclaimChallenges };
          // 譁ｰ邇玖・・莠ｺ豌怜ｾｮ蠅暦ｼ・rownChampion 逶ｸ蠖薙・蟆上＆縺ｪ繝懊・繝翫せ縺ｮ縺ｿ縲Ｓeassess 縺ｯ逵∫払・・
          roster = roster.map(c => c.id === rd.challengerId
            ? { ...c, popularity: Math.min(100, (c.popularity || 0) + Engine.popularity.applyDiminishing(5, c.popularity || 0)) }
            : c);
          events.push(`醇 邇句ｺｧ螂ｪ驍・ｼ・${rd.challengerName} 縺・${rd.orgName} 縺九ｉ荳也阜邇句ｺｧ繧貞叙繧頑綾縺励◆・～);
          // 讌ｭ逡後ル繝･繝ｼ繧ｹ: 螂ｪ驍・・蜉・
          s = Engine.industryNews.push(s, {
            type: 'reclaimSuccess',
            characterId: rd.challengerId,
            data: {
              challengerName: rd.challengerName,
              fromOrg: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・,
              toOrg: rd.orgName,
            },
          });
        } else {
          // 謖第姶螟ｱ謨・竊・12騾ｱCD
          const reclaimResult = Engine.title.resolveReclaimLoss(s, 'world');
          s = { ...s, reclaimChallenges: reclaimResult.reclaimChallenges };
          events.push(`樗 ${rd.challengerName} 縺ｮ螂ｪ驍・倦謌ｦ縺ｯ螟ｱ謨励・{rd.orgName} 縺御ｸ也阜邇句ｺｧ繧帝亟陦帙＠縺溘Ａ);
          // 讌ｭ逡後ル繝･繝ｼ繧ｹ: 螂ｪ驍・､ｱ謨・
          s = Engine.industryNews.push(s, {
            type: 'reclaimFailure',
            characterId: rd.challengerId,
            data: {
              challengerName: rd.challengerName,
              fromOrg: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・,
              toOrg: rd.orgName,
            },
          });
        }
      }
      // 髦ｲ陦幄・ｒ player roster 縺九ｉ髯､蜴ｻ
      roster = roster.filter(c => !c.isReclaim);
      // pending 繧ｯ繝ｪ繧｢
      const { _pendingReclaim, ...rest } = s;
      s = rest;
      App._reclaimData = null;
    }

    // 髮・ｮ｢v2: matchAppeals竊痴howDraw竊誕ttendance邂怜・
    const appFanExpects = Engine.fanExpect.generate(s);
    const appMatchAppeals = validMatches.map(m => {
      if (m.matchType === 'tag') {
        // 繧ｿ繝・げ: 4莠ｺ縺ｮ蟷ｳ蝮・寔螳｢蜉帙〒邁｡譏楢ｨ育ｮ・
        const ids = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
        const fighters = ids.map(id => roster.find(c => c.id === id)).filter(Boolean);
        if (fighters.length < 4) return 0;
        return fighters.reduce((sum, f) => sum + Engine.attendanceV2.calcDrawPower(f, s), 0) / 2;
      }
      const fA = roster.find(c => c.id === m.left);
      const fB = roster.find(c => c.id === m.right);
      if (!fA || !fB) return { totalAppeal: 0 };
      const rivalryAB = s.relationships ? (s.relationships[`${m.left}>${m.right}`]?.rivalry || 0) : 0;
      const rivalryBA = s.relationships ? (s.relationships[`${m.right}>${m.left}`]?.rivalry || 0) : 0;
      const isFanExpect = appFanExpects && appFanExpects.some(fe =>
        (fe.leftId === m.left && fe.rightId === m.right) || (fe.leftId === m.right && fe.rightId === m.left));
      const appRivalryLevel = Engine.title.getRivalryLevel(s, m.left, m.right);
      const appPendingClash = appRivalryLevel?.pendingClashBonus || 0;
      const appFr = Engine.freshness.calc(s.matchupLog || [], m.left, m.right, s.totalShows, s.roster.length, null);
      const isF08Match = !!m._f08Locked || (Engine.factions && Engine.factions.isF08DirectiveMatch && Engine.factions.isF08DirectiveMatch(s, m.left, m.right));
      return Engine.attendanceV2.calcMatchAppeal(fA, fB, {
        rivalry: Math.max(rivalryAB, rivalryBA), isTitle: !!m.isTitle, isFanExpect,
        pendingClashBonus: appPendingClash, isFirstMeet: appFr.isFirstMeet, freshnessCount: appFr.countInWindow,
        isF08Match,
      }, s);
    });
    const _appUsedIds = new Set();
    validMatches.forEach(m => {
      if (m.matchType === 'tag') { [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2].forEach(id => _appUsedIds.add(id)); }
      else { _appUsedIds.add(m.left); _appUsedIds.add(m.right); }
    });
    const appNonMatchPromo = roster.filter(c => !_appUsedIds.has(c.id)).reduce((sum, c) => sum + (c.promoStack || 0), 0);
    const appShowDraw = Engine.attendanceV2.calcShowDraw(appMatchAppeals, appNonMatchPromo, s.showVenue);
    const attendRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xA77E));
    const appV2Result = Engine.attendanceV2.calcAttendanceV2(s, s.showVenue, appShowDraw, attendRng);
    let preAttendance = appV2Result.attendance;
    // v1.5s25b: attendance_boost 繝舌ヵ・医・繧､繝ｫ繧ｹ繝医・繝ｳ・・
    const attendBoostBuffPre = (s.milestoneBuffs || []).find(b => b.type === 'attendance_boost');
    if (attendBoostBuffPre) preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * attendBoostBuffPre.multiplier));
    // mq_boost 繝舌ヵ縺ｫ莉倬囂縺吶ｋ髮・ｮ｢蛟咲紫・医き繝ｼ繝峨う繝吶Φ繝・effect 諡｡蠑ｵ縺ｧ MQ+ 縺ｨ蜷梧凾縺ｫ髮・ｮ｢蜉ｹ譫懊ｒ謖√▽繧医≧縺ｫ縺ｪ縺｣縺滂ｼ・
    const mqBoostWithAttendance = (s.milestoneBuffs || []).find(b => b.type === 'mq_boost' && b.attendanceMultiplier);
    if (mqBoostWithAttendance) preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * mqBoostWithAttendance.attendanceMultiplier));
    // next_match_mq 繝舌ヵ縺ｯ迚ｹ螳壹・繧｢蟇ｾ雎｡縲りｩｲ蠖薙・繧｢縺・showCard 縺ｮ縺・★繧後°縺ｫ邨・∪繧後※縺・ｌ縺ｰ縲√◎縺ｮ闊郁｡後・髮・ｮ｢蛟咲紫繧帝←逕ｨ
    const nextMatchMqWithAttendance = (s.milestoneBuffs || []).find(b => b.type === 'next_match_mq' && b.attendanceMultiplier && b.pair);
    if (nextMatchMqWithAttendance) {
      const [p1, p2] = nextMatchMqWithAttendance.pair;
      const pairInCard = (s.showCard || []).some(slot => {
        if (!slot) return false;
        if (slot.matchType === 'tag') {
          const ids = [slot.teamA?.fighter1, slot.teamA?.fighter2, slot.teamB?.fighter1, slot.teamB?.fighter2].filter(Boolean);
          return ids.includes(p1) && ids.includes(p2);
        }
        return (slot.left === p1 && slot.right === p2) || (slot.left === p2 && slot.right === p1);
      });
      if (pairInCard) preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * nextMatchMqWithAttendance.attendanceMultiplier));
    }
    const preOccRate = preAttendance / VENUES[s.showVenue].cap;
    // 闊郁｡檎ｵ先棡逕ｻ髱｢縺ｧ蜍募藤謨ｰ繧定｡ｨ遉ｺ縺吶ｋ縺溘ａ縺ｫstate縺ｫ菫晏ｭ・
    s = { ...s, lastShowAttendance: preAttendance };
    // D螻､ first_dome_sellout: postShow 繝医Μ繧ｬ繝ｼ險ｭ螳・
    if (s.showVenue === 9 && !(s.milestones?.first_dome_sellout)) {
      const _domeCap = VENUES[9]?.cap || 22500;
      if (preAttendance / _domeCap >= 0.95) s = { ...s, _pendingDomeSelloutCeremony: true };
    }
    const crowdMQ = Engine.economy.calcCrowdMQBonus(s.showVenue, preOccRate);
    if (crowdMQ.total !== 0) {
      results.forEach(r => { r.mq = Engine.util.clamp(r.mq + crowdMQ.total, 5, 100); });
      if (crowdMQ.crowdLabel) {
        events.push(`勝・・${crowdMQ.crowdLabel}・・Q蜈ｨ隧ｦ蜷・${crowdMQ.total >= 0 ? '+' : ''}${crowdMQ.total}・荏);
      }
    }

    // 繧ｫ繝ｼ繝蛾ｮｮ蠎ｦMQ陬懈ｭ｣・・atchupLog險倬鹸縺ｮ蜑阪↓險育ｮ・窶・莉雁屓縺ｮ隧ｦ蜷医・螻･豁ｴ縺ｫ蜷ｫ繧√↑縺・√ち繝・げ縺ｯ繧ｹ繧ｭ繝・・・・
    results.forEach((r, i) => {
      const m = validMatches[i];
      if (m.matchType === 'tag') return;
      const appFreshnessRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xF5E5, i));
      const fr = Engine.freshness.calc(s.matchupLog || [], m.left, m.right, s.totalShows, s.roster.length, appFreshnessRng);
      if (fr.bonus > 0) {
        r.mq = Math.min(100, r.mq + fr.bonus);
        r.freshnessBonus = fr.bonus; r.freshnessLabel = fr.label;
      } else if (fr.bonus < 0) {
        r.mq = Engine.util.clamp(r.mq + fr.bonus, 5, 100);
        r.freshnessBonus = fr.bonus; r.freshnessLabel = fr.label;
      }
    });

    // 蝗邵∵ｱｺ逹蛻､螳夲ｼ・Q遒ｺ螳壼ｾ後∽ｿ晉蕗繝壹い縺ｮ縺ｿ・・
    const rivalryResolutions = [];
    deferredRivalryIdxs.forEach(idx => {
      const r = results[idx];
      const m = validMatches[idx];
      if (!r || !m) return;
      const charL = roster.find(c => c.id === m.left);
      const charR = roster.find(c => c.id === m.right);
      if (!charL || !charR) return;
      const avgOV = (Engine.util.ov(charL) + Engine.util.ov(charR)) / 2;
      const key = Engine.title.getRivalryKey(m.left, m.right);
      const currentEntry = rivalries[key] || {};
      const pairState = Engine.title.getRivalryPairState({ ...s, rivalries }, m.left, m.right);
      const resolution = Engine.title.checkResolution(pairState, r.mq, avgOV, currentEntry.resolutionCount || 0);
      if (resolution) {
        const isFinalResolution = resolution.newResolutionCount >= 2;
        const resRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, m.left, m.right, 0xBE77));
        const nextRivalry = resolution.rivalryRange[0] + Engine.rng.int(resRng, 0, resolution.rivalryRange[1] - resolution.rivalryRange[0]);
        const updatedEntry = {
          ...rivalries[key],
          matches: 0,
          lastWeek: s.week,
          lastAbsWeek: Engine.util.absWeek(s.season, s.week),
          lastResolvedWeek: s.week,
          resolutionCount: resolution.newResolutionCount,
          lastBand: 0,
          oneSided: null,
          pendingClashBonus: 0,
          ...(resolution.resolved ? { resolved: resolution.resolved } : {}),
        };
        rivalries = { ...rivalries, [key]: updatedEntry };
        if (s.relationships) {
          const rels = { ...(s.relationships || {}) };
          const keyAB = `${m.left}>${m.right}`;
          const keyBA = `${m.right}>${m.left}`;
          const relAB = { ...(rels[keyAB] || { bond: 50, rivalry: 0 }) };
          const relBA = { ...(rels[keyBA] || { bond: 50, rivalry: 0 }) };
          relAB.rivalry = Engine.relationships._clampAxisValue(nextRivalry, 'rivalry');
          relBA.rivalry = Engine.relationships._clampAxisValue(nextRivalry, 'rivalry');
          rels[keyAB] = relAB;
          rels[keyBA] = relBA;
          s = { ...s, relationships: rels };
        }
        roster = roster.map(c => {
          if (c.id === m.left || c.id === m.right) {
            return { ...c, popularity: Math.min(100, (c.popularity || 0) + resolution.popBonus) };
          }
          return c;
        });
        const rivalOrgPopDelta = Engine.orgPop.applyOrgPopChange(resolution.orgPopBonus, s.orgPop, null);
        s = { ...s, orgPop: Engine.util.clamp((s.orgPop || 0) + rivalOrgPopDelta, 0, 100) };
        const winnerId = r.winner === 'left' ? m.left : (r.winner === 'right' ? m.right : m.left);
        const loserId = winnerId === m.left ? m.right : m.left;
        const winnerName = charL.id === winnerId ? charL.name : charR.name;
        const loserName = charL.id === loserId ? charL.name : charR.name;
        rivalryResolutions.push({
          phase: 'resolution', winnerId, loserId, winnerName, loserName,
          resolutionType: resolution.resolved || 'first',
          isFate: pairState.minRivalry >= 70,
          isSecondResolution: isFinalResolution,
          popBonus: resolution.popBonus, orgPopBonus: rivalOrgPopDelta,
        });
        r.rivalryResolved = true;
        if (!s._rivalryResolvedThisWeek) s = { ...s, _rivalryResolvedThisWeek: [] };
        s._rivalryResolvedThisWeek.push({ fighterId: m.left, fighter2Id: m.right });
        const emoji = resolution.emoji || '笞｡';
        const label = resolution.label || (isFinalResolution ? '譛邨よｱｺ逹' : '蝗邵∵ｱｺ逹');
        events.push(`${emoji} ${winnerName} vs ${loserName} 窶・${label}・・荳｡閠・ｺｺ豌・${resolution.popBonus} 蝗｣菴謎ｺｺ豌・${Math.round(rivalOrgPopDelta * 10) / 10}`);
      } else {
        // 豎ｺ逹荳肴・遶・ 騾壼ｸｸ騾壹ｊ recordRivalry
        const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right, r.mq);
        rivalries = rivalResult.rivalries;
        if (rivalResult.msg) events.push(rivalResult.msg);
      }
    });
    App._pendingRivalryResolutions = rivalryResolutions;

    // MQ popularity (繧ｿ繝・げ: 4莠ｺ縺ｫ蛻・・)
    const mainEventIdx = 0; // index 0 = main event in showCard order
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      const isMainEvent = idx === mainEventIdx;
      if (r.matchType === 'tag') {
        // 繧ｿ繝・げ: perFighter縺ｮ蜈ｨ驕ｸ謇九↓MQ莠ｺ豌励ｒ驕ｩ逕ｨ・・ngine.executeShow L7709繝代ち繝ｼ繝ｳ・・
        const allIds = Object.keys(r.perFighter).map(Number);
        const winIds = r.winner === 'teamA' ? [m.teamA.fighter1, m.teamA.fighter2]
          : r.winner === 'teamB' ? [m.teamB.fighter1, m.teamB.fighter2] : [];
        allIds.forEach(cid => {
          const fighter = roster.find(c => c.id === cid);
          if (!fighter) return;
          const isWin = winIds.includes(cid);
          const fakeSingleResult = { mq: r.mq, winner: isWin ? 'left' : (r.winner === 'draw' ? 'draw' : 'right'),
            left: fighter, right: fighter };
          const mqPop = Engine.applyMQPopularity(roster, fakeSingleResult, isMainEvent, s.orgPop || 0, s);
          roster = mqPop.roster;
        });
      } else {
        const mqPop = Engine.applyMQPopularity(roster, r, isMainEvent, s.orgPop || 0, s);
        roster = mqPop.roster;
      }
    });
    // 髮・ｮ｢v2: 笘・ｮ怜・
    const avgMQ = Math.round(results.reduce((a, r) => a + r.mq, 0) / results.length);
    const appRatingCtx = {
      hasTitleMatch: validMatches.some(m => m.isTitle),
      titleGreatMQ: validMatches.some(m => m.isTitle) ? results.find((r, i) => validMatches[i]?.isTitle)?.mq || 0 : 0,
      rivalryResolved: results.some(r => r.rivalryResolved),
      rivalryCards: validMatches.filter(m => {
        if (!s.relationships || m.matchType === 'tag') return false;
        const rAB = s.relationships[`${m.left}>${m.right}`]?.rivalry || 0;
        const rBA = s.relationships[`${m.right}>${m.left}`]?.rivalry || 0;
        return Math.max(rAB, rBA) >= 30;
      }).length,
      fanExpectMatches: appFanExpects ? Engine.fanExpect.countMatched(validMatches, appFanExpects) : 0,
    };
    const appRating = Engine.attendanceV2.calcShowRating(results, preAttendance, VENUES[s.showVenue].cap, s.showVenue, appRatingCtx);
    const appStars = appRating.stars;

    const orgPopRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x4F50));
    let popResult = Engine.applyShowPopularity(roster, results, s.orgPop, orgPopRng, appStars);
    roster = popResult.roster;
    const bookedRivalryOrgPopBonus = Engine.title.getBookedRivalryOrgPopBonus(s, validMatches.filter(m => m.matchType !== 'tag').map(m => ({ leftId: m.left, rightId: m.right })));
    if (bookedRivalryOrgPopBonus !== 0) {
      popResult = {
        ...popResult,
        popDelta: Math.round((popResult.popDelta + bookedRivalryOrgPopBonus) * 10) / 10,
        orgPop: Engine.util.clamp((popResult.orgPop || 0) + bookedRivalryOrgPopBonus, 0, 100),
      };
      events.push(`櫨 豕ｨ逶ｮ繧ｫ繝ｼ繝牙柑譫・ 蝗邵√き繝ｼ繝臥ｷｨ謌舌〒蝗｣菴謎ｺｺ豌・{bookedRivalryOrgPopBonus >= 0 ? '+' : ''}${Math.round(bookedRivalryOrgPopBonus * 10) / 10}`);
    }
    events.push(`投 笘・{appStars} (MQ avg ${avgMQ}) 竊・蝗｣菴謎ｺｺ豌・{popResult.popDelta >= 0 ? '+' : ''}${Math.round(popResult.popDelta * 100) / 100} (迴ｾ蝨ｨ: ${Engine.util.dispOrgPop(popResult.orgPop)})`);

    // Heat 窶・笘・・繝ｼ繧ｹ
    const oldHeat = Engine.heat.getLevel(s);
    const newHeatScore = Engine.heat.calcUpdate(s, appStars);
    const newHeat = Engine.heat.getLevel({ ...s, heatScore: newHeatScore });
    if (oldHeat.id !== newHeat.id) events.push(`${newHeat.emoji} Heat螟牙虚: ${oldHeat.label} 竊・${newHeat.label}・磯寔螳｢蛟咲紫 ﾃ・{newHeat.mult}・荏);

    // Injuries 窶・separate RNG per fighter to avoid correlation (繧ｿ繝・げ縺ｯ繧ｹ繧ｭ繝・・ 窶・Phase 5蟇ｾ蠢・
    const injuryResults = [];
    const matchInjuredIds = new Array(results.length).fill(null); // Phase 2: 隧ｦ蜷亥挨諤ｪ謌鷹∈謇紀D
    results.forEach((r, idx) => {
      if (r.matchType === 'tag') return; // 繧ｿ繝・げ隧ｦ蜷医・諤ｪ謌代・Phase 5縺ｧ蟇ｾ蠢・
      const lc = roster.find(c => c.id === r.left.id);
      if (lc && !lc.isIntrusion) { // 荵ｱ蜈･驕ｸ謇九・諤ｪ謌大愛螳壹せ繧ｭ繝・・
        const injRngL = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.left.id));
        const li = Engine.injury.check(injRngL, lc, r, Engine.coach.getInjuryMult(s, r.left.id), 0, 0, Engine.coach.getInjurySeverityDowngrade(s, r.left.id), Engine.coach.buildInjuryFlavorOpts(s, r.left.id));
        if (li) { if (!matchInjuredIds[idx]) matchInjuredIds[idx] = lc.id; roster = roster.map(c => c.id === lc.id ? li.newFighter : c); injuryResults.push({ name: lc.name, injury: li.newFighter.injury }); }
      }
      const rc = roster.find(c => c.id === r.right.id);
      if (rc && !rc.isIntrusion) { // 荵ｱ蜈･驕ｸ謇九・諤ｪ謌大愛螳壹せ繧ｭ繝・・
        const injRngR = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.right.id));
        const ri = Engine.injury.check(injRngR, rc, r, Engine.coach.getInjuryMult(s, r.right.id), 0, 0, Engine.coach.getInjurySeverityDowngrade(s, r.right.id), Engine.coach.buildInjuryFlavorOpts(s, r.right.id));
        if (ri) { if (!matchInjuredIds[idx]) matchInjuredIds[idx] = rc.id; roster = roster.map(c => c.id === rc.id ? ri.newFighter : c); injuryResults.push({ name: rc.name, injury: ri.newFighter.injury }); }
      }
    });

    // Phase 2: 隧ｦ蜷育ｵ先棡縺ｮ髢｢菫ょ､蜿肴丐・・pec ﾂｧ3.1・・
    // losingStreak縺ｯMQ popularity譖ｴ譁ｰ貂医∩縲（njuredId縺ｯ諤ｪ謌大・逅・ｸ医∩縲…areerBestMQ縺ｯ譛ｪ譖ｴ譁ｰ・亥ｾ後〒譖ｴ譁ｰ・・
    if (s.relationships) {
      const relRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE2A));
      let relState = { ...s, roster, relationshipCounters: s.relationshipCounters };
      results.forEach((r, idx) => {
        const m = validMatches[idx];
        // 繧ｿ繝・げ繝槭ャ繝・ applyTagMatchResult 縺ｧ4閠・俣縺ｮ髢｢菫ょ､繧呈峩譁ｰ
        if (r.matchType === 'tag') {
          const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
          const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
          relState = Engine.relationships.applyTagMatchResult(relState, teamAIds, teamBIds, r, relRng);
          return;
        }
        // 繧ｷ繝ｳ繧ｰ繝ｫ繝槭ャ繝・
        const charIdA = r.left.id;
        const charIdB = r.right.id;
        const fA = roster.find(c => c.id === charIdA);
        const fB = roster.find(c => c.id === charIdB);

        let stage = 'normal';
        if (r.isTitleMatch) stage = 'title';

        const champId = s.titles?.world?.championId;
        const isTitleM = !!r.isTitleMatch;

        const context = {
          mq: r.mq,
          winner: r.winner === 'left' ? 'win' : (r.winner === 'right' ? 'lose' : 'draw'),
          hpA: r.hpLeft, hpB: r.hpRight,
          turns: r.turns,
          stage,
          isTitleMatch: isTitleM,
          isChampionA: isTitleM ? (charIdA === champId) : undefined,
          isChampionB: isTitleM ? (charIdB === champId) : undefined,
          rivalryResolved: !!r.rivalryResolved,
          injuredId: matchInjuredIds[idx],
          isCareerBestA: fA ? r.mq > (fA.careerBestMQ || 0) : false,
          isCareerBestB: fB ? r.mq > (fB.careerBestMQ || 0) : false,
          losingStreakA: fA ? (fA.losingStreak || 0) : 0,
          losingStreakB: fB ? (fB.losingStreak || 0) : 0,
          isProveModeA: fA ? (fA.proveMode || 0) > 0 : false,
          isProveModeB: fB ? (fB.proveMode || 0) > 0 : false,
          ovrA: fA ? Engine.util.ov(fA) : 0,
          ovrB: fB ? Engine.util.ov(fB) : 0,
          // Phase 4: 螂ｪ驍・倦謌ｦ縺ｯ cross-org 隧ｦ蜷茨ｼ域ｮ狗蕗 vs 蜈・酔蜒・/ B-3 縺ｪ縺ｩ縺悟柑縺擾ｼ・
          isCrossOrg: !!m.isReclaim,
        };
        relState = Engine.relationships.applyMatchResult(relState, charIdA, charIdB, context, relRng);
      });
      roster = relState.roster || roster;
      s = { ...s, relationships: relState.relationships, relationshipCounters: relState.relationshipCounters };
      // Phase 4: 闊郁｡後さ繝ｳ繝・く繧ｹ繝医・髢｢菫ょ､蜿肴丐・・-04/C-05/C-06/C-10・・
      const showCtxRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE5C));
      s = Engine.relationships.applyShowContextEffects(s, validMatches, results, preShowLosingStreaks, showCtxRng);
    }

    // 笏笏 F08 繝・ぅ繝ｬ繧ｯ繝・ぅ繝・ 逶ｴ謗･蟇ｾ豎ｺ隧ｦ蜷医・邨先棡繧呈ｴｾ髢･蜍｢縺・蟇ｾ遶句ｺｦ縺ｫ 1.5ﾃ・縺ｧ蜿肴丐
    //    + 荳｡豢ｾ髢･繝ｪ繝ｼ繝繝ｼ髢・rivalry 縺ｫ +30縲・0 縺ｮ螟ｧ蟷・ヶ繝ｼ繧ｹ繝・+ 繝・ぅ繝ｬ繧ｯ繝・ぅ繝悶け繝ｪ繧｢ 笏笏
    if (s._pendingF08Directive && Engine.factions && typeof Engine.factions.applyMatchResult === 'function') {
      const d = s._pendingF08Directive;
      const f08Rng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xFA88));
      let executed = false;
      validMatches.forEach((m, idx) => {
        if (m.matchType === 'tag') return;
        const r = results[idx];
        if (!r) return;
        const hit = (m.left === d.leaderAId && m.right === d.leaderBId) || (m.left === d.leaderBId && m.right === d.leaderAId);
        if (!hit) return;
        const winnerToken = r.winner === 'left' ? (m.left === d.leaderAId ? 'A' : 'B')
          : r.winner === 'right' ? (m.right === d.leaderAId ? 'A' : 'B')
          : 'draw';
        s = Engine.factions.applyMatchResult(s, m.left, m.right, { winner: winnerToken }, f08Rng, { variationMultiplier: (FACTION_CONFIG && FACTION_CONFIG.f08MatchResultMultiplier) || 1.5 });
        // 荳｡繝ｪ繝ｼ繝繝ｼ髢・rivalry 繧・+30縲・0 縺ｮ螟ｧ蟷・ヶ繝ｼ繧ｹ繝茨ｼ磯壼ｸｸ隧ｦ蜷・+5縲・0 縺ｮ 4 蛟咲ｨ句ｺｦ・・
        // 竊・繝ｪ繝ｼ繝繝ｼ蜷悟｣ｫ縺ｮ蝗邵√′蠑ｷ辜医↓豺ｱ縺ｾ繧翫∵ｬ｡縺ｮ F02/F03 縺ｸ縺ｮ逋ｺ螻輔ｒ蜉騾・
        const rivalryBoost = 30 + Math.floor(Engine.rng.float(f08Rng) * 11);
        const keyAB = `${d.leaderAId}|${d.leaderBId}`;
        const keyBA = `${d.leaderBId}|${d.leaderAId}`;
        const rels = { ...(s.relationships || {}) };
        if (rels[keyAB] && rels[keyBA]) {
          const clamp = (v) => Math.max(-100, Math.min(100, v));
          rels[keyAB] = { ...rels[keyAB], rivalry: clamp((rels[keyAB].rivalry || 0) + rivalryBoost) };
          rels[keyBA] = { ...rels[keyBA], rivalry: clamp((rels[keyBA].rivalry || 0) + rivalryBoost) };
          s = { ...s, relationships: rels };
          if (typeof console !== 'undefined') console.log(`[WM Faction] F08 direct bout rivalry boost: leaders ${d.leaderAId}竊・{d.leaderBId} rivalry +${rivalryBoost}`);
        }
        executed = true;
      });
      // 隧ｲ蠖楢ｩｦ蜷医′螳溯｡後＆繧後◆縺九↓髢｢繧上ｉ縺壹√％縺ｮ闊郁｡悟ｾ後・繝・ぅ繝ｬ繧ｯ繝・ぅ繝悶ｒ關ｽ縺ｨ縺・
      if (executed && typeof console !== 'undefined') console.log('[WM Faction] F08 directive resolved by direct match');
      const { _pendingF08Directive: _, ...rest } = s;
      s = rest;
    }

    // 笏笏 Phase C: F07 DEMAND_MAIN 繝・ぅ繝ｬ繧ｯ繝・ぅ繝匁ｶ亥喧・・闊郁｡檎ｸ帙ｊ・俄楳笏
    // 蜷・・陦後＃縺ｨ縺ｫ隧穂ｾ｡: 繝｡繧､繝ｳ縺ｫ蠖楢ｩｲ豢ｾ髢･繝｡繝ｳ繝舌・縺悟・縺｣縺ｦ縺・ｌ縺ｰ members trust +1縲・
    // 蜈･縺｣縺ｦ縺・↑縺代ｌ縺ｰ leader trust -2縲ＳemainingShows 繧偵ョ繧ｯ繝ｪ繝｡繝ｳ繝医・ 縺ｧ隗｣髯､縲・
    if (s._pendingF07Directive && s._pendingF07Directive.type === 'DEMAND_MAIN') {
      const dir = s._pendingF07Directive;
      const fac = (s.factions || []).find(f => f.id === dir.factionId);
      if (fac) {
        const mainMatch = validMatches[0];
        let containsFactionMember = false;
        if (mainMatch) {
          if (mainMatch.matchType === 'tag') {
            const ids = [mainMatch.teamA?.fighter1, mainMatch.teamA?.fighter2, mainMatch.teamB?.fighter1, mainMatch.teamB?.fighter2].filter(Boolean);
            containsFactionMember = ids.some(id => fac.memberIds.includes(id));
          } else {
            containsFactionMember = (mainMatch.left && fac.memberIds.includes(mainMatch.left)) || (mainMatch.right && fac.memberIds.includes(mainMatch.right));
          }
        }
        if (containsFactionMember && Engine.factions._applyTrustToMembers) {
          s = Engine.factions._applyTrustToMembers(s, fac.memberIds, 1);
          if (typeof console !== 'undefined') console.log(`[WM Faction] F07 DEMAND_MAIN fulfilled (this show): ${fac.name} member appeared in main`);
        } else if (Engine.factions._applyTrustToMembers && fac.leaderId) {
          s = Engine.factions._applyTrustToMembers(s, [fac.leaderId], -2);
          if (typeof console !== 'undefined') console.log(`[WM Faction] F07 DEMAND_MAIN unfulfilled (this show): ${fac.name} leader trust -2`);
        }
      }
      // remainingShows 繧偵ョ繧ｯ繝ｪ繝｡繝ｳ繝医・ 縺ｧ隗｣髯､
      const remaining = (dir.remainingShows != null ? dir.remainingShows : 1) - 1;
      if (remaining > 0) {
        s = { ...s, _pendingF07Directive: { ...dir, remainingShows: remaining } };
      } else {
        const { _pendingF07Directive: _, ...restF07 } = s;
        s = restF07;
        if (typeof console !== 'undefined') console.log(`[WM Faction] F07 DEMAND_MAIN directive expired`);
      }
    }

    // 笏笏 Phase B: F09 豢ｾ髢･蟇ｾ謚玲姶 窶・sweep 繝懊・繝翫せ驕ｩ逕ｨ + Ending 繝｢繝ｼ繝繝ｫ莠育ｴ・+ pending 繧ｯ繝ｪ繧｢ 笏笏
    if (s._pendingF09 && Engine.factions && typeof Engine.factions.applyF09SweepBonus === 'function') {
      const f09 = s._pendingF09;
      const sweepResults = [];
      validMatches.forEach((m, idx) => {
        if (!m._f09Locked) return;
        if (m.matchType === 'tag') return;
        const r = results[idx];
        if (!r || r.winner === 'draw') return;
        const winnerId = r.winner === 'left' ? m.left : m.right;
        const winnerFaction = Engine.factions.getFactionByFighterId(s, winnerId);
        if (!winnerFaction) return;
        sweepResults.push({ winnerFactionId: winnerFaction.id });
      });
      if (sweepResults.length > 0) {
        s = Engine.factions.applyF09SweepBonus(s, f09.factionAId, f09.factionBId, sweepResults);
      }
      // factionTimeline 縺ｫ F09 螳碁≠繧ｨ繝ｳ繝医Μ
      if (Array.isArray(s.factionTimeline)) {
        s = { ...s, factionTimeline: [...s.factionTimeline, {
          type: 'F09_RESOLVED',
          season: s.season, week: s.week,
          factionAId: f09.factionAId, factionBId: f09.factionBId,
          matchCount: sweepResults.length,
        }]};
      }
      // Ending 繝｢繝ｼ繝繝ｫ逕ｨ繝壹う繝ｭ繝ｼ繝峨ｒ莠育ｴ・ｼ・rainF09Ending 縺ｧ豸郁ｲｻ・・
      const winsA = sweepResults.filter(r => r.winnerFactionId === f09.factionAId).length;
      const winsB = sweepResults.filter(r => r.winnerFactionId === f09.factionBId).length;
      if (winsA !== winsB) {
        const winFid = winsA > winsB ? f09.factionAId : f09.factionBId;
        const losFid = winFid === f09.factionAId ? f09.factionBId : f09.factionAId;
        const winF = (s.factions || []).find(f => f.id === winFid);
        const losF = (s.factions || []).find(f => f.id === losFid);
        if (winF && losF) {
          const winLeader = (s.roster || []).find(c => c.id === winF.leaderId);
          const losLeader = (s.roster || []).find(c => c.id === losF.leaderId);
          const pickLine = (table, fighter) => {
            if (!table || !fighter) return '';
            const p = (Engine.contract && Engine.contract.getPersonalityType) ? Engine.contract.getPersonalityType(fighter) : 'normal';
            const arch = fighter.archetype || 'normal';
            const byP = table[p] || table.normal || {};
            const byA = byP[arch] || byP.normal || {};
            const lines = byA.high || byA.mid || byA.low || [];
            return lines.length ? lines[Math.floor(Math.random() * lines.length)] : '';
          };
          const winTable = (typeof FACTION_F09_ENDING_WIN_LINES !== 'undefined') ? FACTION_F09_ENDING_WIN_LINES : null;
          const losTable = (typeof FACTION_F09_ENDING_LOSE_LINES !== 'undefined') ? FACTION_F09_ENDING_LOSE_LINES : null;
          s = { ...s, _pendingF09Ending: {
            winnerFaction: { name: winF.name, leaderId: winF.leaderId, leaderName: winLeader ? winLeader.name : '' },
            loserFaction:  { name: losF.name, leaderId: losF.leaderId, leaderName: losLeader ? losLeader.name : '' },
            winnerLine: pickLine(winTable, winLeader),
            loserLine: pickLine(losTable, losLeader),
            scoreA: winsA, scoreB: winsB,
            swept: Math.abs(winsA - winsB) >= 2,
            narration: `${winF.name}縺・{winF.name === winF.name && winsA > winsB ? winsA + '蜍・ + winsB + '謨・ : winsB + '蜍・ + winsA + '謨・}縺ｧ${losF.name}繧貞宛縺励◆窶補募ｯｾ謚玲姶縺ｯ豎ｺ逹縺励◆縲Ａ,
          }};
        }
      }
      const { _pendingF09: _f9, ...restF9 } = s;
      s = restF9;
      if (typeof console !== 'undefined') console.log('[WM Faction] F09 sweep bonus applied');
    }

    // 笏笏 Phase 3e: F08-A 隧ｦ蜷亥ｾ・豢ｾ髢･髢｢菫りｿｽ蜉螟牙虚 + 繧｢繝輔ち繝ｼ繝槭せ繝｢繝ｼ繝繝ｫ莠育ｴ・笏笏
    // _f08Locked 縺後▽縺・◆隧ｦ蜷医・縺・■縲∝享謨礼｢ｺ螳壹＠縺溘ｂ縺ｮ縺ｫ蟇ｾ縺励※逋ｺ轣ｫ縲・
    // F02竭｢ resolution 縺悟酔譎ら匱轣ｫ縺吶ｋ隧ｦ蜷医・ extra 蜉ｹ譫懊せ繧ｭ繝・・・・esolution 蜆ｪ蜈茨ｼ峨・
    if (Engine.factions && typeof Engine.factions.applyF08PostMatchExtraEffects === 'function') {
      validMatches.forEach((m, idx) => {
        if (!m._f08Locked) return;
        if (m.matchType === 'tag') return;
        const r = results[idx];
        if (!r || r.winner === 'draw') return;
        const winnerId = r.winner === 'left' ? m.left : m.right;
        const loserId  = r.winner === 'left' ? m.right : m.left;

        // F02竭｢ resolution 蜷梧凾逋ｺ轣ｫ蛻､螳夲ｼ医Μ繝ｼ繝繝ｼ蜷悟｣ｫ + 荳｡譁ｹ蜷・hostility 竕･60・・
        let isF02ResolutionFiring = false;
        if (typeof Engine.factions.rollResolutionAfterMatch === 'function') {
          const probe = Engine.factions.rollResolutionAfterMatch(s, { winnerId, loserId, isDraw: false });
          if (probe && probe.pendingEvent && probe.pendingEvent.eventId === 'F02_RESOLUTION') {
            isF02ResolutionFiring = true;
          }
        }

        // HP谿矩㍼繝代・繧ｻ繝ｳ繝・
        const loserSide = (winnerId === m.left) ? 'right' : 'left';
        const loserHp = (loserSide === 'left' ? r.hpLeft : r.hpRight) || { final: 0, max: 100 };
        const loserHpPct = (loserHp.max > 0) ? (loserHp.final / loserHp.max) : 0;
        const winnerHp = (loserSide === 'left' ? r.hpRight : r.hpLeft) || { final: 0, max: 100 };
        const winnerHpPct = (winnerHp.max > 0) ? (winnerHp.final / winnerHp.max) : 1;

        const matchResult = { winnerId, loserId, winnerHpPct, loserHpPct };

        // 1) 豢ｾ髢･髢｢菫りｿｽ蜉螟牙虚
        s = Engine.factions.applyF08PostMatchExtraEffects(s, matchResult, isF02ResolutionFiring);

        // 2) 繧｢繝輔ち繝ｼ繝槭せ繝｢繝ｼ繝繝ｫ莠育ｴ・ｼ・02竭｢ 蜷梧凾逋ｺ轣ｫ譎ゅ・繧ｹ繧ｭ繝・・ 窶・resolution 貍泌・縺悟━蜈茨ｼ・
        if (!isF02ResolutionFiring && typeof Engine.factions.getF08AftermathData === 'function') {
          const matchId = `${s.season}-${s.week}-${idx}`;
          const shown = s._shownF08PostMatchIds || [];
          if (!shown.includes(matchId)) {
            const data = Engine.factions.getF08AftermathData(s, matchResult);
            if (data) {
              const queue = Array.isArray(s._pendingF08Aftermath) ? s._pendingF08Aftermath.slice() : [];
              queue.push({ matchId, data });
              s = { ...s, _pendingF08Aftermath: queue, _shownF08PostMatchIds: [...shown, matchId] };
            }
          }
        }
      });
    }

    // 笏笏 v4 ﾂｧ2-1: F02竭｢ 豎ｺ逹 蛻､螳夲ｼ医Μ繝ｼ繝繝ｼ蜷悟｣ｫ縺ｮ謨ｵ蟇ｾ隧ｦ蜷医〒荳｡譁ｹ蜷蘇ostility竕･60・・笏笏
    if (Engine.factions && typeof Engine.factions.rollResolutionAfterMatch === 'function' && !s._pendingFactionEvent) {
      for (let i = 0; i < validMatches.length; i++) {
        const m = validMatches[i]; const r = results[i];
        if (!m || !r || m.matchType === 'tag') continue;
        const winnerId = r.winner === 'left' ? m.left : (r.winner === 'right' ? m.right : null);
        const loserId  = r.winner === 'left' ? m.right : (r.winner === 'right' ? m.left : null);
        const isDraw = r.winner === 'draw';
        const res = Engine.factions.rollResolutionAfterMatch(s, { winnerId, loserId, isDraw });
        s = res.state;
        if (res.pendingEvent) { s = { ...s, _pendingFactionEvent: res.pendingEvent }; break; }
      }
    }

    // v1.2: 繧ｿ繧､繝医Ν繝槭ャ繝∝ｮ滓命譎ゅ↓邨ｶ蟇ｾ騾ｱ謨ｰ繧定ｨ倬鹸
    const executedTitleMatch = validMatches.some(m => m.isTitle);
    const lastTitleMatchWeek = executedTitleMatch
      ? Engine.title.getAbsWeek(s)
      : (s.lastTitleMatchWeek ?? null);

    // v1.3-2: ﾂｧ2 隧ｦ蜷域・髟ｷ 窶・諤ｪ謌大・逅・ｾ後√Ο繧ｹ繧ｿ繝ｼ縺ｫ谿九▲縺ｦ縺・ｋ蜃ｺ蝣ｴ驕ｸ謇九↓謌宣聞繧剃ｸ弱∴繧・(mirrors Engine.executeShow)
    const matchGrowthRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 1732));
    results.forEach((r, rIdx) => {
      const m = validMatches[rIdx];
      // 繧ｿ繝・げ繝槭ャ繝・ 4莠ｺ縺ｫ謌宣聞驟榊・・・ngine.executeShow L8087-8117繝代ち繝ｼ繝ｳ・・
      let growthEntries;
      if (r.matchType === 'tag') {
        const allIds = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
        const winTeamIds = r.winner === 'teamA' ? [m.teamA.fighter1, m.teamA.fighter2]
          : r.winner === 'teamB' ? [m.teamB.fighter1, m.teamB.fighter2] : [];
        growthEntries = allIds.map(charId => {
          const isTeamA = charId === m.teamA.fighter1 || charId === m.teamA.fighter2;
          const oppIds = isTeamA ? [m.teamB.fighter1, m.teamB.fighter2] : [m.teamA.fighter1, m.teamA.fighter2];
          const oppOvr = Math.max(...oppIds.map(id => { const f = roster.find(c => c.id === id); return f ? Engine.util.ov(f) : 50; }));
          const partnerId = isTeamA ? (charId === m.teamA.fighter1 ? m.teamA.fighter2 : m.teamA.fighter1) : (charId === m.teamB.fighter1 ? m.teamB.fighter2 : m.teamB.fighter1);
          const partnerName = (roster.find(c => c.id === partnerId) || {}).name || '?';
          const oppNames = oppIds.map(id => (roster.find(c => c.id === id) || {}).name || '?').join('&');
          return { charId, won: winTeamIds.includes(charId), oppOvr, oppLabel: `w/${partnerName} vs ${oppNames}` };
        });
      } else {
        growthEntries = [
          { charId: r.left.id, won: r.winner === 'left', oppOvr: null, oppLabel: null },
          { charId: r.right.id, won: r.winner === 'right', oppOvr: null, oppLabel: null },
        ];
      }
      growthEntries.forEach(({ charId, won, oppOvr: preOppOvr, oppLabel }) => {
        const fighter = roster.find(c => c.id === charId);
        if (!fighter || fighter.isIntrusion) return;
        let oppOvr;
        if (preOppOvr !== null) { oppOvr = preOppOvr; } // 繧ｿ繝・げ: 莠句燕險育ｮ玲ｸ医∩
        else {
          const oppId = charId === r.left.id ? r.right.id : r.left.id;
          const oppInRoster = roster.find(c => c.id === oppId);
          const oppRaw = charId === r.left.id ? r.right : r.left;
          oppOvr = oppInRoster ? Engine.util.ov(oppInRoster) : Engine.util.ov(oppRaw);
        }
        const selfOvr = Engine.util.ov(fighter);

        // growth-rebalance v2: 隧ｦ蜷域・髟ｷ繧帝←豁｣蛹・
        const matchGrowthBase = GROWTH_CONFIG.matchGrowthBase;
        const opponentBonus = Engine.util.clamp((oppOvr - selfOvr) / 15, -0.2, 0.5);
        const closeMatchBonus = r.mq >= 65 ? 0.3 : 0.0;
        const resultBonus = won ? 0.0 : 0.2;
        const coachMatchBonus = Engine.coach.getMatchGrowthBonus(s, charId);
        let matchGrowth = matchGrowthBase + opponentBonus + closeMatchBonus + resultBonus + coachMatchBonus;

        if (fighter.growthPenalty) {
          const rawMult = fighter.growthPenalty.multiplier;
          matchGrowth *= (rawMult < 1.0 && Traits.has(fighter, '驕ｩ蠢懷鴨')) ? Math.min(1.0, rawMult + 0.2) : rawMult;
        }

        const allStats = ['pw', 'sp', 'te', 'st', 'mn'];
        const numStats = Engine.rng.float(matchGrowthRng) < 0.5 ? 1 : 2;
        const pool = [...allStats];
        const chosen = [];
        for (let i = 0; i < numStats; i++) {
          const idx = Engine.rng.int(matchGrowthRng, 0, pool.length - 1);
          chosen.push(pool.splice(idx, 1)[0]);
        }
        const growthPerStat = matchGrowth / numStats;

        const _mOpp = oppLabel || (charId === r.left?.id ? (r.right?.name || '?') : (r.left?.name || '?'));
        const _mRes = r.winner === 'draw' ? 'draw' : (won ? 'win' : 'lose');
        roster = roster.map(c => {
          if (c.id !== charId) return c;
          let nc = { ...c, seasonGrowth: { ...(c.seasonGrowth || {pw:0,sp:0,te:0,st:0,mn:0}) } };
          const _mD = {};
          chosen.forEach(stat => {
            const gain = Math.max(0, Math.round(growthPerStat));
            const cap = nc.trainCap?.[stat] || 100;
            const actualGain = Math.max(0, Math.min(gain, cap - (nc[stat] || 0)));
            if (actualGain > 0) {
              nc[stat] = (nc[stat] || 0) + actualGain;
              nc.seasonGrowth[stat] = (nc.seasonGrowth[stat] || 0) + actualGain;
              _mD[stat] = actualGain;
            }
          });
          if (nc.growthLog && !nc.isRental) {
            const _me = { season: s.season, week: s.week, type: 'match', detail: `vs ${_mOpp}`, opponent: _mOpp, result: _mRes };
            if (Object.keys(_mD).length > 0) _me.deltas = _mD;
            nc.growthLog = [...nc.growthLog, _me];
          }
          return nc;
        });
      });
    });

    s = { ...s, roster, rivalries, titles, heatScore: newHeatScore, orgPop: popResult.orgPop, lastShowResults: results, lastTitleMatchWeek };

    // v0.95: Season stats
    const stats = { ...G.seasonStats };
    stats.showCount++;
    results.forEach((r, rIdx) => {
      const m = validMatches[rIdx];
      if (r.matchType === 'tag') {
        const tA1 = roster.find(c => c.id === m.teamA.fighter1);
        const tA2 = roster.find(c => c.id === m.teamA.fighter2);
        const tB1 = roster.find(c => c.id === m.teamB.fighter1);
        const tB2 = roster.find(c => c.id === m.teamB.fighter2);
        if (r.mq > stats.bestMQ) { stats.bestMQ = r.mq; stats.bestMQMatch = `${tA1?.name||'?'}&${tA2?.name||'?'} vs ${tB1?.name||'?'}&${tB2?.name||'?'}`; }
        if (r.winner === 'teamA' || r.winner === 'teamB') stats.wins++;
        if (r.winner === 'draw') stats.draws++;
      } else {
        if (r.mq > stats.bestMQ) { stats.bestMQ = r.mq; stats.bestMQMatch = `${r.left.name} vs ${r.right.name}`; }
        if (r.winner === 'left' || r.winner === 'right') stats.wins++;
        if (r.winner === 'draw') stats.draws++;
      }
    });

    // v1.8: ﾂｧ2 繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ蛻､螳・& careerBestMQ 譖ｴ譁ｰ・郁ｩｦ蜷亥ｾ鯉ｼ・
    const pendingGrowthEvents = [];
    const btRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xB818));
    results.forEach((r, rIdx) => {
      const m = validMatches[rIdx];
      // 繧ｿ繝・げ繝槭ャ繝・ 4莠ｺ縺ｫ繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ繝ｻ繧ｹ繝ｩ繝ｳ繝怜愛螳・
      let btEntries;
      if (r.matchType === 'tag') {
        const allIds = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
        const winTeamIds = r.winner === 'teamA' ? [m.teamA.fighter1, m.teamA.fighter2]
          : r.winner === 'teamB' ? [m.teamB.fighter1, m.teamB.fighter2] : [];
        btEntries = allIds.map(charId => {
          const isTeamA = charId === m.teamA.fighter1 || charId === m.teamA.fighter2;
          const oppIds = isTeamA ? [m.teamB.fighter1, m.teamB.fighter2] : [m.teamA.fighter1, m.teamA.fighter2];
          const oppOvr = Math.max(...oppIds.map(id => { const f = roster.find(c => c.id === id); return f ? Engine.util.ov(f) : 50; }));
          return { charId, won: winTeamIds.includes(charId), oppOvr };
        });
      } else {
        btEntries = [
          { charId: r.left.id,  won: r.winner === 'left',  oppOvr: null },
          { charId: r.right.id, won: r.winner === 'right', oppOvr: null },
        ];
      }
      btEntries.forEach(({ charId, won, oppOvr: preOppOvr }) => {
        const fighter = roster.find(c => c.id === charId);
        if (!fighter || fighter.isIntrusion) return;
        let oppOvr;
        if (preOppOvr !== null) { oppOvr = preOppOvr; }
        else {
          const oppId = charId === r.left.id ? r.right.id : r.left.id;
          const oppFighter = roster.find(c => c.id === oppId);
          oppOvr = oppFighter ? Engine.util.ov(oppFighter) : (r[charId === r.left.id ? 'right' : 'left']?.pw ?? 50);
        }
        const isTitle = !!r.isTitleMatch;

        // 繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ蛻､螳夲ｼ・areerBestMQ譖ｴ譁ｰ蜑阪↓螳滓命 窶・mq > prevBest 蛻､螳壹・縺溘ａ・・
        const btContext = { isTitle, won, isPPV: isPPV(s.week), isRivalryResolution: !!r.rivalryResolved, isWarMatch: false };
        const btResult = Engine.growthEvents.checkAndApplyBreakthrough(
          btRng, fighter, r.mq, oppOvr, btContext, s.season, s.week, Engine.coach.getFlavorBreakthroughMult(s, fighter.id)
        );
        if (btResult) {
          const btFighter = {
            ...btResult.fighter,
            _trustBonus: (btResult.fighter._trustBonus || 0) + 3.5,
            _trustBonusSources: [...(btResult.fighter._trustBonusSources || []), 'breakthrough'],
          };
          roster = roster.map(c => c.id === charId ? btFighter : c);
          const btHintFighter = roster.find(c => c.id === charId) || fighter;
          const btHintLine = pickDialogueLine(BT_HINT_LINES, btHintFighter);
          pendingGrowthEvents.push({
            type: 'breakthrough', fighterId: charId,
            stat: btResult.stat, gain: btResult.gain, hotStreak: btResult.hotStreak,
            btHint: btHintLine
          });
          // Phase 4 G-01: 繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ 竊・OVR霑第磁繧ｭ繝｣繝ｩ縺九ｉrivalry荳頑・
          if (s.relationships) {
            const btRelRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE57, charId));
            s = Engine.relationships.applyBreakthroughEffect(s, charId, btRelRng);
          }
        }

        // careerBestMQ 譖ｴ譁ｰ・医ヶ繝ｬ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ蛻､螳壼ｾ後↓螳滓命・・
        const btUpdatedFighter = roster.find(c => c.id === charId);
        if (r.mq > (btUpdatedFighter.careerBestMQ || 0)) {
          roster = roster.map(c => c.id === charId
            ? { ...c, careerBestMQ: r.mq, _trustBonus: (c._trustBonus || 0) + 1.2,
                _trustBonusSources: [...(c._trustBonusSources || []), 'careerBestMQ'] }
            : c);
        }

        // ﾂｧ4.2 謨怜圏繧ｹ繝ｩ繝ｳ繝怜愛螳・
        if (!won) {
          const slumpRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C6, charId));
          const slumpFighter = roster.find(c => c.id === charId);
          if (Engine.growthEvents.checkSlump(slumpRng, slumpFighter, 'defeat')) {
            const newF = Engine.growthEvents.applySlump(slumpFighter, 'defeat', s.season, s.week);
            roster = roster.map(c => c.id === charId ? newF : c);
            pendingGrowthEvents.push({ type: 'slump_start', fighterId: charId, trigger: 'defeat' });
            // Phase 4 G-03: 繧ｹ繝ｩ繝ｳ繝・竊・bond60+蠢・・縲〉ivalry30+菴惹ｸ・
            if (s.relationships) {
              const symRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE58, charId));
              s = Engine.relationships.applySympathyEffect(s, charId, { min: 1, max: 2 }, symRng);
              // N-05: 繧ｹ繝ｩ繝ｳ繝怜・縺､蠖薙◆繧・
              const lashRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6C, charId));
              s = Engine.relationships.applySlumpLashout({ ...s, roster }, charId, lashRng);
            }
          }
        }

        // ﾂｧ4.4/ﾂｧ5.4 隧ｦ蜷亥ｾ・momentum 譖ｴ譁ｰ・医せ繝ｩ繝ｳ繝・繝｢繝√・蝟ｪ螟ｱ荳ｭ・・
        const momRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C7, charId));
        const momFighter = roster.find(c => c.id === charId);
        let updatedF = Engine.growthEvents.updateSlumpMomentumAfterMatch(momFighter, r.mq, won, momRng);
        updatedF = Engine.growthEvents.updateMotivationLossMomentumAfterMatch(updatedF, r.mq, won, momRng);

        // ﾂｧ5.2 繝｢繝√・蝟ｪ螟ｱ 謨怜圏繝医Μ繧ｬ繝ｼ
        if (!won && updatedF.slump) {
          const mlRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C8, charId));
          if (Engine.growthEvents.checkMotivationLoss(mlRng, updatedF, 'defeat')) {
            updatedF = Engine.growthEvents.applyMotivationLoss(updatedF, s.season, s.week);
            pendingGrowthEvents.push({ type: 'motivation_loss_start', fighterId: charId });
            // Phase 4 G-06: 繝｢繝√・蝟ｪ螟ｱ 竊・bond60+蠢・・縲〉ivalry30+菴惹ｸ・
            if (s.relationships) {
              const symRng2 = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE59, charId));
              s = Engine.relationships.applySympathyEffect(s, charId, { min: 1, max: 1 }, symRng2);
            }
          }
        }
        if (updatedF !== momFighter) {
          roster = roster.map(c => c.id === charId ? updatedF : c);
        }
      });
    });

    // h2h險倬鹸: 繝壹い蛻･蟇ｾ謌ｦ螻･豁ｴ・医ち繝・げ: 蟇ｾ隗・繝壹い + 蜻ｳ譁ｹ繝壹い險倬鹸・・
    let h2h = { ...(s.h2h || {}) };
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      if (m.matchType === 'tag') {
        // 繧ｿ繝・げ: 蟇ｾ隗・繝壹い・・1vsB1, A1vsB2, A2vsB1, A2vsB2・峨ｒ險倬鹸
        const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
        const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
        for (const aId of teamAIds) {
          for (const bId of teamBIds) {
            const tagWinner = r.winner === 'teamA' ? 'left' : r.winner === 'teamB' ? 'right' : 'draw';
            h2h = Engine.h2h.update(h2h, aId, bId, tagWinner, r.mq, false, false, s.season, s.week, 'show', 'player', 'player');
          }
        }
      } else {
        const meta = App._buildMatchMeta(s, m.left, m.right, !!m.isReclaim);
        h2h = Engine.h2h.update(h2h, m.left, m.right, r.winner, r.mq, !!r.isTitleMatch, false, s.season, s.week, 'show', 'player', 'player', meta);
        // 讌ｭ逡後ル繝･繝ｼ繧ｹ: B-3 蜈・酔蜒・髮｢閼ｱ蠕悟・蟇ｾ髱｢・郁ｩｦ蜷医き繝ｼ繝・蜊倡匱縺ｮ縺ｿ・・
        if (meta.betrayal) {
          const fA = (s.roster || []).find(c => c.id === m.left);
          const fB = (s.roster || []).find(c => c.id === m.right);
          if (fA && fB) {
            s = Engine.industryNews.push(s, {
              type: 'firstMeetSinceDeparture',
              characterId: m.left,
              data: { nameA: fA.name, nameB: fB.name },
            });
          }
        }
      }
    });
    s = { ...s, h2h };

    // recentMatches險倬鹸・育峩霑・謌ｦFIFO・・
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      if (m.matchType === 'tag') {
        // 繧ｿ繝・げ: 蟇ｾ隗偵・繧｢縺ｧ險倬鹸
        const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
        const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
        for (const aId of teamAIds) {
          for (const bId of teamBIds) {
            const tagWinner = r.winner === 'teamA' ? 'left' : r.winner === 'teamB' ? 'right' : 'draw';
            roster = Engine.pushRecentMatch(roster, aId, bId, tagWinner, s.season, s.week);
          }
        }
      } else {
        roster = Engine.pushRecentMatch(roster, m.left, m.right, r.winner, s.season, s.week);
      }
    });

    // matchupLog 險倬鹸・磯ｮｮ蠎ｦ險育ｮ励・蠕後∵怙邨よ峩譁ｰ縺ｮ蜑搾ｼ・
    const newMatchupEntries = [];
    validMatches.forEach(m => {
      if (m.matchType === 'tag') {
        // 繧ｿ繝・げ: 蟇ｾ隗・繝壹い縺ｮmatchupLog繧定ｨ倬鹸
        const teamAIds = [m.teamA.fighter1, m.teamA.fighter2];
        const teamBIds = [m.teamB.fighter1, m.teamB.fighter2];
        for (const aId of teamAIds) {
          for (const bId of teamBIds) {
            newMatchupEntries.push({ leftId: aId, rightId: bId, showCount: s.totalShows });
          }
        }
      } else {
        newMatchupEntries.push({ leftId: m.left, rightId: m.right, showCount: s.totalShows });
      }
    });

    // tagExp險倬鹸: 繧ｿ繝・げ隧ｦ蜷医・繝√・繝繝｡繧､繝医・繧｢縺ｮ邨碁ｨ灘､繧定塘遨・
    let tagExp = { ...(s.tagExp || {}) };
    validMatches.forEach((m, idx) => {
      if (m.matchType !== 'tag') return;
      tagExp = Engine.tagExp.increment(tagExp, m.teamA.fighter1, m.teamA.fighter2);
      tagExp = Engine.tagExp.increment(tagExp, m.teamB.fighter1, m.teamB.fighter2);
    });
    s = { ...s, roster, matchupLog: [...(s.matchupLog || []), ...newMatchupEntries], tagExp };

    // MVP繝ｬ繝ｼ繧ｹ v2: MQ85雜・ｩｦ蜷医・ bigMatch 螻･豁ｴ險倬鹸・医・繝ｬ繧､繝､繝ｼ闊郁｡鯉ｼ・
    {
      let bigMatchAdded = false;
      validMatches.forEach((m, idx) => {
        const r = results[idx];
        if (!r || typeof r.mq !== 'number' || r.mq < 85) return;
        const participants = m.matchType === 'tag'
          ? [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2]
          : [m.left, m.right];
        participants.forEach(charId => {
          if (charId == null) return;
          roster = roster.map(c => {
            if (c.id !== charId || c.isIntrusion) return c;
            bigMatchAdded = true;
            return Engine.career.addEvent(c, {
              type: 'bigMatch', season: s.season, week: s.week, mq: r.mq
            });
          });
        });
      });
      if (bigMatchAdded) s = { ...s, roster };
    }

    // orgPop 繝ｪ繝舌Λ繝ｳ繧ｹ v1.1 ﾂｧ4: 繝峨・繝闊郁｡・domeMain 繧ｭ繝｣繝ｪ繧｢險倬鹸
    // 繝｡繧､繝ｳ繧､繝吶Φ繝域棧(idx=0) or 繧ｿ繧､繝医Ν繝槭ャ繝√↓蜃ｺ蝣ｴ縺励◆驕ｸ謇九ｒ險倬鹸
    if (s.showVenue === 9) {
      roster = roster.map(c => c); // 繧ｳ繝斐・繧堤ｶｭ謖・
      validMatches.forEach((m, idx) => {
        const isMain = idx === 0; // 繝｡繧､繝ｳ繧､繝吶Φ繝域棧
        const isTitle = !!m.isTitle;
        if (!isMain && !isTitle) return;
        const r = results[idx];
        if (!r) return;
        const matchType = isTitle ? 'title' : 'main';
        let domeEntries;
        if (m.matchType === 'tag') {
          const allIds = [m.teamA.fighter1, m.teamA.fighter2, m.teamB.fighter1, m.teamB.fighter2];
          const winTeamIds = r.winner === 'teamA' ? [m.teamA.fighter1, m.teamA.fighter2]
            : r.winner === 'teamB' ? [m.teamB.fighter1, m.teamB.fighter2] : [];
          domeEntries = allIds.map(charId => ({ charId, result: winTeamIds.includes(charId) ? 'win' : (r.winner === 'draw' ? 'draw' : 'lose'), opponentName: undefined }));
        } else {
          const leftName  = roster.find(c => c.id === m.left)?.name;
          const rightName = roster.find(c => c.id === m.right)?.name;
          domeEntries = [
            { charId: m.left,  result: r.winner === 'left'  ? 'win' : (r.winner === 'draw' ? 'draw' : 'lose'), opponentName: rightName },
            { charId: m.right, result: r.winner === 'right' ? 'win' : (r.winner === 'draw' ? 'draw' : 'lose'), opponentName: leftName },
          ];
        }
        domeEntries.forEach(({ charId, result, opponentName }) => {
          roster = roster.map(c => {
            if (c.id !== charId || c.isIntrusion) return c;
            const ev = { type: 'domeMain', season: s.season, week: s.week, result, matchType };
            if (opponentName) ev.opponentName = opponentName;
            const cr = c.careerRecord || { history: [] };
            return { ...c, careerRecord: { ...cr, history: [...(cr.history || []), ev] } };
          });
        });
      });
      // orgPop 繝ｪ繝舌Λ繝ｳ繧ｹ v1.1 ﾂｧ5: 繝峨・繝闊郁｡後き繧ｦ繝ｳ繝域峩譁ｰ
      s = { ...s, roster, domeShowsThisSeason: (s.domeShowsThisSeason || 0) + 1 };
    }
    if (pendingGrowthEvents.length > 0) {
      G = { ...G, _pendingGrowthEvents: pendingGrowthEvents };
    }

    G = { ...G, ...s, seasonStats: stats, gameLog: [...G.gameLog, ...events] };

    // v2.0 Phase1-6: 繝｡繝・ぅ繧｢繧ｹ繝昴ャ繝医Λ繧､繝医・闊郁｡悟ｾ悟・逅・
    if (G.mediaSpotlight) {
      const _spotlightName = G.mediaSpotlight.fighterName || '驕ｸ謇・;
      const spotRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB4B4));
      const spotResult = Engine.eventSystem.processMediaSpotlight(G, results, validMatches, spotRng);
      if (spotResult) {
        G = { ...G, mediaSpotlight: spotResult.mediaSpotlight, roster: spotResult.roster,
               gameLog: [...G.gameLog, ...spotResult.events] };
        if (spotResult.orgPopDelta) {
          G = { ...G, orgPop: G.orgPop + spotResult.orgPopDelta };
        }
        // Phase 4 E-04: 繝｡繝・ぅ繧｢繧ｹ繝昴ャ繝医Λ繧､繝育ｵゆｺ・凾縺ｮ髢｢菫ょ､蜿肴丐
        if (spotResult.relationships) {
          G = { ...G, relationships: spotResult.relationships };
        }
        // P6: 繝｡繝・ぅ繧｢繧ｹ繝昴ャ繝医Λ繧､繝育ｵゆｺ・ヨ繝ｼ繧ｹ繝・
        if (spotResult.mediaSpotlight === null) {
          setTimeout(() => showToast(`銅 ${_spotlightName}縺ｮ繝｡繝・ぅ繧｢蟇・捩蜿匁攝縺檎ｵゆｺ・＠縺歔, 5000), 500);
        }
      }
    }

    // 繝ｩ繧ｹ繝医Λ繝ｳ隧ｦ蜷医ｒ陦後▲縺滄∈謇九ｒ蜊ｳ蠎ｧ縺ｫ蠑暮蜃ｦ逅・ｼ・騾ｱ蠕・■繝舌げ菫ｮ豁｣・・
    const lastRunRetireesById = new Map();
    results.forEach((r, idx) => {
      const match = validMatches[idx];
      if (!match) return;
      const participantIds = match.matchType === 'tag'
        ? [match.teamA?.fighter1, match.teamA?.fighter2, match.teamB?.fighter1, match.teamB?.fighter2].filter(id => id > 0)
        : [match.left, match.right].filter(id => id > 0);
      const lastRunFighter = participantIds
        .map(id => G.roster.find(c => c.id === id))
        .find(f => f?.lastRun) || null;
      if (!lastRunFighter) return;
      r.isLastRunMatch = true;
      r.lastRunFighterId = lastRunFighter.id;
      lastRunRetireesById.set(lastRunFighter.id, lastRunFighter);
    });
    const lastRunRetirees = [...lastRunRetireesById.values()];
    try {
      console.warn('[WM][lastrun-diag] processShowResult:lastRunRetirees',
        { count: lastRunRetirees.length, names: lastRunRetirees.map(c => c?.name), resultsLen: results.length, validMatchesLen: validMatches.length });
    } catch (_e) {}
    if (lastRunRetirees.length > 0) {
      const lrLineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAD3));
      const retiredWithRecords = lastRunRetirees.map(c => {
        let f = Engine.career.ensure({ ...c, lastRun: false, lastRunWeek: null });
        f = Engine.career.addEvent(f, { type: 'retire', reason: 'lastrun', season: G.season, week: G.week, age: f.age });
        delete f.growthLog;
        return f;
      });
      const lastRunRetiredIds = new Set(lastRunRetirees.map(c => c.id));
      const survivingRoster = G.roster.filter(c => !lastRunRetiredIds.has(c.id));
      // 髢｢菫ょ､蜃咲ｵ・+ trust蠖ｱ髻ｿ + retiredIds豌ｸ邯夊ｨ倬鹸
      const newRetiredIds = [...(G.retiredIds || []), ...lastRunRetirees.map(c => c.id).filter(id => !(G.retiredIds || []).includes(id))];
      const _lrRetiredSeasons = { ...(G.retiredSeasons || {}) };
      lastRunRetirees.forEach(c => { _lrRetiredSeasons[c.id] = G.season; });
      let updState = { ...G, roster: survivingRoster, retiredFighters: [...(G.retiredFighters || []), ...retiredWithRecords], retiredIds: newRetiredIds, retiredSeasons: _lrRetiredSeasons };
      // 蝗｣菴灘ｹｴ莉｣險・ 繧｢繝ｼ繧ｫ繧､繝也匳骭ｲ + 豌鈴｢ｨ蟇・ｸ守ｩ咲ｮ・(player 繝ｭ繧ｹ繧ｿ繝ｼ邨檎罰縺ｪ縺ｮ縺ｧ蜈ｨ莉ｶ蟇ｾ雎｡)
      retiredWithRecords.forEach(rf => {
        updState = Engine.chronicle.archiveFighter(updState, rf);
        updState = Engine.chronicle.applySpiritContribution(updState, rf);
      });
      updState = Engine.chronicle.refreshChapters(updState);
      // 邇玖・′繝ｩ繧ｹ繝医Λ繝ｳ蠑暮縺励◆蝣ｴ蜷医・邇句ｺｧ繧堤ｩｺ菴阪↓縺吶ｋ
      const vcLR = Engine.title.validateChampion(updState);
      if (vcLR.msg) { updState = { ...updState, titles: vcLR.titles, gameLog: [...(updState.gameLog || []), vcLR.msg] }; }
      if (updState.relationships) {
        lastRunRetirees.forEach(retiree => {
          updState = Engine.relationships.freezeRelationships(updState, retiree.id);
          updState = { ...updState, roster: Engine.trust.applyDepartureTrustImpact(updState.roster, retiree.id, updState.relationships, { name: retiree.name, reason: '蠑暮隧ｦ蜷・ }) };
        });
      }
      // O-04: bond 60+縺ｮ逶ｸ謇銀・蠑暮閠・↓ bond -5縲・10
      const retRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE3B, G.season, G.week));
      for (const retiree of lastRunRetirees) {
        const highBondIds = updState.roster.map(c => c.id).filter(cid => {
          const key = Engine.relationships._key(cid, retiree.id);
          const rel = updState.relationships?.[key];
          return rel && Engine.relationships.isPositiveBond(rel.bond);
        });
        if (highBondIds.length > 0) {
          updState = Engine.relationships.applyFromRoster(updState, highBondIds, retiree.id, { min: -10, max: -5 }, { min: 0, max: 0 }, retRelRng);
        }
      }
      // 蠑暮貍泌・繝・・繧ｿ繧剃ｿ晄戟・・endingRetirements蠖｢蠑擾ｼ・
      const pendingLastRunRetirements = retiredWithRecords.map(f => {
        const { line, category } = Engine.retirement.selectLine(f, 'lastrun', updState, lrLineRng);
        const summary = Engine.retirement.buildCareerSummary(f);
        return { fighter: f, route: 'lastrun', line, category, summary, canRetain: false };
      });
      G = { ...updState, _pendingLastRunRetirements: pendingLastRunRetirements };
    }

    App._showPreview = null;
    App._lastInjuries = injuryResults; // v0.96: store for popup after close
    App._lastTitleOutcomes = titleMatchOutcomes; // 繧ｿ繧､繝医Ν繝槭ャ繝∝ｾ後Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ逕ｨ
    // 邨先棡逕ｻ髱｢陦ｨ遉ｺ逶ｴ蠕後↓BGM繧定ｩｦ蜷育畑竊堤ｵ悟霧逕ｨ縺ｸ蛻・ｊ譖ｿ縺茨ｼ医ヵ繧｡繝ｳ繝輔ぃ繝ｼ繝ｬ縺ｯ蟒・ｭ｢・・
    setTimeout(() => {
      try { Audio.fileBgm.stop(); } catch(e) {}
      Audio.bgm.play('management');
    }, 2500);

    // 譁ｰ閨槭ョ繝ｼ繧ｿ繧竪縺ｫ菫晏ｭ假ｼ医ョ繝ｼ繧ｿ繝吶・繧ｹ繧ｿ繝悶〒髢ｲ隕ｧ・・
    try {
      const paperData = App._buildShowResultNewspaperData();
      if (paperData) {
        G = { ...G, currentNewspaper: { ...paperData, generatedWeek: G.week, generatedSeason: G.season } };
      }
    } catch (e) {
      console.error('[WM] 譁ｰ閨槭ョ繝ｼ繧ｿ逕滓・繧ｨ繝ｩ繝ｼ:', e);
    }

    // 隧ｦ蜷亥燕/隧ｦ蜷亥ｾ後ヵ繝ｬ繝ｼ繝舌・繝昴ャ繝励い繝・・縺ｯ per-match 縺ｧ豬√ｌ繧・
    // (renderMatchPreview 縺ｮ nextIdx 繝輔か繝ｼ繧ｫ繧ｹ譎・+ skipMatch/watchMatch 邨先棡蜿肴丐逶ｴ蠕・
    // 縺溘ａ縲√％縺薙〒縺ｯ邨先棡逕ｻ髱｢繧堤峩謗･謠冗判縺吶ｋ縲・
    // Phase 3e: F08-A 隧ｦ蜷亥ｾ後Δ繝ｼ繝繝ｫ縺御ｺ育ｴ・＆繧後※縺・ｌ縺ｰ邨先棡逕ｻ髱｢蜑阪↓騾先ｬ｡豸亥喧
    // F09 Ending 繝｢繝ｼ繝繝ｫ・・08 aftermath 繧医ｊ蜈医↓蜃ｺ縺・ 蟇ｾ謚玲姶縺ｮ邱乗峡縺悟・・・
    const drainF09Ending = (then) => {
      if (!G._pendingF09Ending) { if (then) then(); return; }
      const data = G._pendingF09Ending;
      const { _pendingF09Ending: _, ...rest } = G;
      G = rest;
      if (typeof showFactionF09EndingModal === 'function') {
        showFactionF09EndingModal(data, G, () => { if (then) then(); });
      } else {
        if (then) then();
      }
    };
    const drainF08Aftermath = (then) => {
      const queue = G._pendingF08Aftermath;
      if (!Array.isArray(queue) || queue.length === 0) {
        if (G._pendingF08Aftermath !== undefined) {
          const { _pendingF08Aftermath: _, ...rest } = G;
          G = rest;
        }
        if (then) then();
        return;
      }
      const head = queue[0];
      G = { ...G, _pendingF08Aftermath: queue.slice(1) };
      if (typeof showFactionF08AftermathModal === 'function') {
        showFactionF08AftermathModal(head.data, G, () => drainF08Aftermath(then));
      } else {
        drainF08Aftermath(then);
      }
    };
    drainF09Ending(() => drainF08Aftermath(() => renderShowResult(results, injuryResults)));
  },

  // 隧ｦ蜷亥燕繝輔Ξ繝ｼ繝舌・繝昴ャ繝励い繝・・縺ｮ蜿朱寔・・pecs/match-flavor-popup-spec-v0.1.md ﾂｧ4.2・・
  // 1隧ｦ蜷亥・縺ｮ繝昴ャ繝励い繝・・驟榊・繧定ｿ斐☆縲ＳenderMatchPreview 縺ｮ nextIdx 繝輔か繝ｼ繧ｫ繧ｹ譎ゅ↓蜻ｼ縺ｰ繧後ｋ縲・
  // 隧ｦ蜷医す繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ邨先棡縺ｯ荳崎ｦ・窶・讀懷・縺ｯ roster / matchupLog / relationships 繧定ｩｦ蜷亥燕縺ｫ蜿ら・縺吶ｋ縲・
  // 谿ｵ髫取僑蠑ｵ譎ゅ・縺薙・荳ｭ縺ｫ讀懷・譚｡莉ｶ + popups.push 繝悶Ο繝・け繧定ｿｽ蜉縺吶ｋ縲・
  _collectPreMatchPopupsForMatch(idx) {
    const popups = [];
    const sp = App._showPreview;
    if (!sp || !sp.validMatches) return popups;
    const m = sp.validMatches[idx];
    if (!m || m.matchType === 'tag') return popups; // 繧ｿ繝・げ縺ｯ迴ｾ迥ｶ髱槫ｯｾ蠢・
    const leftId = m.left, rightId = m.right;
    if (!leftId || !rightId) return popups;
    const leftFighter  = (G.roster || []).find(c => c.id === leftId) || ALL_CHARS.find(c => c.id === leftId);
    const rightFighter = (G.roster || []).find(c => c.id === rightId) || ALL_CHARS.find(c => c.id === rightId);
    if (!leftFighter || !rightFighter) return popups;

    // 笏笏 蛻晞｡泌粋繧上○・・atchupLog 縺ｫ驕主悉蟇ｾ謌ｦ縺檎┌縺・°縺ｧ蛻､螳夲ｼ俄楳笏
    const log = G.matchupLog || [];
    const hasPriorMatch = log.some(e =>
      (e.left === leftId && e.right === rightId) || (e.left === rightId && e.right === leftId)
    );
    if (!hasPriorMatch) {
      const leftLine  = pickDialogueLine(FIRST_MEET_LINES, leftFighter);
      const rightLine = pickDialogueLine(FIRST_MEET_LINES, rightFighter);
      popups.push({
        type: 'fighter', id: leftId, name: leftFighter.name,
        message: leftLine, detail: '笨ｨ 蛻晏ｯｾ豎ｺ', autoCloseMs: 1800, sound: 'event',
      });
      popups.push({
        type: 'fighter', id: rightId, name: rightFighter.name,
        message: rightLine, detail: '笨ｨ 蛻晏ｯｾ豎ｺ', autoCloseMs: 1800, sound: 'event',
      });
    }
    // 笏笏 谿ｵ髫取僑蠑ｵ繝昴う繝ｳ繝・ 莉悶・繝励Λ繧ｹ蜉ｹ譫懊・縺薙％縺ｫ霑ｽ蜉 笏笏
    return popups;
  },

  // 隧ｦ蜷亥ｾ後ヵ繝ｬ繝ｼ繝舌・繝昴ャ繝励い繝・・縺ｮ蜿朱寔・・pecs/match-flavor-popup-spec-v0.1.md ﾂｧ4.6・・
  // 隧ｦ蜷育ｵ先棡縺九ｉ蜍晁・謨苓・・菴咎渊荳險繧定ｿ斐☆縲ＴkipMatch/watchMatch 縺ｧ邨先棡蜿肴丐逶ｴ蠕後↓蜻ｼ縺ｶ縲・
  _collectPostMatchPopupsForMatch(idx, result) {
    const popups = [];
    const sp = App._showPreview;
    if (!sp || !result || result.matchType === 'tag') return popups;
    if (result.winner === 'draw') return popups; // 繝峨Ο繝ｼ縺ｯ菴咎渊繧ｹ繧ｭ繝・・・井ｸｭ遶・
    const m = sp.validMatches[idx];
    if (!m) return popups;
    const winnerId = result.winner === 'left' ? m.left : m.right;
    const loserId  = result.winner === 'left' ? m.right : m.left;
    const winnerFighter = (G.roster || []).find(c => c.id === winnerId) || ALL_CHARS.find(c => c.id === winnerId);
    const loserFighter  = (G.roster || []).find(c => c.id === loserId)  || ALL_CHARS.find(c => c.id === loserId);
    if (!winnerFighter || !loserFighter) return popups;
    if (typeof POST_MATCH_FLAVOR_LINES === 'undefined') return popups;
    const winLine  = pickDialogueLine(POST_MATCH_FLAVOR_LINES.winner, winnerFighter);
    const loseLine = pickDialogueLine(POST_MATCH_FLAVOR_LINES.loser,  loserFighter);
    popups.push({
      type: 'fighter', id: winnerId, name: winnerFighter.name,
      message: winLine, detail: '醇 蜍晁・・菴咎渊', autoCloseMs: 1800, sound: 'event',
    });
    popups.push({
      type: 'fighter', id: loserId, name: loserFighter.name,
      message: loseLine, detail: '窶・謨苓・・蠢・窶・, autoCloseMs: 1800, sound: 'event',
    });
    return popups;
  },

  // pre-match popup 繧ｷ繝ｼ繧ｱ繝ｳ繧ｹ繧・1隧ｦ蜷亥・豬√☆縲ＳenderMatchPreview 縺ｮ繝輔か繝ｼ繧ｫ繧ｹ繝輔ャ繧ｯ縺九ｉ蜻ｼ縺ｰ繧後ｋ縲・
  // 譌｢蟄倥・ confrontation modal 縺瑚｡ｨ遉ｺ荳ｭ縺ｪ繧峨√◎繧後′髢峨§縺ｦ縺九ｉ繝輔Ξ繝ｼ繝舌・ popup 繧呈ｵ√☆縲・
  _runPreMatchFlavorForMatch(idx) {
    const sp = App._showPreview;
    if (!sp) return;
    if (sp._suppressFlavor) return; // 荳蠎ｦ繧ｹ繧ｭ繝・・縺励◆繧我ｻ･髯阪・繝輔Ξ繝ｼ繝舌・縺ｯ謚大宛
    if (!sp._shownPreFlavor) sp._shownPreFlavor = new Set();
    if (sp._shownPreFlavor.has(idx)) return;
    sp._shownPreFlavor.add(idx);

    // Phase 3e: F08-A 隧ｦ蜷亥燕繝｢繝ｼ繝繝ｫ逋ｺ轣ｫ・・ivalry/蛻晞｡泌粋繧上○遲峨ｈ繧雁━蜈医∝・縺励◆繧我ｻ悶・繧ｹ繧ｭ繝・・・・
    const m = (sp.validMatches || [])[idx];
    if (m && m._f08Locked && typeof Engine !== 'undefined' && Engine.factions
        && typeof Engine.factions.getF08PreMatchData === 'function'
        && typeof showFactionF08PreMatchModal === 'function') {
      const matchId = `${G.season}-${G.week}-${idx}`;
      if (!G._shownF08PreMatchIds) G._shownF08PreMatchIds = [];
      if (!G._shownF08PreMatchIds.includes(matchId)) {
        const data = Engine.factions.getF08PreMatchData(G, m);
        if (data) {
          G._shownF08PreMatchIds = [...G._shownF08PreMatchIds, matchId];
          showFactionF08PreMatchModal(data, G, () => {});
          return; // 莉悶ヵ繝ｬ繝ｼ繝舌・縺ｯ繧ｹ繧ｭ繝・・縺励※隧ｦ蜷磯ｲ陦・
        }
      }
    }

    // Phase B-2: F09 隧ｦ蜷亥燕繝｢繝ｼ繝繝ｫ逋ｺ轣ｫ・・f09Locked 隧ｦ蜷茨ｼ俄・蛻昴・ F09 隧ｦ蜷医〒縺ｯ Opening 繧る｣邨・
    if (m && m._f09Locked && typeof Engine !== 'undefined' && Engine.factions) {
      const matchId = `${G.season}-${G.week}-${idx}`;
      if (!G._shownF09PreMatchIds) G._shownF09PreMatchIds = [];
      if (!G._shownF09PreMatchIds.includes(matchId)) {
        const data = App._buildF09MatchPreData(m, idx);
        if (data) {
          G._shownF09PreMatchIds = [...G._shownF09PreMatchIds, matchId];
          // 闊郁｡悟・譛蛻昴・ _f09Locked 隧ｦ蜷・竊・Opening 繧貞・縺ｫ
          const isFirstF09 = !G._shownF09Opening;
          if (isFirstF09) {
            G._shownF09Opening = true;
            const opening = App._buildF09OpeningData(m);
            if (opening && typeof showFactionF09OpeningModal === 'function') {
              showFactionF09OpeningModal(opening, G, () => {
                if (typeof showFactionF09MatchPreModal === 'function') {
                  showFactionF09MatchPreModal(data, G, () => {});
                }
              });
              return;
            }
          }
          if (typeof showFactionF09MatchPreModal === 'function') {
            showFactionF09MatchPreModal(data, G, () => {});
            return;
          }
        }
      }
    }

    const popups = App._collectPreMatchPopupsForMatch(idx);
    if (popups.length === 0) return;
    popups.forEach(p => showEventPopup(p));
  },

  // post-match popup 繧ｷ繝ｼ繧ｱ繝ｳ繧ｹ繧・1隧ｦ蜷亥・豬√＠縲》hen() 繧貞他縺ｶ縲・
  // skipMatch/watchMatch 縺ｧ sp.results[idx] 蜿肴丐逶ｴ蠕後↓蜻ｼ縺ｶ縲・
  _runPostMatchFlavorForMatch(idx, result, then) {
    // Phase B-2: F09 隧ｦ蜷亥ｾ後Δ繝ｼ繝繝ｫ・・f09Locked 隧ｦ蜷茨ｼ俄・popup 鄒､繧医ｊ蜈医↓蜃ｺ縺・
    const sp = App._showPreview;
    const m = sp && sp.validMatches ? sp.validMatches[idx] : null;
    const runPostF09 = (cb) => {
      if (!m || !m._f09Locked || result.winner === 'draw') { cb(); return; }
      const data = App._buildF09MatchPostData(m, idx, result);
      if (!data || typeof showFactionF09MatchPostModal !== 'function') { cb(); return; }
      showFactionF09MatchPostModal(data, G, cb);
    };
    runPostF09(() => {
      const popups = App._collectPostMatchPopupsForMatch(idx, result);
      if (popups.length === 0) { if (then) then(); return; }
      _chainEventPopupQueueEmpty(() => { if (then) then(); });
      popups.forEach(p => showEventPopup(p));
      const maxWaitMs = popups.length * 2200 + 1500;
      setTimeout(() => {
        if (_onEventPopupQueueEmpty) {
          console.warn('[WM] postMatchFlavor safety net fired');
          _onEventPopupQueueEmpty = null;
          if (then) then();
        }
      }, maxWaitMs);
    });
  },

  // 笏笏 Phase B-2: F09 繝｢繝ｼ繝繝ｫ逕ｨ繝・・繧ｿ讒狗ｯ峨・繝ｫ繝・笏笏
  _f09PickLine(table, fighter) {
    if (!table || !fighter) return '';
    const p = (Engine.contract && Engine.contract.getPersonalityType) ? Engine.contract.getPersonalityType(fighter) : 'normal';
    const arch = fighter.archetype || 'normal';
    const byP = table[p] || table.normal || {};
    const byA = byP[arch] || byP.normal || {};
    const lines = byA.high || byA.mid || byA.low || [];
    return lines.length ? lines[Math.floor(Math.random() * lines.length)] : '';
  },
  _buildF09OpeningData(m) {
    if (!G._pendingF09 && !m) return null;
    // _pendingF09 縺ｯ縺吶〒縺ｫ繧ｯ繝ｪ繧｢貂医∩縺九ｂ縺励ｌ縺ｪ縺・・縺ｧ縲∬ｩｦ蜷医・謇螻樊ｴｾ髢･縺九ｉ騾・ｼ輔″
    const fA = Engine.factions.getFactionByFighterId(G, m.left);
    const fB = Engine.factions.getFactionByFighterId(G, m.right);
    if (!fA || !fB || fA.id === fB.id) return null;
    const leaderA = (G.roster || []).find(c => c.id === fA.leaderId);
    const leaderB = (G.roster || []).find(c => c.id === fB.leaderId);
    if (!leaderA || !leaderB) return null;
    const memberMini = (faction) => faction.memberIds.slice(0, 5).map(id => {
      const c = (G.roster || []).find(r => r.id === id);
      return c ? { id: c.id, name: c.name, ovr: Engine.util.ov(c) } : null;
    }).filter(Boolean);
    const linesA = (typeof FACTION_F09_OPENING_LINES_A !== 'undefined') ? FACTION_F09_OPENING_LINES_A : null;
    const linesB = (typeof FACTION_F09_OPENING_LINES_B !== 'undefined') ? FACTION_F09_OPENING_LINES_B : null;
    return {
      factionA: { id: fA.id, name: fA.name, leaderId: leaderA.id, leaderName: leaderA.name, leaderOvr: Engine.util.ov(leaderA), members: memberMini(fA) },
      factionB: { id: fB.id, name: fB.name, leaderId: leaderB.id, leaderName: leaderB.name, leaderOvr: Engine.util.ov(leaderB), members: memberMini(fB) },
      lineA: App._f09PickLine(linesA, leaderA),
      lineB: App._f09PickLine(linesB, leaderB),
      narration: `${fA.name}縺ｨ${fB.name}窶補穂ｸ｡豢ｾ髢･縺ｮ遨榊ｹｴ縺ｮ謚嶺ｺ峨′縲√▽縺・↓蟇ｾ謚玲姶縺ｨ縺・≧蠖｢縺ｧ蜈ｨ髱｢豎ｺ逹縺ｮ螟懊ｒ霑弱∴繧九Ａ,
    };
  },
  _buildF09MatchPreData(m, idx) {
    const fA = Engine.factions.getFactionByFighterId(G, m.left);
    const fB = Engine.factions.getFactionByFighterId(G, m.right);
    if (!fA || !fB) return null;
    const cA = (G.roster || []).find(c => c.id === m.left);
    const cB = (G.roster || []).find(c => c.id === m.right);
    if (!cA || !cB) return null;
    // 蜈ｨF09隧ｦ蜷域焚繧偵き繧ｦ繝ｳ繝・
    const sp = App._showPreview;
    const total = (sp && sp.validMatches) ? sp.validMatches.filter(mm => mm._f09Locked).length : 1;
    const f09Idx = (sp && sp.validMatches) ? sp.validMatches.slice(0, idx + 1).filter(mm => mm._f09Locked).length : 1;
    const lines = (typeof FACTION_F09_MATCH_PRE_LINES !== 'undefined') ? FACTION_F09_MATCH_PRE_LINES : null;
    return {
      fighterA: { id: cA.id, name: cA.name, factionName: fA.name },
      fighterB: { id: cB.id, name: cB.name, factionName: fB.name },
      lineA: App._f09PickLine(lines, cA),
      lineB: App._f09PickLine(lines, cB),
      matchIndex: f09Idx, totalMatches: total,
    };
  },
  _buildF09MatchPostData(m, idx, result) {
    const winnerId = result.winner === 'left' ? m.left : m.right;
    const loserId  = result.winner === 'left' ? m.right : m.left;
    const winnerC = (G.roster || []).find(c => c.id === winnerId);
    const loserC  = (G.roster || []).find(c => c.id === loserId);
    if (!winnerC || !loserC) return null;
    const winnerF = Engine.factions.getFactionByFighterId(G, winnerId);
    const loserF  = Engine.factions.getFactionByFighterId(G, loserId);
    if (!winnerF || !loserF) return null;
    const linesW = (typeof FACTION_F09_MATCH_POST_WIN_LINES !== 'undefined') ? FACTION_F09_MATCH_POST_WIN_LINES : null;
    const linesL = (typeof FACTION_F09_MATCH_POST_LOSE_LINES !== 'undefined') ? FACTION_F09_MATCH_POST_LOSE_LINES : null;
    // 迴ｾ蝨ｨ繧ｹ繧ｳ繧｢・・endingF09 縺ｯ繧ｯ繝ｪ繧｢縺輔ｌ縺ｦ縺・ｋ蜿ｯ閭ｽ諤ｧ縺後≠繧九・縺ｧ factionRivalryPoints 縺九ｉ蜿門ｾ暦ｼ・
    let scoreA = 0, scoreB = 0, aName = winnerF.name, bName = loserF.name;
    if (G.factionRivalryPoints && Engine.factions._pairKey) {
      const key = Engine.factions._pairKey(winnerF.id, loserF.id);
      const e = G.factionRivalryPoints[key];
      if (e) {
        const aFid = e.factionAId, bFid = e.factionBId;
        const aFac = (G.factions || []).find(f => f.id === aFid);
        const bFac = (G.factions || []).find(f => f.id === bFid);
        scoreA = e.pointsA; scoreB = e.pointsB;
        aName = aFac ? aFac.name : '';
        bName = bFac ? bFac.name : '';
      }
    }
    return {
      winner: { id: winnerC.id, name: winnerC.name, factionName: winnerF.name },
      loser:  { id: loserC.id,  name: loserC.name,  factionName: loserF.name },
      winnerLine: App._f09PickLine(linesW, winnerC),
      loserLine:  App._f09PickLine(linesL, loserC),
      ptDelta: 0,  // 迴ｾ迥ｶ縺ｮ蟾ｮ蛻・ｨ育ｮ励・譛ｪ螳溯｣・∝ｾ梧ｮｵ縺ｧ陦ｨ遉ｺ
      currentScore: { a: scoreA, b: scoreB, aName, bName },
    };
  },

  // 笏笏笏 譁ｰ閨櫁ｨ倅ｺ九ユ繧ｭ繧ｹ繝育函謌・笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏
  _NEWSPAPER_HEADLINES: {
    // 繧ｿ繧､繝医Ν謌ｦ蜍晏茜
    titleWin: [
      d => `${d.winner.name}縲・{d.finishLabel}縺ｧ謌ｴ蜀・～,
      d => `邇句ｺｧ螂ｪ蜿厄ｼ・${d.winner.name}縺・{d.loser.name}繧剃ｸ九☆`,
      d => `譁ｰ邇玖・{d.winner.name}隱慕函窶披・{d.venue.name}縺梧昭繧後◆`,
    ],
    titleDefend: [
      d => `邇玖・{d.winner.name}縲・{d.loser.name}縺ｮ謖第姶繧帝縺代ｋ`,
      d => `${d.winner.name}髦ｲ陦帶・蜉滂ｼ・邇句ｺｧ縺ｮ螽∝宍繧堤､ｺ縺兪,
    ],
    // 蝗邵∬ｩｦ蜷・
    rivalry: [
      d => `螳ｿ蜻ｽ縺ｮ蟇ｾ豎ｺ窶披・{d.winner.name}縺・{d.rivalLabel}繧貞宛縺兪,
      d => `${d.left.name}vs${d.right.name}縲∝屏邵√↓豎ｺ逹縺義,
      d => `${d.rivalLabel}縺ｮ陦梧婿窶披・{d.winner.name}縺ｫ霆埼・`,
    ],
    // 蝨ｧ蜍・
    dominant: [
      d => `${d.winner.name}縲∝悸蟾ｻ縺ｮ${d.turns}繧ｿ繝ｼ繝ｳ豎ｺ逹・～,
      d => `髮ｻ謦・ｱｺ逹・・${d.winner.name}縺・{d.loser.name}繧剃ｸ雹ｴ`,
      d => `${d.loser.name}縺ｪ縺吶☆縺ｹ縺ｪ縺冷披・{d.winner.name}縺ｮ螳悟享`,
    ],
    // 蜒・ｷｮ縺ｮ螂ｽ蜍晁ｲ
    closeMQ: [
      d => `豁ｻ髣・{d.turns}繧ｿ繝ｼ繝ｳ窶披・{d.winner.name}縺瑚ｾ帙￥繧ょ享蛻ｩ`,
      d => `${d.winner.name}縺ｨ${d.loser.name}縲∝錐蜍晁ｲ縺ｮ譫懊※縺ｫ`,
      d => `豼髣倥・譛ｫ縺ｫ${d.winner.name}・・MQ ${d.mq}縺ｮ辭ｱ謌ｦ`,
    ],
    // 逡ｪ迢ゅｏ縺・
    upset: [
      d => `螟ｧ逡ｪ迢ゅｏ縺幢ｼ・${d.winner.name}縺梧ｼ荳・{d.loser.name}繧呈茶遐ｴ`,
      d => `繧ｸ繝｣繧､繧｢繝ｳ繝医く繝ｪ繝ｳ繧ｰ窶披・{d.winner.name}縺ｮ陦晄茶蜍晏茜`,
      d => `隱ｰ縺御ｺ域Φ縺励◆・・${d.winner.name}縺・{d.loser.name}繧呈ｲ医ａ繧義,
    ],
    // 鬮弄Q
    superMQ: [
      d => `豁ｴ蜿ｲ逧・錐蜍晁ｲ・・MQ ${d.mq}繧定ｨ倬鹸`,
      d => `隱槭ｊ邯吶′繧後ｋ荳謌ｦ窶披・{d.winner.name}vs${d.loser.name}`,
    ],
    // 繝峨Ο繝ｼ
    draw: [
      d => `${d.left.name}縺ｨ${d.right.name}縲∵ｱｺ逹縺､縺九★`,
      d => `隴ｲ繧峨〓莠御ｺｺ窶披斐Γ繧､繝ｳ縺ｯ繝峨Ο繝ｼ縺ｫ邨ゅｏ繧義,
      d => `逞帙∩蛻・￠縲・{d.left.name}繧・{d.right.name}繧ゆｸ豁ｩ繧る縺九★`,
    ],
    // 騾壼ｸｸ
    normal: [
      d => `${d.winner.name}縺後Γ繧､繝ｳ繧､繝吶Φ繝医ｒ蛻ｶ縺兪,
      d => `${d.winner.name}縲・{d.finishLabel}縺ｧ蜍晏茜`,
      d => `${d.venue.name}縺ｮ繝｡繧､繝ｳ縲・{d.winner.name}縺ｫ霆埼・`,
    ],
  },

  _NEWSPAPER_ARTICLES: {
    // 繧ｿ繧､繝医Ν謌ｦ
    titleWin: [
      d => `${d.venue.name}縺ｫ隧ｰ繧√°縺代◆${d.attendance.toLocaleString()}莠ｺ縺ｮ隕ｳ陦・′隕句ｱ翫￠縺溘・縺ｯ縲∵眠縺溘↑邇玖・・隱慕函縺縺｣縺溘・{d.winner.name}縺ｯ蠎冗乢縺九ｉ遨肴･ｵ逧・↓謾ｻ繧∬ｾｼ縺ｿ縲・{d.finishLabel}縺ｧ${d.loser.name}縺九ｉ3繧ｫ繧ｦ繝ｳ繝医ｒ螂ｪ蜿悶りｩｦ蜷亥ｾ後√・繝ｫ繝医ｒ謇九↓縺励◆${d.winner.name}縺ｮ陦ｨ諠・↓縺ｯ縲・聞縺・％縺ｮ繧翫ｒ豁ｩ繧薙〒縺阪◆閠・□縺代′隕九○繧句・雜ｳ諢溘′豬ｮ縺九ｓ縺ｧ縺・◆縲Ａ,
      d => `${d.loser.name}縺ｮ迚吝沁縺後▽縺・↓蟠ｩ繧後◆縲・{d.turns}繧ｿ繝ｼ繝ｳ縺ｫ蜿翫・謾ｻ髦ｲ縺ｮ譛ｫ縲・{d.winner.name}縺・{d.finishLabel}縺ｧ邇句ｺｧ繧貞･ｪ蜿悶・{d.venue.name}縺ｮ繝ｪ繝ｳ繧ｰ縺ｫ遶九▽譁ｰ邇玖・↓縲・{d.attendance.toLocaleString()}莠ｺ縺ｮ繝輔ぃ繝ｳ縺梧・縺励∩縺ｪ縺・牛謇九ｒ騾√▲縺溘Ａ,
    ],
    titleDefend: [
      d => `${d.loser.name}縺ｮ謖第姶繧貞女縺代◆邇玖・{d.winner.name}縺ｯ縲・{d.turns}繧ｿ繝ｼ繝ｳ縺ｮ謾ｻ髦ｲ繧堤ｵ後※${d.finishLabel}縺ｧ髦ｲ陦帙↓謌仙粥縲・{d.attendance.toLocaleString()}莠ｺ縺ｮ蜑阪〒邇句ｺｧ縺ｮ驥阪∩繧定ｨｼ譏弱＠縺溘よ風繧後◆${d.loser.name}繧ゅΜ繝ｳ繧ｰ荳翫〒蛛･髣倥ｒ遘ｰ縺医ｉ繧後∵ｬ｡縺ｪ繧区倦謌ｦ縺ｸ縺ｮ譛溷ｾ・′閹ｨ繧峨・縲Ａ,
    ],
    // 蝗邵∬ｩｦ蜷・
    rivalry: [
      d => `繧ゅ・繧・ｪｬ譏惹ｸ崎ｦ√・繧ｫ繝ｼ繝峨・{d.left.name}縺ｨ${d.right.name}縺ｫ繧医ｋ${d.rivalLabel}縺ｯ莉雁屓繧よ悄蠕・ｒ陬丞・繧峨↑縺九▲縺溘・{d.turns}繧ｿ繝ｼ繝ｳ縲∽ｺ偵＞縺ｮ謇九・蜀・ｒ遏･繧雁ｰｽ縺上＠縺滉ｺ御ｺｺ縺ｮ謾ｻ髦ｲ縺ｯMQ ${d.mq}繧定ｨ倬鹸縲よ怙蠕後・${d.winner.name}縺ｮ${d.finishLabel}縺梧ｱｺ逹繧貞他繧薙□縲ゅ％縺ｮ蝗邵√↓邨ゅｏ繧翫・縺ゅｋ縺ｮ縺銀披斐◎縺ｮ遲斐∴縺ｯ縲√∪縺隱ｰ縺ｫ繧ょ・縺九ｉ縺ｪ縺・Ａ,
      d => `${d.rivalLabel}縺ｨ縺励※遏･繧峨ｌ繧倶ｺ御ｺｺ縺悟・縺ｳ繝ｪ繝ｳ繧ｰ縺ｧ豼遯√・{d.venue.name}縺ｮ遨ｺ豌励・隧ｦ蜷亥燕縺九ｉ蠑ｵ繧願ｩｰ繧√※縺・◆縲・{d.winner.name}縺・{d.finishLabel}縺ｧ蜍晏茜繧貞庶繧√◆縺後∵風繧後◆${d.loser.name}縺ｮ髣伜ｿ励・謚倥ｌ縺ｦ縺・↑縺・よｬ｡縺ｮ蟇ｾ謌ｦ縺後√☆縺ｧ縺ｫ蠕・■驕縺励＞縲Ａ,
    ],
    // 螂ｽ謨ｵ謇・
    goodRival: [
      d => `莠偵＞繧帝ｫ倥ａ蜷医≧莠御ｺｺ縺ｮ謌ｦ縺・・縲∽ｻ雁屓繧ゅヵ繧｡繝ｳ縺ｮ蠢・ｒ謗ｴ繧薙□縲・{d.left.name}縺ｨ${d.right.name}縺ｯ${d.turns}繧ｿ繝ｼ繝ｳ縺ｫ繧上◆繧雁･ｽ蜍晁ｲ繧貞ｱ暮幕縲・{d.winner.name}縺・{d.finishLabel}縺ｧ蜍晏茜繧呈焔縺ｫ縺励◆縺後∬ｩｦ蜷亥ｾ後↓莠､繧上＠縺溯ｦ也ｷ壹↓縺ｯ謨ｵ諢上〒縺ｯ縺ｪ縺乗噴諢上′螳ｿ縺｣縺ｦ縺・◆縲・Q ${d.mq}縲Ａ,
    ],
    // 蝨ｧ蜍・
    dominant: [
      d => `繧上★縺・{d.turns}繧ｿ繝ｼ繝ｳ縲・{d.winner.name}縺ｯ${d.loser.name}縺ｫ蜿肴茶縺ｮ菴吝慍縺吶ｉ荳弱∴縺ｪ縺九▲縺溘・{d.finishLabel}縺梧ｱｺ縺ｾ縺｣縺溽椪髢薙・{d.venue.name}縺ｯ髱吶∪繧願ｿ斐▲縺溘ょｮ溷鴨蟾ｮ繧定ｦ九○縺､縺代◆${d.winner.name}縺ｮ蠑ｷ縺輔・譛ｬ迚ｩ縺縲Ａ,
      d => `${d.loser.name}縺ｫ縺ｨ縺｣縺ｦ縺ｯ蜴ｳ縺励＞螟懊→縺ｪ縺｣縺溘・{d.winner.name}縺ｮ迪帶判縺ｫ髦ｲ謌ｦ荳譁ｹ縲・{d.turns}繧ｿ繝ｼ繝ｳ縺ｧ縺ｮ豎ｺ逹縺ｫ${d.attendance.toLocaleString()}莠ｺ縺ｮ隕ｳ螳｢繧りｨ闡峨ｒ螟ｱ縺｣縺溘Ａ,
    ],
    // 蜒・ｷｮ縺ｮ螂ｽ蜍晁ｲ
    closeMQ: [
      d => `${d.turns}繧ｿ繝ｼ繝ｳ縺ｮ豁ｻ髣倪披泌享謨励ｒ蛻・￠縺溘・縺ｯ縲√⊇繧薙・繧上★縺九↑蟾ｮ縺縺｣縺溘・{d.winner.name}縺ｨ${d.loser.name}縺ｯMQ ${d.mq}縺ｮ蜷榊享雋繧呈ｼ斐§縲・{d.venue.name}縺ｮ${d.attendance.toLocaleString()}莠ｺ繧堤ｷ冗ｫ九■縺ｫ縺輔○縺溘・{d.finishLabel}縺ｧ霎帙￥繧ょ享蛻ｩ縺励◆${d.winner.name}縺縺後∵風繧後◆${d.loser.name}縺ｮ隧穂ｾ｡繧ゅ∪縺滉ｸ翫′縺｣縺溘・縺壹□縲Ａ,
      d => `譛蠕後・譛蠕後∪縺ｧ蜍晁ｲ縺ｮ陦梧婿縺ｯ蛻・°繧峨↑縺九▲縺溘・{d.loser.name}繧りｦ九○蝣ｴ繧剃ｽ懊ｊ邯壹￠縺溘′縲・{d.winner.name}縺ｮ${d.finishLabel}縺梧ｱｺ逹繧貞相縺偵◆縲よｶ郁玲姶繧貞宛縺励◆${d.winner.name}縺ｮ繧ｿ繝輔ロ繧ｹ縺悟・縺｣縺・{d.turns}繧ｿ繝ｼ繝ｳ縲・Q ${d.mq}縺ｯ莉翫す繝ｼ繧ｺ繝ｳ螻域欠縺ｮ謨ｰ蟄励□縲Ａ,
    ],
    // 逡ｪ迢ゅｏ縺・
    upset: [
      d => `謌ｦ蜑阪・莠域Φ繧定ｦ・☆邨先棡縺ｨ縺ｪ縺｣縺溘０VR譬ｼ蟾ｮ${d.ovrGap}繝昴う繝ｳ繝医・螢√ｒ縲・{d.winner.name}縺ｯ豌苓ｿｫ縺ｧ謇薙■遐ｴ縺｣縺溘・{d.finishLabel}縺梧ｱｺ縺ｾ縺｣縺溽椪髢薙・{d.venue.name}縺ｯ鬩壹″縺ｨ闊亥･ｮ縺ｫ蛹・∪繧後◆縲よｼ荳・{d.loser.name}縺九ｉ縺ｮ驥第弌縺ｯ縲・{d.winner.name}縺ｫ縺ｨ縺｣縺ｦ螟ｧ縺阪↑閾ｪ菫｡縺ｫ縺ｪ繧九□繧阪≧縲Ａ,
    ],
    // 雜・ｫ弄Q
    superMQ: [
      d => `MQ ${d.mq}窶披比ｻ翫す繝ｼ繧ｺ繝ｳ縺ｮ繝吶せ繝医ヰ繧ｦ繝亥呵｣懊′逕溘∪繧後◆縲・{d.left.name}縺ｨ${d.right.name}縺ｯ${d.turns}繧ｿ繝ｼ繝ｳ縺ｫ繧上◆縺｣縺ｦ謚陦薙→髣伜ｿ励ｒ縺ｶ縺､縺大粋縺・・{d.venue.name}縺ｮ${d.attendance.toLocaleString()}莠ｺ繧堤・迢ゅ・貂ｦ縺ｫ蟾ｻ縺崎ｾｼ繧薙□縲・{d.winner.name}縺・{d.finishLabel}縺ｧ蜍晏茜繧貞庶繧√◆縺後∝享謨励ｒ雜・∴縺滉ｾ｡蛟､縺後％縺ｮ隧ｦ蜷医↓縺ｯ縺ゅ▲縺溘Ａ,
    ],
    // 繝峨Ο繝ｼ
    draw: [
      d => `${d.left.name}縺ｨ${d.right.name}縲・{d.turns}繧ｿ繝ｼ繝ｳ縺ｮ謾ｻ髦ｲ縺ｯ豎ｺ逹繧定ｦ九↑縺九▲縺溘ゆｺ偵＞縺ｫ繝輔か繝ｼ繝ｫ繧定ｿ斐＠蜷医＞縲∵･ｵ繧√ｒ蛻・ｊ蜷医＞縲∵怙蠕後∪縺ｧ閹昴ｒ謚倥ｉ縺ｪ縺九▲縺滉ｺ御ｺｺ縲・{d.venue.name}縺ｮ${d.attendance.toLocaleString()}莠ｺ縺ｯ縲∝ｼ輔″蛻・￠縺ｨ縺・≧邨先棡縺ｫ繧ゅ°縺九ｏ繧峨★諠懊＠縺ｿ縺ｪ縺・牛謇九ｒ騾√▲縺溘ょ・謌ｦ繧呈悍繧螢ｰ縺後√☆縺ｧ縺ｫ縺ゅ■縺薙■縺九ｉ閨槭％縺医※縺・ｋ縲Ａ,
      d => `豎ｺ逹縺､縺九★縲・{d.left.name}繧・{d.right.name}繧ょｷｱ縺ｮ蜈ｨ縺ｦ繧貞・縺怜ｰｽ縺上＠縺溽ｵ先棡縺後％縺ｮ繝峨Ο繝ｼ縺縲・Q ${d.mq}縺檎､ｺ縺咎壹ｊ縲∬ｩｦ蜷亥・螳ｹ縺ｫ荳肴ｺ繧呈戟縺､閠・・縺・↑縺・□繧阪≧縲よｬ｡縺ｯ縺ｩ縺｡繧峨′蜈医↓豎ｺ逹繧偵▽縺代ｋ縺ｮ縺銀披・{d.attendance.toLocaleString()}莠ｺ縺ｮ繝輔ぃ繝ｳ縺梧ｬ｡縺ｮ驍る・ｒ蠕・▲縺ｦ縺・ｋ縲Ａ,
    ],
    // 騾壼ｸｸ
    normal: [
      d => `${d.venue.name}縺ｧ陦後ｏ繧後◆${d.showName}縺ｮ繝｡繧､繝ｳ繧､繝吶Φ繝医・縲・{d.winner.name}縺・{d.finishLabel}縺ｧ${d.loser.name}繧剃ｸ九＠縺ｦ蟷輔ｒ髢峨§縺溘・{d.turns}繧ｿ繝ｼ繝ｳ縺ｮ隧ｦ蜷医・${d.attendance.toLocaleString()}莠ｺ縺ｮ隕ｳ螳｢繧呈ｲｸ縺九○縲｀Q ${d.mq}繧定ｨ倬鹸縺励◆縲Ａ,
      d => `${d.winner.name}縺後Γ繧､繝ｳ縺ｮ螟ｧ闊槫床縺ｧ蝣ゅ・◆繧句享蛻ｩ繧帝｣ｾ縺｣縺溘・{d.loser.name}繧りｦ∵園縺ｧ隕九○蝣ｴ繧剃ｽ懊▲縺溘′縲∵怙邨ら噪縺ｫ縺ｯ${d.winner.name}縺ｮ${d.finishLabel}縺ｫ豐医ｓ縺縲・{d.attendance.toLocaleString()}莠ｺ縺ｮ隕ｳ螳｢縺瑚ｦ句ｮ医▲縺・{d.turns}繧ｿ繝ｼ繝ｳ縺ｮ荳謌ｦ縲Ａ,
    ],
    // 菴皿Q
    lowMQ: [
      d => `豁｣逶ｴ縺ｫ險縺医・縲√Γ繧､繝ｳ繧､繝吶Φ繝医・迚ｩ雜ｳ繧翫↑縺輔′谿九▲縺溘・{d.winner.name}縺・{d.finishLabel}縺ｧ${d.loser.name}繧剃ｸ九＠縺溘ｂ縺ｮ縺ｮ縲｀Q ${d.mq}縺ｨ縺・≧謨ｰ蟄励′隧ｦ蜷亥・螳ｹ繧堤黄隱槭▲縺ｦ縺・ｋ縲・{d.attendance.toLocaleString()}莠ｺ縺ｮ繝輔ぃ繝ｳ縺ｯ縲∵ｬ｡蝗槭・闊郁｡後↓縺薙◎譛溷ｾ・ｒ蟇・○繧九□繧阪≧縲Ａ,
    ],
  },

  _generateNewspaperTexts(d) {
    // 繧ｫ繝・ざ繝ｪ蜆ｪ蜈亥ｺｦ縺ｧ驕ｸ謚・
    let cat;
    if (d.isDraw) cat = 'draw';
    else if (d.isSuperMQ && !d.isDominant) cat = 'superMQ';
    else if (d.isTitleMatch) cat = d.isTitleDefense ? 'titleDefend' : 'titleWin';
    else if (d.isUpset) cat = 'upset';
    else if (d.hasRivalry) cat = 'rivalry';
    else if (d.isDominant) cat = 'dominant';
    else if (d.isCloseMatch && d.isHighMQ) cat = 'closeMQ';
    else if (d.isLowMQ) cat = 'normal';
    else cat = 'normal';

    // 繧ｿ繧､繝医Ν繝槭ャ繝∫｢ｺ螳夲ｼ・uperMQ/upset 縺ｯ豁ｴ蜿ｲ逧・錐蜍晁ｲ/逡ｪ迢ゅｏ縺幄｡ｨ迴ｾ繧貞━蜈茨ｼ・
    if (d.isTitleMatch && !d.isDraw) {
      if (cat !== 'superMQ' && cat !== 'upset') {
        cat = d.isTitleDefense ? 'titleDefend' : 'titleWin';
      }
    }

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const HL = App._NEWSPAPER_HEADLINES;
    const AR = App._NEWSPAPER_ARTICLES;

    const headline = pick(HL[cat] || HL.normal)(d);

    // 繧ｵ繝悶・繝・ラ繝ｩ繧､繝ｳ・壼ｸｸ縺ｫ繧ｫ繝ｼ繝峨→謨ｰ蛟､諠・ｱ
    let subheadline;
    if (d.isDraw) {
      subheadline = `${d.showName}繝ｻ${d.venue.name}縲りｦｳ螳｢${d.attendance.toLocaleString()}莠ｺ縲・{d.turns}繧ｿ繝ｼ繝ｳ縺ｮ謾ｻ髦ｲ縺ｯ豎ｺ逹繧定ｦ九★縲ょ・${d.totalMatches}隧ｦ蜷医・蟷ｳ蝮⑭Q ${d.avgMQ}`;
    } else if (d.otherHighMQ.length > 0) {
      subheadline = `${d.venue.name}螟ｧ莨壹∬ｦｳ螳｢${d.attendance.toLocaleString()}莠ｺ縲ょ・${d.totalMatches}隧ｦ蜷亥ｹｳ蝮⑭Q ${d.avgMQ}窶披泌･ｽ繧ｫ繝ｼ繝臥ｶ壼・縺ｮ${d.showName}`;
    } else {
      subheadline = `${d.showName}繝ｻ${d.venue.name}縲りｦｳ螳｢${d.attendance.toLocaleString()}莠ｺ縲ゅΓ繧､繝ｳMQ ${d.mq}縲∝・${d.totalMatches}隧ｦ蜷亥ｹｳ蝮⑭Q ${d.avgMQ}`;
    }

    // 險倅ｺ区悽譁・
    let articleCat = cat;
    if (d.isGoodRival && !d.isDraw && cat !== 'superMQ') articleCat = 'goodRival';
    const articlePool = AR[articleCat] || AR.normal;
    let article = pick(articlePool)(d);

    // 菴皿Q霑ｽ險・
    if (d.isLowMQ && cat !== 'draw') {
      article = pick(AR.lowMQ)(d);
    }

    return { headline, subheadline, article };
  },
  _buildShowResultNewspaperData() {
    const results = G.lastShowResults || [];
    if (!results.length) return null;
    const main = results[0];
    if (!main || !main.left || !main.right) return null;
    const venue = VENUES[G.showVenue] || { name: 'Arena' };
    const isDraw = main.winner === 'draw';
    const winner = isDraw ? null : (main.winner === 'left' ? main.left : main.right);
    const loser = isDraw ? null : (main.winner === 'left' ? main.right : main.left);
    const avgMQ = Math.round(results.reduce((sum, r) => sum + (r.mq || 0), 0) / results.length);
    const attendance = G.lastShowAttendance || 0;
    const showName = isPPV(G.week) ? 'PPV GRAND FINAL' : (isSpecialShow(G.week) ? '迚ｹ蛻･闊郁｡・ : `隨ｬ${G.totalShows}蝗・螳壽悄闊郁｡形);
    const finishLabel = Engine.formatFinish(main.finType, main.finMove);
    const turns = main.turns || 0;
    const mq = main.mq || avgMQ;
    const hpL = main.hpLeft || { final: 0, max: 100 };
    const hpR = main.hpRight || { final: 0, max: 100 };

    // 隧ｦ蜷育憾豕√ヵ繝ｩ繧ｰ
    const loserHpPct = isDraw ? 50 : (main.winner === 'left'
      ? Math.round((hpR.final / Math.max(1, hpR.max)) * 100)
      : Math.round((hpL.final / Math.max(1, hpL.max)) * 100));
    const winnerHpPct = isDraw ? 50 : (main.winner === 'left'
      ? Math.round((hpL.final / Math.max(1, hpL.max)) * 100)
      : Math.round((hpR.final / Math.max(1, hpR.max)) * 100));
    const isCloseMatch = !isDraw && loserHpPct >= 15;
    const isDominant = !isDraw && turns <= 6;
    const isLongBattle = turns >= 18;
    const isHighMQ = mq >= 80;
    const isSuperMQ = mq >= 90;
    const isLowMQ = mq < 40;
    const isPPVShow = isPPV(G.week);
    const isSpecial = isSpecialShow(G.week);

    // 蝗邵√・髢｢菫ゅョ繝ｼ繧ｿ
    const rivalLvl = getRivalryLevel(main.left.id, main.right.id);
    const hasRivalry = !!rivalLvl && !rivalLvl.isGoodRival;
    const isGoodRival = !!rivalLvl && rivalLvl.isGoodRival;
    const rivalLabel = rivalLvl ? rivalLvl.label : null;
    let bondAvg = 50;
    if (G.relationships) {
      const kAB = `${main.left.id}>${main.right.id}`;
      const kBA = `${main.right.id}>${main.left.id}`;
      const bA = G.relationships[kAB]?.bond || 50;
      const bB = G.relationships[kBA]?.bond || 50;
      bondAvg = Math.round((((bA + bB) / 2) + Number.EPSILON) * 10) / 10;
    }
    const isHighBond = bondAvg >= 70;

    // OVR蟾ｮ
    const ovrL = Engine.util.ov(main.left);
    const ovrR = Engine.util.ov(main.right);
    const ovrGap = Math.abs(ovrL - ovrR);
    const isUpset = !isDraw && winner && (
      (winner.id === main.left.id && ovrL < ovrR - 8) ||
      (winner.id === main.right.id && ovrR < ovrL - 8)
    );

    // 莉悶・隧ｦ蜷医・繝上う繝ｩ繧､繝・
    const otherHighMQ = results.slice(1).filter(r => (r.mq || 0) >= 75);
    const totalMatches = results.length;

    // 繧ｿ繧､繝医Ν繝槭ャ繝√・蝣ｴ蜷医・亟陦・螂ｪ蜿悶ｒ蛻､螳夲ｼ・lastTitleOutcomes 縺ｯ譛ｬ髢｢謨ｰ蜻ｼ縺ｳ蜃ｺ縺礼峩蜑阪↓險ｭ螳壹＆繧後※縺・ｋ・・
    let isTitleDefense = false;
    if (main.isTitleMatch && !isDraw && winner) {
      const outcomes = App._lastTitleOutcomes || [];
      const winnerId = winner.id;
      const mainOutcome = outcomes.find(o =>
        (o.outcome === 'defense' && o.champId === winnerId) ||
        (o.outcome === 'change' && o.newChampId === winnerId)
      );
      isTitleDefense = mainOutcome?.outcome === 'defense';
    }

    // 笏笏笏 繝・く繧ｹ繝育函謌・笏笏笏
    const np = App._generateNewspaperTexts({
      isDraw, winner, loser, left: main.left, right: main.right,
      isTitleMatch: !!main.isTitleMatch, isTitleDefense, finishLabel, turns, mq,
      loserHpPct, winnerHpPct, isCloseMatch, isDominant, isLongBattle,
      isHighMQ, isSuperMQ, isLowMQ, isPPVShow, isSpecial,
      hasRivalry, isGoodRival, rivalLabel, isHighBond,
      ovrGap, isUpset, venue, attendance, showName, avgMQ,
      otherHighMQ, totalMatches, orgName: G.orgName
    });

    // 笏笏 allMatches: 繝｡繧､繝ｳ莉･螟悶・蜈ｨ隧ｦ蜷医ム繧､繧ｸ繧ｧ繧ｹ繝・笏笏
    const allMatches = results.slice(1).map(r => {
      if (!r || !r.left || !r.right) return null;
      const isMatchDraw = r.winner === 'draw';
      const matchWinner = isMatchDraw ? null : (r.winner === 'left' ? r.left : r.right);
      const matchLoser = isMatchDraw ? null : (r.winner === 'left' ? r.right : r.left);
      const ovrL = Engine.util.ov(r.left);
      const ovrR = Engine.util.ov(r.right);
      return {
        left: { id: r.left.id, name: r.left.name, ovr: ovrL },
        right: { id: r.right.id, name: r.right.name, ovr: ovrR },
        winner: r.winner,
        winnerName: matchWinner?.name || null,
        loserName: matchLoser?.name || null,
        mq: r.mq || 0,
        turns: r.turns || 0,
        finishLabel: Engine.formatFinish(r.finType, r.finMove),
        isDraw: isMatchDraw,
        isUpset: !isMatchDraw && matchWinner && (
          (matchWinner.id === r.left.id && ovrL < ovrR - 8) ||
          (matchWinner.id === r.right.id && ovrR < ovrL - 8)
        ),
        isDominant: !isMatchDraw && (r.turns || 99) <= 6,
        isTitleMatch: !!r.isTitleMatch,
      };
    }).filter(Boolean);

    // 髮・ｮ｢v2: 笘・ｩ穂ｾ｡繧致2 calcShowRating 縺ｧ邂怜・
    const npValidMatches = (G.showCard || []).filter(m => m.left > 0 && m.right > 0);
    const npFanExpects = Engine.fanExpect.generate(G);
    const npRatingCtx = {
      hasTitleMatch: npValidMatches.some(m => m.isTitle),
      titleGreatMQ: npValidMatches.some(m => m.isTitle) ? results.find((r, i) => npValidMatches[i]?.isTitle)?.mq || 0 : 0,
      rivalryResolved: results.some(r => r.rivalryResolved),
      rivalryCards: npValidMatches.filter(m => {
        if (!G.relationships) return false;
        const rAB = G.relationships[`${m.left}>${m.right}`]?.rivalry || 0;
        const rBA = G.relationships[`${m.right}>${m.left}`]?.rivalry || 0;
        return Math.max(rAB, rBA) >= 30;
      }).length,
      fanExpectMatches: npFanExpects ? Engine.fanExpect.countMatched(npValidMatches, npFanExpects) : 0,
    };
    const npRating = Engine.attendanceV2.calcShowRating(results, attendance, VENUES[G.showVenue].cap, G.showVenue, npRatingCtx);
    const showRating = { stars: npRating.stars, totalScore: npRating.totalScore, mqScore: npRating.mqScore, occScore: npRating.occScore, bonusScore: npRating.bonusScore, actual: avgMQ };

    // 笏笏 preview: 谺｡蝗槫ｱ墓悍繝・・繧ｿ 笏笏
    const preview = { fanExpect: [], rivalry: null, title: null };
    // 繝輔ぃ繝ｳ譛溷ｾ・き繝ｼ繝会ｼ亥虚逧・函謌撰ｼ・
    const pvFanExpects = Engine.fanExpect.generate(G);
    if (pvFanExpects && pvFanExpects.length > 0) {
      pvFanExpects.slice(0, 2).forEach(fe => {
        const feLeft = G.roster.find(f => f.id === fe.leftId) || ALL_CHARS.find(c => c.id === fe.leftId);
        const feRight = G.roster.find(f => f.id === fe.rightId) || ALL_CHARS.find(c => c.id === fe.rightId);
        if (feLeft && feRight) {
          preview.fanExpect.push({ leftId: feLeft.id, leftName: feLeft.name, rightId: feRight.id, rightName: feRight.name });
        }
      });
    }
    // 蝗邵√・繧｢・・ier縺梧怙螟ｧ縺ｮ繧ゅ・・・
    if (G.rivalries) {
      let maxTier = 0, hotPair = null;
      Object.entries(G.rivalries).forEach(([key, riv]) => {
        const tier = riv.tier || 0;
        const matches = riv.matches || 0;
        if (tier > maxTier || (tier === maxTier && matches > (hotPair?._matches || 0))) {
          maxTier = tier;
          const ids = key.split('>');
          const rLeft = G.roster.find(f => f.id === ids[0]);
          const rRight = G.roster.find(f => f.id === ids[1]);
          if (rLeft && rRight) hotPair = { leftName: rLeft.name, rightName: rRight.name, _matches: matches };
        }
      });
      if (hotPair && maxTier >= 1) {
        preview.rivalry = { leftName: hotPair.leftName, rightName: hotPair.rightName };
      }
    }
    // 繧ｿ繧､繝医Ν謌ｦ螻墓悍
    const champId = G.titles?.world?.championId;
    if (champId) {
      const champ = G.roster.find(f => f.id === champId);
      const challenger = [...G.roster]
        .filter(f => f.id !== champId)
        .sort((a, b) => Engine.util.ov(b) - Engine.util.ov(a))[0];
      if (champ && challenger) {
        preview.title = { championName: champ.name, challengerName: challenger.name };
      }
    }

    return {
      showName, venueName: venue.name, venueIdx: G.showVenue, attendance, avgMQ,
      headline: np.headline, subheadline: np.subheadline, article: np.article,
      winner, loser, left: main.left, right: main.right, isDraw, finishLabel,
      turns, mq, hpLeft: hpL, hpRight: hpR, isTitleMatch: !!main.isTitleMatch,
      allMatches, showRating, preview,
      generatedWeek: G.week, generatedSeason: G.season,
    };
  },

  _glimpseSignature(glimpse) {
    return [
      glimpse.layer || '',
      glimpse.type || '',
      glimpse.axis || '',
      glimpse.tone || '',
      glimpse.speakerId || '',
      glimpse.targetId || '',
      glimpse.label || '',
      glimpse.dialogue || '',
    ].join('|');
  },

  _buildShowResultPreviewState(baseState) {
    let previewState = baseState;
    const pendingInjuryRetirements = previewState._pendingInjuryRetirements || [];
    if (previewState._pendingInjuryRetirements) {
      const { _pendingInjuryRetirements: _, ...cleanPreview } = previewState;
      previewState = cleanPreview;
    }
    pendingInjuryRetirements.forEach(r => {
      previewState = archiveRetiredRivalryState(previewState, r.fighter || null);
    });

    const pendingLastRunRetirements = previewState._pendingLastRunRetirements || [];
    if (previewState._pendingLastRunRetirements) {
      const { _pendingLastRunRetirements: _, ...cleanPreview } = previewState;
      previewState = cleanPreview;
    }
    pendingLastRunRetirements.forEach(r => {
      previewState = archiveRetiredRivalryState(previewState, r.fighter || null);
    });

    return previewState;
  },

  prepareShowResultInlinePopups() {
    if (App._showResultInlinePreviewPrepared) return;
    App._showResultInlinePreviewPrepared = true;
    App._showResultInlinePreview = null;

    try {
      const previewBaseState = App._buildShowResultPreviewState(G);
      const previewTick = Engine.tickWeek(previewBaseState);
      const previewState = previewTick?.state || null;
      if (!previewState) return;

      const allGlimpses = [
        ...(previewState._pendingGlimpseA || []),
        ...(previewState._pendingGlimpseB || []),
      ];
      const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
      if (tier1.length === 0) return;

      App._showResultInlinePreview = {
        shownSignatures: new Set(),
      };

      setTimeout(() => {
        const overlay = document.getElementById('showResultOverlay');
        if (!overlay || !overlay.classList.contains('active') || !App._showResultInlinePreview) return;
        tier1.forEach(glimpse => {
          const sig = App._glimpseSignature(glimpse);
          App._showResultInlinePreview.shownSignatures.add(sig);
          showGlimpseAModal(glimpse, { allowWhileShowResult: true });
        });
      }, 500);
    } catch (e) {
      console.error('[WM] prepareShowResultInlinePopups failed:', e);
      App._showResultInlinePreview = null;
    }
  },


  // Close show result and advance via tickWeek
  closeShowResult() {
    if (App._closingShowResult) return;
    const resultOverlay = document.getElementById('showResultOverlay');
    if (!resultOverlay) return;
    if (G.weekPhase !== 'showExec') {
      // Guard against desynced phase state leaving the show-result overlay stranded.
      if (resultOverlay.classList.contains('active')) {
        console.warn('[WM] closeShowResult fallback: overlay active while weekPhase=', G.weekPhase);
        resultOverlay.classList.remove('active');
        App._showResultInlinePreviewPrepared = false;
        App._showResultInlinePreview = null;
        Audio.play('coin');
        Audio.bgm.playForState();
        showScreen('week');
        refreshAll();
      }
      return;
    }
    // D螻､ postShow: 雜・ｺ蜩｡繝峨・繝繧ｻ繝ｬ繝｢繝九・・・ickWeek 蜑阪↓逋ｺ轣ｫ・・
    if (G._pendingDomeSelloutCeremony) {
      const { _pendingDomeSelloutCeremony: _, ...cleanG } = G;
      G = { ...cleanG, milestones: { ...(cleanG.milestones || {}), first_dome_sellout: true } };
      const domeEvt = MILESTONE_EVENTS.find(e => e.id === 'first_dome_sellout');
      if (domeEvt) {
        resultOverlay.classList.remove('active');
        App._showResultInlinePreviewPrepared = false;
        App._showResultInlinePreview = null;
        const speakers = App._resolveSpotlightFighters(G);
        showCeremonyEvent(domeEvt, speakers, () => { App.closeShowResult(); });
        return;
      }
    }
    App._closingShowResult = true;
    try {
      const inlinePreview = App._showResultInlinePreview;
      App._showResultInlinePreviewPrepared = false;
      App._showResultInlinePreview = null;
      Audio.play('coin');
      Audio.bgm.play('management');
      resultOverlay.classList.remove('active');

    // 隧ｦ蜷亥ｾ後さ繝｡繝ｳ繝医・繝・・繧｢繝・・・亥屏邵√・繝・メ・・
    const matchDialogues = [..._pendingMatchDialogues];
    _pendingMatchDialogues = [];
    if (matchDialogues.length > 0) {
      showPostMatchDialogues(matchDialogues);
    }

    // v1.3-3: Extract pending injury retirements before state changes
    let pendingInjuryRetirements = G._pendingInjuryRetirements || [];
    if (G._pendingInjuryRetirements) {
      const { _pendingInjuryRetirements: _, ...cleanG } = G;
      G = cleanG;
    }
    // 諤ｪ謌大ｼ暮繧ｻ繝ｪ繝輔・蜿悶ｊ縺薙⊂縺玲舞貂・ lookup 螟ｱ謨励・transient 谺關ｽ縺ｧ _pendingInjuryRetirements 縺ｫ
    // 霈峨ｉ縺ｪ縺九▲縺溘御ｻ企ｱ縺ｮ諤ｪ謌大ｼ暮閠・阪ｒ retiredFighters 縺ｮ譛譁ｰ retire 繧､繝吶Φ繝医°繧牙ｾｩ蜈・☆繧・
    {
      const queuedIds = new Set(
        pendingInjuryRetirements.map(r => r?.fighter?.id).filter(id => id != null)
      );
      const orphaned = (G.retiredFighters || []).filter(f => {
        if (!f || queuedIds.has(f.id)) return false;
        const history = f.careerRecord?.history || [];
        const latestRetire = [...history].reverse().find(h => h.type === 'retire');
        if (!latestRetire) return false;
        if (latestRetire.season !== G.season || latestRetire.week !== G.week) return false;
        return latestRetire.reason === 'wearInjury' || latestRetire.reason === 'careerEnding';
      });
      if (orphaned.length > 0) {
        const fbRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAD2, 0x9));
        const recovered = orphaned.map(f => {
          const history = f.careerRecord?.history || [];
          const latestRetire = [...history].reverse().find(h => h.type === 'retire');
          const route = latestRetire?.reason === 'careerEnding' ? 'injury_career_ending' : 'injury_wear';
          const { line, category } = Engine.retirement.selectLine(f, route, G, fbRng);
          const summary = Engine.retirement.buildCareerSummary(f);
          console.warn('[WM] injury retirement recovered via fallback', { id: f.id, name: f.name, route });
          return { fighter: f, route, line, category, summary };
        });
        pendingInjuryRetirements = [...pendingInjuryRetirements, ...recovered];
      }
    }
    pendingInjuryRetirements.forEach(r => {
      G = archiveRetiredRivalryState(G, r.fighter || null);
    });

    // 繝ｩ繧ｹ繝医Λ繝ｳ蠑暮・亥ｼ暮隧ｦ蜷亥ｮ御ｺ・ｾ後・蜊ｳ蠑暮・・
    let pendingLastRunRetirements = G._pendingLastRunRetirements || [];
    if (G._pendingLastRunRetirements) {
      const { _pendingLastRunRetirements: _, ...cleanG } = G;
      G = cleanG;
    }
    try {
      console.warn('[WM][lastrun-diag] closeShowResult:entry',
        { pendingLastRunCount: pendingLastRunRetirements.length,
          names: pendingLastRunRetirements.map(r => r?.fighter?.name),
          hasPendingR3: !!G._pendingR3Modal,
          r3Reason: G._pendingR3Modal?.reason });
    } catch (_e) {}
    const existingLastRunRetiredIds = new Set(
      pendingLastRunRetirements
        .map(r => r?.fighter?.id)
        .filter(id => id != null)
    );
    const fallbackLastRunFighters = new Map();
    (G.lastShowResults || []).forEach(r => {
      const participantIds = r?.matchType === 'tag'
        ? Object.keys(r?.perFighter || {}).map(Number)
        : [r?.left?.id, r?.right?.id].filter(id => id != null);
      participantIds.forEach(id => {
        if (existingLastRunRetiredIds.has(id) || fallbackLastRunFighters.has(id)) return;
        const fighter = (G.roster || []).find(c => c.id === id && c.lastRun);
        if (fighter) fallbackLastRunFighters.set(id, fighter);
      });
    });
    if (fallbackLastRunFighters.size > 0) {
      const lrLineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAD3, 0x2));
      const synthesizedRetirements = [...fallbackLastRunFighters.values()].map(fighter => {
        let retiredFighter = Engine.career.ensure({ ...fighter, lastRun: false, lastRunWeek: null });
        retiredFighter = Engine.career.addEvent(retiredFighter, {
          type: 'retire', reason: 'lastrun', season: G.season, week: G.week, age: retiredFighter.age
        });
        delete retiredFighter.growthLog;
        const { line, category } = Engine.retirement.selectLine(retiredFighter, 'lastrun', G, lrLineRng);
        const summary = Engine.retirement.buildCareerSummary(retiredFighter);
        return { fighter: retiredFighter, route: 'lastrun', line, category, summary, canRetain: false };
      });
      pendingLastRunRetirements = [...pendingLastRunRetirements, ...synthesizedRetirements];
    }
    // 繝ｩ繧ｹ繝医Λ繝ｳ蠑暮繧ｻ繝ｪ繝輔・蜿悶ｊ縺薙⊂縺玲舞貂・隨ｬ3螻､): processShowResult / fallback 縺ｮ荳｡譁ｹ縺ｧ
    // 諡ｾ縺医↑縺九▲縺溷ｴ蜷医↓縲〉etiredFighters 縺ｮ譛譁ｰ retire 繧､繝吶Φ繝・(reason='lastrun', 蜷碁ｱ)
    // 縺九ｉ蠕ｩ蜈・☆繧九ゅ％繧後〒譛ｬ莠ｺ繝昴ャ繝励い繝・・縺後ぞ繝ｭ縺ｫ縺ｪ繧倶ｺ区腐繧帝亟縺舌・
    {
      const queuedIds = new Set(
        pendingLastRunRetirements.map(r => r?.fighter?.id).filter(id => id != null)
      );
      const orphanedLR = (G.retiredFighters || []).filter(f => {
        if (!f || queuedIds.has(f.id)) return false;
        const history = f.careerRecord?.history || [];
        const latestRetire = [...history].reverse().find(h => h.type === 'retire');
        if (!latestRetire) return false;
        if (latestRetire.season !== G.season || latestRetire.week !== G.week) return false;
        return latestRetire.reason === 'lastrun';
      });
      if (orphanedLR.length > 0) {
        const lrFbRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAD3, 0xF));
        const recovered = orphanedLR.map(f => {
          const { line, category } = Engine.retirement.selectLine(f, 'lastrun', G, lrFbRng);
          const summary = Engine.retirement.buildCareerSummary(f);
          console.warn('[WM] lastrun retirement recovered via 3rd-tier fallback', { id: f.id, name: f.name });
          return { fighter: f, route: 'lastrun', line, category, summary, canRetain: false };
        });
        pendingLastRunRetirements = [...pendingLastRunRetirements, ...recovered];
      }
    }
    if (pendingLastRunRetirements.length > 0) {
      const lastRunRetiredIds = new Set(
        pendingLastRunRetirements
          .map(r => r?.fighter?.id)
          .filter(id => id != null)
      );
      if (lastRunRetiredIds.size > 0) {
        const retiredById = new Map((G.retiredFighters || []).map(f => [f.id, f]));
        pendingLastRunRetirements.forEach(r => {
          if (r?.fighter?.id != null && !retiredById.has(r.fighter.id)) retiredById.set(r.fighter.id, r.fighter);
        });
        const retiredIds = new Set(G.retiredIds || []);
        lastRunRetiredIds.forEach(id => retiredIds.add(id));
        const retiredSeasons = { ...(G.retiredSeasons || {}) };
        pendingLastRunRetirements.forEach(r => {
          if (r?.fighter?.id != null) retiredSeasons[r.fighter.id] = G.season;
        });
        G = {
          ...G,
          roster: (G.roster || []).filter(c => !lastRunRetiredIds.has(c.id)),
          retiredFighters: [...retiredById.values()],
          retiredIds: [...retiredIds],
          retiredSeasons,
        };
        const validated = Engine.title.validateChampion(G);
        if (validated.msg) {
          G = { ...G, titles: validated.titles, gameLog: [...(G.gameLog || []), validated.msg] };
        }
      }
    }
    pendingLastRunRetirements.forEach(r => {
      G = archiveRetiredRivalryState(G, r.fighter || null);
    });

    // R3: 繝輔ぃ繝ｳ譛溷ｾ・き繝ｼ繝芽ｩｦ蜷亥ｾ後Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ
    const fanExpectResults = (G.lastShowResults || []).filter(r => r.fanExpectMatch);
    let hasEventPopups = false;
    fanExpectResults.forEach((r, i) => {
      const isGood = r.mq >= 55;
      const crowd = isGood ? FAN_EXPECT_REACTIONS.goodCrowd : FAN_EXPECT_REACTIONS.badCrowd;
      const winnerPool = isGood ? FAN_EXPECT_REACTIONS.goodWinner : FAN_EXPECT_REACTIONS.badWinner;
      const crowdText = crowd[Math.floor(Math.random() * crowd.length)];
      const winnerId = r.winner === 'left' ? r.left.id : r.winner === 'right' ? r.right.id : r.left.id;
      const winnerName = r.winner === 'left' ? r.left.name : r.winner === 'right' ? r.right.name : r.left.name;
      const winnerFighter = (G.roster || []).find(c => c.id === winnerId) || ALL_CHARS.find(c => c.id === winnerId);
      const winnerLine = pickDialogueLine(winnerPool, winnerFighter);
      hasEventPopups = true;
      setTimeout(() => showEventPopup({
        type: 'fighter', id: winnerId, name: winnerName,
        tone: isGood ? 'gold' : 'neutral',
        message: winnerLine,
        detail: `謄 ${crowdText}`,
        autoCloseMs: 2500,
      }), i * 100);
    });

    // v0.96: Show injury popups (only non-retirement injuries)
    const injuries = App._lastInjuries || [];
    injuries.forEach((ir, i) => {
      // v1.3-3: Skip retirement injuries (they get their own popup)
      if (ir.retireType) return;
      const ch = G.roster.find(c => c.name === ir.name);
      if (!ch || !ir.injury) return;
      hasEventPopups = true;
      setTimeout(() => {
        showEventPopup({
          type: 'fighter', id: ch.id, name: ch.name, tone: 'negative',
          message: getTraitQuote('injury', ch),
          detail: `唱 ${ir.injury.type} 窶・蜈ｨ豐ｻ${ir.injury.weeksLeft}騾ｱ髢伝,
        });
      }, i * 100);
    });
    App._lastInjuries = [];
    // v1.2: 荵ｱ蜈･繝槭ャ繝∫ｵ先棡繝昴ャ繝励い繝・・
    if (App._intrusionData) {
      const id = App._intrusionData;
      const intruderId = id.intruder.id;
      // 荵ｱ蜈･驕ｸ謇九′邇玖・↓縺ｪ縺｣縺ｦ縺・◆繧会ｼ茨ｼ晉ｩｺ菴榊喧蜑阪・championId縺縺｣縺滂ｼ峨∫視蠎ｧ螂ｪ蜿・
      const wasIntruderCrowned = !G.titles?.world?.championId; // 遨ｺ菴搾ｼ昜ｹｱ蜈･驕ｸ謇九↓螂ｪ繧上ｌ縺・
      const popupDelay = injuries.length * 100 + 50;
      hasEventPopups = true;
      if (wasIntruderCrowned) {
        setTimeout(() => showEventPopup({ type:'fighter', id:intruderId, name:id.intruder.name, tone:'negative',
          message: `${id.fromOrgName}縺ｮ${id.intruder.name}縺ｫ邇句ｺｧ繧貞･ｪ繧上ｌ縺溪ｦ`,
          detail: `邇句ｺｧ縺ｯ遨ｺ菴阪↓縲よｬ｡縺ｮ繧ｿ繧､繝医Ν繝槭ャ繝√〒譁ｰ邇玖・ｒ豎ｺ螳壹＠縺ｦ縺上□縺輔＞縲Ａ }), popupDelay);
      } else {
        setTimeout(() => showEventPopup({ type:'fighter', id:G.titles.world.championId, name:id.champName, tone:'gold',
          message: `荵ｱ蜈･閠・ｒ騾縺代◆・～,
          detail: `荘 ${id.champName}縺・{id.fromOrgName}縺ｮ${id.intruder.name}繧呈茶遐ｴ・・蝗｣菴謎ｺｺ豌・2` }), popupDelay);
      }
      App._intrusionData = null;
    }
    // 繧ｿ繧､繝医Ν繝槭ャ繝∝ｾ後Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ・亥享謨怜撫繧上★・・
    const titleOutcomes = App._lastTitleOutcomes || [];
    App._lastTitleOutcomes = [];
    let titlePopupDelay = injuries.length * 100 + 50;
    titleOutcomes.forEach(to => {
      if (to.outcome === 'change') {
        // 譁ｰ邇玖・Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ
        const newChamp = G.roster.find(c => c.id === to.newChampId);
        if (newChamp) {
          hasEventPopups = true;
          const d = titlePopupDelay; titlePopupDelay += 100;
          setTimeout(() => showEventPopup({ type:'fighter', id:newChamp.id, name:newChamp.name, tone:'gold',
            message: getTraitQuote('titleWin', newChamp), detail:`荘 ${newChamp.name}縺梧眠蝗｣菴鍋視閠・↓・～ }), d);
        }
        // 蜑咲視閠・Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ
        if (to.prevChampId) {
          const prevChamp = G.roster.find(c => c.id === to.prevChampId);
          if (prevChamp) {
            hasEventPopups = true;
            const d = titlePopupDelay; titlePopupDelay += 100;
            setTimeout(() => showEventPopup({ type:'fighter', id:prevChamp.id, name:prevChamp.name, tone:'negative',
              message: getTraitQuote('titleLoss', prevChamp), detail:`邇句ｺｧ髯･關ｽ窶ｦ` }), d);
          }
        }
      } else if (to.outcome === 'defense') {
        // 繝√Ε繝ｳ繝斐が繝ｳ髦ｲ陦帙Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ
        const champ = G.roster.find(c => c.id === to.champId);
        if (champ) {
          hasEventPopups = true;
          const d = titlePopupDelay; titlePopupDelay += 100;
          setTimeout(() => showEventPopup({ type:'fighter', id:champ.id, name:champ.name, tone:'gold',
            message: getTraitQuote('titleDefense', champ), detail:`孱・・繧ｿ繧､繝医Ν髦ｲ陦帶・蜉滂ｼ～ }), d);
        }
        // 謖第姶閠・Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ
        const challenger = G.roster.find(c => c.id === to.challengerId);
        if (challenger) {
          hasEventPopups = true;
          const d = titlePopupDelay; titlePopupDelay += 100;
          setTimeout(() => showEventPopup({ type:'fighter', id:challenger.id, name:challenger.name, tone:'negative',
            message: getTraitQuote('titleChallengeLoss', challenger), detail:`繧ｿ繧､繝医Ν謖第姶螟ｱ謨冷ｦ` }), d);
        }
      }
    });
    // v1.4w: 闊郁｡檎ｵ先棡縺九ｉ譁ｰ閨槭う繝吶Φ繝医ｒ蜿朱寔・・ickWeek蜑搾ｼ・
    const _preDefenses = G.titles?.world?.defenses || 0;
    const _preChampId = G.titles?.world?.championId;

    const result = Engine.tickWeek(G);
    // v0.95: Track finances
    const stats = { ...G.seasonStats };
    if (result.state.weeklyFinance) {
      stats.totalRevenue += result.state.weeklyFinance.income || 0;
      stats.totalExpense += result.state.weeklyFinance.expense || 0;
    }
    if (result.state.funds > stats.peakFunds) stats.peakFunds = result.state.funds;
    if ((result.state.orgPop || 0) > stats.peakPop) stats.peakPop = result.state.orgPop || 0;
    const fh = [...(G.fundsHistory || []), result.state.funds];
    G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };

    // 闊郁｡檎ｵゆｺ・ｾ後↓showCard繧偵Μ繧ｻ繝・ヨ・・enderShowPrep 縺ｮ pad/trim 縺ｧ莨壼ｴ縺ｫ蠢懊§縺滓棧謨ｰ縺ｫ閾ｪ蜍戊ｪｿ謨ｴ・・
    G = { ...G, showCard: [] };

    // v1.4w: 髦ｲ陦帙・繧､繝ｫ繧ｹ繝医・繝ｳ讀懷・
    const _postDefenses = G.titles?.world?.defenses || 0;
    if (_postDefenses > _preDefenses) {
      const milestone = Engine.news.checkDefenseMilestone(_postDefenses);
      if (milestone > 0) {
        const champ = G.roster.find(c => c.id === G.titles?.world?.championId);
        if (champ) {
          App._pushNewsEvent({ type: 'defenseRecord', characterId: champ.id,
            data: { name: champ.name, org: G.orgName || '縺ゅ↑縺溘・蝗｣菴・, count: _postDefenses } });
        }
      }
    }
    // v1.4w: 繝・ぅ繝・き繝ｼ譖ｴ譁ｰ
    App._refreshTicker();

    // v1.2-9: Flavor event popups after show settlement
    const showFlavorEvents = G._flavorEvents || [];
    if (showFlavorEvents.length > 0) {
      showFlavorEvents.forEach((ev, i) => {
        hasEventPopups = true;
        const detail = ev.type === 'magazine' ? `莠ｺ豌・+${ev.popGain}` : `繝偵・繝・+${ev.heatGain}`;
        setTimeout(() => showEventPopup({
          type: 'fighter', id: ev.fighterId, name: ev.fighterName,
          tone: 'positive', message: ev.headline, detail
        }), i * 100 + 50);
      });
      const { _flavorEvents, ...cleanG } = G;
      G = cleanG;
    }
    
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    // v1.5s25b: 闊郁｡悟ｾ後ヰ繝墓ｶ郁ｲｻ + 騾ｱ谺｡繝舌ヵ豸郁ｲｻ
    App._tickMilestoneBuffsShow();
    App._applyWeeklyBuffEffects();
    App._tickMilestoneBuffsWeekly();

    // 繝昴ャ繝励い繝・・騾｣骼・ eventPopups 竊・蝗邵∵ｱｺ逹 竊・繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ/繧ｹ繝ｩ繝ｳ繝・竊・蠑暮
    const pendingGrowthEventsShow = G._pendingGrowthEvents || [];
    if (G._pendingGrowthEvents) {
      const { _pendingGrowthEvents: _, ...cleanG } = G;
      G = cleanG;
    }
    const pendingResolutions = App._pendingRivalryResolutions || [];
    App._pendingRivalryResolutions = [];

    // 繝√ぉ繝ｼ繝ｳ繧帝・・↓邨・∩遶九※・・etirement 竊・growth 竊・resolution 竊・eventPopups・・
    const popupActions = [];
    if (pendingLastRunRetirements.length > 0) {
      popupActions.push(done => showRetirementPopups(pendingLastRunRetirements, done));
    }
    if (pendingInjuryRetirements.length > 0) {
      popupActions.push(done => showRetirementPopups(pendingInjuryRetirements, done));
    }
    if (pendingGrowthEventsShow.length > 0) {
      popupActions.push(done => showGrowthEventPopups(pendingGrowthEventsShow, done));
    }
    if (pendingResolutions.length > 0) {
      popupActions.push(done => showRivalryPopups(pendingResolutions, done));
    }
    // R3蜿榊ｿ懊Δ繝ｼ繝繝ｫ・・ond 75+ 莉ｲ髢薙・蛻･繧後Μ繧｢繧ｯ繧ｷ繝ｧ繝ｳ・峨・譛ｬ莠ｺ蠑暮繝昴ャ繝励い繝・・縺ｮ蠕後↓蜃ｺ縺吶・
    // 譌ｧ螳溯｣・・迢ｬ遶・setTimeout(800) 縺ｧ逋ｺ轣ｫ縺励※縺・◆縺溘ａ縲∵悽莠ｺ繝昴ャ繝励い繝・・縺碁≦蟒ｶ縺吶ｋ縺ｨ
    // R3 縺悟・縺ｫ髢九＞縺ｦ譛ｬ莠ｺ繝昴ャ繝励い繝・・縺悟・縺ｪ縺・隕玖誠縺ｨ縺輔ｌ繧倶ｺ区腐縺檎匱逕溘＠縺ｦ縺・◆縲・
    let pendingR3Spec = null;
    if (G._pendingR3Modal) {
      pendingR3Spec = G._pendingR3Modal;
      const { _pendingR3Modal: _, ...cleanR3Show } = G;
      G = cleanR3Show;
      const r3Fighter = G.roster.find(f => f.id === pendingR3Spec.fighterId);
      const r3Args = {
        fighterName: r3Fighter ? r3Fighter.name : '???',
        fighterFace: r3Fighter ? getPortraitUrl(r3Fighter.id) : null,
        departedName: pendingR3Spec.departedName || '???',
        reason: pendingR3Spec.reason || 'departed',
        line: pendingR3Spec.text,
      };
      popupActions.push(done => {
        showR3Modal(r3Args);
        // showR3Modal 縺ｯ蜊倡匱繝｢繝ｼ繝繝ｫ縺ｧ done 繧ｳ繝ｼ繝ｫ繝舌ャ繧ｯ繧呈戟縺溘↑縺・◆繧√∝叉蠎ｧ縺ｫ谺｡縺ｸ郢九＄
        if (done) done();
      });
    }
    try {
      console.warn('[WM][lastrun-diag] closeShowResult:popupActions',
        { actionCount: popupActions.length,
          pendingLastRun: pendingLastRunRetirements.length,
          pendingInjury: pendingInjuryRetirements.length,
          pendingGrowth: pendingGrowthEventsShow.length,
          pendingResolutions: pendingResolutions.length,
          hasR3: !!pendingR3Spec,
          hasEventPopups });
    } catch (_e) {}
    if (popupActions.length > 0) {
      const runPopupActions = () => {
        let idx = 0;
        const runNext = () => {
          const action = popupActions[idx++];
          if (action) action(runNext);
        };
        runNext();
      };
      if (hasEventPopups) {
        _chainEventPopupQueueEmpty(runPopupActions);
      } else {
        setTimeout(runPopupActions, 200);
      }
    }

    // relationship-flags-spec-v1.0 ﾂｧ4: 隧ｦ蜷育匱轣ｫ邉ｻ縺ｮ髢｢菫よｧ繝輔Λ繧ｰ繝｢繝ｼ繝繝ｫ
    if (typeof _drainFlagModalQueue === 'function') _drainFlagModalQueue();

    // Common-3 豢ｾ髢･蜉蜈･騾夂衍・郁・陦悟ｾ後↓逋ｺ逕溘＠縺溘ｂ縺ｮ繧よｶ亥喧・・
    App._drainFactionJoinNotices();

    // ﾂｧ6 繧｢繝ｼ繧ｭ繧ｿ繧､繝鈴・遘ｻ繝翫Ξ繝ｼ繧ｷ繝ｧ繝ｳ・・02 螳悟・謨怜圏縺ｪ縺ｩ闊郁｡悟ｾ後↓逋ｺ逕溘☆繧具ｼ・
    App._drainArchetypeTransitions();

    // 繧ｹ繝翫ャ繝励す繝ｧ繝・ヨ R3繝｢繝ｼ繝繝ｫ縺ｯ popupActions 繝√ぉ繝ｼ繝ｳ蜀・ｼ域悽莠ｺ蠑暮繝昴ャ繝励い繝・・縺ｮ蠕鯉ｼ峨↓
    // 邨・∩霎ｼ縺ｿ貂医∩縺ｮ縺溘ａ縲√％縺薙〒縺ｯ蛻･邨瑚ｷｯ縺ｮ setTimeout 逋ｺ轣ｫ縺ｯ縺励↑縺・・

    // P4-P6: Glimpse・亥ｿ・・蝙｣髢楢ｦ九∴・芽｡ｨ遉ｺ・郁・陦悟ｾ鯉ｼ・
    if (G._pendingGlimpseA || G._pendingGlimpseB) {
      const gA = G._pendingGlimpseA || null;
      const gB = G._pendingGlimpseB || null;
      if (G._pendingGlimpseA) { const { _pendingGlimpseA: _, ...c } = G; G = c; }
      if (G._pendingGlimpseB) { const { _pendingGlimpseB: _, ...c } = G; G = c; }
      const allGlimpses = [...(gA || []), ...(gB || [])];
      let tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
      const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));
      const shownSignatures = inlinePreview?.shownSignatures;
      if (shownSignatures && shownSignatures.size > 0) {
        tier1 = tier1.filter(g => !shownSignatures.has(App._glimpseSignature(g)));
      }
      if (tier2.length > 0) {
        G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
        refreshDojoLogFeed();
      }
      if (tier1.length > 0) {
        setTimeout(() => { tier1.forEach(g => showGlimpseAModal(g)); }, 900);
      }
    }

    // v1.0: Auto-advance on non-monthly weeks (same as processWeek)
    if (App._tryAutoAdvance()) return;
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
    } catch(e) {
      console.error('closeShowResult error:', e);
      try { showScreen('week'); } catch(e2) {}
      try { refreshAll(); } catch(e2) {}
    } finally {
      App._closingShowResult = false;
    }
  },

  // v1.4w: 繝・ぅ繝・き繝ｼ繝九Η繝ｼ繧ｹ蜀咲函謌撰ｼ・anage逕ｻ髱｢陦ｨ遉ｺ逕ｨ・・
  _refreshTicker() {
    if (!G || G.offSeason) return;
    const tickerRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBEEF));
    G = { ...G, _tickerItems: Engine.news.generateTicker(tickerRng, G) };
  },

  // v1.4w: 譁ｰ閨槭ヱ繝阪Ν繧､繝吶Φ繝医く繝･繝ｼ縺ｫ霑ｽ蜉
  _pushNewsEvent(ev) {
    const queue = [...(G._newsEvents || []), ev];
    G = { ...G, _newsEvents: queue };
  },

  // Common-3: 豢ｾ髢･蜉蜈･騾夂衍繧ｭ繝･繝ｼ繧帝・ｬ｡陦ｨ遉ｺ
  _drainFactionJoinNotices() {
    if (!G || !G._pendingFactionJoinNotices || !G._pendingFactionJoinNotices.length) return;
    if (typeof showFactionCommon3Modal !== 'function') {
      G = { ...G, _pendingFactionJoinNotices: [] };
      return;
    }
    const queue = [...G._pendingFactionJoinNotices];
    const { _pendingFactionJoinNotices: _, ...rest } = G;
    G = rest;
    const next = () => {
      const head = queue.shift();
      if (!head) return;
      showFactionCommon3Modal(head, G, next);
    };
    next();
  },

  // ﾂｧ6 繧｢繝ｼ繧ｭ繧ｿ繧､繝鈴・遘ｻ繝翫Ξ繝ｼ繧ｷ繝ｧ繝ｳ繧ｭ繝･繝ｼ繧帝・ｬ｡陦ｨ遉ｺ
  _drainArchetypeTransitions() {
    if (!G || !G._pendingArchetypeTransitions || !G._pendingArchetypeTransitions.length) return;
    if (typeof showFactionArchetypeTransitionModal !== 'function') {
      G = { ...G, _pendingArchetypeTransitions: [] };
      return;
    }
    const queue = [...G._pendingArchetypeTransitions];
    const { _pendingArchetypeTransitions: _, ...rest } = G;
    G = rest;
    const next = () => {
      const head = queue.shift();
      if (!head) return;
      showFactionArchetypeTransitionModal(head, G, next);
    };
    next();
  },

  // 讌ｭ逡後ル繝･繝ｼ繧ｹ繧ｭ繝･繝ｼ縺ｫ霑ｽ蜉・域ｯ朱ｱ縺ｮ譁ｰ閨樒判髱｢繝ｻ讌ｭ逡後ル繝･繝ｼ繧ｹ谺・↓豬√ｌ繧具ｼ・
  _pushIndustryNews(ev) {
    if (!ev || !ev.type) return;
    G = { ...G, _industryNewsEvents: [...(G._industryNewsEvents || []), ev] };
  },

  // h2h.history 縺ｫ遨阪・ meta 繝輔Λ繧ｰ繧呈ｧ狗ｯ会ｼ・-3 / 豢ｾ髢･謚嶺ｺ・/ 繝ｭ繝・き繝ｼ闕貞ｻ・/ 螂ｪ驍・ｼ・
  _buildMatchMeta(state, idA, idB, isReclaim) {
    const meta = {};
    // betrayal: B-3 蜈・酔蜒・髮｢閼ｱ蠕悟・蟇ｾ髱｢
    if (Engine.orgTimeline && typeof Engine.orgTimeline.checkFirstMeetSinceDeparture === 'function') {
      try { if (Engine.orgTimeline.checkFirstMeetSinceDeparture(state, idA, idB)) meta.betrayal = true; } catch (_) {}
    }
    // factionWar: 蜷悟屮菴灘・縺ｧ蛻･豢ｾ髢･謇螻槭∽ｸ｡豢ｾ髢･縺・hostility 迥ｶ諷・
    if (Engine.factions && typeof Engine.factions.getFactionByFighterId === 'function') {
      try {
        const fA = Engine.factions.getFactionByFighterId(state, idA);
        const fB = Engine.factions.getFactionByFighterId(state, idB);
        if (fA && fB && fA.id !== fB.id && (fA.inHostility || fB.inHostility)) {
          meta.factionWar = true;
        }
      } catch (_) {}
    }
    // lockerStress: _lockerCrisisWeek 縺檎峩霑・騾ｱ莉･蜀・
    if (state._lockerCrisisWeek != null && Engine.util && typeof Engine.util.absWeek === 'function') {
      const aw = Engine.util.absWeek(state.season, state.week);
      if (aw - state._lockerCrisisWeek <= 4) meta.lockerStress = true;
    }
    // reclaim: 螂ｪ驍・倦謌ｦ隧ｦ蜷・
    if (isReclaim) meta.reclaim = true;
    return meta;
  },

  // v1.4w: 譁ｰ閨槭ヱ繝阪Ν陦ｨ遉ｺ竊貞ｮ御ｺ・ｾ後↓callback
  _showNewsPanelIfNeeded(callback) {
    const events = G._newsEvents || [];
    if (events.length === 0) { callback(); return; }
    // 繧ｭ繝･繝ｼ豸亥喧
    const { _newsEvents: _, ...cleanG } = G;
    G = cleanG;
    const newsRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE57));
    const articles = Engine.news.generateHeadlines(newsRng, events);
    if (articles.length === 0) { callback(); return; }
    showNewspaperPanel(articles, callback);
  },

  // v2.0-C3: Always stop 窶・no auto-advance. Accumulate financeHistory and set weekSummary or settled phase.
  _tryAutoAdvance() {
    // 雋｡蜍吶ち繝悶Μ繝・じ繧､繝ｳ: financeHistory 縺ｫ騾ｱ谺｡豎ｺ邂励ｒ豌ｸ邯夊塘遨・
    const newHistory = [...(G.financeHistory || [])];
    newHistory.push({
      season: G.season,
      week: G.week,
      income: G.weeklyFinance.income || 0,
      expense: G.weeklyFinance.expense || 0,
      details: [...(G.weeklyFinance.details || [])],
      funds: G.funds,
    });
    const isMonthEnd = G.week % 4 === 0;
    if (!isMonthEnd) {
      // Non-month-end: show brief weekly summary instead of auto-advancing
      G = { ...G, financeHistory: newHistory, weekPhase: 'weekSummary' };
      Storage.autoSave();
      showScreen('week');
      refreshAll();
      return true; // signal: handled (caller should return)
    }
    // Month-end: accumulate and stop at settled (existing behavior)
    G = { ...G, financeHistory: newHistory };
    return false;
  },

  // v2.0-C3: Manual advance from weekly summary
  advanceFromWeekSummary() {
    Audio.play('tick');
    dismissAllPopups(); // 谿句ｭ倥・繝・・繧｢繝・・繧貞ｼｷ蛻ｶ繧ｯ繝ｪ繧｢
    const result = Engine.advanceWeek(G);
    G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
    // 笏笏 菴馴ｨ鍋沿繧ｷ繝ｼ繧ｺ繝ｳ繧ｲ繝ｼ繝・笏笏
    if (G._trialEnd) {
      const { _trialEnd: _, ...cleanG } = G;
      G = cleanG;
      Storage.autoSave();
      showTrialEndMessage();
      refreshAll();
      return;
    }
    // 螂醍ｴ・峩譁ｰ莠､貂峨ヵ繧ｧ繝ｼ繧ｺ
    if (G.weekPhase === 'contractNegotiation') {
      Storage.autoSave();
      App.handleContractNegotiations();
      return;
    }
    // PPV繝輔ぉ繝ｼ繧ｺ
    if (G.weekPhase === 'ppvShow') {
      Storage.autoSave();
      App.initPPVShow();
      return;
    }
    if (G.weekPhase === 'ppvTV') {
      Storage.autoSave();
      App.initPPVTV();
      return;
    }
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    sessionRng = Engine.rng.create(G.rngSeed);
    App._refreshTicker();
    Storage.autoSave();
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
    if (isShowWeek(G.week) && (isSpecialShow(G.week) || isPPV(G.week))) {
      const msg = isPPV(G.week) ? '醇 莉企ｱ縺ｯPPV GRAND FINAL・∝ｹｴ髢捺怙螟ｧ縺ｮ闊槫床縺ｧ縺呻ｼ・ : '箝・莉企ｱ縺ｯ譛域忰迚ｹ蛻･闊郁｡鯉ｼ∬ｩｦ蜷域棧+1縺ｧ邨・ａ繧具ｼ・;
      setTimeout(() => showToast(msg, 7000), 300);
    }
    // orgPop 繝ｪ繝舌Λ繝ｳ繧ｹ v1.1 ﾂｧ7: 繧ｷ繝ｼ繧ｺ繝ｳ髢句ｧ区凾縺ｮorgPop螟牙虚騾夂衍
    if (G._pendingSeasonStartNotif) {
      const notif = G._pendingSeasonStartNotif;
      const { _pendingSeasonStartNotif: _, ...cleanG } = G;
      G = cleanG;
      if (notif.decay > 0) {
        const nowPop = Math.round(notif.nowPop * 10) / 10;
        setTimeout(() => showToast(`謄 繧ｪ繝輔す繝ｼ繧ｺ繝ｳ縺ｧ蝗｣菴謎ｺｺ豌励′ -${notif.decay} 貂幄｡ｰ縺励∪縺励◆・育樟蝨ｨ: ${nowPop}・荏, 6000), 800);
      }
    }
  },

  // Process a week (manage + settle) via tickWeek
  // A-3: 縺翫∪縺九○閧ｲ謌・窶・譁ｹ驥昴ｒ邯ｭ謖√＠縺､縺､蠑ｷ蛹飽N/OFF縺ｨ菴楢ｪｿ60譛ｪ貅縺ｮ莨鷹､翫ｒ閾ｪ蜍戊ｨｭ螳・
  autoManage() {
    if (G.weekPhase !== 'manage') return;
    Audio.play('select');
    const roster = G.roster.map(c => {
      if (c.injury || c.isRental || c.forcedRest) return c;
      const policy = c.schedule || 'balance'; // 迴ｾ蝨ｨ縺ｮ譁ｹ驥昴ｒ菫晄戟
      if (c.condition >= 80) return { ...c, schedule: policy, intensive: policy !== 'rest' };
      if (c.condition >= 75) return { ...c, schedule: policy, intensive: false };
      if (c.condition >= 60) return { ...c, schedule: policy, intensive: false };
      // < 60: 譁ｹ驥昴↓髢｢繧上ｉ縺壻ｼ鷹､・
      return { ...c, schedule: 'rest', intensive: false };
    });
    G = { ...G, roster };
    showToast('､・縺翫∪縺九○螳御ｺ・窶・蜀・ｮｹ繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞');
    refreshAll();
  },

  processWeek() {
    Audio.play('tick');
    dismissAllPopups(); // 蜑埼ｱ縺ｮ谿句ｭ倥・繝・・繧｢繝・・繧貞ｼｷ蛻ｶ繧ｯ繝ｪ繧｢
    // 莉企ｱ縺ｮ繝ｭ繧ｰ繝輔ぅ繝ｼ繝峨ｒ繝ｪ繧ｻ繝・ヨ・亥燕騾ｱ蛻・け繝ｪ繧｢・・
    G = { ...G, weekLogFeed: [] };
    const oldRoster = G.roster.map(c => ({ id: c.id, injured: !!c.injury }));
    const result = Engine.tickWeek(G);
    const stats = { ...G.seasonStats };
    if (result.state.weeklyFinance) {
      stats.totalRevenue += result.state.weeklyFinance.income || 0;
      stats.totalExpense += result.state.weeklyFinance.expense || 0;
    }
    if (result.state.funds > stats.peakFunds) stats.peakFunds = result.state.funds;
    if ((result.state.orgPop || 0) > stats.peakPop) stats.peakPop = result.state.orgPop || 0;
    const fh = [...(G.fundsHistory || []), result.state.funds];
    G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };
    // v2.1: 繧ｲ繝ｼ繝繧ｪ繝ｼ繝舌・蛻､螳夲ｼ・utoSave 縺帙★蟆ら畑逕ｻ髱｢縺ｸ・・
    if (G.weekPhase === 'gameover') {
      const summary = Engine.ending.buildGameOverSummary(G);
      showGameOverScreen(summary);
      return;
    }
    
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    // v1.5s25b: 騾ｱ谺｡繝舌ヵ豸郁ｲｻ・・eekly_funds驕ｩ逕ｨ蜷ｫ繧・・
    App._applyWeeklyBuffEffects();
    App._tickMilestoneBuffsWeekly();
    // v1.4w: 繝・ぅ繝・き繝ｼ譖ｴ譁ｰ
    App._refreshTicker();
    // relationship-flags-spec-v1.0 ﾂｧ4: 髢｢菫よｧ繝輔Λ繧ｰ繝｢繝ｼ繝繝ｫ繧帝・ｬ｡ popup 縺ｫ豬√☆
    if (typeof _drainFlagModalQueue === 'function') _drainFlagModalQueue();
    // Common-3 豢ｾ髢･蜉蜈･騾夂衍繧帝・ｬ｡陦ｨ遉ｺ
    App._drainFactionJoinNotices();
    // ﾂｧ6 繧｢繝ｼ繧ｭ繧ｿ繧､繝鈴・遘ｻ繝翫Ξ繝ｼ繧ｷ繝ｧ繝ｳ・・07 rebuke 4 邏ｯ遨阪↑縺ｩ騾ｱ谺｡蜃ｦ逅・〒逋ｺ逕溘☆繧具ｼ・
    App._drainArchetypeTransitions();
    // v0.96: Detect new injuries and show popups
    const newInjuries = G.roster.filter(c => c.injury && !oldRoster.find(o => o.id === c.id)?.injured);
    newInjuries.forEach((c, i) => {
      setTimeout(() => showEventPopup({ type:'fighter', id:c.id, name:c.name, tone:'negative',
        message: getTraitQuote('injury', c), detail:`唱 ${c.injury.type} 窶・蜈ｨ豐ｻ${c.injury.weeksLeft}騾ｱ髢伝 }), i * 100);
    });
    // v1.2-9: Flavor event popups (髮題ｪ悟叙譚舌・TV蜃ｺ貍・
    const flavorEvents = G._flavorEvents || [];
    if (flavorEvents.length > 0) {
      const baseDelay = newInjuries.length * 100 + 50;
      flavorEvents.forEach((ev, i) => {
        const tone = ev.type === 'magazine' ? 'positive' : 'positive';
        const detail = ev.type === 'magazine'
          ? `莠ｺ豌・+${ev.popGain}`
          : `繝偵・繝・+${ev.heatGain}`;
        setTimeout(() => showEventPopup({
          type: 'fighter', id: ev.fighterId, name: ev.fighterName,
          tone, message: ev.headline, detail
        }), baseDelay + i * 100);
      });
      // Clean up transient field
      const { _flavorEvents, ...cleanState } = G;
      G = cleanState;
    }
    // v1.8: 騾ｱ谺｡謌宣聞繧､繝吶Φ繝茨ｼ医せ繝ｩ繝ｳ繝礼匱逕・蝗槫ｾｩ繝ｻ繝｢繝√・蝟ｪ螟ｱ・峨・繝・・繧｢繝・・
    const weekGrowthEvents = G._pendingGrowthEvents || [];
    if (G._pendingGrowthEvents) {
      const { _pendingGrowthEvents: _, ...cleanGe } = G;
      G = cleanGe;
    }
    // 閾ｪ荳ｻ蠑暮蜃ｦ逅・ｼ医Δ繝√・蝟ｪ螟ｱ24騾ｱ雜・∴・・
    const motivRetirements = G._pendingMotivationRetirements || [];
    if (G._pendingMotivationRetirements) {
      const { _pendingMotivationRetirements: _, ...cleanMr } = G;
      G = cleanMr;
    }
    if (motivRetirements.length > 0) {
      motivRetirements.forEach(r => {
        const f = G.roster.find(c => c.id === r.fighterId);
        if (!f) return;
        const lineRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xAA18, f.id));
        const { line } = Engine.retirement.selectLine(f, 'motivation', G, lineRng);
        const summary = Engine.retirement.buildCareerSummary(f);
        const retiredF = Engine.career.addEvent(Engine.career.ensure(f), { type: 'retire', reason: 'motivation', season: G.season, age: f.age });
        delete retiredF.growthLog;
        G = { ...G,
          roster: G.roster.filter(c => c.id !== f.id),
          retiredFighters: [...(G.retiredFighters || []), retiredF]
        };
        // 蝗｣菴灘ｹｴ莉｣險・ 繧｢繝ｼ繧ｫ繧､繝・+ 豌鈴｢ｨ蟇・ｸ・
        G = Engine.chronicle.archiveFighter(G, retiredF);
        G = Engine.chronicle.applySpiritContribution(G, retiredF);
        G = Engine.chronicle.refreshChapters(G);
        // 邇玖・′繝｢繝√・蝟ｪ螟ｱ蠑暮縺励◆蝣ｴ蜷医・邇句ｺｧ繧堤ｩｺ菴阪↓縺吶ｋ
        const vcMR = Engine.title.validateChampion(G);
        if (vcMR.msg) { G = { ...G, titles: vcMR.titles, gameLog: [...(G.gameLog || []), vcMR.msg] }; }
        G = archiveRetiredRivalryState(G, retiredF);
        // ﾂｧ2.3: 蠑暮閠・・髢｢菫ょ､繧貞㍾邨・
        if (G.relationships) G = Engine.relationships.freezeRelationships(G, f.id);
        const delay = (newInjuries.length + flavorEvents.length) * 100 + 200;
        setTimeout(() => showRetirementPopups([{ fighter: retiredF, route: 'motivation', line, summary }]), delay);
      });
    }
    if (weekGrowthEvents.length > 0) {
      const baseDelay = (newInjuries.length + flavorEvents.length) * 100 + 100;
      setTimeout(() => showGrowthEventPopups(weekGrowthEvents), baseDelay);
    }

    // 遉ｾ髟ｷ螳､ Phase 7: trainer/camp 縺ｮ菫｡鬆ｼ蠎ｦ驕・ｻｶ逋ｺ迴ｾ繝溘ル騾夂衍 (1莉ｶ/騾ｱ)
    // camp 縺ｯ蜈ｨ蜩｡蛻・・ reveal 縺悟酔騾ｱ縺ｫ逋ｺ逕溘☆繧九◆繧√｝erWeekDelta 髯埼・〒1莉ｶ縺縺代ヴ繝・け
    // (繧ｹ繝昴ャ繝医Λ繧､繝医・蟾｡繧句次蜑・
    const weekTrustReveals = G._pendingTrustReveals || [];
    if (G._pendingTrustReveals) {
      const { _pendingTrustReveals: _, ...cleanTr } = G;
      G = cleanTr;
    }
    if (weekTrustReveals.length > 0) {
      const pick = [...weekTrustReveals].sort((a, b) => b.perWeekDelta - a.perWeekDelta)[0];
      const SOURCE_TEXTS = {
        trainer: '蟆ょｱ槭ヨ繝ｬ繝ｼ繝翫・縺ｨ縺ｮ邱ｴ鄙偵〒',
        camp: '蜷亥ｮｿ縺ｮ謇句ｿ懊∴縺ｧ',
      };
      const prefix = SOURCE_TEXTS[pick.source] || '';
      const msg = `､・${prefix}${pick.fighterName}縺ｮ豌玲戟縺｡縺悟燕蜷代″縺ｫ縺ｪ縺｣縺ｦ縺阪◆`;
      const baseDelayTr = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 600;
      setTimeout(() => showToast(msg, 5000), baseDelayTr);
    }

    // 笘・謌宣聞繝槭う繝ｫ繧ｹ繝医・繝ｳ騾夂衍
    const pendingMilestone = G._pendingMilestone || null;
    if (G._pendingMilestone) {
      const { _pendingMilestone: _, ...cleanMs } = G;
      G = cleanMs;
    }
    if (pendingMilestone) {
      const msF = G.roster.find(c => c.id === pendingMilestone.fighterId);
      if (msF) {
        const msLine = pickDialogueLine(MILESTONE_LINES[pendingMilestone.linePool], msF);
        const STAT_JA = { pw: '繝代Ρ繝ｼ', sp: '繧ｹ繝斐・繝・, te: '繝・け繝九ャ繧ｯ', st: '繧ｹ繧ｿ繝溘リ', mn: '繝｡繝ｳ繧ｿ繝ｫ' };
        let msLabel;
        if (pendingMilestone.type === 'ovr') msLabel = `邱丞粋蜉・{pendingMilestone.value}蛻ｰ驕覗;
        else if (pendingMilestone.type === 'pop') msLabel = `莠ｺ豌・{pendingMilestone.value}蛻ｰ驕覗;
        else msLabel = `${STAT_JA[pendingMilestone.stat] || pendingMilestone.stat}縺碁剞逡後↓蛻ｰ驕覗;
        // growthLog縺ｫ繝槭う繝ｫ繧ｹ繝医・繝ｳ險倬鹸
        const msRoster = G.roster.map(c => {
          if (c.id !== msF.id) return c;
          return { ...c, growthLog: [...(c.growthLog || []), {
            season: G.season, week: G.week,
            type: 'milestone', detail: msLabel,
          }] };
        });
        G = { ...G, roster: msRoster };
        const msDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 800;
        setTimeout(() => showGrowthEventPopups([{
          type: 'milestone',
          subtype: pendingMilestone.type,
          fighterId: pendingMilestone.fighterId,
          value: pendingMilestone.value,
          stat: pendingMilestone.stat,
          line: msLine,
        }]), msDelay);
      }
    }

    // ﾂｧ13.4: 遯∫┯縺ｮ騾蝗｣陦ｨ遉ｺ
    const pendingSuddenDepartures = G._pendingSuddenDepartures || null;
    if (G._pendingSuddenDepartures) {
      const { _pendingSuddenDepartures: _, ...cleanSd } = G;
      G = cleanSd;
    }
    if (pendingSuddenDepartures && pendingSuddenDepartures.length > 0) {
      const sdDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 150;
      pendingSuddenDepartures.forEach((d, i) => {
        setTimeout(() => showNotifEventToast({
          type: 'N_sudden_departure',
          fighter: d.id,
          name: d.name,
          text: `坎 ${d.name}縺瑚差迚ｩ繧偵∪縺ｨ繧√※蝗｣菴薙ｒ蜴ｻ縺｣縺溘りｪｰ繧よｭ｢繧√ｉ繧後↑縺九▲縺溘Ａ,
          detail: d.destination === 'rival' ? `${d.name}縺ｯ莉門屮菴薙∈遘ｻ邀阪＠縺溘Ａ : `${d.name}縺ｯ繝輔Μ繝ｼ縺ｨ縺ｪ縺｣縺溘Ａ,
        }), sdDelay + i * 200);
      });
    }

    // P1: 繧ｹ繧ｭ繝｣繝ｳ繝繝ｫ騾夂衍繝昴ャ繝励い繝・・
    const pendingScandalEvents = G._pendingScandalEvents || null;
    if (G._pendingScandalEvents) {
      const { _pendingScandalEvents: _, ...cleanSc } = G;
      G = cleanSc;
    }
    if (pendingScandalEvents && pendingScandalEvents.length > 0) {
      const scandalDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 150;
      pendingScandalEvents.forEach((sc, i) => {
        setTimeout(() => showNotifEventToast({
          type: 'N_scandal',
          fighter: sc.fighterId,
          text: `堂 ${sc.fighterName}縺ｮ繧ｹ繧ｭ繝｣繝ｳ繝繝ｫ縺碁ｱ蛻願ｪ後↓謗ｲ霈峨＆繧後◆・～,
          detail: `繝輔ぃ繝ｳ縺ｮ髢薙↓蜍墓昭縺悟ｺ・′縺｣縺ｦ縺・ｋ・井ｺｺ豌・{sc.popDelta}・荏,
        }), scandalDelay + i * 300);
      });
    }

    // P5: 諤ｪ謌鷹屬閼ｱ荳ｭ縺ｮ莠ｺ豌嶺ｽ惹ｸ九ヨ繝ｼ繧ｹ繝・
    const pendingInjuryPopDecay = G._pendingInjuryPopDecay || null;
    if (G._pendingInjuryPopDecay) {
      const { _pendingInjuryPopDecay: _, ...cleanIpd } = G;
      G = cleanIpd;
    }
    if (pendingInjuryPopDecay && pendingInjuryPopDecay.length > 0) {
      const ipdDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 100;
      pendingInjuryPopDecay.forEach((ipd, i) => {
        setTimeout(() => showToast(`悼 ${ipd.fighterName}縺ｮ莠ｺ豌励′縺倥ｏ縺倥ｏ荳九′縺｣縺ｦ縺・ｋ窶ｦ・磯屬閼ｱ荳ｭ・荏, 5000), ipdDelay + i * 200);
      });
    }

    // O2: 繧ｬ繝ｩ繧ｬ繝ｩ闊郁｡・竊・譁ｰ閨櫁ｨ倅ｺ・
    if (G._pendingEmptyVenue) {
      const { _pendingEmptyVenue: _, ...cleanEv } = G;
      G = cleanEv;
      App._pushNewsEvent({ type: 'emptyVenue',
        data: { org: G.orgName || '縺ゅ↑縺溘・蝗｣菴・, season: G.season, week: G.week } });
    }

    // v2.0: 騾ｱ谺｡騾夂衍繧､繝吶Φ繝郁｡ｨ遉ｺ・・1縲廸5 繝医・繧ｹ繝磯夂衍・・
    const pendingNotifEvent = G._pendingNotifEvent || null;
    if (G._pendingNotifEvent) {
      const { _pendingNotifEvent: _, ...cleanNe } = G;
      G = cleanNe;
    }
    if (pendingNotifEvent) {
      const notifDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 200;
      setTimeout(() => showNotifEventToast(pendingNotifEvent), notifDelay);
    }

    // v2.0 Phase1-7: 騾・｢・メ繝ｼ繝繧ｹ繝斐Μ繝・ヨ繝舌ヵ陦ｨ遉ｺ
    const pendingTeamSpirit = G._pendingTeamSpirit || null;
    if (G._pendingTeamSpirit) {
      const { _pendingTeamSpirit: _, ...cleanTs } = G;
      G = cleanTs;
    }
    if (pendingTeamSpirit) {
      const spiritDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 350;
      setTimeout(() => showNotifEventToast(pendingTeamSpirit), spiritDelay);
    }

    // ﾂｧB-2: 遘ｻ邀阪え繧｣繝ｳ繝峨え蜑埼ｱ縺ｮ莠亥・騾夂衍
    const pendingPreWindow = G._pendingPreWindowWarning || null;
    if (G._pendingPreWindowWarning) {
      const { _pendingPreWindowWarning: _, ...cleanPw } = G;
      G = cleanPw;
    }
    if (pendingPreWindow && pendingPreWindow.length > 0) {
      const pwDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 500;
      pendingPreWindow.forEach((w, i) => {
        setTimeout(() => showNotifEventToast({
          type: 'N_pre_window',
          fighter: w.fighterId,
          text: w.text,
          detail: w.tone === 'serious'
            ? '笞・・譚･騾ｱ縺ｯ遘ｻ邀阪え繧｣繝ｳ繝峨え縺ｧ縺吶ゆｿ｡鬆ｼ繧ｱ繧｢縺ｮ譛蠕後・繝√Ε繝ｳ繧ｹ縺九ｂ縺励ｌ縺ｾ縺帙ｓ縲・
            : '早・・譚･騾ｱ縺ｯ遘ｻ邀阪え繧｣繝ｳ繝峨え縺ｧ縺吶ょ虚蜷代ｒ豕ｨ隕悶＠縺ｾ縺励ｇ縺・・,
        }), pwDelay + i * 300);
      });
    }

    // ﾂｧ2 隕ｳ蟇溽愍: 繧ｳ繝ｼ繝∝ｱ蜻奇ｼ郁ご謌千判髱｢縺ｫ繧､繝ｳ繝ｩ繧､繝ｳ陦ｨ遉ｺ逕ｨ縺ｫ菫晄戟・・
    if (G.currentCoachReport) {
      const { currentCoachReport: _, ...cleanPrev } = G;
      G = cleanPrev;
    }
    const pendingCoachReport = G._pendingCoachReport || null;
    if (G._pendingCoachReport) {
      const { _pendingCoachReport: _, ...cleanCr } = G;
      G = cleanCr;
    }
    if (pendingCoachReport) {
      G = { ...G, currentCoachReport: pendingCoachReport };
    }

    // v2.0: 騾ｱ谺｡驕ｸ謚槫梛繧､繝吶Φ繝郁｡ｨ遉ｺ・・/E蝙・繝｢繝ｼ繝繝ｫ・・
    const pendingChoiceEvent = G._pendingChoiceEvent || null;
    if (G._pendingChoiceEvent) {
      const { _pendingChoiceEvent: _, ...cleanCe } = G;
      G = cleanCe;
    }
    if (pendingChoiceEvent) {
      // 莉悶・繝昴ャ繝励い繝・・縺碁哩縺倥◆蠕後↓陦ｨ遉ｺ縺吶ｋ縺溘ａ蟆代＠驕・ｻｶ
      const choiceDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 400;
      setTimeout(() => {
        showChoiceEventModal(pendingChoiceEvent, G, (choiceIdx) => {
          if (choiceIdx >= 0) App.applyChoiceEvent(pendingChoiceEvent, choiceIdx);
        });
      }, choiceDelay);
    }

    // v2.0 Phase1-6: 螟ｧ蝙九う繝吶Φ繝郁｡ｨ遉ｺ・・1縲廝4 繝｢繝ｼ繝繝ｫ・・
    const pendingLargeEvent = G._pendingLargeEvent || null;
    if (G._pendingLargeEvent) {
      const { _pendingLargeEvent: _, ...cleanLe } = G;
      G = cleanLe;
    }
    if (pendingLargeEvent) {
      const largeDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 600;
      setTimeout(() => App.handleLargeEvent(pendingLargeEvent), largeDelay);
    }

    // Phase 3a: 豢ｾ髢･繧､繝吶Φ繝郁｡ｨ遉ｺ・・01/F02/F03 繝｢繝ｼ繝繝ｫ・・
    // 螟ｧ蝙九う繝吶Φ繝茨ｼ・1縲廝4・峨→蜷碁ｱ縺ｫ陦晉ｪ√＠縺溷ｴ蜷医・縲∵ｴｾ髢･繝｢繝ｼ繝繝ｫ繧堤ｿ碁ｱ莉･髯阪↓謖√■雜翫☆縲・
    // _pendingFactionEvent 繧・G 縺ｫ谿九＠縺ｦ縺翫￠縺ｰ縲∵ｬ｡騾ｱ縺ｮ tickWeek 豢ｾ髢･繝代う繝励Λ繧､繝ｳ縺・
    // pending 讀懃衍縺ｧ譁ｰ隕乗歓驕ｸ繧偵せ繧ｭ繝・・縺暦ｼ・rc/management.js:7456・峨∵ｬ｡騾ｱ縺ｮ陦ｨ遉ｺ繝ｫ繝ｼ繝励〒
    // 閾ｪ辟ｶ縺ｫ繝｢繝ｼ繝繝ｫ蛹悶＆繧後ｋ縲る㍾隍・ヨ繝ｪ繧ｬ繝ｼ縺ｯ逋ｺ逕溘＠縺ｪ縺・・
    const pendingFactionEvent = G._pendingFactionEvent || null;
    if (pendingFactionEvent && !pendingLargeEvent) {
      const { _pendingFactionEvent: _, ...cleanFe } = G;
      G = cleanFe;
      const factionDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 650;
      setTimeout(() => App.handleFactionEvent(pendingFactionEvent), factionDelay);
    }

    // 繧ｹ繝翫ャ繝励す繝ｧ繝・ヨ R3繝｢繝ｼ繝繝ｫ陦ｨ遉ｺ
    const pendingR3Modal = G._pendingR3Modal || null;
    if (G._pendingR3Modal) {
      const { _pendingR3Modal: _, ...cleanR3 } = G;
      G = cleanR3;
    }
    if (pendingR3Modal) {
      const r3Fighter = G.roster.find(f => f.id === pendingR3Modal.fighterId);
      const r3Delay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 700;
      setTimeout(() => {
        showR3Modal({
          fighterName: r3Fighter ? r3Fighter.name : '???',
          fighterFace: r3Fighter ? getPortraitUrl(r3Fighter.id) : null,
          departedName: pendingR3Modal.departedName || '???',
          reason: pendingR3Modal.reason || 'departed',
          line: pendingR3Modal.text,
        });
      }, r3Delay);
    }

    // P4-P6: Glimpse・亥ｿ・・蝙｣髢楢ｦ九∴・芽｡ｨ遉ｺ
    const pendingGlimpseA = G._pendingGlimpseA || null;
    if (G._pendingGlimpseA) {
      const { _pendingGlimpseA: _, ...cleanGa } = G;
      G = cleanGa;
    }
    const pendingGlimpseB = G._pendingGlimpseB || null;
    if (G._pendingGlimpseB) {
      const { _pendingGlimpseB: _, ...cleanGb } = G;
      G = cleanGb;
    }
    if (pendingGlimpseA || pendingGlimpseB) {
      const allGlimpses = [...(pendingGlimpseA || []), ...(pendingGlimpseB || [])];
      const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
      const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));
      if (tier2.length > 0) {
        G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
        refreshDojoLogFeed();
      }
      if (tier1.length > 0) {
        const glimpseDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 800;
        setTimeout(() => { tier1.forEach(g => showGlimpseAModal(g)); }, glimpseDelay);
      }
    }

    // v1.9: 騾ｸ譚千音蛻･莠､貂画棧繧｢繝ｳ繝ｭ繝・け騾夂衍
    const pendingEliteTicket = G._pendingEliteTicket || false;
    if (G._pendingEliteTicket) {
      const { _pendingEliteTicket: _, ...cleanEt } = G;
      G = cleanEt;
    }
    if (pendingEliteTicket) {
      const etDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 500;
      setTimeout(() => {
        Audio.play('fanfare');
        setTimeout(() => Audio.play('stamp'), 400);
        showEventPopup({
          type: 'system', emoji: '遵', tone: 'gold',
          message: '至 騾ｸ譚千音蛻･莠､貂画棧繧堤佐蠕暦ｼ・至',
          detail: '蝗｣菴薙・蜷榊｣ｰ縺梧･ｭ逡後↓霓溘＞縺滂ｼ―n'
                + '騾ｸ譚舌け繝ｩ繧ｹ縺ｮ驕ｸ謇九◆縺｡縺後√≠縺ｪ縺溘・蝗｣菴薙↓豕ｨ逶ｮ縺励※縺・∪縺吶・n\n'
                + '虫 FA蟶ょｴ縺ｧ騾ｸ譚舌Λ繝ｳ繧ｯ縺ｮ驕ｸ謇・蜷阪→迚ｹ蛻･縺ｫ莠､貂牙庄閭ｽ\n'
                + '竢ｳ 縺・▽縺ｧ繧ゆｽｿ逕ｨ蜿ｯ閭ｽ・域ｸｩ蟄楼K・噂n'
                + '笞・・1蝗樣剞繧・/ 雜・ｸ譚舌↓縺ｯ菴ｿ逕ｨ荳榊庄'
        });
      }, etDelay);
    }

    if (G.pendingRosterOverflowSigning) {
      const overflowDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 1100;
      App._showRosterOverflowSigningModalIfNeeded(overflowDelay);
    }

    // v1.0: Auto-advance on non-monthly weeks
    if (App._tryAutoAdvance()) return;
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
    if (isShowWeek(G.week) && (isSpecialShow(G.week) || isPPV(G.week))) {
      const msg = isPPV(G.week) ? '醇 莉企ｱ縺ｯPPV GRAND FINAL・∝ｹｴ髢捺怙螟ｧ縺ｮ闊槫床縺ｧ縺呻ｼ・ : '箝・莉企ｱ縺ｯ譛域忰迚ｹ蛻･闊郁｡鯉ｼ∬ｩｦ蜷域棧+1縺ｧ邨・ａ繧具ｼ・;
      setTimeout(() => showToast(msg, 7000), 300);
    }
  },

  // Advance to next week via Engine
  advanceCurrentFlow() {
    if (G.weekPhase === 'manage') {
      App.processWeek();
      return;
    }
    if (G.weekPhase === 'weekSummary') {
      App.advanceFromWeekSummary();
      return;
    }
    if (G.weekPhase === 'contractNegotiation') {
      App.handleContractNegotiations();
      return;
    }
    if (G.offSeason || G.weekPhase === 'offseason' || G.weekPhase === 'settled') {
      App.advanceWeek();
      return;
    }
    Audio.play('error');
  },

  advanceWeek() {
    Audio.play('tick');
    dismissAllPopups(); // 谿句ｭ倥・繝・・繧｢繝・・繧貞ｼｷ蛻ｶ繧ｯ繝ｪ繧｢
    const result = Engine.advanceWeek(G);
    G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
    // 笏笏 菴馴ｨ鍋沿繧ｷ繝ｼ繧ｺ繝ｳ繧ｲ繝ｼ繝・笏笏
    if (G._trialEnd) {
      const { _trialEnd: _, ...cleanG } = G;
      G = cleanG;
      Storage.autoSave();
      showTrialEndMessage();
      refreshAll();
      return;
    }
    // 螂醍ｴ・峩譁ｰ莠､貂峨ヵ繧ｧ繝ｼ繧ｺ
    if (G.weekPhase === 'contractNegotiation') {
      Storage.autoSave();
      App.handleContractNegotiations();
      return;
    }
    // PPV Week 48: PPV繝輔ぉ繝ｼ繧ｺ縺ｫ蜈･縺｣縺溷ｴ蜷医・蟆ら畑繝輔Ο繝ｼ縺ｸ
    if (G.weekPhase === 'ppvShow') {
      Storage.autoSave();
      App.initPPVShow();
      return;
    }
    if (G.weekPhase === 'ppvTV') {
      Storage.autoSave();
      App.initPPVTV();
      return;
    }
    // 繧ｸ繝･繝九い繝医・繝翫Γ繝ｳ繝・Week 25
    if (G.weekPhase === 'juniorTournament') {
      Storage.autoSave();
      App.initJuniorTournament();
      return;
    }
    // v0.97: Update survival gauge
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    sessionRng = Engine.rng.create(G.rngSeed);

    // v1.4w: 莠､貂画・蜉滓凾縺ｮ譁ｰ閨槭う繝吶Φ繝・
    if (G.negotiationResult && G.negotiationResult.success && G.negotiationResult.fighter && !(G.pendingRosterOverflowSigning && G.pendingRosterOverflowSigning.source === 'negotiation')) {
      const nf = G.negotiationResult.fighter;
      const fromOrg = (G.transferLog || []).slice(-1)[0];
      App._pushNewsEvent({ type: 'poachSuccess', characterId: nf.id,
        data: { name: nf.name, toOrg: G.orgName || '縺ゅ↑縺溘・蝗｣菴・,
          fromOrg: fromOrg ? fromOrg.from : '莉門屮菴・,
          ovr: Engine.util.ov(nf) } });
    }
    // v1.4w: 繝・ぅ繝・き繝ｼ譖ｴ譁ｰ
    App._refreshTicker();

    // v1.3-3: Extract pending retirements before save (transient field)
    const pendingRetirements = G.pendingRetirements || null;
    if (pendingRetirements) {
      const { pendingRetirements: _, ...cleanG } = G;
      G = cleanG;
    }

    Storage.autoSave();
    Audio.bgm.playForState(); // BGM: switch on season transitions

    // v1.3-3: Show retirement popups (season-end)
    // 蠑暮縺ｯ蠑輔″逡吶ａ繝繧､繧｢繝ｭ繧ｰ縺ｧ豎ｺ譁ｭ蠕後↓ commit 縺吶ｋ・医ム繧､繧｢繝ｭ繧ｰ蜑阪・ roster/titles/HoF 繧貞､画峩縺励↑縺・ｼ・
    if (pendingRetirements && pendingRetirements.length > 0) {
      App._retainedIds = new Set();
      refreshAll();
      showRetirementPopups(pendingRetirements, () => {
        const retained = App._retainedIds || new Set();
        const confirmed = pendingRetirements
          .filter(r => !retained.has(r.fighter.id))
          .map(r => r.fighter);
        if (confirmed.length > 0) {
          const result = Engine.retirement.commitRetirements(G, confirmed);
          G = result.state;
          if (result.events && result.events.length > 0) {
            G = { ...G, gameLog: [...(G.gameLog || []), ...result.events] };
          }
          confirmed.forEach(f => { G = archiveRetiredRivalryState(G, f); });
          (result.newsItems || []).forEach(n => App._pushNewsEvent(n));
          Storage.autoSave();
          refreshAll();
        }
        App._retainedIds = null;
        App._safeAwardsChain();
      });
      return;
    }

    // v1.8: AI謌宣聞繧､繝吶Φ繝郁у螽・螂ｽ讖溘い繝ｩ繝ｼ繝茨ｼ郁｡ｨ蠖ｰ蠑上・蜑阪↓陦ｨ遉ｺ・・
    const aiAlerts = G._pendingAIGrowthAlerts || [];
    if (G._pendingAIGrowthAlerts) {
      const { _pendingAIGrowthAlerts: _, ...cleanAI } = G;
      G = cleanAI;
    }

    // v1.4w: AI謌宣聞繧､繝吶Φ繝医・譁ｰ閨槭う繝吶Φ繝亥庶髮・
    aiAlerts.forEach(alert => {
      if (alert.type === 'breakthrough') {
        const orgName = alert.org ? alert.org.name : '莉門屮菴・;
        App._pushNewsEvent({ type: 'breakthrough', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName,
            detail: `${(alert.stat || '').toUpperCase()} +${parseFloat((+(alert.gain||0)).toFixed(1))}` } });
      } else if (alert.type === 'slump') {
        const orgName = alert.org ? alert.org.name : '莉門屮菴・;
        App._pushNewsEvent({ type: 'slump', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName } });
      } else if (alert.type === 'motivation_loss') {
        const orgName = alert.org ? alert.org.name : '莉門屮菴・;
        App._pushNewsEvent({ type: 'motivationLoss', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName } });
      }
    });

    if (aiAlerts.length > 0) {
      showAIGrowthAlerts(aiAlerts, () => App._safeAwardsChain());
    } else {
      // v1.4: 蠑暮閠・↑縺励〒繧よ眠閨槭ヱ繝阪Ν竊偵お繝ｳ繝・ぅ繝ｳ繧ｰ繝√ぉ繝・け竊定｡ｨ蠖ｰ蠑上メ繧ｧ繝・け
      App._safeAwardsChain();
    }
  },

  // 陦ｨ蠖ｰ蠑上メ繧ｧ繝ｼ繝ｳ螳牙・螳溯｡・ 荳ｭ髢薙せ繝・ャ繝励・繧ｨ繝ｩ繝ｼ縺ｧ陦ｨ蠖ｰ蠑上′豸亥､ｱ縺励↑縺・ｈ縺・亟蠕｡
  _recoverPendingAwards() {
    if (G.pendingAwards) return true;
    if (!G.offSeason || G.offWeek !== 1) return false;
    if (!Array.isArray(G.seasonHistory) || G.seasonHistory.length === 0) return false;
    try {
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xA11D));
      const pendingAwards = Engine.awards.generate(rng, G);
      G = { ...G, pendingAwards, gameLog: [...(G.gameLog || []), '屏 蟷ｴ譛ｫ陦ｨ蠖ｰ繝・・繧ｿ繧貞ｾｩ譌ｧ縺励∪縺励◆'] };
      Storage.autoSave();
      return true;
    } catch (e) {
      console.error('[WM] pendingAwards recovery failed:', e);
      return false;
    }
  },

  _safeAwardsChain() {
    const awardsCallback = () => {
      try {
        App._recoverPendingAwards();
        App._checkAndShowAwards();
      }
      catch (e) { console.error('[WM] _checkAndShowAwards error:', e); try { refreshAll(); } catch (_) {} }
    };
    const endingCallback = () => {
      try { App._checkAndShowEnding(awardsCallback); }
      catch (e) { console.error('[WM] _checkAndShowEnding error:', e); awardsCallback(); }
    };
    try { App._showNewsPanelIfNeeded(endingCallback); }
    catch (e) { console.error('[WM] _showNewsPanelIfNeeded error:', e); endingCallback(); }
  },

  // v1.9: 譁ｰ繧ｷ繝ｼ繧ｺ繝ｳ髢句ｹ輔ヵ繧｡繝ｳ繝輔ぃ繝ｼ繝ｬ縺ｮ繝医Μ繧ｬ繝ｼ蛻､螳・
  _maybeShowSeasonFanfare(callback) {
    if (G.week === 1 && !G.offSeason && G.season > 1 && typeof showSeasonFanfare === 'function') {
      showSeasonFanfare(G.season, callback);
    } else {
      callback();
    }
  },

  // v2.1: 繧ｨ繝ｳ繝・ぅ繝ｳ繧ｰ貍泌・繝√ぉ繝・け・亥・繧ｯ繝ｪ繧｢譎ゅ・縺ｿ縲・蝗樣剞繧奇ｼ・
  _checkAndShowEnding(onDone) {
    // 讌ｭ逡悟ｺ穂ｸ翫￡貍泌・繧偵メ繧ｧ繝ｼ繝ｳ縺吶ｋ蜀・Κ髢｢謨ｰ
    const checkElevation = () => {
      if (G._pendingLeagueElevation) {
        const { _pendingLeagueElevation: _, ...cleanG } = G;
        G = cleanG;
        showLeagueElevationCeremony(G, onDone);
      } else {
        onDone();
      }
    };
    if (G.endingCleared && G.endingClearedSeason === G.season - 1 && !G.endingShown) {
      G = { ...G, endingShown: true };
      const data = Engine.ending.buildClearData(G);
      showEndingCeremony(data, checkElevation);
    } else {
      checkElevation();
    }
  },

  // v1.4: 蟷ｴ譛ｫ陦ｨ蠖ｰ蠑上メ繧ｧ繝・け・・｡ｨ遉ｺ
  _checkAndShowAwards() {
    const pendingAwards = G.pendingAwards;
    if (!pendingAwards) { App._checkAndShowMilestone(() => App._maybeShowSeasonFanfare(() => refreshAll())); return; }
    // pendingAwards 縺ｯ transient field 窶・菫晏ｭ伜燕縺ｫ繧ｯ繝ｪ繝ｼ繝ｳ
    const { pendingAwards: _, ...cleanG } = G;
    G = cleanG;

    // 蜿苓ｳ樊ｭｴ繧偵く繝｣繝ｪ繧｢險倬鹸縺ｫ霑ｽ蜉・医・繝ｬ繧､繝､繝ｼ蝗｣菴薙・NPC蝗｣菴薙→繧ゅ↓・・
    {
      const aSeason = pendingAwards.season || G.season;
      const aWeek = 49; // 繧ｪ繝輔す繝ｼ繧ｺ繝ｳ陦ｨ蠖ｰ蠑・

      // 莉ｻ諢上・驕ｸ謇九・繝ｼ繝ｫ縺ｫ蟇ｾ縺励※ id 荳閾ｴ縺ｧ addEvent 縺吶ｋ繝倥Ν繝代・
      const applyToPool = (pool, predicate, ev) =>
        pool.map(f => predicate(f) ? Engine.career.addEvent(f, ev) : f);

      let ar = G.roster;
      let aiOrgs = G.aiOrgs ? { ...G.aiOrgs } : null;

      const recordOnAllOrgs = (predicate, ev) => {
        ar = applyToPool(ar, predicate, ev);
        if (aiOrgs) {
          Object.keys(aiOrgs).forEach(oid => {
            const od = aiOrgs[oid];
            if (od && od.roster) {
              aiOrgs[oid] = { ...od, roster: applyToPool(od.roster, predicate, ev) };
            }
          });
        }
      };

      // 笏笏 繝励Ξ繧､繝､繝ｼ蝗｣菴薙・繧薙・繧ｰ繝ｭ繝ｼ繝舌Ν蜿苓ｳ・笏笏
      if (pendingAwards.rookieOfYear) {
        const w = pendingAwards.rookieOfYear;
        recordOnAllOrgs(f => f.id === w.id,
          { type: 'awardRookie', season: aSeason, week: aWeek, orgName: w.orgName });
      }
      if (pendingAwards.mvp) {
        const w = pendingAwards.mvp;
        recordOnAllOrgs(f => f.id === w.id,
          { type: 'awardMVP', season: aSeason, week: aWeek, orgName: w.orgName });
      }
      if (pendingAwards.mediaAward) {
        const w = pendingAwards.mediaAward;
        recordOnAllOrgs(f => f.id === w.id,
          { type: 'awardMedia', season: aSeason, week: aWeek, orgName: w.orgName });
      }
      if (pendingAwards.bestMatch) {
        const bm = pendingAwards.bestMatch;
        const bmIds = new Set();
        if (bm.fighter1 && bm.fighter1.id) bmIds.add(bm.fighter1.id);
        if (bm.fighter2 && bm.fighter2.id) bmIds.add(bm.fighter2.id);
        if (bmIds.size > 0) {
          recordOnAllOrgs(f => bmIds.has(f.id),
            { type: 'awardBestMatch', season: aSeason, week: aWeek, mq: bm.mq, orgName: bm.orgName });
        }
      }

      // 笏笏 NPC蝗｣菴薙＃縺ｨ縺ｮ蜀・Κ陦ｨ蠖ｰ・医・繝ｬ繧､繝､繝ｼ縺ｫ縺ｯ陦ｨ遉ｺ縺輔ｌ縺ｪ縺・′螻･豁ｴ縺ｫ縺ｯ谿九ｋ・・笏笏
      const npcAwards = pendingAwards.npcAwards || {};
      Object.keys(npcAwards).forEach(orgId => {
        const a = npcAwards[orgId];
        if (!a) return;
        if (a.rookie && a.rookie.id) {
          recordOnAllOrgs(f => f.id === a.rookie.id,
            { type: 'awardRookie', season: aSeason, week: aWeek, orgName: a.orgName });
        }
        if (a.mvp && a.mvp.id) {
          recordOnAllOrgs(f => f.id === a.mvp.id,
            { type: 'awardMVP', season: aSeason, week: aWeek, orgName: a.orgName });
        }
        if (a.bestMatch) {
          const bmIds = new Set();
          if (a.bestMatch.fighter1 && a.bestMatch.fighter1.id) bmIds.add(a.bestMatch.fighter1.id);
          if (a.bestMatch.fighter2 && a.bestMatch.fighter2.id) bmIds.add(a.bestMatch.fighter2.id);
          if (bmIds.size > 0) {
            recordOnAllOrgs(f => bmIds.has(f.id),
              { type: 'awardBestMatch', season: aSeason, week: aWeek, mq: a.bestMatch.mq, orgName: a.orgName });
          }
        }
      });

      G = { ...G, roster: ar };
      if (aiOrgs) G = { ...G, aiOrgs };
    }

    // Phase 4 E-05: 陦ｨ蠖ｰ蠑上・髢｢菫ょ､蜿肴丐
    if (G.relationships) {
      const awardRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBE5B));
      let relState = { ...G };
      const rosterIds = (G.roster || []).filter(f => !f.isRental).map(f => f.id);
      // 蜷・ｳ槭・蜿苓ｳ櫁・ｼ医・繝ｬ繧､繝､繝ｼ蝗｣菴捺園螻槭・縺ｿ・峨↓蟇ｾ縺励※髢｢菫ょ､繧帝←逕ｨ
      const awardWinners = [];
      if (pendingAwards.rookieOfYear && pendingAwards.rookieOfYear.isPlayerOrg) {
        awardWinners.push(pendingAwards.rookieOfYear.id);
      }
      if (pendingAwards.mvp && pendingAwards.mvp.isPlayerOrg) {
        awardWinners.push(pendingAwards.mvp.fighter ? pendingAwards.mvp.fighter.id : pendingAwards.mvp.id);
      }
      for (const winnerId of awardWinners) {
        if (!winnerId || !rosterIds.includes(winnerId)) continue;
        const otherIds = rosterIds.filter(id => id !== winnerId);
        if (otherIds.length === 0) continue;
        // winner竊池oster: bond +2~+3
        relState = Engine.relationships.applyToRoster(relState, winnerId, otherIds,
          { min: 2, max: 3 }, { min: 0, max: 0 }, awardRelRng);
        // roster竊蜘inner: bond +1~+2
        relState = Engine.relationships.applyFromRoster(relState, otherIds, winnerId,
          { min: 1, max: 2 }, { min: 0, max: 0 }, awardRelRng);
        // OVR霑第磁閠・diff竕､5)竊蜘inner: rivalry +2~+4
        const winnerFighter = (G.roster || []).find(f => f.id === winnerId);
        if (winnerFighter) {
          const winnerOvr = Engine.util.ov(winnerFighter);
          const closeIds = (G.roster || []).filter(f =>
            f.id !== winnerId && !f.isRental && Math.abs(Engine.util.ov(f) - winnerOvr) <= 5
          ).map(f => f.id);
          if (closeIds.length > 0) {
            relState = Engine.relationships.applyFromRoster(relState, closeIds, winnerId,
              { min: 0, max: 0 }, { min: 2, max: 4 }, awardRelRng);
          }
        }
      }
      G = { ...G, relationships: relState.relationships };
    }
    Storage.autoSave();
    refreshAll();
    // 蠑輔″豁｢繧∵・蜉溘〒roster縺ｫ謌ｻ縺｣縺滄∈謇九ｒ谿ｿ蝣ょ・繧雁呵｣懊°繧蛾勁螟・
    const rosterIds = new Set(G.roster.map(c => c.id));
    pendingAwards.hallOfFame = (pendingAwards.hallOfFame || []).filter(h => !rosterIds.has(h.id));
    // v1.4w: 谿ｿ蝣ょ・繧翫・譁ｰ閨槭う繝吶Φ繝亥庶髮・
    if (pendingAwards.hallOfFame.length > 0) {
      pendingAwards.hallOfFame.forEach(h => {
        App._pushNewsEvent({ type: 'hallOfFame', characterId: h.id,
          data: { name: h.name, titles: h.titleReigns || 0, defenses: h.totalDefenses || 0 } });
      });
    }
    // 陦ｨ蠖ｰ蠑上・繝・・繧｢繝・・髢句ｧ・
    try { Audio.fileBgm.play('../bgm/8bit-ending-theme_Loop.ogg', { loop: true, volume: 0.07 }); } catch(e) {}
    showAwardsCeremony(pendingAwards, () => {
      try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
      // 陦ｨ蠖ｰ蠑州GM繝輔ぉ繝ｼ繝峨い繧ｦ繝亥ｾ後↓騾壼ｸｸBGM繧貞・髢・
      App.restoreBgmForState(1600);
      // 陦ｨ蠖ｰ蠑丞ｮ御ｺ・ｾ・ 谿ｿ蝣ょ・繧雁・逅・+ retiredFighters 貂・祉
      if (pendingAwards.hallOfFame.length > 0) {
        G = Engine.awards.applyHallOfFame(G, pendingAwards.hallOfFame);
      } else {
        G = { ...G, retiredFighters: [] };
      }
      G = { ...G, lastAwards: pendingAwards };
      Storage.autoSave();
      App._showNewsPanelIfNeeded(() => App._checkAndShowMilestone(() => App._maybeShowSeasonFanfare(() => refreshAll())));
    });
  },

  // v1.5s25b: 繝槭う繝ｫ繧ｹ繝医・繝ｳ讀懷・
  _checkMilestones() {
    const ms = G.milestones || {};
    for (const evt of MILESTONE_EVENTS) {
      if (ms[evt.id]) continue;
      let triggered = false;
      switch (evt.trigger.type) {
        case 'totalShows':
          triggered = (G.totalShows || 0) >= evt.trigger.value;
          break;
        case 'orgPop':
          triggered = Engine.util.dispOrgPop(G.orgPop) >= evt.trigger.value;
          break;
        case 'first_rivalry':
          triggered = Object.keys(G.rivalries || {}).length > 0;
          break;
        case 'venue':
          if (evt.trigger.timing === 'preShow') break; // preShow繝輔ャ繧ｯ縺ｧ蜃ｦ逅・
          triggered = (G.showVenue === evt.trigger.venueIdx);
          break;
        case 'venue_occupancy': {
          if (evt.trigger.timing === 'preShow') break;
          const t = evt.trigger;
          const cap = VENUES[t.venueIdx]?.cap;
          const occ = cap ? (G.lastShowAttendance || 0) / cap : 0;
          triggered = (G.showVenue === t.venueIdx) && (occ >= t.minOccupancy);
          break;
        }
      }
      if (triggered) return evt;
    }
    return null;
  },

  // D螻､: 闊郁｡悟燕繝槭う繝ｫ繧ｹ繝医・繝ｳ繝√ぉ繝・け・・reShow timing 縺ｮ縺ｿ蟇ｾ雎｡・・
  _checkAndShowPreShowMilestone(onDone) {
    const ms = G.milestones || {};
    for (const evt of MILESTONE_EVENTS) {
      if (evt.trigger.timing !== 'preShow') continue;
      if (ms[evt.id]) continue;
      let triggered = false;
      switch (evt.trigger.type) {
        case 'venue':
          triggered = (G.showVenue === evt.trigger.venueIdx);
          break;
      }
      if (!triggered) continue;
      G = { ...G, milestones: { ...(G.milestones || {}), [evt.id]: true } };
      const speakers = App._resolveSpotlightFighters(G);
      showCeremonyEvent(evt, speakers, onDone);
      return;
    }
    onDone();
  },

  // v1.5s25b: 繝槭う繝ｫ繧ｹ繝医・繝ｳ繝√ぉ繝・け竊旦I竊帝←逕ｨ縺ｮ繝輔Ο繝ｼ
  _checkAndShowMilestone(onDone) {
    const evt = App._checkMilestones();
    if (!evt) { onDone(); return; }
    // D螻､繧､繝吶Φ繝茨ｼ・hoices 縺ｪ縺暦ｼ峨・繧ｻ繝ｬ繝｢繝九・貍泌・
    if (!evt.choices || evt.choices.length === 0) {
      G = { ...G, milestones: { ...(G.milestones || {}), [evt.id]: true } };
      const speakers = App._resolveSpotlightFighters(G);
      showCeremonyEvent(evt, speakers, onDone);
      return;
    }
    // first_rivalry 縺ｯ繝翫Ξ繝ｼ繧ｷ繝ｧ繝ｳ蜍慕噪逕滓・
    let displayEvt = evt;
    if (evt.id === 'first_rivalry' && !evt.narration) {
      const rivalryKeys = Object.keys(G.rivalries || {});
      if (rivalryKeys.length > 0) {
        const key = rivalryKeys[0];
        const [id1, id2] = key.split('-').map(Number);
        const c1 = G.roster.find(c => c.id === id1);
        const c2 = G.roster.find(c => c.id === id2);
        const n1 = c1?.name || '???';
        const n2 = c2?.name || '???';
        displayEvt = { ...evt,
          narration: `${n1}縺ｨ${n2}窶披能n繝ｪ繝ｳ繧ｰ荳翫〒菴募ｺｦ繧ら↓闃ｱ繧呈淵繧峨＠縺溘・縺溘ｊ縺ｮ髢薙↓縲―n迚ｹ蛻･縺ｪ遨ｺ豌励′貍ゅ＞蟋九ａ縺ｦ縺・ｋ縲・n縺薙・蝗邵√√←縺・ｴｻ縺九＠縺ｦ縺・￥縺銀披覗,
          choices: evt.choices.map((ch, i) => {
            if (i === 1 && ch.effect.type === 'next_match_mq') {
              return { ...ch, effect: { ...ch.effect, pair: [id1, id2] } };
            }
            return ch;
          })
        };
      }
    }
    Audio.play('event');
    showMilestoneEvent(displayEvt, (choiceIdx) => {
      App._applyMilestoneChoice(displayEvt, choiceIdx);
      onDone();
    });
  },

  // D螻､: 繝｡繧､繝ｳ繧､繝吶Φ繝・蜷・+ 繝ｭ繧ｹ繧ｿ繝ｼpop譛螟ｧ縺ｮ繝吶ユ繝ｩ繝ｳ莉｣陦ｨ繧帝∈蜃ｺ
  _resolveSpotlightFighters(G) {
    const mainCard = G.showCard?.[0];
    if (!mainCard) return [];
    const mainLeftId = mainCard.left;
    const mainRightId = mainCard.right;
    const mainLeft = G.roster.find(f => f.id === mainLeftId);
    const mainRight = G.roster.find(f => f.id === mainRightId);
    const veteran = G.roster
      .filter(f => f.id !== mainLeftId && f.id !== mainRightId
        && f.status !== 'retired' && !f.isRental)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0))[0];
    return [
      mainLeft  ? { fighter: mainLeft,  roleLabel: 'MAIN EVENT 繝ｻ 襍､繧ｳ繝ｼ繝翫・' } : null,
      mainRight ? { fighter: mainRight, roleLabel: 'MAIN EVENT 繝ｻ 髱偵さ繝ｼ繝翫・' } : null,
      veteran   ? { fighter: veteran,   roleLabel: 'VETERAN 繝ｻ 繝ｭ繝・き繝ｼ繝ｫ繝ｼ繝莉｣陦ｨ' } : null
    ].filter(Boolean);
  },

  // D螻､: personalityﾃ預rchetype縺九ｉ繝峨・繝繧ｻ繝ｪ繝輔ｒ豎ｺ螳夊ｫ也噪縺ｫ驕ｸ蜃ｺ・・NG繧ｷ繝ｼ繝牙茜逕ｨ・・
  resolveDomeLine(fighter, dialogueKey) {
    const dict = dialogueKey === 'dome_firstshow' ? DOME_FIRSTSHOW_LINES : DOME_SELLOUT_LINES;
    const p = fighter.personality || 'normal';
    const a = fighter.archetype || 'normal';
    const personaDict = dict[p] || dict['normal'];
    const archetypeKey = (a === 'normal') ? '_default' : a;
    const lines = personaDict?.[archetypeKey] || personaDict?.['_default'] || dict['normal']['_default'];
    const seed = Engine.rng.derive(G.rngSeed, G.season, G.week, 0xD03E, fighter.id);
    const rng = Engine.rng.create(seed);
    const idx = Math.floor(Engine.rng.float(rng) * lines.length);
    return lines[idx];
  },

  // v1.5s25b: 繝槭う繝ｫ繧ｹ繝医・繝ｳ驕ｸ謚櫁い縺ｮ蜉ｹ譫憺←逕ｨ
  _applyMilestoneChoice(evt, choiceIdx) {
    const choice = evt.choices[choiceIdx];
    const eff = choice.effect;
    const buff = { ...eff, source: evt.id };

    // 騾ｱ繧ｫ繧ｦ繝ｳ繝育ｳｻ
    if (eff.weeks) buff.remainingWeeks = eff.weeks;
    // 闊郁｡後き繧ｦ繝ｳ繝育ｳｻ
    if (eff.shows) buff.remainingShows = eff.shows;

    // 蜊ｳ譎ょ柑譫・ rivalry_boost 窶・蝗邵√き繧ｦ繝ｳ繝医ｒ蜊ｳ譎・1
    if (eff.type === 'rivalry_boost') {
      const rivalryKeys = Object.keys(G.rivalries || {});
      if (rivalryKeys.length > 0) {
        const key = rivalryKeys[0];
        const oldEntry = G.rivalries[key];
        const newRivalries = { ...G.rivalries, [key]: { ...oldEntry, matches: oldEntry.matches + eff.amount } };
        G = { ...G, rivalries: newRivalries };
      }
    }

    G = {
      ...G,
      milestones: { ...G.milestones, [evt.id]: true },
      milestoneBuffs: [...(G.milestoneBuffs || []), buff]
    };
    Storage.autoSave();
  },

  // v1.5s25b: milestoneBuffs 縺ｮ騾ｱ繧ｫ繧ｦ繝ｳ繝医ム繧ｦ繝ｳ・域ｯ朱ｱprocessWeek蠕後↓蜻ｼ縺ｶ・・
  _tickMilestoneBuffsWeekly() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const newBuffs = G.milestoneBuffs
      .map(b => b.remainingWeeks != null ? { ...b, remainingWeeks: b.remainingWeeks - 1 } : b)
      .filter(b => b.remainingWeeks == null || b.remainingWeeks > 0);
    G = { ...G, milestoneBuffs: newBuffs };
  },

  // v1.5s25b: milestoneBuffs 縺ｮ闊郁｡後き繧ｦ繝ｳ繝医ム繧ｦ繝ｳ・郁・陦悟ｾ後↓蜻ｼ縺ｶ・・
  _tickMilestoneBuffsShow() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const newBuffs = G.milestoneBuffs
      .map(b => b.remainingShows != null ? { ...b, remainingShows: b.remainingShows - 1 } : b)
      .filter(b => b.remainingShows == null || b.remainingShows > 0);
    G = { ...G, milestoneBuffs: newBuffs };
  },

  // v1.5s25b: weekly_funds 繝舌ヵ縺ｮ雉・≡驕ｩ逕ｨ・域ｯ朱ｱprocessWeek/closeShowResult蠕後↓蜻ｼ縺ｶ・・
  _applyWeeklyBuffEffects() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const weeklyFundsBuff = G.milestoneBuffs.find(b => b.type === 'weekly_funds');
    if (weeklyFundsBuff) {
      const amount = weeklyFundsBuff.amount || 0;
      G = { ...G, funds: G.funds + amount };
    }
  },

  // v2.0: 驕ｸ謚槫梛繧､繝吶Φ繝医・驕ｸ謚樒ｵ先棡繧帝←逕ｨ
  applyChoiceEvent(event, choiceIdx) {
    const result = Engine.eventSystem.applyChoiceEffect(event, choiceIdx, G);
    // ﾂｧ13.3: __orgPop: 繧､繝吶Φ繝医°繧頴rgPop螟牙虚繧呈歓蜃ｺ縺励※驕ｩ逕ｨ
    let orgPopDelta = 0;
    const displayEvents = [];
    (result.events || []).forEach(e => {
      if (typeof e === 'string' && e.startsWith('__orgPop:')) {
        orgPopDelta += parseFloat(e.replace('__orgPop:', ''));
      } else {
        displayEvents.push(e);
      }
    });
    // orgPop螟牙虚縺後≠繧後・繝ｭ繧ｰ縺ｫ險倬鹸・・_orgPop:縺ｯdisplayEvents縺九ｉ髯､螟悶＆繧後ｋ縺溘ａ縲√Ο繧ｰ縺ｫ繧よｮ九ｉ縺ｪ縺九▲縺滂ｼ・
    if (orgPopDelta !== 0) {
      displayEvents.push(`悼 蝗｣菴謎ｺｺ豌・{orgPopDelta >= 0 ? '+' : ''}${Math.round(orgPopDelta * 100) / 100}`);
    }
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      orgPop: Engine.util.clamp((G.orgPop || 0) + orgPopDelta, 0, 100),
      gameLog: [...(G.gameLog || []), ...displayEvents]
    };
    // 謾ｾ蜃ｺ縺輔ｌ縺滄∈謇九ｒFA/dormant縺ｫ謖ｯ繧雁・縺・
    if (result.departedFighters && result.departedFighters.length > 0) {
      for (const departed of result.departedFighters) {
        // orgTimeline險倬鹸
        const tracked = Engine.orgTimeline.transfer(departed, 'fa', G.season, G.week);
        // 騾蝗｣bond/rivalry蠖ｱ髻ｿ
        Engine.relationships.applyDepartureTrustImpact(G, departed.id, 'release', {});
        if (Engine.util.canAddToFA(G)) {
          G = { ...G, freeAgents: [...(G.freeAgents || []), tracked] };
        } else {
          G = Engine.util.redirectToDormantPool(G, tracked);
        }
      }
      // 邇玖・′謾ｾ蜃ｺ/騾蝗｣縺励◆蝣ｴ蜷医・邇句ｺｧ繧堤ｩｺ菴阪↓縺吶ｋ
      const vcCE = Engine.title.validateChampion(G);
      if (vcCE.msg) { G = { ...G, titles: vcCE.titles, gameLog: [...(G.gameLog || []), vcCE.msg] }; }
    }
    Storage.autoSave();
    Audio.play('event');
    renderWeekScreen();
    // 邨先棡繧偵Δ繝ｼ繝繝ｫ縺ｧ陦ｨ遉ｺ・・oast縺ｧ縺ｯ縺ｪ縺擾ｼ・
    if (displayEvents.length > 0) {
      showChoiceEventResult(event, displayEvents, G);
    }
  },

  // v2.0 Phase1-6: 螟ｧ蝙九う繝吶Φ繝・I繝輔Ο繝ｼ蛻ｶ蠕｡
  handleLargeEvent(event) {
    // Step 0: 蛻晄悄陦ｨ遉ｺ
    showLargeEventModal(event, G, 0, (choiceIdx) => {
      if (choiceIdx < 0) return;
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B2));
      const result = Engine.eventSystem.applyLargeEventEffect(event, 0, choiceIdx, G, rng);
      App._applyLargeEventResult(result);

      // B4繧ｿ繝ｬ繝ｳ繝域ｴｻ蜍・/ 繝｡繝・ぅ繧｢蟇・捩蜿匁攝: 驕ｸ謇矩∈謚槫ｾ後↓繧ｻ繝ｪ繝輔・繝・・繧｢繝・・陦ｨ遉ｺ
      // choiceIdx 縺ｯ驕ｸ繧薙□驕ｸ謇紀D(>0)縲ＨetLargeEventDialogue 縺ｯ event.activityType 繧定ｦ九※
      // B4_{activityType} 繧ｭ繝ｼ繧貞・驛ｨ縺ｧ隗｣豎ｺ縺吶ｋ縺溘ａ縲》ype 荳頑嶌縺阪・荳崎ｦ√・
      if (event.type === 'B4' && choiceIdx > 0) {
        const selectedFighter = G.roster.find(f => f.id === choiceIdx);
        if (selectedFighter) {
          const dlgRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB4D1));
          const dlgEvent = { ...event, fighter: choiceIdx };
          let dialogue = Engine.eventSystem.getLargeEventDialogue(dlgRng, dlgEvent, G.roster);
          // 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ: activityType 蛻･繧ｭ繝ｼ縺ｧ蜿悶ｌ縺ｪ縺九▲縺溷ｴ蜷医・邏縺ｮ B4 繧定ｩｦ縺・
          if (!dialogue && event.activityType) {
            dialogue = Engine.eventSystem.getLargeEventDialogue(dlgRng, { ...event, fighter: choiceIdx, activityType: undefined }, G.roster);
          }
          if (!dialogue) dialogue = '窶ｦ邊ｾ荳譚ｯ繧・ｊ縺ｾ縺・;
          const activityLabel = (typeof TALENT_ACTIVITY_LABELS !== 'undefined' && event.activityType)
            ? (TALENT_ACTIVITY_LABELS[event.activityType] || '繧ｿ繝ｬ繝ｳ繝域ｴｻ蜍・)
            : '蟇・捩蜿匁攝';
          // closeAndChoice 逶ｴ蠕後・ overlay 繧ｯ繝ｭ繝ｼ繧ｺ螳御ｺ・ｒ遒ｺ螳溘↓縺励※縺九ｉ陦ｨ遉ｺ
          setTimeout(() => showEventPopup({
            type: 'fighter', id: selectedFighter.id, name: selectedFighter.name,
            tone: 'gold', message: dialogue,
            detail: `銅 ${event.outletName || '繝｡繝・ぅ繧｢'}繝ｻ${activityLabel}`,
          }), 250);
        }
      }

      if (result.nextStep === 1) {
        // B2: 莉句・驕ｸ謚・/ B3: 莉｣陦ｨ驕ｸ謇矩∈謚・
        setTimeout(() => {
          showLargeEventModal(event, G, 1, (choiceIdx2) => {
            if (choiceIdx2 < 0) return;
            const rng2 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B3));
            const result2 = Engine.eventSystem.applyLargeEventEffect(event, 1, choiceIdx2, G, rng2);
            App._applyLargeEventResult(result2);

            if (result2.nextStep === 2) {
              // B2: 隧ｦ蜷医す繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ / B3: 隧ｦ蜷医す繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
              setTimeout(() => App._executeLargeEventMatch(event, result2), 300);
            }
          });
        }, 300);
      }
    });
  },

  // Phase 3a: 豢ｾ髢･繧､繝吶Φ繝・I繝輔Ο繝ｼ蛻ｶ蠕｡・・01/F02/F03・・
  handleFactionEvent(event) {
    const { eventId, payload } = event;
    // 邨先棡繝｢繝ｼ繝繝ｫ縲碁哩縺倥ｋ縲肴凾縺ｫ stinger + BGM fadeOut + 騾壼ｸｸ BGM 蠕ｩ蟶ｰ
    const finalizeAudio = () => _factionAudioClose(eventId);
    if (eventId === 'F01') {
      _factionAudioOpen(eventId);
      showFactionF01Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA13));
        const result = Engine.factions.applyF01Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 讌ｭ逡後ル繝･繝ｼ繧ｹ: 豢ｾ髢･謌千ｫ具ｼ・=譌玲恕縺・ C=髱呵ｦｳ縺ｧ邨先・・・
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionFormed',
            characterId: payload.leaderId,
            data: { org: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・, leaderName: payload.leaderName || '?' },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'F01',
          category: '豢ｾ髢･謌千ｫ・,
          resultText: result.resultText,
          charId: payload.leaderId,
          charName: leader ? leader.name : payload.leaderName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02') {
      _factionAudioOpen(eventId);
      showFactionF02Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA23));
        const result = Engine.factions.applyF02Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 讌ｭ逡後ル繝･繝ｼ繧ｹ: 豢ｾ髢･謚嶺ｺ牙泣逋ｺ・・=辣ｽ繧・/ C=莉句・縺励↑縺・縺ｧ謚嶺ｺ芽｡ｨ髱｢蛹厄ｼ・
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionEscalation',
            characterId: payload.leaderAId || null,
            data: {
              org: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・,
              factionAName: payload.factionAName || '?',
              factionBName: payload.factionBName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leaderA = (G.roster || []).find(c => c.id === payload.leaderAId);
        showFactionEventResult({
          eventId: 'F02',
          category: '豢ｾ髢･謚嶺ｺ・,
          resultText: result.resultText,
          charId: payload.leaderAId,
          charName: leaderA ? leaderA.name : payload.leaderAName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_PEACE') {
      // v4 ﾂｧ2-1: F02竭｡ 豐磯撕蛹厄ｼ磯夂衍縺ｮ縺ｿ繝ｻ驕ｸ謚櫁い縺ｪ縺暦ｼ・
      _factionAudioOpen(eventId);
      showFactionF02PeaceModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA27));
        const result = Engine.factions.applyF02PeaceResult(G, payload, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        showFactionEventResult({
          eventId: 'F02_PEACE',
          category: '謚嶺ｺ画ｲ磯撕蛹・,
          resultText: result.resultText,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_IGNITE') {
      // v4 ﾂｧ2-1: F02竭 逋ｺ轣ｫ・郁・陦碁幕蟋区凾縲・夂衍縺ｮ縺ｿ繝ｻ驕ｸ謚櫁い縺ｪ縺暦ｼ・
      _factionAudioOpen(eventId);
      showFactionF02IgniteModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA26));
        const result = Engine.factions.applyF02IgniteResult(G, payload, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        showFactionEventResult({
          eventId: 'F02_IGNITE',
          category: '謚嶺ｺ臥匱轣ｫ',
          resultText: result.resultText,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_RESOLUTION') {
      // v4 ﾂｧ2-1: F02竭｢ 豎ｺ逹・郁ｩｦ蜷育峩蠕後・夂衍縺ｮ縺ｿ繝ｻ驕ｸ謚櫁い縺ｪ縺暦ｼ・
      _factionAudioOpen(eventId);
      showFactionF02ResolutionModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA24));
        const result = Engine.factions.applyF02ResolutionResult(G, payload, rng);
        G = { ...result.state };
        // 讌ｭ逡後ル繝･繝ｼ繧ｹ: 豢ｾ髢･謚嶺ｺ画ｱｺ逹
        App._pushIndustryNews({
          type: 'factionResolution',
          characterId: payload.winnerId || null,
          data: {
            org: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・,
            winFaction: payload.winFactionName || payload.factionAName || '?',
            loseFaction: payload.loseFactionName || payload.factionBName || '?',
            loseLeader: payload.loseLeaderName || payload.leaderBName || '?',
          },
        });
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const winner = (G.roster || []).find(c => c.id === payload.winnerId);
        showFactionEventResult({
          eventId: 'F02_RESOLUTION',
          category: '謚嶺ｺ画ｱｺ逹',
          resultText: result.resultText,
          charId: payload.winnerId,
          charName: winner ? winner.name : payload.winnerName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F02_ENDLESS') {
      // v4 ﾂｧ2-1: F02竭｣ 辟｡髯先蒲莠会ｼ磯夂衍縺ｮ縺ｿ繝ｻ驕ｸ謚櫁い縺ｪ縺暦ｼ・
      _factionAudioOpen(eventId);
      showFactionF02EndlessModal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA25));
        const result = Engine.factions.applyF02EndlessResult(G, payload, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        showFactionEventResult({
          eventId: 'F02_ENDLESS',
          category: '辟｡髯先蒲莠・,
          resultText: result.resultText,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F03') {
      _factionAudioOpen(eventId);
      showFactionF03Modal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA33));
        const result = Engine.factions.applyF03Result(G, payload, rng);
        G = { ...result.state };
        // 讌ｭ逡後ル繝･繝ｼ繧ｹ: 豢ｾ髢･豸域ｻ・(branch === 'dissolution' / 蠕檎ｶ呵・↑縺・
        if (payload.branch === 'dissolution') {
          const fac = (G.factions || []).find(f => f.id === payload.factionId);
          App._pushIndustryNews({
            type: 'factionDissolution',
            characterId: null,
            data: {
              org: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・,
              factionName: payload.factionName || (fac && fac.name) || '?',
              leaderName: payload.oldLeaderName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const newLeader = payload.newLeaderId ? (G.roster || []).find(c => c.id === payload.newLeaderId) : null;
        showFactionEventResult({
          eventId: 'F03',
          category: '繝ｪ繝ｼ繝繝ｼ蝟ｪ螟ｱ',
          resultText: result.resultText,
          charId: payload.newLeaderId || null,
          charName: newLeader ? newLeader.name : (payload.newLeaderName || ''),
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F04') {
      _factionAudioOpen(eventId);
      showFactionF04Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA14));
        const result = Engine.factions.applyF04Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const target = (G.roster || []).find(c => c.id === payload.targetId);
        showFactionEventResult({
          eventId: 'F04',
          category: '遘ｻ邀・,
          resultText: result.resultText,
          charId: payload.targetId,
          charName: target ? target.name : payload.targetName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F05H') {
      // F05H 豢ｻ蜍穂ｼ第ｭ｢・磯夂衍縺ｮ縺ｿ繝ｻ驕ｸ謚櫁い縺ｪ縺暦ｼ・
      _factionAudioOpen(eventId);
      showFactionHiatusModal(payload, G, () => {
        const result = Engine.factions.applyF05HResult(G, payload);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leaderH = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'F05H',
          category: '豢ｻ蜍穂ｼ第ｭ｢',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leaderH ? leaderH.name : payload.leaderName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F05') {
      _factionAudioOpen(eventId);
      showFactionF05Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA15));
        const result = Engine.factions.applyF05Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        // 讌ｭ逡後ル繝･繝ｼ繧ｹ: 豢ｾ髢･蛻・｣ゑｼ・=謾ｾ莉ｻ 縺ｧ natural split 縺檎匱逕溘☆繧狗ｵ瑚ｷｯ諠ｳ螳夲ｼ・
        if (choiceId === 'A' || choiceId === 'C') {
          App._pushIndustryNews({
            type: 'factionSplit',
            characterId: payload.ringleaderId || null,
            data: {
              org: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・,
              factionName: payload.factionName || '?',
              ringleaderName: payload.ringleaderName || '?',
            },
          });
        }
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const ringleader = (G.roster || []).find(c => c.id === payload.ringleaderId);
        showFactionEventResult({
          eventId: 'F05',
          category: '豢ｾ髢･蛻・｣・,
          resultText: result.resultText,
          charId: payload.ringleaderId || null,
          charName: ringleader ? ringleader.name : payload.ringleaderName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F06') {
      _factionAudioOpen(eventId);
      showFactionF06Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA16));
        const result = Engine.factions.applyF06Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader6 = (G.roster || []).find(c => c.id === payload.leaderAId);
        showFactionEventResult({
          eventId: 'F06',
          category: '蜷檎屐邱邨・,
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leader6 ? leader6.name : payload.leaderAName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F07') {
      _factionAudioOpen(eventId);
      showFactionF07Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA17));
        const result = Engine.factions.applyF07Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        // v0.4 譁ｰ繧ｷ繧ｰ繝阪メ繝｣: incidentType ﾃ・choice ﾃ・personality 縺ｧ繝ｪ繝ｼ繝繝ｼ蜿榊ｿ懊そ繝ｪ繝輔ｒ讒区・
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        const target = payload.incidentPayload && payload.incidentPayload.targetId
          ? (G.roster || []).find(c => c.id === payload.incidentPayload.targetId)
          : null;
        const vars = {
          factionName: payload.factionName || '',
          leaderName: payload.leaderName || (leader ? leader.name : ''),
          targetName: target ? target.name : (payload.incidentPayload && payload.incidentPayload.targetName) || '',
        };
        const charLine = (Engine.factions.getF07Line)
          ? Engine.factions.getF07Line('resultLeader', { incidentType: payload.incidentType, choice: choiceId, fighter: leader, vars })
          : '';
        const targetLine = (Engine.factions.getF07Line)
          ? Engine.factions.getF07Line('resultTarget', { incidentType: payload.incidentType, choice: choiceId, vars })
          : '';
        const fullResultText = targetLine ? `${result.resultText}\n${targetLine}` : result.resultText;
        showFactionEventResult({
          eventId: 'F07',
          category: '豢ｾ髢･蜍募髄',
          resultText: fullResultText,
          charId: payload.leaderId,
          charName: leader ? leader.name : payload.leaderName,
          charLine,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'F08') {
      _factionAudioOpen(eventId);
      showFactionF08Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFA18));
        const result = Engine.factions.applyF08Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader8 = (G.roster || []).find(c => c.id === payload.leaderAId);
        showFactionEventResult({
          eventId: 'F08',
          category: '逶ｴ謗･蟇ｾ豎ｺ',
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leader8 ? leader8.name : payload.leaderAName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_1') {
      _factionAudioOpen(eventId);
      showFactionCommon1Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAC1));
        const result = Engine.factions.applyCommon1Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'COMMON_1',
          category: '豢ｾ髢･蜀・ｯｾ豎ｺ',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : '',
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_5') {
      _factionAudioOpen(eventId);
      showFactionCommon5Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAC5));
        const result = Engine.factions.applyCommon5Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'COMMON_5',
          category: '繝｡繝・ぅ繧｢蜿匁攝',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : payload.leaderName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_7') {
      _factionAudioOpen(eventId);
      showFactionCommon7Modal(payload, G, (choiceId) => {
        if (!choiceId) return;
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAC7));
        const result = Engine.factions.applyCommon7Choice(G, payload, choiceId, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leaderA = (G.roster || []).find(c => c.id === payload.leaderAId);
        showFactionEventResult({
          eventId: 'COMMON_7',
          category: '豢ｾ髢･蜷亥酔莨∫判',
          resultText: result.resultText,
          charId: payload.leaderAId || null,
          charName: leaderA ? leaderA.name : payload.leaderAName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    } else if (eventId === 'COMMON_4') {
      // 豢ｾ髢･蜷亥ｮｿ繝ｻ諷ｰ蜉ｴ莨夲ｼ磯夂衍縺ｮ縺ｿ繝ｻ驕ｸ謚櫁い縺ｪ縺暦ｼ・
      _factionAudioOpen(eventId);
      showFactionCommon4Modal(payload, G, () => {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xFAC4));
        const result = Engine.factions.applyCommon4Result(G, payload, rng);
        G = { ...result.state };
        Storage.autoSave();
        Audio.play('event');
        renderWeekScreen();
        const leader = (G.roster || []).find(c => c.id === payload.leaderId);
        showFactionEventResult({
          eventId: 'COMMON_4',
          category: '豢ｾ髢･蜷亥ｮｿ',
          resultText: result.resultText,
          charId: payload.leaderId || null,
          charName: leader ? leader.name : payload.leaderName,
          impactSummary: result.impactSummary || [],
          weekLabel: `S${G.season} W${G.week}`,
        }, finalizeAudio);
      });
    }
  },

  // 螟ｧ蝙九う繝吶Φ繝・ VS蟇ｾ蟲咏判髱｢陦ｨ遉ｺ・郁ｩｦ蜷医・縺ｾ縺螳溯｡後＠縺ｪ縺・ｼ・
  _executeLargeEventMatch(event, prevResult) {
    if (event.type === 'B2') {
      const intervention = prevResult.interventionChoice; // 0=f1, 1=f2, 2=neutral
      let f1 = G.roster.find(f => f.id === event.fighter1);
      let f2 = G.roster.find(f => f.id === event.fighter2);
      if (!f1 || !f2) return;

      // 莉句・繝舌ヵ縺ｮ驕ｩ逕ｨ・井ｸ譎ら噪繧ｳ繝斐・・・
      const f1Buffed = { ...f1 };
      const f2Buffed = { ...f2 };
      if (intervention === 0) {
        f1Buffed.pw = (f1.pw || 50) + 5; f1Buffed.sp = (f1.sp || 50) + 5;
        f1Buffed.te = (f1.te || 50) + 5; f1Buffed.st = (f1.st || 50) + 5;
      } else if (intervention === 1) {
        f2Buffed.pw = (f2.pw || 50) + 5; f2Buffed.sp = (f2.sp || 50) + 5;
        f2Buffed.te = (f2.te || 50) + 5; f2Buffed.st = (f2.st || 50) + 5;
      }

      App._b2Preview = {
        event, f1: f1Buffed, f2: f2Buffed, f1Original: f1, f2Original: f2,
        interventionChoice: intervention, watching: false, matchResult: null, prevResult
      };
      _renderB2MatchPreview(event, f1Buffed, f2Buffed, intervention);

    } else if (event.type === 'B3') {
      const fighterId = prevResult.selectedFighterId;
      const playerFighter = G.roster.find(f => f.id === fighterId);
      if (!playerFighter) return;
      const challenger = event.challenger;
      if (!challenger) return;

      App._b3Preview = {
        event, playerFighter, challenger, watching: false, matchResult: null, prevResult
      };
      _renderB3MatchPreview(event, playerFighter, challenger);
    }
  },

  // B3: 隧ｦ蜷医ｒ隕ｳ繧・
  b3WatchMatch() {
    const b3 = App._b3Preview;
    if (!b3) return;
    b3.watching = true;

    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

    const pf = b3.playerFighter;
    const af = b3.challenger;
    // Replay: 邨先棡莠句燕險育ｮ・(skip 縺ｨ蜷・seed: 0xB1B4)
    const b3Rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const b3Result = Engine.battle.simulateMatch({ ...pf, condition: 80 }, { ...af, condition: 80 }, b3Rng, 2, { recordFrames: true });
    b3._preResult = b3Result;
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: {
        ...pf, condition: 80,
        portraitUrl: getPortraitUrl(pf.id), profile: CHAR_PROFILES[pf.id] || '',
        vl: pf.voiceLines || pf.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[pf.id]) || ['窶ｦ・・]
      },
      right: {
        ...af, condition: 80,
        portraitUrl: getPortraitUrl(af.id), profile: CHAR_PROFILES[af.id] || '',
        vl: af.voiceLines || af.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[af.id]) || ['窶ｦ・・]
      },
      matchInfo: {
        header: '笞・謖第姶迥ｶ',
        subHeader: `${pf.name} vs ${af.name}`,
        matchNum: 1, totalMatches: 1,
        isTitle: false, isSpecialMatch: true, matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, pf.id, af.id); return rl ? rl.tier : 0; })(),
        leftPersonality: pf.personality || 'normal', leftArchetype: pf.archetype || 'normal',
        rightPersonality: af.personality || 'normal', rightArchetype: af.archetype || 'normal',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      },
      result: b3Result,
    };
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles邉ｻ縺ｯ蠢・★ battle-engine.html・医ち繝・げ隕ｳ謌ｦ縺ｧ tag-battle.html 縺ｫ蛻・崛繧上▲縺ｦ縺・※繧よ綾縺呻ｼ・
    iframe.src = 'battle-engine.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // B3: 繧ｹ繧ｭ繝・・
  b3SkipMatch() {
    const b3 = App._b3Preview;
    if (!b3) return;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const matchResult = Engine.battle.simulateMatch(b3.playerFighter, b3.challenger, rng, 2);
    b3.matchResult = matchResult;
    App._finalizeB3Match(matchResult);
  },

  // B3: iframe邨先棡蜿嶺ｿ｡
  _receiveB3BattleResult(data) {
    const b3 = App._b3Preview;
    if (!b3) return;
    b3.watching = false;
    // Replay: 莠句燕險育ｮ礼ｵ先棡繧呈ｭ｣縺ｨ縺吶ｋ
    const matchResult = b3._preResult || {
      winner: data.winner,
      finType: data.finType || '', finMove: data.finMove || '',
      turns: data.turns || 0, mq: data.mq || 50,
      hpLeft: { final: data.hpLeft ? data.hpLeft.current : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
      hpRight: { final: data.hpRight ? data.hpRight.current : 0, max: data.hpRight ? data.hpRight.max : 100 },
      log: data.log || []
    };
    b3.matchResult = matchResult;
    // BGM繝輔ぉ繝ｼ繝峨い繧ｦ繝・
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    Audio.play('coin');
    App._finalizeB3Match(matchResult);
  },

  // B3: 邨先棡驕ｩ逕ｨ + 邨先棡逕ｻ髱｢陦ｨ遉ｺ
  _finalizeB3Match(matchResult) {
    const b3 = App._b3Preview;
    if (!b3) return;
    const { event, playerFighter, challenger } = b3;
    const fighterId = playerFighter.id;

    // 邨先棡繧弾vent縺ｫ豺ｻ莉倥＠縺ｦ Step 2 繧帝←逕ｨ
    const enrichedEvent = { ...event, matchResult, selectedFighterId: fighterId };
    const rng3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B6));
    const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
    App._applyLargeEventResult(result3);

    // B3: 莉門屮菴捺姶 applyMatchResult・・sCrossOrg=true 縺ｧrivalry繝悶・繧ｹ繝茨ｼ・
    if (G.relationships) {
      const b3RelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE5C));
      const b3Context = {
        mq: matchResult.mq,
        winner: matchResult.winner === 'left' ? 'win' : (matchResult.winner === 'right' ? 'lose' : 'draw'),
        hpA: matchResult.hpLeft, hpB: matchResult.hpRight,
        turns: matchResult.turns,
        stage: 'normal', isTitleMatch: false, rivalryResolved: false, injuredId: null,
        isCareerBestA: matchResult.mq > (playerFighter.careerBestMQ || 0),
        isCareerBestB: false,
        losingStreakA: playerFighter.losingStreak || 0, losingStreakB: 0,
        ovrA: Engine.util.ov(playerFighter), ovrB: Engine.util.ov(challenger),
        isCrossOrg: true,
      };
      G = Engine.relationships.applyMatchResult(G, fighterId, challenger.id, b3Context, b3RelRng);
    }

    // 繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ蛻､螳夲ｼ域倦謌ｦ迥ｶ縺ｯ isWarMatch=true・・
    const btRngB3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB3B8));
    const won = matchResult.winner === 'left';
    const oppOvr = Engine.util.ov(challenger);
    const btCtx = { isTitle: false, won, isPPV: false, isRivalryResolution: false, isWarMatch: true };
    const btResultB3 = Engine.growthEvents.checkAndApplyBreakthrough(
      btRngB3, playerFighter, matchResult.mq, oppOvr, btCtx, G.season, G.week, Engine.coach.getFlavorBreakthroughMult(G, playerFighter.id)
    );
    if (btResultB3) {
      G = { ...G, roster: G.roster.map(c => c.id === fighterId ? btResultB3.fighter : c) };
      const updF = G.roster.find(c => c.id === fighterId);
      if (matchResult.mq > (updF.careerBestMQ || 0)) {
        G = { ...G, roster: G.roster.map(c => c.id === fighterId ? { ...c, careerBestMQ: matchResult.mq } : c) };
      }
      if (G.relationships) {
        const btRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE57, fighterId));
        G = Engine.relationships.applyBreakthroughEffect(G, fighterId, btRelRng);
      }
      const btHintFighterB3 = G.roster.find(c => c.id === fighterId) || playerFighter;
      const btHintLineB3 = pickDialogueLine(BT_HINT_LINES, btHintFighterB3);
      setTimeout(() => showGrowthEventPopups([{
        type: 'breakthrough', fighterId,
        stat: btResultB3.stat, gain: btResultB3.gain, hotStreak: btResultB3.hotStreak,
        btHint: btHintLineB3
      }]), 600);
    } else {
      if (matchResult.mq > (playerFighter.careerBestMQ || 0)) {
        G = { ...G, roster: G.roster.map(c => c.id === fighterId ? { ...c, careerBestMQ: matchResult.mq } : c) };
      }
    }

    // 驥鷹姦繝舌Λ繝ｳ繧ｹ謾ｹ蝟・ 謖第姶迥ｶ繝｡繝・ぅ繧｢蜿主・
    const b3VenueIdx = G.showVenue || 0;
    const b3VenueMult = VENUE_MEDIA_MULT[b3VenueIdx] || 1.0;
    const b3MediaRev = Math.round(matchResult.mq * MEDIA_CONFIG.eventPerMQ * b3VenueMult * 1.0);
    if (b3MediaRev > 0) {
      const b3MediaIncomes = G._pendingMediaIncomes ? [...G._pendingMediaIncomes] : [];
      b3MediaIncomes.push({ amount: b3MediaRev, label: `謖第姶迥ｶ vs ${event.orgName}` });
      G = { ...G, _pendingMediaIncomes: b3MediaIncomes };
    }

    // 譁ｰ閨槭ヱ繝阪Ν繧､繝吶Φ繝・
    const newsType = matchResult.winner === 'left' ? 'interPromoWin' : (matchResult.winner === 'right' ? 'interPromoLoss' : 'interPromoDraw');
    App._pushNewsEvent({ type: newsType, data: { orgName: event.orgName, fighterName: playerFighter.name, challengerName: challenger.name } });

    // 邨先棡逕ｻ髱｢陦ｨ遉ｺ
    setTimeout(() => _renderB3MatchResult(event, matchResult, playerFighter, challenger), 300);
  },

  // B3: 邨先棡逕ｻ髱｢繧帝哩縺倥ｋ
  closeB3Result() {
    const overlay = document.getElementById('showResultOverlay');
    overlay.classList.remove('active');
    const b3 = App._b3Preview;
    const finalizeClose = () => {
      App._b3Preview = null;
      Audio.play('event');
      App.restoreBgmForState();
      renderWeekScreen();
    };
    if (b3 && typeof showB3OpponentAftermath === 'function') {
      showB3OpponentAftermath(b3.event, b3.matchResult, finalizeClose);
      return;
    }
    finalizeClose();
  },

  // B2: 隧ｦ蜷医ｒ隕ｳ繧・
  b2WatchMatch() {
    const b2 = App._b2Preview;
    if (!b2) return;
    b2.watching = true;

    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

    const f1 = b2.f1, f2 = b2.f2;
    // Replay: 邨先棡莠句燕險育ｮ・(skip 縺ｨ蜷・seed: 0xB1B4)
    const b2Rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const b2Result = Engine.battle.simulateMatch({ ...f1, condition: 80 }, { ...f2, condition: 80 }, b2Rng, 2, { recordFrames: true });
    b2._preResult = b2Result;
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: {
        ...f1, condition: 80,
        portraitUrl: getPortraitUrl(f1.id), profile: CHAR_PROFILES[f1.id] || '',
        vl: f1.voiceLines || f1.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[f1.id]) || ['窶ｦ・・]
      },
      right: {
        ...f2, condition: 80,
        portraitUrl: getPortraitUrl(f2.id), profile: CHAR_PROFILES[f2.id] || '',
        vl: f2.voiceLines || f2.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[f2.id]) || ['窶ｦ・・]
      },
      matchInfo: {
        header: '徴 豎ｺ逹縺ｮ隧ｦ蜷・,
        subHeader: `${f1.name} vs ${f2.name}`,
        matchNum: 1, totalMatches: 1,
        isTitle: false, isSpecialMatch: true, matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, f1.id, f2.id); return rl ? rl.tier : 0; })(),
        leftPersonality: f1.personality || 'normal', leftArchetype: f1.archetype || 'normal',
        rightPersonality: f2.personality || 'normal', rightArchetype: f2.archetype || 'normal',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      },
      result: b2Result,
    };
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles邉ｻ縺ｯ蠢・★ battle-engine.html・医ち繝・げ隕ｳ謌ｦ縺ｧ tag-battle.html 縺ｫ蛻・崛繧上▲縺ｦ縺・※繧よ綾縺呻ｼ・
    iframe.src = 'battle-engine.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // B2: 繧ｹ繧ｭ繝・・
  b2SkipMatch() {
    const b2 = App._b2Preview;
    if (!b2) return;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const matchResult = Engine.battle.simulateMatch(b2.f1, b2.f2, rng, 2);
    b2.matchResult = matchResult;
    App._finalizeB2Match(matchResult);
  },

  // B2: iframe邨先棡蜿嶺ｿ｡
  _receiveB2BattleResult(data) {
    const b2 = App._b2Preview;
    if (!b2) return;
    b2.watching = false;
    // Replay: 莠句燕險育ｮ礼ｵ先棡繧呈ｭ｣縺ｨ縺吶ｋ
    const matchResult = b2._preResult || {
      winner: data.winner,
      finType: data.finType || '', finMove: data.finMove || '',
      turns: data.turns || 0, mq: data.mq || 50,
      hpLeft: { final: data.hpLeft ? data.hpLeft.current : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
      hpRight: { final: data.hpRight ? data.hpRight.current : 0, max: data.hpRight ? data.hpRight.max : 100 },
      log: data.log || []
    };
    b2.matchResult = matchResult;
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    Audio.play('coin');
    App._finalizeB2Match(matchResult);
  },

  // B2: 邨先棡驕ｩ逕ｨ + 邨先棡逕ｻ髱｢陦ｨ遉ｺ
  _finalizeB2Match(matchResult) {
    const b2 = App._b2Preview;
    if (!b2) return;
    const { event, interventionChoice } = b2;
    const winner = matchResult.winner === 'left' ? 'fighter1' : (matchResult.winner === 'right' ? 'fighter2' : 'draw');

    // 邨先棡繧弾vent縺ｫ豺ｻ莉倥＠縺ｦ Step 2 繧帝←逕ｨ
    const enrichedEvent = { ...event, matchResult: { ...matchResult, winner }, interventionChoice };
    const rng3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B5));
    const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
    App._applyLargeEventResult(result3);

    // 邨先棡逕ｻ髱｢陦ｨ遉ｺ
    setTimeout(() => _renderB2MatchResult(event, matchResult, b2.f1, b2.f2, interventionChoice), 300);
  },

  // B2: 邨先棡逕ｻ髱｢繧帝哩縺倥ｋ
  closeB2Result() {
    const overlay = document.getElementById('showResultOverlay');
    overlay.classList.remove('active');
    App._b2Preview = null;
    Audio.play('event');
    App.restoreBgmForState();
    renderWeekScreen();
  },

  // 螟ｧ蝙九う繝吶Φ繝育ｵ先棡繧痴tate縺ｫ蜿肴丐縺吶ｋ繝倥Ν繝代・
  _applyLargeEventResult(result) {
    const updates = {};
    if (result.roster) updates.roster = result.roster;
    if (result.funds !== undefined) updates.funds = result.funds;
    if (result.lockerRoomMorale !== undefined) updates.lockerRoomMorale = result.lockerRoomMorale;
    if (result.mediaSpotlight !== undefined) updates.mediaSpotlight = result.mediaSpotlight;
    if (result.lastLargeEventWeek !== undefined) updates.lastLargeEventWeek = result.lastLargeEventWeek;
    if (result.orgPopDelta) updates.orgPop = G.orgPop + result.orgPopDelta;
    if (result.battlePoints) updates.battlePoints = result.battlePoints;
    // Phase 4: E-02/E-03 螟ｧ蝙九う繝吶Φ繝医・髢｢菫ょ､蜿肴丐
    if (result.relationships) updates.relationships = result.relationships;
    if (result.relationshipCounters) updates.relationshipCounters = result.relationshipCounters;
    // MVP繝ｬ繝ｼ繧ｹ v2: B3 霎樣譎ゅ・ AI謖第姶閠・∈縺ｮ螻･豁ｴ霑ｽ蜉縺ｪ縺ｩ
    if (result.aiOrgs) updates.aiOrgs = result.aiOrgs;
    if (result.events && result.events.length > 0) {
      updates.gameLog = [...(G.gameLog || []), ...result.events];
    }
    G = { ...G, ...updates };
    Storage.autoSave();
    if (result.events && result.events.length > 0) {
      showToast(result.events[result.events.length - 1]);
    }
  },

  // 遉ｾ髟ｷ螳､ Phase 5: 驕ｸ謇九・繝・・繧｢繝・・縺九ｉ縲悟｣ｰ繧偵°縺代ｋ縲・encourage)
  // 豎ｺ陬∵棧繧りｳ・≡繧よｶ郁ｲｻ縺励↑縺・ら､ｾ髟ｷ閾ｪ繧峨′雜ｳ繧帝°縺ｶ閾ｪ逋ｺ逧・｡悟虚縲・
  // 逋ｺ蜍墓擅莉ｶ: slump/motivationLoss 荳ｭ OR 菫｡鬆ｼ縺梧昭繧峨℃蟋九ａ縺・trust<50)
  // UI 蛛ｴ縺ｧ 2谿ｵ髫弱・貂ｩ蠎ｦ諢・is-urgent: slump/motivLoss/trust<40, is-gentle: trust<50)
  encourageFighter(fighterId) {
    const target = G.roster.find(f => f.id === fighterId);
    if (!target) { showToast('驕ｸ謇九′隕九▽縺九ｊ縺ｾ縺帙ｓ'); return; }
    if (target.isRental || target.injury) { showToast('莉翫・螢ｰ繧偵°縺代ｉ繧後↑縺・); return; }
    const targetTrust = target.trust != null ? target.trust : 50;
    if (!target.slump && !target.motivationLoss && targetTrust >= 50) {
      showToast('縺薙・驕ｸ謇九↓縺ｯ莉翫∝｣ｰ繧偵°縺代ｋ逅・罰縺後↑縺・);
      return;
    }
    // cooldown 繝√ぉ繝・け(驕ｸ謇句腰菴阪・騾ｱ)
    const lastUsed = (target._decisionWeekUsed || {}).encourage || -99;
    if ((G.week - lastUsed) < 1) { showToast('莉企ｱ縺ｯ繧ゅ≧螢ｰ繧偵°縺代◆'); return; }

    // Engine.shachoshitsu.execute 繧貞・蛻ｩ逕ｨ(豎ｺ陬∵棧0縺ｮ譖ｸ鬘槭↑縺ｮ縺ｧ dp 豸郁ｲｻ縺ｪ縺・
    const result = Engine.shachoshitsu.execute('encourage', fighterId, G);
    if (!result || result.error) {
      const msg = {
        doc_not_found: '縺薙・陦悟虚縺ｯ迴ｾ蝨ｨ蛻ｩ逕ｨ縺ｧ縺阪∪縺帙ｓ',
        fighter_not_found: '驕ｸ謇九′隕九▽縺九ｊ縺ｾ縺帙ｓ',
        not_needed: '縺薙・驕ｸ謇九↓縺ｯ莉翫∝｣ｰ繧偵°縺代ｋ逅・罰縺後↑縺・,
        not_slump: '縺薙・驕ｸ謇九↓縺ｯ莉翫∝｣ｰ繧偵°縺代ｋ逅・罰縺後↑縺・,  // 譌ｧ繧ｨ繝ｩ繝ｼID縺ｮ莠呈鋤
        cooldown: '莉企ｱ縺ｯ繧ゅ≧螢ｰ繧偵°縺代◆',
        condition_not_met: '螢ｰ繧偵°縺代ｋ迥ｶ豕√〒縺ｯ縺ｪ縺・,
        funds_insufficient: '雉・≡縺御ｸ崎ｶｳ縺励※縺・∪縺・,
      }[result?.error] || '螟ｱ謨励＠縺ｾ縺励◆';
      showToast(msg);
      return;
    }

    // state 譖ｴ譁ｰ(encourage 縺ｯ decisionPoints 繧呈ｶ郁ｲｻ縺励↑縺・′縲‘xecute 蛛ｴ縺ｧ
    // newDp 繧定ｿ斐☆縺ｮ縺ｧ荳蠢懷渚譏縲ょｮ溯ｳｪ 0 蠑輔°繧後※縺・ｋ)
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      _decisionWeekUsed: result._decisionWeekUsed || G._decisionWeekUsed || {},
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    if (result.relationships) G = { ...G, relationships: result.relationships };
    Storage.autoSave();

    // 驕ｸ謇九・繝・・繧｢繝・・繧帝哩縺倥※縺九ｉ邨先棡繝｢繝ｼ繝繝ｫ繧貞・縺・繝峨Λ繝樊ｼ泌・)
    if (typeof closeFighterPopup === 'function') closeFighterPopup();

    // displayData 繧堤ｵ・∩遶九※縺ｦ譌｢蟄倥・雎ｪ闖ｯ繝｢繝ｼ繝繝ｫ縺ｫ豬√☆
    const doc = Engine.shachoshitsu.getDoc('encourage');
    const reactionKey = result.reactionKey || 'encourage';
    const fighter = G.roster.find(f => f.id === fighterId);
    const text = fighter ? Engine.shachoshitsu.getReactionText(reactionKey, fighter) : '';
    const displayData = {
      fighter, text,
      changes: result.changes || [],
      cost: result.cost || 0,
      remainingFunds: result.funds,
      icon: doc?.icon || '町',
      label: doc?.label || '螢ｰ縺九￠',
      docId: 'encourage',
      // Phase 8: 荳咲｢ｺ螳滓ｧ繝医・繝ｳ繝槭・繧ｫ繝ｼ (encourage 繧ょ倶ｺｺ譖ｸ鬘・
      reactionTone: result.reactionTone || null,
    };
    Audio.play('notify');
    if (typeof showDecisionResultModal === 'function') {
      showDecisionResultModal(displayData);
    }
    if (typeof refreshAll === 'function') refreshAll();
  },

  // 遉ｾ髟ｷ螳､ Phase 5: 迚ｹ蛻･豐ｻ逋・諤ｪ謌代・繝・・繧｢繝・・縺ｮ莠梧ｬ｡繧｢繧ｯ繧ｷ繝ｧ繝ｳ)
  // 豎ｺ陬∵棧縺ｯ豸郁ｲｻ縺帙★縲∬ｳ・≡200荳・・縺ｿ豸郁ｲｻ縲ょ屓蠕ｩ譛滄俣繧・縲・騾ｱ遏ｭ邵ｮ縲・
  executeSpecialTreatment(fighterId) {
    const result = Engine.shachoshitsu.executeSpecialTreatment(fighterId, G);
    if (!result) { showToast('迚ｹ蛻･豐ｻ逋ゅ↓螟ｱ謨励＠縺ｾ縺励◆'); return; }
    if (result.error === 'funds_insufficient') { showToast('雉・≡縺御ｸ崎ｶｳ縺励※縺・∪縺・); return; }
    if (result.error === 'fighter_not_found') { showToast('驕ｸ謇九′隕九▽縺九ｊ縺ｾ縺帙ｓ'); return; }
    if (result.error === 'not_injured') { showToast('諤ｪ謌代ｒ縺励※縺・↑縺・∈謇九↓縺ｯ菴ｿ逕ｨ縺ｧ縺阪∪縺帙ｓ'); return; }
    // state 譖ｴ譁ｰ
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    Storage.autoSave();
    Audio.play('award');
    if (typeof closeEventPopup === 'function') closeEventPopup();
    if (typeof closeCareModal === 'function') closeCareModal();
    if (document.getElementById('careOverlay')) document.getElementById('careOverlay').classList.remove('active');

    // 驕ｸ謇句渚蠢懊Δ繝ｼ繝繝ｫ(遉ｾ髟ｷ螳､縺ｮ騾壼ｸｸ譖ｸ鬘槭→蜷後§雎ｪ闖ｯ繝｢繝ｼ繝繝ｫ縺ｫ豬√☆)
    const fighter = G.roster.find(f => f.id === fighterId);
    if (fighter && typeof showDecisionResultModal === 'function') {
      const text = Engine.shachoshitsu.getReactionText('special_treatment', fighter);
      const doc = Engine.shachoshitsu.getDoc('special_treatment');
      const displayData = {
        fighter, text,
        changes: result.changes || [],
        cost: result.cost || 0,
        remainingFunds: result.funds,
        icon: doc?.icon || '唱',
        label: doc?.label || '迚ｹ蛻･豐ｻ逋よ欠遉ｺ譖ｸ',
        docId: 'special_treatment',
      };
      showDecisionResultModal(displayData);
    } else {
      showToast(`唱 ${result.cur}騾ｱ 竊・${result.reduced}騾ｱ縺ｫ遏ｭ邵ｮ・・${result.cost}荳・ｼ荏);
    }
    if (typeof renderWeekScreen === 'function') renderWeekScreen();
  },

  // 遉ｾ髟ｷ螳､ Phase 4: 譖ｸ鬘槭け繝ｪ繝・け繝上Φ繝峨Λ(繝｢繝ｼ繝繝ｫ蛻・ｲ・
  onShachoshitsuDocClick(docId) {
    Audio.play('click');
    // 豎ｺ陬∵ｸ医∩縺ｪ繧臥┌隕・
    if ((G._decisionDoneThisWeek || []).includes(docId)) return;
    const doc = Engine.shachoshitsu.getDoc(docId);
    if (!doc) return;
    // 莠句燕繝√ぉ繝・け(UX: 繝｢繝ｼ繝繝ｫ繧帝幕縺丞燕縺ｫ縺ｯ縺倥￥)
    const dpCost = doc.decisionCost || 0;
    if ((G.decisionPoints || 0) < dpCost) {
      showToast(`豎ｺ陬∵棧縺御ｸ崎ｶｳ縺励※縺・∪縺・蠢・ｦ・ 笞｡${dpCost})`);
      return;
    }
    const actualCost = Engine.shachoshitsu.calcCost(doc, G);
    if ((G.funds || 0) < actualCost) {
      showToast(`雉・≡縺御ｸ崎ｶｳ縺励※縺・∪縺・蠢・ｦ・ ${actualCost}荳・`);
      return;
    }
    // 蛟倶ｺｺ譖ｸ鬘・/ 蝗｣菴捺嶌鬘・/ 繝壹い譖ｸ鬘・縺ｧ蛻・ｲ・
    if (doc.effect && doc.effect.target === 'team') {
      showDecisionConfirmModal(docId, G);
    } else if (doc.effect && doc.effect.target === 'pair') {
      showDecisionPairModal(docId, G);
    } else {
      showDecisionTargetModal(docId, G);
    }
  },

  // 遉ｾ髟ｷ螳､ Phase 4: 豎ｺ陬∝ｮ溯｡後お繝ｳ繝医Μ繝昴う繝ｳ繝・
  // fighterId: 蛟倶ｺｺ譖ｸ鬘槭・縺ｨ縺榊ｯｾ雎｡驕ｸ謇紀D縲》eam譖ｸ鬘槭・縺ｨ縺・null
  // 霑斐ｊ蛟､: { ok: true, displayData } | { ok: false, error? }
  executeDecision(docId, fighterId) {
    const result = Engine.shachoshitsu.execute(docId, fighterId, G);
    if (!result) { showToast('譖ｸ鬘槭′隕九▽縺九ｊ縺ｾ縺帙ｓ'); return { ok: false }; }
    if (result.error === 'doc_not_found') { showToast('譖ｸ鬘槭′隕九▽縺九ｊ縺ｾ縺帙ｓ'); return { ok: false }; }
    if (result.error === 'decision_points_insufficient') { showToast('豎ｺ陬∵棧縺御ｸ崎ｶｳ縺励※縺・∪縺・); return { ok: false }; }
    if (result.error === 'funds_insufficient') { showToast('雉・≡縺御ｸ崎ｶｳ縺励※縺・∪縺・); return { ok: false }; }
    if (result.error === 'fighter_not_found') { showToast('驕ｸ謇九′隕九▽縺九ｊ縺ｾ縺帙ｓ'); return { ok: false }; }
    if (result.error === 'not_slump') { showToast('繧ｹ繝ｩ繝ｳ繝嶺ｸｭ縺ｮ驕ｸ謇九〒縺ｯ縺ゅｊ縺ｾ縺帙ｓ'); return { ok: false }; }
    if (result.error === 'not_injured') { showToast('諤ｪ謌代ｒ縺励※縺・↑縺・∈謇九↓縺ｯ菴ｿ逕ｨ縺ｧ縺阪∪縺帙ｓ'); return { ok: false }; }
    if (result.error === 'cooldown') { showToast('莉企ｱ縺ｯ縺吶〒縺ｫ豎ｺ陬∵ｸ医∩縺ｧ縺・); return { ok: false }; }
    if (result.error === 'orgpop_locked') { showToast(`蝗｣菴薙・遏･蜷榊ｺｦ縺瑚ｶｳ繧翫∪縺帙ｓ(${result.required} 蠢・ｦ・`); return { ok: false }; }
    if (result.error === 'condition_not_met') { showToast('縺薙・譖ｸ鬘槭・逋ｺ蜍墓擅莉ｶ繧呈ｺ縺溘＠縺ｦ縺・∪縺帙ｓ'); return { ok: false }; }
    if (result.error === 'unsupported_doc') { showToast(`譛ｪ蟇ｾ蠢懊・譖ｸ鬘槭〒縺・ ${result.docId}`); return { ok: false }; }

    // state 譖ｴ譁ｰ
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      decisionPoints: result.decisionPoints != null ? result.decisionPoints : G.decisionPoints,
      _decisionWeekUsed: result._decisionWeekUsed || G._decisionWeekUsed || {},
      _decisionDoneThisWeek: [...(G._decisionDoneThisWeek || []), docId],
      gameLog: [...(G.gameLog || []), ...(result.events || [])],
    };
    if (result.relationships) G = { ...G, relationships: result.relationships };
    if (result.h2h) G = { ...G, h2h: result.h2h };
    if (result.orgPopDelta) {
      const newOrgPop = Engine.util.clamp((G.orgPop || 0) + Engine.orgPop.applyOrgPopChange(result.orgPopDelta, G.orgPop, null), 0, 100);
      G = { ...G, orgPop: newOrgPop };
    }
    // 讌ｭ逡後ル繝･繝ｼ繧ｹ: relationship_repair 縺ｪ縺ｩ縺檎ｩ阪ｓ縺繧､繝吶Φ繝医ｒ蜿肴丐
    if (result._industryNewsEvents && result._industryNewsEvents.length > 0) {
      G = { ...G, _industryNewsEvents: [...(G._industryNewsEvents || []), ...result._industryNewsEvents] };
    }
    Storage.autoSave();

    // displayData 讒狗ｯ・邨先棡陦ｨ遉ｺ逕ｨ)
    const doc = Engine.shachoshitsu.getDoc(docId);
    const reactionKey = result.reactionKey || docId;
    let displayData = null;
    if (result.reactionFighterId != null) {
      const fighter = G.roster.find(f => f.id === result.reactionFighterId);
      if (fighter) {
        const text = Engine.shachoshitsu.getReactionText(reactionKey, fighter);
        displayData = {
          fighter, text, changes: result.changes || [],
          cost: result.cost || 0, remainingFunds: result.funds,
          icon: doc?.icon || '', label: doc?.label || '', docId,
          // Phase 8: 荳咲｢ｺ螳滓ｧ繝医・繝ｳ繝槭・繧ｫ繝ｼ (蛟倶ｺｺ譖ｸ鬘槭・縺ｿ)
          reactionTone: result.reactionTone || null,
        };
      }
    } else {
      // 蝗｣菴捺嶌鬘・party/camp): 蜿ょ刈閠・・蜩｡ + 莉｣陦ｨ繧ｻ繝ｪ繝・+ camp 繝輔Ξ繝ｼ繝舌・
      const participants = (G.roster || []).filter(f => !f.isRental && !f.injury);
      const repFighter = participants.length > 0
        ? participants[Math.floor(Math.random() * participants.length)]
        : null;
      const text = repFighter ? Engine.shachoshitsu.getReactionText(reactionKey, repFighter) : '';
      // camp: CAMP_FLAVOR_TEXTS 縺九ｉ繝ｩ繝ｳ繝繝縺ｫ1莉ｶ縲∝盾蜉閠・蜷阪ｒ蟾ｮ縺苓ｾｼ縺ｿ
      let campFlavor = null;
      if (docId === 'camp' && typeof CAMP_FLAVOR_TEXTS !== 'undefined' && participants.length >= 2) {
        const tmpl = CAMP_FLAVOR_TEXTS[Math.floor(Math.random() * CAMP_FLAVOR_TEXTS.length)];
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        campFlavor = tmpl
          .replace('{name1}', shuffled[0].name)
          .replace('{name2}', shuffled[1] ? shuffled[1].name : shuffled[0].name);
      }
      displayData = {
        fighter: null, isTeam: true,
        fighters: participants, repFighter, text, campFlavor,
        changes: result.changes || [],
        cost: result.cost || 0, remainingFunds: result.funds,
        icon: doc?.icon || '', label: doc?.label || '', docId,
      };
    }

    // 繧ｵ繧ｦ繝ｳ繝・繧ｳ繧ｹ繝亥挨縲∵里蟄俶ｵ∫畑)
    // Phase 9: 譛ｱ蜊ｰ髻ｳ繧貞・縺ｫ魑ｴ繧峨☆(0.6遘偵・譛ｱ蜊ｰ繧｢繝九Γ縺ｨ蜷梧凾髢句ｧ・
    // 蜷域・髻ｳ縺ｮ遏ｭ縺・ヰ繝ｼ繧ｹ繝医↑縺ｮ縺ｧ縲∝ｾ檎ｶ壹・繧ｳ繧ｹ繝亥挨繧ｵ繧ｦ繝ｳ繝峨→縺ｶ縺､縺九ｉ縺ｪ縺・
    Audio.play('stamp');
    const soundCost = result.cost || 0;
    if (docId === 'camp') Audio.play('fanfare');
    else if (soundCost >= 160) Audio.play('award');
    else if (soundCost >= 80) Audio.play('event');
    else Audio.play('notify');

    // 貍泌・繝輔ャ繧ｯ: 譖ｸ鬘曠OM縺ｫ譛ｱ蜊ｰ繧｢繝九Γ(is-approving)繧剃ｻ倅ｸ・竊・0.6遘貞ｾ後↓蜀阪Ξ繝ｳ繝(is-approved 縺ｫ蛻・崛)
    // HUD縺ｮ譛蛻昴・縲檎ｫ九▲縺ｦ縺・ｋ縲紘anko縺ｫ falling 繧ｯ繝ｩ繧ｹ繧剃ｻ倅ｸ・
    try {
      const docEl = document.querySelector(`.shachoshitsu-doc[data-doc-id="${docId}"]`);
      if (docEl) docEl.classList.add('is-approving');
      const firstStandingHanko = document.querySelector('.shachoshitsu-hud .hanko.available:not(.falling)');
      if (firstStandingHanko) firstStandingHanko.classList.add('falling');
    } catch (e) {}

    // 邨先棡陦ｨ遉ｺ: 蛟倶ｺｺ/team 蝠上ｏ縺壼ｸｸ縺ｫ雎ｪ闖ｯ繝｢繝ｼ繝繝ｫ(隧ｱ閠・・鬘・繧ｻ繝ｪ繝・螟牙喧+繧ｳ繧ｹ繝・
    // spec: 豎ｺ陬・迚ｹ蛻･縺ｪ陦檎ぜ縲√く繝｣繝ｩ縺ｮ蜿榊ｿ懊ｒ隕励″隕九ｋ菴馴ｨ薙ｒ荳雋ｫ縺輔○繧・
    if (typeof showDecisionResultModal === 'function') {
      showDecisionResultModal(displayData);
    } else if (typeof showDecisionResultToast === 'function') {
      showDecisionResultToast(displayData);
    }

    // 0.6遘貞ｾ後↓蜀阪Ξ繝ｳ繝繝ｪ繝ｳ繧ｰ縺励※豎ｺ陬∵ｸ医∩迥ｶ諷・is-approved)繧貞渚譏
    setTimeout(() => {
      if (typeof renderShachoshitsu === 'function') renderShachoshitsu();
    }, 600);

    return { ok: true, displayData };
  },

  // v0.97: Survival gauge
  checkSurvivalUpdate() {
    const sResult = Survival.updateSurvival(G);
    const wasCleared = G.survivalCleared;
    G = sResult.state;
    if (sResult.graduated && !wasCleared) {
      setTimeout(() => showEventPopup({
        type: 'generic', emoji: '\uD83C\uDF8A', name: '\u7D4C\u55B6\u5B89\u5B9A\u5316\u9054\u6210\uFF01',
        message: '\u8D64\u5B57\u5730\u7344\u3092\u4E57\u308A\u8D8A\u3048\u3001\u3064\u3044\u306B\u5B89\u5B9A\u3057\u305F\u9ED2\u5B57\u7D4C\u55B6\u3092\u9054\u6210\u3057\u307E\u3057\u305F\uFF01',
        detail: '\uD83D\uDCAA \u3053\u308C\u304B\u3089\u306F\u6210\u9577\u30D5\u30A7\u30FC\u30BA\u3067\u3059\u3002\u66F4\u306A\u308B\u9AD8\u307F\u3092\u76EE\u6307\u3057\u307E\u3057\u3087\u3046\uFF01',
        tone: 'gold'
      }), 200);
    }
  },

  hasPermanentRosterCap16Unlock(state = G) {
    if (!state) return false;
    const ownCount = (state.roster || []).filter(f => !f?.isRental).length;
    if (state.endingCleared) return true;
    if (ownCount > 12) return true;
    if ((state.rosterCap || 0) >= 16) return true;
    if (state.rosterCapRank1Notified) return true;
    if ((state.rankings || [])[0]?.orgId === 'player') return true;
    return (state.seasonHistory || []).some(season => (season?.rank || 99) === 1);
  },

  getRosterCapTarget(state = G) {
    const orgPop = state.orgPop || 0;
    if (App.hasPermanentRosterCap16Unlock(state)) return 16;
    if (orgPop >= 70) return 14;
    if (orgPop >= 50) return 12;
    if (orgPop >= 25) return 10;
    return 8;
  },

  _notifyRosterCapUnlock(popups) {
    popups.forEach((popup, idx) => {
      setTimeout(() => showEventPopup({
        type: 'generic',
        emoji: '\uD83C\uDFE2',
        name: '\u5951\u7D04\u67A0\u62E1\u5927\uFF01',
        message: popup.message,
        detail: `\u9078\u624B\u3068\u306E\u5951\u7D04\u67A0\u304C ${popup.cap} \u540D\u306B\u62E1\u5927\u3057\u307E\u3057\u305F\uFF01`,
        tone: 'gold',
        sound: 'fanfare'
      }), 220 + idx * 140);
    });
  },

  checkRosterCapMilestones() {
    const orgPop = G.orgPop || 0;
    const rank1Unlocked = App.hasPermanentRosterCap16Unlock(G);
    const nextUpdates = {};
    const popups = [];

    if (orgPop >= 25 && !G.rosterCapPop25Notified) {
      nextUpdates.rosterCapPop25Notified = true;
      popups.push({ cap: 10, message: '\u56E3\u4F53\u4EBA\u6C17\u304C25\u3092\u7A81\u7834\uFF01 \u56E3\u4F53\u898F\u6A21\u306E\u62E1\u5927\u3067\u5951\u7D04\u67A0\u306B\u4F59\u88D5\u304C\u3067\u304D\u307E\u3057\u305F\u3002' });
    }
    if (orgPop >= 50 && !G.rosterCapPop50Notified) {
      nextUpdates.rosterCapPop50Notified = true;
      popups.push({ cap: 12, message: '\u56E3\u4F53\u4EBA\u6C17\u304C50\u3092\u7A81\u7834\uFF01 \u4E3B\u529B\u3068\u82E5\u624B\u3092\u3088\u308A\u539A\u304F\u62B1\u3048\u3089\u308C\u308B\u3088\u3046\u306B\u306A\u308A\u307E\u3057\u305F\u3002' });
    }
    if (orgPop >= 70 && !G.rosterCapPop70Notified) {
      nextUpdates.rosterCapPop70Notified = true;
      popups.push({ cap: 14, message: '蝗｣菴謎ｺｺ豌励′70繧堤ｪ∫ｴ・・繝｡繧ｸ繝｣繝ｼ蝗｣菴薙・隕乗ｨ｡縺ｫ縺ｵ縺輔ｏ縺励＞螂醍ｴ・棧縺檎｢ｺ菫昴＆繧後∪縺励◆縲・ });
    }
    if (rank1Unlocked && !G.rosterCapRank1Notified) {
      nextUpdates.rosterCapRank1Notified = true;
      popups.push({ cap: 16, message: '\u30E9\u30F3\u30AD\u30F3\u30B01\u4F4D\u5230\u9054\uFF01 \u738B\u8005\u306E\u56E3\u4F53\u306B\u3075\u3055\u308F\u3057\u3044\u6700\u5927\u5951\u7D04\u67A0\u304C\u89E3\u653E\u3055\u308C\u307E\u3057\u305F\u3002' });
    }

    const newCap = App.getRosterCapTarget(G);
    if ((G.rosterCap || 8) !== newCap) nextUpdates.rosterCap = newCap;
    if (Object.keys(nextUpdates).length === 0) return;
    G = { ...G, ...nextUpdates };
    if (popups.length > 0) App._notifyRosterCapUnlock(popups);
  },

  // v1.0: Title establishment check
  checkTitleEstablishment() {
    if (G.titleEstablished) return;
    if (Engine.title.checkTitleEstablishment(G)) {
      G = { ...G, titleEstablished: true };
      setTimeout(() => showEventPopup({
        type: 'generic', emoji: '\uD83C\uDFC6', name: '\u56E3\u4F53\u738B\u5EA7 \u8A2D\u7ACB\uFF01',
        message: '\u56E3\u4F53\u306E\u5B9F\u7E3E\u304C\u8A8D\u3081\u3089\u308C\u3001\u56E3\u4F53\u738B\u5EA7\u3092\u8A2D\u7ACB\u3067\u304D\u308B\u3088\u3046\u306B\u306A\u308A\u307E\u3057\u305F\uFF01',
        detail: '\uD83C\uDF96\uFE0F \u8208\u884C\u3067\u300C\u521D\u4EE3\u738B\u8005\u6C7A\u5B9A\u6226\u300D\u3092\u7D44\u3093\u3067\u3001\u521D\u4EE3\u30C1\u30E3\u30F3\u30D4\u30AA\u30F3\u3092\u6C7A\u3081\u307E\u3057\u3087\u3046\uFF01',
        tone: 'gold'
      }), 300);
    }
  },

  // 笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武
  //  WAR MATCH PREVIEW SYSTEM (v0.99d)
  // 笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武
  _warPreview: null,
  _warUiToken: 0,
  _warBgmTimer: null,

  _beginWarUiTransition() {
    App._warUiToken += 1;
    if (App._warBgmTimer) {
      clearTimeout(App._warBgmTimer);
      App._warBgmTimer = null;
    }
    return App._warUiToken;
  },

  _isWarUiTokenCurrent(token) {
    return token == null || App._warUiToken === token;
  },

  _scheduleWarBgmResume(delayMs = 1600) {
    const token = App._warUiToken;
    if (App._warBgmTimer) clearTimeout(App._warBgmTimer);
    App._warBgmTimer = setTimeout(() => {
      App._warBgmTimer = null;
      if (!App._isWarUiTokenCurrent(token) || !App._warPreview) return;
      try { Audio.fileBgm.play('../bgm/MusMus-BGM-125.mp3', { loop: true, volume: 0.10 }); } catch(e) {}
    }, delayMs);
  },

  // Start war match preview (called from acceptWarChallenge in ui-common)
  initWarPreview(ev, card) {
    App._beginWarUiTransition();
    App._warPreview = {
      ev,
      card,                         // [{playerFighter, aiFighter}, ...]
      results: card.map(() => null), // null = unresolved
      currentWatching: -1
    };
    try { Audio.fileBgm.play('../bgm/MusMus-BGM-125.mp3', { loop: true, volume: 0.10 }); } catch(e) {}
    renderWarMatchPreview();
  },

  // Watch a war match in battle engine iframe
  warWatchMatch(idx) {
    const wp = App._warPreview;
    if (!wp || wp.results[idx]) return;
    wp.currentWatching = idx;
    const m = wp.card[idx];
    const pf = m.playerFighter;
    const af = m.aiFighter;

    // Replay: 邨先棡莠句燕險育ｮ・(skip 縺ｨ荳閾ｴ縺輔○繧九◆繧∝酔縺・seed 繧剃ｽｿ縺・
    const warRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week + idx));
    const warResult = Engine.event.resolveEventMatch(warRng, pf, af, 0, { recordFrames: true });
    const warPlayerWon = warResult.winner === 'left';
    const warWinnerFighter = warPlayerWon ? pf : af;
    wp.results[idx] = {
      playerFighter: pf, aiFighter: af,
      winner: warResult.winner, mq: warResult.mq,
      playerWon: warPlayerWon,
      finType: warResult.finType || '', finMove: warResult.finMove || '',
      turns: warResult.turns || 0,
      victoryLine: _getWarVictoryLine(warWinnerFighter),
      winnerName: warWinnerFighter.name, winnerId: warWinnerFighter.id
    };

    // Show iframe
    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    // Show escape button after delay
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: {
        ...pf, condition: 80,
        portraitUrl: getPortraitUrl(pf.id), profile: CHAR_PROFILES[pf.id] || '',
        vl: pf.voiceLines || pf.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[pf.id]) || ['窶ｦ・・]
      },
      right: {
        ...af, condition: 80,
        portraitUrl: getPortraitUrl(af.id), profile: CHAR_PROFILES[af.id] || '',
        vl: af.voiceLines || af.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[af.id]) || ['窶ｦ・・]
      },
      matchInfo: {
        header: `笞・蟇ｾ謚玲姶 隨ｬ${idx + 1}隧ｦ蜷・,
        subHeader: `${pf.name} vs ${af.name}`,
        matchNum: idx + 1,
        totalMatches: wp.card.length,
        isTitle: false,
        isSpecialMatch: idx + 1 === wp.card.length,
        matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, pf.id, af.id); return rl ? rl.tier : 0; })(),
        leftPersonality: pf.personality || 'normal',
        leftArchetype: pf.archetype || 'normal',
        rightPersonality: af.personality || 'normal',
        rightArchetype: af.archetype || 'normal',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      },
      result: warResult,
    };
    // 繝薙ャ繧ｰ繝槭ャ繝。GM・亥ｯｾ謚玲姶・・
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => {
      if (sent) return; sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    iframe.onload = () => setTimeout(sendOnce, 200);
    // singles邉ｻ縺ｯ蠢・★ battle-engine.html・医ち繝・げ隕ｳ謌ｦ縺ｧ tag-battle.html 縺ｫ蛻・崛繧上▲縺ｦ縺・※繧よ綾縺呻ｼ・
    iframe.src = 'battle-engine.html?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // Skip a war match (auto-resolve)
  warSkipMatch(idx) {
    const wp = App._warPreview;
    if (!wp || wp.results[idx]) return;
    const m = wp.card[idx];
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week + idx));
    const result = Engine.event.resolveEventMatch(rng, m.playerFighter, m.aiFighter, 0);
    const playerWon = result.winner === 'left';
    const winnerFighter = playerWon ? m.playerFighter : m.aiFighter;
    wp.results[idx] = {
      playerFighter: m.playerFighter, aiFighter: m.aiFighter,
      winner: result.winner, mq: result.mq,
      playerWon,
      finType: result.finType || '', finMove: result.finMove || '',
      turns: result.turns || 0,
      victoryLine: _getWarVictoryLine(winnerFighter),
      winnerName: winnerFighter.name, winnerId: winnerFighter.id
    };
    Audio.play('tick');
    renderWarMatchPreview();
    if (wp.results.every(r => r !== null)) App.finalizeWar();
  },

  // Skip all remaining war matches
  warSkipAll() {
    const wp = App._warPreview;
    if (!wp) return;
    wp.card.forEach((m, idx) => {
      if (wp.results[idx]) return;
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week + idx));
      const result = Engine.event.resolveEventMatch(rng, m.playerFighter, m.aiFighter, 0);
      const playerWon = result.winner === 'left';
      const winnerFighter = playerWon ? m.playerFighter : m.aiFighter;
      wp.results[idx] = {
        playerFighter: m.playerFighter, aiFighter: m.aiFighter,
        winner: result.winner, mq: result.mq,
        playerWon,
        finType: result.finType || '', finMove: result.finMove || '',
        turns: result.turns || 0,
        victoryLine: _getWarVictoryLine(winnerFighter),
        winnerName: winnerFighter.name, winnerId: winnerFighter.id
      };
    });
    Audio.play('bellx3');
    App.finalizeWar();
  },

  // Receive battle engine result for war match
  _receiveWarBattleResult(data) {
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    const wp = App._warPreview;
    if (!wp || wp.currentWatching < 0) return;
    const idx = wp.currentWatching;
    // Replay 遘ｻ陦・ watchMatch 縺ｧ邨先棡縺ｯ譌｢縺ｫ譬ｼ邏肴ｸ医∩ (謨ｴ蜷域ｧ遒ｺ菫昴・縺溘ａ)縲Ｐverlay 繧帝哩縺倥※谺｡縺ｸ驕ｷ遘ｻ縲・
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    wp.currentWatching = -1;
    Audio.play('coin');
    renderWarMatchPreview();
    if (wp.results.every(r => r !== null)) {
      App.finalizeWar();
    } else {
      App._scheduleWarBgmResume(1600);
    }
  },

  // Finalize war: apply outcome to game state, show result
  finalizeWar() {
    const wp = App._warPreview;
    if (!wp) return;
    App._beginWarUiTransition();
    try { Audio.fileBgm.stop(); } catch(e) {}
    const ev = wp.ev;
    let playerWins = 0, aiWins = 0;
    wp.results.forEach(r => { if (r.playerWon) playerWins++; else aiWins++; });

    // Apply outcome to state
    const events = [];
    wp.results.forEach((r, i) => {
      const icon = r.playerWon ? '鳩' : '閥';
      events.push(`  ${icon} 隨ｬ${i+1}隧ｦ蜷・ ${r.playerFighter.name} vs ${r.aiFighter.name} 竊・${r.playerWon ? r.playerFighter.name : r.aiFighter.name}蜍晏茜 (MQ${r.mq})`);
    });
    const outcome = Engine.event.applyWarOutcome(G, playerWins, aiWins, ev.opponentOrgId);
    const eventWon = playerWins > aiWins;
    G = { ...outcome.state, gameLog: [...G.gameLog, ...events, ...outcome.events] };

    // 譁ｰ閨樒畑: 蟇ｾ謚玲姶邨先棡繧剃ｿ晏ｭ假ｼ域ｬ｡騾ｱ縺ｮ譁ｰ閨樒函謌舌〒菴ｿ逕ｨ・・
    G._newsWarResult = {
      opponentName: ev.opponentName,
      opponentOrgId: ev.opponentOrgId,
      playerWins,
      aiWins,
      won: playerWins > aiWins,
      draw: playerWins === aiWins,
      matches: wp.results.map(r => ({
        playerName: r.playerFighter.name,
        playerId: r.playerFighter.id,
        aiName: r.aiFighter.name,
        aiId: r.aiFighter.id,
        playerWon: r.playerWon,
        mq: r.mq,
      })),
    };

    // Phase 2: 蟇ｾ謚玲姶蜍晏茜驕ｸ謇九・trust bonus
    const winnerPlayerIds = wp.results.filter(r => r.playerWon).map(r => r.playerFighter.id);
    if (winnerPlayerIds.length > 0) {
      G = { ...G, roster: G.roster.map(c =>
        winnerPlayerIds.includes(c.id)
          ? { ...c, _trustBonus: (c._trustBonus || 0) + 2.3,
              _trustBonusSources: [...(c._trustBonusSources || []), 'warVictory'] }
          : c
      )};
    }

    // v1.3: Record war appearances for participating player fighters
    const warFighterIds = new Set(wp.card.map(m => m.playerFighter.id));
    G = { ...G, roster: G.roster.map(c => {
      if (!warFighterIds.has(c.id)) return c;
      const matchResult = wp.results.find(r => r.playerFighter.id === c.id);
      const oppName = matchResult ? matchResult.aiFighter?.name : undefined;
      return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: ev.opponentName, opponentName: oppName, won: matchResult ? matchResult.playerWon : false });
    }) };

    // AI蛛ｴ縺ｮ蟇ｾ謚玲姶蜃ｺ蝣ｴ驕ｸ謇九↓繧Ｄareer event險倬鹸
    const aiOrgId = ev.opponentOrgId;
    if (G.aiOrgs && G.aiOrgs[aiOrgId]) {
      const aiWarIds = new Set(wp.card.map(m => m.aiFighter.id));
      const updatedAiRoster = G.aiOrgs[aiOrgId].roster.map(c => {
        if (!aiWarIds.has(c.id)) return c;
        const matchResult = wp.results.find(r => r.aiFighter.id === c.id);
        const oppName = matchResult ? matchResult.playerFighter?.name : undefined;
        return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・, opponentName: oppName, won: matchResult ? !matchResult.playerWon : false });
      });
      G = { ...G, aiOrgs: { ...G.aiOrgs, [aiOrgId]: { ...G.aiOrgs[aiOrgId], roster: updatedAiRoster } } };
    }

    const evStats = { ...(G.seasonStats || {}) };
    if (eventWon) {
      evStats.eventsWon = (evStats.eventsWon || 0) + 1;
      // F2: Track war victories for negotiation bonus
      const wv = [...(G.warVictories || [])];
      if (!wv.includes(ev.opponentOrgId)) wv.push(ev.opponentOrgId);
      // 菫ｮ豁｣D: 蟇ｾ謚玲姶騾夂ｮ怜享蛻ｩ繧定ｨ倬鹸・医Ξ繧ｬ繧ｷ繝ｼpt險育ｮ礼畑・・
      const bwt = { ...(G.battleWinsTotal || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
      bwt.player = (bwt.player || 0) + 1;
      G = { ...G, warVictories: wv, battleWinsTotal: bwt };
      // 蟇ｾ謚玲姶繝槭う繝ｫ繧ｹ繝医・繝ｳ: 5蜍昴＃縺ｨ縺ｫ譁ｰ閨櫁ｨ倅ｺ・螢ｫ豌励ヶ繝ｼ繧ｹ繝・
      if (bwt.player % 5 === 0) {
        const mBoost = 3 + Math.min(2, Math.floor(bwt.player / 10)); // +3縲・5
        G = { ...G,
          _newsWarMilestone: { orgId: 'player', orgName: G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・, wins: bwt.player },
          lockerRoomMorale: Math.min(100, (G.lockerRoomMorale || 60) + mBoost),
        };
      }
    }
    else {
      evStats.eventsLost = (evStats.eventsLost || 0) + 1;
      // 菫ｮ豁｣D: AI蜍晏茜蛛ｴ繧りｨ倬鹸
      const bwt = { ...(G.battleWinsTotal || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
      bwt[ev.opponentOrgId] = (bwt[ev.opponentOrgId] || 0) + 1;
      G = { ...G, battleWinsTotal: bwt };
      // AI蛛ｴ縺ｮ蟇ｾ謚玲姶繝槭う繝ｫ繧ｹ繝医・繝ｳ: 5蜍昴＃縺ｨ縺ｫ譁ｰ閨櫁ｨ倅ｺ・
      if (bwt[ev.opponentOrgId] % 5 === 0) {
        G = { ...G,
          _newsWarMilestone: { orgId: ev.opponentOrgId, orgName: ev.opponentName, wins: bwt[ev.opponentOrgId] },
        };
      }
    }
    // 驥鷹姦繝舌Λ繝ｳ繧ｹ謾ｹ蝟・ 蟇ｾ謚玲姶繝｡繝・ぅ繧｢蜿主・
    const warMediaIncomes = G._pendingMediaIncomes ? [...G._pendingMediaIncomes] : [];
    let warMediaTotal = 0;
    wp.results.forEach(r => {
      const venueIdx = G.showVenue || 0;
      const venueMult = VENUE_MEDIA_MULT[venueIdx] || 1.0;
      warMediaTotal += Math.round(r.mq * MEDIA_CONFIG.eventPerMQ * venueMult * 1.5);
    });
    // JT蜃ｺ貍疲侭: 蜃ｺ蝣ｴ驕ｸ謇九・莠ｺ豌療怜・蝣ｴ隧ｦ蜷域焚
    let jtMediaTotal = 0;
    wp.results.forEach(r => {
      if (r.playerFighter) {
        const rev = Math.round((r.playerFighter.popularity || 1) * MEDIA_CONFIG.jtPerPop);
        jtMediaTotal += rev;
        // 繝｡繝・ぅ繧｢蜉溷感雉・ 蛟倶ｺｺ蛻･繝｡繝・ぅ繧｢蜿主・邏ｯ險医↓蜉邂・
        G = { ...G, roster: G.roster.map(c =>
          c.id === r.playerFighter.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
        )};
      }
      // AI蝗｣菴馴∈謇九・繝｡繝・ぅ繧｢蜿主・蛟倶ｺｺ繝医Λ繝・く繝ｳ繧ｰ・亥ｯｾ謚玲姶蜃ｺ蝣ｴ・・
      if (r.aiFighter && ev.opponentOrgId && G.aiOrgs && G.aiOrgs[ev.opponentOrgId]) {
        const aiRev = Math.round((r.aiFighter.popularity || 1) * MEDIA_CONFIG.jtPerPop);
        if (aiRev > 0) {
          const aiOrg = G.aiOrgs[ev.opponentOrgId];
          G = { ...G, aiOrgs: { ...G.aiOrgs, [ev.opponentOrgId]: {
            ...aiOrg, roster: aiOrg.roster.map(c =>
              c.id === r.aiFighter.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + aiRev } : c
            )
          }}};
        }
      }
    });
    if (warMediaTotal + jtMediaTotal > 0) {
      if (warMediaTotal > 0) warMediaIncomes.push({ amount: warMediaTotal, label: `蟇ｾ謚玲姶 vs ${ev.opponentName}` });
      if (jtMediaTotal > 0) warMediaIncomes.push({ amount: jtMediaTotal, label: '蟇ｾ謚玲姶蜃ｺ貍疲侭' });
      G = { ...G, _pendingMediaIncomes: warMediaIncomes };
    }

    G = { ...G, seasonStats: evStats, weekPhase: 'manage', lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] } };

    // recentMatches險倬鹸・亥ｯｾ謚玲姶・・
    let warRoster = [...G.roster];
    wp.results.forEach(r => {
      const winner = r.playerWon ? 'left' : 'right';
      warRoster = Engine.pushRecentMatch(warRoster, r.playerFighter.id, r.aiFighter.id, winner, G.season, G.week);
    });
    G = { ...G, roster: warRoster };

    // h2h險倬鹸: 蟇ｾ謚玲姶
    let warH2h = { ...(G.h2h || {}) };
    wp.results.forEach(r => {
      const winner = r.playerWon ? 'left' : 'right';
      const warMeta = App._buildMatchMeta(G, r.playerFighter.id, r.aiFighter.id, false);
      warH2h = Engine.h2h.update(warH2h, r.playerFighter.id, r.aiFighter.id, winner, r.mq, false, false, G.season, G.week, 'war', 'player', ev.opponentOrgId, warMeta);
    });
    G = { ...G, h2h: warH2h };

    // Phase 4 E-01: 蟇ｾ謚玲姶縺ｮ髢｢菫ょ､蜿肴丐 + applyMatchResult・・sCrossOrg=true・・
    if (G.relationships) {
      const warRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE5A));
      let relState = { ...G };
      // 蟇ｾ謌ｦ縺励◆驕ｸ謇矩俣: applyMatchResult 縺ｧ蜈ｨ繧､繝吶Φ繝亥愛螳夲ｼ井ｻ門屮菴捺姶繝悶・繧ｹ繝井ｻ倥″・・
      wp.results.forEach(r => {
        const playerId = r.playerFighter.id;
        const aiId = r.aiFighter.id;
        const warContext = {
          mq: r.mq,
          winner: r.playerWon ? 'win' : 'lose',
          hpA: r.hpLeft || { final: 50, max: 100 }, hpB: r.hpRight || { final: 50, max: 100 },
          turns: r.turns || 10,
          stage: 'normal',
          isTitleMatch: false,
          rivalryResolved: false,
          injuredId: null,
          isCareerBestA: r.mq > (r.playerFighter.careerBestMQ || 0),
          isCareerBestB: false,
          losingStreakA: r.playerFighter.losingStreak || 0,
          losingStreakB: 0,
          ovrA: Engine.util.ov(r.playerFighter),
          ovrB: Engine.util.ov(r.aiFighter),
          isCrossOrg: true,
        };
        relState = Engine.relationships.applyMatchResult(relState, playerId, aiId, warContext, warRelRng);
      });
      // 繝√・繝繝｡繧､繝磯俣: bond +2~+4
      const participantIds = [...warFighterIds];
      if (participantIds.length >= 2) {
        relState = Engine.relationships.applyAllPairs(relState, participantIds,
          { min: 2, max: 4 }, { min: 0, max: 0 }, warRelRng);
      }
      G = { ...G, relationships: relState.relationships };
    }

    // 笏笏 v4 ﾂｧ2-1: F02竭｢ 豎ｺ逹 蛻､螳夲ｼ亥ｯｾ謚玲姶・・笏笏
    if (Engine.factions && typeof Engine.factions.rollResolutionAfterMatch === 'function' && !G._pendingFactionEvent) {
      for (let i = 0; i < wp.results.length; i++) {
        const r = wp.results[i];
        if (!r || !r.playerFighter || !r.aiFighter) continue;
        const winnerId = r.playerWon ? r.playerFighter.id : r.aiFighter.id;
        const loserId  = r.playerWon ? r.aiFighter.id : r.playerFighter.id;
        const res = Engine.factions.rollResolutionAfterMatch(G, { winnerId, loserId, isDraw: false });
        G = res.state;
        if (res.pendingEvent) { G = { ...G, _pendingFactionEvent: res.pendingEvent }; break; }
      }
    }

    Storage.autoSave();

    // Swap content directly (no close竊池eopen gap that would flash event screen)
    renderWarFinalResult(ev, wp.results, playerWins, aiWins, eventWon);
    App._warPreview = null;
  }
};

// 笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武
//  PPV GRAND FINAL: Show Day System (Step 4)
// 笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武
App._ppvPreview = null;

App.initPPVShow = function() {
  const ppvDay = Engine.ppv.preparePPVDay(G);
  App._ppvPreview = {
    card: ppvDay.card,
    substitutions: ppvDay.substitutions,
    summitPair: ppvDay.summitPair,
    results: new Array(ppvDay.card.length).fill(null),
    currentWatching: -1,
  };
  try { Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 }); } catch(e) {}

  // 繧ｫ繝ｼ繝峨′遨ｺ縺ｮ蝣ｴ蜷医・蜊ｳ蠎ｧ縺ｫfinalize・医せ繧ｿ繝・け髦ｲ豁｢・・
  if (ppvDay.card.length === 0) {
    console.warn('[WM Debug] PPV card is empty 窶・entries:', JSON.stringify(G.ppvEntries ? Object.fromEntries(Object.entries(G.ppvEntries).map(([k,v]) => [k, (v||[]).length])) : 'null'));
    showEventPopup({
      type: 'system', tone: 'negative',
      message: '繧ｫ繝ｼ繝臥ｷｨ謌蝉ｸ肴・遶・,
      detail: '蜃ｺ蝣ｴ蜿ｯ閭ｽ縺ｪ驕ｸ謇九′荳崎ｶｳ縺励※縺翫ｊ縲∝ｯｾ謌ｦ繧ｫ繝ｼ繝峨ｒ邨・ａ縺ｾ縺帙ｓ縺ｧ縺励◆',
    });
    setTimeout(() => App.finalizePPV(), 1500);
    return;
  }

  // 莉｣譖ｿ騾夂衍繝昴ャ繝励い繝・・
  if (ppvDay.substitutions.length > 0) {
    let popupChain = Promise.resolve();
    ppvDay.substitutions.forEach(sub => {
      const orgName = sub.orgId === 'player' ? (G.orgName || '閾ｪ蝗｣菴・) : (RIVAL_ORGS.find(o => o.id === sub.orgId)?.name || sub.orgId);
      popupChain = popupChain.then(() => new Promise(resolve => {
        showEventPopup({
          type: 'fighter', id: sub.originalId, name: sub.original,
          tone: 'negative',
          message: `${sub.original}縺悟・蝣ｴ荳崎・・～,
          detail: `${orgName}縺ｮ${sub.substitute}縺檎ｷ頑･蜃ｺ蝣ｴ`,
        });
        setTimeout(resolve, 1500);
      }));
    });
    popupChain.then(() => showPPVMatchCardIntro(() => renderPPVMatchPreview()));
  } else {
    showPPVMatchCardIntro(() => renderPPVMatchPreview());
  }
};

App.ppvWatchMatch = function(idx) {
  const pp = App._ppvPreview;
  if (!pp || pp.results[idx]) return;
  pp.currentWatching = idx;
  const match = pp.card[idx];

  // Replay: 邨先棡莠句燕險育ｮ・(skip 縺ｨ蜷・seed)
  const ppvRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id));
  const ppvResult = Engine.ppv.simulatePPVMatch(match.left, match.right, ppvRng, { recordFrames: true });
  pp.results[idx] = ppvResult;

  const overlay = document.getElementById('battleOverlay');
  overlay.style.display = 'block';
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  clearTimeout(App._escBtnTimer);
  App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

  const iframe = document.getElementById('battleIframe');
  const total = pp.card.length;
  const matchNum = idx + 1;
  const msg = {
    type: 'START_MATCH',
    left: {
      ...match.left, condition: 80,
      portraitUrl: getPortraitUrl(match.left.id), profile: CHAR_PROFILES[match.left.id] || '',
      vl: match.left.voiceLines || match.left.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[match.left.id]) || ['窶ｦ・・]
    },
    right: {
      ...match.right, condition: 80,
      portraitUrl: getPortraitUrl(match.right.id), profile: CHAR_PROFILES[match.right.id] || '',
      vl: match.right.voiceLines || match.right.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[match.right.id]) || ['窶ｦ・・]
    },
    matchInfo: {
      header: match.isSummit ? '醇 鬆ゆｸ頑ｱｺ謌ｦ' : `PPV 隨ｬ${matchNum}隧ｦ蜷・,
      subHeader: `${match.left.name} vs ${match.right.name}`,
      matchNum,
      totalMatches: total,
      isTitle: false,
      isSpecialMatch: matchNum === total,
      matchTier: 2,
      rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, match.left.id, match.right.id); return rl ? rl.tier : 0; })(),
      leftPersonality: match.left.personality || 'normal',
      leftArchetype: match.left.archetype || 'normal',
      rightPersonality: match.right.personality || 'normal',
      rightArchetype: match.right.archetype || 'normal',
      sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
    },
    result: ppvResult,
  };
  // 繝薙ャ繧ｰ繝槭ャ繝。GM・・PV・・
  try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
  let sent = false;
  const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
  iframe.onload = () => setTimeout(sendOnce, 200);
  iframe.src = 'battle-engine.html?t=' + Date.now();
  setTimeout(sendOnce, 800);
};

App.ppvSkipMatch = function(idx) {
  const pp = App._ppvPreview;
  if (!pp || pp.results[idx]) return;
  const match = pp.card[idx];
  const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id));
  pp.results[idx] = Engine.ppv.simulatePPVMatch(match.left, match.right, matchRng);
  Audio.play('tick');
  renderPPVMatchPreview();
  if (pp.results.every(r => r !== null)) App.finalizePPV();
};

App.ppvSkipAll = function() {
  const pp = App._ppvPreview;
  if (!pp) return;
  pp.card.forEach((match, idx) => {
    if (pp.results[idx]) return;
    const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id));
    pp.results[idx] = Engine.ppv.simulatePPVMatch(match.left, match.right, matchRng);
  });
  Audio.play('bellx3');
  App.finalizePPV();
};

App._receivePPVBattleResult = function(data) {
  clearTimeout(App._escBtnTimer);
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  const pp = App._ppvPreview;
  if (!pp || pp.currentWatching < 0) return;
  const idx = pp.currentWatching;
  // Replay 遘ｻ陦・ 莠句燕險育ｮ玲ｸ医∩縺ｪ繧臥ｵ先棡繧堤ｶｭ謖√＠ overlay 繧帝哩縺倥※谺｡縺ｸ
  if (pp.results[idx]) {
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    pp.currentWatching = -1;
    try { Audio.play('coin'); } catch(e) {}
    renderPPVMatchPreview();
    if (pp.results.every(r => r !== null)) App.finalizePPV();
    else setTimeout(() => { if (App._ppvPreview) { try { Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 }); } catch(e) {} } }, 1600);
    return;
  }
  const match = pp.card[idx];
  pp.results[idx] = {
    left: match.left, right: match.right,
    winner: data.winner,
    finType: data.finType || '', finMove: data.finMove || '',
    turns: data.turns || 0,
    mq: data.mq || 50,
    hpLeft: { final: data.hpLeft ? data.hpLeft.current : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
    hpRight: { final: data.hpRight ? data.hpRight.current : 0, max: data.hpRight ? data.hpRight.max : 100 },
    log: data.log || []
  };
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  document.getElementById('battleOverlay').style.display = 'none';
  pp.currentWatching = -1;
  try { Audio.play('coin'); } catch(e) {}
  renderPPVMatchPreview();
  if (pp.results.every(r => r !== null)) {
    App.finalizePPV();
  } else {
    // 縺ｾ縺隧ｦ蜷医′谿九▲縺ｦ縺・ｋ 竊・PPV BGM繧貞・髢・
    setTimeout(() => { if (App._ppvPreview) { try { Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 }); } catch(e) {} } }, 1600);
  }
};

App.finalizePPV = function() {
  const pp = App._ppvPreview;
  if (!pp) return;
  if (pp.results.some(r => r === null)) return;

  // 邨先棡蜿肴丐
  const result = Engine.ppv.applyPPVResults(G, pp.card, pp.results, pp.summitPair);
  let s = result.state;
  // forcedRest・・3莨鷹､企｡倥＞・峨ヵ繝ｩ繧ｰ繧偵け繝ｪ繧｢
  let roster = s.roster.map(c => c.forcedRest ? { ...c, forcedRest: false } : { ...c });
  const events = result.events;

  // Step 5-6: 繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ蛻､螳・+ careerBestMQ + 繧ｹ繝ｩ繝ｳ繝・+ 繝｢繝√・蝟ｪ螟ｱ
  const pendingGrowthEvents = [];
  const btRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF7));
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    [
      { fId: match.left.id, oppF: match.right, won: r.winner === 'left' },
      { fId: match.right.id, oppF: match.left, won: r.winner === 'right' },
    ].forEach(({ fId, oppF, won }) => {
      const fighter = roster.find(c => c.id === fId);
      if (!fighter) return; // 繝励Ξ繧､繝､繝ｼ謇螻槭〒縺ｪ縺・
      const oppOvr = Engine.util.ov(oppF);
      const isRivalryResolution = !!r.rivalryResolved;

      // 繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ蛻､螳・
      const btContext = { isTitle: false, won, isPPV: true, isRivalryResolution, isWarMatch: false };
      const btResult = Engine.growthEvents.checkAndApplyBreakthrough(
        btRng, fighter, r.mq, oppOvr, btContext, s.season, s.week, Engine.coach.getFlavorBreakthroughMult(s, fighter.id)
      );
      if (btResult) {
        roster = roster.map(c => c.id === fId ? btResult.fighter : c);
        const btHintFighterPPV = roster.find(c => c.id === fId) || fighter;
        const btHintLinePPV = pickDialogueLine(BT_HINT_LINES, btHintFighterPPV);
        pendingGrowthEvents.push({
          type: 'breakthrough', fighterId: fId,
          stat: btResult.stat, gain: btResult.gain, hotStreak: btResult.hotStreak,
          btHint: btHintLinePPV
        });
        // Phase 4 G-01: 繝悶Ξ繝ｼ繧ｯ繧ｹ繝ｫ繝ｼ 竊・髢｢菫ょ､蜿肴丐
        if (s.relationships) {
          const btRelRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE57, fId));
          s = Engine.relationships.applyBreakthroughEffect(s, fId, btRelRng);
        }
      }

      // careerBestMQ 譖ｴ譁ｰ
      const updatedFighter = roster.find(c => c.id === fId);
      if (r.mq > (updatedFighter.careerBestMQ || 0)) {
        roster = roster.map(c => c.id === fId ? { ...c, careerBestMQ: r.mq } : c);
      }

      // 謨怜圏繧ｹ繝ｩ繝ｳ繝怜愛螳・
      if (!won) {
        const slumpRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF8, fId));
        const slumpFighter = roster.find(c => c.id === fId);
        if (Engine.growthEvents.checkSlump(slumpRng, slumpFighter, 'defeat')) {
          const newF = Engine.growthEvents.applySlump(slumpFighter, 'defeat', s.season, s.week);
          roster = roster.map(c => c.id === fId ? newF : c);
          pendingGrowthEvents.push({ type: 'slump_start', fighterId: fId, trigger: 'defeat' });
          // Phase 4 G-03: 繧ｹ繝ｩ繝ｳ繝・竊・髢｢菫ょ､蜿肴丐
          if (s.relationships) {
            const symRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE58, fId));
            s = Engine.relationships.applySympathyEffect(s, fId, { min: 1, max: 2 }, symRng);
            // N-05: 繧ｹ繝ｩ繝ｳ繝怜・縺､蠖薙◆繧・
            const lashRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6E, fId));
            s = Engine.relationships.applySlumpLashout({ ...s, roster }, fId, lashRng);
          }
        }
      }

      // momentum譖ｴ譁ｰ + 繝｢繝√・蝟ｪ螟ｱ繝√ぉ繝・け
      const momRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF9, fId));
      const momFighter = roster.find(c => c.id === fId);
      let updF = Engine.growthEvents.updateSlumpMomentumAfterMatch(momFighter, r.mq, won, momRng);
      updF = Engine.growthEvents.updateMotivationLossMomentumAfterMatch(updF, r.mq, won, momRng);
      if (!won && updF.slump) {
        const mlRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBFA, fId));
        if (Engine.growthEvents.checkMotivationLoss(mlRng, updF, 'defeat')) {
          updF = Engine.growthEvents.applyMotivationLoss(updF, s.season, s.week);
          pendingGrowthEvents.push({ type: 'motivation_loss_start', fighterId: fId });
          // Phase 4 G-06: 繝｢繝√・蝟ｪ螟ｱ 竊・髢｢菫ょ､蜿肴丐
          if (s.relationships) {
            const symRng2 = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE59, fId));
            s = Engine.relationships.applySympathyEffect(s, fId, { min: 1, max: 1 }, symRng2);
          }
        }
      }
      if (updF !== momFighter) {
        roster = roster.map(c => c.id === fId ? updF : c);
      }
    });
  });

  s = { ...s, roster };

  // 驥鷹姦繝舌Λ繝ｳ繧ｹ謾ｹ蝟・ PPV繝｡繝・ぅ繧｢蜿主・・亥・貍疲侭・・
  const ppvMediaIncomes = s._pendingMediaIncomes ? [...s._pendingMediaIncomes] : [];
  let ppvMediaTotal = 0;
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    // 繧ｫ繝ｼ繝我ｽ咲ｽｮ蛻､螳・ summit縺ｪ繧盈ain縲∵怙蠕後°繧・逡ｪ逶ｮ縺ｪ繧鋭emi縲√◎繧御ｻ･螟悶・隧ｦ蜷域焚縺ｧ蛻､螳・
    let position = 'mid';
    if (match.isSummit) position = 'main';
    else if (idx === pp.results.length - 2) position = 'semi';
    else if (idx < Math.floor(pp.results.length / 2)) position = 'under';
    const cardMult = PPV_CARD_MULT[position] || PPV_CARD_MULT.mid;
    [match.left, match.right].forEach(f => {
      if (!f) return;
      const rev = Math.round((f.popularity || 1) * MEDIA_CONFIG.ppvPerPop * cardMult);
      if (rev <= 0) return;
      if (f._ppvOrgId === 'player') {
        ppvMediaTotal += rev;
        // 繝｡繝・ぅ繧｢蜉溷感雉・ 蛟倶ｺｺ蛻･繝｡繝・ぅ繧｢蜿主・邏ｯ險医↓蜉邂・
        s = { ...s, roster: s.roster.map(c =>
          c.id === f.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
        )};
      } else if (f._ppvOrgId && s.aiOrgs && s.aiOrgs[f._ppvOrgId]) {
        // AI蝗｣菴馴∈謇九・繝｡繝・ぅ繧｢蜿主・蛟倶ｺｺ繝医Λ繝・く繝ｳ繧ｰ
        const aiOrg = s.aiOrgs[f._ppvOrgId];
        s = { ...s, aiOrgs: { ...s.aiOrgs, [f._ppvOrgId]: {
          ...aiOrg, roster: aiOrg.roster.map(c =>
            c.id === f.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
          )
        }}};
      }
    });
  });
  if (ppvMediaTotal > 0) {
    ppvMediaIncomes.push({ amount: ppvMediaTotal, label: 'PPV蜃ｺ貍疲侭' });
    s = { ...s, _pendingMediaIncomes: ppvMediaIncomes };
  }

  // 譁ｰ閨樒畑: 鬆ゆｸ頑ｱｺ謌ｦ邨先棡繧剃ｿ晏ｭ假ｼ域ｬ｡騾ｱ縺ｮ譁ｰ閨樒函謌舌〒菴ｿ逕ｨ・・
  if (pp.summitPair) {
    const summitIdx = pp.card.findIndex(m => m.isSummit);
    if (summitIdx >= 0) {
      const sr = pp.results[summitIdx];
      const sm = pp.card[summitIdx];
      const sp = pp.summitPair;
      // 閾ｪ蝗｣菴捺園螻槭ｒ蜴ｳ蟇・愛螳壹Ｑlayer荳榊惠縺ｮTV繝｢繝ｼ繝峨〒縺ｯ playerInvolved=false
      const leftIsPlayer = sm.left._ppvOrgId === 'player';
      const rightIsPlayer = sm.right._ppvOrgId === 'player';
      const playerInvolved = leftIsPlayer || rightIsPlayer;
      const playerF = leftIsPlayer ? sm.left : (rightIsPlayer ? sm.right : sm.left);
      const aiF = (playerF === sm.left) ? sm.right : sm.left;
      const playerWon = playerInvolved && (
        (sr.winner === 'left' && playerF === sm.left) ||
        (sr.winner === 'right' && playerF === sm.right)
      );
      const winnerF = sr.winner === 'left' ? sm.left : (sr.winner === 'right' ? sm.right : null);
      const loserF = winnerF ? (winnerF === sm.left ? sm.right : sm.left) : null;

      // 蝗｣菴灘錐・医・繝ｬ繧､繝､繝ｼ蛛ｴ / 逶ｸ謇句・・・
      const orgNameOf = (orgId) => orgId === 'player' ? (G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・) : (G.aiOrgs?.[orgId]?.name || '逶ｸ謇句屮菴・);
      const playerOrgName = playerInvolved ? (G.orgName || '繝励Ξ繧､繝､繝ｼ蝗｣菴・)
        : orgNameOf(sp.org1Id);
      const aiOrgId = playerInvolved
        ? (sp.org1Id === 'player' ? sp.org2Id : sp.org1Id)
        : sp.org2Id;
      const aiOrgName = orgNameOf(aiOrgId);

      // 繝ｩ繝ｳ繧ｭ繝ｳ繧ｰ
      const rankings = G.rankings || [];
      const playerOrgIdLookup = playerInvolved ? 'player' : sp.org1Id;
      const playerRank = (rankings.find(r => r.orgId === playerOrgIdLookup) || {}).rank || null;
      const aiRank = (rankings.find(r => r.orgId === aiOrgId) || {}).rank || null;

      // h2h・域峩譁ｰ蜑阪↑縺ｮ縺ｧprior・・
      const priorH2h = playerF && aiF ? Engine.h2h.getRecordFor(G, playerF.id, aiF.id) : null;

      // HP谿矩㍼
      const winnerSide = sr.winner;
      const winnerHpFinal = winnerSide === 'left' ? (sr.hpLeft?.final ?? 0) : (sr.hpRight?.final ?? 0);
      const winnerHpMax = winnerSide === 'left' ? (sr.hpLeft?.max ?? 100) : (sr.hpRight?.max ?? 100);
      const loserHpFinal = winnerSide === 'left' ? (sr.hpRight?.final ?? 0) : (sr.hpLeft?.final ?? 0);
      const loserHpMax = winnerSide === 'left' ? (sr.hpRight?.max ?? 100) : (sr.hpLeft?.max ?? 100);

      // 蜍晁・そ繝ｪ繝包ｼ郁・蝗｣菴灘享蛻ｩ譎ゅ・縺ｿ縲￣PV_SUMMIT_VICTORY_LINES縺九ｉ1譛ｬ・・
      let winnerLine = null;
      if (playerWon && winnerF && typeof PPV_SUMMIT_VICTORY_LINES !== 'undefined' && typeof pickDialogueLine === 'function') {
        try { winnerLine = pickDialogueLine(PPV_SUMMIT_VICTORY_LINES, winnerF); } catch (e) {}
      }

      s._newsSummitResult = {
        playerInvolved,
        playerName: playerF.name,
        playerId: playerF.id,
        playerOrgName,
        aiName: aiF.name,
        aiId: aiF.id,
        aiOrgName,
        opponentName: aiOrgName, // 蠕梧婿莠呈鋤
        won: playerWon,
        winnerName: winnerF ? winnerF.name : null,
        winnerId: winnerF ? winnerF.id : null,
        loserName: loserF ? loserF.name : null,
        loserId: loserF ? loserF.id : null,
        mq: sr.mq,
        finType: sr.finType,
        finMove: sr.finMove,
        finishPhase: sr.finishPhase,
        turns: sr.turns,
        winnerHpFinal, winnerHpMax,
        loserHpFinal, loserHpMax,
        playerRank, aiRank,
        priorH2h: priorH2h ? { wins: priorH2h.wins, losses: priorH2h.losses, draws: priorH2h.draws, matches: priorH2h.matches } : null,
        winnerLine,
      };
    }
  }

  // recentMatches險倬鹸・・PV・・
  let ppvRoster = [...(s.roster || G.roster)];
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    ppvRoster = Engine.pushRecentMatch(ppvRoster, match.left.id, match.right.id, r.winner, s.season, s.week);
  });
  s = { ...s, roster: ppvRoster };

  // h2h險倬鹸: PPV・亥粋蜷瑚・陦後・縺溘ａ蜷・∈謇九・謇螻槭ｒ蛻､螳夲ｼ・
  const _findOrgKey = (fid) => {
    if ((s.roster || []).some(c => c.id === fid)) return 'player';
    const aiOrgs = s.aiOrgs || {};
    for (const k in aiOrgs) {
      if ((aiOrgs[k].roster || []).some(c => c.id === fid)) return k;
    }
    return undefined;
  };
  let ppvH2h = { ...(s.h2h || {}) };
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    const lOrg = _findOrgKey(match.left.id);
    const rOrg = _findOrgKey(match.right.id);
    const ppvMeta = App._buildMatchMeta(s, match.left.id, match.right.id, false);
    ppvH2h = Engine.h2h.update(ppvH2h, match.left.id, match.right.id, r.winner, r.mq, false, true, s.season, s.week, 'ppv', lOrg, rOrg, ppvMeta);
  });
  s = { ...s, h2h: ppvH2h };

  // 繧ｷ繝ｼ繧ｺ繝ｳstats譖ｴ譁ｰ
  const stats = { ...(G.seasonStats || {}) };
  stats.showCount = (stats.showCount || 0) + 1;
  pp.results.forEach(r => {
    if (r.mq > (stats.bestMQ || 0)) { stats.bestMQ = r.mq; stats.bestMQMatch = `${r.left?.name || '?'} vs ${r.right?.name || '?'}`; }
  });

  G = { ...G, ...s, seasonStats: stats, weekPhase: 'showExec', gameLog: [...G.gameLog, ...events] };

  // 繝昴ャ繝励い繝・・逕ｨ繝・・繧ｿ繧剃ｿ晏ｭ・
  if (pendingGrowthEvents.length > 0) {
    G = { ...G, _pendingGrowthEvents: pendingGrowthEvents };
  }
  App._pendingRivalryResolutions = result.rivalryResolutions || [];

  const savedCard = pp.card;
  const savedResults = pp.results;
  const savedSummitPair = pp.summitPair;
  const savedHeatChange = result.heatChange;
  const savedMQBonuses = result.mqBonuses;
  App._ppvPreview = null;

  try { Audio.fileBgm.stop(); } catch(e) {}
  Audio.bgm.playJingle('victory');
  renderPPVResult(savedCard, savedResults, savedSummitPair, savedHeatChange, savedMQBonuses);
};

App.closePPVResult = function() {
  const resultOverlay = document.getElementById('showResultOverlay');
  resultOverlay.classList.remove('active');
  Audio.play('coin');
  Audio.bgm.play('management');

  // Step 5-6: 繝昴ャ繝励い繝・・逕ｨ繝・・繧ｿ蜿門ｾ・+ G縺九ｉ繧ｯ繝ｪ繧｢
  const pendingGrowthEventsShow = G._pendingGrowthEvents || [];
  if (G._pendingGrowthEvents) {
    const { _pendingGrowthEvents: _, ...cleanG } = G;
    G = cleanG;
  }
  const pendingResolutions = App._pendingRivalryResolutions || [];
  App._pendingRivalryResolutions = [];

  // tickWeek竊痴ettlement竊蜘eek48螳御ｺ・
  const result = Engine.tickWeek(G);
  const stats = { ...G.seasonStats };
  if (result.state.weeklyFinance) {
    stats.totalRevenue += result.state.weeklyFinance.income || 0;
    stats.totalExpense += result.state.weeklyFinance.expense || 0;
  }
  const fh = [...(G.fundsHistory || []), result.state.funds];
  G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };
  G = { ...G, showCard: [] };

  App._refreshTicker();
  
  App.checkSurvivalUpdate();
  // Step 5-6: 繝舌ヵ豸郁ｲｻ
  App._tickMilestoneBuffsShow();
  App._applyWeeklyBuffEffects();
  App._tickMilestoneBuffsWeekly();
  Storage.autoSave();

  // Step 5-6: 繝昴ャ繝励い繝・・繝√ぉ繝ｼ繝ｳ・磯・・↓邨・∩遶九※: growth 竊・resolution・・
  let nextAction = null;
  if (pendingGrowthEventsShow.length > 0) {
    const after = nextAction;
    nextAction = () => showGrowthEventPopups(pendingGrowthEventsShow, after || (() => {}));
  }
  if (pendingResolutions.length > 0) {
    const after = nextAction;
    nextAction = () => showRivalryPopups(pendingResolutions, after || (() => {}));
  }
  if (nextAction) {
    setTimeout(nextAction, 200);
  }

  // P4-P6: PPV蠕後・Glimpse陦ｨ遉ｺ
  if (G._pendingGlimpseA || G._pendingGlimpseB) {
    const gA = G._pendingGlimpseA || null;
    const gB = G._pendingGlimpseB || null;
    if (G._pendingGlimpseA) { const { _pendingGlimpseA: _, ...c } = G; G = c; }
    if (G._pendingGlimpseB) { const { _pendingGlimpseB: _, ...c } = G; G = c; }
    const allGlimpses = [...(gA || []), ...(gB || [])];
    const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
    const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));
    if (tier2.length > 0) {
      G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
      refreshDojoLogFeed();
    }
    if (tier1.length > 0) {
      setTimeout(() => { tier1.forEach(g => showGlimpseAModal(g)); }, 500);
    }
  }

  // PPV蜿ょ刈貂医∩竊探V荳ｭ邯吶ヵ繧ｧ繝ｼ繧ｺ繧偵せ繧ｭ繝・・縺礼峩謗･繧ｪ繝輔す繝ｼ繧ｺ繝ｳ縺ｸ
  G = { ...G, ppvPhase: null };
  Storage.autoSave();
  App.advanceWeek();
};

App.initPPVTV = function() {
  const tvRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF5));
  const tvResult = Engine.ppv.simulateTVResults(G, tvRng);

  // battlePoints + orgWarRecord 蜿肴丐
  G = { ...G, battlePoints: tvResult.battlePoints, orgWarRecord: tvResult.orgWarRecord || G.orgWarRecord, gameLog: [...G.gameLog, ...tvResult.events] };

  _chainEventPopupQueueEmpty(() => {
    renderPPVTVResult(tvResult.card, tvResult.results, G.ppvName);
  });

  showEventPopup({
    type: 'system',
    emoji: '銅',
    tone: 'gold',
    name: G.ppvName || 'PPV GRAND FINAL',
    message: '縺､縺・↓蟷ｴ髢鍋ｷ乗ｱｺ邂励・PPV蠖捺律縺ｧ縺吶ゅ≠縺ｨ荳豁ｩ螻翫°縺壹∫ｧ√◆縺｡縺ｮ蜷榊燕縺ｯ莉雁､懊・繧ｫ繝ｼ繝峨↓縺ゅｊ縺ｾ縺帙ｓ縲よｔ縺励＆縺ｯ縺ゅｊ縺ｾ縺吶′縲√∪縺壹・莉門屮菴薙・螟ｧ荳逡ｪ繧偵ユ繝ｬ繝薙〒遒ｺ隱阪＠縺ｾ縺励ｇ縺・・
  });
};

App.closePPVTV = function() {
  const overlay = document.getElementById('showResultOverlay');
  overlay.classList.remove('active');
  Audio.play('coin');

  // tickWeek: PPV TV隕ｳ謌ｦ荳ｭ縺ｧ繧るｱ谺｡蜃ｦ逅・ｼ郁ｨ鍋ｷｴ繝ｻ邨ｦ荳弱・髢｢菫ょ､・峨・螳溯｡後☆繧・
  const result = Engine.tickWeek(G);
  const stats = { ...G.seasonStats };
  if (result.state.weeklyFinance) {
    stats.totalRevenue += result.state.weeklyFinance.income || 0;
    stats.totalExpense += result.state.weeklyFinance.expense || 0;
  }
  if (result.state.funds > stats.peakFunds) stats.peakFunds = result.state.funds;
  if ((result.state.orgPop || 0) > stats.peakPop) stats.peakPop = result.state.orgPop || 0;
  const fh = [...(G.fundsHistory || []), result.state.funds];
  G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };

  App._refreshTicker();
  
  App.checkSurvivalUpdate();
  App._applyWeeklyBuffEffects();
  App._tickMilestoneBuffsWeekly();

  // P4-P6: PPV TV蠕後・Glimpse陦ｨ遉ｺ
  if (G._pendingGlimpseA || G._pendingGlimpseB) {
    const gA = G._pendingGlimpseA || null;
    const gB = G._pendingGlimpseB || null;
    if (G._pendingGlimpseA) { const { _pendingGlimpseA: _, ...c } = G; G = c; }
    if (G._pendingGlimpseB) { const { _pendingGlimpseB: _, ...c } = G; G = c; }
    const allGlimpses = [...(gA || []), ...(gB || [])];
    const tier1 = allGlimpses.filter(g => _isGlimpseTier1(g));
    const tier2 = allGlimpses.filter(g => !_isGlimpseTier1(g));
    if (tier2.length > 0) {
      G = { ...G, weekLogFeed: [...(G.weekLogFeed || []), ...tier2] };
      refreshDojoLogFeed();
    }
    if (tier1.length > 0) {
      setTimeout(() => { tier1.forEach(g => showGlimpseAModal(g)); }, 500);
    }
  }

  // ppvPhase繧ｯ繝ｪ繧｢竊誕dvanceWeek竊偵が繝輔す繝ｼ繧ｺ繝ｳ縺ｸ
  G = { ...G, ppvPhase: null };
  Storage.autoSave();
  App.advanceWeek();
};

// 笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武
//  U-20 繧ｸ繝･繝九い繝医・繝翫Γ繝ｳ繝・UI 繝輔Ο繝ｼ
// 笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武笊絶武
App._jtPreview = null; // 繝医・繝翫Γ繝ｳ繝磯ｲ陦後ョ繝ｼ繧ｿ

App.initJuniorTournament = function() {
  const sel = G._juniorTournamentSelection;
  if (!sel || sel.cancelled) {
    // 荳埼幕蛯ｬ 竊・騾壼ｸｸ騾ｱ縺ｫ謌ｻ縺・
    G = { ...G, weekPhase: 'manage' };
    delete G._juniorTournamentSelection;
    showScreen('week');
    return;
  }
  const jtRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB10));
  const jtResult = Engine.juniorTournament.run(G, sel.participants, jtRng);

  // 閾ｪ蝗｣菴薙・蜃ｺ蝣ｴ驕ｸ謇九ｒ謚ｽ蜃ｺ・医Ξ繝ｳ繧ｿ繝ｫ驕ｸ謇九・蜈・園螻槫屮菴捺棧縺ｧ蜃ｺ蝣ｴ縺吶ｋ縺溘ａ髯､螟厄ｼ・
  const playerIds = new Set((G.roster || []).filter(f => !f.isRental).map(f => f.id));
  const myParticipants = jtResult.rounds[0].matches
    .flatMap(m => [m.left, m.right])
    .filter(p => playerIds.has(p.id));

  App._jtPreview = {
    selection: sel,
    result: jtResult,
    currentRound: 0,
    currentMatch: 0,
    phase: myParticipants.length > 0 ? 'summon' : 'bracket',
    summonIndex: 0,
    myParticipants,
  };
  try { Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 }); } catch(e) {}
  if (myParticipants.length > 0) {
    Audio.play('notify');
    renderJuniorTournamentSummon();
  } else {
    renderJuniorTournamentBracket();
  }
};

App.jtNextSummon = function() {
  const jt = App._jtPreview;
  if (!jt) return;
  jt.summonIndex++;
  if (jt.summonIndex >= jt.myParticipants.length) {
    jt.phase = 'bracket';
    Audio.play('tick');
    renderJuniorTournamentBracket();
  } else {
    Audio.play('notify');
    renderJuniorTournamentSummon();
  }
};

App.jtWatchMatch = function(roundIdx, matchIdx) {
  const jt = App._jtPreview;
  if (!jt) return;
  jt.currentRound = roundIdx;
  jt.currentMatch = matchIdx;
  jt.phase = 'watching';

  const round = jt.result.rounds[roundIdx];
  const match = round.matches[matchIdx];
  const isFinal = roundIdx === jt.result.rounds.length - 1;

  // battle-engine iframe 縺ｫ隧ｦ蜷医ョ繝ｼ繧ｿ繧帝√ｋ・・attleOverlay + battleIframe 繧剃ｽｿ逕ｨ・・
  const overlay = document.getElementById('battleOverlay');
  overlay.style.display = 'block';
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  clearTimeout(App._escBtnTimer);
  App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);

  const iframe = document.getElementById('battleIframe');
  if (!iframe) return;

  const leftF = (G.roster || []).find(f => f.id === match.left.id)
    || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === match.left.id)
    || match.left;
  const rightF = (G.roster || []).find(f => f.id === match.right.id)
    || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === match.right.id)
    || match.right;

  const roundLabel = round.name === 'final' ? '豎ｺ蜍・ : round.name === 'semiFinal' ? '貅匁ｱｺ蜍・ : '貅悶・ｱｺ蜍・;
  // Replay: 莠句燕繧ｷ繝溘Η貂医∩縺ｮ match 縺九ｉ frames+winner 遲峨ｒ result 縺ｨ縺励※邨・∩遶九※繧・
  const jtResult = {
    winner: match.winner, mq: match.mq, turns: match.turns,
    finType: match.finType || '', finMove: match.finMove || '',
    hpLeft: match.hpLeft, hpRight: match.hpRight,
    log: match.log || [], frames: match.frames || [],
  };
  const msg = {
    type: 'START_MATCH',
    left: {
      ...leftF, condition: 80,
      portraitUrl: getPortraitUrl(leftF.id), profile: CHAR_PROFILES[leftF.id] || '',
      vl: leftF.voiceLines || leftF.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[leftF.id]) || ['窶ｦ・・]
    },
    right: {
      ...rightF, condition: 80,
      portraitUrl: getPortraitUrl(rightF.id), profile: CHAR_PROFILES[rightF.id] || '',
      vl: rightF.voiceLines || rightF.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[rightF.id]) || ['窶ｦ・・]
    },
    matchInfo: {
      header: `醇 繧ｸ繝･繝九い繝医・繝翫Γ繝ｳ繝・${roundLabel}`,
      subHeader: `${match.left.name} vs ${match.right.name}`,
      matchNum: matchIdx + 1,
      totalMatches: round.matches.length,
      isSpecialMatch: !!isFinal,
      matchTier: isFinal ? 2 : 1,
      leftPersonality: leftF.personality || 'normal',
      leftArchetype: leftF.archetype || 'normal',
      rightPersonality: rightF.personality || 'normal',
      rightArchetype: rightF.archetype || 'normal',
      sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
    },
    result: jtResult,
  };
  // 繝薙ャ繧ｰ繝槭ャ繝。GM・域ｱｺ蜍昴・縺ｿ・・
  if (isFinal) {
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
  }
  let sent = false;
  const sendOnce = () => {
    if (sent) return; sent = true;
    iframe.contentWindow.postMessage(msg, '*');
  };
  iframe.onload = () => setTimeout(sendOnce, 200);
  iframe.src = 'battle-engine.html?t=' + Date.now();
  setTimeout(sendOnce, 800);
};

App.jtSkipMatch = function(roundIdx, matchIdx) {
  // 隧ｦ蜷育ｵ先棡逕ｻ髱｢繧定｡ｨ遉ｺ
  App._jtPreview.phase = 'matchResult';
  Audio.play('coin');
  renderJuniorTournamentMatchResult(roundIdx, matchIdx);
};

App.jtSkipAll = function() {
  // 蜈ｨ隧ｦ蜷医せ繧ｭ繝・・ 竊・譛邨らｵ先棡縺ｸ
  App._jtPreview.phase = 'finalResult';
  try { Audio.fileBgm.fadeOut(800); } catch(e) {}
  setTimeout(() => {
    try { Audio.fileBgm.stop(); } catch(e) {}
    Audio.bgm.playJingle('championship');
  }, 900);
  renderJuniorTournamentResult();
};

App._receiveJTBattleResult = function(data) {
  const jt = App._jtPreview;
  if (!jt) return;
  const ri = jt.currentRound;
  const mi = jt.currentMatch;
  const round = jt.result && jt.result.rounds ? jt.result.rounds[ri] : null;
  const match = round && round.matches ? round.matches[mi] : null;
  if (!match) return;
  if (jt.phase !== 'watching') {
    const incomingWinnerId = data.winnerId != null
      ? data.winnerId
      : ((data.winner || 'left') === 'right' ? match.right.id : match.left.id);
    if (jt.phase === 'matchResult' && match.winnerId === incomingWinnerId) return;
    return;
  }
  clearTimeout(App._escBtnTimer);
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  // BGM繝輔ぉ繝ｼ繝峨い繧ｦ繝茨ｼ域ｱｺ蜍晄凾・・
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  // iframe繧帝哩縺倥ｋ
  document.getElementById('battleOverlay').style.display = 'none';

  // iframe邨先棡縺ｧmatch data繧剃ｸ頑嶌縺搾ｼ・frame迢ｬ閾ｪ繧ｷ繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ縺ｮ邨先棡繧呈ｭ｣縺ｨ縺吶ｋ・・
  const iframeWinner = data.winner || 'left';
  match.winner = iframeWinner;
  match.winnerId = data.winnerId != null ? data.winnerId : (iframeWinner === 'right' ? match.right.id : match.left.id);
  match.loserId = match.winnerId === match.left.id ? match.right.id : match.left.id;
  match.mq = data.mq || match.mq;
  match.turns = data.turns || match.turns;
  match.finType = data.finType || match.finType;
  match.finMove = data.finMove || match.finMove;
  // iframe縺ｯ {current,max}縲√お繝ｳ繧ｸ繝ｳ縺ｯ {final,max} 蠖｢蠑・
  if (data.hpLeft) match.hpLeft = { final: data.hpLeft.current != null ? data.hpLeft.current : data.hpLeft.final, max: data.hpLeft.max };
  if (data.hpRight) match.hpRight = { final: data.hpRight.current != null ? data.hpRight.current : data.hpRight.final, max: data.hpRight.max };
  if (data.log) match.log = data.log;

  // 蠕檎ｶ壹Λ繧ｦ繝ｳ繝峨・蜀崎ｨ育ｮ暦ｼ亥享閠・′螟峨ｏ縺｣縺溷ｴ蜷医∵ｬ｡繝ｩ繧ｦ繝ｳ繝我ｻ･髯阪・蟇ｾ謌ｦ繧ｫ繝ｼ繝峨・邨先棡繧よ峩譁ｰ・・
  App._jtRecomputeSubsequentRounds(jt, ri);

  // 隕ｳ謌ｦ蠕・竊・隧ｦ蜷育ｵ先棡逕ｻ髱｢繧定｡ｨ遉ｺ
  jt.phase = 'matchResult';
  Audio.play('coin');
  renderJuniorTournamentMatchResult(ri, mi);
};

// JT蠕檎ｶ壹Λ繧ｦ繝ｳ繝牙・險育ｮ・ 隕ｳ謌ｦ縺励◆隧ｦ蜷医・邨先棡縺悟､峨ｏ縺｣縺溷ｴ蜷医↓縲∽ｻ･髯阪・繝ｩ繧ｦ繝ｳ繝峨ｒ蜀阪す繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
App._jtWinnerAdvanceState = function(match) {
  if (!match || !match.left || !match.right) return null;
  const winnerIsRight = match.winnerId === match.right.id || match.winner === 'right';
  const winner = winnerIsRight ? match.right : match.left;
  const winnerHp = winnerIsRight ? match.hpRight : match.hpLeft;
  const hpFinal = winnerHp && winnerHp.final != null ? winnerHp.final : 50;
  const hpMax = winnerHp && winnerHp.max ? winnerHp.max : 100;
  const postCond = Math.max(20, Math.round((hpFinal / hpMax) * 80));
  return {
    ...winner,
    condition: Math.min(100, postCond + Engine.juniorTournament.CONDITION_RECOVERY),
  };
};

App._jtSimulateMatch = function(jt, left, right, roundIdx, pairIdx) {
  const leftF = App._jtLookupFighter(left.id) || left;
  const rightF = App._jtLookupFighter(right.id) || right;
  const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB00 + roundIdx * 10 + pairIdx));
  const isFinal = roundIdx === jt.result.rounds.length - 1;
  const matchTier = isFinal ? 2 : 1;
  const result = Engine.battle.simulateMatch(
    { ...leftF, condition: left.condition != null ? left.condition : 80 },
    { ...rightF, condition: right.condition != null ? right.condition : 80 },
    matchRng,
    matchTier,
    { recordFrames: true }
  );
  const winnerId = result.winner === 'right' ? right.id : left.id;
  const loserId = winnerId === left.id ? right.id : left.id;
  return {
    left: { ...left },
    right: { ...right },
    winnerId,
    loserId,
    mq: result.mq,
    turns: result.turns,
    finType: result.finType || '',
    finMove: result.finMove || '',
    hpLeft: result.hpLeft,
    hpRight: result.hpRight,
    log: result.log || [],
    winner: result.winner,
    frames: result.frames || [],
  };
};

App._jtRecomputeSubsequentRounds = function(jt, fromRoundIdx) {
  const rounds = jt.result.rounds;
  if (fromRoundIdx + 1 >= rounds.length) {
    // 譛邨ゅΛ繧ｦ繝ｳ繝峨□縺｣縺溷ｴ蜷医…hampion/runnerUp縺縺第峩譁ｰ
    App._jtUpdateFinalResults(jt);
    return;
  }

  for (let ri = fromRoundIdx + 1; ri < rounds.length; ri++) {
    const prevRound = rounds[ri - 1];
    const winners = prevRound.matches
      .map(m => App._jtWinnerAdvanceState(m))
      .filter(Boolean);

    const newMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 >= winners.length) break;
      const left = winners[i];
      const right = winners[i + 1];

      // 繝輔Ν驕ｸ謇九ョ繝ｼ繧ｿ繧貞叙蠕励＠縺ｦ繧ｷ繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ
      newMatches.push(App._jtSimulateMatch(jt, left, right, ri, i));
    }
    rounds[ri] = { ...rounds[ri], matches: newMatches };
  }
  App._jtUpdateFinalResults(jt);
};

App._jtUpdateFinalResults = function(jt) {
  const rounds = jt.result.rounds;
  const allParticipants = rounds[0].matches.flatMap(m => [m.left, m.right]);
  const finalMatch = rounds[rounds.length - 1].matches[0];
  if (!finalMatch) return;
  jt.result.champion = allParticipants.find(p => p.id === finalMatch.winnerId)
    || (finalMatch.winnerId === finalMatch.left.id ? finalMatch.left : finalMatch.right);
  jt.result.runnerUp = allParticipants.find(p => p.id === finalMatch.loserId)
    || (finalMatch.loserId === finalMatch.left.id ? finalMatch.left : finalMatch.right);
  if (rounds.length >= 2) {
    const sfRound = rounds[rounds.length - 2];
    jt.result.semiFinalists = sfRound.matches
      .map(m => allParticipants.find(p => p.id === m.loserId) || (m.loserId === m.left.id ? m.left : m.right))
      .filter(Boolean);
  }
};

App._jtLookupFighter = function(id) {
  return (G.roster || []).find(f => f.id === id)
    || Object.values(G.aiOrgs || {}).flatMap(o => o.roster || []).find(f => f.id === id)
    || null;
};

App.jtAdvanceAfterMatch = function(roundIdx, matchIdx) {
  // 譌ｧ莠呈鋤: 逶ｴ謗･繝悶Λ繧ｱ繝・ヨ縺ｫ謌ｻ繧句ｴ蜷茨ｼ亥・驛ｨ逕ｨ・・
  App._jtAdvanceInternal(roundIdx, matchIdx);
};

App.jtAdvanceAfterResult = function(roundIdx, matchIdx) {
  // 隧ｦ蜷育ｵ先棡逕ｻ髱｢縺九ｉ谺｡縺ｸ騾ｲ繧
  // 繝医・繝翫Γ繝ｳ繝・GM繧貞・髢具ｼ域ｱｺ蜍晁ｦｳ謌ｦ蠕後・繝輔ぉ繝ｼ繝峨い繧ｦ繝医°繧峨・蠕ｩ蟶ｰ・・
  if (!Audio.fileBgm._audio) {
    try { Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 }); } catch(e) {}
  }
  App._jtAdvanceInternal(roundIdx, matchIdx);
};

App._jtAdvanceInternal = function(roundIdx, matchIdx) {
  const jt = App._jtPreview;
  if (!jt) return;
  const round = jt.result.rounds[roundIdx];
  if (matchIdx + 1 < round.matches.length) {
    jt.currentMatch = matchIdx + 1;
    jt.phase = 'bracket';
    renderJuniorTournamentBracket();
  } else if (roundIdx + 1 < jt.result.rounds.length) {
    jt.currentRound = roundIdx + 1;
    jt.currentMatch = 0;
    jt.phase = 'bracket';
    renderJuniorTournamentBracket();
  } else {
    jt.phase = 'finalResult';
    // 豎ｺ蜍晏ｾ・ BGM繧呈ｭ｢繧√※繝√Ε繝ｳ繝斐が繝ｳ繧ｸ繝ｳ繧ｰ繝ｫ繧帝ｳｴ繧峨☆
    try { Audio.fileBgm.fadeOut(800); } catch(e) {}
    setTimeout(() => {
      try { Audio.fileBgm.stop(); } catch(e) {}
      Audio.bgm.playJingle('championship');
    }, 900);
    renderJuniorTournamentResult();
  }
};

App.finalizeJuniorTournament = function() {
  const jt = App._jtPreview;
  if (!jt) return;

  // Engine.juniorTournament.apply 縺ｧ state 蜿肴丐
  const applied = Engine.juniorTournament.apply(G, jt.result);
  G = { ...applied.state, gameLog: [...G.gameLog, ...applied.events] };

  // 驥鷹姦繝舌Λ繝ｳ繧ｹ謾ｹ蝟・ JT繝｡繝・ぅ繧｢蜿主・・亥・貍疲侭・・
  const jtMediaIncomes = G._pendingMediaIncomes ? [...G._pendingMediaIncomes] : [];
  const jtPlayerIds = new Set((G.roster || []).filter(f => !f.isRental).map(f => f.id));
  let jtMediaTotal = 0;
  jt.result.rounds.forEach(round => {
    round.matches.forEach(m => {
      [m.left, m.right].forEach(f => {
        if (!f) return;
        const rev = Math.round((f.popularity || 1) * MEDIA_CONFIG.jtPerPop);
        if (rev <= 0) return;
        if (jtPlayerIds.has(f.id)) {
          jtMediaTotal += rev;
          // 繝｡繝・ぅ繧｢蜉溷感雉・ 蛟倶ｺｺ蛻･繝｡繝・ぅ繧｢蜿主・邏ｯ險医↓蜉邂・
          G = { ...G, roster: G.roster.map(c =>
            c.id === f.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
          )};
        } else {
          // AI蝗｣菴馴∈謇九・繝｡繝・ぅ繧｢蜿主・蛟倶ｺｺ繝医Λ繝・く繝ｳ繧ｰ
          const fOrgId = f._jtOrgId || Object.keys(G.aiOrgs || {}).find(oid => G.aiOrgs[oid]?.roster?.some(r => r.id === f.id));
          if (fOrgId && G.aiOrgs && G.aiOrgs[fOrgId]) {
            const aiOrg = G.aiOrgs[fOrgId];
            G = { ...G, aiOrgs: { ...G.aiOrgs, [fOrgId]: {
              ...aiOrg, roster: aiOrg.roster.map(c =>
                c.id === f.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
              )
            }}};
          }
        }
      });
    });
  });
  if (jtMediaTotal > 0) {
    jtMediaIncomes.push({ amount: jtMediaTotal, label: 'JT蜃ｺ貍疲侭' });
    G = { ...G, _pendingMediaIncomes: jtMediaIncomes };
  }

  // 譁ｰ閨槭ｒ蜀咲函謌撰ｼ・T邨先棡繧貞渚譏縺輔○繧具ｼ・
  const newsRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xEE57));
  G = { ...G, weeklyNewspaper: Engine.newspaper.generate(G, newsRng) };

  // 閾ｪ蝗｣菴灘・蝣ｴ驕ｸ謇九・諢滓Φ繝√ぉ繝ｼ繝ｳ繧呈ｧ狗ｯ会ｼ医Ξ繝ｳ繧ｿ繝ｫ驕ｸ謇九・蜈・園螻槫屮菴捺棧縺ｧ蜃ｺ蝣ｴ・・
  const playerIds = new Set((G.roster || []).filter(f => !f.isRental).map(f => f.id));
  const { champion, runnerUp, semiFinalists, rounds } = jt.result;
  const allParticipants = rounds[0].matches.flatMap(m => [m.left, m.right]);
  const myParticipants = allParticipants.filter(p => playerIds.has(p.id));

  // 邨先棡縺ｫ蠢懊§縺溘ち繧､繝溘Φ繧ｰ繧貞愛螳・
  const impressions = myParticipants.map(p => {
    let timing = 'postLose';
    if (champion && champion.id === p.id) timing = 'champion';
    else if (runnerUp && runnerUp.id === p.id) timing = 'postWin';
    else if (semiFinalists && semiFinalists.some(sf => sf && sf.id === p.id)) timing = 'postWin';
    // 貅悶・ｱｺ蜍晄風騾縺ｯ postLose
    return { ...p, _jtTiming: timing };
  });

  // transient繧ｯ繝ｪ繧｢・・juniorTournamentResult縺ｯtickWeek縺ｧ譁ｰ閨槭′隱ｭ繧縺ｮ縺ｧ谿九☆・・
  delete G._juniorTournamentSelection;
  App._jtPreview = null;

  // V6 summon 縺ｧ螟画峩縺励◆ box 繧ｹ繧ｿ繧､繝ｫ繧偵Μ繧ｻ繝・ヨ
  const box = document.getElementById('showResultBox');
  if (box) { box.style.maxWidth = ''; box.style.padding = ''; box.style.background = ''; box.style.border = ''; }

  try { Audio.fileBgm.stop(); } catch(e) {}
  Audio.play('coin');

  const finishUp = () => {
    G = { ...G, weekPhase: 'manage' };
    App.restoreBgmForState();
    Storage.autoSave();
    showScreen('week');
    refreshAll();
  };

  // 諢滓Φ繝√ぉ繝ｼ繝ｳ陦ｨ遉ｺ・郁・蝗｣菴馴∈謇九′縺・ｋ蝣ｴ蜷茨ｼ・
  if (impressions.length > 0) {
    // 邨先棡繧ｪ繝ｼ繝舌・繝ｬ繧､繧帝哩縺倥ｋ
    document.getElementById('showResultOverlay').classList.remove('active');
    setTimeout(() => {
      _showJTImpressionChain(impressions, 0, finishUp);
    }, 500);
  } else {
    finishUp();
  }
};

// v2.1: 繧ｯ繝ｬ繧ｸ繝・ヨ逕ｻ髱｢
App.showCredits = function() {
  // 讌ｽ譖ｲ繧ｯ繝ｬ繧ｸ繝・ヨ繧貞虚逧・↓繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ
  const el = document.getElementById('creditsMusicList');
  if (el && typeof CREDITS !== 'undefined' && CREDITS.music) {
    el.innerHTML = CREDITS.music.map(m => `
      <div class="credits-music-item">
        <div class="credits-music-title">${m.title}</div>
        <div class="credits-music-artist">${m.artist}</div>
        <a class="credits-music-link" href="${m.url}" target="_blank" rel="noopener">${m.source}</a>
        <span style="font-size:10px;color:var(--text-dim);margin-left:6px">${m.license}</span>
      </div>
    `).join('');
  }
  document.getElementById('creditsOverlay').classList.add('active');
};
App.closeCredits = function() { document.getElementById('creditsOverlay').classList.remove('active'); };

App.previewEnding = function() {
  App.closeCredits();
  const data = (typeof G !== 'undefined' && G.season)
    ? Engine.ending.buildClearData(G)
    : { season: 1, orgName: '蝗｣菴・, playerRating: 1000, peakOrgPop: 0, totalShows: 0, bestMQ: 0, hallOfFameCount: 0, top3Fighters: [], coaches: [] };
  setTimeout(() => showEndingCeremony(data, () => {}), 300);
};

// 笏笏 DEBUG: 讌ｭ逡悟ｺ穂ｸ翫￡繝・せ繝育畑・医ユ繧ｹ繝亥ｾ悟炎髯､莠亥ｮ夲ｼ・笏笏
window.debugWinLeague = function() {
  // 繧ｨ繝ｳ繝・ぅ繝ｳ繧ｰ縺ｯ endingShown:true 縺ｧ繧ｹ繧ｭ繝・・縺励∵･ｭ逡梧ｿ髴・そ繝ｬ繝｢繝九・縺縺醍匱轣ｫ縺輔○繧・
  G = { ...G,
    offSeason: true,
    offWeek: 4,
    weekPhase: 'offseason',
    battlePoints: { ...G.battlePoints, player: 9999 },
    endingCleared: false,
    leagueElevated: false,
    endingShown: true,
    endingClearedSeason: null,
  };
  refreshAll();
  console.log('[debugWinLeague] 迥ｶ諷九そ繝・ヨ螳御ｺ・');
  console.log('  offSeason:', G.offSeason, '/ offWeek:', G.offWeek, '/ weekPhase:', G.weekPhase);
  console.log('  endingCleared:', G.endingCleared, '/ leagueElevated:', G.leagueElevated);
  console.log('  endingShown: true (繧ｨ繝ｳ繝・ぅ繝ｳ繧ｰ繧ｹ繧ｭ繝・・竊呈･ｭ逡梧ｿ髴・・縺ｿ逋ｺ轣ｫ)');
  console.log('竊・縲碁ｱ繧帝ｲ繧√ｋ縲阪ｒ謚ｼ縺吶→繧ｷ繝ｼ繧ｺ繝ｳ邨ゆｺ・・1菴榊愛螳壺・讌ｭ逡悟ｺ穂ｸ翫￡繧ｻ繝ｬ繝｢繝九・縺檎匱轣ｫ縺励∪縺・);
};
// 讌ｭ逡梧ｿ髴・そ繝ｬ繝｢繝九・繧堤峩謗･繝・せ繝茨ｼ磯ｱ繧帝ｲ繧√★縺ｫ蜊ｳ陦ｨ遉ｺ・・
window.debugElevationDirect = function() {
  showLeagueElevationCeremony(G, () => { console.log('[debugElevationDirect] onDone called'); refreshAll(); });
};

// Alias for old UI calls
// COACH_MAX_ASSIGN already defined in data section
