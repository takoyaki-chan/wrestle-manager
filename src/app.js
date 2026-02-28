// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 0: AUDIO SYSTEM (SFX + BGM)                     ║
// ║  Web Audio API synthesized sounds — no external files     ║
// ╚══════════════════════════════════════════════════════════╝

const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let bgmGain = null;
  let bgmNodes = null;  // active BGM oscillator nodes
  let _muted = false;
  let _sfxVol = 0.5;
  let _bgmVol = 0.04; // ≈ demo preview 15%
  let _bgmMuted = false; // BGM-only mute (jingles/SFX still play)

  // Lazy-init AudioContext (must be triggered by user gesture)
  function ensure() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = _sfxVol;
    sfxGain.connect(masterGain);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = _bgmVol;
    bgmGain.connect(masterGain);
    // Load saved prefs
    try {
      const prefs = JSON.parse(localStorage.getItem('wm_audio') || '{}');
      if (prefs.sfxVol !== undefined) { _sfxVol = prefs.sfxVol; sfxGain.gain.value = _sfxVol; }
      if (prefs.bgmVol !== undefined) { _bgmVol = prefs.bgmVol; bgmGain.gain.value = _bgmVol; }
      if (prefs.muted) { _muted = true; masterGain.gain.value = 0; }
      if (prefs.bgmMuted) { _bgmMuted = true; }
    } catch(e) {}
    return ctx;
  }

  function savePrefs() {
    try { localStorage.setItem('wm_audio', JSON.stringify({sfxVol:_sfxVol, bgmVol:_bgmVol, muted:_muted, bgmMuted:_bgmMuted})); } catch(e) {}
  }

  // ── Utility: create a quick envelope oscillator ──
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

  // ── Utility: white noise burst ──
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

  // ── Utility: frequency sweep oscillator ──
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

  // ── Utility: filtered noise variants ──
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

  // ── Utility: bell partial with slow decay (for metallic gong) ──
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

  // ╔══════════════════════════════════════════════════╗
  // ║  SOUND DEFINITIONS                               ║
  // ╚══════════════════════════════════════════════════╝
  const SFX = {
    // ── UI (NEW) ──
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

    // ── Events (OLD: fanfare / NEW: rest) ──
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
      const t = ensure().currentTime;
      noiseLP(t, 0.8, 0.08, 400);
      noiseBP(t + 0.05, 0.7, 0.06, 1200, 0.5);
      noiseHP(t + 0.1, 0.5, 0.03, 3000);
      oscSweep(180, 140, 'sawtooth', t, 0.4, 0.02);
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
    // Bell x3: match-end gong (カンカンカン)
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
    championship() {
      const t = ensure().currentTime;
      [262, 330, 392].forEach((f, i) => {
        osc(f, 'sawtooth', t + i * 0.1, 0.2, 0.04);
        osc(f, 'sine', t + i * 0.1, 0.2, 0.12);
      });
      [523, 659, 784, 1047].forEach((f, i) => {
        osc(f, 'sine', t + 0.4 + i * 0.08, 0.25, 0.15);
        osc(f * 2, 'sine', t + 0.4 + i * 0.08, 0.15, 0.04);
      });
      [1047, 1319, 1568, 2093].forEach(f => osc(f, 'sine', t + 0.8, 1.0, 0.1));
      osc(2093, 'triangle', t + 0.8, 1.2, 0.05);
      noiseHP(t + 0.8, 0.4, 0.04, 4000);
      osc(65, 'sine', t + 0.8, 1.0, 0.06);
    },
    seasonEnd() {
      const t = ensure().currentTime;
      osc(440, 'sine', t, 0.4, 0.12);
      osc(523, 'sine', t + 0.25, 0.4, 0.12);
      osc(659, 'sine', t + 0.5, 0.4, 0.12);
      osc(880, 'sine', t + 0.8, 1.2, 0.15);
      osc(880, 'triangle', t + 0.8, 1.5, 0.06);
      osc(440, 'sine', t + 0.8, 1.5, 0.04);
      oscSweep(1760, 1720, 'sine', t + 1.0, 1.0, 0.03);
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

    // ── Money (NEW) ──
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
    powerup() {
      const t = ensure().currentTime;
      const c = ensure();
      const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
      fl.type = 'lowpass'; fl.frequency.setValueAtTime(600, t);
      fl.frequency.exponentialRampToValueAtTime(6000, t + 0.3);
      g.gain.setValueAtTime(0.08, t); g.gain.setValueAtTime(0.08, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.connect(fl); fl.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.5);
      osc(1200, 'sine', t + 0.3, 0.2, 0.12);
      osc(1568, 'sine', t + 0.33, 0.2, 0.1);
      noiseHP(t + 0.3, 0.06, 0.03, 6000);
    }
  };

  // ╔══════════════════════════════════════════════════╗
  // ║  BGM SYSTEM — SFC-style chiptune (v1.0)         ║
  // ╚══════════════════════════════════════════════════╝
  const NT = { // Note frequencies
    C3:130.81,D3:146.83,Eb3:155.56,E3:164.81,F3:174.61,G3:196.00,A3:220.00,Bb3:233.08,B3:246.94,
    C4:261.63,D4:293.66,Eb4:311.13,E4:329.63,F4:349.23,G4:392.00,Ab4:415.30,A4:440.00,Bb4:466.16,B4:493.88,
    C5:523.25,D5:587.33,Eb5:622.25,E5:659.25,F5:698.46,G5:783.99,A5:880.00,Bb5:932.33,B5:987.77,C6:1046.50,D6:1174.66
  };

  // ── Helpers: note + drum synthesis ──
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

    // ── Public API ──
    play(trackName) {
      if (_bgmMuted) return; // BGM muted — skip looping tracks
      if (trackName === BGM._current && BGM._playing) return; // Already playing
      BGM.stop();
      const c = ensure();
      if (c.state === 'suspended') c.resume();
      bgmNodes = [];
      BGM._playing = true;
      BGM._current = trackName;
      const fn = BGM._tracks[trackName];
      if (fn) fn();
    },

    playJingle(name) {
      BGM.stop(); // Stop looping BGM, then play jingle (always plays regardless of bgmMuted)
      const c = ensure();
      if (c.state === 'suspended') c.resume();
      bgmNodes = [];
      BGM._playing = true;
      BGM._current = 'jingle_' + name;
      const fn = BGM._jingles[name];
      if (fn) fn();
    },

    stop() {
      BGM._playing = false;
      BGM._current = null;
      if (BGM._interval) { clearInterval(BGM._interval); BGM._interval = null; }
      if (bgmNodes) {
        bgmNodes.forEach(n => { try { n.stop(); } catch(e) {} });
        bgmNodes = [];
      }
    },

    // ── Track implementations ──
    _tracks: {
      // ═══ BGM 1: 開幕 (BPM 115, D minor) — 静かな緊迫感 ═══
      kaimaku() {
        const bpm = 115, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.06, bg = 0.04, dg = 0.025;
        function scheduleLoop() {
          if (BGM._current !== 'kaimaku') return;
          const t0 = ensure().currentTime + 0.005;
          // Riff (square) — tense, syncopated
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

      // ═══ BGM 2: 団体運営 (BPM 100, F major) ═══
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

      // ═══ BGM 3: 激闘 (BPM 138, A minor) ═══
      battle() {
        const bpm = 138, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.06, hg = 0.03, bg = 0.045, dg = 0.035;
        function scheduleLoop() {
          if (BGM._current !== 'battle') return;
          const t0 = ensure().currentTime + 0.005;
          // Melody (sawtooth — brass)
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

      // ═══ BGM 5: 節目 (BPM 80, Em → G) ═══
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

      // ═══ BGM 6: 緊張 (BPM 72, Dm — 不穏な対抗戦チャレンジ) ═══
      tension() {
        const bpm = 72, beat = 60 / bpm, bar = beat * 4;
        const mg = 0.045, bg = 0.035, dg = 0.02;
        function scheduleLoop() {
          if (BGM._current !== 'tension') return;
          const t0 = ensure().currentTime + 0.005;
          // Low drone: sustained dissonant bass
          bgmNote(NT.D3/2,'triangle',t0,bar*8*0.95,bg*1.2);
          bgmNote(NT.Eb3/2,'triangle',t0+0.05,bar*8*0.95,bg*0.4); // dissonance
          // Melody (square — sparse, threatening)
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

    // ── Jingle implementations ──
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

    // ── Smart BGM selector based on game state ──
    playForState() {
      if (!G) return;
      if (G.weekPhase === 'draft') { BGM.play('kaimaku'); return; }
      if (G.offSeason || G.weekPhase === 'offseason') { BGM.play('season_end'); return; }
      if (G.weekPhase === 'showExec') { BGM.play('battle'); return; }
      if (G.weekPhase === 'event') { BGM.play('tension'); return; }
      BGM.play('management'); // management + showPrep both use this
    }
  };

  // ╔══════════════════════════════════════════════════╗
  // ║  FileBGM: HTMLAudioElement ベースのファイルBGM   ║
  // ╚══════════════════════════════════════════════════╝
  const FileBGM = {
    _audio: null,
    _fadeTimer: null,
    play(src, { loop = false, volume = null } = {}) {
      if (_bgmMuted) return;
      FileBGM.stop();
      BGM.stop();
      const a = new window.Audio(src);
      a.loop = loop;
      a.volume = volume !== null ? volume : Math.min(1.0, _bgmVol * 8);
      a.play().catch(() => {});
      FileBGM._audio = a;
    },
    stop() {
      if (FileBGM._fadeTimer) { clearInterval(FileBGM._fadeTimer); FileBGM._fadeTimer = null; }
      if (FileBGM._audio) { FileBGM._audio.pause(); FileBGM._audio.currentTime = 0; FileBGM._audio = null; }
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
      if (FileBGM._audio) FileBGM._audio.volume = Math.min(1.0, _bgmVol * 8);
    }
  };

  // ╔══════════════════════════════════════════════════╗
  // ║  PUBLIC API                                      ║
  // ╚══════════════════════════════════════════════════╝
  return {
    play(name) { if (!_muted && SFX[name]) { try { ensure(); SFX[name](); } catch(e) {} } },
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
    // BGM-only mute (looping tracks off, jingles/SFX still play)
    get bgmMuted() { return _bgmMuted; },
    toggleBgmMute() {
      _bgmMuted = !_bgmMuted;
      if (_bgmMuted) { BGM.stop(); FileBGM.stop(); } else BGM.playForState();
      savePrefs();
    },
  };
})();


// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 6b: MISSION SYSTEM (v0.96)                       ║
// ║  Guided progression — pure functions, no DOM              ║
// ╚══════════════════════════════════════════════════════════╝

const MISSIONS = [
  // ── BEGINNER: 最初の一歩 ──
  { id:'hire_coach',    phase:0, icon:'育', name:'コーチを雇おう',
    desc:'スタッフ室から最初のコーチを雇用しよう。選手の成長速度が大幅にアップ！',
    screen:'coach', check: G => G.coaches.length >= 1 },
  { id:'set_schedule',  phase:0, icon:'予', name:'スケジュールを変更してみよう',
    desc:'今週タブで選手のスケジュールを「練習優先」や「プロモ優先」に変更してみよう。',
    screen:'week', check: G => G.roster.some(c => c.schedule && c.schedule !== 'balance') },
  { id:'first_show',    phase:0, icon:'興', name:'初興行を開催しよう',
    desc:'興行週にカードを組んで興行を開催！まずは1回やってみよう。',
    screen:'show', check: G => G.totalShows >= 1 },
  { id:'mq40',          phase:0, icon:'★', name:'MQ40以上の好試合',
    desc:'マッチクオリティ40以上を出そう。相性の良いカードを組むのがコツ！',
    screen:'show', check: G => (G.seasonStats?.bestMQ || 0) >= 40 || G.seasonHistory?.some(s => s.bestMQ >= 40) },
  { id:'upgrade_fac',   phase:0, icon:'施', name:'施設を強化しよう',
    desc:'施設画面でトレーニング施設などをLv2にアップグレード！',
    screen:'facility', check: G => G.facilities && Object.values(G.facilities).some(v => v >= 2) },

  // ── GROWTH: 成長期 ──
  { id:'crown_champ',   phase:1, icon:'王', name:'団体王座を認定',
    desc:'団体王座が設立されたら王座決定戦を組んで初代チャンピオンを決めよう。',
    screen:'show', check: G => G.titles?.world?.championId != null },
  { id:'pop25',         phase:1, icon:'▲', name:'団体人気25に到達',
    desc:'興行を重ねて団体人気を25まで上げよう。会場の選択肢が広がる！',
    screen:null, check: G => G.orgPop >= 25 },
  { id:'coach3',        phase:1, icon:'育', name:'コーチ3人体制',
    desc:'コーチを3人雇って育成を加速！多くの選手にコーチをつけられるように。',
    screen:'coach', check: G => G.coaches.length >= 3 },
  { id:'rank3',         phase:1, icon:'杯', name:'ランキング3位以内',
    desc:'団体ランキングで3位以内を目指そう。興行のMQと人気が鍵！',
    screen:'ranking', check: G => {
      const r = G.rankings || [];
      const p = r.findIndex(x => x.orgId === 'player');
      return p >= 0 && p < 3;
    }},
  { id:'assign_all',    phase:1, icon:'配', name:'全選手にコーチ配置',
    desc:'育成画面で全選手にコーチを割り当てて、成長効率を最大化！',
    screen:'training', check: G => {
      if (!G.roster || G.roster.length === 0) return false;
      const healthy = G.roster.filter(c => !c.injury);
      if (healthy.length === 0) return true;
      const assigned = Object.values(G.coachAssign || {}).flat();
      return healthy.every(c => assigned.includes(c.id));
    }},

  // ── MASTERY: 頂点へ ──
  { id:'mq70',          phase:2, icon:'◆', name:'MQ70超えの名勝負',
    desc:'最高のカードを組んで、MQ70以上の名勝負を実現！',
    screen:'show', check: G => (G.seasonStats?.bestMQ || 0) >= 70 || G.seasonHistory?.some(s => s.bestMQ >= 70) },
  { id:'pop50',         phase:2, icon:'▲', name:'団体人気50に到達',
    desc:'人気50の壁を突破！大会場での興行が現実的に。',
    screen:null, check: G => G.orgPop >= 50 },
  { id:'rank1',         phase:2, icon:'◇', name:'ランキング1位',
    desc:'業界の頂点に立て！団体ランキング1位を獲得しよう。',
    screen:'ranking', check: G => {
      const r = G.rankings || [];
      return r.length > 0 && r[0].orgId === 'player';
    }},
  { id:'season2',       phase:2, icon:'季', name:'2年目を迎えよう',
    desc:'最初のシーズンを乗り越えて2年目に突入！',
    screen:null, check: G => G.season >= 2 },
];

const PHASE_LABELS = ['[初] はじめの一歩', '[成] 成長期', '[頂] 頂点を目指せ'];

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 6c: SURVIVAL GAUGE (v0.97)                        ║
// ║  Startup deficit tracker — pure functions, no DOM          ║
// ╚══════════════════════════════════════════════════════════╝

const SURVIVAL_MILESTONES = [
  { id:'first_show_rev',  icon:'興', label:'初興行収入', desc:'興行でチケット・グッズ収入を得た',
    check: G => (G.seasonStats?.totalRevenue || 0) > 0 || G.seasonHistory?.some(s => s.totalRevenue > 0) },
  { id:'sponsor_unlock',  icon:'金', label:'スポンサー獲得', desc:'人気20到達でスポンサー収入が発生',
    check: G => G.orgPop >= 20 },
  { id:'first_profit_wk', icon:'▲', label:'初の月次黒字', desc:'直近4週の合計収支がプラスになった',
    check: G => {
      const buf = G.recentWeeklyNet || [0,0,0,0];
      return buf.reduce((a,b) => a+b, 0) >= 0 && (G.weeklyFinance != null);
    }},
  { id:'profit_streak3',  icon:'◆', label:'2ヶ月連続月次黒字', desc:'安定経営が見えてきた',
    check: G => (G.rollingNet4Count || 0) >= 2 },
  { id:'graduation',      icon:'杯', label:'経営安定化', desc:'月次黒字定着＋資金確保！サバイバルクリア',
    check: G => G.survivalCleared === true },
];

const SURVIVAL_PHASES = [
  { id:'red',    label:'赤字地獄',   color:'#e74c3c', emoji:'●', cssClass:'phase-red' },
  { id:'orange', label:'赤字縮小',   color:'#e67e22', emoji:'●', cssClass:'phase-orange' },
  { id:'yellow', label:'損益分岐点', color:'#f1c40f', emoji:'●', cssClass:'phase-yellow' },
  { id:'green',  label:'黒字転換',   color:'#2ecc71', emoji:'●', cssClass:'phase-green' },
];

const Survival = {
  // Calculate estimated weekly net income (expenses - income, without show revenue)
  estimateWeeklyNet(G) {
    const salary = Engine.economy.calcWeeklySalary(G.roster);
    const fixed = Engine.economy.calcFixedCosts();
    const coachSalary = Engine.coach.getSalaryTotal(G);
    const facilityMaint = Engine.facility.getMaintenance(G);
    const totalExpense = salary + fixed + coachSalary + facilityMaint;

    const sponsor = Engine.economy.getSponsorIncome(G.orgPop);
    const broadcastBonus = Engine.facility.getBroadcastBonus(G);
    const broadcast = Engine.economy.getBroadcastIncome(G.orgPop) + broadcastBonus;
    const subsidy = Engine.economy.getSubsidy(G.orgPop);
    const totalBaseIncome = sponsor + broadcast + subsidy;

    // Estimate average show income per week (shows happen ~every 4 weeks)
    // Use last show's revenue if available, or estimate from orgPop
    let avgShowIncomePerWeek = 0;
    if (G.lastShowResults && G.lastShowResults.length > 0 && G.weeklyFinance) {
      const showIncome = G.weeklyFinance.details
        .filter(d => d.type === 'income' && (d.label.includes('チケット') || d.label.includes('グッズ')))
        .reduce((s, d) => s + d.val, 0);
      const showCost = G.weeklyFinance.details
        .filter(d => d.type === 'expense' && d.label.includes('会場'))
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

  // Update survival state — called each week. Returns updated state + events.
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

      // Every 4 weeks, check if rolling sum >= 0 → count as "月次黒字"
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
      events.push('🎊 経営安定化達成！ サバイバルチャレンジクリア！');
    }

    return { state: s, events, graduated };
  }
};

const Mission = {
  // Get all missions with their completion status
  evaluate(G) {
    const completed = new Set(G.missionsCompleted || []);
    return MISSIONS.map(m => ({
      ...m,
      done: completed.has(m.id) || m.check(G),
      wasCompleted: completed.has(m.id), // was already marked done before
    }));
  },

  // Check for newly completed missions and return updated state
  updateCompleted(G) {
    const old = new Set(G.missionsCompleted || []);
    const all = MISSIONS.filter(m => m.check(G)).map(m => m.id);
    const newlyDone = all.filter(id => !old.has(id));
    if (newlyDone.length === 0) return { state: G, newMissions: [] };
    const merged = [...old, ...newlyDone];
    // v1.0: Track newly cleared for celebration UI
    const pendingClears = [...new Set([...(G.missionNewClears || []), ...newlyDone])];
    return {
      state: { ...G, missionsCompleted: merged, missionNewClears: pendingClears },
      newMissions: newlyDone.map(id => MISSIONS.find(m => m.id === id)).filter(Boolean)
    };
  },

  // Get progress stats
  progress(G) {
    const evaluated = Mission.evaluate(G);
    const total = evaluated.length;
    const done = evaluated.filter(m => m.done).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  },

  // Get visible missions (show current phase + next unlocked)
  getVisible(G) {
    const evaluated = Mission.evaluate(G);
    // Always show phase 0
    // Show phase 1 if any phase 0 is done
    // Show phase 2 if any phase 1 is done
    const phase0Done = evaluated.filter(m => m.phase === 0 && m.done).length;
    const phase1Done = evaluated.filter(m => m.phase === 1 && m.done).length;
    let maxPhase = 0;
    if (phase0Done >= 2) maxPhase = 1;
    if (phase1Done >= 2) maxPhase = 2;
    return evaluated.filter(m => m.phase <= maxPhase);
  }
};

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 7: STORAGE (v0.85)                               ║
// ║  Save/Load with v0.8 backward compatibility               ║
// ╚══════════════════════════════════════════════════════════╝

const SAVE_KEY = 'wrestle_manager_save_';
const SAVE_SLOTS = 3;
const AUTOSAVE_KEY = 'wrestle_manager_autosave';

const Storage = {
  serialize(G) {
    const state = JSON.parse(JSON.stringify(G));
    state.roster.forEach(c => { delete c._weekAction; c.intensive = false; });
    state._saveVersion = '1.0b';
    state._saveDate = new Date().toISOString();
    state._nextGenCharId = nextGenCharId;
    return JSON.stringify(state);
  },

  deserialize(json) {
    try {
      const state = JSON.parse(json);
      // Replace G entirely with saved state, preserving any missing defaults
      const base = Engine.createInitialState(state.rngSeed || (Date.now() ^ 0xDEADBEEF));
      G = { ...base, ...state };

      // v0.6 backward compat: coaches
      if (!G.coaches) G = { ...G, coaches: [] };
      if (!G.availableCoaches) G = { ...G, availableCoaches: ALL_COACHES.map(c => c.id).filter(id => !G.coaches.includes(id)) };
      if (!G.seasonGrowth) G = { ...G, seasonGrowth: {} };

      // v0.7 backward compat: facilities
      if (!G.facilities) G = { ...G, facilities: {training:1, medical:1, media:1, dormitory:1, scouting:1} };

      // v0.8 backward compat: coach assignments
      if (!G.coachAssign) {
        const ca = {};
        G.coaches.forEach(id => { ca[id] = []; });
        G = { ...G, coachAssign: ca };
      }

      // v0.85 backward compat
      if (!G.rngSeed) G = { ...G, rngSeed: Date.now() ^ 0xDEADBEEF };

      // v0.9 backward compat: rival system
      if (!G.aiOrgs) {
        const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0, 909));
        const aiResult = Engine.rival.initAIOrgs(rng);
        G = { ...G, aiOrgs: aiResult.aiOrgs, rivalOrgNames: aiResult.rivalOrgNames };
      }
      // Restore org names from saved state
      Engine.rival.applyOrgNames(G.rivalOrgNames);
      if (!G.rankings) G = { ...G, rankings: Engine.ranking.updateRankings(G) };
      // v1.2: Remove deprecated aceDesignation
      if (G.aceDesignation !== undefined) { const { aceDesignation: _ace, ...rest } = G; G = rest; }
      if (!G.transferLog) G = { ...G, transferLog: [] };
      if (G.transfersThisSeason === undefined) G = { ...G, transfersThisSeason: 0 };
      // v1.0e: poolIds → dormantPool migration
      if (G.poolIds && !G.dormantPool) G = { ...G, dormantPool: G.poolIds };
      if (!G.dormantPool) G = { ...G, dormantPool: Engine.rival.getDormantIds() };
      if (!G.orgName) G = { ...G, orgName: 'プレイヤー団体' };

      // v0.9b backward compat: offseason system
      if (G.offSeason === undefined) G = { ...G, offSeason: false, offWeek: 0 };
      // v0.9c backward compat: transfer
      if (G.pendingPoach === undefined) G = { ...G, pendingPoach: [] };
      // v0.9d backward compat: rental & events
      if (G.rental === undefined) G = { ...G, rental: null, warThisSeason: false, challengeTrigger: null, pendingEvent: null, summitBonus: 0 };
      if (G.seasonStats === undefined) G = { ...G, seasonStats: { wins:0, losses:0, draws:0, showCount:0, totalRevenue:0, totalExpense:0, bestMQ:0, bestMQMatch:'', peakFunds:G.funds, peakPop:G.orgPop||0, eventsWon:0, eventsLost:0 }, seasonHistory: [], fundsHistory: [G.funds] };

      // v0.96 backward compat: mission system
      if (G.missionEnabled === undefined) G = { ...G, missionEnabled: true, missionsCompleted: [] };

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

      G = { ...G, version: '0.9' };

      // Fix character data (immutable)
      const fixChar = c => {
        const nc = { ...c };
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
        if (nc.age === undefined) nc.age = 16 + (nc.careerSeasons || 0);
        return nc;
      };
      G = { ...G, roster: G.roster.map(fixChar), freeAgents: G.freeAgents.map(fixChar) };

      // v1.0 migration: fix freeAgents that were created with useNotion:true bug
      // Detect: all 4 physical stats exactly match notionValue (statistically impossible from generateStartValues)
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

      // v1.2 migration: fix freeAgents stuck at age 16 (should be 18-26)
      G = { ...G, freeAgents: G.freeAgents.map(c => {
        if (c.age !== 16) return c; // only fix age-16 FAs
        const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 1616));
        const newAge = 18 + Engine.rng.int(ageRng, 0, 8);
        const nv = c.notionValue || {pw:c.pw,sp:c.sp,te:c.te,st:c.st,mn:c.mn};
        const startVals = Engine.rival.generateStartValues(ageRng, nv, newAge);
        return { ...c, age: newAge, ...startVals };
      })};

      // v0.99 migration: assign assessedValue to all characters (pricing-balance-spec §1)
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

      // v0.99b: restore nextGenCharId for scout-generated characters
      if (G._nextGenCharId) nextGenCharId = G._nextGenCharId;

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
        // Migrate venue index if needed (old 6 venues → new 7 venues)
        if (G.showVenue !== undefined) {
          // Old: 0=公民館,1=小,2=中,3=アリーナ,4=大,5=ドーム
          // New: 0=公民館,1=小,2=市民会館,3=中,4=アリーナ,5=大,6=ドーム
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
          const decayStart = 28 + dur;
          // 既存ベテランへの配慮: 理論値の70%でwearを後付け
          const wearYears = Math.max(0, (c.age || 20) - decayStart);
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

      // v1.4 migration: AI fighters に careerSeasons 付与 + lastAwards/hallOfFame
      if (!G._migrated_v1_4) {
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = {
              ...od,
              roster: od.roster.map(f => ({
                ...f,
                careerSeasons: f.careerSeasons != null ? f.careerSeasons : Math.max(0, (f.age || 20) - 16)
              }))
            };
          });
          G = { ...G, aiOrgs: migAi };
        }
        if (!G.hasOwnProperty('lastAwards')) G = { ...G, lastAwards: null };
        if (!G.hasOwnProperty('hallOfFame')) G = { ...G, hallOfFame: [] };
        G = { ...G, _migrated_v1_4: true };
      }

      // v1.8: 成長イベントシステム マイグレーション
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

      // v1.5: 難易度リバランス — 既存セーブのorgPopをリスケール（×0.7）
      // ※ orgPop < 20 は逓減カーブが×1.0帯のため補正不要（序盤セーブには適用しない）
      if (!G._migrated_v1_5_rebalance) {
        const oldOrgPop = G.orgPop || 0;
        if (oldOrgPop >= 20) {
          const newOrgPop = Math.round(oldOrgPop * 0.7);
          G = { ...G, orgPop: newOrgPop };
          G = { ...G, gameLog: [...(G.gameLog || []), `📢 バランス調整(v1.5): 団体人気を${oldOrgPop}→${newOrgPop}に再調整しました（×0.7 リスケール）`] };
        }
        G = { ...G, _migrated_v1_5_rebalance: true };
      }

      // v1.5s25b: マイルストーンイベントシステム マイグレーション
      if (!G._migrated_milestone) {
        if (!G.milestones) G = { ...G, milestones: {} };
        if (!G.milestoneBuffs) G = { ...G, milestoneBuffs: [] };
        // 既存セーブで条件を満たしているマイルストーンは発動済みとする
        const ms = { ...G.milestones };
        if ((G.totalShows || 0) > 0) ms.first_show = true;
        if (Engine.util.dispOrgPop(G.orgPop) >= 20) ms.orgpop_20 = true;
        if (Object.keys(G.rivalries || {}).length > 0) ms.first_rivalry = true;
        G = { ...G, milestones: ms, _migrated_milestone: true };
      }

      // v2.0: trust パラメータ + lockerRoomMorale マイグレーション
      if (!G._migrated_trust) {
        // 全選手に trust: 50 を付与（初期値）
        const migratedRoster = (G.roster || []).map(f =>
          f.trust != null ? f : { ...f, trust: 50 }
        );
        G = {
          ...G,
          roster: migratedRoster,
          lockerRoomMorale: G.lockerRoomMorale != null ? G.lockerRoomMorale : 60,
          _migrated_trust: true,
        };
        G = { ...G, gameLog: [...(G.gameLog || []), '📢 システム更新(v2.0): 信頼度パラメータを追加しました'] };
      }

      if (!G._migrated_npc_traits) {
        // AI団体の全選手に traits を付与（ALL_CHARS のマスタから引く）
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

      // v2.1: endingCleared / endingClearedSeason マイグレーション
      if (!G._migrated_ending) {
        G = { ...G, endingCleared: G.endingCleared || false, endingClearedSeason: G.endingClearedSeason || null, _migrated_ending: true };
      }
      // v2.0 Phase1-6: 大型イベント マイグレーション
      if (!G._migrated_large_events) {
        G = { ...G, lastLargeEventWeek: G.lastLargeEventWeek || 0, mediaSpotlight: G.mediaSpotlight || null, _migrated_large_events: true };
      }

      // v0.99b: clean up scoutEvent state if weekPhase isn't scoutEvent
      if (G.weekPhase !== 'scoutEvent') {
        G = { ...G, scoutCandidates: null, scoutPicks: null, scoutMaxPicks: null, scoutPendingPick: null, scoutEventType: null };
      }

      return true;
    } catch(e) { console.error('Load failed:', e); return false; }
  },

  save(slot) {
    try {
      localStorage.setItem(SAVE_KEY + slot, Storage.serialize(G));
      G = { ...G, gameLog: [...G.gameLog, `💾 スロット${slot}にセーブしました`] };
      refreshAll();
      return true;
    } catch(e) { alert('セーブに失敗しました: ' + e.message); return false; }
  },

  load(slot) {
    const data = localStorage.getItem(SAVE_KEY + slot);
    if (!data) { alert('セーブデータがありません'); return false; }
    if (Storage.deserialize(data)) {
      G = { ...G, gameLog: [...G.gameLog, `📂 スロット${slot}からロードしました`] };
      if (G.weekPhase === 'showPrep') G = { ...G, weekPhase: 'manage' };
      refreshAll();
      return true;
    }
    return false;
  },

  autoSave() {
    if (G.weekPhase === 'gameover') return; // ゲームオーバー時は上書きしない
    try { localStorage.setItem(AUTOSAVE_KEY, Storage.serialize(G)); } catch(e) { /* silent */ }
  },

  loadAutoSave() {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (data && Storage.deserialize(data)) {
      if (G.weekPhase === 'showPrep') G = { ...G, weekPhase: 'manage' };
      refreshAll();
    }
  },

  getAutoSaveInfo() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return { season: s.season, week: s.week, funds: s.funds, date: s._saveDate };
    } catch { return null; }
  },

  getSaveInfo(slot) {
    try {
      const raw = localStorage.getItem(SAVE_KEY + slot);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return { season: s.season, week: s.week, funds: s.funds, date: s._saveDate, version: s._saveVersion, orgPop: s.orgPop || 0, rosterSize: s.roster ? s.roster.length : 0 };
    } catch { return null; }
  },

  deleteSave(slot) {
    localStorage.removeItem(SAVE_KEY + slot);
  }
};

