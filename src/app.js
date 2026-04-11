// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 0: AUDIO SYSTEM (SFX + BGM)                     ║
// ║  Web Audio API synthesized sounds — no external files     ║
// ╚══════════════════════════════════════════════════════════╝

const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let bgmMasterGain = null; // BGMカテゴリ全体のマスター
  let sfxMasterGain = null; // SEカテゴリ全体のマスター
  let sfxGain = null;
  let bgmGain = null;
  let bgmNodes = null;  // active BGM oscillator nodes
  let _muted = false;
  let _sfxVol = 0.5;
  let _bgmVol = 0.04; // ≈ demo preview 15%
  let _bgmMuted = false; // BGM-only mute (jingles/SFX still play)
  let _bgmMasterVol = 0.7;  // BGMマスター（デフォルト70%）
  let _sfxMasterVol = 1.0;  // SEマスター（デフォルト100%）
  // ── Per-track volume targets (bgmGain.gain.value) ──
  const CHIPTUNE_BGM_MIX = { kaimaku:0.19, management:0.35, battle:0.32, season_end:0.46, tension:0.42 };
  // ── SUNO BGM file mapping (replaces chiptune for 5 main tracks) ──
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
    // notifyより一段重い「ポォン」— E5→G5 上昇2音
    event() {
      const t = ensure().currentTime;
      osc(659, 'sine', t, 0.09, 0.18);
      osc(659, 'triangle', t, 0.04, 0.08);
      osc(784, 'sine', t + 0.14, 0.12, 0.22);
      osc(784, 'triangle', t + 0.14, 0.05, 0.10);
      noiseHP(t + 0.14, 0.02, 0.06, 5000);
    },
    // ソフトなシンバルブラシ＋高域sine減衰 — アワード式スライド切替
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
    // C5-E5-G5 ベルハーモニクス＋スパークル — 受賞発表（fanfare代替）
    award() {
      const t = ensure().currentTime;
      bellPartial(523, t,        0.4, 0.15);
      bellPartial(659, t + 0.12, 0.5, 0.12);
      bellPartial(784, t + 0.26, 0.6, 0.09);
      noiseHP(t + 0.26, 0.08, 0.04, 7000);
    },
    // 短いドラムロール → シンバル一打 — ランキング発表等
    tension_hit() {
      const t = ensure().currentTime;
      noiseLP(t,        0.12, 0.15, 200);
      noiseLP(t + 0.04, 0.10, 0.11, 250);
      noiseLP(t + 0.09, 0.08, 0.08, 300);
      noiseHP(t + 0.18, 0.5,  0.12, 4000);
      osc(60, 'sine',   t + 0.18, 0.4, 0.08);
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

    // ── Rivalry SFX (NEW) ──
    // 宣戦布告: ドラムロール→ゴング→ブラス上昇→歓声
    rivalry_confrontation() {
      const t = ensure().currentTime;
      // 1. ドラムロール連打（5発、クレッシェンド）
      for (let i = 0; i < 5; i++) {
        const g = 0.04 + i * 0.025;
        noiseLP(t + i * 0.08, 0.06, g, 300);
        osc(80 + i * 5, 'sine', t + i * 0.08, 0.05, g * 0.5);
      }
      // 2. ゴング一打
      osc(90, 'sine', t + 0.4, 1.2, 0.12);
      osc(800, 'sine', t + 0.4, 0.3, 0.06);
      osc(1600, 'sine', t + 0.4, 0.15, 0.03);
      noiseHP(t + 0.4, 0.08, 0.06, 5000);
      // 3. ブラス上昇＋歓声
      oscSweep(200, 500, 'sawtooth', t + 0.7, 0.4, 0.05);
      noiseHP(t + 0.8, 0.6, 0.04, 2000);
    },
    // 宿命の相手 宣戦布告: より太く長い
    fate_confrontation() {
      const t = ensure().currentTime;
      const vol = 1.2;
      // 1. ドラムロール連打（5発、クレッシェンド、音量1.2倍）
      for (let i = 0; i < 5; i++) {
        const g = (0.04 + i * 0.025) * vol;
        noiseLP(t + i * 0.08, 0.06, g, 300);
        osc(80 + i * 5, 'sine', t + i * 0.08, 0.05, g * 0.5);
      }
      // 2. ゴング一打
      osc(90, 'sine', t + 0.4, 1.2, 0.12 * vol);
      osc(800, 'sine', t + 0.4, 0.3, 0.06 * vol);
      osc(1600, 'sine', t + 0.4, 0.15, 0.03 * vol);
      noiseHP(t + 0.4, 0.08, 0.06 * vol, 5000);
      // 3. ブラス上昇＋歓声（延長）
      oscSweep(200, 500, 'sawtooth', t + 0.7, 0.4, 0.05 * vol);
      noiseHP(t + 0.8, 0.9, 0.04 * vol, 2000);
      // 4. 太い低音＋追加ブラス
      osc(60, 'sine', t + 0.5, 1.5, 0.08);
      oscSweep(300, 600, 'sawtooth', t + 0.8, 0.5, 0.04);
    },
    // 宿敵決着: インパクト＋ファンファーレ＋歓声
    rivalry_resolution() {
      const t = ensure().currentTime;
      // インパクト
      osc(60, 'sine', t, 0.3, 0.1);
      noise(t, 0.06, 0.1);
      // ファンファーレ（4音）
      bellPartial(523, t + 0.1,  0.5, 0.12);
      bellPartial(659, t + 0.22, 0.6, 0.10);
      bellPartial(784, t + 0.36, 0.7, 0.08);
      bellPartial(1047, t + 0.5, 0.8, 0.06);
      // 歓声
      noiseHP(t + 0.3, 0.8, 0.05, 2000);
      noiseHP(t + 0.5, 0.5, 0.03, 5000);
    },
    // 宿命の相手 最終決着: 壮大版
    fate_resolution() {
      const t = ensure().currentTime;
      // 深いインパクト
      osc(50, 'sine', t, 0.5, 0.12);
      osc(100, 'sine', t, 0.3, 0.08);
      noise(t, 0.08, 0.12);
      // 壮大ファンファーレ（5音）
      bellPartial(523, t + 0.1,  0.7, 0.14);
      bellPartial(659, t + 0.25, 0.8, 0.12);
      bellPartial(784, t + 0.4,  0.9, 0.10);
      bellPartial(1047, t + 0.55, 1.0, 0.08);
      bellPartial(1319, t + 0.7, 0.8, 0.06);
      // 大歓声
      noiseHP(t + 0.3, 1.2, 0.06, 2000);
      noiseHP(t + 0.6, 0.8, 0.04, 5000);
      // 低音の重み
      osc(65, 'sine', t + 0.5, 1.0, 0.06);
      oscSweep(200, 400, 'sawtooth', t + 0.8, 0.5, 0.03);
    },
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
      // SUNO MP3がある曲はFileBGMで再生
      const suno = SUNO_BGM[trackName];
      if (suno) {
        BGM.stop();
        FileBGM.play(suno.file, { loop: true, volume: suno.vol });
        // FileBGM.play()内部でBGM.stop()が呼ばれるため、状態セットはその後に行う
        BGM._playing = true;
        BGM._current = trackName;
        return;
      }
      // フォールバック: チップチューン
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
      // タイトル戴冠: MP3ファイル版を使用（bgmMuted無視で必ず再生）
      if (name === 'championship') {
        FileBGM.stop();
        const a = new window.Audio('bgm/fanfare_brass_v1.mp3');
        a.volume = Math.min(1.0, JINGLE_MIX.championship);
        a.play().catch(() => {});
        FileBGM._audio = a;
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
      if (G.weekPhase === 'draft' || G.weekPhase === 'opening') { BGM.play('kaimaku'); return; }
      if ((G.offSeason && G.offWeek >= 2) || G.weekPhase === 'offseason') { BGM.play('season_end'); return; }
      if (G.weekPhase === 'showExec') { BGM.play('battle'); return; }
      if (G.weekPhase === 'event') {
        // War challenge uses its own FileBGM — don't override
        if (G.pendingEvent && G.pendingEvent.type === 'war' && FileBGM._audio && BGM._current !== 'tension') return;
        BGM.play('tension'); return;
      }
      // draft-negotiation-spec §8.1: ドラフト速報+交渉時はtension
      if (G.weekPhase === 'scoutEvent' && (G._draftInterests || G._draftNegotiation)) { BGM.play('tension'); return; }
      BGM.play('management'); // management + showPrep + draft newspaper all use this
    }
  };

  // ╔══════════════════════════════════════════════════╗
  // ║  FileBGM: HTMLAudioElement ベースのファイルBGM   ║
  // ╚══════════════════════════════════════════════════╝
  const FileBGM = {
    _audio: null,
    _fadeTimer: null,
    _mix: 1,
    _vol: null, // 明示的volume保持（updateVolumeで使用）
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

  // ╔══════════════════════════════════════════════════╗
  // ║  PUBLIC API                                      ║
  // ╚══════════════════════════════════════════════════╝
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
    // BGM/SE マスター音量
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
  };
})();


// ╔══════════════════════════════════════════════════════════╗
// ║  SECTION 6b: MISSION SYSTEM (v0.96)                       ║
// ║  Guided progression — pure functions, no DOM              ║
// ╚══════════════════════════════════════════════════════════╝

function hasPlayerHistoricRank1(state) {
  if (!state) return false;
  if ((state.rankings || [])[0]?.orgId === 'player') return true;
  if (state.endingCleared) return true;
  if ((state.endingClearedSeason || 0) > 0) return true;
  return (state.seasonHistory || []).some(season => (season?.rank || 99) === 1);
}
const MISSIONS = [
  // ── BEGINNER: 最初の一歩 ──
  { id:'hire_coach',    phase:0, icon:'育', name:'コーチを雇おう',
    desc:'スタッフ募集から最初のコーチを雇用しよう。選手の成長速度が大幅にアップ！',
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
  { id:'assign_coach',  phase:0, icon:'🎓', name:'コーチに選手を任せよう',
    desc:'コーチを雇ったら、団体画面で選手をアサインしましょう！',
    screen:'roster', check: G => Object.values(G.coachAssign || {}).flat().length >= 1 },

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
    desc:'団体画面で全選手にコーチを割り当てて、成長効率を最大化！',
    screen:'roster', check: G => {
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
      return hasPlayerHistoricRank1(G);
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
const SAVE_COMPRESS_MARKER = 'WM_LZ|';

// ─── セーブデータ トリミング定数 ───
const SAVE_TRIM = {
  gameLogMax: 200,       // gameLog上限
  growthLogMax: 100,     // キャラ毎growthLog上限
  financeKeepSeasons: 2, // financeHistory保持シーズン数
  matchupLogMax: 60,     // matchupLog上限（12show窓 + 余裕）
  aiMatchupLogMax: 40,   // AI団体matchupLog上限
};

const Storage = {
  // ─── セーブデータ圧縮: トリミング + LZ-UTF16 ───
  serialize(G) {
    const state = JSON.parse(JSON.stringify(G));
    state.roster.forEach(c => {
      delete c._weekAction; c.intensive = false;
      // growthLog トリミング
      if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
        c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
      }
    });
    // P4-P6: transient Glimpse フィールド除外
    delete state._pendingGlimpseA;
    delete state._pendingGlimpseB;
    delete state._pendingHotStreakEnds;
    // gameLog トリミング
    if (state.gameLog && state.gameLog.length > SAVE_TRIM.gameLogMax) {
      state.gameLog = state.gameLog.slice(-SAVE_TRIM.gameLogMax);
    }
    // debugLog は保存不要
    state.debugLog = [];
    // financeHistory: 直近N シーズンのみ
    if (state.financeHistory && state.financeHistory.length > 0) {
      const minSeason = state.season - SAVE_TRIM.financeKeepSeasons + 1;
      state.financeHistory = state.financeHistory.filter(h => h.season >= minSeason);
    }
    // matchupLog トリミング（鮮度計算は直近12showのみ使用、hasEverFoughtはペアSetで代替）
    if (state.matchupLog && state.matchupLog.length > SAVE_TRIM.matchupLogMax) {
      // hasEverFought用のペアセットを構築（全履歴から）
      const everFoughtSet = new Set();
      state.matchupLog.forEach(e => {
        const a = Math.min(e.leftId, e.rightId), b = Math.max(e.leftId, e.rightId);
        everFoughtSet.add(`${a}>${b}`);
      });
      state._everFoughtPairs = [...everFoughtSet];
      state.matchupLog = state.matchupLog.slice(-SAVE_TRIM.matchupLogMax);
    }
    // AI団体 matchupLog トリミング
    if (state.aiOrgs) {
      for (const orgId in state.aiOrgs) {
        const org = state.aiOrgs[orgId];
        if (org.matchupLog && org.matchupLog.length > SAVE_TRIM.aiMatchupLogMax) {
          org.matchupLog = org.matchupLog.slice(-SAVE_TRIM.aiMatchupLogMax);
        }
        // AI選手のgrowthLog トリミング
        if (org.roster) {
          org.roster.forEach(c => {
            if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
              c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
            }
          });
        }
      }
    }
    // freeAgentsのgrowthLog トリミング
    if (state.freeAgents) {
      state.freeAgents.forEach(c => {
        if (c.growthLog && c.growthLog.length > SAVE_TRIM.growthLogMax) {
          c.growthLog = c.growthLog.slice(-SAVE_TRIM.growthLogMax);
        }
      });
    }
    state._saveVersion = '1.0b';
    state._saveDate = new Date().toISOString();
    // LZ圧縮 + マーカー
    const json = JSON.stringify(state);
    return SAVE_COMPRESS_MARKER + LZString.compressToUTF16(json);
  },

  // ─── 圧縮/非圧縮セーブの自動判定ヘルパー ───
  _parseRaw(raw) {
    // 新マーカー(WM_LZ|) or 旧マーカー(WM_LZ\x00) 両対応
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

      // v3.0: 旧セーブの全ID列挙 availableCoaches → シーズンプールに変換
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
      // データ整合性: AI団体選手がfreeAgentsに混入している場合は正しい団体ロスターへ移動
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
      // データ整合性: プレイヤーロスター選手がfreeAgentsに重複している場合は除去
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
      // v1.0e: poolIds → dormantPool migration
      if (G.poolIds && !G.dormantPool) G = { ...G, dormantPool: G.poolIds };
      if (!G.dormantPool) G = { ...G, dormantPool: Engine.rival.getDormantIds() };
      // FIFO: dormantPool エントリを {id, age} 形式に統一（レガシー文字列ID対応）
      if (G.dormantPool && G.dormantPool.length > 0 && typeof G.dormantPool[0] === 'string') {
        G = { ...G, dormantPool: G.dormantPool.map(e => typeof e === 'string' ? { id: e, age: 17 } : e) };
      }
      if (!G.orgName) G = { ...G, orgName: 'プレイヤー団体' };

      // v0.9b backward compat: offseason system
      if (G.offSeason === undefined) G = { ...G, offSeason: false, offWeek: 0 };
      // v0.9c backward compat: transfer
      if (G.pendingPoach === undefined) G = { ...G, pendingPoach: [] };
      // v0.9d backward compat: rental & events
      if (G.rentals === undefined && G.rental === undefined) G = { ...G, rentals: [], warThisSeason: false, challengeTrigger: null, pendingEvent: null };
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

      // 安全弁: 王者がロスターに存在しない場合は空位にする（退団パス漏れ修復）
      if (G.titles?.world?.championId && !G.roster.find(c => c.id === G.titles.world.championId)) {
        G = { ...G, titles: { ...G.titles, world: { ...G.titles.world, championId: null, defenses: 0 } } };
        console.log('[Migration] 王者がロスターに不在のため王座を空位に修復しました');
      }

      G = { ...G, version: '0.9' };

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
      // ※フラグ制御: 成長でnotionValueに到達したFAのステを誤ってリセットしないよう一度きり
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
      // ※フラグ制御: 旧セーブへの一度きりの修正。毎ロード実行は年齢変動バグの原因になる
      if (!G._migrated_v1_2_fa_age) {
        G = { ...G, freeAgents: G.freeAgents.map(c => {
          if (c.age > 17) return c; // only fix age ≤17 FAs (legacy: was 16)
          const ageRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, c.id, 1616));
          const newAge = 17 + Engine.rng.int(ageRng, 0, 6);
          const nv = c.notionValue || {pw:c.pw,sp:c.sp,te:c.te,st:c.st,mn:c.mn};
          const startVals = Engine.rival.generateStartValues(ageRng, nv, newAge);
          return { ...c, age: newAge, ...startVals };
        })};
        G = { ...G, _migrated_v1_2_fa_age: true };
      }

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
          const decayStart = 23 + dur;
          // 既存ベテランへの配慮: 理論値の70%でwearを後付け
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
        const endingCleared = G.endingCleared || hasPlayerHistoricRank1(G);
        const endingClearedSeason = G.endingClearedSeason || ((G.seasonHistory || []).find(s => (s?.rank || 99) === 1)?.season) || null;
        G = { ...G, endingCleared, endingClearedSeason, _migrated_ending: true };
      }
      // v2.0 Phase1-6: 大型イベント マイグレーション
      if (!G._migrated_large_events) {
        G = { ...G, lastLargeEventWeek: G.lastLargeEventWeek || 0, mediaSpotlight: G.mediaSpotlight || null, _migrated_large_events: true };
      }
      // L1: 会場システム再設計マイグレーション
      if (!G._migrated_venue_redesign) {
        // 旧7段→新10段: 0=公民館→0, 1=小ホール→1, 2=市民会館→3, 3=中ホール→4, 4=アリーナ→7, 5=大会場→8, 6=ドーム→9
        const venueMap = {0:0, 1:1, 2:3, 3:4, 4:7, 5:8, 6:9};
        G = { ...G,
          showVenue: venueMap[G.showVenue] ?? 0,
          attendanceMomentum: 0,
          _migrated_venue_redesign: true
        };
      }

      // Rental system migration: G.rental (single object) → G.rentals (array)
      if (!G._migrated_rental_v2) {
        const rentals = Array.isArray(G.rentals) ? [...G.rentals] : [];
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
          // Update rental fighter's new fields
          const rf = (G.roster || []).find(c => c.id === old.fighterId);
          if (rf) {
            rf.rentalSource = 'rival';
            rf.rentalSeasonsLeft = 1;
          }
        }
        G = { ...G, rentals, rental: undefined, _migrated_rental_v2: true };
      }

      // Rental v3: seasonsLeft → weeksLeft (1期=12週の週次減算に移行)
      if (!G._migrated_rental_v3) {
        const rentals = (G.rentals || []).map(r => {
          if (r.weeksLeft != null) return r; // 既に移行済み
          // 旧 seasonsLeft を weeksLeft に変換: seasonsLeft * 12
          const wl = (r.seasonsLeft || 1) * 12;
          const { seasonsLeft, ...rest } = r;
          return { ...rest, weeksLeft: wl };
        });
        // roster上の rentalSeasonsLeft → rentalWeeksLeft
        const roster = (G.roster || []).map(c => {
          if (!c.isRental) return c;
          const ct = rentals.find(r => r.fighterId === c.id);
          const { rentalSeasonsLeft, ...rest } = c;
          return { ...rest, rentalWeeksLeft: ct ? ct.weeksLeft : (rentalSeasonsLeft || 1) * 12 };
        });
        G = { ...G, rentals, roster, _migrated_rental_v3: true };
      }

      // ranking-roster-redesign v1.0 Phase 1: battlePoints + summitBonus廃止
      if (!G._migrated_ranking_v2) {
        const bp = { player: 0, org_s: 0, org_a: 0, org_b: 0 };
        // summitBonusが残っていればplayer battlePointsに移行
        if (G.summitBonus) bp.player = G.summitBonus;
        G = { ...G, battlePoints: bp, _migrated_ranking_v2: true };
        delete G.summitBonus;
        // ランキングを再計算
        G = { ...G, rankings: Engine.ranking.updateRankings(G) };
      }

      // 因縁リデザインv2: resolutionCount + matchupLog
      if (!G._migrated_rivalry_v2) {
        const migratedRivalries = {};
        Object.entries(G.rivalries || {}).forEach(([key, rv]) => {
          migratedRivalries[key] = { ...rv, resolutionCount: rv.resolutionCount || 0 };
        });
        // matchupLog補完: rivalriesから対戦履歴を復元し、初顔合わせ誤判定を防ぐ
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

      // matchupLog補完v2: 既にrivalry_v2マイグレーション済みだが空logのセーブデータ対応
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

      // PPV GRAND FINAL マイグレーション
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

      // scout-pricing v2: assessedValue再計算（TIERS baseMin/Max引き上げ対応）
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

      // 契約交渉: salaryBonusフィールド追加
      if (!G._migrated_contract_v1) {
        G.roster.forEach(f => { if (f.salaryBonus === undefined) f.salaryBonus = 0; });
        G = { ...G, _migrated_contract_v1: true };
      }

      // NPC記録統一: AI選手にcareerBestMQ + orgDataにmatchupLog/seasonBreakthroughs/showCount
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

      // Phase 1: 人間関係データ基盤 — 既存セーブデータとの互換性
      if (!G._migrated_relationships_v1) {
        if (!G.relationships || Object.keys(G.relationships).length === 0) {
          G = Engine.relationships.initialize(G);
        }
        if (!G.relationshipCounters) {
          G = { ...G, relationshipCounters: {} };
        }
        G = { ...G, _migrated_relationships_v1: true };
      }

      // Phase 5: ライバル称号tierフィールドマイグレーション
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
      // v3.0: ケアストック制マイグレーション
      if (G.careStock === undefined) {
        G = { ...G,
          careStock: 5,
          careStockMax: 5,
          careStockLastRecovery: Engine.util.absWeek(G.season, G.week),
        };
      }

      // retiredIds永続化マイグレーション: hallOfFame+現retiredFightersのIDを収集
      if (!G._migrated_retiredIds_v1) {
        const ids = new Set(G.retiredIds || []);
        (G.hallOfFame || []).forEach(f => { if (f.id) ids.add(f.id); });
        (G.retiredFighters || []).forEach(f => { if (f.id) ids.add(f.id); });
        G = { ...G, retiredIds: [...ids], _migrated_retiredIds_v1: true };
      }

      // retiredSeasonsマイグレーション: 既存retiredIdsに引退シーズンを割り当て（即リサイクル対象に）
      if (!G._migrated_retiredSeasons_v1) {
        const rs = { ...(G.retiredSeasons || {}) };
        // 現在どのプールにもいないretiredIdsに対して、5シーズン以上前のシーズンを割り当て
        const pastSeason = Math.max(1, (G.season || 1) - 10);
        (G.retiredIds || []).forEach(id => {
          if (!rs[id]) rs[id] = pastSeason;
        });
        G = { ...G, retiredSeasons: rs, _migrated_retiredSeasons_v1: true };
      }

      if (!G._migrated_h2h_orgTimeline_v1) {
        if (!G.h2h) G = { ...G, h2h: {} };
        // 全ファイターにorgTimeline初期エントリを生成
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
        // careerRecord に juniorTournamentWins/juniorTournamentAppearances/ppvMainEventWins を補完
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
        // AI団体のrosterにも適用
        if (G.aiOrgs) {
          const migAi = {};
          Object.keys(G.aiOrgs).forEach(orgId => {
            const od = G.aiOrgs[orgId];
            migAi[orgId] = { ...od, roster: _addHofFields(od.roster) };
          });
          G = { ...G, aiOrgs: migAi };
        }
      }

      // v2.0 HOF拡張: allHallOfFame マイグレーション
      if (!G._migrated_allHallOfFame_v1) {
        const existingHof = G.hallOfFame || [];
        const playerHof = existingHof.map(h => ({
          ...h,
          orgId: 'player',
          orgName: h.orgName || G.orgName || 'あなたの団体',
          careerHighlights: h.careerHighlights || Engine.awards.buildCareerHighlights(h, h.orgName || G.orgName || 'あなたの団体'),
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

      // v2.0 HOF拡張v2: hofPoints/hofLevel 再計算マイグレーション
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

      // 修正D: battleWinsTotal 初期化マイグレーション
      if (!G.battleWinsTotal) {
        G = { ...G, battleWinsTotal: { player: 0, org_s: 0, org_a: 0, org_b: 0 } };
      }

      // v0.2: coachSlots マイグレーション（既存セーブは雇用済みコーチ数に合わせて枠を初期化）
      if (!G._migrated_coachSlots_v1) {
        const hiredCount = (G.coaches || []).length;
        G = { ...G, coachSlots: Math.max(1, hiredCount), _migrated_coachSlots_v1: true };
      }

      // Speed → Aerial スタイル名マイグレーション
      // 絶対週計算を52週基準→48週基準に統一
      // 旧値の正確な逆算は不可能なため、CD系フィールドをリセットして安全に移行
      if (!G._migrated_absweek48_v1) {
        // GameState直下のCDフィールド: リセット(CDが早く切れる方向=無害)
        const patchState = {};
        if (G.lastIntrusionWeek) patchState.lastIntrusionWeek = 0;
        if (G.lastLargeEventWeek) patchState.lastLargeEventWeek = 0;
        // _snapshotCooldowns: 全リセット(6週CDなので即回復)
        patchState._snapshotCooldowns = {};
        // lastTitleShowWeek: 旧式(season*48)のバグ値→0リセット
        // careStockLastRecovery: 元から48基準だが念のためリセット
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

      // _everFoughtPairs 復元: トリミングで失われた初顔合わせ判定用ペアをmatchupLogに補完
      if (G._everFoughtPairs && G._everFoughtPairs.length > 0) {
        const existing = new Set((G.matchupLog || []).map(e => {
          const a = Math.min(e.leftId, e.rightId), b = Math.max(e.leftId, e.rightId);
          return `${a}>${b}`;
        }));
        const restored = G._everFoughtPairs
          .filter(p => !existing.has(p))
          .map(p => {
            const [a, b] = p.split('>').map(Number);
            return { leftId: a, rightId: b, showCount: 0 }; // showCount=0: 鮮度窓外
          });
        if (restored.length > 0) {
          G = { ...G, matchupLog: [...restored, ...(G.matchupLog || [])] };
        }
        delete G._everFoughtPairs;
      }

      // stat非整数修正: 練習成長の浮動小数点蓄積を一括修正
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

      // 団体アイコン: playerOrgIcon 未定義時はデフォルト0
      if (G.playerOrgIcon == null) {
        G = { ...G, playerOrgIcon: 0 };
      }

      // 業界底上げ: 既にクリア済みの旧セーブにフラグ補正 + 新セレモニー再発火
      if (G.endingCleared && !G._migrated_leagueElevation_v2) {
        // leagueElevated済みでも新セレモニー未表示なら再発火させる
        G = { ...G, leagueElevated: true, _pendingLeagueElevation: true, endingShown: true, _migrated_leagueElevation_v2: true };
      }

      // dormantPool枯渇救済: 長期プレイでプールが空になったセーブを回復
      if (!G._migrated_dormantPool_refill_v1) {
        const pool = G.dormantPool || [];
        const eligibleCount = pool.filter(e => (e.age || 17) < 21).length;
        if (eligibleCount < 20) {
          const occupied = new Set();
          (G.roster || []).forEach(c => occupied.add(c.id));
          Object.values(G.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => occupied.add(c.id)));
          (G.freeAgents || []).forEach(c => occupied.add(c.id));
          pool.forEach(e => occupied.add(e.id));
          // retiredIds 5シーズン経過分をリサイクル対象に
          const retiredSeasons = G.retiredSeasons || {};
          const recycleable = new Set();
          (G.retiredIds || []).forEach(id => {
            const retSeason = retiredSeasons[id];
            if (retSeason !== undefined && G.season - retSeason >= 5) recycleable.add(id);
            else occupied.add(id);
          });
          const available = ALL_CHARS.filter(c => !occupied.has(c.id));
          if (available.length > 0) {
            const newEntries = available.map(c => ({ id: c.id, age: 17 }));
            const usedIds = new Set(newEntries.map(e => e.id));
            const cleanedRetiredIds = (G.retiredIds || []).filter(id => !usedIds.has(id));
            const cleanedRetiredSeasons = { ...retiredSeasons };
            usedIds.forEach(id => { delete cleanedRetiredSeasons[id]; });
            G = { ...G, dormantPool: [...pool, ...newEntries], retiredIds: cleanedRetiredIds, retiredSeasons: cleanedRetiredSeasons };
            console.log(`[WM Migration] dormantPool refill: ${newEntries.length}名を補充 (eligible was ${eligibleCount})`);
          }
        }
        G = { ...G, _migrated_dormantPool_refill_v1: true };
      }

      // FA即時補充: ロード直後にFAが少ないとスカウト画面がほぼ空のまま最大3週待ちになるため、
      // poolからFAへ即座に追加する（毎ロード時チェック、フラグなし）
      {
        const curFA = G.freeAgents || [];
        const FA_MIN = 3; // この人数未満なら補充
        if (curFA.length < FA_MIN) {
          const faPool = G.dormantPool || [];
          const faOccupied = new Set(curFA.map(c => c.id));
          (G.roster || []).forEach(c => faOccupied.add(c.id));
          Object.values(G.aiOrgs || {}).forEach(org => (org.roster || []).forEach(c => faOccupied.add(c.id)));
          const eligible = faPool.filter(e => (e.age || 17) < 21 && !faOccupied.has(e.id));
          const needed = FA_MIN - curFA.length; // 不足分だけ補充
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
              console.log(`[WM Load] FA即時補充: ${newFA.map(f => f.name).join('、')}`);
            }
          }
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
      // PPVフェーズの復帰: オーバーレイを再初期化
      if (G.weekPhase === 'ppvShow') App.initPPVShow();
      else if (G.weekPhase === 'ppvTV') App.initPPVTV();
      return true;
    }
    alert('セーブデータの読み込みに失敗しました。コンソールを確認してください。');
    return false;
  },

  autoSave() {
    if (window.IS_TRIAL) return; // 体験版: オートセーブ無効（手動1スロットのみ）
    if (G.weekPhase === 'gameover') return; // ゲームオーバー時は上書きしない
    try { localStorage.setItem(AUTOSAVE_KEY, Storage.serialize(G)); } catch(e) { console.warn('[WM] オートセーブ失敗:', e.message); }
  },

  loadAutoSave() {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (data && Storage.deserialize(data)) {
      if (G.weekPhase === 'showPrep') G = { ...G, weekPhase: 'manage' };
      refreshAll();
      // PPVフェーズの復帰: オーバーレイを再初期化
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
    if (!raw) { alert('セーブデータがありません'); return; }

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
            alert('有効なセーブデータではありません');
            return;
          }
        } catch {
          alert('ファイルの読み込みに失敗しました');
          return;
        }

        if (Storage.deserialize(raw)) {
          G = { ...G, gameLog: [...G.gameLog, '📂 ファイルからデータを読み込みました'] };
          if (G.weekPhase === 'showPrep') G = { ...G, weekPhase: 'manage' };
          refreshAll();
          if (G.weekPhase === 'ppvShow') App.initPPVShow();
          else if (G.weekPhase === 'ppvTV') App.initPPVTV();
          if (App._refreshTicker) App._refreshTicker();
          Audio.bgm.playForState();
          Audio.play('save');
        } else {
          alert('データの読み込みに失敗しました。ファイルが破損している可能性があります。');
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
  // 業界底上げセレモニー: ロード直後に未表示なら即表示
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
// ── App Commands (G mutation ONLY via G = newState) ──
let _pendingOrgName = '';
let _pendingOrgIcon = 0;
let _selectedDifficulty = 'normal';
const App = {
  // ═══ Title Screen (v1.0) ═══

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

    // Show CONTINUE button if autosave exists (体験版ではオートセーブ無効)
    const autoInfo = window.IS_TRIAL ? null : Storage.getAutoSaveInfo();
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
      alert('オートセーブの読み込みに失敗しました。');
      return;
    }
    sessionRng = Engine.rng.create(G.rngSeed);
    App._refreshTicker(); // v1.4w
    Audio.bgm.playForState();
    refreshAll();
  },

  // "LOAD GAME" button from title — open save/load screen
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

  // Confirm org setup → proceed to difficulty selection
  confirmOrgSetup() {
    const input = document.getElementById('orgSetupNameInput');
    _pendingOrgName = (input && input.value.trim()) || 'プレイヤー団体';
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
    if (radNormal) radNormal.textContent = mode === 'normal' ? '◉' : '○';
    if (radHard) radHard.textContent = mode === 'hard' ? '◉' : '○';
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
        alert('資金不足です。より安い候補を選んでください。');
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
      alert('資金不足です。より安い候補を選んでください。');
      return;
    }
    Audio.play('award');
    const rng = Engine.rng.create(G.rngSeed);
    G = Engine.draft.completeDraft(G, picks, rng);
    // NPC記録統一 Part C: 全選手の経歴自動生成（ドラフト完了後・ゲーム本編開始前）
    G = Engine.career.generateAllBackstories(G);
    // Phase 1: 人間関係データ基盤 — 全ペアの初期値生成
    G = Engine.relationships.initialize(G);
    // v1.3: Record debut event for drafted fighters（経歴生成後に上書き — プレイヤー団体デビューを正式記録）
    G = { ...G, roster: G.roster.map(c => picks.includes(c.id)
      ? Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'draft' })
      : c) };
    delete G._draftPicks;
    delete G._draftFocus;
    sessionRng = Engine.rng.create(G.rngSeed);

    // ── 完了演出: 5名横並び集合写真 ──
    const orgName = G.orgName || 'プレイヤー団体';
    // 並び順: 固定メンバー左 → 選択3名 → 固定メンバー右
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
        <span class="start">始動</span>
      </div>
    `;
    document.body.appendChild(overlay);

    // フェードイン
    requestAnimationFrame(() => { requestAnimationFrame(() => { overlay.classList.add('show'); }); });

    // クリームテーマをクリーンアップ
    const appEl = document.querySelector('.app');
    if (appEl) appEl.classList.remove('draft-cream');

    // クリックで本編へ
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
    // 最終重複チェック（最後の砦）：同一defIdがロスターに既に存在しないか確認
    if (G.roster.some(c => c.id === charId)) {
      Audio.play('error'); alert('この選手はすでに自団体に所属しています'); return;
    }
    // Gate: check orgPop requirement (pricing-balance-spec §2) — FA context with eliteTicket support
    if (!Engine.scout.canNegotiate(G.orgPop || 0, fighter, 'fa', G)) {
      Audio.play('error'); alert('団体の知名度が足りません！'); return;
    }
    const usedEliteTicket = Engine.scout.isEliteTicketRequired(G.orgPop || 0, fighter, G);
    const finalCost = Engine.scout.getSigningCost(fighter, G.orgPop || 0);
    if (G.funds < finalCost) { Audio.play('error'); alert('資金が足りません！'); return; }
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
    // Phase 3: orgJoinWeek設定
    c.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
    // v1.3: Record debut event
    c = Engine.career.addEvent(c, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'freeagent' });
    const tierCfg = Engine.scout.getTierConfig(c.assessedTier || 'material');
    const newFA = G.freeAgents.filter((_, i) => i !== idx);
    const newRoster = [...G.roster, c];
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    const scoutDisc = Engine.scout.getScoutDiscount(G.orgPop || 0);
    const log = [...G.gameLog, `📝 ${c.name}と契約（契約金: ${finalCost}万 [${tierCfg.label}]${scoutDisc > 0 ? ` / スカウト網割引${scoutDisc}%` : ''}）`];
    if (titleMsg) log.push(titleMsg);
    // v1.9: 逸材特別交渉枠の消費
    const eliteTicketUpdate = usedEliteTicket ? { eliteTicket: false, eliteTicketUsed: true } : {};
    if (usedEliteTicket) log.push('🎫 逸材特別交渉枠を使用しました');
    G = { ...G, funds: G.funds - finalCost, freeAgents: newFA, roster: newRoster, titles, gameLog: log, ...eliteTicketUpdate };
    Audio.play('stamp');
    const faSigningLine = getSigningLine(fighter, 'fa_signing');
    showEventPopup({ type:'fighter', id: fighter.id, name: fighter.name,
      tone:'positive', message: faSigningLine,
      detail:`📝 契約金: ${finalCost}万 [${tierCfg.label}]` });
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
    const newCoachAssign = Engine.coach.unassignFromCoach(G, charId);
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    const log = [...G.gameLog, `📤 ${target.name}を解雇`];
    if (titleMsg) log.push(titleMsg);
    if (Engine.util.canAddToFA(G)) {
      const releasedFighter = Engine.orgTimeline.transfer(target, 'fa', G.season, G.week);
      G = { ...G, roster: newRoster, freeAgents: [...G.freeAgents, releasedFighter], coachAssign: newCoachAssign, titles, gameLog: log };
    } else {
      G = { ...G, roster: newRoster, coachAssign: newCoachAssign, titles, gameLog: log };
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
      alert('資金が足りません！');
      return;
    }
    if (pending.source === 'fa' && !G.freeAgents.some(c => c.id === pending.fighterId)) {
      G = { ...G, pendingRosterOverflowSigning: null };
      refreshAll();
      Audio.play('error');
      alert('対象選手が市場に見つかりませんでした。');
      return;
    }
    if (pending.source === 'scout' && !(G.scoutCandidates || []).some(c => c.id === pending.fighterId) && !pending.fighter) {
      G = { ...G, pendingRosterOverflowSigning: null };
      refreshAll();
      Audio.play('error');
      alert('対象選手がスカウト候補に見つかりませんでした。');
      return;
    }
    if (pending.source === 'negotiation') {
      const orgData = pending.meta?.fromOrgId ? G.aiOrgs?.[pending.meta.fromOrgId] : null;
      const fighter = orgData?.roster?.find(f => f.id === pending.fighterId);
      if (!orgData || !fighter) {
        G = { ...G, pendingRosterOverflowSigning: null, negotiationResult: null };
        refreshAll();
        Audio.play('error');
        alert('交渉対象の選手が見つかりませんでした。');
        return;
      }
    }
    const released = App._releaseFighterForOverflow(releaseId);
    if (!released) return;
    let signedFighter = pending.fighter;
    let detail = `解雇: ${released.name}`;
    let message = '契約が成立しました';
    if (pending.source === 'fa') {
      const idx = G.freeAgents.findIndex(c => c.id === pending.fighterId);
      const fighter = G.freeAgents[idx];
      const usedEliteTicket = !!pending.meta?.usedEliteTicket;
      let normalized = App._normalizeFighterForRoster({ ...fighter, orgId: 'player' });
      normalized.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      normalized = Engine.career.addEvent(normalized, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'freeagent' });
      const tierCfg = Engine.scout.getTierConfig(normalized.assessedTier || 'material');
      const scoutDisc = Engine.scout.getScoutDiscount(G.orgPop || 0);
      const newFA = G.freeAgents.filter((_, i) => i !== idx);
      const newRoster = [...G.roster, normalized];
      const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
      const log = [...G.gameLog, `📝 ${normalized.name}と契約（契約金: ${pending.cost}万）[${tierCfg.label}]${scoutDisc > 0 ? ` / スカウト割引 ${scoutDisc}%` : ''}`];
      if (titleMsg) log.push(titleMsg);
      if (usedEliteTicket) log.push('🎫 逸材特別交渉枠を使用しました');
      G = { ...G, funds: G.funds - pending.cost, freeAgents: newFA, roster: newRoster, titles, gameLog: log, eliteTicket: usedEliteTicket ? false : G.eliteTicket, eliteTicketUsed: usedEliteTicket ? true : G.eliteTicketUsed };
      signedFighter = normalized;
      detail = `解雇: ${released.name} / 契約金: ${pending.cost}万`;
      message = getSigningLine(fighter, 'fa_signing');
    } else if (pending.source === 'scout') {
      const cand = (G.scoutCandidates || []).find(c => c.id === pending.fighterId) || pending.fighter;
      const tierCfg = Engine.scout.getTierConfig(cand.assessedTier || 'material');
      const signed = { ...cand };
      delete signed._notion; delete signed._estimate; delete signed._isSeed;
      delete signed._hasCompetition; delete signed._compMultiplier; delete signed._bidWinRate;
      let normalizedSigned = App._normalizeFighterForRoster(signed);
      normalizedSigned.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      normalizedSigned = Engine.orgTimeline.transfer(normalizedSigned, 'player', G.season, G.week);
      normalizedSigned = Engine.career.addEvent(normalizedSigned, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'scout' });
      const candidates = (G.scoutCandidates || []).filter(c => c.id !== pending.fighterId);
      const picks = [...(G.scoutPicks || [])];
      if (!picks.includes(pending.fighterId)) picks.push(pending.fighterId);
      const newRoster = [...G.roster, normalizedSigned];
      const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
      const log = [...G.gameLog, `📝 スカウト獲得 ${normalizedSigned.name} [${tierCfg.label}] 契約金${pending.cost}万`];
      if (titleMsg) log.push(titleMsg);
      G = { ...G, roster: newRoster, scoutCandidates: candidates, scoutPicks: picks, funds: G.funds - pending.cost, titles, gameLog: log };
      signedFighter = normalizedSigned;
      detail = `解雇: ${released.name} / 契約金: ${pending.cost}万`;
      message = getSigningLine(cand, pending.meta?.choice === 'direct' ? 'direct' : 'competition_won');
    } else if (pending.source === 'negotiation') {
      const fromOrgId = pending.meta?.fromOrgId;
      const fromOrgName = pending.meta?.fromOrgName || '他団体';
      const orgData = G.aiOrgs[fromOrgId];
      const fighter = orgData.roster.find(f => f.id === pending.fighterId);
      let resetFighter = Engine.popularity.applyTransferReset({ ...fighter, orgId: 'player', trust: 50, salaryBonus: 0 });
      resetFighter.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      resetFighter = Engine.orgTimeline.transfer(resetFighter, 'player', G.season, G.week);
      resetFighter = Engine.career.addEvent(resetFighter, { type: 'transfer', season: G.season, week: G.week, fromOrg: fromOrgName, toOrg: 'player', via: 'negotiate' });
      const newAiOrgs = { ...G.aiOrgs, [fromOrgId]: { ...orgData, roster: orgData.roster.filter(f => f.id !== pending.fighterId) } };
      G = { ...G, aiOrgs: newAiOrgs, roster: [...G.roster, resetFighter], funds: G.funds - pending.cost, transferLog: [...(G.transferLog || []), { season: G.season, week: G.week, type: 'negotiate', fighter: fighter.name, from: fromOrgName, cost: pending.cost }], gameLog: [...G.gameLog, `🎉 ${fighter.name}の引き抜き交渉成功！（-${pending.cost}万）`], negotiationResult: null };
      App._pushNewsEvent({ type: 'poachSuccess', characterId: resetFighter.id,
        data: { name: resetFighter.name, toOrg: G.orgName || '\u3042\u306a\u305f\u306e\u56e3\u4f53', fromOrg: fromOrgName, ovr: Engine.util.ov(resetFighter), cost: pending.cost } });
      signedFighter = resetFighter;
      detail = `解雇: ${released.name} / 移籍金: ${pending.cost}万`;
      message = `${resetFighter.name}との契約が成立した`;
    }
    G = { ...G, pendingRosterOverflowSigning: null };
    Storage.autoSave();
    refreshAll();
    Audio.play('stamp');
    showEventPopup({ type: 'fighter', id: signedFighter.id, name: signedFighter.name, tone: 'positive', message, detail });
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
    const baseCost = Engine.scout.getSigningCost(cand, G.orgPop || 0);
    if (G.funds < baseCost) { Audio.play('error'); alert('資金が足りません！'); return; }

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
      if (newFunds < result.cost) { Audio.play('error'); alert('資金が足りません！'); return; }
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
      // Phase 3: orgJoinWeek設定
      normalizedSigned.orgJoinWeek = Engine.util.absWeek(G.season, G.week);
      // orgTimeline: スカウト獲得で所属変更
      normalizedSigned = Engine.orgTimeline.transfer(normalizedSigned, 'player', G.season, G.week);
      normalizedSigned = Engine.career.addEvent(normalizedSigned, { type: 'debut', season: G.season, week: G.week, orgId: 'player', orgName: G.orgName || 'プレイヤー団体', via: 'scout' });
      newRoster.push(normalizedSigned);
      newFunds -= result.cost;
      picks.push(candidateId);
      candidates = candidates.filter(c => c.id !== candidateId);
      log.push(`🔍 スカウト獲得: ${cand.name} [${tierCfg.label}] 契約金${result.cost}万`);
      const signingContext = (choice === 'direct') ? 'direct'
        : (choice === 'pay' || choice === 'gamble') ? 'competition_won'
        : 'direct';
      const signingLine = getSigningLine(cand, signingContext);
      // ポップアップは showScreen 後に表示（showScreen が dismissAllPopups を呼ぶため）
      var _scoutSigningPopup = { type:'fighter', id: cand.id, name: cand.name,
        tone:'positive', message: signingLine,
        detail:`📝 契約金: ${result.cost}万 [${tierCfg.label}]` };
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
      // ポップアップは showScreen 後に表示（showScreen が dismissAllPopups を呼ぶため）
      var _scoutSigningPopup = { type:'scout', tone:'negative',
        message:`${cand.name}の獲得に失敗…`, detail:'他団体との競合に敗れました' };
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
    // O-02: FA/スカウトで入団 — 既存メンバー全員→新入選手 bond -3〜+3 + 再接触チェック
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
    // showScreen が dismissAllPopups を呼ぶ後にポップアップ表示
    if (typeof _scoutSigningPopup !== 'undefined' && _scoutSigningPopup) {
      showEventPopup(_scoutSigningPopup);
      if (_scoutSigningFanfare) Audio.play('fanfare');
    }
  },

  /** Finish scout event and continue game flow */
  scoutEventFinish() {
    Audio.play('click');
    const picksCount = (G.scoutPicks || []).length;
    const log = [...G.gameLog, `🔍 スカウト活動完了: ${picksCount}名獲得`];
    // Clean up any remaining candidates
    let freeAgents = [...G.freeAgents];
    let dormantPool = [...(G.dormantPool || [])];
    // 占有済みIDセット（最終重複チェック用）
    const occupiedIds = Engine.util.collectOccupiedCharacterDefIds(G);
    (G.scoutCandidates || []).forEach(c => {
      const clean = { ...c };
      delete clean._notion; delete clean._estimate; delete clean._isSeed;
      delete clean._hasCompetition; delete clean._compMultiplier; delete clean._bidWinRate;
      // 見送り候補は100% dormantPool返却（FA膨張防止）
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

  // ── 契約更新交渉フロー ───────────────────────────────────────────────────
  handleContractNegotiations() {
    const negotiations = G.pendingContractNegotiations || [];
    const autoCount = G._contractAutoRenewed || 0;
    if (negotiations.length === 0) {
      // 交渉不要 — transientクリアして次へ
      const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = G;
      G = clean;
      App.advanceWeek();
      return;
    }

    const season = G.season || 1;
    const results = [];
    let idx = 0;

    function processNext() {
      if (idx >= negotiations.length) {
        // 全交渉完了 → 結果サマリー
        showContractResultModal(results, () => {
          const { pendingContractNegotiations: _, _contractAutoRenewed: __, ...clean } = G;
          G = { ...clean, gameLog: [...(G.gameLog || []), `📋 契約更新完了: 残留${results.filter(r => r.type === 'stay').length}名 退団${results.filter(r => r.type === 'depart').length}名`] };
          App.advanceWeek();
        });
        return;
      }

      const neg = negotiations[idx];
      // v2.0 §6.3: 突発退団 — 選択肢なし、即退団
      if (neg.attitude === 'sudden_departure') {
        showContractSuddenDepartureModal(neg, G, () => {
          const resolveRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 2));
          const result = Engine.contract.resolveNegotiation(resolveRng, G, neg, 0);
          G = result.state;
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

    // サマリー画面 → 交渉開始
    showContractSummaryModal(negotiations, autoCount, season, () => processNext());
  },

  _resolveContractChoice(neg, choiceIdx, results, onDone) {
    const resolveRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 2));
    const result = Engine.contract.resolveNegotiation(resolveRng, G, neg, choiceIdx);
    G = result.state;

    if (result.result.type === 'listen') {
      // 理由を聞く → サブ選択
      showContractListenModal(neg, result.reactionDialogue, G, (subChoice) => {
        const subRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xC0E7, neg.fighterId, 3));
        const subResult = Engine.contract.resolveNegotiation(subRng, G, neg, 1, subChoice);
        G = subResult.state;
        results.push(subResult.result);
        if (subResult.result.type === 'stay') Audio.play('fanfare');
        else if (subResult.result.type === 'depart') Audio.play('defeat');
        showContractReactionModal(neg, subResult.reactionDialogue, onDone);
      });
      return;
    }

    results.push(result.result);

    // 結果に応じたSE
    if (result.result.type === 'stay') Audio.play('fanfare');
    else if (result.result.type === 'depart') Audio.play('defeat');

    // 移籍志願に発展した場合 → 移籍志願として再交渉
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

  // 引退勧告アクション
  doRetireAdvise(fighterId) {
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xAD71, fighterId));
    const result = Engine.retirement.advise(rng, G, fighterId);
    if (!result._pendingRetireAdviseResult) return;
    const { accepted, fighter, line } = result._pendingRetireAdviseResult;
    const { _pendingRetireAdviseResult: _, ...cleanG } = result;
    G = cleanG;
    Storage.autoSave();
    refreshAll();
    // 結果ポップアップ表示
    showRetireAdviseResultPopup(accepted, fighter, line);
  },

  // 引き留めアクション（引退ポップアップから呼ばれる）
  doRetainFighter(fighterId) {
    const retiredIdx = (G.retiredFighters || []).findIndex(c => c.id === fighterId);
    if (retiredIdx < 0) { closeRetirementPopup(); return; }
    const fighter = G.retiredFighters[retiredIdx];
    // 引き留め上限チェック
    if ((fighter.retainCount || 0) >= 2) { closeRetirementPopup(); return; }
    G = archiveRetiredRivalryState(G, fighter);
    const retainLine = Engine.retirement.selectRetainLine(fighter, G);
    const updatedFighter = {
      ...fighter,
      wear: (fighter.wear || 0) + 10,
      retainCount: (fighter.retainCount || 0) + 1,
      retainInjuryBonus: ((fighter.retainInjuryBonus || 0) + 0.05),
      lastRun: false,
      lastRunWeek: null,
    };
    const newRetired = [...G.retiredFighters];
    newRetired.splice(retiredIdx, 1);
    G = { ...G, roster: [...G.roster, updatedFighter], retiredFighters: newRetired };
    // O-13: 引退撤回 — 本人→団体全体 bond +5〜+8, 同僚全員→本人 bond +2〜+3
    if (G.relationships) {
      const retainRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE46, G.season, fighterId));
      const rosterIds = G.roster.filter(c => c.id !== fighterId).map(c => c.id);
      G = Engine.relationships.applyToRoster(G, fighterId, rosterIds, { min: 5, max: 8 }, { min: 0, max: 0 }, retainRelRng);
      G = Engine.relationships.applyFromRoster(G, rosterIds, fighterId, { min: 2, max: 3 }, { min: 0, max: 0 }, retainRelRng);
    }
    Storage.autoSave();
    refreshAll();
    closeRetirementPopup();
    // 引き留め成功セリフ表示
    showEventPopup({
      type: 'fighter', id: fighter.id, name: fighter.name, tone: 'positive',
      message: retainLine, detail: `${fighter.name}の引き留めに成功しました（引き留め ${updatedFighter.retainCount}/2回目）`,
    });
  },

  // Release a fighter
  releaseFighter(charId) {
    const idx = G.roster.findIndex(c => c.id === charId);
    if (idx < 0) return;
    Audio.play('spend');
    const c = G.roster[idx];
    const cName = c.name;
    const cId = c.id;
    // O-07: 解雇 — roster除外前に関係値更新
    if (G.relationships) {
      const releaseRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, 0xBE45, G.season, charId));
      const colleagueIds = G.roster.filter(f => f.id !== charId).map(f => f.id);
      // 解雇された側→団体全体: bond -10〜-15
      G = Engine.relationships.applyToRoster(G, charId, colleagueIds, { min: -15, max: -10 }, { min: 0, max: 0 }, releaseRelRng);
      // 残留者→解雇された側: 性格別 bond
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
    const newCoachAssign = Engine.coach.unassignFromCoach(G, charId);
    const { titles, msg: titleMsg } = Engine.title.validateChampion({ ...G, roster: newRoster });
    const log = [...G.gameLog, `📤 ${c.name}を解雇`];
    if (titleMsg) log.push(titleMsg);
    if (Engine.util.canAddToFA(G)) {
      const releasedFighter = Engine.orgTimeline.transfer(c, 'fa', G.season, G.week);
      G = { ...G, roster: newRoster, freeAgents: [...G.freeAgents, releasedFighter], coachAssign: newCoachAssign, titles, gameLog: log };
    } else {
      G = { ...G, roster: newRoster, coachAssign: newCoachAssign, titles, gameLog: log };
      G = Engine.util.redirectToDormantPool(G, c);
    }
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
    const maxCoaches = Engine.coach.getMaxCoaches(G);
    if (G.coaches.length >= maxCoaches) { Audio.play('error'); alert(`コーチは現在最大${maxCoaches}名まで（枠拡張で増加）`); return; }
    // A級雇用条件: 4枠目開放済み
    if (coach.grade === 'A' && (G.coachSlots || 1) < 4) { Audio.play('error'); alert('A級コーチの雇用には4枠目の開放が必要です'); return; }
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

  // Expand coach slot
  expandCoachSlot() {
    const result = Engine.coach.expandSlot(G);
    if (result.error === 'max_slots') { Audio.play('error'); alert('すでに全枠を開放しています'); return; }
    if (result.error === 'funds_insufficient') { Audio.play('error'); alert(`資金が足りません（必要: ${result.cost}万）`); return; }
    G = {
      ...G,
      coachSlots: result.coachSlots,
      funds: result.funds,
      gameLog: [...G.gameLog, `🎓 コーチ枠を${result.coachSlots}枠に拡張（投資: ${result.cost}万）`]
    };
    Audio.play('coin');
    refreshAll();
    const slotNum = result.coachSlots;
    const msgs = {
      2: '道場に新しいトレーニングスペースを増設した。',
      3: '専用のコーチルームを設置。複数のコーチが同時に指導できる環境が整った。',
      4: '最高級のトレーニング施設を完備。伝説級のコーチを招聘する準備が整った。'
    };
    showEventPopup({ type:'system', tone:'positive',
      message: msgs[slotNum] || 'コーチ枠を拡張しました。',
      detail: `🎓 コーチ枠が${slotNum}枠に拡張されました！（投資: ${result.cost}万）${slotNum >= 4 ? '\n⭐ A級コーチの雇用が解禁されました！' : ''}` });
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

  // Show preparation
  startShowPrep() {
    if (G.offSeason || G.weekPhase !== 'manage' || !isShowWeek(G.week)) { Audio.play('error'); return; }
    // PPV週は通常興行不可
    if (G.ppvPhase === 'locked' || G.ppvPhase === 'show') {
      Audio.play('error');
      showToast('今週はPPV GRAND FINALが開催されます。通常興行は行えません。');
      return;
    }
    Audio.play('crowd');
    G = {
      ...G,
      weekPhase: 'showPrep',
      showCard: [],  // renderShowPrep の pad/trim で会場に応じた枠数に自動調整
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
    // タイトルスロットにチャンピオンがいなくなった場合はisTitleをクリア
    // （スワップ等でチャンピオンが移動した後にゴーストisTitleが残るバグを防ぐ）
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

  // Clear show card
  clearShowCard() {
    G = { ...G, showCard: G.showCard.map(() => ({left: 0, right: 0, isTitle: false})) };
    renderShowPrep();
  },

  // Toggle title match
  toggleTitleMatch(slotIndex) {
    const newVal = !G.showCard[slotIndex].isTitle;
    // ONにするときは必ず他スロットのisTitleをクリア（チャンピオン在籍/空位どちらも）
    G = { ...G, showCard: G.showCard.map((slot, i) => {
      if (i === slotIndex) return { ...slot, isTitle: newVal };
      if (newVal) return { ...slot, isTitle: false };
      return slot;
    }) };
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
          champId: intrusion.champId,
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

    // rivalry50+ ペアの宣戦布告ポップアップを検出（好敵手/宿怨は対象外）
    const confrontations = [];
    validMatches.forEach((m, i) => {
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

    // 宣戦布告ポップアップは各試合がフォーカスされた瞬間に表示（renderMatchPreview内で制御）
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
    sp.results[idx] = Engine.battle.simulateMatch(charL, charR, matchRng, m.isTitle ? 2 : 1);
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
      left: { ...charL, portraitUrl: getPortraitUrl(charL.id), profile: CHAR_PROFILES[charL.id] || '', vl: charL.voiceLines || charL.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[charL.id]) || ['…！'] },
      right: { ...charR, portraitUrl: getPortraitUrl(charR.id), profile: CHAR_PROFILES[charR.id] || '', vl: charR.voiceLines || charR.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[charR.id]) || ['…！'] },
      matchInfo: {
        header: m.isTitle ? (G.titles.world.championId ? '🏆 TITLE MATCH' : '🏆 初代王者決定戦') : (idx === 0 ? 'メインイベント' : `第${sp.validMatches.length - idx}試合`),
        subHeader: `${charL.name} vs ${charR.name}`,
        matchNum: idx === 0 ? sp.validMatches.length : (sp.validMatches.length - idx),
        totalMatches: sp.validMatches.length,
        isTitle: !!m.isTitle,
        isSpecialMatch: !!m.isTitle,
        matchTier: m.isTitle ? 2 : 1,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, charL.id, charR.id); return rl ? rl.tier : 0; })(),
        leftPersonality: charL.personality || 'normal',
        leftArchetype: charL.archetype || 'normal',
        rightPersonality: charR.personality || 'normal',
        rightArchetype: charR.archetype || 'normal',
        sfxMasterVol: Audio.sfxMasterVol,
        bgmMasterVol: Audio.bgmMasterVol,
        rngSeed: Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right),
      }
    };
    // BGM切替: タイトル戦はFileBGM、通常試合はチップチューンbattle
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
    // BGM: FileBGMフェードアウト + 残試合ありならbattle復帰、全完了ならmanagement
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    if (sp.results.every(r => r !== null)) {
      try { Audio.bgm.play('management'); } catch(e) {}
    } else {
      // まだ試合が残っている → battleBGMを再開（興行中）
      // fadeOut後にBGM._current='battle'が残るため、stop()でリセットしてから再生
      setTimeout(() => { if (App._showPreview) { try { Audio.bgm.stop(); Audio.bgm.play('battle'); } catch(e) {} } }, 1600);
    }
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
    // BGM停止 + 復帰
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
      // PPV BGM復帰
      if (!ppvPrev.results.every(r => r !== null)) {
        setTimeout(() => { if (App._ppvPreview) { try { Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 }); } catch(e) {} } }, 300);
      }
    } else if (sp && sp.currentWatching >= 0) {
      const idx = sp.currentWatching;
      sp.currentWatching = -1;
      if (!sp.results[idx]) App.skipMatch(idx);
      else { renderMatchPreview(); if (sp.results.every(r => r !== null)) App.finalizeShow(); }
      // 興行BGM復帰（興行中はbattle）— stop()でBGM状態リセット後に再生
      if (!sp.results.every(r => r !== null)) {
        setTimeout(() => { if (App._showPreview) { try { Audio.bgm.stop(); Audio.bgm.play('battle'); } catch(e) {} } }, 300);
      }
    } else if (wp && wp.currentWatching >= 0) {
      const idx = wp.currentWatching;
      wp.currentWatching = -1;
      if (!wp.results[idx]) App._skipWarMatch(idx);
      // 対抗戦BGM復帰
      if (!wp.results.every(r => r !== null)) {
        setTimeout(() => { if (App._warPreview) { try { Audio.fileBgm.play('../bgm/MusMus-BGM-125.mp3', { loop: true, volume: 0.10 }); } catch(e) {} } }, 300);
      }
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
    let hasMissing = false;
    sp.validMatches.forEach((m, idx) => {
      if (sp.results[idx]) return;
      const charL = G.roster.find(c => c.id === m.left);
      const charR = G.roster.find(c => c.id === m.right);
      if (!charL || !charR) { hasMissing = true; return; }
      const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, m.left, m.right));
      sp.results[idx] = Engine.battle.simulateMatch(charL, charR, matchRng, m.isTitle ? 2 : 1);
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
    // forcedRest（S3休養願い）フラグをクリア — この興行後は通常参加可能に戻す
    let roster = s.roster.map(c => c.forcedRest ? { ...c, forcedRest: false } : { ...c });
    let rivalries = { ...s.rivalries };
    let titles = { ...s.titles, world: { ...s.titles.world } };
    const events = [];
    // Phase 4: 興行前の連敗数を記録（C-05/C-06判定用）
    const preShowLosingStreaks = new Map(roster.map(c => [c.id, c.losingStreak || 0]));

    // Rivalry & coach bonuses
    const confrontationPairs = sp.confrontationPairs || [];
    const deferredRivalryIdxs = []; // 因縁決着候補ペアの recordRivalry を MQ確定後まで保留
    results.forEach((result, i) => {
      const m = validMatches[i];
      const pairState = Engine.title.getRivalryPairState({ ...s, rivalries }, m.left, m.right);
      const rivalLvl = Engine.title.getRivalryLevel({ ...s, rivalries }, m.left, m.right);
      if (rivalLvl) { result.mq = Math.min(100, result.mq + rivalLvl.mqBonus); result.rivalryBonus = rivalLvl; }
      const chemistryBonus = Engine.title.getMatchChemistryBonus(pairState);
      if (chemistryBonus > 0) { result.mq = Math.min(100, result.mq + chemistryBonus); result.friendshipBonus = chemistryBonus; }
      if (m.isTitle) { result.mq = Math.min(100, result.mq + (TITLES.find(t => t.id === 'world')?.mqBonus || 15)); result.isTitleMatch = true; }
      // 因縁決着候補（minRivalry>=60 or resolutionCount>=1）は recordRivalry をMQ確定後まで保留
      const isResolutionCandidate = pairState && !pairState.resolvedType && pairState.minRivalry >= 60;
      const hasPartialResolution = pairState && !pairState.resolvedType && (rivalries[Engine.title.getRivalryKey(m.left, m.right)]?.resolutionCount || 0) >= 1 && pairState.minRivalry >= 80;
      if (isResolutionCandidate || hasPartialResolution) {
        deferredRivalryIdxs.push(i);
      } else {
        const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right, result.mq);
        rivalries = rivalResult.rivalries;
        if (rivalResult.msg) events.push(rivalResult.msg);
      }
      // coachMQBonus — MQ外部ボーナス整理で廃止
    });

    // Fan expectation MQ bonus — MQ外部ボーナス整理で廃止。フラグのみ残す
    const fanExpects = Engine.fanExpect.generate(s);
    validMatches.forEach((m, i) => {
      const result = results[i]; if (!result) return;
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
      const r = results[i];
      const champId = titles.world.championId;
      const challengerId = champId === m.left ? m.right : m.left;
      const tempState = { ...s, titles, roster };
      if (r.winner === 'draw') {
        if (champId) { const def = Engine.title.recordDefense(tempState); titles = def.titles; roster = def.roster; events.push(def.msg); }
        titleMatchOutcomes.push({ outcome: 'defense', champId, challengerId });
      } else {
        const winnerId = r.winner === 'left' ? m.left : m.right;
        if (!champId || winnerId !== champId) {
          const crown = Engine.title.crownChampion(tempState, winnerId); titles = crown.titles; roster = crown.roster; events.push(crown.msg);
          titleMatchOutcomes.push({ outcome: 'change', newChampId: winnerId, prevChampId: champId, challengerId });
        } else {
          const def = Engine.title.recordDefense(tempState); titles = def.titles; roster = def.roster; events.push(def.msg);
          titleMatchOutcomes.push({ outcome: 'defense', champId, challengerId });
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
        // Phase0修正: ヒートペナルティ振れ幅拡大 -7〜-20（旧: -15〜-20）
        const intRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 8889));
        const penalty = -(7 + Engine.rng.int(intRng, 0, 13));
        titles = { ...titles, world: { ...titles.world, championId: null, defenses: 0 } };
        s = { ...s, heatScore: Math.max(0, (s.heatScore || 50) + penalty) };
        const bpIntrusion = { ...(s.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
        bpIntrusion.player = (bpIntrusion.player || 0) - BATTLE_POINT_CFG.intrusion;
        s = { ...s, battlePoints: bpIntrusion };
        events.push(`😱 ${id.fromOrgName}の${id.intruder.name}に王座を奪われた！ 王座は空位に… ヒート${penalty}、対戦pt-${BATTLE_POINT_CFG.intrusion}`);
      } else {
        // チャンピオン勝利 → 団体人気+2
        s = { ...s, orgPop: Math.min(100, (s.orgPop || 0) + 2) };
        const bpIntrusion = { ...(s.battlePoints || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
        bpIntrusion.player = (bpIntrusion.player || 0) + BATTLE_POINT_CFG.intrusion;
        s = { ...s, battlePoints: bpIntrusion };
        events.push(`👑 ${id.champName}が乱入者${id.intruder.name}を退けた！ 団体人気+2、対戦pt+${BATTLE_POINT_CFG.intrusion}`);
      }
      // §4.2: 乱入 rivalry +12〜+18（チャンピオン↔乱入者）
      if (s.relationships) {
        const intRivalRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6F));
        const intruderId = id.intruder.id;
        const champId = id.champId || (intruderWon ? null : titles.world?.championId);
        if (champId && champId !== intruderId) {
          s = Engine.relationships.applyToRoster({ ...s, roster }, intruderId, [champId], { min: 0, max: 0 }, { min: 12, max: 18 }, intRivalRng);
          s = Engine.relationships.applyToRoster({ ...s, roster }, champId, [intruderId], { min: 0, max: 0 }, { min: 12, max: 18 }, intRivalRng);
        }
      }
      // 乱入選手をrosterから除去
      roster = roster.filter(c => !c.isIntrusion);
      // Phase0修正: lastIntrusionWeek更新（クールダウン計算用）
      const intAbsWeek = Engine.util.absWeek(s.season, s.week);
      s = { ...s, lastIntrusionWeek: intAbsWeek };
    }

    // 集客v2: matchAppeals→showDraw→attendance算出
    const appFanExpects = Engine.fanExpect.generate(s);
    const appMatchAppeals = validMatches.map(m => {
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
      return Engine.attendanceV2.calcMatchAppeal(fA, fB, {
        rivalry: Math.max(rivalryAB, rivalryBA), isTitle: !!m.isTitle, isFanExpect,
        pendingClashBonus: appPendingClash, isFirstMeet: appFr.isFirstMeet, freshnessCount: appFr.countInWindow,
      }, s);
    });
    const appNonMatchPromo = roster.filter(c => !validMatches.some(m => m.left === c.id || m.right === c.id)).reduce((sum, c) => sum + (c.promoStack || 0), 0);
    const appShowDraw = Engine.attendanceV2.calcShowDraw(appMatchAppeals, appNonMatchPromo, s.showVenue);
    const attendRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xA77E));
    const appV2Result = Engine.attendanceV2.calcAttendanceV2(s, s.showVenue, appShowDraw, attendRng);
    let preAttendance = appV2Result.attendance;
    // v1.5s25b: attendance_boost バフ（マイルストーン）
    const attendBoostBuffPre = (s.milestoneBuffs || []).find(b => b.type === 'attendance_boost');
    if (attendBoostBuffPre) preAttendance = Math.min(VENUES[s.showVenue].cap, Math.round(preAttendance * attendBoostBuffPre.multiplier));
    const preOccRate = preAttendance / VENUES[s.showVenue].cap;
    // 興行結果画面で動員数を表示するためにstateに保存
    s = { ...s, lastShowAttendance: preAttendance };
    const crowdMQ = Engine.economy.calcCrowdMQBonus(s.showVenue, preOccRate);
    if (crowdMQ.total !== 0) {
      results.forEach(r => { r.mq = Engine.util.clamp(r.mq + crowdMQ.total, 5, 100); });
      if (crowdMQ.crowdLabel) {
        events.push(`🏟️ ${crowdMQ.crowdLabel}（MQ全試合 ${crowdMQ.total >= 0 ? '+' : ''}${crowdMQ.total}）`);
      }
    }

    // カード鮮度MQ補正（matchupLog記録の前に計算 — 今回の試合は履歴に含めない）
    results.forEach((r, i) => {
      const m = validMatches[i];
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

    // 因縁決着判定（MQ確定後、保留ペアのみ）
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
        const emoji = resolution.emoji || '⚡';
        const label = resolution.label || (isFinalResolution ? '最終決着' : '因縁決着');
        events.push(`${emoji} ${winnerName} vs ${loserName} — ${label}！ 両者人気+${resolution.popBonus} 団体人気+${Math.round(rivalOrgPopDelta * 10) / 10}`);
      } else {
        // 決着不成立: 通常通り recordRivalry
        const rivalResult = Engine.title.recordRivalry({ ...s, rivalries, roster }, m.left, m.right, r.mq);
        rivalries = rivalResult.rivalries;
        if (rivalResult.msg) events.push(rivalResult.msg);
      }
    });
    App._pendingRivalryResolutions = rivalryResolutions;

    // MQ popularity
    const mainEventIdx = 0; // index 0 = main event in showCard order
    results.forEach((r, idx) => {
      const isMainEvent = idx === mainEventIdx;
      const mqPop = Engine.applyMQPopularity(roster, r, isMainEvent, s.orgPop || 0, s);
      roster = mqPop.roster;
    });
    // 集客v2: ★算出
    const avgMQ = Math.round(results.reduce((a, r) => a + r.mq, 0) / results.length);
    const appRatingCtx = {
      hasTitleMatch: validMatches.some(m => m.isTitle),
      titleGreatMQ: validMatches.some(m => m.isTitle) ? results.find((r, i) => validMatches[i]?.isTitle)?.mq || 0 : 0,
      rivalryResolved: results.some(r => r.rivalryResolved),
      rivalryCards: validMatches.filter(m => {
        if (!s.relationships) return false;
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
    const bookedRivalryOrgPopBonus = Engine.title.getBookedRivalryOrgPopBonus(s, validMatches.map(m => ({ leftId: m.left, rightId: m.right })));
    if (bookedRivalryOrgPopBonus !== 0) {
      popResult = {
        ...popResult,
        popDelta: Math.round((popResult.popDelta + bookedRivalryOrgPopBonus) * 10) / 10,
        orgPop: Engine.util.clamp((popResult.orgPop || 0) + bookedRivalryOrgPopBonus, 0, 100),
      };
      events.push(`🔥 注目カード効果: 因縁カード編成で団体人気${bookedRivalryOrgPopBonus >= 0 ? '+' : ''}${Math.round(bookedRivalryOrgPopBonus * 10) / 10}`);
    }
    events.push(`📊 ★${appStars} (MQ avg ${avgMQ}) → 団体人気${popResult.popDelta >= 0 ? '+' : ''}${Math.round(popResult.popDelta * 100) / 100} (現在: ${Engine.util.dispOrgPop(popResult.orgPop)})`);

    // Heat — ★ベース
    const oldHeat = Engine.heat.getLevel(s);
    const newHeatScore = Engine.heat.calcUpdate(s, appStars);
    const newHeat = Engine.heat.getLevel({ ...s, heatScore: newHeatScore });
    if (oldHeat.id !== newHeat.id) events.push(`${newHeat.emoji} Heat変動: ${oldHeat.label} → ${newHeat.label}（集客倍率 ×${newHeat.mult}）`);

    // Injuries — separate RNG per fighter to avoid correlation
    const injuryResults = [];
    const matchInjuredIds = new Array(results.length).fill(null); // Phase 2: 試合別怪我選手ID
    results.forEach((r, idx) => {
      const lc = roster.find(c => c.id === r.left.id);
      if (lc && !lc.isIntrusion) { // 乱入選手は怪我判定スキップ
        const injRngL = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.left.id));
        const li = Engine.injury.check(injRngL, lc, r, Engine.coach.getInjuryMult(s, r.left.id), 0, 0, Engine.coach.getInjurySeverityDowngrade(s, r.left.id), Engine.coach.buildInjuryFlavorOpts(s, r.left.id));
        if (li) { if (!matchInjuredIds[idx]) matchInjuredIds[idx] = lc.id; roster = roster.map(c => c.id === lc.id ? li.newFighter : c); injuryResults.push({ name: lc.name, injury: li.newFighter.injury }); }
      }
      const rc = roster.find(c => c.id === r.right.id);
      if (rc && !rc.isIntrusion) { // 乱入選手は怪我判定スキップ
        const injRngR = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 999, idx, r.right.id));
        const ri = Engine.injury.check(injRngR, rc, r, Engine.coach.getInjuryMult(s, r.right.id), 0, 0, Engine.coach.getInjurySeverityDowngrade(s, r.right.id), Engine.coach.buildInjuryFlavorOpts(s, r.right.id));
        if (ri) { if (!matchInjuredIds[idx]) matchInjuredIds[idx] = rc.id; roster = roster.map(c => c.id === rc.id ? ri.newFighter : c); injuryResults.push({ name: rc.name, injury: ri.newFighter.injury }); }
      }
    });

    // Phase 2: 試合結果の関係値反映（spec §3.1）
    // losingStreakはMQ popularity更新済み、injuredIdは怪我処理済み、careerBestMQは未更新（後で更新）
    if (s.relationships) {
      const relRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE2A));
      let relState = { ...s, roster, relationshipCounters: s.relationshipCounters };
      results.forEach((r, idx) => {
        const charIdA = r.left.id;
        const charIdB = r.right.id;
        const fA = roster.find(c => c.id === charIdA);
        const fB = roster.find(c => c.id === charIdB);

        let stage = 'normal';
        if (r.isTitleMatch) stage = 'title';

        // v2.0: タイトルマッチの王者情報
        const m = validMatches[idx];
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
        };
        relState = Engine.relationships.applyMatchResult(relState, charIdA, charIdB, context, relRng);
      });
      roster = relState.roster || roster;
      s = { ...s, relationships: relState.relationships, relationshipCounters: relState.relationshipCounters };
      // Phase 4: 興行コンテキストの関係値反映（C-04/C-05/C-06/C-10）
      const showCtxRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE5C));
      s = Engine.relationships.applyShowContextEffects(s, validMatches, results, preShowLosingStreaks, showCtxRng);
    }

    // v1.2: タイトルマッチ実施時に絶対週数を記録
    const executedTitleMatch = validMatches.some(m => m.isTitle);
    const lastTitleMatchWeek = executedTitleMatch
      ? Engine.title.getAbsWeek(s)
      : (s.lastTitleMatchWeek ?? null);

    // v1.3-2: §2 試合成長 — 怪我処理後、ロスターに残っている出場選手に成長を与える (mirrors Engine.executeShow)
    const matchGrowthRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 1732));
    results.forEach(r => {
      [
        { charId: r.left.id, won: r.winner === 'left' },
        { charId: r.right.id, won: r.winner === 'right' },
      ].forEach(({ charId, won }) => {
        const fighter = roster.find(c => c.id === charId);
        if (!fighter || fighter.isIntrusion) return;
        const oppId = charId === r.left.id ? r.right.id : r.left.id;
        const oppInRoster = roster.find(c => c.id === oppId);
        const oppRaw = charId === r.left.id ? r.right : r.left;
        const oppOvr = oppInRoster ? Engine.util.ov(oppInRoster) : Engine.util.ov(oppRaw);
        const selfOvr = Engine.util.ov(fighter);

        // growth-rebalance v2: 試合成長を適正化
        const matchGrowthBase = GROWTH_CONFIG.matchGrowthBase;
        const opponentBonus = Engine.util.clamp((oppOvr - selfOvr) / 15, -0.2, 0.5);
        const closeMatchBonus = r.mq >= 65 ? 0.3 : 0.0;
        const resultBonus = won ? 0.0 : 0.2;
        const coachMatchBonus = Engine.coach.getMatchGrowthBonus(s, charId);
        let matchGrowth = matchGrowthBase + opponentBonus + closeMatchBonus + resultBonus + coachMatchBonus;

        if (fighter.growthPenalty) {
          const rawMult = fighter.growthPenalty.multiplier;
          matchGrowth *= (rawMult < 1.0 && Traits.has(fighter, '適応力')) ? Math.min(1.0, rawMult + 0.2) : rawMult;
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

        const _mOpp = charId === r.left.id ? (r.right.name || '?') : (r.left.name || '?');
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

        // ブレークスルー判定（careerBestMQ更新前に実施 — mq > prevBest 判定のため）
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
          // Phase 4 G-01: ブレークスルー → OVR近接キャラからrivalry上昇
          if (s.relationships) {
            const btRelRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE57, charId));
            s = Engine.relationships.applyBreakthroughEffect(s, charId, btRelRng);
          }
        }

        // careerBestMQ 更新（ブレークスルー判定後に実施）
        const btUpdatedFighter = roster.find(c => c.id === charId);
        if (r.mq > (btUpdatedFighter.careerBestMQ || 0)) {
          roster = roster.map(c => c.id === charId
            ? { ...c, careerBestMQ: r.mq, _trustBonus: (c._trustBonus || 0) + 1.2,
                _trustBonusSources: [...(c._trustBonusSources || []), 'careerBestMQ'] }
            : c);
        }

        // §4.2 敗北スランプ判定
        if (!won) {
          const slumpRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0x5C6, charId));
          const slumpFighter = roster.find(c => c.id === charId);
          if (Engine.growthEvents.checkSlump(slumpRng, slumpFighter, 'defeat')) {
            const newF = Engine.growthEvents.applySlump(slumpFighter, 'defeat', s.season, s.week);
            roster = roster.map(c => c.id === charId ? newF : c);
            pendingGrowthEvents.push({ type: 'slump_start', fighterId: charId, trigger: 'defeat' });
            // Phase 4 G-03: スランプ → bond60+心配、rivalry30+低下
            if (s.relationships) {
              const symRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE58, charId));
              s = Engine.relationships.applySympathyEffect(s, charId, { min: 1, max: 2 }, symRng);
              // N-05: スランプ八つ当たり
              const lashRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6C, charId));
              s = Engine.relationships.applySlumpLashout({ ...s, roster }, charId, lashRng);
            }
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
            // Phase 4 G-06: モチベ喪失 → bond60+心配、rivalry30+低下
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

    // h2h記録: ペア別対戦履歴
    let h2h = { ...(s.h2h || {}) };
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      h2h = Engine.h2h.update(h2h, m.left, m.right, r.winner, r.mq, !!r.isTitleMatch, false, s.season, s.week);
    });
    s = { ...s, h2h };

    // recentMatches記録（直近5戦FIFO）
    results.forEach((r, idx) => {
      const m = validMatches[idx];
      roster = Engine.pushRecentMatch(roster, m.left, m.right, r.winner, s.season, s.week);
    });

    // matchupLog 記録（鮮度計算の後、最終更新の前）
    const newMatchupEntries = validMatches.map(m => ({
      leftId: m.left, rightId: m.right, showCount: s.totalShows,
    }));
    s = { ...s, roster, matchupLog: [...(s.matchupLog || []), ...newMatchupEntries] };
    if (pendingGrowthEvents.length > 0) {
      G = { ...G, _pendingGrowthEvents: pendingGrowthEvents };
    }

    G = { ...G, ...s, seasonStats: stats, gameLog: [...G.gameLog, ...events] };

    // v2.0 Phase1-6: メディアスポットライトの興行後処理
    if (G.mediaSpotlight) {
      const _spotlightName = G.mediaSpotlight.fighterName || '選手';
      const spotRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB4B4));
      const spotResult = Engine.eventSystem.processMediaSpotlight(G, results, validMatches, spotRng);
      if (spotResult) {
        G = { ...G, mediaSpotlight: spotResult.mediaSpotlight, roster: spotResult.roster,
               gameLog: [...G.gameLog, ...spotResult.events] };
        if (spotResult.orgPopDelta) {
          G = { ...G, orgPop: G.orgPop + spotResult.orgPopDelta };
        }
        // Phase 4 E-04: メディアスポットライト終了時の関係値反映
        if (spotResult.relationships) {
          G = { ...G, relationships: spotResult.relationships };
        }
        // P6: メディアスポットライト終了トースト
        if (spotResult.mediaSpotlight === null) {
          setTimeout(() => showToast(`📺 ${_spotlightName}のメディア密着取材が終了した`, 5000), 500);
        }
      }
    }

    // ラストラン試合を行った選手を即座に引退処理（4週待ちバグ修正）
    const lastRunRetirees = [];
    results.forEach(r => {
      if (r.isLastRunMatch && r.lastRunFighterId) {
        const fighter = G.roster.find(c => c.id === r.lastRunFighterId);
        if (fighter) lastRunRetirees.push(fighter);
      }
    });
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
      // 関係値凍結 + trust影響 + retiredIds永続記録
      const newRetiredIds = [...(G.retiredIds || []), ...lastRunRetirees.map(c => c.id).filter(id => !(G.retiredIds || []).includes(id))];
      const _lrRetiredSeasons = { ...(G.retiredSeasons || {}) };
      lastRunRetirees.forEach(c => { _lrRetiredSeasons[c.id] = G.season; });
      let updState = { ...G, roster: survivingRoster, retiredFighters: [...(G.retiredFighters || []), ...retiredWithRecords], retiredIds: newRetiredIds, retiredSeasons: _lrRetiredSeasons };
      // 王者がラストラン引退した場合は王座を空位にする
      const vcLR = Engine.title.validateChampion(updState);
      if (vcLR.msg) { updState = { ...updState, titles: vcLR.titles, gameLog: [...(updState.gameLog || []), vcLR.msg] }; }
      if (updState.relationships) {
        lastRunRetirees.forEach(retiree => {
          updState = Engine.relationships.freezeRelationships(updState, retiree.id);
          updState = { ...updState, roster: Engine.trust.applyDepartureTrustImpact(updState.roster, retiree.id, updState.relationships, { name: retiree.name, reason: '引退試合' }) };
        });
      }
      // O-04: bond 60+の相手→引退者に bond -5〜-10
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
      // 引退演出データを保持（pendingRetirements形式）
      const pendingLastRunRetirements = retiredWithRecords.map(f => {
        const { line, category } = Engine.retirement.selectLine(f, 'lastrun', updState, lrLineRng);
        const summary = Engine.retirement.buildCareerSummary(f);
        return { fighter: f, route: 'lastrun', line, category, summary, canRetain: false };
      });
      G = { ...updState, _pendingLastRunRetirements: pendingLastRunRetirements };
    }

    App._showPreview = null;
    App._lastInjuries = injuryResults; // v0.96: store for popup after close
    App._lastTitleOutcomes = titleMatchOutcomes; // タイトルマッチ後リアクション用
    // BGM: Play jingle based on title outcome
    const hadTitleChange = validMatches.some((m, i) => m.isTitle && results[i] && results[i].winner !== 'draw');
    Audio.bgm.playJingle(hadTitleChange ? 'championship' : 'victory');

    // 新聞データをGに保存（データベースタブで閲覧）
    try {
      const paperData = App._buildShowResultNewspaperData();
      if (paperData) {
        G = { ...G, currentNewspaper: { ...paperData, generatedWeek: G.week, generatedSeason: G.season } };
      }
    } catch (e) {
      console.error('[WM] 新聞データ生成エラー:', e);
    }

    renderShowResult(results, injuryResults);
  },

  // ─── 新聞記事テキスト生成 ───────────────────────────────────────────────
  _NEWSPAPER_HEADLINES: {
    // タイトル戦勝利
    titleWin: [
      d => `${d.winner.name}、${d.finishLabel}で戴冠！`,
      d => `王座奪取！ ${d.winner.name}が${d.loser.name}を下す`,
      d => `新王者${d.winner.name}誕生——${d.venue.name}が揺れた`,
    ],
    titleDefend: [
      d => `王者${d.winner.name}、${d.loser.name}の挑戦を退ける`,
      d => `${d.winner.name}防衛成功！ 王座の威厳を示す`,
    ],
    // 因縁試合
    rivalry: [
      d => `宿命の対決——${d.winner.name}が${d.rivalLabel}を制す`,
      d => `${d.left.name}vs${d.right.name}、因縁に決着か`,
      d => `${d.rivalLabel}の行方——${d.winner.name}に軍配`,
    ],
    // 圧勝
    dominant: [
      d => `${d.winner.name}、圧巻の${d.turns}ターン決着！`,
      d => `電撃決着！ ${d.winner.name}が${d.loser.name}を一蹴`,
      d => `${d.loser.name}なすすべなし——${d.winner.name}の完勝`,
    ],
    // 僅差の好勝負
    closeMQ: [
      d => `死闘${d.turns}ターン——${d.winner.name}が辛くも勝利`,
      d => `${d.winner.name}と${d.loser.name}、名勝負の果てに`,
      d => `激闘の末に${d.winner.name}！ MQ ${d.mq}の熱戦`,
    ],
    // 番狂わせ
    upset: [
      d => `大番狂わせ！ ${d.winner.name}が格上${d.loser.name}を撃破`,
      d => `ジャイアントキリング——${d.winner.name}の衝撃勝利`,
      d => `誰が予想した？ ${d.winner.name}が${d.loser.name}を沈める`,
    ],
    // 高MQ
    superMQ: [
      d => `歴史的名勝負！ MQ ${d.mq}を記録`,
      d => `語り継がれる一戦——${d.winner.name}vs${d.loser.name}`,
    ],
    // ドロー
    draw: [
      d => `${d.left.name}と${d.right.name}、決着つかず`,
      d => `譲らぬ二人——メインはドローに終わる`,
      d => `痛み分け。${d.left.name}も${d.right.name}も一歩も退かず`,
    ],
    // 通常
    normal: [
      d => `${d.winner.name}がメインイベントを制す`,
      d => `${d.winner.name}、${d.finishLabel}で勝利`,
      d => `${d.venue.name}のメイン、${d.winner.name}に軍配`,
    ],
  },

  _NEWSPAPER_ARTICLES: {
    // タイトル戦
    titleWin: [
      d => `${d.venue.name}に詰めかけた${d.attendance.toLocaleString()}人の観衆が見届けたのは、新たな王者の誕生だった。${d.winner.name}は序盤から積極的に攻め込み、${d.finishLabel}で${d.loser.name}から3カウントを奪取。試合後、ベルトを手にした${d.winner.name}の表情には、長い道のりを歩んできた者だけが見せる充足感が浮かんでいた。`,
      d => `${d.loser.name}の牙城がついに崩れた。${d.turns}ターンに及ぶ攻防の末、${d.winner.name}が${d.finishLabel}で王座を奪取。${d.venue.name}のリングに立つ新王者に、${d.attendance.toLocaleString()}人のファンが惜しみない拍手を送った。`,
    ],
    titleDefend: [
      d => `${d.loser.name}の挑戦を受けた王者${d.winner.name}は、${d.turns}ターンの攻防を経て${d.finishLabel}で防衛に成功。${d.attendance.toLocaleString()}人の前で王座の重みを証明した。敗れた${d.loser.name}もリング上で健闘を称えられ、次なる挑戦への期待が膨らむ。`,
    ],
    // 因縁試合
    rivalry: [
      d => `もはや説明不要のカード。${d.left.name}と${d.right.name}による${d.rivalLabel}は今回も期待を裏切らなかった。${d.turns}ターン、互いの手の内を知り尽くした二人の攻防はMQ ${d.mq}を記録。最後は${d.winner.name}の${d.finishLabel}が決着を呼んだ。この因縁に終わりはあるのか——その答えは、まだ誰にも分からない。`,
      d => `${d.rivalLabel}として知られる二人が再びリングで激突。${d.venue.name}の空気は試合前から張り詰めていた。${d.winner.name}が${d.finishLabel}で勝利を収めたが、敗れた${d.loser.name}の闘志は折れていない。次の対戦が、すでに待ち遠しい。`,
    ],
    // 好敵手
    goodRival: [
      d => `互いを高め合う二人の戦いは、今回もファンの心を掴んだ。${d.left.name}と${d.right.name}は${d.turns}ターンにわたり好勝負を展開。${d.winner.name}が${d.finishLabel}で勝利を手にしたが、試合後に交わした視線には敵意ではなく敬意が宿っていた。MQ ${d.mq}。`,
    ],
    // 圧勝
    dominant: [
      d => `わずか${d.turns}ターン。${d.winner.name}は${d.loser.name}に反撃の余地すら与えなかった。${d.finishLabel}が決まった瞬間、${d.venue.name}は静まり返った。実力差を見せつけた${d.winner.name}の強さは本物だ。`,
      d => `${d.loser.name}にとっては厳しい夜となった。${d.winner.name}の猛攻に防戦一方、${d.turns}ターンでの決着に${d.attendance.toLocaleString()}人の観客も言葉を失った。`,
    ],
    // 僅差の好勝負
    closeMQ: [
      d => `${d.turns}ターンの死闘——勝敗を分けたのは、ほんのわずかな差だった。${d.winner.name}と${d.loser.name}はMQ ${d.mq}の名勝負を演じ、${d.venue.name}の${d.attendance.toLocaleString()}人を総立ちにさせた。${d.finishLabel}で辛くも勝利した${d.winner.name}だが、敗れた${d.loser.name}の評価もまた上がったはずだ。`,
      d => `最後の最後まで勝負の行方は分からなかった。${d.loser.name}も見せ場を作り続けたが、${d.winner.name}の${d.finishLabel}が決着を告げた。消耗戦を制した${d.winner.name}のタフネスが光った${d.turns}ターン。MQ ${d.mq}は今シーズン屈指の数字だ。`,
    ],
    // 番狂わせ
    upset: [
      d => `戦前の予想を覆す結果となった。OVR格差${d.ovrGap}ポイントの壁を、${d.winner.name}は気迫で打ち破った。${d.finishLabel}が決まった瞬間、${d.venue.name}は驚きと興奮に包まれた。格上${d.loser.name}からの金星は、${d.winner.name}にとって大きな自信になるだろう。`,
    ],
    // 超高MQ
    superMQ: [
      d => `MQ ${d.mq}——今シーズンのベストバウト候補が生まれた。${d.left.name}と${d.right.name}は${d.turns}ターンにわたって技術と闘志をぶつけ合い、${d.venue.name}の${d.attendance.toLocaleString()}人を熱狂の渦に巻き込んだ。${d.winner.name}が${d.finishLabel}で勝利を収めたが、勝敗を超えた価値がこの試合にはあった。`,
    ],
    // ドロー
    draw: [
      d => `${d.left.name}と${d.right.name}、${d.turns}ターンの攻防は決着を見なかった。互いにフォールを返し合い、極めを切り合い、最後まで膝を折らなかった二人。${d.venue.name}の${d.attendance.toLocaleString()}人は、引き分けという結果にもかかわらず惜しみない拍手を送った。再戦を望む声が、すでにあちこちから聞こえている。`,
      d => `決着つかず。${d.left.name}も${d.right.name}も己の全てを出し尽くした結果がこのドローだ。MQ ${d.mq}が示す通り、試合内容に不満を持つ者はいないだろう。次はどちらが先に決着をつけるのか——${d.attendance.toLocaleString()}人のファンが次の邂逅を待っている。`,
    ],
    // 通常
    normal: [
      d => `${d.venue.name}で行われた${d.showName}のメインイベントは、${d.winner.name}が${d.finishLabel}で${d.loser.name}を下して幕を閉じた。${d.turns}ターンの試合は${d.attendance.toLocaleString()}人の観客を沸かせ、MQ ${d.mq}を記録した。`,
      d => `${d.winner.name}がメインの大舞台で堂々たる勝利を飾った。${d.loser.name}も要所で見せ場を作ったが、最終的には${d.winner.name}の${d.finishLabel}に沈んだ。${d.attendance.toLocaleString()}人の観客が見守った${d.turns}ターンの一戦。`,
    ],
    // 低MQ
    lowMQ: [
      d => `正直に言えば、メインイベントは物足りなさが残った。${d.winner.name}が${d.finishLabel}で${d.loser.name}を下したものの、MQ ${d.mq}という数字が試合内容を物語っている。${d.attendance.toLocaleString()}人のファンは、次回の興行にこそ期待を寄せるだろう。`,
    ],
  },

  _generateNewspaperTexts(d) {
    // カテゴリ優先度で選択
    let cat;
    if (d.isDraw) cat = 'draw';
    else if (d.isSuperMQ && !d.isDominant) cat = 'superMQ';
    else if (d.isTitleMatch) cat = d.winner ? 'titleWin' : 'titleDefend';
    else if (d.isUpset) cat = 'upset';
    else if (d.hasRivalry) cat = 'rivalry';
    else if (d.isDominant) cat = 'dominant';
    else if (d.isCloseMatch && d.isHighMQ) cat = 'closeMQ';
    else if (d.isLowMQ) cat = 'normal';
    else cat = 'normal';

    // 防衛戦判定（タイトルマッチで勝った場合、王者かどうか）
    if (d.isTitleMatch && !d.isDraw) {
      // シンプルに titleWin を使用（防衛/奪取の区別はテキストで吸収）
      if (cat !== 'superMQ' && cat !== 'upset') cat = 'titleWin';
    }

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const HL = App._NEWSPAPER_HEADLINES;
    const AR = App._NEWSPAPER_ARTICLES;

    const headline = pick(HL[cat] || HL.normal)(d);

    // サブヘッドライン：常にカードと数値情報
    let subheadline;
    if (d.isDraw) {
      subheadline = `${d.showName}・${d.venue.name}。観客${d.attendance.toLocaleString()}人、${d.turns}ターンの攻防は決着を見ず。全${d.totalMatches}試合の平均MQ ${d.avgMQ}`;
    } else if (d.otherHighMQ.length > 0) {
      subheadline = `${d.venue.name}大会、観客${d.attendance.toLocaleString()}人。全${d.totalMatches}試合平均MQ ${d.avgMQ}——好カード続出の${d.showName}`;
    } else {
      subheadline = `${d.showName}・${d.venue.name}。観客${d.attendance.toLocaleString()}人。メインMQ ${d.mq}、全${d.totalMatches}試合平均MQ ${d.avgMQ}`;
    }

    // 記事本文
    let articleCat = cat;
    if (d.isGoodRival && !d.isDraw && cat !== 'superMQ') articleCat = 'goodRival';
    const articlePool = AR[articleCat] || AR.normal;
    let article = pick(articlePool)(d);

    // 低MQ追記
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
    const showName = isPPV(G.week) ? 'PPV GRAND FINAL' : (isSpecialShow(G.week) ? '特別興行' : `第${G.totalShows}回 定期興行`);
    const finishLabel = Engine.formatFinish(main.finType, main.finMove);
    const turns = main.turns || 0;
    const mq = main.mq || avgMQ;
    const hpL = main.hpLeft || { final: 0, max: 100 };
    const hpR = main.hpRight || { final: 0, max: 100 };

    // 試合状況フラグ
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

    // 因縁・関係データ
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

    // OVR差
    const ovrL = Engine.util.ov(main.left);
    const ovrR = Engine.util.ov(main.right);
    const ovrGap = Math.abs(ovrL - ovrR);
    const isUpset = !isDraw && winner && (
      (winner.id === main.left.id && ovrL < ovrR - 8) ||
      (winner.id === main.right.id && ovrR < ovrL - 8)
    );

    // 他の試合のハイライト
    const otherHighMQ = results.slice(1).filter(r => (r.mq || 0) >= 75);
    const totalMatches = results.length;

    // ─── テキスト生成 ───
    const np = App._generateNewspaperTexts({
      isDraw, winner, loser, left: main.left, right: main.right,
      isTitleMatch: !!main.isTitleMatch, finishLabel, turns, mq,
      loserHpPct, winnerHpPct, isCloseMatch, isDominant, isLongBattle,
      isHighMQ, isSuperMQ, isLowMQ, isPPVShow, isSpecial,
      hasRivalry, isGoodRival, rivalLabel, isHighBond,
      ovrGap, isUpset, venue, attendance, showName, avgMQ,
      otherHighMQ, totalMatches, orgName: G.orgName
    });

    // ── allMatches: メイン以外の全試合ダイジェスト ──
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

    // 集客v2: ★評価をv2 calcShowRating で算出
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

    // ── preview: 次回展望データ ──
    const preview = { fanExpect: [], rivalry: null, title: null };
    // ファン期待カード（動的生成）
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
    // 因縁ペア（tierが最大のもの）
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
    // タイトル戦展望
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
      showName, venueName: venue.name, attendance, avgMQ,
      headline: np.headline, subheadline: np.subheadline, article: np.article,
      winner, loser, left: main.left, right: main.right, isDraw, finishLabel,
      turns, mq, hpLeft: hpL, hpRight: hpR, isTitleMatch: !!main.isTitleMatch,
      allMatches, showRating, preview,
      generatedWeek: G.week, generatedSeason: G.season,
    };
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

    // 試合後コメントポップアップ（因縁マッチ）
    const matchDialogues = [..._pendingMatchDialogues];
    _pendingMatchDialogues = [];
    if (matchDialogues.length > 0) {
      showPostMatchDialogues(matchDialogues);
    }

    // v1.3-3: Extract pending injury retirements before state changes
    const pendingInjuryRetirements = G._pendingInjuryRetirements || [];
    if (G._pendingInjuryRetirements) {
      const { _pendingInjuryRetirements: _, ...cleanG } = G;
      G = cleanG;
    }
    pendingInjuryRetirements.forEach(r => {
      G = archiveRetiredRivalryState(G, r.fighter || null);
    });

    // ラストラン引退（引退試合完了後の即引退）
    const pendingLastRunRetirements = G._pendingLastRunRetirements || [];
    if (G._pendingLastRunRetirements) {
      const { _pendingLastRunRetirements: _, ...cleanG } = G;
      G = cleanG;
    }
    pendingLastRunRetirements.forEach(r => {
      G = archiveRetiredRivalryState(G, r.fighter || null);
    });

    // R3: ファン期待カード試合後リアクション
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
        detail: `📣 ${crowdText}`,
        autoCloseMs: 2500,
      }), i * 100);
    });

    // v0.96: Show injury popups (only non-retirement injuries)
    const injuries = App._lastInjuries || [];
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
    // タイトルマッチ後リアクション（勝敗問わず）
    const titleOutcomes = App._lastTitleOutcomes || [];
    App._lastTitleOutcomes = [];
    let titlePopupDelay = injuries.length * 100 + 50;
    titleOutcomes.forEach(to => {
      if (to.outcome === 'change') {
        // 新王者リアクション
        const newChamp = G.roster.find(c => c.id === to.newChampId);
        if (newChamp) {
          hasEventPopups = true;
          const d = titlePopupDelay; titlePopupDelay += 100;
          setTimeout(() => showEventPopup({ type:'fighter', id:newChamp.id, name:newChamp.name, tone:'gold',
            message: getTraitQuote('titleWin', newChamp), detail:`👑 ${newChamp.name}が新団体王者に！` }), d);
        }
        // 前王者リアクション
        if (to.prevChampId) {
          const prevChamp = G.roster.find(c => c.id === to.prevChampId);
          if (prevChamp) {
            hasEventPopups = true;
            const d = titlePopupDelay; titlePopupDelay += 100;
            setTimeout(() => showEventPopup({ type:'fighter', id:prevChamp.id, name:prevChamp.name, tone:'negative',
              message: getTraitQuote('titleLoss', prevChamp), detail:`王座陥落…` }), d);
          }
        }
      } else if (to.outcome === 'defense') {
        // チャンピオン防衛リアクション
        const champ = G.roster.find(c => c.id === to.champId);
        if (champ) {
          hasEventPopups = true;
          const d = titlePopupDelay; titlePopupDelay += 100;
          setTimeout(() => showEventPopup({ type:'fighter', id:champ.id, name:champ.name, tone:'gold',
            message: getTraitQuote('titleDefense', champ), detail:`🛡️ タイトル防衛成功！` }), d);
        }
        // 挑戦者リアクション
        const challenger = G.roster.find(c => c.id === to.challengerId);
        if (challenger) {
          hasEventPopups = true;
          const d = titlePopupDelay; titlePopupDelay += 100;
          setTimeout(() => showEventPopup({ type:'fighter', id:challenger.id, name:challenger.name, tone:'negative',
            message: getTraitQuote('titleChallengeLoss', challenger), detail:`タイトル挑戦失敗…` }), d);
        }
      }
    });
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

    // 興行終了後にshowCardをリセット（renderShowPrep の pad/trim で会場に応じた枠数に自動調整）
    G = { ...G, showCard: [] };

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
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    // v1.5s25b: 興行後バフ消費 + 週次バフ消費
    App._tickMilestoneBuffsShow();
    App._applyWeeklyBuffEffects();
    App._tickMilestoneBuffsWeekly();

    // ポップアップ連鎖: eventPopups → 因縁決着 → ブレークスルー/スランプ → 引退
    const pendingGrowthEventsShow = G._pendingGrowthEvents || [];
    if (G._pendingGrowthEvents) {
      const { _pendingGrowthEvents: _, ...cleanG } = G;
      G = cleanG;
    }
    const pendingResolutions = App._pendingRivalryResolutions || [];
    App._pendingRivalryResolutions = [];

    // チェーンを逆順に組み立て（retirement ← growth ← resolution ← eventPopups）
    let nextAction = null;
    if (pendingInjuryRetirements.length > 0) {
      nextAction = () => showRetirementPopups(pendingInjuryRetirements);
    }
    if (pendingLastRunRetirements.length > 0) {
      const afterLastRun = nextAction;
      nextAction = () => showRetirementPopups(pendingLastRunRetirements, afterLastRun || (() => {}));
    }
    if (pendingGrowthEventsShow.length > 0) {
      const after = nextAction;
      nextAction = () => showGrowthEventPopups(pendingGrowthEventsShow, after || (() => {}));
    }
    if (pendingResolutions.length > 0) {
      const after = nextAction;
      nextAction = () => showRivalryPopups(pendingResolutions, after || (() => {}));
    }
    if (nextAction) {
      if (hasEventPopups) {
        _onEventPopupQueueEmpty = nextAction;
      } else {
        setTimeout(nextAction, 200);
      }
    }

    // スナップショット R3モーダル表示（興行後）
    if (G._pendingR3Modal) {
      const r3ModalShow = G._pendingR3Modal;
      const { _pendingR3Modal: _, ...cleanR3Show } = G;
      G = cleanR3Show;
      const r3Fighter = G.roster.find(f => f.id === r3ModalShow.fighterId);
      setTimeout(() => {
        showR3Modal({
          fighterName: r3Fighter ? r3Fighter.name : '???',
          fighterFace: r3Fighter ? getPortraitUrl(r3Fighter.id) : null,
          departedName: r3ModalShow.departedName || '???',
          reason: r3ModalShow.reason || 'departed',
          line: r3ModalShow.text,
        });
      }, 800);
    }

    // P4-P6: Glimpse（心の垣間見え）表示（興行後）
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

  // v2.0-C3: Always stop — no auto-advance. Accumulate financeHistory and set weekSummary or settled phase.
  _tryAutoAdvance() {
    // 財務タブリデザイン: financeHistory に週次決算を永続蓄積
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
    dismissAllPopups(); // 残存ポップアップを強制クリア
    const result = Engine.advanceWeek(G);
    G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
    // ── 体験版シーズンゲート ──
    if (G._trialEnd) {
      const { _trialEnd: _, ...cleanG } = G;
      G = cleanG;
      Storage.autoSave();
      showTrialEndMessage();
      refreshAll();
      return;
    }
    // 契約更新交渉フェーズ
    if (G.weekPhase === 'contractNegotiation') {
      Storage.autoSave();
      App.handleContractNegotiations();
      return;
    }
    // PPVフェーズ
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
    if (G.missionEnabled) { const mResult = Mission.updateCompleted(G); G = mResult.state; }
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
      const msg = isPPV(G.week) ? '🏆 今週はPPV GRAND FINAL！年間最大の舞台です！' : '⭐ 今週は月末特別興行！試合枠+1で組める！';
      setTimeout(() => showToast(msg, 7000), 300);
    }
  },

  // Process a week (manage + settle) via tickWeek
  // A-3: おまかせ育成 — 方針を維持しつつ強化ON/OFFと体調60未満の休養を自動設定
  autoManage() {
    if (G.weekPhase !== 'manage') return;
    Audio.play('select');
    const roster = G.roster.map(c => {
      if (c.injury || c.isRental || c.forcedRest) return c;
      const policy = c.schedule || 'balance'; // 現在の方針を保持
      if (c.condition >= 80) return { ...c, schedule: policy, intensive: policy !== 'rest' };
      if (c.condition >= 75) return { ...c, schedule: policy, intensive: false };
      if (c.condition >= 60) return { ...c, schedule: policy, intensive: false };
      // < 60: 方針に関わらず休養
      return { ...c, schedule: 'rest', intensive: false };
    });
    G = { ...G, roster };
    showToast('🤖 おまかせ完了 — 内容を確認してください');
    refreshAll();
  },

  processWeek() {
    Audio.play('tick');
    dismissAllPopups(); // 前週の残存ポップアップを強制クリア
    // 今週のログフィードをリセット（前週分クリア）
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
    // v2.1: ゲームオーバー判定（autoSave せず専用画面へ）
    if (G.weekPhase === 'gameover') {
      const summary = Engine.ending.buildGameOverSummary(G);
      showGameOverScreen(summary);
      return;
    }
    App.checkMissionUpdate();
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
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
        delete retiredF.growthLog;
        G = { ...G,
          roster: G.roster.filter(c => c.id !== f.id),
          retiredFighters: [...(G.retiredFighters || []), retiredF]
        };
        // 王者がモチベ喪失引退した場合は王座を空位にする
        const vcMR = Engine.title.validateChampion(G);
        if (vcMR.msg) { G = { ...G, titles: vcMR.titles, gameLog: [...(G.gameLog || []), vcMR.msg] }; }
        G = archiveRetiredRivalryState(G, retiredF);
        // §2.3: 引退者の関係値を凍結
        if (G.relationships) G = Engine.relationships.freezeRelationships(G, f.id);
        const delay = (newInjuries.length + flavorEvents.length) * 100 + 200;
        setTimeout(() => showRetirementPopups([{ fighter: retiredF, route: 'motivation', line, summary }]), delay);
      });
    }
    if (weekGrowthEvents.length > 0) {
      const baseDelay = (newInjuries.length + flavorEvents.length) * 100 + 100;
      setTimeout(() => showGrowthEventPopups(weekGrowthEvents), baseDelay);
    }

    // §13.4: 突然の退団表示
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
          text: `🚪 ${d.name}が荷物をまとめて団体を去った。誰も止められなかった。`,
          detail: d.destination === 'rival' ? `${d.name}は他団体へ移籍した。` : `${d.name}はフリーとなった。`,
        }), sdDelay + i * 200);
      });
    }

    // P1: スキャンダル通知ポップアップ
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
          text: `📰 ${sc.fighterName}のスキャンダルが週刊誌に掲載された！`,
          detail: `ファンの間に動揺が広がっている（人気${sc.popDelta}）`,
        }), scandalDelay + i * 300);
      });
    }

    // P5: 怪我離脱中の人気低下トースト
    const pendingInjuryPopDecay = G._pendingInjuryPopDecay || null;
    if (G._pendingInjuryPopDecay) {
      const { _pendingInjuryPopDecay: _, ...cleanIpd } = G;
      G = cleanIpd;
    }
    if (pendingInjuryPopDecay && pendingInjuryPopDecay.length > 0) {
      const ipdDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 100;
      pendingInjuryPopDecay.forEach((ipd, i) => {
        setTimeout(() => showToast(`📉 ${ipd.fighterName}の人気がじわじわ下がっている…（離脱中）`, 5000), ipdDelay + i * 200);
      });
    }

    // O2: ガラガラ興行 → 新聞記事
    if (G._pendingEmptyVenue) {
      const { _pendingEmptyVenue: _, ...cleanEv } = G;
      G = cleanEv;
      App._pushNewsEvent({ type: 'emptyVenue',
        data: { org: G.orgName || 'あなたの団体', season: G.season, week: G.week } });
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

    // v2.0 Phase1-7: 逆境チームスピリットバフ表示
    const pendingTeamSpirit = G._pendingTeamSpirit || null;
    if (G._pendingTeamSpirit) {
      const { _pendingTeamSpirit: _, ...cleanTs } = G;
      G = cleanTs;
    }
    if (pendingTeamSpirit) {
      const spiritDelay = (newInjuries.length + flavorEvents.length + weekGrowthEvents.length) * 100 + 350;
      setTimeout(() => showNotifEventToast(pendingTeamSpirit), spiritDelay);
    }

    // §B-2: 移籍ウィンドウ前週の予兆通知
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
            ? '⚠️ 来週は移籍ウィンドウです。信頼ケアの最後のチャンスかもしれません。'
            : '👁️ 来週は移籍ウィンドウです。動向を注視しましょう。',
        }), pwDelay + i * 300);
      });
    }

    // §2 観察眼: コーチ報告（育成画面にインライン表示用に保持）
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

    // スナップショット R3モーダル表示
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

    // P4-P6: Glimpse（心の垣間見え）表示
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

    // v1.9: 逸材特別交渉枠アンロック通知
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
          type: 'system', emoji: '🏅', tone: 'gold',
          message: '🎊 逸材特別交渉枠を獲得！ 🎊',
          detail: '団体の名声が業界に轟いた！\n'
                + '逸材クラスの選手たちが、あなたの団体に注目しています。\n\n'
                + '💎 FA市場で逸材ランクの選手1名と特別に交渉可能\n'
                + '⏳ いつでも使用可能（温存OK）\n'
                + '⚠️ 1回限り / 超逸材には使用不可'
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
      const msg = isPPV(G.week) ? '🏆 今週はPPV GRAND FINAL！年間最大の舞台です！' : '⭐ 今週は月末特別興行！試合枠+1で組める！';
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
    dismissAllPopups(); // 残存ポップアップを強制クリア
    const result = Engine.advanceWeek(G);
    G = { ...result.state, gameLog: [...G.gameLog, ...result.events] };
    // ── 体験版シーズンゲート ──
    if (G._trialEnd) {
      const { _trialEnd: _, ...cleanG } = G;
      G = cleanG;
      Storage.autoSave();
      showTrialEndMessage();
      refreshAll();
      return;
    }
    // 契約更新交渉フェーズ
    if (G.weekPhase === 'contractNegotiation') {
      Storage.autoSave();
      App.handleContractNegotiations();
      return;
    }
    // PPV Week 48: PPVフェーズに入った場合は専用フローへ
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
    // ジュニアトーナメント Week 25
    if (G.weekPhase === 'juniorTournament') {
      Storage.autoSave();
      App.initJuniorTournament();
      return;
    }
    // v0.96: Update mission completions
    if (G.missionEnabled) {
      const mResult = Mission.updateCompleted(G);
      G = mResult.state;
    }
    // v0.97: Update survival gauge
    App.checkSurvivalUpdate();
    App.checkTitleEstablishment(); App.checkRosterCapMilestones();
    sessionRng = Engine.rng.create(G.rngSeed);

    // v1.4w: 交渉成功時の新聞イベント
    if (G.negotiationResult && G.negotiationResult.success && G.negotiationResult.fighter && !(G.pendingRosterOverflowSigning && G.pendingRosterOverflowSigning.source === 'negotiation')) {
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
    (pendingRetirements || []).forEach(r => {
      G = archiveRetiredRivalryState(G, r.fighter || null);
    });

    // v1.4w: AI引退選手の新聞イベント収集（名選手: OVR70以上、年齢30以上）
    if (pendingRetirements) {
      pendingRetirements.forEach(r => {
        const f = r.fighter;
        if (!f) return;
        const ovr = Engine.util.ov(f);
        if (ovr >= 70 || (f.age || 17) >= 25) {
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
      showRetirementPopups(pendingRetirements, () => App._safeAwardsChain());
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
      showAIGrowthAlerts(aiAlerts, () => App._safeAwardsChain());
    } else {
      // v1.4: 引退者なしでも新聞パネル→エンディングチェック→表彰式チェック
      App._safeAwardsChain();
    }
  },

  // 表彰式チェーン安全実行: 中間ステップのエラーで表彰式が消失しないよう防御
  _recoverPendingAwards() {
    if (G.pendingAwards) return true;
    if (!G.offSeason || G.offWeek !== 1) return false;
    if (!Array.isArray(G.seasonHistory) || G.seasonHistory.length === 0) return false;
    try {
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xA11D));
      const pendingAwards = Engine.awards.generate(rng, G);
      G = { ...G, pendingAwards, gameLog: [...(G.gameLog || []), '🛠 年末表彰データを復旧しました'] };
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

  // v1.9: 新シーズン開幕ファンファーレのトリガー判定
  _maybeShowSeasonFanfare(callback) {
    if (G.week === 1 && !G.offSeason && G.season > 1 && typeof showSeasonFanfare === 'function') {
      showSeasonFanfare(G.season, callback);
    } else {
      callback();
    }
  },

  // v2.1: エンディング演出チェック（初クリア時のみ、1回限り）
  _checkAndShowEnding(onDone) {
    // 業界底上げ演出をチェーンする内部関数
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

  // v1.4: 年末表彰式チェック＆表示
  _checkAndShowAwards() {
    const pendingAwards = G.pendingAwards;
    if (!pendingAwards) { App._checkAndShowMilestone(() => App._maybeShowSeasonFanfare(() => refreshAll())); return; }
    // pendingAwards は transient field — 保存前にクリーン
    const { pendingAwards: _, ...cleanG } = G;
    G = cleanG;

    // 受賞歴をキャリア記録に追加
    {
      let ar = G.roster;
      const aSeason = pendingAwards.season || G.season;
      const aWeek = 49; // オフシーズン表彰式
      if (pendingAwards.rookieOfYear && pendingAwards.rookieOfYear.isPlayerOrg) {
        ar = ar.map(f => f.id === pendingAwards.rookieOfYear.id
          ? Engine.career.addEvent(f, { type: 'awardRookie', season: aSeason, week: aWeek }) : f);
      }
      if (pendingAwards.mvp && pendingAwards.mvp.isPlayerOrg) {
        ar = ar.map(f => f.id === pendingAwards.mvp.id
          ? Engine.career.addEvent(f, { type: 'awardMVP', season: aSeason, week: aWeek }) : f);
      }
      if (pendingAwards.mediaAward) {
        ar = ar.map(f => f.id === pendingAwards.mediaAward.id
          ? Engine.career.addEvent(f, { type: 'awardMedia', season: aSeason, week: aWeek }) : f);
      }
      if (pendingAwards.bestMatch && pendingAwards.bestMatch.isPlayerOrg) {
        const bmIds = new Set();
        if (pendingAwards.bestMatch.fighter1 && pendingAwards.bestMatch.fighter1.id) bmIds.add(pendingAwards.bestMatch.fighter1.id);
        if (pendingAwards.bestMatch.fighter2 && pendingAwards.bestMatch.fighter2.id) bmIds.add(pendingAwards.bestMatch.fighter2.id);
        ar = ar.map(f => bmIds.has(f.id)
          ? Engine.career.addEvent(f, { type: 'awardBestMatch', season: aSeason, week: aWeek, mq: pendingAwards.bestMatch.mq }) : f);
      }
      G = { ...G, roster: ar };
    }

    // Phase 4 E-05: 表彰式の関係値反映
    if (G.relationships) {
      const awardRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBE5B));
      let relState = { ...G };
      const rosterIds = (G.roster || []).filter(f => !f.isRental).map(f => f.id);
      // 各賞の受賞者（プレイヤー団体所属のみ）に対して関係値を適用
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
        // winner→roster: bond +2~+3
        relState = Engine.relationships.applyToRoster(relState, winnerId, otherIds,
          { min: 2, max: 3 }, { min: 0, max: 0 }, awardRelRng);
        // roster→winner: bond +1~+2
        relState = Engine.relationships.applyFromRoster(relState, otherIds, winnerId,
          { min: 1, max: 2 }, { min: 0, max: 0 }, awardRelRng);
        // OVR近接者(diff≤5)→winner: rivalry +2~+4
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
    // 引き止め成功でrosterに戻った選手を殿堂入り候補から除外
    const rosterIds = new Set(G.roster.map(c => c.id));
    pendingAwards.hallOfFame = (pendingAwards.hallOfFame || []).filter(h => !rosterIds.has(h.id));
    // v1.4w: 殿堂入りの新聞イベント収集
    if (pendingAwards.hallOfFame.length > 0) {
      pendingAwards.hallOfFame.forEach(h => {
        App._pushNewsEvent({ type: 'hallOfFame', characterId: h.id,
          data: { name: h.name, titles: h.titleReigns || 0, defenses: h.totalDefenses || 0 } });
      });
    }
    // 表彰式ポップアップ開始
    try { Audio.fileBgm.play('../bgm/8bit-ending-theme_Loop.ogg', { loop: true, volume: 0.07 }); } catch(e) {}
    showAwardsCeremony(pendingAwards, () => {
      try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
      // 表彰式BGMフェードアウト後に通常BGMを再開
      setTimeout(() => { try { Audio.bgm.play('management'); } catch(e) {} }, 1600);
      // 表彰式完了後: 殿堂入り処理 + retiredFighters 清掃
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
    Audio.play('event');
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
    // §13.3: __orgPop: イベントからorgPop変動を抽出して適用
    let orgPopDelta = 0;
    const displayEvents = [];
    (result.events || []).forEach(e => {
      if (typeof e === 'string' && e.startsWith('__orgPop:')) {
        orgPopDelta += parseFloat(e.replace('__orgPop:', ''));
      } else {
        displayEvents.push(e);
      }
    });
    // orgPop変動があればログに記録（__orgPop:はdisplayEventsから除外されるため、ログにも残らなかった）
    if (orgPopDelta !== 0) {
      displayEvents.push(`📉 団体人気${orgPopDelta >= 0 ? '+' : ''}${Math.round(orgPopDelta * 100) / 100}`);
    }
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      orgPop: Engine.util.clamp((G.orgPop || 0) + orgPopDelta, 0, 100),
      gameLog: [...(G.gameLog || []), ...displayEvents]
    };
    // 放出された選手をFA/dormantに振り分け
    if (result.departedFighters && result.departedFighters.length > 0) {
      for (const departed of result.departedFighters) {
        // orgTimeline記録
        const tracked = Engine.orgTimeline.transfer(departed, 'fa', G.season, G.week);
        // 退団bond/rivalry影響
        Engine.relationships.applyDepartureTrustImpact(G, departed.id, 'release', {});
        if (Engine.util.canAddToFA(G)) {
          G = { ...G, freeAgents: [...(G.freeAgents || []), tracked] };
        } else {
          G = Engine.util.redirectToDormantPool(G, tracked);
        }
      }
      // 王者が放出/退団した場合は王座を空位にする
      const vcCE = Engine.title.validateChampion(G);
      if (vcCE.msg) { G = { ...G, titles: vcCE.titles, gameLog: [...(G.gameLog || []), vcCE.msg] }; }
    }
    Storage.autoSave();
    Audio.play('event');
    renderWeekScreen();
    // 結果をモーダルで表示（toastではなく）
    if (displayEvents.length > 0) {
      showChoiceEventResult(event, displayEvents, G);
    }
  },

  // v2.0 Phase1-6: 大型イベントUIフロー制御
  handleLargeEvent(event) {
    // Step 0: 初期表示
    showLargeEventModal(event, G, 0, (choiceIdx) => {
      if (choiceIdx < 0) return;
      const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B2));
      const result = Engine.eventSystem.applyLargeEventEffect(event, 0, choiceIdx, G, rng);
      App._applyLargeEventResult(result);

      // B4タレント活動: 選手選択後にセリフポップアップ表示
      if (event.type === 'B4' && choiceIdx > 0) {
        const selectedFighter = G.roster.find(f => f.id === choiceIdx);
        if (selectedFighter) {
          const dlgRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB4D1));
          // activityType がある場合は B4_{activityType} キーでセリフ取得
          const dlgEvent = event.activityType ? { ...event, type: `B4_${event.activityType}`, fighter: choiceIdx } : { ...event, fighter: choiceIdx };
          const dialogue = Engine.eventSystem.getLargeEventDialogue(dlgRng, dlgEvent, G.roster);
          if (dialogue) {
            setTimeout(() => showEventPopup({
              type: 'fighter', id: selectedFighter.id, name: selectedFighter.name,
              tone: 'neutral', message: dialogue, autoCloseMs: 3000,
            }), 200);
          }
        }
      }

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

  // 大型イベント: VS対峙画面表示（試合はまだ実行しない）
  _executeLargeEventMatch(event, prevResult) {
    if (event.type === 'B2') {
      const intervention = prevResult.interventionChoice; // 0=f1, 1=f2, 2=neutral
      let f1 = G.roster.find(f => f.id === event.fighter1);
      let f2 = G.roster.find(f => f.id === event.fighter2);
      if (!f1 || !f2) return;

      // 介入バフの適用（一時的コピー）
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

  // B3: 試合を観る
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
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: {
        ...pf, condition: 80,
        portraitUrl: getPortraitUrl(pf.id), profile: CHAR_PROFILES[pf.id] || '',
        vl: pf.voiceLines || pf.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[pf.id]) || ['…！']
      },
      right: {
        ...af, condition: 80,
        portraitUrl: getPortraitUrl(af.id), profile: CHAR_PROFILES[af.id] || '',
        vl: af.voiceLines || af.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[af.id]) || ['…！']
      },
      matchInfo: {
        header: '⚔ 挑戦状',
        subHeader: `${pf.name} vs ${af.name}`,
        matchNum: 1, totalMatches: 1,
        isTitle: false, isSpecialMatch: true, matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, pf.id, af.id); return rl ? rl.tier : 0; })(),
        leftPersonality: pf.personality || 'normal', leftArchetype: pf.archetype || 'normal',
        rightPersonality: af.personality || 'normal', rightArchetype: af.archetype || 'normal',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      }
    };
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    const baseSrc = (iframe.getAttribute('src') || 'battle-engine.html').split('?')[0];
    iframe.src = baseSrc + '?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // B3: スキップ
  b3SkipMatch() {
    const b3 = App._b3Preview;
    if (!b3) return;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const matchResult = Engine.battle.simulateMatch(b3.playerFighter, b3.challenger, rng, 2);
    b3.matchResult = matchResult;
    App._finalizeB3Match(matchResult);
  },

  // B3: iframe結果受信
  _receiveB3BattleResult(data) {
    const b3 = App._b3Preview;
    if (!b3) return;
    b3.watching = false;
    const matchResult = {
      winner: data.winner,
      finType: data.finType || '', finMove: data.finMove || '',
      turns: data.turns || 0, mq: data.mq || 50,
      hpLeft: { final: data.hpLeft ? data.hpLeft.current : 0, max: data.hpLeft ? data.hpLeft.max : 100 },
      hpRight: { final: data.hpRight ? data.hpRight.current : 0, max: data.hpRight ? data.hpRight.max : 100 },
      log: data.log || []
    };
    b3.matchResult = matchResult;
    // BGMフェードアウト
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    document.getElementById('battleOverlay').style.display = 'none';
    Audio.play('coin');
    App._finalizeB3Match(matchResult);
  },

  // B3: 結果適用 + 結果画面表示
  _finalizeB3Match(matchResult) {
    const b3 = App._b3Preview;
    if (!b3) return;
    const { event, playerFighter, challenger } = b3;
    const fighterId = playerFighter.id;

    // 結果をeventに添付して Step 2 を適用
    const enrichedEvent = { ...event, matchResult, selectedFighterId: fighterId };
    const rng3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B6));
    const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
    App._applyLargeEventResult(result3);

    // B3: 他団体戦 applyMatchResult（isCrossOrg=true でrivalryブースト）
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

    // ブレークスルー判定（挑戦状は isWarMatch=true）
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

    // 金銭バランス改善: 挑戦状メディア収入
    const b3VenueIdx = G.showVenue || 0;
    const b3VenueMult = VENUE_MEDIA_MULT[b3VenueIdx] || 1.0;
    const b3MediaRev = Math.round(matchResult.mq * MEDIA_CONFIG.eventPerMQ * b3VenueMult * 1.0);
    if (b3MediaRev > 0) {
      const b3MediaIncomes = G._pendingMediaIncomes ? [...G._pendingMediaIncomes] : [];
      b3MediaIncomes.push({ amount: b3MediaRev, label: `挑戦状 vs ${event.orgName}` });
      G = { ...G, _pendingMediaIncomes: b3MediaIncomes };
    }

    // 新聞パネルイベント
    const newsType = matchResult.winner === 'left' ? 'interPromoWin' : (matchResult.winner === 'right' ? 'interPromoLoss' : 'interPromoDraw');
    App._pushNewsEvent({ type: newsType, data: { orgName: event.orgName, fighterName: playerFighter.name, challengerName: challenger.name } });

    // 結果画面表示
    setTimeout(() => _renderB3MatchResult(event, matchResult, playerFighter, challenger), 300);
  },

  // B3: 結果画面を閉じる
  closeB3Result() {
    const overlay = document.getElementById('showResultOverlay');
    overlay.classList.remove('active');
    App._b3Preview = null;
    Audio.play('event');
    renderWeekScreen();
  },

  // B2: 試合を観る
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
    const iframe = document.getElementById('battleIframe');
    const msg = {
      type: 'START_MATCH',
      left: {
        ...f1, condition: 80,
        portraitUrl: getPortraitUrl(f1.id), profile: CHAR_PROFILES[f1.id] || '',
        vl: f1.voiceLines || f1.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[f1.id]) || ['…！']
      },
      right: {
        ...f2, condition: 80,
        portraitUrl: getPortraitUrl(f2.id), profile: CHAR_PROFILES[f2.id] || '',
        vl: f2.voiceLines || f2.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[f2.id]) || ['…！']
      },
      matchInfo: {
        header: '💥 決着の試合',
        subHeader: `${f1.name} vs ${f2.name}`,
        matchNum: 1, totalMatches: 1,
        isTitle: false, isSpecialMatch: true, matchTier: 2,
        rivalryTier: (() => { const rl = Engine.title.getRivalryLevel(G, f1.id, f2.id); return rl ? rl.tier : 0; })(),
        leftPersonality: f1.personality || 'normal', leftArchetype: f1.archetype || 'normal',
        rightPersonality: f2.personality || 'normal', rightArchetype: f2.archetype || 'normal',
        sfxMasterVol: Audio.sfxMasterVol, bgmMasterVol: Audio.bgmMasterVol,
      }
    };
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
    let sent = false;
    const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
    iframe.onload = () => setTimeout(sendOnce, 200);
    const baseSrc = (iframe.getAttribute('src') || 'battle-engine.html').split('?')[0];
    iframe.src = baseSrc + '?t=' + Date.now();
    setTimeout(sendOnce, 800);
  },

  // B2: スキップ
  b2SkipMatch() {
    const b2 = App._b2Preview;
    if (!b2) return;
    const rng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B4));
    const matchResult = Engine.battle.simulateMatch(b2.f1, b2.f2, rng, 2);
    b2.matchResult = matchResult;
    App._finalizeB2Match(matchResult);
  },

  // B2: iframe結果受信
  _receiveB2BattleResult(data) {
    const b2 = App._b2Preview;
    if (!b2) return;
    b2.watching = false;
    const matchResult = {
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

  // B2: 結果適用 + 結果画面表示
  _finalizeB2Match(matchResult) {
    const b2 = App._b2Preview;
    if (!b2) return;
    const { event, interventionChoice } = b2;
    const winner = matchResult.winner === 'left' ? 'fighter1' : (matchResult.winner === 'right' ? 'fighter2' : 'draw');

    // 結果をeventに添付して Step 2 を適用
    const enrichedEvent = { ...event, matchResult: { ...matchResult, winner }, interventionChoice };
    const rng3 = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xB1B5));
    const result3 = Engine.eventSystem.applyLargeEventEffect(enrichedEvent, 2, 0, G, rng3);
    App._applyLargeEventResult(result3);

    // 結果画面表示
    setTimeout(() => _renderB2MatchResult(event, matchResult, b2.f1, b2.f2, interventionChoice), 300);
  },

  // B2: 結果画面を閉じる
  closeB2Result() {
    const overlay = document.getElementById('showResultOverlay');
    overlay.classList.remove('active');
    App._b2Preview = null;
    Audio.play('event');
    renderWeekScreen();
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
    if (result.battlePoints) updates.battlePoints = result.battlePoints;
    // Phase 4: E-02/E-03 大型イベントの関係値反映
    if (result.relationships) updates.relationships = result.relationships;
    if (result.relationshipCounters) updates.relationshipCounters = result.relationshipCounters;
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
      return App.executeCareAction(actionId, fighterId);  // displayData を返す
    });
  },

  // v2.0: ケアアクション実行 (event-system-spec-v2.md §2)
  // 返り値: displayData オブジェクト（モーダル内結果画面用）または null（エラー時）
  executeCareAction(actionId, fighterId) {
    const result = Engine.careActions.execute(actionId, fighterId, G);
    if (!result) { showToast('アクションが見つかりません'); return null; }
    if (result.error === 'stock_insufficient') { showToast('ケアストックが不足しています'); return null; }
    if (result.error === 'funds_insufficient') { showToast('資金が不足しています'); return null; }
    if (result.error === 'fighter_not_found')  { showToast('選手が見つかりません'); return null; }
    if (result.error === 'not_injured')         { showToast('怪我をしていない選手には使用できません'); return null; }
    if (result.error === 'not_slump')           { showToast('スランプ中の選手ではありません'); return null; }
    if (result.error === 'cooldown') { showToast('今週はすでに使用済みです'); return null; }
    if (result.error === 'orgpop_locked') { showToast(`団体の知名度が足りません（知名度 ${result.required} 必要）`); return null; }

    // state 更新
    G = { ...G,
      roster: result.roster,
      funds: result.funds,
      lockerRoomMorale: result.lockerRoomMorale != null ? result.lockerRoomMorale : (G.lockerRoomMorale || 60),
      _teamCareWeekUsed: result._teamCareWeekUsed || G._teamCareWeekUsed || {},
      careStock: result.careStock != null ? result.careStock : G.careStock,
      gameLog: [...(G.gameLog || []), ...(result.events || [])]
    };
    // Phase 4: ケアアクションの関係値反映
    if (result.relationships) {
      G = { ...G, relationships: result.relationships };
    }
    // v3.0: メディア → orgPop +0.4（逓減適用）
    if (result.orgPopDelta) {
      const newOrgPop = Engine.util.clamp((G.orgPop || 0) + Engine.orgPop.applyOrgPopChange(result.orgPopDelta, G.orgPop, null), 0, 100);
      G = { ...G, orgPop: newOrgPop };
    }
    Storage.autoSave();

    // displayData 構築（モーダル内結果画面へ渡す）
    const cfg = typeof CARE_ACTIONS !== 'undefined' ? (CARE_ACTIONS[actionId] || {}) : {};
    const reactionKey = result.reactionKey || actionId;
    const careChanges = result.changes || [];
    let displayData = null;

    if (result.reactionFighterId != null) {
      const fighter = G.roster.find(f => f.id === result.reactionFighterId);
      if (fighter) {
        const text = Engine.careActions.getReactionText(reactionKey, fighter);
        displayData = { fighter, fighters: null, text, changes: careChanges,
          cost: result.cost || cfg.cost || 0, remainingFunds: result.funds, emoji: cfg.emoji || '', label: cfg.label || '', actionId };
      }
    } else {
      // 団体向け: ランダムに1人を代表として選ぶ + 複数アイコン用
      const healthyRoster = G.roster.filter(f => !f.injury && !f.isRental);
      const rep = healthyRoster.length > 0
        ? healthyRoster[Math.floor(Math.random() * healthyRoster.length)]
        : null;
      const text = rep ? Engine.careActions.getReactionText(reactionKey, rep) : null;
      displayData = { fighter: null, fighters: healthyRoster, repFighter: rep, text, changes: careChanges,
        cost: result.cost || cfg.cost || 0, remainingFunds: result.funds, emoji: cfg.emoji || '', label: cfg.label || '', actionId, isTeam: true };
    }

    // サウンド: アクション種別で分岐
    const soundCost = result.cost || cfg.cost || 0;
    if (actionId === 'camp') Audio.play('fanfare');
    else if (soundCost >= 160) Audio.play('award');
    else if (soundCost >= 80) Audio.play('event');
    else Audio.play('notify');
    renderWeekScreen();
    return displayData;
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
      popups.push({ cap: 14, message: '団体人気が70を突破！ メジャー団体の規模にふさわしい契約枠が確保されました。' });
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
        vl: pf.voiceLines || pf.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[pf.id]) || ['…！']
      },
      right: {
        ...af, condition: 80,
        portraitUrl: getPortraitUrl(af.id), profile: CHAR_PROFILES[af.id] || '',
        vl: af.voiceLines || af.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[af.id]) || ['…！']
      },
      matchInfo: {
        header: `⚔ 対抗戦 第${idx + 1}試合`,
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
        rngSeed: Engine.rng.derive(G.rngSeed, G.season, 600 + G.week + idx),
      }
    };
    // ビッグマッチBGM（対抗戦）
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
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
    // Guard: ignore duplicate results
    if (wp.results[idx]) { document.getElementById('battleOverlay').style.display = 'none'; wp.currentWatching = -1; return; }
    const m = wp.card[idx];
    const playerWon = data.winner === 'left';
    const winnerFighter = playerWon ? m.playerFighter : m.aiFighter;
    wp.results[idx] = {
      playerFighter: m.playerFighter, aiFighter: m.aiFighter,
      winner: data.winner, mq: data.mq || 50,
      playerWon,
      finType: data.finType || '', finMove: data.finMove || '',
      turns: data.turns || 0,
      victoryLine: _getWarVictoryLine(winnerFighter),
      winnerName: winnerFighter.name, winnerId: winnerFighter.id
    };
    // ビッグマッチBGMフェードアウト
    try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
    // Hide iframe
    document.getElementById('battleOverlay').style.display = 'none';
    wp.currentWatching = -1;
    Audio.play('coin');
    renderWarMatchPreview();
    if (wp.results.every(r => r !== null)) {
      App.finalizeWar();
    } else {
      // まだ試合が残っている → 対抗戦BGMを再開
      setTimeout(() => { if (App._warPreview) { try { Audio.fileBgm.play('../bgm/MusMus-BGM-125.mp3', { loop: true, volume: 0.10 }); } catch(e) {} } }, 1600);
    }
  },

  // Finalize war: apply outcome to game state, show result
  finalizeWar() {
    const wp = App._warPreview;
    if (!wp) return;
    try { Audio.fileBgm.stop(); } catch(e) {}
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

    // 新聞用: 対抗戦結果を保存（次週の新聞生成で使用）
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

    // Phase 2: 対抗戦勝利選手のtrust bonus
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
      return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: ev.opponentName, won: matchResult ? matchResult.playerWon : false });
    }) };

    // AI側の対抗戦出場選手にもcareer event記録
    const aiOrgId = ev.opponentOrgId;
    if (G.aiOrgs && G.aiOrgs[aiOrgId]) {
      const aiWarIds = new Set(wp.card.map(m => m.aiFighter.id));
      const updatedAiRoster = G.aiOrgs[aiOrgId].roster.map(c => {
        if (!aiWarIds.has(c.id)) return c;
        const matchResult = wp.results.find(r => r.aiFighter.id === c.id);
        return Engine.career.addEvent(c, { type: 'war', season: G.season, week: G.week, opponentOrg: G.orgName || 'プレイヤー団体', won: matchResult ? !matchResult.playerWon : false });
      });
      G = { ...G, aiOrgs: { ...G.aiOrgs, [aiOrgId]: { ...G.aiOrgs[aiOrgId], roster: updatedAiRoster } } };
    }

    const evStats = { ...(G.seasonStats || {}) };
    if (eventWon) {
      evStats.eventsWon = (evStats.eventsWon || 0) + 1;
      // F2: Track war victories for negotiation bonus
      const wv = [...(G.warVictories || [])];
      if (!wv.includes(ev.opponentOrgId)) wv.push(ev.opponentOrgId);
      // 修正D: 対抗戦通算勝利を記録（レガシーpt計算用）
      const bwt = { ...(G.battleWinsTotal || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
      bwt.player = (bwt.player || 0) + 1;
      G = { ...G, warVictories: wv, battleWinsTotal: bwt };
      // 対抗戦マイルストーン: 5勝ごとに新聞記事+士気ブースト
      if (bwt.player % 5 === 0) {
        const mBoost = 3 + Math.min(2, Math.floor(bwt.player / 10)); // +3〜+5
        G = { ...G,
          _newsWarMilestone: { orgId: 'player', orgName: G.orgName || 'プレイヤー団体', wins: bwt.player },
          lockerRoomMorale: Math.min(100, (G.lockerRoomMorale || 60) + mBoost),
        };
      }
    }
    else {
      evStats.eventsLost = (evStats.eventsLost || 0) + 1;
      // 修正D: AI勝利側も記録
      const bwt = { ...(G.battleWinsTotal || { player: 0, org_s: 0, org_a: 0, org_b: 0 }) };
      bwt[ev.opponentOrgId] = (bwt[ev.opponentOrgId] || 0) + 1;
      G = { ...G, battleWinsTotal: bwt };
      // AI側の対抗戦マイルストーン: 5勝ごとに新聞記事
      if (bwt[ev.opponentOrgId] % 5 === 0) {
        G = { ...G,
          _newsWarMilestone: { orgId: ev.opponentOrgId, orgName: ev.opponentName, wins: bwt[ev.opponentOrgId] },
        };
      }
    }
    // 金銭バランス改善: 対抗戦メディア収入
    const warMediaIncomes = G._pendingMediaIncomes ? [...G._pendingMediaIncomes] : [];
    let warMediaTotal = 0;
    wp.results.forEach(r => {
      const venueIdx = G.showVenue || 0;
      const venueMult = VENUE_MEDIA_MULT[venueIdx] || 1.0;
      warMediaTotal += Math.round(r.mq * MEDIA_CONFIG.eventPerMQ * venueMult * 1.5);
    });
    // JT出演料: 出場選手の人気×出場試合数
    let jtMediaTotal = 0;
    wp.results.forEach(r => {
      if (r.playerFighter) {
        const rev = Math.round((r.playerFighter.popularity || 1) * MEDIA_CONFIG.jtPerPop);
        jtMediaTotal += rev;
        // メディア功労賞: 個人別メディア収入累計に加算
        G = { ...G, roster: G.roster.map(c =>
          c.id === r.playerFighter.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
        )};
      }
      // AI団体選手のメディア収入個人トラッキング（対抗戦出場）
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
      if (warMediaTotal > 0) warMediaIncomes.push({ amount: warMediaTotal, label: `対抗戦 vs ${ev.opponentName}` });
      if (jtMediaTotal > 0) warMediaIncomes.push({ amount: jtMediaTotal, label: '対抗戦出演料' });
      G = { ...G, _pendingMediaIncomes: warMediaIncomes };
    }

    G = { ...G, seasonStats: evStats, weekPhase: 'manage', lastShowResults: [], weeklyFinance: { income: 0, expense: 0, details: [] } };

    // recentMatches記録（対抗戦）
    let warRoster = [...G.roster];
    wp.results.forEach(r => {
      const winner = r.playerWon ? 'left' : 'right';
      warRoster = Engine.pushRecentMatch(warRoster, r.playerFighter.id, r.aiFighter.id, winner, G.season, G.week);
    });
    G = { ...G, roster: warRoster };

    // h2h記録: 対抗戦
    let warH2h = { ...(G.h2h || {}) };
    wp.results.forEach(r => {
      const winner = r.playerWon ? 'left' : 'right';
      warH2h = Engine.h2h.update(warH2h, r.playerFighter.id, r.aiFighter.id, winner, r.mq, false, false, G.season, G.week);
    });
    G = { ...G, h2h: warH2h };

    // Phase 4 E-01: 対抗戦の関係値反映 + applyMatchResult（isCrossOrg=true）
    if (G.relationships) {
      const warRelRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBE5A));
      let relState = { ...G };
      // 対戦した選手間: applyMatchResult で全イベント判定（他団体戦ブースト付き）
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
      // チームメイト間: bond +2~+4
      const participantIds = [...warFighterIds];
      if (participantIds.length >= 2) {
        relState = Engine.relationships.applyAllPairs(relState, participantIds,
          { min: 2, max: 4 }, { min: 0, max: 0 }, warRelRng);
      }
      G = { ...G, relationships: relState.relationships };
    }

    Storage.autoSave();

    // Swap content directly (no close→reopen gap that would flash event screen)
    renderWarFinalResult(ev, wp.results, playerWins, aiWins, eventWon);
    App._warPreview = null;
  }
};

// ══════════════════════════════════════════════
//  PPV GRAND FINAL: Show Day System (Step 4)
// ══════════════════════════════════════════════
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

  // カードが空の場合は即座にfinalize（スタック防止）
  if (ppvDay.card.length === 0) {
    console.warn('[WM Debug] PPV card is empty — entries:', JSON.stringify(G.ppvEntries ? Object.fromEntries(Object.entries(G.ppvEntries).map(([k,v]) => [k, (v||[]).length])) : 'null'));
    showEventPopup({
      type: 'system', tone: 'negative',
      message: 'カード編成不成立',
      detail: '出場可能な選手が不足しており、対戦カードを組めませんでした',
    });
    setTimeout(() => App.finalizePPV(), 1500);
    return;
  }

  // 代替通知ポップアップ
  if (ppvDay.substitutions.length > 0) {
    let popupChain = Promise.resolve();
    ppvDay.substitutions.forEach(sub => {
      const orgName = sub.orgId === 'player' ? (G.orgName || '自団体') : (RIVAL_ORGS.find(o => o.id === sub.orgId)?.name || sub.orgId);
      popupChain = popupChain.then(() => new Promise(resolve => {
        showEventPopup({
          type: 'fighter', id: sub.originalId, name: sub.original,
          tone: 'negative',
          message: `${sub.original}が出場不能！`,
          detail: `${orgName}の${sub.substitute}が緊急出場`,
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
      vl: match.left.voiceLines || match.left.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[match.left.id]) || ['…！']
    },
    right: {
      ...match.right, condition: 80,
      portraitUrl: getPortraitUrl(match.right.id), profile: CHAR_PROFILES[match.right.id] || '',
      vl: match.right.voiceLines || match.right.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[match.right.id]) || ['…！']
    },
    matchInfo: {
      header: match.isSummit ? '🏆 頂上決戦' : `PPV 第${matchNum}試合`,
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
      rngSeed: Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF3, idx, match.left.id),
    }
  };
  // ビッグマッチBGM（PPV）
  try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
  let sent = false;
  const sendOnce = () => { if (sent) return; sent = true; iframe.contentWindow.postMessage(msg, '*'); };
  iframe.onload = () => setTimeout(sendOnce, 200);
  const baseSrc = (iframe.getAttribute('src') || 'battle-engine.html').split('?')[0];
  iframe.src = baseSrc + '?t=' + Date.now();
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
  if (pp.results[idx]) { document.getElementById('battleOverlay').style.display = 'none'; pp.currentWatching = -1; return; }
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
    // まだ試合が残っている → PPV BGMを再開
    setTimeout(() => { if (App._ppvPreview) { try { Audio.fileBgm.play('../bgm/MusMus-BGM-052.mp3', { loop: true, volume: 0.12 }); } catch(e) {} } }, 1600);
  }
};

App.finalizePPV = function() {
  const pp = App._ppvPreview;
  if (!pp) return;
  if (pp.results.some(r => r === null)) return;

  // 結果反映
  const result = Engine.ppv.applyPPVResults(G, pp.card, pp.results, pp.summitPair);
  let s = result.state;
  // forcedRest（S3休養願い）フラグをクリア
  let roster = s.roster.map(c => c.forcedRest ? { ...c, forcedRest: false } : { ...c });
  const events = result.events;

  // Step 5-6: ブレークスルー判定 + careerBestMQ + スランプ + モチベ喪失
  const pendingGrowthEvents = [];
  const btRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF7));
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    [
      { fId: match.left.id, oppF: match.right, won: r.winner === 'left' },
      { fId: match.right.id, oppF: match.left, won: r.winner === 'right' },
    ].forEach(({ fId, oppF, won }) => {
      const fighter = roster.find(c => c.id === fId);
      if (!fighter) return; // プレイヤー所属でない
      const oppOvr = Engine.util.ov(oppF);
      const isRivalryResolution = !!r.rivalryResolved;

      // ブレークスルー判定
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
        // Phase 4 G-01: ブレークスルー → 関係値反映
        if (s.relationships) {
          const btRelRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE57, fId));
          s = Engine.relationships.applyBreakthroughEffect(s, fId, btRelRng);
        }
      }

      // careerBestMQ 更新
      const updatedFighter = roster.find(c => c.id === fId);
      if (r.mq > (updatedFighter.careerBestMQ || 0)) {
        roster = roster.map(c => c.id === fId ? { ...c, careerBestMQ: r.mq } : c);
      }

      // 敗北スランプ判定
      if (!won) {
        const slumpRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF8, fId));
        const slumpFighter = roster.find(c => c.id === fId);
        if (Engine.growthEvents.checkSlump(slumpRng, slumpFighter, 'defeat')) {
          const newF = Engine.growthEvents.applySlump(slumpFighter, 'defeat', s.season, s.week);
          roster = roster.map(c => c.id === fId ? newF : c);
          pendingGrowthEvents.push({ type: 'slump_start', fighterId: fId, trigger: 'defeat' });
          // Phase 4 G-03: スランプ → 関係値反映
          if (s.relationships) {
            const symRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE58, fId));
            s = Engine.relationships.applySympathyEffect(s, fId, { min: 1, max: 2 }, symRng);
            // N-05: スランプ八つ当たり
            const lashRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBE6E, fId));
            s = Engine.relationships.applySlumpLashout({ ...s, roster }, fId, lashRng);
          }
        }
      }

      // momentum更新 + モチベ喪失チェック
      const momRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBF9, fId));
      const momFighter = roster.find(c => c.id === fId);
      let updF = Engine.growthEvents.updateSlumpMomentumAfterMatch(momFighter, r.mq, won, momRng);
      updF = Engine.growthEvents.updateMotivationLossMomentumAfterMatch(updF, r.mq, won, momRng);
      if (!won && updF.slump) {
        const mlRng = Engine.rng.create(Engine.rng.derive(s.rngSeed, s.season, s.week, 0xBBFA, fId));
        if (Engine.growthEvents.checkMotivationLoss(mlRng, updF, 'defeat')) {
          updF = Engine.growthEvents.applyMotivationLoss(updF, s.season, s.week);
          pendingGrowthEvents.push({ type: 'motivation_loss_start', fighterId: fId });
          // Phase 4 G-06: モチベ喪失 → 関係値反映
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

  // 金銭バランス改善: PPVメディア収入（出演料）
  const ppvMediaIncomes = s._pendingMediaIncomes ? [...s._pendingMediaIncomes] : [];
  let ppvMediaTotal = 0;
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    // カード位置判定: summitならmain、最後から2番目ならsemi、それ以外は試合数で判定
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
        // メディア功労賞: 個人別メディア収入累計に加算
        s = { ...s, roster: s.roster.map(c =>
          c.id === f.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
        )};
      } else if (f._ppvOrgId && s.aiOrgs && s.aiOrgs[f._ppvOrgId]) {
        // AI団体選手のメディア収入個人トラッキング
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
    ppvMediaIncomes.push({ amount: ppvMediaTotal, label: 'PPV出演料' });
    s = { ...s, _pendingMediaIncomes: ppvMediaIncomes };
  }

  // 新聞用: 頂上決戦結果を保存（次週の新聞生成で使用）
  if (pp.summitPair) {
    const summitIdx = pp.card.findIndex(m => m.isSummit);
    if (summitIdx >= 0) {
      const sr = pp.results[summitIdx];
      const sm = pp.card[summitIdx];
      const playerF = sm.left._ppvOrgId === 'player' ? sm.left : sm.right._ppvOrgId === 'player' ? sm.right : sm.left;
      const aiF = playerF === sm.left ? sm.right : sm.left;
      const playerWon = (sr.winner === 'left' && playerF === sm.left) || (sr.winner === 'right' && playerF === sm.right);
      s._newsSummitResult = {
        opponentName: pp.summitPair.org1Id === 'player' ? (G.aiOrgs[pp.summitPair.org2Id]?.name || '相手団体') : (G.aiOrgs[pp.summitPair.org1Id]?.name || '相手団体'),
        playerName: playerF.name,
        playerId: playerF.id,
        aiName: aiF.name,
        aiId: aiF.id,
        won: playerWon,
        mq: sr.mq,
      };
    }
  }

  // recentMatches記録（PPV）
  let ppvRoster = [...(s.roster || G.roster)];
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    ppvRoster = Engine.pushRecentMatch(ppvRoster, match.left.id, match.right.id, r.winner, s.season, s.week);
  });
  s = { ...s, roster: ppvRoster };

  // h2h記録: PPV
  let ppvH2h = { ...(s.h2h || {}) };
  pp.results.forEach((r, idx) => {
    const match = pp.card[idx];
    ppvH2h = Engine.h2h.update(ppvH2h, match.left.id, match.right.id, r.winner, r.mq, false, true, s.season, s.week);
  });
  s = { ...s, h2h: ppvH2h };

  // シーズンstats更新
  const stats = { ...(G.seasonStats || {}) };
  stats.showCount = (stats.showCount || 0) + 1;
  pp.results.forEach(r => {
    if (r.mq > (stats.bestMQ || 0)) { stats.bestMQ = r.mq; stats.bestMQMatch = `${r.left?.name || '?'} vs ${r.right?.name || '?'}`; }
  });

  G = { ...G, ...s, seasonStats: stats, weekPhase: 'showExec', gameLog: [...G.gameLog, ...events] };

  // ポップアップ用データを保存
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

  // Step 5-6: ポップアップ用データ取得 + Gからクリア
  const pendingGrowthEventsShow = G._pendingGrowthEvents || [];
  if (G._pendingGrowthEvents) {
    const { _pendingGrowthEvents: _, ...cleanG } = G;
    G = cleanG;
  }
  const pendingResolutions = App._pendingRivalryResolutions || [];
  App._pendingRivalryResolutions = [];

  // tickWeek→settlement→week48完了
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
  App.checkMissionUpdate();
  App.checkSurvivalUpdate();
  // Step 5-6: バフ消費
  App._tickMilestoneBuffsShow();
  App._applyWeeklyBuffEffects();
  App._tickMilestoneBuffsWeekly();
  Storage.autoSave();

  // Step 5-6: ポップアップチェーン（逆順に組み立て: growth ← resolution）
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

  // P4-P6: PPV後のGlimpse表示
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

  // PPV参加済み→TV中継フェーズをスキップし直接オフシーズンへ
  G = { ...G, ppvPhase: null };
  Storage.autoSave();
  App.advanceWeek();
};

App.initPPVTV = function() {
  const tvRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xBBF5));
  const tvResult = Engine.ppv.simulateTVResults(G, tvRng);

  // battlePoints + orgWarRecord 反映
  G = { ...G, battlePoints: tvResult.battlePoints, orgWarRecord: tvResult.orgWarRecord || G.orgWarRecord, gameLog: [...G.gameLog, ...tvResult.events] };

  renderPPVTVResult(tvResult.card, tvResult.results, G.ppvName);
};

App.closePPVTV = function() {
  const overlay = document.getElementById('showResultOverlay');
  overlay.classList.remove('active');
  Audio.play('coin');

  // tickWeek: PPV TV観戦中でも週次処理（訓練・給与・関係値）は実行する
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
  App.checkMissionUpdate();
  App.checkSurvivalUpdate();
  App._applyWeeklyBuffEffects();
  App._tickMilestoneBuffsWeekly();

  // P4-P6: PPV TV後のGlimpse表示
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

  // ppvPhaseクリア→advanceWeek→オフシーズンへ
  G = { ...G, ppvPhase: null };
  Storage.autoSave();
  App.advanceWeek();
};

// ══════════════════════════════════════════════════════════
//  U-20 ジュニアトーナメント UI フロー
// ══════════════════════════════════════════════════════════
App._jtPreview = null; // トーナメント進行データ

App.initJuniorTournament = function() {
  const sel = G._juniorTournamentSelection;
  if (!sel || sel.cancelled) {
    // 不開催 → 通常週に戻す
    G = { ...G, weekPhase: 'manage' };
    delete G._juniorTournamentSelection;
    showScreen('week');
    return;
  }
  const jtRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB10));
  const jtResult = Engine.juniorTournament.run(G, sel.participants, jtRng);

  // 自団体の出場選手を抽出（レンタル選手は元所属団体枠で出場するため除外）
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

  // battle-engine iframe に試合データを送る（battleOverlay + battleIframe を使用）
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

  const roundLabel = round.name === 'final' ? '決勝' : round.name === 'semiFinal' ? '準決勝' : '準々決勝';
  const msg = {
    type: 'START_MATCH',
    left: {
      ...leftF, condition: 80,
      portraitUrl: getPortraitUrl(leftF.id), profile: CHAR_PROFILES[leftF.id] || '',
      vl: leftF.voiceLines || leftF.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[leftF.id]) || ['…！']
    },
    right: {
      ...rightF, condition: 80,
      portraitUrl: getPortraitUrl(rightF.id), profile: CHAR_PROFILES[rightF.id] || '',
      vl: rightF.voiceLines || rightF.vl || (typeof VICTORY_LINES !== 'undefined' && VICTORY_LINES[rightF.id]) || ['…！']
    },
    matchInfo: {
      header: `🏆 ジュニアトーナメント ${roundLabel}`,
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
  };
  // ビッグマッチBGM（決勝のみ）
  if (isFinal) {
    try { Audio.fileBgm.play('../bgm/iwashiro_elevate_perfect.ogg', { loop: true, volume: 0.12 }); } catch(e) {}
  }
  let sent = false;
  const sendOnce = () => {
    if (sent) return; sent = true;
    iframe.contentWindow.postMessage(msg, '*');
  };
  iframe.onload = () => setTimeout(sendOnce, 200);
  const baseSrc = (iframe.getAttribute('src') || 'battle-engine.html').split('?')[0];
  iframe.src = baseSrc + '?t=' + Date.now();
  setTimeout(sendOnce, 800);
};

App.jtSkipMatch = function(roundIdx, matchIdx) {
  // 試合結果画面を表示
  App._jtPreview.phase = 'matchResult';
  Audio.play('coin');
  renderJuniorTournamentMatchResult(roundIdx, matchIdx);
};

App.jtSkipAll = function() {
  // 全試合スキップ → 最終結果へ
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
  if (!jt || jt.phase !== 'watching') return;
  clearTimeout(App._escBtnTimer);
  const escBtn = document.getElementById('battleEscapeBtn');
  if (escBtn) { escBtn.style.opacity = '0'; escBtn.style.pointerEvents = 'none'; }
  // BGMフェードアウト（決勝時）
  try { Audio.fileBgm.fadeOut(1500); } catch(e) {}
  // iframeを閉じる
  document.getElementById('battleOverlay').style.display = 'none';

  // iframe結果でmatch dataを上書き（iframe独自シミュレーションの結果を正とする）
  const ri = jt.currentRound;
  const mi = jt.currentMatch;
  const match = jt.result.rounds[ri].matches[mi];
  const iframeWinner = data.winner || 'left';
  match.winner = iframeWinner;
  match.winnerId = data.winnerId != null ? data.winnerId : (iframeWinner === 'right' ? match.right.id : match.left.id);
  match.loserId = match.winnerId === match.left.id ? match.right.id : match.left.id;
  match.mq = data.mq || match.mq;
  match.turns = data.turns || match.turns;
  match.finType = data.finType || match.finType;
  match.finMove = data.finMove || match.finMove;
  // iframeは {current,max}、エンジンは {final,max} 形式
  if (data.hpLeft) match.hpLeft = { final: data.hpLeft.current != null ? data.hpLeft.current : data.hpLeft.final, max: data.hpLeft.max };
  if (data.hpRight) match.hpRight = { final: data.hpRight.current != null ? data.hpRight.current : data.hpRight.final, max: data.hpRight.max };
  if (data.log) match.log = data.log;

  // 後続ラウンドの再計算（勝者が変わった場合、次ラウンド以降の対戦カード・結果も更新）
  App._jtRecomputeSubsequentRounds(jt, ri);

  // 観戦後 → 試合結果画面を表示
  jt.phase = 'matchResult';
  Audio.play('coin');
  renderJuniorTournamentMatchResult(ri, mi);
};

// JT後続ラウンド再計算: 観戦した試合の結果が変わった場合に、以降のラウンドを再シミュレーション
App._jtRecomputeSubsequentRounds = function(jt, fromRoundIdx) {
  const rounds = jt.result.rounds;
  if (fromRoundIdx + 1 >= rounds.length) {
    // 最終ラウンドだった場合、champion/runnerUpだけ更新
    App._jtUpdateFinalResults(jt);
    return;
  }

  for (let ri = fromRoundIdx + 1; ri < rounds.length; ri++) {
    const prevRound = rounds[ri - 1];
    const winners = prevRound.matches.map(m => m.winnerId === m.left.id ? m.left : m.right);

    const newMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 >= winners.length) break;
      const left = winners[i];
      const right = winners[i + 1];

      // フル選手データを取得してシミュレーション
      const leftF = App._jtLookupFighter(left.id) || left;
      const rightF = App._jtLookupFighter(right.id) || right;
      const matchRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, 0xBB00 + ri * 10 + i));
      const isFinal = ri === rounds.length - 1;
      const matchTier = isFinal ? 2 : 1;
      const result = Engine.battle.simulateMatch(
        { ...leftF, condition: 80 }, { ...rightF, condition: 80 }, matchRng, matchTier
      );

      const winnerId = result.winner === 'right' ? right.id : left.id;
      const loserId = winnerId === left.id ? right.id : left.id;
      newMatches.push({
        left, right, winnerId, loserId,
        mq: result.mq, turns: result.turns,
        finType: result.finType || '', finMove: result.finMove || '',
        hpLeft: result.hpLeft, hpRight: result.hpRight,
        log: result.log || [], winner: result.winner,
      });
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
  // 旧互換: 直接ブラケットに戻る場合（内部用）
  App._jtAdvanceInternal(roundIdx, matchIdx);
};

App.jtAdvanceAfterResult = function(roundIdx, matchIdx) {
  // 試合結果画面から次へ進む
  // トーナメントBGMを再開（決勝観戦後のフェードアウトからの復帰）
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
    // 決勝後: BGMを止めてチャンピオンジングルを鳴らす
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

  // Engine.juniorTournament.apply で state 反映
  const applied = Engine.juniorTournament.apply(G, jt.result);
  G = { ...applied.state, gameLog: [...G.gameLog, ...applied.events] };

  // 金銭バランス改善: JTメディア収入（出演料）
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
          // メディア功労賞: 個人別メディア収入累計に加算
          G = { ...G, roster: G.roster.map(c =>
            c.id === f.id ? { ...c, mediaRevSeason: (c.mediaRevSeason || 0) + rev } : c
          )};
        } else {
          // AI団体選手のメディア収入個人トラッキング
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
    jtMediaIncomes.push({ amount: jtMediaTotal, label: 'JT出演料' });
    G = { ...G, _pendingMediaIncomes: jtMediaIncomes };
  }

  // 新聞を再生成（JT結果を反映させる）
  const newsRng = Engine.rng.create(Engine.rng.derive(G.rngSeed, G.season, G.week, 0xEE57));
  G = { ...G, weeklyNewspaper: Engine.newspaper.generate(G, newsRng) };

  // 自団体出場選手の感想チェーンを構築（レンタル選手は元所属団体枠で出場）
  const playerIds = new Set((G.roster || []).filter(f => !f.isRental).map(f => f.id));
  const { champion, runnerUp, semiFinalists, rounds } = jt.result;
  const allParticipants = rounds[0].matches.flatMap(m => [m.left, m.right]);
  const myParticipants = allParticipants.filter(p => playerIds.has(p.id));

  // 結果に応じたタイミングを判定
  const impressions = myParticipants.map(p => {
    let timing = 'postLose';
    if (champion && champion.id === p.id) timing = 'champion';
    else if (runnerUp && runnerUp.id === p.id) timing = 'postWin';
    else if (semiFinalists && semiFinalists.some(sf => sf && sf.id === p.id)) timing = 'postWin';
    // 準々決勝敗退は postLose
    return { ...p, _jtTiming: timing };
  });

  // transientクリア（_juniorTournamentResultはtickWeekで新聞が読むので残す）
  delete G._juniorTournamentSelection;
  App._jtPreview = null;

  // V6 summon で変更した box スタイルをリセット
  const box = document.getElementById('showResultBox');
  if (box) { box.style.maxWidth = ''; box.style.padding = ''; box.style.background = ''; box.style.border = ''; }

  try { Audio.fileBgm.stop(); } catch(e) {}
  Audio.play('coin');

  const finishUp = () => {
    Audio.bgm.play('management');
    G = { ...G, weekPhase: 'manage' };
    Storage.autoSave();
    showScreen('week');
    refreshAll();
  };

  // 感想チェーン表示（自団体選手がいる場合）
  if (impressions.length > 0) {
    // 結果オーバーレイを閉じる
    document.getElementById('showResultOverlay').classList.remove('active');
    setTimeout(() => {
      _showJTImpressionChain(impressions, 0, finishUp);
    }, 500);
  } else {
    finishUp();
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

// ── DEBUG: 業界底上げテスト用（テスト後削除予定） ──
window.debugWinLeague = function() {
  // エンディングは endingShown:true でスキップし、業界激震セレモニーだけ発火させる
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
  console.log('[debugWinLeague] 状態セット完了:');
  console.log('  offSeason:', G.offSeason, '/ offWeek:', G.offWeek, '/ weekPhase:', G.weekPhase);
  console.log('  endingCleared:', G.endingCleared, '/ leagueElevated:', G.leagueElevated);
  console.log('  endingShown: true (エンディングスキップ→業界激震のみ発火)');
  console.log('→ 「週を進める」を押すとシーズン終了→1位判定→業界底上げセレモニーが発火します');
};
// 業界激震セレモニーを直接テスト（週を進めずに即表示）
window.debugElevationDirect = function() {
  showLeagueElevationCeremony(G, () => { console.log('[debugElevationDirect] onDone called'); refreshAll(); });
};

// Alias for old UI calls
// COACH_MAX_ASSIGN already defined in data section