// Alias for backward compat in UI
function saveGame(slot) { Audio.play('save'); return Storage.save(slot); }
function loadGame(slot) { Audio.play('notify'); const r = Storage.load(slot); if (r && App._refreshTicker) App._refreshTicker(); Audio.bgm.playForState(); return r; }
function deleteSave(slot) { Audio.play('click'); Storage.deleteSave(slot); refreshAll(); }

// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 8: APP BRIDGE (v0.85)                            ║
// ║  UI ↔ Engine bridge layer                                 ║
// ╚══════════════════════════════════════════════════════════╝

// Global game state — the single source of truth
let G = Engine.createInitialState();

// Running RNG state for the current session
let sessionRng = Engine.rng.create(G.rngSeed);

// ── Legacy utility aliases (for UI code backward compat) ──
function ov(c) { return Engine.util.ov(c); }
function getSalary(c) { return Engine.util.getSalary(c); }
function isShowWeek(w) { return Engine.util.isShowWeek(w); }
function getQuarter(w) { return Engine.util.getQuarter(w); }
function isSpecialShow(w) { return Engine.util.isSpecialShow(w); }
function isPPV(w) { return Engine.util.isPPV(w); }
function getHeatLevel() { return Engine.heat.getLevel(G); }
function getWorldChampion() { return Engine.title.getWorldChampion(G); }
function getHiredCoaches() { return Engine.coach.getHiredCoaches(G); }
function getCharCoach(charId) { return Engine.coach.getCharCoach(G, charId); }
function getPotentialPct(c) { return Engine.util.getPotentialPct(c); }
function getFacilityLevel(id) { return Engine.facility.getLevel(G, id); }
function getFacilityMaintenance() { return Engine.facility.getMaintenance(G); }
function getRivalryLevel(id1, id2) { return Engine.title.getRivalryLevel(G, id1, id2); }

// ── App Commands (G mutation ONLY via G = newState) ──
const App = {
  // ═══ Title Screen (v1.0) ═══

  // Show the title screen overlay
  showTitleScreen() {
    const titleEl = document.getElementById('titleScreen');
    const orgEl = document.getElementById('orgSetupScreen');
    titleEl.style.display = 'flex';
    orgEl.style.display = 'none';

    // Populate title portraits (pick 7 iconic characters)
    const titleIds = [1, 16, 11, 5, 17, 12, 4];
    const portraitsEl = document.getElementById('titlePortraits');
    portraitsEl.innerHTML = titleIds
      .map(id => { const url = getPortraitUrl(id); return url ? `<img src="${url}" alt="">` : ''; })
      .join('');

    // Show CONTINUE button if autosave exists
    const autoInfo = Storage.getAutoSaveInfo();
    const contBtn = document.getElementById('titleContinueBtn');
    if (autoInfo) {
      contBtn.style.display = '';
      contBtn.textContent = `CONTINUE — ${Engine.util.formatDate(autoInfo.season, autoInfo.week)}`;
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
    // Load autosave
    G = Engine.createInitialState();
    sessionRng = Engine.rng.create(G.rngSeed);
    G = { ...G, _draftPicks: [], _draftFocus: null, gameLog: [] };
    refreshAll();
    Storage.loadAutoSave();
    App._refreshTicker(); // v1.4w
    Audio.bgm.playForState();
    refreshAll();
  },

  // "LOAD GAME" button from title — open save/load screen
  titleLoadGame() {
    Audio.play('select');
    document.getElementById('titleScreen').style.display = 'none';
    // Initialize minimal state so save screen can render
    G = Engine.createInitialState();
    sessionRng = Engine.rng.create(G.rngSeed);
    G = { ...G, _draftPicks: [], _draftFocus: null, gameLog: [] };
    refreshAll();
    showScreen('save');
    Audio.bgm.play('management');
  },

  // Confirm org setup and proceed to draft
  confirmOrgSetup() {
    const input = document.getElementById('orgSetupNameInput');
    const orgName = (input && input.value.trim()) || 'プレイヤー団体';
    Audio.play('fanfare');
    document.getElementById('orgSetupScreen').style.display = 'none';
    // Initialize new game and go to draft
    G = Engine.createInitialState();
    sessionRng = Engine.rng.create(G.rngSeed);
    G = { ...G, orgName, _draftPicks: [], _draftFocus: null, gameLog: [] };
    Audio.bgm.play('kaimaku');
    refreshAll();
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
      newPicks = [...picks, charId];
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
    Audio.play('fanfare');
    Audio.bgm.play('management');
    const rng = Engine.rng.create(G.rngSeed);
    G = Engine.draft.completeDraft(G, picks, rng);
    // Show welcome popups for drafted fighters with character-specific quotes
    const drafted = G.roster.filter(c => picks.includes(c.id));
    // v1.3: Record debut event for drafted fighters
    G = { ...G, roster: G.roster.map(c => picks.includes(c.id)
      ? Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'draft' })
      : c) };
    drafted.forEach((c, i) => {
      const quote = getDraftQuote(c);
      setTimeout(() => showEventPopup({ type:'fighter', id:c.id, name:c.name, tone:'positive',
        message: quote, detail:`${c.name}（${c.style}/${c.role}）が入団！ OVR ${ov(c)}` }), i * 100);
    });
    delete G._draftPicks;
    delete G._draftFocus;
    sessionRng = Engine.rng.create(G.rngSeed);
    Storage.autoSave();
    refreshAll();
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
    // 最終重複チェック（最後の砦）：同一defIdがロスターに既に存在しないか確認
    if (G.roster.some(c => c.id === charId)) {
      Audio.play('error'); alert('この選手はすでに自団体に所属しています'); return;
    }
    // Gate: check orgPop requirement (pricing-balance-spec §2)
    if (!Engine.scout.canNegotiate(G.orgPop || 0, fighter)) {
      Audio.play('error'); alert('団体の知名度が足りません！'); return;
    }
    const discount = Engine.facility.getScoutDiscount(G);
    const finalCost = Engine.scout.getSigningCost(fighter, discount);
    if (G.funds < finalCost) { Audio.play('error'); alert('資金が足りません！'); return; }
    Audio.play('stamp');
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
    let c = Engine.popularity.applyTransferReset(normalized); // v1.0b: Transfer popularity reset
    // v1.3: Record debut event
    c = Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'freeagent' });
    const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
    const newFA = G.freeAgents.filter((_, i) => i !== idx);
    const newRoster = [...G.roster, c];
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    const log = [...G.gameLog, `📝 ${c.name}と契約（契約金: ${finalCost}万 [${tierCfg.label}]${discount > 0 ? ` / スカウト網割引${discount}%` : ''}）`];
    if (titleMsg) log.push(titleMsg);
    G = { ...G, funds: G.funds - finalCost, freeAgents: newFA, roster: newRoster, titles, gameLog: log };
    refreshAll();
  },

  // ── Scout Event Methods (scout-spec §2-§5) ──────────────

  /** Pick a candidate: show competition dialog or sign directly */
  scoutEventPick(candidateId) {
    if (!G.scoutCandidates) return;
    const cand = G.scoutCandidates.find(c => c.id === candidateId);
    if (!cand) return;
    const picks = G.scoutPicks || [];
    if (picks.length >= (G.scoutMaxPicks || 3)) {
      Audio.play('error'); alert(`今回の獲得上限（${G.scoutMaxPicks}名）に達しています`); return;
    }
    if (!Engine.scout.canNegotiate(G.orgPop || 0, cand)) {
      Audio.play('error'); alert('団体の知名度が足りません！'); return;
    }
    const discount = Engine.facility.getScoutDiscount(G);
    const baseCost = Engine.scout.getSigningCost(cand, discount);
    if (G.funds < baseCost) { Audio.play('error'); alert('資金が足りません！'); return; }

    if (cand._hasCompetition) {
      // Show competition resolution modal
      G = { ...G, scoutPendingPick: candidateId };
      renderScoutCompetitionModal(cand, baseCost, discount);
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
    const discount = Engine.facility.getScoutDiscount(G);
    const baseCost = Engine.scout.getSigningCost(cand, discount);
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, candidateId));

    let result;
    if (choice === 'direct') {
      result = { result: 'success', cost: baseCost };
    } else {
      result = Engine.scout.resolveCompetition(rng, cand, choice);
      // Apply facility discount to competition cost too
      if (result.cost > 0) {
        result.cost = Engine.scout.getSigningCost({ assessedValue: result.cost }, discount);
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
      if (newFunds < result.cost) { Audio.play('error'); alert('資金が足りません！'); return; }
      Audio.play('stamp');
      // Clean internal props before adding to roster
      const signed = { ...cand };
      delete signed._notion; delete signed._estimate; delete signed._isSeed;
      delete signed._hasCompetition; delete signed._compMultiplier; delete signed._bidWinRate;
      // v1.3: Record debut event
      let normalizedSigned = normalizeFighterForRoster(signed);
      normalizedSigned = Engine.career.addEvent(normalizedSigned, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'scout' });
      newRoster.push(normalizedSigned);
      newFunds -= result.cost;
      picks.push(candidateId);
      candidates = candidates.filter(c => c.id !== candidateId);
      log.push(`🔍 スカウト獲得: ${cand.name} [${tierCfg.label}] 契約金${result.cost}万`);
      showEventPopup({ type:'scout', tone:'positive',
        message:`${cand.name}の獲得に成功！`, detail:`契約金: ${result.cost}万 [${tierCfg.label}]` });
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
          aiOrgs = { ...aiOrgs, [lostResult.orgId]: { ...orgData, roster: [...orgData.roster, normalizeFighterForRoster(cleanFighter)] } };
        }
        const orgInfo = RIVAL_ORGS.find(o => o.id === lostResult.orgId);
        log.push(`🔍 競り負け: ${cand.name}は${orgInfo ? orgInfo.name : '他団体'}へ`);
      } else {
        // 最終重複チェック：同一defIdがFA・ロスターに既に存在しない場合のみ追加
        const alreadyExists = freeAgents.some(f => f.id === cleanFighter.id)
          || newRoster.some(f => f.id === cleanFighter.id);
        if (!alreadyExists) {
          freeAgents.push(normalizeFighterForRoster(cleanFighter));
          log.push(`🔍 競り負け: ${cand.name}はフリーエージェントへ`);
        } else {
          log.push(`🔍 競り負け: ${cand.name}はフリーエージェントへ（重複のため登録省略）`);
        }
      }
      candidates = candidates.filter(c => c.id !== candidateId);
      showEventPopup({ type:'scout', tone:'negative',
        message:`${cand.name}の獲得に失敗…`, detail:'他団体との競合に敗れました' });
    } else if (result.result === 'skipped') {
      // v1.7: 見送り時はリストから削除しない（再検討可能にする）
      log.push(`🔍 スカウト見送り: ${cand.name}`);
    }

    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    if (titleMsg) log.push(titleMsg);
    G = {
      ...G, funds: newFunds, roster: newRoster, freeAgents, aiOrgs, titles,
      scoutCandidates: candidates, scoutPicks: picks, scoutPendingPick: null, gameLog: log,
    };
    refreshAll();
    showScreen('scoutEvent');
  },

  /** Finish scout event and continue game flow */
  scoutEventFinish() {
    Audio.play('click');
    const picksCount = (G.scoutPicks || []).length;
    const log = [...G.gameLog, `🔍 スカウト活動完了: ${picksCount}名獲得`];
    // Clean up any remaining candidates (add unacquired to freeAgents pool)
    let freeAgents = [...G.freeAgents];
    // 占有済みIDセット（最終重複チェック用）
    const occupiedIds = Engine.util.collectOccupiedCharacterDefIds(G);
    (G.scoutCandidates || []).forEach(c => {
      const clean = { ...c };
      delete clean._notion; delete clean._estimate; delete clean._isSeed;
      delete clean._hasCompetition; delete clean._compMultiplier; delete clean._bidWinRate;
      // 30% chance unselected candidates become freeAgents（重複除外）
      if (Math.random() < 0.30 && !occupiedIds.has(clean.id)) {
        freeAgents.push({ ...clean, seasonGrowth: { pw: 0, sp: 0, te: 0, st: 0, mn: 0, ...(clean.seasonGrowth || {}) } });
        occupiedIds.add(clean.id); // このバッチ内でも仮予約
      }
    });
    G = {
      ...G, freeAgents, gameLog: log,
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

  // Release a fighter
  releaseFighter(charId) {
    const idx = G.roster.findIndex(c => c.id === charId);
    if (idx < 0) return;
    Audio.play('spend');
    const c = G.roster[idx];
    const cName = c.name;
    const cId = c.id;
    const newRoster = G.roster.filter((_, i) => i !== idx);
    const newFA = [...G.freeAgents, c];
    const newCoachAssign = Engine.coach.unassignFromCoach(G, charId);
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    const log = [...G.gameLog, `📤 ${c.name}を解雇`];
    if (titleMsg) log.push(titleMsg);
    G = { ...G, roster: newRoster, freeAgents: newFA, coachAssign: newCoachAssign, titles, gameLog: log };
    closeFighterPopup();
    refreshAll();
    showEventPopup({ type:'fighter', id:cId, name:cName, tone:'negative',
      message: pickQuote('release'), detail:`${cName}が団体を去りました` });
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
    if (G.coaches.length >= MAX_COACHES) { Audio.play('error'); alert(`コーチは最大${MAX_COACHES}名まで`); return; }
    const fee = coach.hireFee || COACH_HIRE_FEE;
    if (G.funds < fee) { Audio.play('error'); alert('資金が足りません！'); return; }
    G = {
      ...G,
      funds: G.funds - fee,
      coaches: [...G.coaches, coachId],
      availableCoaches: G.availableCoaches.filter(id => id !== coachId),
      coachAssign: { ...G.coachAssign, [coachId]: [] },
      gameLog: [...G.gameLog, `🎓 ${coach.name}をコーチとして雇用（雇用費: ${fee}万）`]
    };
    refreshAll();
    showEventPopup({ type:'coach', id:coachId, name:coach.name, tone:'positive',
      message: pickQuote('coachHire'), detail:`🎓 ${coach.name}がコーチとして加入！（雇用費: ${fee}万）` });
  },

  // Fire coach
  fireCoach(coachId) {
    const coach = ALL_COACHES.find(c => c.id === coachId);
    const newAssign = { ...G.coachAssign };
    delete newAssign[coachId];
    G = {
      ...G,
      coaches: G.coaches.filter(id => id !== coachId),
      availableCoaches: [...G.availableCoaches, coachId],
      coachAssign: newAssign,
      gameLog: [...G.gameLog, `❌ ${coach?.name}を解雇`]
    };
    refreshAll();
    if (coach) showEventPopup({ type:'coach', id:coachId, name:coach.name, tone:'negative',
      message: pickQuote('coachFire'), detail:`${coach.name}がチームを去りました` });
  },

  // Assign character to coach
  assignToCoach(coachId, charId) {
    const unassigned = Engine.coach.unassignFromCoach(G, charId);
    const { coachAssign, success } = Engine.coach.assignToCoach({ ...G, coachAssign: unassigned }, coachId, charId);
    if (!success) { Audio.play('error'); alert('このコーチのアサイン枠が満員です'); return; }
    Audio.play('click');
    G = { ...G, coachAssign };
    refreshAll();
  },

  // Unassign character from coach
  unassignFromCoach(charId) {
    G = { ...G, coachAssign: Engine.coach.unassignFromCoach(G, charId) };
    refreshAll();
  },

  // Upgrade facility
  upgradeFacility(facilityId) {
    const fac = FACILITIES.find(f => f.id === facilityId);
    if (!fac) return;
    const curLv = Engine.facility.getLevel(G, facilityId);
    if (curLv >= fac.levels.length) { Audio.play('error'); alert('最大レベルです'); return; }
    const nextLvData = fac.levels[curLv];
    if (G.funds < nextLvData.cost) { Audio.play('error'); alert('資金が足りません！'); return; }
    Audio.play('powerup');
    G = {
      ...G,
      funds: G.funds - nextLvData.cost,
      facilities: { ...G.facilities, [facilityId]: curLv + 1 },
      gameLog: [...G.gameLog, `🏢 ${fac.name}をLv${curLv + 1}にアップグレード！（費用: ${nextLvData.cost}万）`]
    };
    refreshAll();
  },

  // Show preparation
  startShowPrep() {
    if (G.offSeason || G.weekPhase !== 'manage' || !isShowWeek(G.week)) { Audio.play('error'); return; }
    Audio.play('crowd');
    G = {
      ...G,
      weekPhase: 'showPrep',
      showCard: [
        {left: 0, right: 0, isTitle: false},
        {left: 0, right: 0, isTitle: false},
        {left: 0, right: 0, isTitle: false}
      ],
      showVenue: 0
    };
    refreshAll();
  },

  // Set show venue
  setShowVenue(venueIdx) {
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
    G = { ...G, showCard: newCard };
    renderShowPrep();
  },

  // Clear show card
  clearShowCard() {
    G = { ...G, showCard: G.showCard.map(() => ({left: 0, right: 0, isTitle: false})) };
    renderShowPrep();
  },

  // Toggle title match
  toggleTitleMatch(slotIndex) {
    G = { ...G, showCard: G.showCard.map((slot, i) => i === slotIndex ? { ...slot, isTitle: !slot.isTitle } : slot) };
    renderShowPrep();
  },

  // ═══ BATTLE ENGINE INTEGRATION (v0.86) ═══
  // Show match preview instead of instant execution
  executeShow() {
    // v2.0: weekPhase guard — settled/weekSummary等の非興行フェーズでは実行不可
    if (G.offSeason || !['manage', 'showPrep'].includes(G.weekPhase)) { Audio.play('error'); return; }
    // Guard: sanitize stale card refs (released/retired/transferred wrestlers)
    const rosterIdSet = new Set(G.roster.map(c => c.id));
    let hadStaleRef = false;
    const sanitized = G.showCard.map(m => {
      const leftOk = m.left > 0 && rosterIdSet.has(m.left);
      const rightOk = m.right > 0 && rosterIdSet.has(m.right);
      if ((m.left > 0 && !leftOk) || (m.right > 0 && !rightOk)) hadStaleRef = true;
      return { ...m, left: leftOk ? m.left : 0, right: rightOk ? m.right : 0,
        isTitle: !!m.isTitle && leftOk && rightOk };
    });
    if (hadStaleRef) G = { ...G, showCard: sanitized };

    const validMatches = (hadStaleRef ? sanitized : G.showCard).filter(m => m.left > 0 && m.right > 0);
    if (validMatches.length === 0) {
      Audio.play('error');
      if (hadStaleRef) refreshAll();
      alert(hadStaleRef
        ? 'カードに在籍していない選手が含まれていたため自動で解除しました。カードを確認してください。'
        : '少なくとも1試合を組んでください');
      return;
    }

    // v1.2: タイトルマッチクールダウンガード（UIバイパス防止）
    const hasTitleSlot = validMatches.some(m => m.isTitle);
    if (hasTitleSlot) {
      const cd = Engine.title.canTitleMatch(G);
      if (!cd.allowed) {
        Audio.play('error');
        // クールダウン中のタイトルフラグを自動で外す
        G = { ...G, showCard: G.showCard.map(m => ({ ...m, isTitle: false })) };
        refreshAll();
        alert(`タイトルマッチは12週に1回のみ開催できます（あと${cd.weeksLeft}週）`);
        return;
      }
    }

    // v1.2: 乱入マッチ判定
    App._intrusionData = null;
    const intrusionRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 8888));
    const intrusion = Engine.intrusion.check(G, intrusionRng);
    if (intrusion) {
      // タイトルマッチの挑戦者を差し替え
      const titleIdx = G.showCard.findIndex(m => m.isTitle && m.left > 0 && m.right > 0);
      if (titleIdx >= 0) {
        const tm = G.showCard[titleIdx];
        const challengerSide = tm.left === intrusion.champId ? 'right' : 'left';
        const originalChallengerId = tm[challengerSide];
        // showCard更新
        const newCard = G.showCard.map((m, i) => {
          if (i !== titleIdx) return m;
          return { ...m, [challengerSide]: intrusion.intruder.id };
        });
        // 乱入選手を一時的にrosterに追加
        const intruderForRoster = { ...intrusion.intruder, isIntrusion: true };
        G = { ...G, showCard: newCard, roster: [...G.roster, intruderForRoster] };
        // validMatchesも更新
        validMatches.forEach((m, i) => {
          if (m.isTitle) {
            m[challengerSide] = intrusion.intruder.id;
          }
        });
        App._intrusionData = {
          intruder: intrusion.intruder,
          fromOrgName: intrusion.fromOrgName,
          champName: intrusion.champName,
          originalChallengerId,
          challengerSide
        };
        // 乱入演出ポップアップ
        showEventPopup({
          type: 'fighter',
          id: intrusion.intruder.id,
          name: intrusion.intruder.name,
          tone: 'negative',
          message: `⚡ ${intrusion.fromOrgName}の${intrusion.intruder.name}が乱入！`,
          detail: `タイトルマッチの挑戦者が差し替わった！\nOVR ${Engine.util.ov(intrusion.intruder)} の強敵が王座を狙う！`
        });
      }
    }

    try { Audio.play('bell'); } catch(e) {}
    try { Audio.bgm.play('battle'); } catch(e) {}
    // Initialize preview state
    App._showPreview = {
      validMatches,
      results: new Array(validMatches.length).fill(null),
      currentWatching: -1,
      stateSnapshot: JSON.parse(JSON.stringify(G))
    };
    renderMatchPreview();
  },

  // Skip a single match (instant calculation)
  skipMatch(idx) {
    const sp = App._showPreview;
    if (!sp || sp.results[idx]) return;
    const m = sp.validMatches[idx];
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) return;
    const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
    sp.results[idx] = Engine.battle.simulateMatch(charL, charR, matchRng);
    try { Audio.play('tick'); } catch(e) {}
    renderMatchPreview();
    if (sp.results.every(r => r !== null)) App.finalizeShow();
  },

  // Watch match in battle engine iframe
  watchMatch(idx) {
    const sp = App._showPreview;
    if (!sp || sp.results[idx]) return;
    sp.currentWatching = idx;
    const m = sp.validMatches[idx];
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    if (!charL || !charR) return;
    // Show iframe
    const overlay = document.getElementById('battleOverlay');
    overlay.style.display = 'block';
    // Show escape button after 8 seconds (safety net if iframe gets stuck)
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    clearTimeout(App._escBtnTimer);
    App._escBtnTimer = setTimeout(() => { if (escBtn) { escBtn.style.opacity = '1'; escBtn.style.pointerEvents = 'auto'; } }, 8000);
    // Send match data to iframe (avoid contentDocument — causes SecurityError on file://)
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: { ...charL, portraitUrl: getPortraitUrl(charL.id), vl: charL.voiceLines || charL.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[charL.id]) || ['…！'] },
      right: { ...charR, portraitUrl: getPortraitUrl(charR.id), vl: charR.voiceLines || charR.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[charR.id]) || ['…！'] },
      matchInfo: {
        header: m.isTitle ? (G.titles.world.championId ? '🏆 TITLE MATCH' : '🏆 初代王者決定戦') : `MATCH ${idx + 1}`,
        subHeader: `${charL.name} vs ${charR.name}`,
        matchNum: idx + 1,
        totalMatches: sp.validMatches.length,
        isTitle: !!m.isTitle
      }
    };
    let sent = false;
    const sendOnce = () => {
      if (sent) return;
      sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    // Reload iframe with cache-busting param to guarantee fresh load
    iframe.onload = () => setTimeout(sendOnce, 200);
    const baseSrc = (iframe.getAttribute('src') || 'battle-engine.html').split('?')[0];
    iframe.src = baseSrc + '?t=' + Date.now();
    // Fallback: retry if onload was missed
    setTimeout(sendOnce, 800);
  },

  // Receive result from battle engine
  receiveBattleResult(data) {
    // Hide escape button
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    // War context: route to war handler
    const wp = App._warPreview;
    if (wp && wp.currentWatching >= 0) {
      App._receiveWarBattleResult(data);
      return;
    }
    // Show context
    const sp = App._showPreview;
    if (!sp || sp.currentWatching < 0) return;
    const idx = sp.currentWatching;
    // Guard: ignore duplicate results (e.g. double-click CLOSE)
    if (sp.results[idx]) { document.getElementById('battleOverlay').style.display = 'none'; sp.currentWatching = -1; return; }
    const m = sp.validMatches[idx];
    const charL = G.roster.find(c => c.id === m.left);
    const charR = G.roster.find(c => c.id === m.right);
    // Convert battle engine result to WM format
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
    // Hide iframe
    document.getElementById('battleOverlay').style.display = 'none';
    sp.currentWatching = -1;
    try { Audio.play('coin'); } catch(e) {}
    renderMatchPreview();
    if (sp.results.every(r => r !== null)) App.finalizeShow();
  },

  // Emergency escape from battle engine (if iframe gets stuck)
  escapeBattle() {
    clearTimeout(App._escBtnTimer);
    const escBtn = document.getElementById('battleEscapeBtn');
    if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
    document.getElementById('battleOverlay').style.display = 'none';
    // Auto-skip the stuck match
    const sp = App._showPreview;
    const wp = App._warPreview;
    if (sp && sp.currentWatching >= 0) {
      const idx = sp.currentWatching;
      sp.currentWatching = -1;
      if (!sp.results[idx]) App.skipMatch(idx);
      else { renderMatchPreview(); if (sp.results.every(r => r !== null)) App.finalizeShow(); }
    } else if (wp && wp.currentWatching >= 0) {
      const idx = wp.currentWatching;
      wp.currentWatching = -1;
      if (!wp.results[idx]) App._skipWarMatch(idx);
    }
  },

  // Skip all remaining matches
  skipAllMatches() {
    const sp = App._showPreview;
    if (!sp) return;
    let hasMissing = false;
    sp.validMatches.forEach((m, idx) => {
      if (sp.results[idx]) return;
      const charL = G.roster.find(c => c.id === m.left);
      const charR = G.roster.find(c => c.id === m.right);
      if (!charL || !charR) { hasMissing = true; return; }
      const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
      sp.results[idx] = Engine.battle.simulateMatch(charL, charR, matchRng);
    });
    if (sp.results.some(r => r === null)) {
      renderMatchPreview();
      if (hasMissing) {
        Audio.play('error');
        alert('カード内に在籍していない選手の試合があり、全試合スキップを完了できませんでした。');
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
      alert('試合結果の確定に失敗しました。カードに不整合がある可能性があります。');
      return;
    }
    let s = { ...G, totalShows: G.totalShows + 1, weekPhase: 'showExec' };
    let roster = s.roster.map(c => ({ ...c }));
    let rivalries = { ...s.rivalries };
    let titles = { ...s.titles, world: { ...s.titles.world } };
    const events = [];

    // Rivalry & coach bonuses
    results.forEach((result, i) => {
      const m = validMatches[i];
      const rivalLvl = Engine.title.getRivalryLevel({ ...s, rivalries }, m.left, m.right);
      if (rivalLvl) { result.mq = Math.min(100, result.mq + rivalLvl.mqBonus); result.rivalryBonus = rivalLvl; }
      if (m.isTitle) { result.mq = Math.min(100, result.mq + (TITLES.find(t => t.id === 'world')?.mqBonus || 15)); result.isTitleMatch = true; }
      const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right);
      rivalries = rivalResult.rivalries;
      if (rivalResult.msg) events.push(rivalResult.msg);
      const coachMQ = Engine.coach.getMQBonusForMatch(s, m.left, m.right);
      if (coachMQ > 0) { result.mq = Math.min(100, result.mq + coachMQ); result.coachMQBonus = coachMQ; }
    });

    // Title outcomes
    validMatches.forEach((m, i) => {
      if (!m.isTitle || !results[i]) return;
      const r = results[i];
      const champId = titles.world.championId;
      const tempState = { ...s, titles, roster };
      if (r.winner === 'draw') {
        if (champId) { const def = Engine.title.recordDefense(tempState); titles = def.titles; roster = def.roster; events.push(def.msg); }
      } else {
        const winnerId = r.winner === 'left' ? m.left : m.right;
        if (!champId || winnerId !== champId) {
          const crown = Engine.title.crownChampion(tempState, winnerId); titles = crown.titles; roster = crown.roster; events.push(crown.msg);
        } else {
          const def = Engine.title.recordDefense(tempState); titles = def.titles; roster = def.roster; events.push(def.msg);
        }
      }
    });

    // v1.2: 乱入マッチ結果処理
    if (App._intrusionData) {
      const id = App._intrusionData;
      // 乱入選手がタイトルを奪取したか判定
      const intruderId = id.intruder.id;
      const intruderWon = titles.world.championId === intruderId;
      if (intruderWon) {
        // 王座空位 + ヒートダウン
        const intRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 8889));
        const penalty = -(15 + Engine.rng.int(intRng, 0, 5));
        titles = { ...titles, world: { ...titles.world, championId: null, defenses: 0 } };
        s = { ...s, heatScore: Math.max(0, (s.heatScore || 50) + penalty) };
        events.push(`😱 ${id.fromOrgName}の${id.intruder.name}に王座を奪われた！ 王座は空位に… ヒート${penalty}`);
      } else {
        // チャンピオン勝利 → 団体人気+2
        s = { ...s, orgPop: Math.min(100, (s.orgPop || 0) + 2) };
        events.push(`👑 ${id.champName}が乱入者${id.intruder.name}を退けた！ 団体人気+2`);
      }
      // 乱入選手をrosterから除去
      roster = roster.filter(c => !c.isIntrusion);
    }

    // v1.0c: 会場熱気MQボーナス — 満員率＋会場規模が全試合のMQを補正
    const showMatchPops = validMatches.map(m => {
      const lc = roster.find(c => c.id === m.left);
      const rc = roster.find(c => c.id === m.right);
      return (lc ? lc.popularity : 0) + (rc ? rc.popularity : 0);
    });
    const showCardPop = Engine.economy.calcCardPop(showMatchPops);
    const hasTitleMatchForAttend = validMatches.some(m => m.isTitle);
    const champIdForAttend = s.titles?.world?.championId;
    const hasChampOnCardForAttend = champIdForAttend ? validMatches.some(m => m.left === champIdForAttend || m.right === champIdForAttend) : false;
    let preAttendance = Engine.economy.calcAttendance(s, s.showVenue, showCardPop, hasTitleMatchForAttend, hasChampOnCardForAttend);
    // v1.5s25b: attendance_boost バフ（マイルストーン）
    const attendBoostBuffPre = (s.milestoneBuffs || []).find(b => b.type === 'attendance_boost');
    if (attendBoostBuffPre) preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * attendBoostBuffPre.multiplier));
    const preOccRate = preAttendance / VENUES[s.showVenue].cap;
    const crowdMQ = Engine.economy.calcCrowdMQBonus(s.showVenue, preOccRate);
    if (crowdMQ.total !== 0) {
      results.forEach(r => { r.mq = Engine.util.clamp(r.mq + crowdMQ.total, 5, 100); });
      if (crowdMQ.crowdLabel) {
        events.push(`🏟️ ${crowdMQ.crowdLabel}（MQ全試合 ${crowdMQ.total >= 0 ? '+' : ''}${crowdMQ.total}）`);
      }
    }

    // MQ popularity
    const mainEventIdx = 0; // index 0 = main event in showCard order
    results.forEach((r, idx) => {
      const isMainEvent = idx === mainEventIdx;
      const mqPop = Engine.applyMQPopularity(roster, r, isMainEvent);
      roster = mqPop.roster;
    });
    const orgPopRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x4F50));
    const popResult = Engine.applyShowPopularity(roster, results, s.orgPop, orgPopRng);
    roster = popResult.roster;
    events.push(`📊 興行平均MQ: ${Math.round(results.reduce((a,r) => a + r.mq, 0) / results.length)} → 団体人気${popResult.popDelta >= 0 ? '+' : ''}${Math.round(popResult.popDelta * 10) / 10} (現在: ${Engine.util.dispOrgPop(popResult.orgPop)})`);

    // Heat
    const avgMQ = Math.round(results.reduce((a, r) => a + r.mq, 0) / results.length);
    const oldHeat = Engine.heat.getLevel(s);
    const newHeatScore = Engine.heat.calcUpdate(s, avgMQ);
    const newHeat = Engine.heat.getLevel({ ...s, heatScore: newHeatScore });
    if (oldHeat.id !== newHeat.id) events.push(`${newHeat.emoji} Heat変動: ${oldHeat.label} → ${newHeat.label}（集客倍率 ×${newHeat.mult}）`);

    // Injuries — separate RNG per fighter to avoid correlation
    const injuryResults = [];
    const injuryReduction = Engine.facility.getInjuryReduction(s);
    results.forEach((r, idx) => {
      const lc = roster.find(c => c.id === r.left.id);
      if (lc && !lc.isIntrusion) { // 乱入選手は怪我判定スキップ
        const injRngL = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.left.id));
        const li = Engine.injury.check(injRngL, lc, r, injuryReduction, Engine.coach.getInjuryMult(s, r.left.id));
        if (li) { roster = roster.map(c => c.id === lc.id ? li.newFighter : c); injuryResults.push({ name: lc.name, injury: li.newFighter.injury }); }
      }
      const rc = roster.find(c => c.id === r.right.id);
      if (rc && !rc.isIntrusion) { // 乱入選手は怪我判定スキップ
        const injRngR = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.right.id));
        const ri = Engine.injury.check(injRngR, rc, r, injuryReduction, Engine.coach.getInjuryMult(s, r.right.id));
        if (ri) { roster = roster.map(c => c.id === rc.id ? ri.newFighter : c); injuryResults.push({ name: rc.name, injury: ri.newFighter.injury }); }
      }
    });

    // v1.2: タイトルマッチ実施時に絶対週数を記録
    const executedTitleMatch = validMatches.some(m => m.isTitle);
    const lastTitleMatchWeek = executedTitleMatch
      ? Engine.title.getAbsWeek(s)
      : (s.lastTitleMatchWeek ?? null);

    s = { ...s, roster, rivalries, titles, heatScore: newHeatScore, orgPop: popResult.orgPop, lastShowResults: results, lastTitleMatchWeek };

    // v0.95: Season stats
    const stats = { ...G.seasonStats };
    stats.showCount++;
    results.forEach(r => {
      if (r.mq > stats.bestMQ) { stats.bestMQ = r.mq; stats.bestMQMatch = `${r.left.name} vs ${r.right.name}`; }
      if (r.winner === 'left' || r.winner === 'right') stats.wins++;
      if (r.winner === 'draw') stats.draws++;
    });

    // v1.8: §2 ブレークスルー判定 & careerBestMQ 更新（試合後）
    const pendingGrowthEvents = [];
    const btRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xB818));
    results.forEach(r => {
      [
        { charId: r.left.id,  won: r.winner === 'left'  },
        { charId: r.right.id, won: r.winner === 'right' },
      ].forEach(({ charId, won }) => {
        const fighter = roster.find(c => c.id === charId);
        if (!fighter || fighter.isIntrusion) return;
        const oppId = charId === r.left.id ? r.right.id : r.left.id;
        const oppFighter = roster.find(c => c.id === oppId);
        const oppOvr = oppFighter ? Engine.util.ov(oppFighter) : (r[charId === r.left.id ? 'right' : 'left']?.pw ?? 50);
        const isTitle = !!r.isTitleMatch;

        // careerBestMQ 更新（ブレークスルー判定に使うため先に更新）
        const wasNewBest = r.mq > (fighter.careerBestMQ || 0);
        if (wasNewBest) {
          roster = roster.map(c => c.id === charId ? { ...c, careerBestMQ: r.mq } : c);
        }

        // ブレークスルー判定
        const btFighter = roster.find(c => c.id === charId);
        const btResult = Engine.growthEvents.checkAndApplyBreakthrough(
          btRng, btFighter, r.mq, oppOvr, isTitle, won, s.season, s.week
        );
        if (btResult) {
          roster = roster.map(c => c.id === charId ? btResult.fighter : c);
          pendingGrowthEvents.push({
            type: 'breakthrough', fighterId: charId,
            stat: btResult.stat, gain: btResult.gain, hotStreak: btResult.hotStreak
          });
        }

        // §4.2 敗北スランプ判定
        if (!won) {
          const slumpRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C6, charId));
          const slumpFighter = roster.find(c => c.id === charId);
          if (Engine.growthEvents.checkSlump(slumpRng, slumpFighter, 'defeat')) {
            const newF = Engine.growthEvents.applySlump(slumpFighter, 'defeat', s.season, s.week);
            roster = roster.map(c => c.id === charId ? newF : c);
            pendingGrowthEvents.push({ type: 'slump_start', fighterId: charId, trigger: 'defeat' });
          }
        }

        // §4.4/§5.4 試合後 momentum 更新（スランプ/モチベ喪失中）
        const momRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C7, charId));
        const momFighter = roster.find(c => c.id === charId);
        let updatedF = Engine.growthEvents.updateSlumpMomentumAfterMatch(momFighter, r.mq, won, momRng);
        updatedF = Engine.growthEvents.updateMotivationLossMomentumAfterMatch(updatedF, r.mq, won, momRng);

        // §5.2 モチベ喪失 敗北トリガー
        if (!won && updatedF.slump) {
          const mlRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C8, charId));
          if (Engine.growthEvents.checkMotivationLoss(mlRng, updatedF, 'defeat')) {
            updatedF = Engine.growthEvents.applyMotivationLoss(updatedF, s.season, s.week);
            pendingGrowthEvents.push({ type: 'motivation_loss_start', fighterId: charId });
          }
        }
        if (updatedF !== momFighter) {
          roster = roster.map(c => c.id === charId ? updatedF : c);
        }
      });
    });

    s = { ...s, roster };
    if (pendingGrowthEvents.length > 0) {
      G = { ...G, _pendingGrowthEvents: pendingGrowthEvents };
    }

    G = { ...G, ...s, seasonStats: stats, gameLog: [...G.gameLog, ...events] };

    // v2.0 Phase1-6: メディアスポットライトの興行後処理
    if (G.mediaSpotlight) {
      const spotRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB4B4));
      const spotResult = Engine.eventSystem.processMediaSpotlight(G, results, validMatches, spotRng);
      if (spotResult) {
        G = { ...G, mediaSpotlight: spotResult.mediaSpotlight, roster: spotResult.roster,
               gameLog: [...G.gameLog, ...spotResult.events] };
        if (spotResult.orgPopDelta) {
          G = { ...G, orgPop: G.orgPop + spotResult.orgPopDelta };
        }
      }
    }

    App._showPreview = null;
    App._lastInjuries = injuryResults; // v0.96: store for popup after close
    // BGM: Play jingle based on title outcome
    const hadTitleChange = validMatches.some((m, i) => m.isTitle && results[i] && results[i].winner !== 'draw');
    Audio.bgm.playJingle(hadTitleChange ? 'championship' : 'victory');
    renderShowResult(results, injuryResults);
  },

  // Close show result and advance via tickWeek
  closeShowResult() {
    if (App._closingShowResult) return;
    const resultOverlay = document.getElementById('showResultOverlay');
    if (!resultOverlay || G.weekPhase !== 'showExec') return;
    App._closingShowResult = true;
    try {
    Audio.play('coin');
    Audio.bgm.play('management');
    resultOverlay.classList.remove('active');

    // v1.3-3: Extract pending injury retirements before state changes
    const pendingInjuryRetirements = G._pendingInjuryRetirements || [];
    if (G._pendingInjuryRetirements) {
      const { _pendingInjuryRetirements: _, ...cleanG } = G;
      G = cleanG;
    }

    // v0.96: Show injury popups (only non-retirement injuries)
    const injuries = App._lastInjuries || [];
    let hasEventPopups = false;
    injuries.forEach((ir, i) => {
      // v1.3-3: Skip retirement injuries (they get their own popup)
      if (ir.retireType) return;
      const ch = G.roster.find(c => c.name === ir.name);
      if (ch && ir.injury) {
        hasEventPopups = true;
        setTimeout(() => showEventPopup({ type:'fighter', id:ch.id, name:ch.name, tone:'negative',
          message: pickQuote('injury'), detail:`🏥 ${ir.injury.type} — 全治${ir.injury.weeksLeft}週間` }), i * 100);
      }
    });
    App._lastInjuries = [];
    // v1.2: 乱入マッチ結果ポップアップ
    if (App._intrusionData) {
      const id = App._intrusionData;
      const intruderId = id.intruder.id;
      // 乱入選手が王者になっていたら（＝空位化前のchampionIdだった）、王座奪取
      const wasIntruderCrowned = !G.titles?.world?.championId; // 空位＝乱入選手に奪われた
      const popupDelay = injuries.length * 100 + 50;
      hasEventPopups = true;
      if (wasIntruderCrowned) {
        setTimeout(() => showEventPopup({ type:'fighter', id:intruderId, name:id.intruder.name, tone:'negative',
          message: `${id.fromOrgName}の${id.intruder.name}に王座を奪われた…`,
          detail: `王座は空位に。次のタイトルマッチで新王者を決定してください。` }), popupDelay);
      } else {
        setTimeout(() => showEventPopup({ type:'fighter', id:G.titles.world.championId, name:id.champName, tone:'gold',
          message: `乱入者を退けた！`,
          detail: `👑 ${id.champName}が${id.fromOrgName}の${id.intruder.name}を撃破！ 団体人気+2` }), popupDelay);
      }
      App._intrusionData = null;
    }
    // Check title wins (only if champion is newly crowned this show)
    const newChampId = G.titles?.world?.championId;
    if (newChampId && G.titles.world.defenses === 0 && G.lastShowResults?.some(r => r.isTitleMatch)) {
      const champ = G.roster.find(c => c.id === newChampId);
      if (champ) {
        hasEventPopups = true;
        setTimeout(() => showEventPopup({ type:'fighter', id:champ.id, name:champ.name, tone:'gold',
          message: pickQuote('titleWin'), detail:`👑 ${champ.name}が新団体王者に！` }), injuries.length * 100 + 50);
      }
    }
    // v1.4w: 興行結果から新聞イベントを収集（tickWeek前）
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

    // v1.9: 興行終了後にshowCardをリセット — 次週が4試合月でも6枠が残るバグ対策
    G = { ...G, showCard: [{left:0,right:0,isTitle:false},{left:0,right:0,isTitle:false},{left:0,right:0,isTitle:false}] };

    // v1.4w: 防衛マイルストーン検出
    const _postDefenses = G.titles?.world?.defenses || 0;
    if (_postDefenses > _preDefenses) {
      const milestone = Engine.news.checkDefenseMilestone(_postDefenses);
      if (milestone > 0) {
        const champ = G.roster.find(c => c.id === G.titles?.world?.championId);
        if (champ) {
          App._pushNewsEvent({ type: 'defenseRecord', characterId: champ.id,
            data: { name: champ.name, org: G.orgName || 'あなたの団体', count: _postDefenses } });
        }
      }
    }
    // v1.4w: ティッカー更新
    App._refreshTicker();

    // v1.2-9: Flavor event popups after show settlement
    const showFlavorEvents = G._flavorEvents || [];
    if (showFlavorEvents.length > 0) {
      showFlavorEvents.forEach((ev, i) => {
        hasEventPopups = true;
        const detail = ev.type === 'magazine' ? `人気 +${ev.popGain}` : `ヒート +${ev.heatGain}`;
        setTimeout(() => showEventPopup({
          type: 'fighter', id: ev.fighterId, name: ev.fighterName,
          tone: 'positive', message: ev.headline, detail
        }), i * 100 + 50);
      });
      const { _flavorEvents, ...cleanG } = G;
      G = cleanG;
    }
    App.checkMissionUpdate();
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment();
    // v1.5s25b: 興行後バフ消費 + 週次バフ消費
    App._tickMilestoneBuffsShow();
    App._applyWeeklyBuffEffects();
    App._tickMilestoneBuffsWeekly();

    // v1.8: ブレークスルー/スランプ発生ポップアップ（試合 → 怪我 → breakthrough の順）
    const pendingGrowthEventsShow = G._pendingGrowthEvents || [];
    if (G._pendingGrowthEvents) {
      const { _pendingGrowthEvents: _, ...cleanG } = G;
      G = cleanG;
    }
    if (pendingGrowthEventsShow.length > 0) {
      const showGrowthPopups = () => showGrowthEventPopups(pendingGrowthEventsShow, () => {
        // v1.3-3: Show injury retirement popups after growth popups
        if (pendingInjuryRetirements.length > 0) {
          showRetirementPopups(pendingInjuryRetirements);
        }
      });
      if (hasEventPopups) {
        _onEventPopupQueueEmpty = showGrowthPopups;
      } else {
        setTimeout(showGrowthPopups, 200);
      }
    } else {
      // v1.3-3: Show injury retirement popups after event popups finish
      if (pendingInjuryRetirements.length > 0) {
        const showRetirements = () => { showRetirementPopups(pendingInjuryRetirements); };
        if (hasEventPopups) {
          _onEventPopupQueueEmpty = showRetirements;
        } else {
          setTimeout(showRetirements, 200);
        }
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

  // v1.4w: ティッカーニュース再生成（manage画面表示用）
  _refreshTicker() {
    if (!G || G.offSeason) return;
    const tickerRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBEEF));
    G = { ...G, _tickerItems: Engine.news.generateTicker(tickerRng, G) };
  },

  // v1.4w: 新聞パネルイベントキューに追加
  _pushNewsEvent(ev) {
    const queue = [...(G._newsEvents || []), ev];
    G = { ...G, _newsEvents: queue };
  },

  // v1.4w: 新聞パネル表示→完了後にcallback
  _showNewsPanelIfNeeded(callback) {
    const events = G._newsEvents || [];
    if (events.length === 0) { callback(); return; }
    // キュー消化
    const { _newsEvents: _, ...cleanG } = G;
    G = cleanG;
    const newsRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE57));
    const articles = Engine.news.generateHeadlines(newsRng, events);
    if (articles.length === 0) { callback(); return; }
    showNewspaperPanel(articles, callback);
  },

  // v2.0-C3: Always stop — no auto-advance. Accumulate monthly buffer and set weekSummary or settled phase.
  _tryAutoAdvance() {
    const monthBuf = [...(G.monthlyFinanceBuffer || [])];
    monthBuf.push({ week: G.week, finance: { ...G.weeklyFinance }, funds: G.funds });
    const isMonthEnd = G.week % 4 === 0;
    if (!isMonthEnd) {
      // Non-month-end: show brief weekly summary instead of auto-advancing
      G = { ...G, monthlyFinanceBuffer: monthBuf, weekPhase: 'weekSummary' };
      Storage.autoSave();
      showScreen('week');
      refreshAll();
      return true; // signal: handled (caller should return)
    }
    // Month-end: accumulate and stop at settled (existing behavior)
    G = { ...G, monthlyFinanceBuffer: monthBuf };
    return false;
  },

  // v2.0-C3: Manual advance from weekly summary
  advanceFromWeekSummary() {
    Audio.play('tick');
    const result = Engine.advanceWeek(G);
    G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
    if (G.missionEnabled) { const mResult = Mission.updateCompleted(G); G = mResult.state; }
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment();
    sessionRng = Engine.rng.create(G.rngSeed);
    App._refreshTicker();
    Storage.autoSave();
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
  },

  // Process a week (manage + settle) via tickWeek
  // A-3: おまかせ育成 — コンディション帯別に最適スケジュールを積極設定して止まる（週は自動で進めない）
  autoManage() {
    if (G.weekPhase !== 'manage') return;
    Audio.play('select');
    const roster = G.roster.map(c => {
      if (c.injury || c.isRental) return c;
      if (c.condition >= 80) return { ...c, schedule: 'practice', intensive: true };
      if (c.condition >= 75) return { ...c, schedule: 'practice', intensive: false };
      if (c.condition >= 60) return { ...c, schedule: 'balance',  intensive: false };
      return { ...c, schedule: 'rest', intensive: false };
    });
    G = { ...G, roster };
    showToast('🤖 おまかせ完了 — 内容を確認してください');
    refreshAll();
  },

  processWeek() {
    Audio.play('tick');
    const oldRoster = G.roster.map(c => ({ id: c.id, injured: !!c.injury }));
    const result = Engine.tickWeek(G);
    const stats = { ...G.seasonStats };
    if (result.state.weeklyFinance) {
      stats.totalRevenue += result.state.weeklyFinance.income || 0;
      stats.totalExpense += result.state.weeklyFinance.expense || 0;
    }
    if (result.state.funds > stats.peakFunds) stats.peakFunds = result.state.funds;
    const fh = [...(G.fundsHistory || []), result.state.funds];
    G = { ...result.state, seasonStats: stats, fundsHistory: fh, gameLog: [...G.gameLog, ...result.events] };
    // v2.1: ゲームオーバー判定（autoSave せず専用画面へ）
    if (G.weekPhase === 'gameover') {
      const summary = Engine.ending.buildGameOverSummary(G);
      showGameOverScreen(summary);
      return;
    }
    App.checkMissionUpdate();
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment();
    // v1.5s25b: 週次バフ消費（weekly_funds適用含む）
    App._applyWeeklyBuffEffects();
    App._tickMilestoneBuffsWeekly();
    // v1.4w: ティッカー更新
    App._refreshTicker();
    // v0.96: Detect new injuries and show popups
    const newInjuries = G.roster.filter(c => c.injury && !oldRoster.find(o => o.id === c.id)?.injured);
    newInjuries.forEach((c, i) => {
      setTimeout(() => showEventPopup({ type:'fighter', id:c.id, name:c.name, tone:'negative',
        message: pickQuote('injury'), detail:`🏥 ${c.injury.type} — 全治${c.injury.weeksLeft}週間` }), i * 100);
    });
    // v1.2-9: Flavor event popups (雑誌取材・TV出演)
    const flavorEvents = G._flavorEvents || [];
    if (flavorEvents.length > 0) {
      const baseDelay = newInjuries.length * 100 + 50;
      flavorEvents.forEach((ev, i) => {
        const tone = ev.type === 'magazine' ? 'positive' : 'positive';
        const detail = ev.type === 'magazine'
          ? `人気 +${ev.popGain}`
          : `ヒート +${ev.heatGain}`;
        setTimeout(() => showEventPopup({
          type: 'fighter', id: ev.fighterId, name: ev.fighterName,
          tone, message: ev.headline, detail
        }), baseDelay + i * 100);
      });
      // Clean up transient field
      const { _flavorEvents, ...cleanState } = G;
      G = cleanState;
    }
    // v1.8: 週次成長イベント（スランプ発生/回復・モチベ喪失）ポップアップ
    const weekGrowthEvents = G._pendingGrowthEvents || [];
    if (G._pendingGrowthEvents) {
      const { _pendingGrowthEvents: _, ...cleanGe } = G;
      G = cleanGe;
    }
    // 自主引退処理（モチベ喪失24週超え）
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
        G = { ...G,
          roster: G.roster.filter(c => c.id !== f.id),
          retiredFighters: [...(G.retiredFighters || []), retiredF]
        };
        const delay = (newInjuries.length + flavorEvents.length) * 100 + 200;
        setTimeout(() => showRetirementPopups([{ fighter: retiredF, route: 'motivation', line, summary }]), delay);
      });
    }
    if (weekGrowthEvents.length > 0) {
      const baseDelay = (newInjuries.length + flavorEvents.length) * 100 + 100;
      setTimeout(() => showGrowthEventPopups(weekGrowthEvents), baseDelay);
    }

    // v2.0: 週次通知イベント表示（N1〜N5 トースト通知）
    const pendingNotifEvent = G._pendingNotifEvent || null;
    if (G._pendingNotifEvent) {
      const { _pendingNotifEvent: _, ...cleanNe } = G;
      G = cleanNe;
    }
    if (pendingNotifEvent) {
      const notifDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 200;
      setTimeout(() => showNotifEventToast(pendingNotifEvent), notifDelay);
    }

    // v2.0: 週次選択型イベント表示（S/E型 モーダル）
    const pendingChoiceEvent = G._pendingChoiceEvent || null;
    if (G._pendingChoiceEvent) {
      const { _pendingChoiceEvent: _, ...cleanCe } = G;
      G = cleanCe;
    }
    if (pendingChoiceEvent) {
      // 他のポップアップが閉じた後に表示するため少し遅延
      const choiceDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 400;
      setTimeout(() => {
        showChoiceEventModal(pendingChoiceEvent, G, (choiceIdx) => {
          if (choiceIdx >= 0) App.applyChoiceEvent(pendingChoiceEvent, choiceIdx);
        });
      }, choiceDelay);
    }

    // v2.0 Phase1-6: 大型イベント表示（B1〜B4 モーダル）
    const pendingLargeEvent = G._pendingLargeEvent || null;
    if (G._pendingLargeEvent) {
      const { _pendingLargeEvent: _, ...cleanLe } = G;
      G = cleanLe;
    }
    if (pendingLargeEvent) {
      const largeDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 600;
      setTimeout(() => App.handleLargeEvent(pendingLargeEvent), largeDelay);
    }

    // v1.0: Auto-advance on non-monthly weeks
    if (App._tryAutoAdvance()) return;
    showScreen('week');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[0].classList.add('active');
    refreshAll();
  },

  // Advance to next week via Engine
  advanceWeek() {
    Audio.play('tick');
    // v1.0: Clear monthly finance buffer after monthly report
    G = { ...G, monthlyFinanceBuffer: [] };
    const result = Engine.advanceWeek(G);
    G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
    // v0.96: Update mission completions
    if (G.missionEnabled) {
      const mResult = Mission.updateCompleted(G);
      G = mResult.state;
    }
    // v0.97: Update survival gauge
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment();
    sessionRng = Engine.rng.create(G.rngSeed);

    // v1.4w: 交渉成功時の新聞イベント
    if (G.negotiationResult && G.negotiationResult.success && G.negotiationResult.fighter) {
      const nf = G.negotiationResult.fighter;
      const fromOrg = (G.transferLog || []).slice(-1)[0];
      App._pushNewsEvent({ type: 'poachSuccess', characterId: nf.id,
        data: { name: nf.name, toOrg: G.orgName || 'あなたの団体',
          fromOrg: fromOrg ? fromOrg.from : '他団体',
          ovr: Engine.util.ov(nf) } });
    }
    // v1.4w: ティッカー更新
    App._refreshTicker();

    // v1.3-3: Extract pending retirements before save (transient field)
    const pendingRetirements = G.pendingRetirements || null;
    if (pendingRetirements) {
      const { pendingRetirements: _, ...cleanG } = G;
      G = cleanG;
    }

    // v1.4w: AI引退選手の新聞イベント収集（名選手: OVR70以上、年齢30以上）
    if (pendingRetirements) {
      pendingRetirements.forEach(r => {
        const f = r.fighter;
        if (!f) return;
        const ovr = Engine.util.ov(f);
        if (ovr >= 70 || (f.age || 20) >= 30) {
          const rec = f.careerRecord || {};
          const seasons = f.careerSeasons || 0;
          App._pushNewsEvent({ type: 'retirement', characterId: f.id,
            data: { name: f.name, org: G.orgName || 'あなたの団体',
              detail: `${seasons}シーズンの現役生活` } });
        }
      });
    }

    Storage.autoSave();
    Audio.bgm.playForState(); // BGM: switch on season transitions

    // v1.3-3: Show retirement popups (season-end)
    if (pendingRetirements && pendingRetirements.length > 0) {
      refreshAll();
      showRetirementPopups(pendingRetirements, () => {
        App._showNewsPanelIfNeeded(() => App._checkAndShowEnding(() => App._checkAndShowAwards()));
      });
      return;
    }

    // v1.8: AI成長イベント脅威/好機アラート（表彰式の前に表示）
    const aiAlerts = G._pendingAIGrowthAlerts || [];
    if (G._pendingAIGrowthAlerts) {
      const { _pendingAIGrowthAlerts: _, ...cleanAI } = G;
      G = cleanAI;
    }

    // v1.4w: AI成長イベントの新聞イベント収集
    aiAlerts.forEach(alert => {
      if (alert.type === 'breakthrough') {
        const orgName = alert.org ? alert.org.name : '他団体';
        App._pushNewsEvent({ type: 'breakthrough', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName,
            detail: `${(alert.stat || '').toUpperCase()} +${parseFloat((+(alert.gain||0)).toFixed(1))}` } });
      } else if (alert.type === 'slump') {
        const orgName = alert.org ? alert.org.name : '他団体';
        App._pushNewsEvent({ type: 'slump', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName } });
      } else if (alert.type === 'motivation_loss') {
        const orgName = alert.org ? alert.org.name : '他団体';
        App._pushNewsEvent({ type: 'motivationLoss', characterId: alert.fighter?.id,
          data: { name: alert.fighter?.name || '???', org: orgName } });
      }
    });

    if (aiAlerts.length > 0) {
      showAIGrowthAlerts(aiAlerts, () => App._showNewsPanelIfNeeded(() => App._checkAndShowEnding(() => App._checkAndShowAwards())));
    } else {
      // v1.4: 引退者なしでも新聞パネル→エンディングチェック→表彰式チェック
      App._showNewsPanelIfNeeded(() => App._checkAndShowEnding(() => App._checkAndShowAwards()));
    }
  },

  // v1.9: 新シーズン開幕ファンファーレのトリガー判定
  _maybeShowSeasonFanfare(callback) {
    if (G.week === 1 && !G.offSeason && G.season > 1 && typeof showSeasonFanfare === 'function') {
      showSeasonFanfare(G.season, callback);
    } else {
      callback();
    }
  },

  // v2.1: エンディング演出チェック（初クリア時のみ）
  _checkAndShowEnding(onDone) {
    if (G.endingCleared && G.endingClearedSeason === G.season - 1) {
      const data = Engine.ending.buildClearData(G);
      showEndingCeremony(data, onDone);
    } else {
      onDone();
    }
  },

  // v1.4: 年末表彰式チェック＆表示
  _checkAndShowAwards() {
    const pendingAwards = G.pendingAwards;
    if (!pendingAwards) { App._checkAndShowMilestone(() => App._maybeShowSeasonFanfare(() => refreshAll())); return; }
    // pendingAwards は transient field — 保存前にクリーン
    const { pendingAwards: _, ...cleanG } = G;
    G = cleanG;
    Storage.autoSave();
    refreshAll();
    // v1.4w: 殿堂入りの新聞イベント収集
    if (pendingAwards.hallOfFame && pendingAwards.hallOfFame.length > 0) {
      pendingAwards.hallOfFame.forEach(h => {
        App._pushNewsEvent({ type: 'hallOfFame', characterId: h.id,
          data: { name: h.name, titles: h.titleReigns || 0, defenses: h.totalDefenses || 0 } });
      });
    }
    // 表彰式ポップアップ開始
    showAwardsCeremony(pendingAwards, () => {
      // 表彰式完了後: 殿堂入り処理 + retiredFighters 清掃
      if (pendingAwards.hallOfFame && pendingAwards.hallOfFame.length > 0) {
        G = Engine.awards.applyHallOfFame(G, pendingAwards.hallOfFame);
      } else {
        G = { ...G, retiredFighters: [] };
      }
      G = { ...G, lastAwards: pendingAwards };
      Storage.autoSave();
      App._showNewsPanelIfNeeded(() => App._checkAndShowMilestone(() => App._maybeShowSeasonFanfare(() => refreshAll())));
    });
  },

  // v1.5s25b: マイルストーン検出
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
      }
      if (triggered) return evt;
    }
    return null;
  },

  // v1.5s25b: マイルストーンチェック→UI→適用のフロー
  _checkAndShowMilestone(onDone) {
    const evt = App._checkMilestones();
    if (!evt) { onDone(); return; }
    // first_rivalry はナレーション動的生成
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
          narration: `${n1}と${n2}——\nリング上で何度も火花を散らしたふたりの間に、\n特別な空気が漂い始めている。\nこの因縁、どう活かしていくか——`,
          choices: evt.choices.map((ch, i) => {
            if (i === 1 && ch.effect.type === 'next_match_mq') {
              return { ...ch, effect: { ...ch.effect, pair: [id1, id2] } };
            }
            return ch;
          })
        };
      }
    }
    Audio.play('notify');
    showMilestoneEvent(displayEvt, (choiceIdx) => {
      App._applyMilestoneChoice(displayEvt, choiceIdx);
      onDone();
    });
  },

  // v1.5s25b: マイルストーン選択肢の効果適用
  _applyMilestoneChoice(evt, choiceIdx) {
    const choice = evt.choices[choiceIdx];
    const eff = choice.effect;
    const buff = { ...eff, source: evt.id };

    // 週カウント系
    if (eff.weeks) buff.remainingWeeks = eff.weeks;
    // 興行カウント系
    if (eff.shows) buff.remainingShows = eff.shows;

    // 即時効果: rivalry_boost — 因縁カウントを即時+1
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

  // v1.5s25b: milestoneBuffs の週カウントダウン（毎週processWeek後に呼ぶ）
  _tickMilestoneBuffsWeekly() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const newBuffs = G.milestoneBuffs
      .map(b => b.remainingWeeks != null ? { ...b, remainingWeeks: b.remainingWeeks - 1 } : b)
      .filter(b => b.remainingWeeks == null || b.remainingWeeks > 0);
    G = { ...G, milestoneBuffs: newBuffs };
  },

  // v1.5s25b: milestoneBuffs の興行カウントダウン（興行後に呼ぶ）
  _tickMilestoneBuffsShow() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const newBuffs = G.milestoneBuffs
      .map(b => b.remainingShows != null ? { ...b, remainingShows: b.remainingShows - 1 } : b)
      .filter(b => b.remainingShows == null || b.remainingShows > 0);
    G = { ...G, milestoneBuffs: newBuffs };
  },

  // v1.5s25b: weekly_funds バフの資金適用（毎週processWeek/closeShowResult後に呼ぶ）
  _applyWeeklyBuffEffects() {
    if (!G.milestoneBuffs || G.milestoneBuffs.length === 0) return;
    const weeklyFundsBuff = G.milestoneBuffs.find(b => b.type === 'weekly_funds');
    if (weeklyFundsBuff) {
      const amount = weeklyFundsBuff.amount || 0;
      G = { ...G, funds: G.funds + amount };
    }
  },

  // v2.0: 選択型イベントの選択結果を適用
  applyChoiceEvent(event, choiceIdx) {
    const result = Engine.eventSystem.applyChoiceEffect(event, choiceIdx, G);
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      gameLog: [...(G.gameLog || []), ...(result.events || [])]
    };
    Storage.autoSave();
    if (result.events && result.events.length > 0) {
      showToast(result.events[result.events.length - 1]);
    }
    Audio.play('notify');
    renderManagePanel();
  },

  // v2.0 Phase1-6: 大型イベントUIフロー制御
  handleLargeEvent(event) {
    // Step 0: 初期表示
    showLargeEventModal(event, G, 0, (choiceIdx) => {
      if (choiceIdx < 0) return;
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B2));
      const result = Engine.eventSystem.applyLargeEventEffect(event, 0, choiceIdx, G, rng);
      App._applyLargeEventResult(result);

      if (result.nextStep === 1) {
        // B2: 介入選択 / B3: 代表選手選択
        setTimeout(() => {
          showLargeEventModal(event, G, 1, (choiceIdx2) => {
            if (choiceIdx2 < 0) return;
            const rng2 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B3));
            const result2 = Engine.eventSystem.applyLargeEventEffect(event, 1, choiceIdx2, G, rng2);
            App._applyLargeEventResult(result2);

            if (result2.nextStep === 2) {
              // B2: 試合シミュレーション / B3: 試合シミュレーション
              setTimeout(() => App._executeLargeEventMatch(event, result2), 300);
            }
          });
        }, 300);
      }
    });
  },

  // 大型イベント: 試合シミュレーション＋結果表示
  _executeLargeEventMatch(event, prevResult) {
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));

    if (event.type === 'B2') {
      // B2: 対立の試合
      const intervention = prevResult.interventionChoice; // 0=f1, 1=f2, 2=neutral
      let f1 = G.roster.find(f => f.id === event.fighter1);
      let f2 = G.roster.find(f => f.id === event.fighter2);
      if (!f1 || !f2) return;

      // 介入バフの適用（一時的コピー）
      f1 = { ...f1 };
      f2 = { ...f2 };
      if (intervention === 0) {
        f1 = { ...f1, pw: (f1.pw || 50) + 5, sp: (f1.sp || 50) + 5, te: (f1.te || 50) + 5, st: (f1.st || 50) + 5 };
      } else if (intervention === 1) {
        f2 = { ...f2, pw: (f2.pw || 50) + 5, sp: (f2.sp || 50) + 5, te: (f2.te || 50) + 5, st: (f2.st || 50) + 5 };
      }

      const matchResult = Engine.battle.simulateMatch(f1, f2, rng);
      const winner = matchResult.winner === 'left' ? 'fighter1' : (matchResult.winner === 'right' ? 'fighter2' : 'draw');

      // 結果をeventに添付して Step 2 を適用
      const enrichedEvent = { ...event, matchResult: { ...matchResult, winner }, interventionChoice: intervention };
      const rng3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B5));
      const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
      App._applyLargeEventResult(result3);

      // 結果表示モーダル
      setTimeout(() => {
        showLargeEventModal(enrichedEvent, G, 2, () => {
          Audio.play('notify');
          renderManagePanel();
        });
      }, 300);

    } else if (event.type === 'B3') {
      // B3: 対抗戦
      const fighterId = prevResult.selectedFighterId;
      const playerFighter = G.roster.find(f => f.id === fighterId);
      if (!playerFighter) return;
      const challenger = event.challenger;
      if (!challenger) return;

      const matchResult = Engine.battle.simulateMatch(playerFighter, challenger, rng);

      // 結果をeventに添付して Step 2 を適用
      const enrichedEvent = { ...event, matchResult, selectedFighterId: fighterId };
      const rng3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B6));
      const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
      App._applyLargeEventResult(result3);

      // 新聞パネルイベント
      const newsType = matchResult.winner === 'left' ? 'interPromoWin' : (matchResult.winner === 'right' ? 'interPromoLoss' : 'interPromoDraw');
      App._pushNewsEvent({ type: newsType, data: { orgName: event.orgName, fighterName: playerFighter.name, challengerName: challenger.name } });

      // 結果表示モーダル
      setTimeout(() => {
        showLargeEventModal(enrichedEvent, G, 2, () => {
          Audio.play('notify');
          renderManagePanel();
        });
      }, 300);
    }
  },

  // 大型イベント結果をstateに反映するヘルパー
  _applyLargeEventResult(result) {
    const updates = {};
    if (result.roster) updates.roster = result.roster;
    if (result.funds !== undefined) updates.funds = result.funds;
    if (result.lockerRoomMorale !== undefined) updates.lockerRoomMorale = result.lockerRoomMorale;
    if (result.mediaSpotlight !== undefined) updates.mediaSpotlight = result.mediaSpotlight;
    if (result.lastLargeEventWeek !== undefined) updates.lastLargeEventWeek = result.lastLargeEventWeek;
    if (result.orgPopDelta) updates.orgPop = G.orgPop + result.orgPopDelta;
    if (result.events && result.events.length > 0) {
      updates.gameLog = [...(G.gameLog || []), ...result.events];
    }
    G = { ...G, ...updates };
    Storage.autoSave();
    if (result.events && result.events.length > 0) {
      showToast(result.events[result.events.length - 1]);
    }
  },

  // v2.0: ケアアクション モーダル表示
  openCareModal() {
    Audio.play('click');
    showCareActionModal(G, (actionId, fighterId) => {
      App.executeCareAction(actionId, fighterId);
    });
  },

  // v2.0: ケアアクション実行 (event-system-spec-v2.md §2)
  executeCareAction(actionId, fighterId) {
    const result = Engine.careActions.execute(actionId, fighterId, G);
    if (!result) { showToast('アクションが見つかりません'); return; }
    if (result.error === 'funds_insufficient') { showToast('資金が不足しています'); return; }
    if (result.error === 'fighter_not_found')  { showToast('選手が見つかりません'); return; }
    if (result.error === 'not_injured')         { showToast('怪我をしていない選手には使用できません'); return; }
    if (result.error === 'already_used_this_week') { showToast('今週はすでに使用済みです（週1回まで）'); return; }

    // state 更新
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      gameLog: [...(G.gameLog || []), ...(result.events || [])]
    };
    Storage.autoSave();

    // フィードバック: 選手の顔+セリフ表示（個人向けのみ）
    const reactionKey = result.reactionKey || actionId;
    const reactFighterId = result.reactionFighterId;
    if (reactFighterId != null) {
      const fighter = G.roster.find(f => f.id === reactFighterId);
      if (fighter) {
        const text = Engine.careActions.getReactionText(reactionKey, fighter);
        _showCareReaction(fighter, text);
      }
    } else {
      // 団体向け: 代表の1人を選んでセリフ表示
      const healthyRoster = G.roster.filter(f => !f.injury && !f.isRental);
      if (healthyRoster.length > 0) {
        const rep = healthyRoster[Math.floor(Math.random() * healthyRoster.length)];
        const text = Engine.careActions.getReactionText(reactionKey, rep);
        _showCareReaction(rep, text);
      }
    }

    // 料金差引トースト
    const cfg = typeof CARE_ACTIONS !== 'undefined' ? (CARE_ACTIONS[actionId] || {}) : {};
    const label = cfg.label || actionId;
    showToast(`${cfg.emoji || '💝'} ${label} 実行（-${cfg.cost || 0}万）`);
    Audio.play('coin');
    renderManagePanel();
  },

  // v0.96: Mission system
  toggleMission(enabled) {
    Audio.play('click');
    G = { ...G, missionEnabled: enabled };
    Storage.autoSave();
    refreshAll();
  },
  checkMissionUpdate() {
    if (!G.missionEnabled) return;
    const mResult = Mission.updateCompleted(G);
    G = mResult.state;
  },

  // v0.97: Survival gauge
  checkSurvivalUpdate() {
    const sResult = Survival.updateSurvival(G);
    const wasCleared = G.survivalCleared;
    G = sResult.state;
    if (sResult.graduated && !wasCleared) {
      // Show graduation popup!
      setTimeout(() => showEventPopup({
        type: 'generic', emoji: '🎊', name: '経営安定化達成！',
        message: '赤字地獄を乗り越え、ついに安定した黒字経営を達成しました！',
        detail: '💪 これからは成長フェーズです。更なる高みを目指しましょう！',
        tone: 'gold'
      }), 200);
    }
  },

  // v1.0: Title establishment check
  checkTitleEstablishment() {
    if (G.titleEstablished) return;
    if (Engine.title.checkTitleEstablishment(G)) {
      G = { ...G, titleEstablished: true };
      setTimeout(() => showEventPopup({
        type: 'generic', emoji: '🏆', name: '団体王座 設立！',
        message: '団体の実績が認められ、団体王座を設立できるようになりました！',
        detail: '🎖️ 興行で「初代王者決定戦」を組んで、初代チャンピオンを決めましょう！',
        tone: 'gold'
      }), 300);
    }
  },

  // ══════════════════════════════════════════════
  //  WAR MATCH PREVIEW SYSTEM (v0.99d)
  // ══════════════════════════════════════════════
  _warPreview: null,

  // Start war match preview (called from acceptWarChallenge in ui-common)
  initWarPreview(ev, card) {
    App._warPreview = {
      ev,
      card,                         // [{playerFighter, aiFighter}, ...]
      results: card.map(() => null), // null = unresolved
      currentWatching: -1
    };
    Audio.bgm.play('battle');
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
        portraitUrl: getPortraitUrl(pf.id),
        vl: pf.voiceLines || pf.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[pf.id]) || ['…！']
      },
      right: {
        ...af, condition: 80,
        portraitUrl: getPortraitUrl(af.id),
        vl: af.voiceLines || af.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[af.id]) || ['…！']
      },
      matchInfo: {
        header: `⚔ 対抗戦 第${idx + 1}試合`,
        subHeader: `${pf.name} vs ${af.name}`,
        matchNum: idx + 1,
        totalMatches: wp.card.length,
        isTitle: false
      }
    };
    let sent = false;
    const sendOnce = () => {
      if (sent) return; sent = true;
      iframe.contentWindow.postMessage(msg, '*');
    };
    iframe.onload = () => setTimeout(sendOnce, 200);
    const baseSrc = (iframe.getAttribute('src') || 'battle-engine.html').split('?')[0];
    iframe.src = baseSrc + '?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // Skip a war match (auto-resolve)
  warSkipMatch(idx) {
    const wp = App._warPreview;
    if (!wp || wp.results[idx]) return;
    const m = wp.card[idx];
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 600 + G.week + idx));
    const result = Engine.event.resolveEventMatch(rng, m.playerFighter, m.aiFighter, 0);
    wp.results[idx] = {
      playerFighter: m.playerFighter, aiFighter: m.aiFighter,
      winner: result.winner, mq: result.mq,
      playerWon: result.winner === 'left',
      finType: result.finType || '', finMove: result.finMove || '',
      turns: result.turns || 0
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
      wp.results[idx] = {
        playerFighter: m.playerFighter, aiFighter: m.aiFighter,
        winner: result.winner, mq: result.mq,
        playerWon: result.winner === 'left',
        finType: result.finType || '', finMove: result.finMove || '',
        turns: result.turns || 0
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
    // Guard: ignore duplicate results
    if (wp.results[idx]) { document.getElementById('battleOverlay').style.display = 'none'; wp.currentWatching = -1; return; }
    const m = wp.card[idx];
    wp.results[idx] = {
      playerFighter: m.playerFighter, aiFighter: m.aiFighter,
      winner: data.winner, mq: data.mq || 50,
      playerWon: data.winner === 'left',
      finType: data.finType || '', finMove: data.finMove || '',
      turns: data.turns || 0
    };
    // Hide iframe
    document.getElementById('battleOverlay').style.display = 'none';
    wp.currentWatching = -1;
    Audio.play('coin');
    renderWarMatchPreview();
    if (wp.results.every(r => r !== null)) App.finalizeWar();
  },

  // Finalize war: apply outcome to game state, show result
  finalizeWar() {
    const wp = App._warPreview;
    if (!wp) return;
    const ev = wp.ev;
    let playerWins = 0, aiWins = 0;
    wp.results.forEach(r => { if (r.playerWon) playerWins++; else aiWins++; });

    // Apply outcome to state
    const events = [];
    wp.results.forEach((r, i) => {
      const icon = r.playerWon ? '🔵' : '🔴';
      events.push(`  ${icon} 第${i+1}試合: ${r.playerFighter.name} vs ${r.aiFighter.name} → ${r.playerWon ? r.playerFighter.name : r.aiFighter.name}勝利 (MQ${r.mq})`);
    });
    const outcome = Engine.event.applyWarOutcome(G, playerWins, aiWins, ev.opponentOrgId);
    const eventWon = playerWins > aiWins;
    G = { ...outcome.state, gameLog: [...G.gameLog, ...events, ...outcome.events] };

    // v1.3: Record war appearances for participating player fighters
    const warFighterIds = new Set(wp.card.map(m => m.playerFighter.id));
    G = { ...G, roster: G.roster.map(c => {
      if (!warFighterIds.has(c.id)) return c;
      const matchResult = wp.results.find(r => r.playerFighter.id === c.id);
      return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: ev.opponentName, won: matchResult ? matchResult.playerWon : false });
    }) };

    const evStats = { ...(G.seasonStats || {}) };
    if (eventWon) {
      evStats.eventsWon = (evStats.eventsWon || 0) + 1;
      // F2: Track war victories for negotiation bonus
      const wv = [...(G.warVictories || [])];
      if (!wv.includes(ev.opponentOrgId)) wv.push(ev.opponentOrgId);
      G = { ...G, warVictories: wv };
    }
    else { evStats.eventsLost = (evStats.eventsLost || 0) + 1; }
    G = { ...G, seasonStats: evStats, weekPhase: 'manage', lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] } };
    Storage.autoSave();

    // Close match preview overlay, show final result
    document.getElementById('showResultOverlay').classList.remove('active');
    setTimeout(() => renderWarFinalResult(ev, wp.results, playerWins, aiWins, eventWon), 300);
    App._warPreview = null;
  }
};

// v2.1: クレジット画面
App.showCredits = function() {
  // 楽曲クレジットを動的にレンダリング
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
    : { season: 1, orgName: '団体', playerRating: 1000, peakOrgPop: 0, totalShows: 0, bestMQ: 0, hallOfFameCount: 0, top3Fighters: [], coaches: [] };
  setTimeout(() => showEndingCeremony(data, () => {}), 300);
};

// Alias for old UI calls
// COACH_MAX_ASSIGN already defined in data section

